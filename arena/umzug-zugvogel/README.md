# Zugvogel Umzüge – Modell „Etappe“

Demo-Website eines **fiktiven** Umzugsunternehmens aus Hannover (Arena-Demo von Filip Kramar). Statisch, ohne Build-Schritt, ohne externe Requests. Designsprache: Marine, Signalorange, Karton, Packband-Markierungen, isometrische Grafik; Schriften Archivo (Breiten-Achse) und IBM Plex Mono, selbst gehostet.

## Abschnitte
Header mit Packband-Scrollfortschritt · Hero mit isometrischer Szene · Packband-Laufband · Leistungen (7) · Volumenrechner · Kostenschätzung · Ablauf in 4 Etappen · Checkliste · Über uns, Fuhrpark und Team · Kundenstimmen · Einsatzgebiet (SVG-Karte) · FAQ · Anfrageformular · Footer. Dazu `impressum.html` und `datenschutz.html` (Muster).

## Spezial-Features
1. **Hero-Szene** (Inline-SVG, erzeugt aus isometrischen Koordinaten): drei Kartons fallen auf ein Rollbrett, fahren über die Rampe in den LKW, das Rolltor schließt, die Route zeichnet sich. Reine CSS-Animation, einmalig, danach ruhig; „Noch mal beladen“ spielt sie erneut ab. Ohne JS bzw. bei reduzierter Bewegung steht das Standbild (Kartons vor dem offenen LKW).
2. **Volumenrechner**: Räume als Tabs (Pfeiltasten), Möbel per Stepper → m³, LKW-Empfehlung, Laderaum füllt sich Karton für Karton.
3. **Kostenschätzung**: Volumen (übernimmt den Rechnerwert), Entfernung, Etagen/Aufzug, Packservice, Halteverbot → Preisspanne als unverbindliche Beispielrechnung mit Positionen.
4. **Checkliste** von 8 Wochen vorher bis 1 Woche danach, abhakbar, Fortschritt und Umzugsdatum in `localStorage` (`zugvogel-checkliste-v1`), Termine werden aus dem Datum berechnet.
5. **Ablauf in 4 Etappen**: ab 900 px horizontale Strecke per `position: sticky` + ScrollTrigger-Scrub (kein Pin), Routenleiste mit fahrendem LKW; mobil vertikale Zeitleiste.

## Anpassen
- **Name, Telefon, Adresse, Zeiten**: in `index.html`, `impressum.html`, `datenschutz.html` (Suche nach „Zugvogel“, „0511“, „Vahrenwalder“) und im JSON-LD im `<head>`.
- **Farben/Schriften/Easing**: CSS-Variablen oben in `style.css` (`--navy`, `--orange`, `--karton` …). Die Hero-Szene nutzt feste Farbwerte; sie wird mit dem Generator-Skript (Python, Arbeitsordner) neu erzeugt oder direkt im SVG ersetzt.
- **Bilder**: `assets/img/<name>-960.webp` und `-480.webp` austauschen (gleiche Namen), Alt-Texte in `index.html` anpassen. Quellen: `assets/img/BILDNACHWEIS.md`.
- **Rechner-Werte**: Konstanten ganz oben in `main.js` – `RAEUME` (m³ je Möbelstück, Voreinstellung), `LKW` (Laderaum je Klasse), `KOSTEN` (Stundensatz, km-Satz, Etagen, Packservice, Halteverbot, Spanne).

## Lokal starten
```
cd /home/user/Websites && python3 -m http.server 8822
# http://127.0.0.1:8822/arena/umzug-zugvogel/   (?motion=off schaltet Animationen ab)
```
