# Changelog

Format: [SemVer](https://semver.org/lang/pl/) — `MAJOR.MINOR.PATCH`. Każda wysyłka (push) = podbicie wersji.

## [1.41.1] — 2026-11-12
- CRM: logo, nazwa i wersja na górze lewego menu zostają na miejscu — przewija się tylko menu

## [1.41.0] — 2026-11-12
- Powiadomienie „Opublikowano: …” dla pozostałych Administratorów (kto i co zmienił, link do Logów); migracja 018

## [1.40.1] — 2026-11-12
- Powiadomienie „Do opublikowania” raz na cykl publikacji (po każdej publikacji kolejna zmiana daje nowe); migracja 017

## [1.40.0] — 2026-11-12
- „Co nowego” w lewym menu: lista wersji z datą i opisem zmian, zielona kropka przy nowej wersji

## [1.39.1] — 2026-11-12
- Poprawka: Treści strony i Dotacje nie pokazują „do opublikowania” po ponownym wejściu, gdy treści są takie same (baza zmienia kolejność pól)

## [1.39.0] — 2026-11-12
- 📜 Logi w menu (publikacje z opisem zmian, logowania i bezpieczeństwo, konfiguracja, sprawy, pełny dziennik); kropki publikacji w podzakładkach, powiadomienia o nieopublikowanych treściach, przycisk Różnice; kółko w serwisie dotacji; migracje 015–016

## [1.38.0] — 2026-11-12
- Procesy spraw edytowane w CRM (proces Dotacje i granty), listy kontrolne etapów z punktami automatycznymi, edycja i dodawanie etapów w sprawie; zielona kropka w menu przy publikacji i powiadomienie z nazwą osoby; migracja 014

## [1.37.0] — 2026-11-12
- Serwis dotacji przeniesiony do PiK (dotacje/); na stronie menu „Dotacje” i kafelek w „Dla firm”

## [1.36.0] — 2026-11-12
- Awaryjny przełącznik 2FA (Ustawienia → System, znacznik w menu, audyt); migracja 013 — 2FA tymczasowo wyłączone

## [1.35.0] — 2026-11-11
- Porządek w plikach: style i skrypty wydzielone z crm.html i index.html; foldery crm/, strona/, wspolne/, docs/, tools/; dziennik synchronizacji w prawo/log/

## [1.34.0] — 2026-11-11
- Prawo → Urzędy: rejestr klauzul niedozwolonych UOKiK (wyszukiwarka, porównanie zapisu umowy, podobne wpisy w analizie), decyzje UODO, wyszukiwarki KIS/ZUS/KNF/UOKiK; listy w porcjach, dziennik audytu na żądanie; migracje 011–012 wdrożone

## [1.33.0] — 2026-11-11
- Serwis dotacji (Lexsalus/Grants) w CRM: menu Dotacje (zgłoszenia, źródła finansowania, podgląd raportu, treści, publikacja), zgłoszenia DOT, filtr kategorii w Nowych sprawach; migracja 012

## [1.32.0] — 2026-11-11
- Pisma z szablonów: DOCX, wydruk/PDF, zapis w dokumentach sprawy; Ustawienia → Pisma i szablony (dane kancelarii, własne szablony); migracja 011

## [1.31.0] — 2026-11-09
- Orzecznictwo z SAOS: CRM → Prawo → Orzecznictwo (lista dla kategorii, dołączanie do sprawy, wyszukiwarki SAOS/sądy/SN/TSUE), orzeczenia w karcie sprawy, zapytania edytowane w CRM

## [1.30.0] — 2026-11-09
- Kredyt CHF/EUR z historycznymi kursami NBP: rata, liczba rat i saldo bez pytania klienta (kalkulator, zwrot z umowy), CRM → Prawo → Kredyt walutowy; synchronizacja pobiera kursy NBP

## [1.29.0] — 2026-11-09
- Lista obserwowanych ustaw i słów do projektów w Sejmie edytowana w CRM (Treści strony → Nowe funkcje), sprawdzanie adresu ELI w API Sejmu; synchronizacja czyta listę z bazy

## [1.28.0] — 2026-11-09
- Restrukturyzacja: harmonogram miesiąc po miesiącu, plan dla wierzycieli, wydruk/PDF, plan w CRM; zakładki karty sprawy i Prawa w grupach z kolorami i dymkami

## [1.27.0] — 2026-11-09
- Migracja 010: powiadomienia o zmianach w prawie w bazie (pg_cron+pg_net, zapasowo z CRM), zakładanie kont z CRM (funkcja serwera konta, hasło tymczasowe, wymuszona zmiana), limity zgłoszeń po telefonie i ogólny; parser v5 (art. 1 KPC); testy bazy 148/148, e2e 122/122

## [1.26.0] — 2026-11-09
- OCR: kilka zdjęć stron umowy naraz (kolejność wg nazw), przygotowanie obrazu (EXIF, skala, kontrast, prostowanie przekosu ±12°), wykrywanie stron do góry nogami i obróconych o 90°, poprawka „$”→„§”

## [1.25.0] — 2026-11-08
- Zakładki Treści strony i Ustawień w grupach z kolorami (kropka = nieopublikowane zmiany); Treści strony → 🔧 Techniczne: stan systemu, synchronizacja prawa, tryb serwisowy (baner, wstrzymanie zgłoszeń), limity, połączenie z bazą, pamięć aplikacji; e2e 117/117

## [1.24.1] — 2026-11-08
- Dokumentacja: STAN (ostatnie zmiany 1.21–1.24, otwarte sprawy), liczby testów (e2e 113/113, parser 17/17)

## [1.24.0] — 2026-11-08
- CRM → Treści strony: 💬 Czat Adam (imię, powitanie, przyciski, własne tematy, przepisy wł./wył., tester) i ✨ Nowe funkcje (zmiany w prawie, zwrot z umowy, restrukturyzacja firmy, OCR); e2e 113/113

## [1.23.0] — 2026-11-08
- CRM: menu w grupach tematycznych z kolorami (Codzienna praca, Kancelaria, Prawo, Administracja), tylko pozycje z uprawnień, dymki z opisem i powodem dostępu; e2e 109/109

## [1.22.1] — 2026-11-08
- STAN.md: informacja o nadpisaniu historii gita (reset istniejących klonów)

## [1.22.0] — 2026-11-08
- Restrukturyzacja firmy (sekcja Dla firm): długi przedsiębiorcy, raty po układzie, wstrzymanie egzekucji, mniej odsetek, umorzenie; ścieżki postępowań z podstawami w CRM; Adam kieruje firmy do kalkulatora; nawigacja „Dla firm” i „Prawo”

## [1.21.2] — 2026-11-08
- Parser tekstów v4: podział na artykuły po identyfikatorach ELI w HTML (pewny dla KPC i innych kodeksów), nagłówki rozdziałów ze struktury aktu

## [1.21.1] — 2026-11-08
- Parser tekstów v3 (przypisy w linii), diagnostyka KPC, zmiany w prawie na stronie bez powtórzeń (jedna ustawa zmieniająca kilka obserwowanych)

## [1.21.0] — 2026-11-08
- Prawo z API Sejmu: CRM → 📜 Prawo (zmiany, projekty, odsetki, przepisy, przepis w sprawie ze stanem na dzień), strona: Zmiany w prawie, odsetki automatyczne, OCR skanów umów, zwrot z umowy kredytu (klient: komunikat + kwota bez podstaw prawnych; podstawy i orzecznictwo w CRM), czat Adam zamiast Ilony, PLAN.md

## [1.20.0] — 2026-11-08
- Strażnik prawa — etap 1: codzienna synchronizacja z API Sejmu (tools/prawo_sync.py → prawo/*.json: akty, nowelizacje, projekty ustaw, odsetki, teksty artykułów)

## [1.19.0] — 2026-11-05
- CRM jako aplikacja (PWA): przycisk Zainstaluj aplikację na ekranie logowania i w górnym pasku, manifest, service worker, ikony

## [1.18.0] — 2026-10-27
- Treści strony: przycisk „Pokaż różnice” (szkic ↔ opublikowana wersja); paski przewijania dopasowane do stylu (CRM i strona)

## [1.17.1] — 2026-10-27
- Migracja 009 wdrożona (uprawnienia: podgląd i zmiana osobno)

## [1.17.0] — 2026-10-27
- Podgląd panelu (Administrator): CRM oczami wybranej roli lub osoby — menu, sprawy, zakładki i przyciski; tylko do odczytu

## [1.16.0] — 2026-10-27
- Uprawnienia: podgląd i zmiana osobno dla danych klienta, dokumentów, czynności, terminów i zgłoszeń (migracja 009 — czeka na wdrożenie); przyciski dodawania i edycji tylko z uprawnieniem do zmiany

## [1.15.1] — 2026-10-27
- Migracja 008 wdrożona (limit zgłoszeń, porządki powiadomień, uwagi doradców Supabase)

## [1.15.0] — 2026-10-27
- Poprawki po audycie: SRI bibliotek, limit zgłoszeń z e-maila, CRM pobiera po zapisie tylko zmienione tabele (stronami po 1000), porządki powiadomień, strona pamięta treści do kolejnej publikacji, uwagi doradców Supabase (migracja 008); migracja 007 wdrożona

## [1.14.1] — 2026-10-27
- Dokumentacja zaktualizowana (stan migracji, testy 120/81, zasady haseł, UTF-8 przy wdrożeniach); podstawowy audyt bezpieczeństwa i zużycia w STAN.md

## [1.14.0] — 2026-10-27
- Podpowiedzi w CRM: dymki przy menu, zakładkach i przyciskach, ikonki [?] przy polach i kolumnach (crm-pomoc.js); numer wersji przy nazwie CRM

## [1.13.1] — 2026-10-27
- Migracja 006 wdrożona; migracja 007 — naprawa polskich znaków w funkcjach i etykietach po wdrożeniu 004/005 (m.in. powiadomienie o success fee)

## [1.13.0] — 2026-10-27
- Zgodność ze specyfikacją v1.1: migracja 006 (czas polski, przypomnienie w dniu terminu od 8:00, dozwolone typy plików w aktach, raport w bazie — czeka na wdrożenie), raporty liczone w bazie z pamięcią 5 min, zapis kalkulacji z zakładki Analiza do bazy

## [1.12.2] — 2026-10-27
- Migracje 004 i 005 wdrożone na bazie Porównywarka (27.10.2026) — „Opublikuj” w CRM działa

## [1.12.1] — 2026-10-27
- CRM: licznik powiadomień nie zgłasza błędu, gdy wylogowanie nastąpi w trakcie sprawdzania

## [1.12.0] — 2026-10-27
- Treści strony w CRM (🌐 Treści strony, tylko Administrator): panel z admin.html przeniesiony do CRM, publikacja do bazy (migracja 005 — czeka na wdrożenie), strona czyta opublikowaną wersję (zapas: data.json), ⚙️ Panel → CRM, admin.html usunięty

## [1.11.2] — 2026-10-26
- Dokumentacja: nowe nazwy projektów Supabase — Porównywarka (PiK) i CRM Pielęgniarki

## [1.11.1] — 2026-10-26
- Dokumentacja: migracja 004 czeka na wdrożenie; liczba testów bazy 89

## [1.11.0] — 2026-10-26
- Uzupełnienia specyfikacji CRM v1.1 (migracja 004): reguły powiadomień i brakujące zdarzenia, zastępstwa, przypomnienia per typ terminu, potwierdzenie hasłem i 2FA przy zmianie uprawnień Administratora, raporty (filtr statusu, XLSX, PDF, raport aplikanta), wylogowanie po 30 min bezczynności, przeciąganie kategorii; testy bazy 90/90, e2e 51/51

## [1.10.4] — 2026-10-26
- Administrator nowej bazy: biuro@lekarzeiterapeuci.pl; konto z błędnym adresem usunięte

## [1.10.3] — 2026-10-26
- Poprawny adres Administratora (biuro@lekarzeiterapeuci.pl); konto z błędnym adresem tymczasowe, do usunięcia

## [1.10.2] — 2026-10-26
- INSTRUKCJA: poprawny adres Administratora

## [1.10.1] — 2026-10-26
- Administrator nowej bazy aktywny (biuro@lekarzeifarmaceuci.pl); dokumentacja

## [1.10.0] — 2026-10-26
- PiK na własnej bazie Supabase (projekt Piel, eamobnucjsavahpxilrt): schemat + migracje 002–003 wdrożone, CRM i formularz strony przepięte; z CRM usunięta rola Pielęgniarka, migracja 004 i jej testy (przeniesione do Lexsalus/Pielegniarki); dokumentacja

## [1.9.3] — 2026-10-26
- Zakładka Pielęgniarki zdjęta z CRM — panel to osobna aplikacja (Lexsalus/Pielegniarki); w CRM link do panelu, przekierowanie roli Pielęgniarka; dokumentacja

## [1.9.2] — 2026-10-26
- Test zakładki Pielęgniarki obsługuje też osobną aplikację (NZ_URL); STAN: repo Lexsalus/Pielegniarki

## [1.9.1] — 2026-10-26
- Migracja 004 (Pielęgniarki) wdrożona na produkcji + pg_cron zlecenia-limit-czasu; dokumentacja

## [1.9.0] — 2026-10-26
- Zakładka Pielęgniarki w CRM (projekt 23.10.2026): rewiry na mapie (Leaflet/OSM lub Google), dostępność z zatwierdzaniem, strefy i stawki z marżą, przydział zleceń (po kolei / proporcjonalnie / kolejka z limitem / ręcznie) z akceptacją pielęgniarki i limitem czasu, panel pielęgniarki, lista oczekujących, ustawienia; migracja 004 (rola Pielęgniarka, uprawnienie nurses) — niewdrożona; testy bazy 120/120, e2e 36/36 + 42/42

## [1.8.5] — 2026-10-26
- STAN.md: stan na koniec sesji, otwarte sprawy, start w nowej sesji

## [1.8.4] — 2026-10-26
- Cofnięcie 1.8.3: przycisk Panel znowu prowadzi do panelu treści (admin.html)

## [1.8.3] — 2026-10-26
- Przycisk Panel na stronie prowadzi do CRM (crm.html)

## [1.8.2] — 2026-10-26
- Aktualizacja dokumentacji: README, INSTRUKCJA (sekcja CRM, problemy), SUPABASE, STAN, e2e

## [1.8.1] — 2026-10-26
- Usunięta wersja demo CRM (crm-demo.html), tryb testowy formularza i dane przykładowe z kodu CRM; pracujemy na jednej wersji

## [1.8.0] — 2026-10-26
- CRM na żywo: logowanie z 2FA, wszystkie dane i operacje przez Supabase; prototyp przeniesiony do crm-demo.html
- Logowanie e-mail + hasło, reset hasła, 2FA (TOTP) z kodem QR; konta nieaktywne zablokowane
- Baza: migracja 002 (2FA egzekwowane w bazie, magazyn akt `akta`), 003 (audyt eksportów, pobrań, logowań i zmian sprawy)
- Dokumenty w prywatnym magazynie z wersjami i SHA-256; pobieranie przez krótkie linki
- Test end-to-end przez interfejs na lokalnej kopii bazy: 36/36 (`supabase/test/e2e/`); testy bazy 74/74
- STAN.md — stan projektu i instrukcja kontynuacji

## [1.7.2] — 2026-10-26
- Supabase: rejestracja wyłączona, adres linków logowania, pierwszy Administrator aktywny

## [1.7.1] — 2026-10-26
- Formularz „Co mi się należy” zapisuje zgłoszenia w bazie Supabase (schemat wdrożony, przypomnienia pg_cron aktywne)

## [1.7.0] — 2026-10-23
- Baza CRM dla Supabase: supabase/schema.sql z RLS, audytem i testami; formularz może zapisywać zgłoszenia w bazie
- Schemat: wszystkie tabele ze specyfikacji, funkcje uprawnień, polityki RLS, numeracja w transakcji, blokada etapów, wersje wpisów i terminów, soft delete, bilans podziału, PESEL szyfrowany, audyt tylko INSERT z łańcuchem SHA-256, przypomnienia (pg_cron)
- Anonimowy formularz: tylko INSERT do `leads` (bez odczytu); test 62/62 kryteriów na PostgreSQL (PGlite)
- Panel: tryb formularza „Baza CRM (Supabase)”, adres i klucz publiczny; blokada wpisania klucza secret
- Dokumentacja wdrożenia: SUPABASE.md

## [1.6.0] — 2026-10-23
- Prototyp CRM kancelarii (crm.html) wg specyfikacji v1.1 — zaplecze dla adwokatów i pracowników
- Role (Administrator, Pełnomocnik, Aplikant, Biuro, Obsługa techniczna), menu z uprawnień, 403, nadania z ważnością i uzasadnieniem
- Sprawy: 8 kategorii, numeracja KOD-ROK-NNNN, karta sprawy, PESEL maskowany, etapy z blokadą, korekty, soft delete, dokumenty z wersjami i SHA-256, zespół sprawy
- Terminy: kalkulator (KC, święta stałe i ruchome), druga osoba, T-14/7/3/1/0, eskalacja, zamknięcie z dowodem, .ics
- Finanse: wpływy, podział z bilansem 0 zł, widok pełnomocnika; raporty z CSV; powiadomienia; audyt z łańcuchem skrótów; dostęp awaryjny
- Zgłoszenia z formularza „Co mi się należy” → Nowe sprawy → sprawa z wynikiem kalkulatora (zakładka Analiza)
- crm.html wyłączony z indeksowania (robots.txt); link do CRM w panelu treści; dokumentacja CRM.md

## [1.5.0] — 2026-10-23
- „Co mi się należy”: kalkulatory roszczeń SKD, CHF/FX, WIBOR, restrukturyzacja + formularz zgłoszenia
- Zgłoszenie zawiera kategorię CRM, wpisane wartości i wynik; tryb test (podgląd w CRM) lub e-mail kancelarii; zgoda RODO
- Panel: rodzaj kalkulatora, kategoria CRM, uwaga pod polami; ustawienia formularza zgłoszenia
- Uwagi prawne: TSUE C-471/24 (WIBOR), C-828/25 (termin SKD); tłumaczenia UA/EN

## [1.4.2] — 2026-10-21
- Nowy adres po zmianie organizacji na Lexsalus: lexsalus.github.io (strona, SEO, sitemap, chatbot Ilona)

## [1.4.1] — 2026-10-21
- Numer wersji przy nazwie strony w górnym pasku
- Poprawka: przełącznik języka nie ściska się na telefonie (węższy pasek na małych ekranach)

## [1.4.0] — 2026-10-21
- Strona prawnicza: porównywarka usług prawnych (porady online, kancelarie, mediacje) i kalkulatory prawne
- Kalkulatory: odsetki ustawowe (9,25% / 13,75% / 7,25%), opłata sądowa od pozwu (art. 13 UKSC, maks. 100 000 zł), koszty zastępstwa procesowego (Dz.U. 2026 poz. 215), kara umowna a wartość umowy
- Nowe treści SEO i tłumaczenia UA/EN; usunięte przykładowe treści ogólne
- Panel: ostrzeżenie, gdy data.json w repo zmienił się od utworzenia szkicu (użyj nowej wersji / zostaw szkic)
- Instrukcja: tabela stawek do aktualizacji, opis zapisu szkicu

## [1.3.0] — 2026-10-21
- Analiza umów: upload PDF/Word/ODT/RTF/TXT/HTML lub wklejenie tekstu, analiza lokalnie w przeglądarce
- Trzy działy i paski od zielonego do czerwonego: Ryzyko zapisów, Zgodność z prawem (klauzule niedozwolone, limity odsetek, braki), Styl i przejrzystość (podejrzana treść)
- Wykrywanie kwot, dat, okresów i procentów; pełny tekst z podświetleniem; raport .txt
- Panel: zakładka Analiza umów — reguły z podstawą prawną, limity odsetek NBP, wskaźniki, tester reguł; tłumaczenia UA/EN

## [1.2.0] — 2026-10-21
- Wersje językowe PL/UA/EN (własne lub Google Translate) + zakładka Tłumaczenia w panelu
- SEO w pełni konfigurowalne z panelu: meta, hreflang, Open Graph, schema.org, Search Console, Bing, GA4 z banerem zgody, robots.txt, sitemap.xml; podgląd wyniku Google i ocena
- `build_seo.py` w GitHub Actions — wpisuje SEO do `index.html` przy każdej publikacji
- Osadzony chatbot Ilona (włączany i konfigurowany w Ustawieniach)
- Przycisk „Panel” w górnym pasku strony

## [1.1.0] — 2026-10-21
- Wersjonowanie: `version.json`, `CHANGELOG.md`, skrypt `bump.py`
- Numer wersji widoczny w stopce strony i w panelu admina
- README i instrukcja obsługi (`INSTRUKCJA.md`)

## [1.0.0] — 2026-10-21
- Pierwsza wersja: porównywarka, kalkulatory, panel administracyjny, `data.json`
