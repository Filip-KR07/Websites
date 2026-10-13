# Modell „Drehmoment“ – Kfz-Meisterwerkstatt Berger (Demo)

Demo-Website eines **fiktiven** Kfz-Meisterbetriebs in Dortmund für die Arena von Filip Kramar. Technisch-präzise Designsprache mit Motorsport-Anleihen: Graphit, Stahlgrau, Signalblau, Warnorange nur für Status; Schriften Chakra Petch (Display) und Red Hat Display (Text), beide selbst gehostet. Alle Namen, Preise, Bewertungen und Statuswerte sind erfunden.

Statisch, kein Build. Alle Pfade absolut mit Präfix `/arena/kfz-berger/`.

## Abschnitte
Header mit Mini-Drehzahlmesser im Logo · Hero (Drehzahlmesser + Foto) · Werkstatt live · Leistungen (Spezifikationstabelle) · Fahrzeug-Check · Service-Rechner · HU-Erinnerung · Ablauf in sechs Gängen · Werkstatt & Team · Kundenstimmen · Anfahrt (SVG-Karte) · Karriere · FAQ · Terminanfrage · Footer. Dazu `impressum.html` und `datenschutz.html` (Muster).

## Spezial-Features
1. **Drehzahlmesser (SVG)** im Hero: Nadel, Leuchtring, Schaltblitz-LEDs und Digitalanzeige folgen der Scroll-Geschwindigkeit (Feder-Physik, Begrenzer blinkt bei Vollgas). Gang-Anzeige nach Seitenfortschritt, Start-Sweep beim Laden. Die Logo-Nadel im Header reagiert ebenfalls.
2. **Service-Rechner**: Fahrzeugklasse, Antrieb und Leistungen → Preisspanne, Werkstattzeit, Abholung (selber Tag / Folgetag mit Ersatzwagen-Hinweis). „In Terminanfrage übernehmen“ füllt das Formular vor.
3. **Interaktive Seitenansicht**: technische Zeichnung eines Kombis; Motor, Bremsen, Reifen, Licht und Klima per Tab (Pfeiltasten), Hotspot oder Klick aufs Bauteil. Beim Scrollen setzt sich die Explosionszeichnung zusammen.
4. **HU-Erinnerung**: Monat/Jahr der letzten HU (oder Erstzulassung) → Fälligkeit, Plakette in Jahresfarbe mit Monat oben, Live-Countdown, Zyklusbalken, `.ics`-Erinnerung und Übernahme in die Terminanfrage (nächster Di/Do).
5. **Live-Werkstattstatus** (simuliert, pro Tag deterministisch): freie Slots heute, nächster Slot, Ersatzwagen, Hebebühnen-Belegung; Kurzstatus auch im Header und im Hero.

Außerdem: horizontale Ablauf-Strecke mit animierter Schaltkulisse (Desktop), schwebende Bildvorschau in der Leistungstabelle, Bewertungs-Messinstrument, Formular mit Validierung und Erfolgsansicht („Demo – es wurde nichts gesendet“).

## Anpassen
- **Name, Telefon, Adresse, Zeiten**: in `index.html` (Header, Kontakt, Footer, JSON-LD `AutoRepair`) sowie in `impressum.html`/`datenschutz.html`. Telefonnummer suchen/ersetzen: `0231&nbsp;555&nbsp;72&nbsp;40` und `+492315557240`.
- **Farben/Schriften/Easing**: CSS-Variablen in `:root` oben in `style.css` (`--graphite`, `--steel`, `--blue`, `--blue-hi`, `--orange` …).
- **Rechner-Werte**: Konstanten oben in `main.js` – `VEHICLE_CLASSES`, `SERVICES` (Preise in €, Zeiten in h), `COMBO_TIME_FACTOR`, `SAME_DAY_MAX_HOURS`.
- **Öffnungszeiten & Status-Simulation**: `OPENING`, `SLOT_TIMES`, `SLOT_BOOKED_RATE`, `LOAN_CARS`, `LIFT_JOBS` in `main.js`. Im Livebetrieb durch echte Kalenderdaten ersetzen.
- **HU**: `HU_INTERVAL`, `HU_FIRST`, `HU_COLORS`.
- **Drehzahlmesser**: `RPM_IDLE`, `RPM_MAX`, `RPM_SPEED_FULL`, `LED_THRESHOLDS`.
- **Bilder**: `assets/img/<name>-960.webp` und `-480.webp` gleichnamig ersetzen (Fotos nie breiter als 960 px). Herkunft siehe `assets/img/BILDNACHWEIS.md`.

## Lokal starten
```bash
cd /home/user/Websites
python3 -m http.server 8811
# http://127.0.0.1:8811/arena/kfz-berger/
```
`?motion=off` schaltet alle Animationen ab; `prefers-reduced-motion` wird respektiert. Ohne JavaScript bleiben alle Inhalte sichtbar.
