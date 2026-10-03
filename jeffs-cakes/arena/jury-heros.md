# Jury-Bericht: Hero-Varianten Jeff's Cakes

> Vollständiger Jury-Bericht. Die erwähnten Screenshots, Videos und Messskripte sind beim Test lokal entstanden und nicht im Repo.

Jury „Heros“ · 3. Oktober 2026 · Chromium (Playwright, headless) auf Port 8151 · alle Belege in `jury-heros/shots/`, Messskripte `*.mjs`, Rohdaten `*.json`/`perf.txt`.

Bewertet wurden die Basis `jeffs-cakes/` (Plattencover) und drei Hero-Varianten unter `jeffs-cakes/arena/`:
`hero-buehne` (Scheinwerfer auf Kuchen-Band), `hero-cover` (Blue-Note-Cover), `hero-plattenkiste` (Kiste zum Durchblättern).

## 0. Prüfung „nur der Hero ist anders“ (diff)

Nach Normalisieren der Pfade (`../../` → ``) weichen die Varianten von der Basis nur hier ab:

| Datei | Abweichung außerhalb des Heros |
|---|---|
| `index.html` | nur Zeile 22 (Bild-Preload; Cover zusätzlich Font-Preload) und der Block `<section class="hero">` (Basis Z. 104–143). Setlist, Dialoge, Formular, Fuß: identisch. |
| `css/style.css` | nur Inhaltsverzeichnis-Zeile 7, die `@font-face`-Pfade (Z. 11–15, `../../../fonts/`) und Abschnitt 5. Ab „6 Setlist“ byte-gleich. |
| `js/main.js` | nur Kopfkommentar Z. 2 und Abschnitt 1. Ab „2 Setlist“ byte-gleich. |

Ergebnis: Die Bedingung ist eingehalten. Alle Pfade auf Basis-Ressourcen laden (keine fehlgeschlagenen Requests auf allen 4 Seiten × 5 Viewports).

## 1. Ergebnis

| Platz | Ordner | Gesamt | Wirkung /30 | Bewegung /20 | Mobil /20 | Inhalt & Bestellweg /15 | Technik & A11y /15 | Idee in einem Satz |
|---|---|---|---|---|---|---|---|---|
| 1 | `arena/hero-plattenkiste` | **86** | 24 | 18 | 15 | 15 | 14 | Eine Holzkiste mit 18 Plattenhüllen, eine pro Kuchen, die man wie im Plattenladen durchblättert und direkt bestellt. |
| 2 | `arena/hero-buehne` | **84** | 26 | 14 | 17 | 14 | 13 | Die Kuchen stehen als Band im dunklen Jazzclub, ein Scheinwerfer holt einen ins Licht, darüber „Cheesecake & Jazz“ als Leuchtreklame. |
| 3 | `arena/hero-cover` | **79** | 22 | 16 | 16 | 12 | 13 | Der ganze Hero ist ein typografisches Blue-Note-Cover in Messing und Kobalt mit Duoton-Foto. |
| 4 | `jeffs-cakes/` (Basis) | **75** | 20 | 14 | 15 | 12 | 14 | Klassischer Zweispalter: Titel links, Plattenhülle mit Blues-berry-Foto rechts, aus der eine Platte gleitet. |

Die Plätze 1 und 2 liegen nah beieinander. Die Bühne hat die stärkere Stimmung. Die Kiste ist handwerklich sauberer, und der Weg zur Bestellung ist dort am kürzesten.

## 2. Gemeinsame Messwerte

| Test | Basis | Bühne | Cover | Kiste |
|---|---|---|---|---|
| Konsole / Requests (5 Viewports, RM, motion=off, ohne JS) | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |
| Waagerechtes Scrollen (`scrollWidth > clientWidth`) | nein | nein | nein | nein |
| Kernaufgabe 26 cm → Bestellung → Lieferung PLZ 22299 → absenden (1440 + 390 Touch) | ok (Blues-berry 49 €) | ok, direkt aus dem Hero (Blues-berry 49 €) | ok, über Foto-Beschriftung (Espresso Ensemble 49 €) | ok, über „Bestellen“ (Blues-berry 49 €) |
| Frühestes Datum (3 Werktage) | 07.10.2026 | gleich | gleich | gleich |
| rAF 3 s bei 1440×900, mit Interaktion (Median / max / >20 ms) | 16,7 / 33 / 1 | 16,7 / 16,8 / 0 (Maus-Sweep) | 16,7 / 16,8 / 0 (Scroll) | 16,7 / 33 / 1 (Ziehen) |
| dasselbe bei 4× CPU-Drossel | 0 Ausreißer | 1 × 33 ms | 2 × 33 ms | 1 × 50 ms |
| Lange Tasks im Messfenster | keine | keine | keine | keine |
| Hauptthread in 3 s Interaktion (Skript / Style / Layouts) | 0 / 0 / 0 | 12 ms / 38 ms / 0 | 6 ms / 19 ms / 1 | 22 ms / 67 ms / 18 |
| Composited Layers (zeichnend) | 9 | 6, darunter **2850×1032 CSS-px** Lichtebene | 15 | 22 (18 Hüllen + Schatten mit `will-change`) |
| Bilder beim Laden 1440 / 390 (KB) | 93 / 328 | 120 / 474 | 85 / 326 (+ 90 KB Font) | 349 / 516 |
| `reducedMotion` / `?motion=off` | nichts unsichtbar, Platte steht | nichts unsichtbar, Licht steht, Wechsel per Dimmer | alles steht sofort | Kiste steht, Ziehen folgt, Loslassen springt |
| JavaScript aus | lesbar | lesbar, Band hell mit allen Schildern | lesbar, Beschriftung als Text | lesbar, Kiste statisch, Bestellen ausgeblendet |
| Tastatur: Fokus im Hero sichtbar, Dialog Esc, Fokus zurück | ja | ja (Fokus holt Kuchen ins Licht) | ja | ja (Pfeile, Pos1/Ende sofort) |

Hinweis: Headless Chromium rendert per Software. Die Bildraten zeigen nur, dass der Hauptthread entlastet ist. Über die GPU-Last sagen sie nichts. Die Layer-Größen stammen aus der CDP-LayerTree.

---

## 3. Basis `jeffs-cakes/` – Plattencover

**Eindruck.** Sauber, markentreu (Nachtbraun, Messing, Bebas + Instrument Serif), ruhig. Der Hero ist aber ein Standard-Zweispalter. Die „Platte, die herausgleitet und sich dreht“ fällt kaum auf: Sie schaut nur zu 35 % hinter der Hülle hervor, und die dunklen Rillen drehen unsichtbar.

| Kriterium | Punkte | Begründung |
|---|---|---|
| Wirkung & Konzept | 20/30 | Stimmig und markentreu, aber austauschbares Layout; die Plattenidee trägt, ist aber zu leise inszeniert. |
| Handwerk Bewegung | 14/20 | Eigene Kurven, nur transform/opacity, Drehung mit Pause-Knopf und Stopp außerhalb des Bildes; im Intro ist aber die Platte vor der Hülle sichtbar und scheint durch die halbtransparente Hülle (Geisterbild). |
| Mobil | 15/20 | 390: Bild, Titel, CTA im ersten Bildschirm; 320 und quer liegt der CTA darunter, quer sieht man nur das Bild. |
| Inhalt & Bestellweg | 12/15 | Fakten stimmen; die Hülle mit „Track B1 Blues-berry“ ist nicht anklickbar (`aria-hidden`), zum Kuchen geht es nur über „Kuchen aussuchen“ und die Setlist. |
| Technik & A11y | 14/15 | Fehlerfrei, ohne JS lesbar, reduzierte Bewegung korrekt, Fokus sichtbar; einziger Makel: zwei seitengroße Ebenen durch `mix-blend-mode` am Korn. |

**Fehler**
1. Handwerk: `css/style.css:321–322` blendet nur `.huelle` ein (`opacity: 0`), die `.platte` hat keine Deckkraft-Regel. Folge: Im ersten Bild steht die Platte allein, danach scheint sie durch die einblendende Hülle (Video-Frames 0–400 ms, `shots/intro-basis.png`).
2. Konzept: `css/style.css:272/329`: Mit `translateX(35%)` bleibt die Platte größtenteils hinter der Hülle, die Drehung (Z. 308) ist kaum wahrnehmbar.
3. Bestellweg: `index.html:126`: Der Hero-Kuchen ist Dekoration ohne Klickziel.

**Empfehlung:** Als solide Rückfallebene behalten, nicht als Hero-Sieger.

---

## 4. `arena/hero-buehne` – Bühne mit Scheinwerfer

**Eindruck.** Der stimmungsvollste Hero. Die dunkle Bühne, der Vorhang und die warme bzw. blaue Neonschrift erzählen Jeffs Jazzclub-Geschichte direkt. Die Kuchen als Band („Blues-berry an der Gitarre“) sind charmant, und fünf bis sieben Sorten stehen schon im Hero. Schwächen: Die unbeleuchteten Kuchen sind fast schwarzbraun, und die Instrumente sind erfunden.

**Interaktion ausprobiert**
- Maus 1440: Das Licht folgt weich (Feder 0,5 s / 0,86) und rastet auf jedem der fünf Kuchen richtig ein. 24 schnelle Links-rechts-Sprünge in 50-ms-Takt: kein Sprung über 112 px pro Bild, danach steht es korrekt auf Peanut. Verlässt die Maus den Hero (in die Navigation), kehrt das Licht zum beleuchteten Kuchen zurück. An den Rändern bleibt es geklemmt. Klick ohne Verweilen auf einen unbeleuchteten Kuchen öffnet direkt dessen Dialog (Latin Lemon). Esc gibt den Fokus an den Kuchen zurück.
- Tablet 1024 Touch: Antippen fährt das Licht per Feder hin, zweites Antippen öffnet. Ein schnelles Links-dann-rechts wird sauber umgelenkt.
- Handy 390/320: natives Scroll-Snap-Karussell, der mittlere Kuchen steht im Licht. Tippen auf einen Nachbarn holt ihn in die Mitte, Tippen in die Mitte öffnet. Senkrechtes Wischen auf der Band scrollt die Seite (323 px). Ein langsamer Wisch geht genau einen Kuchen weiter, ein schneller zwei (natives Fling).
- Tastatur: Tab-Folge Navigation → 5 Kuchen → CTAs. Der Fokus holt den Kuchen ins Licht, Enter und Leertaste öffnen.
- Reduzierte Bewegung: Das Licht steht. Ein Klick dimmt 130 ms ab, das Licht springt, der Dimmer blendet 220 ms aus. Ein zweiter Klick öffnet. Vorbildlich gelöst.

| Kriterium | Punkte | Begründung |
|---|---|---|
| Wirkung & Konzept | 26/30 | Stärkster erster Eindruck und am dichtesten an Jeffs Geschichte; die Nebenkuchen sind im Halbdunkel aber kaum appetitlich. |
| Handwerk Bewegung | 14/20 | Feder, unterbrechbar, nur ein transform pro Bild, rAF stoppt in Ruhe und außerhalb, guter RM-Ersatz; aber zwei sichtbare Fehler im wichtigsten Moment (Intro) und eine riesige Lichtebene. |
| Mobil | 17/20 | Kompakt, alles Wichtige im ersten Bildschirm (390), natives Karussell, Hinweistext; auf 320 sind die Knöpfe angeschnitten, während des Wischens überlagern sich zwei Namensschilder. |
| Inhalt & Bestellweg | 14/15 | Sieben Kuchen führen direkt in den richtigen Dialog, die Preise kommen aus der Setlist (geprüft: 29/29/30/29/30/29/29 €); auf Touch sind es zwei Schritte, die Instrumente sind erfunden. |
| Technik & A11y | 13/15 | Fehlerfrei, gute Tastatur- und RM-Lösung, ohne JS lesbar; die große GPU-Ebene, ein abgeschnittener Fokusrahmen am Rand und überlappende Schilder ohne JS auf dem Handy kosten Punkte. |

**Fehler**
1. Bug (Intro): `js/main.js:165` setzt das Licht auf `-0,8 × Kuchenbreite`, die Ebene ist aber nur 2 × Hero breit (`main.js:117`, `style.css:337`). Solange `s.x < 0` ist, deckt das Dunkel den rechten Bühnenrand nicht ab. Ein heller Vorhangstreifen mit harter senkrechter Kante wandert rund 0,2–0,4 s mit (`shots/bue-intro-streifen.png`, `shots/intro-buehne-frueh.png`). Abhilfe: Ebene 3× breit oder das Intro bei `x = 0` starten.
2. Bug (vor JS): `.licht` liegt in `.band` mit `inset: 0` (`css/style.css:335`) und wird erst in `main.js:116` auf Hero-Größe gesetzt. Bis `main.js` läuft, sieht man einen dunklen Kasten über der Band, darüber und darunter hellen Vorhang. Danach springt die ganze Bühne ins Dunkel (`shots/bue-vor-js.png`). Das widerspricht dem Kommentar „kein Aufblitzen“ in `style.css:357`.
3. Leistung: Die Lichtebene `.licht__spot` (2 × Hero-Breite, `css/style.css:337`, `will-change: transform`) misst bei 1440×900 2850×1032 CSS-px, bei 1920 3810×1206. Auf Retina (DSF 2) sind das rund 47–73 MB GPU-Speicher für einen Verlauf.

**Empfehlung:** Mit Änderungen übernehmen: Intro-Abdeckung und Vor-JS-Zustand reparieren, Lichtebene verkleinern (z. B. Loch als eigenes kleines Element).

---

## 5. `arena/hero-cover` – Blue-Note-Cover

**Eindruck.** Am eigenständigsten und plakativsten. Die Messing- und Kobaltflächen, das randabfallende CHEESECAKE und das kursive „&“ sind gekonnte Reid-Miles-Typografie, und der Auftakt per `clip-path` (unter 1,1 s) ist knackig. Für eine Konditorei aber riskant: Das Duoton färbt den Kuchen blaugrau, nur eine von 18 Sorten ist zu sehen, und Kobalt gehört nicht zu Jeffs Braun. Der Hero wirkt wie eine andere Website als der Rest. Die durchscheinende Navigation wird über dem Messing schlammbraun.

| Kriterium | Punkte | Begründung |
|---|---|---|
| Wirkung & Konzept | 22/30 | Starke, eigenständige Grafik mit klarem Jazzbezug, aber markenfremde Farbwelt und ein unappetitliches Produktfoto. |
| Handwerk Bewegung | 16/20 | Auftakt gestaffelt, starke Kurve, wartet auf nichts, Text sofort lesbar; die Parallaxe per JS im Hauptthread (inkl. drehendem „&“) ist reine Deko, die Keyframes einmalig. |
| Mobil | 16/20 | Gestapeltes Cover funktioniert, auf 390 liegt der CTA im ersten Bildschirm; auf 320 und quer liegt der CTA darunter, quer füllt das Foto den ganzen Bildschirm. |
| Inhalt & Bestellweg | 12/15 | Fakten stimmen, die Beschriftung öffnet Espresso Ensemble direkt; nur ein Kuchen, und dessen Farbe stimmt im Hero nicht. |
| Technik & A11y | 13/15 | Fehlerfrei, `aria-label` am h1, ohne JS sauber, RM steht still; ohne die Archivo-Schrift zerfällt aber der Titel. |

**Fehler**
1. Robustheit: Ohne Archivo (blockiert getestet) wird der Titel zu „CHEESEC“ abgeschnitten (`shots/cov-ohne-archivo.png`). Die Größen in `css/style.css:285–286/377/405` sind auf Archivo-Breiten gerechnet. Bei `font-display: swap` (Z. 221–224) und ohne passende Ersatz-Metrik (`size-adjust`) ist das bei langsamem Netz kurz sichtbar.
2. Konzept/Bestellweg: `img/cover-espresso-*.webp` zeigt den Kuchen als blau-messingfarbenes Duoton, und das Produkt ist nur über eine kleine Beschriftung erreichbar.
3. Handwerk: Die Parallaxe in `js/main.js:85–91` liest pro Bild `offsetHeight` (Z. 87, 91) nach den Schreibzugriffen und dreht das „&“ beim Scrollen. Das ist ohne Zweck und fällt beim Löschen nicht auf.
   Gestaltung: Die Basis-Navigation `rgba(21,16,12,.72)` mit `saturate(160%)` wird über Messing schlammbraun; Abschnitt 5 passt sie nicht an.

**Empfehlung:** Verwerfen als Haupt-Hero. Als Gestaltungsidee für eine Aktion oder Saisonseite taugt es, mit einem Foto in Originalfarben und Ersatz-Metrik für die Schrift.

---

## 6. `arena/hero-plattenkiste` – Plattenkiste

**Eindruck.** Die klügste Verbindung von Konzept und Zweck. „Crate digging“ passt zu den Musiknamen, und der Hero wird zum Produktfinder für alle 18 Kuchen mit Track, Genre, Preis und direktem „Bestellen“. Die 3D-Kiste ist hochwertig gezeichnet. Die linke Hälfte ist allerdings 1:1 die Basis, und die Kiste ist eher ein Bedienelement als ein Bild mit Stimmung. Die Typo-Hüllen (helle Produktfotos auf Pappe) brechen den Stil.

**Interaktion ausprobiert**
- Maus 1440: Der Zug folgt 1:1 (−88 px Maus → −89 px Hülle). Bei 0,3 Hülle Loslassen geht sie zurück, bei 0,6 geht es weiter. Ein schneller Wisch (200 px/60 ms) springt 4 Hüllen. Gummiband am Anfang und Ende funktioniert, ebenso der Stups am Ende. Fünf schnelle Klicks auf „weiter“ zielen sauber 5 weiter. Anfassen mitten in der Feder hält bei p = 4,809 an, Loslassen rastet ein. Richtungsumkehr per Knöpfen läuft ohne Sprung. Hover hebt die hintere Kante (nur Maus), ein Klick holt sie nach vorn. Klick auf die vordere Hülle oder „Bestellen“ öffnet den richtigen Dialog.
- Touch 390/320: Der Zug folgt 1:1. Ein senkrechter Wisch auf der Kiste scrollt die Seite (251 px), ohne dass die Kiste sich bewegt. Diagonal (überwiegend waagerecht) wird geblättert. Ein zweiter Finger wird ignoriert. Antippen der hinteren Kante holt sie nach vorn, Antippen vorn öffnet den Dialog. Die Pfeile sind 44 × 44 px.
- Tastatur: Kiste fokussierbar (sichtbarer Rahmen), Pfeile, Pos1 und Ende springen ohne Animation, die Live-Region sagt „Track C3, Peanut Butter Punk, ab 30 € · ø 26 cm 52 €. Hülle 6 von 18.“ Esc gibt den Fokus an „Bestellen“ zurück.
- Reduziert: Ziehen folgt weiter, Loslassen und Knöpfe springen.

| Kriterium | Punkte | Begründung |
|---|---|---|
| Wirkung & Konzept | 24/30 | Originelle, zur Marke passende Idee mit echtem Nutzen; weniger Stimmung als die Bühne, Text-Hälfte unverändert. |
| Handwerk Bewegung | 18/20 | Lehrbuchreif nach Apple/Emil (Projektion, Geschwindigkeitsübergabe, Gummiband, Anfassen mitten im Flug, Tastatur ohne Animation); Projektion 0,998 etwas zu lebhaft, 22 Ebenen mit 3D. |
| Mobil | 15/20 | Touch-Handhabung vorbildlich; die Kiste ist aber zu groß: 320 „Bestellen“ unter dem ersten Bildschirm, quer passt die Kiste (579 px) nicht in 390 px Höhe. |
| Inhalt & Bestellweg | 15/15 | Alle 18 Kuchen mit richtigen Nummern und Preisen (geprüft gegen die Setlist), „Bestellen“ führt direkt in den Dialog; kürzester Weg aller Seiten. |
| Technik & A11y | 14/15 | Fehlerfrei, Rolle und Live-Region durchdacht, ohne JS statisch lesbar; höchstes Bildgewicht (349/516 KB) und viele `will-change`-Ebenen. |

**Fehler**
1. Mobil: `css/style.css:443` (`--hw: min(64vw, 18rem, …)`) und `:449` (`max-height: 600px` → `min(66vw, 18rem)`). Auf 320×568 liegt „Bestellen“ bei y = 711, auf 390 „Kuchen aussuchen“ bei y = 994. Quer (844×390) ist die Kiste 579 px hoch, Hülle und Etikett passen nie gleichzeitig in den Bildschirm (`shots/quer2-kiste.png`).
2. Handwerk: `js/main.js:98` Projektion `0.998`: Ein normaler Wisch fliegt 4–5 Hüllen weit (390: 1 → 5, 320: 1 → 6). Mit `0.995` bliebe der Name der Zielhülle eher lesbar.
3. Leistung: `css/style.css:277` und `:295`: `will-change` auf allen 18 Hüllen und 18 Schatten, obwohl nur 6 sichtbar sind; zusammen mit `preserve-3d` gibt es 22 Ebenen. In Safari ist das ungeprüft.

**Empfehlung:** Mit Änderungen übernehmen: Kiste auf dem Handy kleiner bzw. quer nebeneinander, Projektion etwas ruhiger. Bestes Verhältnis aus Idee, Handwerk und Bestellweg.

---

## 7. Nicht durchgeführt bzw. eingeschränkt

- Keine echte Hardware: kein iOS Safari, kein Android Chrome, kein Firefox. Sticky Hover, Safe Areas mit Notch, Rubber-Banding, Tastatur-Overlay und die 3D-Sortierung in Safari (Kiste) sind ungeprüft.
- GPU-Last nur indirekt: Headless rendert per Software, deshalb gibt die Bildrate keine GPU-Engpässe wieder. Die Layer-Größen stammen aus der CDP-LayerTree, der GPU-Speicher ist geschätzt.
- Keinen Screenreader gestartet; nur ARIA-Attribute, Live-Region-Texte und Tab-Reihenfolge geprüft.
- Kein echtes langsames Netz; der Fall „Schrift fehlt“ wurde durch Blockieren simuliert (Cover), „JS verzögert“ durch 1,5 s Verzögerung (Bühne).
- `mailto:` wird im Headless-Browser abgebrochen (`ERR_ABORTED`, erwartet). Der Abschluss wurde über die „Danke“-Ansicht geprüft, nicht im Mailprogramm.
