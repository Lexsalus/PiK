-- =====================================================================
--  Migracja 004 — uzupełnienia specyfikacji CRM v1.1
--  §5  przypomnienia konfigurowalne per typ terminu; zastępstwa (powiadomienia trafiają też do zastępcy)
--  §9  zmiana uprawnień Administratora wymaga świeżego hasła i 2FA (sprawdza baza)
--  §10 reguły powiadomień (zdarzenie → dodatkowe grupy odbiorców → kanały) + brakujące zdarzenia:
--      nowa sprawa, zgłoszenie ze strony, dodanie dokumentu, zakończenie sprawy, naliczenie success fee
--  §11 raporty dla aplikanta (własne czynności i terminy)
-- =====================================================================

-- 1) reguły powiadomień
create table public.notification_rules(
  event_type text primary key,
  label text not null,
  default_recipients text not null default '',      -- opis odbiorców bezpośrednich (wynika z ról i przypisań)
  extra_groups text[] not null default '{}' check (extra_groups <@ array['admin','team','lead','finance','new_cases']),
  channels text[] not null default '{crm}' check (channels <@ array['crm','email','sms']),
  enabled boolean not null default true,
  locked boolean not null default false              -- powiadomień o terminach nie można wyłączyć
);
insert into public.notification_rules(event_type,label,default_recipients,extra_groups,locked,enabled) values
 ('case.new','Nowa sprawa','—','{admin,team}',false,true),
 ('lead.new','Nowe zgłoszenie ze strony','—','{admin,new_cases}',false,true),
 ('team.change','Przydzielenie / zmiana zespołu sprawy','osoba dołączana lub odłączana, pełnomocnik prowadzący','{}',false,true),
 ('deadline.new','Nowy termin','odpowiedzialny, kontroler (potwierdzenie daty)','{}',true,true),
 ('deadline.approaching','Zbliżający się termin','odpowiedzialny; kontroler od T-7; pełnomocnik prowadzący od T-3','{}',true,true),
 ('deadline.overdue','Przekroczenie terminu','odpowiedzialny, pełnomocnik prowadzący, Administrator (eskalacja)','{}',true,true),
 ('document.new','Dodanie dokumentu','—','{team}',false,true),
 ('correction.request','Wniosek o korektę','Administrator','{}',false,true),
 ('correction.decided','Decyzja o korekcie','wnioskujący','{}',false,true),
 ('payment.new','Nowa wpłata klienta','Administrator + użytkownicy z uprawnieniem Finanse','{}',false,true),
 ('fee.success','Naliczenie success fee','pełnomocnik, którego dotyczy','{admin}',false,true),
 ('fee.change','Zmiana parametrów rozliczenia','pełnomocnik, którego dotyczy','{admin}',false,true),
 ('case.closed','Zakończenie sprawy','—','{lead,admin}',false,true),
 ('perm.change','Zmiana uprawnień','osoba, której dotyczy','{}',false,true);

-- 2) zastępstwa
create table public.user_substitutes(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  substitute_id uuid not null references public.profiles(id),
  date_from date not null, date_to date not null check (date_to>=date_from),
  reason text not null default '',
  created_by uuid not null default auth.uid(), created_at timestamptz not null default now(),
  check (user_id<>substitute_id)
);

-- powiadomienie dla zastępcy: widoczne w czasie zastępstwa (sama sprawa nadal wymaga dostępu)
alter table public.notifications add column if not exists substitute_for uuid references public.profiles(id);
drop policy if exists r on public.notifications;
create policy r on public.notifications for select to authenticated using (app.session_ok() and recipient_id=auth.uid() and (case_id is null or app.can_case(case_id)
  or (substitute_for is not null and exists(select 1 from public.user_substitutes x where x.user_id=substitute_for and x.substitute_id=auth.uid() and current_date between x.date_from and x.date_to))));

-- 3) harmonogram przypomnień per typ terminu
create table public.deadline_reminder_rules(
  type text primary key check (type in ('statutory','court','internal')),
  offsets int[] not null default '{14,7,3,1,0}' check (array_length(offsets,1) between 1 and 10 and 0 <= all(offsets) and 60 >= all(offsets)),
  controller_from int not null default 7 check (controller_from between 0 and 60),
  lead_from int not null default 3 check (lead_from between 0 and 60)
);
insert into public.deadline_reminder_rules(type) values ('statutory'),('court'),('internal');

-- 4) uprawnienie dowolnego użytkownika (do grup odbiorców)
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

-- 5) app.notify: reguły (wyłączenie, dodatkowe grupy) + zastępcy
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

-- 6) brakujące zdarzenia
create or replace function app.case_events() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if tg_op='UPDATE' and new.status='closed' and old.status<>'closed' then
    perform app.notify(null,'case.closed',new.id,'Zakończono sprawę '||new.case_number,'','normalne',false,'case-closed:'||new.id);
  end if;
  return null;
end $$;
create trigger case_events after update on public.cases for each row execute function app.case_events();
create or replace function app.lead_event() returns trigger language plpgsql security definer set search_path='' as $$
begin
  perform app.notify(null,'lead.new',null,'Nowe zgłoszenie ze strony: '||new.category,new.client_name,'normalne',true,'lead:'||new.id);
  return null;
end $$;
create trigger lead_event after insert on public.leads for each row execute function app.lead_event();
create or replace function app.document_event() returns trigger language plpgsql security definer set search_path='' as $$
declare d public.documents;
begin
  select * into d from public.documents where id=new.document_id;
  perform app.notify(null,'document.new',d.case_id,case when new.version=1 then 'Dodano dokument: ' else 'Nowa wersja dokumentu: ' end||d.name,app.case_number_of(d.case_id)||' · v'||new.version,'normalne',false,'doc:'||new.id);
  return null;
end $$;
create trigger document_event after insert on public.document_versions for each row execute function app.document_event();
create or replace function app.fee_event() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.sf_status='spełniony' and old.sf_status is distinct from 'spełniony' then
    perform app.notify(new.user_id,'fee.success',new.case_id,'Naliczono success fee',app.case_number_of(new.case_id),'normalne',false,'fee-success:'||new.id);
  end if;
  return null;
end $$;
create trigger fee_event after update on public.attorney_fees for each row execute function app.fee_event();
-- nowa sprawa: po dodaniu pełnomocnika prowadzącego (wtedy zespół już istnieje)
create or replace function app.case_new_event() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.role='lead' then
    perform app.notify(null,'case.new',new.case_id,'Nowa sprawa '||app.case_number_of(new.case_id),(select source from public.cases where id=new.case_id),'normalne',false,'case-new:'||new.case_id);
  end if;
  return null;
end $$;
create trigger case_new_event after insert on public.case_members for each row execute function app.case_new_event();

-- 7) przypomnienia wg harmonogramu dla typu terminu
create or replace function public.run_deadline_reminders() returns int language plpgsql security definer set search_path='' as $$
declare d record; n int; k int; lab text; prio text; lead uuid; a record; cnt int:=0; rr public.deadline_reminder_rules;
begin
  for d in select * from public.deadlines where status='open' and deleted_at is null loop
    n:=d.final_due_date-current_date;
    lead:=(select user_id from public.case_members where case_id=d.case_id and role='lead' and revoked_at is null);
    select * into rr from public.deadline_reminder_rules where type=d.type;
    if rr.type is null then rr.offsets:='{14,7,3,1,0}'; rr.controller_from:=7; rr.lead_from:=3; end if;
    if n>=0 then
      k:=(select min(o) from unnest(rr.offsets) o where o>=n);
      if k is not null then
        lab:='T-'||k; prio:=case when k<=1 then 'pilne' when k<=3 then 'wazne' else 'normalne' end;
        perform app.notify(d.responsible_user_id,'deadline.approaching',d.case_id,case when k=0 then 'Dziś mija termin: ' else 'Zbliża się termin: ' end||d.title,app.case_number_of(d.case_id)||' · '||lab,prio,k<=1,d.id||':'||lab||':'||d.responsible_user_id);
        if k<=rr.controller_from then perform app.notify(d.second_controller_id,'deadline.approaching',d.case_id,'Zbliża się termin: '||d.title,app.case_number_of(d.case_id)||' · '||lab,prio,k<=1,d.id||':'||lab||':'||d.second_controller_id); end if;
        if k<=rr.lead_from then perform app.notify(lead,'deadline.approaching',d.case_id,'Zbliża się termin: '||d.title,app.case_number_of(d.case_id)||' · '||lab,prio,k<=1,d.id||':'||lab||':'||lead); end if;
        cnt:=cnt+1;
      end if;
    else
      perform app.notify(d.responsible_user_id,'deadline.overdue',d.case_id,'Przekroczony termin: '||d.title,app.case_number_of(d.case_id)||' · '||(-n)||' dni po terminie','pilne',true,d.id||':over:'||current_date||':'||d.responsible_user_id);
      perform app.notify(lead,'deadline.overdue',d.case_id,'Przekroczony termin: '||d.title,app.case_number_of(d.case_id)||' · eskalacja','pilne',true,d.id||':over:'||current_date||':'||lead);
      for a in select id from public.profiles where role='admin' and active loop
        perform app.notify(a.id,'deadline.overdue',d.case_id,'Przekroczony termin: '||d.title,app.case_number_of(d.case_id)||' · eskalacja','pilne',true,d.id||':over:'||current_date||':'||a.id);
      end loop;
      cnt:=cnt+1;
    end if;
  end loop;
  return cnt;
end $$;

-- 8) zmiana uprawnień Administratora: świeże hasło + 2FA (ponowne logowanie w ciągu 5 minut)
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
create trigger admin_perm_guard before insert or update or delete on public.permission_overrides for each row execute function app.admin_perm_guard();
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

-- 9) raporty dla aplikanta (własne czynności i terminy — zakres danych ogranicza RLS)
insert into public.role_permissions(role,perm,level) values ('app','reports',1) on conflict (role,perm) do update set level=excluded.level;

-- 10) audyt konfiguracji i RLS
create or replace function app.cfg_audit() returns trigger language plpgsql security definer set search_path='' as $$
declare r jsonb := to_jsonb(coalesce(new,old));
begin
  perform app.audit('konfiguracja.'||tg_table_name, coalesce(r->>'event_type',r->>'type',(select full_name from public.profiles where id=(r->>'user_id')::uuid),''), lower(tg_op)||coalesce(' · '||(r->>'reason'),''));
  return null;
end $$;
create trigger cfg_audit after insert or update or delete on public.notification_rules for each row execute function app.cfg_audit();
create trigger cfg_audit after insert or update or delete on public.user_substitutes for each row execute function app.cfg_audit();
create trigger cfg_audit after insert or update or delete on public.deadline_reminder_rules for each row execute function app.cfg_audit();
alter table public.notification_rules enable row level security;
alter table public.user_substitutes enable row level security;
alter table public.deadline_reminder_rules enable row level security;
revoke all on public.notification_rules, public.user_substitutes, public.deadline_reminder_rules from anon;
create policy r on public.notification_rules for select to authenticated using (app.session_ok());
create policy u on public.notification_rules for update to authenticated using (app.is_admin()) with check (app.is_admin() and (not locked or enabled));
create policy r on public.deadline_reminder_rules for select to authenticated using (app.session_ok());
create policy u on public.deadline_reminder_rules for update to authenticated using (app.is_admin()) with check (app.is_admin());
create policy r on public.user_substitutes for select to authenticated using (app.is_admin() or auth.uid() in (user_id,substitute_id));
create policy w on public.user_substitutes for all to authenticated using (app.is_admin()) with check (app.is_admin());
revoke insert, delete on public.notification_rules, public.deadline_reminder_rules from authenticated;
grant delete on public.user_substitutes to authenticated;
revoke all on all functions in schema app from public, anon;
grant execute on all functions in schema app to authenticated;
select app.audit('system.migracja','004_uzupelnienia_specyfikacji','reguły powiadomień, zastępstwa, przypomnienia per typ, 2FA przy uprawnieniach Administratora, raporty aplikanta');
