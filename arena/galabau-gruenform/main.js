/* ==========================================================================
   Grünform Garten- & Landschaftsbau · Modell „Wurzel“
   Ohne Build-Schritt. Optional: GSAP + ScrollTrigger, Lenis (assets/vendor).
   ========================================================================== */
(function () {
  'use strict';
  window.__gruenformReady = true;

  /* ------------------------------------------------------------------
     Gartenplaner – Richtwerte (hier anpassen)
     Preise in € inkl. MwSt. pro m² bzw. pro Stück, Orientierung Kassel 2026.
     ------------------------------------------------------------------ */
  var GRID = { cols: 10, rows: 6, cellM2: 4 };         // 10 × 6 Felder à 2 × 2 m = 240 m²
  var PRICES = {
    terrasse: { name: 'Terrasse', min: 120, max: 220, unit: 'm2', bar: '#D6CDB9' },   // Beton-/Naturstein inkl. Unterbau
    weg:      { name: 'Weg',      min: 70,  max: 140, unit: 'm2', bar: '#B8AC90' },   // Pflaster oder wassergebundene Decke
    rasen:    { name: 'Rasen',    min: 12,  max: 25,  unit: 'm2', bar: 'var(--lawn-c)' }, // Fertigrasen inkl. Bodenvorbereitung
    beet:     { name: 'Beet',     min: 45,  max: 90,  unit: 'm2', bar: 'var(--bloom-0)' }, // Stauden/Gehölze inkl. Boden & Mulch
    teich:    { name: 'Teich',    min: 250, max: 450, unit: 'm2', bar: 'var(--water-a)' }, // Folienteich inkl. Aushub, Technik, Ufer
    baum:     { name: 'Baum',     min: 450, max: 1100, unit: 'stk', bar: 'var(--leaf-a)' } // Hausbaum StU 16–18 cm inkl. Pflanzung
  };
  var BASE_FEE = { min: 800, max: 1500, name: 'Baustelle & Feinplanung' }; // pauschal, sobald etwas geplant ist
  var ROUND_TO = 100;                                   // Ergebnis auf volle 100 € runden
  var TOOL_ORDER = ['terrasse', 'weg', 'rasen', 'beet', 'teich', 'baum', 'leer'];
  var CODE = { T: 'terrasse', W: 'weg', R: 'rasen', B: 'beet', P: 'teich', A: 'baum', '.': '' };
  /* Vorlagen: Reihe 1 = hinten (Grundstücksende), Reihe 6 = am Haus */
  var PRESETS = {
    familie:      ['BBBABBBBBB', 'BRRRRRRWBB', 'PPRRRRRWRB', 'PPRRRRRWRB', 'BRRRRRRWRA', 'BBTTTTTTTB'],
    naturnah:     ['ABBBBBBBBA', 'BBBRRRRBBB', 'BPPPRRRRWB', 'BPPPRRRWWB', 'BBRRRRWRRB', 'BBBTTTTTBB'],
    pflegeleicht: ['BBBBABBBBB', 'WWWWWWWWWB', 'TTTRRRRRWB', 'TTTRRRRRWB', 'TTTRRRARWB', 'TTTTTTTTWB']
  };

  /* Jahreszeiten: Kurztipp für den Hero (ausführliche Tipps stehen im HTML) */
  var SEASONS = {
    fruehling: { name: 'Frühling', tip: 'Stauden jetzt bodennah zurückschneiden – bis März wohnen Insekten in den Stängeln.' },
    sommer:    { name: 'Sommer',   tip: 'Morgens gießen – selten, aber durchdringend: 10–20 Liter pro m² und Woche.' },
    herbst:    { name: 'Herbst',   tip: 'Jetzt ist Pflanzzeit für Hecken und Gehölze – der Boden ist noch warm.' },
    winter:    { name: 'Winter',   tip: 'Gehölze an frostfreien Tagen schneiden – und den Frühjahrsbau jetzt planen.' }
  };
  var SOIL_NAMES = ['Bestand: gewachsener Boden', 'Planum & Untergrund', 'Frostschutzschicht', 'Schottertragschicht', 'Bettung aus Splitt', 'Belag', 'Randeinfassung & Fugen'];

  /* ------------------------------------------------------------------
     Helfer
     ------------------------------------------------------------------ */
  var doc = document.documentElement;
  var qs = function (s, r) { return (r || document).querySelector(s); };
  var qsa = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };
  var easeInOut = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var dprMax = function () { return Math.min(window.devicePixelRatio || 1, 2); };
  var fmt = new Intl.NumberFormat('de-DE');
  var euro = function (v) { return fmt.format(v); };
  var roundTo = function (v) { return Math.round(v / ROUND_TO) * ROUND_TO; };

  var motionOff = doc.classList.contains('motion-off');
  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduced = function () { return motionOff || mqReduce.matches; };
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  var hasGSAP = !!(window.gsap && window.ScrollTrigger);
  var lenis = null;

  function safe(name, fn) {
    try { fn(); } catch (err) { if (window.console) console.warn('[Grünform] ' + name + ':', err); }
  }
  function store(key, val) {
    try { if (val === undefined) return localStorage.getItem(key); localStorage.setItem(key, val); } catch (e) { return null; }
    return null;
  }
  function visibilityGate(el, onChange) {
    var inView = false;
    var update = function () { onChange(inView && !document.hidden); };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) { inView = entries[0].isIntersecting; update(); }, { rootMargin: '60px 0px' }).observe(el);
    } else { inView = true; }
    document.addEventListener('visibilitychange', update);
    update();
  }
  function headerOffset() { var h = qs('[data-header]'); return h ? h.offsetHeight : 0; }

  /* ------------------------------------------------------------------
     Smooth Scroll (Lenis) + ScrollTrigger
     ------------------------------------------------------------------ */
  function initScroll() {
    if (hasGSAP) gsap.registerPlugin(ScrollTrigger);
    if (!reduced() && window.Lenis) {
      lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true, anchors: false });
      window.__lenis = lenis;
      if (hasGSAP) {
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
        gsap.ticker.lagSmoothing(0);
      } else {
        var raf = function (t) { lenis.raf(t); requestAnimationFrame(raf); };
        requestAnimationFrame(raf);
      }
    }
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var target = document.getElementById(decodeURIComponent(id.slice(1)));
      if (!target) return;
      e.preventDefault();
      if (doc.classList.contains('menu-open')) closeMenu(true);
      scrollToTarget(target);
      if (history.pushState) history.pushState(null, '', id);
    });
    // Höhenänderungen (Planer-Zusammenfassung, Filter, Jahreszeit) → Trigger neu berechnen
    if (hasGSAP && 'ResizeObserver' in window) {
      var lastH = 0, tmr = 0;
      new ResizeObserver(function () {
        var h = document.body.scrollHeight;
        if (Math.abs(h - lastH) < 2) return;
        lastH = h; clearTimeout(tmr);
        tmr = setTimeout(function () { ScrollTrigger.refresh(); }, 180);
      }).observe(qs('main'));
    }
    window.addEventListener('load', function () { if (hasGSAP) ScrollTrigger.refresh(); });
  }
  function scrollToTarget(target, opts) {
    opts = opts || {};
    var isTop = target.id === 'top';
    var focus = function () {
      if (opts.noFocus) return;
      var f = opts.focusEl || target;
      if (!f.hasAttribute('tabindex') && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(f.tagName)) f.setAttribute('tabindex', '-1');
      f.focus({ preventScroll: true });
    };
    var y = isTop ? 0 : target.getBoundingClientRect().top + window.scrollY - headerOffset() + 1;
    if (lenis) {
      lenis.scrollTo(y, { duration: 1.3, easing: easeInOut, onComplete: focus });
    } else {
      window.scrollTo({ top: y, behavior: reduced() ? 'auto' : 'smooth' });
      setTimeout(focus, reduced() ? 0 : 650);
    }
  }

  /* ------------------------------------------------------------------
     Header: Zustand, Scroll-Fortschritt, aktive Navigation
     ------------------------------------------------------------------ */
  function initHeader() {
    var header = qs('[data-header]'), bar = qs('[data-progress]');
    var ticking = false;
    var update = function () {
      ticking = false;
      var y = window.scrollY || 0;
      var max = Math.max(1, doc.scrollHeight - window.innerHeight);
      header.classList.toggle('is-scrolled', y > 8);
      if (bar) bar.style.transform = 'scaleX(' + clamp(y / max, 0, 1).toFixed(4) + ')';
    };
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();

    var links = qsa('.main-nav a'), map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (l) { l.removeAttribute('aria-current'); });
        var l = map[en.target.id];
        if (l) l.setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    qsa('main > section[id]').forEach(function (s) { io.observe(s); });
  }

  /* ------------------------------------------------------------------
     Menü (mobil): Fokusführung, Escape, Scroll-Sperre
     ------------------------------------------------------------------ */
  var menuEl, menuBtn;
  function openMenu() {
    menuEl.hidden = false;
    qsa('.menu-list li', menuEl).forEach(function (li, i) { li.style.setProperty('--i', i); });
    menuBtn.setAttribute('aria-expanded', 'true');
    menuBtn.querySelector('.menu-btn-label').textContent = 'Schließen';
    doc.classList.add('menu-open');
    if (lenis) lenis.stop();
    requestAnimationFrame(function () { requestAnimationFrame(function () { menuEl.classList.add('is-open'); }); });
    var first = qs('a', menuEl);
    if (first) first.focus({ preventScroll: true });
  }
  function closeMenu(silent) {
    if (!menuEl || menuEl.hidden) return;
    menuEl.classList.remove('is-open');
    menuEl.hidden = true;
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.querySelector('.menu-btn-label').textContent = 'Menü';
    doc.classList.remove('menu-open');
    if (lenis) lenis.start();
    if (!silent) menuBtn.focus();
  }
  function initMenu() {
    menuEl = qs('#menu'); menuBtn = qs('.menu-btn');
    if (!menuEl || !menuBtn) return;
    menuBtn.addEventListener('click', function () { if (menuEl.hidden) openMenu(); else closeMenu(); });
    document.addEventListener('keydown', function (e) {
      if (menuEl.hidden) return;
      if (e.key === 'Escape') { e.preventDefault(); closeMenu(); return; }
      if (e.key === 'Tab') {
        var f = [menuBtn].concat(qsa('a, button', menuEl));
        var i = f.indexOf(document.activeElement);
        if (e.shiftKey && (i <= 0)) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      }
    });
    window.addEventListener('resize', function () { if (window.innerWidth > 1240) closeMenu(true); });
  }

  /* ------------------------------------------------------------------
     Reveal-Choreografie
     ------------------------------------------------------------------ */
  function initReveal() {
    var els = qsa('[data-reveal]');
    if (motionOff || !('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add('is-in'); }); return; }
    els.forEach(function (el) {
      var sib = qsa(':scope > [data-reveal]', el.parentNode);
      var i = sib.indexOf(el);
      if (i > 0) el.style.setProperty('--d', Math.min(i, 6) * 70 + 'ms');
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });
  }

  function initIntro() {
    var go = function () { requestAnimationFrame(function () { requestAnimationFrame(function () { doc.classList.add('is-loaded'); }); }); };
    if (motionOff) { doc.classList.add('is-loaded'); return; }
    var done = false;
    var once = function () { if (!done) { done = true; go(); } };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(once);
    setTimeout(once, 450);
  }

  /* ------------------------------------------------------------------
     Höhenlinien im Hero (Canvas, 3D-Simplex-Rauschen + Marching Squares)
     ------------------------------------------------------------------ */
  var noise3 = (function () {
    var g = [1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0, 1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, -1, 0, 1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1];
    var p = new Uint8Array(256), perm = new Uint8Array(512), pm = new Uint8Array(512), s = 7, i;
    for (i = 0; i < 256; i++) p[i] = i;
    for (i = 255; i > 0; i--) { s = (s * 16807) % 2147483647; var r = s % (i + 1), t = p[i]; p[i] = p[r]; p[r] = t; }
    for (i = 0; i < 512; i++) { perm[i] = p[i & 255]; pm[i] = perm[i] % 12; }
    var F = 1 / 3, G = 1 / 6;
    function c(gi, x, y, z) {
      var t = 0.6 - x * x - y * y - z * z;
      if (t < 0) return 0;
      t *= t; gi *= 3;
      return t * t * (g[gi] * x + g[gi + 1] * y + g[gi + 2] * z);
    }
    return function (x, y, z) {
      var s = (x + y + z) * F, i = Math.floor(x + s), j = Math.floor(y + s), k = Math.floor(z + s);
      var t = (i + j + k) * G, x0 = x - (i - t), y0 = y - (j - t), z0 = z - (k - t), i1, j1, k1, i2, j2, k2;
      if (x0 >= y0) {
        if (y0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0; } else if (x0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1; } else { i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1; }
      } else {
        if (y0 < z0) { i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1; } else if (x0 < z0) { i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1; } else { i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
      }
      var ii = i & 255, jj = j & 255, kk = k & 255;
      return 32 * (
        c(pm[ii + perm[jj + perm[kk]]], x0, y0, z0) +
        c(pm[ii + i1 + perm[jj + j1 + perm[kk + k1]]], x0 - i1 + G, y0 - j1 + G, z0 - k1 + G) +
        c(pm[ii + i2 + perm[jj + j2 + perm[kk + k2]]], x0 - i2 + 2 * G, y0 - j2 + 2 * G, z0 - k2 + 2 * G) +
        c(pm[ii + 1 + perm[jj + 1 + perm[kk + 1]]], x0 - 1 + 3 * G, y0 - 1 + 3 * G, z0 - 1 + 3 * G));
    };
  })();

  var contours = { readColor: function () {} };
  function initContours() {
    var canvas = qs('.hero-contours'), hero = qs('.hero');
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    var W = 0, H = 0, cell = 18, cols = 0, rows = 0, field = null, t = 0, running = false, last = 0;
    var m = { x: 0, y: 0, tx: 0, ty: 0, a: 0, ta: 0, seen: false };
    var color = '75, 93, 58';
    var LEVELS = 12;
    contours.readColor = function () {
      var c = getComputedStyle(doc).getPropertyValue('--contour').trim();
      if (c) color = c;
      if (!running) draw();
    };
    function resize() {
      var r = canvas.getBoundingClientRect(), dpr = dprMax();
      W = r.width; H = r.height;
      cell = W < 700 ? 16 : 18;
      canvas.width = Math.max(1, Math.round(W * dpr)); canvas.height = Math.max(1, Math.round(H * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(W / cell) + 1; rows = Math.ceil(H / cell) + 1;
      field = new Float32Array(cols * rows);
      draw();
    }
    function compute() {
      var sig2 = 2 * 150 * 150;
      for (var j = 0; j < rows; j++) {
        for (var i = 0; i < cols; i++) {
          var x = i * cell, y = j * cell;
          var v = noise3(x * 0.0021, y * 0.0021, t) + 0.28 * noise3(x * 0.0058 + 40, y * 0.0058, t * 1.3);
          if (m.a > 0.001) { var dx = x - m.x, dy = y - m.y; v += m.a * 0.42 * Math.exp(-(dx * dx + dy * dy) / sig2); }
          field[j * cols + i] = v;
        }
      }
    }
    function draw() {
      if (!field) return;
      compute();
      ctx.clearRect(0, 0, W, H);
      for (var k = 0; k < LEVELS; k++) {
        var lv = -0.72 + k * 0.13;
        ctx.beginPath();
        for (var j = 0; j < rows - 1; j++) {
          for (var i = 0; i < cols - 1; i++) {
            var a = field[j * cols + i], b = field[j * cols + i + 1], c = field[(j + 1) * cols + i + 1], d = field[(j + 1) * cols + i];
            var idx = (a > lv ? 8 : 0) | (b > lv ? 4 : 0) | (c > lv ? 2 : 0) | (d > lv ? 1 : 0);
            if (idx === 0 || idx === 15) continue;
            var x = i * cell, y = j * cell;
            var tx = x + cell * (lv - a) / (b - a), ry = y + cell * (lv - b) / (c - b);
            var bx = x + cell * (lv - d) / (c - d), ly = y + cell * (lv - a) / (d - a);
            switch (idx) {
              case 1: case 14: ctx.moveTo(x, ly); ctx.lineTo(bx, y + cell); break;
              case 2: case 13: ctx.moveTo(bx, y + cell); ctx.lineTo(x + cell, ry); break;
              case 3: case 12: ctx.moveTo(x, ly); ctx.lineTo(x + cell, ry); break;
              case 4: case 11: ctx.moveTo(tx, y); ctx.lineTo(x + cell, ry); break;
              case 5: ctx.moveTo(x, ly); ctx.lineTo(tx, y); ctx.moveTo(bx, y + cell); ctx.lineTo(x + cell, ry); break;
              case 6: case 9: ctx.moveTo(tx, y); ctx.lineTo(bx, y + cell); break;
              case 7: case 8: ctx.moveTo(x, ly); ctx.lineTo(tx, y); break;
              case 10: ctx.moveTo(x, ly); ctx.lineTo(bx, y + cell); ctx.moveTo(tx, y); ctx.lineTo(x + cell, ry); break;
            }
          }
        }
        var major = k % 4 === 1;
        ctx.strokeStyle = 'rgba(' + color + ',' + (major ? 0.26 : 0.13) + ')';
        ctx.lineWidth = major ? 1.3 : 0.9;
        ctx.stroke();
      }
    }
    // Bewegung nur, solange jemand mit der Maus im Hero ist (plus kurzes Ausklingen).
    // Ein Bild kostet auf Mittelklasse-Handys ~100 ms Hauptthread – darum dort nur ein statisches Bild,
    // und auch am Desktop kein Dauerlauf im Leerlauf.
    var animate = finePointer.matches && !reduced(), visible = false, lastActive = 0, IDLE = 2600;
    function frame(now) {
      if (!running) return;
      var settled = Math.abs(m.ta - m.a) < 0.02 && Math.abs(m.tx - m.x) < 0.5 && Math.abs(m.ty - m.y) < 0.5;
      if (!visible || (now - lastActive > IDLE && settled)) { running = false; return; }
      requestAnimationFrame(frame);
      if (now - last < 40) return;
      last = now;
      t += 0.0045;
      m.x += (m.tx - m.x) * 0.08; m.y += (m.ty - m.y) * 0.08; m.a += (m.ta - m.a) * 0.05;
      draw();
    }
    function wake() {
      lastActive = performance.now();
      if (running || !animate || !visible) return;
      running = true; requestAnimationFrame(frame);
    }
    if (animate) {
      hero.addEventListener('pointermove', function (e) {
        var r = canvas.getBoundingClientRect();
        m.tx = e.clientX - r.left; m.ty = e.clientY - r.top; m.ta = 1;
        if (!m.seen) { m.x = m.tx; m.y = m.ty; m.seen = true; }
        wake();
      });
      hero.addEventListener('pointerleave', function () { m.ta = 0; lastActive = performance.now(); });
    }
    var rt = 0;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(resize, 150); });
    // Erstes Bild nicht im Start-Task berechnen (Canvas blendet ohnehin erst mit dem Intro ein)
    var first = function () { contours.readColor(); resize(); };
    if ('requestIdleCallback' in window) requestIdleCallback(first, { timeout: 900 }); else setTimeout(first, 120);
    visibilityGate(hero, function (on) {
      hero.classList.toggle('is-paused', !on);
      visible = on;
      if (!on) running = false;
    });
  }

  /* ------------------------------------------------------------------
     Jahreszeiten-Umschalter (Farben, Hero-Illustration, Pflegetipps)
     ------------------------------------------------------------------ */
  function initSeasons() {
    var inputs = qsa('[data-season-switch] input');
    var nameEl = qs('[data-season-name]'), tipEl = qs('[data-season-tip]'), icon = qs('[data-season-icon]');
    var panels = qsa('[data-season-panel]');
    var meta = qs('meta[name="theme-color"]');
    var tipTimer = 0;
    function apply(s, user) {
      if (!SEASONS[s]) s = 'sommer';
      var changed = doc.getAttribute('data-season') !== s;
      doc.setAttribute('data-season', s);
      inputs.forEach(function (i) { i.checked = i.value === s; });
      if (nameEl) nameEl.textContent = SEASONS[s].name;
      if (icon) icon.setAttribute('href', '#i-' + s);
      if (tipEl) {
        if (user && !reduced()) {
          tipEl.classList.add('is-swapping');
          clearTimeout(tipTimer);
          tipTimer = setTimeout(function () { tipEl.textContent = SEASONS[s].tip; tipEl.classList.remove('is-swapping'); }, 220);
        } else { tipEl.textContent = SEASONS[s].tip; }
      }
      panels.forEach(function (p) { p.classList.toggle('is-active', p.getAttribute('data-season-panel') === s); });
      if (meta) meta.setAttribute('content', getComputedStyle(doc).getPropertyValue('--tint').trim() || '#F4F1E8');
      if (user) store('gruenform-season', s);
      if (changed || user) setTimeout(contours.readColor, 30);
    }
    inputs.forEach(function (i) {
      i.addEventListener('change', function () { if (i.checked) apply(i.value, true); });
    });
    apply(doc.getAttribute('data-season'), false);
  }

  /* ------------------------------------------------------------------
     Leistungen: Bildwechsel im gepinnten Rahmen (Desktop)
     ------------------------------------------------------------------ */
  function initServices() {
    var items = qsa('.svc'), imgs = qsa('[data-svc-img]'), num = qs('[data-svc-n]');
    if (!items.length || !imgs.length) return;
    var cur = -1;
    function set(i) {
      if (i === cur) return;
      var prev = cur; cur = i;
      items.forEach(function (it, k) { it.classList.toggle('is-active', k === i); });
      imgs.forEach(function (img, k) {
        img.classList.remove('is-leaving');
        if (k === prev) img.classList.add('is-leaving');
        img.classList.toggle('is-active', k === i);
      });
      if (num) num.textContent = '0' + (i + 1);
    }
    set(0);
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) set(items.indexOf(en.target)); });
      }, { rootMargin: '-42% 0px -48% 0px' });
      items.forEach(function (it) { io.observe(it); });
    }
    items.forEach(function (it, k) {
      it.addEventListener('focusin', function () { set(k); });
      if (finePointer.matches) it.addEventListener('pointerenter', function () { set(k); });
    });
  }

  /* ------------------------------------------------------------------
     Gartenplaner
     ------------------------------------------------------------------ */
  var planner = null;
  function initPlanner() {
    var root = qs('[data-planner]'), grid = qs('[data-pl-grid]');
    if (!root || !grid) return;
    var N = GRID.cols * GRID.rows;
    var state = new Array(N).fill('');
    var cells = [], undo = [], tool = 'terrasse', focusIdx = 0, painting = false, lastPainted = -1;
    var totalEl = qs('[data-pl-total]'), linesEl = qs('[data-pl-lines]'), barEl = qs('[data-pl-bar]'), areaEl = qs('[data-pl-area]');
    var undoBtn = qs('[data-pl-undo]'), msgEl = qs('[data-pl-msg]');
    var toolInputs = qsa('input[name="pl-tool"]', root);
    var COLS = 'ABCDEFGHIJ';

    for (var r = 0; r < GRID.rows; r++) {
      var row = document.createElement('div');
      row.className = 'pl-row'; row.setAttribute('role', 'row');
      for (var c = 0; c < GRID.cols; c++) {
        var cell = document.createElement('div');
        var i = r * GRID.cols + c;
        cell.className = 'pl-cell'; cell.setAttribute('role', 'gridcell'); cell.tabIndex = i === 0 ? 0 : -1;
        cell.setAttribute('data-i', i);
        var tile = document.createElement('span'); tile.className = 'pl-tile';
        var ghost = document.createElement('span'); ghost.className = 'pl-ghost';
        cell.appendChild(tile); cell.appendChild(ghost);
        row.appendChild(cell); cells.push(cell);
      }
      grid.appendChild(row);
    }
    function label(i) {
      var t = state[i];
      return 'Feld ' + COLS[i % GRID.cols] + (Math.floor(i / GRID.cols) + 1) + ': ' + (t ? PRICES[t].name : 'leer');
    }
    function same(i, j) { return j >= 0 && j < N && state[i] && state[i] === state[j]; }
    function renderCell(i) {
      var el = cells[i], t = state[i], col = i % GRID.cols;
      if (t) el.setAttribute('data-t', t); else el.removeAttribute('data-t');
      var mergeable = t && t !== 'baum';
      el.classList.toggle('j-n', !!mergeable && same(i, i - GRID.cols));
      el.classList.toggle('j-s', !!mergeable && same(i, i + GRID.cols));
      el.classList.toggle('j-w', !!mergeable && col > 0 && same(i, i - 1));
      el.classList.toggle('j-e', !!mergeable && col < GRID.cols - 1 && same(i, i + 1));
      el.setAttribute('aria-label', label(i));
    }
    function renderAround(i) {
      [i, i - GRID.cols, i + GRID.cols, i % GRID.cols > 0 ? i - 1 : -1, i % GRID.cols < GRID.cols - 1 ? i + 1 : -1].forEach(function (k) {
        if (k >= 0 && k < N) renderCell(k);
      });
    }
    function renderAll() { for (var k = 0; k < N; k++) renderCell(k); summary(); }
    function pushUndo() {
      undo.push(state.join(','));
      if (undo.length > 60) undo.shift();
      undoBtn.disabled = false;
    }
    function save() { store('gruenform-plan', state.join(',')); }
    function place(i, animate) {
      var v = tool === 'leer' ? '' : tool;
      if (state[i] === v) return false;
      state[i] = v;
      renderAround(i);
      if (animate && v && !reduced()) {
        var tl = cells[i].firstChild;
        tl.classList.remove('pop'); void tl.offsetWidth; tl.classList.add('pop');
      }
      summary();
      return true;
    }
    function setTool(t, fromKey) {
      if (TOOL_ORDER.indexOf(t) < 0) return;
      tool = t; grid.setAttribute('data-tool', t);
      if (fromKey) toolInputs.forEach(function (inp) { inp.checked = inp.value === t; });
    }
    function counts() {
      var n = {};
      state.forEach(function (t) { if (t) n[t] = (n[t] || 0) + 1; });
      return n;
    }
    function calc() {
      var n = counts(), lines = [], min = 0, max = 0, cellsUsed = 0;
      Object.keys(PRICES).forEach(function (t) {
        if (!n[t]) return;
        var p = PRICES[t], qty = p.unit === 'stk' ? n[t] : n[t] * GRID.cellM2;
        var lo = qty * p.min, hi = qty * p.max;
        min += lo; max += hi; cellsUsed += n[t];
        lines.push({ t: t, name: p.name, q: p.unit === 'stk' ? qty + (qty === 1 ? ' Stück' : ' Stück') : n[t] + (n[t] === 1 ? ' Feld · ' : ' Felder · ') + qty + ' m²', lo: lo, hi: hi, bar: p.bar });
      });
      if (lines.length) { min += BASE_FEE.min; max += BASE_FEE.max; }
      return { lines: lines, min: roundTo(min), max: roundTo(max), area: cellsUsed * GRID.cellM2 };
    }
    function summary() {
      var r = calc();
      totalEl.textContent = '';
      if (!r.lines.length) {
        totalEl.textContent = '–';
      } else {
        var a = document.createElement('span'); a.textContent = euro(r.min) + ' –';
        var b = document.createElement('span'); b.className = 'pl-to'; b.textContent = euro(r.max) + ' €';
        totalEl.appendChild(a); totalEl.appendChild(document.createTextNode(' ')); totalEl.appendChild(b);
      }
      linesEl.textContent = '';
      barEl.textContent = '';
      if (!r.lines.length) {
        var li0 = document.createElement('li'); li0.className = 'empty';
        li0.textContent = 'Noch leer – setzen Sie Elemente ins Raster oder wählen Sie eine Vorlage.';
        linesEl.appendChild(li0);
      }
      var sumMid = 0;
      r.lines.forEach(function (l) { sumMid += (l.lo + l.hi) / 2; });
      r.lines.forEach(function (l) {
        var li = document.createElement('li');
        var sw = document.createElement('span'); sw.className = 'sw'; sw.style.background = l.bar;
        var nm = document.createElement('span'); nm.textContent = l.name;
        var q = document.createElement('span'); q.className = 'q'; q.textContent = l.q; nm.appendChild(q);
        var rr = document.createElement('span'); rr.className = 'r'; rr.textContent = euro(roundTo(l.lo)) + '–' + euro(roundTo(l.hi)) + ' €';
        li.appendChild(sw); li.appendChild(nm); li.appendChild(rr);
        linesEl.appendChild(li);
        var seg = document.createElement('span');
        seg.style.width = ((l.lo + l.hi) / 2 / sumMid * 100).toFixed(2) + '%';
        seg.style.background = l.bar;
        barEl.appendChild(seg);
      });
      if (r.lines.length) {
        var lb = document.createElement('li');
        var sw2 = document.createElement('span'); sw2.className = 'sw'; sw2.style.background = 'rgba(244,241,232,.35)';
        var nm2 = document.createElement('span'); nm2.textContent = BASE_FEE.name;
        var q2 = document.createElement('span'); q2.className = 'q'; q2.textContent = 'pauschal'; nm2.appendChild(q2);
        var r2 = document.createElement('span'); r2.className = 'r'; r2.textContent = euro(BASE_FEE.min) + '–' + euro(BASE_FEE.max) + ' €';
        lb.appendChild(sw2); lb.appendChild(nm2); lb.appendChild(r2);
        linesEl.appendChild(lb);
      }
      areaEl.textContent = euro(r.area) + ' von ' + euro(N * GRID.cellM2) + ' m² geplant';
    }
    function loadPreset(name) {
      var p = PRESETS[name]; if (!p) return;
      var s = p.join('');
      for (var k = 0; k < N; k++) state[k] = CODE[s.charAt(k)] || '';
    }
    function focusCell(i) {
      cells[focusIdx].tabIndex = -1;
      focusIdx = clamp(i, 0, N - 1);
      cells[focusIdx].tabIndex = 0;
      cells[focusIdx].focus();
    }
    function cellFromEvent(e) {
      var el = document.elementFromPoint(e.clientX, e.clientY);
      el = el && el.closest ? el.closest('.pl-cell') : null;
      return el && grid.contains(el) ? +el.getAttribute('data-i') : -1;
    }

    // Startzustand: gespeicherte Skizze oder Vorlage „Familiengarten“
    var saved = store('gruenform-plan');
    var arr = saved ? saved.split(',') : null;
    if (arr && arr.length === N && arr.every(function (t) { return t === '' || PRICES[t]; })) state = arr;
    else loadPreset('familie');
    setTool('terrasse');
    renderAll();

    toolInputs.forEach(function (inp) { inp.addEventListener('change', function () { if (inp.checked) setTool(inp.value); }); });

    grid.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      var cellEl = e.target.closest('.pl-cell'); if (!cellEl) return;
      var i = +cellEl.getAttribute('data-i');
      pushUndo();
      var changed = place(i, true);
      if (!changed) undo.pop(), undoBtn.disabled = !undo.length;
      cells[focusIdx].tabIndex = -1; focusIdx = i; cells[i].tabIndex = 0;
      if (e.pointerType === 'mouse' || e.pointerType === 'pen') {
        painting = true; lastPainted = i;
        e.preventDefault();
        cellEl.focus({ preventScroll: true });
      } else { save(); }
    });
    window.addEventListener('pointermove', function (e) {
      if (!painting) return;
      var i = cellFromEvent(e);
      if (i < 0 || i === lastPainted) return;
      lastPainted = i;
      place(i, true);
    });
    var endPaint = function () { if (painting) { painting = false; save(); } };
    window.addEventListener('pointerup', endPaint);
    window.addEventListener('pointercancel', endPaint);

    grid.addEventListener('keydown', function (e) {
      var i = focusIdx, col = i % GRID.cols, k = e.key;
      if (k === 'ArrowRight') { e.preventDefault(); if (col < GRID.cols - 1) focusCell(i + 1); }
      else if (k === 'ArrowLeft') { e.preventDefault(); if (col > 0) focusCell(i - 1); }
      else if (k === 'ArrowDown') { e.preventDefault(); if (i + GRID.cols < N) focusCell(i + GRID.cols); }
      else if (k === 'ArrowUp') { e.preventDefault(); if (i - GRID.cols >= 0) focusCell(i - GRID.cols); }
      else if (k === 'Home') { e.preventDefault(); focusCell(e.ctrlKey ? 0 : i - col); }
      else if (k === 'End') { e.preventDefault(); focusCell(e.ctrlKey ? N - 1 : i - col + GRID.cols - 1); }
      else if (k === 'Enter' || k === ' ') { e.preventDefault(); pushUndo(); if (!place(i, false)) { undo.pop(); undoBtn.disabled = !undo.length; } save(); }
      else if (k === 'Delete' || k === 'Backspace') {
        e.preventDefault();
        if (state[i]) { pushUndo(); var prev = tool; tool = 'leer'; place(i, false); tool = prev; save(); }
      }
      else if (/^[1-7]$/.test(k)) { e.preventDefault(); setTool(TOOL_ORDER[+k - 1], true); }
      else if ((e.ctrlKey || e.metaKey) && k.toLowerCase() === 'z') { e.preventDefault(); doUndo(); }
    });
    grid.addEventListener('focusin', function (e) {
      var el = e.target.closest('.pl-cell');
      if (el) { cells[focusIdx].tabIndex = -1; focusIdx = +el.getAttribute('data-i'); el.tabIndex = 0; }
    });
    qs('.pl-tools', root).addEventListener('keydown', function (e) {
      if (/^[1-7]$/.test(e.key)) { e.preventDefault(); setTool(TOOL_ORDER[+e.key - 1], true); }
    });

    function doUndo() {
      if (!undo.length) return;
      state = undo.pop().split(',');
      undoBtn.disabled = !undo.length;
      renderAll(); save();
    }
    undoBtn.addEventListener('click', doUndo);
    qs('[data-pl-clear]', root).addEventListener('click', function () {
      if (!state.some(Boolean)) return;
      pushUndo(); state = new Array(N).fill(''); renderAll(); save();
    });
    qsa('[data-pl-preset]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        pushUndo(); loadPreset(b.getAttribute('data-pl-preset')); renderAll(); save();
        if (!reduced()) cells.forEach(function (c, k) {
          if (!state[k]) return;
          c.firstChild.animate([{ opacity: 0, transform: 'scale(.85)' }, { opacity: 1, transform: 'none' }], { duration: 260, delay: (k % GRID.cols) * 18 + Math.floor(k / GRID.cols) * 26, easing: 'cubic-bezier(0.23, 1, 0.32, 1)', fill: 'backwards' });
        });
      });
    });
    var msgTimer = 0;
    qs('[data-pl-transfer]', root).addEventListener('click', function () {
      var r = calc();
      if (!r.lines.length) { msgEl.textContent = 'Die Skizze ist noch leer – setzen Sie zuerst ein paar Elemente.'; return; }
      var parts = r.lines.map(function (l) { return l.name + ' ' + (PRICES[l.t].unit === 'stk' ? l.q : (l.q.split('· ')[1] || l.q)); });
      var text = parts.join(', ') + ' – grobe Spanne ' + euro(r.min) + '–' + euro(r.max) + ' €';
      if (forms.setSketch) forms.setSketch(state.slice(), text);
      msgEl.textContent = 'Übernommen – die Skizze steht jetzt im Anfrageformular.';
      clearTimeout(msgTimer); msgTimer = setTimeout(function () { msgEl.textContent = ''; }, 6000);
      var target = qs('#kontakt');
      if (target) scrollToTarget(target, { focusEl: qs('[data-form-sketch]') });
    });
    planner = { state: function () { return state.slice(); } };
  }

  /* ------------------------------------------------------------------
     Bodenschichten-Schnitt: Schicht für Schicht beim Scrollen
     ------------------------------------------------------------------ */
  function initSoil() {
    var sec = qs('[data-soil]'), section = qs('.soil-sec');
    if (!sec) return;
    var layers = qsa('.soil-layer', sec), nums = qsa('.soil-num', sec), steps = qsa('.soil-step', sec);
    var capN = qs('[data-soil-n]'), capT = qs('[data-soil-t]'), meter = qs('[data-soil-meter]');
    var cur = -1;
    function byNum(list, attr) {
      var o = {}; list.forEach(function (el) { o[el.getAttribute(attr)] = el; }); return o;
    }
    var L = byNum(layers, 'data-layer'), M = byNum(nums, 'data-num');
    function setStep(n, classLayers) {
      if (n === cur) return;
      cur = n;
      steps.forEach(function (s, k) { s.classList.toggle('is-active', k === n - 1); });
      for (var k = 1; k <= 6; k++) {
        if (L[k]) {
          L[k].classList.toggle('is-current', k === n);
          if (classLayers) L[k].classList.toggle('is-in', k <= n);
        }
        if (M[k]) { M[k].classList.toggle('is-in', k <= n); M[k].classList.toggle('is-current', k === n); }
      }
      if (capN) capN.textContent = n + '/6';
      if (capT) capT.textContent = SOIL_NAMES[n];
      if (meter) meter.style.transform = 'scaleX(' + (n / 6).toFixed(3) + ')';
    }
    if (section) visibilityGate(section, function (on) { section.classList.toggle('is-paused', !on); });
    if (motionOff) {
      steps.forEach(function (s) { s.classList.add('is-active'); });
      layers.forEach(function (l) { l.classList.add('is-in'); });
      nums.forEach(function (n) { n.classList.add('is-in'); });
      if (capN) capN.textContent = '6/6';
      if (capT) capT.textContent = 'Kompletter Aufbau';
      return;
    }
    if (hasGSAP && !reduced()) {
      steps.forEach(function (step, k) {
        var layer = L[k + 1];
        if (layer) {
          ScrollTrigger.create({
            trigger: step, start: 'top 88%', end: 'top 50%',
            onUpdate: function (self) {
              var p = easeOut(self.progress);
              layer.style.opacity = Math.min(1, self.progress * 1.6).toFixed(3);
              layer.style.transform = 'translateY(' + (-46 * (1 - p)).toFixed(2) + 'px)';
            },
            onRefresh: function (self) {
              var p = easeOut(self.progress);
              layer.style.opacity = Math.min(1, self.progress * 1.6).toFixed(3);
              layer.style.transform = 'translateY(' + (-46 * (1 - p)).toFixed(2) + 'px)';
            }
          });
        }
        ScrollTrigger.create({
          trigger: step, start: 'top 60%', end: 'bottom 60%',
          onToggle: function (self) { if (self.isActive) setStep(k + 1, false); },
          onLeaveBack: function () { if (k === 0) setStep(0, false); }
        });
      });
      setStep(0, false);
      return;
    }
    // Fallback ohne GSAP bzw. reduzierte Bewegung: Klassen per IntersectionObserver
    setStep(0, true);
    if (!('IntersectionObserver' in window)) { setStep(6, true); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var k = steps.indexOf(en.target) + 1;
        if (en.isIntersecting) setStep(k, true);
        else if (en.boundingClientRect.top > 0 && cur === k) setStep(k - 1, true);
      });
    }, { rootMargin: '-40% 0px -45% 0px' });
    steps.forEach(function (s) { io.observe(s); });
  }

  /* ------------------------------------------------------------------
     Vorher/Nachher-Regler (Ziehen + Tastatur)
     ------------------------------------------------------------------ */
  function initBeforeAfter() {
    var ba = qs('[data-ba]'), after = qs('[data-ba-after]'), handle = qs('[data-ba-handle]');
    if (!ba || !after || !handle) return;
    var pos = 50, w = ba.clientWidth, dragging = false, touched = false;
    function set(p) {
      pos = clamp(p, 0, 100);
      after.style.clipPath = 'inset(0 0 0 ' + pos.toFixed(2) + '%)';
      handle.style.transform = 'translate3d(' + (pos / 100 * w).toFixed(1) + 'px,0,0)';
      var v = Math.round(pos);
      handle.setAttribute('aria-valuenow', v);
      handle.setAttribute('aria-valuetext', v + ' Prozent – links Bestand 2024, rechts fertiger Garten 2025');
    }
    function fromEvent(e) { var r = ba.getBoundingClientRect(); return (e.clientX - r.left) / r.width * 100; }
    if ('ResizeObserver' in window) new ResizeObserver(function () { w = ba.clientWidth; set(pos); }).observe(ba);
    set(50);
    ba.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      touched = true; dragging = true;
      try { ba.setPointerCapture(e.pointerId); } catch (err) {}
      ba.classList.add('is-dragging');
      set(fromEvent(e));
      if (e.pointerType === 'mouse') { e.preventDefault(); handle.focus({ preventScroll: true }); }
    });
    ba.addEventListener('pointermove', function (e) { if (dragging) set(fromEvent(e)); });
    var end = function () { dragging = false; ba.classList.remove('is-dragging'); };
    ba.addEventListener('pointerup', end);
    ba.addEventListener('pointercancel', end);
    ba.addEventListener('lostpointercapture', end);
    handle.addEventListener('keydown', function (e) {
      var step = e.shiftKey ? 10 : 2, k = e.key, n = null;
      if (k === 'ArrowLeft' || k === 'ArrowDown') n = pos - step;
      else if (k === 'ArrowRight' || k === 'ArrowUp') n = pos + step;
      else if (k === 'PageDown') n = pos - 10;
      else if (k === 'PageUp') n = pos + 10;
      else if (k === 'Home') n = 0;
      else if (k === 'End') n = 100;
      if (n !== null) { e.preventDefault(); touched = true; set(n); }
    });
    // Einmaliger Hinweis beim ersten Sichtkontakt: Regler schwingt kurz
    if (!reduced() && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (en) {
        if (!en[0].isIntersecting) return;
        io.disconnect();
        var t0 = performance.now(), D = 1700;
        (function tick(now) {
          if (touched) return;
          var t = clamp((now - t0) / D, 0, 1);
          set(50 + Math.sin(t * Math.PI * 2) * 14 * (1 - t) * easeOut(Math.min(1, t * 3)));
          if (t < 1) requestAnimationFrame(tick); else set(50);
        })(t0);
      }, { threshold: 0.6 });
      io.observe(ba);
    }
  }

  /* ------------------------------------------------------------------
     Projekte: horizontale Strecke (Desktop gepinnt, mobil nativ)
     ------------------------------------------------------------------ */
  function initProjects() {
    var pin = qs('[data-pj]'), scroller = qs('[data-pj-scroll]'), track = qs('[data-pj-track]'), vp = qs('.pj-viewport');
    if (!pin || !scroller || !track || !vp || !hasGSAP || reduced()) return;
    var st = null;
    function pad() { return parseFloat(getComputedStyle(vp).paddingLeft) || 0; }
    function dist() { return Math.max(0, track.scrollWidth - (vp.clientWidth - 2 * pad())); }
    // Statt GSAP-Pin (position: fixed + Pin-Spacer → Layout-Sprünge/CLS) hält CSS-sticky die Strecke fest;
    // der Container bekommt die Scrollstrecke als Höhe, ScrollTrigger scrubbt nur noch die Verschiebung.
    function setLen() { scroller.style.setProperty('--pj-dist', Math.round(dist()) + 'px'); }
    var mm = gsap.matchMedia();
    mm.add('(min-width: 900px)', function () {
      doc.classList.add('pj-pinned');
      setLen();
      var tween = gsap.to(track, {
        x: function () { return -dist(); }, ease: 'none',
        scrollTrigger: { trigger: scroller, start: 'top top', end: 'bottom bottom', scrub: 0.6, invalidateOnRefresh: true, onRefreshInit: setLen }
      });
      st = tween.scrollTrigger;
      return function () { doc.classList.remove('pj-pinned'); scroller.style.removeProperty('--pj-dist'); st = null; gsap.set(track, { clearProps: 'transform' }); };
    });
    // Tastatur: fokussierte Karte in den sichtbaren Bereich scrollen
    track.addEventListener('focusin', function (e) {
      if (!st) return;
      var card = e.target.closest('.pj-card'); if (!card) return;
      var d = dist(); if (!d) return;
      var p = clamp((card.offsetLeft - pad()) / d, 0, 1);
      var y = st.start + p * (st.end - st.start);
      if (lenis) lenis.scrollTo(y, { immediate: true }); else window.scrollTo(0, y);
    });
  }

  /* ------------------------------------------------------------------
     Pflanzen-Explorer: Standort- und Eigenschaftsfilter, Merkliste
     ------------------------------------------------------------------ */
  function initPlants() {
    var grid = qs('[data-pe-grid]');
    if (!grid) return;
    var cards = qsa('.pe-card', grid);
    var countEl = qs('[data-pe-count]'), countT = qs('[data-pe-count-t]'), empty = qs('[data-pe-empty]');
    var merkEl = qs('[data-pe-merk]'), merkT = qs('[data-pe-merk-t]');
    var light = 'alle', flags = [], fav = [], collapsed = true, SHOW = 8;
    var moreBtn = qs('[data-pe-more]');
    function apply() {
      var first = new Map();
      if (!reduced()) cards.forEach(function (c) { if (c.offsetParent) first.set(c, c.getBoundingClientRect()); });
      var n = 0;
      cards.forEach(function (c) {
        var ls = c.getAttribute('data-light').split(' '), fs = c.getAttribute('data-flags').split(' ');
        var ok = (light === 'alle' || ls.indexOf(light) > -1) && flags.every(function (f) { return fs.indexOf(f) > -1; });
        c.classList.toggle('is-hidden', !ok);
        if (ok) n++;
        c.classList.toggle('is-extra', ok && n > SHOW);
      });
      countEl.textContent = n;
      countT.textContent = n === 1 ? 'Pflanze passt' : 'Pflanzen passen';
      empty.hidden = n > 0;
      if (moreBtn) { moreBtn.hidden = !collapsed || n <= SHOW; moreBtn.textContent = 'Alle ' + n + ' Pflanzen zeigen'; }
      if (reduced() || !cards[0].animate) return;
      cards.forEach(function (c) {
        if (!c.offsetParent) return;
        var last = c.getBoundingClientRect(), f = first.get(c);
        if (f) {
          var dx = f.left - last.left, dy = f.top - last.top;
          if (Math.abs(dx) > 1 || Math.abs(dy) > 1) c.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'none' }], { duration: 420, easing: 'cubic-bezier(0.77, 0, 0.175, 1)' });
        } else {
          c.animate([{ opacity: 0, transform: 'scale(.96)' }, { opacity: 1, transform: 'none' }], { duration: 300, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' });
        }
      });
    }
    if (moreBtn) moreBtn.addEventListener('click', function () {
      collapsed = false;
      grid.classList.remove('is-collapsed');
      moreBtn.hidden = true;
      var nxt = qs('.pe-card.is-extra .pe-fav', grid);
      if (nxt) nxt.focus();
    });
    apply();
    qsa('input[name="pe-light"]').forEach(function (i) { i.addEventListener('change', function () { if (i.checked) { light = i.value; apply(); } }); });
    qsa('.pe-flags input, .pe-flag-row input').forEach(function (i) {
      i.addEventListener('change', function () {
        flags = qsa('.pe-flag-row input').filter(function (x) { return x.checked; }).map(function (x) { return x.value; });
        apply();
      });
    });
    function renderFav() {
      if (!fav.length) {
        merkEl.classList.remove('has-items');
        merkT.textContent = 'Noch nichts gemerkt – tippen Sie auf das Herz, um Pflanzen in Ihre Anfrage zu übernehmen.';
      } else {
        merkEl.classList.add('has-items');
        merkT.textContent = '';
        merkT.appendChild(document.createTextNode(fav.length + (fav.length === 1 ? ' Pflanze' : ' Pflanzen') + ' gemerkt: ' + fav.join(', ') + ' – steht in Ihrer '));
        var a = document.createElement('a'); a.href = '#kontakt'; a.textContent = 'Anfrage';
        merkT.appendChild(a); merkT.appendChild(document.createTextNode('.'));
      }
      if (forms.setPlants) forms.setPlants(fav.slice());
    }
    qsa('.pe-fav', grid).forEach(function (b) {
      b.addEventListener('click', function () {
        var card = b.closest('.pe-card'), name = card.getAttribute('data-name');
        var on = b.getAttribute('aria-pressed') !== 'true';
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        if (on) { fav.push(name); if (!reduced()) { b.classList.remove('beat'); void b.offsetWidth; b.classList.add('beat'); } }
        else fav = fav.filter(function (x) { return x !== name; });
        renderFav();
      });
    });
    plantsApi.clear = function () {
      fav = [];
      qsa('.pe-fav', grid).forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
      renderFav();
    };
  }
  var plantsApi = {};

  /* ------------------------------------------------------------------
     Karte: Orte hervorheben
     ------------------------------------------------------------------ */
  function initMap() {
    var region = qs('.region'), btns = qsa('[data-region-list] button');
    if (region) visibilityGate(region, function (on) { region.classList.toggle('is-paused', !on); });
    function hot(key, on) {
      var g = qs('.map-place[data-place="' + key + '"]');
      if (g) g.classList.toggle('is-hot', on);
      btns.forEach(function (b) { if (b.getAttribute('data-place') === key) b.classList.toggle('is-hot', on); });
    }
    btns.forEach(function (b) {
      var key = b.getAttribute('data-place');
      b.addEventListener('pointerenter', function () { hot(key, true); });
      b.addEventListener('pointerleave', function () { if (document.activeElement !== b) hot(key, false); });
      b.addEventListener('focus', function () { hot(key, true); });
      b.addEventListener('blur', function () { hot(key, false); });
      b.addEventListener('click', function () {
        btns.forEach(function (x) { if (x !== b) hot(x.getAttribute('data-place'), false); });
        hot(key, true);
      });
    });
    qsa('.map-place').forEach(function (g) {
      var key = g.getAttribute('data-place');
      g.addEventListener('pointerenter', function () { hot(key, true); });
      g.addEventListener('pointerleave', function () { hot(key, false); });
    });
  }

  /* ------------------------------------------------------------------
     Anfrageformular (nur clientseitig)
     ------------------------------------------------------------------ */
  var forms = {};
  function initForm() {
    var form = qs('[data-form]'), success = qs('[data-form-success]');
    if (!form || !success) return;
    var summaryEl = qs('[data-form-summary]'), status = qs('[data-form-status]');
    var sketchBox = qs('[data-form-sketch]'), mini = qs('[data-form-mini]'), sketchSum = qs('[data-form-sketch-sum]');
    var plantsBox = qs('[data-form-plants]'), plantsList = qs('[data-form-plants-list]');
    var sketch = null, plants = [], tried = false;
    var MINI = { terrasse: '#D3C9B4', weg: '#BFB399', rasen: 'var(--lawn-c)', beet: 'var(--bloom-0)', teich: 'var(--water-a)', baum: 'var(--leaf-a)' };

    forms.setSketch = function (st, text) {
      sketch = { state: st, text: text };
      mini.textContent = '';
      st.forEach(function (t) { var s = document.createElement('span'); s.style.background = t ? MINI[t] : 'transparent'; mini.appendChild(s); });
      sketchSum.textContent = text;
      sketchBox.hidden = false;
      var cb = qs('input[name="leistung"][value="Gartenplanung"]', form); if (cb) cb.checked = true;
    };
    forms.setPlants = function (list) {
      plants = list;
      plantsList.textContent = list.join(', ');
      plantsBox.hidden = !list.length;
    };
    qs('[data-form-sketch-remove]').addEventListener('click', function () { sketch = null; sketchBox.hidden = true; qs('#f-msg').focus(); });
    qs('[data-form-plants-remove]').addEventListener('click', function () { if (plantsApi.clear) plantsApi.clear(); else forms.setPlants([]); qs('#f-msg').focus(); });

    var F = {
      name: qs('#f-name'), ort: qs('#f-plz'), mail: qs('#f-mail'), tel: qs('#f-tel'), ds: qs('#f-ds'),
      size: qs('#f-size'), when: qs('#f-when'), msg: qs('#f-msg')
    };
    function setErr(input, msg) {
      var err = qs('#' + input.id + '-err');
      if (msg) { input.setAttribute('aria-invalid', 'true'); if (err) err.textContent = msg; }
      else { input.removeAttribute('aria-invalid'); if (err) err.textContent = ''; }
    }
    function validate() {
      var bad = [];
      var name = F.name.value.trim(), ort = F.ort.value.trim(), mail = F.mail.value.trim(), tel = F.tel.value.trim();
      if (name.length < 2) { setErr(F.name, 'Bitte geben Sie Ihren Namen an.'); bad.push(F.name); } else setErr(F.name);
      if (!/\b\d{5}\b/.test(ort)) { setErr(F.ort, 'Bitte Postleitzahl und Ort angeben, z. B. 34119 Kassel.'); bad.push(F.ort); } else setErr(F.ort);
      var mailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail), telOk = tel.replace(/\D/g, '').length >= 6;
      if (mail && !mailOk) { setErr(F.mail, 'Bitte prüfen Sie die E-Mail-Adresse.'); bad.push(F.mail); }
      else if (!mail && !tel) { setErr(F.mail, 'Bitte E-Mail oder Telefon angeben, damit wir Sie erreichen.'); bad.push(F.mail); }
      else setErr(F.mail);
      if (tel && !telOk) { setErr(F.tel, 'Bitte prüfen Sie die Telefonnummer.'); bad.push(F.tel); } else setErr(F.tel);
      if (!F.ds.checked) { setErr(F.ds, 'Bitte stimmen Sie der Verarbeitung Ihrer Angaben zu.'); bad.push(F.ds); } else setErr(F.ds);
      return bad;
    }
    form.addEventListener('input', function () { if (tried) validate(); });
    form.addEventListener('change', function () { if (tried) validate(); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      tried = true;
      var bad = validate();
      if (bad.length) {
        status.textContent = 'Bitte prüfen Sie ' + (bad.length === 1 ? 'das markierte Feld.' : 'die ' + bad.length + ' markierten Felder.');
        bad[0].focus();
        return;
      }
      var leist = qsa('input[name="leistung"]:checked', form).map(function (x) { return x.value; });
      var rows = [
        ['Name', F.name.value.trim()],
        ['Ort', F.ort.value.trim()],
        ['E-Mail', F.mail.value.trim()],
        ['Telefon', F.tel.value.trim()],
        ['Anliegen', leist.join(', ')],
        ['Gartengröße', F.size.value],
        ['Zeitraum', F.when.value],
        ['Skizze', sketch ? sketch.text : ''],
        ['Pflanzen', plants.join(', ')],
        ['Nachricht', F.msg.value.trim()]
      ];
      summaryEl.textContent = '';
      rows.forEach(function (r) {
        if (!r[1]) return;
        var dt = document.createElement('dt'); dt.textContent = r[0];
        var dd = document.createElement('dd'); dd.textContent = r[1];
        summaryEl.appendChild(dt); summaryEl.appendChild(dd);
      });
      form.hidden = true;
      success.hidden = false;
      status.textContent = '';
      var top = qs('#kontakt');
      if (top && success.getBoundingClientRect().top < headerOffset()) scrollToTarget(top, { focusEl: success });
      else success.focus({ preventScroll: true });
    });
    qs('[data-form-reset]').addEventListener('click', function () {
      form.reset(); tried = false;
      [F.name, F.ort, F.mail, F.tel, F.ds].forEach(function (i) { setErr(i); });
      if (sketch) { var cb = qs('input[name="leistung"][value="Gartenplanung"]', form); if (cb) cb.checked = true; }
      success.hidden = true; form.hidden = false;
      F.name.focus();
    });
  }

  /* ------------------------------------------------------------------
     Start
     ------------------------------------------------------------------ */
  function init() {
    // Sofort: alles, was den ersten Bildschirm betrifft
    safe('scroll', initScroll);
    safe('header', initHeader);
    safe('menu', initMenu);
    safe('seasons', initSeasons);
    safe('intro', initIntro);
    safe('contours', initContours);
    safe('reveal', initReveal);
    // Danach in eigenen kurzen Tasks (kein langer Start-Task, Intro und Eingaben bleiben flüssig)
    var queue = [
      ['services', initServices], ['form', initForm], ['planner', initPlanner], ['soil', initSoil],
      ['beforeAfter', initBeforeAfter], ['projects', initProjects], ['plants', initPlants], ['map', initMap]
    ];
    (function next() {
      var job = queue.shift();
      if (!job) { if (hasGSAP) ScrollTrigger.refresh(); return; }
      safe(job[0], job[1]);
      setTimeout(next, 0);
    })();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
