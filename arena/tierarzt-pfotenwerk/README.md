# Tierarztpraxis Pfotenwerk – Demo „Pfote“

Demo-Website für eine **fiktive** Tierarztpraxis in Bremen-Schwachhausen (Schwachhauser Heerstraße 140, Dr. med. vet. Jana Petersen). Teil der „Arena“ von Filip Kramar. Alle Namen, Daten, Bewertungen und Patientengeschichten sind erfunden, die Seite steht auf `noindex`.

Designsprache: freundlich und verspielt, aber medizinisch klar – Petrol, Sonnengelb, Hellblau-Grau, Tinte und Apricot. Display-Schrift Young Serif, Fließtext Lexend (variabel, sehr gut lesbar). Runde Formen, eigene SVG-Tier-Silhouetten (Hund, Katze, Kaninchen, Meerschweinchen) und Pfotenspuren als roter Faden.

## Abschnitte
Header mit Live-Status · Hero (Bogen-Foto, Tagesleiste, Pfoten-Canvas) · Leistungen (6 Karten) · Notfall-Wegweiser · Ihr erster Besuch (Pfotenspur) · Impfplaner · Praxis & Team (Monogramme) · Patientengeschichten · Neupatienten-Anmeldung · Anfahrt & Sprechzeiten (SVG-Karte) · FAQ · Footer. Dazu `impressum.html` und `datenschutz.html` (Muster).

## Spezial-Features
- **Notfall-Wegweiser:** Tierart + Anzeichen (Mehrfachauswahl) → Ampel „Sofort anrufen“ / „Heute Termin“ / „Termin vereinbaren“, mit Begründung, Sofort-Tipps und großem Notfall-Button (pulsiert bei Rot). Stufen je Tierart, Kombinationsregeln, Hinweise wie „Kater + kein Urin“. Text und Aktionen passen sich dem Live-Öffnungsstatus an. Auf dem Handy springt ein schwebender Knopf zur Einschätzung. Klar als Orientierung gekennzeichnet.
- **Impfplaner:** Welpe/Kitten + Geburtsdatum → Zeitleiste der Grundimmunisierung (8./12./16. Woche, 15. Monat) mit Datum, „Heute“-Marker, Fortschrittslinie, optionalen Impfungen je nach Alltag und `.ics`-Export. Übergibt Name, Tierart und Alter an die Anmeldung.
- **Neupatienten-Anmeldung:** Tierprofil (Name, Art, Rasse, Alter, Gewicht per Regler oder Zahl, Geschlecht) mit Live-Vorschau einer Patientenkarte (Silhouette wächst mit dem Gewicht, Lebensphase, Beispiel-Patientennummer, Neigung zum Mauszeiger). Unter 1100 px dockt beim Ausfüllen eine Mini-Karte unter dem Header an, damit die Vorschau sichtbar bleibt. Validierung, Erfolgsansicht mit Zusammenfassung und Stempel. Es wird nichts gesendet.
- **Pfotenspuren:** Leiste rechts (Desktop) bzw. Header-Unterkante (Handy) als Scroll-Fortschritt; im Abschnitt „Erster Besuch“ läuft eine Pfotenspur scroll-gesteuert (Desktop gepinnt) von Schritt zu Schritt; im Hero laufen Hund und Katze als Canvas-Spuren durchs Bild.
- **Live-Öffnungsstatus** (Europe/Berlin) in Header, Hero-Karte mit Tagesleiste, Menü und Sprechzeiten-Tabelle (heutiger Tag markiert). Zum Testen: `?jetzt=di-10:30` (Wochentag-Kürzel + Uhrzeit).
- **Leistungskarten:** Tier-Silhouetten wackeln beim Hover/Fokus kurz (auf Touch einmal beim Einblenden).
- Patientengeschichten als horizontale Strecke (Desktop gepinnt, sonst Wischen mit Pfeilknöpfen), Karte mit anklickbaren Stadtteilen und Fahrzeiten, FAQ als Akkordeon.

## Anpassen
- **Name, Telefon, Adresse:** direkt in `index.html` (Header, Hero, Notfall, Standort, Footer, JSON-LD im `<head>`), `impressum.html`, `datenschutz.html`.
- **Sprechzeiten:** `HOURS` oben in `main.js` (für Live-Status und Tagesleiste) – zusätzlich Tabelle und Footer in `index.html` sowie `openingHoursSpecification` im JSON-LD.
- **Farben/Schriften/Radien:** CSS-Variablen oben in `style.css` (`--petrol`, `--sun`, `--sky`, `--ink`, `--apricot` …). Silhouetten-Farben über `--sil-*`.
- **Notfall-Wegweiser:** `SYMPTOMS` (Stufe je Tierart, Tipp), `TRIAGE_NOTES` in `main.js`; die Auswahl-Chips stehen in `index.html` (`value` = Schlüssel).
- **Impfplaner:** `VACC` (Zeitpunkte, Impfungen, optionale Impfungen, Hinweise), `VACC_OPT_LABEL`, `VACC_EXAMPLE_WEEKS` in `main.js`.
- **Anmeldung:** `PETS` (Gewichtsbereich des Reglers, typisches Gewicht, Plausibilitätsgrenzen, Lebensphasen).
- **Bilder:** `assets/img/<name>-960.webp` und `-480.webp` ersetzen (gleiche Namen) oder Pfade/`srcset` im HTML anpassen. Fotos werden nie breiter als 960 CSS-px dargestellt.

## Lokal starten
```
cd /home/user/Websites && python3 -m http.server 8800
```
Dann http://127.0.0.1:8800/arena/tierarzt-pfotenwerk/ öffnen. `?motion=off` schaltet alle Animationen ab.

## Technik & Hinweise
Statisch, ohne Build. GSAP 3 + ScrollTrigger und Lenis liegen unter `assets/vendor/`, Schriften (nur `latin`, OFL) unter `assets/fonts/`. Keine externen Requests, keine Cookies. Ohne JavaScript und bei `prefers-reduced-motion` bleibt alles sichtbar und bedienbar (Pins und Canvas entfallen, die Pfotenspur steht vollständig).

Bildquellen: siehe `assets/img/BILDNACHWEIS.md` (StockSnap, CC0).
