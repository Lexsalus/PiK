-- =====================================================================
--  Migracja 010 — powiadomienia o zmianach w prawie, konta zakładane z CRM, limity zgłoszeń
--  1) Limit zgłoszeń ze strony: także po numerze telefonu (3/h) i ogólny (40 na 10 min) —
--     wcześniej zgłoszenia bez e-maila nie miały limitu.
--  2) Zmiany w prawie → powiadomienia w bazie dla członków zespołów otwartych spraw w kategoriach,
--     których dotyczy nowelizacja. Źródło: prawo/zmiany.json (codzienna synchronizacja z API Sejmu).
--     Automat: pg_cron + pg_net (pobranie pliku ze strony), ręcznie/zapasowo: CRM (Administrator).
--  3) Konta zakładane z CRM (funkcja serwera „konta”): wymuszenie zmiany hasła tymczasowego.
-- =====================================================================

-- 1) limity zgłoszeń
create index if not exists leads_phone_time on public.leads (right(regexp_replace(coalesce(phone,''),'\D','','g'),9), created_at) where phone is not null;
create or replace function app.lead_rate_limit() returns trigger language plpgsql security definer set search_path='' as $$
declare ph text := right(regexp_replace(coalesce(new.phone,''),'\D','','g'),9);
begin
  if new.email is not null and btrim(new.email)<>'' and
     (select count(*) from public.leads where lower(email)=lower(new.email) and created_at>now()-interval '1 hour')>=3 then
    raise exception 'Zbyt wiele zgłoszeń z tego adresu e-mail — spróbuj ponownie za godzinę' using errcode='P0001';
  end if;
  if length(ph)>=7 and
     (select count(*) from public.leads where right(regexp_replace(coalesce(phone,''),'\D','','g'),9)=ph and created_at>now()-interval '1 hour')>=3 then
    raise exception 'Zbyt wiele zgłoszeń z tego numeru telefonu — spróbuj ponownie za godzinę' using errcode='P0001';
  end if;
  if (select count(*) from public.leads where created_at>now()-interval '10 minutes')>=40 then
    raise exception 'Chwilowo zbyt wiele zgłoszeń — spróbuj ponownie za kilka minut' using errcode='P0001';
  end if;
  return new;
end $$;

-- 2) zmiany w prawie → powiadomienia
create table if not exists public.law_change_notices(
  akt text not null, eli text not null,
  title text, categories text[] not null default '{}',
  notified_users int not null default 0,
  created_at timestamptz not null default now(),
  primary key (akt, eli)
);
alter table public.law_change_notices enable row level security;
drop policy if exists r on public.law_change_notices;
create policy r on public.law_change_notices for select to authenticated using (app.session_ok());
revoke all on public.law_change_notices from anon;
grant select on public.law_change_notices to authenticated;

insert into public.notification_rules(event_type,label,default_recipients,extra_groups,locked,enabled) values
 ('law.change','Zmiana w ustawie dotyczącej spraw','członkowie zespołów otwartych spraw w kategoriach, których dotyczy nowelizacja','{}',false,true)
on conflict (event_type) do nothing;

/* p: zawartość prawo/zmiany.json ({"zmiany":[{akt,nazwa,kategorie,eli,tytul,wejscie,wykryto}, …]}).
   Każda para (ustawa, akt zmieniający) powiadamia tylko raz; tylko zmiany wykryte w ostatnich 14 dniach. */
create or replace function app.law_notify(p jsonb) returns int language plpgsql security definer set search_path='' as $$
declare z jsonb; cats text[]; u record; n int := 0; cnt int; r public.notification_rules;
begin
  select * into r from public.notification_rules where event_type='law.change';
  for z in select * from jsonb_array_elements(coalesce(p->'zmiany','[]'::jsonb)) loop
    continue when coalesce(z->>'akt','')='' or coalesce(z->>'eli','')='';
    continue when coalesce(nullif(z->>'wykryto',''),'1900-01-01')::date < current_date-14;
    continue when exists(select 1 from public.law_change_notices where akt=z->>'akt' and eli=z->>'eli');
    cats := array(select jsonb_array_elements_text(coalesce(z->'kategorie','[]'::jsonb)));
    cnt := 0;
    if r.event_type is null or r.enabled or r.locked then
      for u in select m.user_id, count(distinct c.id)::int sprawy
               from public.cases c join public.case_members m on m.case_id=c.id and m.revoked_at is null and (m.end_date is null or m.end_date>=current_date)
               join public.profiles pr on pr.id=m.user_id and pr.active
               where c.status='open' and c.category_code = any(cats)
               group by m.user_id loop
        insert into public.notifications(recipient_id,event_type,title,body,priority,dedupe_key,link)
        values (u.user_id,'law.change',
                left('Zmiana w prawie: '||coalesce(z->>'nazwa',z->>'akt'),300),
                left(coalesce(z->>'tytul','')||coalesce(' · wejście w życie '||to_char((z->>'wejscie')::date,'DD.MM.YYYY'),'')||' · dotyczy '||u.sprawy||' Twoich spraw',1000),
                'wazne','law:'||(z->>'akt')||':'||(z->>'eli')||':'||u.user_id,'#/prawo/zmiany')
        on conflict (dedupe_key) do nothing;
        cnt := cnt+1;
      end loop;
    end if;
    insert into public.law_change_notices(akt,eli,title,categories,notified_users) values (z->>'akt',z->>'eli',left(z->>'tytul',500),cats,cnt) on conflict do nothing;
    n := n+cnt;
  end loop;
  return n;
end $$;
/* ręcznie z CRM (Administrator) — ten sam plik, który CRM czyta ze strony */
create or replace function public.law_notify(p jsonb) returns int language plpgsql security definer set search_path='' as $$
declare n int;
begin
  if not app.is_admin() then raise exception 'Tylko Administrator' using errcode='42501'; end if;
  n := app.law_notify(p);
  if n>0 then perform app.audit('prawo.powiadomienia','zmiany w prawie',n||' powiadomień'); end if;
  return n;
end $$;
revoke all on function public.law_notify(jsonb) from public, anon;
grant execute on function public.law_notify(jsonb) to authenticated;

-- automat: pg_net pobiera plik ze strony, pg_cron przetwarza (jeśli rozszerzenia są dostępne)
create table if not exists private.law_fetch(id bigint primary key, at timestamptz not null default now());
create or replace function app.law_fetch() returns void language plpgsql security definer set search_path='' as $$
declare rid bigint;
begin
  execute $q$select net.http_get('https://lexsalus.github.io/PiK/prawo/zmiany.json?t='||extract(epoch from now())::bigint)$q$ into rid;
  insert into private.law_fetch(id) values (rid) on conflict do nothing;
end $$;
create or replace function app.law_process() returns int language plpgsql security definer set search_path='' as $$
declare rid bigint; body text; st int; n int := 0;
begin
  select id into rid from private.law_fetch order by at desc limit 1;
  if rid is null then return 0; end if;
  execute $q$select status_code, content from net._http_response where id=$1$q$ into st, body using rid;
  if st=200 and body is not null then n := app.law_notify(body::jsonb); end if;
  delete from private.law_fetch where at < now()-interval '7 days';
  return n;
end $$;
do $$ begin
  begin execute 'create extension if not exists pg_net'; exception when others then raise notice 'pg_net niedostępne: %', sqlerrm; end;
  if exists(select 1 from pg_extension where extname='pg_cron') and exists(select 1 from pg_extension where extname='pg_net') then
    execute $q$select cron.schedule('prawo-pobierz','40 5 * * *','select app.law_fetch()')$q$;
    execute $q$select cron.schedule('prawo-powiadom','50 5 * * *','select app.law_process()')$q$;
  end if;
exception when others then raise notice 'harmonogram prawa: %', sqlerrm; end $$;

-- 3) konta zakładane z CRM: hasło tymczasowe do zmiany przy pierwszym logowaniu
alter table public.profiles add column if not exists must_change_password boolean not null default false;
create or replace function public.password_changed() returns void language sql security definer set search_path='' as $$
  update public.profiles set must_change_password=false where id=(select auth.uid())
$$;
revoke all on function public.password_changed() from public, anon;
grant execute on function public.password_changed() to authenticated;
/* wywoływane przez funkcję serwera „konta” (klucz serwisowy) po utworzeniu konta */
create or replace function public.account_created(p_user uuid, p_by uuid, p_name text, p_role text, p_active boolean) returns void language plpgsql security definer set search_path='' as $$
begin
  if p_role not in ('admin','att','app','office','tech') then raise exception 'Nieznana rola'; end if;
  if not exists(select 1 from public.profiles where id=p_by and role='admin' and active) then raise exception 'Tylko Administrator' using errcode='42501'; end if;
  update public.profiles set full_name=coalesce(nullif(p_name,''),full_name), role=p_role, active=p_active, must_change_password=true where id=p_user;
  insert into public.audit_log(user_id,action,target,details) values (p_by,'konto.utworzenie',coalesce((select email from public.profiles where id=p_user),''),'rola: '||p_role||case when p_active then ', aktywne' else ', nieaktywne' end);
end $$;
revoke all on function public.account_created(uuid,uuid,text,text,boolean) from public, anon, authenticated;
do $$ begin execute 'grant execute on function public.account_created(uuid,uuid,text,text,boolean) to service_role'; exception when others then null; end $$;

grant execute on all functions in schema app to authenticated;
revoke all on all functions in schema app from public, anon;
select app.audit('system.migracja','010_prawo_konta_limity','limity zgłoszeń (telefon, ogólny), powiadomienia o zmianach w prawie, konta z CRM');
