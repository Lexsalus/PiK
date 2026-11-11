-- =====================================================================
--  Migracja 011 — pisma z szablonów: ustawienia kancelarii w bazie
--  office_settings: dane kancelarii do pism ('kancelaria') i własne szablony pism ('pisma').
--  Czyta zespół kancelarii (zalogowany, sesja ważna), zmienia tylko Administrator
--  przez funkcję office_setting_save (wpis w audycie). Szablony to know-how kancelarii —
--  nie trafiają do publicznych treści strony.
-- =====================================================================
create table if not exists public.office_settings(
  key text primary key check (key ~ '^[a-z_]{1,40}$'),
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id)
);
alter table public.office_settings enable row level security;
drop policy if exists r on public.office_settings;
create policy r on public.office_settings for select to authenticated using (app.session_ok());
revoke all on public.office_settings from anon, authenticated;
grant select on public.office_settings to authenticated;

create or replace function public.office_setting_save(p_key text, p_value jsonb) returns void language plpgsql security definer set search_path='' as $$
begin
  if not app.is_admin() then raise exception 'Tylko Administrator' using errcode='42501'; end if;
  if p_key not in ('kancelaria','pisma') then raise exception 'Nieznane ustawienie'; end if;
  if (p_key='pisma' and jsonb_typeof(p_value)<>'array') or (p_key='kancelaria' and jsonb_typeof(p_value)<>'object') then raise exception 'Zły format'; end if;
  if octet_length(p_value::text) > 300000 then raise exception 'Za duże (limit 300 kB)'; end if;
  insert into public.office_settings(key,value,updated_at,updated_by) values (p_key,p_value,now(),(select auth.uid()))
  on conflict (key) do update set value=excluded.value, updated_at=now(), updated_by=(select auth.uid());
  perform app.audit('konfiguracja.'||p_key, p_key, case when p_key='pisma' then jsonb_array_length(coalesce(p_value,'[]'::jsonb))||' szablonów' else 'dane kancelarii do pism' end);
end $$;
revoke all on function public.office_setting_save(text,jsonb) from public, anon;
grant execute on function public.office_setting_save(text,jsonb) to authenticated;

select app.audit('system.migracja','011_pisma','ustawienia kancelarii i szablony pism');
