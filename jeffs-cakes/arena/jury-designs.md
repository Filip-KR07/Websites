# Jury-Bericht: komplette Designs (Arena Jeff's Cakes)

> Vollständiger Jury-Bericht. Die erwähnten Screenshots, Videos und Messskripte sind beim Test lokal entstanden und nicht im Repo.

Jury: komplette Designs · Port 8152 · Stand 3. Oktober 2026 (Samstag)
Geprüft wurde alles selbst im Browser (Playwright/Chromium, headless). Skripte, Screenshots und Video-Streifen liegen in
diesem Ordner (`shots/`, `tiles/`, `video/`, `*.mjs`).

## Ergebnis

| Platz | Ordner | Gesamt | Wirkung (30) | Bewegung (20) | Mobil (20) | Inhalt & Bestellweg (15) | Technik & a11y (15) | Idee in einem Satz |
|---|---|---|---|---|---|---|---|---|
| 1 | `arena/design-diner` | **86** | 25,5 | 17,5 | 16,5 | 14 | 12,5 | New Yorker Diner der 70er: Neonschild, drehbare Tortenvitrine, Steckbuchstaben-Karte, Guest Check als Warenkorb. |
| 2 | `arena/design-stadtpark` | **82,5** | 22 | 15 | 18,5 | 13,5 | 13,5 | Helles Hamburger Café-Magazin: Café, Status und Route zuerst, Saison-Aufmacher, Kuchen als ruhiges Fotoraster. |
| 3 | `arena/design-plakat` | **78,5** | 22 | 17 | 14 | 13 | 12,5 | Riso-Jazzfestival-Plakat: Kuchen als Line-up auf drei Bühnen, alle Fotos als Rasterdruck. |
| 4 | Basis `jeffs-cakes/` | **76,5** | 23 | 15 | 14 | 12,5 | 12 | „Cheesecake & Jazz“ als Plattencover, Kuchenkarte als Setlist. |

Knapp: Diner und Stadtpark liegen nah beieinander. Der Diner gewinnt über Eigenständigkeit und Handwerk, der Stadtpark
ist für den Gast auf dem Handy die beste Seite. Die stärkste Lösung wäre der Diner mit der Service-Idee des Stadtparks.

## Was für alle gleich ist (wichtig für die Einordnung)

- **Bestellweg:** Alle drei Varianten nutzen die Bestell-Logik der Basis (gleiche Feldnamen, gleiche Prüfungen, gleicher
  `mailto:`-Text). Durchgespielt auf allen vier Seiten, Desktop 1440×900 und Handy 390×844: Blues-berry → ø 26 cm (49 €)
  → in die Bestellung → Bestellung öffnen → Liefern, PLZ 10115 + Datum 5.10. → Fehler „Wir brauchen mindestens drei
  Werktage. Frühester Termin: 7.10.2026.“ und PLZ markiert → Datum 29.12. → „Winterpause …“ → gültig (7.10., 11:00,
  PLZ 22299) → Danke-Zustand, `mailto:info@jeffscakes.com` mit korrektem Text („1 × Blues-berry, ø 26 cm: 49 € … zzgl.
  Lieferkosten … Lieferung am Mittwoch, 07.10.2026, 11:00 Uhr“). Funktioniert überall fehlerfrei.
- **Uhrzeiten:** Abholen Sa/So 11:00–18:30, Mo–Fr 12:00–18:30, Liefern 11:00–19:00, Überweisungs-Hinweis erscheint. Mit
  gefälschter Uhr (Mo 10:00, So 20:00, 24.12.) stimmen Live-Status und frühestes Datum (Mo → Do, So abends → Mi,
  24.12. → 12.1.2027) auf allen Seiten.
- **Fakten:** Alle 18 Kuchen vorhanden; `data-groessen`, `data-optionen`, `data-diaet` aller 18 Kuchen sind in allen
  Varianten identisch mit der Basis (Skript `facts.mjs`). Preise 18/26 cm, Pecan nur 26 cm (47 €), Brownies 60 € /
  35 Stück / vegan / Walnüsse, Cupcakes 6 Sorten (30/34/34/34/35/34 €, inkl. Raspberry Rumba), Linnering 5, 22299,
  040 355 83 203, Mo–Fr 12–19, Sa/So 11–19, 3 Werktage, Winterpause 23.12.–11.1., Lieferung Hamburger Raum 11–19 Uhr,
  PayPal/Überweisung, Black Delight, seit Juli 2023: überall korrekt, auch im JSON-LD. Zeilenweiser Textvergleich gegen
  die Basis: **keine erfundenen Fakten** gefunden (Stadtpark-Koordinaten 53° 35′ 49″ N · 10° 0′ 17″ O stimmen mit dem
  Google-Maps-Link der Basis überein).
- **Technik:** 0 Konsolenfehler, 0 fehlgeschlagene Requests, kein horizontales Scrollen (scrollWidth = clientWidth in
  allen 5 Viewports), alle Anker und internen Links (Impressum/Datenschutz) erreichbar, Eingabefelder 16 px,
  `viewport-fit=cover` + Safe Areas, Tap-Highlight aus, Esc schließt Dialoge, Fokus springt auf den Kuchen zurück,
  Wisch am Griff schließt die Blätter (per CDP-Touch geprüft), Fokusring überall sichtbar.
- **Leistung (headless, Software-Raster):** Hero 3 s rAF bei 1440×900 mit Mausbewegung: 181–182 Frames, max. 17 ms,
  keine Long Tasks; Scrollen mit 4× CPU-Drosselung 60 fps auf allen. Unterschiede liegen hier nicht.

| Gewicht | Basis | Diner | Stadtpark | Plakat |
|---|---|---|---|---|
| Bilder Desktop / Handy | 215 / 413 KB | 402 / 359 KB | 407 / 428 KB | 340 / 340 KB |
| Schriften | 84 KB | 322 KB | 318 KB | 118 KB |
| JS + CSS | 26 + 46 KB | 32 + 63 KB | 28 + 50 KB | 26 + 53 KB |

| Gast auf dem Handy (390×844) | Basis | Diner | Stadtpark | Plakat |
|---|---|---|---|---|
| Live-Status | y ≈ 7760 | y ≈ 557 (im ersten Bild) | Kopf-Chip y ≈ 20 + y ≈ 318 | y ≈ 6530 |
| „Route planen“ | y ≈ 8070 | y ≈ 8180 | **y ≈ 387** (auch im Menü) | y ≈ 6720 |
| Kuchen-CTA im ersten Bild | ja (390), nein (320) | ja | Link „Kuchen aussuchen“ | ja (390), nein (320) |

---

## 1. Diner (`arena/design-diner`) – 86 Punkte

**Eindruck:** Die eigenständigste Seite. Neon „Jeff's / CHEESECAKE“ auf Nachtgrün, daneben eine verchromte
Tortenvitrine mit zwei Etagen, darunter mintgrüne Fliesen mit einer echten Steckbuchstaben-Tafel (alle 18 Kuchen mit
beiden Preisen in Spalten, sehr gut zum Vergleichen), roter Geschichtsblock mit dem Guest Check „1 Cheesecake, 1 Glas
Milch“, Bonschiene für „So bestellst du“, Schachbrett-Kanten. Jedes Motiv hat eine Aufgabe (OPEN-Schild = Live-Status,
Tafel = Preise, Guest Check = Warenkorb mit Tagesdatum und Kuli-Schrift, Größen als Tortenplatten im Maßstab). Passt
zu Jeffs Geschichte (New York, 70er) ohne Kostüm zu werden. Das würde man Jeff verkaufen.

**Wirkung & Konzept 25,5/30:** Klarste Idee mit Funktion hinter jedem Motiv und durchgehaltenem Stil über die ganze
Seite; Abzug, weil die untere Vitrinen-Etage die dunklen Jazz-Fotos samt Gitarre/Klavier im Bogenausschnitt zeigt
(wirkt wie Fotokärtchen statt Kuchen unter Glas) und das Neon-„ff“ auf dem Handy in „CHEESECAKE“ hineinläuft.

**Bewegung 17,5/20:** Vitrine vorbildlich nach Apple-Raster (Feder mit Startwert aus der aktuellen Lage, 1:1-Ziehen
mit Pointer-Capture, Schwung-Projektion, Einrasten, `touch-action: pan-y`, nur `transform`, läuft nur während des
Drehens, Pfeiltasten, reduzierte Bewegung springt ohne Weg); Neon einmalig 900 ms ohne Flackern; Abzug für Reveal
650 ms / 18 px (`css/style.css:832`) und Schublade 400 ms (`css/style.css:641`), beides über dem UI-Budget.

**Mobil 20 → 16,5:** OPEN-Status im ersten Bild, rote „Bestellzettel“-Leiste in Daumennähe sobald etwas notiert ist,
Blätter wischbar, Menü klar; Abzug für Route/Telefon erst bei y ≈ 8180, bei 320 px sind die Glocken nur 38–41 px groß,
im Querformat wirkt der Hero gut.

**Inhalt & Bestellweg 14/15:** Fakten vollständig, Bestellweg fehlerfrei, schönste Größenwahl (Tortenplatten ø 18/26
im Maßstab) und charmanter Danke-Stempel; Brownies/Cupcakes unter „Für Feiern“ statt „Classics“ (bewusst, okay).

**Technik 12,5/15:** Fehlerfrei, reduzierte Bewegung und `?motion=off` sauber, Kontraste gut; ohne JS sind die vier
Filter-Knöpfe sichtbar, aber tot (README behauptet das Gegenteil), 322 KB Schriften, Bilder und Rechtsseiten kommen aus
`../../` (nicht eigenständig).

**Fehler (Bugs zuerst):**
1. Ohne JS sichtbare, funktionslose Filter-Knöpfe: `index.html:193-197`; `css/style.css:106` blendet andere
   JS-Knöpfe aus, `.chip`/`[data-filter]` fehlt dort.
2. Untere Vitrinen-Etage: Glocken zeigen ganze dunkle Jazz-Fotos (Hintergründe mit Gitarre, Klavier, Holztisch) statt
   freigestellter Kuchen; auf 320 px Glocken unter 44 px (`css/style.css:322-323`, Bilder `img/glocke/`).
3. Route/Telefon nur im Café-Abschnitt (y ≈ 8180 auf 390 px); Reveal 650 ms (`css/style.css:832`), Blatt 400 ms
   (`css/style.css:641`).

**Empfehlung:** Mit Änderungen übernehmen (Favorit): Glocken der unteren Etage freistellen, „Route planen / Anrufen“
in Hero oder Menü wie beim Stadtpark, Filter ohne JS ausblenden.

---

## 2. Stadtpark (`arena/design-stadtpark`) – 82,5 Punkte

**Eindruck:** Ruhig, hell, glaubwürdig: Folio „Herbst 2026 · Hamburg-Winterhude · Café seit Juli 2023“, große
Newsreader-Serif, Jeff hinter der Theke als Foto, direkt darunter ein Service-Kasten mit Live-Status, Adresse,
„Route planen“ und Telefon. Café-Abschnitt mit Zeiten-Kasten („heute“ markiert), Saison-Aufmacher (Pumpkin Polka),
18 Kuchen als einheitliches Fotoraster mit Passepartout (die dunklen und hellen Fotos wirken hier am ruhigsten),
Porträt als Magazin-Feature, „Wenn mehr Leute mitessen“, drei Schritte, grüner Fuß. Saisons per `?saison=` geprüft:
Winter Zimt-Tönung mit Cinnamon Crossover, Frühling/Sommer Zitrone mit Latin Lemon, Raster-Reihenfolge und Nav-Punkt
wechseln mit, ohne Fehler.

**Wirkung & Konzept 22/30:** Für den echten Gast die vernünftigste Seite und sehr sauber gesetzt, aber die am
wenigsten eigene Idee (könnte jedes gute Café sein); Jeffs Musik-Geschichte tritt stark zurück.

**Bewegung 15/20:** Zurückhaltend, eigene Kurven, Hover gegated, Dialoge 240–280 ms rein / 180–200 ms raus,
Druck-Feedback; Abzug für Reveals mit 800/900 ms und Bild-`clip-path` 1100 ms (`css/style.css:724-737`, Hero-Bild mit
`--ease-in-out` statt ease-out) und weil der Hero-Auftritt auf Foto-Decode + Schriften wartet: lokal läuft er nie
(`is-ready` vor dem ersten Paint, toter Code), bei Fast-3G bleiben Titel und Service-Kasten rund 2 s unsichtbar.

**Mobil 18,5/20:** Bestes Ergebnis: Status-Chip im Kopf auf jeder Scrollhöhe, Route und Telefon bei y ≈ 387
(320 px: 422/479), Menü mit Status, „Route planen“ und „Anrufen“ unten in Daumennähe, Liste mit Bild links statt
langer Kartenstapel, keine zu kleinen Ziele, Bestellung in nummerierten Schritten mit Schnellwahl der nächsten sechs
möglichen Tage; Abzug für den verzögerten Service-Kasten bei langsamem Netz.

**Inhalt & Bestellweg 13,5/15:** Fakten vollständig, bester Bestell-Dialog (Schritte 1–5, Tages-Chips, Adresse direkt
nach „Liefern“); Abzug für die Saison-Texte: Winter (Dez–Feb) zeigt auch im Januar/Februar „Genau richtig zur
Adventszeit.“, Frühling „Schön sommerlich.“, und Cinnamon Crossover/Latin Lemon werden als „Saison“ geführt, obwohl
sie ganzjährig auf der Karte stehen.

**Technik 13,5/15:** Fehlerfrei, ohne JS am saubersten (Bestellknöpfe ausgeblendet, nur 3 tote „ansehen“-Knöpfe in
der Bildstrecke), reduzierte Bewegung sauber, Kontraste gut; 318 KB Schriften, Hero-Gating hinter Bild-Decode.

**Fehler (Bugs zuerst):**
1. Hero-Auftritt hängt am Foto: `js/main.js:474-479` (`Promise.all([decode, fonts.ready]).then(bereit)`),
   Sicherheitsnetz `index.html:30` (1,2 s), Startzustand `css/style.css:724-733`. Auf schnellem Netz läuft die
   Animation nie, auf Fast-3G sieht der Gast ~2 s lang keinen Status und keine Route. Service-Kasten (`.dienst`)
   sofort zeigen, Auftritt nur für Titel/Bild.
2. Saison-Texte: `index.html:232` („Genau richtig zur Adventszeit.“) wird laut `js/main.js:37-50` Dez–Feb gezeigt;
   `index.html:249` „Schön sommerlich.“ auch im Frühling. Mit Jeff klären, ob Zimt/Zitrone als Saison gelten.
3. Reveals zu lang: 800/900 ms + 1100 ms `clip-path` (`css/style.css:735-737`), Hero-Bild mit `--ease-in-out`
   (`css/style.css:730`). Kleinkram: Menüpunkt „Saison:  Herbst“ mit doppeltem Abstand (`index.html:96`).

**Empfehlung:** Mit Änderungen übernehmen, als sichere Alternative und als Vorlage für die Gast-Informationen
(Status-Chip, Service-Kasten, Tages-Schnellwahl), die in den Diner gehören.

---

## 3. Plakat (`arena/design-plakat`) – 78,5 Punkte

**Eindruck:** Mutigster Auftritt: „Jeff's Cheesecake präsentiert – Headliner: JEFF'S CLASSIC“ in riesiger Archivo
mit verrutschter pinker Platte, daneben ein gerasterter Kuchen von oben mit herausgezogenem pinken Stück. Line-up auf
drei Bühnen mit Plakat-Hierarchie, „Programm markieren“ als Textmarker statt Filter (schöne Idee), Act-Blatt als
eigenes Mini-Plakat mit Blättern zum nächsten Act, pinke Special-Guest-Fläche, gelbe Bestellfläche mit
Winterpause-Stempel, „Linnering 5“ als Spielort mit Live-Stempel. Grafisch konsequent und gut gebaut.

**Wirkung & Konzept 22/30:** Starke, eigenständige Idee mit Bezug zu Jeffs Musik-Namen; aber für eine Konditorei
verliert sie den Appetit: alle Kuchen nur als blau-pinker Rasterdruck, der Hero-Cheesecake ist als Kuchen kaum
erkennbar (liest sich wie eine Landschaft), Pumpkin Polka auf Pink wirkt matschig, Jeff selbst ist nur ein Raster.

**Bewegung 17/20:** Gelungener einmaliger Auftritt (Zeilen aus der Maske, Platte rastet ein, Stück rutscht heraus,
nur `transform`), Probedruck am Mauszeiger mit rAF-Nachziehen nur bei feiner Maus ab 900 px, Hover gegated,
Dialoge 300/180 ms, reduzierte Bewegung sauber; Intro mit 760–900 ms plus Verzögerung knapp an der Grenze.

**Mobil 14/20:** Blätter mit stehendem Bestellknopf gut; Abzug für zu kleine Ziele im Line-up (kleine Acts 27–33 px
hoch, dicht übereinander), Status/Route erst bei y ≈ 6500/6700, Beschreibungen und Fotos im Line-up nur per Tipp,
Querformat 844×390 zeigt fast nur leere Fläche, die Headline beginnt unter dem Rand.

**Inhalt & Bestellweg 13/15:** Fakten vollständig (auch die Cupcake-Sorten), Bestellweg fehlerfrei, Act-Blatt mit
Blättern praktisch; Abzug für den verdeckten „Preise“-Eintrag im Hero bei 1440×900 und die Kuchen, die man vor dem
Bestellen nicht in echt sieht.

**Technik 12,5/15:** Fehlerfrei, leichteste Schriften (118 KB), Kontraste bewusst gewählt; ohne JS sind der Hero-CTA
„Jeff's Classic bestellen“, der Warenkorb- und die Markier-Knöpfe sichtbar, aber tot; das Raster
(`filter: contrast(22)` + `mix-blend-mode` auf vielen Flächen) ist headless flüssig, auf echten Handys ungeprüft.

**Fehler (Bugs zuerst):**
1. 1440×900: Gelbe Scheibe ragt in die Faktenleiste und verdeckt „PREISE“ (`css/style.css:272`
   `.torte__scheibe { transform: translate(-6%, 5%) }` bei Grafikhöhe aus `css/style.css:296-303`).
2. Tippziele im Line-up auf dem Handy 27–33 px hoch (`css/style.css:353-356`, `.acts--m`/`.acts--s .act__knopf`);
   Querformat-Hero: `.plakat__vorspann` reserviert `min-height` für die Grafik (`css/style.css:236`), dadurch steht
   die Headline unter dem Rand.
3. Ohne JS tote Knöpfe: Hero-CTA `index.html:135`, Markieren-Chips, Warenkorb `index.html:72`.

**Empfehlung:** Als Ganzes verwerfen (der Rasterdruck nimmt den Kuchen den Appetit); Ideen übernehmen: Line-up-Typo
als Karte, „Programm markieren“, Blättern im Kuchen-Dialog.

---

## 4. Basis (`jeffs-cakes/`) – 76,5 Punkte

**Eindruck:** Edles dunkles Plattencover, Platte gleitet aus der Hülle und dreht, Setlist mit „Jetzt läuft“-Vorschau,
Liner Notes mit Wort-für-Wort-Zitat, Café-Kasten mit Live-Status. Eine stimmige Idee aus Jeffs Geschichte, gut gemacht,
aber auf dem Handy wenig Gast-Service.

**Wirkung & Konzept 23/30:** Klare, zu Jeff passende Idee und hochwertige Typografie; dunkel-edel wirkt austauschbarer
als der Diner, im Querformat steht nur die Hülle im Bild.

**Bewegung 15/20:** Eigene Kurven, nur GPU-Eigenschaften, Pause-Knopf; Abzug für Dauerbewegung: Platte 1,8 s linear
unendlich (`css/style.css:307-308`, stoppt immerhin außerhalb) und die „Pegel“-Balken unendlich (`css/style.css:402-405`),
die schon laufen, während die Setlist noch nicht im Bild ist.

**Mobil 14/20:** Blätter, Safe Areas, 16-px-Felder gut; kein Status und keine Route im ersten Bild (Route y ≈ 8070),
bei 320 px kein CTA im ersten Bild, Querformat H1 unter dem Rand (y = 458 bei 390 px Höhe).

**Inhalt & Bestellweg 12,5/15:** Referenz-Fakten, Bestellweg fehlerfrei; im Danke-Zustand ist „Schließen“ praktisch
unsichtbar (Creme auf Creme).

**Technik 12/15:** Fehlerfrei, reduzierte Bewegung sauber; ohne JS Warenkorb- und Filter-Knöpfe sichtbar, aber tot.

**Fehler (Bugs zuerst):**
1. Danke-Zustand: „Schließen“ nutzt `.knopf--rand` (für dunklen Grund, `css/style.css:122`) auf dem hellen Blatt,
   Kontrast ≈ 1,1:1 (`index.html:601`).
2. Handy: Status und Route erst bei y ≈ 7760/8070; Querformat zeigt nur die Hülle.
3. Endlose Dauerbewegung (Platte, Pegel) `css/style.css:307-308`, `402-405`.

**Empfehlung:** Durch den Diner ersetzen; falls behalten, Danke-Knopf reparieren und Status/Route in den Hero.

---

## Prüfmatrix (je Seite durchgeführt)

| Test | Ergebnis |
|---|---|
| 1440×900, 1280×620: Erster Eindruck nach Intro, ganze Seite (Full-Page-Kacheln) | alle angesehen, Befunde oben |
| 390×844, 320×568 (isMobile, hasTouch), 844×390 quer: Hero, Menü, Dialoge | alle angesehen |
| Konsole / Requests / horizontales Scrollen | 0 / 0 / keins (überall) |
| `reducedMotion: 'reduce'` und `?motion=off` | nichts bleibt unsichtbar (Sichtbarkeits-Sonde 0 Treffer bei Diner, Stadtpark, Plakat; Basis nur das leere Vorschau-Bild) |
| JS aus | alle Inhalte lesbar; tote Knöpfe: Basis 26, Diner 22, Plakat 26, Stadtpark 3 |
| Tastatur | Skip-Link, Nav, CTAs, Fokusring überall sichtbar; Enter öffnet Kuchen-Dialog, Esc schließt, Fokus zurück |
| Bestellweg 26 cm + Lieferung 22299 + Fehlerfälle (Datum zu früh, PLZ 10115, 29.12.) | alle vier fehlerfrei, `mailto:` korrekt |
| Filter „Vegan“ | Basis/Diner/Stadtpark filtern auf Brownies + Vegan, Plakat markiert beide |
| Live-Status mit gefälschter Uhr | korrekt auf allen |
| Touch: Vitrine wischen (Diner), Blatt am Griff wegwischen (alle) | funktioniert |
| Leistung: rAF 3 s im Hero, Scrollen bei 4× CPU | 60 fps, keine Long Tasks |
| Langsames Netz (Fast 3G, Video) | Basis Titel nach ~1 s, Diner sofort (Neon später), Plakat Titel ~1,5 s, Stadtpark Titel + Status erst ~2 s |
| Stadtpark `?saison=winter|sommer|fruehling|herbst` | Tönung, Text, Raster-Reihenfolge wechseln, keine Fehler |

## Nicht prüfbar

- Echte Geräte (iOS Safari, Android Chrome): Safe Areas (Emulation hat Insets 0), Software-Tastatur, Tap-Verzögerung,
  Gummiband, echtes Touch-Gefühl der Vitrine und der Blätter.
- Safari und Firefox; nur Chromium geprüft (Plakat-Raster braucht `plus-lighter`).
- GPU-Last auf echter Hardware (headless rastert in Software): besonders Plakat (`contrast(22)` + Blend-Modes),
  Diner-Neon-Schatten und `backdrop-filter`.
- Screenreader-Ausgabe (nur Rollen, Labels, `aria-live` im Code und Fokus geprüft).
- Tatsächlicher Versand der Bestellung (Mailprogramm), Bestell-Server/PayPal.
