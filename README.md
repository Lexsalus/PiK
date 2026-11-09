# PiK — Porównywarka, Kalkulatory i analiza umów

Strona prawnicza na GitHub Pages z CRM w Supabase: porównywarka usług prawnych (porady online, kancelarie, mediacje), kalkulatory prawne (odsetki ustawowe, opłata sądowa, koszty zastępstwa, kara umowna), analiza umów. Treści strony edytuje Administrator w CRM (🌐 Treści strony) i publikuje do bazy Supabase (zapasowo `data.json`); zgłoszenia i dane CRM też w bazie.

🌐 **Strona:** https://lexsalus.github.io/PiK/
🗄️ **Baza CRM (Supabase):** wdrożenie — **[SUPABASE.md](SUPABASE.md)**
⚖️ **CRM kancelarii:** https://lexsalus.github.io/PiK/crm.html (logowanie + 2FA) — opis: **[CRM.md](CRM.md)**
🧭 **Stan projektu i kontynuacja:** **[STAN.md](STAN.md)**

📖 Obsługa krok po kroku: **[INSTRUKCJA.md](INSTRUKCJA.md)** · Historia zmian: **[CHANGELOG.md](CHANGELOG.md)**

## Funkcje

**Strona publiczna**
- „Co mi się należy”: kalkulatory roszczeń SKD, CHF/FX, WIBOR, restrukturyzacja + formularz zgłoszenia sprawy (z wynikiem i zgodą RODO)
- Porównywarka: kategorie, wyszukiwarka, sortowanie, ★ przy najlepszej wartości, porównanie do 4 ofert w tabeli
- Kalkulatory z suwakami, wyniki na żywo
- Analiza umów (PDF, Word, ODT, RTF, TXT, HTML, **zdjęcie, kilka zdjęć stron albo skan** — rozpoznawanie tekstu w przeglądarce z prostowaniem, kontrastem i wykrywaniem obróconych stron) : ryzykowne zapisy, zgodność z prawem, ocena podejrzanej treści — paski od zielonego do czerwonego, raport do pobrania
- **Zwrot z umowy kredytu** (SKD, CHF/FX): gdy system wyliczy zwrot, klient widzi czerwony komunikat „klauzule abuzywne — kwalifikujesz się do zwrotu” i kwotę — **bez podstaw prawnych**; podstawy, orzecznictwo i wykryte zapisy trafiają ze zgłoszeniem do CRM
- **Restrukturyzacja firmy** (sekcja „Dla firm”): przedsiębiorca wpisuje długi (bank, leasing, ZUS, podatki, dostawcy), przychody i koszty — widzi raty teraz i po układzie, raty wstrzymane w okresie ochrony, mniej odsetek, umorzenie; ścieżki postępowań z podstawami prawnymi idą ze zgłoszeniem do CRM
- **Zmiany w prawie**: nowelizacje obserwowanych ustaw, projekty w Sejmie, aktualne odsetki (API Sejmu, codziennie)
- Kalkulator odsetek i limity w analizie umów liczą się z aktualnych obwieszczeń
- Wersje językowe PL / UA / EN (własne tłumaczenia lub Google Translate)
- Czat **Adam** — asystent prawny w przeglądarce (bez AI, pytania nie wychodzą na zewnątrz): kieruje do kalkulatorów, pokazuje przepis na żądanie, odsetki, zmiany w prawie
- Motyw ciemny/jasny, responsywność (telefon/desktop)
- Przycisk ⚙️ Panel w górnym pasku i link w stopce

**CRM kancelarii** (zaplecze dla adwokatów i pracowników, wg specyfikacji v1.1; dane w Supabase)
- Logowanie e-mail + hasło, 2FA (TOTP) obowiązkowe dla Administratora, pełnomocników i obsługi technicznej — egzekwowane w bazie
- Sprawy z kategoriami i numeracją, karta sprawy, etapy z blokadą i korektami, dokumenty z wersjami, zespół sprawy
- Terminy procesowe: kalkulator ze świętami, druga osoba, przypomnienia i eskalacja
- Finanse (podział wpłat, wynagrodzenie pełnomocnika), raporty, powiadomienia
- Role i uprawnienia, dziennik audytu z łańcuchem skrótów; zgłoszenia z formularza → „Nowe sprawy” (z analizą umowy klienta i podstawami prawnymi)
- **📜 Prawo**: strażnik zmian w ustawach (ile spraw dotyczy, licznik „nowe”), projekty w Sejmie, odsetki i kontrola stawek w kalkulatorach, wyszukiwarka przepisów; w karcie sprawy → Analiza: dołączenie przepisu ze stanem prawnym na dzień

**CRM → 🌐 Treści strony** (tylko Administrator; dawny panel `admin.html`)
- Ustawienia strony (nazwa, kolor akcentu, podtytuł)
- Szkic w przeglądarce, podgląd, **🚀 Opublikuj** do bazy (strona widzi zmiany od razu)
- Kategorie z dowolnymi parametrami (liczba / tekst / tak-nie) i ofertami
- Kalkulatory z własnymi wzorami i testem na żywo
- Analiza umów: reguły podstawowe i prawne (z podstawą prawną), limity odsetek, wskaźniki podejrzanej treści, tester reguł
- Tłumaczenia: tryb własny/Google, wybór języków, tabela z postępem i filtrem brakujących
- SEO: tytuł, opis, hreflang, Open Graph, schema.org, Search Console, Bing, GA4 z banerem zgody, robots.txt, sitemap.xml, podgląd wyniku Google i ocena
- Zakładki w grupach z kolorami, kropka przy zmianach nieopublikowanych; 🔧 Techniczne: stan systemu, synchronizacja prawa, tryb serwisowy, limity, połączenie z bazą, pamięć aplikacji
- 💬 Czat Adam: imię, powitanie, przyciski, własne tematy, pokazywanie przepisów, tester odpowiedzi
- ✨ Nowe funkcje: Zmiany w prawie, zwrot z umowy (teksty, typy), restrukturyzacja firmy (wartości startowe), skany umów
- Podgląd szkicu, eksport / import `data.json`

## Struktura

```
index.html      strona publiczna
crm.html        CRM kancelarii na żywo (Supabase)
crm-pomoc.js    podpowiedzi w CRM (dymki i ikonki [?]) — słowniki tekstów w jednym miejscu
crm-podglad.js  CRM → Podgląd: panel oczami wybranej roli lub osoby (tylko Administrator, tylko do odczytu)
crm-strona.js   CRM → Treści strony (edycja i publikacja treści strony; dawny admin.html)
crm-prawo.js    CRM → 📜 Prawo + karta „Przepisy” w sprawie + analiza umowy klienta w zgłoszeniu
prawo.js        wspólny moduł danych prawnych (przepisy z podglądem, odsetki, wyszukiwarka, stan prawny na dzień)
prawo/          dane z API Sejmu (obserwowane.json — lista ustaw, edytowana w CRM i zapisywana przez synchronizację; reszta generowana codziennie)
restrukturyzacja.js  kalkulator restrukturyzacji firmy (sekcja #firma)
umowa-zwrot.js  ocena umowy kredytu i wyliczenie zwrotu (reguły z podstawami prawnymi i orzecznictwem)
kredyt-walutowy.js  symulacja kredytu CHF/EUR z kursów NBP (prawo/kursy.json) — rata, wpłaty, saldo
adam/           czat Adam (adam.js, wiedza.json)
tools/          prawo_sync.py — synchronizacja z API Sejmu; test/ — testy parsera
PLAN.md         plan prac (prowadzony na bieżąco)
STAN.md         stan projektu, zasady, następne kroki
supabase/       schema.sql, migrations/ (002–010), test/ — testy bazy 148/148, e2e CRM 129/129 (SUPABASE.md)
CRM.md          opis CRM: role, moduły, decyzje
SUPABASE.md     wdrożenie i stan bazy
data.json       dane strony — wersja zapasowa i źródło SEO (opublikowana wersja jest w bazie)
version.json    aktualna wersja
CHANGELOG.md    historia wersji
bump.py         podbijanie wersji
build_seo.py    SEO z data.json -> index.html, robots.txt, sitemap.xml (uruchamia Actions)
INSTRUKCJA.md   instrukcja obsługi
.github/        workflow publikacji na GitHub Pages + codzienna synchronizacja prawa (ok. 6:17)
```

## Jak to działa

**Treść strony**
1. Panel wczytuje `data.json`, zmiany trzyma jako szkic w przeglądarce.
2. Admin pobiera gotowy `data.json` i wrzuca go do repo.
3. Push na `main` → GitHub Actions uruchamia `build_seo.py` i publikuje stronę.

**Zgłoszenia i CRM**
1. Klient liczy roszczenie w „Co mi się należy” i wysyła formularz → wiersz w tabeli `leads` (klucz publiczny pozwala tylko dodać zgłoszenie).
2. Pracownik loguje się do `crm.html` (hasło + 2FA) → zgłoszenie widać w „Nowe sprawy”, można z niego założyć sprawę.
3. O dostępie do danych decyduje baza (RLS); CRM nie przechowuje danych w przeglądarce.

## Wersjonowanie

[SemVer](https://semver.org/lang/pl/). **Każdy push = podbicie wersji**:

```
py bump.py patch "opis"   # poprawki, dane
py bump.py minor "opis"   # nowe funkcje
py bump.py major "opis"   # duże zmiany
```

Wersja widoczna jest w stopce strony i w panelu.

## Lokalnie

```
py -m http.server 8000
```
→ http://localhost:8000 (albo Live Server w VS Code). Bezpośrednie otwarcie pliku nie zadziała — `fetch` wymaga serwera.

## Bezpieczeństwo

- **Treści strony:** publikuje tylko Administrator z 2FA — sprawdza to baza (funkcja `site_publish`), każda publikacja w audycie. Odczyt opublikowanej wersji jest publiczny (to treść strony).
- **CRM:** dane klientów są w Supabase (UE), chronione regułami RLS w bazie, 2FA egzekwowanym w bazie, szyfrowaniem PESEL i dziennikiem audytu. W kodzie strony jest tylko klucz publiczny `sb_publishable_…`; klucza `sb_secret_…` nie umieszcza się nigdzie w repo.
- `crm.html` jest wyłączony z indeksowania (`robots.txt`).
