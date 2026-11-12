# CRM Kancelarii

Zaplecze dla adwokatów i pracowników kancelarii według **specyfikacji v1.1 (22.10.2026)**. Strona dla klientów (`index.html`) to front, CRM (`crm.html`) to zaplecze, dane trzyma baza Supabase.

🔗 **Adres:** https://lexsalus.github.io/PiK/crm.html (wyłączony z indeksowania Google)

## Logowanie i konta

- **Aplikacja na telefonie / komputerze:** przycisk **📲 Zainstaluj aplikację** na ekranie logowania i w górnym pasku. Android i komputer (Chrome / Edge): okno instalacji; iPhone (Safari): Udostępnij → Do ekranu początkowego. Po instalacji przycisk znika.
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

**Testy:** reguły bazy 148/148 (`supabase/test/schema.test.mjs`), scenariusz przez interfejs dla wszystkich ról i strony 169/169 (`supabase/test/e2e/`).

## Treści strony (migracja 005, 27.10.2026)

- **🌐 Treści strony** w lewym menu — tylko Administrator (na razie; inne uprawnienia do ustalenia później). Przeniesione z dawnego `admin.html`, który został usunięty; przycisk ⚙️ Panel i link w stopce strony prowadzą do CRM.
- Zakładki: Ustawienia, Kategorie (porównywarka), Kalkulatory, Analiza umów, Tłumaczenia, SEO, Publikacja — te same funkcje co w starym panelu, bez osobnego hasła (logowanie CRM z 2FA).
- Zmiany to szkic w przeglądarce (z podglądem `index.html?preview`); **🚀 Opublikuj** zapisuje je w bazie (`site_content`, funkcja `site_publish` — tylko Administrator z 2FA, wpis w audycie). Strona publiczna czyta opublikowaną wersję; dopóki jej nie ma — `data.json`.
- SEO (meta tagi, robots.txt, sitemap) dalej buduje GitHub Actions z `data.json` w repo.
- Gdy opublikowana wersja (albo `data.json`, jeśli z CRM nic nie opublikowano) zmieni się po utworzeniu szkicu, CRM pokazuje ostrzeżenie z przyciskiem **🔍 Pokaż różnice** — lista: miejsce, wartość w szkicu, wartość opublikowana.
- Analiza w karcie sprawy korzysta z kalkulatorów z opublikowanej wersji.

## Zgodność ze specyfikacją v1.1 — przegląd 27.10.2026

Wszystkie 12 modułów jest zrobionych, a kryteria akceptacji sprawdzają testy (bazy i przez interfejs). Poprawione po przeglądzie (migracja 006):
- daty w bazie według czasu polskiego; przypomnienie „w dniu terminu” od 8:00 (§5),
- magazyn akt przyjmuje tylko dozwolone typy plików — sprawdza serwer, nie tylko przeglądarka (§7),
- raport liczony w bazie (`report_summary`), wynik pamiętany 5 min (§11),
- „Zapisz wynik jako czynność” w zakładce Analiza zapisuje czynność w bazie (wcześniej tylko w oknie przeglądarki),
- zasady haseł w Supabase: min. 12 znaków, małe i wielkie litery, cyfry, ponowne potwierdzenie przy zmianie hasła (§12).

Podpowiedzi: każda pozycja menu, zakładka i ważniejszy przycisk ma dymek (najechanie lub Tab), a pola i kolumny, których znaczenie nie jest oczywiste, mają ikonkę [?]. Teksty są w `crm/pomoc.js`. Numer wersji CRM widać przy nazwie w lewym górnym rogu.

Do decyzji właściciela:
- blokada konta po nieudanych logowaniach — w Supabase tylko w planie Team (hook „Password Verification Attempt”); teraz jest limit prób na adres IP (§12),
- skan antywirusowy plików — wymaga zewnętrznej usługi (§7),
- e-mail i SMS — wybór dostawcy (§10); retencja RODO — okresy przechowywania per kategoria (§12); kopie zapasowe — plan Pro lub eksport (§12).

## Uprawnienia: podgląd i zmiana (migracja 009, wariant pośredni §9)

- Dane klienta, dokumenty, notatki i czynności, terminy oraz zgłoszenia ze strony mają osobno **podgląd** i **zmianę** (dodawanie i edycja). Np. aplikant może widzieć dokumenty, ale ich nie dodawać.
- Usuwanie (uprawnienie „Usuwanie wpisów i czynności”) i zatwierdzanie (znacznik w zespole sprawy) zostają jak były.
- Dla obecnych ról i nadań nic się nie zmienia — „zmiana” dostała ten sam poziom co dotychczasowe uprawnienie. Nadaje się je w Ustawienia → Użytkownicy i uprawnienia (osobne wiersze „… — zmiana”).
- Model (uprawnienie × akcja) jest gotowy pod pełną macierz akcji (osobno dodawanie, edycja, zatwierdzanie, usuwanie) — to następny krok.

## Podgląd panelu (Administrator)

- **👁 Podgląd** w lewym menu: CRM oczami wybranej **roli** (domyślne uprawnienia, bez przypisań do spraw) albo **osoby** (rola, nadania indywidualne, sprawy z jej zespołów) — menu, sprawy, zakładki i przyciski.
- Tylko do odczytu: zapisy, przesyłanie plików i funkcje bazy są zablokowane; pasek u góry z przyciskiem „Zakończ podgląd”.
- Podgląd stosuje te same reguły co CRM na danych wczytanych przez Administratora. Nie pokazuje cudzych powiadomień ani raportów (liczy je baza dla zalogowanej osoby). Dostępu do danych i tak pilnuje baza.

## Logi (v1.39)

- Menu → Administracja → 📜 Logi: Publikacje (kto, kiedy, co się zmieniło), Logowania i bezpieczeństwo, Konfiguracja i konta, Sprawy, Pełny dziennik.
- Zielone kropki także w podzakładkach (Treści strony, Dotacje), przycisk 🔍 Różnice na górnym pasku Treści strony.

## Procesy spraw, listy kontrolne, kropki publikacji (v1.38)

- Ustawienia → **Procesy spraw**: etapy i listy kontrolne dla każdego procesu (także nowe procesy); kategoria DOT ma własny proces dotacji.
- Karta sprawy → Etapy: lista kontrolna z odklikiwaniem i punktami automatycznymi, ✏️ edycja etapu, + Etap.
- Zielona kropka w menu przy Treściach strony / Dotacjach, gdy jest co opublikować; powiadomienie „Do opublikowania” z nazwą osoby.

## Urzędy w Prawie, listy w porcjach (v1.34)

- 📜 Prawo → grupa **Urzędy** (pomarańczowa): Klauzule UOKiK (wyszukiwarka, porównanie zapisu umowy), Decyzje UODO, KNF · ZUS · KIS · UOKiK (wyszukiwarki). W analizie umowy w zgłoszeniu: podobne wpisy rejestru klauzul.
- Długie listy (Sprawy, Nowe sprawy, Dotacje → Zgłoszenia, Dziennik audytu) pokazują się porcjami z przyciskiem „Pokaż więcej”. Dziennik audytu wczytuje się z bazy dopiero po otwarciu zakładki (po 200 wpisów, „Wczytaj starsze”, „Odśwież”).

## Dotacje, pisma, filtr zgłoszeń (v1.32–1.33)

- Menu → grupa **Dotacje** (pomarańczowa) → 💶 Dotacje; zakładki w grupach: **Klienci** (Zgłoszenia) · **Katalog** (Źródła finansowania, Podgląd raportu) · **Serwis** (Treści i ustawienia, Publikacja).
- Nowe sprawy: filtr kategorii (`#/nowe/DOT`), karta zgłoszenia z serwisu dotacji pokazuje wstępny raport.
- Karta sprawy → Dokumenty → 📝 Pismo z szablonu; Ustawienia → Pisma i szablony.

## Kredyt walutowy, orzecznictwo i obserwowane ustawy (v1.29–1.31)

- 📜 Prawo → **Orzecznictwo**: najnowsze orzeczenia z SAOS dla kategorii spraw, dołączanie do sprawy, wyszukiwarki (SAOS, sądy powszechne, SN, TSUE); karta sprawy → Analiza: orzeczenia z kategorii sprawy.
- 📜 Prawo → **Kredyt walutowy**: symulacja kredytu CHF/EUR z kursów NBP (raty, wpłaty, saldo, tabela lat, wpływ kursu). Zgłoszenia ze strony pokazują symulację klienta.
- Treści strony → ✨ Nowe funkcje → **Obserwowane ustawy**: lista ustaw i słów do projektów (zamiast pliku w repozytorium).

## Zakładki karty sprawy i Prawa w grupach (v1.28.0)

Karta sprawy: **Sprawa** (Dane klienta, Etapy, Historia) · **Praca nad sprawą** (Terminy, Dokumenty, Zespół) · **Pieniądze** (Finanse) · **Analiza i prawo** (Analiza). Prawo: **Zmiany** (Zmiany w ustawach, Projekty) · **Narzędzia** (Odsetki, Przepisy, Orzecznictwo). Zgłoszenie z restrukturyzacji pokazuje plan dla wierzycieli (rata, miesiące spłaty).

## Zakładki w grupach i 🔧 Techniczne (v1.25.0)

- **Treści strony** — zakładki w grupach z kolorami: **Strona** (Ustawienia, Kategorie), **Narzędzia dla klienta** (Kalkulatory, Analiza umów, Nowe funkcje), **Kontakt** (Czat Adam), **Zasięg** (Tłumaczenia, SEO), **Technika i publikacja** (Techniczne, Publikacja). **Kropka** przy zakładce = w tej części szkic różni się od opublikowanej wersji. Dymki opisują zakładki.
- **Ustawienia** — zakładki w grupach: **Moje** (Moje konto), **Sprawy i terminy** (Kategorie, Święta, Przypomnienia, Powiadomienia), **Dostęp i bezpieczeństwo** (Użytkownicy, Dziennik audytu, System); każdy widzi tylko swoje.
- **🔧 Techniczne** (Treści strony): stan systemu (baza, świeżość danych z API Sejmu, zgodność wersji strony i CRM, ostatnia publikacja), synchronizacja prawa (wynik, dziennik, „Uruchom teraz” w GitHub Actions, lista ustaw), **tryb serwisowy** (baner na stronie, wstrzymanie zgłoszeń), limity (rozmiar pliku umowy, strony OCR; limity pilnowane przez bazę), połączenie z bazą (adres i klucz publiczny — przeniesione z Ustawień), aplikacja na tym urządzeniu (stan, „Wyczyść pamięć aplikacji”).

## Treści strony — nowe zakładki (v1.24.0)

- **💬 Czat Adam**: włączenie, imię, podpis, przycisk, powitanie, zastrzeżenie, pokazywanie przepisów, szukanie w przepisach, przyciski na powitanie, własne tematy (frazy, odpowiedź, przyciski), tester odpowiedzi na szkicu.
- **✨ Nowe funkcje**: sekcja „Zmiany w prawie”, komunikat o zwrocie z umowy (typy kredytów, teksty), restrukturyzacja firmy (pokaż/ukryj, wartości startowe), skany umów (OCR).

## Menu (v1.23.0)

Menu jest podzielone na grupy z kolorami: **Codzienna praca** (niebieski: Pulpit, Sprawy, Nowe sprawy, Terminy, Powiadomienia), **Kancelaria** (zielony: Zespół, Finanse, Raporty), **Prawo** (fiolet), **Administracja** (pomarańcz: Treści strony, Podgląd, Ustawienia). Każdy widzi tylko pozycje ze swoich uprawnień; pusta grupa znika. Dymek przy pozycji opisuje zakładkę i mówi, dlaczego ją widzisz (np. „uprawnienie Terminy”). Na telefonie grupy są oznaczone kolorem paska pod pozycją.

## 📜 Prawo (v1.20–1.21, 08.11.2026)

- **Zmiany w ustawach:** nowelizacje obserwowanych ustaw z datą wejścia w życie i liczbą otwartych spraw, których dotyczą (kategorie); znacznik „nowe” i licznik w menu, kafelek na pulpicie. Tabela obserwowanych ustaw: status, aktualny tekst jednolity, liczba nowelizacji.
- **Projekty w Sejmie:** projekty ustaw z ostatnich 6 miesięcy pasujące do kategorii spraw, z etapem.
- **Odsetki:** stawki z obwieszczeń (Monitor Polski), maksymalne, kontrola kalkulatorów (które mają stawki na sztywno) i limitów analizy umów.
- **Przepisy:** wyszukiwarka (numer artykułu z ustawą albo opis słowami); **📎 Dołącz do sprawy** — notatka „analiza” z treścią, stanem prawnym na dzień (tekst jednolity + nowelizacje w mocy, późniejsze zmiany).
- **Karta sprawy → Analiza → 📜 Przepisy** — to samo dla bieżącej sprawy; przy sprawie ze strony: **Analiza umowy klienta** (wykryte zapisy, podstawa prawna, orzecznictwo, fragmenty, dane odczytane z umowy, ustawy powołane w umowie).
- **Nowe sprawy:** zgłoszenie z analizy umowy pokazuje tę samą analizę; zgłoszenie z restrukturyzacji firmy — listę długów, wariant układu, wynik i ścieżki postępowań z podstawami. Klient na stronie widzi tylko komunikat o klauzulach abuzywnych i kwotę.
- Przepisy w treści (np. „art. 385³ pkt 10 KC”) są klikalne — podgląd artykułu z aktualnego tekstu jednolitego.

## Decyzje do podjęcia przed pełnym startem (ze specyfikacji)

- Zakres roli Biuro: wszystkie sprawy czy tylko przypisane (obecnie: przypisane).
- Okresy przechowywania danych per kategoria sprawy.
- Wzór success fee: podstawa naliczenia i warunek.
- Reguły liczenia terminów i lista świąt — weryfikacja prawnika.
- Zgodność modelu podziału wpłat (handlowiec, marketing) z przepisami o wykonywaniu zawodu — weryfikacja prawnika.
- Dostawca e-mail i SMS do powiadomień.
