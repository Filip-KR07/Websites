# Trattoria Nonna Rosa – Demo-Website (Modell „Tavola“)

Fiktiver Beispielbetrieb für die Arena von Filip Kramar: eine Familien-Trattoria in Stuttgart-Mitte
(Hauptstätter Straße 57). Statische Seite ohne Build-Schritt – HTML, CSS, JavaScript. Alle Namen, Daten
und Bewertungen sind erfunden; `noindex` ist gesetzt.

## Gestaltungsidee

**Der gedeckte Tisch, von oben gesehen.** Die Seite beginnt als Tischplatte: Leinen mit Karo-Läufer, freigestellte Teller,
ein Weinglas, Besteck, Nudelholz und Basilikum als eigene Tuschezeichnungen – und die Speisekarte, auf der die Hauptaussage
gedruckt steht. Alles danach ist Material aus dieser Küche: das bemehlte Knetbrett, Marcos Kreidetafel, eine gedruckte Karte
auf rotem Tischtuch, Rosas Fotoalbum, ein Küchenbon als Stellenanzeige, Stempel statt Kennzahlen. Die Bewegungs-Handschrift heißt
„Gezeichnet, dann gedeckt“: Erst zieht die Tusche ihre Linie (`--ease-in-out`), dann wird etwas abgestellt (`--ease-drawer`) –
mit einer Feder, die nachgibt wie Teig. Das Licht über dem Tisch folgt der Maus, die Schatten fallen entsprechend.

## Abschnitte

1. Header (Live-Öffnungsstatus in der Karte, Telefon, „Reservieren“); Navigation mit rollender Handschrift beim Hover
2. **Hero „Il tavolo“** – Tisch von oben: Teller-Freisteller, Illustrationen zeichnen sich, Speisekarte mit H1, Stempel „4,8 · 640 Stimmen“, Nonnas Zettel mit dem heutigen Tagesgericht. Desktop: Objekte reagieren mit Feder-Physik auf die Maus (Basilikum und Tomaten weichen aus), Schatten folgen dem Licht. Handy: eigene Komposition (Teller angeschnitten oben, Karte unten)
3. **Set Piece „Ab sieben Uhr wird gerollt“** – Scroll-Szene: Mehl und Eier → Teigkugel wird geknetet → Nudelholz rollt die Platte aus → Teigrad schneidet Tagliatelle; Rosas Rezeptkarte hakt die Schritte ab
4. Angebot als Index (Pasta fresca, Mittagstisch, à la carte, La Cantina, zum Mitnehmen); Desktop: Foto folgt dem Mauszeiger
5. **Pasta des Tages** – Kreidetafel, Wochenplan mit Kreide-Kringel
6. **Speisekarte** – gedruckte Karte auf rotem Karo: Tabs (gezeichneter Kringel), Ernährungs- und Allergenfilter, Weinkarte
7. **Set Piece Wein-Pairing** – das Glas füllt sich beim Scrollen (mit Strahl und schwappender Oberfläche); Gericht wählen → Glas wird geleert, neu eingeschenkt (Farbe des Weins, Perlen beim Moscato), Radar-Profil
8. **Set Piece Familiengeschichte** – Rosas Fotoalbum blättert beim Scrollen (1958–heute), Polaroids gleiten in die Fotoecken, Zeitstrahl darunter; Rückseiten mit Nonnas Randnotizen
9. Team als Stempel-Liste + Stellenanzeige als Küchenbon
10. Gästebuch (Zettel mit Klebeband, Siegel 4,8)
11. **Tischreservierung** mit Tischkarte, Bestätigungsansicht und Kalendereintrag (.ics)
12. Anfahrt (eigene SVG-Karte, Öffnungszeiten mit „heute“), FAQ, Footer

Zusätzlich: `impressum.html`, `datenschutz.html` (Muster, vor Livegang ersetzen).

## Spezial-Features & Technik der Szenen

- **Hero:** Auftakt nur per CSS (≤ 1,2 s, Text nach ~0,3 s lesbar, wartet nicht auf JavaScript). Die Feder-Physik läuft nur, solange sich etwas bewegt; die Animationen liegen auf den Kind-Elementen, die Feder auf den Wrappern.
- **Teig, Album:** CSS `position: sticky` in einer hohen Sektion + GSAP-ScrollTrigger-Scrub – kein Pin, keine Layout-Shifts.
- **Kreidetafel:** jede Zeile wird per `stroke-dashoffset` und mitlaufender Clip-Maske geschrieben, Kreidestaub (Canvas, pausiert außerhalb des Bildschirms).
- **Speisekarte:** Tabs mit Pfeiltasten/Home/End, Filter mit Zählern je Tab und Leerzustand.
- **Reservierung:** Kalender (Pfeiltasten, Bild↑/↓, Montag Ruhetag), Zeitfenster mit „ausgebuchten“ Zeiten, Personen-Stepper, Anlass (bei Geburtstag: Kerze im Tiramisù), Validierung, Bestätigung „Demo – es wurde nichts gesendet“.
- Mikro-Interaktionen: magnetische Buttons (nur feiner Zeiger), Handschrift-Unterstreichungen, die sich zeichnen, Überschriften, die wie mit der Feder von links geschrieben werden, Stempel, die beim Hover gerade gerückt werden.
- Ohne JavaScript, bei `prefers-reduced-motion` und mit `?motion=off` ist alles sichtbar und bedienbar (Szenen zeigen dann ihren Endzustand bzw. eine Liste).

## Anpassen

- **Name, Adresse, Telefon, E-Mail:** in `index.html` (Header, Hero, Footer, JSON-LD im `<head>`), `impressum.html`, `datenschutz.html`, Kalendereintrag in `main.js` (Suche nach „Hauptstätter“ / „0711“).
- **Farben, Schriften & Bewegung:** CSS-Variablen in `style.css` unter `:root` (`--tomato`, `--olive`, `--lemon`, `--linen`, `--basil`, `--f-display`, `--f-text`, `--f-hand`, Kurven `--ease-*` und Dauern `--d-*`). Die Illustrationen im SVG-Sprite am Anfang von `index.html` nutzen dieselben Hex-Werte.
- **Öffnungszeiten:** `HOURS` oben in `main.js` (Live-Status, Kalender) + Tabelle/Footer in `index.html` + JSON-LD.
- **Pasta des Tages:** `TAFEL` in `main.js` (Wochentag → Gericht, Beschreibung, Preis, Wein); die Kurzbezeichnungen unter den Tag-Schaltflächen stehen in `index.html`.
- **Wein-Pairing:** `PAIRING` und `AXES` in `main.js` (Profilwerte 0–5), Farbe und Füllhöhe im Glas in `WINE`.
- **Reservierung:** `RES` in `main.js` (Vorlauf, Personen, Zeitfenster, Anteil ausgebuchter Demo-Zeiten). Für den Livebetrieb das Formular an ein echtes Backend/Reservierungssystem anbinden.
- **Speisekarte:** direkt in `index.html`; jedes Gericht trägt `data-diet` (`veg`/`vegan`/leer) und `data-allergens` (LMIV-Buchstaben, kommagetrennt) für die Filter.
- **Bilder:** `assets/img/<name>-960.webp` und `-480.webp` (Polaroids: `pol-<name>-600/300.webp`, Hero-Freisteller mit Transparenz: `plate-a-*`, `plate-p-*`). Gleiche Dateinamen ersetzen oder `src`/`srcset` anpassen. Herkunft und Bearbeitung: `assets/img/BILDNACHWEIS.md`.

## Lokal starten

```bash
cd /home/user/Websites
python3 -m http.server 8810
# http://127.0.0.1:8810/arena/trattoria-nonna-rosa/
```

Alle Pfade sind absolut (`/arena/trattoria-nonna-rosa/…`), damit die Seite auch hinter Vercel (`cleanUrls`, `trailingSlash: false`) funktioniert.

## Technik & Rechtliches

- Schriften selbst gehostet (Playfair Display, Karla, Caveat – SIL OFL, Lizenzen in `assets/fonts/`), keine externen Requests, keine Cookies.
- GSAP 3.13 + ScrollTrigger, Lenis (lokal in `assets/vendor/`).
- Fotos: StockSnap (CC0), siehe `assets/img/BILDNACHWEIS.md`. Illustrationen und Karte sind eigene SVG-Zeichnungen.
