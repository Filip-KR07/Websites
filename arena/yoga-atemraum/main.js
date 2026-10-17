/* ==========================================================================
   Atemraum Yoga – Modell „Atem“ · main.js
   Ohne Build, ohne externe Requests. GSAP/ScrollTrigger/Lenis liegen lokal.
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------------
     Konstanten – hier lassen sich Preise, Atemrhythmen usw. anpassen.
     ------------------------------------------------------------------------ */

  // Preise in Euro (regulär). Ermäßigt: feste, gerundete Werte (−20 %).
  var PRICES = { probe: 39, karte: 150, abo: 79, single: 18 };
  var PRICES_REDUCED = { probe: 39, karte: 120, abo: 63, single: 14 }; // Probemonat nicht ermäßigbar
  var CLASSES_PER_CARD = 10;
  var WEEKS_PER_MONTH = 52 / 12; // ≈ 4,33 – für die Beispielrechnung

  // Geführte Atemübung: Phasen in Sekunden, Anzahl Runden.
  var BREATH_PATTERNS = {
    box: {
      label: 'Box-Atmung', rounds: 6,
      phases: [
        { key: 'in', name: 'Einatmen', s: 4 },
        { key: 'hold', name: 'Halten', s: 4 },
        { key: 'out', name: 'Ausatmen', s: 4 },
        { key: 'empty', name: 'Halten', s: 4 }
      ]
    },
    '478': {
      label: '4-7-8-Atmung', rounds: 4,
      phases: [
        { key: 'in', name: 'Einatmen', s: 4 },
        { key: 'hold', name: 'Halten', s: 7 },
        { key: 'out', name: 'Ausatmen', s: 8 }
      ]
    }
  };
  var BREATH_SCALE = { min: 0.6, max: 1 }; // Größe des Atemkreises

  // Hero: Atemzyklus 4-7-8 (Sekunden ein / halten / aus) – muss zu @keyframes breathe-w passen (19 s).
  var HERO_BREATH = { inhale: 4, hold: 7, exhale: 8 };

  // Karte: Ausschnitt auf schmalen Bildschirmen (x y Breite Höhe im SVG-Koordinatensystem)
  var MAP_MOBILE_VIEWBOX = '222 0 576 560';

  var DAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
  var DAYS_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  var LEVELS = { einsteiger: 'Einsteiger', mittel: 'Mittel', erfahren: 'Erfahren' };
  var ROOMS = { weite: 'Raum Weite · 110 m²', stille: 'Raum Stille · 45 m²' };

  var STYLES = {
    hatha: {
      name: 'Hatha',
      desc: 'Haltungen werden einzeln aufgebaut, erklärt und eine Weile gehalten – mit Pausen und Atemanleitung.',
      lead: 'Ruhig, klar erklärt und ohne Eile: Sie lernen die Haltungen von Grund auf.',
      why: 'Sie möchten verstehen, was Sie tun, und Ihr eigenes Tempo finden. Hatha gibt Ihnen genau dafür Zeit.',
      first: 'Viele Erklärungen, Varianten mit Block und Gurt, am Ende zehn Minuten Entspannung.'
    },
    vinyasa: {
      name: 'Vinyasa',
      desc: 'Fließende Abfolgen, eine Bewegung pro Atemzug. Es wird warm – zu jeder Abfolge gibt es eine ruhigere Variante.',
      lead: 'Bewegung im Rhythmus des Atems – Sie werden warm, der Kopf wird frei.',
      why: 'Sie bewegen sich gern und kommen über Bewegung zur Ruhe. Vinyasa verbindet beides.',
      first: 'Starten Sie mit einem Morgen-Flow oder Slow Flow; die Lehrenden zeigen Ihnen die Grundabfolge vorab.'
    },
    yin: {
      name: 'Yin',
      desc: 'Wenige passive Haltungen am Boden, jeweils drei bis fünf Minuten, gestützt von Kissen und Blöcken.',
      lead: 'Lange halten, weich werden – ungewohnt still und genau deshalb wohltuend.',
      why: 'Ihr Körper sitzt viel, Ihr Kopf läuft ständig. Yin gibt beiden Zeit, langsamer zu werden.',
      first: 'Sechs bis acht Haltungen, viel Unterstützung, gedimmtes Licht. Warme Socken lohnen sich.'
    },
    restorative: {
      name: 'Restorative',
      desc: 'Kaum Bewegung, viel Unterstützung durch Bolster, Decken und Sandsäcke. Oft mit geführter Tiefenentspannung.',
      lead: 'Gehalten werden: Sie liegen bequem gestützt und dürfen einfach loslassen.',
      why: 'Sie brauchen gerade eher Erholung als Training. Restorative fordert nichts und gibt Raum zum Durchatmen.',
      first: 'Vier bis fünf Haltungen im Liegen, viel Ruhe und zum Abschluss eine Tiefenentspannung.'
    }
  };
  var TIE_ORDER = ['hatha', 'yin', 'vinyasa', 'restorative'];

  var TEACHERS = {
    mira: { name: 'Mira Lindqvist', mono: 'ML', bio: 'Gründerin · Hatha & Yin · 500 h Ausbildung', color: '#A9B8A2' },
    jonas: { name: 'Jonas Albers', mono: 'JA', bio: 'Vinyasa · 300 h · früher Leistungsruderer', color: '#B9826A' },
    aylin: { name: 'Aylin Demir', mono: 'AD', bio: 'Yin & Vinyasa · 300 h · Faszien-Fortbildung', color: '#7E9178' },
    paul: { name: 'Paul Hennig', mono: 'PH', bio: 'Hatha & Yoga 60+ · Physiotherapeut', color: '#C9B48F' },
    lea: { name: 'Lea Vossberg', mono: 'LV', bio: 'Restorative & Yoga Nidra', color: '#A9B8A2' },
    nora: { name: 'Nora Kemper', mono: 'NK', bio: 'Mama & Baby · Pränatal-Yoga', color: '#B9826A' },
    tomas: { name: 'Tomás Ribeiro', mono: 'TR', bio: 'Morgen-Flow & Umkehrhaltungen · 300 h', color: '#7E9178' }
  };

  /* ------------------------------------------------------------------------
     Grundlagen
     ------------------------------------------------------------------------ */
  var d = document.documentElement;
  var motionOff = d.classList.contains('motion-off');
  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduced = function () { return motionOff || mqReduce.matches; };
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasGSAP = !!(window.gsap && window.ScrollTrigger);
  if (hasGSAP) window.gsap.registerPlugin(window.ScrollTrigger);
  var lenis = null;
  var NBSP = ' ';

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function easeInOutSine(t) { return -(Math.cos(Math.PI * t) - 1) / 2; }
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
  function euro(n) { return Math.round(n).toLocaleString('de-DE') + NBSP + '€'; }
  function safe(fn, name) { try { fn(); } catch (e) { if (window.console) console.warn('[Atemraum] ' + name, e); } }
  function headerOffset() { var h = $('[data-header]'); return h ? h.offsetHeight : 0; }

  /* ------------------------------------------------------------------------
     Smooth Scroll (Lenis) + Anker
     ------------------------------------------------------------------------ */
  function initScroll() {
    if (!reduced() && window.Lenis) {
      lenis = new window.Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.95, anchors: false });
      window.__lenis = lenis;
      if (hasGSAP) {
        lenis.on('scroll', window.ScrollTrigger.update);
        window.gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
        window.gsap.ticker.lagSmoothing(0);
      } else {
        var raf = function (t) { lenis.raf(t); requestAnimationFrame(raf); };
        requestAnimationFrame(raf);
      }
    }
  }

  function scrollToTarget(target, done) {
    if (!target) return;
    var focus = function () {
      if (!target.hasAttribute('tabindex') && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(target.tagName)) target.setAttribute('tabindex', '-1');
      try { target.focus({ preventScroll: true }); } catch (e) { target.focus(); }
      if (done) done();
    };
    var y = target.getBoundingClientRect().top + window.pageYOffset - headerOffset() + 1;
    if (lenis) {
      lenis.scrollTo(y, { duration: 1.5, easing: function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }, onComplete: focus });
    } else {
      window.scrollTo({ top: y, behavior: reduced() ? 'auto' : 'smooth' });
      setTimeout(focus, reduced() ? 0 : 700);
    }
  }

  function initAnchors() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute('href').slice(1);
      if (!id) return;
      var target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      var menu = $('#menu');
      if (menu && menu.open) closeMenu(true);
      if (history.replaceState) history.replaceState(null, '', '#' + id);
      scrollToTarget(target);
    });
  }

  /* ------------------------------------------------------------------------
     Header: Zustand, Fortschritt, aktuelle Sektion
     ------------------------------------------------------------------------ */
  function initHeader() {
    var header = $('[data-header]');
    var bar = $('[data-progress]');
    var sunDot = $('[data-sun-dot]');
    if (!header) return;
    var lastY = window.pageYOffset, ticking = false;
    function update() {
      ticking = false;
      var y = window.pageYOffset;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      header.classList.toggle('is-scrolled', y > 24);
      var menuOpen = $('#menu') && $('#menu').open;
      var focusInside = header.contains(document.activeElement);
      if (y > 220 && y > lastY + 4 && !menuOpen && !focusInside) header.classList.add('is-hidden');
      else if (y < lastY - 4 || y <= 220) header.classList.remove('is-hidden');
      lastY = y;
      var pr = max > 0 ? clamp(y / max, 0, 1) : 0;
      if (bar) bar.style.transform = 'scaleX(' + pr.toFixed(4) + ')';
      if (sunDot) sunDot.style.transform = 'translateX(' + (pr * (header.clientWidth - 8)).toFixed(1) + 'px)';
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
    window.addEventListener('scroll', onScroll, { passive: true });
    header.addEventListener('focusin', function () { header.classList.remove('is-hidden'); });
    update();

    // aktuelle Sektion in der Navigation
    var links = $$('.main-nav a');
    var map = {};
    links.forEach(function (l) { map[l.getAttribute('href').slice(1)] = l; });
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          var l = map[en.target.id];
          if (en.target.id === 'start' && en.isIntersecting) {
            links.forEach(function (x) { x.classList.remove('is-current'); x.removeAttribute('aria-current'); });
            return;
          }
          if (!l) return;
          if (en.isIntersecting) {
            links.forEach(function (x) { x.classList.remove('is-current'); x.removeAttribute('aria-current'); });
            l.classList.add('is-current');
            l.setAttribute('aria-current', 'true');
          }
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      Object.keys(map).concat('start').forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
    }
  }

  /* ------------------------------------------------------------------------
     Mobiles Menü (dialog)
     ------------------------------------------------------------------------ */
  var menuBtn;
  function openMenu() {
    var m = $('#menu');
    if (!m || m.open) return;
    m.showModal();
    menuBtn.setAttribute('aria-expanded', 'true');
    if (lenis) lenis.stop();
    requestAnimationFrame(function () { m.classList.add('is-open'); });
  }
  function closeMenu(instant) {
    var m = $('#menu');
    if (!m || !m.open) return;
    m.classList.remove('is-open');
    menuBtn.setAttribute('aria-expanded', 'false');
    var fin = function () { m.close(); if (lenis) lenis.start(); };
    if (instant || reduced()) fin(); else setTimeout(fin, 220);
  }
  function initMenu() {
    menuBtn = $('[data-menu-open]');
    var m = $('#menu');
    if (!menuBtn || !m || typeof m.showModal !== 'function') return;
    menuBtn.addEventListener('click', openMenu);
    $$('[data-menu-close]', m).forEach(function (b) { b.addEventListener('click', function () { closeMenu(); menuBtn.focus(); }); });
    m.addEventListener('cancel', function (e) { e.preventDefault(); closeMenu(); menuBtn.focus(); });
    window.matchMedia('(min-width: 1041px)').addEventListener('change', function (e) { if (e.matches) closeMenu(true); });
  }

  /* ------------------------------------------------------------------------
     Reveals
     ------------------------------------------------------------------------ */
  function initReveal() {
    var els = $$('[data-reveal]');
    if (motionOff || !('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add('is-in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      var batch = entries.filter(function (en) { return en.isIntersecting; }).map(function (en) { return en.target; });
      batch.forEach(function (el, i) {
        el.style.transitionDelay = Math.min(i, 6) * 70 + 'ms';
        el.classList.add('is-in');
        io.unobserve(el);
        setTimeout(function () { el.style.transitionDelay = ''; }, 1600);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    els.forEach(function (el) { io.observe(el); });
  }

  // Der Hero-Auftakt läuft als CSS-Animation (style.css, [data-hero-in]) –
  // ohne auf JS oder Schriften zu warten.

  /* ------------------------------------------------------------------------
     Hero-Canvas: fließende, atmende Formen (Perlin-Noise), die beim Scrollen
     zur Ruhe kommen. Das Hero-Foto wird in eine atmende Blob-Maske gezeichnet.
     ------------------------------------------------------------------------ */
  function makeNoise(seed) {
    var perm = [], p = new Uint8Array(512), s = seed, i;
    for (i = 0; i < 256; i++) perm[i] = i;
    var rnd = function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
    for (i = 255; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)), t = perm[i]; perm[i] = perm[j]; perm[j] = t; }
    for (i = 0; i < 512; i++) p[i] = perm[i & 255];
    function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
    function grad(h, x, y, z) {
      h &= 15;
      var u = h < 8 ? x : y, v = h < 4 ? y : (h === 12 || h === 14 ? x : z);
      return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }
    return function (x, y, z) {
      var X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
      x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
      var u = fade(x), v = fade(y), w = fade(z);
      var A = p[X] + Y, AA = p[A] + Z, AB = p[A + 1] + Z, B = p[X + 1] + Y, BA = p[B] + Z, BB = p[B + 1] + Z;
      return lerp(
        lerp(lerp(grad(p[AA], x, y, z), grad(p[BA], x - 1, y, z), u), lerp(grad(p[AB], x, y - 1, z), grad(p[BB], x - 1, y - 1, z), u), v),
        lerp(lerp(grad(p[AA + 1], x, y, z - 1), grad(p[BA + 1], x - 1, y, z - 1), u), lerp(grad(p[AB + 1], x, y - 1, z - 1), grad(p[BB + 1], x - 1, y - 1, z - 1), u), v),
        w);
    };
  }

  // 4-7-8: b = Füllung der Lunge (0 … 1). Dieselben Anteile wie @keyframes breathe-w.
  function heroBreath(time) {
    var c = HERO_BREATH.inhale + HERO_BREATH.hold + HERO_BREATH.exhale;
    var t = ((time % c) + c) % c;
    if (t < HERO_BREATH.inhale) return { b: easeInOutSine(t / HERO_BREATH.inhale), inhale: true, phase: 0 };
    t -= HERO_BREATH.inhale;
    if (t < HERO_BREATH.hold) return { b: 1 - 0.05 * easeInOutSine(t / HERO_BREATH.hold), inhale: true, phase: 1 };
    t -= HERO_BREATH.hold;
    return { b: 0.95 * (1 - easeInOutSine(t / HERO_BREATH.exhale)), inhale: false, phase: 2 };
  }

  function initHero() {
    var canvas = $('[data-hero-canvas]');
    var hero = $('.hero');
    var stage = $('.hero-stage');
    if (!canvas || !canvas.getContext || !hero || !stage) return;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;
    var clockEl = $('.ht-1');
    var noise = makeNoise(11);
    var W = 0, H = 0, dpr = 1, R0 = 100;
    var raf = 0, visible = true, calm = 0, last = 0, fallbackT0 = performance.now();
    var mouse = { x: 0, y: 0, tx: 0, ty: 0, in: 0, tin: 0 };
    var still = reduced();
    var anim = null;
    var FRAME_MS = 1000 / 30; // langsame Formen: 30 Bilder/s genügen
    var C = { sage: '#A9B8A2', sageHi: '#C9D3C1', sageLo: '#8EA187', clay: '#B9826A', forest: '#26332B', line: 'rgba(38, 51, 43,' };

    // Dieselbe Uhr wie die atmende Headline (CSS-Animation auf .ht-1)
    function clock(now) {
      if (!anim && clockEl && clockEl.getAnimations) {
        var list = clockEl.getAnimations();
        for (var i = 0; i < list.length; i++) if (list[i].animationName === 'breathe-w') anim = list[i];
      }
      if (anim && anim.currentTime != null) return Number(anim.currentTime) / 1000;
      return (now - fallbackT0) / 1000;
    }

    function measure() {
      var r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.round(W * dpr));
      canvas.height = Math.max(1, Math.round(H * dpr));
      R0 = (W / 1.28) / 2 * 0.74; // Grundradius relativ zur Bühne (Orbit liegt bei 0,907)
    }

    var PTS = new Float32Array(2 * 128);
    function shape(cx, cy, r, seed, amp, t, n, bulge, ang) {
      var i;
      for (i = 0; i < n; i++) {
        var a = (i / n) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
        var nv = noise(c * 0.9 + seed, s * 0.9 + seed * 1.37, t);
        var k = 1 + amp * nv;
        if (bulge) { var dd = Math.cos(a - ang); if (dd > 0) k += bulge * dd * dd * dd; }
        PTS[i * 2] = cx + c * r * k; PTS[i * 2 + 1] = cy + s * r * k;
      }
      ctx.beginPath();
      var lx = PTS[(n - 1) * 2], ly = PTS[(n - 1) * 2 + 1];
      ctx.moveTo((lx + PTS[0]) / 2, (ly + PTS[1]) / 2);
      for (i = 0; i < n; i++) {
        var x1 = PTS[i * 2], y1 = PTS[i * 2 + 1], j = ((i + 1) % n) * 2;
        ctx.quadraticCurveTo(x1, y1, (x1 + PTS[j]) / 2, (y1 + PTS[j + 1]) / 2);
      }
      ctx.closePath();
    }

    function draw(time) {
      var br = heroBreath(time);
      var amp = 1 - 0.75 * calm;
      var b = br.b;
      var t = time * 0.07;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      var cx = W / 2 + mouse.x * R0 * 0.05, cy = H / 2 + mouse.y * R0 * 0.05;
      var r = R0 * (0.82 + 0.18 * b * (1 - 0.4 * calm));
      var ang = Math.atan2(mouse.y, mouse.x), bulge = 0.09 * mouse.in * amp;

      // Höhenlinien: folgen dem Atem verzögert – wie Wellen auf dem Wasser
      ctx.lineWidth = 1;
      for (var k = 4; k >= 1; k--) {
        var lag = heroBreath(time - k * 0.42).b;
        var rk = R0 * (0.82 + 0.18 * lag) * (1 + k * 0.075);
        ctx.strokeStyle = C.line + (0.2 - k * 0.035).toFixed(3) + ')';
        shape(cx, cy, rk, 1.3 + k * 0.4, (0.07 + k * 0.012) * amp, t - k * 0.06, 96, bulge * 0.6, ang);
        ctx.stroke();
      }
      // Die Form selbst
      var g = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.42, r * 0.1, cx, cy, r * 1.1);
      g.addColorStop(0, C.sageHi); g.addColorStop(0.55, C.sage); g.addColorStop(1, C.sageLo);
      ctx.fillStyle = g;
      shape(cx, cy, r, 1.3, 0.075 * amp, t, 120, bulge, ang);
      ctx.fill();
      // Bleistiftkontur, minimal versetzt
      ctx.strokeStyle = C.line + '.32)';
      shape(cx + r * 0.015, cy - r * 0.01, r * 1.006, 2.6, 0.08 * amp, t + 0.3, 110, bulge, ang);
      ctx.stroke();
      // Lehm-Kiesel wandert langsam um die Form, Waldgrün-Punkt gegenüber
      var pa = time * 0.035 + 2.2;
      ctx.fillStyle = C.clay;
      shape(cx + Math.cos(pa) * r * 1.02, cy + Math.sin(pa) * r * 1.02, R0 * (0.13 + 0.015 * b), 7.7, 0.18 * amp, t * 1.3, 48, 0, 0);
      ctx.fill();
      ctx.fillStyle = C.forest;
      shape(cx + Math.cos(pa + 2.6) * r * 0.96, cy + Math.sin(pa + 2.6) * r * 0.96, R0 * 0.045, 3.1, 0.2 * amp, t * 1.5, 32, 0, 0);
      ctx.fill();
    }

    function frame(now) {
      raf = 0;
      if (!visible || document.hidden) { last = 0; return; }
      if (last && now - last < FRAME_MS - 2) { raf = requestAnimationFrame(frame); return; }
      var dt = last ? Math.min(0.1, (now - last) / 1000) : 1 / 30;
      last = now;
      var k60 = dt * 60;
      var target = clamp(window.pageYOffset / (hero.offsetHeight * 0.8), 0, 1);
      calm += (target - calm) * (1 - Math.pow(1 - 0.04, k60));
      var km = 1 - Math.pow(1 - 0.06, k60); // Feder-ähnliches Nachziehen
      mouse.x += (mouse.tx - mouse.x) * km;
      mouse.y += (mouse.ty - mouse.y) * km;
      mouse.in += (mouse.tin - mouse.in) * km;
      draw(clock(now));
      raf = requestAnimationFrame(frame);
    }
    var running = false;
    function start() { if (!raf && !still && running) raf = requestAnimationFrame(frame); }

    measure();
    draw(still ? 1.6 : clock(performance.now()));
    d.classList.add(still ? 'has-canvas-still' : 'has-canvas');

    var redraw = function () { measure(); draw(still ? 1.6 : clock(performance.now())); };
    if ('ResizeObserver' in window) new ResizeObserver(redraw).observe(stage);
    else window.addEventListener('resize', redraw);
    if (still) return;

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) start(); }).observe(hero);
    }
    document.addEventListener('visibilitychange', function () { if (!document.hidden) start(); });
    if (finePointer) {
      hero.addEventListener('pointermove', function (e) {
        var r = stage.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2), dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        var dist = Math.sqrt(dx * dx + dy * dy);
        mouse.tx = clamp(dx, -1.4, 1.4); mouse.ty = clamp(dy, -1.4, 1.4);
        mouse.tin = clamp(1.6 - dist, 0, 1); // je näher am Rand, desto stärker wölbt sich die Form
      });
      hero.addEventListener('pointerleave', function () { mouse.tx = 0; mouse.ty = 0; mouse.tin = 0; });
    }
    var go = function () { setTimeout(function () { running = true; start(); }, 250); };
    if (document.readyState === 'complete') go();
    else window.addEventListener('load', go, { once: true });
  }

  /* ------------------------------------------------------------------------
     Himmel: Die Seite wandert von Morgen zu Abend. Jede Sektion trägt ihre
     Tageszeit (data-sky); gemischt wird erst im letzten Drittel einer Sektion.
     ------------------------------------------------------------------------ */
  function initSky() {
    var layer = $('[data-sky-layer]');
    var secs = $$('[data-sky]');
    var header = $('[data-header]');
    if (!layer || !secs.length) return;
    var stops = [], ticking = false, lastC = '';
    var hex = function (h) { return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]; };
    var cols = secs.map(function (s) { return hex(s.getAttribute('data-sky')); });
    function measure() {
      var y0 = window.pageYOffset;
      stops = secs.map(function (s, i) { return { y: s.getBoundingClientRect().top + y0, h: s.offsetHeight, c: cols[i] }; });
      update();
    }
    function update() {
      ticking = false;
      var y = window.pageYOffset + window.innerHeight * 0.55;
      var i = 0;
      while (i < stops.length - 1 && stops[i + 1].y <= y) i++;
      var a = stops[i], b = stops[i + 1] || a;
      var f = a.h ? clamp((y - a.y) / a.h, 0, 1) : 0;
      f = easeInOutSine(clamp((f - 0.62) / 0.38, 0, 1));
      var c = [0, 1, 2].map(function (k) { return Math.round(lerp(a.c[k], b.c[k], f)); });
      var key = c.join(',');
      if (key === lastC) return;
      lastC = key;
      layer.style.backgroundColor = 'rgb(' + key + ')';
      if (header) header.style.setProperty('--hb', key);
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', measure);
    window.addEventListener('load', measure);
    if (hasGSAP) window.ScrollTrigger.addEventListener('refresh', measure);
    measure();
    d.classList.add('has-sky');
  }

  /* Überschriften: Wörter steigen aus einer Maske auf */
  function initSplit() {
    if (motionOff || reduced() || !('IntersectionObserver' in window)) return;
    var hs = $$('[data-split]');
    hs.forEach(function (h) {
      var words = h.textContent.trim().split(/ +/);
      h.textContent = '';
      words.forEach(function (w, i) {
        var o = document.createElement('span'), inner = document.createElement('span');
        o.className = 'sw-w';
        inner.textContent = w;
        inner.style.setProperty('--wi', i);
        o.appendChild(inner);
        h.appendChild(o);
        if (i < words.length - 1) h.appendChild(document.createTextNode(' '));
      });
      h.classList.add('split-ready');
    });
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    hs.forEach(function (h) { io.observe(h); });
  }

  /* Kärtchen auf der Matte: dreht sich einmal um – und wieder zurück */
  function initConsent() {
    var c = $('[data-flip]');
    if (!c) return;
    if (finePointer) c.parentNode.addEventListener('pointerenter', function () { c.classList.toggle('is-flipped'); });
    if (motionOff || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (en) {
      if (!en[0].isIntersecting) return;
      io.disconnect();
      setTimeout(function () { c.classList.add('is-flipped'); }, 900);
      setTimeout(function () { c.classList.remove('is-flipped'); }, 3600);
    }, { threshold: 0.7 });
    io.observe(c);
  }

  /* Magnetische Knöpfe (nur feiner Zeiger) – über die translate-Eigenschaft,
     damit :active { transform: scale(.97) } unberührt bleibt */
  function initMagnetic() {
    if (!finePointer || reduced()) return;
    $$('[data-magnetic]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        el.style.translate = (x * 12).toFixed(1) + 'px ' + (y * 10).toFixed(1) + 'px';
      });
      el.addEventListener('pointerleave', function () { el.style.translate = ''; });
    });
  }

  /* Stil-Wellen auf dem Handy: zeichnen sich, sobald sie sichtbar werden */
  function initWaves() {
    var panels = $$('.style-panel');
    if (motionOff || !('IntersectionObserver' in window)) { panels.forEach(function (p) { p.classList.add('is-drawn'); }); return; }
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-drawn'); io.unobserve(e.target); } });
    }, { threshold: 0.25 });
    panels.forEach(function (p) { io.observe(p); });
  }

  /* ------------------------------------------------------------------------
     Haltung: Wort-für-Wort-Scrub + Zähler
     ------------------------------------------------------------------------ */
  function initEthos() {
    var h = $('[data-words]');
    if (h && hasGSAP && !reduced()) {
      var text = h.textContent.replace(/\s*\n\s*/g, ' ').trim();
      h.textContent = '';
      var parts = text.split(/( +)/);
      var words = [];
      parts.forEach(function (p) {
        if (/^ +$/.test(p)) { h.appendChild(document.createTextNode(' ')); return; }
        var s = document.createElement('span');
        s.className = 'w';
        s.textContent = p;
        h.appendChild(s);
        words.push(s);
      });
      window.gsap.fromTo(words, { opacity: 0.16 }, {
        opacity: 1, ease: 'none', stagger: 0.12,
        scrollTrigger: { trigger: h, start: 'top 82%', end: 'bottom 48%', scrub: 0.6 }
      });
    }
    // Zähler
    var nums = $$('[data-count]');
    if (reduced() || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        var el = en.target, to = parseInt(el.getAttribute('data-count'), 10), from = to === 0 ? 9 : 0;
        var t0 = performance.now(), dur = 1800;
        (function step(now) {
          var p = clamp((now - t0) / dur, 0, 1);
          el.textContent = String(Math.round(lerp(from, to, easeOutCubic(p))));
          if (p < 1) requestAnimationFrame(step);
        })(t0);
      });
    }, { threshold: 0.6 });
    nums.forEach(function (n) { io.observe(n); });
  }

  /* ------------------------------------------------------------------------
     Scroll-Choreografie (GSAP): Stile horizontal, Parallaxe, Pfad
     ------------------------------------------------------------------------ */
  function initChoreo() {
    if (!hasGSAP || reduced()) return;
    var gsap = window.gsap, ST = window.ScrollTrigger;
    var mm = gsap.matchMedia();

    mm.add('(min-width: 900px)', function () {
      var section = $('.styles');
      var pin = $('[data-styles-pin]');
      var track = $('[data-styles-track]');
      var num = $('[data-sp-num]');
      var line = $('[data-sp-line]');
      var tween = null;
      var setDist = null;
      if (section && pin && track) {
        d.classList.add('is-hscroll');
        var panels = $$('.style-panel', track);
        var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
        // Kein ScrollTrigger-Pin (position: fixed + Spacer erzeugt Layout-Shifts),
        // sondern CSS „position: sticky“: Die Sektion wird um die Strecke höher,
        // die Bühne klebt oben, GSAP schiebt nur die Spur.
        setDist = function () { section.style.setProperty('--hs-dist', dist() + 'px'); };
        setDist();
        ST.addEventListener('refreshInit', setDist);
        // Fokus: Die Tafel in der Mitte ist voll da, die angeschnittenen Nachbarn
        // treten zurück – so wirkt der Anschnitt gewollt statt abgeschnitten.
        var focusPanels = function (prog) {
          var pos = prog * (panels.length - 1);
          panels.forEach(function (p, k) {
            var w = clamp(1 - Math.abs(pos - k) * 1.35, 0, 1);
            p.style.opacity = (0.22 + 0.78 * w).toFixed(3);
          });
        };
        tween = gsap.to(track, {
          x: function () { return -dist(); },
          ease: 'none',
          onUpdate: function () { focusPanels(this.progress()); },
          scrollTrigger: {
            trigger: section, scrub: 0.8, invalidateOnRefresh: true,
            start: 'top top',
            end: function () { return '+=' + dist(); },
            onUpdate: function (self) {
              var i = Math.min(panels.length - 1, Math.round(self.progress * (panels.length - 1)));
              if (num) num.textContent = '0' + (i + 1);
              if (line) line.style.transform = 'scaleX(' + (0.25 + 0.75 * self.progress).toFixed(3) + ')';
            }
          }
        });
        focusPanels(0);
        panels.forEach(function (p) {
          var im = p.querySelector('img');
          if (im) {
            gsap.fromTo(im, { xPercent: 6, scale: 1.14 }, {
              xPercent: -6, scale: 1.14, ease: 'none',
              scrollTrigger: { trigger: p, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true }
            });
          }
          // Die Atemlinie zeichnet sich mit der Strecke – jede mit ihrem Tempo
          var wave = p.querySelector('[data-wave]');
          if (wave) {
            gsap.fromTo(wave, { strokeDashoffset: 1 }, {
              strokeDashoffset: 0, ease: 'none',
              scrollTrigger: { trigger: p, containerAnimation: tween, start: 'left 92%', end: 'right 70%', scrub: true }
            });
          }
        });
      }
      // Atemübung: Die Nacht wächst als Kreis auf, dann erscheint die Übung
      var bSec = $('.breathe'), bloom = $('[data-bloom]'), bContent = $('[data-breathe-content]');
      var setBloom = null;
      if (bSec && bloom && bContent) {
        d.classList.add('is-bloom');
        setBloom = function () { var r = bSec.getBoundingClientRect(); bSec.style.setProperty('--bloom-d', Math.ceil(Math.sqrt(r.width * r.width + r.height * r.height)) + 8 + 'px'); };
        setBloom();
        ST.addEventListener('refreshInit', setBloom);
        gsap.fromTo(bloom, { scale: 0.07 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: bSec, start: 'top 92%', end: 'top 8%', scrub: 0.7 } });
        gsap.fromTo(bContent, { opacity: 0, y: 36 }, { opacity: 1, y: 0, ease: 'none', scrollTrigger: { trigger: bSec, start: 'top 45%', end: 'top 12%', scrub: 0.7 } });
      }
      // Morgenbild in der Haltung: leichte Gegenbewegung
      var ep = $('.ethos-photo img');
      if (ep) gsap.fromTo(ep, { yPercent: 6 }, { yPercent: -6, ease: 'none', scrollTrigger: { trigger: '.ethos', start: 'top bottom', end: 'bottom top', scrub: true } });
      // Studio-Parallaxe
      $$('[data-parallax]').forEach(function (el) {
        var v = parseFloat(el.getAttribute('data-parallax')) || 0;
        gsap.fromTo(el, { yPercent: -v }, {
          yPercent: v, ease: 'none',
          scrollTrigger: { trigger: '.studio', start: 'top bottom', end: 'bottom top', scrub: true }
        });
      });
      return function () {
        d.classList.remove('is-hscroll');
        if (setDist) ST.removeEventListener('refreshInit', setDist);
        if (section) section.style.removeProperty('--hs-dist');
        $$('.style-panel').forEach(function (p) { p.style.opacity = ''; });
        d.classList.remove('is-bloom');
        if (setBloom) ST.removeEventListener('refreshInit', setBloom);
        if (bContent) { bContent.style.opacity = ''; bContent.style.transform = ''; }
      };
    });

    // Siegel dreht sich mit dem Scrollen, nicht von allein
    var seal = $('[data-seal-rot]');
    if (seal) gsap.fromTo(seal, { rotation: -40, svgOrigin: '110 110' }, { rotation: 160, svgOrigin: '110 110', ease: 'none', scrollTrigger: { trigger: '.voices', start: 'top bottom', end: 'bottom top', scrub: 0.8 } });

    // Pfad „Erste Stunde“
    var path = $('[data-first-path]');
    if (path) {
      gsap.fromTo(path, { strokeDashoffset: 1 }, {
        strokeDashoffset: 0, ease: 'none',
        scrollTrigger: { trigger: '.first-steps', start: 'top 72%', end: 'bottom 65%', scrub: 0.6 }
      });
    }

    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ST.refresh(); });
    if (document.readyState === 'complete') ST.refresh();
    else window.addEventListener('load', function () { ST.refresh(); });
  }

  /* ------------------------------------------------------------------------
     Stundenplan: Daten aus dem DOM, Filter, Tagestabs, Detail-Dialog
     ------------------------------------------------------------------------ */
  var SLOTS = [];
  var applyFilters = function () {};
  var setStyleFilter = function () {};
  var openSlot = function () {};

  function readSlots() {
    SLOTS = $$('.slot').map(function (el) {
      return {
        el: el,
        id: el.getAttribute('data-id'),
        day: parseInt(el.getAttribute('data-day'), 10),
        start: el.getAttribute('data-start'),
        end: el.getAttribute('data-end'),
        dur: parseInt(el.getAttribute('data-dur'), 10),
        style: el.getAttribute('data-style'),
        level: el.getAttribute('data-level'),
        teacher: el.getAttribute('data-teacher'),
        room: el.getAttribute('data-room'),
        spots: parseInt(el.getAttribute('data-spots'), 10),
        title: (el.querySelector('.slot-title') || {}).textContent || ''
      };
    });
  }
  function slotById(id) { for (var i = 0; i < SLOTS.length; i++) if (SLOTS[i].id === id) return SLOTS[i]; return null; }
  function spotsText(n) { return n === 0 ? 'Warteliste' : (n === 1 ? '1 Platz frei' : n + ' Plätze frei'); }
  function todayIndex() { return (new Date().getDay() + 6) % 7; }

  /* ------------------------------------------------------------------------
     Tageslauf: Zeitachse 7–21 Uhr mit gestauchter Mittagsruhe (13–17 Uhr),
     darüber die Sonnenbahn. Die Sonne folgt Zeiger, Fokus und Uhrzeit.
     ------------------------------------------------------------------------ */
  var TL = { start: 7 * 60, noonFrom: 13 * 60, noonTo: 17 * 60, end: 21 * 60, gap: 26 };
  function tlUnits(m) {
    m = clamp(m, TL.start, TL.end);
    if (m <= TL.noonFrom) return m - TL.start;
    if (m <= TL.noonTo) return (TL.noonFrom - TL.start) + (m - TL.noonFrom) * TL.gap / (TL.noonTo - TL.noonFrom);
    return (TL.noonFrom - TL.start) + TL.gap + (m - TL.noonTo);
  }
  var TL_TOTAL = tlUnits(TL.end);
  function tlX(m) { return tlUnits(m) / TL_TOTAL; }
  function tlMin(f) {
    var u = clamp(f, 0, 1) * TL_TOTAL, a = TL.noonFrom - TL.start;
    if (u <= a) return TL.start + u;
    if (u <= a + TL.gap) return TL.noonFrom + (u - a) * (TL.noonTo - TL.noonFrom) / TL.gap;
    return TL.noonTo + (u - a - TL.gap);
  }
  function toMin(s) { var p = s.split(':'); return +p[0] * 60 + +p[1]; }
  function hhmm(m) { m = Math.round(m / 5) * 5; var h = Math.floor(m / 60), mm = m % 60; return h + ':' + (mm < 10 ? '0' : '') + mm; }
  var daylight = { refresh: function () {}, day: function () {} };
  var scheduleCtx = null;

  function initDaylight(week, days) {
    var box = $('[data-daylight]');
    if (!box) return;
    var svg = $('[data-dl-svg]', box), arc = $('[data-dl-arc]', box), lit = $('[data-dl-lit]', box);
    var sun = $('[data-dl-sun]', box), lab = $('[data-dl-time]', box), axis = $('[data-dl-axis]', box);
    var mqTL = window.matchMedia('(min-width: 1180px)');
    var NS = 'http://www.w3.org/2000/svg';
    var dotsG = document.createElementNS(NS, 'g');
    svg.appendChild(dotsG);
    var legend = document.createElement('span');
    legend.className = 'dl-legend';
    legend.textContent = 'Obere Spur: Raum Weite · untere Spur: Raum Stille';
    box.appendChild(legend);
    var hours = document.createElement('div');
    hours.className = 'week-hours';
    hours.setAttribute('aria-hidden', 'true');
    week.appendChild(hours);
    week.classList.add('is-timeline');
    // Stunden als Position im Stundenplan
    SLOTS.forEach(function (s) {
      var a = tlX(toMin(s.start)), b = tlX(toMin(s.end));
      s.el.style.setProperty('--x', a.toFixed(4));
      s.el.style.setProperty('--w', (b - a).toFixed(4));
    });

    var W = 0, H = 0, x0 = 0, x1 = 1, shownDay = todayIndex();
    var cur = -1, target = 0, raf = 0, label = '', labW = 60;
    var now = new Date(), nowMin = now.getHours() * 60 + now.getMinutes();
    var still = reduced();
    function pt(f) { return [x0 + (x1 - x0) * f, H - 24 - (H - 60) * Math.sin(Math.PI * clamp(f, 0, 1))]; }
    function restF() { return (nowMin >= TL.start && nowMin <= TL.end) ? tlX(nowMin) : 0; }
    function restLabel() { return (nowMin >= TL.start && nowMin <= TL.end) ? 'jetzt ' + hhmm(nowMin) : 'erste Stunde 7:00'; }

    function build() {
      W = box.clientWidth; H = box.clientHeight;
      if (!W || !H) return;
      var tl = mqTL.matches;
      var lw = tl ? (parseFloat(getComputedStyle(box.closest('.schedule')).getPropertyValue('--tl-label')) || 132) : 0;
      x0 = lw + (tl ? 0 : 14); x1 = W - (tl ? 0 : 14);
      legend.hidden = !tl;
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      var dd = '';
      for (var i = 0; i <= 80; i++) { var p = pt(i / 80); dd += (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }
      arc.setAttribute('d', dd); lit.setAttribute('d', dd); lit.setAttribute('pathLength', '1'); lit.style.strokeDasharray = '1';
      axis.textContent = '';
      (W < 700 ? [7, 10, 13, 19, 21] : [7, 9, 11, 13, 17, 19, 21]).forEach(function (h) {
        var sp = document.createElement('span');
        sp.textContent = h + ':00';
        sp.style.left = (x0 + (x1 - x0) * tlX(h * 60)).toFixed(1) + 'px';
        axis.appendChild(sp);
      });
      var g = document.createElement('span');
      g.className = 'dl-gap'; g.textContent = 'Mittagsruhe';
      g.style.left = (x0 + (x1 - x0) * tlX(15 * 60)).toFixed(1) + 'px';
      g.style.bottom = '18px';
      axis.appendChild(g);
      // Stundenlinien im Plan
      hours.textContent = '';
      if (tl) {
        for (var h = 8; h <= 20; h++) {
          if (h > 13 && h < 17) continue;
          var ln = document.createElement('i');
          ln.style.left = (tlX(h * 60) * 100).toFixed(3) + '%';
          hours.appendChild(ln);
        }
        var gap = document.createElement('i');
        gap.className = 'wh-gap';
        gap.style.left = (tlX(TL.noonFrom) * 100).toFixed(3) + '%';
        gap.style.width = ((tlX(TL.noonTo) - tlX(TL.noonFrom)) * 100).toFixed(3) + '%';
        hours.appendChild(gap);
        var today = days[todayIndex()];
        if (today && nowMin > TL.start && nowMin < TL.end) {
          var nl = document.createElement('i');
          nl.className = 'wh-now';
          nl.style.left = (tlX(nowMin) * 100).toFixed(3) + '%';
          nl.style.setProperty('--now-top', today.offsetTop + 'px');
          nl.style.setProperty('--now-h', today.offsetHeight + 'px');
          hours.appendChild(nl);
        }
      }
      dots();
      cur = -1; place(target);
    }
    function dots() {
      while (dotsG.firstChild) dotsG.removeChild(dotsG.firstChild);
      if (mqTL.matches) return;
      SLOTS.forEach(function (s) {
        if (s.day !== shownDay || s.el.hidden) return;
        var p = pt(tlX(toMin(s.start)));
        var c = document.createElementNS(NS, 'circle');
        c.setAttribute('cx', p[0].toFixed(1)); c.setAttribute('cy', p[1].toFixed(1)); c.setAttribute('r', '4.5');
        c.setAttribute('class', 'dl-dot' + (s.spots <= 2 ? ' is-low' : ''));
        dotsG.appendChild(c);
      });
    }
    function place(f) {
      cur = f;
      var p = pt(f);
      sun.style.transform = 'translate(' + p[0].toFixed(1) + 'px,' + p[1].toFixed(1) + 'px)';
      // Beschriftung bleibt im Kasten, auch wenn die Sonne am Rand steht
      var half = labW / 2, lx = clamp(p[0], half + 2, W - half - 2);
      lab.style.transform = 'translate(' + lx.toFixed(1) + 'px,' + p[1].toFixed(1) + 'px) translate(-50%, -40px)';
      lit.style.strokeDashoffset = (1 - f).toFixed(4);
    }
    function tick() {
      raf = 0;
      var nx = cur < 0 ? target : cur + (target - cur) * 0.14;
      if (Math.abs(target - nx) < 0.0008) nx = target;
      place(nx);
      if (nx !== target) raf = requestAnimationFrame(tick);
    }
    function aim(f, text) {
      target = clamp(f, 0, 1);
      if (text !== label) { label = text; lab.textContent = text; labW = lab.offsetWidth; }
      if (still) { place(target); return; }
      if (!raf) raf = requestAnimationFrame(tick);
    }
    function rest() { aim(restF(), restLabel()); }

    daylight.refresh = function () { dots(); };
    daylight.day = function (i) {
      shownDay = i;
      dots();
      if (mqTL.matches) return;
      if (i === todayIndex()) { rest(); return; }
      var first = SLOTS.filter(function (s) { return s.day === i && !s.el.hidden; }).sort(function (a, b) { return toMin(a.start) - toMin(b.start); })[0];
      if (first) aim(tlX(toMin(first.start)), DAYS_SHORT[i] + ' ' + hhmm(toMin(first.start)));
    };

    // Zeiger über dem Plan → Sonne folgt; Fokus/Hover auf einer Stunde → Sonne springt hin
    week.addEventListener('pointermove', function (e) {
      if (!mqTL.matches || e.pointerType !== 'mouse') return;
      var col = week.querySelector('.slots');
      if (!col) return;
      var r = col.getBoundingClientRect();
      var f = (e.clientX - r.left) / r.width;
      if (f < 0 || f > 1) return;
      var btn = e.target.closest && e.target.closest('.slot-btn');
      if (btn) return;
      aim(f, hhmm(tlMin(f)));
    });
    week.addEventListener('pointerleave', rest);
    var mark = function (btn) {
      $$('.slot-btn.is-sun', week).forEach(function (b) { b.classList.remove('is-sun'); });
      if (!btn) return;
      btn.classList.add('is-sun');
      var s = slotById(btn.parentNode.getAttribute('data-id'));
      if (s) aim(tlX(toMin(s.start)), DAYS_SHORT[s.day] + ' ' + s.start);
    };
    week.addEventListener('pointerover', function (e) { var b = e.target.closest && e.target.closest('.slot-btn'); if (b && mqTL.matches) mark(b); });
    week.addEventListener('focusin', function (e) { var b = e.target.closest && e.target.closest('.slot-btn'); if (b) mark(b); });
    week.addEventListener('focusout', function () { mark(null); });

    if ('ResizeObserver' in window) new ResizeObserver(function () { build(); }).observe(box);
    else window.addEventListener('resize', build);
    mqTL.addEventListener('change', build);
    rest();
    build();
  }

  function initSchedule() {
    readSlots();
    var form = $('[data-filters]');
    var week = $('[data-week]');
    if (!form || !week) return;
    var days = $$('.day', week);
    var countEl = $('[data-filter-count]');
    var resetBtn = $('[data-filter-reset]');
    var tabsWrap = $('[data-day-tabs]');
    var tabs = tabsWrap ? $$('[role="tab"]', tabsWrap) : [];
    var today = todayIndex();
    var selectedDay = today;
    var tabbed = false;

    // Heute markieren
    if (days[today]) {
      days[today].classList.add('is-today');
      var badge = days[today].querySelector('.day-today');
      if (badge) badge.hidden = false;
    }
    if (tabs[today]) tabs[today].classList.add('is-today');

    function values() {
      var fd = new FormData(form);
      return { style: fd.get('f-style') || 'all', level: fd.get('f-level') || 'all', teacher: fd.get('f-teacher') || 'all' };
    }

    applyFilters = function (animate) {
      var v = values();
      var total = 0;
      var perDay = [0, 0, 0, 0, 0, 0, 0];
      var idxInDay = [0, 0, 0, 0, 0, 0, 0];
      SLOTS.forEach(function (s) {
        var ok = (v.style === 'all' || s.style === v.style) && (v.level === 'all' || s.level === v.level) && (v.teacher === 'all' || s.teacher === v.teacher);
        var wasHidden = s.el.hidden;
        s.el.hidden = !ok;
        if (ok) {
          total++; perDay[s.day]++;
          if (animate) {
            s.el.classList.remove('is-entering');
            void s.el.offsetWidth;
            s.el.style.setProperty('--d', Math.min(idxInDay[s.day], 6) * 35 + 'ms');
            s.el.classList.add('is-entering');
          } else if (wasHidden) {
            s.el.classList.remove('is-entering');
          }
          idxInDay[s.day]++;
        }
      });
      days.forEach(function (day, i) {
        var empty = day.querySelector('.day-empty');
        if (!empty) return;
        empty.hidden = perDay[i] > 0;
        // Leerer Tag: direkt zum nächsten Tag mit passenden Stunden springen (Tab-Ansicht)
        var jump = empty.querySelector('.day-jump');
        if (!jump) return;
        var to = -1;
        for (var k = 1; k < 7 && to < 0 && total; k++) if (perDay[(i + k) % 7]) to = (i + k) % 7;
        jump.hidden = to < 0;
        if (to > -1) {
          var first = SLOTS.filter(function (s) { return s.day === to && !s.el.hidden; })
            .sort(function (a, b) { return a.start < b.start ? -1 : 1; })[0];
          jump.setAttribute('data-to', String(to));
          jump.querySelector('span').textContent = 'Nächste: ' + DAYS[to] + (first ? ', ' + first.start + NBSP + 'Uhr · ' + first.title : '');
        }
      });
      tabs.forEach(function (t, i) {
        var n = t.querySelector('[data-tab-n]');
        if (n) n.textContent = String(perDay[i]);
        t.classList.toggle('is-empty', perDay[i] === 0);
      });
      var filtered = v.style !== 'all' || v.level !== 'all' || v.teacher !== 'all';
      if (countEl) countEl.textContent = filtered
        ? (total === 1 ? '1 Stunde passt' : total + ' Stunden passen') + (total ? '' : ' – versuchen Sie einen anderen Filter')
        : total + ' Stunden in dieser Woche';
      if (resetBtn) resetBtn.hidden = !filtered;
      daylight.refresh();
    };

    setStyleFilter = function (style) {
      var r = form.querySelector('input[name="f-style"][value="' + style + '"]');
      if (r) { r.checked = true; applyFilters(true); }
    };

    form.addEventListener('change', function () { applyFilters(true); });
    form.addEventListener('reset', function () { setTimeout(function () { applyFilters(true); }, 0); });
    form.addEventListener('submit', function (e) { e.preventDefault(); });

    // Stil-Links aus dem Stile-Abschnitt
    $$('[data-filter-style]').forEach(function (a) {
      a.addEventListener('click', function () { setStyleFilter(a.getAttribute('data-filter-style')); });
    });

    // Tagestabs (Handy)
    function selectDay(i, focus) {
      selectedDay = i;
      tabs.forEach(function (t, k) {
        var on = k === i;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        if (on && focus) t.focus();
      });
      days.forEach(function (day, k) { day.classList.toggle('is-shown', k === i); });
      daylight.day(i);
    }
    function setTabbed(on) {
      tabbed = on;
      week.classList.toggle('is-tabbed', on);
      days.forEach(function (day, k) {
        if (on) { day.setAttribute('role', 'tabpanel'); day.setAttribute('aria-labelledby', 'dt-' + k); }
        else { day.removeAttribute('role'); day.setAttribute('aria-labelledby', day.querySelector('.day-head').id); }
      });
      if (on) selectDay(selectedDay, false);
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { selectDay(i, false); });
      t.addEventListener('keydown', function (e) {
        var k = e.key, n = tabs.length, to = -1;
        if (k === 'ArrowRight') to = (i + 1) % n;
        else if (k === 'ArrowLeft') to = (i - 1 + n) % n;
        else if (k === 'Home') to = 0;
        else if (k === 'End') to = n - 1;
        if (to > -1) { e.preventDefault(); selectDay(to, true); }
      });
    });
    days.forEach(function (day) {
      var empty = day.querySelector('.day-empty');
      if (!empty) return;
      var jump = document.createElement('button');
      jump.type = 'button';
      jump.className = 'text-btn day-jump';
      jump.hidden = true;
      jump.appendChild(document.createElement('span'));
      jump.insertAdjacentHTML('beforeend', '<svg aria-hidden="true"><use href="#i-arrow"/></svg>');
      jump.addEventListener('click', function () { selectDay(parseInt(jump.getAttribute('data-to'), 10), true); });
      empty.appendChild(jump);
    });
    var mqTabs = window.matchMedia('(max-width: 699px)');
    setTabbed(mqTabs.matches);
    mqTabs.addEventListener('change', function (e) { setTabbed(e.matches); });

    applyFilters(false);
    initDialog();
    scheduleCtx = { week: week, days: days };

    week.addEventListener('click', function (e) {
      var btn = e.target.closest('.slot-btn');
      if (!btn) return;
      var s = slotById(btn.parentNode.getAttribute('data-id'));
      if (s) openSlot(s, btn);
    });

    // „Nächste Stunde“ im Hero
    nextClassCard();
  }

  function nextClassCard() {
    var lab = $('[data-next-label]'), tit = $('[data-next-title]'), sub = $('[data-next-sub]');
    if (!lab || !tit || !SLOTS.length) return;
    var now = new Date();
    var di = (now.getDay() + 6) % 7;
    var mins = now.getHours() * 60 + now.getMinutes();
    var toMin = function (s) { var p = s.split(':'); return +p[0] * 60 + +p[1]; };
    var found = null, offset = 0;
    for (offset = 0; offset < 7 && !found; offset++) {
      var day = (di + offset) % 7;
      var list = SLOTS.filter(function (s) { return s.day === day && (offset > 0 || toMin(s.start) > mins + 10); });
      list.sort(function (a, b) { return toMin(a.start) - toMin(b.start); });
      if (list.length) found = list[0];
    }
    if (!found) return;
    offset -= 1;
    lab.textContent = offset === 0 ? 'Nächste Stunde heute' : (offset === 1 ? 'Nächste Stunde morgen' : 'Nächste Stunde am ' + DAYS[found.day]);
    tit.textContent = found.start + ' Uhr · ' + found.title;
    sub.textContent = 'mit ' + TEACHERS[found.teacher].name.split(' ')[0] + ' · ' + spotsText(found.spots);
  }

  function initDialog() {
    var dlg = $('#kurs-dialog');
    if (!dlg || typeof dlg.showModal !== 'function') return;
    var current = null, trigger = null, closing = 0;
    var f = function (k) { return dlg.querySelector('[data-kd-' + k + ']'); };

    openSlot = function (s, from) {
      current = s; trigger = from || document.activeElement;
      var st = STYLES[s.style], te = TEACHERS[s.teacher];
      f('style').textContent = st.name;
      f('level').textContent = LEVELS[s.level];
      f('swatch').className = 'sw sw-' + s.style;
      f('title').textContent = s.title;
      f('when').textContent = DAYS[s.day] + ', ' + s.start + '–' + s.end + NBSP + 'Uhr · ' + s.dur + NBSP + 'Min.';
      f('desc').textContent = st.desc;
      f('room').textContent = ROOMS[s.room];
      f('spots').textContent = spotsText(s.spots);
      f('teacher').textContent = te.name;
      f('bio').textContent = te.bio;
      var mono = f('mono');
      mono.textContent = te.mono;
      mono.style.background = te.color;
      f('book').textContent = s.spots === 0 ? 'Auf die Warteliste' : 'Für diese Stunde anfragen';
      clearTimeout(closing);
      if (!dlg.open) dlg.showModal();
      if (lenis) lenis.stop();
      requestAnimationFrame(function () { dlg.classList.add('is-open'); });
    };
    function close(after) {
      if (!dlg.open) return;
      dlg.classList.remove('is-open');
      var fin = function () {
        dlg.close();
        if (lenis) lenis.start();
        if (after) after();
        else if (trigger && document.contains(trigger)) trigger.focus();
      };
      if (reduced()) fin(); else closing = setTimeout(fin, 260);
    }
    $$('[data-kd-close]', dlg).forEach(function (b) { b.addEventListener('click', function () { close(); }); });
    dlg.addEventListener('cancel', function (e) { e.preventDefault(); close(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); });
    f('book').addEventListener('click', function () {
      var s = current;
      close(function () {
        var sel = $('#f-kurs');
        if (sel && s) sel.value = s.id;
        var target = $('#kontakt');
        scrollToTarget(target, function () { var n = $('#f-name'); if (n) n.focus({ preventScroll: true }); });
      });
    });
  }

  /* ------------------------------------------------------------------------
     Stil-Quiz
     ------------------------------------------------------------------------ */
  function initQuiz() {
    var form = $('[data-quiz]');
    var result = $('[data-quiz-result]');
    if (!form || !result) return;
    var steps = $$('.quiz-step', form);
    var back = $('[data-quiz-back]', form);
    var next = $('[data-quiz-next]', form);
    var num = $('[data-q-num]', form);
    var dots = $$('.quiz-dots li', form);
    var current = 0, busy = false, lastPointer = 0;
    var nextLabel = next.childNodes[0];

    steps.forEach(function (s, i) { if (i) s.hidden = true; });

    function answered(i) { return !!steps[i].querySelector('input:checked'); }
    function ui() {
      back.disabled = current === 0;
      next.disabled = !answered(current);
      nextLabel.nodeValue = current === steps.length - 1 ? 'Auswerten' : 'Weiter';
      if (num) num.textContent = String(current + 1);
      dots.forEach(function (dt, i) { dt.classList.toggle('is-on', i <= current); });
    }
    function go(to) {
      if (busy || to === current || to < 0 || to >= steps.length) return;
      var from = steps[current], dir = to > current ? 1 : -1;
      var nextStep = steps[to];
      var focusIn = function () {
        var inp = nextStep.querySelector('input:checked') || nextStep.querySelector('input');
        if (inp) inp.focus({ preventScroll: true });
      };
      current = to;
      ui();
      if (reduced() || !from.animate) {
        from.hidden = true; nextStep.hidden = false; focusIn(); return;
      }
      busy = true;
      from.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(' + (-18 * dir) + 'px)' }], { duration: 180, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }).onfinish = function () {
        from.hidden = true;
        nextStep.hidden = false;
        focusIn();
        nextStep.animate([{ opacity: 0, transform: 'translateX(' + (22 * dir) + 'px)' }, { opacity: 1, transform: 'none' }], { duration: 340, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }).onfinish = function () { busy = false; };
      };
    }

    form.addEventListener('pointerdown', function () { lastPointer = performance.now(); });
    form.addEventListener('change', function (e) {
      if (e.target.type !== 'radio') return;
      ui();
      // Nur bei Maus/Touch automatisch weiter – Pfeiltasten wählen nur aus.
      if (performance.now() - lastPointer < 700 && current < steps.length - 1) {
        setTimeout(function () { go(current + 1); }, 320);
      }
    });
    back.addEventListener('click', function () { go(current - 1); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!answered(current)) return;
      if (current < steps.length - 1) go(current + 1);
      else evaluate();
    });

    function evaluate() {
      var score = { hatha: 0, vinyasa: 0, yin: 0, restorative: 0 };
      var slot = 'abend';
      $$('input:checked', form).forEach(function (inp) {
        (inp.getAttribute('data-score') || '').split(',').forEach(function (pair) {
          var p = pair.split(':');
          if (score[p[0]] !== undefined) score[p[0]] += parseInt(p[1], 10) || 0;
        });
        if (inp.name === 'q4') slot = inp.value;
      });
      var ranked = TIE_ORDER.slice().sort(function (a, b) { return (score[b] - score[a]) || (TIE_ORDER.indexOf(a) - TIE_ORDER.indexOf(b)); });
      showResult(ranked[0], ranked[1], slot);
    }

    var lastStyle = 'hatha';
    function showResult(style, second, slot) {
      lastStyle = style;
      var st = STYLES[style];
      $('[data-qr-title]', result).textContent = st.name;
      $('[data-qr-lead]', result).textContent = st.lead;
      $('[data-qr-why]', result).textContent = st.why;
      $('[data-qr-first]', result).textContent = st.first;
      $('[data-qr-second]', result).textContent = STYLES[second].name;
      var list = $('[data-qr-classes]', result);
      list.textContent = '';
      var toMin = function (s) { var p = s.split(':'); return +p[0] * 60 + +p[1]; };
      var inSlot = function (s) {
        var m = toMin(s.start);
        if (slot === 'frueh') return s.day < 5 && m < 9 * 60;
        if (slot === 'tag') return s.day < 5 && m >= 9 * 60 && m < 14 * 60;
        if (slot === 'abend') return s.day < 5 && m >= 17 * 60;
        return s.day >= 5;
      };
      var mine = SLOTS.filter(function (s) { return s.style === style; });
      var pick = mine.filter(inSlot);
      if (!pick.length) pick = mine;
      pick.sort(function (a, b) { return (a.day - b.day) || (toMin(a.start) - toMin(b.start)); });
      pick.slice(0, 3).forEach(function (s) {
        var li = document.createElement('li');
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'qr-class';
        var w = document.createElement('span'); w.className = 'qc-when'; w.textContent = DAYS_SHORT[s.day] + ' ' + s.start;
        var t = document.createElement('span'); t.className = 'qc-title'; t.textContent = s.title;
        var who = document.createElement('span'); who.className = 'qc-who'; who.textContent = TEACHERS[s.teacher].name.split(' ')[0] + ' · ' + LEVELS[s.level];
        b.appendChild(w); b.appendChild(t); b.appendChild(who);
        b.setAttribute('aria-haspopup', 'dialog');
        b.addEventListener('click', function () { openSlot(s, b); });
        li.appendChild(b);
        list.appendChild(li);
      });
      form.hidden = true;
      result.hidden = false;
      if (!reduced() && result.animate) result.animate([{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], { duration: 520, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' });
      $('[data-qr-title]', result).focus({ preventScroll: true });
    }

    $('[data-qr-plan]', result).addEventListener('click', function () {
      setStyleFilter(lastStyle);
      scrollToTarget($('#stundenplan'));
    });
    $('[data-qr-restart]', result).addEventListener('click', function () {
      form.reset();
      steps.forEach(function (s, i) { s.hidden = i !== 0; });
      current = 0;
      ui();
      result.hidden = true;
      form.hidden = false;
      var first = steps[0].querySelector('input');
      if (first) first.focus({ preventScroll: true });
    });
    ui();
  }

  /* ------------------------------------------------------------------------
     Geführte Atemübung
     ------------------------------------------------------------------------ */
  function initBreathe() {
    var stage = $('[data-breathe]');
    if (!stage) return;
    var startBtn = $('[data-b-start]'), startLabel = $('[data-b-start-label]');
    var resetBtn = $('[data-b-reset]');
    var soundBox = $('[data-b-sound]');
    var phaseEl = $('[data-b-phase]', stage), countEl = $('[data-b-count]', stage), roundEl = $('[data-b-round]', stage);
    var live = $('[data-b-live]', stage);
    var circle = $('[data-b-circle]', stage);
    var ripples = $$('[data-b-ripple]', stage);
    var segWrap = $('[data-b-segments]', stage);
    var prog = $('[data-b-progress]', stage);
    var dot = $('[data-b-dot]', stage);
    var radios = $$('input[name="b-pattern"]');
    var guides = $$('[data-guide]');

    var pattern = BREATH_PATTERNS.box, patKey = 'box';
    var state = 'idle'; // idle | running | paused | done
    var elapsed = 0, last = 0, raf = 0, phaseIdx = -1, lastCount = -1, lastRound = -1;
    var rip = [0.78, 0.78], ripA = [0, 0];
    var audio = null;
    var still = reduced();
    var visible = true;

    function cycleLen() { return pattern.phases.reduce(function (a, p) { return a + p.s; }, 0); }

    function arc(a0, a1, r) {
      var rad = function (a) { return (a - 90) * Math.PI / 180; };
      var x0 = 200 + r * Math.cos(rad(a0)), y0 = 200 + r * Math.sin(rad(a0));
      var x1 = 200 + r * Math.cos(rad(a1)), y1 = 200 + r * Math.sin(rad(a1));
      return 'M' + x0.toFixed(2) + ' ' + y0.toFixed(2) + 'A' + r + ' ' + r + ' 0 ' + (a1 - a0 > 180 ? 1 : 0) + ' 1 ' + x1.toFixed(2) + ' ' + y1.toFixed(2);
    }
    function buildSegments() {
      segWrap.textContent = '';
      var total = cycleLen(), acc = 0, gap = 3.2;
      pattern.phases.forEach(function (p, i) {
        var a0 = acc / total * 360 + gap, a1 = (acc + p.s) / total * 360 - gap;
        acc += p.s;
        var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', arc(a0, a1, 184));
        path.setAttribute('class', 'bs-seg');
        path.setAttribute('data-i', i);
        segWrap.appendChild(path);
      });
    }

    function setScale(s) {
      if (still) return;
      circle.style.transform = 'scale(' + s.toFixed(4) + ')';
    }

    function idleText() {
      phaseEl.textContent = 'Bereit?';
      countEl.textContent = String(pattern.phases[0].s);
      roundEl.textContent = pattern.label + ' · ' + pattern.rounds + ' Runden';
      stage.removeAttribute('data-phase');
    }

    function tone(key) {
      if (!soundBox || !soundBox.checked) return;
      try {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        if (!audio) audio = new AC();
        if (audio.state === 'suspended') audio.resume();
        var o = audio.createOscillator(), g = audio.createGain();
        var freq = { in: 396, hold: 528, out: 330, empty: 440 }[key] || 440;
        o.type = 'sine'; o.frequency.value = freq;
        var t = audio.currentTime;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.06, t + 0.08);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
        o.connect(g); g.connect(audio.destination);
        o.start(t); o.stop(t + 1.7);
      } catch (e) { /* Ton ist optional */ }
    }

    function render() {
      var total = cycleLen();
      var round = Math.floor(elapsed / total);
      if (round >= pattern.rounds) { finish(); return; }
      var tc = elapsed - round * total;
      var acc = 0, i = 0;
      for (i = 0; i < pattern.phases.length; i++) { if (tc < acc + pattern.phases[i].s) break; acc += pattern.phases[i].s; }
      if (i >= pattern.phases.length) i = pattern.phases.length - 1;
      var ph = pattern.phases[i];
      var p = clamp((tc - acc) / ph.s, 0, 1);
      var remaining = Math.max(1, Math.ceil(ph.s - (tc - acc) - 1e-6));

      if (i !== phaseIdx) {
        phaseIdx = i;
        phaseEl.textContent = ph.name;
        stage.setAttribute('data-phase', ph.key);
        $$('.bs-seg', segWrap).forEach(function (s, k) { s.classList.toggle('is-active', k === i); });
        if (live) live.textContent = ph.name + ', ' + ph.s + ' Sekunden';
        tone(ph.key);
      }
      if (remaining !== lastCount) { lastCount = remaining; countEl.textContent = String(remaining); }
      if (round !== lastRound) { lastRound = round; roundEl.textContent = 'Runde ' + (round + 1) + ' von ' + pattern.rounds; }

      // Kreis
      var mn = BREATH_SCALE.min, mx = BREATH_SCALE.max, s;
      if (ph.key === 'in') s = mn + (mx - mn) * easeInOutSine(p);
      else if (ph.key === 'out') s = mx - (mx - mn) * easeInOutSine(p);
      else if (ph.key === 'hold') s = mx;
      else s = mn;
      setScale(s);
      // Wellen folgen träge
      if (!still) {
        var full = ph.key === 'in' || ph.key === 'hold';
        for (var k = 0; k < ripples.length; k++) {
          var target = s * (1.1 + k * 0.13);
          rip[k] += (target - rip[k]) * (0.05 - k * 0.015);
          ripA[k] += ((full ? 0.55 - k * 0.2 : 0.12) - ripA[k]) * 0.04;
          ripples[k].style.transform = 'scale(' + rip[k].toFixed(4) + ')';
          ripples[k].style.opacity = ripA[k].toFixed(3);
        }
      }
      // Ring
      var cp = still ? Math.floor(tc) / total : tc / total;
      prog.style.strokeDashoffset = (1 - cp).toFixed(4);
      if (!still) dot.style.transform = 'rotate(' + (cp * 360).toFixed(2) + 'deg)';
    }

    function loop(now) {
      raf = 0;
      if (state !== 'running') return;
      if (!visible || document.hidden) { pause(); return; }
      var dt = last ? (now - last) / 1000 : 0;
      last = now;
      elapsed += Math.min(dt, 0.1);
      render();
      if (state === 'running') raf = requestAnimationFrame(loop);
    }

    function setState(s) {
      state = s;
      stage.classList.toggle('is-running', s === 'running');
      stage.classList.toggle('is-paused', s === 'paused');
      stage.classList.toggle('is-done', s === 'done');
      startLabel.textContent = s === 'running' ? 'Pause' : (s === 'paused' ? 'Weiter atmen' : (s === 'done' ? 'Noch einmal' : 'Übung starten'));
      resetBtn.disabled = s === 'idle';
      if (s !== 'running') idlePulse(s === 'idle' || s === 'done');
    }
    function start() {
      if (state === 'done') { elapsed = 0; phaseIdx = -1; lastRound = -1; lastCount = -1; }
      if (state === 'idle' && live) live.textContent = pattern.label + ' beginnt.';
      setState('running');
      idlePulse(false);
      last = 0;
      if (!raf) raf = requestAnimationFrame(loop);
    }
    function pause() {
      if (state !== 'running') return;
      setState('paused');
      if (live) live.textContent = 'Pausiert.';
    }
    function reset() {
      elapsed = 0; phaseIdx = -1; lastCount = -1; lastRound = -1;
      setState('idle');
      prog.style.strokeDashoffset = '1';
      dot.style.transform = 'rotate(0deg)';
      $$('.bs-seg', segWrap).forEach(function (s) { s.classList.remove('is-active'); });
      idleText();
    }
    function finish() {
      setState('done');
      phaseEl.textContent = 'Schön.';
      countEl.textContent = '';
      roundEl.textContent = 'Bleiben Sie noch einen Moment sitzen.';
      stage.removeAttribute('data-phase');
      prog.style.strokeDashoffset = '0';
      if (live) live.textContent = 'Übung beendet. Bleiben Sie noch einen Moment sitzen.';
    }

    // Ruhiges Leerlauf-Atmen des Kreises
    var idleRaf = 0, idleT0 = 0;
    function idlePulse(on) {
      if (still) return;
      if (on) {
        if (idleRaf) return;
        idleT0 = performance.now();
        var tick = function (now) {
          if (state === 'running' || !visible || document.hidden) { idleRaf = 0; return; }
          var hb = heroBreath((now - idleT0) / 1000 + 2);
          var s = 0.74 + 0.07 * hb.b;
          circle.style.transform = 'scale(' + s.toFixed(4) + ')';
          for (var k = 0; k < ripples.length; k++) {
            rip[k] = s * (1.1 + k * 0.13) + 0.02 * hb.b;
            ripA[k] = (0.28 - k * 0.12) * hb.b;
            ripples[k].style.transform = 'scale(' + rip[k].toFixed(4) + ')';
            ripples[k].style.opacity = ripA[k].toFixed(3);
          }
          idleRaf = requestAnimationFrame(tick);
        };
        idleRaf = requestAnimationFrame(tick);
      } else if (idleRaf) { cancelAnimationFrame(idleRaf); idleRaf = 0; }
    }

    function choosePattern(key) {
      patKey = key; pattern = BREATH_PATTERNS[key];
      guides.forEach(function (g) { g.hidden = g.getAttribute('data-guide') !== key; });
      buildSegments();
      reset();
    }

    startBtn.addEventListener('click', function () {
      if (state === 'running') pause(); else start();
    });
    resetBtn.addEventListener('click', function () { reset(); startBtn.focus(); });
    radios.forEach(function (r) { r.addEventListener('change', function () { if (r.checked) choosePattern(r.value); }); });
    document.addEventListener('visibilitychange', function () { if (document.hidden) pause(); else if (state === 'idle' || state === 'done') idlePulse(true); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        visible = en[0].isIntersecting;
        if (!visible) pause();
        else if (state === 'idle' || state === 'done') idlePulse(true);
      }, { threshold: 0.15 }).observe(stage);
    }
    var checked = radios.filter(function (r) { return r.checked; })[0];
    choosePattern(checked ? checked.value : 'box');
  }

  /* ------------------------------------------------------------------------
     Preise: Umschalter, Ermäßigung, Rechner
     ------------------------------------------------------------------------ */
  function initPricing() {
    var tabsWrap = $('[data-price-tabs]');
    if (!tabsWrap) return;
    var tabs = $$('[role="tab"]', tabsWrap);
    var pill = $('[data-ps-pill]');
    var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });
    var discount = $('[data-discount]');
    var live = $('[data-price-live]');
    var nums = {};
    $$('[data-price]').forEach(function (el) { nums[el.getAttribute('data-price')] = el; });
    var shown = {}; // aktuell angezeigte Zahl je Tarif
    Object.keys(nums).forEach(function (k) { shown[k] = parseInt(nums[k].textContent, 10); });
    var active = 0;
    var names = { probe: 'Probemonat', karte: '10er-Karte', abo: 'Mitgliedschaft' };
    var units = { probe: ' einmalig', karte: '', abo: ' pro Monat' };

    function table() { return discount && discount.checked ? PRICES_REDUCED : PRICES; }

    function countTo(key, to, from) {
      var el = nums[key];
      if (!el) return;
      if (from === undefined) from = shown[key];
      shown[key] = to;
      if (reduced() || from === to) { el.textContent = String(to); return; }
      var t0 = performance.now(), dur = 800;
      (function step(now) {
        if (shown[key] !== to) return; // überholt
        var p = clamp((now - t0) / dur, 0, 1);
        el.textContent = String(Math.round(lerp(from, to, easeOutCubic(p))));
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    }

    function announce() {
      var key = panels[active].getAttribute('data-plan');
      var reducedOn = discount && discount.checked;
      if (live) live.textContent = names[key] + ': ' + table()[key] + ' Euro' + units[key] + (reducedOn && key !== 'probe' ? ', ermäßigt' : '');
    }

    function select(i, focus) {
      var prevKey = panels[active].getAttribute('data-plan');
      var prevVal = shown[prevKey];
      active = i;
      tabs.forEach(function (t, k) {
        var on = k === i;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        panels[k].classList.toggle('is-active', on);
        // Ausgeblendete Tarife sind auch für Screenreader und Tab-Taste weg.
        panels[k].inert = !on;
        if (on) panels[k].removeAttribute('aria-hidden'); else panels[k].setAttribute('aria-hidden', 'true');
        if (on && focus) t.focus();
      });
      if (pill) pill.style.transform = 'translateX(' + (i * 100) + '%)';
      var key = panels[i].getAttribute('data-plan');
      // weich von der vorherigen Zahl zur neuen zählen
      countTo(key, table()[key], prevKey === key ? undefined : prevVal);
      announce();
    }

    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { if (i !== active) select(i, false); });
      t.addEventListener('keydown', function (e) {
        var n = tabs.length, to = -1;
        if (e.key === 'ArrowRight') to = (i + 1) % n;
        else if (e.key === 'ArrowLeft') to = (i - 1 + n) % n;
        else if (e.key === 'Home') to = 0;
        else if (e.key === 'End') to = n - 1;
        if (to > -1) { e.preventDefault(); select(to, true); }
      });
    });

    function applyDiscount() {
      var tb = table();
      Object.keys(nums).forEach(function (k) { countTo(k, tb[k]); });
      var per = $('[data-per="karte"]');
      if (per) per.textContent = String(Math.round(tb.karte / CLASSES_PER_CARD));
      var single = $('[data-single]');
      if (single) single.textContent = String(tb.single);
      announce();
      calc();
    }
    if (discount) discount.addEventListener('change', applyDiscount);

    // Tarif-Buttons füllen das Formular vor
    $$('[data-tarif]').forEach(function (a) {
      a.addEventListener('click', function () {
        var msg = $('#f-msg');
        if (msg && !msg.value.trim()) msg.value = 'Interesse an: ' + a.getAttribute('data-tarif') + (discount && discount.checked && a.getAttribute('data-tarif') !== 'Probemonat' ? ' (ermäßigt)' : '') + '.';
      });
    });

    // Rechner
    var range = $('[data-calc-n]');
    var out = $('[data-calc-out]');
    var res = $('[data-calc-result]');
    var rows = $$('.calc-bars li');
    function calc() {
      if (!range) return;
      var n = parseInt(range.value, 10);
      var tb = table();
      var perMonth = n * WEEKS_PER_MONTH;
      var costs = {
        einzel: perMonth * tb.single,
        karte: perMonth * (tb.karte / CLASSES_PER_CARD),
        abo: tb.abo
      };
      var max = Math.max(costs.einzel, costs.karte, costs.abo);
      var best = Object.keys(costs).sort(function (a, b) { return costs[a] - costs[b]; })[0];
      rows.forEach(function (li) {
        var k = li.getAttribute('data-opt');
        li.querySelector('[data-cb-val]').textContent = euro(costs[k]);
        li.querySelector('[data-cb-bar]').style.transform = 'scaleX(' + Math.max(0.04, costs[k] / max).toFixed(3) + ')';
        li.classList.toggle('is-best', k === best);
      });
      var label = n === 1 ? '1' + NBSP + '×' : n + NBSP + '×';
      if (out) out.textContent = label + ' pro Woche';
      range.setAttribute('aria-valuetext', n + (n === 1 ? ' Mal' : ' Mal') + ' pro Woche');
      range.style.setProperty('--p', ((n - 1) / 4 * 100) + '%');
      var stunden = n === 1 ? '1' + NBSP + 'Stunde' : n + NBSP + 'Stunden';
      var txt;
      if (best === 'abo') txt = 'Bei ' + stunden + ' pro Woche ist die Mitgliedschaft am günstigsten: ca. ' + euro(tb.abo / perMonth) + ' pro Stunde.';
      else if (best === 'karte') txt = 'Bei ' + stunden + ' pro Woche reicht die 10er-Karte: ca. ' + euro(costs.karte) + ' im Monat, ohne Bindung.';
      else txt = 'Bei ' + stunden + ' pro Woche sind Einzelstunden am günstigsten.';
      if (res) res.textContent = txt;
    }
    if (range) { range.addEventListener('input', calc); calc(); }

    select(0, false);
  }

  /* ------------------------------------------------------------------------
     Kontaktformular (nur clientseitig)
     ------------------------------------------------------------------------ */
  function initForm() {
    var form = $('[data-form]');
    var success = $('[data-success]');
    if (!form || !success) return;
    var fields = {
      name: { el: $('#f-name'), err: $('#f-name-err'), test: function (v) { return v.trim().length >= 2 ? '' : 'Bitte geben Sie Ihren Namen an.'; } },
      email: { el: $('#f-mail'), err: $('#f-mail-err'), test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Bitte geben Sie eine gültige E-Mail-Adresse an (z. B. name@beispiel.de).'; } },
      ok: { el: $('#f-ok'), err: $('#f-ok-err'), test: function (v, el) { return el.checked ? '' : 'Bitte stimmen Sie der Verarbeitung Ihrer Angaben zu.'; } }
    };
    var touched = false;
    function check(key) {
      var f = fields[key];
      var msg = f.test(f.el.value, f.el);
      f.err.textContent = msg;
      if (msg) f.el.setAttribute('aria-invalid', 'true'); else f.el.removeAttribute('aria-invalid');
      return !msg;
    }
    Object.keys(fields).forEach(function (k) {
      var ev = fields[k].el.type === 'checkbox' ? 'change' : 'input';
      fields[k].el.addEventListener(ev, function () { if (touched) check(k); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      touched = true;
      var firstBad = null;
      Object.keys(fields).forEach(function (k) { if (!check(k) && !firstBad) firstBad = fields[k].el; });
      if (firstBad) { firstBad.focus(); return; }
      var sel = $('#f-kurs');
      var exp = form.querySelector('input[name="erfahrung"]:checked');
      var rows = [
        ['Wunschstunde', sel && sel.value ? sel.options[sel.selectedIndex].text : 'Beratung gewünscht'],
        ['Name', fields.name.el.value.trim()],
        ['E-Mail', fields.email.el.value.trim()],
        ['Telefon', $('#f-tel').value.trim()],
        ['Erfahrung', exp ? exp.value : ''],
        ['Hinweis', $('#f-msg').value.trim()]
      ];
      var dl = $('[data-success-sum]', success);
      dl.textContent = '';
      rows.forEach(function (r) {
        if (!r[1]) return;
        var div = document.createElement('div');
        var dt = document.createElement('dt'); dt.textContent = r[0];
        var dd = document.createElement('dd'); dd.textContent = r[1];
        div.appendChild(dt); div.appendChild(dd); dl.appendChild(div);
      });
      form.hidden = true;
      success.hidden = false;
      if (!reduced() && success.animate) success.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 520, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' });
      $('[data-success-title]', success).focus({ preventScroll: true });
    });
    $('[data-success-reset]', success).addEventListener('click', function () {
      form.reset();
      touched = false;
      Object.keys(fields).forEach(function (k) { fields[k].err.textContent = ''; fields[k].el.removeAttribute('aria-invalid'); });
      success.hidden = true;
      form.hidden = false;
      fields.name.el.focus();
    });
  }

  /* ------------------------------------------------------------------------
     Karte: Route zeichnen, sobald sichtbar
     ------------------------------------------------------------------------ */
  function initMap() {
    var map = $('.map');
    if (!map) return;
    // Handy: Ausschnitt um Altstadt und Hafen, größere Beschriftung
    var svg = map.querySelector('svg');
    var full = svg ? svg.getAttribute('viewBox') : '';
    var mqMap = window.matchMedia('(max-width: 600px)');
    var zoom = function () {
      if (!svg) return;
      svg.setAttribute('viewBox', mqMap.matches ? MAP_MOBILE_VIEWBOX : full);
      map.classList.toggle('is-zoomed', mqMap.matches);
    };
    zoom();
    mqMap.addEventListener('change', zoom);
    if (motionOff || !('IntersectionObserver' in window)) { map.classList.add('is-drawn'); return; }
    var io = new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) { map.classList.add('is-drawn'); io.disconnect(); }
    }, { threshold: 0.4 });
    io.observe(map);
  }

  /* ------------------------------------------------------------------------
     Team: auf dem Handy eine Wisch-Reihe – dann per Tastatur fokussierbar
     ------------------------------------------------------------------------ */
  function initTeam() {
    var list = $('[data-team-list]');
    if (!list) return;
    var mq = window.matchMedia('(max-width: 640px)');
    var set = function () { if (mq.matches) list.setAttribute('tabindex', '0'); else list.removeAttribute('tabindex'); };
    set();
    mq.addEventListener('change', set);
  }

  /* ------------------------------------------------------------------------
     Start
     ------------------------------------------------------------------------ */
  function init() {
    window.__atemReady = true;
    d.classList.add('js'); // falls das Sicherheitsnetz im <head> schon gegriffen hat
    // Sofort: alles, was den ersten Bildschirm betrifft.
    safe(initScroll, 'scroll');
    safe(initAnchors, 'anchors');
    safe(initHeader, 'header');
    safe(initMenu, 'menu');
    safe(initSky, 'sky');
    safe(initReveal, 'reveal');
    safe(initSchedule, 'schedule'); // füllt auch die Karte „Nächste Stunde“ im Hero
    // Die Form im Hero erst nach dem ersten Bild: Text und CSS-Form stehen schon, die Leinwand misst dann ohne erzwungenes Layout im Parse-Task.
    requestAnimationFrame(function () { setTimeout(function () { safe(initHero, 'hero'); }, 0); });
    // Danach in eigenen kleinen Tasks (statt eines langen Blocks), damit der
    // erste Bildschirm nicht wartet. Reihenfolge bleibt erhalten, Choreo zuletzt.
    var later = [[initSplit, 'split'], [initEthos, 'ethos'], [initConsent, 'consent'], [initWaves, 'waves'], [initMagnetic, 'magnetic'], [initQuiz, 'quiz'], [initBreathe, 'breathe'], [initPricing, 'pricing'], [initForm, 'form'], [initMap, 'map'], [initTeam, 'team'], [function () { if (scheduleCtx) initDaylight(scheduleCtx.week, scheduleCtx.days); }, 'daylight'], [initChoreo, 'choreo']];
    var step = function () {
      var t = later.shift();
      if (!t) return;
      safe(t[0], t[1]);
      if (later.length) setTimeout(step, 0);
    };
    setTimeout(step, 0);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
