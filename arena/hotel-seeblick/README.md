# Hotel Seeblick am Tegernsee – Demo-Website (Modell „Ufer“)

Fiktiver Beispielbetrieb für die Arena von Filip Kramar: ein Boutique-Hotel mit 24 Zimmern in Gmund am Tegernsee. Statische Seite ohne Build-Schritt, alle Inhalte auf Deutsch, `noindex`.

## Abschnitte
Hero mit Tageslicht-Szene · Das Haus · I Zimmer & Suiten · II Panorama vom Steg · III Seesauna & Spa · IV Kulinarik · V Ihr Aufenthalt · VI Verfügbarkeit & Preis (mit Anfrage) · VII Gäste · VIII Gastgeber & Karriere · IX Lage & Anreise · X Häufige Fragen · Footer. Dazu `impressum.html` und `datenschutz.html` (Muster).

## Spezial-Features
- **Tag/Nacht-Hero:** SVG-Seelandschaft (Berge, Spiegelung, Hotel, Steg mit Seesauna). Schieberegler, Schnellwahl Morgen/Mittag/Abend/Nacht und „Jetzt“ (Uhrzeit in Gmund). Farben werden stufenlos zwischen Tageslicht-Paletten überblendet (`KEYS` in `main.js`).
- **Zimmer-Explorer:** Tabs (Pfeiltasten), Galerie mit Überblendung und Wischgeste, Ausstattungs-Icons, Grundriss-Andeutung (SVG; Maus über Ausstattung hebt die Zone hervor).
- **Panorama-Streifen:** Drei Ebenen (Berge mit Gipfelnamen, Ufer, Steg/Bootshaus) mit Parallaxe; auf dem Desktop per CSS `position: sticky` festgehalten (kein GSAP-Pin, daher kein Layout-Sprung), die Tageszeit läuft beim Scrollen von Morgenrot bis Abendrot mit – Morgen- und Abendlicht bekommen dabei mehr Scrollweg (`STOPS` in `initPano`). Auf dem Handy ohne Festhalten.
- **„Ihr Aufenthalt“-Planer:** Interessen (Spa, Wandern, Kulinarik, Rad) und Tempo → Tagesvorschlag als Zeitleiste; lässt sich ins Anfrageformular übernehmen.
- **Buchungs-Widget:** eigener Kalender mit Bereichsauswahl (Tastatur: Pfeile, Pos1/Ende, Bild auf/ab), Preis pro Nacht im Kalender, Gäste-Stepper, Kategorien mit Kapazitätsprüfung, Verfügbarkeit (Demo) und Beispielrechnung; Alternativen bei „ausgebucht“.
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
