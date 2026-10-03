# Jeff's Cakes – Entwurf „Plakat“

Die Seite ist ein Konzertplakat im Schweizer Stil, gedruckt wie ein Risograph. Jeff's Cheesecake präsentiert sein
Line-up: **Jeff's Classic ist der Headliner** in riesiger Schrift, die übrigen 17 Kuchen spielen auf drei Bühnen
(Classics, Fruity, Specials), Pumpkin Polka ist der Special Guest im Herbst. Die Schriftgröße folgt der Plakat-Logik
(erster Act groß, dann mittel, dann klein), nicht der Beliebtheit, denn dazu gibt es keine Zahlen.

Gedruckt wird in drei Riso-Farben auf Creme: **Blau** `#0078BF`, **Pink** `#FF48B0`, **Gelb** `#FFE800`. Wo sich
Farben überlagern, mischen sie sich wie auf Papier (`mix-blend-mode: multiply`): Pink über Gelb wird Orange, die
Headliner-Schrift hat eine leicht verrutschte pinke Platte. Alle Fotos sind Rasterdrucke in diesen Farben – das
vereinheitlicht nebenbei die sehr unterschiedlichen Ausgangsfotos (dunkle Jazz-Fotos, helle 440-px-Produktfotos,
Handyfotos).

Die Begriffe sind Plakat-Begriffe, die Fakten bleiben die echten: **Vorverkauf** = Bestellung mit 3 Werktagen Vorlauf,
**Spielort** = das Café am Linnering 5, **Einlass** = Öffnungszeiten, **Abendkasse** = Stück im Café ohne Bestellung,
**Winterpause** 23.12.–11.1. Es gibt keine erfundenen Termine.

Statisch, ohne Build und ohne Bibliotheken: `index.html`, `css/style.css`, `js/main.js`, `fonts/`, `img/`.

```bash
python3 -m http.server 8146 --directory /home/user/Websites
# → http://127.0.0.1:8146/jeffs-cakes/arena/design-plakat/   (Bewegung aus: ?motion=off)
```

## Aufbau

| Abschnitt | Inhalt |
|---|---|
| Leiste | Logo (in Blau gedruckt), Line-up · So bestellst du · Café · Geschichte, gelber Knopf „Bestellung“ mit Zähler. Handy: Menü als Vollbild mit riesigen Links |
| Plakat (Hero) | „Jeff's Cheesecake präsentiert – Headliner: Jeff's Classic“. Grafik: Cheesecake von oben (gelbe Scheibe, gerastertes Foto), ein Stück fehlt und liegt pink daneben. Fußzeile mit Vorverkauf, Abholen, Liefern, Preisen. Startanimation: Zeilen fahren hoch, pinke Platte rastet ein, das Stück rutscht heraus |
| Line-up | Alle 18 Kuchen auf drei Bühnen, Preise klein daneben. „Programm markieren“ (glutenfrei / laktosefrei / vegan) zieht einen gelben Textmarker über passende Acts. Mit Maus läuft ein kleiner Probedruck am Zeiger mit. Klick auf einen Namen (oder ein Bühnenfoto) öffnet das Act-Blatt |
| Special Guest | Pumpkin Polka auf pinker Fläche, nur im Herbst |
| Act-Blatt | Eigenes kleines Plakat pro Kuchen (Druck + Name), daneben Text, Größe als Karten, Optionen, Anzahl, „In die Bestellung“, Blättern zum vorherigen/nächsten Act. Handy: Blatt von unten, per Wisch am Griff schließbar, Bestellknopf bleibt unten stehen |
| So bestellst du | Gelbe Fläche, drei Schritte mit großen Ziffern, Stempel „Winterpause 23.12.–11.1.“ |
| Für Feiern | Cheese(cup)cakes, Bebop Brownies, „Etwas Größeres geplant?“ mit Abrisszetteln (E-Mail, Anrufen) |
| Spielort (Café) | „Linnering 5“ groß, gerastertes Café-Foto mit Live-Stempel (offen/zu, Zeitzone Hamburg), Einlass-Tabelle mit „heute“, Route planen, Telefon, Abendkasse mit Angebot und Google-Bewertungen |
| Geschichte | Mittelblaue Fläche: New York in den 70ern, Zitat, Jeff als Rasterdruck |
| Fuß | Kleingedrucktes: Café, Kontakt, Programm, Impressum/Datenschutz (`../../impressum.html`, `../../datenschutz.html`) |
| Bestellung | Schublade rechts (Handy: Blatt von unten) im Ticket-Look: Posten mit Mini-Druck, Anzahl, Entfernen, Abholen/Liefern, Datum, Uhrzeit, Kontakt, PayPal/Überweisung, Anmerkung |

## Bestellung

Regeln wie in der Basis (von jeffscakes.com): mindestens 3 Werktage Vorlauf, Winterpause 23.12.–11.1. gesperrt,
Abholung zu den Café-Zeiten des gewählten Tags, Lieferung 11–19 Uhr nur im Hamburger Raum (PLZ 20000–22999),
bei Überweisung frühestens zwei Tage nach Zahlungseingang. Fehler werden am Feld markiert, der Fokus springt hin.
„Bestellung absenden“ öffnet das E-Mail-Programm mit der fertigen Bestellung an info@jeffscakes.com (`mailto:`).
Der Warenkorb liegt im Browser (`localStorage`, Schlüssel `jeffs-plakat-bestellung`). Für den Livegang in
`js/main.js`, Abschnitt 7, den `mailto:`-Teil durch den Aufruf des Bestell-Servers ersetzen.

## Der Rasterdruck (wie die Fotos entstehen)

Die Bilder in `img/acts/` sind **Graustufen-WebP** (640 × 640). Das Raster entsteht erst im Browser
(`css/style.css`, Abschnitt 5): Jede Druckplatte enthält das Bild mit halber Helligkeit, darüber ein Punktmuster
(`radial-gradient`, `mix-blend-mode: plus-lighter`), und `filter: contrast(22)` macht daraus scharfe Rasterpunkte,
deren Größe dem Grauwert folgt. Die Platte färbt sich über `screen` auf einer Farbfläche ein und wird per `multiply`
gedruckt. Platte 2 liegt leicht versetzt und mit anderem Rasterwinkel darüber. Vorteil: wenige, kleine Dateien,
Farben per CSS wählbar (`--t1`, `--t2`, `--grund`, `--raster`, `--dx`, `--dy` auf `.druck`).
Browser ohne `plus-lighter` zeigen einen weichen Duoton ohne Raster.

## Anpassen

- **Kuchen:** je ein `<li class="act">` im Line-up. Preise/Größen in `data-groessen`, Optionen in `data-optionen`,
  Markieren-Filter in `data-diaet`, Bühne in `data-buehne` (Kommentar über dem Line-up erklärt alles). Der Text steht in
  `.act__text` (ohne JavaScript sichtbar, mit JavaScript im Act-Blatt). Größe auf dem Plakat über die Liste
  `acts--l` / `acts--m` / `acts--s`.
- **Neues Foto:** Original in einen Ordner legen, Zeile in `werkzeug/bilder.sh` ergänzen (Ausschnitt, Ziel-Helligkeit,
  Kanal), dann `QUELLE=/pfad/zu/originalen ./werkzeug/bilder.sh`. Braucht ImageMagick mit WebP und python3.
- **Öffnungszeiten:** Tabelle im Café (`data-zeiten` steuert den Live-Status), JSON-LD im `<head>`, Fuß.
- **Farben, Schriften, Kurven:** `css/style.css`, Abschnitt 2 (Tokens), Kontraste stehen im Kommentar.
- Zwischenspeicher: CSS und JS hängen mit `?v=1` an, nach Änderungen hochzählen.

## Technik

- Ohne JavaScript: alle Texte, Beschreibungen und Preise stehen lesbar im Line-up, Bestellhinweis per E-Mail;
  der Headliner wird einfarbig gedruckt.
- Bewegung nach Emil Kowalski: nur `transform`, `opacity` (und Masken), eigene Kurven (`--ease-out`, `--ease-drawer`),
  Druck-Rückmeldung `scale(0.97)`, Hover nur bei `(hover: hover) and (pointer: fine)`, Dialoge rein 300 ms / raus
  180 ms, Blätter auf dem Handy 420 ms mit Schubladen-Kurve. Bei „Bewegung reduzieren“ oder `?motion=off`: keine
  Startanimation, kein Einblenden, Dialoge blenden nur über, der Probedruck folgt ohne Nachziehen.
- Handy: `viewport-fit=cover` mit Safe Areas, `100svh` für das Plakat, 16-px-Eingabefelder,
  `touch-action: manipulation`, `-webkit-tap-highlight-color: transparent`, Blätter folgen dem Finger und schließen bei
  schnellem Wisch (> 0,11 px/ms) oder ab einem Viertel der Höhe.
- Natives `<dialog>`: Fokus bleibt drin, Esc schließt, Fokus springt zurück auf den Act.
- Kontraste (WCAG): Fließtext Tinte auf Papier 13,5:1, Pink und Gelb nie als Schriftfarbe auf Papier, Riso-Blau
  (4,1:1) nur für große, fette Schrift ab 24 px.

## Bild- und Schriftnachweis

- Fotos und Logo: Jeff's Cheesecake (jeffscakes.com), für diesen Entwurf zugeschnitten, in Graustufen umgerechnet
  (Rotkanal bzw. Helligkeit, lokaler Kontrast) und als WebP gespeichert. Das Logo ist in Riso-Blau umgefärbt
  (im Fuß weiß). Keine Fremdfotos.
- Papierkorn `img/korn.png`: selbst erzeugt (ImageMagick-Rauschen).
- Schriften lokal, SIL Open Font License 1.1: **Archivo** (Omnibus-Type, variabel mit Breite 62–125 % und Stärke
  100–900) und **IBM Plex Mono** (IBM), beide über Fontsource bezogen.

## Bekannte Schwächen

- **Rasterdruck statt Foto:** Die Kuchen sind gut erkennbar, aber nicht in echten Farben. Wer die Originalfarbe
  sehen will, sieht sie hier nicht. Möglicher Ausbau: kleiner Umschalter „Farbfoto“ im Act-Blatt.
- **Helle Produktfotos** (Jeff's Classic, Chocolate Cha-Cha, Coconut, Banana, Vegan, Brownies, Cupcakes; nur 440 px)
  drucken blasser als die dunklen Jazz-Fotos. Nachfotografieren im Jazz-Stil bleibt die beste Lösung.
- Das Raster braucht `mix-blend-mode: plus-lighter` (Chrome, Edge, Safari; geprüft nur in Chromium). Browser ohne
  Unterstützung zeigen einen weichen Duoton, das Layout bleibt gleich.
- Datum ist das native `<input type="date">`; Anzeigeformat richtet sich nach der Browsersprache.
- Abholorte: nur das Café (jeffscakes.com lädt weitere vom Server). Optionen laktose-/glutenfrei ohne Aufpreis
  angenommen. Nur Deutsch.
- Impressum/Datenschutz verweisen auf die Seiten der Basis; Inhaber/Rechtsform dort noch offen.
- Vor dem Livegang `<meta name="robots" content="noindex, nofollow">` löschen und den Fußhinweis „Entwurf“ entfernen.
