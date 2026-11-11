"""Testy parsera synchronizacji prawa (bez sieci): python3 tools/test/test_prawo_sync.py"""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
import prawo_sync as P

HTML = '''<html><head><style>x{}</style></head><body>
<p>Obwieszczenie Marszałka Sejmu w sprawie ogłoszenia jednolitego tekstu ustawy - Kodeks cywilny</p>
<p>Art. 1. To nie jest artykuł ustawy (treść obwieszczenia).</p><p>2. Tekst nie obejmuje: art. 16 ustawy zmieniającej, który stanowi:</p><p>„Art. 16. Do umów zawartych przed dniem wejścia w życie stosuje się przepisy dotychczasowe.”</p>
<div>Załącznik do obwieszczenia Marszałka Sejmu</div>
<div>USTAWA z dnia 23 kwietnia 1964 r. Kodeks cywilny</div>
<div>KSIĘGA PIERWSZA</div><div>CZĘŚĆ OGÓLNA</div>
<div>TYTUŁ I</div><div>Przepisy wstępne</div>
<p>Art. 1. Kodeks niniejszy reguluje stosunki cywilnoprawne między osobami fizycznymi i osobami prawnymi.</p>
<p>Art. 2. (uchylony)</p>
<div>Rozdział II</div><div>Zdolność</div>
<p>Art. 3. Ustawa nie ma mocy wstecznej, chyba że to wynika z jej brzmienia lub</p><p>celu.</p>
<p>Art. 8. § 1.</p><p>Każdy człowiek od chwili urodzenia ma zdolność prawną.</p><p>§ 2. Zdolność prawną ma również dziecko poczęte<sup>12)</sup>.</p><p>12)Dodany przez art. 1 ustawy z dnia 1 stycznia 2020 r.</p><p>(Dz. U. poz. 1).</p>
<p>Art. 16. Prawdziwy art. 16 kodeksu.</p>
<p>Art. 385<sup>1</sup>. § 1. Postanowienia umowy zawieranej z konsumentem nieuzgodnione indywidualnie nie wiążą go.</p>
<p>Art. 385<sup>3</sup>. W razie wątpliwości uważa się, że niedozwolonymi postanowieniami umownymi są te, które w szczególności:</p><p>1) wyłączają lub ograniczają odpowiedzialność;</p>
<p>Art. 359. § 2<sup>1</sup>. Maksymalna wysokość odsetek wynikających z czynności prawnej nie może w stosunku rocznym przekraczać dwukrotności wysokości odsetek ustawowych (odsetki maksymalne).</p>
</body></html>'''
t = P.html_to_text(HTML)
arts = P.split_articles(t, True)
nums = [a[0] for a in arts]
ok = lambda c, m: print(('✅ ' if c else '❌ ') + m) or c
res = [
  ok(nums == ['1', '2', '3', '8', '16', '385¹', '385³', '359'], f'numery artykułów (indeksy górne): {nums}'),
  ok(arts[0][1].startswith('Kodeks niniejszy'), 'pominięto treść obwieszczenia przed załącznikiem'),
  ok(arts[1][1] == '(uchylony)' and 'Rozdział' not in arts[1][1], 'nagłówek rozdziału odcięty z końca artykułu'),
  ok(arts[3][2].startswith('Rozdział II') and 'Zdolność' in arts[3][2], f'kontekst rozdziału: {arts[3][2]!r}'),
  ok(arts[3][1]=='§ 1. Każdy człowiek od chwili urodzenia ma zdolność prawną.\n§ 2. Zdolność prawną ma również dziecko poczęte.', 'artykuł wieloakapitowy'),
  ok('§ 2¹.' in arts[7][1], 'indeks górny w paragrafie'),
  ok(P.parse_rate('ogłasza się, że od dnia 5 marca 2026 r. wysokość odsetek ustawowych za opóźnienie wynosi 9,25 % w stosunku rocznym.') == {'od': '2026-03-05', 'stawka': 9.25}, 'odczyt stawki odsetek z obwieszczenia'),
  ok(P.phrase_match(P.norm('Projekt ustawy o zmianie ustawy o kredycie konsumenckim'), 'kredy* konsumen*'), 'dopasowanie słów projektów (bez polskich znaków)'),
  ok(not P.phrase_match(P.norm('ustawa o kredycie hipotecznym'), 'kredy* konsumen*'), 'brak fałszywego dopasowania'),
  ok(arts[2][1]=='Ustawa nie ma mocy wstecznej, chyba że to wynika z jej brzmienia lub celu.', 'sklejanie zawiniętych wierszy'),
  ok(arts[4][1]=='Prawdziwy art. 16 kodeksu.', 'cytaty z obwieszczenia pominięte (właściwy art. 16)'),
  ok(P.parse_rate('wysokość odsetek ustawowych za opóźnienie w transakcjach handlowych, od dnia 1 lipca 2026 r. do dnia 31 grudnia 2026 r., wynosi: 1) 11,75 % w stosunku rocznym ‒ w przypadku transakcji handlowych, w których dłużnikiem jest podmiot publiczny będący podmiotem leczniczym; 2) 13,75 % w stosunku rocznym ‒ w przypadku transakcji handlowych, w których dłużnikiem nie jest podmiot publiczny będący podmiotem leczniczym.')=={'od':'2026-07-01','do':'2026-12-31','stawka':13.75,'stawka_leczniczy':11.75}, 'odsetki handlowe: dwie stawki'),
  ok(P.eli_key('DU/2024/1061') == (2024, 1061), 'sortowanie adresów ELI'),
]
H2='''<html><body><script>var s={"id": "titl_I","symbol": "titl_I","type": "titl","name": "I","title": "Tytuł I - Przepisy wstępne"}</script>
<div id="part_1"><div id="pass_2-pint_1-arti_155"><p>Art. 155. Cytat z ustawy zmieniającej.</p></div></div>
<div id="titl_I"><h3>Tytuł I</h3><div id="titl_I-arti_1"><p>Art. 1.</p><p>Kodeks reguluje</p><p>stosunki cywilnoprawne.</p></div>
<div id="titl_I-arti_4_1"><span>Art. 4<sup>1</sup>.</span><div id="titl_I-arti_4_1-para_1"><p>§ 1. Pierwszy.</p></div><div id="titl_I-arti_4_1-para_2"><p>§ 2. Drugi<sup>5)</sup>.</p></div></div>
<div id="titl_I-arti_7"><span>Art. 7</span></div><p>Treść poza elementem artykułu.</p>
<div id="chpt_II-arti_155"><p>Art. 155. Prawdziwy art. 155 &amp; treść.</p><br></div></div></body></html>'''
a2=P.split_articles_html(H2)
res+=[ok([x[0] for x in a2]==['1','4¹','7','155'],f'podział po identyfikatorach ELI: {[x[0] for x in a2]}'),
  ok(a2[0][1]=='Kodeks reguluje stosunki cywilnoprawne.' and a2[0][2]=='Tytuł I – Przepisy wstępne',f'treść i nagłówek z identyfikatorów: {a2[0][1]!r} / {a2[0][2]!r}'),
  ok(a2[1][1]=='§ 1. Pierwszy.\n§ 2. Drugi.' ,f'paragrafy i przypisy w artykule: {a2[1][1]!r}'),
  ok(a2[2][1]=='Treść poza elementem artykułu.','treść artykułu poza jego elementem (jak art. 1 KPC)'),
  ok(a2[3][1]=='Prawdziwy art. 155 & treść.' and a2[3][2]=='Rozdział II','cytaty z obwieszczenia (pass_/pint_) pominięte; nagłówek z identyfikatora')]
def bad(o):
  try: P.clean_cfg(o); return False
  except ValueError: return True
A=lambda **k:{'id':'kc','eli':'DU/1964/93','nazwa':'Kodeks cywilny','skrot':['KC',' '],'kategorie':['SKD'],**k}
ak,pr,oz=P.clean_cfg({'akty':[A(teksty=False)],'projekty':{'_info':'x','SKD':['kredy*',''],'X':'zle'},'orzecznictwo':{'CHF':['a','b','c','d']}})
res += [
  ok(ak==[{'id':'kc','eli':'DU/1964/93','nazwa':'Kodeks cywilny','skrot':['KC'],'kategorie':['SKD'],'teksty':False}] and pr=={'SKD':['kredy*']} and oz=={'CHF':['a','b','c']},'lista z CRM: czyszczenie pozycji i słów do projektów'),
  ok(bad({'akty':[]}) and bad({'akty':[A(eli='1964/93')]}) and bad({'akty':[A(id='K C')]}) and bad({'akty':[A(),A(id='kc2')]}) and bad({'akty':[A(nazwa='')]}),'lista z CRM: błędne ELI, identyfikator, duplikat, brak nazwy odrzucone')]
mm=P.monthly([{'effectiveDate':'2008-07-01','bid':2.0,'ask':2.04},{'effectiveDate':'2008-07-02','bid':2.02,'ask':2.06},{'effectiveDate':'2008-08-01','bid':2.1,'ask':None}],['bid','ask'])
res.append(ok(mm=={'2008-07':[2.01,2.05]},f'kursy NBP: średnie miesięczne, niepełne notowania pominięte: {mm}'))
jg=P.judgment({'id':123,'courtType':'COMMON','courtCases':[{'caseNumber':'I C 1/20'}],'judgmentType':'SENTENCE','textContent':'<p>Sąd&nbsp;uznał  klauzulę</p>','keywords':['kredyt'],'division':{'name':'I Wydział Cywilny','court':{'name':'Sąd Okręgowy w Warszawie'}},'judgmentDate':'2021-05-04'})
sn=P.judgment({'id':5,'courtType':'SUPREME','courtCases':[{'caseNumber':'III CZP 25/22'}],'judgmentType':'RESOLUTION','chambers':[{'name':'Izba Cywilna'}],'judgmentDate':'2024-04-25'})
res.append(ok(jg['sygn']=='I C 1/20' and jg['sad']=='Sąd Okręgowy w Warszawie' and jg['rodzaj']=='wyrok' and jg['fragment']=='Sąd uznał klauzulę' and jg['url'].endswith('/judgments/123') and sn['sad']=='Sąd Najwyższy — Izba Cywilna' and sn['rodzaj']=='uchwała','orzecznictwo: pozycja z SAOS (sygnatura, sąd, rodzaj, fragment, link)'))
pg='''<table class="results"><tbody><tr data-click="wyszukiwanie.php?details=7456#details" data-url="x" class="result_item"> <td>7766</td> <td>2019-01-30</td> <td>XVII AmC 7/18</td> <td>Sąd Okręgowy w Warszawie</td> <td>[powód zanonimizowany]</td> <td>[pozwany zanonimizowany]</td> <td>"Sklep zastrzega sobie prawo wprowadzania jednostronnych zmian &quot;regulaminu&quot;"</td> <td>2021-05-28</td> <td>INNE USŁUGI</td> </tr></tbody></table>'''
kl=P.parse_klauzule(pg)
res.append(ok(kl==[[7766,'2019-01-30','XVII AmC 7/18','Sąd Okręgowy w Warszawie','Sklep zastrzega sobie prawo wprowadzania jednostronnych zmian "regulaminu','2021-05-28','INNE USŁUGI',7456]],f'klauzule UOKiK: wiersz rejestru {kl}'))
print(f'WYNIK: {sum(res)}/{len(res)}'); sys.exit(0 if all(res) else 1)
