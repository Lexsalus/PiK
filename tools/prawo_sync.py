#!/usr/bin/env python3
"""Strażnik zmian w prawie — codzienna synchronizacja danych z API Sejmu.

Źródła (dane publiczne, art. 4 ustawy o prawie autorskim):
  * ELI  https://api.sejm.gov.pl/eli  — akty prawne (Dziennik Ustaw, Monitor Polski)
  * Sejm https://api.sejm.gov.pl/sejm — projekty ustaw (procesy legislacyjne)

Wejście:  lista ustaw z CRM (Treści strony → Nowe funkcje → Obserwowane ustawy; opublikowana w bazie),
          a gdy jej nie ma lub jest błędna — prawo/obserwowane.json (lista ustaw, kategorie spraw, słowa do projektów).
          Lista z CRM jest zapisywana z powrotem do prawo/obserwowane.json (jedno źródło dla strony i CRM).
Wyjście:  prawo/akty.json        — stan obserwowanych i uchylonych aktów, teksty jednolite, akty zmieniające
          prawo/zmiany.json      — nowelizacje obserwowanych ustaw (z datą wykrycia)
          prawo/projekty.json    — projekty ustaw w Sejmie pasujące do kategorii spraw
          prawo/odsetki.json     — aktualne odsetki ustawowe z obwieszczeń w Monitorze Polskim
          prawo/teksty/<id>.json — artykuły z ostatniego tekstu jednolitego (wyszukiwarka, Adam, podgląd)
          prawo/orzeczenia.json  — najnowsze orzeczenia dla kategorii spraw (SAOS — System Analizy Orzeczeń Sądowych)
          prawo/kursy.json       — miesięczne kursy NBP (CHF, EUR: średni z tabeli A, kupno/sprzedaż z tabeli C) do symulacji kredytów walutowych
          prawo/stan.json        — kiedy i z jakim skutkiem działała synchronizacja
          prawo/sync-log.txt     — dziennik ostatniego przebiegu

Każda część działa osobno: błąd jednej (np. chwilowa awaria API) zostawia jej poprzedni plik bez zmian.
Uruchomienie: python3 tools/prawo_sync.py  (w GitHub Actions raz dziennie, patrz .github/workflows/static.yml)
"""
import datetime as dt
import html
import io
import json
import os
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from html.parser import HTMLParser

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'prawo')
ELI = 'https://api.sejm.gov.pl/eli'
SEJM = 'https://api.sejm.gov.pl/sejm'
NBP = 'https://api.nbp.pl/api/exchangerates/rates'
WALUTY = ('CHF', 'EUR')
SAOS = 'https://www.saos.org.pl'
ORZ_DOMYSLNE = {   # zapytania do wyszukiwarki SAOS dla kategorii spraw (można zmienić w CRM)
    'SKD': ['sankcja kredytu darmowego'], 'CHF': ['kredyt indeksowany frank szwajcarski'], 'FX': ['kredyt denominowany'],
    'PLN': ['WIBOR kredyt'], 'RST': ['postępowanie restrukturyzacyjne układ'], 'ROD': ['alimenty'],
    'CIV': ['przedawnienie roszczenia konsument'], 'INNE': ['niedozwolone postanowienie umowne']}
UA = 'PiK-prawo-sync/1.0 (+https://lexsalus.github.io/PiK/)'
PARSER = 5  # wersja parsera tekstów — zmiana wymusza ponowne pobranie artykułów
PAUSE = float(os.environ.get('PRAWO_PAUSE', '0.25'))  # odstęp między zapytaniami — nie obciążamy serwerów Sejmu
TODAY = dt.date.today()
LOG = []


def log(*a):
    s = ' '.join(str(x) for x in a)
    LOG.append(s)
    print(s, flush=True)


# ---------------------------------------------------------------- HTTP
def http(url, binary=False, tries=3):
    last = None
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': '*/*'})
            with urllib.request.urlopen(req, timeout=60) as r:
                data = r.read()
            time.sleep(PAUSE)
            return data if binary else data.decode('utf-8', 'replace')
        except urllib.error.HTTPError as e:
            last = e
            if e.code in (400, 404):
                raise
        except Exception as e:  # sieć, timeout
            last = e
        time.sleep(2 * (i + 1))
    raise last


def jget(url):
    return json.loads(http(url))


# ---------------------------------------------------------------- pliki
def load(name, default):
    try:
        with open(os.path.join(OUT, name), encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return default


def save(name, data):
    path = os.path.join(OUT, name)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = path + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, separators=(',', ':'), sort_keys=False)
        f.write('\n')
    os.replace(tmp, path)


# ---------------------------------------------------------------- pomocnicze
def eli_key(eli):
    """'DU/2024/1061' -> (2024, 1061) do sortowania."""
    p = eli.split('/')
    try:
        return int(p[1]), int(p[-1])
    except Exception:
        return 0, 0


def eli_url(eli):
    return f'{ELI}/acts/{eli}'


def norm(s):
    s = unicodedata.normalize('NFKD', s.lower())
    s = ''.join(c for c in s if not unicodedata.combining(c)).replace('ł', 'l')
    return re.sub(r'[^a-z0-9 ]+', ' ', s)


def phrase_match(text_norm, phrase):
    """Fraza jak w czacie: słowa bez polskich znaków, '*' na końcu = początek słowa."""
    words = text_norm.split()
    parts = phrase.split()
    for i in range(len(words) - len(parts) + 1):
        ok = True
        for j, p in enumerate(parts):
            w = words[i + j]
            if p.endswith('*'):
                if not w.startswith(p[:-1]):
                    ok = False
                    break
            elif w != p:
                ok = False
                break
        if ok:
            return True
    return False


SUP = str.maketrans('0123456789', '⁰¹²³⁴⁵⁶⁷⁸⁹')


class TextHTML(HTMLParser):
    """HTML aktu -> tekst z liniami; indeksy górne (<sup>) jako znaki ¹²³, przypisy pomijane w numeracji."""
    BLOCK = {'p', 'div', 'br', 'li', 'tr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'table', 'section', 'article', 'header', 'footer', 'dt', 'dd'}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.out = []
        self.sup = 0
        self.skip = 0

    def handle_starttag(self, tag, attrs):
        if tag in ('script', 'style', 'head'):
            self.skip += 1
        if tag == 'sup':
            self.sup += 1
        if tag in self.BLOCK:
            self.out.append('\n')

    def handle_endtag(self, tag):
        if tag in ('script', 'style', 'head'):
            self.skip = max(0, self.skip - 1)
        if tag == 'sup':
            self.sup = max(0, self.sup - 1)
        if tag in self.BLOCK:
            self.out.append('\n')

    def handle_data(self, data):
        if self.skip:
            return
        if self.sup:
            d = data.strip()
            # indeks górny przy numerze (385¹, § 2¹) — cyfry jako indeks; przypis „1)” zostawiamy jako tekst
            self.out.append(d.translate(SUP) if re.fullmatch(r'\d{1,3}', d) else data)
        else:
            self.out.append(data)

    def text(self):
        t = ''.join(self.out).replace('\xa0', ' ')
        t = re.sub(r'[ \t\r\f\v]+', ' ', t)
        t = re.sub(r' ?\n ?', '\n', t)
        return re.sub(r'\n{2,}', '\n', t).strip()


def html_to_text(src):
    p = TextHTML()
    p.feed(src)
    p.close()
    return p.text()


HEAD_RX = re.compile(r'^(KSIĘGA|Księga|TYTUŁ|Tytuł|DZIAŁ|Dział|ROZDZIAŁ|Rozdział|ODDZIAŁ|Oddział|CZĘŚĆ|Część)\b', re.U)
ART_RX = re.compile(r'(?m)^Art\.\s*([0-9]+[a-z]{0,3}[⁰¹²³⁴⁵⁶⁷⁸⁹]*)\.\s*')


MARK_ALONE = re.compile(r'^(§\s*\d+[a-z]{0,3}[⁰¹²³⁴⁵⁶⁷⁸⁹]*\.|\d+[a-z]{0,3}[⁰¹²³⁴⁵⁶⁷⁸⁹]*\.|\d+[a-z]{0,3}[⁰¹²³⁴⁵⁶⁷⁸⁹]*\)|[a-z]{1,2}\)|[–-])$')
MARK_START = re.compile(r'^(§\s*\d+[a-z]{0,3}[⁰¹²³⁴⁵⁶⁷⁸⁹]*\.|\d+[a-z]{0,3}[⁰¹²³⁴⁵⁶⁷⁸⁹]*\.\s|\d+[a-z]{0,3}[⁰¹²³⁴⁵⁶⁷⁸⁹]*\)\s|[a-z]{1,2}\)\s|[–-]\s|\(uchyl)')
FOOT_LINE = re.compile(r'^\d{1,3}\)\S')          # „12)Oznaczenie ust. 1 nadane przez…” — przypis redakcyjny
FOOT_REF = re.compile(r'(?<=[A-Za-ząćęłńóśźżĄĆĘŁŃÓŚŹŻ.,;:”])\d{1,3}\)(?=[\s.,;:]|$)')  # „konsumenckim12)” — odsyłacz do przypisu


def tidy(lines):
    """Złam linie jak w ustawie: § 1., 1., 1), a) od nowej linii; zawinięte wiersze sklejone; przypisy usunięte."""
    out, skip = [], False
    for raw in lines:
        l = raw.strip()
        if not l:
            continue
        if FOOT_LINE.match(l):
            skip = True
            continue
        if skip and not MARK_START.match(l) and not MARK_ALONE.match(l):
            continue
        skip = False
        l = FOOT_REF.sub('', l)
        if out and MARK_ALONE.match(out[-1]):
            out[-1] += ' ' + l
        elif not out or MARK_ALONE.match(l) or MARK_START.match(l):
            out.append(l)
        else:
            out[-1] = (out[-1][:-1] if out[-1].endswith('-') and not out[-1].endswith(' -') else out[-1] + ' ') + l
    # przypis doklejony w tej samej linii: „(uchylony)3)Dodany przez art. …” → „(uchylony)”
    out = [re.sub(r'(?<=\S)\d{1,3}\)(?=[A-ZĄĆĘŁŃÓŚŹŻ])[^\n]*$', '', x) for x in out]
    return [re.sub(r'\s{2,}', ' ', x).strip() for x in out if x.strip()]


def _art_key(nr):
    m = re.match(r'(\d+)', nr)
    return int(m.group(1)) if m else 0


VOID = {'br', 'img', 'hr', 'meta', 'input', 'link', 'col', 'area', 'base', 'wbr', 'source'}
ART_ID = re.compile(r'(?:^|-)arti_([0-9]+[a-z]{0,3}(?:_[0-9]+)?)$')
SEG = {'book': 'Księga', 'part': 'Część', 'titl': 'Tytuł', 'bran': 'Dział', 'chpt': 'Rozdział', 'sect': 'Oddział'}


class ArtCollector(HTMLParser):
    """Zbiera HTML każdego artykułu po identyfikatorach ELI (np. „titl_WSTĘPNY-arti_4_1”).
    Pomija cytaty w treści obwieszczenia (identyfikatory zaczynające się od pass_/pint_)."""

    def __init__(self):
        super().__init__(convert_charrefs=False)
        self.stack, self.cur, self.depth, self.buf, self.arts = [], None, 0, [], []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        raw = self.get_starttag_text() or f'<{tag}>'
        if self.cur is not None:
            self.buf.append(raw)
            if tag not in VOID:
                self.depth += 1
            return
        i = a.get('id') or ''
        m = ART_ID.search(i)
        if m and not i.startswith(('pass_', 'pint_')) and tag not in VOID:
            self.cur, self.depth, self.buf = (i, m.group(1)), 1, []

    def handle_startendtag(self, tag, attrs):
        if self.cur is not None:
            self.buf.append(self.get_starttag_text() or '')

    def handle_endtag(self, tag):
        if self.cur is None or tag in VOID:
            return
        self.depth -= 1
        if self.depth <= 0:
            self.arts.append((self.cur[0], self.cur[1], ''.join(self.buf)))
            self.cur = None
        else:
            self.buf.append(f'</{tag}>')

    def handle_data(self, d):
        if self.cur is not None:
            self.buf.append(d)

    def handle_entityref(self, name):
        if self.cur is not None:
            self.buf.append(f'&{name};')

    def handle_charref(self, name):
        if self.cur is not None:
            self.buf.append(f'&#{name};')


def art_number(name):
    base, _, sup = name.partition('_')
    return base + sup.translate(SUP)


def split_articles_html(raw):
    """HTML aktu z ELI → [[numer, treść, nagłówek]] na podstawie identyfikatorów elementów (pewniejsze niż tekst)."""
    titles = dict(re.findall(r'"id"\s*:\s*"([^"]+)"\s*,\s*"symbol"\s*:\s*"[^"]*"\s*,\s*"type"\s*:\s*"[^"]*"\s*,\s*"name"\s*:\s*"[^"]*"\s*,\s*"title"\s*:\s*"([^"]*)"', raw))
    p = ArtCollector()
    p.feed(raw)
    p.close()
    out, seen = [], set()
    pos = {full: raw.find(f'id="{full}"') for full, _, _ in p.arts}
    order = sorted(v for v in pos.values() if v >= 0)
    for full, name, frag in p.arts:
        # treść poza elementem artykułu (nietypowy HTML, np. art. 1 KPC) — bierzemy HTML do następnego artykułu
        if len(re.sub(r'<[^>]+>|Art\.\s*[0-9a-z_]+\.?|\s', '', frag)) < 3 and pos.get(full, -1) >= 0:
            st = raw.rfind('<', 0, pos[full])
            nxt = next((v for v in order if v > pos[full]), -1)
            end = raw.rfind('<', 0, nxt) if nxt > 0 else len(raw)
            frag = raw[st:end]
        nr = art_number(name)
        if nr in seen:
            continue
        seen.add(nr)
        txt = html_to_text(frag)
        txt = re.sub(r'^\s*Art\.\s*[0-9]+[a-z]{0,3}[⁰¹²³⁴⁵⁶⁷⁸⁹]*\.?\s*', '', txt)
        body = '\n'.join(tidy(txt.split('\n')))
        path = full.split('-')[:-1]
        head = ''
        for k in range(len(path), 0, -1):
            key = '-'.join(path[:k])
            if key in titles:
                head = titles[key]
                break
            seg = path[k - 1].split('_', 1)
            if seg[0] in SEG and len(seg) > 1:
                head = f'{SEG[seg[0]]} {seg[1]}'
                break
        head = head.replace(' - ', ' – ')
        if len(body) > 6000:
            body = body[:6000].rsplit(' ', 1)[0] + ' […]'
        out.append([nr, body or '(brak treści w tekście jednolitym — zobacz pełny tekst)', head])
    return out


def split_articles(text, is_obwieszczenie=True):
    """Tekst aktu -> [[numer, treść, nagłówek rozdziału], …].
    Obwieszczenie (tekst jednolity) zawiera przed załącznikiem cytaty przepisów ustaw zmieniających — właściwy tekst
    ustawy zaczyna się od tego „Art. 1.”, po którym numeracja idzie po kolei najdłużej."""
    ms = list(ART_RX.finditer(text))
    if not ms:
        return []
    starts = [i for i, m in enumerate(ms) if m.group(1) == '1']
    if starts:
        def run(i):
            n, last, prev = 0, 0, None
            for m in ms[i:i + 400]:
                k = _art_key(m.group(1))
                if k < last or k > last + 25 or m.group(1) == prev:
                    break
                n, last, prev = n + 1, k, m.group(1)
            return n
        best = max(starts, key=run)
        ms = ms[best:]
        # koniec ustawy: numeracja wraca do małych liczb (np. przypisy/załączniki z cytatami) — utnij
        last, cut = 0, len(ms)
        for j, m in enumerate(ms):
            k = _art_key(m.group(1))
            if k + 50 < last:
                cut = j
                break
            last = max(last, k)
        ms = ms[:cut]
    out, seen, head = [], set(), ''
    last_end = ms[0].start()
    for i, m in enumerate(ms):
        between = [x.strip() for x in text[last_end:m.start()].split('\n')]
        for j, line in enumerate(between):
            if HEAD_RX.match(line):
                nxt = between[j + 1] if j + 1 < len(between) else ''
                head = (line + (' – ' + nxt if nxt and not HEAD_RX.match(nxt) and len(nxt) < 160 else '')).strip()
        end = ms[i + 1].start() if i + 1 < len(ms) else len(text)
        body_lines = [l.strip() for l in text[m.end():end].split('\n') if l.strip()]
        for k, line in enumerate(body_lines):
            if HEAD_RX.match(line) and all(HEAD_RX.match(x) or (len(x) < 160 and not x.endswith(('.', ';', ':'))) for x in body_lines[k:]):
                body_lines = body_lines[:k]
                break
        body = '\n'.join(tidy(body_lines))
        last_end = m.end()
        nr = m.group(1)
        if nr in seen:
            continue
        seen.add(nr)
        if len(body) > 6000:
            body = body[:6000].rsplit(' ', 1)[0] + ' […]'
        out.append([nr, body or '(brak treści w tekście jednolitym — zobacz pełny tekst)', head])
    return out


# ---------------------------------------------------------------- akty
def act_details(eli, cache):
    if eli in cache:
        return cache[eli]
    d = jget(eli_url(eli))
    cache[eli] = d
    return d


def slim(d):
    return {
        'eli': d.get('ELI'), 'adres': d.get('displayAddress'), 'tytul': d.get('title'), 'typ': d.get('type'),
        'status': d.get('status'), 'obowiazuje': d.get('inForce'), 'ogloszono': d.get('promulgation'),
        'wydano': d.get('announcementDate'), 'zmiana': d.get('changeDate'),
        'html': bool(d.get('textHTML')), 'pdf': bool(d.get('textPDF')),
    }


def sync_akty(cfg):
    prev = load('akty.json', {})
    prev_akty = {a['id']: a for a in prev.get('akty', [])}
    known_titles = prev.get('tytuly', {})  # eli -> [tytuł, ogłoszono] (pamięć, żeby nie pytać ponownie)
    cache = {}
    akty, teksty_do = [], []
    for a in cfg['akty']:
        try:
            d = act_details(a['eli'], cache)
        except Exception as e:
            log(f'⚠ {a["id"]} {a["eli"]}: {e}')
            if a['id'] in prev_akty:
                akty.append(prev_akty[a['id']])
            continue
        refs = d.get('references') or {}
        tj_ids = sorted({r['id'] for r in refs.get('Inf. o tekście jednolitym', [])}, key=eli_key, reverse=True)
        tj = []
        old_tj = {t['eli']: t for t in (prev_akty.get(a['id'], {}).get('tj') or [])}
        for tid in tj_ids[:12]:
            if tid in old_tj:
                tj.append(old_tj[tid])
                continue
            try:
                td = act_details(tid, cache)
                tj.append({'eli': tid, 'adres': td.get('displayAddress'), 'ogloszono': td.get('promulgation'), 'stan': td.get('legalStatusDate'), 'html': bool(td.get('textHTML'))})
            except Exception as e:
                log(f'  ⚠ tekst jednolity {tid}: {e}')
        zm = []
        for r in refs.get('Akty zmieniające', []):
            rid = r['id']
            y = eli_key(rid)[0]
            item = {'eli': rid, 'wejscie': r.get('date')}
            if rid in known_titles:
                item['tytul'], item['ogloszono'] = known_titles[rid]
            elif y >= TODAY.year - 2:  # tytuły tylko dla świeżych nowelizacji (oszczędzamy zapytania)
                try:
                    zd = act_details(rid, cache)
                    item['tytul'], item['ogloszono'] = zd.get('title'), zd.get('promulgation')
                    known_titles[rid] = [item['tytul'], item['ogloszono']]
                except Exception as e:
                    log(f'  ⚠ akt zmieniający {rid}: {e}')
            zm.append(item)
        zm.sort(key=lambda z: (z.get('wejscie') or '', eli_key(z['eli'])), reverse=True)
        rec = {'id': a['id'], 'nazwa': a['nazwa'], 'skrot': a.get('skrot', []), 'kategorie': a.get('kategorie', []), 'tekst': bool(a.get('teksty')),
               **slim(d), 'tj': tj, 'zmieniajace': zm[:60], 'liczba_zmian': len(zm)}
        akty.append(rec)
        log(f'✓ {a["id"]:8} {d.get("displayAddress")} — {d.get("title")[:90]} [{d.get("status")}] tj: {tj[0]["adres"] if tj else "—"}; nowelizacji: {len(zm)}')
        if a.get('teksty'):
            teksty_do.append((a, d, tj))
    uchylone = []
    for u in cfg.get('uchylone', []):
        try:
            d = act_details(u['eli'], cache)
            uchylone.append({**{k: u[k] for k in ('eli', 'nazwa', 'wzorce', 'zastapiony') if k in u}, **slim(d)})
            log(f'✓ uchylony? {u["eli"]} — {d.get("title")[:80]} [{d.get("status")}]')
        except Exception as e:
            log(f'⚠ uchylony {u["eli"]}: {e}')
            old = next((x for x in prev.get('uchylone', []) if x['eli'] == u['eli']), None)
            uchylone.append(old or u)
    save('akty.json', {'pobrano': dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds'), 'akty': akty, 'uchylone': uchylone, 'tytuly': known_titles})
    return prev_akty, akty, teksty_do


def sync_zmiany(prev_akty, akty):
    """Nowelizacje: nowe akty zmieniające względem poprzedniego przebiegu (+ pierwsze uruchomienie: ostatnie 12 mies.)."""
    data = load('zmiany.json', {'zmiany': []})
    have = {(z['akt'], z['eli']) for z in data['zmiany']}
    first = not data['zmiany']
    added = 0
    for a in akty:
        old = {z['eli'] for z in (prev_akty.get(a['id'], {}).get('zmieniajace') or [])}
        for z in a.get('zmieniajace', []):
            if (a['id'], z['eli']) in have:
                continue
            fresh = z['eli'] not in old and a['id'] in prev_akty
            recent = (z.get('ogloszono') or z.get('wejscie') or '') >= (TODAY - dt.timedelta(days=365)).isoformat()
            if (first and recent) or (fresh and not first):
                data['zmiany'].append({'akt': a['id'], 'nazwa': a['nazwa'], 'kategorie': a['kategorie'], 'eli': z['eli'],
                                       'tytul': z.get('tytul') or z['eli'], 'ogloszono': z.get('ogloszono'), 'wejscie': z.get('wejscie'),
                                       'wykryto': (z.get('ogloszono') if first else None) or TODAY.isoformat()})
                have.add((a['id'], z['eli']))
                added += 1
    cut = (TODAY - dt.timedelta(days=730)).isoformat()
    data['zmiany'] = sorted([z for z in data['zmiany'] if (z.get('wykryto') or '') >= cut], key=lambda z: (z.get('wykryto') or '', z.get('wejscie') or ''), reverse=True)[:400]
    data['pobrano'] = dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds')
    save('zmiany.json', data)
    log(f'✓ zmiany: +{added}, razem {len(data["zmiany"])}')


def sync_teksty(teksty_do):
    prev = load('akty.json', {})  # już zapisany bieżący — używamy tylko do odczytu tj
    for a, d, tj in teksty_do:
        src = next((t for t in tj if t.get('html')), None)
        eli = src['eli'] if src else (d.get('ELI') if d.get('textHTML') else None)
        if not eli:
            log(f'  – {a["id"]}: brak tekstu HTML')
            continue
        cur = load(f'teksty/{a["id"]}.json', {})
        if cur.get('zrodlo') == eli and cur.get('art') and cur.get('parser') == PARSER:
            continue  # ten sam tekst jednolity — nie pobieramy ponownie
        try:
            raw = http(f'{eli_url(eli)}/text.html')
            arts = split_articles_html(raw)
            how = 'id'
            if len(arts) < 3:  # starszy HTML bez identyfikatorów — podział po tekście
                text = html_to_text(raw)
                arts, how = split_articles(text, eli != d.get('ELI')), 'tekst'
            if len(arts) < 3:
                log(f'  ⚠ {a["id"]}: rozpoznano tylko {len(arts)} artykułów — zostawiam poprzedni plik.')
                continue
            save(f'teksty/{a["id"]}.json', {'id': a['id'], 'nazwa': a['nazwa'], 'zrodlo': eli, 'adres': src['adres'] if src else d.get('displayAddress'),
                                            'stan': src.get('stan') if src else None, 'pobrano': TODAY.isoformat(), 'parser': PARSER, 'art': arts})
            log(f'  ✓ tekst {a["id"]}: {len(arts)} artykułów z {eli} [{how}] (np. art. {arts[0][0]}: {arts[0][1][:80]!r})')
        except Exception as e:
            log(f'  ⚠ tekst {a["id"]} {eli}: {e}')


# ---------------------------------------------------------------- projekty ustaw
def sync_projekty(cfg):
    words = {k: v for k, v in (cfg.get('projekty') or {}).items() if not k.startswith('_')}
    terms = jget(f'{SEJM}/term')
    cur = next((t for t in terms if t.get('current')), None) or max(terms, key=lambda t: t.get('num', 0))
    term = cur['num']
    since = (TODAY - dt.timedelta(days=180)).isoformat()
    items = []
    try:
        items = jget(f'{SEJM}/term{term}/processes?limit=500&modifiedSince={since}T00:00:00')
    except Exception as e:
        log(f'  ⚠ processes modifiedSince: {e} — pobieram bez filtra')
    if not items:
        for off in range(0, 2000, 500):
            part = jget(f'{SEJM}/term{term}/processes?limit=500&offset={off}')
            items += part
            if len(part) < 500:
                break
        items = [p for p in items if (p.get('changeDate') or p.get('documentDate') or '') >= since]
    out = []
    for p in items:
        t = norm(p.get('title') or '')
        if 'projekt ustawy' not in t and 'projekt uchwaly' not in t:
            continue  # tylko projekty aktów (bez np. wniosków o uchylenie immunitetu)
        cats = [k for k, ph in words.items() if any(phrase_match(t, x) for x in ph)]
        if not cats:
            continue
        rec = {'nr': p.get('number'), 'tytul': p.get('title'), 'opis': (p.get('description') or '')[:400], 'kategorie': cats,
               'data': p.get('documentDate'), 'zmiana': p.get('changeDate'), 'uchwalony': p.get('passed'),
               'url': f'https://www.sejm.gov.pl/sejm{term}.nsf/PrzebiegProc.xsp?nr={urllib.parse.quote(str(p.get("number")))}'}
        try:
            det = jget(f'{SEJM}/term{term}/processes/{urllib.parse.quote(str(p.get("number")))}')
            st = det.get('stages') or []
            def flat(xs):
                for s in xs:
                    yield s
                    yield from flat(s.get('children') or [])
            fl = [s for s in flat(st) if s.get('stageName')]
            if fl:
                last = max(fl, key=lambda s: s.get('date') or '')
                rec['etap'], rec['etap_data'] = last.get('stageName'), last.get('date')
            rec['uchwalony'] = det.get('passed', rec['uchwalony'])
        except Exception as e:
            log(f'  ⚠ proces {p.get("number")}: {e}')
        out.append(rec)
    out.sort(key=lambda r: r.get('zmiana') or r.get('data') or '', reverse=True)
    save('projekty.json', {'pobrano': dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds'), 'kadencja': term, 'od': since, 'projekty': out[:80]})
    log(f'✓ projekty: kadencja {term}, przejrzano {len(items)}, pasuje {len(out)}')


# ---------------------------------------------------------------- odsetki
MIES = {'stycznia': 1, 'lutego': 2, 'marca': 3, 'kwietnia': 4, 'maja': 5, 'czerwca': 6, 'lipca': 7, 'sierpnia': 8, 'września': 9, 'października': 10, 'listopada': 11, 'grudnia': 12}
ODS = [  # klucz, tytuł obwieszczenia (dokładny koniec), podstawa
    ('kapitalowe', 'w sprawie wysokości odsetek ustawowych', 'art. 359 § 2 KC'),
    ('opoznienie', 'w sprawie wysokości odsetek ustawowych za opóźnienie', 'art. 481 § 2 KC'),
    ('handlowe', 'w sprawie wysokości odsetek ustawowych za opóźnienie w transakcjach handlowych', 'art. 4 pkt 3 ustawy o przeciwdziałaniu nadmiernym opóźnieniom w transakcjach handlowych'),
]


def pdf_text(data):
    from pypdf import PdfReader  # instalowane w workflow (pip install pypdf)
    return '\n'.join((p.extract_text() or '') for p in PdfReader(io.BytesIO(data)).pages)


def parse_rate(text):
    """„od dnia 5 marca 2026 r. … wynosi 9,25 %” → {od, stawka}; dla transakcji handlowych dwie stawki
    (dłużnik — publiczny podmiot leczniczy / pozostali): stawka = ogólna, stawka_leczniczy = szczególna."""
    t = re.sub(r'\s+', ' ', text)
    m = re.search(r'od dnia (\d{1,2}) (\w+) (\d{4}) r\.?(?: do dnia (\d{1,2}) (\w+) (\d{4}) r\.?)?,?.{0,200}?wynosi\s*:?\s*(.{0,700})', t)
    if not m or m.group(2) not in MIES:
        return None
    d, mies, y = m.group(1), m.group(2), m.group(3)
    rates = re.findall(r'(\d+(?:[,.]\d+)?)\s*%([^%;]{0,220})', m.group(7))
    if not rates:
        return None
    val = lambda v: float(v.replace(',', '.'))
    general = next((r for r in rates if 'nie jest' in r[1]), rates[0])
    res = {'od': f'{int(y):04d}-{MIES[mies]:02d}-{int(d):02d}', 'stawka': val(general[0])}
    if m.group(4) and m.group(5) in MIES:
        res['do'] = f'{int(m.group(6)):04d}-{MIES[m.group(5)]:02d}-{int(m.group(4)):02d}'
    spec = next((r for r in rates if 'jest podmiot' in r[1] and 'nie jest' not in r[1]), None)
    if spec:
        res['stawka_leczniczy'] = val(spec[0])
    return res


def sync_odsetki():
    prev = load('odsetki.json', {})
    items = []
    for y in (TODAY.year, TODAY.year - 1):
        try:
            r = jget(f'{ELI}/acts/search?publisher=MP&year={y}&title={urllib.parse.quote("odsetek ustawowych")}&limit=200')
            items += r.get('items', [])
        except Exception as e:
            log(f'  ⚠ wyszukiwanie obwieszczeń {y}: {e}')
    out = {'pobrano': dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds')}
    for key, suffix, basis in ODS:
        cands = [i for i in items if (i.get('title') or '').strip().rstrip('.').endswith(suffix) and i.get('type') == 'Obwieszczenie']
        cands.sort(key=lambda i: (i.get('promulgation') or '', eli_key(i.get('ELI', ''))), reverse=True)
        if not cands:
            out[key] = prev.get(key)
            log(f'  ⚠ odsetki {key}: brak obwieszczeń — zostawiam poprzednie')
            continue
        top = cands[0]
        old = prev.get(key) or {}
        if old.get('eli') == top.get('ELI') and old.get('stawka'):
            out[key] = old
            continue
        rec = {'eli': top.get('ELI'), 'tytul': top.get('title'), 'adres': top.get('displayAddress'), 'ogloszono': top.get('promulgation'), 'podstawa': basis}
        try:
            parsed = parse_rate(pdf_text(http(f'{eli_url(top["ELI"])}/text.pdf', binary=True)))
            if parsed:
                rec.update(parsed)
            else:
                log(f'  ⚠ odsetki {key}: nie odczytano stawki z PDF {top["ELI"]}')
        except Exception as e:
            log(f'  ⚠ odsetki {key} PDF: {e}')
        if 'stawka' not in rec and old.get('stawka'):
            rec['stawka_poprzednia'] = old.get('stawka')
        out[key] = rec
        log(f'✓ odsetki {key}: {rec.get("stawka")}% od {rec.get("od")} ({rec.get("adres")})')
    k, o = (out.get('kapitalowe') or {}).get('stawka'), (out.get('opoznienie') or {}).get('stawka')
    if k:
        out['maks_umowne'] = round(2 * k, 2)        # art. 359 § 2¹ KC
    if o:
        out['maks_opoznienie'] = round(2 * o, 2)    # art. 481 § 2¹ KC
    save('odsetki.json', out)


# ---------------------------------------------------------------- kursy NBP
def monthly(rows, keys):
    """[{effectiveDate, mid|bid|ask}] -> {'2008-07': [średnie dla kluczy]} (średnia z dni miesiąca)."""
    acc = {}
    for r in rows:
        m = str(r.get('effectiveDate', ''))[:7]
        v = [r.get(k) for k in keys]
        if len(m) == 7 and all(isinstance(x, (int, float)) for x in v):
            acc.setdefault(m, []).append(v)
    return {m: [round(sum(x[i] for x in vs) / len(vs), 4) for i in range(len(keys))] for m, vs in acc.items()}


def nbp_range(table, code, start, end):
    rows, d = [], start
    while d <= end:
        e = min(end, d + dt.timedelta(days=90))   # API NBP: najwyżej 93 dni w jednym zapytaniu
        try:
            rows += jget(f'{NBP}/{table}/{code.lower()}/{d.isoformat()}/{e.isoformat()}/?format=json').get('rates', [])
        except urllib.error.HTTPError as x:
            if x.code != 404:          # 404 = brak notowań w tym okresie
                raise
        time.sleep(PAUSE)
        d = e + dt.timedelta(days=1)
    return rows


def sync_kursy():
    """Miesięczne kursy NBP od 2002 r. Przy kolejnych przebiegach pobiera tylko ostatnie dwa miesiące."""
    old = load('kursy.json', {})
    out = {'_info': 'Średnie miesięczne kursy NBP: [średni (tabela A), kupno, sprzedaż (tabela C)] w zł za 1 jednostkę waluty. Źródło: api.nbp.pl.',
           'waluty': old.get('waluty', {})}
    for code in WALUTY:
        cur = out['waluty'].get(code, {})
        start = dt.date(2002, 1, 2)
        if cur:
            y, m = map(int, max(cur).split('-'))
            start = dt.date(y, m, 1) - dt.timedelta(days=31)
            start = start.replace(day=1)
        a = monthly(nbp_range('a', code, start, TODAY), ['mid'])
        c = monthly(nbp_range('c', code, start, TODAY), ['bid', 'ask'])
        for m in sorted(set(a) | set(c)):
            mid = (a.get(m) or [None])[0]
            bid, ask = c.get(m) or [None, None]
            cur[m] = [mid, bid, ask]
        out['waluty'][code] = dict(sorted(cur.items()))
        log(f'✓ kursy {code}: {len(cur)} miesięcy (od {start})')
    out['pobrano'] = TODAY.isoformat()
    save('kursy.json', out)


# ---------------------------------------------------------------- orzecznictwo (SAOS)
def judgment(it):
    """Pozycja z wyszukiwarki SAOS -> skrócony opis orzeczenia."""
    div = it.get('division') or {}
    court = (div.get('court') or {}).get('name') or {'SUPREME': 'Sąd Najwyższy', 'CONSTITUTIONAL_TRIBUNAL': 'Trybunał Konstytucyjny',
                                                      'ADMINISTRATIVE': 'Sąd administracyjny', 'NATIONAL_APPEAL_CHAMBER': 'Krajowa Izba Odwoławcza'}.get(it.get('courtType'), '')
    if it.get('courtType') == 'SUPREME':
        ch = [c.get('name') for c in (it.get('chambers') or []) if c.get('name')]
        court = 'Sąd Najwyższy' + (' — ' + ch[0] if ch else '')
    txt = re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', str(it.get('textContent') or '')))).strip()
    return {'id': it.get('id'), 'sygn': ', '.join(c.get('caseNumber', '') for c in (it.get('courtCases') or []) if c.get('caseNumber')),
            'sad': court, 'wydzial': div.get('name', ''), 'data': it.get('judgmentDate', ''), 'rodzaj': {'SENTENCE': 'wyrok', 'DECISION': 'postanowienie', 'RESOLUTION': 'uchwała', 'REASONS': 'uzasadnienie', 'REGULATION': 'zarządzenie'}.get(it.get('judgmentType'), (it.get('judgmentType') or '').lower()),
            'hasla': [k for k in (it.get('keywords') or []) if isinstance(k, str)][:6], 'fragment': txt[:400],
            'url': f"{SAOS}/judgments/{it.get('id')}"}


def sync_orzeczenia(cfg):
    zap = ORZ_DOMYSLNE | {k: v for k, v in (cfg.get('orzecznictwo') or {}).items() if not k.startswith('_') and isinstance(v, list) and v}
    old = load('orzeczenia.json', {}).get('kategorie', {})
    out, bledy = {}, 0
    for kat, qs in zap.items():
        lst, seen = [], set()
        try:
            for q in qs[:3]:
                for extra in ('', '&courtType=SUPREME'):
                    url = f"{SAOS}/api/search/judgments?all={urllib.parse.quote(q)}&sortingField=JUDGMENT_DATE&sortingDirection=DESC&pageSize={8 if extra else 15}{extra}"
                    for it in jget(url).get('items', []):
                        j = judgment(it)
                        if j['id'] and j['id'] not in seen:
                            seen.add(j['id']); lst.append(j)
                    time.sleep(PAUSE)
            lst.sort(key=lambda j: j['data'], reverse=True)
            out[kat] = {'zapytania': qs[:3], 'orzeczenia': lst[:20]}
        except Exception as e:
            bledy += 1
            log(f'⚠ orzecznictwo {kat}: {e!r} — zostaje poprzednia lista')
            if kat in old:
                out[kat] = old[kat]
    if bledy == len(zap):
        raise RuntimeError('SAOS niedostępny')
    save('orzeczenia.json', {'_info': 'Najnowsze orzeczenia z SAOS (saos.org.pl) dla kategorii spraw. Dane informacyjne — treść orzeczenia sprawdź w źródle.',
                             'pobrano': TODAY.isoformat(), 'kategorie': out})
    log(f"✓ orzecznictwo: {sum(len(v['orzeczenia']) for v in out.values())} orzeczeń w {len(out)} kategoriach")


# ---------------------------------------------------------------- lista ustaw z CRM
RE_ID = re.compile(r'^[a-z0-9_]{1,20}$')
RE_ELI = re.compile(r'^(DU|MP)/\d{4}/\d{1,5}$')


def clean_cfg(obs):
    """Sprawdza listę z CRM; zwraca (akty, projekty) albo zgłasza ValueError z opisem."""
    if not isinstance(obs, dict) or not isinstance(obs.get('akty'), list) or not obs['akty']:
        raise ValueError('brak listy ustaw')
    akty, ids, elis = [], set(), set()
    for i, a in enumerate(obs['akty'], 1):
        if not isinstance(a, dict):
            raise ValueError(f'pozycja {i}: zły format')
        aid, eli, nazwa = str(a.get('id', '')).strip(), str(a.get('eli', '')).strip(), str(a.get('nazwa', '')).strip()
        if not RE_ID.match(aid):
            raise ValueError(f'pozycja {i}: identyfikator „{aid}” (małe litery, cyfry, _)')
        if not RE_ELI.match(eli):
            raise ValueError(f'pozycja {i}: adres ELI „{eli}” (np. DU/1964/93)')
        if not nazwa:
            raise ValueError(f'pozycja {i}: brak nazwy')
        if aid in ids or eli in elis:
            raise ValueError(f'pozycja {i}: powtórzony identyfikator lub ELI')
        ids.add(aid); elis.add(eli)
        lst = lambda k: [str(x).strip() for x in (a.get(k) or []) if str(x).strip()][:40]
        akty.append({'id': aid, 'eli': eli, 'nazwa': nazwa[:200], 'skrot': lst('skrot'), 'kategorie': lst('kategorie'), 'teksty': a.get('teksty') is not False})
    def words(d, n):
        if not isinstance(d, dict):
            return None
        r = {}
        for k, v in d.items():
            if k.startswith('_') or not isinstance(v, list):
                continue
            w = [str(x).strip()[:120] for x in v if str(x).strip()][:n]
            if w:
                r[str(k)[:10]] = w
        return r
    return akty, words(obs.get('projekty'), 30), words(obs.get('orzecznictwo'), 3)


def crm_cfg(cfg):
    """Lista ustaw opublikowana w CRM (site_content.data.obserwowane, odczyt kluczem publicznym)."""
    try:
        page = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
        m = re.search(r"SITE_DB='([^']+)',SITE_KEY='([^']+)'", page)
        if not m:
            return cfg, 'plik'
        req = urllib.request.Request(f'{m[1]}/rest/v1/site_content?id=eq.1&select=obs:data->obserwowane',
                                     headers={'User-Agent': UA, 'apikey': m[2], 'Authorization': f'Bearer {m[2]}', 'Accept': 'application/json'})
        with urllib.request.urlopen(req, timeout=30) as r:
            rows = json.loads(r.read())
        obs = rows[0].get('obs') if rows else None
        if not obs:
            return cfg, 'plik'
        akty, proj, orz = clean_cfg(obs)
    except ValueError as e:
        log(f'⚠ lista ustaw z CRM odrzucona ({e}) — używam prawo/obserwowane.json')
        return cfg, 'plik (błąd w CRM)'
    except Exception as e:
        log(f'⚠ lista ustaw z CRM niedostępna ({e!r}) — używam prawo/obserwowane.json')
        return cfg, 'plik'
    new = dict(cfg)
    new['akty'] = akty
    if proj:
        new['projekty'] = {'_info': (cfg.get('projekty') or {}).get('_info', '')} | proj
    if orz is not None:
        new['orzecznictwo'] = {'_info': 'Zapytania do wyszukiwarki SAOS dla kategorii spraw (najwyżej 3 na kategorię).'} | orz
    if new != cfg:
        with open(os.path.join(OUT, 'obserwowane.json'), 'w', encoding='utf-8') as f:
            json.dump(new, f, ensure_ascii=False, indent=2)
            f.write('\n')
        log(f'✓ lista ustaw z CRM: {len(akty)} ustaw (zapisano prawo/obserwowane.json)')
    return new, 'crm'


# ---------------------------------------------------------------- start
def main():
    with open(os.path.join(OUT, 'obserwowane.json'), encoding='utf-8') as f:
        cfg = json.load(f)
    cfg, zrodlo = crm_cfg(cfg)
    stan = load('stan.json', {})
    stan['lista'] = zrodlo
    res = {}
    t0 = time.time()
    for name, fn in [('akty', lambda: sync_akty(cfg)), ('projekty', lambda: sync_projekty(cfg)), ('odsetki', sync_odsetki), ('kursy', sync_kursy), ('orzecznictwo', lambda: sync_orzeczenia(cfg))]:
        try:
            r = fn()
            res[name] = 'ok'
            if name == 'akty':
                prev_akty, akty, teksty_do = r
                try:
                    sync_zmiany(prev_akty, akty)
                    res['zmiany'] = 'ok'
                except Exception as e:
                    res['zmiany'] = f'błąd: {e}'
                    log(f'✗ zmiany: {e!r}')
                try:
                    sync_teksty(teksty_do)
                    res['teksty'] = 'ok'
                except Exception as e:
                    res['teksty'] = f'błąd: {e}'
                    log(f'✗ teksty: {e!r}')
        except Exception as e:
            res[name] = f'błąd: {e}'
            log(f'✗ {name}: {e!r}')
    stan.update({'ostatnio': dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds'), 'wynik': res, 'czas_s': round(time.time() - t0)})
    if all(v == 'ok' for v in res.values()):
        stan['ostatnio_ok'] = stan['ostatnio']
    save('stan.json', stan)
    with open(os.path.join(OUT, 'sync-log.txt'), 'w', encoding='utf-8') as f:
        f.write('\n'.join(LOG) + '\n')
    return 0


if __name__ == '__main__':
    sys.exit(main())
