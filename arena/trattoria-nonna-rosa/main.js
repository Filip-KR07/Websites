/* ==========================================================================
   Trattoria Nonna Rosa · Modell „Tavola“ – „der gedeckte Tisch“
   Ohne Build-Schritt. Optional: GSAP + ScrollTrigger, Lenis (lokal unter assets/vendor).
   Alle Inhalte, die sich häufig ändern (Tafel, Weine, Reservierungsregeln), stehen
   als Konstanten direkt hier oben.
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
     1 · Konstanten (anpassbar)
     ------------------------------------------------------------------ */

  /** Zeitzone für Öffnungsstatus, Kalender und Tafel */
  var TZ = 'Europe/Berlin';

  /** Öffnungszeiten je Wochentag (0 = So … 6 = Sa) als [von, bis] in Minuten ab Mitternacht */
  var HOURS = {
    0: [[12 * 60, 21 * 60]],
    1: [],
    2: [[12 * 60, 14 * 60 + 30], [17 * 60 + 30, 22 * 60 + 30]],
    3: [[12 * 60, 14 * 60 + 30], [17 * 60 + 30, 22 * 60 + 30]],
    4: [[12 * 60, 14 * 60 + 30], [17 * 60 + 30, 22 * 60 + 30]],
    5: [[12 * 60, 14 * 60 + 30], [17 * 60 + 30, 22 * 60 + 30]],
    6: [[12 * 60, 14 * 60 + 30], [17 * 60 + 30, 22 * 60 + 30]]
  };

  /** Pasta des Tages (Wochenplan). Schlüssel = Wochentag (0 = So). Montag = Ruhetag. */
  var TAFEL = {
    2: { l1: 'Pappardelle', l2: 'al ragù bianco', desc: 'Salsiccia · Fenchel · Pecorino', preis: '16,50', wein: 'Falanghina · 0,1 l · 6,80' },
    3: { l1: 'Tortelli', l2: 'ricotta e spinaci', desc: 'Salbeibutter · geröstete Haselnüsse', preis: '15,90', wein: 'Frascati · 0,1 l · 6,20' },
    4: { l1: 'Tagliolini', l2: 'al limone', desc: 'Amalfi-Zitrone · Butter · Parmigiano', preis: '14,90', wein: 'Vermentino · 0,1 l · 7,50' },
    5: { l1: 'Linguine', l2: 'allo scoglio', desc: 'Miesmuscheln · Garnelen · Kirschtomaten', preis: '21,50', wein: 'Falanghina · 0,1 l · 6,80' },
    6: { l1: 'Lasagne', l2: 'della Nonna', desc: 'Ragù · Béchamel · zwölf Schichten', preis: '17,50', wein: 'Aglianico · 0,1 l · 7,20' },
    0: { l1: 'Gnocchi', l2: 'alla sorrentina', desc: 'Tomate · Fior di latte · aus dem Holzofen', preis: '15,50', wein: 'Chianti Classico · 0,1 l · 7,90' }
  };

  /** Wein-Pairing: Geschmacksprofil 0–5 je Achse (Reihenfolge wie AXES) */
  var AXES = ['Frucht', 'Säure', 'Tannin', 'Körper', 'Süße', 'Mineralik'];
  var PAIRING = {
    vitello: { dish: 'Vitello tonnato', wine: 'Vermentino di Gallura', origin: 'DOCG · Sardinien · Rebsorte Vermentino', price: '7,50', temp: '8–10', vals: [3, 4, 0, 2, 1, 5],
      why: 'Salzige Mineralik und frische Säure halten die cremige Thunfischsauce leicht. Ohne Tannin – das würde mit dem Fisch metallisch schmecken.' },
    vongole: { dish: 'Spaghetti alle vongole', wine: 'Falanghina del Sannio', origin: 'DOC · Kampanien · Rebsorte Falanghina', price: '6,80', temp: '8–10', vals: [4, 4, 0, 2, 1, 4],
      why: 'Beide kommen vom Golf von Neapel: Zitrusfrucht und lebendige Säure wirken wie ein Spritzer Zitrone über den Muscheln.' },
    cacio: { dish: 'Cacio e pepe', wine: 'Frascati Superiore', origin: 'DOCG · Latium · Malvasia und Trebbiano', price: '6,20', temp: '8–10', vals: [3, 3, 0, 3, 1, 3],
      why: 'Römisch zu römisch: Die weiche Frucht puffert Pecorino-Salz und Pfefferschärfe, ohne sich in den Vordergrund zu drängen.' },
    tortelli: { dish: 'Tortelli di zucca', wine: 'Barbera d’Asti', origin: 'DOCG · Piemont · Rebsorte Barbera', price: '7,40', temp: '15–17', vals: [5, 4, 2, 3, 1, 1],
      why: 'Viel Frucht, wenig Tannin: Die Barbera hält mit der Süße von Kürbis und Amaretti mit, ihre Säure räumt die Salbeibutter auf.' },
    ragu: { dish: 'Tagliatelle al ragù', wine: 'Aglianico Irpinia', origin: 'DOC · Kampanien · Rebsorte Aglianico', price: '7,20', temp: '16–18', vals: [3, 3, 5, 4, 0, 2],
      why: 'Kräftiges Tannin trifft auf sechs Stunden geschmortes Fleisch. Das Fett im Ragù macht den Wein weich – und der Wein den nächsten Bissen wieder frisch.' },
    saltimbocca: { dish: 'Saltimbocca alla romana', wine: 'Chianti Classico', origin: 'DOCG · Toskana · Rebsorte Sangiovese', price: '7,90', temp: '16–18', vals: [4, 4, 3, 3, 0, 2],
      why: 'Sauerkirsche und Kräuterwürze spiegeln den Salbei, die Säure des Sangiovese schneidet durch Schinken und Butter.' },
    tiramisu: { dish: 'Tiramisù della Nonna', wine: 'Moscato d’Asti', origin: 'DOCG · Piemont · Moscato Bianco, leicht perlend', price: '6,50', temp: '6–8', vals: [5, 3, 0, 1, 4, 1],
      why: 'Der Wein muss mindestens so süß sein wie das Dessert. Der Moscato ist es – und mit nur 5,5 % Alkohol und feiner Perlage bleibt er leicht neben Mascarpone und Espresso.' }
  };

  /** Reservierung (Demo-Logik, keine Datenübertragung) */
  var RES = {
    daysAhead: 60,          // so weit im Voraus online buchbar
    minLeadMinutes: 120,    // kürzer vorher: bitte anrufen
    minPersons: 1,
    maxPersons: 12,
    groupFrom: 9,           // ab hier Hinweis auf La Cantina
    slots: {
      weekday: { mittag: ['12:00', '12:30', '13:00', '13:30'], abend: ['17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'] },
      sunday: { mittag: ['12:00', '12:30', '13:00', '13:30', '14:00'], abend: ['17:00', '17:30', '18:00', '18:30', '19:00', '19:30'] }
    },
    busyShare: { normal: 0.2, weekend: 0.45 }, // Anteil „ausgebuchter“ Zeiten (deterministisch je Datum)
    durationMinutes: 120    // für den Kalendereintrag (.ics)
  };

  var DOW_LONG = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  var DOW_SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  var MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

  /* ------------------------------------------------------------------
     2 · Hilfsfunktionen
     ------------------------------------------------------------------ */
  var doc = document.documentElement;
  var qs = function (s, r) { return (r || document).querySelector(s); };
  var qsa = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var easeInOut = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };
  var easeWrite = function (t) { return -(Math.cos(Math.PI * t) - 1) / 2; };
  var dprMax = function () { return Math.min(window.devicePixelRatio || 1, 2); };

  var motionOff = doc.classList.contains('motion-off');
  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduced = function () { return motionOff || mqReduce.matches; };
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasGSAP = false; // wird nach dem Nachladen der Bibliotheken gesetzt (main.js lädt sie selbst, in eigenen Tasks)
  var VENDOR = ['/arena/trattoria-nonna-rosa/assets/vendor/gsap.min.js', '/arena/trattoria-nonna-rosa/assets/vendor/ScrollTrigger.min.js', '/arena/trattoria-nonna-rosa/assets/vendor/lenis.min.js'];
  var lenis = null;

  function safe(name, fn) {
    try { fn(); } catch (err) { if (window.console) console.warn('[Nonna Rosa] ' + name + ':', err); }
  }

  /** Aktuelles Datum/Uhrzeit in Berlin – unabhängig von der Zeitzone des Geräts */
  var berlinFmt = null;
  function berlinNow() {
    var d = new Date(), o = {};
    try {
      if (!berlinFmt) berlinFmt = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false, weekday: 'short' });
      var parts = berlinFmt.formatToParts(d);
      parts.forEach(function (p) { o[p.type] = p.value; });
      var wd = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[o.weekday];
      var h = +o.hour % 24;
      return { y: +o.year, m: +o.month - 1, d: +o.day, dow: wd, min: h * 60 + (+o.minute) };
    } catch (e) {
      return { y: d.getFullYear(), m: d.getMonth(), d: d.getDate(), dow: d.getDay(), min: d.getHours() * 60 + d.getMinutes() };
    }
  }
  /** Kalenderdatum (ohne Uhrzeit) als UTC-Mittag, damit Sommerzeit nie stört */
  function mkDate(y, m, d) { return new Date(Date.UTC(y, m, d, 12)); }
  function addDays(dt, n) { return new Date(dt.getTime() + n * 864e5); }
  function sameDay(a, b) { return a && b && a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth() && a.getUTCDate() === b.getUTCDate(); }
  function isoDate(dt) { return dt.getUTCFullYear() + '-' + String(dt.getUTCMonth() + 1).padStart(2, '0') + '-' + String(dt.getUTCDate()).padStart(2, '0'); }
  function fmtDate(dt, withYear) { return DOW_LONG[dt.getUTCDay()] + ', ' + dt.getUTCDate() + '. ' + MONTHS[dt.getUTCMonth()] + (withYear ? ' ' + dt.getUTCFullYear() : ''); }
  function fmtShort(dt) { return DOW_SHORT[dt.getUTCDay()] + ', ' + dt.getUTCDate() + '. ' + MONTHS[dt.getUTCMonth()].slice(0, 3) + (MONTHS[dt.getUTCMonth()].length > 4 ? '.' : ''); }
  function fmtTime(min) { var h = Math.floor(min / 60), m = min % 60; return m ? h + ':' + String(m).padStart(2, '0') : String(h); }
  function toMin(hhmm) { var p = hhmm.split(':'); return +p[0] * 60 + (+p[1]); }

  /** Kleiner deterministischer Zufall (für „ausgebuchte“ Demo-Zeiten) */
  function hashStr(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function seeded(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  /** rAF-Tween mit Abbruch-Token */
  function tween(dur, ease, onUpdate, onDone, token) {
    var t0 = null;
    function frame(now) {
      if (token && token.cancelled) return;
      if (t0 === null) t0 = now;
      var p = dur <= 0 ? 1 : Math.min(1, (now - t0) / dur);
      onUpdate(ease ? ease(p) : p);
      if (p < 1) requestAnimationFrame(frame); else if (onDone) onDone();
    }
    requestAnimationFrame(frame);
  }
  function wait(ms, token, fn) { setTimeout(function () { if (!token || !token.cancelled) fn(); }, ms); }

  /** Sichtbarkeits-Gate: Callback nur, wenn Element im Viewport und Tab aktiv */
  function visibilityGate(el, onChange, margin) {
    var inView = false;
    var update = function () { onChange(inView && !document.hidden); };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) { inView = entries[0].isIntersecting; update(); }, { rootMargin: margin || '100px 0px' }).observe(el);
    } else { inView = true; }
    document.addEventListener('visibilitychange', update);
    update();
  }

  /* ------------------------------------------------------------------
     3 · Smooth Scroll (Lenis) + Anker
     ------------------------------------------------------------------ */
  function headerOffset() { var h = qs('[data-header]'); return h ? h.offsetHeight : 0; }

  function initScroll() {
    if (hasGSAP) gsap.registerPlugin(ScrollTrigger);
    if (!reduced() && window.Lenis) {
      lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1, anchors: false });
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
      closeMenu(false);
      scrollToTarget(target);
      if (history.pushState) history.pushState(null, '', id);
    });
  }

  function scrollToTarget(target) {
    var top = target.id === 'top' ? 0 : null;
    var focus = function () {
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    };
    if (lenis) {
      var ty = top === null ? target.getBoundingClientRect().top + window.scrollY - headerOffset() + 1 : 0;
      lenis.scrollTo(ty, { duration: 1.3, easing: easeInOut, onComplete: focus });
    } else {
      var y = top === null ? target.getBoundingClientRect().top + window.scrollY - headerOffset() + 1 : 0;
      window.scrollTo({ top: y, behavior: reduced() ? 'auto' : 'smooth' });
      setTimeout(focus, reduced() ? 0 : 600);
    }
  }

  /* ------------------------------------------------------------------
     4 · Header, Fortschritt, aktive Navigation, mobiles Menü
     ------------------------------------------------------------------ */
  var menuEl, menuBtn, lastFocus;

  function initHeader() {
    var header = qs('[data-header]');
    var bar = qs('[data-progress]');
    var actionBar = qs('.action-bar');
    var ticking = false, lastY = window.scrollY;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY, max = document.documentElement.scrollHeight - window.innerHeight;
        header.classList.toggle('is-scrolled', y > 24);
        if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? clamp(y / max, 0, 1) : 0).toFixed(4) + ')';
        lastY = y; ticking = false;
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Aktiver Navigationspunkt
    var links = qsa('.main-nav a');
    var map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          var a = map[en.target.id];
          if (!a) return;
          if (en.isIntersecting) { links.forEach(function (l) { l.removeAttribute('aria-current'); }); a.setAttribute('aria-current', 'true'); }
          else if (a.getAttribute('aria-current')) a.removeAttribute('aria-current');
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
    }

    // Fixe Demo-Pille ausblenden, sobald der Footer (mit eigener Pille) sichtbar ist
    var pill = qs('.demo-pill--fixed'), foot = qs('.site-footer');
    if (pill && foot && 'IntersectionObserver' in window) new IntersectionObserver(function (en) { pill.classList.toggle('is-hidden', en[0].isIntersecting); }, { rootMargin: '0px 0px -20% 0px' }).observe(foot);

    // Aktionsleiste ausblenden, solange ein Formularfeld fokussiert ist (Tastatur auf dem Handy)
    if (actionBar) {
      document.addEventListener('focusin', function (e) { if (e.target.matches('input:not([type=radio]):not([type=checkbox]), textarea')) actionBar.classList.add('is-hidden'); });
      document.addEventListener('focusout', function () { actionBar.classList.remove('is-hidden'); });
    }

    // Mobiles Menü (Dialog mit Fokusführung)
    menuEl = qs('[data-mobile-menu]');
    menuBtn = qs('[data-menu-open]');
    if (!menuEl || !menuBtn) return;
    qsa('.mobile-links li', menuEl).forEach(function (li, i) { li.style.setProperty('--i', i); });
    menuBtn.addEventListener('click', openMenu);
    qs('[data-menu-close]', menuEl).addEventListener('click', function () { closeMenu(true); });
    menuEl.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); closeMenu(true); return; }
      if (e.key !== 'Tab') return;
      var f = qsa('a[href], button', menuEl).filter(function (x) { return x.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }
  function openMenu() {
    lastFocus = document.activeElement;
    menuEl.hidden = false;
    menuEl.classList.add('is-entering');
    menuBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    if (lenis) lenis.stop();
    requestAnimationFrame(function () { requestAnimationFrame(function () { menuEl.classList.remove('is-entering'); }); });
    var first = qs('.mobile-links a', menuEl);
    if (first) first.focus({ preventScroll: true });
  }
  function closeMenu(restore) {
    if (!menuEl || menuEl.hidden) return;
    menuEl.hidden = true;
    menuBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    if (lenis) lenis.start();
    if (restore && lastFocus) lastFocus.focus({ preventScroll: true });
  }

  /* ------------------------------------------------------------------
     5 · Öffnungsstatus (Hero) + heutiger Tag in der Zeitentabelle
     ------------------------------------------------------------------ */
  function initStatus() {
    var el = qs('[data-status]'), txt = qs('[data-status-text]');
    function update() {
      var n = berlinNow(), today = HOURS[n.dow], state = 'closed', label = '';
      var cur = today.filter(function (r) { return n.min >= r[0] && n.min < r[1]; })[0];
      var later = today.filter(function (r) { return n.min < r[0]; })[0];
      if (cur) {
        var left = cur[1] - n.min;
        state = left <= 30 ? 'soon' : 'open';
        label = left <= 30 ? 'Gleich Schluss · Küche bis ' + fmtTime(cur[1] - 30) + ' Uhr' : 'Jetzt geöffnet · bis ' + fmtTime(cur[1]) + ' Uhr';
      } else if (later) {
        label = (n.dow === 0 ? 'Heute' : 'Heute wieder') + ' ab ' + fmtTime(later[0]) + ' Uhr geöffnet';
        if (n.min < 11 * 60) label = 'Heute ab ' + fmtTime(later[0]) + ' Uhr geöffnet';
      } else {
        for (var i = 1; i <= 7; i++) {
          var dw = (n.dow + i) % 7;
          if (HOURS[dw].length) {
            label = (n.dow === 1 && i === 1 ? 'Heute Ruhetag' : 'Geschlossen') + ' · ' + (i === 1 ? 'morgen' : DOW_LONG[dw]) + ' ab ' + fmtTime(HOURS[dw][0][0]) + ' Uhr';
            if (n.dow === 1 && i === 1) label = 'Montag Ruhetag · morgen ab ' + fmtTime(HOURS[dw][0][0]) + ' Uhr';
            break;
          }
        }
      }
      if (el && txt) { el.setAttribute('data-state', state); txt.textContent = label; }
      qsa('[data-hours] tr').forEach(function (tr) { tr.classList.toggle('is-today', +tr.getAttribute('data-dow') === n.dow); });
    }
    update();
    setInterval(update, 60000);
  }
  /** Wein im Glas: Farbe, Füllhöhe (y der Oberfläche im Glas-SVG, kleiner = voller), perlend */
  var WINE = {
    vitello: { c: '#E3C964', lvl: 132 }, vongole: { c: '#E8D27A', lvl: 134 }, cacio: { c: '#EAD88C', lvl: 136 },
    tortelli: { c: '#7E1630', lvl: 126 }, ragu: { c: '#5A0D1C', lvl: 124 }, saltimbocca: { c: '#741325', lvl: 126 },
    tiramisu: { c: '#EED985', lvl: 150, sp: true }
  };
  var GLASS_EMPTY = 236;

  /* ------------------------------------------------------------------
     6 · Hero: gedeckter Tisch – Feder-Physik, Lampe folgt der Maus
     ------------------------------------------------------------------ */
  function initHero() {
    // Tagesgericht auf Nonnas Zettel
    var n = berlinNow();
    var dow = n.dow === 1 ? 2 : n.dow;
    var dish = TAFEL[dow];
    var dishEl = qs('[data-hero-dish]');
    if (dishEl && dish) dishEl.textContent = dish.l1 + ' ' + dish.l2;
    if (n.dow === 1) { var k = qs('[data-slip-k]'); if (k) k.textContent = 'morgen an der Tafel:'; }

    if (reduced()) return;
    var table = qs('[data-table]');
    if (!table) return;
    var items = qsa('[data-depth]', table).map(function (el) {
      var sh = qs('.obj-sh, .card-sh', el);
      var isCard = el.classList.contains('card');
      return { el: el, d: parseFloat(el.getAttribute('data-depth')) || 1, sh: sh, base: isCard ? [8, 18] : [10, 16], scale: isCard ? '' : ' scale(1.05)',
        repel: el.hasAttribute('data-repel'), x: 0, y: 0, r: 0, vx: 0, vy: 0, vr: 0, sx: 0, sy: 0, cx: 0, cy: 0 };
    });
    var px = 0, py = 0, mx = -9999, my = -9999, hasPointer = false, active = false, raf = null, last = 0;
    function measure() {
      var sy = window.scrollY;
      items.forEach(function (it) { var r = it.el.getBoundingClientRect(); it.cx = r.left + r.width / 2; it.cy = r.top + sy + r.height / 2; });
    }
    // Positionen erst bei der ersten Mausbewegung messen – kein erzwungenes Layout beim Start
    var measured = false;
    window.addEventListener('resize', function () { measured = false; });
    var kick = function () { if (active && !raf) { last = 0; raf = requestAnimationFrame(frame); } };
    if (finePointer) {
      table.addEventListener('pointermove', function (e) {
        var r = table.getBoundingClientRect();
        px = clamp((e.clientX - r.left) / r.width * 2 - 1, -1, 1);
        py = clamp((e.clientY - r.top) / r.height * 2 - 1, -1, 1);
        if (!measured) { measure(); measured = true; }
        mx = e.clientX; my = e.clientY + window.scrollY; hasPointer = true;
        kick();
      }, { passive: true });
      table.addEventListener('pointerleave', function () { px = 0; py = 0; mx = my = -9999; kick(); });
    }
    window.addEventListener('scroll', kick, { passive: true });

    // Feder je Objekt (halbimplizites Euler): Teller schwer, Kräuter leicht
    var K = 120, D = 15;
    function frame(now) {
      raf = null;
      if (!active) return;
      var dt = last ? Math.min(0.034, (now - last) / 1000) : 0.016; last = now;
      var sy = Math.min(window.scrollY, window.innerHeight * 1.2);
      var moving = false;
      items.forEach(function (it) {
        var tx = px * 12 * it.d, ty = py * 9 * it.d - sy * 0.1 * (it.d - 0.3), tr = 0;
        if (it.repel && hasPointer) {
          var dx = it.cx - mx, dy = it.cy - my, dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < 260) { var f = Math.pow(1 - dist / 260, 2) * 34; tx += dx / dist * f; ty += dy / dist * f; tr = (dx > 0 ? 1 : -1) * f * 0.35; }
        }
        it.vx += (K * (tx - it.x) - D * it.vx) * dt; it.x += it.vx * dt;
        it.vy += (K * (ty - it.y) - D * it.vy) * dt; it.y += it.vy * dt;
        it.vr += (K * (tr - it.r) - D * it.vr) * dt; it.r += it.vr * dt;
        if (Math.abs(tx - it.x) > 0.05 || Math.abs(ty - it.y) > 0.05 || Math.abs(it.vx) + Math.abs(it.vy) > 0.05 || Math.abs(tr - it.r) > 0.05) moving = true;
        it.el.style.transform = 'translate3d(' + it.x.toFixed(2) + 'px,' + it.y.toFixed(2) + 'px,0) rotate(' + it.r.toFixed(2) + 'deg)';
        if (it.sh) {
          // Licht kommt vom Zeiger: Schatten fällt weg davon – je höher das Objekt, desto weiter
          var sx = it.base[0] - px * 16 * it.d, syy = it.base[1] - py * 14 * it.d;
          it.sh.style.transform = 'translate(' + sx.toFixed(1) + 'px,' + syy.toFixed(1) + 'px)' + it.scale;
        }
      });
      if (moving) raf = requestAnimationFrame(frame);
    }
    visibilityGate(table, function (on) { active = on; table.classList.toggle('is-live', on); kick(); }, '0px');
  }

  /** Magnetische Buttons (nur feiner Zeiger) – nutzt `translate`, damit :active (transform) unberührt bleibt */
  function initMagnet() {
    if (!finePointer || reduced()) return;
    qsa('[data-magnet]').forEach(function (el) {
      var x = 0, y = 0, vx = 0, vy = 0, tx = 0, ty = 0, raf = null, last = 0;
      function frame(now) {
        var dt = last ? Math.min(0.034, (now - last) / 1000) : 0.016; last = now;
        vx += (170 * (tx - x) - 16 * vx) * dt; x += vx * dt;
        vy += (170 * (ty - y) - 16 * vy) * dt; y += vy * dt;
        el.style.translate = x.toFixed(2) + 'px ' + y.toFixed(2) + 'px';
        if (Math.abs(tx - x) + Math.abs(ty - y) + Math.abs(vx) + Math.abs(vy) > 0.05) raf = requestAnimationFrame(frame); else { raf = null; last = 0; }
      }
      var go = function () { if (!raf) raf = requestAnimationFrame(frame); };
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        tx = (e.clientX - (r.left + r.width / 2)) * 0.22; ty = (e.clientY - (r.top + r.height / 2)) * 0.3; go();
      });
      el.addEventListener('pointerleave', function () { tx = 0; ty = 0; go(); });
    });
  }

  /* ------------------------------------------------------------------
     7 · Scroll-Reveals (IntersectionObserver)
     ------------------------------------------------------------------ */
  function initReveals() {
    var els = qsa('[data-reveal]');
    // Überschriften: Tusche zieht von links – Clip auf einem inneren Span, damit der IntersectionObserver die Fläche sieht
    if (doc.classList.contains('anim')) qsa('.h2[data-reveal]').forEach(function (h) { var sp = document.createElement('span'); sp.className = 'h2-in'; while (h.firstChild) sp.appendChild(h.firstChild); h.appendChild(sp); });
    if (!doc.classList.contains('anim') || !('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add('is-in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      var batch = entries.filter(function (e) { return e.isIntersecting; }).sort(function (a, b) { return a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left; });
      batch.forEach(function (en, i) {
        var el = en.target;
        if (!el.style.getPropertyValue('--d')) el.style.setProperty('--d', Math.min(i * 60, 360) + 'ms');
        el.classList.add('is-in');
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });

    var map = qs('[data-map]');
    if (map) new IntersectionObserver(function (en, o) { if (en[0].isIntersecting) { map.classList.add('is-in'); o.disconnect(); } }, { threshold: 0.3 }).observe(map);

    var num = qs('[data-count-to]');
    if (num) {
      var target = parseFloat(num.getAttribute('data-count-to'));
      new IntersectionObserver(function (en, o) {
        if (!en[0].isIntersecting) return;
        o.disconnect();
        tween(1200, easeOut, function (p) { num.textContent = (3 + (target - 3) * p).toFixed(1).replace('.', ','); });
      }, { threshold: 0.6 }).observe(num);
    }
  }

  /* ------------------------------------------------------------------
     11 · Wein-Pairing: Radar + Glas, das sich füllt
     ------------------------------------------------------------------ */
  function initPairing() {
    var root = qs('[data-pairing]');
    if (!root) return;
    var shape = qs('[data-radar-shape]', root), dotsG = qs('[data-radar-dots]', root), title = qs('[data-radar-title]', root);
    var info = qs('.pair-info', root), live = qs('[data-pair-live]', root), bars = qs('[data-pair-bars]', root);
    var F = { name: qs('[data-pair-name]', root), origin: qs('[data-pair-origin]', root), why: qs('[data-pair-why]', root), price: qs('[data-pair-price]', root), temp: qs('[data-pair-temp]', root) };
    var glass = qs('[data-glass]', root), liquid = qs('[data-liquid]', root), tilt = qs('[data-tilt]', root), wine = qs('[data-wine]', root), stream = qs('[data-stream]', root), note = qs('[data-glass-note]', root);
    var CX = 180, CY = 170, R = 112, NS = 'http://www.w3.org/2000/svg';
    var cur = PAIRING.vitello.vals.slice(), token = null, swapTimer = null, key = 'vitello';

    function pt(i, v) { var a = -Math.PI / 2 + i * 2 * Math.PI / 6, r = R * (0.1 + 0.9 * v / 5); return [CX + r * Math.cos(a), CY + r * Math.sin(a)]; }
    var dots = AXES.map(function () { var c = document.createElementNS(NS, 'circle'); c.setAttribute('r', '4.5'); dotsG.appendChild(c); return c; });
    function draw(vals) {
      var pts = vals.map(function (v, i) { return pt(i, v); });
      shape.setAttribute('points', pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' '));
      pts.forEach(function (p, i) { dots[i].setAttribute('cx', p[0].toFixed(1)); dots[i].setAttribute('cy', p[1].toFixed(1)); });
    }
    var barItems = AXES.map(function (ax) {
      var li = document.createElement('li'), lab = document.createElement('span'), dd = document.createElement('span'), is = [];
      lab.textContent = ax; dd.className = 'dots';
      for (var i = 0; i < 5; i++) { var d = document.createElement('i'); dd.appendChild(d); is.push(d); }
      li.appendChild(lab); li.appendChild(dd); bars.appendChild(li);
      return is;
    });
    function setBars(vals) { vals.forEach(function (v, i) { barItems[i].forEach(function (d, j) { d.classList.toggle('on', j < v); }); }); }
    function setInfo(p) {
      F.name.textContent = p.wine; F.origin.textContent = p.origin; F.why.textContent = p.why;
      F.price.textContent = p.price + ' €'; F.temp.textContent = p.temp + ' °C';
      if (note) note.textContent = p.wine.split(' ')[0].replace('’', '’') + ', ' + p.temp + ' °C';
      var desc = AXES.map(function (a, i) { return a + ' ' + p.vals[i]; }).join(', ');
      if (title) title.textContent = 'Geschmacksprofil ' + p.wine + ': ' + desc + ' von 5';
      return 'Zu ' + p.dish + ' empfiehlt Giulia ' + p.wine + ' (' + p.origin.split(' · ')[1] + '). Profil: ' + desc + ' von 5.';
    }

    // --- Glas
    var level = GLASS_EMPTY, pourF = 0, ang = 0, angV = 0, angT = 0, sloshRaf = null, lastT = 0;
    function setWine(k) {
      var w = WINE[k];
      root.style.setProperty('--wine', w.c);
      if (glass) glass.classList.toggle('is-sparkling', !!w.sp);
    }
    function render(streamOn) {
      liquid.setAttribute('transform', 'translate(0 ' + level.toFixed(1) + ')');
      stream.setAttribute('height', streamOn ? Math.max(0, level + 40).toFixed(1) : '0');
    }
    function slosh(now) {
      var dt = lastT ? Math.min(0.034, (now - lastT) / 1000) : 0.016; lastT = now;
      angV += (90 * (angT - ang) - 7 * angV) * dt; ang += angV * dt; angT *= 0.9;
      wine.setAttribute('transform', 'translate(' + (ang * 4).toFixed(2) + ' 0)');
      tilt.setAttribute('transform', 'rotate(' + ang.toFixed(2) + ' 120 ' + (40).toFixed(0) + ')');
      if (Math.abs(ang) + Math.abs(angV) + Math.abs(angT) > 0.02) sloshRaf = requestAnimationFrame(slosh); else { sloshRaf = null; lastT = 0; }
    }
    function nudge(a) { angT = clamp(angT + a, -7, 7); if (!sloshRaf && !reduced()) sloshRaf = requestAnimationFrame(slosh); }
    setWine(key);

    var scrubbed = hasGSAP && !reduced();
    if (scrubbed) {
      level = GLASS_EMPTY; render(false);
      ScrollTrigger.create({
        trigger: root, start: 'top 82%', end: 'top 22%', scrub: 0.6,
        onUpdate: function (self) {
          pourF = self.progress;
          level = lerp(GLASS_EMPTY, WINE[key].lvl, easeOut(pourF));
          render(pourF > 0.02 && pourF < 0.97);
          nudge(clamp(self.getVelocity() * 0.0012, -2.5, 2.5));
        }
      });
    } else { pourF = 1; level = WINE[key].lvl; render(false); }

    draw(cur); setBars(cur);
    qsa('input[name="gericht"]', root).forEach(function (r) {
      r.addEventListener('change', function () {
        if (!r.checked) return;
        var p = PAIRING[r.value];
        if (!p) return;
        key = r.value;
        if (token) token.cancelled = true;
        var tok = token = { cancelled: false };
        var from = cur.slice(), to = p.vals.slice();
        if (reduced()) { cur = to; draw(cur); setBars(cur); setWine(key); level = WINE[key].lvl; render(false); live.textContent = setInfo(p); return; }
        tween(700, easeInOut, function (t) { cur = from.map(function (v, i) { return lerp(v, to[i], t); }); draw(cur); }, function () { cur = to; }, tok);
        setBars(to);
        clearTimeout(swapTimer);
        info.classList.add('is-swapping');
        swapTimer = setTimeout(function () { live.textContent = setInfo(p); info.classList.remove('is-swapping'); }, 220);
        // Glas: austrinken (kurz), neue Farbe, neu einschenken – mit Strahl
        pourF = 1;
        var l0 = level, target = WINE[key].lvl;
        nudge(5);
        tween(340, easeInOut, function (t) { level = lerp(l0, 214, t); render(false); }, function () {
          setWine(key);
          tween(760, easeOut, function (t) { level = lerp(214, target, t); render(t < 0.92); }, function () { render(false); nudge(-3); }, tok);
        }, tok);
      });
    });
  }

  /* ------------------------------------------------------------------
     12 · Set Piece: Teig wird ausgerollt (sticky + Scrub, kein Pin)
     ------------------------------------------------------------------ */
  function initDough() {
    var sec = qs('[data-dough]');
    if (!sec || !hasGSAP || reduced()) return;
    var surf = qs('.kb-surface', sec), mound = qs('.kb-mound', sec), ball = qs('.kb-ball', sec), sheet = qs('[data-sheet]', sec);
    var strips = qsa('span', sheet), cuts = qsa('[data-cuts] path', sec), pin = qs('.kb-pin', sec), grain = qs('[data-grain]', sec);
    var wheel = qs('.kb-wheel', sec), label = qs('.kb-label', sec), steps = qsa('.recipe-step', sec);
    sec.classList.add('is-scrub');
    var G = {};
    function geo() {
      var W = surf.offsetWidth, H = surf.offsetHeight, pw = pin.getBoundingClientRect().width || H * 1.06 * 96 / 520, ww = wheel.offsetWidth || W * 0.07;
      G = { W: W, H: H, pw: pw, ww: ww, sl: sheet.offsetLeft, sr: sheet.offsetLeft + sheet.offsetWidth, st: sheet.offsetTop, sb: sheet.offsetTop + sheet.offsetHeight };
    }
    geo();
    var pinX = function (f) { return G.sl + (G.sr - G.sl) * f - G.pw / 2; };
    var tl = gsap.timeline({ defaults: { ease: 'none' },
      scrollTrigger: { trigger: sec, start: 'top top', end: 'bottom bottom', scrub: 0.6, invalidateOnRefresh: true, onRefreshInit: geo,
        onUpdate: function (self) {
          var p = self.progress, s = p < 0.1 ? 0 : p < 0.27 ? 1 : p < 0.68 ? 2 : 3;
          steps.forEach(function (el, i) { el.classList.toggle('is-on', i === s); el.classList.toggle('is-done', i < s); });
          var x = gsap.getProperty(pin, 'x') || 0;
          grain.setAttribute('transform', 'translate(' + (-((x * 0.5) % 60 + 60) % 60).toFixed(1) + ' 0)');
        } } });
    tl.set(mound, { opacity: 1, scale: 1, transformOrigin: '50% 50%' }, 0)
      .set(ball, { opacity: 0, scale: 0.6, x: 0, rotation: 0 }, 0)
      .set(sheet, { clipPath: 'inset(0% 100% 0% 0% round 40px)' }, 0)
      .set(strips, { scaleX: 1 }, 0)
      .set(cuts, { strokeDasharray: 1, strokeDashoffset: 1 }, 0)
      .set(pin, { x: function () { return -G.pw * 1.4; }, y: 0, opacity: 1 }, 0)
      .set(wheel, { opacity: 0, x: 0, y: 0 }, 0)
      .set(label, { opacity: 0, y: 10 }, 0);
    // 1 · Mehl und Eier → Teigkugel
    tl.to(mound, { opacity: 0, scale: 0.72, duration: 0.08 }, 0.02)
      .to(ball, { opacity: 1, scale: 1, duration: 0.08 }, 0.03);
    // 2 · Kneten (gedrückt, gedreht, gedrückt)
    tl.to(ball, { scaleX: 1.22, scaleY: 0.84, rotation: 40, duration: 0.04 }, 0.11)
      .to(ball, { scaleX: 0.9, scaleY: 1.1, rotation: 80, duration: 0.04 }, 0.15)
      .to(ball, { scaleX: 1.16, scaleY: 0.88, rotation: 130, duration: 0.04 }, 0.19)
      .to(ball, { scaleX: 1, scaleY: 1, rotation: 160, duration: 0.03 }, 0.23);
    // 3 · Ausrollen: Nudelholz fährt über das Brett, die Platte wächst mit
    tl.to(pin, { x: function () { return pinX(0); }, duration: 0.05, ease: 'power2.out' }, 0.25)
      .to(pin, { x: function () { return pinX(1); }, duration: 0.36 }, 0.3)
      .to(sheet, { clipPath: 'inset(0% 0% 0% 0% round 40px)', duration: 0.36 }, 0.3)
      .to(ball, { x: function () { return G.W * 0.18; }, scaleX: 0.25, scaleY: 1.3, opacity: 0, duration: 0.14 }, 0.3)
      .to(pin, { y: function () { return -G.H * 1.25; }, duration: 0.06, ease: 'power1.in' }, 0.67);
    // 4 · Schneiden mit dem Teigrad
    tl.to(wheel, { opacity: 1, duration: 0.01 }, 0.7);
    cuts.forEach(function (c, i) {
      var t0 = 0.7 + i * 0.03;
      var cx = function () { return G.sl + (G.sr - G.sl) * (i + 1) / 9 - G.ww / 2; };
      tl.set(wheel, { x: cx, y: function () { return G.st - G.ww * 0.45; } }, t0)
        .to(wheel, { y: function () { return G.sb - G.ww * 0.45; }, duration: 0.028 }, t0)
        .to(c, { strokeDashoffset: 0, duration: 0.028 }, t0);
    });
    tl.to(wheel, { opacity: 0, duration: 0.02 }, 0.95)
      .to(strips, { scaleX: 0.84, duration: 0.03, stagger: 0.002 }, 0.95)
      .to(label, { opacity: 1, y: 0, duration: 0.03 }, 0.97);
  }

  /* ------------------------------------------------------------------
     13 · Set Piece: Fotoalbum blättert beim Scrollen (sticky, kein Pin)
     ------------------------------------------------------------------ */
  function initAlbum() {
    var sec = qs('[data-family]');
    if (!sec) return;
    var leaves = qsa('.leaf', sec);
    function verticalReveal() {
      if (!doc.classList.contains('anim') || !('IntersectionObserver' in window)) { leaves.forEach(function (it) { it.classList.add('is-in'); }); return; }
      var io = new IntersectionObserver(function (en) { en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }); }, { threshold: 0.2 });
      leaves.forEach(function (it) { io.observe(it); });
    }
    if (!hasGSAP || reduced()) { verticalReveal(); return; }
    sec.classList.add('is-book');
    var N = leaves.length, FL = N - 1;
    var pols = leaves.map(function (l) { return qs('.pol', l); });
    var years = qsa('[data-years] li', sec), marker = qs('[data-marker]', sec), strip = qs('[data-years] ol', sec);
    var lastKey = '';
    function polIn(i, q) {
      var el = pols[i]; if (!el) return;
      q = clamp(q, 0, 1);
      var e = 1 - Math.pow(1 - q, 3);
      el.style.transform = q >= 1 ? '' : 'translate(' + ((1 - e) * 70).toFixed(1) + 'px,' + ((1 - e) * -50).toFixed(1) + 'px) rotate(' + ((1 - e) * 14).toFixed(2) + 'deg)';
      el.style.opacity = q >= 1 ? '' : Math.min(1, q * 1.6).toFixed(3);
    }
    function render(p, enter) {
      var f = clamp(p * FL, 0, FL);
      var key = f.toFixed(3) + '|' + enter.toFixed(3);
      if (key === lastKey) return; lastKey = key;
      var base = Math.floor(f);
      leaves.forEach(function (leaf, i) {
        // Nur die sichtbaren Blätter rendern: oberstes links, aktuelles, darunterliegendes
        leaf.classList.toggle('is-off', i < base - 1 || i > base + 1);
        if (i >= FL) { leaf.style.zIndex = 1; return; }
        var local = clamp(f - i, 0, 1), e = easeInOut(local);
        leaf.style.transform = 'rotateY(' + (-180 * e).toFixed(2) + 'deg)';
        leaf.style.setProperty('--shade', (Math.sin(Math.PI * e) * 0.9).toFixed(3));
        leaf.style.zIndex = local > 0 && local < 1 ? 60 : (local >= 1 ? 10 + i : 40 - i);
        polIn(i + 1, (local - 0.3) / 0.6);
      });
      polIn(0, enter);
      var idx = Math.round(f);
      years.forEach(function (y, i) { y.classList.toggle('is-on', i === idx); });
      if (marker && strip) {
        var w = strip.offsetWidth - marker.offsetWidth;
        marker.style.transform = 'translateX(' + (w * f / FL).toFixed(1) + 'px)';
      }
    }
    var enterP = 0, mainP = 0;
    ScrollTrigger.create({ trigger: sec, start: 'top 75%', end: 'top top', scrub: 0.5, onUpdate: function (s) { enterP = s.progress; render(mainP, enterP); } });
    ScrollTrigger.create({ trigger: sec, start: 'top top', end: 'bottom bottom', scrub: 0.6, onUpdate: function (s) { mainP = s.progress; render(mainP, enterP); }, onRefresh: function (s) { mainP = s.progress; lastKey = ''; render(mainP, enterP); } });
    render(0, 0);
  }


  /** Karte: auf schmalen Bildschirmen auf die Innenstadt zoomen (größere Beschriftung) */
  function initMap() {
    var mapSvg = qs('[data-map-svg]');
    if (!mapSvg) return;
    var mqMap = window.matchMedia('(max-width: 640px)');
    var setVB = function () { mapSvg.setAttribute('viewBox', mqMap.matches ? '130 84 430 396' : '0 0 600 520'); };
    setVB();
    if (mqMap.addEventListener) mqMap.addEventListener('change', setVB);
  }

  /* ------------------------------------------------------------------
     8 · Angebot: Foto folgt dem Mauszeiger (Desktop)
     ------------------------------------------------------------------ */
  function initOffer() {
    var list = qs('[data-offer]'), float = qs('[data-offer-float]');
    if (!list || !float || !finePointer || reduced()) return;
    var inner = qs('.offer-float-inner', float);
    var imgs = {};
    qsa('.offer-row', list).forEach(function (row) {
      var key = row.getAttribute('data-img'), src = qs('.offer-thumb', row);
      if (!src) return;
      var im = document.createElement('img');
      im.src = src.getAttribute('src'); im.alt = ''; im.decoding = 'async';
      inner.appendChild(im); imgs[key] = im;
      row.addEventListener('pointerenter', function () {
        Object.keys(imgs).forEach(function (k) { imgs[k].classList.toggle('is-active', k === key); });
        float.classList.add('is-on'); start();
      });
    });
    list.addEventListener('pointerleave', function () { float.classList.remove('is-on'); });
    var tx = 0, ty = 0, x = 0, y = 0, raf = null, first = true;
    window.addEventListener('pointermove', function (e) {
      tx = e.clientX + 28; ty = e.clientY - float.offsetHeight / 2;
      if (first) { x = tx; y = ty; first = false; }
    }, { passive: true });
    function start() { if (!raf) raf = requestAnimationFrame(loop); }
    function loop() {
      x = lerp(x, tx, 0.14); y = lerp(y, ty, 0.14);
      var maxX = window.innerWidth - float.offsetWidth - 16;
      var rot = clamp((tx - x) * 0.04, -6, 6);
      float.style.transform = 'translate3d(' + Math.min(x, maxX).toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) rotate(' + rot.toFixed(2) + 'deg)';
      if (float.classList.contains('is-on') || Math.abs(tx - x) > 0.5) raf = requestAnimationFrame(loop); else raf = null;
    }
  }

  /* ------------------------------------------------------------------
     9 · Tafel: Pasta des Tages wird mit Kreide geschrieben
     ------------------------------------------------------------------ */
  function initBoard() {
    var svg = qs('[data-board-svg]');
    if (!svg) return;
    var content = qs('[data-board-content]', svg);
    var T = {}; qsa('[data-b]', svg).forEach(function (t) { T[t.getAttribute('data-b')] = t; });
    var underline = qs('.b-underline', svg), circle = qs('.b-circle', svg);
    var doodles = qsa('.b-doodle .b-draw', svg);
    var live = qs('[data-board-live]'), titleEl = qs('[data-board-title]');
    var canvas = qs('[data-board-dust]'), ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;
    var defs = qs('defs', svg);
    var token = null, written = false, visible = false, current = null;
    var motion = !reduced();
    var NS = 'http://www.w3.org/2000/svg';
    var lineOrder = ['kicker', 'date', 'l1', 'l2', 'desc', 'price', 'wine'];
    var SPEED = { kicker: 36, date: 34, l1: 54, l2: 48, desc: 23, price: 60, wine: 20 }; // ms je Zeichen
    var MAXW = { kicker: 520, date: 520, l1: 540, l2: 540, desc: 548, price: 300, wine: 548 };
    var BASE = {};
    lineOrder.forEach(function (k) { BASE[k] = parseFloat(getComputedStyle(T[k]).fontSize) || 30; });

    // Tag-Auswahl
    var n = berlinNow();
    var todayDow = n.dow;
    var radios = qsa('input[name="tafel-tag"]');
    var startDow = todayDow === 1 ? 2 : todayDow;
    radios.forEach(function (r) {
      var dw = +r.value;
      if (dw === todayDow) r.closest('.day').setAttribute('data-today', '');
      r.checked = dw === startDow;
      r.addEventListener('change', function () { if (r.checked) show(dw, true); });
    });

    function dateFor(dw) {
      var base = mkDate(n.y, n.m, n.d), diff = (dw - todayDow + 7) % 7;
      return addDays(base, diff);
    }

    function fill(dw) {
      var t = TAFEL[dw];
      var dt = dateFor(dw);
      T.kicker.textContent = dw === todayDow ? 'Pasta del giorno' : (dw === (todayDow + 1) % 7 ? 'Pasta di domani' : 'Pasta del giorno');
      T.date.textContent = fmtDate(dt);
      T.l1.textContent = t.l1; T.l2.textContent = t.l2; T.desc.textContent = t.desc;
      T.price.textContent = t.preis + ' €'; T.wine.textContent = 'dazu: ' + t.wein;
      lineOrder.forEach(function (k) {
        var el = T[k];
        el.style.fontSize = BASE[k] + 'px';
        var w = el.getComputedTextLength ? el.getComputedTextLength() : 0;
        if (w > MAXW[k]) el.style.fontSize = (BASE[k] * MAXW[k] / w).toFixed(1) + 'px';
      });
      var spoken = 'Pasta des Tages am ' + fmtDate(dt) + ': ' + t.l1 + ' ' + t.l2 + ' – ' + t.desc.replace(/ · /g, ', ') + ', ' + t.preis + ' Euro. Dazu passt ' + t.wein.split(' · ')[0] + '.';
      if (titleEl) titleEl.textContent = 'Tafel: ' + spoken;
      return spoken;
    }

    // Schreib-Zustand vorbereiten: Clip-Rechtecke je Zeile
    var clips = {};
    lineOrder.forEach(function (k, i) {
      var cp = document.createElementNS(NS, 'clipPath');
      cp.setAttribute('id', 'bclip-' + i); cp.setAttribute('clipPathUnits', 'userSpaceOnUse');
      var r = document.createElementNS(NS, 'rect');
      cp.appendChild(r); defs.appendChild(cp);
      clips[k] = r;
    });

    function hideAll() {
      lineOrder.forEach(function (k, i) {
        var el = T[k];
        el.setAttribute('clip-path', 'url(#bclip-' + i + ')');
        clips[k].setAttribute('width', '0');
        el.style.strokeDasharray = '180 180';
        el.style.strokeDashoffset = '180';
        el.style.fillOpacity = '0';
      });
      [underline, circle].concat(doodles).forEach(function (p) { p.style.strokeDasharray = '1 1'; p.style.strokeDashoffset = '1'; });
    }
    function showAllStatic() {
      lineOrder.forEach(function (k) {
        var el = T[k];
        el.removeAttribute('clip-path');
        el.style.strokeDasharray = ''; el.style.strokeDashoffset = ''; el.style.fillOpacity = '';
      });
      [underline, circle].concat(doodles).forEach(function (p) { p.style.strokeDasharray = ''; p.style.strokeDashoffset = ''; });
    }

    // Kreidestaub
    var parts = [], dustRaf = null, scale = 1;
    function sizeCanvas() {
      if (!canvas) return;
      var r = canvas.getBoundingClientRect(), dpr = dprMax();
      canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
      scale = (r.width / 600) * dpr;
    }
    function emit(x, y, count) {
      if (!ctx || !visible) return;
      for (var i = 0; i < count; i++) parts.push({ x: x + (Math.random() - 0.5) * 6, y: y + (Math.random() - 0.5) * 10, vx: (Math.random() - 0.3) * 18, vy: Math.random() * 10 + 6, life: 1, s: Math.random() * 1.6 + 0.6 });
      if (!dustRaf) dustRaf = requestAnimationFrame(dust);
    }
    var lastT = 0;
    function dust(now) {
      dustRaf = null;
      var dt = Math.min(0.05, lastT ? (now - lastT) / 1000 : 0.016); lastT = now;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (var i = parts.length - 1; i >= 0; i--) {
        var p = parts[i];
        p.vy += 60 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt * 1.4;
        if (p.life <= 0) { parts.splice(i, 1); continue; }
        ctx.fillStyle = 'rgba(244,239,228,' + (p.life * 0.65).toFixed(3) + ')';
        ctx.fillRect(p.x * scale, p.y * scale, p.s * scale, p.s * scale);
      }
      if (parts.length && visible) dustRaf = requestAnimationFrame(dust); else { lastT = 0; ctx.clearRect(0, 0, canvas.width, canvas.height); parts.length = 0; }
    }

    function drawPath(p, dur, tok, done) {
      tween(dur, easeInOut, function (v) { p.style.strokeDashoffset = (1 - v).toFixed(4); }, done, tok);
    }
    function writeLine(k, tok, done) {
      var el = T[k], bb = el.getBBox(), r = clips[k];
      var chars = (el.textContent || '').length;
      var dur = clamp(chars * SPEED[k], 340, 1050);
      r.setAttribute('x', (bb.x - 10).toFixed(1)); r.setAttribute('y', (bb.y - 14).toFixed(1));
      r.setAttribute('height', (bb.height + 28).toFixed(1));
      var full = bb.width + 20, emitEvery = 0;
      tween(dur, easeWrite, function (p) {
        var w = full * p;
        r.setAttribute('width', w.toFixed(1));
        el.style.strokeDashoffset = (180 * (1 - Math.min(1, p * 1.15))).toFixed(1);
        el.style.fillOpacity = clamp((p - 0.35) / 0.65, 0, 1).toFixed(3);
        if (++emitEvery % 2 === 0 && p < 0.98) emit(bb.x - 10 + w, bb.y + bb.height * (0.35 + Math.random() * 0.5), 2);
      }, function () {
        el.style.fillOpacity = '1';
        el.style.strokeDasharray = ''; el.style.strokeDashoffset = '';
        el.removeAttribute('clip-path');
        done();
      }, tok);
    }

    function write(tok) {
      var steps = lineOrder.slice();
      var i = 0;
      function next() {
        if (tok.cancelled) return;
        if (i >= steps.length) {
          doodles.forEach(function (p, j) { wait(j * 160, tok, function () { drawPath(p, 650, tok); }); });
          written = true;
          return;
        }
        var k = steps[i++];
        writeLine(k, tok, function () {
          if (k === 'kicker') drawPath(underline, 520, tok);
          if (k === 'price') drawPath(circle, 720, tok);
          wait(k === 'l2' || k === 'desc' ? 160 : 90, tok, next);
        });
      }
      next();
    }

    function show(dw, user) {
      if (token) token.cancelled = true;
      var tok = token = { cancelled: false };
      var go = function () {
        if (tok.cancelled) return;
        var spoken = fill(dw);
        if (live && user) live.textContent = spoken;
        current = dw;
        if (!motion) { showAllStatic(); content.style.opacity = '1'; return; }
        hideAll();
        content.style.transition = 'none'; content.style.opacity = '1'; content.style.transform = 'none';
        write(tok);
      };
      if (user && current !== null) {
        if (!motion) {
          content.style.transition = 'opacity .2s ease'; content.style.opacity = '0';
          wait(200, tok, go);
        } else {
          // Schwamm: kurz verwischen, dann neu schreiben
          content.style.transition = 'opacity .26s ease, transform .3s cubic-bezier(0.23, 1, 0.32, 1)';
          content.style.opacity = '0'; content.style.transform = 'translateX(-18px) skewX(-6deg)';
          wait(280, tok, go);
        }
      } else go();
    }

    sizeCanvas();
    window.addEventListener('resize', sizeCanvas);
    visibilityGate(svg, function (on) { visible = on; }, '0px');

    var ready = function () {
      if (!motion) { show(startDow, false); return; }
      fill(startDow); current = startDow; hideAll();
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (en, o) {
          if (!en[0].isIntersecting) return;
          o.disconnect();
          wait(250, null, function () { if (current === startDow && !written) { var tok = token = { cancelled: false }; write(tok); } });
        }, { threshold: 0.45 }).observe(svg);
      } else show(startDow, false);
    };
    if (document.fonts && document.fonts.load) {
      Promise.all([document.fonts.load('700 40px Caveat'), document.fonts.load('500 40px Caveat')]).then(ready, ready);
    } else ready();
  }
  /* ------------------------------------------------------------------
     10 · Speisekarte: Tabs (Pfeiltasten) + Ernährungs-/Allergenfilter
     ------------------------------------------------------------------ */
  function initMenu() {
    var root = qs('[data-menu]');
    if (!root) return;
    var tabs = qsa('[role="tab"]', root);
    var panels = qsa('[role="tabpanel"]', root);
    var ring = qs('[data-tab-ring]', root), list = qs('[data-tablist]', root);
    var current = 0;

    function placeClip() {
      if (!ring) return;
      var t = tabs[current];
      ring.style.width = (t.offsetWidth + 22) + 'px'; ring.style.height = (t.offsetHeight + 14) + 'px';
      ring.style.transform = 'translate(' + (t.offsetLeft - 11) + 'px,' + (t.offsetTop - 7) + 'px)';
    }
    function drawRing() {
      if (!ring || reduced()) return;
      ring.classList.remove('is-drawing'); ring.getBoundingClientRect(); ring.classList.add('is-drawing');
    }
    function select(i, focus) {
      current = i;
      tabs.forEach(function (t, j) {
        var on = j === i;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        panels[j].hidden = !on;
      });
      var p = panels[i];
      p.classList.remove('is-entering'); void p.offsetWidth; p.classList.add('is-entering');
      placeClip(); drawRing();
      if (focus) tabs[i].focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { if (i !== current) select(i, false); });
      t.addEventListener('keydown', function (e) {
        var k = e.key, n = tabs.length, to = null;
        if (k === 'ArrowRight' || k === 'ArrowDown') to = (current + 1) % n;
        else if (k === 'ArrowLeft' || k === 'ArrowUp') to = (current - 1 + n) % n;
        else if (k === 'Home') to = 0;
        else if (k === 'End') to = n - 1;
        if (to !== null) { e.preventDefault(); select(to, true); }
      });
    });
    select(0, false);
    requestAnimationFrame(function () { placeClip(); requestAnimationFrame(function () { if (ring) ring.classList.add('is-ready'); }); });
    if ('ResizeObserver' in window) new ResizeObserver(placeClip).observe(list);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeClip);

    // Filter
    var dishes = qsa('.dish', root);
    var total = dishes.length;
    var countEl = qs('[data-menu-count]', root), resetBtn = qs('[data-menu-reset]', root);
    var dietInputs = qsa('input[name="diet"]', root), ohneInputs = qsa('input[name="ohne"]', root);
    function apply() {
      var diet = (dietInputs.filter(function (r) { return r.checked; })[0] || {}).value || 'all';
      var ex = [];
      ohneInputs.forEach(function (c) { if (c.checked) ex = ex.concat(c.value.split(',')); });
      var shown = 0, newly = [];
      dishes.forEach(function (d) {
        var dd = d.getAttribute('data-diet') || '';
        var al = (d.getAttribute('data-allergens') || '').split(',').filter(Boolean);
        var ok = (diet === 'all' || (diet === 'veg' && (dd === 'veg' || dd === 'vegan')) || (diet === 'vegan' && dd === 'vegan')) &&
          !al.some(function (a) { return ex.indexOf(a) !== -1; });
        if (ok && d.hidden) newly.push(d);
        d.hidden = !ok;
        if (ok) shown++;
      });
      panels.forEach(function (p) {
        var key = p.getAttribute('data-panel');
        if (key === 'vini') return;
        var vis = qsa('.dish', p).filter(function (d) { return !d.hidden; }).length;
        var empty = qs('.panel-empty', p);
        if (empty) empty.hidden = vis > 0;
        qsa('[data-count="' + key + '"]', root).forEach(function (c) { c.textContent = vis; });
      });
      var active = diet !== 'all' || ex.length > 0;
      countEl.textContent = active ? shown + ' von ' + total + ' Gerichten passen' : 'Alle ' + total + ' Gerichte';
      resetBtn.hidden = !active;
      newly.filter(function (d) { return !d.closest('[role="tabpanel"]').hidden; }).forEach(function (d, i) {
        d.style.setProperty('--i', i);
        d.classList.remove('is-flash'); void d.offsetWidth; d.classList.add('is-flash');
      });
      placeClip();
    }
    dietInputs.concat(ohneInputs).forEach(function (inp) { inp.addEventListener('change', apply); });
    resetBtn.addEventListener('click', function () {
      dietInputs.forEach(function (r) { r.checked = r.value === 'all'; });
      ohneInputs.forEach(function (c) { c.checked = false; });
      apply();
      dietInputs[0].focus();
    });
    apply();
  }

  /* ------------------------------------------------------------------
     13 · Reservierung: Kalender, Uhrzeiten, Personen, Anlass, Bestätigung
     ------------------------------------------------------------------ */
  function initReservation() {
    var form = qs('[data-res]');
    if (!form) return;
    var shell = qs('[data-res-shell]'), done = qs('[data-res-done]');
    var calGrid = qs('[data-cal-grid]'), monthEl = qs('[data-cal-month]');
    var prevBtn = qs('[data-cal-prev]'), nextBtn = qs('[data-cal-next]');
    var slotsBox = qs('[data-slots]'), slotsHint = qs('[data-slots-hint]');
    var persons = qs('[data-persons]'), personsHint = qs('[data-persons-hint]');
    var candle = qs('[data-candle]');
    var S = { date: qs('[data-sum-date]'), time: qs('[data-sum-time]'), persons: qs('[data-sum-persons]'), occ: qs('[data-sum-occ]'), name: qs('[data-sum-name]') };

    var n = berlinNow();
    var today = mkDate(n.y, n.m, n.d), maxDate = addDays(today, RES.daysAhead);
    var state = { date: null, time: null, view: { y: n.y, m: n.m }, focus: null };

    function isOff(dt) {
      if (dt < today || dt > maxDate) return 'nicht buchbar';
      if (!HOURS[dt.getUTCDay()].length) return 'Ruhetag';
      return '';
    }
    function slotsFor(dt) { return dt.getUTCDay() === 0 ? RES.slots.sunday : RES.slots.weekday; }
    function busySet(dt) {
      var rnd = seeded(hashStr(isoDate(dt))), dw = dt.getUTCDay();
      var set = {}, s = slotsFor(dt);
      s.mittag.concat(s.abend).forEach(function (t) {
        var evening = toMin(t) >= 17 * 60;
        var share = (dw === 5 || dw === 6) && evening ? RES.busyShare.weekend : RES.busyShare.normal;
        if (rnd() < share) set[t] = true;
      });
      if (sameDay(dt, today)) s.mittag.concat(s.abend).forEach(function (t) { if (toMin(t) < n.min + RES.minLeadMinutes) set[t] = 'kurz'; });
      return set;
    }

    function bump(el) { el.classList.remove('is-bump'); void el.offsetWidth; el.classList.add('is-bump'); }
    function setSum(key, val, empty) {
      var el = S[key]; if (!el) return;
      if (el.textContent === val) return;
      el.textContent = val; el.classList.toggle('is-empty', !!empty);
      if (!empty) bump(el);
    }

    // --- Kalender
    function renderCal(focusDate) {
      var y = state.view.y, m = state.view.m;
      monthEl.textContent = MONTHS[m] + ' ' + y;
      calGrid.textContent = '';
      var first = mkDate(y, m, 1), lead = (first.getUTCDay() + 6) % 7;
      var daysIn = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
      for (var p = 0; p < lead; p++) { var pad = document.createElement('span'); pad.className = 'cal-day is-pad'; pad.setAttribute('aria-hidden', 'true'); calGrid.appendChild(pad); }
      var tabTarget = null, buttons = [];
      for (var d = 1; d <= daysIn; d++) {
        var dt = mkDate(y, m, d), off = isOff(dt);
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'cal-day'; b.textContent = d; b.tabIndex = -1;
        b.setAttribute('data-date', isoDate(dt));
        var label = fmtDate(dt, true) + (sameDay(dt, today) ? ', heute' : '') + (off ? ', ' + off : '');
        if (off) { b.setAttribute('aria-disabled', 'true'); if (off === 'Ruhetag' && dt >= today && dt <= maxDate) b.classList.add('is-rest'); }
        else {
          var bs = busySet(dt), cnt = Object.keys(bs).length, all = slotsFor(dt).mittag.length + slotsFor(dt).abend.length;
          if (cnt >= all * 0.5) { b.classList.add('is-busy'); label += ', fast ausgebucht'; }
        }
        if (sameDay(dt, today)) b.classList.add('is-today');
        b.setAttribute('aria-label', label);
        b.setAttribute('aria-pressed', state.date && sameDay(dt, state.date) ? 'true' : 'false');
        calGrid.appendChild(b); buttons.push(b);
        if (focusDate && sameDay(dt, focusDate)) tabTarget = b;
      }
      if (!tabTarget) {
        tabTarget = buttons.filter(function (b) { return b.getAttribute('aria-pressed') === 'true'; })[0] ||
          buttons.filter(function (b) { return !b.hasAttribute('aria-disabled'); })[0] || buttons[0];
      }
      tabTarget.tabIndex = 0;
      prevBtn.disabled = (y === n.y && m === n.m) || mkDate(y, m, 1) < mkDate(n.y, n.m, 1);
      nextBtn.disabled = mkDate(y, m + 1, 1) > maxDate;
      return tabTarget;
    }
    function selectDate(dt) {
      state.date = dt;
      qsa('.cal-day[data-date]', calGrid).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-date') === isoDate(dt) ? 'true' : 'false'); });
      setSum('date', fmtShort(dt));
      clearErr('date');
      renderSlots();
    }
    calGrid.addEventListener('click', function (e) {
      var b = e.target.closest('.cal-day[data-date]');
      if (!b || b.getAttribute('aria-disabled') === 'true') return;
      qsa('.cal-day[data-date]', calGrid).forEach(function (x) { x.tabIndex = -1; });
      b.tabIndex = 0;
      var p = b.getAttribute('data-date').split('-');
      selectDate(mkDate(+p[0], +p[1] - 1, +p[2]));
    });
    calGrid.addEventListener('keydown', function (e) {
      var b = e.target.closest('.cal-day[data-date]');
      if (!b) return;
      var p = b.getAttribute('data-date').split('-'), dt = mkDate(+p[0], +p[1] - 1, +p[2]), to = null;
      var dowMon = (dt.getUTCDay() + 6) % 7;
      switch (e.key) {
        case 'ArrowLeft': to = addDays(dt, -1); break;
        case 'ArrowRight': to = addDays(dt, 1); break;
        case 'ArrowUp': to = addDays(dt, -7); break;
        case 'ArrowDown': to = addDays(dt, 7); break;
        case 'Home': to = addDays(dt, -dowMon); break;
        case 'End': to = addDays(dt, 6 - dowMon); break;
        case 'PageUp': to = mkDate(dt.getUTCFullYear(), dt.getUTCMonth() - 1, Math.min(dt.getUTCDate(), 28)); break;
        case 'PageDown': to = mkDate(dt.getUTCFullYear(), dt.getUTCMonth() + 1, Math.min(dt.getUTCDate(), 28)); break;
        default: return;
      }
      e.preventDefault();
      if (to < mkDate(n.y, n.m, 1)) to = today;
      if (to > addDays(maxDate, 31)) return;
      if (to.getUTCMonth() !== state.view.m || to.getUTCFullYear() !== state.view.y) { state.view = { y: to.getUTCFullYear(), m: to.getUTCMonth() }; }
      var t = renderCal(to); t.focus();
    });
    prevBtn.addEventListener('click', function () { var d = new Date(Date.UTC(state.view.y, state.view.m - 1, 1)); state.view = { y: d.getUTCFullYear(), m: d.getUTCMonth() }; renderCal(); });
    nextBtn.addEventListener('click', function () { var d = new Date(Date.UTC(state.view.y, state.view.m + 1, 1)); state.view = { y: d.getUTCFullYear(), m: d.getUTCMonth() }; renderCal(); });

    // --- Uhrzeiten
    function renderSlots() {
      var dt = state.date;
      var s = dt ? slotsFor(dt) : RES.slots.weekday, busy = dt ? busySet(dt) : {};
      var free = 0;
      ['mittag', 'abend'].forEach(function (g) {
        var row = qs('[data-slot-row="' + g + '"]', slotsBox);
        row.textContent = '';
        s[g].forEach(function (t) {
          var lab = document.createElement('label'); lab.className = 'slot';
          var inp = document.createElement('input'); inp.type = 'radio'; inp.name = 'zeit'; inp.value = t;
          var sp = document.createElement('span'); sp.textContent = t;
          if (busy[t]) { inp.disabled = true; inp.setAttribute('aria-label', t + ' Uhr – ' + (busy[t] === 'kurz' ? 'zu kurzfristig' : 'ausgebucht')); }
          else { free++; inp.setAttribute('aria-label', t + ' Uhr'); }
          if (state.time === t && !busy[t]) inp.checked = true;
          lab.appendChild(inp); lab.appendChild(sp); row.appendChild(lab);
        });
      });
      if (state.time && dt && (busy[state.time] || s.mittag.concat(s.abend).indexOf(state.time) === -1)) { state.time = null; setSum('time', 'noch offen', true); }
      if (!dt) slotsHint.textContent = 'Wählen Sie zuerst einen Tag – dann sehen Sie, welche Zeiten frei sind.';
      else if (!free) slotsHint.textContent = 'Am ' + fmtShort(dt) + ' ist online alles vergeben. Rufen Sie gern an – oft wird kurzfristig ein Tisch frei.';
      else slotsHint.textContent = fmtDate(dt) + ': ' + free + (free === 1 ? ' Zeit' : ' Zeiten') + ' frei. Durchgestrichen = ausgebucht.';
    }
    slotsBox.addEventListener('change', function (e) {
      if (e.target.name !== 'zeit') return;
      state.time = e.target.value; setSum('time', state.time + ' Uhr'); clearErr('time');
    });

    // --- Personen
    var stepBtns = qsa('[data-step]', form);
    function setPersons(v) {
      v = clamp(Math.round(+v || RES.minPersons), RES.minPersons, RES.maxPersons);
      persons.value = v;
      stepBtns[0].disabled = v <= RES.minPersons; stepBtns[1].disabled = v >= RES.maxPersons;
      setSum('persons', v + (v === 1 ? ' Person' : ' Personen'));
      personsHint.textContent = v >= RES.groupFrom ? 'Ab ' + RES.groupFrom + ' Personen decken wir in La Cantina – wir rufen Sie zur Abstimmung kurz an.' :
        (v === 1 ? 'Allein? Der Platz an der Theke mit Blick in die Küche ist oft frei.' : '');
    }
    stepBtns.forEach(function (b) { b.addEventListener('click', function () { setPersons(+persons.value + (+b.getAttribute('data-step'))); }); });
    persons.addEventListener('change', function () { setPersons(persons.value); });

    // --- Anlass
    qsa('input[name="anlass"]', form).forEach(function (r) {
      r.addEventListener('change', function () {
        if (!r.checked) return;
        setSum('occ', r.value);
        if (candle) candle.hidden = r.value !== 'Geburtstag';
      });
    });
    var nameInput = qs('#res-name');
    nameInput.addEventListener('input', function () { var v = nameInput.value.trim(); S.name.textContent = v ? 'per ' + v : 'per Lei'; });

    // --- Validierung
    var errs = {};
    qsa('[data-err]', form).forEach(function (p) { errs[p.getAttribute('data-err')] = p; });
    var fieldFor = { name: nameInput, tel: qs('#res-tel'), mail: qs('#res-mail'), consent: qs('input[name="einwilligung"]') };
    function showErr(k) { if (errs[k]) errs[k].hidden = false; if (fieldFor[k]) fieldFor[k].setAttribute('aria-invalid', 'true'); }
    function clearErr(k) { if (errs[k]) errs[k].hidden = true; if (fieldFor[k]) fieldFor[k].removeAttribute('aria-invalid'); }
    ['name', 'tel', 'mail'].forEach(function (k) { fieldFor[k].addEventListener('input', function () { clearErr(k); }); });
    fieldFor.consent.addEventListener('change', function () { clearErr('consent'); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = [];
      if (!state.date) { showErr('date'); bad.push(qs('.cal-day[tabindex="0"]', calGrid)); }
      if (!state.time) { showErr('time'); bad.push(qs('input[name="zeit"]:not(:disabled)', slotsBox)); }
      if (nameInput.value.trim().length < 2) { showErr('name'); bad.push(nameInput); }
      var tel = fieldFor.tel.value.replace(/[^\d+]/g, '');
      if (tel.replace(/\D/g, '').length < 6) { showErr('tel'); bad.push(fieldFor.tel); }
      var mail = fieldFor.mail.value.trim();
      if (mail && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) { showErr('mail'); bad.push(fieldFor.mail); }
      if (!fieldFor.consent.checked) { showErr('consent'); bad.push(fieldFor.consent); }
      bad = bad.filter(Boolean);
      if (bad.length) {
        var t = bad[0];
        if (lenis) lenis.scrollTo(t.getBoundingClientRect().top + window.scrollY - headerOffset() - 90, { duration: 0.8 });
        else t.scrollIntoView({ block: 'center', behavior: reduced() ? 'auto' : 'smooth' });
        setTimeout(function () { t.focus({ preventScroll: true }); }, lenis ? 500 : 0);
        return;
      }
      showDone();
    });

    var lastBooking = null;
    function showDone() {
      var occ = (qs('input[name="anlass"]:checked', form) || {}).value || 'Einfach so';
      var wantsCandle = candle && !candle.hidden && qs('input', candle).checked;
      lastBooking = { date: state.date, time: state.time, persons: +persons.value, name: nameInput.value.trim() };
      qs('[data-done-name]').textContent = lastBooking.name;
      var dl = qs('[data-done-list]'); dl.textContent = '';
      var rows = [['Tag', fmtDate(state.date, true)], ['Uhrzeit', state.time + ' Uhr'], ['Personen', String(persons.value)], ['Anlass', occ + (wantsCandle ? ' · mit Kerze im Tiramisù' : '')], ['Telefon', fieldFor.tel.value.trim()]];
      if (fieldFor.mail.value.trim()) rows.push(['E-Mail', fieldFor.mail.value.trim()]);
      var note = qs('#res-note').value.trim();
      if (note) rows.push(['Hinweise', note]);
      rows.forEach(function (r) {
        var div = document.createElement('div'), dt = document.createElement('dt'), dd = document.createElement('dd');
        dt.textContent = r[0]; dd.textContent = r[1]; div.appendChild(dt); div.appendChild(dd); dl.appendChild(div);
      });
      shell.hidden = true; done.hidden = false;
      var sy = done.getBoundingClientRect().top + window.scrollY - headerOffset() - 24;
      if (lenis) lenis.scrollTo(sy, { duration: 0.9 }); else window.scrollTo({ top: sy, behavior: reduced() ? 'auto' : 'smooth' });
      done.focus({ preventScroll: true });
      if (hasGSAP) setTimeout(function () { ScrollTrigger.refresh(); }, 50);
    }
    qs('[data-res-again]').addEventListener('click', function () {
      form.reset(); state.date = null; state.time = null;
      setPersons(2); setSum('date', 'noch offen', true); setSum('time', 'noch offen', true); setSum('occ', 'Einfach so');
      S.name.textContent = 'per Lei'; if (candle) candle.hidden = true;
      state.view = { y: n.y, m: n.m }; renderCal(); renderSlots();
      done.hidden = true; shell.hidden = false;
      if (hasGSAP) setTimeout(function () { ScrollTrigger.refresh(); }, 50);
      var t = qs('.cal-day[tabindex="0"]', calGrid); if (t) t.focus();
    });
    qs('[data-ics]').addEventListener('click', function () {
      if (!lastBooking) return;
      var d = lastBooking.date, hm = lastBooking.time.split(':');
      var pad = function (x) { return String(x).padStart(2, '0'); };
      var start = d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + 'T' + pad(hm[0]) + pad(hm[1]) + '00';
      var endMin = toMin(lastBooking.time) + RES.durationMinutes;
      var end = d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + 'T' + pad(Math.floor(endMin / 60)) + pad(endMin % 60) + '00';
      var esc = function (s) { return String(s).replace(/[\\;,]/g, function (c) { return '\\' + c; }).replace(/\n/g, '\\n'); };
      var ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Trattoria Nonna Rosa//Demo//DE', 'BEGIN:VEVENT',
        'UID:' + Date.now() + '@nonna-rosa.demo', 'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z',
        'DTSTART;TZID=Europe/Berlin:' + start, 'DTEND;TZID=Europe/Berlin:' + end,
        'SUMMARY:' + esc('Tisch in der Trattoria Nonna Rosa (' + lastBooking.persons + ' P.)'),
        'LOCATION:' + esc('Hauptstätter Straße 57, 70178 Stuttgart'),
        'DESCRIPTION:' + esc('Demo-Reservierung – es wurde nichts gesendet. Tel. 0711 555 46 20'),
        'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
      var blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'reservierung-nonna-rosa.ics';
      document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    });

    renderCal(); renderSlots(); setPersons(persons.value);
  }
  /* ------------------------------------------------------------------
     16 · Start in Etappen
     ------------------------------------------------------------------ */
  /** Bibliotheken nacheinander laden – jede wird in einem eigenen Task ausgewertet (keine langen Tasks beim Start) */
  function loadVendors(done) {
    var list = VENDOR.slice();
    (function next() {
      var src = list.shift();
      if (!src) { hasGSAP = !!(window.gsap && window.ScrollTrigger); done(); return; }
      var s = document.createElement('script');
      s.src = src; s.async = false;
      s.onload = s.onerror = function () { setTimeout(next, 0); };
      document.head.appendChild(s);
    })();
  }

  function start() {
    window.__rosaReady = true;
    // Sofort: alles, was den ersten Bildschirm betrifft
    safe('header', initHeader);
    safe('status', initStatus);
    safe('hero', initHero);
    loadVendors(boot);
  }

  function boot() {
    safe('scroll', initScroll);
    // Danach je Modul ein eigener Task, damit der Main-Thread zwischendurch frei wird
    var queue = [['reveals', initReveals], ['magnet', initMagnet], ['map', initMap], ['offer', initOffer], ['dough', initDough], ['board', initBoard], ['menu', initMenu], ['pairing', initPairing], ['album', initAlbum], ['reservation', initReservation]];
    var yieldTask = function (fn) {
      if (window.scheduler && typeof window.scheduler.postTask === 'function') window.scheduler.postTask(fn, { priority: 'background' });
      else setTimeout(fn, 16);
    };
    (function next() {
      var job = queue.shift();
      if (!job) {
        if (hasGSAP) { ScrollTrigger.refresh(); if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); }); }
        return;
      }
      safe(job[0], job[1]);
      yieldTask(next);
    })();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
