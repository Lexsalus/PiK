# Serwis dotacji (dawniej repozytorium Lexsalus/Grants)

Adres: https://lexsalus.github.io/PiK/dotacje/ · panel: CRM → 💶 Dotacje (`crm/granty.js`).

- `index.html`, `assets/site.js` — strona dla klienta (opis działalności → licznik → wstępny raport Plan A/B/C → zgłoszenie).
- `assets/engine.js` — silnik raportu i słowniki (wspólny ze CRM).
- `assets/common.js` — tłumaczenia PL/UK/EN, motyw, adres bazy (klucz publiczny).
- `assets/style.css` — style.
- `data/programy.json`, `data/settings.json` — zapas, gdy w bazie nie ma opublikowanych treści (`grants_content`, migracja 012).

Zgłoszenia trafiają do tabeli `leads` z kategorią **DOT**. Wersja serwisu: `APP_VERSION` w `assets/common.js`.
