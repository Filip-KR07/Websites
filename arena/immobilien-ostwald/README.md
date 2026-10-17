# Ostwald Immobilien – Demo-Website (Modell „Adresse“)

Fiktiver Beispielbetrieb für die Arena von Filip Kramar: ein Maklerbüro mit acht Mitarbeitenden im Frankfurter Westend (Verkauf, Vermietung, Wertermittlung). Statische Seite ohne Build-Schritt, alle Texte auf Deutsch (Anrede „Sie“), `noindex`.

## Gestaltungsidee
Die Seite ist ein Haus. Der Einstieg ist eine Fassadenansicht im Stil einer Bauzeichnung (Höhenkoten, Maßketten, Achsen, Schriftfeld) mit neun Fenstern. Hinter jedem Fenster liegt eines der neun aktuellen Objekte, die Rollläden fahren nacheinander hoch und das mittlere Fenster öffnet sich beim Scrollen zum Raum. Jedes Kapitel ist ein Geschoss: Die Kopfzeile zeigt wie eine Aufzugsanzeige, wo man gerade ist, das Team steht auf einem Klingelschild aus Messing, der Kontakt beginnt mit der Hausnummer am Eingang und die Fußzeile trägt den Namen als Fassadenschrift. Die Bewegungs-Handschrift heißt „Reißbrett“: Linien ziehen wie ein Plotter, Fenster öffnen wie Rollläden, Zahlen rollen wie mechanische Zählwerke, alles ruhig und präzise.

## Abschnitte
Hero (Fassadenansicht, Schriftfeld mit Prüfstempel) · Übergang „Fenster öffnet sich“ · Objektverzeichnis (Liste mit Fenster-Vorschau / Karte) · Leistungen als Hausverzeichnis-Tafel · Immobilienbewertung mit Messinstrument · Verkaufsprozess auf Millimeterpapier · Finanzierungsrechner · Über uns (Haltungssatz mit Nacht-Vorhang, Text, Klingeltableau mit Stellenanzeige) · Kundenstimmen mit Siegel · Standort mit Straßenschilder-Laufband und Lageplan · Häufige Fragen · Kontakt (Hausnummernschild) · Footer. Dazu `impressum.html` und `datenschutz.html` (Muster).

## Spezial-Features
- **Fassade als Objekt-Navigation:** Neun Fenster = neun Objekte. Zeigen oder fokussieren aktualisiert das Schriftfeld (Geschoss, Achse, Objekt, Eckdaten), Klick/Tippen öffnet das Exposé. Die Raumfotos verschieben sich gegen den Mauszeiger und beim Scrollen wie beim Blick durch ein echtes Fenster. Das reservierte Objekt hat einen halb heruntergelassenen Rollladen.
- **Übergang „Fenster öffnet sich“:** Auf dem Desktop eine 250svh hohe Bühne mit `position: sticky`; Wandstücke schieben sich nur per `transform` zur Seite, Rahmen und Sprossen wandern mit, danach setzt sich die Überschrift Wort für Wort. Auf dem Handy ohne Kleben, der Ablauf folgt dem Scrollen.
- **Immobilienbewertung in 4 Schritten:** Objektart → Stadtteil → Fläche/Baujahr/Zustand/Ausstattung → Kontakt. Oben ein Messinstrument: Zeiger auf einer Messlatte (3.000–12.000 €/m²) und ein Zählwerk mit dem laufenden Richtwert. Ergebnis als Preisspanne (± 7 %) mit rollenden Ziffern, Frankfurt-Skala, Zusammenfassung und Methodik-Hinweis „unverbindliche Orientierung“.
- **Objektverzeichnis mit Filtern:** Kauf/Miete, Zimmer, Preis-Schieberegler, Leerzustand mit Suchauftrag. Desktop: rechts ein Fenster mit Sprossen, das das Objekt unter dem Zeiger zeigt (Rollladen-Wechsel). Umschaltbar auf eine **eigene SVG-Stadtteilkarte** mit Pins, Vorschau-Karte und synchronisierter Liste (Tabs mit Pfeiltasten).
- **Exposé-Dialog:** Galerie (Pfeile, Tastatur, Wischgeste, Vorschaubilder), automatisch erzeugte **Grundriss-Skizze (SVG)**, Eckdaten, Energieskala, „Besichtigung anfragen“ füllt das Kontaktformular vor.
- **Finanzierungsrechner:** Kaufpreis, Eigenkapital, Zins, Tilgung, Zinsbindung, Nebenkosten → Monatsrate (Zählwerk), Restschuld, Zinsen, Laufzeit und **Restschuld-Diagramm (SVG)** mit Tooltip. Als Beispielrechnung gekennzeichnet.
- **Verkaufsprozess als gepinnte Zeitleiste:** Desktop (≥ 900 × 620 px): Abschnitt mit `position: sticky` (keine GSAP-Pins), sechs Schritte wechseln beim Scrollen, daneben zeichnet sich ein Grundriss Strich für Strich (Wände → Türen → Möbel → Maße → Stempel). Handy: Liste, die Zeichnung läuft einmal ab.
- **Haltungssatz:** Wörter füllen sich beim Scrollen, danach steigt ein nachtblauer Vorhang (zwei deckungsgleiche Ebenen, nur `transform`) und das Kapitel wechselt die Farbe.
- Dazu: Etagenanzeige in der Kopfzeile (rollende Geschossnummer), Kopfzeile färbt sich über Nacht-Kapiteln um, Zeichen-Rollen in der Navigation und magnetische Buttons (nur feiner Zeiger), Straßenschilder-Laufband, das auf die Scroll-Geschwindigkeit reagiert, Hausverzeichnis mit Punktlinien und Bildvorschau am Zeiger, Initiale, Beschnittmarken, Papierkörnung, Messing-Klingelschild mit Schrauben und Sprechanlage, mobile Aktionsleiste (Anrufen / Immobilie bewerten).

## Motion-System
Kurven und Dauern als CSS-Variablen in `:root`: `--ease-out`, `--ease-in-out`, `--ease-drawer`, `--ease-plot` (Plotter-Strich), `--ease-needle` (Messzeiger), `--t-press`, `--t-ui`, `--t-blind`, `--t-line`, `--t-odo`, `--step`. Intro des Hero läuft komplett in CSS (Text nach < 0,4 s sichtbar, LCP wartet auf nichts). `?motion=off` und `prefers-reduced-motion` schalten Bewegungen ab (sanfte Fades), ohne JavaScript ist alles sichtbar.

## Anpassen
- **Name, Telefon, E-Mail, Adresse:** in `index.html` (Header, Menü, Schriftfeld im Hero, Kontakt, Hausnummernschild, Footer, JSON-LD), `impressum.html`, `datenschutz.html`. Telefon-Links im Format `tel:+49695559030`.
- **Farben & Schriften:** CSS-Variablen in `style.css` unter `:root` (`--night`, `--sand`, `--brass`, `--brass-ink`, `--wall`, `--paper`, `--plate` …). Schriften: Source Serif 4 und Manrope (`assets/fonts/`, Lizenzen dabei).
- **Fassade:** Fenster sind `<a class="win">` in `index.html` mit Position in Prozent (`--l`, `--t`, `--w`, `--h`), Reihenfolge beim Hochfahren (`--o`), Objekt-Nr. (`data-expose`) und Legendentext (`data-win`, `data-win-t`, `data-win-m`). Die Linien der Ansicht stehen als SVG-Pfade in `facade-lines` (Koordinaten 640 × 760, Grundlinie am unteren Rand; Fenster der Achsen A/B/C bei x = 153/320/487).
- **Bewertungs-Richtwerte:** Konstante `VALUATION` ganz oben in `main.js` (€/m² je Stadtteil, Faktoren für Objektart, Baujahr, Zustand, Größe, Zuschläge, Spanne, Rundung). Neue Stadtteile zusätzlich als Chip in `index.html` (Schritt 2) eintragen.
- **Finanzierung:** Konstante `FINANCE` in `main.js` (Grunderwerbsteuer, Notar/Grundbuch, Makler). Start- und Grenzwerte der Regler stehen direkt an den `<input type="range">` in `index.html`.
- **Objekte:** Zeilen in `index.html` (`data-id`, `data-mode`, `data-rooms`, `data-price` steuern die Filter), Exposé-Daten inkl. Fotos, Energieklasse und Grundriss in `OBJECTS` in `main.js`. Pins der Karte: `.map-pin` mit `left/top` in Prozent.
- **Bilder:** `assets/img/<name>-960.webp` und `-480.webp` ersetzen (gleiche Namen), Fenster-Zuschnitte `fenster-<name>.webp` (420×560) und `fenster-<name>-210.webp`. Alt-Texte in `index.html` bzw. `IMG` in `main.js` anpassen. Herkunft siehe `assets/img/BILDNACHWEIS.md`.

## Lokal starten
```
cd /home/user/Websites
python3 -m http.server 8911
```
Dann http://127.0.0.1:8911/arena/immobilien-ostwald/ öffnen. `?motion=off` schaltet Animationen ab; `prefers-reduced-motion` wird respektiert. Ohne JavaScript sind alle Inhalte sichtbar (Formularschritte untereinander, Prozess als Liste, Fenster offen).

## Technik
GSAP 3.13 + ScrollTrigger und Lenis liegen unter `assets/vendor/`. Keine externen Anfragen, keine Cookies, keine Karten-Embeds, kein Canvas/WebGL nötig (alles SVG, CSS und `transform`). Start in Etappen per `requestIdleCallback`. Formulare arbeiten nur clientseitig („Demo – es wurde nichts gesendet“).
