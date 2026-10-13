# Zahnarztpraxis Dr. Lea Sommer – Modell „Klarheit“ (Demo)

Demo-Website für einen **fiktiven** Betrieb: Zahnarztpraxis in München-Schwabing (Leopoldstraße 88). Teil der „Arena“ von Filip Kramar. Statisch, ohne Build, ohne externe Requests. `noindex` gesetzt.

Designsprache: hell, ruhig, klinisch-frisch, aber warm – Weiß, Minze, tiefes Petrol, sparsam Koralle. Schrift: Figtree (variabel, selbst gehostet).

## Abschnitte
1. Header mit Navigation, Telefon, „Termin anfragen“ (mobil: Menü als Dialog)
2. Hero „Erst verstehen. Dann behandeln.“ mit **Klarheits-Linse** (Milchglas-Foto, eine klare Linse folgt der Maus bzw. driftet langsam), Live-Öffnungsstatus, Bewertung
3. Prinzip – Satz wird beim Scrollen Wort für Wort „klar“, drei Grundsätze
4. Behandlungen – Liste mit Bildvorschau am Mauszeiger; jeder Eintrag füllt die Terminanfrage vor
5. **Interaktives Zahnschema** (32 Zähne, FDI) mit Bereichen und Behandlungs-Tabs
6. **Prophylaxe** als Schrittfolge (6 Schritte, Illustration ändert sich beim Scrollen) + **Kosten-Umschalter** gesetzlich/privat
7. **Ohne Angst** mit **Atemübung 4-4-6**
8. **Team-Karussell** mit Monogrammen, Sprachfilter (DE/EN/TR)
9. Praxis-Rundgang (Desktop: horizontale Strecke, mobil: Raster)
10. Stimmen (erfunden) mit Bewertungsverteilung
11. **Terminanfrage** in drei Schritten (Anliegen → Wunschzeit-Raster → Kontakt), Schmerz-Notfall = anrufen
12. Anfahrt mit eigener SVG-Karte, Sprechzeiten mit „heute“, FAQ, Footer

## Spezial-Features im Detail
- **Zahnschema:** Klick/Tipp auf Zahn oder Bereichs-Button. Tastatur: Pfeil links/rechts = nächster Zahn, Pfeil hoch/runter = Gegenkiefer, Pos1/Ende. Tabs mit Pfeiltasten. Relevanz-Balken je Behandlung. „Termin zu Zahn XY anfragen“ trägt Zahn und Thema in die Nachricht ein. Das SVG ist statisch im HTML (funktioniert auch ohne JS als Grafik).
- **Atemübung:** Start/Stopp-Button, 14 Punkte = 14 Sekunden einer Runde, 5 Runden. Bei reduzierter Bewegung pulsiert nur die Helligkeit statt der Größe. Phasen werden per `aria-live` angesagt.
- **Terminanfrage:** Validierung je Schritt, Schnellauswahl für Zeitfenster, Erfolgsansicht mit Zusammenfassung („Demo – es wurde nichts gesendet“). Eingaben werden nur per `textContent` ausgegeben.
- **Öffnungsstatus:** berechnet „Jetzt geöffnet / öffnet …“ in Europe/Berlin (Hero-Karte, Sprechzeiten-Tabelle).

## Anpassen
- **Name, Adresse, Telefon, E-Mail:** in `index.html`, `impressum.html`, `datenschutz.html` suchen/ersetzen (`089 555 67 10`, `+49895556710`, `praxis@zahnarzt-sommer.de`, `Leopoldstraße 88`). JSON-LD im `<head>` mit anpassen.
- **Farben:** CSS-Variablen in `:root` oben in `style.css` (`--petrol`, `--mint`, `--coral`, `--bg` …).
- **Öffnungszeiten, Atemübung, Linse:** Konstanten oben in `main.js` (`OEFFNUNGSZEITEN`, `ATEM`, `LINSE`). Sprechzeiten-Tabelle und Wunschzeit-Raster in `index.html` passend ändern.
- **Texte im Zahnschema:** Objekte `TREAT`, `BY_TYPE`, `AREAS` in `main.js` (Relevanz 1–3, Erklärung, Dauer, Kostenhinweis – bewusst ohne Preise).
- **Bilder:** `assets/img/<name>-960.webp` und `-480.webp` ersetzen (gleiche Namen) – Herkunft siehe `assets/img/BILDNACHWEIS.md`. Fotos nie breiter als 960 px darstellen.
- **Zahnschema-Grafik:** wurde mit einem Generator-Skript erzeugt (Parabel-Bogen, FDI-Nummern); bei Bedarf direkt im SVG anpassen.

## Technik
- GSAP + ScrollTrigger + Lenis (lokal in `assets/vendor/`); Lenis nur ohne reduzierte Bewegung, Instanz als `window.__lenis`.
- Pins/horizontale Strecke nur ab 900 px (`gsap.matchMedia`), darunter native Layouts.
- `?motion=off` oder `prefers-reduced-motion` schalten Bewegung ab; ohne JS ist alles sichtbar (Tabs werden zu Abschnitten, Formular-Schritte untereinander).
- Alle Pfade absolut mit Präfix `/arena/zahnarzt-sommer/`.

## Lokal starten
```bash
cd /home/user/Websites
python3 -m http.server 8801
# → http://127.0.0.1:8801/arena/zahnarzt-sommer/
```

Fiktiver Beispielbetrieb – alle Namen, Daten und Bewertungen sind erfunden. Impressum/Datenschutz sind Muster (keine Rechtsberatung).
