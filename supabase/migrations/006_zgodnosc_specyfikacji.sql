-- =====================================================================
--  Migracja 006 — poprawki zgodności ze specyfikacją v1.1
--  §5  daty liczone według czasu polskiego (dotąd UTC); przypomnienie
--      „w dniu terminu” wychodzi od 8:00, nie tuż po północy.
--  §7  magazyn akt przyjmuje tylko dozwolone typy plików (dotąd sprawdzała
--      to wyłącznie przeglądarka).
--  §11 raport liczony w bazie (report_summary) — w zakresie danych, które
--      widzi zalogowana osoba (te same reguły RLS co w CRM).
-- =====================================================================

-- 1) strefa czasowa bazy: Europe/Warsaw (current_date = data w Polsce)
do $$ begin execute format('alter database %I set timezone to %L', current_database(), 'Europe/Warsaw'); end $$;
set timezone to 'Europe/Warsaw';

-- 2) przypomnienia: data polska, dzień terminu od 8:00
create or replace function public.run_deadline_reminders() returns int language plpgsql security definer set search_path='' as $$
declare d record; n int; today date:=(now() at time zone 'Europe/Warsaw')::date; hr int:=extract(hour from (now() at time zone 'Europe/Warsaw'))::int; k int; lab text; prio text; lead uuid; a record; cnt int:=0; rr public.deadline_reminder_rules;
begin
  for d in select * from public.deadlines where status='open' and deleted_at is null loop
    n:=d.final_due_date-today;
    lead:=(select user_id from public.case_members where case_id=d.case_id and role='lead' and revoked_at is null);
    select * into rr from public.deadline_reminder_rules where type=d.type;
    if rr.type is null then rr.offsets:='{14,7,3,1,0}'; rr.controller_from:=7; rr.lead_from:=3; end if;
    if n>=0 then
      k:=(select min(o) from unnest(rr.offsets) o where o>=n);
      if k=0 and hr<8 then k:=null; end if;   -- dzień terminu: od 8:00 (czas polski)
      if k is not null then
        lab:='T-'||k; prio:=case when k<=1 then 'pilne' when k<=3 then 'wazne' else 'normalne' end;
        perform app.notify(d.responsible_user_id,'deadline.approaching',d.case_id,case when k=0 then 'Dziś mija termin: ' else 'Zbliża się termin: ' end||d.title,app.case_number_of(d.case_id)||' · '||lab,prio,k<=1,d.id||':'||lab||':'||d.responsible_user_id);
        if k<=rr.controller_from then perform app.notify(d.second_controller_id,'deadline.approaching',d.case_id,'Zbliża się termin: '||d.title,app.case_number_of(d.case_id)||' · '||lab,prio,k<=1,d.id||':'||lab||':'||d.second_controller_id); end if;
        if k<=rr.lead_from then perform app.notify(lead,'deadline.approaching',d.case_id,'Zbliża się termin: '||d.title,app.case_number_of(d.case_id)||' · '||lab,prio,k<=1,d.id||':'||lab||':'||lead); end if;
        cnt:=cnt+1;
      end if;
    else
      perform app.notify(d.responsible_user_id,'deadline.overdue',d.case_id,'Przekroczony termin: '||d.title,app.case_number_of(d.case_id)||' · '||(-n)||' dni po terminie','pilne',true,d.id||':over:'||today||':'||d.responsible_user_id);
      perform app.notify(lead,'deadline.overdue',d.case_id,'Przekroczony termin: '||d.title,app.case_number_of(d.case_id)||' · eskalacja','pilne',true,d.id||':over:'||today||':'||lead);
      for a in select id from public.profiles where role='admin' and active loop
        perform app.notify(a.id,'deadline.overdue',d.case_id,'Przekroczony termin: '||d.title,app.case_number_of(d.case_id)||' · eskalacja','pilne',true,d.id||':over:'||today||':'||a.id);
      end loop;
      cnt:=cnt+1;
    end if;
  end loop;
  return cnt;
end $$;

-- 3) dozwolone typy plików w magazynie akt (te same co w CRM: pdf, doc(x), odt, rtf, txt, xls(x), ods, jpg, png)
do $$ begin
  if exists(select 1 from information_schema.columns where table_schema='storage' and table_name='buckets' and column_name='allowed_mime_types') then
    execute $q$update storage.buckets set allowed_mime_types=array[
      'application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.oasis.opendocument.text','application/rtf','text/rtf','text/plain',
      'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.oasis.opendocument.spreadsheet',
      'image/jpeg','image/png'] where id='akta'$q$;
  end if;
end $$;

-- 4) raport (§11) — agregacje w bazie; security invoker = tylko dane widoczne dla wywołującego
create or replace function public.report_summary(p_from date, p_to date, p_cat text default null, p_att uuid default null, p_status text default null)
returns jsonb language sql stable security invoker set search_path='' as $$
  with sc as (
    select c.* from public.cases c
    where (p_cat is null or c.category_code=p_cat)
      and (p_status is null or c.status=p_status)
      and (p_att is null or exists(select 1 from public.case_members m where m.case_id=c.id and m.role='lead' and m.revoked_at is null and m.user_id=p_att))
  ), dl as (
    select d.* from public.deadlines d join sc on sc.id=d.case_id
    where d.deleted_at is null and d.final_due_date between p_from and p_to
  )
  select jsonb_build_object(
    'cases', (select count(*) from sc),
    'closed_in_range', (select count(*) from sc where status='closed' and closed_at between p_from and p_to),
    'by_status', coalesce((select jsonb_object_agg(status,n) from (select status,count(*) n from sc group by status) x),'{}'::jsonb),
    'by_category', coalesce((select jsonb_object_agg(category_code,n) from (select category_code,count(*) n from sc group by category_code) x),'{}'::jsonb),
    'deadlines', (select count(*) from dl),
    'deadlines_ok', (select count(*) from dl where status='done' and completed_at<=final_due_date),
    'deadlines_over', (select count(*) from dl where (status<>'done' and final_due_date<current_date) or (status='done' and completed_at>final_due_date)),
    'deadlines_open', (select count(*) from dl where status<>'done' and final_due_date>=current_date),
    'payments', (select coalesce(sum(p.amount),0) from public.payments p join sc on sc.id=p.case_id where p.received_on between p_from and p_to),
    'computed_at', now())
$$;
revoke all on function public.report_summary(date,date,text,uuid,text) from public, anon;
grant execute on function public.report_summary(date,date,text,uuid,text) to authenticated;

select app.audit('system.migracja','006_zgodnosc_specyfikacji','czas polski + przypomnienie 8:00, typy plików w aktach, raport w bazie');
