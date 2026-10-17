# Bohnenwerk Kaffeerösterei – Demo „Röstgrad“

Demo-Website für einen **fiktiven** Betrieb (Kaffeerösterei & Café, Dresden-Neustadt). Statisch, ohne Build, keine externen Requests. Teil der „Arena“ von Filip Kramar.

## Gestaltungsidee
Die ganze Seite ist das Röstprotokoll einer Charge: Der Hero ist der Bildschirm des Röst-Loggers – Raster, Phasen, Referenzkurve und eine Live-Kurve, die der Scroll weiterschreibt, während im Schauglas der Trommel die Bohnen von Rohkaffee-Grün bis „Wiener“ rösten und beim First Crack springen. Typografie und Siegel sind Sackstempel auf Jute (Stempelfarbe mit Fehlstellen, leicht schief gesetzt), die Kapitel wechseln das Material: Logger-Papier mit Lochrand für die Röstprofile, Rohkaffee-Grün für das Abo, Kupfer für die Stimmen. Die Bewegungs-Handschrift folgt der Röstung: Stift und Glut ziehen langsam (ease-in-out, 0,9–1,6 s), Stempel und UI drücken kurz und trocken (160–260 ms, ease-out) – wie der Knack der Bohne.

## Abschnitte
Header mit Röstfarben-Scroll-Fortschritt · Hero „Röstprotokoll“ (Logger-Kurve, Trommel-Schauglas mit Bohnen-Physik, Röstgrad-Anzeige, 4,8-Siegel) · Sackstempel-Band (reagiert auf Scroll-Tempo und -Richtung) · Sortiment als Sackregal (Index mit Vorschau-Sack am Zeiger; Handy: Wisch-Schiene aus Sacketiketten) · Röstprofil-Explorer auf Logger-Papier (Kapitel-Farbwechsel) · Geschmacksrad (drehen mit Feder) · „Vom Hang in Guji …“ (horizontale Strecke mit Tiefen-Parallax) · Kaffee-Abo mit Tütenetikett · Brew-Guide mit Waage · Café & Führungen · Team (Stempel-Monogramme) · Stimmen (Verkostungszettel) · Standort (SVG-Karte, Fußweg zeichnet sich) · FAQ · Kontakt (Anfragezettel) · Footer. Dazu `impressum.html`, `datenschutz.html`.

## Spezial-Features
1. **Röstende Bohnen in der Trommel** (`main.js`, Abschnitt „Hero“): Canvas-Partikel mit einfacher Physik (Schwerkraft, Abstoßung, mitnehmende Trommelwand), die beim Scrollen von Rohkaffee-Grün über Zimt bis „Wiener“ rösten; Scroll-Tempo dreht die Trommel schneller, beim First Crack springen sie. Röstgrad-Anzeige mit Fühlertemperatur, Röstzeit, Agtron und Zeiger auf der Trommelskala; die Logger-Kurve (vorberechneter Pfad im HTML, Profil `PROFILES.dunkel`) wird bis zum aktuellen Zeitpunkt geschrieben. Desktop: Sticky-Bühne (CSS) über 210 svh, Handy: eigene, gestapelte Komposition.
2. **Röstprofil-Explorer**: je Kaffee eine Röstkurve (Bohnentemperatur, RoR, Phasen, First Crack). Ablesen per Maus/Touch oder Pfeiltasten (Shift = 1 min, Pos1/Ende).
3. **Geschmacksrad** (SVG im HTML): 15 Aromen, antippen oder greifen und drehen (Schwung + Feder rastet auf ein Aroma unter dem Zeiger ein), Pfeiltasten + Leertaste; Treffer als Verkostungszettel.
4. **Abo-Konfigurator**: Kaffee, Mahlgrad, Menge, Rhythmus → Preis pro Lieferung und Monat (Beispielrechnung, nichts wird gesendet).
5. **Brew-Guide**: V60, French Press, Espresso, AeroPress mit Verhältnis-Rechner; der Timer ist eine Waage: Zeit, Gewicht, Füllstand und fallende Tropfen folgen dem Gießplan `POUR` in `main.js`.

## Anpassen
- **Name, Telefon, Adresse, Öffnungszeiten**: in `index.html` (inkl. JSON-LD im `<head>`), `impressum.html`, `datenschutz.html` suchen und ersetzen (`0351 555 72 40`, `+493515557240`, `Alaunstraße 41`).
- **Farben/Schriften**: CSS-Variablen in `:root` oben in `style.css` (`--espresso`, `--crema`, `--paper`, `--kupfer`, `--gruen`, `--roast-gradient`; Bewegung: `--t-stamp`, `--t-heat`, `--t-pen`; Material: `--jute`, `--ink-mask`). Die Röstfarben der Bohnen stehen in `ROAST_STOPS` in `main.js`.
- **Preise und Abo-Regeln**: Konstanten ganz oben in `main.js` (`PRICE_PER_250G`, `ABO_DISCOUNT`, `KILO_EXTRA_DISCOUNT`, `SHIPPING`, `FREE_SHIPPING_FROM`, `DELIVERIES_PER_MONTH`, `ROAST_DAYS`). Preise in den Karten im HTML ebenfalls anpassen.
- **Kaffees, Aromen, Röstprofile**: `COFFEES` und `PROFILES` in `main.js` (Zeiten in Minuten). Das Rad selbst ist statisches SVG in `index.html` (`data-aroma`).
- **Brew-Rezepte**: `METHODS` in `main.js` (Verhältnis, Zeiten in Sekunden, Schritt-Texte mit Platzhaltern `{c}`, `{w}`).
- **Bilder**: `assets/img/<name>-960.webp` und `-480.webp` ersetzen (gleiche Namen behalten). Quellen siehe `assets/img/BILDNACHWEIS.md`.

## Lokal starten
```
cd /home/user/Websites && python3 -m http.server 8904
```
→ http://127.0.0.1:8904/arena/roesterei-bohnenwerk/ · `?motion=off` schaltet alle Animationen ab.

Schriften: Bricolage Grotesque (variabel) und DM Mono, SIL OFL, selbst gehostet in `assets/fonts/`.
