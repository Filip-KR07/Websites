# Hero-Variante „Bühne“

## Idee

Der Hero ist eine dunkle Jazzclub-Bühne. Jeffs Kuchen stehen wie eine Band im Halbdunkel, jeder mit dem
Instrument aus seinem Jazz-Foto (Blues-berry an der Gitarre, Oreo® Oratorio am Klavier, Peanut Butter Punk am Bass …).
Ein Scheinwerfer holt einen Kuchen aus dem Dunkel; der Kuchen im Licht nennt Name, Instrument und Preis und öffnet
per Klick den Kuchen-Dialog der Basis. Darüber hängt „Cheesecake & Jazz“ als ruhige Leuchtreklame: „Cheesecake“
in warmem Neon, „& Jazz“ in blauem Neon (Blue Note). Kein Blinken, kein Flackern, nur ein einmaliges sanftes Einschalten.

## Was sich gegenüber der Basis ändert

Nur der Hero. Alles darunter (Setlist, Saison, Geschichte, Café, Feiern, Ablauf, Fuß, Dialoge, Bestellung) und die
Navigation sind unverändert; Pfade zeigen auf `../../img/`, `../../fonts/`, `../../impressum.html`, `../../datenschutz.html`.

- `index.html`: `section.hero` neu (Leuchtschild, Band als Liste mit 7 Musikern, Licht-Ebene, Text vor der Bühne).
  Bild-Preload zeigt auf das Bühnenbild von Blues-berry.
- `css/style.css`: nur Abschnitt 5 („Hero: Bühne“) ersetzt.
- `js/main.js`: nur Abschnitt 1 („Bühne“) ersetzt. Der Pause-Knopf der Platte entfällt, weil sich ohne Zutun nichts
  dauerhaft bewegt.
- `img/band-*.webp`: 7 neue 4:3-Zuschnitte der dunklen Jazz-Fotos (Cinnamon, Espresso, Oreo, Bluesberry, Peanut,
  Lemon, Marble), Kuchen mittig, je 400 und 720 px breit, zusammen ca. 330 KB. Bei Espresso ist links ein schmaler
  Rand ergänzt (Randpixel gestreckt), damit der Kuchen mittig sitzt; die weiche Maske blendet ihn aus.

Besetzung je Breite: Handy < 760 px alle 7 zum Wischen, 760–1099 px Trio (Oreo, Blues-berry, Peanut),
1100–1759 px Quintett (+ Espresso, Lemon), ab 1760 px alle 7. Die äußeren Musiker dürfen bis an den Rand reichen.

## Licht und Technik

- Das Licht ist **ein** Element (`.licht__spot`): Dunkel mit weichem elliptischem Loch (radial-gradient) und darüber
  ein Lichtkegel im Dunst (conic-gradient mit Maske, als `::before` am selben Element). Es ist doppelt so breit wie
  der Hero und wird **nur per `transform: translate3d()`** verschoben. Maße und Verläufe setzt JS nur beim Start und
  bei Größenänderung (ResizeObserver), nie pro Frame.
- Gemessen (Playwright/CDP, 60 Mausbewegungen): 0 Layouts, ein Style-Recalc je Frame für das eine Element,
  nach dem Einschwingen 0 rAF-Aufrufe. Außerhalb des Bildschirms stoppt die Feder (IntersectionObserver) und
  läuft beim Zurückscrollen weiter.
- Ebenen: Vorhang < Boden < Fotos (z 1) < Licht (z 2) < Namensschild und Klickfläche (z 3); Leuchtschild und Text liegen
  über der Band. `.band` ist ein Größen-Container (cqw/cqh) und damit ein eigener Stapelkontext, deshalb liegt
  das Licht in `.band` und wird per JS auf die Hero-Fläche gelegt.
- Klickfläche je Kuchen ist nur sein eigener Platz (`::before`, mittlere 74 %), nicht die überlappenden Ränder.

## Verhalten

| Situation | Licht | Kuchen öffnen |
|---|---|---|
| Maus, Bewegung erlaubt | folgt der Maus weich (Feder), leichter Zug zum nächsten Kuchen; Maus verlässt den Hero: zurück auf den Kuchen im Licht | Klick |
| Touch (Tablet, Reihe) | steht; Tippen auf einen anderen Kuchen fährt per Feder hin | Tippen auf den Kuchen im Licht |
| Bewegung reduziert / `?motion=off` | steht; Klick/Tippen: Bühne kurz dunkel (Dimmer), dann Licht am neuen Platz, keine Fahrt | Klick auf den Kuchen im Licht |
| Handy (< 760 px) | steht in der Mitte; die Band wird gewischt (Scroll-Snap), der mittlere Kuchen steht im Licht; Tippen auf einen Nachbarn scrollt ihn in die Mitte | Tippen auf den Kuchen im Licht |
| Tastatur | Fokus holt den Kuchen ins Licht | Enter oder Leertaste |
| Ohne JS | kein Licht, Band hell, alle Schilder sichtbar, Links führen zur Setlist | über die Setlist |

Ein kurzer Hinweis unter der Band erklärt Tippen bzw. Wischen (nicht bei Maus mit Folgelicht).
Preise im Schild werden beim Start aus den `data-groessen` der Setlist übernommen (eine Quelle).

## Bewegungswerte

- Folgelicht: Feder, Antwort 0,5 s, Dämpfungsgrad 0,86 (kaum Überschwingen), halbimpliziter Euler, Schritt max. 32 ms.
  Magnet zum nächsten Kuchen 0,3. Senkrecht folgt das Licht nur zu 22 %, begrenzt auf ±0,9 · R (R = 22 % der Bildhöhe).
- Intro (einmal, nur Maus-Reihe mit Bewegung): Licht fährt von links außerhalb auf Blues-berry, Feder Antwort 0,9 s,
  Dämpfung 1,0; Schilder erscheinen erst, wenn es angekommen ist. Neon schaltet sich per Opazität ein
  (900 ms, `--ease-out`, „Cheesecake“ nach 120 ms, „& Jazz“ nach 420 ms). Text steigt 14 px auf (700 ms, gestaffelt
  0/300/380 ms). Fotos blenden in 500 ms ein.
- Namensschild: Opazität 200 ms, dazu 0,35 rem Weg in 260 ms `--ease-out` (bei reduzierter Bewegung ohne Weg).
- Lichtwechsel ohne Bewegung: Dimmer rein 130 ms, Licht springt, Dimmer raus 220 ms `--ease-out`.
- Druck auf einen Kuchen: Bild `scale(.97)` in 140 ms.

## Bekannte Schwächen

- Die Licht-Ebene ist doppelt so breit wie der Hero (bei 1440 px ca. 2850 × 1030 px, rund 12 MB GPU-Speicher).
  Für einen weichen Verlauf vertretbar, auf sehr alten Geräten aber spürbar.
- Touch und reduzierte Bewegung brauchen zwei Schritte (erst ins Licht holen, dann öffnen). Der Hinweis unter der
  Band erklärt das, überraschen kann es trotzdem.
- Die äußeren Musiker sind am Rand angeschnitten (gewollt, Bühne größer als der Ausschnitt); ihr Fokusrahmen
  reicht dort teils über den Rand.
- Die Instrumente („Am Klavier“) beschreiben nur die Fotos, sie sind keine Angabe von Jeff.
- Nur die 7 Kuchen mit dunklem Jazz-Foto stehen auf der Bühne (Pecan und Carrot passen im Zuschnitt schlechter);
  die übrigen 11 Sorten erreicht man über „Kuchen aussuchen“.
- Auf 320 × 568 liegen die Knöpfe knapp unter dem ersten Bildschirm.
- Ohne JS beginnt die Handy-Band beim ersten Musiker (Cinnamon) statt bei Blues-berry.
- `og:image` zeigt weiter das Plattencover-Bild der Basis.
