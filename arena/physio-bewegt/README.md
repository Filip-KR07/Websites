# bewegt. Physiotherapie – Modell „Achse“

Demo-Website eines **fiktiven** Physiotherapie-Betriebs in Münster (Arena von Filip Kramar). Statisch, ohne Build, ohne externe Requests.

## Abschnitte
Header mit Scroll-Fortschritt · Hero mit Linien-Figur · Kurzleiste · 01 Therapien (Tabs) · 02 Körperkarte „Wo zwickt es?“ · 03 Ihr Weg (horizontale Strecke) · 04 Übungs-Player · 05 Rezept-Rechner · 06 Praxis & Team · 07 Stimmen · 08 Anfahrt (SVG-Karte) · 09 FAQ · 10 Terminanfrage · Footer. Dazu `impressum.html` und `datenschutz.html` (Muster).

## Spezial-Features
- **Hero-Figur**: SVG-Skelett aus Gelenkpunkten (`assets/figur.js`, 2D-Kinematik mit Knie-IK) macht eine Kniebeuge mit Armheben; Handgelenk-Bogen und Kniewinkel werden live nachgezeichnet, die Maus verändert die Pose über eine Feder.
- **Körperkarte**: Figur vorn/hinten, Regionen als Radiogruppe (Klick, Tab, Pfeiltasten) → Ursachen, Therapien (springen in die Tabs), Beispielübung. Klar als Orientierung gekennzeichnet.
- **Rezept-Rechner**: Kassenrezept (10 € je Verordnung + 10 %) gegen Selbstzahler, Zuzahlungsbefreiung.
- **Übungs-Player**: drei Übungen mit animierter Figur, Phasenanzeige, Schritt-Hervorhebung, Start/Pause, Ziel-Wiederholungen.
- **Therapien-Explorer**: Tabs mit Pfeiltasten/Home/End, Dauer, Ablauf, „geeignet für“.
- Horizontale Ablauf-Strecke per `position: sticky` + GSAP-Scrub (nur ≥ 900 px), Lenis-Smooth-Scroll, Reveals, Bild-Parallaxe.

## Anpassen
- **Name, Telefon, Adresse, Zeiten**: in `index.html` (inkl. JSON-LD im `<head>`), `impressum.html`, `datenschutz.html` suchen und ersetzen (`0251 555 46 20`, `+492515554620`, `Hammer Straße 88`).
- **Farben/Schriften**: CSS-Variablen oben in `style.css` (`--kalk`, `--petrol`, `--coral`, `--ink` …).
- **Bilder**: `assets/img/<name>-480.webp` und `-960.webp` ersetzen (gleiche Namen) – Quellen in `assets/img/BILDNACHWEIS.md`.
- **Rechner-Werte**: Konstanten `PREISE`, `ZUZAHLUNG_PAUSCHALE`, `ZUZAHLUNG_ANTEIL` oben in `main.js`.
- **Körperkarte**: Texte im Objekt `REGIONEN` in `main.js`; Übungs-Posen und Tempo in `SEQ` in `assets/figur.js`, Phasen-Texte in `PHASEN` in `main.js`.

## Lokal starten
```
cd /home/user/Websites && python3 -m http.server 8802
# http://127.0.0.1:8802/arena/physio-bewegt/   (?motion=off schaltet Animationen ab)
```

Schriften (Instrument Serif/Sans, OFL) liegen selbst gehostet in `assets/fonts/`.
