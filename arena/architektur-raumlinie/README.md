# Raumlinie Architekten – Demo-Modell „Grundriss“

Demo-Website eines **fiktiven** Architekturbüros in Stuttgart (Arena von Filip Kramar). Statisch, ohne Build, ohne externe Requests.

## Abschnitte
Hero (Linienzeichnung) · Leistungen · Projektindex · Grundriss-Explorer · Leistungsphasen 1–9 (HOAI) · Kostenrahmen-Rechner · Büro/Team · Stimmen · Einzugsgebiet (SVG-Karte) · FAQ · Kontakt · Footer. Dazu `impressum.html`, `datenschutz.html`.

## Spezial-Features
1. **Hero-Zeichnung**: Das Haus zeichnet sich per SVG-Stroke selbst; beim Scrollen dreht es von der Südansicht in eine Axonometrie (echtes 3D-Linienmodell in `main.js`, Abschnitt `HAUS`), Bemaßungen erscheinen. Desktop: Sticky-Bühne (kein GSAP-Pin).
2. **Projektindex** mit Bildvorschau am Cursor (Desktop, Feder/Lerp) bzw. Karten/Wisch-Schiene (Handy), Filter nach Bauaufgabe.
3. **Grundriss-Explorer**: Räume anklickbar/tastaturbedienbar (Pfeiltasten), m² und lichte Maße, Ebenen Möblierung/Bemaßung/Achsraster schaltbar.
4. **Leistungsphasen** als Tabs (Pfeiltasten, Home/End) mit Honoraranteilen nach HOAI 2021 § 34.
5. **Kostenrahmen-Rechner**: BGF × Ausbaustandard × Bauaufgabe → Spanne, klar als Orientierung gekennzeichnet; übernimmt das Ergebnis ins Kontaktformular.

## Anpassen
- **Name, Telefon, Adresse**: in `index.html`, `impressum.html`, `datenschutz.html` (Suche nach „0711“ bzw. „Rotebühl“) und im JSON-LD im `<head>`.
- **Farben/Schriften**: CSS-Variablen in `style.css` unter `:root` (`--beton`, `--graphit`, `--blau` …).
- **Bilder**: `assets/img/<name>-960.webp` + `-480.webp` ersetzen (gleiche Namen), Herkunft siehe `assets/img/BILDNACHWEIS.md`.
- **Rechner-Werte**: Konstanten `KOSTEN`, `NEBENKOSTEN`, `RUNDUNG` ganz oben in `main.js`.
- **Grundriss/Hero-Haus**: Die SVGs wurden aus einem kleinen Generator erzeugt; Raumdaten stehen als `data-*`-Attribute an den `.room`-Elementen in `index.html`.
- `?motion=off` schaltet alle Animationen ab; `prefers-reduced-motion` wird beachtet.

## Lokal starten
```
cd /home/user/Websites && python3 -m http.server 8823
# http://127.0.0.1:8823/arena/architektur-raumlinie/
```
Schriften: Schibsted Grotesk, JetBrains Mono (SIL OFL, selbst gehostet, Lizenzen in `assets/fonts/`).
