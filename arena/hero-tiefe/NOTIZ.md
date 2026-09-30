# Hero-Variante „Tiefe“ (3D-Raum und Parallax)

Arena-Variante des Hero-Bereichs der Restaurant-Demo „Salz & Glut“. Der Rest der Seite entspricht der Basis in `restaurant/`.
Aufruf: `/arena/hero-tiefe/` (lokal z. B. `python3 -m http.server 8402` im Repo-Root, dann `http://127.0.0.1:8402/arena/hero-tiefe/`).
Weitere Aufrufe: `?stil=salon`, `?stil=terrasse`, `?motion=off`.

## Idee

Der Hero wird als Raum mit Tiefe gebaut, nicht als flaches Bild mit Text darauf. Eine Kamera zieht zurück:

1. **Vorn:** Das Foto steht groß, hell und scharf vor dem Betrachter, leicht schräg wie aus der Hand.
2. **Zurück in den Raum:** Es fährt nach hinten (translateZ negativ) und kippt dabei gerade. Gleichzeitig wird es dunkler und weicher.
3. **Schärfeverlagerung:** Die Schärfe wandert vom Foto auf die Schrift. „Salz & Glut“ kommt vom Betrachter her (groß, unscharf, halb durchsichtig) und landet scharf auf der Schärfeebene. Das „&“ startet am weitesten vorn.
4. **Danach:** Zeile, Knöpfe, Infozeile und Navigation blenden nach. Glutfunken steigen in drei Tiefen auf, einige davon *vor* der Schrift (große, unscharfe Lichtscheiben).
5. **Maus (Desktop):** Die Ebenen federn der Maus nach. Das Foto bewegt sich gegenläufig, weniger weit und träger, und neigt sich leicht. Die Schrift geht mit der Maus, das „&“ noch etwas weiter. Nahe Glut bewegt sich am stärksten.
6. **Scrollen:** Die Ebenen trennen sich weiter. Die Schrift steigt schneller, fliegt auf den Betrachter zu und blendet aus. Das Foto weicht langsam zurück, kippt nach hinten und dunkelt ab, während sich das Blatt „Küche“ darüberschiebt.

Kernvorgabe: Am Ende steht die Schrift klar vorn und das Bild liegt weich und dunkel dahinter. Gemessener Kontrast im Endzustand
(5. Perzentil pro Textblock, alle drei Stile, 1440 × 900, 1024 × 768, 390 × 844): Fließtext ≥ 8,4 : 1, Kleintext (Eyebrow) ≥ 6,1 : 1, Titel ≥ 6,1 : 1.

## Technik

**Ebenen (von hinten nach vorn):** `.hero__media` > `.hero__zoom` (Foto + zwei weiche Kopien + Abdunklung) → `.hero__shade` (Verlauf in
Bildschirm-Ebene) → `.glut--fern`, `.glut--mitte` → `.hero__front` > `.hero__flug` > `.hero__content` (Schrift) → `.glut--nah`.

**3D ohne preserve-3d:** Jede Ebene projiziert sich selbst mit `perspective()` in ihrem eigenen `transform`, alle mit demselben
`transform-origin` (`--tiefe-fokus`, dem Fluchtpunkt). So gibt es keine Abflachungs-Fallen mit `opacity`/`overflow` auf Eltern,
und trotzdem fliegen alle Ebenen auf denselben Punkt zu. Die Schrift, die links unten steht, kommt dadurch schräg von außen ins
Bild, wie etwas, das an der Kamera vorbeifliegt.

**Randlos trotz Tiefe:** Wenn ein Vollbild-Foto nach hinten fährt, wird es kleiner. `--bild-s` gleicht das aus
(≈ (Perspektive − z) / Perspektive × 1,1). Getestet mit magentafarbenem Hero-Hintergrund: kein Rand sichtbar, weder im Intro noch mit
der Maus in allen vier Ecken noch beim Scrollen (1440 × 900, 1920 × 1080, 2560 × 1080, 1024 × 768, 768 × 1024, 390 × 844).

**Trennung von CSS und JS:** Das Intro ist reines CSS (`@keyframes` auf `.hero__zoom`, `.hero__content`, `.hero__word`, `[data-intro]`)
und läuft auf dem Compositor weiter, auch wenn der Main-Thread beschäftigt ist. JS schreibt nur auf die *äußeren* Hüllen
(`[data-hero-media]`, `[data-hero-flug]`, Glut-Ebenen) bzw. auf die eigene CSS-Eigenschaft `translate` (Titel, „&“), die sich mit dem
animierten `transform` verrechnet statt es zu überschreiben. Animiert werden nur `transform` und `opacity`, `filter: blur()` nur
kurz beim Anflug der drei Wörter.

**Intro-Start:** Ein kleines Inline-Skript am Ende der Hero-Section setzt `.is-ready`, sobald das Hero-Bild dekodiert ist, ohne auf
GSAP/Lenis/main.js zu warten. main.js macht dasselbe als Rückfall; zusätzlich bleibt das Sicherheits-Timeout im `<head>` (2,6 s).

**Schärfentiefe ohne Live-Blur:** Zwei vorberechnete Kopien liegen über dem scharfen Foto und blenden nur per `opacity` ein:
`img/<name>-mittel*.webp` (ganze Bildebene mittel unscharf, ~5 px) und die vorhandene starke `…-weich*.webp` mit einer
statischen radialen Maske um den Fluchtpunkt, also zusätzlich weicher dort, wo der Raum am tiefsten ist.

**Glut:** 21 `<i>`-Elemente in drei Tiefen-Ebenen. Das `<i>` steigt (linear, konstante Bewegung, Flackern über `opacity`),
`::before` pendelt seitlich und trägt das Leuchten als vorberechneten radialen Verlauf. Fern = klein mit hellem Kern,
mitte = weicher, nah = große Lichtscheiben (Bokeh) vor der Schrift. Pausiert, sobald das Blatt den Hero ganz verdeckt.

**Maus:** Zwei gedämpfte Federn (semi-implizites Euler-Verfahren) laufen der Mausposition (−1…1) nach: hinten träge
(Steifigkeit 55, Dämpfung 10,5), vorn schneller (105 / 13). Gemessen: Text am Ziel nach ~0,5 s mit ~4 % Überschwingen, das Foto folgt
spürbar später. Die Schleife läuft nur, solange sich etwas bewegt; in Ruhe werden die Textebenen auf ganze Pixel gerundet (gestochen
scharfe Schrift). Nur bei `(hover: hover) and (pointer: fine)` und nie bei reduzierter Bewegung. Das erste Zeigerereignis ohne echte
Bewegung wird ignoriert, damit das Layout beim Laden nicht verrutscht, nur weil der Browser eine Mausposition meldet.

**Scrollen:** GSAP ScrollTrigger liefert den Fortschritt 0…1 (Blatt „Küche“ von unten bis oben). Daraus berechnet dasselbe
`zeichne()` wie für die Maus die Transformationen, also keine zweite, konkurrierende Animation.

**Handy/Tablet:** Kein Zeiger, daher schwebt die Kamera nach dem Intro sehr langsam (16 s, `translate`/`scale` auf `.hero__media`),
damit die Tiefe auch ohne Maus spürbar bleibt. Scroll-Trennung wie am Desktop (nativer Scroll).

**Reduzierte Bewegung / `?motion=off` / ohne JS:** Keine Klasse `.motion`, also gibt es keine Startzustände. Der Hero steht sofort im
Endzustand (Foto hinten, weich, abgedunkelt, Schrift scharf), Glut ausgeblendet, keine Maus- und Scroll-Effekte.

## Anpassen

Alle Stellschrauben stehen oben in `css/style.css`, Abschnitt **6. Hero**, als Variablen auf `.hero`:

| Variable | Wirkung |
|---|---|
| `--tiefe-p` | Kamera-Abstand (Perspektive). Kleiner = stärkerer Raumeindruck |
| `--tiefe-fokus` | Fluchtpunkt (Handy: eigener Wert im Media-Query) |
| `--bild-z-start`, `--bild-z` | Wie weit vorn das Foto startet / wie weit hinten es endet |
| `--bild-s` | Ausgleichs-Skalierung, damit das Foto randlos bleibt. **Mit ändern**, wenn `--bild-z` geändert wird |
| `--bild-neigung` | Neigung in der Endlage |
| `--bild-nacht`, `--bild-weich` | Abdunklung und Zusatz-Unschärfe (pro Stil überschreibbar, siehe `[data-stil="…"] .hero`) |
| `--schrift-z-start` | Wie nah die Schrift startet |
| `--ease-kamera`, `--ease-blende` | Kurven für Kamerafahrt und Überblendungen |
| `--glut-farbe`, `--glut-kern`, `--glut-sicht`, `--glut-mass` | Farbe, Sichtbarkeit und Größe der Glut |

- **Zeitplan des Intros:** `css/style.css`, Abschnitt **19a** (Verzögerungen/Dauern je Ebene).
- **Maus und Scrollen:** `js/main.js`, Objekt `TIEFE` in Abschnitt **3b** (Weg in px bzw. Grad je Ebene, Federn, Scroll-Anteile).
- **Glut:** Markup im Hero (`--x/--y` Start, `--s` Größe, `--o` Deckkraft, `--t` Dauer, `--d` Versatz, `--dx/--h` Weg, `--w` Pendeln;
  `data-tiefe` = Mausweg der Ebene). Ganz weglassen: die drei `div.glut` löschen.
- **Anderes Foto:** wie in der Basis (`restaurant/README.md`, Abschnitt Hero-Bild), zusätzlich die mittel weichen Kopien erzeugen:
  `node werkzeug/mittel-kopien.js <name> <ordner-mit-originalen> img` (Playwright/Chromium), oder im Bildprogramm:
  1200 px breit mit ca. 4–5 px Gaußscher Unschärfe bzw. 720 × 1280 mit ca. 5 px, WebP ~75 %. Pfad der Kopien: `MITTEL_PFAD` in main.js.
- **Ohne Stil-Umschalter:** Pfade direkt in den drei `<picture>` im Hero eintragen, `MITTEL_PFAD` wird dann nicht gebraucht.

## Was gegenüber der Basis geändert ist

- `index.html`: nur das Markup in `<section class="hero">` (Ebenen, Schärfentiefe-Kopie, Glut, Inline-Start); Pfade auf `../../restaurant/…`.
- `css/style.css`: Abschnitt 6 (Hero) und 19a (Hero-Intro). Nebenbei behoben (war auch in der Basis): Bei niedrigen Fenstern
  (z. B. 1280 × 620) stieß der Titel an die Navigation und die Adresse rutschte in die Mitte der Infozeile.
- `js/main.js`: neuer Abschnitt 3b (Maus-Federn + Zeichnen), Hero-Teil in Abschnitt 7 (ScrollTrigger statt Timeline),
  Abschnitt 15 tauscht zusätzlich die mittel weiche Kopie und lädt sie vor dem Stilwechsel vor.
- Neu: `img/{innen,salon,terrasse}-mittel(-hoch).webp` (aus den vorhandenen Hero-Fotos abgeleitet, 24–35 KB),
  `werkzeug/mittel-kopien.js`. Keine neuen Fotos von Unsplash; Bildquellen wie in `restaurant/README.md`.

## Bekannte Schwächen

- **Der Endzustand als Standbild** unterscheidet sich weniger von der Basis als die Bewegung. Die Tiefe steckt im Ablauf, in der Maus
  und im Scrollen. Auf Touch-Geräten fehlt die Maus-Parallaxe; dort gibt es nur das langsame Schweben und die Scroll-Trennung.
- **Z-Fahrt eines randlosen Fotos wirkt optisch zum großen Teil wie ein Zoom.** Räumlich lesbar wird sie durch die Neigung, die
  gemeinsame Fluchtpunkt-Bewegung mit der Schrift, die Parallaxe und die Glut in mehreren Tiefen.
- **Überskalierung:** Damit das Foto randlos bleibt, ist es am Intro-Start ca. 1,5-fach vergrößert. Deshalb fordert `sizes` die
  2000-px-Datei an (Desktop ~350 KB statt ~230 KB). Auf großen Retina-Bildschirmen ist der Startmoment trotzdem etwas weich.
- **Unschärfe:** Das Foto ist am Ende deutlich weicher als in der Basis. Der Raum bleibt als Restaurant erkennbar, Details aber nicht.
  Wer mehr Foto will: `--bild-weich` auf 0 und/oder die mittel weiche Kopie mit kleinerem Radius erzeugen.
- **Zusätzlicher Pflegeschritt:** Pro Hero-Foto braucht es zwei weitere Dateien (mittel weich quer/hoch).
- **Glut ist Dekoration:** 21 Elemente mit 42 Compositor-Animationen. Sie pausieren erst, wenn der Hero ganz verdeckt ist, nicht bei
  verstecktem Tab (das übernimmt der Browser). Für sehr nüchterne Marken eher weglassen.
- **Erster Screenshot bei 250 ms:** In Headless-Chromium ist der erste Frame erst bei ~200 ms fertig, das Foto blendet dort gerade ein
  und wirkt noch etwas dunkel.
- **Während des Anflugs** liegt die halbtransparente, große Schrift kurz über dem noch scharfen, hellen Foto. Das ist gewollt als
  Moment des Vorbeiflugs, aber in diesem Augenblick nicht gut lesbar.
- **Nur in Chromium getestet** (Playwright). `perspective()` im `transform` plus eigene `translate`-Eigenschaft sollten in Safari ≥ 14.1
  und Firefox genauso funktionieren, echtes iOS/Safari wurde nicht geprüft.
- **Stil-Links (`?stil=salon`)** auf langsamen Verbindungen: Wie in der Basis wird das Stil-Bild erst von main.js eingesetzt; bei sehr
  langsamem Netz kann das Intro kurz mit dem Standardbild beginnen.
- Ohne GSAP (Skript fehlt) gibt es keine Scroll-Trennung, nur das Blatt, das sich über den Hero schiebt; Intro und Maus laufen weiter.
