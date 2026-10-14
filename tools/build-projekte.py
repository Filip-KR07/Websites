#!/usr/bin/env python3
"""Erzeugt die Case-Study-Seiten aus projekte/projekte.json:
   projekte.html             Uebersicht aller Case Studies (an der Wurzel, damit relative Pfade auf
                             Vercel mit cleanUrls, lokal und auf GitHub Pages gleich aufloesen)
   projekte/<slug>.html      eine Seite je Case Study
Aufruf im Repo-Wurzelordner: python3 tools/build-projekte.py
"""
import html
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = json.load(open(os.path.join(ROOT, 'projekte', 'projekte.json'), encoding='utf-8'))
DOMAIN = 'https://filipkramar.de'
GROUPS = {'handwerk': 'Handwerk & Bau', 'gesundheit': 'Gesundheit', 'beauty': 'Beauty', 'sport': 'Sport & Wohlbefinden',
          'gastro': 'Gastronomie & Hotel', 'beratung': 'Beratung', 'mobil': 'Mobilität', 'kreativ': 'Kreativ & Handel'}
KINDS = {'demo': 'Demo-Betrieb, erfunden', 'entwurf': 'Entwurf ohne Auftrag'}
KIND_SHORT = {'demo': 'Demo', 'entwurf': 'Entwurf'}
ART = {'hero': 'Hero-Variante', 'design': 'Eigenes Design'}
N = len(DATA)
PAGES = N + sum(len(o['variants']) for o in DATA)
e = html.escape


def head(title, desc, canonical, root):
    return f'''<!DOCTYPE html>
<html lang="de" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#F6F3EC">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<link rel="canonical" href="{canonical}">
<meta property="og:type" content="website">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:locale" content="de_DE">
<link rel="icon" href="{root}favicon.svg" type="image/svg+xml">
<link rel="preload" as="font" type="font/woff2" href="{root}assets/fonts/cormorant-garamond-400-latin.woff2" crossorigin>
<link rel="preload" as="font" type="font/woff2" href="{root}assets/fonts/inter-400-latin.woff2" crossorigin>
<link rel="stylesheet" href="{root}style.css">
<link rel="stylesheet" href="{root}assets/projekte.css">
<script>document.documentElement.classList.remove('no-js');document.documentElement.classList.add('js');</script>
</head>
<body class="cs">
<a class="skip" href="#main">Zum Inhalt springen</a>
<header class="cs-nav" data-cs-nav>
  <a class="nav__brand" href="{root}">Filip <em>Kramar</em></a>
  <nav class="cs-nav__links" aria-label="Seiten">
    <a href="{root}projekte.html"{' aria-current="page"' if root == './' else ''}>Case Studies</a>
    <a class="btn btn--ink cs-nav__cta" href="{root}#kontakt"><span>Projekt anfragen</span></a>
  </nav>
</header>
'''


def foot(root):
    return f'''<footer class="footer cs-footer">
  <div class="container">
    <p class="footer__mark" aria-hidden="true">Filip <em>Kramar</em></p>
    <div class="footer__row">
      <p class="footer__copy">© <span data-year>2026</span> Filip Kramar · Alle Demo-Betriebe sind erfunden, Entwürfe für echte Betriebe sind ohne Auftrag entstanden.</p>
      <nav class="footer__links" aria-label="Rechtliches">
        <a href="{root}">Startseite</a>
        <a href="{root}impressum.html">Impressum</a>
        <a href="{root}datenschutz.html">Datenschutz</a>
      </nav>
    </div>
  </div>
</footer>
<script src="{root}assets/projekte.js"></script>
</body>
</html>
'''


def swatches(colors, big=False):
    items = ''.join(f'<i style="--c:{e(c)}" title="{e(c)}"></i>' for c in colors[:5])
    return f'<span class="cs-swatches{" cs-swatches--lg" if big else ""}" aria-hidden="true">{items}</span>'


def card(o, i, root):
    search = ' '.join(filter(None, [o['title'], o.get('model') or '', o['branche'], o['ort'], GROUPS[o['group']], KINDS[o['kind']], o['summary']])).lower()
    return f'''      <li class="cs-card cs-reveal" data-kind="{o['kind']}" data-group="{o['group']}" data-search="{e(search)}">
        <a class="cs-card__link" href="{root}projekte/{o['slug']}.html">
          <span class="cs-card__media">
            <span class="cs-frame"><i></i><img class="cs-card__desk" src="{root}assets/projekte/preview/{o['slug']}-desktop.webp" width="960" height="600" loading="lazy" decoding="async" alt=""></span>
            <img class="cs-card__phone" src="{root}assets/projekte/preview/{o['slug']}-mobile.webp" width="300" height="649" loading="lazy" decoding="async" alt="">
          </span>
          <span class="cs-card__body">
            <span class="cs-card__meta"><b>{i:02d}</b><span>{e(o['branche'])} · {e(o['ort'])}</span><em class="cs-tag cs-tag--{o['kind']}">{KIND_SHORT[o['kind']]}</em></span>
            <span class="cs-card__name">{e(o['title'])}</span>
            <span class="cs-card__pitch">{e(o['summary'])}</span>
            <span class="cs-card__foot">{swatches(o['colors'])}<span class="cs-card__go">Case Study <span aria-hidden="true">→</span></span></span>
          </span>
        </a>
      </li>
'''


def index_page():
    root = './'
    n_demo = sum(o['kind'] == 'demo' for o in DATA)
    n_ent = N - n_demo
    chips_group = ''.join(f'<button class="cs-chip" type="button" data-filter-group="{g}" aria-pressed="false">{e(l)} <span>{sum(o["group"] == g for o in DATA)}</span></button>' for g, l in GROUPS.items())
    cards = ''.join(card(o, i + 1, root) for i, o in enumerate(DATA))
    desc = f'{N} Case Studies: {n_demo} Demo-Websites für erfundene Betriebe aus acht Branchen und {n_ent} Entwürfe für echte Betriebe. Jede Seite läuft und lässt sich öffnen.'
    return head('Case Studies — Filip Kramar', desc, f'{DOMAIN}/projekte', root) + f'''
<main id="main" class="cs-page">
  <section class="cs-hero">
    <div class="container">
      <p class="eyebrow">Case Studies</p>
      <h1 class="cs-hero__title">Dreißig Websites, <em>gebaut zum Anfassen.</em></h1>
      <p class="lead cs-hero__lead">{n_demo} Demo-Betriebe aus acht Branchen, {n_ent} Entwürfe für echte Betriebe und zwei Arenen mit je sechs Varianten. Jede Seite läuft, jede kannst du öffnen und ausprobieren: Rechner, Konfiguratoren, Buchung, Speisekarten.</p>
      <dl class="cs-facts">
        <div><dt>Case Studies</dt><dd data-count="{N}">{N}</dd></div>
        <div><dt>gebaute Seiten</dt><dd data-count="{PAGES}">{PAGES}</dd></div>
        <div><dt>Branchengruppen</dt><dd data-count="{len(GROUPS)}">{len(GROUPS)}</dd></div>
        <div><dt>Templates</dt><dd>0</dd></div>
      </dl>
      <p class="cs-note">Alle Demo-Betriebe sind erfunden, samt Namen, Adressen und Zahlen. Die Entwürfe für echte Betriebe sind ohne Auftrag entstanden und als solche gekennzeichnet; Namen und Marken gehören den Betrieben.</p>
    </div>
  </section>

  <section class="cs-list" id="liste" aria-labelledby="liste-title">
    <div class="container">
      <div class="cs-tools">
        <h2 class="cs-list__title" id="liste-title">Alle Case Studies</h2>
        <div class="cs-chips" role="group" aria-label="Nach Art filtern">
          <button class="cs-chip" type="button" data-filter-kind="all" aria-pressed="true">Alle <span>{N}</span></button>
          <button class="cs-chip" type="button" data-filter-kind="demo" aria-pressed="false">Demo-Betriebe <span>{n_demo}</span></button>
          <button class="cs-chip" type="button" data-filter-kind="entwurf" aria-pressed="false">Entwürfe für echte Betriebe <span>{n_ent}</span></button>
        </div>
        <div class="cs-chips" role="group" aria-label="Nach Branche filtern">
          <button class="cs-chip" type="button" data-filter-group="all" aria-pressed="true">Alle Branchen</button>
          {chips_group}
        </div>
        <label class="cs-search"><span class="sr-only">Case Studies durchsuchen</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="m16 16 4.5 4.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
          <input type="search" placeholder="Branche, Stadt oder Name" autocomplete="off" data-cs-search>
        </label>
        <p class="cs-status" role="status" aria-live="polite" data-cs-status>{N} Case Studies</p>
      </div>
      <ol class="cs-grid" data-cs-grid>
{cards}      </ol>
      <p class="cs-empty" data-cs-empty hidden>Nichts gefunden. <button type="button" class="cs-link" data-cs-reset>Filter zurücksetzen</button></p>
    </div>
  </section>

  <section class="cs-cta">
    <div class="container cs-cta__inner cs-reveal">
      <p class="eyebrow eyebrow--light">Dein Betrieb</p>
      <h2 class="cs-cta__title">So eine Seite <em>für dich?</em></h2>
      <p class="cs-cta__lead">Such dir die Richtung aus, die zu deinem Betrieb passt, und schreib mir kurz, was du anbietest. Du bekommst eine ehrliche Einschätzung, was eine Website kostet und was sie dir bringen kann.</p>
      <a class="btn btn--big" href="{root}#kontakt"><span>Projekt anfragen</span></a>
    </div>
  </section>
</main>
''' + foot(root)


def variant_block(o, root):
    if not o['variants']:
        return ''
    items = ''
    for v in o['variants']:
        jury = f'<span class="cs-variant__jury"><b>{e(str(v["jury"]))}</b> / 100 Jury</span>' if v.get('jury') is not None else ''
        items += f'''        <li class="cs-variant cs-reveal">
          <a class="cs-variant__link" href="{root}{e(v['live'])}" target="_blank" rel="noopener">
            <span class="cs-frame"><i></i><img src="{root}{e(v['preview'])}" width="960" height="600" loading="lazy" decoding="async" alt=""></span>
            <span class="cs-variant__body">
              <span class="cs-variant__art">{ART.get(v['art'], v['art'])}</span>
              <span class="cs-variant__name">{e(v['name'])}</span>
              <span class="cs-variant__idea">{e(v['idee'])}</span>
              <span class="cs-variant__foot">{jury}<span class="cs-card__go">Öffnen <span aria-hidden="true">↗</span></span></span>
            </span>
          </a>
        </li>
'''
    heros = sum(v['art'] == 'hero' for v in o['variants'])
    designs = len(o['variants']) - heros
    return f'''      <h2 class="cs-h2 cs-reveal">Eine Seite, {len(o['variants'])} Varianten, zwei Jurys</h2>
      <p class="cs-reveal">Zur fertigen Seite sind {heros} weitere Einstiege (gleiche Seite, anderer Hero) und {designs} komplett eigene Designs entstanden, unabhängig voneinander gebaut. Danach hat je Gruppe eine Jury alle Seiten im Browser geöffnet, getestet und mit bis zu 100 Punkten bewertet. Die Punkte stehen an jeder Variante, bekannte Schwächen sind nicht wegretuschiert.</p>
      <ul class="cs-variants">
{items}      </ul>
'''


def case_page(o, i):
    root = '../'
    prev = DATA[i - 1] if i > 0 else DATA[-1]
    nxt = DATA[i + 1] if i < N - 1 else DATA[0]
    live = root + o['live']
    model = f'<p class="cs-head__model">Modell <em>„{e(o["model"])}“</em></p>' if o.get('model') else ''
    umfang = 'One-Pager mit Impressum und Datenschutz' + (f', dazu {len(o["variants"])} Varianten' if o['variants'] else '')
    features = ''.join(f'<li class="cs-reveal"><b>{e(f.split(":", 1)[0].strip())}</b><span>{e(f.split(":", 1)[1].strip()) if ":" in f else ""}</span></li>' for f in o['features'])
    technik = ''.join(f'<li>{e(t)}</li>' for t in o['technik'])
    real = ''
    if o.get('real'):
        r = o['real']
        name = f'<a href="{e(r["url"])}" target="_blank" rel="noopener noreferrer">{e(r["name"])}</a>' if r.get('url') else e(r['name'])
        real = f'<h2>Betrieb</h2><p>{name}</p>'
    note = f'<p class="cs-notice cs-reveal">{e(o["note"])}</p>' if o.get('note') else ''
    if o['kind'] == 'entwurf' and not (o.get('note') or '').startswith('Entwurf ohne Auftrag'):
        note = f'<p class="cs-notice cs-reveal">Entwurf ohne Auftrag: {e(o["real"]["name"]) if o.get("real") else "der Betrieb"} ist kein Kunde. Name und Marke gehören dem Betrieb.</p>' + note
    title = f'{o["title"]} — Case Study — Filip Kramar'
    return head(title, o['summary'], f'{DOMAIN}/projekte/{o["slug"]}', root) + f'''
<main id="main" class="cs-page cs-page--case">
  <section class="cs-head">
    <div class="container">
      <p class="eyebrow">Case Study {i + 1:02d} / {N} · {e(GROUPS[o['group']])}</p>
      <h1 class="cs-head__title">{e(o['title'])}</h1>
      {model}
      <p class="lead cs-head__lead">{e(o['summary'])}</p>
      <dl class="cs-meta">
        <div><dt>Art</dt><dd>{KINDS[o['kind']]}</dd></div>
        <div><dt>Branche</dt><dd>{e(o['branche'])}</dd></div>
        <div><dt>Ort</dt><dd>{e(o['ort'])}</dd></div>
        <div><dt>Jahr</dt><dd>{e(o['year'])}</dd></div>
        <div><dt>Umfang</dt><dd>{umfang}</dd></div>
      </dl>
      <div class="cs-head__actions">
        <a class="btn btn--ink" href="{e(live)}" target="_blank" rel="noopener"><span>Live ansehen ↗</span></a>
        <a class="btn btn--line" href="{root}projekte.html">Alle Case Studies</a>
      </div>
    </div>
  </section>

  <section class="cs-show" aria-label="Vorschau">
    <div class="container">
      <div class="cs-show__stage cs-reveal">
        <a class="cs-frame cs-frame--lg" href="{e(live)}" target="_blank" rel="noopener" aria-label="{e(o['title'])} live öffnen"><i></i><img src="{root}assets/projekte/preview/{o['slug']}-desktop.webp" width="960" height="600" fetchpriority="high" decoding="async" alt="Startseite von {e(o['title'])} am Desktop"></a>
        <figure class="cs-phone"><img src="{root}assets/projekte/preview/{o['slug']}-mobile.webp" width="300" height="649" loading="lazy" decoding="async" alt="Startseite von {e(o['title'])} auf dem Handy"></figure>
      </div>
    </div>
  </section>

  <section class="cs-body">
    <div class="container cs-body__grid">
      <div class="cs-text">
        {note}
        <h2 class="cs-h2 cs-reveal">Ausgangslage</h2>
        <p class="cs-reveal">{e(o['ausgangslage'])}</p>
        <h2 class="cs-h2 cs-reveal">Idee</h2>
        <p class="cs-reveal">{e(o['idee'])}</p>
        <h2 class="cs-h2 cs-reveal">Was die Seite kann</h2>
        <ol class="cs-features">{features}</ol>
{variant_block(o, root)}      </div>
      <aside class="cs-aside">
        <div class="cs-aside__card cs-reveal">
          <h2>Technik</h2>
          <ul class="cs-tech">{technik}</ul>
          <h2>Farben</h2>
          {swatches(o['colors'], True)}
          <h2>Schrift</h2>
          <p>{e(', '.join(o['fonts']))}</p>
          {real}
          <a class="btn btn--ink cs-aside__btn" href="{e(live)}" target="_blank" rel="noopener"><span>Live ansehen ↗</span></a>
        </div>
      </aside>
    </div>
  </section>

  <section class="cs-cta">
    <div class="container cs-cta__inner cs-reveal">
      <p class="eyebrow eyebrow--light">Dein Betrieb</p>
      <h2 class="cs-cta__title">So eine Seite <em>für dich?</em></h2>
      <p class="cs-cta__lead">Schreib mir kurz, was du anbietest und was deine Website leisten soll. Du bekommst eine ehrliche Einschätzung, was sie kostet und was sie dir bringen kann.</p>
      <a class="btn btn--big" href="{root}#kontakt"><span>Projekt anfragen</span></a>
    </div>
  </section>

  <nav class="cs-pager container" aria-label="Weitere Case Studies">
    <a class="cs-pager__link" href="{root}projekte/{prev['slug']}.html" rel="prev"><small>← Vorherige</small><span>{e(prev['title'])}</span></a>
    <a class="cs-pager__link cs-pager__link--next" href="{root}projekte/{nxt['slug']}.html" rel="next"><small>Nächste →</small><span>{e(nxt['title'])}</span></a>
  </nav>
</main>
''' + foot(root)


open(os.path.join(ROOT, 'projekte.html'), 'w', encoding='utf-8').write(index_page())
for i, o in enumerate(DATA):
    open(os.path.join(ROOT, 'projekte', f'{o["slug"]}.html'), 'w', encoding='utf-8').write(case_page(o, i))
print(f'projekte.html + {N} Case Studies geschrieben ({PAGES} gebaute Seiten)')
