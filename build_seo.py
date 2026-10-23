"""Wpisuje ustawienia SEO z data.json do index.html oraz tworzy robots.txt i sitemap.xml.

Uruchamiany automatycznie przez GitHub Actions przed publikacją.
Lokalnie (podgląd wyniku):  py build_seo.py
Zmienia tylko blok między <!--SEO--> a <!--/SEO--> w index.html.
"""
import json, datetime, html, pathlib, re, sys
from urllib.parse import urlparse

ROOT = pathlib.Path(__file__).parent
D = json.loads((ROOT / "data.json").read_text(encoding="utf-8"))
S, SITE = D.get("seo", {}), D.get("site", {})
TR = D.get("translations", {})
LANGS = ["pl"] + [l for l in D.get("i18n", {}).get("languages", []) if l != "pl"]
OWN = D.get("i18n", {}).get("mode", "own") == "own"
OG_LOC = {"pl": "pl_PL", "uk": "uk_UA", "en": "en_GB"}

e = lambda s: html.escape(str(s or ""), quote=True)
base = (S.get("siteUrl") or "").strip()
if base and not base.endswith("/"):
    base += "/"
title = S.get("title") or SITE.get("name") or "Porównywarka"
desc = S.get("description") or ""
lang_url = lambda l: base + ("" if l == "pl" else f"?lang={l}")

m = [f"<title>{e(title)}</title>",
     f'<meta name="description" content="{e(desc)}">']
if S.get("keywords"): m.append(f'<meta name="keywords" content="{e(S["keywords"])}">')
if S.get("author"): m.append(f'<meta name="author" content="{e(S["author"])}">')
m.append(f'<meta name="robots" content="{"index" if S.get("robotsIndex", True) else "noindex"},{"follow" if S.get("robotsFollow", True) else "nofollow"}">')
if S.get("themeColor"): m.append(f'<meta name="theme-color" content="{e(S["themeColor"])}">')
if S.get("googleVerification"): m.append(f'<meta name="google-site-verification" content="{e(S["googleVerification"])}">')
if S.get("bingVerification"): m.append(f'<meta name="msvalidate.01" content="{e(S["bingVerification"])}">')
if base:
    m.append(f'<link rel="canonical" href="{e(base)}">')
    if OWN and len(LANGS) > 1:
        for l in LANGS:
            m.append(f'<link rel="alternate" hreflang="{l}" href="{e(lang_url(l))}">')
        m.append(f'<link rel="alternate" hreflang="x-default" href="{e(base)}">')
# Open Graph / X
m += [f'<meta property="og:type" content="website">',
      f'<meta property="og:title" content="{e(title)}">',
      f'<meta property="og:description" content="{e(desc)}">',
      f'<meta property="og:site_name" content="{e(SITE.get("name"))}">',
      f'<meta property="og:locale" content="pl_PL">']
if OWN:
    m += [f'<meta property="og:locale:alternate" content="{OG_LOC[l]}">' for l in LANGS[1:] if l in OG_LOC]
if base: m.append(f'<meta property="og:url" content="{e(base)}">')
if S.get("ogImage"): m.append(f'<meta property="og:image" content="{e(S["ogImage"])}">')
m.append(f'<meta name="twitter:card" content="{e(S.get("twitterCard") or "summary_large_image")}">')
if S.get("twitterSite"): m.append(f'<meta name="twitter:site" content="{e(S["twitterSite"])}">')
# schema.org
st = S.get("schemaType")
if st:
    ld = {"@context": "https://schema.org", "@type": st, "name": S.get("orgName") or SITE.get("name"), "description": desc}
    if base: ld["url"] = base
    if st != "WebSite" and S.get("orgLogo"): ld["logo"] = S["orgLogo"]
    if st == "WebSite": ld["inLanguage"] = LANGS if OWN else ["pl"]
    m.append('<script type="application/ld+json">' + json.dumps(ld, ensure_ascii=False).replace("</", "<\\/") + "</script>")
if S.get("headExtra"): m.append(S["headExtra"].strip())

idx = ROOT / "index.html"
src = idx.read_text(encoding="utf-8")
block = "<!--SEO-->\n" + "\n".join(m) + "\n<!--/SEO-->"
new, n = re.subn(r"<!--SEO-->.*?<!--/SEO-->", lambda _: block, src, flags=re.S)
if n != 1:
    sys.exit("Brak znaczników <!--SEO--> ... <!--/SEO--> w index.html")
idx.write_text(new, encoding="utf-8")

# robots.txt
path = urlparse(base).path if base else "/"
robots = ["User-agent: *", "Allow: /" if S.get("robotsIndex", True) else "Disallow: /", f"Disallow: {path}admin.html", f"Disallow: {path}crm.html"]
if S.get("robotsExtra"): robots.append(S["robotsExtra"].strip())
if base: robots += ["", f"Sitemap: {base}sitemap.xml"]
(ROOT / "robots.txt").write_text("\n".join(robots) + "\n", encoding="utf-8")

# sitemap.xml
if base:
    today = datetime.date.today().isoformat()
    langs = LANGS if OWN else ["pl"]
    urls = []
    for l in langs:
        alt = "".join(f'\n    <xhtml:link rel="alternate" hreflang="{a}" href="{e(lang_url(a))}"/>' for a in langs) if len(langs) > 1 else ""
        urls.append(f"  <url>\n    <loc>{e(lang_url(l))}</loc>\n    <lastmod>{today}</lastmod>\n"
                    f"    <changefreq>{S.get('sitemapChangefreq', 'weekly')}</changefreq>\n    <priority>{S.get('sitemapPriority', '1.0')}</priority>{alt}\n  </url>")
    (ROOT / "sitemap.xml").write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
                                     'xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' + "\n".join(urls) + "\n</urlset>\n", encoding="utf-8")

print(f"SEO: {len(m)} tagów, języki: {', '.join(LANGS)}, sitemap: {'tak' if base else 'nie (brak siteUrl)'}")
