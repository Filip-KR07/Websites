# Hero-Variante „Plattenkiste“

Achse: Interaktion / Taktil. Alles unterhalb des Heros ist identisch mit der Basis (nur Pfade angepasst).

## Idee

Crate digging: Im Hero steht eine Holzkiste mit 18 Plattenhüllen, jede Hülle ist ein Kuchen der Setlist.
Die vordere Hülle ist angehoben und ganz zu sehen (Name und Track in der Kopfleiste, Preisaufkleber wie im
Plattenladen), von den Hüllen dahinter schauen die oberen Kanten mit Namen heraus. Man blättert wie im
Plattenladen: ziehen oder wischen, Pfeiltasten, Vor/Zurück-Knöpfe, oder eine hintere Kante antippen.
„Bestellen“ (oder Tipp auf die vordere Hülle) öffnet den Kuchen-Dialog der Basis.

Reihenfolge in der Kiste: erst die neun dunklen Jazz-Fotos (Blues-berry vorn), dann die zwei Handyfotos
(Pumpkin Polka, Crumble Rumble; warm getönt mit Vignette), dann die sieben hellen Produktfotos als
„Typo-Hüllen“: farbige Pappe, Foto eingeklebt (die 480-px-Fotos wären vollflächig zu unscharf).

## Was sich gegenüber der Basis ändert

- `index.html`: nur `section.hero` (Platte und Hülle raus, Kiste rein) und der Bild-Preload im `<head>`.
  Titel „Cheesecake & Jazz“, ein Satz, „Kuchen aussuchen“/„Ins Café“ und die Fakten bleiben.
  Auf dem Handy steht die Kiste zwischen Titel und Satz (per `display: contents` + `order`).
- `css/style.css`: nur Abschnitt 5 (und die Zeile im Inhaltsverzeichnis).
- `js/main.js`: nur Abschnitt 1 (und die Zeile im Inhaltsverzeichnis). Name, Nummer, Genre und Preis der
  Hüllen kommen aus den `data-`Attributen der Setlist (eine Quelle), die Werte im HTML gelten nur ohne JS.
- `img/`: 11 quadratische Hüllen-Zuschnitte in 360 und 720 px (zusammen ca. 590 KB). Die Typo-Hüllen
  nutzen die vorhandenen `../../img/kuchen/*-480.webp`.

## Bewegung (Werte)

Position `p` in der Kiste ist eine Kommazahl, Hülle *i* liegt bei *d = i − p*.

| Was | Wert |
| --- | --- |
| Stapel nach hinten | je Hülle 10 % höher, 0,09 × Hüllenbreite tiefer, Schatten +0,13 (max. 0,62), 6 sichtbar |
| Fingerweg pro Hülle | 0,8 × Hüllenbreite; die herausgezogene Hülle bewegt sich exakt mit dem Finger (gemessen: −120 px Finger → −121 px Hülle) |
| Herausziehen | bis 40 % des Wegs nur waagerecht (Griffpunkt bleibt unterm Finger), danach bis 10 % hoch und −6° gekippt, ab 75 % ausblenden |
| Richtungsschwelle | 8 px und eindeutig waagerecht, sonst gehört die Geste der Seite (senkrecht scrollen) |
| Geschwindigkeit | aus den letzten 100 ms; stand der Finger > 60 ms still, ist sie 0 |
| Projektion | Apple: `v/1000 · 0,998 / (1 − 0,998)`, nächste Hülle am projizierten Endpunkt |
| Feder nach Wisch (> 300 px/s) | Antwort 0,42 s, Dämpfung 0,82, Startgeschwindigkeit = Fingergeschwindigkeit |
| Feder ruhig losgelassen / Tipp auf hintere Kante | Antwort 0,36 s, Dämpfung 1 |
| Feder Vor/Zurück-Knöpfe | Antwort 0,34 s, Dämpfung 1; mehrfach tippen zielt weiter, Geschwindigkeit bleibt erhalten |
| Feder-Rechnung | Masse 1, Steifigkeit (2π/Antwort)², Reibung 2 · Dämpfung · 2π/Antwort, 240 Teilschritte/s |
| Gummiband an den Enden | Apple: `(x · d · 0,55) / (d + 0,55 · x)`, d = Hüllenbreite; Knopf am Ende gibt einen Stups (3 Hüllen/s) |
| Anfassen während einer Bewegung | hält die Kiste dort an, wo sie gerade ist |
| Pfeiltasten, Pos1/Ende, Knöpfe per Tastatur | springen sofort, ohne Animation |
| Hinweis nach dem Intro (einmal) | vordere Hülle hebt sich auf 0,25 an und fällt mit der Wisch-Feder zurück |
| Hover (nur Maus) | hintere Kante hebt sich um 5 %, 200 ms `--ease-out` |
| Intro | Kiste 800 ms von 28 px unten, Titelzeilen wie in der Basis |

Bewegung aus (`prefers-reduced-motion` oder `?motion=off`): kein Intro, kein Hinweis, Ziehen folgt weiter
dem Finger, beim Loslassen und bei Knöpfen springt die Kiste ohne Feder auf die Hülle.

## Zugänglichkeit

Kiste = `role="group"` mit `aria-roledescription="Plattenkiste"` und Beschriftung (inkl. Hinweis auf die
Pfeiltasten), fokussierbar. Vor/Zurück sind echte Knöpfe (am Ende `aria-disabled`, Fokus bleibt).
Liegt die Kiste still, sagt eine höfliche Live-Region die vordere Hülle an („Track B1, Blues-berry,
ab 29 € · ø 26 cm 49 €. Hülle 1 von 18.“), nicht bei jedem Zwischenschritt. Die Hüllen selbst sind
`aria-hidden` (alles geht auch über Knöpfe und Tasten). `touch-action: pan-y`: senkrecht scrollt die Seite.
Ohne JS steht die Kiste still mit den vorderen sechs Hüllen, das Etikett zeigt Blues-berry, Bestellen
und Pfeile sind ausgeblendet.

## Getestet (Chromium/Playwright)

1440×900, 1280×620, 390×844 und 320×568 (Touch), Bewegung reduziert und an, `?motion=off`, ohne JS.
Keine Konsolenfehler, keine fehlgeschlagenen Requests, kein waagerechtes Scrollen. Touch per CDP:
langsamer Zug, schneller Wisch (springt 2–3 Hüllen), Wisch zurück, senkrechter Wisch auf der Kiste
scrollt die Seite, Tipp auf hintere Kante, Tipp auf vordere Hülle öffnet den Dialog. Bei 4× CPU-Drossel
während Wischen und Federn: Median 16,7 ms pro Bild, kein Bild über 34 ms.

Behoben beim Testen: Chrome sortierte die echten 3D-Seitenwände vor die Vorderwand (jetzt flache Keile
unter der 3D-Welt); Tipp auf die vordere Hülle öffnete den Dialog bei `pointerup`, der folgende `click`
landete auf dem Dialog-Hintergrund und schloss ihn (jetzt öffnet er beim `click`); die halbtransparente
herausgezogene Hülle lag geisterhaft über der nächsten (jetzt deckend bis 75 %).

## Bekannte Schwächen

- Nicht auf echter Hardware geprüft, nur Chromium-Emulation. Safari/iOS (3D-Sortierung, `backdrop-filter`
  der Pfeile) ungeprüft.
- Nach rechts ziehen holt die vorige Hülle von links zurück (1:1 mit dem Finger), die gegriffene vordere
  Hülle wandert dabei zurück in den Stapel und klebt nicht am Finger. Kartenstapel-Logik, kein Fehler,
  aber nicht ganz „Griffpunkt bleibt“.
- Ein kräftiger Wisch fliegt mit 0,998 bis zu 5–6 Hüllen weit. Gewollt (Durchblättern), kann aber zu
  lebhaft wirken; 0,995 wäre ruhiger.
- Auf dem Handy weicht die Tab-/Vorleseordnung (Text, dann Kiste) von der sichtbaren Reihenfolge ab
  (Titel, Kiste, Satz, Knöpfe). Auf dem Desktop stimmt sie.
- Bei 1280×620 ist die Hülle nur ca. 217 px groß, die Namen auf den hinteren Kanten werden klein.
- Die Seitenwände sind flach gezeichnet und passen zur Perspektive nur ungefähr.
- Die Typo-Hüllen nutzen 480-px-Fotos, auf Retina leicht weich. Besser: alle Kuchen im Jazz-Stil fotografieren.
- Hover über einer hinteren Kante hebt sie an und verdeckt dabei den Namen der Hülle dahinter.
