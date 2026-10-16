# Klangraum Musikschule – Demo „Takt“

Fiktive Demo-Website einer Musikschule in Mainz (Arena von Filip Kramar). Statisch, ohne Build, ohne externe Requests. `noindex`.

## Abschnitte
Header mit Navigation, Telefon und „Probestunde“ · Hero mit Klangpult · Instrumenten-Ticker · Instrumente (horizontale Strecke am Desktop, Wisch-Schiene am Handy) · Instrumenten-Finder · Kursplan-Raster · Lehrkräfte mit Hörproben · Probestunde buchen · Die Schule + „Nie zu spät“ (Erwachsene) · Stimmen · Anfahrt mit SVG-Karte · FAQ · Schluss-CTA · Footer. Dazu `impressum.html` und `datenschutz.html`.

## Spezial-Features
1. **Klangpult (Hero):** Klaviatur (Maus, Touch, Tastatur A–K, schwarze Tasten W E T Z U), 8-Schritt-Rhythmus-Sequencer mit Tempo-Regler und farbigem Canvas-Visualizer. WebAudio startet erst nach der ersten Nutzeraktion; „Ton aus“ lässt alles stumm bedienbar (Anzeige + Visualizer laufen weiter).
2. **Instrumenten-Finder:** Alter, Wunsch, Übezeit → Instrument, Begründung, passender Kurs aus dem Kursplan, Alternativen; Übergabe an die Buchung.
3. **Kursplan:** Wochenraster Mo–Sa mit Filtern (Instrument, Alter, Niveau); am Handy Tages-Tabs (Pfeiltasten) mit Trefferzahlen.
4. **Probestunde buchen:** Instrument → Lehrkraft → Termin (deterministisch erzeugte Slots) → Kontakt → Bestätigung mit Zusammenfassung („Demo – es wurde nichts gesendet“).
5. **Lehrkräfte:** Monogramm-Karten mit „Hörprobe“ – kurze, im Browser erzeugte Tonfolge je Instrument, nur auf Klick.

## Anpassen
- **Name, Adresse, Telefon:** in `index.html`, `impressum.html`, `datenschutz.html` (inkl. JSON-LD im `<head>`) suchen und ersetzen.
- **Farben/Schriften:** CSS-Variablen ganz oben in `style.css` (`--paper`, `--ink`, `--tomato`, `--cobalt`, `--sun` …).
- **Bilder:** `assets/img/<name>-960.webp` und `-480.webp` ersetzen (gleicher Name). Nachweis: `assets/img/BILDNACHWEIS.md`.
- **Kurse:** direkt im HTML (`#kursplan`): `--t` = Stunden ab 14 Uhr (Samstag ab 9:30 Uhr), `--l` = Dauer in Stunden, `data-instr/age/level` für die Filter.
- **Finder-Gewichte, Lehrkräfte, Terminzeiten, Sequencer-Muster, Tonfolgen:** als Konstanten oben in `main.js`.

## Lokal starten
```
cd /home/user/Websites && python3 -m http.server 8000
# http://127.0.0.1:8000/arena/musikschule-klangraum/
```
`?motion=off` schaltet alle Animationen ab; `prefers-reduced-motion` wird respektiert.

Schriften: Syne und Figtree (SIL OFL, selbst gehostet, Lizenzen in `assets/fonts/`).
