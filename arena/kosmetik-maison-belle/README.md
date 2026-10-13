# Maison Belle – Kosmetik & Skin Studio · Demo „Seide“

Demo-Website für ein **fiktives** Kosmetikstudio an der Königsallee 74 in Düsseldorf (Inhaberin Sophie Marchand, vier Kosmetikerinnen). Teil der „Arena“ von Filip Kramar. Alle Namen, Preise, Bewertungen und Termine sind erfunden, die Seite steht auf `noindex`.

Designsprache: luxuriös, sinnlich, editorial – Puder `#F4E9E4`, Nude `#D9B8A8`, Pflaume `#3B1F2B`, Champagner `#E8D7B9`. Display-Schrift DM Serif Display (groß, eng, mit Kursiv-Akzenten), Text Jost (Variable Font, Versalien-Labels). Seidige Verläufe, weiche Lichtkegel, Fotos in Bogen-Masken; die Abschnitte sind als „Chapitres“ nummeriert.

## Abschnitte
Hero (Seidenwellen-Shader hinter Bogen-Bild, Laufband) · I Haltung (Statement mit Wort-für-Wort-Aufhellung, Kennzahlen) · II La Carte (Behandlungsmenü mit Filtern) · III Hautcheck (Quiz) · IV Wirkstoffe (Explorer) · V Le Rituel (erster Termin in vier Akten, gepinnte Querstrecke) · VI Gutschein-Konfigurator · VII Studio & Team (Monogramme) · VIII Stimmen (Karussell) · IX Anfahrt (SVG-Lageplan, Öffnungsstatus) · X FAQ · XI Terminanfrage · Footer. Dazu `impressum.html` und `datenschutz.html` (Muster).

## Spezial-Features
- **Seidenwellen-Shader (WebGL):** Ein Höhenfeld aus diagonal fallenden, langsam wandernden Falten wird mit Streiflicht, Satin-Glanz und Champagner-Schimmer beleuchtet; die Seide wölbt sich weich zum Mauszeiger (gefedert). Reduzierte Auflösung, DPR ≤ 2, pausiert außerhalb des Viewports und in Hintergrund-Tabs; bei reduzierter Bewegung ein ruhendes Standbild, ohne WebGL ein CSS-Verlauf.
- **Hauttyp-Quiz (5 Fragen):** Hautgefühl, Reaktivität, Wunsch, Pflegezeit, Hinweise (Schwangerschaft, ärztliche Präparate). Antippen springt automatisch weiter, Tastatur mit „Weiter/Zurück“. Ein Bogen-„Hautton“ und eine Antwortspur begleiten die Fragen. Ergebnis: Hauttyp, Behandlungsempfehlung mit Begründung, Wirkstoff-Tipp (springt in den Explorer), Routine für zu Hause und Button „Diese Behandlung anfragen“ (füllt das Terminformular vor). Ausnahmen (kein Retinol bei Schwangerschaft, erst Barriere bei sehr reaktiver Haut) sind in `evaluateQuiz()` dokumentiert.
- **Behandlungsmenü mit Filtern:** 16 Karten, Filter nach Bereich (Gesicht/Körper/Hände), Dauer und Preis (Slider). Weiche FLIP-Layout-Übergänge, Lichtkegel folgt der Maus, Zähler mit `aria-live`, „Vormerken“ übernimmt die Behandlung ins Terminformular.
- **Gutschein-Konfigurator:** Wertgutschein (Beträge oder eigener Betrag) oder Behandlung, Für/Von, Nachricht, vier Kartenfarben mit Folienprägung, Zustellart. Live-Vorschau der Karte mit 3D-Kippen und Glanzlicht per Maus (Feder/Lerp), Rückseite per Button. Validierung, Erfolgsansicht mit Zusammenfassung – es wird nichts gesendet.
- **Wirkstoff-Explorer:** Hyaluron, Vitamin C, Retinol, Niacinamid als schwebende, magnetische Kreise (Tabs mit Pfeiltasten). Verbindungslinien zeigen, was gut kombinierbar ist (gestrichelt: besser zeitversetzt); Panel mit Wirkung, „Geeignet für“, Kombination, Hinweisen und Orientierungs-Skalen.
- Dazu: gepinnte Querstrecke „Le Rituel“ (Desktop), Parallaxe und Clip-Reveals der Bogenbilder, zählende Kennzahlen, Öffnungsstatus „jetzt geöffnet“ (Zeitzone Berlin), Karte mit hervorgehobenen Wegen, Terminanfrage mit Wunschtag-Chips der nächsten Öffnungstage.

## Anpassen
- **Name, Telefon, Adresse, Zeiten:** direkt in `index.html` (Header, Hero, Anfahrt, Termin, Footer, JSON-LD im `<head>`), `impressum.html`, `datenschutz.html`.
- **Farben, Schriften, Abstände:** CSS-Variablen in `:root` oben in `style.css` (`--puder`, `--nude`, `--pflaume`, `--champagner`, `--rose-deep` …). Die Seidenfarben stehen im Shader in `main.js` (`initSilk`, `cDeep`/`cMid`/`cLight`/`cChamp`).
- **Behandlungen & Preise:** Karten in `index.html` (`.treat` mit `data-cat`, `data-min`, `data-price`) – Menü, Quiz-Empfehlung und Formular lesen sie von dort. Gutschein-Behandlungen im `<select id="g-treat">` (`data-price`).
- **Werte im JS (oben in `main.js`):** `GIFT` (Betragsgrenzen, Gültigkeit, Versand), `HOURS` (Öffnungszeiten), `BOOKING_DAYS`/`BOOKING_LEAD_DAYS`, `DURATION` (Dauer-Filter), `QUIZ` (Empfehlungen, Begründungstexte, Pflegetipps), `MAP_VIEWBOX` (Kartenausschnitt auf dem Handy).
- **Bilder:** `assets/img/<name>-960.webp` und `-480.webp` ersetzen (gleiche Namen) oder Pfade/`srcset` im HTML anpassen. Fotos werden nie breiter als 960 CSS-px dargestellt.

## Lokal starten
```
cd /home/user/Websites && python3 -m http.server 8900
```
Dann http://127.0.0.1:8900/arena/kosmetik-maison-belle/ öffnen. `?motion=off` schaltet alle Animationen ab.

## Technik & Hinweise
Statisch, ohne Build. GSAP 3 + ScrollTrigger und Lenis liegen unter `assets/vendor/`, Schriften (nur `latin`, SIL OFL, Lizenzen daneben) unter `assets/fonts/`. Keine externen Requests, keine Cookies, kein Tracking. Ohne JavaScript und bei `prefers-reduced-motion` bleibt alles sichtbar und bedienbar (Quiz ohne JS: alle Fragen sichtbar plus Telefon-Hinweis).

Bildquellen: siehe `assets/img/BILDNACHWEIS.md` (StockSnap, CC0).
