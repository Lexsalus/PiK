-- =====================================================================
--  Migracja 015 — powiadomienie „Do opublikowania” także gdy treści nie były jeszcze publikowane do bazy
--  publish_notice(p_what, p_pending, p_note): p_note zastępuje „Zmiany wprowadził(a): …” (np. „treści z pliku
--  repozytorium — opublikuj, by zapisać je w bazie”). Bez p_note — jak dotąd, z nazwą osoby.
-- =====================================================================
create or replace function public.publish_notice(p_what text, p_pending boolean, p_note text) returns void language plpgsql security definer set search_path='' as $$
declare r record; nm text; lbl text; bd text;
begin
  if not app.is_admin() then return; end if;
  if p_what not in ('strona','dotacje') then raise exception 'Nieznane miejsce publikacji'; end if;
  lbl := case p_what when 'strona' then 'Treści strony' else 'Dotacje' end;
  if p_pending then
    if exists(select 1 from public.notification_rules where event_type='publish.pending' and not enabled and not locked) then return; end if;
    select coalesce(nullif(full_name,''),email) into nm from public.profiles where id=auth.uid();
    for r in select id from public.profiles where role='admin' and active loop
      bd := coalesce(nullif(btrim(p_note),''), 'Zmiany wprowadził(a): '||nm||case when r.id<>auth.uid() then ' — szkic jest w przeglądarce tej osoby' else '' end);
      insert into public.notifications(recipient_id,event_type,title,body,priority,dedupe_key,link)
      values (r.id,'publish.pending','Do opublikowania: '||lbl,left(bd,500),'normalne',
              'pub:'||p_what||':'||case when nullif(btrim(p_note),'') is null then 'z' else 'p' end||':'||auth.uid()||':'||r.id||':'||to_char(current_date,'YYYYMMDD'),'#/'||p_what||case when p_what='strona' then '/export' else '/publikacja' end)
      on conflict (dedupe_key) do nothing;
    end loop;
  else
    update public.notifications set read_at=now() where event_type='publish.pending' and read_at is null and dedupe_key like 'pub:'||p_what||':%';
  end if;
end $$;
create or replace function public.publish_notice(p_what text, p_pending boolean) returns void language sql security definer set search_path='' as $$
  select public.publish_notice(p_what,p_pending,null)
$$;
revoke all on function public.publish_notice(text,boolean,text) from public, anon;
grant execute on function public.publish_notice(text,boolean,text) to authenticated;
select app.audit('system.migracja','015_powiadomienie_publikacja','powiadomienie o publikacji z opisem');
