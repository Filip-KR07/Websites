# Hero-Variante „Durchblick (Schrift als Fenster)“ – Salz & Glut

Aufruf: `python3 -m http.server 8401 --directory /home/user/Websites` → `http://127.0.0.1:8401/arena/hero-durchblick/`
(`?motion=off` = ohne Bewegung, `?stil=salon` / `?stil=terrasse` = andere Stile).

## Idee

Am Start ist der Bildschirm fast schwarz. Der Name „Salz & Glut“ steht riesig, fast bildschirmfüllend darauf, und nur
durch die Buchstaben sieht man den Gastraum, wie durch Fenster. Dann trennen sich die Ebenen: Die Wörter schrumpfen an
ihren Platz, aus den Buchstaben quillt Licht (das Foto wächst von den Buchstabenkanten nach außen, passend zu „Glut“),
der schwarze Grund hebt sich, und das Foto wird zum vollflächigen Hintergrund. Dabei wird es kleiner, dunkler und weicher.
Gleichzeitig füllen sich die Buchstaben hell. Ergebnis: Schrift vorn, Bild hinten, entstanden aus einem Moment.

Beim Scrollen läuft der Moment rückwärts: Während sich „Küche“ als Blatt darüberschiebt, wird der Raum dunkel und das
Bild ist wieder nur durch die Buchstaben zu sehen.

## Ablauf (ab `.is-ready`, alles CSS-Animationen)

| Zeit | Was passiert |
|---|---|
| 0–1,1 s | Wörter leuchten gestaffelt auf (80 ms), das Foto ist nur in den Buchstaben zu sehen und gleitet langsam zurück |
| 1,15–2,55 s | Wörter schrumpfen aus Fenstergröße (Desktop ca. ×2, Handy ca. ×2,2) an ihren Platz |
| 1,5–2,3 s | Lichthof: erst eng, dann weit – das Bild wächst aus den Buchstaben |
| 1,5–3,1 s | Abdunklung und Weichzeichnung setzen ein, der schwarze Grund hebt sich (1,88–2,88 s) |
| 1,95–2,9 s | Die echte Schrift füllt sich hell (vorher 16 % Deckkraft als „Glasscheibe“) |
| 2,2–3,2 s | Zeile oben, Text, Knöpfe, Infozeile, Navigation |

Jede Eingabe (Mausrad, Touch, Taste) spielt den Rest des Intros 2,5× schneller ab. Nach dem Intro setzt main.js
`.ist-fertig`: Alle Start-Zustände und Intro-Animationen fallen weg, die Lichthöfe werden entfernt.

## Technik

1. **Fenster-Ebene** (`.hero__fenster`, baut `main.js`): Kopie von `.hero__content` mit schwarzem Grund und weißer
   Schrift, per `mix-blend-mode: multiply` über das Foto gelegt. Schwarz × Foto = schwarz, Weiß × Foto = Foto, also werden
   die Buchstaben zu Fenstern. Es ist echte HTML-Schrift mit Webfont, nicht per SVG, und lässt sich deshalb mit
   `transform`/`opacity` animieren. Weil die Kopie dasselbe Layout hat, liegen die Fenster pixelgenau unter der echten h1,
   auch nach Größenänderung und Stilwechsel (geprüft: Versatz 0 px). In der Kopie werden ids und data-Attribute entfernt,
   h1 wird zu div und Links zu span, dazu `aria-hidden` und `inert`. Der Name steht damit nur einmal im HTML.
2. **Messung (FLIP je Wort)**: `main.js` misst eine unsichtbare Messkopie des Namens (`.hero__satz--fenster`) und rechnet
   sie so groß, dass sie ca. 90 % Breite / 80 % Höhe füllt (hochkant 70 %). Daraus entstehen je Wort `--wx`, `--wy`,
   `--ws`. Die Animation nutzt die Einzel-Properties `translate` und `scale`, damit sie sich nicht mit dem Aufleuchten
   (`transform`) ins Gehege kommt. Gemessen wird mit `offsetLeft/Top`, das ignoriert laufende Transforms. Start erst, wenn
   das Hero-Bild dekodiert und die Schrift geladen ist, Notfall-Start nach 1,6 s.
3. **Glasscheibe**: Die echte Schrift steht in der Fensterphase mit `--glas: .16` Deckkraft über den Fenstern. So bleiben
   die Buchstaben auch lesbar, wenn hinter ihnen eine dunkle Bildstelle liegt (beim Gastraum sonst das „G“).
4. **Lichthof**: Je Wort zwei statisch weichgezeichnete Kopien (`::before` blur .05em, `::after` blur .2em), die
   nacheinander nur einblenden. Der Weichzeichner wird nicht animiert, und nach dem Intro gibt es die Pseudo-Elemente nicht mehr.
5. **Scroll** (GSAP ScrollTrigger, erst nach dem Intro angelegt): Bild skaliert auf 1.1, Zusatzinhalte blenden aus, der
   schwarze Grund kommt zurück, die helle Schrift wird wieder zum Fenster, Abdunklung und Weichzeichnung gehen weg. Die
   Fenster-Ebene ist bei Scroll 0 `visibility:hidden`, sie kostet dann keine Blend-Berechnung.
6. **Fallbacks**: Ohne JS, mit `prefers-reduced-motion` oder `?motion=off` gibt es keine Fenster-Ebene, der Hero ist
   sofort fertig sichtbar. Lädt main.js nicht, startet das Sicherheitsnetz im `<head>` nach 2,6 s ein einfaches Einblenden.

Bewegungsregeln: nur `transform`/`translate`/`scale`/`opacity`, Filter nur statisch im Intro. Kurven sind `--ease-out`
(.23,1,.32,1) und `--ease-in-out` (.77,0,.175,1), kein ease-in, kein scale(0), Staffelungen 60–80 ms. Das Intro ist
reines CSS, GSAP läuft nur scroll-gekoppelt. Neue Hover-Effekte gibt es keine.

## Anpassen

| Was | Wo |
|---|---|
| Name | nur im HTML, `<h1 class="hero__title">`: jedes Wort ein `.hero__word`, `.hero__umbruch` = Zeilenwechsel im Querformat. Beliebig viele Wörter |
| Gewicht des Namens | `--w-hero` (Standard 560, Salon 600). Kräftiger = mehr Bild in den Buchstaben |
| Größe am Ende | `--fs-titel` an `.hero__content` (Quer- und Hochformat getrennt) |
| Bildausschnitt in der Fensterphase | `--fenster-zoom` / `--fenster-fokus` in `.hero` (je Stil und hochkant eigene Werte). Helle, ruhige Bildstellen hinter die Buchstaben legen |
| Bildausschnitt am Ende | `--hero-fokus` (setzt der Stil-Umschalter aus `STILE` in main.js) |
| Zeiten | `--t-setzen`, `--d-setzen`, `--t-oeffnen`, `--t-fuellen`, `--t-rest` in 19a |
| Glasscheibe | `--glas` (0 = reine Fenster) |
| Anderer Start-Umbruch | eigene Regeln für `.hero__satz--fenster`. Achtung: Bei 2→1 Zeile kreuzen sich Wörter, getestet und verworfen |
| Abdunklung | `.hero__shade` (Quer- und Hochformat getrennt) |
| Hero-Bild | wie in der Basis-README (`restaurant/assets/img/hero/`), Pfade im `<picture>` und `HERO_PFAD` |

## Geprüft (Playwright, Chromium)

- keine console errors, pageerrors oder fehlgeschlagenen Requests (Desktop, Handy, Stilwechsel, ganz durchscrollen)
- 390 px ohne isMobile: `scrollWidth` 375 ≤ 390, auch mitten im Intro. Weitere Formate: 375×667, 360×780, 412×915,
  768×1024, 844×390, 1024×768, 1280×720, 1366×768, 1920×1080, ohne Überlauf und ohne Kollision mit der Infozeile
- `reducedMotion: 'reduce'` und `?motion=off`: alles sofort mit Deckkraft 1, keine Fenster-Ebene
- ohne JavaScript: alles sichtbar
- Kontrast gemessen gegen den Bildhintergrund, ohne Textschatten: Lead ≥ 5,1:1 an den hellsten Pixeln (alle drei Stile,
  Desktop/Handy/Tablet), Titel ≥ 4,4:1 (5. Perzentil)
- Barrierefreiheit: eine h1 „Salz & Glut“, Fenster-Kopie nicht im Accessibility-Baum

## Bekannte Schwächen

- Das Intro ist lang: Knöpfe und Navigation stehen erst nach ca. 3,2 s. Eine Eingabe beschleunigt, ein Überspringen gibt es nicht.
- Die Fensterphase lebt vom Bildinhalt. Dunkle Bildstellen hinter den Buchstaben machen die Fenster schwach, das mildert
  die Glasscheibe. Für ein neues Foto muss `--fenster-fokus` von Hand gewählt werden.
- Blend-Ebene plus Weichzeichner auf großer Schrift sind im Intro GPU-Last. Nur in Headless-Chromium getestet, nicht auf
  echten schwachen Handys, nicht in Safari/Firefox (Einzel-Properties `translate`/`scale` brauchen Safari 14.1+; ältere
  Browser zeigen die Fenster ohne Skalierung).
- Langsames Netz: Nach dem Notfall-Start (1,6 s) ohne Bild sieht man zunächst nur die Glasscheibe, bis das Foto nachlädt.
- Scrollt jemand während des Intros, greift der Scroll-Effekt erst nach dem Intro (kleiner Sprung möglich).
- Lädt main.js nicht, startet das einfache Einblenden erst nach 2,6 s (Sicherheitsnetz der Basis).
- Die dünnen Schwünge des kursiven „&“ zeigen als Fenster wenig Bild. Im Hochformat berührt der Schwung das „G“ leicht.
- Der Name ist mit Gewicht 560 kräftiger als die übrigen Überschriften der Seite (360). Das ist Absicht, damit die
  Buchstaben als Fenster tragen, bricht aber leicht mit dem leichten Schriftbild der Basis.
- Keine neuen Fotos verwendet (nur die vorhandenen Hero-Bilder).
