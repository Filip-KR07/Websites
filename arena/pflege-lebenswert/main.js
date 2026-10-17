/* ==========================================================================
   Lebenswert Ambulanter Pflegedienst · Modell „Nähe“
   Ohne Build-Schritt. Optional: GSAP + ScrollTrigger, Lenis (assets/vendor).
   Alle Inhalte funktionieren auch ohne JavaScript bzw. ohne Bewegung.
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
     WERTE ZUM ANPASSEN – unverbindliche Beispielwerte, Stand 2026
     ------------------------------------------------------------------ */

  // Pflegegrad-Orientierung (angelehnt an das Begutachtungsinstrument, § 15 SGB XI).
  // Reihenfolge der Module: Mobilität, Geist & Verständigung, Verhalten & Gemüt,
  // Selbstversorgung, Krankheit & Therapie, Alltag & Kontakte.
  var PG = {
    MAX: [10, 15, 15, 40, 20, 15],         // gewichtete Höchstpunkte je Modul (Modul 2/3: nur der höhere Wert zählt)
    ANSWER_SHARE: [0, 0.25, 0.6, 0.92],    // Anteil der Höchstpunkte je Antwortstufe
    THRESHOLDS: [12.5, 27, 47.5, 70, 90],  // ab diesen Gesamtpunkten: Pflegegrad 1, 2, 3, 4, 5
    FUZZ: 8,                               // ± Punkte Unschärfe einer Selbsteinschätzung
    PFLEGEGELD: { 2: 347, 3: 599, 4: 800, 5: 990 },        // € im Monat
    SACHLEISTUNG: { 2: 796, 3: 1497, 4: 1859, 5: 2299 },   // € im Monat
    ENTLASTUNG: 131                                        // € im Monat ab Pflegegrad 1
  };

  // Gehaltsrahmen Karriere – brutto im Monat bei Vollzeit (39 Std.), je Erfahrungsstufe
  // [0–2 Jahre, 3–5 Jahre, 6+ Jahre]; spread = Spanne nach oben innerhalb der Stufe.
  var SALARY = {
    FULLTIME_HOURS: 39,
    WEEKS_PER_MONTH: 4.33,
    ROLES: {
      fachkraft: { base: [3660, 3870, 4110], spread: 280 },
      helfer:    { base: [3120, 3240, 3390], spread: 200 },
      hilfe:     { base: [2880, 2970, 3080], spread: 160 },
      betreuung: { base: [2860, 2940, 3040], spread: 160 }
    },
    // Ø Zuschläge (Nacht/Sonntag/Feiertag) je Schichtmodell bei Vollzeit, € im Monat
    SHIFT_EXTRA: { frueh: 120, wechsel: 190, eltern: 40, vier: 150 }
  };

  // Schichtmodelle: je Wochentag (Mo–So) [Beginn, Ende] in Stunden, null = frei.
  var SHIFTS = {
    frueh: {
      name: 'Frühtour', times: '06:30–13:30 Uhr',
      weekend: 'jedes 2. Wochenende, dafür ein freier Tag unter der Woche',
      hours: 'Ø 38,5 Stunden pro Woche', fit: 'Frühaufsteher, die nachmittags frei haben wollen',
      w1: [[6.5, 13.5], [6.5, 13.5], [6.5, 13.5], [6.5, 13.5], [6.5, 13.5], null, null],
      w2: [[6.5, 13.5], [6.5, 13.5], null, [6.5, 13.5], [6.5, 13.5], [6.5, 13.5], [6.5, 13.5]]
    },
    wechsel: {
      name: 'Früh & Spät im Wechsel', times: 'Früh 06:30–13:30, Spät 15:00–21:30 Uhr',
      weekend: 'jedes 2. Wochenende', hours: 'Ø 37 Stunden pro Woche',
      fit: 'alle, die Abwechslung mögen – mit den höchsten Zuschlägen',
      w1: [[6.5, 13.5], [6.5, 13.5], [6.5, 13.5], [6.5, 13.5], [6.5, 13.5], null, null],
      w2: [[15, 21.5], [15, 21.5], null, [15, 21.5], [15, 21.5], [15, 21.5], [15, 21.5]]
    },
    eltern: {
      name: 'Eltern-Tour', times: '08:15–13:15 Uhr – nach der Kita, vor dem Abholen',
      weekend: 'höchstens ein Wochenende im Monat', hours: '25 Stunden pro Woche',
      fit: 'Eltern mit Kita- oder Schulkindern',
      w1: [[8.25, 13.25], [8.25, 13.25], [8.25, 13.25], [8.25, 13.25], [8.25, 13.25], null, null],
      w2: [[8.25, 13.25], [8.25, 13.25], [8.25, 13.25], [8.25, 13.25], [8.25, 13.25], null, null]
    },
    vier: {
      name: '4-Tage-Woche', times: '06:30–16:00 Uhr mit Pause',
      weekend: 'jedes 2. Wochenende, dafür drei freie Tage am Stück', hours: 'Ø 36 Stunden pro Woche',
      fit: 'alle, die längere Tage gegen mehr Freizeit tauschen',
      w1: [[6.5, 16], [6.5, 16], [6.5, 16], [6.5, 16], null, null, null],
      w2: [null, null, [6.5, 16], [6.5, 16], null, [6.5, 16], [6.5, 16]]
    }
  };

  // Einsatzgebiet: Postleitzahlen und weitere Stadtteile, die zu Zone 1 (Erfurt) gehören.
  var AREA = {
    ERFURT_PLZ: ['99084', '99085', '99086', '99087', '99089', '99090', '99091', '99092', '99094', '99095', '99096', '99097', '99098', '99099'],
    ERFURT_MORE: ['Erfurt', 'Andreasvorstadt', 'Brühlervorstadt', 'Löbervorstadt', 'Daberstedt', 'Johannesvorstadt', 'Berliner Platz',
      'Moskauer Platz', 'Roter Berg', 'Nordhäuser Bahnhof', 'Linderbach', 'Azmannsdorf', 'Urbich', 'Büßleben', 'Niedernissa',
      'Windischholzhausen', 'Egstedt', 'Waltersleben', 'Rhoda', 'Möbisburg', 'Bischleben', 'Stedten', 'Schmira', 'Dittelstedt',
      'Frienstedt', 'Ermstedt', 'Gottstedt', 'Salomonsborn', 'Schaderode', 'Tiefthal', 'Kühnhausen', 'Hochstedt', 'Mittelhausen',
      'Töttelstädt', 'Wallichen', 'Sulzer Siedlung', 'Dittelstedt', 'Innenstadt', 'Zentrum']
  };

  var PREF_KEY = 'lebenswert-ansicht';

  /* ------------------------------------------------------------------
     Grundlagen
     ------------------------------------------------------------------ */
  window.__lebenswertReady = true;
  var doc = document.documentElement;
  var qs = function (s, r) { return (r || document).querySelector(s); };
  var qsa = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var nf0 = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 });
  var nf2 = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var NB = ' ';
  var eur = function (n) { return nf0.format(Math.round(n)) + NB + '€'; };
  var hasGSAP = !!(window.gsap && window.ScrollTrigger);
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  function motionOff() { return doc.classList.contains('motion-off'); }
  function motionReduced() { return doc.classList.contains('motion-off') || doc.classList.contains('reduced'); }
  function motionFull() { return !motionReduced(); }

  function slugify(s) {
    return String(s).toLowerCase().trim()
      .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }
  function headerOffset() {
    var h = qs('[data-hdr]');
    return (h ? h.getBoundingClientRect().height : 80) + 16;
  }

  var state = { lenis: null, tick: null, mm: null, hero: null };

  /* ------------------------------------------------------------------
     Scrollen zu Ankern (mit Lenis weich, sonst nativ)
     ------------------------------------------------------------------ */
  function scrollToEl(el, opts) {
    if (!el) return;
    opts = opts || {};
    if (state.lenis) {
      state.lenis.scrollTo(el, { offset: -headerOffset(), duration: 1.1 });
    } else {
      var y = el.getBoundingClientRect().top + window.pageYOffset - headerOffset();
      window.scrollTo({ top: Math.max(0, y), behavior: motionReduced() ? 'auto' : 'smooth' });
    }
    if (opts.focus !== false) {
      if (!el.hasAttribute('tabindex') && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) el.setAttribute('tabindex', '-1');
      try { el.focus({ preventScroll: true }); } catch (e) { /* ältere Browser */ }
    }
  }

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href').slice(1);
    if (!id) return;
    var target = document.getElementById(id);
    if (!target || id === 'main') return;
    e.preventDefault();
    if (history.replaceState) history.replaceState(null, '', '#' + id);
    // Menü schließt zuerst, dann wird gescrollt
    if (doc.classList.contains('menu-is-open')) { closeMenu(false); setTimeout(function () { scrollToEl(target); }, 60); }
    else scrollToEl(target);
  });

  /* ------------------------------------------------------------------
     Barrierefreiheits-Leiste: Schriftgröße, Kontrast, Bewegung
     ------------------------------------------------------------------ */
  function loadPrefs() { try { return JSON.parse(localStorage.getItem(PREF_KEY) || '{}') || {}; } catch (e) { return {}; } }
  function savePrefs(p) { try { localStorage.setItem(PREF_KEY, JSON.stringify(p)); } catch (e) { /* privat */ } }
  var prefs = loadPrefs();
  var a11yStatus = qs('[data-a11y-status]');
  var FS_NAMES = ['normal', 'groß', 'sehr groß'];

  function syncA11yUi() {
    var fs = +(doc.getAttribute('data-fs') || 0);
    qsa('.seg__btn[data-fs]').forEach(function (b) { b.setAttribute('aria-pressed', String(+b.getAttribute('data-fs') === fs)); });
    var hc = doc.getAttribute('data-contrast') === 'high';
    qsa('.switch[data-pref="contrast"]').forEach(function (b) { b.setAttribute('aria-checked', String(hc)); });
    qsa('.switch[data-pref="motion"]').forEach(function (b) { b.setAttribute('aria-checked', String(motionReduced())); });
    var meta = qs('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', hc ? '#FFFFFF' : '#FFF8F1');
  }
  function announce(msg) { if (a11yStatus) { a11yStatus.textContent = ''; setTimeout(function () { a11yStatus.textContent = msg; }, 30); } }
  function layoutChanged() {
    requestAnimationFrame(function () {
      if (hasGSAP && window.ScrollTrigger) ScrollTrigger.refresh();
      document.dispatchEvent(new CustomEvent('lebenswert:layout'));
    });
  }

  function initA11y() {
    var util = qs('[data-util]');
    var toggle = qs('[data-util-toggle]');
    if (toggle) {
      toggle.addEventListener('click', function () {
        var open = toggle.getAttribute('aria-expanded') !== 'true';
        toggle.setAttribute('aria-expanded', String(open));
        util.classList.toggle('is-open', open);
        layoutChanged();
      });
    }
    qsa('.seg__btn[data-fs]').forEach(function (b) {
      b.addEventListener('click', function () {
        var n = +b.getAttribute('data-fs');
        if (n) doc.setAttribute('data-fs', String(n)); else doc.removeAttribute('data-fs');
        prefs.fs = n; savePrefs(prefs); syncA11yUi(); layoutChanged();
        announce('Schriftgröße: ' + FS_NAMES[n]);
      });
    });
    qsa('.switch[data-pref="contrast"]').forEach(function (b) {
      b.addEventListener('click', function () {
        var on = doc.getAttribute('data-contrast') !== 'high';
        if (on) doc.setAttribute('data-contrast', 'high'); else doc.removeAttribute('data-contrast');
        prefs.contrast = on; savePrefs(prefs); syncA11yUi(); layoutChanged();
        announce(on ? 'Hoher Kontrast eingeschaltet' : 'Hoher Kontrast ausgeschaltet');
      });
    });
    qsa('.switch[data-pref="motion"]').forEach(function (b) {
      b.addEventListener('click', function () {
        var turnOff = !motionReduced();
        if (turnOff) { doc.classList.add('motion-off'); doc.classList.remove('reduced'); prefs.motion = false; }
        else { doc.classList.remove('motion-off', 'reduced'); prefs.motion = true; }
        savePrefs(prefs); syncA11yUi();
        teardownMotion(); setupMotion();
        announce(turnOff ? 'Bewegung ausgeschaltet' : 'Bewegung eingeschaltet');
      });
    });
    syncA11yUi();
  }

  /* ------------------------------------------------------------------
     Header: Schatten, Fortschritt, aktiver Abschnitt
     ------------------------------------------------------------------ */
  function initHeader() {
    var hdr = qs('[data-hdr]');
    var bar = qs('[data-progress]');
    var ticking = false;
    function update() {
      ticking = false;
      var y = window.pageYOffset || doc.scrollTop;
      hdr.classList.toggle('is-scrolled', y > 8);
      var max = Math.max(1, doc.scrollHeight - window.innerHeight);
      if (bar) bar.style.transform = 'scaleX(' + clamp(y / max, 0, 1).toFixed(4) + ')';
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update);
    update();

    var links = qsa('.nav a[href^="#"]');
    var map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { a.removeAttribute('aria-current'); });
        var a = map[en.target.id];
        if (a) a.setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
  }

  /* ------------------------------------------------------------------
     Mobiles Menü (Dialog mit Fokusführung)
     ------------------------------------------------------------------ */
  var menuEls = {};
  function menuFocusables() {
    return qsa('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])', menuEls.panel)
      .filter(function (el) { return el.offsetParent !== null; });
  }
  function onMenuKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); closeMenu(true); return; }
    if (e.key !== 'Tab') return;
    var f = menuFocusables(); if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  function openMenu() {
    var m = menuEls.menu; if (!m) return;
    m.hidden = false;
    menuEls.burger.setAttribute('aria-expanded', 'true');
    document.body.classList.add('menu-open');
    doc.classList.add('menu-is-open');
    if (state.lenis) state.lenis.stop();
    requestAnimationFrame(function () { requestAnimationFrame(function () { m.classList.add('is-open'); }); });
    qs('.menu__close', m).focus();
    document.addEventListener('keydown', onMenuKey);
  }
  function closeMenu(restoreFocus) {
    var m = menuEls.menu; if (!m || m.hidden) return;
    m.classList.remove('is-open');
    menuEls.burger.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
    doc.classList.remove('menu-is-open');
    if (state.lenis) state.lenis.start();
    document.removeEventListener('keydown', onMenuKey);
    setTimeout(function () { if (!m.classList.contains('is-open')) m.hidden = true; }, motionOff() ? 0 : 400);
    if (restoreFocus) menuEls.burger.focus();
  }
  function initMenu() {
    menuEls.menu = qs('[data-menu]');
    menuEls.burger = qs('[data-burger]');
    if (!menuEls.menu || !menuEls.burger) return;
    menuEls.panel = qs('.menu__panel', menuEls.menu);
    menuEls.burger.addEventListener('click', openMenu);
    qsa('[data-menu-close]', menuEls.menu).forEach(function (b) { b.addEventListener('click', function () { closeMenu(true); }); });
    qsa('a', menuEls.menu).forEach(function (a) {
      if (!/^#/.test(a.getAttribute('href') || '')) a.addEventListener('click', function () { closeMenu(false); });
    });
    window.matchMedia('(min-width: 1100px)').addEventListener('change', function (e) { if (e.matches) closeMenu(false); });
  }

  /* ------------------------------------------------------------------
     Scroll-Reveal & Zähler
     ------------------------------------------------------------------ */
  function countUp(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var dec = +(el.getAttribute('data-decimals') || 0);
    var fmt = new Intl.NumberFormat('de-DE', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    if (!motionFull() || isNaN(target)) { el.textContent = fmt.format(target); return; }
    var t0 = performance.now(), dur = 1400;
    function step(now) {
      var p = clamp((now - t0) / dur, 0, 1);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt.format(target * e);
      if (p < 1) requestAnimationFrame(step);
    }
    el.textContent = fmt.format(0);
    requestAnimationFrame(step);
  }
  function initReveal() {
    var els = qsa('[data-reveal], [data-write], .circ');
    var counters = qsa('[data-count]');
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (e) { e.classList.add('is-in'); });
      return;
    }
    // Überschriften sind beim Start per clip-path verdeckt – IntersectionObserver sähe sie nicht:
    // stattdessen das Elternelement beobachten.
    var watch = new Map();
    els.forEach(function (e) {
      var t = e.tagName === 'H2' && e.parentElement ? e.parentElement : e;
      if (!watch.has(t)) watch.set(t, []);
      watch.get(t).push(e);
    });
    var io = new IntersectionObserver(function (entries) {
      var batch = [];
      entries.forEach(function (en) { if (en.isIntersecting) { io.unobserve(en.target); batch = batch.concat(watch.get(en.target) || []); } });
      batch.sort(function (a, b) { return a.compareDocumentPosition(b) & 4 ? -1 : 1; });
      batch.forEach(function (el, i) {
        var d = Math.min(i, 6) * 70;
        el.style.setProperty('--d', d + 'ms');
        el.classList.add('is-in');
        // Nach dem Einblenden eigene Übergänge (Hover, Druck) wieder freigeben
        if (el.hasAttribute('data-reveal')) setTimeout(function () { el.removeAttribute('data-reveal'); el.style.removeProperty('--d'); }, motionReduced() ? 0 : 1200 + d);
      });
    }, { rootMargin: '0px 0px -7% 0px', threshold: 0 });
    watch.forEach(function (v, t) { io.observe(t); });

    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { cio.unobserve(en.target); countUp(en.target); } });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { cio.observe(c); });
  }

  /* ------------------------------------------------------------------
     Hero: Einstieg, Stadt-Silhouette mit Feder-Parallaxe, magnetische Taste
     ------------------------------------------------------------------ */
  function initHeroIntro() {
    var go = function () { requestAnimationFrame(function () { doc.classList.add('is-loaded'); }); };
    if (document.fonts && document.fonts.ready) {
      var done = false;
      document.fonts.ready.then(function () { if (!done) { done = true; go(); } });
      setTimeout(function () { if (!done) { done = true; go(); } }, 600);
    } else go();
  }

  // Ebenen der Silhouette folgen dem Zeiger mit Feder (nur feiner Zeiger, nur bei voller Bewegung).
  function createSkyline() {
    var hero = qs('.hero');
    var layers = [
      { el: qs('.sky__sun'), k: -12 },
      { el: qs('.sky__town'), k: 9 },
      { el: qs('.sky__routes'), k: 9 }
    ].filter(function (l) { return l.el; });
    if (!hero || !layers.length) return null;
    var tx = 0, x = 0, v = 0, raf = 0, on = false;
    function frame() {
      // gedämpfte Feder: stiffness .06, damping .78
      v = (v + (tx - x) * 0.06) * 0.78; x += v;
      layers.forEach(function (l) { l.el.style.translate = (x * l.k).toFixed(2) + 'px 0'; });
      if (Math.abs(tx - x) > .002 || Math.abs(v) > .002) raf = requestAnimationFrame(frame); else raf = 0;
    }
    hero.addEventListener('pointermove', function (e) {
      if (!on || e.pointerType !== 'mouse') return;
      var r = hero.getBoundingClientRect();
      tx = clamp((e.clientX - r.left) / r.width * 2 - 1, -1, 1);
      if (!raf) raf = requestAnimationFrame(frame);
    });
    hero.addEventListener('pointerleave', function () { tx = 0; if (on && !raf) raf = requestAnimationFrame(frame); });
    return {
      enable: function () { on = finePointer; },
      disable: function () { on = false; tx = x = v = 0; if (raf) cancelAnimationFrame(raf); raf = 0; layers.forEach(function (l) { l.el.style.translate = ''; }); }
    };
  }

  function initMagnets() {
    if (!finePointer) return;
    qsa('[data-magnet]').forEach(function (el) {
      var tx = 0, ty = 0, x = 0, y = 0, raf = 0;
      function frame() {
        x = lerp(x, tx, .18); y = lerp(y, ty, .18);
        el.style.translate = x.toFixed(2) + 'px ' + y.toFixed(2) + 'px';
        if (Math.abs(x - tx) > .05 || Math.abs(y - ty) > .05) raf = requestAnimationFrame(frame); else raf = 0;
      }
      el.addEventListener('pointermove', function (e) {
        if (!motionFull() || e.pointerType !== 'mouse') return;
        var r = el.getBoundingClientRect();
        tx = (e.clientX - r.left - r.width / 2) * .22; ty = (e.clientY - r.top - r.height / 2) * .3;
        if (!raf) raf = requestAnimationFrame(frame);
      });
      el.addEventListener('pointerleave', function () { tx = ty = 0; if (!raf) raf = requestAnimationFrame(frame); });
    });
  }

  /* ------------------------------------------------------------------
     „Ein Tag mit uns“: Uhr, Sonnenbogen, Himmel (sticky + Scrub, kein Pin)
     ------------------------------------------------------------------ */
  var day = null;
  function initDay() {
    var sec = qs('[data-day]');
    if (!sec) return;
    var stops = qsa('.stop', sec);
    var clock = qs('[data-clock]', sec);
    var sun = qs('[data-sun]', sec);
    var layers = qsa('.day__layer', sec);
    var times = stops.map(function (s) { var p = (s.getAttribute('data-time') || '0:0').split(':'); return (+p[0]) * 60 + (+p[1]); });
    var T0 = times[0], T1 = times[times.length - 1];
    // Stützpunkte des Himmels (Minuten): Morgengrauen, Mittag, goldene Stunde, Dämmerung, Nacht
    var KEYS = [6 * 60 + 30, 10 * 60 + 30, 15 * 60 + 30, 19 * 60, 21 * 60];
    var lastIdx = -1, lastText = '';
    function fmt(m) { m = Math.round(m / 5) * 5; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); }
    function setTime(mins, sky) {
      var txt = fmt(mins);
      if (clock && txt !== lastText) { clock.textContent = txt; lastText = txt; }
      var f = clamp((mins - T0) / (T1 - T0), 0, 1);
      if (sun) {
        var a = Math.PI * (1 - f);
        sun.setAttribute('cx', (110 + Math.cos(a) * 100).toFixed(1));
        sun.setAttribute('cy', (112 - Math.sin(a) * 100).toFixed(1));
      }
      sec.classList.toggle('is-dusk', mins >= 18 * 60 + 45);
      sec.classList.toggle('is-night', mins >= 20 * 60 + 30);
      if (sky && layers.length) {
        for (var i = 0; i < layers.length; i++) {
          var o;
          if (i === 0) o = 1;
          else o = clamp((mins - KEYS[i - 1]) / (KEYS[i] - KEYS[i - 1]), 0, 1);
          layers[i].style.opacity = o.toFixed(3);
        }
      }
    }
    function setActive(idx) {
      if (idx === lastIdx) return;
      lastIdx = idx;
      stops.forEach(function (s, j) { s.classList.toggle('is-active', j === idx); });
    }
    // Ohne Scrub (reduziert/aus): Uhr springt zum Halt, der gerade in der Mitte steht
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (en) {
        if (day && day.scrub) return;
        en.forEach(function (e) {
          if (!e.isIntersecting) return;
          var i = stops.indexOf(e.target);
          setActive(i); setTime(times[i], false);
        });
      }, { rootMargin: '-45% 0px -45% 0px' });
      stops.forEach(function (s) { io.observe(s); });
    }
    day = {
      scrub: false,
      progress: function (p) {
        // Fortschritt auf die Halte abbilden (gleichmäßig je Halt, Zeit dazwischen interpoliert)
        var t = clamp(p, 0, 1) * (stops.length - 1);
        var i = Math.min(stops.length - 2, Math.floor(t));
        setTime(lerp(times[i], times[i + 1], t - i), true);
        setActive(Math.round(t));
      },
      reset: function () { this.scrub = false; layers.forEach(function (l) { l.style.opacity = ''; }); lastIdx = -1; setTime(T0, false); }
    };
    setTime(T0, false);
  }

  /* ------------------------------------------------------------------
     Satz baut sich Wort für Wort auf (nur volle Bewegung)
     ------------------------------------------------------------------ */
  function splitWords(p) {
    if (p.__split) return p.__split;
    var out = [];
    Array.prototype.slice.call(p.childNodes).forEach(function (n) {
      if (n.nodeType === 3) {
        var frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          var s = document.createElement('span'); s.className = 'w'; s.textContent = part;
          frag.appendChild(s); out.push(s);
        });
        p.replaceChild(frag, n);
      } else if (n.nodeType === 1) { n.classList.add('w'); out.push(n); }
    });
    p.__split = out;
    return out;
  }

  function setupMotion() {
    if (state.hero) { if (motionFull()) state.hero.enable(); else state.hero.disable(); }
    if (!hasGSAP || !motionFull()) return;
    gsap.registerPlugin(ScrollTrigger);
    if (window.Lenis) {
      state.lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 0.9 });
      window.__lenis = state.lenis;
      state.lenis.on('scroll', ScrollTrigger.update);
      state.tick = function (t) { if (state.lenis) state.lenis.raf(t * 1000); };
      gsap.ticker.add(state.tick);
      gsap.ticker.lagSmoothing(0);
    }
    state.mm = gsap.matchMedia();
    state.mm.add('(min-width: 0px)', function () {
      // 1) Ein Tag mit uns: Himmel, Uhr und Sonne folgen dem Scroll
      var sec = qs('[data-day]');
      if (sec && day) {
        day.scrub = true;
        ScrollTrigger.create({
          trigger: qs('.day__stops', sec), start: 'top 55%', end: 'bottom 55%',
          onUpdate: function (self) { day.progress(self.progress); },
          onRefresh: function (self) { day.progress(self.progress); }
        });
      }
      // 2) Zahlen-Satz: Wörter werden hell, Kringel zeichnen sich
      var facts = qs('[data-words]');
      if (facts) {
        var words = splitWords(facts);
        gsap.fromTo(words, { opacity: .16 }, {
          opacity: 1, ease: 'none', stagger: .08,
          scrollTrigger: { trigger: facts, start: 'top 82%', end: 'bottom 52%', scrub: .4 }
        });
      }
      // 3) Fenster öffnet sich
      var win = qs('[data-window]');
      if (win) {
        var img = qs('img', win), frame = qs('.about__frame', win);
        var tl = gsap.timeline({ scrollTrigger: { trigger: win, start: 'top 85%', end: 'center 55%', scrub: .5 } });
        tl.fromTo(win, { clipPath: 'inset(7% 34% 7% 34%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none' }, 0)
          .fromTo(img, { scale: 1.14 }, { scale: 1, ease: 'none' }, 0);
        if (frame) tl.fromTo(frame, { opacity: .9 }, { opacity: 0, ease: 'none' }, .35);
      }
      // 4) Karte zeichnet sich von Hand
      var map = qs('[data-map]');
      if (map) {
        var paths = qsa('.map__zone2, .map__city, .map__road, .map__river, .map__tourline, .map__arrow, .map__forest', map);
        paths.forEach(function (p) { p.setAttribute('pathLength', '1'); p.style.strokeDasharray = '1'; p.style.strokeDashoffset = '1'; });
        var hand = qsa('.map__hand, .map__hatch, .map__road-label, .map__river-label, .map__forest-label', map);
        var mt = gsap.timeline({ scrollTrigger: { trigger: map, start: 'top 80%', end: 'center 50%', scrub: .6 } });
        mt.to(qsa('.map__zone2, .map__city', map), { strokeDashoffset: 0, ease: 'none', duration: 1 }, 0)
          .to(qsa('.map__road, .map__river, .map__forest', map), { strokeDashoffset: 0, ease: 'none', duration: 1, stagger: .1 }, .25)
          .fromTo(hand, { opacity: 0 }, { opacity: 1, ease: 'none', duration: .4, stagger: .05 }, .6)
          .to(qsa('.map__tourline', map), { strokeDashoffset: 0, ease: 'none', duration: .8, stagger: .15 }, .8)
          .to(qsa('.map__arrow', map), { strokeDashoffset: 0, ease: 'none', duration: .4 }, 1.2);
        return function () {
          paths.forEach(function (p) { p.style.strokeDasharray = ''; p.style.strokeDashoffset = ''; });
          hand.forEach(function (h) { h.style.opacity = ''; });
        };
      }
    });
    state.mm.add('(min-width: 0px)', function () {
      return function () {
        if (day) day.reset();
        var facts = qs('[data-words]');
        if (facts && facts.__split) facts.__split.forEach(function (w) { w.style.opacity = ''; });
        var win = qs('[data-window]');
        if (win) { win.style.clipPath = ''; var i = qs('img', win); if (i) i.style.transform = ''; var f = qs('.about__frame', win); if (f) f.style.opacity = ''; }
      };
    });
    ScrollTrigger.refresh();
  }

  function teardownMotion() {
    if (state.mm) { state.mm.revert(); state.mm = null; }
    if (state.lenis) {
      if (state.tick) gsap.ticker.remove(state.tick);
      state.lenis.destroy();
      state.lenis = null; state.tick = null;
      window.__lenis = undefined;
      gsap.ticker.lagSmoothing(500, 33);
    }
    if (day) day.reset();
    if (state.hero) state.hero.disable();
    if (hasGSAP) ScrollTrigger.refresh();
  }

  /* ------------------------------------------------------------------
     Leistungs-Explorer (Tabs mit Pfeiltasten, Clip-Indikator)
     ------------------------------------------------------------------ */
  var tabsApi = null;
  function initTabs() {
    var root = qs('[data-tabs]');
    if (!root) return;
    var wrap = qs('.tabs', root);
    var list = qs('[role="tablist"]', root);
    var tabs = qsa('[role="tab"]', list);
    var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });
    var current = Math.max(0, tabs.findIndex(function (t) { return t.getAttribute('aria-selected') === 'true'; }));

    var overlay = list.cloneNode(true);
    overlay.classList.add('tabs__overlay');
    ['role', 'aria-label'].forEach(function (a) { overlay.removeAttribute(a); });
    overlay.setAttribute('aria-hidden', 'true');
    overlay.setAttribute('inert', '');
    qsa('*', overlay).forEach(function (el) {
      ['id', 'role', 'aria-controls', 'aria-selected'].forEach(function (a) { el.removeAttribute(a); });
      if (el.tagName === 'BUTTON') el.setAttribute('tabindex', '-1');
    });
    wrap.appendChild(overlay);
    wrap.classList.add('has-overlay');

    function clip(instant) {
      var tab = tabs[current];
      var lr = list.getBoundingClientRect(), tr = tab.getBoundingClientRect();
      if (!lr.width) return;
      if (instant) overlay.style.transition = 'none';
      overlay.style.clipPath = 'inset(' + (tr.top - lr.top).toFixed(1) + 'px ' + (lr.right - tr.right).toFixed(1) + 'px ' +
        (lr.bottom - tr.bottom).toFixed(1) + 'px ' + (tr.left - lr.left).toFixed(1) + 'px round .55rem .55rem 0 0)';
      if (instant) { overlay.getBoundingClientRect(); overlay.style.transition = ''; }
    }
    function select(i, focus, animate) {
      i = (i + tabs.length) % tabs.length;
      var changed = i !== current;
      current = i;
      tabs.forEach(function (t, j) {
        var on = j === i;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        panels[j].hidden = !on;
      });
      clip(false);
      if (focus) tabs[i].focus();
      if (changed && animate !== false && panels[i].animate && !motionOff()) {
        panels[i].animate(
          motionReduced() ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }],
          { duration: 260, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }
        );
      }
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(i, false); });
      t.addEventListener('keydown', function (e) {
        var k = e.key, n = null;
        if (k === 'ArrowRight' || k === 'ArrowDown') n = current + 1;
        else if (k === 'ArrowLeft' || k === 'ArrowUp') n = current - 1;
        else if (k === 'Home') n = 0;
        else if (k === 'End') n = tabs.length - 1;
        if (n === null) return;
        e.preventDefault();
        select(n, true, false);
      });
    });
    select(current, false, false);
    clip(true);
    if ('ResizeObserver' in window) new ResizeObserver(function () { clip(true); }).observe(list);
    document.addEventListener('lebenswert:layout', function () { clip(true); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { clip(true); });

    tabsApi = {
      openById: function (id) {
        var i = tabs.findIndex(function (t) { return t.id === id; });
        if (i >= 0) select(i, false);
      }
    };
    qsa('[data-open-tab]').forEach(function (a) {
      a.addEventListener('click', function () { tabsApi.openById(a.getAttribute('data-open-tab')); });
    });
  }

  /* ------------------------------------------------------------------
     Pflegegrad-Orientierung
     ------------------------------------------------------------------ */
  function gradeFor(points) {
    var g = 0;
    for (var i = 0; i < PG.THRESHOLDS.length; i++) if (points >= PG.THRESHOLDS[i]) g = i + 1;
    return g;
  }
  function fmtPts(n) { return new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }).format(n); }

  function initWizard() {
    var form = qs('[data-wizard]');
    if (!form) return;
    var card = form.closest('.pg__card');
    var steps = qsa('.wiz__step', form);
    var prev = qs('[data-wiz-prev]', form);
    var next = qs('[data-wiz-next]', form);
    var nextLabel = qs('[data-wiz-next-label]', form);
    var count = qs('[data-wiz-count]', form);
    var bar = qs('[data-wiz-bar]', form);
    var hint = qs('[data-wiz-hint]', form);
    var live = qs('[data-wiz-live]');
    var areas = qsa('.pg__areas li');
    var pgPath = qs('[data-pg-path]');
    var res = qs('[data-wiz-result]');
    var cur = 0;
    var lastResult = null;

    steps.forEach(function (s) { s.setAttribute('tabindex', '-1'); });
    function val(i) { var c = qs('input[name="q' + i + '"]:checked', form); return c ? +c.value : null; }
    function answered() { return steps.filter(function (s, i) { return val(i) !== null; }).length; }

    function paint() {
      count.textContent = 'Frage ' + (cur + 1) + ' von ' + steps.length;
      bar.style.transform = 'scaleX(' + (answered() / steps.length).toFixed(3) + ')';
      prev.disabled = cur === 0;
      nextLabel.textContent = cur === steps.length - 1 ? 'Auswerten' : 'Weiter';
      next.classList.toggle('is-ready', val(cur) !== null);
      if (pgPath) { pgPath.style.setProperty('--pg', res.hidden ? (answered() / steps.length).toFixed(3) : '1'); pgPath.classList.toggle('is-done', !res.hidden); }
      areas.forEach(function (li, i) {
        li.classList.toggle('is-current', i === cur && res.hidden);
        li.classList.toggle('is-done', val(i) !== null && (i !== cur || !res.hidden));
      });
    }
    function show(i, dir, focus) {
      var old = steps[cur];
      cur = clamp(i, 0, steps.length - 1);
      steps.forEach(function (s, j) { s.classList.toggle('is-active', j === cur); });
      hint.textContent = '';
      paint();
      var el = steps[cur];
      if (dir && el.animate && !motionOff() && old !== el) {
        el.animate(
          motionReduced() ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 0, transform: 'translateX(' + (dir * 22) + 'px)' }, { opacity: 1, transform: 'none' }],
          { duration: 280, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }
        );
      }
      if (focus) {
        try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); }
        var r = card.getBoundingClientRect();
        if (r.top < headerOffset() - 20 || r.top > window.innerHeight * .6) scrollToEl(card, { focus: false });
      }
      if (live && dir) live.textContent = 'Frage ' + (cur + 1) + ' von ' + steps.length;
    }
    function goNext() {
      if (val(cur) === null) {
        hint.textContent = 'Bitte wählen Sie eine Antwort – die Einschätzung, die am ehesten passt.';
        var first = qs('input[name="q' + cur + '"]', form);
        if (first) first.focus();
        return;
      }
      if (cur < steps.length - 1) show(cur + 1, 1, true);
      else evaluate();
    }
    function evaluate() {
      var a = steps.map(function (s, i) { return val(i); });
      var pts = a.map(function (v, i) { return PG.MAX[i] * PG.ANSWER_SHARE[v]; });
      var total = pts[0] + Math.max(pts[1], pts[2]) + pts[3] + pts[4] + pts[5];
      total = Math.round(total * 10) / 10;
      var g = gradeFor(total);
      var gLo = gradeFor(Math.max(0, total - PG.FUZZ));
      var gHi = gradeFor(Math.min(100, total + PG.FUZZ));
      lastResult = { grade: g, points: total };

      var title = qs('[data-res-title]', res);
      title.textContent = g ? 'Eher Pflegegrad ' + g : 'Eher noch kein Pflegegrad';
      var lo = g ? PG.THRESHOLDS[g - 1] : 0;
      var hi = g < 5 ? PG.THRESHOLDS[g] : 100;
      var txt = 'Ihre Antworten ergeben rund ' + fmtPts(total) + ' von 100 Punkten';
      if (g) txt += ' – das liegt im Bereich von Pflegegrad ' + g + ' (' + fmtPts(lo) + (g < 5 ? ' bis unter ' + fmtPts(hi) : ' bis 100') + ' Punkte).';
      else txt += '. Ein Pflegegrad beginnt bei 12,5 Punkten.';
      var alts = [];
      if (gLo !== g) alts.push(gLo ? 'Pflegegrad ' + gLo : 'kein Pflegegrad');
      if (gHi !== g) alts.push('Pflegegrad ' + gHi);
      if (alts.length) txt += ' Weil sechs Fragen nur eine grobe Näherung sind, ist auch ' + alts.join(' oder ') + ' denkbar.';
      if (!g) txt += ' Eine Beratung ist trotzdem kostenlos – oft helfen schon kleine Entlastungen.';
      qs('[data-res-range]', res).textContent = txt;

      // Skala
      var scale = qs('.scale', res);
      var bands = qsa('.scale__band', res);
      var labels = qsa('.scale__labels span', res);
      bands.forEach(function (b, i) { b.classList.toggle('is-hit', i === g); });
      labels.forEach(function (l, i) { l.classList.toggle('is-hit', i === g); });
      scale.classList.add('has-hit');
      var fuzz = qs('[data-scale-fuzz]', res);
      var f0 = clamp(total - PG.FUZZ, 0, 100), f1 = clamp(total + PG.FUZZ, 0, 100);
      fuzz.style.left = f0 + '%';
      fuzz.style.width = (f1 - f0) + '%';
      var marker = qs('[data-scale-marker]', res);
      marker.style.setProperty('--x', '0%');

      // Beträge
      var money = { geld: g >= 2 ? eur(PG.PFLEGEGELD[g]) : 'erst ab PG' + NB + '2', sach: g >= 2 ? eur(PG.SACHLEISTUNG[g]) : 'erst ab PG' + NB + '2', entl: g >= 1 ? eur(PG.ENTLASTUNG) : 'ab PG' + NB + '1' };
      qsa('[data-money]', res).forEach(function (dd) { dd.textContent = money[dd.getAttribute('data-money')]; });

      form.hidden = true;
      res.hidden = false;
      paint();
      areas.forEach(function (li) { li.classList.remove('is-current'); li.classList.add('is-done'); });
      if (res.animate && !motionOff()) res.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 360, easing: 'ease-out' });
      requestAnimationFrame(function () { requestAnimationFrame(function () { marker.style.setProperty('--x', total + '%'); }); });
      try { title.focus({ preventScroll: true }); } catch (e) { title.focus(); }
      var r = card.getBoundingClientRect();
      if (r.top < 0 || r.top > window.innerHeight * .5) scrollToEl(card, { focus: false });
      if (live) live.textContent = 'Auswertung: ' + title.textContent + ', rund ' + fmtPts(total) + ' von 100 Punkten. Nur der Medizinische Dienst stellt den Pflegegrad fest.';
      layoutChanged();
    }
    function restart() {
      form.reset();
      lastResult = null;
      res.hidden = true;
      form.hidden = false;
      qs('.scale', res).classList.remove('has-hit');
      show(0, 0, true);
      layoutChanged();
    }

    next.addEventListener('click', goNext);
    prev.addEventListener('click', function () { if (cur > 0) show(cur - 1, -1, true); });
    form.addEventListener('change', function () { hint.textContent = ''; paint(); });
    form.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target.type === 'radio') { e.preventDefault(); if (!e.target.checked) e.target.checked = true; paint(); goNext(); }
    });
    form.addEventListener('submit', function (e) { e.preventDefault(); goNext(); });
    qs('[data-wiz-restart]', res).addEventListener('click', restart);
    qs('[data-res-cta]', res).addEventListener('click', function () {
      if (!lastResult) return;
      var topic = qs('input[name="anliegen"][value="Pflegegrad & Antrag"]');
      if (topic) { topic.checked = true; topic.dispatchEvent(new Event('change', { bubbles: true })); }
      var msg = qs('[data-contact-msg]');
      if (msg && !msg.value.trim()) {
        msg.value = 'Selbsteinschätzung auf der Website: ' + (lastResult.grade ? 'eher Pflegegrad ' + lastResult.grade : 'eher noch kein Pflegegrad') +
          ' (rund ' + fmtPts(lastResult.points) + ' Punkte). Ich hätte gern einen Beratungstermin.';
      }
    });
    show(0, 0, false);
  }

  /* ------------------------------------------------------------------
     Einsatzgebiet: Karte, Ortsliste, Prüfung
     ------------------------------------------------------------------ */
  function initArea() {
    var map = qs('[data-map]');
    var form = qs('[data-area-form]');
    if (!map || !form) return;
    var input = qs('[data-area-input]', form);
    var out = qs('[data-area-result]', form);
    var pins = qsa('.map__pin', map);
    var places = qsa('.place');
    var bySlug = {};
    places.forEach(function (p) {
      bySlug[p.getAttribute('data-place')] = {
        el: p, slug: p.getAttribute('data-place'), name: p.getAttribute('data-name'),
        zone: +p.getAttribute('data-zone'), min: +p.getAttribute('data-min'), plz: p.getAttribute('data-plz') || ''
      };
    });
    var moreSlugs = AREA.ERFURT_MORE.map(slugify);

    function activate(slugs) {
      places.forEach(function (p) { p.setAttribute('aria-pressed', String(slugs.indexOf(p.getAttribute('data-place')) >= 0)); });
      pins.forEach(function (p) { p.classList.toggle('is-active', slugs.indexOf(p.getAttribute('data-place')) >= 0); });
    }
    function say(text, ok) {
      out.textContent = text;
      out.classList.toggle('is-yes', ok === true);
      out.classList.toggle('is-no', ok === false);
    }
    function describe(p) {
      return p.zone === 1
        ? 'Ja, wir kommen zu Ihnen: ' + p.name + ' gehört zu Zone' + NB + '1 (Stadtgebiet Erfurt), Anfahrt ca. ' + p.min + NB + 'Minuten.'
        : 'Ja, ' + p.name + ' gehört zu Zone' + NB + '2 (Umland), Anfahrt ca. ' + p.min + NB + 'Minuten. Für neue Touren fragen wir kurz nach freien Plätzen.';
    }
    function pick(slug) {
      var p = bySlug[slug]; if (!p) return;
      var on = p.el.getAttribute('aria-pressed') !== 'true';
      activate(on ? [slug] : []);
      say(on ? describe(p) : '', on ? true : null);
    }
    places.forEach(function (p) { p.addEventListener('click', function () { pick(p.getAttribute('data-place')); }); });
    pins.forEach(function (p) { p.addEventListener('click', function () { pick(p.getAttribute('data-place')); }); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var raw = input.value.trim();
      if (!raw) { activate([]); say('Bitte geben Sie einen Ort, Stadtteil oder eine Postleitzahl ein.', false); input.focus(); return; }
      var plz = (raw.match(/\b\d{5}\b/) || [])[0];
      if (plz) {
        if (AREA.ERFURT_PLZ.indexOf(plz) >= 0) { activate([]); say('Ja, die Postleitzahl ' + plz + ' gehört zum Stadtgebiet Erfurt – Zone' + NB + '1, Anfahrt ca. 10–25' + NB + 'Minuten.', true); return; }
        var hits = Object.keys(bySlug).filter(function (k) { return bySlug[k].plz === plz; });
        if (hits.length) {
          activate(hits);
          var names = hits.map(function (k) { return bySlug[k].name; });
          var list = names.length > 1 ? names.slice(0, -1).join(', ') + ' und ' + names[names.length - 1] : names[0];
          var mins = hits.map(function (k) { return bySlug[k].min; });
          var m0 = Math.min.apply(null, mins), m1 = Math.max.apply(null, mins);
          say('Ja, zur Postleitzahl ' + plz + ' fahren wir nach ' + list + ' – Zone' + NB + '2, Anfahrt ca. ' + (m0 === m1 ? m0 : m0 + '–' + m1) + NB + 'Minuten.', true);
          return;
        }
        activate([]);
        say('Die Postleitzahl ' + plz + ' liegt nicht in unseren Touren. Rufen Sie trotzdem an – wir nennen Ihnen gern einen Dienst in Ihrer Nähe.', false);
        return;
      }
      var q = slugify(raw.replace(/^erfurt[\s-]+/i, ''));
      if (!q) q = 'erfurt';
      var exact = bySlug[q];
      var starts = exact ? null : Object.keys(bySlug).filter(function (k) { return q.length >= 3 && k.indexOf(q) === 0; });
      var p = exact || (starts && starts.length ? bySlug[starts[0]] : null);
      if (p) { activate([p.slug]); say(describe(p), true); return; }
      var more = moreSlugs.indexOf(q) >= 0 || (q.length >= 4 && moreSlugs.some(function (m) { return m.indexOf(q) === 0; }));
      if (more) { activate([]); say('Ja, „' + raw + '“ gehört zum Stadtgebiet Erfurt – Zone' + NB + '1, Anfahrt ca. 10–25' + NB + 'Minuten.', true); return; }
      activate([]);
      say('„' + raw + '“ steht nicht in unserer Liste. Rufen Sie trotzdem an – oft passt der Ort in eine bestehende Tour, sonst nennen wir Ihnen einen Dienst in Ihrer Nähe.', false);
    });
  }

  /* ------------------------------------------------------------------
     Karriere: Gehaltsrahmen, Schichtmodelle, Bewerbung
     ------------------------------------------------------------------ */
  function tween(from, to, dur, cb) {
    if (!motionFull() || from === to) { cb(to); return; }
    var t0 = performance.now();
    (function step(now) {
      var p = clamp((now - t0) / dur, 0, 1);
      cb(lerp(from, to, 1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }
  var round10 = function (n) { return Math.round(n / 10) * 10; };

  function initSalary() {
    var root = qs('[data-calc]');
    if (!root) return;
    var hours = qs('[data-hours]', root);
    var hoursOut = qs('[data-hours-out]', root);
    var elLo = qs('[data-sal-lo]', root), elHi = qs('[data-sal-hi]', root);
    var fill = qs('[data-band]', root);
    var live = qs('[data-salary-live]', root);
    var shown = { lo: 3990, hi: 4270 };
    var liveTimer = 0;

    function role() { var r = qs('input[name="role"]:checked', root); return r ? r.value : 'fachkraft'; }
    function exp() { var r = qs('input[name="exp"]:checked', root); return r ? +r.value : 1; }
    function shift() { var r = qs('input[name="shift"]:checked'); return r ? r.value : 'frueh'; }

    function compute() {
      var R = SALARY.ROLES[role()], e = exp(), h = +hours.value, f = h / SALARY.FULLTIME_HOURS;
      var baseLo = round10(R.base[e] * f), baseHi = round10((R.base[e] + R.spread) * f);
      var extra = round10(SALARY.SHIFT_EXTRA[shift()] * f);
      var lo = baseLo + extra, hi = baseHi + extra;
      var fMin = round10(R.base[0] * f), fMax = round10((R.base[2] + R.spread) * f);
      var l = (baseLo - fMin) / (fMax - fMin) * 100, r = 100 - (baseHi - fMin) / (fMax - fMin) * 100;
      var perH = h * SALARY.WEEKS_PER_MONTH;

      hours.style.setProperty('--p', ((h - +hours.min) / (+hours.max - +hours.min) * 100) + '%');
      hoursOut.textContent = h + NB + 'h';
      fill.style.clipPath = 'inset(0 ' + clamp(r, 0, 100).toFixed(1) + '% 0 ' + clamp(l, 0, 100).toFixed(1) + '% round 99px)';
      qs('[data-band-min]', root).textContent = eur(fMin);
      qs('[data-band-max]', root).textContent = eur(fMax);
      qs('[data-sal-base]', root).textContent = nf0.format(baseLo) + '–' + nf0.format(baseHi) + NB + '€';
      qs('[data-sal-extra]', root).textContent = '+' + NB + eur(extra);
      qs('[data-sal-hour]', root).textContent = nf2.format(baseLo / perH) + '–' + nf2.format(baseHi / perH) + NB + '€';

      var fromLo = shown.lo, fromHi = shown.hi;
      shown.lo = lo; shown.hi = hi;
      tween(0, 1, 380, function (p) {
        elLo.textContent = nf0.format(round10(lerp(fromLo, lo, p)));
        elHi.textContent = nf0.format(round10(lerp(fromHi, hi, p)));
      });
      clearTimeout(liveTimer);
      liveTimer = setTimeout(function () {
        live.textContent = 'Beispielrechnung: ' + nf0.format(lo) + ' bis ' + nf0.format(hi) + ' Euro brutto im Monat bei ' + h + ' Wochenstunden.';
      }, 600);
    }
    root.addEventListener('input', compute);
    root.addEventListener('change', function (e) {
      compute();
      if (e.target.name === 'role') { var s = qs('[data-apply-role]'); if (s) s.value = e.target.value; }
    });
    document.addEventListener('lebenswert:shift', compute);
    compute();
  }

  function initShifts() {
    var root = qs('[data-shifts]');
    if (!root) return;
    var rowsEl = qs('[data-week]', root);
    var DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
    var bars = [];
    DAYS.forEach(function (d, i) {
      var row = document.createElement('div');
      row.className = 'week__row' + (i > 4 ? ' is-weekend' : '');
      var day = document.createElement('span');
      day.className = 'week__day';
      day.textContent = d;
      var track = document.createElement('div');
      track.className = 'week__track';
      var b1 = document.createElement('span'); b1.className = 'week__bar week__bar--1';
      var b2 = document.createElement('span'); b2.className = 'week__bar week__bar--2';
      track.appendChild(b1); track.appendChild(b2);
      row.appendChild(day); row.appendChild(track);
      rowsEl.appendChild(row);
      bars.push([{ el: b1, c: 50 }, { el: b2, c: 50 }]);
    });
    function setBar(b, span) {
      if (span) {
        var l = (span[0] - 6) / 16 * 100, r = (22 - span[1]) / 16 * 100;
        b.c = (l + (100 - r)) / 2;
        b.el.style.clipPath = 'inset(0 ' + r.toFixed(2) + '% 0 ' + l.toFixed(2) + '% round 99px)';
      } else {
        b.el.style.clipPath = 'inset(0 ' + (100 - b.c).toFixed(2) + '% 0 ' + b.c.toFixed(2) + '% round 99px)';
      }
    }
    function render(key) {
      var S = SHIFTS[key]; if (!S) return;
      DAYS.forEach(function (d, i) { setBar(bars[i][0], S.w1[i]); setBar(bars[i][1], S.w2[i]); });
      qs('[data-shift-name]', root).textContent = S.name;
      qs('[data-shift-times]', root).textContent = S.times;
      qs('[data-shift-weekend]', root).textContent = S.weekend;
      qs('[data-shift-hours]', root).textContent = S.hours;
      qs('[data-shift-fit]', root).textContent = S.fit;
      var sel = qs('[data-apply-shift]'); if (sel) sel.value = key;
      document.dispatchEvent(new CustomEvent('lebenswert:shift'));
    }
    root.addEventListener('change', function (e) { if (e.target.name === 'shift') render(e.target.value); });
    var checked = qs('input[name="shift"]:checked', root);
    render(checked ? checked.value : 'frueh');
  }

  /* Formular-Helfer */
  function fieldError(input, errEl, on) {
    if (!errEl) return;
    errEl.hidden = !on;
    var target = input.closest('fieldset') && input.type === 'radio' ? input.closest('fieldset') : input;
    var ids = (target.getAttribute('aria-describedby') || '').split(' ').filter(Boolean).filter(function (x) { return x !== errEl.id; });
    if (on) ids.push(errEl.id);
    if (ids.length) target.setAttribute('aria-describedby', ids.join(' ')); else target.removeAttribute('aria-describedby');
    if (input.type !== 'radio') input.setAttribute('aria-invalid', String(on));
  }
  function digits(s) { return (s.match(/\d/g) || []).length; }
  function addRow(dl, label, value) {
    if (!value) return;
    var div = document.createElement('div');
    var dt = document.createElement('dt'); dt.textContent = label;
    var dd = document.createElement('dd'); dd.textContent = value;
    div.appendChild(dt); div.appendChild(dd); dl.appendChild(div);
  }
  function selText(sel) { return sel && sel.selectedIndex >= 0 ? sel.options[sel.selectedIndex].text : ''; }

  function initApply() {
    var form = qs('[data-apply]');
    if (!form) return;
    var done = qs('[data-apply-done]');
    var ring = qs('.ring');
    var ringFg = qs('[data-ring]');
    var ringNum = qs('[data-ring-num]');
    var name = qs('#a-name'), tel = qs('#a-tel'), start = qs('#a-start'), dsgvo = qs('#a-dsgvo');
    var t0 = 0, tried = false;

    function checks() {
      return [name.value.trim().length >= 2, digits(tel.value) >= 6, !!start.value, dsgvo.checked];
    }
    function updateRing() {
      var n = checks().filter(Boolean).length;
      ringFg.style.strokeDasharray = (n / 4).toFixed(3) + ' 1';
      ring.classList.toggle('is-empty', n === 0);
      ringNum.textContent = String(n);
    }
    function validate(show) {
      var c = checks();
      if (show) {
        fieldError(name, qs('#a-name-err'), !c[0]);
        fieldError(tel, qs('#a-tel-err'), !c[1]);
        fieldError(start, qs('#a-start-err'), !c[2]);
        fieldError(dsgvo, qs('#a-dsgvo-err'), !c[3]);
      }
      return c;
    }
    form.addEventListener('focusin', function () { if (!t0) t0 = Date.now(); });
    form.addEventListener('input', function () { updateRing(); if (tried) validate(true); });
    form.addEventListener('change', function () { updateRing(); if (tried) validate(true); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      tried = true;
      var c = validate(true);
      var bad = [name, tel, start, dsgvo].filter(function (el, i) { return !c[i]; });
      if (bad.length) { bad[0].focus(); return; }
      var secs = Math.max(1, Math.round((Date.now() - (t0 || Date.now())) / 1000));
      var mm = Math.floor(secs / 60), ss = String(secs % 60).padStart(2, '0');
      qs('[data-apply-time]').textContent = secs <= 120
        ? 'Geschafft in ' + mm + ':' + ss + NB + 'Minuten – schneller als versprochen.'
        : 'Geschafft in ' + mm + ':' + ss + NB + 'Minuten.';
      var dl = qs('[data-apply-summary]');
      dl.textContent = '';
      addRow(dl, 'Name', name.value.trim());
      addRow(dl, 'Telefon', tel.value.trim());
      addRow(dl, 'Rolle', selText(qs('#a-role')));
      addRow(dl, 'Schichtmodell', selText(qs('#a-shift')));
      addRow(dl, 'Start', start.value);
      addRow(dl, 'Erreichbar', selText(qs('#a-time')));
      form.hidden = true;
      done.hidden = false;
      var title = qs('[data-apply-done-title]');
      try { title.focus({ preventScroll: true }); } catch (err) { title.focus(); }
      scrollToEl(done.closest('.apply__card'), { focus: false });
      layoutChanged();
    });
    qs('[data-apply-reset]').addEventListener('click', function () {
      form.reset(); tried = false; t0 = 0;
      qsa('.field__err', form).forEach(function (x) { x.hidden = true; });
      qsa('[aria-invalid]', form).forEach(function (x) { x.setAttribute('aria-invalid', 'false'); });
      var r = qs('input[name="role"]:checked'); if (r) qs('#a-role').value = r.value;
      var s = qs('input[name="shift"]:checked'); if (s) qs('#a-shift').value = s.value;
      done.hidden = true; form.hidden = false; updateRing(); name.focus(); layoutChanged();
    });
    updateRing();
  }

  /* ------------------------------------------------------------------
     Kontakt-Formular
     ------------------------------------------------------------------ */
  function initContact() {
    var form = qs('[data-contact]');
    if (!form) return;
    var done = qs('[data-contact-done]');
    var name = qs('#c-name'), tel = qs('#c-tel'), mail = qs('#c-mail'), dsgvo = qs('#c-dsgvo');
    var tried = false;
    function topic() { return qs('input[name="anliegen"]:checked', form); }
    function validate() {
      var ok = {
        topic: !!topic(),
        name: name.value.trim().length >= 2,
        tel: digits(tel.value) >= 6,
        mail: !mail.value.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail.value.trim()),
        dsgvo: dsgvo.checked
      };
      fieldError(qs('input[name="anliegen"]', form), qs('#c-topic-err'), !ok.topic);
      fieldError(name, qs('#c-name-err'), !ok.name);
      fieldError(tel, qs('#c-tel-err'), !ok.tel);
      fieldError(mail, qs('#c-mail-err'), !ok.mail);
      fieldError(dsgvo, qs('#c-dsgvo-err'), !ok.dsgvo);
      return ok;
    }
    form.addEventListener('input', function () { if (tried) validate(); });
    form.addEventListener('change', function () { if (tried) validate(); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      tried = true;
      var ok = validate();
      var order = [['topic', qs('input[name="anliegen"]', form)], ['name', name], ['tel', tel], ['mail', mail], ['dsgvo', dsgvo]];
      for (var i = 0; i < order.length; i++) { if (!ok[order[i][0]]) { order[i][1].focus(); return; } }
      var dl = qs('[data-contact-summary]');
      dl.textContent = '';
      var fuer = qs('input[name="fuer"]:checked', form);
      addRow(dl, 'Anliegen', topic().value);
      addRow(dl, 'Für', fuer ? fuer.value : '');
      addRow(dl, 'Name', name.value.trim());
      addRow(dl, 'Telefon', tel.value.trim());
      addRow(dl, 'E-Mail', mail.value.trim());
      addRow(dl, 'Wohnort', qs('#c-ort').value.trim());
      addRow(dl, 'Rückruf', selText(qs('#c-when')));
      var msg = qs('#c-msg').value.trim();
      addRow(dl, 'Nachricht', msg.length > 220 ? msg.slice(0, 220) + ' …' : msg);
      form.hidden = true;
      done.hidden = false;
      var title = qs('[data-contact-done-title]');
      try { title.focus({ preventScroll: true }); } catch (err) { title.focus(); }
      scrollToEl(done.closest('.contact__card'), { focus: false });
      layoutChanged();
    });
    qs('[data-contact-reset]').addEventListener('click', function () {
      form.reset(); tried = false;
      qsa('.field__err', form).forEach(function (x) { x.hidden = true; });
      qsa('[aria-invalid]', form).forEach(function (x) { x.setAttribute('aria-invalid', 'false'); });
      done.hidden = true; form.hidden = false;
      var first = qs('input[name="anliegen"]', form); if (first) first.focus();
      layoutChanged();
    });
  }

  /* ------------------------------------------------------------------
     Büro-Status (Europe/Berlin)
     ------------------------------------------------------------------ */
  function initOffice() {
    var els = qsa('[data-office-status]');
    if (!els.length || !window.Intl) return;
    var DAYNAMES = { Mon: 'Montag', Tue: 'Dienstag', Wed: 'Mittwoch', Thu: 'Donnerstag', Fri: 'Freitag', Sat: 'Samstag', Sun: 'Sonntag' };
    var ORDER = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    function now() {
      try {
        var parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Berlin', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
        var o = {}; parts.forEach(function (p) { o[p.type] = p.value; });
        return { wd: o.weekday, h: +o.hour % 24, m: +o.minute };
      } catch (e) { var d = new Date(); return { wd: ORDER[d.getDay()], h: d.getHours(), m: d.getMinutes() }; }
    }
    function update() {
      var n = now();
      var di = ORDER.indexOf(n.wd);
      var work = di >= 1 && di <= 5;
      var mins = n.h * 60 + n.m;
      var open = work && mins >= 480 && mins < 960;
      var text;
      if (open) text = 'Büro jetzt erreichbar · bis 16' + NB + 'Uhr';
      else {
        var when;
        if (work && mins < 480) when = 'heute um 8' + NB + 'Uhr';
        else {
          var nd = (di + 1) % 7;
          if (nd === 6 || nd === 0) when = 'Montag um 8' + NB + 'Uhr';
          else when = 'morgen um 8' + NB + 'Uhr';
          if (di === 5 && mins >= 960) when = 'Montag um 8' + NB + 'Uhr';
        }
        text = 'Büro wieder ' + when;
      }
      els.forEach(function (el) {
        el.classList.toggle('is-open', open);
        var t = qs('[data-office-text]', el);
        if (t) t.textContent = text;
      });
    }
    update();
    setInterval(update, 60000);
  }

  /* ------------------------------------------------------------------
     Start
     ------------------------------------------------------------------ */
  function init() {
    qsa('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });
    // Etappe 1: alles im ersten Bildschirm
    initA11y();
    initHeader();
    initMenu();
    initOffice();
    state.hero = createSkyline();
    initHeroIntro();
    initMagnets();
    // Etappe 2: der Rest in kleinen Häppchen, danach einmal Scroll-Choreografie
    var queue = [initReveal, initTabs, initWizard, initDay, initArea, initShifts, initSalary, initApply, initContact, setupMotion];
    var idle = window.requestIdleCallback ? function (f) { requestIdleCallback(f, { timeout: 120 }); } : function (f) { setTimeout(f, 16); };
    (function next() {
      // je Häppchen genau eine Aufgabe – so bleibt jeder Task kurz
      var f = queue.shift(), t0 = performance.now();
      f();
      (window.__initMs = window.__initMs || {})[f.name] = Math.round(performance.now() - t0);
      if (queue.length) idle(next);
      else {
        var onMq = function () {
          if (prefs.motion === true || prefs.motion === false || motionOff()) return;
          doc.classList.toggle('reduced', mqReduce.matches);
          syncA11yUi(); teardownMotion(); setupMotion();
        };
        if (mqReduce.addEventListener) mqReduce.addEventListener('change', onMq);
        if (document.readyState === 'complete') { if (hasGSAP && motionFull()) ScrollTrigger.refresh(); }
        else window.addEventListener('load', function () { if (hasGSAP && motionFull()) ScrollTrigger.refresh(); });
      }
    })();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
