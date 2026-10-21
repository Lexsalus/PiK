# Instrukcja obsługi — PiK

## 1. Adresy

| Co | Adres |
|----|-------|
| Strona | `https://lekarzeiterapeuci.github.io/PiK/` |
| Panel admina | `https://lekarzeiterapeuci.github.io/PiK/admin.html` |
| Podgląd szkicu | `https://lekarzeiterapeuci.github.io/PiK/index.html?preview` |

Numer wersji widać w stopce strony i na dole menu panelu. Do panelu prowadzi też przycisk **⚙️ Panel** w prawym górnym rogu strony.

## 2. Pierwsze logowanie

1. Otwórz panel i zaloguj się hasłem `admin`.
2. **Ustawienia → Hasło administratora** — ustaw nowe hasło.
3. Wyeksportuj `data.json` i wrzuć do repo (pkt 9) — bez tego nowe hasło nie zadziała na innych komputerach.

## 3. Ustawienia strony

- **Nazwa strony** — logo i tytuł karty.
- **Kolor akcentu** — przyciski, wyróżnienia, gradienty.
- **Hasło (podtytuł)** — tekst pod nagłówkiem na stronie głównej.

## 4. Kategorie i oferty

**Kategoria** to grupa porównywanych rzeczy (np. „Internet domowy”).

**Parametry porównania** — kolumny, po których porównujesz:

| Pole | Znaczenie |
|------|-----------|
| Klucz | techniczna nazwa (bez spacji i polskich znaków); zmiana przenosi wartości w ofertach |
| Etykieta | nazwa widoczna na stronie |
| Typ | `liczba`, `tekst`, `tak/nie` |
| Jednostka | np. `zł`, `GB`, `Mb/s` |
| Lepsza wartość | `niższa` / `wyższa` — najlepsza oferta dostaje ★; `—` wyłącza |

Strzałka **↑** przesuwa wiersz wyżej, **✕** usuwa.

**Oferty** — każdy wiersz to jedna oferta: nazwa, etykieta (np. „Promocja” — pokazuje się jako znaczek na karcie), wartości parametrów i link „Zobacz →” (pusty = brak przycisku).

Na stronie liczby można sortować, a odwiedzający może zaznaczyć do 4 ofert i porównać je w tabeli.

## 5. Kalkulatory

**Pola wejściowe** — to, co wpisuje użytkownik (suwak + pole liczbowe):

| Pole | Znaczenie |
|------|-----------|
| Zmienna | nazwa używana we wzorach, np. `kwota` |
| Domyślna / Min / Max / Krok | zakres suwaka |

**Wyniki** — liczone ze wzorów:

- Wzór to wyrażenie matematyczne, np. `netto*(1+stawka/100)`.
- Można używać zmiennych wejściowych i **wyników z wierszy powyżej**.
- Funkcje: `pow(a,b)`, `sqrt`, `round`, `min`, `max`, `abs`, `log`, `PI`.
- Warunek: `a>b ? x : y`.
- Kolumna **★** wskazuje wynik główny (duża liczba).

Pod tabelą jest **test na wartościach domyślnych** — błąd we wzorze pokaże się na czerwono.

Przykład (rata kredytu):
```
rata    = kwota*(opr/1200)/(1-pow(1+opr/1200,-lata*12))
suma    = rata*lata*12
odsetki = suma-kwota
```

## 6. Tłumaczenia (PL / UA / EN)

Na stronie w górnym pasku jest przełącznik **PL · UA · EN**. Język wybiera się też automatycznie wg przeglądarki odwiedzającego i można go wymusić linkiem `?lang=uk` / `?lang=en`.

W panelu: **🌐 Tłumaczenia**.

| Ustawienie | Działanie |
|------------|-----------|
| Tryb **Własne** | tłumaczysz teksty w tabeli; brak tłumaczenia = tekst polski |
| Tryb **Google Translate** | widget Google tłumaczy stronę automatycznie; zero pracy, ale jakość zależy od Google i wyszukiwarki widzą tylko wersję polską |
| Języki na stronie | zaznacz ukraiński / angielski; polski jest zawsze źródłowy |

Tabela tekstów:
- teksty są pogrupowane: Strona, SEO, każda kategoria, każdy kalkulator, Interfejs strony,
- **Tylko brakujące** — filtr nieprzetłumaczonych (puste pola mają żółtą ramkę),
- **G↗** — otwiera Tłumacza Google z danym tekstem, do szybkiego skopiowania propozycji,
- licznik u góry pokazuje postęp, np. `Ukraiński: 92/101`,
- zmiana polskiego tekstu w kategorii/kalkulatorze tworzy nowy wpis, a stare tłumaczenie trafia do grupy **Nieużywane** (przycisk **Usuń nieużywane** je czyści).

Tłumaczenia są zapisywane w `data.json` — publikujesz je jak resztę zmian (pkt 9).

## 7. SEO — optymalizacja pod Google

W panelu: **🔎 SEO**. Na górze jest **podgląd wyniku w Google**, podgląd przy udostępnianiu i lista kontrolna z oceną.

| Sekcja | Co ustawiasz |
|--------|--------------|
| Podstawowe | tytuł (30–60 zn.), opis (70–160 zn.), słowa kluczowe, adres kanoniczny, autor, kolor paska na telefonie |
| Indeksowanie | index / noindex, follow / nofollow, częstotliwość i priorytet w sitemap, dodatkowe reguły robots.txt |
| Google i Bing | kod weryfikacji Search Console i Bing, identyfikator Google Analytics 4, baner zgody na cookies (RODO) |
| Udostępnianie | obrazek podglądu 1200×630, karta X/Twitter, konto X |
| Dane strukturalne | schema.org: WebSite / Organization / LocalBusiness, nazwa, logo |
| Zaawansowane | własny kod do `<head>`, podgląd `robots.txt` i `sitemap.xml` |

Tytuł i opis tłumaczysz w zakładce Tłumaczenia (grupa „SEO”).

**Jak to trafia do Google:** przy każdej publikacji GitHub Actions uruchamia `build_seo.py`, który wpisuje meta tagi (w tym `hreflang` dla wersji językowych, Open Graph, schema.org) prosto do `index.html` oraz tworzy `robots.txt` i `sitemap.xml`. Nic nie trzeba robić ręcznie poza wrzuceniem `data.json`.

**Pierwsze zgłoszenie do Google:**
1. Wejdź na [Google Search Console](https://search.google.com/search-console) → *Dodaj usługę* → *Prefiks URL* → adres strony.
2. Wybierz weryfikację *Tag HTML*, skopiuj wartość `content="…"` do pola **Google Search Console — kod weryfikacji**.
3. Opublikuj `data.json`, odczekaj ~1 min i kliknij *Zweryfikuj*.
4. W Search Console → *Mapy witryn* dodaj `sitemap.xml`.

> Na adresie `github.io/PiK/` Google czyta `robots.txt` tylko z głównej domeny, dlatego mapę witryny trzeba zgłosić ręcznie (pkt 4). Po podpięciu własnej domeny `robots.txt` zacznie działać automatycznie.

## 8. Chatbot (Ilona)

Na stronie jest osadzony chatbot z `lekarzeiterapeuci.github.io/Ilona/embed.js`.

**Ustawienia → Chatbot (Ilona):**
- **Pokaż chatbota na stronie** — włącza / wyłącza,
- **Adres skryptu** — można podmienić na inną wersję.

Skrypt dostaje atrybut `data-lang` z aktualnym językiem strony.

## 9. Publikacja zmian

Zmiany w panelu to **szkic** zapisany tylko w tej przeglądarce (status „Szkic — niewyeksportowany”).

1. **Podgląd** — sprawdź stronę z danymi szkicu.
2. **Publikacja → Pobierz data.json**.
3. Podmień `data.json` w repozytorium.
4. Podbij wersję (pkt 10), commit, push.
5. Po ~1 min zmiany są na stronie (zakładka *Actions* w GitHubie pokazuje postęp).

Inne akcje: **Kopiuj JSON**, **Importuj plik** (wczytanie `data.json` z dysku), **Odrzuć szkic** (powrót do wersji z repo).

## 10. Wersjonowanie

Zasada: **każdy push = nowa wersja**.

| Rodzaj zmiany | Polecenie | Przykład |
|---------------|-----------|----------|
| dane, poprawki | `py bump.py patch "opis"` | 1.1.0 → 1.1.1 |
| nowe funkcje | `py bump.py minor "opis"` | 1.1.0 → 1.2.0 |
| duża przebudowa | `py bump.py major "opis"` | 1.1.0 → 2.0.0 |

Skrypt aktualizuje `version.json` i dopisuje wpis do `CHANGELOG.md`. Pełna sekwencja (PowerShell):

```
py bump.py patch "Nowe oferty internetu"; git add -A; git commit -m "v1.1.1 Nowe oferty internetu"; git push
```

## 11. Rozwiązywanie problemów

| Problem | Rozwiązanie |
|---------|-------------|
| „Nie udało się wczytać data.json” lokalnie | uruchom serwer: `py -m http.server 8000` i wejdź na `localhost:8000` |
| Zmiany nie widać na stronie | odśwież z Ctrl+F5; sprawdź zakładkę *Actions* |
| Nie pamiętam hasła | wpisz nowy skrót SHA-256 w `site.adminHash` w `data.json` (skrót hasła `admin`: `8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918`) |
| Nowe hasło / SEO nie działa na innym komputerze | szkic jest tylko w Twojej przeglądarce — wyeksportuj i opublikuj `data.json` |
| Tłumaczenie Google nie przełącza się | wyczyść cookies strony lub wybierz PL i ponownie UA/EN |
| Wynik kalkulatora „—” | błąd we wzorze lub dzielenie przez zero — sprawdź test w panelu |
