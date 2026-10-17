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
  var NF = {}; // Intl-Formatter je Nachkommastellen cachen (toLocaleString legt bei jedem Aufruf einen neuen an)
  var fmt = function (n, d) { d = d || 0; var f = NF[d] || (NF[d] = new Intl.NumberFormat('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d })); return f.format(Number(n)); };
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
     Start in Etappen: alles unterhalb des ersten Bildschirms wird in
     Häppchen (≤ 12 ms) nachgeladen, danach einmal ScrollTrigger.refresh()
     ------------------------------------------------------------------ */
  var queue = [];
  function stage(fn) { queue.push(fn); }
  function drain() {
    var t0 = performance.now();
    while (queue.length && performance.now() - t0 < 12) {
      var fn = queue.shift();
      try { fn(); } catch (err) { if (window.console) console.warn('Glanz:', err); }
    }
    if (queue.length) setTimeout(drain, 16);
    else if (hasGSAP) { ST.refresh(); }
  }
  var prng = function (seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
  var TAU = Math.PI * 2;

  /* Zeichen-Rollen in der Navigation */
  (function initRoll() {
    if (!finePointer || reduced()) return;
    qsa('[data-roll]').forEach(function (a) {
      var t = a.textContent;
      a.textContent = '';
      a.appendChild(el('span', 'roll', t));
      var b = el('span', 'roll', t); b.setAttribute('aria-hidden', 'true');
      a.appendChild(b);
    });
  })();

  /* Magnetische Buttons (nur feiner Zeiger) – Feder per Lerp, über die CSS-Eigenschaft translate */
  (function initMagnetic() {
    if (!finePointer || reduced()) return;
    qsa('[data-magnetic]').forEach(function (b) {
      var tx = 0, ty = 0, x = 0, y = 0, raf = 0;
      function loop() {
        x += (tx - x) * 0.18; y += (ty - y) * 0.18;
        b.style.translate = x.toFixed(2) + 'px ' + y.toFixed(2) + 'px';
        if (Math.abs(tx - x) + Math.abs(ty - y) > 0.05) raf = requestAnimationFrame(loop); else raf = 0;
      }
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        tx = (e.clientX - r.left - r.width / 2) * 0.22; ty = (e.clientY - r.top - r.height / 2) * 0.32;
        if (!raf) raf = requestAnimationFrame(loop);
      });
      b.addEventListener('pointerleave', function () { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(loop); });
    });
  })();

  /* ------------------------------------------------------------------
     SIGNATURE 1 · Die beschlagene Scheibe
     Raum (Titel + Foto) wird einmal unscharf in ein Canvas gemalt,
     darüber Beschlag aus Mikrotröpfchen. Wischen radiert frei, an den
     Rändern läuft Kondensat als Tropfen nach.
     ------------------------------------------------------------------ */
  (function initHero() {
    var pane = qs('[data-pane]');
    if (!pane) return;
    var hero = pane.closest('.hero');
    var title = qs('.hero__title', pane), img = qs('.hero__photo img', pane);
    var fog = qs('[data-fog]', pane), fx = qs('[data-fx]', pane), sq = qs('[data-squeegee]', pane);
    var meter = qs('[data-meter]', pane), status = qs('[data-status]', pane), live = qs('[data-live]', pane);
    var btnAuto = qs('[data-autowipe]', pane), btnRefog = qs('[data-refog]', pane);
    if (!fog || !fog.getContext) return;
    var fctx = fog.getContext('2d'), xctx = fx.getContext('2d');
    var DONE_TEXT = status ? status.textContent : '';
    var HINT = finePointer ? 'Beschlagen. Fahren Sie mit der Maus über die Scheibe.' : 'Beschlagen. Wischen Sie quer über die Scheibe.';
    var DONE_AT = 0.55;           // Anteil freier Fläche, ab dem fertig gewischt wird
    var GX = 40, GY = 28;
    var cells = new Uint8Array(GX * GY), cleaned = 0;
    var W = 0, H = 0, dpr = 1, brush = 44, cw = 1, ch = 1;
    var state = 'idle', visible = true, touched = false, introDone = false;
    var stamp = document.createElement('canvas'), small = document.createElement('canvas'), mid = document.createElement('canvas'), mist = document.createElement('canvas');

    function size() {
      W = Math.max(1, pane.clientWidth); H = Math.max(1, pane.clientHeight);
      dpr = Math.min(window.innerWidth < 900 ? 2 : 1, window.devicePixelRatio || 1); // Beschlag ist weich – auf großen Flächen genügt DPR 1
      [fog, fx].forEach(function (c) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); });
      fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      xctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      brush = clamp(Math.min(W, H) * 0.09, 34, 60);
      cw = W / GX; ch = H / GY;
      var S = Math.round(brush * 2.3);
      sq.style.width = S + 'px'; sq.style.height = S + 'px';
      sq.style.marginLeft = -S / 2 + 'px'; sq.style.marginTop = -S * 24 / 120 + 'px';
      sq.style.transformOrigin = (S / 2) + 'px ' + (S * 24 / 120) + 'px';
      var s = Math.ceil(brush * 2 * dpr);
      stamp.width = stamp.height = s;
      var c = stamp.getContext('2d');
      var g = c.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.62, 'rgba(0,0,0,.95)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g; c.fillRect(0, 0, s, s);
    }
    function rel(node, pr) { var r = node.getBoundingClientRect(); return { x: r.left - pr.left, y: r.top - pr.top, w: r.width, h: r.height }; }

    function drop(ctx, x, y, r) {
      ctx.fillStyle = 'rgba(11,37,69,.09)';
      ctx.beginPath(); ctx.arc(x + r * 0.16, y + r * 0.3, r, 0, TAU); ctx.fill();
      var g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
      g.addColorStop(0, 'rgba(255,255,255,.1)'); g.addColorStop(0.7, 'rgba(255,255,255,.3)'); g.addColorStop(1, 'rgba(255,255,255,.92)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.95)';
      ctx.beginPath(); ctx.arc(x - r * 0.34, y - r * 0.36, Math.max(0.6, r * 0.24), 0, TAU); ctx.fill();
    }

    /* Raum unscharf: verkleinert malen, in zwei Stufen hochskalieren */
    function paintRoom() {
      var pr = pane.getBoundingClientRect();
      var S = 1 / 9, sw = Math.max(8, Math.round(W * S)), sh = Math.max(8, Math.round(H * S));
      small.width = sw; small.height = sh;
      var t = small.getContext('2d');
      t.setTransform(S, 0, 0, S, 0, 0);
      var g = t.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#EEF4F7'); g.addColorStop(0.55, '#F7FAFB'); g.addColorStop(1, '#EAF1F5');
      t.fillStyle = g; t.fillRect(0, 0, W, H);
      if (img && img.complete && img.naturalWidth) { var r = rel(img, pr); t.drawImage(img, r.x, r.y, r.w, r.h); }
      qsa('.hl', title).forEach(function (s) {
        var r = rel(s, pr), cs = getComputedStyle(s);
        t.font = cs.fontWeight + ' ' + cs.fontSize + ' "Plus Jakarta Sans", system-ui, sans-serif';
        if ('letterSpacing' in t) t.letterSpacing = cs.letterSpacing;
        t.fillStyle = '#0B2545'; t.textBaseline = 'middle';
        t.fillText(s.textContent.trim(), r.x + (parseFloat(cs.paddingLeft) || 0), r.y + r.h * 0.55);
      });
      mid.width = Math.max(8, Math.round(W / 3)); mid.height = Math.max(8, Math.round(H / 3));
      var m = mid.getContext('2d');
      m.imageSmoothingEnabled = true; m.drawImage(small, 0, 0, mid.width, mid.height);
      fctx.imageSmoothingEnabled = true; fctx.imageSmoothingQuality = 'medium';
      fctx.drawImage(mid, 0, 0, W, H);
    }

    function paintFog() {
      var i, x, y, r;
      fctx.save();
      fctx.globalCompositeOperation = 'source-over'; fctx.globalAlpha = 1;
      fctx.clearRect(0, 0, W, H);
      paintRoom();
      var g = fctx.createLinearGradient(0, 0, W * 0.2, H);
      g.addColorStop(0, 'rgba(243,248,250,.5)'); g.addColorStop(0.6, 'rgba(238,245,248,.6)'); g.addColorStop(1, 'rgba(230,240,245,.74)');
      fctx.fillStyle = g; fctx.fillRect(0, 0, W, H);
      var rnd = prng(23);
      if (!mist.width) { // Mikrotröpfchen einmal als Kachel malen, dann als Muster füllen
        mist.width = mist.height = 240; var mc = mist.getContext('2d'), mr = prng(5);
        mc.fillStyle = '#ffffff';
        for (i = 0; i < 340; i++) { mc.globalAlpha = 0.18 + mr() * 0.5; mc.beginPath(); mc.arc(mr() * 240, mr() * 240, 0.35 + mr() * 1.1, 0, TAU); mc.fill(); }
      }
      fctx.fillStyle = fctx.createPattern(mist, 'repeat'); fctx.fillRect(0, 0, W, H);
      var mm = Math.round(W * H / 9000);
      for (i = 0; i < mm; i++) { x = rnd() * W; y = Math.pow(rnd(), 0.65) * H; r = 1.5 + rnd() * rnd() * 5; drop(fctx, x, y, r); }
      var trails = Math.round(W / 90);
      for (i = 0; i < trails; i++) {
        x = rnd() * W; var y0 = rnd() * H * 0.55, len = H * (0.12 + rnd() * 0.3), w = 2.2 + rnd() * 2.6;
        fctx.globalCompositeOperation = 'destination-out'; fctx.globalAlpha = 0.55;
        fctx.lineWidth = w; fctx.lineCap = 'round';
        fctx.beginPath(); fctx.moveTo(x, y0);
        for (var k = 1; k <= 8; k++) fctx.lineTo(x + Math.sin(k * 1.7 + i) * 1.4, y0 + len * k / 8);
        fctx.stroke();
        fctx.globalCompositeOperation = 'source-over'; fctx.globalAlpha = 1;
        drop(fctx, x + Math.sin(8 * 1.7 + i) * 1.4, y0 + len + w * 0.6, w);
      }
      fctx.restore();
      if (cleaned) {
        fctx.save(); fctx.globalCompositeOperation = 'destination-out';
        var cr = Math.max(cw, ch) * 1.1;
        for (var gy = 0; gy < GY; gy++) for (var gx = 0; gx < GX; gx++) if (cells[gy * GX + gx]) fctx.drawImage(stamp, (gx + 0.5) * cw - cr, (gy + 0.5) * ch - cr, cr * 2, cr * 2);
        fctx.restore();
      }
    }

    function stampAt(x, y) {
      fctx.drawImage(stamp, x - brush, y - brush, brush * 2, brush * 2);
      var rr = brush * 0.75;
      var x0 = clamp(Math.floor((x - rr) / cw), 0, GX - 1), x1 = clamp(Math.floor((x + rr) / cw), 0, GX - 1);
      var y0 = clamp(Math.floor((y - rr) / ch), 0, GY - 1), y1 = clamp(Math.floor((y + rr) / ch), 0, GY - 1);
      for (var gy = y0; gy <= y1; gy++) for (var gx = x0; gx <= x1; gx++) {
        var idx = gy * GX + gx; if (cells[idx]) continue;
        var dx = (gx + 0.5) * cw - x, dy = (gy + 0.5) * ch - y;
        if (dx * dx + dy * dy <= rr * rr) { cells[idx] = 1; cleaned++; }
      }
    }
    var lastWipe = null, travel = 0;
    function wipeTo(x, y) {
      fctx.save(); fctx.globalCompositeOperation = 'destination-out';
      if (!lastWipe) stampAt(x, y);
      else {
        var dx = x - lastWipe.x, dy = y - lastWipe.y, dist = Math.sqrt(dx * dx + dy * dy);
        var step = Math.max(2, brush * 0.22), n = Math.ceil(dist / step);
        for (var i = 1; i <= n; i++) stampAt(lastWipe.x + dx * i / n, lastWipe.y + dy * i / n);
        travel += dist;
        if (travel > 60 && !reduced()) { travel = 0; if (Math.random() < 0.5) spawn(x + (Math.random() - 0.5) * brush, y + (Math.random() - 0.5) * brush, 1); maybeDrip(x, y); }
      }
      fctx.restore();
      lastWipe = { x: x, y: y };
      progress();
    }
    function progress() {
      var p = cleaned / (GX * GY), q = clamp(p / DONE_AT, 0, 1);
      if (meter) meter.style.transform = 'scaleX(' + q.toFixed(3) + ')';
      if (state === 'fog' && status && touched) status.textContent = Math.round(q * 100) + ' % freigewischt';
      if (p >= DONE_AT && state === 'fog' && !auto) finish();
    }

    /* Kondensat läuft nach: Tropfen sammeln sich am Rand der gewischten Bahn und laufen durch den Beschlag */
    var drips = [];
    function maybeDrip(x, y) {
      if (drips.length > 16 || state !== 'fog') return;
      if (Math.random() < 0.55) drips.push({ x: x + (Math.random() - 0.5) * brush * 1.2, y: y + brush * (0.55 + Math.random() * 0.2), v: 0, w: 1.4 + Math.random() * 1.6, hold: 250 + Math.random() * 700, run: 0, max: H * (0.05 + Math.random() * 0.16), ph: Math.random() * 6 });
    }
    function stepDrips(dt) {
      if (!drips.length) return;
      fctx.save(); fctx.globalCompositeOperation = 'destination-out'; fctx.lineCap = 'round';
      for (var i = drips.length - 1; i >= 0; i--) {
        var d = drips[i];
        if (d.hold > 0) { d.hold -= dt; continue; }
        d.v = Math.min(0.12, d.v + 0.00012 * dt * (0.6 + Math.random()));
        var ny = d.y + d.v * dt, nx = d.x + Math.sin(d.ph + d.run * 0.08) * 0.25;
        fctx.lineWidth = d.w; fctx.globalAlpha = 0.75;
        fctx.beginPath(); fctx.moveTo(d.x, d.y); fctx.lineTo(nx, ny); fctx.stroke();
        d.run += ny - d.y; d.x = nx; d.y = ny;
        if (d.run >= d.max || d.y > H) {
          fctx.restore(); drop(fctx, d.x, d.y + d.w * 0.5, d.w * 1.25); fctx.save(); fctx.globalCompositeOperation = 'destination-out'; fctx.lineCap = 'round';
          drips.splice(i, 1);
        }
      }
      fctx.restore();
      drips.forEach(function (d) {
        var r = d.w * (d.hold > 0 ? 1 + (1 - d.hold / 950) * 0.4 : 1.25);
        xctx.fillStyle = 'rgba(11,37,69,.18)'; xctx.beginPath(); xctx.arc(d.x + r * 0.15, d.y + r * 0.35, r, 0, TAU); xctx.fill();
        xctx.fillStyle = 'rgba(255,255,255,.9)'; xctx.beginPath(); xctx.arc(d.x, d.y, r, 0, TAU); xctx.fill();
        xctx.fillStyle = 'rgba(25,195,209,.35)'; xctx.beginPath(); xctx.arc(d.x + r * 0.2, d.y + r * 0.25, r * 0.55, 0, TAU); xctx.fill();
      });
    }

    /* Funkeln */
    var parts = [], COLORS = ['#ffffff', '#19C3D1', '#B9B3FF', '#ffffff'];
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
      for (var i = parts.length - 1; i >= 0; i--) {
        var p = parts[i]; p.life += dt;
        if (p.life >= p.max) { parts.splice(i, 1); continue; }
        var t = p.life / p.max;
        p.x += p.vx * dt; p.y += p.vy * dt;
        xctx.globalAlpha = Math.sin(Math.PI * t); xctx.fillStyle = p.c;
        star(p.x, p.y, p.s * (0.4 + 0.6 * Math.sin(Math.PI * t)), p.rot + t * 1.2);
      }
      xctx.globalAlpha = 1;
    }

    /* Eingabe */
    var pointer = { x: 0, y: 0, inside: false, down: false, type: 'mouse' };
    var pos = { x: 0, y: 0, a: 0 }, auto = null;
    function local(e) { var r = pane.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    function onControl(e) { return !!(e.target.closest && e.target.closest('a, button, input')); }
    function isActive() { return !!auto || pointer.down || (pointer.type === 'mouse' && pointer.inside); }
    function touch() { if (!touched) { touched = true; pane.classList.add('is-touched'); } }
    pane.addEventListener('pointermove', function (e) {
      if (state !== 'fog') return;
      var p = local(e); pointer.x = p.x; pointer.y = p.y; pointer.type = e.pointerType;
      if (e.pointerType === 'mouse') {
        if (onControl(e)) { if (pointer.inside) { pointer.inside = false; lastWipe = null; if (!auto) pane.classList.remove('is-active'); } return; }
        if (!pointer.inside) { pointer.inside = true; if (!auto) { pos.x = p.x; pos.y = p.y; lastWipe = null; } }
        touch();
      }
      if (isActive()) { pane.classList.add('is-active'); schedule(); }
    });
    pane.addEventListener('pointerleave', function (e) {
      if (e.pointerType === 'mouse') { pointer.inside = false; lastWipe = null; if (!auto) pane.classList.remove('is-active'); }
    });
    pane.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' || state !== 'fog' || onControl(e)) return;
      var p = local(e);
      pointer.x = p.x; pointer.y = p.y; pointer.type = e.pointerType; pointer.down = true;
      if (!auto) { pos.x = p.x; pos.y = p.y; lastWipe = null; }
      touch(); pane.classList.add('is-active'); schedule();
    });
    function up(e) { if (e.pointerType === 'mouse') return; pointer.down = false; lastWipe = null; if (!auto) pane.classList.remove('is-active'); }
    pane.addEventListener('pointerup', up);
    pane.addEventListener('pointercancel', up);

    /* Bahnen: Schlangenlinie wie beim Abziehen von Glas */
    function lanes(rows, top, bottom, left, right) {
      var pts = [];
      for (var i = 0; i < rows.length; i++) { var y = rows[i]; if (i % 2 === 0) pts.push([left, y], [right, y]); else pts.push([right, y], [left, y]); }
      var segs = [], total = 0;
      for (var k = 1; k < pts.length; k++) { var d = Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]); segs.push({ a: pts[k - 1], b: pts[k], d: d, s: total }); total += d; }
      return { segs: segs, total: total };
    }
    function fullPath() {
      var n = Math.max(3, Math.ceil((H - brush) / (brush * 1.3)) + 1), rows = [];
      for (var i = 0; i < n; i++) rows.push(brush * 0.5 + (H - brush) * i / (n - 1));
      return lanes(rows, 0, H, -brush * 0.4, W + brush * 0.4);
    }
    function titlePath() {
      var pr = pane.getBoundingClientRect(), rows = [], right = 0, left = W, lastBottom = 0;
      qsa('.hl', title).forEach(function (s) {
        var r = rel(s, pr), cs = getComputedStyle(s), pl = parseFloat(cs.paddingLeft) || 0;
        var range = document.createRange(); range.selectNodeContents(s); var tr = range.getBoundingClientRect();
        rows.push(r.y + r.h * 0.42);
        lastBottom = r.y + r.h * 1.02;
        left = Math.min(left, r.x + pl * 0.3); right = Math.max(right, tr.right - pr.left);
      });
      if (!rows.length) return fullPath();
      rows.push(lastBottom);
      return lanes(rows, 0, H, Math.max(-brush * 0.3, left - brush * 0.6), Math.min(W + brush * 0.3, right + brush * 0.7));
    }
    function pointAt(path, dist) {
      for (var i = 0; i < path.segs.length; i++) {
        var s = path.segs[i];
        if (dist <= s.s + s.d || i === path.segs.length - 1) { var t = s.d ? clamp((dist - s.s) / s.d, 0, 1) : 1; return { x: s.a[0] + (s.b[0] - s.a[0]) * t, y: s.a[1] + (s.b[1] - s.a[1]) * t }; }
      }
      return { x: 0, y: 0 };
    }
    function runPath(path, dur, done) {
      if (state !== 'fog') return;
      if (reduced()) {
        fctx.save(); fctx.globalCompositeOperation = 'destination-out'; lastWipe = null;
        for (var dd = 0; dd <= path.total; dd += brush * 0.3) { var q = pointAt(path, dd); stampAt(q.x, q.y); }
        fctx.restore(); lastWipe = null; progress(); if (done) done(); return;
      }
      auto = { path: path, t0: performance.now(), dur: dur, done: done };
      var p0 = pointAt(path, 0); pos.x = p0.x; pos.y = p0.y; lastWipe = null;
      pane.classList.add('is-active');
      schedule();
    }
    function startAuto() {
      if (state !== 'fog') return;
      touch();
      if (btnAuto) btnAuto.disabled = true;
      if (reduced()) { finish(); return; }
      var path = fullPath();
      runPath(path, clamp(path.total / 2.2, 1800, 3200), function () { if (state === 'fog') finish(); });
    }

    var raf = 0, lastT = 0;
    function schedule() { if (!raf && visible && !document.hidden) { lastT = performance.now(); raf = requestAnimationFrame(tick); } }
    function tick(now) {
      raf = 0;
      var dt = clamp(now - lastT, 1, 48); lastT = now;
      var target = pointer, k;
      xctx.clearRect(0, 0, W, H);
      if (auto) {
        var t = clamp((now - auto.t0) / auto.dur, 0, 1);
        target = pointAt(auto.path, auto.path.total * easeInOut(t));
        k = 1;
        if (t >= 1) {
          var cb = auto.done; auto = null; lastWipe = null;
          if (btnAuto) btnAuto.disabled = false;
          if (!pointer.down && !pointer.inside) pane.classList.remove('is-active');
          if (cb) cb();
        }
      } else {
        k = 1 - Math.pow(1 - (pointer.type === 'mouse' ? 0.3 : 0.55), dt / 16.67);
      }
      var moving = false;
      if (isActive() || target !== pointer) {
        var px = pos.x;
        pos.x += (target.x - pos.x) * k; pos.y += (target.y - pos.y) * k;
        var vx = (pos.x - px) / Math.max(1, dt);
        pos.a += (clamp(vx * 20, -22, 22) - pos.a) * 0.18;
        if (state === 'fog') wipeTo(pos.x, pos.y);
        sq.style.transform = 'translate3d(' + pos.x.toFixed(1) + 'px,' + pos.y.toFixed(1) + 'px,0) rotate(' + pos.a.toFixed(2) + 'deg)';
        moving = Math.abs(target.x - pos.x) + Math.abs(target.y - pos.y) > 0.5 || Math.abs(pos.a) > 0.3;
      }
      stepDrips(dt);
      if (parts.length) drawParts(dt);
      if (auto || (isActive() && moving) || parts.length || drips.length) schedule();
    }

    function glint() {
      if (!hero || reduced()) return;
      hero.classList.remove('is-glint'); void hero.offsetWidth; hero.classList.add('is-glint');
      setTimeout(function () { hero.classList.remove('is-glint'); }, 2000);
    }
    function finish() {
      if (state !== 'fog') return;
      state = 'clear'; drips.length = 0;
      pane.classList.add('is-done'); pane.classList.remove('is-active', 'is-wipeable');
      if (meter) meter.style.transform = 'scaleX(1)';
      if (status) status.textContent = DONE_TEXT;
      if (live) live.textContent = 'Die Scheibe ist freigewischt.';
      if (!reduced()) { for (var i = 0; i < 26; i++) spawn(Math.random() * W, Math.random() * H, 1); }
      glint();
      var hadFocus = document.activeElement === btnAuto;
      if (btnAuto) btnAuto.hidden = true;
      if (btnRefog) { btnRefog.hidden = false; if (hadFocus) btnRefog.focus(); }
    }
    function fogUp(isRefog) {
      cells.fill(0); cleaned = 0; lastWipe = null; drips.length = 0;
      paintFog();
      state = 'fog';
      pane.classList.remove('is-done');
      requestAnimationFrame(function () { pane.classList.add('is-fogged', 'is-wipeable'); }); // Sichtbarmachen erst im nächsten Frame – verteilt die Arbeit
      if (status) status.textContent = HINT;
      progress();
      if (isRefog) {
        if (live) live.textContent = 'Die Scheibe ist wieder beschlagen.';
        var hadFocus = document.activeElement === btnRefog;
        if (btnRefog) btnRefog.hidden = true;
        if (btnAuto) { btnAuto.hidden = false; btnAuto.disabled = false; if (hadFocus) btnAuto.focus(); }
      }
    }
    if (btnAuto) btnAuto.addEventListener('click', startAuto);
    if (btnRefog) btnRefog.addEventListener('click', function () { fogUp(true); });

    function ready() {
      if (state !== 'idle') return;
      size(); fogUp(false);
      pane.classList.add('is-ready');
      // Erster Zug ohne Interaktion: der Abzieher legt den Titel frei (nach ~1,6 s ist alles lesbar)
      setTimeout(function () {
        if (state !== 'fog' || introDone) return;
        introDone = true;
        var p = titlePath();
        runPath(p, clamp(p.total / 2.4, 900, 1400), function () {
          glint();
          if (status && !touched) status.textContent = 'Den Rest wischen Sie.';
        });
      }, reduced() ? 0 : 420);
    }
    var imgReady = new Promise(function (res) { if (!img || (img.complete && img.naturalWidth)) res(); else { img.addEventListener('load', res, { once: true }); img.addEventListener('error', res, { once: true }); } });
    var fontReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    Promise.all([imgReady, fontReady]).then(function () {
      var go = function () { requestAnimationFrame(ready); };
      if ('requestIdleCallback' in window) requestIdleCallback(go, { timeout: 500 }); else setTimeout(go, 60);
    });

    if ('ResizeObserver' in window) {
      var lastW = 0;
      new ResizeObserver(function (entries) {
        var r = entries[0].contentRect;
        if (Math.abs(r.width - lastW) < 2) return;
        lastW = r.width;
        if (state === 'idle') return;
        size();
        if (state === 'fog') paintFog(); else fctx.clearRect(0, 0, W, H);
      }).observe(pane);
    }
    if (hasIO) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) schedule();
      }).observe(pane);
    }
    document.addEventListener('visibilitychange', function () { if (!document.hidden) schedule(); });
  })();

  /* ------------------------------------------------------------------
     Reveal „Abzieher-Zug“ (clip-path von links nach rechts) + Fades
     ------------------------------------------------------------------ */
  stage(function initReveal() {
    qsa('[data-collage] [data-pull]').forEach(function (n, i) { n.style.setProperty('--d', i * 120 + 'ms'); });
    var items = qsa('[data-pull], [data-fade], .sheet__sign, [data-voices]');
    if (!hasIO || reduced()) { items.forEach(function (n) { n.classList.add('is-in'); }); return; }
    // Chrome rechnet clip-path des Ziels in die Schnittfläche ein – darum wird der (ungeclippte) Elternknoten beobachtet
    var map = new Map();
    items.forEach(function (n) { var p = n.hasAttribute('data-pull') ? n.parentElement : n; if (!map.has(p)) map.set(p, []); map.get(p).push(n); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        (map.get(e.target) || []).forEach(function (n) { n.classList.add('is-in'); });
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0 });
    map.forEach(function (list, p) { io.observe(p); });
  });

  /* Zahlen-Odometer (64 Menschen) */
  stage(function initOdo() {
    qsa('[data-odo]').forEach(function (n) {
      var val = n.getAttribute('data-odo');
      if (reduced() || !hasIO) return;
      n.textContent = '';
      n.appendChild(el('span', 'sr-only', val));
      var cols = [];
      val.split('').forEach(function (d) {
        var col = el('span', 'odo__col'); col.setAttribute('aria-hidden', 'true');
        for (var i = 0; i <= 9; i++) col.appendChild(el('span', null, String(i)));
        col.setAttribute('data-d', d); n.appendChild(col); cols.push(col);
      });
      var io = new IntersectionObserver(function (es) {
        if (!es[0].isIntersecting) return; io.disconnect();
        cols.forEach(function (c, i) { c.style.transitionDelay = i * 140 + 'ms'; c.style.transform = 'translateY(' + (-c.getAttribute('data-d')) + 'em)'; });
      }, { threshold: 0.6 });
      io.observe(n);
    });
  });

  /* Laufband: Protokoll von heute früh – Tempo folgt der Scroll-Geschwindigkeit */
  stage(function initTicker() {
    var wrap = qs('[data-ticker]'), track = qs('[data-ticker-track]');
    if (!wrap || !track || reduced()) return;
    track.classList.add('is-js');
    var x = 0, half = 0, boost = 0, lastY = window.scrollY, raf = 0, on = false, last = 0;
    function measure() { half = track.scrollWidth / 2; }
    measure(); window.addEventListener('resize', measure);
    function loop(now) {
      raf = 0; if (!on) return;
      var dt = clamp(now - (last || now), 0, 50); last = now;
      var y = window.scrollY, dy = y - lastY; lastY = y;
      boost += (clamp(dy * 0.9, -40, 40) - boost) * 0.12;
      x -= (0.045 * dt) + boost * dt * 0.06;
      if (half) { if (x <= -half) x += half; if (x > 0) x -= half; }
      track.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,0)';
      raf = requestAnimationFrame(loop);
    }
    new IntersectionObserver(function (es) { on = es[0].isIntersecting && !document.hidden; if (on && !raf) { last = 0; lastY = window.scrollY; raf = requestAnimationFrame(loop); } }).observe(wrap);
    document.addEventListener('visibilitychange', function () { if (document.hidden) on = false; });
  });

  /* Leistungen: Index mit Vorschaubild am Zeiger (Desktop) */
  stage(function initServices() {
    var list = qs('[data-svc-list]'), prev = qs('[data-svc-preview]');
    if (!list || !prev || !finePointer || reduced()) return;
    var rows = qsa('.svc-row', list), imgs = [];
    rows.forEach(function (r, i) {
      var src = qs('.svc-row__media img', r); if (!src) return;
      var im = document.createElement('img');
      im.alt = ''; im.decoding = 'async'; im.loading = 'lazy';
      im.srcset = src.getAttribute('srcset'); im.sizes = '300px'; im.src = src.getAttribute('src');
      prev.appendChild(im); imgs[i] = im;
      r.addEventListener('pointerenter', function () {
        imgs.forEach(function (m) { if (m) m.classList.toggle('is-current', m === im); });
        prev.classList.add('is-on'); active = true; kick();
      });
    });
    list.addEventListener('pointerleave', function () { prev.classList.remove('is-on'); active = false; });
    var tx = -999, ty = -999, x = -999, y = -999, rot = 0, raf = 0, active = false;
    window.addEventListener('pointermove', function (e) { tx = e.clientX + 28; ty = e.clientY - 120; if (active) kick(); }, { passive: true });
    function kick() { if (!raf) raf = requestAnimationFrame(loop); }
    function loop() {
      raf = 0;
      if (x < -900) { x = tx; y = ty; }
      var px = x; x += (tx - x) * 0.16; y += (ty - y) * 0.16;
      rot += (clamp((x - px) * 0.35, -8, 8) - rot) * 0.15;
      prev.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) rotate(' + rot.toFixed(2) + 'deg)';
      if (Math.abs(tx - x) + Math.abs(ty - y) > 0.4 || Math.abs(rot) > 0.1) kick();
    }
  });

  /* ------------------------------------------------------------------
     SET PIECE · Vorher/Nachher: der Abzieher zieht mit dem Scroll über die Teeküche
     ------------------------------------------------------------------ */
  stage(function initBA() {
    var sec = qs('[data-ba]'); if (!sec) return;
    var frame = qs('.ba__frame', sec), range = qs('[data-ba-range]', sec), cv = qs('[data-ba-grime]', sec);
    var clock = qs('[data-ba-clock]', sec), steps = qsa('[data-ba-steps] li', sec), stageEl = qs('[data-ba-stage]', sec);
    var painted = false;
    function paintGrime() {
      if (painted || !cv.getContext) return;
      var w = frame.clientWidth, h = frame.clientHeight; if (!w || !h) return;
      painted = true;
      var d = Math.min(1.5, window.devicePixelRatio || 1);
      cv.width = Math.round(w * d); cv.height = Math.round(h * d);
      var c = cv.getContext('2d'); c.setTransform(d, 0, 0, d, 0, 0);
      var rnd = prng(7), i;
      c.fillStyle = 'rgba(150,120,70,.16)'; c.fillRect(0, 0, w, h);
      for (i = 0; i < 26; i++) { // Schlieren
        var x = rnd() * w, y = rnd() * h, r = 30 + rnd() * 120;
        var g = c.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, 'rgba(110,85,50,' + (0.08 + rnd() * 0.14) + ')'); g.addColorStop(1, 'rgba(110,85,50,0)');
        c.fillStyle = g; c.beginPath(); c.ellipse(x, y, r, r * (0.4 + rnd() * 0.5), rnd() * 3, 0, TAU); c.fill();
      }
      for (i = 0; i < 9; i++) { // Kaffeeränder
        var cx = rnd() * w, cy = h * (0.45 + rnd() * 0.5), cr = 10 + rnd() * 18;
        c.strokeStyle = 'rgba(95,60,30,' + (0.25 + rnd() * 0.3) + ')'; c.lineWidth = 1.2 + rnd() * 2;
        c.beginPath(); c.arc(cx, cy, cr, rnd() * 3, rnd() * 3 + 4.5); c.stroke();
      }
      for (i = 0; i < 160; i++) { // Wasserflecken und Krümel
        var sx = rnd() * w, sy = rnd() * h, sr = 0.6 + rnd() * rnd() * 4;
        c.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,.35)' : 'rgba(70,50,30,.35)';
        c.beginPath(); c.arc(sx, sy, sr, 0, TAU); c.fill();
      }
      c.strokeStyle = 'rgba(255,255,255,.22)'; c.lineCap = 'round';
      for (i = 0; i < 14; i++) { // Wischstreifen auf dem Glas
        var x0 = w * (0.45 + rnd() * 0.55), y0 = rnd() * h * 0.6;
        c.lineWidth = 6 + rnd() * 16; c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(x0 + 40, y0 + 30, x0 + 20 + rnd() * 80, y0 + 60 + rnd() * 90); c.stroke();
      }
    }
    var v = 50, last = -1;
    function apply(val) {
      v = clamp(val, 0, 100);
      if (Math.round(v * 10) === last) return; last = Math.round(v * 10);
      frame.style.setProperty('--v', v.toFixed(2));
      if (+range.value !== Math.round(v)) range.value = Math.round(v);
      range.setAttribute('aria-valuetext', Math.round(v) + ' Prozent gereinigt');
      var mins = Math.round(v / 100 * 42), tot = 5 * 60 + 58 + mins;
      if (clock) clock.textContent = String(Math.floor(tot / 60)).padStart(2, '0') + ':' + String(tot % 60).padStart(2, '0');
      steps.forEach(function (li) { li.classList.toggle('is-done', v >= +li.getAttribute('data-at')); });
    }
    range.addEventListener('input', function () { apply(+range.value); });
    if (hasIO) new IntersectionObserver(function (es) { if (es[0].isIntersecting) paintGrime(); }, { rootMargin: '400px 0px' }).observe(frame);
    else paintGrime();
    if (!enhanced) { apply(+range.value); return; }
    apply(4);
    var proxy = { v: 4 };
    var mm = gsap.matchMedia();
    mm.add('(min-width: 900px) and (min-height: 700px)', function () {
      sec.classList.add('is-sticky');
      var setH = function () { sec.style.setProperty('--ba-h', Math.round(stageEl.offsetHeight + window.innerHeight * 1.3) + 'px'); };
      setH(); ST.addEventListener('refreshInit', setH);
      var tw = gsap.fromTo(proxy, { v: 4 }, { v: 100, ease: 'none', onUpdate: function () { apply(proxy.v); },
        scrollTrigger: { trigger: sec, start: 'top top', end: 'bottom bottom', scrub: 0.6, invalidateOnRefresh: true } });
      return function () { ST.removeEventListener('refreshInit', setH); sec.classList.remove('is-sticky'); sec.style.removeProperty('--ba-h'); tw.scrollTrigger && tw.scrollTrigger.kill(); tw.kill(); };
    });
    mm.add('(max-width: 899px), (max-height: 699px)', function () {
      var tw = gsap.fromTo(proxy, { v: 4 }, { v: 100, ease: 'none', onUpdate: function () { apply(proxy.v); },
        scrollTrigger: { trigger: frame, start: 'top 80%', end: 'bottom 25%', scrub: 0.6 } });
      return function () { tw.scrollTrigger && tw.scrollTrigger.kill(); tw.kill(); };
    });
  });

  /* ------------------------------------------------------------------
     SET PIECE · Ablauf als Schlangenlinie – der Abzieher fährt die Linie ab
     ------------------------------------------------------------------ */
  stage(function initFlow() {
    var sec = qs('#ablauf'), road = qs('[data-flow]'); if (!sec || !road) return;
    var svg = qs('[data-flow-svg]', road), track = qs('[data-flow-track]', road), ink = qs('[data-flow-ink]', road), head = qs('[data-flow-head]', road);
    var steps = qsa('[data-step]', road);
    var len = 0, marks = [], prog = 0;
    function build() {
      var rr = road.getBoundingClientRect();
      var pts = steps.map(function (s) {
        var n = qs('.flow-step__num', s).getBoundingClientRect();
        return { x: n.left - rr.left + n.width / 2, y: n.top - rr.top + n.height / 2 };
      });
      if (!pts.length) return;
      var d = 'M ' + pts[0].x.toFixed(1) + ' ' + (pts[0].y - 60).toFixed(1) + ' L ' + pts[0].x.toFixed(1) + ' ' + pts[0].y.toFixed(1);
      var cum = [];
      track.setAttribute('d', d); cum.push(track.getTotalLength());
      for (var i = 1; i < pts.length; i++) {
        var a = pts[i - 1], b = pts[i], dy = b.y - a.y;
        d += ' C ' + a.x.toFixed(1) + ' ' + (a.y + dy * 0.62).toFixed(1) + ' ' + b.x.toFixed(1) + ' ' + (b.y - dy * 0.62).toFixed(1) + ' ' + b.x.toFixed(1) + ' ' + b.y.toFixed(1);
        track.setAttribute('d', d); cum.push(track.getTotalLength());   // Länge bis zur Station i – ohne Abtasten
      }
      var lastP = pts[pts.length - 1];
      d += ' L ' + lastP.x.toFixed(1) + ' ' + (lastP.y + 80).toFixed(1);
      track.setAttribute('d', d); ink.setAttribute('d', d);
      svg.setAttribute('viewBox', '0 0 ' + rr.width.toFixed(0) + ' ' + rr.height.toFixed(0));
      len = ink.getTotalLength();
      marks = cum.map(function (c) { return c / len; });
      ink.style.strokeDasharray = len.toFixed(1);
      draw(prog);
    }
    function draw(p) {
      prog = p;
      if (!len) return;
      ink.style.strokeDashoffset = (len * (1 - p)).toFixed(1);
      var L = len * p, q = ink.getPointAtLength(L), q2 = ink.getPointAtLength(Math.min(len, L + 2));
      var ang = Math.atan2(q2.y - q.y, q2.x - q.x) * 180 / Math.PI - 90;
      head.style.transform = 'translate3d(' + q.x.toFixed(1) + 'px,' + q.y.toFixed(1) + 'px,0) rotate(' + clamp(ang, -50, 50).toFixed(1) + 'deg)';
      steps.forEach(function (s, i) { s.classList.toggle('is-lit', p >= marks[i] - 0.01); });
    }
    if (!enhanced) { steps.forEach(function (s) { s.classList.add('is-lit'); }); return; }
    sec.classList.add('has-road');
    build();
    ST.create({ trigger: road, start: 'top 70%', end: 'bottom 55%', scrub: 0.5, onUpdate: function (self) { draw(self.progress); }, onRefresh: function (self) { build(); draw(self.progress); } });
  });

  /* Collage: drei Ebenen mit leichter Tiefe (Desktop) */
  stage(function initCollage() {
    if (!enhanced) return;
    var mm = gsap.matchMedia();
    mm.add('(min-width: 900px)', function () {
      qsa('[data-collage] [data-depth]').forEach(function (f) {
        gsap.fromTo(f, { yPercent: -parseFloat(f.getAttribute('data-depth')) * 100 }, { yPercent: parseFloat(f.getAttribute('data-depth')) * 100, ease: 'none', scrollTrigger: { trigger: '[data-collage]', start: 'top bottom', end: 'bottom top', scrub: true } });
      });
    });
  });

  /* ------------------------------------------------------------------
     SET PIECE · Seifenblasen mit einfacher Physik (Auftrieb, Wände, Stoß, Platzen)
     ------------------------------------------------------------------ */
  stage(function initBubbles() {
    var sec = qs('[data-voices]'), cv = qs('[data-bubbles]');
    if (!sec || !cv || !cv.getContext || reduced()) return;
    var ctx = cv.getContext('2d'), W = 0, H = 0, dpr = 1, bubbles = [], pops = [], on = false, raf = 0, last = 0, acc = 0;
    var sprite = document.createElement('canvas'), SP = 128;
    (function paintSprite() {
      sprite.width = sprite.height = SP; var c = sprite.getContext('2d'), r = SP / 2 - 2, m = SP / 2;
      var g = c.createRadialGradient(m, m, r * 0.55, m, m, r);
      g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.78, 'rgba(185,179,255,.12)'); g.addColorStop(0.92, 'rgba(25,195,209,.28)'); g.addColorStop(1, 'rgba(185,179,255,.6)');
      c.fillStyle = g; c.beginPath(); c.arc(m, m, r, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 1.2; c.beginPath(); c.arc(m, m, r - 1, 0, TAU); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,.95)'; c.lineWidth = 4; c.lineCap = 'round';
      c.beginPath(); c.arc(m, m, r * 0.72, Math.PI * 1.08, Math.PI * 1.42); c.stroke();
      c.fillStyle = 'rgba(255,255,255,.95)'; c.beginPath(); c.arc(m - r * 0.42, m - r * 0.5, r * 0.07, 0, TAU); c.fill();
    })();
    function make(atBottom) {
      var r = 10 + Math.pow(Math.random(), 1.6) * 42;
      return { x: Math.random() * W, y: atBottom ? H + r + Math.random() * 120 : Math.random() * H, r: r, vx: (Math.random() - 0.5) * 0.02, vy: -0.01 - Math.random() * 0.03, ph: Math.random() * TAU };
    }
    function resize() {
      W = sec.clientWidth; H = sec.clientHeight; dpr = Math.min(1.5, window.devicePixelRatio || 1);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(clamp(W / 70, 8, 20));
      while (bubbles.length < n) bubbles.push(make(false));
      bubbles.length = n;
    }
    resize(); window.addEventListener('resize', function () { resize(); });
    var ptr = { x: -999, y: -999, vx: 0, vy: 0 }, scrollV = 0, lastY = window.scrollY;
    sec.addEventListener('pointermove', function (e) {
      var r = sec.getBoundingClientRect(), nx = e.clientX - r.left, ny = e.clientY - r.top;
      ptr.vx = nx - ptr.x; ptr.vy = ny - ptr.y; ptr.x = nx; ptr.y = ny;
    });
    sec.addEventListener('pointerleave', function () { ptr.x = ptr.y = -999; });
    sec.addEventListener('pointerdown', function (e) {
      if (e.target.closest('a, button')) return;
      var r = sec.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      for (var i = bubbles.length - 1; i >= 0; i--) {
        var b = bubbles[i];
        if ((b.x - x) * (b.x - x) + (b.y - y) * (b.y - y) < b.r * b.r * 1.3) { pops.push({ x: b.x, y: b.y, r: b.r, t: 0 }); bubbles[i] = make(true); break; }
      }
    });
    function step(dt) {
      var y = window.scrollY; scrollV += ((y - lastY) - scrollV) * 0.2; lastY = y;
      for (var i = 0; i < bubbles.length; i++) {
        var b = bubbles[i];
        b.ph += dt * 0.002;
        b.vy += (-0.000045 * (60 / b.r)) * dt;               // Auftrieb: kleine Blasen steigen schneller
        b.vy += scrollV * 0.00006 * dt;                      // Scroll schiebt mit
        b.vx += Math.sin(b.ph) * 0.000025 * dt;              // Taumeln
        var dx = b.x - ptr.x, dy = b.y - ptr.y, dd = dx * dx + dy * dy, R = b.r + 70;
        if (dd < R * R && dd > 1) { var f = (1 - Math.sqrt(dd) / R) * 0.0035 * dt; var inv = 1 / Math.sqrt(dd); b.vx += dx * inv * f + ptr.vx * 0.00025 * dt; b.vy += dy * inv * f + ptr.vy * 0.00025 * dt; }
        b.vx *= Math.pow(0.985, dt / 16); b.vy *= Math.pow(0.985, dt / 16);
        b.vy = clamp(b.vy, -0.25, 0.25); b.vx = clamp(b.vx, -0.25, 0.25);
        b.x += b.vx * dt; b.y += b.vy * dt;
        if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx) * 0.6; }
        if (b.x > W - b.r) { b.x = W - b.r; b.vx = -Math.abs(b.vx) * 0.6; }
        if (b.y < -b.r * 2) bubbles[i] = make(true);
      }
      for (var a = 0; a < bubbles.length; a++) for (var c = a + 1; c < bubbles.length; c++) {
        var p = bubbles[a], q = bubbles[c], ex = q.x - p.x, ey = q.y - p.y, min = p.r + q.r, d2 = ex * ex + ey * ey;
        if (d2 < min * min && d2 > 0.01) {
          var dist = Math.sqrt(d2), push = (min - dist) / dist * 0.5, mx = ex * push, my = ey * push;
          p.x -= mx * 0.5; p.y -= my * 0.5; q.x += mx * 0.5; q.y += my * 0.5;
          var tv = (q.vx - p.vx) * ex / dist + (q.vy - p.vy) * ey / dist;
          if (tv < 0) { var im = tv * 0.5; p.vx += im * ex / dist; p.vy += im * ey / dist; q.vx -= im * ex / dist; q.vy -= im * ey / dist; }
        }
      }
      ptr.vx *= 0.8; ptr.vy *= 0.8;
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < bubbles.length; i++) {
        var b = bubbles[i], s = 1 + Math.sin(b.ph * 2) * 0.03;
        ctx.drawImage(sprite, b.x - b.r * s, b.y - b.r / s, b.r * 2 * s, b.r * 2 / s);
      }
      for (var k = pops.length - 1; k >= 0; k--) {
        var p = pops[k]; p.t += 1 / 18;
        if (p.t >= 1) { pops.splice(k, 1); continue; }
        ctx.strokeStyle = 'rgba(25,195,209,' + (1 - p.t) * 0.8 + ')'; ctx.lineWidth = 1.5;
        for (var j = 0; j < 8; j++) {
          var a = j / 8 * TAU, r1 = p.r * (0.9 + p.t * 0.6), r2 = r1 + 6 + p.t * 10;
          ctx.beginPath(); ctx.moveTo(p.x + Math.cos(a) * r1, p.y + Math.sin(a) * r1); ctx.lineTo(p.x + Math.cos(a) * r2, p.y + Math.sin(a) * r2); ctx.stroke();
        }
      }
    }
    // gedrosselt auf ~30 fps, nur sichtbar
    function loop(now) {
      raf = 0; if (!on) return;
      var dt = clamp(now - (last || now), 0, 64); last = now; acc += dt;
      if (acc >= 32) { step(acc); draw(); acc = 0; }
      raf = requestAnimationFrame(loop);
    }
    new IntersectionObserver(function (es) {
      on = es[0].isIntersecting && !document.hidden;
      if (on && !raf) { last = 0; if (W !== sec.clientWidth || H !== sec.clientHeight) resize(); raf = requestAnimationFrame(loop); }
    }).observe(sec);
    document.addEventListener('visibilitychange', function () { on = !document.hidden && on; if (!document.hidden && !raf) raf = requestAnimationFrame(loop); });
  });

  /* Footer: „Blitzblank.“ wird beim Hinunterscrollen blank gezogen */
  stage(function initFooterWord() {
    var fill = qs('[data-word-fill]'); if (!fill) return;
    if (!enhanced) { fill.style.setProperty('--fill', '100%'); return; }
    ST.create({ trigger: '.site-footer', start: 'top bottom', end: 'top 25%', scrub: 0.4, onUpdate: function (s) { fill.style.setProperty('--fill', (s.progress * 100).toFixed(1) + '%'); } });
  });


  /* ------------------------------------------------------------------
     Anker-Navigation (Lenis-kompatibel)
     ------------------------------------------------------------------ */
  var tabsApi = null;
  function targetY(t) { return t.getBoundingClientRect().top + (window.scrollY || window.pageYOffset) - headerH() - 12; }
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
  stage(function initCalc() {
    var form = qs('[data-calc]');
    if (!form) return;
    var range = qs('[data-area-range]', form), num = qs('[data-area-num]', form);
    var intervalGroup = qs('[data-interval-group]', form), onceHint = qs('[data-once-hint]', form);
    var R = {
      receipt: qs('[data-receipt]', form), label: qs('[data-r-label]', form), low: qs('[data-r-low]', form), high: qs('[data-r-high]', form),
      live: qs('[data-r-live]', form), week: qsa('[data-week] span', form), weekWrap: qs('[data-week]', form), once: qs('[data-r-once]', form),
      visits: qs('[data-r-visits]', form), hours: qs('[data-r-hours]', form), team: qs('[data-r-team]', form), scope: qs('[data-r-scope]', form),
      peek: qs('[data-calc-peek]', form), peekLow: qs('[data-peek-low]', form), peekHigh: qs('[data-peek-high]', form), peekLabel: qs('[data-peek-label]', form)
    };
    if (R.peek) R.peek.hidden = false; // Mini-Preis (Handy): folgt beim Einstellen unten mit
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
    function setPrice(lo, hi) {
      R.low.textContent = fmt(lo); R.high.textContent = fmt(hi);
      if (R.peek) { R.peekLow.textContent = R.low.textContent; R.peekHigh.textContent = R.high.textContent; }
    }
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
      var obj = qs('[data-r-obj]', form);
      if (obj) obj.textContent = T.name + ' · ' + fmt(s.area) + '\u00A0m² · ' + (r.once ? 'einmalig' : CALC.INTERVALS[s.interval]);
      R.label.textContent = r.once ? 'Richtwert einmalig (netto)' : 'Richtwert pro Monat (netto)';
      if (R.peek) R.peekLabel.textContent = r.once ? 'Richtwert einmalig' : 'Richtwert / Monat';
      R.weekWrap.hidden = r.once; R.once.hidden = !r.once;
      var dts = qsa('.sheet__facts dt', form);
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
      R.team.textContent = r.team + (r.team === 1 ? ' Reinigungs\u00ADkraft' : ' Reinigungs\u00ADkräfte'); // weiches Trennzeichen für schmale Spalten
      // Leistungsumfang
      R.scope.textContent = '';
      var li, ix = 0;
      r.scope.forEach(function (t) { li = el('li', null, t); li.style.setProperty('--i', ix++); R.scope.appendChild(li); });
      r.extras.forEach(function (t) { li = el('li', 'is-extra', t); li.style.setProperty('--i', ix++); R.scope.appendChild(li); });
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
  });

  /* ------------------------------------------------------------------
     SIGNATURE 3 · Checklisten: Tabs + Akkordeon mit Häkchen
     ------------------------------------------------------------------ */
  stage(function initTabs() {
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
  });

  stage(function initAccordions() {
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
  });

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

  stage(function initPlz() {
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
  });

  /* ------------------------------------------------------------------
     SIGNATURE 5 · Karriere: Schichtmodelle + Bewerbung in 60 Sekunden
     ------------------------------------------------------------------ */
  var SHIFT_NAMES = { frueh: 'Frühschicht', tag: 'Tagschicht', abend: 'Abendschicht', samstag: 'Samstag' };
  var UMFANG_NAMES = { minijob: 'Minijob', teilzeit: 'Teilzeit', vollzeit: 'Vollzeit' };
  var careerState = { shifts: [], umfang: 'teilzeit' };
  stage(function initCareer() {
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
  });

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

  stage(function initApply() {
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
  });

  /* ------------------------------------------------------------------
     Kontakt / Begehung anfragen (+ Übernahme aus dem Rechner)
     ------------------------------------------------------------------ */
  stage(function initContact() {
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
  });

  /* ------------------------------------------------------------------
     Aktionsleiste: bei offener Bildschirmtastatur ausblenden
     ------------------------------------------------------------------ */
  stage(function initActionBar() {
    var bar = qs('.action-bar'); if (!bar) return;
    document.addEventListener('focusin', function (e) { if (e.target.matches('input:not([type=checkbox]):not([type=radio]):not([type=range]), select, textarea')) bar.classList.add('is-hidden'); });
    document.addEventListener('focusout', function () { setTimeout(function () { var a = document.activeElement; if (!a || !a.matches('input:not([type=checkbox]):not([type=radio]):not([type=range]), select, textarea')) bar.classList.remove('is-hidden'); }, 60); });
  });
  /* Start: erster Bildschirm ist fertig – Rest in Etappen */
  var calcApi = null;
  function boot() { setTimeout(drain, 30); }
  if (document.readyState === 'complete') boot(); else window.addEventListener('load', boot, { once: true });
  setTimeout(function () { if (queue.length) drain(); }, 1200);
  if (enhanced && document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (!queue.length && document.readyState === 'complete') ST.refresh(); });
})();
