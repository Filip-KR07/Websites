# filipkramar.de

Persönliche Website von Filip Kramar. Statische One-Page ohne Build-Schritt:
`index.html` + `style.css` + `main.js`, Animationen mit GSAP/ScrollTrigger/Lenis
(lokal in `assets/vendor/`), Schriften selbst gehostet (`assets/fonts/`).

## Lokal starten

```bash
python3 -m http.server 8080
# → http://127.0.0.1:8080
```

Animationen testweise abschalten: `http://127.0.0.1:8080/?motion=off`

## Inhalte einpflegen

1. `CONTENT-CHECKLIST.md` durchgehen – dort steht jeder Platzhalter mit Fundort.
2. Fotos nach `assets/img/portrait/` und `assets/img/gallery/` legen, `assets/README.md` sagt welche Größe und welches `src` du änderst.
3. Prüfen, dass nichts übrig ist:

```bash
grep -n "PLATZHALTER" index.html impressum.html datenschutz.html sitemap.xml robots.txt
```

4. Domain: `filipkramar.de` ist in `index.html`, `sitemap.xml`, `robots.txt`, `impressum.html`, `datenschutz.html` und `assets/og/og-template.html` eingetragen. Bei anderer Domain dort ersetzen.

## Deploy (Vercel)

```bash
npx vercel --prod --yes
```

`vercel.json` setzt saubere URLs (`/impressum` statt `/impressum.html`), Cache-Header für `assets/` und Security-Header.
Alternativ funktioniert jeder statische Host (GitHub Pages, Netlify, klassisches Webhosting per FTP).

## Struktur

```
index.html            Startseite (One-Pager)
impressum.html        Impressum (Platzhalter)
datenschutz.html      Datenschutzerklärung (Platzhalter)
style.css             Design-Tokens, alle Sections, Legal-Layout
main.js               Preloader, Smooth-Scroll, Menü, Scroll-Animationen
assets/vendor/        gsap.min.js, ScrollTrigger.min.js, lenis.min.js
assets/fonts/         Cormorant Garamond + Inter (woff2)
assets/img/art/       SVG-Grafiken: Büste, Kapitell, Lorbeer, Marmor-Fragmente
assets/img/placeholders/  Platzhalter-Bilder, bis eigene Fotos da sind
assets/img/portrait/  ← eigene Portraits
assets/img/gallery/   ← eigene Galerie-Fotos
assets/og/            Vorlage für das Social-Media-Vorschaubild
restaurant/           Eigenständige Demo-Website für Restaurants (eigene README, nach dem Deploy unter /restaurant/)
```

## OG-Bild / Icons neu rendern

Das Vorschaubild (`assets/img/og-image.png`) und das App-Icon werden aus `assets/og/og-template.html` gerendert.
Nach Text-/Farbänderungen: Seite lokal starten, `assets/og/og-template.html` im Browser öffnen und die beiden Boxen als PNG (1200×630 bzw. 512×512) exportieren, oder ein Playwright-Screenshot der Elemente `#og` und `#icon`.

## Technik-Hinweise

- Ohne JavaScript oder bei aktivierter Systemeinstellung „Bewegung reduzieren“ ist die Seite komplett sichtbar und nutzbar; die Animationen sind reine Verbesserung.
- Jede Section trägt `data-nav-theme="light|dark"`; das steuert die Farbe der fixierten Navigation.
- Neue Sections bekommen Reveal-Effekte über `data-reveal`, `data-reveal="words"`, `data-reveal="lines"` oder `data-reveal="figure"`.
