/* Bohnenwerk Kaffeerösterei – Modell „Röstgrad“
   Aufbau: Sofort (Header, Menü, Hero: Röstprotokoll + Trommel) → Warteschlange in kleinen Häppchen (alles darunter). */
(function () {
  'use strict';

  /* ======================================================================
     Werte zum Anpassen (alle Preise in Euro, Beispielwerte)
     ====================================================================== */
  // Preise je 250-g-Tüte ohne Abo-Rabatt
  var PRICE_PER_250G = { guji: 14.90, konga: 13.90, huila: 12.90, cerrado: 10.90, espresso: 11.90, dunkel: 10.50 };
  var ABO_DISCOUNT = 0.10;          // Abo-Rabatt auf jede Tüte
  var KILO_EXTRA_DISCOUNT = 0.05;   // zusätzlicher Rabatt bei 1 kg je Lieferung
  var SHIPPING = 3.90;              // Versand je Lieferung …
  var FREE_SHIPPING_FROM = 25;      // … entfällt ab diesem Warenwert (nach Rabatt)
  var DELIVERIES_PER_MONTH = { woche: 52 / 12, zweiwochen: 26 / 12, monat: 1 };
  var RHYTHM_LABEL = { woche: 'wöchentlich', zweiwochen: 'alle 2 Wochen', monat: 'monatlich' };
  var ROAST_DAYS = [2, 5];          // Dienstag, Freitag

  var COFFEES = {
    guji:     { name: 'Guji Hambela',       origin: 'Äthiopien · Natural',          aromas: ['beeren', 'jasmin', 'steinobst', 'honig'] },
    konga:    { name: 'Yirgacheffe Konga',  origin: 'Äthiopien · Gewaschen',        aromas: ['zitrus', 'schwarztee', 'jasmin', 'honig'] },
    huila:    { name: 'Huila La Esperanza', origin: 'Kolumbien · Gewaschen',        aromas: ['beeren', 'zitrus', 'rohrzucker', 'karamell'] },
    cerrado:  { name: 'Cerrado Boa Vista',  origin: 'Brasilien · Natural',          aromas: ['haselnuss', 'schokolade', 'karamell', 'mandel'] },
    espresso: { name: 'Neustadt Espresso',  origin: 'Blend · Brasilien, Kolumbien', aromas: ['kakao', 'karamell', 'mandel', 'schokolade'] },
    dunkel:   { name: 'Elbhang Dunkel',     origin: 'Blend · Brasilien, Äthiopien', aromas: ['zartbitter', 'zimt', 'tabak', 'kakao'] }
  };
  var AROMA_LABEL = { beeren: 'Beeren', zitrus: 'Zitrus', steinobst: 'Steinobst', jasmin: 'Jasmin', schwarztee: 'Schwarztee', honig: 'Honig', rohrzucker: 'Rohrzucker', karamell: 'Karamell', mandel: 'Mandel', haselnuss: 'Haselnuss', schokolade: 'Schokolade', kakao: 'Kakao', zartbitter: 'Zartbitter', zimt: 'Zimt', tabak: 'Tabak' };

  // Röstprofile: Zeiten in Minuten, Temperaturen in °C (Bohnentemperatur)
  var PROFILES = {
    guji:     { charge: 200, tp: [1.5, 92], fc: [8 + 10 / 60, 196], drop: [9 + 25 / 60, 204], note: 'Kurz entwickelt, damit Blaubeere und Jasmin nicht unter Röstaromen verschwinden.' },
    konga:    { charge: 198, tp: [1.45, 93], fc: [8.0, 196], drop: [9 + 10 / 60, 202], note: 'Die hellste Röstung im Sortiment: knackige Säure, teeartiger Körper.' },
    huila:    { charge: 205, tp: [1.4, 95], fc: [8.5, 197], drop: [10.0, 208], note: 'Etwas mehr Entwicklung rundet die Johannisbeere mit Rohrzucker ab.' },
    cerrado:  { charge: 208, tp: [1.4, 96], fc: [8 + 50 / 60, 197], drop: [10 + 50 / 60, 214], note: 'Langsam durch die Maillard-Phase – dafür Nuss, Karamell und viel Körper.' },
    espresso: { charge: 210, tp: [1.35, 97], fc: [8 + 40 / 60, 196], drop: [11.0, 218], note: 'Für Siebträger und Milch: lange Entwicklung, wenig Säure, dichte Crema.' },
    dunkel:   { charge: 212, tp: [1.35, 98], fc: [8.5, 197], drop: [11.5, 224], note: 'Bis kurz vor den Second Crack: Zartbitter, Gewürz, kaum Säure.' }
  };
  // Hero: das Röstprotokoll von Charge 2641 (dunkle Röstung bis „Wiener“). Die Kurve im HTML ist mit
  // denselben Werten vorberechnet (x: 0–12 min, y: 60–240 °C) – bei Änderung den Pfad neu erzeugen.
  var HERO_PROFILE = PROFILES.dunkel;
  var HERO_INTRO = 0.14;            // so weit läuft die Charge beim Laden von selbst

  // Brew-Guide: Verhältnis = Wasser je Gramm Kaffee, Zeiten in Sekunden
  var METHODS = {
    v60: { grind: 'mittelfein', temp: '93 °C', total: 180, ratio: 16, rmin: 14, rmax: 18, rstep: 0.5, coffee: 15, cmin: 8, cmax: 40, unit: 'ml', waterLabel: 'Wasser', cup: 125, cupWord: ['Tasse', 'Tassen'],
      img: 'dripper', alt: 'Handfilter aus Porzellan auf einer Kanne vor einem hellen Fenster',
      steps: [[0, 'Filter ausspülen, {c} g Kaffee einfüllen, {w15} ml zum Vorbrühen aufgießen.'], [45, 'In kleinen Kreisen auf {w60} ml aufgießen.'], [75, 'Langsam bis {w} ml auffüllen.'], [105, 'Einmal sanft schwenken, durchlaufen lassen.'], [180, 'Fertig – Filter abnehmen, kurz umrühren.']] },
    fp: { grind: 'grob', temp: '95 °C', total: 300, ratio: 15, rmin: 12, rmax: 17, rstep: 0.5, coffee: 30, cmin: 10, cmax: 60, unit: 'ml', waterLabel: 'Wasser', cup: 150, cupWord: ['Tasse', 'Tassen'],
      img: 'frenchpress', alt: 'Kaffeebereiter mit Stempel neben zwei Gläsern Kaffee und Bohnen',
      steps: [[0, '{c} g Kaffee einfüllen, alle {w} ml Wasser auf einmal aufgießen.'], [30, 'Deckel auflegen, nicht umrühren.'], [240, 'Kruste mit zwei Löffeln abschöpfen.'], [270, 'Stempel langsam bis knapp über den Satz drücken.'], [300, 'Sofort ausschenken, damit nichts nachzieht.']] },
    es: { grind: 'fein', temp: '93 °C', total: 30, ratio: 2, rmin: 1.5, rmax: 3, rstep: 0.1, coffee: 18, cmin: 14, cmax: 22, unit: 'g', waterLabel: 'In der Tasse', cup: 36, cupWord: ['doppelter Espresso', 'doppelte Espressi'],
      img: 'siebtraeger', alt: 'Siebträger mit frisch gemahlenem Kaffee auf dunklem Untergrund',
      steps: [[0, '{c} g im Sieb verteilen, gerade tampern, Bezug starten.'], [6, 'Erste Tropfen – dunkel und dickflüssig.'], [20, 'Die Farbe wird heller, die Crema dichter.'], [28, 'Bei {w} g in der Tasse stoppen.'], [30, 'Probieren: sauer → feiner mahlen, bitter → gröber.']] },
    ap: { grind: 'mittelfein', temp: '85 °C', total: 120, ratio: 14, rmin: 11, rmax: 17, rstep: 0.5, coffee: 15, cmin: 11, cmax: 20, unit: 'ml', waterLabel: 'Wasser', cup: 200, cupWord: ['Becher', 'Becher'],
      img: 'aeropress', alt: 'Frisch gebrühter Kaffee wird in ein Glas gegossen, daneben Bohnen',
      steps: [[0, '{c} g Kaffee einfüllen, {w} ml Wasser aufgießen.'], [10, 'Zehnmal zügig umrühren.'], [30, 'Stempel aufsetzen, ziehen lassen.'], [90, 'Gleichmäßig in 30 Sekunden herunterdrücken.'], [120, 'Fertig – nach Geschmack mit Wasser verlängern.']] }
  };
  // Waage: Anteil der Wassermenge auf der Waage über die Zeit [Sekunde, Anteil] – daraus Gewicht, Füllstand, Tropfen
  var POUR = { v60: [[0, 0], [10, 0.16], [45, 0.16], [62, 0.6], [75, 0.6], [105, 1]], fp: [[0, 0], [22, 1]], es: [[0, 0], [6, 0.04], [28, 1]], ap: [[0, 0], [12, 1]] };

  /* ====================================================================== */
  var d = document.documentElement;
  var motionOff = d.classList.contains('motion-off');
  var reduced = d.classList.contains('reduced');
  var animate = !motionOff && !reduced;
  var fine = d.classList.contains('fine');
  var IMG = '/arena/roesterei-bohnenwerk/assets/img/';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };
  var eur = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
  var num1 = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 });
  var mmss = function (sec) { sec = Math.max(0, Math.round(sec)); var m = Math.floor(sec / 60), s = sec % 60; return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s; };
  var mss = function (sec) { sec = Math.max(0, Math.round(sec)); return Math.floor(sec / 60) + ':' + ('0' + (sec % 60)).slice(-2); };
  var NB = ' ';
  var lenis = null;

  /* ---------- Röstfarben ---------- */
  var ROAST_STOPS = [[0, [157, 181, 154]], [0.2, [201, 179, 106]], [0.38, [185, 119, 63]], [0.55, [142, 82, 40]], [0.72, [100, 56, 28]], [0.86, [70, 38, 20]], [1, [44, 25, 14]]];
  function roastRGB(t) {
    t = clamp(t, 0, 1);
    for (var i = 1; i < ROAST_STOPS.length; i++) {
      if (t <= ROAST_STOPS[i][0]) {
        var a = ROAST_STOPS[i - 1], b = ROAST_STOPS[i], k = (t - a[0]) / (b[0] - a[0]);
        return [lerp(a[1][0], b[1][0], k), lerp(a[1][1], b[1][1], k), lerp(a[1][2], b[1][2], k)];
      }
    }
    return ROAST_STOPS[ROAST_STOPS.length - 1][1];
  }
  var rgb = function (c, m) { m = m || 0; var f = function (v) { return Math.round(clamp(m > 0 ? v + (255 - v) * m : v * (1 + m), 0, 255)); }; return 'rgb(' + f(c[0]) + ',' + f(c[1]) + ',' + f(c[2]) + ')'; };

  /* ---------- Kurvenmodell (Hero und Explorer) ----------
     Bis zum Wendepunkt fällt die Fühlertemperatur, danach sinkt die Anstiegsrate (RoR) gleichmäßig:
     RoR(u) = Rampe(u) · (A·(1−u)^1,6 + B). A und B treffen First Crack und Ende exakt. Gelbpunkt = 155 °C. */
  function buildProfile(P) {
    var tp = P.tp[0], Ttp = P.tp[1], fc = P.fc[0], dr = P.drop[0], span = dr - tp, n = 1.6, dt = 1 / 120;
    var ramp = function (u) { return 1 - Math.exp(-u / 0.07); };
    var I1 = [0], I2 = [0], steps = Math.ceil(span / dt);
    for (var i = 1; i <= steps; i++) { var u = (i - 0.5) * dt / span, r = ramp(u); I1[i] = I1[i - 1] + r * Math.pow(1 - u, n) * dt; I2[i] = I2[i - 1] + r * dt; }
    var at = function (arr, t) { var x = clamp((t - tp) / dt, 0, steps), k = Math.floor(x), f = x - k; return k >= steps ? arr[steps] : arr[k] + (arr[k + 1] - arr[k]) * f; };
    var a1 = at(I1, fc), b1 = at(I2, fc), a2 = at(I1, dr), b2 = at(I2, dr), r1 = P.fc[1] - Ttp, r2 = P.drop[1] - Ttp;
    var det = a1 * b2 - a2 * b1, A = (r1 * b2 - r2 * b1) / det, B = (a1 * r2 - a2 * r1) / det;
    var f = function (t) { if (t <= tp) return Ttp + (P.charge - Ttp) * Math.pow(1 - t / tp, 2.1); return Ttp + A * at(I1, t) + B * at(I2, t); };
    var ror = function (t) { if (t <= tp) return 0; var u = (t - tp) / span; return ramp(u) * (A * Math.pow(Math.max(0, 1 - u), n) + B); };
    var dry = tp; while (dry < fc && f(dry) < 155) dry += 1 / 60;
    return { P: P, f: f, ror: ror, dry: dry };
  }

  /* ======================================================================
     1) Sofort: Header, Menü, Hero
     ====================================================================== */
  var header = $('.site-header'), meter = $('.scroll-meter span');
  var scrollHandlers = [];
  var ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var y = window.scrollY, max = d.scrollHeight - innerHeight;
      header.classList.toggle('is-scrolled', y > 16);
      meter.style.transform = 'scaleX(' + (max > 0 ? clamp(y / max, 0, 1) : 0).toFixed(4) + ')';
      for (var i = 0; i < scrollHandlers.length; i++) scrollHandlers[i](y);
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  // Menü (Handy/Tablet)
  (function () {
    var btn = $('.menu-toggle'), menu = $('#menu'), closeT;
    function focusables() { return $$('a, button', menu).concat([btn]); }
    function open() {
      clearTimeout(closeT);
      menu.hidden = false; btn.setAttribute('aria-expanded', 'true'); btn.setAttribute('aria-label', 'Menü schließen');
      d.classList.add('menu-open'); header.classList.add('is-scrolled');
      if (lenis) lenis.stop();
      requestAnimationFrame(function () { menu.classList.add('is-open'); var a = $('a', menu); if (a) a.focus(); });
    }
    function close(focusBtn) {
      menu.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-label', 'Menü öffnen');
      d.classList.remove('menu-open'); if (lenis) lenis.start();
      closeT = setTimeout(function () { menu.hidden = true; }, 240);
      if (focusBtn) btn.focus();
      onScroll();
    }
    btn.addEventListener('click', function () { btn.getAttribute('aria-expanded') === 'true' ? close(true) : open(); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) close(false); });
    document.addEventListener('keydown', function (e) {
      if (btn.getAttribute('aria-expanded') !== 'true') return;
      if (e.key === 'Escape') { e.preventDefault(); close(true); }
      if (e.key === 'Tab') {
        var f = focusables(), i = f.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      }
    });
    matchMedia('(min-width: 1181px)').addEventListener('change', function (m) { if (m.matches && btn.getAttribute('aria-expanded') === 'true') close(false); });
  })();

  /* ---------- Hero: Trommel mit Bohnen (Canvas, einfache Physik) ----------
     Bohnen fallen unter Schwerkraft, stoßen sich gegenseitig ab und werden von der drehenden Trommelwand
     mitgenommen – so entsteht das typische Kaskadieren. Scroll-Tempo beschleunigt die Trommel, First Crack
     lässt die Bohnen springen. ~30 fps, nur sichtbar und bei aktivem Tab. */
  var hero = $('.hero');
  var drum = (function () {
    var canvas = $('.drum__beans'), ctx = canvas && canvas.getContext('2d');
    if (!ctx) return { set: function () {}, crack: function () {} };
    var NS = 24, sprites = [], beans = [], S = 0, dpr = 1, R = 0, r = 0, cx = 0, cy = 0, L = 0;
    var omega = 1.9, omegaT = 1.9, phi = 0, visible = true, raf = 0, last = 0, lastY = window.scrollY, roastR = 0;

    function makeSprites() {
      sprites = [];
      var px = Math.max(8, Math.round(L * dpr));
      for (var i = 0; i < NS; i++) {
        var t = i / (NS - 1), c = roastRGB(t), cv = document.createElement('canvas');
        cv.width = cv.height = px;
        var g = cv.getContext('2d'); g.translate(px / 2, px / 2);
        var rx = px * 0.3, ry = px * 0.42;
        var grad = g.createRadialGradient(-rx * 0.35, -ry * 0.4, px * 0.04, 0, 0, ry * 1.05);
        grad.addColorStop(0, rgb(c, 0.26)); grad.addColorStop(0.55, rgb(c)); grad.addColorStop(1, rgb(c, -0.5));
        g.fillStyle = grad; g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); g.fill();
        g.strokeStyle = rgb(c, -0.64); g.lineWidth = px * 0.06; g.lineCap = 'round';
        g.beginPath(); g.moveTo(-px * 0.015, -ry * 0.86); g.bezierCurveTo(px * 0.13, -ry * 0.3, -px * 0.13, ry * 0.3, px * 0.015, ry * 0.86); g.stroke();
        if (t > 0.66) { g.fillStyle = 'rgba(255,236,210,' + ((t - 0.66) * 0.7).toFixed(3) + ')'; g.beginPath(); g.ellipse(-rx * 0.4, -ry * 0.42, rx * 0.2, ry * 0.12, -0.5, 0, Math.PI * 2); g.fill(); }
        sprites.push(cv);
      }
    }
    function seed() {
      beans = [];
      var count = S < 300 ? 64 : 104, rowH = r * 1.74, row = 0;
      while (beans.length < count && row < 60) {
        var y = cy + R - r - 1 - row * rowH, half = Math.sqrt(Math.max(0, (R - r) * (R - r) - (y - cy) * (y - cy)));
        for (var x = cx - half + (row % 2 ? r : 0); x <= cx + half && beans.length < count; x += 2 * r + 0.5) {
          var jx = x + (Math.random() - 0.5), jy = y + (Math.random() - 0.5);
          beans.push({ x: jx, y: jy, px: jx, py: jy, a: Math.random() * 6.28, o: (Math.random() - 0.5) * 0.08 });
        }
        row++;
      }
    }
    function layout() {
      var rect = canvas.getBoundingClientRect();
      if (rect.width < 10) return false;
      var nd = Math.min(2, window.devicePixelRatio || 1);
      S = rect.width; dpr = nd; canvas.width = Math.round(S * dpr); canvas.height = Math.round(S * dpr);
      cx = cy = S / 2; R = S / 2 - 1; r = Math.max(4.5, S * 0.026); L = r * 3.1;
      makeSprites(); seed();
      return true;
    }
    function physics() {
      var n = beans.length, g = 0.42 * S / 340, damp = 0.994, two = 2 * r, two2 = two * two, Rin = R - r, wall = omega * Rin / 60, i, j, b, c;
      for (i = 0; i < n; i++) { b = beans[i]; var vx = (b.x - b.px) * damp, vy = (b.y - b.py) * damp; b.px = b.x; b.py = b.y; b.x += vx; b.y += vy + g; }
      for (var it = 0; it < 2; it++) {
        beans.sort(function (p, q) { return p.x - q.x; });
        for (i = 0; i < n; i++) {
          b = beans[i];
          for (j = i + 1; j < n; j++) {
            c = beans[j]; var dx = c.x - b.x; if (dx >= two) break;
            var dy = c.y - b.y; if (dy >= two || dy <= -two) continue;
            var dd = dx * dx + dy * dy; if (dd >= two2 || dd < 1e-6) continue;
            var dist = Math.sqrt(dd), k = (two - dist) / dist * 0.5, ox = dx * k, oy = dy * k;
            b.x -= ox; b.y -= oy; c.x += ox; c.y += oy;
          }
        }
      }
      for (i = 0; i < n; i++) {
        b = beans[i]; var ex = b.x - cx, ey = b.y - cy, e2 = ex * ex + ey * ey;
        if (e2 > Rin * Rin) {
          var e = Math.sqrt(e2), nx = ex / e, ny = ey / e; b.x = cx + nx * Rin; b.y = cy + ny * Rin;
          var wx = b.x - b.px, wy = b.y - b.py, tx = -ny, ty = nx, vt = wx * tx + wy * ty, vn = wx * nx + wy * ny;
          if (vn > 0) vn *= -0.12; vt += (wall - vt) * 0.24;
          b.px = b.x - (tx * vt + nx * vn); b.py = b.y - (ty * vt + ny * vn);
        }
        b.a += ((b.x - b.px) * 0.05 + (b.y - b.py) * 0.02);
      }
    }
    function draw() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, S, S);
      // Schaufeln der Trommel
      ctx.strokeStyle = 'rgba(233,215,191,0.07)'; ctx.lineWidth = Math.max(2, S * 0.012); ctx.lineCap = 'round';
      for (var k = 0; k < 4; k++) { var a = phi + k * Math.PI / 2, ca = Math.cos(a), sa = Math.sin(a); ctx.beginPath(); ctx.moveTo(cx + ca * R * 0.98, cy + sa * R * 0.98); ctx.lineTo(cx + ca * R * 0.7, cy + sa * R * 0.7); ctx.stroke(); }
      for (var i = 0; i < beans.length; i++) {
        var b = beans[i], idx = Math.round(clamp(roastR + b.o, 0, 1) * (NS - 1)), cs = Math.cos(b.a) * dpr, sn = Math.sin(b.a) * dpr;
        ctx.setTransform(cs, sn, -sn, cs, b.x * dpr, b.y * dpr);
        ctx.drawImage(sprites[idx], -L / 2, -L / 2, L, L);
      }
    }
    function frame(now) {
      raf = 0;
      if (!visible || document.hidden) return;
      raf = requestAnimationFrame(frame);
      if (now - last < 31) return; // ~30 fps
      last = now;
      var y = window.scrollY, dy = y - lastY; lastY = y;
      omegaT = 1.9 + clamp(dy * 0.035, -1.3, 2.8);
      omega = lerp(omega, omegaT, 0.12);
      phi += omega / 30;
      physics(); physics();
      draw();
    }
    function start() { if (animate && !raf && visible && !document.hidden && S) { last = 0; raf = requestAnimationFrame(frame); } }
    if (!layout()) return { set: function () {}, crack: function () {} };
    // Bett einmal kurz „setzen“ lassen, dann zeichnen
    for (var w = 0; w < 6; w++) physics();
    draw();
    canvas.closest('.drum').classList.add('is-live');
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) start(); }).observe(canvas);
    document.addEventListener('visibilitychange', start);
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { var w0 = S; if (layout() && w0) { for (var k = 0; k < 6; k++) physics(); draw(); } }, 160); });
    start();
    return {
      set: function (rr) { roastR = rr; if (!animate) draw(); },
      crack: function (strength) {
        if (!animate) return;
        for (var i = 0; i < beans.length; i++) { var b = beans[i]; b.py = b.y + (1.5 + Math.random() * 4.5) * strength; b.px = b.x + (Math.random() - 0.5) * 3 * strength; }
      }
    };
  })();

  /* ---------- Hero: Röstprotokoll – Cursor, Live-Kurve, Röstgrad-Anzeige ---------- */
  var heroCurve = buildProfile(HERO_PROFILE);
  var roastHero = (function () {
    var P = HERO_PROFILE, logger = $('.logger'), live = $('#logger-live'), cur = $('#logger-cursor'), dot = $('.cursor__dot', cur), tag = $('#cursor-tag');
    var nameEl = $('#gauge-name'), tempEl = $('#gauge-temp'), timeEl = $('#gauge-time'), agEl = $('#gauge-agtron'), meterEl = $('#gauge-meter'), gEl = $('#gauge'), hint = $('#gauge-hint');
    var needle = $('#drum-needle'), fcMark = $('#mark-fc'), drumEl = $('#drum');
    var W = 0, H = 0, lastName = '', lastT = -1, prevT = 0, flip = null;
    function measure() { W = logger.clientWidth; H = logger.clientHeight; }
    window.addEventListener('resize', function () { measure(); lastT = -1; render(state.p); });
    measure();
    function roastIndex(t) {
      if (t < heroCurve.dry) return 0.2 * t / heroCurve.dry;
      if (t < P.fc[0]) return 0.2 + 0.3 * (t - heroCurve.dry) / (P.fc[0] - heroCurve.dry);
      return 0.5 + 0.5 * clamp((t - P.fc[0]) / (P.drop[0] - P.fc[0]), 0, 1);
    }
    function roastName(t, T) {
      if (t < heroCurve.dry) return 'Rohkaffee';
      if (t < P.fc[0] - 1.6) return 'Gelbphase';
      if (t < P.fc[0]) return 'Zimt';
      return T < 205 ? 'City' : T < 211 ? 'City+' : T < 217 ? 'Full City' : 'Wiener';
    }
    function render(p) {
      var t = p * P.drop[0];
      if (Math.abs(t - lastT) < 0.004) return;
      lastT = t;
      var T = heroCurve.f(t), x = t / 12 * W, y = (240 - clamp(T, 60, 240)) / 180 * H, ri = roastIndex(t), name = roastName(t, T), Tr = Math.round(T);
      cur.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,0)';
      dot.style.transform = 'translate3d(0,' + y.toFixed(1) + 'px,0)';
      tag.style.transform = 'translate3d(0,' + (y - 34).toFixed(1) + 'px,0)';
      var f = x > W * 0.62; if (f !== flip) { cur.classList.toggle('is-flip', f); flip = f; }
      live.style.clipPath = 'inset(0 ' + (100 - t / 12 * 100).toFixed(2) + '% 0 0)';
      tag.textContent = mmss(t * 60) + ' · ' + Tr + NB + '°C';
      if (name !== lastName) { nameEl.textContent = name; lastName = name; }
      tempEl.textContent = Tr; timeEl.textContent = mmss(t * 60); agEl.textContent = Math.round(95 - ri * 60);
      needle.style.transform = 'rotate(' + (-110 + 220 * ri).toFixed(1) + 'deg)';
      gEl.style.setProperty('--bean', rgb(roastRGB(ri)));
      meterEl.setAttribute('aria-valuenow', Math.round(ri * 100));
      meterEl.setAttribute('aria-valuetext', name + ', ' + Tr + ' °C');
      drum.set(ri);
      // First Crack / Second Crack beim Überschreiten nach vorn
      if (prevT < P.fc[0] && t >= P.fc[0]) { fcMark.classList.add('is-cracked'); drum.crack(1); if (animate) { drumEl.classList.remove('is-crack'); void drumEl.offsetWidth; drumEl.classList.add('is-crack'); } }
      else if (t < P.fc[0] - 0.3) fcMark.classList.remove('is-cracked');
      if (prevT < 11 && t >= 11) drum.crack(0.55);
      prevT = t;
      if (hint && p > HERO_INTRO + 0.03) { hint.textContent = 'Röstung läuft – weiter bis „Wiener“.'; hint = null; }
    }
    var state = { p: 0 };
    return { render: render, state: state };
  })();

  function heroProgress(y) {
    var hh = hero.offsetHeight, tall = d.classList.contains('anim') && innerWidth >= 900;
    var span = tall ? hh - innerHeight : hh * 0.85;
    return clamp(y / Math.max(1, span), 0, 1);
  }
  var intro = animate ? 0 : 1, introStart = 0;
  function heroTarget(y) { return HERO_INTRO + (1 - HERO_INTRO) * heroProgress(y); }
  function updateRoast(y) {
    if (y > hero.offsetHeight + 200 && roastHero.state.p >= 1) return;
    var target = heroTarget(y);
    roastHero.state.p = intro < 1 ? target * easeOut(intro) : target;
    roastHero.render(roastHero.state.p);
  }
  scrollHandlers.push(updateRoast);
  if (animate) {
    // Lade-Intro: die Charge läuft von selbst an (1,4 s), danach übernimmt der Scroll
    requestAnimationFrame(function introStep(now) {
      if (!introStart) introStart = now;
      intro = clamp((now - introStart - 250) / 1400, 0, 1);
      updateRoast(window.scrollY);
      if (intro < 1) requestAnimationFrame(introStep);
    });
  }
  updateRoast(window.scrollY);
  onScroll();

  /* ======================================================================
     2) Warteschlange: alles unterhalb des ersten Bildschirms
     ====================================================================== */
  var queue = [];
  var later = function (fn) { queue.push(fn); };
  function runQueue() {
    var fn = queue.shift();
    if (!fn) { finish(); return; }
    try { fn(); } catch (e) { if (window.console) console.warn('[bohnenwerk]', e); }
    var next = function () { runQueue(); };
    if ('requestIdleCallback' in window) requestIdleCallback(next, { timeout: 120 }); else setTimeout(next, 16);
  }
  function finish() {
    if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    onScroll();
  }

  /* ---------- Reveals ---------- */
  later(function () {
    var items = $$('[data-reveal], [data-reveal-group]');
    if (motionOff || !('IntersectionObserver' in window)) { items.forEach(function (el) { el.classList.add('is-in'); }); window.__bwReady = true; return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target; io.unobserve(el);
        if (el.hasAttribute('data-reveal-group')) {
          var kids = Array.prototype.slice.call(el.children);
          kids.forEach(function (k, i) { k.style.transitionDelay = (i * 60) + 'ms'; });
          setTimeout(function () { kids.forEach(function (k) { k.style.transitionDelay = ''; }); }, 1400);
        }
        el.classList.add('is-in');
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
    window.__bwReady = true;
  });

  /* ---------- Kapitel-Farbwechsel: Logger-Papier füllt die Seite ---------- */
  later(function () {
    if (!d.classList.contains('anim')) return;
    var sec = $('.chapter-paper');
    new IntersectionObserver(function (es) { es.forEach(function (e) { sec.classList.toggle('is-paper', e.isIntersecting); }); }, { rootMargin: '-38% 0px -38% 0px' }).observe(sec);
  });

  /* ---------- Sackstempel-Band: Tempo und Richtung folgen dem Scroll ---------- */
  later(function () {
    if (!animate) return;
    var track = $('#stampband'), band = track.parentNode, x = 0, boost = 0, dir = -1, raf = 0, visible = false, last = 0, lastY = window.scrollY, half = 0;
    var measure = function () { half = track.scrollWidth / 2; };
    measure(); window.addEventListener('resize', measure);
    scrollHandlers.push(function (y) { var dy = y - lastY; lastY = y; if (!dy) return; dir = dy > 0 ? -1 : 1; boost = Math.min(1400, boost + Math.abs(dy) * 7); if (visible && !raf) raf = requestAnimationFrame(loop); });
    function loop(now) {
      raf = 0; if (!visible || document.hidden) return;
      var dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016; last = now;
      x += dir * (46 + boost) * dt; boost *= Math.pow(0.04, dt);
      if (x <= -half) x += half; else if (x > 0) x -= half;
      track.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,0) skewX(' + (dir * -Math.min(7, boost / 120)).toFixed(2) + 'deg)';
      raf = requestAnimationFrame(loop);
    }
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; last = 0; if (visible && !raf) raf = requestAnimationFrame(loop); }).observe(band);
    document.addEventListener('visibilitychange', function () { last = 0; if (visible && !raf) raf = requestAnimationFrame(loop); });
  });

  /* ---------- Mikro-Interaktionen: Zeichen-Rollen, magnetische Stempel-Buttons ---------- */
  later(function () {
    if (!fine || !animate) return;
    $$('.nav__list a').forEach(function (a) {
      var txt = a.textContent, roll = document.createElement('span'), sr = document.createElement('span');
      roll.className = 'roll'; roll.setAttribute('aria-hidden', 'true');
      txt.split('').forEach(function (ch, i) { var s = document.createElement('span'); s.textContent = ch; s.style.setProperty('--c', i); roll.appendChild(s); });
      sr.className = 'visually-hidden'; sr.textContent = txt;
      a.textContent = ''; a.appendChild(roll); a.appendChild(sr);
    });
    $$('.btn--stamp').forEach(function (b) {
      var tx = 0, ty = 0, x = 0, y = 0, raf = 0;
      function loop() { x = lerp(x, tx, 0.2); y = lerp(y, ty, 0.2); b.style.translate = x.toFixed(2) + 'px ' + y.toFixed(2) + 'px'; if (Math.abs(x - tx) > 0.05 || Math.abs(y - ty) > 0.05) raf = requestAnimationFrame(loop); else raf = 0; }
      b.addEventListener('pointermove', function (e) { var r = b.getBoundingClientRect(); tx = clamp((e.clientX - r.left - r.width / 2) * 0.16, -6, 6); ty = clamp((e.clientY - r.top - r.height / 2) * 0.22, -4, 4); if (!raf) raf = requestAnimationFrame(loop); });
      b.addEventListener('pointerleave', function () { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(loop); });
    });
  });

  /* ---------- Sackregal: Vorschau-Sack folgt dem Zeiger mit Feder ---------- */
  later(function () {
    if (!fine || !matchMedia('(min-width: 900px)').matches) return;
    var shelf = $('.shelf'), peek = $('.sackpeek'), bag = $('.sackpeek__bag'), list = $('.sacks');
    var no = $('#peek-no'), nm = $('#peek-name'), og = $('#peek-origin');
    var tx = 0, ty = 0, x = 0, y = 0, vx = 0, raf = 0, curId = '', W = 210, Hh = 260;
    function loop() {
      var nx = animate ? lerp(x, tx, 0.18) : tx, ny = animate ? lerp(y, ty, 0.18) : ty; vx = nx - x; x = nx; y = ny;
      peek.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) rotate(' + clamp(vx * 0.6, -9, 9).toFixed(2) + 'deg)';
      raf = (Math.abs(tx - x) > 0.3 || Math.abs(ty - y) > 0.3 || Math.abs(vx) > 0.05) ? requestAnimationFrame(loop) : 0;
    }
    list.addEventListener('pointermove', function (e) {
      var r = shelf.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top;
      tx = px > r.width - W - 60 ? px - W - 36 : px + 36; ty = clamp(py - Hh / 2, -40, r.height - Hh + 40);
      if (!shelf.classList.contains('is-peeking')) { x = tx; y = ty; }
      if (!raf) raf = requestAnimationFrame(loop);
    });
    list.addEventListener('pointerover', function (e) {
      var li = e.target.closest('.sack'); if (!li) return;
      var id = li.getAttribute('data-coffee'); shelf.classList.add('is-peeking');
      if (id === curId) return; curId = id;
      no.textContent = 'Nr. ' + $('.sack__no', li).textContent; nm.textContent = COFFEES[id].name; og.textContent = COFFEES[id].origin;
      peek.style.setProperty('--roast', li.style.getPropertyValue('--roast'));
      if (animate && bag.animate) bag.animate([{ transform: 'scale(1.06) rotate(-1deg)', opacity: 0.55 }, { transform: 'none', opacity: 1 }], { duration: 200, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' });
    });
    list.addEventListener('pointerleave', function () { shelf.classList.remove('is-peeking'); curId = ''; });
  });

  /* ---------- Lenis + GSAP (erst jetzt geladen, jede Datei in eigener Aufgabe) ---------- */
  var VENDOR = '/arena/roesterei-bohnenwerk/assets/vendor/';
  function loadScript(src) { return new Promise(function (res) { var s = document.createElement('script'); s.src = VENDOR + src; s.onload = s.onerror = function () { res(); }; document.head.appendChild(s); }); }
  later(function () {
    loadScript('gsap.min.js').then(function () { return loadScript('ScrollTrigger.min.js'); }).then(function () { return animate ? loadScript('lenis.min.js') : null; })
      .then(function () { try { motionSetup(); } catch (e) { if (window.console) console.warn('[bohnenwerk]', e); } if (window.ScrollTrigger) ScrollTrigger.refresh(); });
  });
  function motionSetup() {
    var hasGsap = window.gsap && window.ScrollTrigger;
    if (hasGsap) gsap.registerPlugin(ScrollTrigger);
    if (animate && window.Lenis) {
      lenis = new Lenis({ lerp: 0.11, smoothWheel: true });
      window.__lenis = lenis;
      if (hasGsap) {
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
        gsap.ticker.lagSmoothing(0);
      } else {
        var loop = function (t) { lenis.raf(t); requestAnimationFrame(loop); }; requestAnimationFrame(loop);
      }
    }
    // Anker mit Versatz für den Header, Fokus ans Ziel
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#"]'); if (!a) return;
      var id = a.getAttribute('href'); if (id.length < 2) return;
      var target = document.getElementById(id.slice(1)); if (!target) return;
      e.preventDefault();
      var off = -(header.offsetHeight + 8);
      // Nachkorrektur: Abschnitte mit content-visibility bekommen ihre echte Höhe erst beim Rendern
      if (lenis) lenis.scrollTo(target, { offset: off, duration: 1.1, onComplete: function () { if (Math.abs(target.getBoundingClientRect().top + off) > 4) lenis.scrollTo(target, { offset: off, duration: 0.5 }); } });
      else {
        var smooth = !motionOff;
        target.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
        [150, 1000].forEach(function (ms) { setTimeout(function () { if (Math.abs(target.getBoundingClientRect().top + off) > 4 && (!smooth || ms > 150)) target.scrollIntoView({ behavior: 'auto', block: 'start' }); }, ms); });
      }
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
      if (history.replaceState) history.replaceState(null, '', id);
    });
    if (!hasGsap || !animate) return;

    var mm = gsap.matchMedia();
    // Horizontale Strecke: Sticky-Bühne per CSS, Bewegung per Scrub; Bilder und Ziffern laufen mit eigener Tiefe
    mm.add('(min-width: 900px)', function () {
      var sec = $('.journey'), track = $('.journey__track'), bar = $('.journey__progress span'), countEl = $('#journey-no');
      var stations = $$('.station', track).map(function (s) { return { el: s, img: $('img', s), big: $('.station__big', s), left: 0, w: 0 }; });
      sec.classList.add('is-h');
      var dist = function () { return Math.max(0, track.scrollWidth - innerWidth); };
      var cache = function () { stations.forEach(function (s) { s.left = s.el.offsetLeft; s.w = s.el.offsetWidth; }); };
      var setH = function () { sec.style.height = (innerHeight + dist()) + 'px'; cache(); };
      setH();
      ScrollTrigger.addEventListener('refreshInit', setH);
      var lastNo = '';
      var depth = function () {
        var tx = gsap.getProperty(track, 'x') || 0, vw = innerWidth, best = 0, bd = 1e9;
        stations.forEach(function (s, i) {
          var c = s.left + tx + s.w / 2, n = clamp((c - vw / 2) / vw, -1.2, 1.2);
          s.img.style.transform = 'translate3d(' + (n * -7).toFixed(2) + '%,0,0)';
          s.big.style.transform = 'translate3d(' + (n * 90).toFixed(1) + 'px,0,0)';
          var dd = Math.abs(c - vw * 0.42); if (dd < bd) { bd = dd; best = i; }
        });
        var no = '0' + (best + 1); if (no !== lastNo) { countEl.textContent = no; lastNo = no; }
      };
      var tw = gsap.to(track, { x: function () { return -dist(); }, ease: 'none',
        scrollTrigger: { trigger: sec, start: 'top top', end: function () { return '+=' + dist(); }, scrub: 0.6, invalidateOnRefresh: true,
          onUpdate: function (st) { bar.style.transform = 'scaleX(' + st.progress.toFixed(4) + ')'; } },
        onUpdate: depth });
      depth();
      return function () { ScrollTrigger.removeEventListener('refreshInit', setH); tw.scrollTrigger && tw.scrollTrigger.kill(); tw.kill(); sec.classList.remove('is-h'); sec.style.height = ''; gsap.set(track, { clearProps: 'transform' }); stations.forEach(function (s) { s.img.style.transform = ''; s.big.style.transform = ''; }); };
    });
    // Stadtplan: der Fußweg von der Tram zeichnet sich mit dem Scroll
    var route = $('#map-route');
    if (route) {
      route.style.strokeDashoffset = '1';
      gsap.to(route, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: '.map', start: 'top 80%', end: 'center 45%', scrub: 0.5 } });
    }
    // Stempel dreht sich mit, Collage leicht versetzt
    gsap.to('.cafe__stamp', { rotate: 160, ease: 'none', scrollTrigger: { trigger: '.cafe', start: 'top bottom', end: 'bottom top', scrub: 0.5 } });
    mm.add('(min-width: 900px)', function () {
      gsap.fromTo('.cafe__b', { yPercent: 7 }, { yPercent: -7, ease: 'none', scrollTrigger: { trigger: '.cafe', start: 'top bottom', end: 'bottom top', scrub: 0.5 } });
      gsap.fromTo('.cafe__c', { yPercent: -4 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: '.cafe', start: 'top bottom', end: 'bottom top', scrub: 0.5 } });
    });
  }

  /* ---------- Tabs (Pfeiltasten, automatische Aktivierung) ---------- */
  function tabs(list, onSelect) {
    var t = $$('[role="tab"]', list);
    function select(tab, focus) {
      t.forEach(function (x) { var on = x === tab; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1; });
      if (focus) tab.focus();
      var panel = document.getElementById(tab.getAttribute('aria-controls')); if (panel) panel.setAttribute('aria-labelledby', tab.id);
      onSelect(tab);
    }
    list.addEventListener('click', function (e) { var b = e.target.closest('[role="tab"]'); if (b) select(b, false); });
    list.addEventListener('keydown', function (e) {
      var i = t.indexOf(document.activeElement); if (i < 0) return;
      var n = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: t.length - 1 }[e.key];
      if (n === undefined) return; e.preventDefault(); select(t[(n + t.length) % t.length], true);
    });
    return { select: function (key, attr) { var b = t.filter(function (x) { return x.getAttribute(attr) === key; })[0]; if (b) select(b, false); } };
  }

  /* ---------- Röstprofil-Explorer ---------- */
  var explorer;
  later(function () {
    var svg = $('#chart-svg'), chart = $('#chart'), NS = 'http://www.w3.org/2000/svg';
    var XMAX = 12, YMIN = 60, YMAX = 240, RMAX = 30;
    var cur = 'guji', curve = null, W = 0, H = 0, M = { l: 40, r: 40, t: 22, b: 28 }, tSec = 0, drawn = false;
    var ro = { time: $('#ro-time'), temp: $('#ro-temp'), ror: $('#ro-ror'), phase: $('#ro-phase') };
    var el = function (n, a, parent) { var e = document.createElementNS(NS, n); for (var k in a) e.setAttribute(k, a[k]); if (parent) parent.appendChild(e); return e; };
    var X = function (t) { return M.l + t / XMAX * (W - M.l - M.r); };
    var Y = function (v) { return M.t + (1 - (clamp(v, YMIN, YMAX) - YMIN) / (YMAX - YMIN)) * (H - M.t - M.b); };
    var YR = function (v) { return M.t + (1 - v / RMAX) * (H - M.t - M.b); };
    var cursorG, cLine, cDot, btPath;

    function render(animateIn) {
      var r = svg.getBoundingClientRect(); W = Math.max(280, r.width); H = Math.max(220, r.height);
      M.l = W < 500 ? 34 : 40; M.r = W < 500 ? 30 : 40;
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.setAttribute('preserveAspectRatio', 'none');
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var P = curve.P, f = curve.f;
      // Phasen (Farben für Logger-Papier)
      var bands = [[0, curve.dry, 'rgba(79,106,76,0.13)', 'Trocknung'], [curve.dry, P.fc[0], 'rgba(184,140,40,0.13)', 'Maillard'], [P.fc[0], P.drop[0], 'rgba(194,106,46,0.2)', W < 500 ? 'Entw.' : 'Entwicklung']];
      bands.forEach(function (b) {
        el('rect', { x: X(b[0]), y: M.t, width: X(b[1]) - X(b[0]), height: H - M.t - M.b, fill: b[2], class: 'c-band' }, svg);
        if (X(b[1]) - X(b[0]) > b[3].length * 6.9 + 12) { var tx = el('text', { x: X(b[0]) + 6, y: M.t + 14, class: 'c-bandlabel' }, svg); tx.textContent = b[3].toUpperCase(); }
      });
      // Raster + Achsen
      var g = el('g', { class: 'c-grid' }, svg), ax = el('g', { class: 'c-axis' }, svg);
      for (var v = 90; v <= 240; v += 30) { el('line', { x1: M.l, x2: W - M.r, y1: Y(v), y2: Y(v) }, g); var t1 = el('text', { x: M.l - 6, y: Y(v) + 4, 'text-anchor': 'end' }, ax); t1.textContent = v + '°'; }
      for (var rr = 10; rr <= 30; rr += 10) { var t3 = el('text', { x: W - M.r + 6, y: YR(rr) + 4 }, ax); t3.textContent = rr; }
      var step = W < 500 ? 4 : 2;
      for (var m = 0; m <= XMAX; m += step) { var t2 = el('text', { x: X(m), y: H - 8, 'text-anchor': m === 0 ? 'start' : m === XMAX ? 'end' : 'middle' }, ax); t2.textContent = m + (m === XMAX ? ' min' : ''); }
      // RoR
      var dr = '';
      for (var t = P.tp[0] + 0.15; t <= P.drop[0]; t += 1 / 30) dr += (dr ? 'L' : 'M') + X(t).toFixed(1) + ' ' + YR(clamp(curve.ror(t), 0, RMAX)).toFixed(1);
      var rorPath = el('path', { d: dr, class: 'c-ror' }, svg);
      // Bohnentemperatur
      var d1 = '';
      for (t = 0; t <= P.drop[0] + 0.001; t += 1 / 30) d1 += (d1 ? 'L' : 'M') + X(t).toFixed(1) + ' ' + Y(f(t)).toFixed(1);
      d1 += 'L' + X(P.drop[0]).toFixed(1) + ' ' + Y(P.drop[1]).toFixed(1);
      btPath = el('path', { d: d1, class: 'c-bt', pathLength: 1 }, svg);
      function mark(cls, t, v, label, anchor, vertical) {
        var mg = el('g', { class: 'c-mark ' + cls }, svg);
        if (vertical) el('line', { x1: X(t), x2: X(t), y1: M.t, y2: H - M.b }, mg);
        el('circle', { cx: X(t), cy: Y(v), r: 4.5 }, mg);
        var above = vertical || (cls === 'c-mark--end' && X(P.drop[0]) - X(P.fc[0]) < 70);
        var tx = el('text', { x: X(t) + (anchor === 'end' ? -10 : 10), y: Y(v) + (above ? -12 : 18), 'text-anchor': anchor || 'start' }, mg); tx.textContent = label;
      }
      mark('', P.tp[0], P.tp[1], 'Wendepunkt', 'start');
      mark('c-mark--fc', P.fc[0], P.fc[1], 'First Crack', 'end', true);
      mark('c-mark--end', P.drop[0], P.drop[1], 'Ende', X(P.drop[0]) - X(P.fc[0]) < 70 ? 'start' : 'end');
      cursorG = el('g', { class: 'c-cursor' }, svg);
      cLine = el('line', { y1: M.t, y2: H - M.b }, cursorG);
      cDot = el('circle', { r: 6 }, cursorG);
      setCursor(tSec);
      if (animateIn && animate && btPath.animate) {
        // Der Schreiber zeichnet die neue Charge – langsam wie die Glut, Raster bleibt stehen
        btPath.style.strokeDasharray = '1';
        btPath.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 900, easing: 'cubic-bezier(0.77, 0, 0.175, 1)', fill: 'backwards' });
        rorPath.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400, delay: 450, easing: 'ease', fill: 'backwards' });
        cursorG.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 250, delay: 600, easing: 'ease', fill: 'backwards' });
      }
      drawn = true;
    }
    function phaseAt(t, P) { return t < curve.dry ? ['Trocknung', '#3e4d3c'] : t < P.fc[0] ? ['Maillard', '#5a4a26'] : ['Entwicklung', '#7a3f19']; }
    function setCursor(sec) {
      var P = curve.P; tSec = clamp(sec, 0, Math.round(P.drop[0] * 60));
      var t = tSec / 60, v = curve.f(Math.min(t, P.drop[0])), r = curve.ror(t), ph = phaseAt(t, P);
      if (cLine) { cLine.setAttribute('x1', X(t)); cLine.setAttribute('x2', X(t)); cDot.setAttribute('cx', X(t)); cDot.setAttribute('cy', Y(v)); }
      ro.time.textContent = mmss(tSec) + ' min';
      ro.temp.textContent = Math.round(v) + NB + '°C';
      ro.ror.textContent = t < P.tp[0] ? 'Temperatur fällt' : 'RoR ' + num1.format(Math.max(0, r)) + NB + '°C/min';
      ro.phase.textContent = ph[0]; ro.phase.style.setProperty('--phase', ph[1]);
      chart.setAttribute('aria-valuenow', tSec);
      chart.setAttribute('aria-valuemax', Math.round(P.drop[0] * 60));
      chart.setAttribute('aria-valuetext', mmss(tSec) + ' Minuten, ' + Math.round(v) + ' Grad, ' + ph[0]);
    }
    function facts(id) {
      var P = PROFILES[id], C = COFFEES[id], box = $('.explorer__facts');
      var devS = Math.round((P.drop[0] - P.fc[0]) * 60), dtr = Math.round(devS / (P.drop[0] * 60) * 100);
      var apply = function () {
        $('#pf-name').textContent = C.name; $('#pf-origin').textContent = C.origin; $('#pf-note').textContent = P.note;
        $('#pf-charge').textContent = P.charge + NB + '°C';
        $('#pf-tp').textContent = mmss(P.tp[0] * 60) + ' · ' + P.tp[1] + NB + '°C';
        $('#pf-fc').textContent = mmss(P.fc[0] * 60) + ' · ' + P.fc[1] + NB + '°C';
        $('#pf-dev').textContent = mmss(devS) + ' · ' + dtr + NB + '%';
        $('#pf-drop').textContent = mmss(P.drop[0] * 60) + ' · ' + P.drop[1] + NB + '°C';
        $('#pf-abo').setAttribute('data-pick-abo', id);
        box.classList.remove('is-swapping');
      };
      if (animate && drawn) { box.classList.add('is-swapping'); setTimeout(apply, 160); } else apply();
    }
    function select(id) { cur = id; curve = buildProfile(PROFILES[id]); tSec = Math.round(PROFILES[id].fc[0] * 60); facts(id); render(true); }

    var tb = tabs($('.explorer__tabs'), function (tab) { select(tab.getAttribute('data-coffee')); });
    curve = buildProfile(PROFILES[cur]); tSec = Math.round(PROFILES[cur].fc[0] * 60); facts(cur); render(false);

    function fromPointer(e) { var r = svg.getBoundingClientRect(); var x = (e.clientX - r.left) / r.width * W; setCursor(((x - M.l) / (W - M.l - M.r)) * XMAX * 60); }
    chart.addEventListener('pointermove', fromPointer);
    chart.addEventListener('pointerdown', fromPointer);
    chart.addEventListener('keydown', function (e) {
      var big = e.shiftKey ? 60 : 10, P = curve.P, n;
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') n = tSec + big;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') n = tSec - big;
      else if (e.key === 'PageUp') n = tSec + 60; else if (e.key === 'PageDown') n = tSec - 60;
      else if (e.key === 'Home') n = 0; else if (e.key === 'End') n = P.drop[0] * 60;
      if (n === undefined) return; e.preventDefault(); setCursor(n);
    });
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { render(false); }, 150); });
    explorer = { pick: function (id) { tb.select(id, 'data-coffee'); } };
    document.addEventListener('click', function (e) { var a = e.target.closest('[data-pick-profile]'); if (a) explorer.pick(a.getAttribute('data-pick-profile')); });
  });

  /* ---------- Geschmacksrad: wählen, greifen, drehen – mit Feder ---------- */
  later(function () {
    var items = $$('.fw-aroma'), sel = {}, count = $('#wheel-count'), out = $('#matches');
    if (!items.length) return;
    var svg = $('#wheel-svg'), rotG = $('#wheel-rot'), wheelEl = $('.wheel');
    var centers = items.map(function (g) { var t = $('text', g); return Math.atan2(+t.getAttribute('y'), +t.getAttribute('x')) * 180 / Math.PI; });
    var ang = 0, vel = 0, target = 0, raf = 0, lastT = 0, dragging = false, suppress = false;
    function apply() { rotG.setAttribute('transform', 'rotate(' + ang.toFixed(2) + ')'); }
    function spring(now) {
      var dt = lastT ? Math.min(0.032, (now - lastT) / 1000) : 0.016; lastT = now;
      var k = 150, c = 15; // leicht unterdämpft: kleines Nachfedern
      vel += ((target - ang) * k - vel * c) * dt; ang += vel * dt; apply();
      if (Math.abs(target - ang) < 0.05 && Math.abs(vel) < 0.5) { ang = target; apply(); raf = 0; lastT = 0; return; }
      raf = requestAnimationFrame(spring);
    }
    function goTo(a) { target = a; if (!animate) { ang = a; vel = 0; apply(); return; } if (!raf) { lastT = 0; raf = requestAnimationFrame(spring); } }
    function nearestFor(i, from) { var a = -90 - centers[i]; while (a - from > 180) a -= 360; while (a - from < -180) a += 360; return a; }
    function snap(a) { var best = a, bd = 1e9; centers.forEach(function (c, i) { var s = nearestFor(i, a); if (Math.abs(s - a) < bd) { bd = Math.abs(s - a); best = s; } }); return best; }

    items[0].tabIndex = 0;
    function toggle(g, on) {
      var id = g.getAttribute('data-aroma'); on = on === undefined ? !sel[id] : on;
      if (on) sel[id] = true; else delete sel[id];
      g.setAttribute('aria-checked', on ? 'true' : 'false');
    }
    function results() {
      var keys = Object.keys(sel); count.textContent = keys.length;
      while (out.firstChild) out.removeChild(out.firstChild);
      if (!keys.length) {
        var li0 = document.createElement('li'); li0.className = 'matches__empty';
        li0.textContent = 'Noch keine Auswahl. Probieren Sie zum Beispiel „Beeren“ und „Jasmin“ – oder „Haselnuss“ und „Karamell“.'; out.appendChild(li0); return;
      }
      var ranked = Object.keys(COFFEES).map(function (id) {
        var hit = COFFEES[id].aromas.filter(function (a) { return sel[a]; });
        return { id: id, hit: hit, score: hit.length / Math.max(keys.length, 1) };
      }).filter(function (r) { return r.hit.length; }).sort(function (a, b) { return b.hit.length - a.hit.length || b.score - a.score; }).slice(0, 3);
      ranked.forEach(function (r, i) {
        var li = document.createElement('li'); li.className = 'match' + (i === 0 ? ' match--top' : ''); li.style.setProperty('--d', i);
        var n = document.createElement('span'); n.className = 'match__name'; n.textContent = COFFEES[r.id].name;
        var s = document.createElement('span'); s.className = 'match__score'; s.textContent = r.hit.length + ' von ' + keys.length;
        var w = document.createElement('p'); w.className = 'match__why'; w.textContent = 'Passt bei: ' + r.hit.map(function (a) { return AROMA_LABEL[a]; }).join(', ');
        var bar = document.createElement('span'); bar.className = 'match__bar'; var bi = document.createElement('span'); bi.style.transform = 'scaleX(' + r.score.toFixed(3) + ')'; bar.appendChild(bi);
        var links = document.createElement('span'); links.className = 'match__links';
        var a1 = document.createElement('a'); a1.className = 'link-draw'; a1.href = '#profile'; a1.setAttribute('data-pick-profile', r.id); a1.textContent = 'Röstkurve';
        var a2 = document.createElement('a'); a2.className = 'link-draw'; a2.href = '#abo'; a2.setAttribute('data-pick-abo', r.id); a2.textContent = 'Ins Abo';
        links.appendChild(a1); links.appendChild(a2);
        [n, s, w, bar, links].forEach(function (x) { li.appendChild(x); });
        out.appendChild(li);
      });
    }
    items.forEach(function (g, i) {
      g.addEventListener('click', function () { if (suppress) return; toggle(g); items.forEach(function (x) { x.tabIndex = -1; }); g.tabIndex = 0; results(); });
      g.addEventListener('keydown', function (e) {
        var n = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: items.length - 1 }[e.key];
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(g); results(); return; }
        if (n === undefined) return; e.preventDefault();
        var k = (n + items.length) % items.length, t = items[k]; g.tabIndex = -1; t.tabIndex = 0; t.focus();
        goTo(nearestFor(k, ang)); // das fokussierte Aroma wandert unter den Zeiger
      });
    });
    $$('.fw-cat').forEach(function (c) {
      c.addEventListener('click', function () {
        if (suppress) return;
        var kids = items.filter(function (g) { return g.getAttribute('data-cat') === c.getAttribute('data-cat'); });
        var all = kids.every(function (g) { return sel[g.getAttribute('data-aroma')]; });
        kids.forEach(function (g) { toggle(g, !all); }); results();
      });
    });
    $('#wheel-reset').addEventListener('click', function () { items.forEach(function (g) { toggle(g, false); }); results(); goTo(snap(Math.round(ang / 360) * 360)); });

    // Greifen und drehen (Zeiger/Touch, mit Schwung); kurzer Tipp bleibt ein Klick
    var pid = null, a0 = 0, ang0 = 0, lastA = 0, lastTime = 0, v = 0;
    function pAngle(e) { var r = svg.getBoundingClientRect(), x = e.clientX - (r.left + r.width * 215 / 430), y = e.clientY - (r.top + r.height * 228 / 443); return Math.atan2(y, x) * 180 / Math.PI; }
    function norm(a) { while (a > 180) a -= 360; while (a < -180) a += 360; return a; }
    svg.addEventListener('pointerdown', function (e) { if (e.button !== 0 && e.pointerType === 'mouse') return; pid = e.pointerId; a0 = lastA = pAngle(e); ang0 = ang; lastTime = performance.now(); v = 0; dragging = false; });
    svg.addEventListener('pointermove', function (e) {
      if (e.pointerId !== pid) return;
      var a = pAngle(e), da = norm(a - a0);
      if (!dragging && Math.abs(da) > 6) { dragging = true; wheelEl.classList.add('is-dragging'); try { svg.setPointerCapture(pid); } catch (x) {} cancelAnimationFrame(raf); raf = 0; vel = 0; }
      if (!dragging) return;
      var now = performance.now(), step = norm(a - lastA), dt = Math.max(1, now - lastTime);
      v = lerp(v, step / dt * 1000, 0.4); lastA = a; lastTime = now;
      ang = ang0 + da; target = ang; apply();
    });
    function end(e) {
      if (e.pointerId !== pid) return; pid = null;
      if (!dragging) return;
      dragging = false; wheelEl.classList.remove('is-dragging'); suppress = true; setTimeout(function () { suppress = false; }, 60);
      vel = animate ? clamp(v, -900, 900) : 0;
      goTo(snap(ang + clamp(v, -900, 900) * 0.22));
    }
    svg.addEventListener('pointerup', end); svg.addEventListener('pointercancel', function (e) { if (e.pointerId === pid) { pid = null; if (dragging) { dragging = false; wheelEl.classList.remove('is-dragging'); goTo(snap(ang)); } } });

    // Auftritt: das Rad wird einmal angeschubst und federt in Position
    if (animate) {
      ang = -55; apply();
      new IntersectionObserver(function (es, o) { if (es[0].isIntersecting) { o.disconnect(); vel = 260; goTo(0); } }, { threshold: 0.35 }).observe(svg);
    }
  });

  /* ---------- Abo-Konfigurator ---------- */
  var abo;
  later(function () {
    var form = $('#abo-form'), ticket = $('.ticket');
    var o = { coffee: $('#t-coffee'), sub: $('#t-sub'), rab: $('#t-rabatt'), rabL: $('.ticket__line--minus span'), ship: $('#t-ship'), per: $('#t-per'), month: $('#t-month'), meta: $('#t-meta'), next: $('#t-next') };
    var val = function (n) { var c = form.querySelector('input[name="' + n + '"]:checked'); return c ? c.value : null; };
    function nextRoast() {
      var t = new Date(); t.setHours(12, 0, 0, 0);
      for (var i = 1; i < 8; i++) { var x = new Date(t.getTime() + i * 864e5); if (ROAST_DAYS.indexOf(x.getDay()) > -1) return x; }
      return t;
    }
    function calc() {
      var id = val('kaffee'), packs = +val('menge'), rh = val('rhythmus'), grind = val('mahlgrad');
      var sub = PRICE_PER_250G[id] * packs, rate = ABO_DISCOUNT + (packs === 4 ? KILO_EXTRA_DISCOUNT : 0);
      var rab = Math.round(sub * rate * 100) / 100, goods = sub - rab, ship = goods >= FREE_SHIPPING_FROM ? 0 : SHIPPING;
      var per = goods + ship, month = per * DELIVERIES_PER_MONTH[rh];
      return { id: id, packs: packs, rh: rh, grind: grind, sub: sub, rate: rate, rab: rab, ship: ship, per: per, month: month };
    }
    // Zählwerk: neue Summe rollt von unten ein (nur bei echter Änderung)
    var rolled = false;
    function setRoll(el, txt) {
      if (el.textContent === txt) return;
      el.textContent = txt;
      if (rolled && animate && el.animate) el.animate([{ transform: 'translateY(60%)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 220, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' });
    }
    function update() {
      var c = calc();
      o.coffee.textContent = c.packs + ' × 250' + NB + 'g ' + COFFEES[c.id].name;
      o.sub.textContent = eur.format(c.sub);
      o.rabL.textContent = (c.packs === 4 ? 'Abo- und Kilorabatt ' : 'Abo-Rabatt ') + Math.round(c.rate * 100) + NB + '%';
      o.rab.textContent = '−' + eur.format(c.rab);
      o.ship.textContent = c.ship ? eur.format(c.ship) : 'frei';
      setRoll(o.per, eur.format(c.per));
      setRoll(o.month, eur.format(c.month));
      rolled = true;
      o.meta.textContent = c.grind + ' · ' + RHYTHM_LABEL[c.rh];
      o.next.textContent = 'Erste Röstung für Sie: ' + nextRoast().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
    }
    form.addEventListener('change', function (e) { if (e.target.type === 'radio') update(); });
    update();
    abo = { pick: function (id) { var r = form.querySelector('input[name="kaffee"][value="' + id + '"]'); if (r) { r.checked = true; update(); } } };
    document.addEventListener('click', function (e) { var a = e.target.closest('[data-pick-abo]'); if (a) abo.pick(a.getAttribute('data-pick-abo')); });

    validated(form, $('#abo-error'), function () {
      var c = calc(), fd = new FormData(form);
      return [['Kaffee', COFFEES[c.id].name], ['Menge', c.packs * 250 >= 1000 ? '1' + NB + 'kg' : c.packs * 250 + NB + 'g'], ['Mahlgrad', c.grind], ['Rhythmus', RHYTHM_LABEL[c.rh]], ['Pro Lieferung', eur.format(c.per)], ['E-Mail', String(fd.get('email'))]];
    }, $('#abo-summary'), $('#abo-success'), ticket);
    $('[data-reset="abo"]').addEventListener('click', function () { form.reset(); ticket.classList.remove('is-done'); $('#abo-success').hidden = true; update(); $('#abo-name').focus(); });
  });

  // Gemeinsame Formularprüfung (nur clientseitig, nichts wird gesendet)
  function validated(form, errEl, summary, listEl, successEl, doneEl) {
    var mailOk = function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = [], first = null;
      $$('input[required], select[required], textarea[required]', form).forEach(function (f) {
        if (f.closest('[hidden]')) return;
        var ok = f.type === 'checkbox' ? f.checked : f.type === 'email' ? mailOk(f.value.trim()) : f.value.trim().length >= 2;
        f.setAttribute('aria-invalid', ok ? 'false' : 'true');
        if (!ok) { bad.push(f); first = first || f; }
      });
      var g = form.querySelector('input[name="personen"]');
      if (g && !g.closest('[hidden]')) { var n = +g.value; var okG = n >= 1 && n <= 10; g.setAttribute('aria-invalid', okG ? 'false' : 'true'); if (!okG) { bad.push(g); first = first || g; } }
      if (bad.length) {
        var names = bad.map(function (f) { return f.type === 'checkbox' ? 'Zustimmung zu den Datenschutzhinweisen' : f.type === 'email' ? 'gültige E-Mail-Adresse' : f.name === 'personen' ? 'Personen (1–10)' : 'Name'; });
        errEl.textContent = 'Bitte prüfen: ' + names.join(', ') + '.'; errEl.hidden = false; first.focus(); return;
      }
      errEl.hidden = true;
      var rows = summary();
      while (listEl.firstChild) listEl.removeChild(listEl.firstChild);
      rows.forEach(function (r) { var li = document.createElement('li'), a = document.createElement('span'), b = document.createElement('span'); a.textContent = r[0]; b.textContent = r[1]; li.appendChild(a); li.appendChild(b); listEl.appendChild(li); });
      var nm = form.querySelector('input[name="name"]').value.trim();
      $$('[data-out="name"]', successEl).forEach(function (s) { s.textContent = nm.split(' ')[0]; });
      doneEl.classList.add('is-done'); successEl.hidden = false; successEl.focus();
    });
    form.addEventListener('input', function (e) { if (e.target.getAttribute('aria-invalid') === 'true') e.target.removeAttribute('aria-invalid'); });
  }


  /* ---------- Brew-Guide: Timer als Waage mit Tropfen ---------- */
  later(function () {
    var cIn = $('#b-coffee'), rIn = $('#b-ratio'), cOut = $('#b-coffee-out'), rOut = $('#b-ratio-out'), wOut = $('#b-water'), wLab = $('#b-water-label'), cups = $('#b-cups');
    var img = $('#brew-img'), stepsEl = $('#steps'), tTime = $('#timer-time'), tOf = $('#timer-of'), prog = $('#timer-prog'), live = $('#timer-live'), bStart = $('#timer-start'), bReset = $('#timer-reset'), timerBox = $('.timer');
    var weightEl = $('#scale-weight'), dropsEl = $$('#drops ellipse');
    var M = METHODS.v60, key = 'v60', running = false, t0 = 0, acc = 0, raf = 0, lastStep = -1, lastSec = -1, lastW = -1, lastFrame = 0;
    // Geometrie der Waagen-Zeichnung (SVG-Einheiten): Tropfenquelle, Gefäß oben/unten
    var GEO = { v60: { src: [[150, 118]], top: 184, bottom: 290, max: 0.82 }, fp: { src: [[156, 90]], top: 128, bottom: 290, max: 0.8 }, es: { src: [[136, 106], [164, 106]], top: 236, bottom: 290, max: 0.7 }, ap: { src: [[156, 90]], top: 112, bottom: 208, max: 0.85 } };
    var drops = dropsEl.map(function (e) { return { el: e, on: false, x: 0, y: 0, vy: 0 }; }), spawnAcc = 0;
    var fmtRatio = function (r) { return '1' + NB + ':' + NB + num1.format(r); };
    function water() { return Math.round(+cIn.value * +rIn.value); }
    function fill(input) { input.style.setProperty('--fill', ((input.value - input.min) / (input.max - input.min) * 100) + '%'); }
    function text(tpl) {
      var w = water();
      return tpl.replace('{c}', cIn.value).replace('{w15}', Math.round(w * 0.16)).replace('{w60}', Math.round(w * 0.6)).replace('{w}', w).replace(/ (ml|g) /g, NB + '$1 ').replace(/ (ml|g)\./g, NB + '$1.');
    }
    function pour(t) { var p = POUR[key]; for (var i = 1; i < p.length; i++) if (t <= p[i][0]) return lerp(p[i - 1][1], p[i][1], (t - p[i - 1][0]) / (p[i][0] - p[i - 1][0])); return 1; }
    function pouring(t) { var p = POUR[key]; for (var i = 1; i < p.length; i++) if (t <= p[i][0]) return p[i][1] > p[i - 1][1]; return key === 'v60' && t < 150; }
    function liquid(f) { $$('.liq').forEach(function (l) { l.style.transform = 'scaleY(' + (f * GEO[key].max).toFixed(4) + ')'; }); }
    function renderSteps() {
      while (stepsEl.firstChild) stepsEl.removeChild(stepsEl.firstChild);
      M.steps.forEach(function (s) {
        var li = document.createElement('li'), t = document.createElement('span'), x = document.createElement('span');
        t.className = 'steps__t'; t.textContent = mss(s[0]); x.textContent = text(s[1]);
        li.appendChild(t); li.appendChild(x); stepsEl.appendChild(li);
      });
      lastStep = -1; paint(elapsed(), true);
    }
    function calc() {
      fill(cIn); fill(rIn);
      cOut.textContent = cIn.value + NB + 'g'; rOut.textContent = fmtRatio(+rIn.value);
      var w = water(); wOut.textContent = w + NB + M.unit; wLab.textContent = M.waterLabel;
      var n = Math.max(1, Math.round(w / M.cup)); cups.textContent = '≈ ' + n + ' ' + M.cupWord[n === 1 ? 0 : 1];
      $$('#steps li > span:last-child').forEach(function (x, i) { x.textContent = text(M.steps[i][1]); });
      lastW = -1; paint(elapsed(), true);
    }
    function elapsed() { return running ? acc + (performance.now() - t0) / 1000 : acc; }
    function paint(e, force) {
      e = Math.min(e, M.total);
      var sec = Math.floor(e);
      if (sec !== lastSec || force) { tTime.textContent = mss(sec); lastSec = sec; }
      prog.style.strokeDashoffset = (1000 * (1 - e / M.total)).toFixed(1);
      var f = e > 0 ? pour(e) : 0, wv = Math.round(water() * f);
      if (wv !== lastW || force) { weightEl.textContent = wv + NB + 'g'; lastW = wv; liquid(f); }
      var idx = -1; for (var i = 0; i < M.steps.length; i++) if (e >= M.steps[i][0]) idx = i;
      if (!running && e === 0) idx = -1;
      if (idx !== lastStep || force) {
        $$('#steps li').forEach(function (li, i) { li.classList.toggle('is-active', i === idx); li.classList.toggle('is-done', i < idx || (e >= M.total && i === idx)); });
        if (idx >= 0 && idx !== lastStep && running) live.textContent = 'Schritt ' + (idx + 1) + ': ' + text(M.steps[idx][1]);
        lastStep = idx;
      }
    }
    function simDrops(e, dt) {
      if (!animate) return;
      var G = GEO[key], level = G.bottom - (G.bottom - G.top) * pour(e) * G.max;
      if (running && pouring(e)) { spawnAcc += dt * (key === 'v60' && e > 105 ? 5 : key === 'es' ? 9 : 16); }
      while (spawnAcc >= 1) {
        spawnAcc -= 1;
        var dfree = drops.filter(function (x) { return !x.on; })[0]; if (!dfree) break;
        var s = G.src[Math.floor(Math.random() * G.src.length)];
        dfree.on = true; dfree.x = s[0] + (Math.random() - 0.5) * 3; dfree.y = s[1]; dfree.vy = 30 + Math.random() * 30; dfree.el.style.opacity = '1';
      }
      drops.forEach(function (x) {
        if (!x.on) return;
        x.vy += 1100 * dt; x.y += x.vy * dt;
        if (x.y >= level - 2) { x.on = false; x.el.style.opacity = '0'; return; }
        x.el.setAttribute('transform', 'translate(' + x.x.toFixed(1) + ' ' + x.y.toFixed(1) + ')');
      });
    }
    function clearDrops() { spawnAcc = 0; drops.forEach(function (x) { x.on = false; x.el.style.opacity = '0'; }); }
    function tick(now) {
      raf = 0; var e = elapsed(), dt = lastFrame ? Math.min(0.05, (now - lastFrame) / 1000) : 0.016; lastFrame = now;
      if (e >= M.total) { acc = M.total; running = false; paint(M.total, true); clearDrops(); timerBox.classList.add('is-done'); setLabel('Noch einmal'); live.textContent = 'Fertig – guten Genuss!'; return; }
      paint(e); simDrops(e, dt); raf = requestAnimationFrame(tick);
    }
    function setLabel(t) { var s = $('span', bStart); (s || bStart).textContent = t; }
    function reset() { running = false; acc = 0; cancelAnimationFrame(raf); raf = 0; lastFrame = 0; clearDrops(); timerBox.classList.remove('is-done'); setLabel('Timer starten'); lastSec = -1; paint(0, true); }
    bStart.addEventListener('click', function () {
      if (running) { acc = elapsed(); running = false; cancelAnimationFrame(raf); raf = 0; lastFrame = 0; setLabel('Weiter'); return; }
      if (acc >= M.total) reset();
      running = true; t0 = performance.now(); lastFrame = 0; setLabel('Pause'); timerBox.classList.remove('is-done'); raf = requestAnimationFrame(tick);
    });
    bReset.addEventListener('click', reset);
    document.addEventListener('visibilitychange', function () { if (!document.hidden && running && !raf) { lastFrame = 0; raf = requestAnimationFrame(tick); } });
    function setMethod(k) {
      key = k; M = METHODS[k]; reset();
      timerBox.setAttribute('data-method', k);
      cIn.min = M.cmin; cIn.max = M.cmax; cIn.value = M.coffee;
      rIn.min = M.rmin; rIn.max = M.rmax; rIn.step = M.rstep; rIn.value = M.ratio;
      $('#b-grind').textContent = M.grind; $('#b-temp').textContent = M.temp.replace(' ', NB); $('#b-total').textContent = mss(M.total) + NB + 'min';
      tOf.textContent = 'von ' + mss(M.total);
      var src = IMG + M.img + '-960.webp', set = IMG + M.img + '-480.webp 480w, ' + src + ' 960w';
      if (img.getAttribute('src') !== src) {
        if (animate) img.classList.add('is-swapping');
        var pre = new Image(); pre.onload = pre.onerror = function () { img.srcset = set; img.src = src; img.alt = M.alt; img.classList.remove('is-swapping'); };
        pre.sizes = img.sizes; pre.srcset = set; pre.src = src;
      }
      renderSteps(); calc();
    }
    cIn.addEventListener('input', calc); rIn.addEventListener('input', calc);
    tabs($('.brew__tabs'), function (tab) { setMethod(tab.getAttribute('data-method')); });
    setMethod('v60');
  });

  /* ---------- Kontaktformular ---------- */
  later(function () {
    var form = $('#contact-form'), tf = $('#tour-fields'), sel = $('#c-date');
    // Nächste vier Samstage
    var t = new Date(); t.setHours(12, 0, 0, 0); var opts = [];
    for (var i = 1; opts.length < 4 && i < 40; i++) { var x = new Date(t.getTime() + i * 864e5); if (x.getDay() === 6) opts.push(x); }
    while (sel.firstChild) sel.removeChild(sel.firstChild);
    opts.forEach(function (o) { var op = document.createElement('option'); op.textContent = o.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'long' }) + ' · 11 Uhr'; sel.appendChild(op); });
    form.addEventListener('change', function (e) { if (e.target.name === 'anliegen') tf.hidden = e.target.value !== 'Führung'; });
    validated(form, $('#contact-error'), function () {
      var fd = new FormData(form), a = String(fd.get('anliegen')), rows = [['Anliegen', a]];
      if (a === 'Führung') { rows.push(['Termin', String(fd.get('termin'))]); rows.push(['Personen', String(fd.get('personen'))]); }
      rows.push(['E-Mail', String(fd.get('email'))]);
      var msg = String(fd.get('nachricht') || '').trim(); if (msg) rows.push(['Nachricht', msg.length > 80 ? msg.slice(0, 80) + '…' : msg]);
      return rows;
    }, $('#contact-summary'), $('#contact-success'), form);
    $('[data-reset="contact"]').addEventListener('click', function () { form.reset(); tf.hidden = false; form.classList.remove('is-done'); $('#contact-success').hidden = true; $('#c-name').focus(); });
  });

  /* ---------- Öffnungszeiten + aktive Navigation ---------- */
  later(function () {
    var now = new Date(), day = now.getDay(), h = now.getHours() + now.getMinutes() / 60;
    var open = day >= 1 && day <= 5 ? [8, 18] : [9, 18], st = $('#open-status');
    var isOpen = h >= open[0] && h < open[1];
    st.textContent = isOpen ? 'Jetzt geöffnet · bis 18 Uhr' : (h < open[0] ? 'Geschlossen · öffnet heute um ' + open[0] + ' Uhr' : 'Geschlossen · öffnet morgen um ' + ((day + 1) % 7 >= 1 && (day + 1) % 7 <= 5 ? 8 : 9) + ' Uhr');
    st.classList.add(isOpen ? 'is-open' : 'is-closed');
    $$('.hours__list [data-days]').forEach(function (r) { if (r.getAttribute('data-days').split(',').indexOf(String(day)) > -1) r.classList.add('is-today'); });

    var links = $$('.nav__list a'), map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { links.forEach(function (a) { a.classList.remove('is-active'); a.removeAttribute('aria-current'); }); var a = map[e.target.id]; if (a) { a.classList.add('is-active'); a.setAttribute('aria-current', 'true'); } } });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
  });

  // Start der Warteschlange nach dem ersten Bild (spätestens nach 1,5 s)
  var started = false;
  var go = function () { if (started) return; started = true; setTimeout(runQueue, 30); };
  if (document.readyState === 'complete') go(); else window.addEventListener('load', go, { once: true });
  setTimeout(go, 1500);
})();

