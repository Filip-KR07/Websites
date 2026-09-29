# Content-Checkliste

Alle offenen Stellen stehen sichtbar als `[[PLATZHALTER: …]]` im HTML (auch in Attributen wie `alt`, `href`, `datetime`, `data-to`, `data-count`, `data-points`). Ersetze sie direkt in der jeweiligen Datei.

**Fertig-Check** (zählt Vorkommen, nicht Zeilen, und findet jede Art von `[[…]]`):

```sh
grep -o "\[\[" index.html impressum.html datenschutz.html | wc -l
```

Muss `0` ergeben. Pro Datei: `grep -o "\[\[" index.html | wc -l` (bzw. `impressum.html`, `datenschutz.html`).
`grep -c` reicht nicht, es zählt Zeilen – in manchen Zeilen stehen zwei Platzhalter.

Stand dieser Liste: **180 Stellen** – 157 in `index.html`, 9 in `impressum.html`, 14 in `datenschutz.html`. Nach jeder Änderung am HTML neu zählen; die Zahlen pro Abschnitt unten sind eine Momentaufnahme.

## Abschnitte in Seitenreihenfolge

| # | Abschnitt | Anker | Offene Stellen |
|---|---|---|---|
| – | Menü (Socials) | `.menu` | 2 |
| 1 | Hero | `#hero` | 4 |
| 2 | Über mich | `#intro` | 12 |
| 3 | Die Rechnung | `#wert` | 0 |
| 4 | Rechner | `#rechner` | 0 (Standardwerte prüfen, siehe unten) |
| 5 | Was ich tue | `#leistungen` | 6 |
| 6 | Arbeitsweise | `#arbeitsweise` | 9 |
| – | Laufband | `.marquee` | 0 |
| 7 | Fokus (Wort-Tausch) | `#fokus` | 8 |
| 8 | Der Weg | `#weg` | 14 |
| 9 | Projekte | `#projekte` | 16 |
| 10 | Zahlen | `#zahlen` | 25 |
| 11 | Haltung | `#statement` | 3 |
| 12 | Stimmen | `#stimmen` | 12 |
| 13 | Galerie | `#galerie` | 13 |
| 14 | Werte | `#werte` | 6 |
| 15 | Jetzt | `#jetzt` | 12 |
| 16 | Fragen | `#fragen` | 11 |
| 17 | Kontakt | `#kontakt` | 3 |
| – | Footer | `.footer` | 1 |
| | **Summe `index.html`** | | **157** |
| – | Impressum | `impressum.html` | 9 |
| – | Datenschutz | `datenschutz.html` | 14 |

Die Zahlen pro Abschnitt kannst du so nachzählen (Beispiel `#zahlen`, bis zum nächsten Abschnitt):

```sh
sed -n '/id="zahlen"/,/id="statement"/p' index.html | grep -o "\[\[" | wc -l
```

## Was wo hingehört

**Kopfdaten** – Titel, Beschreibung und Vorschau (`og:`) sind fertig formuliert. Nur ändern, wenn sich dein Angebot ändert; Beschreibung höchstens 155 Zeichen. Vorschaubild siehe `assets/README.md`.

**Menü und Kontakt** – Profil-Adressen bei LinkedIn und Instagram. Nicht genutzte Netzwerke löschen, im Menü und im Kontakt-Abschnitt.

**Hero** – Stadt in der Bildunterschrift und im Kurzprofil, Jahre Erfahrung und Anzahl umgesetzter Websites. Nur echte Zahlen eintragen; die Werte stehen auf dem Handy nebeneinander, also kurz halten.

**Über mich** – ein kurzer, starker Satz nach „Ich bin Filip.“, zwei Absätze zu je zwei bis drei Sätzen, dazu drei Kennzahlen. Pro Kennzahl den Wert **zweimal** eintragen: im Attribut `data-count="…"` (nur Ziffern, z. B. `12`) und als Text im selben `<span>` (dort steht jetzt kurz `[[Zahl]]`, damit die Zeile nicht überläuft). Ein Zusatz wie `+` oder `%` gehört direkt hinter das `</span>`, innerhalb von `stat__num`.

**Die Rechnung** – nichts offen.

**Rechner** – nichts offen, aber die Standardwerte sind Annahmen und sollten zu deinem Angebot passen: Investition **3.000 €** (Feld `rx-invest`, `value="3.000"`, und `def: 3000` in `assets/fx/rechner.js`), 500 Besucher pro Monat, 1,5 % Anfragen, 25 % Abschluss, 1.000 € Auftragswert, 30 % Marge. Beim Ändern HTML-Wert und `def` in `rechner.js` gemeinsam anpassen.

**Was ich tue** – drei Säulen mit Titel und je zwei Sätzen, z. B. Design, Technik, Sichtbarkeit. Die römischen Ziffern bleiben.

**Arbeitsweise** – vier Schritte mit Titel und ein bis zwei Sätzen (z. B. Gespräch, Konzept, Umsetzung, Launch & Übergabe), dazu die Region für Termine vor Ort in der Einleitung.

**Fokus** – ein Satzanfang, der stehen bleibt, und fünf Begriffe, die beim Scrollen durchgetauscht werden. Ein bis zwei Wörter je Begriff, sonst springt die Zeile. Dazu ein bis zwei Sätze, die den Satz auflösen.

**Der Weg** – fünf Stationen mit Jahr, Titel und ein bis zwei Sätzen. Die letzte Station heißt „Heute“.

**Projekte** – vier Karten mit Verweis, Kategorie, Name und einem Einzeiler von höchstens 90 Zeichen. Nur echte Projekte, Beispiele als solche kennzeichnen. Bilder siehe unten.

**Zahlen** – vier Kennzahlen (z. B. umgesetzte Websites, Jahre Erfahrung, Ø Ladezeit, Projekte pünktlich live). Pro Kachel: Beschriftung; Endwert im Text (statt `[[Zahl]]`) **und** im Attribut `data-to` (nur Ziffern, Dezimalpunkt), bei Kommazahlen `data-decimals="1"`; ein Zusatz wie `+`, `%` oder `s` in `<span class="zahl__suffix">`; `data-points` mit mindestens zwei kommagetrennten echten Werten für die Verlaufslinie (sonst bleibt sie eine neutrale waagerechte Linie); eine Kurznotiz und darunter der Stand mit Quelle. Nur Zahlen, die du belegen kannst.

**Haltung** – dein Leitsatz in drei Zeilen, die mittlere wird kursiv hervorgehoben.

**Stimmen** – vier Zitate mit Name und Rolle, zwei bis vier Sätze je Zitat, wörtlich und mit Erlaubnis (der Hinweis darunter sagt das zu). Weniger als vier geht auch: überzählige `<article class="stimme …">` löschen.

**Galerie** – sechs Bildbeschreibungen (`alt`, wichtig für Vorlesesoftware), dazu ein kurzer Gedanke zwischen den Bildern und die Bildunterschriften.

**Werte** – drei Prinzipien mit Titel und zwei bis drei Sätzen.

**Jetzt** – die Statuskarte: Datum im `datetime` als `JJJJ-MM-TT` (daraus entsteht „vor X Wochen aktualisiert“) und als Text, Hauptprojekt, Nebenprojekt, was du gerade lernst, ab wann du neue Website-Projekte annimmst, Standort, Schlagwörter. Das Datum bei jeder Pflege mitändern.

**Fragen** – fünf Fragen mit Antworten von zwei bis vier Sätzen, z. B. Was kostet eine Website? Wie lange dauert es? Welche laufenden Kosten kommen dazu? Kann ich Inhalte selbst ändern? Was brauchst du von mir? Die erste ist beim Laden geöffnet (`data-faq-open`).

**Kontakt** – Antwortzeit und Social-Adressen.

**Footer** – Stadt.

## Rechtliches

`impressum.html`: Name/Firma, Anschrift, optional Telefon, bei Gesellschaften Vertretung und Register, USt-IdNr. oder Wirtschafts-IdNr. (falls vorhanden), Verantwortlicher nach § 18 MStV.
`datenschutz.html`: Verantwortlicher, Hoster (und AVV/Drittland nur, wenn zutreffend), Löschfristen für Server-Logs und E-Mails, zuständige Landesdatenschutzbehörde, Stand als Monat und Jahr.
Die blaue Hinweisbox in beiden Dateien vor der Veröffentlichung löschen. Beide Seiten ersetzen keine Rechtsberatung.

## Bilder

| `data-slot` | Abschnitt | Format | Mindestgröße | Hinweis |
|---|---|---|---|---|
| `portrait-01` | Über mich | 3:4 | 1200×1600 px | |
| `venture-01` … `venture-04` | Projekte | 4:5 | 1200×1500 px | Motiv mittig, beim Parallax werden ca. 20 % beschnitten |
| `gallery-01`, `gallery-06` | Galerie | 4:3 | 1600×1200 px | |
| `gallery-02`, `gallery-05` | Galerie | 3:4 | 1200×1600 px | |
| `gallery-03` | Galerie | 1:1 | 1200×1200 px | |
| `gallery-04` | Galerie | 3:2 | 2400×1600 px | Mittelbild, wird bildschirmfüllend, Motiv mittig |
| `hero-art` | Hero | ca. 3:4 | 1200×1520 px | optional, freigestellt mit Transparenz |

Details (Dateinamen, Ablage) in `assets/README.md`.

## Domain

`filipkramar.de` steht in `index.html` (Canonical und Vorschau), `sitemap.xml`, `robots.txt`, beiden Rechtsseiten und `assets/og/og-template.html`. Bei anderer Adresse überall ersetzen.
