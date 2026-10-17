# KAISER Barbershop – Demo „Messing“

Demo-Website für einen **fiktiven** Barbershop in Köln-Ehrenfeld (Venloer Straße 211). Teil der „Arena“ von Filip Kramar. Alle Namen, Preise, Bewertungen und Termine sind erfunden, die Seite steht auf `noindex`.

## Gestaltungsidee
**Schaufenster-Vergoldung.** Die Seite ist das nächtliche Schaufenster eines Kölner Barbershops: Der Name ist in Blattgold auf schwarzes Glas gelegt – Mattgold mit sichtbaren Blattkanten, Glanzgold an der Kontur, ein ochsenblutroter Blockschatten, wie es Schildermaler seit hundert Jahren machen. Ihr wichtigstes Werkzeug ist die Rasierklinge, mit der das überschüssige Gold freigeschnitten wird. Diese Klinge zieht sich als Motiv durch die ganze Seite: Jede Form wird diagonal „freigeschnitten“, Fotos sitzen in Klingenschnitten statt in Bögen, Aufzählungen tragen Wechselklingen. Material und Orte des Ladens strukturieren die Kapitel: Glas (Schaufenster), Spiegel (Preise), Zeichenpapier (Bart-Skizze), rotes Stuhlleder (Team).

**Motion-System „Klingenzug“:** ruhig ansetzen, entschlossen ziehen, sauber absetzen. Ein Kurvenpaar für alles (`--ease-cut` = starkes ease-in-out für Schnitte, `--ease-out` für UI), feste Dauern als CSS-Variablen (`--t-press` 140 ms, `--t-ui` 200 ms, `--t-cut` 1000 ms, `--t-settle` 1400 ms, `--stagger` 70 ms). Federn nur dort, wo etwas physisch hängt oder folgt (Türschild, Vorschau, magnetische Plakette).

## Abschnitte
Hero „Schaufenster“ (WebGL-Blattgold, Klingenschnitt, Durchblick ins Geschäft, Siegel, pendelndes Türschild „Geöffnet/Geschlossen“, Barber-Pole) · Statement mit vergoldeter Initiale (Wort für Wort vergoldet beim Scrollen) · Leistungen als typografischer Index mit Vorschau im Klingenschnitt · Nassrasur „in vier Akten“ (Sticky-Bühne mit Dampf, Schaum, Klinge und kaltem Nebel) · Preisliste als Art-déco-Spiegel · Bart-Atelier (Kapitel „Papier“) · Galerie der Schnitte · Das Haus (Collage) · Team mit Grundriss des Ladens (Kapitel „Leder“) · Termin-Buchung · Kundenstimmen als Zettel im Spiegelrahmen · Anfahrt mit Türglas-Öffnungszeiten und SVG-Karte · FAQ · Karriere · Footer. Dazu `impressum.html` und `datenschutz.html` (Muster).

## Spezial-Features
- **Blattgold (eigenes WebGL, ohne Bibliothek):** Der Name wird einmal als Maske gerendert; der Shader legt versetzte Blattquadrate mit leicht gekippten Normalen, Knitterstruktur, eine Glanzgold-Facette aus der weichgezeichneten Maske und den Blockschatten an. Das Glanzlicht folgt der Maus (mit Feder), auf Touch-Geräten dem Scroll. Gerendert wird nur bei Bewegung; ohne WebGL, bei reduzierter Bewegung und mit `?motion=off` übernimmt eine CSS-Goldschrift.
- **Klingenschnitt (CSS):** Die Headline wird beim Laden diagonal freigeschnitten (`clip-path`), eine Wechselklinge läuft die Schnittkante entlang. Wartet auf nichts (LCP).
- **Barber-Pole (Canvas):** im Hero eine Säule mit Messingkappen, beim Scrollen wird sie zum schmalen Band am rechten Rand (nur `transform`); die Helix dreht mit dem Scroll-Tempo weiter, ein Messingring zeigt den Lesefortschritt. Im Ruhezustand gedrosselte Bildrate, in Hintergrund-Tabs pausiert.
- **Rasur-Ritual:** klebende Bühne per `position: sticky` (kein GSAP-Pin), Bildwechsel als diagonaler Schnitt, große Konturziffern. Partikel (Canvas 2D, DPR ≤ 1,5): Dampf über dem heißen Tuch, Schaum, den die Klinge im dritten Akt wegschneidet, kalter Nebel im vierten. Schaum ist deterministisch – vor- und zurückscrollen ergibt dasselbe Bild. Auf dem Handy: Wisch-Schiene.
- **Art-déco-Spiegel:** gestufter Messingrahmen mit Giebel, altes Spiegelglas mit blinden Stellen, ein gegenläufig wanderndes Spiegelbild (Scroll + Zeiger) und eine Lichtbahn. Hover/Fokus/Tippen auf eine Zeile zeigt Dauer, Inhalt und Preis auf einer facettierten Glasplatte.
- **Bart-Konfigurator:** SVG-Profil, vier Bartstile morphen weich, eine rote Kreidelinie zeichnet die neue Kontur nach.
- **Galerie:** ziehbare Strecke mit Trägheit und Gummiband; Bilder in Klingenschnitt-Masken, die sich beim Hereinscrollen öffnen und beim Ziehen in der Maske gegenläufig wandern.
- **Kapitelfarben:** Die ganze Seite wechselt beim Scrollen weich die Farbe (registrierte CSS-Variablen per `@property`).
- **Termin-Buchung in 3 Schritten:** Leistung → Barbier (Monogramm-Karten) → Zeitslot-Raster der nächsten 7 Tage mit belegten Slots (Desktop Wochenraster mit Pfeiltasten, Handy Tages-Tabs), Live-Zusammenfassung mit Preis/Dauer, Validierung, Erfolgsansicht mit .ics. Es wird nichts gesendet.
- Mikro-Interaktionen: Zeichen-Rollen in Navigation und Plaketten, magnetische Hero-Plakette, Glanzlicht auf vergoldeten Buttons, sich zeichnende Linien, Team-Name → Stuhl im Grundriss.

## Anpassen
- **Name, Telefon, Adresse, Zeiten:** direkt in `index.html` (Header, Hero, Standort, Footer, JSON-LD im `<head>`), `impressum.html`, `datenschutz.html`.
- **Farben:** CSS-Variablen oben in `style.css` (`--tabak`, `--messing`, `--bein`, `--papier`, `--ochsenblut`, `--leder`, `--gold-leaf`, `--shade`); die Kapitelfarben direkt darunter. Barber-Pole: `POLE_BANDS`, Blattgold: `GOLD` (Blattgröße, Schattenversatz, Facette) oben in `main.js`.
- **Buchungslogik:** Konstanten oben in `main.js`: `SERVICES`, `BARBERS`, `MEISTER_AUFSCHLAG`, `HOURS`, `SLOT_MIN`, `DAYS_AHEAD`, `VORLAUF_MIN`, `BELEGT_QUOTE` (Demo-Belegung, deterministisch pro Tag).
- **Preisliste:** Zeilen in `index.html` (`.pc-item`, Inhalt in `.pc-more`, `data-book` verknüpft mit der Buchung).
- **Bartstile:** `BEARDS` in `main.js` (alle Formen haben gleich viele Punkte, damit sie morphen).
- **Bilder:** `assets/img/<name>-960.webp` und `-480.webp` ersetzen (gleiche Namen) oder Pfade/`srcset` im HTML anpassen. Fotos werden nie breiter als 960 CSS-px dargestellt.

## Lokal starten
```
cd /home/user/Websites && python3 -m http.server 8800
```
Dann http://127.0.0.1:8800/arena/barbershop-kaiser/ öffnen. `?motion=off` schaltet alle Animationen ab.

## Technik & Hinweise
Statisch, ohne Build. GSAP 3 + ScrollTrigger und Lenis liegen unter `assets/vendor/`; der Start läuft in Etappen (Hero sofort, alles andere in kleinen Häppchen, Blattgold erst nach dem Klingenschnitt im Leerlauf). Schriften (nur `latin`, OFL) unter `assets/fonts/`. Keine externen Requests, keine Cookies. Ohne JavaScript und bei `prefers-reduced-motion` bleibt alles sichtbar und bedienbar.

Bildquellen: siehe `assets/img/BILDNACHWEIS.md` (StockSnap, CC0).
