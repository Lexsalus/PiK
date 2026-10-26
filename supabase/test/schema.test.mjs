import {PGlite} from '@electric-sql/pglite';
import {pgcrypto} from '@electric-sql/pglite/contrib/pgcrypto';
import fs from 'fs';
const db=new PGlite({extensions:{pgcrypto}});
const R=(ok,msg)=>console.log((ok?'✅ ':'❌ ')+msg);
await db.exec(`
create role anon nologin; create role authenticated nologin; create role service_role nologin;
create schema auth; create schema extensions; create extension pgcrypto schema extensions;
create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true),''),'{}')::jsonb $$;
grant execute on function auth.jwt() to anon, authenticated;
create schema storage; grant usage on schema storage to anon, authenticated;
create table storage.buckets(id text primary key, name text, public boolean, file_size_limit bigint);
create table storage.objects(id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner uuid default auth.uid());
alter table storage.objects enable row level security; grant select, insert on storage.objects to authenticated;
grant usage on schema public, auth to anon, authenticated; grant execute on function auth.uid() to anon, authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant all on functions to anon, authenticated;
alter default privileges in schema public grant all on sequences to anon, authenticated;`);
try{await db.exec(fs.readFileSync(new URL('../schema.sql', import.meta.url),'utf8'));R(true,'schema.sql wykonany bez błędów')}catch(e){R(false,'schema.sql: '+e.message);process.exit(1)}
for(const m of fs.readdirSync(new URL('../migrations/', import.meta.url)).sort()){try{await db.exec(fs.readFileSync(new URL('../migrations/'+m, import.meta.url),'utf8'));R(true,'migracja '+m)}catch(e){R(false,'migracja '+m+': '+e.message);process.exit(1)}}
const U={admin:'11111111-1111-1111-1111-111111111111',jan:'22222222-2222-2222-2222-222222222222',piotr:'33333333-3333-3333-3333-333333333333',anna:'44444444-4444-4444-4444-444444444444',kasia:'55555555-5555-5555-5555-555555555555',tech:'66666666-6666-6666-6666-666666666666'};
for(const [k,id] of Object.entries(U))await db.query(`insert into auth.users(id,email,raw_user_meta_data) values($1,$2,$3)`,[id,k+'@k.test',{full_name:k}]);
R((await db.query('select count(*)::int n from public.profiles where not active')).rows[0].n===6,'trigger: 6 profili, nieaktywne do zatwierdzenia');
await db.exec(`update public.profiles set active=true, role=case email when 'admin@k.test' then 'admin' when 'jan@k.test' then 'att' when 'piotr@k.test' then 'att' when 'anna@k.test' then 'app' when 'kasia@k.test' then 'office' else 'tech' end`);
let AAL='aal2',AMR=[];
const as=async(who,sql,params=[])=>{await db.exec(`set role ${who==='anon'?'anon':'authenticated'}`);await db.query(`select set_config('request.jwt.claim.sub',$1,false), set_config('request.jwt.claims',$2,false)`,[who==='anon'?'':U[who],JSON.stringify({aal:AAL,amr:AMR})]);try{return await db.query(sql,params)}finally{await db.exec('reset role')}};
const fails=async(who,sql,params=[])=>{try{await as(who,sql,params);return null}catch(e){return e.message}};
// --- sprawy i numeracja
const c1=(await as('admin',`select public.create_case('SKD','Jan','Kowalski',$1,'80010112345','123','j@k.pl','Warszawa',250000,5000,10) id`,[U.jan])).rows[0].id;
const c2=(await as('kasia',`select public.create_case('SKD','Ewa','Druga',$1) id`,[U.piotr])).rows[0].id;
const nums=(await db.query(`select case_number from public.cases order by created_at`)).rows.map(r=>r.case_number);
R(nums.join()==='SKD-2026-0001,SKD-2026-0002',`numeracja: ${nums.join(', ')}`);
R(!!await fails('anna',`select public.create_case('CIV','X','Y',$1)`,[U.jan]),'aplikant nie zakłada spraw');
R((await db.query(`select count(*)::int n from public.case_stages where case_id=$1`,[c1])).rows[0].n===10,'10 etapów z szablonu');
R(!!await fails('admin',`update public.cases set case_number='X' where id=$1`,[c1]),'numer sprawy niezmienny');
// --- zespół
await as('admin',`insert into public.case_members(case_id,user_id,role,access_finance) values($1,$2,'app',false)`,[c1,U.anna]);
R(!!await fails('admin',`insert into public.case_members(case_id,user_id,role) values($1,$2,'lead')`,[c1,U.piotr]),'drugi pełnomocnik prowadzący → odrzucony');
R(!!await fails('jan',`insert into public.case_members(case_id,user_id,role) values($1,$2,'app')`,[c1,U.piotr]),'dodaje do zespołu tylko Administrator');
// --- widoczność
R((await as('anna',`select * from public.cases`)).rows.length===1,'aplikant widzi tylko swoją sprawę');
R((await as('anna',`select * from public.case_finance`)).rows.length===0,'aplikant: brak danych finansowych sprawy');
await as('admin',`insert into public.payments(case_id,amount) values($1,10000)`,[c1]);
const pay=(await db.query('select id from public.payments')).rows[0].id;
for(const [t,a,st,who] of [['sales',3000,'planned',null],['marketing',2000,'planned',null],['attorney',1000,'planned',U.jan],['company',4000,'planned',null]])
  await as('admin',`insert into public.allocations(payment_id,case_id,recipient_type,amount,status,recipient_user_id,recipient_name) values($1,$2,$3,$4,$5,$6,$7)`,[pay,c1,t,a,st,who,t==='sales'?'Kamil Nowicki':null]);
R(!!await fails('admin',`insert into public.allocations(payment_id,case_id,recipient_type,amount) values($1,$2,'other',1)`,[pay,c1]),'suma podziału > wpływ → odrzucone');
await as('admin',`update public.allocations set status='approved' where payment_id=$1`,[pay]);
R((await db.query(`select count(*)::int n from public.allocations where status='approved'`)).rows[0].n===4,'bilans 0 zł → zatwierdzenie możliwe');
const p2=(await as('admin',`insert into public.payments(case_id,amount) values($1,5000) returning id`,[c2])).rows[0].id;
R(!!await fails('admin',`insert into public.allocations(payment_id,case_id,recipient_type,recipient_user_id,amount,status) values($1,$2,'attorney',$3,1000,'approved')`,[p2,c2,U.piotr]),'niepełny podział nie może być „zatwierdzone”');
const ja=(await as('jan',`select recipient_type,amount from public.allocations`)).rows;
R(ja.length===1&&+ja[0].amount===1000,`pełnomocnik widzi tylko swoją pozycję: ${JSON.stringify(ja)}`);
R((await as('anna',`select * from public.allocations`)).rows.length===0&&(await as('anna',`select * from public.payments`)).rows.length===0,'aplikant: 0 wpłat i alokacji');
R((await as('anna',`select * from public.attorney_fees`)).rows.length===0,'aplikant: brak wynagrodzenia/success fee');
// --- PESEL
R((await as('jan',`select pesel_masked from public.clients`)).rows[0]?.pesel_masked==='800101*****','PESEL maskowany w tabeli');
R(!!await fails('jan',`select public.reveal_pesel((select client_id from public.cases where id=$1))`,[c1]),'pełnomocnik bez uprawnienia nie odsłoni PESEL');
R((await as('admin',`select public.reveal_pesel((select client_id from public.cases where id=$1)) p`,[c1])).rows[0].p==='80010112345','Administrator odsłania PESEL (zaszyfrowany w bazie)');
R(!!await fails('jan',`select * from private.client_pesel`),'tabela z PESEL niedostępna przez API');
// --- wpisy, blokady, korekty
const st1=(await db.query(`select id from public.case_stages where case_id=$1 and sort_order=1`,[c1])).rows[0].id;
const e1=(await as('anna',`insert into public.case_entries(case_id,stage_id,type,title) values($1,$2,'czynność','Analiza umowy') returning id`,[c1,st1])).rows[0].id;
await as('anna',`update public.case_entries set description='poprawka' where id=$1`,[e1]);
R((await db.query(`select count(*)::int n from public.entry_versions where entry_id=$1`,[e1])).rows[0].n===1,'edycja roboczego wpisu → wersja zapisana');
R((await fails('anna',`delete from public.case_entries where id=$1`,[e1]))?.includes('permission denied'),'aplikant DELETE → odmowa (brak uprawnienia w bazie)');
R(!!await fails('anna',`update public.case_entries set deleted_at=now(),delete_reason='test test' where id=$1`,[e1]),'aplikant soft delete → odmowa');
{const r=await as('piotr',`update public.case_entries set title='x' where id=$1`,[e1]);const t=(await db.query('select title from public.case_entries where id=$1',[e1])).rows[0].title;R(r.affectedRows===0&&t!=='x',`pełnomocnik spoza sprawy: UPDATE zmienił ${r.affectedRows} wierszy (RLS ukrywa wiersz)`)}
await as('jan',`select public.approve_stage($1)`,[st1]);
R((await db.query(`select locked from public.case_entries where id=$1`,[e1])).rows[0].locked===true,'pełnomocnik prowadzący zatwierdza etap → wpisy zablokowane');
R(!!await fails('anna',`update public.case_entries set title='zmiana' where id=$1`,[e1]),'zmiana zatwierdzonego wpisu → odmowa');
R(!!await fails('admin',`update public.case_entries set title='zmiana' where id=$1`,[e1]),'Administrator bez uzasadnienia → odmowa');
await as('anna',`insert into public.correction_requests(entry_id,case_id,reason,proposed_title) values($1,$2,'literówka w tytule','Analiza umowy kredytowej')`,[e1,c1]);
const kr=(await db.query(`select id from public.correction_requests`)).rows[0].id;
R(!!await fails('jan',`select public.decide_correction($1,true)`,[kr]),'decyzja o korekcie: nie-Administrator → odmowa');
await as('admin',`select public.decide_correction($1,true)`,[kr]);
R((await db.query(`select title from public.case_entries where id=$1`,[e1])).rows[0].title==='Analiza umowy kredytowej','korekta zatwierdzona, oryginał w wersjach');
await as('admin',`update public.case_entries set deleted_at=now(),delete_reason='duplikat wpisu' where id=$1`,[e1]);
R((await as('anna',`select * from public.case_entries where id=$1`,[e1])).rows.length===0,'soft delete: znika z widoku roboczego');
R((await db.query(`select details from public.audit_log where action='wpis.usuniety'`)).rows[0]?.details.includes('Analiza umowy'),'usunięta treść zachowana w audycie');
// konflikt interesów
const st=n=>db.query(`select id from public.case_stages where case_id=$1 and sort_order=$2`,[c1,n]).then(r=>r.rows[0].id);
await as('jan',`select public.approve_stage($1)`,[await st(2)]);await as('jan',`select public.approve_stage($1)`,[await st(3)]);
R(!!await fails('jan',`select public.approve_stage($1)`,[await st(4)]),'kontrola konfliktu bez wyniku → blokada');
await as('jan',`select public.approve_stage($1,'brak konfliktu (strona przeciwna: Bank X)')`,[await st(4)]);
R((await db.query(`select status from public.case_stages where id=$1`,[await st(5)])).rows[0].status==='open','po wyniku „brak konfliktu” otwiera się kolejny etap');
// --- terminy
R(!!await fails('jan',`insert into public.deadlines(case_id,type,title,final_due_date,responsible_user_id) values($1,'statutory','Odpowiedź',current_date+1,$2)`,[c1,U.jan]),'termin ustawowy bez drugiej osoby → odrzucony');
const d1=(await as('jan',`insert into public.deadlines(case_id,type,title,trigger_date,term_length,term_unit,computed_due_date,final_due_date,responsible_user_id,second_controller_id) values($1,'statutory','Odpowiedź na pozew',current_date-13,14,'dni',current_date+1,current_date+1,$2,$3) returning id`,[c1,U.jan,U.anna])).rows[0].id;
R(!!await fails('jan',`update public.deadlines set controller_confirmed_at=now() where id=$1`,[d1]),'datę potwierdza tylko wyznaczony kontroler');
await as('anna',`update public.deadlines set controller_confirmed_at=now() where id=$1`,[d1]);
R(!!await fails('jan',`update public.deadlines set final_due_date=final_due_date+2 where id=$1`,[d1]),'zmiana daty bez uzasadnienia → odrzucona');
await as('jan',`update public.deadlines set final_due_date=final_due_date+2, change_reason='sąd przedłużył termin' where id=$1`,[d1]);
R((await db.query(`select controller_confirmed_at from public.deadlines where id=$1`,[d1])).rows[0].controller_confirmed_at===null,'po zmianie daty ustawowego — ponowna kontrola');
R(!!await fails('jan',`update public.deadlines set status='done',completed_at=current_date where id=$1`,[d1]),'„Wykonano” bez załącznika → odrzucone');
await as('admin',`insert into public.deadlines(case_id,type,title,final_due_date,responsible_user_id) values($1,'internal','Wniosek dowodowy',current_date-3,$2)`,[c1,U.jan]);
const n1=await db.query('select public.run_deadline_reminders() n');const cnt1=(await db.query('select count(*)::int n from public.notifications')).rows[0].n;
await db.query('select public.run_deadline_reminders()');const cnt2=(await db.query('select count(*)::int n from public.notifications')).rows[0].n;
R(cnt1===cnt2,`przypomnienia: każde dokładnie raz (${cnt1} = ${cnt2})`);
R((await as('admin',`select title from public.notifications where event_type='deadline.overdue'`)).rows.length>0,'przekroczony termin → eskalacja do Administratora');
R((await as('anna',`select * from public.notifications where event_type='payment.new'`)).rows.length===0,'aplikant nie dostaje powiadomień o wpłatach');
R(!!await fails('jan',`select public.run_deadline_reminders()`),'zadanie przypomnień niewywoływalne z API');
// --- odebranie dostępu
const m=(await db.query(`select id from public.case_members where user_id=$1`,[U.anna])).rows[0].id;
await as('admin',`update public.case_members set revoked_at=now(),revoked_by=$2 where id=$1`,[m,U.admin]);
R((await as('anna',`select * from public.cases`)).rows.length===0,'po odebraniu dostępu aplikant nie widzi sprawy (natychmiast)');
R((await as('anna',`select * from public.notifications where case_id is not null`)).rows.length===0,'po odebraniu dostępu — stare powiadomienia niedostępne');
// --- obsługa techniczna
R((await as('tech',`select * from public.cases`)).rows.length===0&&(await as('tech',`select * from public.clients`)).rows.length===0,'obsługa techniczna: 0 spraw i klientów');
await as('tech',`insert into public.emergency_access(reason) values('awaria indeksu wyszukiwania')`);
const em=(await db.query('select id from public.emergency_access')).rows[0].id;
R(!!await fails('admin',`update public.emergency_access set status='granted',valid_until=now()+interval '5 hours' where id=$1`,[em]),'dostęp awaryjny dłużej niż 60 min → odrzucony');
await as('admin',`update public.emergency_access set status='granted',valid_until=now()+interval '60 minutes',decided_by=$2 where id=$1`,[em,U.admin]);
R((await as('tech',`select * from public.cases`)).rows.length===2,'dostęp awaryjny po zgodzie — czasowy wgląd');
// --- uprawnienia
await as('admin',`insert into public.permission_overrides(user_id,perm,level,reason) values($1,'initial_fee',1,'rozliczenie sprawy SKD')`,[U.anna]);
R((await db.query(`select count(*)::int n from public.audit_log where action='uprawnienia.zmiana'`)).rows[0].n===1,'nadanie uprawnienia w audycie');
R(!!await fails('jan',`insert into public.permission_overrides(user_id,perm,level,reason) values($1,'audit',2,'chcę widzieć')`,[U.jan]),'nadawać uprawnienia może tylko Administrator');
R(!!await fails('admin',`update public.profiles set role='att' where id=$1`,[U.admin]),'nie można usunąć ostatniego Administratora');
// --- zgłoszenia ze strony (anon)
await as('anon',`insert into public.leads(category,calc,client_name,phone,consent) values('SKD','{"name":"SKD"}','Zofia Test','500100200',true)`);
R(true,'anonimowy formularz: INSERT zgłoszenia działa');
R(!!await fails('anon',`select * from public.leads`),'anonimowy nie odczyta zgłoszeń');
R(!!await fails('anon',`insert into public.leads(category,client_name,phone,consent,status) values('SKD','X Y','500100200',true,'przyjęte')`),'anonimowy nie ustawi statusu');
R(!!await fails('anon',`select * from public.cases`),'anonimowy: brak dostępu do spraw');
R(!!await fails('anon',`select public.reveal_pesel(gen_random_uuid())`),'anonimowy: brak dostępu do funkcji');
R((await as('kasia',`select * from public.leads`)).rows.length===1&&(await as('anna',`select * from public.leads`)).rows.length===0,'zgłoszenia widzi Biuro, aplikant nie');
// --- audyt
R(!!await fails('admin',`update public.audit_log set details='x' where id=1`),'UPDATE audytu → odmowa (Administrator)');
let su=null;try{await db.query(`delete from public.audit_log where id=1`)}catch(e){su=e.message}
R(!!su,'DELETE audytu odrzucony nawet dla właściciela bazy (trigger)');
const v=(await as('admin',`select * from public.verify_audit_chain()`)).rows[0];
R(v.ok,`łańcuch skrótów poprawny (${v.checked} wpisów)`);
await db.exec(`alter table public.audit_log disable trigger audit_no_update; update public.audit_log set details='zmienione' where id=3; alter table public.audit_log enable trigger audit_no_update;`);
const v2=(await as('admin',`select * from public.verify_audit_chain()`)).rows[0];
R(!v2.ok&&v2.broken_at==3,`manipulacja wykryta przy wpisie #${v2.broken_at}`);
R(!!await fails('jan',`select * from public.verify_audit_chain()`),'weryfikacja audytu: tylko z uprawnieniem');
const h=(await as('admin',`select text from public.case_history where case_id=$1 order by id`,[c1])).rows.map(r=>r.text);
R(h.some(t=>t.startsWith('Administrator dołączył'))&&h.some(t=>t.startsWith('Nadano zakres'))&&h.some(t=>t.startsWith('Odebrano dostęp')),'historia zespołu: dołączono / zakres / odebrano');

// --- 2FA egzekwowane w bazie (migracja 002)
AAL='aal1';
R((await as('admin',`select * from public.cases`)).rows.length===0,'Administrator bez 2FA (aal1): 0 spraw');
R((await as('jan',`select * from public.cases`)).rows.length===0,'pełnomocnik bez 2FA: 0 spraw');
R((await as('kasia',`select * from public.leads`)).rows.length===1,'biuro (2FA niewymagane) działa w aal1');
R(!!await fails('admin',`select public.reveal_pesel((select client_id from public.cases limit 1))`),'aal1: funkcje wrażliwe odrzucone');
AAL='aal2';
R((await as('admin',`select * from public.cases`)).rows.length===2,'Administrator z 2FA (aal2): widzi sprawy');
// --- magazyn akt
await as('admin',`insert into public.case_members(case_id,user_id,role,access_finance) values($1,$2,'app',false)`,[c2,U.anna]);
R(!(await fails('anna',`insert into storage.objects(bucket_id,name) values('akta',$1)`,[c2+'/x/v1-pozew.pdf'])),'aplikant w zespole: zapis pliku do akt sprawy');
R(!!await fails('anna',`insert into storage.objects(bucket_id,name) values('akta',$1)`,[c1+'/x/v1-pozew.pdf']),'aplikant spoza sprawy: zapis do akt odrzucony');
R((await as('jan',`select * from storage.objects`)).rows.length===0,'pełnomocnik spoza sprawy nie widzi plików');
R((await as('piotr',`select * from storage.objects`)).rows.length===1,'pełnomocnik prowadzący widzi plik w aktach');
R(!!await fails('anna',`insert into storage.objects(bucket_id,name) values('akta','zla-sciezka/plik.pdf')`),'zła ścieżka pliku odrzucona');
await fails('admin',`delete from storage.objects`);R((await db.query('select count(*)::int n from storage.objects')).rows[0].n===1,'pliki w aktach bez kasowania (DELETE nic nie usuwa)');

// --- migracja 004: uzupełnienia specyfikacji
const N=async(who,ev)=>(await as(who,`select * from public.notifications where event_type=$1`,[ev])).rows;
db.exec("delete from public.notifications");
const c3=(await as('admin',`select public.create_case('CIV','Ola','Nowa',$1) id`,[U.jan])).rows[0].id;
R((await N('admin','case.new')).length===1&&(await N('jan','case.new')).length===1,'nowa sprawa → Administrator i zespół sprawy');
await as('anon',`insert into public.leads(category,calc,client_name,phone,consent) values('SKD','{}','Lena Test','500100200',true)`);
R((await N('kasia','lead.new')).length===1&&(await N('anna','lead.new')).length===0,'zgłoszenie ze strony → Biuro (Nowe sprawy), nie aplikant');
const dc=(await as('jan',`insert into public.documents(case_id,name) values($1,'pozew.pdf') returning id`,[c3])).rows[0].id;
await as('jan',`insert into public.document_versions(document_id,version,storage_path,size_bytes,sha256) values($1,1,'x',1,repeat('a',64))`,[dc]);
R((await N('jan','document.new')).length===1,'dodanie dokumentu → zespół sprawy');
await as('admin',`update public.cases set status='closed',closed_at=current_date where id=$1`,[c3]);
R((await N('jan','case.closed')).length===1&&(await N('admin','case.closed')).length===1,'zakończenie sprawy → prowadzący i Administrator');
await as('admin',`update public.attorney_fees set sf_status='spełniony' where case_id=$1`,[c3]);
R((await N('jan','fee.success')).length===1&&(await N('admin','fee.success')).length===1&&(await N('anna','fee.success')).length===0,'success fee → pełnomocnik i Administrator, nie aplikant');
// reguły: wyłączenie i blokada terminów
await as('admin',`update public.notification_rules set enabled=false where event_type='document.new'`);
const dc2=(await as('jan',`insert into public.documents(case_id,name) values($1,'b.pdf') returning id`,[c3])).rows[0].id;
await as('jan',`insert into public.document_versions(document_id,version,storage_path,size_bytes,sha256) values($1,1,'y',1,repeat('b',64))`,[dc2]).catch(()=>{});
R((await N('jan','document.new')).length===1,'wyłączona reguła → brak nowych powiadomień');
R(!!await fails('admin',`update public.notification_rules set enabled=false where event_type='deadline.overdue'`),'powiadomień o terminach nie można wyłączyć');
R(!!await fails('jan',`update public.notification_rules set enabled=true where event_type='document.new'`)||(await db.query(`select enabled from public.notification_rules where event_type='document.new'`)).rows[0].enabled===false,'reguły zmienia tylko Administrator');
// zastępstwo
db.exec("delete from public.notifications");
await as('admin',`insert into public.user_substitutes(user_id,substitute_id,date_from,date_to,reason) values($1,$2,current_date,current_date+5,'urlop')`,[U.jan,U.piotr]);
R(!!await fails('jan',`insert into public.user_substitutes(user_id,substitute_id,date_from,date_to) values($1,$2,current_date,current_date)`,[U.jan,U.anna]),'zastępstwo ustawia tylko Administrator');
await as('admin',`insert into public.deadlines(case_id,type,title,final_due_date,responsible_user_id) values($1,'internal','Pismo z zastępstwem',current_date+3,$2)`,[c1,U.jan]);
await db.query('select public.run_deadline_reminders()');
const sub=(await as('piotr',`select body from public.notifications where event_type='deadline.approaching'`)).rows;
R(sub.length>=1&&sub[0].body.startsWith('Zastępstwo za'),'przypomnienie trafia też do zastępcy (z dopiskiem)');
// harmonogram per typ
db.exec("delete from public.notifications");
await as('admin',`update public.deadline_reminder_rules set offsets='{2}' where type='internal'`);
await db.query('select public.run_deadline_reminders()');
R((await as('jan',`select * from public.notifications where event_type='deadline.approaching' and title like '%Pismo z zastępstwem%'`)).rows.length===0,'harmonogram per typ: T-2 dla wewnętrznych → przy 3 dniach brak przypomnienia');
await as('admin',`update public.deadline_reminder_rules set offsets='{14,7,3,1,0}' where type='internal'`);
// uprawnienia Administratora: świeże hasło + 2FA
R(!!await fails('admin',`insert into public.permission_overrides(user_id,perm,level,reason) values($1,'audit',0,'test zmiany admina')`,[U.admin]),'zmiana uprawnień Administratora bez ponownego potwierdzenia → odmowa');
R(!!await fails('admin',`update public.profiles set role='admin' where id=$1`,[U.kasia]),'nadanie roli Administratora bez potwierdzenia → odmowa');
const now=Math.floor(Date.now()/1000);AMR=[{method:'password',timestamp:now},{method:'totp',timestamp:now}];
R(!await fails('admin',`update public.profiles set role='admin' where id=$1`,[U.kasia]),'po potwierdzeniu hasłem i 2FA → zmiana przechodzi');
await as('admin',`update public.profiles set role='office' where id=$1`,[U.kasia]);
AMR=[{method:'password',timestamp:now-900},{method:'totp',timestamp:now-900}];
R(!!await fails('admin',`update public.profiles set role='admin' where id=$1`,[U.kasia]),'potwierdzenie starsze niż 5 min → odmowa');
AMR=[];
R(!await fails('admin',`insert into public.permission_overrides(user_id,perm,level,reason) values($1,'initial_fee',1,'zwykła zmiana')`,[U.piotr]),'uprawnienia innych ról bez ponownego potwierdzenia');
// raporty aplikanta
R((await db.query(`select level from public.role_permissions where role='app' and perm='reports'`)).rows[0]?.level===1,'aplikant ma raporty (zakres: własne dane)');

