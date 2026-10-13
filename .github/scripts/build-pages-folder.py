#!/usr/bin/env python3
"""Kopiert einen Demo-Ordner (handwerk/ oder arena/) fuer GitHub Pages und passt die Pfade an.

Die Demos verwenden absolute Pfade (/handwerk/..., /arena/...), weil Vercel mit trailingSlash:false
relative Pfade bricht. GitHub Pages liegt aber unter einem Unterpfad (/Websites/),
deshalb wird hier beim Bauen das Praefix davorgesetzt.

Aufruf: build-pages-folder.py <repo-checkout> <ordner> <ziel, z. B. _site/arena> <basis, z. B. /Websites>
"""
import os
import re
import shutil
import sys

repo, folder, dst, base = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4].rstrip("/")
FILIP = "https://filipkramar.de"
DEMO_ROOTS = r"(handwerk|arena)"

shutil.copytree(os.path.join(repo, folder), dst,
                ignore=shutil.ignore_patterns("README.md", "BILDNACHWEIS.md"))

# Die Uebersichtsseite nutzt Schriften und Favicon von filipkramar.de (Repo-Wurzel) - mitnehmen
fonts = os.path.join(dst, "assets", "fonts")
os.makedirs(fonts, exist_ok=True)
for name in ("cormorant-garamond-400-latin.woff2", "cormorant-garamond-400-italic-latin.woff2", "inter-400-latin.woff2"):
    shutil.copy(os.path.join(repo, "assets", "fonts", name), fonts)
shutil.copy(os.path.join(repo, "favicon.svg"), os.path.join(dst, "favicon.svg"))

overview = os.path.join(dst, "index.html")
changed = 0
for root, _, files in os.walk(dst):
    for name in files:
        if not name.endswith((".html", ".css", ".js")):
            continue
        path = os.path.join(root, name)
        text = open(path, encoding="utf-8").read()
        new = re.sub(r"(?<![\w.-])/" + DEMO_ROOTS + "/", base + r"/\1/", text)
        if path == overview:
            new = new.replace('"/assets/fonts/', f'"{base}/{folder}/assets/fonts/')
            new = new.replace('href="/favicon.svg"', f'href="{base}/{folder}/favicon.svg"')
            for page in ("#kontakt", "impressum", "datenschutz"):
                new = new.replace(f'href="/{page}"', f'href="{FILIP}/{page}"')
            new = new.replace('href="/"', f'href="{FILIP}/"')
        if os.path.dirname(path) == os.path.join(dst, "assets") and name.endswith(".css"):
            new = new.replace("../../assets/fonts/", "fonts/")
        if new != text:
            open(path, "w", encoding="utf-8").write(new)
            changed += 1

# Kontrolle: kein Pfad darf mehr auf die Wurzel der Pages-Domain zeigen
leftovers = []
for root, _, files in os.walk(dst):
    for name in files:
        if name.endswith((".html", ".css")):
            text = open(os.path.join(root, name), encoding="utf-8").read()
            for ref in re.findall(r'(?:href|src)="(/[^"]*)"|url\(["\']?(/[^)"\']+)', text):
                ref = ref[0] or ref[1]
                if not ref.startswith(base + "/"):
                    leftovers.append(f"{os.path.relpath(os.path.join(root, name), dst)}: {ref}")
print(f"{folder}: {changed} Dateien angepasst")
if leftovers:
    print("Pfade ausserhalb von", base, ":", *leftovers, sep="\n  ")
    sys.exit(1)
