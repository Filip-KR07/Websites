# Atemraum Yoga – Demo „Atem“

Demo-Website für ein **fiktives** Yogastudio am Stadthafen Münster (Hafenweg 26). Teil der „Arena“ von Filip Kramar. Alle Namen, Kurse, Preise, Bewertungen und freien Plätze sind erfunden, die Seite steht auf `noindex`.

Designsprache: organisch, ruhig, geerdet – Salbei `#A9B8A2`, Sand `#EDE6DA`, Lehm `#B9826A`, Waldgrün `#26332B`. Display-Schrift Gloock (weiche Serifen), Text in Outfit (variabel). Blob-Masken statt Rechtecke, sanfte Körnung über der ganzen Seite, alle Bewegungen in einem langsamen Atemrhythmus (4 s ein, 6 s aus).

## Abschnitte
Hero (Canvas-Formen + Foto in atmender Maske, „Nächste Stunde“-Karte) · Haltung (Wort-für-Wort-Text, Kennzahlen, Berührungs-Kärtchen) · Vier Stile (horizontale Strecke) · Besondere Formate · Stil-Quiz · Stundenplan · Atemübung · Erste Stunde (gezeichneter Pfad) · Preise mit Rechner · Studio · Lehrende (Monogramme + Vertretungs-Aufruf) · Stimmen · Anfahrt (SVG-Karte) · FAQ · Probestunde/Kontakt · Footer. Dazu `impressum.html` und `datenschutz.html` (Muster).

## Spezial-Features
- **Hero-Canvas:** Organische Formen aus Perlin-Noise fließen langsam und atmen im 4/6-Sekunden-Rhythmus; das Hero-Foto liegt in einer mitatmenden Blob-Maske. Beim Scrollen werden Formen und Tempo ruhiger („kommen zur Ruhe“). Leichte Maus-Parallaxe mit Lerp. Pausiert außerhalb des Viewports und in Hintergrund-Tabs, devicePixelRatio max. 2; bei reduzierter Bewegung ein ruhiges Standbild, ohne JS ein CSS-Fallback.
- **Geführte Atemübung:** Box-Atmung (4-4-4-4, 6 Runden) oder 4-7-8 (4 Runden) wählbar. Atmender Kreis mit nachziehenden Wellen, Phasensegmente am Ring, Fortschrittspunkt, Countdown, Runden, Start/Pause/Neu beginnen, optional ein leiser Ton (Web Audio, im Browser erzeugt). Phasenwechsel werden per `aria-live` angesagt; bei reduzierter Bewegung zeigt der Kreis die Phase über Helligkeit statt Größe. Ohne JS steht die Anleitung als Text da.
- **Stundenplan:** 36 Stunden als Woche (Desktop 7 Spalten, Tablet 4, Handy Tages-Tabs mit Pfeiltasten). Filter nach Stil, Level und Lehrenden mit Live-Zähler, „Heute“-Markierung, Detail-Overlay (Dialog mit Fokusführung, Escape, Bottom-Sheet auf dem Handy) mit Lehrperson, Raum und freien Plätzen. „Für diese Stunde anfragen“ füllt das Formular vor. Die Stil-Links und das Quiz setzen den Filter.
- **Stil-Quiz:** 4 Fragen mit gewichteten Antworten → Hatha, Vinyasa, Yin oder Restorative mit Erklärung, erster Stunde, Zweitempfehlung und bis zu drei passenden Terminen aus dem Plan (nach bevorzugter Tageszeit).
- **Preis-Umschalter:** Probemonat / 10er-Karte / Mitgliedschaft als Tabs (Pfeiltasten) mit gleitender Pille, weicher Überblendung und hochzählenden Preisen, Ermäßigungs-Schalter (−20 %). Daneben ein Rechner (Schieberegler 1–5× pro Woche), der Einzelstunden, 10er-Karten und Mitgliedschaft pro Monat vergleicht.
- Weitere Details: Lenis-Smooth-Scroll, GSAP-Pin der Stile-Strecke mit Bild-Parallaxe (nur ≥ 900 px), Scroll-Fortschritt im Header, Zähler, gezeichnete Route auf der Karte, Atem-Chip im Hero, fixe Aktionsleiste (Anrufen / Probestunde) auf dem Handy.

## Anpassen
- **Name, Telefon, Adresse, Zeiten:** direkt in `index.html` (Header, Hero, Anfahrt, Kontakt, Footer, JSON-LD im `<head>`), `impressum.html`, `datenschutz.html`.
- **Farben & Schriften:** CSS-Variablen oben in `style.css` (`--sand`, `--sage`, `--clay`, `--forest`, Stilfarben `--c-hatha` …). Die Canvas-Farben stehen in `main.js` (`C` in `initHero`).
- **Stundenplan:** jede Stunde ist ein `<li class="slot">` in `index.html` mit `data-day`, `data-start`, `data-end`, `data-style`, `data-level`, `data-teacher`, `data-room`, `data-spots`. Die Auswahlliste im Formular (`#f-kurs`) bei Änderungen mitpflegen. Lehrende, Räume und Stilbeschreibungen: `TEACHERS`, `ROOMS`, `STYLES` oben in `main.js`.
- **Preise & Rechner:** `PRICES`, `PRICES_REDUCED`, `CLASSES_PER_CARD`, `WEEKS_PER_MONTH` oben in `main.js` (und die Startwerte im HTML).
- **Atemübung:** `BREATH_PATTERNS` (Phasen in Sekunden, Runden) und `BREATH_SCALE`; Hero-Atemrhythmus: `HERO_BREATH`.
- **Quiz:** Gewichte stehen als `data-score="stil:punkte,…"` an den Antworten im HTML; Gleichstand entscheidet `TIE_ORDER`.
- **Bilder:** `assets/img/<name>-960.webp` und `-480.webp` ersetzen (gleiche Namen) oder Pfade/`srcset` im HTML anpassen. Fotos werden nie breiter als 960 CSS-px dargestellt. Quellen: `assets/img/BILDNACHWEIS.md`.

## Lokal starten
```
cd /home/user/Websites && python3 -m http.server 8800
```
Dann http://127.0.0.1:8800/arena/yoga-atemraum/ öffnen. `?motion=off` schaltet alle Animationen ab.

## Technik & Hinweise
Statisch, ohne Build. GSAP 3 + ScrollTrigger und Lenis liegen unter `assets/vendor/`, Schriften (nur `latin`, OFL) unter `assets/fonts/`. Keine externen Requests, keine Cookies. Ohne JavaScript und bei `prefers-reduced-motion` bleibt alles sichtbar und bedienbar; Formulare arbeiten nur clientseitig („Demo – es wurde nichts gesendet“).
