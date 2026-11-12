/* Granty — wspólne: i18n, motyw, słowniki, silnik raportu */
const APP_VERSION = '3.0.0';
/* CRM kancelarii (Lexsalus/PiK, Supabase): treści serwisu (grants_content) i zgłoszenia (leads, kategoria DOT).
   Klucz publiczny (publishable) — bezpieczny w kodzie strony; dostęp ogranicza RLS w bazie. */
const KANCELARIA = { url:'https://eamobnucjsavahpxilrt.supabase.co', key:'sb_publishable_jwyxht3egYyB_dAPrWHkRw_68bmBctB', crm:'../crm.html#/dotacje' };

const I18N = {
  pl: {
    'lang.name':'Polski','theme.day':'Dzień','theme.night':'Noc',
    'nav.check':'Sprawdź możliwości','nav.about':'O nas','nav.contact':'Kontakt',
    'hero.title':'Sprawdź, ile możesz zyskać z dotacji',
    'hero.lead':'Opisz krótko swoją działalność. Przygotujemy wstępny raport z możliwościami finansowania dla Twojej firmy lub organizacji.',
    'in.desc':'Czym się zajmujesz?','in.desc.ph':'np. mam firmę produkującą wyroby z drewna, chcę kupić nowe maszyny…',
    'in.more':'Doprecyzuj (opcjonalnie)','in.form':'Kim jesteś','in.region':'Województwo','in.goals':'Na co potrzebujesz środków','in.any':'— dowolnie —',
    'in.start':'Sprawdź możliwości','in.short':'Opisz działalność w kilku słowach (min. 10 znaków).',
    'run.title':'Przygotowujemy Twój raport','run.lead':'Analiza potrwa kilka minut. Nie zamykaj tej strony.',
    'run.s1':'Analiza profilu działalności','run.s2':'Przegląd programów krajowych','run.s3':'Przegląd funduszy regionalnych','run.s4':'Sprawdzanie dotacji dla Twojej branży',
    'run.s5':'Weryfikacja instrumentów zwrotnych i ulg','run.s6':'Szacowanie potencjalnych kwot','run.s7':'Przygotowanie raportu',
    'rep.title':'Twój wstępny raport','rep.for':'Dla działalności:','rep.plan':'Plan {x}','rep.potential':'Potencjalna możliwość','rep.upto':'do {x}','rep.range':'{a} – {b}',
    'rep.total':'Łączny potencjał finansowania','rep.none':'Na podstawie opisu nie udało się dopasować ogólnodostępnych programów. Skontaktuj się z nami — specjalista sprawdzi to indywidualnie.',
    'rep.note':'Raport ma charakter poglądowy i pokazuje ogólnodostępne źródła finansowania. Kwoty są orientacyjne, a o szczegółach, warunkach i aktualnych naborach powie Ci nasz specjalista od dotacji.',
    'rep.again':'Sprawdź inną działalność','rep.cta':'Chcesz wiedzieć więcej? Zostaw kontakt — specjalista od dotacji odezwie się do Ciebie.',
    'cf.name':'Imię i nazwisko','cf.company':'Firma / organizacja','cf.email':'E-mail','cf.phone':'Telefon','cf.msg':'Wiadomość (opcjonalnie)',
    'cf.consent':'Wyrażam zgodę na kontakt w sprawie możliwości finansowania i przetwarzanie podanych danych w tym celu.',
    'cf.send':'Wyślij — proszę o kontakt','cf.sent':'Dziękujemy! Skontaktujemy się z Tobą wkrótce.','cf.err':'Nie udało się wysłać formularza. Spróbuj ponownie lub napisz do nas bezpośrednio.','cf.req':'Podaj imię i nazwisko, telefon i zaznacz zgodę.','cf.limit':'Zbyt wiele zgłoszeń — spróbuj ponownie za godzinę lub zadzwoń do nas.',
    'cf.mailto':'Otworzyliśmy Twój program pocztowy z gotową wiadomością — wystarczy ją wysłać.',
    'about.title':'O nas','about.text':'Pomagamy firmom i organizacjom pozyskiwać dotacje, granty i preferencyjne finansowanie. Sprawdzamy możliwości, dobieramy programy i prowadzimy cały proces z naszym specjalistą od dotacji.',
    'contact.title':'Kontakt','foot.note':'Informacje mają charakter poglądowy i nie stanowią oferty.',
    /* panel */
    'a.title':'Panel administracyjny','a.programs':'Źródła finansowania','a.preview':'Podgląd raportu','a.settings':'Ustawienia',
    'a.add':'Dodaj','a.edit':'Edytuj','a.del':'Usuń','a.save':'Zapisz','a.cancel':'Anuluj','a.confirmDel':'Na pewno usunąć?','a.none':'Brak.',
    'a.sync':'Zapisz w GitHub','a.unsaved':'Niezapisane zmiany','a.saved':'Zapisano','a.localonly':'Dane tylko w tej przeglądarce','a.pull':'Pobierz z GitHub',
    'a.active':'Aktywny','a.inactive':'Wyłączony','a.tier':'Plan','a.tier.A':'A — mniejsze, szybsze','a.tier.B':'B — duże inwestycje','a.tier.C':'C — dodatkowe (pożyczki, ulgi)',
    'p.name':'Nazwa źródła','p.desc':'Krótki opis (co można uzyskać)','p.min':'Kwota od (zł)','p.max':'Kwota do (zł)','p.forms':'Dla kogo','p.goals':'Cele','p.regions':'Województwa (puste = cała Polska)',
    'p.words':'Słowa-klucze branży (rdzenie, po przecinku)','p.words.ph':'np. drewn, meb, stolar','p.weight':'Waga (0–10)','p.lang':'Tłumaczenia (opcjonalnie)',
    'pv.info':'Podgląd działa od razu, bez licznika. Pokazuje też punktację i powód dopasowania.','pv.run':'Pokaż raport','pv.score':'pkt',
    'r.kw':'słowa-klucze: {x}','r.goal':'cele: {x}','r.weight':'waga {x}',
    's.site':'Strona','s.siteName':'Nazwa serwisu','s.heroTitle':'Nagłówek','s.heroLead':'Podtytuł','s.about':'Tekst „O nas”','s.defLang':'Domyślny język','s.defTheme':'Domyślny motyw',
    's.timer':'Czas licznika (sekundy)','s.planC':'Pokazuj Plan C (pożyczki, ulgi)','s.contact':'Kontakt','s.cEmail':'E-mail','s.cPhone':'Telefon','s.cAddr':'Adres',
    's.form':'Formularz kontaktowy','s.formEndpoint':'Adres odbioru formularza (np. Formspree / Web3Forms)','s.formKey':'Klucz dostępu (dla Web3Forms)',
    's.form.info':'Bez adresu odbioru formularz otworzy program pocztowy klienta z wiadomością na e-mail kontaktowy.',
    's.gh':'Zapis na stronę (GitHub)','s.token':'Token GitHub (fine-grained, Contents: read & write)','s.repo':'Repo (właściciel/nazwa)','s.branch':'Gałąź',
    's.gh.info':'„Zapisz w GitHub” publikuje data/programy.json i data/settings.json. Token jest przechowywany tylko w tej przeglądarce.',
    's.test':'Sprawdź połączenie','s.test.ok':'Połączenie OK','s.test.fail':'Błąd: {e}',
    'sync.ok':'Zapisano w GitHub — strona zaktualizuje się za ok. minutę','sync.fail':'Zapis nieudany: {e}','sync.noconf':'Uzupełnij token w Ustawieniach.',
    'pull.ok':'Pobrano z GitHub','pull.fail':'Pobieranie nieudane: {e}','pull.dirty':'Masz niezapisane zmiany — pobranie je nadpisze. Kontynuować?'
  },
  uk: {
    'lang.name':'Українська','theme.day':'День','theme.night':'Ніч',
    'nav.check':'Перевірити можливості','nav.about':'Про нас','nav.contact':'Контакти',
    'hero.title':'Дізнайтеся, скільки можна отримати з грантів',
    'hero.lead':'Коротко опишіть свою діяльність. Ми підготуємо попередній звіт про можливості фінансування для вашої компанії чи організації.',
    'in.desc':'Чим ви займаєтеся?','in.desc.ph':'напр. маю компанію з виробництва виробів з дерева, хочу купити нові верстати…',
    'in.more':'Уточнити (необов’язково)','in.form':'Хто ви','in.region':'Воєводство','in.goals':'На що потрібні кошти','in.any':'— будь-що —',
    'in.start':'Перевірити можливості','in.short':'Опишіть діяльність кількома словами (мін. 10 символів).',
    'run.title':'Готуємо ваш звіт','run.lead':'Аналіз триватиме кілька хвилин. Не закривайте сторінку.',
    'run.s1':'Аналіз профілю діяльності','run.s2':'Огляд національних програм','run.s3':'Огляд регіональних фондів','run.s4':'Перевірка грантів для вашої галузі',
    'run.s5':'Перевірка позик і пільг','run.s6':'Оцінка потенційних сум','run.s7':'Підготовка звіту',
    'rep.title':'Ваш попередній звіт','rep.for':'Для діяльності:','rep.plan':'План {x}','rep.potential':'Потенційна можливість','rep.upto':'до {x}','rep.range':'{a} – {b}',
    'rep.total':'Загальний потенціал фінансування','rep.none':'За описом не вдалося підібрати загальнодоступні програми. Зв’яжіться з нами — спеціаліст перевірить індивідуально.',
    'rep.note':'Звіт має оглядовий характер і показує загальнодоступні джерела фінансування. Суми орієнтовні, а про деталі, умови й актуальні набори розповість наш спеціаліст із грантів.',
    'rep.again':'Перевірити іншу діяльність','rep.cta':'Хочете дізнатися більше? Залиште контакт — спеціаліст із грантів зв’яжеться з вами.',
    'cf.name':'Ім’я та прізвище','cf.company':'Компанія / організація','cf.email':'E-mail','cf.phone':'Телефон','cf.msg':'Повідомлення (необов’язково)',
    'cf.consent':'Погоджуюся на контакт щодо можливостей фінансування та обробку наданих даних із цією метою.',
    'cf.send':'Надіслати — прошу зв’язатися','cf.sent':'Дякуємо! Ми незабаром зв’яжемося з вами.','cf.err':'Не вдалося надіслати форму. Спробуйте ще раз або напишіть нам напряму.','cf.req':'Вкажіть ім’я та прізвище, телефон і позначте згоду.','cf.limit':'Забагато заявок — спробуйте через годину або зателефонуйте нам.',
    'cf.mailto':'Ми відкрили вашу поштову програму з готовим листом — залишилося його надіслати.',
    'about.title':'Про нас','about.text':'Допомагаємо компаніям та організаціям отримувати гранти, дотації та пільгове фінансування. Перевіряємо можливості, підбираємо програми й ведемо весь процес разом із нашим спеціалістом.',
    'contact.title':'Контакти','foot.note':'Інформація має оглядовий характер і не є пропозицією.',
    'a.title':'Адміністративна панель','a.programs':'Джерела фінансування','a.preview':'Попередній перегляд звіту','a.settings':'Налаштування',
    'a.add':'Додати','a.edit':'Редагувати','a.del':'Видалити','a.save':'Зберегти','a.cancel':'Скасувати','a.confirmDel':'Точно видалити?','a.none':'Немає.',
    'a.sync':'Зберегти в GitHub','a.unsaved':'Незбережені зміни','a.saved':'Збережено','a.localonly':'Дані лише в цьому браузері','a.pull':'Завантажити з GitHub',
    'a.active':'Активне','a.inactive':'Вимкнено','a.tier':'План','a.tier.A':'A — менші, швидші','a.tier.B':'B — великі інвестиції','a.tier.C':'C — додаткові (позики, пільги)',
    'p.name':'Назва джерела','p.desc':'Короткий опис (що можна отримати)','p.min':'Сума від (зл)','p.max':'Сума до (зл)','p.forms':'Для кого','p.goals':'Цілі','p.regions':'Воєводства (порожньо = вся Польща)',
    'p.words':'Ключові слова галузі (основи, через кому)','p.words.ph':'напр. drewn, meb, stolar','p.weight':'Вага (0–10)','p.lang':'Переклади (необов’язково)',
    'pv.info':'Попередній перегляд працює одразу, без таймера. Показує також бали та причину відповідності.','pv.run':'Показати звіт','pv.score':'бал.',
    'r.kw':'ключові слова: {x}','r.goal':'цілі: {x}','r.weight':'вага {x}',
    's.site':'Сайт','s.siteName':'Назва сервісу','s.heroTitle':'Заголовок','s.heroLead':'Підзаголовок','s.about':'Текст «Про нас»','s.defLang':'Мова за замовчуванням','s.defTheme':'Тема за замовчуванням',
    's.timer':'Час таймера (секунди)','s.planC':'Показувати План C (позики, пільги)','s.contact':'Контакти','s.cEmail':'E-mail','s.cPhone':'Телефон','s.cAddr':'Адреса',
    's.form':'Контактна форма','s.formEndpoint':'Адреса прийому форми (напр. Formspree / Web3Forms)','s.formKey':'Ключ доступу (для Web3Forms)',
    's.form.info':'Без адреси прийому форма відкриє поштову програму клієнта з листом на контактний e-mail.',
    's.gh':'Збереження на сайт (GitHub)','s.token':'Токен GitHub (fine-grained, Contents: read & write)','s.repo':'Репозиторій (власник/назва)','s.branch':'Гілка',
    's.gh.info':'«Зберегти в GitHub» публікує data/programy.json і data/settings.json. Токен зберігається лише в цьому браузері.',
    's.test':'Перевірити з’єднання','s.test.ok':'З’єднання OK','s.test.fail':'Помилка: {e}',
    'sync.ok':'Збережено в GitHub — сайт оновиться приблизно за хвилину','sync.fail':'Не вдалося зберегти: {e}','sync.noconf':'Заповніть токен у Налаштуваннях.',
    'pull.ok':'Завантажено з GitHub','pull.fail':'Не вдалося завантажити: {e}','pull.dirty':'Є незбережені зміни — завантаження їх перезапише. Продовжити?'
  },
  en: {
    'lang.name':'English','theme.day':'Day','theme.night':'Night',
    'nav.check':'Check options','nav.about':'About us','nav.contact':'Contact',
    'hero.title':'See how much you could gain from grants',
    'hero.lead':'Briefly describe what you do. We will prepare a preliminary report on funding options for your company or organisation.',
    'in.desc':'What do you do?','in.desc.ph':'e.g. I run a company making wooden products and want to buy new machines…',
    'in.more':'Add details (optional)','in.form':'Who you are','in.region':'Voivodeship','in.goals':'What you need funding for','in.any':'— any —',
    'in.start':'Check my options','in.short':'Describe your activity in a few words (min. 10 characters).',
    'run.title':'Preparing your report','run.lead':'The analysis takes a few minutes. Please keep this page open.',
    'run.s1':'Analysing your business profile','run.s2':'Reviewing national programmes','run.s3':'Reviewing regional funds','run.s4':'Checking grants for your sector',
    'run.s5':'Checking loans and tax reliefs','run.s6':'Estimating potential amounts','run.s7':'Preparing the report',
    'rep.title':'Your preliminary report','rep.for':'For:','rep.plan':'Plan {x}','rep.potential':'Potential opportunity','rep.upto':'up to {x}','rep.range':'{a} – {b}',
    'rep.total':'Total funding potential','rep.none':'We could not match any generally available programmes to this description. Contact us — a specialist will check individually.',
    'rep.note':'This report is indicative and shows generally available funding sources. Amounts are approximate; our grant specialist will tell you about details, conditions and current calls.',
    'rep.again':'Check another activity','rep.cta':'Want to know more? Leave your contact — our grant specialist will get in touch.',
    'cf.name':'Full name','cf.company':'Company / organisation','cf.email':'E-mail','cf.phone':'Phone','cf.msg':'Message (optional)',
    'cf.consent':'I agree to be contacted about funding options and to the processing of the data provided for this purpose.',
    'cf.send':'Send — please contact me','cf.sent':'Thank you! We will contact you shortly.','cf.err':'The form could not be sent. Please try again or write to us directly.','cf.req':'Enter your name, phone number and tick the consent.','cf.limit':'Too many requests — try again in an hour or call us.',
    'cf.mailto':'We opened your e-mail app with a ready message — just send it.',
    'about.title':'About us','about.text':'We help companies and organisations obtain grants, subsidies and preferential funding. We check the options, select programmes and run the whole process with our grant specialist.',
    'contact.title':'Contact','foot.note':'Information is indicative and does not constitute an offer.',
    'a.title':'Admin panel','a.programs':'Funding sources','a.preview':'Report preview','a.settings':'Settings',
    'a.add':'Add','a.edit':'Edit','a.del':'Delete','a.save':'Save','a.cancel':'Cancel','a.confirmDel':'Delete this item?','a.none':'None.',
    'a.sync':'Save to GitHub','a.unsaved':'Unsaved changes','a.saved':'Saved','a.localonly':'Data in this browser only','a.pull':'Load from GitHub',
    'a.active':'Active','a.inactive':'Disabled','a.tier':'Plan','a.tier.A':'A — smaller, faster','a.tier.B':'B — large investments','a.tier.C':'C — extra (loans, reliefs)',
    'p.name':'Source name','p.desc':'Short description (what can be obtained)','p.min':'Amount from (PLN)','p.max':'Amount up to (PLN)','p.forms':'For whom','p.goals':'Goals','p.regions':'Voivodeships (empty = all of Poland)',
    'p.words':'Sector keywords (stems, comma-separated)','p.words.ph':'e.g. drewn, meb, stolar','p.weight':'Weight (0–10)','p.lang':'Translations (optional)',
    'pv.info':'The preview runs instantly, without the timer, and shows scores and match reasons.','pv.run':'Show report','pv.score':'pts',
    'r.kw':'keywords: {x}','r.goal':'goals: {x}','r.weight':'weight {x}',
    's.site':'Site','s.siteName':'Site name','s.heroTitle':'Headline','s.heroLead':'Subtitle','s.about':'“About us” text','s.defLang':'Default language','s.defTheme':'Default theme',
    's.timer':'Timer length (seconds)','s.planC':'Show Plan C (loans, reliefs)','s.contact':'Contact','s.cEmail':'E-mail','s.cPhone':'Phone','s.cAddr':'Address',
    's.form':'Contact form','s.formEndpoint':'Form endpoint (e.g. Formspree / Web3Forms)','s.formKey':'Access key (for Web3Forms)',
    's.form.info':'Without an endpoint, the form opens the client’s e-mail app with a message to the contact e-mail.',
    's.gh':'Publishing (GitHub)','s.token':'GitHub token (fine-grained, Contents: read & write)','s.repo':'Repo (owner/name)','s.branch':'Branch',
    's.gh.info':'“Save to GitHub” publishes data/programy.json and data/settings.json. The token is stored only in this browser.',
    's.test':'Test connection','s.test.ok':'Connection OK','s.test.fail':'Error: {e}',
    'sync.ok':'Saved to GitHub — the site updates in about a minute','sync.fail':'Save failed: {e}','sync.noconf':'Fill in the token in Settings.',
    'pull.ok':'Loaded from GitHub','pull.fail':'Load failed: {e}','pull.dirty':'You have unsaved changes — loading will overwrite them. Continue?'
  }
};


/* słowniki i silnik raportu: assets/engine.js (wspólny ze CRM kancelarii) */
const {FORMS, GOALS, REGIONS, analyseInput, scoreProgram, buildReport} = GRANTY;
for(const l in GRANTY.LABELS) Object.assign(I18N[l], GRANTY.LABELS[l]);
const LANGS = ['pl','uk','en'];
const LIDX = {pl:0,uk:1,en:2};
const store = {
  get(k,d){ try{ const v=localStorage.getItem('granty.'+k); return v==null?d:JSON.parse(v);}catch(e){return d;} },
  set(k,v){ try{ localStorage.setItem('granty.'+k, JSON.stringify(v)); }catch(e){} }
};
let LANG = store.get('lang', null);
function t(key, vars){
  let s = (I18N[LANG]&&I18N[LANG][key]) ?? I18N.pl[key] ?? key;
  if(vars) for(const k in vars) s = s.replaceAll('{'+k+'}', vars[k]);
  return s;
}
const ml = o => !o ? '' : typeof o==='string' ? o : (o[LANG] || o.pl || '');
const regionName = k => REGIONS[k] ? REGIONS[k][LIDX[LANG]] : k;

function applyI18n(root=document){
  root.querySelectorAll('[data-i]').forEach(el=>{ el.textContent = t(el.dataset.i); });
  root.querySelectorAll('[data-ph]').forEach(el=>{ el.placeholder = t(el.dataset.ph); });
  document.documentElement.lang = LANG;
  document.querySelectorAll('[data-lang]').forEach(b=>b.classList.toggle('on', b.dataset.lang===LANG));
  document.querySelectorAll('[data-themebtn]').forEach(b=>{ const d=document.documentElement.dataset.theme==='dark'; b.textContent=d?'☀':'☾'; b.title=d?t('theme.day'):t('theme.night'); });
}
function setLang(l){ LANG=l; store.set('lang', l); applyI18n(); document.dispatchEvent(new Event('langchange')); }
function setTheme(th){ document.documentElement.dataset.theme = th; store.set('theme', th); applyI18n(); }
function toggleTheme(){ setTheme(document.documentElement.dataset.theme==='dark' ? 'light' : 'dark'); }
function initPrefs(defLang, defTheme){
  if(!LANG || !LANGS.includes(LANG)) LANG = defLang || 'pl';
  const th = store.get('theme', null) || defTheme || 'light';
  document.documentElement.dataset.theme = th; applyI18n();
}
function toolsHTML(){
  return `<div class="seg">${LANGS.map(l=>`<button data-lang="${l}" onclick="setLang('${l}')">${l.toUpperCase()}</button>`).join('')}</div>
  <button class="iconbtn" data-themebtn onclick="toggleTheme()"></button>`;
}

/* helpers */
const $ = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>[...r.querySelectorAll(s)];
const esc = s => String(s??'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid = ()=> Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const LOCALE = ()=>({pl:'pl-PL',uk:'uk-UA',en:'en-GB'}[LANG]);
function fmtMoney(n){
  n=Number(n)||0;
  if(n>=1e6){ const v=n/1e6; return v.toLocaleString(LOCALE(),{maximumFractionDigits:1})+' '+({pl:'mln zł',uk:'млн зл',en:'m PLN'}[LANG]); }
  if(n>=1e3){ return Math.round(n/1e3).toLocaleString(LOCALE())+' '+({pl:'tys. zł',uk:'тис. зл',en:'k PLN'}[LANG]); }
  return n.toLocaleString(LOCALE())+' '+({pl:'zł',uk:'зл',en:'PLN'}[LANG]);
}
function amountText(p){ return p.kwotaMin ? t('rep.range',{a:fmtMoney(p.kwotaMin), b:fmtMoney(p.kwotaMax)}) : t('rep.upto',{x:fmtMoney(p.kwotaMax)}); }
function toast(msg){
  let el=$('#toast'); if(!el){ el=document.createElement('div'); el.id='toast'; el.className='toast'; document.body.appendChild(el); }
  el.textContent=msg; el.classList.add('show'); clearTimeout(el._t); el._t=setTimeout(()=>el.classList.remove('show'),2800);
}
function nl2p(s){ return esc(s||'').split(/\n{2,}/).map(p=>`<p>${p.replace(/\n/g,'<br>')}</p>`).join(''); }
