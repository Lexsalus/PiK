#!/usr/bin/env python3
"""Strażnik zmian w prawie — codzienna synchronizacja danych z API Sejmu.

Źródła (dane publiczne, art. 4 ustawy o prawie autorskim):
  * ELI  https://api.sejm.gov.pl/eli  — akty prawne (Dziennik Ustaw, Monitor Polski)
  * Sejm https://api.sejm.gov.pl/sejm — projekty ustaw (procesy legislacyjne)

Wejście:  prawo/obserwowane.json (lista ustaw, kategorie spraw, słowa do projektów)
Wyjście:  prawo/akty.json        — stan obserwowanych i uchylonych aktów, teksty jednolite, akty zmieniające
          prawo/zmiany.json      — nowelizacje obserwowanych ustaw (z datą wykrycia)
          prawo/projekty.json    — projekty ustaw w Sejmie pasujące do kategorii spraw
          prawo/odsetki.json     — aktualne odsetki ustawowe z obwieszczeń w Monitorze Polskim
          prawo/teksty/<id>.json — artykuły z ostatniego tekstu jednolitego (wyszukiwarka, Adam, podgląd)
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
UA = 'PiK-prawo-sync/1.0 (+https://lexsalus.github.io/PiK/)'
PARSER = 2  # wersja parsera tekstów — zmiana wymusza ponowne pobranie artykułów
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
    return [re.sub(r'\s{2,}', ' ', x) for x in out]


def _art_key(nr):
    m = re.match(r'(\d+)', nr)
    return int(m.group(1)) if m else 0


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
            text = html_to_text(raw)
            arts = split_articles(text, eli != d.get('ELI'))
            if len(arts) < 3:
                log(f'  ⚠ {a["id"]}: rozpoznano tylko {len(arts)} artykułów — zostawiam poprzedni plik. Początek tekstu: {text[:300]!r}')
                continue
            save(f'teksty/{a["id"]}.json', {'id': a['id'], 'nazwa': a['nazwa'], 'zrodlo': eli, 'adres': src['adres'] if src else d.get('displayAddress'),
                                            'stan': src.get('stan') if src else None, 'pobrano': TODAY.isoformat(), 'parser': PARSER, 'art': arts})
            log(f'  ✓ tekst {a["id"]}: {len(arts)} artykułów z {eli} (np. art. {arts[0][0]}: {arts[0][1][:80]!r})')
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


# ---------------------------------------------------------------- start
def main():
    with open(os.path.join(OUT, 'obserwowane.json'), encoding='utf-8') as f:
        cfg = json.load(f)
    stan = load('stan.json', {})
    res = {}
    t0 = time.time()
    for name, fn in [('akty', lambda: sync_akty(cfg)), ('projekty', lambda: sync_projekty(cfg)), ('odsetki', sync_odsetki)]:
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
