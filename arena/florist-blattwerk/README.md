# Blattwerk Floristik – Modell „Blüte“

Demo-Website für einen **fiktiven** Floristikbetrieb in Heidelberg (Hauptstraße 188, Floristmeisterin Hanna Vogel). Teil der „Arena“ von Filip Kramar. Statisch, ohne Build-Schritt, alle Pfade absolut unter `/arena/florist-blattwerk/`. `noindex` ist gesetzt.

Designsprache: Herbarium – Tiefgrün, Blush, Mohn, Papier und Salbei; Newsreader (Display mit optischen Größen, kursiv) und Sora (Text); gepresste Blüten als SVG, Herbarbögen, Etiketten, Klebestreifen.

## Gestaltungsidee

Die ganze Seite ist ein Herbarium: Jeder Abschnitt ist ein Bogen, auf dem etwas aufgelegt, beschriftet und festgeklebt wird. Im Hero öffnet sich ein gezeichneter Klatschmohn auf einem Herbarbogen, das Foto ist als Beleg aufgeklebt, und statt einer Kennzahlenreihe steht alles Wichtige (Fundort, Floristmeisterin, Bewertungen, Lieferschluss heute) auf dem Herbar-Etikett. Die Bewegungs-Handschrift heißt „Wachsen & Sinken“: Überschriften wachsen aus einer Grundlinie, Stiele zeichnen sich, Blüten gehen auf, Gepresstes wird aufgelegt, Blütenblätter sinken – UI-Rückmeldungen bleiben dagegen kurz und knapp. Der Konfigurator ist ein Bindetisch mit Schneidematte, der Saisonkalender ein drehbares Blütenrad, die Hochzeit eine Strecke mit drei Tiefenebenen, und für die Trauerfloristik wird die Seite in einem Kreis dunkelgrün.

## Abschnitte

1. Hero „Herbarbogen Nº 188“: kinetische Überschrift (Buchstaben wachsen aus der Grundlinie), SVG-Mohn zeichnet sich und blüht auf (nickt dem Mauszeiger nach), aufgeklebtes Foto, Herbar-Etikett mit Vertrauensdaten und „Strauß der Woche“, fallende Blütenblätter und Blätter (Canvas, Windstoß beim Scrollen)
2. Laufband „Im <Monat> im Laden“ (reagiert auf Scroll-Geschwindigkeit)
3. Leistungen als Index der Bögen (römische Nummern, gepresste Belege wachsen beim Scrollen, Vorschaubild folgt dem Cursor, Zeichen-Rollen beim Hover)
4. Bindetisch (Konfigurator) auf Schneidematte mit Schere und Bindfaden, Bestellzettel als Steuerung
5. Saisonkalender als Blütenrad (Monate rund um das Rad, Federdrehung, Drall beim Scrollen)
6. Blumen-Abo als Preisliste mit handgezeichnetem Kreis
7. Hochzeitsfloristik: horizontale Strecke mit Tiefe (Hintergrundschrift langsam, Fotos, gepresste Zweige im Vordergrund schnell; CSS-sticky statt Pin)
8. Trauerfloristik: Kapitel, in dem die Seite kreisförmig dunkelgrün wird
9. Lieferung & Liefergebiet (PLZ-Check zeichnet die Route vom Laden auf der SVG-Karte, Bestellschluss-Uhr)
10. Werkbank / Team: Text füllt sich Wort für Wort mit Tinte, Randnotizen statt Zahlenreihe, Monogramm-Liste
11. Pinnwand (Kundenstimmen mit Stempel 4,9/302), FAQ (`<details>`), Bestellzettel/Kontakt, Footer
12. `impressum.html`, `datenschutz.html` (Muster mit Hinweis)

## Spezial-Features

- **Strauß-Studio:** Blumen (Rosen, Ranunkeln, Tulpen, Eukalyptus, Schleierkraut), Farbwelt und Größe wählen → der SVG-Strauß wächst live (Stiele zeichnen sich, Köpfe blühen auf, Papier und Schleife passen sich an). Preis als Beispielrechnung, Karte mit Nachricht als Live-Vorschau. „Diesen Strauß anfragen“ füllt das Kontaktformular vor.
- **Saisonkalender (Blütenrad):** Monats-Tabs rund um das Rad (Pfeiltasten, Pos1/Ende), das Rad dreht den gewählten Monat unter die Nadel; Raster mit 24 Blüten-Icons, Hauptsaison-Markierung, Jahresbalken je Blume, Filter „Nur Saisonblumen“, Monatsempfehlung.
- **Blumen-Abo:** Umschalter wöchentlich / 14-tägig / monatlich mit Preisübersicht, Monatsbetrag und nächstem möglichem Liefertermin.
- **Liefergebiet-Check:** PLZ eingeben (oder Bezirk auf der Karte anklicken) → Zone, Gebühr, Lieferfenster, gezeichnete Route; Bestellung bis 12 Uhr = heute (Zeit in Europe/Berlin, Sonntag ausgenommen). Live-Countdown.
- **Hero-Blütenblätter:** Canvas, weichen dem Mauszeiger aus; pausiert außerhalb des Sichtbereichs, im Hintergrund-Tab und bei reduzierter Bewegung (dann ruhendes Bild).
- Live-Öffnungsstatus (Header, Kontakt, heutiger Tag in der Tabelle hervorgehoben).
- Ohne JavaScript und mit `prefers-reduced-motion` bleibt alles sichtbar und bedienbar; `?motion=off` schaltet Animationen ab. Zum Testen der Uhrzeit-Logik: `?jetzt=2026-10-13T10:30`.

## Anpassen

- **Name, Adresse, Telefon, E-Mail:** in `index.html` (Header, Kontakt, Footer, JSON-LD im `<head>`), `impressum.html`, `datenschutz.html`. Telefon steht als `tel:+4962215551460` und sichtbar als `06221 555 14 60`.
- **Farben/Schriften/Bewegung:** CSS-Variablen in `:root` oben in `style.css` und im Block „NEUGESTALTUNG“ (`--dur-grow`, `--dur-bloom`, `--stagger`, `--dusk` …) (`--green`, `--blush`, `--poppy`, `--paper`, `--sage` …). Mohn-Varianten `--poppy-btn`/`--poppy-ink` sind für ausreichenden Kontrast abgedunkelt.
- **Preise und Regeln:** dokumentierte Konstanten oben in `main.js` – `SIZES`, `FLOWERS` (Aufpreise je Größe), `PALETTES`, `ABO` (Grundpreise, Rabatte, Liefertage), `CUTOFF_HOUR`, `ZONES` (Gebühren, Lieferfenster), `PLZ` (Postleitzahl → Zone), `HOURS` (Öffnungszeiten). Sichtbare Standardwerte im HTML (Preise in Leistungen, Abo-Karten, Größen-Kacheln) bei Bedarf mitziehen.
- **Saisonkalender:** jede Blume ist ein `<li class="sf" data-m="7-10" data-p="8-9">` in `index.html` (Monate in Saison / Hauptsaison, Bereiche über den Jahreswechsel wie `11-2` sind erlaubt). Icon über `<use href="#i-…">`, Farben über `--c`/`--c2`.
- **Bilder:** liegen als `assets/img/<name>-960.webp` und `-480.webp` vor; gleiche Namen ersetzen oder `src`/`srcset` anpassen. Herkunft und Lizenz siehe `assets/img/BILDNACHWEIS.md`.
- **SVG-Sprite** (Blüten-Icons, gepresste Blumen) ist inline am Anfang des `<body>`.

## Lokal starten

```bash
cd /home/user/Websites
python3 -m http.server 8841
# http://127.0.0.1:8841/arena/florist-blattwerk/
```

Schriften (Newsreader, Sora – SIL OFL) sind selbst gehostet unter `assets/fonts/`, Lizenzen liegen daneben. Es werden keine externen Ressourcen geladen.
