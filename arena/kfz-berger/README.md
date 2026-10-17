# Modell „Drehmoment“ – Kfz-Meisterwerkstatt Berger (Demo)

Demo-Website eines **fiktiven** Kfz-Meisterbetriebs in Dortmund für die Arena von Filip Kramar. Technisch-präzise Designsprache mit Motorsport-Anleihen: Graphit, Stahlgrau, Signalblau, Warnorange nur für Status; Schriften Chakra Petch (Display) und Red Hat Display (Text), beide selbst gehostet. Alle Namen, Preise, Bewertungen und Statuswerte sind erfunden.

Statisch, kein Build. Alle Pfade absolut mit Präfix `/arena/kfz-berger/`.

## Gestaltungsidee
Die Seite ist ein Zeichnungssatz aus der Werkstatt: Blatt 1 ist die Explosionszeichnung einer Radbaugruppe mit Positionsnummern, Prüfwerten und einem echten Schriftfeld, in dem die Vertrauenssignale (Meister, 4,8 von 5, HU/AU im Haus, Live-Status) stehen. Danach folgen Werkstatt-Tafel mit Schlüsselbrett, Prüfstand mit Diagnose-Scan, ein Werkstattauftrag, der aus dem Drucker läuft, eine Oszilloskop-Spur für den Ablauf, Spinde mit Prägeband-Namensschildern und Auftragsdurchschläge als Kundenstimmen. Die Bewegung ist schwer und mechanisch: Bauteile hängen an gedämpften Federn, schwingen einmal nach und rasten ein; Linien zeichnen sich wie mit dem Tuschestift. Graphit, Stahl und Werkstattpapier wechseln sich kapitelweise ab, Signalblau ist die Messfarbe, Warnorange bleibt dem Status vorbehalten.

## Abschnitte
Header (Logo-Nadel, Zeichen-Rollen in der Navigation) · Hero „Blatt 1“ (Titel, Schriftfeld, sticky Explosionszeichnung + Drehzahlmesser, Stückliste auf dem Handy) · Laufband „Reifenspur“ · Werkstatt-Tafel (Live-Status, Hebebühnen, Schlüsselbrett) · Leistungen (Index-Tabelle mit Duoton-Vorschau) · Fahrzeug-Check mit Diagnose-Scan · Service-Rechner als Werkstattauftrag (Papier-Kapitel) · HU-Erinnerung (Plakette, Zählwerk) · Ablauf als Oszilloskop-Spur · Werkstatt & Team (Spinde) · Kundenstimmen (Siegel, Durchschläge) · Anfahrt (SVG-Karte, die sich zeichnet) · Karriere (blaues Kapitel, Zahnkranz rastet) · FAQ · Terminanfrage · Footer. Dazu `impressum.html` und `datenschutz.html` (Muster).

## Spezial-Features
1. **Hero mit Explosionszeichnung und Drehzahlmesser (SVG)**: Die Radbaugruppe zeichnet sich beim Laden und fliegt auseinander; beim Scrollen (sticky Bühne, kein GSAP-Pin) zieht sie sich weiter auseinander, jedes Teil an einer eigenen Feder, Hinweislinien folgen. Die Drehzahlmesser-Nadel, LEDs und Digitalanzeige folgen der Scroll-Geschwindigkeit (Feder mit Nachschwingen, Begrenzer blinkt), die Logo-Nadel im Header ebenfalls.
2. **Service-Rechner** als Werkstattauftrag: Fahrzeugklasse, Antrieb und Leistungen → Preisspanne, Werkstattzeit, Abholung. Positionen „drucken“ sich, der Stempel „Richtwert“ setzt bei jeder Änderung neu auf, der Zettel läuft beim Hereinscrollen aus dem Druckerschlitz. „In Terminanfrage übernehmen“ füllt das Formular vor.
3. **Interaktive Seitenansicht** mit Diagnose-Scan: Ein Prüfbalken fährt beim ersten Erscheinen über das Auto und hakt das Prüfprotokoll ab; danach rastet er am gewählten Bauteil ein. Motor, Bremsen, Reifen, Licht und Klima per Tab (Pfeiltasten), Hotspot oder Klick aufs Bauteil → Leistung, Symptome, Richtpreis.
4. **HU-Erinnerung**: Monat/Jahr der letzten HU (oder Erstzulassung) → Fälligkeit, Plakette in Jahresfarbe, Tage als Zählwerk, Live-Countdown, Zyklusbalken, `.ics`-Erinnerung, Übernahme in die Terminanfrage (nächster Di/Do).
5. **Live-Werkstattstatus** (simuliert, pro Tag deterministisch): freie Slots, nächster Slot, Hebebühnen, Ersatzwagen am Schlüsselbrett (Schlüssel schwingen ein), Kurzstatus auch im Header und im Schriftfeld.

Außerdem: Ablauf als Oszilloskop-Spur (jeder Schritt mit eigener Signalform; Desktop horizontale Strecke per `position: sticky`, Handy Wisch-Schiene mit derselben Spur), Laufband, dessen Tempo und Richtung der Scroll-Geschwindigkeit folgen, Titel, die wortweise aus Masken steigen, magnetische Buttons und CAD-Fadenkreuz über Zeichnungen (nur Maus), Karte, deren Straßen sich zeichnen, Formular mit Validierung und Erfolgsansicht („Demo – es wurde nichts gesendet“).

## Bewegungs-System
Kurven und Dauern stehen als Variablen in `:root`: `--ease-out`, `--ease-in-out`, `--ease-drawer`, dazu `--ease-heavy` (gedämpfte Feder, ζ ≈ 0,62, als CSS `linear()`) und `--ease-thump` (nur Stempel), `--dur-press`, `--dur-ui`, `--dur-mount`, `--dur-draw`, `--stagger`. JS-Federn (Explosion, Scan-Balken, Nadel) nutzen dieselbe Handschrift: kurzer Weg, einmal sichtbar nachschwingen, einrasten. Bei `prefers-reduced-motion` oder `?motion=off` steht die Zeichnung ruhig im aufgezogenen Zustand, alles andere blendet nur.

## Anpassen
- **Name, Telefon, Adresse, Zeiten**: in `index.html` (Header, Kontakt, Footer, JSON-LD `AutoRepair`) sowie in `impressum.html`/`datenschutz.html`. Telefonnummer suchen/ersetzen: `0231&nbsp;555&nbsp;72&nbsp;40` und `+492315557240`.
- **Farben/Schriften/Easing**: CSS-Variablen in `:root` oben in `style.css` (`--graphite`, `--steel`, `--blue`, `--blue-hi`, `--orange` …).
- **Rechner-Werte**: Konstanten oben in `main.js` – `VEHICLE_CLASSES`, `SERVICES` (Preise in €, Zeiten in h), `COMBO_TIME_FACTOR`, `SAME_DAY_MAX_HOURS`.
- **Öffnungszeiten & Status-Simulation**: `OPENING`, `SLOT_TIMES`, `SLOT_BOOKED_RATE`, `LOAN_CARS`, `LIFT_JOBS` in `main.js`. Im Livebetrieb durch echte Kalenderdaten ersetzen.
- **HU**: `HU_INTERVAL`, `HU_FIRST`, `HU_COLORS`.
- **Drehzahlmesser**: `RPM_IDLE`, `RPM_MAX`, `RPM_SPEED_FULL`, `LED_THRESHOLDS`.
- **Explosionszeichnung**: Bauteile, Versatz und Beschriftungen stehen als `data-off`/`data-anchor` am jeweiligen `<g class="xd-part">` in `index.html`; Ruhe-Stellung `XD.P_REST` in `main.js`.
- **Diagnose-Scan / Oszilloskop**: `SCAN_POS`, `SCAN_LOG` bzw. `WAVES` in `main.js`.
- **Bilder**: `assets/img/<name>-960.webp` und `-480.webp` gleichnamig ersetzen (Fotos nie breiter als 960 px). Herkunft siehe `assets/img/BILDNACHWEIS.md`.

## Lokal starten
```bash
cd /home/user/Websites
python3 -m http.server 8922
# http://127.0.0.1:8922/arena/kfz-berger/
```
`?motion=off` schaltet alle Animationen ab; `prefers-reduced-motion` wird respektiert. Ohne JavaScript bleiben alle Inhalte sichtbar.
