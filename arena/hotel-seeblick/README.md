# Hotel Seeblick am Tegernsee – Demo-Website (Modell „Ufer“)

Fiktiver Beispielbetrieb für die Arena von Filip Kramar: ein Boutique-Hotel mit 24 Zimmern in Gmund am Tegernsee. Statische Seite ohne Build-Schritt, alle Inhalte auf Deutsch, `noindex`.

## Gestaltungsidee
Die Seite ist ein altes Hotelplakat vom Tegernsee, das man betreten kann: flächige Farbebenen wie im Steindruck, die Versalien der Marcellus als Plakatschrift und die Horizontlinie als Ordnungsprinzip. Im Hero steht das Wort „Tegernsee“ zwischen den Bergrücken und spiegelt sich – samt Bergen, Sonne und Hotel – gekräuselt im See (Canvas); beim Scrollen versinkt die Schrift hinter den Bergen. Alles Weitere stammt aus der Welt eines Grandhotels: Kofferaufkleber statt Kennzahlenreihe, Bildtafeln mit Beschnittmarken, eine Sonnenbahn für den Tagesablauf, eine Rezeptionskarte mit Zimmerschlüssel und Gästestimmen als Postkarte. Die Bewegungs-Handschrift heißt „Wellengang“: Dinge öffnen sich von der Horizontlinie aus, laufen lang aus und federn nie (Kurven und Dauern als CSS-Variablen `--dur-*`, `--ease-water`).

## Abschnitte
Plakat-Hero (Spiegelung, Tageslicht-Lineal, Gütesiegel) · Das Haus (Bildtafel, Kofferaufkleber) · Zimmer & Suiten (Vollbild-Tafeln) · Ein Tag am Ufer (Sonnenbahn) · Seesauna & Spa (Glut kühlt zum See ab) · Kulinarik · Ihr Aufenthalt · Verfügbarkeit & Preis (Rezeptionskarte, mit Anfrage) · Gäste (Postkarte) · Gastgeber & Karriere · Lage & Anreise · Häufige Fragen · Footer. Dazu `impressum.html` und `datenschutz.html` (Muster).

## Spezial-Features
- **Tag/Nacht-Hero:** Plakat aus Ebenen (Himmel, Schrift, Bergrücken, See, Steg). Der See ist ein Canvas, das alles über dem Horizont zeilenweise gespiegelt und gekräuselt zeichnet (Werte in `LAKE` in `main.js`; ohne JavaScript übernimmt eine SVG-Spiegelung). Beim Scrollen versinkt die Schrift hinter den Bergen, mit der Maus verschieben sich die Ebenen. Schieberegler, Schnellwahl Morgen/Mittag/Abend/Nacht und „Jetzt“ (Uhrzeit in Gmund). Farben werden stufenlos zwischen Tageslicht-Paletten überblendet (`KEYS` in `main.js`).
- **Zimmer-Explorer:** Vollbild-Tafeln je Zimmer in eigener Farbe, Wechsel per Clip-Path-Wischer (Richtung folgt der Reihenfolge); Tabs (Pfeiltasten), Galerie mit Überblendung und Wischgeste, Ausstattungs-Icons, Grundriss-Andeutung (SVG; Maus über Ausstattung hebt die Zone hervor).
- **Ein Tag am Ufer / Panorama-Streifen:** Sonnenbahn (SVG-Bogen mit Stunden, zeichnet sich mit dem Scroll), Drei Ebenen (Berge mit Gipfelnamen, Ufer, Steg/Bootshaus) mit Parallaxe; auf dem Desktop per CSS `position: sticky` festgehalten (kein GSAP-Pin, daher kein Layout-Sprung), die Tageszeit läuft beim Scrollen von Morgenrot bis Abendrot mit – Morgen- und Abendlicht bekommen dabei mehr Scrollweg (`STOPS` in `initPano`). Auf dem Handy ohne Festhalten.
- **„Ihr Aufenthalt“-Planer:** Interessen (Spa, Wandern, Kulinarik, Rad) und Tempo → Tagesvorschlag als Zeitleiste; lässt sich ins Anfrageformular übernehmen.
- **Buchungs-Widget:** eigener Kalender mit Bereichsauswahl (Tastatur: Pfeile, Pos1/Ende, Bild auf/ab), Preis pro Nacht im Kalender, Gäste-Stepper, Kategorien mit Kapazitätsprüfung, Verfügbarkeit (Demo) und Beispielrechnung; Alternativen bei „ausgebucht“.
- **Seesauna:** Beim Scrollen kühlt der Abschnitt von Glut-Rot auf Seeblau ab, das Thermometer zählt von 85 auf 4 °C (`SPA_TEMPS`).
- **Rezeptionskarte:** Der Schlüsselanhänger zeigt eine Beispiel-Zimmernummer je Kategorie (`KEY_NO`) und schwingt beim Wechsel.
- Anfrageformular nur clientseitig (Validierung, Zusammenfassung, „Demo – es wurde nichts gesendet“).

## Anpassen
- **Name, Telefon, E-Mail, Adresse:** in `index.html` (Header, Menü, Footer, JSON-LD), `impressum.html`, `datenschutz.html`. Telefonnummer im Format `tel:+49802255540`.
- **Farben:** CSS-Variablen in `style.css` unter `:root` (`--see`, `--nebel`, `--laerche`, `--tanne`, `--morgenrot` …). Die Tageslicht-Farben der Szene stehen in `main.js` (`KEYS`).
- **Preise & Regeln der Buchung:** Konstante `BOOKING` ganz oben in `main.js` (Zimmerpreise, Saisonfaktoren, Wochenend-Aufschlag, Kinder, Kurbeitrag, Langzeit-Rabatt, Kapazitäten, Zimmeranzahl). Die Verfügbarkeit ist eine reproduzierbare Zufallsdemo (`freeRooms`).
- **Planer-Inhalte:** `PLAN_ITEMS` und `PLAN_FIXED` in `main.js`.
- **Bilder:** `assets/img/<name>-960.webp` und `-480.webp` ersetzen (gleiche Namen) und Alt-Texte in `index.html` anpassen. Herkunft siehe `assets/img/BILDNACHWEIS.md`.
- **Berg- und Panorama-Grafik:** Die Pfade wurden generiert und sind direkt im HTML eingebettet.

## Lokal starten
```
cd /home/user/Websites
python3 -m http.server 8830
```
Dann http://127.0.0.1:8830/arena/hotel-seeblick/ öffnen. `?motion=off` schaltet Animationen ab; `prefers-reduced-motion` wird respektiert.

## Technik
GSAP 3.13 + ScrollTrigger und Lenis liegen unter `assets/vendor/`. Schriften Marcellus und Mulish selbst gehostet (`assets/fonts/`, Lizenzen dabei). Keine externen Anfragen, keine Cookies.
