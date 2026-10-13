/* ==========================================================================
   Falk & Partner Steuerberatung · Modell „Bilanz“ · main.js
   Ohne Build-Schritt. Optional: GSAP + ScrollTrigger, Lenis (assets/vendor).
   Ohne JavaScript und bei reduzierter Bewegung bleibt alles sichtbar.
   ========================================================================== */
(function () {
  'use strict';
  window.__bilanzReady = true;

  /* ------------------------------------------------------------------
     Stammdaten & Konstanten – hier anpassen
     ------------------------------------------------------------------ */
  var TZ = 'Europe/Berlin';
  /* Öffnungszeiten je Wochentag (0 = So … 6 = Sa): [ab, bis] in Stunden */
  var HOURS = { 1: [8, 17], 2: [8, 17], 3: [8, 17], 4: [8, 17], 5: [8, 14] };
  var DAY_NAMES = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  var DAY_SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  var MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

  /* Fristen-Ampel: bis zu so vielen Tagen gilt eine Frist als „rot“ bzw. „gelb“ */
  var AMPEL_ROT_TAGE = 7;
  var AMPEL_GELB_TAGE = 30;

  /* Mandantentypen (für Filter, Wegweiser, Checkliste, Formular) */
  var WHO = { privat: 'Privatpersonen', selbst: 'Selbstständige', gmbh: 'GmbH', verein: 'Vereine' };
  var WHO_FILTER = { privat: 'für Privat', selbst: 'für Selbstständige', gmbh: 'für GmbH', verein: 'für Vereine' };

  /* Zeitleisten-Spuren. Die Termine selbst erzeugt buildEvents() für das jeweilige Jahr –
     allgemeine gesetzliche Termine, keine individuellen Fristen. */
  var LANES = [
    { id: 'ust', name: 'Umsatzsteuer-Voranmeldung', short: 'USt-Voranmeldung', who: ['selbst', 'gmbh', 'verein'] },
    { id: 'lst', name: 'Lohnsteuer-Anmeldung', short: 'Lohnsteuer-Anmeldung', who: ['selbst', 'gmbh', 'verein'], sub: 'monatlich · zum 10.' },
    { id: 'vz', name: 'Einkommen- & Körperschaftsteuer', short: 'ESt-/KSt-Vorauszahlung', who: ['privat', 'selbst', 'gmbh'], sub: 'Vorauszahlung · zum 10.' },
    { id: 'gew', name: 'Gewerbe- & Grundsteuer', short: 'Gewerbe-/Grundsteuer', who: ['privat', 'selbst', 'gmbh'], sub: 'Vorauszahlung · zum 15.' },
    { id: 'erkl', name: 'Steuererklärungen', short: 'Steuererklärungen', who: ['privat', 'selbst', 'gmbh', 'verein'], sub: 'Abgabefristen' },
    { id: 'abs', name: 'Jahresabschluss', short: 'Jahresabschluss', who: ['gmbh'], sub: 'GmbH · nach HGB' }
  ];
  /* Abgabefrist Steuererklärung MIT Steuerberater: Sonderregeln je Veranlagungsjahr (sonst: letzter Februartag des übernächsten Jahres) */
  var BERATER_FRIST = { 2023: [2025, 5, 2], 2024: [2026, 4, 30] }; // [Jahr, Monat (1–12), Tag]

  /* Checkliste: Speicherschlüssel (nur im Browser, localStorage) */
  var CK_KEY = 'falk-partner:checkliste:v1';

  /* ------------------------------------------------------------------
     Helfer
     ------------------------------------------------------------------ */
  var doc = document.documentElement;
  var qs = function (s, r) { return (r || document).querySelector(s); };
  var qsa = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var pad2 = function (n) { return (n < 10 ? '0' : '') + n; };
  var easeInOut = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };

  var motionOff = doc.classList.contains('motion-off');
  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduced = function () { return motionOff || mqReduce.matches; };
  var motionOk = !reduced();
  var hasGSAP = !!(window.gsap && window.ScrollTrigger);
  var lenis = null;

  function safe(name, fn) {
    try { fn(); } catch (err) { if (window.console) console.warn('[Bilanz] ' + name + ':', err); }
  }
  function store(key, val) {
    try {
      if (val === undefined) { var raw = window.localStorage.getItem(key); return raw ? JSON.parse(raw) : null; }
      if (val === null) window.localStorage.removeItem(key); else window.localStorage.setItem(key, JSON.stringify(val));
    } catch (e) { /* privater Modus o. Ä. – Seite funktioniert trotzdem */ }
    return null;
  }
  function headerOffset() { var h = qs('[data-hdr]'); return h ? h.offsetHeight : 0; }
  function restart(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }

  /* Datum „heute“ in Hannover (als UTC-Mitternacht, damit Tagesdifferenzen exakt sind) */
  function berlinParts(d) {
    var out = {};
    try {
      new Intl.DateTimeFormat('en-GB', { timeZone: TZ, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hourCycle: 'h23', weekday: 'short' })
        .formatToParts(d).forEach(function (p) { out[p.type] = p.value; });
      var wd = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      return { y: +out.year, m: +out.month, d: +out.day, h: +out.hour, min: +out.minute, wd: wd[out.weekday] };
    } catch (e) {
      return { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate(), h: d.getHours(), min: d.getMinutes(), wd: d.getDay() };
    }
  }
  var NOW = berlinParts(new Date());
  var TODAY = Date.UTC(NOW.y, NOW.m - 1, NOW.d);
  var DAY = 864e5;
  function utc(y, m, d) { return Date.UTC(y, m - 1, d); }
  function fmtDate(t, withYear) { var d = new Date(t); return pad2(d.getUTCDate()) + '.' + pad2(d.getUTCMonth() + 1) + '.' + (withYear === false ? '' : d.getUTCFullYear()); }
  function wday(t) { return new Date(t).getUTCDay(); }

  /* ------------------------------------------------------------------
     Smooth Scroll (Lenis) + ScrollTrigger + Anker
     ------------------------------------------------------------------ */
  function initScroll() {
    if (hasGSAP) gsap.registerPlugin(ScrollTrigger);
    if (motionOk && window.Lenis) {
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
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button > 0) return;
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var target = document.getElementById(decodeURIComponent(id.slice(1)));
      if (!target) return;
      e.preventDefault();
      if (a.hasAttribute('data-set-type')) setChecklistType(a.getAttribute('data-set-type'), true);
      if (a.hasAttribute('data-set-form')) presetForm(a.getAttribute('data-set-form'));
      closeMenu(true);
      scrollToTarget(target, { focusEl: a.hasAttribute('data-set-form') ? qs('#f-name') : null });
      if (history.pushState) history.pushState(null, '', id);
    });
  }
  function scrollToTarget(target, opts) {
    opts = opts || {};
    var focus = function () {
      var f = opts.focusEl || target;
      if (!f.hasAttribute('tabindex') && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(f.tagName)) f.setAttribute('tabindex', '-1');
      try { f.focus({ preventScroll: true }); } catch (e) { f.focus(); }
    };
    var y = target.id === 'main' ? 0 : target.getBoundingClientRect().top + window.scrollY - headerOffset() - 8;
    if (lenis) {
      lenis.scrollTo(Math.max(0, y), { duration: 1.25, easing: easeInOut, onComplete: focus });
    } else {
      window.scrollTo({ top: Math.max(0, y), behavior: reduced() ? 'auto' : 'smooth' });
      setTimeout(focus, reduced() ? 0 : 700);
    }
  }

  /* ------------------------------------------------------------------
     Header: Zustand, Fortschritt, aktive Navigation
     ------------------------------------------------------------------ */
  function initHeader() {
    var hdr = qs('[data-hdr]'), bar = qs('[data-progress]');
    var ticking = false;
    var update = function () {
      ticking = false;
      var y = window.scrollY || 0;
      var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      hdr.classList.toggle('is-scrolled', y > 8);
      if (bar) bar.style.transform = 'scaleX(' + clamp(y / max, 0, 1).toFixed(4) + ')';
    };
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update);
    update();

    var links = qsa('.nav a'), map = {};
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
    qsa('main section[id]').forEach(function (s) { io.observe(s); });
  }

  /* ------------------------------------------------------------------
     Mobiles Menü (Dialog mit Fokusführung)
     ------------------------------------------------------------------ */
  var menuEl, menuBtn, menuLastFocus;
  function initMenu() {
    menuEl = qs('[data-menu]'); menuBtn = qs('[data-menu-open]');
    if (!menuEl || !menuBtn) return;
    qsa('.menu-list li', menuEl).forEach(function (li, i) { li.style.setProperty('--i', i); });
    menuBtn.addEventListener('click', openMenu);
    qs('[data-menu-close]', menuEl).addEventListener('click', function () { closeMenu(); });
    menuEl.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); closeMenu(); return; }
      if (e.key !== 'Tab') return;
      var f = qsa('a[href], button:not([disabled])', menuEl);
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    window.addEventListener('resize', function () { if (window.innerWidth >= 1100 && !menuEl.hidden) closeMenu(); });
  }
  function openMenu() {
    menuLastFocus = document.activeElement;
    menuEl.hidden = false;
    void menuEl.offsetWidth;
    menuEl.classList.add('is-open');
    menuBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    if (lenis) lenis.stop();
    var c = qs('[data-menu-close]', menuEl); if (c) c.focus();
  }
  function closeMenu(silent) {
    if (!menuEl || menuEl.hidden) return;
    menuEl.classList.remove('is-open');
    menuEl.hidden = true;
    menuBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    if (lenis) lenis.start();
    if (!silent && menuLastFocus && menuLastFocus.focus) menuLastFocus.focus();
  }

  /* ------------------------------------------------------------------
     Zahlenrollen (Odometer)
     ------------------------------------------------------------------ */
  var REEL = 20; // zwei Ziffernkränze 0–9, damit jede Stelle sichtbar rollt
  function Odo(el) {
    this.el = el;
    this.text = el.textContent;
    this.build(this.text);
  }
  Odo.prototype.build = function (text) {
    var el = this.el;
    el.textContent = '';
    var ph = document.createElement('span');
    ph.className = 'odo-ph';
    ph.textContent = text;
    var roll = document.createElement('span');
    roll.className = 'odo-roll';
    roll.setAttribute('aria-hidden', 'true');
    this.reels = [];
    for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i);
      if (/\d/.test(ch)) {
        var d = document.createElement('span'); d.className = 'odo-d';
        var s = document.createElement('span'); s.className = 'odo-s';
        for (var k = 0; k < REEL; k++) { var n = document.createElement('span'); n.textContent = String(k % 10); s.appendChild(n); }
        d.appendChild(s); roll.appendChild(d);
        this.reels.push({ strip: s, digit: +ch, pos: 0 });
      } else {
        var c = document.createElement('span'); c.className = 'odo-c'; c.textContent = ch; roll.appendChild(c);
      }
    }
    el.appendChild(ph); el.appendChild(roll);
    el.classList.add('is-built');
    this.ph = ph;
    this.text = text;
  };
  /* rollt alle Stellen auf ihren Zielwert; delay in s, stagger je Stelle */
  Odo.prototype.play = function (delay, stagger) {
    var self = this;
    this.reels.forEach(function (r, i) {
      r.strip.style.transitionDelay = ((delay || 0) + i * (stagger == null ? 0.05 : stagger)).toFixed(3) + 's';
      r.pos = 10 + r.digit;
      r.strip.style.transform = 'translateY(' + (-r.pos * (100 / REEL)) + '%)';
    });
    return self;
  };
  Odo.prototype.set = function (text) {
    if (text === this.text) return;
    var sameShape = text.length === this.text.length && text.replace(/\d/g, '0') === this.text.replace(/\d/g, '0');
    if (!sameShape) {
      this.build(text);
      this.reels.forEach(function (r) { r.strip.style.transition = 'none'; r.strip.style.transform = 'translateY(0)'; });
      void this.el.offsetWidth;
      this.reels.forEach(function (r) { r.strip.style.transition = ''; });
      this.play(0, 0.04);
      return;
    }
    this.ph.textContent = text;
    this.text = text;
    var digits = text.replace(/\D/g, '');
    this.reels.forEach(function (r, i) {
      var nd = +digits.charAt(i);
      r.digit = nd;
      /* immer vorwärts rollen: innerhalb der zwei Kränze den nächsten passenden Platz wählen */
      var next = r.pos >= 10 ? nd : 10 + nd;
      if (next === r.pos) return;
      r.pos = next;
      r.strip.style.transitionDelay = (i * 0.04).toFixed(2) + 's';
      r.strip.style.transform = 'translateY(' + (-r.pos * (100 / REEL)) + '%)';
    });
  };
  function plainSet(el, text) {
    if (el.__odo) el.__odo.set(text); else el.textContent = text;
  }

  /* ------------------------------------------------------------------
     Hero: Bilanz baut sich auf
     ------------------------------------------------------------------ */
  function initHero() {
    var hero = qs('.hero');
    if (!hero) return;
    if (motionOk) {
      /* Reihen gestaffelt einblenden, Zahlen rollen mit */
      var odos = [];
      qsa('.t-col', hero).forEach(function (col) {
        qsa('[data-t-row]', col).forEach(function (row, i) {
          var isSum = row.classList.contains('t-sum');
          var delay = isSum ? 1.95 : 1.0 + i * 0.15;
          row.style.setProperty('--rd', delay + 's');
          var o = qs('[data-odo]', row);
          if (o) odos.push({ el: o, delay: delay + 0.05 });
        });
      });
      var kpi = qs('.kpi-v [data-odo]', hero);
      if (kpi) odos.push({ el: kpi, delay: 2.0 });
      odos.forEach(function (o) { o.odo = o.el.__odo = new Odo(o.el); });
    }
    var go = function () {
      requestAnimationFrame(function () {
        hero.classList.add('is-go');
        if (motionOk) {
          odos.forEach(function (o) { o.odo.play(o.delay, 0.045); });
          setTimeout(function () { hero.classList.add('is-settled'); }, 3700);
        } else {
          hero.classList.add('is-settled');
        }
      });
    };
    /* auf Schriften warten (max. 450 ms), damit nichts springt */
    var started = false;
    var start = function () { if (!started) { started = true; go(); } };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(start);
    setTimeout(start, 450);
  }

  /* Hero-Parallaxe (nur Desktop, Bewegung erlaubt) */
  function initParallax() {
    if (!hasGSAP || !motionOk) return;
    var mm = gsap.matchMedia();
    mm.add('(min-width: 1000px)', function () {
      var photo = qs('[data-hero-photo]');
      var tw = gsap.to(photo, { yPercent: -14, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6 } });
      var tw2 = gsap.to('.hero-copy', { y: -40, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6 } });
      return function () { tw.kill(); tw2.kill(); gsap.set([photo, '.hero-copy'], { clearProps: 'transform' }); };
    });
  }

  /* ------------------------------------------------------------------
     Reveal-Choreografie
     ------------------------------------------------------------------ */
  function initReveal() {
    var els = qsa('[data-reveal]');
    if (motionOff || !('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add('is-in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      var n = 0;
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        el.style.setProperty('--rd', Math.min(n, 6) * 70 + 'ms');
        n++;
        el.classList.add('is-in');
        io.unobserve(el);
        setTimeout(function () { el.style.removeProperty('--rd'); }, 1400);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0 });
    els.forEach(function (el) {
      /* bereits oberhalb des Viewports (z. B. nach Neuladen weiter unten): sofort sichtbar */
      if (el.getBoundingClientRect().bottom < 0) el.classList.add('is-in'); else io.observe(el);
    });

    /* Kennzahlen rollen beim Einblenden */
    var stats = qsa('[data-odo-scroll]');
    if (!motionOk || !stats.length) return;
    stats.forEach(function (el) { el.__odo = new Odo(el); });
    var io2 = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var i = stats.indexOf(en.target);
        en.target.__odo.play(0.15 + (i % 4) * 0.08, 0.06);
        io2.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    stats.forEach(function (el) { io2.observe(el); });
  }

  /* ------------------------------------------------------------------
     Leistungen: Kontenblatt-Zeilen wechseln das Bild
     ------------------------------------------------------------------ */
  function initLedger() {
    var frame = qs('[data-lst-frame]'), cap = qs('[data-lst-cap]');
    if (!frame) return;
    var imgs = qsa('img[data-lst-img]', frame);
    var current = 'belege';
    var show = function (row) {
      var key = row.getAttribute('data-img');
      var nr = qs('.lr-nr', row).textContent, name = qs('.lr-name', row).textContent;
      if (cap) cap.textContent = 'Pos. ' + nr + ' · ' + name;
      if (key === current) return;
      imgs.forEach(function (img) {
        var k = img.getAttribute('data-lst-img');
        img.classList.remove('was-on');
        if (k === current) { img.classList.remove('is-on'); img.classList.add('was-on'); }
        if (k === key) { img.classList.remove('is-on'); void img.offsetWidth; img.classList.add('is-on'); }
      });
      current = key;
    };
    qsa('.lrow').forEach(function (row) {
      row.addEventListener('toggle', function () { if (row.open) show(row); });
      var sum = qs('summary', row);
      sum.addEventListener('mouseenter', function () { if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) show(row); });
      sum.addEventListener('focus', function () { show(row); });
    });
  }

  /* ------------------------------------------------------------------
     Mandanten-Wegweiser (Tabs mit Pfeiltasten)
     ------------------------------------------------------------------ */
  var wwSelect = null;
  function initWegweiser() {
    var root = qs('[data-ww]');
    if (!root) return;
    var tabs = qsa('[role="tab"]', root), panels = qsa('[role="tabpanel"]', root), ind = qs('[data-ww-ind]', root);
    var select = function (i, focus, animate) {
      tabs.forEach(function (t, k) {
        var on = k === i;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        panels[k].hidden = !on;
        if (on && animate) restart(panels[k], 'is-entering');
      });
      if (ind) ind.style.setProperty('--i', i);
      if (focus) tabs[i].focus();
    };
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(i, false, true); });
      t.addEventListener('keydown', function (e) {
        var k = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') k = (i + 1) % tabs.length;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') k = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') k = 0;
        else if (e.key === 'End') k = tabs.length - 1;
        if (k === null) return;
        e.preventDefault();
        select(k, true, false);
      });
    });
    panels.forEach(function (p) { p.addEventListener('animationend', function (e) { if (e.target.parentNode === p) p.classList.remove('is-entering'); }); });
    select(0, false, false);
    wwSelect = function (type) { var i = tabs.map(function (t) { return t.getAttribute('data-type'); }).indexOf(type); if (i > -1) select(i, false, false); };
  }

  /* ------------------------------------------------------------------
     Unterlagen-Checkliste (nur im Browser gespeichert)
     ------------------------------------------------------------------ */
  var setChecklistType = function () {};
  function initChecklist() {
    var root = qs('[data-ck]'), panel = qs('[data-ck-panel]');
    if (!root || !panel) return;
    var radios = qsa('input[name="ck-type"]', panel);
    var lists = qsa('.ck-list', root);
    var doneEl = qs('[data-ck-done]', panel), totalEl = qs('[data-ck-total]', panel), pctEl = qs('[data-ck-pct]', panel);
    var bar = qs('.ck-bar', panel), fill = qs('[data-ck-bar]', panel), note = qs('[data-ck-complete]', panel);
    var hasHas = window.CSS && CSS.supports && CSS.supports('selector(:has(a))');
    var state = store(CK_KEY) || { type: 'privat', checked: {} };
    if (!state.checked) state.checked = {};
    var type = state.type || 'privat';

    qsa('input[type="checkbox"][data-id]', root).forEach(function (cb) {
      cb.checked = !!state.checked[cb.getAttribute('data-id')];
      cb.addEventListener('change', function () {
        if (cb.checked) state.checked[cb.getAttribute('data-id')] = 1; else delete state.checked[cb.getAttribute('data-id')];
        save(); update();
      });
    });
    lists.forEach(function (l) { qsa('.ck-group', l).forEach(function (g, i) { g.style.setProperty('--g', i); }); });

    function save() { state.type = type; store(CK_KEY, state); }
    function activeList() { return lists.filter(function (l) { return l.getAttribute('data-list') === type; })[0]; }
    function update() {
      var list = activeList(); if (!list) return;
      var boxes = qsa('input[type="checkbox"]', list);
      var done = boxes.filter(function (b) { return b.checked; }).length, total = boxes.length;
      var p = total ? done / total : 0;
      doneEl.textContent = done; totalEl.textContent = total;
      pctEl.textContent = Math.round(p * 100);
      fill.style.transform = 'scaleX(' + p.toFixed(4) + ')';
      var full = total > 0 && done === total;
      bar.classList.toggle('is-full', full);
      note.hidden = !full;
    }
    function applyType(t, animate) {
      type = WHO[t] ? t : 'privat';
      radios.forEach(function (r) { r.checked = r.value === type; });
      lists.forEach(function (l) {
        var on = l.getAttribute('data-list') === type;
        if (!hasHas) l.hidden = !on;
        if (on && animate && motionOk) restart(l, 'is-entering');
      });
      update();
    }
    radios.forEach(function (r) { r.addEventListener('change', function () { if (r.checked) { applyType(r.value, true); save(); } }); });
    lists.forEach(function (l) { l.addEventListener('animationend', function () { l.classList.remove('is-entering'); }); });

    qs('[data-ck-reset]', panel).addEventListener('click', function () {
      var list = activeList();
      qsa('input[type="checkbox"]', list).forEach(function (b) { b.checked = false; delete state.checked[b.getAttribute('data-id')]; });
      save(); update();
    });
    qs('[data-ck-print]', panel).addEventListener('click', function () {
      document.body.classList.add('print-checklist');
      var done = function () { document.body.classList.remove('print-checklist'); window.removeEventListener('afterprint', done); };
      window.addEventListener('afterprint', done);
      window.print();
      setTimeout(done, 1500);
    });

    applyType(type, false);
    setChecklistType = function (t, fromLink) { applyType(t, !fromLink); save(); };
  }

  /* ------------------------------------------------------------------
     Digitaler Ablauf: gepinnte Schrittfolge (Desktop) / Einblenden (Handy)
     ------------------------------------------------------------------ */
  function initFlow() {
    var flow = qs('[data-flow]');
    if (!flow) return;
    var steps = qsa('.flow-step', flow);
    if (!motionOk) return; /* ohne Bewegung: alle Schritte vollständig sichtbar */

    var observeSteps = function () {
      if (!('IntersectionObserver' in window)) { steps.forEach(function (s) { s.classList.add('is-active'); }); return function () {}; }
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-active'); io.unobserve(en.target); } });
      }, { threshold: 0.3 });
      steps.forEach(function (s) { io.observe(s); });
      return function () { io.disconnect(); };
    };

    if (!hasGSAP) { observeSteps(); return; }

    var mm = gsap.matchMedia();
    mm.add('(min-width: 900px)', function () {
      var fill = qs('[data-flow-fill]', flow);
      var nav = document.createElement('nav');
      nav.className = 'flow-nav';
      nav.setAttribute('aria-label', 'Schritte des Ablaufs');
      var ol = document.createElement('ol');
      steps.forEach(function (s, i) {
        var li = document.createElement('li');
        var b = document.createElement('button');
        b.type = 'button';
        var num = document.createElement('b'); num.textContent = pad2(i + 1);
        var lbl = document.createElement('span');
        lbl.textContent = qs('.flow-n', s).textContent.replace(/^\s*\d+\s*/, '');
        b.appendChild(num); b.appendChild(lbl);
        b.addEventListener('click', function () { goTo(i); });
        li.appendChild(b); ol.appendChild(li);
      });
      nav.appendChild(ol);
      flow.insertBefore(nav, flow.firstChild);
      var items = qsa('li', ol);
      flow.classList.add('is-pinned');

      var active = -1;
      var setActive = function (i) {
        if (i === active) return;
        active = i;
        steps.forEach(function (s, k) { s.classList.toggle('is-active', k === i); });
        items.forEach(function (li, k) {
          li.classList.toggle('is-active', k === i);
          li.classList.toggle('is-done', k < i);
          var btn = li.firstChild;
          if (k === i) btn.setAttribute('aria-current', 'step'); else btn.removeAttribute('aria-current');
        });
      };
      var st = ScrollTrigger.create({
        trigger: flow,
        start: function () { return 'top ' + (headerOffset() + 28) + 'px'; },
        end: function () { return '+=' + Math.round(window.innerHeight * 0.75 * steps.length); },
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: function (self) {
          var p = self.progress;
          setActive(Math.min(steps.length - 1, Math.floor(p * steps.length + 0.0001)));
          if (fill) fill.style.transform = 'scaleY(' + clamp(p * steps.length / (steps.length - 1), 0, 1).toFixed(4) + ')';
        }
      });
      setActive(0);
      function goTo(i) {
        var y = st.start + (st.end - st.start) * ((i + 0.5) / steps.length);
        if (lenis) lenis.scrollTo(y, { duration: 1, easing: easeInOut }); else window.scrollTo({ top: y, behavior: 'smooth' });
      }
      return function () {
        st.kill();
        nav.remove();
        flow.classList.remove('is-pinned');
        if (fill) fill.style.transform = '';
        steps.forEach(function (s) { s.classList.remove('is-active'); });
      };
    });
    mm.add('(max-width: 899px)', function () { return observeSteps(); });
  }

  /* ------------------------------------------------------------------
     Fristenkalender
     ------------------------------------------------------------------ */
  var NI_HOLIDAYS = {};
  function easter(y) { /* Gauß/Anonymous-Gregorian */
    var a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25),
        g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4,
        l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451),
        month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
    return utc(y, month, day);
  }
  function holidays(y) { /* gesetzliche Feiertage Niedersachsen */
    if (NI_HOLIDAYS[y]) return NI_HOLIDAYS[y];
    var e = easter(y), set = {};
    [utc(y, 1, 1), e - 2 * DAY, e + DAY, utc(y, 5, 1), e + 39 * DAY, e + 50 * DAY, utc(y, 10, 3), utc(y, 10, 31), utc(y, 12, 25), utc(y, 12, 26)]
      .forEach(function (t) { set[t] = 1; });
    return (NI_HOLIDAYS[y] = set);
  }
  function nextWorkday(t) {
    var guard = 0;
    while ((wday(t) === 0 || wday(t) === 6 || holidays(new Date(t).getUTCFullYear())[t]) && guard++ < 10) t += DAY;
    return t;
  }
  function monthLabel(y, m) { /* m: 1–12, darf <1 sein */
    while (m < 1) { m += 12; y--; }
    return MONTHS[m - 1] + ' ' + y;
  }

  /* erzeugt alle allgemeinen Termine eines Jahres */
  function buildEvents(Y, opt) {
    var ev = [];
    var add = function (lane, y, m, d, o) {
      var orig = utc(y, m, d);
      var date = o.noShift ? orig : nextWorkday(orig);
      ev.push({ lane: lane, orig: orig, date: date, title: o.title, sub: o.sub, note: o.note || '', short: o.short });
    };
    var m, q;
    /* Umsatzsteuer-Voranmeldung */
    if (opt.turnus === 'monat') {
      for (m = 1; m <= 12; m++) {
        var per = opt.dfv ? m - 2 : m - 1;
        var n = 'Übermittlung per ELSTER und Zahlung bis zum 10.' + (opt.dfv ? ' – mit Dauerfristverlängerung einen Monat später.' : ' des Folgemonats.');
        if (opt.dfv && m === 2) n += ' Zusätzlich fällig: Sondervorauszahlung von 1/11 der Vorjahressumme.';
        add('ust', Y, m, 10, { title: 'Umsatzsteuer-Voranmeldung', sub: 'Zeitraum: ' + monthLabel(Y, per), note: n, short: 'USt-Voranmeldung' });
      }
    } else {
      for (q = 0; q < 4; q++) {
        var mm = q * 3 + 1 + (opt.dfv ? 1 : 0); /* Jan/Apr/Jul/Okt bzw. Feb/Mai/Aug/Nov */
        var qq = q === 0 ? '4. Quartal ' + (Y - 1) : q + '. Quartal ' + Y;
        add('ust', Y, mm, 10, { title: 'Umsatzsteuer-Voranmeldung', sub: 'Zeitraum: ' + qq, short: 'USt-Voranmeldung',
          note: 'Vierteljährlich bei weniger als 9.000 € Umsatzsteuer im Vorjahr.' + (opt.dfv ? ' Mit Dauerfristverlängerung einen Monat später – ohne Sondervorauszahlung.' : '') });
      }
    }
    /* Lohnsteuer-Anmeldung (keine Dauerfristverlängerung möglich) */
    for (m = 1; m <= 12; m++) {
      add('lst', Y, m, 10, { title: 'Lohnsteuer-Anmeldung', sub: 'Zeitraum: ' + monthLabel(Y, m - 1), short: 'Lohnsteuer-Anmeldung',
        note: 'Für Arbeitgeber – monatlich bei mehr als 5.000 € Lohnsteuer im Vorjahr, sonst vierteljährlich oder jährlich.' });
    }
    /* Vorauszahlungen ESt/KSt */
    [3, 6, 9, 12].forEach(function (mo, i) {
      add('vz', Y, mo, 10, { title: 'Vorauszahlung Einkommen- und Körperschaftsteuer', sub: (i + 1) + '. Quartal ' + Y, short: 'ESt-/KSt-Vorauszahlung',
        note: 'Nur mit Vorauszahlungsbescheid. Solidaritätszuschlag und ggf. Kirchensteuer werden am selben Tag fällig.' });
    });
    /* Gewerbe- und Grundsteuer */
    [2, 5, 8, 11].forEach(function (mo, i) {
      add('gew', Y, mo, 15, { title: 'Gewerbe- und Grundsteuer', sub: 'Vorauszahlung ' + (i + 1) + '. Quartal ' + Y, short: 'Gewerbe-/Grundsteuer',
        note: 'Gewerbesteuer laut Bescheid der Gemeinde. Grundsteuer betrifft Eigentümer – sofern keine Jahreszahlung zum 1. Juli beantragt ist.' });
    });
    /* Steuererklärungen */
    var bf = BERATER_FRIST[Y - 2];
    var bfDate = bf ? [bf[0], bf[1], bf[2]] : [Y, 2, new Date(Date.UTC(Y, 2, 0)).getUTCDate()];
    var next = BERATER_FRIST[Y - 1];
    var nextDate = next ? next : [Y + 1, 2, new Date(Date.UTC(Y + 1, 2, 0)).getUTCDate()];
    var nextTxt = fmtDate(nextWorkday(utc(nextDate[0], nextDate[1], nextDate[2])));
    add('erkl', bfDate[0], bfDate[1], bfDate[2], { title: 'Steuererklärungen ' + (Y - 2) + ' – mit Steuerberater', sub: 'Abgabefrist für beratene Steuerpflichtige', short: 'Erklärungen ' + (Y - 2) + ' (mit Berater)',
      note: 'Gilt für Einkommen-, Körperschaft-, Gewerbe- und Umsatzsteuererklärung. Das Finanzamt kann Erklärungen im Einzelfall früher anfordern.' });
    add('erkl', Y, 7, 31, { title: 'Steuererklärungen ' + (Y - 1) + ' – ohne Steuerberater', sub: 'Abgabefrist ohne Beratung', short: 'Erklärungen ' + (Y - 1),
      note: 'Mit Kanzlei verlängert sich die Frist für ' + (Y - 1) + ' bis ' + nextTxt + '. Wer freiwillig abgibt, hat vier Jahre Zeit.' });
    /* Jahresabschluss GmbH (HGB – keine Verschiebung auf Werktage) */
    add('abs', Y, 3, 31, { noShift: true, title: 'Jahresabschluss ' + (Y - 1) + ' aufstellen', sub: 'mittelgroße und große GmbH: binnen 3 Monaten', short: 'Jahresabschluss',
      note: 'Bilanz, GuV und Anhang zum Stichtag 31.12. – Grundlage für E-Bilanz und Bankgespräche.' });
    add('abs', Y, 6, 30, { noShift: true, title: 'Jahresabschluss ' + (Y - 1) + ' aufstellen', sub: 'kleine GmbH: spätestens nach 6 Monaten', short: 'Jahresabschluss',
      note: 'Kleine Kapitalgesellschaften dürfen später aufstellen, wenn es einem ordnungsgemäßen Geschäftsgang entspricht.' });
    add('abs', Y, 12, 31, { noShift: true, title: 'Offenlegung Jahresabschluss ' + (Y - 1), sub: 'Übermittlung an das Unternehmensregister', short: 'Offenlegung',
      note: 'Kleinst- und kleine GmbH dürfen eine verkürzte Bilanz einreichen. Bei Versäumnis droht ein Ordnungsgeldverfahren.' });

    ev.forEach(function (e) {
      e.days = Math.round((e.date - TODAY) / DAY);
      e.s = e.days < 0 ? 'past' : e.days <= AMPEL_ROT_TAGE ? 'soon' : e.days <= AMPEL_GELB_TAGE ? 'near' : 'later';
      e.laneObj = LANES.filter(function (l) { return l.id === e.lane; })[0];
    });
    ev.sort(function (a, b) { return a.date - b.date || LANES.indexOf(a.laneObj) - LANES.indexOf(b.laneObj); });
    return ev;
  }
  function daysText(d) {
    if (d === 0) return 'heute fällig';
    if (d === 1) return 'morgen fällig';
    if (d > 1) return 'in ' + d + ' Tagen';
    if (d === -1) return 'gestern abgelaufen';
    return 'vor ' + (-d) + ' Tagen abgelaufen';
  }
  function ampClass(s) { return s === 'past' ? 'amp--past' : s === 'soon' ? 'amp--red' : s === 'near' ? 'amp--amber' : 'amp--green'; }

  function initFristen() {
    var root = qs('[data-fr]');
    if (!root) return;
    var Y = NOW.y;
    var yearStart = utc(Y, 1, 1), yearLen = (utc(Y + 1, 1, 1) - yearStart) / DAY;
    var pos = function (t) { return clamp((t - yearStart) / DAY + 0.5, 0, yearLen) / yearLen; };
    var opt = { filter: 'alle', turnus: 'monat', dfv: false };
    var lanesEl = qs('[data-fr-lanes]', root), monthsEl = qs('[data-fr-months]', root);
    var daysEl = qs('[data-fr-days]', root), unitEl = qs('[data-fr-unit]', root), inEl = qs('.fr-in', root);
    var whatEl = qs('[data-fr-next-what]', root), ampEl = qs('[data-fr-next-amp]', root), live = qs('[data-fr-live]', root);
    var filterLbl = qs('[data-fr-filter-label]', root), tbody = qs('[data-fr-tbody]', root);
    var detail = qs('[data-fr-detail]', root);
    var D = { date: qs('[data-fd-date]', detail), title: qs('[data-fd-title]', detail), sub: qs('[data-fd-sub]', detail), status: qs('[data-fd-status]', detail), note: qs('[data-fd-note]', detail), who: qs('[data-fd-who]', detail) };
    var chipDays = qs('[data-next-chip-days]'), chipAmp = qs('[data-next-chip-amp]');
    var events = [], selected = null, laneTracks = {}, laneEls = {};

    qsa('[data-fr-year], [data-fr-year2]').forEach(function (el) { el.textContent = Y; });
    var tableWrap = qs('.fr-table-wrap', root);
    if (tableWrap) tableWrap.open = false; /* ohne JS bleibt die Liste offen */

    /* Monatsraster proportional zu den Monatslängen */
    var cols = [];
    for (var mo = 1; mo <= 12; mo++) cols.push(new Date(Date.UTC(Y, mo, 0)).getUTCDate() + 'fr');
    monthsEl.style.gridTemplateColumns = cols.join(' ');
    var pToday = pos(TODAY);
    var inYear = TODAY >= yearStart && TODAY < utc(Y + 1, 1, 1);
    if (inYear) {
      var tl = document.createElement('span');
      tl.className = 'fr-today-lbl';
      tl.textContent = 'Heute · ' + fmtDate(TODAY, false);
      tl.style.setProperty('--p', pToday);
      monthsEl.appendChild(tl);
    }
    var grid = document.createElement('div');
    grid.className = 'fr-grid';
    grid.setAttribute('aria-hidden', 'true');
    grid.style.gridTemplateColumns = cols.join(' ');
    for (mo = 0; mo < 12; mo++) grid.appendChild(document.createElement('span'));
    lanesEl.appendChild(grid);

    /* Spuren aufbauen */
    LANES.forEach(function (lane) {
      var row = document.createElement('div');
      row.className = 'fr-lane';
      row.setAttribute('data-lane', lane.id);
      var l = document.createElement('div');
      l.className = 'fr-lane-l';
      var st = document.createElement('strong'); st.textContent = lane.name;
      var sm = document.createElement('small'); sm.textContent = lane.sub || '';
      l.appendChild(st); l.appendChild(sm);
      var tr = document.createElement('div');
      tr.className = 'fr-track';
      var past = document.createElement('span'); past.className = 'fr-past'; past.setAttribute('aria-hidden', 'true');
      past.style.setProperty('--p', inYear ? pToday : (TODAY < yearStart ? 0 : 1));
      tr.appendChild(past);
      if (inYear) { var td = document.createElement('span'); td.className = 'fr-today'; td.setAttribute('aria-hidden', 'true'); td.style.setProperty('--p', pToday); tr.appendChild(td); }
      row.appendChild(l); row.appendChild(tr);
      lanesEl.appendChild(row);
      laneTracks[lane.id] = tr; laneEls[lane.id] = { row: row, small: sm };
    });

    var relevant = function (e) { return opt.filter === 'alle' || e.laneObj.who.indexOf(opt.filter) > -1; };
    var markerLabel = function (e) {
      return DAY_SHORT[wday(e.date)] + ' ' + fmtDate(e.date) + ', ' + e.title + ', ' + e.sub + ', ' + daysText(e.days);
    };

    function render(first) {
      var fresh = buildEvents(Y, opt);
      /* bestehende Marker nach Spur + Index wiederverwenden, damit sie gleiten statt springen */
      var byLane = {};
      events.forEach(function (e) { (byLane[e.lane] = byLane[e.lane] || []).push(e); });
      var counters = {};
      fresh.forEach(function (e) {
        var i = counters[e.lane] = (counters[e.lane] || 0);
        counters[e.lane]++;
        var old = byLane[e.lane] && byLane[e.lane][i];
        if (old && old.btn) { e.btn = old.btn; old.btn = null; }
        else {
          var b = document.createElement('button');
          b.type = 'button'; b.className = 'fm'; b.tabIndex = -1;
          if (!first || motionOk) b.classList.add('is-enter');
          laneTracks[e.lane].appendChild(b);
          e.btn = b;
        }
        e.btn.__ev = e;
        e.btn.style.setProperty('--p', pos(e.date).toFixed(5));
        e.btn.setAttribute('data-s', e.s);
        e.btn.setAttribute('aria-label', markerLabel(e));
        e.btn.disabled = !relevant(e);
      });
      /* übrig gebliebene Marker ausblenden und entfernen */
      events.forEach(function (e) {
        if (!e.btn) return;
        var b = e.btn;
        b.classList.add('is-leave'); b.disabled = true;
        setTimeout(function () { b.remove(); }, motionOk ? 220 : 0);
      });
      var prevSel = selected;
      events = fresh;
      /* Einblenden neuer Marker */
      var enter = qsa('.fm.is-enter', lanesEl);
      if (enter.length) {
        requestAnimationFrame(function () {
          enter.forEach(function (b, i) {
            if (first && motionOk) b.style.transitionDelay = '0s, ' + (i * 18) + 'ms';
            b.classList.remove('is-enter');
          });
          if (first) setTimeout(function () { enter.forEach(function (b) { b.style.transitionDelay = ''; }); }, 1400);
        });
      }
      /* Spuren dimmen, Spur-Untertitel */
      LANES.forEach(function (l) {
        var on = opt.filter === 'alle' || l.who.indexOf(opt.filter) > -1;
        laneEls[l.id].row.classList.toggle('is-dim', !on);
        if (l.id === 'ust') laneEls[l.id].small.textContent = (opt.turnus === 'monat' ? 'monatlich' : 'vierteljährlich') + ' · zum 10.' + (opt.dfv ? ' · +1 Monat' : '');
      });

      /* nächste Frist (über den Jahreswechsel hinaus) */
      var upcoming = events.filter(function (e) { return relevant(e) && e.days >= 0; });
      if (!upcoming.length) upcoming = buildEvents(Y + 1, opt).filter(function (e) { return relevant(e) && e.days >= 0; });
      var nextEv = upcoming[0];
      var same = nextEv ? upcoming.filter(function (e) { return e.date === nextEv.date; }) : [];
      if (nextEv) {
        var d = nextEv.days;
        if (inEl) inEl.textContent = d > 1 ? 'in' : '';
        plainSet(daysEl, d > 1 ? String(d) : (d === 1 ? 'morgen' : 'heute'));
        unitEl.textContent = d > 1 ? 'Tagen' : '';
        var names = [];
        same.forEach(function (e) { if (names.indexOf(e.laneObj.name) < 0) names.push(e.laneObj.name); });
        whatEl.textContent = DAY_SHORT[wday(nextEv.date)] + ', ' + fmtDate(nextEv.date) + ' · ' + names.join(', ');
        ampEl.className = 'amp amp--lg ' + ampClass(nextEv.s) + (nextEv.s === 'soon' || nextEv.s === 'near' ? ' amp--pulse' : '');
        if (live && !first) live.textContent = 'Nächste Frist ' + (opt.filter === 'alle' ? '' : WHO_FILTER[opt.filter] + ' ') + daysText(d) + ': ' + fmtDate(nextEv.date) + ', ' + names.join(', ') + '.';
      }
      filterLbl.textContent = opt.filter === 'alle' ? '' : WHO_FILTER[opt.filter];
      /* Hero-Chip zeigt immer die nächste Frist für alle */
      if (first && chipDays && nextEv) {
        var shorts = [];
        same.forEach(function (e) { if (shorts.indexOf(e.short) < 0) shorts.push(e.short); });
        chipDays.textContent = daysText(nextEv.days).replace(' fällig', '') + ' · ' + shorts[0] + (shorts.length > 1 ? ' u. a.' : '');
        chipAmp.className = 'amp ' + ampClass(nextEv.s) + (nextEv.s !== 'later' && nextEv.s !== 'past' ? ' amp--pulse' : '');
        var chip = chipDays.closest('a');
        if (chip) chip.setAttribute('aria-label', 'Nächste Steuerfrist ' + daysText(nextEv.days) + ': ' + fmtDate(nextEv.date) + ', ' + shorts.join(', ') + ' – zum Fristenkalender');
      }

      /* Auswahl halten (gleiche Spur + nächstgelegenes Datum) oder nächste Frist wählen */
      var sel = null;
      if (prevSel && relevant(prevSel)) {
        var cands = events.filter(function (e) { return e.lane === prevSel.lane; });
        cands.sort(function (a, b) { return Math.abs(a.date - prevSel.date) - Math.abs(b.date - prevSel.date); });
        sel = cands[0] || null;
      }
      if (!sel) sel = events.filter(function (e) { return relevant(e) && e.days >= 0; })[0] || events.filter(relevant)[0];
      choose(sel, false, !first && prevSel && sel && prevSel.lane === sel.lane && prevSel.title === sel.title && prevSel.sub === sel.sub);

      /* Tabelle */
      tbody.textContent = '';
      events.forEach(function (e) {
        var trEl = document.createElement('tr');
        if (e.days < 0) trEl.className = 'is-past';
        if (!relevant(e)) trEl.hidden = true;
        var c1 = document.createElement('td'); c1.className = 'mono'; c1.textContent = fmtDate(e.date);
        var c2 = document.createElement('td'); c2.textContent = e.title + ' · ' + e.sub;
        var c3 = document.createElement('td'); c3.textContent = e.laneObj.who.map(function (w) { return WHO[w]; }).join(', ');
        trEl.appendChild(c1); trEl.appendChild(c2); trEl.appendChild(c3);
        tbody.appendChild(trEl);
      });
    }

    function choose(e, focus, quiet) {
      if (!e) return;
      events.forEach(function (x) { if (x.btn) { x.btn.setAttribute('aria-pressed', x === e ? 'true' : 'false'); x.btn.tabIndex = x === e ? 0 : -1; } });
      selected = e;
      if (focus) e.btn.focus();
      if (quiet) return;
      D.date.textContent = DAY_NAMES[wday(e.date)] + ' · ' + fmtDate(e.date);
      D.title.textContent = e.title;
      D.sub.textContent = e.sub;
      D.status.textContent = '';
      var a = document.createElement('span'); a.className = 'amp ' + ampClass(e.s); a.setAttribute('aria-hidden', 'true');
      var t = document.createElement('span'); t.textContent = daysText(e.days);
      D.status.appendChild(a); D.status.appendChild(t);
      var note = e.note;
      if (e.date !== e.orig) note = 'Regulär ' + fmtDate(e.orig, false) + ' (' + DAY_NAMES[wday(e.orig)] + ') – verschoben auf den nächsten Werktag. ' + note;
      D.note.textContent = note;
      D.who.textContent = 'Betrifft: ' + e.laneObj.who.map(function (w) { return WHO[w]; }).join(', ') + (e.lane === 'gew' ? ' (Grundsteuer: Eigentümer)' : '');
      if (motionOk) restart(detail, 'is-swap');
    }

    /* Klick + Tastatur auf der Zeitleiste */
    lanesEl.addEventListener('click', function (e) {
      var b = e.target.closest('.fm');
      if (!b || b.disabled || !b.__ev) return;
      choose(b.__ev, false, false);
    });
    lanesEl.addEventListener('keydown', function (e) {
      var b = e.target.closest && e.target.closest('.fm');
      if (!b || !b.__ev) return;
      var cur = b.__ev, list, k = null;
      var laneEvents = function (id) { return events.filter(function (x) { return x.lane === id && relevant(x); }); };
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'Home' || e.key === 'End') {
        list = laneEvents(cur.lane);
        var i = list.indexOf(cur);
        if (e.key === 'ArrowRight') k = list[Math.min(list.length - 1, i + 1)];
        else if (e.key === 'ArrowLeft') k = list[Math.max(0, i - 1)];
        else if (e.key === 'Home') k = list[0];
        else k = list[list.length - 1];
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        var ids = LANES.map(function (l) { return l.id; }).filter(function (id) { return laneEvents(id).length; });
        var li = ids.indexOf(cur.lane) + (e.key === 'ArrowDown' ? 1 : -1);
        if (li < 0 || li >= ids.length) { e.preventDefault(); return; }
        list = laneEvents(ids[li]);
        list.sort(function (a, c) { return Math.abs(a.date - cur.date) - Math.abs(c.date - cur.date); });
        k = list[0];
      }
      if (!k) return;
      e.preventDefault();
      choose(k, true, false);
    });

    /* Steuerelemente */
    qsa('input[name="fr-for"]', root).forEach(function (r) { r.addEventListener('change', function () { if (r.checked) { opt.filter = r.value; render(false); } }); });
    qsa('input[name="fr-turnus"]', root).forEach(function (r) { r.addEventListener('change', function () { if (r.checked) { opt.turnus = r.value; render(false); } }); });
    var dfv = qs('[data-fr-dfv]', root);
    if (dfv) dfv.addEventListener('change', function () { opt.dfv = dfv.checked; dfv.setAttribute('aria-checked', dfv.checked ? 'true' : 'false'); render(false); });
    /* Zustand nach „Zurück“-Navigation übernehmen */
    var chk = qs('input[name="fr-for"]:checked', root); if (chk) opt.filter = chk.value;
    var chk2 = qs('input[name="fr-turnus"]:checked', root); if (chk2) opt.turnus = chk2.value;
    if (dfv) { opt.dfv = dfv.checked; dfv.setAttribute('aria-checked', dfv.checked ? 'true' : 'false'); }

    render(true);
    /* Tage-Zähler als Rolle, sobald sichtbar */
    if (motionOk && 'IntersectionObserver' in window) {
      daysEl.__odo = new Odo(daysEl);
      var io = new IntersectionObserver(function (en) {
        if (!en[0].isIntersecting) return;
        io.disconnect();
        daysEl.__odo.play(0.2, 0.08);
      }, { rootMargin: '0px 0px -15% 0px' });
      io.observe(daysEl);
    }
  }

  /* ------------------------------------------------------------------
     Öffnungszeiten: „jetzt geöffnet“
     ------------------------------------------------------------------ */
  function initOpenStatus() {
    var wrap = qs('[data-open-status]');
    if (!wrap) return;
    var dot = qs('[data-open-dot]', wrap), txt = qs('[data-open-text]', wrap);
    var update = function () {
      var n = berlinParts(new Date());
      var mins = n.h * 60 + n.min, h = HOURS[n.wd];
      qsa('.hours tr').forEach(function (tr) {
        var d = +tr.getAttribute('data-day');
        tr.classList.toggle('is-today', d === n.wd || (d === 6 && n.wd === 0));
      });
      if (h && mins >= h[0] * 60 && mins < h[1] * 60) {
        dot.className = 'amp';
        dot.style.setProperty('--amp-c', 'var(--mint-d)');
        txt.textContent = 'Jetzt erreichbar · bis ' + h[1] + ' Uhr';
        return;
      }
      /* nächste Öffnung suchen */
      for (var k = 0; k < 8; k++) {
        var wd = (n.wd + k) % 7, hh = HOURS[wd];
        if (!hh) continue;
        if (k === 0 && mins >= hh[0] * 60) continue;
        dot.className = 'amp amp--past';
        dot.style.removeProperty('--amp-c');
        txt.textContent = 'Gerade geschlossen · wieder ' + (k === 0 ? 'heute' : k === 1 ? 'morgen' : DAY_NAMES[wd]) + ' ab ' + hh[0] + ' Uhr';
        return;
      }
    };
    update();
    setInterval(function () { if (!document.hidden) update(); }, 60000);
  }

  /* ------------------------------------------------------------------
     Kontaktformular (nur clientseitig, Demo)
     ------------------------------------------------------------------ */
  var presetForm = function () {};
  function initForm() {
    var form = qs('[data-form]'), ok = qs('[data-form-ok]');
    if (!form || !ok) return;
    var typ = qs('#f-typ', form), msg = qs('#f-msg', form), count = qs('[data-count]', form);
    var TYPE_LABEL = { privat: 'Privatperson', selbst: 'Selbstständig / freiberuflich', gmbh: 'GmbH / UG', verein: 'Verein / Stiftung' };
    presetForm = function (t) { if (TYPE_LABEL[t]) { typ.value = t; setErr('typ', ''); } };

    msg.addEventListener('input', function () { count.textContent = msg.value.length; });

    function setErr(name, text) {
      var p = qs('[data-err-for="' + name + '"]', form);
      if (p) p.textContent = text;
      var field = name === 'thema' ? null : form.elements[name];
      if (field && field.setAttribute) { if (text) field.setAttribute('aria-invalid', 'true'); else field.removeAttribute('aria-invalid'); }
    }
    function validate() {
      var errs = [];
      var name = form.elements.name.value.trim();
      var mail = form.elements.email.value.trim();
      var tel = form.elements.tel.value.trim();
      var themen = qsa('input[name="thema"]:checked', form);
      if (name.length < 2) errs.push(['name', 'Bitte geben Sie Ihren Namen an.']);
      if (!mail) errs.push(['email', 'Bitte geben Sie Ihre E-Mail-Adresse an.']);
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) errs.push(['email', 'Diese E-Mail-Adresse sieht unvollständig aus.']);
      if (tel && tel.replace(/\D/g, '').length < 6) errs.push(['tel', 'Bitte prüfen Sie die Telefonnummer – oder lassen Sie das Feld leer.']);
      if (!typ.value) errs.push(['typ', 'Bitte wählen Sie aus, wer Sie sind.']);
      if (!themen.length) errs.push(['thema', 'Bitte wählen Sie mindestens ein Thema.']);
      if (!form.elements.dsgvo.checked) errs.push(['dsgvo', 'Bitte bestätigen Sie die Einwilligung.']);
      ['name', 'email', 'tel', 'typ', 'thema', 'dsgvo'].forEach(function (n) { setErr(n, ''); });
      errs.forEach(function (e) { setErr(e[0], e[1]); });
      return errs;
    }
    /* nach dem ersten Absenden: Fehlermeldungen beim Korrigieren live aktualisieren */
    var tried = false;
    var revalidate = function () { if (tried) validate(); };
    form.addEventListener('input', revalidate);
    form.addEventListener('change', revalidate);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      tried = true;
      var errs = validate();
      if (errs.length) {
        var first = errs[0][0];
        var el = first === 'thema' ? qs('input[name="thema"]', form) : form.elements[first];
        if (el && el.focus) el.focus();
        return;
      }
      var themen = qsa('input[name="thema"]:checked', form).map(function (c) { return c.value; });
      var formArt = (qs('input[name="form"]:checked', form) || {}).value || '';
      var rows = [
        ['Name', form.elements.name.value.trim()],
        ['E-Mail', form.elements.email.value.trim()],
        ['Telefon', form.elements.tel.value.trim() || '–'],
        ['Mandantentyp', TYPE_LABEL[typ.value]],
        ['Themen', themen.join(', ')],
        ['Gespräch', formArt],
        ['Nachricht', msg.value.trim() || '–']
      ];
      var sum = qs('[data-ok-sum]', ok);
      sum.textContent = '';
      rows.forEach(function (r) {
        var div = document.createElement('div');
        var dt = document.createElement('dt'); dt.textContent = r[0];
        var dd = document.createElement('dd'); dd.textContent = r[1];
        div.appendChild(dt); div.appendChild(dd); sum.appendChild(div);
      });
      var first = form.elements.name.value.trim().split(/\s+/)[0];
      qs('[data-ok-title]', ok).textContent = 'Danke, ' + first + '.';
      form.hidden = true;
      ok.hidden = false;
      try { ok.focus({ preventScroll: true }); } catch (err) { ok.focus(); }
      var top = ok.getBoundingClientRect().top;
      if (top < headerOffset() || top > window.innerHeight * 0.6) scrollToTarget(ok, { focusEl: ok });
    });
    qs('[data-form-reset]', ok).addEventListener('click', function () {
      form.reset();
      tried = false;
      count.textContent = '0';
      ['name', 'email', 'tel', 'typ', 'thema', 'dsgvo'].forEach(function (n) { setErr(n, ''); });
      ok.hidden = true;
      form.hidden = false;
      form.elements.name.focus();
    });
  }

  /* ------------------------------------------------------------------
     Karte & Aktionsleiste
     ------------------------------------------------------------------ */
  function initMap() {
    var map = qs('[data-map]');
    if (!map) return;
    if (!motionOk || !('IntersectionObserver' in window)) { map.classList.add('is-in'); return; }
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) { map.classList.toggle('is-in', x.isIntersecting || map.classList.contains('is-in')); });
      /* Puls nur, solange sichtbar */
      map.classList.toggle('is-paused', !en[0].isIntersecting);
    }, { threshold: 0.25 });
    io.observe(map);
  }
  function initActionbar() {
    var bar = qs('[data-actionbar]');
    if (!bar || !('IntersectionObserver' in window)) return;
    var hide = { kontakt: false, ftr: false };
    var apply = function () { bar.classList.toggle('is-hidden', hide.kontakt || hide.ftr); };
    var k = qs('#kontakt'), f = qs('.ftr');
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) { hide[x.target === k ? 'kontakt' : 'ftr'] = x.isIntersecting; });
      apply();
    }, { rootMargin: '0px 0px -30% 0px' });
    if (k) io.observe(k);
    if (f) io.observe(f);
  }

  /* ------------------------------------------------------------------
     Start
     ------------------------------------------------------------------ */
  safe('scroll', initScroll);
  safe('header', initHeader);
  safe('menu', initMenu);
  safe('hero', initHero);
  safe('reveal', initReveal);
  safe('ledger', initLedger);
  safe('wegweiser', initWegweiser);
  safe('checklist', initChecklist);
  safe('flow', initFlow);
  safe('fristen', initFristen);
  safe('parallax', initParallax);
  safe('open', initOpenStatus);
  safe('form', initForm);
  safe('map', initMap);
  safe('actionbar', initActionbar);

  if (hasGSAP) {
    var refresh = function () { ScrollTrigger.refresh(); };
    window.addEventListener('load', refresh);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  }
  /* bei Rücknavigation an Anker: Position nach Aufbau korrigieren */
  if (location.hash && location.hash.length > 1) {
    var t = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (t) window.addEventListener('load', function () { setTimeout(function () { scrollToTarget(t, { focusEl: t }); }, 60); });
  }
})();
