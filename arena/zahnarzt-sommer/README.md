# Zahnarztpraxis Dr. Lea Sommer – Modell „Klarheit“ (Demo)

Demo-Website für einen **fiktiven** Betrieb: Zahnarztpraxis in München-Schwabing (Leopoldstraße 88). Teil der „Arena“ von Filip Kramar. Statisch, ohne Build, ohne externe Requests. `noindex` gesetzt.

## Gestaltungsidee

„Befund in Klarheit“: Die Seite ist gebaut wie eine zahnärztliche Panorama-Röntgenaufnahme und das Versprechen der Praxis, „Sie sehen, was wir sehen“. Eine Scanlinie fährt beim Laden einmal über den Hero und entwickelt Schrift und Duoton-Foto; danach durchleuchtet ein Scanner das gezeichnete Gebiss (Maus oder Finger) und zeigt Wurzeln, Füllung, Wurzelfüllung und Implantat. Ordnung kommt vom Schweizer 12-Spalten-Raster mit sichtbaren Haarlinien, Beschnittmarken, R/L-Markern und FDI-Nummern wie auf einem Befund; Vertrauenssignale stehen als Bildbeschriftung der Aufnahme und als Stempel, nicht als Zahlenreihe. Typografisch trägt der Kontrast schwere Grotesk (Figtree) gegen feine Antiqua (Newsreader, Display- und Text-Schnitt). Die Bewegung ist „kalibriert“: Scans mit konstanter Geschwindigkeit, Zustände mit kräftigem Ease-out, Bilder und Überschriften werden von links nach rechts „entwickelt“ statt eingeblendet.

Farben: Papier #FBFCFC, Tinte #0B1F1E, Petrol #0F4C4A, Minze #CFEDE4 sparsam, Koralle #FF8A6B nur für Scanlinie, Marker und Notfall.

## Abschnitte
1. Header mit Navigation (Zeichen rollen beim Hover), Telefon, „Termin anfragen“, Scan-Fortschritt als Koralle-Linie (mobil: Menü als Dialog)
2. **Hero „Panorama-Aufnahme“**: „Erst verstehen.“ (Grotesk) – Panorama mit Röntgen-Scanner – „Dann behandeln.“ (Antiqua); Beschriftung der Aufnahme mit Adresse, Öffnungsstatus, Kassen, Sprachen, Bewertung
3. **Behandlungsweg**: sechs Stationen an einer Linie, die sich beim Scrollen zeichnet und beim Befund in fünf Möglichkeiten verzweigt (inkl. „Beobachten“ – die einfachste)
4. Behandlungen als Index-Tabelle mit Bildvorschau am Mauszeiger; jede Zeile füllt die Terminanfrage vor
5. **Zahnschema** (32 Zähne, FDI) auf dunklem „Befundmonitor“ mit Fadenkreuz, Zählwerk und Behandlungs-Tabs
6. **Prophylaxe** als Sticky-Erzählung (6 Schritte, Zeitleiste 0–55 Minuten mit Nadel) + **Kosten-Umschalter** gesetzlich/privat
7. **Ohne Angst** – die ganze Seite wechselt auf Petrol; **Atemübung 4-4-6** als Vollbild-Kapitel, während der Übung „atmet“ die Seitenfarbe mit
8. **Team-Karussell** mit Monogrammen im Zahnkreuz, Sprachfilter (DE/EN/TR)
9. Praxis-Rundgang (Desktop: horizontale Strecke mit Tiefen-Parallax, mobil: Wisch-Schiene)
10. Stimmen (erfunden) mit drehendem Bewertungs-Stempel und Verteilung
11. **Terminanfrage** in drei Schritten (Anliegen → Wunschzeit-Raster → Kontakt), Schmerz-Notfall = anrufen
12. Anfahrt als Split-Screen (Karte bricht den linken Rand), Sprechzeiten mit „heute“, FAQ, Footer

## Spezial-Features im Detail
- **Panorama-Scanner (Hero):** Zeichnung und Röntgenebene sind zwei deckungsgleiche SVGs; das Fenster und die Röntgenebene bewegen sich gegenläufig per `transform` (Compositor). Im Leerlauf fährt der Scanner per Web Animations API hin und her (pausiert außerhalb des Viewports), die Maus übernimmt mit Nachlauf, auf dem Handy horizontal wischen. Die Grafik wurde mit einem Generator-Skript erzeugt (Zahnbreiten in mm, Lächelkurve, FDI-Nummern); bei Bedarf direkt im SVG anpassen.
- **Scan-Intro:** reine CSS-Animation (≈ 1 s), Inhalte liegen sofort darunter im DOM; Klick, Taste oder Scrollen überspringt es. Bei `?motion=off`/reduzierter Bewegung entfällt es.
- **Behandlungsweg:** `main.js` misst die Stationen und baut daraus die Linie samt Abzweigen (auf Desktop als Fächer, auf dem Handy als Nebenspuren). Jede Teilstrecke zeichnet sich über `stroke-dashoffset`, Stationen „entwickeln“ ihre Nummer, wenn die Linie sie erreicht.
- **Zahnschema:** Klick/Tipp auf Zahn oder Bereich. Tastatur: Pfeil links/rechts = nächster Zahn, Pfeil hoch/runter = Gegenkiefer, Pos1/Ende. Tabs mit Pfeiltasten. Fadenkreuz gleitet zum gewählten Zahn und rastet ein, die Nummer rollt als Zählwerk, Bereiche leuchten entlang des Bogens nacheinander auf. „Termin zu Zahn XY anfragen“ trägt Zahn und Thema in die Nachricht ein.
- **Atemübung:** Start/Stopp-Button, 14 Punkte = 14 Sekunden einer Runde, 5 Runden. Bei reduzierter Bewegung pulsiert nur die Helligkeit statt der Größe; die Seitenfarbe atmet in beiden Fällen (reine Farbänderung). Phasen werden per `aria-live` angesagt. Wer das Kapitel verlässt, beendet die Übung.
- **Terminanfrage:** Validierung je Schritt, Schnellauswahl für Zeitfenster, Erfolgsansicht mit Zusammenfassung („Demo – es wurde nichts gesendet“). Eingaben werden nur per `textContent` ausgegeben.
- **Öffnungsstatus:** berechnet „Jetzt geöffnet / öffnet …“ in Europe/Berlin (Panorama-Beschriftung, Sprechzeiten-Tabelle).

## Anpassen
- **Name, Adresse, Telefon, E-Mail:** in `index.html`, `impressum.html`, `datenschutz.html` suchen/ersetzen (`089 555 67 10`, `+49895556710`, `praxis@zahnarzt-sommer.de`, `Leopoldstraße 88`). JSON-LD im `<head>` mit anpassen.
- **Farben, Schriftgrößen, Raster, Bewegung:** CSS-Variablen in `:root` oben in `style.css` (`--paper`, `--ink`, `--petrol`, `--mint`, `--coral`, `--t-mega`, `--gap`, `--ease-*`, `--t-develop` …). Der Petrol-Ton des Angst-Kapitels steht in `html[data-tone="petrol"]`.
- **Öffnungszeiten, Atemübung, Scanner, Behandlungsweg:** Konstanten oben in `main.js` (`OEFFNUNGSZEITEN`, `ATEM`, `ATEM_FARBE`, `SCANNER`, `WEG_LINIE`). Sprechzeiten-Tabelle und Wunschzeit-Raster in `index.html` passend ändern.
- **Texte im Zahnschema:** Objekte `TREAT`, `BY_TYPE`, `AREAS` in `main.js` (Relevanz 1–3, Erklärung, Dauer, Kostenhinweis – bewusst ohne Preise).
- **Bilder:** `assets/img/<name>-960.webp` und `-480.webp` ersetzen (gleiche Namen). Alle Fotos sind als Duoton eingefärbt – die zwei ImageMagick-Befehle dafür stehen in `assets/img/BILDNACHWEIS.md`. Fotos nie breiter als 960 px darstellen.
- **Schriften:** Figtree (variabel) und Newsreader (variabel, als Display-Schnitt opsz 56 und kursiver Text-Schnitt opsz 28 auf Latin reduziert) liegen in `assets/fonts/`, Lizenzen daneben.

## Technik
- GSAP + ScrollTrigger + Lenis (lokal in `assets/vendor/`); Lenis nur ohne reduzierte Bewegung, Instanz als `window.__lenis`.
- Keine GSAP-Pins: Prophylaxe-Grafik und Praxis-Strecke hängen an CSS `position: sticky`; die Höhe der Strecke setzt `main.js` über `--tour-dist` (nur ab 900 px, `gsap.matchMedia`).
- Erster Bildschirm wartet auf nichts: Hero-Text und -Bild sind sofort gemalt, das Scan-Intro liegt nur als halbtransparenter Schleier darüber. Übrige Module starten in kleinen Häppchen.
- Reveals beobachten immer den unbeschnittenen Rahmen; beschnitten (`clip-path`) wird nur der Inhalt.
- `?motion=off` oder `prefers-reduced-motion` schalten Bewegung ab; ohne JS ist alles sichtbar (Tabs werden zu Abschnitten, Formular-Schritte untereinander, Behandlungsweg als statische Linie).
- Alle Pfade absolut mit Präfix `/arena/zahnarzt-sommer/`.

## Lokal starten
```bash
cd /home/user/Websites
python3 -m http.server 8801
# → http://127.0.0.1:8801/arena/zahnarzt-sommer/
```

Fiktiver Beispielbetrieb – alle Namen, Daten und Bewertungen sind erfunden. Impressum/Datenschutz sind Muster (keine Rechtsberatung). Herkunft der Fotos: `assets/img/BILDNACHWEIS.md`.
