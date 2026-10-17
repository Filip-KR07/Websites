# Lebenswert Ambulanter Pflegedienst – Demo „Nähe“

Demo-Website für einen **fiktiven** ambulanten Pflegedienst in Erfurt (Arena-Modell „Nähe“). Warm, zugänglich und barrierearm: Creme, Koralle, Tiefblau, Salbei, Schrift Atkinson Hyperlegible Next mit großer Grundgröße (19–20 px). Statisch, kein Build-Schritt.

## Gestaltungsidee

„Ein Tag, ein Licht“: Ambulante Pflege ist ein Tagesablauf – Übergabe im Morgengrauen, Touren am Vormittag, Abendrunde, nachts die Rufbereitschaft. Die Seite erzählt genau diesen Tag: Sie beginnt im Morgengrauen über einer von Hand gezeichneten Erfurter Silhouette (Dom, Severi, Krämerbrücke, Plattenbau in Rieth), deren Fenster nacheinander angehen, wird zum Mittag hell, nachmittags golden, abends blau (Karriere) und endet nachts (Footer). Das zweite Material ist das Übergabebuch, das bei den Menschen zu Hause auf dem Küchentisch liegt: Notizen der Pflegekräfte in Kugelschreiber-Blau (Caveat), Fotoabzüge mit Klebestreifen, ein Kassen-Stempel, Bleistift-Kringel um die wichtigen Zahlen, ein Klingelschild statt Teamkarten. Die Bewegung ist „ruhig wie Tageslicht“: lange, weich auslaufende Kurven (`--ease-drawer`), Linien zeichnen sich in Schreibgeschwindigkeit, nichts springt oder pulsiert.

## Abschnitte

1. Barrierefreiheits-Leiste (oben) · Header mit Navigation, Beratungs-Button, Fortschrittslinie
2. Hero „Erfurt, kurz vor sieben“: Morgengrauen-Himmel, SVG-Silhouette mit Fenstern, die angehen, gezeichnete Tourenlinie, Foto-Abzug mit Übergabe-Notiz, Kassen-Stempel (Zeiger-Parallaxe mit Feder auf dem Desktop)
3. Zahlen als Satz, der sich beim Scrollen Wort für Wort aufbaut; die Zahlen werden mit Bleistift eingekreist
4. Leistungs-Explorer: Grundpflege, Behandlungspflege, Verhinderungspflege, Entlastung, Beratungsbesuche – jeweils „Wer zahlt?“
5. Pflegegrad-Orientierung als ruhiger Weg: Mit jeder Antwort zeichnet sich der Pfad zur nächsten Station (6 Lebensbereiche, grobe Einordnung, Hinweis auf den Medizinischen Dienst)
6. „Ein Tag mit uns“ – Set Piece: Der Himmel des ganzen Kapitels wechselt beim Scrollen von Morgengrauen über Mittag, goldene Stunde und Dämmerung zur Nacht (sticky, kein Pin); Uhr und Sonnenbogen laufen mit. Handy: kleine klebende Uhr.
7. Über uns: Fenster-Foto, das sich beim Scrollen öffnet, Zitat mit Unterschrift, Team als Klingelschild · Stimmen als Zettel mit Pinnnadeln · Einsatzgebiet als handgezeichnete Karte, die sich beim Scrollen zeichnet
8. Karriere: Gehaltsrahmen-Rechner, Schichtmodell-Umschalter, „Bewerbung in 2 Minuten“
9. FAQ · Kontakt mit Ablauf in 4 Schritten und Rückruf-Formular · Footer
10. `impressum.html`, `datenschutz.html` (Muster, keine Rechtsberatung)

## Spezial-Features

- **Ansicht anpassen:** Schriftgröße A/A+/A++, hoher Kontrast, Bewegung aus. Wirkt sofort, wird im Browser gespeichert (`localStorage`, Schlüssel `lebenswert-ansicht`) und schon im `<head>` angewendet (kein Aufblitzen). Auch im Handy-Menü.
- **Pflegegrad-Orientierung:** gewichtet wie das Begutachtungsinstrument (Module 10/15/40/20/15 %), zeigt Punktbereich mit Unschärfe, Leistungsbeträge und nächste Schritte. Der Beratungs-Button füllt das Kontaktformular vor.
- **Leistungs-Explorer:** echte Tabs (Pfeiltasten, Pos1/Ende), Indikator per `clip-path`. Die Chips in der Tour öffnen den passenden Tab.
- **Karte:** eigene SVG-Grafik, Orte als Liste (Tastatur) und Pins; Prüfung nach Ort, Stadtteil oder PLZ.
- **Karriere:** Gehaltsspanne nach Rolle, Stunden, Erfahrung und Schichtmodell (Zuschläge), Wochenplan-Grafik je Modell, Bewerbungsformular mit Fortschrittsring und Zeitmessung.
- Ohne JavaScript, mit `?motion=off` oder bei „Bewegung reduzieren“ sind alle Inhalte sichtbar und bedienbar.

## Anpassen

- **Name, Telefon, Adresse, Öffnungszeiten:** direkt in `index.html` (Header, Hero, Kontakt, Footer, JSON-LD im `<head>`), `impressum.html`, `datenschutz.html`. Telefonnummer als Suchbegriff: `0361&nbsp;555&nbsp;27&nbsp;00` und `+493615552700`.
- **Farben:** CSS-Variablen oben in `style.css` (`--cream`, `--coral`, `--coral-ink`, `--blue`, `--sage` …). Für Text/Buttons die dunkleren `-ink`-Töne verwenden (Kontrast AA). Hochkontrast-Werte stehen unter `html[data-contrast="high"]`.
- **Bilder:** `assets/img/<name>-960.webp` und `-480.webp` austauschen (gleiche Seitenverhältnisse oder `width`/`height` im HTML anpassen). Herkunft: `assets/img/BILDNACHWEIS.md`.
- **Rechner- und Beispielwerte:** oben in `main.js` dokumentiert – `PG` (Pflegegrad-Punkte, Pflegegeld, Sachleistung, Entlastungsbetrag), `SALARY` (Gehälter je Rolle/Erfahrung, Zuschläge je Schichtmodell), `SHIFTS` (Arbeitszeiten je Wochentag), `AREA` (Erfurter PLZ und Stadtteile). Die Ortsliste und Kartenpins stehen im HTML (`data-place`, `data-zone`, `data-min`, `data-plz`).
- **Leistungsbeträge im Text** (Explorer, FAQ): Stand 2026, als Orientierung gekennzeichnet – bei Gesetzesänderungen im HTML anpassen.

## Lokal starten

```bash
cd /home/user/Websites
python3 -m http.server 8000
# http://127.0.0.1:8000/arena/pflege-lebenswert/
```

Alle Pfade sind absolut (`/arena/pflege-lebenswert/…`), damit die Seite auch unter Vercel (`cleanUrls`, ohne Schrägstrich am Ende) funktioniert.

## Technik

- GSAP 3.13 + ScrollTrigger, Lenis (lokal unter `assets/vendor/`) – nur bei voller Bewegung; keine Pins, „Ein Tag“ nutzt `position: sticky` und Scrub. Start in Etappen (erster Bildschirm sofort, Rest in Häppchen).
- Bewegungs-Tokens in `style.css` (`--dur-press`, `--dur-ui`, `--dur-reveal`, `--dur-write`, `--ease-*`). Die Silhouette ist ein handgezittertes Inline-SVG im Hero (Fenster: `.win`, Farbe in `style.css`).
- Schriften selbst gehostet (`assets/fonts/`, SIL OFL: Atkinson Hyperlegible Next, Caveat als Untermenge für Notizen), keine externen Anfragen, keine Cookies, kein Tracking.
- Formulare rein clientseitig mit Validierung und Zusammenfassung („Demo – es wurde nichts gesendet“).

Fiktiver Beispielbetrieb – Demo-Website von Filip Kramar. Alle Namen, Daten und Bewertungen sind erfunden.
