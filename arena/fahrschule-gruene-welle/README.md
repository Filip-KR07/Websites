# Fahrschule Grüne Welle – Modell „Spur“

Demo-Website eines **fiktiven** Betriebs (Fahrschule in Essen-Rüttenscheid) für die Arena von Filip Kramar.
Statisch, ohne Build-Schritt: `index.html`, `style.css`, `main.js`, dazu `impressum.html` und `datenschutz.html`.
Alle Namen, Preise, Termine und Bewertungen sind erfunden.

## Gestaltungsidee

Die Seite ist ein Verkehrsübungsplatz von oben: Asphalt, Fahrbahnmarkierung, Schilder, Ampelphasen. Die Headline ist wie Bodenmarkierung gesetzt – in Fahrtrichtung gestreckt, mit Farbabrieb (`assets/paint.svg`) – und steht an einer echten Kreuzung, deren Verkehr nach dem Ampel-Intro im 12-Sekunden-Umlauf fährt. Statt Kapitel-Labels klappen echte Verkehrszeichen um, Vertrauenszahlen und Fuhrpark liegen als markierte Parkbuchten auf dem Asphalt, die Bewertung ist ein Tempo-Schild mit Zusatzzeichen. Bewegungs-Handschrift „Stop-and-go“: Dinge fahren an (`--ease-go`), bremsen weich (`--ease-out`), stehen in Kolonne versetzt wie an der Ampel (`--stagger`), Schilder schwingen nach (`--ease-swing`).

## Abschnitte

1. **Hero „Kreuzung“** – Top-down-Kreuzung (HTML/CSS/SVG, ohne Canvas). Die Ampel schaltet beim Laden Rot → Rot-Gelb → Grün, dann fahren Headline und Verkehr los; Signalgeber und Autos laufen synchron als CSS-Animation (nur `translate`/`opacity`, pausiert außerhalb des Viewports). Klick auf die Ampel wiederholt das Intro. Die gelbe Umleitungstafel „Nächster Intensivkurs“ kommt live aus dem Kurskalender, die Parkbuchten tragen Bewertung, Bestehensquote und Team.
2. **Wegweiser** – gelbe Richtungsschilder als Schnellzugriff.
3. **Sechs Etappen** – Ablauf der Ausbildung; ab 900 px als horizontale Strecke (hohe Sektion + `position: sticky`, Bewegung per ScrollTrigger-Scrub) mit fahrendem Auto.
4. **Führerscheinklassen-Explorer** – Tabs B, BE, A, A2, AM mit SVG-Fahrzeugen, Mindestalter als Verkehrszeichen, Theorie/Sonderfahrten/Prüfungen.
5. **Kostenrechner** – Klasse, Vorerfahrung, Fahrstunden-Regler, Nebenkosten → Beispielrechnung; Summe als **Tacho** (Nadel mit Feder-Nachschwingen, farbige Bögen je Kostenblock, Skalenende `TACHO_MAX`).
6. **Theorie-Quiz** – 8 Fragen mit SVG-Verkehrszeichen und Kreuzungsskizzen als **Schilder-Karussell** (3D-Drehkranz, dreht pro Frage um 45°, markiert richtig/falsch), Sofort-Feedback, Fehlerpunkte wie in der echten Prüfung.
7. **Kurskalender** – Monatsansicht mit Intensivkursen, freien Plätzen (Ampel-Logik) und Dialog „Platz anfragen“.
8. **Team** – Fahrlehrkräfte als Kfz-Kennzeichen-Karten.
9. **Stimmen**, **Standort & Abholgebiet** (eigene SVG-Karte), **FAQ**, **Anmeldung** (Formular mit Altershinweis), Footer.

Durch die ganze Seite läuft eine **Fahrbahnlinie** (SVG-Pfad), die beim Scrollen gezeichnet wird; das Fahrschulauto (Draufsicht) fährt an der Spitze mit. An jedem Kapitel **klappt ein Verkehrszeichen** beim Hineinscrollen von der Rückseite auf die Vorderseite. Navigation mit Fallblatt-Hover, magnetische Buttons (nur feiner Zeiger).

## Anpassen

- **Name, Adresse, Telefon, E-Mail:** in `index.html` (Header, Kontakt, Footer, JSON-LD im `<head>`) sowie in `impressum.html` / `datenschutz.html` suchen und ersetzen (`0201 555 28 70`, `+492015552870`, `start@gruene-welle-fahrschule.de`, `Rüttenscheider Straße 160`).
- **Farben:** CSS-Variablen ganz oben in `style.css` (`--green`, `--asphalt`, `--yellow`, `--mint` …). `--green-ink` ist die dunklere Textvariante für ausreichenden Kontrast.
- **Schriften:** `assets/fonts/` (Unbounded, DM Sans – selbst gehostet, OFL-Lizenz liegt bei).
- **Verkehr im Hero:** Lage der Kreuzung über `--vx`, `--vw`, `--bh` in `.hero` (style.css), Umlaufdauer `--cycle`.
- **Preise im Rechner:** Konstante `PREISE` oben in `main.js` (Grundbetrag, Fahrstunde, Sonderfahrten, Prüfungen, typische Stundenzahl, Nebenkosten). `SPANNE` steuert den grünen Bereich am Regler.
- **Kurstermine:** Konstanten `KURSE`, `KURS_REFERENZ_MONTAG`, `KURS_MONATE` und `THEORIE_WOCHENTAGE` in `main.js`. Termine werden ab dem aktuellen Monat nach Regeln erzeugt, die Plätze sind Demo-Zufallswerte.
- **Quizfragen:** direkt im HTML (`#quiz`, je Frage ein `<li class="q" data-points="…">`; richtige Antwort mit `data-correct`, Erklärung im `<details>`).
- **Mindestalter-Hinweis im Formular:** Konstante `MINDESTALTER` in `main.js`.
- **Bilder:** `assets/img/<name>-960.webp` und `-480.webp` austauschen (gleiche Dateinamen) – Herkunft siehe `assets/img/BILDNACHWEIS.md`.

## Technik

- GSAP 3.13 + ScrollTrigger + Lenis lokal unter `assets/vendor/`. Keine externen Requests, keine Cookies.
- Ohne JavaScript und bei `prefers-reduced-motion` bleibt alles sichtbar und bedienbar; `?motion=off` schaltet Animationen ab.
- Alle Pfade sind absolut mit Präfix `/arena/fahrschule-gruene-welle/`.

## Lokal starten

```bash
cd /home/user/Websites
python3 -m http.server 8000
# http://127.0.0.1:8000/arena/fahrschule-gruene-welle/
```
