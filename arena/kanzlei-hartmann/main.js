/* ==========================================================================
   Hartmann Rechtsanwälte · Modell „Paragraf“ · main.js
   Ohne Build-Schritt. Optional: GSAP 3.13 + ScrollTrigger, Lenis 1.3.
   Alles funktioniert auch ohne diese Bibliotheken und ohne Animation.
   Start in Etappen: Kopf, Menü und Titelseite sofort, der Rest in Häppchen.
   ========================================================================== */
(function () {
  'use strict';

  /* ===== Konstanten (hier anpassen) ===================================== */

  // Öffnungszeiten (Europe/Berlin): Wochentage 1–5 = Mo–Fr, Minuten ab Mitternacht.
  var OPENING = { days: [1, 2, 3, 4, 5], open: 8 * 60 + 30, close: 18 * 60, tz: 'Europe/Berlin' };

  // Zeitungskopf: Gründungsjahr der Kanzlei → „Jahrgang“; Ausgabe = Tag des Jahres.
  var FOUNDED = 2009;

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

  // Taf. I: Das Kleingedruckte im Paragrafenzeichen (Canvas) und die Lupe.
  //   size = Schriftgröße relativ zur Glyphenhöhe, mag = Vergrößerung der Lupe.
  //   Sätze mit * werden in Bordeaux gesetzt. Allgemeine Orientierung, kein Gesetzestext.
  var MICRO = {
    size: 0.0101, minSize: 4.4, maxSize: 7, lead: 1.24, mag: 2.7,
    ink: 'rgba(18,18,18,.78)', accent: '#6E1E2B', paper: '#FCFAF6',
    rest: [184, 436], // Ruheplatz der Lupe in Schrifteinheiten des Zeichens
    font: 'italic 400 {s}px Spectral, Georgia, serif',
    text: [
      '§ 4 KSchG', 'Kündigungsschutzklage innerhalb von', '*drei Wochen*', 'nach Zugang der schriftlichen Kündigung ·',
      '§ 67 OWiG', 'Einspruch gegen den Bußgeldbescheid', '*binnen zwei Wochen*', 'nach Zustellung ·',
      '§ 558b BGB', 'Zustimmung zur Mieterhöhung', '*bis zum Ablauf des zweiten Kalendermonats*', 'nach Zugang ·',
      '§ 556 Abs. 3 BGB', 'Einwendungen gegen die Abrechnung', '*bis zum Ablauf des zwölften Monats* ·',
      '§ 1613 BGB', 'Unterhalt für die Vergangenheit', '*erst ab Aufforderung* ·',
      '§ 193 BGB', 'Fällt das Ende auf einen Sonnabend, Sonntag oder Feiertag,', '*tritt der nächste Werktag an seine Stelle* ·',
      '§ 34 RVG', 'Erstberatung für Verbraucher', '*höchstens 190 Euro* ·',
      '§ 43a BRAO', '*Verschwiegenheit*', 'schon für Ihre Anfrage ·',
      '§ 12a ArbGG', 'erste Instanz:', '*jede Seite trägt ihre Kosten selbst* ·',
      '§ 38 SGB III', 'arbeitsuchend melden', '*innerhalb von drei Tagen* ·'
    ]
  };

  // § aus Spectral SemiBold (y-Achse nach oben, Einheiten 1/1000 em)
  var PARA_D = 'M310 670Q348 670 378.5 659.5Q409 649 427.0 633.5Q445 618 445 603Q445 595 436 585L396 539L296 626Q251 625 221.0 599.5Q191 574 191 540Q191 518 202.5 500.5Q214 483 245.0 468.5Q276 454 334 440Q422 418 454.5 383.0Q487 348 487 296Q487 246 459.0 209.5Q431 173 379 152Q404 133 414.5 107.5Q425 82 425 49Q425 3 394.5 -35.5Q364 -74 314.5 -97.5Q265 -121 210 -121Q172 -121 140.0 -110.0Q108 -99 88.5 -83.0Q69 -67 69 -51Q69 -42 79 -32L119 14L222 -79Q270 -78 301.5 -53.5Q333 -29 333 4Q333 28 321.5 46.5Q310 65 279.0 80.5Q248 96 189 111Q100 132 65.5 169.5Q31 207 31 261Q31 310 60.0 345.5Q89 381 138 401Q117 419 108.0 443.5Q99 468 99 499Q99 547 128.5 586.0Q158 625 206.0 647.5Q254 670 310 670ZM268 198Q308 189 336 177Q362 184 380.0 203.0Q398 222 398 248Q398 272 386.5 290.5Q375 309 344.0 323.5Q313 338 255 350Q205 361 172 378Q147 367 135.5 348.5Q124 330 124 305Q124 280 135.5 261.0Q147 242 178.0 226.5Q209 211 268 198Z';

  // Kapitelfarben für theme-color (Browserleiste)
  var CHAPTER_BG = { paper: '#F7F4EE', ink: '#131211', wine: '#6E1E2B', news: '#E9E3D8' };

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
  function headH() { var h = $('.site-head'); return h ? h.offsetHeight : 64; }
  function el(tag, cls, text) { var e = d.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  var refreshT = 0;
  function softRefresh(ms) {
    if (!window.ScrollTrigger) return;
    clearTimeout(refreshT);
    refreshT = setTimeout(function () { window.ScrollTrigger.refresh(); }, ms == null ? 300 : ms);
  }

  // Warteschlange: alles unterhalb der Titelseite in Häppchen (~16 ms) starten
  var queue = [];
  function later(fn) { queue.push(fn); }
  var idle = window.requestIdleCallback ? function (f) { window.requestIdleCallback(f, { timeout: 140 }); } : function (f) { setTimeout(f, 24); };
  function runQueue() {
    var t0 = performance.now();
    while (queue.length && performance.now() - t0 < 16) {
      var fn = queue.shift();
      try { fn(); } catch (e) { /* ein Modul darf die übrigen nicht aufhalten */ }
    }
    if (queue.length) idle(runQueue);
  }

  /* ===== Smooth Scroll + ScrollTrigger ================================== */
  var lenis = null;
  var hasGsap = !!(window.gsap && window.ScrollTrigger);
  if (hasGsap) window.gsap.registerPlugin(window.ScrollTrigger);
  var GS = ANIM && hasGsap;
  if (GS) root.classList.add('gs');

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

  function scrollToEl(t, immediate) {
    if (!t) return;
    if (lenis) lenis.scrollTo(t, { offset: -(headH() + 8), immediate: !!immediate, duration: immediate ? 0 : 1.2 });
    else {
      var y = t.getBoundingClientRect().top + window.pageYOffset - headH() - 8;
      window.scrollTo({ top: y, behavior: STATIC || immediate ? 'auto' : 'smooth' });
    }
  }
  function scrollByPx(dy) {
    if (!dy) return;
    if (lenis) lenis.scrollTo(window.pageYOffset + dy, { immediate: true });
    else window.scrollTo(0, window.pageYOffset + dy);
  }

  /* ===== Scroll-Zustand: Kopf, Lesebändchen ============================== */
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

  var rib = { max: 1, box: 0 }, scrolled = null, lastRib = '';
  function measureRibbon() {
    rib.max = Math.max(1, d.documentElement.scrollHeight - window.innerHeight);
    rib.box = ribbon ? ribbon.parentNode.offsetHeight : 0;
  }
  measureRibbon();
  window.addEventListener('resize', measureRibbon);
  if ('ResizeObserver' in window) new ResizeObserver(function () { measureRibbon(); onScroll(); }).observe(d.body);
  scrollHandlers.push(function (y) {
    var sc = y > 8;
    if (head && sc !== scrolled) { scrolled = sc; head.classList.toggle('is-scrolled', sc); }
    if (ribbon) {
      var p = clamp(y / rib.max, 0, 1);
      var tf = 'translate3d(0,' + (-(1 - p) * 100).toFixed(2) + '%,0)';
      if (tf !== lastRib) { lastRib = tf; ribbon.style.transform = tf; }
    }
  });

  // Marke im Kopf erst zeigen, wenn der große Zeitungskopf aus dem Bild ist
  (function brandSwap() {
    var np = $('.nameplate');
    if (!np || !head || !('IntersectionObserver' in window)) { if (head) head.classList.add('is-past-np'); return; }
    new IntersectionObserver(function (es) {
      var e = es[0];
      head.classList.toggle('is-past-np', !e.isIntersecting && e.boundingClientRect.top < 0);
    }, { rootMargin: '-60px 0px 0px 0px' }).observe(np);
  })();

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

  /* ===== Menü (Inhaltsverzeichnis als Dialog) ============================ */
  var menu = $('#menu');
  (function menuDialog() {
    var openBtn = $('[data-menu-open]');
    if (!menu || !openBtn || typeof menu.showModal !== 'function') {
      if (openBtn) openBtn.addEventListener('click', function () { scrollToEl($('#rechtsgebiete')); });
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
  })();

  /* ===== Anker-Links ===================================================== */
  var areasApi = null, wizardApi = null;
  function prefill(area, urgent) { if (wizardApi) wizardApi.prefill(area, urgent); }
  function goTo(t, hash) {
    if (!t) return;
    if (typeof cvAll === 'function') cvAll();
    scrollToEl(t);
    if (hash && history.pushState) history.pushState(null, '', hash);
    if (!t.hasAttribute('tabindex') && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(t.tagName)) t.setAttribute('tabindex', '-1');
    setTimeout(function () { try { t.focus({ preventScroll: true }); } catch (e) { } }, STATIC ? 0 : 650);
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
    if (a.hasAttribute('data-open-area') && areasApi) {
      var row = areasApi.open(a.getAttribute('data-open-area'), true);
      if (row) { scrollToEl(row); return; }
    }
    if (id === 'inhalt') { goTo(t); return; }
    goTo(t, '#' + id);
  });

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

  // „Jetzt“ in Nürnberg
  function berlinNow() {
    try {
      var parts = new Intl.DateTimeFormat('en-GB', { timeZone: OPENING.tz, weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
      var get = function (t) { var p = parts.filter(function (x) { return x.type === t; })[0]; return p ? p.value : ''; };
      var wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
      return { wd: wd, min: (+get('hour') % 24) * 60 + (+get('minute')), date: noon(+get('year'), +get('month') - 1, +get('day')) };
    } catch (e) {
      var n = new Date(); return { wd: n.getDay(), min: n.getHours() * 60 + n.getMinutes(), date: noon(n.getFullYear(), n.getMonth(), n.getDate()) };
    }
  }

  /* ===== Zeitungskopf: Jahrgang, Ausgabe, Datum ========================== */
  (function dateline() {
    var now = berlinNow(), dt = now.date, y = dt.getFullYear();
    var doy = Math.round((Date.UTC(y, dt.getMonth(), dt.getDate()) - Date.UTC(y, 0, 0)) / 864e5);
    var yr = $('[data-ed-year]'), no = $('[data-ed-no]'), tm = $('[data-ed-date]');
    if (yr) yr.textContent = 'Jahrgang ' + (y - FOUNDED + 1);
    if (no) no.textContent = 'Nr. ' + doy;
    if (tm) { tm.textContent = fmtLong.format(dt); tm.setAttribute('datetime', toISO(dt)); }
  })();

  /* ===== Öffnungszeiten („Lage am Königstor“, Anfahrt) =================== */
  (function openState() {
    var outs = $$('[data-open-now]');
    var rows = $$('[data-hours] [data-day]');
    var now = berlinNow();
    rows.forEach(function (r) { if (+r.getAttribute('data-day') === now.wd) r.classList.add('is-today'); });
    if (!outs.length) return;
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
    outs.forEach(function (o) { o.textContent = txt; o.classList.toggle('is-open', openNow); });
  })();

  /* ===== Taf. I: Paragraf aus Kleingedrucktem + Lupe (Canvas) =========== */
  (function plate() {
    var fig = $('[data-plate]');
    var art = $('[data-plate-art]');
    var canvas = $('[data-para-text]');
    var loupe = $('[data-loupe]');
    var lc = $('[data-loupe-c]');
    if (!fig || !art || !canvas || !canvas.getContext || typeof Path2D === 'undefined') return;
    var ctx = canvas.getContext('2d'), lctx = lc.getContext('2d');
    var para = new Path2D(PARA_D);
    var W = 0, H = 0, dpr = 1, T = null, size = 6, lineH = 7.4, segs = [], off = null, built = false;
    var R = 86, LR = 172, ldpr = 1;
    var pos = { x: 0, y: 0 }, tgt = { x: 0, y: 0 }, rest = { x: 0, y: 0 }, raf = 0, intro = null, drag = null, moved = false;
    var font = function (s) { return MICRO.font.replace('{s}', s.toFixed(2)); };
    var x;

    // Satz: Wörter mit Hervorhebung, endlos aneinandergereiht
    var tokens = [];
    MICRO.text.forEach(function (ph) {
      var acc = /^\*/.test(ph);
      ph.replace(/\*/g, '').split(' ').forEach(function (w) { if (w) tokens.push({ t: w, acc: acc }); });
    });

    function layout() {
      var r = art.getBoundingClientRect();
      W = r.width; H = r.height;
      if (W < 40 || H < 40) return false;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      var s = Math.min(W / 496, H / 831);
      T = { s: s, ox: (W - 496 * s) / 2 - 11 * s, oy: (H - 831 * s) / 2 + 690 * s };
      var gh = 791 * s;
      size = clamp(gh * MICRO.size, MICRO.minSize, MICRO.maxSize);
      lineH = size * MICRO.lead;
      ctx.font = font(size);
      var cache = {}, sp = ctx.measureText(' ').width;
      var top = T.oy - 676 * s, bottom = T.oy + 126 * s;
      segs = [];
      // Ruheplatz der Lupe: dickste Stelle des Zeichens (vorab berechnet, Schrifteinheiten)
      rest = { x: MICRO.rest[0] * s + T.ox, y: -MICRO.rest[1] * s + T.oy };
      var restLine = Math.round((rest.y - top) / lineH);
      var iKey = 0;
      tokens.forEach(function (tk, k) { if (!iKey && tk.acc && tk.t === 'drei') iKey = k; });
      var keyW = (cache.drei || (cache.drei = ctx.measureText('drei').width)) + sp + (cache.Wochen || (cache.Wochen = ctx.measureText('Wochen').width));
      var line = 0, ti = 0;
      for (var y = top + lineH; y < bottom; y += lineH, line++) {
        if (line === restLine - 1) {
          // Diese Zeile trägt „drei Wochen“ genau unter die Lupe
          var x0 = rest.x - keyW / 2, xb = x0, kb = iKey - 1;
          while (xb > 0) {
            var tb = tokens[(kb + tokens.length) % tokens.length]; kb--;
            var wb = cache[tb.t] || (cache[tb.t] = ctx.measureText(tb.t).width);
            xb -= wb + sp;
            segs.push({ x: xb, y: y, w: wb, t: tb.t, acc: tb.acc });
          }
          ti = iKey; x = x0;
        } else {
          ti = (line * 23) % tokens.length;
          var x = -((line * 37) % 60);
        }
        while (x < W) {
          var tk = tokens[ti % tokens.length]; ti++;
          var w = cache[tk.t] || (cache[tk.t] = ctx.measureText(tk.t).width);
          segs.push({ x: x, y: y, w: w, t: tk.t, acc: tk.acc });
          x += w + sp;
        }
        if (line === restLine - 1) rest.y = y - size * .35;
      }
      return true;
    }

    function render() {
      off = d.createElement('canvas');
      off.width = Math.round(W * dpr); off.height = Math.round(H * dpr);
      var o = off.getContext('2d');
      o.save();
      o.setTransform(dpr * T.s, 0, 0, -dpr * T.s, dpr * T.ox, dpr * T.oy);
      o.clip(para);
      o.setTransform(dpr, 0, 0, dpr, 0, 0);
      o.font = font(size);
      o.textBaseline = 'alphabetic';
      for (var i = 0; i < segs.length; i++) {
        var g = segs[i];
        o.fillStyle = g.acc ? MICRO.accent : MICRO.ink;
        o.fillText(g.t, g.x, g.y);
      }
      o.restore();
      canvas.width = off.width; canvas.height = off.height;
    }

    function blit(p) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (p >= 1) { ctx.drawImage(off, 0, 0); return; }
      var hh = Math.max(1, Math.round(off.height * p));
      ctx.drawImage(off, 0, 0, off.width, hh, 0, 0, off.width, hh);
      // Druckkante: feine Linie im Zeichen
      ctx.save();
      ctx.setTransform(dpr * T.s, 0, 0, -dpr * T.s, dpr * T.ox, dpr * T.oy);
      ctx.clip(para);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = MICRO.accent;
      ctx.fillRect(0, hh - dpr, off.width, Math.max(1, dpr * 1.2));
      ctx.restore();
    }

    function sizeLoupe() {
      LR = loupe.offsetWidth || 172; R = LR / 2;
      ldpr = Math.min(2, window.devicePixelRatio || 1);
      lc.width = Math.round(LR * ldpr); lc.height = Math.round(LR * ldpr);
    }

    function drawLoupe() {
      var M = MICRO.mag, cx = pos.x, cy = pos.y;
      loupe.style.transform = 'translate3d(' + (cx - R).toFixed(1) + 'px,' + (cy - R).toFixed(1) + 'px,0)';
      lctx.setTransform(ldpr, 0, 0, ldpr, 0, 0);
      lctx.fillStyle = MICRO.paper;
      lctx.fillRect(0, 0, LR, LR);
      var bx = ldpr * M, ox = ldpr * (R - cx * M), oy = ldpr * (R - cy * M);
      lctx.save();
      lctx.setTransform(bx * T.s, 0, 0, -bx * T.s, bx * T.ox + ox, bx * T.oy + oy);
      lctx.clip(para);
      lctx.setTransform(bx, 0, 0, bx, ox, oy);
      lctx.font = font(size);
      var y0 = cy - R / M - lineH, y1 = cy + R / M + lineH, x0 = cx - R / M - 140, x1 = cx + R / M;
      for (var i = 0; i < segs.length; i++) {
        var g = segs[i];
        if (g.y < y0 || g.y > y1 || g.x > x1 || g.x + g.w < x0) continue;
        lctx.fillStyle = g.acc ? MICRO.accent : '#121212';
        lctx.fillText(g.t, g.x, g.y);
      }
      lctx.restore();
      // Kontur des Zeichens auch unter dem Glas
      lctx.save();
      lctx.setTransform(bx * T.s, 0, 0, -bx * T.s, bx * T.ox + ox, bx * T.oy + oy);
      lctx.lineWidth = 2.2 / T.s / M;
      lctx.strokeStyle = MICRO.accent;
      lctx.stroke(para);
      lctx.restore();
    }

    function loop() {
      raf = 0;
      var k = drag ? 1 : (intro ? 0.06 : 0.16);
      pos.x += (tgt.x - pos.x) * k;
      pos.y += (tgt.y - pos.y) * k;
      drawLoupe();
      if (Math.abs(tgt.x - pos.x) > 0.25 || Math.abs(tgt.y - pos.y) > 0.25) raf = requestAnimationFrame(loop);
      else { pos.x = tgt.x; pos.y = tgt.y; drawLoupe(); intro = null; }
    }
    function moveTo(x, y) {
      tgt.x = clamp(x, R * .35, W - R * .35); tgt.y = clamp(y, R * .35, H - R * .35);
      if (!raf && built) raf = requestAnimationFrame(loop);
    }

    function printIn(done) {
      if (STATIC) { blit(1); done(); return; }
      var t0 = performance.now(), dur = 1500;
      (function step(now) {
        var p = clamp((now - t0) / dur, 0, 1);
        var e = p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
        blit(e);
        if (p < 1) requestAnimationFrame(step); else done();
      })(t0);
    }

    function build(first) {
      if (!layout()) return;
      // Zwei Häppchen: Satz messen, dann drucken – kein langer Task
      setTimeout(function () {
        render();
        sizeLoupe();
        fig.classList.add('has-text');
        built = true;
        if (first) {
          pos.x = tgt.x = rest.x; pos.y = tgt.y = rest.y - (STATIC ? 0 : H * .22);
          drawLoupe();
          printIn(function () {
            if (!STATIC && !moved) { intro = true; moveTo(rest.x, rest.y); }
            else if (STATIC) { pos.x = tgt.x = rest.x; pos.y = tgt.y = rest.y; drawLoupe(); }
          });
        } else {
          blit(1);
          pos.x = tgt.x = clamp(moved ? pos.x : rest.x, 0, W); pos.y = tgt.y = clamp(moved ? pos.y : rest.y, 0, H);
          drawLoupe();
        }
      }, 0);
    }

    // Lupe folgt dem Zeiger (Desktop) bzw. lässt sich ziehen (Touch)
    if (finePointer()) {
      art.addEventListener('pointermove', function (e) {
        if (!built) return;
        var r = art.getBoundingClientRect();
        moved = true; intro = null;
        moveTo(e.clientX - r.left, e.clientY - r.top);
      });
      art.addEventListener('pointerleave', function () { if (built) moveTo(rest.x, rest.y); });
    } else {
      fig.classList.add('can-drag');
      loupe.addEventListener('pointerdown', function (e) {
        if (!built) return;
        var r = art.getBoundingClientRect();
        drag = { dx: pos.x - (e.clientX - r.left), dy: pos.y - (e.clientY - r.top) };
        moved = true; intro = null;
        fig.classList.add('is-drag');
        try { loupe.setPointerCapture(e.pointerId); } catch (err) { }
      });
      loupe.addEventListener('pointermove', function (e) {
        if (!drag) return;
        var r = art.getBoundingClientRect();
        moveTo(e.clientX - r.left + drag.dx, e.clientY - r.top + drag.dy);
      });
      var end = function () { drag = null; fig.classList.remove('is-drag'); };
      loupe.addEventListener('pointerup', end);
      loupe.addEventListener('pointercancel', end);
    }

    var rt, lastW = 0, lastH = 0;
    function onResize() {
      clearTimeout(rt);
      rt = setTimeout(function () {
        var r = art.getBoundingClientRect();
        if (Math.abs(r.width - lastW) < 2 && Math.abs(r.height - lastH) < 2) return;
        lastW = r.width; lastH = r.height;
        build(false);
      }, 160);
    }

    function start() {
      var r0 = art.getBoundingClientRect(); lastW = r0.width; lastH = r0.height;
      build(true);
      if ('ResizeObserver' in window) new ResizeObserver(onResize).observe(art);
      else window.addEventListener('resize', onResize);
    }
    // Schrift abwarten (höchstens 1,4 s), damit das Kleingedruckte in Spectral gesetzt wird
    var fontP = d.fonts && d.fonts.load ? d.fonts.load(font(12)) : Promise.resolve();
    Promise.race([fontP, new Promise(function (r) { setTimeout(r, 1400); })]).then(function () { setTimeout(start, ANIM ? 120 : 0); }, start);
  })();

  /* ===== Magnetische Knöpfe (nur feiner Zeiger) ========================== */
  function magnetic(btn) {
    if (!ANIM || !finePointer() || btn.__mag) return;
    btn.__mag = true;
    var cur = { x: 0, y: 0 }, tg = { x: 0, y: 0 }, raf = 0;
    function tick() {
      raf = 0;
      cur.x += (tg.x - cur.x) * .2; cur.y += (tg.y - cur.y) * .2;
      btn.style.setProperty('--mx', cur.x.toFixed(2) + 'px');
      btn.style.setProperty('--my', cur.y.toFixed(2) + 'px');
      if (Math.abs(tg.x - cur.x) > .05 || Math.abs(tg.y - cur.y) > .05) raf = requestAnimationFrame(tick);
    }
    btn.addEventListener('pointermove', function (e) {
      var r = btn.getBoundingClientRect();
      tg.x = (e.clientX - (r.left + r.width / 2)) * .18;
      tg.y = (e.clientY - (r.top + r.height / 2)) * .28;
      if (!raf) raf = requestAnimationFrame(tick);
    });
    btn.addEventListener('pointerleave', function () { tg.x = 0; tg.y = 0; if (!raf) raf = requestAnimationFrame(tick); });
  }
  $$('.front [data-magnetic]').forEach(magnetic);

  /* ===== Ab hier: Etappen ================================================ */

  // Abschnitte unterhalb der Titelseite einzeln setzen (je ein Häppchen, kein langer Layout-Task)
  var cvSecs = $$('main > .ch:not(.front), .site-foot');
  function cvAll() { cvSecs.forEach(function (s) { s.classList.add('cv-done'); }); }
  cvSecs.forEach(function (s) { later(function () { s.classList.add('cv-done'); void s.offsetHeight; }); });

  // Zeichen-Rollen für Navigation und Register (nur feiner Zeiger)
  later(function rollify() {
    if (!ANIM || !finePointer()) return;
    $$('[data-roll]').forEach(function (n) {
      var txt = n.textContent;
      n.textContent = '';
      n.appendChild(el('span', 'sr-only', txt));
      var vis = el('span', 'roll-vis');
      vis.setAttribute('aria-hidden', 'true');
      Array.prototype.forEach.call(txt, function (ch, i) {
        var c = ch === ' ' ? ' ' : ch;
        var w = el('span', 'rc');
        w.setAttribute('data-c', c);
        w.style.setProperty('--i', i);
        w.appendChild(el('span', null, c));
        vis.appendChild(w);
      });
      n.appendChild(vis);
    });
  });

  // Kapitel: das ganze Papier wechselt die Farbe (Hintergrund gleitet, Farben springen zur Mitte)
  later(function chapters() {
    if (!ANIM || !('IntersectionObserver' in window)) return;
    var meta = $('meta[name="theme-color"]');
    var secs = $$('[data-chapter]');
    var cur = null, swapT = 0;
    function set(ch, now) {
      if (cur === ch || !CHAPTER_BG[ch]) return;
      cur = ch;
      var col = CHAPTER_BG[ch];
      d.body.style.backgroundColor = col;
      if (head) head.style.backgroundColor = col;
      if (meta) meta.setAttribute('content', col);
      clearTimeout(swapT);
      if (now) root.setAttribute('data-ch', ch);
      else swapT = setTimeout(function () { root.setAttribute('data-ch', ch); }, 230);
    }
    var mid = window.innerHeight / 2, start = 'paper';
    secs.forEach(function (s) { var r = s.getBoundingClientRect(); if (r.top <= mid && r.bottom > mid) start = s.getAttribute('data-chapter'); });
    set(start, true);
    root.classList.add('chapters');
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) set(e.target.getAttribute('data-chapter')); });
    }, { rootMargin: '-50% 0px -50% 0px' });
    secs.forEach(function (s) { io.observe(s); });
  });

  // Zeilenguss: Überschriften in Wörter teilen, Linien, Bilder, Stempel
  later(function reveal() {
    if (!ANIM || !('IntersectionObserver' in window)) return;
    var vh = window.innerHeight;
    $$('.cast').forEach(function (h) {
      var wi = 0;
      (function walk(node) {
        Array.prototype.slice.call(node.childNodes).forEach(function (c) {
          if (c.nodeType === 3) {
            var parts = c.nodeValue.split(/( +)/);
            var frag = d.createDocumentFragment();
            parts.forEach(function (p) {
              if (!p) return;
              if (/^ +$/.test(p)) { frag.appendChild(d.createTextNode(' ')); return; }
              var w = el('span', 'w'), inn = el('span', 'w-in', p);
              inn.style.setProperty('--wi', Math.min(wi++, 14));
              w.appendChild(inn); frag.appendChild(w);
            });
            node.replaceChild(frag, c);
          } else if (c.nodeType === 1) walk(c);
        });
      })(h);
      h.classList.add('is-split');
    });
    $$('.principle-fig, .team-fig, .map-photo').forEach(function (f) { if (f.getBoundingClientRect().top > vh) f.classList.add('print'); });
    $$('.stamp, .area-dots').forEach(function (s) { if (s.getBoundingClientRect().top > vh) s.classList.add('is-armed'); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var t = e.target;
        t.classList.add('is-in');
        io.unobserve(t);
        if (t.classList.contains('area-dots')) {
          var all = $$('.area-dots'), k = all.indexOf(t);
          t.style.transitionDelay = (k * 70) + 'ms';
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
    $$('.cast, .print, .stamp.is-armed, .area-dots.is-armed').forEach(function (t) { io.observe(t); });
  });

  // § 1 Leitartikel: Wörter werden eingedruckt, der Paragraf zieht sich, die Unterschrift folgt
  later(function statement() {
    var st = $('[data-words]'), bp = $('[data-bp]'), sig = $('[data-sig]');
    if (!st || !GS) {
      if (sig && ANIM && 'IntersectionObserver' in window) {
        var io0 = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { sig.classList.add('is-in'); io0.disconnect(); } }, { threshold: .6 });
        io0.observe(sig);
      }
      return;
    }
    var words = st.textContent.trim().split(/\s+/);
    st.textContent = '';
    var spans = words.map(function (w, i) {
      var s = el('span', 'w', w);
      st.appendChild(s);
      if (i < words.length - 1) st.appendChild(d.createTextNode(' '));
      return s;
    });
    st.classList.add('is-split');
    var gsap = window.gsap, mm = gsap.matchMedia();
    function signed(p) { if (sig) sig.classList.toggle('is-in', p > .82); }
    mm.add('(min-width: 900px)', function () {
      var tl = gsap.timeline({ scrollTrigger: { trigger: '[data-principle]', start: 'top top', end: 'bottom bottom', scrub: 0.5, onUpdate: function (s) { signed(s.progress); } } });
      tl.fromTo(spans, { opacity: 0.14 }, { opacity: 1, stagger: 0.06, duration: 0.3, ease: 'none' }, 0.05);
      if (bp) tl.fromTo(bp, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: tl.duration() * 0.7, ease: 'none' }, 0);
    });
    mm.add('(max-width: 899.98px)', function () {
      gsap.fromTo(spans, { opacity: 0.14 }, { opacity: 1, stagger: 0.06, duration: 0.25, ease: 'none', scrollTrigger: { trigger: st, start: 'top 82%', end: 'bottom 45%', scrub: 0.5, onUpdate: function (s) { signed(s.progress); } } });
      if (bp) gsap.fromTo(bp, { strokeDashoffset: 1 }, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: st, start: 'top 90%', end: 'top 40%', scrub: 0.5 } });
    });
  });

  // § 2 Register: Akkordeon (aria-expanded) mit Vorschau am Zeiger
  later(function areas() {
    var list = $('[data-areas]');
    if (!list) return;
    var items = $$('.area', list).map(function (a) {
      return { el: a, key: a.getAttribute('data-area'), btn: $('.area-btn', a), panel: $('.area-panel', a) };
    });
    function animateIn(it) {
      if (!ANIM || !it.panel.animate) return;
      $$('.ap-lead, .ap-h, .case-list li, .todo-list li, .ap-note, .ap-fig, .lawyer-mini, .ap-side .btn', it.panel).forEach(function (n, i) {
        n.animate([{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], { duration: 420, delay: 80 + Math.min(i, 16) * 28, easing: 'cubic-bezier(0.23, 1, 0.32, 1)', fill: 'backwards' });
      });
    }
    function setOpen(it, open, opts) {
      opts = opts || {};
      it.btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      it.el.classList.toggle('is-open', open);
      var p = it.panel;
      clearTimeout(p.__t);
      if (open) {
        p.hidden = false;
        if (ANIM && !opts.instant) {
          p.style.gridTemplateRows = '0fr';
          void p.offsetHeight;
          p.style.gridTemplateRows = '';
          animateIn(it);
        }
      } else if (ANIM && !opts.instant && !p.hidden) {
        p.style.gridTemplateRows = '0fr';
        p.__t = setTimeout(function () { p.hidden = true; p.style.gridTemplateRows = ''; }, 400);
      } else { p.hidden = true; p.style.gridTemplateRows = ''; }
    }
    function toggle(it) {
      var opening = it.btn.getAttribute('aria-expanded') !== 'true';
      if (opening) {
        var before = it.btn.getBoundingClientRect().top;
        items.forEach(function (o) { if (o !== it && o.btn.getAttribute('aria-expanded') === 'true') setOpen(o, false, { instant: true }); });
        var after = it.btn.getBoundingClientRect().top;
        scrollByPx(after - before);
      }
      setOpen(it, opening);
      softRefresh(500);
    }
    items.forEach(function (it, k) {
      setOpen(it, false, { instant: true });
      it.btn.addEventListener('click', function () { toggle(it); });
      it.btn.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowDown') n = k + 1; else if (e.key === 'ArrowUp') n = k - 1;
        else if (e.key === 'Home') n = 0; else if (e.key === 'End') n = items.length - 1;
        if (n === null) return;
        e.preventDefault();
        items[(n + items.length) % items.length].btn.focus();
      });
    });
    var h = location.hash.slice(1);
    items.forEach(function (it) { if (it.panel.id === h) setOpen(it, true, { instant: true }); });
    areasApi = {
      open: function (key, instant) {
        var hit = null;
        items.forEach(function (it) { if (it.key === key) hit = it; });
        if (!hit) return null;
        items.forEach(function (o) { if (o !== hit) setOpen(o, false, { instant: true }); });
        if (hit.btn.getAttribute('aria-expanded') !== 'true') setOpen(hit, true, { instant: !!instant });
        softRefresh(200);
        return hit.el;
      }
    };

    // Vorschau: Duoton-Foto folgt dem Zeiger mit Trägheit und leichter Neigung
    var peek = $('[data-peek]');
    if (!peek || !finePointer() || STATIC) return;
    var wrap = peek.parentNode, imgs = $$('img', peek), label = $('[data-peek-label]', peek);
    var cur = { x: 0, y: 0, r: 0 }, tg = { x: 0, y: 0 }, raf = 0, on = false, lastX = 0, shown = -1;
    function tick() {
      raf = 0;
      var px = cur.x;
      cur.x += (tg.x - cur.x) * .14; cur.y += (tg.y - cur.y) * .14;
      var v = cur.x - px;
      cur.r += (clamp(v * .5, -7, 7) - cur.r) * .12;
      peek.style.transform = 'translate3d(' + cur.x.toFixed(1) + 'px,' + cur.y.toFixed(1) + 'px,0) rotate(' + cur.r.toFixed(2) + 'deg)';
      if (on || Math.abs(tg.x - cur.x) > .3 || Math.abs(cur.r) > .05) raf = requestAnimationFrame(tick);
    }
    list.addEventListener('pointermove', function (e) {
      var btn = e.target.closest('.area-btn');
      var wr = wrap.getBoundingClientRect();
      tg.x = clamp(e.clientX - wr.left + 28, 0, wr.width - 280);
      tg.y = e.clientY - wr.top - 90;
      if (!btn) { if (on) { on = false; peek.classList.remove('is-on'); } return; }
      var i = +btn.getAttribute('data-peek-i');
      if (!on) { cur.x = tg.x; cur.y = tg.y; on = true; peek.classList.add('is-on'); }
      if (i !== shown) { imgs.forEach(function (im, k) { im.classList.toggle('is-on', k === i); }); shown = i; }
      if (label) label.textContent = btn.getAttribute('aria-expanded') === 'true' ? 'Schließen' : 'Öffnen';
      if (!raf) raf = requestAnimationFrame(tick);
      lastX = e.clientX;
    });
    list.addEventListener('pointerleave', function () { on = false; peek.classList.remove('is-on'); });
    list.addEventListener('click', function (e) {
      var btn = e.target.closest('.area-btn');
      if (btn && label) label.textContent = btn.getAttribute('aria-expanded') === 'true' ? 'Schließen' : 'Öffnen';
    });
  });

  /* ===== Ziffern-Rolle =================================================== */
  function Odo(host, digits, pad) {
    host.textContent = '';
    host.classList.add('odo');
    var cols = [];
    for (var k = 0; k < digits; k++) {
      var dd = el('span', 'odo-d'), strip = el('span', 'odo-strip');
      strip.style.setProperty('--k', digits - 1 - k);
      for (var n = 0; n < 10; n++) strip.appendChild(el('span', null, String(n)));
      dd.appendChild(strip); host.appendChild(dd); cols.push({ d: dd, s: strip });
    }
    return {
      set: function (v) {
        var s = String(Math.max(0, Math.round(v)));
        while (s.length < digits) s = '0' + s;
        s = s.slice(-digits);
        var lead = true;
        cols.forEach(function (c, i) {
          var n = +s[i];
          if (n !== 0 || i === digits - 1 || pad) lead = false;
          c.d.style.display = lead ? 'none' : '';
          c.s.style.transform = 'translateY(' + (-n) + 'em)';
        });
      }
    };
  }

  // § 3 Drei Wochen: Tage werden mit dem Scroll durchgestrichen
  later(function weeks() {
    var box = $('[data-weeks]');
    if (!box || !GS) return;
    var cells = $$('.weeks-grid i', box), nEl = $('[data-weeks-n]', box), unit = $('[data-weeks-unit]', box), pre = $('.weeks-pre', box);
    var odo = Odo(nEl, 2, true); odo.set(21);
    var last = -1;
    window.ScrollTrigger.create({
      trigger: box, start: 'top 78%', end: 'bottom 32%',
      onUpdate: function (s) {
        var n = Math.round(s.progress * cells.length);
        if (n === last) return;
        last = n;
        cells.forEach(function (c, k) { c.classList.toggle('is-x', k < n); });
        odo.set(cells.length - n);
        var over = n >= cells.length;
        box.classList.toggle('is-over', over);
        if (unit) unit.textContent = cells.length - n === 1 ? 'Tag' : 'Tage';
      }
    });
  });

  // Kosten: Beträge rollen beim ersten Erscheinen ein
  later(function costOdos() {
    if (!ANIM || !('IntersectionObserver' in window)) return;
    var nums = $$('.odo-num');
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        var host = e.target, v = +host.textContent;
        var sr = el('span', 'sr-only', String(v)), vis = el('span');
        vis.setAttribute('aria-hidden', 'true');
        host.textContent = ''; host.appendChild(sr); host.appendChild(vis);
        host.classList.add('is-odo');
        var o = Odo(vis, Math.max(1, String(v).length));
        o.set(0);
        requestAnimationFrame(function () { requestAnimationFrame(function () { o.set(v); }); });
      });
    }, { threshold: .6 });
    nums.forEach(function (n) { io.observe(n); });
  });

  /* ===== § 3 Fristen-Hinweis ============================================= */
  var deadlineState = { type: 'kuendigung', date: null };
  later(function deadline() {
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
    var first = true, leftOdo = null;

    // „noch 23 Tage“ – Zahl als Ziffern-Rolle, für Screenreader als Text
    function setLeftCount(n, unitTxt) {
      if (!ANIM) { leftEl.textContent = 'noch ' + n + ' ' + unitTxt; return; }
      if (!leftOdo) {
        leftEl.textContent = '';
        leftEl.appendChild(d.createTextNode('noch '));
        var vis = el('span'); vis.setAttribute('aria-hidden', 'true');
        var sr = el('span', 'sr-only');
        var unit = el('span');
        leftEl.appendChild(vis); leftEl.appendChild(sr); leftEl.appendChild(d.createTextNode(' ')); leftEl.appendChild(unit);
        leftOdo = { o: Odo(vis, 3), sr: sr, unit: unit };
        leftOdo.o.set(0);
      }
      leftOdo.sr.textContent = String(n);
      leftOdo.unit.textContent = unitTxt;
      var o = leftOdo.o;
      requestAnimationFrame(function () { o.set(n); });
    }
    function setLeftText(txt) { leftOdo = null; leftEl.textContent = txt; }

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
      var c = el('div', cls);
      c.style.setProperty('--n', n);
      if (html.m) c.appendChild(el('span', 'm', html.m));
      c.appendChild(d.createTextNode(html.t));
      return c;
    }

    function renderWeeks(start, end) {
      var wrap = el('div', 'cal');
      var headEl = el('p', 'cal-head');
      var s = el('strong', null, start.getMonth() === end.getMonth() ? fmtMonthLong.format(start) : fmtMonth.format(start).replace('.', '') + ' – ' + fmtMonthLong.format(end));
      headEl.appendChild(s); headEl.appendChild(el('span', null, dayDiff(start, end) + ' Tage')); wrap.appendChild(headEl);
      var grid = el('div', 'cal-grid');
      ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].forEach(function (w) { grid.appendChild(el('div', 'cal-wd', w)); });
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
      var lg = el('ul', 'cal-legend');
      [['k-start', 'Zugang'], ['k-in', 'Frist läuft'], ['k-end', 'rechnerisches Ende'], ['k-hol', 'Feiertag']].forEach(function (x) {
        var li = el('li'); li.appendChild(el('i', x[0])); li.appendChild(d.createTextNode(x[1])); lg.appendChild(li);
      });
      wrap.appendChild(lg);
      return wrap;
    }

    function renderMonths(start, end, mode) {
      var wrap = el('div', 'cal');
      var headEl = el('p', 'cal-head');
      var s = el('strong'), info = el('span');
      var grid = el('div', 'months');
      var cur = noon(start.getFullYear(), start.getMonth(), 1), last = noon(end.getFullYear(), end.getMonth(), 1), n = 0, count = 0;
      while (cur <= last && count < 30) {
        var cls = 'mo', lab = fmtMonth.format(cur).replace('.', ''), sub = String(cur.getFullYear());
        var isFirst = cur.getFullYear() === start.getFullYear() && cur.getMonth() === start.getMonth();
        var isLast = cur.getFullYear() === last.getFullYear() && cur.getMonth() === last.getMonth();
        if (mode === 'lost') {
          if (isLast) { cls += ' now'; sub = 'ab jetzt'; } else cls += ' lost';
        } else {
          if (isFirst) { cls += ' start'; sub = 'Zugang ' + start.getDate() + '.'; }
          if (isLast) { cls += ' end'; sub = 'bis ' + end.getDate() + '.'; }
        }
        var mo = el('div', cls); mo.style.setProperty('--n', n++);
        mo.appendChild(el('span', null, lab)); mo.appendChild(el('small', null, sub)); grid.appendChild(mo);
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
        endEl.textContent = '–'; setLeftText('');
        return;
      }
      var view;
      if (cfg.rule.type === 'none') {
        var months = Math.max(0, (td.getFullYear() - start.getFullYear()) * 12 + td.getMonth() - start.getMonth());
        kicker.textContent = 'Seit der Trennung · Orientierung';
        if (start > td) { endEl.textContent = 'Datum liegt in der Zukunft'; setLeftText('Bitte prüfen Sie die Eingabe'); return; }
        endEl.textContent = months === 0 ? 'Noch kein Monat verloren' : months + (months === 1 ? ' Monat' : ' Monate') + ' ohne Aufforderung?';
        setLeftText(months === 0 ? 'Jetzt schriftlich auffordern' : 'Für diese Zeit meist nicht nachforderbar');
        if (months > 0) leftEl.classList.add('is-past');
        shiftEl.hidden = false;
        shiftEl.textContent = 'Gilt nur, wenn Sie bisher nicht schriftlich zur Auskunft aufgefordert haben. Unterhalt ab dem laufenden Monat lässt sich mit einer Aufforderung jetzt noch sichern.';
        view = renderMonths(noon(start.getFullYear(), start.getMonth(), 1), td, 'lost');
      } else {
        var r = compute(cfg.rule, start);
        kicker.textContent = 'Rechnerisches Fristende · Orientierung';
        endEl.textContent = fmtLong.format(r.end).replace(/(\d+\.) /, '$1 ');
        var left = dayDiff(td, r.end);
        if (start > td) setLeftText('Das Datum liegt in der Zukunft – bitte prüfen');
        else if (left > 1) setLeftCount(left, 'Tage');
        else if (left === 1) setLeftText('noch 1 Tag – bitte heute handeln');
        else if (left === 0) setLeftText('heute – bitte sofort anrufen');
        else { setLeftText('rechnerisch seit ' + Math.abs(left) + (Math.abs(left) === 1 ? ' Tag' : ' Tagen') + ' abgelaufen'); leftEl.classList.add('is-past'); }
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
    first = false;
    $$('[data-magnetic]', box).forEach(magnetic);
  });

  // § 4 Akten fächern sich auf + Zeitstrahl mit Marginalien
  later(function files() {
    var wrap = $('[data-tl-wrap]');
    if (!wrap) return;
    var steps = $$('.tl-step', wrap);
    var folders = $$('[data-fan] .folder');
    var fill = $('[data-tl-fill]', wrap);
    var count = $('[data-files-n]');
    var fan = $('[data-fan]');
    var active = -1;
    function fanTo(i) {
      folders.forEach(function (f, k) {
        var kk = k - i;
        f.style.setProperty('--k', kk);
        f.classList.toggle('is-past', kk < 0);
        f.classList.toggle('is-active', kk === 0);
        f.classList.toggle('is-next', kk > 0);
        f.style.zIndex = String(20 - Math.abs(kk) * 2 + (kk < 0 ? 1 : 0));
      });
    }
    function setActive(i) {
      if (i === active) return;
      active = i;
      steps.forEach(function (s, k) { s.classList.toggle('is-active', k === i); s.classList.toggle('is-past', k < i); });
      if (count) count.textContent = String(i + 1);
      if (!isMobile()) fanTo(i);
    }
    var near = true;
    function track() {
      var vh = window.innerHeight, r = wrap.getBoundingClientRect(), line = vh * 0.5;
      var p = clamp((line - r.top) / Math.max(1, r.height), 0, 1);
      if (fill && ANIM) fill.style.transform = 'scaleY(' + p.toFixed(4) + ')';
      var idx = 0;
      for (var k = 0; k < steps.length; k++) if (steps[k].getBoundingClientRect().top < line) idx = k;
      setActive(idx);
    }
    scrollHandlers.push(function () { if (near) track(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { near = es[0].isIntersecting; if (near) track(); }, { rootMargin: '25% 0px 25% 0px' }).observe(wrap);
      // Handy: Akten fächern sich einmal ganz auf, wenn sie ins Bild kommen
      if (fan) new IntersectionObserver(function (es) {
        if (!isMobile()) return;
        fanTo(es[0].isIntersecting || STATIC ? folders.length - 1 : 0);
      }, { threshold: .45 }).observe(fan);
    }
    if (isMobile()) fanTo(STATIC ? folders.length - 1 : 0);
    window.addEventListener('resize', function () { var a = active; active = -1; setActive(Math.max(0, a)); if (isMobile()) fanTo(folders.length - 1); });
    track();
  });

  // § 5 Siegel drehen sich mit dem Scroll
  later(function seals() {
    if (!GS) return;
    $$('[data-seal-ring]').forEach(function (g) {
      window.gsap.fromTo(g, { rotation: -50, svgOrigin: '60 60' }, { rotation: 50, svgOrigin: '60 60', ease: 'none', scrollTrigger: { trigger: g.closest('.lawyer'), start: 'top bottom', end: 'bottom top', scrub: 0.6 } });
    });
  });

  // § 6 Leserbriefe: horizontale Strecke mit Tiefe (sticky, kein Pin)
  later(function letters() {
    var track = $('[data-letters]'), row = $('[data-letters-row]');
    if (!track || !row || !GS) return;
    var gsap = window.gsap, ST = window.ScrollTrigger, mm = gsap.matchMedia();
    var cards = $$('.letter', row).map(function (c) { return { el: c, depth: +c.getAttribute('data-depth') || 1, r: c.style.getPropertyValue('--r') || '0deg' }; });
    mm.add('(min-width: 900px)', function () {
      root.classList.add('hstrip');
      var travel = 0;
      function measure() {
        travel = Math.max(0, row.scrollWidth - window.innerWidth);
        track.style.setProperty('--travel', travel + 'px');
      }
      function apply(p) {
        row.style.transform = 'translate3d(' + (-p * travel).toFixed(1) + 'px,0,0)';
        cards.forEach(function (c) {
          var x = (c.depth - 1) * p * Math.min(travel, 900) * 0.32;
          var y = (c.depth - 1) * (p - .5) * -60;
          c.el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) rotate(' + c.r + ')';
        });
      }
      measure();
      ST.addEventListener('refreshInit', measure);
      var st = ST.create({ trigger: track, start: 'top top', end: 'bottom bottom', onUpdate: function (s) { apply(s.progress); }, onRefresh: function (s) { apply(s.progress); } });
      apply(0);
      return function () {
        ST.removeEventListener('refreshInit', measure);
        st.kill();
        root.classList.remove('hstrip');
        row.style.transform = '';
        cards.forEach(function (c) { c.el.style.transform = ''; });
        track.style.removeProperty('--travel');
      };
    });
  });

  // § 7 Einzugsgebiet: Liste ↔ Karte
  later(function region() {
    var svg = $('[data-region]'), list = $('[data-towns]');
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
  });

  // Karte: Ausschnitt auf schmalen Bildschirmen, Fußweg zeichnet sich
  later(function map() {
    var mapEl = $('[data-map]');
    if (!mapEl) return;
    if (window.matchMedia) {
      var mq = window.matchMedia('(max-width: 599.98px)'), full = mapEl.getAttribute('viewBox');
      var apply = function () { mapEl.setAttribute('viewBox', mq.matches ? '424 150 476 352' : full); mapEl.classList.toggle('is-crop', mq.matches); };
      apply();
      if (mq.addEventListener) mq.addEventListener('change', apply); else if (mq.addListener) mq.addListener(apply);
    }
    var route = $('[data-map-route]');
    if (!route || STATIC || !('IntersectionObserver' in window)) return;
    var ns = 'http://www.w3.org/2000/svg', defs = $('defs', mapEl);
    var mask = d.createElementNS(ns, 'mask');
    mask.setAttribute('id', 'route-mask'); mask.setAttribute('maskUnits', 'userSpaceOnUse');
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
        mp.style.transition = 'stroke-dashoffset 1.6s cubic-bezier(0.77, 0, 0.175, 1) .3s';
        mp.style.strokeDashoffset = '0';
      });
    }, { threshold: 0.35 });
    io.observe(mapEl);
  });

  /* ===== § 8 FAQ mit Live-Suche ========================================= */
  later(function faq() {
    var wrap = $('[data-faq]');
    if (!wrap) return;
    var input = $('[data-faq-q]', wrap);
    var clearBtn = $('[data-faq-clear]', wrap);
    var countEl = $('[data-faq-count]', wrap);
    var emptyEl = $('[data-faq-empty]', wrap);
    var cats = $$('[data-cat]', $('[data-faq-cats]', wrap));
    function norm(s) {
      return String(s).toLowerCase()
        .replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss')
        .replace(/ae/g, 'a').replace(/oe/g, 'o').replace(/ue/g, 'u')
        .replace(/[^a-z0-9§ ]+/g, ' ');
    }
    var items = $$('.qa', wrap).map(function (q0) {
      var q = $('.qa-q', q0), a = $('.qa-a', q0);
      return {
        el: q0, q: q, a: a, qOrig: q.cloneNode(true), aOrig: a.cloneNode(true),
        cats: (q0.getAttribute('data-cat') || '').split(/\s+/),
        hay: norm(q.textContent + ' ' + a.textContent + ' ' + (q0.getAttribute('data-keys') || ''))
      };
    });
    var total = items.length, cat = 'alle', countT;
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
      var nodes = [], n, hit = false;
      while ((n = walker.nextNode())) nodes.push(n);
      nodes.forEach(function (node) {
        var text = node.nodeValue;
        re.lastIndex = 0;
        if (!re.test(text)) return;
        re.lastIndex = 0;
        var frag = d.createDocumentFragment(), last = 0, m;
        while ((m = re.exec(text))) {
          if (!m[0].length) { re.lastIndex++; continue; }
          if (m.index > last) frag.appendChild(d.createTextNode(text.slice(last, m.index)));
          frag.appendChild(el('mark', null, m[0]));
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
        var ok = (cat === 'alle' || it.cats.indexOf(cat) > -1) && toks.every(function (t) { return it.hay.indexOf(t) > -1; });
        it.el.hidden = !ok;
        var hint = $('.qa-hint', it.el);
        if (hint) hint.remove();
        if (ok) {
          shown++;
          if (re) {
            var inQ = highlight(it.q, re);
            highlight(it.a, re);
            if (!inQ) it.q.appendChild(el('span', 'qa-hint', 'Treffer in der Antwort'));
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
      input.addEventListener('keydown', function (e) { if (e.key === 'Escape' && input.value) { e.preventDefault(); input.value = ''; run(); } });
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
  });

  /* ===== § 9 Erstberatung: ruhiger Schritt-Dialog ======================= */
  later(function wizard() {
    var form = $('[data-wizard]');
    if (!form) return;
    var steps = $$('.wz-step', form);
    var nav = $$('[data-steps-nav] li');
    var back = $('[data-wz-back]', form);
    var next = $('[data-wz-next]', form);
    var submit = $('[data-wz-submit]', form);
    var status = $('[data-wz-status]', form);
    var done = $('[data-wz-done]');
    var trail = $('[data-wz-trail]');
    var titles = ['Rechtsgebiet', 'Ihr Anliegen', 'Dringlichkeit', 'Kontakt'];
    var cur = 1;
    var ta = $('#f-fall', form);
    var countN = $('[data-count-n]', form);
    var countWrap = $('[data-count]', form);
    var countBar = $('[data-count-bar]', form);
    var fristField = $('[data-frist-field]', form);
    function checked(name) { return $('input[name="' + name + '"]:checked', form); }

    // Bisherige Angaben als gesetzte Zeilen über dem aktuellen Schritt
    function buildTrail(n) {
      if (!trail) return;
      trail.textContent = '';
      var rows = [];
      if (n > 1) { var g = checked('gebiet'); rows.push([1, 'Rechtsgebiet', g ? g.value : '–']); }
      if (n > 2) { var f = ta.value.trim(); rows.push([2, 'Anliegen', f.length > 70 ? f.slice(0, 70).replace(/\s+\S*$/, '') + ' …' : f]); }
      if (n > 3) {
        var u = checked('dringlichkeit'), fr = fromISO(($('#f-frist', form) || {}).value);
        rows.push([3, 'Dringlichkeit', (u ? u.value : '–') + (u && u.hasAttribute('data-urgent') && fr ? ' (Schreiben vom ' + fr.toLocaleDateString('de-DE') + ')' : '')]);
      }
      rows.forEach(function (r) {
        var li = el('li');
        li.appendChild(el('span', 'tr-k', 'Abs. ' + r[0] + ' · ' + r[1]));
        li.appendChild(el('span', 'tr-v', r[2]));
        var b = el('button', null, 'ändern');
        b.type = 'button';
        b.setAttribute('aria-label', r[1] + ' ändern');
        b.addEventListener('click', function () { showStep(r[0]); });
        li.appendChild(b);
        trail.appendChild(li);
      });
      trail.hidden = !rows.length;
    }

    function showStep(n, opts) {
      opts = opts || {};
      cur = n;
      steps.forEach(function (s) { s.classList.toggle('is-active', +s.getAttribute('data-step') === n); });
      nav.forEach(function (li, k) {
        li.classList.toggle('is-current', k === n - 1);
        li.classList.toggle('is-done', k < n - 1);
        if (k === n - 1) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
      });
      back.hidden = n === 1;
      next.hidden = n === steps.length;
      submit.hidden = n !== steps.length;
      if (status) status.textContent = 'Schritt ' + n + ' von ' + steps.length + ' – ' + titles[n - 1];
      buildTrail(n);
      var step = steps[n - 1];
      if (ANIM && !opts.instant && step.animate) {
        step.animate([{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { duration: 300, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' });
      }
      if (opts.focus !== false && !opts.instant) {
        var lg = $('.wz-legend', step);
        var r = form.getBoundingClientRect();
        if (r.top < headH() || r.top > window.innerHeight * 0.6) scrollToEl(form.parentNode);
        setTimeout(function () { try { lg.focus({ preventScroll: true }); } catch (e) { } }, 30);
      }
    }

    function setError(name, msg, field) {
      var e = $('[data-error-for="' + name + '"]', form);
      if (!e) return;
      if (!e.id) e.id = 'err-' + name;
      e.hidden = !msg;
      (field ? [field] : []).forEach(function (f) {
        var db = (f.getAttribute('aria-describedby') || '').split(' ').filter(function (x) { return x && x !== e.id; });
        if (msg) { f.setAttribute('aria-invalid', 'true'); db.push(e.id); }
        else f.removeAttribute('aria-invalid');
        if (db.length) f.setAttribute('aria-describedby', db.join(' ')); else f.removeAttribute('aria-describedby');
      });
    }

    function validate(n) {
      var firstBad = null;
      function bad(x) { if (!firstBad) firstBad = x; }
      if (n === 1) { var g = checked('gebiet'); setError('gebiet', g ? '' : 'x'); if (!g) bad($('input[name="gebiet"]', form)); }
      if (n === 2) { var ok = ta.value.trim().length >= FORM.minChars; setError('fall', ok ? '' : 'x', ta); if (!ok) bad(ta); }
      if (n === 3) { var u = checked('dringlichkeit'); setError('dringlichkeit', u ? '' : 'x'); if (!u) bad($('input[name="dringlichkeit"]', form)); }
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
    form.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'checkbox' && cur < steps.length) { e.preventDefault(); next.click(); }
    });
    form.addEventListener('change', function (e) {
      var n = e.target.name;
      if (n === 'gebiet') setError('gebiet', '');
      if (n === 'dringlichkeit') { setError('dringlichkeit', ''); fristField.hidden = !e.target.hasAttribute('data-urgent'); }
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
    function updateCount() {
      var n = ta.value.length;
      countN.textContent = String(n);
      countWrap.classList.toggle('is-ok', n >= FORM.minChars && n < FORM.maxChars * 0.9);
      countWrap.classList.toggle('is-near', n >= FORM.maxChars * 0.9);
      if (countBar) countBar.style.transform = 'scaleX(' + (n / FORM.maxChars).toFixed(3) + ')';
      if (n >= FORM.minChars) setError('fall', '', ta);
    }
    ta.addEventListener('input', updateCount);
    updateCount();

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      for (var n = 1; n <= steps.length; n++) {
        var bad = validate(n);
        if (bad) { if (n !== cur) showStep(n, { focus: false }); bad.focus(); return; }
      }
      var sum = $('[data-done-sum]', done);
      sum.textContent = '';
      function row(k, v) { if (!v) return; sum.appendChild(el('dt', null, k)); sum.appendChild(el('dd', null, v)); }
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
      if (trail) trail.hidden = true;
      done.hidden = false;
      nav.forEach(function (li) { li.classList.remove('is-current'); li.classList.add('is-done'); li.removeAttribute('aria-current'); });
      var stamp = $('.done-stamp', done);
      if (ANIM && stamp && stamp.animate) stamp.animate([{ opacity: 0, transform: 'rotate(-16deg) scale(1.22)' }, { opacity: 1, transform: 'rotate(-9deg) scale(1)' }], { duration: 340, easing: 'cubic-bezier(0.23, 1, 0.32, 1)', fill: 'backwards', delay: 120 });
      scrollToEl(done.parentNode);
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
        else buildTrail(cur);
      }
    };
  });

  // Aktionsleiste (Handy): bei Formulareingabe ausblenden
  later(function actionbar() {
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
  });

  // Foto-Parallaxe (nur Desktop)
  later(function parallax() {
    if (!GS) return;
    var gsap = window.gsap, mm = gsap.matchMedia();
    mm.add('(min-width: 900px)', function () {
      $$('[data-parallax]').forEach(function (box) {
        var img = $('img', box);
        if (!img) return;
        gsap.fromTo(img, { yPercent: -4, scale: 1.1 }, { yPercent: 4, scale: 1.1, ease: 'none', scrollTrigger: { trigger: box, start: 'top bottom', end: 'bottom top', scrub: true } });
      });
    });
  });

  // Fußnoten als Randnotiz am Zeiger (feiner Zeiger); sonst Sprung zur Fußnote
  later(function footnotes() {
    if (!finePointer()) return;
    var pop = el('div', 'fn-pop'); pop.setAttribute('aria-hidden', 'true');
    d.body.appendChild(pop);
    var hideT;
    function show(a) {
      var li = d.getElementById(a.getAttribute('href').slice(1));
      if (!li) return;
      clearTimeout(hideT);
      pop.textContent = '';
      pop.appendChild(el('b', null, a.textContent.trim()));
      pop.appendChild(d.createTextNode(($('.fn-t', li) || li).textContent));
      var r = a.getBoundingClientRect();
      pop.style.left = '0px'; pop.style.top = '0px';
      var w = pop.offsetWidth, h = pop.offsetHeight;
      var x = clamp(r.left + window.pageXOffset - 12, 8, window.innerWidth - w - 16);
      pop.style.left = x + 'px';
      pop.style.top = (r.top + window.pageYOffset - h - 10) + 'px';
      pop.classList.add('is-on');
    }
    function hide() { hideT = setTimeout(function () { pop.classList.remove('is-on'); }, 80); }
    $$('.fn').forEach(function (a) {
      a.addEventListener('mouseenter', function () { show(a); });
      a.addEventListener('focus', function () { show(a); });
      a.addEventListener('mouseleave', hide);
      a.addEventListener('blur', hide);
    });
  });

  // Magnetisch auch im Formular
  later(function magnets() { $$('[data-magnetic]').forEach(magnetic); });

  // Zum Schluss: einmal neu messen, Direktaufruf mit Anker
  later(function finish() {
    if (hasGsap) softRefresh(60);
    measureRibbon(); onScroll();
    if (location.hash && location.hash.length > 1) {
      var target = d.getElementById(location.hash.slice(1));
      if (target) setTimeout(function () { scrollToEl(target, true); }, 140);
    }
  });

  /* ===== Start ========================================================== */
  // Erst nach dem ersten Bild: die Titelseite steht, dann der Rest in Häppchen
  requestAnimationFrame(function () { setTimeout(function () { idle(runQueue); }, 60); });
  var fontsReady = d.fonts && d.fonts.ready ? d.fonts.ready : Promise.resolve();
  Promise.race([fontsReady, new Promise(function (r) { setTimeout(r, 900); })]).then(function () {
    root.classList.add('is-loaded');
    softRefresh(400);
  });
  window.addEventListener('load', function () { measureRibbon(); onScroll(); softRefresh(200); });
  onScroll();
})();
