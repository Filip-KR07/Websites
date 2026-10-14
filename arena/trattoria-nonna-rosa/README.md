# Trattoria Nonna Rosa – Demo-Website (Modell „Tavola“)

Fiktiver Beispielbetrieb für die Arena von Filip Kramar: eine Familien-Trattoria in Stuttgart-Mitte
(Hauptstätter Straße 57). Statische Seite ohne Build-Schritt – HTML, CSS, JavaScript. Alle Namen, Daten
und Bewertungen sind erfunden; `noindex` ist gesetzt.

## Abschnitte

1. Header mit Live-Öffnungsstatus (Zeitzone Berlin), Telefon und „Reservieren“
2. Hero „Pasta, die heute Morgen noch Mehl war.“ – Komposition aus Bogenfoto, Teller, Tischdecke, gezeichneten Illustrationen (Tomate, Olivenzweig, Basilikum) und Zettel mit dem heutigen Tagesgericht
3. Laufband mit Gerichten
4. „La casa“ – Angebot (Pasta fresca, Mittagstisch, à la carte, La Cantina, zum Mitnehmen); auf dem Desktop folgt ein Foto dem Mauszeiger
5. **Pasta des Tages** – Kreidetafel, Wochenplan wählbar
6. **Speisekarte** – Tabs, Ernährungs- und Allergenfilter, Weinkarte als Tabelle
7. **Wein-Pairing** – Gericht wählen, Radar-Profil des Weins
8. **Familiengeschichte** – Wäscheleine mit Polaroids (1958–heute)
9. Team (Monogramme) + Stellenanzeige
10. Gästestimmen (Bon-Optik)
11. **Tischreservierung** mit Bestätigungsansicht und Kalendereintrag (.ics)
12. Anfahrt (eigene SVG-Karte, Öffnungszeiten mit „heute“-Markierung), FAQ, Footer

Zusätzlich: `impressum.html`, `datenschutz.html` (Muster, vor Livegang ersetzen).

## Spezial-Features

- **Kreidetafel:** Jede Zeile wird per `stroke-dashoffset` und mitlaufender Clip-Maske „geschrieben“, dazu Kreidestaub (Canvas) und gezeichnete Unterstreichung/Preis-Kreis. Tagwechsel wischt die Tafel und schreibt neu. Heute wird automatisch vorausgewählt (Montag → Dienstag).
- **Speisekarte:** Tabs mit Pfeiltasten/Home/End, Hervorhebung per `clip-path` (Farbe wechselt nahtlos). Filter „Vegetarisch/Vegan“ und „Ohne Gluten/Ei/Milch/Nüsse/Fisch“ mit Zählern je Tab und Leerzustand.
- **Wein-Pairing:** Radar (6 Achsen) morpht zwischen Profilen; Werte zusätzlich als Punktliste und `aria-live`-Text.
- **Wäscheleine:** Desktop: horizontale Strecke (CSS `position: sticky` + GSAP-ScrollTrigger-Scrub, kein Pin – dadurch keine Layout-Shifts), Polaroids werden „aufgehängt“ und pendeln mit der Scrollgeschwindigkeit (Federsimulation). Unter 900 px: vertikale Liste, Polaroids gleiten seitlich herein.
- **Reservierung:** Kalender (Pfeiltasten, Bild↑/↓, Montag Ruhetag), Zeitfenster je Tag mit deterministisch „ausgebuchten“ Zeiten, Personen-Stepper, Anlass (bei Geburtstag: Kerze im Tiramisù), Tischkarte mit Live-Zusammenfassung, Validierung, Bestätigung „Demo – es wurde nichts gesendet“.
- Ohne JavaScript, bei `prefers-reduced-motion` und mit `?motion=off` ist alles sichtbar und bedienbar.

## Anpassen

- **Name, Adresse, Telefon, E-Mail:** in `index.html` (Header, Hero, Footer, JSON-LD im `<head>`), `impressum.html`, `datenschutz.html`, Kalendereintrag in `main.js` (Suche nach „Hauptstätter“ / „0711“).
- **Farben & Schriften:** CSS-Variablen in `style.css` unter `:root` (`--tomato`, `--olive`, `--lemon`, `--linen`, `--basil`, `--f-display`, `--f-text`, `--f-hand`). Die Illustrationen im SVG-Sprite am Anfang von `index.html` nutzen dieselben Hex-Werte.
- **Öffnungszeiten:** `HOURS` oben in `main.js` (Live-Status, Kalender) + Tabelle/Footer in `index.html` + JSON-LD.
- **Pasta des Tages:** `TAFEL` in `main.js` (Wochentag → Gericht, Beschreibung, Preis, Wein); die Kurzbezeichnungen unter den Tag-Schaltflächen stehen in `index.html`.
- **Wein-Pairing:** `PAIRING` und `AXES` in `main.js` (Profilwerte 0–5).
- **Reservierung:** `RES` in `main.js` (Vorlauf, Personen, Zeitfenster, Anteil ausgebuchter Demo-Zeiten). Für den Livebetrieb das Formular an ein echtes Backend/Reservierungssystem anbinden.
- **Speisekarte:** direkt in `index.html`; jedes Gericht trägt `data-diet` (`veg`/`vegan`/leer) und `data-allergens` (LMIV-Buchstaben, kommagetrennt) für die Filter.
- **Bilder:** `assets/img/<name>-960.webp` und `-480.webp` (Polaroids: `pol-<name>-600/300.webp`, Hero: `bogen-*`, `teller-*`). Gleiche Dateinamen ersetzen oder `src`/`srcset` anpassen. Herkunft und Bearbeitung: `assets/img/BILDNACHWEIS.md`.

## Lokal starten

```bash
cd /home/user/Websites
python3 -m http.server 8810
# http://127.0.0.1:8810/arena/trattoria-nonna-rosa/
```

Alle Pfade sind absolut (`/arena/trattoria-nonna-rosa/…`), damit die Seite auch hinter Vercel (`cleanUrls`, `trailingSlash: false`) funktioniert.

## Technik & Rechtliches

- Schriften selbst gehostet (Playfair Display, Karla, Caveat – SIL OFL, Lizenzen in `assets/fonts/`), keine externen Requests, keine Cookies.
- GSAP 3.13 + ScrollTrigger, Lenis (lokal in `assets/vendor/`).
- Fotos: StockSnap (CC0), siehe `assets/img/BILDNACHWEIS.md`. Illustrationen und Karte sind eigene SVG-Zeichnungen.
