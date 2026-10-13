/* ==========================================================================
   Blitzblank Gebäudereinigung · Modell „Glanz“
   Ohne Build-Schritt. Optional: GSAP + ScrollTrigger, Lenis (assets/vendor).
   Alle Inhalte funktionieren auch ohne diese Bibliotheken und ohne JavaScript.
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
     ANGEBOTSRECHNER – unverbindliche Beispielwerte, hier anpassen
     ------------------------------------------------------------------ */
  var CALC = {
    RATE: [28.5, 33.5],          // € netto je Arbeitsstunde (Spanne)
    WEEKS_PER_MONTH: 52 / 12,    // ≈ 4,33 Wochen pro Monat
    MIN_HOURS_PER_VISIT: 1,      // Mindesteinsatz in Stunden
    HOURS_PER_PERSON: 3.5,       // ab hier wird eine weitere Reinigungskraft eingeplant
    MIN_MONTH: 120,              // Mindestbetrag pro Monat (€ netto)
    ROUND: 10,                   // auf volle 10 € runden
    // Leistungswert = gereinigte m² pro Arbeitsstunde je Objektart
    TYPES: {
      buero:  { name: 'Büro & Verwaltung', perHour: 210, scope: ['Papierkörbe, Teeküche und Sanitär bei jedem Einsatz', 'Böden saugen und feucht wischen', 'Arbeitsplätze auf freigeräumten Flächen'] },
      praxis: { name: 'Arztpraxis', perHour: 140, scope: ['Wischdesinfektion der Kontaktflächen nach Hygieneplan', 'Behandlungsräume, Wartezimmer und Empfang', 'Patienten- und Personal-WC mit Farbcode-Tüchern'] },
      treppe: { name: 'Treppenhaus', perHour: 170, scope: ['Stufen, Podeste und Handläufe', 'Eingang, Briefkastenanlage und Haustürglas', 'QR-Quittung pro Termin für die Verwaltung'] },
      laden:  { name: 'Laden & Showroom', perHour: 230, scope: ['Verkaufsfläche und Eingang vor Ladenöffnung', 'Glastüren, Theken und Spiegel ohne Fingerabdrücke', 'Sozialraum, Umkleiden und Sanitär'] },
      bau:    { name: 'Bauendreinigung', perHour: 14, once: true, scope: ['Grobreinigung: Bauschutt, Staub, Spritzer', 'Feinreinigung: Fenster, Sanitär, Türen, Heizkörper', 'Endabnahme mit Fotoprotokoll'] }
    },
    BAU_HOURS_PER_DAY: 8,        // Arbeitsstunden je Person und Tag (Bauend)
    BAU_PERSON_HOURS: 16,        // je angefangene 16 Std. eine weitere Kraft (min. 2)
    // Zusatzleistungen: perM2 = € pro m² Grundfläche und Monat, flat = € pro Monat, factor = Aufschlag (einmalig)
    EXTRAS: {
      glas:    { label: 'Glasreinigung innen & außen, quartalsweise', perM2: [0.24, 0.31] },
      teppich: { label: 'Teppich-Tiefenreinigung, 2× jährlich', perM2: [0.12, 0.18] },
      grund:   { label: 'Grundreinigung Hartböden, 1× jährlich', perM2: [0.10, 0.16] },
      hygiene: { label: 'Auffüllservice Seife & Papier', flat: [25, 40] },
      silikon: { label: 'Silikon-, Farb- & Aufkleberreste', factor: [0.15, 0.22] },
      express: { label: 'Expresstermin innerhalb von 48 h', factor: [0.20, 0.20] }
    },
    INTERVALS: { '0.5': '14-täglich', '1': '1× pro Woche', '2': '2× pro Woche', '3': '3× pro Woche', '5': 'werktäglich' },
    WEEK: { '0.5': [0], '1': [0], '2': [0, 3], '3': [0, 2, 4], '5': [0, 1, 2, 3, 4] }
  };

  /* ------------------------------------------------------------------
     EINSATZGEBIET – Zonen und Postleitzahlen (fiktive Auswahl)
     Karte: 10 SVG-Einheiten = 1 km, Zentrale Neckarau bei (310.3 | 286.4)
     ------------------------------------------------------------------ */
  var HQ = { x: 310.3, y: 286.4, lat: 49.462, lon: 8.478 };
  var PX_PER_KM = 10, PX_PER_LON = 724, PX_PER_LAT = 1112;
  var ZONES = [
    { id: 1, max: 12, name: 'Kernzone', text: 'Ohne Anfahrtspauschale. Begehung meist innerhalb von drei Werktagen.' },
    { id: 2, max: 25, name: 'Rhein-Neckar-Zone', text: 'Anfahrt ab zwei Einsätzen pro Woche inklusive, sonst pauschal pro Einsatz.' },
    { id: 3, max: 40, name: 'Erweitertes Gebiet', text: 'Auf Anfrage und ab 300 m² Objektfläche – wir planen Ihr Objekt in eine bestehende Tour ein.' }
  ];
  // PLZ: [Ort, Breite, Länge, Karten-Ort (optional)]
  var PLACES = {
    '68159': ['Mannheim-Innenstadt', 49.489, 8.463, 'mannheim'], '68161': ['Mannheim-Innenstadt', 49.487, 8.470, 'mannheim'],
    '68163': ['Mannheim-Lindenhof', 49.475, 8.460, 'mannheim'], '68165': ['Mannheim-Oststadt', 49.480, 8.487, 'mannheim'],
    '68167': ['Mannheim-Neckarstadt-Ost', 49.498, 8.485, 'mannheim'], '68169': ['Mannheim-Neckarstadt-West', 49.499, 8.470, 'mannheim'],
    '68199': ['Mannheim-Neckarau', 49.456, 8.487, 'mannheim'], '68219': ['Mannheim-Rheinau', 49.425, 8.515, 'mannheim'],
    '68229': ['Mannheim-Rheinau-Süd', 49.412, 8.520, 'mannheim'], '68239': ['Mannheim-Seckenheim', 49.460, 8.570, 'mannheim'],
    '68259': ['Mannheim-Feudenheim', 49.498, 8.535, 'mannheim'], '68305': ['Mannheim-Waldhof', 49.525, 8.480, 'mannheim'],
    '68307': ['Mannheim-Sandhofen', 49.545, 8.470, 'mannheim'], '68309': ['Mannheim-Käfertal', 49.515, 8.525, 'mannheim'],
    '67059': ['Ludwigshafen-Mitte', 49.480, 8.440, 'ludwigshafen'], '67061': ['Ludwigshafen-Süd', 49.465, 8.435, 'ludwigshafen'],
    '67063': ['Ludwigshafen-Friesenheim', 49.500, 8.420, 'ludwigshafen'], '67065': ['Ludwigshafen-Mundenheim', 49.450, 8.420, 'ludwigshafen'],
    '67067': ['Ludwigshafen-Maudach', 49.440, 8.405, 'ludwigshafen'], '67069': ['Ludwigshafen-Oppau', 49.520, 8.400, 'ludwigshafen'],
    '67071': ['Ludwigshafen-Oggersheim', 49.490, 8.375, 'ludwigshafen'],
    '69115': ['Heidelberg-Bergheim', 49.406, 8.685, 'heidelberg'], '69117': ['Heidelberg-Altstadt', 49.410, 8.705, 'heidelberg'],
    '69118': ['Heidelberg-Ziegelhausen', 49.415, 8.755, 'heidelberg'], '69120': ['Heidelberg-Neuenheim', 49.418, 8.690, 'heidelberg'],
    '69121': ['Heidelberg-Handschuhsheim', 49.430, 8.685, 'heidelberg'], '69123': ['Heidelberg-Pfaffengrund', 49.410, 8.640, 'heidelberg'],
    '69124': ['Heidelberg-Kirchheim', 49.385, 8.660, 'heidelberg'], '69126': ['Heidelberg-Rohrbach', 49.380, 8.695, 'heidelberg'],
    '68519': ['Viernheim', 49.540, 8.578, 'viernheim', 1], '68526': ['Ladenburg', 49.473, 8.609, 'ladenburg', 1],
    '68535': ['Edingen-Neckarhausen', 49.457, 8.607], '68542': ['Heddesheim', 49.505, 8.603], '68549': ['Ilvesheim', 49.474, 8.567],
    '68623': ['Lampertheim', 49.597, 8.472, 'lampertheim', 1], '68642': ['Bürstadt', 49.643, 8.454], '68647': ['Biblis', 49.690, 8.457],
    '68723': ['Schwetzingen', 49.383, 8.570, 'schwetzingen', 1], '68753': ['Waghäusel', 49.249, 8.513],
    '68766': ['Hockenheim', 49.322, 8.547, 'hockenheim', 1], '68775': ['Ketsch', 49.367, 8.531], '68782': ['Brühl', 49.400, 8.534],
    '68789': ['St. Leon-Rot', 49.265, 8.599], '68804': ['Altlußheim', 49.300, 8.500],
    '69469': ['Weinheim', 49.548, 8.668, 'weinheim', 1], '69493': ['Hirschberg', 49.507, 8.661], '69502': ['Hemsbach', 49.591, 8.654],
    '69198': ['Schriesheim', 49.474, 8.660], '69221': ['Dossenheim', 49.450, 8.672], '69214': ['Eppelheim', 49.402, 8.633],
    '69181': ['Leimen', 49.348, 8.691, 'leimen', 1], '69168': ['Wiesloch', 49.294, 8.699, 'wiesloch', 1], '69190': ['Walldorf', 49.306, 8.642],
    '69207': ['Sandhausen', 49.343, 8.658], '69151': ['Neckargemünd', 49.392, 8.797, 'neckargemuend', 1],
    '74889': ['Sinsheim', 49.253, 8.879, 'sinsheim', 1],
    '67346': ['Speyer', 49.317, 8.441, 'speyer', 1], '67105': ['Schifferstadt', 49.385, 8.377, 'schifferstadt', 1],
    '67112': ['Mutterstadt', 49.441, 8.356], '67117': ['Limburgerhof', 49.421, 8.392], '67227': ['Frankenthal', 49.534, 8.354, 'frankenthal', 1],
    '67240': ['Bobenheim-Roxheim', 49.587, 8.357], '67245': ['Lambsheim', 49.513, 8.287],
    '67547': ['Worms', 49.634, 8.351, 'worms', 1], '67549': ['Worms', 49.645, 8.345, 'worms', 1], '67550': ['Worms', 49.650, 8.330, 'worms', 1], '67551': ['Worms', 49.610, 8.330, 'worms', 1],
    '67098': ['Bad Dürkheim', 49.463, 8.168, 'badduerkheim', 1],
    '67433': ['Neustadt an der Weinstraße', 49.350, 8.140, 'neustadt', 1], '67434': ['Neustadt an der Weinstraße', 49.340, 8.150, 'neustadt', 1], '67435': ['Neustadt an der Weinstraße', 49.360, 8.130, 'neustadt', 1],
    '64625': ['Bensheim', 49.681, 8.617, 'bensheim', 1], '64646': ['Heppenheim', 49.642, 8.638], '64653': ['Lorsch', 49.654, 8.568],
    '76726': ['Germersheim', 49.223, 8.364]
  };
  var PHONE = '0621 555 70 80';

  /* ------------------------------------------------------------------
     Grundlagen
     ------------------------------------------------------------------ */
  window.__glanzReady = true;
  var doc = document.documentElement;
  doc.classList.remove('reveal-all');
  var qs = function (s, r) { return (r || document).querySelector(s); };
  var qsa = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var motionOff = doc.classList.contains('motion-off');
  var reduced = function () { return motionOff || mqReduce.matches; };
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var gsap = window.gsap, ST = window.ScrollTrigger;
  var hasGSAP = !!(gsap && ST);
  var enhanced = hasGSAP && !reduced();
  var hasIO = 'IntersectionObserver' in window;
  var lenis = null;
  var fmt = function (n, d) { return Number(n).toLocaleString('de-DE', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); };
  var easeOutCubic = function (t) { return 1 - Math.pow(1 - t, 3); };
  var easeInOut = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var headerH = function () { var h = qs('[data-header]'); return h ? h.offsetHeight : 72; };
  var el = function (tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

  if (mqReduce.addEventListener) mqReduce.addEventListener('change', function (e) {
    doc.classList.toggle('motion-off', e.matches || motionOff);
    doc.classList.toggle('motion-ok', !(e.matches || motionOff));
  });

  /* ------------------------------------------------------------------
     Smooth Scroll (Lenis) + ScrollTrigger
     ------------------------------------------------------------------ */
  if (hasGSAP) gsap.registerPlugin(ST);
  if (enhanced && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.11, smoothWheel: true, wheelMultiplier: 1 });
    window.__lenis = lenis;
    lenis.on('scroll', ST.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  /* ------------------------------------------------------------------
     Toast
     ------------------------------------------------------------------ */
  var toastEl = qs('[data-toast]'), toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    clearTimeout(toastTimer);
    toastEl.textContent = msg;
    requestAnimationFrame(function () { toastEl.classList.add('is-on'); });
    toastTimer = setTimeout(function () {
      toastEl.classList.remove('is-on');
      setTimeout(function () { if (!toastEl.classList.contains('is-on')) toastEl.textContent = ''; }, 300);
    }, 2800);
  }

  /* ------------------------------------------------------------------
     Header: Zustand, Fortschritt, aktiver Menüpunkt
     ------------------------------------------------------------------ */
  (function initHeader() {
    var header = qs('[data-header]'), bar = qs('[data-progress]');
    if (!header) return;
    var ticking = false;
    function update() {
      ticking = false;
      var y = window.scrollY || window.pageYOffset;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      header.classList.toggle('is-scrolled', y > 8);
      if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? clamp(y / max, 0, 1) : 0).toFixed(4) + ')';
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update);
    update();

    if (!hasIO) return;
    var links = qsa('.main-nav a');
    var map = {};
    links.forEach(function (a) { var id = a.getAttribute('href').slice(1); var s = document.getElementById(id); if (s) map[id] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var a = map[e.target.id]; if (!a) return;
        if (e.isIntersecting) { links.forEach(function (l) { l.classList.remove('is-active'); }); a.classList.add('is-active'); }
        else a.classList.remove('is-active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { io.observe(document.getElementById(id)); });
  })();

  /* ------------------------------------------------------------------
     Mobile Navigation (Dialog mit Fokusführung)
     ------------------------------------------------------------------ */
  (function initMenu() {
    var toggle = qs('[data-menu-toggle]'), nav = qs('[data-mobile-nav]'), closeBtn = qs('[data-menu-close]');
    if (!toggle || !nav) return;
    var panel = qs('.mobile-nav__panel', nav);
    panel.setAttribute('data-lenis-prevent', '');
    var isOpen = false, closeTimer;
    function focusables() { return qsa('a[href], button:not([disabled])', panel); }
    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key !== 'Tab') return;
      var f = focusables(); if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    function open() {
      if (isOpen) return; isOpen = true;
      clearTimeout(closeTimer);
      nav.hidden = false;
      requestAnimationFrame(function () { requestAnimationFrame(function () { nav.classList.add('is-open'); }); });
      toggle.setAttribute('aria-expanded', 'true');
      document.body.classList.add('menu-open');
      document.body.style.overflow = 'hidden';
      if (lenis) lenis.stop();
      document.addEventListener('keydown', onKey);
      setTimeout(function () { closeBtn.focus(); }, 60);
    }
    function close(noFocus) {
      if (!isOpen) return; isOpen = false;
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('menu-open');
      document.body.style.overflow = '';
      if (lenis) lenis.start();
      document.removeEventListener('keydown', onKey);
      closeTimer = setTimeout(function () { nav.hidden = true; }, reduced() ? 0 : 400);
      if (!noFocus) toggle.focus();
    }
    toggle.addEventListener('click', open);
    closeBtn.addEventListener('click', function () { close(); });
    nav.addEventListener('click', function (e) {
      if (e.target === nav) close();
      else if (e.target.closest('a')) close(true);
    });
    window.addEventListener('resize', function () { if (isOpen && window.innerWidth >= 1100) close(true); });
  })();

  /* ------------------------------------------------------------------
     Reveal, Wisch-Bilder, Zähler
     ------------------------------------------------------------------ */
  (function initReveal() {
    qsa('[data-reveal-group]').forEach(function (g) {
      qsa('[data-reveal]', g).forEach(function (n, i) { n.style.setProperty('--d', Math.min(i, 8) * 70 + 'ms'); });
    });
    var items = qsa('[data-reveal], .wipe');
    if (!hasIO || reduced()) { items.forEach(function (n) { n.classList.add('is-in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    items.forEach(function (n) { io.observe(n); });
  })();

  (function initCounters() {
    var nums = qsa('[data-count]');
    if (!nums.length || reduced() || !hasIO) return;
    nums.forEach(function (n) {
      var d = +(n.getAttribute('data-decimals') || 0);
      n.textContent = fmt(0, d);
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        var n = e.target, to = parseFloat(n.getAttribute('data-count')), d = +(n.getAttribute('data-decimals') || 0);
        var t0 = performance.now(), dur = 1500;
        (function step(now) {
          var t = clamp((now - t0) / dur, 0, 1);
          n.textContent = fmt(to * easeOutCubic(t), d);
          if (t < 1) requestAnimationFrame(step);
        })(t0);
      });
    }, { threshold: 0.5 });
    nums.forEach(function (n) { io.observe(n); });
  })();

  /* ------------------------------------------------------------------
     SIGNATURE 1 · Wisch-Reveal im Hero
     ------------------------------------------------------------------ */
  (function initPane() {
    var frame = qs('[data-pane-frame]');
    if (!frame) return;
    var hero = frame.closest('.hero');
    var img = qs('.pane__img', frame), fog = qs('[data-fog]', frame), fx = qs('[data-fx]', frame);
    var ring = qs('[data-cursor]', frame), sq = qs('[data-squeegee]', frame), hint = qs('[data-hint]', frame);
    var meter = qs('[data-meter]'), status = qs('[data-status]'), live = qs('[data-live]');
    var btnAuto = qs('[data-autowipe]'), btnRefog = qs('[data-refog]');
    if (!fog || !fog.getContext) return;
    var fctx = fog.getContext('2d'), xctx = fx.getContext('2d');
    var glint = el('span', 'pane__glint'); glint.setAttribute('aria-hidden', 'true'); frame.appendChild(glint);

    var DONE_TEXT = status ? status.textContent : '';
    var DONE_AT = 0.6;            // Anteil freier Fläche, ab dem automatisch fertig gewischt wird
    var GX = 36, GY = 30;
    var cells = new Uint8Array(GX * GY), cleaned = 0;
    var W = 0, H = 0, dpr = 1, brush = 40, cw = 1, ch = 1;
    var state = 'fog', touched = false, visible = true;
    var stamp = document.createElement('canvas'), tmp = document.createElement('canvas');
    var supportsFilter = typeof fctx.filter === 'string';
    var TAU = Math.PI * 2;

    if (finePointer) frame.classList.add('can-hover');
    if (hint && !finePointer) {
      var tn = hint.lastChild; if (tn && tn.nodeType === 3) tn.textContent = 'Quer über die Scheibe wischen';
    } else if (hint) {
      var tn2 = hint.lastChild; if (tn2 && tn2.nodeType === 3) tn2.textContent = 'Mit der Maus über die Scheibe wischen';
    }

    function prng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

    function size() {
      W = Math.max(1, frame.clientWidth); H = Math.max(1, frame.clientHeight);
      dpr = Math.min(2, window.devicePixelRatio || 1);
      [fog, fx].forEach(function (c) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); });
      fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      xctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      brush = clamp(W * 0.075, 26, 54);
      cw = W / GX; ch = H / GY;
      frame.style.setProperty('--brush', Math.round(brush * 2) + 'px');
      var S = Math.round(brush * 1.7);
      sq.style.width = S + 'px'; sq.style.height = S + 'px';
      sq.style.marginLeft = -S / 2 + 'px'; sq.style.marginTop = -S * 14 / 64 + 'px';
      sq.style.transformOrigin = (S / 2) + 'px ' + (S * 14 / 64) + 'px';
      var s = Math.ceil(brush * 2 * dpr);
      stamp.width = stamp.height = s;
      var c = stamp.getContext('2d');
      var g = c.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.55, 'rgba(0,0,0,.92)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g; c.fillRect(0, 0, s, s);
    }

    function coverRect() {
      var iw = img.naturalWidth || 960, ih = img.naturalHeight || 636;
      var s = Math.max(W / iw, H / ih), dw = iw * s, dh = ih * s;
      return { x: (W - dw) * 0.6, y: (H - dh) * 0.5, w: dw, h: dh };
    }

    function drop(x, y, r) {
      fctx.fillStyle = 'rgba(11,37,69,.10)';
      fctx.beginPath(); fctx.arc(x + r * 0.18, y + r * 0.28, r, 0, TAU); fctx.fill();
      var g = fctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
      g.addColorStop(0, 'rgba(255,255,255,.12)'); g.addColorStop(0.72, 'rgba(255,255,255,.32)'); g.addColorStop(1, 'rgba(255,255,255,.9)');
      fctx.fillStyle = g;
      fctx.beginPath(); fctx.arc(x, y, r, 0, TAU); fctx.fill();
      fctx.fillStyle = 'rgba(255,255,255,.95)';
      fctx.beginPath(); fctx.arc(x - r * 0.35, y - r * 0.38, Math.max(0.6, r * 0.26), 0, TAU); fctx.fill();
    }

    function paintFog() {
      var i, x, y, r;
      fctx.save();
      fctx.globalCompositeOperation = 'source-over';
      fctx.globalAlpha = 1;
      fctx.clearRect(0, 0, W, H);
      var rc = coverRect();
      if (img.complete && img.naturalWidth) {
        if (supportsFilter) {
          fctx.filter = 'blur(' + Math.round(clamp(W / 42, 8, 18)) + 'px) saturate(.75) brightness(1.06)';
          fctx.drawImage(img, rc.x - 24, rc.y - 24, rc.w + 48, rc.h + 48);
          fctx.filter = 'none';
        } else {
          var sw = Math.max(12, Math.round(W / 18)), sh = Math.max(10, Math.round(H / 18));
          tmp.width = sw; tmp.height = sh;
          var tc = tmp.getContext('2d');
          tc.drawImage(img, rc.x / W * sw, rc.y / H * sh, rc.w / W * sw, rc.h / H * sh);
          fctx.imageSmoothingEnabled = true; fctx.imageSmoothingQuality = 'high';
          fctx.drawImage(tmp, 0, 0, W, H);
        }
      }
      var g = fctx.createLinearGradient(0, 0, W * 0.3, H);
      g.addColorStop(0, 'rgba(242,247,250,.62)');
      g.addColorStop(0.55, 'rgba(236,243,247,.7)');
      g.addColorStop(1, 'rgba(228,238,244,.82)');
      fctx.fillStyle = g; fctx.fillRect(0, 0, W, H);

      var rnd = prng(11);
      // feiner Beschlag aus Mikrotröpfchen
      var n = Math.round(W * H / 150);
      fctx.fillStyle = '#ffffff';
      for (i = 0; i < n; i++) {
        x = rnd() * W; y = rnd() * H; r = 0.35 + rnd() * 1.15;
        fctx.globalAlpha = 0.2 + rnd() * 0.5;
        fctx.beginPath(); fctx.arc(x, y, r, 0, TAU); fctx.fill();
      }
      fctx.globalAlpha = 1;
      // größere Tropfen, unten dichter
      var m = Math.round(W * H / 5200);
      for (i = 0; i < m; i++) {
        x = rnd() * W; y = Math.pow(rnd(), 0.7) * H; r = 1.6 + rnd() * rnd() * 5.5;
        drop(x, y, r);
      }
      // Laufspuren: Tropfen, die nach unten gelaufen sind
      var trails = Math.round(W / 70);
      for (i = 0; i < trails; i++) {
        x = rnd() * W; var y0 = rnd() * H * 0.6, len = H * (0.15 + rnd() * 0.35), w = 2.5 + rnd() * 3;
        fctx.globalCompositeOperation = 'destination-out';
        fctx.globalAlpha = 0.5;
        fctx.lineWidth = w; fctx.lineCap = 'round';
        fctx.beginPath(); fctx.moveTo(x, y0);
        var steps = 8;
        for (var k = 1; k <= steps; k++) fctx.lineTo(x + Math.sin(k * 1.7 + i) * 1.6, y0 + len * k / steps);
        fctx.stroke();
        fctx.globalCompositeOperation = 'source-over';
        fctx.globalAlpha = 1;
        drop(x + Math.sin(steps * 1.7 + i) * 1.6, y0 + len + w * 0.6, w * 0.95);
      }
      fctx.restore();
      // bereits frei gewischte Zellen wiederherstellen (z. B. nach Größenänderung)
      if (cleaned) {
        fctx.save(); fctx.globalCompositeOperation = 'destination-out';
        var cr = Math.max(cw, ch) * 1.1;
        for (var gy = 0; gy < GY; gy++) for (var gx = 0; gx < GX; gx++) {
          if (cells[gy * GX + gx]) fctx.drawImage(stamp, (gx + 0.5) * cw - cr, (gy + 0.5) * ch - cr, cr * 2, cr * 2);
        }
        fctx.restore();
      }
    }

    function stampAt(x, y) {
      fctx.drawImage(stamp, x - brush, y - brush, brush * 2, brush * 2);
      var rr = brush * 0.72;
      var x0 = clamp(Math.floor((x - rr) / cw), 0, GX - 1), x1 = clamp(Math.floor((x + rr) / cw), 0, GX - 1);
      var y0 = clamp(Math.floor((y - rr) / ch), 0, GY - 1), y1 = clamp(Math.floor((y + rr) / ch), 0, GY - 1);
      for (var gy = y0; gy <= y1; gy++) for (var gx = x0; gx <= x1; gx++) {
        var idx = gy * GX + gx;
        if (cells[idx]) continue;
        var dx = (gx + 0.5) * cw - x, dy = (gy + 0.5) * ch - y;
        if (dx * dx + dy * dy <= rr * rr) { cells[idx] = 1; cleaned++; }
      }
    }

    var lastWipe = null, travel = 0;
    function wipeTo(x, y) {
      fctx.save();
      fctx.globalCompositeOperation = 'destination-out';
      if (!lastWipe) stampAt(x, y);
      else {
        var dx = x - lastWipe.x, dy = y - lastWipe.y, dist = Math.sqrt(dx * dx + dy * dy);
        var step = Math.max(2, brush * 0.22), n = Math.ceil(dist / step);
        for (var i = 1; i <= n; i++) stampAt(lastWipe.x + dx * i / n, lastWipe.y + dy * i / n);
        travel += dist;
        if (travel > 46 && !reduced()) { travel = 0; spawn(x + (Math.random() - 0.5) * brush, y + (Math.random() - 0.5) * brush, 1); }
      }
      fctx.restore();
      lastWipe = { x: x, y: y };
      if (!touched) { touched = true; frame.classList.add('is-touched'); }
      progress();
    }

    function progress() {
      var p = cleaned / (GX * GY), q = clamp(p / DONE_AT, 0, 1);
      if (meter) meter.style.transform = 'scaleX(' + q.toFixed(3) + ')';
      if (state === 'fog' && status) status.textContent = q > 0 ? Math.round(q * 100) + ' % freigewischt' : 'Beschlagen. Wischen Sie die Scheibe frei.';
      if (p >= DONE_AT && state === 'fog') finish();
    }

    /* Funkeln */
    var parts = [];
    var COLORS = ['#ffffff', '#19C3D1', '#B9B3FF', '#ffffff'];
    function spawn(x, y, n) {
      for (var i = 0; i < n; i++) parts.push({ x: x, y: y, vx: (Math.random() - 0.5) * 0.04, vy: -0.02 - Math.random() * 0.03, life: 0, max: 600 + Math.random() * 500, s: 4 + Math.random() * 7, rot: Math.random() * 3, c: COLORS[(Math.random() * COLORS.length) | 0] });
      schedule();
    }
    function star(x, y, s, rot) {
      xctx.save(); xctx.translate(x, y); xctx.rotate(rot);
      xctx.beginPath(); xctx.moveTo(0, -s);
      xctx.quadraticCurveTo(0, 0, s, 0); xctx.quadraticCurveTo(0, 0, 0, s);
      xctx.quadraticCurveTo(0, 0, -s, 0); xctx.quadraticCurveTo(0, 0, 0, -s);
      xctx.fill(); xctx.restore();
    }
    function drawParts(dt) {
      xctx.clearRect(0, 0, W, H);
      for (var i = parts.length - 1; i >= 0; i--) {
        var p = parts[i]; p.life += dt;
        if (p.life >= p.max) { parts.splice(i, 1); continue; }
        var t = p.life / p.max;
        p.x += p.vx * dt; p.y += p.vy * dt;
        xctx.globalAlpha = Math.sin(Math.PI * t);
        xctx.fillStyle = p.c;
        star(p.x, p.y, p.s * (0.4 + 0.6 * Math.sin(Math.PI * t)), p.rot + t * 1.2);
      }
      xctx.globalAlpha = 1;
    }

    /* Eingabe */
    var pointer = { x: 0, y: 0, inside: false, down: false, type: 'mouse' };
    var pos = { x: W / 2, y: H / 2, a: 0 };
    var auto = null;
    function local(e) { var r = frame.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    function isActive() { return !!auto || pointer.down || (pointer.type === 'mouse' && pointer.inside); }

    frame.addEventListener('pointermove', function (e) {
      var p = local(e); pointer.x = p.x; pointer.y = p.y; pointer.type = e.pointerType;
      if (e.pointerType === 'mouse') {
        if (!pointer.inside) { pointer.inside = true; pos.x = p.x; pos.y = p.y; lastWipe = null; }
      }
      if (isActive()) { frame.classList.add('is-active'); schedule(); }
    });
    frame.addEventListener('pointerleave', function (e) {
      if (e.pointerType === 'mouse') { pointer.inside = false; lastWipe = null; frame.classList.remove('is-active'); }
    });
    frame.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse') return;
      var p = local(e);
      pointer.x = pos.x = p.x; pointer.y = pos.y = p.y; pointer.type = e.pointerType;
      pointer.down = true; lastWipe = null;
      frame.classList.add('is-active');
      schedule();
    });
    function up(e) {
      if (e.pointerType === 'mouse') return;
      pointer.down = false; lastWipe = null;
      if (!auto) frame.classList.remove('is-active');
    }
    frame.addEventListener('pointerup', up);
    frame.addEventListener('pointercancel', up);

    /* Automatisch wischen: Profi-Technik in Schlangenlinien */
    function buildPath() {
      var rows = Math.max(3, Math.ceil((H - brush) / (brush * 1.35)) + 1);
      var top = brush * 0.55, bottom = H - brush * 0.55, l = -brush * 0.4, r = W + brush * 0.4;
      var pts = [];
      for (var i = 0; i < rows; i++) {
        var y = top + (bottom - top) * i / (rows - 1);
        if (i % 2 === 0) { pts.push([l, y], [r, y]); } else { pts.push([r, y], [l, y]); }
      }
      var segs = [], total = 0;
      for (var k = 1; k < pts.length; k++) {
        var d = Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]);
        segs.push({ a: pts[k - 1], b: pts[k], d: d, s: total }); total += d;
      }
      return { segs: segs, total: total };
    }
    function pointAt(path, dist) {
      for (var i = 0; i < path.segs.length; i++) {
        var s = path.segs[i];
        if (dist <= s.s + s.d || i === path.segs.length - 1) {
          var t = s.d ? clamp((dist - s.s) / s.d, 0, 1) : 1;
          return { x: s.a[0] + (s.b[0] - s.a[0]) * t, y: s.a[1] + (s.b[1] - s.a[1]) * t };
        }
      }
      return { x: 0, y: 0 };
    }
    function startAuto() {
      if (state !== 'fog') return;
      if (reduced()) { finish(); return; }
      var path = buildPath();
      auto = { path: path, t0: performance.now(), dur: clamp(path.total / 1.9, 1700, 3000) };
      var p0 = pointAt(path, 0); pos.x = p0.x; pos.y = p0.y; lastWipe = null;
      frame.classList.add('is-active');
      if (btnAuto) btnAuto.disabled = true;
      schedule();
    }

    var raf = 0, lastT = 0;
    function schedule() { if (!raf && visible && !document.hidden) { lastT = performance.now(); raf = requestAnimationFrame(tick); } }
    function tick(now) {
      raf = 0;
      var dt = Math.min(48, now - lastT || 16); lastT = now;
      var target = pointer, lerpK;
      if (auto) {
        var t = clamp((now - auto.t0) / auto.dur, 0, 1);
        target = pointAt(auto.path, auto.path.total * easeInOut(t));
        lerpK = 1;
        if (t >= 1) { auto = null; if (btnAuto) btnAuto.disabled = false; if (state === 'fog') finish(); if (!pointer.down && !pointer.inside) frame.classList.remove('is-active'); }
      } else {
        lerpK = pointer.type === 'mouse' ? 0.3 : 0.55;
      }
      if (isActive() || target !== pointer) {
        var k = 1 - Math.pow(1 - lerpK, dt / 16.67);
        var px = pos.x;
        pos.x += (target.x - pos.x) * k; pos.y += (target.y - pos.y) * k;
        var vx = (pos.x - px) / Math.max(1, dt);
        pos.a += (clamp(vx * 22, -24, 24) - pos.a) * 0.18;
        if (state === 'fog') wipeTo(pos.x, pos.y);
        var tr = 'translate3d(' + pos.x.toFixed(1) + 'px,' + pos.y.toFixed(1) + 'px,0)';
        sq.style.transform = tr + ' rotate(' + pos.a.toFixed(2) + 'deg)';
        ring.style.transform = tr;
      }
      if (parts.length) drawParts(dt); else if (xctx) xctx.clearRect(0, 0, W, H);
      var moving = Math.abs(target.x - pos.x) + Math.abs(target.y - pos.y) > 0.5;
      if (auto || (isActive() && moving) || parts.length) schedule();
    }

    function finish() {
      if (state === 'clear') return;
      state = 'clear';
      frame.classList.add('is-clear');
      if (meter) meter.style.transform = 'scaleX(1)';
      if (status) status.textContent = DONE_TEXT;
      if (live) live.textContent = 'Die Scheibe ist freigewischt.';
      setTimeout(function () { frame.classList.add('is-done'); }, reduced() ? 0 : 260);
      if (!reduced()) {
        for (var i = 0; i < 26; i++) spawn(Math.random() * W, Math.random() * H, 1);
      }
      var hadFocus = document.activeElement === btnAuto;
      if (btnAuto) btnAuto.hidden = true;
      if (btnRefog) { btnRefog.hidden = false; if (hadFocus) btnRefog.focus(); }
    }
    function refog() {
      state = 'fog'; cells.fill(0); cleaned = 0; touched = false; lastWipe = null;
      frame.classList.remove('is-done', 'is-touched');
      paintFog();
      frame.classList.remove('is-clear');
      progress();
      if (live) live.textContent = 'Die Scheibe ist wieder beschlagen.';
      var hadFocus = document.activeElement === btnRefog;
      if (btnRefog) btnRefog.hidden = true;
      if (btnAuto) { btnAuto.hidden = false; btnAuto.disabled = false; if (hadFocus) btnAuto.focus(); }
    }
    if (btnAuto) btnAuto.addEventListener('click', startAuto);
    if (btnRefog) btnRefog.addEventListener('click', refog);

    function ready() {
      size(); paintFog(); progress();
      frame.classList.add('is-ready');
    }
    if (img.complete && img.naturalWidth) ready();
    else {
      img.addEventListener('load', ready, { once: true });
      img.addEventListener('error', ready, { once: true });
    }

    if ('ResizeObserver' in window) {
      var lastW = 0, lastH = 0;
      new ResizeObserver(function (entries) {
        var r = entries[0].contentRect;
        if (Math.abs(r.width - lastW) < 2 && Math.abs(r.height - lastH) < 2) return;
        lastW = r.width; lastH = r.height;
        if (!frame.classList.contains('is-ready')) return;
        size();
        if (state === 'fog') paintFog(); else fctx.clearRect(0, 0, W, H);
      }).observe(frame);
    }
    if (hasIO) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (hero) hero.classList.toggle('is-paused', !visible);
        if (visible) schedule();
      }).observe(frame);
    }
    document.addEventListener('visibilitychange', function () { if (!document.hidden) schedule(); });
  })();

  /* ------------------------------------------------------------------
     Leistungen: horizontale Strecke (Desktop) – sonst natives Raster
     ------------------------------------------------------------------ */
  var services = { st: null, shift: 0 };
  (function initServices() {
    var section = qs('[data-services]');
    if (!section || !enhanced) return;
    var pin = qs('[data-services-pin]', section), track = qs('[data-services-track]', section), bar = qs('[data-svc-progress]', section);
    var mm = gsap.matchMedia();
    mm.add('(min-width: 900px) and (min-height: 600px)', function () {
      section.classList.add('services--h');
      var viewport = qs('.services__viewport', section);
      var getShift = function () { return Math.max(0, track.scrollWidth - viewport.clientWidth); };
      var tween = gsap.to(track, {
        x: function () { return -getShift(); },
        ease: 'none',
        scrollTrigger: {
          trigger: pin, start: 'top top', end: function () { return '+=' + getShift(); },
          pin: true, scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1,
          onUpdate: function (self) { if (bar) bar.style.transform = 'scaleX(' + self.progress.toFixed(3) + ')'; },
          onRefresh: function (self) { services.shift = getShift(); services.st = self; }
        }
      });
      services.st = tween.scrollTrigger; services.shift = getShift(); services.track = track;
      return function () {
        section.classList.remove('services--h');
        services.st = null;
        gsap.set(track, { clearProps: 'transform' });
      };
    });
  })();

  /* ------------------------------------------------------------------
     Anker-Navigation (Lenis-kompatibel, inkl. Karten in der Strecke)
     ------------------------------------------------------------------ */
  var tabsApi = null;
  function targetY(t) {
    if (services.st && services.track && services.track.contains(t)) {
      var card = t.closest('.svc') || t;
      var first = services.track.firstElementChild;
      var x = card.offsetLeft - (first ? first.offsetLeft : 0);
      var ratio = services.shift ? clamp(x / services.shift, 0, 1) : 0;
      return services.st.start + ratio * (services.st.end - services.st.start) + 2;
    }
    return t.getBoundingClientRect().top + (window.scrollY || window.pageYOffset) - headerH() - 12;
  }
  function scrollToEl(t, after) {
    var y = Math.max(0, targetY(t));
    if (lenis) lenis.scrollTo(y, { duration: 1.2, onComplete: after });
    else {
      window.scrollTo({ top: y, behavior: reduced() ? 'auto' : 'smooth' });
      if (after) setTimeout(after, reduced() ? 0 : 700);
    }
  }
  function focusTarget(t) {
    if (!t) return;
    if (!t.matches('a, button, input, select, textarea, [tabindex]')) t.setAttribute('tabindex', '-1');
    try { t.focus({ preventScroll: true }); } catch (e) { t.focus(); }
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented) return;
    var id = a.getAttribute('href').slice(1);
    var t = id && document.getElementById(id);
    if (!t) return;
    e.preventDefault();
    var tab = a.getAttribute('data-open-tab');
    if (tab && tabsApi) tabsApi.activate(tab);
    scrollToEl(t, function () { if (a.classList.contains('skip-link') || id === 'main') focusTarget(t); });
    if (!a.classList.contains('skip-link')) focusTarget(t);
    if (history.replaceState) history.replaceState(null, '', '#' + id);
  });

  /* ------------------------------------------------------------------
     SIGNATURE 2 · Angebotsrechner
     ------------------------------------------------------------------ */
  var calcApi = null;
  (function initCalc() {
    var form = qs('[data-calc]');
    if (!form) return;
    var range = qs('[data-area-range]', form), num = qs('[data-area-num]', form);
    var intervalGroup = qs('[data-interval-group]', form), onceHint = qs('[data-once-hint]', form);
    var R = {
      receipt: qs('[data-receipt]', form), label: qs('[data-r-label]', form), low: qs('[data-r-low]', form), high: qs('[data-r-high]', form),
      live: qs('[data-r-live]', form), week: qsa('[data-week] span', form), weekWrap: qs('[data-week]', form), once: qs('[data-r-once]', form),
      visits: qs('[data-r-visits]', form), hours: qs('[data-r-hours]', form), team: qs('[data-r-team]', form), scope: qs('[data-r-scope]', form)
    };
    var MIN = +range.min, MAX = +range.max;
    var shown = { low: parseInt(R.low.textContent.replace(/\D/g, ''), 10) || 0, high: parseInt(R.high.textContent.replace(/\D/g, ''), 10) || 0 };
    var liveTimer, anim;

    function read() {
      var typ = (qs('input[name="typ"]:checked', form) || {}).value || 'buero';
      var iv = (qs('input[name="intervall"]:checked', form) || {}).value || '2';
      var extras = qsa('input[name="extra"]:checked:not(:disabled)', form).map(function (i) { return i.value; });
      var area = clamp(Math.round((+range.value || 400) / 10) * 10, MIN, MAX);
      return { typ: typ, interval: iv, extras: extras, area: area };
    }
    function roundDown(v) { return Math.floor(v / CALC.ROUND) * CALC.ROUND; }
    function roundUp(v) { return Math.ceil(v / CALC.ROUND) * CALC.ROUND; }
    function compute(s) {
      var T = CALC.TYPES[s.typ], res = { once: !!T.once, scope: T.scope.slice(), extras: [] };
      var low, high;
      if (T.once) {
        var hoursTotal = s.area / T.perHour;
        var team = clamp(Math.ceil(hoursTotal / CALC.BAU_PERSON_HOURS), 2, 8);
        res.days = Math.max(1, Math.ceil(hoursTotal / (team * CALC.BAU_HOURS_PER_DAY)));
        res.hours = hoursTotal; res.team = team;
        low = hoursTotal * CALC.RATE[0]; high = hoursTotal * CALC.RATE[1];
        var fL = 0, fH = 0;
        s.extras.forEach(function (x) { var E = CALC.EXTRAS[x]; if (E && E.factor) { fL += E.factor[0]; fH += E.factor[1]; res.extras.push(E.label); } });
        low *= 1 + fL; high *= 1 + fH;
      } else {
        var perWeek = parseFloat(s.interval);
        var visits = perWeek * CALC.WEEKS_PER_MONTH;
        var hours = Math.max(CALC.MIN_HOURS_PER_VISIT, s.area / T.perHour);
        res.visits = visits; res.hours = hours; res.team = Math.max(1, Math.ceil(hours / CALC.HOURS_PER_PERSON));
        low = visits * hours * CALC.RATE[0]; high = visits * hours * CALC.RATE[1];
        s.extras.forEach(function (x) {
          var E = CALC.EXTRAS[x]; if (!E || E.factor) return;
          if (E.perM2) { low += s.area * E.perM2[0]; high += s.area * E.perM2[1]; }
          if (E.flat) { low += E.flat[0]; high += E.flat[1]; }
          res.extras.push(E.label);
        });
        low = Math.max(CALC.MIN_MONTH, low); high = Math.max(CALC.MIN_MONTH + CALC.ROUND * 2, high);
        if (s.typ === 'buero' && perWeek >= 2) res.scope.push('Wöchentlich: Heizkörper, Fensterbänke, Sockelleisten');
      }
      res.low = roundDown(low); res.high = Math.max(res.low + CALC.ROUND, roundUp(high));
      return res;
    }
    function summary(s, r) {
      var parts = [CALC.TYPES[s.typ].name, fmt(s.area) + ' m²', r.once ? 'einmalig' : CALC.INTERVALS[s.interval]];
      if (r.extras.length) parts.push(r.extras.join(', '));
      parts.push('Richtwert ' + fmt(r.low) + '–' + fmt(r.high) + ' €' + (r.once ? ' einmalig' : ' / Monat') + ' netto');
      return parts.join(' · ');
    }
    function setPrice(lo, hi) { R.low.textContent = fmt(lo); R.high.textContent = fmt(hi); }
    function tweenPrice(lo, hi, instant) {
      cancelAnimationFrame(anim);
      if (instant || reduced()) { shown.low = lo; shown.high = hi; setPrice(lo, hi); return; }
      var a = { low: shown.low, high: shown.high }, t0 = performance.now(), dur = 420;
      (function step(now) {
        var t = clamp((now - t0) / dur, 0, 1), e = easeOutCubic(t);
        shown.low = Math.round(a.low + (lo - a.low) * e); shown.high = Math.round(a.high + (hi - a.high) * e);
        setPrice(shown.low, shown.high);
        if (t < 1) anim = requestAnimationFrame(step);
      })(t0);
    }
    function render(silent) {
      // Einmalig vs. wiederkehrend – zuerst Felder umschalten, dann rechnen
      var typNow = (qs('input[name="typ"]:checked', form) || {}).value || 'buero';
      var once = !!CALC.TYPES[typNow].once;
      qsa('input[name="intervall"]', form).forEach(function (i) { i.disabled = once; });
      intervalGroup.classList.toggle('is-disabled', once);
      onceHint.hidden = !once;
      qsa('.extras .check', form).forEach(function (c) {
        var scope = c.getAttribute('data-scope'), on = once ? scope === 'once' : scope === 'recurring';
        c.hidden = !on; qs('input', c).disabled = !on;
      });
      var s = read(), r = compute(s), T = CALC.TYPES[s.typ];
      R.label.textContent = r.once ? 'Richtwert einmalig (netto)' : 'Richtwert pro Monat (netto)';
      R.weekWrap.hidden = r.once; R.once.hidden = !r.once;
      var dts = qsa('.receipt__facts dt', form);
      if (r.once) {
        R.once.textContent = 'Einmaliger Einsatz · ' + r.days + (r.days === 1 ? ' Arbeitstag' : ' Arbeitstage') + ' mit ' + r.team + ' Reinigungskräften';
        dts[0].textContent = 'Arbeitstage'; R.visits.textContent = fmt(r.days);
        dts[1].textContent = 'Stunden gesamt'; R.hours.textContent = fmt(r.hours, 0);
      } else {
        dts[0].textContent = 'Einsätze pro Monat'; R.visits.textContent = fmt(r.visits, 1);
        dts[1].textContent = 'Stunden pro Einsatz'; R.hours.textContent = fmt(r.hours, 1);
        var days = CALC.WEEK[s.interval] || [];
        R.week.forEach(function (d, i) {
          var on = days.indexOf(i) > -1;
          d.classList.toggle('is-on', on && s.interval !== '0.5');
          d.classList.toggle('is-half', on && s.interval === '0.5');
        });
      }
      R.team.textContent = r.team + (r.team === 1 ? ' Reinigungskraft' : ' Reinigungskräfte');
      // Leistungsumfang
      R.scope.textContent = '';
      r.scope.forEach(function (t) { R.scope.appendChild(el('li', null, t)); });
      r.extras.forEach(function (t) { R.scope.appendChild(el('li', 'is-extra', t)); });
      // Preis
      tweenPrice(r.low, r.high, silent);
      if (!silent && !reduced()) {
        R.receipt.classList.remove('is-updating'); void R.receipt.offsetWidth; R.receipt.classList.add('is-updating');
      }
      clearTimeout(liveTimer);
      if (!silent) liveTimer = setTimeout(function () {
        R.live.textContent = (r.once ? 'Richtwert einmalig: ' : 'Richtwert pro Monat: ') + fmt(r.low) + ' bis ' + fmt(r.high) + ' Euro netto, ' + T.name + ', ' + fmt(s.area) + ' Quadratmeter.';
      }, 650);
      return { s: s, r: r };
    }
    function syncRangeFill() {
      var p = (+range.value - MIN) / (MAX - MIN) * 100;
      range.style.setProperty('--p', p.toFixed(2) + '%');
      range.setAttribute('aria-valuetext', fmt(+range.value) + ' Quadratmeter');
    }
    range.addEventListener('input', function () { num.value = range.value; syncRangeFill(); render(); });
    num.addEventListener('input', function () {
      var v = parseInt(num.value, 10);
      if (!isNaN(v) && v >= MIN && v <= MAX) { range.value = v; syncRangeFill(); render(); }
    });
    num.addEventListener('change', function () {
      var v = parseInt(num.value, 10); if (isNaN(v)) v = 400;
      v = clamp(Math.round(v / 10) * 10, MIN, MAX);
      num.value = v; range.value = v; syncRangeFill(); render();
    });
    form.addEventListener('change', function (e) { if (e.target !== num && e.target !== range) render(); });
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    syncRangeFill();
    render(true);

    calcApi = {
      current: function () { var s = read(); var r = compute(s); return { s: s, r: r, text: summary(s, r) }; }
    };
  })();

  /* ------------------------------------------------------------------
     SIGNATURE 3 · Checklisten: Tabs + Akkordeon mit Häkchen
     ------------------------------------------------------------------ */
  (function initTabs() {
    var root = qs('[data-tabs]'); if (!root) return;
    var list = qs('[role="tablist"]', root), tabs = qsa('[role="tab"]', root), panels = qsa('[role="tabpanel"]', root), ink = qs('[data-tab-ink]', root);
    function moveInk() {
      var t = tabs.filter(function (x) { return x.getAttribute('aria-selected') === 'true'; })[0];
      if (!t || !ink) return;
      ink.style.width = t.offsetWidth + 'px';
      ink.style.transform = 'translateX(' + t.offsetLeft + 'px)';
    }
    function activate(key, focus) {
      tabs.forEach(function (t) {
        var on = t.getAttribute('data-tab') === key;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        if (on && focus) t.focus();
      });
      panels.forEach(function (p) {
        var on = p.getAttribute('data-panel') === key;
        if (on && p.hidden) { p.hidden = false; p.classList.remove('is-entering'); void p.offsetWidth; p.classList.add('is-entering'); }
        else if (!on) p.hidden = true;
      });
      moveInk();
    }
    tabs.forEach(function (t) { t.addEventListener('click', function () { activate(t.getAttribute('data-tab')); }); });
    list.addEventListener('keydown', function (e) {
      var i = tabs.indexOf(document.activeElement); if (i < 0) return;
      var n = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % tabs.length;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') n = 0;
      else if (e.key === 'End') n = tabs.length - 1;
      if (n === null) return;
      e.preventDefault();
      activate(tabs[n].getAttribute('data-tab'), true);
    });
    // Startzustand
    var first = tabs.filter(function (t) { return t.getAttribute('aria-selected') === 'true'; })[0] || tabs[0];
    panels.forEach(function (p) { p.hidden = p.getAttribute('data-panel') !== first.getAttribute('data-tab'); });
    if (ink) { ink.style.transition = 'none'; moveInk(); void ink.offsetWidth; ink.style.transition = ''; }
    window.addEventListener('resize', moveInk);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveInk);

    // „Alle aufklappen“
    panels.forEach(function (p) {
      var btn = qs('[data-toggle-all]', p), ds = qsa('details', p);
      if (!btn) return;
      function label() { var allOpen = ds.every(function (d) { return d.open; }); btn.textContent = allOpen ? 'Alle zuklappen' : 'Alle aufklappen'; btn.setAttribute('aria-pressed', allOpen ? 'true' : 'false'); }
      btn.addEventListener('click', function () { var allOpen = ds.every(function (d) { return d.open; }); ds.forEach(function (d) { d.open = !allOpen; }); label(); });
      ds.forEach(function (d) { d.addEventListener('toggle', label); });
      label();
    });
    tabsApi = { activate: activate };
  })();

  (function initAccordions() {
    qsa('details.cl, details.faq-item').forEach(function (d) {
      var summary = qs('summary', d), body = summary && summary.nextElementSibling;
      if (!body) return;
      var running = null;
      summary.addEventListener('click', function (e) {
        if (reduced() || !body.animate) return;
        e.preventDefault();
        if (running) { running.cancel(); running = null; }
        var ease = 'cubic-bezier(0.23, 1, 0.32, 1)';
        body.classList.add('is-animating');
        if (d.open) {
          var h = body.offsetHeight;
          running = body.animate([{ height: h + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 220, easing: ease });
          running.onfinish = function () { d.open = false; body.classList.remove('is-animating'); running = null; };
        } else {
          d.open = true;
          var h2 = body.offsetHeight;
          running = body.animate([{ height: '0px', opacity: 0 }, { height: h2 + 'px', opacity: 1 }], { duration: 300, easing: ease });
          running.onfinish = function () { body.classList.remove('is-animating'); running = null; };
        }
      });
    });
  })();

  /* ------------------------------------------------------------------
     Ablauf: Linie füllt sich beim Scrollen
     ------------------------------------------------------------------ */
  (function initSteps() {
    var steps = qs('[data-steps]'); if (!steps) return;
    var fill = qs('[data-steps-fill]', steps), cards = qsa('.step-card', steps);
    if (enhanced) {
      gsap.to(fill, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: steps, start: 'top 68%', end: 'bottom 62%', scrub: 0.4 } });
      cards.forEach(function (c) {
        ST.create({ trigger: c, start: 'top 66%', onEnter: function () { c.classList.add('is-lit'); }, onLeaveBack: function () { c.classList.remove('is-lit'); } });
      });
    } else {
      if (fill) fill.style.transform = 'none';
      cards.forEach(function (c) { c.classList.add('is-lit'); });
    }
  })();

  /* ------------------------------------------------------------------
     SIGNATURE 4 · Einsatzgebiet per PLZ + SVG-Karte
     ------------------------------------------------------------------ */
  function project(lat, lon) { return { x: HQ.x + (lon - HQ.lon) * PX_PER_LON, y: HQ.y + (HQ.lat - lat) * PX_PER_LAT }; }
  function townPos(key) {
    var g = qs('[data-town="' + key + '"]'); if (!g) return null;
    var m = /translate\(([-\d.]+)[ ,]+([-\d.]+)\)/.exec(g.getAttribute('transform') || '');
    return m ? { x: +m[1], y: +m[2] } : null;
  }
  function lookup(plz) {
    if (!/^\d{5}$/.test(plz)) return { kind: 'invalid' };
    var p = PLACES[plz];
    if (!p) {
      if (/^(67|68|69)/.test(plz)) return { kind: 'maybe', plz: plz };
      return { kind: 'no', plz: plz };
    }
    var pos = (p[4] && townPos(p[3])) || project(p[1], p[2]);
    var km = Math.hypot(pos.x - HQ.x, pos.y - HQ.y) / PX_PER_KM;
    var zone = null;
    for (var i = 0; i < ZONES.length; i++) if (km <= ZONES[i].max) { zone = ZONES[i]; break; }
    return { kind: zone ? 'yes' : 'no', plz: plz, name: p[0], town: p[3] || null, x: pos.x, y: pos.y, km: km, zone: zone };
  }

  (function initPlz() {
    var form = qs('[data-plz]'); if (!form) return;
    var input = qs('[data-plz-input]', form), out = qs('[data-plz-result]', form);
    var zonesEl = qs('[data-map-zones]'), route = qs('[data-map-route]'), pin = qs('[data-map-pin]'), pinLabel = qs('[data-map-pin-label]');
    var rings = { 1: qs('.ring--1'), 2: qs('.ring--2'), 3: qs('.ring--3') };
    var zoneItems = { 1: qs('.zone--1'), 2: qs('.zone--2'), 3: qs('.zone--3') };
    var pinPos = null, pinAnim = 0, lastPlz = '';

    function setPin(x, y) {
      pin.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')');
      route.setAttribute('x2', x.toFixed(1)); route.setAttribute('y2', y.toFixed(1));
    }
    function movePin(x, y) {
      cancelAnimationFrame(pinAnim);
      if (!pinPos || reduced()) { pinPos = { x: x, y: y }; setPin(x, y); return; }
      var a = { x: pinPos.x, y: pinPos.y }, t0 = performance.now(), dur = 650;
      (function step(now) {
        var t = clamp((now - t0) / dur, 0, 1), e = easeInOut(t);
        pinPos = { x: a.x + (x - a.x) * e, y: a.y + (y - a.y) * e - Math.sin(Math.PI * t) * 18 };
        setPin(pinPos.x, pinPos.y);
        if (t < 1) pinAnim = requestAnimationFrame(step); else pinPos = { x: x, y: y };
      })(t0);
    }
    function clearMap() {
      pin.classList.remove('is-on'); route.classList.remove('is-on');
      zonesEl.classList.remove('has-active');
      qsa('.ring').forEach(function (r) { r.classList.remove('is-active'); });
      qsa('.town').forEach(function (t) { t.classList.remove('is-hit'); });
      Object.keys(zoneItems).forEach(function (k) { if (zoneItems[k]) zoneItems[k].classList.remove('is-active'); });
    }
    function render(res) {
      out.textContent = '';
      out.className = 'plz__result';
      clearMap();
      if (res.kind === 'invalid') {
        out.classList.add('is-error');
        out.appendChild(el('strong', null, 'Bitte eine fünfstellige Postleitzahl eingeben.'));
        out.appendChild(el('p', null, 'Zum Beispiel 68159 für die Mannheimer Innenstadt.'));
      } else if (res.kind === 'yes') {
        out.classList.add('is-yes');
        out.appendChild(el('strong', null, (res.km < 3 ? 'Ja – das ist unsere Nachbarschaft: ' : 'Ja, wir kommen nach ') + res.name + '.'));
        out.appendChild(el('span', 'plz__meta', 'ca. ' + fmt(res.km, 1) + ' km Luftlinie · ' + res.zone.name));
        out.appendChild(el('p', null, res.zone.text));
        var link = el('a', 'text-link', 'Begehung für ' + res.plz + ' anfragen');
        link.href = '#kontakt';
        link.insertAdjacentHTML('beforeend', '<svg aria-hidden="true"><use href="#i-arrow"/></svg>');
        link.addEventListener('click', function () { var f = qs('[data-cf-plz]'); if (f) { f.value = res.plz; f.dispatchEvent(new Event('input', { bubbles: true })); } });
        out.appendChild(link);
        // Karte
        var label = res.name.replace(/^(Mannheim|Ludwigshafen|Heidelberg)-.*/, '$1').replace(' an der Weinstraße', '');
        pinLabel.textContent = res.town ? '' : label;
        pinLabel.setAttribute('text-anchor', res.x < 90 ? 'start' : res.x > 560 ? 'end' : 'middle');
        pinLabel.setAttribute('x', res.x < 90 ? -8 : res.x > 560 ? 8 : 0);
        pinLabel.setAttribute('y', res.y < 60 ? 32 : -18);
        movePin(res.x, res.y);
        pin.classList.add('is-on'); route.classList.add('is-on');
        zonesEl.classList.add('has-active');
        if (rings[res.zone.id]) rings[res.zone.id].classList.add('is-active');
        if (zoneItems[res.zone.id]) zoneItems[res.zone.id].classList.add('is-active');
        if (res.town) { var t = qs('[data-town="' + res.town + '"]'); if (t) t.classList.add('is-hit'); }
      } else if (res.kind === 'maybe') {
        out.classList.add('is-maybe');
        out.appendChild(el('strong', null, res.plz + ': Das klären wir kurz am Telefon.'));
        out.appendChild(el('p', null, 'Diese Postleitzahl steht nicht in unserer Liste, liegt aber vermutlich in der Region. Rufen Sie an: ' + PHONE + ' – oder senden Sie einfach eine Anfrage.'));
      } else {
        out.classList.add('is-no');
        out.appendChild(el('strong', null, res.plz + ' liegt außerhalb unseres Einsatzgebiets.'));
        out.appendChild(el('p', null, 'Wir arbeiten im Umkreis von rund 40 km um Mannheim – nur so bleiben unsere Teams fest und die Wege kurz.'));
      }
      out.classList.add('is-new');
      setTimeout(function () { out.classList.remove('is-new'); }, 400);
    }
    function check(force) {
      var v = input.value.replace(/\D/g, '').slice(0, 5);
      if (input.value !== v) input.value = v;
      if (v.length < 5 && !force) return;
      if (v === lastPlz && !force) return;
      lastPlz = v;
      render(lookup(v));
    }
    input.addEventListener('input', function () { check(false); });
    form.addEventListener('submit', function (e) { e.preventDefault(); lastPlz = ''; check(true); });
    qsa('[data-plz-quick]', form).forEach(function (b) {
      b.addEventListener('click', function () { input.value = b.getAttribute('data-plz-quick'); lastPlz = ''; check(true); });
    });
  })();

  /* ------------------------------------------------------------------
     SIGNATURE 5 · Karriere: Schichtmodelle + Bewerbung in 60 Sekunden
     ------------------------------------------------------------------ */
  var SHIFT_NAMES = { frueh: 'Frühschicht', tag: 'Tagschicht', abend: 'Abendschicht', samstag: 'Samstag' };
  var UMFANG_NAMES = { minijob: 'Minijob', teilzeit: 'Teilzeit', vollzeit: 'Vollzeit' };
  var careerState = { shifts: [], umfang: 'teilzeit' };
  (function initCareer() {
    var switches = qsa('[data-shift]'); if (!switches.length) return;
    var segs = qsa('[data-seg]'), jobs = qsa('.job'), count = qs('[data-jobs-count]'), empty = qs('[data-jobs-empty]'), applyShifts = qs('[data-apply-shifts]');
    var radios = qsa('input[name="umfang"]');
    function update(first) {
      careerState.shifts = switches.filter(function (s) { return s.getAttribute('aria-checked') === 'true'; }).map(function (s) { return s.getAttribute('data-shift'); });
      careerState.umfang = (radios.filter(function (r) { return r.checked; })[0] || {}).value || 'teilzeit';
      var on = careerState.shifts;
      segs.forEach(function (s) { s.classList.toggle('is-on', on.indexOf(s.getAttribute('data-seg')) > -1); });
      var n = 0;
      jobs.forEach(function (j) {
        var sh = j.getAttribute('data-shifts').split(' '), um = j.getAttribute('data-umfang').split(' ');
        var match = on.some(function (x) { return sh.indexOf(x) > -1; }) && um.indexOf(careerState.umfang) > -1;
        var was = j.hidden;
        j.hidden = !match;
        if (match) {
          if (was && !first) { j.classList.remove('is-new'); void j.offsetWidth; j.style.setProperty('--d', n * 45 + 'ms'); j.classList.add('is-new'); }
          n++;
        }
      });
      if (!on.length) count.textContent = 'Wählen Sie mindestens eine Schicht.';
      else count.textContent = n === 0 ? 'Keine exakt passende Stelle' : n === 1 ? '1 passende Stelle' : n + ' passende Stellen';
      if (empty) empty.hidden = !(on.length && n === 0);
      if (applyShifts) applyShifts.textContent = (on.length ? on.map(function (x) { return SHIFT_NAMES[x]; }).join(', ') : 'noch keine Schicht gewählt') + ' · ' + UMFANG_NAMES[careerState.umfang];
      var err = qs('[data-shift-err]'); if (err && on.length) err.textContent = '';
    }
    switches.forEach(function (s) {
      s.addEventListener('click', function () {
        s.setAttribute('aria-checked', s.getAttribute('aria-checked') === 'true' ? 'false' : 'true');
        update();
      });
    });
    radios.forEach(function (r) { r.addEventListener('change', function () { update(); }); });
    update(true);
  })();

  /* Formular-Helfer */
  function errFor(input) {
    var ids = (input.getAttribute('aria-describedby') || '').split(' ');
    for (var i = 0; i < ids.length; i++) { var e = document.getElementById(ids[i]); if (e && e.classList.contains('field__err')) return e; }
    return null;
  }
  function setError(input, msg) {
    var e = errFor(input);
    if (e) e.textContent = msg || '';
    if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
    var f = input.closest('.field, .check'); if (f) f.classList.toggle('is-invalid', !!msg);
    return !msg;
  }
  function addDef(dl, k, v) { if (!v) return; dl.appendChild(el('dt', null, k)); dl.appendChild(el('dd', null, v)); }
  function bindLive(form, validate) {
    qsa('input, select, textarea', form).forEach(function (i) {
      i.addEventListener('blur', function () { if (i.type === 'checkbox') return; if (i.value || i.getAttribute('aria-invalid')) validate(i); });
      i.addEventListener('input', function () { if (i.getAttribute('aria-invalid')) validate(i); });
      i.addEventListener('change', function () { if (i.type === 'checkbox' && i.getAttribute('aria-invalid')) validate(i); });
    });
  }

  (function initApply() {
    var form = qs('[data-apply]'); if (!form) return;
    var success = qs('[data-apply-success]'), ringEl = qs('[data-timer-ring]'), timerText = qs('[data-timer-text]'), timer = qs('.timer', form);
    var C = 2 * Math.PI * 21;
    var started = 0, iv = 0;
    function tickTimer() {
      var elapsed = (Date.now() - started) / 1000, rem = Math.max(0, 60 - elapsed);
      timerText.textContent = Math.ceil(rem);
      ringEl.style.strokeDashoffset = (C * (1 - rem / 60)).toFixed(2);
      timer.classList.toggle('is-over', rem <= 0);
      if (rem <= 0) { clearInterval(iv); iv = 0; }
    }
    function start() { if (started) return; started = Date.now(); iv = setInterval(tickTimer, 250); tickTimer(); }
    function resetTimer() { clearInterval(iv); iv = 0; started = 0; timerText.textContent = '60'; ringEl.style.strokeDashoffset = '0'; timer.classList.remove('is-over'); }
    form.addEventListener('focusin', start);

    var nameI = form.elements.vorname, telI = form.elements.telefon, dsI = form.elements.datenschutz;
    var dsErr = qs('[data-err-ds]', form), shiftErr = qs('[data-shift-err]', form);
    function validate(i) {
      if (i === nameI) return setError(i, i.value.trim().length >= 2 ? '' : 'Bitte geben Sie Ihren Vornamen an.');
      if (i === telI) return setError(i, i.value.replace(/\D/g, '').length >= 6 ? '' : 'Bitte eine Telefonnummer mit mindestens sechs Ziffern angeben.');
      if (i === dsI) { var ok = dsI.checked; dsErr.textContent = ok ? '' : 'Bitte bestätigen Sie die Einwilligung.'; if (ok) dsI.removeAttribute('aria-invalid'); else dsI.setAttribute('aria-invalid', 'true'); dsI.closest('.check').classList.toggle('is-invalid', !ok); return ok; }
      return true;
    }
    bindLive(form, validate);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var okShift = careerState.shifts.length > 0;
      shiftErr.textContent = okShift ? '' : 'Bitte wählen Sie oben mindestens eine Schicht.';
      var checks = [nameI, telI, dsI].map(function (i) { return { i: i, ok: validate(i) }; });
      var bad = checks.filter(function (c) { return !c.ok; })[0];
      if (bad) { bad.i.focus(); return; }
      if (!okShift) { var sw = qs('[data-shift]'); if (sw) sw.focus(); return; }
      var secs = started ? Math.max(1, Math.round((Date.now() - started) / 1000)) : 0;
      clearInterval(iv); iv = 0;
      qs('[data-apply-name]', success).textContent = nameI.value.trim();
      qs('[data-apply-time]', success).textContent = secs && secs <= 60 ? 'Geschafft in ' + secs + (secs === 1 ? ' Sekunde.' : ' Sekunden.') + ' Wir rufen Sie innerhalb von zwei Werktagen zurück.' : 'Etwas über 60 Sekunden – zählt trotzdem. Wir rufen Sie innerhalb von zwei Werktagen zurück.';
      var dl = qs('[data-apply-summary]', success); dl.textContent = '';
      addDef(dl, 'Schichten', careerState.shifts.map(function (x) { return SHIFT_NAMES[x]; }).join(', '));
      addDef(dl, 'Umfang', UMFANG_NAMES[careerState.umfang]);
      addDef(dl, 'Start', form.elements.start.value);
      addDef(dl, 'Rückruf auf', form.elements.sprache.value);
      addDef(dl, 'Telefon', telI.value.trim());
      form.hidden = true; success.hidden = false; success.focus();
    });
    qs('[data-apply-reset]', success).addEventListener('click', function () {
      form.reset(); resetTimer();
      qsa('[aria-invalid]', form).forEach(function (i) { setError(i, ''); });
      dsErr.textContent = '';
      success.hidden = true; form.hidden = false; nameI.focus();
    });
  })();

  /* ------------------------------------------------------------------
     Kontakt / Begehung anfragen (+ Übernahme aus dem Rechner)
     ------------------------------------------------------------------ */
  (function initContact() {
    var form = qs('[data-contact]'); if (!form) return;
    var success = qs('[data-contact-success]'), transfer = qs('[data-transfer]'), transferText = qs('[data-transfer-text]');
    var typI = qs('[data-cf-typ]'), areaI = qs('[data-cf-area]'), intI = qs('[data-cf-int]'), plzI = qs('[data-cf-plz]');
    var nameI = form.elements.name, mailI = form.elements.email, dsI = form.elements.datenschutz, dsErr = qs('[data-err-ds]', form);
    var transferred = '';

    function validate(i) {
      if (i === plzI) return setError(i, /^\d{5}$/.test(i.value.trim()) ? '' : 'Bitte eine fünfstellige Postleitzahl eingeben.');
      if (i === nameI) return setError(i, i.value.trim().length >= 2 ? '' : 'Bitte geben Sie Ihren Namen an.');
      if (i === mailI) return setError(i, /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(i.value.trim()) ? '' : 'Bitte eine gültige E-Mail-Adresse eingeben, z. B. name@firma.de.');
      if (i === dsI) { var ok = dsI.checked; dsErr.textContent = ok ? '' : 'Bitte bestätigen Sie die Datenschutzhinweise.'; if (ok) dsI.removeAttribute('aria-invalid'); else dsI.setAttribute('aria-invalid', 'true'); dsI.closest('.check').classList.toggle('is-invalid', !ok); return ok; }
      return true;
    }
    bindLive(form, validate);
    plzI.addEventListener('input', function () { var v = plzI.value.replace(/\D/g, '').slice(0, 5); if (v !== plzI.value) plzI.value = v; });

    // Übernahme aus dem Rechner
    var transferBtn = qs('[data-calc-transfer]');
    if (transferBtn && calcApi) transferBtn.addEventListener('click', function () {
      var c = calcApi.current();
      typI.value = c.s.typ;
      areaI.value = c.s.area;
      intI.value = c.r.once ? 'once' : c.s.interval;
      transferred = c.text;
      transferText.textContent = c.text;
      transfer.hidden = false;
      if (!form.hidden) {
        scrollToEl(qs('#kontakt'), function () { if (finePointer) { try { (plzI.value ? nameI : plzI).focus({ preventScroll: true }); } catch (e) { } } });
      } else {
        scrollToEl(qs('#kontakt'));
      }
      toast('Werte übernommen – jetzt nur noch Ihre Kontaktdaten.');
    });
    qs('[data-transfer-clear]', form).addEventListener('click', function () {
      transferred = ''; transfer.hidden = true; transferText.textContent = '';
      typI.focus();
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fields = [plzI, nameI, mailI, dsI];
      var results = fields.map(function (i) { return { i: i, ok: validate(i) }; });
      var bad = results.filter(function (r) { return !r.ok; })[0];
      if (bad) { bad.i.focus(); return; }
      var dl = qs('[data-contact-summary]', success); dl.textContent = '';
      var opt = function (s) { return s.options[s.selectedIndex] ? s.options[s.selectedIndex].text : ''; };
      addDef(dl, 'Objektart', opt(typI));
      addDef(dl, 'Fläche', areaI.value ? fmt(+areaI.value) + ' m²' : '');
      addDef(dl, 'Intervall', opt(intI));
      var res = lookup(plzI.value.trim());
      addDef(dl, 'PLZ', plzI.value.trim() + (res.kind === 'yes' ? ' · ' + res.zone.name + ', ca. ' + fmt(res.km, 1) + ' km' : res.kind === 'no' ? ' · außerhalb – wir melden uns trotzdem' : ''));
      addDef(dl, 'Name', nameI.value.trim() + (form.elements.firma.value.trim() ? ', ' + form.elements.firma.value.trim() : ''));
      addDef(dl, 'E-Mail', mailI.value.trim());
      addDef(dl, 'Telefon', form.elements.telefon.value.trim());
      addDef(dl, 'Begehung', (qs('input[name="termin"]:checked', form) || {}).value);
      var msg = form.elements.nachricht.value.trim();
      addDef(dl, 'Nachricht', msg.length > 160 ? msg.slice(0, 157) + '…' : msg);
      addDef(dl, 'Aus dem Rechner', transferred);
      form.hidden = true; success.hidden = false;
      success.focus();
      if (success.getBoundingClientRect().top < headerH()) scrollToEl(success);
    });
    qs('[data-contact-reset]', success).addEventListener('click', function () {
      form.reset(); transferred = ''; transfer.hidden = true;
      qsa('[aria-invalid]', form).forEach(function (i) { setError(i, ''); });
      dsErr.textContent = '';
      success.hidden = true; form.hidden = false; typI.focus();
    });
  })();

  /* ------------------------------------------------------------------
     Aktionsleiste: bei offener Bildschirmtastatur ausblenden
     ------------------------------------------------------------------ */
  (function initActionBar() {
    var bar = qs('.action-bar'); if (!bar) return;
    document.addEventListener('focusin', function (e) { if (e.target.matches('input:not([type=checkbox]):not([type=radio]):not([type=range]), select, textarea')) bar.classList.add('is-hidden'); });
    document.addEventListener('focusout', function () { setTimeout(function () { var a = document.activeElement; if (!a || !a.matches('input:not([type=checkbox]):not([type=radio]):not([type=range]), select, textarea')) bar.classList.remove('is-hidden'); }, 60); });
  })();

  /* ------------------------------------------------------------------
     Kleine Parallaxe & Refresh
     ------------------------------------------------------------------ */
  if (enhanced) {
    var mm2 = gsap.matchMedia();
    mm2.add('(min-width: 900px)', function () {
      gsap.to('.career__glow', { yPercent: 30, ease: 'none', scrollTrigger: { trigger: '.career', start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    var refresh = function () { ST.refresh(); };
    window.addEventListener('load', refresh);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  }
})();
