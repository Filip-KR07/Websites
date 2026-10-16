# Weingut Steinlage – Modell „Terroir“

Demo-Website für einen **fiktiven** Familienbetrieb in Deidesheim (Pfalz). Teil der Arena-Sammlung von Filip Kramar. Statisch, ohne Build-Schritt, keine externen Requests, `noindex`.

## Abschnitte
Header mit Fortschrittslinie · Hero (Canvas + Bildkomposition) · Rebsorten-Band · Lagen-Karte · Wein-Finder · „Ein Jahr im Weinberg“ · Weinprobe buchen · Vinothek/Hoffest/Lagenpaket · Familie Hartleb · Gästestimmen · Vinothek & Anfahrt (Öffnungsstatus, SVG-Lageskizze) · FAQ · Abschluss-CTA · Footer. Dazu `impressum.html`, `datenschutz.html`.

## Spezial-Features
1. **Hero-Canvas**: Höhenlinien (einmal vorgerendert) und Rebzeilen, die sich im Wind wiegen und per Feder der Maus ausweichen; 30 fps, pausiert außerhalb des Bildes / bei verstecktem Tab, statisch bei reduzierter Bewegung.
2. **Lagen-Karte** (SVG): 5 Lagen per Klick auf der Karte oder per Tabs (Pfeiltasten) → Boden, Ausrichtung, Höhe, Rebsorte, typischer Wein.
3. **Wein-Finder**: Anlass, Essen, Süße- und Körper-Regler → Empfehlung als Etikett mit Preis und Alternative (live, `aria-live`).
4. **Weinprobe buchen**: Datum (Mo/Di gesperrt), Uhrzeiten je Wochentag, Personen 2–24, Paket, Vesper → Live-Zusammenfassung mit Preis, Validierung, Erfolgsansicht („Demo – es wurde nichts gesendet“).
5. **„Ein Jahr im Weinberg“**: Desktop sticky + Scrub (ohne GSAP-Pin), Handy Wisch-Schiene mit Scroll-Snap.

## Anpassen
- **Name, Telefon, Adresse**: in `index.html`, `impressum.html`, `datenschutz.html` suchen/ersetzen (`06326 555 19`, `tel:+49632655519`, `Weinstraße 23`), JSON-LD im `<head>`.
- **Farben/Schriften**: CSS-Variablen oben in `style.css` (`--kalk`, `--wine`, `--green`, `--gold`, `--gold-t` …).
- **Bilder**: `assets/img/<name>-960.webp` und `-480.webp` ersetzen (gleiche Namen), siehe `assets/img/BILDNACHWEIS.md`.
- **Preise, Zeiten, Weine**: Konstanten oben in `main.js` (`PAKETE`, `VESPER_PREIS`, `SLOTS`, `OEFFNUNG`, `WEINE`).
- `?motion=off` schaltet alle Animationen ab.

## Lokal starten
```
cd /home/user/Websites && python3 -m http.server 8804
# http://127.0.0.1:8804/arena/weingut-steinlage/
```

Schriften: Gloock und Hanken Grotesk (SIL OFL, selbst gehostet, Lizenzen in `assets/fonts/`). Fotos: StockSnap CC0, siehe `assets/img/BILDNACHWEIS.md`.
