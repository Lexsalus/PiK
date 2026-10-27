-- =====================================================================
--  Migracja 008 — poprawki po audycie bezpieczeństwa i zużycia (27.10.2026)
--  1) Formularz „Co mi się należy”: najwyżej 3 zgłoszenia z jednego adresu
--     e-mail na godzinę (ochrona przed zalewaniem bazy zgłoszeniami).
--  2) Porządki: przeczytane powiadomienia starsze niż 90 dni usuwane co noc.
--  3) Uwagi doradców Supabase:
--     • stała search_path w 3 funkcjach,
--     • reguły RLS liczą auth.uid() raz na zapytanie, nie dla każdego wiersza,
--     • jedna reguła odczytu na tabelę (reguły zapisu rozdzielone na
--       dodawanie / zmianę / usuwanie — uprawnienia bez zmian),
--     • indeksy na kluczach obcych.
-- =====================================================================

-- 1) limit zgłoszeń z jednego adresu e-mail
create index if not exists leads_email_time on public.leads (lower(email), created_at) where email is not null;
create or replace function app.lead_rate_limit() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.email is not null and btrim(new.email)<>'' and
     (select count(*) from public.leads where lower(email)=lower(new.email) and created_at>now()-interval '1 hour')>=3 then
    raise exception 'Zbyt wiele zgłoszeń z tego adresu e-mail — spróbuj ponownie za godzinę' using errcode='P0001';
  end if;
  return new;
end $$;
drop trigger if exists lead_rate_limit on public.leads;
create trigger lead_rate_limit before insert on public.leads for each row execute function app.lead_rate_limit();

-- 2) porządki w powiadomieniach (pg_cron)
do $$ begin
  if to_regclass('cron.job') is not null then
    execute $q$select cron.unschedule(jobid) from cron.job where jobname='powiadomienia-porzadki'$q$;
    execute $q$select cron.schedule('powiadomienia-porzadki','23 3 * * *','delete from public.notifications where read_at is not null and read_at < now() - interval ''90 days''')$q$;
  end if;
end $$;

-- 3a) stała search_path
alter function app.audit_readonly() set search_path='';
alter function app.member_guard() set search_path='';
alter function app.path_case(text) set search_path='';

-- 3b) auth.uid() liczone raz na zapytanie: (select auth.uid())
do $$
declare p record; q text; c text; sql text;
begin
  for p in select schemaname, tablename, policyname, qual, with_check from pg_policies
           where schemaname='public' and (coalesce(qual,'') ~ 'auth\.uid\(\)' or coalesce(with_check,'') ~ 'auth\.uid\(\)') loop
    q:=regexp_replace(p.qual,'(?<!SELECT )auth\.uid\(\)','(SELECT auth.uid())','g');
    c:=regexp_replace(p.with_check,'(?<!SELECT )auth\.uid\(\)','(SELECT auth.uid())','g');
    if q is distinct from p.qual or c is distinct from p.with_check then
      sql:=format('alter policy %I on %I.%I',p.policyname,p.schemaname,p.tablename);
      if q is not null then sql:=sql||' using ('||q||')'; end if;
      if c is not null then sql:=sql||' with check ('||c||')'; end if;
      execute sql;
    end if;
  end loop;
end $$;

-- 3c) jedna reguła odczytu na tabelę: „w” (for all) → osobne reguły zapisu
do $$
declare t text; e text;
begin
  for t, e in values ('role_permissions','app.is_admin()'),('currencies','app.is_admin()'),('process_template_stages','app.is_admin()'),
                     ('holidays','app.is_admin()'),('user_substitutes','app.is_admin()'),('permission_overrides','app.perm(''users'')=2') loop
    if exists(select 1 from pg_policies where schemaname='public' and tablename=t and policyname='w') then
      execute format('drop policy w on public.%I',t);
      execute format('create policy wi on public.%I for insert to authenticated with check (%s)',t,e);
      execute format('create policy wu on public.%I for update to authenticated using (%s) with check (%s)',t,e,e);
      execute format('create policy wd on public.%I for delete to authenticated using (%s)',t,e);
    end if;
  end loop;
end $$;
-- odczyt nadań uprawnień: dotąd osoby z pełnym uprawnieniem „users” widziały je przez regułę zapisu — teraz wprost w regule odczytu
drop policy if exists r on public.permission_overrides;
create policy r on public.permission_overrides for select to authenticated using (app.is_admin() or app.perm('users')=2 or user_id=(select auth.uid()));

-- 3d) indeksy na kluczach obcych (tylko tam, gdzie żaden indeks nie zaczyna się od tych kolumn)
do $$
declare f record; cols text; nm text;
begin
  for f in
    select c.conrelid, c.conrelid::regclass::text tbl, c.conkey,
           (select string_agg(quote_ident(a.attname),',' order by k.ord) from unnest(c.conkey) with ordinality k(attnum,ord)
              join pg_attribute a on a.attrelid=c.conrelid and a.attnum=k.attnum) cols,
           (select string_agg(a.attname,'_' order by k.ord) from unnest(c.conkey) with ordinality k(attnum,ord)
              join pg_attribute a on a.attrelid=c.conrelid and a.attnum=k.attnum) colnames
    from pg_constraint c join pg_namespace n on n.oid=(select relnamespace from pg_class where oid=c.conrelid)
    where c.contype='f' and n.nspname='public'
  loop
    if not exists(select 1 from pg_index i where i.indrelid=f.conrelid
                  and (string_to_array(i.indkey::text,' '))[1:array_length(f.conkey,1)]=(select array_agg(x::text) from unnest(f.conkey) x)) then
      nm:=left('fk_'||replace(f.tbl,'public.','')||'_'||f.colnames,63);
      execute format('create index if not exists %I on %s (%s)',nm,f.tbl,f.cols);
    end if;
  end loop;
end $$;

select app.audit('system.migracja','008_audyt_bezpieczenstwa','limit zgłoszeń z e-maila, porządki powiadomień, uwagi doradców Supabase');
