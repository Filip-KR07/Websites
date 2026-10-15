/* ==========================================================================
   Hotel Seeblick am Tegernsee · Modell „Ufer“
   Ohne Build-Schritt. Optional: GSAP + ScrollTrigger, Lenis (assets/vendor).
   Alle Inhalte funktionieren auch ohne diese Bibliotheken.
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
     PREISE & REGELN DER BUCHUNGS-DEMO (unverbindliche Beispielwerte)
     Hier anpassen – alle Beträge in Euro.
     ------------------------------------------------------------------ */
  var BOOKING = {
    // Zimmerpreis pro Nacht für 2 Erwachsene inkl. Frühstück, Spa & Seesauna (Nebensaison)
    RATES: { berg: 189, see: 229, junior: 289, laerche: 369 },
    // Saisonfaktoren (Monat, Tag) – Zeiträume inklusive
    SEASONS: [
      { from: [6, 15], to: [9, 15], factor: 1.18, name: 'Sommersaison' },
      { from: [12, 20], to: [1, 6], factor: 1.25, name: 'Weihnachten & Neujahr' }
    ],
    WEEKEND: 20,          // Aufschlag je Nacht von Freitag auf Samstag und Samstag auf Sonntag
    SINGLE: -30,          // Einzelbelegung je Nacht
    EXTRA_ADULT: 75,      // je weiterem Erwachsenen ab der 3. Person je Nacht
    CHILD: 35,            // je Kind bis 14 Jahre je Nacht (inkl. Frühstück)
    CITY_TAX: 2.8,        // Kurbeitrag je Erwachsenem und Nacht (Beispielwert)
    LONG_STAY_NIGHTS: 5,  // ab so vielen Nächten …
    LONG_STAY_RATE: 0.10, // … dieser Rabatt auf den Zimmerpreis
    MAX_NIGHTS: 21,
    MONTHS_AHEAD: 12,
    CAPACITY: { berg: 2, see: 3, junior: 4, laerche: 4 }, // Personen gesamt
    ROOMS: { berg: 8, see: 10, junior: 4, laerche: 2 },   // Anzahl Zimmer je Kategorie (24 gesamt)
    NAMES: { berg: 'Bergzimmer', see: 'Seezimmer mit Balkon', junior: 'Juniorsuite', laerche: 'Lärchensuite' },
    SHORT: { berg: 'Bergzimmer', see: 'Seezimmer', junior: 'Juniorsuite', laerche: 'Lärchensuite' }
  };

  /* ------------------------------------------------------------------
     Grundlagen
     ------------------------------------------------------------------ */
  var doc = document.documentElement;
  window.__seeblickReady = true;
  var qs = function (s, r) { return (r || document).querySelector(s); };
  var qsa = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var motionOff = doc.classList.contains('motion-off');
  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduced = function () { return motionOff || mqReduce.matches; };
  var mqDesktop = window.matchMedia('(min-width: 900px)');
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasGSAP = !!(window.gsap && window.ScrollTrigger);
  var enhanced = hasGSAP && !reduced();
  if (enhanced) doc.classList.add('enhanced');
  var lenis = null;
  var live = qs('#sr-live');

  function safe(name, fn) {
    try { fn(); } catch (err) { if (window.console) console.warn('[Seeblick] ' + name + ':', err); }
  }
  function announce(text) {
    if (!live) return;
    live.textContent = '';
    setTimeout(function () { live.textContent = text; }, 40);
  }
  function headerH() { return mqDesktop.matches ? 76 : 64; }

  /* ------------------------------------------------------------------
     Tageslicht-Paletten (Stunde → Farben der Seelandschaft)
     ------------------------------------------------------------------ */
  var COLOR_KEYS = ['s1', 's2', 's3', 'sun', 'glow', 'moon', 'far', 'snow', 'back', 'mid', 'near', 'shore', 'l1', 'l2', 'mistc', 'wall', 'roof', 'wood', 'steg', 'hut', 'sail'];
  var NUM_KEYS = ['glowA', 'refl', 'mist', 'stars', 'lights', 'glit'];
  var NIGHT = { s1: '#08141D', s2: '#10222F', s3: '#1E3442', sun: '#FFE7C4', glow: '#9FB6C6', glowA: 0, moon: '#E9EEF2', far: '#1C3040', snow: '#4F6676', back: '#172A37', mid: '#12222D', near: '#0D1A22', shore: '#0A141A', l1: '#18303F', l2: '#060E13', refl: .4, mist: .08, mistc: '#8FA3B0', stars: 1, lights: 1, glit: .22, wall: '#2A3A44', roof: '#0F1A20', wood: '#1E2A31', steg: '#26323A', hut: '#2A343B', sail: '#9DAAB3' };
  var KEYS = [
    { h: 0, p: NIGHT },
    { h: 5.2, p: { s1: '#111D31', s2: '#283652', s3: '#5A566C', sun: '#FFE0C2', glow: '#8E7C95', glowA: .2, moon: '#E9EEF2', far: '#2B394E', snow: '#7A879A', back: '#243146', mid: '#1D2939', near: '#151F27', shore: '#11191F', l1: '#46495E', l2: '#0E1720', refl: .38, mist: .3, mistc: '#B6B0BE', stars: .55, lights: .85, glit: .1, wall: '#4A505E', roof: '#161E26', wood: '#2D3540', steg: '#343C46', hut: '#393F47', sail: '#B9BCC5' } },
    { h: 6.7, p: { s1: '#3B5677', s2: '#B78E9A', s3: '#F4B596', sun: '#FFF0DC', glow: '#F2A88C', glowA: .8, moon: '#F3E9E4', far: '#77809A', snow: '#F6D3C8', back: '#626A84', mid: '#4A5767', near: '#2F3F40', shore: '#253230', l1: '#E2AA96', l2: '#3A4B5E', refl: .5, mist: .6, mistc: '#F6E3DA', stars: .06, lights: .5, glit: .85, wall: '#DDBFB5', roof: '#3E3A40', wood: '#5C4A44', steg: '#7A6155', hut: '#6C5149', sail: '#F7E2D8' } },
    { h: 9, p: { s1: '#87AECB', s2: '#C3D6E0', s3: '#F0E7DC', sun: '#FFFAF0', glow: '#FBE6C9', glowA: .45, moon: '#F3F1EC', far: '#8EA3B7', snow: '#F6F4EF', back: '#7C92A1', mid: '#5C7A7C', near: '#34503F', shore: '#2A3F33', l1: '#B9CFD8', l2: '#3F6479', refl: .45, mist: .4, mistc: '#F3F1EC', stars: 0, lights: 0, glit: .5, wall: '#E7E1D6', roof: '#5A4A3E', wood: '#7C5A3E', steg: '#8A6A4C', hut: '#7A5A40', sail: '#F6F3EC' } },
    { h: 13, p: { s1: '#5B95BC', s2: '#9CC4D9', s3: '#E2EDEF', sun: '#FFFFFF', glow: '#FFF6DC', glowA: .35, moon: '#F3F1EC', far: '#7F9CB1', snow: '#FFFFFF', back: '#6B8999', mid: '#4F7171', near: '#2E4A3B', shore: '#243B2F', l1: '#8BBACE', l2: '#1C3A4A', refl: .38, mist: .1, mistc: '#F3F1EC', stars: 0, lights: 0, glit: .45, wall: '#EFEAE0', roof: '#5A4A3E', wood: '#7C5A3E', steg: '#9A7752', hut: '#84603F', sail: '#FFFFFF' } },
    { h: 16.5, p: { s1: '#6A94B6', s2: '#B3C8D2', s3: '#F2DEC2', sun: '#FFF3D8', glow: '#F8D6A4', glowA: .5, moon: '#F3F1EC', far: '#8894A7', snow: '#FBEFE2', back: '#73828E', mid: '#556D6B', near: '#304A3C', shore: '#263A30', l1: '#C2C7C0', l2: '#284556', refl: .45, mist: .12, mistc: '#F6EBDD', stars: 0, lights: .04, glit: .65, wall: '#EADFCF', roof: '#54453B', wood: '#775638', steg: '#937049', hut: '#7E5C3F', sail: '#FBF3E6' } },
    { h: 19.3, p: { s1: '#2B4465', s2: '#A6707C', s3: '#F3A57D', sun: '#FFD8A6', glow: '#E8A38B', glowA: .95, moon: '#F3E3DA', far: '#5C5571', snow: '#EAB5A4', back: '#4A4661', mid: '#393950', near: '#252A38', shore: '#1E222E', l1: '#E0987D', l2: '#252E44', refl: .55, mist: .22, mistc: '#F0B39C', stars: .08, lights: .9, glit: .95, wall: '#C99C90', roof: '#2C2731', wood: '#4A3A3A', steg: '#5E4A47', hut: '#57433F', sail: '#F3CBB9' } },
    { h: 20.8, p: { s1: '#0F1C31', s2: '#293453', s3: '#6B5872', sun: '#FFC79A', glow: '#B9788A', glowA: .25, moon: '#E9EEF2', far: '#2D3450', snow: '#67647F', back: '#252B44', mid: '#1E2337', near: '#161A27', shore: '#111520', l1: '#544D68', l2: '#0D1321', refl: .42, mist: .14, mistc: '#8F86A0', stars: .6, lights: 1, glit: .3, wall: '#4B4A5A', roof: '#121620', wood: '#24252F', steg: '#2E2F3A', hut: '#33323C', sail: '#A8A4B6' } },
    { h: 22.6, p: NIGHT },
    { h: 24, p: NIGHT }
  ];
  function hexRgb(h) { var n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  KEYS.forEach(function (k) {
    var o = {};
    COLOR_KEYS.forEach(function (c) { o[c] = hexRgb(k.p[c]); });
    NUM_KEYS.forEach(function (c) { o[c] = k.p[c]; });
    k.c = o;
  });
  function smoothT(t) { return t * t * (3 - 2 * t); }
  function paletteAt(h) {
    h = ((h % 24) + 24) % 24;
    var i = 0;
    while (i < KEYS.length - 2 && h >= KEYS[i + 1].h) i++;
    var a = KEYS[i], b = KEYS[i + 1];
    var t = smoothT(clamp((h - a.h) / (b.h - a.h), 0, 1));
    var out = {};
    COLOR_KEYS.forEach(function (c) {
      var x = a.c[c], y = b.c[c];
      out[c] = [Math.round(lerp(x[0], y[0], t)), Math.round(lerp(x[1], y[1], t)), Math.round(lerp(x[2], y[2], t))];
    });
    NUM_KEYS.forEach(function (c) { out[c] = lerp(a.c[c], b.c[c], t); });
    return out;
  }
  function lum(rgb) {
    var f = function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(rgb[0]) + 0.7152 * f(rgb[1]) + 0.0722 * f(rgb[2]);
  }
  // Nur geänderte Variablen schreiben: jede Änderung einer vererbten Variable kostet eine Style-Neuberechnung
  // für die ganze Szene (mehrere hundert SVG-Knoten).
  function applyPalette(el, pal) {
    var s = el.style, last = el.__pal || (el.__pal = {});
    var put = function (k, v) { if (last[k] !== v) { last[k] = v; s.setProperty('--' + k, v); } };
    COLOR_KEYS.forEach(function (c) { var v = pal[c]; put(c, 'rgb(' + v[0] + ' ' + v[1] + ' ' + v[2] + ')'); });
    NUM_KEYS.forEach(function (c) { put(c, pal[c].toFixed(2)); });
  }
  // Text auf dem Himmel: hell oder dunkel? (Mischung aus oberem und mittlerem Himmel)
  function skyIsDark(pal) {
    var m = [lerp(pal.s1[0], pal.s2[0], .3), lerp(pal.s1[1], pal.s2[1], .3), lerp(pal.s1[2], pal.s2[2], .3)];
    var L = lum(m);
    // Kontrast zu Dunkelblau (#14262F, L≈0.018) vs. Nebelweiß (L≈0.88)
    return (0.93 / (L + 0.05)) > ((L + 0.05) / 0.068);
  }
  function hhmm(h) {
    h = ((h % 24) + 24) % 24;
    var H = Math.floor(h), M = Math.round((h - H) * 60);
    if (M === 60) { H = (H + 1) % 24; M = 0; }
    return (H < 10 ? '0' : '') + H + ':' + (M < 10 ? '0' : '') + M;
  }
  function phaseName(h) {
    if (h < 5) return 'Nacht';
    if (h < 8) return 'Morgenrot';
    if (h < 11) return 'Vormittag';
    if (h < 15) return 'Mittag';
    if (h < 18.3) return 'Nachmittag';
    if (h < 21) return 'Abendrot';
    return 'Nacht';
  }
  function lightName(h) {
    var p = phaseName(h);
    return { Nacht: 'Nachtlicht', Morgenrot: 'Morgenlicht', Vormittag: 'Vormittagslicht', Mittag: 'Mittagslicht', Nachmittag: 'Nachmittagslicht', Abendrot: 'Abendlicht' }[p];
  }
  function berlinHour() {
    try {
      var parts = new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
      var H = 0, M = 0;
      parts.forEach(function (p) { if (p.type === 'hour') H = +p.value; if (p.type === 'minute') M = +p.value; });
      return H + M / 60;
    } catch (e) { var d = new Date(); return d.getHours() + d.getMinutes() / 60; }
  }

  /* ------------------------------------------------------------------
     HERO: Tageslicht-Szene
     ------------------------------------------------------------------ */
  var hero = qs('.hero');
  var header = qs('.site-header');
  var heroTone = 'dark';
  var heroState = { hour: 9, live: true, raf: 0 };

  function initHero() {
    if (!hero) return;
    var sun = qs('.scene .sun', hero), moon = qs('.scene .moon', hero), glitter = qs('.scene .glitter', hero);
    var range = qs('.daylight-range', hero), clock = qs('.daylight-clock', hero), phase = qs('.daylight-phase', hero);
    var modes = qsa('.dl-mode', hero), liveBtn = qs('.dl-live', hero);

    function render(h) {
      h = ((h % 24) + 24) % 24;
      var pal = paletteAt(h);
      applyPalette(hero, pal);
      // Sonne
      var sx = 400, sy = 700, sunA = 0;
      if (h > 5.6 && h < 20.9) {
        var t = (h - 5.8) / (20.6 - 5.8);
        sx = 170 + t * 1260; sy = 585 - Math.pow(Math.sin(clamp(t, 0, 1) * Math.PI), 0.7) * 440;
        sunA = clamp(Math.min((h - 5.6) / 0.6, (20.9 - h) / 0.6), 0, 1);
      }
      // Mond
      var hh = h < 12 ? h + 24 : h, mx = 900, my = 700, moonA = 0;
      if (hh > 20.2 && hh < 30.2) {
        var u = (hh - 20.2) / 10;
        mx = 1120 + u * 360; my = 470 - Math.pow(Math.sin(u * Math.PI), 0.7) * 380;
        moonA = clamp(Math.min((hh - 20.2) / 0.8, (30.2 - hh) / 0.8), 0, 1);
      }
      hero.style.setProperty('--sunA', sunA.toFixed(3));
      hero.style.setProperty('--moonA', moonA.toFixed(3));
      if (sun) sun.setAttribute('transform', 'translate(' + sx.toFixed(1) + ' ' + sy.toFixed(1) + ')');
      if (moon) moon.setAttribute('transform', 'translate(' + mx.toFixed(1) + ' ' + my.toFixed(1) + ')');
      if (glitter) glitter.setAttribute('transform', 'translate(' + (sunA > moonA ? sx : mx).toFixed(1) + ' 0)');
      // Tonalität der Schrift
      var dark = skyIsDark(pal);
      var tone = dark ? 'light' : 'dark';
      if (tone !== heroTone) {
        heroTone = tone;
        hero.setAttribute('data-tone', tone);
        hero.style.setProperty('--hero-ink', dark ? '#F3F1EC' : '#14262F');
        syncHeaderTone();
      }
      // Bedienelemente
      if (clock) clock.textContent = hhmm(h);
      if (phase) phase.textContent = phaseName(h);
      if (range && document.activeElement !== range) range.value = String(Math.round(h * 4) / 4 % 24);
      if (range) range.setAttribute('aria-valuetext', hhmm(h).replace(/^0/, '') + ' Uhr – ' + lightName(h));
      heroState.hour = h;
    }

    function setPressed() {
      var h = heroState.target != null ? heroState.target : heroState.hour;
      modes.forEach(function (b) {
        var bh = parseFloat(b.getAttribute('data-hour'));
        var d = Math.abs(((h - bh + 36) % 24) - 12);
        b.setAttribute('aria-pressed', String(!heroState.live && d < 0.2));
      });
      if (liveBtn) liveBtn.setAttribute('aria-pressed', String(heroState.live));
    }

    function tweenTo(target, dur, ease) {
      cancelAnimationFrame(heroState.raf);
      heroState.target = ((target % 24) + 24) % 24;
      if (reduced() || !dur) { render(target); setPressed(); return; }
      var from = heroState.hour;
      var delta = ((target - from + 36) % 24) - 12;
      var t0 = performance.now();
      var easeFn = ease || function (t) { return t < .5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2; };
      (function step(now) {
        var p = clamp((now - t0) / dur, 0, 1);
        render(from + delta * easeFn(p));
        if (p < 1) heroState.raf = requestAnimationFrame(step);
      })(t0);
      setPressed();
    }

    modes.forEach(function (b) {
      b.addEventListener('click', function () {
        heroState.live = false;
        tweenTo(parseFloat(b.getAttribute('data-hour')), 1800);
        setPressed();
      });
    });
    if (liveBtn) liveBtn.addEventListener('click', function () {
      heroState.live = true;
      tweenTo(berlinHour(), 1800);
      setPressed();
    });
    if (range) range.addEventListener('input', function () {
      cancelAnimationFrame(heroState.raf);
      heroState.target = parseFloat(range.value);
      heroState.live = false;
      render(parseFloat(range.value));
      setPressed();
    });
    // Live-Uhr: jede Minute nachführen
    setInterval(function () { if (heroState.live && !document.hidden) { render(berlinHour()); } }, 60000);

    var now = berlinHour();
    if (enhanced) { render(now - 1.2); tweenTo(now, 2600, function (t) { return 1 - Math.pow(1 - t, 3); }); }
    else render(now);
    setPressed();
  }

  function syncHeaderTone() {
    if (!header) return;
    header.setAttribute('data-tone', heroTone);
  }

  /* ------------------------------------------------------------------
     Lenis + GSAP
     ------------------------------------------------------------------ */
  function initScroll() {
    if (enhanced && window.Lenis) {
      lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1 });
      window.__lenis = lenis;
      lenis.on('scroll', window.ScrollTrigger.update);
      window.gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      window.gsap.ticker.lagSmoothing(0);
    }
    if (hasGSAP) window.gsap.registerPlugin(window.ScrollTrigger);

    // Anker-Links weich ansteuern und Fokus mitnehmen
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute('href').slice(1);
      if (!id) return;
      var target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      closeMenu(false);
      var off = -(headerH() + 8);
      if (lenis) lenis.scrollTo(target, { offset: off, duration: 1.4 });
      else {
        var y = target.getBoundingClientRect().top + window.scrollY + off;
        window.scrollTo({ top: y, behavior: reduced() ? 'auto' : 'smooth' });
      }
      if (history.replaceState) history.replaceState(null, '', '#' + id);
      if (!target.hasAttribute('tabindex') && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(target.tagName)) target.setAttribute('tabindex', '-1');
      setTimeout(function () { try { target.focus({ preventScroll: true }); } catch (err) { /* */ } }, lenis ? 700 : 50);
    });
  }

  function initHeroScroll() {
    if (!enhanced || !hero) return;
    var gsap = window.gsap;
    gsap.to(qs('.hero-scene', hero), { yPercent: 6, scale: 1.04, ease: 'none', transformOrigin: '50% 100%', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to(qs('.hero-content', hero), { y: -70, opacity: 0.15, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom 20%', scrub: true } });
  }

  /* ------------------------------------------------------------------
     Header, Fortschritt, aktive Navigation
     ------------------------------------------------------------------ */
  function initHeader() {
    var line = qs('.progress-line'), dot = qs('.progress-sun');
    var actionBar = qs('.action-bar');
    var lastY = window.scrollY, ticking = false;
    function update() {
      ticking = false;
      var y = window.scrollY;
      var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      var p = clamp(y / max, 0, 1);
      if (line) line.style.transform = 'scaleX(' + p.toFixed(4) + ')';
      if (dot) dot.style.transform = 'translateX(' + (p * (window.innerWidth - 4)).toFixed(1) + 'px)';
      if (header) {
        var heroBottom = hero ? hero.offsetHeight - headerH() : 300;
        header.classList.toggle('is-solid', y > 40);
        var goingDown = y > lastY + 4, goingUp = y < lastY - 4;
        if (document.body.classList.contains('menu-open')) header.classList.remove('is-hidden');
        else if (goingDown && y > heroBottom) header.classList.add('is-hidden');
        else if (goingUp || y < heroBottom) header.classList.remove('is-hidden');
      }
      lastY = y;
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update);
    update();

    // Aktive Navigation
    var links = qsa('.nav a[href^="#"]');
    var map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          var a = map[en.target.id];
          if (!a) return;
          if (en.isIntersecting) {
            links.forEach(function (l) { l.removeAttribute('aria-current'); });
            a.setAttribute('aria-current', 'true');
          } else if (a.getAttribute('aria-current')) a.removeAttribute('aria-current');
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
    }
    if (actionBar && 'IntersectionObserver' in window) {
      // Aktionsleiste ausblenden, solange das Anfrageformular im Blick ist (Tastatur auf dem Handy)
      var form = qs('#anfrage');
      if (form) new IntersectionObserver(function (en) { actionBar.classList.toggle('is-hidden', en[0].isIntersecting); }, { rootMargin: '-20% 0px -20% 0px' }).observe(form);
    }
  }

  /* ------------------------------------------------------------------
     Mobiles Menü (Dialog mit Fokusführung)
     ------------------------------------------------------------------ */
  var menu = qs('#menu'), menuBtn = qs('.menu-btn');
  function openMenu() {
    if (!menu || !menuBtn) return;
    menu.hidden = false;
    if (header) header.classList.remove('is-hidden');
    menu.classList.add('is-opening');
    // Reflow, damit der Ausgangszustand greift
    void menu.offsetWidth;
    menu.classList.remove('is-opening');
    menuBtn.setAttribute('aria-expanded', 'true');
    qs('.menu-btn-label', menuBtn).textContent = 'Schließen';
    document.body.classList.add('menu-open');
    document.body.style.overflow = 'hidden';
    if (lenis) lenis.stop();
    var first = qs('a', menu);
    if (first) setTimeout(function () { first.focus(); }, 60);
  }
  function closeMenu(returnFocus) {
    if (!menu || menu.hidden) return;
    menuBtn.setAttribute('aria-expanded', 'false');
    qs('.menu-btn-label', menuBtn).textContent = 'Menü';
    document.body.classList.remove('menu-open');
    document.body.style.overflow = '';
    if (lenis) lenis.start();
    if (reduced()) { menu.hidden = true; }
    else {
      menu.classList.add('is-closing');
      var done = function () { menu.hidden = true; menu.classList.remove('is-closing'); menu.removeEventListener('transitionend', done); };
      menu.addEventListener('transitionend', done);
      setTimeout(done, 500);
    }
    if (returnFocus !== false) menuBtn.focus();
  }
  function initMenu() {
    if (!menu || !menuBtn) return;
    menuBtn.addEventListener('click', function () { if (menu.hidden) openMenu(); else closeMenu(); });
    document.addEventListener('keydown', function (e) {
      if (menu.hidden) return;
      if (e.key === 'Escape') { e.preventDefault(); closeMenu(); return; }
      if (e.key === 'Tab') {
        var f = [menuBtn].concat(qsa('a, button', menu));
        var i = f.indexOf(document.activeElement);
        if (e.shiftKey && (i <= 0)) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
        else if (i === -1) { e.preventDefault(); f[0].focus(); }
      }
    });
    mqDesktop.addEventListener('change', function () { if (mqDesktop.matches) closeMenu(false); });
  }

  /* ------------------------------------------------------------------
     Einblendungen
     ------------------------------------------------------------------ */
  function splitWords(el) {
    var text = el.textContent;
    el.setAttribute('aria-label', text.replace(/\s+/g, ' ').trim());
    el.textContent = '';
    var words = text.trim().split(/ +/);
    words.forEach(function (w, i) {
      var outer = document.createElement('span'); outer.className = 'w'; outer.setAttribute('aria-hidden', 'true');
      var inner = document.createElement('span'); inner.className = 'wi'; inner.textContent = w;
      inner.style.setProperty('--i', i);
      outer.appendChild(inner);
      el.appendChild(outer);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
  }
  function countUp(el) {
    var to = parseInt(el.getAttribute('data-count'), 10);
    if (!to || reduced()) return;
    var t0 = performance.now(), dur = 1400;
    (function step(now) {
      var p = clamp((now - t0) / dur, 0, 1);
      el.textContent = String(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }
  function initReveals() {
    qsa('[data-split]').forEach(splitWords);
    qsa('[data-reveal-stagger]').forEach(function (g) { Array.prototype.forEach.call(g.children, function (c, i) { c.style.setProperty('--i', i); }); });
    var els = qsa('[data-reveal], [data-reveal-stagger], [data-clip], .sec-mark, [data-split], .rating-bars, [data-history]');
    if (!('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add('is-in'); }); return; }
    // Elemente mit clip-path werden über ihr Elternelement beobachtet (ein voll beschnittenes Element „schneidet“ nie).
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        (en.target.__revealFor || [en.target]).forEach(function (el) {
          el.classList.add('is-in');
          if (el.matches('[data-reveal-stagger]')) qsa('[data-count]', el).forEach(countUp);
        });
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    els.forEach(function (el) {
      if (el.hasAttribute('data-clip') && el.parentElement) {
        var p = el.parentElement;
        if (!p.__revealFor) { p.__revealFor = []; io.observe(p); }
        p.__revealFor.push(el);
        return;
      }
      io.observe(el);
    });
    // Hero
    var go = function () { if (hero) hero.classList.add('is-in'); };
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(function () { requestAnimationFrame(go); }); setTimeout(go, 900); }
    else requestAnimationFrame(go);
  }

  /* ------------------------------------------------------------------
     Zimmer-Explorer
     ------------------------------------------------------------------ */
  function initGallery(g) {
    var imgs = qsa('.gallery-stage img', g);
    var cur = 0;
    var curEl = qs('[data-cur]', g), totalEl = qs('[data-total]', g);
    if (totalEl) totalEl.textContent = imgs.length;
    function show(i) {
      cur = (i + imgs.length) % imgs.length;
      imgs.forEach(function (im, k) {
        im.classList.toggle('is-active', k === cur);
        // ausgeblendete Bilder auch für Screenreader verbergen (nur das sichtbare Bild zählt)
        if (k === cur) im.removeAttribute('aria-hidden'); else im.setAttribute('aria-hidden', 'true');
        if (k === cur && im.loading === 'lazy') im.loading = 'eager';
      });
      if (curEl) curEl.textContent = cur + 1;
    }
    imgs.forEach(function (im, k) { if (k !== cur) im.setAttribute('aria-hidden', 'true'); });
    var prev = qs('[data-prev]', g), next = qs('[data-next]', g);
    if (prev) prev.addEventListener('click', function () { show(cur - 1); });
    if (next) next.addEventListener('click', function () { show(cur + 1); });
    var stage = qs('.gallery-stage', g), x0 = null;
    if (stage) {
      stage.addEventListener('pointerdown', function (e) { x0 = e.clientX; });
      stage.addEventListener('pointerup', function (e) {
        if (x0 === null) return;
        var dx = e.clientX - x0; x0 = null;
        if (Math.abs(dx) > 40) show(cur + (dx < 0 ? 1 : -1));
      });
      stage.addEventListener('pointercancel', function () { x0 = null; });
    }
  }
  function initRooms() {
    var ex = qs('[data-explorer]');
    if (!ex) return;
    var tabs = qsa('[role="tab"]', ex);
    var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });
    var tablist = qs('[role="tablist"]', ex);
    function select(i, focus) {
      tabs.forEach(function (t, k) {
        var on = k === i;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        panels[k].hidden = !on;
        if (on && !reduced()) {
          panels[k].classList.remove('is-entering'); void panels[k].offsetWidth; panels[k].classList.add('is-entering');
          setTimeout(function () { panels[k].classList.remove('is-entering'); }, 1100);
        }
      });
      tablist.style.setProperty('--tab', i);
      var ind = qs('.tab-indicator', ex); if (ind) ind.style.setProperty('--tab', i);
      if (focus) tabs[i].focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(i, false); });
      t.addEventListener('keydown', function (e) {
        var n = tabs.length, to = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') to = (i + 1) % n;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') to = (i - 1 + n) % n;
        else if (e.key === 'Home') to = 0;
        else if (e.key === 'End') to = n - 1;
        if (to !== null) { e.preventDefault(); select(to, true); }
      });
    });
    panels.forEach(function (p) { p.tabIndex = 0; });
    select(0, false);
    qsa('[data-gallery]', ex).forEach(initGallery);

    // Ausstattung ↔ Grundriss (nur Maus, rein dekorativ)
    if (finePointer) {
      panels.forEach(function (p) {
        var items = qsa('[data-zone]', p);
        function hot(zone, on) { items.forEach(function (el) { if (el.getAttribute('data-zone') === zone) el.classList.toggle('is-hot', on); }); }
        items.forEach(function (el) {
          el.addEventListener('mouseenter', function () { hot(el.getAttribute('data-zone'), true); });
          el.addEventListener('mouseleave', function () { hot(el.getAttribute('data-zone'), false); });
        });
      });
    }
    // Kategorie in die Buchung übernehmen
    qsa('[data-pick-room]').forEach(function (b) {
      b.addEventListener('click', function () { if (window.__seeblickPickRoom) window.__seeblickPickRoom(b.getAttribute('data-pick-room')); });
    });
  }

  /* ------------------------------------------------------------------
     Panorama-Streifen
     ------------------------------------------------------------------ */
  function initPano() {
    var pano = qs('.pano');
    if (!pano) return;
    var pin = qs('.pano-pin', pano), sky = qs('.pano-sky', pano), sunEl = qs('.pano-sun', pano);
    var far = qs('.pano-far', pano), mid = qs('.pano-mid', pano), near = qs('.pano-near', pano);
    var clock = qs('.pano-clock', pano);
    var caps = qsa('.pano-captions li', pano);
    var tone = '';
    var lastCap = -1;
    function setHour(h) {
      var pal = paletteAt(h);
      applyPalette(pano, pal);
      var t = clamp((h - 5.8) / (20.6 - 5.8), 0, 1);
      var W = sky.clientWidth, H = sky.clientHeight;
      var x = W * (0.08 + t * 0.84), y = H * (1.06 - Math.sin(t * Math.PI) * 0.82);
      sunEl.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
      var dark = skyIsDark(pal);
      var nt = dark ? '#F3F1EC' : '#14262F';
      if (nt !== tone) { tone = nt; pano.style.setProperty('--pano-ink', nt); }
      if (clock) clock.textContent = hhmm(Math.round(h * 6) / 6);
    }
    function setCap(h) {
      // Bildunterschrift passend zum Licht der Szene (Paletten-Stützstellen: 6:40 Morgenrot, 9:00 Tag, 19:20 Abendrot)
      var i = h < 8 ? 0 : h < 12 ? 1 : h < 18.2 ? 2 : 3;
      i = clamp(i, 0, caps.length - 1);
      if (i === lastCap) return false;
      lastCap = i;
      caps.forEach(function (c, k) { c.classList.toggle('is-active', k === i); });
      return true;
    }
    // Gipfelnamen ausblenden, solange sie unter dem Textblock liegen (nur Desktop)
    var peaks = qsa('.peak', far).map(function (g) { var m = /translate\(([\d.]+)/.exec(g.getAttribute('transform')); return { g: g, x: m ? parseFloat(m[1]) : 0 }; });
    var copyRight = 0;
    function measureCopy() {
      var r = 0;
      qsa('.pano-title, .pano-clock, .pano-captions li.is-active', pano).forEach(function (el) { r = Math.max(r, el.getBoundingClientRect().right); });
      copyRight = r;
    }
    function fadePeaks() {
      if (!mqDesktop.matches) return;
      var x0 = window.gsap ? window.gsap.getProperty(far, 'x') : 0;
      var sc = far.offsetHeight / 700;
      peaks.forEach(function (p) {
        var x = x0 + p.x * sc;
        p.g.style.opacity = clamp((x - copyRight - 30) / 110, 0, 1).toFixed(2);
      });
    }
    // Scroll-Fortschritt → Uhrzeit: Morgen- und Abendrot bekommen mehr Scrollweg als der helle Mittag.
    var STOPS = [[0, 6.4], [0.24, 8], [0.46, 12], [0.7, 18.2], [1, 20.2]];
    function hourAt(p) {
      p = clamp(p, 0, 1);
      for (var k = 1; k < STOPS.length; k++) {
        if (p <= STOPS[k][0]) { var a = STOPS[k - 1], b = STOPS[k]; return lerp(a[1], b[1], (p - a[0]) / (b[0] - a[0])); }
      }
      return STOPS[STOPS.length - 1][1];
    }
    var lastH = -1;
    function update(p) {
      // auf Minuten runden: Scrub-Nachlauf ohne sichtbare Änderung kostet so keine Neuberechnung
      var h = Math.round(hourAt(p) * 60) / 60;
      if (h === lastH) return;
      lastH = h;
      setHour(h); if (setCap(h)) measureCopy();
    }
    window.addEventListener('resize', measureCopy);

    if (!enhanced) { setHour(6.8); return; }
    var gsap = window.gsap, ST = window.ScrollTrigger;
    var mm = gsap.matchMedia();
    var travel = function (el, f) { return function () { return -Math.max(0, el.offsetWidth - pin.clientWidth) * f; }; };
    mm.add('(min-width: 900px)', function () {
      // Die Bühne klebt per CSS (position: sticky, Höhe in style.css) – kein GSAP-Pin, daher kein Layout-Sprung.
      var tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: pano, start: 'top top', end: 'bottom bottom',
          scrub: 0.6, invalidateOnRefresh: true,
          onUpdate: function (self) { update(self.progress); }
        }
      });
      tl.fromTo(far, { x: 0 }, { x: travel(far, 1) }, 0)
        .fromTo(mid, { x: 0 }, { x: travel(mid, 1) }, 0)
        .fromTo(near, { x: 0 }, { x: travel(near, 1) }, 0);
      tl.eventCallback('onUpdate', fadePeaks);
      update(0);
    });
    mm.add('(max-width: 899px)', function () {
      var tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: pano, start: 'top bottom', end: 'bottom top', scrub: 0.5, invalidateOnRefresh: true,
          onUpdate: function (self) { update(clamp((self.progress - 0.15) / 0.7, 0, 1)); }
        }
      });
      tl.fromTo(far, { x: travel(far, 0.12) }, { x: travel(far, 0.5) }, 0)
        .fromTo(mid, { x: travel(mid, 0.1) }, { x: travel(mid, 0.55) }, 0)
        .fromTo(near, { x: travel(near, 0.08) }, { x: travel(near, 0.6) }, 0);
      update(0);
    });
    ST.addEventListener('refreshInit', function () { lastCap = -1; lastH = -1; });
    ST.addEventListener('refresh', function () { measureCopy(); fadePeaks(); });
    measureCopy(); fadePeaks();
  }

  /* ------------------------------------------------------------------
     „Ihr Aufenthalt“-Planer
     ------------------------------------------------------------------ */
  var PLAN_ITEMS = [
    { id: 'saunafrueh', i: 'spa', slot: 'frueh', time: '07:00', name: 'Frühaufguss in der Seesauna', text: 'Latschenkiefer-Aufguss, danach drei Stufen hinunter in den See. Der stillste Moment des Tages.', tags: ['20 Min.', '85 °C'], sauna: 1 },
    { id: 'neureuth', i: 'wandern', slot: 'vormittag', tempo: 'ruhig', time: '09:30', name: 'Auf die Neureuth', text: 'Ab Tegernsee gut zwei Stunden bergauf, oben Brotzeit mit Blick über den ganzen See. Zurück auf demselben Weg.', tags: ['ca. 7 km', '450 Hm'], km: 7, hm: 450 },
    { id: 'wallberg', i: 'wandern', slot: 'vormittag', tempo: 'aktiv', time: '09:00', name: 'Wallberg zu Fuß', text: 'Von Rottach-Egern über den Gipfelsteig auf 1.722 m, hinunter mit der Bahn. Trittsicherheit nötig.', tags: ['ca. 9 km', '900 Hm'], km: 9, hm: 900 },
    { id: 'huette', i: 'wandern', slot: 'mittag', needs: 'wandern', time: '12:30', name: 'Brotzeit auf der Hütte', text: 'Kaspressknödel, Radler, Aussicht. Die Rezeption sagt Ihnen morgens, welche Hütte heute offen hat.', tags: [] },
    { id: 'kapelle', i: 'wandern', slot: 'nachmittag', time: '14:30', name: 'Zur Riederstein-Kapelle', text: 'Über den Kreuzweg zur kleinen Kapelle auf dem Felsen – kurz, aber steil. Oben liegt der See wie eine Karte unter Ihnen.', tags: ['ca. 5 km', '380 Hm'], km: 5, hm: 380 },
    { id: 'sennerei', i: 'kulinarik', slot: 'vormittag', time: '10:00', name: 'Führung in der Sennerei', text: 'Wie aus Heumilch Bergkäse wird – mit Verkostung. Dienstag bis Samstag, bitte am Vortag anmelden.', tags: ['90 Min.', '11 km'] },
    { id: 'renke', i: 'kulinarik', slot: 'mittag', time: '12:30', name: 'Renke aus dem Rauch', text: 'Bei der Fischerei am Ostufer, direkt am Wasser. Mit Brezn und frisch geriebenem Meerrettich.', tags: ['4 km'] },
    { id: 'datschi', i: 'kulinarik', slot: 'nachmittag', tempo: 'ruhig', time: '15:30', name: 'Kuchen auf der Seeterrasse', text: 'Rosa Hofers Zwetschgendatschi (in der Saison) oder Apfelstrudel, dazu Kaffee aus der Rösterei in Rottach.', tags: [] },
    { id: 'menue', i: 'kulinarik', slot: 'abend', time: '19:00', key: true, name: 'Menü „Tal & See“', text: 'Fünf Gänge in der Seestube: Renke, Kalbsbackerl, Bergkäse, Datschi. Mittwochs Brotzeitabend.', tags: ['52 € p. P.'] },
    { id: 'seerunde', i: 'rad', slot: 'vormittag', tempo: 'ruhig', time: '09:30', name: 'Seerunde mit dem E-Bike', text: 'Einmal um den Tegernsee, fast eben, mit Badestopp in Bad Wiessee. E-Bikes gibt es an der Rezeption.', tags: ['ca. 20 km', 'flach'], km: 20 },
    { id: 'kreuth', i: 'rad', slot: 'vormittag', tempo: 'aktiv', time: '09:00', name: 'Durchs Weißachtal nach Kreuth', text: 'Über Rottach-Egern ins Weißachtal bis Wildbad Kreuth, zurück am Ostufer entlang.', tags: ['ca. 34 km', '300 Hm'], km: 34, hm: 300 },
    { id: 'badeplatz', i: 'rad', slot: 'nachmittag', time: '14:30', name: 'Mit dem Rad zum Kiesstrand', text: 'Eine Viertelstunde am Westufer entlang zu einem Badeplatz, den kaum jemand kennt. Handtücher gibt es am Steg.', tags: ['ca. 8 km'], km: 8 },
    { id: 'massage', i: 'spa', slot: 'nachmittag', tempo: 'ruhig', time: '15:00', name: 'Latschenkiefer-Massage', text: 'Fünfzig Minuten im Behandlungsraum unterm Dach, danach Tee in der Wolkenstube.', tags: ['50 Min.'] },
    { id: 'aufguss', i: 'spa', slot: 'vorabend', time: '17:00', name: 'Aufguss um fünf, dann der See', text: 'Bergheu-Aufguss mit Jakob Streicher, über die Leiter ins Wasser – danach die Liegen mit Blick auf den Wallberg.', tags: ['2 Gänge'], sauna: 2 }
  ];
  var PLAN_FIXED = {
    fruehstueck: { time: '08:00', key: true, name: 'Frühstück in der Seestube', text: 'Bergkäse aus Kreuth, Waldhonig aus Gmund, Eierspeisen nach Wunsch – bei Sonne auf der Terrasse.', tags: [] },
    fruehstueckSpaet: { time: '08:30', key: true, name: 'Frühstück in der Seestube', text: 'In Ruhe bis halb zwölf: Bergkäse aus Kreuth, Waldhonig aus Gmund, Eierspeisen nach Wunsch.', tags: [] },
    vormittag: { time: '10:00', name: 'Ruderboot und Steg', text: 'Das Ruderboot von 1961 liegt am Steg bereit. Schwimmwesten hängen in der Bootshütte.', tags: [] },
    mittag: { time: '12:30', name: 'Kleine Karte auf der Seeterrasse', text: 'Suppe, Brotzeitbrett oder Salat aus dem Garten – ab 12 Uhr.', tags: [] },
    nachmittag: { time: '15:00', name: 'Liegestuhl am Ufer', text: 'Ein Buch aus dem Kaminzimmer, Handtücher am Steg und ab und zu ein Sprung ins Wasser.', tags: [] },
    vorabend: { time: '17:30', name: 'Spaziergang nach Gmund', text: 'Zehn Minuten am Ufer entlang bis zur Mangfallbrücke, zurück über den Kirchberg.', tags: ['ca. 2 km'], km: 2 },
    abend: { time: '19:00', key: true, name: 'Abendessen in der Seestube', text: 'À la carte oder Halbpension – die Renke kommt aus dem See vor dem Fenster.', tags: [] },
    spaet: { time: '21:30', name: 'Noch einmal auf den Steg', text: 'Die Lichter von Bad Wiessee auf dem Wasser, bei klarer Nacht Sterne über dem Wallberg.', tags: [] }
  };
  var planText = '';
  function initPlanner() {
    var root = qs('.planner');
    if (!root) return;
    var chips = qsa('[data-interest]', root), segBtns = qsa('.seg-btn', root), seg = qs('.seg', root);
    var list = qs('.timeline', root), stats = qs('.plan-stats', root);
    var moods = qsa('.planner-mood img', root);
    var order = ['spa', 'wandern'];
    var tempo = 'ruhig';

    function pick(slot, sel, used, counts, chosen) {
      var cands = PLAN_ITEMS.filter(function (it) {
        return it.slot === slot && sel.indexOf(it.i) > -1 && (!it.tempo || it.tempo === tempo) && !used[it.id] && (!it.needs || chosen[it.needs + ':vormittag']);
      });
      if (!cands.length) return null;
      cands.sort(function (a, b) { return (counts[a.i] || 0) - (counts[b.i] || 0) || sel.indexOf(a.i) - sel.indexOf(b.i); });
      var it = cands[0];
      used[it.id] = true; counts[it.i] = (counts[it.i] || 0) + 1; chosen[it.i + ':' + slot] = true;
      return it;
    }
    function build() {
      var sel = order.slice();
      var used = {}, counts = {}, chosen = {}, out = [];
      var push = function (it) { if (it) out.push(it); };
      push(pick('frueh', sel, used, counts, chosen));
      push(out.length || tempo === 'aktiv' ? PLAN_FIXED.fruehstueck : PLAN_FIXED.fruehstueckSpaet);
      push(pick('vormittag', sel, used, counts, chosen) || PLAN_FIXED.vormittag);
      push(pick('mittag', sel, used, counts, chosen) || PLAN_FIXED.mittag);
      push(pick('nachmittag', sel, used, counts, chosen) || PLAN_FIXED.nachmittag);
      push(pick('vorabend', sel, used, counts, chosen) || PLAN_FIXED.vorabend);
      push(pick('abend', sel, used, counts, chosen) || PLAN_FIXED.abend);
      push(PLAN_FIXED.spaet);
      return out;
    }
    function render(animate) {
      var items = build();
      list.replaceChildren();
      var km = 0, hm = 0, sauna = 0;
      items.forEach(function (it, idx) {
        km += it.km || 0; hm += it.hm || 0; sauna += it.sauna || 0;
        var li = document.createElement('li');
        li.className = 'tl-item' + (it.key ? ' tl-key' : '') + (animate ? ' is-new' : '');
        li.style.setProperty('--i', idx);
        var time = document.createElement('span'); time.className = 'tl-time num'; time.textContent = it.time;
        var body = document.createElement('div'); body.className = 'tl-body';
        var n = document.createElement('p'); n.className = 'tl-name'; n.textContent = it.name;
        var t = document.createElement('p'); t.className = 'tl-text'; t.textContent = it.text;
        body.appendChild(n); body.appendChild(t);
        if (it.tags && it.tags.length) {
          var tags = document.createElement('p'); tags.className = 'tl-tags';
          it.tags.forEach(function (tg) { var s = document.createElement('span'); s.className = 'tl-tag'; s.textContent = tg; tags.appendChild(s); });
          body.appendChild(tags);
        }
        li.appendChild(time); li.appendChild(body);
        list.appendChild(li);
      });
      var parts = [];
      if (km) parts.push('≈ ' + km + ' km');
      if (hm) parts.push(hm + ' Hm');
      if (sauna) parts.push(sauna + (sauna === 1 ? ' Saunagang' : ' Saunagänge'));
      if (!order.length) parts = ['Ein Tag ohne Programm'];
      if (!parts.length) parts = ['Ein ruhiger Tag am See'];
      stats.textContent = parts.join(' · ');
      planText = items.map(function (it) { return it.time + ' ' + it.name; }).join('\n');
      // Stimmungsbild
      var mood = order[order.length - 1];
      if (mood) moods.forEach(function (m) { m.classList.toggle('is-active', m.getAttribute('data-mood') === mood); });
    }
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        var k = c.getAttribute('data-interest');
        var on = c.getAttribute('aria-pressed') !== 'true';
        c.setAttribute('aria-pressed', String(on));
        order = order.filter(function (x) { return x !== k; });
        if (on) order.push(k);
        render(true);
      });
    });
    function setTempo(v, focus) {
      tempo = v;
      segBtns.forEach(function (b) { var on = b.getAttribute('data-tempo') === v; b.setAttribute('aria-checked', String(on)); b.tabIndex = on ? 0 : -1; if (on && focus) b.focus(); });
      seg.setAttribute('data-value', v);
      render(true);
    }
    segBtns.forEach(function (b, i) {
      b.addEventListener('click', function () { setTempo(b.getAttribute('data-tempo'), false); });
      b.addEventListener('keydown', function (e) {
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].indexOf(e.key) > -1) {
          e.preventDefault();
          setTempo(segBtns[(i + 1) % segBtns.length].getAttribute('data-tempo'), true);
        }
      });
    });
    segBtns.forEach(function (b) { b.tabIndex = b.getAttribute('aria-checked') === 'true' ? 0 : -1; });
    render(false);

    var toForm = qs('[data-plan-to-form]', root);
    if (toForm) toForm.addEventListener('click', function () {
      var ta = qs('#f-msg');
      if (!ta) return;
      var block = 'Tagesplan-Wunsch:\n' + planText;
      ta.value = ta.value ? ta.value.replace(/\s+$/, '') + '\n\n' + block : block;
      var label = toForm.textContent;
      toForm.textContent = 'Zur Anfrage hinzugefügt ✓';
      announce('Der Tagesplan wurde ins Feld „Wünsche“ der Anfrage übernommen.');
      setTimeout(function () { toForm.textContent = label; }, 2600);
    });
  }

  /* ------------------------------------------------------------------
     Buchungs-Widget
     ------------------------------------------------------------------ */
  var fmtEUR = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  var fmtEUR2 = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var money = function (v) { return Math.abs(v - Math.round(v)) > 0.001 ? fmtEUR2.format(v) : fmtEUR.format(v); };
  var fmtShort = new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: 'numeric', month: 'short' });
  var fmtLong = new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  var fmtMonth = new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' });
  var fmtFull = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });

  function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function fromIso(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function addDays(d, n) { var x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); return x; }
  function daysBetween(a, b) { return Math.round((fromIso(b) - fromIso(a)) / 86400000); }
  function hash01(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15;
    return (h >>> 0) / 4294967296;
  }
  function inSeason(d) {
    var m = d.getMonth() + 1, day = d.getDate(), v = m * 100 + day;
    for (var i = 0; i < BOOKING.SEASONS.length; i++) {
      var s = BOOKING.SEASONS[i], a = s.from[0] * 100 + s.from[1], b = s.to[0] * 100 + s.to[1];
      if (a <= b ? (v >= a && v <= b) : (v >= a || v <= b)) return s;
    }
    return null;
  }
  function isWeekendNight(d) { var w = d.getDay(); return w === 5 || w === 6; }
  function freeRooms(dIso, cat) {
    var d = fromIso(dIso);
    var demand = 0.34 + (isWeekendNight(d) ? 0.2 : 0) + (inSeason(d) ? 0.16 : 0);
    var r = hash01(dIso + '|' + cat);
    var occ = Math.round(BOOKING.ROOMS[cat] * clamp(demand + (r - 0.5) * 0.84, 0, 1));
    return Math.max(0, BOOKING.ROOMS[cat] - occ);
  }
  function nightPrice(d, cat, adults) {
    var s = inSeason(d);
    var p = Math.round(BOOKING.RATES[cat] * (s ? s.factor : 1));
    if (isWeekendNight(d)) p += BOOKING.WEEKEND;
    if (adults === 1) p += BOOKING.SINGLE;
    if (adults > 2) p += (adults - 2) * BOOKING.EXTRA_ADULT;
    return p;
  }

  var bookState = null;
  function initBooking() {
    var root = qs('[data-booker]');
    if (!root) return;
    var monthsEl = qs('[data-cal-months]', root), hint = qs('[data-cal-hint]', root);
    var prevBtn = qs('[data-cal-prev]', root), nextBtn = qs('[data-cal-next]', root);
    var arrLabel = qs('[data-arr-label]', root), depLabel = qs('[data-dep-label]', root), nightsEl = qs('[data-nights]', root);
    var fieldArr = qs('[data-field="arr"]', root), fieldDep = qs('[data-field="dep"]', root);
    var quote = qs('.quote', root);
    var qStatus = qs('[data-q-status-text]', root), qRoom = qs('[data-q-room]', root), qDates = qs('[data-q-dates]', root);
    var qLines = qs('[data-q-lines]', root), qTotal = qs('[data-q-total]', root), qPer = qs('[data-q-per]', root), qAlt = qs('[data-q-alt]', root);
    var qCta = qs('[data-q-cta]', root);
    var radios = qsa('input[name="cat"]', root);
    var mq2 = window.matchMedia('(min-width: 760px)');

    var today = new Date(); today = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    var maxDate = new Date(today.getFullYear(), today.getMonth() + BOOKING.MONTHS_AHEAD + 1, 0);
    var S = bookState = {
      arr: null, dep: null, cat: 'see', adults: 2, children: 0,
      view: new Date(today.getFullYear(), today.getMonth(), 1),
      focus: iso(today), preview: null
    };

    function guests() { return S.adults + S.children; }
    function nightsOf(a, b) { var out = [], d = fromIso(a), end = fromIso(b); while (d < end) { out.push(iso(d)); d = addDays(d, 1); } return out; }
    function rangeFree(a, b, cat) { return nightsOf(a, b).every(function (n) { return freeRooms(n, cat) > 0; }); }
    function inBounds(dIso) { var d = fromIso(dIso); return d >= today && d <= maxDate; }
    function canArrive(dIso) { return inBounds(dIso) && freeRooms(dIso, S.cat) > 0 && fromIso(dIso) < maxDate; }
    function picking() { return S.arr && !S.dep ? 'dep' : 'arr'; }
    function selectable(dIso) {
      if (!inBounds(dIso)) return false;
      if (picking() === 'arr') return canArrive(dIso);
      if (dIso <= S.arr) return canArrive(dIso);
      var n = daysBetween(S.arr, dIso);
      return n <= BOOKING.MAX_NIGHTS && rangeFree(S.arr, dIso, S.cat);
    }
    function monthsShown() { return mq2.matches ? 2 : 1; }

    function dayLabel(d, dIso, free, price) {
      var parts = [fmtLong.format(d)];
      if (!inBounds(dIso)) parts.push('nicht buchbar');
      else if (free === 0) parts.push('ausgebucht');
      else parts.push(price + ' Euro pro Nacht' + (free <= 2 ? ', nur noch ' + free + ' frei' : ''));
      if (dIso === S.arr) parts.push('Anreise');
      if (dIso === S.dep) parts.push('Abreise');
      return parts.join(', ');
    }

    function renderCal(keepFocus) {
      var hadFocus = keepFocus && monthsEl.contains(document.activeElement);
      monthsEl.replaceChildren();
      var n = monthsShown();
      var fy = fromIso(S.focus);
      for (var m = 0; m < n; m++) {
        var first = new Date(S.view.getFullYear(), S.view.getMonth() + m, 1);
        var wrap = document.createElement('div'); wrap.className = 'cal-month';
        var title = document.createElement('p'); title.className = 'cal-title'; title.id = 'cal-t-' + m; title.textContent = fmtMonth.format(first);
        wrap.appendChild(title);
        var table = document.createElement('table'); table.className = 'cal-grid'; table.setAttribute('role', 'grid'); table.setAttribute('aria-labelledby', title.id);
        var thead = document.createElement('thead'), trh = document.createElement('tr');
        ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].forEach(function (w, k) {
          var th = document.createElement('th'); th.scope = 'col'; th.textContent = w;
          th.setAttribute('abbr', ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'][k]);
          trh.appendChild(th);
        });
        thead.appendChild(trh); table.appendChild(thead);
        var tbody = document.createElement('tbody');
        var offset = (first.getDay() + 6) % 7;
        var daysIn = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
        var tr = document.createElement('tr');
        for (var e = 0; e < offset; e++) { var td0 = document.createElement('td'); td0.setAttribute('role', 'gridcell'); tr.appendChild(td0); }
        for (var day = 1; day <= daysIn; day++) {
          var d = new Date(first.getFullYear(), first.getMonth(), day), dIso = iso(d);
          var td = document.createElement('td'); td.setAttribute('role', 'gridcell');
          var free = inBounds(dIso) ? freeRooms(dIso, S.cat) : 0;
          var price = nightPrice(d, S.cat, S.adults);
          var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'day'; btn.setAttribute('data-date', dIso);
          var num = document.createElement('span'); num.className = 'day-num'; num.textContent = day;
          var pr = document.createElement('span'); pr.className = 'day-price';
          pr.textContent = inBounds(dIso) ? (free > 0 ? String(price) : '–') : '';
          btn.appendChild(num); btn.appendChild(pr);
          if (inBounds(dIso) && free === 0) btn.classList.add('is-full');
          else if (inBounds(dIso) && free <= (BOOKING.ROOMS[S.cat] <= 2 ? 1 : 2)) btn.classList.add('is-few');
          if (dIso === iso(today)) { btn.classList.add('is-today'); btn.setAttribute('aria-current', 'date'); }
          if (!selectable(dIso)) btn.setAttribute('aria-disabled', 'true');
          if (dIso === S.arr) { btn.classList.add('is-start'); td.classList.add('is-start'); }
          if (dIso === S.dep) { btn.classList.add('is-end'); td.classList.add('is-end'); }
          if (S.arr && S.dep && dIso > S.arr && dIso < S.dep) td.classList.add('in-range');
          if (S.arr && S.dep) td.setAttribute('aria-selected', String(dIso >= S.arr && dIso <= S.dep));
          btn.setAttribute('aria-label', dayLabel(d, dIso, free, price));
          btn.tabIndex = dIso === S.focus ? 0 : -1;
          td.appendChild(btn); tr.appendChild(td);
          if ((offset + day) % 7 === 0) { tbody.appendChild(tr); tr = document.createElement('tr'); }
        }
        if (tr.children.length) { while (tr.children.length < 7) { var tdx = document.createElement('td'); tdx.setAttribute('role', 'gridcell'); tr.appendChild(tdx); } tbody.appendChild(tr); }
        table.appendChild(tbody); wrap.appendChild(table); monthsEl.appendChild(wrap);
      }
      // Fokus-Button sicherstellen
      if (!qs('.day[tabindex="0"]', monthsEl)) { var f = qs('.day:not([aria-disabled])', monthsEl) || qs('.day', monthsEl); if (f) { f.tabIndex = 0; } }
      if (hadFocus) { var fb = qs('.day[data-date="' + S.focus + '"]', monthsEl); if (fb) fb.focus(); }
      prevBtn.disabled = S.view <= new Date(today.getFullYear(), today.getMonth(), 1);
      var lastShown = new Date(S.view.getFullYear(), S.view.getMonth() + n - 1, 1);
      nextBtn.disabled = lastShown >= new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
      paintPreview();
      void fy;
    }
    function paintPreview() {
      qsa('td.is-preview', monthsEl).forEach(function (td) { td.classList.remove('is-preview'); });
      if (!S.arr || S.dep || !S.preview || S.preview <= S.arr) return;
      qsa('.day', monthsEl).forEach(function (b) {
        var di = b.getAttribute('data-date');
        if (di > S.arr && di <= S.preview) b.parentNode.classList.add('is-preview');
      });
    }

    function setHint(text, warn) { hint.textContent = text; hint.classList.toggle('is-warn', !!warn); }
    function updateFields() {
      arrLabel.textContent = S.arr ? fmtShort.format(fromIso(S.arr)) : 'Datum wählen';
      depLabel.textContent = S.dep ? fmtShort.format(fromIso(S.dep)) : 'Datum wählen';
      var n = S.arr && S.dep ? daysBetween(S.arr, S.dep) : 0;
      nightsEl.textContent = n ? n + (n === 1 ? ' Nacht' : ' Nächte') : '–';
      fieldArr.classList.toggle('is-active', picking() === 'arr');
      fieldDep.classList.toggle('is-active', picking() === 'dep');
    }

    function onDay(dIso) {
      if (picking() === 'arr' || dIso <= S.arr) {
        if (!canArrive(dIso)) { setHint('An diesem Tag ist die Kategorie ausgebucht – bitte anderen Anreisetag wählen.', true); return; }
        S.arr = dIso; S.dep = null; S.preview = null;
        setHint('Jetzt den Abreisetag wählen.');
      } else {
        var n = daysBetween(S.arr, dIso);
        if (n > BOOKING.MAX_NIGHTS) { setHint('Online bis ' + BOOKING.MAX_NIGHTS + ' Nächte – für längere Aufenthalte rufen Sie uns gern an.', true); return; }
        if (!rangeFree(S.arr, dIso, S.cat)) { setHint('Dazwischen ist eine Nacht ausgebucht. Wählen Sie einen früheren Abreisetag oder eine andere Kategorie.', true); return; }
        S.dep = dIso; S.preview = null;
        setHint(n + (n === 1 ? ' Nacht' : ' Nächte') + ' gewählt. Klicken Sie erneut, um neu zu beginnen.');
      }
      S.focus = dIso;
      renderCal(true); updateFields(); updateQuote(true);
    }

    monthsEl.addEventListener('click', function (e) {
      var b = e.target.closest('.day');
      if (!b) return;
      if (b.getAttribute('aria-disabled') === 'true') {
        var di = b.getAttribute('data-date');
        if (!inBounds(di)) setHint('Dieser Tag ist nicht buchbar.', true);
        else if (picking() === 'dep' && di > S.arr) setHint(daysBetween(S.arr, di) > BOOKING.MAX_NIGHTS ? 'Online bis ' + BOOKING.MAX_NIGHTS + ' Nächte – länger gern telefonisch.' : 'Bis zu diesem Tag ist eine Nacht ausgebucht.', true);
        else setHint('An diesem Tag ist ' + BOOKING.SHORT[S.cat] + ' ausgebucht.', true);
        return;
      }
      onDay(b.getAttribute('data-date'));
    });
    if (finePointer) {
      monthsEl.addEventListener('mouseover', function (e) {
        var b = e.target.closest('.day');
        if (!b || picking() !== 'dep') return;
        var di = b.getAttribute('data-date');
        S.preview = b.getAttribute('aria-disabled') === 'true' ? null : di;
        paintPreview();
      });
      monthsEl.addEventListener('mouseleave', function () { S.preview = null; paintPreview(); });
    }
    monthsEl.addEventListener('keydown', function (e) {
      var b = e.target.closest('.day');
      if (!b) return;
      var d = fromIso(b.getAttribute('data-date')), nd = null;
      switch (e.key) {
        case 'ArrowLeft': nd = addDays(d, -1); break;
        case 'ArrowRight': nd = addDays(d, 1); break;
        case 'ArrowUp': nd = addDays(d, -7); break;
        case 'ArrowDown': nd = addDays(d, 7); break;
        case 'Home': nd = addDays(d, -((d.getDay() + 6) % 7)); break;
        case 'End': nd = addDays(d, 6 - ((d.getDay() + 6) % 7)); break;
        case 'PageUp': nd = new Date(d.getFullYear(), d.getMonth() - 1, Math.min(d.getDate(), 28)); break;
        case 'PageDown': nd = new Date(d.getFullYear(), d.getMonth() + 1, Math.min(d.getDate(), 28)); break;
        default: return;
      }
      e.preventDefault();
      if (nd < today) nd = today;
      if (nd > maxDate) nd = maxDate;
      S.focus = iso(nd);
      var vStart = S.view, vEnd = new Date(S.view.getFullYear(), S.view.getMonth() + monthsShown(), 0);
      if (nd < vStart) S.view = new Date(nd.getFullYear(), nd.getMonth(), 1);
      else if (nd > vEnd) S.view = new Date(nd.getFullYear(), nd.getMonth() - monthsShown() + 1, 1);
      if (picking() === 'dep' && iso(nd) > S.arr) { S.preview = iso(nd); }
      renderCal(true);
      var fb = qs('.day[data-date="' + S.focus + '"]', monthsEl);
      if (fb) fb.focus();
    });
    prevBtn.addEventListener('click', function () { S.view = new Date(S.view.getFullYear(), S.view.getMonth() - 1, 1); S.focus = iso(S.view < today ? today : S.view); renderCal(false); });
    nextBtn.addEventListener('click', function () { S.view = new Date(S.view.getFullYear(), S.view.getMonth() + 1, 1); S.focus = iso(S.view); renderCal(false); });
    fieldArr.addEventListener('click', function () {
      S.arr = null; S.dep = null; S.preview = null;
      setHint('Wählen Sie Ihren Anreisetag.');
      renderCal(false); updateFields(); updateQuote(false);
      var f = qs('.day[tabindex="0"]', monthsEl); if (f) f.focus();
    });
    fieldDep.addEventListener('click', function () {
      if (!S.arr) { fieldArr.click(); return; }
      S.dep = null;
      S.focus = iso(addDays(fromIso(S.arr), 1));
      setHint('Jetzt den Abreisetag wählen.');
      renderCal(false); updateFields(); updateQuote(false);
      var f = qs('.day[data-date="' + S.focus + '"]', monthsEl) || qs('.day[tabindex="0"]', monthsEl); if (f) f.focus();
    });
    mq2.addEventListener('change', function () { renderCal(false); });

    // Gäste-Stepper
    qsa('[data-stepper]', root).forEach(function (st) {
      var key = st.getAttribute('data-stepper'), min = +st.getAttribute('data-min'), max = +st.getAttribute('data-max');
      var out = qs('output', st), minus = qs('[data-step="-1"]', st), plus = qs('[data-step="1"]', st);
      function sync() {
        out.textContent = S[key];
        minus.disabled = S[key] <= min;
        plus.disabled = S[key] >= max || guests() >= 4;
      }
      st.__sync = sync;
      [minus, plus].forEach(function (b) {
        b.addEventListener('click', function () {
          var v = S[key] + (+b.getAttribute('data-step'));
          if (v < min || v > max || (v > S[key] && guests() >= 4)) return;
          S[key] = v;
          qsa('[data-stepper]', root).forEach(function (s) { s.__sync(); });
          syncCats(); renderCal(false); updateQuote(true);
          if (b.disabled) (b === plus ? minus : plus).focus();
        });
      });
      sync();
    });

    // Kategorien
    function syncCats() {
      var g = guests(), current = null;
      radios.forEach(function (r) {
        var cat = r.value, fits = BOOKING.CAPACITY[cat] >= g;
        r.disabled = !fits;
        var note = qs('[data-cat-note="' + cat + '"]', root);
        if (note) note.textContent = fits ? '' : 'Für ' + g + ' Personen zu klein';
        if (r.checked) current = r;
      });
      if (current && current.disabled) {
        var alt = radios.filter(function (r) { return !r.disabled; })[0];
        if (alt) { alt.checked = true; S.cat = alt.value; announce('Zimmer geändert: ' + BOOKING.NAMES[S.cat] + ', passend für ' + g + ' Personen.'); }
      }
      updateCatPrices();
    }
    function totalFor(cat) {
      if (!S.arr || !S.dep) return null;
      var nights = nightsOf(S.arr, S.dep), room = 0;
      nights.forEach(function (n) { room += nightPrice(fromIso(n), cat, S.adults); });
      var child = nights.length * S.children * BOOKING.CHILD;
      var disc = nights.length >= BOOKING.LONG_STAY_NIGHTS ? Math.round(room * BOOKING.LONG_STAY_RATE) : 0;
      var tax = Math.round(nights.length * S.adults * BOOKING.CITY_TAX * 100) / 100;
      var minFree = Math.min.apply(null, nights.map(function (n) { return freeRooms(n, cat); }));
      return { nights: nights.length, room: room, child: child, disc: disc, tax: tax, total: room + child - disc + tax, minFree: minFree, avg: room / nights.length };
    }
    function updateCatPrices() {
      radios.forEach(function (r) {
        var el = qs('[data-cat-price="' + r.value + '"]', root);
        var t = totalFor(r.value);
        if (!el) return;
        if (t && !r.disabled) el.textContent = t.minFree > 0 ? money(t.total) : 'ausgebucht';
        else el.textContent = 'ab ' + money(BOOKING.RATES[r.value]);
      });
    }
    radios.forEach(function (r) {
      r.addEventListener('change', function () {
        if (!r.checked) return;
        S.cat = r.value;
        renderCal(false); updateQuote(true);
      });
    });
    window.__seeblickPickRoom = function (cat) {
      var r = radios.filter(function (x) { return x.value === cat; })[0];
      if (!r) return;
      if (r.disabled) { S.children = 0; S.adults = Math.min(S.adults, BOOKING.CAPACITY[cat]); qsa('[data-stepper]', root).forEach(function (s) { s.__sync(); }); syncCats(); }
      r.checked = true; S.cat = cat;
      renderCal(false); updateQuote(true);
    };

    function line(label, value, cls) {
      var div = document.createElement('div'); if (cls) div.className = cls;
      var dt = document.createElement('dt'); dt.textContent = label;
      var dd = document.createElement('dd'); dd.textContent = value;
      div.appendChild(dt); div.appendChild(dd); return div;
    }
    function updateQuote(bump) {
      updateCatPrices();
      qRoom.textContent = BOOKING.NAMES[S.cat];
      var g = S.adults + ' ' + (S.adults === 1 ? 'Erwachsener' : 'Erwachsene') + (S.children ? ' · ' + S.children + (S.children === 1 ? ' Kind' : ' Kinder') : '');
      qLines.replaceChildren(); qAlt.replaceChildren(); qAlt.hidden = true;
      if (!S.arr || !S.dep) {
        quote.setAttribute('data-state', 'idle');
        qStatus.textContent = S.arr ? 'Abreise wählen' : 'Bitte Zeitraum wählen';
        qDates.textContent = (S.arr ? 'Anreise ' + fmtShort.format(fromIso(S.arr)) + ' · ' : '') + g;
        qTotal.textContent = '–'; qPer.textContent = '';
        qCta.setAttribute('aria-disabled', 'false');
        syncInquiry();
        return;
      }
      var t = totalFor(S.cat);
      qDates.textContent = fmtShort.format(fromIso(S.arr)) + ' – ' + fmtShort.format(fromIso(S.dep)) + ' · ' + t.nights + (t.nights === 1 ? ' Nacht' : ' Nächte') + ' · ' + g;
      var state = t.minFree === 0 ? 'full' : (t.minFree <= (BOOKING.ROOMS[S.cat] <= 2 ? 1 : 2) ? 'few' : 'ok');
      quote.setAttribute('data-state', state);
      if (state === 'full') qStatus.textContent = 'In diesem Zeitraum ausgebucht';
      else if (state === 'few') qStatus.textContent = 'Verfügbar – nur noch ' + t.minFree + ' frei';
      else qStatus.textContent = 'Verfügbar – noch ' + t.minFree + ' von ' + BOOKING.ROOMS[S.cat] + ' frei';
      qLines.appendChild(line(t.nights + (t.nights === 1 ? ' Nacht' : ' Nächte') + ' inkl. Frühstück (Ø ' + money(Math.round(t.avg)) + ')', money(t.room)));
      if (t.child) qLines.appendChild(line(S.children + (S.children === 1 ? ' Kind' : ' Kinder') + ' × ' + t.nights + ' × ' + money(BOOKING.CHILD), money(t.child)));
      if (t.disc) qLines.appendChild(line('Ab ' + BOOKING.LONG_STAY_NIGHTS + ' Nächten −' + Math.round(BOOKING.LONG_STAY_RATE * 100) + ' %', '−' + money(t.disc), 'is-minus'));
      qLines.appendChild(line('Kurbeitrag (Beispiel)', money(t.tax)));
      var season = inSeason(fromIso(S.arr));
      if (season) qLines.appendChild(line('Saison', season.name));
      qTotal.textContent = money(t.total);
      qPer.textContent = 'entspricht ' + money(Math.round(t.total / t.nights)) + ' pro Nacht';
      if (state === 'full') {
        qTotal.textContent = '–'; qPer.textContent = '';
        var alts = Object.keys(BOOKING.RATES).filter(function (c) { return c !== S.cat && BOOKING.CAPACITY[c] >= guests() && rangeFree(S.arr, S.dep, c); });
        qAlt.hidden = false;
        var p = document.createElement('p');
        p.textContent = alts.length ? 'Im selben Zeitraum frei:' : 'Rufen Sie uns an – oft wird kurzfristig etwas frei.';
        qAlt.appendChild(p);
        alts.forEach(function (c) {
          var b = document.createElement('button'); b.type = 'button';
          b.textContent = BOOKING.NAMES[c] + ' · ' + money(totalFor(c).total);
          b.addEventListener('click', function () { window.__seeblickPickRoom(c); });
          qAlt.appendChild(b);
        });
      }
      if (bump && !reduced()) { quote.classList.remove('is-bump'); void quote.offsetWidth; quote.classList.add('is-bump'); }
      syncInquiry();
    }

    // Auswahl → Anfrage
    var selBox = qs('[data-inq-selection]'), selText = qs('[data-inq-sel-text]'), fallback = qs('[data-inq-fallback]');
    function selectionSummary() {
      var parts = [BOOKING.NAMES[S.cat]];
      if (S.arr && S.dep) parts.push(fmtShort.format(fromIso(S.arr)) + ' – ' + fmtShort.format(fromIso(S.dep)) + ' (' + daysBetween(S.arr, S.dep) + ' N.)');
      parts.push(S.adults + ' Erw.' + (S.children ? ', ' + S.children + ' Kind' + (S.children > 1 ? 'er' : '') : ''));
      var t = totalFor(S.cat);
      if (t && t.minFree > 0) parts.push('Beispielpreis ' + money(t.total));
      return parts.join(' · ');
    }
    function syncInquiry() {
      if (!selBox) return;
      selBox.hidden = false;
      if (fallback) fallback.classList.add('is-synced');
      selText.textContent = selectionSummary();
      var fa = qs('#f-arr'), fd = qs('#f-dep');
      if (fa) fa.value = S.arr || '';
      if (fd) fd.value = S.dep || '';
    }
    window.__seeblickSelection = function () {
      var t = totalFor(S.cat);
      return {
        zimmer: BOOKING.NAMES[S.cat],
        zeitraum: S.arr && S.dep ? fmtFull.format(fromIso(S.arr)) + ' – ' + fmtFull.format(fromIso(S.dep)) + ' (' + daysBetween(S.arr, S.dep) + ' Nächte)' : (S.arr ? 'Anreise ' + fmtFull.format(fromIso(S.arr)) + ', Abreise offen' : 'noch offen'),
        gaeste: S.adults + ' Erwachsene' + (S.children ? ', ' + S.children + ' Kind' + (S.children > 1 ? 'er' : '') : ''),
        preis: t && t.minFree > 0 ? money(t.total) + ' (unverbindliche Beispielrechnung)' : '–'
      };
    };
    qCta.addEventListener('click', function () {
      setTimeout(function () { var f = qs('#f-name'); if (f) try { f.focus({ preventScroll: true }); } catch (e) { f.focus(); } }, lenis ? 900 : 300);
    });

    // Startauswahl: erster freier 3-Nächte-Zeitraum ab Donnerstag in gut zwei Wochen
    (function preset() {
      var d = addDays(today, 14);
      while (d.getDay() !== 4) d = addDays(d, 1);
      for (var k = 0; k < 16; k++) {
        var a = iso(d), b = iso(addDays(d, 3));
        var allFree = Object.keys(BOOKING.RATES).every(function (c) { return rangeFree(a, b, c); });
        if (allFree && Math.min.apply(null, nightsOf(a, b).map(function (n) { return freeRooms(n, S.cat); })) >= 3) { S.arr = a; S.dep = b; break; }
        d = addDays(d, 7);
      }
      if (S.arr) {
        S.view = new Date(fromIso(S.arr).getFullYear(), fromIso(S.arr).getMonth(), 1);
        if (monthsShown() === 2 && fromIso(S.arr).getMonth() !== today.getMonth() && fromIso(S.arr).getDate() < 8) S.view = new Date(S.view.getFullYear(), S.view.getMonth() - 1, 1);
        if (S.view < new Date(today.getFullYear(), today.getMonth(), 1)) S.view = new Date(today.getFullYear(), today.getMonth(), 1);
        S.focus = S.arr;
        setHint('Beispielzeitraum gewählt – klicken Sie einen Tag, um neu zu wählen.');
      }
    })();
    syncCats();
    renderCal(false); updateFields(); updateQuote(false);
  }

  /* ------------------------------------------------------------------
     Anfrageformular (nur clientseitig)
     ------------------------------------------------------------------ */
  function initInquiry() {
    var form = qs('[data-inquiry]'), success = qs('[data-inq-success]');
    if (!form || !success) return;
    var summary = qs('[data-inq-summary]', success);
    function setErr(input, msg) {
      var field = input.closest('.field');
      var err = qs('#' + (input.getAttribute('aria-describedby') || '').split(' ')[0]);
      field.classList.toggle('has-error', !!msg);
      input.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (err) err.textContent = msg || '';
    }
    function validate() {
      var name = qs('#f-name', form), mail = qs('#f-mail', form), ok = qs('#f-dsgvo', form);
      var errs = [];
      if (name.value.trim().length < 2) { setErr(name, 'Bitte geben Sie Ihren Namen an.'); errs.push(name); } else setErr(name, '');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail.value.trim())) { setErr(mail, 'Bitte geben Sie eine gültige E-Mail-Adresse an.'); errs.push(mail); } else setErr(mail, '');
      if (!ok.checked) { setErr(ok, 'Bitte bestätigen Sie die Datenschutzhinweise.'); errs.push(ok); } else setErr(ok, '');
      return errs;
    }
    qsa('input, textarea', form).forEach(function (el) {
      el.addEventListener('blur', function () { if (el.closest('.field.has-error')) validate(); });
      el.addEventListener('change', function () { if (el.closest('.field.has-error')) validate(); });
    });
    function row(k, v) {
      var div = document.createElement('div');
      var dt = document.createElement('dt'); dt.textContent = k;
      var dd = document.createElement('dd'); dd.textContent = v;
      div.appendChild(dt); div.appendChild(dd); summary.appendChild(div);
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var errs = validate();
      if (errs.length) { errs[0].focus(); announce('Bitte prüfen Sie ' + (errs.length === 1 ? 'ein Feld' : errs.length + ' Felder') + '.'); return; }
      summary.replaceChildren();
      var sel = window.__seeblickSelection ? window.__seeblickSelection() : null;
      row('Name', qs('#f-name', form).value.trim());
      row('E-Mail', qs('#f-mail', form).value.trim());
      var tel = qs('#f-tel', form).value.trim(); if (tel) row('Telefon', tel);
      if (sel) {
        row('Zimmer', sel.zimmer); row('Zeitraum', sel.zeitraum); row('Gäste', sel.gaeste); row('Preis', sel.preis);
      } else {
        row('Anreise', qs('#f-arr', form).value || '–'); row('Abreise', qs('#f-dep', form).value || '–');
        row('Gäste', qs('#f-guests', form).value); row('Zimmer', qs('#f-cat', form).value);
      }
      row('Halbpension', qs('#f-hp', form).checked ? 'ja' : 'nein');
      var msg = qs('#f-msg', form).value.trim(); if (msg) row('Wünsche', msg);
      form.hidden = true; success.hidden = false;
      success.focus();
    });
    var reset = qs('[data-inq-reset]', success);
    if (reset) reset.addEventListener('click', function () {
      form.reset(); qsa('.field.has-error', form).forEach(function (f) { f.classList.remove('has-error'); });
      qsa('.field-error', form).forEach(function (f) { f.textContent = ''; });
      success.hidden = true; form.hidden = false;
      var bs = window.__seeblickSelection; if (bs) { /* Auswahl bleibt erhalten */ }
      qs('#f-name', form).focus();
    });
  }

  /* ------------------------------------------------------------------
     Gästestimmen: langsame Überblendung
     ------------------------------------------------------------------ */
  function initQuotes() {
    var root = qs('[data-quotes]');
    if (!root) return;
    var items = qsa('.q', root), dots = qsa('.q-dots span', root);
    var pauseBtn = qs('[data-q-pause]', root);
    var cur = 0, timer = 0, paused = reduced(), hover = false, inView = false;
    root.classList.add('is-enhanced');
    // Nur wechseln, solange die Stimmen im Bild sind – wer hinscrollt, beginnt beim ersten Zitat.
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { inView = en[0].isIntersecting; schedule(); }, { threshold: 0.3 }).observe(root);
    } else inView = true;
    function show(i) {
      cur = (i + items.length) % items.length;
      items.forEach(function (q, k) { q.classList.toggle('is-active', k === cur); q.setAttribute('aria-hidden', String(k !== cur)); });
      dots.forEach(function (d, k) { d.classList.toggle('is-active', k === cur); });
    }
    function schedule() {
      clearTimeout(timer);
      if (paused || hover || !inView || document.hidden) return;
      timer = setTimeout(function () { show(cur + 1); schedule(); }, 7500);
    }
    function setPaused(p) {
      paused = p;
      pauseBtn.setAttribute('aria-label', p ? 'Automatischen Wechsel starten' : 'Automatischen Wechsel anhalten');
      qs('use', pauseBtn).setAttribute('href', p ? '#i-play' : '#i-pause');
      schedule();
    }
    qs('[data-q-prev]', root).addEventListener('click', function () { show(cur - 1); schedule(); });
    qs('[data-q-next]', root).addEventListener('click', function () { show(cur + 1); schedule(); });
    pauseBtn.addEventListener('click', function () { setPaused(!paused); });
    root.addEventListener('mouseenter', function () { hover = true; schedule(); });
    root.addEventListener('mouseleave', function () { hover = false; schedule(); });
    root.addEventListener('focusin', function () { hover = true; schedule(); });
    root.addEventListener('focusout', function () { hover = false; schedule(); });
    document.addEventListener('visibilitychange', schedule);
    show(0); setPaused(paused);
  }

  /* ------------------------------------------------------------------
     Karte: Routen
     ------------------------------------------------------------------ */
  function initMap() {
    var map = qs('[data-map]');
    if (!map) return;
    var btns = qsa('[data-route]');
    var paths = qsa('[data-route-path]', map);
    paths.forEach(function (p) { p.setAttribute('pathLength', '1'); });
    var peak = qs('.m-peak[data-place="wallberg"]', map);
    function activate(key) {
      btns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-route') === key)); });
      paths.forEach(function (p) {
        var on = p.getAttribute('data-route-path') === key;
        if (on) { p.classList.remove('is-on'); void p.getBoundingClientRect(); }
        p.classList.toggle('is-on', on);
      });
      if (peak) peak.classList.toggle('is-on', key === 'wallberg');
    }
    btns.forEach(function (b) {
      b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-route');
        activate(b.getAttribute('aria-pressed') === 'true' ? null : k);
      });
    });
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) { activate('bahn'); io.disconnect(); }
      }, { threshold: 0.4 });
      io.observe(map);
    }
  }

  /* ------------------------------------------------------------------
     Start
     ------------------------------------------------------------------ */
  // Sofort: alles, was im ersten Bildschirm sichtbar oder bedienbar ist.
  safe('scroll', initScroll);
  safe('hero', initHero);
  safe('header', initHeader);
  safe('menu', initMenu);
  safe('reveals', initReveals);
  // Danach in eigenen kleinen Tasks (nach dem ersten Frame), damit der Start keinen langen Block erzeugt.
  var later = [['heroScroll', initHeroScroll], ['rooms', initRooms], ['pano', initPano], ['planner', initPlanner],
    ['booking', initBooking], ['inquiry', initInquiry], ['quotes', initQuotes], ['map', initMap]];
  var settled = false;
  function refreshST() { if (hasGSAP && settled) window.ScrollTrigger.refresh(); }
  function runLater() {
    var job = later.shift();
    if (!job) { settled = true; refreshST(); return; }
    safe(job[0], job[1]);
    setTimeout(runLater, 0);
  }
  var started = false;
  function startLater() { if (started) return; started = true; runLater(); }
  requestAnimationFrame(function () { setTimeout(startLater, 0); });
  setTimeout(startLater, 1200); // Fallback, falls kein Frame kommt (z. B. Hintergrund-Tab)
  if (hasGSAP) {
    window.addEventListener('load', refreshST);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refreshST);
  }
})();
