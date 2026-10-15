# Blitzblank Gebäudereinigung – Demo „Glanz“

Demo-Website für einen **fiktiven** Gebäudereinigungsbetrieb in Mannheim (Blitzblank Gebäudereinigung GmbH, Neckarauer Straße 102). Teil der „Arena“ von Filip Kramar. Alle Namen, Preise, Bewertungen und Daten sind erfunden, die Seite steht auf `noindex`.

Designsprache: hell, frisch, sehr klar – Weiß, Aqua `#19C3D1`, Marine `#0B2545`, sparsam Seifenblasen-Lila `#B9B3FF`, Hellgrau `#F2F6F8`. Eine Schrift (Plus Jakarta Sans, variabel 200–800) mit starken Gewichtskontrasten. Glanzlichter, Wisch-Effekte und Blasen als Mikroanimationen.

## Abschnitte
Header mit Scroll-Fortschritt · Hero mit Wisch-Scheibe und Kennzahlen · Leistungen (fünf Reinigungsarten, auf dem Desktop als horizontale Strecke mit CSS-sticky, auf dem Handy als Wisch-Schiene) · Angebotsrechner (auf dem Handy mit mitlaufendem Mini-Preis) · Leistungs-Checklisten · Ablauf mit Beispiel-Protokoll · Über uns & Team (Monogramme) · Kundenstimmen · Einsatzgebiet mit PLZ-Check und SVG-Karte · Karriere mit Schichtmodellen und Kurzbewerbung · FAQ · Kontakt/Begehung anfragen · Footer. Dazu `impressum.html` und `datenschutz.html` (Muster).

## Spezial-Features
1. **Wisch-Reveal im Hero** – beschlagene Scheibe (Canvas: weichgezeichnetes Foto, Mikrotröpfchen, Laufspuren). Mit Maus oder Finger freiwischen, ein Abzieher folgt federnd. Ab 60 % freier Fläche wird fertig gewischt, Funkeln und „Blitzblank.“. Knopf „Automatisch wischen“ (Schlangenlinien-Technik) für Tastatur; bei reduzierter Bewegung sanftes Ausblenden.
2. **Angebotsrechner** – Objektart, Fläche (Schieberegler + Zahlenfeld), Intervall, Zusatzleistungen → Monatspreis als Spanne, Wochenplan, Einsätze/Stunden/Team, Leistungsumfang. „Werte in Anfrage übernehmen“ füllt das Kontaktformular vor.
3. **Leistungs-Checklisten** – Tabs (Pfeiltasten, Pos1/Ende) je Reinigungsart, aufklappbare Gruppen mit Häkchen-Animation, „Alle aufklappen“.
4. **Einsatzgebiet-Check** – PLZ eingeben oder Schnellwahl → Pin fliegt auf die SVG-Karte Rhein-Neckar, Zone (12/25/40 km) und Entfernung werden hervorgehoben.
5. **Karriere** – Schichtmodelle als Schalter (`role="switch"`), Tageszeitleiste, gefilterte Stellen, „Bewerbung in 60 Sekunden“ mit Countdown-Ring.

Ohne JavaScript, mit `prefers-reduced-motion` oder `?motion=off` sind alle Inhalte sichtbar und bedienbar (Leistungen auf dem Desktop als Raster, auf dem Handy als Wisch-Schiene; alle Checklisten untereinander).

## Anpassen
- **Name, Adresse, Telefon, E-Mail**: in `index.html`, `impressum.html`, `datenschutz.html` suchen/ersetzen (`Blitzblank`, `0621 555 70 80`, `+496215557080`, `angebot@blitzblank-reinigung.de`). JSON-LD im `<head>` von `index.html` mitpflegen.
- **Farben**: CSS-Variablen ganz oben in `style.css` (`--aqua`, `--aqua-ink` für Text auf Weiß, `--marine`, `--lilac`, `--mist` …).
- **Bilder**: `assets/img/<name>-960.webp` und `-480.webp` ersetzen (gleiche Namen) – Herkunft siehe `assets/img/BILDNACHWEIS.md`. Das Hero-Foto (`hero`) wird auch für den Beschlag verwendet.
- **Rechner-Werte**: Objekt `CALC` oben in `main.js` (Stundensatz-Spanne, Leistungswerte m²/h je Objektart, Mindestbetrag, Zusatzleistungen). Alle Ergebnisse sind als unverbindliche Beispielrechnung gekennzeichnet.
- **Einsatzgebiet**: `ZONES` (Radien, Texte) und `PLACES` (PLZ → Ort, Koordinaten) oben in `main.js`. Die Karte ist eigenes SVG in `index.html` (10 Einheiten = 1 km).
- **Stellen & Schichten**: Listeneinträge `.job` in `index.html` mit `data-shifts` und `data-umfang`.

## Lokal starten
```bash
cd /home/user/Websites && python3 -m http.server 8000
# http://127.0.0.1:8000/arena/reinigung-blitzblank/
```
Keine Build-Schritte, keine externen Requests. GSAP, ScrollTrigger und Lenis liegen unter `assets/vendor/`, die Schrift unter `assets/fonts/` (OFL, Lizenz liegt bei).
