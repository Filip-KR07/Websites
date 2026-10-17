# Hartmann Rechtsanwälte · Modell „Paragraf“

Demo-Website für einen **fiktiven** Betrieb: eine Rechtsanwaltskanzlei in Nürnberg (Arbeits-, Familien-, Miet- und Verkehrsrecht). Alle Namen, Daten, Bewertungen und Fallbeispiele sind erfunden. Die Seite ist statisch (HTML, CSS, JavaScript), braucht keinen Build-Schritt und lädt nichts von fremden Servern.

## Gestaltungsidee

Die Kanzlei als Gesetzblatt: Die Startseite ist gesetzt wie die Titelseite einer Zeitung – Zeitungskopf mit Jahrgang (seit 2009) und Ausgabennummer (Tag des Jahres, live), Spaltensatz im Blocksatz mit Silbentrennung, Initialen, Fußnoten mit Rücksprung, Randnummern in der Marginalspalte, Eilmeldung, „Weiter im Blatt“. Das Leitmotiv ist das Kleingedruckte: Das große Paragrafenzeichen ist aus dem Wortlaut der wichtigsten Fristen gesetzt, und eine Lupe macht es lesbar – genau das, was eine Anwältin für ihre Mandanten tut. Kapitel wechseln das ganze Papier (Elfenbein, Druckerschwärze für die Fristen, Bordeaux für die Kanzlei, Zeitungsgrau für die Leserbriefe). Die Bewegungs-Handschrift heißt „Zeilenguss“: Zeilen fallen wie gegossene Bleizeilen auf ihre Grundlinie, Linien werden mit der Ziehfeder von links gezogen, Farbe wird eingedruckt (Deckkraft statt Flug) – nie diagonal, nie federnd.

## Dateien

| Datei | Inhalt |
|---|---|
| `index.html` | Startseite mit allen Abschnitten, JSON-LD (`LegalService`) |
| `style.css` | Gestaltung; Farben, Kapitel, Schriften, Kurven und Dauern als CSS-Variablen in `:root` |
| `main.js` | Interaktionen; Konstanten (Öffnungszeiten, Fristen, Formular, Kleingedrucktes) stehen oben |
| `impressum.html`, `datenschutz.html` | Muster-Rechtstexte inkl. berufsrechtlicher Angaben (vor dem Livegang ersetzen) |
| `favicon.svg` | § aus Spectral auf Bordeaux |
| `assets/img/` | 14 Fotos (je 480 und 960 px, WebP, Duoton) + `BILDNACHWEIS.md` |
| `assets/fonts/` | Spectral 300/300 kursiv/400/400 kursiv/600, Schibsted Grotesk (variabel) – nur `latin`, SIL OFL |
| `assets/vendor/` | GSAP 3.13 + ScrollTrigger, Lenis |

## Abschnitte

Titelseite (Zeitungskopf, Aufmacher „Was steht da wirklich?“, Taf. I mit Lupe, Eilmeldung, Lage am Königstor, Fußnoten) · § 1 Leitartikel + Grundsätze als Gesetzestext · § 2 Rechtsgebiete als Register · § 3 Fristen (Kapitel in Schwarz) · § 4 Ablauf eines Mandats mit Akten und Kostentabelle · § 5 Kanzlei & Team (Kapitel in Bordeaux) mit Stellenanzeige · § 6 Post an die Kanzlei (Leserbriefe) · § 7 Anfahrt mit Lageplan · § 8 Häufige Fragen als Stichwortverzeichnis · § 9 Erstberatung auf Briefbogen · Fuß mit Druckvermerk. Auf dem Handy: feste Aktionsleiste „Anrufen / Erstberatung anfragen“ (blendet sich beim Tippen in Formularfelder aus).

## Besondere Funktionen

1. **Taf. I – das Kleingedruckte:** Das Paragrafenzeichen zeichnet sich als doppelte Kontur (SVG), danach wird es Zeile für Zeile mit Mikrotext „gedruckt“ (Canvas, einmal gerendert und nur noch geblittet). Die Lupe folgt am Desktop dem Zeiger mit Trägheit, auf dem Handy lässt sie sich ziehen; ohne Interaktion ruht sie auf „drei Wochen“. Kein Dauer-Rendern: gezeichnet wird nur, solange sich die Lupe bewegt.
2. **Rechtsgebiete-Register:** Vier Zeilen wie ein Inhaltsverzeichnis mit Punktleitern. Am Desktop folgt ein Duoton-Vorschaubild dem Zeiger („Öffnen“/„Schließen“). Klick öffnet die Akte des Gebiets (Akkordeon mit `aria-expanded`, Pfeiltasten, Pos1/Ende): typische Fälle, „Was Sie jetzt tun sollten“, zuständige Anwältin bzw. zuständiger Anwalt, Knopf zur Anfrage. Ohne JavaScript sind alle vier offen.
3. **Fristen-Hinweis:** Drei Wochen als Kalenderstreifen, dessen 21 Tage sich beim Scrollen durchstreichen (Zähler als Ziffern-Rolle). Darunter der Rechner: Auswahl des Schreibens und Datum des Zugangs, rechnerisches Fristende als Orientierung, verbleibende Tage, Kalenderblatt (Zugang, Laufzeit, Ende, Feiertage in Bayern) – Wochenenden und Feiertage verschieben das Ende. Stempel „Orientierung · keine Rechtsberatung“, Hinweis, dass eine Anfrage keine Frist wahrt. „Dringende Erstberatung anfragen“ übernimmt Gebiet, Dringlichkeit und Datum ins Formular.
4. **Ablauf als Zeitstrahl mit Marginalien:** Sechs Absätze; links Zeitpunkt und Randnotiz mit Normzitat. Am Desktop klebt daneben ein Stapel Aktendeckel (Kraftpapier, Reiter „Abs. 1–6“, Foto mit Büroklammer), der sich mit dem Lesefortschritt auffächert; die Linie füllt sich. Auf dem Handy fächern sich die Akten einmal auf, wenn sie ins Bild kommen.
5. **FAQ mit Live-Suche:** 16 Fragen, Filterung während der Eingabe (tolerant bei Umlauten: „kuendigung“ findet „Kündigung“), Treffer werden markiert, Hinweis bei Treffern nur in der Antwort, Themenfilter, Leerzustand mit Vorschlägen. Taste `/` springt in die Suche, `Esc` leert sie.
6. **Erstberatung anfragen:** Ruhiger Schritt-Dialog auf einem Briefbogen (Rechtsgebiet → Fallschilderung mit Zeichenzähler und Gegenseite → Dringlichkeit mit optionalem Fristdatum, Rechtsschutz, Gesprächsform → Kontakt). Bisherige Angaben stehen als gesetzte Zeilen über der aktuellen Frage und lassen sich mit „ändern“ zurückholen. Hinweis „Durch diese Anfrage entsteht kein Mandat“ plus Pflicht-Bestätigung, Zusammenfassung mit Stempel und „Demo – es wurde nichts gesendet“. Eingaben werden nur per `textContent` ausgegeben.

Außerdem: Kapitelfarben über animierbare CSS-Eigenschaften (`@property`, auch die Browserleiste wechselt mit), Leitartikel, dessen Wörter beim Scrollen eingedruckt werden (CSS `sticky`, kein Pin), Leserbriefe als horizontale Strecke mit Tiefe (sticky), Siegel, die sich mit dem Scroll drehen, Fußnoten als Randnotiz am Zeiger, magnetische Knöpfe, Zeichen-Rollen in der Navigation, lebender Kolumnentitel im Kopf, Lesebändchen als Scroll-Fortschritt, Inhaltsverzeichnis als Menü (`<dialog>`), eigener Lageplan der Altstadt (SVG) mit gezeichnetem Fußweg, Einzugsgebiet mit verknüpfter Liste, „Jetzt erreichbar“ nach Berliner Zeit, Papierkorn.

## Bewegung („Zeilenguss“)

Kurven und Dauern stehen in `style.css` → `:root`: `--ease-out` (Zeilen landen), `--ease-in-out` (Ziehfeder, Akten, Kapitelwechsel), `--ease-drawer` (Paneele), `--t-press` 140 ms, `--t-ui` 220 ms, `--t-drawer` 380 ms, `--t-line` 760 ms, `--t-rule` 1000 ms, `--t-file` 820 ms, `--t-chapter` 700 ms, `--stagger` 45 ms. Die Titelseite steht per CSS nach spätestens ~0,4 s; alles darunter startet in Häppchen. Hover-Effekte nur bei feinem Zeiger.

## Anpassen

- **Name, Telefon, Adresse, Öffnungszeiten:** in `index.html` (Kopf, Titelseite, Menü, Anfahrt, Formular, Fuß, JSON-LD im `<head>`), `impressum.html` und `datenschutz.html`. Telefonnummer immer doppelt ändern: sichtbar (`0911 555 63 30`) und im Link (`tel:+499115556330`). Die Logik der Öffnungszeiten steht in `main.js` unter `OPENING`, das Gründungsjahr für „Jahrgang“ unter `FOUNDED`.
- **Farben:** `style.css` → `:root` (Kapitel „Papier“) sowie die Blöcke für `ink`, `wine` und `news` direkt darunter. Welche Farbe ein Abschnitt hat, steht im HTML als `data-chapter`. Die Farben der Browserleiste stehen in `main.js` unter `CHAPTER_BG`, die des Kleingedruckten unter `MICRO`.
- **Schriften:** `@font-face` am Anfang von `style.css`, Dateien in `assets/fonts/`.
- **Bilder:** Dateien in `assets/img/` gleichnamig ersetzen (jeweils `-480.webp` und `-960.webp`) oder `src`/`srcset`/`width`/`height`/`alt` in `index.html` anpassen. Fotos sind höchstens 960 px breit und werden nie bildschirmfüllend gezeigt. Duoton nachbauen: `convert in.jpg -colorspace gray -sigmoidal-contrast 3,50% +level-colors '#161112','#f1eadf' out.webp`.
- **Kleingedrucktes im Paragrafen:** `main.js` → `MICRO.text` (Sätze mit `*` werden bordeaux gesetzt), `MICRO.mag` (Vergrößerung der Lupe), `MICRO.rest` (Ruheplatz der Lupe).
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

`?motion=off` an die Adresse hängen, um alle Animationen abzuschalten; bei „Bewegung reduzieren“ im Betriebssystem gilt dasselbe automatisch (dann ohne Smooth Scroll, ohne Kapitelwechsel, Lupe ruht). Ohne JavaScript bleibt alles lesbar und bedienbar.

## Hinweise

- `noindex`, keine Cookies, kein Tracking, keine externen Anfragen.
- Rechtliche Inhalte (Fristen, Normzitate, FAQ, Kleingedrucktes) sind allgemeine Orientierung für die Demo und keine Rechtsberatung. Vor einem echten Einsatz fachlich prüfen lassen.
- Bildnachweis: `assets/img/BILDNACHWEIS.md` (StockSnap, CC0).
