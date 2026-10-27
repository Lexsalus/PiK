/* =====================================================================
   PODPOWIEDZI W CRM
   • [data-tip] — dymek po najechaniu myszą lub przejściu klawiszem Tab,
   • ikonka [?] przy polach i nagłówkach, których znaczenie nie jest oczywiste.
   Teksty są zebrane tutaj (słowniki niżej) i dopinane automatycznie do każdego
   widoku i okna — po zmianie treści przycisku lub pola wystarczy poprawić słownik.
   ===================================================================== */
(()=>{
document.head.insertAdjacentHTML('beforeend',`<style>
.hlp{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border-radius:50%;border:1px solid var(--line);color:var(--mut);font-size:.68rem;font-weight:700;margin-left:5px;cursor:help;vertical-align:middle;flex:none;line-height:1;font-style:normal;text-transform:none;letter-spacing:0}
.hlp:hover,.hlp:focus{color:var(--txt);border-color:var(--accent);outline:0}
#tip{position:fixed;z-index:9999;max-width:320px;background:var(--card2);color:var(--txt);border:1px solid var(--line);border-radius:8px;padding:7px 10px;font-size:.8rem;font-weight:500;line-height:1.4;box-shadow:0 6px 24px rgba(0,0,0,.35);pointer-events:none;opacity:0;transition:opacity .12s;white-space:normal;text-align:left;text-transform:none;letter-spacing:0}
#tip.show{opacity:1}
.lbt{display:inline-flex;align-items:center;gap:0}
@media print{.hlp,#tip{display:none!important}}
</style>`);

/* --- dymek --- */
const tip=document.createElement('div');tip.id='tip';tip.setAttribute('role','tooltip');document.body.appendChild(tip);let cur=null;
const show=el=>{cur=el;tip.textContent=el.dataset.tip;tip.classList.add('show');const r=el.getBoundingClientRect(),w=tip.offsetWidth,h=tip.offsetHeight;
  let x=Math.min(Math.max(8,r.left+r.width/2-w/2),innerWidth-w-8),y=r.bottom+8;if(y+h>innerHeight-8)y=r.top-h-8;tip.style.left=x+'px';tip.style.top=y+'px'};
const hide=()=>{cur=null;tip.classList.remove('show')};
document.addEventListener('mouseover',e=>{const el=e.target.closest?.('[data-tip]:not([data-tip=""])');if(el&&el!==cur)show(el);else if(!el&&cur)hide()});
document.addEventListener('focusin',e=>{const el=e.target.closest?.('[data-tip]:not([data-tip=""])');el?show(el):hide()});
document.addEventListener('focusout',hide);addEventListener('scroll',hide,true);addEventListener('hashchange',hide);
document.addEventListener('click',e=>{const h=e.target.closest?.('.hlp');if(h){e.preventDefault();e.stopPropagation();show(h)}else hide()},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape')hide()});
const hlpEl=t=>{const s=document.createElement('span');s.className='hlp';s.tabIndex=0;s.dataset.tip=t;s.textContent='?';s.setAttribute('aria-label','Pomoc: '+t);return s};

/* --- lewe menu (po adresie) --- */
const NAV={
  pulpit:'Twoje sprawy, terminy na dziś, zadania i powiadomienia — tylko ze spraw, do których masz dostęp.',
  sprawy:'Lista spraw z filtrami. Widzisz tylko sprawy, w których jesteś w zespole (Administrator — wszystkie).',
  nowe:'Zgłoszenia z formularza „Co mi się należy” na stronie. Z każdego można założyć sprawę albo je odrzucić z powodem.',
  terminy:'Kalendarz i lista terminów procesowych, sądowych i wewnętrznych z kalkulatorem terminu. Licznik = terminy pilne i przekroczone.',
  powiadomienia:'Powiadomienia ze spraw, do których masz dostęp. Licznik = nieprzeczytane.',
  zespol:'Osoby w kancelarii, ich role i obciążenie sprawami.',
  finanse:'Wpływy od klientów, podział środków i wynagrodzenia. Zakres zależy od uprawnień — pełnomocnik widzi tylko swoje rozliczenie.',
  raporty:'Raporty liczone w bazie, w zakresie Twoich uprawnień. Wynik jest pamiętany 5 minut.',
  strona:'Treści strony publicznej: porównywarka, kalkulatory, analiza umów, tłumaczenia, SEO. Zmiany są szkicem do czasu „Opublikuj”.',
  ustawienia:'Kategorie, użytkownicy i uprawnienia, święta, powiadomienia, przypomnienia, system, dziennik audytu i Twoje konto.'};

/* --- zakładki (po tekście) --- */
const TAB={
  'Dane klienta':'Dane osobowe klienta i podstawowe informacje o sprawie. PESEL jest maskowany — pełny wgląd tylko z uprawnieniem (zapis w audycie).',
  'Finanse':'Opłata wstępna, wpływy, podział środków i wynagrodzenie pełnomocnika — widoczne wg uprawnień.',
  'Terminy':'Terminy tej sprawy: przypomnienia, potwierdzenie daty przez kontrolera, zamknięcie z potwierdzeniem.',
  'Etapy':'Proces sprawy krok po kroku. Zatwierdzony etap blokuje swoje wpisy — zmiana tylko przez wniosek o korektę.',
  'Dokumenty':'Pliki sprawy z wersjami i skrótem SHA-256. Podmiana pliku tworzy nową wersję, stara zostaje.',
  'Zespół':'Kto pracuje przy sprawie i z jakim zakresem dostępu. Dodaje i odbiera dostęp tylko Administrator.',
  'Analiza':'Wynik kalkulatora z formularza klienta i kalkulatory strony do przeliczenia na danych z umowy.',
  'Historia działań':'Oś czasu wszystkich zmian w sprawie (kto, kiedy, wartość przed i po) — tylko do odczytu.',
  'Kategorie':'Kategorie spraw: kod, kolor, kolejność, szablon procesu. Kategorii ze sprawami nie usuwa się — tylko dezaktywuje.',
  'Użytkownicy i uprawnienia':'Role, nadania indywidualne z okresem ważności i uzasadnieniem, zastępstwa. Zmiany trafiają do audytu.',
  'Święta':'Dni wolne do liczenia terminów. Święta ruchome (Wielkanoc, Boże Ciało…) liczą się same.',
  'Powiadomienia':'Kto dostaje powiadomienie o danym zdarzeniu i jakim kanałem. Powiadomień o terminach nie można wyłączyć.',
  'Przypomnienia o terminach':'Ile dni przed terminem wysyłać przypomnienia — osobno dla każdego typu terminu.',
  'System':'Stan systemu, zadania w tle i dostęp awaryjny obsługi technicznej.',
  'Dziennik audytu':'Zapis wszystkich ważnych zdarzeń. Tylko dopisywanie — nikt nie może go zmienić ani usunąć.',
  'Moje konto':'Twoje dane, rola, uprawnienia i 2FA.',
  '⚙️ Ustawienia':'Nazwa i kolor strony, formularz zgłoszenia sprawy, chatbot.',
  '🗂️ Kategorie':'Porównywarka: kategorie, parametry porównania i oferty.',
  '🧮 Kalkulatory':'Kalkulatory strony: pola, wzory i test na wartościach domyślnych.',
  '📄 Analiza umów':'Reguły analizy umów wgrywanych przez odwiedzających: ryzykowne zapisy, zgodność z prawem, styl.',
  '🌐 Tłumaczenia':'Teksty strony po ukraińsku i angielsku.',
  '🔎 SEO':'Jak strona wygląda w Google i przy udostępnianiu. Trafia do strony przez data.json w repo.',
  '🚀 Publikacja':'Stan publikacji, pobranie data.json, import i odrzucenie szkicu.'};

/* --- przyciski (po tekście) --- */
const BTN={
  '🔔':'Powiadomienia','🌓':'Motyw jasny / ciemny','Wyloguj':'Wyloguj się (po 30 min bezczynności CRM wyloguje sam)',
  '+ Nowa sprawa':'Załóż sprawę: klient, kategoria, pełnomocnik prowadzący. Numer nada baza (KOD-ROK-NNNN).',
  'Załóż sprawę':'Utwórz sprawę z tego zgłoszenia — dane klienta i wynik kalkulatora przejdą do karty sprawy.',
  'Odrzuć':'Odrzuć — wymagany powód (zapis w historii).',
  '+ Dodaj osobę do sprawy':'Dołącz pełnomocnika, aplikanta lub asystenta i ustaw zakres dostępu (tylko Administrator).',
  'Zakres':'Zmień zakres dostępu tej osoby w sprawie.',
  'Odbierz dostęp':'Dostęp wygasa od razu. Rekord zostaje w historii zespołu.',
  '+ Dodaj termin':'Nowy termin z kalkulatorem. Termin ustawowy wymaga drugiej osoby (kontrolera).',
  'Zmień datę':'Zmiana daty tworzy nową wersję terminu — wymagane uzasadnienie.',
  'Wykonano':'Zamknij termin: data wykonania i załącznik (np. UPO, prezentata) są wymagane.',
  'Potwierdzam poprawność daty':'Jako kontroler potwierdzasz, że data terminu została policzona poprawnie.',
  '⬇ Eksport .ics':'Pobierz terminy do kalendarza (Outlook, Google). Eksport trafia do audytu.',
  'Dziś':'Wróć do bieżącego miesiąca','‹':'Poprzedni miesiąc','›':'Następny miesiąc',
  '+ Wpis':'Dodaj notatkę lub czynność w tym etapie. Po zapisaniu nie można jej usunąć (tylko Administrator).',
  'Edytuj (zapis wersji)':'Popraw własny wpis przed zatwierdzeniem etapu — poprzednia treść zostaje w historii korekt.',
  'Wniosek o korektę':'Wpis jest zablokowany. Złóż wniosek z uzasadnieniem — zdecyduje Administrator.',
  'Popraw (z uzasadnieniem)':'Korekta zablokowanego wpisu przez Administratora — z uzasadnieniem, ślad w audycie.',
  'Zatwierdź etap':'Zapisuje osobę i datę, blokuje wpisy i załączniki etapu i otwiera następny etap.',
  'Zatwierdź wpis':'Potwierdź wykonaną czynność (wymaga uprawnienia do zatwierdzania).',
  'Zatwierdź':'Zatwierdź wniosek','Pokaż':'Pokaż pełny PESEL — tylko z uprawnieniem, każde odsłonięcie trafia do audytu.',
  'Usuń':'Usunięcie „miękkie” z uzasadnieniem: znika z widoku, zostaje w archiwum i audycie.',
  'Pobierz':'Pobierz plik (pobranie trafia do audytu)',
  '+ Wpływ':'Wpłata klienta przypisana do sprawy. Potem podział na pozycje (Bilans 0 zł).',
  '+ Pozycja':'Pozycja podziału wpływu: odbiorca, kwota, status. Suma musi się zgadzać z wpływem.',
  'Status / kategoria':'Zmiana statusu lub kategorii sprawy — tylko Administrator, numer sprawy się nie zmienia.',
  '⬇ CSV':'Eksport listy spraw z filtrami do CSV (zapis w audycie)','⬇ XLSX':'Eksport do Excela (zapis w audycie)','⬇ PDF':'Wydruk / zapis raportu jako PDF (zapis w audycie)',
  '+ Kategoria':'Nowa kategoria spraw: kod, nazwa, kolor, szablon procesu.','Dezaktywuj':'Kategoria zniknie z formularza nowej sprawy; istniejące sprawy zostają.','Aktywuj':'Przywróć kategorię w formularzu nowej sprawy.',
  '↑':'Przesuń wyżej','↓':'Przesuń niżej','✕':'Usuń',
  '+ Etap':'Dodaj etap do szablonu restrukturyzacji (dotyczy tylko nowych spraw RST).',
  'Rola / konto':'Rola, aktywność konta i dane użytkownika.',
  'Zapisz uprawnienia':'Zmiana działa od następnego żądania i trafia do audytu (kto, komu, co, dlaczego).',
  '+ Zastępstwo':'Na czas nieobecności powiadomienia tej osoby dostaje też zastępca.',
  'Zapisz harmonogram':'Zapisz dni przypomnień dla typów terminów.',
  'Sprawdź łańcuch skrótów':'Sprawdza, czy żaden wpis dziennika audytu nie został zmieniony ani usunięty.',
  'Oznacz wszystkie jako przeczytane':'Oznacz wszystkie widoczne powiadomienia jako przeczytane',
  '🚀 Opublikuj':'Opublikuj szkic na stronie publicznej (zapis w bazie i audycie).',
  '🚀 Opublikuj na stronie':'Opublikuj szkic na stronie publicznej (zapis w bazie i audycie).',
  '⬇ Pobierz data.json':'Plik do podmiany w repozytorium — potrzebny po zmianach SEO.',
  '📋 Kopiuj JSON':'Skopiuj szkic do schowka','↺ Odrzuć szkic':'Wróć do opublikowanej wersji (szkic zostanie usunięty).',
  '+ Nowa kategoria':'Nowa kategoria porównywarki','Usuń kategorię':'Usuń kategorię razem z ofertami',
  '+ Parametr':'Nowa kolumna porównania (np. cena, czas)','+ Oferta':'Nowa oferta w tej kategorii',
  '+ Nowy kalkulator':'Nowy kalkulator na stronie','Usuń kalkulator':'Usuń ten kalkulator ze strony',
  '+ Pole':'Nowe pole, które wpisuje odwiedzający','+ Wynik':'Nowy wynik liczony ze wzoru',
  '+ Reguła':'Nowa reguła analizy umów','+ Wskaźnik':'Nowy wskaźnik podejrzanej treści',
  'Usuń nieużywane':'Usuń tłumaczenia tekstów, których nie ma już na stronie',
  'G↗':'Otwórz Tłumacza Google z tym tekstem'};

/* --- pola formularzy (po tekście etykiety) --- */
const LAB={
  'PESEL':'Szyfrowany w bazie, w CRM maskowany. Pełny wgląd tylko z uprawnieniem „Pełny PESEL” — każde odsłonięcie w audycie.',
  'Pełnomocnik prowadzący':'Dokładnie jeden w sprawie. Dostaje przypomnienia o terminach od T-3 i eskalacje.',
  'Wartość sporu (zł)':'Wartość przedmiotu sporu — podstawa m.in. opłat i success fee.',
  'Opłata wstępna (zł)':'Widoczna tylko z uprawnieniem „Opłata wstępna / wpłata klienta”.',
  'Success fee (%)':'Procent od wygranej. Szczegóły (kwota/procent, warunek) ustawia się w Finansach sprawy.',
  'Waluta':'Dla kategorii z polem „waluta” (np. FX). Słownik walut: Ustawienia → Kategorie.',
  'Typ':l=>l.closest('#stWrap')?null:l.querySelector('[name=type]')?'Notatka — informacja dla zespołu. Czynność — wykonana praca (data, osoba, ewentualne zatwierdzenie).':null,
  'Rodzaj':l=>l.querySelector('#dType')?'Procesowy ustawowy — wymaga kontrolera (druga osoba potwierdza datę). Sądowy — rozprawa lub posiedzenie. Wewnętrzny — zadanie zespołu.':l.querySelector('[name=kind]')?'Rodzaj czynności — używany w raportach i historii sprawy.':null,
  'Status':l=>l.querySelector('option[value=planned]')?'Plan ≠ przelew: planowane → zatwierdzone → należne → wypłacone. Status inny niż „planowane” wymaga Bilansu 0 zł.':l.querySelector('option[value=suspended]')&&l.closest('#mbox')?'Zmiana statusu sprawy — tylko Administrator, zapis w historii i audycie. Zakończenie wysyła powiadomienie.':null,
  'Zdarzenie (doręczenie)':'Data zdarzenia, od którego biegnie termin (np. doręczenie pisma).',
  'Zdarzenie (np. doręczenie)':'Data zdarzenia, od którego biegnie termin (np. doręczenie pisma).',
  'Długość terminu':'Liczba dni, tygodni, miesięcy lub lat. Koniec w sobotę lub święto przechodzi na następny dzień roboczy.',
  'Długość':'Liczba dni, tygodni, miesięcy lub lat. Koniec w sobotę lub święto przechodzi na następny dzień roboczy.',
  'Data końcowa':'Wynik kalkulatora. Ręczna zmiana tylko z uzasadnieniem.',
  'Odpowiedzialny':'Dostaje wszystkie przypomnienia i eskalację po przekroczeniu terminu.',
  'Kontroler — druga osoba (wymagany dla ustawowych)':'Druga osoba potwierdza poprawność daty. Dostaje przypomnienia od T-7. Nie może być osobą odpowiedzialną.',
  'Potwierdzenie (np. UPO, prezentata)':'Dowód wykonania — bez załącznika nie da się zamknąć terminu.',
  'Termin kolejnej czynności':'Utworzy zadanie w module Terminy.',
  'Rola w sprawie':'Domyślny zakres: aplikant — dokumenty i czynności, bez finansów. Można zmienić.',
  'Zakres odpowiedzialności':'Za co ta osoba odpowiada w sprawie (opis).',
  'Data zakończenia (opcjonalnie)':'Po tej dacie dostęp do sprawy wygasa sam.',
  'Odbiorca':'Komu przypada pozycja podziału. Pełnomocnik widzi tylko pozycje, w których jest odbiorcą.',
  'Podstawa':'Na jakiej podstawie (umowa, aneks, uchwała) — zapisywana przy każdej wersji.',
  'Uzasadnienie zmiany':'Wymagane przy zmianie zatwierdzonego podziału — poprzednia wartość zostaje w historii.',
  'Uzasadnienie (wymagane przy każdej zmianie)':'Trafia do dziennika audytu razem ze zmianą.',
  'Zastępca':'W okresie zastępstwa powiadomienia trafiają też do zastępcy (z dopiskiem).',
  'Szablon procesu':'Standardowy (10 etapów) albo restrukturyzacja (osobne etapy).',
  'Kod':'2–6 wielkich liter, np. SKD. Część numeru sprawy (KOD-ROK-NNNN).',
  'Strona przeciwna':'Do kontroli konfliktu interesów.',
  'Wynik':'Bez wyniku „brak konfliktu” etapu nie da się zatwierdzić ani przejść dalej.',
  // Treści strony
  'Kolor akcentu':'Kolor przycisków i wyróżnień na stronie.',
  'Gdzie trafia zgłoszenie':'Baza CRM — zgłoszenie od razu w „Nowe sprawy”. E-mail — otwiera program pocztowy klienta (musi wysłać sam).',
  'Supabase — klucz publiczny (publishable)':'Tylko klucz sb_publishable_… — nigdy sb_secret_ (CRM i baza to odrzucą).',
  'Treść zgody RODO':'Zgoda, którą klient zaznacza przed wysłaniem formularza.',
  'Gdzie na stronie':'„Co mi się należy” — dla klienta, z formularzem zgłoszenia. „Kalkulatory prawne” — narzędzia bez zgłoszenia.',
  'Kategoria sprawy w CRM':'Zgłoszenie z tego kalkulatora trafi do CRM z tą kategorią.',
  'Uwaga pod polami (zastrzeżenia, podstawa, warunki)':'Tekst pod kalkulatorem — zastrzeżenia zweryfikuje prawnik.',
  'Tryb tłumaczenia':'Własne — tłumaczenia z tabeli (widoczne dla Google). Google Translate — automatycznie w przeglądarce.',
  'Odsetki maksymalne umowne (% rocznie)':'2 × (stopa referencyjna NBP + 3,5 pp). Aktualizuj po każdej zmianie stóp.',
  'Odsetki maksymalne za opóźnienie (% rocznie)':'2 × (stopa referencyjna NBP + 5,5 pp). Aktualizuj po każdej zmianie stóp.',
  'Maks. rozmiar pliku (MB)':'Plik umowy jest analizowany w przeglądarce odwiedzającego — nic nie trafia na serwer.',
  'Tytuł strony':'Tytuł w wynikach Google — zalecane 30–60 znaków.',
  'Opis (meta description)':'Opis w wynikach Google — zalecane 70–160 znaków.',
  'Adres skryptu osadzającego':'Adres skryptu chatbota Ilona — nie zmieniać bez potrzeby.'};

/* --- nagłówki kolumn (po tekście) --- */
const TH={
  'Klucz':'Techniczna nazwa parametru (bez spacji i polskich znaków). Zmiana przenosi wartości w ofertach.',
  'Lepsza wartość':'Niższa / wyższa — najlepsza oferta dostaje ★. „—” wyłącza wyróżnienie.',
  'Zmienna':'Nazwa używana we wzorach, np. kwota.','Wzór':'Wyrażenie, np. kwota*stawka/100. Można użyć wyników z wierszy powyżej i funkcji pow, round, min, max.',
  '★':'Wynik główny — pokazywany największy.','Wzorce (jeden w linii)':'Wyrażenia regularne, wielkość liter bez znaczenia. Wystarczy też zwykły fragment tekstu.',
  'Poziom / kiedy':'Waga ostrzeżenia i warunek: gdy fragment występuje albo gdy go brakuje.',
  'Bilans':'Kwota wpływu minus suma pozycji podziału. Do zatwierdzenia musi wynosić 0 zł.',
  'Nadanie indywidualne':'Nadpisuje uprawnienie z roli dla tej osoby (nadaj pełny / ograniczony albo odbierz).',
  'Uprawnienie':'„podgląd” — widzi dane; „zmiana” — dodaje i edytuje. Usuwanie i zatwierdzanie to osobne uprawnienia.',
  'Funkcja':'„podgląd” — widzi dane; „zmiana” — dodaje i edytuje. Usuwanie i zatwierdzanie to osobne uprawnienia.',
  'Ważne do':'Puste = bezterminowo. Po tej dacie nadanie wygasa samo.',
  'Dodatkowi odbiorcy':'Grupy, które oprócz odbiorców z ról i przypisań dostają to powiadomienie.',
  'Kanały':'W CRM zawsze. E-mail i SMS — po wyborze dostawcy.',
  'Kontroler od':'Od ilu dni przed terminem przypomnienia dostaje też kontroler.','Pełnomocnik prowadzący od':'Od ilu dni przed terminem przypomnienia dostaje też pełnomocnik prowadzący.',
  'Przypomnienia (dni przed terminem)':'Np. 14, 7, 3, 1, 0 (0 = dzień terminu, od 8:00).',
  'SHA-256':'Skrót pliku — pozwala sprawdzić, że plik nie został zmieniony.','Skrót':'Skrót wpisu w łańcuchu — zmiana dowolnego wpisu psuje cały łańcuch.'};

/* --- znaczki statusów (po tekście, bez wielkości liter) --- */
const BADGE={
  'otwarty':'Do terminu więcej niż 7 dni.','zbliża się':'Do terminu 2–7 dni.','pilny':'Termin jutro lub dziś.','przekroczony':'Termin minął — codzienna eskalacja do Administratora aż do „Wykonano”.','wykonany':'Termin zamknięty z potwierdzeniem.',
  'planowane':'Plan podziału — jeszcze bez zatwierdzenia.','zatwierdzone':'Podział zatwierdzony (Bilans 0 zł).','należne':'Kwota należna odbiorcy.','wypłacone':'Przelew wykonany (data wypłaty zapisana).'};

const textOf=el=>{let t='';for(const n of el.childNodes){if(n.nodeType===3)t+=n.nodeValue;else if(n.nodeType===1&&!n.matches('input,select,textarea,.hlp,.cnt,.dot'))t+=n.textContent}return t.replace(/\s+/g,' ').trim()};
const val=(v,el)=>typeof v==='function'?v(el):v;
const firstText=el=>{for(const n of el.childNodes){if(n.nodeType===3&&n.nodeValue.trim())return n}return null};
function addHlp(el,t){if(!t||el.querySelector(':scope > .hlp,:scope > .lbt'))return;const tn=firstText(el);const h=hlpEl(t);
  if(tn&&el.tagName==='LABEL'){const w=document.createElement('span');w.className='lbt';tn.replaceWith(w);w.append(tn,h)}  // tekst + [?] w jednej linii (etykiety w siatce)
  else if(tn)tn.after(h);else el.appendChild(h)}
function apply(root){
  root.querySelectorAll('[title]:not([data-tip])').forEach(el=>{if(el.tagName==='svg'||el.closest('svg'))return;el.dataset.tip=el.title;el.removeAttribute('title')});
  root.querySelectorAll('#side a.nav[href^="#/"]:not([data-tip])').forEach(a=>{const k=a.getAttribute('href').slice(2).split('/')[0];if(NAV[k])a.dataset.tip=NAV[k]});
  root.querySelectorAll('.tabs .tab:not([data-tip])').forEach(a=>{const t=TAB[textOf(a)];if(t)a.dataset.tip=t});
  root.querySelectorAll('button:not([data-tip]),a.btn:not([data-tip]),label.btn:not([data-tip])').forEach(b=>{const t=val(BTN[textOf(b)],b);if(t)b.dataset.tip=t});
  root.querySelectorAll('label').forEach(l=>{if(l.closest('#stTest'))return;const k=firstText(l)?.nodeValue.replace(/\s+/g,' ').trim();const t=k&&val(LAB[k],l);if(t)addHlp(l,t)});
  root.querySelectorAll('th').forEach(th=>{const k=firstText(th)?.nodeValue.replace(/\s+/g,' ').trim();const t=k&&TH[k];if(t)addHlp(th,t)});
  root.querySelectorAll('.badge:not([data-tip])').forEach(b=>{const t=BADGE[textOf(b).toLowerCase()];if(t)b.dataset.tip=t});
}
let pend=false;
new MutationObserver(()=>{if(pend)return;pend=true;requestAnimationFrame(()=>{pend=false;apply(document)})}).observe(document.body,{childList:true,subtree:true});
apply(document);
window.CRM_HELP={NAV,TAB,BTN,LAB,TH,BADGE,apply};
})();
