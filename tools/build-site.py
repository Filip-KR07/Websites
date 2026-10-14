#!/usr/bin/env python3
"""Baut die komplette Website fuer GitHub Pages (oder einen anderen statischen Host) zusammen.

Die persoenliche Website liegt in diesem Branch. Die Demo-Websites, auf die die Case Studies
verweisen, liegen in eigenen Branches desselben Repos. Dieses Skript kopiert alles in einen
Ordner:

  /                    persoenliche Website (dieser Checkout)
  /arena/, /handwerk/  claude/zen-bardeen-wy4yel      (absolute Pfade, werden auf BASE umgeschrieben)
  /tank-treff-hamburg/ claude/peaceful-goldberg-e9in4f
  /paledo-hamburg/     claude/paledo-hamburg
  /jeffs-cakes/        claude/jeffs-cakes
  /koez-firat/         claude/zen-noether-yzkyng
  /physio-mk/          claude/compassionate-galileo-x8foz6
  /doener/             claude/donerladen-demo-skills-a6i50k
  /restaurant/, /restaurant-arena/   claude/nice-noether-t2ji5a (arena/ heisst hier restaurant-arena/)

Aufruf: build-site.py <checkout> <branches-ordner> <ziel> [<basis-pfad, z. B. /Websites>]
<branches-ordner> enthaelt je Branch einen Unterordner mit dem Branch-Namen (ohne "claude/").
"""
import os
import re
import shutil
import sys

checkout, branches, dst = sys.argv[1:4]
base = (sys.argv[4] if len(sys.argv) > 4 else '').rstrip('/')

DEMOS = [
    # (branch, quellordner, zielordner, absolute Pfade umschreiben?)
    ('zen-bardeen-wy4yel', 'arena', 'arena', True),
    ('zen-bardeen-wy4yel', 'handwerk', 'handwerk', True),
    ('peaceful-goldberg-e9in4f', 'tank-treff-hamburg', 'tank-treff-hamburg', False),
    ('paledo-hamburg', 'paledo-hamburg', 'paledo-hamburg', False),
    ('jeffs-cakes', 'jeffs-cakes', 'jeffs-cakes', False),
    ('zen-noether-yzkyng', 'koez-firat', 'koez-firat', False),
    ('compassionate-galileo-x8foz6', 'physio-mk', 'physio-mk', False),
    ('donerladen-demo-skills-a6i50k', 'doener', 'doener', False),
    ('nice-noether-t2ji5a', 'restaurant', 'restaurant', False),
    ('nice-noether-t2ji5a', 'arena', 'restaurant-arena', False),
]
SKIP_ROOT = {'.git', '.github', '.claude', '.vercel', 'node_modules', 'tools', '_site', 'README.md',
             'CONTENT-CHECKLIST.md', '.gitignore', '.vercelignore', '.DS_Store'}
MD = shutil.ignore_patterns('README.md', 'BILDNACHWEIS.md', 'NOTIZ.md', '*.md', '.DS_Store', 'tools')

if os.path.exists(dst):
    shutil.rmtree(dst)
os.makedirs(dst)

# 1. Persoenliche Website an die Wurzel
for name in os.listdir(checkout):
    if name in SKIP_ROOT:
        continue
    src = os.path.join(checkout, name)
    if os.path.isdir(src):
        shutil.copytree(src, os.path.join(dst, name), ignore=MD)
    else:
        shutil.copy2(src, dst)

# 2. Demos aus den Branches
missing = []
for branch, folder, target, rewrite in DEMOS:
    src = os.path.join(branches, branch, folder)
    if not os.path.isdir(src):
        missing.append(f'{branch}/{folder}')
        continue
    out = os.path.join(dst, target)
    shutil.copytree(src, out, ignore=MD)
    if not rewrite:
        continue
    # Die Arena-Demos nutzen absolute Pfade (/arena/..., /handwerk/...); unter einem Unterpfad
    # (GitHub Pages: /Websites/) bekommen sie das Praefix. Die Uebersichtsseiten verweisen auf
    # Schriften, Favicon und Kontakt der Startseite, die jetzt an der Wurzel liegt.
    overview = os.path.join(out, 'index.html')
    for root, _, files in os.walk(out):
        for name in files:
            if not name.endswith(('.html', '.css', '.js')):
                continue
            path = os.path.join(root, name)
            text = open(path, encoding='utf-8').read()
            new = re.sub(r'(?<![\w.-])/(handwerk|arena)/', base + r'/\1/', text)
            if path == overview:
                new = new.replace('"/assets/fonts/', f'"{base}/assets/fonts/')
                new = new.replace('href="/favicon.svg"', f'href="{base}/favicon.svg"')
                new = new.replace('href="/#kontakt"', f'href="{base}/#kontakt"')
                new = new.replace('href="/impressum"', f'href="{base}/impressum.html"')
                new = new.replace('href="/datenschutz"', f'href="{base}/datenschutz.html"')
                new = new.replace('href="/"', f'href="{base}/"')
            if new != text:
                open(path, 'w', encoding='utf-8').write(new)

open(os.path.join(dst, '.nojekyll'), 'w').close()
print('Seite gebaut in', dst, '| Demos:', len(DEMOS) - len(missing), 'von', len(DEMOS))
if missing:
    print('FEHLT:', *missing, sep='\n  ')
    sys.exit(1)
