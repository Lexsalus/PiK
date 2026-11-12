-- =====================================================================
--  Migracja 017 — powiadomienie „Do opublikowania” raz na cykl publikacji (zamiast raz dziennie):
--  po każdej publikacji kolejna zmiana daje nowe powiadomienie. Klucz = data ostatniej publikacji danego miejsca.
-- =====================================================================
create or replace function public.publish_notice(p_what text, p_pending boolean, p_note text) returns void language plpgsql security definer set search_path='' as $$
declare r record; nm text; lbl text; bd text; cyc text;
begin
  if not app.is_admin() then return; end if;
  if p_what not in ('strona','dotacje') then raise exception 'Nieznane miejsce publikacji'; end if;
  lbl := case p_what when 'strona' then 'Treści strony' else 'Dotacje' end;
  if p_pending then
    if exists(select 1 from public.notification_rules where event_type='publish.pending' and not enabled and not locked) then return; end if;
    cyc := coalesce(to_char(case p_what when 'strona' then (select published_at from public.site_content where id=1)
                                        else (select published_at from public.grants_content where id=1) end,'YYYYMMDDHH24MISS'),'0');
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
select app.audit('system.migracja','017_powiadomienie_cykl','powiadomienie o publikacji raz na cykl publikacji');
