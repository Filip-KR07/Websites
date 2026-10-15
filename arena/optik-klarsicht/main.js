/* ==========================================================================
   Klarsicht Optik & Akustik · Modell „Fokus“
   Ohne Build-Schritt. Optional: GSAP + ScrollTrigger, Lenis (assets/vendor).
   Alle Inhalte sind auch ohne JavaScript bzw. mit ?motion=off sichtbar.
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
     DEMO-WERTE (unverbindliche Beispiele) – hier anpassen
     ------------------------------------------------------------------ */

  // Glas-Explorer: Preise ab … € pro Paar (Kunststoff, entspiegelt, gehärtet)
  var GLASS = {
    GLEIT_CLASSES: [
      { name: 'Basis', price: 290 },
      { name: 'Komfort', price: 490 },
      { name: 'Premium', price: 790 }
    ],
    // Sonnenschutz: Deckkraft der Tönung je Filterkategorie 0–4 und Erklärung
    SUN_TINT: [0.06, 0.24, 0.44, 0.62, 0.8],
    SUN_TEXT: [
      'Kat. 0: kaum getönt – Komfortglas für drinnen und abends.',
      'Kat. 1: leichte Tönung – bedeckter Himmel, Übergangszeit.',
      'Kat. 2: mittlere Tönung – der Alltag im deutschen Sommer.',
      'Kat. 3: starke Tönung – Strand, Wasser, Berge im Sommer.',
      'Kat. 4: sehr dunkel – Gletscher und Hochgebirge. Nicht zum Autofahren geeignet.'
    ]
  };

  // Brillen-Anprobe: Maße in Millimetern
  var TRYON = {
    PX_PER_MM: 2,          // Maßstab der Silhouette (SVG-Einheiten je mm)
    WIDTH_MIN: 46,         // kleinste Glasbreite
    WIDTH_MAX: 56,         // größte Glasbreite
    WIDTH_DEFAULT: 50,
    ENDPIECE_MM: 5,        // Backe/Scharnier je Seite → Gesamtbreite = 2 × Glas + Steg + 2 × 5
    FIT_TOLERANCE_MM: 6    // ab dieser Abweichung zur Gesichtsbreite: „wirkt schmal/breit“
  };

  // Terminbuchung (Demo – belegte Zeiten sind reproduzierbar ausgewürfelt)
  var BOOKING = {
    DAYS_SHOWN: 12,                       // so viele Öffnungstage stehen zur Wahl
    WEEKDAY: ['09:30', '18:00'],          // erste und letzte Startzeit Mo–Fr
    SATURDAY: ['10:00', '14:30'],         // erste und letzte Startzeit Sa
    STEP_MIN: 30,                         // Raster in Minuten
    BUSY_RATE: 0.3                        // Anteil bereits vergebener Zeiten
  };

  // Öffnungszeiten (für „Jetzt geöffnet“), Wochentag 0 = Sonntag
  var HOURS = { 0: null, 1: [570, 1110], 2: [570, 1110], 3: [570, 1110], 4: [570, 1110], 5: [570, 1110], 6: [600, 900] };

  // Sehtafel-Spiel: Stufen (Spielwerte, kein Visus) und Ringgröße bei Stufe 1,0 in px
  var EYEGAME = {
    LEVELS: [0.1, 0.2, 0.3, 0.4, 0.5, 0.63, 0.8, 1.0, 1.25, 1.6, 2.0],
    RING_PX_AT_1: 13
  };

  /* ------------------------------------------------------------------
     Grundlagen
     ------------------------------------------------------------------ */
  window.__klarsichtReady = true;
  var doc = document.documentElement;
  var SVGNS = 'http://www.w3.org/2000/svg';
  var qs = function (s, r) { return (r || document).querySelector(s); };
  var qsa = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var motionOff = doc.classList.contains('motion-off');
  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduced = motionOff || mqReduce.matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasGSAP = !!(window.gsap && window.ScrollTrigger);
  if (!hasGSAP) doc.classList.remove('anim');
  var anim = doc.classList.contains('anim');
  var gsap = window.gsap;
  var lenis = null;

  function safe(name, fn) {
    try { fn(); } catch (err) { if (window.console) console.warn('[Klarsicht] ' + name + ':', err); }
  }
  // Start in Etappen: Kopfzeile und Hero sofort, alles unterhalb des ersten
  // Bildschirms danach in kurzen Häppchen – so bleibt der Main-Thread frei.
  var jobs = [];
  function later(name, fn) { jobs.push([name, fn]); }
  function drain() {
    var t = performance.now();
    while (jobs.length) {
      var j = jobs.shift();
      safe(j[0], j[1]);
      if (jobs.length && performance.now() - t > 24) { setTimeout(drain, 0); return; }
    }
    if (anim && window.ScrollTrigger && document.readyState === 'complete') window.ScrollTrigger.refresh();
  }
  function el(tag, attrs, parent) {
    var n = document.createElementNS(SVGNS, tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (parent) parent.appendChild(n);
    return n;
  }
  function h(tag, cls, text, parent) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    if (parent) parent.appendChild(n);
    return n;
  }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function fmtDe(v, d) { return v.toLocaleString('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function headH() { return window.innerWidth >= 900 ? 72 : 60; }
  function focusEl(node) {
    if (!node) return;
    try { node.focus({ preventScroll: true }); } catch (e) { node.focus(); }
  }
  function focusTarget(t) {
    if (!t) return;
    if (!t.matches('a[href], button, input, select, textarea, [tabindex]')) t.setAttribute('tabindex', '-1');
    focusEl(t);
  }
  function scrollToEl(target, done) {
    if (!target) return;
    var off = -(headH() + 12);
    if (lenis) {
      lenis.scrollTo(target, { offset: off, duration: 1.2, onComplete: done });
    } else {
      var y = target.getBoundingClientRect().top + window.pageYOffset + off;
      window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
      if (done) setTimeout(done, reduced ? 30 : 600);
    }
  }

  /* ------------------------------------------------------------------
     Lenis + ScrollTrigger
     ------------------------------------------------------------------ */
  safe('lenis', function () {
    if (!anim) return;
    gsap.registerPlugin(window.ScrollTrigger);
    window.ScrollTrigger.config({ ignoreMobileResize: true });
    if (window.Lenis) {
      lenis = new window.Lenis({ lerp: 0.11, smoothWheel: true });
      window.__lenis = lenis;
      lenis.on('scroll', window.ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    }
  });

  /* ------------------------------------------------------------------
     Header: Zustand, Fortschritt, aktive Navigation
     ------------------------------------------------------------------ */
  safe('header', function () {
    var head = qs('.head');
    var bar = qs('.progress span');
    var ticking = false;
    function update() {
      ticking = false;
      var y = window.pageYOffset;
      head.classList.toggle('is-scrolled', y > 8);
      var max = document.documentElement.scrollHeight - window.innerHeight;
      if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? clamp(y / max, 0, 1) : 0).toFixed(4) + ')';
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();

    var links = qsa('.nav a[href^="#"]');
    var map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { a.removeAttribute('aria-current'); });
        var a = map[e.target.id];
        if (a) a.setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
  });

  /* ------------------------------------------------------------------
     Anker-Links, Anlass-Vorauswahl
     ------------------------------------------------------------------ */
  function presetAnlass(val) {
    var r = qs('.book-form input[name="anlass"][value="' + val + '"]');
    if (r) { r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true })); }
  }
  safe('anchors', function () {
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a || a.closest('.menu')) return;
      var id = a.getAttribute('href').slice(1);
      var target = id ? document.getElementById(id) : null;
      if (a.hasAttribute('data-anlass')) presetAnlass(a.getAttribute('data-anlass'));
      if (!target) return;
      if (lenis) {
        e.preventDefault();
        scrollToEl(target, function () { focusTarget(target); });
        if (history.replaceState) history.replaceState(null, '', '#' + id);
      } else {
        setTimeout(function () { focusTarget(target); }, reduced ? 0 : 450);
      }
    });
  });

  /* ------------------------------------------------------------------
     Menü (Dialog)
     ------------------------------------------------------------------ */
  safe('menu', function () {
    var btn = qs('.menu-btn');
    var dlg = qs('#menu');
    if (!btn || !dlg) return;
    qsa('.menu-chart li', dlg).forEach(function (li, i) { li.style.setProperty('--i', i); });
    var pending = null;
    function open() {
      if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
      btn.setAttribute('aria-expanded', 'true');
      if (lenis) lenis.stop();
      focusEl(qs('.menu-close', dlg));
    }
    function close() {
      if (typeof dlg.close === 'function' && dlg.open) dlg.close(); else { dlg.removeAttribute('open'); onClose(); }
    }
    function onClose() {
      btn.setAttribute('aria-expanded', 'false');
      if (lenis) lenis.start();
      if (pending) {
        var t = pending; pending = null;
        scrollToEl(t, function () { focusTarget(t); });
      } else {
        focusEl(btn);
      }
    }
    btn.addEventListener('click', open);
    qs('.menu-close', dlg).addEventListener('click', close);
    dlg.addEventListener('close', onClose);
    dlg.addEventListener('click', function (e) {
      if (e.target === dlg) { close(); return; }
      var a = e.target.closest('a');
      if (!a) return;
      var href = a.getAttribute('href') || '';
      if (href.charAt(0) === '#') {
        e.preventDefault();
        if (a.hasAttribute('data-anlass')) presetAnlass(a.getAttribute('data-anlass'));
        pending = document.getElementById(href.slice(1));
        close();
      }
    });
  });

  /* ------------------------------------------------------------------
     Öffnungsstatus (Bonner Ortszeit)
     ------------------------------------------------------------------ */
  safe('open-status', function () {
    var DAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    function now() {
      var d = new Date();
      try {
        var parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Berlin', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(d);
        var o = {};
        parts.forEach(function (p) { o[p.type] = p.value; });
        var wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(o.weekday);
        return { day: wd, min: (parseInt(o.hour, 10) % 24) * 60 + parseInt(o.minute, 10) };
      } catch (e) {
        return { day: d.getDay(), min: d.getHours() * 60 + d.getMinutes() };
      }
    }
    function hm(m) { return Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0') + ' Uhr'; }
    function status() {
      var n = now();
      var t = HOURS[n.day];
      if (t && n.min >= t[0] && n.min < t[1]) return { open: true, text: 'Jetzt geöffnet · bis ' + hm(t[1]) };
      if (t && n.min < t[0]) return { open: false, text: 'Heute ab ' + hm(t[0]) + ' geöffnet' };
      for (var i = 1; i <= 7; i++) {
        var d = (n.day + i) % 7;
        if (HOURS[d]) return { open: false, text: 'Geschlossen · öffnet ' + (i === 1 ? 'morgen' : DAYS[d]) + ' ' + hm(HOURS[d][0]) };
      }
      return { open: false, text: '' };
    }
    var s = status();
    qsa('[data-open-status]').forEach(function (n) {
      var inHero = !!n.closest('.hero-eyebrow');
      if (inHero) {
        clear(n);
        h('span', 'eb-pre', 'Augenoptik & Hörakustik · ', n);
        n.appendChild(document.createTextNode(s.text));
      } else n.textContent = s.text;
      var host = n.closest('.hero-eyebrow, .open-now, .menu-meta');
      if (host) host.classList.toggle('is-open', s.open);
    });
    var today = now().day;
    qsa('.hours tr[data-days]').forEach(function (tr) {
      if (+tr.getAttribute('data-days') === today) tr.classList.add('is-today');
    });
  });

  /* ------------------------------------------------------------------
     Brillen-Geometrie (geteilt von Anprobe, Finder, Team)
     ------------------------------------------------------------------ */
  var MODELS = {
    panto:    { name: 'Panto',    model: 'Poppelsdorf', bridge: 20, temple: 145, ratio: 0.84, rim: 6,   kind: 'acetate', why: 'Oben gerade, unten rund – passt fast immer.' },
    rund:     { name: 'Rund',     model: 'Kessenich',   bridge: 21, temple: 145, ratio: 1,    rim: 4.4, kind: 'acetate', why: 'Nimmt Strenge aus dem Gesicht.' },
    rechteck: { name: 'Rechteck', model: 'Beuel',       bridge: 18, temple: 145, ratio: 0.62, rim: 6.4, kind: 'acetate', why: 'Klare Kanten geben weichen Zügen Kontur.' },
    browline: { name: 'Browline', model: 'Endenich',    bridge: 20, temple: 145, ratio: 0.76, rim: 2,   kind: 'browline', why: 'Betont die Augenpartie und streckt.' },
    cateye:   { name: 'Cat-Eye',  model: 'Godesberg',   bridge: 18, temple: 140, ratio: 0.72, rim: 6.4, kind: 'acetate', why: 'Hebt die Wangenknochen an.' },
    achteck:  { name: 'Achteck',  model: 'Duisdorf',    bridge: 20, temple: 145, ratio: 0.86, rim: 2.4, kind: 'metal',   why: 'Leicht und kantig zugleich.' }
  };
  var MODEL_ORDER = ['panto', 'rund', 'rechteck', 'browline', 'cateye', 'achteck'];
  var COLORS = {
    schwarz:    { name: 'Schwarz',    paint: '#15171A' },
    schildpatt: { name: 'Schildpatt', paint: 'url(#pat-tortoise)' },
    kristall:   { name: 'Kristall',   paint: 'rgba(160,172,188,.9)', inner: '#6F7B88' },
    titan:      { name: 'Titan',      paint: 'url(#grad-titan)' },
    kobalt:     { name: 'Kobalt',     paint: '#2443FF' }
  };
  var COLOR_ORDER = ['schwarz', 'schildpatt', 'kristall', 'titan', 'kobalt'];
  var SILVER = '#9AA1A9';

  // Gesichtsformen: rechte Hälfte von oben nach unten [Abstand zur Mitte, y] im Raster 360 × 460
  var FACES = {
    oval:      { name: 'Oval',       mouth: 330, pts: [[0, 52], [70, 62], [112, 100], [130, 160], [132, 214], [126, 272], [108, 328], [76, 374], [36, 398], [0, 404]],
                 text: 'Ausgewogene Proportionen, die Wangenknochen sind die breiteste Stelle. Sie können fast jede Form tragen – wichtig ist nur, dass die Fassung nicht breiter ist als Ihr Gesicht.',
                 avoid: 'Eher meiden: Fassungen, die seitlich deutlich überstehen.', reco: ['rechteck', 'panto', 'cateye'] },
    rund:      { name: 'Rund',       mouth: 320, pts: [[0, 62], [80, 70], [124, 108], [140, 164], [142, 216], [138, 270], [122, 320], [92, 362], [48, 388], [0, 394]],
                 text: 'Länge und Breite sind fast gleich, die Linien weich. Kantige, eher breite Fassungen geben Struktur und strecken optisch.',
                 avoid: 'Eher meiden: kleine, kreisrunde Gläser – sie wiederholen die Rundung.', reco: ['rechteck', 'browline', 'achteck'] },
    eckig:     { name: 'Eckig',      mouth: 326, pts: [[0, 56], [86, 60], [124, 86], [134, 140], [136, 214], [136, 290], [132, 338], [112, 372], [64, 390], [0, 393]],
                 text: 'Breiter Kiefer, klare Kanten. Runde und geschwungene Formen nehmen dem Gesicht etwas Strenge.',
                 avoid: 'Eher meiden: schmale, streng eckige Fassungen.', reco: ['rund', 'panto', 'cateye'] },
    herz:      { name: 'Herzförmig', mouth: 330, pts: [[0, 50], [80, 58], [124, 96], [138, 156], [136, 214], [124, 270], [100, 326], [64, 374], [26, 402], [0, 408]],
                 text: 'Die Stirn ist breiter als das Kinn. Leichte, runde Formen oder eine Betonung im unteren Rand gleichen das aus.',
                 avoid: 'Eher meiden: schwere, betonte Oberränder.', reco: ['panto', 'rund', 'achteck'] },
    laenglich: { name: 'Länglich',   mouth: 344, pts: [[0, 36], [64, 46], [104, 84], [120, 150], [122, 214], [118, 282], [104, 344], [74, 394], [34, 420], [0, 424]],
                 text: 'Ihr Gesicht ist deutlich länger als breit. Hohe Gläser und ein kräftiger Steg verkürzen optisch.',
                 avoid: 'Eher meiden: flache, schmale Rechtecke.', reco: ['panto', 'achteck', 'browline'] }
  };
  var FACE_ORDER = ['oval', 'rund', 'eckig', 'herz', 'laenglich'];
  var CX = 180, EYE_Y = 214, LENS_Y = 219;

  function fx(n) { return Math.round(n * 10) / 10; }
  function poly(pts) {
    return 'M' + pts.map(function (p) { return fx(p[0]) + ' ' + fx(p[1]); }).join('L') + 'Z';
  }
  // Glasform als Punktliste, lokal um (0,0); side = +1 rechtes Glas (außen = +x), −1 linkes Glas
  function lensPts(shape, a, b) {
    var pts = [], i, t, c, s, n, x, y;
    if (shape === 'achteck') {
      return [[a * 0.56, -b], [a, -b * 0.4], [a, b * 0.42], [a * 0.58, b], [-a * 0.58, b], [-a, b * 0.42], [-a, -b * 0.4], [-a * 0.56, -b]];
    }
    var N = 64;
    for (i = 0; i < N; i++) {
      t = (i / N) * Math.PI * 2;
      c = Math.cos(t); s = Math.sin(t);
      if (shape === 'rund') n = 2;
      else if (shape === 'rechteck') n = s < 0 ? 5 : 4.2;
      else if (shape === 'browline') n = s < 0 ? 3.4 : 2.4;
      else if (shape === 'cateye') n = s < 0 ? 3.2 : 2.2;
      else n = s < 0 ? 3.4 : 2.15; // panto
      x = a * Math.sign(c) * Math.pow(Math.abs(c), 2 / n);
      y = b * Math.sign(s) * Math.pow(Math.abs(s), 2 / n);
      if (shape === 'panto' || shape === 'browline') x *= 1 - 0.07 * Math.max(0, y / b);
      if (shape === 'rechteck') x *= 1 - 0.04 * Math.max(0, y / b);
      if (shape === 'cateye') {
        var ux = Math.max(0, x / a), uy = Math.max(0, -y / b), vx = Math.max(0, -x / a);
        y -= b * 0.58 * Math.pow(ux, 2.2) * Math.pow(uy, 0.6);
        x += a * 0.16 * Math.pow(ux, 2) * uy;
        y += b * 0.14 * vx * uy;
        x *= 1 - 0.1 * Math.max(0, y / b) * (x < 0 ? 1.4 : 1);
      }
      pts.push([x, y]);
    }
    return pts;
  }
  function place(pts, cx, cy, side) {
    return pts.map(function (p) { return [cx + p[0] * side, cy + p[1]]; });
  }

  /* Zeichnet eine Brille in die Gruppe g.
     o: { shape, color, W (Glasbreite), B (Steg), H, cx, cy, k (Strichfaktor), sun, mono (nur Kontur), headHalf (y → halbe Kopfbreite) } */
  function drawFrame(g, o) {
    clear(g);
    var m = MODELS[o.shape];
    var col = o.mono ? { paint: 'currentColor' } : COLORS[o.color];
    var paint = col.paint;
    var k = o.k || 1;
    var a = o.W / 2, b = o.H / 2;
    var E = (o.E != null ? o.E : 10);
    var rim = m.rim * k;
    var base = lensPts(o.shape, a, b);
    var lenses = [-1, 1].map(function (side) {
      var lx = o.cx + side * (o.B / 2 + a);
      return { side: side, lx: lx, pts: place(base, lx, o.cy, side) };
    });
    var metalPaint = o.mono ? 'currentColor' : (o.color === 'titan' ? paint : SILVER);

    // Bügel (Ansatz bis zum Kopf)
    if (o.headHalf && !o.mono) {
      lenses.forEach(function (L) {
        var hx = o.cx + L.side * (o.B / 2 + o.W + E * 0.7);
        var hy = o.cy - b * 0.42;
        var ty = hy + 9;
        var tx = o.cx + L.side * (o.headHalf(ty) + 2);
        if (Math.abs(tx - hx) < 2) return;
        el('path', { d: 'M' + fx(hx) + ' ' + fx(hy) + 'L' + fx(tx) + ' ' + fx(ty), fill: 'none', stroke: m.kind === 'acetate' ? paint : metalPaint, 'stroke-width': Math.max(2.4, rim * 0.7), 'stroke-linecap': 'round' }, g);
      });
    }
    // Gläser
    lenses.forEach(function (L) {
      el('path', { d: poly(L.pts), fill: o.mono ? 'none' : (o.sun ? 'url(#grad-sun)' : 'rgba(226,234,246,.38)') }, g);
      if (!o.mono) {
        var gx = L.lx - L.side * a * 0.18;
        el('path', { d: 'M' + fx(gx - a * 0.42) + ' ' + fx(o.cy + b * 0.05) + 'L' + fx(gx - a * 0.05) + ' ' + fx(o.cy - b * 0.5), stroke: '#fff', 'stroke-opacity': o.sun ? 0.35 : 0.85, 'stroke-width': 2.4 * k, 'stroke-linecap': 'round', fill: 'none' }, g);
      }
    });
    // Backen (Verbindung Glas → Scharnier)
    lenses.forEach(function (L) {
      var y = o.cy - b * 0.4;
      var x1 = L.lx + L.side * a * 0.9, x2 = o.cx + L.side * (o.B / 2 + o.W + E * 0.8);
      var sw = m.kind === 'acetate' ? rim * 1.15 : Math.max(1.6, rim);
      el('path', { d: 'M' + fx(x1) + ' ' + fx(y + 1) + 'Q' + fx((x1 + x2) / 2) + ' ' + fx(y - 2) + ' ' + fx(x2) + ' ' + fx(y - 1), fill: 'none', stroke: m.kind === 'browline' ? paint : (m.kind === 'metal' ? metalPaint : paint), 'stroke-width': m.kind === 'browline' ? rim * 3.2 : sw, 'stroke-linecap': 'round' }, g);
    });
    // Ränder
    lenses.forEach(function (L) {
      if (m.kind === 'browline') {
        el('path', { d: poly(L.pts), fill: 'none', stroke: metalPaint, 'stroke-width': Math.max(1.2, 1.6 * k), 'stroke-linejoin': 'round' }, g);
        var top = L.pts.filter(function (p) { return p[1] < o.cy - b * 0.05; });
        top.sort(function (p, q) { return p[0] - q[0]; });
        el('path', { d: 'M' + top.map(function (p) { return fx(p[0]) + ' ' + fx(p[1] - 1.5 * k); }).join('L'), fill: 'none', stroke: paint, 'stroke-width': 8 * k, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
      } else {
        el('path', { d: poly(L.pts), fill: 'none', stroke: m.kind === 'metal' ? (o.mono ? 'currentColor' : paint) : paint, 'stroke-width': rim, 'stroke-linejoin': 'round' }, g);
        if (col.inner && m.kind === 'acetate') {
          el('path', { d: poly(L.pts), fill: 'none', stroke: col.inner, 'stroke-width': 0.9 * k, 'stroke-opacity': 0.7 }, g);
        }
      }
    });
    // Steg
    var bxL = o.cx - o.B / 2 - (m.kind === 'acetate' ? 3 : 1) * k, bxR = o.cx + o.B / 2 + (m.kind === 'acetate' ? 3 : 1) * k;
    if (m.kind === 'acetate') {
      el('path', { d: 'M' + fx(bxL) + ' ' + fx(o.cy - b * 0.36) + 'Q' + o.cx + ' ' + fx(o.cy - b * 0.66) + ' ' + fx(bxR) + ' ' + fx(o.cy - b * 0.36), fill: 'none', stroke: paint, 'stroke-width': rim * 1.05, 'stroke-linecap': 'round' }, g);
    } else {
      var bp = m.kind === 'browline' ? metalPaint : (o.mono ? 'currentColor' : paint);
      el('path', { d: 'M' + fx(bxL) + ' ' + fx(o.cy - b * 0.46) + 'Q' + o.cx + ' ' + fx(o.cy - b * 0.78) + ' ' + fx(bxR) + ' ' + fx(o.cy - b * 0.46), fill: 'none', stroke: bp, 'stroke-width': Math.max(1.4, 2.2 * k), 'stroke-linecap': 'round' }, g);
      if (m.kind === 'metal') {
        var tl = o.cx - o.B / 2 - a * 0.5, tr = o.cx + o.B / 2 + a * 0.5, ty = o.cy - b * 0.97;
        el('path', { d: 'M' + fx(tl) + ' ' + fx(ty) + 'Q' + o.cx + ' ' + fx(ty - 4 * k) + ' ' + fx(tr) + ' ' + fx(ty), fill: 'none', stroke: bp, 'stroke-width': Math.max(1.2, 1.8 * k), 'stroke-linecap': 'round' }, g);
      }
      if (!o.mono) {
        [-1, 1].forEach(function (s) {
          el('ellipse', { cx: fx(o.cx + s * (o.B / 2 + 4 * k)), cy: fx(o.cy + b * 0.02), rx: 2.6 * k, ry: 5 * k, fill: 'rgba(255,255,255,.7)', stroke: SILVER, 'stroke-width': 0.8 }, g);
        });
      }
    }
    var outer = o.B / 2 + o.W + E;
    return { left: o.cx - outer, right: o.cx + outer, top: o.cy - b, bottom: o.cy + b };
  }

  // Kopfsilhouette
  function facePts(pts) {
    var right = pts.map(function (p) { return [CX + p[0], p[1]]; });
    var left = pts.slice(1, -1).reverse().map(function (p) { return [CX - p[0], p[1]]; });
    return right.concat(left);
  }
  function crPath(pts) {
    var n = pts.length, d = 'M' + fx(pts[0][0]) + ' ' + fx(pts[0][1]);
    for (var i = 0; i < n; i++) {
      var p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      d += 'C' + fx(p1[0] + (p2[0] - p0[0]) / 6) + ' ' + fx(p1[1] + (p2[1] - p0[1]) / 6) + ' ' +
        fx(p2[0] - (p3[0] - p1[0]) / 6) + ' ' + fx(p2[1] - (p3[1] - p1[1]) / 6) + ' ' + fx(p2[0]) + ' ' + fx(p2[1]);
    }
    return d + 'Z';
  }
  function halfAt(pts, y) {
    for (var i = 0; i < pts.length - 1; i++) {
      var p = pts[i], q = pts[i + 1];
      if (y >= p[1] && y <= q[1]) return lerp(p[0], q[0], (y - p[1]) / Math.max(1, q[1] - p[1]));
    }
    return y < pts[0][1] ? 0 : pts[pts.length - 1][0];
  }
  function drawFace(parts, pts, mouthY) {
    // parts: { head (path), ears (g|null), neck (g|null), feat (g), featClass }
    parts.head.setAttribute('d', crPath(facePts(pts)));
    var bottom = pts[pts.length - 1][1];
    if (parts.ears) {
      clear(parts.ears);
      var hw = halfAt(pts, 200);
      [-1, 1].forEach(function (s) {
        var x0 = CX + s * (hw - 3);
        el('path', { d: 'M' + fx(x0) + ' 194C' + fx(x0 + s * 17) + ' 182 ' + fx(x0 + s * 24) + ' 236 ' + fx(x0 + s * 2) + ' 266' }, parts.ears);
      });
    }
    if (parts.neck) {
      clear(parts.neck);
      var ys = bottom - 60;
      [-1, 1].forEach(function (s) {
        el('path', { d: 'M' + fx(CX + s * 54) + ' ' + fx(ys) + 'C' + fx(CX + s * 55) + ' ' + fx(bottom + 20) + ' ' + fx(CX + s * 60) + ' 446 ' + fx(CX + s * 84) + ' 470' }, parts.neck);
      });
    }
    clear(parts.feat);
    function f(d) { var a = { d: d }; if (parts.featClass) a['class'] = parts.featClass; return el('path', a, parts.feat); }
    [-1, 1].forEach(function (s) {
      var ex = CX + s * 62;
      f('M' + (ex - 17) + ' ' + EYE_Y + 'Q' + ex + ' ' + (EYE_Y - 12) + ' ' + (ex + 17) + ' ' + EYE_Y + 'Q' + ex + ' ' + (EYE_Y + 10) + ' ' + (ex - 17) + ' ' + EYE_Y + 'Z');
      var ir = el('circle', { cx: ex, cy: EYE_Y - 0.5, r: 5.2, 'class': 'iris' }, parts.feat);
      if (parts.featClass) { ir.setAttribute('fill', 'currentColor'); ir.setAttribute('stroke', 'none'); }
      f('M' + (CX + s * 40) + ' ' + (EYE_Y - 22) + 'Q' + (CX + s * 62) + ' ' + (EYE_Y - 33) + ' ' + (CX + s * 84) + ' ' + (EYE_Y - 24));
    });
    var ny = mouthY - 44;
    f('M' + (CX - 3) + ' ' + (EYE_Y + 10) + 'C' + (CX - 5) + ' ' + fx(ny - 22) + ' ' + (CX - 15) + ' ' + fx(ny - 6) + ' ' + (CX - 12) + ' ' + fx(ny + 2) + 'C' + (CX - 6) + ' ' + fx(ny + 8) + ' ' + (CX + 6) + ' ' + fx(ny + 8) + ' ' + (CX + 13) + ' ' + fx(ny + 2));
    f('M' + (CX - 26) + ' ' + fx(mouthY) + 'Q' + CX + ' ' + fx(mouthY + 10) + ' ' + (CX + 26) + ' ' + fx(mouthY));
  }
  function frameGeom(shape, widthMM) {
    var m = MODELS[shape], P = TRYON.PX_PER_MM;
    var W = widthMM * P;
    return { W: W, B: m.bridge * P, H: W * m.ratio, E: TRYON.ENDPIECE_MM * P, total: 2 * widthMM + m.bridge + 2 * TRYON.ENDPIECE_MM };
  }
  function faceWidthMM(face) { return Math.round(2 * halfAt(FACES[face].pts, EYE_Y) / TRYON.PX_PER_MM); }
  function idealWidth(face, shape) {
    return clamp(Math.round((faceWidthMM(face) - MODELS[shape].bridge - 2 * TRYON.ENDPIECE_MM) / 2), TRYON.WIDTH_MIN, TRYON.WIDTH_MAX);
  }
  function miniFrame(svg, shape, color, opts) {
    opts = opts || {};
    var g = el('g', null, svg);
    var vbW = opts.w || 120, vbH = opts.h || 44;
    var W = opts.W || 40, B = opts.B || 11;
    drawFrame(g, { shape: shape, color: color, W: W, B: B, H: W * MODELS[shape].ratio, E: opts.E || 3, cx: vbW / 2, cy: vbH / 2 + 1, k: opts.k || 0.5, mono: !!opts.mono });
    return g;
  }

  /* ------------------------------------------------------------------
     Brillen-Anprobe
     ------------------------------------------------------------------ */
  var tryon = null;
  later('tryon', function () {
    var root = qs('#anprobe');
    if (!root) return;
    var svg = qs('.to-svg', root);
    var parts = { head: qs('.to-head', svg), ears: qs('.to-ears', svg), neck: qs('.to-neck', svg), feat: qs('.to-features', svg) };
    var gFrame = qs('.to-frame', svg);
    var tmLine = qs('.tm-line', svg), tmText = qs('.tm-text', svg);
    var range = qs('#to-width', root);
    var out = qs('.to-width-out', root), totalOut = qs('.to-total', root);
    var nameOut = qs('.to-model-name', root), sizeSr = qs('.to-size-sr', root), sizeVis = qs('.to-size-vis', root);
    var fitP = qs('.to-fit', root), fitT = qs('.to-fit-t', root), recoP = qs('.to-reco', root);
    var sun = qs('.to-sun', root);
    var titleEl = qs('#to-desc', root);
    var state = { shape: 'panto', color: 'schildpatt', width: TRYON.WIDTH_DEFAULT, face: 'oval', sun: false };
    var curPts = FACES.oval.pts.map(function (p) { return p.slice(); });
    var curMouth = FACES.oval.mouth;

    // Modelle
    var modelsBox = qs('.to-models', root);
    MODEL_ORDER.forEach(function (key, i) {
      var m = MODELS[key];
      var b = h('button', 'model', null, modelsBox);
      b.type = 'button';
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', key === state.shape ? 'true' : 'false');
      b.tabIndex = key === state.shape ? 0 : -1;
      b.dataset.shape = key;
      var s = el('svg', { viewBox: '0 0 120 44', 'aria-hidden': 'true', focusable: 'false' }, b);
      miniFrame(s, key, 'schwarz', { mono: true, k: 0.42 });
      h('span', null, m.name, b);
      h('small', null, '„' + m.model + '“', b);
    });
    function setShape(key, focus) {
      state.shape = key;
      qsa('.model', modelsBox).forEach(function (b) {
        var on = b.dataset.shape === key;
        b.setAttribute('aria-checked', on ? 'true' : 'false');
        b.tabIndex = on ? 0 : -1;
        if (on && focus) b.focus();
      });
      swap();
    }
    modelsBox.addEventListener('click', function (e) {
      var b = e.target.closest('.model');
      if (b) setShape(b.dataset.shape);
    });
    modelsBox.addEventListener('keydown', function (e) {
      var keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
      var i = MODEL_ORDER.indexOf(state.shape), j = null;
      if (keys[e.key]) j = (i + keys[e.key] + MODEL_ORDER.length) % MODEL_ORDER.length;
      else if (e.key === 'Home') j = 0;
      else if (e.key === 'End') j = MODEL_ORDER.length - 1;
      if (j === null) return;
      e.preventDefault();
      setShape(MODEL_ORDER[j], true);
    });

    // Farben
    var colorsBox = qs('.to-colors', root);
    COLOR_ORDER.forEach(function (key) {
      var lab = h('label', 'swatch', null, colorsBox);
      var inp = h('input', null, null, lab);
      inp.type = 'radio'; inp.name = 'to-color'; inp.value = key;
      inp.checked = key === state.color;
      var dot = h('span', 'sw-dot', null, lab);
      dot.setAttribute('data-c', key);
      dot.setAttribute('aria-hidden', 'true');
      if (COLORS[key].paint.charAt(0) === '#') dot.style.setProperty('--c', COLORS[key].paint);
      lab.appendChild(document.createTextNode(COLORS[key].name));
    });
    colorsBox.addEventListener('change', function (e) {
      if (e.target.name === 'to-color') { state.color = e.target.value; swap(); }
    });

    // Gesichtsformen
    var facesBox = qs('.to-faces', root);
    FACE_ORDER.forEach(function (key) {
      var lab = h('label', 'chip', null, facesBox);
      var inp = h('input', null, null, lab);
      inp.type = 'radio'; inp.name = 'to-face'; inp.value = key;
      inp.checked = key === state.face;
      h('span', null, FACES[key].name, lab);
    });
    facesBox.addEventListener('change', function (e) {
      if (e.target.name === 'to-face') setFace(e.target.value);
    });

    range.min = TRYON.WIDTH_MIN; range.max = TRYON.WIDTH_MAX;
    range.addEventListener('input', function () { state.width = +range.value; render(); });
    sun.addEventListener('change', function () { state.sun = sun.checked; swap(); });

    var morphRaf = 0;
    function setFace(key) {
      state.face = key;
      var from = curPts.map(function (p) { return p.slice(); }), to = FACES[key].pts;
      var m0 = curMouth, m1 = FACES[key].mouth;
      cancelAnimationFrame(morphRaf);
      if (reduced) { curPts = to.map(function (p) { return p.slice(); }); curMouth = m1; render(); return; }
      var t0 = performance.now(), dur = 340;
      (function step(now) {
        var t = clamp((now - t0) / dur, 0, 1);
        var e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; // ease-in-out
        curPts = from.map(function (p, i) { return [lerp(p[0], to[i][0], e), lerp(p[1], to[i][1], e)]; });
        curMouth = lerp(m0, m1, e);
        render();
        if (t < 1) morphRaf = requestAnimationFrame(step);
      })(t0);
    }

    var swapT = 0;
    function swap() {
      if (reduced) { render(); return; }
      gFrame.classList.add('is-swapping');
      clearTimeout(swapT);
      swapT = setTimeout(function () { render(); gFrame.classList.remove('is-swapping'); }, 150);
    }

    function render() {
      var m = MODELS[state.shape];
      var gm = frameGeom(state.shape, state.width);
      drawFace(parts, curPts, curMouth);
      var box = drawFrame(gFrame, { shape: state.shape, color: state.color, W: gm.W, B: gm.B, H: gm.H, E: gm.E, cx: CX, cy: LENS_Y, k: 1, sun: state.sun, headHalf: function (y) { return halfAt(curPts, y); } });
      var y = box.top - 22;
      tmLine.setAttribute('d', 'M' + fx(box.left) + ' ' + fx(y - 5) + 'v10M' + fx(box.left) + ' ' + fx(y) + 'H' + fx(box.right) + 'M' + fx(box.right) + ' ' + fx(y - 5) + 'v10');
      tmText.setAttribute('y', fx(y - 8));
      tmText.textContent = gm.total + ' mm';
      // Ausgabe
      out.textContent = state.width + ' mm';
      range.style.setProperty('--p', ((state.width - TRYON.WIDTH_MIN) / (TRYON.WIDTH_MAX - TRYON.WIDTH_MIN) * 100) + '%');
      range.setAttribute('aria-valuetext', state.width + ' Millimeter Glasbreite');
      totalOut.textContent = gm.total;
      nameOut.textContent = 'Modell „' + m.model + '“ · ' + COLORS[state.color].name + (state.sun ? ' · Sonnenbrille' : '');
      sizeSr.textContent = 'Glasbreite ' + state.width + ', Steg ' + m.bridge + ', Bügel ' + m.temple + ' Millimeter';
      clear(sizeVis);
      sizeVis.appendChild(document.createTextNode(String(state.width)));
      h('i', 'sq', null, sizeVis);
      sizeVis.appendChild(document.createTextNode(m.bridge + ' – ' + m.temple));
      var diff = gm.total - faceWidthMM(state.face);
      var ideal = idealWidth(state.face, state.shape);
      var fit = diff < -TRYON.FIT_TOLERANCE_MM ? 'schmal' : diff > TRYON.FIT_TOLERANCE_MM ? 'breit' : 'passt';
      fitP.setAttribute('data-fit', fit);
      fitT.textContent = fit === 'passt' ? 'Passt: Die Fassung schließt etwa mit dem Gesicht ab.'
        : fit === 'schmal' ? 'Wirkt schmal: Die Fassung endet vor den Schläfen – probieren Sie ' + ideal + ' mm.'
        : 'Wirkt breit: Die Fassung steht seitlich über – probieren Sie ' + ideal + ' mm.';
      if (titleEl) titleEl.textContent = 'Gesichts-Silhouette (' + FACES[state.face].name + ') mit ' + m.name + ' „' + m.model + '“ in ' + COLORS[state.color].name + ', Glasbreite ' + state.width + ' mm';
    }

    // Auswahl in die Terminanfrage übernehmen
    var cta = qs('[data-from-tryon]', root);
    var lastAuto = '';
    if (cta) cta.addEventListener('click', function () {
      var m = MODELS[state.shape];
      var msg = qs('#bf-msg');
      var text = 'Aus der Anprobe: ' + m.name + ' „' + m.model + '“ in ' + COLORS[state.color].name + ', ' + state.width + '□' + m.bridge + ' ' + m.temple + (state.sun ? ', als Sonnenbrille' : '') + ' (Gesichtsform ' + FACES[state.face].name + ').';
      if (msg && (!msg.value.trim() || msg.value === lastAuto)) { msg.value = text; lastAuto = text; }
    });

    render();
    tryon = {
      apply: function (o) {
        if (o.face && o.face !== state.face) {
          var r = qs('input[name="to-face"][value="' + o.face + '"]', facesBox);
          if (r) r.checked = true;
          state.face = o.face; curPts = FACES[o.face].pts.map(function (p) { return p.slice(); }); curMouth = FACES[o.face].mouth;
        }
        if (o.color) {
          state.color = o.color;
          var c = qs('input[name="to-color"][value="' + o.color + '"]', colorsBox);
          if (c) c.checked = true;
        }
        if (o.shape) {
          state.width = idealWidth(state.face, o.shape);
          range.value = state.width;
          setShape(o.shape);
        } else render();
        if (o.reco) { recoP.textContent = o.reco; recoP.hidden = false; }
      }
    };
  });

  /* ------------------------------------------------------------------
     Team: Monogramme mit Brille
     ------------------------------------------------------------------ */
  later('team', function () {
    qsa('.mono[data-frame]').forEach(function (m) {
      var shape = m.getAttribute('data-frame'), color = m.getAttribute('data-color') || 'schwarz';
      if (!MODELS[shape]) return;
      var s = el('svg', { viewBox: '0 0 100 40', 'aria-hidden': 'true', focusable: 'false' });
      miniFrame(s, shape, COLORS[color] ? color : 'schwarz', { w: 100, h: 40, W: 34, B: 9, E: 2, k: 0.42 });
      m.insertBefore(s, m.firstChild);
      m.classList.add('has-glasses');
    });
  });

  /* ------------------------------------------------------------------
     Gesichtsform-Finder (Quiz)
     ------------------------------------------------------------------ */
  later('finder', function () {
    var quiz = qs('[data-quiz]');
    if (!quiz) return;
    var form = qs('.quiz-form', quiz);
    var steps = qsa('.q', quiz);
    var back = qs('.quiz-back', quiz), next = qs('.quiz-next', quiz);
    var fill = qs('.quiz-bar-fill', quiz), count = qs('.quiz-count', quiz);
    var result = qs('.quiz-result', quiz);
    var cur = 0, viaPointer = false, advT = 0, lastResult = null;

    var SCORE = [
      { stirn: { herz: 3, oval: 0.5 }, wangen: { oval: 2, rund: 1, herz: 0.5 }, kiefer: { eckig: 3 }, gleich: { rund: 1.5, eckig: 1, laenglich: 1 } },
      { spitz: { herz: 2, oval: 1 }, rund: { rund: 2, oval: 1.5 }, kantig: { eckig: 2, laenglich: 0.5 } },
      { lang: { laenglich: 4 }, etwas: { oval: 2, herz: 1 }, gleich: { rund: 2, eckig: 1.5 } }
    ];
    var STYLE_PREF = { dezent: ['achteck', 'rund', 'panto'], markant: ['browline', 'rechteck', 'cateye'], farbig: ['cateye', 'panto', 'rund'] };

    function answer(i) { var r = qs('input[name="q' + i + '"]:checked', form); return r ? r.value : null; }
    function setCount(text) {
      clear(count);
      if (text) { count.textContent = text; return; }
      h('span', 'qc-now', 'Frage ' + (cur + 1), count);
      count.appendChild(document.createTextNode(' von ' + steps.length));
    }
    function show(i, focus) {
      cur = i;
      steps.forEach(function (s, j) { s.classList.toggle('is-active', j === i); });
      back.disabled = i === 0;
      next.disabled = !answer(i);
      next.textContent = i === steps.length - 1 ? 'Ergebnis zeigen' : 'Weiter';
      fill.style.transform = 'scaleX(' + ((i + 1) / (steps.length + 1)).toFixed(3) + ')';
      setCount();
      if (focus) {
        var r = qs('input:checked', steps[i]) || qs('input', steps[i]);
        focusEl(r);
      }
    }
    function compute() {
      var sc = {};
      FACE_ORDER.forEach(function (f) { sc[f] = 0; });
      for (var i = 0; i < 3; i++) {
        var a = answer(i), w = a && SCORE[i][a];
        if (w) Object.keys(w).forEach(function (f) { sc[f] += w[f]; });
      }
      var best = FACE_ORDER[0];
      FACE_ORDER.forEach(function (f) { if (sc[f] > sc[best]) best = f; });
      var style = answer(3) || 'dezent';
      var reco = FACES[best].reco.slice();
      var pref = STYLE_PREF[style];
      for (var p = 0; p < pref.length; p++) {
        var k = reco.indexOf(pref[p]);
        if (k > 0) { reco.unshift(reco.splice(k, 1)[0]); break; }
        if (k === 0) break;
      }
      var top = reco[0];
      var color = style === 'markant' ? 'schwarz' : style === 'farbig' ? (top === 'cateye' || top === 'rund' ? 'kobalt' : 'schildpatt') : (MODELS[top].kind === 'acetate' ? 'kristall' : 'titan');
      return { face: best, reco: reco, color: color };
    }
    function showResult() {
      var r = compute();
      lastResult = r;
      var F = FACES[r.face];
      form.hidden = true;
      result.hidden = false;
      fill.style.transform = 'scaleX(1)';
      setCount('Ihr Ergebnis');
      qs('.qr-shape', result).textContent = F.name;
      qs('.qr-text', result).textContent = F.text;
      qs('.qr-avoid', result).textContent = F.avoid;
      // Gesicht mit Top-Empfehlung
      var svg = qs('.qr-face-svg', result);
      clear(svg);
      var head = el('path', { 'class': 'f-head' }, svg);
      var feat = el('g', null, svg);
      drawFace({ head: head, ears: null, neck: null, feat: feat, featClass: 'f-feat' }, F.pts, F.mouth);
      var gm = frameGeom(r.reco[0], idealWidth(r.face, r.reco[0]));
      drawFrame(el('g', null, svg), { shape: r.reco[0], color: r.color, W: gm.W, B: gm.B, H: gm.H, E: gm.E, cx: CX, cy: LENS_Y, k: 1.2, headHalf: function (y) { return halfAt(F.pts, y); } });
      // Liste
      var list = qs('.qr-frames', result);
      clear(list);
      r.reco.forEach(function (key, i) {
        var li = h('li', 'qr-frame' + (i === 0 ? ' is-top' : ''), null, list);
        var s = el('svg', { viewBox: '0 0 120 44', 'aria-hidden': 'true', focusable: 'false' }, li);
        miniFrame(s, key, r.color, { k: 0.45 });
        h('strong', null, MODELS[key].name + (i === 0 ? ' · Favorit' : ''), li);
        h('span', null, MODELS[key].why, li);
      });
      if (anim) {
        gsap.fromTo(qsa('.qr-face, .qr-body > *', result), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', stagger: 0.05, clearProps: 'transform,opacity' });
      }
      focusEl(result);
    }
    function go(dir) {
      clearTimeout(advT);
      if (dir > 0 && !answer(cur)) return;
      if (dir > 0 && cur === steps.length - 1) { showResult(); return; }
      show(clamp(cur + dir, 0, steps.length - 1), true);
    }
    form.addEventListener('pointerdown', function (e) { if (e.target.closest('.opt')) viaPointer = true; });
    form.addEventListener('keydown', function () { viaPointer = false; });
    form.addEventListener('change', function () {
      next.disabled = !answer(cur);
      if (viaPointer) {
        clearTimeout(advT);
        advT = setTimeout(function () { go(1); }, reduced ? 120 : 340);
      }
    });
    form.addEventListener('submit', function (e) { e.preventDefault(); go(1); });
    next.addEventListener('click', function () { go(1); });
    back.addEventListener('click', function () { go(-1); });
    qs('.qr-restart', result).addEventListener('click', function () {
      form.reset();
      result.hidden = true;
      form.hidden = false;
      show(0, true);
    });
    qs('.qr-try', result).addEventListener('click', function () {
      if (!lastResult || !tryon) return;
      var names = lastResult.reco.map(function (k) { return MODELS[k].name; }).join(', ');
      tryon.apply({ face: lastResult.face, shape: lastResult.reco[0], color: lastResult.color, reco: 'Aus dem Finder: Gesichtsform „' + FACES[lastResult.face].name + '“ – empfohlen: ' + names + '.' });
      var t = qs('#anprobe');
      scrollToEl(t, function () { focusEl(qs('.model[aria-checked="true"]')); });
    });
    show(0, false);
  });

  /* ------------------------------------------------------------------
     Glas-Explorer
     ------------------------------------------------------------------ */
  later('glass', function () {
    var root = qs('.gx');
    if (!root) return;
    var tabs = qsa('.gx-tab', root);
    var panels = qsa('.gx-panel', root);
    var svg = qs('.gx-svg', root);
    var blurred = qs('.gx-blurred', svg);
    var nearR = qs('.gm-ein-near', svg), farR = qs('.gm-ein-far', svg);
    var gl = qs('.gm-gleit-l', svg), gr = qs('.gm-gleit-r', svg);
    var glow = qs('.gx-glow', svg), coat = qs('.gx-coat', svg), glare = qs('.gx-glare', svg), tint = qs('.gx-tint', svg), warm = qs('.gx-warm', svg);
    var zones = {};
    qsa('.gx-zones li', root).forEach(function (li) { zones[li.getAttribute('data-zone')] = li; });
    var rows = qsa('.cmp-table tr[data-row]');
    var st = { type: 'ein', ein: 'fern', gleit: 1, blau: 'mit', cat: 2, pol: true };
    farR.setAttribute('height', '400');

    function zone(name, sharp, text) {
      var li = zones[name];
      if (!li) return;
      li.setAttribute('data-state', sharp ? 'sharp' : 'blur');
      qs('.z-state', li).textContent = text || (sharp ? 'scharf' : 'unscharf');
    }
    function op(node, v) { node.style.opacity = v; }
    function render() {
      var t = st.type;
      // Unschärfe-Masken
      if (t === 'ein') {
        blurred.setAttribute('mask', 'url(#gx-m-ein)');
        op(blurred, 1);
        var lese = st.ein === 'lese';
        nearR.style.transform = lese ? 'translateY(220px)' : 'translateY(0px)';
        farR.style.transform = lese ? 'translateY(0px)' : 'translateY(-480px)';
        zone('far', !lese); zone('mid', !lese); zone('near', lese);
      } else if (t === 'gleit') {
        blurred.setAttribute('mask', 'url(#gx-m-gleit)');
        op(blurred, 1);
        var shift = [34, 0, -46][st.gleit];
        gl.style.transform = 'translateX(' + shift + 'px)';
        gr.style.transform = 'translateX(' + (-shift) + 'px)';
        zone('far', true, 'scharf · oben'); zone('mid', true, 'scharf · Mitte'); zone('near', true, 'scharf · unten');
      } else {
        op(blurred, 0);
        var tx = t === 'sonne' && st.cat > 0 ? 'scharf · getönt' : 'scharf';
        zone('far', true, tx); zone('mid', true, tx); zone('near', true, tx);
      }
      // Licht & Beschichtungen
      op(glow, t === 'blau' ? (st.blau === 'mit' ? 0.12 : 0.75) : 0.3);
      op(coat, t === 'blau' && st.blau === 'mit' ? 1 : 0);
      op(warm, t === 'blau' && st.blau === 'mit' ? 0.07 : 0);
      op(glare, t === 'sonne' ? (st.pol ? 0.08 : 1) : 0.55);
      op(tint, t === 'sonne' ? GLASS.SUN_TINT[st.cat] : 0);
      rows.forEach(function (r) { r.classList.toggle('is-active', r.getAttribute('data-row') === t); });
    }
    function select(tab, focus) {
      var type = tab.getAttribute('data-type');
      if (type === st.type && !focus) return;
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
      });
      panels.forEach(function (p) {
        var on = p.id === tab.getAttribute('aria-controls');
        if (on && p.hidden) {
          p.hidden = false;
          if (anim) { p.classList.add('is-entering'); setTimeout(function () { p.classList.remove('is-entering'); }, 700); }
        } else if (!on) p.hidden = true;
      });
      if (focus) tab.focus();
      st.type = type;
      render();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t); });
      t.addEventListener('keydown', function (e) {
        var j = null;
        if (e.key === 'ArrowRight') j = (i + 1) % tabs.length;
        else if (e.key === 'ArrowLeft') j = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') j = 0;
        else if (e.key === 'End') j = tabs.length - 1;
        if (j === null) return;
        e.preventDefault();
        select(tabs[j], true);
      });
    });
    // Einstärke: Fern/Lese
    qsa('[data-ein]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        st.ein = b.getAttribute('data-ein');
        qsa('[data-ein]', root).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        render();
      });
    });
    // Blaufilter
    qsa('[data-blau]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        st.blau = b.getAttribute('data-blau');
        qsa('[data-blau]', root).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        render();
      });
    });
    // Gleitsicht-Klasse
    var gr0 = qs('#gx-gleit'), grOut = qs('.gx-gleit-out'), grPrice = qs('.gx-gleit-price');
    function gleitUi() {
      var c = GLASS.GLEIT_CLASSES[st.gleit];
      grOut.textContent = c.name;
      gr0.setAttribute('aria-valuetext', c.name + ', ab ' + c.price + ' Euro');
      grPrice.textContent = 'ab ' + c.price + ' € pro Paar';
      gr0.style.setProperty('--p', (st.gleit / 2 * 100) + '%');
    }
    gr0.addEventListener('input', function () { st.gleit = +gr0.value; gleitUi(); render(); });
    gleitUi();
    // Sonnenschutz
    var cat = qs('#gx-cat'), catOut = qs('.gx-cat-out'), catDesc = qs('#gx-cat-desc'), pol = qs('.gx-pol');
    function catUi() {
      catOut.textContent = String(st.cat);
      catDesc.textContent = GLASS.SUN_TEXT[st.cat];
      cat.setAttribute('aria-valuetext', 'Kategorie ' + st.cat);
      cat.style.setProperty('--p', (st.cat / 4 * 100) + '%');
    }
    cat.addEventListener('input', function () { st.cat = +cat.value; catUi(); render(); });
    pol.addEventListener('change', function () { st.pol = pol.checked; render(); });
    catUi();
    render();
  });

  /* ------------------------------------------------------------------
     Sehtafel-Spiel (Landolt-Ringe) – Spielerei, kein Sehtest
     ------------------------------------------------------------------ */
  later('eyegame', function () {
    var card = qs('[data-eyegame]');
    if (!card) return;
    var ring = qs('.eg-ring', card), ringP = qs('.eg-ring-p', card);
    var levelV = qs('.eg-level-v', card), scoreV = qs('.eg-score-v', card);
    var dotsBox = qs('.eg-dots', card), mark = qs('.eg-mark', card);
    var start = qs('.eg-start', card), end = qs('.eg-end', card);
    var startBtn = qs('.eg-start-btn', card), again = qs('.eg-again', card);
    var btns = qsa('.eg-btn', card), status = qs('.eg-status', card);
    var L = EYEGAME.LEVELS;
    var g = { running: false, level: 0, tries: 0, score: 0, dir: 1, best: -1, lock: false };
    // Landolt-Ring mit Lücke nach rechts (Durchmesser 100, Strich und Lücke je 1/5)
    ringP.setAttribute('d', 'M48.99 10A50 50 0 1 1 48.99 -10L28.28 -10A30 30 0 1 0 28.28 10Z');
    var dots = L.map(function () { return h('li', null, null, dotsBox); });
    function label(v) { return fmtDe(v, v < 1 && Math.round(v * 100) % 10 !== 0 ? 2 : 1); }
    function size(i) { var px = Math.round(EYEGAME.RING_PX_AT_1 / L[i] * 10) / 10; ring.style.width = px + 'px'; ring.style.height = px + 'px'; }
    function newDir() {
      var d;
      do { d = Math.floor(Math.random() * 4); } while (d === g.dir && Math.random() < 0.7);
      g.dir = d;
      ringP.setAttribute('transform', 'rotate(' + ((d - 1) * 90) + ')');
    }
    function paint() {
      levelV.textContent = label(L[g.level]);
      scoreV.textContent = String(g.score);
      dots.forEach(function (d, i) {
        d.className = i <= g.best ? 'is-done' : '';
        if (g.running && i === g.level) d.classList.add('is-now');
      });
    }
    function setBtns(on) { btns.forEach(function (b) { b.disabled = !on; }); }
    function begin() {
      g.running = true; g.level = 0; g.tries = 0; g.score = 0; g.best = -1; g.lock = false;
      start.hidden = true; end.hidden = true;
      card.classList.add('is-active');
      setBtns(true);
      size(0); newDir(); paint();
      status.textContent = 'Stufe ' + label(L[0]) + ': Wohin zeigt die Lücke? Pfeiltasten oder Knöpfe.';
      focusEl(card);
    }
    function finish(all) {
      g.running = false;
      setBtns(false);
      card.classList.remove('is-active');
      var v = g.best >= 0 ? label(L[g.best]) : 'unter ' + label(L[0]);
      qs('.eg-end-v', end).textContent = g.best >= 0 ? label(L[g.best]) : '–';
      qs('.eg-end-t', end).textContent = all
        ? 'Alle Stufen geschafft – auf diesem Bildschirm, in diesem Abstand. Kein Visus, keine Diagnose.'
        : 'Auf diesem Bildschirm, in diesem Abstand. Kein Visus, keine Diagnose.';
      end.hidden = false;
      paint();
      status.textContent = 'Spiel beendet. Ihre Spiel-Stufe: ' + v + '. Den echten Sehtest machen wir in 30 Minuten.';
      focusEl(again);
    }
    function flash(btn, ok) {
      mark.className = 'eg-mark ' + (ok ? 'ok' : 'no');
      mark.textContent = ok ? 'Richtig' : 'Daneben';
      if (btn) {
        btn.classList.add(ok ? 'flash-ok' : 'flash-no');
        setTimeout(function () { btn.classList.remove('flash-ok', 'flash-no'); }, 220);
      }
      clearTimeout(flash.t);
      flash.t = setTimeout(function () { mark.className = 'eg-mark'; }, 700);
    }
    function answerDir(d, btn) {
      if (!g.running || g.lock) return;
      var ok = d === g.dir;
      flash(btn || qs('.eg-btn[data-dir="' + d + '"]', card), ok);
      if (ok) {
        g.score++; g.best = g.level; g.tries = 0;
        if (g.level === L.length - 1) { finish(true); return; }
        g.level++;
        status.textContent = 'Richtig. Stufe ' + label(L[g.level]) + '.';
      } else {
        g.tries++;
        if (g.tries >= 2) { finish(false); return; }
        status.textContent = (d < 0 ? 'Übersprungen.' : 'Daneben.') + ' Noch ein Versuch auf Stufe ' + label(L[g.level]) + '.';
      }
      g.lock = true;
      setTimeout(function () { g.lock = false; size(g.level); newDir(); paint(); }, 160);
    }
    btns.forEach(function (b) { b.addEventListener('click', function () { answerDir(+b.getAttribute('data-dir'), b); }); });
    card.addEventListener('keydown', function (e) {
      var map = { ArrowUp: 0, ArrowRight: 1, ArrowDown: 2, ArrowLeft: 3 };
      if (!g.running || !(e.key in map)) return;
      e.preventDefault();
      answerDir(map[e.key]);
    });
    startBtn.addEventListener('click', begin);
    again.addEventListener('click', begin);
    size(0); newDir(); paint();
  });

  /* ------------------------------------------------------------------
     Anfahrt-Karte
     ------------------------------------------------------------------ */
  later('route', function () {
    var TEXT = {
      fuss: 'Vom Hauptbahnhof über den Vorplatz in die Poststraße, nach 160 m auf der rechten Seite. Etwa zwei Minuten.',
      bahn: 'Regionalzüge, Stadtbahn und Busse halten am Hauptbahnhof. Vom Ausgang Poststraße sind es zwei Minuten zu Fuß.',
      auto: 'Parkhäuser rund um den Bahnhof, das nächste rund vier Gehminuten entfernt. Für Hörsystem-Termine reservieren wir auf Wunsch einen Platz im Hof.'
    };
    var btns = qsa('.route-tabs [data-route]');
    var text = qs('.route-text');
    var park = qs('.map-park'), bus = qs('.map-bus');
    function set(r) {
      btns.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-route') === r ? 'true' : 'false'); });
      ['fuss', 'bahn', 'auto'].forEach(function (k) {
        var p = qs('.route-' + k);
        if (p) p.style.strokeDashoffset = k === r ? '0' : '1';
      });
      if (park) park.style.opacity = r === 'auto' ? 1 : 0;
      if (bus) bus.style.opacity = r === 'bahn' ? 1 : 0;
      text.textContent = TEXT[r];
    }
    btns.forEach(function (b) { b.addEventListener('click', function () { set(b.getAttribute('data-route')); }); });
  });

  /* ------------------------------------------------------------------
     Terminanfrage
     ------------------------------------------------------------------ */
  later('booking', function () {
    var form = qs('.book-form');
    if (!form) return;
    var daysBox = qs('.bf-days', form), timesBox = qs('.bf-times', form);
    var done = qs('.book-done');
    var WD = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    var MON = ['Jan.', 'Feb.', 'März', 'Apr.', 'Mai', 'Juni', 'Juli', 'Aug.', 'Sep.', 'Okt.', 'Nov.', 'Dez.'];
    var sel = { day: null, time: null };
    function toMin(s) { var p = s.split(':'); return +p[0] * 60 + +p[1]; }
    function hhmm(m) { return Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0'); }
    function busy(date, m) {
      var seed = date.getFullYear() * 400 + date.getMonth() * 32 + date.getDate();
      var x = Math.sin(seed * 12.9898 + m * 78.233) * 43758.5453;
      return x - Math.floor(x) < BOOKING.BUSY_RATE;
    }
    var days = [];
    var d = new Date(); d.setHours(12, 0, 0, 0);
    while (days.length < BOOKING.DAYS_SHOWN) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() !== 0) days.push(new Date(d));
    }
    days.forEach(function (date, i) {
      var b = h('button', 'day', null, daysBox);
      b.type = 'button';
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', 'false');
      b.tabIndex = i === 0 ? 0 : -1;
      b.setAttribute('aria-label', date.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' }));
      h('span', 'd-w', WD[date.getDay()], b);
      h('span', 'd-n', String(date.getDate()), b);
      h('span', 'd-m', MON[date.getMonth()], b);
      b._date = date;
    });
    function roving(box, sel, onPick) {
      box.addEventListener('keydown', function (e) {
        var items = qsa(sel, box).filter(function (b) { return b.getAttribute('aria-disabled') !== 'true'; });
        var i = items.indexOf(document.activeElement), j = null;
        if (i < 0) return;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % items.length;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i - 1 + items.length) % items.length;
        else if (e.key === 'Home') j = 0;
        else if (e.key === 'End') j = items.length - 1;
        if (j === null) return;
        e.preventDefault();
        items[j].focus();
        onPick(items[j]);
      });
      box.addEventListener('click', function (e) {
        var b = e.target.closest(sel);
        if (b && b.getAttribute('aria-disabled') !== 'true') onPick(b);
      });
    }
    function check(box, sel, b) {
      qsa(sel, box).forEach(function (x) {
        var on = x === b;
        x.setAttribute('aria-checked', on ? 'true' : 'false');
        x.tabIndex = on ? 0 : -1;
      });
    }
    function pickDay(b) {
      check(daysBox, '.day', b);
      sel.day = b._date; sel.time = null;
      buildTimes();
      hideErr('slot');
    }
    function buildTimes() {
      clear(timesBox);
      var date = sel.day, sat = date.getDay() === 6;
      var span = sat ? BOOKING.SATURDAY : BOOKING.WEEKDAY;
      var first = null;
      for (var m = toMin(span[0]); m <= toMin(span[1]); m += BOOKING.STEP_MIN) {
        var b = h('button', 'slot', hhmm(m), timesBox);
        b.type = 'button';
        b.setAttribute('role', 'radio');
        b.setAttribute('aria-checked', 'false');
        b.tabIndex = -1;
        b._min = m;
        if (busy(date, m)) { b.setAttribute('aria-disabled', 'true'); b.setAttribute('aria-label', hhmm(m) + ' Uhr, vergeben'); }
        else { b.setAttribute('aria-label', hhmm(m) + ' Uhr'); if (!first) first = b; }
      }
      if (first) first.tabIndex = 0;
    }
    function pickTime(b) {
      check(timesBox, '.slot', b);
      sel.time = b._min;
      hideErr('slot');
    }
    roving(daysBox, '.day', pickDay);
    roving(timesBox, '.slot', pickTime);
    pickDay(qs('.day', daysBox));

    function err(name) { return qs('[data-err="' + name + '"]', form.parentNode); }
    function showErr(name, field) { var e = err(name); if (e) e.hidden = false; if (field) { field.setAttribute('aria-invalid', 'true'); if (e) { e.id = 'err-' + name; field.setAttribute('aria-describedby', e.id); } } }
    function hideErr(name, field) { var e = err(name); if (e) e.hidden = true; if (field) { field.removeAttribute('aria-invalid'); field.removeAttribute('aria-describedby'); } }
    var F = { name: qs('#bf-name'), tel: qs('#bf-tel'), mail: qs('#bf-mail'), msg: qs('#bf-msg'), dsgvo: qs('input[name="dsgvo"]', form) };
    form.addEventListener('change', function (e) { if (e.target.name === 'anlass') hideErr('anlass'); if (e.target === F.dsgvo && F.dsgvo.checked) hideErr('dsgvo', F.dsgvo); });
    ['name', 'tel', 'mail'].forEach(function (k) { F[k].addEventListener('input', function () { hideErr(k, F[k]); }); });

    // Aktionsleiste ausblenden, solange die Tastatur offen ist
    var bar = qs('.actionbar');
    form.addEventListener('focusin', function (e) { if (bar && /INPUT|TEXTAREA/.test(e.target.tagName) && e.target.type !== 'radio' && e.target.type !== 'checkbox') bar.classList.add('is-hidden'); });
    form.addEventListener('focusout', function () { if (bar) bar.classList.remove('is-hidden'); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var first = null;
      function bad(name, field, focusTarget) { showErr(name, field); if (!first) first = focusTarget || field; }
      var anl = qs('input[name="anlass"]:checked', form);
      if (!anl) bad('anlass', null, qs('input[name="anlass"]', form));
      if (!sel.day || sel.time == null) bad('slot', null, qs('.slot[aria-disabled="false"], .slot:not([aria-disabled])', timesBox) || qs('.day', daysBox));
      if (F.name.value.trim().length < 2) bad('name', F.name);
      if (F.tel.value.replace(/\D/g, '').length < 6) bad('tel', F.tel);
      var mail = F.mail.value.trim();
      if (mail && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) bad('mail', F.mail);
      if (!F.dsgvo.checked) bad('dsgvo', F.dsgvo);
      if (first) {
        scrollToEl(first.closest('.bf-step') || first, function () { focusEl(first); });
        if (!lenis) focusEl(first);
        return;
      }
      var dur = anl.getAttribute('data-dur');
      var sum = qs('.done-sum', done);
      clear(sum);
      function row(k, v) { h('dt', null, k, sum); h('dd', null, v, sum); }
      row('Anlass', anl.parentNode.querySelector('.anl-t').textContent + ' (ca. ' + dur + ' Min.)');
      row('Termin', sel.day.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + ', ' + hhmm(sel.time) + ' Uhr');
      row('Name', F.name.value.trim());
      row('Telefon', F.tel.value.trim());
      if (mail) row('E-Mail', mail);
      if (F.msg.value.trim()) row('Nachricht', F.msg.value.trim());
      row('Ort', 'Klarsicht Optik & Akustik, Poststraße 9, 53111 Bonn');
      form.hidden = true;
      done.hidden = false;
      scrollToEl(qs('#termin'), function () { focusEl(done); });
      if (!lenis) focusEl(done);
    });
    qs('.done-new', done).addEventListener('click', function () {
      form.reset();
      ['name', 'tel', 'mail', 'dsgvo'].forEach(function (k) { hideErr(k, F[k]); });
      hideErr('anlass'); hideErr('slot');
      pickDay(qs('.day', daysBox));
      done.hidden = true;
      form.hidden = false;
      focusEl(qs('input[name="anlass"]', form));
    });
  });

  /* ------------------------------------------------------------------
     Fokus-Hero: Linse folgt dem Cursor, Unschärfe drumherum
     ------------------------------------------------------------------ */
  safe('focus-hero', function () {
    var hero = qs('.hero');
    var veil = qs('.focus-veil'), lens = qs('.focus-lens'), read = qs('.fl-read');
    var hint = qs('.hero-hint'), hintDpt = hint && qs('.hh-dpt', hint);
    if (!hero || !veil || !doc.classList.contains('focus-pending')) return;
    var useLens = finePointer && !reduced && window.innerWidth >= 900;
    var BLUR = reduced ? 6 : (useLens ? 12 : 9);
    // Automatisches Scharfstellen (ms): Wer nichts tut, sieht nach gut zwei Sekunden alles scharf.
    // Bewegt jemand die Linse, wartet der Autofokus, bis die Maus kurz ruht (spätestens AUTO_MAX).
    var AUTO_DELAY = reduced ? 300 : 900, AUTO_IDLE = 1400, AUTO_MAX = 4500, AUTO_DUR = reduced ? 1000 : 1400;
    var R = 100, MAG = 1.12, D0 = -1.75;
    var t0 = performance.now(), autoStart = 0;
    var F = { p: 0, scrollP: 0, moveP: 0, autoP: 0, autoFrom: 0, x: 0, y: 0, tx: 0, ty: 0, r: 0, tr: 0, lastMove: 0, done: false, readTxt: '', hintTxt: '', hintP: -1 };
    var grid = qs('.hero-grid', hero), glass = null, mag = null, gridOff = { x: 0, y: 0, w: 0 };

    function measure() {
      gridOff.x = grid.offsetLeft; gridOff.y = grid.offsetTop; gridOff.w = grid.offsetWidth;
      if (mag) mag.style.width = gridOff.w + 'px';
    }
    // Lupe erst bei der ersten Mausbewegung bauen (spart Arbeit beim Laden)
    function buildLens() {
      glass = document.createElement('span');
      glass.className = 'fl-glass';
      mag = grid.cloneNode(true);
      mag.classList.add('fl-mag');
      mag.removeAttribute('id');
      qsa('[id]', mag).forEach(function (n) { n.removeAttribute('id'); });
      qsa('[aria-labelledby]', mag).forEach(function (n) { n.removeAttribute('aria-labelledby'); });
      qsa('a, button', mag).forEach(function (n) { n.setAttribute('tabindex', '-1'); });
      var oImg = qs('.hv-img', grid), cImg = qs('.hv-img', mag);
      if (cImg) {
        cImg.removeAttribute('fetchpriority');
        cImg.removeAttribute('srcset');
        cImg.removeAttribute('sizes');
        cImg.src = oImg.currentSrc || oImg.src;
      }
      mag.setAttribute('inert', '');
      glass.appendChild(mag);
      lens.insertBefore(glass, lens.firstChild);
      lens.classList.add('is-on');
      measure();
      window.addEventListener('resize', measure);
    }

    if (useLens) {
      hero.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse' || F.done) return;
        if (!glass) buildLens();
        var r = hero.getBoundingClientRect();
        var nx = e.clientX - r.left, ny = e.clientY - r.top;
        if (F.tr > 0) F.moveP = Math.min(1, F.moveP + Math.hypot(nx - F.tx, ny - F.ty) / 5200);
        if (F.tr === 0) { F.x = nx; F.y = ny; }
        F.tx = nx; F.ty = ny; F.tr = R;
        F.lastMove = performance.now();
      });
      hero.addEventListener('pointerleave', function () { F.tr = 0; });
    }
    function onScroll() {
      var hh = hero.offsetHeight || window.innerHeight;
      F.scrollP = clamp(window.pageYOffset / (hh * 0.42), 0, 1);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
    function dptText(p) {
      var dpt = Math.round(D0 * (1 - p) * 4) / 4;
      return dpt === 0 ? '±0,00 dpt' : '−' + fmtDe(Math.abs(dpt), 2) + ' dpt';
    }
    function finish() {
      F.done = true;
      F.tr = 0;
      if (hint) hint.classList.add('is-sharp');
      doc.classList.add('focus-done');
      setTimeout(function () {
        doc.classList.remove('focus-pending');
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', measure);
        if (glass && glass.parentNode) glass.parentNode.removeChild(glass);
      }, 1400);
    }

    function frame(now) {
      if (F.done && F.r < 0.5) return;
      if (!autoStart && !F.done) {
        var since = now - t0;
        if (since > AUTO_MAX || (since > AUTO_DELAY && (!F.lastMove || now - F.lastMove > AUTO_IDLE))) {
          autoStart = now;
          F.autoFrom = F.p;
        }
      }
      // Wird die Linse gerade bewegt, hält der Autofokus kurz an (nicht länger als AUTO_MAX)
      if (autoStart && F.lastMove && now - F.lastMove < AUTO_IDLE && now - t0 < AUTO_MAX && F.autoP < 0.85) autoStart += now - (F.prev || now);
      F.prev = now;
      if (autoStart) F.autoP = F.autoFrom + (1 - F.autoFrom) * clamp((now - autoStart) / AUTO_DUR, 0, 1);
      var p = Math.max(F.scrollP, F.moveP, F.autoP);
      F.p = p;
      var blur = BLUR * (1 - easeOut(p));
      veil.style.setProperty('--fb', blur.toFixed(2) + 'px');
      var dTxt = dptText(p);
      if (hintDpt && dTxt !== F.hintTxt) { hintDpt.textContent = dTxt; F.hintTxt = dTxt; }
      if (hint && Math.abs(p - F.hintP) > 0.004) { hint.style.setProperty('--fp', p.toFixed(3)); F.hintP = p; }
      if (useLens && glass) {
        F.x += (F.tx - F.x) * 0.2;
        F.y += (F.ty - F.y) * 0.2;
        F.r += (F.tr - F.r) * 0.16;
        if (Math.abs(F.r - F.tr) < 0.3) F.r = F.tr;
        veil.style.setProperty('--lx', F.x.toFixed(1) + 'px');
        veil.style.setProperty('--ly', F.y.toFixed(1) + 'px');
        veil.style.setProperty('--lr', F.r.toFixed(1) + 'px');
        var k = F.r / R;
        lens.style.opacity = k.toFixed(3);
        lens.style.transform = 'translate3d(' + (F.x - R).toFixed(1) + 'px,' + (F.y - R).toFixed(1) + 'px,0) scale(' + (0.86 + 0.14 * k).toFixed(3) + ')';
        var ox = F.x - gridOff.x, oy = F.y - gridOff.y;
        mag.style.transformOrigin = ox.toFixed(1) + 'px ' + oy.toFixed(1) + 'px';
        mag.style.transform = 'translate3d(' + (gridOff.x - F.x + R).toFixed(1) + 'px,' + (gridOff.y - F.y + R).toFixed(1) + 'px,0) scale(' + MAG + ')';
        var txt = dTxt + (p >= 1 ? ' · scharf' : '');
        if (txt !== F.readTxt) { read.textContent = txt; F.readTxt = txt; }
      }
      if (p >= 1 && !F.done) finish();
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });

  /* ------------------------------------------------------------------
     Bewegung: Intro, Reveals, Statement, Zähler, Pfad (nur mit GSAP)
     ------------------------------------------------------------------ */
  setTimeout(drain, 0);
  if (!anim) return;
  var ST = window.ScrollTrigger;

  safe('hero-intro', function () {
    var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    var H = '.hero > .hero-grid ';
    tl.fromTo(H + '.hero-eyebrow', { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6 }, 0.1)
      .fromTo(H + '.hero-title .cl-t', { opacity: 0, yPercent: 38 }, { opacity: 1, yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: 0.08 }, 0.15)
      .fromTo(H + '.hero-visual', { opacity: 0, scale: 0.94 }, { opacity: 1, scale: 1, duration: 1.3 }, 0.3)
      .fromTo(H + '.hv-scale', { rotation: -24 }, { rotation: 0, duration: 1.8, ease: 'power4.out', transformOrigin: '50% 50%' }, 0.3)
      .fromTo(H + '.hero-copy > *', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.07, clearProps: 'transform' }, 0.55);
    // Leichte Parallaxe beim Herausscrollen
    gsap.to('.hv-disc', { yPercent: -6, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  });

  later('reveals', function () {
    qsa('.reveal-focus').forEach(function (n) {
      gsap.fromTo(n, { opacity: 0, filter: 'blur(12px)', y: 10 }, {
        opacity: 1, filter: 'blur(0px)', y: 0, duration: 1.05, ease: 'power3.out', clearProps: 'filter,transform',
        scrollTrigger: { trigger: n, start: 'top 88%', once: true }
      });
    });
    var groups = ['.svc', '.person', '.quote', '.about-facts li', '.fact', '.hear-list li', '.qa'];
    groups.forEach(function (sel) {
      var items = qsa(sel);
      if (!items.length) return;
      gsap.set(items, { opacity: 0, y: 22 });
      ST.batch(items, {
        start: 'top 90%',
        once: true,
        onEnter: function (batch) { gsap.to(batch, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.06, overwrite: true, clearProps: 'transform' }); }
      });
    });
    // Bilder: Masken-Reveal
    qsa('.svc-media, .about-media img, .hear-media > img').forEach(function (n) {
      gsap.fromTo(n, { clipPath: 'inset(0 0 100% 0 round 12px)' }, { clipPath: 'inset(0 0 0% 0 round 12px)', duration: 1.1, ease: 'power3.inOut', clearProps: 'clipPath', scrollTrigger: { trigger: n, start: 'top 90%', once: true } });
    });
  });

  later('statement', function () {
    var p = qs('[data-focus-words]');
    if (!p) return;
    var words = p.textContent.trim().split(/\s+/);
    clear(p);
    var spans = words.map(function (w, i) {
      var s = h('span', 'w', w, p);
      if (i < words.length - 1) p.appendChild(document.createTextNode(' '));
      return s;
    });
    gsap.fromTo(spans, { opacity: 0.14, filter: 'blur(7px)' }, {
      opacity: 1, filter: 'blur(0px)', ease: 'none', stagger: 0.12,
      scrollTrigger: { trigger: p, start: 'top 82%', end: 'bottom 52%', scrub: 0.6 }
    });
  });

  later('counters', function () {
    qsa('.fact-n[data-count]').forEach(function (n) {
      var to = parseFloat(n.getAttribute('data-count'));
      var dec = parseInt(n.getAttribute('data-decimals') || '0', 10);
      var o = { v: 0 };
      n.textContent = fmtDe(0, dec);
      gsap.to(o, {
        v: to, duration: 1.6, ease: 'power2.out',
        onUpdate: function () { n.textContent = fmtDe(o.v, dec); },
        scrollTrigger: { trigger: n, start: 'top 90%', once: true }
      });
    });
  });

  later('audiogram', function () {
    var card = qs('.audio-card');
    if (!card) return;
    var tl = gsap.timeline({ scrollTrigger: { trigger: card, start: 'top 85%', once: true } });
    tl.fromTo('.ag-r', { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut' })
      .fromTo('.ag-l', { opacity: 0 }, { opacity: 1, duration: 0.6 }, 0.6)
      .fromTo('.ag-pts circle', { opacity: 0, scale: 0.4, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: 0.4, stagger: 0.12, ease: 'back.out(2)' }, 0.1);
  });

  later('path', function () {
    var section = qs('.path'), track = qs('.path-track');
    if (!section || !track) return;
    var cut = qs('.edge-cut');
    var ppFill = qs('.pp-fill'), ppNow = qs('.pp-now');
    var mm = gsap.matchMedia();
    mm.add('(min-width: 900px)', function () {
      // Statt GSAP-Pin: CSS position: sticky (.path-pin) in einer Sektion, die so hoch ist
      // wie Bildschirm + horizontale Strecke. Kein Umschalten auf position: fixed, kein Layout-Sprung.
      var pin = qs('.path-pin', section);
      function dist() { return Math.max(0, track.scrollWidth - window.innerWidth); }
      function size() { section.style.height = (pin.offsetHeight + dist()) + 'px'; }
      size();
      ST.addEventListener('refreshInit', size);
      var tween = gsap.to(track, {
        x: function () { return -dist(); },
        ease: 'none',
        scrollTrigger: {
          trigger: section, start: 'top top', end: 'bottom bottom',
          scrub: 0.6, invalidateOnRefresh: true,
          onUpdate: function (self) {
            if (ppFill) ppFill.style.setProperty('--pp', self.progress.toFixed(3));
            if (ppNow) ppNow.textContent = '0' + (Math.min(4, Math.round(self.progress * 4)) + 1);
          }
        }
      });
      if (cut) gsap.fromTo(cut, { strokeDashoffset: 1 }, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: '.station-svg', containerAnimation: tween, start: 'left 75%', end: 'center 45%', scrub: true } });
      qsa('.station .st-media img').forEach(function (img) {
        gsap.fromTo(img, { scale: 1.12 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: img, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
      });
      return function () { ST.removeEventListener('refreshInit', size); section.style.height = ''; };
    });
    mm.add('(max-width: 899px)', function () {
      gsap.set(qsa('.station'), { opacity: 0, y: 24 });
      ST.batch('.station', { start: 'top 90%', once: true, onEnter: function (b) { gsap.to(b, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.06, clearProps: 'transform' }); } });
      if (cut) gsap.fromTo(cut, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut', scrollTrigger: { trigger: '.station-svg', start: 'top 75%', once: true } });
    });
  });

  safe('refresh', function () {
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ST.refresh(); });
    window.addEventListener('load', function () { ST.refresh(); });
  });
})();
