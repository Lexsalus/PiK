-- =====================================================================
--  Migracja 013 — przełącznik 2FA (awaryjny, tymczasowy)
--  private.flags: 'mfa' = true (domyślnie, 2FA wymagane) / false (wyłączone).
--  Gdy wyłączone: sesja bez kodu z aplikacji (aal1) jest ważna także dla Administratora,
--  Pełnomocnika i IT; ponowne potwierdzenie przy zmianie uprawnień Administratora — samo hasło.
--  Włączenie / wyłączenie: Administrator w CRM (Ustawienia → System) albo SQL; wpis w audycie.
-- =====================================================================
create table if not exists private.flags(key text primary key, value jsonb not null, updated_at timestamptz not null default now());

create or replace function app.mfa_on() returns boolean language sql stable security definer set search_path='' as $$
  select coalesce((select (value)::text<>'false' from private.flags where key='mfa'), true)
$$;

create or replace function app.session_ok() returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.profiles p where p.id=auth.uid() and p.active
    and (p.role not in ('admin','att','tech') or coalesce(auth.jwt()->>'aal','aal1')='aal2' or not app.mfa_on()))
$$;

create or replace function app.fresh_reauth() returns boolean language sql stable security definer set search_path='' as $$
  select (not app.mfa_on() or (coalesce(auth.jwt()->>'aal','')='aal2'
     and exists(select 1 from jsonb_array_elements(coalesce(auth.jwt()->'amr','[]')) x where x->>'method'='totp' and (x->>'timestamp')::bigint >= extract(epoch from now())::bigint-300)))
     and exists(select 1 from jsonb_array_elements(coalesce(auth.jwt()->'amr','[]')) x where x->>'method'='password' and (x->>'timestamp')::bigint >= extract(epoch from now())::bigint-300)
$$;

/* CRM pyta po zalogowaniu hasłem (sesja aal1), czy wymagać kodu z aplikacji */
create or replace function public.mfa_required() returns boolean language sql stable security definer set search_path='' as $$ select app.mfa_on() $$;
revoke all on function public.mfa_required() from public, anon;
grant execute on function public.mfa_required() to authenticated;

create or replace function public.mfa_set(p_on boolean) returns void language plpgsql security definer set search_path='' as $$
begin
  if not app.is_admin() then raise exception 'Tylko Administrator' using errcode='42501'; end if;
  insert into private.flags(key,value,updated_at) values('mfa',to_jsonb(p_on),now()) on conflict(key) do update set value=excluded.value, updated_at=now();
  perform app.audit(case when p_on then 'bezpieczenstwo.2fa_wlaczone' else 'bezpieczenstwo.2fa_wylaczone' end,'2FA',case when p_on then 'wymagane ponownie' else 'tymczasowo wyłączone' end);
end $$;
revoke all on function public.mfa_set(boolean) from public, anon;
grant execute on function public.mfa_set(boolean) to authenticated;

grant execute on all functions in schema app to authenticated;
revoke all on all functions in schema app from public, anon;
select app.audit('system.migracja','013_przelacznik_2fa','przełącznik 2FA (domyślnie włączone)');
