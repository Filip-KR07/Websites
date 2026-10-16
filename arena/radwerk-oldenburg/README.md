# Radwerk Oldenburg – Demo „Kette“

Demo-Website für einen **fiktiven** Fahrradladen mit Meisterwerkstatt in Oldenburg (Arena von Filip Kramar). Statisch, ohne Build, ohne externe Requests.

## Abschnitte
Header mit Scroll-Fortschritt · Hero mit Maßzeichnung · Laufband · Sortiment (horizontale Strecke) · Werkstatt + Preisliste · Bike-Explorer · Rahmengrößen-Rechner · E-Bike-Reichweite · Werkstatt-Termin · Team + Stellenanzeige · Stimmen · Standort/Kontakt mit SVG-Karte · FAQ · Footer. Dazu `impressum.html`, `datenschutz.html`.

## Spezial-Features
1. **Hero-Fahrrad (SVG):** Rahmen zeichnet sich beim Laden als Linie, Räder, Kurbel und Kette laufen gekoppelt ans Scrollen (Übersetzung 38/16).
2. **Rahmengrößen-Rechner:** Körpergröße, Schrittlänge, Radtyp → Rahmenhöhe (cm bzw. Zoll), Größe, Sattelhöhe, Proportions-Hinweis; Fahrer-Silhouette und Rad werden live neu konstruiert.
3. **E-Bike-Reichweite:** Akku, Modus, Gelände, Gewicht, Temperatur → Spanne in km, Skala und Ausflugsziele ab Laden.
4. **Werkstatt-Termin:** Paket + Extras → Tag/Slot → Angaben mit Zusammenfassung und Preis (Demo, nichts wird gesendet).
5. **Bike-Explorer:** Hotspots (Tabs, Pfeiltasten) für Schaltung, Bremse, Motor, Akku, Kette, Reifen mit Wartungstipps.

## Anpassen
- **Name, Telefon, Adresse:** in `index.html` (Header, Kontakt, Footer, JSON-LD), `impressum.html`, `datenschutz.html` suchen/ersetzen (`0441 555 87 30`, `+494415558730`, `Donnerschweer Straße 74`).
- **Farben/Schriften:** CSS-Variablen oben in `style.css` (`--asphalt`, `--chalk`, `--signal`, `--rost` …).
- **Bilder:** `assets/img/<name>-960.webp` und `-480.webp` ersetzen (gleiche Namen), Alt-Texte in `index.html` anpassen.
- **Rechner-Werte:** Konstanten oben in `main.js` – `FRAME` (Faktoren, Größentabellen), `RANGE` (Verbrauch je Modus, Gelände, Gewicht, Temperatur), `BOOKING` (Slots, Tage), `HOURS`. Werkstattpreise stehen zusätzlich als `data-price` an den Paketen in `index.html`.
- **Bike-Explorer-Texte:** Objekt `PARTS` in `main.js` (und Startinhalt im Panel in `index.html`).

## Lokal starten
```
cd /home/user/Websites && python3 -m http.server 8842
```
→ http://127.0.0.1:8842/arena/radwerk-oldenburg/ (`?motion=off` schaltet Animationen ab).

Bildnachweis: `assets/img/BILDNACHWEIS.md`. Schriften: `assets/fonts/LICENSE-*.txt` (SIL OFL).
