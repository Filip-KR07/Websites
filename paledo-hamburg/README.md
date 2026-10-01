# Aurel — Demo-Design „Fine Dining“

Vorlage für ein gehobenes Degustationsrestaurant. Das Restaurant „Aurel“ ist erfunden, alle Texte, Preise und Namen sind Beispiele.
Statische Seite ohne Build: `index.html` + `css/style.css` + `js/main.js`, Schriften in `fonts/`, Bilder in `img/`.
GSAP, ScrollTrigger und Lenis liegen in `js/vendor/`, der Ordner läuft eigenständig.

## Konzept

**Reduzierter Luxus.** Elfenbeinpapier, warme Tinte, ein einziger Akzent in dunklem Messing. Viel Weißraum, wenige, dafür große Bilder.
Die Typografie ist eine Didone (Bodoni Moda mit optischen Größen: Die Haarstriche werden bei großen Graden feiner), dazu Versalien mit weiter Sperrung in Jost.
Wiederkehrendes Motiv ist der **Bogen**, wie ein Fenster oder eine Nische. Er rahmt das Hero-Foto, das Porträt des Küchenchefs und die Gerichte.
Römische Ziffern nummerieren Abschnitte und Gänge. Die Bewegung ist ruhig und langsam: Masken, Vorhänge, weiche Überblendungen, nichts springt.

**Zielgruppe:** Gäste, die einen besonderen Abend planen (Jahrestag, Geschäftsessen, Genussreise), ab etwa 35, mit Erwartungen an Ruhe, Transparenz bei Preisen und klare Reservierungsbedingungen.

## Was drin ist

| Abschnitt | Was passiert |
|---|---|
| Hero „Passepartout“ | Das Foto des Gastraums steht zuerst randlos da. Dann zieht es sich wie ein Bild im Passepartout in einen Bogen zurück (clip-path), wird kleiner und dunkler, das Papier kommt zum Vorschein. Der Name steigt Buchstabe für Buchstabe davor auf, **zweifarbig**: hell, wo er über dem Foto liegt, dunkel auf dem Papier. Eine Messing-Kontur wächst um den Bogen, eine Bodenlinie zieht sich auf. Alles CSS-Animation, beim Scrollen danach leichte Parallaxe (GSAP). |
| I Philosophie | Leitsatz steigt Wort für Wort aus Masken, Zahlenleiste, großes Bild öffnet sich wie ein Vorhang |
| II Menü | **Menü-Konfigurator**: 5 oder 7 Gänge, klassisch oder vegetarisch, Wein-, alkoholfreie oder keine Begleitung. Gänge gleiten beim Umschalten an ihre neue Position (FLIP), die römischen Ziffern zählen neu, die Summe pro Person rechnet mit. Die Auswahlmarkierung ist eine Negativ-Kopie der Beschriftung, die per clip-path gleitet. Am Desktop steht daneben ein Bogen, dessen Foto zum Gang in der Bildschirmmitte (oder unter der Maus) wechselt. „Mit diesem Menü anfragen“ überträgt die Auswahl ins Formular. Darunter die Preisliste in Kategorien. |
| III Küchenchef | Porträt im Bogen, Zitat, Stationen, Sommelière |
| IV Ein Abend | Dunkler Abschnitt. Desktop: Die Bühne bleibt stehen, ein Bogen öffnet sich beim Scrollen bis zum Bildrand (Salon). Danach drei Stationen des Abends (19:00, 20:30, 22:30). |
| V Reservierung | Freie Abende der nächsten vier Wochen (Ruhetage werden gar nicht angeboten), Ankunftszeiten aus den Öffnungszeiten, Personen, Menüwahl, Prüfung direkt am Feld, **Stornobedingungen** daneben und als Pflicht-Häkchen, Richtwert des Abends. Demo-Modus sagt ehrlich, dass nichts versendet wurde. |
| VI Besuch | Öffnungszeiten mit Live-Status (Zeitzone des Restaurants) und markiertem heutigem Tag, Anfahrt, „Gut zu wissen“, Lageplan als Linienzeichnung (keine eingebettete Karte, nur ein Link zu Google Maps) |
| Handy | Vollbild-Menü, schmale Leiste unten mit „Anrufen“ und „Tisch anfragen“ (verschwindet im Formular und im Footer) |

Ohne JavaScript, mit „Bewegung reduzieren“ oder mit `?motion=off` ist alles sofort sichtbar und bedienbar
(Konfigurator funktioniert ohne JS per CSS `:has()`, Formular fällt auf native Datums-/Zeitfelder zurück).

## Anpassen

### Name, Adresse, Kontakt
Suchen und ersetzen in `index.html`: `Aurel`, `Am Schlossgarten 7`, `00000 Musterstadt`, `0123 456 780` / `+49123456780`,
`tafel@aurel.example`, `Matthis Kerner`, `Johanna Veit`. Außerdem `<title>`, `description`, `og:`-Angaben und das JSON-LD im `<head>`.
Der Name im Hero steht zweimal (dunkle und helle Fassung), jeder Buchstabe ist ein `<span class="hero__b" style="--i:n">`.
Bei einem längeren Namen `--fs-hero` in `css/style.css` verkleinern.

### Farben, Schriften, Abstände
Alles in `css/style.css`, Abschnitt 2 (Tokens):
- `--papier`, `--papier-2`, `--karte` für Hintergründe, `--tinte`, `--tinte-2`, `--leise` für Text in drei Stufen
- `--messing` als Akzent für Text (mindestens 4,5:1 auf dem Papier halten), `--messing-hell` nur für Linien und Ornamente
- `--nacht*` für den Abend-Abschnitt und den Footer, `--foto-tinte` für Schrift auf dem Foto
- `--display` und `--text` für die Schriften, `--gutter`, `--wrap` und `--abschnitt` für die Abstände

Neue Schrift: `.woff2` nach `fonts/`, `@font-face` oben in `style.css`, Variable umstellen, `<link rel="preload">` im `<head>` anpassen.

### Hero-Bild und Bogen
`img/gastraum-800|1400|2000.webp` (Querformat 16:10) und `img/gastraum-hoch.webp` (1080 × 1920, fürs Handy).
Ruhige, dunkle Bilder mit hellen Tischen wirken am besten: Die helle Schrift braucht dunkle Stellen im Bogen.
Ausschnitt: `--hero-fokus` bei `.hero`. Form des Bogens: `--bogen-oben`, `--bogen-seite`, `--bogen-unten`, `--bogen-radius`
(Abschnitt 6, dazu Werte für Tablet und Handy in den Media-Queries darunter). `--spalte` muss zu `--bogen-seite` passen.

### Menü und Preise
Im Abschnitt `#menue` (Kommentar im HTML erklärt alles). Ein Gang:

```html
<li class="gang" data-bild="img/gang-saibling-800.webp" data-bild-veg="img/kraeuter-800.webp">   <!-- data-nur7: nur im 7-Gang-Menü -->
  <p class="gang__art versal">Fluss &amp; See</p>
  <h3 class="gang__name"><span class="gang__klassisch">Saibling</span><span class="gang__vegetarisch">Kürbis</span></h3>
  <p class="gang__teile"><span class="gang__klassisch">…</span><span class="gang__vegetarisch">…</span></p>
  <p class="gang__begleitung"><span class="gang__wein">…Wein…</span><span class="gang__frei">…alkoholfrei…</span></p>
</li>
```

Preise stehen an den Auswahlknöpfen (`data-preis`, `data-preis-7`, `data-preis-5`), aus denen die Summe gerechnet wird,
und in der Preisliste darunter. Bitte beides pflegen. Kein vegetarisches Menü? Die Auswahl „Küche“ und die `gang__vegetarisch`-Spans löschen.

### Öffnungszeiten und Reservierungszeiten
Einzige Quelle ist die Tabelle in `#besuch`: `<tr data-tag="6" data-zeiten="12:30-15:00,18:30-23:30">` (0 = Sonntag).
`data-einlass="60"` bestimmt, bis wann nach Öffnung Ankunftszeiten angeboten werden (30-Minuten-Takt).
Text in der Zelle, Footer und JSON-LD bitte mitpflegen.

### Reservierung
Ohne `data-endpoint` am `<form data-buchung>` läuft der Demo-Modus. Für echten Versand z. B.
`data-endpoint="https://formspree.io/f/DEINE-ID"`. Gesendet wird `FormData` mit `datum`, `uhrzeit`, `personen`, `b-umfang`, `b-kueche`,
`b-begleitung`, `name`, `email`, `telefon`, `anmerkung`, `storno`, `datenschutz`. Stornobedingungen stehen im `<aside class="storno">`.

### Demo-Teile entfernen
`<meta name="robots" content="noindex, nofollow">` löschen, Footer-Hinweis „Demo-Website …“ ersetzen,
Impressum/Datenschutz (zeigen auf `../../restaurant/`) durch eigene Seiten ersetzen.

## Technik

- Animiert werden nur `transform`, `opacity` und `clip-path`. Kurven: `--ease-out` cubic-bezier(.23,1,.32,1), `--ease-in-out` cubic-bezier(.77,0,.175,1), `--ease-seide` für Bilder.
- UI-Übergänge ≤ 300 ms (Auswahl, Menü, FLIP), Intro und Einblenden länger. Hover nur bei `(hover: hover) and (pointer: fine)`, `:active` mit `scale(.97)`.
- Das Intro ist CSS-Animation (`animation-play-state: paused`, bis das Hero-Bild dekodiert ist, Sicherheitsnetz im `<head>` nach 1,8 s).
  GSAP nur für Scroll-Kopplung (Parallaxe, Salon-Bogen), Lenis nur mit Maus/Trackpad.
- Versteckte Startzustände nur unter `html.motion`. Läuft `main.js` nicht, setzt das `<head>`-Skript nach 4 s `js-kaputt` und alles wird sichtbar.
- Einspaltige Grids mit `minmax(0,1fr)`, Eingabefelder ≥ 16 px, `100svh`, `viewport-fit=cover` + `env(safe-area-inset-*)`.

## Bild- und Schriftnachweis

Fotos von [Unsplash](https://unsplash.com) (Unsplash-Lizenz, frei nutzbar, auch kommerziell). Für echte Kunden eigene Fotos verwenden.
Quelle jeweils `https://images.unsplash.com/photo-<ID>`:

| Datei | Unsplash-ID | Motiv |
|---|---|---|
| `img/gastraum-*` (auch `-hoch`, gezoomter Ausschnitt) | 1578474846511-04ba529f0b88 | Dunkler Gastraum, weiß gedeckte Tische |
| `img/gang-auftakt-*` | 1615361200141-f45040f367be | Nigiri mit Stäbchen auf Schwarz |
| `img/gang-muschel-*` | 1560684352-8497838a2229 | Muschelsuppe in weißem Teller |
| `img/gang-saibling-*` | 1580476262798-bddd9f4b7369 | Fischfilet mit Kräuterrisotto |
| `img/gang-schokolade-*` | 1541783245831-57d6fb0926d3 | Schokoladenküchlein mit Sauce |
| `img/anrichten-*` | 1577106263724-2c8e03bfe9cf | Koch richtet mit Pinzette an |
| `img/kraeuter-*` | 1551218808-94e220e084d2 | Kräuter werden geschnitten |
| `img/wein-*` | 1553361371-9b22f78e8b1d | Rotwein wird eingeschenkt |
| `img/saal-*` | 1550966871-3ed3cdb5ed0c | Heller Salon mit Tischdecken |
| `img/chef-*` (aus `restaurant/`) | 1577219491135-ce391730fb2c | Koch unter Wärmelampen |
| `img/gang-rind-*` (aus `restaurant/`) | 1558030006-450675393462 | Aufgeschnittenes Rind |
| `img/tisch-*` (aus `restaurant/`) | 1414235077428-338989a2e8c0 | Fine-Dining-Teller am Tisch |
| `img/digestif-*` (aus `restaurant/`) | 1514362545857-3bc16c4c7d1b | Digestif auf Holztablett |

Schriften: **Bodoni Moda** (Owen Earl / indestructible type*) und **Jost** (Owen Earl), beide SIL Open Font License 1.1,
zur Bauzeit von Google Fonts heruntergeladen und lokal eingebunden (nur Latin-Teilmenge). Zur Laufzeit gibt es keine Anfragen an Dritte.

## Lokal ansehen

```bash
python3 -m http.server 8404 --directory /pfad/zum/Websites-Repo
# → http://127.0.0.1:8404/arena/design-fine-dining/   (Animationen aus: ?motion=off)
```
