# Blitzblank Gebäudereinigung – Demo „Glanz“

Demo-Website für einen **fiktiven** Gebäudereinigungsbetrieb in Mannheim (Blitzblank Gebäudereinigung GmbH, Neckarauer Straße 102). Teil der „Arena“ von Filip Kramar. Alle Namen, Preise, Bewertungen und Daten sind erfunden, die Seite steht auf `noindex`.

Designsprache: hell, frisch, sehr klar – Weiß, Aqua `#19C3D1`, Marine `#0B2545`, sparsam Seifenblasen-Lila `#B9B3FF`, Hellgrau `#F2F6F8`. Eine Schrift (Plus Jakarta Sans, variabel 200–800) mit extremen Gewichtskontrasten (800 neben 220).

## Gestaltungsidee
Die Seite behandelt alles wie eine Glasscheibe: Der erste Bildschirm ist ein beschlagenes Fenster, hinter dem Titel und Besprechungsraum unscharf liegen – ein Abzieher legt den Titel von selbst frei, den Rest wischen Besucher:innen mit Maus oder Finger, Kondensat läuft an den Rändern nach. Beschriftung, Siegel und QR-Quittung kleben *auf* der Scheibe, der Raum liegt *dahinter*. Die Bewegungshandschrift heißt „Abzieher-Zug“: Überschriften und Bilder werden in einem gleichmäßigen Zug von links nach rechts freigelegt (`--ease-pull`, 900 ms), Bedien-Elemente reagieren kurz und federnd (140–220 ms). Durch die Seite ziehen sich Werkzeug und Ritual des Gebäudereinigers: Vorher/Nachher-Schieber mit dem Abzieher, der Ablauf als Schlangenlinie (die Profi-Technik beim Glasabziehen), der Rechner als abgestempelter Reinigungsplan, Seifenblasen bei den Kundenstimmen und zum Schluss ein Schriftzug, der beim Scrollen blank gezogen wird.

## Abschnitte
Header mit Scroll-Fortschritt · Hero „Die Scheibe“ (Canvas-Beschlag, Siegel und QR-Quittung als Aufkleber) · Laufband „Protokoll von heute früh“ (Tempo folgt der Scroll-Geschwindigkeit) · Leistungen als Index-Tabelle mit Vorschaubild am Zeiger (Handy: Wisch-Schiene) · Vorher/Nachher Teeküche (Desktop: Sticky-Bühne, der Abzieher zieht mit dem Scroll; Uhr und Häkchen laufen mit) · Angebotsrechner als Reinigungsplan mit Wochenhäkchen, Stempel und Unterschrift · Leistungs-Checklisten · Ablauf als Schlangenlinie mit mitfahrendem Abzieher · Über uns mit Collage (Tiefe) und Zahlen-Odometer, Team als Dienstausweise · Kundenstimmen mit Seifenblasen (Physik, anstupsen, platzen lassen) · Einsatzgebiet mit PLZ-Check und SVG-Karte · Karriere (Nachtschicht-Kapitel) · FAQ · Kontakt/Begehung anfragen · Footer mit Schriftzug. Dazu `impressum.html` und `datenschutz.html` (Muster).

## Spezial-Features
1. **Wisch-Reveal im Hero** – beschlagene Scheibe über Titel und Foto (Canvas: Raum unscharf nachgemalt, Mikrotröpfchen, Laufspuren). Ein erster Abzieher-Zug legt den Titel nach ~1,5 s von selbst frei, danach ein Glanzlicht über die Typo. Mit Maus oder Finger (quer wischen) weiterwischen, Kondensat läuft als Tropfen nach; ab 55 % freier Fläche wird fertig gewischt. Knopf „Automatisch wischen“ (Schlangenlinien) für Tastatur; bei reduzierter Bewegung ohne Animation.
2. **Angebotsrechner** – Objektart, Fläche (Schieberegler + Zahlenfeld), Intervall, Zusatzleistungen → Monatspreis als Spanne im Stempel, Wochenplan mit Häkchen, Einsätze/Stunden/Team, Leistungsumfang. „Werte in Anfrage übernehmen“ füllt das Kontaktformular vor.
3. **Leistungs-Checklisten** – Tabs (Pfeiltasten, Pos1/Ende) je Reinigungsart, aufklappbare Gruppen mit Häkchen-Animation, „Alle aufklappen“.
4. **Einsatzgebiet-Check** – PLZ eingeben oder Schnellwahl → Pin fliegt auf die SVG-Karte Rhein-Neckar, Zone (12/25/40 km) und Entfernung werden hervorgehoben.
5. **Karriere** – Schichtmodelle als Schalter (`role="switch"`), Tageszeitleiste, gefilterte Stellen, „Bewerbung in 60 Sekunden“ mit Countdown-Ring.
6. **Vorher/Nachher-Schieber** – `input[type=range]` (Tastatur, Ziehen) über der Teeküche; Verschmutzung per Canvas nachgestellt.

Ohne JavaScript, mit `prefers-reduced-motion` oder `?motion=off` sind alle Inhalte sichtbar und bedienbar (kein Beschlag, keine Blasen, Schieber bleibt bedienbar).

## Anpassen
- **Name, Adresse, Telefon, E-Mail**: in `index.html`, `impressum.html`, `datenschutz.html` suchen/ersetzen (`Blitzblank`, `0621 555 70 80`, `+496215557080`, `angebot@blitzblank-reinigung.de`). JSON-LD im `<head>` von `index.html` mitpflegen.
- **Farben**: CSS-Variablen ganz oben in `style.css` (`--aqua`, `--aqua-ink` für Text auf Weiß, `--marine`, `--lilac`, `--mist` …).
- **Bilder**: `assets/img/<name>-960.webp` und `-480.webp` ersetzen (gleiche Namen) – Herkunft siehe `assets/img/BILDNACHWEIS.md`. Das Hero-Foto (`hero`) wird auch für den Beschlag verwendet.
- **Rechner-Werte**: Objekt `CALC` oben in `main.js` (Stundensatz-Spanne, Leistungswerte m²/h je Objektart, Mindestbetrag, Zusatzleistungen). Bewegung: Tokens `--ease-pull`, `--t-press`, `--t-ui`, `--t-pull` oben in `style.css`. Alle Ergebnisse sind als unverbindliche Beispielrechnung gekennzeichnet.
- **Einsatzgebiet**: `ZONES` (Radien, Texte) und `PLACES` (PLZ → Ort, Koordinaten) oben in `main.js`. Die Karte ist eigenes SVG in `index.html` (10 Einheiten = 1 km).
- **Stellen & Schichten**: Listeneinträge `.job` in `index.html` mit `data-shifts` und `data-umfang`.

## Lokal starten
```bash
cd /home/user/Websites && python3 -m http.server 8000
# http://127.0.0.1:8000/arena/reinigung-blitzblank/
```
Keine Build-Schritte, keine externen Requests. GSAP, ScrollTrigger und Lenis liegen unter `assets/vendor/`, die Schrift unter `assets/fonts/` (OFL, Lizenz liegt bei).
