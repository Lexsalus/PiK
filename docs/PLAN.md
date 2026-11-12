# Plan prac — PiK (Porównaj.to + CRM kancelarii)

Plik prowadzony na bieżąco: co jest w planie, co w toku, co zrobione. Status: ✅ zrobione · 🔄 w toku · ⏳ do zrobienia · ❓ decyzja właściciela.
Szczegóły wersji: `CHANGELOG.md`, stan projektu: `STAN.md`.

## Etap: Prawo z API Sejmu + bot Adam (od 08.11.2026)

Źródło danych: oficjalne API Sejmu (ELI — akty prawne, Sejm — projekty ustaw). Akty normatywne i ich projekty nie są chronione prawem autorskim (art. 4 ustawy o prawie autorskim). Teksty z ISAP mają charakter informacyjny — wiążący jest Dziennik Ustaw.

| # | Zadanie | Status |
|---|---------|--------|
| 1 | Codzienna synchronizacja z API Sejmu (`tools/prawo_sync.py`, GitHub Actions) → `prawo/*.json`: obserwowane ustawy, nowelizacje, projekty, odsetki, teksty artykułów | ✅ v1.20.0 (pierwsze dane pobrane 08.11.2026) |
| 2 | Parser tekstów jednolitych: pominięcie cytatów z obwieszczenia, sklejanie zawiniętych wierszy, przypisy, dwie stawki odsetek handlowych | ✅ (wersja parsera 2) |
| 3 | CRM → **📜 Prawo**: strażnik zmian (liczba spraw, których dotyczy zmiana, licznik „nowe” w menu, kafelek na pulpicie), projekty w Sejmie, odsetki + kontrola stawek w kalkulatorach, wyszukiwarka przepisów | ✅ |
| 4 | CRM → karta sprawy → Analiza → **Przepisy**: wyszukanie i dołączenie przepisu ze stanem prawnym na dzień (tekst jednolity + nowelizacje) | ✅ |
| 5 | Kalkulatory: odsetki ustawowe aktualizowane same (zmienne `ODS_KAP`, `ODS_OPOZN`, `ODS_HANDL`, `ODS_MAX`, `ODS_MAX_OPOZN`, w etykietach `{ODS_…}`) | ✅ |
| 6 | Strona: sekcja „Zmiany w prawie” (nowelizacje, projekty, odsetki) | ✅ |
| 7 | Analiza umów: limit odsetek maksymalnych z aktualnego obwieszczenia; kontrola powołanych ustaw i artykułów (uchylone, nieistniejące) — **tylko w CRM** (w zgłoszeniu) | ✅ v1.21.0 |
| 8 | Zwrot z umowy: z umowy (wpisanej / pliku / skanu) system liczy zwrot (SKD, CHF/FX) wg przepisów i orzecznictwa; klient widzi **czerwony komunikat „klauzule abuzywne — kwalifikujesz się do zwrotu” + kwotę, bez podstawy prawnej**; podstawy, zapisy i orzecznictwo trafiają ze zgłoszeniem do CRM | ✅ v1.21.0 (`strona/umowa-zwrot.js`) |
| 9 | Skany umów: rozpoznawanie tekstu (OCR) w przeglądarce — zdjęcia JPG/PNG/WEBP i zeskanowane PDF | ✅ v1.21.0 |
| 10 | Bot **Adam** (zamiast Ilony na stronie): regułowy, w przeglądarce, wiedza w `adam/wiedza.json`, przepisy, odsetki, zmiany, projekty, kierowanie do kalkulatorów | ✅ |
| 11 | Testy: parser (`tools/test/test_prawo_sync.py`), e2e CRM (`supabase/test/e2e/`) | ✅ parser 23/23, e2e 153/153 |
| 12 | Dokumentacja: README, INSTRUKCJA, CRM, STAN, CHANGELOG, PLAN | ✅ v1.21.0 |
| 13 | Sprawdzenie po wysyłce: parser v4 (identyfikatory ELI) na danych z API, wygląd na telefonie | ✅ v1.21.2 |
| 14 | Restrukturyzacja firmy: kalkulator długów przedsiębiorcy (raty po układzie, wstrzymanie, odsetki, umorzenie) + ścieżki postępowań z podstawami w CRM | ✅ v1.22.0 |
| 16 | CRM: menu w grupach tematycznych z kolorami (Codzienna praca, Kancelaria, Prawo, Administracja), tylko pozycje z uprawnień, dymki z opisem i powodem dostępu | ✅ v1.23.0 |
| 17 | CRM → Treści strony → 💬 Czat Adam (podstawowe ustawienia, przyciski, własne tematy, przepisy wł./wył., tester) i ✨ Nowe funkcje (zmiany w prawie, zwrot z umowy, restrukturyzacja, OCR) | ✅ v1.24.0 |
| 18 | Ustawienia CRM: zakładki w grupach z kolorami (Moje / Sprawy i terminy / Dostęp i bezpieczeństwo) | ✅ v1.25.0 |
| 19 | Treści strony: zakładki w grupach z kolorami + kropka zmian; 🔧 Techniczne (stan systemu, synchronizacja, tryb serwisowy, limity, połączenie, pamięć aplikacji) | ✅ v1.25.0 |
| 20 | OCR: kilka zdjęć stron naraz, przygotowanie obrazu (EXIF, kontrast, prostowanie przekosu), wykrywanie stron do góry nogami / obróconych, poprawki typowych pomyłek | ✅ v1.26.0 |
| 21 | Usterki: art. 1 KPC bez treści (parser v5), limit zgłoszeń bez e-maila (telefon 3/h, ogólny 40/10 min) | ✅ v1.27.0 |
| 22 | Powiadomienia o zmianach w prawie w bazie (migracja 010: pg_cron + pg_net, zapasowo z CRM Administratora) | ✅ v1.27.0 (wdrożone 09.11.2026) |
| 23 | Zakładanie kont pracowników z CRM (funkcja serwera `konta`, hasło tymczasowe, wymuszona zmiana) | ✅ v1.27.0 (wdrożone 09.11.2026) |
| 24 | Restrukturyzacja: harmonogram miesiąc po miesiącu, plan dla wierzycieli, wydruk/PDF; plan w zgłoszeniu w CRM | ✅ v1.28.0 |
| 25 | Zakładki karty sprawy i Prawa w grupach z kolorami i dymkami | ✅ v1.28.0 |
| 26 | Lista obserwowanych ustaw i słów do projektów edytowana w CRM (Treści strony → Nowe funkcje); synchronizacja czyta ją z bazy i zapisuje do `prawo/obserwowane.json` | ✅ v1.29.0 |
| 27 | Kredyt CHF/EUR z historycznymi kursami NBP: synchronizacja `prawo/kursy.json`, symulacja rat i salda (`wspolne/kredyt-walutowy.js`) w kalkulatorze, zwrocie z umowy i CRM → Prawo → Kredyt walutowy | ✅ v1.30.0 (kursy pobierze pierwsza synchronizacja) |
| 28 | Orzecznictwo z SAOS (API publiczne) w synchronizacji → `prawo/orzeczenia.json`; CRM → Prawo → Orzecznictwo, dołączanie do sprawy, wyszukiwarki; karta sprawy → Analiza; zapytania edytowane w CRM | ✅ v1.31.0 (dane pobierze synchronizacja) |
| 29 | Pisma z szablonów (DOCX bez bibliotek, wydruk/PDF, zapis w aktach), Ustawienia → Pisma i szablony; migracja 011 `office_settings` | ✅ v1.32.0 (migracja 011 wdrożona 11.11.2026) |
| 30 | Serwis dotacji Lexsalus/Grants zintegrowany z CRM: zgłoszenia (kategoria DOT), panel 💶 Dotacje (zgłoszenia, źródła finansowania, podgląd raportu, treści, publikacja), wspólny silnik `engine.js`; migracja 012; filtr kategorii w Nowych sprawach | ✅ v1.33.0 (migracja 012 wdrożona 11.11.2026) |
| 31 | Prawo → Urzędy: rejestr klauzul niedozwolonych UOKiK (pobierany, wyszukiwarka, porównanie zapisu umowy, podobne wpisy w analizie zgłoszenia), decyzje UODO (publiczne API) | ✅ v1.34.0 (dane pobierze synchronizacja) |
| 31a | KNF, ZUS, interpretacje KIS (EUREKA), decyzje UOKiK — brak publicznego API / stałego pliku: na razie wyszukiwarki w CRM; dane — gdy będzie źródło | ⏳ |
| 32 | Długie listy w porcjach (sprawy, nowe sprawy, zgłoszenia dotacji, audyt), dziennik audytu z bazy na żądanie (zamiast 1000 wpisów przy każdym odświeżeniu) | ✅ v1.34.0 |
| 32a | Pobieranie danych spraw z bazy porcjami (przy tysiącach spraw) | ⏳ |
| 33 | Awaryjny przełącznik 2FA (Ustawienia → System, czerwony znacznik w menu, audyt); migracja 013 | ✅ v1.36.0 — ⚠️ 2FA wyłączone 12.11.2026, do ponownego włączenia |
| 15 | Paski w analizie umów (ryzyko prawne, podejrzana treść) — sposób prezentacji klientowi | ❓ czeka na decyzję |

## Do decyzji / później

- ❓ Reguły zwrotu (`strona/umowa-zwrot.js`) — przegląd przez prawnika: wzorce zapisów, podstawy, orzecznictwo, próg „kwalifikuje się”.

- ✅ Adam a przepisy: przełącznik w CRM → Treści strony → Czat Adam („Pokazuje treść przepisów i odnośniki”); domyślnie włączony — decyzja kancelarii.
