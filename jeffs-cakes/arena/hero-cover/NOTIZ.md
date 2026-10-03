# Hero-Variante „Cover“

## Idee

Das ganze Hero ist ein Jazz-Plattencover, wie Reid Miles sie in den 50ern und 60ern für Blue Note gestaltet hat:
harte Farbflächen in Messing und Kobalt, riesige Schrift im Raster, ein Duoton-Foto und kleine Katalog-Typografie.
„CHEESECAKE“ steht schwarz auf Messing und füllt die ganze Breite, „& JAZZ“ steht creme auf Kobalt, und beide
Wörter laufen rechts aus dem Bild (angeschnitten). Das Foto ist der Espresso Ensemble als Duoton in Blau und Messing.
Eine Beschriftung im Foto („Auf dem Cover · Track A3“) öffnet den Kuchen direkt.

## Was sich gegenüber der Basis ändert

Nur das Hero. Alles darunter ist identisch mit `jeffs-cakes/` (Pfade auf `../../` umgestellt).

- **HTML** `section.hero.cover`: Katalogzeile (Jeff's Cheesecake · Hamburg-Winterhude | „JC 18“ und „Stereo“,
  reine Gestaltung und `aria-hidden`; 18 ist die Zahl der Sorten), `h1` in zwei Blöcken (Cheese|cake / & Jazz,
  mit `aria-label`, weil Chrome sonst „Cheese cake“ vorliest), Duoton-Foto mit einem Knopf, der über
  `data-kuchen-oeffnen` den Dialog zum Espresso Ensemble öffnet, dazu ein Satz, zwei Knöpfe und drei Fakten.
  Keine Platte, kein Pause-Knopf. Im `<head>` wird jetzt die Archivo-Schrift und das Cover-Bild vorgeladen.
- **CSS Abschnitt 5** neu (plus Titel im Inhaltsverzeichnis). Jedes Element malt seine Fläche selbst, deshalb gehen
  Fläche und Schrift beim Auftakt gemeinsam auf, und ohne JS steht alles fertig da. Die Überschrift legt ihre Blöcke
  per `subgrid` ins Raster.
- **JS Abschnitt 1** neu: Wörter per Breitenachse einpassen und Parallaxe. Variablen tragen den Präfix `cover…`,
  weil Abschnitt 8 der Basis `zeichnen` und `geplant` im selben Funktionsbereich deklariert.
- **Neue Dateien:** `fonts/archivo-latin-wdth-normal.woff2` (Archivo, SIL OFL, Breite 62–125 %, Gewicht 100–900,
  90 KB), `img/cover-espresso-800.webp` und `-1400.webp` (Duoton, zusammen 100 KB). Das Duoton stammt aus
  `Espresso.png`: Graustufen, Kontrast mit `-sigmoidal-contrast 8,51%`, Farbtabelle
  Nachtblau `#080C22` → Kobalt `#22408F` → Messing `#E2B76C` → Creme `#F6E6C4`.

## Raster (ändert sich, schrumpft nicht nur)

| Breite | Aufbau |
|---|---|
| < 640 px | Stapel: Katalog / **CHEESE** (62 % Breite) / **CAKE** (125 %) bündig übereinander / Fotoband 2:1 / **& JAZZ** / Text. Niedrige Handys (≤ 700 px hoch): Foto 5:2 |
| 640–1023 px | CHEESECAKE in einer Zeile, Fotoband 21:9, „& Jazz“ so groß wie „Cheesecake“ und gesperrt, Text zweispaltig |
| ≥ 1024 px | CHEESECAKE über die volle Breite, darunter Foto (5/12) und Kobalt (7/12) mit „& Jazz“, Satz, Knöpfen. Die Fakten stehen unten an der Kante. Bei niedrigen Fenstern richtet sich die Schriftgröße nach der Höhe (1280 × 620 passt komplett) |

Das Einpassen stellt nur die Breitenachse (`font-stretch`) ein, nie die Größe, deshalb springt keine Höhe. Reichen
125 % nicht (niedrige Fenster), wird gesperrt: „J A Z Z“. Ohne JS oder ohne Schrift gelten die Näherungswerte aus
dem CSS. Die Wörter ragen um `--ueberstand` (0,8 × Rand) aus dem Bild, das Cover schneidet sie per `overflow: clip`
ab. Es gibt kein horizontales Scrollen.

## Bewegung

Auftakt, reines CSS, nur `clip-path` und `transform`, Kurve `--ease-out` = `cubic-bezier(0.23, 1, 0.32, 1)`. Er
wartet auf nichts: Text auf Kobalt (Satz, Knöpfe, „Jazz“) ist ab dem ersten Bild lesbar, die Knöpfe sind sofort
klickbar.

| Ebene | Bewegung | Zeit |
|---|---|---|
| Messing (Katalog + Cheesecake) | `clip-path` öffnet von links | 0–720 ms |
| Wörter Cheese / cake | steigen aus `translateY(45%)` | 40 bzw. 110 ms, je 820 ms |
| Foto | `clip-path` öffnet von unten, Bild setzt sich von `scale(1.12)` | 140–920 ms bzw. 140–1240 ms |
| Kobalt-Fläche (nur die Fläche, nicht der Text) | `clip-path` öffnet von rechts | 220–940 ms |
| „Jazz“ | schiebt aus `translateX(14%)` | 220–1040 ms |
| „&“ | dreht sich ein (−22°, 0,88, Deckkraft 0) | 420–980 ms |
| Foto-Beschriftung | blendet ein | 700–1100 ms |

Parallaxe beim Scrollen über das Hero, nur `translate3d`/`rotate`, per rAF und nur solange das Cover sichtbar ist:
„Cheesecake“ −0,07 × Scroll (nach links), „Jazz“ +0,06 × Scroll (nach rechts), „&“ −0,05 × Scroll nach oben und
−0,012°/px, Foto +0,12 × Scroll nach unten (gedeckelt auf den Überstand von 14 %). Die Wörter laufen dabei weiter
aus dem Bild. Bei „Bewegung reduzieren“ und `?motion=off` gibt es keinen Auftakt und keine Parallaxe, alles steht.

Knöpfe: Druck `scale(0.97)` (140 ms), Hover nur bei Maus. Die Foto-Beschriftung ist ohne JS `disabled` und nur
Text, JS schaltet sie frei.

## Selbsttest (Playwright, Chromium 141)

1440×900, 1280×620, 1024×768, 1920×1080, 768×1024, 390×844, 320×568, 844×390, `reducedMotion: 'reduce'`,
`?motion=off`, ohne JS. Ergebnis: keine Konsolenfehler, keine fehlgeschlagenen Requests, kein horizontales
Scrollen, Katalogzeile frei unter der Navigation. Die Knöpfe liegen überall außer 320×568 und Querformat-Handy im
ersten Bildschirm und treffen beim Klick. Beim Ausprobieren klappte: „Kuchen aussuchen“ → Setlist, „Ins Café“ →
Café, Beschriftung → Dialog Espresso Ensemble → in die Bestellung → Formular → „Danke“. Der Auftakt wurde Bild für
Bild geprüft (Animationen pausiert und gesetzt). Ohne `text-box` (Fallback wie in Firefox) hält der Satz auch.

## Bekannte Schwächen

- 320×568 und Handy quer: Die Knöpfe liegen unter dem ersten Bildschirm (ein kurzer Wisch). Der erste Bildschirm
  zeigt das ganze Cover, auf 320×568 ragt der Satz gerade noch hinein.
- `text-box: trim-both` (exakter Zeilenstand) gibt es in Chrome und Safari 18.2+. Firefox nutzt `line-height: .8`,
  dort sitzen die Zeilen etwas lockerer.
- Lädt Archivo sehr spät (langsames Netz), stehen die Wörter kurz in der Ersatzschrift und werden danach eingepasst.
- Das Duoton färbt den Kuchen blau-messing: Das ist gewollt (Cover), zeigt aber nicht die echte Farbe. Im Dialog
  ist das Originalfoto zu sehen.
- Nur in Chromium getestet; Safari (subgrid, `cqi`, `text-box`) sollte passen, ein echtes iPhone fehlt.
- Die Parallaxe läuft per JS im Hauptthread. Bei so wenigen Ebenen ist das unkritisch, ruckelt aber eher als
  CSS-Scroll-Animationen.
