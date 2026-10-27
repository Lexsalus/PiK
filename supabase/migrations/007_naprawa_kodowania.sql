-- =====================================================================
--  Migracja 007 — naprawa polskich znaków po wdrożeniu 004 i 005 (27.10.2026).
--  Przy tamtym wdrożeniu treść SQL została wysłana w złym kodowaniu i polskie
--  litery w funkcjach i etykietach zamieniły się na zbliżone znaki
--  (np. „Zakonczenie”). Skutek nie tylko kosmetyczny: porównanie
--  sf_status='spełniony' w app.fee_event przestało pasować, więc powiadomienie
--  o naliczeniu success fee nie powstawało.
--  Ta migracja ponownie tworzy funkcje z 004 i 005 (bez zmian w treści) oraz
--  przywraca etykiety reguł powiadomień. Na świeżej instalacji nic nie zmienia.
-- =====================================================================

create or replace function app.user_perm(uid uuid, p text) returns int language sql stable security definer set search_path='' as $$
  select case when not exists(select 1 from public.profiles where id=uid and active) then 0 else coalesce(
    (select level from public.permission_overrides o where o.user_id=uid and o.perm=p and (o.valid_until is null or o.valid_until>=current_date)),
    (select level from public.role_permissions r join public.profiles u on u.role=r.role where u.id=uid and r.perm=p),0) end
$$;

create or replace function app.group_members(g text, cid uuid) returns setof uuid language sql stable security definer set search_path='' as $$
  select id from public.profiles where active and g='admin' and role='admin'
  union select m.user_id from public.case_members m where g='team' and m.case_id=cid and m.revoked_at is null and (m.end_date is null or m.end_date>=current_date)
  union select m.user_id from public.case_members m where g='lead' and m.case_id=cid and m.role='lead' and m.revoked_at is null
  union select id from public.profiles where active and g='finance' and (app.user_perm(id,'initial_fee')>0 or app.user_perm(id,'allocations')>0)
  union select id from public.profiles where active and g='new_cases' and app.user_perm(id,'new_cases')>0
$$;

create or replace function app.notify(rcp uuid, ev text, cid uuid, ttl text, bdy text, prio text default 'normalne', act boolean default false, dkey text default null) returns void language plpgsql security definer set search_path='' as $$
declare r public.notification_rules; base text; s uuid; g text; m uuid; lnk text := case when cid is null then null else '#/sprawa/'||cid end;
begin
  select * into r from public.notification_rules where event_type=ev;
  if r.event_type is not null and not r.enabled and not r.locked then return; end if;
  base := coalesce(dkey, ev||':'||coalesce(cid::text,'-')||':'||txid_current()||':'||md5(coalesce(ttl,'')));
  if rcp is not null then
    insert into public.notifications(recipient_id,event_type,case_id,title,body,priority,requires_action,dedupe_key,link)
    values (rcp,ev,cid,ttl,bdy,prio,act,case when dkey is null then base||':'||rcp else dkey end,lnk) on conflict (dedupe_key) do nothing;
    for s in select x.substitute_id from public.user_substitutes x join public.profiles p on p.id=x.substitute_id and p.active
             where x.user_id=rcp and current_date between x.date_from and x.date_to loop
      insert into public.notifications(recipient_id,event_type,case_id,title,body,priority,requires_action,dedupe_key,link,substitute_for)
      values (s,ev,cid,ttl,'Zastępstwo za: '||coalesce((select full_name from public.profiles where id=rcp),'')||coalesce(' · '||bdy,''),prio,act,base||':sub:'||rcp||':'||s,lnk,rcp) on conflict (dedupe_key) do nothing;
    end loop;
  end if;
  -- dodatkowe grupy z reguły: raz na zdarzenie (klucz bez odbiorcy bezpośredniego)
  if r.extra_groups is not null and coalesce(current_setting('app.notify_expand',true),'')<>'1' then
    perform set_config('app.notify_expand','1',true);
    foreach g in array r.extra_groups loop
      for m in select * from app.group_members(g,cid) loop
        if m is distinct from rcp then perform app.notify(m,ev,cid,ttl,bdy,prio,act,regexp_replace(base,':[0-9a-f-]{36}$','')||':grp:'||m); end if;
      end loop;
    end loop;
    perform set_config('app.notify_expand','',true);
  end if;
end $$;

create or replace function app.case_events() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if tg_op='UPDATE' and new.status='closed' and old.status<>'closed' then
    perform app.notify(null,'case.closed',new.id,'Zakończono sprawę '||new.case_number,'','normalne',false,'case-closed:'||new.id);
  end if;
  return null;
end $$;

create or replace function app.lead_event() returns trigger language plpgsql security definer set search_path='' as $$
begin
  perform app.notify(null,'lead.new',null,'Nowe zgłoszenie ze strony: '||new.category,new.client_name,'normalne',true,'lead:'||new.id);
  return null;
end $$;

create or replace function app.document_event() returns trigger language plpgsql security definer set search_path='' as $$
declare d public.documents;
begin
  select * into d from public.documents where id=new.document_id;
  perform app.notify(null,'document.new',d.case_id,case when new.version=1 then 'Dodano dokument: ' else 'Nowa wersja dokumentu: ' end||d.name,app.case_number_of(d.case_id)||' · v'||new.version,'normalne',false,'doc:'||new.id);
  return null;
end $$;

create or replace function app.fee_event() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.sf_status='spełniony' and old.sf_status is distinct from 'spełniony' then
    perform app.notify(new.user_id,'fee.success',new.case_id,'Naliczono success fee',app.case_number_of(new.case_id),'normalne',false,'fee-success:'||new.id);
  end if;
  return null;
end $$;

create or replace function app.case_new_event() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.role='lead' then
    perform app.notify(null,'case.new',new.case_id,'Nowa sprawa '||app.case_number_of(new.case_id),(select source from public.cases where id=new.case_id),'normalne',false,'case-new:'||new.case_id);
  end if;
  return null;
end $$;

create or replace function app.fresh_reauth() returns boolean language sql stable security definer set search_path='' as $$
  select coalesce(auth.jwt()->>'aal','')='aal2'
     and exists(select 1 from jsonb_array_elements(coalesce(auth.jwt()->'amr','[]')) x where x->>'method'='totp' and (x->>'timestamp')::bigint >= extract(epoch from now())::bigint-300)
     and exists(select 1 from jsonb_array_elements(coalesce(auth.jwt()->'amr','[]')) x where x->>'method'='password' and (x->>'timestamp')::bigint >= extract(epoch from now())::bigint-300)
$$;

create or replace function app.admin_perm_guard() returns trigger language plpgsql security definer set search_path='' as $$
declare target uuid := coalesce(new.user_id, old.user_id);
begin
  if auth.uid() is not null and exists(select 1 from public.profiles where id=target and role='admin') and not app.fresh_reauth() then
    raise exception 'Zmiana uprawnień Administratora wymaga potwierdzenia hasłem i kodem 2FA' using errcode='42501'; end if;
  return coalesce(new,old);
end $$;

create or replace function app.profile_guard() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if (old.role='admin' and old.active) and (new.role<>'admin' or not new.active)
     and (select count(*) from public.profiles where role='admin' and active and id<>old.id)=0 then
    raise exception 'W systemie musi zostać co najmniej jeden aktywny Administrator' using errcode='23514'; end if;
  if auth.uid() is not null and (old.role='admin' or new.role='admin') and (new.role,new.active) is distinct from (old.role,old.active) and not app.fresh_reauth() then
    raise exception 'Zmiana uprawnień Administratora wymaga potwierdzenia hasłem i kodem 2FA' using errcode='42501'; end if;
  if (new.role,new.active) is distinct from (old.role,old.active) then perform app.audit('uzytkownik.zmiana',new.full_name,'rola: '||new.role||', aktywny: '||new.active); end if;
  return new;
end $$;

create or replace function app.cfg_audit() returns trigger language plpgsql security definer set search_path='' as $$
declare r jsonb := to_jsonb(coalesce(new,old));
begin
  perform app.audit('konfiguracja.'||tg_table_name, coalesce(r->>'event_type',r->>'type',(select full_name from public.profiles where id=(r->>'user_id')::uuid),''), lower(tg_op)||coalesce(' · '||(r->>'reason'),''));
  return null;
end $$;

create or replace function public.site_publish(p_data jsonb) returns timestamptz
language plpgsql security definer set search_path='' as $$
declare t timestamptz;
begin
  if not app.is_admin() then raise exception 'Treści strony publikuje tylko Administrator (z 2FA)' using errcode='42501'; end if;
  if coalesce(jsonb_typeof(p_data),'')<>'object' or coalesce(jsonb_typeof(p_data->'site'),'')<>'object'
     or coalesce(jsonb_typeof(p_data->'categories'),'')<>'array' or coalesce(jsonb_typeof(p_data->'calculators'),'')<>'array' then
    raise exception 'Nieprawidłowe dane strony (brak site / categories / calculators)';
  end if;
  if octet_length(p_data::text) > 2000000 then raise exception 'Dane strony są za duże (maks. 2 MB)'; end if;
  if p_data::text ~ 'sb_secret_|service_role' then raise exception 'W danych jest klucz SECRET — nie wolno go publikować na stronie'; end if;
  insert into public.site_content(id,data,published_at,published_by) values(1,p_data #- '{site,adminHash}',now(),auth.uid())
    on conflict(id) do update set data=excluded.data, published_at=excluded.published_at, published_by=excluded.published_by
    returning published_at into t;
  perform app.audit('strona.publikacja','treści strony',
    format('%s kategorii, %s kalkulatorów, %s bajtów', jsonb_array_length(p_data->'categories'), jsonb_array_length(p_data->'calculators'), octet_length(p_data::text)));
  return t;
end $$;

-- etykiety reguł powiadomień (bez zmiany ustawień: grupy, kanały, włączenie)
update public.notification_rules r set label=v.label, default_recipients=v.rcp from (values
 ('case.new','Nowa sprawa','—'),
 ('lead.new','Nowe zgłoszenie ze strony','—'),
 ('team.change','Przydzielenie / zmiana zespołu sprawy','osoba dołączana lub odłączana, pełnomocnik prowadzący'),
 ('deadline.new','Nowy termin','odpowiedzialny, kontroler (potwierdzenie daty)'),
 ('deadline.approaching','Zbliżający się termin','odpowiedzialny; kontroler od T-7; pełnomocnik prowadzący od T-3'),
 ('deadline.overdue','Przekroczenie terminu','odpowiedzialny, pełnomocnik prowadzący, Administrator (eskalacja)'),
 ('document.new','Dodanie dokumentu','—'),
 ('correction.request','Wniosek o korektę','Administrator'),
 ('correction.decided','Decyzja o korekcie','wnioskujący'),
 ('payment.new','Nowa wpłata klienta','Administrator + użytkownicy z uprawnieniem Finanse'),
 ('fee.success','Naliczenie success fee','pełnomocnik, którego dotyczy'),
 ('fee.change','Zmiana parametrów rozliczenia','pełnomocnik, którego dotyczy'),
 ('case.closed','Zakończenie sprawy','—'),
 ('perm.change','Zmiana uprawnień','osoba, której dotyczy')
) v(ev,label,rcp) where r.event_type=v.ev and (r.label<>v.label or r.default_recipients<>v.rcp);

select app.audit('system.migracja','007_naprawa_kodowania','ponowne utworzenie funkcji z 004 i 005, etykiety reguł powiadomień');
