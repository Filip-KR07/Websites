# Arena: Varianten zu Jeff's Cakes

Sechs Agenten haben unabhängig voneinander Varianten zum Entwurf in `../` (Basis „Cheesecake & Jazz“) gebaut.
Danach hat je Gruppe eine Jury alle Seiten selbst im Browser geöffnet, getestet und bewertet, die Basis mit demselben
Raster. **Nichts davon ist in die Basis übernommen.** Das hier ist die Auswahl zum Anschauen und Entscheiden.

Übersicht mit allen Seiten: `arena/index.html`.

```bash
python3 -m http.server 8080 --directory jeffs-cakes
# → http://127.0.0.1:8080/arena/
```

Die Varianten nutzen Bilder, Schriften und Rechtsseiten der Basis mit (`../../img/`, `../../fonts/`).
Alle stehen auf `noindex`. Bestellungen öffnen wie in der Basis nur eine fertige E-Mail.

Wertung (100 Punkte): Wirkung & Konzept 30 · Handwerk Bewegung 20 · Mobil 20 · Inhalt & Bestellweg 15 ·
Technik & Barrierefreiheit 15. Maßstab für Bewegung: die Skills `review-animations`, `emil-design-eng`, `mobile-native`,
`apple-design`. Die vollständigen Berichte stehen in `jury-heros.md` und `jury-designs.md`.

## Hero-Varianten (Kopie der Basis, nur der Hero ist anders)

Per `diff` geprüft: Außerhalb des Heros sind die Dateien byte-gleich mit der Basis.

| Platz | Ordner | Idee | Jury |
|---|---|---|---|
| 1 | `hero-plattenkiste/` | Holzkiste mit 18 Plattenhüllen, eine pro Kuchen. Durchblättern per Ziehen (1:1, Schwung, Feder, Gummiband), Pfeiltasten oder Knöpfe, „Bestellen“ öffnet den Kuchen | 86 |
| 2 | `hero-buehne/` | Die Kuchen stehen als Band im dunklen Jazzclub, ein Scheinwerfer folgt der Maus und holt einen ins Licht, darüber „Cheesecake & Jazz“ als ruhige Leuchtreklame | 84 |
| 3 | `hero-cover/` | Typografisches Blue-Note-Cover: Messing und Kobalt, Archivo füllt jede Zeile, Duoton-Foto | 79 |
| 4 | Basis (`../`) | Platte gleitet aus der Hülle und dreht sich | 75 |

Bekannt (Jury):
- **Plattenkiste:** auf dem Handy zu groß (320×568: „Bestellen“ unter der Falz; quer passt die Kiste nie ganz ins Bild),
  ein normaler Wisch fliegt 4–5 Hüllen weit (Projektion 0,998), 22 Ebenen mit `will-change` und 3D, Safari ungeprüft.
- **Bühne:** Im Intro blitzt rechts kurz ein heller Streifen mit harter Kante auf, vor dem Laden von JS sieht man einen
  dunklen Kasten. Die Lichtebene ist doppelt so breit wie der Hero (viel GPU-Speicher auf Retina).
- **Cover:** Ohne die Schrift Archivo wird der Titel zu „CHEESEC“ abgeschnitten. Das Duoton macht den Kuchen blaugrau,
  die Kobalt-Farbwelt passt nicht zu Jeffs Marke. Die Parallaxe ist reine Deko im Hauptthread.

Empfehlung der Jury: Plattenkiste mit Änderungen übernehmen (beste Verbindung aus Idee, Handwerk und Weg zur Bestellung),
Bühne für den stärksten ersten Eindruck, Cover verwerfen.

## Komplette Designs (eigene Seiten, eigenes Konzept)

| Platz | Ordner | Konzept | Jury |
|---|---|---|---|
| 1 | `design-diner/` | New Yorker Diner der 70er: Neonschild, drehbare Tortenvitrine mit allen 18 Kuchen unter Glasglocken, Steckbuchstaben-Tafel als Karte, Guest Check als Warenkorb | 86 |
| 2 | `design-stadtpark/` | Helles Hamburger Café-Magazin: Status, Route und Telefon ganz oben, Saison-Aufmacher (`?saison=winter` usw.), ruhiges Fotoraster | 82,5 |
| 3 | `design-plakat/` | Riso-Jazzfestival-Plakat: Jeff's Classic als Headliner, die anderen Kuchen auf drei Bühnen, alle Fotos als Rasterdruck | 78,5 |
| 4 | Basis (`../`) | „Cheesecake & Jazz“ als Plattencover, Kuchenkarte als Setlist | 76,5 |

Bei allen vier läuft die Bestellung fehlerfrei (Datumsregeln, Winterpause, PLZ-Prüfung, `mailto:`). Alle 18 Kuchen,
Preise, Zeiten und Adresse stimmen mit der Basis überein, erfundene Fakten hat die Jury nicht gefunden.

Bekannt (Jury):
- **Diner:** Ohne JS sind die Filter-Knöpfe sichtbar, tun aber nichts. Die untere Vitrinen-Etage zeigt die ganzen
  Jazz-Fotos samt Instrumenten statt freigestellter Kuchen, bei 320 px sind die Glocken nur ca. 40 px groß.
  Route und Telefon kommen auf dem Handy erst ganz unten.
- **Stadtpark:** Der Hero-Auftritt wartet auf Foto und Schriften, bei langsamem Netz sieht man ca. 2 s weder Status noch
  Route. Saisontexte passen nicht zu jedem Monat („Adventszeit“ auch im Februar), Cinnamon Crossover und Latin Lemon als
  „Saison“ sollte Jeff bestätigen. Einblendungen mit 800–1100 ms zu lang.
- **Plakat:** Bei 1440×900 verdeckt die gelbe Scheibe „Preise“ in der Faktenleiste. Der Rasterdruck nimmt den Kuchen den
  Appetit, Line-up-Ziele auf dem Handy nur 27–33 px hoch, im Querformat steht die Headline unter dem Rand. Ohne JS
  sichtbare, aber funktionslose Knöpfe.

Empfehlung der Jury: Diner mit Änderungen übernehmen, dazu die Service-Idee des Stadtparks (Status, Route, Telefon ganz
oben bzw. im Menü). Vom Plakat lohnen die Line-up-Typografie, „Programm markieren“ und das Blättern im Kuchen-Dialog.

## Von den Jurys gefundene Punkte in der Basis

1. Im Intro ist die Platte schon sichtbar, bevor die Hülle eingeblendet ist, und scheint durch sie hindurch.
2. Die Platte schaut nur 35 % heraus, die Drehung nimmt man kaum wahr. Der Kuchen im Hero ist nicht anklickbar.
3. Im Danke-Zustand der Bestellung ist „Schließen“ kaum sichtbar (heller Rand-Knopf auf hellem Blatt, ca. 1,1:1).
4. Auf dem Handy kommen Öffnungsstatus und Route erst ganz unten, im Querformat zeigt der Hero nur die Plattenhülle.
5. Die Pegel-Balken in der Setlist laufen endlos, auch bevor die Setlist im Bild ist.

## Nicht getestet

Echte iPhones/Android-Geräte, Safari und Firefox (wichtig für die 3D-Kiste, `mix-blend-mode`/`plus-lighter` beim Plakat,
`backdrop-filter` und Neon-Schatten beim Diner), Screenreader-Ausgabe, echter Mailversand. Alle Tests liefen in
Chromium (Playwright, headless).
