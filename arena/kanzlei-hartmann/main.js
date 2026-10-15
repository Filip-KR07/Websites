/* ==========================================================================
   Hartmann Rechtsanwälte · Modell „Paragraf“ · main.js
   Ohne Build-Schritt. Optional: GSAP 3.13 + ScrollTrigger, Lenis 1.3.
   Alles funktioniert auch ohne diese Bibliotheken und ohne Animation.
   ========================================================================== */
(function () {
  'use strict';

  /* ===== Konstanten (hier anpassen) ===================================== */

  // Öffnungszeiten (Europe/Berlin): Wochentage 1–5 = Mo–Fr, Minuten ab Mitternacht.
  var OPENING = { days: [1, 2, 3, 4, 5], open: 8 * 60 + 30, close: 18 * 60, tz: 'Europe/Berlin' };

  // Fristen-Hinweis: Regeln als Orientierung (keine Rechtsberatung).
  //   weeks     → Ende = Zugang + n Wochen (gleicher Wochentag, § 188 Abs. 2 BGB)
  //   monthsEnd → Ende = letzter Tag des n-ten Kalendermonats nach Zugang
  //   none      → keine feste Frist; Darstellung der Monate seit Datum
  // Fällt das Ende auf Sa/So/Feiertag (Bayern), verschiebt es sich auf den nächsten Werktag.
  var FRISTEN = {
    kuendigung: {
      area: 'arbeit', rule: { type: 'weeks', n: 3 },
      dateLabel: 'Kündigung erhalten am',
      help: 'Zugang ist in der Regel der Tag, an dem das Schreiben in Ihrem Briefkasten lag.',
      title: 'Kündigungsschutzklage', norm: '§ 4 KSchG',
      text: 'Wer sich gegen eine Kündigung wehren will, muss in der Regel innerhalb von drei Wochen nach Zugang Klage beim Arbeitsgericht erheben. Danach gilt die Kündigung meist als wirksam – selbst wenn sie es eigentlich nicht wäre.',
      extra: 'Zusätzlich: Bei der Agentur für Arbeit arbeitsuchend melden – oft innerhalb von drei Tagen nach Kenntnis (§ 38 SGB III).',
      cta: 'Dringende Erstberatung anfragen'
    },
    bussgeld: {
      area: 'verkehr', rule: { type: 'weeks', n: 2 },
      dateLabel: 'Zugestellt am',
      help: 'Maßgeblich ist das Zustelldatum – es steht auf dem gelben Umschlag. Heben Sie ihn auf.',
      title: 'Einspruch gegen den Bußgeldbescheid', norm: '§ 67 OWiG',
      text: 'Gegen einen Bußgeldbescheid kann innerhalb von zwei Wochen nach Zustellung Einspruch eingelegt werden. Danach wird der Bescheid rechtskräftig – samt Punkten und einem möglichen Fahrverbot.',
      extra: 'Ob sich ein Einspruch lohnt, zeigt oft erst die Akteneinsicht: Messverfahren, Eichung, Formalien.',
      cta: 'Dringende Erstberatung anfragen'
    },
    mieterhoehung: {
      area: 'miete', rule: { type: 'monthsEnd', n: 2 },
      dateLabel: 'Schreiben erhalten am',
      help: 'Gemeint ist ein Mieterhöhungsverlangen bis zur ortsüblichen Vergleichsmiete.',
      title: 'Überlegungsfrist für Ihre Zustimmung', norm: '§ 558b BGB',
      text: 'Sie haben bis zum Ende des zweiten Kalendermonats nach Zugang Zeit, das Verlangen zu prüfen und zuzustimmen. Stimmen Sie bis dahin nicht zu, kann der Vermieter auf Zustimmung klagen.',
      extra: 'Nutzen Sie die Zeit: Begründung, Mietspiegel und Kappungsgrenze lassen sich in Ruhe prüfen.',
      cta: 'Erstberatung zum Mietrecht anfragen'
    },
    nebenkosten: {
      area: 'miete', rule: { type: 'monthsEnd', n: 12 },
      dateLabel: 'Abrechnung erhalten am',
      help: 'Gemeint ist die Betriebskostenabrechnung Ihres Vermieters.',
      title: 'Einwendungen gegen die Abrechnung', norm: '§ 556 Abs. 3 BGB',
      text: 'Einwendungen gegen eine Betriebskostenabrechnung müssen Mieter spätestens bis zum Ablauf des zwölften Monats nach Zugang mitteilen. Später sind sie in der Regel ausgeschlossen.',
      extra: 'Sie können beim Vermieter Einsicht in die Belege verlangen – das hilft bei der Prüfung.',
      cta: 'Erstberatung zum Mietrecht anfragen'
    },
    unterhalt: {
      area: 'familie', rule: { type: 'none' },
      dateLabel: 'Getrennt seit',
      help: 'Ungefähres Datum genügt. Gezählt werden die Monate bis heute.',
      title: 'Unterhalt rückwirkend erst ab Aufforderung', norm: '§ 1613 BGB',
      text: 'Für den Unterhalt gibt es keine kurze Klagefrist. Aber: Für die Vergangenheit kann Unterhalt in der Regel erst ab dem Monat verlangt werden, in dem der andere zur Auskunft aufgefordert oder in Verzug gesetzt wurde.',
      extra: 'Warten Sie deshalb nicht ab – eine schriftliche Aufforderung sichert Ihre Ansprüche ab diesem Monat.',
      cta: 'Erstberatung zum Familienrecht anfragen'
    }
  };

  // Erstberatungs-Formular
  var FORM = { minChars: 40, maxChars: 800 };

  // Hero-Linienstich (Canvas): Linienabstand, Reliefhöhe, Wellenamplitude (CSS-px)
  var ENGRAVE = { spacing: 6.5, spacingMobile: 6, relief: 15, wave: 0.8, mouseRadius: 110, mouseLift: 12, ink: 'rgba(18,18,18,.34)', accent: '#6E1E2B', paper: '#FCFAF6' };

  // § aus Spectral SemiBold (y-Achse nach oben, Einheiten 1/1000 em)
  var PARA_D = 'M310 670Q348 670 378.5 659.5Q409 649 427.0 633.5Q445 618 445 603Q445 595 436 585L396 539L296 626Q251 625 221.0 599.5Q191 574 191 540Q191 518 202.5 500.5Q214 483 245.0 468.5Q276 454 334 440Q422 418 454.5 383.0Q487 348 487 296Q487 246 459.0 209.5Q431 173 379 152Q404 133 414.5 107.5Q425 82 425 49Q425 3 394.5 -35.5Q364 -74 314.5 -97.5Q265 -121 210 -121Q172 -121 140.0 -110.0Q108 -99 88.5 -83.0Q69 -67 69 -51Q69 -42 79 -32L119 14L222 -79Q270 -78 301.5 -53.5Q333 -29 333 4Q333 28 321.5 46.5Q310 65 279.0 80.5Q248 96 189 111Q100 132 65.5 169.5Q31 207 31 261Q31 310 60.0 345.5Q89 381 138 401Q117 419 108.0 443.5Q99 468 99 499Q99 547 128.5 586.0Q158 625 206.0 647.5Q254 670 310 670ZM268 198Q308 189 336 177Q362 184 380.0 203.0Q398 222 398 248Q398 272 386.5 290.5Q375 309 344.0 323.5Q313 338 255 350Q205 361 172 378Q147 367 135.5 348.5Q124 330 124 305Q124 280 135.5 261.0Q147 242 178.0 226.5Q209 211 268 198Z';

  /* ===== Grundlagen ===================================================== */
  var d = document, root = d.documentElement;
  var holCache = {};
  var ANIM = root.classList.contains('anim');
  var STATIC = !ANIM; // reduced motion oder ?motion=off
  window.__hartmannReady = true;

  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function isMobile() { return window.matchMedia('(max-width: 899.98px)').matches; }
  function finePointer() { return window.matchMedia('(hover: hover) and (pointer: fine)').matches; }
  function headH() { var h = $('.site-head'); return h ? h.offsetHeight : 70; }
  // ScrollTrigger.refresh misst die ganze Seite neu (teuer) – Aufrufe bündeln
  var refreshT = 0;
  function softRefresh(ms) {
    if (!window.ScrollTrigger) return;
    clearTimeout(refreshT);
    refreshT = setTimeout(function () { window.ScrollTrigger.refresh(); }, ms == null ? 300 : ms);
  }

  /* ===== Smooth Scroll + ScrollTrigger ================================== */
  var lenis = null;
  var hasGsap = !!(window.gsap && window.ScrollTrigger);
  if (hasGsap) window.gsap.registerPlugin(window.ScrollTrigger);

  if (ANIM && window.Lenis) {
    try {
      lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1, anchors: false });
      window.__lenis = lenis;
      if (hasGsap) {
        lenis.on('scroll', window.ScrollTrigger.update);
        window.gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
        window.gsap.ticker.lagSmoothing(0);
      } else {
        var lraf = function (t) { lenis.raf(t); requestAnimationFrame(lraf); };
        requestAnimationFrame(lraf);
      }
    } catch (e) { lenis = null; }
  }

  function scrollToEl(el, immediate) {
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: -(headH() + 8), immediate: !!immediate, duration: immediate ? 0 : 1.2 });
    else {
      var y = el.getBoundingClientRect().top + window.pageYOffset - headH() - 8;
      window.scrollTo({ top: y, behavior: STATIC || immediate ? 'auto' : 'smooth' });
    }
  }

  /* ===== Scroll-Zustand: Header, Lesebändchen, Zeitstrahl ================ */
  var head = $('.site-head');
  var ribbon = $('[data-ribbon]');
  var scrollHandlers = [];
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var y = window.pageYOffset;
      for (var i = 0; i < scrollHandlers.length; i++) scrollHandlers[i](y);
    });
  }
  if (lenis) lenis.on('scroll', onScroll);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  // Maße fürs Lesebändchen nur bei Größenänderung messen – nicht in jedem Scroll-Frame (kein Layout-Lesen pro Frame)
  var rib = { max: 1, box: 0, stub: 30 }, scrolled = null, lastRib = '';
  function measureRibbon() {
    rib.max = Math.max(1, d.documentElement.scrollHeight - window.innerHeight);
    rib.box = ribbon ? ribbon.parentNode.offsetHeight : 0;
    rib.stub = isMobile() ? 20 : 30;
  }
  measureRibbon();
  window.addEventListener('resize', measureRibbon);
  if ('ResizeObserver' in window) new ResizeObserver(function () { measureRibbon(); onScroll(); }).observe(d.body);
  scrollHandlers.push(function (y) {
    var sc = y > 8;
    if (head && sc !== scrolled) { scrolled = sc; head.classList.toggle('is-scrolled', sc); }
    if (ribbon) {
      var p = clamp(y / rib.max, 0, 1);
      var tf = 'translate3d(0,' + (-(1 - p) * (rib.box - rib.stub)).toFixed(1) + 'px,0)';
      if (tf !== lastRib) { lastRib = tf; ribbon.style.transform = tf; }
    }
  });

  /* ===== Kolumnentitel + aktive Navigation =============================== */
  (function runningHead() {
    var out = $('[data-runhead]');
    var navLinks = $$('.nav a');
    var secs = $$('[data-head-title]');
    if (!('IntersectionObserver' in window) || !secs.length) return;
    var current = null;
    function setHead(sec) {
      if (sec === current) return;
      current = sec;
      var num = sec.getAttribute('data-head-num');
      var txt = (num ? num + ' · ' : '') + sec.getAttribute('data-head-title');
      if (out) {
        if (STATIC) out.textContent = txt;
        else {
          out.classList.add('is-swap');
          setTimeout(function () { out.textContent = txt; out.classList.remove('is-swap'); }, 170);
        }
      }
      navLinks.forEach(function (a) {
        if (a.getAttribute('href') === '#' + sec.id) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) setHead(e.target); });
    }, { rootMargin: '-42% 0px -56% 0px' });
    secs.forEach(function (s) { io.observe(s); });
  })();

  /* ===== Menü (Inhaltsübersicht als Dialog) ============================== */
  var menu = $('#menu');
  (function menuDialog() {
    var openBtn = $('[data-menu-open]');
    if (!menu || !openBtn || typeof menu.showModal !== 'function') {
      if (openBtn) openBtn.addEventListener('click', function () { var t = $('#rechtsgebiete'); scrollToEl(t); });
      return;
    }
    $$('.toc li', menu).forEach(function (li, i) { li.style.setProperty('--i', i); });
    var closing = false;
    function open() {
      menu.showModal();
      d.body.style.overflow = 'hidden';
      if (lenis) lenis.stop();
      requestAnimationFrame(function () { requestAnimationFrame(function () { menu.classList.add('is-open'); }); });
    }
    function close(after) {
      if (closing || !menu.open) return;
      closing = true;
      menu.classList.remove('is-open');
      setTimeout(function () {
        menu.close();
        closing = false;
        d.body.style.overflow = '';
        if (lenis) lenis.start();
        if (after) after();
      }, ANIM ? 200 : 0);
    }
    openBtn.addEventListener('click', open);
    menu.addEventListener('cancel', function (e) { e.preventDefault(); close(); });
    $('[data-menu-close]', menu).addEventListener('click', function () { close(); });
    menu.addEventListener('click', function (e) {
      if (e.target === menu) { close(); return; }
      var a = e.target.closest('a[href^="#"]');
      if (a) {
        e.preventDefault();
        var t = d.getElementById(a.getAttribute('href').slice(1));
        close(function () { goTo(t, a.getAttribute('href')); });
      }
    });
    window.__closeMenu = close;
  })();

  /* ===== Anker-Links ===================================================== */
  function goTo(t, hash) {
    if (!t) return;
    scrollToEl(t);
    if (hash && history.pushState) history.pushState(null, '', hash);
    var focusTarget = t;
    if (!focusTarget.hasAttribute('tabindex') && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(focusTarget.tagName)) focusTarget.setAttribute('tabindex', '-1');
    setTimeout(function () { try { focusTarget.focus({ preventScroll: true }); } catch (e) { } }, STATIC ? 0 : 600);
  }
  d.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    if (menu && menu.contains(a)) return;
    var id = a.getAttribute('href').slice(1);
    if (!id) return;
    var t = d.getElementById(id);
    if (!t) return;
    e.preventDefault();
    if (a.hasAttribute('data-prefill-area')) prefill(a.getAttribute('data-prefill-area'), a.hasAttribute('data-prefill-urgent'));
    if (id === 'inhalt') { goTo(t); return; }
    goTo(t, '#' + id);
  });

  /* ===== Öffnungszeiten ================================================== */
  (function openState() {
    var out = $('[data-open-now]');
    var rows = $$('[data-hours] [data-day]');
    var now;
    try {
      var parts = new Intl.DateTimeFormat('en-GB', { timeZone: OPENING.tz, weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
      var get = function (t) { var p = parts.filter(function (x) { return x.type === t; })[0]; return p ? p.value : ''; };
      var wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
      now = { wd: wd, min: (+get('hour') % 24) * 60 + (+get('minute')), date: new Date(+get('year'), +get('month') - 1, +get('day'), 12) };
    } catch (e) {
      var n = new Date(); now = { wd: n.getDay(), min: n.getHours() * 60 + n.getMinutes(), date: new Date(n.getFullYear(), n.getMonth(), n.getDate(), 12) };
    }
    rows.forEach(function (r) { if (+r.getAttribute('data-day') === now.wd) r.classList.add('is-today'); });
    if (!out) return;
    var hol = holidayName(now.date);
    var workday = OPENING.days.indexOf(now.wd) > -1 && !hol;
    var openNow = workday && now.min >= OPENING.open && now.min < OPENING.close;
    var txt;
    if (openNow) txt = 'Jetzt erreichbar – heute bis 18:00 Uhr';
    else if (workday && now.min < OPENING.open) txt = 'Geschlossen – heute ab 8:30 Uhr erreichbar';
    else if (hol) txt = 'Heute geschlossen (' + hol + ')';
    else {
      var next = now.wd >= 5 || now.wd === 0 ? 'Montag' : 'morgen';
      txt = 'Geschlossen – wieder ' + next + ' ab 8:30 Uhr';
    }
    out.textContent = txt;
    out.classList.toggle('is-open', openNow);
  })();

  /* ===== Datum & Feiertage (Bayern, ohne Mariä Himmelfahrt) ============= */
  function noon(y, m, dd) { return new Date(y, m, dd, 12, 0, 0, 0); }
  function addDays(dt, n) { return noon(dt.getFullYear(), dt.getMonth(), dt.getDate() + n); }
  function key(dt) { return dt.getFullYear() + '-' + (dt.getMonth() + 1) + '-' + dt.getDate(); }
  function easter(y) {
    var a = y % 19, b = Math.floor(y / 100), c = y % 100, dd = Math.floor(b / 4), e = b % 4,
      f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - dd - g + 15) % 30,
      i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451),
      month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
    return noon(y, month - 1, day);
  }
  function holidays(y) {
    if (holCache[y]) return holCache[y];
    var e = easter(y), map = {};
    function add(dt, name) { map[key(dt)] = name; }
    add(noon(y, 0, 1), 'Neujahr');
    add(noon(y, 0, 6), 'Heilige Drei Könige');
    add(addDays(e, -2), 'Karfreitag');
    add(addDays(e, 1), 'Ostermontag');
    add(noon(y, 4, 1), 'Tag der Arbeit');
    add(addDays(e, 39), 'Christi Himmelfahrt');
    add(addDays(e, 50), 'Pfingstmontag');
    add(addDays(e, 60), 'Fronleichnam');
    add(noon(y, 9, 3), 'Tag der Deutschen Einheit');
    add(noon(y, 10, 1), 'Allerheiligen');
    add(noon(y, 11, 25), '1. Weihnachtstag');
    add(noon(y, 11, 26), '2. Weihnachtstag');
    holCache[y] = map;
    return map;
  }
  function holidayName(dt) { return holidays(dt.getFullYear())[key(dt)] || ''; }
  function isWorkday(dt) { var w = dt.getDay(); return w !== 0 && w !== 6 && !holidayName(dt); }
  function sameDay(a, b) { return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
  function today() { var n = new Date(); return noon(n.getFullYear(), n.getMonth(), n.getDate()); }
  function toISO(dt) { return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0'); }
  function fromISO(s) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); return m ? noon(+m[1], +m[2] - 1, +m[3]) : null; }
  var fmtLong = new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  var fmtMid = new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: 'numeric', month: 'long' });
  var fmtMonth = new Intl.DateTimeFormat('de-DE', { month: 'short' });
  var fmtMonthLong = new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' });
  function dayDiff(a, b) { return Math.round((b - a) / 864e5); }

  /* ===== Fristen-Hinweis ================================================= */
  var deadlineState = { type: 'kuendigung', date: null };
  (function deadline() {
    var box = $('[data-deadline]');
    if (!box) return;
    var input = $('[data-dl-date]', box);
    var label = $('[data-dl-date-label]', box);
    var help = $('[data-dl-help]', box);
    var res = $('[data-dl-result]', box);
    var kicker = $('[data-dl-kicker]', box);
    var endEl = $('[data-dl-end]', box);
    var leftEl = $('[data-dl-left]', box);
    var shiftEl = $('[data-dl-shift]', box);
    var cal = $('[data-dl-cal]', box);
    var titleEl = $('[data-dl-title]', box);
    var normEl = $('[data-dl-norm]', box);
    var textEl = $('[data-dl-text]', box);
    var extraEl = $('[data-dl-extra]', box);
    var cta = $('[data-dl-cta]', box);
    var t0 = today();
    input.value = toISO(t0);
    input.max = toISO(t0);
    input.min = toISO(addDays(t0, -730));
    var first = true;

    function compute(rule, start) {
      var raw;
      if (rule.type === 'weeks') raw = addDays(start, rule.n * 7);
      else raw = noon(start.getFullYear(), start.getMonth() + rule.n + 1, 0);
      var end = raw, reasons = [];
      while (!isWorkday(end)) {
        reasons.push(holidayName(end) || (end.getDay() === 6 ? 'Samstag' : 'Sonntag'));
        end = addDays(end, 1);
      }
      return { raw: raw, end: end, shifted: !sameDay(raw, end), reason: reasons[0] };
    }

    function cell(cls, html, n) {
      var c = d.createElement('div');
      c.className = cls;
      c.style.setProperty('--n', n);
      if (html.m) { var m = d.createElement('span'); m.className = 'm'; m.textContent = html.m; c.appendChild(m); }
      c.appendChild(d.createTextNode(html.t));
      return c;
    }

    function renderWeeks(start, end) {
      var wrap = d.createElement('div'); wrap.className = 'cal';
      var headEl = d.createElement('p'); headEl.className = 'cal-head';
      var s = d.createElement('strong');
      s.textContent = start.getMonth() === end.getMonth() ? fmtMonthLong.format(start) : fmtMonth.format(start).replace('.', '') + ' – ' + fmtMonthLong.format(end);
      var dur = d.createElement('span'); dur.textContent = dayDiff(start, end) + ' Tage';
      headEl.appendChild(s); headEl.appendChild(dur); wrap.appendChild(headEl);
      var grid = d.createElement('div'); grid.className = 'cal-grid';
      ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].forEach(function (w) { var x = d.createElement('div'); x.className = 'cal-wd'; x.textContent = w; grid.appendChild(x); });
      var gs = addDays(start, -((start.getDay() + 6) % 7));
      var ge = addDays(end, 6 - ((end.getDay() + 6) % 7));
      var td = today(), n = 0;
      for (var dt = gs; dt <= ge; dt = addDays(dt, 1)) {
        var cls = 'cal-d';
        if (dt > start && dt <= end) cls += ' in';
        if (sameDay(dt, start)) cls += ' start';
        if (sameDay(dt, end)) cls += ' end';
        if (dt.getDay() === 0 || dt.getDay() === 6) cls += ' we';
        if (holidayName(dt)) cls += ' hol';
        if (sameDay(dt, td)) cls += ' today';
        var showM = dt.getDate() === 1 || sameDay(dt, gs);
        grid.appendChild(cell(cls, { t: dt.getDate(), m: showM ? fmtMonth.format(dt).replace('.', '') : '' }, n++));
      }
      wrap.appendChild(grid);
      var lg = d.createElement('ul'); lg.className = 'cal-legend';
      [['k-start', 'Zugang'], ['k-in', 'Frist läuft'], ['k-end', 'rechnerisches Ende'], ['k-hol', 'Feiertag']].forEach(function (x) {
        var li = d.createElement('li'); var i = d.createElement('i'); i.className = x[0]; li.appendChild(i); li.appendChild(d.createTextNode(x[1])); lg.appendChild(li);
      });
      wrap.appendChild(lg);
      return wrap;
    }

    function renderMonths(start, end, mode) {
      var wrap = d.createElement('div'); wrap.className = 'cal';
      var headEl = d.createElement('p'); headEl.className = 'cal-head';
      var s = d.createElement('strong');
      var info = d.createElement('span');
      var grid = d.createElement('div'); grid.className = 'months';
      var cur = noon(start.getFullYear(), start.getMonth(), 1), last = noon(end.getFullYear(), end.getMonth(), 1), n = 0;
      var count = 0;
      while (cur <= last && count < 30) {
        var mo = d.createElement('div');
        var cls = 'mo';
        var label = fmtMonth.format(cur).replace('.', '');
        var sub = String(cur.getFullYear());
        var isFirst = cur.getFullYear() === start.getFullYear() && cur.getMonth() === start.getMonth();
        var isLast = cur.getFullYear() === last.getFullYear() && cur.getMonth() === last.getMonth();
        if (mode === 'lost') {
          if (isLast) { cls += ' now'; sub = 'ab jetzt'; }
          else { cls += ' lost'; }
        } else {
          if (isFirst) { cls += ' start'; sub = 'Zugang ' + start.getDate() + '.'; }
          if (isLast) { cls += ' end'; sub = 'bis ' + end.getDate() + '.'; }
        }
        mo.className = cls; mo.style.setProperty('--n', n++);
        var a = d.createElement('span'); a.textContent = label;
        var b = d.createElement('small'); b.textContent = sub;
        mo.appendChild(a); mo.appendChild(b); grid.appendChild(mo);
        cur = noon(cur.getFullYear(), cur.getMonth() + 1, 1); count++;
      }
      if (mode === 'lost') { s.textContent = 'Monate seit der Trennung'; info.textContent = 'schraffiert: ohne Aufforderung meist verloren'; }
      else { s.textContent = fmtMonthLong.format(start) + ' – ' + fmtMonthLong.format(end); info.textContent = count + ' Kalendermonate'; }
      headEl.appendChild(s); headEl.appendChild(info);
      wrap.appendChild(headEl); wrap.appendChild(grid);
      return wrap;
    }

    function update(fromType) {
      var type = (($('input[name="dl-type"]:checked', box) || {}).value) || 'kuendigung';
      var cfg = FRISTEN[type];
      deadlineState.type = type;
      var start = fromISO(input.value);
      deadlineState.date = start;
      if (fromType) {
        label.textContent = cfg.dateLabel;
        help.textContent = cfg.help;
        titleEl.textContent = cfg.title;
        normEl.textContent = cfg.norm.replace(/ /g, ' ');
        textEl.textContent = cfg.text;
        extraEl.textContent = cfg.extra.replace(/§ /g, '§ ');
        cta.firstChild.nodeValue = cfg.cta;
        cta.setAttribute('data-prefill-area', cfg.area);
      }
      var td = today();
      cal.textContent = '';
      shiftEl.hidden = true;
      leftEl.classList.remove('is-past');
      if (!start) {
        kicker.textContent = 'Bitte ein Datum wählen';
        endEl.textContent = '–'; leftEl.textContent = '';
        return;
      }
      var view;
      if (cfg.rule.type === 'none') {
        var months = Math.max(0, (td.getFullYear() - start.getFullYear()) * 12 + td.getMonth() - start.getMonth());
        kicker.textContent = 'Seit der Trennung · Orientierung';
        if (start > td) { endEl.textContent = 'Datum liegt in der Zukunft'; leftEl.textContent = 'Bitte prüfen Sie die Eingabe'; return; }
        endEl.textContent = months === 0 ? 'Noch kein Monat verloren' : months + (months === 1 ? ' Monat' : ' Monate') + ' ohne Aufforderung?';
        leftEl.textContent = months === 0 ? 'Jetzt schriftlich auffordern' : 'Für diese Zeit meist nicht nachforderbar';
        if (months > 0) leftEl.classList.add('is-past');
        shiftEl.hidden = false;
        shiftEl.textContent = 'Gilt nur, wenn Sie bisher nicht schriftlich zur Auskunft aufgefordert haben. Unterhalt ab dem laufenden Monat lässt sich mit einer Aufforderung jetzt noch sichern.';
        view = renderMonths(noon(start.getFullYear(), start.getMonth(), 1), td, 'lost');
      } else {
        var r = compute(cfg.rule, start);
        kicker.textContent = 'Rechnerisches Fristende · Orientierung';
        endEl.textContent = fmtLong.format(r.end).replace(/(\d+\.) /, '$1\u00A0'); // „4. November“ bleibt zusammen
        var left = dayDiff(td, r.end);
        if (start > td) { leftEl.textContent = 'Das Datum liegt in der Zukunft – bitte prüfen'; }
        else if (left > 1) leftEl.textContent = 'noch ' + left + ' Tage';
        else if (left === 1) leftEl.textContent = 'noch 1 Tag – bitte heute handeln';
        else if (left === 0) leftEl.textContent = 'heute – bitte sofort anrufen';
        else { leftEl.textContent = 'rechnerisch seit ' + Math.abs(left) + (Math.abs(left) === 1 ? ' Tag' : ' Tagen') + ' abgelaufen'; leftEl.classList.add('is-past'); }
        var notes = [];
        if (r.shifted) notes.push('Das Ende fiele auf ' + fmtMid.format(r.raw) + ' (' + r.reason + ') und verschiebt sich deshalb auf den nächsten Werktag.');
        if (left < 0 && start <= td) notes.push('In Ausnahmefällen gibt es noch Wege – rufen Sie uns bitte sofort an.');
        else if (left >= 0 && left <= 5 && start <= td) notes.push('Das ist knapp. Rufen Sie uns bitte heute noch an.');
        if (notes.length) { shiftEl.hidden = false; shiftEl.textContent = notes.join(' '); }
        view = cfg.rule.type === 'weeks' ? renderWeeks(start, r.end) : renderMonths(start, r.end, 'range');
      }
      if (ANIM && first) view.classList.add('is-fresh');
      cal.appendChild(view);
      if (ANIM && !first) { res.classList.remove('is-update'); void res.offsetWidth; res.classList.add('is-update'); }
    }

    $$('input[name="dl-type"]', box).forEach(function (r) { r.addEventListener('change', function () { first = true; update(true); first = false; }); });
    input.addEventListener('change', function () { update(false); });
    input.addEventListener('input', function () { update(false); });
    update(true);
    // Erste Darstellung ohne Stagger, damit beim Scrollen nichts nachflackert
    first = false;
  })();

  /* ===== Rechtsgebiete-Explorer ========================================== */
  (function explorer() {
    var wrap = $('[data-explorer]');
    if (!wrap) return;
    var tabs = $$('.ex-tab', wrap);
    var panels = tabs.map(function (t) { return d.getElementById(t.getAttribute('aria-controls')); });
    var ind = $('[data-ex-ind]', wrap);
    var cur = 0;
    function placeInd() {
      if (!ind) return;
      var t = tabs[cur];
      ind.style.height = t.offsetHeight + 'px';
      ind.style.transform = 'translateY(' + t.offsetTop + 'px)';
    }
    function animatePanel(p) {
      if (!ANIM || !p.animate) return;
      var items = $$('.ex-head, .case-list li, .todo-list li, .ex-note, .lawyer-mini, .ex-side .btn', p);
      items.forEach(function (el, i) {
        el.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 280, delay: Math.min(i, 14) * 32, easing: 'cubic-bezier(0.23, 1, 0.32, 1)', fill: 'backwards' });
      });
      var img = $('.frame-img', p);
      if (img) img.animate([{ clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0 0)' }], { duration: 620, easing: 'cubic-bezier(0.77, 0, 0.175, 1)', fill: 'backwards' });
    }
    function select(i, opts) {
      opts = opts || {};
      i = (i + tabs.length) % tabs.length;
      tabs.forEach(function (t, k) {
        var on = k === i;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        panels[k].hidden = !on;
      });
      var changed = i !== cur;
      cur = i;
      placeInd();
      if (opts.focus) tabs[i].focus();
      // Pfeiltasten (häufig, schnell hintereinander): ohne Einblend-Animation – Tastatur-Aktionen sollen sofort wirken
      if (changed && !opts.silent && !opts.focus) animatePanel(panels[i]);
      // Höhe des Panels ändert sich → Trigger darunter neu messen, aber erst nach der Panel-Animation (nicht im Klick)
      if (hasGsap && !opts.silent) softRefresh(420);
    }
    tabs.forEach(function (t, k) {
      t.addEventListener('click', function () { select(k); });
      t.addEventListener('keydown', function (e) {
        var k2 = null;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') k2 = cur + 1;
        else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') k2 = cur - 1;
        else if (e.key === 'Home') k2 = 0;
        else if (e.key === 'End') k2 = tabs.length - 1;
        if (k2 === null) return;
        e.preventDefault();
        select(k2, { focus: true });
      });
    });
    var initial = 0;
    var h = location.hash.slice(1);
    panels.forEach(function (p, k) { if (p.id === h) initial = k; });
    select(initial, { silent: true });
    window.addEventListener('resize', placeInd);
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(placeInd);
    window.__selectArea = function (area) {
      panels.forEach(function (p, k) { if (p.getAttribute('data-area') === area) select(k); });
    };
  })();

  /* ===== Zeitstrahl (Ablauf) ============================================= */
  (function timeline() {
    var wrap = $('.tl-wrap');
    if (!wrap) return;
    var steps = $$('.tl-step', wrap);
    var fill = $('[data-tl-fill]', wrap);
    var frames = $$('[data-tl-frames] img');
    var count = $('[data-tl-count]');
    var cap = $('[data-tl-cap]');
    var titles = steps.map(function (s) { var h = $('h3', s); return h ? h.textContent : ''; });
    var active = -1, cleanT;
    function setActive(i) {
      if (i === active) return;
      var prev = active;
      active = i;
      steps.forEach(function (s, k) {
        s.classList.toggle('is-active', k === i);
        s.classList.toggle('is-past', k < i);
      });
      if (i < 0) return;
      if (count) count.textContent = String(i + 1);
      if (cap) cap.textContent = titles[i];
      if (frames.length) {
        frames.forEach(function (f, k) {
          f.classList.remove('was-on');
          if (k === prev && prev !== i) f.classList.add('was-on');
          f.classList.toggle('is-on', k === i);
        });
        clearTimeout(cleanT);
        cleanT = setTimeout(function () { frames.forEach(function (f) { f.classList.remove('was-on'); }); }, STATIC ? 0 : 950);
      }
    }
    var near = true;
    function track() {
      var vh = window.innerHeight;
      var r = wrap.getBoundingClientRect();
      var line = vh * 0.55;
      var p = clamp((line - r.top) / Math.max(1, r.height), 0, 1);
      if (fill && ANIM) fill.style.transform = 'scaleY(' + p.toFixed(4) + ')';
      var idx = -1;
      for (var k = 0; k < steps.length; k++) {
        if (steps[k].getBoundingClientRect().top < line) idx = k;
      }
      setActive(Math.max(0, idx));
    }
    scrollHandlers.push(function () { if (near) track(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { near = es[0].isIntersecting; track(); }, { rootMargin: '25% 0px 25% 0px' }).observe(wrap);
    }
    onScroll();
  })();

  /* ===== Einzugsgebiet: Liste ↔ Karte ==================================== */
  (function region() {
    var svg = $('[data-region]');
    var list = $('[data-towns]');
    if (!svg || !list) return;
    function hot(name, on) {
      $$('[data-town="' + name + '"]', svg).forEach(function (g) { g.classList.toggle('is-hot', on); });
      $$('[data-town="' + name + '"]', list).forEach(function (b) { b.classList.toggle('is-hot', on); });
    }
    $$('button[data-town]', list).forEach(function (b) {
      var n = b.getAttribute('data-town');
      ['mouseenter', 'focus'].forEach(function (ev) { b.addEventListener(ev, function () { hot(n, true); }); });
      ['mouseleave', 'blur'].forEach(function (ev) { b.addEventListener(ev, function () { hot(n, false); }); });
      b.addEventListener('click', function () { hot(n, true); });
    });
    $$('.rg-town', svg).forEach(function (g) {
      var n = g.getAttribute('data-town');
      g.addEventListener('mouseenter', function () { hot(n, true); });
      g.addEventListener('mouseleave', function () { hot(n, false); });
    });
  })();

  /* ===== Karte: Ausschnitt auf schmalen Bildschirmen ==================== */
  // Die ganze Altstadt wäre auf ~350 px Breite unlesbar (Schrift ≈ 5 px) – dort zeigt die Karte
  // nur den Weg vom Hauptbahnhof zur Kanzlei. Ohne JavaScript bleibt der vollständige Plan stehen.
  (function mapCrop() {
    var map = $('[data-map]');
    if (!map || !window.matchMedia) return;
    var mq = window.matchMedia('(max-width: 599.98px)');
    var full = map.getAttribute('viewBox');
    function apply() {
      map.setAttribute('viewBox', mq.matches ? '424 150 476 352' : full);
      map.classList.toggle('is-crop', mq.matches);
    }
    apply();
    if (mq.addEventListener) mq.addEventListener('change', apply);
    else if (mq.addListener) mq.addListener(apply);
  })();

  /* ===== Karte: Fußweg zeichnen ========================================= */
  (function mapRoute() {
    var map = $('[data-map]');
    var route = $('[data-map-route]');
    if (!map || !route) return;
    if (STATIC || !('IntersectionObserver' in window)) { map.classList.add('is-in'); return; }
    var ns = 'http://www.w3.org/2000/svg';
    var defs = $('defs', map);
    var mask = d.createElementNS(ns, 'mask');
    mask.setAttribute('id', 'route-mask');
    mask.setAttribute('maskUnits', 'userSpaceOnUse');
    mask.setAttribute('x', '0'); mask.setAttribute('y', '0'); mask.setAttribute('width', '900'); mask.setAttribute('height', '540');
    var mp = d.createElementNS(ns, 'path');
    mp.setAttribute('d', route.getAttribute('d'));
    mp.setAttribute('fill', 'none'); mp.setAttribute('stroke', '#fff'); mp.setAttribute('stroke-width', '8'); mp.setAttribute('stroke-linecap', 'round');
    mask.appendChild(mp); defs.appendChild(mask);
    route.setAttribute('mask', 'url(#route-mask)');
    var len = mp.getTotalLength();
    mp.style.strokeDasharray = len + ' ' + len;
    mp.style.strokeDashoffset = String(len);
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.disconnect();
        map.classList.add('is-in');
        mp.style.transition = 'stroke-dashoffset 1.6s cubic-bezier(0.77, 0, 0.175, 1) .3s';
        mp.style.strokeDashoffset = '0';
      });
    }, { threshold: 0.35 });
    io.observe(map);
  })();

  /* ===== FAQ mit Live-Suche ============================================= */
  (function faq() {
    var wrap = $('[data-faq]');
    if (!wrap) return;
    var input = $('[data-faq-q]', wrap);
    var clearBtn = $('[data-faq-clear]', wrap);
    var countEl = $('[data-faq-count]', wrap);
    var emptyEl = $('[data-faq-empty]', wrap);
    var cats = $$('[data-cat]', $('[data-faq-cats]', wrap));
    var items = $$('.qa', wrap).map(function (el) {
      var q = $('.qa-q', el), a = $('.qa-a', el);
      return {
        el: el, q: q, a: a,
        qOrig: q.cloneNode(true), aOrig: a.cloneNode(true),
        cats: (el.getAttribute('data-cat') || '').split(/\s+/),
        hay: norm(q.textContent + ' ' + a.textContent + ' ' + (el.getAttribute('data-keys') || ''))
      };
    });
    var total = items.length;
    var cat = 'alle';
    var countT;

    function norm(s) {
      return String(s).toLowerCase()
        .replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss')
        .replace(/ae/g, 'a').replace(/oe/g, 'o').replace(/ue/g, 'u')
        .replace(/[^a-z0-9§ ]+/g, ' ');
    }
    function tokenRegex(tok) {
      var out = '';
      for (var i = 0; i < tok.length; i++) {
        var ch = tok[i];
        if (ch === 's' && tok[i + 1] === 's') { out += '(?:ss|ß)'; i++; continue; }
        if (ch === 'a') out += '(?:ae|ä|a)';
        else if (ch === 'o') out += '(?:oe|ö|o)';
        else if (ch === 'u') out += '(?:ue|ü|u)';
        else out += ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      }
      return out;
    }
    function highlight(container, re) {
      var walker = d.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
      var nodes = [], n;
      while ((n = walker.nextNode())) nodes.push(n);
      var hit = false;
      nodes.forEach(function (node) {
        var text = node.nodeValue;
        re.lastIndex = 0;
        if (!re.test(text)) return;
        re.lastIndex = 0;
        var frag = d.createDocumentFragment(), last = 0, m;
        while ((m = re.exec(text))) {
          if (!m[0].length) { re.lastIndex++; continue; }
          if (m.index > last) frag.appendChild(d.createTextNode(text.slice(last, m.index)));
          var mark = d.createElement('mark');
          mark.textContent = m[0];
          frag.appendChild(mark);
          last = m.index + m[0].length;
          hit = true;
        }
        if (last < text.length) frag.appendChild(d.createTextNode(text.slice(last)));
        node.parentNode.replaceChild(frag, node);
      });
      return hit;
    }
    function restore(it) {
      var q = it.qOrig.cloneNode(true), a = it.aOrig.cloneNode(true);
      it.q.parentNode.replaceChild(q, it.q); it.q = q;
      it.a.parentNode.replaceChild(a, it.a); it.a = a;
    }
    function run() {
      var raw = input ? input.value.trim() : '';
      var toks = norm(raw).split(/\s+/).filter(function (t) { return t.length >= 2; });
      var re = toks.length ? new RegExp(toks.map(tokenRegex).sort(function (x, y) { return y.length - x.length; }).join('|'), 'gi') : null;
      var shown = 0;
      items.forEach(function (it) {
        restore(it);
        var catOk = cat === 'alle' || it.cats.indexOf(cat) > -1;
        var textOk = toks.every(function (t) { return it.hay.indexOf(t) > -1; });
        var ok = catOk && textOk;
        it.el.hidden = !ok;
        var hint = $('.qa-hint', it.el);
        if (hint) hint.remove();
        if (ok) {
          shown++;
          if (re) {
            var inQ = highlight(it.q, re);
            highlight(it.a, re);
            if (!inQ) {
              var h = d.createElement('span');
              h.className = 'qa-hint';
              h.textContent = 'Treffer in der Antwort';
              it.q.appendChild(h);
            }
          }
        }
      });
      if (clearBtn) clearBtn.hidden = !raw;
      emptyEl.hidden = shown > 0;
      clearTimeout(countT);
      var msg;
      if (!toks.length && cat === 'alle') msg = total + ' Fragen';
      else if (!shown) msg = 'Keine passende Frage gefunden';
      else {
        var catLabel = cat !== 'alle' ? (cats.filter(function (c) { return c.getAttribute('data-cat') === cat; })[0] || {}).textContent : '';
        msg = shown + ' von ' + total + ' Fragen' + (raw ? ' zu „' + raw + '“' : '') + (catLabel ? ' · ' + catLabel : '');
      }
      countT = setTimeout(function () { countEl.textContent = msg; }, raw ? 220 : 0);
    }
    if (input) {
      input.addEventListener('input', run);
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && input.value) { e.preventDefault(); input.value = ''; run(); }
      });
    }
    if (clearBtn) clearBtn.addEventListener('click', function () { input.value = ''; run(); input.focus(); });
    cats.forEach(function (c) {
      c.addEventListener('click', function () {
        cat = c.getAttribute('data-cat');
        cats.forEach(function (x) { x.setAttribute('aria-pressed', x === c ? 'true' : 'false'); });
        run();
      });
    });
    $$('[data-faq-suggest]', wrap).forEach(function (b) {
      b.addEventListener('click', function () {
        input.value = b.getAttribute('data-faq-suggest');
        cat = 'alle';
        cats.forEach(function (x) { x.setAttribute('aria-pressed', x.getAttribute('data-cat') === 'alle' ? 'true' : 'false'); });
        run(); input.focus();
      });
    });
    // „/“ springt in die Suche
    d.addEventListener('keydown', function (e) {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      var t = e.target;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (menu && menu.open) return;
      e.preventDefault();
      scrollToEl($('#fragen'));
      input.focus({ preventScroll: true });
    });
  })();

  /* ===== Erstberatung: Assistent ======================================== */
  var wizardApi = null;
  (function wizard() {
    var form = $('[data-wizard]');
    if (!form) return;
    var steps = $$('.wz-step', form);
    var nav = $$('[data-steps-nav] li');
    var back = $('[data-wz-back]', form);
    var next = $('[data-wz-next]', form);
    var submit = $('[data-wz-submit]', form);
    var bar = $('[data-wz-bar]', form);
    var status = $('[data-wz-status]', form);
    var done = $('[data-wz-done]');
    var titles = ['Rechtsgebiet', 'Ihr Anliegen', 'Dringlichkeit', 'Kontakt'];
    var cur = 1;
    var ta = $('#f-fall', form);
    var countN = $('[data-count-n]', form);
    var countWrap = $('[data-count]', form);
    var countBar = $('[data-count-bar]', form);
    var fristField = $('[data-frist-field]', form);

    function showStep(n, opts) {
      opts = opts || {};
      var dir = n > cur ? 1 : -1;
      cur = n;
      steps.forEach(function (s) { s.classList.toggle('is-active', +s.getAttribute('data-step') === n); });
      nav.forEach(function (li, k) {
        li.classList.toggle('is-current', k === n - 1);
        li.classList.toggle('is-done', k < n - 1);
      });
      back.hidden = n === 1;
      next.hidden = n === steps.length;
      submit.hidden = n !== steps.length;
      if (bar) bar.style.transform = 'scaleX(' + (n / steps.length) + ')';
      if (status) status.textContent = 'Schritt ' + n + ' von ' + steps.length + ' – ' + titles[n - 1];
      var step = steps[n - 1];
      if (ANIM && !opts.instant && step.animate) {
        step.animate([{ opacity: 0, transform: 'translateX(' + (dir * 14) + 'px)' }, { opacity: 1, transform: 'none' }], { duration: 240, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' });
      }
      if (opts.focus !== false && !opts.instant) {
        var lg = $('.wz-legend', step);
        var r = form.getBoundingClientRect();
        if (r.top < headH() || r.top > window.innerHeight * 0.6) scrollToEl(form);
        setTimeout(function () { try { lg.focus({ preventScroll: true }); } catch (e) { } }, 30);
      }
    }

    function setError(name, msg, field) {
      var el = $('[data-error-for="' + name + '"]', form);
      if (!el) return;
      if (!el.id) el.id = 'err-' + name;
      el.hidden = !msg;
      var fields = field ? [field] : [];
      fields.forEach(function (f) {
        var db = (f.getAttribute('aria-describedby') || '').split(' ').filter(function (x) { return x && x !== el.id; });
        if (msg) { f.setAttribute('aria-invalid', 'true'); db.push(el.id); }
        else f.removeAttribute('aria-invalid');
        if (db.length) f.setAttribute('aria-describedby', db.join(' ')); else f.removeAttribute('aria-describedby');
      });
    }
    function checked(name) { return $('input[name="' + name + '"]:checked', form); }

    function validate(n) {
      var firstBad = null;
      function bad(el) { if (!firstBad) firstBad = el; }
      if (n === 1) {
        var g = checked('gebiet');
        setError('gebiet', g ? '' : 'x');
        if (!g) bad($('input[name="gebiet"]', form));
      }
      if (n === 2) {
        var ok = ta.value.trim().length >= FORM.minChars;
        setError('fall', ok ? '' : 'x', ta);
        if (!ok) bad(ta);
      }
      if (n === 3) {
        var u = checked('dringlichkeit');
        setError('dringlichkeit', u ? '' : 'x');
        if (!u) bad($('input[name="dringlichkeit"]', form));
      }
      if (n === 4) {
        var name = $('#f-name', form), tel = $('#f-tel', form), mail = $('#f-mail', form);
        var nOk = name.value.trim().length >= 2;
        setError('name', nOk ? '' : 'x', name);
        if (!nOk) bad(name);
        var telOk = tel.value.replace(/\D/g, '').length >= 6;
        var mailVal = mail.value.trim();
        var mailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mailVal);
        var cOk = telOk || mailOk;
        if (mailVal && !mailOk && !telOk) cOk = false;
        setError('kontakt', cOk ? '' : 'x');
        [tel, mail].forEach(function (f) { if (cOk) f.removeAttribute('aria-invalid'); else f.setAttribute('aria-invalid', 'true'); });
        if (!cOk) bad(tel.value ? mail : tel);
        var km = $('input[name="kein-mandat"]', form), ds = $('input[name="datenschutz"]', form);
        setError('kein-mandat', km.checked ? '' : 'x', km);
        if (!km.checked) bad(km);
        setError('datenschutz', ds.checked ? '' : 'x', ds);
        if (!ds.checked) bad(ds);
      }
      return firstBad;
    }

    next.addEventListener('click', function () {
      var bad = validate(cur);
      if (bad) { bad.focus(); return; }
      showStep(cur + 1);
    });
    back.addEventListener('click', function () { showStep(cur - 1); });

    // Enter in einzeiligen Feldern = Weiter (nicht absenden)
    form.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'checkbox' && cur < steps.length) {
        e.preventDefault(); next.click();
      }
    });

    // Fehler beim Korrigieren ausblenden
    form.addEventListener('change', function (e) {
      var n = e.target.name;
      if (n === 'gebiet') setError('gebiet', '');
      if (n === 'dringlichkeit') {
        setError('dringlichkeit', '');
        fristField.hidden = !e.target.hasAttribute('data-urgent');
      }
      if (n === 'kein-mandat' || n === 'datenschutz') { if (e.target.checked) setError(n, '', e.target); }
    });
    form.addEventListener('input', function (e) {
      if (e.target.id === 'f-name' && e.target.value.trim().length >= 2) setError('name', '', e.target);
      if (e.target.id === 'f-tel' || e.target.id === 'f-mail') {
        var tel = $('#f-tel', form).value.replace(/\D/g, '').length >= 6;
        var mail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test($('#f-mail', form).value.trim());
        if (tel || mail) { setError('kontakt', ''); $('#f-tel', form).removeAttribute('aria-invalid'); $('#f-mail', form).removeAttribute('aria-invalid'); }
      }
    });

    // Zeichenzähler
    function updateCount() {
      var n = ta.value.length;
      countN.textContent = String(n);
      countWrap.classList.toggle('is-ok', n >= FORM.minChars && n < FORM.maxChars * 0.9);
      countWrap.classList.toggle('is-near', n >= FORM.maxChars * 0.9);
      if (countBar) countBar.style.transform = 'scaleX(' + (n / FORM.maxChars).toFixed(3) + ')';
      if (n >= FORM.minChars) { setError('fall', '', ta); }
    }
    ta.addEventListener('input', updateCount);
    updateCount();

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      for (var n = 1; n <= steps.length; n++) {
        var bad = validate(n);
        if (bad) { if (n !== cur) showStep(n, { focus: false }); bad.focus(); return; }
      }
      // Zusammenfassung (nur textContent)
      var sum = $('[data-done-sum]', done);
      sum.textContent = '';
      function row(k, v) {
        if (!v) return;
        var dt = d.createElement('dt'); dt.textContent = k;
        var dd = d.createElement('dd'); dd.textContent = v;
        sum.appendChild(dt); sum.appendChild(dd);
      }
      var fd = new FormData(form);
      var frist = fromISO(fd.get('frist'));
      row('Rechtsgebiet', fd.get('gebiet'));
      row('Anliegen', String(fd.get('fall') || '').trim());
      row('Gegenseite', String(fd.get('gegner') || '').trim());
      row('Dringlichkeit', fd.get('dringlichkeit') + (frist && fd.get('dringlichkeit') === 'Es läuft eine Frist' ? ' (Schreiben vom ' + frist.toLocaleDateString('de-DE') + ')' : ''));
      row('Rechtsschutz', fd.get('rechtsschutz'));
      row('Gespräch', fd.get('form'));
      row('Name', String(fd.get('name') || '').trim());
      row('Telefon', String(fd.get('telefon') || '').trim());
      row('E-Mail', String(fd.get('email') || '').trim());
      row('Erreichbar', fd.get('zeit'));
      $('[data-done-name]', done).textContent = String(fd.get('name') || '').trim().split(/\s+/)[0] || 'für Ihre Anfrage';
      form.hidden = true;
      $('.no-mandate').hidden = true;
      done.hidden = false;
      nav.forEach(function (li) { li.classList.remove('is-current'); li.classList.add('is-done'); });
      scrollToEl(done);
      setTimeout(function () { try { done.focus({ preventScroll: true }); } catch (err) { } }, 50);
    });

    $('[data-wz-reset]', done).addEventListener('click', function () {
      form.reset();
      $$('[aria-invalid]', form).forEach(function (f) { f.removeAttribute('aria-invalid'); });
      $$('.field-error', form).forEach(function (f) { f.hidden = true; });
      fristField.hidden = true;
      updateCount();
      done.hidden = true;
      form.hidden = false;
      $('.no-mandate').hidden = false;
      showStep(1);
    });

    showStep(1, { instant: true });

    wizardApi = {
      prefill: function (area, urgent) {
        var radio = $('input[name="gebiet"][data-area-key="' + area + '"]', form);
        if (radio) { radio.checked = true; setError('gebiet', ''); }
        if (urgent) {
          var u = $('input[name="dringlichkeit"][data-urgent]', form);
          if (u) { u.checked = true; fristField.hidden = false; setError('dringlichkeit', ''); }
          if (deadlineState.date) $('#f-frist', form).value = toISO(deadlineState.date);
        }
        if (!done.hidden) return;
        if (cur === 1 && radio) showStep(2, { focus: false });
      }
    };
  })();

  function prefill(area, urgent) { if (wizardApi) wizardApi.prefill(area, urgent); }

  /* ===== Aktionsleiste (Handy): bei Formulareingabe ausblenden ========== */
  (function actionbar() {
    var bar = $('[data-actionbar]');
    if (!bar) return;
    var t;
    d.addEventListener('focusin', function (e) {
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) && e.target.type !== 'radio' && e.target.type !== 'checkbox') { clearTimeout(t); bar.classList.add('is-hidden'); }
    });
    d.addEventListener('focusout', function () {
      clearTimeout(t);
      t = setTimeout(function () {
        var a = d.activeElement;
        if (!a || !/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) || a.type === 'radio' || a.type === 'checkbox') bar.classList.remove('is-hidden');
      }, 120);
    });
  })();

  /* ===== Reveal beim Scrollen =========================================== */
  (function reveal() {
    var els = $$('.reveal, .reveal-lines');
    var frames = $$('.frame').filter(function (f) { return !f.closest('.ex-panel') && f.getBoundingClientRect().top > window.innerHeight; });
    if (!ANIM || !('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('is-in'); }); return; }
    frames.forEach(function (f) { f.classList.add('reveal-frame'); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.concat(frames).forEach(function (e) { io.observe(e); });
    $$('.hero-facts li').forEach(function (li, i) { li.style.setProperty('--i', i); });
  })();

  /* ===== Grundsatz: Wörter füllen sich (Scrub, Desktop mit Pin) ========= */
  (function statement() {
    var st = $('[data-words]');
    if (!st || !ANIM) return;
    var words = st.textContent.trim().split(/\s+/);
    st.textContent = '';
    var spans = words.map(function (w, i) {
      var s = d.createElement('span');
      s.className = 'w';
      s.textContent = w;
      st.appendChild(s);
      if (i < words.length - 1) st.appendChild(d.createTextNode(' '));
      return s;
    });
    st.classList.add('is-split');
    if (hasGsap) {
      var gsap = window.gsap;
      var mm = gsap.matchMedia();
      mm.add('(min-width: 900px)', function () {
        var tl = gsap.timeline({ scrollTrigger: { trigger: '[data-principle]', start: 'center 55%', end: '+=85%', pin: true, scrub: 0.6, anticipatePin: 1 } });
        tl.fromTo(spans, { opacity: 0.16 }, { opacity: 1, stagger: 0.06, duration: 0.25, ease: 'none' });
      });
      mm.add('(max-width: 899.98px)', function () {
        gsap.fromTo(spans, { opacity: 0.16 }, { opacity: 1, stagger: 0.06, duration: 0.25, ease: 'none', scrollTrigger: { trigger: st, start: 'top 82%', end: 'bottom 50%', scrub: 0.6 } });
      });
    } else {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { st.classList.add('is-done'); io.disconnect(); } });
      }, { threshold: 0.4 });
      io.observe(st);
    }
  })();

  /* ===== Foto-Parallaxe (nur Desktop) ==================================== */
  (function parallax() {
    if (!ANIM || !hasGsap) return;
    var gsap = window.gsap;
    var mm = gsap.matchMedia();
    mm.add('(min-width: 900px)', function () {
      $$('[data-parallax]').forEach(function (box) {
        var img = $('img', box);
        if (!img) return;
        gsap.fromTo(img, { yPercent: -3.5, scale: 1.08 }, { yPercent: 3.5, scale: 1.08, ease: 'none', scrollTrigger: { trigger: box, start: 'top bottom', end: 'bottom top', scrub: true } });
      });
    });
  })();

  /* ===== Hero: Paragraf im Linienstich (Canvas) ========================= */
  (function engrave() {
    var canvas = $('[data-engrave]');
    var plate = $('[data-plate]');
    if (!canvas || !canvas.getContext || typeof Path2D === 'undefined') return;
    var ctx = canvas.getContext('2d');
    var W = 0, H = 0, S = 6.5, N = 0, M = 0, STEP = 3;
    var fieldRows = [], insideRows = [], xs = new Float32Array(1), ys = new Float32Array(1);
    var raf = 0, visible = true, running = false, t0 = 0, introStart = 0, lastNow = 0, animT = 0;
    var mouse = { x: -999, y: -999, tx: -999, ty: -999, s: 0, ts: 0 };
    var para = new Path2D(PARA_D);

    function boxBlur(src, w, h, r) {
      var tmp = new Float32Array(w * h), out = new Float32Array(w * h), x, y, acc, i;
      for (y = 0; y < h; y++) {
        acc = 0;
        for (x = -r; x <= r; x++) acc += src[y * w + clamp(x, 0, w - 1)];
        for (x = 0; x < w; x++) {
          tmp[y * w + x] = acc / (2 * r + 1);
          acc += src[y * w + clamp(x + r + 1, 0, w - 1)] - src[y * w + clamp(x - r, 0, w - 1)];
        }
      }
      for (x = 0; x < w; x++) {
        acc = 0;
        for (y = -r; y <= r; y++) acc += tmp[clamp(y, 0, h - 1) * w + x];
        for (y = 0; y < h; y++) {
          out[y * w + x] = acc / (2 * r + 1);
          acc += tmp[clamp(y + r + 1, 0, h - 1) * w + x] - tmp[clamp(y - r, 0, h - 1) * w + x];
        }
      }
      return out;
    }

    function build() {
      var r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      if (W < 20 || H < 20) return false;
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      S = isMobile() ? ENGRAVE.spacingMobile : ENGRAVE.spacing;
      // Maske in halber Auflösung
      var sc = 0.5, mw = Math.max(2, Math.round(W * sc)), mh = Math.max(2, Math.round(H * sc));
      var off = d.createElement('canvas'); off.width = mw; off.height = mh;
      var o = off.getContext('2d');
      o.fillStyle = '#000'; o.fillRect(0, 0, mw, mh);
      var gh = Math.min(mh * 0.8, mw * 0.82 / 0.5765);
      var s = gh / 791;
      o.setTransform(s, 0, 0, -s, mw / 2 - 259 * s, mh / 2 + 274.5 * s);
      o.fillStyle = '#fff'; o.fill(para);
      var img = o.getImageData(0, 0, mw, mh).data;
      var sharp = new Float32Array(mw * mh);
      for (var i = 0; i < mw * mh; i++) sharp[i] = img[i * 4] / 255;
      var rad = Math.max(2, Math.round(mh * 0.022));
      var f = boxBlur(sharp, mw, mh, rad);
      f = boxBlur(f, mw, mh, rad);
      f = boxBlur(f, mw, mh, Math.max(1, Math.round(rad * 0.6)));
      var mx = 0;
      for (i = 0; i < f.length; i++) if (f[i] > mx) mx = f[i];
      mx = mx || 1;
      N = Math.floor(H / S);
      M = Math.ceil(W / STEP) + 1;
      fieldRows = []; insideRows = [];
      xs = new Float32Array(M); ys = new Float32Array(M);
      var yOff = (H - N * S) / 2 + S / 2;
      for (var j = 0; j < N; j++) {
        var y = yOff + j * S, fy = clamp(Math.round(y * sc), 0, mh - 1);
        var fr = new Float32Array(M), ir = new Uint8Array(M), lo = -1, hi = -1;
        for (var k = 0; k < M; k++) {
          var fx = clamp(Math.round(k * STEP * sc), 0, mw - 1);
          var v = f[fy * mw + fx] / mx;
          fr[k] = v * v * (3 - 2 * v); // weiche Kante
          ir[k] = sharp[fy * mw + fx] > 0.5 ? 1 : 0;
          if (fr[k] > 0.003) { if (lo < 0) lo = k; hi = k; }
        }
        // lo/hi: Bereich mit Relief – nur dort muss die Zeile die Linien dahinter verdecken
        fieldRows.push({ y: y, f: fr, inside: ir, lo: lo, hi: hi });
      }
      return true;
    }

    function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

    function draw(now) {
      var t = animT / 1000; // Laufzeit nur, solange gezeichnet wird – kein Sprung nach einer Pause
      var ip = STATIC ? 1 : clamp((now - introStart) / 2000, 0, 1);
      var k = easeOut(ip);
      var waveAmp = STATIC ? 0 : ENGRAVE.wave;
      mouse.x += (mouse.tx - mouse.x) * 0.14;
      mouse.y += (mouse.ty - mouse.y) * 0.14;
      mouse.s += (mouse.ts - mouse.s) * 0.08;
      var mr2 = 2 * ENGRAVE.mouseRadius * ENGRAVE.mouseRadius;
      var mReach = ENGRAVE.mouseRadius * 2.6, mOn = mouse.s > 0.01;
      ctx.clearRect(0, 0, W, H);
      for (var j = 0; j < N; j++) {
        var row = fieldRows[j];
        var reveal = STATIC ? 1 : clamp(ip * 1.7 - (j / N) * 0.7, 0, 1);
        if (reveal <= 0) continue;
        var maxK = Math.max(1, Math.ceil((M - 1) * easeOut(reveal)));
        for (var i = 0; i <= maxK && i < M; i++) {
          var x = i * STEP;
          var fv = row.f[i];
          var dy = -ENGRAVE.relief * k * fv;
          if (waveAmp) dy += Math.sin(x * 0.017 + t * 0.7 + j * 0.33) * waveAmp * (0.35 + 0.65 * fv);
          if (mouse.s > 0.01) {
            var dx = x - mouse.x, ddy = row.y - mouse.y;
            dy -= ENGRAVE.mouseLift * mouse.s * Math.exp(-(dx * dx + ddy * ddy) / mr2) * (0.5 + 0.5 * fv);
          }
          xs[i] = x; ys[i] = row.y + dy;
        }
        var last = Math.min(maxK, M - 1);
        // Verdecken (Relief) – nur wo sich die Linie hebt: im Zeichen und unter der Maus
        var fl = row.lo, fh = row.hi;
        if (mOn && Math.abs(row.y - mouse.y) < mReach) {
          var ml = Math.floor((mouse.x - mReach) / STEP), mh = Math.ceil((mouse.x + mReach) / STEP);
          fl = fl < 0 ? ml : Math.min(fl, ml); fh = Math.max(fh, mh);
        }
        if (fh >= 0) {
          fl = Math.max(0, fl - 2); fh = Math.min(last, fh + 2);
          if (fh > fl) {
            ctx.beginPath();
            ctx.moveTo(xs[fl], ys[fl]);
            for (i = fl + 1; i <= fh; i++) ctx.lineTo(xs[i], ys[i]);
            ctx.lineTo(xs[fh], row.y + 1.2);
            ctx.lineTo(xs[fl], row.y + 1.2);
            ctx.closePath();
            ctx.fillStyle = ENGRAVE.paper;
            ctx.fill();
          }
        }
        // feine Linie
        ctx.beginPath();
        ctx.moveTo(xs[0], ys[0]);
        for (i = 1; i <= last; i++) ctx.lineTo(xs[i], ys[i]);
        ctx.lineWidth = 0.75;
        ctx.strokeStyle = ENGRAVE.ink;
        ctx.stroke();
        // kräftige Linie innerhalb des Zeichens
        ctx.beginPath();
        var on = false;
        for (i = 0; i <= last; i++) {
          if (row.inside[i]) {
            if (!on) { ctx.moveTo(xs[i], ys[i]); on = true; } else ctx.lineTo(xs[i], ys[i]);
          } else on = false;
        }
        ctx.lineWidth = 1.6;
        ctx.strokeStyle = ENGRAVE.accent;
        ctx.stroke();
      }
    }

    function loop(now) {
      raf = 0;
      if (!running) return;
      animT += lastNow ? Math.min(64, now - lastNow) : 16;
      lastNow = now;
      draw(now);
      // Ruhe (Intro fertig, keine Maus): letztes Bild bleibt stehen, der Hauptthread ist frei.
      if (mouse.ts === 0 && mouse.s < 0.01 && now - introStart > 2100) { running = false; lastNow = 0; return; }
      raf = requestAnimationFrame(loop);
    }
    function start() {
      if (running || STATIC) return;
      running = true;
      lastNow = 0;
      raf = requestAnimationFrame(loop);
    }
    function stop() { running = false; lastNow = 0; if (raf) cancelAnimationFrame(raf); raf = 0; }

    function init() {
      if (!build()) return;
      plate.classList.add('has-canvas');
      t0 = performance.now();
      introStart = t0 + (ANIM ? 350 : 0);
      if (STATIC) { draw(t0); return; }
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (es) {
          visible = es[0].isIntersecting;
          if (visible && !d.hidden) start(); else stop();
        }).observe(canvas);
      }
      start();
    }
    d.addEventListener('visibilitychange', function () { if (d.hidden) stop(); else if (visible) start(); });
    if (!STATIC && finePointer()) {
      plate.addEventListener('pointermove', function (e) {
        var r = canvas.getBoundingClientRect();
        mouse.tx = e.clientX - r.left; mouse.ty = e.clientY - r.top;
        if (mouse.x < -900) { mouse.x = mouse.tx; mouse.y = mouse.ty; }
        mouse.ts = 1;
        if (visible && !d.hidden) start();
      });
      plate.addEventListener('pointerleave', function () { mouse.ts = 0; });
    }
    var rt;
    var lastW = 0, lastH = 0;
    function onResize() {
      clearTimeout(rt);
      rt = setTimeout(function () {
        var r = canvas.getBoundingClientRect();
        if (Math.abs(r.width - lastW) < 2 && Math.abs(r.height - lastH) < 2) return;
        lastW = r.width; lastH = r.height;
        if (build() && !running) draw(performance.now()); // neue Canvas-Größe löscht das Bild
      }, 150);
    }
    if ('ResizeObserver' in window) new ResizeObserver(onResize).observe(canvas);
    else window.addEventListener('resize', onResize);
    var r0 = canvas.getBoundingClientRect(); lastW = r0.width; lastH = r0.height;
    init();
  })();

  /* ===== Start ========================================================== */
  function loaded() {
    root.classList.add('is-loaded');
    if (hasGsap) softRefresh(300); // nach dem Laden der Schriften
  }
  var fontsReady = d.fonts && d.fonts.ready ? d.fonts.ready : Promise.resolve();
  Promise.race([fontsReady, new Promise(function (r) { setTimeout(r, 700); })]).then(function () {
    requestAnimationFrame(loaded);
  });
  // ScrollTrigger misst bei „load“ selbst neu (autoRefreshEvents)
  window.addEventListener('load', function () { measureRibbon(); onScroll(); });

  // Direkter Aufruf mit Hash (z. B. #fristen): nach dem Layout korrekt positionieren
  if (location.hash && location.hash.length > 1) {
    var target = d.getElementById(location.hash.slice(1));
    if (target) setTimeout(function () { scrollToEl(target, true); }, 120);
  }
  onScroll();
})();
