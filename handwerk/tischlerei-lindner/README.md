# Lindner – Tischlerei & Innenausbau · Modell „Manufaktur“

Demo-Website für einen **fiktiven** Handwerksbetrieb (Tischlerei in Freiburg im Breisgau). Alle Namen, Daten, Bewertungen und Zahlen sind erfunden. Die Seite ist statisch (HTML, CSS, JavaScript), braucht keinen Build-Schritt und lädt nichts von fremden Servern.

Designsprache „Manufaktur“: warm und editorial, viel Weißraum, feine Haarlinien, nummerierte Abschnitte (Nº 01 …), Fraunces als Display-Schrift, Instrument Sans für Text.

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

Hero · Nº 01 Leistungen · Nº 02 Materialbibliothek · Nº 03 Projekte · Nº 04 Ablauf · Nº 05 Werkstatt & Team · Nº 06 In Zahlen (Jahresringe) · Nº 07 Stimmen · Nº 08 Einzugsgebiet · Nº 09 Ausbildung & Karriere · Nº 10 Fragen · Nº 11 Anfrage · Footer. Auf dem Handy: feste Aktionsleiste „Anrufen / Anfrage stellen“.

## Besondere Funktionen

1. **Hero:** Die Überschrift „Möbel, die bleiben.“ morpht beim Laden Buchstabe für Buchstabe über die Variable-Font-Achsen von Fraunces (`opsz`, `wght`, `SOFT`). Daneben eine generative Holzmaserung (Höhenlinien eines Fladerschnitts, Canvas), die der Maus federnd folgt. Das Foto wird per `clip-path` aufgedeckt.
2. **Materialbibliothek:** Fünf Holzarten × drei Oberflächen. Die Tischplatte wird prozedural gerendert (fünf verleimte Lamellen, Jahrringe, Poren, Spiegel); beim Holzwechsel zieht ein „Hobelstrich“ über die Platte. Glanzlicht folgt der Maus. Steckbrief mit Herkunft, Härte, Charakter, Preisniveau. Native Radiobuttons – per Tastatur mit Pfeiltasten bedienbar, funktioniert dank CSS `:has()` sogar ohne JavaScript. „Diese Kombination anfragen“ übernimmt Holz und Oberfläche in den Anfrage-Assistenten.
3. **Projekte:** Auf dem Desktop eine gepinnte, horizontale Strecke (ScrollTrigger, Scrub) mit Fortschrittsanzeige und leichter Bild-Parallaxe; auf dem Handy eine native Wisch-Liste mit Scroll-Snap.
4. **Ablauf:** Eine Bleistiftskizze (SVG) zeichnet sich beim Scrollen in fünf Schritten selbst, während die Schritte nacheinander aktiv werden.
5. **Jahresringe:** Pro Betriebsjahr wächst ein Ring (SVG, generiert), Meilensteine der Zeitleiste werden markiert; dazu Zähler (Jahre, Team, Projekte, Werkstattfertigung).
6. **Anfrage-Assistent:** Vier Schritte mit Fortschritt, Zurück-Navigation, Validierung und Zusammenfassung. Es wird nichts gesendet (Demo-Hinweis), Eingaben werden nur per `textContent` ausgegeben.

Außerdem: Leistungen mit fixiertem Bildrahmen, der beim Scrollen wechselt; Karussell für Kundenstimmen (Tasten, Wischen); eigene SVG-Karte des Einzugsgebiets; FAQ als `<details>`; Menü als `<dialog>`.

## Anpassen

- **Name, Telefon, Adresse, Öffnungszeiten:** direkt in `index.html` (Header, Hero, Anfrage, Footer, JSON-LD im `<head>`), in `impressum.html` und `datenschutz.html`. Telefonnummer immer zweimal ändern: sichtbar (`0761 123 45 60`) und im Link (`tel:+497611234560`).
- **Farben:** in `style.css` unter `:root` – z. B. `--paper` (Papier), `--ink` (Nussbaum-Dunkel), `--oak` (Akzent), `--forest` (Waldgrün). Für kleine Schrift die geprüften Varianten `--oak-deep` (auf hell) und `--oak-light` (auf dunkel) verwenden.
- **Schriften:** `@font-face` am Anfang von `style.css`, Dateien in `assets/fonts/`.
- **Bilder:** Dateien in `assets/img/` gleichnamig ersetzen (jeweils `-480.webp` und `-960.webp`, gleiches Seitenverhältnis) oder `src`/`srcset`/`width`/`height`/`alt` in `index.html` anpassen. Die Fotos sind höchstens 960 px breit und werden deshalb nie bildschirmfüllend gezeigt.
- **Hölzer der Materialbibliothek:** Farben und Maserung in `main.js` (`WOODS`), Texte im Abschnitt `#material` in `index.html`.
- **Jahresringe:** Gründungsjahr in `main.js` (`since = 1987`) und im Zähler (`data-since`); markierte Jahre in `marks`.
- **Karte:** Die SVG-Karte steht direkt in `index.html` (`.map-svg`); Orte sind `<g class="town" data-town="…">`, die Liste daneben nutzt dieselben `data-town`-Werte.

## Lokal starten

```sh
cd /pfad/zum/repo          # Repository-Wurzel
python3 -m http.server 8771
# http://127.0.0.1:8771/handwerk/tischlerei-lindner/
```

Testhilfen: `?motion=off` an die URL hängen schaltet alle Animationen ab. Die Seite respektiert außerdem `prefers-reduced-motion` (nur sanfte Einblendungen, keine Pins) und funktioniert ohne JavaScript.

## Hinweise

- `noindex` ist gesetzt, weil es sich um einen fiktiven Betrieb handelt – vor dem Livegang entfernen.
- Impressum und Datenschutz sind Muster (keine Rechtsberatung) und müssen durch echte Angaben ersetzt werden.
- Bildnachweis: siehe `assets/img/BILDNACHWEIS.md` (StockSnap, CC0).
