# Radwerk Oldenburg – Demo „Kette“

Demo-Website für einen **fiktiven** Fahrradladen mit Meisterwerkstatt in Oldenburg (Arena von Filip Kramar). Statisch, ohne Build, ohne externe Requests.

## Gestaltungsidee
„Ausfahrt“: Die Seite ist eine Fahrt aus der Werkstatt in die Stadt. Alles ist gezeichnet wie ein Maßblatt aus der Werkstatt – Asphalt, Kreide, Signal-Türkis und Rost, Bemaßungslinien, Beschnittmarken und eine Prüfplakette statt Sterne-Reihe. Im Hero steht das Rad wörtlich auf „Oldenburg.“, Räder, Kurbel und Kette laufen beim Scrollen mit, der Tacho am Lenker zeigt das Scroll-Tempo, Fahrtwind-Striche werden mit der Geschwindigkeit länger, die Überschrift legt sich in den Wind. Die Bewegungs-Handschrift heißt „Treten & Rollen“: Scroll und Zeiger geben Schwung, alles rollt mit Reibung aus; Bedienelemente rasten dagegen kurz und präzise ein wie eine indexierte Schaltung. Am Ende fährt man auf der Karte vom Hauptbahnhof bis vor die Ladentür.

## Abschnitte
Header (Ketten-Fortschritt) · Hero „Ausfahrt“ (SVG-Rad, Tacho, Prüfplakette, Fahrtwind-Canvas) · Laufband (Tempo folgt der Scroll-Geschwindigkeit) · Sortiment (horizontale Vorbeifahrt mit Tiefen-Parallax) · Werkstatt (Satz setzt sich aus Fragmenten zusammen, Seite wechselt von Asphalt auf Kreide, Preistafel) · Bike-Explorer (Explosionszeichnung) · Rahmengrößen-Rechner (Maßblatt) · E-Bike-Reichweite (Regionalkarte mit Radius) · Werkstatt-Termin (Auftragszettel) · Team (Index-Liste, Odometer im Text) · Stimmen (Siegel) · Anfahrt (Fahrt durch die Oldenburg-Karte) · FAQ · Footer. Dazu `impressum.html`, `datenschutz.html`.

## Spezial-Features
1. **Hero-Fahrrad (SVG):** Rahmen zeichnet sich beim Laden als Linie, Räder, Kurbel (38/16) und Kette laufen scroll-gekoppelt und rollen aus; auf dem Desktop treibt auch horizontale Mausbewegung die Pedale an. Tacho zeigt km/h und ODO.
2. **Rahmengrößen-Rechner:** Körpergröße, Schrittlänge, Radtyp → Rahmenhöhe (cm bzw. Zoll), Größe, Sattelhöhe, Proportions-Hinweis; Fahrer-Silhouette und Rad werden live neu konstruiert.
3. **E-Bike-Reichweite:** Akku, Modus, Gelände, Gewicht, Temperatur → Spanne in km; Karte mit zwei Kreisen (sicher / knapp, halbe Reichweite als Luftlinie) und Ausflugszielen.
4. **Werkstatt-Termin:** Paket + Extras → Tag/Slot → Angaben mit Zusammenfassung und Preis (Demo, nichts wird gesendet).
5. **Bike-Explorer:** Hotspots (Tabs, Pfeiltasten) für Schaltung, Bremse, Motor, Akku, Kette, Reifen; auf dem Desktop zerlegt sich das Rad beim Scrollen in eine Explosionszeichnung, auf dem Handy per Schalter.
6. **Anfahrt:** Route Hbf → Laden zeichnet sich beim Scrollen, die Karte folgt dem Fahrer und zoomt am Ende auf das Gebiet des Hol- & Bringservice.

## Motion-System
Tokens oben in `style.css`: `--ease-out`, `--ease-in-out`, `--ease-drawer`, `--t-click` (Einrasten), `--t-shift` (Gangwechsel), `--t-ride` (Einfahren), `--t-coast` (Ausrollen), `--stagger`. Sticky statt Pin, `?motion=off` bzw. „Bewegung reduzieren“ schaltet alles ab, ohne JS ist alles lesbar.

## Anpassen
- **Name, Telefon, Adresse:** in `index.html` (Header, Kontakt, Footer, JSON-LD), `impressum.html`, `datenschutz.html` suchen/ersetzen (`0441 555 87 30`, `+494415558730`, `Donnerschweer Straße 74`).
- **Farben/Schriften:** CSS-Variablen oben in `style.css` (`--asphalt`, `--chalk`, `--signal`, `--rost` …).
- **Bilder:** `assets/img/<name>-960.webp` und `-480.webp` ersetzen (gleiche Namen), Alt-Texte in `index.html` anpassen. Die Fotos sind als Duoton eingefärbt (siehe BILDNACHWEIS.md).
- **Rechner-Werte:** Konstanten oben in `main.js` – `HERO`, `FRAME`, `RANGE` (inkl. Kartenmaßstab), `BOOKING`, `ROUTE`, `HOURS`. Werkstattpreise stehen zusätzlich als `data-price` an den Paketen in `index.html`.
- **Bike-Explorer-Texte:** Objekt `PARTS` in `main.js` (und Startinhalt im Panel in `index.html`).

## Lokal starten
```
cd /home/user/Websites && python3 -m http.server 8842
```
→ http://127.0.0.1:8842/arena/radwerk-oldenburg/ (`?motion=off` schaltet Animationen ab).

Bildnachweis: `assets/img/BILDNACHWEIS.md`. Schriften: `assets/fonts/LICENSE-*.txt` (SIL OFL).
