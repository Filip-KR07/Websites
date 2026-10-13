# Falk & Partner Steuerberatung – Demo „Bilanz“

Demo-Website für eine **fiktive** Steuerberatungskanzlei in Hannover-List (Podbielskistraße 33). Teil der „Arena“ von Filip Kramar. Alle Namen, Zahlen, Bewertungen und Termine sind erfunden, die Seite steht auf `noindex`.

Designsprache: vertrauenswürdig, klar, modern-sachlich – wie ein Kontenblatt. Tannengrün, Papier, Tinte, sparsames Mint; Ampelfarben ausschließlich für Fristen. IBM Plex Serif (Überschriften), IBM Plex Sans (Text), IBM Plex Mono (Zahlen, Fristen). Spaltenlinien im Hintergrund, tabellarische Zahlen, doppelte Summenstriche.

## Abschnitte
Hero mit Bilanz-Grafik · Kennzahlen · Leistungen (Kontenblatt mit 9 Positionen) · Mandanten-Wegweiser · Unterlagen-Checkliste · Digitaler Ablauf · Fristenkalender · Kanzlei & Team (Siegel-Monogramme) · Mandantenstimmen (als Belege) · Standort (SVG-Karte) · Karriere · FAQ · Kontakt/Erstgespräch · Footer. Dazu `impressum.html` und `datenschutz.html` (Muster).

## Spezial-Features
- **Hero-Bilanz:** Die T-Konto-Linien zeichnen sich (SVG, `stroke-dashoffset`), Zeilen erscheinen gestaffelt, alle Beträge rollen wie ein Zählwerk auf ihren Wert, die Summen schließen mit Doppelstrich und Stempel „ausgeglichen“. Dazu Eigenkapitalquote und Sparkline.
- **Mandanten-Wegweiser:** Tabs Privat / Selbstständig / GmbH / Verein (Pfeiltasten, Home/End) mit Leistungen, benötigten Unterlagen, Fristen und Deep-Links zur passenden Checkliste bzw. zum vorausgefüllten Formular.
- **Unterlagen-Checkliste:** vier Listen zum Abhaken, Fortschrittsbalken mit Prozent, Stempel bei „vollständig“, Zurücksetzen, Drucken (nur die Liste). Gespeichert wird ausschließlich im Browser (`localStorage`).
- **Digitaler Ablauf:** Upload → Prüfung → Erklärung → Bescheid-Check. Auf dem Desktop eine gepinnte Schrittfolge (GSAP ScrollTrigger) mit Fortschrittsschiene und klickbarer Schrittnavigation, jede Vignette animiert (Upload-Balken, Prüf-Scan mit Rückfrage, Formularwerte, Bescheid-Abgleich mit Abweichung). Auf dem Handy untereinander, Animation beim Einblenden.
- **Fristenkalender:** Zeitleiste des laufenden Jahres mit sechs Spuren, Heute-Linie, Ampel (≤ 7 / ≤ 30 Tage / später / vorbei), „Nächste Frist in X Tagen“ als Zählwerk. Filter nach Mandantentyp, Umschalter monatlich/vierteljährlich und Dauerfristverlängerung (Marker gleiten an ihre neuen Termine). Termine werden für das aktuelle Jahr berechnet, inkl. Verschiebung auf den nächsten Werktag (Wochenende, Feiertage Niedersachsen). Marker per Pfeiltasten bedienbar, Detailtafel, vollständige Liste als Tabelle. Klar als Orientierung gekennzeichnet.
- Kleinere Details: Scroll-Fortschritt im Header, aktive Navigation, Leistungs-Zeilen wechseln das Bild, „Jetzt erreichbar“-Status nach Öffnungszeiten, Karte mit Route, mobile Aktionsleiste (Anrufen / Erstgespräch).

## Anpassen
- **Name, Telefon, Adresse, Öffnungszeiten:** direkt in `index.html` (Header, Hero, Kontakt, Footer, JSON-LD im `<head>`), `impressum.html`, `datenschutz.html`. Öffnungszeiten für den Live-Status: `HOURS` oben in `main.js`.
- **Farben:** CSS-Variablen oben in `style.css` (`--green`, `--paper`, `--ink`, `--mint`, Ampel `--amp-*`).
- **Fristen:** Konstanten oben in `main.js` – `LANES` (Spuren, Zielgruppen), `AMPEL_ROT_TAGE`, `AMPEL_GELB_TAGE`, `BERATER_FRIST` (Sonderregeln der Abgabefrist mit Berater). Die Termine selbst erzeugt `buildEvents()`; die statische Liste im HTML ist nur der Fallback ohne JavaScript.
- **Checklisten & Wegweiser:** Einträge direkt im HTML (`.ck-list`, `.ww-panel`). Neue Checkbox = neue eindeutige `data-id`.
- **Bilder:** `assets/img/<name>-960.webp` und `-480.webp` ersetzen (gleiche Namen) oder Pfade/`srcset` im HTML anpassen. Fotos werden nie breiter als 960 CSS-px dargestellt.

## Lokal starten
```
cd /home/user/Websites && python3 -m http.server 8911
```
Dann http://127.0.0.1:8911/arena/steuer-falk/ öffnen. `?motion=off` schaltet alle Animationen ab.

## Technik & Hinweise
Statisch, ohne Build. GSAP 3 + ScrollTrigger und Lenis liegen unter `assets/vendor/`, Schriften (nur `latin`, OFL) unter `assets/fonts/`. Keine externen Requests, keine Cookies. Ohne JavaScript und bei `prefers-reduced-motion` bleibt alles sichtbar und bedienbar (Wegweiser zeigt dann alle Typen, Fristen als Liste).

Bildquellen: siehe `assets/img/BILDNACHWEIS.md` (StockSnap, CC0).
