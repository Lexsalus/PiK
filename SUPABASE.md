# Wdrożenie bazy CRM w Supabase

Projekt: **ixlhfhzgzotukstoezcj** · adres: `https://ixlhfhzgzotukstoezcj.supabase.co`

Schemat `supabase/schema.sql` zawiera wszystkie tabele ze specyfikacji v1.1, reguły dostępu w bazie (RLS), dziennik audytu z łańcuchem skrótów i zapis zgłoszeń z formularza. Przeszedł 62 testy kryteriów akceptacji na PostgreSQL (`supabase/test/schema.test.mjs`).

## Stan wdrożenia (26.10.2026)

- ✅ Krok 1 — schemat uruchomiony (29 tabel z RLS, 60 reguł dostępu); sprawdzono z zewnątrz: anonimowy może tylko dodać zgłoszenie
- ✅ Krok 2 — samodzielna rejestracja wyłączona (sprawdzone: „Signups not allowed”); adres linków w e-mailach: `https://lexsalus.github.io/PiK/crm.html`; 2FA (TOTP) włączone w projekcie
- ✅ Krok 3 — Administrator: `biuro@lekarzeiterapeuci.pl` (nazwa wyświetlana „Admin”), aktywny, wpis w audycie
- ✅ Krok 4 — pg_cron: zadanie `przypomnienia-terminy` co 15 min
- ✅ Krok 5 — formularz na stronie zapisuje zgłoszenia w tabeli `leads`

## Krok 1 — uruchom schemat (raz)

1. Otwórz **SQL Editor**: https://supabase.com/dashboard/project/ixlhfhzgzotukstoezcj/sql/new
2. Wklej całą zawartość pliku `supabase/schema.sql` → **Run**.
3. Na końcu powinno pojawić się „Success. No rows returned”.

> Uruchom tylko raz. Ponowne uruchomienie zgłosi błąd „already exists” — to nic nie psuje.

## Krok 2 — zablokuj samodzielną rejestrację

Konta zakłada wyłącznie Administrator.
**Authentication → Sign In / Providers → Email** → wyłącz **Allow new users to sign up** → Save.

(Nawet gdyby ktoś założył konto, baza tworzy je jako *nieaktywne* — bez dostępu do czegokolwiek.)

## Krok 3 — pierwszy Administrator

1. **Authentication → Users → Add user → Create new user**: https://supabase.com/dashboard/project/ixlhfhzgzotukstoezcj/auth/users
   Wpisz swój e-mail i hasło, zaznacz *Auto Confirm User*.
2. W SQL Editor uruchom (podmień e-mail i imię):

```sql
update public.profiles set role='admin', active=true, full_name='Imię Nazwisko'
where email='twoj@email.pl';
```

Kolejnych pracowników dodajesz tak samo (Add user), a rolę ustawiasz w CRM → Ustawienia → Użytkownicy (po podłączeniu CRM do bazy) albo poleceniem `update` jak wyżej (`role` = `att` pełnomocnik, `app` aplikant, `office` biuro, `tech` obsługa techniczna).

## Krok 4 — przypomnienia o terminach co 15 minut

1. **Database → Extensions** → wyszukaj **pg_cron** → włącz: https://supabase.com/dashboard/project/ixlhfhzgzotukstoezcj/database/extensions
2. W SQL Editor:

```sql
select cron.schedule('przypomnienia-terminy','*/15 * * * *','select public.run_deadline_reminders()');
```

## Krok 5 — formularz na stronie zapisuje zgłoszenia w bazie

Panel treści (`admin.html`) → **Ustawienia → Formularz zgłoszenia sprawy** → *Gdzie trafia zgłoszenie*: **Baza CRM (Supabase)**.
Adres i klucz publiczny są już wpisane. Potem **Publikacja → Pobierz data.json** i wrzuć do repo (albo napisz mi, że krok 1 jest zrobiony — przełączę i wyślę).

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

## Następny etap

Podłączenie `crm.html` do bazy: logowanie (hasło + 2FA), odczyt i zapis spraw przez Supabase, dokumenty w Storage (prywatny kubełek `akta`). Prototyp na danych przykładowych zostaje do prezentacji.

## Test schematu lokalnie

```
cd supabase/test
npm i @electric-sql/pglite@0.4.6
node schema.test.mjs
```
