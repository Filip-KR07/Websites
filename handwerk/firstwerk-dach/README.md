# FIRSTWERK – Dach & Holzbau · Demo-Modell „Kante“

Demo-Website für einen **fiktiven** Dachdecker- und Zimmerei-Meisterbetrieb in Hamburg.
Designsprache „Kante“: industriell und wetterfest, harte Raster, Versal-Headlines in schmaler Archivo,
technische Labels in JetBrains Mono, Signal-Orange als sparsamer Akzent – und die Dachneigung
als wiederkehrendes Motiv. Statisch, ohne Build-Schritt, ohne externe Requests.

## Dateien

| Datei | Inhalt |
|---|---|
| `index.html` | One-Pager mit allen Abschnitten, JSON-LD (`RoofingContractor`) |
| `style.css` | Gesamtes Styling, Farben/Schriften/Abstände als CSS-Variablen in `:root` |
| `main.js` | Interaktionen (Vanilla JS + GSAP/ScrollTrigger + Lenis aus `assets/vendor/`) |
| `impressum.html`, `datenschutz.html` | Muster-Rechtstexte im Stil der Seite |
| `favicon.svg` | Firstlinie + Firstbalken |
| `assets/img/` | Fotos (`-480`/`-960.webp`), siehe `assets/img/BILDNACHWEIS.md` |
| `assets/fonts/` | Archivo (variabel, `wght` + `wdth`), JetBrains Mono – selbst gehostet |

## Gestaltungsidee

**„Regelschnitt“ – ein Dach ist eine Folge von Schichten, die das Wetter draußen halten.** Die ganze Seite
ist als Plansatz eines Dachdeckers gebaut: Der Hero zeigt den Regelschnitt durch ein Steildach (Tonziegel bis
Gipskarton), auf dem echter Regen (Canvas) abprallt – beim Scrollen fächern die Schichten wie in einer
Explosionszeichnung nach innen auf, das Schriftfeld des Plans trägt die Vertrauenssignale. Jeder weitere
Abschnitt ist ein Blatt aus diesem Plansatz: der Konfigurator als angeklebter Baustellenplan, der Dach-Check als
Wetter-Simulation, die Referenzen als Planstapel, die Zahlen auf einem Zollstock. Bewegungs-Handschrift
„Lage für Lage“: schwer, mechanisch, ohne Federn – Bauteile werden abgesenkt und eingerastet
(`--m-set`, `--m-shift`, `--m-snap`, `--m-step` in `style.css`).

## Abschnitte

Hero „Regelschnitt“ (Schriftfeld + Legende) · Laufband im Dachwinkel · Leistungen (7 Karten) ·
Dach-Konfigurator (Baustellenplan) · Vorher/Nachher · Dach-Check (Wetter-Simulation) · Referenzen (Planstapel) ·
Sturmschaden-Notdienst · Zahlen (Zollstock) · Ablauf · Betrieb/Team · Kundenstimmen (Prüfstempel) ·
Einzugsgebiet (SVG-Karte + PLZ-Check) · Karriere · FAQ · Anfrage-Assistent (4 Schritte) · Footer.
Auf dem Handy: feste Aktionsleiste „Anrufen / Anfrage“.

## Spezial-Features

1. **Hero „Regelschnitt“** – Inline-SVG-Schnitt mit acht Schichten (beide Dachseiten), die beim Laden von außen
   nach innen „verlegt“ werden (CSS, ≤ 1,2 s, blockiert nichts). Desktop: Die Bühne klebt (`position: sticky`),
   beim Scrollen wandern die Lagen nach innen ins Dachgeschoss, Positionsnummern und Legende leuchten auf.
   Handy: eigene Komposition (Giebel groß angeschnitten unter dem Text), Auffächern beim Wegscrollen.
2. **Regen-Canvas mit Physik** – Tropfen prallen an der Dachhaut ab (Kollision gegen die Giebelform im
   Koordinatensystem der Zeichnung) und spritzen hangabwärts; mit Maus ist der Cursor ein Schirm.
   Pausiert außerhalb des Bildes und bei verstecktem Tab, im Leerlauf halbe Bildrate, DPR ≤ 2.
3. **Laufband im Dachwinkel** – zwei Bänder treffen sich als First, laufen schneller beim Scrollen.
4. **Leistungen als Karten-Stapel** – Desktop Sticky-Stacking mit Detailzeichnungen, Handy Wisch-Deck.
5. **Dach-Konfigurator als Baustellenplan** – 5 Dachformen × 5 Eindeckungen, isometrisches 3D-Modell,
   Steckbrief mit Plausibilitätsprüfung. Der Plan wird beim ersten Sichtkontakt aufgerollt (Planrolle,
   Klebeband, Beschnittmarken, Schriftfeld).
6. **Vorher/Nachher-Slider** – `role="slider"`, Ziehen oder Pfeiltasten.
7. **Dach-Check als Wetter-Simulation** – 5 Fragen; jede Frage verschärft das Wetter (Bft 4 → 10, Regen-Ebenen,
   Wind dreht den Regen), jede Antwort verändert das Haus (Moos, lose Ziegel, Tropfen im Dachboden,
   Wärmeverlust, Prüfplakette). Ergebnis als Stempel; „Termin für Dach-Check“ übernimmt alles in die Anfrage.
8. **Referenzen als Planstapel** – Desktop: Stapel aus fünf Planblättern in einer klebenden Bühne, beim
   Scrollen wird das oberste Blatt abgezogen, Zählwerk und Planindex laufen mit, das oberste Blatt wird farbig.
   Handy: Wisch-Schiene mit Scroll-Snap. Ohne JS: Raster.
9. **Zahlen auf dem Zollstock** – vier Glieder klappen beim Scrollen auf, Zähler laufen hoch.
10. **Mikro-Interaktionen** – Navigation mit rollenden Zeichen, magnetische Haupt-Buttons (nur feiner Zeiger),
    Unterstreichungen, die sich neu zeichnen, Prüfstempel für die Bewertung, Papierkörnung.

Ohne JavaScript, bei `prefers-reduced-motion` und mit `?motion=off` bleibt alles sichtbar und bedienbar
(Regelschnitt statisch halb aufgefächert, Regen als Standbild, Planblätter als Raster).

## Anpassen

- **Name, Adresse, Telefon, E-Mail:** in `index.html` (inkl. JSON-LD im `<head>`), `impressum.html`
  und `datenschutz.html` suchen/ersetzen, z. B. `FIRSTWERK`, `040 765 432 10`, `+494076543210`,
  `moin@firstwerk-dach.de`, `Am Firstbalken 3`. Der Notdienst steht als `040 765 432 19` /
  `+494076543219` im Header, Menü, Notdienst-Band, FAQ und Footer.
- **Farben:** `:root` in `style.css` – `--c-orange` (Akzent), `--c-bg` (Beton-Weiß),
  `--c-ink` (Fast-Schwarz), `--c-graphite`, `--c-line`. Die Materialfarben des Konfigurators
  stehen als `<pattern id="mat-…">` oben in `index.html`.
- **Schriften:** `@font-face` am Anfang von `style.css`; Breite der Headlines über `font-stretch`
  (62 % = sehr schmal).
- **Bilder:** gleiche Dateinamen in `assets/img/` ersetzen (jeweils `-480` und `-960.webp`,
  max. 960 px breit) oder `src`/`srcset`/`width`/`height`/`alt` im HTML anpassen.
- **Konfigurator-Daten** (Steckbrief, Kombinationen): Objekte `SHAPES`, `MATS`, `FIT` in `main.js`.
- **Dach-Check-Logik:** Funktion `finish()` in `initQuiz()` (`main.js`); Wetterstufen in `WX`, Hausreaktion in `wxSet()`.
- **Regelschnitt im Hero:** Inline-SVG `.xsec` in `index.html`; Schichtfarben `.x-*` in `style.css`.
- **Pfade:** Alle Links auf Dateien sind absolut (`/handwerk/firstwerk-dach/…`), damit die Seite
  auf Vercel mit `cleanUrls`/`trailingSlash: false` auch ohne Schrägstrich am Ende funktioniert.
  Wird der Ordner verschoben, diese Pfade per Suchen/Ersetzen anpassen.

## Lokal starten

```bash
cd /home/user/Websites
python3 -m http.server 8907
# → http://127.0.0.1:8907/handwerk/firstwerk-dach/
# Animationen aus: http://127.0.0.1:8907/handwerk/firstwerk-dach/?motion=off
```

## Hinweise

- Fiktiver Betrieb: Alle Namen, Zahlen, Preise und Bewertungen sind erfunden.
  `<meta name="robots" content="noindex">` ist gesetzt.
- Formulare senden nichts (kein Backend) – nach dem Absenden erscheint eine Zusammenfassung mit
  dem Hinweis „Demo – es wurde nichts gesendet“.
- Bildquellen und Lizenz: `assets/img/BILDNACHWEIS.md` (StockSnap, CC0).
