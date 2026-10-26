# Instrukcja obsługi — PiK

## 1. Adresy

| Co | Adres |
|----|-------|
| Strona | `https://lexsalus.github.io/PiK/` |
| Panel admina | `https://lexsalus.github.io/PiK/admin.html` |
| CRM kancelarii | `https://lexsalus.github.io/PiK/crm.html` — opis w `CRM.md` |
| Podgląd szkicu | `https://lexsalus.github.io/PiK/index.html?preview` |

Numer wersji widać w stopce strony i na dole menu panelu. Do panelu prowadzi przycisk **⚙️ Panel** w prawym górnym rogu strony i link w stopce. Panel ma też link do CRM.

## 2. Pierwsze logowanie do panelu treści

1. Otwórz panel i zaloguj się hasłem `admin`.
2. **Ustawienia → Hasło administratora** — ustaw nowe hasło.
3. Wyeksportuj `data.json` i wrzuć do repo (pkt 10) — bez tego nowe hasło nie zadziała na innych komputerach.

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

## 5a. Stawki w kalkulatorach prawnych — do aktualizacji

Kalkulatory mają stawki wpisane we wzorach (Panel → Kalkulatory → Wyniki). Sprawdzaj je przy zmianach przepisów:

| Kalkulator | Stawka | Źródło | Kiedy zmienić |
|------------|--------|--------|---------------|
| Odsetki ustawowe | 9,25% / 13,75% / 7,25% | art. 481 KC, ustawa o przeciwdziałaniu nadmiernym opóźnieniom, art. 359 KC | po każdej zmianie stopy referencyjnej NBP (stawki od 5.03.2026, stopa 3,75%) |
| Opłata od pozwu | 30–1000 zł do 20 000 zł, potem 5%, maks. 100 000 zł | art. 13 ustawy o kosztach sądowych w sprawach cywilnych | przy nowelizacji ustawy |
| Koszty zastępstwa | 90 zł … 25 000 zł | § 2 rozporządzenia o opłatach za czynności adwokackie (t.j. Dz.U. 2026 poz. 215); dla radców prawnych stawki są takie same | przy zmianie rozporządzenia |
| Opłata skarbowa od pełnomocnictwa | 17 zł | ustawa o opłacie skarbowej | przy nowelizacji |

To samo dotyczy limitów odsetek w Analizie umów (pkt 6).

## 5b. „Co mi się należy” — kalkulatory dla klienta

Sekcja na górze strony: wstępny szacunek roszczenia w czterech kategoriach.

| Kalkulator | Kategoria CRM | Co liczy |
|------------|---------------|----------|
| Sankcja kredytu darmowego | SKD | całkowity koszt kredytu: zwrot za zapłacone raty + mniej do zapłaty w przyszłości |
| Kredyt frankowy i walutowy | CHF | wpłaty + pozostałe saldo − wypłacony kapitał (skutek unieważnienia) |
| Kredyt złotówkowy (WIBOR) | PLN | część rat wynikająca z WIBOR — górna granica; po wyroku TSUE C-471/24 (12.02.2026) takie roszczenia są trudne |
| Restrukturyzacja i oddłużenie | RST | plan spłaty 36 mies. z nadwyżki dochodu, reszta jako szacowane umorzenie |

Pod wynikiem jest przycisk **Chcę bezpłatną analizę mojej sprawy** → formularz (imię, telefon, e-mail, opis, zgoda RODO). Zgłoszenie zawiera kategorię, wpisane wartości i wynik.

**Panel → Ustawienia → Formularz zgłoszenia sprawy:**
- **E-mail kancelarii** — otwiera program pocztowy klienta z gotową wiadomością; trzeba podać adres kancelarii,
- **Baza CRM** (domyślnie) — zgłoszenie trafia od razu do CRM, zakładka „Nowe sprawy”. Wymaga adresu projektu Supabase i klucza publicznego `sb_publishable_…` (już wpisane); panel nie przyjmie klucza `sb_secret_…`.

Przycisk zgłoszenia pokazuje się tylko, gdy wybrany sposób jest kompletnie skonfigurowany.

**Panel → Kalkulatory:** pole *Gdzie na stronie* (Co mi się należy / Kalkulatory prawne), *Kategoria sprawy w CRM* i *Uwaga pod polami* (zastrzeżenia — **teksty uwag zweryfikuje prawnik przed startem**).

## 6. Analiza umów

Na stronie (sekcja **Umowy**) odwiedzający wgrywa plik albo wkleja tekst. **Plik nie opuszcza przeglądarki** — analiza działa lokalnie, bez serwera.

**Formaty:** PDF, Word `.docx`, OpenDocument `.odt`, `.rtf`, `.txt` / `.md`, `.html`. Nieobsługiwane: stary `.doc` oraz skany (PDF bez tekstu) — strona prosi wtedy o zapis jako `.docx`/PDF albo wklejenie treści.

**Wynik** to trzy paski od zielonego do czerwonego (0–29 dobrze, 30–59 uwaga, 60+ źle) i trzy działy:

| Dział | Co sprawdza | Pasek |
|-------|-------------|-------|
| 📋 Podstawowa analiza | ryzykowne zapisy (kary, automatyczne przedłużenie, weksel…) i braki (np. okres wypowiedzenia) + wykryte kwoty, daty, okresy, procenty | Ryzyko zapisów |
| ⚖️ Zgodność z prawem | możliwe klauzule niedozwolone (art. 385¹ i 385³ KC), odsetki ponad limit ustawowy, brak danych stron i daty | Ryzyko prawne |
| 🔍 Styl i przejrzystość | nieostre sformułowania, odesłania do regulaminów, zawiłe odesłania, presja czasu, ukryte opłaty, podwójne zaprzeczenia, bardzo długie zdania | Podejrzana treść |

Przy każdym zapisie jest porada, podstawa prawna (dział prawny) i cytaty z umowy z podświetleniem. **Pokaż pełny tekst** — cała umowa z zaznaczeniami; **Pobierz raport** — plik `.txt`.

### Panel → 📄 Analiza umów

- **Ustawienia:** włączenie sekcji, maks. rozmiar pliku, dozwolone formaty, zastrzeżenie pod wynikiem.
- **Reguły** (podstawowe i prawne): nazwa, poziom (🔴 wysokie / 🟠 do sprawdzenia / 🔵 informacyjnie), kiedy zgłosić (*gdy występuje* / *gdy brakuje* / *odsetki > limit*), wzorce, porada, podstawa prawna.
- **Wzorce** to wyrażenia regularne (wielkość liter bez znaczenia), np. `kar[aąy] umown`, `okres\w* wypowiedzeni` (`\w*` = dowolna końcówka), `.{0,60}` = do 60 znaków pomiędzy. Zwykły fragment tekstu też działa.
- **Odsetki maksymalne** — dwa pola (umowne i za opóźnienie). Wzór: umowne = 2 × (stopa ref. NBP + 3,5 pp), za opóźnienie = 2 × (stopa + 5,5 pp). Przy stopie 3,75% (od 5.03.2026): **14,5%** i **18,5%**. ⚠️ Aktualizuj po każdej zmianie stóp przez RPP.
- **Podejrzana treść:** wskaźniki z punktami za wystąpienie i maksimum, próg długiego zdania.
- **Tester reguł** — wklej fragment umowy i zobacz od razu, które reguły zadziałały (⚠️ = błędny wzorzec).

Nazwy reguł, porady i wyjaśnienia tłumaczysz w zakładce Tłumaczenia (grupy „Analiza umów”).

> Analiza opiera się na wzorcach tekstu — to lista kontrolna, nie opinia prawna. Może przeoczyć zapis sformułowany inaczej albo zgłosić zapis dopuszczalny w danej umowie.

## 7. Tłumaczenia (PL / UA / EN)

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

Tłumaczenia są zapisywane w `data.json` — publikujesz je jak resztę zmian (pkt 10).

## 8. SEO — optymalizacja pod Google

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

> Na adresie `github.io/PiK/` Google czyta `robots.txt` tylko z głównej domeny, dlatego mapę witryny trzeba zgłosić ręcznie (krok 4). Po podpięciu własnej domeny `robots.txt` zacznie działać automatycznie.

## 9. Chatbot (Ilona)

Na stronie jest osadzony chatbot z `lexsalus.github.io/Ilona/embed.js`.

**Ustawienia → Chatbot (Ilona):**
- **Pokaż chatbota na stronie** — włącza / wyłącza,
- **Adres skryptu** — można podmienić na inną wersję.

Skrypt dostaje atrybut `data-lang` z aktualnym językiem strony.

## 10. Publikacja zmian

Zmiany w panelu to **szkic** zapisany tylko w tej przeglądarce (status „Szkic — niewyeksportowany”). Nie widać go na stronie publicznej ani na innym komputerze. Wyczyszczenie danych przeglądarki lub tryb incognito kasuje szkic — przy większych zmianach pobieraj co jakiś czas `data.json` jako kopię.

Jeśli `data.json` w repo zmieni się po utworzeniu szkicu (np. po aktualizacji strony), panel pokaże żółty komunikat z wyborem: **Użyj nowej wersji z repo** albo **Zostaw mój szkic**.

1. **Podgląd** — sprawdź stronę z danymi szkicu.
2. **Publikacja → Pobierz data.json**.
3. Podmień `data.json` w repozytorium.
4. Podbij wersję (pkt 11), commit, push.
5. Po ~1 min zmiany są na stronie (zakładka *Actions* w GitHubie pokazuje postęp).

Inne akcje: **Kopiuj JSON**, **Importuj plik** (wczytanie `data.json` z dysku), **Odrzuć szkic** (powrót do wersji z repo).

## 11. Wersjonowanie

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

## 12. Rozwiązywanie problemów

| Problem | Rozwiązanie |
|---------|-------------|
| „Nie udało się wczytać data.json” lokalnie | uruchom serwer: `py -m http.server 8000` i wejdź na `localhost:8000` |
| Zmiany nie widać na stronie | odśwież z Ctrl+F5; sprawdź zakładkę *Actions* |
| Nie pamiętam hasła | wpisz nowy skrót SHA-256 w `site.adminHash` w `data.json` (skrót hasła `admin`: `8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918`) |
| Nowe hasło / SEO nie działa na innym komputerze | szkic jest tylko w Twojej przeglądarce — wyeksportuj i opublikuj `data.json` |
| Tłumaczenie Google nie przełącza się | wyczyść cookies strony lub wybierz PL i ponownie UA/EN |
| Wynik kalkulatora „—” | błąd we wzorze lub dzielenie przez zero — sprawdź test w panelu |
| Brak przycisku „Chcę bezpłatną analizę” | panel → Formularz zgłoszenia: uzupełnij adres i klucz Supabase albo e-mail kancelarii |
| CRM: „Konto nieaktywne” | Administrator aktywuje konto w CRM → Ustawienia → Użytkownicy |
| CRM: zgubiony telefon z kodami 2FA | Administrator usuwa czynnik w Supabase → Authentication → Users → użytkownik → MFA; przy następnym logowaniu nowy kod QR |
| CRM: nie pamiętam hasła | „Nie pamiętam hasła” na ekranie logowania → link e-mailem |

## 13. CRM kancelarii

Zaplecze dla adwokatów i pracowników: `https://lexsalus.github.io/PiK/crm.html`. Pełny opis ról i modułów: `CRM.md`; baza: `SUPABASE.md`.

**Pierwsze logowanie (Administrator `biuro@lekarzeiterapeuci.pl`):**
1. Wpisz e-mail i hasło ustawione w Supabase.
2. Zeskanuj kod QR aplikacją (Google / Microsoft Authenticator) i wpisz 6-cyfrowy kod.
3. Kolejne logowania: hasło + kod z aplikacji.

**Nowy pracownik:**
1. Supabase → Authentication → Users → **Add user** (e-mail, hasło, *Auto Confirm User*).
2. CRM → Ustawienia → Użytkownicy → nadaj rolę i aktywuj.
3. Pełnomocnik i obsługa techniczna konfigurują 2FA przy pierwszym logowaniu.

**Zmiany w CRM i bazie** idą tak jak reszta: commit + podbicie wersji. Zmiana bazy = nowy plik `supabase/migrations/00N_*.sql`, testy (`supabase/test/`), potem uruchomienie w Supabase SQL Editor.
