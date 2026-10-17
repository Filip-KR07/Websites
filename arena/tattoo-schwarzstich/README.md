# Schwarzstich Tattoo – Modell „Tinte“

Demo-Website für ein **fiktives** Tattoo-Studio in Kiel (Blackwork, Fine Line, Neo-Traditional, Dotwork). Teil der „Arena“ von Filip Kramar. Statisch, ohne Build, ohne externe Requests.

## Gestaltungsidee
Zwei Werkzeuge bestimmen jede Entscheidung: die Tinte, die sich im Wasser unkontrolliert ausbreitet, und die Nadel, die sie Stich für Stich kontrolliert in die Haut bringt. Die Seite beginnt deshalb als „Bogen Nº 1“ auf Knochenpapier: Ein Flash-Dolch wird mit der Nadel gezogen, aus seiner Klingenspitze läuft Tinte ins Wasser (WebGL), und beim Weiterscrollen flutet sie das ganze Blatt – das Studio-Kapitel ist dann schwarz wie das Tintenglas. Bewegung hat zwei Tempi: harte, gestufte Schritte für alles, was „gestochen“ wird (Name, Dolch, Manifest-Text, Flash-Motive, Körperstellen), und lange, weiche Ausläufe für alles, was „läuft“ (Tinte, Kapitelwechsel). Rot erscheint nur dort, wo gerade die Nadel ist – oder als Stempel.

## Abschnitte
Hero „Bogen Nº 1“ (WebGL-Tinte, gezeichneter Dolch mit Banner, Bewertungsstempel) · Manifest, das sich Zeichen für Zeichen sticht · Stile mit klebender Körperkarte (Platzierungen pro Stil) · Portfolio mit Filter und Lightbox · Artists (Monogramme statt Fotos, Gastspots) · Flash-Day-Bogen · Anfrage-Assistent · Pflege-Zeitleiste · Ablauf & Hygiene · Kundenstimmen · Anfahrt (eigene SVG-Karte, Öffnungsstatus) · FAQ · Kontakt · Footer.

## Spezial-Features
- **Tinten-Reveal:** Überschriften und Bilder erscheinen über eine Sprite-Maske (`assets/img/ink-wipe.webp`, `ink-blot.webp`, je 24 Frames), als würde Tinte ins Papier ziehen. Im Portfolio zieht beim Hover die Farbe per Tintenmaske ins Schwarz-Weiß-Bild (auf Touch-Geräten, sobald das Bild die Bildschirmmitte passiert).
- **Portfolio:** Filter nach Artist und Stil (FLIP-Animation), leere Kombinationen mit Hinweis, Lightbox mit Pfeiltasten, Escape und „Ähnliches anfragen“ (füllt Stil und Artist im Assistenten vor).
- **Anfrage-Assistent:** Körper-Silhouette vorne/hinten (SVG, Tastatur: Pfeiltasten), Größenregler mit maßstäblicher Vorschau auf der Silhouette, grobe Sitzungsdauer, Stil & Artist, Idee, Kontakt; Erfolgsansicht mit Zusammenfassung („Demo – es wurde nichts gesendet“). Ohne JS bleibt alles als normales Formular mit Auswahlliste nutzbar.
- **Flash-Day-Bogen:** 9 Motive (eigene SVG-Zeichnungen), Reservierung im Dialog mit Uhrzeit, Stempel-Animation, Zähler freier Motive (nur im Browserfenster).
- **Pflege:** Tag-für-Tag-Zeitleiste, ab 900 px als klebende horizontale Strecke (`position: sticky`, kein Pin) mit Tageszähler; daneben ein Stück Haut, das „heilt“ (Folie, Rötung, Schuppen, Silberhaut). Regler „Tage seit dem Stechen“ markiert die passende Phase; auf dem Handy klebt die Haut neben der Liste.
- **Hero-Tinte:** eigener WebGL-Shader (Domain-Warping), halbe Auflösung, DPR ≤ 2, volle Bildrate nur im Einlauf, beim Rühren mit dem Mauszeiger und beim Scrollen, sonst 15 fps; pausiert außerhalb des Viewports. Werte in `INK` oben im Hero-Modul von `main.js`. Ohne WebGL/JS: statische Tinte per CSS-Verlauf.
- **Flash-Wand:** Motive werden beim Erscheinen gestochen; mit Maus zeigt eine Lupe das Motiv 2,4-fach (`ZOOM` in `main.js`).
- **Stile:** Die Körperkarte klebt beim Scrollen, jede Stil-Zeile setzt ihre typischen Stellen (rot) und ein Referenzbild darauf; Stellen pro Stil in `index.html` (`.bm-spot`).

## Anpassen
- **Name, Telefon, Adresse:** in `index.html` (Header, Kontakt, Footer, JSON-LD), `impressum.html`, `datenschutz.html` suchen/ersetzen (`0431 555 91 20`, `+494315559120`, `ink@schwarzstich.de`, `Holtenauer Straße 77`).
- **Farben:** CSS-Variablen in `style.css` unter `:root` (`--black`, `--bone`, `--red`, `--smoke`, dazu `--red-hi`/`--red-text` für Kontrast auf Schwarz).
- **Schriften:** `assets/fonts/` (Grenze Gotisch, Syne – selbst gehostet, Lizenzen liegen bei).
- **Bilder:** `assets/img/<name>-960.webp` und `-480.webp` ersetzen (gleiche Namen) oder in `index.html` die Pfade ändern. Redaktionelle Fotos sind als Duoton Schwarz/Knochen umgefärbt, Portfolio-Bilder bleiben farbig (Graustufen per CSS).
- **Rechner-Werte:** oben in `main.js` – `SESSION` (Vorbereitungszeit, Minuten pro cm² je Stil, max. Sitzungslänge) und `ZONES` (Empfindlichkeit, Zeitfaktor, Maximalgröße je Körperstelle).
- **Flash-Motive:** SVG-Symbole `fl-…` im Sprite am Anfang von `index.html`; Karten im Abschnitt `#flash` (Daten in `data-*`-Attributen).

## Lokal starten
```bash
cd /home/user/Websites && python3 -m http.server 8840
# http://127.0.0.1:8840/arena/tattoo-schwarzstich/
```
`?motion=off` schaltet alle Animationen ab; `prefers-reduced-motion` wird respektiert.

## Hinweise
- Fiktiver Betrieb, `noindex`. Impressum/Datenschutz sind Muster – vor dem Livegang ersetzen (keine Rechtsberatung).
- Bildnachweis: `assets/img/BILDNACHWEIS.md` (StockSnap, CC0).
