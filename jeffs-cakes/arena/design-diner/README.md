# Jeff's Cheesecake – Entwurf „Diner“

Ein New Yorker Diner der 70er, in dem Jeff seinen Cheesecake gegessen haben könnte. Die Seite nimmt die Bilder
eines guten Diners und macht daraus die Bedienung: Im Hero leuchtet das Neonschild „Jeff's Cheesecake“ (geht beim
Laden einmal ruhig an, kein Flackern), daneben steht eine **Tortenvitrine mit drehbarer Etagere**: alle 18 Kuchen
unter Glasglocken, auf zwei Etagen, mit dem Finger oder der Maus drehbar. Die Kuchenkarte ist eine
**Steckbuchstaben-Tafel** an einer mintgrünen Fliesenwand, der Warenkorb ein grüner **Guest Check**, auf dem die
Kuchen „mit Kuli“ notiert werden. Das OPEN-Schild im Hero zeigt den echten Öffnungsstatus des Cafés.

Farben: Kirschrot, Mint, Creme, Chrom, Nachtschwarz, als Akzent ein Schachbrettstreifen (Diner-Fußboden).
Kein Kostüm: wenige Motive, die alle eine Aufgabe haben (Vitrine = Kuchen ansehen, Tafel = Preise vergleichen,
Bestellzettel = Bestellung, OPEN-Schild = Öffnungszeiten, Bons an der Schiene = Bestellablauf).

Statische Seite ohne Build und ohne Bibliotheken: `index.html`, `css/style.css`, `js/main.js`, Schriften in
`fonts/`, eigene Bildzuschnitte in `img/`. Die übrigen Fotos und das Logo kommen aus dem Basis-Ordner
(`../../img/`), damit nichts doppelt liegt.

```bash
python3 -m http.server 8144 --directory /home/user/Websites
# → http://127.0.0.1:8144/jeffs-cakes/arena/design-diner/   (Animationen aus: ?motion=off)
```

## Aufbau

| Abschnitt | Inhalt |
|---|---|
| Navigation | Leuchtschrift-Wortmarke, Karte · Geschichte · Café · So bestellst du, Knopf „Bestellzettel“ mit Zähler. Handy: Menü als Vollbild mit Neon-Links |
| Hero „Leuchtschild“ | Neon „Jeff's / Cheesecake“ (H1), Kurztext, Zur Karte / Ins Café, OPEN-Schild mit Live-Status (Zeitzone Hamburg) |
| Tortenvitrine | 2 Etagen × 9 Kuchen unter Glasglocken. Ziehen/Wischen dreht 1:1, Schwung beim Loslassen, rastet ein. Pfeile und Pfeiltasten drehen um einen Platz. Unter der Vitrine stehen die beiden vorderen Kuchen mit Preis; Antippen öffnet den Kuchen |
| Die Karte | Steckbuchstaben-Tafel mit allen 18 Kuchen: Name, Preise ø 18 / ø 26 cm, Beschreibung, GF/LF/V. Filter glutenfrei / laktosefrei / vegan. Gruppen Classics, Fruity, Specials, Saison, Für Feiern |
| Special der Saison | Pumpkin Polka als eingeklemmter Einleger in der Karte (Herbst) |
| Geschichte | „Zu jung für zwei Drinks“: New York, 70er, Cheesecake und Milch statt zwei Drinks pro Set. Jeff vor einer Mint-Scheibe, dazu der Guest Check von damals |
| Café | Foto im Bogen, Öffnungszeiten als kleine Steckbuchstaben-Tafel (heutiger Tag markiert), Live-Status, Adresse, Route, Telefon, Angebot (Kuchen, Kaffee, Snacks), Google-Bewertungen |
| Für die ganze Runde | Cheese(cup)cakes, Bebop Brownies, Anfrage für Größeres |
| So bestellst du | Drei Bons an der Bonschiene (aussuchen, abholen/liefern, bezahlen), Winterpause |
| Fuß | Adresse, Zeiten, Kontakt, Logo, Impressum/Datenschutz (`../../impressum.html`, `../../datenschutz.html`) |
| Kuchen-Dialog | Speisekarte: Foto im Bogen, Größen als Tortenplatten im Maßstab (ø 18 vs. ø 26), Wünsche, Anzahl, „Auf den Zettel“. Desktop mittig, Handy Blatt von unten (per Wisch schließbar) |
| Bestellzettel | Guest Check: Posten handschriftlich, Summe doppelt unterstrichen, darunter Abholen/Liefern, Datum, Uhrzeit, Kontakt, PayPal/Überweisung, Anmerkung. Desktop Schublade rechts, Handy Blatt von unten. Handy: rote Leiste „Bestellzettel“ in Daumennähe, sobald etwas darauf steht |

## Bestellung im Entwurf

Regeln wie in der Basis (von jeffscakes.com): mindestens 3 Werktage Vorlauf, Lieferung nur im Hamburger Raum
(PLZ 20000–22999) zwischen 11 und 19 Uhr, Abholung zu den Café-Zeiten, Winterpause 23.12.–11.1., bei Überweisung
frühestens zwei Tage nach Zahlungseingang. Der Bestellzettel bleibt im Browser (`localStorage`, Schlüssel
`jeffs-diner-zettel`).

„Bestellung abschicken“ öffnet das E-Mail-Programm mit der fertigen Bestellung an info@jeffscakes.com. Für den
Livegang an den Bestell-Server (`api.jeffscakes.com`, PayPal) anschließen: in `js/main.js`, Abschnitt 6, den
`mailto:`-Teil durch den API-Aufruf ersetzen.

## Anpassen

- **Kuchen:** je ein `<li class="zeile">` in `#karte` (Kommentar über der Tafel erklärt die `data-`Attribute:
  Größen und Preise in `data-groessen`, Wünsche in `data-optionen`, Filter in `data-diaet`). Die sichtbaren Preise
  in der Zeile stehen zusätzlich als Text (lesbar ohne JS) und müssen mitgeändert werden.
- **Vitrine:** je ein `<a class="glocke">` pro Etage in `.hero__vitrine`, `--i` ist der Platz (0–8, 0 = vorne).
  Bild `img/glocke/<id>.webp` (400 × 364, Kuchen unten mittig). Neuer Zuschnitt z. B.
  `convert quelle.png -crop BxH+X+Y +repage -resize 400x364! -quality 78 img/glocke/<id>.webp`.
  Maße der Etagen (`--rx`, `--ry`, `--gw`) stehen nur im CSS, `main.js` liest sie von dort.
- **Öffnungszeiten:** Tabelle in `#cafe`, `data-zeiten` steuert OPEN-Schild und Status. Außerdem JSON-LD im
  `<head>`, Hero-Zeile unter dem OPEN-Schild und Fuß.
- **Farben, Schriften, Kurven:** `css/style.css`, Abschnitt 2 (Tokens, Kontraste im Kommentar).
- Zwischenspeicher: CSS und JS hängen mit `?v=1` an. Nach Änderungen die Zahl erhöhen.

## Technik und Bewegung

- Ohne JavaScript ist alles lesbar: Die Vitrine steht per CSS (`sin()`/`cos()`) im Kreis, die Glocken verlinken
  auf die Zeile der Tafel, Knöpfe ohne Funktion werden ausgeblendet, Bestellen per E-Mail-Hinweis.
- Bewegung nach Emil Kowalski / Apple: nur `transform`, `opacity` und `clip-path` (Häkchen auf dem Zettel).
  Eigene Kurven (`--ease-out`, `--ease-drawer`), Druck-Rückmeldung `scale(0.97)`, Hover nur bei Maus und ohne
  Übergang. Dialoge rein 260–400 ms, raus 220 ms; Toast und Handy-Leiste per Transition (unterbrechbar).
- Vitrine: Feder (halbimplizit, Reaktionszeit 0,45–0,55 s, Dämpfung 1 bzw. 0,82 nach einem Wisch), Startwert ist
  immer die aktuelle Lage, Ziehen ist jederzeit möglich. Schwung wird wie bei `UIScrollView` (Verzögerung 0,99)
  projiziert und auf den nächsten Kuchen gerastet. `touch-action: pan-y`: senkrecht scrollt die Seite.
  Es läuft nur etwas, solange jemand dreht (kein Dauer-Karussell, daher auch kein Pause-Knopf nötig).
- Einmalige Auftritte: Neonschild geht an (Deckkraft, 900 ms), Etagere dreht sich beim Laden zwei Plätze herein,
  Abschnitte blenden beim Scrollen kurz gestaffelt ein, „Notiert“-Stempel nach dem Absenden.
- `prefers-reduced-motion` und `?motion=off`: kein Hereindrehen, kein Einblenden, Neon sofort an, Drehen per Pfeil
  springt ohne Weg, Dialoge blenden nur über.
- Handy: `viewport-fit=cover` mit Safe Areas, `100svh` im Hero, 16-px-Felder, `touch-action: manipulation`,
  Blätter folgen dem Finger und schließen bei schnellem Wisch (> 0,11 px/ms) oder ab einem Viertel der Höhe.
- Natives `<dialog>`: Fokus bleibt drin, Esc schließt, Fokus springt zurück. Vitrine per Tastatur über die
  Pfeil-Knöpfe und die beiden „Vorne“-Links (Pfeiltasten drehen), Änderungen werden angesagt (`aria-live`).

## Bild- und Schriftnachweis

- Fotos und Logo: jeffscakes.com (Jeff's Cheesecake). Die 18 Glocken-Zuschnitte in `img/glocke/` sind aus den
  Originalen geschnitten (rund 280 KB zusammen), alle übrigen Bilder kommen unverändert aus `../../img/`.
- Schriften, alle SIL Open Font License 1.1, lokal als woff2 (über Fontsource):
  Sacramento (Neon-Schreibschrift), Tilt Neon (Neon-Blockschrift), Fraunces (Überschriften, Achse „Soft“),
  Archivo (Text, Tafel, Zettel-Druck; Breitenachse), Caveat (Handschrift auf dem Guest Check).
- Favicon (Neon-Tortenglocke) selbst gezeichnet, `img/favicon.svg`.

## Bekannte Schwächen

- **Fotos uneinheitlich:** 10 Kuchen haben die dunklen Jazz-Fotos, 8 nur helle Produkt- bzw. Handyfotos. In der
  Vitrine stehen deshalb oben die hellen, unten die dunklen. Die hellen Vorlagen haben nur 440 px; ihre Glocken sind
  leicht hochgerechnet (322 → 400 px). Am besten alle Kuchen einheitlich nachfotografieren.
- **Nicht eigenständig:** Fotos, Logo und Rechtsseiten werden aus dem Basis-Ordner geladen (`../../`).
- **Schriftgewicht:** 330 KB Schriften (Fraunces mit allen Achsen 121 KB, Caveat 75 KB). Mit Subsetting ließe
  sich das etwa halbieren.
- **Vitrine auf kleinen Handys:** Bei 320 px sind die Glocken nur gut 70 px breit; die Tafel bleibt dort der
  bessere Weg zum Kuchen. Ohne `sin()`/`cos()`-Unterstützung (Browser vor 2023) stehen die Glocken ohne JS
  übereinander; mit JS ist alles richtig.
- **Gruppen:** Brownies und Cheese(cup)cakes stehen auf der Tafel unter „Für Feiern“ (in der Basis „Classics“),
  damit die zwei Spalten gleich lang sind.
- **Datumsfeld:** Format richtet sich nach der Browsersprache (im Testbrowser „mm/dd/yyyy“, auf deutschen
  Geräten „tt.mm.jjjj“).
- Nur Deutsch, Abholort nur das Café, Laktose-/glutenfrei ohne Aufpreis angenommen (wie in der Basis).
- Getestet mit Playwright/Chromium (Desktop, Handy-Emulation), nicht auf echten Geräten und nicht in Safari.
