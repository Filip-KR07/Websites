# Raumlinie Architekten – Demo-Modell „Grundriss“

Demo-Website eines **fiktiven** Architekturbüros in Stuttgart (Arena von Filip Kramar). Statisch, ohne Build, ohne externe Requests.

## Gestaltungsidee
Die Seite ist eine **Planmappe**: Jede Sektion ist ein Blatt (A-01 bis A-12) mit Millimeterraster, Planrahmen samt Feldeinteilung (1–8 / A–F) und einem mitlaufenden Blattkopf am rechten Rand, der Blattnummer, Darstellung und Maßstab des gerade sichtbaren Kapitels zeigt. Statt Eyebrows und Kennzahlenreihen gibt es die Werkzeuge des Büros: Schriftfeld, Planstempel, Positionskreise, Stückliste, Maßketten, Höhenkoten. Kapitel wechseln wie eine Lichtpause – dunkle und blaue Blätter ziehen ihren Hintergrund beim Einscrollen von links auf. Die Bewegungs-Handschrift heißt „gezeichnet, nicht geschoben“: Erst entsteht die Linie (Plotter-Zug mit `--ease-in-out`), dann erscheint der Inhalt; nichts federt oder hüpft.

## Abschnitte
A-01 Hero (Zeichenbrett) · A-02 Leistungen (Legende) · A-03 Schnitt Bestand/Abbruch/Neubau · A-04 Projektindex (Planliste) · A-05 Grundriss-Explorer (Lichtpause) · A-06 Leistungsphasen als Bauzeitenplan · A-07 Kostenrahmen-Rechner · A-08 Büro mit Stückliste und Preis-Stempeln · A-09 Stimmen (Baustellenprotokolle) · A-10 Einzugsgebiet (SVG-Lageplan) · A-11 FAQ (Anmerkungen) · A-12 Kontakt (Planeingang) · Footer. Dazu `impressum.html`, `datenschutz.html`.

## Spezial-Features
1. **Hero-Zeichnung**: Das Haus zeichnet sich per SVG-Stroke selbst; beim Scrollen dreht es von der Südansicht in eine Axonometrie (echtes 3D-Linienmodell in `main.js`, Abschnitt `HAUS`), Bemaßungen erscheinen, das Schriftfeld zählt die Drehung mit. Unter der Headline misst eine Maßkette die Satzbreite in Millimetern; auf dem Desktop folgt ein Fadenkreuz mit Koordinaten dem Zeiger. Sticky-Bühne (kein GSAP-Pin).
2. **Schnitt A–A** (Sticky-Storytelling): Bestand zeichnet sich, der Dachstuhl wird gestrichelt zum Abbruch, zwei Holzbau-Geschosse wachsen in Blau darauf, zuletzt erscheinen Maßkette und Höhenkoten.
3. **Projektindex** mit Bildvorschau am Cursor (Desktop, Lerp + Neigung, Beschnittmarken) bzw. Wisch-Schiene mit Karten (Handy), Filter nach Bauaufgabe.
4. **Grundriss-Explorer** auf Lichtpause-Blau: Räume anklickbar/tastaturbedienbar (Pfeiltasten), m² und lichte Maße, der gewählte Raum bekommt eine eigene Maßkette; Ebenen Möblierung/Bemaßung/Achsraster schaltbar.
5. **Leistungsphasen 1–9 als Bauzeitenplan**: Tabs (Pfeiltasten, Home/End) mit Honoraranteilen nach HOAI 2021 § 34; eine Stichtag-Linie läuft beim Scrollen durch den Plan und füllt die Balken.
6. **Kostenrahmen-Rechner**: BGF × Ausbaustandard × Bauaufgabe → Spanne mit Ziffernrollen, klar als Orientierung gekennzeichnet; übernimmt das Ergebnis ins Kontaktformular.
7. Mikro-Interaktionen: Zeichen-Rollen in Navigation und Haupt-Buttons, magnetische Buttons (nur feiner Zeiger), Unterstreichungen, die sich zeichnen, Planstempel bei Preisen und nach dem Absenden.

## Motion-System
Tokens in `style.css` unter `:root`: `--ease-out`, `--ease-in-out` (Plotter-Zug), `--ease-drawer`, `--t-press` 140 ms, `--t-ui` 220 ms, `--t-line` 900 ms, `--t-wipe` 1000 ms, `--t-plan` 1400 ms, `--stagger` 55 ms. Reveal-Varianten: `data-reveal="wipe"` (Maskenzug von links), `"line"` (erst Linie, dann Inhalt), `"plan"`, `"stamp"`. `?motion=off` schaltet alles ab, `prefers-reduced-motion` ersetzt Bewegung durch weiche Einblendungen.

## Anpassen
- **Name, Telefon, Adresse**: in `index.html`, `impressum.html`, `datenschutz.html` (Suche nach „0711“ bzw. „Rotebühl“) und im JSON-LD im `<head>`.
- **Farben/Schriften**: CSS-Variablen in `style.css` unter `:root` (`--beton`, `--graphit`, `--blau` …); Blatt-Töne über die Klassen `.tone-paper`, `.tone-dark`, `.tone-blue`.
- **Blattköpfe**: `data-sheet`, `data-sheet-t`, `data-sheet-m` an jeder `<section>`.
- **Bilder**: `assets/img/<name>-960.webp` + `-480.webp` ersetzen (gleiche Namen), Herkunft siehe `assets/img/BILDNACHWEIS.md`.
- **Rechner-Werte**: Konstanten `KOSTEN`, `NEBENKOSTEN`, `RUNDUNG` ganz oben in `main.js`; Zeitachse des Bauzeitenplans `BZ_MONATE`, Balken über `--s` (Start) und `--d` (Dauer, Monate) im HTML.
- **Grundriss/Hero-Haus/Schnitt**: Die SVGs liegen direkt in `index.html`; Raumdaten stehen als `data-*`-Attribute an den `.room`-Elementen.

## Lokal starten
```
cd /home/user/Websites && python3 -m http.server 8823
# http://127.0.0.1:8823/arena/architektur-raumlinie/
```
Schriften: Schibsted Grotesk, JetBrains Mono (SIL OFL, selbst gehostet, Lizenzen in `assets/fonts/`).
