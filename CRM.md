# CRM Kancelarii

Zaplecze dla adwokatów i pracowników kancelarii według **specyfikacji v1.1 (22.10.2026)**. Strona dla klientów (`index.html`) to front, CRM (`crm.html`) to zaplecze, dane trzyma baza Supabase.

🔗 **Adres:** https://lexsalus.github.io/PiK/crm.html (wyłączony z indeksowania Google)

## Logowanie i konta

- **Logowanie:** e-mail + hasło. Administrator, pełnomocnicy i obsługa techniczna przy pierwszym logowaniu skanują kod QR aplikacją (Google / Microsoft Authenticator), potem podają 6-cyfrowy kod. Bez 2FA baza nie zwraca im żadnych danych.
- **Nie pamiętam hasła:** link na ekranie logowania → e-mail → nowe hasło.
- **Nowe konto:** Administrator zakłada je w Supabase (Authentication → Users → Add user), potem w CRM → Ustawienia → Użytkownicy nadaje rolę i aktywuje. Samodzielna rejestracja jest wyłączona; nieaktywne konto nic nie widzi.

| Rola | Zakres |
|------|--------|
| Administrator | wszystko: sprawy, finanse i podział wpłat, uprawnienia, audyt, decyzje o korektach |
| Pełnomocnik | sprawy, do których jest przypisany; w finansach tylko własne wynagrodzenie |
| Aplikant | przypisane sprawy bez finansów; nie usuwa wpisów |
| Biuro | zgłoszenia ze strony („Nowe sprawy”), zakładanie spraw, przypisane sprawy |
| Obsługa techniczna | tylko Ustawienia → System; wgląd w sprawy wyłącznie w dostępie awaryjnym (60 min, zgoda Administratora) |
| Pielęgniarka | konto w tej samej bazie; pracuje w osobnym panelu pielęgniarek (po zalogowaniu do CRM przekierowanie); bez spraw kancelarii |

**Wszystkie operacje idą przez bazę** — to ona decyduje, co wolno. Komunikat błędu w CRM to odpowiedź bazy (np. „Usuwa tylko Administrator”).

## Moduły a specyfikacja

| § | Moduł | W systemie |
|---|-------|------------|
| 1 | Kategorie spraw | 8 kategorii (RST, SKD, CHF, PLN, FX, ROD, CIV, INNE), kolor, kolejność, dezaktywacja, waluta dla FX, osobny szablon RST, numeracja KOD-ROK-NNNN nadawana przez bazę |
| 2 | Menu i pulpit | menu z uprawnień, kafelki, ostatnie sprawy, wyszukiwarka tylko po sprawach z dostępem, liczniki odświeżane co 30 s |
| 3 | Karta sprawy | zakładki zależne od uprawnień, PESEL zaszyfrowany i maskowany (odsłonięcie z uprawnieniem → audyt), historia „przed → po” |
| 4 | Etapy i usuwanie | 10 etapów, zatwierdzenie blokuje wpisy, wniosek o korektę → decyzja Administratora, soft delete z uzasadnieniem, kontrola konfliktu interesów |
| 5 | Terminy | kalkulator (art. 111–112, 115 KC, święta stałe i ruchome), druga osoba dla ustawowych, T-14/7/3/1/0 i eskalacja (serwer co 15 min), „Wykonano” z dowodem, zmiana daty = wersja, eksport .ics |
| 6 | Zespół sprawy | zakres dostępu (dokumenty / czynności / finanse / zatwierdzanie), jeden pełnomocnik prowadzący, odebranie dostępu działa od razu |
| 7 | Wpisy i dokumenty | notatki i czynności z wersjami, dokumenty w prywatnym magazynie „akta” z wersjami i SHA-256, pobieranie linkiem ważnym 60 s |
| 8 | Finanse | wpływy, podział z „Bilans 0 zł” pilnowanym przez bazę, statusy do „wypłacone”, wersje zmian, widok pełnomocnika |
| 9 | Role i uprawnienia | macierz ról, nadania indywidualne z ważnością i uzasadnieniem, min. 1 aktywny Administrator |
| 10 | Powiadomienia | tworzone przez bazę; odbiorcy z ról i przypisań; zakładki Wszystkie / Do przeczytania / Wymagające działania |
| 11 | Raporty | KPI, sprawy wg kategorii, statusy, terminy; eksport CSV zapisywany w audycie |
| 12 | Bezpieczeństwo | 2FA egzekwowane w bazie, dziennik audytu tylko do dopisywania z łańcuchem SHA-256 i weryfikacją, dostęp awaryjny |
| + | Analiza | kalkulatory ze strony na danych sprawy, wynik zgłoszenia klienta, zapis jako czynność |
| + | Pielęgniarki | osobna aplikacja (https://lexsalus.github.io/Pielegniarki/) — opis niżej |

## Pielęgniarki — osobna aplikacja

Panel pielęgniarek (projekt 23.10.2026) jest osobną aplikacją: repo `Lexsalus/Pielegniarki`, adres https://lexsalus.github.io/Pielegniarki/. Korzysta z tej samej bazy CRMKP (migracja 004) i tych samych kont. W CRM zostają: rola „Pielęgniarka” i uprawnienie „Pielęgniarki” (Ustawienia → Użytkownicy) oraz link „Panel pielęgniarek” w menu dla osób z tym uprawnieniem. Pielęgniarka logująca się do CRM jest przekierowana do panelu; powiadomienia o zleceniach otwierają panel.

**Testy:** reguły bazy 120/120 (`supabase/test/schema.test.mjs`), scenariusz przez interfejs dla wszystkich ról 36/36 (`supabase/test/e2e/`); panel pielęgniarek: `run_pielegniarki.py` (repo Pielegniarki serwowane na porcie 8766).

## Decyzje do podjęcia przed pełnym startem (ze specyfikacji)

- Zakres roli Biuro: wszystkie sprawy czy tylko przypisane (obecnie: przypisane).
- Okresy przechowywania danych per kategoria sprawy.
- Wzór success fee: podstawa naliczenia i warunek.
- Reguły liczenia terminów i lista świąt — weryfikacja prawnika.
- Zgodność modelu podziału wpłat (handlowiec, marketing) z przepisami o wykonywaniu zawodu — weryfikacja prawnika.
- Dostawca e-mail i SMS do powiadomień.
