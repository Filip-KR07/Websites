# Modell „Impuls“ – Funke Elektrotechnik (Demo)

Demo-Website für einen **fiktiven** Elektro-Meisterbetrieb aus Leipzig.
Statisch (HTML, CSS, JS), ohne Build-Schritt, ohne externe Anfragen, ohne Cookies.

## Gestaltungsidee

Die ganze Seite ist ein **Stromlaufplan**: ein technisches Zeichnungsblatt mit Rahmen, Koordinatenfeldern,
Schriftfeld und DIN-Schaltzeichen, gesetzt auf leicht gekörntem Papier in Tusche. Gelb ist kein Deko-Akzent,
sondern der **Textmarker**, mit dem Elektriker geprüfte Leitungen nachziehen – beim Scrollen fließt so der Strom
vom Hausanschluss über die Sammelschiene in die Abgänge, Verbraucher „schalten ein“, am Ende unterschreibt
der Meister im Schriftfeld. Der Schalter **S1** im Plan (bzw. „Strom“ im Header) setzt die ganze Seite unter
Spannung: Per View Transition breitet sich die Nachtansicht kreisförmig vom Schalter aus, der Plan leuchtet.
Jeder Abschnitt ist ein Bauteil aus dem Alltag des Betriebs – Verteiler mit Leitungsschutzschaltern, Stromzähler,
Sonnenbahn über dem Dach, Wandschalter, Oszilloskop, Schützkette, Stückliste, Klemmleiste, Prüfstempel.
Motion-Handschrift „schalten, nicht schweben“: Kontakte rasten kurz mit leichtem Überschwinger ein
(`--ease-click`), Strom fließt mit konstanter Geschwindigkeit, Abschnitte werden wie geplottet von links aufgedeckt.

## Dateien

| Datei | Inhalt |
|---|---|
| `index.html` | Startseite mit allen Abschnitten, JSON-LD (`Electrician` + `FAQPage`) |
| `style.css` | Gestaltung; alle Farben, Schriften, Easing-Kurven als CSS-Variablen in `:root` |
| `main.js` | Interaktionen (Canvas, PV-Rechner, Lichtschalter, Smart Home, Filter, Formulare, Scroll) |
| `impressum.html`, `datenschutz.html` | Muster-Rechtstexte im Stil der Seite |
| `favicon.svg` | Funke-/Blitz-Zeichen |
| `assets/` | Fotos (`img/`, siehe `img/BILDNACHWEIS.md`), Schriften (`fonts/`), GSAP/ScrollTrigger/Lenis (`vendor/`) |

## Abschnitte

Hero „Stromlaufplan“ · Kabel mit Normen/Systemen · Leistungen als Verteiler (F1–F9) · Zählwerk · PV-Rechner mit
Sonnenbahn · Abend-Kapitel (Lichtplanung, Smart Home) · Referenzen als Oszilloskop · Notdienst · Ablauf als
Schützkette · Über uns mit Stückliste · Kundenstimmen mit Prüfstempel · Einzugsgebiet · Karriere (Klemmleiste,
Kurzbewerbung) · FAQ · Anfrage-Assistent (4 Schritte) · Footer. Auf dem Handy: feste Aktionsleiste unten
(Anrufen · Notdienst · Anfrage).

## Spezial-Features

1. **Hero als Stromlaufplan** (SVG, Desktop- und eigene Handy-Komposition). Intro ≤ 1,2 s: Buchstaben der
   Headline „laden sich auf“ (Variable-Font-Achsen `wght`/`wdth`), Plan zeichnet sich, Textmarker zieht über
   „sauber“. Desktop: sticky Bühne – beim Scrollen fließt der Strom in die Abgänge PV, Wallbox, Steckdosen, Licht;
   danach Unterschrift im Schriftfeld. Handy: zeitgesteuert. Buchstaben in Mausnähe werden breiter (Feder/Lerp).
   Statusleuchten H1/H2: Notdienst erreichbar, Büro geöffnet/geschlossen nach Uhrzeit (Europe/Berlin).
2. **Hauptschalter „Strom“** (S1 im Plan oder Header, `aria-pressed`): ganze Seite wechselt in die Nachtansicht
   (CSS-Variablen in `:root[data-power="on"]`), kreisförmige View Transition vom Schalter aus; Fallback: sofort.
3. **Leistungen als Verteiler** – 9 Leitungsschutzschalter sind Tabs (`role="tablist"`, Pfeiltasten, Pos1/Ende);
   der gewählte Hebel rastet nach oben, Beschriftung handschriftlich wie im echten Verteiler. Ohne JS: Liste.
4. **PV-Rechner mit Sonnenbahn** – Dachfläche, Ausrichtung, Verbrauch (Vorgaben), Speicher, Strompreis.
   Rollende Ziffern, Monatsdiagramm (SVG) mit Hover-Werten. Darüber eine Szene: Die Sonne wandert beim Scrollen
   von Ost nach West, Bahnhöhe folgt dem Monat unter dem Zeiger im Diagramm, Module auf dem Dach entsprechen der
   berechneten Anlage und leuchten je nach Sonnenstand und Ausrichtung. Ergebnis per Knopf in den Assistenten.
   Richtwerte stehen als Konstanten `PV` in `main.js`.
5. **Abend-Kapitel** – beim Hineinscrollen dunkelt die ganze Seite ab (fester Hintergrund, Deckkraft per Scroll).
   **Lichtschalter** mit Wippen-Physik schaltet das Zimmer per `clip-path`-Kreis vom Schalter oder Tippunkt aus ein.
   **Smart-Home-Panel** mit Wippschaltern, Dimmer, Rollläden, Heizung, Wallbox-Ladering und drei Szenen,
   komplett per Tastatur bedienbar, Änderungen werden angesagt.
6. **Referenzen als Oszilloskop** – Filter = Kanäle (CH1–CH4, FLIP-Animation per WAAPI). Jede Kategorie hat ihre
   Kurve (PV-Welligkeit, KNX-Telegramm, Oberschwingungen, Drehstrom); Zeile anfahren/fokussieren zeigt das
   Projektfoto als Phosphor-Duoton auf dem Schirm. Canvas mit 30 fps nur im Sichtbereich, Scroll-Tempo ändert
   Amplitude und Zeitbasis, Drehknöpfe drehen mit.
7. Außerdem: Kabel-Laufband, dessen Tempo der Scroll-Geschwindigkeit folgt (auch rückwärts), Zählwerk mit
   Ziffernrollen, Schützkette im Ablauf (sticky, Kontakte schließen nacheinander), Prüfstempel dreht beim Scrollen,
   Einzugsgebiets-Karte als SVG, Kurzbewerbung „in 60 Sekunden“, mehrstufiger Assistent mit Validierung und
   Zusammenfassung, magnetische Buttons, Navigations-Links mit Zeichenrolle, Footer-Schriftzug „schaltet ein“
   (Scroll-driven Animation mit Fallback).

Animationen abschalten: `?motion=off` an die Adresse hängen (oder System-Einstellung „Bewegung reduzieren“).
Ohne JavaScript sind alle Inhalte sichtbar.

## Anpassen für einen echten Betrieb

- **Name, Telefon, Adresse, E-Mail:** in `index.html`, `impressum.html`, `datenschutz.html` suchen &
  ersetzen (z. B. „Funke“, „0341 987 65 4“, „+49341987654“, „Kabelstraße 12“, „funke-elektro.de“).
  JSON-LD im `<head>` von `index.html` mitpflegen (Adresse, Geo-Koordinaten, Öffnungszeiten, `areaServed`).
- **Öffnungszeiten:** Text in `index.html` und die Konstanten `OPEN_MIN` / `CLOSE_MIN` in `main.js`
  (steuern die Pille „Büro geöffnet/geschlossen“).
- **Farben:** `:root` in `style.css` – `--paper`, `--ink`, `--volt` (Textmarker/Strom), `--red` (Prüfvermerk),
  `--pen` (Kugelschreiber); die Nachtansicht überschreibt sie in `:root[data-power="on"], .is-night`.
  Die Farbe der Oszilloskop-Kurve steht in `main.js` (Abschnitt 13).
- **Schriften:** `@font-face` oben in `style.css` (Archivo mit Breiten-Achse, JetBrains Mono, „Nothing You Could Do“
  für Handschrift), Variablen `--f-display`, `--f-body`, `--f-mono`, `--f-hand`.
- **Bilder:** in `assets/img/` je zwei Breiten ablegen (`name-480.webp`, `name-960.webp`) und in
  `index.html` `src`, `srcset`, `width`/`height` und den deutschen `alt`-Text anpassen.
  Die Fotos sind nur Platzhalter (CC0, StockSnap) – für Kunden immer echte Fotos verwenden.
- **PV-Richtwerte:** Konstanten `PV` in `main.js` (Ertrag je Ausrichtung, Eigenverbrauch, Vergütung,
  Kosten, CO₂-Faktor, Monatsverteilung). Die Texte unter „Annahmen anzeigen“ in `index.html` mitändern.
- **Einzugsgebiet:** Orte als SVG in `index.html` (Abschnitt „Einzugsgebiet“, Maßstab ≈ 7,4 Einheiten je km),
  Entfernungen/Anfahrtszeiten im Objekt `TOWNS` in `main.js`.
- **Pfade:** Alle Verweise sind absolut auf `/handwerk/elektro-funke/` gesetzt (wegen `trailingSlash: false`
  in `vercel.json`). Beim Umzug in einen anderen Ordner diesen Präfix suchen & ersetzen.
- **Vor dem Livegang:** `noindex` entfernen, Impressum/Datenschutz mit echten Angaben ersetzen,
  Formulare an einen Dienst anbinden (es wird aktuell nichts gesendet) und in der Datenschutzerklärung beschreiben.

## Lokal starten

```bash
cd /pfad/zum/repo          # Repo-Wurzel
python3 -m http.server 8772
# → http://127.0.0.1:8772/handwerk/elektro-funke/
```

## Bildnachweis

Siehe `assets/img/BILDNACHWEIS.md` (alle Fotos CC0 von StockSnap.io). Schriften: SIL Open Font License
(Lizenzdateien in `assets/fonts/`). GSAP 3.13 (kostenlose Standardlizenz), Lenis (MIT).
