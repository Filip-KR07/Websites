# Restaurant-Demo „Salz & Glut“

Vorlage für Restaurant-Websites. Das Restaurant ist erfunden, alle Texte, Preise und Bewertungen sind Beispiele.
Statische Seite ohne Build-Schritt: `index.html` + `css/style.css` + `js/main.js`, Animationen mit GSAP/ScrollTrigger und Lenis
(lokal in `assets/vendor/`), Schriften selbst gehostet (`assets/fonts/`).

## Lokal starten

```bash
cd restaurant
python3 -m http.server 8080
# → http://127.0.0.1:8080
```

- Animationen testweise aus: `http://127.0.0.1:8080/?motion=off`
- Mit einem bestimmten Stil öffnen (praktisch zum Verschicken an Kunden): `?stil=glut`, `?stil=salon`, `?stil=terrasse`

## Was drin ist

| Abschnitt | Was passiert |
|---|---|
| Hero | Vollbild-Foto. Beim Laden steht erst das Bild groß und scharf da, dann rückt es nach hinten (kleiner, dunkler, weicher) und die Schrift kommt nach vorn. Beim Scrollen schiebt sich der nächste Abschnitt wie ein Blatt darüber. |
| Küche | Leitsatz wird Wort für Wort heller, Bilder mit Parallax, Unterschrift zeichnet sich, Zahlen zählen hoch |
| Laufband | Endlos-Schriftband, pausiert außerhalb des Bildschirms |
| Signature-Gerichte | Desktop: Sektion bleibt stehen, die Karten fahren beim Scrollen seitlich durch. Handy/Tablet: Wischen |
| Speisekarte | Tabs mit gleitender Markierung, am Desktop Foto-Vorschau neben dem Mauszeiger |
| Stimmen | Zitate zum Durchblättern (Pfeile oder Wischen) |
| Galerie | Bilder öffnen sich groß aus dem Vorschaubild heraus, Pfeiltasten und Wischen |
| Anlässe | Private Dining, Chef’s Table, Gutscheine. „Anfragen“ trägt den Anlass ins Reservierungsformular ein |
| Reservierung | Personen, Datum (nächste 3 Wochen, Ruhetage gesperrt), freie Uhrzeiten aus den Öffnungszeiten, Prüfung direkt am Feld |
| Besuch | Öffnungszeiten mit Live-Status („Jetzt geöffnet · bis 23:00 Uhr“), heutiger Tag markiert, Lageplan ohne Google-Einbettung |
| Handy | Feste Leiste unten mit „Anrufen“ und „Tisch reservieren“, Vollbild-Menü |

Ohne JavaScript oder mit der Systemeinstellung „Bewegung reduzieren“ ist alles sichtbar und bedienbar.

## Für ein echtes Restaurant anpassen

### 1. Name, Adresse, Telefon, E-Mail

Suchen und ersetzen in `index.html`, `impressum.html`, `datenschutz.html` und `assets/og/og-vorlage.html`:

| Beispielwert | Kommt vor in |
|---|---|
| `Salz &amp; Glut` / `Salz <em>&amp;</em> Glut` | Titel, Navigation, Menü, Hero, Footer, Rechtliches |
| `Marktgasse 12`, `00000 Musterstadt` | Hero-Infozeile, Menü, Besuch, Footer, JSON-LD, Google-Maps-Link |
| `0123 456 789` / `+49123456789` | Navigation, Menü, Reservierung, Besuch, Footer, Mobilleiste, JSON-LD |
| `tisch@salz-und-glut.example` | Besuch, Footer, Gutscheine, Formular-Fallback, JSON-LD |
| `Altstadt` | Hero, Küche-Text |
| `Jonas Albrecht` | Unterschrift in „Küche“ |

Dazu: `<title>`, `description` und `og:`-Angaben im `<head>`, das JSON-LD (Restaurant-Daten für Google) und der Instagram-Link.

### 2. Farben und Schrift

In `css/style.css` ganz oben (Abschnitt 2). Ein Stil ist ein Block mit Farben und Display-Schrift:

- `--bg`, `--bg-2`, `--bg-3` – Hintergründe (Seite, Flächen, erhabene Flächen)
- `--ink`, `--ink-2`, `--muted` – Text in drei Stufen
- `--accent`, `--accent-ink` – Akzentfarbe und Text darauf (Knöpfe, Auszeichnungen)
- `--hero-accent` – Akzent auf dem Foto (das „&“), muss auf dunklem Bild gut lesbar sein
- `--deep` – Footer
- `--display` – Schrift für Überschriften (Fraunces oder Cormorant Garamond sind dabei)

Für ein echtes Restaurant: die Werte im Block `glut` anpassen und die Blöcke `salon` und `terrasse` löschen.
Neue Schrift: `.woff2` nach `assets/fonts/`, `@font-face` oben in `style.css` ergänzen, `--display` umstellen.

### 3. Hero-Bild

Dateien in `assets/img/hero/`, Name nach dem Muster `<name>-<variante>.webp`:

| Datei | Größe | Wofür |
|---|---|---|
| `innen-800.webp`, `innen-1400.webp`, `innen-2000.webp` | 800 / 1400 / 2000 px breit, Querformat | Desktop und Tablet |
| `innen-hoch.webp` | 1080 × 1920 | Handy im Hochformat |
| `innen-weich.webp`, `innen-weich-hoch.webp` | 900 px bzw. 540 × 960, **stark weichgezeichnet** | Unschärfe-Ebene fürs Intro |

Dunkle, ruhige Bilder mit freier Fläche für die Schrift funktionieren am besten. Der Bildausschnitt lässt sich mit
`--hero-fokus` verschieben (Standard `50% 55%`, in `style.css` bei `.hero__pic img`). Bei einer Seite ohne Stil-Umschalter
reicht ein Satz Dateien; die Pfade stehen direkt im HTML beim `<picture>` im Hero.

Die weiche Variante: Bild in einem Bildprogramm mit etwa 30–40 px Gaußscher Unschärfe exportieren (klein, ca. 20 KB).

### 4. Speisekarte

In `index.html` im Abschnitt `#karte`. Ein Gericht:

```html
<li class="dish" data-preview="assets/img/gerichte/rind-500.webp">   <!-- data-preview optional -->
  <div class="dish__row"><h4 class="dish__name">Name</h4><span class="dish__dots" aria-hidden="true"></span><p class="dish__price">38 <span>€</span></p></div>
  <p class="dish__desc">Beschreibung</p>
  <ul class="dish__tags"><li class="tag tag--vegan">vegan</li></ul>                  <!-- optional -->
</li>
```

Tags: `tag` (neutral), `tag--vegan`, `tag--scharf`, `tag--signature`. Weitere Kategorie: einen Tab-Knopf in `.tabs__list`
und ein passendes `.tabs__panel` mit eigener `id` ergänzen (`aria-controls` / `aria-labelledby` verbinden die beiden).

### 5. Öffnungszeiten

**Einzige Quelle** ist die Tabelle im Abschnitt `#besuch`. Daraus rechnet das Skript den Live-Status und die
Reservierungszeiten:

```html
<tr data-tag="6" data-zeiten="12:00-15:00,17:30-24:00">   <!-- 0 = Sonntag … 6 = Samstag, leer = Ruhetag -->
```

- Zeiten nach Mitternacht gehen auch (`18:00-01:00`).
- `data-letzte-reservierung="90"` – letzte buchbare Uhrzeit, Minuten vor Schluss.
- `data-zeitzone="Europe/Berlin"` – Status richtet sich nach der Uhrzeit vor Ort, nicht nach der des Gastes.
- Den sichtbaren Text in der Zelle und das JSON-LD im `<head>` bitte mitpflegen.

### 6. Reservierung

Ohne Einstellung läuft das Formular im **Demo-Modus**: Es prüft alles, zeigt die Bestätigung und sagt dazu, dass nichts
versendet wurde. Für echten Versand einen Formular-Dienst eintragen:

```html
<form class="buchung__form" data-buchung data-endpoint="https://formspree.io/f/DEINE-ID" …>
```

Gesendet wird ein normales `FormData`-POST (Felder: `personen`, `datum`, `uhrzeit`, `name`, `email`, `telefon`, `anmerkung`,
`datenschutz`). Nutzt das Restaurant ein Reservierungssystem (z. B. OpenTable, Quandoo, resmio), kann der Block `.buchung`
durch dessen Einbettung ersetzt werden – dann die Datenschutzerklärung anpassen.

### 7. Bilder in Küche, Signature, Galerie, Anlässen

Alle Fotos liegen in `assets/img/` (WebP, sRGB). Beim Tauschen `src`, `srcset`, `width`/`height` und vor allem das `alt`
(Bildbeschreibung für Vorlesesoftware) anpassen. In der Galerie zusätzlich `data-w`/`data-h` = Maße der großen Datei.

### 8. Demo-Teile entfernen

1. `<meta name="robots" content="noindex, nofollow">` im `<head>` von `index.html` löschen (sonst findet Google die Seite nicht).
2. Stil-Umschalter: den Block `<div class="stil" data-stil-box>` am Ende von `index.html` und `.stil-inline` im Menü löschen.
   Im Skript im `<head>` die drei Zeilen ab `var s = …` löschen (sie lesen `?stil=` und den gespeicherten Stil),
   sonst könnte ein alter Link mit `?stil=salon` noch das Salon-Bild laden.
3. Im Footer „Demo-Website, alle Inhalte sind Beispiele.“ ersetzen.
4. Rechtliches: Platzhalter in `impressum.html` und `datenschutz.html` ausfüllen (`grep -n "\[\[" *.html`).

### 9. Vorschaubild für Social Media

`assets/img/og-image.jpg` (1200 × 630) wird aus `assets/og/og-vorlage.html` erzeugt: Seite über den lokalen Server öffnen
(`/assets/og/og-vorlage.html`) und das Element `#og` als Bild speichern (z. B. Screenshot des Elements in den DevTools).
`og:image` muss im Livebetrieb eine **volle** Adresse sein, z. B. `https://www.restaurant.de/assets/img/og-image.jpg`.

## Struktur

```
index.html              Startseite
impressum.html          Impressum (Vorlage mit Platzhaltern)
datenschutz.html        Datenschutzerklärung (Vorlage mit Platzhaltern)
css/style.css           Tokens + Stile, alle Abschnitte, Motion (Abschnitt 19)
js/main.js              Intro, Scroll-Effekte, Tabs, Galerie, Reservierung, Öffnungsstatus, Stil-Umschalter
assets/vendor/          gsap.min.js, ScrollTrigger.min.js, lenis.min.js
assets/fonts/           Fraunces, Inter, Cormorant Garamond (woff2, Latin)
assets/img/hero/        Hero-Bilder je Stil (innen = Glut, salon, terrasse)
assets/img/…            kueche, gerichte, galerie, anlaesse, og-image.jpg
assets/og/              Vorlage für das Social-Media-Vorschaubild
```

## Technik-Hinweise

- Animiert werden nur `transform`, `opacity`, `clip-path` und kurz `filter` (Intro). Kurven: `--ease-out`, `--ease-in-out`,
  `--ease-drawer` in `style.css`. Hover-Effekte nur bei Maus (`@media (hover: hover) and (pointer: fine)`).
- Weiches Scrollen (Lenis) nur mit Maus/Trackpad; auf Touch-Geräten bleibt das native Scrollen.
- Die Signature-Sektion wird nur ab 1024 × 760 px festgehalten, darunter ist sie eine Wisch-Leiste.
- Neue Abschnitte blenden mit `data-reveal` (von unten) oder `data-reveal="clip"` (Bild-Vorhang) ein.

## Deploy

Liegt der Ordner im Website-Repo, ist die Demo nach dem Deploy unter `/restaurant/` erreichbar.
Als eigenes Projekt (z. B. für einen Kunden): Ordner kopieren und bei Vercel als *Root Directory* `restaurant` wählen –
oder den Inhalt auf jeden anderen statischen Host (Netlify, GitHub Pages, klassisches Webhosting per FTP) laden.

## Bildnachweis

Alle Fotos von [Unsplash](https://unsplash.com) unter der Unsplash-Lizenz (kostenlos, auch kommerziell, ohne Namensnennung).
Für echte Kunden besser eigene Fotos des Restaurants verwenden. Quellen (`https://images.unsplash.com/photo-…`):

| Datei | Unsplash-ID |
|---|---|
| hero/innen-* | 1517248135467-4c7edcad34c4 |
| hero/salon-* | 1552566626-52f8b828add9 |
| hero/terrasse-* | 1559339352-11d035aa65de |
| kueche/feuer-* | 1600565193348-f74bd3c7ccdf |
| kueche/chef-* | 1577219491135-ce391730fb2c |
| gerichte/rind-* | 1558030006-450675393462 |
| gerichte/shortrib-* | 1544025162-d76694265947 |
| gerichte/garnelen-* | 1559847844-5315695dadae |
| gerichte/herbstsalat-* | 1540189549336-e6e99c3679fe |
| gerichte/schokolade-* | 1606313564200-e75d5e30476c |
| gerichte/brot-* | 1509440159596-0249088772ff |
| gerichte/cocktail-bramble-*, galerie/cocktail-* | 1536935338788-846bb9981813 |
| gerichte/cocktail-rauch-*, galerie/digestif-* | 1514362545857-3bc16c4c7d1b |
| galerie/tisch-* | 1414235077428-338989a2e8c0 |
| galerie/bar-* | 1543007630-9710e4a00a20 |
| galerie/anschnitt-* | 1529692236671-f1f6cf9683ba |
| galerie/wintergarten-* | 1600093463592-8e36ae95ef56 |
| galerie/tafel-* | 1528605248644-14dd04022da1 |
| anlaesse/private-dining | 1550966871-3ed3cdb5ed0c |
| anlaesse/chefs-table | 1581349485608-9469926a8e5e |
| anlaesse/gutschein | 1510812431401-41d2bd2722f3 |
