# Fahrschule Grüne Welle – Modell „Spur“

Demo-Website eines **fiktiven** Betriebs (Fahrschule in Essen-Rüttenscheid) für die Arena von Filip Kramar.
Statisch, ohne Build-Schritt: `index.html`, `style.css`, `main.js`, dazu `impressum.html` und `datenschutz.html`.
Alle Namen, Preise, Termine und Bewertungen sind erfunden.

## Abschnitte

1. **Hero mit Ampel** – Ampel schaltet beim Laden Rot → Rot-Gelb → Grün, die Headline „fährt los“ (Klick auf die Ampel wiederholt das). Karte „Nächster Intensivkurs“ kommt live aus dem Kurskalender.
2. **Wegweiser** – gelbe Richtungsschilder als Schnellzugriff.
3. **Sechs Etappen** – Ablauf der Ausbildung; ab 900 px als horizontale, gepinnte Strecke mit fahrendem Auto.
4. **Führerscheinklassen-Explorer** – Tabs B, BE, A, A2, AM mit SVG-Fahrzeugen, Mindestalter als Verkehrszeichen, Theorie/Sonderfahrten/Prüfungen.
5. **Kostenrechner** – Klasse, Vorerfahrung, Fahrstunden-Regler, Nebenkosten → Beispielrechnung mit Balken.
6. **Theorie-Quiz** – 8 Fragen mit SVG-Verkehrszeichen und Kreuzungsskizzen, Sofort-Feedback, Fehlerpunkte wie in der echten Prüfung.
7. **Kurskalender** – Monatsansicht mit Intensivkursen, freien Plätzen (Ampel-Logik) und Dialog „Platz anfragen“.
8. **Team** – Fahrlehrkräfte als Kfz-Kennzeichen-Karten.
9. **Stimmen**, **Standort & Abholgebiet** (eigene SVG-Karte), **FAQ**, **Anmeldung** (Formular mit Altershinweis), Footer.

Durch die ganze Seite läuft eine **Fahrbahnlinie** (SVG-Pfad), die beim Scrollen gezeichnet wird; ein kleines Auto fährt an der Spitze mit.

## Anpassen

- **Name, Adresse, Telefon, E-Mail:** in `index.html` (Header, Kontakt, Footer, JSON-LD im `<head>`) sowie in `impressum.html` / `datenschutz.html` suchen und ersetzen (`0201 555 28 70`, `+492015552870`, `start@gruene-welle-fahrschule.de`, `Rüttenscheider Straße 160`).
- **Farben:** CSS-Variablen ganz oben in `style.css` (`--green`, `--asphalt`, `--yellow`, `--mint` …). `--green-ink` ist die dunklere Textvariante für ausreichenden Kontrast.
- **Schriften:** `assets/fonts/` (Unbounded, DM Sans – selbst gehostet, OFL-Lizenz liegt bei).
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
