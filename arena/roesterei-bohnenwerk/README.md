# Bohnenwerk Kaffeerösterei – Demo „Röstgrad“

Demo-Website für einen **fiktiven** Betrieb (Kaffeerösterei & Café, Dresden-Neustadt). Statisch, ohne Build, keine externen Requests. Teil der „Arena“ von Filip Kramar.

## Abschnitte
Header mit Scroll-Fortschritt · Hero mit Bohnen-Canvas und Röstgrad-Anzeige · Herkunfts-Laufband · Sortiment (6 Kaffees, Handy: Wisch-Schiene) · Röstprofil-Explorer · Geschmacksrad · „Von der Farm in die Tasse“ (horizontale Strecke) · Kaffee-Abo · Brew-Guide · Café & Führungen · Team · Stimmen · Standort (SVG-Karte) · FAQ · Kontakt/Führung anfragen · Footer. Dazu `impressum.html`, `datenschutz.html`.

## Spezial-Features
1. **Röstende Bohnen** (`main.js`, Abschnitt „Hero“): Canvas-Partikel, die beim Scrollen von Rohkaffee-Grün über Zimt bis Dunkelbraun rösten; Anzeige mit Röstgrad, Temperatur, Röstzeit und Agtron-Wert. Desktop: Sticky-Bühne (CSS) über 200 svh, Handy: normaler Hero.
2. **Röstprofil-Explorer**: je Kaffee eine Röstkurve (Bohnentemperatur, RoR, Phasen, First Crack). Ablesen per Maus/Touch oder Pfeiltasten (Shift = 1 min, Pos1/Ende).
3. **Geschmacksrad** (SVG im HTML): 15 Aromen, Pfeiltasten + Leertaste; Treffer aus dem Sortiment.
4. **Abo-Konfigurator**: Kaffee, Mahlgrad, Menge, Rhythmus → Preis pro Lieferung und Monat (Beispielrechnung, nichts wird gesendet).
5. **Brew-Guide**: V60, French Press, Espresso, AeroPress mit Verhältnis-Rechner und Timer mit mitlaufenden Schritten.

## Anpassen
- **Name, Telefon, Adresse, Öffnungszeiten**: in `index.html` (inkl. JSON-LD im `<head>`), `impressum.html`, `datenschutz.html` suchen und ersetzen (`0351 555 72 40`, `+493515557240`, `Alaunstraße 41`).
- **Farben/Schriften**: CSS-Variablen in `:root` oben in `style.css` (`--espresso`, `--crema`, `--kupfer`, `--gruen`, `--roast-gradient`). Die Röstfarben der Bohnen stehen in `ROAST_STOPS` in `main.js`.
- **Preise und Abo-Regeln**: Konstanten ganz oben in `main.js` (`PRICE_PER_250G`, `ABO_DISCOUNT`, `KILO_EXTRA_DISCOUNT`, `SHIPPING`, `FREE_SHIPPING_FROM`, `DELIVERIES_PER_MONTH`, `ROAST_DAYS`). Preise in den Karten im HTML ebenfalls anpassen.
- **Kaffees, Aromen, Röstprofile**: `COFFEES` und `PROFILES` in `main.js` (Zeiten in Minuten). Das Rad selbst ist statisches SVG in `index.html` (`data-aroma`).
- **Brew-Rezepte**: `METHODS` in `main.js` (Verhältnis, Zeiten in Sekunden, Schritt-Texte mit Platzhaltern `{c}`, `{w}`).
- **Bilder**: `assets/img/<name>-960.webp` und `-480.webp` ersetzen (gleiche Namen behalten). Quellen siehe `assets/img/BILDNACHWEIS.md`.

## Lokal starten
```
cd /home/user/Websites && python3 -m http.server 8803
```
→ http://127.0.0.1:8803/arena/roesterei-bohnenwerk/ · `?motion=off` schaltet alle Animationen ab.

Schriften: Bricolage Grotesque (variabel) und DM Mono, SIL OFL, selbst gehostet in `assets/fonts/`.
