# bewegt. Physiotherapie – Modell „Achse“

Demo-Website eines **fiktiven** Physiotherapie-Betriebs in Münster (Arena von Filip Kramar). Statisch, ohne Build, ohne externe Requests.

## Gestaltungsidee
Die Seite ist ein Bewegungsanalyse-Protokoll: Wie beim Motion-Capture werden Gelenkpunkte markiert, Winkel gemessen und Bahnen aufgezeichnet – und genau diese Werkzeuge sind die Ornamente. Die Überschrift im Hero steht auf demselben Boden wie die Linien-Figur, die live eine Treppenstufe nimmt; Knie- und Hüftwinkel laufen als Messwerte mit, Bewertung, Kassen und Öffnungszeiten sind Teil der Zeichnung (Siegel, Zeitlineal). Jede Überschrift hängt an einem Gelenkpunkt und schwenkt beim Erscheinen um ihn wie ein Hebel, der Weg vom Rezept bis zum Laufen ist als Chronofotografie (Marey) mit der Bahn der Hüfte gezeichnet. Viel Kalkweiß, Millimeterraster, Beschnittmarken und Petrol-Duoton halten alles klinisch präzise.

**Motion-System „Tempo 2-1-3“** (wie eine saubere Übungsausführung): Dinge heben sich konzentrisch in Position (`--t-konz`, `--ease-out`), halten kurz und senken sich exzentrisch langsamer (`--t-exz`, `--ease-in-out`). Alle Kurven/Dauern stehen als CSS-Variablen oben in `style.css`; UI-Feedback bleibt unter 300 ms.

## Abschnitte
Header (Navigation mit rollenden Links) · Kapitel-Achse rechts (Desktop, mit kleiner Figur, die beim Scrollen turnt) · Hero „Wieder Treppe ohne Geländer.“ mit Messlabor · Maßband (Laufband, reagiert auf Scroll-Tempo) · Therapien (Index-Tabs) · Körperkarte „Wo zwickt es?“ · Ihr Weg (Bewegungskurve, sticky) · Übungs-Player (Kapitel Petrol) · Rezept-Rechner mit Waage · Praxis & Team (Satz baut sich Wort für Wort auf, Messprotokoll) · Stimmen mit Goniometer · Anfahrt (SVG-Karte) · FAQ (Gelenk-Symbol) · Terminanfrage · Footer. Dazu `impressum.html` und `datenschutz.html` (Muster).

## Spezial-Features
- **Hero-Figur**: SVG-Skelett aus Gelenkpunkten (`assets/figur.js`, 2D-Kinematik mit Knie-IK und Stufenhöhe je Fuß) steigt eine Stufe hinauf und hinunter; Kniebahn, Kniewinkel-Bogen, Lot und drei Live-Messwerte werden nachgeführt, die Maus verändert die Pose über eine Feder. Die Figur zeichnet sich beim Laden selbst (CSS, < 1 s), der Text steht sofort.
- **Körperkarte**: Figur vorn/hinten (Drehung um die Körperachse), Regionen als Radiogruppe (Klick, Tab, Pfeiltasten) → Ursachen, Therapien (springen in die Tabs), Beispielübung. Eine Messlinie zeichnet sich vom Punkt zur Überschrift. Klar als Orientierung gekennzeichnet.
- **Ihr Weg**: sechs Etappen als eine Bewegungskurve. Auf Desktop läuft die Figur per Scroll (sticky + GSAP-Scrub, kein Pin) vom Sitzen bis zum Laufen und hinterlässt Stroboskop-Abbilder; auf dem Handy eine Wisch-Schiene mit je einer Pose.
- **Übungs-Player**: drei Übungen mit animierter Figur, gestrichelten Bahnen von Hand/Knie/Hüfte, Live-Gelenkwinkel, Tempo-Leiste (heben/halten/senken), Schritt-Hervorhebung, Start/Pause, Ziel-Wiederholungen.
- **Rezept-Rechner**: Kassenrezept (10 € je Verordnung + 10 %) gegen Selbstzahler, Zuzahlungsbefreiung; eine Balkenwaage neigt sich zur teureren Seite.
- **Therapien-Explorer**: Tabs mit Pfeiltasten (alle Richtungen)/Home/End, Dauer, Ablauf, „geeignet für“.

## Anpassen
- **Name, Telefon, Adresse, Zeiten**: in `index.html` (inkl. JSON-LD im `<head>`), `impressum.html`, `datenschutz.html` suchen und ersetzen (`0251 555 46 20`, `+492515554620`, `Hammer Straße 88`). Das Zeitlineal und das Siegel im Hero sind SVG-Text in `index.html`.
- **Farben/Schriften/Bewegung**: CSS-Variablen oben in `style.css` (`--kalk`, `--petrol`, `--coral`, `--ink`, `--t-konz`, `--ease-out` …).
- **Bilder**: `assets/img/<name>-480.webp` und `-960.webp` ersetzen (gleiche Namen) – Quellen in `assets/img/BILDNACHWEIS.md`. Fotos werden per CSS als Petrol-Duoton gezeigt (`.duo`).
- **Rechner-Werte**: Konstanten `PREISE`, `ZUZAHLUNG_PAUSCHALE`, `ZUZAHLUNG_ANTEIL`, `WAAGE_MAX_GRAD` oben in `main.js`.
- **Körperkarte**: Texte im Objekt `REGIONEN` in `main.js`; Übungs-Posen und Tempo in `SEQ`, Weg-Posen in `WEG` in `assets/figur.js`, Phasen-Texte in `PHASEN` in `main.js`.
- **Statische Figuren** (sichtbar auch ohne JavaScript) sind mit `figur.js` vorberechnet und stehen direkt im HTML; nach Posen-Änderungen dort neu erzeugen (`Figur.markup(pose)` liefert das SVG-Markup).

## Lokal starten
```
cd /home/user/Websites && python3 -m http.server 8903
# http://127.0.0.1:8903/arena/physio-bewegt/   (?motion=off schaltet Animationen ab)
```

Schriften (Instrument Serif/Sans, OFL) liegen selbst gehostet in `assets/fonts/`.
