# Stan projektu — do kontynuacji w nowej sesji

Ostatnia aktualizacja: **27.10.2026**, wersja **1.15.0**. Ten plik pozwala kontynuować pracę z innego konta lub w nowej sesji bez historii rozmowy.

## Co to jest

Strona prawnicza **Porównaj.to** (front dla klientów) + **CRM kancelarii** (zaplecze dla adwokatów i pracowników) według specyfikacji `CRM_Kancelarii_Specyfikacja_v1.1.pdf` (22.10.2026, 12 modułów) . Panel **Pielęgniarki** (projekt 23.10.2026) jest osobnym projektem: repo `Lexsalus/Pielegniarki`, baza CRMKP.

| Element | Adres | Stan |
|---------|-------|------|
| Strona dla klientów | https://lexsalus.github.io/PiK/ | działa; formularz „Co mi się należy” zapisuje zgłoszenia w bazie |
| Treści strony | CRM → **🌐 Treści strony** (tylko Administrator; przycisk ⚙️ Panel na stronie i link w stopce prowadzą do CRM) | szkic + „Opublikuj” do bazy (`site_content`, migracja 005 — wdrożona); dopóki nic nie opublikowano, strona czyta `data.json`. `admin.html` usunięty |
| CRM na żywo | https://lexsalus.github.io/PiK/crm.html | logowanie + 2FA, wszystkie dane i operacje przez Supabase |
| Baza | Supabase, projekt **Porównywarka** (dawniej „Piel”) `eamobnucjsavahpxilrt`, region UE (Irlandia), PostgreSQL 17 | schemat + migracje 002–003 wdrożone 26.10.2026, 004–008 wdrożone 27.10.2026; Administrator aktywny |
| Repo | `Lexsalus/PiK` (GitHub Pages z gałęzi `main`) | |

Chatbot **Ilona** (`lexsalus.github.io/Ilona/embed.js`) jest osadzony na stronie — **nie zmieniać** (osobny projekt, repo `Lexsalus/Ilona`).

## Konta i dostęp

- Administrator CRM: `biuro@lekarzeiterapeuci.pl` (nazwa „Admin”), 2FA konfiguruje się przy pierwszym logowaniu.
- Nowych pracowników zakłada się w Supabase → Authentication → Users (samodzielna rejestracja wyłączona), rolę i aktywację nadaje się w CRM → Ustawienia → Użytkownicy.
- Klucz publiczny (`sb_publishable_…`) jest w `crm.html`, `index.html` i `data.json` — może być jawny. **Nigdy** nie umieszczać klucza `sb_secret_…`.
- Zmiany w bazie (SQL) wykonuje się w Supabase SQL Editor albo przez API zarządzania z tokenem osobistym ograniczonym do projektu (Database read-write, krótka ważność, usunąć po użyciu). Treść SQL wysyłać jako UTF-8 (inaczej giną polskie znaki — zob. migracja 007).

## Jak zacząć w nowej sesji

1. Sklonuj `Lexsalus/PiK`, przeczytaj ten plik, potem w razie potrzeby `CRM.md`, `SUPABASE.md`, `CHANGELOG.md`.
2. Właściciel pracuje na Windows (PowerShell, `py`); repo lokalnie w `C:\Users\micha\vsrepos\`.
3. Zmiany w bazie produkcyjnej tylko po uzgodnieniu z właścicielem (nowy token, migracja, testy przed uruchomieniem).

## Zasady pracy

- **Jedna wersja, bez demo:** pracujemy na oryginale; w razie problemu cofamy przez historię gita (`git revert` / poprzednia wersja z `CHANGELOG.md`). Cofnięcie to też nowa wersja.
- **Każda wysyłka (push) = podbicie wersji:** `py bump.py patch|minor|major "opis"` → `version.json` + `CHANGELOG.md`. Commit z wersją w treści („v1.8.5 …”).
- Język: komunikacja i dokumentacja po polsku, zwięźle.
- Zmiany bazy: nowy plik `supabase/migrations/00N_*.sql` + dopisanie testów w `supabase/test/schema.test.mjs`; uruchomić testy przed wdrożeniem.
- Testy: `supabase/test/schema.test.mjs` (129 testów reguł bazy) i `supabase/test/e2e/` (84 kroki przez interfejs CRM i stronę, lokalna kopia bazy).

## Zrobione

- Front: porównywarka (porady, kancelarie, mediacje), kalkulatory prawne, „Co mi się należy” (SKD, CHF/FX, WIBOR, restrukturyzacja) z formularzem → baza, analiza umów (prawo + podejrzana treść), PL/UA/EN, SEO, chatbot.
- Baza: 29 tabel z RLS, 60+ reguł, numeracja spraw, blokada etapów, wersje, soft delete, bilans podziału, PESEL szyfrowany, audyt tylko INSERT z łańcuchem SHA-256, przypomnienia o terminach co 15 min (pg_cron), 2FA egzekwowane w bazie (aal2 dla Administratora, pełnomocnika, obsługi technicznej), prywatny magazyn akt `akta`.
- CRM na żywo: wszystkie moduły specyfikacji podłączone do bazy (sprawy, zgłoszenia, karta, etapy, wpisy, korekty, dokumenty w Storage, zespół, terminy, powiadomienia, finanse, raporty, uprawnienia, kategorie, święta, audyt, dostęp awaryjny).

## Ostatnie zmiany (27.10.2026)

- 1.15.0 — poprawki po audycie (SRI, limit zgłoszeń z e-maila, pobieranie tylko zmienionych tabel, porządki powiadomień, pamięć treści na stronie, uwagi doradców — migracja `008_audyt_bezpieczenstwa.sql`, wdrożona 27.10.2026); migracja 007 wdrożona. Doradcy Supabase po wdrożeniu: zostały tylko uwagi „z założenia” (funkcje SECURITY DEFINER dla zalogowanych, case_counters bez reguł — dostęp tylko przez wyzwalacz) i HIBP (plan płatny).
- 1.14.1 — aktualizacja dokumentacji i podstawowy audyt bezpieczeństwa i zużycia (sekcja niżej).
- 1.14.0 — podpowiedzi w CRM (dymki + [?], `crm-pomoc.js`), numer wersji przy nazwie CRM; zasady haseł w Supabase ustawione (min. 12, małe/wielkie/cyfry, potwierdzenie przy zmianie).
- 1.13.0–1.13.1 — przegląd zgodności ze specyfikacją v1.1 (opis w `CRM.md`): migracja 006 (czas polski, przypomnienie 8:00, typy plików, raport w bazie — wdrożona), raporty z bazy z pamięcią 5 min, naprawiony zapis kalkulacji z zakładki Analiza; migracja 007 (naprawa polskich znaków po wdrożeniu 004/005).
- 1.12.0 — **Treści strony w CRM**: panel z `admin.html` przeniesiony do CRM (`crm-strona.js`, tylko Administrator), publikacja do bazy (migracja `005_tresci_strony.sql`, wdrożona 27.10.2026 razem z 004), strona czyta opublikowaną wersję (zapas: `data.json`), ⚙️ Panel → CRM, `admin.html` usunięty. SEO dalej z `data.json`.

## Wcześniejsze zmiany (26.10.2026)

- 1.8.1 — usunięte demo CRM i tryb testowy formularza.
- 1.8.2 — aktualizacja całej dokumentacji.
- 1.8.3 → 1.8.4 — próba przekierowania przycisku ⚙️ Panel do CRM, **cofnięta na prośbę właściciela**; przycisk prowadzi do `admin.html`.
- 1.9.0 — zakładka **Pielęgniarki** w CRM (`crm-pielegniarki.js`) + migracja `004_pielegniarki.sql` (rola „Pielęgniarka”, uprawnienie `nurses`). Migracja 004 wdrożona (1.9.1).
- 1.9.2 → 1.9.3 — panel wydzielony do repo `Lexsalus/Pielegniarki` (https://lexsalus.github.io/Pielegniarki/), zakładka zdjęta z CRM.
- 1.11.0 — uzupełnienia specyfikacji (migracja 004): reguły powiadomień + brakujące zdarzenia, zastępstwa, przypomnienia per typ, 2FA przy uprawnieniach Administratora, raporty (status, XLSX, PDF, aplikant), wylogowanie po bezczynności, przeciąganie kategorii.
- 1.10.0 — PiK na własnej bazie: projekt **Piel** `eamobnucjsavahpxilrt` (schemat + 002–003). CRMKP zostaje dla pielęgniarek. Z CRM usunięta rola „Pielęgniarka”, migracja 004 i jej testy (są w repo Pielegniarki).

## Otwarte sprawy

- **Uprawnienia do treści strony:** na razie tylko Administrator; inne uprawnienia do ustalenia później (decyzja właściciela).

## Do zrobienia po stronie właściciela

- Po wdrożeniu 008: w CRM → Treści strony kliknąć „Opublikuj”, aby strona dostała tłumaczenie nowego komunikatu o limicie zgłoszeń.
- Pierwsze logowanie Administratora do `crm.html` i konfiguracja 2FA (jeszcze nie sprawdzone na żywo).
- Usunąć tokeny API w Supabase (Account → Access Tokens) oraz pliki z pulpitu: `PiK.txt`, `tok.txt`, `crmkp.txt`, `crm_schema.sql`, `crm_migracja_002.sql`, `crm_migracja_003.sql`.
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

## Następne kroki (propozycja)

1. Założenie kont pracowników i test ról na żywo.
2. Powiadomienia e-mail/SMS (Edge Function + dostawca — decyzja kancelarii).
3. Zakładanie kont pracowników z poziomu CRM (Edge Function z kluczem secret po stronie serwera).
4. Generowanie pism z szablonów (PDF/DOCX).
5. Paginacja / ładowanie przyrostowe przy dużej liczbie spraw (obecnie CRM pobiera do 5000 wierszy z tabeli).
6. Test odtwarzania kopii zapasowej (co kwartał) — wymaga planu Supabase z kopiami.

## Decyzje do podjęcia (ze specyfikacji)

- **Kopie zapasowe (§12):** darmowy plan Supabase nie robi kopii; codzienne kopie dopiero w planie Pro (7 dni) — albo ręczny eksport bazy. Test odtwarzania co kwartał.
- **Blokada konta po nieudanych logowaniach (§12):** Supabase na darmowym planie ogranicza tylko próby z jednego adresu IP; blokada konta wymaga haka uwierzytelniania z planu płatnego.
- **Skan antywirusowy załączników (§7):** wymaga funkcji serwerowej i usługi skanującej (wybór dostawcy).
- **Uprawnienia jako zasób + akcja (§9):** teraz poziomy pełny / ograniczony / brak; pełny model view/create/edit/approve/delete wymaga ustalenia macierzy dla każdej roli.
- **E-mail i SMS w powiadomieniach (§10):** dostawca poczty (SMTP — przy okazji znosi limit 2 e-maili/h) i SMS.
- **Czas wylogowania po bezczynności:** ustawione 30 min — do potwierdzenia.

- Zakres roli Biuro (w systemie: tylko przypisane sprawy + zgłoszenia ze strony).
- Okresy przechowywania danych per kategoria.
- Wzór success fee (podstawa, warunek).
- Reguły liczenia terminów i lista świąt — weryfikacja prawnika.
- Model podziału wpłat (handlowiec, marketing) — zgodność z przepisami o zawodzie, weryfikacja prawnika.
- Teksty uwag prawnych w kalkulatorach — weryfikacja prawnika.
