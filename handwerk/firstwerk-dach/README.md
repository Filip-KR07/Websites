# FIRSTWERK – Dach & Holzbau · Demo-Modell „Kante“

Demo-Website für einen **fiktiven** Dachdecker- und Zimmerei-Meisterbetrieb in Hamburg.
Designsprache „Kante“: Swiss/Brutalist, harte Raster, Versal-Headlines in schmaler Archivo,
technische Labels in JetBrains Mono, Signal-Orange als sparsamer Akzent – und die Dachneigung
als wiederkehrendes Motiv. Statisch, ohne Build-Schritt, ohne externe Requests.

## Dateien

| Datei | Inhalt |
|---|---|
| `index.html` | One-Pager mit allen Abschnitten, JSON-LD (`RoofingContractor`) |
| `style.css` | Gesamtes Styling, Farben/Schriften/Abstände als CSS-Variablen in `:root` |
| `main.js` | Interaktionen (Vanilla JS + GSAP/ScrollTrigger + Lenis aus `assets/vendor/`) |
| `impressum.html`, `datenschutz.html` | Muster-Rechtstexte im Stil der Seite |
| `favicon.svg` | Firstlinie + Firstbalken |
| `assets/img/` | Fotos (`-480`/`-960.webp`), siehe `assets/img/BILDNACHWEIS.md` |
| `assets/fonts/` | Archivo (variabel, `wght` + `wdth`), JetBrains Mono – selbst gehostet |

## Abschnitte

Hero „Giebel“ · Laufband im Dachwinkel · Leistungen (7 Karten) · Dach-Konfigurator ·
Vorher/Nachher · Dach-Check · Projekte · Sturmschaden-Notdienst · Zahlen · Ablauf ·
Betrieb/Team · Kundenstimmen · Einzugsgebiet (SVG-Karte + PLZ-Check) · Karriere · FAQ ·
Anfrage-Assistent (4 Schritte) · Footer. Auf dem Handy: feste Aktionsleiste „Anrufen / Anfrage“.

## Spezial-Features

1. **Hero „Giebel“** – Foto in einer giebelförmigen `clip-path`-Maske, die sich beim Scrollen
   (gepinnt, Scrub) zu einem breiten Rahmen öffnet. Bemaßung (Breite, Höhe, Neigungsbogen) und die
   Mono-Anzeige „Neigung 45,0°“ rechnen live mit.
2. **Laufband im Dachwinkel** – zwei Bänder treffen sich als Dachfirst (16°); der Text läuft über
   den First weiter und wird beim Scrollen schneller.
3. **Leistungen als Karten-Stapel** – Desktop: Sticky-Stacking mit Nummern 01–07 und technischen
   Detailzeichnungen (Inline-SVG, Positionsnummern + Legende). Handy/Tablet: Wisch-Deck mit
   Scroll-Snap, Zähler „01 / 07“, Fortschrittsbalken und Pfeil-Buttons (ohne JS: normale Liste).
4. **Dach-Konfigurator** – 5 Dachformen × 5 Eindeckungen. Das Haus ist ein echtes 3D-Modell
   (isometrisch projiziert), die Punkte werden weich interpoliert; die Eindeckung ist ein SVG-Muster,
   das perspektivisch auf jede Dachfläche gelegt wird. Steckbrief mit Neigung, Lebensdauer, Gewicht,
   Pflege, Preisniveau und Plausibilitätsprüfung („Tonziegel auf Flachdach geht nicht“).
   Tastaturbedienbar (Radiogruppen, Pfeiltasten). „Diese Kombination anfragen“ füllt die Anfrage vor.
5. **Vorher/Nachher-Slider** – `clip-path: inset()`, Pointer-Capture, Pfeiltasten/Home/End,
   `role="slider"` mit `aria-valuenow`/`aria-valuetext`.
6. **Dach-Check** – 5 Fragen → Empfehlung (Inspektion / Reparatur / Sanierung + Dämmung) mit
   Begründung; „Termin für Dach-Check“ übernimmt das Ergebnis in den Anfrage-Assistenten.
7. **Projektliste** – Desktop: große Typo-Zeilen, das Bild folgt dem Cursor mit Feder (Giebelmaske);
   Handy: Karten mit Bild.
8. **Notdienst-Band** mit Regen-Canvas (pausiert außerhalb des Viewports / bei verstecktem Tab).

Ohne JavaScript, bei `prefers-reduced-motion` und mit `?motion=off` bleibt alles sichtbar und
bedienbar (der Konfigurator zeigt dann ein statisches Satteldach, der Assistent alle Felder).

## Anpassen

- **Name, Adresse, Telefon, E-Mail:** in `index.html` (inkl. JSON-LD im `<head>`), `impressum.html`
  und `datenschutz.html` suchen/ersetzen, z. B. `FIRSTWERK`, `040 765 432 10`, `+494076543210`,
  `moin@firstwerk-dach.de`, `Am Firstbalken 3`. Der Notdienst steht als `040 765 432 19` /
  `+494076543219` im Header, Menü, Notdienst-Band, FAQ und Footer.
- **Farben:** `:root` in `style.css` – `--c-orange` (Akzent), `--c-bg` (Beton-Weiß),
  `--c-ink` (Fast-Schwarz), `--c-graphite`, `--c-line`. Die Materialfarben des Konfigurators
  stehen als `<pattern id="mat-…">` oben in `index.html`.
- **Schriften:** `@font-face` am Anfang von `style.css`; Breite der Headlines über `font-stretch`
  (62 % = sehr schmal).
- **Bilder:** gleiche Dateinamen in `assets/img/` ersetzen (jeweils `-480` und `-960.webp`,
  max. 960 px breit) oder `src`/`srcset`/`width`/`height`/`alt` im HTML anpassen.
- **Konfigurator-Daten** (Steckbrief, Kombinationen): Objekte `SHAPES`, `MATS`, `FIT` in `main.js`.
- **Dach-Check-Logik:** Funktion `finish()` in `initQuiz()` (`main.js`).
- **Pfade:** Alle Links auf Dateien sind absolut (`/handwerk/firstwerk-dach/…`), damit die Seite
  auf Vercel mit `cleanUrls`/`trailingSlash: false` auch ohne Schrägstrich am Ende funktioniert.
  Wird der Ordner verschoben, diese Pfade per Suchen/Ersetzen anpassen.

## Lokal starten

```bash
cd /home/user/Websites
python3 -m http.server 8773
# → http://127.0.0.1:8773/handwerk/firstwerk-dach/
# Animationen aus: http://127.0.0.1:8773/handwerk/firstwerk-dach/?motion=off
```

## Hinweise

- Fiktiver Betrieb: Alle Namen, Zahlen, Preise und Bewertungen sind erfunden.
  `<meta name="robots" content="noindex">` ist gesetzt.
- Formulare senden nichts (kein Backend) – nach dem Absenden erscheint eine Zusammenfassung mit
  dem Hinweis „Demo – es wurde nichts gesendet“.
- Bildquellen und Lizenz: `assets/img/BILDNACHWEIS.md` (StockSnap, CC0).
