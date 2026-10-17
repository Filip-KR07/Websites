# Tanzschule Taktvoll – Modell „Drehung“

Demo-Website für einen **fiktiven** Betrieb (Tanzschule in Augsburg) aus Filip Kramars Arena. Statisch, ohne Build, ohne externe Requests.

## Gestaltungsidee
Die Seite ist ein Ballabend in Akten: Ein Vorhang öffnet die Bühne, ein Verfolgerspot sucht die Tanzfläche ab, und zwischen den Kapiteln fällt der Vorhang erneut. Alles, was man auf einem Ball in der Hand hält, wird zur Oberfläche – das Programmheft (Kurse), die Tischkarte (Tanz-Finder), die Tanzkarte mit Bleistift (Kursplan), die Schallplatte mit Preisaufkleber (Hochzeitstanz). Die Bewegung zählt mit: Jede Choreografie folgt dem Dreivierteltakt – die „1“ ist betont (weiter, mit Schwung), „2“ und „3“ folgen leicht; ein Schlag dauert 420&nbsp;ms (`--beat`). Typografie dreht und schwingt (Buchstaben von „drehen“, Rueda-Kreis des Teams, Gewichtsachse der Zählzeiten), Fotos sind einheitlich in Pflaume-Magenta-Champagner getont, Bewertungen stehen als Tintenstempel statt als Zahlenreihe.

## Abschnitte
Header mit Menü und Probestunden-CTA · Hero „Bühne“ (Vorhang, Verfolgerspot, Fußspuren, Stempel) · Notenzeile (Takt-Band) · Kurse als Programmheft · Zählzeit (Sticky-Erzählung) · Tanz-Finder mit Tischkarte · Schritt-Lehrer (II. Akt) · Kursplan als Tanzkarte · Hochzeitstanz mit Schallplatte (III. Akt) · Team als Rueda-Kreis · Tanzparty-Plakat · Stimmen mit Stempel · Anfahrt mit SVG-Skizze · FAQ · Anmeldekarte · Footer. Dazu `impressum.html` und `datenschutz.html` (Muster).

## Spezial-Features
- **Hero-Bühne**: Einzählen „1-2-3“ und Vorhang öffnen als Intro (≤ 1,2 s, einmal pro Sitzung, per Klick/Taste/Scroll überspringbar; Text steht sofort im DOM). Spotlight folgt der Maus mit Nachlauf, auf Touch wandert es langsam (CSS); Fußspuren tanzen eine Drehung (SVG, pausiert außerhalb des Viewports). Die Buchstaben von „drehen“ schwingen ein, drehen sich beim Hover und schwingen beim Wegscrollen aus.
- **Set Pieces (Scroll)**: Akt-Vorhänge öffnen sich vor Schritt-Lehrer und Hochzeitstanz · „Zählzeit“ baut sich Wort für Wort auf (`position: sticky`), Ziffern wechseln die Gewichtsachse, am Ende färbt sich die Seite magenta · Notenzeile reagiert auf Scroll-Tempo · Schallplatte gleitet aus der Hülle, Tonarm senkt sich · Rueda-Kreis des Teams dreht mit · Tanzkarten-Rahmen und Anfahrtsweg zeichnen sich.
- **Tanz-Finder**: Anlass + Erfahrung (bei Kindern: Alter) → Kursvorschlag auf einer Tischkarte (klappt beim Wechsel), Link in den Kursplan und Vorauswahl im Formular. Auswahl wird mit Bleistift-Kreis markiert.
- **Schritt-Lehrer**: Walzer, Cha-Cha, Discofox als animierte Fußspuren mit Zählzeiten, BPM-Regler, Start/Pause, Rolle Führen/Folgen, optionaler Klick-Ton.
- **Kursplan (Tanzkarte)**: Wochentag-Tabs (Pfeiltasten), Niveau-Filter, freie Plätze als offene Kreise. Ohne JavaScript werden alle Tage untereinander gezeigt.
- **Hochzeitstanz-Konfigurator**: Stunden, Wunschlied, Tempo, Stil, Extras → Preis als Preisaufkleber (Beispielrechnung); Ihr Liedtitel steht auf dem Plattenetikett, die Drehzahl folgt dem Tempo.
- **Bewegungssystem**: CSS-Variablen `--beat` (420 ms), `--bar`, `--ease-*`, `--stagger`; Reveals im 1-2-3-Muster (die Eins betont). `?motion=off` bzw. reduzierte Bewegung schaltet alles auf statisch, GSAP/Lenis werden dann gar nicht geladen.

## Anpassen
- **Name, Telefon, Adresse**: in `index.html` (Header, Kontakt, Footer, JSON-LD) sowie `impressum.html`/`datenschutz.html` suchen und ersetzen (`0821 555 74 10`, `tanzen@taktvoll.de`, `Provinostraße 52`).
- **Farben/Schriften/Bewegung**: CSS-Variablen oben in `style.css` (`--plum`, `--magenta`, `--champagne`, `--beat` …).
- **Bilder**: Die Seite nutzt getönte Fassungen `assets/img/<name>-duo-960.webp`/`-480.webp` (Pflaume→Magenta→Champagner, erzeugt mit ImageMagick `-clut`). Eigene Fotos ebenso tönen oder unter gleichem Namen ablegen, Alt-Texte in `index.html` anpassen. `grain.webp` ist die Papierkörnung.
- **Preise, Tempi, Kursvorschläge**: Konstanten oben in `main.js` (`WED_*`, `DANCES`, `FINDER`).
- **Kursplan**: direkt als Liste in `index.html` (`.plan-item` mit `data-level`, freie Plätze als `style="--f:frei;--n:gesamt"`), Tageszähler passt JavaScript an.

## Lokal starten
```
cd /home/user/Websites && python3 -m http.server 8947
# http://127.0.0.1:8947/arena/tanzschule-taktvoll/   (?motion=off schaltet Animationen ab)
```

Fotos: StockSnap (CC0), Nachweis in `assets/img/BILDNACHWEIS.md`. Schriften: Big Shoulders Display, Plus Jakarta Sans (OFL, Lizenzen in `assets/fonts/`).
