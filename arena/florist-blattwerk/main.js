/* ==========================================================================
   Blattwerk Floristik · Modell „Blüte“ – Demo-Website (fiktiver Betrieb)
   Ohne Build-Schritt. Optional: GSAP + ScrollTrigger, Lenis (lokal unter assets/vendor).
   Alle Preise/Zonen/Zeiten stehen als dokumentierte Konstanten direkt hier oben.
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
     KONSTANTEN – hier Werte für einen echten Betrieb anpassen
     ------------------------------------------------------------------ */

  /** Strauß-Studio: Grundpreis je Größe (€) und Anzahl Blütenköpfe in der Vorschau */
  var SIZES = {
    klein:   { label: 'Klein',   adj: 'Kleiner',      base: 29, slots: 7,  i: 0 },
    mittel:  { label: 'Mittel',  adj: 'Mittelgroßer', base: 42, slots: 12, i: 1 },
    gross:   { label: 'Groß',    adj: 'Großer',       base: 58, slots: 18, i: 2 },
    opulent: { label: 'Opulent', adj: 'Opulenter',    base: 84, slots: 26, i: 3 }
  };
  /** Aufpreis je Blumensorte (€), gestaffelt nach Größe [klein, mittel, groß, opulent] */
  var FLOWERS = {
    rosen:         { label: 'Rosen',         premium: [5, 8, 12, 18], focal: true },
    ranunkeln:     { label: 'Ranunkeln',     premium: [6, 10, 14, 20], focal: true },
    tulpen:        { label: 'Tulpen',        premium: [3, 5, 7, 10],  focal: true },
    eukalyptus:    { label: 'Eukalyptus',    premium: [2, 4, 6, 8] },
    schleierkraut: { label: 'Schleierkraut', premium: [2, 3, 5, 7] }
  };
  /** Farbwelten der Vorschau */
  var PALETTES = {
    blush: { label: 'Blush & Creme', rosen: ['#F2C9C0', '#F7E1D7', '#E9AFA3'], ranunkeln: ['#F5D2C8', '#FBEDE4', '#EDB9AC'], tulpen: ['#F3C1BC', '#FBE7DF', '#EAA9A0'], gyps: '#FFFDF8', paper: '#F3DCD5', paper2: '#E8C6BC', ribbon: '#C27A6C' },
    mohn:  { label: 'Mohn & Koralle', rosen: ['#D9472B', '#E8735A', '#F0A07F'], ranunkeln: ['#E2583A', '#F28C6B', '#F6B190'], tulpen: ['#D9472B', '#EE7F52', '#F29A6B'], gyps: '#FFF8F0', paper: '#DCC6A6', paper2: '#C9AE88', ribbon: '#1F3A2E' },
    weiss: { label: 'Weiß & Salbei', rosen: ['#FFFDF8', '#F3F0E6', '#ECEEE0'], ranunkeln: ['#FFFFFF', '#EEF0E6', '#F6F2E8'], tulpen: ['#FBF8F2', '#EEF2E2', '#E3E8D4'], gyps: '#FFFFFF', paper: '#E3E9DF', paper2: '#CDD6C8', ribbon: '#1F3A2E' },
    wiese: { label: 'Wiese, bunt', rosen: ['#E58C8A', '#F2C14E', '#D9472B'], ranunkeln: ['#F2B632', '#E79AB4', '#F28C6B'], tulpen: ['#8A73C1', '#E5674F', '#F2C14E'], gyps: '#FFFDF5', paper: '#DCC6A6', paper2: '#C9AE88', ribbon: '#8A73C1' }
  };

  /** Blumen-Abo: Grundpreis pro Lieferung (€) und Rabatt/Lieferungen pro Monat je Rhythmus */
  var ABO = {
    tiers: { klein: { label: 'Tischstrauß', base: 32 }, mittel: { label: 'Wohnzimmer', base: 46 }, gross: { label: 'Empfang', base: 68 } },
    freq: {
      woche: { label: 'wöchentlich', discount: 0.15, perMonth: 4.33, days: 'Wöchentlich, dienstags oder freitags.' },
      zwei:  { label: 'alle 14 Tage', discount: 0.10, perMonth: 2.17, days: 'Alle 14 Tage, dienstags oder freitags.' },
      monat: { label: 'monatlich', discount: 0, perMonth: 1, days: 'Einmal im Monat, dienstags oder freitags.' }
    },
    weekdays: [2, 5],      // Liefertage: Dienstag, Freitag
    leadDays: 2            // frühestens in 2 Tagen
  };

  /** Lieferung: Bestellschluss (Uhr), Zonen mit Gebühr und Lieferfenster (Mo–Fr / Sa) */
  var CUTOFF_HOUR = 12;
  var ZONES = {
    stadt:  { label: 'Stadtgebiet', fee: 7.9,  wd: [14, 18], sa: [12, 15], how: 'mit dem Lastenrad' },
    umland: { label: 'Umland',      fee: 12.9, wd: [15, 19], sa: [12, 16], how: 'mit dem Transporter' }
  };
  var PLZ = {
    '69115': ['stadt', 'Bergheim / Weststadt'], '69117': ['stadt', 'die Altstadt'], '69118': ['stadt', 'Ziegelhausen / Schlierbach'],
    '69120': ['stadt', 'Neuenheim'], '69121': ['stadt', 'Handschuhsheim'], '69123': ['stadt', 'Wieblingen / Pfaffengrund'],
    '69124': ['stadt', 'Kirchheim'], '69126': ['stadt', 'Rohrbach, Südstadt, Boxberg und Emmertsgrund'],
    '69221': ['umland', 'Dossenheim'], '69198': ['umland', 'Schriesheim'], '69259': ['umland', 'Wilhelmsfeld'],
    '69151': ['umland', 'Neckargemünd'], '69245': ['umland', 'Bammental'], '69181': ['umland', 'Leimen'],
    '69226': ['umland', 'Nußloch'], '69207': ['umland', 'Sandhausen'], '69214': ['umland', 'Eppelheim'],
    '68535': ['umland', 'Edingen-Neckarhausen'], '68723': ['umland', 'Schwetzingen, Plankstadt und Oftersheim'],
    '69168': ['umland', 'Wiesloch'], '69190': ['umland', 'Walldorf'], '69257': ['umland', 'Wiesenbach'], '69239': ['umland', 'Neckarsteinach']
  };
  /** Öffnungszeiten in Minuten ab Mitternacht, Index = Wochentag (0 = Sonntag) */
  var HOURS = [null, [540, 1110], [540, 1110], [540, 1110], [540, 1110], [540, 1110], [480, 960]];

  /* ------------------------------------------------------------------
     Helfer
     ------------------------------------------------------------------ */
  var doc = document.documentElement;
  var qs = function (s, r) { return (r || document).querySelector(s); };
  var qsa = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var motionOff = doc.classList.contains('motion-off');
  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduced = function () { return motionOff || mqReduce.matches; };
  var anim = !reduced();
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasGSAP = !!(window.gsap && window.ScrollTrigger);
  var lenis = null;
  var NBSP = '\u00a0';
  var WD = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  var MON = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

  function safe(name, fn) {
    try { fn(); } catch (err) { if (window.console) console.warn('[Blattwerk] ' + name + ':', err); }
  }
  function eur(n, dec) {
    var d = dec === undefined ? 2 : dec;
    return n.toLocaleString('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d }) + NBSP + '€';
  }
  function eurShort(n) { return Math.round(n) === n ? eur(n, 0) : eur(n, 2); }
  function hm(mins) { var h = Math.floor(mins / 60), m = mins % 60; return h + ':' + (m < 10 ? '0' : '') + m; }
  function dateLong(d) { return WD[d.getDay()] + ', ' + d.getDate() + '.' + NBSP + MON[d.getMonth()]; }
  function sameDay(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
  function addDays(d, n) { var x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x; }
  function joinList(arr, last) {
    if (arr.length < 2) return arr.join('');
    return arr.slice(0, -1).join(', ') + ' ' + (last || 'und') + ' ' + arr[arr.length - 1];
  }
  function mk(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  /** Wanduhrzeit in Heidelberg (Europe/Berlin). Testbar mit ?jetzt=2026-10-13T10:30 */
  function berlinNow() {
    var q = /[?&]jetzt=([0-9T:\-]+)/.exec(location.search);
    if (q) { var t = new Date(q[1]); if (!isNaN(t)) return t; }
    var d = new Date();
    try {
      var p = {};
      new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h23' })
        .formatToParts(d).forEach(function (x) { p[x.type] = x.value; });
      return new Date(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second);
    } catch (e) { return d; }
  }
  function isoWeek(d) {
    var t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    var day = t.getUTCDay() || 7;
    t.setUTCDate(t.getUTCDate() + 4 - day);
    var y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    return Math.ceil(((t - y0) / 86400000 + 1) / 7);
  }
  function mix(a, b, t) {
    var pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    var r = Math.round(lerp(pa >> 16, pb >> 16, t)), g = Math.round(lerp((pa >> 8) & 255, (pb >> 8) & 255, t)), bl = Math.round(lerp(pa & 255, pb & 255, t));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1);
  }
  function lum(hex) {
    var v = parseInt(hex.slice(1), 16);
    return (0.2126 * (v >> 16) + 0.7152 * ((v >> 8) & 255) + 0.0722 * (v & 255)) / 255;
  }
  function seeded(seed) {
    var s = seed >>> 0 || 1;
    return function () { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
  }
  function hdrH() { var h = qs('[data-hdr]'); return h ? h.offsetHeight : 64; }

  /* ------------------------------------------------------------------
     Smooth Scroll (Lenis) + ScrollTrigger
     ------------------------------------------------------------------ */
  function initScroll() {
    if (hasGSAP) {
      window.gsap.registerPlugin(window.ScrollTrigger);
      window.ScrollTrigger.config({ ignoreMobileResize: true });
    }
    if (anim && window.Lenis) {
      lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true, anchors: false });
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

  function scrollToEl(target, focusAfter) {
    if (!target) return;
    var off = -(hdrH() + 8);
    if (lenis) {
      lenis.scrollTo(target, { offset: off, duration: 1.15, easing: function (t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); } });
    } else {
      var y = target.getBoundingClientRect().top + window.pageYOffset + off;
      window.scrollTo({ top: y, behavior: reduced() ? 'auto' : 'smooth' });
    }
    if (focusAfter) {
      setTimeout(function () {
        if (!focusAfter.hasAttribute('tabindex') && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(focusAfter.tagName)) focusAfter.setAttribute('tabindex', '-1');
        focusAfter.focus({ preventScroll: true });
      }, lenis ? 900 : 350);
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
      var y = window.pageYOffset || doc.scrollTop;
      hdr.classList.toggle('is-scrolled', y > 24);
      var max = doc.scrollHeight - window.innerHeight;
      if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? clamp(y / max, 0, 1) : 0).toFixed(4) + ')';
    };
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();

    var links = qsa('.nav a');
    if (!('IntersectionObserver' in window) || !links.length) return;
    var map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var a = map[e.target.id];
        if (!a) return;
        if (e.isIntersecting) {
          links.forEach(function (l) { l.removeAttribute('aria-current'); });
          a.setAttribute('aria-current', 'true');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
  }

  /* ------------------------------------------------------------------
     Mobiles Menü (Dialog mit Fokusfalle und Escape)
     ------------------------------------------------------------------ */
  function initMenu() {
    var btn = qs('[data-burger]'), menu = qs('[data-menu]');
    if (!btn || !menu) return;
    var txt = qs('.burger__txt', btn);
    var open = false;
    var focusables = function () { return [btn].concat(qsa('a, button', menu)); };
    function set(o, restore) {
      open = o;
      btn.setAttribute('aria-expanded', String(o));
      btn.setAttribute('aria-label', o ? 'Menü schließen' : 'Menü öffnen');
      if (txt) txt.textContent = o ? 'Schließen' : 'Menü';
      menu.hidden = !o;
      doc.classList.toggle('menu-open', o);
      if (lenis) { if (o) lenis.stop(); else lenis.start(); }
      if (o) { var first = qs('a', menu); if (first) first.focus(); }
      else if (restore) btn.focus();
    }
    btn.setAttribute('aria-label', 'Menü öffnen');
    btn.addEventListener('click', function () { set(!open, true); });
    document.addEventListener('keydown', function (e) {
      if (!open) return;
      if (e.key === 'Escape') { e.preventDefault(); set(false, true); return; }
      if (e.key === 'Tab') {
        var f = focusables(), i = f.indexOf(document.activeElement);
        if (e.shiftKey && (i <= 0)) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      }
    });
    qsa('a', menu).forEach(function (a) { a.addEventListener('click', function () { set(false, false); }); });
    window.matchMedia('(min-width: 1181px)').addEventListener('change', function (e) { if (e.matches && open) set(false, false); });
    window.__closeMenu = function () { if (open) set(false, false); };
  }

  /* ------------------------------------------------------------------
     Anker-Links (Lenis-kompatibel) + Anliegen vorwählen
     ------------------------------------------------------------------ */
  function initAnchors() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute('href').slice(1);
      if (!id) return;
      var target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      if (window.__closeMenu) window.__closeMenu();
      var anl = a.getAttribute('data-anliegen');
      var sel = qs('[data-f-anliegen]');
      if (anl && sel) sel.value = anl;
      var focusTarget = id === 'main' ? target : (id === 'kontakt' && anl ? qs('#f-name') : target);
      scrollToEl(target, focusTarget);
    });
  }

  /* ------------------------------------------------------------------
     Öffnungszeiten live
     ------------------------------------------------------------------ */
  function openInfo(now) {
    var dow = now.getDay(), mins = now.getHours() * 60 + now.getMinutes(), h = HOURS[dow];
    if (h && mins >= h[0] && mins < h[1]) return { open: true, text: 'Jetzt geöffnet · bis ' + hm(h[1]) + NBSP + 'Uhr', short: 'Geöffnet bis ' + hm(h[1]) };
    if (h && mins < h[0]) return { open: false, text: 'Geschlossen · öffnet heute um ' + hm(h[0]) + NBSP + 'Uhr', short: 'Öffnet ' + hm(h[0]) };
    for (var i = 1; i <= 7; i++) {
      var nd = (dow + i) % 7;
      if (HOURS[nd]) {
        var when = i === 1 ? 'morgen' : WD[nd];
        return { open: false, text: 'Geschlossen · öffnet ' + when + ' um ' + hm(HOURS[nd][0]) + NBSP + 'Uhr', short: 'Öffnet ' + when + ' ' + hm(HOURS[nd][0]) };
      }
    }
    return { open: false, text: '', short: '' };
  }
  function initOpenState() {
    var dot = qs('[data-open-dot]'), tel = qs('.hdr__tel');
    var st = qs('[data-open-status]'), stt = qs('[data-open-text]'), lng = qs('[data-open-long]');
    var sr = null;
    if (tel) { sr = mk('span', 'visually-hidden'); tel.appendChild(sr); }
    function tick() {
      var now = berlinNow(), o = openInfo(now);
      if (dot) dot.classList.toggle('is-open', o.open);
      if (sr) sr.textContent = ' (' + (o.open ? 'jetzt geöffnet' : 'derzeit geschlossen') + ')';
      if (tel) tel.title = o.text;
      if (st) st.classList.toggle('is-open', o.open);
      if (stt) stt.textContent = o.text;
      if (lng) lng.textContent = o.text;
      qsa('.hours tr').forEach(function (tr) { tr.classList.toggle('is-today', +tr.getAttribute('data-day') === now.getDay()); });
    }
    tick();
    setInterval(tick, 60000);
  }

  /* ------------------------------------------------------------------
     Lieferzeit-Logik (Bestellung bis 12 Uhr = heute)
     ------------------------------------------------------------------ */
  function nextDelivery(now) {
    var dow = now.getDay(), mins = now.getHours() * 60 + now.getMinutes();
    if (dow !== 0 && mins < CUTOFF_HOUR * 60) return { today: true, date: now, left: CUTOFF_HOUR * 60 - mins, mins: mins };
    var d = addDays(now, 1);
    while (d.getDay() === 0) d = addDays(d, 1);
    return { today: false, date: d, left: 0, mins: mins };
  }
  function dayWord(date, now) {
    if (sameDay(date, now)) return 'heute';
    if (sameDay(date, addDays(now, 1))) return 'morgen';
    return 'am ' + WD[date.getDay()];
  }
  function leftText(mins) {
    var h = Math.floor(mins / 60), m = mins % 60;
    if (h === 0) return m + NBSP + 'min';
    return h + NBSP + 'h ' + m + NBSP + 'min';
  }

  function initDelivery() {
    var clock = qs('[data-clock]'), cv = qs('[data-clock-v]'), cb = qs('[data-clock-bar]'), cs = qs('[data-clock-s]'), ck = qs('.clock__k', clock || document);
    var heroCut = qs('[data-cutoff-hero]');
    function tick() {
      var now = berlinNow(), nd = nextDelivery(now);
      if (clock) {
        clock.classList.toggle('is-late', !nd.today);
        if (nd.today) {
          ck.textContent = 'Bestellschluss heute, 12:00' + NBSP + 'Uhr';
          cv.textContent = 'noch ' + leftText(nd.left);
          cb.style.transform = 'scaleX(' + clamp((nd.mins - 360) / 360, 0.02, 1).toFixed(3) + ')';
          cs.textContent = 'Jetzt bestellt, kommt Ihr Strauß heute – im Stadtgebiet ' + (now.getDay() === 6 ? 'zwischen 12 und 15' : 'zwischen 14 und 18') + NBSP + 'Uhr.';
        } else {
          ck.textContent = 'Nächster Liefertag';
          var w = dayWord(nd.date, now);
          cv.textContent = w.charAt(0).toUpperCase() + w.slice(1);
          cb.style.transform = 'scaleX(1)';
          cs.textContent = (now.getDay() === 0 ? 'Sonntags liefern wir nicht. ' : 'Der Bestellschluss für heute ist vorbei. ') + 'Bestellungen von jetzt kommen ' + dateLong(nd.date) + '.';
        }
      }
      if (heroCut) heroCut.textContent = nd.today ? 'Lieferung heute – noch ' + leftText(nd.left) + ' bestellen' : 'Bis 12' + NBSP + 'Uhr bestellt – am selben Tag geliefert';
    }
    tick();
    setInterval(tick, 30000);

    /* PLZ-Check */
    var form = qs('[data-plz-form]'), input = qs('[data-plz-input]'), out = qs('[data-plz-result]'), map = qs('[data-map]');
    if (!form) return;
    var route = qs('[data-route]', map);
    function clearMap() { qsa('.is-hit', map).forEach(function (n) { n.classList.remove('is-hit'); }); if (route) route.classList.remove('is-on'); }
    function drawRoute(node) {
      if (!route || !node) return;
      var c = qs('circle', node), tx, ty;
      if (c) { tx = +c.getAttribute('cx'); ty = +c.getAttribute('cy'); }
      else { var bb = qs('path', node).getBBox(); tx = bb.x + bb.width / 2; ty = bb.y + bb.height / 2; }
      var sx = 350, sy = 247, mx = (sx + tx) / 2 + (ty - sy) * 0.28, my = (sy + ty) / 2 - (tx - sx) * 0.28;
      route.classList.remove('is-on');
      route.setAttribute('d', 'M' + sx + ' ' + sy + ' Q' + mx.toFixed(1) + ' ' + my.toFixed(1) + ' ' + tx.toFixed(1) + ' ' + ty.toFixed(1));
      void route.getBoundingClientRect();
      route.classList.add('is-on');
    }
    function render(kind, title, lines) {
      out.textContent = '';
      var box = mk('div', 'res res--' + kind);
      var ic = mk('span', 'res__ic', kind === 'stadt' || kind === 'umland' ? '✓' : (kind === 'err' ? '!' : '–'));
      ic.setAttribute('aria-hidden', 'true');
      box.appendChild(ic);
      box.appendChild(mk('p', 'res__t', title));
      lines.forEach(function (l) {
        var p = mk('p', 'res__l');
        if (Array.isArray(l)) { p.appendChild(document.createTextNode(l[0])); p.appendChild(mk('strong', '', l[1])); if (l[2]) p.appendChild(document.createTextNode(l[2])); }
        else p.textContent = l;
        box.appendChild(p);
      });
      out.appendChild(box);
    }
    function check(showErr) {
      var v = input.value.replace(/\D/g, '').slice(0, 5);
      clearMap();
      if (v.length !== 5) {
        if (showErr) { render('err', 'Bitte fünf Ziffern eingeben.', ['Zum Beispiel 69120 für Neuenheim.']); input.setAttribute('aria-invalid', 'true'); }
        return;
      }
      input.removeAttribute('aria-invalid');
      var hit = PLZ[v], now = berlinNow(), nd = nextDelivery(now);
      if (!hit) {
        render('no', 'Nach ' + v + ' liefern wir leider nicht selbst.', ['Rufen Sie uns an – wir empfehlen Ihnen gern eine Floristin vor Ort. Abholen können Sie natürlich jederzeit bei uns in der Hauptstraße.']);
        return;
      }
      var z = ZONES[hit[0]], win = nd.date.getDay() === 6 ? z.sa : z.wd;
      var node = qs('[data-plz="' + v + '"]', map);
      if (node) { node.classList.add('is-hit'); drawRoute(node); }
      var when = dayWord(nd.date, now);
      render(hit[0], (hit[0] === 'stadt' ? (/^die /.test(hit[1]) ? 'Ja, wir liefern in ' : 'Ja, wir liefern nach ') : 'Ja, auch nach ') + hit[1] + '.', [
        ['Lieferung ', when + ' zwischen ' + win[0] + ' und ' + win[1] + NBSP + 'Uhr', nd.today ? '' : ' (' + dateLong(nd.date) + ')'],
        [z.label + ', ' + z.how + ' · Gebühr ', eur(z.fee), ''],
        nd.today ? 'Noch ' + leftText(nd.left) + ' bis zum Bestellschluss um 12' + NBSP + 'Uhr.' : 'Bestellschluss für heute ist vorbei – bis 12' + NBSP + 'Uhr bestellt, kommt der Strauß am selben Tag.'
      ]);
    }
    input.addEventListener('input', function () {
      var v = input.value.replace(/\D/g, '').slice(0, 5);
      if (v !== input.value) input.value = v;
      if (v.length === 5) check(false);
      else { clearMap(); input.removeAttribute('aria-invalid'); }
    });
    form.addEventListener('submit', function (e) { e.preventDefault(); check(true); });
    qsa('[data-plz-try]').forEach(function (b) {
      b.addEventListener('click', function () { input.value = b.getAttribute('data-plz-try'); check(true); });
    });
    // Klick auf Karte = PLZ übernehmen
    qsa('[data-plz]', map).forEach(function (g) {
      g.style.cursor = 'pointer';
      g.addEventListener('click', function () { input.value = g.getAttribute('data-plz'); check(true); });
    });
  }

  /* ------------------------------------------------------------------
     Hero: Intro, Woche, Blütenblätter (Canvas)
     ------------------------------------------------------------------ */
  function initHero() {
    var hero = qs('.hero');
    if (!hero) return;
    var go = function () { requestAnimationFrame(function () { hero.classList.add('is-in'); }); };
    if (document.fonts && document.fonts.ready) {
      var done = false, fire = function () { if (!done) { done = true; go(); } };
      document.fonts.ready.then(fire);
      // Schriften sind vorgeladen; länger als 260 ms warten wir nicht (sonst verzögert sich LCP auf langsamen Handys).
      setTimeout(fire, 260);
    } else go();

    var now = berlinNow();
    var wk = qs('[data-week]'); if (wk) wk.textContent = isoWeek(now);
    var wm = qs('[data-week-month]'); if (wm) wm.textContent = MON[now.getMonth()];
  }

  function initPetals() {
    var canvas = qs('[data-petals]');
    if (!canvas || !canvas.getContext) return;
    var hero = canvas.parentElement, ctx = canvas.getContext('2d');
    var COLORS = ['#F2C9C0', '#EDB5A9', '#F7DDD5', '#F2C9C0', '#E8735A', '#D9472B', '#FBEDE4', '#E9AFA3', '#D9472B'];
    var LEAVES = ['#7f9c84', '#6f9273', '#A9BDB0'];
    var leafPath = new Path2D('M0 1.1 C0.62 0.6 0.7 -0.5 0 -1.15 C-0.7 -0.5 -0.62 0.6 0 1.1Z');
    var gust = 0, lastY = window.pageYOffset;
    var petal = new Path2D('M0 1 C0.55 0.75 0.95 -0.1 0.62 -0.78 C0.42 -1.05 0.1 -0.98 0 -0.82 C-0.1 -0.98 -0.42 -1.05 -0.62 -0.78 C-0.95 -0.1 -0.55 0.75 0 1Z');
    var vein = new Path2D('M0 0.9 C0.05 0.3 0.02 -0.3 0 -0.7');
    var W = 0, H = 0, dpr = 1, ps = [], running = false, visible = true, raf = 0, last = 0, t = 0;
    var mouse = { x: -9999, y: -9999, sx: -9999, sy: -9999 };
    var rnd = seeded(20111);

    function spawn(p, top) {
      p.z = 0.45 + rnd() * 0.55;
      p.size = (5 + rnd() * 8) * p.z * (W < 600 ? 0.9 : 1);
      p.x = rnd() * W;
      p.y = top ? -20 - rnd() * 60 : rnd() * H;
      p.leaf = rnd() < 0.2;
      p.c = p.leaf ? LEAVES[Math.floor(rnd() * LEAVES.length)] : COLORS[Math.floor(rnd() * COLORS.length)];
      p.rot = rnd() * Math.PI * 2;
      p.vr = (rnd() - 0.5) * 1.6;
      p.flip = rnd() * Math.PI * 2;
      p.vf = 0.8 + rnd() * 1.8;
      p.sway = 10 + rnd() * 26;
      p.swayF = 0.5 + rnd() * 0.9;
      p.ph = rnd() * Math.PI * 2;
      p.vy = (16 + rnd() * 22) * p.z;
      p.px = 0; p.py = 0;
      return p;
    }
    function resize() {
      var r = hero.getBoundingClientRect();
      var nw = Math.round(r.width), nh = Math.round(r.height);
      if (nw === W && nh === H) return;
      var sx = W ? nw / W : 1, sy = H ? nh / H : 1;
      W = nw; H = nh; dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      var n = Math.round(clamp(W * H / 30000, 12, 46));
      ps.forEach(function (p) { p.x *= sx; p.y *= sy; });
      while (ps.length < n) ps.push(spawn({}, false));
      ps.length = n;
      if (!running) draw();
    }
    function draw() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < ps.length; i++) {
        var p = ps[i], f = Math.cos(p.flip), af = Math.abs(f);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.scale(p.size, p.size * (0.28 + 0.72 * af));
        ctx.globalAlpha = (0.5 + 0.42 * af) * (0.55 + 0.45 * p.z);
        ctx.fillStyle = p.c;
        ctx.fill(p.leaf ? leafPath : petal);
        ctx.globalAlpha *= 0.5;
        ctx.strokeStyle = f > 0 ? '#ffffff' : 'rgba(80,30,20,.6)';
        ctx.lineWidth = 0.08;
        ctx.stroke(vein);
        ctx.restore();
      }
    }
    function step(dt) {
      t += dt;
      var wind = Math.sin(t * 0.23) * 14 + Math.sin(t * 0.61 + 1.3) * 7;
      mouse.sx += (mouse.x - mouse.sx) * 0.18;
      mouse.sy += (mouse.y - mouse.sy) * 0.18;
      var damp = Math.pow(0.12, dt), g = gust; gust = 0;
      for (var i = 0; i < ps.length; i++) {
        var p = ps[i];
        p.ph += dt * p.swayF;
        var dx = p.x - mouse.sx, dy = p.y - mouse.sy, d2 = dx * dx + dy * dy;
        if (d2 < 15000 && d2 > 1) {
          var d = Math.sqrt(d2), k = (1 - d / 122) * 520 * dt;
          p.px += dx / d * k; p.py += dy / d * k;
          p.vr += (dx > 0 ? 1 : -1) * k * 0.004;
        }
        if (g) { p.py -= g * 3.2 * p.z; p.px += g * 1.6 * Math.sin(p.ph * 1.3) * p.z; p.vr += g * 0.01 * (p.z - 0.7); }
        p.px *= damp; p.py *= damp;
        p.x += (wind * p.z + Math.cos(p.ph) * p.sway + p.px) * dt;
        p.y += (p.vy + Math.sin(p.ph * 0.7) * 6 + p.py) * dt;
        p.rot += p.vr * dt;
        p.vr = lerp(p.vr, clamp(p.vr, -1.2, 1.2), 0.02);
        p.flip += p.vf * dt;
        if (p.y > H + 30 || p.x < -60 || p.x > W + 60) spawn(p, true);
      }
    }
    function frame(ts) {
      if (!running) return;
      var dt = Math.min(0.05, (ts - (last || ts)) / 1000);
      last = ts;
      step(dt); draw();
      raf = requestAnimationFrame(frame);
    }
    function setRun(on) {
      on = on && anim && visible && !document.hidden;
      if (on === running) return;
      running = on;
      if (on) { last = 0; raf = requestAnimationFrame(frame); } else cancelAnimationFrame(raf);
    }
    resize();
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(hero);
    else window.addEventListener('resize', resize);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; setRun(true); }, { rootMargin: '60px 0px' }).observe(hero);
    }
    document.addEventListener('visibilitychange', function () { setRun(true); });
    // Windstoß: Scroll-Geschwindigkeit hebt die Blätter kurz an (gedämpft, verfliegt in < 1 s)
    window.addEventListener('scroll', function () {
      var y = window.pageYOffset; if (running) gust += clamp(y - lastY, -60, 60); lastY = y;
    }, { passive: true });
    if (anim && finePointer) {
      window.addEventListener('pointermove', function (e) {
        if (!running) return;
        var r = canvas.getBoundingClientRect();
        mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
        if (mouse.sx < -5000) { mouse.sx = mouse.x; mouse.sy = mouse.y; }
      }, { passive: true });
      hero.addEventListener('pointerleave', function () { mouse.x = mouse.y = -9999; });
    }
    if (!anim) draw(); // ruhendes Bild bei reduzierter Bewegung
    setRun(true);
  }

  /* ------------------------------------------------------------------
     Ticker „Heute im Laden“ + Saisondaten
     ------------------------------------------------------------------ */
  var PLURAL = { Tulpe: 'Tulpen', Ranunkel: 'Ranunkeln', Anemone: 'Anemonen', Narzisse: 'Narzissen', Mimose: 'Mimosen', Kirschzweig: 'Kirschzweige', Pfingstrose: 'Pfingstrosen', Freilandrose: 'Freilandrosen', Sonnenblume: 'Sonnenblumen', Zinnie: 'Zinnien', Dahlie: 'Dahlien', Hortensie: 'Hortensien', Aster: 'Astern', Chrysantheme: 'Chrysanthemen', Hagebutte: 'Hagebutten', Christrose: 'Christrosen' };
  function parseRange(s) {
    var p = String(s || '').split('-'), a = +p[0], b = +p[1], set = {}, n = 0;
    if (!a || !b) return { has: function () { return false; }, size: 0 };
    for (var m = a, guard = 0; guard < 13; guard++) { set[m] = true; n++; if (m === b) break; m = m % 12 + 1; }
    return { has: function (x) { return !!set[x]; }, size: n };
  }
  var seasonData = [];
  var wheelApi = null;
  function readSeason() {
    seasonData = qsa('.sf').map(function (li) {
      var m = parseRange(li.getAttribute('data-m')), p = parseRange(li.getAttribute('data-p'));
      return { el: li, name: qs('.sf__name', li).textContent, m: m, p: p, allYear: m.size >= 12 };
    });
  }
  function seasonPick(mo) {
    var peak = seasonData.filter(function (f) { return !f.allYear && f.p.has(mo) && f.p.size < 12; }).map(function (f) { return f.name; });
    var inS = seasonData.filter(function (f) { return !f.allYear && f.m.has(mo); }).map(function (f) { return f.name; });
    var out = peak.slice(0, 3);
    inS.forEach(function (n) { if (out.length < 3 && out.indexOf(n) < 0) out.push(n); });
    if (!out.length) out = ['Eukalyptus', 'Schleierkraut'];
    return out;
  }

  function initTicker() {
    var tk = qs('.ticker'), list = qs('[data-ticker]');
    if (!tk || !list) return;
    var mo = berlinNow().getMonth() + 1;
    var names = seasonData.filter(function (f) { return f.m.has(mo); }).map(function (f) { return PLURAL[f.name] || f.name; });
    if (names.length >= 4) {
      list.textContent = '';
      names.forEach(function (n) { list.appendChild(mk('li', '', n)); });
    }
    var lbl = qs('[data-ticker-label]');
    if (lbl) lbl.textContent = 'Im ' + MON[mo - 1] + ' im Laden';
    tk.setAttribute('aria-label', 'Im ' + MON[mo - 1] + ' im Laden');
    var wp = qs('[data-week-pick]');
    if (wp) wp.textContent = joinList(seasonPick(mo), '&');
    if (!anim) return;
    // Für die Endlosschleife die Liste so oft klonen, dass sie die Breite füllt
    tk.classList.add('is-marquee');
    var track = qs('.ticker__track', tk);
    var w = list.scrollWidth || 600, need = Math.ceil((window.innerWidth * 1.6) / w) + 1;
    for (var i = 0; i < need; i++) {
      var c = list.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      c.removeAttribute('data-ticker');
      track.appendChild(c);
    }
    track.style.setProperty('--marquee', Math.round(w / 38) + 's');
    qsa('.ticker__list', track).forEach(function (l) { l.style.setProperty('--marquee', Math.round(w / 38) + 's'); });
  }

  /* ------------------------------------------------------------------
     Saisonkalender (Tabs mit Pfeiltasten)
     ------------------------------------------------------------------ */
  function initSeason() {
    var tabs = qsa('[data-months] [role="tab"]'), ink = qs('[data-months-ink]'), panel = qs('#season-panel');
    var grid = qs('[data-sf-grid]'), status = qs('[data-season-status]'), only = qs('[data-season-only]');
    var pickM = qs('[data-pick-month]'), pickF = qs('[data-pick-flowers]');
    if (!tabs.length || !grid) return;
    var nowM = berlinNow().getMonth() + 1, cur = nowM;
    seasonData.forEach(function (f) {
      var bar = mk('span', 'sf__bar'); bar.setAttribute('aria-hidden', 'true');
      for (var m = 1; m <= 12; m++) {
        var i = mk('i');
        if (f.m.has(m)) i.className = (f.p.has(m) && f.p.size < 12) ? 'pk' : 'on';
        bar.appendChild(i);
      }
      f.bar = bar;
      f.el.appendChild(bar);
      var badge = mk('span', 'sf__badge', 'Hauptsaison'); badge.setAttribute('aria-hidden', 'true');
      f.el.appendChild(badge);
      f.sr = mk('span', 'visually-hidden');
      f.el.appendChild(f.sr);
    });
    tabs[nowM - 1].classList.add('is-now');
    tabs[nowM - 1].setAttribute('aria-description', 'aktueller Monat');

    // Blütenrad: Feder (unterbrechbar) dreht den gewählten Monat unter die Nadel; Scroll gibt etwas Drall dazu.
    var wheel = qs('[data-wheel]'), hubM = qs('[data-wheel-m]'), hubN = qs('[data-wheel-n]');
    var ang = -(nowM - 1) * 30, target = ang, drift = 0, vel = 0, wraf = 0;
    function wheelSet(a) { if (wheel) wheel.style.setProperty('--a', a.toFixed(2) + 'deg'); }
    function wheelLoop() {
      var f = target + drift - ang;
      vel = vel * 0.8 + f * 0.055; ang += vel; wheelSet(ang);
      if (Math.abs(f) > 0.04 || Math.abs(vel) > 0.04) wraf = requestAnimationFrame(wheelLoop);
      else { ang = target + drift; wheelSet(ang); wraf = 0; }
    }
    function wheelKick() { if (!anim) { ang = target + drift; wheelSet(ang); } else if (!wraf) wraf = requestAnimationFrame(wheelLoop); }
    function placeInk() {
      var t = -(cur - 1) * 30, d = ((t - target) % 360 + 540) % 360 - 180;
      target += d; wheelKick();
    }
    wheelApi = { drift: function (p) { drift = (0.5 - p) * 40; wheelKick(); } };
    wheelSet(ang);
    // Saisonware zuerst: Karten nach „in Saison“ sortieren (stabil, sonst Jahreslauf).
    // Mit Bewegung gleiten die Karten per FLIP (nur transform, WAAPI, unterbrechbar) an ihren neuen Platz.
    var FLIP_EASE = 'cubic-bezier(0.23, 1, 0.32, 1)';
    function reorder(mo, animate) {
      var first = null;
      if (animate) {
        first = seasonData.map(function (f) { return f.el.getBoundingClientRect(); });
        seasonData.forEach(function (f) { if (f.flip) { f.flip.cancel(); f.flip = null; } });
      }
      var order = seasonData.map(function (f, i) { return { f: f, i: i, s: f.m.has(mo) ? 0 : 1 }; })
        .sort(function (a, b) { return a.s - b.s || a.f.idx - b.f.idx; });
      var frag = document.createDocumentFragment();
      order.forEach(function (o) { frag.appendChild(o.f.el); });
      grid.appendChild(frag);
      if (!animate || !first[0].width) return;
      var vh = window.innerHeight;
      seasonData.forEach(function (f, i) {
        var a = first[i], b = f.el.getBoundingClientRect();
        var dx = a.left - b.left, dy = a.top - b.top;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
        if ((a.bottom < -40 && b.bottom < -40) || (a.top > vh + 40 && b.top > vh + 40)) return; // außerhalb des Bildschirms: nicht animieren
        f.flip = f.el.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'none' }], { duration: 460, easing: FLIP_EASE });
      });
    }
    seasonData.forEach(function (f, i) { f.idx = i; });

    function setMonth(mo, focus, initial) {
      cur = mo;
      var canFlip = anim && !initial && !grid.classList.contains('only-in') && typeof grid.animate === 'function';
      var firstRects = null;
      tabs.forEach(function (t, i) {
        var on = i === mo - 1;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
      });
      if (focus) tabs[mo - 1].focus();
      panel.setAttribute('aria-labelledby', 'm-' + mo);
      var n = 0, k = 0;
      seasonData.forEach(function (f) {
        var inS = f.m.has(mo), pk = inS && f.p.has(mo) && f.p.size < 12;
        if (inS) n++;
        f.el.classList.toggle('is-out', !inS);
        f.el.classList.toggle('is-in', inS);
        f.el.classList.toggle('is-peak', pk);
        f.sr.textContent = inS ? (pk ? ' – jetzt Hauptsaison' : ' – jetzt in Saison') : ' – nicht in Saison';
        qsa('i', f.bar).forEach(function (i, idx) { i.classList.toggle('cur', idx === mo - 1); });
        if (anim && !initial && inS) {
          f.el.classList.remove('is-pop');
          void f.el.offsetWidth;
          f.el.style.setProperty('--d', Math.min(k++ * 28, 320) + 'ms');
          f.el.classList.add('is-pop');
        }
      });
      reorder(mo, canFlip);
      status.textContent = '';
      status.appendChild(document.createTextNode('Im '));
      status.appendChild(mk('strong', '', MON[mo - 1]));
      status.appendChild(document.createTextNode(' in Saison: '));
      status.appendChild(mk('strong', '', String(n)));
      status.appendChild(document.createTextNode(' von ' + seasonData.length + NBSP + 'Blumen'));
      if (pickM) pickM.textContent = MON[mo - 1];
      if (hubM) hubM.textContent = MON[mo - 1];
      if (hubN) hubN.textContent = n + ' Blumen in Saison';
      if (pickF) pickF.textContent = joinList(seasonPick(mo));
      placeInk();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { setMonth(i + 1, false); });
    });
    qs('[data-months]').addEventListener('keydown', function (e) {
      var k = e.key, m = cur;
      if (k === 'ArrowRight' || k === 'ArrowDown') m = cur % 12 + 1;
      else if (k === 'ArrowLeft' || k === 'ArrowUp') m = (cur + 10) % 12 + 1;
      else if (k === 'Home') m = 1;
      else if (k === 'End') m = 12;
      else return;
      e.preventDefault();
      setMonth(m, true);
    });
    if (only) only.addEventListener('change', function () { grid.classList.toggle('only-in', only.checked); });
    setMonth(nowM, false, true);
  }

  /* ------------------------------------------------------------------
     Strauß-Studio: generativer SVG-Strauß
     ------------------------------------------------------------------ */
  var SVGNS = 'http://www.w3.org/2000/svg';
  function sv(tag, attrs, parent) {
    var n = document.createElementNS(SVGNS, tag);
    if (attrs) for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  function initConfigurator() {
    var svg = qs('[data-bouquet]'), form = qs('[data-cfg-form]');
    if (!svg || !form) return;
    var B = { cx: 210, cy: 198, bx: 210, by: 362, bottom: 508, K: 30, GA: Math.PI * (3 - Math.sqrt(5)) };
    var rand = seeded(424242), PERM = [], i;
    for (i = 0; i < 40; i++) PERM.push(i);
    for (i = PERM.length - 1; i > 0; i--) { var j = Math.floor(rand() * (i + 1)), tmp = PERM[i]; PERM[i] = PERM[j]; PERM[j] = tmp; }
    var JIT = []; for (i = 0; i < 80; i++) JIT.push(rand());

    // Ebenen
    var gBack = sv('g', { class: 'bq-wrap' }, svg);
    var gGreen = sv('g', null, svg);
    var gStem = sv('g', null, svg);
    var gSleeve = sv('g', { class: 'bq-wrap' }, svg);
    var gGyps = sv('g', null, svg);
    var gHeads = sv('g', null, svg);
    var pA = sv('path', { class: 'bq-paper', d: 'M-30 8 L-178 -190 Q-70 -262 34 -246 L28 8 Z' }, gBack);
    var pB = sv('path', { class: 'bq-paper', d: 'M30 8 L178 -190 Q70 -262 -34 -246 L-28 8 Z' }, gBack);
    var sl = sv('path', { class: 'bq-paper', d: 'M-76 -44 Q0 -28 76 -44 L30 118 Q0 124 -30 118 Z' }, gSleeve);
    var slFold = sv('path', { class: 'bq-paper', d: 'M-22 -36 L-9 119 M30 -34 L14 120', fill: 'none', 'stroke-width': '1' }, gSleeve);
    var rib = sv('g', null, gSleeve);
    var ribParts = [
      sv('path', { class: 'bq-ribbon', d: 'M-56 16 L56 16 L55 28 L-55 28 Z' }, rib),
      sv('path', { class: 'bq-ribbon', d: 'M0 22 C-24 2 -42 14 -32 28 C-24 38 -8 30 0 22Z' }, rib),
      sv('path', { class: 'bq-ribbon', d: 'M0 22 C24 2 42 14 32 28 C24 38 8 30 0 22Z' }, rib),
      sv('path', { class: 'bq-ribbon', d: 'M-3 24 C-8 40 -14 54 -20 70 L-12 66 L-8 74 C-4 58 0 42 1 26Z' }, rib),
      sv('path', { class: 'bq-ribbon', d: 'M3 24 C9 38 16 50 24 64 L15 63 L13 72 C7 56 2 42 -1 26Z' }, rib)
    ];
    var knot = sv('circle', { r: '5.5', cx: '0', cy: '22' }, rib);
    // Bis zum ersten Wachsen unsichtbar (sonst kurz schwarze Standardfüllung)
    gBack.style.opacity = gSleeve.style.opacity = '0';

    var live = {};
    var revealed = false;
    var state = null;

    function slot(i2) {
      var r = B.K * Math.sqrt(i2 + 0.6), a = i2 * B.GA - Math.PI / 2;
      return { x: B.cx + r * Math.cos(a), y: B.cy + r * Math.sin(a) * 0.78 + Math.pow(r / 150, 2) * 18, r: r };
    }
    function rimR(n) { return B.K * Math.sqrt(n - 1 + 0.6); }

    // Kopf-Zeichner: Formen tragen data-r (Farbrolle), damit Farbwechsel weich überblenden
    function shape(tag, attrs, role, g) { var n = sv(tag, attrs, g); n.setAttribute('data-r', role); return n; }
    var DRAW = {
      rosen: function (g, seed) {
        var rot = seed * 72;
        for (var k = 0; k < 5; k++) shape('path', { d: 'M0 2 C-15 0 -19 -16 -6 -22 C-2 -24 2 -24 6 -22 C19 -16 15 0 0 2Z', transform: 'rotate(' + (rot + k * 72) + ')' }, 'c', g);
        shape('circle', { r: '13' }, 'd', g);
        shape('circle', { r: '9' }, 'c', g);
        shape('path', { d: 'M2.4 0 a2.4 2.4 0 1 0 -4.8 0 a4.8 4.8 0 1 0 9.6 .6 a7.4 7.4 0 1 0 -14.4 1.4 a10 10 0 1 0 19 -2.6', fill: 'none', 'stroke-width': '1.3', 'stroke-linecap': 'round', transform: 'rotate(' + rot + ')' }, 'l', g);
      },
      ranunkeln: function (g, seed) {
        var rs = [20, 16.5, 13, 9.5, 6.2, 3.4], ang = seed * Math.PI * 2;
        rs.forEach(function (r, k) {
          shape('circle', { r: String(r), cx: (Math.cos(ang) * k * 0.9).toFixed(2), cy: (Math.sin(ang) * k * 0.9 - k * 0.4).toFixed(2) }, k % 2 ? 'h' : 'c', g);
        });
        sv('circle', { r: '1.7', cx: (Math.cos(ang) * 5).toFixed(2), cy: (Math.sin(ang) * 5 - 2.4).toFixed(2), fill: '#5d6b3f' }, g);
      },
      tulpen: function (g) {
        shape('ellipse', { cx: '-7', cy: '-2', rx: '9', ry: '17', transform: 'rotate(-14 -7 -2)' }, 'd', g);
        shape('ellipse', { cx: '7', cy: '-2', rx: '9', ry: '17', transform: 'rotate(14 7 -2)' }, 'd', g);
        shape('path', { d: 'M-13 4 C-13 -12 -5 -20 0 -24 C5 -20 13 -12 13 4 C13 15 7 19 0 19 C-7 19 -13 15 -13 4Z' }, 'c', g);
        shape('path', { d: 'M0 -19 C1.5 -6 1.5 6 0 17', fill: 'none', 'stroke-width': '1.2', 'stroke-linecap': 'round' }, 'hl', g);
      },
      cloud: function (g, seed) { gypsCluster(g, seed, 38, 27); },
      euk: function (g, seed) {
        for (var k = 0; k < 7; k++) {
          var a = (k / 7) * 360 + seed * 50;
          shape('ellipse', { cx: '0', cy: '-11', rx: '8', ry: '10', transform: 'rotate(' + a.toFixed(1) + ')' }, 'eu', g);
        }
        shape('circle', { r: '6' }, 'eu', g);
      }
    };
    function gypsCluster(g, seed, n, rad) {
      var rr = seeded(Math.floor(seed * 1e6) + 7);
      for (var k = 0; k < n; k++) {
        var a = rr() * Math.PI * 2, d = Math.sqrt(rr()) * rad;
        var x = Math.cos(a) * d, y = Math.sin(a) * d * 0.85;
        sv('path', { d: 'M0 ' + (rad * 0.9).toFixed(1) + ' L' + x.toFixed(1) + ' ' + y.toFixed(1), stroke: '#6E8F6E', 'stroke-width': '.6', fill: 'none', opacity: '.7' }, g);
        shape('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: (1.6 + rr() * 1.4).toFixed(2) }, 'gy', g);
      }
    }
    function greenSprig(g, kind, seed) {
      if (kind === 'euk') {
        sv('path', { d: 'M0 0 Q4 -30 0 -64', fill: 'none', stroke: '#7a7563', 'stroke-width': '1.6', 'stroke-linecap': 'round' }, g);
        var L = [[-9, -12, 7.6], [9, -20, 7.2], [-8, -30, 6.8], [8, -38, 6.2], [-6, -47, 5.6], [6, -54, 5], [0, -63, 4.4]];
        L.forEach(function (l, k) { sv('circle', { cx: l[0], cy: l[1], r: l[2], fill: k % 2 ? '#B3C4B8' : '#9FB4A6', stroke: '#7E978A', 'stroke-width': '.9' }, g); });
      } else {
        sv('path', { d: 'M0 0 C11 -14 11 -36 0 -54 C-11 -36 -11 -14 0 0Z', fill: seed > 0.5 ? '#6E8F6E' : '#5F7F61' }, g);
        sv('path', { d: 'M0 -2 C1 -18 1 -34 0 -50', fill: 'none', stroke: '#4C6B50', 'stroke-width': '.9' }, g);
      }
    }
    function paintHead(g, c) {
      var dark = mix(c, '#3b2a24', 0.16), line = mix(c, '#3b2a24', 0.5), light = mix(c, '#ffffff', 0.4);
      if (lum(c) > 0.78) { line = mix(c, '#6f6559', 0.6); dark = mix(c, '#b9ad9c', 0.28); }
      qsa('[data-r]', g).forEach(function (n) {
        var r = n.getAttribute('data-r');
        if (r === 'c') { n.setAttribute('fill', c); n.setAttribute('stroke', line); n.setAttribute('stroke-width', n.getAttribute('stroke-width') || '.8'); n.setAttribute('stroke-opacity', '.55'); }
        else if (r === 'd') { n.setAttribute('fill', dark); n.setAttribute('stroke', line); n.setAttribute('stroke-width', '.8'); n.setAttribute('stroke-opacity', '.5'); }
        else if (r === 'h') { n.setAttribute('fill', light); n.setAttribute('stroke', line); n.setAttribute('stroke-width', '.7'); n.setAttribute('stroke-opacity', '.5'); }
        else if (r === 'l') { n.setAttribute('stroke', line); n.setAttribute('stroke-opacity', '.75'); }
        else if (r === 'hl') { n.setAttribute('stroke', light); n.setAttribute('stroke-opacity', '.8'); }
        else if (r === 'gy') { n.setAttribute('fill', c); n.setAttribute('stroke', 'rgba(31,58,46,.32)'); n.setAttribute('stroke-width', '.6'); }
        else if (r === 'eu') { n.setAttribute('fill', '#A9BDB0'); n.setAttribute('stroke', '#7E978A'); n.setAttribute('stroke-width', '.9'); }
      });
    }

    function readState() {
      var fl = qsa('input[name="flower"]:checked', form).map(function (x) { return x.value; });
      var pal = (qs('input[name="palette"]:checked', form) || {}).value || 'blush';
      var size = (qs('input[name="size"]:checked', form) || {}).value || 'mittel';
      return { flowers: fl, palette: pal, size: size };
    }

    function transformStr(x, y, rot, s) { return 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) rotate(' + rot.toFixed(1) + 'deg) scale(' + s.toFixed(3) + ')'; }

    function enter(node, finalT, delay, isStem) {
      if (isStem) {
        node.style.strokeDashoffset = '1';
        node.getBoundingClientRect();
        node.style.transitionDelay = delay + 'ms';
        requestAnimationFrame(function () { node.style.strokeDashoffset = '0'; });
        return;
      }
      var m = /^(.*)scale\(([\d.]+)\)$/.exec(finalT);
      node.style.transform = m ? m[1] + 'scale(' + (parseFloat(m[2]) * 0.25).toFixed(3) + ')' : finalT;
      node.style.opacity = '0';
      node.getBoundingClientRect();
      node.style.transitionDelay = delay + 'ms';
      requestAnimationFrame(function () {
        node.style.transform = finalT;
        node.style.opacity = '1';
      });
    }
    function exit(node, isStem) {
      node.classList.add('is-out');
      node.style.transitionDelay = '0ms';
      if (isStem) node.style.opacity = '0';
      else {
        var t = node.style.transform || '', m = /^(.*)scale\(([\d.]+)\)$/.exec(t);
        if (m) node.style.transform = m[1] + 'scale(' + (parseFloat(m[2]) * 0.7).toFixed(3) + ')';
        node.style.opacity = '0';
      }
      setTimeout(function () { if (node.parentNode) node.parentNode.removeChild(node); }, anim ? 260 : 0);
    }

    function render(st, first) {
      var size = SIZES[st.size], pal = PALETTES[st.palette], N = size.slots, R = rimR(N), si = size.i;
      var focal = st.flowers.filter(function (f) { return FLOWERS[f].focal; });
      var hasEuk = st.flowers.indexOf('eukalyptus') >= 0, hasGyp = st.flowers.indexOf('schleierkraut') >= 0;
      var headKind = focal.length ? null : (hasGyp ? 'cloud' : 'euk');
      var desired = {}, order = [];
      var add = function (key, o) { desired[key] = o; order.push(key); };
      var stagger = 0, delayFor = function (base, step) { return anim ? base + (stagger++) * step : 0; };

      // Papier & Schleife
      var sx = (R + 44) / 150, sy = 0.92 + 0.18 * (R - 77) / 75;
      if (first) { gBack.style.transition = gSleeve.style.transition = 'none'; gBack.style.opacity = gSleeve.style.opacity = anim ? '0' : '1'; }
      gBack.style.transform = 'translate(' + B.bx + 'px,' + B.by + 'px) scale(' + sx.toFixed(3) + ',' + sy.toFixed(3) + ')';
      gSleeve.style.transform = 'translate(' + B.bx + 'px,' + B.by + 'px) scale(' + (0.8 + 0.3 * (R - 77) / 75).toFixed(3) + ')';
      pA.setAttribute('fill', pal.paper2); pB.setAttribute('fill', pal.paper);
      [pA, pB, sl].forEach(function (p) { p.setAttribute('stroke', mix(pal.paper2, '#3b2a24', 0.2)); p.setAttribute('stroke-width', '1'); p.setAttribute('stroke-opacity', '.45'); });
      sl.setAttribute('fill', pal.paper);
      slFold.setAttribute('stroke', mix(pal.paper2, '#3b2a24', 0.15));
      ribParts.forEach(function (p) { p.setAttribute('fill', pal.ribbon); });
      knot.setAttribute('fill', mix(pal.ribbon, '#000000', 0.18));
      if (first) {
        gBack.getBoundingClientRect();
        gBack.style.transition = gSleeve.style.transition = '';
        if (anim) requestAnimationFrame(function () { gBack.style.opacity = gSleeve.style.opacity = '1'; });
      }

      // Grün am Rand
      var gk = hasEuk ? 'euk' : 'leaf', gCount = (hasEuk ? 6 : 4) + si * 2;
      for (var k = 0; k < gCount; k++) {
        var a = (196 + (148 * k) / (gCount - 1)) * Math.PI / 180, dist = R * 0.9 + 4;
        var gx = B.cx + Math.cos(a) * dist, gy = B.cy + Math.sin(a) * dist * 0.82;
        add('g:' + gk + ':' + k, { layer: gGreen, t: transformStr(gx, gy, a * 180 / Math.PI + 90 + (JIT[k] - 0.5) * 12, (hasEuk ? 0.92 : 0.86) + si * 0.08 + JIT[k + 20] * 0.1), build: (function (kk) { return function (g) { greenSprig(g, gk, JIT[kk]); }; })(k), cls: 'bq-g', delay: delayFor(0, 30) });
      }
      if (hasEuk && si >= 1) {
        [158, 22].forEach(function (deg, q) {
          var a2 = deg * Math.PI / 180, d2 = R * 0.75;
          add('g:euk:side' + q, { layer: gGreen, t: transformStr(B.cx + Math.cos(a2) * d2, B.cy + Math.sin(a2) * d2 * 0.8 + 20, deg + 90, 0.9 + si * 0.06), build: function (g) { greenSprig(g, 'euk', 0.3); }, cls: 'bq-g', delay: delayFor(40, 30) });
        });
      }

      // Stiele + Köpfe
      stagger = 0;
      var heads = [];
      for (var s = 0; s < N; s++) {
        var p = slot(s), type = headKind || focal[PERM[s] % focal.length];
        var cols = headKind === 'cloud' ? [pal.gyps] : headKind === 'euk' ? ['#A9BDB0'] : pal[type];
        var col = cols[PERM[(s + 7) % PERM.length] % cols.length];
        var rot = type === 'tulpen' ? ((p.x - B.cx) / 150) * 30 + (JIT[s] - 0.5) * 12 : (JIT[s] - 0.5) * 80;
        var sc = (1.24 - 0.2 * (p.r / 150)) * (0.92 + JIT[s + 30] * 0.14) * (type === 'tulpen' ? 1.02 : 1) * (headKind === 'cloud' ? 1.08 : 1);
        var sx2 = p.x, sy2 = p.y;
        var bx = B.bx + (sx2 - B.bx) * 0.06, endX = B.bx + (sx2 - B.bx) * 0.2 + (JIT[s + 40] - 0.5) * 8;
        add('s:' + s, {
          layer: gStem, stem: true,
          d: 'M' + sx2.toFixed(1) + ' ' + sy2.toFixed(1) + ' C' + sx2.toFixed(1) + ' ' + (sy2 + 46).toFixed(1) + ' ' + (B.bx + (sx2 - B.bx) * 0.2).toFixed(1) + ' ' + (B.by - 52) + ' ' + bx.toFixed(1) + ' ' + B.by + ' L' + endX.toFixed(1) + ' ' + B.bottom,
          stroke: JIT[s + 50] > 0.5 ? '#557A5C' : '#4A6B51', w: (1.8 + JIT[s + 10] * 1.1).toFixed(2),
          delay: anim ? 60 + s * 26 : 0
        });
        heads.push({ key: 'h:' + s + ':' + (headKind || type), y: sy2, o: { layer: gHeads, t: transformStr(sx2, sy2, rot, sc), build: (function (tp, sd) { return function (g) { DRAW[tp](g, sd); }; })(headKind || type, JIT[s]), color: col, cls: 'bq-h', delay: anim ? 180 + s * 38 : 0, y: sy2 } });
      }
      heads.forEach(function (h) { add(h.key, h.o); });

      // Schleierkraut zwischen den Köpfen
      if (hasGyp && !headKind) {
        for (var y = 0; y < N + 6; y++) {
          var r2 = B.K * Math.sqrt(y + 1.1), a3 = y * B.GA + B.GA / 2 - Math.PI / 2;
          if (r2 > R + 16) break;
          var yx = B.cx + r2 * Math.cos(a3), yy = B.cy + r2 * Math.sin(a3) * 0.78 + Math.pow(r2 / 150, 2) * 18 - 6;
          add('y:' + y, { layer: gGyps, t: transformStr(yx, yy, (JIT[y + 5] - 0.5) * 50, 0.85 + JIT[y + 15] * 0.35), build: (function (yy2) { return function (g) { gypsCluster(g, JIT[yy2 + 3], 10, 13); }; })(y), color: pal.gyps, cls: 'bq-y', delay: anim ? 380 + y * 22 : 0 });
        }
      }

      // Abgleich (keyed)
      Object.keys(live).forEach(function (key) {
        if (!desired[key]) { exit(live[key], key.charAt(0) === 's'); delete live[key]; }
      });
      var newCount = 0;
      order.forEach(function (key) {
        var o = desired[key], node = live[key];
        if (o.stem) {
          if (!node) {
            node = sv('path', { class: 'bq-s', d: o.d, fill: 'none', stroke: o.stroke, 'stroke-width': o.w, 'stroke-linecap': 'round', pathLength: '1', 'stroke-dasharray': '1' }, o.layer);
            live[key] = node;
            if (first || anim) enter(node, null, first ? o.delay : (anim ? 30 + newCount++ * 22 : 0), true);
            else node.style.strokeDashoffset = '0';
          }
          return;
        }
        if (!node) {
          node = sv('g', { class: o.cls });
          o.build(node);
          if (o.color) paintHead(node, o.color);
          // Köpfe nach y einsortieren (vorne = unten)
          if (o.layer === gHeads) {
            var before = null;
            for (var c = 0; c < gHeads.childNodes.length; c++) {
              var ch = gHeads.childNodes[c];
              if (!ch.classList.contains('is-out') && +ch.getAttribute('data-y') > o.y) { before = ch; break; }
            }
            node.setAttribute('data-y', o.y.toFixed(1));
            gHeads.insertBefore(node, before);
          } else o.layer.appendChild(node);
          live[key] = node;
          if (anim) enter(node, o.t, first ? o.delay : 40 + newCount++ * 34, false);
          else { node.style.transform = o.t; node.style.opacity = '1'; }
        } else {
          node.style.transitionDelay = '0ms';
          if (node.style.transform !== o.t) node.style.transform = o.t;
          if (o.color && node.getAttribute('data-c') !== o.color) paintHead(node, o.color);
        }
        if (o.color) node.setAttribute('data-c', o.color);
      });
    }

    // Preis & Texte
    var outTotal = qs('[data-sum-total]'), outBase = qs('[data-sum-base]'), outExtra = qs('[data-sum-extra]'), outSize = qs('[data-sum-size]');
    var tag = qs('[data-bq-tag]'), nameEl = qs('[data-bq-name]'), desc = qs('[data-bq-desc]'), hint = qs('[data-flower-hint]');
    function price(st) {
      var si = SIZES[st.size].i, extra = 0;
      st.flowers.forEach(function (f) { extra += FLOWERS[f].premium[si]; });
      return { base: SIZES[st.size].base, extra: extra, total: SIZES[st.size].base + extra };
    }
    function update(first) {
      var st = readState();
      if (!st.flowers.length) return;
      state = st;
      var pr = price(st), si = SIZES[st.size].i;
      outBase.textContent = eur(pr.base);
      outExtra.textContent = '+' + eur(pr.extra);
      outSize.textContent = SIZES[st.size].label;
      outTotal.textContent = eur(pr.total);
      tag.textContent = eurShort(pr.total);
      nameEl.textContent = SIZES[st.size].label + ' · ' + PALETTES[st.palette].label;
      var names = st.flowers.map(function (f) { return FLOWERS[f].label; });
      desc.textContent = SIZES[st.size].adj + ' Strauß in ' + PALETTES[st.palette].label + ' mit ' + joinList(names) + '.';
      qsa('[data-premium]').forEach(function (n) { n.textContent = '+' + FLOWERS[n.getAttribute('data-premium')].premium[si] + NBSP + '€'; });
      if (revealed) render(st, first);
    }
    form.addEventListener('change', function (e) {
      if (e.target.name === 'flower' && !qsa('input[name="flower"]:checked', form).length) {
        e.target.checked = true;
        hint.hidden = false;
        clearTimeout(hint._t);
        hint._t = setTimeout(function () { hint.hidden = true; }, 3800);
        return;
      }
      if (e.target.name === 'flower') hint.hidden = true;
      update(false);
    });
    form.addEventListener('submit', function (e) { e.preventDefault(); });

    // Karte
    var cIn = qs('[data-card-input]'), cFrom = qs('[data-card-from]'), cText = qs('[data-card-text]'), cSign = qs('[data-card-sign]'), cCount = qs('[data-card-count]');
    var PLACE = 'Ihre Worte auf unserer Karte.';
    function card() {
      var v = cIn.value.trim();
      cText.textContent = v || PLACE;
      cText.classList.toggle('is-empty', !v);
      cSign.textContent = cFrom.value.trim() ? '— ' + cFrom.value.trim() : '';
      cCount.textContent = cIn.value.length + ' / 160';
    }
    cIn.addEventListener('input', card);
    cFrom.addEventListener('input', card);
    card();

    // Bestellen → Formular vorbefüllen
    qs('[data-cfg-order]').addEventListener('click', function () {
      var st = state || readState(), pr = price(st);
      var txt = 'Strauß „' + SIZES[st.size].label + '“ · ' + PALETTES[st.palette].label + ' · ' + joinList(st.flowers.map(function (f) { return FLOWERS[f].label; })) + ' · Beispielpreis ' + eur(pr.total);
      if (cIn.value.trim()) txt += ' · Kartentext: „' + cIn.value.trim() + '“' + (cFrom.value.trim() ? ' – ' + cFrom.value.trim() : '');
      setPick('strauss', txt);
    });

    // Erst beim Sichtbarwerden wachsen lassen
    function reveal() { if (revealed) return; revealed = true; update(true); }
    update(true);
    if (anim && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { reveal(); io.disconnect(); } }, { threshold: 0.3 });
      io.observe(svg);
    } else reveal();
  }

  /* ------------------------------------------------------------------
     Blumen-Abo
     ------------------------------------------------------------------ */
  function initAbo() {
    var seg = qs('[data-abo-seg]');
    if (!seg) return;
    var ink = qs('[data-seg-ink]'), meta = qs('[data-abo-meta]');
    var radios = qsa('input[name="freq"]', seg);
    var shown = {};
    function firstDate() {
      var d = addDays(berlinNow(), ABO.leadDays);
      while (ABO.weekdays.indexOf(d.getDay()) < 0) d = addDays(d, 1);
      return d;
    }
    function tween(el, from, to) {
      if (!anim || from === to) { el.textContent = to.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); return; }
      var t0 = performance.now(), dur = 300;
      el.classList.add('is-tick');
      (function f(ts) {
        var p = clamp((ts - t0) / dur, 0, 1), e = 1 - Math.pow(1 - p, 3);
        el.textContent = lerp(from, to, e).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        if (p < 1) requestAnimationFrame(f); else el.classList.remove('is-tick');
      })(t0);
    }
    function freqKey() { var r = qs('input[name="freq"]:checked', seg); return r ? r.value : 'woche'; }
    function update() {
      var fk = freqKey(), f = ABO.freq[fk], idx = radios.map(function (r) { return r.value; }).indexOf(fk);
      if (ink) ink.style.transform = 'translateX(' + (idx * 100) + '%)';
      Object.keys(ABO.tiers).forEach(function (k) {
        var per = Math.round(ABO.tiers[k].base * (1 - f.discount) * 100) / 100;
        var month = Math.round(per * f.perMonth * 10) / 10;
        var pe = qs('[data-abo-price="' + k + '"]'), me = qs('[data-abo-month="' + k + '"]');
        tween(pe, shown[k] === undefined ? per : shown[k], per);
        shown[k] = per;
        me.textContent = eur(month);
      });
      var fd = firstDate();
      meta.textContent = '';
      meta.appendChild(document.createTextNode(f.days + ' Erste Lieferung möglich: '));
      meta.appendChild(mk('strong', '', dateLong(fd)));
    }
    seg.addEventListener('change', update);
    update();
    qsa('[data-abo-pick]').forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-abo-pick'), f = ABO.freq[freqKey()], per = Math.round(ABO.tiers[k].base * (1 - f.discount) * 100) / 100;
        setPick('abo', 'Blumen-Abo „' + ABO.tiers[k].label + '“ · ' + f.label + ' · ' + eur(per) + ' pro Lieferung · erste Lieferung ab ' + dateLong(firstDate()));
      });
    });
  }

  /* ------------------------------------------------------------------
     Kontaktformular (nur clientseitig – Demo)
     ------------------------------------------------------------------ */
  var pickState = null;
  function setPick(anliegen, text) {
    var box = qs('[data-form-pick]'), v = qs('[data-form-pick-v]'), sel = qs('[data-f-anliegen]');
    var form = qs('[data-form]'), ok = qs('[data-form-ok]');
    if (ok && !ok.hidden) { ok.hidden = true; form.hidden = false; }
    pickState = { anliegen: anliegen, text: text };
    if (sel) sel.value = anliegen;
    if (box && v) { v.textContent = text; box.hidden = false; }
    scrollToEl(qs('#kontakt'), qs('#f-name'));
  }

  function initForm() {
    var form = qs('[data-form]'), ok = qs('[data-form-ok]');
    if (!form) return;
    var f = {
      anl: qs('#f-anliegen'), name: qs('#f-name'), tel: qs('#f-tel'), mail: qs('#f-mail'),
      date: qs('#f-date'), plz: qs('#f-plz'), msg: qs('#f-msg'), dsgvo: qs('#f-dsgvo')
    };
    var errs = { name: qs('#f-name-err'), contact: qs('#f-contact-err'), date: qs('#f-date-err'), plz: qs('#f-plz-err'), msg: qs('#f-msg-err'), dsgvo: qs('#f-dsgvo-err') };
    var now = berlinNow();
    var iso = function (d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
    f.date.min = iso(now);
    var tried = false;
    qs('[data-form-pick-x]').addEventListener('click', function () { pickState = null; qs('[data-form-pick]').hidden = true; f.anl.focus(); });
    f.plz.addEventListener('input', function () { var v = f.plz.value.replace(/\D/g, '').slice(0, 5); if (v !== f.plz.value) f.plz.value = v; });

    function setErr(key, inputs, msg) {
      errs[key].textContent = msg || '';
      inputs.forEach(function (i) { if (msg) i.setAttribute('aria-invalid', 'true'); else i.removeAttribute('aria-invalid'); });
      return !msg;
    }
    function validate() {
      var okAll = true, first = null;
      var mark = function (good, el) { if (!good) { okAll = false; if (!first) first = el; } };
      mark(setErr('name', [f.name], f.name.value.trim().length < 2 ? 'Bitte geben Sie Ihren Namen an.' : ''), f.name);
      var tel = f.tel.value.trim(), mail = f.mail.value.trim(), cmsg = '';
      if (!tel && !mail) cmsg = 'Bitte Telefon oder E-Mail angeben, damit wir Sie erreichen.';
      else if (mail && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) cmsg = 'Die E-Mail-Adresse sieht unvollständig aus.';
      else if (tel && tel.replace(/\D/g, '').length < 6) cmsg = 'Die Telefonnummer ist zu kurz.';
      mark(setErr('contact', [f.tel, f.mail], cmsg), mail && cmsg.indexOf('E-Mail-Adresse') >= 0 ? f.mail : f.tel);
      var dmsg = '';
      if (f.date.value) {
        var d = new Date(f.date.value + 'T12:00');
        if (isNaN(d)) dmsg = 'Bitte ein gültiges Datum wählen.';
        else if (iso(d) < iso(berlinNow())) dmsg = 'Dieses Datum liegt in der Vergangenheit.';
        else if (d.getDay() === 0) dmsg = 'Sonntags ist geschlossen – bitte wählen Sie einen anderen Tag.';
      }
      mark(setErr('date', [f.date], dmsg), f.date);
      var pv = f.plz.value.trim();
      mark(setErr('plz', [f.plz], pv && !/^\d{5}$/.test(pv) ? 'Bitte fünf Ziffern eingeben.' : ''), f.plz);
      mark(setErr('msg', [f.msg], f.msg.value.trim().length < 5 ? 'Bitte schreiben Sie kurz, worum es geht.' : ''), f.msg);
      mark(setErr('dsgvo', [f.dsgvo], f.dsgvo.checked ? '' : 'Bitte bestätigen Sie die Einwilligung.'), f.dsgvo);
      return { ok: okAll, first: first };
    }
    form.addEventListener('input', function () { if (tried) validate(); });
    form.addEventListener('change', function () { if (tried) validate(); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      tried = true;
      var r = validate();
      if (!r.ok) { r.first.focus(); return; }
      var sum = qs('[data-form-sum]');
      sum.textContent = '';
      var rows = [['Anliegen', f.anl.options[f.anl.selectedIndex].text]];
      if (pickState) rows.push(['Auswahl', pickState.text]);
      rows.push(['Name', f.name.value.trim()]);
      if (f.tel.value.trim()) rows.push(['Telefon', f.tel.value.trim()]);
      if (f.mail.value.trim()) rows.push(['E-Mail', f.mail.value.trim()]);
      if (f.date.value) rows.push(['Wunschtermin', dateLong(new Date(f.date.value + 'T12:00'))]);
      if (f.plz.value.trim()) {
        var hit = PLZ[f.plz.value.trim()];
        rows.push(['Lieferung', f.plz.value.trim() + ' – ' + (hit ? ZONES[hit[0]].label + ', ' + eur(ZONES[hit[0]].fee) : 'außerhalb unseres Liefergebiets, wir melden uns')]);
      }
      rows.push(['Nachricht', f.msg.value.trim()]);
      rows.forEach(function (row) {
        var d = mk('div'); d.appendChild(mk('dt', '', row[0])); d.appendChild(mk('dd', '', row[1])); sum.appendChild(d);
      });
      form.hidden = true;
      ok.hidden = false;
      ok.focus({ preventScroll: true });
      scrollToEl(qs('#kontakt'));
    });
    qs('[data-form-reset]').addEventListener('click', function () {
      form.reset();
      tried = false;
      Object.keys(errs).forEach(function (k) { errs[k].textContent = ''; });
      qsa('[aria-invalid]', form).forEach(function (n) { n.removeAttribute('aria-invalid'); });
      pickState = null;
      qs('[data-form-pick]').hidden = true;
      ok.hidden = true;
      form.hidden = false;
      f.name.focus();
    });
  }

  /* ------------------------------------------------------------------
     Leistungen: Vorschaubild folgt dem Cursor (Lerp)
     ------------------------------------------------------------------ */
  function initServices() {
    var list = qs('[data-svc]'), prev = qs('[data-svc-preview]');
    if (!list || !prev || !finePointer || !anim) return;
    var imgs = qsa('img', prev), rows = qsa('.svc__row', list);
    var x = 0, y = 0, tx = 0, ty = 0, on = false, raf = 0, idle = 0;
    var W = 240, H = 320;
    function loop() {
      x += (tx - x) * 0.15; y += (ty - y) * 0.15;
      var rot = clamp((tx - x) * 0.06, -7, 7);
      prev.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) rotate(' + rot.toFixed(2) + 'deg)';
      if (!on && Math.abs(tx - x) < 0.5 && Math.abs(ty - y) < 0.5) { if (++idle > 20) { raf = 0; return; } } else idle = 0;
      raf = requestAnimationFrame(loop);
    }
    function target(e) {
      var right = e.clientX + 32 + W < window.innerWidth;
      tx = right ? e.clientX + 32 : e.clientX - 32 - W;
      ty = clamp(e.clientY - H / 2, 12, window.innerHeight - H - 12);
    }
    rows.forEach(function (r) {
      r.addEventListener('pointerenter', function (e) {
        var i = +r.getAttribute('data-preview');
        imgs.forEach(function (im, k) { im.classList.toggle('is-active', k === i); });
        if (!on) { target(e); x = tx; y = ty; }
        on = true; prev.classList.add('is-on');
        if (!raf) raf = requestAnimationFrame(loop);
      });
    });
    list.addEventListener('pointermove', function (e) { target(e); if (!raf) raf = requestAnimationFrame(loop); }, { passive: true });
    list.addEventListener('pointerleave', function () { on = false; prev.classList.remove('is-on'); });
    window.addEventListener('scroll', function () { if (on) { on = false; prev.classList.remove('is-on'); } }, { passive: true });
  }

  /* ------------------------------------------------------------------
     Reveals, Zähler
     ------------------------------------------------------------------ */
  function initReveals() {
    var els = qsa('[data-reveal]');
    els.forEach(function (el) {
      var sib = el.parentElement ? qsa(':scope > [data-reveal]', el.parentElement) : [el];
      var i = sib.indexOf(el);
      if (i > 0) el.style.setProperty('--d', Math.min(i * 80, 320) + 'ms');
    });
    if (!('IntersectionObserver' in window) || motionOff) { els.forEach(function (el) { el.classList.add('is-visible'); }); return; }
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
    els.forEach(function (el) { io.observe(el); });
  }

  function initStats() {
    var nums = qsa('[data-count]');
    if (!nums.length || !anim || !('IntersectionObserver' in window)) return;
    var FROM = { '2011': 1987, '6': 0, '0': 250, '4.9': 0 };
    nums.forEach(function (n) {
      var to = parseFloat(n.getAttribute('data-count')), dec = +(n.getAttribute('data-dec') || 0);
      var from = FROM[n.getAttribute('data-count')] !== undefined ? FROM[n.getAttribute('data-count')] : 0;
      var fmt = function (v) { return dec ? v.toLocaleString('de-DE', { minimumFractionDigits: dec, maximumFractionDigits: dec }) : String(Math.round(v)); };
      n.textContent = fmt(from);
      var io = new IntersectionObserver(function (en) {
        if (!en[0].isIntersecting) return;
        io.disconnect();
        var t0 = performance.now(), dur = 1500;
        (function f(ts) {
          var p = clamp((ts - t0) / dur, 0, 1), e = 1 - Math.pow(1 - p, 4);
          n.textContent = fmt(lerp(from, to, e));
          if (p < 1) requestAnimationFrame(f); else n.textContent = fmt(to);
        })(t0);
      }, { threshold: 0.6 });
      io.observe(n);
    });
  }

  /* ------------------------------------------------------------------
     Mohn im Hero: der Blütenkopf nickt dem Zeiger nach (Feder)
     ------------------------------------------------------------------ */
  function initPoppy() {
    var fl = qs('.fl-sway'), sheet = qs('[data-sheet]'), hero = qs('.hero');
    if (!fl || !sheet || !anim || !finePointer) return;
    var a = 0, v = 0, t = 0, raf = 0;
    function loop() {
      var f = t - a;
      v = v * 0.84 + f * 0.045; a += v;
      fl.style.transform = 'rotate(' + a.toFixed(2) + 'deg)';
      if (Math.abs(f) > 0.02 || Math.abs(v) > 0.02) raf = requestAnimationFrame(loop); else raf = 0;
    }
    hero.addEventListener('pointermove', function (e) {
      var r = sheet.getBoundingClientRect();
      t = clamp((e.clientX - (r.left + r.width * 0.56)) / r.width * 18, -10, 10);
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
    hero.addEventListener('pointerleave', function () { t = 0; if (!raf) raf = requestAnimationFrame(loop); });
  }

  /* Magnetische Anhänger-Knöpfe (nur feiner Zeiger) – über die translate-Eigenschaft,
     damit :active { transform: scale(.97) } unangetastet bleibt. */
  function initMagnet() {
    if (!finePointer || !anim) return;
    qsa('[data-magnet]').forEach(function (b) {
      var x = 0, y = 0, tx = 0, ty = 0, raf = 0;
      function loop() {
        x += (tx - x) * 0.2; y += (ty - y) * 0.2;
        b.style.translate = x.toFixed(2) + 'px ' + y.toFixed(2) + 'px';
        if (Math.abs(tx - x) > 0.1 || Math.abs(ty - y) > 0.1) raf = requestAnimationFrame(loop); else raf = 0;
      }
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        tx = (e.clientX - r.left - r.width / 2) * 0.22; ty = (e.clientY - r.top - r.height / 2) * 0.32;
        if (!raf) raf = requestAnimationFrame(loop);
      });
      b.addEventListener('pointerleave', function () { tx = ty = 0; if (!raf) raf = requestAnimationFrame(loop); });
    });
  }

  /* Zeichen-Rollen beim Hover: Text bleibt für Screenreader als ein Wort erhalten */
  function initRoll() {
    if (!finePointer || !anim) return;
    qsa('[data-roll], .nav a').forEach(function (el) {
      var txt = el.textContent.trim(), k = 0;
      el.textContent = '';
      el.appendChild(mk('span', 'visually-hidden', txt));
      var r = mk('span', 'roll'); r.setAttribute('aria-hidden', 'true');
      txt.split(' ').forEach(function (word, wi) {
        if (wi) r.appendChild(document.createTextNode(' '));
        var w = mk('span', 'roll__w'); w.style.whiteSpace = 'nowrap';
        Array.prototype.forEach.call(word, function (ch) {
          var i = document.createElement('i'), b = document.createElement('b');
          i.style.setProperty('--k', k++);
          b.textContent = ch; b.setAttribute('data-c', ch);
          i.appendChild(b); w.appendChild(i);
        });
        r.appendChild(w);
      });
      el.appendChild(r);
    });
  }

  /* Laufband reagiert auf Scroll-Geschwindigkeit (WAAPI playbackRate, klingt weich ab) */
  function initTickerSpeed() {
    var tk = qs('.ticker');
    if (!tk || !anim || !tk.getAnimations) return;
    var anims = [], rate = 1, goal = 1, raf = 0, lastY = window.pageYOffset, vis = false;
    function collect() { anims = []; qsa('.ticker__list', tk).forEach(function (l) { anims = anims.concat(l.getAnimations()); }); }
    collect();
    function loop() {
      goal += (1 - goal) * 0.06;
      rate += (goal - rate) * 0.2;
      anims.forEach(function (an) { an.playbackRate = rate; });
      if (Math.abs(rate - 1) > 0.01 || Math.abs(goal - 1) > 0.01) raf = requestAnimationFrame(loop);
      else { rate = 1; anims.forEach(function (an) { an.playbackRate = 1; }); raf = 0; }
    }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { vis = en[0].isIntersecting; if (vis) collect(); }).observe(tk);
    window.addEventListener('scroll', function () {
      var y = window.pageYOffset, dy = y - lastY; lastY = y;
      if (!vis) return;
      goal = clamp(goal + dy * 0.08, -4, 7);
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
  }

  /* Werkbank-Text: Wort für Wort mit Tinte gefüllt – durch Scrollen schneller,
     aber spätestens 2,6 s nach dem Erscheinen vollständig (wartet auf nichts). */
  function initInk() {
    var el = qs('[data-ink]');
    if (!el || !anim || !('IntersectionObserver' in window)) return;
    var words = [];
    Array.prototype.slice.call(el.childNodes).forEach(function (node) {
      if (node.nodeType !== 3) return;
      var frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
        var w = mk('span', 'wd', part); words.push(w); frag.appendChild(w);
      });
      el.replaceChild(frag, node);
    });
    var n = words.length, shown = 0, t0 = 0, raf = 0, active = false;
    function update(ts) {
      var r = el.getBoundingClientRect(), vh = window.innerHeight;
      var p = clamp((vh * 0.92 - r.top) / (r.height + vh * 0.3), 0, 1);
      if (!t0) t0 = ts;
      var k = Math.round(Math.max(p * 1.2, (ts - t0) / 2600) * n);
      k = clamp(k, shown, n);
      for (var i = shown; i < k; i++) words[i].classList.add('is-ink');
      shown = k;
      raf = (shown < n && active) ? requestAnimationFrame(update) : 0;
    }
    new IntersectionObserver(function (en) {
      active = en[0].isIntersecting;
      if (active && !raf && shown < n) raf = requestAnimationFrame(update);
    }, { rootMargin: '0px 0px -12% 0px' }).observe(el);
  }

  /* ------------------------------------------------------------------
     GSAP-Choreografie: Belege wachsen, Rad-Drall, Hochzeits-Strecke mit
     Tiefe (CSS-sticky, kein Pin), Trauer-Kapitel färbt die Seite dunkel
     ------------------------------------------------------------------ */
  function initGSAP() {
    if (!hasGSAP || !anim) return;
    var gsap = window.gsap, ST = window.ScrollTrigger;
    var hero = qs('.hero');
    var mm = gsap.matchMedia();

    // Leistungen: jeder gepresste Beleg wächst aus der Grundlinie
    qsa('[data-grow]').forEach(function (el) {
      gsap.fromTo(el, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none',
        scrollTrigger: { trigger: el, start: 'top 94%', end: 'top 52%', scrub: 0.5 } });
    });

    // Blütenrad: Scroll gibt dem Rad Drall (±20°), die Feder im Rad gleicht aus
    var season = qs('#saison');
    if (season && wheelApi) ST.create({ trigger: season, start: 'top bottom', end: 'bottom top', onUpdate: function (st) { wheelApi.drift(st.progress); } });

    // Trauer: dunkles Kapitel öffnet sich als Kreis, Text folgt
    var mo = qs('[data-dusk]'), veil = qs('[data-veil]');
    if (mo && veil) {
      gsap.fromTo(veil, { clipPath: 'circle(0% at 24% 34%)' }, { clipPath: 'circle(145% at 24% 34%)', ease: 'none',
        scrollTrigger: { trigger: mo, start: 'top 88%', end: 'top 30%', scrub: 0.4 } });
      gsap.fromTo(qs('.mourning__grid', mo), { opacity: 0 }, { opacity: 1, ease: 'none',
        scrollTrigger: { trigger: mo, start: 'top 62%', end: 'top 38%', scrub: 0.4 } });
    }

    mm.add('(min-width: 900px)', function () {
      if (hero) {
        gsap.to('.hero__sheet', { y: 70, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.4 } });
        gsap.to('.hero__print', { y: -50, rotation: -4, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.4 } });
        gsap.to('.hero__copy', { y: -30, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.4 } });
      }
      var pin = qs('[data-wed-pin]'), track = qs('[data-wed-track]'), back = qs('[data-wed-back]'), front = qs('[data-wed-front]');
      if (!pin || !track) return;
      pin.classList.add('is-pinned');
      // Statt pin:true eine CSS-sticky-Bühne: Laufbahn = Viewport + Spurlänge, bewegt wird nur per transform.
      var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
      var setRunway = function () { pin.style.height = (window.innerHeight + dist()) + 'px'; };
      setRunway();
      ST.addEventListener('refreshInit', setRunway);
      var tl = gsap.timeline({ scrollTrigger: { trigger: pin, start: 'top top', end: 'bottom bottom', scrub: 0.6, invalidateOnRefresh: true } });
      tl.to(track, { x: function () { return -dist(); }, ease: 'none' }, 0);
      if (back) tl.to(back, { x: function () { return -dist() * 0.32; }, ease: 'none' }, 0);
      if (front) tl.to(front, { x: function () { return -dist() * 1.5; }, ease: 'none' }, 0);
      qsa('.wp__fig', track).forEach(function (f, i) {
        tl.fromTo(f, { y: (i % 2 ? -1 : 1) * 26 }, { y: (i % 2 ? 1 : -1) * 26, ease: 'none' }, 0);
      });
      return function () {
        ST.removeEventListener('refreshInit', setRunway);
        pin.classList.remove('is-pinned'); pin.style.height = '';
        gsap.set([track, back, front].concat(qsa('.wp__fig', track)).filter(Boolean), { clearProps: 'transform' });
      };
    });
    window.addEventListener('load', function () { ST.refresh(); });
  }

  /* ------------------------------------------------------------------
     Start in Etappen: erster Bildschirm sofort, der Rest häppchenweise
     ------------------------------------------------------------------ */
  function start() {
    window.__blattwerkReady = true;
    safe('scroll', initScroll);
    safe('header', initHeader);
    safe('menu', initMenu);
    safe('anchors', initAnchors);
    safe('open', initOpenState);
    safe('hero', initHero);
    safe('petals', initPetals);
    safe('poppy', initPoppy);
    safe('magnet', initMagnet);
    var queue = [
      ['season-data', readSeason], ['ticker', initTicker], ['ticker-speed', initTickerSpeed], ['roll', initRoll],
      ['reveals', initReveals], ['services', initServices], ['season', initSeason], ['configurator', initConfigurator],
      ['abo', initAbo], ['delivery', initDelivery], ['form', initForm], ['ink', initInk], ['gsap', initGSAP]
    ];
    var later = window.requestIdleCallback ? function (fn) { window.requestIdleCallback(fn, { timeout: 180 }); } : function (fn) { setTimeout(fn, 16); };
    function next() {
      var t0 = performance.now();
      while (queue.length && performance.now() - t0 < 14) { var it = queue.shift(); safe(it[0], it[1]); }
      if (queue.length) later(next);
      else if (hasGSAP) window.ScrollTrigger.refresh();
    }
    later(next);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
