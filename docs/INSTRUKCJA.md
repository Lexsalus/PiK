# Instrukcja obsługi — PiK

## 1. Adresy

| Co | Adres |
|----|-------|
| Strona | `https://lexsalus.github.io/PiK/` |
| Treści strony | CRM → **🌐 Treści strony** (tylko Administrator) |
| CRM kancelarii | `https://lexsalus.github.io/PiK/crm.html` — opis w `CRM.md` |
| Podgląd szkicu | `https://lexsalus.github.io/PiK/index.html?preview` |

Numer wersji widać w stopce strony. Przycisk **⚙️ Panel** w prawym górnym rogu strony i link w stopce prowadzą do CRM. Treści strony (pkt 3–10) edytuje Administrator w CRM → **🌐 Treści strony** (dawny `admin.html` został usunięty).

## 2. Logowanie do edycji treści

Treści strony edytuje się w CRM po zalogowaniu kontem Administratora (e-mail, hasło i 2FA). Osobnego hasła panelu już nie ma. Zakładki: Ustawienia, Kategorie, Kalkulatory, Analiza umów, Tłumaczenia, SEO, Publikacja — poniżej „Panel → …” oznacza te zakładki.

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

**Odsetki ustawowe aktualizują się same** (od v1.21): we wzorach używaj zmiennych `ODS_KAP` (kapitałowe), `ODS_OPOZN` (za opóźnienie), `ODS_HANDL` (transakcje handlowe), `ODS_MAX` i `ODS_MAX_OPOZN` (maksymalne), a w etykietach `{ODS_OPOZN}` itd. Wartości pochodzą z obwieszczeń w Monitorze Polskim, sprawdzanych codziennie. CRM → 📜 Prawo → Odsetki pokazuje, który kalkulator ma jeszcze stawki wpisane na sztywno. Pozostałe stawki sprawdzaj przy zmianach przepisów:

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
- **Baza CRM** (domyślnie) — zgłoszenie trafia od razu do CRM, zakładka „Nowe sprawy”. Wymaga adresu projektu Supabase i klucza publicznego `sb_publishable_…` (już wpisane, zakładka 🔧 Techniczne); panel nie przyjmie klucza `sb_secret_…`.

Przycisk zgłoszenia pokazuje się tylko, gdy wybrany sposób jest kompletnie skonfigurowany.

**Panel → Kalkulatory:** pole *Gdzie na stronie* (Co mi się należy / Kalkulatory prawne), *Kategoria sprawy w CRM* i *Uwaga pod polami* (zastrzeżenia — **teksty uwag zweryfikuje prawnik przed startem**).

## 5b-1. Kredyt walutowy — symulacja z kursów NBP

Klient nie musi znać raty ani salda. W kalkulatorze „Kredyt frankowy i walutowy” rozwija **📅 Nie znasz raty i salda? Policz z kursów NBP**: data wypłaty, okres, marża, waluta (CHF/EUR) → system wpisuje liczbę rat, średnią ratę i saldo. Ta sama symulacja działa przy **zwrocie z umowy**: gdy w umowie jest kwota, data i okres (marża z umowy albo przyjęta 1,2%).
- Kursy: `prawo/kursy.json` — średnie miesięczne NBP od 2002 r. (tabela A — średni, tabela C — kupno/sprzedaż), pobierane przez codzienną synchronizację. Wypłata po kursie kupna, raty po kursie sprzedaży.
- Oprocentowanie: LIBOR CHF 3M / SARON albo EURIBOR 3M (wartości przybliżone, kwartalne — w `wspolne/kredyt-walutowy.js`) + marża, nie mniej niż 0%. Raty równe.
- To szacunek — banki miały własne tabele kursów z większym spreadem. Do pozwu: zaświadczenie banku.
- CRM → 📜 Prawo → **Kredyt walutowy**: ta sama symulacja dla prawnika (tabela lat, wpływ kursu, korzyść z unieważnienia). Symulacja klienta trafia ze zgłoszeniem do CRM.

## 5c. Restrukturyzacja firmy (sekcja „Dla firm”)

Przedsiębiorca wpisuje długi: rodzaj (kredyt bankowy, leasing, pożyczka, dostawcy, podatki, ZUS, inne), kwotę do spłaty, ratę, oprocentowanie, zaległość, czy jest egzekucja i czy dług jest zabezpieczony (hipoteka, zastaw), a także przychód i koszty stałe miesięcznie. Suwaki ustawiają wariant układu: umorzenie części długu, liczbę rat, karencję.

Wynik (tylko kwoty): łącznie mniej do zapłaty, raty teraz i po układzie, raty i egzekucje wstrzymane (do 4 miesięcy ochrony), mniej odsetek, umorzenie, czy firma udźwignie nowe raty. Model orientacyjny: długi zabezpieczone liczone jak dotąd, ZUS i podatki tylko rozłożone na raty (bez umorzenia), odsetki — z raty i oprocentowania do końca spłaty. Zgłoszenie trafia do CRM (kategoria RST) z listą długów, wariantem, ścieżkami postępowań (PZU, przyspieszone układowe, układowe, sanacja) z podstawami i zasadami do sprawdzenia. Pod wynikiem: **📅 Harmonogram spłat** (ochrona do 4 miesięcy → karencja → raty układowe; ile zostaje firmie co miesiąc) i **Plan dla wierzycieli** (dług, umorzenie, do spłaty, rata, miesiące spłaty dla każdego wierzyciela) oraz **🖨️ Drukuj / zapisz PDF** — gotowy wydruk propozycji układu (opcjonalnie z nazwą firmy). W CRM zgłoszenie pokazuje plan dla wierzycieli. Kod: `strona/restrukturyzacja.js`.

## 6. Analiza umów

Na stronie (sekcja **Umowy**) odwiedzający wgrywa plik albo wkleja tekst. **Plik nie opuszcza przeglądarki** — analiza działa lokalnie, bez serwera.

**Formaty:** PDF, Word `.docx`, OpenDocument `.odt`, `.rtf`, `.txt` / `.md`, `.html` oraz **zdjęcia i skany** (`.jpg`, `.png`, `.webp`, PDF bez warstwy tekstu — do 15 stron). Tekst ze skanu rozpoznaje przeglądarka (Tesseract); przy pierwszym użyciu pobiera się słownik języka polskiego (kilka MB), plik dalej nie opuszcza urządzenia. Na telefonie można od razu zrobić zdjęcie umowy. **Kilka zdjęć naraz** (strona po stronie) składa się w jeden tekst — kolejność według nazw plików (np. IMG_001, IMG_002). Przed odczytem obraz jest przygotowywany: obrót wg danych z aparatu, powiększenie, odcienie szarości, wzmocnienie kontrastu, wyprostowanie przekosu do ±12°, a przy słabym odczycie sprawdzenie, czy strona nie jest **do góry nogami lub obrócona o 90°** (wybierany jest najlepszy wynik). Typowe pomyłki („$ 1.” zamiast „§ 1.”) są poprawiane. Nieobsługiwany: stary `.doc`.

**Zwrot pieniędzy (umowy kredytu).** Jeśli umowa to kredyt konsumencki (SKD) albo kredyt indeksowany/denominowany (CHF, waluta) i system wykryje kwalifikujące zapisy, klient widzi **czerwony komunikat** „W Twojej umowie wykryliśmy klauzule abuzywne… Kwalifikujesz się do zwrotu pieniędzy” oraz **szacowaną kwotę** (kalkulator „Co mi się należy” na danych odczytanych z umowy; klient może je poprawić, przy CHF podaje ratę i saldo). **Klient nie widzi podstaw prawnych.** Po kliknięciu „Chcę odzyskać pieniądze” zgłoszenie trafia do CRM → Nowe sprawy razem z: wykrytymi zapisami, podstawą prawną, orzecznictwem, fragmentami umowy, danymi odczytanymi z umowy i ustawami powołanymi w umowie (czy obowiązują). Reguły: `strona/umowa-zwrot.js`. Kredyt złotówkowy z WIBOR nie daje automatycznej kwalifikacji (wyrok TSUE C‑471/24).

**Wynik** to trzy paski od zielonego do czerwonego (0–29 dobrze, 30–59 uwaga, 60+ źle) i trzy działy:

| Dział | Co sprawdza | Pasek |
|-------|-------------|-------|
| 📋 Podstawowa analiza | ryzykowne zapisy (kary, automatyczne przedłużenie, weksel…) i braki (np. okres wypowiedzenia) + wykryte kwoty, daty, okresy, procenty | Ryzyko zapisów |
| ⚖️ Zgodność z prawem | możliwe klauzule niedozwolone (art. 385¹ i 385³ KC), odsetki ponad limit ustawowy, brak danych stron i daty | Ryzyko prawne |
| 🔍 Styl i przejrzystość | nieostre sformułowania, odesłania do regulaminów, zawiłe odesłania, presja czasu, ukryte opłaty, podwójne zaprzeczenia, bardzo długie zdania | Podejrzana treść |

Przy każdym zapisie jest porada i cytaty z umowy z podświetleniem. Podstawa prawna z reguł jest widoczna tylko w CRM (Treści strony → Analiza umów i w zgłoszeniu), nie na stronie. **Pokaż pełny tekst** — cała umowa z zaznaczeniami; **Pobierz raport** — plik `.txt`.

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

Tłumaczenia publikujesz jak resztę zmian (pkt 10).

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

**Jak to trafia do Google:** przy każdej publikacji GitHub Actions uruchamia `tools/build_seo.py`, który wpisuje meta tagi (w tym `hreflang` dla wersji językowych, Open Graph, schema.org) prosto do `index.html` oraz tworzy `robots.txt` i `sitemap.xml`. Nic nie trzeba robić ręcznie poza wrzuceniem `data.json`.

**Pierwsze zgłoszenie do Google:**
1. Wejdź na [Google Search Console](https://search.google.com/search-console) → *Dodaj usługę* → *Prefiks URL* → adres strony.
2. Wybierz weryfikację *Tag HTML*, skopiuj wartość `content="…"` do pola **Google Search Console — kod weryfikacji**.
3. Pobierz `data.json` i podmień w repo (pkt 10), odczekaj ~1 min i kliknij *Zweryfikuj*.
4. W Search Console → *Mapy witryn* dodaj `sitemap.xml`.

> Na adresie `github.io/PiK/` Google czyta `robots.txt` tylko z głównej domeny, dlatego mapę witryny trzeba zgłosić ręcznie (krok 4). Po podpięciu własnej domeny `robots.txt` zacznie działać automatycznie.

## 9. Czat Adam

Na stronie działa **Adam** — asystent prawny (`adam/adam.js`). Bot regułowy: działa w przeglądarce, bez AI, pytania nie są nigdzie wysyłane. Z czatu Ilona przejęte są tylko: rozpoznawanie fraz z tolerancją literówek, okno czatu odseparowane od stylów strony, pełny ekran na telefonie i pamięć rozmowy w karcie.

Co umie: kieruje do kalkulatorów „Co mi się należy” (kredyt gotówkowy, frankowy, WIBOR, długi), pokazuje treść przepisu na żądanie („art. 45 ukk”, „art. 118 KC”), aktualne odsetki, ostatnie nowelizacje i projekty z Sejmu, kieruje do analizy umowy; przy zagrożeniu życia podaje 112. Gdy nie zna odpowiedzi, szuka pasujących przepisów.

**Ustawienia w CRM → 🌐 Treści strony → 💬 Czat Adam** (szkic → Opublikuj, bez wysyłki na GitHub):
- włączenie czatu, imię, podpis, tekst przycisku, powitanie, zastrzeżenie,
- **Pokazuje treść przepisów i odnośniki** — po wyłączeniu Adam nie pokazuje artykułów ani linków do przepisów (na pytanie „art. …” odsyła do prawnika), **Szukanie w przepisach** gdy nie zna odpowiedzi,
- **Przyciski na powitanie** (napis + akcja), kolejność strzałkami,
- **Własne tematy**: frazy po przecinku, odpowiedź, przyciski (`Napis | akcja` w liniach) — mają pierwszeństwo przed domyślnymi,
- **Tester odpowiedzi** — wpisz pytanie, zobacz temat i odpowiedź według szkicu.

**Wiedza domyślna:** `adam/wiedza.json` — powitanie, przyciski startowe i intencje (frazy bez polskich znaków, `*` = początek słowa, `=` = bez literówek; przyciski `calc:<id>`, `href:#sekcja`, `ask:<pytanie>`, `info:odsetki|zmiany|projekty`).

Pusty adres skryptu albo stary adres Ilony = Adam.

## 9b. Ustawienia techniczne

CRM → 🌐 Treści strony → **🔧 Techniczne**:
- **Stan systemu** — baza (czas odpowiedzi), dane z API Sejmu (ostrzeżenie po 48 h bez synchronizacji), wersja strony i CRM (różnica = odśwież CRM), ostatnia publikacja treści. „↻ Sprawdź” odświeża.
- **Synchronizacja prawa** — wynik ostatniego przebiegu, dziennik, „▶ Uruchom teraz” (GitHub → Actions → Run workflow), lista obserwowanych ustaw.
- **Tryb serwisowy** — baner na górze strony z własnym tekstem; opcjonalnie wstrzymanie wysyłania zgłoszeń (przyciski pokazują prośbę o kontakt później). Działa po „Opublikuj”.
- **Limity** — rozmiar pliku umowy, liczba stron skanu do OCR. Baza pilnuje: maks. 3 zgłoszenia na godzinę z jednego adresu e-mail, dane kalkulatora w zgłoszeniu do 20 kB, pliki w aktach do 25 MB.
- **Połączenie z bazą** — adres i klucz publiczny Supabase dla formularza (wcześniej w Ustawieniach).
- **Aplikacja na tym urządzeniu** — czy CRM jest zainstalowany, stan pamięci aplikacji; „🧹 Wyczyść pamięć aplikacji” gdy po aktualizacji widać starą wersję.

Zakładki Treści strony i Ustawień są pogrupowane kolorami; kropka przy zakładce Treści strony = nieopublikowane zmiany w tej części.

## 9a. Nowe funkcje strony — ustawienia

CRM → 🌐 Treści strony → **✨ Nowe funkcje**:
- **📜 Zmiany w prawie** — pokaż/ukryj sekcję i link w menu, ile nowelizacji i projektów, czy pokazywać odsetki.
- **💰 Zwrot z umowy kredytu** — włącz/wyłącz komunikat i kwotę po analizie umowy, osobno dla kredytu konsumenckiego i frankowego, teksty: nagłówek, drugi wiersz, przycisk, dopisek.
- **🏢 Restrukturyzacja firmy** — pokaż/ukryj sekcję „Dla firm”, wartości startowe suwaków (umorzenie %, liczba rat, karencja).
- **📷 Skany umów** — rozpoznawanie tekstu ze zdjęć i skanów.

Wszystko zapisuje się w szkicu i działa na stronie po „🚀 Opublikuj”.

## 10. Publikacja zmian

Zmiany w CRM → Treści strony to **szkic** zapisany tylko w tej przeglądarce (status „Szkic — nieopublikowany”). Nie widać go na stronie publicznej ani na innym komputerze. Wyczyszczenie danych przeglądarki lub tryb incognito kasuje szkic — przy większych zmianach pobieraj co jakiś czas `data.json` jako kopię.

Jeśli opublikowana wersja zmieni się po utworzeniu szkicu (np. publikacja z innego komputera), CRM pokaże żółty komunikat z wyborem: **Użyj opublikowanej wersji** albo **Zostaw mój szkic**.

1. **👁 Podgląd** — sprawdź stronę z danymi szkicu.
2. **🚀 Opublikuj** — treści trafiają do bazy (tabela `site_content`), strona pokazuje je od razu po odświeżeniu. Publikacja jest w dzienniku audytu.
3. **SEO:** meta tagi, `robots.txt` i `sitemap.xml` dalej tworzy GitHub Actions z `data.json` w repo — po zmianach w zakładce SEO: **Publikacja → Pobierz data.json**, podmień plik w repo, podbij wersję (pkt 11), commit, push.

Dopóki nic nie opublikowano z CRM, strona korzysta z `data.json` z repo (tak samo, gdy baza chwilowo nie odpowiada).

Inne akcje: **Kopiuj JSON**, **Importuj plik** (wczytanie `data.json` z dysku do szkicu), **Odrzuć szkic** (powrót do opublikowanej wersji).

## 11. Wersjonowanie

Zasada: **każdy push = nowa wersja**.

| Rodzaj zmiany | Polecenie | Przykład |
|---------------|-----------|----------|
| dane, poprawki | `py tools/bump.py patch "opis"` | 1.1.0 → 1.1.1 |
| nowe funkcje | `py tools/bump.py minor "opis"` | 1.1.0 → 1.2.0 |
| duża przebudowa | `py tools/bump.py major "opis"` | 1.1.0 → 2.0.0 |

Skrypt aktualizuje `version.json` i dopisuje wpis do `CHANGELOG.md`. Pełna sekwencja (PowerShell):

```
py tools/bump.py patch "Nowe oferty internetu"; git add -A; git commit -m "v1.1.1 Nowe oferty internetu"; git push
```

## 12. Rozwiązywanie problemów

| Problem | Rozwiązanie |
|---------|-------------|
| „Nie udało się wczytać data.json” lokalnie | uruchom serwer: `py -m http.server 8000` i wejdź na `localhost:8000` |
| Zmiany nie widać na stronie | sprawdź, czy kliknięto **🚀 Opublikuj**; odśwież z Ctrl+F5 |
| Zmiany nie widać na innym komputerze | szkic jest tylko w Twojej przeglądarce — kliknij **🚀 Opublikuj** |
| Zmiany SEO nie działają | SEO buduje się z `data.json` w repo — pobierz go w zakładce Publikacja i podmień w repo |
| Tłumaczenie Google nie przełącza się | wyczyść cookies strony lub wybierz PL i ponownie UA/EN |
| Wynik kalkulatora „—” | błąd we wzorze lub dzielenie przez zero — sprawdź test w panelu |
| Brak przycisku „Chcę bezpłatną analizę” | panel → Formularz zgłoszenia: uzupełnij adres i klucz Supabase albo e-mail kancelarii |
| CRM: „Konto nieaktywne” | Administrator aktywuje konto w CRM → Ustawienia → Użytkownicy |
| CRM: zgubiony telefon z kodami 2FA | Administrator usuwa czynnik w Supabase → Authentication → Users → użytkownik → MFA; przy następnym logowaniu nowy kod QR |
| CRM: nie pamiętam hasła | „Nie pamiętam hasła” na ekranie logowania → link e-mailem |

## 12a. Zmiany w prawie (API Sejmu)

Codziennie ok. 6:17 GitHub Actions uruchamia `tools/prawo_sync.py`: pobiera z oficjalnego API Sejmu stan obserwowanych ustaw, nowelizacje, teksty jednolite (artykuły), projekty ustaw z Sejmu i obwieszczenia o odsetkach, i zapisuje je w `prawo/*.json`. Ręcznie: GitHub → Actions → „Deploy static content to Pages” → Run workflow.

**Lista ustaw:** edytujesz w CRM → Treści strony → ✨ Nowe funkcje → **⚖️ Obserwowane ustawy** (przycisk „Edytuj listę ustaw” przejmuje obecną listę; 🔎 sprawdza adres ELI w API Sejmu i podpowiada nazwę; niżej słowa do projektów w Sejmie dla każdej kategorii). Po **opublikowaniu** codzienna synchronizacja czyta listę z bazy i zapisuje ją do `prawo/obserwowane.json`; lista z błędami (zły adres ELI, powtórzenia) jest pomijana i zostaje poprzednia. „↺ Lista z pliku” wraca do pliku z repozytorium. Format pliku: `prawo/obserwowane.json` — `id`, adres ELI aktu pierwotnego (np. `DU/1964/93` = Kodeks cywilny), skróty rozpoznawane w tekście (`KC`, `ukk`…), kategorie spraw CRM, `teksty` (czy pobierać artykuły). Sekcja `uchylone` — ustawy uchylone, których powołanie w umowie oznaczamy w CRM. Sekcja `projekty` — słowa szukane w tytułach projektów. Po zmianie pliku synchronizacja uruchamia się sama przy wysyłce.

Dziennik ostatniego przebiegu: `prawo/log/sync-log.txt`, wynik: `prawo/stan.json` (widać też w CRM → Prawo). Teksty z ISAP są informacyjne — wiążący jest Dziennik Ustaw.

## 12b. Orzecznictwo (SAOS)

Synchronizacja pobiera codziennie najnowsze orzeczenia z bazy **SAOS** (System Analizy Orzeczeń Sądowych, saos.org.pl) dla każdej kategorii spraw → `prawo/orzeczenia.json`. W CRM: 📜 Prawo → **Orzecznictwo** (lista dla kategorii moich spraw / wszystkich, przycisk „📎 Dołącz do sprawy” — wpis w historii sprawy z sygnaturą, sądem, datą i linkiem) oraz wyszukiwarka: SAOS, portal orzeczeń sądów powszechnych, Sąd Najwyższy, TSUE. W karcie sprawy → Analiza: 5 najnowszych orzeczeń z kategorii sprawy. Zapytania dla kategorii: Treści strony → ✨ Nowe funkcje → Orzecznictwo (puste = domyślne). Uwaga: baza SAOS może nie mieć najnowszych orzeczeń — aktualne sprawdzaj w portalach sądów.

## 12b-1. Urzędy: klauzule UOKiK, decyzje UODO, KNF, ZUS, KIS

CRM → 📜 Prawo → grupa **Urzędy**:
- **Klauzule UOKiK** — rejestr klauzul niedozwolonych (ok. 7,8 tys. wpisów z wyroków SOKiK, wersja zanonimizowana, rejestr zamknięty 17.04.2026), pobierany przez synchronizację do `prawo/klauzule.json` (raz na 30 dni, z wznawianiem). Wyszukiwarka (słowa, sygnatura, branża) i **porównanie zapisu umowy** z rejestrem (procent zgodności). W zgłoszeniu z analizą umowy pod wykrytymi zapisami pokazują się podobne wpisy rejestru. Wpis jest argumentem, nie przesądza o abuzywności w innej umowie.
- **Decyzje UODO** — najnowsze decyzje Prezesa UODO z publicznego API (`prawo/uodo.json`).
- **KNF · ZUS · KIS · UOKiK** — serwisy bez publicznego API: wyszukiwarki (interpretacje KIS w EUREKA, ZUS, KNF, decyzje UOKiK) z Twoim zapytaniem.

## 12c. Pisma z szablonów

Karta sprawy → Dokumenty → **📝 Pismo z szablonu**. Szablony wbudowane: oświadczenie o sankcji kredytu darmowego, wezwanie do zapłaty (nieważność umowy CHF/EUR), wniosek o zaświadczenie o historii kredytu, przedsądowe wezwanie do zapłaty, pełnomocnictwo. Dane klienta, sprawy, kancelarii, pełnomocnika i data wypełniają się same; pozostałe pola wpisujesz w formularzu (podgląd na żywo). Wynik: **DOCX**, **wydruk / PDF** albo **zapis w dokumentach sprawy** (z historią wersji). Administrator: Ustawienia → **Pisma i szablony** (dane kancelarii, edycja / wyłączanie wbudowanych, własne szablony z dowolnymi polami `{{nazwa_pola}}`; znaczniki `# ` tytuł, `>> ` do prawej, `**pogrubienie**`). Dane w bazie: tabela `office_settings` (migracja 011), zmiany w audycie; szablony nie są publiczne.

## 12e. Procesy spraw i listy kontrolne

- **Ustawienia → Procesy spraw** (Administrator): procesy (Standardowy, Restrukturyzacja, **Dotacje i granty**, własne — „+ Nowy proces”), dla każdego etapy (nazwa, kolejność, kontrola konfliktu) i **lista kontrolna** etapu. Punkt z dopiskiem `[dokument]`, `[wpis]`, `[wplata]` albo `[termin]` zaznacza się sam, gdy w etapie pojawi się dokument / wpis albo w sprawie wpłata / termin. Proces przypisujesz kategorii w zakładce Kategorie. Zmiany dotyczą nowych spraw.
- **Karta sprawy → Etapy**: lista kontrolna etapu z odklikiwaniem (kto i kiedy — w historii sprawy), punkty automatyczne oznaczone ⚙️, licznik wykonanych. **✏️** zmienia nazwę i listę w tej sprawie, **+ Etap** dodaje etap po bieżącym. Proces idzie jak dotąd: zatwierdzenie etapu otwiera następny; lista podpowiada, ale nie blokuje.
- Kategoria **DOT** ma proces dotacji: przyjęcie, rejestracja klienta, kontrola konfliktu, opłata wstępna, analiza możliwości finansowania, umowa z klientem, przygotowanie dokumentacji, złożenie wniosku, ocena i uzupełnienia, umowa o dofinansowanie, realizacja i rozliczenie.

## 12f. Publikacja — zielona kropka i powiadomienie

Gdy w **Treściach strony** albo **Dotacjach** są zmiany do opublikowania (albo treści nie były jeszcze nigdy publikowane do bazy), w menu przy tej pozycji świeci **zielona kropka**, a w środku — zielone kropki przy podzakładkach ze zmianami i przy „Publikacji”. Przycisk **🔍 Różnice** (Treści strony, górny pasek i Publikacja) pokazuje, co dokładnie się zmieniło. Administratorzy dostają też powiadomienie „Do opublikowania: …” z nazwą osoby, która wprowadziła zmiany (szkic jest w jej przeglądarce); po publikacji powiadomienie oznacza się jako przeczytane.

## 12g. Logi

Menu → Administracja → **📜 Logi** (osoby z uprawnieniem „Dziennik audytu”). Zakładki: **Publikacje** (Treści strony i Dotacje: kto, kiedy i co się zmieniło — liczba zmian w sekcjach i lista miejsc; w Dotacjach dodane / usunięte / zmienione źródła i ustawienia), **Logowania i bezpieczeństwo** (logowania, 2FA, przełącznik 2FA), **Konfiguracja i konta**, **Sprawy** (zakładanie, etapy, korekty, dokumenty, eksporty, pisma), **Pełny dziennik** (cały dziennik audytu z weryfikacją łańcucha skrótów). Wpisów nie może zmienić ani usunąć nikt.

## 12d. Serwis dotacji w CRM

Serwis jest w folderze `dotacje/` (adres https://lexsalus.github.io/PiK/dotacje/); na stronie Porównaj.to prowadzi do niego pozycja **Dotacje** w menu i kafelek w sekcji **Dla firm**. Stary adres lexsalus.github.io/Grants przekierowuje.

Serwis [Granty](https://lexsalus.github.io/PiK/dotacje/) pokazuje klientowi wstępny raport finansowania (Plan A / B / C). Jest zintegrowany z CRM:
- **Zgłoszenia**: formularz po raporcie zapisuje zgłoszenie w bazie kancelarii (kategoria **DOT** „Dotacje i granty”) → CRM → **💶 Dotacje → Zgłoszenia** oraz **Nowe sprawy** (filtr kategorii). Karta pokazuje opis działalności, rozpoznaną formę i cele, województwo, dopasowane plany z kwotami i łączny potencjał; „Załóż sprawę” tworzy sprawę DOT (raport widać też w karcie sprawy → Analiza).
- **Katalog** (Administrator): Dotacje → **Źródła finansowania** (plan, nazwa PL/UK/EN, kwoty, dla kogo, cele, słowa-klucze, województwa, waga) i **Podgląd raportu** (punktacja i powód dopasowania).
- **Serwis** (Administrator): **Treści i ustawienia** (nazwa, teksty PL/UK/EN, kontakt, licznik, Plan C) i **Publikacja** — zmiany są w szkicu w przeglądarce, „Opublikuj” zapisuje je w bazie (`grants_content`, audyt) i strona pokazuje je od razu.
- Silnik raportu jest jeden: `assets/engine.js` w folderze `dotacje/` (CRM ładuje go ze strony serwisu).
- Dostęp: zakładka dla Administratora i osób z uprawnieniem „Nowe sprawy” (one widzą Zgłoszenia i Podgląd). Wymaga migracji `012_dotacje.sql`.

## 13. CRM kancelarii

Zaplecze dla adwokatów i pracowników: `https://lexsalus.github.io/PiK/crm.html`. Pełny opis ról i modułów: `CRM.md`; baza: `SUPABASE.md`.

**Pierwsze logowanie (Administrator `biuro@lekarzeiterapeuci.pl`):**
1. Wpisz e-mail i hasło ustawione w Supabase.
2. Zeskanuj kod QR aplikacją (Google / Microsoft Authenticator) i wpisz 6-cyfrowy kod.
3. Kolejne logowania: hasło + kod z aplikacji.

**Nowy pracownik:**
1. Supabase → Authentication → Users → **Add user** (e-mail, hasło: min. 12 znaków, małe i wielkie litery, cyfry; *Auto Confirm User*).
2. CRM → Ustawienia → Użytkownicy → nadaj rolę i aktywuj.
3. Pełnomocnik i obsługa techniczna konfigurują 2FA przy pierwszym logowaniu.

**Zmiany w CRM i bazie** idą tak jak reszta: commit + podbicie wersji. Zmiana bazy = nowy plik `supabase/migrations/00N_*.sql`, testy (`supabase/test/`), potem uruchomienie w Supabase SQL Editor.
