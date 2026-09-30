# Linie 12 – Urbanes Bistro (Design-Variante)

Demo-Website für ein erfundenes Bistro mit Brunch, Bowls und Burger. Alle Inhalte, Preise und Adressen sind Beispiele.
Statische Seite ohne Build: `index.html` + `css/style.css` + `js/main.js`, Schriften in `fonts/`, Bilder in `img/`.
GSAP und ScrollTrigger kommen aus `../../restaurant/assets/vendor/` (nur für scroll-gekoppelte Effekte, die Seite funktioniert auch ohne).

```bash
python3 -m http.server 8406 --directory /home/user/Websites
# → http://127.0.0.1:8406/arena/design-bistro/
# Animationen aus: …/arena/design-bistro/?motion=off
```

## Konzept

Ein Bistro an der Tram-Haltestelle, das den ganzen Tag offen ist: Kaffee am Morgen, Mittagstisch, Burger am Abend, Brunch am
Wochenende. Die Gestaltung wirkt wie ein Plakat aus dem Siebdruck: extra schmale, fette Grotesk (Archivo, 62 % Breite) für
Überschriften, breite Grotesk für Labels und Laufband, Monospace (JetBrains Mono) für Preise, Zeiten und den Bon. Drei Farben:
Tomatenrot, Eigelb, Tinte auf Papier. Ein 12-Spalten-Raster ist überall als feine Linie sichtbar. Sticker, Klebeband und ein
Linienschild („12“) als Logo.

**Zielgruppe:** Menschen aus dem Viertel und Büros in der Nähe (Mittagstisch), Freundesgruppen und Familien am Wochenende,
Teams für Feiern. Botschaft: *Walk-ins willkommen, Gruppen bitte anmelden.*

## Was drin ist

| Abschnitt | Was passiert |
|---|---|
| Hero | Farbfoto des Gastraums, dann legen sich Druck-Streifen (Graustufen × Rot) Spalte für Spalte darüber, abwechselnd von oben und unten. Das Rasterlinien-Gitter zeichnet sich, die Buchstaben „LINIE 12“ steigen aus Masken auf, der Walk-in-Sticker wird aufgeklebt. Beim Scrollen laufen die Buchstaben unterschiedlich schnell nach oben. |
| Klebeband | Schräges Laufband (Brunch-Zeiten, Mittagstisch, Gruppenregel), pausiert außerhalb des Bildschirms |
| 01 Tageskarte | Wochentage als Reiter, der heutige Tag (Zeit am Ort des Restaurants) ist vorausgewählt und bekommt den „Heute“-Sticker. Das Special von heute steht auch im Hero. Montag = Ruhetag-Plakat |
| 02 Über uns | Leitsatz mit Textmarker, Bildcollage mit Stickern, vier Zahlen |
| 03 Brunch | Rote Fläche, riesiges „Brunch“ läuft beim Scrollen im Hintergrund mit, Brunch-Gerichte mit Preisen |
| 04 Speisekarte | Fünf Kategorien als Reiter mit gleitendem Block, Gerichte mit Nummer, Preis und Stickern (vegan, scharf, Hit) |
| 05 Bowl-Baukasten | **Besondere Interaktion:** Basis, Protein, Toppings, Sauce, Crunch wählen. Die Schale (von oben) füllt sich Keil für Keil, der Bon rechnet live mit (3 Toppings inklusive, bis zu 5), Bon-Nummer aus der Auswahl, Knopf „Überraschen Sie mich“. Auf dem Handy läuft eine kleine Summenleiste mit |
| 06 Einblicke | Zwei Bildreihen, die beim Scrollen gegeneinander laufen (ab Tablet). Auf dem Handy und ohne Bewegung: wischen |
| 07 Gruppen | Regeln 1–5 / 6–30 / 30+, Formular mit Prüfung direkt am Feld, Uhrzeiten aus den Öffnungszeiten, Ruhetag-Erkennung, Demo-Modus |
| 08 Besuch | Öffnungszeiten mit Live-Status und heutigem Tag, Anfahrt als Liniennetz-Skizze (keine eingebettete Karte), Link zum Routenplaner |
| Handy | Vollbild-Menü, feste Leiste „Anrufen / Gruppe anmelden“ (verschwindet im Baukasten, im Formular und im Footer) |

Ohne JavaScript, mit „Bewegung reduzieren“ oder `?motion=off` ist alles sofort sichtbar und bedienbar (alle Tage und
Kategorien stehen dann untereinander, das Formular nutzt die Browser-Prüfung und `mailto:`).

## Anpassen

### Name, Adresse, Kontakt
Suchen und ersetzen in `index.html`: `Linie 12`, `Gleisstraße 12`, `00000 Musterstadt`, `0123 456 789` / `+49123456789`,
`hallo@linie-12.example`, `Gleispark`, `Tram 12`. Dazu `<title>`, `description`, `og:`-Angaben und das JSON-LD im `<head>`.
Der Hero-Name steht Buchstabe für Buchstabe im `<h1>` (Kommentar dort); das Leerzeichen ist `<span class="hero__luft">`,
auf dem Handy bricht der Name an dieser Stelle um. Für andere Namenslängen in `style.css` den Teiler bei
`.hero__titel{font-size:min(calc(100cqw / 2.86),50svh)}` anpassen (Breite des Namens in em).

### Farben, Schriften, Abstände
Alles in `css/style.css`, Abschnitt 2 (Tokens): `--papier`, `--tinte`, `--rot` (Akzent), `--rot-text` (Akzent als kleiner
Text, mind. 4,5:1 auf Papier), `--gelb` (Sticker, Knöpfe), `--duo-hell` (Farbe des Zweifarbdrucks im Hero),
`--schrift`, `--mono`, `--schmal`/`--breit` (Breitenachse der Archivo), `--gutter`, `--gap`, `--container`, `--sektion`.
Die Hero-Farbe folgt automatisch dem Token, weil das Foto per CSS in Graustufen mit der Akzentfarbe multipliziert wird.

### Hero-Bild
`img/hero/halle-800|1400|1800.webp` (Querformat 4:3) und `halle-hoch.webp` (1080 × 1920, Handy). Pfade stehen nur einmal im
`<picture>` im Hero, die Intro-Streifen werden per kleinem Inline-Skript daraus kopiert. Bildausschnitt: `--hero-fokus`.
Gut geeignet sind helle, detailreiche Innen- oder Außenaufnahmen – im Zweifarbdruck wird daraus eine Textur.

### Tageskarte
Ein `<article class="special">` pro Tag im Abschnitt `#tageskarte`, `data-panel` = Wochentag (0 = Sonntag … 6 = Samstag).
`data-name` ist der Text für „Heute auf der Tafel“ im Hero. Reiter-Knopf und Panel sind über `aria-controls`/`id` verbunden.

### Speisekarte
Im Abschnitt `#karte`; ein Gericht ist ein `<li class="gericht">` (Vorlage als Kommentar im HTML). Neue Kategorie: Reiter-Knopf
in `.reiter` und passendes `.karte__panel` mit eigener `id`.

### Bowl-Baukasten
Grundpreis, Anzahl inklusiver Toppings, Maximum und Aufpreis stehen am `<form data-bau …>` (`data-grundpreis`, `data-inklusive`,
`data-max`, `data-extra`, alles in Cent). Jede Zutat: `data-preis` (Aufpreis in Cent) und `data-farbe` (Farbe in der Schale).

### Öffnungszeiten
Einzige Quelle ist die Tabelle in `#besuch`: `<tr data-tag="6" data-zeiten="09:00-23:00">` (leer = Ruhetag). Daraus rechnen
Live-Status, „Heute“-Markierung und die Uhrzeiten im Formular (`data-letzte-anfrage` = letzte Anfrage in Minuten vor Schluss).
Sichtbaren Text und JSON-LD mitpflegen.

### Formular
Ohne `data-endpoint` läuft es im Demo-Modus und sagt nach dem Absenden ausdrücklich, dass nichts versendet wurde.
Echter Versand: `data-endpoint="https://formspree.io/f/…"` (normales `FormData`-POST). Personenzahl-Grenzen über `min`/`max`
am Feld `a-personen`, die Regeln im Text daneben mitändern.

### Anfahrt
Die Liniennetz-Skizze ist ein SVG direkt im HTML (Stationen, Linien, Beschriftung). Keine Karte eines Drittanbieters,
nur ein Link zum Routenplaner.

### Demo-Teile entfernen
`<meta name="robots" content="noindex, nofollow">` löschen, Footer-Hinweis ersetzen, Impressum/Datenschutz verlinken
(zeigen im Moment auf `../../restaurant/…`), Hinweis „Demo-Funktion“ unter dem Bon anpassen.

## Technik

- Bewegung nur über `transform`, `opacity`, `clip-path`. Kurven `--ease-out` `cubic-bezier(.23,1,.32,1)` und `--ease-in-out`
  `cubic-bezier(.77,0,.175,1)`. UI-Wechsel ≤ 300 ms, Staffelung 30–70 ms. Das Hero-Intro ist reines CSS (läuft auch bei
  beschäftigtem Haupt-Thread) und startet, sobald das Foto dekodiert ist (Sicherheits-Timeout im `<head>`).
- GSAP nur für scroll-gekoppelte Bewegung (Hero-Parallaxe, Brunch-Schriftzug, Bildstrecke). Kein Lenis: natives Scrollen passt
  zur knackigen Richtung.
- Hover nur bei `(hover:hover) and (pointer:fine)`, `:active` mit `scale(.97)`, kein eigener Mauszeiger.
- Handy: `100svh`, `viewport-fit=cover` + `env(safe-area-inset-*)`, Felder ≥ 16 px, einspaltige Raster mit `minmax(0,1fr)`,
  `main` mit `overflow-x:clip` als Sicherheitsnetz.

## Bildquellen

Fotos von [Unsplash](https://unsplash.com) (Unsplash-Lizenz). Neu für diese Variante geladen
(`https://images.unsplash.com/photo-<ID>`), zugeschnitten und als WebP gespeichert:

| Datei | Unsplash-ID |
|---|---|
| img/hero/halle-* | 1555396273-367ea4eb4db5 |
| img/gerichte/burger-* | 1568901346375-23c9450c58cd |
| img/gerichte/tofu-bowl-* | 1546069901-ba9599a7e63c |
| img/gerichte/gruene-bowl-* | 1512621776951-a57141f2eefd |
| img/gerichte/waffeln-*, img/bilder/brunch-waffeln-* | 1504754524776-8f4f37790ca0 |
| img/gerichte/brunch-platte-*, img/bilder/brunch-tisch-* | 1424847651672-bf20a4b0982b |
| img/bilder/runde-* | 1466978913421-dad2ebd01d17 |
| img/bilder/gaeste-* | 1592861956120-e524fc739696 |
| img/bilder/bar-* | 1514933651103-005eec06c04b |
| img/bilder/limo-* | 1497534446932-c925b458314e |

Aus der Basis-Demo (`restaurant/assets/img/`) neu zugeschnitten: `gerichte/herbst-bowl-*` (1540189549336-e6e99c3679fe),
`gerichte/brownie-*` (1606313564200-e75d5e30476c), `bilder/tafel-*` (1528605248644-14dd04022da1),
`bilder/koch-*` (1577219491135-ce391730fb2c).

Schriften: Archivo und JetBrains Mono (SIL Open Font License), lateinische Teilmenge als woff2 in `fonts/`.
