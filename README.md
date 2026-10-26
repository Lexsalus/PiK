# PiK — Porównywarka, Kalkulatory i analiza umów

Strona prawnicza na GitHub Pages z CRM w Supabase: porównywarka usług prawnych (porady online, kancelarie, mediacje), kalkulatory prawne (odsetki ustawowe, opłata sądowa, koszty zastępstwa, kara umowna), analiza umów i panel administracyjny. Treść strony w `data.json`; zgłoszenia i dane CRM w bazie Supabase.

🌐 **Strona:** https://lexsalus.github.io/PiK/
🔐 **Panel treści:** https://lexsalus.github.io/PiK/admin.html
🗄️ **Baza CRM (Supabase):** wdrożenie — **[SUPABASE.md](SUPABASE.md)**
⚖️ **CRM kancelarii:** https://lexsalus.github.io/PiK/crm.html (logowanie + 2FA) — opis: **[CRM.md](CRM.md)**
🧭 **Stan projektu i kontynuacja:** **[STAN.md](STAN.md)**

📖 Obsługa krok po kroku: **[INSTRUKCJA.md](INSTRUKCJA.md)** · Historia zmian: **[CHANGELOG.md](CHANGELOG.md)**

## Funkcje

**Strona publiczna**
- „Co mi się należy”: kalkulatory roszczeń SKD, CHF/FX, WIBOR, restrukturyzacja + formularz zgłoszenia sprawy (z wynikiem i zgodą RODO)
- Porównywarka: kategorie, wyszukiwarka, sortowanie, ★ przy najlepszej wartości, porównanie do 4 ofert w tabeli
- Kalkulatory z suwakami, wyniki na żywo
- Analiza umów (PDF, Word, ODT, RTF, TXT, HTML) w przeglądarce: ryzykowne zapisy, zgodność z prawem, ocena podejrzanej treści — paski od zielonego do czerwonego, raport do pobrania
- Wersje językowe PL / UA / EN (własne tłumaczenia lub Google Translate)
- Chatbot Ilona osadzony na stronie
- Motyw ciemny/jasny, responsywność (telefon/desktop)
- Przycisk ⚙️ Panel w górnym pasku i link w stopce

**CRM kancelarii** (zaplecze dla adwokatów i pracowników, wg specyfikacji v1.1; dane w Supabase)
- Logowanie e-mail + hasło, 2FA (TOTP) obowiązkowe dla Administratora, pełnomocników i obsługi technicznej — egzekwowane w bazie
- Sprawy z kategoriami i numeracją, karta sprawy, etapy z blokadą i korektami, dokumenty z wersjami, zespół sprawy
- Terminy procesowe: kalkulator ze świętami, druga osoba, przypomnienia i eskalacja
- Finanse (podział wpłat, wynagrodzenie pełnomocnika), raporty, powiadomienia
- Role i uprawnienia, dziennik audytu z łańcuchem skrótów; zgłoszenia z formularza → „Nowe sprawy”

**Panel administracyjny (treść strony)**
- Ustawienia strony (nazwa, kolor akcentu, podtytuł, hasło)
- Kategorie z dowolnymi parametrami (liczba / tekst / tak-nie) i ofertami
- Kalkulatory z własnymi wzorami i testem na żywo
- Analiza umów: reguły podstawowe i prawne (z podstawą prawną), limity odsetek, wskaźniki podejrzanej treści, tester reguł
- Tłumaczenia: tryb własny/Google, wybór języków, tabela z postępem i filtrem brakujących
- SEO: tytuł, opis, hreflang, Open Graph, schema.org, Search Console, Bing, GA4 z banerem zgody, robots.txt, sitemap.xml, podgląd wyniku Google i ocena
- Włączanie/wyłączanie chatbota
- Podgląd szkicu, eksport / import `data.json`

## Struktura

```
index.html      strona publiczna
admin.html      panel administracyjny (treść strony)
crm.html        CRM kancelarii na żywo (Supabase)
STAN.md         stan projektu, zasady, następne kroki
supabase/       schema.sql, migrations/ (002, 003), test/ — testy bazy 72/72, e2e CRM 36/36 (SUPABASE.md)
CRM.md          opis CRM: role, moduły, decyzje
SUPABASE.md     wdrożenie i stan bazy
data.json       dane strony (ustawienia, SEO, języki, kategorie, kalkulatory, tłumaczenia)
version.json    aktualna wersja
CHANGELOG.md    historia wersji
bump.py         podbijanie wersji
build_seo.py    SEO z data.json -> index.html, robots.txt, sitemap.xml (uruchamia Actions)
INSTRUKCJA.md   instrukcja obsługi
.github/        workflow publikacji na GitHub Pages
```

## Jak to działa

**Treść strony**
1. Panel wczytuje `data.json`, zmiany trzyma jako szkic w przeglądarce.
2. Admin pobiera gotowy `data.json` i wrzuca go do repo.
3. Push na `main` → GitHub Actions uruchamia `build_seo.py` i publikuje stronę.

**Zgłoszenia i CRM**
1. Klient liczy roszczenie w „Co mi się należy” i wysyła formularz → wiersz w tabeli `leads` (klucz publiczny pozwala tylko dodać zgłoszenie).
2. Pracownik loguje się do `crm.html` (hasło + 2FA) → zgłoszenie widać w „Nowe sprawy”, można z niego założyć sprawę.
3. O dostępie do danych decyduje baza (RLS); CRM nie przechowuje danych w przeglądarce.

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

- **Panel treści:** hasło to bramka w interfejsie (skrót SHA-256 w `data.json`), nie zabezpieczenie serwerowe. Treść chroni dostęp do zapisu w repozytorium.
- **CRM:** dane klientów są w Supabase (UE), chronione regułami RLS w bazie, 2FA egzekwowanym w bazie, szyfrowaniem PESEL i dziennikiem audytu. W kodzie strony jest tylko klucz publiczny `sb_publishable_…`; klucza `sb_secret_…` nie umieszcza się nigdzie w repo.
- `admin.html` i `crm.html` są wyłączone z indeksowania (`robots.txt`).
