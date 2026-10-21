# PiK — Porównywarka i Kalkulatory

Statyczna strona na GitHub Pages: porównywarka ofert, kalkulatory i panel administracyjny. Bez serwera i bez bazy — wszystkie dane są w jednym pliku `data.json`.

🌐 **Strona:** https://lekarzeiterapeuci.github.io/PiK/
🔐 **Panel:** https://lekarzeiterapeuci.github.io/PiK/admin.html

📖 Obsługa krok po kroku: **[INSTRUKCJA.md](INSTRUKCJA.md)** · Historia zmian: **[CHANGELOG.md](CHANGELOG.md)**

## Funkcje

**Strona publiczna**
- Porównywarka: kategorie, wyszukiwarka, sortowanie, ★ przy najlepszej wartości, porównanie do 4 ofert w tabeli
- Kalkulatory z suwakami, wyniki na żywo
- Wersje językowe PL / UA / EN (własne tłumaczenia lub Google Translate)
- Chatbot Ilona osadzony na stronie
- Motyw ciemny/jasny, responsywność (telefon/desktop)
- Przycisk panelu w górnym pasku

**Panel administracyjny**
- Ustawienia strony (nazwa, kolor akcentu, podtytuł, hasło)
- Kategorie z dowolnymi parametrami (liczba / tekst / tak-nie) i ofertami
- Kalkulatory z własnymi wzorami i testem na żywo
- Tłumaczenia: tryb własny/Google, wybór języków, tabela z postępem i filtrem brakujących
- SEO: tytuł, opis, hreflang, Open Graph, schema.org, Search Console, Bing, GA4 z banerem zgody, robots.txt, sitemap.xml, podgląd wyniku Google i ocena
- Włączanie/wyłączanie chatbota
- Podgląd szkicu, eksport / import `data.json`

## Struktura

```
index.html      strona publiczna
admin.html      panel administracyjny
data.json       dane strony (ustawienia, SEO, języki, kategorie, kalkulatory, tłumaczenia)
version.json    aktualna wersja
CHANGELOG.md    historia wersji
bump.py         podbijanie wersji
build_seo.py    SEO z data.json -> index.html, robots.txt, sitemap.xml (uruchamia Actions)
INSTRUKCJA.md   instrukcja obsługi
.github/        workflow publikacji na GitHub Pages
```

## Jak to działa

1. Panel wczytuje `data.json`, zmiany trzyma jako szkic w przeglądarce.
2. Admin pobiera gotowy `data.json` i wrzuca go do repo.
3. Push na `main` → GitHub Actions uruchamia `build_seo.py` i publikuje stronę.

## Wersjonowanie

[SemVer](https://semver.org/lang/pl/). **Każdy push = podbicie wersji**:

```
py bump.py patch "opis"   # poprawki, dane
py bump.py minor "opis"   # nowe funkcje
py bump.py major "opis"   # duże zmiany
```

Wersja widoczna jest w stopce strony i w panelu.

## Lokalnie

```
py -m http.server 8000
```
→ http://localhost:8000 (albo Live Server w VS Code). Bezpośrednie otwarcie pliku nie zadziała — `fetch` wymaga serwera.

## Bezpieczeństwo

Hasło panelu to bramka w interfejsie (skrót SHA-256 w `data.json`), nie zabezpieczenie serwerowe. Dane chroni dostęp do zapisu w repozytorium.
