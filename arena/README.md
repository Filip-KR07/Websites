# Arena: Varianten zur Restaurant-Demo

Mehrere Agenten haben unabhängig voneinander Varianten zur Demo in `../restaurant/` gebaut, danach hat je Gruppe eine
Jury alle Varianten selbst geöffnet, getestet und bewertet. **Nichts davon ist in `restaurant/` übernommen** – das hier
ist die Auswahl zum Anschauen und Entscheiden.

Übersicht mit allen Seiten: `arena/index.html`.

Anschauen: im Repo-Root `python3 -m http.server 8080` und dann z. B. `http://127.0.0.1:8080/arena/hero-durchblick/`.
Die Varianten nutzen Bilder, Schriften und Bibliotheken aus `../restaurant/assets/` mit.

## Hero-Varianten (Kopie der Demo, nur der Hero ist anders)

| Platz | Ordner | Idee | Jury |
|---|---|---|---|
| 1 | `hero-durchblick/` | Das Foto ist zuerst nur durch die riesigen Buchstaben zu sehen, dann wird es zum Hintergrund und die Schrift füllt sich hell | 84 |
| 2 | `hero-kino/` | Cinemascope-Eröffnung, Balken öffnen sich, Glut-Schimmer über der Schrift | 73 |
| 3 | `hero-tiefe/` | 3D-Kamerafahrt nach hinten, Maus-Parallaxe, Glutfunken | 71 |
| 4 | Basis (`../restaurant/`) | Foto rückt zurück, Wörter kommen scharf nach vorn | 70 |

Bekannt: `hero-kino` bricht den Wort-für-Wort-Effekt im Abschnitt „Küche“ (invalidateOnRefresh + fromTo(clipPath)),
`hero-tiefe` kostet durch die Funken dauerhaft Bildrate. Details je Ordner in `NOTIZ.md`.

## Komplette Designs (eigene Seiten, eigenes Konzept)

| Platz | Ordner | Restaurant | Jury |
|---|---|---|---|
| 1 | `design-fine-dining/` | „Aurel“ – Degustationsrestaurant, Elfenbein, Bodoni, Foto zieht sich in einen Bogen zurück, Menü-Konfigurator | 84,8 |
| 2 | `design-bistro/` | „Linie 12“ – urbanes Bistro im Plakatstil, Foto als Duotone-Hintergrund | 83,8 |
| 3 | Basis (`../restaurant/`) | „Salz & Glut“ | 79,5 |
| 4 | `design-trattoria/` | „Trattoria da Rosella“ – Terrakotta, Karo-Tischdecke, Wäscheleinen-Galerie | 78,5 |

Konzept, Anpassung und Bildquellen stehen in der `README.md` des jeweiligen Ordners.

## Von der Jury gefundene Punkte in der Basis

1. Lädt `js/main.js` nicht, bleiben die Einblende-Elemente außerhalb des Heros unsichtbar (Sicherheitsnetz deckt nur den Hero ab).
2. Niedrige Fenster (1280 × 620) und Handy quer (844 × 390): Titel stößt an die Navigation, Knöpfe liegen unter der Falz.
3. In den ersten ca. 600 ms ist der Hero schwarz.
4. Bei 320 px Breite ragen die Speisekarten-Tabs 8 px über den Rand.

Nicht getestet: Safari und echte iPhones/Android-Geräte (bei `hero-durchblick` wegen mix-blend-mode wichtig).
Alle Varianten sind auf `noindex` gestellt.
