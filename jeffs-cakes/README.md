# Jeff's Cakes – Entwurf „Cheesecake & Jazz“

Verkaufs-Entwurf für [Jeff's Cheesecake](https://jeffscakes.com/), Café Linnering 5, 22299 Hamburg-Winterhude.
Idee aus Jeffs eigener Geschichte: als Teenager in den New Yorker Jazzclubs zu jung für die zwei Pflicht-Drinks,
also Cheesecake und ein Glas Milch. Die Kuchen heißen schon wie Musikstücke (Blues-berry, Banana Bossa, Bebop
Brownies …), deshalb wird die Seite zum Plattencover: Im Hero gleitet eine Schallplatte mit Jeffs Logo als Label
aus der Hülle, die Kuchenkarte ist eine Setlist mit Seite A/B/C und Bonus Track.

Statische Seite ohne Build und ohne Bibliotheken: `index.html` + `css/style.css` + `js/main.js`, Schriften in
`fonts/`, Bilder in `img/`. Der Ordner läuft eigenständig.

```bash
python3 -m http.server 8080 --directory jeffs-cakes
# → http://127.0.0.1:8080/   (Animationen aus: ?motion=off)
```

## Arena

Unter `arena/` liegen sechs Varianten, die unabhängig gebaut und von zwei Jurys im Browser bewertet wurden
(drei andere Heros auf dieser Seite, drei komplett eigene Designs). Übersicht: `arena/index.html`, Ergebnis und
bekannte Schwächen in `arena/README.md`. Nichts davon ist hier übernommen.

## Aufbau

| Abschnitt | Inhalt |
|---|---|
| Hero | „Cheesecake & Jazz“, Plattenhülle mit Blues-berry-Foto, Platte dreht mit 33⅓ U/min (Pause-Knopf, stoppt außerhalb des Bildschirms) |
| Setlist | Alle 18 Kuchen mit Preisen, Filter glutenfrei / laktosefrei / vegan. Desktop: links „Jetzt läuft“ mit Foto zum Track unter der Maus. Klick öffnet den Kuchen mit Größe, Optionen, Anzahl |
| Saison | Pumpkin Polka als Bonus Track (Herbst) |
| Geschichte | Liner Notes: New York, 70er, Zitat leuchtet Wort für Wort beim Scrollen auf |
| Café | Foto, Angebot, Öffnungszeiten mit Live-Status (Zeitzone Hamburg), Route, Telefon, Google-Bewertungen |
| Feiern | Cheese(cup)cakes, Brownies-Blech, Anfrage für Größeres |
| So bestellst du | Drei Schritte, Winterpause |
| Bestellung | Schublade (Handy: Blatt von unten, per Wisch schließbar): Posten, Abholen/Liefern, Datum, Uhrzeit, Kontakt, PayPal/Überweisung |

## Bestellung im Entwurf

Die Regeln stammen von jeffscakes.com: mindestens 3 Werktage Vorlauf, Lieferung nur im Hamburger Raum
(PLZ 20000–22999) zwischen 11 und 19 Uhr, Abholung zu den Café-Zeiten, Winterpause 23.12.–11.1.,
bei Überweisung frühestens zwei Tage nach Zahlungseingang. Der Warenkorb bleibt im Browser (localStorage).

„Bestellung absenden“ öffnet im Entwurf das E-Mail-Programm mit der fertigen Bestellung an info@jeffscakes.com.
Für den Livegang an den vorhandenen Bestell-Server (`api.jeffscakes.com`, PayPal) anschließen: in `js/main.js`
Abschnitt 5 den `mailto:`-Teil durch den API-Aufruf ersetzen.

## Anpassen

- **Kuchen:** je ein `<li class="track">` in `#setlist`. Preise und Größen in `data-groessen`, Optionen in
  `data-optionen`, Filter in `data-diaet` (Kommentar über der Setlist erklärt alles). Bilder in `img/kuchen/`
  als `<id>-480.webp` und bei `data-gross="1"` zusätzlich `<id>-960.webp`.
- **Öffnungszeiten:** Tabelle in `#cafe` (`data-zeiten` steuert den Live-Status), dazu JSON-LD im `<head>` und Fuß.
- **Farben, Schriften, Kurven:** `css/style.css`, Abschnitt 2 (Tokens), Kontraste stehen im Kommentar.
- Zwischenspeicher: CSS und JS hängen mit `?v=1` an. Nach Änderungen die Zahl in allen drei HTML-Dateien erhöhen.

## Vor dem Livegang offen

- **Fotos vereinheitlichen:** 10 Kuchen haben die dunklen Jazz-Fotos (1400–1500 px), 8 nur helle Produktfotos
  mit 440 px (Jeff's Classic, Chocolate Cha-Cha, Coconut, Banana, Vegan, Brownies, Cupcakes) bzw. Handyfotos
  (Crumble Rumble, Pumpkin Polka). Am besten alle im Jazz-Stil nachfotografieren. Jeff-Porträt nur 379 px.
- **Optionen:** Laktose-/glutenfrei ohne Aufpreis angenommen (auf jeffscakes.com nicht ersichtlich).
- **Abholorte:** jeffscakes.com lädt Abholorte vom Server; im Entwurf nur das Café.
- **Impressum:** Inhaber bzw. Rechtsform und ggf. USt-IdNr. fehlen auch auf der aktuellen Seite (`ANPASSEN` im HTML).
- **Datenschutz:** Entwurf passend zu dieser Seite, Hoster und PayPal eintragen und prüfen lassen.
- **Englisch:** jeffscakes.com ist zweisprachig, der Entwurf bisher nur Deutsch.
- `<meta name="robots" content="noindex, nofollow">` löschen, Fuß-Hinweis „Entwurf zur Ansicht“ entfernen.

## Texte

Alle Inhalte, Preise und Zeiten von jeffscakes.com (Stand 3. Oktober 2026). Kuchentexte durchgehend auf „du“
umgestellt und Tippfehler korrigiert (z. B. Hokkaido, Pekannüsse).

## Technik

- Ohne JavaScript ist alles lesbar (Bestellen dann per E-Mail-Hinweis). Bei „Bewegung reduzieren“ oder `?motion=off`:
  kein Intro, keine drehende Platte, Dialoge blenden nur über.
- Bewegung nach Emil Kowalskis Regeln: nur `transform`/`opacity`/`clip-path`, eigene Kurven (`--ease-out`,
  `--ease-drawer`), Druck-Rückmeldung `scale(0.97)`, Hover nur bei Maus, Dialoge rein 420 ms / raus 220 ms.
- Handy: `viewport-fit=cover` mit Safe-Area-Abständen, 16-px-Eingabefelder (kein Zoom), `touch-action: manipulation`,
  Blätter folgen dem Finger und schließen bei schnellem Wisch (> 0,11 px/ms) oder ab einem Viertel der Höhe.
- Natives `<dialog>`: Fokus bleibt im Dialog, Esc schließt, Fokus springt zurück.

## Bild- und Schriftnachweis

Alle Fotos und das Logo von jeffscakes.com (Jeff's Cheesecake), zu WebP verkleinert.
Schriften (SIL Open Font License 1.1, lokal): Bebas Neue (wie auf jeffscakes.com), Instrument Serif, Source Sans 3.
