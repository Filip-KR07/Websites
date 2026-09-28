# ATEŞ Döner & Grill – Demo

Demo-Website für einen Dönerladen. Statisch, ohne Build-Schritt, ohne Bibliotheken:
`index.html` + `style.css` + `main.js`. Schriften (Bricolage Grotesque, Inter) liegen
selbst gehostet in `assets/fonts/` – keine Google-Fonts-Anfragen, DSGVO-freundlich.

```bash
cd doener && python3 -m http.server 8080   # → http://127.0.0.1:8080
```

## Hintergrundvideo auf der Startseite

Einfach die Dateien in `assets/video/` legen – kein Code ändern nötig:

| Datei | Pflicht | Wofür |
| --- | --- | --- |
| `hero.mp4` | ja | Hintergrundvideo (Desktop, und Fallback fürs Handy) |
| `hero-mobile.mp4` | optional | kleinere Version bis 767 px Breite, gern Hochformat |
| `hero-poster.jpg` | optional | Standbild, bis das Video lädt bzw. bei „Bewegung reduzieren“ |

Solange kein Video da ist, läuft eine animierte Glut als Hintergrund. Sobald `hero.mp4`
lädt, blendet das Video weich ein. Das Video läuft stumm in Schleife, pausiert, wenn
der Hero aus dem Bild gescrollt oder der Tab verlassen wird, und lässt sich über den
Pause-Knopf unten rechts anhalten.

Empfehlung: 10–20 Sekunden, ohne Ton, 1080p, möglichst unter 6 MB.

```bash
# Desktop (1920 px breit, ohne Ton, schnell startend)
ffmpeg -i original.mov -an -vf "scale=1920:-2" -c:v libx264 -crf 26 -preset slow -pix_fmt yuv420p -movflags +faststart assets/video/hero.mp4

# Handy (720 px breit)
ffmpeg -i original.mov -an -vf "scale=720:-2" -c:v libx264 -crf 28 -preset slow -pix_fmt yuv420p -movflags +faststart assets/video/hero-mobile.mp4

# Standbild aus dem ersten Frame
ffmpeg -i assets/video/hero.mp4 -frames:v 1 -q:v 3 assets/video/hero-poster.jpg
```

## Inhalte anpassen

- **Name, Adresse, Telefon:** in `index.html` nach `ATEŞ`, `Musterstraße` und `+4930123456789` suchen.
- **Öffnungszeiten:** zweimal pflegen – die Tabelle in `index.html` (Abschnitt „Besuch“)
  und `HOURS` oben in `main.js` (steuert den Live-Status „Geöffnet · bis …“).
- **Speisekarte:** Tabs und Gerichte im Abschnitt `#karte` in `index.html`.
- **Bewertungen, Zahlen, Texte:** alles Platzhalter, direkt im HTML.
- Vor dem Livegang: `<meta name="robots" content="noindex">` entfernen und Impressum/Datenschutz verlinken.

## Technik

- Mobil: `100svh`-Hero, Safe-Area-Abstände (Notch), keine Tap-Highlights, Hover nur bei Maus,
  Aktionsleiste „Route / Anrufen“ unten auf dem Handy.
- Bewegung: eigene Easing-Kurven, nur `transform`/`opacity`/`clip-path` animiert,
  Tab-Indikator per `clip-path`, Tastatur-Navigation in den Tabs ohne Animation.
- „Bewegung reduzieren“ im System: kein Autoplay, keine Laufband-/Partikel-Animation, nur sanfte Einblendungen.
