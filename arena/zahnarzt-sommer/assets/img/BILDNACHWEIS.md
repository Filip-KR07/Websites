# Bildnachweis

Alle Fotos: StockSnap.io, Lizenz CC0 (gemeinfrei, keine Namensnennung nötig). Platzhalter für die Demo – vor einem echten Einsatz durch eigene Fotos des Betriebs ersetzen.

Jede Datei liegt in zwei Breiten vor: `name-960.webp` und `name-480.webp` (für `srcset`).

| Datei | Größe (960er) | Motiv | Quelle |
|---|---|---|---|
| `buerste` | 960x640 | Toothbrush Toothpaste | https://stocksnap.io/photo/toothbrush-toothpaste-UD9953XS1H |
| `einheit` | 960x640 | Chair Dentist | https://stocksnap.io/photo/chair-dentist-N79O15BH30 |
| `fenster` | 960x640 | Smiling Woman | https://stocksnap.io/photo/smiling-woman-8ENK7P4YSJ |
| `fuellung` | 960x636 | Dentist Orthodontist | https://stocksnap.io/photo/dentist-orthodontist-6HV52GTPO3 |
| `kind` | 960x636 | Dentist Orthodontist | https://stocksnap.io/photo/dentist-orthodontist-0XAP6ZHZ9H |
| `raum` | 960x640 | Chair Dentist | https://stocksnap.io/photo/chair-dentist-3J10QN5PTS |
| `stuhl` | 960x640 | Chair Dentist | https://stocksnap.io/photo/chair-dentist-E4SV0WQ539 |
| `untersuchung` | 960x636 | Dentist Orthodontist | https://stocksnap.io/photo/dentist-orthodontist-YXEEJ34DKF |
| `zuhause` | 960x640 | Man Smiling | https://stocksnap.io/photo/man-smiling-M56YIGPICM |

## Bildbearbeitung

Alle Fotos sind für den Serienlook als **Duoton** (Tinte #0A1C1C → Petrol → Minze → Papier #F8FBFA) eingefärbt – mit ImageMagick:

```bash
convert -size 1x60 gradient:'#0A1C1C'-'#24504D' -size 1x110 gradient:'#24504D'-'#AFD3CA' -size 1x86 gradient:'#AFD3CA'-'#F8FBFA' -append clut.png
convert original.webp -colorspace gray -auto-level -sigmoidal-contrast 3,52% clut.png -clut -quality 80 name-960.webp
```

Eigene Fotos lassen sich mit denselben zwei Befehlen angleichen.

## Eigene Grafiken

`pano-ansicht.svg` und `pano-roentgen.svg` (Panorama-Aufnahme im Hero) sind eigens für die Demo gezeichnete, schematische Grafiken – keine echten Röntgenbilder, keine Fremdquelle.
