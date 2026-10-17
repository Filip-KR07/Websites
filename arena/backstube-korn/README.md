# Backstube Korn – Demo „Kruste“

Demo-Website für eine fiktive Bäckerei & Konditorei in Regensburg (Arena-Sammlung von Filip Kramar). Alle Namen, Daten, Preise und Bewertungen sind erfunden; die Seite ist auf `noindex` gestellt.

## Gestaltungsidee
„Ofen und Teig“: Die Seite erzählt die Nacht einer Backstube. Der erste Bildschirm ist der Blick durch die Glastür des Steinofens – der Rollladen geht hoch, ein Teigling geht auf dem Schieber auf und bräunt, das Thermometer klettert auf 250 °C, Mehlstaub und Funken steigen (Canvas, reagiert auf den Zeiger). Alles Weitere ist Werkzeug und Material der Backstube: die Ofenuhr mit Messinglünette, die Kreidetafel-Preisliste der Theke, das Weckglas mit dem Anstellgut, die Papiertüte für den Brotkorb, die Etagere der Konditorei, der Mehlsack als Karte. Typografie wie ein Bäckertüten-Stempel (Fraunces mit SOFT/WONK-Achsen, Tintenmaske), Kapitel wechseln die ganze Hintergrundfarbe zwischen Ofenschwarz, Mehlweiß, Tütenpapier und Konditorei-Rosé. Bewegungs-Handschrift „Gehen und Backen“: Bedienelemente reagieren schnell (140–220 ms), Inhalte gehen langsam auf wie Teig – Wörter starten flach und federn rund nach (`--ease-rise`, 900 ms, Stagger 45 ms).

## Abschnitte
Hero „Blick in den Ofen“ · Ofenfrisch-Uhr (Backplan) · Theke als Preisliste · Sauerteig 48 h im Glas · Brotkorb vorbestellen · Torten-Konfigurator auf der Etagere · Backstube (Chronik, Schichtplan, Aushang) · Stimmen auf Tüten · Standort als Mehlsack-Karte · FAQ · Kontakt · Footer. Dazu `impressum.html` und `datenschutz.html` (Muster).

## Spezial-Features und Set Pieces
- **Hero-Ofen**: CSS-Intro ohne JS-Abhängigkeit (Rollladen, Teig geht auf, Kruste, Ausbund, Thermometer); Canvas mit Mehlstaub und Funken (vorgerenderte Sprites, ~30 fps im Ruhezustand, volle Rate bei Mausbewegung, Hitze-Schein wächst, wenn der Zeiger der Tür nahe kommt; pausiert außerhalb des Viewports). Beim Scrollen driften die Headline-Zeilen auseinander.
- **Ofenfrisch-Uhr**: Ziffernblatt 5–18 Uhr; beim ersten Sichtkontakt schwingt der Zeiger auf die aktuelle Uhrzeit und der Fortschrittsbogen zeichnet sich. Status jeder Charge, Countdown zur nächsten; Tabs Mo–Fr / Sa / So (Pfeiltasten).
- **Theke**: Preisliste mit Vorschau-Abzug, der dem Zeiger mit Federung folgt (nur feiner Zeiger, Desktop).
- **Sauerteig 48 h**: Das Weckglas klebt (`position: sticky`, Handy als kompakte Leiste), der Teig steigt mit dem Scrollen, fällt beim Entnehmen nach 16 h und steigt wieder; Stundenzähler als Odometer, Schritte leuchten auf, Fotos öffnen sich per Maske.
- **Brotkorb-Konfigurator**: Mengen-Stepper, Abholtag und -zeit nach Öffnungszeiten, Papiertüten-Zusammenfassung mit Summe, Validierung und Demo-Erfolgsansicht mit Stempel.
- **Torten-Konfigurator**: Beim ersten Sichtkontakt wird die Etagere gestapelt; Stockwerke, Füllung, Deko und Aufschrift als Live-SVG; das Preisschild schwingt bei jeder Änderung; Übergabe ins Kontaktformular.
- **Details**: Chronik-Linie zieht sich durch die Jahre, Bewertungs-Stempel dreht beim Scrollen, Mühlen-Routen zeichnen sich auf dem Mehlsack, Navigations-Links rollen Zeichen für Zeichen, magnetische Stempel-Buttons.

## Anpassen
- **Name, Telefon, Adresse**: in `index.html` (inkl. JSON-LD im `<head>`), `impressum.html`, `datenschutz.html` suchen und ersetzen (`0941 555 31 70`, `+499415553170`, `Gesandtenstraße 14`).
- **Farben, Schriften, Bewegung**: CSS-Variablen ganz oben in `style.css` (`--mehl`, `--kruste`, `--gold`, `--ofen`, `--nacht`, `--rose`, `--f-display`, `--f-text`, `--ease-rise`, `--t-rise`).
- **Backplan, Öffnungszeiten, Sortiment/Preise, Torten-Preise**: Konstanten oben in `main.js` (`HOURS`, `OVEN_PLAN`, `PRODUCTS`, `PREORDER_CUTOFF`, `CAKE`, Teigstand im Glas `JAR_LEVEL`). Die statische Liste im HTML ist nur der Fallback ohne JavaScript.
- **Bilder**: `assets/img/<name>-960.webp` und `-480.webp` durch eigene Fotos gleicher Namen ersetzen (max. 960 px breit). Quellen in `assets/img/BILDNACHWEIS.md`.

## Lokal starten
```
cd /home/user/Websites && python3 -m http.server 8801
```
Dann http://127.0.0.1:8801/arena/backstube-korn/ öffnen. `?motion=off` schaltet alle Animationen ab.

Schriften (Fraunces, Outfit) liegen selbst gehostet unter `assets/fonts/` (SIL OFL, Lizenzen beigefügt). Keine externen Requests, keine Cookies.
