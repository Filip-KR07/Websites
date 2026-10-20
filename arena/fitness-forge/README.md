# FORGE Athletic Club – Demo „Schmiede“

Demo-Website für ein **fiktives** Fitnessstudio in Berlin-Friedrichshain (Revaler Straße 99). Teil der „Arena“ von Filip Kramar. Alle Namen, Preise, Kurse und Bewertungen sind erfunden, die Seite steht auf `noindex`.

## Gestaltungsidee
„Nachtschicht“: die Halle nach Sonnenuntergang, so wie ein Premium-Studio sie inszeniert. Die Seite öffnet mit einem Vollbild-Video aus der Trainingsfläche (Battle Ropes, Air Bike, Gegenlicht), darüber ein dunkler Verlauf. Unten rechts stehen Markenname in Champagner-Gold, die Versal-Headline und ein goldener Pill-Button mit rundem Pfeil-Icon, unten links ein neutrales Sternen-Siegel (ohne Plattform-Logo) und die Live-Anzeige des nächsten Kurses.

Die Farbwelt ist bewusst knapp: fast schwarz und nachtblau als Fläche, Blau-Violett **nur als Licht** (Video, Lichtkegel, Glows, Kanten der Abschnitte), Champagner-Gold `#C9A86A` als einziger Akzent – wie Messing an Hantelstange und Tresen –, dazu Off-White. Kein Rot. Alle Fotos sind passend zum Video nachtblau getönt. Typografie: **Sofia Sans Condensed** (Variable Font) für kompakte, kräftige Versal-Headlines, **Inter Tight** für Fließtext.

Die Bewegungs-Handschrift ist „ruhig und teuer“: lange, weiche Auslaufkurven, nichts federt laut. Headlines steigen wortweise aus einer Maske, Bilder öffnen sich aus einem Rahmen, Licht folgt dem Zeiger, Zahlen rollen wie ein Zählwerk.

## Abschnitte
Hero mit Video · Kennzahlen (Zählwerk) · Disziplinen (klebende Bildbühne) · Kursplan (Anzeigetafel + Wochenraster) · Mitgliedschaft (Konfigurator mit Mitgliedskarte) · Trainingsplan-Generator · Coaches (Strecke mit Tiefe, Flip-Karten, Karriere) · Die Halle (annotiertes Foto, „Ein Tag in der Halle“) · Probetraining Minute für Minute · Stimmen (Bewertungsverteilung, Zitate) · Standort (SVG-Karte, Öffnungszeiten) · FAQ · Probetraining-Anfrage · Footer. Dazu `impressum.html` und `datenschutz.html` (Muster).

## Spezial-Features
- **Hero-Video:** `<video muted loop playsinline autoplay preload="metadata">` mit WebM + MP4, auf Handys (≤ 700 px) die Hochformat-Fassung samt Hochformat-Poster (per `<source media>` und JS-Fallback). Das Standbild liegt zusätzlich als `<img fetchpriority="high">` darunter und wird vorgeladen (schnelles LCP). Sichtbarer Pause/Play-Knopf mit Ring, der den Loop-Fortschritt zeigt (WCAG 2.2.2). Das Video pausiert außerhalb des Bildschirms und in Hintergrund-Tabs; bei `prefers-reduced-motion`, `?motion=off` und Datensparmodus startet es nicht automatisch (nur Standbild, Play-Knopf bleibt).
- **Hero-Choreografie:** Headline-Zeilen steigen per reinem CSS aus einer Maske (wartet nicht auf JavaScript), das Video setzt mit leichtem Zoom ein. Ein blau-violetter Lichtkegel folgt gefedert dem Zeiger. Beim Weiterscrollen skaliert das Video leicht, dunkelt ab und der Text weicht nach oben.
- **Anzeigetafel (Kursplan):** Klappzeichen-Tafel auf Canvas mit den nächsten Kursen ab jetzt (Zeit, Kurs, Coach, Ort, Status), laufende Kurse in Gold. Folgt sofort den Filtern (Disziplin, Level, Coach). Darunter das Wochenraster (46 Kurse) mit Live-Markierung, Tages-Tabs auf dem Handy (Pfeiltasten) und Kurs-Dialog („Als Probetraining wählen“ füllt das Formular vor). Testen: `?jetzt=Di-18:45`.
- **Mitgliedskarte:** Zugang, Laufzeit, Extras, Ermäßigung und Personal Training rechnen live; die Karte wechselt je Tarif ihr Material (Graphit, Nachtblau, Schwarz-Gold), zeigt die Extras, lässt einen Lichtreflex über die Oberfläche laufen und neigt sich zum Zeiger. Monatspreis als rollendes Zählwerk, Aufstellung mit Startpaket und Jahressumme. Auf dem Handy klebt ein Mini-Preis oben.
- **Trainingsplan-Generator:** Ziel (typografische Auswahl) + Tage + Erfahrung → sieben Tageskarten mit passendem Kurs; Drucken, als Text speichern, kopieren. Klar als Orientierung ohne Gesundheitsversprechen gekennzeichnet.
- **Coaches als Strecke mit Tiefe** (ab 900 px, `position: sticky` + Scrub): Karten kommen aus der Tiefe nach vorn; 3D-Flip per Hover, Klick, Tippen oder Tastatur (Escape schließt). Auf dem Handy eine Wisch-Schiene.
- Weitere Details: magnetische Gold-Buttons mit Pfeilwechsel, Zeichen-Rolle in der Navigation, Lichtpunkt auf Karten unter dem Zeiger, Laufzeit-Uhr und goldene Zeitleiste im Probetraining, Bewertungsbalken, sich zeichnende Linien im Hallenfoto und auf der Karte, Scroll-Fortschritt, geöffnet/geschlossen-Status.

## Motion-System
CSS-Variablen oben in `style.css`: `--ease-out`, `--ease-in-out`, `--ease-drawer`, Dauern `--t-press` 140 ms, `--t-ui` 220 ms, `--t-reveal` 1000 ms, Stagger 45 ms. Animiert werden nur `transform`, `opacity` und `clip-path`. `prefers-reduced-motion`: sanfte Überblendungen statt Bewegung, kein Lenis, kein Video-Autoplay. `?motion=off` schaltet alles ab. Ohne JavaScript ist alles sichtbar und bedienbar (das Video läuft dann mit dem Standbild als Poster).

## Video austauschen (eigenes Studiovideo)
1. Eigenes Material aus dem Studio drehen (ruhige Einstellungen, 15–25 s, ohne Ton, ohne erkennbare Gesichter oder mit Einverständnis der Personen). Die Schnittstelle sollte nahtlos loopen.
2. Zwei Fassungen exportieren und **gleich benennen**, dann kann das HTML bleiben:
   - Querformat 1280 × 720: `assets/video/hero-1280.webm` (VP9) und `hero-1280.mp4` (H.264, `-movflags +faststart`)
   - Hochformat 540 × 960 fürs Handy: `hero-540x960.webm` und `hero-540x960.mp4`
   - Standbilder: `hero-poster-1280.webp` und `hero-poster-540x960.webp` (ein ruhiger Frame aus dem Video, ca. 20–30 KB)
3. **Dateigröße je Datei höchstens 2–3 MB** (Richtwert 400–700 kbit/s bei 24 fps). Beispiel: `ffmpeg -i roh.mov -an -vf scale=1280:-2 -c:v libvpx-vp9 -b:v 450k -crf 36 hero-1280.webm` bzw. `-c:v libx264 -crf 28 -preset slow -movflags +faststart hero-1280.mp4`.
4. Farblich dunkel und kühl graden, damit Text darauf lesbar bleibt; der Verlauf `.hero__shade` in `style.css` dunkelt zusätzlich ab.
5. Herkunft und Lizenz in `assets/video/VIDEONACHWEIS.md` eintragen.

## Anpassen
- **Name, Telefon, Adresse, Zeiten:** direkt in `index.html` (Header, Hero, Standort, Footer, JSON-LD im `<head>`), `impressum.html`, `datenschutz.html`. Öffnungszeiten für die Live-Logik: `OEFFNUNG` oben in `main.js`.
- **Farben:** CSS-Variablen oben in `style.css` (`--night`, `--night-2`, `--panel`, `--ink`, `--mute`, `--gold`, `--gold-hi`, `--violet`, `--glow` …). Die Tafel-Farben stehen in `Flap.prototype.draw` in `main.js`.
- **Kurse:** als Liste in `index.html` (`.woche__tag` → `.kurs` mit `data-typ`, `data-level`, `data-coach`, `data-start`, `data-ende`, `data-raum`). Beschreibungen für den Dialog: `KURSINFO` in `main.js`, Coach-Namen: `COACHES`, Kürzel für die Tafel: `ABK`, Spaltenbreiten: `BOARD_COLS`.
- **Preise:** `PREISE` oben in `main.js` (Zugang, Laufzeit-Aufschlag, Extras, Ermäßigung, Personal Training, Startpaket); Kurzlabels auf der Karte: `KARTE_EXTRAS`. Die Preistabelle im HTML (`.pricelist`) bei Änderungen mitpflegen.
- **Trainingsplan:** `PLAN_TAGE`, `PLAN_ERFAHRUNG`, `PLAN_ZIELE` und `EINHEITEN` in `main.js`. Der statische Standardplan im HTML ist der Fallback ohne JavaScript.
- **Bilder:** `assets/img/<name>-960.webp` und `-480.webp` ersetzen (gleiche Namen) oder Pfade/`srcset` im HTML anpassen. Fotos werden nie breiter als 960 CSS-px dargestellt. Die Hallen-Annotationen sind auf `ring-960.webp` abgestimmt – bei anderem Foto Koordinaten in `.anno` anpassen.

## Lokal starten
```
cd /home/user/Websites && python3 -m http.server 8800
```
Dann http://127.0.0.1:8800/arena/fitness-forge/ öffnen. `?motion=off` schaltet alle Animationen ab.

## Technik & Hinweise
Statisch, ohne Build. GSAP 3 + ScrollTrigger und Lenis liegen unter `assets/vendor/`, Schriften (nur `latin`, SIL OFL) unter `assets/fonts/`. Keine externen Requests, keine Cookies; auch das Video kommt vom eigenen Server. Klebende Abschnitte mit CSS `position: sticky` (keine GSAP-Pins), Start in Etappen.

Bildquellen: `assets/img/BILDNACHWEIS.md` (StockSnap, CC0). Video: `assets/video/VIDEONACHWEIS.md` (Coverr-Lizenz).

