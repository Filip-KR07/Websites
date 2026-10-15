# Die Arena

20 fertige Demo-Websites für **fiktive** Betriebe aus 20 Branchen, dazu die Übersichtsseite `index.html`
(Filter nach Branchengruppe, Suche, Vorschaubilder). Die Übersicht zeigt außerdem die drei Handwerks-Modelle
aus `../handwerk/`. Alle Seiten sind statisch (HTML, CSS, JS), ohne Build-Schritt, mit selbst gehosteten
Schriften und ohne externe Anfragen. Jede Demo steht für sich und lässt sich als Startpunkt für einen echten
Kunden kopieren; jede hat ein eigenes `README.md` mit den Stellen, an denen Name, Telefon, Farben, Bilder und
Rechner-Werte geändert werden.

| Modell | Ordner | Beispielbetrieb | Gruppe | Kurz |
|---|---|---|---|---|
| „Wurzel“ | [`galabau-gruenform/`](galabau-gruenform/) | Grünform Garten- & Landschaftsbau, Kassel | Handwerk & Bau | Natürlich und architektonisch, mit Gartenplaner und Jahreszeiten. |
| „Glanz“ | [`reinigung-blitzblank/`](reinigung-blitzblank/) | Blitzblank Gebäudereinigung, Mannheim | Handwerk & Bau | Hell und frisch, mit Wisch-Effekt und Angebotsrechner. |
| „Nähe“ | [`pflege-lebenswert/`](pflege-lebenswert/) | Lebenswert Ambulanter Pflegedienst, Erfurt | Gesundheit | Warm und barrierearm, mit Lesbarkeits-Leiste und Pflegegrad-Orientierung. |
| „Fokus“ | [`optik-klarsicht/`](optik-klarsicht/) | Klarsicht Optik & Akustik, Bonn | Gesundheit | Minimal und präzise, mit Fokus-Effekt und Brillen-Anprobe. |
| „Pfote“ | [`tierarzt-pfotenwerk/`](tierarzt-pfotenwerk/) | Tierarztpraxis Pfotenwerk, Bremen | Gesundheit | Freundlich und kompetent, mit Notfall-Wegweiser und Impfplaner. |
| „Klarheit“ | [`zahnarzt-sommer/`](zahnarzt-sommer/) | Zahnarztpraxis Dr. Lea Sommer, München | Gesundheit | Hell und ruhig, mit Gebiss-Schema und Atemübung für Angstpatienten. |
| „Messing“ | [`barbershop-kaiser/`](barbershop-kaiser/) | KAISER Barbershop, Köln | Beauty | Dunkel und messingfarben, mit Termin-Buchung und Bart-Konfigurator. |
| „Seide“ | [`kosmetik-maison-belle/`](kosmetik-maison-belle/) | Maison Belle Kosmetik, Düsseldorf | Beauty | Luxuriös und seidig, mit Hauttyp-Quiz und Gutschein-Konfigurator. |
| „Tinte“ | [`tattoo-schwarzstich/`](tattoo-schwarzstich/) | Schwarzstich Tattoo, Kiel | Beauty | Blackwork und Tinte, mit Körper-Silhouette und Artist-Portfolio. |
| „Schmiede“ | [`fitness-forge/`](fitness-forge/) | FORGE Athletic Club, Berlin | Sport & Wohlbefinden | Schnell und laut, mit Kursplan, Mitgliedschafts-Konfigurator und Trainingsplan. |
| „Atem“ | [`yoga-atemraum/`](yoga-atemraum/) | Atemraum Yoga, Münster | Sport & Wohlbefinden | Organisch und ruhig, mit Atemübung, Stundenplan und Stil-Quiz. |
| „Ufer“ | [`hotel-seeblick/`](hotel-seeblick/) | Hotel Seeblick am Tegernsee, Gmund am Tegernsee | Gastronomie & Hotel | Alpin und luxuriös, mit Buchungs-Widget und Tag-Nacht-Hero. |
| „Tavola“ | [`trattoria-nonna-rosa/`](trattoria-nonna-rosa/) | Trattoria Nonna Rosa, Stuttgart | Gastronomie & Hotel | Lebendig und handgemacht, mit Speisekarte, Reservierung und Wein-Pairing. |
| „Adresse“ | [`immobilien-ostwald/`](immobilien-ostwald/) | Ostwald Immobilien, Frankfurt am Main | Beratung | Gehoben und architektonisch, mit Bewertung und Finanzierungsrechner. |
| „Paragraf“ | [`kanzlei-hartmann/`](kanzlei-hartmann/) | Hartmann Rechtsanwälte, Nürnberg | Beratung | Seriös und editorial, mit Rechtsgebiete-Explorer und Erstberatung. |
| „Bilanz“ | [`steuer-falk/`](steuer-falk/) | Falk & Partner Steuerberatung, Hannover | Beratung | Klar wie ein Kontenblatt, mit Fristenkalender und Unterlagen-Checkliste. |
| „Spur“ | [`fahrschule-gruene-welle/`](fahrschule-gruene-welle/) | Fahrschule Grüne Welle, Essen | Mobilität | Jung und verkehrsgrafisch, mit Theorie-Quiz und Kostenrechner. |
| „Drehmoment“ | [`kfz-berger/`](kfz-berger/) | Kfz-Meisterwerkstatt Berger, Dortmund | Mobilität | Technisch und präzise, mit Service-Rechner und klickbarem Auto. |
| „Blüte“ | [`florist-blattwerk/`](florist-blattwerk/) | Blattwerk Floristik, Heidelberg | Kreativ & Handel | Botanisch und editorial, mit Strauß-Konfigurator und Saisonkalender. |
| „Silber“ | [`fotografie-lichtwerk/`](fotografie-lichtwerk/) | Lichtwerk Hochzeitsfotografie, Dresden | Kreativ & Handel | Filmisch und still, mit Galerie, Paket-Konfigurator und Verfügbarkeit. |

## Online ansehen (GitHub Pages)

https://filip-kr07.github.io/Websites/arena/ – veröffentlicht durch `.github/workflows/pages-handwerk.yml`
(baut Tank-Treff, Paledo, `/handwerk/` und `/arena/` zusammen, weil ein Repo nur eine Pages-Seite hat).

## Lokal ansehen

```bash
python3 -m http.server 8080   # im Repo-Wurzelordner
# → http://127.0.0.1:8080/arena/
```

Animationen zum Testen abschalten: `?motion=off` an die Adresse einer Demo hängen.

## Wichtig vor einem echten Einsatz

- Alle Namen, Adressen, Telefonnummern, Bewertungen, Preise und Zahlen sind **erfunden**. Rechner, Quiz und
  Wegweiser liefern Beispielwerte und sind als unverbindliche Orientierung gekennzeichnet. Fachliche Inhalte
  (z. B. Fristen in der Kanzlei-Demo, Pflegegrade, Impfpläne, Steuertermine) vor einem echten Einsatz vom
  Betrieb prüfen lassen.
- Alle Seiten tragen `<meta name="robots" content="noindex">`. Für eine echte Kundenseite entfernen.
- Fotos sind CC0-Platzhalter von StockSnap (siehe `*/assets/img/BILDNACHWEIS.md`) und nur 960 px breit.
  Für echte Kunden eigene Fotos von Betrieb, Team und Arbeiten verwenden.
- Formulare senden nichts (kein Backend). Für den Livegang an einen Formular-Dienst oder eine
  Serverless-Funktion anbinden und diesen Dienst in der Datenschutzerklärung beschreiben.
- Impressum und Datenschutz sind Muster und ersetzen keine Rechtsberatung.
- Alle Pfade sind **absolut** (`/arena/<ordner>/…`), weil `vercel.json` `trailingSlash: false` setzt. Zieht eine
  Demo auf eine eigene Domain um, das Präfix `/arena/<ordner>` in den HTML-Dateien entfernen.

## Übersicht und Vorschaubilder

`assets/arena.css` und `assets/arena.js` gehören zur Übersicht (nutzt die Schriften von filipkramar.de aus
`../assets/fonts/`). `assets/preview/<ordner>-desktop.webp` (960×600, aus 1440×900) und `-mobile.webp`
(300 px breit, aus 390×844 bei 2-facher Pixeldichte) sind Screenshots der jeweiligen Startseite – nach
größeren Änderungen an einer Demo neu aufnehmen.

## Modernitäts-Prüfung (Oktober 2026)

Alle 23 Demos und beide Übersichten wurden mit den Skills design-critique, emil-design-eng und
improve-animations geprüft und nachgebessert. Die Gesamtnote stieg von 7,0–8,0 auf 8,0–8,6 (Skala 10).
Schwerpunkte: Layout-Sprünge durch GSAP-Pins beseitigt (CSS `sticky` statt `position: fixed`),
schnellerer erster Bildschirm (Start in Etappen, kürzere Hero-Intros), Wisch-Schienen statt langer
Kartenstapel auf dem Handy, Press-/Hover-Feedback und einheitliche Easing-Tokens. Das Prüfskript meldet
danach bei allen Demos 0 Befunde (1440/1920/1024/390/360 px, `?motion=off`, ohne JS).
