# Bestattungen Weidner – Modell „Stille“ (Demo)

Demo-Website eines **fiktiven** Bestattungshauses in Lübeck für die Arena von Filip Kramar. Statisch, ohne Build, ohne externe Requests.

## Abschnitte
Header mit Telefon „Tag und Nacht“ · Hero (Kerzenlicht-Canvas + Stillleben, Notfallnummer) · Erste Schritte im Trauerfall (Checkliste) · Leistungen · Haltung (Zitat, scroll-gesteuert) · Bestattungsarten-Explorer · Kosten-Orientierung · Vorsorge-Planer · Über uns (Geschichte, Abschiedsraum, Team) · Stimmen · Standort/Einzugsgebiet (SVG-Karte) · FAQ · Kontakt · Footer. Dazu `impressum.html`, `datenschutz.html`.

## Spezial-Features
- **Hero-Licht**: Canvas mit langsam wanderndem, warmem Licht im Nebel (halbe Auflösung, 24 fps, pausiert außerhalb des Viewports und bei verstecktem Tab; statisch bei reduzierter Bewegung).
- **Erste Schritte**: abhakbare Liste in drei Zeitstufen, Fortschrittsring, Stand wird lokal im Browser gemerkt, „Liste drucken“ druckt nur die Liste.
- **Explorer**: Tabs (Pfeiltasten, Pos1/Ende) für Erd-, Feuer-, See-, Baumbestattung mit Ablauf, Ruhestätte, Pflege, Kostenrahmen; Spannen-Diagramm und Vergleichstabelle.
- **Kosten-Orientierung**: Bausteine Bestatter / Friedhof / Feier → Spanne mit gestapeltem Balken, `aria-live`, klar als unverbindliche Beispielrechnung gekennzeichnet.
- **Vorsorge-Planer**: Wünsche (Art, Ort, Feier, Musik, Blumen, Persönliches) → Live-Blatt zum Ausdrucken, nichts wird gesendet oder gespeichert.

## Anpassen
- **Name, Adresse, Telefon**: in `index.html`, `impressum.html`, `datenschutz.html` (Suche nach „Weidner“, „0451“, „Moislinger“) und im JSON-LD im `<head>`.
- **Farben/Schriften**: CSS-Variablen in `:root` oben in `style.css` (`--stein`, `--schiefer`, `--salbei`, `--gold` …).
- **Bilder**: `assets/img/<name>-960.webp` und `-480.webp` ersetzen (gleiche Namen) – Herkunft siehe `assets/img/BILDNACHWEIS.md`.
- **Rechner-Werte**: Konstante `KOSTEN` ganz oben in `main.js` (alle Werte als `[von, bis]` in Euro). Die Spannen im Explorer stehen im HTML (`#arten`).
- `?motion=off` an die URL hängen schaltet alle Animationen ab.

## Lokal starten
```
cd /home/user/Websites && python3 -m http.server 8843
```
→ http://127.0.0.1:8843/arena/bestattung-weidner/
