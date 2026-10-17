# Falk & Partner Steuerberatung – Demo „Bilanz“

Demo-Website für eine **fiktive** Steuerberatungskanzlei in Hannover-List (Podbielskistraße 33). Teil der „Arena“ von Filip Kramar. Alle Namen, Zahlen, Bewertungen und Termine sind erfunden, die Seite steht auf `noindex`.

## Gestaltungsidee

Die Seite ist ein Kontenbuch: linierte Blätter, grüne Randlinien, Spaltenlinien, Summenstriche – und diese Linien ziehen sich beim Scrollen wie mit der Reißfeder durch die Kapitel. Der Hero ist eine Addiermaschine, deren Rechenstreifen sich ausdruckt: Ziffern tippen sich, das Summenzählwerk rollt, am Ende landet der Stempel „ausgeglichen“ mit dem heutigen Datum. Jedes Werkzeug der Kanzlei bekommt seine Form aus dem Büroalltag: der Wegweiser als T-Konto (links, was wir übernehmen, rechts, was Sie liefern), die Checkliste als Leitz-Ordner mit Register, der Fristenkalender als Abreißkalender, Mandantenstimmen als Kassenbelege, das Anfrageformular als Vordruck mit Zeilennummern. Die Bewegung ist „getaktet“: kurze, präzise Anschläge wie an der Rechenmaschine, Papiervorschub Zeile für Zeile, nichts schwebt oder pulsiert.

## Abschnitte

Hero (Rechenstreifen + Kontenzeile mit nächster Steuerfrist) · Leistungen (Kontenrahmen, 9 Positionen) · Mandanten-Wegweiser (T-Konto) · Unterlagen-Checkliste (Ordner mit Register) · Digitaler Ablauf (Sticky-Storytelling) · Fristen (Abreißkalender + Jahres-Zeitleiste) · Kanzlei & Team (Partner, Konto Team, Kanzleijournal, Grundsätze) · Mandantenstimmen (Belege) · Standort (SVG-Karte) · Karriere · FAQ · Kontakt/Erstgespräch (Vordruck) · Footer. Dazu `impressum.html` und `datenschutz.html` (Muster).

## Spezial-Features

- **Hero-Bilanz als Rechenstreifen:** Der Streifen schiebt sich Zeile für Zeile aus der Maschine, die Beträge tippen sich (CSS `steps()`), bei jedem „+“ bzw. „*“ wird die passende Taste gedrückt und das Summenzählwerk (Odometer mit führenden Nullen, rollt immer vorwärts) springt weiter. Trennlinien und Doppelstrich zeichnen sich, zum Schluss Stempel „ausgeglichen · geprüft · <heutiges Datum>“. Knopf „Streifen abreißen, neu rechnen“ reißt den Streifen ab und rechnet neu.
- **Mandanten-Wegweiser:** Tabs Privat / Selbstständig / GmbH / Verein (Pfeiltasten, Home/End) als T-Konto mit Leistungen, Unterlagen, Fristen und Deep-Links zur passenden Checkliste bzw. zum vorausgefüllten Formular.
- **Unterlagen-Checkliste als Ordner-Register:** Der marmorierte Ordnerdeckel klappt beim Hineinscrollen auf (bleibt danach offen, öffnet sich bei Scroll-Pause selbst). Register-Reiter A–D wechseln das Blatt, Haken werden handgezeichnet, erledigte Zeilen durchgestrichen. Fortschrittsbalken in Zehnerschritten, Stempel bei „vollständig“, Zurücksetzen, Drucken (nur die Liste). Gespeichert wird ausschließlich im Browser (`localStorage`).
- **Digitaler Ablauf:** Upload → Prüfung → Erklärung → Bescheid-Check. Desktop: Sticky-Bühne (`position: sticky`, kein GSAP-Pin) mit Zählwerk „01/04“, klickbarer Schrittleiste und animierten Vignetten. Handy: untereinander, Animation beim Einblenden.
- **Fristenkalender:** Abreißkalender mit „Heute“ und den nächsten sechs Fristterminen (Ampelband, Kalenderwoche, „in X Tagen“) – auf dem Desktop reißen die Blätter beim Scrollen ab, sonst per Knopf (erstes Blatt reißt einmal von selbst ab). Darunter die Jahres-Zeitleiste mit sechs Spuren, Heute-Linie, Ampel, „Nächste Frist in X Tagen“ als Zählwerk, Filter nach Mandantentyp, monatlich/vierteljährlich, Dauerfristverlängerung, Werktags-Verschiebung (Wochenende, Feiertage Niedersachsen), Detailtafel, Tastaturbedienung und vollständige Liste. Klar als Orientierung gekennzeichnet.
- **Kontenblatt-Linien:** Randlinie und Spaltenlinien je Kapitel zeichnen sich mit dem Scrollen (CSS Scroll-driven Animations, ohne Unterstützung statisch).
- Details: Vorschaubild folgt in den Leistungen dem Mauszeiger (Feder), Navigation mit Zeichen-Rollen, magnetische Haupttaste, Tasten mit mechanischem Anschlag, Links mit doppeltem Summenstrich, der sich neu zieht, Prägesiegel drehen beim Scrollen, Duoton-Fotos mit Beschnittmarken, Papier- und Stempeltextur (SVG), Kanzleijournal mit rollenden Kennzahlen, „Jetzt erreichbar“-Status, Karte mit Route, mobile Aktionsleiste (Anrufen / Erstgespräch).

## Motion-System

Kurven und Dauern als CSS-Variablen oben in `style.css`: `--ease-out`, `--ease-in-out`, `--ease-drawer`, `--t-tap` (Tastenanschlag), `--t-ui`, `--t-feed` (Papiervorschub), `--t-draw` (Linie ziehen), `--t-reveal`, `--stagger`. Überschriften ziehen ein wie eine gedruckte Zeile (clip-path), Tabellenzeilen im Takt, Absätze nur sanft. Hover nur bei feinem Zeiger. `?motion=off` schaltet alles ab, `prefers-reduced-motion` zeigt Endzustände mit sanften Überblendungen.

## Anpassen

- **Name, Telefon, Adresse, Öffnungszeiten:** direkt in `index.html` (Header, Hero-Kontenzeile, Kontakt, Footer, JSON-LD im `<head>`), `impressum.html`, `datenschutz.html`. Öffnungszeiten für den Live-Status: `HOURS` oben in `main.js`.
- **Farben:** CSS-Variablen oben in `style.css` (`--green`, `--paper`, `--ink`, `--mint`, Lineatur `--rule-*`, Ampel `--amp-*`).
- **Rechenstreifen:** Zeilen in `index.html` (`.tape`); jede Buchungszeile trägt ihren Betrag in `data-v` (Euro, ganzzahlig), Summenzeilen `data-total`, die Löschzeile `data-clear`. Tempo: `TAPE_CHAR_MS`, `TAPE_STRIKE_MS`, `TAPE_START_MS` oben in `main.js`.
- **Fristen:** Konstanten oben in `main.js` – `LANES`, `AMPEL_ROT_TAGE`, `AMPEL_GELB_TAGE`, `BERATER_FRIST`, `PAD_LEAVES` (Blätter im Abreißkalender). Die Termine erzeugt `buildEvents()`; die statische Liste im HTML ist nur der Fallback ohne JavaScript.
- **Checklisten & Wegweiser:** Einträge direkt im HTML (`.ck-list`, `.ww-panel`). Neue Checkbox = neue eindeutige `data-id`.
- **Bilder:** `assets/img/<name>-duo-960.webp` und `-duo-480.webp` ersetzen (gleiche Namen) oder Pfade/`srcset` im HTML anpassen. Fotos werden nie breiter als 960 CSS-px dargestellt.

## Lokal starten

```
cd /home/user/Websites && python3 -m http.server 8912
```
Dann http://127.0.0.1:8912/arena/steuer-falk/ öffnen. `?motion=off` schaltet alle Animationen ab.

## Technik & Hinweise

Statisch, ohne Build. GSAP 3 + ScrollTrigger und Lenis liegen unter `assets/vendor/`, Schriften (nur `latin`, OFL) unter `assets/fonts/`. Keine externen Requests, keine Cookies, kein Canvas/WebGL nötig – alles CSS/SVG. Start in Etappen (erster Bildschirm sofort, Rest in kleinen Häppchen), Sticky statt Pin. Ohne JavaScript und bei `prefers-reduced-motion` bleibt alles sichtbar und bedienbar (Wegweiser zeigt dann alle Typen, Register per CSS, Fristen als Liste).

Bildquellen: siehe `assets/img/BILDNACHWEIS.md` (StockSnap, CC0; Duoton-Fassungen abgeleitet).
