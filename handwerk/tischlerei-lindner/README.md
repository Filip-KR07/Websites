# Lindner – Tischlerei & Innenausbau · Modell „Manufaktur“

Demo-Website für einen **fiktiven** Handwerksbetrieb (Tischlerei in Freiburg im Breisgau). Alle Namen, Daten, Bewertungen und Zahlen sind erfunden. Die Seite ist statisch (HTML, CSS, JavaScript), braucht keinen Build-Schritt und lädt nichts von fremden Servern.

Designsprache „Manufaktur“: warm und editorial, Holz als Material, Fraunces als Display-Schrift (wie eingebrannt), Instrument Sans für Text.

## Gestaltungsidee

Die Seite ist aus dem Material selbst gebaut: Der erste Bildschirm zeigt eine generativ gezeichnete Stammscheibe (Hirnholz mit Jahresringen, Markstrahlen, Trockenrissen, Rinde), in die der Schriftzug „Möbel, die bleiben.“ wie mit dem Brandeisen eingebrannt wird – die Buchstaben glühen kurz auf und kühlen zur dunklen Brandspur ab; ein Brandstempel trägt Meisterbetrieb und Gründungsjahr. Statt Etiketten über den Abschnitten markiert das Tischlerdreieck (die Anrissmarke, mit der Tischler Bauteile ordnen) die Kapitel, Bleistiftstriche, Zollstock, Schraubzwingen und Laufzettel sind die handgemachten Details. Die Bewegungs-Handschrift ist der lange Hobelzug: ruhig ansetzen, gleichmäßig durchziehen, satt auslaufen – nie federnd, nie hektisch; beim Scrollen fliegen Hobelspäne aus dem Hobel-Foto. Drei Kapitel erzählen den Weg vom Holz zum Möbel: die Werkbank (Material-Konfigurator), die Skizze, die zum fertigen Werkstück wird, und die Projekte als Holzmuster-Kacheln.

## Dateien

| Datei | Inhalt |
|---|---|
| `index.html` | Startseite mit allen Abschnitten, JSON-LD (`HomeAndConstructionBusiness`) |
| `style.css` | Gestaltung; Farben, Schriften, Abstände als CSS-Variablen in `:root` |
| `main.js` | Interaktionen (ohne Build, optional GSAP/ScrollTrigger und Lenis) |
| `impressum.html`, `datenschutz.html` | Muster-Rechtstexte (vor dem Livegang ersetzen) |
| `favicon.svg` | Zeichen: Schwalbenschwanz-Verbindung |
| `assets/img/` | Fotos (je 480 und 960 px breit, WebP) + `BILDNACHWEIS.md` |
| `assets/fonts/` | Selbst gehostete Schriften (SIL OFL) |
| `assets/vendor/` | GSAP 3.13 + ScrollTrigger, Lenis |

## Abschnitte

Hero (Stammscheibe) · Leistungen · Werkbank/Materialbibliothek · Projekte · Ablauf (Skizze → Werkstück) · Werkstatt & Team · In Zahlen (Jahresringe) · Stimmen · Einzugsgebiet · Ausbildung & Karriere · Fragen · Anfrage · Footer. Auf dem Handy: feste Aktionsleiste „Anrufen / Anfrage stellen“.

## Besondere Funktionen

1. **Hero „Stammscheibe“:** Canvas zeichnet einmalig eine Hirnholz-Scheibe (exzentrische Markröhre, 64 unterschiedlich breite Jahresringe mit Porenkranz, Markstrahlen, Trockenrisse, Rinde, Sägespuren) und blendet sie per `clip-path` von innen nach außen auf. Die Überschrift wird Buchstabe für Buchstabe „eingebrannt“ (Glut → Brandspur, dazu die Variable-Font-Achsen `wght`/`opsz`), der Brandstempel wird aufgedrückt. Beim Scrollen dreht sich die Scheibe, und Hobelspäne (vorgezeichnete Sprites mit einfacher Physik) fliegen aus dem Foto; auf dem Desktop folgt ein Streiflicht der Maus mit Feder.
2. **Materialbibliothek als Werkbank:** Hobelbank mit Bankhakenlöchern, Zollstock statt Maßlinie, Schraubzwingen, Zimmermannsbleistift, Anriss (Tischlerdreieck) auf der Platte, Steckbrief als Laufzettel. Fünf Holzarten × drei Oberflächen. Die Tischplatte wird prozedural gerendert (fünf verleimte Lamellen, Jahrringe, Poren, Spiegel); beim Holzwechsel zieht ein „Hobelstrich“ über die Platte. Glanzlicht folgt der Maus. Steckbrief mit Herkunft, Härte, Charakter, Preisniveau. Native Radiobuttons – per Tastatur mit Pfeiltasten bedienbar, funktioniert dank CSS `:has()` sogar ohne JavaScript. „Diese Kombination anfragen“ übernimmt Holz und Oberfläche in den Anfrage-Assistenten.
3. **Projekte als Holzmuster-Kacheln:** Unter jedem Foto liegt ein prozedural gerendertes Musterbrett der verwendeten Holzart mit eingebranntem Namen. Auf dem Desktop eine horizontale Strecke (CSS `position: sticky` + ScrollTrigger-Scrub, kein GSAP-Pin) mit Tiefen-Parallaxe von Foto und Musterbrett; auf dem Handy eine native Wisch-Liste mit Scroll-Snap.
4. **Ablauf – Skizze → Werkstück:** Eine Bleistiftskizze (SVG) zeichnet sich beim Scrollen in fünf Schritten selbst (Sticky-Bühne), am Ende wischt das Foto des fertigen Sideboards unter den Linien herein.
5. **Werkstatt-Zitat als Brennspur:** Das Zitat brennt sich Zeichen für Zeichen mit dem Scroll ein, an der Spitze glüht die Glut.
6. **Jahresringe:** Pro Betriebsjahr wächst ein Ring (SVG, generiert), Meilensteine der Zeitleiste werden markiert; dazu Zähler (Jahre, Team, Projekte, Werkstattfertigung).
7. **Anfrage-Assistent:** Vier Schritte mit Fortschritt, Zurück-Navigation, Validierung und Zusammenfassung. Es wird nichts gesendet (Demo-Hinweis), Eingaben werden nur per `textContent` ausgegeben.

Außerdem: Leistungen mit einem auf Gehrung gearbeiteten Eichenrahmen, dessen Bild beim Scrollen wechselt; Zeichen-Rollen in der Navigation, magnetische Knöpfe, Bleistift-Unterstreichungen, die sich beim Hover neu ziehen; Karussell für Kundenstimmen (Tasten, Wischen); eigene SVG-Karte des Einzugsgebiets; FAQ als `<details>`; Menü als `<dialog>`.

## Anpassen

- **Name, Telefon, Adresse, Öffnungszeiten:** direkt in `index.html` (Header, Hero, Anfrage, Footer, JSON-LD im `<head>`), in `impressum.html` und `datenschutz.html`. Telefonnummer immer zweimal ändern: sichtbar (`0761 123 45 60`) und im Link (`tel:+497611234560`).
- **Farben:** in `style.css` unter `:root` – z. B. `--paper` (Papier), `--ink` (Nussbaum-Dunkel), `--oak` (Akzent), `--char` (Brandspur), `--bench` (Hobelbank). Bewegung: `--dur-*` und `--ease-plane`/`--ease-set` im Block „NEUGESTALTUNG“. Für kleine Schrift die geprüften Varianten `--oak-deep` (auf hell) und `--oak-light` (auf dunkel) verwenden.
- **Schriften:** `@font-face` am Anfang von `style.css`, Dateien in `assets/fonts/`.
- **Bilder:** Dateien in `assets/img/` gleichnamig ersetzen (jeweils `-480.webp` und `-960.webp`, gleiches Seitenverhältnis) oder `src`/`srcset`/`width`/`height`/`alt` in `index.html` anpassen. Die Fotos sind höchstens 960 px breit und werden deshalb nie bildschirmfüllend gezeigt.
- **Hölzer der Materialbibliothek:** Farben und Maserung in `main.js` (`WOODS`), Texte im Abschnitt `#material` in `index.html`.
- **Jahresringe:** Gründungsjahr in `main.js` (`since = 1987`) und im Zähler (`data-since`); markierte Jahre in `marks`.
- **Karte:** Die SVG-Karte steht direkt in `index.html` (`.map-svg`); Orte sind `<g class="town" data-town="…">`, die Liste daneben nutzt dieselben `data-town`-Werte.

- **Pfade:** Alle Verweise in den HTML-Dateien sind absolut (`/handwerk/tischlerei-lindner/…`), weil Vercel mit `trailingSlash: false` die Ordner-URL ohne Schrägstrich ausliefert. Wird der Ordner umbenannt oder die Seite an die Domain-Wurzel gelegt, den Pfad per Suchen & Ersetzen in `index.html`, `impressum.html` und `datenschutz.html` anpassen. `url()`-Pfade in `style.css` sind relativ und bleiben unverändert.

## Lokal starten

```sh
cd /pfad/zum/repo          # Repository-Wurzel
python3 -m http.server 8771
# http://127.0.0.1:8771/handwerk/tischlerei-lindner/
```

Testhilfen: `?motion=off` an die URL hängen schaltet alle Animationen ab. Die Seite respektiert außerdem `prefers-reduced-motion` (nur sanfte Einblendungen, keine Scroll-Strecken, keine Späne) und funktioniert ohne JavaScript.

## Hinweise

- `noindex` ist gesetzt, weil es sich um einen fiktiven Betrieb handelt – vor dem Livegang entfernen.
- Impressum und Datenschutz sind Muster (keine Rechtsberatung) und müssen durch echte Angaben ersetzt werden.
- Bildnachweis: siehe `assets/img/BILDNACHWEIS.md` (StockSnap, CC0).
