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

## Uzupełnienia specyfikacji (migracja 004, 26.10.2026)

- **Reguły powiadomień** (Ustawienia → Powiadomienia): dla każdego zdarzenia dodatkowe grupy odbiorców (Administrator, zespół sprawy, prowadzący, uprawnieni do finansów, obsługa zgłoszeń) i włączenie/wyłączenie; powiadomień o terminach nie można wyłączyć. Nowe zdarzenia: nowa sprawa, zgłoszenie ze strony, dodanie dokumentu, zakończenie sprawy, naliczenie success fee.
- **Zastępstwa** (Ustawienia → Użytkownicy): w okresie zastępstwa powiadomienia trafiają też do zastępcy (z dopiskiem); sprawę zastępca otwiera tylko z własnym dostępem.
- **Harmonogram przypomnień** (Ustawienia → Przypomnienia o terminach): dni przed terminem oraz progi dla kontrolera i prowadzącego — osobno dla każdego typu terminu.
- **Zmiana uprawnień Administratora** wymaga ponownego podania hasła i kodu 2FA (ważne 5 min) — sprawdza baza.
- **Raporty:** filtr statusu, eksport CSV / XLSX / PDF (drukowanie do pliku), każdy w audycie; aplikant widzi własne czynności i terminy.
- **Wylogowanie po 30 min bezczynności**; kolejność kategorii także przeciąganiem.

**Testy:** reguły bazy 129/129 (`supabase/test/schema.test.mjs`), scenariusz przez interfejs dla wszystkich ról i strony 84/84 (`supabase/test/e2e/`).

## Treści strony (migracja 005, 27.10.2026)

- **🌐 Treści strony** w lewym menu — tylko Administrator (na razie; inne uprawnienia do ustalenia później). Przeniesione z dawnego `admin.html`, który został usunięty; przycisk ⚙️ Panel i link w stopce strony prowadzą do CRM.
- Zakładki: Ustawienia, Kategorie (porównywarka), Kalkulatory, Analiza umów, Tłumaczenia, SEO, Publikacja — te same funkcje co w starym panelu, bez osobnego hasła (logowanie CRM z 2FA).
- Zmiany to szkic w przeglądarce (z podglądem `index.html?preview`); **🚀 Opublikuj** zapisuje je w bazie (`site_content`, funkcja `site_publish` — tylko Administrator z 2FA, wpis w audycie). Strona publiczna czyta opublikowaną wersję; dopóki jej nie ma — `data.json`.
- SEO (meta tagi, robots.txt, sitemap) dalej buduje GitHub Actions z `data.json` w repo.
- Analiza w karcie sprawy korzysta z kalkulatorów z opublikowanej wersji.

## Zgodność ze specyfikacją v1.1 — przegląd 27.10.2026

Wszystkie 12 modułów jest zrobionych, a kryteria akceptacji sprawdzają testy (bazy i przez interfejs). Poprawione po przeglądzie (migracja 006):
- daty w bazie według czasu polskiego; przypomnienie „w dniu terminu” od 8:00 (§5),
- magazyn akt przyjmuje tylko dozwolone typy plików — sprawdza serwer, nie tylko przeglądarka (§7),
- raport liczony w bazie (`report_summary`), wynik pamiętany 5 min (§11),
- „Zapisz wynik jako czynność” w zakładce Analiza zapisuje czynność w bazie (wcześniej tylko w oknie przeglądarki),
- zasady haseł w Supabase: min. 12 znaków, małe i wielkie litery, cyfry, ponowne potwierdzenie przy zmianie hasła (§12).

Podpowiedzi: każda pozycja menu, zakładka i ważniejszy przycisk ma dymek (najechanie lub Tab), a pola i kolumny, których znaczenie nie jest oczywiste, mają ikonkę [?]. Teksty są w `crm-pomoc.js`. Numer wersji CRM widać przy nazwie w lewym górnym rogu.

Do decyzji właściciela:
- blokada konta po nieudanych logowaniach — w Supabase tylko w planie Team (hook „Password Verification Attempt”); teraz jest limit prób na adres IP (§12),
- uprawnienia jako akcje (podgląd / tworzenie / edycja / zatwierdzanie / usuwanie) zamiast poziomów pełny / ograniczony / brak — przebudowa modelu (§9),
- skan antywirusowy plików — wymaga zewnętrznej usługi (§7),
- e-mail i SMS — wybór dostawcy (§10); retencja RODO — okresy przechowywania per kategoria (§12); kopie zapasowe — plan Pro lub eksport (§12).

## Decyzje do podjęcia przed pełnym startem (ze specyfikacji)

- Zakres roli Biuro: wszystkie sprawy czy tylko przypisane (obecnie: przypisane).
- Okresy przechowywania danych per kategoria sprawy.
- Wzór success fee: podstawa naliczenia i warunek.
- Reguły liczenia terminów i lista świąt — weryfikacja prawnika.
- Zgodność modelu podziału wpłat (handlowiec, marketing) z przepisami o wykonywaniu zawodu — weryfikacja prawnika.
- Dostawca e-mail i SMS do powiadomień.
