# Hero-Variante „Kino“ – Cinemascope-Eröffnung

Aufruf lokal: `python3 -m http.server 8403 --directory /home/user/Websites` → `http://127.0.0.1:8403/arena/hero-kino/`
(`?motion=off` für den ruhigen Endzustand, `?stil=salon` / `?stil=terrasse` für die anderen Bilder).

## Idee

Die Startseite beginnt wie die erste Einstellung eines Films. Aus einem warmen Lichtspalt in der Bildmitte öffnet sich ein
schmaler Cinemascope-Streifen (2,39 : 1, schwarze Balken oben und unten). Darin steht das Restaurantfoto scharf und hell,
die Kamera fährt langsam zurück (Ken Burns). Im oberen Balken steht eine Szenenzeile wie im Drehbuch
(„Szene 1 · Innen · Gastraum · Abend“), im unteren Balken erscheint die Infozeile wie ein Abspann-Credit
(„Heute – Jetzt geöffnet“, „Entdecken“, „Adresse – Marktgasse 12“).

Dann öffnen sich die Balken zum Vollbild. Gleichzeitig verliert das Bild Schärfe und Helligkeit und tritt zurück, während
die Titelkarte „Salz & Glut“ groß und zentriert scharf wird – eine Schärfeverlagerung (Rack Focus) vom Bild auf die Schrift.
Damit ist die Kernvorgabe erfüllt: am Start geht die Schrift in den Vordergrund, das Bild in den Hintergrund. Zum Schluss
läuft einmal ein Glutschimmer über die Buchstaben (rot → orange → hell), mit leichtem Glühen um die Kanten. Der Endzustand
ist ruhig und gut lesbar (Creme auf abgedunkeltem, weichem Bild).

Beim Scrollen kommen die Kinobalken zurück (wie am Ende einer Szene), das Bild wird dunkler, die Titelkarte gleitet nach
oben weg, und der Abschnitt „Küche“ schiebt sich wie in der Basis als Blatt darüber.
Mit Maus/Trackpad gibt es nach dem Intro eine leichte Tiefe: Das Bild weicht dem Zeiger um wenige Pixel aus, die
Titelkarte folgt ihm leicht – zwei Ebenen gegeneinander machen „Schrift vorn, Bild hinten“ spürbar.

## Technik

- **Drei Hüllen um das Bild**, damit sich CSS-Intro und GSAP-Scrollen nie gegenseitig überschreiben
  (eine laufende CSS-Animation schlägt Inline-Styles):
  - `.hero__media` – Balken beim Scrollen (`clip-path`, GSAP scrub)
  - `.hero__gate` – Balken im Intro (`clip-path: inset(50% 0 50% 0)` → Streifen → `inset(0)`, eine CSS-Keyframe-Animation
    mit Kurven je Abschnitt) und Zoom beim Scrollen (GSAP)
  - `.hero__zoom` – Kamerafahrt über die Einzel-Eigenschaften `scale` und `translate` (zwei Animationen, eigene Kurve)
  - darin `<picture>` scharf + weichgezeichnete Kopie (Überblenden statt teurem Live-`filter: blur` auf dem Vollbild)
- **Intro als reine CSS-Animation** unter `html.motion.is-ready` (Abschnitt 19a in `css/style.css`, mit Zeitplan im
  Kommentar). `is-ready` setzt `main.js`, sobald das Hero-Bild dekodiert ist (Notfall nach 1,4 s); das Inline-Skript im
  `<head>` setzt es spätestens nach 2,6 s, falls `main.js` gar nicht lädt. Nur der Lichtspalt startet schon vorher, damit
  der erste Moment nicht schwarz ist.
- **Glutschimmer**: Über dem echten `<h1>` liegt im selben Grid-Feld eine stumme Kopie (`aria-hidden`) mit
  `background-clip: text` und einem Verlauf, der nur ein schmales Band enthält. Animiert wird `background-position`
  einmal von links nach rechts; am Anfang und Ende liegt das Band ganz außerhalb der Schrift, danach wird die Kopie
  `visibility: hidden`. So läuft *ein* durchgehendes Band über alle Wörter, während die Wörter des `<h1>` selbst unabhängig
  (Unschärfe → scharf, gestaffelt) erscheinen. Das Glühen ist ein `drop-shadow` auf der Hülle, der Beschnitt sitzt auf dem
  Kind (Safari verträgt beides am selben Element schlecht).
- **Scroll-Balken**: Die Balkenhöhe misst `main.js` am Element `.hero__szene` (dessen Höhe = ein Balken laut `--scope-h`),
  statt die Formel zu duplizieren; `invalidateOnRefresh` rechnet bei Größenänderungen neu.
- **Maus-Tiefe**: `gsap.quickTo` auf die beiden `<picture>` (−12 / −7 px) und `.hero__titelkarte` (+5 / +3 px), nur bei
  `(hover:hover) and (pointer:fine)`, nur mit Motion, erst nach dem Intro. `.hero__pic` hat `inset:-1.5%` Überstand.
- **Stil-Umschalter**: `setzeHero()` tauscht wie bisher Bilder, `alt` und `--hero-fokus`, zusätzlich die Szenenzeile
  (`szene` in `STILE`).
- **Ohne JS / „Bewegung reduzieren“ / `?motion=off`**: keine Klasse `motion` → sofort der Endzustand (Vollbild, weiches
  dunkles Bild, Schrift sichtbar), Lichtspalt, Szenenzeile und Glut-Kopie sind `display:none`.
- Bewegte Eigenschaften: `transform`/`scale`/`translate`, `opacity`, `clip-path`; `filter: blur` nur kurz an den
  Titelwörtern im Intro; `background-position` nur für den einmaligen Schimmer (ausdrücklich so gewünscht).
  Kurven: `cubic-bezier(.23,1,.32,1)` (ease-out), `cubic-bezier(.77,0,.175,1)` (ease-in-out), für die Kamerafahrt
  `cubic-bezier(.33,.08,.2,1)`. Staffelungen 70–80 ms.

## Anpassen

Alles am Anfang von Abschnitt 6 in `css/style.css`, im Block `.hero`:

| Variable | Wirkung |
|---|---|
| `--scope-h` | Höhe des Kinostreifens im Intro. Standard 2,39 : 1, mindestens 30 % und höchstens 74 % der Höhe |
| `--kb-x`, `--kb-y`, `--kb-s` | Startpunkt der Kamerafahrt (Verschiebung, Zoom). Endet immer bei 0 / 1. Je Stil überschreibbar (`[data-stil="terrasse"] .hero{…}`) |
| `--hero-weich` | Wie weich das Bild am Ende ist (0 = scharf, 1 = ganz weich), Standard `.74` |
| `--kino-rot`, `--kino-glut`, `--kino-kern` | Farben des Glutschimmers (Rand → Mitte). Für die Terrasse ist ein sonnigerer Ton hinterlegt |
| `--fs-kino` | Titelgröße (Handy zweizeilig, ab 900 px einzeilig wie eine Titelkarte) |

- **Szenenzeile**: Text im HTML (`data-hero-szene`) bzw. in `STILE[…].szene` in `js/main.js`. Wer sie nicht mag: Element
  `.hero__szene` löschen – die Scroll-Balken fallen dann auf 16 % zurück.
- **Zeiten des Intros**: `animation-delay`/Dauer in Abschnitt 19a; der Zeitplan steht als Kommentar darüber.
- **Maus-Tiefe abschalten**: Block „Hero-Tiefe mit der Maus“ in `js/main.js` löschen (und `inset:-1.5%` bei `.hero__pic`
  wieder auf `0` setzen).
- Hero-Bild tauschen wie in `restaurant/README.md` beschrieben (gleiche Dateinamen-Muster, inkl. weicher Variante).

## Geprüft (Playwright, Chromium)

- Keine Konsolenfehler, Seitenfehler oder fehlgeschlagenen Requests (Desktop, Handy, Stilwechsel, `?stil=salon`).
- 390 px (ohne isMobile): `scrollWidth` 375 ≤ `innerWidth` 390; auch 360 px ohne Überlauf.
- `reducedMotion: 'reduce'` und `?motion=off`: 150 ms nach DOMContentLoaded alle Hero-Elemente mit Deckkraft 1, kein
  Beschnitt, keine Skalierung.
- `javaScriptEnabled: false`: Hero vollständig sichtbar, Navigation als Linkzeile (Verhalten der Basis).
- `main.js` blockiert: Intro startet über das Sicherheitsnetz im `<head>`, Endzustand sichtbar.
- Kontrast (Hintergrund hinter jedem Text aus dem Rendering gemessen, gegen die hellsten 5 % der Pixel): Fließtext und
  kleine Zeilen ≥ 5,5 : 1 in allen drei Stilen, Desktop und Handy; Titel ≥ 5,5 : 1.
- Viewports 320–2560 px, Handy quer (844 × 390), Tablet hoch/quer, kurze Handys (360 × 640, 375 × 667): keine
  Überschneidung von Titelblock, Navigation und Abspannzeile.
- Tastatur: sichtbarer Fokusring auf den CTAs, „Entdecken“ scrollt zur Küche.

## Bekannte Schwächen

- Das Intro dauert bis zum vollständig ruhigen Zustand gut 4 s ab Aufruf (die Knöpfe erscheinen ab ca. 2,4 s und stehen
  nach ca. 3,3 s ganz da). Wer schnell
  tabbt, kann in den ersten gut 2 s unsichtbare Links fokussieren (wie in der Basis).
- Der Glutschimmer animiert `background-position` (Paint, nicht Compositor) über ca. 1,6 s; auf sehr schwachen Geräten
  kann das kurz Bildrate kosten. Danach ist die Kopie unsichtbar und kostet nichts mehr.
- Nur in Chromium getestet. `background-clip:text` mit `drop-shadow` ist für Safari entschärft (Filter und Beschnitt auf
  getrennten Elementen), aber nicht auf echter Hardware geprüft.
- Handy quer: Der Hero hat (wie die Basis) `min-height: 540px`; bei 390 px Höhe sitzt der Kinostreifen im Intro daher nicht
  genau in der sichtbaren Mitte, und die Knöpfe liegen knapp an der Unterkante.
- Bei 320 px Breite läuft die Seite um 8 px über – Ursache sind die Tabs der Speisekarte, die unverändert aus der Basis
  stammen (dort identisch), nicht der Hero.
- Die Szenenzeile („Szene 1 · Innen · Gastraum · Abend“) ist ein bewusstes Film-Zitat; für ein seriöseres Haus ggf. streichen.

## Bildnachweis

Keine neuen Fotos. Alle Bilder kommen aus `restaurant/assets/img/` (Unsplash, siehe `restaurant/README.md`).
