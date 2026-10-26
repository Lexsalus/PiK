# Test end-to-end CRM (bez dotykania bazy produkcyjnej)

`server.mjs` uruchamia lokalnie PostgreSQL (PGlite) ze `schema.sql` i wszystkimi migracjami oraz udaje API Supabase.
`shim.js` podmienia bibliotekę supabase-js w przeglądarce testowej. `run.py` przechodzi scenariusz przez interfejs CRM jako różne role.

```
cd supabase/test && npm i @electric-sql/pglite@0.4.6 && cp -r node_modules e2e/
node e2e/server.mjs &                       # lokalna baza: http://localhost:9900
python3 -m http.server 8765 &               # z katalogu głównego repo
python3 e2e/run.py                          # wymaga: pip install playwright
```
Dane i konta są fikcyjne, tylko w lokalnej bazie (hasło `Haslo-testowe-123`, kod 2FA `123456`): admin@k.test, jan@k.test, piotr@k.test (pełnomocnicy), anna@k.test (aplikant), kasia@k.test (biuro), tech@k.test, nowy@k.test (nieaktywne).
Wynik 26.10.2026: 36/36.

Panel pielęgniarek (repo `Lexsalus/Pielegniarki`): z katalogu tego repo `python3 -m http.server 8766`, potem `python3 e2e/run_pielegniarki.py` na świeżo uruchomionym `server.mjs` (Leaflet z `node_modules` — `npm i leaflet@1.9.4`; inny adres: `NZ_URL=…`). Konta pielęgniarek: nowak@k.test, kowal@k.test. Wynik 26.10.2026: 40/40.
