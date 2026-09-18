# Content-Checkliste

Alle Platzhalter stehen sichtbar als `[[PLATZHALTER: …]]` im HTML. Ersetze sie direkt in der jeweiligen Datei.
Fertig-Check: `grep -n "PLATZHALTER" *.html *.xml *.txt` darf nichts mehr ausgeben.

## index.html

| Bereich | Fundort (Suchbegriff) | Was eintragen | Länge |
|---|---|---|---|
| Meta | `<meta name="description"` und `og:description` | Ein Satz, was du machst | ≤ 155 Zeichen |
| Hero | `data-hero-eyebrow` | Bereich/Branche, z. B. „E-Commerce“ | 1–3 Wörter |
| Hero | `data-hero-caption` | Deine Stadt | 1 Wort |
| Hero | `data-hero-sub` | Dein Leitsatz | 1 Satz, ≤ 90 Zeichen |
| Über mich | `id="intro"` → `h2` | Kurzer starker Satz nach „Ich bin Filip.“ | ≤ 60 Zeichen |
| Über mich | `class="lead"` | Absatz 1: wer du bist, woher, Antrieb | 2–3 Sätze |
| Über mich | folgender `<p>` | Absatz 2: was du heute machst | 2–3 Sätze |
| Kennzahlen | `data-count="5"` usw. | Zahl im Attribut **und** im Text ändern, Label darunter | Zahl + ≤ 4 Wörter |
| Marquee | `class="marquee__item"` | Bereich und Stadt | je 1–2 Wörter |
| Der Weg | `data-journey-item` (5×) | Jahr, Titel, 1–2 Sätze je Station | Titel ≤ 50 Zeichen |
| Projekte | `data-ventures-card` (4×) | `href`, Kategorie, Name, Einzeiler | Einzeiler ≤ 90 Zeichen |
| Haltung | `class="line"` (3×) | Dreizeiliger Leitsatz, Zeile 2 kursiv | je ≤ 40 Zeichen |
| Galerie | `alt="[[…]]"` (6×) | Bildbeschreibung (Barrierefreiheit) | ≤ 80 Zeichen |
| Galerie | `class="galerie__quote"` | Kurzer Gedanke | ≤ 120 Zeichen |
| Werte | `class="wert"` (3×) | Titel + 2–3 Sätze | Titel 1–2 Wörter |
| Kontakt | `class="kontakt__lead"` | Wofür man dich anschreiben soll | 1–2 Sätze |
| Socials | `LinkedIn-URL`, `Instagram-URL` (Menü **und** Kontakt) | Profil-Links; nicht genutzte `<a>`/`<li>` löschen | – |
| Footer | `footer__copy` | Stadt | 1 Wort |

## impressum.html

Anschrift, optional Telefon, USt-ID (sonst Abschnitt löschen), Stand (Monat Jahr).
Die Hinweisbox (`class="notice"`) vor Veröffentlichung entfernen.

## datenschutz.html

Anschrift, zuständige Landesdatenschutzbehörde, Hosting-Abschnitt prüfen (Vercel vorausgefüllt), Stand.
Die Hinweisbox (`class="notice"`) vor Veröffentlichung entfernen.

## sitemap.xml / robots.txt / Canonical

Domain `filipkramar.de` ggf. ersetzen (auch `canonical`, `og:url`, `og:image` in allen drei HTML-Dateien).

## Bilder

Siehe `assets/README.md`.
