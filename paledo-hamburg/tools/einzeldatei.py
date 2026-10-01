#!/usr/bin/env python3
"""Baut die Paledo-Seite als EINE HTML-Datei (zum Verschicken per Mail).

Schriften, Bilder, CSS und JavaScript (inkl. GSAP/Lenis) werden eingebettet. Die Datei läuft per Doppelklick
im Browser, ohne Internet, mit allen Animationen. Pro Bild wird nur eine Größe eingebettet (kein srcset).
Links, die in einer Einzeldatei nicht funktionieren (Sprachwechsel, Impressum, Datenschutz, „Bowl teilen“),
werden entfernt bzw. auf die Online-Vorschau umgebogen.

Aufruf aus dem Repo-Root:  python3 paledo-hamburg/tools/einzeldatei.py [ZIELORDNER]
Ergebnis: paledo-hamburg-de.html und paledo-hamburg-en.html im Zielordner (Standard: paledo-hamburg/dist/).
"""
import base64
import pathlib
import re
import sys

ORDNER = pathlib.Path(__file__).resolve().parent.parent
ZIEL = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ORDNER / 'dist'
ONLINE = 'https://filip-kr07.github.io/Websites/paledo-hamburg/'
TYP = {'.webp': 'image/webp', '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.png': 'image/png'}


def data_uri(pfad):
    datei = ORDNER / pfad
    return f'data:{TYP[datei.suffix]};base64,' + base64.b64encode(datei.read_bytes()).decode()


def bauen(quelle, ziel):
    html = (ORDNER / quelle).read_text(encoding='utf-8')

    # CSS mit eingebetteten Schriften
    css = (ORDNER / 'css/style.css').read_text(encoding='utf-8')
    css = re.sub(r'url\(\.\./(fonts/[^)]+)\)', lambda m: f'url({data_uri(m.group(1))})', css)
    html = re.sub(r'<link rel="stylesheet" href="css/style\.css[^"]*">', lambda m: f'<style>\n{css}\n</style>', html)

    # Vorladen und Sprach-Alternativen braucht die Einzeldatei nicht
    html = re.sub(r'<link rel="(preload|alternate)"[^>]*>\n?', '', html)

    # Bilder: srcset entfernen (eine Größe reicht), dann alle img/…-Pfade einbetten
    html = re.sub(r'\s+srcset="img/[^"]*,[^"]*"', '', html)        # nur mehrteilige srcset, die einteiligen <source> bleiben
    html = re.sub(r'\s+sizes="[^"]*"', '', html)
    html = re.sub(r'(?<=["\s])img/[\w.-]+\.(?:webp|jpg|png)', lambda m: data_uri(m.group(0)), html)

    # Was in einer Datei nicht geht: Sprachwechsel und Teilen raus, Rechtstexte online verlinken
    html = re.sub(r'\s*<a class="nav__sprache"[^>]*>[^<]*</a>', '', html)
    html = re.sub(r'\s*<p><a href="(?:en|index)\.html"[^>]*>[^<]*</a></p>', '', html)
    html = re.sub(r'\s*<button class="knopf" type="button" data-teilen hidden>.*?</button>', '', html, flags=re.S)
    html = html.replace('href="impressum.html"', f'href="{ONLINE}impressum.html"')
    html = html.replace('href="datenschutz.html"', f'href="{ONLINE}datenschutz.html"')

    # JavaScript einbetten (Reihenfolge wie im Original, am Ende von <body>, daher ohne defer)
    def skript(m):
        code = (ORDNER / m.group(1)).read_text(encoding='utf-8').replace('</script', '<\\/script')
        return f'<script>\n{code}\n</script>'
    html = re.sub(r'<script src="([^"?]+)(?:\?[^"]*)?" defer></script>', skript, html)

    rest = re.findall(r'(?:src|href)="(?!data:|https?:|mailto:|tel:|#)[^"]+"', html)
    if rest:
        raise SystemExit(f'{quelle}: nicht eingebettete Verweise: {rest[:5]}')
    ZIEL.mkdir(parents=True, exist_ok=True)
    (ZIEL / ziel).write_text(html, encoding='utf-8')
    print(f'{ziel}: {len(html.encode()) / 1024 / 1024:.1f} MB')


bauen('index.html', 'paledo-hamburg-de.html')
bauen('en.html', 'paledo-hamburg-en.html')
