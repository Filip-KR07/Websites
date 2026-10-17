/* ==========================================================================
   Tierarztpraxis Pfotenwerk · Modell „Pfote“ (Demo)
   Ohne Build-Schritt. Optional: GSAP + ScrollTrigger, Lenis (assets/vendor).
   Alle fachlichen Werte stehen als Konstanten direkt hier oben.
   ========================================================================== */
(function () {
  'use strict';
  window.__pfoteReady = true;

  /* ------------------------------------------------------------------
     Stammdaten – hier anpassen
     ------------------------------------------------------------------ */
  var TZ = 'Europe/Berlin';
  /* Sprechzeiten je Wochentag (0 = So … 6 = Sa) als [von, bis] in Stunden (8.5 = 8:30) */
  var HOURS = {
    0: [],
    1: [[8, 12], [15, 19]],
    2: [[8, 12], [15, 19]],
    3: [[8, 12], [15, 19]],
    4: [[8, 12], [15, 19]],
    5: [[8, 12], [15, 19]],
    6: [[9, 12]]
  };
  var CLOSING_SOON_MIN = 30;   // „Schließt bald“ X Minuten vor Ende
  var OPENING_SOON_MIN = 60;   // „Öffnet um …“ (gelb) X Minuten vor Beginn
  var DAYBAR_RANGE = [6, 21];  // Tagesleiste im Hero: von–bis (Stunden)

  /* Notfall-Wegweiser: Stufe je Anzeichen für [Hund, Katze, Kleintier]
     3 = sofort anrufen · 2 = heute Termin · 1 = Termin vereinbaren · 0 = nicht zutreffend */
  var SYMPTOMS = {
    'atemnot':        { name: 'Atemnot', l: [3, 3, 3], tip: 'Ruhig halten, nicht in Rückenlage bringen, für frische Luft sorgen.' },
    'schleimhaut':    { name: 'blasse oder bläuliche Schleimhäute', l: [3, 3, 3], tip: 'Am Telefon beschreiben, wie das Zahnfleisch aussieht: rosa, blass oder bläulich.' },
    'krampf':         { name: 'Krampfanfall', l: [3, 3, 3], tip: 'Nicht festhalten, nichts ins Maul stecken, Kanten abpolstern und die Dauer notieren.' },
    'schwach':        { name: 'plötzliche Schwäche', l: [3, 3, 3], tip: null },
    'hitze':          { name: 'Hitzschlag-Verdacht', l: [3, 3, 3], tip: 'In den Schatten bringen und mit lauwarmem – nicht eiskaltem – Wasser befeuchten.' },
    'gift':           { name: 'Vergiftungsverdacht', l: [3, 3, 3], tip: 'Kein Erbrechen selbst auslösen. Verpackung oder Pflanzenrest mitbringen, Uhrzeit notieren.' },
    'bauch':          { name: 'aufgeblähter Bauch', l: [3, 3, 3], tip: 'Nichts füttern und nicht mehr spazieren gehen.' },
    'erbrechen-mehr': { name: 'wiederholtes Erbrechen', l: [2, 2, 0], tip: 'Wasser in kleinen Mengen anbieten, Futter erst nach Rücksprache.' },
    'erbrechen-1':    { name: 'einmaliges Erbrechen', l: [1, 1, 0], tip: 'Beobachten und Wasser anbieten. Passiert es wieder oder wird Ihr Tier schlapp: anrufen.' },
    'durchfall':      { name: 'Durchfall', l: [1, 1, 2], tip: 'Auf das Trinken achten. Eine frische Kotprobe hilft uns bei der Untersuchung.' },
    'frisst-nicht':   { name: 'frisst nicht', l: [2, 2, 3], tip: 'Notieren, wann Ihr Tier zuletzt gefressen und Kot abgesetzt hat.' },
    'harn':           { name: 'kein Urinabsatz', l: [3, 3, 3], tip: null },
    'blutung':        { name: 'starke Blutung', l: [3, 3, 3], tip: 'Mit einem sauberen Tuch fest auf die Wunde drücken und den Druck halten.' },
    'unfall':         { name: 'Unfall oder Sturz', l: [3, 3, 3], tip: 'Eine Decke als Trage nutzen – auch wenn Ihr Tier äußerlich unverletzt wirkt.' },
    'bein-0':         { name: 'Bein wird nicht belastet', l: [2, 2, 2], tip: 'Bewegung einschränken, nicht selbst schienen.' },
    'lahm':           { name: 'leichtes Lahmen', l: [1, 1, 2], tip: 'Schonung an der Leine. Wird es schlechter, lieber früher kommen.' },
    'auge':           { name: 'Augenproblem', l: [2, 2, 2], tip: 'Nicht reiben lassen und keine Tropfen aus der Hausapotheke verwenden.' },
    'husten':         { name: 'Husten oder Niesen', l: [1, 1, 2], tip: null },
    'haut':           { name: 'Juckreiz', l: [1, 1, 1], tip: null }
  };
  var SPECIES_IDX = { hund: 0, katze: 1, klein: 2 };
  /* Zusatzhinweise für bestimmte Kombinationen Tierart:Anzeichen */
  var TRIAGE_NOTES = {
    'hund:bauch': 'Ein aufgeblähter Bauch mit erfolglosem Würgen kann bei Hunden auf eine Magendrehung hinweisen.',
    'katze:harn': 'Bei Katern kann eine verlegte Harnröhre innerhalb weniger Stunden gefährlich werden.',
    'katze:gift': 'Lilien sind für Katzen schon in kleinen Mengen giftig – auch Blütenstaub im Fell.',
    'klein:frisst-nicht': 'Bei Kaninchen und Meerschweinchen kann die Verdauung schon nach wenigen Stunden ohne Futter stillstehen.',
    'klein:durchfall': 'Kleintiere verlieren bei Durchfall schnell Flüssigkeit.'
  };

  /* Impfplaner: allgemeine Grundimmunisierung (angelehnt an StIKo Vet), Richtwerte.
     weeks = Lebenswoche, months = Lebensmonat. opt = optional, je nach Alltag. */
  var VACC = {
    welpe: [
      { when: '8. Lebenswoche', weeks: 8, vax: ['Staupe', 'Parvovirose', 'Hepatitis', 'Leptospirose'], opt: ['Zwingerhusten'] },
      { when: '12. Lebenswoche', weeks: 12, vax: ['Staupe', 'Parvovirose', 'Hepatitis', 'Leptospirose', 'Tollwut'], opt: ['Zwingerhusten'] },
      { when: '16. Lebenswoche', weeks: 16, vax: ['Staupe', 'Parvovirose', 'Hepatitis'], opt: [], note: 'Je nach Impfstoff auch Tollwut' },
      { when: '15. Lebensmonat', months: 15, vax: ['Staupe', 'Parvovirose', 'Hepatitis', 'Leptospirose', 'Tollwut'], opt: ['Zwingerhusten'], note: 'Abschluss der Grundimmunisierung' }
    ],
    kitten: [
      { when: '8. Lebenswoche', weeks: 8, vax: ['Katzenseuche', 'Katzenschnupfen'], opt: ['Leukose (FeLV)'] },
      { when: '12. Lebenswoche', weeks: 12, vax: ['Katzenseuche', 'Katzenschnupfen'], opt: ['Tollwut', 'Leukose (FeLV)'] },
      { when: '16. Lebenswoche', weeks: 16, vax: ['Katzenseuche', 'Katzenschnupfen'], opt: [] },
      { when: '15. Lebensmonat', months: 15, vax: ['Katzenseuche', 'Katzenschnupfen'], opt: ['Tollwut', 'Leukose (FeLV)'], note: 'Abschluss der Grundimmunisierung' }
    ]
  };
  var VACC_OPT_LABEL = { welpe: 'Hundeschule, Pension oder Hundewiese geplant', kitten: 'Freigänger – darf nach draußen' };
  var VACC_EXAMPLE_WEEKS = 10;   // Beispiel-Geburtsdatum beim Laden: heute minus X Wochen
  var VACC_MAX_YEARS = 20;       // ältere Daten gelten als Tippfehler

  /* Neupatienten: Gewichtsbereiche je Tierart [min, max, Schritt] für den Schieberegler,
     typisches Gewicht (für die Größe der Silhouette), Plausibilitätsgrenzen und Lebensphasen in Jahren. */
  var PETS = {
    hund:        { name: 'Hund', range: [0.5, 80, 0.1], def: 12, typical: 20, valid: [0.3, 120], young: 1, senior: 8, youngName: 'Welpe' },
    katze:       { name: 'Katze', range: [0.3, 12, 0.1], def: 4.5, typical: 4.5, valid: [0.1, 15], young: 1, senior: 10, youngName: 'Kitten' },
    kaninchen:   { name: 'Kaninchen', range: [0.2, 8, 0.05], def: 2.2, typical: 2.5, valid: [0.1, 10], young: 0.5, senior: 6, youngName: 'Jungtier' },
    meerschwein: { name: 'Meerschweinchen', range: [0.1, 2, 0.05], def: 1, typical: 1, valid: [0.05, 2.5], young: 0.34, senior: 5, youngName: 'Jungtier' },
    anderes:     { name: 'Anderes Tier', range: [0.05, 30, 0.05], def: 0.5, typical: 2, valid: [0.01, 120], young: 0, senior: 99, youngName: '' }
  };
  var ANLIEGEN_FROM_ART = { hund: 'hund', katze: 'katze', klein: 'kaninchen', welpe: 'hund', kitten: 'katze' };

  /* ------------------------------------------------------------------
     Helfer
     ------------------------------------------------------------------ */
  var doc = document.documentElement;
  var qs = function (s, r) { return (r || document).querySelector(s); };
  var qsa = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var pad2 = function (n) { return (n < 10 ? '0' : '') + n; };
  var easeOutCubic = function (t) { return 1 - Math.pow(1 - t, 3); };
  var easeInOutCubic = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var dprMax = function () { return Math.min(window.devicePixelRatio || 1, 2); };
  var NBSP = ' ';

  var motionOff = doc.classList.contains('motion-off');
  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduced = function () { return motionOff || mqReduce.matches; };
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  var mqDesk = window.matchMedia('(min-width: 900px)');
  var hasGSAP = !!(window.gsap && window.ScrollTrigger);
  var lenis = null;

  var numFmt = function (v, d) { return v.toLocaleString('de-DE', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); };
  var kgFmt = function (v) { return v.toLocaleString('de-DE', { maximumFractionDigits: v < 1 ? 2 : (v < 30 ? 1 : 0) }) + NBSP + 'kg'; };

  function safe(name, fn) {
    try { fn(); } catch (err) { if (window.console) console.warn('[Pfotenwerk] ' + name + ':', err); }
  }
  function visibilityGate(el, onChange) {
    var inView = false;
    var update = function () { onChange(inView && !document.hidden); };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) { inView = entries[entries.length - 1].isIntersecting; update(); }, { rootMargin: '60px 0px' }).observe(el);
    } else { inView = true; }
    document.addEventListener('visibilitychange', update);
    update();
  }
  function onceInView(el, fn, opts) {
    if (!('IntersectionObserver' in window)) { fn(); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { io.disconnect(); fn(); } });
    }, opts || { threshold: 0.3 });
    io.observe(el);
  }
  function debounce(fn, ms) { var t; return function () { clearTimeout(t); t = setTimeout(fn, ms); }; }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function hdrH() { var h = qs('[data-hdr]'); return h ? h.offsetHeight : 0; }
  function focusNoScroll(t) {
    if (!t) return;
    if (!t.hasAttribute('tabindex') && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(t.tagName)) t.setAttribute('tabindex', '-1');
    try { t.focus({ preventScroll: true }); } catch (e) { t.focus(); }
  }
  function scrollToEl(target, opts) {
    opts = opts || {};
    doc.classList.add('cv-all'); /* Ziel exakt berechnen: übersprungene Abschnitte einmal rendern */
    var y = Math.max(0, target.getBoundingClientRect().top + window.scrollY - hdrH() - (opts.gap == null ? 14 : opts.gap));
    var done = function () { if (opts.focus !== false) focusNoScroll(opts.focusEl || target); };
    if (lenis) {
      lenis.scrollTo(y, { duration: 1.15, easing: easeInOutCubic, onComplete: done });
    } else {
      window.scrollTo({ top: y, behavior: reduced() ? 'auto' : 'smooth' });
      setTimeout(done, reduced() ? 0 : 650);
    }
  }
  function pawSVG(cls) {
    var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 18 19'); /* Symbol bringt eigene viewBox mit – Außen-SVG ab 0,0, sonst nur ein Ausschnitt der Pfote */
    s.setAttribute('class', cls);
    s.setAttribute('aria-hidden', 'true');
    var u = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    u.setAttribute('href', '#paw');
    s.appendChild(u);
    return s;
  }

  /* ------------------------------------------------------------------
     Smooth Scroll (Lenis) + ScrollTrigger + Anker
     ------------------------------------------------------------------ */
  function initScroll() {
    if (hasGSAP) gsap.registerPlugin(ScrollTrigger);
    if (!reduced() && window.Lenis) {
      lenis = new window.Lenis({ lerp: 0.11, smoothWheel: true });
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
      if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var target = document.getElementById(decodeURIComponent(id.slice(1)));
      if (!target) return;
      e.preventDefault();
      var menu = a.closest('dialog[open]');
      var go = function () {
        scrollToEl(target);
        if (history.pushState) history.pushState(null, '', id);
      };
      if (menu) { closeMenu(); requestAnimationFrame(go); } else go();
    });
  }

  /* ------------------------------------------------------------------
     Header, Navigation, Menü
     ------------------------------------------------------------------ */
  function initHeader() {
    var hdr = qs('[data-hdr]');
    var tick = false;
    var upd = function () { tick = false; if (hdr) hdr.classList.toggle('is-scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
    upd();

    var links = qsa('.nav a[href^="#"]');
    var map = {};
    links.forEach(function (a) { var s = document.getElementById(a.getAttribute('href').slice(1)); if (s) map[s.id] = a; });
    if ('IntersectionObserver' in window && links.length) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          var a = map[e.target.id];
          if (!a) return;
          if (e.isIntersecting) {
            links.forEach(function (l) { l.removeAttribute('aria-current'); });
            a.setAttribute('aria-current', 'true');
          } else if (a.getAttribute('aria-current')) {
            a.removeAttribute('aria-current');
          }
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      Object.keys(map).forEach(function (id) { io.observe(document.getElementById(id)); });
    }
  }

  var closeMenu = function () {};
  function initMenu() {
    var menu = qs('[data-menu]');
    var openBtn = qs('[data-menu-open]');
    if (!menu || !openBtn || typeof menu.showModal !== 'function') {
      if (openBtn) openBtn.addEventListener('click', function () { var t = qs('#leistungen'); if (t) scrollToEl(t); });
      return;
    }
    openBtn.addEventListener('click', function () {
      menu.showModal();
      doc.classList.add('menu-open');
      if (lenis) lenis.stop();
      openBtn.setAttribute('aria-expanded', 'true');
    });
    qsa('[data-menu-close]', menu).forEach(function (b) { b.addEventListener('click', function () { menu.close(); }); });
    menu.addEventListener('click', function (e) { if (e.target === menu) menu.close(); });
    var cleanup = function () {
      doc.classList.remove('menu-open');
      if (lenis) lenis.start();
      openBtn.setAttribute('aria-expanded', 'false');
    };
    closeMenu = function () { if (menu.open) menu.close(); cleanup(); };
    menu.addEventListener('close', cleanup);
    openBtn.setAttribute('aria-expanded', 'false');
    mqDesk.addEventListener('change', function (e) { if (e.matches && menu.open) menu.close(); });
  }

  /* ------------------------------------------------------------------
     Live-Öffnungsstatus (Europe/Berlin)
     ------------------------------------------------------------------ */
  var DAY_KEYS = ['so', 'mo', 'di', 'mi', 'do', 'fr', 'sa'];
  var DAY_SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  function nowBerlin() {
    /* Test-Parameter: ?jetzt=di-10:30 */
    var m = /[?&]jetzt=([a-z]{2})-(\d{1,2}):(\d{2})/i.exec(location.search);
    if (m && DAY_KEYS.indexOf(m[1].toLowerCase()) >= 0) return { day: DAY_KEYS.indexOf(m[1].toLowerCase()), min: (+m[2]) * 60 + (+m[3]) };
    try {
      var parts = new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date());
      var o = {};
      parts.forEach(function (p) { o[p.type] = p.value; });
      var day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(o.weekday);
      if (day < 0) throw new Error('weekday');
      return { day: day, min: ((+o.hour) % 24) * 60 + (+o.minute) };
    } catch (e) {
      var n = new Date();
      return { day: n.getDay(), min: n.getHours() * 60 + n.getMinutes() };
    }
  }
  function H(h) {
    var hh = Math.floor(h), mm = Math.round((h - hh) * 60);
    return hh + (mm ? ':' + pad2(mm) : '') + NBSP + 'Uhr';
  }
  function getStatus(now) {
    var segs = HOURS[now.day] || [];
    var m = now.min;
    for (var i = 0; i < segs.length; i++) {
      var a = segs[i][0] * 60, b = segs[i][1] * 60, later = segs[i + 1];
      if (m >= a && m < b) {
        if (b - m <= CLOSING_SOON_MIN) {
          return { state: 'soon', open: true, laterToday: later ? later[0] : null,
            short: 'Schließt um ' + H(segs[i][1]),
            long: 'Schließt um ' + H(segs[i][1]) + (later ? ' – ab ' + H(later[0]) + ' wieder geöffnet' : ' – Notfälle: Hotline rund um die Uhr') };
        }
        return { state: 'open', open: true, laterToday: later ? later[0] : null,
          short: 'Geöffnet · bis ' + H(segs[i][1]),
          long: 'Jetzt geöffnet – bis ' + H(segs[i][1]) + (later ? ', ab ' + H(later[0]) + ' wieder' : '') };
      }
      if (m < a) {
        if (i > 0) {
          return { state: 'break', open: false, laterToday: segs[i][0],
            short: 'Mittagspause · ab ' + H(segs[i][0]),
            long: 'Mittagspause – ab ' + H(segs[i][0]) + ' wieder geöffnet. Notfälle: Hotline' };
        }
        if (a - m <= OPENING_SOON_MIN) {
          return { state: 'soon', open: false, laterToday: segs[i][0],
            short: 'Öffnet um ' + H(segs[i][0]),
            long: 'Öffnet heute um ' + H(segs[i][0]) + ' – Notfälle: Hotline rund um die Uhr' };
        }
        return { state: 'closed', open: false, laterToday: segs[i][0],
          short: 'Geschlossen · ab ' + H(segs[i][0]),
          long: 'Noch geschlossen – heute ab ' + H(segs[i][0]) + '. Notfälle: Hotline 24' + NBSP + 'h' };
      }
    }
    for (var k = 1; k <= 7; k++) {
      var d = (now.day + k) % 7, s = HOURS[d] || [];
      if (s.length) {
        var when = k === 1 ? 'morgen' : DAY_SHORT[d];
        return { state: 'closed', open: false, laterToday: null,
          short: 'Geschlossen · ' + when + ' ab ' + H(s[0][0]),
          long: 'Geschlossen – wieder ' + when + ' ab ' + H(s[0][0]) + '. Notfälle: Hotline 24' + NBSP + 'h' };
      }
    }
    return { state: 'closed', open: false, laterToday: null, short: 'Geschlossen', long: 'Geschlossen' };
  }
  var currentStatus = null;
  var statusListeners = [];
  function initStatus() {
    var nodes = qsa('[data-status]');
    var rows = qsa('.hours__table tr[data-day]');
    var bar = qs('[data-daybar]');
    var track = bar && qs('.daybar__track', bar);
    var nowMark = bar && qs('[data-daybar-now]', bar);
    var lastDay = -1;
    function update() {
      var now = nowBerlin();
      var st = getStatus(now);
      currentStatus = st;
      nodes.forEach(function (n) {
        n.setAttribute('data-state', st.state);
        var s = qs('[data-status-short]', n), l = qs('[data-status-long]', n);
        if (s) s.textContent = st.short;
        if (l) l.textContent = st.long;
        var w = qs('[data-status-word]', n);
        if (w) w.textContent = st.state === 'soon' ? (st.open ? STATUS_WORD['soon-open'] : STATUS_WORD['soon-closed']) : (STATUS_WORD[st.state] || 'Sprechzeiten');
      });
      rows.forEach(function (r) { r.classList.toggle('is-today', +r.getAttribute('data-day') === now.day); });
      if (track && lastDay !== now.day) {
        lastDay = now.day;
        qsa('.daybar__seg', track).forEach(function (x) { x.remove(); });
        var span = DAYBAR_RANGE[1] - DAYBAR_RANGE[0];
        (HOURS[now.day] || []).forEach(function (sg) {
          var seg = el('span', 'daybar__seg');
          seg.style.left = ((sg[0] - DAYBAR_RANGE[0]) / span * 100) + '%';
          seg.style.width = ((sg[1] - sg[0]) / span * 100) + '%';
          track.appendChild(seg);
        });
      }
      if (nowMark) {
        var h = now.min / 60;
        var inRange = h >= DAYBAR_RANGE[0] && h <= DAYBAR_RANGE[1];
        nowMark.classList.toggle('is-on', inRange);
        if (inRange) nowMark.style.left = ((h - DAYBAR_RANGE[0]) / (DAYBAR_RANGE[1] - DAYBAR_RANGE[0]) * 100) + '%';
      }
      statusListeners.forEach(function (fn) { fn(st); });
    }
    update();
    setInterval(update, 30000);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) update(); });
  }

  /* ------------------------------------------------------------------
     Gemeinsame Pendel-Physik (Türschild, Polaroids): gedämpfte Feder,
     eine rAF-Schleife, die nur läuft, solange etwas schwingt.
     ------------------------------------------------------------------ */
  var swings = [], swRaf = 0, swLast = 0;
  function makeSwing(node, o) {
    var s = { el: node, a: 0, v: 0, k: o.k || 40, c: o.c || 3, max: o.max || 10, live: false };
    swings.push(s);
    return s;
  }
  function swFrame(t) {
    swRaf = 0;
    var dt = swLast ? Math.min(0.034, (t - swLast) / 1000) : 0.016;
    swLast = t;
    var active = false;
    for (var i = 0; i < swings.length; i++) {
      var s = swings[i];
      if (!s.live) continue;
      s.v += (-s.k * s.a - s.c * s.v) * dt;
      s.a = clamp(s.a + s.v * dt, -s.max, s.max);
      if (Math.abs(s.a) < 0.03 && Math.abs(s.v) < 0.08) { s.a = 0; s.v = 0; s.live = false; s.el.style.transform = ''; continue; }
      s.el.style.transform = 'rotate(' + s.a.toFixed(2) + 'deg)';
      active = true;
    }
    if (active) swRaf = requestAnimationFrame(swFrame); else swLast = 0;
  }
  function swingKick(s, dv) {
    if (!s || reduced()) return;
    s.v = clamp(s.v + dv, -90, 90);
    s.live = true;
    if (!swRaf) { swLast = 0; swRaf = requestAnimationFrame(swFrame); }
  }

  /* ------------------------------------------------------------------
     Hero „Wartezimmer“: Augen folgen dem Zeiger (Handy: dem Finger bzw. dem
     Scroll), Tiere reagieren auf Berührung, Uhr und Türschild sind live.
     ------------------------------------------------------------------ */
  var STATUS_WORD = { open: 'Geöffnet', soon: 'Gleich', 'soon-open': 'Schließt bald', 'soon-closed': 'Öffnet bald', 'break': 'Mittagspause', closed: 'Geschlossen' };
  function initHero() {
    var hero = qs('[data-hero]'), scene = hero && qs('[data-scene]', hero);
    if (!hero || !scene) return;
    var heroVis = true, raf = 0;
    var eyes = qsa('.critter .eye', scene).map(function (e) {
      var m = (e.getAttribute('data-eye') || '4 3').split(' ').map(parseFloat);
      return { el: e, p: qs('.pupil', e), mx: m[0], my: m[1], x: 0, y: 0, tx: 0, ty: 0, cx: 0, cy: 0 };
    });
    var heads = qsa('.critter [data-head]', scene).map(function (h) { return { el: h, r: 0, tr: 0, cx: 0, cy: 0 }; });
    var measured = false;
    function measure() {
      var sx = window.scrollX, sy = window.scrollY;
      eyes.forEach(function (E) { var r = E.el.getBoundingClientRect(); E.cx = r.left + r.width / 2 + sx; E.cy = r.top + r.height / 2 + sy; });
      heads.forEach(function (H) { var r = H.el.getBoundingClientRect(); H.cx = r.left + r.width / 2 + sx; H.cy = r.top + r.height / 2 + sy; });
      measured = true;
    }
    function frame() {
      raf = 0;
      var moving = false;
      eyes.forEach(function (E) {
        E.x += (E.tx - E.x) * 0.2; E.y += (E.ty - E.y) * 0.2;
        if (Math.abs(E.tx - E.x) > 0.03 || Math.abs(E.ty - E.y) > 0.03) moving = true;
        E.p.style.transform = 'translate(' + E.x.toFixed(2) + 'px,' + E.y.toFixed(2) + 'px)';
      });
      heads.forEach(function (H) {
        H.r += (H.tr - H.r) * 0.1;
        if (Math.abs(H.tr - H.r) > 0.03) moving = true;
        H.el.style.transform = 'rotate(' + H.r.toFixed(2) + 'deg)';
      });
      if (moving && heroVis) raf = requestAnimationFrame(frame);
    }
    function wake() { if (!raf && heroVis && !reduced()) raf = requestAnimationFrame(frame); }
    function aim(px, py) {
      if (!measured) measure();
      eyes.forEach(function (E) {
        var dx = px - E.cx, dy = py - E.cy, d = Math.hypot(dx, dy) || 1, f = Math.min(1, d / 240);
        E.tx = dx / d * f * E.mx; E.ty = dy / d * f * E.my;
      });
      heads.forEach(function (H) { H.tr = clamp((px - H.cx) / 650, -1, 1) * 6 + clamp((py - H.cy) / 900, -1, 1) * 2; });
      wake();
    }
    visibilityGate(hero, function (v) { heroVis = v; hero.classList.toggle('is-off', !v); });
    window.addEventListener('resize', debounce(measure, 200));
    setTimeout(measure, 1300); /* nach dem Intro (Tiere stehen dann fest) */

    /* Uhr: Berliner Zeit, Sekundenzeiger nur im sichtbaren Hero */
    var hH = qs('[data-clock-h]', scene), hM = qs('[data-clock-m]', scene), hS = qs('[data-clock-s]', scene);
    var turns = 0, lastSec = -1;
    function clock() {
      if (!hH || !hM) return;
      var now = nowBerlin(), s = new Date().getSeconds();
      hH.style.transform = 'rotate(' + ((now.min / 60) % 12 * 30).toFixed(1) + 'deg)';
      hM.style.transform = 'rotate(' + ((now.min % 60) * 6 + s * 0.1).toFixed(1) + 'deg)';
      if (hS) {
        if (s < lastSec) turns++;
        lastSec = s;
        hS.style.transform = 'rotate(' + (turns * 360 + s * 6) + 'deg)';
      }
    }
    clock();
    setInterval(function () { if (heroVis && !document.hidden) clock(); }, reduced() ? 30000 : 1000);

    /* Türschild: Live-Status, schwingt beim Laden, bei Berührung und wenn sich der Status ändert */
    var sign = qs('[data-doorsign]', scene), lastState = null;
    var ss = sign ? makeSwing(sign, { k: 30, c: 1.9, max: 16 }) : null;
    if (ss) {
      setTimeout(function () { swingKick(ss, 62); }, 700);
      sign.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') swingKick(ss, clamp((e.movementX || 5) * 5, -55, 55)); });
      sign.addEventListener('pointerdown', function () { swingKick(ss, 50); });
    }
    statusListeners.push(function (st) {
      if (lastState && st.state !== lastState) swingKick(ss, 60);
      lastState = st.state;
    });

    /* Tiere anstupsen */
    qsa('[data-critter]', scene).forEach(function (c) {
      var t = 0;
      var poke = function () {
        if (reduced()) return;
        c.classList.remove('is-poked');
        void c.getBoundingClientRect();
        c.classList.add('is-poked');
        clearTimeout(t);
        t = setTimeout(function () { c.classList.remove('is-poked'); }, 1300);
      };
      c.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') poke(); });
      c.addEventListener('pointerdown', poke);
    });

    if (reduced()) return;
    var lastMove = 0;
    var onPtr = function (e) { if (!heroVis) return; lastMove = performance.now(); aim(e.pageX, e.pageY); };
    window.addEventListener('pointermove', onPtr, { passive: true });
    window.addEventListener('pointerdown', onPtr, { passive: true });
    /* Touch: die Tiere schauen dem Scroll hinterher */
    window.addEventListener('scroll', function () {
      if (!heroVis || finePointer.matches || performance.now() - lastMove < 1500) return;
      var r = scene.getBoundingClientRect();
      aim(window.scrollX + r.left + r.width * 0.5, window.scrollY + r.bottom + window.scrollY * 1.5);
    }, { passive: true });
    /* Ohne Zeiger: ab und zu umsehen */
    setInterval(function () {
      if (!heroVis || document.hidden || performance.now() - lastMove < 4000) return;
      var r = scene.getBoundingClientRect();
      aim(window.scrollX + r.left + Math.random() * r.width, window.scrollY + r.top - 160 + Math.random() * (r.height + 260));
    }, 2600);
  }

  /* ------------------------------------------------------------------
     Pfotenspur über die ganze Seite: eine Spur vom Wartezimmer bis zum
     Footer, die dem Scroll folgt (Kopf bei ~72 % der Fensterhöhe).
     ------------------------------------------------------------------ */
  function initTrail() {
    var box = qs('[data-trail]'), main = qs('#main'), hero = qs('[data-hero]');
    if (!box || !main) return;
    var NS = 'http://www.w3.org/2000/svg', BAND = 420, SC = 2 / 3;
    var bands = [], pts = [], tick = false, mainTop = 0, headEl = null, lastK = -2;
    /* Pfote (#paw, 12 px breit) als absoluter Pfad: Ballen (Bézier) + vier Zehen (Ellipsenbögen) */
    var PAD = [[0, -0.8], [2.7, -0.8], [4.4, 1.3], [5.8, 3.4], [7.1, 5.4], [6.5, 7.4], [4.2, 7.4], [2.6, 7.4], [1.6, 6.5], [0, 6.5], [-1.6, 6.5], [-2.6, 7.4], [-4.2, 7.4], [-6.5, 7.4], [-7.1, 5.4], [-5.8, 3.4], [-4.4, 1.3], [-2.7, -0.8], [0, -0.8]];
    var TOES = [[-6.3, -2.6, 1.85, 2.45, -24], [-2.3, -6.2, 2, 2.7, -8], [2.3, -6.2, 2, 2.7, 8], [6.3, -2.6, 1.85, 2.45, 24]];
    function pawD(ox, oy, deg) {
      var r = deg * Math.PI / 180, c = Math.cos(r), sn = Math.sin(r);
      var T = function (x, y) { x *= SC; y = y * SC + 0.5; return (ox + x * c - y * sn).toFixed(1) + ' ' + (oy + x * sn + y * c).toFixed(1); };
      var d = 'M' + T(PAD[0][0], PAD[0][1]);
      for (var i = 1; i < PAD.length; i += 3) d += 'C' + T(PAD[i][0], PAD[i][1]) + ' ' + T(PAD[i + 1][0], PAD[i + 1][1]) + ' ' + T(PAD[i + 2][0], PAD[i + 2][1]);
      d += 'Z';
      TOES.forEach(function (t) {
        var phi = t[4] + deg, pr = phi * Math.PI / 180, rx = (t[2] * SC).toFixed(2), ry = (t[3] * SC).toFixed(2);
        var cx = t[0] * SC, cy = t[1] * SC + 0.5;
        var gx = ox + cx * c - cy * sn, gy = oy + cx * sn + cy * c;
        var ux = Math.cos(pr) * t[2] * SC, uy = Math.sin(pr) * t[2] * SC;
        var a = (gx - ux).toFixed(1) + ' ' + (gy - uy).toFixed(1), b = (gx + ux).toFixed(1) + ' ' + (gy + uy).toFixed(1);
        d += 'M' + a + 'A' + rx + ' ' + ry + ' ' + phi.toFixed(0) + ' 1 0 ' + b + 'A' + rx + ' ' + ry + ' ' + phi.toFixed(0) + ' 1 0 ' + a + 'Z';
      });
      return d;
    }
    function build() {
      var W = main.clientWidth, Hm = main.scrollHeight;
      var y0 = hero ? hero.offsetTop + hero.offsetHeight + 24 : 40, y1 = Hm - 50;
      if (!W || y1 - y0 < 300) return;
      var narrow = W < 640;
      var edge = narrow ? 10 : clamp((W - 1320) / 2 * 0.5 + 22, 24, 120);
      var A = (W - 2 * edge) / 2, mid = W / 2, period = narrow ? 1600 : 2400;
      var dark = qsa('.er, .team').map(function (s) { return [s.offsetTop + 110, s.offsetTop + s.offsetHeight]; });
      var X = function (y) { return mid + A * clamp(Math.sin((y - y0) / period * Math.PI * 2 - Math.PI / 2) * 1.9, -1, 1); };
      var html = {}, step = narrow ? 28 : 34, acc = 0, side = 1, px = X(y0), py = y0;
      pts = [];
      for (var y = y0 + 2; y <= y1; y += 2) {
        var x = X(y);
        acc += Math.hypot(x - px, y - py);
        if (acc >= step) {
          acc = 0;
          var ang = Math.atan2(y - py, x - px) * 180 / Math.PI + 90;
          side = -side;
          var r = (ang - 90) * Math.PI / 180;
          var ox = x + Math.cos(r + Math.PI / 2) * 6 * side, oy = y + Math.sin(r + Math.PI / 2) * 6 * side;
          var dk = dark.some(function (d) { return oy > d[0] && oy < d[1]; });
          var bi = Math.floor(oy / BAND);
          var hb = html[bi] = html[bi] || { l: [], d: [], x0: 1e9, x1: -1e9 };
          hb.x0 = Math.min(hb.x0, ox); hb.x1 = Math.max(hb.x1, ox);
          hb[dk ? 'd' : 'l'].push(pawD(ox, oy - bi * BAND, ang));
          pts.push([ox, oy, ang]);
        }
        px = x; py = y;
      }
      /* Statische Bänder à 1200 px; sichtbar wird per clip-path bis zum Spurkopf – pro Frame ändert sich höchstens ein Band */
      box.textContent = '';
      bands = Object.keys(html).map(function (bi) {
        var s = document.createElementNS(NS, 'svg');
        /* Band nur so breit wie seine Pfoten: Clip-Änderungen invalidieren eine kleine Fläche */
        var x0 = Math.max(0, Math.floor(html[bi].x0 - 12)), bw = Math.min(W, Math.ceil(html[bi].x1 + 12)) - x0;
        s.setAttribute('viewBox', x0 + ' 0 ' + bw + ' ' + BAND);
        s.setAttribute('width', bw); s.setAttribute('height', BAND);
        s.style.top = (bi * BAND) + 'px';
        s.style.left = x0 + 'px';
        [['l', ''], ['d', 'd']].forEach(function (k) {
          if (!html[bi][k[0]].length) return;
          var path = document.createElementNS(NS, 'path');
          path.setAttribute('d', html[bi][k[0]].join(''));
          if (k[1]) path.setAttribute('class', k[1]);
          s.appendChild(path);
        });
        box.appendChild(s);
        return { el: s, top: bi * BAND, st: '' };
      });
      headEl = document.createElementNS(NS, 'svg');
      headEl.setAttribute('class', 'trail__head');
      headEl.setAttribute('viewBox', '0 0 18 19');
      headEl.innerHTML = '<use href="#paw"/>';
      box.appendChild(headEl);
      mainTop = main.getBoundingClientRect().top + window.scrollY;
      lastK = -2;
      update();
    }
    function update() {
      tick = false;
      if (!bands.length) return;
      var head = reduced() ? 1e9 : window.scrollY + window.innerHeight * 0.72 - mainTop;
      var lo = 0, hi = pts.length;
      while (lo < hi) { var m = (lo + hi) >> 1; if (pts[m][1] <= head) lo = m + 1; else hi = m; }
      var k = lo - 1;
      if (k === lastK) return;
      lastK = k;
      /* sichtbar bis knapp unter die zuletzt gesetzte Pfote – Änderung nur, wenn eine neue Pfote dazukommt */
      var edgeY = k < 0 ? -1e9 : (lo >= pts.length ? 1e9 : pts[k][1] + 9);
      bands.forEach(function (b) {
        var st = edgeY >= b.top + BAND ? 'full' : (edgeY <= b.top ? 'none' : 'part');
        if (st === 'part') {
          b.el.style.clipPath = 'inset(0 0 ' + Math.round(b.top + BAND - edgeY) + 'px 0)';
          b.el.style.visibility = '';
        } else if (st !== b.st) {
          b.el.style.clipPath = st === 'full' ? '' : 'inset(0 0 100% 0)';
          b.el.style.visibility = st === 'none' ? 'hidden' : '';
        }
        b.st = st;
      });
      if (headEl) {
        if (k < 0 || reduced() || lo >= pts.length) headEl.style.opacity = '0';
        else { headEl.style.opacity = ''; headEl.style.transform = 'translate(' + (pts[k][0] - 7).toFixed(1) + 'px,' + (pts[k][1] - 7.5).toFixed(1) + 'px) rotate(' + pts[k][2].toFixed(1) + 'deg)'; }
      }
    }
    var req = function () { if (!tick) { tick = true; requestAnimationFrame(update); } };
    window.addEventListener('scroll', req, { passive: true });
    var lastH = 0, lastW = 0;
    var rebuild = debounce(function () {
      var h = main.scrollHeight, w = main.clientWidth;
      if (Math.abs(h - lastH) < 2 && Math.abs(w - lastW) < 2) return;
      lastH = h; lastW = w;
      build();
    }, 350);
    if ('ResizeObserver' in window) new ResizeObserver(rebuild).observe(main);
    else window.addEventListener('resize', rebuild);
    rebuild();
  }

  /* ------------------------------------------------------------------
     Überschriften setzen sich Wort für Wort (nur mit Bewegung)
     ------------------------------------------------------------------ */
  function initSplit() {
    if (reduced()) return;
    var items = qsa('[data-split]');
    items.forEach(function (h) {
      var i = 0;
      (function walk(node) {
        Array.prototype.slice.call(node.childNodes).forEach(function (n) {
          if (n.nodeType === 3) {
            if (!n.nodeValue.trim()) return;
            var frag = document.createDocumentFragment();
            n.nodeValue.split(/( +)/).forEach(function (p) {
              if (!p) return;
              if (/^ +$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
              var w = el('span', 'w'), wi = el('span', 'w__in', p);
              wi.style.setProperty('--i', i++);
              w.appendChild(wi);
              frag.appendChild(w);
            });
            node.replaceChild(frag, n);
          } else if (n.nodeType === 1) walk(n);
        });
      })(h);
      h.classList.add('is-split');
    });
    if (!('IntersectionObserver' in window)) { items.forEach(function (h) { h.classList.add('is-in'); }); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); e.target.classList.add('is-in'); } });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
    items.forEach(function (h) { io.observe(h); });
  }

  /* Magnetische Knöpfe (nur feiner Zeiger) – über „translate“, damit :active-scale wirkt */
  function initMagnet() {
    if (reduced() || !finePointer.matches) return;
    qsa('[data-magnet]').forEach(function (b) {
      var x = 0, y = 0, tx = 0, ty = 0, raf = 0;
      var loop = function () {
        raf = 0;
        x += (tx - x) * 0.18; y += (ty - y) * 0.18;
        b.style.translate = x.toFixed(2) + 'px ' + y.toFixed(2) + 'px';
        if (Math.abs(tx - x) > 0.05 || Math.abs(ty - y) > 0.05) raf = requestAnimationFrame(loop);
      };
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        tx = (e.clientX - r.left - r.width / 2) * 0.2; ty = (e.clientY - r.top - r.height / 2) * 0.3;
        if (!raf) raf = requestAnimationFrame(loop);
      });
      b.addEventListener('pointerleave', function () { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(loop); });
    });
  }

  /* Karteikarten: legen sich nacheinander ab (Handy: ganze Schiene gemeinsam) */
  function initRailReveal() {
    if (reduced() || !('IntersectionObserver' in window)) return;
    qsa('[data-rail-reveal]').forEach(function (grid) {
      var cards = Array.prototype.slice.call(grid.children);
      var rail = window.matchMedia('(max-width: 639px)').matches;
      cards.forEach(function (c) { c.classList.add('rv'); });
      var show = function (c, i) {
        c.style.setProperty('--i', i);
        c.classList.add('rv-in');
        setTimeout(function () { c.classList.remove('rv', 'rv-in'); c.style.removeProperty('--i'); }, 1300 + i * 70);
      };
      if (rail) { onceInView(grid, function () { cards.forEach(show); }, { threshold: 0.15 }); return; }
      var io = new IntersectionObserver(function (es) {
        var k = 0;
        es.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); show(e.target, k++); } });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
      cards.forEach(function (c) { io.observe(c); });
    });
  }

  /* Notfall-Kapitel: Nacht-Hintergrund öffnet sich mit dem Scroll; Baum an echte Breite anpassen */
  function initErFx() {
    var sec = qs('[data-er]'), bg = qs('[data-er-bg]');
    if (sec && bg && hasGSAP && !reduced()) {
      gsap.fromTo(bg, { clipPath: 'inset(6% 4% 0% 4% round 64px)' }, {
        clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none',
        scrollTrigger: { trigger: sec, start: 'top bottom', end: 'top 20%', scrub: 0.4 }
      });
    }
    var res = qs('[data-triage-result]'), tree = qs('.tree__svg');
    if (!res || !tree || !('ResizeObserver' in window)) return;
    var lamps = qsa('.ampel__light', res);
    var bgp = qsa('.tree__bg', tree), fgp = qsa('.tree__fg', tree);
    new ResizeObserver(debounce(function () {
      var tr = tree.getBoundingClientRect();
      if (!tr.width || lamps.length < 3) return;
      var w = tr.width, h = tr.height, mid = w / 2, j = h * 0.36;
      tree.setAttribute('viewBox', '0 0 ' + w.toFixed(1) + ' ' + h.toFixed(1));
      var trunk = 'M' + mid.toFixed(1) + ' 0V' + j.toFixed(1);
      bgp[0].setAttribute('d', trunk); fgp[0].setAttribute('d', trunk);
      lamps.forEach(function (l, i) {
        var r = l.getBoundingClientRect();
        var x = (r.left + r.width / 2 - tr.left).toFixed(1);
        var d = 'M' + mid.toFixed(1) + ' ' + j.toFixed(1) + 'C' + mid.toFixed(1) + ' ' + (j + (h - j) * 0.7).toFixed(1) + ' ' + x + ' ' + (j + (h - j) * 0.35).toFixed(1) + ' ' + x + ' ' + (h + 14).toFixed(1);
        bgp[i + 1].setAttribute('d', d); fgp[i + 1].setAttribute('d', d);
      });
    }, 60)).observe(res);
  }

  /* Impfpass: der Zeitstrahl wächst mit dem Scroll, Stationen werden „abgestempelt“ */
  var vaccGrowSync = function () {};
  function initVaccGrow() {
    var tl = qs('[data-vacc-timeline]');
    if (!tl) return;
    var vine = el('span', 'vacc__vine');
    vine.setAttribute('aria-hidden', 'true');
    tl.insertBefore(vine, tl.firstChild);
    if (reduced() || !hasGSAP) return;
    var p = 0, fr = [], horizontal = true;
    tl.classList.add('is-growing');
    var apply = function () {
      vine.style.transform = horizontal ? 'scaleX(' + p.toFixed(4) + ')' : 'scaleY(' + p.toFixed(4) + ')';
      qsa('.vacc-item', tl).forEach(function (it, i) { it.classList.toggle('is-reached', fr[i] != null && p >= fr[i] - 0.03); });
      tl.classList.toggle('is-grown', p > 0.97);
    };
    vaccGrowSync = function () {
      horizontal = tl.clientWidth > 640;
      var tr = tl.getBoundingClientRect();
      fr = qsa('.vacc-item__dot', tl).map(function (d) {
        var r = d.getBoundingClientRect();
        return horizontal ? (r.left + r.width / 2 - tr.left) / tr.width : (r.top + r.height / 2 - tr.top) / tr.height;
      });
      apply();
    };
    ScrollTrigger.create({
      trigger: tl, start: 'top 82%', end: 'bottom 50%', scrub: 0.5,
      onUpdate: function (self) { p = self.progress; apply(); },
      onRefresh: function (self) { p = self.progress; vaccGrowSync(); }
    });
    vaccGrowSync();
  }

  /* Team-Wand: Polaroids hängen an Nadeln und schwingen (Hover, Tippen, Scroll-Tempo) */
  function initBoard() {
    var board = qs('[data-board]');
    if (!board || reduced()) return;
    var items = qsa('[data-pol]', board).map(function (n, i) {
      var s = makeSwing(n, { k: 46, c: 3.2, max: 9 });
      s.dir = i % 2 ? 1 : -1; s.vis = false; n.__sw = s;
      return s;
    });
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { e.target.__sw.vis = e.isIntersecting; }); }, { rootMargin: '60px 0px' });
      items.forEach(function (s) { io.observe(s.el); });
    }
    onceInView(board, function () {
      items.forEach(function (s, i) { setTimeout(function () { swingKick(s, s.dir * (30 + (i % 3) * 10)); }, i * 70); });
    }, { threshold: 0.1 });
    items.forEach(function (s) {
      s.el.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse') return;
        var mx = e.movementX || 0;
        if (Math.abs(mx) > 1) swingKick(s, clamp(mx * 1.4, -30, 30));
      });
      s.el.addEventListener('pointerdown', function () { swingKick(s, s.dir * 40); });
    });
    var lastY = window.scrollY;
    window.addEventListener('scroll', function () {
      var y = window.scrollY, dy = y - lastY;
      lastY = y;
      if (Math.abs(dy) < 3) return;
      items.forEach(function (s) { if (s.vis) swingKick(s, clamp(dy * 0.3, -12, 12) * s.dir); });
    }, { passive: true });
  }

  /* ------------------------------------------------------------------
     Reveal beim Scrollen (mit kurzer Staffelung)
     ------------------------------------------------------------------ */
  function initReveal() {
    var items = qsa('[data-reveal]');
    if (!items.length) return;
    var settle = function (n) {
      var t = setTimeout(function () { n.removeAttribute('data-reveal'); n.style.removeProperty('--d'); }, 1100 + (parseInt(n.style.getPropertyValue('--d'), 10) || 0));
      n.__settle = t;
    };
    if (motionOff) { items.forEach(function (n) { n.classList.add('is-in'); }); return; }
    if (!('IntersectionObserver' in window)) { items.forEach(function (n) { n.classList.add('is-in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      var batch = entries.filter(function (e) { return e.isIntersecting; }).map(function (e) { return e.target; });
      batch.sort(function (a, b) {
        var ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
        return (ra.top - rb.top) || (ra.left - rb.left);
      });
      batch.forEach(function (n, i) {
        io.unobserve(n);
        n.style.setProperty('--d', Math.min(i * 70, 350) + 'ms');
        n.classList.add('is-in');
        settle(n);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (n) { io.observe(n); });
  }

  /* ------------------------------------------------------------------
     Leistungen: Silhouetten wackeln (Hover/Fokus, auf Touch einmal beim Einblenden)
     ------------------------------------------------------------------ */
  function initWiggle() {
    qsa('[data-wiggle]').forEach(function (card) {
      var busy = false;
      var go = function () {
        if (busy || reduced()) return;
        busy = true;
        card.classList.remove('is-wiggle');
        void card.offsetWidth;
        card.classList.add('is-wiggle');
        setTimeout(function () { card.classList.remove('is-wiggle'); busy = false; }, 720);
      };
      card.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse' || finePointer.matches) go(); });
      card.addEventListener('focusin', go);
      if (!finePointer.matches) onceInView(card, function () { setTimeout(go, 450); }, { threshold: 0.6 });
    });
  }

  /* ------------------------------------------------------------------
     Notfall-Wegweiser
     ------------------------------------------------------------------ */
  var triageSpecies = function () { return 'hund'; };
  function initTriage() {
    var form = qs('[data-triage]');
    var result = qs('[data-triage-result]');
    if (!form || !result) return;
    var o = {
      kicker: qs('[data-er-kicker]', result), verdict: qs('[data-er-verdict]', result), text: qs('[data-er-text]', result),
      why: qs('[data-er-why]', result), tips: qs('[data-er-tips]', result), call: qs('[data-er-call]', result),
      practice: qs('[data-er-practice]', result), book: qs('[data-er-book]', result), live: qs('[data-er-live]', result)
    };
    var peek = qs('[data-er-peek]', form), peekText = qs('[data-er-peek-text]', form);
    var lights = qsa('.ampel li', result);
    var treeSp = qs('[data-tree-sp]', result), treeN = qs('[data-tree-n]', result), treeUse = qs('[data-tree-sil] use', result);
    var defaults = { kicker: o.kicker.textContent, verdict: o.verdict.textContent, text: o.text.textContent };
    var lastLevel = 0, lastKey = '';

    var species = function () { var r = form.querySelector('input[name="er-art"]:checked'); return r ? r.value : 'hund'; };
    triageSpecies = species;
    function applySpecies() {
      var sp = species();
      qsa('[data-only]', form).forEach(function (l) {
        var ok = l.getAttribute('data-only').split(/\s+/).indexOf(sp) >= 0;
        l.hidden = !ok;
        if (!ok) { var i = qs('input', l); if (i) i.checked = false; }
      });
    }
    function textFor(level, sp) {
      var st = currentStatus || { open: false, laterToday: null };
      if (level === 3) {
        return {
          kicker: 'Stufe Rot · Orientierung',
          verdict: 'Sofort anrufen.',
          text: st.open
            ? 'Diese Anzeichen können lebensbedrohlich sein. Rufen Sie jetzt an und machen Sie sich währenddessen fahrbereit – wir sind gerade in der Praxis und bereiten alles vor.'
            : 'Diese Anzeichen können lebensbedrohlich sein. Rufen Sie jetzt die Notfall-Hotline an – rund um die Uhr erreichbar. Wir sagen Ihnen, ob Sie zu uns oder direkt in eine Tierklinik fahren.'
        };
      }
      if (level === 2) {
        var t;
        if (st.open) t = 'Kein Grund zur Panik, aber bitte nicht bis morgen warten. Rufen Sie in der Praxis an – wir halten an jedem Praxistag Akut-Termine frei.';
        else if (st.laterToday != null) t = 'Kein Grund zur Panik, aber bitte nicht bis morgen warten. Rufen Sie an, sobald wir öffnen (heute ab ' + H(st.laterToday) + ') – wir halten Akut-Termine frei. Wird es vorher schlechter: Hotline.';
        else t = 'Bitte nicht bis zum nächsten Praxistag warten. Rufen Sie die Notfall-Hotline an – wir besprechen am Telefon, wie es weitergeht.';
        return { kicker: 'Stufe Gelb · Orientierung', verdict: 'Heute noch ansehen lassen.', text: t };
      }
      if (level === 1) {
        return {
          kicker: 'Stufe Grün · Orientierung',
          verdict: 'Termin vereinbaren.',
          text: 'Das klingt nach einem regulären Termin in den nächsten Tagen. Beobachten Sie Ihr Tier: Wird es schlechter oder kommen Anzeichen dazu, rufen Sie an.'
        };
      }
      return defaults;
    }
    function evaluate(announce) {
      var sp = species(), idx = SPECIES_IDX[sp] || 0;
      var picked = qsa('input[name="sym"]:checked', form).map(function (i) { return i.value; }).filter(function (v) { return SYMPTOMS[v]; });
      var level = 0, counts = { 1: 0, 2: 0, 3: 0 };
      picked.forEach(function (v) { var l = SYMPTOMS[v].l[idx]; if (l) { counts[l]++; level = Math.max(level, l); } });
      var combo = null;
      if (picked.indexOf('erbrechen-mehr') >= 0 && picked.indexOf('durchfall') >= 0 && level < 3) { level = 3; combo = 'Erbrechen und Durchfall zusammen können schnell austrocknen – besonders bei jungen oder kleinen Tieren.'; }
      else if (level === 2 && counts[2] >= 3) { level = 3; combo = 'Mehrere Anzeichen gleichzeitig – bitte lieber direkt anrufen.'; }
      else if (level === 1 && counts[1] >= 3) { level = 2; combo = 'Mehrere Anzeichen gleichzeitig – lassen Sie Ihr Tier lieber heute ansehen.'; }

      var key = sp + '|' + picked.join(',') + '|' + level + '|' + (currentStatus ? currentStatus.state : '');
      if (key === lastKey) return;
      lastKey = key;

      result.setAttribute('data-level', String(level));
      if (treeSp) treeSp.textContent = { hund: 'Hund', katze: 'Katze', klein: 'Kleintier' }[sp] || 'Tier';
      if (treeN) treeN.textContent = picked.length === 1 ? '1 Anzeichen' : picked.length + ' Anzeichen';
      if (treeUse) treeUse.setAttribute('href', sp === 'katze' ? '#sil-cat' : (sp === 'klein' ? '#sil-rabbit' : '#sil-dog'));
      lights.forEach(function (li) { li.classList.toggle('is-on', +li.getAttribute('data-l') === level); });
      var tx = textFor(level, sp);
      o.kicker.textContent = level ? tx.kicker : defaults.kicker;
      o.verdict.textContent = tx.verdict;
      o.text.textContent = tx.text;

      /* Ausschlaggebende Anzeichen */
      o.why.textContent = '';
      if (level) {
        var top = picked.filter(function (v) { return SYMPTOMS[v].l[idx] === Math.max.apply(null, picked.map(function (p) { return SYMPTOMS[p].l[idx]; })); });
        o.why.appendChild(document.createTextNode('Ausschlaggebend: '));
        top.slice(0, 3).forEach(function (v, i) {
          if (i) o.why.appendChild(document.createTextNode(i === Math.min(top.length, 3) - 1 ? ' und ' : ', '));
          o.why.appendChild(el('strong', null, SYMPTOMS[v].name));
        });
        if (top.length > 3) o.why.appendChild(document.createTextNode(' u. a.'));
        o.why.appendChild(document.createTextNode('.'));
        var note = null;
        picked.some(function (v) { note = TRIAGE_NOTES[sp + ':' + v] || null; return !!note; });
        if (combo) o.why.appendChild(document.createTextNode(' ' + combo));
        if (note) o.why.appendChild(document.createTextNode(' ' + note));
        o.why.hidden = false;
      } else {
        o.why.hidden = true;
      }

      /* Was Sie jetzt tun können */
      o.tips.textContent = '';
      var tips = picked.slice().sort(function (a, b) { return SYMPTOMS[b].l[idx] - SYMPTOMS[a].l[idx]; })
        .map(function (v) { return SYMPTOMS[v].tip; }).filter(function (t, i, arr) { return t && arr.indexOf(t) === i; }).slice(0, 3);
      tips.forEach(function (t) { o.tips.appendChild(el('li', null, t)); });
      o.tips.hidden = !tips.length;

      /* Aktionen */
      var st = currentStatus || {};
      var practiceUseful = level === 1 || (level === 2 && (st.open || st.laterToday != null));
      o.practice.hidden = !practiceUseful;
      o.book.hidden = level !== 1;
      o.call.style.order = level === 3 || (level === 2 && !practiceUseful) || level === 0 ? '-1' : '2';
      o.practice.style.order = level === 2 ? '-1' : '1';
      o.book.style.order = '0';
      o.book.setAttribute('data-prefill-art', ANLIEGEN_FROM_ART[sp] || 'hund');

      if (peek) {
        peek.hidden = level === 0;
        peek.setAttribute('data-level', String(level));
        if (peekText) peekText.textContent = level ? 'Einschätzung: ' + tx.verdict.replace(/\.$/, '') : 'Einschätzung ansehen';
      }
      if (announce !== false && o.live) {
        o.live.textContent = level ? 'Einschätzung: ' + tx.verdict + ' ' + (o.why.textContent || '') : 'Keine Anzeichen gewählt.';
      }
      lastLevel = level;
    }

    form.addEventListener('change', function (e) {
      if (e.target.name === 'er-art') applySpecies();
      evaluate();
    });
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    var reset = qs('[data-triage-reset]', form);
    if (reset) reset.addEventListener('click', function (e) {
      e.preventDefault();
      qsa('input[name="sym"]', form).forEach(function (i) { i.checked = false; });
      evaluate();
    });
    if (peek) {
      peek.addEventListener('click', function () { scrollToEl(result, { gap: 20 }); });
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          entries.forEach(function (en) { peek.classList.toggle('is-away', en.isIntersecting); });
        }, { threshold: 0.25 }).observe(result);
      }
    }
    statusListeners.push(function () { lastKey = ''; evaluate(false); });
    applySpecies();
    lastKey = '';
    evaluate(false);
  }

  /* ------------------------------------------------------------------
     Erster Besuch: Pfotenspur, die dem Scroll folgt (Desktop: sticky Bühne)
     ------------------------------------------------------------------ */
  function initVisit() {
    var sec = qs('#besuch');
    var stage = qs('[data-visit-stage]');
    var svg = qs('[data-visit-svg]');
    var path = qs('[data-visit-path]');
    var g = qs('[data-visit-paws]');
    if (!sec || !stage || !svg || !path || !g || !path.getTotalLength) return;
    var NS = 'http://www.w3.org/2000/svg';
    var steps = qsa('[data-step]', stage);
    var dots = qsa('[data-step-dot]', stage);
    var paws = [], dotLen = [], L = 0, prog = reduced() ? 1 : 0, lastOn = -2;

    function build() {
      var sr = stage.getBoundingClientRect();
      if (!sr.width) return;
      svg.setAttribute('viewBox', '0 0 ' + Math.round(sr.width) + ' ' + Math.round(sr.height));
      var pts = dots.map(function (d) {
        var r = d.getBoundingClientRect();
        return { x: r.left - sr.left + r.width / 2, y: r.top - sr.top + r.height / 2, r: d.offsetWidth / 2 };
      });
      if (pts.length < 2) return;
      var dStr = 'M' + pts[0].x.toFixed(1) + ' ' + pts[0].y.toFixed(1);
      var tmp = document.createElementNS(NS, 'path');
      svg.appendChild(tmp);
      dotLen = [0];
      var acc = 0;
      for (var i = 1; i < pts.length; i++) {
        var a = pts[i - 1], b = pts[i], c;
        var dy = b.y - a.y;
        if (Math.abs(a.x - b.x) < 24) {
          var w = (i % 2 ? 1 : -1) * 22;
          c = [a.x + w, a.y + dy * 0.35, b.x + w, b.y - dy * 0.35];
        } else if (dy > 12) {
          c = [b.x + 34, a.y, b.x, a.y + dy * 0.45];
        } else if (dy < -12) {
          var mx = (a.x + b.x) / 2;
          c = [mx, a.y, mx, b.y];
        } else {
          c = [lerp(a.x, b.x, 0.35), a.y - 34, lerp(a.x, b.x, 0.65), b.y - 34];
        }
        var seg = 'C' + c.map(function (v) { return v.toFixed(1); }).join(' ') + ' ' + b.x.toFixed(1) + ' ' + b.y.toFixed(1);
        tmp.setAttribute('d', 'M' + a.x.toFixed(1) + ' ' + a.y.toFixed(1) + seg);
        acc += tmp.getTotalLength();
        dotLen.push(acc);
        dStr += seg;
      }
      tmp.remove();
      path.setAttribute('d', dStr);
      L = path.getTotalLength();
      g.textContent = '';
      paws = [];
      var spacing = mqDesk.matches ? 27 : 23, side = 1;
      for (var s = spacing * 0.6; s < L; s += spacing) {
        var p = path.getPointAtLength(s), q = path.getPointAtLength(Math.min(L, s + 1.5));
        var ang = Math.atan2(q.y - p.y, q.x - p.x);
        side = -side;
        var x = p.x + Math.cos(ang + Math.PI / 2) * 6.5 * side;
        var y = p.y + Math.sin(ang + Math.PI / 2) * 6.5 * side;
        var hidden = pts.some(function (pt) { return Math.hypot(pt.x - x, pt.y - y) < pt.r + 11; });
        if (hidden) continue;
        var grp = document.createElementNS(NS, 'g');
        grp.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') rotate(' + (ang * 180 / Math.PI + 90).toFixed(1) + ')');
        var use = document.createElementNS(NS, 'use');
        use.setAttribute('href', '#paw');
        use.setAttribute('x', '-7'); use.setAttribute('y', '-7.5');
        use.setAttribute('width', '14'); use.setAttribute('height', '15');
        use.setAttribute('class', 'tp');
        grp.appendChild(use);
        g.appendChild(grp);
        paws.push({ el: use, len: s });
      }
      lastOn = -2;
      render();
    }
    function render() {
      var len = prog * L;
      var on = -1;
      for (var i = 0; i < paws.length; i++) if (paws[i].len <= len) on = i;
      if (on !== lastOn) {
        paws.forEach(function (pw, k) {
          pw.el.classList.toggle('on', k <= on);
          pw.el.classList.toggle('head', k === on && prog < 0.999);
        });
        lastOn = on;
      }
      steps.forEach(function (st, k) { st.classList.toggle('is-active', prog > 0.002 && len >= (dotLen[k] || 0) - 6); });
    }
    function setProgress(p) { prog = clamp(p, 0, 1); render(); }

    /* Erster Aufbau über den ResizeObserver (feuert beim Beobachten) – kein erzwungenes Layout beim Start */
    if (!('ResizeObserver' in window)) build();
    if ('ResizeObserver' in window) {
      var lastW = 0;
      new ResizeObserver(debounce(function () {
        var w = stage.clientWidth;
        if (Math.abs(w - lastW) > 1 || !paws.length) { lastW = w; build(); }
      }, 150)).observe(stage);
    } else window.addEventListener('resize', debounce(build, 150));
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);

    if (reduced()) { setProgress(1); return; }
    sec.classList.add('is-armed');

    if (hasGSAP) {
      var pinEl = qs('[data-visit-pin]', sec);
      var mm = gsap.matchMedia();
      mm.add('(min-width: 900px) and (min-height: 680px)', function () {
        var pinTop = hdrH();
        /* Sticky statt GSAP-Pin: Abschnitt = Bühne + Scrollstrecke, die Bühne klebt mittig */
        var setup = function () {
          sec.classList.add('is-sticky');
          var ph = pinEl.offsetHeight, room = window.innerHeight - hdrH();
          if (ph > room - 8) { sec.classList.remove('is-sticky'); return false; }
          pinTop = Math.round(hdrH() + (room - ph) / 2);
          sec.style.setProperty('--pin-top', pinTop + 'px');
          sec.style.setProperty('--visit-h', Math.round(ph + window.innerHeight * 1.05) + 'px');
          return true;
        };
        var fits = setup();
        if (fits) {
          ScrollTrigger.create({
            trigger: sec,
            start: function () { return 'top ' + pinTop + 'px'; },
            end: function () { return 'bottom ' + (pinTop + pinEl.offsetHeight) + 'px'; },
            invalidateOnRefresh: true,
            onUpdate: function (self) { setProgress(self.progress); },
            onRefresh: function (self) { setProgress(self.progress); }
          });
        } else {
          ScrollTrigger.create({ trigger: stage, start: 'top 78%', end: 'bottom 55%', onUpdate: function (self) { setProgress(self.progress); }, onRefresh: function (self) { setProgress(self.progress); } });
        }
        var onRI = function () { if (fits) setup(); };
        ScrollTrigger.addEventListener('refreshInit', onRI);
        return function () {
          ScrollTrigger.removeEventListener('refreshInit', onRI);
          sec.classList.remove('is-sticky'); sec.style.removeProperty('--visit-h'); sec.style.removeProperty('--pin-top');
        };
      });
      mm.add('(max-width: 899px), (max-height: 679px)', function () {
        ScrollTrigger.create({ trigger: stage, start: 'top 78%', end: 'bottom 60%', onUpdate: function (self) { setProgress(self.progress); }, onRefresh: function (self) { setProgress(self.progress); } });
      });
    } else {
      var upd = function () {
        var r = stage.getBoundingClientRect(), vh = window.innerHeight;
        var start = vh * 0.78, end = vh * 0.6;
        setProgress((start - r.top) / Math.max(1, (start - end) + r.height));
      };
      window.addEventListener('scroll', upd, { passive: true });
      upd();
    }
  }

  /* ------------------------------------------------------------------
     Impfplaner
     ------------------------------------------------------------------ */
  var vaccState = null;
  function initVacc() {
    var form = qs('[data-vacc]');
    if (!form) return;
    var nameIn = qs('#vacc-name', form), dateIn = qs('#vacc-date', form), optIn = qs('#vacc-opt', form);
    var err = qs('[data-vacc-err]', form), optLabel = qs('[data-vacc-opt-label]', form);
    var imgs = qsa('[data-vacc-img]', form);
    var ageEl = qs('[data-vacc-age]'), nextEl = qs('[data-vacc-next]'), tl = qs('[data-vacc-timeline]'), list = qs('[data-vacc-list]');
    var todayEl = qs('[data-vacc-today]'), icsBtn = qs('[data-vacc-ics]'), bookBtn = qs('[data-vacc-book]');
    if (!dateIn || !list || !tl) return;
    var fill = el('span', 'vacc__fill');
    fill.setAttribute('aria-hidden', 'true');
    tl.insertBefore(fill, todayEl || null);

    var dayMs = 864e5;
    var today = function () { var n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); };
    var iso = function (d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); };
    var dateFmt = new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
    var t0 = today();
    dateIn.max = iso(t0);
    dateIn.min = iso(new Date(t0.getFullYear() - VACC_MAX_YEARS, t0.getMonth(), t0.getDate()));
    if (!dateIn.value) {
      dateIn.value = iso(new Date(t0.getTime() - VACC_EXAMPLE_WEEKS * 7 * dayMs));
      dateIn.setAttribute('data-example', '');
    }

    function rel(days) {
      var a = Math.abs(days), s;
      if (days === 0) return 'heute';
      if (days === 1) return 'morgen';
      if (days === -1) return 'gestern';
      if (a < 14) s = a + NBSP + 'Tagen';
      else if (a < 63) s = Math.round(a / 7) + NBSP + 'Wochen';
      else s = Math.round(a / 30.44) + NBSP + 'Monaten';
      return (days > 0 ? 'in ' : 'vor ') + s;
    }
    function ageText(days) {
      if (days < 7) return days === 1 ? '1 Tag' : days + NBSP + 'Tage';
      if (days < 7 * 17) { var w = Math.floor(days / 7); return w === 1 ? '1 Woche' : w + NBSP + 'Wochen'; }
      var m = Math.floor(days / 30.44);
      if (m < 24) return m + NBSP + 'Monate';
      return Math.floor(m / 12) + NBSP + 'Jahre';
    }
    function species() { var r = form.querySelector('input[name="vacc-art"]:checked'); return r ? r.value : 'welpe'; }
    function showErr(msg) {
      if (!err) return;
      err.textContent = msg || '';
      err.hidden = !msg;
      if (msg) dateIn.setAttribute('aria-invalid', 'true'); else dateIn.removeAttribute('aria-invalid');
    }
    function buildList(plan, birth, opt) {
      list.textContent = '';
      var t = today();
      var nextIdx = -1;
      var items = plan.map(function (p, i) {
        var d = null;
        if (birth) {
          d = p.weeks ? new Date(birth.getTime() + p.weeks * 7 * dayMs) : new Date(birth.getFullYear(), birth.getMonth() + p.months, birth.getDate());
          if (nextIdx < 0 && d.getTime() >= t.getTime()) nextIdx = i;
        }
        return { p: p, date: d };
      });
      items.forEach(function (it, i) {
        var li = el('li', 'vacc-item');
        var state = !birth ? 'plain' : (i === nextIdx ? 'next' : (it.date < t ? 'past' : 'future'));
        li.setAttribute('data-state', state);
        var dot = el('span', 'vacc-item__dot');
        dot.setAttribute('aria-hidden', 'true');
        if (state === 'past') {
          var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          var u = document.createElementNS('http://www.w3.org/2000/svg', 'use');
          u.setAttribute('href', '#i-check'); s.appendChild(u); dot.appendChild(s);
        }
        li.appendChild(dot);
        var body = el('div', 'vacc-item__body');
        body.appendChild(el('p', 'vacc-item__when', it.p.when));
        if (it.date) {
          body.appendChild(el('p', 'vacc-item__date', dateFmt.format(it.date)));
          var days = Math.round((it.date - t) / dayMs);
          var relTxt = state === 'past' ? 'liegt zurück · ' + rel(days) : (state === 'next' ? 'als Nächstes · ' + rel(days) : rel(days));
          body.appendChild(el('p', 'vacc-item__rel', relTxt));
        }
        var ul = el('ul', 'vacc-item__vax');
        ul.setAttribute('aria-label', 'Impfungen');
        it.p.vax.forEach(function (v) { ul.appendChild(el('li', null, v)); });
        it.p.opt.forEach(function (v) {
          var o = el('li', opt ? null : 'is-opt', v + (opt ? ' (empfohlen)' : ' (optional)'));
          ul.appendChild(o);
        });
        body.appendChild(ul);
        if (it.p.note) body.appendChild(el('p', 'vacc-item__note', it.p.note));
        li.appendChild(body);
        list.appendChild(li);
      });
      return { items: items, nextIdx: nextIdx };
    }
    function place(res, birth) {
      if (!birth || !todayEl) { if (todayEl) todayEl.hidden = true; fill.style.transform = ''; return; }
      todayEl.hidden = false;
      var horizontal = tl.clientWidth > 640;
      var tr = tl.getBoundingClientRect();
      var centers = qsa('.vacc-item__dot', list).map(function (d) {
        var r = d.getBoundingClientRect();
        return horizontal ? r.left - tr.left + r.width / 2 : r.top - tr.top + r.height / 2;
      });
      var times = res.items.map(function (it) { return it.date.getTime(); });
      var t = today().getTime(), pos;
      var last = times.length - 1;
      if (t <= times[0]) pos = lerp(0, centers[0], clamp((t - birth.getTime()) / Math.max(1, times[0] - birth.getTime()), 0, 1));
      else if (t >= times[last]) pos = centers[last] + Math.min(28, (t - times[last]) / dayMs);
      else {
        for (var k = 0; k < last; k++) if (t >= times[k] && t < times[k + 1]) pos = lerp(centers[k], centers[k + 1], (t - times[k]) / (times[k + 1] - times[k]));
      }
      var size = horizontal ? tl.clientWidth : tl.clientHeight;
      fill.style.transform = horizontal ? 'scaleX(' + clamp(pos / size, 0, 1).toFixed(4) + ')' : 'scaleY(' + clamp(pos / size, 0, 1).toFixed(4) + ')';
      todayEl.style.transform = horizontal ? 'translateX(' + pos.toFixed(1) + 'px) translateX(-50%)' : 'translateY(' + pos.toFixed(1) + 'px) translateY(-50%)';
    }
    var lastRes = null, lastBirth = null;
    function render() {
      var sp = species();
      var plan = VACC[sp];
      var name = (nameIn.value || '').trim();
      var who = name || (sp === 'welpe' ? 'Ihr Welpe' : 'Ihr Kitten');
      var opt = optIn && optIn.checked;
      if (optLabel) optLabel.textContent = VACC_OPT_LABEL[sp];
      imgs.forEach(function (im) { im.classList.toggle('is-on', im.getAttribute('data-vacc-img') === sp); });
      var birth = null;
      var v = dateIn.value;
      var t = today();
      if (v) {
        var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
        if (m) birth = new Date(+m[1], +m[2] - 1, +m[3]);
        if (!birth || isNaN(birth)) { birth = null; showErr('Bitte ein gültiges Datum eingeben.'); }
        else if (birth > t) { birth = null; showErr('Das Datum liegt in der Zukunft.'); }
        else if (t.getFullYear() - birth.getFullYear() > VACC_MAX_YEARS) { birth = null; showErr('Bitte prüfen Sie das Jahr.'); }
        else showErr('');
      } else showErr('');
      var res = buildList(plan, birth, opt);
      lastRes = res; lastBirth = birth;
      if (ageEl) ageEl.textContent = birth ? 'Grundimmunisierung für ' + who : 'Grundimmunisierung im Überblick';
      if (nextEl) {
        nextEl.textContent = '';
        if (!birth) {
          nextEl.textContent = 'Geben Sie ein Geburtsdatum ein, dann rechnen wir die Termine aus.';
        } else {
          var ageDays = Math.round((t - birth) / 864e5);
          nextEl.appendChild(document.createTextNode(who + ' ist ' + ageText(ageDays) + ' alt. '));
          if (res.nextIdx >= 0) {
            var it = res.items[res.nextIdx];
            var dd = Math.round((it.date - t) / 864e5);
            nextEl.appendChild(document.createTextNode('Als Nächstes: ' + it.p.when + ' – '));
            nextEl.appendChild(el('strong', null, dateFmt.format(it.date)));
            nextEl.appendChild(document.createTextNode(', ' + rel(dd) + '.'));
          } else {
            nextEl.appendChild(document.createTextNode('Laut Plan ist die Grundimmunisierung abgeschlossen – ab jetzt geht es um Auffrischungen. Wir prüfen den Impfpass gern.'));
          }
        }
      }
      if (icsBtn) icsBtn.hidden = !(birth && res.items.some(function (it) { return it.date >= t; }));
      vaccState = { species: sp, name: name, birth: birth };
      requestAnimationFrame(function () { place(res, birth); vaccGrowSync(); });
    }
    function ics() {
      if (!lastRes || !lastBirth) return;
      var t = today();
      var esc = function (s) { return String(s).replace(/\\/g, '\\\\').replace(/[,;]/g, function (c) { return '\\' + c; }).replace(/\r?\n/g, '\\n'); };
      var ymd = function (d) { return d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate()); };
      var stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
      var name = vaccState && vaccState.name ? vaccState.name : (vaccState && vaccState.species === 'kitten' ? 'Kitten' : 'Welpe');
      var lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Pfotenwerk Demo//Impfplaner//DE', 'CALSCALE:GREGORIAN'];
      lastRes.items.forEach(function (it, i) {
        if (it.date < t) return;
        var end = new Date(it.date.getTime() + 864e5);
        lines.push('BEGIN:VEVENT', 'UID:pfotenwerk-' + ymd(it.date) + '-' + i + '@demo.invalid', 'DTSTAMP:' + stamp,
          'DTSTART;VALUE=DATE:' + ymd(it.date), 'DTEND;VALUE=DATE:' + ymd(end),
          'SUMMARY:' + esc('Impfung ' + name + ': ' + it.p.when + ' (Richtwert)'),
          'DESCRIPTION:' + esc(it.p.vax.join(', ') + '. Bitte Termin vereinbaren: Tierarztpraxis Pfotenwerk, 0421 555 76 50. Allgemeine Orientierung – den individuellen Impfplan legen wir gemeinsam fest.'),
          'END:VEVENT');
      });
      lines.push('END:VCALENDAR');
      var blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'impfplan-' + (name.toLowerCase().replace(/[^a-z0-9äöüß]+/g, '-').replace(/^-|-$/g, '') || 'tier') + '.ics';
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    }
    form.addEventListener('input', render);
    form.addEventListener('change', render);
    form.addEventListener('submit', function (e) { e.preventDefault(); render(); });
    dateIn.addEventListener('input', function () { dateIn.removeAttribute('data-example'); });
    if (icsBtn) icsBtn.addEventListener('click', ics);
    if (bookBtn) bookBtn.addEventListener('click', function () {
      var st = vaccState || { species: species() };
      var pre = { anliegen: 'impfung', art: ANLIEGEN_FROM_ART[st.species] || 'hund' };
      if (st.name) pre.name = st.name;
      if (st.birth) {
        var t = today(), months = (t.getFullYear() - st.birth.getFullYear()) * 12 + (t.getMonth() - st.birth.getMonth()) - (t.getDate() < st.birth.getDate() ? 1 : 0);
        pre.jahre = Math.floor(Math.max(0, months) / 12);
        pre.monate = Math.max(0, months) % 12;
        if (!pre.jahre && !pre.monate) pre.monate = 1;
      }
      prefillSignup(pre);
    });
    if ('ResizeObserver' in window) new ResizeObserver(debounce(function () { place(lastRes || { items: [] }, lastBirth); }, 80)).observe(tl);
    else window.addEventListener('resize', debounce(function () { place(lastRes || { items: [] }, lastBirth); }, 80));
    render();
  }

  /* ------------------------------------------------------------------
     Team: Kennzahlen zählen hoch
     ------------------------------------------------------------------ */
  function initCounts() {
    qsa('[data-count]').forEach(function (n) {
      var to = parseFloat(n.getAttribute('data-count'));
      var from = parseFloat(n.getAttribute('data-count-from') || '0');
      if (reduced() || isNaN(to)) return;
      n.textContent = String(Math.round(from));
      onceInView(n, function () {
        var t0 = performance.now(), dur = 1400;
        var step = function (t) {
          var k = clamp((t - t0) / dur, 0, 1);
          n.textContent = String(Math.round(lerp(from, to, easeOutCubic(k))));
          if (k < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }, { threshold: 0.6 });
    });
  }

  /* ------------------------------------------------------------------
     Patientengeschichten: horizontale Strecke (Desktop sticky, sonst Wischen)
     ------------------------------------------------------------------ */
  function initStories() {
    var sec = qs('#stimmen');
    var pin = qs('[data-stories-pin]');
    var vp = qs('[data-stories-viewport]');
    var track = qs('[data-stories-track]');
    if (!sec || !vp || !track) return;
    var prev = qs('[data-stories-prev]'), next = qs('[data-stories-next]');
    var score = qs('.story--score', track);
    if (score) {
      if (reduced()) score.classList.add('is-in');
      else onceInView(score, function () { score.classList.add('is-in'); }, { threshold: 0.4 });
    }
    var stepW = function () {
      var c = track.children[1] || track.children[0];
      var gap = parseFloat(getComputedStyle(track).columnGap) || 20;
      return c.getBoundingClientRect().width + gap;
    };
    var upd = function () {
      if (!prev || !next) return;
      prev.disabled = vp.scrollLeft < 4;
      next.disabled = vp.scrollLeft > vp.scrollWidth - vp.clientWidth - 4;
    };
    if (prev) prev.addEventListener('click', function () { vp.scrollBy({ left: -stepW(), behavior: reduced() ? 'auto' : 'smooth' }); });
    if (next) next.addEventListener('click', function () { vp.scrollBy({ left: stepW(), behavior: reduced() ? 'auto' : 'smooth' }); });
    var tick = false;
    vp.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(function () { tick = false; upd(); }); } }, { passive: true });
    window.addEventListener('resize', debounce(upd, 100));
    upd();

    if (!hasGSAP || reduced() || !pin) return;
    var seal = qs('.seal', track);
    if (seal) gsap.to(seal, { rotation: 220, ease: 'none', scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: true } });
    var mm = gsap.matchMedia();
    mm.add('(min-width: 900px) and (min-height: 700px)', function () {
      var pinTop = hdrH(), dist = 0;
      /* Sticky-Strecke: Abschnittshöhe = Bühne + horizontale Strecke, nur die Spur bewegt sich */
      var setup = function () {
        sec.classList.add('is-sticky');
        gsap.set(track, { x: 0 });
        var ph = pin.offsetHeight, room = window.innerHeight - hdrH();
        if (ph > room + 4) { sec.classList.remove('is-sticky'); return false; }
        pinTop = Math.round(hdrH() + (room - ph) / 2);
        dist = Math.max(0, track.scrollWidth - vp.clientWidth);
        sec.style.setProperty('--st-top', pinTop + 'px');
        sec.style.setProperty('--st-h', Math.round(ph + dist * 0.9 + window.innerHeight * 0.12) + 'px');
        return true;
      };
      if (!setup()) return;
      vp.scrollLeft = 0;
      gsap.to(track, {
        x: function () { return -dist; },
        ease: 'none',
        scrollTrigger: {
          trigger: sec,
          start: function () { return 'top ' + pinTop + 'px'; },
          end: function () { return 'bottom ' + (pinTop + pin.offsetHeight) + 'px'; },
          scrub: 0.6, invalidateOnRefresh: true
        }
      });
      ScrollTrigger.addEventListener('refreshInit', setup);
      return function () {
        ScrollTrigger.removeEventListener('refreshInit', setup);
        sec.classList.remove('is-sticky'); sec.style.removeProperty('--st-h'); sec.style.removeProperty('--st-top');
        gsap.set(track, { clearProps: 'transform' }); upd();
      };
    });
  }

  /* ------------------------------------------------------------------
     Neupatienten-Anmeldung mit Live-Patientenkarte
     ------------------------------------------------------------------ */
  var prefillSignup = function () {};
  function initSignup() {
    var form = qs('[data-signup]');
    var card = qs('[data-pcard]');
    if (!form || !card) return;
    var done = qs('[data-signup-done]');
    var live = qs('[data-form-live]', form);
    var f = {
      name: qs('#f-name', form), rasse: qs('#f-rasse', form), jahre: qs('#f-jahre', form), monate: qs('#f-monate', form),
      range: qs('[data-weight-range]', form), num: qs('[data-weight-num]', form), out: qs('[data-weight-out]', form),
      info: qs('#f-info', form), halter: qs('#f-halter', form), tel: qs('#f-tel', form), mail: qs('#f-mail', form),
      anliegen: qs('#f-anliegen', form), ds: qs('#f-ds', form)
    };
    var pc = {
      name: qs('[data-pc-name]', card), line: qs('[data-pc-line]', card), life: qs('[data-pc-life]', card), age: qs('[data-pc-age]', card),
      weight: qs('[data-pc-weight]', card), sex: qs('[data-pc-sex]', card), reason: qs('[data-pc-reason]', card), no: qs('[data-pc-no]', card),
      badge: qs('[data-pc-badge]', card), sils: qsa('[data-pc-sil]', card)
    };
    var touched = { age: false, weight: false };
    var tried = false;
    var lastArt = null;
    var year = String(new Date().getFullYear()).slice(-2);

    var art = function () { var r = form.querySelector('input[name="art"]:checked'); return r ? r.value : 'hund'; };
    var radio = function (name) { var r = form.querySelector('input[name="' + name + '"]:checked'); return r ? r.value : ''; };
    var weightVal = function () { var v = parseFloat(String(f.num.value).replace(',', '.')); return isNaN(v) ? null : v; };
    var ageParts = function () {
      var j = parseInt(f.jahre.value, 10), m = parseInt(f.monate.value, 10);
      return { j: isNaN(j) ? 0 : j, m: isNaN(m) ? 0 : m, okJ: f.jahre.value === '' || (!isNaN(j) && j >= 0 && j <= 30), okM: f.monate.value === '' || (!isNaN(m) && m >= 0 && m <= 11) };
    };
    function ageLabel() {
      var a = ageParts();
      if (!touched.age || (!a.j && !a.m) || !a.okJ || !a.okM) return '–';
      var parts = [];
      if (a.j) parts.push(a.j + NBSP + (a.j === 1 ? 'Jahr' : 'Jahre'));
      if (a.m) parts.push(a.m + NBSP + (a.m === 1 ? 'Monat' : 'Monate'));
      return parts.join(', ');
    }
    function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return Math.abs(h); }
    function setRange(a, keepValue) {
      var cfg = PETS[a] || PETS.hund;
      f.range.min = cfg.range[0]; f.range.max = cfg.range[1]; f.range.step = cfg.range[2];
      var v = weightVal();
      if (!keepValue || v == null) f.range.value = cfg.def;
      else f.range.value = clamp(v, cfg.range[0], cfg.range[1]);
      paintRange();
    }
    function paintRange() {
      var min = parseFloat(f.range.min), max = parseFloat(f.range.max), v = parseFloat(f.range.value);
      f.range.style.setProperty('--p', ((v - min) / (max - min) * 100).toFixed(2) + '%');
    }
    function update(opts) {
      opts = opts || {};
      var a = art(), cfg = PETS[a] || PETS.hund;
      if (a !== lastArt) {
        card.setAttribute('data-art', a);
        pc.sils.forEach(function (s) { s.classList.toggle('is-on', s.getAttribute('data-pc-sil') === a); });
        if (lastArt !== null && !reduced()) { card.classList.remove('is-pop'); void card.offsetWidth; card.classList.add('is-pop'); }
        setRange(a, touched.weight);
        lastArt = a;
      }
      var name = (f.name.value || '').trim();
      pc.name.textContent = name || 'Ihr Tier';
      var rasse = (f.rasse.value || '').trim();
      pc.line.textContent = cfg.name + ' · ' + (rasse || 'Rasse noch offen');
      pc.age.textContent = ageLabel();
      var w = weightVal();
      var wOk = w != null && w > 0;
      pc.weight.textContent = touched.weight && wOk ? kgFmt(w) : '–';
      if (f.out) f.out.textContent = touched.weight && wOk ? kgFmt(w) : '–';
      var s = wOk && touched.weight ? clamp(0.92 + 0.12 * Math.log2(w / cfg.typical), 0.76, 1.06) : 0.92;
      card.style.setProperty('--s', s.toFixed(3));
      var sex = radio('geschlecht');
      var kastr = form.querySelector('input[name="kastriert"]') && form.querySelector('input[name="kastriert"]').checked;
      var sexTxt = sex === 'unbekannt' ? 'unbekannt' : sex;
      pc.sex.textContent = sex || kastr ? [sexTxt, kastr ? 'kastriert' : ''].filter(Boolean).join(' · ') : '–';
      var opt = f.anliegen.options[f.anliegen.selectedIndex];
      pc.reason.textContent = f.anliegen.value ? opt.textContent.replace(/ \/ .*$/, '').replace(/ – .*$/, '') : '–';
      /* Lebensphase */
      var ap = ageParts(), years = ap.j + ap.m / 12;
      var life = '';
      if (touched.age && (ap.j || ap.m)) {
        if (cfg.young && years < cfg.young) life = cfg.youngName;
        else if (years >= cfg.senior) life = 'Senior · Vorsorge-Check';
      }
      pc.life.textContent = life;
      pc.life.hidden = !life;
      pc.no.textContent = 'PW-' + year + '-' + pad2(Math.floor(hash((name || 'tier') + a) % 100)) + pad2(hash(a + (name || '')) % 100);
      if (tried && !opts.silent) validate(false);
    }

    /* Gewicht: Regler <-> Zahl */
    f.range.addEventListener('input', function () {
      touched.weight = true;
      var v = parseFloat(f.range.value);
      f.num.value = String(Math.round(v * 100) / 100);
      paintRange();
      update();
    });
    f.num.addEventListener('input', function () {
      touched.weight = f.num.value !== '';
      var v = weightVal();
      if (v != null) { f.range.value = clamp(v, parseFloat(f.range.min), parseFloat(f.range.max)); paintRange(); }
      update();
    });
    [f.jahre, f.monate].forEach(function (i) { i.addEventListener('input', function () { touched.age = true; }); });
    form.addEventListener('input', function () { update(); });
    form.addEventListener('change', function () { update(); });

    /* Validierung */
    var errEl = function (id) { return qs('#' + id); };
    function setErr(input, errId, msg) {
      var e = errEl(errId);
      if (input) { if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid'); }
      if (e) { e.textContent = msg || ''; e.hidden = !msg; }
      return !msg;
    }
    function validate(focus) {
      var bad = [];
      var name = f.name.value.trim();
      if (!setErr(f.name, 'f-name-err', name ? '' : 'Bitte den Namen Ihres Tiers eintragen.')) bad.push(f.name);
      var ap = ageParts();
      var ageMsg = '';
      if (!ap.okJ || !ap.okM) ageMsg = 'Bitte Jahre (0–30) und Monate (0–11) prüfen.';
      else if (!ap.j && !ap.m) ageMsg = 'Bitte das ungefähre Alter angeben – bei sehr jungen Tieren z.' + NBSP + 'B. 0 Jahre, 1 Monat.';
      var ageErr = errEl('f-alter-err');
      [f.jahre, f.monate].forEach(function (i) { if (ageMsg) i.setAttribute('aria-invalid', 'true'); else i.removeAttribute('aria-invalid'); });
      if (ageErr) { ageErr.textContent = ageMsg; ageErr.hidden = !ageMsg; }
      if (ageMsg) bad.push(!ap.okM && ap.okJ ? f.monate : f.jahre);
      var cfg = PETS[art()] || PETS.hund, w = weightVal();
      var wMsg = '';
      if (w == null) wMsg = 'Bitte ein ungefähres Gewicht angeben – Schieberegler oder Zahl.';
      else if (w < cfg.valid[0] || w > cfg.valid[1]) wMsg = 'Das Gewicht wirkt für ' + (art() === 'anderes' ? 'dieses Tier' : cfg.name === 'Katze' ? 'eine Katze' : cfg.name === 'Hund' ? 'einen Hund' : 'ein ' + cfg.name) + ' ungewöhnlich – bitte prüfen (' + numFmt(cfg.valid[0], cfg.valid[0] < 1 ? 2 : 0) + '–' + numFmt(cfg.valid[1]) + NBSP + 'kg).';
      if (!setErr(f.num, 'f-gewicht-err', wMsg)) bad.push(f.num);
      if (!setErr(f.halter, 'f-halter-err', f.halter.value.trim().length >= 2 ? '' : 'Bitte Ihren Namen eintragen.')) bad.push(f.halter);
      var tel = f.tel.value.replace(/[^\d+]/g, '');
      if (!setErr(f.tel, 'f-tel-err', tel.length >= 6 ? '' : (f.tel.value.trim() ? 'Die Telefonnummer scheint zu kurz.' : 'Bitte eine Telefonnummer für den Rückruf angeben.'))) bad.push(f.tel);
      var mail = f.mail.value.trim();
      if (!setErr(f.mail, 'f-mail-err', !mail || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail) ? '' : 'Bitte die E-Mail-Adresse prüfen.')) bad.push(f.mail);
      if (!setErr(f.anliegen, 'f-anliegen-err', f.anliegen.value ? '' : 'Bitte ein Anliegen auswählen.')) bad.push(f.anliegen);
      if (!setErr(f.ds, 'f-ds-err', f.ds.checked ? '' : 'Bitte stimmen Sie der Verarbeitung zur Terminvereinbarung zu.')) bad.push(f.ds);
      if (focus && bad.length) {
        bad[0].focus();
        if (live) live.textContent = bad.length === 1 ? 'Bitte prüfen Sie ein Feld.' : 'Bitte prüfen Sie ' + bad.length + ' Felder.';
      }
      return !bad.length;
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      tried = true;
      if (!validate(true)) return;
      var a = art(), cfg = PETS[a] || PETS.hund;
      var sum = qs('[data-done-sum]', done);
      sum.textContent = '';
      var add = function (k, v) { if (!v) return; sum.appendChild(el('dt', null, k)); sum.appendChild(el('dd', null, v)); };
      var rasse = f.rasse.value.trim();
      add('Tier', f.name.value.trim());
      add('Tierart', cfg.name + (rasse ? ' · ' + rasse : ''));
      add('Alter', ageLabel());
      add('Gewicht', kgFmt(weightVal()));
      add('Geschlecht', pc.sex.textContent !== '–' ? pc.sex.textContent : '');
      add('Anliegen', f.anliegen.options[f.anliegen.selectedIndex].textContent);
      add('Wunschzeit', radio('zeit'));
      add('Hinweise', f.info.value.trim());
      add('Halter/in', f.halter.value.trim());
      add('Telefon', f.tel.value.trim());
      add('E-Mail', f.mail.value.trim());
      add('Patienten-Nr.', pc.no.textContent + ' (Beispiel)');
      qs('[data-done-name]', done).textContent = f.name.value.trim();
      form.hidden = true;
      done.hidden = false;
      card.classList.add('is-done');
      if (pc.badge) pc.badge.textContent = 'Angemeldet';
      focusNoScroll(done);
      if (!mqDesk.matches || done.getBoundingClientRect().top < hdrH()) scrollToEl(qs('#anmeldung') || done, { focus: false });
    });
    var again = qs('[data-signup-again]', done);
    if (again) again.addEventListener('click', function () {
      ['name', 'rasse', 'info'].forEach(function (k) { f[k].value = ''; });
      f.jahre.value = '0'; f.monate.value = '0'; f.num.value = '';
      qsa('input[name="geschlecht"], input[name="kastriert"]', form).forEach(function (i) { i.checked = false; });
      f.anliegen.value = '';
      touched.age = false; touched.weight = false; tried = false;
      qsa('[aria-invalid]', form).forEach(function (i) { i.removeAttribute('aria-invalid'); });
      qsa('.field__err', form).forEach(function (e) { e.hidden = true; e.textContent = ''; });
      setRange(art(), false);
      card.classList.remove('is-done');
      if (pc.badge) pc.badge.textContent = 'Neupatient';
      done.hidden = true;
      form.hidden = false;
      update({ silent: true });
      f.name.focus();
    });

    /* Vorbelegen aus Leistungen, Wegweiser und Impfplaner */
    prefillSignup = function (pre) {
      if (!pre) return;
      if (pre.anliegen && f.anliegen.querySelector('option[value="' + pre.anliegen + '"]')) f.anliegen.value = pre.anliegen;
      if (pre.art) { var r = form.querySelector('input[name="art"][value="' + pre.art + '"]'); if (r) r.checked = true; }
      if (pre.name && !f.name.value.trim()) f.name.value = pre.name;
      if (pre.jahre != null && !touched.age) { f.jahre.value = pre.jahre; f.monate.value = pre.monate || 0; touched.age = true; }
      if (!form.hidden) update({ silent: true });
    };
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('[data-prefill], [data-er-book]');
      if (!a) return;
      var pre = { anliegen: a.getAttribute('data-prefill') || (a.hasAttribute('data-er-book') ? 'krank' : '') };
      var artAttr = a.getAttribute('data-prefill-art');
      if (artAttr) pre.art = artAttr;
      else if (a.hasAttribute('data-er-book')) pre.art = ANLIEGEN_FROM_ART[triageSpecies()] || 'hund';
      prefillSignup(pre);
    });

    /* Karte neigt sich leicht zum Zeiger */
    if (hasGSAP && !reduced() && finePointer.matches) {
      var wrap = card.parentElement;
      var rx = gsap.quickTo(card, 'rotationX', { duration: 0.7, ease: 'power3.out' });
      var ry = gsap.quickTo(card, 'rotationY', { duration: 0.7, ease: 'power3.out' });
      gsap.set(card, { transformPerspective: 1100 });
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var nx = (e.clientX - r.left) / r.width, ny = (e.clientY - r.top) / r.height;
        ry((nx - 0.5) * 9); rx((0.5 - ny) * 7);
        card.style.setProperty('--gx', (nx * 100).toFixed(1) + '%');
        card.style.setProperty('--gy', (ny * 100).toFixed(1) + '%');
      });
      card.addEventListener('pointerleave', function () { rx(0); ry(0); });
      void wrap;
    }
    setRange(art(), false);
    update({ silent: true });
  }

  /* ------------------------------------------------------------------
     Karte: Stadtteile hervorheben
     ------------------------------------------------------------------ */
  function initMap() {
    var btns = qsa('[data-area-btn]');
    if (!btns.length) return;
    var areas = qsa('[data-area]');
    btns.forEach(function (b) {
      b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', function () {
        var on = b.getAttribute('aria-pressed') !== 'true';
        btns.forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        if (on) b.setAttribute('aria-pressed', 'true');
        var id = on ? b.getAttribute('data-area-btn') : null;
        areas.forEach(function (p) { p.classList.toggle('is-hot', p.getAttribute('data-area') === id); });
      });
    });
  }

  /* ------------------------------------------------------------------
     FAQ: immer nur eine Antwort offen (ohne JS: mehrere möglich)
     ------------------------------------------------------------------ */
  function initFaq() {
    var all = qsa('.faq .qa');
    all.forEach(function (d) {
      d.addEventListener('toggle', function () {
        if (!d.open) return;
        all.forEach(function (o) { if (o !== d && o.open) o.open = false; });
      });
    });
  }

  /* ------------------------------------------------------------------
     Start
     ------------------------------------------------------------------ */
  /* ------------------------------------------------------------------
     Handy/Tablet: Mini-Patientenkarte, solange das Formular im Blick und die
     große Karte darüber schon weggescrollt ist – die Live-Vorschau bleibt sichtbar.
     Spiegelt nur die Texte der großen Karte (textContent), dekorativ (aria-hidden).
     ------------------------------------------------------------------ */
  function initMiniCard() {
    var card = qs('[data-pcard]'), form = qs('[data-signup]');
    if (!card || !form || !('IntersectionObserver' in window) || !window.MutationObserver) return;
    var mq = window.matchMedia('(max-width: 1099px)');
    var mini = el('div', 'pmini');
    mini.setAttribute('aria-hidden', 'true');
    var pic = el('span', 'pmini__pic');
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    var use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    svg.appendChild(use); pic.appendChild(svg);
    var txt = el('span', 'pmini__txt'), nm = el('span', 'pmini__name'), ln = el('span', 'pmini__line');
    txt.appendChild(nm); txt.appendChild(ln);
    mini.appendChild(pic); mini.appendChild(txt); mini.appendChild(el('span', 'pmini__k', 'Vorschau'));
    document.body.appendChild(mini);
    var get = function (sel) { var n = qs(sel, card); return n ? n.textContent.trim() : ''; };
    function sync() {
      nm.textContent = get('[data-pc-name]');
      ln.textContent = [get('[data-pc-line]'), get('[data-pc-age]'), get('[data-pc-weight]')].filter(function (t) { return t && t !== '–'; }).join(' · ');
      var on = qs('.pcard__sil.is-on use', card);
      if (on) use.setAttribute('href', on.getAttribute('href'));
      svg.setAttribute('class', on && on.getAttribute('href') === '#paw' ? 'is-paw' : '');
    }
    sync();
    new MutationObserver(sync).observe(card, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['class'] });
    var formIn = false, cardIn = true;
    function show() { mini.classList.toggle('is-on', mq.matches && formIn && !cardIn); }
    new IntersectionObserver(function (es) { formIn = es[es.length - 1].isIntersecting; show(); }, { rootMargin: '-120px 0px -35% 0px' }).observe(form);
    /* Maßgeblich ist der Kopf der Karte (Bild + Name): ist er unter dem Header verschwunden, übernimmt die Mini-Karte */
    new IntersectionObserver(function (es) { cardIn = es[es.length - 1].isIntersecting; show(); }, { rootMargin: '-72px 0px 0px 0px' }).observe(qs('.pcard__main', card) || card);
    if (mq.addEventListener) mq.addEventListener('change', show);
  }

  /* Start in Etappen: Sichtbares (Header, Hero, Status) sofort, die Widgets weiter unten
     in eigenen Tasks – so blockiert kein einzelner langer Task den Hauptthread.
     Reihenfolge bleibt die der Seite (wichtig für ScrollTrigger-Pins). */
  var BOOT = [
    [['scroll', initScroll], ['header', initHeader], ['menu', initMenu], ['status', initStatus], ['hero', initHero]],
    [['reveal', initReveal], ['split', initSplit], ['magnet', initMagnet], ['railReveal', initRailReveal]],
    [['wiggle', initWiggle], ['triage', initTriage], ['erfx', initErFx]],
    [['visit', initVisit]],
    [['vacc', initVacc], ['vaccGrow', initVaccGrow], ['counts', initCounts]],
    [['board', initBoard]],
    [['stories', initStories]],
    [['signup', initSignup], ['minicard', initMiniCard], ['map', initMap], ['faq', initFaq]],
    [['trail', initTrail]]
  ];

  var refresh = hasGSAP ? debounce(function () { ScrollTrigger.refresh(); }, 120) : function () {};
  function bootDone() {
    if (!hasGSAP) return;
    refresh();
    /* Direktaufruf mit Anker (#anmeldung …): nach dem Anlegen der Pins Position korrigieren */
    var t = location.hash.length > 1 && document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (t && window.scrollY > 0) {
      var y = Math.max(0, t.getBoundingClientRect().top + window.scrollY - hdrH() - 14);
      if (lenis) lenis.scrollTo(y, { immediate: true }); else window.scrollTo(0, y);
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
    window.addEventListener('load', refresh);
  }
  function run(i) {
    BOOT[i].forEach(function (b) { safe(b[0], b[1]); });
    if (i + 1 < BOOT.length) setTimeout(function () { run(i + 1); }, 0);
    else bootDone();
  }
  /* eigener Task statt im Skript-Auswerten (gsap/ScrollTrigger laufen im selben Task) */
  setTimeout(function () { run(0); }, 0);
  /* Unterer Seitenteil (content-visibility: auto): sobald gerendert, ScrollTrigger und Spur nachziehen */
  if (hasGSAP) document.addEventListener('contentvisibilityautostatechange', function () { refresh(); }, true);
})();
