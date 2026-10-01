# Paledo Hamburg – Entwurf im Aurel-Design

Verkaufs-Entwurf für [Paledo – Café & Deli](https://www.paledohamburg.de/), Mühlenkamp 1, 22303 Hamburg.
Grundlage ist das Aurel-Design (`arena/design-fine-dining/` auf der Branch `claude/nice-noether-t2ji5a`): Aufbau, Bogen-Motiv,
Bewegung und Bodoni bleiben, dazu kommen Paledos Creme und Espresso-Braun und „Café & Deli“ in Schreibschrift wie im Logo.

Statische Seite ohne Build: `index.html` + `css/style.css` + `js/main.js`, Schriften in `fonts/`, Bilder in `img/`,
GSAP/ScrollTrigger/Lenis in `js/vendor/`. Der Ordner läuft eigenständig.

```bash
python3 -m http.server 8080 --directory paledo-hamburg
# → http://127.0.0.1:8080/   (Animationen aus: ?motion=off)
```

## Sprachen

`index.html` (Deutsch) und `en.html` (Englisch) teilen sich CSS, JS, Bilder und Schriften. Umschalter „EN/DE“ in der Navigation
und im Handy-Menü. Die Texte der Oberfläche, die `js/main.js` erzeugt (Bowl-Summe, Öffnungsstatus, Teilen), stehen dort oben in
`TEXT` und richten sich nach `<html lang>`. Impressum und Datenschutz gibt es nur auf Deutsch. Inhaltliche Änderungen bitte in
beiden HTML-Dateien machen.

## Vorschau (GitHub Pages)

https://filip-kr07.github.io/Websites/paledo-hamburg/ (englisch: `…/paledo-hamburg/en.html`)

Der Workflow `.github/workflows/pages-paledo.yml` veröffentlicht Tank-Treff (Wurzel, von `claude/peaceful-goldberg-e9in4f`) und
Paledo (`/paledo-hamburg/`) zusammen, weil ein Repo nur eine Pages-Seite hat. Läuft der Tank-Treff-Workflow erneut, ist Paledo
weg, bis dieser Workflow wieder läuft (Actions → „Run workflow“).

## Aufbau

| Abschnitt | Aus Aurel | Paledo |
|---|---|---|
| Hero | Foto zieht sich in den Bogen zurück, Name zweifarbig | „PALEDO“, danach schreibt sich „Café & Deli“ darunter |
| I Philosophie | Leitsatz, Zahlenleiste, Breitbild | „Bewusst genießen. Mit Herz und Anspruch.“, Zahlen aus Karte und Öffnungszeiten |
| II Bowl-Baukasten | Menü-Konfigurator | Create Your Own Bowl: 4 Bases, 2 Dressings, 1 Topping inklusive, Aufpreise und Extras rechnen live mit, Mittagsangebot mit Getränk, „Bowl teilen“. Darunter die Karte (Auszug) |
| III Gastgeber | Küchenchef | Muhammed Baydur & Ugur Kara, Werte, Jobs-Kasten |
| IV Ein Tag | Ein Abend | 09:00 Frühstück, 12:00 Lunch, 15:00 Matcha & Süßes |
| V Gutscheine | Reservierung | Gutscheinkarte (CSS), Link zu BON BON, Bedingungen |
| VI Besuch | Besuch | Öffnungszeiten mit Live-Status, Anfahrt, Kontakt, Instagram |

Alle Texte, Preise, Zeiten und Kontaktdaten stammen von paledohamburg.de (Stand 1. Oktober 2026).

## Vor dem Livegang offen

- **Fotos:** Hero, Bowls, Gastraum und Bildstrecke sind Platzhalter von Unsplash. Paledo hat online nur ein Foto ohne Text-Overlay in brauchbarer Größe (1024 px, mit eingebranntem Schriftzug) – es wird als Ausschnitt im Gastgeber-Bogen genutzt. Gebraucht werden: Hero quer ≥ 2000 px, Gastraum quer, Porträt der Inhaber 4:5, Bowls.
- **Gastgeber-Text:** zwei, drei persönliche Sätze der Inhaber (Kommentar `ANPASSEN` im HTML).
- **Dressings:** Annahme, dass höchstens zwei Dressings gehen (Karte sagt „2 frei“). Sonst `data-max` am Schritt entfernen und `data-aufpreis` setzen.
- **E-Mail:** Paledo nutzt drei Adressen (Impressum `hallo@`, Kontakt `info@`, Jobs `hello@`). Klären, welche stimmt.
- **Datenschutz:** Entwurf passend zu dieser Seite, Hoster eintragen und prüfen lassen.
- `<meta name="robots" content="noindex, nofollow">` löschen, Footer-Hinweis „Entwurf zur Ansicht“ ersetzen.

## Anpassen

- **Bowl-Baukasten:** Kommentar über `#bowls` im HTML. Grundpreis an `data-grundpreis`, pro Schritt `data-frei`, `data-aufpreis`, `data-max`, Extras mit `data-preis`. Preise auch in der Karte darunter pflegen.
- **Öffnungszeiten:** einzige Quelle ist die Tabelle in `#besuch` (`data-zeiten`), dazu JSON-LD und Footer.
- **Farben:** `css/style.css`, Abschnitt 2 (Tokens). Kontraste stehen im Kommentar.

## Bild- und Schriftnachweis

Unsplash-Lizenz, Quelle jeweils `https://images.unsplash.com/photo-<ID>`:

| Datei | Unsplash-ID |
|---|---|
| `img/hero-*` | 1495474472287-4d71bcdd2085 |
| `img/bowl-base-800` | 1512621776951-a57141f2eefd |
| `img/bowl-dressing-800` | 1623428187969-5da2dcea5ebf |
| `img/bowl-topping-800` | 1505576399279-565b52d4ac71 |
| `img/bowl-extras-800` | 1546069901-ba9599a7e63c |
| `img/fruehstueck-*` | 1494390248081-4e521a5940db |
| `img/latte-480` | 1509042239860-f550ce710b93 |
| `img/cafe-*` | 1554118811-1e0d58224f24 |
| `img/avocado-*` | 1541519227354-08fa5d50c44d |
| `img/bowls-*` | 1600335895229-6e75511892c8 |
| `img/matcha-*` | 1515823064-d6e0c04616a7 |

`img/paledo-barista.webp`: Ausschnitt aus `paledohamburg.de/images/hero-paledo.jpg`.

Schriften (SIL Open Font License 1.1, lokal eingebunden): Bodoni Moda, Jost, Pinyon Script.
