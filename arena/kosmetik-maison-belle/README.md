# Maison Belle – Kosmetik & Skin Studio · Demo „Seide“

Demo-Website für ein **fiktives** Kosmetikstudio an der Königsallee 74 in Düsseldorf (Inhaberin Sophie Marchand, vier Kosmetikerinnen). Teil der „Arena“ von Filip Kramar. Alle Namen, Preise, Bewertungen und Termine sind erfunden, die Seite steht auf `noindex`.

## Gestaltungsidee
„Seide und Licht“: Die Seite ist eine einzige Bahn Seide, die durch einen Tag im Studio fällt. Oben liegt sie als echte, beleuchtete Stoffbahn (eigener WebGL-Shader mit Falten, Glanz und Schatten) quer über dem Porträt und der riesigen Zeile „Haut.“; später läuft sie als Seidenband mit eingewebter Schrift durch die Seite und schließt sie über dem Footer ab. Das Licht wandert mit: Morgen in Puder, Mittag in Champagner, Nachmittag in Nude, Abend in Pflaume – die ganze Seite wechselt zwischen den Kapiteln die Farbe, mit Dämmerung und Morgenröte als Übergang. Die Details kommen aus dem Atelier und der Kabine: Pflegeetikett statt Sternchenreihe, Beschnittmarken am Porträt, Bilder, die sich wie ein Tropfen Serum oder zurückgeschlagener Stoff öffnen, gestickte Monogramme, ein Beipackzettel für die Wirkstoffe und eine handgeschriebene Pflegekarte als Quiz-Ergebnis. Bewegungshandschrift: fließend und weich – Seide fällt, sie federt nicht.

## Abschnitte
Hero („Erst lesen wir Ihre Haut.“, Seidenbahn-Shader, Porträt mit Beschnittmarken, Pflegeetikett) · Seidenband · I Haltung (Zwanzig Minuten – gezeichnete Schleife, Satz baut sich Wort für Wort auf, Randnotizen, Tiefenebenen) · II Le Rituel (erster Termin in vier Akten, Sticky-Szene mit Tropfen-/Stoffmasken) · III La Carte (Behandlungsindex mit Filtern und Bildvorschau) · IV Hautcheck (Vollbild-Quiz) · V Wirkstoffe (Tropfen + Beipackzettel) · VI Bon Cadeau (Gutschein-Konfigurator) · VII Studio & Team (Split mit Tiefenebenen, Monogramme) · VIII Stimmen (Abend, Siegel) · IX Anfahrt (SVG-Lageplan, Öffnungsstatus) · X FAQ · XI Rendez-vous (Terminanfrage) · Seidenband (Ausklang) · Footer. Dazu `impressum.html` und `datenschutz.html` (Muster).

## Spezial-Features
- **Seidenbahn (WebGL, ohne Bibliothek):** Eine Stoffbahn mit schräg laufendem Plissee, wandernder Welle, Verdrehung und weichem Schlagschatten; Streiflicht und Glanz folgen dem Mauszeiger gefedert, unter dem Zeiger hebt sich die Seide. Beim Laden rollt sie in ≤ 1,2 s von rechts auf (blockiert nichts, Text steht sofort), beim Scrollen hebt sie ab. Halbe Auflösung, DPR ≤ 2, im Ruhezustand halbe Bildrate, pausiert außerhalb des Viewports und in Hintergrund-Tabs; adaptive Qualität bis zum Standbild. Ohne WebGL zeigt ein SVG die Bahn, bei reduzierter Bewegung steht ein ruhiges Bild.
- **Hauttyp-Quiz (5 Fragen):** ruhige Vollbild-Schritte; die Raumfarbe folgt jeder Antwort. Antippen springt weiter, Tastatur mit „Weiter/Zurück“, Fortschritt als fünf Fäden und große römische Schrittziffer, Antwortspur. Ergebnis als Pflegekarte: Hauttyp, Behandlungsempfehlung mit Begründung, Wirkstoff-Tipp (springt in den Explorer), Routine für zu Hause und „Diese Behandlung anfragen“ (füllt das Terminformular vor). Ausnahmen (kein Retinol bei Schwangerschaft, erst Barriere bei sehr reaktiver Haut) stehen in `evaluateQuiz()`.
- **Behandlungskarte mit Filtern:** 16 Behandlungen als typografischer Index, Filter nach Bereich, Dauer und Preis (Slider), Filterleiste klebt beim Lesen oben. Weiche FLIP-Übergänge, Zähler mit `aria-live`, „Vormerken“ übernimmt die Behandlung ins Terminformular. Auf dem Desktop folgt eine Bildvorschau dem Zeiger (Feder, Schleier-Öffnung).
- **Gutschein-Konfigurator:** Wertgutschein (Beträge oder eigener Betrag) oder Behandlung, Für/Von, Nachricht, vier Kartenfarben mit Folienprägung, Zustellart. Live-Karte auf Seidenpapier mit 3D-Kippen und Glanzlicht per Maus, Rückseite per Button, mobil eine Live-Pille. Validierung, Erfolgsansicht mit Zusammenfassung – es wird nichts gesendet.
- **Wirkstoff-Explorer:** Hyaluron, Vitamin C, Retinol, Niacinamid als Tropfen auf einer Glasplatte (Tabs mit Pfeiltasten, magnetisch bei Maus). Linien zeigen gute Kombinationen (gestrichelt: besser zeitversetzt); der Beipackzettel nennt Wirkung, „Geeignet für“, Kombination, Hinweise und Orientierungs-Skalen.
- **Scroll-Szenen:** Sticky-Ritual mit Tropfen- und Stoffmasken (CSS `position: sticky`, kein Pin), Zeichen-für-Zeichen-Überschriften, Wort-für-Wort-Statement, gezeichnete SVG-Linien, Tiefen-Parallax der Hautnah-Bilder, Seidenband-Laufschrift, die mit dem Scroll läuft und bei schnellem Scrollen flattert, Kapitel-Farbwechsel mit Kolumnentitel am linken Rand.
- **Mikro-Interaktionen:** magnetische Buttons, rollende Zeichen in Navigation und Buttons, sich zeichnende Unterstreichungen, Press-Zustände, Öffnungsstatus „jetzt geöffnet“ (Zeitzone Berlin), Lageplan mit hervorgehobenen Wegen, Wunschtag-Chips der nächsten Öffnungstage.

## Bewegungssystem
CSS-Variablen in `:root` (`style.css`): `--ease-out`, `--ease-in-out`, `--ease-drawer` (= `--ease-silk`), Dauern `--dur-press` (140 ms), `--dur-ui` (220 ms), `--dur-thread` (Zeichen, 1 s), `--dur-veil` (Masken, 1,3 s), Stagger `--stagger-char` und `--stagger-item`. UI-Rückmeldungen bleiben unter 300 ms, nur Szenen sind langsam. `?motion=off` schaltet alles ab, `prefers-reduced-motion` behält nur sanfte Überblendungen.

## Anpassen
- **Name, Telefon, Adresse, Zeiten:** direkt in `index.html` (Header, Hero, Pflegeetikett, Anfahrt, Termin, Seidenband, Footer, JSON-LD im `<head>`), `impressum.html`, `datenschutz.html`.
- **Farben, Kapitel-Töne, Schriften:** CSS-Variablen in `:root` oben in `style.css` (`--puder`, `--nude`, `--pflaume`, `--champagner`, `--rose-deep`, `--tone-*` …). Welcher Abschnitt welchen Ton trägt, steht als `data-tone` am Abschnitt. Seidenfarben im Shader in `main.js` (`initSilk`, `cDeep`/`cMid`/`cHi`), Lage der Bahn in `SILK` oben in `main.js`.
- **Behandlungen & Preise:** Zeilen in `index.html` (`.treat` mit `data-cat`, `data-min`, `data-price`, Vorschaubild `data-img`) – Karte, Quiz-Empfehlung und Formular lesen sie von dort. Gutschein-Behandlungen im `<select id="g-treat">` (`data-price`).
- **Werte im JS (oben in `main.js`):** `GIFT` (Betragsgrenzen, Gültigkeit, Versand), `HOURS` (Öffnungszeiten), `BOOKING_DAYS`/`BOOKING_LEAD_DAYS`, `DURATION` (Dauer-Filter), `QUIZ` (Empfehlungen, Begründungen, Pflegetipps), `SILK` (Seidenbahn), `TONE_HEX` (Kopfzeilenfarbe je Kapitel), `MAP_VIEWBOX` (Kartenausschnitt auf dem Handy).
- **Bilder:** `assets/img/<name>-960.webp` und `-480.webp` ersetzen (gleiche Namen) oder Pfade/`srcset` im HTML anpassen. Alle Fotos tragen eine einheitliche warme Tönung; Fotos werden nie breiter als 960 CSS-px dargestellt.

## Lokal starten
```
cd /home/user/Websites && python3 -m http.server 8903
```
Dann http://127.0.0.1:8903/arena/kosmetik-maison-belle/ öffnen. `?motion=off` schaltet alle Animationen ab.

## Technik & Hinweise
Statisch, ohne Build. GSAP 3 + ScrollTrigger und Lenis liegen unter `assets/vendor/`, Schriften (nur `latin`, SIL OFL, Lizenzen daneben) unter `assets/fonts/`. Keine externen Requests, keine Cookies, kein Tracking. Start in Etappen (Hero sofort, Rest in Häppchen ≤ 30 ms). Ohne JavaScript und bei `prefers-reduced-motion` bleibt alles sichtbar und bedienbar (Quiz ohne JS: alle Fragen sichtbar plus Telefon-Hinweis).

Bildquellen: siehe `assets/img/BILDNACHWEIS.md` (StockSnap, CC0).
