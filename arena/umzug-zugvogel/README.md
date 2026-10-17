# Zugvogel Umzüge – Modell „Etappe“

Demo-Website eines **fiktiven** Umzugsunternehmens aus Hannover (Arena-Demo von Filip Kramar). Statisch, ohne Build-Schritt, ohne externe Requests. Schriften Archivo (Breiten-Achse 100–125 %) und IBM Plex Mono, selbst gehostet.

## Gestaltungsidee
Die Seite ist eine Route durch die Stadt. Oben liegt ein isometrischer Stadtplan von der Podbielskistraße in der List bis zur Limmerstraße in Linden: Kartons werden geladen, die Klappe geht zu, der LKW fährt die Vahrenwalder Straße hinunter und hält am neuen Zuhause, und die drei Zeilen der Überschrift werden im selben Takt abgehakt. Danach fährt der LKW die ganze Seite entlang: Er zieht in der Etappen-Leiste unter dem Header mit, rollt zwischen den Kapiteln über eigene Straßenstücke mit Straßenschildern und hält in der Ablauf-Strecke an jeder Etappe. Jedes Kapitel ist ein beschrifteter Karton. Das Etikett klebt schräg auf, ein Packband-Abroller zieht über die Überschrift und gibt sie frei. Die Werkzeuge der Branche ersetzen die üblichen Karten: Ladeliste, beladbarer LKW, Frachtbrief mit Durchschlag, Kartonstapel, Lieferscheine mit Empfangsbestätigung, Betriebshof, Auftragszettel. Am Ende fährt das Rolltor herunter: „Klappe zu.“

**Bewegungs-Handschrift „anfahren – rollen – halten“:** schwer und logistisch. Bewegungen fahren langsam an und bremsen weich (`--ease-truck`), Ankünfte laufen aus (`--ease-out`), Kartons fallen mit kurzem Nachfedern auf den Stapel. Dauern und Kurven stehen als Tokens oben in `style.css` (`--t-press`, `--t-ui`, `--t-drop`, `--t-run`, `--stagger`).

## Abschnitte
Header mit Etappen-Leiste (Mini-LKW = Scrollfortschritt, Halte = Kapitel) · Hero „Stadtplan“ mit Versandetikett und Bewertungsstempel · Straßenstück · Leistungen als Ladeliste (iso-Piktogramme, Duoton-Fotos mit Schnittmarken) · Volumenrechner · Kostenschätzung als Frachtbrief · Straßenstück · Ablauf in 4 Etappen · Checkliste als Kartonstapel · Straßenstück · Über uns: Betriebshof mit 9 LKW, Fuhrpark-Tafel, Crew-Liste · Kundenstimmen als Lieferscheine · Einsatzgebiet (SVG-Karte, Routen zeichnen sich) · FAQ · Straßenstück A2 · Anfrage als Auftragszettel · Footer „Klappe zu“. Dazu `impressum.html` und `datenschutz.html` (Muster).

## Spezial-Features
1. **Hero-Stadtplan** (Inline-SVG, erzeugt aus isometrischen Koordinaten): Kartons stapeln sich auf dem Rollbrett, fahren über die Rampe in den LKW, das Rolltor schließt, der LKW fährt zum Ziel, die Route zeichnet sich hinter ihm, Zugvögel ziehen einmal über die Stadt. Reine CSS-Animation (wartet nicht auf `main.js`), einmalig, danach ruhig; „Noch mal beladen“ spielt sie erneut ab. Ohne JS bzw. bei reduzierter Bewegung steht das Endbild (LKW angekommen). Desktop: Feder-Parallaxe am Mauszeiger, mobil eigener Bildausschnitt.
2. **Volumenrechner mit beladbarem LKW**: Räume als Tabs (Pfeiltasten), Möbel per Stepper → m³, LKW-Empfehlung; der isometrische, aufgeschnittene Laderaum (3,5 t / 7,5 t / 12 t) füllt sich Karton für Karton.
3. **Kostenschätzung als Frachtbrief**: Volumen (übernimmt den Rechnerwert), Entfernung, Etagen/Aufzug, Packservice, Halteverbot → Frachtbrief-Felder, Positionen, Preisspanne, Stempel „Beispiel – unverbindlich“.
4. **Checkliste als Kartonstapel**: sieben Kartons von 8 Wochen vorher bis 1 Woche danach; ist ein Karton komplett abgehakt, klebt Packband ihn zu und der passende Karton im Stapel schließt sich. Fortschritt und Umzugsdatum in `localStorage` (`zugvogel-checkliste-v1`).
5. **Ablauf in 4 Etappen**: ab 900 px horizontale Strecke per `position: sticky` + ScrollTrigger (kein Pin); die Straße rollt mit, der LKW hält an jeder Etappe kurz an (Haltephasen im Scroll-Verlauf) und nickt beim Bremsen; mobil vertikale Liste.
6. **Straßenstücke** zwischen den Kapiteln: der LKW fährt im Scrolltempo durchs Bild und neigt sich beim Anfahren/Bremsen.

## Anpassen
- **Name, Telefon, Adresse, Zeiten**: in `index.html`, `impressum.html`, `datenschutz.html` (Suche nach „Zugvogel“, „0511“, „Vahrenwalder“) und im JSON-LD im `<head>`.
- **Farben/Schriften/Bewegung**: CSS-Variablen oben in `style.css` (`--navy`, `--orange`, `--karton`, `--kraft`, `--ease-truck` …). Die SVG-Szenen (Stadtplan, Betriebshof, Kartonstapel, Piktogramme) nutzen feste Farbwerte; sie werden mit dem Generator-Skript (Python, Arbeitsordner, setzt zwischen `<!-- gen:… -->`-Markern ein) neu erzeugt oder direkt im SVG ersetzt.
- **Bilder**: `assets/img/<name>-960.webp` und `-480.webp` austauschen (gleiche Namen), Alt-Texte in `index.html` anpassen. Quellen und Bearbeitung (Duoton): `assets/img/BILDNACHWEIS.md`.
- **Rechner-Werte**: Konstanten ganz oben in `main.js` – `RAEUME` (m³ je Möbelstück, Voreinstellung), `LKW` (Laderaum je Klasse, Kartonraster-Länge), `KOSTEN` (Stundensatz, km-Satz, Etagen, Packservice, Halteverbot, Spanne).

## Lokal starten
```
cd /home/user/Websites && python3 -m http.server 8822
# http://127.0.0.1:8822/arena/umzug-zugvogel/   (?motion=off schaltet Animationen ab)
```
