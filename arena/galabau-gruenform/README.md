# Grünform Garten- & Landschaftsbau – Demo-Website (Modell „Wurzel“)

Fiktiver Beispielbetrieb für die Arena von Filip Kramar: ein GaLaBau-Meisterbetrieb mit 15 Mitarbeitenden in Kassel. Statische Seite ohne Build-Schritt, alle Inhalte auf Deutsch, `noindex`.

## Gestaltungsidee
Ein Landschaftsgärtner denkt in zwei Ansichten: im **Schnitt** (was über und was unter der Erde passiert) und in der **Draufsicht** (der Plan). Die Seite wechselt zwischen genau diesen beiden Blicken: Der Hero ist ein Schnitt durch einen Garten – die Überschrift steht auf der Geländelinie, das „g“ von „schlagen“ reicht ins Erdreich, darüber wachsen generative Pflanzen (L-System als SVG), darunter Wurzeln, die beim Scrollen tiefer treiben. Gartenplaner, Vorher/Nachher und Karte sind Draufsichten mit Schriftfeld, Maßstab und Nordpfeil; Bodenschnitt und Musterkiste zeigen das Material. Die Bewegungs-Handschrift heißt „Wuchs“: Nichts fliegt ein, alles wächst von einer Linie aus – langsam im Aufbau (`--t-grow`), schnell in der Antwort auf Eingaben (`--t-press`, `--t-ui`). Die Jahreszeit färbt die ganze Seite um und läuft als Farbwelle vom angeklickten Schalter aus über den Bildschirm.

## Abschnitte
Hero als Gartenschnitt (generativer Garten, Sonnenbahn, Jahreszeiten, Stecketikett mit Bewertung) · Bodenprobe (Zahlen als Satz mit Zählwerk) · 01 Leistungen mit Musterkiste · 02 Gartenplaner · 03 Pflasteraufbau (Bodenschnitt) · 04 Projekte (Vorher/Nachher + Projektstrecke) · 05 Pflanzen-Explorer · 06 Gartenjahr (Pflegetipps + Pflegeverträge) · 07 Über uns (Ablauf als Wuchsreihe, Team als Stecketiketten an einer Pflanzschnur) · 08 Kundenstimmen · 09 Einzugsgebiet (SVG-Karte) · 10 Karriere · 11 FAQ · 12 Kontakt/Anfrage · Footer. Dazu `impressum.html` und `datenschutz.html` (Muster).

## Spezial-Features
- **Jahreszeiten-Umschalter** (Hero und Gartenjahr, synchron): Frühling/Sommer/Herbst/Winter wechselt Seitenfarben, die Hero-Illustration (Laub, Blüten, Schnee, Eis, Sonnenstand, Partikel), den Pflegetipp im Hero, die Tipps im Gartenjahr und sogar die Darstellung im Planer. Start nach Kalendermonat, Auswahl wird lokal gemerkt.
- **Gartenplaner:** Raster 10 × 6 Felder à 2 × 2 m. Terrasse, Weg, Rasen, Beet, Teich, Baum per Klick, Ziehen (Maus) oder Tastatur setzen (Pfeiltasten, Enter/Leertaste, Entf, Ziffern 1–7, Strg+Z). Gleichartige Nachbarfelder verschmelzen optisch. Vorlagen, Rückgängig, grobe Kostenspanne als Beispielrechnung und Übernahme der Skizze (Mini-Plan + Text) ins Anfrageformular.
- **Bodenschichten-Schnitt:** SVG-Schnitt eines Pflasteraufbaus; beim Scrollen fallen die sechs Schichten nacheinander ein (ScrollTrigger), die Erklärung läuft daneben mit. Mobil bleibt die Grafik oben stehen, die Schritte scrollen darunter.
- **Vorher/Nachher-Regler:** zwei Draufsicht-Pläne (Bestand/Fertig), ziehen per Maus/Touch oder Tastatur (`role="slider"`, Pfeile, Bild auf/ab, Pos1/Ende).
- **Pflanzen-Explorer:** 20 Pflanzen mit Standort-Filter (Sonne/Halbschatten/Schatten) und Eigenschaften (pflegeleicht, insektenfreundlich, heimisch), Blühkalender, FLIP-Animation, Merkliste mit Übernahme in die Anfrage.
- **Generativer Garten im Hero:** Pflanzen (Stauden, Gräser, Dolden, Felsenbirne) werden bei jedem Seitenaufruf gleich aus einem festen Startwert gerechnet, wachsen per `stroke-dashoffset` aus der Geländelinie, reagieren als Wind auf Mauszeiger und Scroll-Tempo (Feder, läuft nur bei Bewegung) und tragen die Jahreszeit (Blüten, Herbstlaub, Schnee). Wurzeln wachsen mit dem Scrollen tiefer.
- **Set Pieces beim Scrollen:** Bodenprobe-Satz baut sich Wort für Wort auf, Zahlen laufen als Zählwerk; der Planer füllt sich beim ersten Sichtkontakt vom Haus aus Reihe für Reihe; Bodenschnitt Schicht für Schicht (sticky); Vorher/Nachher zieht sich mit einer Pinselkante auf; Ablauf wächst als Trieb, an jeder Station wächst eine Pflanze ein Stück weiter (Samen → Keimling → Jungpflanze → Strauch → Baum, SVG-Linien zeichnen sich); Ranke am rechten Rand zeigt den Lesefortschritt (Desktop).
- **Musterkiste:** fünf Materialien (Muschelkalk, Basalt, Granit, Lärche, Cortenstahl) als CSS-Texturen, kippen unter dem Zeiger, mobil als Wisch-Schiene.
- **Jahreszeiten-Welle:** Klick auf eine Jahreszeit startet eine View Transition, die die neue Farbwelt kreisförmig vom Schalter aus aufdeckt (Tastatur und reduzierte Bewegung: sofortiger Wechsel). Jahresrad im Gartenjahr, Sonnenbahn im Hero.
- Höhenlinien-Canvas im Hero (reagiert sanft auf die Maus), Projektstrecke horizontal (Desktop per `position: sticky`, mobil wischbar), Karte mit hervorhebbaren Orten, Anfrageformular nur clientseitig („Demo – es wurde nichts gesendet“).

## Anpassen
- **Name, Telefon, E-Mail, Adresse:** in `index.html` (Header, Menü, Hero, Kontakt, Footer, JSON-LD), `impressum.html`, `datenschutz.html`. Telefon-Links im Format `tel:+495615556390`.
- **Farben:** CSS-Variablen in `style.css` unter `:root` (`--moos`, `--stein`, `--erde`, `--licht`, `--bluete` …). Die Jahreszeiten-Paletten stehen direkt darunter unter `html[data-season="…"]`. Bewegungs-Tokens (`--t-grow`, `--t-season` …) und alle Neugestaltungs-Regeln stehen am Ende der Datei im Block „NEUGESTALTUNG“.
- **Hero-Garten:** Pflanzenarten und Namen der Beschriftung in `GARDEN_NAMES` und `initGarden()` in `main.js`; Startwert `rng(1709)` ändert die Komposition.
- **Planer-Werte:** Konstanten ganz oben in `main.js`: `GRID` (Rastergröße, m² pro Feld), `PRICES` (€/m² bzw. €/Stück, Min/Max), `BASE_FEE`, `ROUND_TO`, `PRESETS` (Vorlagen als Buchstaben-Raster). Die Preisangaben in der Werkzeugliste im HTML entsprechend mitziehen.
- **Pflegetipps:** Kurztipp im Hero in `SEASONS` (`main.js`), ausführliche Tipps in den vier `yr-panel`-Blöcken in `index.html`.
- **Bilder:** `assets/img/<name>-960.webp` und `-480.webp` ersetzen (gleiche Namen) und Alt-Texte anpassen. Herkunft siehe `assets/img/BILDNACHWEIS.md`. Für echte Vorher/Nachher-Fotos die beiden `<img>` im Block `.ba` gegen Fotos gleicher Perspektive tauschen (Seitenverhältnis 3:2).
- **Grafiken:** Hero-Szene, Bodenschnitt und Karte sind als SVG im HTML eingebettet; Pläne und Höhenlinien-Hintergründe liegen unter `assets/svg/`. Sie wurden einmalig generiert und können direkt bearbeitet werden.

## Lokal starten
```
cd /home/user/Websites
python3 -m http.server 8930
```
Dann http://127.0.0.1:8930/arena/galabau-gruenform/ öffnen. `?motion=off` schaltet Animationen ab; `prefers-reduced-motion` wird respektiert. Ohne JavaScript sind alle Inhalte sichtbar (Planer und Filter werden dann ausgeblendet bzw. statisch gezeigt).

## Technik
GSAP 3.13 + ScrollTrigger und Lenis liegen unter `assets/vendor/`. Schriften Literata und Hanken Grotesk selbst gehostet (`assets/fonts/`, Lizenzen dabei). Keine externen Anfragen, keine Cookies; Planer-Skizze und Jahreszeit werden nur im Local Storage des Browsers gemerkt.
