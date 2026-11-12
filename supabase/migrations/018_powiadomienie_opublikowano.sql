-- =====================================================================
--  Migracja 018 — powiadomienie „Opublikowano: …” dla pozostałych Administratorów
--  Wysyłane razem z logiem zmian publikacji (log_event 'publikacja.zmiany'): kto opublikował i co się zmieniło.
-- =====================================================================
insert into public.notification_rules(event_type,label,default_recipients,extra_groups,locked,enabled) values
 ('publish.done','Opublikowano zmiany (Treści strony, Dotacje)','pozostali Administratorzy','{}',false,true)
on conflict (event_type) do nothing;

create or replace function public.log_event(p_action text, p_target text, p_details text default '') returns void
language plpgsql security definer set search_path='' as $$
declare r record; nm text; lbl text;
begin
  if not app.session_ok() then raise exception 'Brak aktywnej sesji' using errcode='42501'; end if;
  if p_action not in ('eksport.raport','eksport.ics','dokument.pobranie','logowanie','wylogowanie','logowanie.2fa_konfiguracja','publikacja.zmiany','pismo.wygenerowanie') then
    raise exception 'Niedozwolony typ zdarzenia' using errcode='42501'; end if;
  if p_action='publikacja.zmiany' and not app.is_admin() then raise exception 'Tylko Administrator' using errcode='42501'; end if;
  perform app.audit(p_action, left(coalesce(p_target,''),200), left(coalesce(p_details,''),2000));
  if p_action='publikacja.zmiany' and not exists(select 1 from public.notification_rules where event_type='publish.done' and not enabled and not locked) then
    select coalesce(nullif(full_name,''),email) into nm from public.profiles where id=auth.uid();
    lbl := case when p_target='serwis dotacji' then 'Dotacje' else 'Treści strony' end;
    for r in select id from public.profiles where role='admin' and active and id<>auth.uid() loop
      insert into public.notifications(recipient_id,event_type,title,body,priority,dedupe_key,link)
      values (r.id,'publish.done','Opublikowano: '||lbl,left('Opublikował(a): '||nm||E'\n'||coalesce(p_details,''),1000),'normalne',
              'pubdone:'||gen_random_uuid(),'#/logi/publikacje');
    end loop;
  end if;
end $$;
revoke all on function public.log_event(text,text,text) from public, anon;
grant execute on function public.log_event(text,text,text) to authenticated;
select app.audit('system.migracja','018_powiadomienie_opublikowano','powiadomienie o publikacji dla pozostałych Administratorów');
