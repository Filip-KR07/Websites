/* Weingut Steinlage – Modell „Terroir“
   Ohne Build-Schritt. GSAP + ScrollTrigger + Lenis aus assets/vendor.
   Inhalte bleiben ohne JS vollständig sichtbar; JS ergänzt Bedienung und Bewegung.
   Motion-Handschrift „Hanglicht“: Linien zeichnen sich, Licht wandert, Schrift hebt sich aus dem Satz. */
(function () {
  'use strict';

  /* ================= Konstanten (hier anpassen) ================= */

  // Weinproben: Preis pro Person in Euro
  var PAKETE = {
    klassik: { name: 'Klassik', preis: 18 },
    lagen: { name: 'Lagen', preis: 32 },
    sekt: { name: 'Sekt & Snacks', preis: 29 }
  };
  var VESPER_PREIS = 9;          // Winzervesper pro Person
  var PERSONEN_MIN = 2, PERSONEN_MAX = 24;
  // Startzeiten je Wochentag (0 = Sonntag … 6 = Samstag); leere Liste = keine offenen Proben
  var SLOTS = { 0: ['12:00', '14:30'], 1: [], 2: [], 3: ['16:00', '18:30'], 4: ['16:00', '18:30'], 5: ['16:00', '18:30'], 6: ['11:00', '14:00', '17:00'] };
  // Vinothek-Öffnungszeiten [von, bis] in Stunden, Zeitzone Europe/Berlin
  var OEFFNUNG = { 0: [11, 15], 3: [14, 18], 4: [14, 18], 5: [14, 18], 6: [10, 17] };

  // Wein-Finder: süß/körper auf 0–100, passende Speisen und Anlässe, Farbe im Glas, Füllhöhe (0 = normal)
  var WEINE = [
    { id: 'guts', name: 'Riesling trocken', stil: 'trocken · Gutswein', jahr: '2024', lage: 'Deidesheimer Hänge · Sandstein', alc: '12', preis: 9.8, s: 15, k: 30, acc: 'gold', farbe: '#E6D488', fill: 0,
      essen: ['fisch', 'gemuese', 'nichts', 'wuerzig'], anlass: ['einfach', 'grill'], noten: 'Grüner Apfel, Zitronenschale, saftig.', grund: 'Unkompliziert und frisch: der Wein, der immer offen im Kühlschrank steht.' },
    { id: 'kalkmauer', name: 'Riesling Kalkmauer', stil: 'trocken · Lagenwein', jahr: '2023', lage: 'Kalkmauer · Kalkmergel', alc: '12,5', preis: 16.5, s: 10, k: 55, acc: 'gold', farbe: '#E9DA97', fill: 0,
      essen: ['fisch', 'gefluegel', 'kaese'], anlass: ['essen', 'geschenk'], noten: 'Limette, Kreide, salziger Abgang.', grund: 'Straffe Säure, die feinen Gerichten Kontur gibt, mit genug Tiefe für ein Abendessen.' },
    { id: 'sonnenwand', name: 'Riesling Sonnenwand Reserve', stil: 'trocken · Lagenwein', jahr: '2022', lage: 'Sonnenwand · Buntsandstein', alc: '13', preis: 29, s: 10, k: 82, acc: 'gold', farbe: '#DDB95E', fill: 0,
      essen: ['gefluegel', 'fisch', 'kaese'], anlass: ['geschenk', 'essen'], noten: 'Weinbergspfirsich, Rauch, Kräuter.', grund: 'Drei Jahre Reife, viel Kraft: ein Riesling, der auch Röstaromen standhält.' },
    { id: 'kabinett', name: 'Riesling Kabinett', stil: 'feinherb · Gutswein', jahr: '2024', lage: 'Mandelgrund · Lehm', alc: '10', preis: 11.5, s: 62, k: 22, acc: 'gold', farbe: '#E5CC72', fill: 0,
      essen: ['wuerzig', 'nichts', 'gemuese'], anlass: ['einfach', 'grill'], noten: 'Aprikose, Limette, leicht und saftig.', grund: 'Ein Hauch Restsüße fängt Schärfe auf und bleibt mit 10 % schön leicht.' },
    { id: 'weissburgunder', name: 'Weißburgunder Mandelgrund', stil: 'trocken · Lagenwein', jahr: '2024', lage: 'Mandelgrund · Lehm und Löss', alc: '12,5', preis: 13.9, s: 25, k: 52, acc: 'green', farbe: '#EAE0A9', fill: 0,
      essen: ['gemuese', 'gefluegel', 'fisch', 'kaese'], anlass: ['essen', 'einfach'], noten: 'Birne, Mandel, cremige Textur.', grund: 'Weich, mit wenig Säure: passt zu Gemüse, Pasta und hellem Fleisch.' },
    { id: 'rose', name: 'Spätburgunder Rosé', stil: 'trocken · Gutswein', jahr: '2024', lage: 'Lerchenberg · Kalk und Ton', alc: '11,5', preis: 9.5, s: 32, k: 24, acc: 'rose', farbe: '#E79484', fill: -6,
      essen: ['nichts', 'gemuese', 'fisch', 'wuerzig'], anlass: ['grill', 'einfach', 'feiern'], noten: 'Walderdbeere, Rhabarber, kühl getrunken.', grund: 'Leicht, rot-fruchtig und gekühlt genau richtig für den Garten.' },
    { id: 'spaetburgunder', name: 'Spätburgunder Lerchenberg', stil: 'trocken · Lagenwein', jahr: '2022', lage: 'Lerchenberg · Kalkstein über Ton', alc: '13', preis: 24, s: 5, k: 84, acc: 'wine', farbe: '#7A1530', fill: 12,
      essen: ['fleisch', 'kaese', 'gefluegel'], anlass: ['essen', 'geschenk'], noten: 'Sauerkirsche, Waldboden, feine Gerbstoffe.', grund: '18 Monate im Holzfass: genug Struktur für Rind, Wild und gereiften Käse.' },
    { id: 'sekt', name: 'Riesling-Sekt brut nature', stil: 'traditionelle Flaschengärung', jahr: '2021', lage: 'Am Steinbruch · Basalt', alc: '12', preis: 19.5, s: 4, k: 36, acc: 'gold', farbe: '#ECDFA2', fill: -14,
      essen: ['nichts', 'fisch', 'kaese'], anlass: ['feiern', 'geschenk'], noten: 'Grüner Apfel, Brioche, feine Perlage.', grund: '30 Monate auf der Hefe, ohne Dosage: zum Anstoßen und für den Aperitif.' },
    { id: 'auslese', name: 'Riesling Auslese', stil: 'edelsüß · 0,375 l', jahr: '2023', lage: 'Sonnenwand · Buntsandstein', alc: '8', preis: 22, s: 95, k: 62, acc: 'gold', farbe: '#C88F2C', fill: 30,
      essen: ['dessert', 'kaese'], anlass: ['geschenk', 'essen'], noten: 'Honig, Mango, lebendige Säure.', grund: 'Süß, aber nie klebrig: zu Obstdessert oder Blauschimmelkäse.' }
  ];
  var ACC = { gold: ['#B8935A', '#85642F'], green: ['#4F5B3A', '#4F5B3A'], wine: ['#4A1426', '#4A1426'], rose: ['#C27C7E', '#9C4A55'] };

  // Hero-Karte: die fünf Lagen in Koordinaten des Kartenausschnitts (0–1) mit amtlicher Höhe
  var LAGEN = [
    { n: 1, name: 'Am Steinbruch', h: 230, x: .1, y: .32 },
    { n: 2, name: 'Lerchenberg', h: 210, x: .3, y: .76 },
    { n: 3, name: 'Sonnenwand', h: 190, x: .5, y: .3 },
    { n: 4, name: 'Kalkmauer', h: 165, x: .7, y: .74 },
    { n: 5, name: 'Mandelgrund', h: 135, x: .9, y: .36 }
  ];
  // Handy: Lagen im Zickzack links neben dem Etikett
  var LAGEN_M = [{ x: .11, y: .19 }, { x: .33, y: .33 }, { x: .1, y: .53 }, { x: .32, y: .72 }, { x: .12, y: .91 }];
  var BREITE = 49.4; // Deidesheim, für Sonnenhöhe und Tageslänge
  var MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

  /* ================= Grundlagen ================= */
  var doc = document.documentElement;
  var motionOff = /[?&]motion=off/.test(location.search);
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var still = motionOff || reduce;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var lenis = null;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var euro = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
  var nb = function (s) { return s.replace(/ (€|%)/g, ' $1'); };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  function debounce(fn, ms) { var id; return function () { clearTimeout(id); id = setTimeout(fn, ms); }; }

  /* ================= Header, Menü, Fortschritt ================= */
  function initHeader() {
    var hdr = $('.hdr'), bar = $('.progress i'), ticking = false;
    function onScroll() {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        var y = window.scrollY, max = doc.scrollHeight - innerHeight;
        hdr.classList.toggle('is-scrolled', y > 8);
        bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0).toFixed(4) + ')';
      });
    }
    addEventListener('scroll', onScroll, { passive: true }); onScroll();

    var btn = $('.burger'), menu = $('#mnav');
    function close(focusBtn) {
      if (menu.hidden) return;
      btn.setAttribute('aria-expanded', 'false');
      menu.classList.add('is-closing');
      setTimeout(function () { menu.hidden = true; menu.classList.remove('is-closing'); }, still ? 0 : 200);
      if (focusBtn) btn.focus();
    }
    function open() {
      menu.hidden = false; menu.classList.add('is-entering');
      btn.setAttribute('aria-expanded', 'true');
      requestAnimationFrame(function () { requestAnimationFrame(function () { menu.classList.remove('is-entering'); }); });
      var first = $('a', menu); if (first) first.focus();
    }
    btn.addEventListener('click', function () { btn.getAttribute('aria-expanded') === 'true' ? close() : open(); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(true); });
    addEventListener('resize', function () { if (innerWidth >= 900) close(); });
  }

  /* ================= Hero: Lagenkarte mit wanderndem Licht ================= */
  function initHero() {
    var hero = $('.hero'), cvS = $('.hero__shade'), cvL = $('.hero__lines'), cvR = $('.hero__rows'), plotEl = $('.hero__plot'), alti = $('.hero__alti');
    if (!cvS || !cvS.getContext) return;
    var sx = cvS.getContext('2d'), lx = cvL.getContext('2d'), rx = cvR.getContext('2d');
    var W = 0, H = 0, dpr = 1, mob = false, CELL = 6, GX = 0, GY = 0, G = null, P = null, RB = null;
    var parcels = [], domes = [], corr = [], levels = [], hmin = 0, hmax = 0;
    var shadeImg = null, SW = 0, SH = 0, NX = null, NY = null;
    var visible = true, raf = 0, last = 0, lastShade = 0, t0 = performance.now(), introT = 0, introLevel = 0, introDone = false, fontsOk = false;
    var light = { a: -2.3, ta: -2.3, e: .72 }, mouse = { x: 0, y: 0, on: false, t: 0 }, altPos = { x: 0, y: 0 };

    function rnd(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
    function base(x, y) {
      var u = x / W, v = y / H, s = mob ? (u * .55 + v * .45) : (u * .9 + v * .1);
      var h = 360 - 250 * s;
      h += 17 * Math.sin(u * 6.3 + v * 2.1 + 1.1) * Math.sin(v * 4.7 - u * 1.3);
      h += 7 * Math.sin(u * 13.7 - v * 8.3 + .4) + 4 * Math.sin(u * 23 + v * 17);
      return h;
    }
    function bumps(x, y, list) {
      var h = 0;
      for (var i = 0; i < list.length; i++) {
        var b = list[i], dx = x - b.x, dy = y - b.y, d2 = dx * dx + dy * dy;
        if (d2 < b.lim) h += b.a * Math.exp(-d2 * b.k);
      }
      return h;
    }
    function hgt(x, y) { return base(x, y) + bumps(x, y, domes) + bumps(x, y, corr); }

    function layout() {
      var r = hero.getBoundingClientRect(), pr = plotEl.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
      mob = W < 900; dpr = Math.min(2, window.devicePixelRatio || 1); CELL = mob ? 6 : 7;
      P = { x: pr.left - r.left, y: pr.top - r.top, w: pr.width, h: pr.height };
      // Lagen in Pixel
      var rad = clamp(mob ? Math.min(P.w * .1, P.h * .1) : P.w * .075, 22, 64), R = rnd(7);
      domes = []; corr = []; parcels = [];
      LAGEN.forEach(function (L, li) {
        var q = mob ? LAGEN_M[li] : L, cx = P.x + q.x * P.w, cy = P.y + q.y * P.h;
        cx = clamp(cx, P.x + rad, P.x + P.w - rad); cy = clamp(cy, P.y + rad * .8, P.y + P.h - rad * .8);
        parcels.push({ L: L, x: cx, y: cy, r: rad });
        var s1 = rad * .95, s2 = rad * 2.2;
        domes.push({ x: cx, y: cy, a: 12, k: 1 / (2 * s1 * s1), lim: 9 * s1 * s1 });
        corr.push({ x: cx, y: cy, a: 0, k: 1 / (2 * s2 * s2), lim: 9 * s2 * s2 });
      });
      for (var it = 0; it < 4; it++) parcels.forEach(function (p, i) { corr[i].a += p.L.h - hgt(p.x, p.y); });
      // Parzellen: unregelmäßige Polygone, längs der Höhenlinien gestreckt, Rebzeilen in Falllinie
      parcels.forEach(function (p) {
        var e = 2, gx = (hgt(p.x + e, p.y) - hgt(p.x - e, p.y)) / (2 * e), gy = (hgt(p.x, p.y + e) - hgt(p.x, p.y - e)) / (2 * e);
        var gl = Math.hypot(gx, gy) || 1; p.gx = -gx / gl; p.gy = -gy / gl; p.px = -p.gy; p.py = p.gx;
        var poly = [];
        for (var k = 0; k < 10; k++) {
          var th = k / 10 * Math.PI * 2, rr = p.r * (.8 + R() * .32);
          var a = Math.cos(th) * rr * 1.25, b = Math.sin(th) * rr * .78;
          poly.push([p.x + p.px * a + p.gx * b, p.y + p.py * a + p.gy * b]);
        }
        p.poly = poly;
        var stocks = [], rows = [], sp = mob ? 6 : 7, st = mob ? 5 : 6, ext = p.r * 1.4;
        for (var o = -ext; o <= ext; o += sp) {
          var first = null, lastS = null;
          for (var t = -ext; t <= ext; t += st) {
            var x = p.x + p.px * o + p.gx * t, y = p.y + p.py * o + p.gy * t;
            if (inside(poly, x, y)) { var s = { x: x, y: y, b: 0, v: 0, ph: R() * 6.28 }; stocks.push(s); if (!first) first = s; lastS = s; }
          }
          if (first && lastS !== first) rows.push([first, lastS]);
        }
        p.stocks = stocks; p.rows = rows;
      });
      // Bereich der Rebzeilen-Leinwand
      var m = 26, x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      parcels.forEach(function (p) { p.poly.forEach(function (q) { x0 = Math.min(x0, q[0]); y0 = Math.min(y0, q[1]); x1 = Math.max(x1, q[0]); y1 = Math.max(y1, q[1]); }); });
      RB = { x: Math.floor(x0 - m), y: Math.floor(y0 - m), w: Math.ceil(x1 - x0 + 2 * m), h: Math.ceil(y1 - y0 + 2 * m) };
      cvR.style.transform = 'translate(' + RB.x + 'px,' + RB.y + 'px)'; cvR.style.width = RB.w + 'px'; cvR.style.height = RB.h + 'px';
      cvR.width = RB.w * dpr; cvR.height = RB.h * dpr;
      cvL.width = W * dpr; cvL.height = H * dpr;
      // Höhenraster
      GX = Math.ceil(W / CELL) + 1; GY = Math.ceil(H / CELL) + 1; G = new Float32Array(GX * GY);
      hmin = 1e9; hmax = -1e9;
      for (var j = 0; j < GY; j++) for (var i = 0; i < GX; i++) { var v = hgt(i * CELL, j * CELL); G[j * GX + i] = v; if (v < hmin) hmin = v; if (v > hmax) hmax = v; }
      levels = []; for (var lv = Math.ceil(hmin / 10) * 10; lv <= hmax; lv += 10) levels.push(lv);
      levels.reverse(); // von oben (Haardt) nach unten zeichnen
      // Licht-Raster (halbe Auflösung) mit vorberechneten Normalen
      SW = GX; SH = GY; cvS.width = SW; cvS.height = SH;
      shadeImg = sx.createImageData(SW, SH); NX = new Float32Array(SW * SH); NY = new Float32Array(SW * SH);
      var K = 2.4;
      for (var b2 = 0; b2 < SH; b2++) for (var a2 = 0; a2 < SW; a2++) {
        var gi = Math.min(GX - 3, Math.max(2, a2)), gj = Math.min(GY - 3, Math.max(2, b2));
        NX[b2 * SW + a2] = -(G[gj * GX + gi + 2] - G[gj * GX + gi - 2]) / (4 * CELL) * K;
        NY[b2 * SW + a2] = -(G[(gj + 2) * GX + gi] - G[(gj - 2) * GX + gi]) / (4 * CELL) * K;
      }
    }
    function inside(poly, x, y) {
      var c = false;
      for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        var xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
        if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) c = !c;
      }
      return c;
    }

    /* statische Ebene: Wald, Höhenlinien, Straße, Schnitt, Parzellen */
    function ctxL() { lx.setTransform(dpr, 0, 0, dpr, 0, 0); return lx; }
    function drawForest() {
      var c = ctxL(), R = rnd(3); c.fillStyle = 'rgba(79,91,58,.16)';
      for (var y = 6; y < H; y += 13) for (var x = 6; x < W; x += 13) {
        var jx = x + (R() - .5) * 8, jy = y + (R() - .5) * 8;
        if (hgt(jx, jy) > 305 + R() * 14) { c.beginPath(); c.arc(jx, jy, 1.6 + R() * 1.4, 0, 6.283); c.fill(); }
      }
    }
    function drawLevel(lv) {
      var c = ctxL(), major = lv % 50 === 0, i, j;
      c.beginPath();
      for (j = 0; j < GY - 1; j++) for (i = 0; i < GX - 1; i++) {
        var a = G[j * GX + i], b = G[j * GX + i + 1], d = G[(j + 1) * GX + i], e = G[(j + 1) * GX + i + 1];
        var cs = (a > lv ? 8 : 0) | (b > lv ? 4 : 0) | (e > lv ? 2 : 0) | (d > lv ? 1 : 0);
        if (cs === 0 || cs === 15) continue;
        var x = i * CELL, y = j * CELL, pts = [];
        if ((a > lv) !== (b > lv)) pts.push([x + CELL * (lv - a) / (b - a), y]);
        if ((b > lv) !== (e > lv)) pts.push([x + CELL, y + CELL * (lv - b) / (e - b)]);
        if ((d > lv) !== (e > lv)) pts.push([x + CELL * (lv - d) / (e - d), y + CELL]);
        if ((a > lv) !== (d > lv)) pts.push([x, y + CELL * (lv - a) / (d - a)]);
        c.moveTo(pts[0][0], pts[0][1]); c.lineTo(pts[1][0], pts[1][1]);
        if (pts.length === 4) { c.moveTo(pts[2][0], pts[2][1]); c.lineTo(pts[3][0], pts[3][1]); }
      }
      c.lineCap = 'round'; c.lineJoin = 'round';
      c.strokeStyle = major ? 'rgba(79,91,58,.5)' : 'rgba(79,91,58,.2)';
      c.lineWidth = major ? 1.15 : .75; c.stroke();
    }
    function drawLabels() {
      var c = ctxL(), ys = mob ? H * .1 : H * .17, gj = Math.round(ys / CELL);
      c.font = '600 10px "Hanken Grotesk", system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      levels.forEach(function (lv) {
        if (lv % 50) return;
        for (var i = 0; i < GX - 1; i++) {
          var a = G[gj * GX + i], d = G[gj * GX + i + 1];
          if ((a > lv) !== (d > lv)) {
            var x = i * CELL + CELL * (lv - a) / (d - a);
            if (x < 24 || x > W - 24) return;
            // keine Kollision mit den Lagen-Beschriftungen
            for (var q = 0; q < parcels.length; q++) { var pp = parcels[q], top = Math.min.apply(null, pp.poly.map(function (v) { return v[1]; })) - 13;
              if (Math.abs(ys - top) < 26 && x > pp.x - pp.r - 30 && x < pp.x + pp.r + 100) return; }
            c.fillStyle = 'rgba(239,235,227,.95)'; c.fillRect(x - 17, ys - 7, 34, 14);
            c.fillStyle = 'rgba(79,91,58,.9)'; c.fillText(lv + ' m', x, ys + .5);
            return;
          }
        }
      });
    }
    function drawRoadAndSection() {
      var c = ctxL();
      // Weinstraße am Fuß des Hangs
      var rxp = mob ? W * .94 : W * .755;
      c.beginPath();
      for (var y = -10; y <= H + 10; y += 20) { var x = rxp + Math.sin(y * .006 + 1) * 14 + Math.sin(y * .017) * 5; y < 0 ? c.moveTo(x, y) : c.lineTo(x, y); }
      c.lineWidth = 5; c.strokeStyle = 'rgba(184,147,90,.55)'; c.stroke();
      c.lineWidth = 1.6; c.strokeStyle = 'rgba(239,235,227,.9)'; c.stroke();
      // Schnitt A–B durch alle Lagen
      var ax = P.x - (mob ? 0 : 30), bx = P.x + P.w + (mob ? 0 : 30), ay = P.y + P.h * .55;
      c.setLineDash([2, 5]); c.lineWidth = 1; c.strokeStyle = 'rgba(74,20,38,.55)';
      c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, ay); c.stroke(); c.setLineDash([]);
      c.font = '700 10px "Hanken Grotesk", system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      [[ax, 'A'], [bx, 'B']].forEach(function (q) {
        c.beginPath(); c.arc(q[0], ay, 8, 0, 6.283); c.fillStyle = '#F8F5EF'; c.fill(); c.lineWidth = 1; c.strokeStyle = 'rgba(74,20,38,.8)'; c.stroke();
        c.fillStyle = '#4A1426'; c.fillText(q[1], q[0], ay + .5);
      });
    }
    function drawParcels() {
      var c = ctxL();
      parcels.forEach(function (p) {
        c.beginPath(); p.poly.forEach(function (q, i) { i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); }); c.closePath();
        c.fillStyle = 'rgba(184,147,90,.16)'; c.fill();
        c.setLineDash([4, 3]); c.lineWidth = 1.2; c.strokeStyle = 'rgba(74,20,38,.6)'; c.stroke(); c.setLineDash([]);
        // Drahtrahmen der Zeilen
        c.beginPath(); p.rows.forEach(function (r) { c.moveTo(r[0].x, r[0].y); c.lineTo(r[1].x, r[1].y); });
        c.lineWidth = .6; c.strokeStyle = 'rgba(79,91,58,.35)'; c.stroke();
      });
      c.textBaseline = 'middle';
      parcels.forEach(function (p) {
        // Nummer als Kartenzeichen über der Parzelle, Name mit Freistellung
        var top = Math.min.apply(null, p.poly.map(function (q) { return q[1]; }));
        var mx = p.x - p.r * .35, my = top - 13;
        mx = clamp(mx, 14, W - 14); my = clamp(my, 14, H - 14);
        c.beginPath(); c.arc(mx, my, 10, 0, 6.283); c.fillStyle = '#4A1426'; c.fill();
        c.font = '700 11px "Hanken Grotesk", system-ui, sans-serif'; c.textAlign = 'center'; c.fillStyle = '#EFEBE3'; c.fillText(String(p.L.n), mx, my + .5);
        c.textAlign = 'left'; c.font = '700 10px "Hanken Grotesk", system-ui, sans-serif';
        var label = p.L.name.toUpperCase(), sub = p.L.h + ' m';
        c.lineWidth = 4; c.strokeStyle = 'rgba(239,235,227,.95)'; c.lineJoin = 'round';
        c.strokeText(label, mx + 15, my - 1); c.fillStyle = '#4F5B3A'; c.fillText(label, mx + 15, my - 1);
        c.font = '600 10px "Hanken Grotesk", system-ui, sans-serif';
        c.strokeText(sub, mx + 15, my + 11); c.fillStyle = '#7A5A28'; c.fillText(sub, mx + 15, my + 11);
      });
    }
    function staticAll() {
      lx.setTransform(1, 0, 0, 1, 0, 0); lx.clearRect(0, 0, cvL.width, cvL.height);
      drawForest(); levels.forEach(drawLevel); drawRoadAndSection(); drawLabels(); drawParcels();
      introDone = true;
    }

    /* Licht: Hillshade in Niedrigauflösung, vom Browser weich hochskaliert */
    function shade() {
      var d = shadeImg.data, ca = Math.cos(light.a), sa = Math.sin(light.a), ce = Math.cos(light.e), se = Math.sin(light.e);
      var Lx = ce * ca, Ly = ce * sa, Lz = se;
      for (var i = 0, n = SW * SH; i < n; i++) {
        var nx = NX[i], ny = NY[i], inv = 1 / Math.sqrt(nx * nx + ny * ny + 1);
        var df = (nx * Lx + ny * Ly + Lz) * inv - Lz, o = i * 4;
        if (df > 0) { d[o] = 255; d[o + 1] = 250; d[o + 2] = 236; d[o + 3] = Math.min(70, df * 380); }
        else { d[o] = 74; d[o + 1] = 60; d[o + 2] = 40; d[o + 3] = Math.min(46, -df * 300); }
      }
      sx.putImageData(shadeImg, 0, 0);
    }
    /* Rebzeilen im Wind, Feder bei Mausnähe */
    function rows(now) {
      var t = (now - t0) / 1000, gust = .6 + .4 * Math.sin(t * .37) * Math.sin(t * .11 + 1);
      rx.setTransform(1, 0, 0, 1, 0, 0); rx.clearRect(0, 0, cvR.width, cvR.height);
      rx.setTransform(dpr, 0, 0, dpr, -RB.x * dpr, -RB.y * dpr);
      rx.beginPath();
      var mx = mouse.x, my = mouse.y, mon = mouse.on, R2 = 90 * 90, len = mob ? 2.2 : 2.7;
      for (var k = 0; k < parcels.length; k++) {
        var p = parcels[k], st = p.stocks;
        for (var i = 0; i < st.length; i++) {
          var s = st[i], target = 0;
          if (mon) { var dx = s.x - mx, dy = s.y - my, d2 = dx * dx + dy * dy; if (d2 < R2) target = ((dx * p.gx + dy * p.gy) > 0 ? 1 : -1) * (1 - d2 / R2) * 1.1; }
          s.v += (target - s.b) * .08; s.v *= .82; s.b += s.v;
          var a = Math.sin(t * 1.5 + s.x * .021 + s.y * .013 + s.ph * .15) * .42 * gust + s.b;
          var ux = p.px * Math.cos(a) + p.gx * Math.sin(a), uy = p.py * Math.cos(a) + p.gy * Math.sin(a);
          rx.moveTo(s.x - ux * len * .4, s.y - uy * len * .4); rx.lineTo(s.x + ux * len, s.y + uy * len);
        }
      }
      rx.lineCap = 'round'; rx.lineWidth = mob ? 1.1 : 1.3; rx.strokeStyle = 'rgba(63,74,46,.78)'; rx.stroke();
    }

    function frame(now) {
      raf = 0;
      if (!visible || document.hidden) return;
      raf = requestAnimationFrame(frame);
      // Intro: Höhenlinien zeichnen sich Ebene für Ebene vom Haardtrand hinab
      if (!introDone) {
        var due = Math.min(levels.length, Math.floor((now - introT) / 34));
        while (introLevel < due) drawLevel(levels[introLevel++]);
        if (introLevel >= levels.length && fontsOk) { drawRoadAndSection(); drawLabels(); drawParcels(); introDone = true; }
      }
      if (now - last < 1000 / 24 - 2) return;
      last = now;
      // Licht wandert langsam über den Hang; mit Maus folgt es dem Zeiger
      var t = (now - t0) / 1000;
      if (!mouse.on || now - mouse.t > 2500) light.ta = -2.3 + Math.sin(t * .28) * .95;
      var da = Math.atan2(Math.sin(light.ta - light.a), Math.cos(light.ta - light.a));
      light.a += da * .06;
      if (now - lastShade > 70) { lastShade = now; shade(); }
      rows(now);
      if (fine && mouse.on) {
        altPos.x += (mouse.x - altPos.x) * .22; altPos.y += (mouse.y - altPos.y) * .22;
        alti.style.transform = 'translate(' + (altPos.x + 14).toFixed(1) + 'px,' + (altPos.y + 16).toFixed(1) + 'px)';
      }
    }
    function start() { if (!still && !raf && visible && !document.hidden) raf = requestAnimationFrame(frame); }
    function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; }

    function build(intro) {
      layout();
      // erstes Licht/Rebzeilen im nächsten Task, damit kein langer Block entsteht
      setTimeout(function () { shade(); rows(performance.now()); }, 0);
      if (intro && !still) { lx.setTransform(1, 0, 0, 1, 0, 0); lx.clearRect(0, 0, cvL.width, cvL.height); drawForest(); introDone = false; introLevel = 0; introT = performance.now(); }
      else staticAll();
    }
    build(true);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { fontsOk = true; if (still || introDone) staticAll(); }); else fontsOk = true;
    setTimeout(function () { fontsOk = true; }, 1500);
    var lw = innerWidth, lh = hero.offsetHeight;
    var rebuild = debounce(function () {
      if (Math.abs(innerWidth - lw) < 2 && Math.abs(hero.offsetHeight - lh) < 40) return;
      lw = innerWidth; lh = hero.offsetHeight; build(false); if (still) { shade(); rows(performance.now()); }
    }, 220);
    if ('ResizeObserver' in window) new ResizeObserver(rebuild).observe(hero); else addEventListener('resize', rebuild);
    if (still) return;
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; visible ? start() : stop(); }).observe(hero);
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.on = true; mouse.t = performance.now();
      light.ta = Math.atan2(mouse.y - H * .5, mouse.x - W * .5);
      if (fine) {
        var over = e.target.closest('a, button, .label, .legend, .hero__lead p');
        if (!alti.classList.contains('is-on')) { altPos.x = mouse.x; altPos.y = mouse.y; }
        alti.classList.toggle('is-on', !over);
        alti.firstChild.textContent = Math.round(hgt(mouse.x, mouse.y));
      }
    }, { passive: true });
    hero.addEventListener('pointerleave', function () { mouse.on = false; alti.classList.remove('is-on'); });
    start();
  }

  /* ================= Etikett: leichtes Kippen mit Feder ================= */
  function initLabelTilt() {
    if (still || !fine) return;
    var lab = $('.label'), card = $('.label__card'), sh = $('.label__shadow'), hero = $('.hero');
    if (!lab) return;
    var cur = { x: 0, y: 0 }, tgt = { x: 0, y: 0 }, raf = 0;
    function tick() {
      cur.x += (tgt.x - cur.x) * .1; cur.y += (tgt.y - cur.y) * .1;
      card.style.transform = 'rotateX(' + cur.y.toFixed(2) + 'deg) rotateY(' + cur.x.toFixed(2) + 'deg)';
      sh.style.transform = 'translate(' + (8 - cur.x * 2).toFixed(1) + 'px,' + (10 + cur.y * 2).toFixed(1) + 'px)';
      raf = (Math.abs(tgt.x - cur.x) > .01 || Math.abs(tgt.y - cur.y) > .01) ? requestAnimationFrame(tick) : 0;
    }
    hero.addEventListener('pointermove', function (e) {
      var r = lab.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      tgt.x = clamp((e.clientX - cx) / innerWidth * 10, -5, 5); tgt.y = clamp(-(e.clientY - cy) / innerHeight * 8, -4, 4);
      if (!raf) raf = requestAnimationFrame(tick);
    }, { passive: true });
    hero.addEventListener('pointerleave', function () { tgt.x = 0; tgt.y = 0; if (!raf) raf = requestAnimationFrame(tick); });
  }

  /* ================= Mikro-Interaktionen ================= */
  function initMagnet() {
    if (still || !fine) return;
    $$('[data-magnet]').forEach(function (b) {
      var inner = b.firstElementChild; if (!inner) return;
      var cur = { x: 0, y: 0 }, tgt = { x: 0, y: 0 }, raf = 0;
      function tick() {
        cur.x += (tgt.x - cur.x) * .18; cur.y += (tgt.y - cur.y) * .18;
        inner.style.transform = 'translate(' + cur.x.toFixed(2) + 'px,' + cur.y.toFixed(2) + 'px)';
        raf = (Math.abs(tgt.x - cur.x) > .05 || Math.abs(tgt.y - cur.y) > .05) ? requestAnimationFrame(tick) : 0;
      }
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        tgt.x = (e.clientX - r.left - r.width / 2) * .22; tgt.y = (e.clientY - r.top - r.height / 2) * .3;
        if (!raf) raf = requestAnimationFrame(tick);
      });
      b.addEventListener('pointerleave', function () { tgt.x = 0; tgt.y = 0; if (!raf) raf = requestAnimationFrame(tick); });
    });
  }
  function initRoll() {
    $$('[data-roll]').forEach(function (a) {
      var txt = a.textContent; a.setAttribute('aria-label', txt); a.textContent = '';
      txt.split('').forEach(function (ch, i) {
        var o = document.createElement('span'), n = document.createElement('i');
        o.className = 'ch'; o.setAttribute('aria-hidden', 'true'); o.style.setProperty('--i', i);
        n.textContent = ch === ' ' ? ' ' : ch; n.setAttribute('data-c', n.textContent);
        o.appendChild(n); a.appendChild(o);
      });
    });
  }

  /* ================= Lagen-Karte ================= */
  function initLagen() {
    var tabs = $$('.lagen__tabs [role="tab"]'), map = $('.map'), world = $('.map__world'), groups = $$('.lage', map), cards = $$('.lcard');
    var mk = $('.alt__mk'), mkv = $('#alt-v'), scale = $('.alt__scale'), current = null;
    function zoomTo(id) {
      var g = groups.filter(function (x) { return x.dataset.lage === id; })[0], c = g && $('circle', g);
      if (!c || !world) return;
      var cx = +c.getAttribute('cx'), cy = +c.getAttribute('cy'), s = 1.3;
      world.style.transform = 'translate(' + ((400 - cx) * s * .55).toFixed(1) + 'px,' + ((260 - cy) * s * .55).toFixed(1) + 'px) scale(' + s + ')';
      map.classList.add('is-zoom');
    }
    function select(id, focus, zoom) {
      tabs.forEach(function (t) {
        var on = t.dataset.lage === id;
        t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1;
        if (on && focus) t.focus();
      });
      cards.forEach(function (c) {
        var on = c.dataset.lage === id;
        if (on) { c.removeAttribute('aria-hidden'); c.inert = false; } else { c.setAttribute('aria-hidden', 'true'); c.inert = true; }
        if (on) {
          var h = +c.dataset.h, y = (240 - h) / 120 * scale.offsetHeight;
          mk.style.transform = 'translateY(' + y.toFixed(1) + 'px)'; mkv.textContent = h + ' m';
        }
      });
      groups.forEach(function (g) { g.classList.toggle('is-active', g.dataset.lage === id); });
      map.dataset.active = id;
      if (zoom) zoomTo(id);
      current = id;
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t.dataset.lage, false, true); });
      t.addEventListener('keydown', function (e) {
        var k = e.key, n = null;
        if (k === 'ArrowRight' || k === 'ArrowDown') n = (i + 1) % tabs.length;
        else if (k === 'ArrowLeft' || k === 'ArrowUp') n = (i - 1 + tabs.length) % tabs.length;
        else if (k === 'Home') n = 0; else if (k === 'End') n = tabs.length - 1;
        if (n !== null) { e.preventDefault(); select(tabs[n].dataset.lage, true, true); }
      });
    });
    groups.forEach(function (g) {
      g.addEventListener('click', function () {
        if (current === g.dataset.lage && map.classList.contains('is-zoom')) { world.style.transform = ''; map.classList.remove('is-zoom'); return; }
        select(g.dataset.lage, false, true);
        var hint = $('.map__hint'); if (hint) hint.style.opacity = '0';
        if (innerWidth < 900) scrollToEl($('.lagen__panel'), -12);
      });
    });
    select('steinbruch');
    addEventListener('resize', debounce(function () { select(current, false, map.classList.contains('is-zoom')); }, 200));
  }

  /* ================= Wein-Finder mit Glas ================= */
  function initFinder() {
    var form = $('#finder-form'), lab = $('#etikett'), glass = $('#glass'), level = $('.glass__level', glass), current = null, swapT = 0;
    var rs = $('#r-suess'), rk = $('#r-koerper');
    function txt(v, a, b, c) { return v < 30 ? a : v > 66 ? c : b; }
    function paint(r) { r.style.setProperty('--p', r.value + '%'); }
    function rank() {
      var an = form.anlass.value, es = form.essen.value, s = +rs.value, k = +rk.value;
      return WEINE.map(function (w) {
        var sc = 0;
        if (w.anlass.indexOf(an) > -1) sc += 3 - w.anlass.indexOf(an) * .4;
        if (w.essen.indexOf(es) > -1) sc += 4.2 - w.essen.indexOf(es) * .5;
        sc -= Math.abs(w.s - s) / 13 + Math.abs(w.k - k) / 15;
        return { w: w, sc: sc };
      }).sort(function (a, b) { return b.sc - a.sc; });
    }
    function pourGlass(w) {
      glass.style.setProperty('--wine-c', w.farbe);
      glass.classList.toggle('is-sekt', w.id === 'sekt');
      level.style.transform = 'translateY(' + w.fill + 'px)';
      if (still) return;
      glass.classList.remove('is-pour'); void glass.getBoundingClientRect(); glass.classList.add('is-pour');
    }
    function fill(w, alt) {
      $('#e-yr').textContent = w.jahr;
      $('#e-name').textContent = w.name;
      $('#e-style').textContent = w.stil;
      $('#e-lage').textContent = w.lage;
      $('#e-alc').textContent = w.alc + ' % vol';
      $('#e-notes').textContent = w.noten;
      $('#e-reason').textContent = w.grund;
      $('#e-price').textContent = nb(euro.format(w.preis));
      $('#e-alt').textContent = alt.name + ' (' + nb(euro.format(alt.preis)) + ')';
      lab.style.setProperty('--acc', ACC[w.acc][0]);
      lab.style.setProperty('--acc-t', ACC[w.acc][1]);
    }
    function update(first) {
      paint(rs); paint(rk);
      rs.setAttribute('aria-valuetext', txt(+rs.value, 'trocken', 'halbtrocken bis feinherb', 'fruchtig-süß'));
      rk.setAttribute('aria-valuetext', txt(+rk.value, 'leicht', 'mittel', 'kräftig'));
      var r = rank(), w = r[0].w, alt = r[1].w;
      if (current === w.id) { $('#e-alt').textContent = alt.name + ' (' + nb(euro.format(alt.preis)) + ')'; return; }
      current = w.id;
      if (first === true || still) { fill(w, alt); glass.style.setProperty('--wine-c', w.farbe); level.style.transform = 'translateY(' + w.fill + 'px)'; glass.classList.toggle('is-sekt', w.id === 'sekt'); return; }
      pourGlass(w);
      clearTimeout(swapT);
      lab.classList.add('is-swap');
      lab.style.transform = 'rotate(' + (Math.random() * 3 - 1.5).toFixed(2) + 'deg)';
      swapT = setTimeout(function () { fill(w, alt); lab.classList.remove('is-swap'); }, 180);
    }
    form.addEventListener('input', update);
    form.addEventListener('change', update);
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    update(true);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { glass.classList.toggle('is-live', es[0].isIntersecting); }).observe(glass);
  }

  /* ================= Weinprobe buchen ================= */
  function initBooking() {
    var form = $('#booking'), done = $('#booking-done');
    var date = $('#b-date'), time = $('#b-time'), pers = $('#b-pers'), vesper = $('#b-vesper'), hint = $('#b-date-hint'), err = $('#b-err');
    var hintDefault = hint.textContent;
    function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
    var tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    var maxD = new Date(); maxD.setMonth(maxD.getMonth() + 9);
    date.min = iso(tomorrow); date.max = iso(maxD);
    function parse(v) { var p = v.split('-'); return p.length === 3 ? new Date(+p[0], p[1] - 1, +p[2]) : null; }
    function fmtDate(d) { return d.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'long' }); }
    function persons() { var n = parseInt(pers.value, 10); return isNaN(n) ? PERSONEN_MIN : Math.min(PERSONEN_MAX, Math.max(PERSONEN_MIN, n)); }
    function slots() {
      var d = parse(date.value), prev = time.value;
      while (time.firstChild) time.removeChild(time.firstChild);
      var list = d ? SLOTS[d.getDay()] : null;
      hint.classList.remove('is-err'); hint.textContent = hintDefault;
      if (!d) { time.add(new Option('Erst Datum wählen', '')); return; }
      if (!list.length) {
        time.add(new Option('Kein offener Termin', ''));
        hint.textContent = 'Montags und dienstags nur für Gruppen ab 10 Personen – bitte rufen Sie uns an.'; hint.classList.add('is-err');
        return;
      }
      time.add(new Option('Uhrzeit wählen', ''));
      list.forEach(function (s) { time.add(new Option(s + ' Uhr', s)); });
      if (list.indexOf(prev) > -1) time.value = prev; else if (list.length) time.value = list[0];
    }
    function summary() {
      var p = PAKETE[form.paket.value], n = persons(), d = parse(date.value);
      var sum = p.preis * n + (vesper.checked ? VESPER_PREIS * n : 0);
      $('#s-paket').textContent = p.name;
      $('#s-pers').textContent = n;
      $('#s-probe').textContent = n + ' × ' + nb(euro.format(p.preis));
      $('#s-vesper-row').hidden = !vesper.checked;
      $('#s-vesper').textContent = n + ' × ' + nb(euro.format(VESPER_PREIS));
      $('#s-termin').textContent = d && time.value ? fmtDate(d) + ', ' + time.value + ' Uhr' : d ? fmtDate(d) : 'noch offen';
      $('#s-sum').textContent = nb(euro.format(sum));
      return { paket: p.name, n: n, d: d, sum: sum };
    }
    $$('.stepper button').forEach(function (b) {
      b.addEventListener('click', function () { pers.value = Math.min(PERSONEN_MAX, Math.max(PERSONEN_MIN, persons() + (+b.dataset.step))); summary(); });
    });
    pers.addEventListener('blur', function () { pers.value = persons(); summary(); });
    date.addEventListener('change', function () { slots(); summary(); });
    form.addEventListener('input', summary);
    form.addEventListener('change', summary);
    function bad(el, on) { if (on) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid'); return on; }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = $('#b-name'), mail = $('#b-mail'), d = parse(date.value), msgs = [], first = null;
      function chk(el, cond, msg) { if (bad(el, cond)) { msgs.push(msg); first = first || el; } }
      chk(date, !d || date.value < date.min || date.value > date.max, 'Bitte ein Datum ab morgen wählen.');
      chk(time, !time.value, 'Bitte eine Uhrzeit wählen.');
      chk(name, name.value.trim().length < 2, 'Bitte Ihren Namen angeben.');
      chk(mail, !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail.value.trim()), 'Bitte eine gültige E-Mail-Adresse angeben.');
      var n = parseInt(pers.value, 10);
      chk(pers, isNaN(n) || n < PERSONEN_MIN || n > PERSONEN_MAX, 'Personen: 2 bis 24.');
      err.textContent = msgs.join(' ');
      if (first) { first.focus(); return; }
      var s = summary(), list = $('#d-list');
      while (list.firstChild) list.removeChild(list.firstChild);
      [['Paket', s.paket], ['Termin', fmtDate(s.d) + ', ' + time.value + ' Uhr'], ['Personen', String(s.n)], ['Vesper', vesper.checked ? 'ja' : 'nein'], ['E-Mail', mail.value.trim()], ['Summe (Beispiel)', nb(euro.format(s.sum))]]
        .concat($('#b-msg').value.trim() ? [['Anmerkung', $('#b-msg').value.trim()]] : [])
        .forEach(function (row) {
          var div = document.createElement('div'), dt = document.createElement('dt'), dd = document.createElement('dd');
          dt.textContent = row[0]; dd.textContent = row[1]; div.appendChild(dt); div.appendChild(dd); list.appendChild(div);
        });
      $('#d-name').textContent = name.value.trim().split(' ')[0];
      form.hidden = true; done.hidden = false;
      scrollToEl($('#probe'), 0);
      setTimeout(function () { done.focus({ preventScroll: true }); }, 60);
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    });
    $$('input, select', form).forEach(function (el) { ['input', 'change'].forEach(function (ev) { el.addEventListener(ev, function () { if (el.getAttribute('aria-invalid')) { bad(el, false); if (!$('[aria-invalid]', form)) err.textContent = ''; } }); }); });
    $('#d-back').addEventListener('click', function () {
      done.hidden = true; form.hidden = false; err.textContent = '';
      $('#b-name').focus();
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    });
    slots(); summary();
  }

  /* ================= Öffnungsstatus ================= */
  function initStatus() {
    var el = $('#status'), txt = $('#status-txt');
    try {
      var parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date());
      var get = function (t) { return (parts.filter(function (p) { return p.type === t; })[0] || {}).value; };
      var day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
      var h = +get('hour') + (+get('minute')) / 60, o = OEFFNUNG[day];
      var row = $('.hours tr[data-d="' + day + '"]'); if (row) row.classList.add('is-today');
      if (o && h >= o[0] && h < o[1]) { el.classList.add('is-open'); txt.textContent = 'Jetzt geöffnet · bis ' + o[1] + ' Uhr'; }
      else {
        var next = null;
        for (var i = 0; i < 8 && !next; i++) { var dd = (day + i) % 7, oo = OEFFNUNG[dd]; if (oo && (i > 0 || h < oo[0])) next = [i, dd, oo]; }
        var names = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
        el.classList.add('is-closed');
        txt.textContent = 'Gerade geschlossen · wieder ' + (next[0] === 0 ? 'heute' : next[0] === 1 ? 'morgen' : names[next[1]]) + ' ab ' + next[2][0] + ' Uhr';
      }
    } catch (e) { /* Grundtext bleibt */ }
  }

  /* ================= Reveal: Schrift hebt sich, Masken öffnen ================= */
  function initReveal() {
    if (still || !('IntersectionObserver' in window)) return;
    $$('[data-split]').forEach(function (h) {
      var words = h.textContent.split(' '); h.textContent = '';
      words.forEach(function (w, i) {
        var o = document.createElement('span'), n = document.createElement('span');
        o.className = 'w'; n.textContent = w; n.style.setProperty('--i', i); o.appendChild(n); h.appendChild(o);
        if (i < words.length - 1) h.appendChild(document.createTextNode(' '));
      });
    });
    $$('.hof__crate .bottles path').forEach(function (p, i) { p.style.setProperty('--i', i); });
    doc.classList.add('rv');
    // Masken (clip-path) werden über ihr Elternelement beobachtet – IO rechnet den eigenen Clip mit
    var els = $$('[data-rv], [data-split], .hof__crate'), masks = $$('[data-mask]');
    var io = new IntersectionObserver(function (es) {
      var k = 0;
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var t = e.target.__mask || e.target;
        if (t.hasAttribute('data-rv')) { t.style.transitionDelay = (k++ * 70) + 'ms'; setTimeout(function () { t.style.transitionDelay = ''; }, 1400); }
        t.classList.add('is-in'); io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .06 });
    els.forEach(function (el) { io.observe(el); });
    masks.forEach(function (m) { m.parentElement.__mask = m; io.observe(m.parentElement); });
  }
  function initNavSpy() {
    var links = $$('.nav a'), map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { links.forEach(function (a) { a.classList.remove('is-active'); }); var a = map[e.target.id]; if (a) a.classList.add('is-active'); } });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
  }

  /* ================= Scroll-Helfer ================= */
  function hdrH() { return $('.hdr').offsetHeight; }
  function scrollToEl(el, extra) {
    if (!el) return;
    var off = -(hdrH() + 12) + (extra || 0);
    if (lenis) lenis.scrollTo(el, { offset: off, duration: 1.2 });
    else window.scrollTo({ top: el.getBoundingClientRect().top + scrollY + off, behavior: still ? 'auto' : 'smooth' });
  }
  function initAnchors() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#"]'); if (!a) return;
      var id = a.getAttribute('href'); if (id.length < 2) return;
      var t = document.getElementById(id.slice(1)); if (!t) return;
      e.preventDefault();
      scrollToEl(t);
      history.replaceState(null, '', id);
      setTimeout(function () { if (!t.hasAttribute('tabindex')) t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true }); }, lenis ? 900 : 80);
    });
  }

  /* ================= Sonnenbahn: Sonnenhöhe und Tageslänge über das Jahr ================= */
  function sunAt(p) {
    var doy = p * 365, decl = -23.44 * Math.cos(2 * Math.PI * (doy + 10) / 365);
    var el = 90 - BREITE + decl;
    var phi = BREITE * Math.PI / 180, d = decl * Math.PI / 180;
    var cosH = (Math.sin(-0.833 * Math.PI / 180) - Math.sin(phi) * Math.sin(d)) / (Math.cos(phi) * Math.cos(d));
    var day = 2 * Math.acos(clamp(cosH, -1, 1)) * 180 / Math.PI / 15;
    return { el: el, day: day };
  }
  function initSun() {
    var sec = $('#jahr'), svg = $('.sun', sec), path = $('.sun__path', svg), trail = $('.sun__trail', svg), hz = $('.sun__hz', svg), ticks = $('.sun__ticks', svg), dot = $('.sun__dot', svg);
    var lay = $$('.jahr__season i', sec), moEl = $('#jahr-mo'), elEl = $('#jahr-el'), dayEl = $('#jahr-day');
    var view = $('.jahr__view', sec), w = 0, h = 0, pts = [], lastTxt = '', lastP = -1;
    var NS = 'http://www.w3.org/2000/svg';
    function xy(p) { var s = sunAt(p); return [16 + p * (w - 32), h - 30 - (s.el - 10) / 58 * (h - 50)]; }
    function measure() {
      var r = svg.getBoundingClientRect(); w = Math.max(10, r.width); h = Math.max(10, r.height);
      svg.setAttribute('viewBox', '0 0 ' + w.toFixed(0) + ' ' + h.toFixed(0));
      pts = []; var d = '';
      for (var i = 0; i <= 60; i++) { var q = xy(i / 60); pts.push(q); d += (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1); }
      path.setAttribute('d', d); trail.setAttribute('d', d); trail.setAttribute('pathLength', '1'); trail.style.strokeDasharray = '0 1';
      hz.setAttribute('x1', 0); hz.setAttribute('x2', w); hz.setAttribute('y1', h - 20); hz.setAttribute('y2', h - 20);
      while (ticks.firstChild) ticks.removeChild(ticks.firstChild);
      MONATE.forEach(function (m, i) {
        var x = 16 + (i + .5) / 12 * (w - 32), ln = document.createElementNS(NS, 'line'), tx = document.createElementNS(NS, 'text');
        ln.setAttribute('x1', x); ln.setAttribute('x2', x); ln.setAttribute('y1', h - 24); ln.setAttribute('y2', h - 16);
        tx.setAttribute('x', x); tx.setAttribute('y', h - 3); tx.textContent = w < 500 ? m.charAt(0) : m.slice(0, 3);
        ticks.appendChild(ln); ticks.appendChild(tx);
      });
      lastP = -1; set(Math.max(0, lastSet));
    }
    function tri(p, a, b, c) { return p <= a || p >= c ? 0 : p < b ? (p - a) / (b - a) : (c - p) / (c - b); }
    var lastSet = 0;
    function set(p) {
      p = clamp(p, 0, 1); lastSet = p;
      if (Math.abs(p - lastP) < .0008) return; lastP = p;
      var q = xy(p);
      dot.setAttribute('transform', 'translate(' + q[0].toFixed(1) + ' ' + q[1].toFixed(1) + ')');
      trail.style.strokeDasharray = p.toFixed(4) + ' 1';
      lay[1].style.opacity = tri(p, .1, .3, .46).toFixed(3);
      lay[2].style.opacity = tri(p, .34, .55, .74).toFixed(3);
      lay[3].style.opacity = tri(p, .6, .8, .97).toFixed(3);
      var s = sunAt(p), m = Math.min(11, Math.floor(p * 12)), hh = Math.floor(s.day), mm = Math.round((s.day - hh) * 60 / 10) * 10;
      if (mm === 60) { hh++; mm = 0; }
      var t = m + '|' + Math.round(s.el) + '|' + hh + ':' + mm;
      if (t !== lastTxt) { lastTxt = t; moEl.textContent = MONATE[m]; elEl.textContent = Math.round(s.el) + '°'; dayEl.textContent = hh + ' h ' + String(mm).padStart(2, '0'); }
    }
    measure();
    addEventListener('resize', debounce(measure, 200));
    // Handy / ohne Scrub: Fortschritt aus der Wisch-Schiene
    var tick = false;
    view.addEventListener('scroll', function () {
      if (doc.classList.contains('jahr-h') || tick) return; tick = true;
      requestAnimationFrame(function () { tick = false; var max = view.scrollWidth - view.clientWidth; set(max > 0 ? view.scrollLeft / max * 1.06 : 0); });
    }, { passive: true });
    return set;
  }

  /* ================= Jahrgangszähler (Odometer) ================= */
  function initOdo() {
    var odo = $('.odo'); if (!odo) return null;
    var reels = $$('.odo__reel', odo);
    reels.forEach(function (r) { r.textContent = '01234567890'; });
    function set(y) {
      for (var k = 0; k < 4; k++) {
        var pw = Math.pow(10, 3 - k), v = y / pw, pos;
        if (pw === 1) pos = v % 10;
        else { var lower = y % pw; pos = (Math.floor(v) % 10) + Math.max(0, lower - (pw - 1)); }
        reels[k].style.transform = 'translateY(' + (-pos / 11 * 100).toFixed(3) + '%)';
      }
    }
    set(still ? 2025 : 1898);
    return set;
  }

  /* ================= GSAP: Lenis, Strecken, Scrubs ================= */
  var setSun = null, setOdo = null, gsapOK = false, mm = null;
  function motionBase() {
    var map = $('.map');
    gsapOK = !!(window.gsap && window.ScrollTrigger);
    if (!gsapOK) { if (map) { map.style.setProperty('--draw', 0); map.classList.add('is-drawn'); } return; }
    var gsap = window.gsap, ST = window.ScrollTrigger;
    gsap.registerPlugin(ST);
    mm = gsap.matchMedia();
    if (!still && window.Lenis) {
      lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
      window.__lenis = lenis;
      doc.classList.add('has-lenis');
      lenis.on('scroll', ST.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    }
  }
  function motionMap() {
    if (!gsapOK || still) return;
    var ST = window.ScrollTrigger, map = $('.map');
    // Set Piece 1: Höhenlinien der Lagenkarte zeichnen sich mit dem Scroll
    if (map) {
      var drawn = false;
      ST.create({ trigger: map, start: 'top 88%', end: 'center 52%', scrub: .6,
        onUpdate: function (s) {
          map.style.setProperty('--draw', (1 - s.progress).toFixed(3));
          if (!drawn && s.progress > .85) { drawn = true; map.classList.add('is-drawn'); }
        } });
      setTimeout(function () { if (!drawn && map.getBoundingClientRect().top < innerHeight) { drawn = true; map.style.setProperty('--draw', 0); map.classList.add('is-drawn'); } }, 2500);
    }

  }
  function motionJahr() {
    if (!gsapOK || still) return;
    var gsap = window.gsap;
    // Set Piece 2: Ein Jahr im Weinberg als Sonnenbahn (Desktop sticky + scrub, Handy Wisch-Schiene)
    var sec = $('#jahr'), view = $('.jahr__view', sec), track = $('#jahr-track');
    mm.add('(min-width: 900px)', function () {
      doc.classList.add('jahr-h');
      var dist = 0;
      function measure() {
        dist = Math.max(0, track.scrollWidth - view.clientWidth);
        sec.style.height = (innerHeight + dist) + 'px';
      }
      measure();
      var tw = gsap.to(track, {
        x: function () { return -dist; }, ease: 'none',
        scrollTrigger: {
          trigger: sec, start: 'top top', end: function () { return '+=' + dist; }, scrub: 0.7, invalidateOnRefresh: true,
          onRefreshInit: measure,
          onUpdate: function (self) { setSun(self.progress * 1.1); }
        }
      });
      var imgs = $$('.mo figure img', track).map(function (img) {
        gsap.set(img, { scale: 1.14 });
        return gsap.fromTo(img, { xPercent: -6 }, { xPercent: 6, ease: 'none', scrollTrigger: { trigger: img.closest('.mo'), containerAnimation: tw, start: 'left right', end: 'right left', scrub: true } });
      });
      return function () {
        doc.classList.remove('jahr-h'); sec.style.height = ''; gsap.set(track, { clearProps: 'transform' });
        imgs.forEach(function (t) { t.kill(); }); $$('.mo figure img', track).forEach(function (i) { gsap.set(i, { clearProps: 'transform' }); });
      };
    });

  }
  function motionRest() {
    if (!gsapOK || still) return;
    var gsap = window.gsap;
    // Set Piece 3: das Glas füllt sich beim Hereinscrollen
    var pour = $('.glass__pour');
    if (pour) gsap.fromTo(pour, { y: 120 }, { y: 0, ease: 'none', scrollTrigger: { trigger: '.finder__out', start: 'top 85%', end: 'center 55%', scrub: .8 } });

    // Set Piece 4: Jahrgangszähler 1898 → 2025
    if (setOdo) {
      var o = { y: 1898 };
      gsap.to(o, { y: 2025, ease: 'none', onUpdate: function () { setOdo(Math.round(o.y * 100) / 100); },
        scrollTrigger: { trigger: '.familie', start: 'top 85%', end: 'center 45%', scrub: .6 } });
    }

    // Hero: Kartenblatt sinkt beim Herausscrollen langsamer als die Schrift
    mm.add('(min-width: 900px)', function () {
      gsap.to('.hero__map', { yPercent: 12, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
      gsap.to('.label', { y: -60, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
      gsap.to('.cta__yr', { xPercent: -8, ease: 'none', scrollTrigger: { trigger: '.cta', start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  }

  /* ================= Start in Etappen ================= */
  initHeader();
  initRoll();
  // Karte in eigenem Task, damit der erste Layout-Task kurz bleibt
  setTimeout(initHero, 0);
  var queue = [initLabelTilt, initMagnet, initAnchors, initLagen, initFinder, initBooking, initStatus, initReveal, initNavSpy,
    function () { setSun = initSun(); }, function () { setOdo = initOdo(); }, motionBase, motionMap, motionJahr, motionRest];
  var idle = window.requestIdleCallback || function (cb) { return setTimeout(function () { cb({ timeRemaining: function () { return 12; } }); }, 16); };
  function pump(deadline) {
    var t = performance.now();
    while (queue.length && performance.now() - t < 20) {
      try { queue.shift()(); } catch (e) { console.warn(e); }
      if (deadline && deadline.timeRemaining && deadline.timeRemaining() < 2) break;
    }
    if (queue.length) idle(pump, { timeout: 300 });
    else if (window.ScrollTrigger) window.ScrollTrigger.refresh();
  }
  setTimeout(function () { idle(pump, { timeout: 300 }); }, 60);
  addEventListener('load', function () { if (window.ScrollTrigger) window.ScrollTrigger.refresh(); });
})();
