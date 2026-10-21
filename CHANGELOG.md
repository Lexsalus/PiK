# Changelog

Format: [SemVer](https://semver.org/lang/pl/) — `MAJOR.MINOR.PATCH`. Każda wysyłka (push) = podbicie wersji.

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
