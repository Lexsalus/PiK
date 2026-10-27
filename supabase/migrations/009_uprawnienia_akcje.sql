-- =====================================================================
--  Migracja 009 — uprawnienia: podgląd i zmiana osobno (§9, wariant pośredni)
--  Każde uprawnienie ma teraz akcję: 'view' (podgląd) albo 'change' (zmiana:
--  dodawanie i edycja). Akcję 'change' mają na razie:
--    client     — edycja danych klienta,
--    documents  — dodawanie dokumentów i nowych wersji,
--    entries    — dodawanie i edycja notatek / czynności, wnioski o korektę,
--    deadlines  — dodawanie terminów, zmiana daty, potwierdzenie, zamknięcie,
--    new_cases  — obsługa zgłoszeń ze strony.
--  Usuwanie i zatwierdzanie zostają jak były (osobne uprawnienie „delete”
--  i znacznik „może zatwierdzać” w zespole sprawy).
--  Model (uprawnienie × akcja) jest przygotowany pod pełną macierz akcji —
--  kolejne akcje (create / edit / approve / delete) dojdą w tej samej kolumnie.
--  Skutek dla obecnych kont: bez zmian — „zmiana” dostaje ten sam poziom co
--  dotychczasowe uprawnienie.
-- =====================================================================

-- 1) kolumna akcji + klucze główne
alter table public.role_permissions add column if not exists action text not null default 'view' check (action in ('view','change'));
alter table public.permission_overrides add column if not exists action text not null default 'view' check (action in ('view','change'));
alter table public.role_permissions drop constraint if exists role_permissions_pkey;
alter table public.role_permissions add primary key (role,perm,action);
alter table public.permission_overrides drop constraint if exists permission_overrides_pkey;
alter table public.permission_overrides add primary key (user_id,perm,action);

-- 2) „zmiana” = dotychczasowy poziom (bez zmian w dostępie); kopiowanie nadań bez powiadomień „zmieniono uprawnienia”
insert into public.role_permissions(role,perm,level,action)
  select role,perm,level,'change' from public.role_permissions
  where action='view' and perm in ('client','documents','entries','deadlines','new_cases')
on conflict do nothing;
alter table public.permission_overrides disable trigger override_audit;
insert into public.permission_overrides(user_id,perm,level,valid_until,reason,granted_by,granted_at,action)
  select user_id,perm,level,valid_until,reason,granted_by,granted_at,'change' from public.permission_overrides
  where action='view' and perm in ('client','documents','entries','deadlines','new_cases')
on conflict do nothing;
alter table public.permission_overrides enable trigger override_audit;

-- 3) funkcje uprawnień
create or replace function app.perm_a(p text, a text) returns int language sql stable security definer set search_path='' as $$
  select case when not app.session_ok() then 0 else coalesce(
    (select level from public.permission_overrides o where o.user_id=auth.uid() and o.perm=p and o.action=a and (o.valid_until is null or o.valid_until>=current_date)),
    (select level from public.role_permissions r join public.profiles u on u.role=r.role where u.id=auth.uid() and r.perm=p and r.action=a),0) end
$$;
create or replace function app.perm(p text) returns int language sql stable security definer set search_path='' as $$
  select app.perm_a(p,'view')
$$;
create or replace function app.user_perm(uid uuid, p text) returns int language sql stable security definer set search_path='' as $$
  select case when not exists(select 1 from public.profiles where id=uid and active) then 0 else coalesce(
    (select level from public.permission_overrides o where o.user_id=uid and o.perm=p and o.action='view' and (o.valid_until is null or o.valid_until>=current_date)),
    (select level from public.role_permissions r join public.profiles u on u.role=r.role where u.id=uid and r.perm=p and r.action='view'),0) end
$$;
create or replace function app.case_flag(cid uuid, flag text) returns boolean language sql stable security definer set search_path='' as $$
  select case when not app.session_ok() then false when app.is_admin() then true else coalesce((
    select case flag
      when 'documents'        then m.access_documents and app.perm('documents')>0
      when 'documents_change' then m.access_documents and app.perm_a('documents','change')>0
      when 'actions'          then m.access_actions and app.perm('entries')>0
      when 'actions_change'   then m.access_actions and app.perm_a('entries','change')>0
      when 'finance'          then m.access_finance
      when 'approve'          then m.can_approve
      when 'lead'             then m.role='lead' end
    from public.case_members m where m.case_id=cid and m.user_id=(select auth.uid()) and m.revoked_at is null and (m.end_date is null or m.end_date>=current_date) limit 1),false) end
$$;
revoke all on function app.perm_a(text,text) from public, anon;
grant execute on function app.perm_a(text,text) to authenticated;

create or replace function app.override_audit() returns trigger language plpgsql security definer set search_path='' as $$
declare lbl text;
begin
  if tg_op='DELETE' then
    perform app.audit('uprawnienia.zmiana',(select full_name from public.profiles where id=old.user_id),old.perm||case when old.action='change' then ' (zmiana)' else '' end||': wg roli'); return old; end if;
  lbl:=new.perm||case when new.action='change' then ' (zmiana)' else '' end;
  perform app.audit('uprawnienia.zmiana',(select full_name from public.profiles where id=new.user_id),lbl||' → '||new.level||coalesce(' do '||new.valid_until,' bezterminowo')||' · '||new.reason);
  perform app.notify(new.user_id,'perm.change',null,'Zmieniono Twoje uprawnienia',lbl);
  return new;
end $$;

-- 4) reguły zapisu: wymagają akcji „zmiana”
do $$
declare p record; q text; c text; sql text;
begin
  for p in select schemaname, tablename, policyname, qual, with_check from pg_policies
           where cmd<>'SELECT' and ((schemaname='public' and tablename in ('case_entries','correction_requests','documents','document_versions'))
                                 or (schemaname='storage' and tablename='objects' and policyname='akta_insert')) loop
    q:=replace(replace(p.qual,'''actions''::text','''actions_change''::text'),'''documents''::text','''documents_change''::text');
    c:=replace(replace(p.with_check,'''actions''::text','''actions_change''::text'),'''documents''::text','''documents_change''::text');
    if q is distinct from p.qual or c is distinct from p.with_check then
      sql:=format('alter policy %I on %I.%I',p.policyname,p.schemaname,p.tablename);
      if q is not null then sql:=sql||' using ('||q||')'; end if;
      if c is not null then sql:=sql||' with check ('||c||')'; end if;
      execute sql;
    end if;
  end loop;
end $$;
drop policy if exists u on public.clients;
create policy u on public.clients for update to authenticated using (
  (app.is_admin() or ((app.my_role()='office' or exists(select 1 from public.cases c where c.client_id=clients.id and app.case_flag(c.id,'lead'))) and app.perm_a('client','change')>0))
  and exists(select 1 from public.cases c where c.client_id=clients.id and app.can_case(c.id)));
drop policy if exists i on public.deadlines;
create policy i on public.deadlines for insert to authenticated with check (app.can_case(case_id) and app.perm_a('deadlines','change')>0);
drop policy if exists u on public.deadlines;
create policy u on public.deadlines for update to authenticated using (app.is_admin() or (app.can_case(case_id)
  and ((select auth.uid())=responsible_user_id or (select auth.uid())=second_controller_id) and app.perm_a('deadlines','change')>0));
drop policy if exists u on public.leads;
create policy u on public.leads for update to authenticated using (app.perm_a('new_cases','change')>0) with check (app.perm_a('new_cases','change')>0);

select app.audit('system.migracja','009_uprawnienia_akcje','uprawnienia: podgląd i zmiana osobno (dane klienta, dokumenty, czynności, terminy, zgłoszenia)');
