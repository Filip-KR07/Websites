# Tanzschule Taktvoll – Modell „Drehung“

Demo-Website für einen **fiktiven** Betrieb (Tanzschule in Augsburg) aus Filip Kramars Arena. Statisch, ohne Build, ohne externe Requests.

## Gestaltungsidee
Die Seite ist ein Ballabend in Akten: Ein Vorhang öffnet die Bühne, ein Verfolgerspot sucht die Tanzfläche ab, und zwischen den Kapiteln fällt der Vorhang erneut. Alles, was man auf einem Ball in der Hand hält, wird zur Oberfläche – das Programmheft (Kurse), die Tischkarte (Tanz-Finder), die Tanzkarte mit Bleistift (Kursplan), die Schallplatte mit Preisaufkleber (Hochzeitstanz). Die Bewegung zählt mit: Jede Choreografie folgt dem Dreivierteltakt – die „1“ ist betont (weiter, mit Schwung), „2“ und „3“ folgen leicht; ein Schlag dauert 420&nbsp;ms (`--beat`). Typografie dreht und schwingt (Buchstaben von „drehen“, Rueda-Kreis des Teams, Gewichtsachse der Zählzeiten), Fotos sind einheitlich in Pflaume-Magenta-Champagner getont, Bewertungen stehen als Tintenstempel statt als Zahlenreihe.

## Abschnitte
Header mit Menü und Probestunden-CTA · Hero („Erst zählen. Dann drehen.“) · Takt-Band · Kurse (horizontale Strecke) · Tanz-Finder · Schritt-Lehrer · Kursplan · Hochzeitstanz-Paket · Team · Tanzparty · Stimmen · Anfahrt mit SVG-Skizze · FAQ · Anmeldung · Footer. Dazu `impressum.html` und `datenschutz.html` (Muster).

## Spezial-Features
- **Hero-Spotlight**: folgt der Maus mit Nachlauf, auf Touch wandert es langsam (CSS). Fußspuren tanzen eine Drehung über die Fläche (SVG, CSS-Animation, pausiert außerhalb des Viewports).
- **Tanz-Finder**: Anlass + Erfahrung (bei Kindern: Alter) → Kursvorschlag mit Link in den Kursplan und Vorauswahl im Formular.
- **Schritt-Lehrer**: Walzer, Cha-Cha, Discofox als animierte Fußspuren mit Zählzeiten, BPM-Regler, Start/Pause, Rolle Führen/Folgen, optionaler Klick-Ton.
- **Kursplan**: Wochentag-Tabs (Pfeiltasten), Niveau-Filter, freie Plätze. Ohne JavaScript werden alle Tage untereinander gezeigt.
- **Hochzeitstanz-Konfigurator**: Stunden, Wunschlied, Tempo, Stil, Extras → Preis (Beispielrechnung), drehende Schallplatte mit Ihrem Liedtitel.
- Horizontale Kurs-Strecke über `position: sticky` + ScrollTrigger-Scrub (kein Pin), auf < 900 px Wisch-Schiene.

## Anpassen
- **Name, Telefon, Adresse**: in `index.html` (Header, Kontakt, Footer, JSON-LD) sowie `impressum.html`/`datenschutz.html` suchen und ersetzen (`0821 555 74 10`, `tanzen@taktvoll.de`, `Provinostraße 52`).
- **Farben/Schriften**: CSS-Variablen oben in `style.css` (`--plum`, `--magenta`, `--champagne` …).
- **Bilder**: `assets/img/<name>-960.webp` und `-480.webp` austauschen (gleiche Namen), Alt-Texte in `index.html` anpassen.
- **Preise, Tempi, Kursvorschläge**: Konstanten oben in `main.js` (`WED_*`, `DANCES`, `FINDER`).
- **Kursplan**: direkt als Liste in `index.html` (`.plan-item` mit `data-level`), Tageszähler passt JavaScript an.

## Lokal starten
```
cd /home/user/Websites && python3 -m http.server 8841
# http://127.0.0.1:8841/arena/tanzschule-taktvoll/   (?motion=off schaltet Animationen ab)
```

Fotos: StockSnap (CC0), Nachweis in `assets/img/BILDNACHWEIS.md`. Schriften: Big Shoulders Display, Plus Jakarta Sans (OFL, Lizenzen in `assets/fonts/`).
