# Weingut Steinlage – Modell „Terroir“

Demo-Website für einen **fiktiven** Familienbetrieb in Deidesheim (Pfalz). Teil der Arena-Sammlung von Filip Kramar. Statisch, ohne Build-Schritt, keine externen Requests, `noindex`.

## Gestaltungsidee
Die Seite ist ein Kartenblatt des Hangs über Deidesheim, gedruckt auf Kalksteinpapier wie ein Weinetikett. Statt Fotos in Bögen und Kartenrastern erzählen Höhenlinien, Parzellen, ein Geländeschnitt A–B und eine Sonnenbahn, warum jeder Wein nach seiner Lage schmeckt. Die Typografie kommt vom Etikett: Gloock mit leichter Prägung (Licht oben, Schatten unten), Blindprägung beim Jahrgang, Goldfolie auf der Jahreszahl, Beschnittmarken an den Karten. Die Bewegungs-Handschrift „Hanglicht“ ist langsam und gesetzt: Linien zeichnen sich, Licht wandert über die Hänge, Schrift hebt sich Wort für Wort aus dem Satz, Bilder öffnen sich wie ein Abzug aus der Presse.

## Abschnitte
Header (Zeichen-Rollen, Fortschrittslinie) · Hero „Schmecken Sie den Hang.“ (Lagenkarte, Etikett mit Glas, Geländeschnitt, Zeichenerklärung) · Lagen-Karte · Wein-Finder im Keller · „Ein Jahr im Weinberg“ als Sonnenbahn · Weinprobe buchen (Probenkarte) · Auf dem Hof (Vinothek, Hoffest, Lagenpaket) · Familie Hartleb mit Jahrgangszähler · Gästebuch · Vinothek & Anfahrt · Fragen · Abschluss mit Blindprägung · Footer. Dazu `impressum.html`, `datenschutz.html`.

## Spezial-Features
1. **Hero-Lagenkarte (Canvas)**: Höhenfeld mit Höhenlinien (Marching Squares, zeichnen sich beim Laden vom Haardtrand hinab), Waldsignatur, Weinstraße, Schnitt A–B und fünf Parzellen, deren Höhe den echten Lagen entspricht. Die Rebzeilen wiegen sich im Wind und weichen per Feder der Maus aus; das Licht (Schummerung) wandert langsam über den Hang und folgt auf dem Desktop dem Zeiger, ein Höhenmesser zeigt die Höhe unter dem Zeiger. 24 fps, pausiert außerhalb des Bildes und bei verstecktem Tab; statisch bei reduzierter Bewegung. Daneben das Etikett mit Glas (leichtes Kippen mit Feder) und der Geländeschnitt mit Rebzeilen-Foto.
2. **Lagen-Karte** (SVG): Höhenlinien zeichnen sich mit dem Scroll, dann erscheinen die Parzellen. 5 Lagen per Klick auf die Karte (zoomt hin, erneuter Klick zoomt heraus) oder Tabs (Pfeiltasten) → Boden, Ausrichtung, Höhe (Höhenmesser-Skala), Rebsorte, typischer Wein.
3. **Wein-Finder**: Anlass, Essen, Süße- und Körper-Regler → Empfehlung als Etikett mit Preis und Alternative (`aria-live`). Das Glas füllt sich beim Hereinscrollen und wird bei jeder neuen Empfehlung in der Farbe des Weins nachgeschenkt (Sekt mit Perlage).
4. **Weinprobe buchen**: Datum (Mo/Di gesperrt), Uhrzeiten je Wochentag, Personen 2–24, Paket, Vesper → Probenkarte mit Live-Preis, Validierung, Erfolgsansicht („Demo – es wurde nichts gesendet“).
5. **„Ein Jahr im Weinberg“ als Sonnenbahn**: Desktop sticky + Scrub (ohne GSAP-Pin), Handy Wisch-Schiene mit Scroll-Snap. Eine Sonne läuft auf der berechneten Mittagshöhe über Deidesheim (49,4° N), Anzeige von Monat, Sonnenhöhe und Tageslänge, der Hintergrund wechselt mit den Jahreszeiten.
6. **Jahrgangszähler**: Ziffernrollen laufen beim Scrollen von 1898 bis 2025.

## Anpassen
- **Name, Telefon, Adresse**: in `index.html`, `impressum.html`, `datenschutz.html` suchen/ersetzen (`06326 555 19`, `tel:+49632655519`, `Weinstraße 23`), JSON-LD im `<head>`.
- **Farben/Schriften/Bewegung**: CSS-Variablen oben in `style.css` (`--kalk`, `--wine`, `--green`, `--gold`, `--gold-t` …, Motion-Tokens `--ease-*`, `--d-*`).
- **Bilder**: `assets/img/<name>-960.webp` und `-480.webp` ersetzen (gleiche Namen), siehe `assets/img/BILDNACHWEIS.md`.
- **Preise, Zeiten, Weine, Lagen**: Konstanten oben in `main.js` (`PAKETE`, `VESPER_PREIS`, `SLOTS`, `OEFFNUNG`, `WEINE` inkl. Glasfarbe, `LAGEN`/`LAGEN_M` für die Hero-Karte, `BREITE` für die Sonnenbahn).
- `?motion=off` schaltet alle Animationen ab.

## Lokal starten
```
cd /home/user/Websites && python3 -m http.server 8922
# http://127.0.0.1:8922/arena/weingut-steinlage/
```

Schriften: Gloock und Hanken Grotesk (SIL OFL, selbst gehostet, Lizenzen in `assets/fonts/`). Fotos: StockSnap CC0, siehe `assets/img/BILDNACHWEIS.md`.
