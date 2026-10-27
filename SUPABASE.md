# Wdrożenie bazy CRM w Supabase

Projekt: **Porównywarka** (dawniej „Piel”) `eamobnucjsavahpxilrt` (UE, Irlandia) · adres: `https://eamobnucjsavahpxilrt.supabase.co`

> Od 26.10.2026 PiK (strona + CRM kancelarii) ma własną bazę. Poprzedni projekt **CRM Pielęgniarki** (dawniej „CRMKP”, `ixlhfhzgzotukstoezcj`) należy teraz do panelu pielęgniarek (repo `Lexsalus/Pielegniarki`).

Schemat `supabase/schema.sql` zawiera wszystkie tabele ze specyfikacji v1.1, reguły dostępu w bazie (RLS), dziennik audytu z łańcuchem skrótów i zapis zgłoszeń z formularza. Razem z migracjami przechodzi 74 testy reguł na PostgreSQL (`supabase/test/schema.test.mjs`).

## Stan wdrożenia (26.10.2026, nowy projekt `eamobnucjsavahpxilrt`)

- ✅ Krok 1 — schemat + migracje 002–003 (004–005: niżej) (29 tabel z RLS, 60 polityk, 8 kategorii, magazyn `akta`)
- ✅ Krok 2 — rejestracja wyłączona; adres logowania i przekierowań: `https://lexsalus.github.io/PiK/crm.html` (`/PiK/**`); 2FA (TOTP) włączone
- ✅ Krok 3 — Administrator: `biuro@lekarzeiterapeuci.pl` (nazwa „Admin”), aktywny; 2FA konfiguruje się przy pierwszym logowaniu (konto z błędnym adresem usunięte)
- ✅ Krok 4 — pg_cron: zadanie `przypomnienia-terminy` co 15 min
- ✅ Migracja `004_uzupelnienia_specyfikacji.sql` (wdrożona 27.10.2026) — reguły powiadomień, zastępstwa, harmonogram przypomnień per typ, 2FA przy zmianie uprawnień Administratora, raporty aplikanta
- ✅ Krok 5 — formularz na stronie i CRM wskazują nowy projekt (`data.json`, `crm.html`)
- ✅ Migracja `007_naprawa_kodowania.sql` (27.10.2026) — naprawa polskich znaków po wdrożeniu 004 i 005 (wysłane w złym kodowaniu; m.in. powiadomienie o success fee nie powstawało). Przy wdrożeniach przez API wysyłać treść jako UTF-8.
- ✅ Migracja `006_zgodnosc_specyfikacji.sql` (wdrożona 27.10.2026) — czas polski w bazie (Europe/Warsaw), przypomnienie w dniu terminu od 8:00, dozwolone typy plików w magazynie `akta`, raport liczony w bazie (`report_summary`).
- ✅ Migracja `005_tresci_strony.sql` (wdrożona 27.10.2026) — treści strony w bazie (`site_content`), publikacja z CRM tylko przez Administratora z 2FA (`site_publish`). Dopóki nic nie opublikowano, strona korzysta z `data.json`.
- ⏳ Po wdrożeniu: usunąć tokeny API (Supabase → Account → Access Tokens) i pliki z tokenami z pulpitu

Kroki poniżej opisują świeżą instalację (np. nowy projekt albo odtworzenie).

## Migracje

Nowe zmiany bazy: plik `supabase/migrations/00N_opis.sql` (uruchamiany raz w SQL Editor). Świeża instalacja: `schema.sql`, potem wszystkie migracje po kolei.

## Krok 1 — uruchom schemat (raz)

1. Otwórz **SQL Editor**: https://supabase.com/dashboard/project/eamobnucjsavahpxilrt/sql/new
2. Wklej całą zawartość pliku `supabase/schema.sql` → **Run**.
3. Na końcu powinno pojawić się „Success. No rows returned”.

> Uruchom tylko raz. Ponowne uruchomienie zgłosi błąd „already exists” — to nic nie psuje.

## Krok 2 — zablokuj samodzielną rejestrację

Konta zakłada wyłącznie Administrator.
**Authentication → Sign In / Providers → Email** → wyłącz **Allow new users to sign up** → Save.

(Nawet gdyby ktoś założył konto, baza tworzy je jako *nieaktywne* — bez dostępu do czegokolwiek.)

## Krok 3 — pierwszy Administrator

1. **Authentication → Users → Add user → Create new user**: https://supabase.com/dashboard/project/eamobnucjsavahpxilrt/auth/users
   Wpisz swój e-mail i hasło, zaznacz *Auto Confirm User*.
2. W SQL Editor uruchom (podmień e-mail i imię):

```sql
update public.profiles set role='admin', active=true, full_name='Imię Nazwisko'
where email='twoj@email.pl';
```

Kolejnych pracowników dodajesz tak samo (Add user), a rolę ustawiasz w CRM → Ustawienia → Użytkownicy albo poleceniem `update` jak wyżej (`role` = `att` pełnomocnik, `app` aplikant, `office` biuro, `tech` obsługa techniczna).

## Krok 4 — przypomnienia o terminach co 15 minut

1. **Database → Extensions** → wyszukaj **pg_cron** → włącz: https://supabase.com/dashboard/project/eamobnucjsavahpxilrt/database/extensions
2. W SQL Editor:

```sql
select cron.schedule('przypomnienia-terminy','*/15 * * * *','select public.run_deadline_reminders()');
```

## Krok 5 — formularz na stronie zapisuje zgłoszenia w bazie

CRM → **🌐 Treści strony → Ustawienia → Formularz zgłoszenia sprawy** → *Gdzie trafia zgłoszenie*: **Baza CRM (Supabase)** (ustawione domyślnie) + adres projektu i klucz publiczny. Po zmianie: **🚀 Opublikuj**.
Przy nowym projekcie Supabase podmień też adres i klucz publiczny w `index.html` (stałe `SITE_DB`, `SITE_KEY` — odczyt opublikowanych treści).
Przy nowym projekcie Supabase podmień też adres i klucz publiczny w `crm.html` (stałe na początku skryptu).

Sprawdzenie: wyślij zgłoszenie testowe ze strony → **Table Editor → leads** — powinien pojawić się wiersz.

## Klucze — co jest bezpieczne

| Klucz | Gdzie | Uwagi |
|-------|-------|-------|
| `sb_publishable_…` | strona, CRM, `data.json` | może być jawny — dostęp ogranicza RLS (anonimowy może tylko dodać zgłoszenie) |
| `sb_secret_…` | **nigdzie w kodzie strony** | omija wszystkie reguły; panel odrzuca próbę wpisania |
| hasło do bazy | tylko u Ciebie | niepotrzebne do działania strony |

## Co zabezpiecza baza (a nie przeglądarka)

- dostęp do sprawy: Administrator + członkowie zespołu; reszta nie widzi nawet, że sprawa istnieje,
- finanse w osobnych tabelach: aplikant nie dostaje ich w ogóle, pełnomocnik tylko swoje pozycje,
- PESEL szyfrowany (pgcrypto), odsłonięcie tylko z uprawnieniem i zawsze w audycie,
- zatwierdzony etap blokuje wpisy; usuwanie tylko przez Administratora z uzasadnieniem (soft delete),
- terminy ustawowe wymagają drugiej osoby; zmiana daty tylko z uzasadnieniem (wersje),
- podział wpłat: suma = kwota wpływu, inaczej nie można zatwierdzić,
- dziennik audytu: tylko dopisywanie (także dla Administratora), łańcuch skrótów SHA-256, funkcja `verify_audit_chain()`.

## CRM

`crm.html` jest podłączony do bazy (logowanie z 2FA, dane i operacje przez Supabase, dokumenty w magazynie `akta`). Opis: CRM.md.

## Test schematu lokalnie

```
cd supabase/test
npm i @electric-sql/pglite@0.4.6
node schema.test.mjs
```
