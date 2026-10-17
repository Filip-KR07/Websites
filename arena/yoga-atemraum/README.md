# Atemraum Yoga – Demo „Atem“

Demo-Website für ein **fiktives** Yogastudio am Stadthafen Münster (Hafenweg 26). Teil der „Arena“ von Filip Kramar. Alle Namen, Kurse, Preise, Bewertungen und freien Plätze sind erfunden, die Seite steht auf `noindex`.

Designsprache: organisch, ruhig, geerdet – Salbei `#A9B8A2`, Sand `#EDE6DA`, Lehm `#B9826A`, Waldgrün `#26332B`. Display-Schrift Gloock (weiche Serifen), Text und kinetische Typografie in Outfit (variabel, Gewichtsachse 100–900).

## Gestaltungsidee
Der Atem ist das Bewegungsgesetz der ganzen Seite. Im Hero atmet eine organische Form im 4-7-8-Takt (4 s ein, 7 s halten, 8 s aus); die Headline atmet mit – ihr Schriftgewicht schwillt beim Einatmen an und wird beim Ausatmen wieder dünn, ein Punkt umrundet die Form auf einem Orbit, an dem „einatmen · halten · ausatmen“ steht. Beim Scrollen wandert die Farbe der Seite wie ein Tag vom rosigen Morgen über den hellen Mittag in den Lehm-Abend; die Atemübung ist die Nacht, die sich als Kreis öffnet. Statt Kennzahlenreihen und Kartenrastern gibt es einen gezeichneten Grundriss, einen Tageslauf mit Sonnenstand, Atemlinien für die vier Stile, ein Namensregister und ein Siegel – alles langsam, weich, mit längerem Aus- als Einatmen (`--t-inhale` 1,1 s, `--t-exhale` 1,5 s, Sinus-Kurve `--ease-breath`).

## Abschnitte
Hero (atmende Canvas-Form, Orbit, atmende Headline, „Fahrplan“-Leiste mit nächster Stunde) · Haltung (Wort-für-Wort-Satz, Morgenbild, Grundriss Raum Weite mit 14 Matten, Randnotizen 14/36/7/0, Berührungs-Kärtchen, das sich umdreht) · Vier Stile (horizontale Wellen-Strecke, Duoton-Serie) · Besondere Formate (Index mit Bildvorschau) · Stil-Quiz · Stundenplan als Tageslauf · Atemübung (Vollbild, Nacht-Bloom) · Erste Stunde (gezeichneter Pfad) · Preise mit Rechner · Studio (Abzüge) · Lehrende (Namensregister, Handy: Wisch-Reihe) · Stimmen (gesetzte Zitate, Siegel 4,9 / 221) · Anfahrt (SVG-Karte) · FAQ · Probestunde/Kontakt · Footer („ein / aus“). Dazu `impressum.html` und `datenschutz.html` (Muster).

## Spezial-Features
- **Hero (Set Piece 1):** Canvas-Form aus Perlin-Noise mit vier nachziehenden Höhenlinien, wölbt sich zum Mauszeiger (Feder/Lerp), kommt beim Scrollen zur Ruhe. Die Canvas liest die `currentTime` der CSS-Atmung der Headline (`@keyframes breathe-w`) – Form, Orbit-Punkt und Schrift laufen auf derselben Uhr. 30 Bilder/s, pausiert außerhalb des Viewports und im Hintergrund-Tab, devicePixelRatio max. 2; ohne JS eine CSS-Form, bei reduzierter Bewegung ein Standbild.
- **Himmel (Set Piece 2):** jede Sektion trägt `data-sky="#…"`; eine fixe Farbfläche mischt die Tageszeiten beim Scrollen, Header-Farbe und Sonnenpunkt im Fortschrittsbalken folgen.
- **Stile als Wellen-Strecke (Set Piece 3):** Sticky-Bühne (kein Pin), jede Tafel hat ihre Atemlinie (Vinyasa schnell und hoch, Yin lang und flach, Restorative fast still), die sich mit der Strecke zeichnet; auf dem Handy beim Erscheinen.
- **Atemübung als Vollbild (Set Piece 4):** Die Nacht wächst als Kreis aus einem Punkt (GSAP-Scrub auf `transform`), dann erscheint die Übung. Box-Atmung (4-4-4-4, 6 Runden) oder 4-7-8 (4 Runden), atmender Kreis, Phasensegmente, Countdown, Start/Pause/Neu beginnen, optional leiser Ton, `aria-live`; ohne JS steht die Anleitung als Text da.
- **Stundenplan als Tageslauf (Set Piece 5):** ab 1180 px eine Zeitachse 7–21 Uhr (Mittagsruhe 13–17 Uhr gestaucht), zwei Spuren pro Tag (Raum Weite / Raum Stille), Stundenlinien, „Jetzt“-Strich. Darüber die Sonnenbahn: Die Sonne steht auf der aktuellen Uhrzeit und folgt Mauszeiger, Hover und Tastaturfokus. Darunter Tablet-Raster bzw. Handy-Tages-Tabs (Pfeiltasten), dort zeigt die Sonnenbahn die Stunden des gewählten Tags als Punkte. Filter nach Stil, Level und Lehrenden mit Live-Zähler, Detail-Dialog (Fokusführung, Escape, Bottom-Sheet auf dem Handy).
- **Stil-Quiz:** 4 Fragen → Hatha, Vinyasa, Yin oder Restorative mit Erklärung, Zweitempfehlung und passenden Terminen.
- **Preis-Umschalter:** Probemonat / 10er-Karte / Mitgliedschaft (Tabs mit Pfeiltasten, gleitende Pille, weicher Wechsel mit Unschärfe, hochzählende Preise), Ermäßigung −20 %, Rechner 1–5× pro Woche.
- Details: Überschriften steigen Wort für Wort aus einer Maske, Navigation mit rollenden Zeichen, gezeichnete Unterstreichungen, magnetische Hauptknöpfe (nur feiner Zeiger), Siegel dreht sich mit dem Scrollen, Abzüge mit Beschriftung, Körnung über der Seite, fixe Aktionsleiste (Anrufen / Probestunde) auf dem Handy.

## Anpassen
- **Name, Telefon, Adresse, Zeiten:** direkt in `index.html` (Header, Hero, Anfahrt, Kontakt, Footer, JSON-LD im `<head>`), `impressum.html`, `datenschutz.html`.
- **Farben & Schriften:** CSS-Variablen oben in `style.css` (`--sand`, `--sage`, `--clay`, `--forest`, Stilfarben `--c-hatha` …). Die Canvas-Farben stehen in `main.js` (`C` in `initHero`).
- **Stundenplan:** jede Stunde ist ein `<li class="slot">` in `index.html` mit `data-day`, `data-start`, `data-end`, `data-style`, `data-level`, `data-teacher`, `data-room`, `data-spots`. Die Auswahlliste im Formular (`#f-kurs`) bei Änderungen mitpflegen. Lehrende, Räume und Stilbeschreibungen: `TEACHERS`, `ROOMS`, `STYLES` oben in `main.js`.
- **Preise & Rechner:** `PRICES`, `PRICES_REDUCED`, `CLASSES_PER_CARD`, `WEEKS_PER_MONTH` oben in `main.js` (und die Startwerte im HTML).
- **Atemübung:** `BREATH_PATTERNS` (Phasen in Sekunden, Runden) und `BREATH_SCALE`; Hero-Atemrhythmus: `HERO_BREATH` in `main.js` zusammen mit `@keyframes breathe-w` (19 s, Anteile 21,05 % / 57,89 %) in `style.css` ändern.
- **Tageszeiten-Farben:** `data-sky` an jeder `<section>`; Zeitachse des Stundenplans: `TL` in `main.js`.
- **Quiz:** Gewichte stehen als `data-score="stil:punkte,…"` an den Antworten im HTML; Gleichstand entscheidet `TIE_ORDER`.
- **Bilder:** `assets/img/<name>-960.webp` und `-480.webp` ersetzen (die Stil-Fotos als Duoton `*-duo-*.webp`, erzeugt mit `convert … -colorspace gray +level-colors '#22302A','#EFE6D6'`) (gleiche Namen) oder Pfade/`srcset` im HTML anpassen. Fotos werden nie breiter als 960 CSS-px dargestellt. Quellen: `assets/img/BILDNACHWEIS.md`.

## Lokal starten
```
cd /home/user/Websites && python3 -m http.server 8800
```
Dann http://127.0.0.1:8800/arena/yoga-atemraum/ öffnen. `?motion=off` schaltet alle Animationen ab.

## Technik & Hinweise
Statisch, ohne Build. GSAP 3 + ScrollTrigger und Lenis liegen unter `assets/vendor/`, Schriften (nur `latin`, OFL) unter `assets/fonts/`. Keine externen Requests, keine Cookies. Ohne JavaScript und bei `prefers-reduced-motion` bleibt alles sichtbar und bedienbar; Formulare arbeiten nur clientseitig („Demo – es wurde nichts gesendet“).
