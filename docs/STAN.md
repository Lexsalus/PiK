# Stan projektu — do kontynuacji w nowej sesji

Ostatnia aktualizacja: **11.11.2026**, wersja **1.41.7**. Ten plik pozwala kontynuować pracę z innego konta lub w nowej sesji bez historii rozmowy.

## Co to jest

Strona prawnicza **Porównaj.to** (front dla klientów) + **CRM kancelarii** (zaplecze dla adwokatów i pracowników) według specyfikacji `CRM_Kancelarii_Specyfikacja_v1.1.pdf` (22.10.2026, 12 modułów) . Panel **Pielęgniarki** (projekt 23.10.2026) jest osobnym projektem: repo `Lexsalus/Pielegniarki`, baza CRMKP.

| Element | Adres | Stan |
|---------|-------|------|
| Strona dla klientów | https://lexsalus.github.io/PiK/ | działa; formularz „Co mi się należy” zapisuje zgłoszenia w bazie |
| Treści strony | CRM → **🌐 Treści strony** (tylko Administrator; przycisk ⚙️ Panel na stronie i link w stopce prowadzą do CRM) | szkic + „Opublikuj” do bazy (`site_content`, migracja 005 — wdrożona); dopóki nic nie opublikowano, strona czyta `data.json`. `admin.html` usunięty |
| CRM na żywo | https://lexsalus.github.io/PiK/crm.html | logowanie + 2FA, wszystkie dane i operacje przez Supabase |
| Baza | Supabase, projekt **Porównywarka** (dawniej „Piel”) `eamobnucjsavahpxilrt`, region UE (Irlandia), PostgreSQL 17 | schemat + migracje 002–003 wdrożone 26.10.2026, 004–009 27.10.2026, 010 + funkcja `konta` 09.11.2026, 011–012 11.11.2026, 013–018 12.11.2026; Administrator aktywny |
| Repo | `Lexsalus/PiK` (GitHub Pages z gałęzi `main`) | |
| Serwis dotacji | https://lexsalus.github.io/PiK/dotacje/ (folder `dotacje/`; stare repo `Lexsalus/Grants` tylko przekierowuje) | zgłoszenia do CRM (kategoria DOT), treści z bazy; panel w CRM → 💶 Dotacje |

Na stronie działa czat **Adam** (`adam/`, regułowy, w przeglądarce). Ilona to osobny projekt (repo `Lexsalus/Ilona`) — nie zmieniać.

## Konta i dostęp

- Administrator CRM: `biuro@lekarzeiterapeuci.pl` (nazwa „Admin”), 2FA konfiguruje się przy pierwszym logowaniu.
- Nowych pracowników zakłada Administrator w CRM → Ustawienia → Użytkownicy → „+ Nowe konto” (funkcja serwera `konta`, hasło tymczasowe, zmiana przy pierwszym logowaniu). Samodzielna rejestracja wyłączona.
- Klucz publiczny (`sb_publishable_…`) jest w `crm.html`, `index.html` i `data.json` — może być jawny. **Nigdy** nie umieszczać klucza `sb_secret_…`.
- Zmiany w bazie (SQL) wykonuje się w Supabase SQL Editor albo przez API zarządzania z tokenem osobistym ograniczonym do projektu (Database read-write, krótka ważność, usunąć po użyciu). Treść SQL wysyłać jako UTF-8 (inaczej giną polskie znaki — zob. migracja 007).

## Jak zacząć w nowej sesji

1. Sklonuj `Lexsalus/PiK`, przeczytaj ten plik, potem w razie potrzeby `CRM.md`, `SUPABASE.md`, `CHANGELOG.md`.
2. Właściciel pracuje na Windows (PowerShell, `py`); repo lokalnie w `C:\Users\micha\vsrepos\`.
3. Zmiany w bazie produkcyjnej tylko po uzgodnieniu z właścicielem (nowy token, migracja, testy przed uruchomieniem).

## Zasady pracy

- **08.11.2026 historia gita została nadpisana** (usunięte notatki biznesowe z dawnych commitów). Istniejące klony: `git fetch origin && git reset --hard origin/main` (lokalne niewysłane zmiany najpierw zapisać).

- **Układ plików (od 1.35.0):** `index.html` i `crm.html` to same szkielety; style i skrypty strony w `strona/`, CRM w `crm/`, moduły wspólne w `wspolne/`, dokumentacja w `docs/`, skrypty w `tools/`. Nowy moduł CRM = plik w `crm/` + wpis w `crm.html` i na liście `SHELL` w `crm-sw.js` (podbić `CACHE`).

- **Plan:** `PLAN.md` — uzupełniać na bieżąco (status zadań, decyzje).

- **Jedna wersja, bez demo:** pracujemy na oryginale; w razie problemu cofamy przez historię gita (`git revert` / poprzednia wersja z `CHANGELOG.md`). Cofnięcie to też nowa wersja.
- **Każda wysyłka (push) = podbicie wersji:** `py tools/bump.py patch|minor|major "opis"` → `version.json` + `CHANGELOG.md`. Commit z wersją w treści („v1.8.5 …”).
- Język: komunikacja i dokumentacja po polsku, zwięźle.
- Zmiany bazy: nowy plik `supabase/migrations/00N_*.sql` + dopisanie testów w `supabase/test/schema.test.mjs`; uruchomić testy przed wdrożeniem.
- Testy: `supabase/test/schema.test.mjs` (184 testy reguł bazy), `supabase/test/e2e/` (172 kroki przez interfejs CRM i stronę, lokalna kopia bazy, dane testowe zamiast NBP/SAOS/UOKiK/UODO), `tools/test/test_prawo_sync.py` (23 testy synchronizacji).

## Zrobione

- Front: porównywarka (porady, kancelarie, mediacje), kalkulatory prawne, „Co mi się należy” (SKD, CHF/FX, WIBOR, restrukturyzacja) z formularzem → baza, analiza umów (prawo + podejrzana treść), PL/UA/EN, SEO, chatbot.
- Baza: 29 tabel z RLS, 60+ reguł, numeracja spraw, blokada etapów, wersje, soft delete, bilans podziału, PESEL szyfrowany, audyt tylko INSERT z łańcuchem SHA-256, przypomnienia o terminach co 15 min (pg_cron), 2FA egzekwowane w bazie (aal2 dla Administratora, pełnomocnika, obsługi technicznej), prywatny magazyn akt `akta`.
- CRM na żywo: wszystkie moduły specyfikacji podłączone do bazy (sprawy, zgłoszenia, karta, etapy, wpisy, korekty, dokumenty w Storage, zespół, terminy, powiadomienia, finanse, raporty, uprawnienia, kategorie, święta, audyt, dostęp awaryjny).

## Ostatnie zmiany (09–11.11.2026)

- 1.34.0 — Prawo → grupa **Urzędy**: rejestr klauzul niedozwolonych UOKiK (wyszukiwarka, porównanie zapisu umowy z rejestrem, podobne wpisy w analizie umowy klienta), decyzje UODO (publiczne API), wyszukiwarki KIS/ZUS/KNF/decyzje UOKiK; długie listy w porcjach („Pokaż więcej”), dziennik audytu z bazy na żądanie.
- 1.33.0 — serwis dotacji **Lexsalus/Grants** w CRM (💶 Dotacje: zgłoszenia, źródła finansowania, podgląd raportu, treści, publikacja; migracja 012); filtr kategorii w Nowych sprawach.
- 1.32.0 — **pisma z szablonów** (DOCX, wydruk/PDF, zapis w aktach; Ustawienia → Pisma i szablony; migracja 011).
- 1.31.0 — **orzecznictwo** z SAOS (Prawo → Orzecznictwo, dołączanie do sprawy, karta sprawy → Analiza).
- 1.30.0 — **kredyt CHF/EUR z kursów NBP** (rata, saldo bez pytania klienta; Prawo → Kredyt walutowy).
- 1.29.0 — **lista obserwowanych ustaw w CRM** (Treści strony → Nowe funkcje).
- 1.28.0 — restrukturyzacja: harmonogram i wydruk planu dla wierzycieli; zakładki karty sprawy i Prawa w grupach.
- 1.27.0 — powiadomienia o zmianach w prawie w bazie, konta pracowników z CRM, limit zgłoszeń po telefonie (migracja 010, funkcja `konta`).

## Zmiany 08–09.11.2026

- 1.26.0 — OCR: kilka zdjęć stron umowy naraz, przygotowanie obrazu (obrót z aparatu, kontrast, prostowanie przekosu), wykrywanie stron do góry nogami i obróconych o 90°.
- 1.25.0 — zakładki Treści strony i Ustawień w grupach z kolorami (kropka = nieopublikowane zmiany), nowa zakładka **🔧 Techniczne** (stan systemu, synchronizacja prawa, tryb serwisowy z wstrzymaniem zgłoszeń, limity, połączenie z bazą, pamięć aplikacji). e2e 117/117.
- 1.24.0 — CRM → Treści strony: **💬 Czat Adam** (imię, powitanie, przyciski, własne tematy, przełącznik pokazywania przepisów, tester) i **✨ Nowe funkcje** (zmiany w prawie, zwrot z umowy, restrukturyzacja firmy, OCR). Ustawienia idą przez szkic → Opublikuj (bez wysyłki na GitHub).
- 1.23.0 — menu CRM w grupach z kolorami (Codzienna praca, Kancelaria, Prawo, Administracja), tylko pozycje z uprawnień, dymki z powodem dostępu.
- 1.22.0 — **Restrukturyzacja firmy** (sekcja „Dla firm”, `strona/restrukturyzacja.js`): długi przedsiębiorcy → raty po układzie, wstrzymanie, odsetki, umorzenie; ścieżki postępowań z podstawami w CRM.
- 1.21.1–1.21.2 — parser tekstów ustaw po identyfikatorach ELI (pewny dla KPC i kodeksów).
- 1.20.0–1.21.0 — **prawo z API Sejmu + Adam + zwrot z umowy** (szczegóły i status: `PLAN.md`): codzienna synchronizacja `tools/prawo_sync.py` → `prawo/*.json`; CRM → 📜 Prawo (zmiany, projekty, odsetki, przepisy, dołączanie przepisu do sprawy ze stanem na dzień); strona: „Zmiany w prawie”, odsetki automatyczne, OCR skanów umów, **zwrot z umowy kredytu: klient widzi czerwony komunikat + kwotę bez podstaw prawnych, podstawy/orzecznictwo idą ze zgłoszeniem do CRM**; czat **Adam** zamiast Ilony (Ilona to czat medyczny innego serwisu).
- Na stronie wynik analizy umowy jest bez podstaw prawnych (komunikat i kwoty); pełne uzasadnienie w CRM.
- Ustalenia biznesowe z rozmów (np. z klientami kancelarii) **nie trafiają do repozytorium** (repo jest publiczne) — w plikach tylko neutralny opis funkcji.

## Wcześniejsze zmiany (27.10–05.11.2026)

- 1.19.0 (05.11.2026) — CRM jako aplikacja na telefon/komputer (PWA, jak w panelu pielęgniarek): przycisk „📲 Zainstaluj aplikację” na ekranie logowania i w górnym pasku, `crm.webmanifest`, `crm-sw.js` (tylko pliki CRM, baza zawsze z sieci), ikony `icons/crm-*`. Test e2e blokuje service worker (inaczej podmiana bibliotek nie działa).
- 1.18.0 — Treści strony: przycisk „🔍 Pokaż różnice” przy ostrzeżeniu o nieaktualnym szkicu; paski przewijania w stylu strony (CRM i strona publiczna).
- 1.17.0 — **Podgląd panelu** jako rola lub osoba (Administrator, tylko do odczytu, `crm/podglad.js`).
- 1.16.0 — uprawnienia: podgląd i zmiana osobno (wariant pośredni §9; migracja `009_uprawnienia_akcje.sql` — wdrożona 27.10.2026). Następny krok: pełna macierz akcji.
- 1.15.0 — poprawki po audycie (SRI, limit zgłoszeń z e-maila, pobieranie tylko zmienionych tabel, porządki powiadomień, pamięć treści na stronie, uwagi doradców — migracja `008_audyt_bezpieczenstwa.sql`, wdrożona 27.10.2026); migracja 007 wdrożona. Doradcy Supabase po wdrożeniu: zostały tylko uwagi „z założenia” (funkcje SECURITY DEFINER dla zalogowanych, case_counters bez reguł — dostęp tylko przez wyzwalacz) i HIBP (plan płatny).
- 1.14.1 — aktualizacja dokumentacji i podstawowy audyt bezpieczeństwa i zużycia (sekcja niżej).
- 1.14.0 — podpowiedzi w CRM (dymki + [?], `crm/pomoc.js`), numer wersji przy nazwie CRM; zasady haseł w Supabase ustawione (min. 12, małe/wielkie/cyfry, potwierdzenie przy zmianie).
- 1.13.0–1.13.1 — przegląd zgodności ze specyfikacją v1.1 (opis w `CRM.md`): migracja 006 (czas polski, przypomnienie 8:00, typy plików, raport w bazie — wdrożona), raporty z bazy z pamięcią 5 min, naprawiony zapis kalkulacji z zakładki Analiza; migracja 007 (naprawa polskich znaków po wdrożeniu 004/005).
- 1.12.0 — **Treści strony w CRM**: panel z `admin.html` przeniesiony do CRM (`crm/tresci-strony.js`, tylko Administrator), publikacja do bazy (migracja `005_tresci_strony.sql`, wdrożona 27.10.2026 razem z 004), strona czyta opublikowaną wersję (zapas: `data.json`), ⚙️ Panel → CRM, `admin.html` usunięty. SEO dalej z `data.json`.

## Wcześniejsze zmiany (26.10.2026)

- 1.8.1 — usunięte demo CRM i tryb testowy formularza.
- 1.8.2 — aktualizacja całej dokumentacji.
- 1.8.3 → 1.8.4 — próba przekierowania przycisku ⚙️ Panel do CRM, **cofnięta na prośbę właściciela**; przycisk prowadzi do `admin.html`.
- 1.9.0 — zakładka **Pielęgniarki** w CRM (`crm-pielegniarki.js`) + migracja `004_pielegniarki.sql` (rola „Pielęgniarka”, uprawnienie `nurses`). Migracja 004 wdrożona (1.9.1).
- 1.9.2 → 1.9.3 — panel wydzielony do repo `Lexsalus/Pielegniarki` (https://lexsalus.github.io/Pielegniarki/), zakładka zdjęta z CRM.
- 1.11.0 — uzupełnienia specyfikacji (migracja 004): reguły powiadomień + brakujące zdarzenia, zastępstwa, przypomnienia per typ, 2FA przy uprawnieniach Administratora, raporty (status, XLSX, PDF, aplikant), wylogowanie po bezczynności, przeciąganie kategorii.
- 1.10.0 — PiK na własnej bazie: projekt **Piel** `eamobnucjsavahpxilrt` (schemat + 002–003). CRMKP zostaje dla pielęgniarek. Z CRM usunięta rola „Pielęgniarka”, migracja 004 i jej testy (są w repo Pielegniarki).

## Otwarte sprawy

- Paski „Ryzyko prawne” i „Podejrzana treść” w analizie umów — właściciel przekaże wytyczne (PLAN.md, poz. 15).

- **Uprawnienia do treści strony:** na razie tylko Administrator; inne uprawnienia do ustalenia później (decyzja właściciela).

## Do zrobienia po stronie właściciela

- Po wdrożeniu 008: w CRM → Treści strony kliknąć „Opublikuj”, aby strona dostała tłumaczenie nowego komunikatu o limicie zgłoszeń.
- Pierwsze logowanie Administratora do `crm.html` i konfiguracja 2FA (jeszcze nie sprawdzone na żywo).
- Po wdrożeniu migracji usunąć token API w Supabase (Account → Access Tokens) i plik `tok.txt` z pulpitu (oraz stare: `PiK.txt`, `crmkp.txt`, `crm_*.sql`).
- CRM → Ustawienia → Pisma i szablony: uzupełnić dane kancelarii (nazwa, adres, miejscowość). CRM → 💶 Dotacje → Publikacja: pierwsza publikacja przenosi katalog z plików folderze `dotacje/` do bazy.
- Podmienić przykładowe (fikcyjne) oferty w porównywarce na prawdziwe.

## Bezpieczeństwo i zużycie — audyt 27.10.2026 (podstawowy)

Dobrze: wszystkie tabele z RLS; niezalogowany może tylko dodać zgłoszenie (`leads`, z limitami długości) i czytać opublikowane treści strony; żadna funkcja nie jest wywoływalna bez logowania; magazyn `akta` prywatny, 25 MB, dozwolone typy plików; rejestracja wyłączona, 2FA w bazie, hasła min. 12 znaków; w repo i jego historii brak kluczy `sb_secret_`/tokenów; pg_cron tylko `przypomnienia-terminy`.

Wykonane po audycie (1.15.0, migracje 007–008):
1. **SRI** — supabase-js i xlsx w CRM, pdf.js, mammoth i jszip na stronie; worker pdf.js pobierany ze sprawdzeniem odcisku i uruchamiany z lokalnej kopii.
2. **Limit zgłoszeń** — najwyżej 3 z jednego adresu e-mail na godzinę (sprawdza baza; strona pokazuje komunikat). Uwaga: e-mail w formularzu jest nieobowiązkowy — zgłoszenia bez e-maila nie są limitowane.
3. **CRM pobiera po zapisie tylko tabele, które mogły się zmienić** (zapis + skutki wyzwalaczy); pełne wczytanie przy logowaniu i po nowych powiadomieniach od innych. Pobieranie stronami po 1000 wierszy — bez cichego ucinania.
4. **Porządki** — przeczytane powiadomienia starsze niż 90 dni usuwane co noc (pg_cron `powiadomienia-porzadki`).
5. **Strona** — najpierw pobiera tylko datę publikacji; pełne treści tylko po zmianie (reszta z pamięci przeglądarki).
6. **Doradcy Supabase** — stała `search_path`, `(select auth.uid())` w regułach RLS, jedna reguła odczytu na tabelę, indeksy na kluczach obcych.

Zostaje: sprawdzanie haseł z wycieków (HIBP) — plan płatny; kto publikuje treści strony, ten uruchamia kod na stronie (wzory kalkulatorów) — dziś tylko Administrator z 2FA.

## ⚠️ Uwaga

- **2FA tymczasowo wyłączone (12.11.2026)** na prośbę właściciela — problemy z logowaniem. Włączyć ponownie: CRM → Ustawienia → System → „Włącz 2FA”.

## Następne kroki (propozycja)

1. Założenie kont pracowników (z CRM) i test ról na żywo.
2. Powiadomienia e-mail/SMS (Edge Function + dostawca — decyzja kancelarii).
3. Pobieranie danych spraw z bazy porcjami (dziś listy w interfejsie są w porcjach, ale CRM wczytuje dane spraw w całości przy logowaniu).
4. KNF, ZUS, interpretacje KIS i decyzje UOKiK jako dane (dziś wyszukiwarki) — gdy pojawi się API lub stały plik danych.
5. Test odtwarzania kopii zapasowej (co kwartał) — wymaga planu Supabase z kopiami.

## Decyzje do podjęcia (ze specyfikacji)

- **Kopie zapasowe (§12):** darmowy plan Supabase nie robi kopii; codzienne kopie dopiero w planie Pro (7 dni) — albo ręczny eksport bazy. Test odtwarzania co kwartał.
- **Blokada konta po nieudanych logowaniach (§12):** Supabase na darmowym planie ogranicza tylko próby z jednego adresu IP; blokada konta wymaga haka uwierzytelniania z planu płatnego.
- **Skan antywirusowy załączników (§7):** wymaga funkcji serwerowej i usługi skanującej (wybór dostawcy).
- **Uprawnienia jako zasób + akcja (§9):** zrobiony wariant pośredni (podgląd / zmiana, migracja 009); pełna macierz create/edit/approve/delete — następny krok, wymaga ustalenia z kancelarią, kto ma jakie akcje.
- **E-mail i SMS w powiadomieniach (§10):** dostawca poczty (SMTP — przy okazji znosi limit 2 e-maili/h) i SMS.
- **Czas wylogowania po bezczynności:** ustawione 30 min — do potwierdzenia.

- Zakres roli Biuro (w systemie: tylko przypisane sprawy + zgłoszenia ze strony).
- Okresy przechowywania danych per kategoria.
- Wzór success fee (podstawa, warunek).
- Reguły liczenia terminów i lista świąt — weryfikacja prawnika.
- Model podziału wpłat (handlowiec, marketing) — zgodność z przepisami o zawodzie, weryfikacja prawnika.
- Teksty uwag prawnych w kalkulatorach — weryfikacja prawnika.
