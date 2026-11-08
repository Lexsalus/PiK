"""Testy parsera synchronizacji prawa (bez sieci): python3 tools/test/test_prawo_sync.py"""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
import prawo_sync as P

HTML = '''<html><head><style>x{}</style></head><body>
<p>Obwieszczenie Marszałka Sejmu w sprawie ogłoszenia jednolitego tekstu ustawy - Kodeks cywilny</p>
<p>Art. 1. To nie jest artykuł ustawy (treść obwieszczenia).</p>
<div>Załącznik do obwieszczenia Marszałka Sejmu</div>
<div>USTAWA z dnia 23 kwietnia 1964 r. Kodeks cywilny</div>
<div>KSIĘGA PIERWSZA</div><div>CZĘŚĆ OGÓLNA</div>
<div>TYTUŁ I</div><div>Przepisy wstępne</div>
<p>Art. 1. Kodeks niniejszy reguluje stosunki cywilnoprawne między osobami fizycznymi i osobami prawnymi.</p>
<p>Art. 2. (uchylony)</p>
<div>Rozdział II</div><div>Zdolność</div>
<p>Art. 8. § 1. Każdy człowiek od chwili urodzenia ma zdolność prawną.</p><p>§ 2. Zdolność prawną ma również dziecko poczęte.</p>
<p>Art. 385<sup>1</sup>. § 1. Postanowienia umowy zawieranej z konsumentem nieuzgodnione indywidualnie nie wiążą go.</p>
<p>Art. 385<sup>3</sup>. W razie wątpliwości uważa się, że niedozwolonymi postanowieniami umownymi są te, które w szczególności:</p><p>1) wyłączają lub ograniczają odpowiedzialność;</p>
<p>Art. 359. § 2<sup>1</sup>. Maksymalna wysokość odsetek wynikających z czynności prawnej nie może w stosunku rocznym przekraczać dwukrotności wysokości odsetek ustawowych (odsetki maksymalne).</p>
</body></html>'''
t = P.html_to_text(HTML)
arts = P.split_articles(t, True)
nums = [a[0] for a in arts]
ok = lambda c, m: print(('✅ ' if c else '❌ ') + m) or c
res = [
  ok(nums == ['1', '2', '8', '385¹', '385³', '359'], f'numery artykułów (indeksy górne): {nums}'),
  ok(arts[0][1].startswith('Kodeks niniejszy'), 'pominięto treść obwieszczenia przed załącznikiem'),
  ok(arts[1][1] == '(uchylony)' and 'Rozdział' not in arts[1][1], 'nagłówek rozdziału odcięty z końca artykułu'),
  ok(arts[2][2].startswith('Rozdział II') and 'Zdolność' in arts[2][2], f'kontekst rozdziału: {arts[2][2]!r}'),
  ok('§ 2. Zdolność prawną ma również' in arts[2][1], 'artykuł wieloakapitowy'),
  ok('§ 2¹.' in arts[5][1], 'indeks górny w paragrafie'),
  ok(P.parse_rate('ogłasza się, że od dnia 5 marca 2026 r. wysokość odsetek ustawowych za opóźnienie wynosi 9,25 % w stosunku rocznym.') == {'od': '2026-03-05', 'stawka': 9.25}, 'odczyt stawki odsetek z obwieszczenia'),
  ok(P.phrase_match(P.norm('Projekt ustawy o zmianie ustawy o kredycie konsumenckim'), 'kredy* konsumen*'), 'dopasowanie słów projektów (bez polskich znaków)'),
  ok(not P.phrase_match(P.norm('ustawa o kredycie hipotecznym'), 'kredy* konsumen*'), 'brak fałszywego dopasowania'),
  ok(P.eli_key('DU/2024/1061') == (2024, 1061), 'sortowanie adresów ELI'),
]
print(f'WYNIK: {sum(res)}/{len(res)}'); sys.exit(0 if all(res) else 1)
