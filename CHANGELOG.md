# Changelog

Format: [SemVer](https://semver.org/lang/pl/) — `MAJOR.MINOR.PATCH`. Każda wysyłka (push) = podbicie wersji.

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
