# Lichtwerk – Hochzeitsfotografie (Demo, Modell „Silber“)

Demo-Website für einen **fiktiven** Betrieb: Lichtwerk – Hochzeitsfotografie Anna Weber, Dresden. Teil der „Arena“ von Filip Kramar. Alle Namen, Daten, Preise und Bewertungen sind erfunden; die Seite ist auf `noindex` gestellt.

## Gestaltungsidee
Die Seite ist eine Sitzung in der Dunkelkammer. Sie beginnt unter Rotlicht mit einem Kontaktbogen, auf dem sich die Negative zu Positiven entwickeln, dann geht „das Licht an“ – das ganze Kapitel kippt von Dunkelkammer zu Papierweiß, ein Lichtleck läuft durch. Danach folgen die Werkzeuge des Labors: Fettstift-Markierungen, Fadenzähler, Leuchttisch, Filmrolle, Filmdose, Laborauftrag, Rückseiten von Abzügen mit Wasserzeichen, Stempel statt Bewertungs-Kennzahlen. Die Bewegung „entwickelt“ statt einzublenden: Text zieht Schärfe, Bilder kommen über Dichte aus dem Papier oder werden vom Negativ zum Positiv gewischt, Filmstreifen haben Trägheit, Zähler rollen wie Bildzählwerke. Am Ende geht das Licht wieder aus (Anfrage, Footer).

## Abschnitte
Hero (Kontaktbogen unter Rotlicht) · Haltung („Licht an“) · Galerie (Leuchttisch, 4 Rollen + Lightbox) · Love Story (Filmrolle) · Pakete (Labortisch mit Filmdose) + Laufband „Außerdem“ · Verfügbarkeit (Terminbuch mit Fettstift) · Über uns (Rückseiten der Abzüge, Ablauf als Entwicklungszeiten) · Stimmen (Rosé-Kapitel, Stempel) · Atelier & Region (Elbe-Karte) · FAQ · Anfrage („Licht aus“) · Footer. Dazu `impressum.html` und `datenschutz.html` (Muster).

## Spezial-Features
- **Kontaktbogen-Hero (WebGL):** Die drei Filmstreifen werden in einen Atlas gezeichnet; ein eigener Shader zeigt zuerst das orangefarbene Negativ, dann zieht eine Entwicklerwelle mit Schlieren das Positiv hoch, Filmkorn nur während der Entwicklung. Rotlicht liegt als Multiply-Ebene darüber und geht bei „Fixierer“ aus; Fettstift-Kringel, Kreuz und Stempel setzen sich danach. Mit der Maus: **Fadenzähler ×2** (Feder, quadratisches Lupenfenster mit mm-Skala). Beim Wegscrollen: **Lichtleck** vom rechten Filmrand. Dunkelkammer-Uhr (Entwickler/Stoppbad/Fixierer) mit „Noch einmal entwickeln“. Ohne WebGL: CSS-Filter-Entwicklung Bild für Bild; ohne JS/bei reduzierter Bewegung: fertiger Bogen. Handy: eigener Ausschnitt mit einem schräg liegenden Streifen.
- **„Licht an“ (Scroll-Set-Piece):** Sticky-Kapitel, Hintergrund kippt per Scroll von Dunkelkammer zu Papier, Lichtleck läuft durch, danach zieht jedes Wort der Haltung Schärfe; Unterschrift zeichnet sich.
- **Galerie / Leuchttisch:** Kapitel-Tabs (Pfeiltasten, Home/End) mit Fettstift-Unterstrich, justierte Reihen wie ein Kontaktbogen, **FLIP** beim Filtern (Bilder gleiten an ihre neuen Plätze), Zähler rollt. Lightbox als `<dialog>`: Bild **fliegt per FLIP** vom Raster auf den Leuchttisch und zurück, Tastatur (←/→/Home/End/Esc), Wischen mit Geschwindigkeit, Kontaktabzug-Leiste mit Fettstift-Markierung.
- **Love Story / Filmrolle:** Ab 900 px klebt die Bühne (`position: sticky`, kein Pin), der Film läuft aus einer Filmdose (Etikett dreht mit), Scrub mit Nachlauf (Trägheit) und Biegung nach Scrolltempo; jedes Bild wird auf dem Weg vom Negativ zum Positiv „gewischt“, Bildzähler rollt. Unter 900 px: senkrechter Filmstreifen, Bilder entwickeln sich beim Eintreten.
- **Paket-Konfigurator / Filmdose:** Stunden-Regler als Filmstreifen mit Transportrad, Second Shooter, Verlobungsshooting, Album → Preis live (rollende Ziffern) auf einem „Laborauftrag“. Die Szene darüber reagiert: Stunden ziehen den Film aus der Dose, Second Shooter stellt eine zweite Dose dazu, Alben stapeln sich, das Verlobungsfoto liegt dabei. Übernahme ins Anfrageformular.
- **Verfügbarkeits-Check:** Kalender mit Demo-Status frei/angefragt/belegt (belegt = Fettstift-Kreuz, angefragt = Strich), Auswahl wird mit Fettstift umkringelt, große Anzeige „Sa., 17. Oktober 2026 – frei.“, Tastaturbedienung, freie Ausweichtermine, Datum wird ins Formular übernommen.
- **Weitere Set Pieces:** Elbe zeichnet sich mit dem Scroll, Orte tauchen am Fluss auf; Laufband „Außerdem buchbar“ ändert Tempo und Richtung mit dem Scrollen; Ablauf-Linien ziehen sich gestaffelt.
- **Mikro-Interaktionen:** Buchstaben-Rollen in der Navigation, magnetische Buttons (nur feiner Zeiger), Füllung „steigt“ beim Hover wie in der Schale, kontextueller Cursor „Ansehen“ über der Galerie, Fettstift-Rahmen beim Hover, Druckzustände überall.
- **Motion-System:** Kurven und Dauern als CSS-Variablen (`--ease-out`, `--ease-in-out`, `--ease-drawer`, `--dur-press`, `--dur-ui`, `--dur-scene`, `--dur-develop`, `--stagger`), gespiegelt in `main.js`. `?motion=off` schaltet alles ab, `prefers-reduced-motion` bekommt sanfte Überblendungen ohne Bewegung, ohne JS ist alles lesbar.

## Anpassen
- **Name, Telefon, Adresse:** in `index.html` (Header, Kontakt, Footer, JSON-LD) sowie in `impressum.html`/`datenschutz.html` suchen und ersetzen (`0351 555 47 80`, `+493515554780`, `Bautzner Straße 21`).
- **Farben:** CSS-Variablen ganz oben in `style.css` (`--paper`, `--silver`, `--ink`, `--rose`, `--grease` für Fettstift-Rot, `--safelight` für das Rotlicht, `--table` für die Dunkelkammer …).
- **Preise & Rechner:** Konstanten oben in `main.js` (`PREISE`, `ALBUM_TEXT`, `BILDER_PRO_STUNDE`, `SECOND_SHOOTER_FAKTOR`). Die Schnellstart-Pakete stehen als `data-preset="Stunden,SecondShooter,Album,Verlobung"` im HTML.
- **Verfügbarkeit:** `VERFUEGBARKEIT` in `main.js` (Demo-Wahrscheinlichkeiten). Für echte Daten die Funktion `status()` durch eine Liste fester Termine ersetzen.
- **Hero:** `ENTWICKLUNG_MS` (Dauer der Entwicklung) und `LUPE_FAKTOR` in `main.js`. Die Bilder des Kontaktbogens sind normale `<img>` in `.strip-frames` (Hochformate mit Klasse `fr--rot` liegen wie auf einem echten Kontaktbogen quer).
- **Bilder:** liegen als `name-960.webp`/`name-480.webp` in `assets/img/`. Gleichnamig ersetzen oder in `index.html` die Pfade (`src`/`srcset`, `width`/`height`, `--ar` in der Galerie) anpassen. Herkunft und Lizenz: `assets/img/BILDNACHWEIS.md`.

## Lokal starten
```
cd /home/user/Websites && python3 -m http.server 8821
```
Dann http://127.0.0.1:8821/arena/fotografie-lichtwerk/ öffnen. `?motion=off` schaltet alle Animationen ab.
