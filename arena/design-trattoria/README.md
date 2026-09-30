# Design „Trattoria“ – Trattoria da Rosella

Demo-Vorlage für eine warme italienische Familien-Trattoria. Das Restaurant, die Familie Ferraro, Adresse,
Telefonnummer und Preise sind erfunden. Statische Seite ohne Build: `index.html` + `css/style.css` + `js/main.js`,
Schriften in `fonts/`, eigene Fotos in `img/`. GSAP/ScrollTrigger kommen aus `../../restaurant/assets/vendor/`.

## Konzept

**Die Fassade mit dem Torbogen.** Beim Laden steht erst das Foto des Gastraums groß und scharf auf dem ganzen
Bildschirm. Dann zieht es sich in einen Torbogen zurück (wird kleiner, liegt „hinter“ einer cremefarbenen Wand
mit Laibungsschatten), während der Name wie ein Wandschild nach vorn kommt: Die Buchstaben fallen leicht
verdreht an ihren Platz, „da“ wird mit der Hand dazugeschrieben, Rahmenlinie und Sonnenstrahlen zeichnen sich.
Der Name liegt vor dem Foto: auf der Wand in Terrakotta, im Bogen in Creme – zwei deckungsgleiche Ebenen, die
dieselbe Bogenform als `clip-path` teilen. Die Farbe wechselt dadurch exakt an der Bogenkante, auch während der
Bogen sich bildet.

Formensprache: Rundbogen (Tür, Fenster, Bilderrahmen), Papier (Speisekarte, Zettel, Serviette, Polaroids),
handgezeichnete Linien (Kringel, Wellen, Pfeile, Strahlen), Karo-Tischdecke, Kreidetafel, Markisensaum.
Farben: Terrakotta, Creme, Olivgrün, dazu etwas Safran. Schriften: *Young Serif* (Schild, Überschriften, Preise),
*Caveat* (Handschrift, nur für kurze Notizen), *Figtree* (Fließtext).

**Zielgruppe:** Familien-Trattorien, Pizzerien und Osterien mit Mittagstisch, bei denen Reservierung und Abholung
vor allem telefonisch laufen. Gäste: Familien, Stammgäste, Leute in der Mittagspause.

## Lokal starten

```bash
python3 -m http.server 8405 --directory /pfad/zum/repo
# → http://127.0.0.1:8405/arena/design-trattoria/
```

Animationen testweise aus: `…/arena/design-trattoria/?motion=off`

## Was drin ist

| Abschnitt | Was passiert |
|---|---|
| Hero | Foto zieht sich in den Torbogen zurück, Name kommt nach vorn (reine CSS-Animation, ca. 2,2 s). Beim Scrollen steigt der Name, das Foto bleibt zurück, die Strahlen drehen sich ein Stück. |
| Familie | Leitsatz mit gezeichnetem Kringel, Polaroids mit Klebeband, vier Zahlen mit Handzeichnungen |
| Küche | Terrakotta-Fläche mit Zackensaum. Pasta fresca und Holzofen in Rundbogen-Bildern (Vorhang von unten, Parallaxe), Notizen mit Pfeil, Zitat |
| Speisekarte | Papierkarte auf Karo-Tischdecke. Reiter wie Register; ein gezeichneter Kringel wandert zum aktiven Reiter, das Blatt wird beim Wechsel kurz „umgelegt“. Pfeiltasten, Pos1/Ende. Ohne JS: alle Kategorien untereinander |
| Mittagstisch | Kreidetafel mit Wochenkarte, Zeilen werden „angeschrieben“, der heutige Tag wird eingekringelt (Montag/Wochenende: Hinweis) |
| Bilder | **Wäscheleine:** Polaroids hängen mit Holzklammern an einem Seil. Am Desktop wandert die Leine beim Scrollen seitlich, die Fotos schwingen wie echte Pendel (Feder-Physik, je Foto etwas anders) und lassen sich mit der Maus anstupsen. Am Handy wischen, Antippen schubst ein Foto an |
| Reservieren | Telefonzettel mit großer Nummer, Abholung, Formular: Personen-Stepper, Abreißkalender der nächsten 14 Tage (Ruhetag gesperrt), freie Uhrzeiten aus den Öffnungszeiten, Wünsche, Prüfung direkt am Feld, **Demo-Modus** (sagt deutlich, dass nichts versendet wurde) |
| Besuch | Live-Status („Jetzt geöffnet · bis 22:30 Uhr“), Öffnungszeiten mit Textmarker für heute, Wegskizze auf einer Serviette (zeichnet sich), Link zu Google Maps (keine Einbettung) |
| Handy | Vollbild-Menü in Terrakotta (uno, due, tre …), feste Leiste unten mit „Anrufen“ und „Tisch reservieren“ |

Ohne JavaScript, bei „Bewegung reduzieren“ oder mit `?motion=off` ist alles sofort sichtbar und bedienbar
(keine Wege, keine Skalierung; Kartenwechsel und Menü nur als kurze Blende). Lädt `main.js` nicht, macht ein
Sicherheitsnetz im `<head>` nach 2,4 s alles sichtbar.

## Anpassen

### 1. Name, Adresse, Telefon, E-Mail

Suchen und ersetzen in `index.html`:

| Beispielwert | Kommt vor in |
|---|---|
| `da Rosella` / `Rosella` (Hero: einzelne Buchstaben `<span class="b">`) | Titel, Marke, Hero (zweimal: Terrakotta-Ebene und Creme-Ebene – beide gleich halten!), Karte, Footer |
| `Familie Ferraro`, `Rosella`, `Marco`, `Giulia` | Hero-Dachzeile, Familie, Karte, Zitat |
| `Kirchgasse 7`, `00000 Musterstadt` | Menü, Besuch, Footer, JSON-LD, Maps-Link |
| `0123 45 67 80` / `+49123456780` | Navigation, Hero, Menü, Karte, Reservieren, Footer, Mobilleiste, JSON-LD |
| `ciao@da-rosella.example` | Formular-Fallback, Besuch, Footer, JSON-LD |

Für einen neuen Namen im Hero: Buchstaben als `<span class="b" style="--i:0;--r:-9deg">R</span>` schreiben
(`--i` = Reihenfolge, `--r` = Anfangsneigung). Lange Namen: `--fs-hero` in `style.css` verkleinern.

### 2. Farben, Schriften, Abstände

Ganz oben in `css/style.css` (Abschnitt 2): `--crema`, `--carta`, `--tinte`, `--terra`, `--terra-tief` (Fläche Küche),
`--oliva`, `--oliva-dunkel` (Footer), `--tafel`, `--safran`, `--safran-hell` (kleine Schrift auf Terrakotta),
`--kuli` (Serviette). Schriften: `--display`, `--hand`, `--text`; neue `.woff2` nach `fonts/` und `@font-face`
anpassen. Abstände: `--gutter`, `--container`, `--abschnitt`.

### 3. Hero-Bild und Torbogen

| Datei | Größe | Wofür |
|---|---|---|
| `img/hero-800.webp`, `-1400`, `-2000` | Querformat 16:10 | Desktop und Tablet |
| `img/hero-hoch.webp` | 1080 × 1920 | Handy im Hochformat |

Am besten ein Foto, dessen Mitte ruhig ist (der Bogen zeigt nur die Mitte). Ausschnitt verschieben: `--hero-fokus`
(Standard `50% 60%`) bei `.hero__tiefe img`. Geometrie des Bogens in `.hero`: `--bogen-b` (Breite), `--bogen-o`
(oben), `--bogen-u` (unten), `--titel-y` (Höhe des Namens) – für Handy im Block `@media (max-width:760px)`.

### 4. Speisekarte

Abschnitt `#karte` in `index.html`. Ein Gericht:

```html
<li class="gericht">
  <div class="gericht__zeile"><h4 class="gericht__name">Name <small>für 2</small></h4><span class="gericht__punkte" aria-hidden="true"></span><p class="gericht__preis">12,50<span class="sr-only"> Euro</span></p></div>
  <p class="gericht__text">Beschreibung</p>
  <ul class="merkmale"><li class="merkmal merkmal--veg">vegetarisch</li></ul>   <!-- optional -->
</li>
```

Merkmale: `merkmal--veg`, `merkmal--vegan`, `merkmal--scharf`, `merkmal--haus`. Neue Kategorie: Reiter-Knopf in
`.reiter` und passende `<section class="gang" role="tabpanel">` ergänzen (`aria-controls` ↔ `id`, `aria-labelledby` ↔ Reiter-`id`).

### 5. Mittagstisch

Wochenkarte in `#mittag`: je Tag ein `<li data-wochentag="2">` (0 = Sonntag … 6 = Samstag). Das Skript kringelt
den heutigen Tag ein.

### 6. Öffnungszeiten

**Einzige Quelle** ist die Tabelle in `#besuch`: `<tr data-tag="2" data-zeiten="11:30-14:30,17:30-22:30">`
(leer = Ruhetag, Zeiten über Mitternacht gehen). `data-letzte-reservierung="90"` = letzte buchbare Zeit vor
Schluss, `data-zeitzone="Europe/Berlin"`. Daraus entstehen Live-Status, Kalender und Uhrzeiten. Sichtbaren Text,
Footer und JSON-LD mitpflegen.

### 7. Reservierung

Ohne `data-endpoint` läuft das Formular im Demo-Modus. Für echten Versand einen Formular-Dienst eintragen:
`<form class="formular" data-buchung data-endpoint="https://formspree.io/f/DEINE-ID" …>` (normales `FormData`-POST,
Felder `personen`, `datum`, `uhrzeit`, `name`, `telefon`, `email`, `wunsch`, `anmerkung`, `datenschutz`). Den Hinweis
`.formular__demo` dann entfernen. Ohne JavaScript nutzt das Formular `mailto:` als Rückfall.

### 8. Bilder an der Wäscheleine

Ein Foto = ein `<li class="foto" style="--rot:-2deg">` mit `<figure class="foto__papier" data-foto>`. Quadratische
Bilder ab 640 px funktionieren am besten; `--rot` ist die Grundneigung.

### 9. Anfahrt

Die Wegskizze ist reines SVG in `.serviette` (Straßen, Orte, Beschriftung, Ziel als eigene Gruppen). Straßennamen im
`<text>` ändern, der `<title>` beschreibt die Skizze für Vorlesesoftware. Google-Maps-Link bei „Route planen“ anpassen.

### 10. Demo-Teile entfernen

1. `<meta name="robots" content="noindex, nofollow">` löschen.
2. Footer-Hinweis „Demo-Website, alle Inhalte sind Beispiele.“ ersetzen.
3. Impressum/Datenschutz verlinken aktuell auf `../../restaurant/impressum.html` und `datenschutz.html` (Vorlagen mit Platzhaltern).
4. `og:image` im Livebetrieb als volle Adresse angeben (am besten ein eigenes 1200 × 630 JPG).

## Technik

- Animiert werden nur `transform`, `opacity` und `clip-path`. Handgezeichnete Linien werden per `clip-path` aufgedeckt
  (kein `stroke-dashoffset`). Kurven: `--ease-out` (UI), `--ease-in-out` (Bewegung auf dem Bildschirm), `--ease-feder`
  (kleines Überschwingen für verspielte Details). UI-Übergänge ≤ 300 ms, Staffelungen 40–80 ms.
- Das Hero-Intro ist eine CSS-Animation (startet, sobald das Foto dekodiert ist); GSAP nur für Scroll-Kopplung
  (Parallaxe, Wäscheleine). Die Pendel-Physik läuft in einem eigenen `requestAnimationFrame`, nur solange die Leine
  sichtbar ist und sich etwas bewegt.
- Hover nur bei Maus (`@media (hover:hover) and (pointer:fine)`), `:active` mit `scale(.97)`, kein eigener Mauszeiger.
- Handy: `100svh`, Eingabefelder 16 px, `viewport-fit=cover` + `env(safe-area-inset-*)`, einspaltige Grids mit
  `minmax(0,1fr)`, Abschnitte mit `overflow-x: clip` (gedrehte Papierelemente erzeugen keinen Querscroll).

## Bildnachweis

Fotos von [Unsplash](https://unsplash.com) (Unsplash-Lizenz, frei nutzbar). Quelle: `https://images.unsplash.com/photo-<ID>`

| Datei | Unsplash-ID |
|---|---|
| img/hero-800/-1400/-2000/-hoch | 1537047902294-62a40c20a6ae |
| img/pasta-560/-900 | 1473093226795-af9932fe5856 |
| img/ofen-560/-900 | 1579751626657-72bc17010498 |
| img/ravioli-700 | 1587740908075-9e245070dfaa |
| img/teilen-640 | 1600628421055-4d30de868b8f |
| img/margherita-640 | 1604068549290-dea0e4a305ca |
| img/tiramisu-640 | 1571877227200-a0d98ea607e9 |
| img/vongole-640 | 1595295333158-4742f28fbd85 |
| img/bruschetta-640 | 1506280754576-f6fa8a873550 |
| img/polpette-640 | 1502301103665-0b95cc738daf |

Mitbenutzt aus der Basis-Demo (`../../restaurant/assets/img/`, Quellen siehe `restaurant/README.md`):
`galerie/tafel-700/-1400`, `galerie/wintergarten-700`, `anlaesse/gutschein`.

Schriften (SIL Open Font License, zur Bauzeit von Google Fonts geladen und selbst gehostet): Young Serif, Caveat, Figtree.
