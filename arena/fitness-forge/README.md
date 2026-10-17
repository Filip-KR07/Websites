# FORGE Athletic Club – Demo „Schmiede“

Demo-Website für ein **fiktives** Fitnessstudio in Berlin-Friedrichshain (Revaler Straße 99). Teil der „Arena“ von Filip Kramar. Alle Namen, Preise, Kurse und Bewertungen sind erfunden, die Seite steht auf `noindex`.

## Gestaltungsidee
„Wildplakat & Eisen“: Die Revaler Straße ist eine der lautesten Plakatwände Berlins – hier klebt Papier in Schichten über Beton. Die Seite ist deshalb wie ein frisch geklebtes Plakat gebaut (Beschnittmarken, Passerkreuz, Kontrollstreifen, verrutschte rote Druckplatte, Abrisskanten, Gaffa-Tape, Zettel mit Abreiß-Streifen) und trifft auf die Mechanik der Halle: Der Kursplan ist eine Abfahrtstafel mit Klappzeichen wie am Ostkreuz, die Mitgliedschaft wird als Hantel mit Scheiben „aufgelegt“, das Probetraining läuft auf einer Siebensegment-Rundenuhr. Fotografie bleibt schwarz-weiß, Glut-Rot ist die einzige Signalfarbe. Die Bewegungs-Handschrift ist „schwer und mechanisch“: kurz anreißen, satt absetzen mit leichtem Nachfedern, harte Schnitte in Stufen statt weicher Überblendungen, Bewegungsunschärfe nur bei echtem Tempo.

## Abschnitte
Hero-Plakat (kinetische Typo, Streifen-Canvas, Probetraining-Zettel, Live-Kurs als Klapptafel) · Absperrband · Disziplinen (klebendes Bild mit harten Schnitten) · Kursplan (Abfahrtstafel + Wochenraster) · Mitgliedschaft (Hantel-Konfigurator + Wiegeschein) · Trainingsplan-Generator (angeklebte Zettel) · Coaches (Strecke mit Tiefe, Flip-Karten, Aushang Karriere) · Die Halle (annotiertes Hallenfoto, Kontaktabzug „Ein Tag in der Halle“) · Probetraining in vier Runden (Rundenuhr) · Stimmen (Strichliste mit 530 Strichen) · Standort (SVG-Karte, Öffnungszeiten) · FAQ · Probetraining-Anfrage · Footer. Dazu `impressum.html` und `datenschutz.html` (Muster).

## Set Pieces und Spezial-Features
- **Kinetische Hero-Typo:** STARK. / SCHNELL. / FORGE. gleiten scroll-gescrubbt gegeneinander. Das Scroll-Tempo streckt und staucht jedes Wort über die Variable-Font-Achsen von Big Shoulders (`opsz` 72 → 10 macht die Buchstaben breiter, `wght` 800 → 900) plus `scaleY`/`skewX`, gefedert mit Nachschwingen; dazu ein Bewegungsunschärfe-Echo. Zeiger oder Finger auf einem Wort lässt es „anspannen“. Die Wörter sind links verankert, die Breitenänderung verschiebt kein Layout. Dahinter: Streifen-/Kreidestaub-Canvas (pausiert außerhalb des Bildschirms und in Hintergrund-Tabs).
- **Abfahrtstafel (Kursplan):** Klappzeichen-Tafel mit den nächsten Kursen ab jetzt (Zeit, Kurs, Coach, Ort, Status „LÄUFT“/„IN 25 MIN“). Sie klappt beim Hereinscrollen auf und folgt sofort den Filtern (Disziplin, Level, Coach). Darunter das vollständige Wochenraster (46 Kurse) mit Live-Markierung „läuft jetzt“, Tages-Tabs auf dem Handy (Pfeiltasten) und Kurs-Dialog („Als Probetraining wählen“ füllt das Formular vor). Testen: `?jetzt=Di-18:45`.
- **Hantel-Konfigurator:** Zugang, Laufzeit, Extras, Ermäßigung, Personal Training – jede Option legt eine Scheibe auf (Federphysik, die Stange federt beim Aufsetzen), Abschläge erscheinen als gestrichelte „Geisterscheiben“. Beim Hereinscrollen werden die Scheiben nacheinander aufgelegt. Monatspreis als rollendes Zählwerk, Wiegeschein mit Positionen, Startpaket und Jahressumme. Auf dem Handy klebt die Hantel samt Preis oben.
- **Laufband-Typo:** zwei gekreuzte Absperrbänder, die mit dem Scroll beschleunigen, die Richtung wechseln und sich neigen.
- **Coaches als Strecke mit Tiefe** (ab 900 px, `position: sticky` + Scrub): Karten kommen aus der Tiefe nach vorn und weichen wieder zurück; 3D-Flip per Hover, Klick, Tippen oder Tastatur (Escape schließt). Auf dem Handy eine Wisch-Schiene.
- **Trainingsplan-Generator:** Ziel (als typografische Auswahl) + Tage/Woche + Erfahrung → sieben Wochenplan-Zettel mit passendem Kurs; Drucken, als Text speichern, kopieren. Deutlich als Orientierung ohne Gesundheitsversprechen gekennzeichnet.
- Weitere Details: harte Bildschnitte in vier Stufen (Disziplinen, Reveals), annotiertes Hallenfoto mit sich zeichnenden Linien, Kontaktabzug mit Fettstift-Kreis, Siebensegment-Rundenuhr mit Geistersegmenten, Strichliste, die beim Scrollen „gezählt“ wird, Abreiß-Streifen, magnetische Buttons, Zeichen-Rollen auf Navigation und Text-Buttons, Kontext-Etikett am Mauszeiger (folgt auch beim Scrollen dem Inhalt unter dem Zeiger), Coach-Hinweis als angeklebter Aushang, FAQ als Plakat-Aufzählung mit Kontur-Nummern, geöffnet/geschlossen-Status im Header.

## Motion-System
CSS-Variablen oben in `style.css`: `--ease-out`, `--ease-in-out`, `--ease-drawer`, `--ease-slam` (easeOutBack für „Last landet“), `--cut` (`steps(4)` für harte Schnitte), Dauern `--t-press` 140 ms, `--t-ui` 220 ms, `--t-cut` 420 ms, `--t-slam` 620 ms, Stagger 40 ms. Federn in `main.js` (Hero-Wörter k 170/d 15, Scheiben k 320/d 23). Animiert werden nur `transform`, `opacity`, `clip-path` und einmalig die Schriftachsen. `prefers-reduced-motion`: sanfte Überblendungen statt Bewegung, kein Lenis. `?motion=off` schaltet alles ab. Ohne JavaScript ist alles sichtbar und bedienbar.

## Anpassen
- **Name, Telefon, Adresse, Zeiten:** direkt in `index.html` (Header, Hero, Standort, Footer, JSON-LD im `<head>`), `impressum.html`, `datenschutz.html`. Öffnungszeiten für die Live-Logik: `OEFFNUNG` oben in `main.js`.
- **Farben:** CSS-Variablen oben in `style.css` (`--asphalt`, `--eisen`, `--kreide`, `--papier`, `--glut`, `--glut-ink` …).
- **Kurse:** als Liste in `index.html` (`.woche__tag` → `.kurs` mit `data-typ`, `data-level`, `data-coach`, `data-start`, `data-ende`, `data-raum`). Beschreibungen für den Dialog: `KURSINFO` in `main.js`, Coach-Namen: `COACHES`, Kürzel für die Tafel: `ABK`, Spaltenbreiten: `BOARD_COLS`.
- **Preise:** `PREISE` oben in `main.js` (Zugang, Laufzeit-Aufschlag, Extras, Ermäßigung, Personal Training, Startpaket); Aussehen der Scheiben: `PLATE`. Die Preistabelle im HTML (`.pricelist`) bei Änderungen mitpflegen.
- **Trainingsplan:** `PLAN_TAGE`, `PLAN_ERFAHRUNG`, `PLAN_ZIELE` und `EINHEITEN` in `main.js`. Der statische Standardplan im HTML ist der Fallback ohne JavaScript.
- **Bilder:** `assets/img/<name>-960.webp` und `-480.webp` ersetzen (gleiche Namen) oder Pfade/`srcset` im HTML anpassen. Fotos werden nie breiter als 960 CSS-px dargestellt. Die Hallen-Annotationen (Linien und Etiketten) sind auf `ring-960.webp` abgestimmt – bei anderem Foto Koordinaten in `.anno` anpassen.

## Lokal starten
```
cd /home/user/Websites && python3 -m http.server 8800
```
Dann http://127.0.0.1:8800/arena/fitness-forge/ öffnen. `?motion=off` schaltet alle Animationen ab.

## Technik & Hinweise
Statisch, ohne Build. GSAP 3 + ScrollTrigger und Lenis liegen unter `assets/vendor/`, Schriften (nur `latin`, OFL) unter `assets/fonts/` – Big Shoulders als Variable Font mit den Achsen `wght` und `opsz`. Keine externen Requests, keine Cookies. Klebende Abschnitte mit CSS `position: sticky` (keine GSAP-Pins), Start in Etappen.

Bildquellen: siehe `assets/img/BILDNACHWEIS.md` (StockSnap, CC0).
