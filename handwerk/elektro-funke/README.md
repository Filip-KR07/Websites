# Modell „Impuls“ – Funke Elektrotechnik (Demo)

Demo-Website für einen **fiktiven** Elektro-Meisterbetrieb aus Leipzig. Dunkel, technisch, präzise:
Raster- und Messlinien, Monospace-Labels, Glas-Panels, ein sparsames Spannungsgelb als Akzent.
Statisch (HTML, CSS, JS), ohne Build-Schritt, ohne externe Anfragen, ohne Cookies.

## Dateien

| Datei | Inhalt |
|---|---|
| `index.html` | Startseite mit allen Abschnitten, JSON-LD (`Electrician` + `FAQPage`) |
| `style.css` | Gestaltung; alle Farben, Schriften, Easing-Kurven als CSS-Variablen in `:root` |
| `main.js` | Interaktionen (Canvas, PV-Rechner, Lichtschalter, Smart Home, Filter, Formulare, Scroll) |
| `impressum.html`, `datenschutz.html` | Muster-Rechtstexte im Stil der Seite |
| `favicon.svg` | Funke-/Blitz-Zeichen |
| `assets/` | Fotos (`img/`, siehe `img/BILDNACHWEIS.md`), Schriften (`fonts/`), GSAP/ScrollTrigger/Lenis (`vendor/`) |

## Abschnitte

Hero · Ticker (Normen/Systeme) · Leistungen (9 „Stromkreise“) · Zahlen · PV-Rechner · Lichtplanung ·
Smart Home · Referenzen · Notdienst-Band · Ablauf · Über uns/Team · Kundenstimmen · Einzugsgebiet ·
Karriere mit Kurzbewerbung · FAQ · Anfrage-Assistent (4 Schritte) · Footer. Auf dem Handy: feste
Aktionsleiste unten (Anrufen · Notdienst · Anfrage).

## Spezial-Features

1. **Stromfluss-Canvas im Hero** – generative Leiterbahnen im Raster, Lichtimpulse laufen darüber.
   Der Mauszeiger zieht einen Lichtkegel nach (Lerp), Impulse in der Nähe werden heller und schneller.
   Auf Touch-Geräten läuft eine ruhige Automatik (30 fps). Pausiert außerhalb des Sichtbereichs.
   Raster und Bahnen liegen auf einem eigenen, nur bei Größenänderung gezeichneten Canvas; pro Frame
   werden nur Impulse und Lichtkegel gezeichnet (der weiche Kegel ist ein komponiertes `div`).
   Headline „Strom, der mitdenkt.“ blendet wie eine anlaufende Leuchte ein (kein Flackern).
   Status-Pillen: Notdienst immer erreichbar, Büro geöffnet/geschlossen nach Uhrzeit (Europe/Berlin).
2. **PV-Rechner** – Dachfläche, Ausrichtung, Verbrauch (mit Haushalts-Vorgaben), Speicher, Strompreis.
   Rollende Ziffern, Monatsdiagramm (SVG) mit Hover-Werten, Ergebnis per Knopf in den Anfrage-Assistenten.
   Alle Richtwerte stehen dokumentiert als Konstanten oben im Abschnitt `PV` in `main.js`.
3. **Lichtschalter** – großer Schalter (`aria-pressed`), der den Raum per kreisförmigem
   `clip-path` vom Schalter aus „einschaltet“ – oder von der Stelle, an der man ins Zimmer tippt.
   Bei reduzierter Bewegung: weicher Crossfade. Messwerte per Container Query 4- oder 2-spaltig.
4. **Smart-Home-Panel** – Licht + Dimmer, Rollläden, Heizung, Wallbox mit Ladering, drei Szenen.
   Komplett per Tastatur bedienbar, Änderungen werden für Screenreader angesagt.
5. **Leistungen als Schaltplan** – Raster mit Spotlight-Rand, der dem Zeiger folgt; Linien-Icons
   zeichnen sich beim Einblenden und Hovern. Auf dem Handy eine klare Liste.
6. **Referenzen-Filter** – Photovoltaik / Smart Home / Sanierung / Gewerbe mit FLIP-Animation (WAAPI).
   Auf dem Handy eine wischbare Leiste (Scroll-Snap) mit Fortschrittslinie (Scroll-driven Animation,
   JS-Ersatz für ältere Browser).
7. Außerdem: gepinnter Ablauf, durch den „Strom fließt“ (Desktop), Zähler, Einzugsgebiets-Karte als SVG,
   Kurzbewerbung „in 60 Sekunden“, mehrstufiger Assistent mit Validierung und Zusammenfassung,
   Footer-Schriftzug, der beim Hineinscrollen „einschaltet“ (Scroll-driven Animation).

Animationen abschalten: `?motion=off` an die Adresse hängen (oder System-Einstellung „Bewegung reduzieren“).
Ohne JavaScript sind alle Inhalte sichtbar.

## Anpassen für einen echten Betrieb

- **Name, Telefon, Adresse, E-Mail:** in `index.html`, `impressum.html`, `datenschutz.html` suchen &
  ersetzen (z. B. „Funke“, „0341 987 65 4“, „+49341987654“, „Kabelstraße 12“, „funke-elektro.de“).
  JSON-LD im `<head>` von `index.html` mitpflegen (Adresse, Geo-Koordinaten, Öffnungszeiten, `areaServed`).
- **Öffnungszeiten:** Text in `index.html` und die Konstanten `OPEN_MIN` / `CLOSE_MIN` in `main.js`
  (steuern die Pille „Büro geöffnet/geschlossen“).
- **Farben:** `:root` in `style.css` – v. a. `--volt` (Akzent), `--blue` (Zweitakzent), `--bg`, `--surface`,
  `--text`, `--muted`. Die Farben im Canvas stehen in `main.js` (`RGB`, Abschnitt 7).
- **Schriften:** `@font-face` oben in `style.css`, Variablen `--f-display`, `--f-body`, `--f-mono`.
- **Bilder:** in `assets/img/` je zwei Breiten ablegen (`name-480.webp`, `name-960.webp`) und in
  `index.html` `src`, `srcset`, `width`/`height` und den deutschen `alt`-Text anpassen.
  Die Fotos sind nur Platzhalter (CC0, StockSnap) – für Kunden immer echte Fotos verwenden.
- **PV-Richtwerte:** Konstanten `PV` in `main.js` (Ertrag je Ausrichtung, Eigenverbrauch, Vergütung,
  Kosten, CO₂-Faktor, Monatsverteilung). Die Texte unter „Annahmen anzeigen“ in `index.html` mitändern.
- **Einzugsgebiet:** Orte als SVG in `index.html` (Abschnitt „Einzugsgebiet“, Maßstab ≈ 7,4 Einheiten je km),
  Entfernungen/Anfahrtszeiten im Objekt `TOWNS` in `main.js`.
- **Pfade:** Alle Verweise sind absolut auf `/handwerk/elektro-funke/` gesetzt (wegen `trailingSlash: false`
  in `vercel.json`). Beim Umzug in einen anderen Ordner diesen Präfix suchen & ersetzen.
- **Vor dem Livegang:** `noindex` entfernen, Impressum/Datenschutz mit echten Angaben ersetzen,
  Formulare an einen Dienst anbinden (es wird aktuell nichts gesendet) und in der Datenschutzerklärung beschreiben.

## Lokal starten

```bash
cd /pfad/zum/repo          # Repo-Wurzel
python3 -m http.server 8772
# → http://127.0.0.1:8772/handwerk/elektro-funke/
```

## Bildnachweis

Siehe `assets/img/BILDNACHWEIS.md` (alle Fotos CC0 von StockSnap.io). Schriften: SIL Open Font License
(Lizenzdateien in `assets/fonts/`). GSAP 3.13 (kostenlose Standardlizenz), Lenis (MIT).
