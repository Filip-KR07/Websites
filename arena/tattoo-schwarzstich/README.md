# Schwarzstich Tattoo – Modell „Tinte“

Demo-Website für ein **fiktives** Tattoo-Studio in Kiel (Blackwork, Fine Line, Neo-Traditional, Dotwork). Teil der „Arena“ von Filip Kramar. Statisch, ohne Build, ohne externe Requests.

## Abschnitte
Hero (Dotwork-Mandala auf Canvas, Bogenfoto, Flash-Day-Badge) · Laufband · Studio-Manifest mit Wort-Scrub und Kennzahlen · Stile (Liste mit Vorschaubild am Cursor) · Portfolio mit Filter und Lightbox · Artists (Monogramme statt Fotos, Gastspots) · Flash-Day-Bogen · Anfrage-Assistent · Pflege-Zeitleiste · Ablauf & Hygiene · Kundenstimmen · Anfahrt (eigene SVG-Karte, Öffnungsstatus) · FAQ · Kontakt · Footer.

## Spezial-Features
- **Tinten-Reveal:** Überschriften und Bilder erscheinen über eine Sprite-Maske (`assets/img/ink-wipe.webp`, `ink-blot.webp`, je 24 Frames), als würde Tinte ins Papier ziehen. Im Portfolio zieht beim Hover die Farbe per Tintenmaske ins Schwarz-Weiß-Bild (auf Touch-Geräten, sobald das Bild die Bildschirmmitte passiert).
- **Portfolio:** Filter nach Artist und Stil (FLIP-Animation), leere Kombinationen mit Hinweis, Lightbox mit Pfeiltasten, Escape und „Ähnliches anfragen“ (füllt Stil und Artist im Assistenten vor).
- **Anfrage-Assistent:** Körper-Silhouette vorne/hinten (SVG, Tastatur: Pfeiltasten), Größenregler mit maßstäblicher Vorschau auf der Silhouette, grobe Sitzungsdauer, Stil & Artist, Idee, Kontakt; Erfolgsansicht mit Zusammenfassung („Demo – es wurde nichts gesendet“). Ohne JS bleibt alles als normales Formular mit Auswahlliste nutzbar.
- **Flash-Day-Bogen:** 9 Motive (eigene SVG-Zeichnungen), Reservierung im Dialog mit Uhrzeit, Stempel-Animation, Zähler freier Motive (nur im Browserfenster).
- **Pflege:** Tag-für-Tag-Zeitleiste, ab 900 px als gepinnte horizontale Strecke mit Tageszähler; Regler „Tage seit dem Stechen“ markiert die passende Phase.

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
