# Backstube Korn – Demo „Kruste“

Demo-Website für eine fiktive Bäckerei & Konditorei in Regensburg (Arena-Sammlung von Filip Kramar). Alle Namen, Daten, Preise und Bewertungen sind erfunden; die Seite ist auf `noindex` gestellt.

## Abschnitte
Hero mit Mehlstaub · Ofenfrisch-Uhr (Backplan) · Sortiment · Sauerteig-Strecke (48 h) · Brotkorb vorbestellen · Torten-Konfigurator · Über uns, Team & Stellen · Kundenstimmen · Standort mit Mühlen-Karte · FAQ · Kontakt · Footer. Dazu `impressum.html` und `datenschutz.html` (Muster).

## Spezial-Features
- **Mehlstaub im Hero**: Canvas-Partikel (vorgerendertes Sprite, ~30 fps im Ruhezustand, volle Rate bei Mausbewegung, pausiert außerhalb des Viewports).
- **Ofenfrisch-Uhr**: Ziffernblatt 5–18 Uhr mit Live-Zeiger, Status jeder Charge und Countdown zur nächsten; Tabs Mo–Fr / Sa / So (Pfeiltasten).
- **Brotkorb-Konfigurator**: Mengen-Stepper, Abholtag und -zeit nach Öffnungszeiten, Papiertüten-Zusammenfassung mit Summe, Validierung und Demo-Erfolgsansicht.
- **Sauerteig-Strecke**: Desktop horizontale Strecke per `position: sticky` + GSAP-Scrub mit Stundenzähler und Weckglas; Handy/ohne Bewegung vertikale Zeitleiste.
- **Torten-Konfigurator**: Stockwerke, Füllung, Deko und Aufschrift als Live-SVG mit Preis-Orientierung; Übergabe ins Kontaktformular.

## Anpassen
- **Name, Telefon, Adresse**: in `index.html` (inkl. JSON-LD im `<head>`), `impressum.html`, `datenschutz.html` suchen und ersetzen (`0941 555 31 70`, `+499415553170`, `Gesandtenstraße 14`).
- **Farben & Schriften**: CSS-Variablen ganz oben in `style.css` (`--mehl`, `--kruste`, `--gold`, `--ofen`, `--f-display`, `--f-text`).
- **Backplan, Öffnungszeiten, Sortiment/Preise, Torten-Preise**: Konstanten oben in `main.js` (`HOURS`, `OVEN_PLAN`, `PRODUCTS`, `PREORDER_CUTOFF`, `CAKE`). Die statische Liste im HTML ist nur der Fallback ohne JavaScript.
- **Bilder**: `assets/img/<name>-960.webp` und `-480.webp` durch eigene Fotos gleicher Namen ersetzen (max. 960 px breit). Quellen in `assets/img/BILDNACHWEIS.md`.

## Lokal starten
```
cd /home/user/Websites && python3 -m http.server 8801
```
Dann http://127.0.0.1:8801/arena/backstube-korn/ öffnen. `?motion=off` schaltet alle Animationen ab.

Schriften (Fraunces, Outfit) liegen selbst gehostet unter `assets/fonts/` (SIL OFL, Lizenzen beigefügt). Keine externen Requests, keine Cookies.
