# Bestattungen Weidner – Modell „Stille“ (Demo)

Demo-Website eines **fiktiven** Bestattungshauses in Lübeck für die Arena von Filip Kramar. Statisch, ohne Build, ohne externe Requests.

## Gestaltungsidee
Die Seite ist gesetzt wie ein Trauerdruck auf Büttenpapier, und ein einziges Kerzenlicht geht mit. Im Hero liegt dieses Licht auf dem Papier und wandert langsam (Canvas); wo es die große Zeile „Erst einmal durchatmen.“ trifft, wird die Schrift warm. Darunter folgt die Seite einem Tag und einer Nacht: ein Weg durch die ersten Schritte, eine Dämmerung für die Haltung, vier Landschaften (Erde, Feuer, Wasser, Baum), deren Horizontlinie sich beim Scrollen ineinander verwandelt, ein Brief, der sich auf dem Schreibtisch aufrichtet, Jahresringe für die Geschichte des Hauses (der Gründer war Tischler) und am Ende der Abend beim Kontakt. Bewegung atmet: lange, gleichmäßige Kurven, nichts federt, nichts springt; nur Bedienelemente reagieren schnell. Handgemachte Details aus dem Trauerdruck: Trauerrand um das Browserfenster, Beschnittmarken am Hero-Foto, Trauerkarten mit Innenrand, Blindprägung bei den Monogrammen, Mediävalziffern, Papierkorn, Fotos in einer gemeinsamen, entsättigt-warmen Tönung.

## Abschnitte
Header mit Telefon „Tag und Nacht“ · Hero (Licht-Canvas auf Papier, Stillleben, Notfallnummer mit Uhrzeit „Es ist … Uhr. Wir nehmen ab.“) · Erste Schritte (Weg mit Knoten, Wegmarke Jetzt/Bald/Später) · Leistungen (Index über Foto) · Haltung (Zitat in der Dämmerung) · Bestattungsarten (vier Landschaften) mit Kostenvergleich · Kosten-Orientierung (Aufstellung + Beleg) · Vorsorge (Brief) · Über uns (Jahresringe, Team) · Stimmen (Trauerkarten, Siegel 4,9/143) · Standort (SVG-Karte) · FAQ · Kontakt (Abend) · Footer. Dazu `impressum.html`, `datenschutz.html`.

## Spezial-Features
- **Hero-Licht**: Canvas in 40 % Auflösung, 24 fps, pausiert außerhalb des Viewports und bei verstecktem Tab; das Licht „wird angezündet“ (1,4 s, blockiert nichts) und folgt mit Verzögerung dem Zeiger. Eine maskierte Kopie der Überschrift (`.ht-glow`) färbt die Schrift dort warm, wo das Licht liegt. Statisch bei reduzierter Bewegung.
- **Erste Schritte**: abhakbare Liste in drei Zeitstufen; die Knoten sitzen auf einem gezeichneten Weg, der sich beim Lesen in Gold nachzieht. Stand wird lokal im Browser gemerkt, „Liste drucken“ druckt nur die Liste.
- **Bestattungsarten**: Tabs (Pfeiltasten, Pos1/Ende). Auf dem Desktop eine hohe Sektion mit `position: sticky` (kein GSAP-Pin): Scrollen führt durch Erde, Feuer, Wasser, Baum, die Hintergrundfarbe wechselt sanft, fünf Horizontlinien verwandeln sich ineinander. Ein Tab-Klick scrollt zur passenden Landschaft. Auf dem Handy dieselbe Verwandlung per Tab.
- **Kosten-Orientierung**: Bausteine Bestatter / Friedhof / Feier → Spanne mit Zählwerk-Ziffern und gestapeltem Balken, `aria-live`, klar als unverbindliche Beispielrechnung gekennzeichnet.
- **Vorsorge-Planer**: Eingaben erscheinen in Tintenblau in einem Brief („Liebe Familie, …“), gewählte Optionen werden wie mit dem Füller umkreist. Der Brief richtet sich beim Scrollen aus der Schräglage auf. Drucken, nichts wird gesendet oder gespeichert.
- **Jahresringe**: SVG-Baumscheibe, Ringe wachsen beim Scrollen von innen nach außen, 1952/1986/2011/2019 leuchten auf.

## Bewegung
Tokens in `:root` von `style.css`: `--ease-out`, `--ease-in-out`, `--ease-drawer`, `--ease-breath` sowie `--t-press` (140 ms), `--t-ui` (220 ms), `--t-calm`, `--t-slow`, `--t-dawn`. Überschriften werden „belichtet“ (weiche Maskenkante), Fotos öffnen sich von unten, Absätze blenden nur weich auf. Lenis + GSAP/ScrollTrigger nur ohne reduzierte Bewegung; `?motion=off` schaltet alles ab, ohne JS ist alles sichtbar.

## Anpassen
- **Name, Adresse, Telefon**: in `index.html`, `impressum.html`, `datenschutz.html` (Suche nach „Weidner“, „0451“, „Moislinger“) und im JSON-LD im `<head>`.
- **Farben/Schriften**: CSS-Variablen in `:root` oben in `style.css` (`--stein`, `--schiefer`, `--salbei`, `--gold`, Landschaftstöne `--t-erde` …).
- **Bilder**: `assets/img/<name>-960.webp` und `-480.webp` ersetzen (gleiche Namen) – Herkunft siehe `assets/img/BILDNACHWEIS.md`.
- **Rechner-Werte**: Konstante `KOSTEN` ganz oben in `main.js` (alle Werte als `[von, bis]` in Euro). Die Spannen im Explorer stehen im HTML (`#arten`).
- **Jahresringe**: die SVG-Scheibe ist im HTML eingebettet; Jahreszahlen in `.ring-label` und in der Liste `.timeline`.

## Lokal starten
```
cd /home/user/Websites && python3 -m http.server 8944
```
→ http://127.0.0.1:8944/arena/bestattung-weidner/
