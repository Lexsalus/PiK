-- =====================================================================
--  Migracja 019 — automat powiadomień o zmianach w prawie odporny na złą odpowiedź
--  10.11.2026 zadanie prawo-powiadom zakończyło się błędem: strona zwróciła HTML zamiast JSON
--  (plik jeszcze nie istniał / chwilowy błąd GitHub Pages). Teraz taka odpowiedź jest pomijana i zapisywana w audycie.
--  Przy okazji: klucz cyklu powiadomień o publikacji z mikrosekundami.
-- =====================================================================
create or replace function app.law_process() returns int language plpgsql security definer set search_path='' as $$
declare rid bigint; body text; st int; n int := 0; j jsonb;
begin
  select id into rid from private.law_fetch order by at desc limit 1;
  if rid is null then return 0; end if;
  execute $q$select status_code, content from net._http_response where id=$1$q$ into st, body using rid;
  if st=200 and body is not null then
    begin
      j := body::jsonb;
    exception when others then
      perform app.audit('prawo.blad','zmiany.json','odpowiedź nie jest JSON (HTTP '||st||') — pominięto');
      j := null;
    end;
    if j is not null then n := app.law_notify(j); end if;
  elsif st is not null then
    perform app.audit('prawo.blad','zmiany.json','HTTP '||st||' — pominięto');
  end if;
  delete from private.law_fetch where at < now()-interval '7 days';
  return n;
end $$;
-- powiadomienie „Do opublikowania”: cykl liczony z dokładnością do mikrosekund (dwie publikacje w tej samej sekundzie)
create or replace function public.publish_notice(p_what text, p_pending boolean, p_note text) returns void language plpgsql security definer set search_path='' as $$
declare r record; nm text; lbl text; bd text; cyc text;
begin
  if not app.is_admin() then return; end if;
  if p_what not in ('strona','dotacje') then raise exception 'Nieznane miejsce publikacji'; end if;
  lbl := case p_what when 'strona' then 'Treści strony' else 'Dotacje' end;
  if p_pending then
    if exists(select 1 from public.notification_rules where event_type='publish.pending' and not enabled and not locked) then return; end if;
    cyc := coalesce(to_char(case p_what when 'strona' then (select published_at from public.site_content where id=1)
                                        else (select published_at from public.grants_content where id=1) end,'YYYYMMDDHH24MISSUS'),'0');
    select coalesce(nullif(full_name,''),email) into nm from public.profiles where id=auth.uid();
    for r in select id from public.profiles where role='admin' and active loop
      bd := coalesce(nullif(btrim(p_note),''), 'Zmiany wprowadził(a): '||nm||case when r.id<>auth.uid() then ' — szkic jest w przeglądarce tej osoby' else '' end);
      insert into public.notifications(recipient_id,event_type,title,body,priority,dedupe_key,link)
      values (r.id,'publish.pending','Do opublikowania: '||lbl,left(bd,500),'normalne',
              'pub:'||p_what||':'||case when nullif(btrim(p_note),'') is null then 'z' else 'p' end||':'||auth.uid()||':'||r.id||':'||cyc,
              '#/'||p_what||case when p_what='strona' then '/export' else '/publikacja' end)
      on conflict (dedupe_key) do nothing;
    end loop;
  else
    update public.notifications set read_at=now() where event_type='publish.pending' and read_at is null and dedupe_key like 'pub:'||p_what||':%';
  end if;
end $$;

grant execute on all functions in schema app to authenticated;
revoke all on all functions in schema app from public, anon;
select app.audit('system.migracja','019_prawo_odpornosc','automat zmian w prawie odporny na odpowiedź spoza JSON');
