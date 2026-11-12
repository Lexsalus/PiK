-- =====================================================================
--  Migracja 016 — logi publikacji: CRM zapisuje do audytu, co się zmieniło przy publikacji
--  (Treści strony, Dotacje) — zdarzenie „publikacja.zmiany” obok „strona.publikacja” / „dotacje.publikacja”.
-- =====================================================================
create or replace function public.log_event(p_action text, p_target text, p_details text default '') returns void
language plpgsql security definer set search_path='' as $$
begin
  if not app.session_ok() then raise exception 'Brak aktywnej sesji' using errcode='42501'; end if;
  if p_action not in ('eksport.raport','eksport.ics','dokument.pobranie','logowanie','wylogowanie','logowanie.2fa_konfiguracja','publikacja.zmiany','pismo.wygenerowanie') then
    raise exception 'Niedozwolony typ zdarzenia' using errcode='42501'; end if;
  if p_action='publikacja.zmiany' and not app.is_admin() then raise exception 'Tylko Administrator' using errcode='42501'; end if;
  perform app.audit(p_action, left(coalesce(p_target,''),200), left(coalesce(p_details,''),2000));
end $$;
revoke all on function public.log_event(text,text,text) from public, anon;
grant execute on function public.log_event(text,text,text) to authenticated;
select app.audit('system.migracja','016_log_publikacji','logi zmian przy publikacji');
