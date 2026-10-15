# Hartmann Rechtsanwälte · Modell „Paragraf“

Demo-Website für einen **fiktiven** Betrieb: eine Rechtsanwaltskanzlei in Nürnberg (Arbeits-, Familien-, Miet- und Verkehrsrecht). Alle Namen, Daten, Bewertungen und Fallbeispiele sind erfunden. Die Seite ist statisch (HTML, CSS, JavaScript), braucht keinen Build-Schritt und lädt nichts von fremden Servern.

Designsprache „Paragraf“: seriös, editorial, zeitlos. Satzspiegel wie in einem Gesetzbuch – schmale Marginalspalte mit Randnotizen („Rn.“), Hauptspalte, Kolumnentitel über jedem Abschnitt, Abschnitte als § 1 bis § 9, Haarlinien, das Paragrafenzeichen als Ornament. Farben Elfenbein, Tiefschwarz, Bordeaux, Graphit; Fotos einheitlich als Duoton. Schriften: Spectral (Display) und Schibsted Grotesk (Text).

## Dateien

| Datei | Inhalt |
|---|---|
| `index.html` | Startseite mit allen Abschnitten, JSON-LD (`LegalService`) |
| `style.css` | Gestaltung; Farben, Schriften, Abstände als CSS-Variablen in `:root` |
| `main.js` | Interaktionen; Konstanten (Öffnungszeiten, Fristen, Formular, Linienstich) stehen oben |
| `impressum.html`, `datenschutz.html` | Muster-Rechtstexte inkl. berufsrechtlicher Angaben (vor dem Livegang ersetzen) |
| `favicon.svg` | § aus Spectral auf Bordeaux |
| `assets/img/` | 14 Fotos (je 480 und 960 px, WebP, Duoton) + `BILDNACHWEIS.md` |
| `assets/fonts/` | Spectral 300/300 kursiv/400/400 kursiv/600, Schibsted Grotesk (variabel) – nur `latin`, SIL OFL |
| `assets/vendor/` | GSAP 3.13 + ScrollTrigger, Lenis |

## Abschnitte

Hero · § 1 Grundsatz · § 2 Rechtsgebiete · § 3 Fristen · § 4 Ablauf eines Mandats (mit Kosten) · § 5 Kanzlei & Team (mit Büro und Ausbildung) · § 6 Stimmen · § 7 Anfahrt & Einzugsgebiet · § 8 Häufige Fragen · § 9 Erstberatung anfragen · Footer. Auf dem Handy: feste Aktionsleiste „Anrufen / Erstberatung anfragen“ (blendet sich beim Tippen in Formularfelder aus).

## Besondere Funktionen

1. **Hero „Taf. I“:** Ein Paragrafenzeichen als Linienstich (Canvas). Rund 100 waagerechte Linien heben sich über der Glyphe zu einem Relief, innerhalb des Zeichens kräftig in Bordeaux. Beim Laden wachsen Linien und Relief, danach steht das Bild still (kein Dauer-Rendern, der Hauptthread bleibt frei); mit der Maus entsteht eine federnde Wölbung, die sich wieder setzt. Pausiert außerhalb des Sichtfelds und in Hintergrund-Tabs.
2. **Rechtsgebiete-Explorer:** Vier Gebiete als Tabs (Pfeiltasten, Pos1/Ende). Je Gebiet typische Fälle, „Was Sie jetzt tun sollten“, zuständige Anwältin bzw. zuständiger Anwalt und ein Knopf, der das Gebiet direkt ins Anfrageformular übernimmt. Ohne JavaScript stehen alle vier Gebiete untereinander.
3. **Fristen-Hinweis:** Auswahl des Schreibens (Kündigung, Bußgeldbescheid, Mieterhöhung, Nebenkostenabrechnung, Trennung/Unterhalt) und Datum des Zugangs. Ergebnis: rechnerisches Fristende als Orientierung, verbleibende Tage, Kalenderblatt (Zugang, Laufzeit, Ende, Feiertage in Bayern) – Wochenenden und Feiertage verschieben das Ende auf den nächsten Werktag. Deutlicher Hinweis: keine Rechtsberatung, Anfrage wahrt keine Frist. „Dringende Erstberatung anfragen“ übernimmt Gebiet, Dringlichkeit und Datum ins Formular.
4. **Ablauf als Zeitstrahl mit Marginalien:** Sechs Absätze; links Zeitpunkt und Randnotiz mit Normzitat, rechts ein mitlaufender Bildrahmen, dessen Foto beim Scrollen wechselt. Die Linie füllt sich mit dem Lesefortschritt.
5. **FAQ mit Live-Suche:** 16 Fragen, Filterung während der Eingabe (tolerant bei Umlauten: „kuendigung“ findet „Kündigung“), Treffer werden markiert, Hinweis bei Treffern nur in der Antwort, Themenfilter, Leerzustand mit Vorschlägen. Taste `/` springt in die Suche, `Esc` leert sie.
6. **Erstberatung anfragen:** Vier Schritte (Rechtsgebiet → Fallschilderung mit Zeichenzähler und Gegenseite für die Konfliktprüfung → Dringlichkeit mit optionalem Fristdatum, Rechtsschutz, Gesprächsform → Kontakt). Validierung pro Schritt, Hinweis „Durch diese Anfrage entsteht kein Mandat“ plus Pflicht-Bestätigung, Zusammenfassung mit „Demo – es wurde nichts gesendet“. Eingaben werden nur per `textContent` ausgegeben.

Außerdem: lebender Kolumnentitel im Header (zeigt den aktuellen §), Lesebändchen am rechten Rand als Scroll-Fortschritt, Inhaltsübersicht mit Punktleitern als Menü (`<dialog>`), Grundsatz-Text, der sich beim Scrollen Wort für Wort „setzt“ (Desktop gepinnt), Siegel-Monogramme für das Team, eigener Lageplan der Altstadt (SVG) mit gezeichnetem Fußweg (auf dem Handy als lesbarer Ausschnitt Hauptbahnhof → Kanzlei), Einzugsgebiet mit verknüpfter Liste, „Jetzt erreichbar“-Anzeige nach Berliner Zeit.

## Anpassen

- **Name, Telefon, Adresse, Öffnungszeiten:** in `index.html` (Header, Hero, Menü, Anfahrt, Formular, Footer, JSON-LD im `<head>`), `impressum.html` und `datenschutz.html`. Telefonnummer immer doppelt ändern: sichtbar (`0911 555 63 30`) und im Link (`tel:+499115556330`). Die Logik der Öffnungszeiten steht in `main.js` unter `OPENING`.
- **Farben:** `style.css` → `:root`, z. B. `--paper` (Elfenbein), `--ink` (Tiefschwarz), `--bordeaux`, `--graphite`. Auf dunklem Grund für kleine Akzente `--bordeaux-light` verwenden. Die Linienstich-Farben stehen in `main.js` unter `ENGRAVE`.
- **Schriften:** `@font-face` am Anfang von `style.css`, Dateien in `assets/fonts/`.
- **Bilder:** Dateien in `assets/img/` gleichnamig ersetzen (jeweils `-480.webp` und `-960.webp`) oder `src`/`srcset`/`width`/`height`/`alt` in `index.html` anpassen. Fotos sind höchstens 960 px breit und werden nie bildschirmfüllend gezeigt. Duoton nachbauen: `convert in.jpg -colorspace gray -sigmoidal-contrast 3,50% +level-colors '#161112','#f1eadf' out.webp`.
- **Fristen-Hinweis:** Regeln und Texte in `main.js` unter `FRISTEN` (`weeks` = Wochen ab Zugang, `monthsEnd` = Ende des n-ten Folgemonats, `none` = keine feste Frist). Feiertage: Funktion `holidays()` (Bayern, ohne Mariä Himmelfahrt, wie in Nürnberg).
- **Formular:** Mindest-/Höchstzahl der Zeichen in `main.js` unter `FORM` (und `maxlength` am Textfeld).
- **Rechtsgebiete, FAQ, Ablauf:** Texte direkt in `index.html`. Neue FAQ: ein weiteres `<details class="qa" data-cat="…" data-keys="…">` – die Suche erfasst es automatisch, `data-keys` enthält Suchbegriffe, die nicht im Text stehen.
- **Pfade:** Alle Verweise in den HTML-Dateien sind absolut (`/arena/kanzlei-hartmann/…`), weil Vercel mit `trailingSlash: false` die Ordner-URL ohne Schrägstrich ausliefert. Beim Umzug per Suchen & Ersetzen anpassen; `url()`-Pfade in `style.css` sind relativ.

## Lokal starten

```sh
cd /pfad/zum/repo          # Repository-Wurzel
python3 -m http.server 8000
# → http://127.0.0.1:8000/arena/kanzlei-hartmann/
```

`?motion=off` an die Adresse hängen, um alle Animationen abzuschalten; bei „Bewegung reduzieren“ im Betriebssystem gilt dasselbe automatisch. Ohne JavaScript bleibt alles lesbar und bedienbar.

## Hinweise

- `noindex`, keine Cookies, kein Tracking, keine externen Anfragen.
- Rechtliche Inhalte (Fristen, Normzitate, FAQ) sind allgemeine Orientierung für die Demo und keine Rechtsberatung. Vor einem echten Einsatz fachlich prüfen lassen.
- Bildnachweis: `assets/img/BILDNACHWEIS.md` (StockSnap, CC0).
