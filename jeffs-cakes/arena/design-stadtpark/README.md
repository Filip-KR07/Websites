# Jeff's Cheesecake – Variante „Stadtpark“

Arena-Variante für [Jeff's Cheesecake](https://jeffscakes.com/), Café Linnering 5, 22299 Hamburg-Winterhude.

## Konzept

**Ein Hamburger Café-Magazin.** Die Seite ist wie ein ruhiges, helles Stadtteilheft aufgebaut: Folio-Zeile
(„Herbst 2026 · Hamburg-Winterhude · Café seit Juli 2023“), große Serif (Newsreader mit optischer Größe), viel Weißraum,
Haarlinien statt Kästen und Bewegung nur als weiches Einblenden.

- **Das Café steht vorn.** Titel „Ein Stück New York am Stadtpark“, direkt darunter ein Service-Kasten mit
  Live-Status (Zeitzone Hamburg), Adresse, „Route planen“ und Telefon. Auf dem Handy (390 × 844) liegt der
  Route-Knopf bei etwa 430 px, auf 320 × 568 bei etwa 465 px – wer im Stadtpark steht, sieht sofort, ob offen ist
  und wie er hinkommt. Der Status steht zusätzlich als kleiner Chip im Kopf („Offen bis 19“), auf jeder Scrollhöhe.
- **Die Jahreszeit spielt mit.** Ein Saison-Aufmacher mit eigener Tönung: im Herbst Pumpkin Polka, im Winter
  Cinnamon Crossover („genau richtig zur Adventszeit“), im Frühling/Sommer Latin Lemon („schön sommerlich“).
  Akzentfarbe, Navigationspunkt, Folio und Reihenfolge im Raster wechseln mit (Herbstlaub, Zimt, Zitrone).
- **Die Kuchen als edles Raster.** 18 Kuchen, jeder Fotoabzug im hellen Passepartout. Die dunklen Jazz-Fotos sind
  enger um den Kuchen beschnitten und leicht matt getönt (Schwarzpunkt angehoben), damit sie neben den hellen
  Produktfotos ruhig bleiben. Filter glutenfrei / laktosefrei / vegan. Auf dem Handy eine ruhige Liste
  (Bild links, Text rechts) statt langer Kartenstapel.
- **Jeffs Geschichte als Magazin-Feature:** Dachzeile, zentrierte Überschrift, kursiver Vorspann, Initial,
  Zitat mit Porträt und eine kleine Bildstrecke aus drei dunklen Fotos („Die Kuchen heißen wie Musikstücke“).
- Kein Plattenteller, keine Setlist: Musik kommt nur dort vor, wo sie zur Geschichte gehört.

## Aufbau

| Abschnitt | Inhalt |
|---|---|
| Kopf | Logo, Navigation (Desktop), Live-Status-Chip, Bestellung mit Zähler, Menü (Handy, helles Vollbild-Blatt mit Status und Route) |
| Titel `#top` | Folio, „Ein Stück New York am Stadtpark“, Service-Kasten (Status, Adresse, Route, Telefon), Café-Foto (Desktop Hochformat, Handy quer), Vorspann |
| Café `#cafe` | „Unter den Bäumen“: seit Juli 2023, Öffnungszeiten mit „heute“-Markierung, Adresse, Koordinaten, Route, Telefon, Angebot (Kuchen, Kaffee von Black Delight, Snacks), Google-Bewertungen |
| Saison `#saison` | Aufmacher je nach Jahreszeit mit Preisen und Bestellknopf |
| Die Kuchen `#karte` | 18 Kuchen mit Text, Preis, Diät-Hinweis; Filter; Klick öffnet den Kuchen-Dialog (Größe, Optionen, Anzahl) |
| Porträt `#jeff` | New York, 1970er: Text mit Initial, Zitat, Jeff-Porträt, Bildstrecke (öffnet die jeweiligen Kuchen) |
| Für Feste `#anlaesse` | Cheese(cup)cakes, Bebop Brownies, Anfrage für Größeres |
| So bestellst du `#bestellen` | Drei Schritte, Kasten „Gut zu wissen“ (Winterpause, Lieferung, Abholung) |
| Fuß | Stadtpark-Grün: Café, Kontakt, Inhalt, Impressum, Datenschutz |
| Bestellung (Dialog) | 1 Kuchen · 2 Abholen/Liefern · 3 Wann (Schnellwahl der nächsten 6 möglichen Tage + Datumsfeld + Uhrzeit) · 4 Kontakt · 5 Bezahlen (PayPal/Überweisung) → `mailto:` |

## Bestellung

Regeln wie in der Basis (von jeffscakes.com): mindestens drei Werktage Vorlauf (gerechnet ab dem heutigen Datum in
Hamburg, nicht dem des Geräts), Winterpause 23.12.–11.1., Lieferung nur im Hamburger Raum (PLZ 20000–22999) zwischen
11 und 19 Uhr, Abholung zu den Café-Zeiten des gewählten Tages, Hinweis bei Überweisung (frühestens zwei Tage nach
Zahlungseingang). „Bestellung absenden“ öffnet das E-Mail-Programm mit der fertigen Bestellung an info@jeffscakes.com.
Für den Livegang in `js/main.js`, Abschnitt 6, den `mailto:`-Teil durch den Aufruf des Bestell-Servers ersetzen.
Der Warenkorb liegt im `localStorage` unter `jeffs-stadtpark-bestellung` (eigener Schlüssel, damit sich die
Arena-Varianten auf demselben Server nicht in die Quere kommen).

## Anpassen

- **Kuchen:** je ein `<li class="kuchen">` in `#karte`. Größen und Preise in `data-groessen`, Optionen in
  `data-optionen`, Filter in `data-diaet`, Bild unter `img/k/<data-id>-400.webp` (bei `data-gross="1"` zusätzlich
  `-800.webp`). Der Kommentar über dem Raster erklärt alles. Neue Bilder im Format 4:3, z. B. per ImageMagick:
  `convert quelle.png -resize 400x300^ -gravity center -extent 400x300 +level 8%,100% img/k/<id>-400.webp`
  (`+level` nur bei dunklen Fotos, das hebt den Schwarzpunkt leicht an).
- **Saison:** Herbst-Inhalt steht direkt im HTML, Winter und Frühling/Sommer in `<template data-saison-vorlage>`.
  Welche Monate welche Saison sind: `js/main.js`, Abschnitt 2. Zum Ansehen: `?saison=winter`, `?saison=sommer`,
  `?saison=fruehling`, `?saison=herbst`.
- **Öffnungszeiten:** `data-zeiten` an der Tabelle in `#cafe` ist die einzige Quelle für Live-Status, Kopf-Chip und
  Abholzeiten. Sichtbare Tabelle, Fuß und JSON-LD im `<head>` von Hand mitziehen.
- **Farben, Schriften, Kurven:** `css/style.css`, Abschnitt 2 (Tokens, Kontraste im Kommentar). Saison-Akzente unter
  `:root[data-saison=…]`.
- **Zwischenspeicher:** CSS und JS hängen mit `?v=1` an; nach Änderungen hochzählen.
- **Bewegung aus:** `?motion=off` oder Systemeinstellung „Bewegung reduzieren“ (dann nur Überblenden).

## Technik

- Statisch, ohne Build und ohne Bibliotheken: `index.html`, `css/style.css`, `js/main.js`, `fonts/`, `img/`.
- Bewegung: nur `transform`, `opacity`, `clip-path`; eigene Kurven (`--ease-out`, `--ease-in-out`, `--ease-drawer`).
  Dialoge 240–280 ms rein, 160–200 ms raus; Druck-Rückmeldung `scale(0.97)`; Hover nur bei `(hover: hover) and (pointer: fine)`.
  Titel und Abschnitte blenden ruhig ein (16 px Weg, Bilder öffnen sich von unten per `clip-path`).
- Handy: `viewport-fit=cover` mit Safe Areas, `100svh`-Titel, 16-px-Felder, `touch-action: manipulation`,
  Blätter von unten, per Griff wischbar (> 0,11 px/ms oder ein Viertel der Höhe), Gummiband nach oben.
- Natives `<dialog>`: Fokus bleibt im Dialog, Esc schließt, Fokus springt zurück.
- Ohne JavaScript: alles lesbar, Öffnungszeiten statt Live-Status, Bestellknöpfe ausgeblendet, Hinweis auf E-Mail.

## Bild- und Schriftnachweis

- Fotos und Logo: Jeff's Cheesecake (jeffscakes.com). Eigene Zuschnitte (4:3 bzw. 5:4, 1:1, Café 4:5 und 3:2) und
  leichte Mattierung der dunklen Fotos als WebP in `img/` und `img/k/`, zusammen ca. 1,05 MB. Logo, Jeff-Porträt und
  Favicons unverändert aus der Basis kopiert.
- Schriften (SIL Open Font License 1.1, lokal über Fontsource): **Newsreader** (Production Type, variabel mit
  optischer Größe, normal und kursiv), **Schibsted Grotesk** (Schibsted Media Group, variabel).

## Bekannte Schwächen

- **Schriftgewicht:** Newsreader mit opsz-Achse ist groß (zusammen ca. 280 KB für normal + kursiv). Mit fonttools auf
  die benötigten Zeichen schneiden, dann deutlich kleiner.
- **Fotos:** Die hellen Produktfotos haben nur 440 px und wirken auf Retina-Bildschirmen weich; Pumpkin Polka und
  Crumble Rumble sind Handyfotos. Am besten alle Kuchen einheitlich und hell nachfotografieren – das Passepartout
  gleicht den Stilbruch nur aus. Jeff-Porträt nur 379 px, deshalb bewusst klein.
- **Saison-Texte** für Winter und Frühling/Sommer sind aus den vorhandenen Kuchentexten zusammengesetzt; Jeff sollte
  die Saisonkuchen bestätigen. Pumpkin Polka bleibt außerhalb des Herbstes bestellbar (wie in der Basis), nur ans Ende gerückt.
- **Datum:** Das native Datumsfeld zeigt das Format des Browsers; die Schnellwahl darüber ist auf Deutsch.
- **Anfahrt:** Keine Karte und keine ÖPNV-Angaben, weil die Basis dazu nichts hergibt; „Route planen“ öffnet Google Maps.
- Wie in der Basis offen: Optionen (laktose-/glutenfrei) ohne Aufpreis angenommen, nur Abholort Café, nur Deutsch,
  Impressum/Datenschutz der Basis, `noindex` und Fuß-Hinweis „Entwurf zur Ansicht“ vor dem Livegang entfernen.
