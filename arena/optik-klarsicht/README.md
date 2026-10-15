# Klarsicht Optik & Akustik – Demo-Website (Modell „Fokus“)

Fiktiver Beispielbetrieb für die Arena von Filip Kramar: ein Augenoptik- und Hörakustik-Fachgeschäft in der Poststraße 9 in Bonn (Augenoptikermeister Niklas Brandt, Hörakustikerin Svea Lund, sechs Mitarbeitende). Statische Seite ohne Build-Schritt, alle Inhalte auf Deutsch, `noindex`.

Designsprache: minimal, skandinavisch, präzise. Weiß, Fast-Schwarz, Kobalt (#2443FF) als einziger Akzent, Hellgrau. Eine Schrift (Onest) in allen Rollen, Sehtafel-Typografie mit kleiner werdenden Zeilen, Schärfe/Unschärfe als durchgehendes Motiv.

## Abschnitte
Fokus-Hero · Sehtafel-Trenner · Kennzahlen · 01 Leistungen · Statement · 02 Gesichtsform-Finder · 03 Brillen-Anprobe · 04 Glas-Explorer mit Vergleichstabelle · 05 Ihr Weg zur Brille (horizontale Strecke) · 06 Sehtafel-Spiel · 07 Hörakustik · 08 Über uns, Team, Ausbildung · 09 Stimmen · 10 Anfahrt mit SVG-Lageplan und Einzugsgebiet · 11 Fragen · 12 Terminanfrage · Footer. Dazu `impressum.html` und `datenschutz.html` (Muster).

## Spezial-Features
- **Fokus-Hero:** Headline und Bild starten unscharf. Auf dem Desktop folgt eine Linse dem Cursor (Lupe mit leichter Vergrößerung, Dioptrien-Anzeige läuft gegen ±0,00); Eine kleine Dioptrien-Anzeige unten im Hero zeigt den Fokusvorgang. Wer nichts tut, sieht nach gut zwei Sekunden alles scharf (Autofokus); Mausbewegung und Scrollen stellen schneller scharf, solange die Linse bewegt wird, wartet der Autofokus kurz. Touch und reduzierte Bewegung: sanftes automatisches Scharfstellen. Zeitwerte in `main.js` (`AUTO_DELAY`, `AUTO_DUR` …). `?motion=off` und ohne JavaScript: sofort scharf.
- **Gesichtsform-Finder:** vier Fragen (Pfeiltasten, Weiter/Zurück) → Gesichtsform als Orientierung, gezeichnete Silhouette mit Favoriten-Brille, drei passende Fassungsformen als SVG, Übergabe an die Anprobe.
- **Brillen-Anprobe:** SVG-Silhouette in fünf Gesichtsformen (weiche Formüberblendung), sechs Fassungen, fünf Farben, Glasbreite 46–56 mm mit Maßlinie, Passform-Hinweis, Sonnenbrillen-Schalter; Auswahl lässt sich in die Terminanfrage übernehmen.
- **Glas-Explorer:** Tabs (Pfeiltasten) für Einstärke (Fern-/Lesebrille), Gleitsicht (Glasklasse), Blaufilter (mit/ohne) und Sonnenschutz (Filterkategorie, Polarisation). Eine gezeichnete Szene zeigt, welche Bereiche scharf, getönt oder gespiegelt sind; Vergleichstabelle hebt die gewählte Glasart hervor.
- **Sehtafel-Spiel:** Landolt-Ringe, Richtung per Pfeiltasten oder Knöpfen, elf Stufen. Deutlich als Spielerei gekennzeichnet (kein Sehtest), Termin-CTA.
- Horizontale Strecke „Ihr Weg zur Brille“ (Desktop gepinnt, Handy als Liste), Audiogramm-Grafik, Öffnungsstatus nach Bonner Ortszeit, Anfahrt-Umschalter (zu Fuß, Bus & Bahn, Auto), Terminformular nur clientseitig (Validierung, Zusammenfassung, „Demo – es wurde nichts gesendet“).

## Anpassen
- **Name, Telefon, E-Mail, Adresse:** in `index.html` (Header, Menü, Hero, Anfahrt, Termin, Footer, JSON-LD), `impressum.html`, `datenschutz.html`. Telefonnummer im Format `tel:+492285558210`.
- **Farben:** CSS-Variablen in `style.css` unter `:root` (`--white`, `--ink`, `--cobalt`, `--mist` und abgeleitete Töne). Brillenfarben der Anprobe in `main.js` (`COLORS`), Schildpatt-Muster und Titan-Verlauf im SVG-Block oben in `index.html`.
- **Demo-Werte:** ganz oben in `main.js` – `GLASS` (Gleitsicht-Preise, Tönung je Filterkategorie), `TRYON` (Maßstab, Glasbreiten, Passform-Toleranz), `BOOKING` (angezeigte Tage, Zeitraster, Anteil belegter Zeiten), `HOURS` (Öffnungszeiten für „Jetzt geöffnet“), `EYEGAME` (Stufen, Ringgröße). Fassungen und Gesichtsformen in `MODELS` und `FACES`.
- **Bilder:** `assets/img/<name>-960.webp` und `-480.webp` ersetzen (gleiche Namen) und Alt-Texte in `index.html` anpassen. Herkunft siehe `assets/img/BILDNACHWEIS.md`.

## Lokal starten
```
cd /home/user/Websites
python3 -m http.server 8940
```
Dann http://127.0.0.1:8940/arena/optik-klarsicht/ öffnen. `?motion=off` schaltet Animationen ab; `prefers-reduced-motion` wird respektiert.

## Technik
GSAP 3.13 + ScrollTrigger und Lenis liegen unter `assets/vendor/`. Schrift Onest (Variable Font, nur `latin`) selbst gehostet unter `assets/fonts/`, Lizenz dabei. Keine externen Anfragen, keine Cookies.
