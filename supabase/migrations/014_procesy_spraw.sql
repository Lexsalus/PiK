-- =====================================================================
--  Migracja 014 — procesy spraw edytowane w CRM, listy kontrolne etapów
--  1) process_templates: dowolne procesy (dotąd tylko std / rst), nowy proces „dot” (Dotacje i granty).
--  2) Lista kontrolna etapu: w szablonie (checklist: [{t, auto}]) i w sprawie (case_stages.checklist:
--     [{t, auto, done, by, at}]). Punkty odklikuje zespół sprawy (stage_check), punkty „auto”
--     (dokument / wpłata / termin / wpis) zaznacza system, gdy w etapie pojawi się taki element.
--  3) Edycja etapu w konkretnej sprawie (nazwa, lista kontrolna) i dodanie etapu — stage_edit / stage_add.
--  Zmiany szablonów dotyczą nowych spraw; istniejące sprawy zmienia się w ich karcie.
-- =====================================================================
create table if not exists public.process_templates(
  code text primary key check (code ~ '^[a-z]{2,10}$'),
  name text not null,
  created_at timestamptz not null default now()
);
insert into public.process_templates(code,name) values ('std','Standardowy (sądowy)'),('rst','Restrukturyzacja'),('dot','Dotacje i granty') on conflict do nothing;
alter table public.process_templates enable row level security;
drop policy if exists r on public.process_templates; drop policy if exists i on public.process_templates; drop policy if exists u on public.process_templates;
create policy r on public.process_templates for select to authenticated using (true);
create policy i on public.process_templates for insert to authenticated with check (app.is_admin());
create policy u on public.process_templates for update to authenticated using (app.is_admin()) with check (app.is_admin());
grant select, insert, update on public.process_templates to authenticated;

alter table public.process_template_stages drop constraint if exists process_template_stages_template_check;
alter table public.case_categories drop constraint if exists case_categories_process_template_check;
do $$ begin
  alter table public.process_template_stages add constraint process_template_stages_template_fk foreign key (template) references public.process_templates(code);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.case_categories add constraint case_categories_process_template_fk foreign key (process_template) references public.process_templates(code);
exception when duplicate_object then null; end $$;
alter table public.process_template_stages add column if not exists checklist jsonb not null default '[]'::jsonb;
alter table public.case_stages add column if not exists checklist jsonb not null default '[]'::jsonb;
-- zmiana kolejności etapów w szablonie (zamiana miejscami) bez naruszania unikalności w trakcie
alter table public.process_template_stages drop constraint if exists process_template_stages_template_sort_order_key;
do $$ begin
  alter table public.process_template_stages add constraint process_template_stages_template_sort_order_key unique (template,sort_order) deferrable initially deferred;
exception when duplicate_object or duplicate_table then null; end $$;

-- proces „Dotacje i granty”
insert into public.process_template_stages(template,sort_order,name,is_conflict_check,checklist)
select 'dot',o,n,n='Kontrola konfliktu interesów',c::jsonb from (values
 (1,'Przyjęcie sprawy','[{"t":"Rozmowa z klientem, opis działalności i planów inwestycyjnych"},{"t":"Wstępny raport z serwisu dotacji przejrzany"}]'),
 (2,'Rejestracja klienta','[{"t":"Dane firmy (NIP, KRS / CEIDG, PKD, wielkość przedsiębiorstwa)"},{"t":"Osoba do kontaktu i pełnomocnictwo"}]'),
 (3,'Kontrola konfliktu interesów','[]'),
 (4,'Opłata wstępna','[{"t":"Opłata wstępna wpłacona","auto":"wplata"}]'),
 (5,'Analiza możliwości finansowania','[{"t":"Wybrany program i nabór (termin, alokacja, kryteria)"},{"t":"Sprawdzona pomoc de minimis i wykluczenia"},{"t":"Notatka z analizy","auto":"wpis"}]'),
 (6,'Umowa z klientem','[{"t":"Umowa podpisana (wynagrodzenie, success fee)","auto":"dokument"}]'),
 (7,'Przygotowanie dokumentacji','[{"t":"Biznesplan / opis projektu"},{"t":"Budżet i harmonogram projektu"},{"t":"Oświadczenia i załączniki klienta","auto":"dokument"}]'),
 (8,'Złożenie wniosku','[{"t":"Wniosek złożony (potwierdzenie, numer wniosku)","auto":"dokument"},{"t":"Termin oceny wpisany","auto":"termin"}]'),
 (9,'Ocena wniosku i uzupełnienia','[{"t":"Uzupełnienia / wyjaśnienia złożone w terminie"},{"t":"Wynik oceny"}]'),
 (10,'Umowa o dofinansowanie','[{"t":"Umowa o dofinansowanie podpisana","auto":"dokument"},{"t":"Zabezpieczenie złożone"}]'),
 (11,'Realizacja i rozliczenie','[{"t":"Wnioski o płatność"},{"t":"Rozliczenie końcowe i okres trwałości"}]')
) v(o,n,c)
where not exists (select 1 from public.process_template_stages where template='dot');
update public.case_categories set process_template='dot' where code='DOT' and process_template='std';

-- nowe sprawy: etapy z listą kontrolną
create or replace function app.case_after_insert() returns trigger language plpgsql security definer set search_path='' as $$
begin
  insert into public.case_stages(case_id,template_stage_id,sort_order,name,is_conflict_check,status,checklist)
  select new.id,s.id,s.sort_order,s.name,s.is_conflict_check,case when s.sort_order=1 then 'open' else 'todo' end,
         coalesce((select jsonb_agg(x||'{"done":false}'::jsonb) from jsonb_array_elements(s.checklist) x),'[]'::jsonb)
  from public.process_template_stages s join public.case_categories c on c.process_template=s.template where c.code=new.category_code order by s.sort_order;
  insert into public.case_finance(case_id) values (new.id) on conflict do nothing;
  perform app.hist(new.id,'Założono sprawę '||new.case_number);
  perform app.audit('sprawa.utworzona',new.case_number,'kategoria '||new.category_code);
  return new;
end $$;

/* odklikanie punktu listy kontrolnej (zespół sprawy z prawem do czynności; etap otwarty — po zatwierdzeniu tylko Administrator) */
create or replace function public.stage_check(p_stage uuid, p_idx int, p_done boolean) returns void language plpgsql security definer set search_path='' as $$
declare s public.case_stages; it jsonb;
begin
  select * into s from public.case_stages where id=p_stage for update;
  if s.id is null or not app.can_case(s.case_id) or not (app.is_admin() or app.case_flag(s.case_id,'actions')) then raise exception 'Brak dostępu' using errcode='42501'; end if;
  if s.status='approved' and not app.is_admin() then raise exception 'Etap zatwierdzony — zmiana tylko przez Administratora' using errcode='23514'; end if;
  it := s.checklist->p_idx;
  if it is null then raise exception 'Brak punktu listy'; end if;
  it := it || jsonb_build_object('done',p_done,'by',case when p_done then auth.uid() end,'at',case when p_done then now() end);
  update public.case_stages set checklist=jsonb_set(checklist,array[p_idx::text],it) where id=p_stage;
  perform app.hist(s.case_id,format('Etap %s: %s „%s”',s.sort_order,case when p_done then 'wykonano' else 'cofnięto' end,it->>'t'));
end $$;

/* edycja etapu w sprawie: nazwa i lista kontrolna (Administrator albo prowadzący z prawem zatwierdzania); etap niezatwierdzony */
create or replace function public.stage_edit(p_stage uuid, p_name text, p_checklist jsonb) returns void language plpgsql security definer set search_path='' as $$
declare s public.case_stages;
begin
  select * into s from public.case_stages where id=p_stage for update;
  if s.id is null or not app.can_case(s.case_id) or not (app.is_admin() or app.case_flag(s.case_id,'approve')) then raise exception 'Brak uprawnienia do zmiany etapu' using errcode='42501'; end if;
  if s.status='approved' and not app.is_admin() then raise exception 'Etap zatwierdzony' using errcode='23514'; end if;
  if coalesce(btrim(p_name),'')='' or jsonb_typeof(coalesce(p_checklist,'[]'))<>'array' then raise exception 'Podaj nazwę etapu'; end if;
  update public.case_stages set name=left(btrim(p_name),200), checklist=p_checklist where id=p_stage;
  perform app.hist(s.case_id,format('Zmieniono etap %s: %s',s.sort_order,left(btrim(p_name),200)));
end $$;

/* dodanie etapu w sprawie (na końcu albo po wskazanym); kolejne przesuwają się o 1 */
create or replace function public.stage_add(p_case uuid, p_after int, p_name text) returns uuid language plpgsql security definer set search_path='' as $$
declare nid uuid; pos int;
begin
  if not app.can_case(p_case) or not (app.is_admin() or app.case_flag(p_case,'approve')) then raise exception 'Brak uprawnienia' using errcode='42501'; end if;
  pos := coalesce(p_after,(select max(sort_order) from public.case_stages where case_id=p_case))+1;
  update public.case_stages set sort_order=sort_order+1000 where case_id=p_case and sort_order>=pos;
  update public.case_stages set sort_order=sort_order-999 where case_id=p_case and sort_order>=pos+1000;
  insert into public.case_stages(case_id,sort_order,name,status,checklist)
  values (p_case,pos,left(btrim(p_name),200),case when not exists(select 1 from public.case_stages where case_id=p_case and status in ('open','todo') and sort_order<pos)
                                             and not exists(select 1 from public.case_stages where case_id=p_case and status='open') then 'open' else 'todo' end,'[]')
  returning id into nid;
  perform app.hist(p_case,format('Dodano etap %s: %s',pos,left(btrim(p_name),200)));
  return nid;
end $$;

revoke all on function public.stage_check(uuid,int,boolean) from public, anon;
revoke all on function public.stage_edit(uuid,text,jsonb) from public, anon;
revoke all on function public.stage_add(uuid,int,text) from public, anon;
grant execute on function public.stage_check(uuid,int,boolean), public.stage_edit(uuid,text,jsonb), public.stage_add(uuid,int,text) to authenticated;
grant execute on all functions in schema app to authenticated;
revoke all on all functions in schema app from public, anon;
select app.audit('system.migracja','014_procesy_spraw','procesy edytowane w CRM, proces Dotacje i granty, listy kontrolne etapów');

-- 4) Powiadomienie: zmiany czekają na publikację (Treści strony, Dotacje) — z nazwą osoby, która je wprowadziła.
--    Szkic jest w przeglądarce tej osoby; powiadomienie dostają wszyscy Administratorzy (raz dziennie na osobę i miejsce),
--    po publikacji powiadomienia oznaczają się jako przeczytane.
insert into public.notification_rules(event_type,label,default_recipients,extra_groups,locked,enabled) values
 ('publish.pending','Zmiany czekają na publikację (Treści strony, Dotacje)','Administratorzy','{}',false,true)
on conflict (event_type) do nothing;
create or replace function public.publish_notice(p_what text, p_pending boolean) returns void language plpgsql security definer set search_path='' as $$
declare r record; nm text; lbl text;
begin
  if not app.is_admin() then return; end if;
  if p_what not in ('strona','dotacje') then raise exception 'Nieznane miejsce publikacji'; end if;
  lbl := case p_what when 'strona' then 'Treści strony' else 'Dotacje' end;
  if p_pending then
    select coalesce(nullif(full_name,''),email) into nm from public.profiles where id=auth.uid();
    if exists(select 1 from public.notification_rules where event_type='publish.pending' and not enabled and not locked) then return; end if;
    for r in select id from public.profiles where role='admin' and active loop
      insert into public.notifications(recipient_id,event_type,title,body,priority,dedupe_key,link)
      values (r.id,'publish.pending','Do opublikowania: '||lbl,
              'Zmiany wprowadził(a): '||nm||case when r.id<>auth.uid() then ' — szkic jest w przeglądarce tej osoby' else '' end,
              'normalne','pub:'||p_what||':'||auth.uid()||':'||r.id||':'||to_char(current_date,'YYYYMMDD'),'#/'||p_what)
      on conflict (dedupe_key) do nothing;
    end loop;
  else
    update public.notifications set read_at=now() where event_type='publish.pending' and read_at is null and dedupe_key like 'pub:'||p_what||':'||auth.uid()||':%';
  end if;
end $$;
revoke all on function public.publish_notice(text,boolean) from public, anon;
grant execute on function public.publish_notice(text,boolean) to authenticated;
