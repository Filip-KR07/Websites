# Klarsicht Optik & Akustik – Demo-Website (Modell „Fokus“)

Fiktiver Beispielbetrieb für die Arena von Filip Kramar: ein Augenoptik- und Hörakustik-Fachgeschäft in der Poststraße 9 in Bonn (Augenoptikermeister Niklas Brandt, Hörakustikerin Svea Lund, sechs Mitarbeitende). Statische Seite ohne Build-Schritt, alle Inhalte auf Deutsch, `noindex`.

Designsprache: minimal, skandinavisch, präzise. Weiß, Fast-Schwarz, Kobalt (#2443FF) als einziger Akzent, Hellgrau. Eine Schrift (Onest) in allen Rollen, Sehtafel-Typografie mit kleiner werdenden Zeilen, Schärfe/Unschärfe als durchgehendes Motiv.

## Gestaltungsidee
Die ganze Seite ist eine Sehtafel, die man durch eine Linse liest. Schrift wird wie beim Sehtest in Zeilen gesetzt, die nach unten kleiner werden – im Hero, in der Leistungsliste, im Zitat des Inhabers und im Schriftzug der Fußzeile. Schärfe ist das Bewegungsmotiv: Dinge kommen aus der Unschärfe statt von unten, große Zeilen werden zuerst scharf, und überall, wo man genauer hinsieht, liegt eine Linse (WebGL im Hero, Vorschau-Linse in der Leistungsliste, Brechungs-Übergang im Glas-Explorer, Okular in der Werkstatt-Strecke). Die Bewegungs-Handschrift ist die eines Fokusrings: schnell an, weich aus (`--ease-focus`), die Anzeige rastet in Viertel-Dioptrien. Kobalt bleibt der einzige Akzent, der Landolt-Ring wird zum Siegel.

## Abschnitte
Fokus-Hero (Sehtafel-Headline, freigestellte Brille, WebGL-Linse, Siegel) · Sehtafel-Laufband · Leistungen als Sehtafel-Index (fünf Zeilen inkl. Werkstatt) · Statement als Wort-Sehtafel · Gesichtsform-Finder · Brillen-Anprobe · Glas-Explorer mit Vergleichstabelle · Ihr Weg zur Brille (Fokus-Zoom-Strecke im dunklen Raum) · Sehtafel-Spiel · Hörakustik · Über uns, Team, Ausbildung · Stimmen mit Siegel · Anfahrt mit SVG-Lageplan und Einzugsgebiet · Fragen · Terminanfrage · Footer. Dazu `impressum.html` und `datenschutz.html` (Muster).

## Spezial-Features
- **Fokus-Hero (WebGL):** Headline-Zeilen und die freigestellte Brille werden einmal in eine Textur gezeichnet; ein eigener Shader (ohne Bibliothek) stellt sie wie eine Sehtafel von oben nach unten scharf und bricht das Bild in einer Linse (Vergrößerung, Farbsaum, Lichtkante, Schatten). Die Linse folgt der Maus mit Feder, auf Touch wandert sie und folgt dem Finger. Dioptrien-Anzeige läuft in 0,25-Schritten gegen ±0,00. Ohne Interaktion nach gut zwei Sekunden scharf; Scrollen und Bewegen beschleunigen. Ruht die Linse, wird die Leinwand ausgeblendet und das scharfe DOM übernimmt (kein Dauer-Rendering). Zeitwerte in `main.js` (`FOCUS`). Ohne WebGL, bei reduzierter Bewegung: CSS stellt sanft scharf; `?motion=off`/ohne JS: sofort scharf.
- **Leistungen als Sehtafel-Index:** Zeilen werden nach unten kleiner; auf dem Desktop folgt eine runde Vorschau-Linse dem Zeiger (Feder), auf dem Handy kleine Bildstreifen.
- **Gesichtsform-Finder:** vier Fragen (Pfeiltasten, Weiter/Zurück) → Gesichtsform als Orientierung, gezeichnete Silhouette mit Favoriten-Brille, drei passende Fassungsformen als SVG, Übergabe an die Anprobe.
- **Brillen-Anprobe:** SVG-Silhouette in fünf Gesichtsformen (Formüberblendung), sechs Fassungen mit flüssigem Morph (64 Punkte je Glas, Breite und Randstärke gleiten mit leichtem Nachschwingen), fünf Farben, Glasbreite 46–56 mm mit Maßlinie, Passform-Hinweis, Sonnenbrillen-Schalter; Auswahl lässt sich in die Terminanfrage übernehmen.
- **Glas-Explorer:** Tabs (Pfeiltasten) für Einstärke, Gleitsicht, Blaufilter, Sonnenschutz. Beim Wechsel fährt eine Linse (SVG-Verschiebungskarte, `feDisplacementMap`) durch die Szene und bricht sie; in ihrer Mitte wechselt die Glasart. Vergleichstabelle hebt die gewählte Glasart hervor.
- **Weg zur Brille als Fokus-Zoom-Strecke:** Ab 900 px klebt die Bühne (`position: sticky`, kein Pin); jede Station kommt aus der Unschärfe ins runde Okular und zoomt wieder hinaus, darunter läuft eine Skala mit den Stationen. Der dunkle Raum öffnet sich beim Hereinscrollen kreisförmig (Blende). Handy: Liste, Bilder stellen sich beim Scrollen scharf.
- **Sehtafel-Spiel:** Landolt-Ringe, Richtung per Pfeiltasten oder Knöpfen, elf Stufen. Deutlich als Spielerei gekennzeichnet (kein Sehtest), Termin-CTA.
- Weitere Details: Sehtafel-Laufband reagiert auf Scroll-Tempo (Geschwindigkeit + Bewegungsunschärfe), Siegel als Landolt-Ring dreht sich mit dem Scroll (CSS Scroll-driven Animation mit Fallback), Statement-Worte stellen sich scharf, Skizze in der Anprobe zeichnet sich, Zeitleiste „Über uns“, Bilder öffnen sich wie eine Blende, magnetische Buttons und Zeichen-Rollen (nur feiner Zeiger), Audiogramm-Grafik, Öffnungsstatus nach Bonner Ortszeit, Anfahrt-Umschalter, Terminformular nur clientseitig („Demo – es wurde nichts gesendet“).

## Anpassen
- **Name, Telefon, E-Mail, Adresse:** in `index.html` (Header, Menü, Hero, Anfahrt, Termin, Footer, JSON-LD), `impressum.html`, `datenschutz.html`. Telefonnummer im Format `tel:+492285558210`.
- **Farben:** CSS-Variablen in `style.css` unter `:root` (`--white`, `--ink`, `--cobalt`, `--mist` und abgeleitete Töne). Brillenfarben der Anprobe in `main.js` (`COLORS`), Schildpatt-Muster und Titan-Verlauf im SVG-Block oben in `index.html`.
- **Demo-Werte:** ganz oben in `main.js` (Hero-Zeitwerte in `FOCUS` direkt über dem Fokus-Hero) – `GLASS` (Gleitsicht-Preise, Tönung je Filterkategorie), `TRYON` (Maßstab, Glasbreiten, Passform-Toleranz), `BOOKING` (angezeigte Tage, Zeitraster, Anteil belegter Zeiten), `HOURS` (Öffnungszeiten für „Jetzt geöffnet“), `EYEGAME` (Stufen, Ringgröße). Fassungen und Gesichtsformen in `MODELS` und `FACES`.
- **Bilder:** `assets/img/<name>-960.webp` und `-480.webp` ersetzen (gleiche Namen) und Alt-Texte in `index.html` anpassen. `hero-glas` ist ein Freisteller (transparentes WebP) von `hero`; er wird im Hero auch in die WebGL-Textur gezeichnet. Herkunft siehe `assets/img/BILDNACHWEIS.md`.

## Lokal starten
```
cd /home/user/Websites
python3 -m http.server 8921
```
Dann http://127.0.0.1:8921/arena/optik-klarsicht/ öffnen. `?motion=off` schaltet Animationen ab; `prefers-reduced-motion` wird respektiert.

## Technik
GSAP 3.13 + ScrollTrigger und Lenis liegen unter `assets/vendor/`. Schrift Onest (Variable Font, nur `latin`) selbst gehostet unter `assets/fonts/`, Lizenz dabei. Keine externen Anfragen, keine Cookies.
