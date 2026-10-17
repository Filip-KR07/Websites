# Tierarztpraxis Pfotenwerk – Demo „Pfote“

Demo-Website für eine **fiktive** Tierarztpraxis in Bremen-Schwachhausen (Schwachhauser Heerstraße 140, Dr. med. vet. Jana Petersen). Teil der „Arena“ von Filip Kramar. Alle Namen, Daten, Bewertungen und Patientengeschichten sind erfunden, die Seite steht auf `noindex`.

Designsprache: freundlich-verspielt, aber medizinisch klar – Petrol, Sonnengelb, Hellblau-Grau, Tinte und Apricot. Display-Schrift Young Serif, Fließtext Lexend (variabel), Handschrift Kalam für Notizen am Rand.

## Gestaltungsidee
„Das Wartezimmer“: Die Seite ist das gezeichnete Wartezimmer von Pfotenwerk – Hunde links, Katzen und Kleintiere rechts, in der Mitte die Tür zu „Behandlung 1“ mit einem Türschild, das live zeigt, ob gerade geöffnet ist. Dort warten Ronja, Mo, Tilda und Kurt (die Haustiere des Teams) als eigene SVG-Figuren; ihre Augen folgen dem Zeiger, beim Berühren wedelt, zuckt oder hoppelt jedes Tier auf seine Art. Von dort läuft eine einzige Pfotenspur als roter Faden durch die ganze Seite. Alles Weitere stammt aus dem Praxisalltag: Karteikarten für die Leistungen, eine Notfall-Ampel als Entscheidungsbaum im Nachtdienst-Kapitel, ein aufgeschlagener Impfpass, Polaroids an der Filzwand und Dankes-Postkarten. Die Bewegungs-Handschrift heißt „Pfotentakt“: Tiere und Schilder reagieren federnd, Inhalte setzen ruhig auf, Spuren laufen im Schritt-Takt.

## Abschnitte
Header mit Live-Status · Hero „Wartezimmer“ (Szene mit Tieren, Uhr, Urkunde, Türschild) · Leistungen als Karteikasten (6 Karten) · Notfall-Wegweiser (Nachtdienst-Kapitel) · Erster Besuch (Pfotenspur, sticky) · Impfplaner als Impfpass · Praxis & Team als Polaroid-Wand · Patientengeschichten als Postkarten-Strecke (sticky) · Neupatienten-Anmeldung · Anfahrt & Sprechzeiten (SVG-Karte) · FAQ · Footer mit schlafendem Kater. Dazu `impressum.html` und `datenschutz.html` (Muster).

## Spezial-Features
- **Wartezimmer-Hero:** reine SVG-/CSS-Komposition (kein Foto). Augen und Köpfe folgen dem Zeiger mit Feder-Glättung (Handy: dem Finger bzw. dem Scroll, ohne Eingabe schauen die Tiere sich ab und zu um), Anstupsen löst Reaktionen aus (Schwanz, Ohren, Nase, Hüpfer). Die Wanduhr zeigt die Berliner Zeit, das Türschild den Live-Öffnungsstatus und schwingt als gedämpftes Pendel. Bewertung und Gründungsjahr hängen als Urkunde und Messingschild an der Wand.
- **Pfotenspur:** eine durchgehende Spur über die ganze Seite (`initTrail` in `main.js`), deren Kopf dem Scroll folgt; im Abschnitt „Erster Besuch“ führt eine zweite Spur auf einer klebenden Bühne von Schritt zu Schritt.
- **Notfall-Wegweiser:** Tierart + Anzeichen (Mehrfachauswahl) → Entscheidungsbaum, dessen Ast zur Ampel „Sofort anrufen“ / „Heute Termin“ / „Termin vereinbaren“ zeichnet, mit Begründung, Sofort-Tipps und großem Notfall-Button. Stufen je Tierart, Kombinationsregeln, Hinweise wie „Kater + kein Urin“. Text und Aktionen passen sich dem Live-Öffnungsstatus an. Klar als Orientierung gekennzeichnet.
- **Impfplaner:** Welpe/Kitten + Geburtsdatum → Zeitleiste der Grundimmunisierung (8./12./16. Woche, 15. Monat) im Impfpass-Look mit Datum, „Heute“-Marker, Fortschrittslinie, optionalen Impfungen und `.ics`-Export. Der Zeitstrahl wächst beim Scrollen, Stationen werden abgestempelt. Übergibt Name, Tierart und Alter an die Anmeldung.
- **Neupatienten-Anmeldung:** Tierprofil mit Live-Vorschau einer Patientenkarte (Silhouette wächst mit dem Gewicht, Lebensphase, Beispiel-Patientennummer). Unter 1100 px dockt beim Ausfüllen eine Mini-Karte unter dem Header an. Validierung, Erfolgsansicht mit Zusammenfassung und Stempel. Es wird nichts gesendet.
- **Polaroid-Wand:** Team-Karten hängen an Nadeln und schwingen physikalisch (Hover, Tippen, Scroll-Tempo).
- **Live-Öffnungsstatus** (Europe/Berlin) in Header, Türschild, Menü und Sprechzeiten-Tabelle. Zum Testen: `?jetzt=di-10:30`.
- **Leistungskarten:** Karteikarten mit Reiter; die Tier-Silhouetten sitzen oben auf der Karte und wackeln beim Hover/Fokus (Touch: einmal beim Einblenden). Auf dem Handy als Wisch-Schiene.

## Anpassen
- **Name, Telefon, Adresse:** direkt in `index.html` (Header, Hero, Notfall, Standort, Footer, JSON-LD im `<head>`), `impressum.html`, `datenschutz.html`.
- **Sprechzeiten:** `HOURS` oben in `main.js` (für Live-Status und Tagesleiste) – zusätzlich Tabelle und Footer in `index.html` sowie `openingHoursSpecification` im JSON-LD.
- **Farben/Schriften/Radien:** CSS-Variablen oben in `style.css` (`--petrol`, `--sun`, `--sky`, `--ink`, `--apricot` …) und im Block „NEUGESTALTUNG“ (`--paper`, `--felt`, `--wall-dog`, `--wall-cat`). Silhouetten-Farben über `--sil-*`. Bewegung: `--ease-out`, `--ease-in-out`, `--ease-drawer`, `--ease-plop` (Feder), `--step` (Stagger-Takt).
- **Tiere im Hero:** Inline-SVG in `index.html` (Abschnitt HERO); Augen tragen `data-eye="maxX maxY"` (Ausschlag der Pupille).
- **Notfall-Wegweiser:** `SYMPTOMS` (Stufe je Tierart, Tipp), `TRIAGE_NOTES` in `main.js`; die Auswahl-Chips stehen in `index.html` (`value` = Schlüssel).
- **Impfplaner:** `VACC` (Zeitpunkte, Impfungen, optionale Impfungen, Hinweise), `VACC_OPT_LABEL`, `VACC_EXAMPLE_WEEKS` in `main.js`.
- **Anmeldung:** `PETS` (Gewichtsbereich des Reglers, typisches Gewicht, Plausibilitätsgrenzen, Lebensphasen).
- **Bilder:** `assets/img/<name>-960.webp` und `-480.webp` ersetzen (gleiche Namen) oder Pfade/`srcset` im HTML anpassen. Fotos werden nie breiter als 960 CSS-px dargestellt.

## Lokal starten
```
cd /home/user/Websites && python3 -m http.server 8800
```
Dann http://127.0.0.1:8800/arena/tierarzt-pfotenwerk/ öffnen. `?motion=off` schaltet alle Animationen ab.

## Technik & Hinweise
Statisch, ohne Build. GSAP 3 + ScrollTrigger und Lenis liegen unter `assets/vendor/`, Schriften (nur `latin`, OFL) unter `assets/fonts/`. Keine externen Requests, keine Cookies. Ohne JavaScript und bei `prefers-reduced-motion` bleibt alles sichtbar und bedienbar (keine Sticky-Strecken, keine Physik, die Pfotenspur steht vollständig). Kein GSAP-Pin: klebende Abschnitte laufen über CSS `position: sticky`.

Bildquellen: siehe `assets/img/BILDNACHWEIS.md` (StockSnap, CC0).
