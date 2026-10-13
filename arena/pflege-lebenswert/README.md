# Lebenswert Ambulanter Pflegedienst – Demo „Nähe“

Demo-Website für einen **fiktiven** ambulanten Pflegedienst in Erfurt (Arena-Modell „Nähe“). Warm, zugänglich und barrierearm: Creme, Koralle, Tiefblau, Salbei, Schrift Atkinson Hyperlegible Next mit großer Grundgröße (19–20 px). Statisch, kein Build-Schritt.

## Abschnitte

1. Barrierefreiheits-Leiste (oben) · Header mit Navigation, Beratungs-Button, Fortschrittslinie
2. Hero mit Bogen-Foto, Licht-Canvas, Live-Bürostatus und Vertrauenssignalen
3. Zahlen (Mitarbeitende, Touren, 24/7, Bewertung)
4. Leistungs-Explorer: Grundpflege, Behandlungspflege, Verhinderungspflege, Entlastung, Beratungsbesuche – jeweils „Wer zahlt?“
5. Pflegegrad-Orientierung (6 Lebensbereiche, grobe Einordnung, Hinweis auf den Medizinischen Dienst)
6. „Ein Tag auf Tour“ – Desktop: horizontale Scroll-Strecke mit mitlaufender Uhr; Handy: Zeitleiste
7. Über uns & Team (Monogramme) · Stimmen · Einsatzgebiet (SVG-Karte, Ortsliste, Ortsprüfung)
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

- GSAP 3.13 + ScrollTrigger, Lenis (lokal unter `assets/vendor/`) – nur bei voller Bewegung; Pins und horizontale Strecke nur ab 900 px Breite und 640 px Höhe.
- Schrift selbst gehostet (`assets/fonts/`, SIL OFL), keine externen Anfragen, keine Cookies, kein Tracking.
- Formulare rein clientseitig mit Validierung und Zusammenfassung („Demo – es wurde nichts gesendet“).

Fiktiver Beispielbetrieb – Demo-Website von Filip Kramar. Alle Namen, Daten und Bewertungen sind erfunden.
