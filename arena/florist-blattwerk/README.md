# Blattwerk Floristik – Modell „Blüte“

Demo-Website für einen **fiktiven** Floristikbetrieb in Heidelberg (Hauptstraße 188, Floristmeisterin Hanna Vogel). Teil der „Arena“ von Filip Kramar. Statisch, ohne Build-Schritt, alle Pfade absolut unter `/arena/florist-blattwerk/`. `noindex` ist gesetzt.

Designsprache: botanisch-editorial – Tiefgrün, Blush, Mohn, Papier und Salbei; Newsreader (Display, kursiv) und Sora (Text); gepresste Blüten als SVG, Herbarium-Rahmen, Bogenmasken.

## Abschnitte

1. Hero mit Bogen-Bildkomposition, „Strauß der Woche“-Etikett und fallenden Blütenblättern (Canvas)
2. Laufband „Im <Monat> im Laden“ (aus dem Saisonkalender berechnet)
3. Leistungen (Liste mit Vorschaubild, das dem Cursor folgt)
4. Strauß-Studio (Konfigurator)
5. Saisonkalender
6. Blumen-Abo
7. Hochzeitsfloristik (horizontale Strecke, auf dem Desktop gepinnt)
8. Trauerfloristik
9. Lieferung & Liefergebiet (PLZ-Check, Bestellschluss-Uhr, SVG-Karte)
10. Über uns / Team (Monogramme statt Fotos), Zahlen
11. Kundenstimmen, FAQ (`<details>`), Kontakt/Bestellung, Footer
12. `impressum.html`, `datenschutz.html` (Muster mit Hinweis)

## Spezial-Features

- **Strauß-Studio:** Blumen (Rosen, Ranunkeln, Tulpen, Eukalyptus, Schleierkraut), Farbwelt und Größe wählen → der SVG-Strauß wächst live (Stiele zeichnen sich, Köpfe blühen auf, Papier und Schleife passen sich an). Preis als Beispielrechnung, Karte mit Nachricht als Live-Vorschau. „Diesen Strauß anfragen“ füllt das Kontaktformular vor.
- **Saisonkalender:** Monats-Tabs (Pfeiltasten, Pos1/Ende), Raster mit 24 Blüten-Icons, Hauptsaison-Markierung, Jahresbalken je Blume, Filter „Nur Saisonblumen“, Monatsempfehlung.
- **Blumen-Abo:** Umschalter wöchentlich / 14-tägig / monatlich mit Preisübersicht, Monatsbetrag und nächstem möglichem Liefertermin.
- **Liefergebiet-Check:** PLZ eingeben (oder Bezirk auf der Karte anklicken) → Zone, Gebühr, Lieferfenster; Bestellung bis 12 Uhr = heute (Zeit in Europe/Berlin, Sonntag ausgenommen). Live-Countdown.
- **Hero-Blütenblätter:** Canvas, weichen dem Mauszeiger aus; pausiert außerhalb des Sichtbereichs, im Hintergrund-Tab und bei reduzierter Bewegung (dann ruhendes Bild).
- Live-Öffnungsstatus (Header, Kontakt, heutiger Tag in der Tabelle hervorgehoben).
- Ohne JavaScript und mit `prefers-reduced-motion` bleibt alles sichtbar und bedienbar; `?motion=off` schaltet Animationen ab. Zum Testen der Uhrzeit-Logik: `?jetzt=2026-10-13T10:30`.

## Anpassen

- **Name, Adresse, Telefon, E-Mail:** in `index.html` (Header, Kontakt, Footer, JSON-LD im `<head>`), `impressum.html`, `datenschutz.html`. Telefon steht als `tel:+4962215551460` und sichtbar als `06221 555 14 60`.
- **Farben/Schriften:** CSS-Variablen in `:root` oben in `style.css` (`--green`, `--blush`, `--poppy`, `--paper`, `--sage` …). Mohn-Varianten `--poppy-btn`/`--poppy-ink` sind für ausreichenden Kontrast abgedunkelt.
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
