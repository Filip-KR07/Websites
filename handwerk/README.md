# Modelle fürs Handwerk

Drei fertige Demo-Websites für **fiktive** Handwerksbetriebe, dazu eine Übersichtsseite zum Zeigen.
Alle Seiten sind statisch (HTML, CSS, JS), ohne Build-Schritt, mit selbst gehosteten Schriften und
ohne externe Anfragen. Jede Demo steht für sich und lässt sich als Startpunkt für einen echten Kunden kopieren.

| Modell | Ordner | Beispielbetrieb | Passt zu |
|---|---|---|---|
| 01 „Manufaktur“ | `tischlerei-lindner/` | Lindner – Tischlerei & Innenausbau, Freiburg | Tischlerei, Schreinerei, Innenausbau, Treppenbau, Raumausstattung |
| 02 „Impuls“ | `elektro-funke/` | Funke Elektrotechnik, Leipzig | Elektro, Photovoltaik, SHK, Wärmepumpe, Smart Home |
| 03 „Kante“ | `firstwerk-dach/` | FIRSTWERK – Dach & Holzbau Brandt, Hamburg | Dachdecker, Zimmerei, Bau, Fassade, Maler, GaLaBau |

`index.html` ist die Übersicht („Showroom“) im Stil von filipkramar.de – sie nutzt dessen Schriften aus
`../assets/fonts/` und verlinkt auf `../#kontakt`.

## Lokal ansehen

```bash
python3 -m http.server 8080   # im Repo-Wurzelordner
# → http://127.0.0.1:8080/handwerk/
```

Animationen zum Testen abschalten: `?motion=off` an die Adresse einer Demo hängen.

## Wichtig vor einem echten Einsatz

- Alle Namen, Adressen, Telefonnummern, Bewertungen und Zahlen sind **erfunden**.
- Alle Seiten tragen `<meta name="robots" content="noindex">`. Für eine echte Kundenseite entfernen.
- Die Fotos sind CC0-Platzhalter von StockSnap (siehe `*/assets/img/BILDNACHWEIS.md`) und nur 960 px breit.
  Für echte Kunden **eigene Fotos** vom Betrieb, vom Team und von echten Projekten verwenden – das ist
  im Handwerk das stärkste Vertrauenssignal.
- Formulare senden nichts (kein Backend). Für den Livegang an einen Formular-Dienst oder eine
  Serverless-Funktion anbinden und dann in der Datenschutzerklärung beschreiben.
- Impressum und Datenschutz sind Muster und ersetzen keine Rechtsberatung.
- Alle Pfade sind **absolut** (`/handwerk/<ordner>/…`), weil `vercel.json` `trailingSlash: false` setzt
  und Vercel `/handwerk/x/` auf `/handwerk/x` umleitet – relative Pfade würden dann einen Ordner zu hoch
  zeigen. Zieht eine Demo auf eine eigene Domain um (Kundenseite im Wurzelverzeichnis), das Präfix
  `/handwerk/<ordner>` in den HTML-Dateien entfernen.

## Vorschaubilder der Übersicht neu erzeugen

`assets/preview/*-desktop.webp` (1200×750, aus 1440×900) und `*-mobile.webp` (600×1298, aus 390×844 bei 2-facher Pixeldichte) sind Screenshots der
jeweiligen Startseite. Nach größeren Änderungen an einer Demo neu aufnehmen (z. B. mit Playwright bei
1440×900 bzw. 390×844, oberster Bildschirm) und als WebP speichern.
