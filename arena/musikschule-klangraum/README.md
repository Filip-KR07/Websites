# Klangraum Musikschule – Demo „Takt“

Fiktive Demo-Website einer Musikschule in Mainz (Arena von Filip Kramar). Statisch, ohne Build, ohne externe Requests. `noindex`.

## Gestaltungsidee
Die ganze Seite ist eine Partitur. Die Hero-Überschrift steht als Melodie auf Notenlinien – jedes Wort auf seiner Tonhöhe, mit Taktstrichen, 4/4-Vorzeichen und einem roten Taktstrich, der im eingestellten Tempo läuft. Wer Klaviatur oder Sequencer spielt, spielt die Überschrift: Wörter unter dem Taktstrich springen, Klangwellen laufen über die Linien. Die Abschnitte sind mit Studierbuchstaben (A–I) markiert wie in Orchesterstimmen. Der Kursplan wird zur Wochen-Partitur, der Instrumenten-Finder zum Klangbaum und die Lehrkräfte zu Plattenhüllen mit Hörprobe. Die Bewegung folgt einer Handschrift: „Anschlag und Ausklingen“, also schneller Anschlag und langes Ausklingen, alles im Takt. Der Tempo-Regler setzt `--bpm` für die ganze Seite (Metronom im Header, Taktstrich, Einzählen am Schluss), und Auftritte beim Scrollen landen auf der nächsten Achtel.

## Abschnitte
Header (Navigation mit Zeichen-Rollen, Metronom, Telefon, „Probestunde“) · Hero „Partitur“ mit Klangpult und Klaviatur über die volle Breite · Laufband (reagiert auf Scroll-Tempo) · A Instrumente als Register (Hover-Vorschau folgt dem Zeiger) · B Klangbaum (Finder, Kapitel Kobalt) · C Kursplan als Partitur · D Lehrkräfte als Plattenkiste (Kapitel Tinte) · E Probestunde als Eintrittskarte · F Schule mit Besetzungsliste (Odometer) und Fotos mit Beschnittmarken · „Nie zu spät“ (Kapitel Sonne, Buchstaben setzen sich zusammen) · G Stimmen als Liner Notes mit goldener Schallplatte (4,9 ★) · H Anfahrt mit SVG-Karte (Fußweg zeichnet sich) · I FAQ · Schluss „Eins, zwei, drei, los.“ (Einzählen im Tempo) · Footer „Fine.“ Dazu `impressum.html` und `datenschutz.html`.

## Spezial-Features
1. **Klangpult (Hero):** Klaviatur (Maus, Touch, Tastatur A–K, schwarze Tasten W E T Z U), 8-Schritt-Sequencer in grafischer Notation (Bass = Notenkopf, Snare = Raute, Hi-Hat = Kreuz) mit Tempo-Regler. Der Canvas-Visualizer zeichnet farbige Wellen auf die Notenlinien der Überschrift, die getroffenen Wörter springen. WebAudio startet erst nach der ersten Nutzeraktion; „Ton aus“ lässt alles stumm bedienbar (Anzeige, Wörter und Wellen laufen weiter).
2. **Klangbaum (Finder):** Alter, Wunsch, Übezeit → sieben Äste, deren Stärke die Passung zeigt; Vorschlag mit Begründung, passendem Kurs aus dem Kursplan und Alternativen; Übergabe an die Buchung. Der Baum zeichnet sich beim Scrollen.
3. **Kursplan als Partitur:** Wochentage als Notensysteme, Kurse als Takte auf einer Zeitachse 14–21 Uhr, Samstag als „Coda“. Filter (Instrument, Alter, Niveau); am Desktop läuft ein Taktstrich mit dem Scroll durch den Nachmittag und hebt laufende Kurse hervor (Sticky-Sektion, kein Pin). Am Handy Tages-Tabs (Pfeiltasten) mit Trefferzahlen.
4. **Probestunde buchen:** Instrument → Lehrkraft → Termin (deterministisch erzeugte Slots) → Kontakt → Bestätigung mit Stempel und Zusammenfassung („Demo – es wurde nichts gesendet“). Fortschritt als vier Notenköpfe in einem Takt.
5. **Lehrkräfte als Plattenhüllen:** eigene Cover-Grafik mit Monogramm je Lehrkraft; „Hörprobe“ spielt eine kurze, im Browser erzeugte Tonfolge, dabei rutscht die Platte aus der Hülle und dreht sich. Desktop: horizontale Strecke, die Platte in der Bildmitte schaut weiter heraus.

## Anpassen
- **Name, Adresse, Telefon:** in `index.html`, `impressum.html`, `datenschutz.html` (inkl. JSON-LD im `<head>`) suchen und ersetzen.
- **Farben/Schriften/Bewegung:** CSS-Variablen ganz oben in `style.css` (`--paper`, `--ink`, `--tomato`, `--cobalt`, `--sun` …, Dauern `--t-*`, Kurven `--ease-*`, Starttempo `--bpm`).
- **Bilder:** `assets/img/<name>-960.webp` und `-480.webp` ersetzen (gleicher Name). Nachweis: `assets/img/BILDNACHWEIS.md`.
- **Kurse:** direkt im HTML (`#kursplan`): `--cs` = Startspalte in Viertelstunden ab 14 Uhr (+1; Samstag ab 9:30 Uhr), `--cl` = Dauer in Viertelstunden, `data-instr/age/level` für die Filter.
- **Finder-Gewichte, Lehrkräfte, Terminzeiten, Sequencer-Muster, Tonfolgen:** als Konstanten oben in `main.js`.

## Lokal starten
```
cd /home/user/Websites && python3 -m http.server 8000
# http://127.0.0.1:8000/arena/musikschule-klangraum/
```
`?motion=off` schaltet alle Animationen ab; `prefers-reduced-motion` wird respektiert (sanfte Überblendungen statt Bewegung). Ohne JavaScript sind alle Inhalte lesbar.

Schriften: Syne und Figtree (SIL OFL, selbst gehostet, Lizenzen in `assets/fonts/`).
