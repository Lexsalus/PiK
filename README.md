# PiK — Porównywarka i Kalkulatory

Statyczna strona (GitHub Pages) z porównywarką ofert, kalkulatorami i panelem administracyjnym.

## Pliki

| Plik | Rola |
|------|------|
| `index.html` | Strona publiczna: porównywarka (filtry, sortowanie, porównanie do 4 ofert) + kalkulatory |
| `admin.html` | Panel administracyjny: ustawienia, kategorie, oferty, kalkulatory, eksport |
| `data.json` | Wszystkie dane strony — jedyne źródło prawdy |

## Edycja treści

1. Wejdź na `/admin.html` (domyślne hasło: `admin` — zmień w Ustawieniach).
2. Edytuj — zmiany zapisują się jako szkic w przeglądarce.
3. Sprawdź **Podgląd** (`index.html?preview`).
4. **Publikacja → Pobierz data.json**, podmień plik w repo, commit + push.

## Kalkulatory

Wzory to wyrażenia JS. Dostępne są zmienne wejściowe, wyniki z wcześniejszych wierszy oraz funkcje `Math` (`pow`, `sqrt`, `round`, `min`, `max`…).

## Uruchomienie lokalnie

`data.json` ładuje się przez `fetch`, więc potrzebny jest serwer, np. Live Server w VS Code albo:

```
py -m http.server 8000
```

## Uwaga o bezpieczeństwie

Strona jest statyczna — hasło admina to tylko bramka w interfejsie. Faktyczną ochroną danych jest dostęp do zapisu w repozytorium.
