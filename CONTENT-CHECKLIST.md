# Content-Checkliste

Alle Platzhalter stehen sichtbar als `[[PLATZHALTER: …]]` im HTML. Ersetze sie direkt in der jeweiligen Datei.

**Fertig-Check:** `grep -c "PLATZHALTER" index.html impressum.html datenschutz.html` muss überall `0` ergeben.

Aktuell offen: **130 Stellen** in `index.html`, verteilt auf 15 Abschnitte.

## Reihenfolge der Abschnitte

| # | Abschnitt | Anker | Offene Stellen |
|---|---|---|---|
| – | Meta, Menü, Socials | `<head>`, `.menu` | 4 |
| 1 | Hero | `#hero` | 6 |
| 2 | Über mich | `#intro` | 6 |
| 3 | Was ich tue | `#leistungen` | 6 |
| 4 | Arbeitsweise | `#arbeitsweise` | 11 |
| 5 | Fokus (Wort-Tausch) | `#fokus` | 8 |
| 6 | Der Weg | `#weg` | 10 |
| 7 | Projekte | `#projekte` | 16 |
| 8 | Zahlen | `#zahlen` | 10 |
| 9 | Haltung | `#statement` | 3 |
| 10 | Stimmen | `#stimmen` | 12 |
| 11 | Galerie | `#galerie` | 7 |
| 12 | Werte | `#werte` | 6 |
| 13 | Jetzt | `#jetzt` | 10 |
| 14 | Fragen | `#fragen` | 11 |
| 15 | Kontakt | `#kontakt` | 4 |

## Was wo hingehört

**Meta und Menü** – Beschreibung für Suchmaschinen und Vorschau (höchstens 155 Zeichen), dazu die Profil-Adressen bei LinkedIn und Instagram. Nicht genutzte Netzwerke einfach löschen, im Menü und im Kontakt-Abschnitt.

**Hero** – Bereich oder Branche in ein bis drei Wörtern, dein Leitsatz in einem Satz, deine Stadt, sowie die drei Werte im Kurzprofil. Halte die Kurzprofil-Werte knapp, sie stehen auf dem Handy nebeneinander.

**Über mich** – ein kurzer, starker Satz nach „Ich bin Filip.“, danach zwei Absätze zu je zwei bis drei Sätzen: woher du kommst und was dich antreibt, dann woran du heute arbeitest.

**Was ich tue** – drei Säulen mit Titel und je zwei Sätzen. Die römischen Ziffern bleiben.

**Arbeitsweise** – vier Schritte mit Titel und ein bis zwei Sätzen, dazu eine Einleitung.

**Fokus** – ein Satzanfang, der stehen bleibt, und fünf Begriffe, die beim Scrollen durchgetauscht werden. Die Begriffe sollten kurz sein, ein bis zwei Wörter, sonst springt die Zeile. Dazu ein bis zwei Sätze, die den Satz auflösen.

**Der Weg** – fünf Stationen mit Jahr, Titel und ein bis zwei Sätzen. Die letzte Station heißt „Heute“.

**Projekte** – vier Karten mit Verweis, Kategorie, Name und einem Einzeiler von höchstens 90 Zeichen. Bilder siehe `assets/README.md`.

**Zahlen** – vier Kennzahlen. Pro Kachel: Beschriftung, Endwert im Text **und** im Attribut `data-to`, optional `data-decimals`, dazu `data-points` mit mindestens zwei kommagetrennten Werten für die kleine Verlaufslinie, und eine Kurznotiz.

**Haltung** – dein Leitsatz in drei Zeilen, die mittlere wird kursiv hervorgehoben.

**Stimmen** – vier Zitate mit Name und Rolle. Zwei bis vier Sätze je Zitat. Weniger als vier geht auch, dann die überzähligen `<article class="stimme …">` und die zugehörigen Punkte löschen.

**Galerie** – Bildbeschreibungen für sechs Fotos, wichtig für Vorlesesoftware, dazu ein kurzer Gedanke zwischen den Bildern.

**Werte** – drei Prinzipien mit Titel und zwei bis drei Sätzen.

**Jetzt** – die Statuskarte: Zustand, Datum, aktuelles Hauptprojekt, Nebenprojekt, was du gerade lernst, wofür du offen bist, Standort und Schlagwörter. Das Datum steht als `datetime` im `<time>`-Element und sollte beim Pflegen mitgeändert werden.

**Fragen** – fünf Fragen mit Antworten von zwei bis vier Sätzen. Die erste ist beim Laden geöffnet (`data-faq-open`).

**Kontakt** – ein bis zwei Sätze, wofür man dich anschreiben soll.

## Rechtliches

`impressum.html` und `datenschutz.html`: Anschrift, optional Telefon und Umsatzsteuer-Nummer, zuständige Landesdatenschutzbehörde, Stand als Monat und Jahr. Die blaue Hinweisbox in beiden Dateien vor der Veröffentlichung löschen.

## Domain

`filipkramar.de` steht in `index.html` (Canonical und Vorschau), `sitemap.xml`, `robots.txt`, beiden Rechtsseiten und `assets/og/og-template.html`. Bei anderer Adresse überall ersetzen.

## Bilder

Siehe `assets/README.md`.
