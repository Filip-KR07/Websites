/* Erzeugt die mittel weichgezeichneten Kopien eines Hero-Bildes (Schärfentiefe-Ebene) als WebP.
   Nur zur Bauzeit nötig, nicht auf der Website.

   Aufruf (Node + Playwright mit Chromium):
     node werkzeug/mittel-kopien.js innen ../../restaurant/assets/img/hero img
   liest   <quelle>/innen-1400.webp und <quelle>/innen-hoch.webp
   schreibt <ziel>/innen-mittel.webp (1200 px breit) und <ziel>/innen-mittel-hoch.webp (720 × 1280)

   Ohne Node: dasselbe im Bildprogramm, Gaußsche Unschärfe ca. 4–5 px bei 1200 px Breite
   (Hochformat 720 px breit, ca. 5 px), als WebP mit Qualität ~75 exportieren. */
const fs = require('fs');
const path = require('path');
let pw;
try { pw = require('playwright'); } catch (_) { pw = require('/opt/node22/lib/node_modules/playwright'); }

const [name, quelle = '.', ziel = '.'] = process.argv.slice(2);
if (!name) { console.error('Bitte Bildnamen angeben, z. B.: node werkzeug/mittel-kopien.js innen <quelle> <ziel>'); process.exit(1); }

const auftraege = [
  { ein: `${name}-1400.webp`, aus: `${name}-mittel.webp`, breite: 1200, radius: 4.5 },
  { ein: `${name}-hoch.webp`, aus: `${name}-mittel-hoch.webp`, breite: 720, radius: 5 },
];

(async () => {
  const browser = await pw.chromium.launch();
  const seite = await browser.newPage();
  for (const a of auftraege) {
    const datei = path.join(quelle, a.ein);
    if (!fs.existsSync(datei)) { console.warn('fehlt:', datei); continue; }
    const src = 'data:image/webp;base64,' + fs.readFileSync(datei).toString('base64');
    const daten = await seite.evaluate(async ({ src, breite, radius }) => {
      const img = new Image(); img.src = src; await img.decode();
      const w = breite, h = Math.round(breite * img.naturalHeight / img.naturalWidth);
      const pad = Math.ceil(radius * 3);
      const t = document.createElement('canvas'); t.width = w + 2 * pad; t.height = h + 2 * pad;
      const c = t.getContext('2d'); c.imageSmoothingQuality = 'high';
      c.drawImage(img, pad, pad, w, h);
      // Ränder nach außen strecken, damit die Unschärfe am Bildrand nicht dunkel ausfranst
      c.drawImage(t, pad, pad, 1, h, 0, pad, pad, h);
      c.drawImage(t, pad + w - 1, pad, 1, h, pad + w, pad, pad, h);
      c.drawImage(t, 0, pad, w + 2 * pad, 1, 0, 0, w + 2 * pad, pad);
      c.drawImage(t, 0, pad + h - 1, w + 2 * pad, 1, 0, pad + h, w + 2 * pad, pad);
      const o = document.createElement('canvas'); o.width = w; o.height = h;
      const oc = o.getContext('2d'); oc.filter = `blur(${radius}px)`; oc.drawImage(t, -pad, -pad);
      return o.toDataURL('image/webp', 0.74);
    }, { src, breite: a.breite, radius: a.radius });
    const buf = Buffer.from(daten.split(',')[1], 'base64');
    fs.mkdirSync(ziel, { recursive: true });
    fs.writeFileSync(path.join(ziel, a.aus), buf);
    console.log('geschrieben:', path.join(ziel, a.aus), Math.round(buf.length / 1024) + ' KB');
  }
  await browser.close();
})();
