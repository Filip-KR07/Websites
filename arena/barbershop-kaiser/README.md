# KAISER Barbershop – Demo „Messing“

Demo-Website für einen **fiktiven** Barbershop in Köln-Ehrenfeld (Venloer Straße 211). Teil der „Arena“ von Filip Kramar. Alle Namen, Preise, Bewertungen und Termine sind erfunden, die Seite steht auf `noindex`.

Designsprache: dunkel, vintage-modern – Tabak-Schwarz, Messing, Knochenweiß, Ochsenblut. Display-Schrift Bodoni Moda (variabel, mit optischer Größe), Labels und Preise in Barlow Condensed (Versalien). Art-déco-Rahmen, gestufte Ecken, Fächer-Ornamente.

## Abschnitte
Hero (Barber-Pole + Bogen-Foto, Laufband) · Statement mit Kennzahlen · Leistungen (4 Tafeln) · Nassrasur „in vier Akten“ (gepinnte Szene) · Preisliste (Art-déco-Karte) · Bart-Atelier · Galerie · Das Haus · Team (Monogramme) · Termin-Buchung · Kundenstimmen · Anfahrt & Öffnungszeiten (SVG-Karte) · FAQ · Karriere · Footer. Dazu `impressum.html` und `datenschutz.html` (Muster).

## Spezial-Features
- **Barber-Pole (Canvas):** Helix-Streifen werden pro Frame auf einen Zylinder projiziert; das Drehtempo folgt der Scroll-Geschwindigkeit (nach oben scrollen dreht kurz rückwärts). Pausiert außerhalb des Viewports und in Hintergrund-Tabs, bei reduzierter Bewegung statisch.
- **Headline-Reveal** per `clip-path`, gestaffelt.
- **Termin-Buchung in 3 Schritten:** Leistung → Barbier (Monogramm-Karten, „Egal“ = erster freier Stuhl) → Zeitslot-Raster der nächsten 7 Tage mit belegten Slots (Desktop: Wochenraster mit Pfeiltasten-Navigation, Handy: Tages-Tabs). Längere Leistungen blockieren mehrere Slots, Arbeitstage je Barbier, Meisterzuschlag. Live-Zusammenfassung mit Preis/Dauer, Validierung, Erfolgsansicht mit .ics-Download. Es wird nichts gesendet.
- **Preisliste:** Hover/Fokus auf eine Zeile zeigt Dauer, Inhalt und Preis auf einer Detailtafel (Desktop); auf schmalen Bildschirmen klappt die Tafel unter der angetippten Zeile auf.
- **Bart-Atelier:** SVG-Profil, vier Bartstile (Vollbart, Stoppel, Ducktail, Schnauzer) morphen weich (Punkt-Interpolation + Catmull-Rom-Kurven), nummerierte Barbier-Markierungen wandern mit.
- **Galerie:** ziehbare Strecke mit Trägheit, Gummiband an den Rändern, Zieh-Cursor (Maus), Trackpad-Wischen, Pfeiltasten und Buttons.
- Deep-Links: „… buchen“-Buttons in Leistungen, Preisen, Bart-Atelier und Team befüllen die Buchung vor.

## Anpassen
- **Name, Telefon, Adresse, Zeiten:** direkt in `index.html` (Header, Hero, Standort, Footer, JSON-LD im `<head>`), `impressum.html`, `datenschutz.html`.
- **Farben:** CSS-Variablen oben in `style.css` (`--tabak`, `--messing`, `--bein`, `--ochsenblut` …). Die Barber-Pole-Farben stehen in `main.js` (`BANDS` in `initPole`).
- **Buchungslogik:** Konstanten oben in `main.js`: `SERVICES` (Name, Dauer, Preis), `BARBERS` (Arbeitstage), `MEISTER_AUFSCHLAG`, `HOURS`, `SLOT_MIN`, `DAYS_AHEAD`, `VORLAUF_MIN`, `BELEGT_QUOTE` (Demo-Belegung, deterministisch pro Tag erzeugt).
- **Preisliste:** Zeilen in `index.html` (`.pc-item`, Inhalt in `.pc-more`, `data-book` verknüpft mit der Buchung).
- **Bartstile:** Punktlisten und Texte in `BEARDS` in `main.js` (alle Formen haben gleich viele Punkte, damit sie morphen können).
- **Bilder:** `assets/img/<name>-960.webp` und `-480.webp` ersetzen (gleiche Namen) oder Pfade/`srcset` im HTML anpassen. Fotos werden nie breiter als 960 CSS-px dargestellt.

## Lokal starten
```
cd /home/user/Websites && python3 -m http.server 8800
```
Dann http://127.0.0.1:8800/arena/barbershop-kaiser/ öffnen. `?motion=off` schaltet alle Animationen ab.

## Technik & Hinweise
Statisch, ohne Build. GSAP 3 + ScrollTrigger und Lenis liegen unter `assets/vendor/`, Schriften (nur `latin`, OFL) unter `assets/fonts/`. Keine externen Requests, keine Cookies. Ohne JavaScript und bei `prefers-reduced-motion` bleibt alles sichtbar und bedienbar.

Bildquellen: siehe `assets/img/BILDNACHWEIS.md` (StockSnap, CC0).
