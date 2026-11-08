# Test end-to-end CRM (bez dotykania bazy produkcyjnej)

`server.mjs` uruchamia lokalnie PostgreSQL (PGlite) ze `schema.sql` i wszystkimi migracjami oraz udaje API Supabase.
Przeglądarka testowa ma wyłączony service worker CRM (`crm-sw.js`) — inaczej podmiana bibliotek nie działa przy przeładowaniu. Do testu potrzebne też `xlsx@0.18.5` w `node_modules`.
`shim.js` podmienia bibliotekę supabase-js w przeglądarce testowej. `run.py` przechodzi scenariusz przez interfejs CRM jako różne role.

```
cd supabase/test && npm i @electric-sql/pglite@0.4.6 xlsx@0.18.5 && cp -r node_modules e2e/
node e2e/server.mjs &                       # lokalna baza: http://localhost:9900
python3 -m http.server 8765 &               # z katalogu głównego repo
python3 e2e/run.py                          # wymaga: pip install playwright
```
Dane i konta są fikcyjne, tylko w lokalnej bazie (hasło `Haslo-testowe-123`, kod 2FA `123456`): admin@k.test, jan@k.test, piotr@k.test (pełnomocnicy), anna@k.test (aplikant), kasia@k.test (biuro), tech@k.test, nowy@k.test (nieaktywne).
Wynik 08.11.2026: 113/113 (w tym: menu w grupach, 📜 Prawo, przepis w sprawie, analiza umowy klienta w zgłoszeniu, Czat Adam i Nowe funkcje w Treściach strony). Testy parsera danych z API Sejmu: `python3 tools/test/test_prawo_sync.py` (17/17).
