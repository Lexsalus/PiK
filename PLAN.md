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
| 8 | Zwrot z umowy: z umowy (wpisanej / pliku / skanu) system liczy zwrot (SKD, CHF/FX) wg przepisów i orzecznictwa; klient widzi **czerwony komunikat „klauzule abuzywne — kwalifikujesz się do zwrotu” + kwotę, bez podstawy prawnej**; podstawy, zapisy i orzecznictwo trafiają ze zgłoszeniem do CRM | ✅ v1.21.0 (`umowa-zwrot.js`) |
| 9 | Skany umów: rozpoznawanie tekstu (OCR) w przeglądarce — zdjęcia JPG/PNG/WEBP i zeskanowane PDF | ✅ v1.21.0 |
| 10 | Bot **Adam** (zamiast Ilony na stronie): regułowy, w przeglądarce, wiedza w `adam/wiedza.json`, przepisy, odsetki, zmiany, projekty, kierowanie do kalkulatorów | ✅ |
| 11 | Testy: parser (`tools/test/test_prawo_sync.py`), e2e CRM (`supabase/test/e2e/`) | ✅ parser 17/17, e2e 117/117 |
| 12 | Dokumentacja: README, INSTRUKCJA, CRM, STAN, CHANGELOG, PLAN | ✅ v1.21.0 |
| 13 | Sprawdzenie po wysyłce: parser v4 (identyfikatory ELI) na danych z API, wygląd na telefonie | ✅ v1.21.2 |
| 14 | Restrukturyzacja firmy: kalkulator długów przedsiębiorcy (raty po układzie, wstrzymanie, odsetki, umorzenie) + ścieżki postępowań z podstawami w CRM | ✅ v1.22.0 |
| 16 | CRM: menu w grupach tematycznych z kolorami (Codzienna praca, Kancelaria, Prawo, Administracja), tylko pozycje z uprawnień, dymki z opisem i powodem dostępu | ✅ v1.23.0 |
| 17 | CRM → Treści strony → 💬 Czat Adam (podstawowe ustawienia, przyciski, własne tematy, przepisy wł./wył., tester) i ✨ Nowe funkcje (zmiany w prawie, zwrot z umowy, restrukturyzacja, OCR) | ✅ v1.24.0 |
| 18 | Ustawienia CRM: zakładki w grupach z kolorami (Moje / Sprawy i terminy / Dostęp i bezpieczeństwo) | ✅ v1.25.0 |
| 19 | Treści strony: zakładki w grupach z kolorami + kropka zmian; 🔧 Techniczne (stan systemu, synchronizacja, tryb serwisowy, limity, połączenie, pamięć aplikacji) | ✅ v1.25.0 |
| 15 | Paski w analizie umów (ryzyko prawne, podejrzana treść) — sposób prezentacji klientowi | ❓ czeka na decyzję |

## Do decyzji / później

- ❓ Reguły zwrotu (`umowa-zwrot.js`) — przegląd przez prawnika: wzorce zapisów, podstawy, orzecznictwo, próg „kwalifikuje się”.

- ✅ Adam a przepisy: przełącznik w CRM → Treści strony → Czat Adam („Pokazuje treść przepisów i odnośniki”); domyślnie włączony — decyzja kancelarii.
- ⏳ Powiadomienia o zmianach w prawie zapisywane w bazie (dla każdego pełnomocnika) — wymaga migracji z `pg_net` albo Edge Function; teraz licznik i kafelek w CRM.
- ⏳ Restrukturyzacja: harmonogram układu miesiąc po miesiącu (karencja w liczbach), wydruk planu dla wierzycieli.
- ⏳ Kalkulator CHF z historycznymi kursami NBP (dokładniejszy szacunek z samej umowy, bez pytania klienta o ratę i saldo).
- ⏳ Orzecznictwo (np. baza orzeczeń sądów powszechnych) jako źródło dla CRM — do sprawdzenia dostępność i warunki API.
- ⏳ Lista obserwowanych ustaw do edycji z poziomu CRM (teraz plik `prawo/obserwowane.json`).
