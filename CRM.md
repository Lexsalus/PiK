# CRM Kancelarii — prototyp

Klikalny prototyp backendu dla pracowników kancelarii, zbudowany według **specyfikacji v1.1 (22.10.2026)**.
Strona dla klienta (`index.html`) to front; CRM (`crm.html`) to zaplecze, w którym adwokaci i pracownicy analizują sprawy.

🔗 **Adres:** https://lexsalus.github.io/PiK/crm.html (wyłączony z indeksowania Google)

> ⚠️ **To jest prototyp.** Dane przykładowe zapisują się tylko w przeglądarce (localStorage), logowanie odbywa się bez hasła, a reguły dostępu sprawdza przeglądarka. **Nie wpisuj prawdziwych danych klientów.** Wersja produkcyjna powstanie na Supabase (patrz niżej).

## Jak przetestować

1. Otwórz `crm.html` i wybierz osobę. Każda ma inną rolę:

| Osoba | Rola | Co warto sprawdzić |
|-------|------|--------------------|
| Maria Wójcik | Administrator | wszystko: podział wpłat, uprawnienia, audyt, zatwierdzanie korekt |
| Jan Nowak | Pełnomocnik | tylko swoje sprawy; w Finansach wyłącznie własne wynagrodzenie (1 000 zł w SKD-2026-0001) |
| Piotr Wiśniewski | Pełnomocnik | inne sprawy; jest kontrolerem terminu „Odpowiedź na pozew” |
| Anna Kowalska | Aplikant | brak Finansów (także przez adres → 403), nie usunie własnego wpisu |
| Katarzyna Lis | Biuro | „Nowe sprawy” (zgłoszenia z formularza), zakładanie spraw |
| Tomasz Kamiński | Obsługa techniczna | tylko Ustawienia → System; dostęp awaryjny 60 min po zgodzie Administratora |

2. **Front → CRM:** na stronie w sekcji „Co mi się należy” policz roszczenie i wyślij zgłoszenie (tryb test). W tej samej przeglądarce zgłoszenie pojawi się w CRM w **Nowe sprawy**. Przycisk „Załóż sprawę” nada numer, a wynik kalkulatora trafi do zakładki **Analiza**.
3. **Przywrócenie danych:** ekran logowania → „Przywróć dane przykładowe”.

## Moduły a specyfikacja

| § | Moduł | W prototypie |
|---|-------|--------------|
| 1 | Kategorie spraw | 8 kategorii (RST, SKD, CHF, PLN, FX, ROD, CIV, INNE), kolor, kolejność, dezaktywacja, waluta dla FX, osobny szablon RST, numeracja KOD-ROK-NNNN |
| 2 | Menu i pulpit | menu budowane z uprawnień, kafelki, ostatnie sprawy, wyszukiwarka tylko po sprawach z dostępem, liczniki odświeżane co 30 s |
| 3 | Karta sprawy | zakładki zależne od uprawnień, PESEL maskowany (odsłonięcie z uprawnieniem → audyt), historia „przed → po” |
| 4 | Etapy i usuwanie | 10 etapów, zatwierdzenie blokuje wpisy, wniosek o korektę → decyzja Administratora, soft delete z uzasadnieniem, kontrola konfliktu interesów blokuje przejście dalej |
| 5 | Terminy | kalkulator (art. 111–112, 115 KC, święta stałe i ruchome), druga osoba dla terminów ustawowych, statusy i kolory, T-14/7/3/1/0, eskalacja, „Wykonano” z datą i załącznikiem, zmiana daty = wersja, eksport .ics |
| 6 | Zespół sprawy | dodawanie z zakresem (dokumenty / czynności / finanse / zatwierdzanie), jeden pełnomocnik prowadzący, odebranie dostępu działa od razu, komunikat o pełnomocnictwie |
| 7 | Wpisy i dokumenty | notatki i czynności, wersje edycji, dokumenty z wersjami i SHA-256, termin kolejnej czynności → Terminy |
| 8 | Finanse | wpływy, podział z „Bilans 0 zł”, statusy planowane → zatwierdzone → należne → wypłacone, wersje zmian, widok pełnomocnika |
| 9 | Role i uprawnienia | macierz ról, nadania indywidualne z okresem ważności i uzasadnieniem, 2FA przy zmianie Administratora, min. 1 aktywny Administrator |
| 10 | Powiadomienia | silnik zdarzeń, odbiorcy z ról i przypisań, zakładki Wszystkie / Do przeczytania / Wymagające działania |
| 11 | Raporty | KPI, sprawy wg kategorii, statusy, terminy; filtry; eksport CSV zapisywany w audycie |
| 12 | Bezpieczeństwo | dziennik audytu tylko do dopisywania z łańcuchem skrótów SHA-256 (przycisk weryfikacji), kopie zapasowe i test odtwarzania, dostęp awaryjny |
| + | Analiza | kalkulatory ze strony na danych sprawy, zapis wyniku jako czynność |

**Sprawdzone automatycznie (kryteria akceptacji):** numeracja bez duplikatów; termin 30 dni od 22.10.2026 → 23.11.2026; aplikant bez Finansów (403 w menu i przez adres), DELETE wpisu → 403; pełnomocnik widzi tylko swoją pozycję 1 000 zł; pełnomocnik spoza zespołu → 403; po odebraniu dostępu → 403; obsługa techniczna bez spraw; eskalacja przekroczonego terminu; manipulacja w audycie wykryta.

## Przejście na produkcję (Supabase)

Prototyp pokazuje ekrany i reguły. W wersji produkcyjnej te same reguły musi egzekwować serwer:

| Prototyp | Produkcja |
|----------|-----------|
| localStorage | PostgreSQL w Supabase (region UE) |
| wybór osoby bez hasła | Supabase Auth: hasło + 2FA (TOTP), blokada po nieudanych próbach |
| sprawdzanie uprawnień w przeglądarce | polityki RLS na każdej tabeli + funkcje SQL |
| audyt w pamięci | tabela tylko INSERT (REVOKE UPDATE/DELETE), łańcuch skrótów w triggerze |
| metadane plików | Supabase Storage, prywatne kubełki, podpisane linki |
| zadanie przypomnień w przeglądarce | zadanie cykliczne co 15 min (pg_cron / Edge Function) + e-mail / SMS |
| zgłoszenia z formularza w localStorage | INSERT do tabeli `leads` (tylko zapis, bez odczytu dla anonimowych) |

**Stan:** projekt Supabase założony; schemat bazy z RLS gotowy w `supabase/schema.sql` (62 testy kryteriów akceptacji). Wdrożenie krok po kroku: **[SUPABASE.md](SUPABASE.md)**.

## Decyzje do podjęcia przed startem (ze specyfikacji)

- Zakres roli Biuro: wszystkie sprawy czy tylko przypisane (w prototypie: przypisane).
- Okresy przechowywania danych per kategoria sprawy.
- Wzór success fee: podstawa naliczenia i warunek.
- Reguły liczenia terminów i lista świąt — weryfikacja prawnika.
- Zgodność modelu podziału wpłat (handlowiec, marketing) z przepisami o wykonywaniu zawodu — weryfikacja prawnika.
- Dostawca e-mail i SMS; lokalizacja kopii zapasowych.
