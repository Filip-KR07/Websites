# Lichtwerk – Hochzeitsfotografie (Demo, Modell „Silber“)

Demo-Website für einen **fiktiven** Betrieb: Lichtwerk – Hochzeitsfotografie Anna Weber, Dresden. Teil der „Arena“ von Filip Kramar. Alle Namen, Daten, Preise und Bewertungen sind erfunden; die Seite ist auf `noindex` gestellt.

Designsprache: Galerie zuerst, filmisch und still – Papierweiß, Silbergrau, Schwarz und ein Hauch Rosé. Schriften: Instrument Serif (Display, kursiv) und Epilogue (Text), beide selbst gehostet.

## Abschnitte
Hero („Entwicklungsbad“) · Haltung · Galerie (4 Kapitel + Lightbox) · Love Story (Bildstrecke) · Pakete & Preise (Konfigurator) · Verfügbarkeit · Über uns & Ablauf · Stimmen · Atelier & Region (SVG-Karte) · FAQ · Anfrage · Footer. Dazu `impressum.html` und `datenschutz.html` (Muster).

## Spezial-Features
- **Entwicklungsbad-Hero:** WebGL-Shader lässt das Foto aus Schwarz über ein orangefarbenes Negativ zum Positiv entstehen (Entwicklerwelle, Rotlicht, Filmkorn); Anzeige Entwickler/Stoppbad/Fixierer, „Noch einmal entwickeln“. Ohne WebGL: CSS-Filter-Animation; ohne JS bzw. bei reduzierter Bewegung: ruhiges Standbild.
- **Galerie:** Kapitel-Tabs (Pfeiltasten, Home/End), justierte Reihen wie ein Kontaktbogen, Lightbox als `<dialog>` mit Tastatur (←/→/Esc), Wischen und Kontaktabzug-Leiste mit Fettstift-Markierung.
- **Paket-Konfigurator:** Stunden-Slider, Second Shooter, Verlobungsshooting, Album → Preis live auf einem „Laborauftrag“; Übernahme ins Anfrageformular.
- **Verfügbarkeits-Check:** Kalender mit Demo-Status frei/angefragt/belegt, Tastaturbedienung, freie Ausweichtermine, Datum wird ins Formular übernommen.
- **Love Story:** Ab 900 px gepinnte, horizontale Bildstrecke (GSAP ScrollTrigger), Bilder „entwickeln“ sich beim Durchlaufen; darunter vertikale Zeitleiste.

## Anpassen
- **Name, Telefon, Adresse:** in `index.html` (Header, Kontakt, Footer, JSON-LD) sowie in `impressum.html`/`datenschutz.html` suchen und ersetzen (`0351 555 47 80`, `+493515554780`, `Bautzner Straße 21`).
- **Farben:** CSS-Variablen ganz oben in `style.css` (`--paper`, `--silver`, `--ink`, `--rose`, `--rose-ink` …).
- **Preise & Rechner:** Konstanten oben in `main.js` (`PREISE`, `ALBUM_TEXT`, `BILDER_PRO_STUNDE`, `SECOND_SHOOTER_FAKTOR`). Die Schnellstart-Pakete stehen als `data-preset="Stunden,SecondShooter,Album,Verlobung"` im HTML.
- **Verfügbarkeit:** `VERFUEGBARKEIT` in `main.js` (Demo-Wahrscheinlichkeiten). Für echte Daten die Funktion `status()` durch eine Liste fester Termine ersetzen.
- **Bilder:** liegen als `name-960.webp`/`name-480.webp` in `assets/img/`. Gleichnamig ersetzen oder in `index.html` die Pfade (`src`/`srcset`, `width`/`height`, `--ar` in der Galerie) anpassen. Herkunft und Lizenz: `assets/img/BILDNACHWEIS.md`.
- **Entwicklungsdauer des Heros:** `ENTWICKLUNG_MS` in `main.js`.

## Lokal starten
```
cd /home/user/Websites && python3 -m http.server 8821
```
Dann http://127.0.0.1:8821/arena/fotografie-lichtwerk/ öffnen. `?motion=off` schaltet alle Animationen ab.
