# Stan projektu — do kontynuacji w nowej sesji

Ostatnia aktualizacja: **26.10.2026**, wersja **1.8.4**. Ten plik pozwala kontynuować pracę z innego konta lub w nowej sesji bez historii rozmowy.

## Co to jest

Strona prawnicza **Porównaj.to** (front dla klientów) + **CRM kancelarii** (zaplecze dla adwokatów i pracowników) według specyfikacji `CRM_Kancelarii_Specyfikacja_v1.1.pdf` (22.10.2026, 12 modułów).

| Element | Adres | Stan |
|---------|-------|------|
| Strona dla klientów | https://lexsalus.github.io/PiK/ | działa; formularz „Co mi się należy” zapisuje zgłoszenia w bazie |
| Panel treści strony | `admin.html` | działa (dane w `data.json`, hasło domyślne `admin` — zmienić) |
| CRM na żywo | https://lexsalus.github.io/PiK/crm.html | logowanie + 2FA, wszystkie dane i operacje przez Supabase |
| Baza | Supabase, projekt **CRMKP** `ixlhfhzgzotukstoezcj`, region UE (Irlandia), PostgreSQL 17 | schemat + migracje 002–003 wdrożone |
| Repo | `Lexsalus/PiK` (GitHub Pages z gałęzi `main`) | |

Chatbot **Ilona** (`lexsalus.github.io/Ilona/embed.js`) jest osadzony na stronie — **nie zmieniać** (osobny projekt, repo `Lexsalus/Ilona`).

## Konta i dostęp

- Administrator CRM: `biuro@lekarzeiterapeuci.pl` (nazwa „Admin”), 2FA konfiguruje się przy pierwszym logowaniu.
- Nowych pracowników zakłada się w Supabase → Authentication → Users (samodzielna rejestracja wyłączona), rolę i aktywację nadaje się w CRM → Ustawienia → Użytkownicy.
- Klucz publiczny (`sb_publishable_…`) jest w `crm.html` i `data.json` — może być jawny. **Nigdy** nie umieszczać klucza `sb_secret_…`.
- Zmiany w bazie (SQL) wykonuje się w Supabase SQL Editor albo przez API zarządzania z tokenem osobistym ograniczonym do projektu (Database read-write, krótka ważność, usunąć po użyciu).

## Zasady pracy

- **Jedna wersja, bez demo:** pracujemy na oryginale; w razie problemu cofamy przez historię gita (`git revert` / poprzednia wersja z `CHANGELOG.md`).

- **Każda wysyłka (push) = podbicie wersji:** `py bump.py patch|minor|major "opis"` → `version.json` + `CHANGELOG.md`. Commit z wersją w treści („v1.8.4 …”).
- Język: komunikacja i dokumentacja po polsku, zwięźle.
- Zmiany bazy: nowy plik `supabase/migrations/00N_*.sql` + dopisanie testów w `supabase/test/schema.test.mjs`; uruchomić testy przed wdrożeniem.
- Testy: `supabase/test/schema.test.mjs` (74 testy reguł bazy) i `supabase/test/e2e/` (36 kroków przez interfejs CRM, lokalna kopia bazy).

## Zrobione

- Front: porównywarka (porady, kancelarie, mediacje), kalkulatory prawne, „Co mi się należy” (SKD, CHF/FX, WIBOR, restrukturyzacja) z formularzem → baza, analiza umów (prawo + podejrzana treść), PL/UA/EN, SEO, chatbot.
- Baza: 29 tabel z RLS, 60+ reguł, numeracja spraw, blokada etapów, wersje, soft delete, bilans podziału, PESEL szyfrowany, audyt tylko INSERT z łańcuchem SHA-256, przypomnienia o terminach co 15 min (pg_cron), 2FA egzekwowane w bazie (aal2 dla Administratora, pełnomocnika, obsługi technicznej), prywatny magazyn akt `akta`.
- CRM na żywo: wszystkie moduły specyfikacji podłączone do bazy (sprawy, zgłoszenia, karta, etapy, wpisy, korekty, dokumenty w Storage, zespół, terminy, powiadomienia, finanse, raporty, uprawnienia, kategorie, święta, audyt, dostęp awaryjny).

## Do zrobienia po stronie właściciela

- Pierwsze logowanie Administratora do `crm.html` i konfiguracja 2FA (jeszcze nie sprawdzone na żywo).
- Usunąć token API w Supabase (Account → Access Tokens) oraz z pulpitu: `tok.txt`, `crm_schema.sql`, `crm_migracja_002.sql`, `crm_migracja_003.sql`.
- Zmienić domyślne hasło panelu treści (`admin`).
- Podmienić przykładowe (fikcyjne) oferty w porównywarce na prawdziwe.

## Następne kroki (propozycja)

1. Założenie kont pracowników i test ról na żywo.
2. Powiadomienia e-mail/SMS (Edge Function + dostawca — decyzja kancelarii).
3. Zakładanie kont pracowników z poziomu CRM (Edge Function z kluczem secret po stronie serwera).
4. Generowanie pism z szablonów (PDF/DOCX).
5. Paginacja / ładowanie przyrostowe przy dużej liczbie spraw (obecnie CRM pobiera do 5000 wierszy z tabeli).
6. Test odtwarzania kopii zapasowej (co kwartał) — wymaga planu Supabase z kopiami.

## Decyzje do podjęcia (ze specyfikacji)

- Zakres roli Biuro (w systemie: tylko przypisane sprawy + zgłoszenia ze strony).
- Okresy przechowywania danych per kategoria.
- Wzór success fee (podstawa, warunek).
- Reguły liczenia terminów i lista świąt — weryfikacja prawnika.
- Model podziału wpłat (handlowiec, marketing) — zgodność z przepisami o zawodzie, weryfikacja prawnika.
- Teksty uwag prawnych w kalkulatorach — weryfikacja prawnika.
