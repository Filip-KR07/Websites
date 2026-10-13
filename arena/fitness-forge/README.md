# FORGE Athletic Club – Demo „Schmiede“

Demo-Website für ein **fiktives** Fitnessstudio in Berlin-Friedrichshain (Revaler Straße 99). Teil der „Arena“ von Filip Kramar. Alle Namen, Preise, Kurse und Bewertungen sind erfunden, die Seite steht auf `noindex`.

Designsprache: kraftvoll, schnell, kinetisch – Asphalt `#0D0D0F`, Eisen `#2B2D31`, Kreide `#F2F2EE`, Glut-Rot `#FF3B2F` als einziger Akzent. Display-Schrift Big Shoulders Display (variabel), Text Inter Tight (variabel). Harte Schnitte, schräge Kanten, Zähler und Stoppuhr-Ästhetik.

## Abschnitte
Hero (kinetische Typo + Streifen-Canvas, Satzpausen-Stoppuhr, Live-Kurs) · Laufbänder · Disziplinen (horizontale Strecke) · Kursplan · Mitgliedschaft (Konfigurator) · Trainingsplan-Generator · Coaches (Flip-Karten) + Karriere · Die Halle (Kennzahlen, „Ein Tag in der Halle“) · Probetraining in vier Runden · Stimmen · Standort (SVG-Karte, Öffnungszeiten) · FAQ · Probetraining-Anfrage · Footer. Dazu `impressum.html` und `datenschutz.html` (Muster).

## Spezial-Features
- **Kinetische Hero-Typo:** STARK. / SCHNELL. / FORGE. gleiten scroll-gescrubbt gegeneinander (GSAP ScrollTrigger), die Scroll-Geschwindigkeit neigt die Wörter und erzeugt ein Bewegungsunschärfe-Echo. Dahinter eine Canvas mit Lichtspuren und Kreidestaub – schneller beim Scrollen, „Windschatten“ an der Mausposition. Pausiert außerhalb des Viewports und in Hintergrund-Tabs.
- **Kursplan:** Wochenraster (46 Kurse) mit Filtern für Disziplin, Level und Coach, Live-Markierung „läuft jetzt“ inkl. Restzeit nach Berliner Uhrzeit, „als Nächstes“, vergangene Kurse gedimmt. Auf dem Handy Tages-Tabs (Pfeiltasten). Klick auf einen Kurs öffnet einen Dialog; „Als Probetraining wählen“ füllt das Anfrageformular vor. Zum Testen: `?jetzt=Di-18:45`.
- **Mitgliedschafts-Konfigurator:** Zugang, Laufzeit, Extras (Sauna ist in All Access enthalten), Ermäßigung und Personal Training; Monatspreis als rollendes Zählwerk, Kassenbon mit Positionen, Startpaket und Summe für 12 Monate. Auf dem Handy schwebt der Preis mit.
- **Trainingsplan-Generator:** Ziel + Tage/Woche + Erfahrung → sieben Wochenplan-Karten mit Einheiten, Intensität und passendem Kurs aus dem Plan; Drucken (eigenes Druck-Layout), als Text speichern, kopieren. Deutlich als Orientierung ohne Gesundheitsversprechen gekennzeichnet.
- **Coach-Karten:** drehen sich bei Hover (Maus) bzw. Tippen (Touch) in 3D um und zeigen Spezialgebiet, Stationen und Kurse; per Tastatur mit Fokusführung und Escape.
- Weitere Details: Stoppuhr im Probetraining-Ablauf läuft mit dem Scrollen, „Ein Tag in der Halle“ als Zeitraffer-Strecke, Zähler, Kartenroute, geöffnet/geschlossen-Status im Header.

## Anpassen
- **Name, Telefon, Adresse, Zeiten:** direkt in `index.html` (Header, Hero, Standort, Footer, JSON-LD im `<head>`), `impressum.html`, `datenschutz.html`. Öffnungszeiten für die Live-Logik: `OEFFNUNG` oben in `main.js`.
- **Farben:** CSS-Variablen oben in `style.css` (`--asphalt`, `--eisen`, `--kreide`, `--glut`, `--glut-ink` …).
- **Kurse:** als Liste in `index.html` (`.woche__tag` → `.kurs` mit `data-typ`, `data-level`, `data-coach`, `data-start`, `data-ende`, `data-raum`). Beschreibungen für den Dialog: `KURSINFO` in `main.js`, Coach-Namen: `COACHES`.
- **Preise:** `PREISE` oben in `main.js` (Zugang, Laufzeit-Aufschlag, Extras, Ermäßigung, Personal Training, Startpaket). Die Preistabelle im HTML (`.pricelist`) bei Änderungen mitpflegen.
- **Trainingsplan:** `PLAN_TAGE`, `PLAN_ERFAHRUNG`, `PLAN_ZIELE` und `EINHEITEN` in `main.js`. Der statische Standardplan im HTML ist der Fallback ohne JavaScript.
- **Bilder:** `assets/img/<name>-960.webp` und `-480.webp` ersetzen (gleiche Namen) oder Pfade/`srcset` im HTML anpassen. Fotos werden nie breiter als 960 CSS-px dargestellt.

## Lokal starten
```
cd /home/user/Websites && python3 -m http.server 8800
```
Dann http://127.0.0.1:8800/arena/fitness-forge/ öffnen. `?motion=off` schaltet alle Animationen ab.

## Technik & Hinweise
Statisch, ohne Build. GSAP 3 + ScrollTrigger und Lenis liegen unter `assets/vendor/`, Schriften (nur `latin`, OFL) unter `assets/fonts/`. Keine externen Requests, keine Cookies. Ohne JavaScript und bei `prefers-reduced-motion` bleibt alles sichtbar und bedienbar (Kursplan als Liste, Standardplan statisch, Coach-Rückseiten offen).

Bildquellen: siehe `assets/img/BILDNACHWEIS.md` (StockSnap, CC0).
