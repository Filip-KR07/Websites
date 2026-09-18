# Assets – was wohin

Alle Bild-Slots tragen im HTML ein `data-slot`-Attribut. Datei ablegen, dann das `src` (und `width`/`height`) im HTML anpassen.
Empfohlen: WebP oder JPG, sRGB, ≤ 300 KB pro Bild. Für Retina die doppelte Anzeigebreite exportieren.

| `data-slot` | Zielordner / Dateiname | Seitenverhältnis | Empfohlene Größe | Aktuelles `src` |
|---|---|---|---|---|
| `portrait-01` | `img/portrait/portrait-01.webp` | 3:4 | 1200×1600 px | `assets/img/placeholders/portrait-01.svg` |
| `venture-01` … `venture-04` | `img/projects/projekt-01.webp` … | 4:5 | 960×1200 px | `assets/img/placeholders/venture-0X.svg` |
| `gallery-01`, `gallery-04`, `gallery-06` | `img/gallery/g01.webp` … | 4:3 | 1600×1200 px | `assets/img/placeholders/gallery-0X.svg` |
| `gallery-02`, `gallery-05` | `img/gallery/g02.webp`, `g05.webp` | 3:4 | 1200×1600 px | – |
| `gallery-03` | `img/gallery/g03.webp` | 1:1 | 1200×1200 px | – |
| `hero-art` | optional: echtes Statuen-Foto, freigestellt (PNG/WebP mit Transparenz) | ca. 3:4 | 1200×1520 px | `assets/img/art/bust-profile.svg` |

Weitere Slots (rein dekorativ, können bleiben): `art/laurel.svg`, `art/capital.svg`, `art/fragment-0X.svg`, `art/bust-halftone.svg`.

## Statuen-Fotos (yunicorn-Stil)

Wenn du statt der gezeichneten Büste echte Marmor-Statuen willst: Quellen mit freier Lizenz stehen in `img/statues/README.md`.
Freigestellte PNGs mit transparentem Hintergrund funktionieren im Hero am besten (`data-slot="hero-art"`).

## Social-Vorschaubild

`img/og-image.png` (1200×630) wird aus `og/og-template.html` gerendert. Nach Änderungen neu exportieren (siehe README im Root).
