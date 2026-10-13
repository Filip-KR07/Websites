# Ostwald Immobilien – Demo-Website (Modell „Adresse“)

Fiktiver Beispielbetrieb für die Arena von Filip Kramar: ein Maklerbüro mit acht Mitarbeitenden im Frankfurter Westend (Verkauf, Vermietung, Wertermittlung). Statische Seite ohne Build-Schritt, alle Texte auf Deutsch (Anrede „Sie“), `noindex`.

## Abschnitte
Hero (Foto in „Bauzeichnung“ mit Maßketten, Exposé-Karte, Kennzahlen) · Leistungen · Aktuelle Objekte (Liste/Karte) · Immobilienbewertung · Verkaufsprozess · Finanzierungsrechner · Über uns & Team (mit Stellenanzeige) · Kundenstimmen · Standort & Einzugsgebiet · Häufige Fragen · Kontakt · Footer. Dazu `impressum.html` und `datenschutz.html` (Muster).

## Spezial-Features
- **Immobilienbewertung in 4 Schritten:** Objektart → Stadtteil → Fläche/Baujahr/Zustand/Ausstattung → Kontakt. Ergebnis als Preisspanne (± 7 %) mit Einordnung auf einer Frankfurt-Skala, Zusammenfassung und Methodik-Hinweis „unverbindliche Orientierung“.
- **Objektliste mit Filtern:** Kauf/Miete, Zimmer, Preis-Schieberegler (passt sich an Kauf/Miete an), animierte Ergebnisliste und Leerzustand mit Suchauftrag. Umschaltbar auf eine **eigene SVG-Stadtteilkarte** mit nummerierten Pins, Vorschau-Karte und synchronisierter Liste (Tabs mit Pfeiltasten).
- **Exposé-Dialog:** Galerie (Pfeile, Tastatur, Wischgeste, Vorschaubilder), automatisch erzeugte **Grundriss-Skizze (SVG)** mit Türen, Fenstern, Balkon und Maßketten, bei Häusern pro Geschoss umschaltbar; Eckdaten, Energieskala, „Besichtigung anfragen“ füllt das Kontaktformular vor.
- **Finanzierungsrechner:** Kaufpreis, Eigenkapital, Zins, Tilgung, Zinsbindung, Nebenkosten → Monatsrate, Restschuld, Zinsen, Laufzeit und **Restschuld-Diagramm (SVG)** mit Tooltip (Maus, Touch, Pfeiltasten). Als Beispielrechnung gekennzeichnet.
- **Verkaufsprozess als gepinnte Zeitleiste:** Auf dem Desktop (≥ 900 px Breite, ≥ 620 px Höhe) bleibt der Abschnitt stehen, sechs Schritte wechseln beim Scrollen, daneben entsteht Strich für Strich ein Grundriss (Wände → Türen → Möbel → Maße → Stempel „Übergeben“). Auf dem Handy normale Liste, die Zeichnung läuft einmal ab.
- Dazu: Bildvorschau, die dem Mauszeiger in der Leistungsliste folgt (Lerp), langsame Bild-Parallaxen, Wort-für-Wort-Überschriften, Scroll-Fortschritt im Header, mobile Aktionsleiste (Anrufen / Immobilie bewerten).

## Anpassen
- **Name, Telefon, E-Mail, Adresse:** in `index.html` (Header, Menü, Kontakt, Footer, JSON-LD), `impressum.html`, `datenschutz.html`. Telefon-Links im Format `tel:+49695559030`.
- **Farben & Schriften:** CSS-Variablen in `style.css` unter `:root` (`--night`, `--sand`, `--brass`, `--brass-ink` für Text auf Hell, `--paper` …). Schriften: Source Serif 4 und Manrope (`assets/fonts/`, Lizenzen dabei).
- **Bewertungs-Richtwerte:** Konstante `VALUATION` ganz oben in `main.js` (€/m² je Stadtteil, Faktoren für Objektart, Baujahr, Zustand, Größe, Zuschläge, Spanne, Rundung). Neue Stadtteile zusätzlich als Chip in `index.html` (Schritt 2) eintragen.
- **Finanzierung:** Konstante `FINANCE` in `main.js` (Grunderwerbsteuer, Notar/Grundbuch, Makler). Start- und Grenzwerte der Regler stehen direkt an den `<input type="range">` in `index.html`.
- **Objekte:** Karten in `index.html` (`data-id`, `data-mode`, `data-rooms`, `data-price` steuern die Filter), Exposé-Daten inkl. Fotos, Energieklasse und Grundriss (Räume als Rechtecke in Metern) in `OBJECTS` in `main.js`. Pins der Karte: `.map-pin` mit `left/top` in Prozent.
- **Bilder:** `assets/img/<name>-960.webp` und `-480.webp` ersetzen (gleiche Namen) und Alt-Texte in `index.html` bzw. `IMG` in `main.js` anpassen. Herkunft siehe `assets/img/BILDNACHWEIS.md`.

## Lokal starten
```
cd /home/user/Websites
python3 -m http.server 8910
```
Dann http://127.0.0.1:8910/arena/immobilien-ostwald/ öffnen. `?motion=off` schaltet Animationen ab; `prefers-reduced-motion` wird respektiert. Ohne JavaScript sind alle Inhalte sichtbar (Formularschritte untereinander, Prozess als Liste).

## Technik
GSAP 3.13 + ScrollTrigger und Lenis liegen unter `assets/vendor/`. Keine externen Anfragen, keine Cookies, keine Karten-Embeds. Formulare arbeiten nur clientseitig („Demo – es wurde nichts gesendet“).
