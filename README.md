# PiK — Porównywarka, Kalkulatory i analiza umów

Strona prawnicza na GitHub Pages z CRM w Supabase: porównywarka usług prawnych (porady online, kancelarie, mediacje), kalkulatory prawne (odsetki ustawowe, opłata sądowa, koszty zastępstwa, kara umowna), analiza umów. Treści strony edytuje Administrator w CRM (🌐 Treści strony) i publikuje do bazy Supabase (zapasowo `data.json`); zgłoszenia i dane CRM też w bazie.

🌐 **Strona:** https://lexsalus.github.io/PiK/
🗄️ **Baza CRM (Supabase):** wdrożenie — **[docs/SUPABASE.md](docs/SUPABASE.md)**
⚖️ **CRM kancelarii:** https://lexsalus.github.io/PiK/crm.html (logowanie + 2FA) — opis: **[docs/CRM.md](docs/CRM.md)**
🧭 **Stan projektu i kontynuacja:** **[docs/STAN.md](docs/STAN.md)**

📖 Obsługa krok po kroku: **[docs/INSTRUKCJA.md](docs/INSTRUKCJA.md)** · Historia zmian: **[docs/CHANGELOG.md](docs/CHANGELOG.md)**

## Funkcje

**Strona publiczna**
- „Co mi się należy”: kalkulatory roszczeń SKD, CHF/FX, WIBOR, restrukturyzacja + formularz zgłoszenia sprawy (z wynikiem i zgodą RODO)
- Porównywarka: kategorie, wyszukiwarka, sortowanie, ★ przy najlepszej wartości, porównanie do 4 ofert w tabeli
- Kalkulatory z suwakami, wyniki na żywo
- Analiza umów (PDF, Word, ODT, RTF, TXT, HTML, **zdjęcie, kilka zdjęć stron albo skan** — rozpoznawanie tekstu w przeglądarce z prostowaniem, kontrastem i wykrywaniem obróconych stron) : ryzykowne zapisy, zgodność z prawem, ocena podejrzanej treści — paski od zielonego do czerwonego, raport do pobrania
- **Zwrot z umowy kredytu** (SKD, CHF/FX): gdy system wyliczy zwrot, klient widzi czerwony komunikat „klauzule abuzywne — kwalifikujesz się do zwrotu” i kwotę — **bez podstaw prawnych**; podstawy, orzecznictwo i wykryte zapisy trafiają ze zgłoszeniem do CRM
- **Restrukturyzacja firmy** (sekcja „Dla firm”): przedsiębiorca wpisuje długi (bank, leasing, ZUS, podatki, dostawcy), przychody i koszty — widzi raty teraz i po układzie, raty wstrzymane w okresie ochrony, mniej odsetek, umorzenie; ścieżki postępowań z podstawami prawnymi idą ze zgłoszeniem do CRM
- **Zmiany w prawie**: nowelizacje obserwowanych ustaw, projekty w Sejmie, aktualne odsetki (API Sejmu, codziennie)
- Kalkulator odsetek i limity w analizie umów liczą się z aktualnych obwieszczeń
- Wersje językowe PL / UA / EN (własne tłumaczenia lub Google Translate)
- Czat **Adam** — asystent prawny w przeglądarce (bez AI, pytania nie wychodzą na zewnątrz): kieruje do kalkulatorów, pokazuje przepis na żądanie, odsetki, zmiany w prawie
- Motyw ciemny/jasny, responsywność (telefon/desktop)
- Przycisk ⚙️ Panel w górnym pasku i link w stopce

**CRM kancelarii** (zaplecze dla adwokatów i pracowników, wg specyfikacji v1.1; dane w Supabase)
- Logowanie e-mail + hasło, 2FA (TOTP) obowiązkowe dla Administratora, pełnomocników i obsługi technicznej — egzekwowane w bazie
- Sprawy z kategoriami i numeracją, karta sprawy, etapy z blokadą i korektami, dokumenty z wersjami, zespół sprawy
- Terminy procesowe: kalkulator ze świętami, druga osoba, przypomnienia i eskalacja
- Finanse (podział wpłat, wynagrodzenie pełnomocnika), raporty, powiadomienia
- Role i uprawnienia, dziennik audytu z łańcuchem skrótów; zgłoszenia z formularza → „Nowe sprawy” (z analizą umowy klienta i podstawami prawnymi)
- **📜 Prawo**: strażnik zmian w ustawach (ile spraw dotyczy, licznik „nowe”), projekty w Sejmie, odsetki i kontrola stawek w kalkulatorach, wyszukiwarka przepisów; w karcie sprawy → Analiza: dołączenie przepisu ze stanem prawnym na dzień

**CRM → 🌐 Treści strony** (tylko Administrator; dawny panel `admin.html`)
- Ustawienia strony (nazwa, kolor akcentu, podtytuł)
- Szkic w przeglądarce, podgląd, **🚀 Opublikuj** do bazy (strona widzi zmiany od razu)
- Kategorie z dowolnymi parametrami (liczba / tekst / tak-nie) i ofertami
- Kalkulatory z własnymi wzorami i testem na żywo
- Analiza umów: reguły podstawowe i prawne (z podstawą prawną), limity odsetek, wskaźniki podejrzanej treści, tester reguł
- Tłumaczenia: tryb własny/Google, wybór języków, tabela z postępem i filtrem brakujących
- SEO: tytuł, opis, hreflang, Open Graph, schema.org, Search Console, Bing, GA4 z banerem zgody, robots.txt, sitemap.xml, podgląd wyniku Google i ocena
- Zakładki w grupach z kolorami, kropka przy zmianach nieopublikowanych; 🔧 Techniczne: stan systemu, synchronizacja prawa, tryb serwisowy, limity, połączenie z bazą, pamięć aplikacji
- 💬 Czat Adam: imię, powitanie, przyciski, własne tematy, pokazywanie przepisów, tester odpowiedzi
- ✨ Nowe funkcje: Zmiany w prawie, zwrot z umowy (teksty, typy), restrukturyzacja firmy (wartości startowe), skany umów
- Podgląd szkicu, eksport / import `data.json`

## Struktura

```
index.html, crm.html      strona publiczna i CRM kancelarii (same szkielety HTML; muszą być w katalogu głównym)
crm-sw.js, crm.webmanifest  aplikacja CRM (service worker w katalogu głównym — obejmuje cały CRM)
data.json, version.json   dane strony (zapas i źródło SEO), aktualna wersja

strona/                   strona publiczna
  strona.css, strona.js   style i skrypt strony (kalkulatory, porównywarka, analiza umów, formularz zgłoszeń)
  umowa-zwrot.js          ocena umowy kredytu i wyliczenie zwrotu (reguły z podstawami i orzecznictwem)
  restrukturyzacja.js     kalkulator restrukturyzacji firmy, harmonogram, plan dla wierzycieli
wspolne/                  moduły używane przez stronę i CRM
  prawo.js                dane prawne: przepisy z podglądem, odsetki, wyszukiwarka, stan prawny na dzień
  kredyt-walutowy.js      symulacja kredytu CHF/EUR z kursów NBP
crm/                      CRM kancelarii
  crm.css, rdzen.js       style i rdzeń (dane, logowanie, menu, sprawy, terminy, finanse, ustawienia…)
  pwa.js                  instalacja aplikacji
  tresci-strony.js        Treści strony (edycja i publikacja)
  prawo.js                📜 Prawo, przepisy w sprawie, analiza umowy w zgłoszeniu, klauzule UOKiK, UODO
  pisma.js                pisma z szablonów, Ustawienia → Pisma i szablony
  granty.js               💶 Dotacje (panel serwisu dotacji/)
  podglad.js, pomoc.js    podgląd panelu oczami roli, podpowiedzi
dotacje/                  serwis dotacji (raport dla firm, zgłoszenia DOT do CRM; dawniej repo Lexsalus/Grants) — opis w dotacje/README.md
adam/                     czat Adam (adam.js, wiedza.json)
prawo/                    dane generowane codziennie (API Sejmu, kursy NBP, orzeczenia SAOS, klauzule UOKiK, decyzje UODO);
                          obserwowane.json — lista ustaw (edytowana w CRM); log/ — dziennik ostatniej synchronizacji
icons/                    ikony aplikacji CRM
supabase/                 schema.sql, migrations/ (002–013), functions/ (konta), test/ — testy bazy 168/168, e2e 153/153
tools/                    prawo_sync.py (synchronizacja), bump.py (wersja), build_seo.py (SEO), test/ (testy synchronizacji)
docs/                     dokumentacja: STAN (stan i zasady — zacznij tutaj), PLAN, INSTRUKCJA, CRM, SUPABASE, CHANGELOG
.github/                  publikacja na GitHub Pages + codzienna synchronizacja prawa (ok. 6:17)
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
py tools/bump.py patch "opis"   # poprawki, dane
py tools/bump.py minor "opis"   # nowe funkcje
py tools/bump.py major "opis"   # duże zmiany
```

Wersja widoczna jest w stopce strony i w panelu.

## Lokalnie

```
py -m http.server 8000
```
→ http://localhost:8000 (albo Live Server w VS Code). Bezpośrednie otwarcie pliku nie zadziała — `fetch` wymaga serwera.

## Bezpieczeństwo

- **Treści strony:** publikuje tylko Administrator z 2FA — sprawdza to baza (funkcja `site_publish`), każda publikacja w audycie. Odczyt opublikowanej wersji jest publiczny (to treść strony).
- **CRM:** dane klientów są w Supabase (UE), chronione regułami RLS w bazie, 2FA egzekwowanym w bazie, szyfrowaniem PESEL i dziennikiem audytu. W kodzie strony jest tylko klucz publiczny `sb_publishable_…`; klucza `sb_secret_…` nie umieszcza się nigdzie w repo.
- `crm.html` jest wyłączony z indeksowania (`robots.txt`).
