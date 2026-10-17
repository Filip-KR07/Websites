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
  var berlinFmt = null; /* Formatter einmal anlegen – der Konstruktor ist teuer */
  function berlinParts(d) {
    var out = {};
    try {
      berlinFmt = berlinFmt || new Intl.DateTimeFormat('en-GB', { timeZone: TZ, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hourCycle: 'h23', weekday: 'short' });
      berlinFmt.formatToParts(d).forEach(function (p) { out[p.type] = p.value; });
      var wd = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      return { y: +out.year, m: +out.month, d: +out.day, h: +out.hour, min: +out.minute, wd: wd[out.weekday] };
    } catch (e) {
      return { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate(), h: d.getHours(), min: d.getMinutes(), wd: d.getDay() };
    }
  }
  /* „heute“ wird erst beim Aufbau des Fristenkalenders bestimmt (Intl mit Zeitzone ist beim ersten Aufruf teuer) */
  var NOW = null, TODAY = 0;
  function initToday() { if (!NOW) { NOW = berlinParts(new Date()); TODAY = Date.UTC(NOW.y, NOW.m - 1, NOW.d); } }
  var DAY = 864e5;
  function utc(y, m, d) { return Date.UTC(y, m - 1, d); }
  function fmtDate(t, withYear) { var d = new Date(t); return pad2(d.getUTCDate()) + '.' + pad2(d.getUTCMonth() + 1) + '.' + (withYear === false ? '' : d.getUTCFullYear()); }
  function wday(t) { return new Date(t).getUTCDay(); }


  /* Abreißkalender: so viele kommende Fristtermine (nach „Heute“) bekommen ein eigenes Blatt */
  var PAD_LEAVES = 6;
  /* Rechenstreifen: Tipp-Tempo je Ziffer (ms) und Pause nach dem Anschlag */
  var TAPE_CHAR_MS = 13, TAPE_STRIKE_MS = 105, TAPE_START_MS = 420;

  var mqFine = window.matchMedia('(hover: hover) and (pointer: fine)');
  function finePointer() { return mqFine.matches; }
  function localDate(d) { return pad2(d.getDate()) + '.' + pad2(d.getMonth() + 1) + '.' + d.getFullYear(); }

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
  function scrollToY(y) {
    if (lenis) lenis.scrollTo(y, { duration: 0.9, easing: easeInOut });
    else window.scrollTo({ top: y, behavior: reduced() ? 'auto' : 'smooth' });
  }

  /* ------------------------------------------------------------------
     Header: Zustand, Fortschritt, aktive Navigation, Zeichen-Rollen
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
    requestAnimationFrame(update); /* kein erzwungenes Layout beim Start */

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
  /* Zeichen rollen beim Hover: sichtbarer Text als Einzelzeichen, Original für Screenreader */
  function initRoll() {
    if (!motionOk) return;
    qsa('[data-roll]').forEach(function (a) {
      var text = a.textContent;
      a.textContent = '';
      var sr = document.createElement('span'); sr.className = 'sr-only'; sr.textContent = text;
      var roll = document.createElement('span'); roll.className = 'roll'; roll.setAttribute('aria-hidden', 'true');
      for (var i = 0; i < text.length; i++) {
        var c = document.createElement('i'); c.textContent = text.charAt(i); c.style.setProperty('--c', i); roll.appendChild(c);
      }
      a.appendChild(sr); a.appendChild(roll);
    });
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
  var REEL_TEXT = (function () { var s = []; for (var k = 0; k < REEL; k++) s.push(k % 10); return s.join('\n'); })();
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
        var s = document.createElement('span'); s.className = 'odo-s'; s.textContent = REEL_TEXT;
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
  Odo.prototype.play = function (delay, stagger) {
    this.reels.forEach(function (r, i) {
      r.strip.style.transitionDelay = ((delay || 0) + i * (stagger == null ? 0.05 : stagger)).toFixed(3) + 's';
      r.pos = 10 + r.digit;
      r.strip.style.transform = 'translateY(' + (-r.pos * (100 / REEL)) + '%)';
    });
    return this;
  };
  Odo.prototype.set = function (text, stagger) {
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
    var st = stagger == null ? 0.04 : stagger;
    var wrapped = [];
    /* immer vorwärts rollen wie ein Zählwerk; am Ende des zweiten Kranzes unsichtbar zurücksetzen */
    this.reels.forEach(function (r, i) {
      var nd = +digits.charAt(i);
      r.digit = nd;
      if (r.pos % 10 === nd) return;
      var next = r.pos - (r.pos % 10) + nd;
      if (next < r.pos) next += 10;
      if (next > REEL - 1) {
        r.strip.style.transition = 'none';
        r.pos -= 10; next -= 10;
        r.strip.style.transform = 'translateY(' + (-r.pos * (100 / REEL)) + '%)';
        wrapped.push(r);
      }
      r.next = next;
    });
    if (wrapped.length) { void this.el.offsetWidth; wrapped.forEach(function (r) { r.strip.style.transition = ''; }); }
    this.reels.forEach(function (r, i) {
      if (r.next == null) return;
      r.pos = r.next; r.next = null;
      r.strip.style.transitionDelay = (i * st).toFixed(3) + 's';
      r.strip.style.transform = 'translateY(' + (-r.pos * (100 / REEL)) + '%)';
    });
  };
  /* alle Rollen ohne Animation auf „0“ stellen (Zählwerk löschen) */
  Odo.prototype.zero = function (text) {
    this.reels.forEach(function (r) { r.strip.style.transition = 'none'; r.strip.style.transitionDelay = '0s'; r.pos = 0; r.digit = 0; r.strip.style.transform = 'translateY(0)'; });
    if (text) { this.ph.textContent = text; this.text = text; }
    void this.el.offsetWidth;
    this.reels.forEach(function (r) { r.strip.style.transition = ''; });
  };
  function plainSet(el, text) {
    if (el.__odo) el.__odo.set(text); else el.textContent = text;
  }

  /* ------------------------------------------------------------------
     Hero: der Rechenstreifen druckt die Bilanz
     Zeile für Zeile: Papiervorschub → Ziffern tippen → Anschlag (+ / *) →
     das Summenzählwerk rollt. Am Ende Stempel „ausgeglichen“ mit heutigem Datum.
     ------------------------------------------------------------------ */
  function fmtReg(n) { /* 000.000,00 – mechanisches Zählwerk mit führenden Nullen */
    var s = String(Math.round(Math.abs(n)));
    while (s.length < 6) s = '0' + s;
    return s.slice(0, 3) + '.' + s.slice(3) + ',00';
  }
  function initHero() {
    var m = qs('[data-machine]');
    if (!m) return;
    var today = localDate(new Date());
    qsa('[data-today]').forEach(function (t) { t.textContent = today; t.setAttribute('datetime', today.split('.').reverse().join('-')); });
    if (!motionOk) return;

    var tape = qs('[data-tape]', m), reg = qs('[data-reg]', m), again = qs('[data-reprint]', m);
    var lines = qsa('.tl, .stamp', tape);
    var keys = {};
    qsa('[data-mk]', m).forEach(function (k) { keys[k.getAttribute('data-mk')] = k; });
    var regOdo = reg.__odo = new Odo(reg); /* zeigt „000.000,00“, bis gerechnet wird */
    var timers = [], running = false, tapeH = 0, bottoms = [];

    var measure = function () {
      tapeH = tape.offsetHeight;
      bottoms = lines.map(function (ln) { return ln.offsetTop + ln.offsetHeight + (ln.classList.contains('stamp') ? 10 : 0); });
    };
    var feedTo = function (i) { tape.style.transform = 'translateY(' + Math.max(0, tapeH - bottoms[i]) + 'px)'; };
    var press = function (k) {
      var el = keys[k]; if (!el) return;
      el.classList.add('is-down');
      setTimeout(function () { el.classList.remove('is-down'); }, 110);
    };
    var later = function (fn, t) { timers.push(setTimeout(fn, t)); };

    /* Zwischen Aktiva und Passiva wird das Zählwerk gelöscht – die laufende Summe beginnt neu */
    var clearIdx = lines.map(function (l) { return l.hasAttribute('data-clear'); }).indexOf(true);
    /* laufende Summe pro Abschnitt: data-v-Zeilen nach dem Löschen zählen neu */
    (function patchSums() {
      var acc = 0;
      lines.forEach(function (ln, i) {
        if (i === clearIdx) acc = 0;
        var v = +ln.getAttribute('data-v') || 0;
        if (v) acc += v;
        ln.__sum = acc;
      });
    })();
    /* Druckfolge: Zeitpunkte je Zeile, alles per setTimeout (unterbrechbar über reset) */
    var run = function () {
      running = true;
      if (again) again.disabled = true;
      measure();
      tape.style.transition = 'none';
      tape.style.transform = 'translateY(' + tapeH + 'px)';
      void tape.offsetWidth;
      tape.style.transition = 'transform var(--t-feed) var(--ease-out)';
      m.classList.add('is-run');
      var t = 0, passiva = false;
      lines.forEach(function (ln, i) {
        var isStamp = ln.classList.contains('stamp');
        var n = qs('.tl-n', ln);
        if (ln.hasAttribute('data-clear')) passiva = true;
        var fast = passiva ? 0.72 : 1;
        later(function () { feedTo(i); ln.classList.add('is-p'); }, t);
        if (isStamp) {
          later(function () { if (tape.animate) tape.animate([{ translate: '0 0' }, { translate: '0 1.5px' }, { translate: '0 0' }], { duration: 140, easing: 'ease-out' }); }, t + 40);
          t += 260; return;
        }
        if (ln.classList.contains('tl--hd')) { t += 110; return; }
        if (ln.classList.contains('tl--rule') || ln.classList.contains('tl--dbl')) { t += 170; return; }
        if (ln.hasAttribute('data-clear')) { later(function () { press('c'); regOdo.set(fmtReg(0), 0.02); }, t + 40); t += 150; return; }
        if (!n) { t += 100; return; }
        var chars = n.textContent.length;
        var ty = Math.round(chars * TAPE_CHAR_MS * fast);
        ln.style.setProperty('--ch', chars);
        ln.style.setProperty('--ty', ty + 'ms');
        var isTotal = ln.hasAttribute('data-total'), isDiff = ln.hasAttribute('data-diff');
        var show = ln.__sum; /* Differenz-Zeile: Zählwerk behält die Bilanzsumme */
        later(function () { press(isTotal ? '*' : '+'); if (!isDiff) regOdo.set(fmtReg(show), 0.025); }, t + ty);
        t += ty + Math.round((isTotal ? TAPE_STRIKE_MS + 70 : TAPE_STRIKE_MS) * fast);
      });
      later(function () { running = false; m.classList.add('is-done'); m.classList.remove('is-run'); if (again) again.disabled = false; }, t + 200);
    };

    var reset = function () {
      timers.forEach(clearTimeout); timers = [];
      m.classList.remove('is-done', 'is-run');
      lines.forEach(function (ln) { ln.classList.remove('is-p'); });
      regOdo.zero(fmtReg(0));
    };
    if (again) {
      again.addEventListener('click', function () {
        if (running) return;
        again.disabled = true;
        m.classList.add('is-tearing');
        setTimeout(function () {
          measure();
          tape.style.transition = 'none';
          tape.style.transform = 'translateY(' + tapeH + 'px)';
          reset();
          m.classList.remove('is-tearing');
          void tape.offsetWidth;
          setTimeout(run, 160);
        }, 540);
      });
    }
    window.addEventListener('resize', function () {
      if (running || !m.classList.contains('is-done')) return;
      measure(); feedTo(lines.length - 1);
    });

    /* Start, sobald Schriften stehen und die Maschine im Bild ist */
    var fontsOk = false, inView = false, started = false;
    var start = function () { if (!started && fontsOk && inView) { started = true; setTimeout(run, TAPE_START_MS); } };
    var fontsDone = function () { fontsOk = true; start(); };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fontsDone);
    setTimeout(fontsDone, 450);
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (en) {
        if (!en[0].isIntersecting) return;
        io.disconnect(); inView = true; start();
      }, { rootMargin: '0px 0px -10% 0px' });
      io.observe(m);
    } else { inView = true; start(); }
  }

  /* Magnetische Taste (nur feiner Zeiger): folgt dem Zeiger ein Stück, federt zurück */
  function initMagnet() {
    if (!motionOk) return;
    qsa('[data-magnet]').forEach(function (el) {
      var x = 0, y = 0, tx = 0, ty = 0, raf = 0;
      var tick = function () {
        x += (tx - x) * 0.2; y += (ty - y) * 0.2;
        el.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0)';
        if (Math.abs(tx - x) > 0.05 || Math.abs(ty - y) > 0.05) raf = requestAnimationFrame(tick);
        else { raf = 0; if (!tx && !ty) el.style.transform = ''; }
      };
      var kick = function () { if (!raf) raf = requestAnimationFrame(tick); };
      el.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse' || !finePointer()) return;
        var r = el.getBoundingClientRect();
        tx = clamp((e.clientX - (r.left + r.width / 2)) * 0.18, -7, 7);
        ty = clamp((e.clientY - (r.top + r.height / 2)) * 0.28, -5, 5);
        kick();
      });
      el.addEventListener('pointerleave', function () { tx = 0; ty = 0; kick(); });
    });
  }

  /* ------------------------------------------------------------------
     Reveal-Choreografie
     ------------------------------------------------------------------ */
  function initReveal() {
    var els = qsa('[data-reveal]');
    qsa('[data-reveal="rows"]').forEach(function (g) { Array.prototype.forEach.call(g.children, function (c, i) { c.style.setProperty('--i', i); }); });
    if (motionOff || !('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add('is-in'); }); }
    else {
      var io = new IntersectionObserver(function (entries) {
        var n = 0;
        entries.forEach(function (en) {
          var el = en.target;
          if (!en.isIntersecting) {
            if (en.boundingClientRect.bottom < 0) { el.classList.add('is-in'); io.unobserve(el); }
            return;
          }
          el.style.setProperty('--rd', Math.min(n, 5) * 60 + 'ms');
          n++;
          el.classList.add('is-in');
          io.unobserve(el);
          setTimeout(function () { el.style.removeProperty('--rd'); }, 1400);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0 });
      els.forEach(function (el) { io.observe(el); });
    }

    /* Kennzahlen im Kanzleijournal rollen beim Einblenden */
    var stats = qsa('[data-odo-scroll]');
    if (!motionOk || !stats.length || !('IntersectionObserver' in window)) return;
    stats.forEach(function (el) { el.__odo = new Odo(el); });
    var io2 = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var i = stats.indexOf(en.target);
        en.target.__odo.play(0.2 + i * 0.09, 0.07);
        io2.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -12% 0px' });
    stats.forEach(function (el) { io2.observe(el); });
  }

  /* ------------------------------------------------------------------
     Leistungen: Vorschau folgt dem Zeiger (Feder), Bild je Position
     ------------------------------------------------------------------ */
  function initLedger() {
    var ledger = qs('[data-ledger]'), peek = qs('[data-peek]');
    if (!ledger || !peek || !motionOk) return;
    var box = qs('[data-peek-img]', peek), cap = qs('[data-peek-cap]', peek);
    var imgs = {}, built = false, cur = null, on = false;
    var x = 0, y = 0, tx = 0, ty = 0, rot = 0, trot = 0, raf = 0, w = 300, h = 200;
    var build = function () {
      if (built) return; built = true;
      qsa('.lrow', ledger).forEach(function (row) {
        var k = row.getAttribute('data-img');
        if (imgs[k]) return;
        var img = document.createElement('img');
        img.alt = ''; img.decoding = 'async'; img.width = 480; img.height = 320;
        img.sizes = '320px';
        img.srcset = '/arena/steuer-falk/assets/img/' + k + '-duo-480.webp 480w, /arena/steuer-falk/assets/img/' + k + '-duo-960.webp 960w';
        img.src = '/arena/steuer-falk/assets/img/' + k + '-duo-480.webp';
        box.appendChild(img); imgs[k] = img;
      });
    };
    var tick = function () {
      x += (tx - x) * 0.16; y += (ty - y) * 0.16; rot += (trot - rot) * 0.12;
      peek.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) rotate(' + rot.toFixed(2) + 'deg)';
      if (on || Math.abs(tx - x) > 0.3 || Math.abs(ty - y) > 0.3) raf = requestAnimationFrame(tick); else raf = 0;
    };
    var show = function (row) {
      var k = row.getAttribute('data-img');
      cap.textContent = 'Pos. ' + qs('.lr-nr', row).textContent + ' · ' + qs('.lr-name', row).textContent;
      if (k === cur) return;
      Object.keys(imgs).forEach(function (n) { imgs[n].classList.toggle('is-on', n === k); });
      cur = k;
    };
    ledger.addEventListener('pointerenter', function (e) {
      if (e.pointerType !== 'mouse' || !finePointer()) return;
      build();
      w = peek.offsetWidth; h = peek.offsetHeight;
      x = tx = e.clientX + 28; y = ty = e.clientY - h * 0.5;
    });
    ledger.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse' || !finePointer()) return;
      var row = e.target.closest && e.target.closest('.lrow');
      if (!row || (row.open && !e.target.closest('summary'))) { if (on) { on = false; peek.classList.remove('is-on'); } return; }
      show(row);
      var vw = window.innerWidth, vh = window.innerHeight;
      var nx = e.clientX + 32;
      if (nx + w > vw - 16) nx = e.clientX - w - 32;
      trot = clamp((e.clientX + 32 - tx) * 0.04, -3, 3);
      tx = nx; ty = clamp(e.clientY - h * 0.55, 80, vh - h - 40);
      if (!on) { on = true; peek.classList.add('is-on'); }
      if (!raf) raf = requestAnimationFrame(tick);
    });
    ledger.addEventListener('pointerleave', function () { on = false; peek.classList.remove('is-on'); trot = 0; });
    window.addEventListener('scroll', function () { if (on) { on = false; peek.classList.remove('is-on'); } }, { passive: true });
  }

  /* ------------------------------------------------------------------
     Mandanten-Wegweiser (Tabs mit Pfeiltasten)
     ------------------------------------------------------------------ */
  function initWegweiser() {
    var root = qs('[data-ww]');
    if (!root) return;
    var tabs = qsa('[role="tab"]', root), panels = qsa('[role="tabpanel"]', root);
    var select = function (i, focus, animate) {
      tabs.forEach(function (t, k) {
        var on = k === i;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        panels[k].hidden = !on;
        if (on && animate && motionOk) restart(panels[k], 'is-entering');
      });
      if (focus) tabs[i].focus();
    };
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { if (t.getAttribute('aria-selected') !== 'true') select(i, false, true); });
      t.addEventListener('keydown', function (e) {
        var k = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') k = (i + 1) % tabs.length;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') k = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') k = 0;
        else if (e.key === 'End') k = tabs.length - 1;
        if (k === null) return;
        e.preventDefault();
        select(k, true, false); /* Tastatur: ohne Animation */
      });
    });
    panels.forEach(function (p) { p.addEventListener('animationend', function (e) { if (e.target.parentNode === p) p.classList.remove('is-entering'); }); });
    select(0, false, false);
    doc.classList.add('ww-ready');
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

  /* Ordner-Deckel: klappt beim Hineinscrollen auf (einmalig) – bleibt danach offen.
     Bleibt das Scrollen auf halber Strecke stehen, öffnet er sich nach kurzer Pause von selbst. */
  function initBinder() {
    var cover = qs('[data-cover]'), binder = qs('[data-binder]');
    if (!cover || !binder || !motionOk || !hasGSAP) { if (cover) cover.style.display = 'none'; return; }
    var OPEN = -166, done = false, idle = 0, st = null, tw = null;
    gsap.set(cover, { rotationY: 0, transformPerspective: 0 });
    var finish = function (animate) {
      if (done) return; done = true;
      if (st) { st.kill(); st = null; }
      if (tw) tw.kill();
      gsap.to(cover, { rotationY: OPEN, duration: animate ? 0.7 : 0, ease: 'power2.inOut', onComplete: function () { cover.style.visibility = 'hidden'; } });
    };
    tw = gsap.fromTo(cover, { rotationY: 0 }, { rotationY: OPEN, ease: 'none', paused: true });
    st = ScrollTrigger.create({
      trigger: binder, start: 'top 90%', end: 'top 32%', scrub: 0.5,
      animation: tw,
      onUpdate: function (self) {
        clearTimeout(idle);
        if (self.progress >= 0.999) { finish(false); return; }
        if (self.progress > 0.04) idle = setTimeout(function () { finish(true); }, 1400);
      }
    });
    /* bereits vorbei (z. B. Sprung per Anker): sofort offen */
    if (st.progress >= 0.999 || binder.getBoundingClientRect().top < window.innerHeight * 0.32) finish(false);
  }

  /* ------------------------------------------------------------------
     Digitaler Ablauf: Sticky-Storytelling (Desktop) / Einblenden (Handy)
     – position: sticky, ScrollTrigger nur für den Fortschritt (kein Pin)
     ------------------------------------------------------------------ */
  var mqFlow = window.matchMedia('(min-width: 900px)');
  function flowLayout() {
    var flow = qs('[data-flow]');
    if (!flow || !motionOk || !hasGSAP) return;
    var apply = function () {
      flow.classList.toggle('is-sticky', mqFlow.matches);
      flow.style.setProperty('--steps', qsa('.flow-step', flow).length);
    };
    apply();
  }
  function initFlow() {
    var flow = qs('[data-flow]');
    if (!flow) return;
    var steps = qsa('.flow-step', flow);
    if (!motionOk) return; /* ohne Bewegung: alle Schritte vollständig sichtbar */
    var counter = qs('[data-flow-odo]', flow);
    if (counter) { counter.__odo = new Odo(counter); counter.__odo.play(0.1, 0.05); }

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
      flow.classList.add('is-sticky');
      flow.style.setProperty('--steps', steps.length);
      var grid = qs('.flow-grid', flow);
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
      grid.appendChild(nav);
      var items = qsa('li', ol);
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
        if (counter && counter.__odo) counter.__odo.set(pad2(i + 1), 0.03);
      };
      var st = ScrollTrigger.create({
        trigger: flow,
        start: function () { return 'top ' + headerOffset() + 'px'; },
        end: 'bottom bottom',
        invalidateOnRefresh: true,
        onUpdate: function (self) { setActive(Math.min(steps.length - 1, Math.floor(self.progress * steps.length + 0.0001))); }
      });
      setActive(0);
      function goTo(i) { scrollToY(st.start + (st.end - st.start) * ((i + 0.5) / steps.length)); }
      return function () {
        st.kill();
        nav.remove();
        flow.classList.remove('is-sticky');
        steps.forEach(function (s) { s.classList.remove('is-active'); });
      };
    });
    mm.add('(max-width: 899px)', function () { return observeSteps(); });
  }

  /* ------------------------------------------------------------------
     Leichte Tiefen-Parallaxe (Collage, Belege) und Prägesiegel
     ------------------------------------------------------------------ */
  function initParallax() {
    if (!hasGSAP || !motionOk) return;
    var mm = gsap.matchMedia();
    mm.add('(min-width: 900px)', function () {
      var tws = qsa('[data-par]').map(function (el) {
        var v = +el.getAttribute('data-par') || 0;
        return gsap.fromTo(el, { yPercent: -v / 2 }, { yPercent: v / 2, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 0.6 } });
      });
      return function () { tws.forEach(function (t) { t.scrollTrigger && t.scrollTrigger.kill(); t.kill(); }); gsap.set('[data-par]', { clearProps: 'transform' }); };
    });
    qsa('[data-seal]').forEach(function (s, i) {
      gsap.fromTo(s, { rotation: -14 + i * 8 }, { rotation: 22 + i * 8, ease: 'none', scrollTrigger: { trigger: s, start: 'top bottom', end: 'bottom top', scrub: 0.8 } });
    });
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
    initToday();
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
    doc.classList.add('fr-ready');

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
      choose(sel, false, !first && prevSel && sel && prevSel.lane === sel.lane && prevSel.title === sel.title && prevSel.sub === sel.sub, first);

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

    function choose(e, focus, quiet, noAnim) {
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
      if (motionOk && !noAnim) restart(detail, 'is-swap'); /* beim Aufbau kein erzwungenes Layout */
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
    safe('tear', function () { initTear(Y); });
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
     Abreißkalender: „Heute“ + die nächsten Fristtermine als Blätter.
     Desktop: Blätter reißen beim Scrollen ab (Sticky-Bühne, Scrub).
     Handy / ohne Scroll-Bindung: per Knopf; das erste Blatt reißt einmal von selbst ab.
     ------------------------------------------------------------------ */
  function isoWeek(t) {
    var d = new Date(t), day = (d.getUTCDay() + 6) % 7;
    d.setUTCDate(d.getUTCDate() - day + 3);
    var first = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
    return 1 + Math.round(((d - first) / DAY - 3 + ((first.getUTCDay() + 6) % 7)) / 7);
  }
  function initTear(Y) {
    var wrap = qs('[data-tear-wrap]'), pad = qs('[data-tear]'), box = qs('[data-tear-leaves]');
    if (!wrap || !pad || !box) return;
    var prev = qs('[data-tear-prev]'), next = qs('[data-tear-next]'), count = qs('[data-tear-count]'), live = qs('[data-tear-live]');
    var opt = { turnus: 'monat', dfv: false };
    var evs = buildEvents(Y, opt).concat(buildEvents(Y + 1, opt)).filter(function (e) { return e.days >= 0; });
    /* nach Datum gruppieren */
    var groups = [];
    evs.forEach(function (e) {
      var g = groups[groups.length - 1];
      if (g && g.date === e.date) { if (g.names.indexOf(e.laneObj.name) < 0) g.names.push(e.laneObj.name); }
      else groups.push({ date: e.date, days: e.days, s: e.s, names: [e.laneObj.name] });
    });
    groups = groups.slice(0, PAD_LEAVES);
    var nextG = groups[0];
    var data = [{ today: true, date: TODAY, days: 0, s: 'today' }].concat(groups);
    var N = data.length;

    var mk = function (tag, cls, text) { var el = document.createElement(tag); if (cls) el.className = cls; if (text != null) el.textContent = text; return el; };
    var leaves = data.map(function (d, i) {
      var dt = new Date(d.date);
      var leaf = mk('div', 'leaf' + (d.today ? ' leaf--today' : ''));
      leaf.setAttribute('data-s', d.s);
      leaf.style.zIndex = String(N - i);
      var band = mk('div', 'leaf-band');
      band.appendChild(mk('span', null, d.today ? 'Heute' : 'Steuerfrist'));
      band.appendChild(mk('span', null, 'KW ' + isoWeek(d.date)));
      leaf.appendChild(band);
      leaf.appendChild(mk('p', 'leaf-wd', DAY_NAMES[dt.getUTCDay()]));
      leaf.appendChild(mk('p', 'leaf-day', String(dt.getUTCDate())));
      leaf.appendChild(mk('p', 'leaf-mo', MONTHS[dt.getUTCMonth()] + ' ' + dt.getUTCFullYear()));
      var what = mk('p', 'leaf-what');
      var inn = mk('p', 'leaf-in');
      var amp = mk('span', 'amp'); amp.setAttribute('aria-hidden', 'true');
      if (d.today) {
        what.appendChild(mk('b', null, 'Nächste Frist am ' + fmtDate(nextG.date, false)));
        what.appendChild(document.createTextNode(nextG.names.join(', ')));
        inn.appendChild(document.createTextNode('Noch ' + nextG.days + ' Tage – Blatt abreißen'));
      } else {
        what.appendChild(mk('b', null, d.names[0]));
        if (d.names.length > 1) what.appendChild(document.createTextNode(d.names.slice(1).join(', ')));
        inn.appendChild(amp);
        inn.appendChild(document.createTextNode(daysText(d.days)));
      }
      leaf.appendChild(what); leaf.appendChild(inn);
      box.appendChild(leaf);
      return leaf;
    });
    var describe = function (k) {
      var d = data[k], dt = new Date(d.date);
      if (d.today) return 'Blatt ' + (k + 1) + ' von ' + N + ': Heute, ' + DAY_NAMES[dt.getUTCDay()] + ' ' + fmtDate(d.date) + '. Nächste Frist ' + daysText(nextG.days) + '.';
      return 'Blatt ' + (k + 1) + ' von ' + N + ': ' + DAY_NAMES[dt.getUTCDay()] + ', ' + fmtDate(d.date) + ' – ' + d.names.join(', ') + ', ' + daysText(d.days) + '.';
    };
    var idx = 0;
    var ui = function (announce) {
      count.textContent = 'Blatt ' + (idx + 1) + ' von ' + N;
      prev.disabled = idx === 0;
      next.disabled = idx >= N - 1;
      if (announce && live) live.textContent = describe(idx);
    };

    /* Variante 1: Knopf / Klassen (Handy, reduzierte Bewegung) */
    var stepTo = function (k, announce) {
      idx = clamp(k, 0, N - 1);
      leaves.forEach(function (l, i) { l.classList.toggle('is-torn', i < idx); });
      ui(announce);
    };
    /* Variante 2: Scroll-Bindung (Desktop) */
    var st = null;
    var paint = function (P) {
      var f = P * (N - 1);
      leaves.forEach(function (l, i) {
        if (i === N - 1) return;
        var p = clamp(f - i, 0, 1);
        var a = Math.min(1, p / 0.35), b = Math.max(0, (p - 0.35) / 0.65);
        if (p <= 0) { l.style.transform = ''; l.style.opacity = ''; return; }
        l.style.transform = 'translate3d(' + (-7 * b).toFixed(2) + '%,' + (125 * b * b).toFixed(2) + '%,0) rotate(' + (-15 * b).toFixed(2) + 'deg) rotateX(' + (22 * a - 8 * b).toFixed(2) + 'deg)';
        l.style.opacity = (1 - Math.max(0, (b - 0.55) / 0.45)).toFixed(3);
      });
      var k = clamp(Math.floor(f + 0.35), 0, N - 1);
      if (k !== idx) { idx = k; ui(false); }
    };
    prev.addEventListener('click', function () {
      if (st) { scrollToY(st.start + (st.end - st.start) * Math.max(0, idx - 1) / (N - 1)); if (live) live.textContent = describe(Math.max(0, idx - 1)); }
      else stepTo(idx - 1, true);
    });
    next.addEventListener('click', function () {
      if (st) { scrollToY(st.start + (st.end - st.start) * Math.min(N - 1, idx + 1) / (N - 1) + 2); if (live) live.textContent = describe(Math.min(N - 1, idx + 1)); }
      else stepTo(idx + 1, true);
    });
    ui(false);

    if (motionOk && hasGSAP) {
      var mm = gsap.matchMedia();
      mm.add('(min-width: 900px)', function () {
        wrap.classList.add('is-sticky');
        wrap.style.setProperty('--leaves', N - 1);
        pad.classList.add('is-scrub');
        leaves.forEach(function (l) { l.classList.remove('is-torn'); });
        st = ScrollTrigger.create({
          trigger: wrap,
          start: function () { return 'top ' + headerOffset() + 'px'; },
          end: 'bottom bottom',
          invalidateOnRefresh: true,
          onUpdate: function (self) { paint(self.progress); }
        });
        paint(st.progress);
        return function () {
          st.kill(); st = null;
          wrap.classList.remove('is-sticky'); pad.classList.remove('is-scrub');
          leaves.forEach(function (l) { l.style.transform = ''; l.style.opacity = ''; });
          stepTo(0, false);
        };
      });
      mm.add('(max-width: 899px)', function () {
        if (!('IntersectionObserver' in window)) return;
        var io = new IntersectionObserver(function (en) {
          if (!en[0].isIntersecting) return;
          io.disconnect();
          setTimeout(function () { if (idx === 0) stepTo(1, false); }, 900);
        }, { threshold: 0.6 });
        io.observe(pad);
        return function () { io.disconnect(); };
      });
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
     Start in Etappen
     ------------------------------------------------------------------ */
  /* Sofort: alles, was den ersten Bildschirm betrifft (und Layout, das später nicht springen darf) */
  safe('scroll', initScroll);
  safe('header', initHeader);
  safe('roll', initRoll);
  safe('menu', initMenu);
  safe('hero', initHero);
  safe('flowLayout', flowLayout);
  safe('wegweiser', initWegweiser);
  safe('actionbar', initActionbar);

  /* Danach in kleinen Häppchen (je max. ~20 ms), damit der Hauptthread nicht lange blockiert.
     Fristen zuerst – sie füllen die „nächste Steuerfrist“ in der Kontenzeile. */
  var later = [['reveal', initReveal], ['magnet', initMagnet], ['fristen', initFristen], ['flow', initFlow], ['ledger', initLedger],
    ['checklist', initChecklist], ['binder', initBinder], ['parallax', initParallax], ['open', initOpenStatus], ['form', initForm], ['map', initMap]];
  var laterDone = false, loaded = document.readyState === 'complete', afterBoot = [];
  var whenBooted = function (fn) { if (laterDone && loaded) fn(); else afterBoot.push(fn); };
  var flushBoot = function () { if (laterDone && loaded) { var q = afterBoot; afterBoot = []; q.forEach(function (fn) { fn(); }); } };
  var idle = window.requestIdleCallback ? function (fn) { window.requestIdleCallback(fn, { timeout: 120 }); } : function (fn) { setTimeout(fn, 0); };
  var step = function () {
    var t0 = Date.now();
    while (later.length && Date.now() - t0 < 20) { var job = later.shift(); safe(job[0], job[1]); }
    if (later.length) idle(step); else { laterDone = true; flushBoot(); }
  };
  setTimeout(step, 0);
  window.addEventListener('load', function () { loaded = true; flushBoot(); });

  if (hasGSAP) {
    var refresh = function () { ScrollTrigger.refresh(); };
    whenBooted(refresh);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (laterDone && loaded) refresh(); });
  }
  /* bei Rücknavigation an Anker: Position nach Aufbau korrigieren */
  if (location.hash && location.hash.length > 1) {
    var t = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (t) whenBooted(function () { setTimeout(function () { scrollToTarget(t, { focusEl: t }); }, 60); });
  }
})();
