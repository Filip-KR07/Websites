/* ==========================================================================
   Tanzschule Taktvoll – Modell „Drehung“ · main.js
   Ohne Build, ohne externe Requests. GSAP/ScrollTrigger/Lenis liegen lokal.
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------------
     Konstanten – hier lassen sich Preise, Tempi und Kursvorschläge anpassen.
     ------------------------------------------------------------------------ */

  // Hochzeitstanz-Paket (Euro, pro Paar). Unverbindliche Beispielrechnung.
  var WED_PRICE_PER_HOUR = 72;                      // Privatstunde à 45 Minuten
  var WED_STYLE = {                                 // Aufschlag für Choreografie-Ausarbeitung
    klassisch: { label: 'Choreografie klassisch', add: 0, minHours: 2 },
    romantisch: { label: 'Choreografie romantisch (eigene Figurenfolge)', add: 60, minHours: 3 },
    show: { label: 'Show-Mix mit Stilwechsel', add: 180, minHours: 5 }
  };
  var WED_MIX_EDIT = 45;                            // Medley-Schnitt des Liedes
  var WED_VIDEO = 35;                               // Übungsvideo
  var WED_WEEKEND_PER_HOUR = 10;                    // Wochenendzuschlag je Stunde
  var VINYL_RATE = { slow: 0.6, mid: 1, mix: 1.55 };// Drehgeschwindigkeit der Platte je Tempo

  // Schritt-Lehrer: Tempo-Bereiche (BPM = Schläge pro Minute)
  // Fußpositionen im 400×400-Raster: [x, y, Drehung in Grad]. Sicht der führenden Person.
  var DANCES = {
    walzer: {
      bpm: { min: 60, max: 120, def: 87 }, beatsPerBar: 3,
      hint: 'Turniertempo Langsamer Walzer: 84–90 BPM. Zum Lernen ruhig langsamer.',
      start: { L: [185, 260, 0], R: [215, 260, 0] },
      steps: [
        { f: 'L', to: [185, 180, 0], c: '1', d: 1, t: 'Links vor' },
        { f: 'R', to: [265, 180, 0], c: '2', d: 1, t: 'Rechts seit' },
        { f: 'L', to: [235, 180, 0], c: '3', d: 1, t: 'Links schließen' },
        { f: 'R', to: [265, 260, 0], c: '1', d: 1, t: 'Rechts rück' },
        { f: 'L', to: [185, 260, 0], c: '2', d: 1, t: 'Links seit' },
        { f: 'R', to: [215, 260, 0], c: '3', d: 1, t: 'Rechts schließen' }
      ]
    },
    chacha: {
      bpm: { min: 90, max: 140, def: 120 }, beatsPerBar: 4,
      hint: 'Turniertempo Cha-Cha: 120–128 BPM. Gezählt wird „2 – 3 – Cha-Cha-Cha“.',
      start: { L: [202, 220, -6], R: [267, 220, 6] },
      steps: [
        { f: 'L', to: [202, 150, -4], c: '2', d: 1, t: 'Links vor' },
        { f: 'R', stay: true, c: '3', d: 1, t: 'Gewicht zurück auf rechts' },
        { f: 'L', to: [167, 220, -6], c: '4', d: 0.5, t: 'Links seit' },
        { f: 'R', to: [197, 220, 6], c: '&', d: 0.5, t: 'Rechts ran' },
        { f: 'L', to: [132, 220, -6], c: '1', d: 1, t: 'Links seit' },
        { f: 'R', to: [197, 290, 4], c: '2', d: 1, t: 'Rechts rück' },
        { f: 'L', stay: true, c: '3', d: 1, t: 'Gewicht vor auf links' },
        { f: 'R', to: [232, 220, 6], c: '4', d: 0.5, t: 'Rechts seit' },
        { f: 'L', to: [202, 220, -6], c: '&', d: 0.5, t: 'Links ran' },
        { f: 'R', to: [267, 220, 6], c: '1', d: 1, t: 'Rechts seit' }
      ]
    },
    discofox: {
      bpm: { min: 100, max: 140, def: 124 }, beatsPerBar: 4,
      hint: 'Discofox wird meist zwischen 120 und 130 BPM getanzt – also zu fast jedem Partylied.',
      start: { L: [185, 240, -4], R: [215, 240, 4] },
      steps: [
        { f: 'L', to: [185, 300, -4], c: '1', d: 1, t: 'Links rück' },
        { f: 'R', stay: true, c: '2', d: 1, t: 'Gewicht vor auf rechts' },
        { f: 'L', to: [185, 240, -4], c: '3', d: 1, t: 'Links ran' },
        { f: 'R', stay: true, tap: true, c: '4', d: 1, t: 'Rechts tippen, ohne Gewicht' }
      ]
    }
  };
  var FOOT_SCALE = 0.95;

  // Tanz-Finder: Anlass × Erfahrung → Kursvorschlag
  var FINDER = {
    hochzeit: {
      e1: { t: 'Hochzeitstanz-Crashkurs', when: 'Mittwoch, 19:30–20:45 Uhr · Saal 1', why: 'Vier Abende mit anderen Brautpaaren: Langsamer Walzer oder Discofox, dazu eine schöne Schlussfigur. Ihr Lied bringen Sie mit.', course: 'Hochzeitstanz-Crashkurs', day: 'mi' },
      e2: { t: 'Hochzeitstanz-Workshop', when: 'Samstag, 14:00–17:00 Uhr · Saal 1', why: 'Ein Nachmittag zum Auffrischen: Was Sie noch können, übertragen wir auf Ihr Lied – mit Sofia und Daniel gleichzeitig im Saal.', course: 'Hochzeitstanz-Workshop', day: 'sa' },
      e3: { t: 'Privatstunden mit eigener Choreografie', when: 'Termine nach Absprache · Saal 1 oder 3', why: 'Die Grundschritte sitzen? Dann lohnt sich eine Choreografie, die genau auf Ihr Lied passt. Den Preis rechnen Sie im Paket-Konfigurator aus.', course: 'Hochzeitstanz privat', link: '#hochzeit', linkText: 'Paket zusammenstellen' }
    },
    party: {
      e1: { t: 'Discofox Einsteiger', when: 'Donnerstag, 19:00–20:15 Uhr · Saal 1', why: 'Discofox passt zu fast jedem Lied auf Feiern. Nach sechs Abenden tanzen Sie Grundschritt, Drehungen und erste Figuren.', course: 'Discofox Einsteiger', day: 'do' },
      e2: { t: 'Discofox-Crashkurs', when: 'Freitag, 19:00–20:15 Uhr · Saal 1', why: 'Auffrischen am Freitag – und danach direkt auf der Tanzparty ausprobieren. Für Kursteilnehmer ist der Eintritt frei.', course: 'Discofox-Crashkurs', day: 'fr' },
      e3: { t: 'Gesellschaftstanz Fortgeschritten', when: 'Dienstag, 20:15–21:30 Uhr · Saal 1', why: 'Walzer, Foxtrott, Cha-Cha und Jive mit neuen Figuren und mehr Führung – für Bälle, auf denen Sie die Tanzfläche gern nutzen.', course: 'Gesellschaftstanz Fortgeschritten', day: 'di' }
    },
    fitness: {
      e1: { t: 'Latin Fitness', when: 'Dienstag, 20:30–21:30 Uhr · Saal 3', why: 'Salsa- und Merengue-Schritte als Workout – ohne Partner und ohne Vorkenntnisse. Dass Sie geschwitzt haben, merken Sie erst hinterher.', course: 'Latin Fitness', day: 'di' },
      e2: { t: 'Hip-Hop Erwachsene', when: 'Mittwoch, 18:00–19:00 Uhr · Saal 2', why: 'Eine Stunde Grooves und kurze Choreos zu aktuellen Tracks. Fordert Ausdauer und Koordination – Malik zählt klar ein.', course: 'Hip-Hop Erwachsene', day: 'mi' },
      e3: { t: 'Salsa Rueda', when: 'Samstag, 16:30–17:45 Uhr · Saal 2', why: 'Salsa im Kreis mit ständigem Partnerwechsel, angesagt von Carla – schnell, gesellig und ein ehrliches Ausdauertraining.', course: 'Salsa Rueda', day: 'sa' }
    },
    kinder: {
      e1: { t: 'Eltern-Kind-Tanz 3–4 Jahre', when: 'Samstag, 10:00–10:45 Uhr · Saal 3', why: 'Singen, Klatschen, kleine Tänze – gemeinsam mit Mama oder Papa. Der Einstieg für die Kleinsten.', course: 'Eltern-Kind-Tanz 3–4 Jahre', day: 'sa' },
      e2: { t: 'Kindertanz 4–6 Jahre', when: 'Montag oder Donnerstag, 17:00–17:45 Uhr · Saal 3', why: 'Rhythmusspiele, Bewegungsgeschichten und ein kleiner Tanz, der am Ende des Halbjahres vorgeführt wird.', course: 'Kindertanz 4–6 Jahre', day: 'mo' },
      e3: { t: 'Hip-Hop Kids 8–11', when: 'Freitag, 17:00–17:45 Uhr · Saal 2', why: 'Coole Moves, kurze Choreos, viel Bewegung. Wer lieber zu Pop tanzt: Kindertanz 7–10 Jahre am Dienstag.', course: 'Hip-Hop Kids 8–11', day: 'fr' }
    }
  };
  var EXP_LABELS = {
    def: { legend: 'Wie viel Tanzerfahrung haben Sie?', t1: 'Noch gar keine', s1: 'Ich fange bei null an', t2: 'Ein bisschen', s2: 'Abschlussball, lange her', t3: 'Schon sicher', s3: 'Grundschritte sitzen' },
    kinder: { legend: 'Wie alt ist Ihr Kind?', t1: '3–4 Jahre', s1: 'mit Mama oder Papa', t2: '4–6 Jahre', s2: 'erste eigene Stunde', t3: '7–12 Jahre', s3: 'will richtig loslegen' }
  };

  var DAY_KEYS = ['so', 'mo', 'di', 'mi', 'do', 'fr', 'sa'];
  var DAY_NAMES = { mo: 'Montag', di: 'Dienstag', mi: 'Mittwoch', do: 'Donnerstag', fr: 'Freitag', sa: 'Samstag', so: 'Sonntag' };
  var LEVEL_NAMES = { alle: 'alle Niveaus', einsteiger: 'Einsteiger', aufbau: 'Aufbau', fortgeschritten: 'Fortgeschrittene' };
  var MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

  /* ------------------------------------------------------------------------ */
  var doc = document, root = doc.documentElement;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var REDUCE = root.classList.contains('reduce');
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasGSAP = function () { return typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined'; };
  var lenis = null;
  var euro = function (n) { return n.toLocaleString('de-DE') + ' €'; };
  var headH = function () { return ($('.site-head') || {}).offsetHeight || 72; };

  function scrollToEl(el) {
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: -headH() - 8, duration: 1.1 });
    else {
      var y = el.getBoundingClientRect().top + window.pageYOffset - headH() - 8;
      window.scrollTo({ top: y, behavior: REDUCE ? 'auto' : 'smooth' });
    }
  }

  /* ---------- 1) Header, Menü, Fortschritt (sofort) ---------- */
  function initHeader() {
    var head = $('.site-head'), btn = $('.menu-btn'), nav = $('#nav'), bar = $('.progress__bar');
    var ticking = false;
    function onScroll() {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        var y = window.pageYOffset, max = doc.documentElement.scrollHeight - window.innerHeight;
        head.classList.toggle('is-scrolled', y > 30);
        if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0).toFixed(4) + ')';
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    function setOpen(open) {
      btn.setAttribute('aria-expanded', String(open));
      head.classList.toggle('is-open', open);
      if (open) { var a = $('a', nav); if (a) a.focus(); }
    }
    btn.addEventListener('click', function () { setOpen(btn.getAttribute('aria-expanded') !== 'true'); });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') { setOpen(false); btn.focus(); }
    });
    $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { if (btn.getAttribute('aria-expanded') === 'true') setOpen(false); }); });

    // In-Page-Anker: weiches Scrollen, Kursvorauswahl
    doc.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var target = doc.getElementById(id.slice(1));
      if (!target) return;
      var course = a.getAttribute('data-course');
      if (course) preselectCourse(course);
      var day = a.getAttribute('data-day');
      if (day && window.__selectDay) window.__selectDay(day, false);
      e.preventDefault();
      scrollToEl(target);
      if (history.replaceState) history.replaceState(null, '', id);
      // Fokus für Tastatur-/Screenreader-Nutzer mitnehmen
      setTimeout(function () {
        var f = id === '#kontakt' ? $('#c-name') : target;
        if (f === target && !target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
        if (f && f.focus) f.focus({ preventScroll: true });
      }, lenis ? 900 : 50);
    });
  }

  function preselectCourse(name) {
    var sel = $('#c-kurs');
    if (!sel) return;
    for (var i = 0; i < sel.options.length; i++) {
      if (sel.options[i].text === name) { sel.selectedIndex = i; return; }
    }
  }

  /* ---------- 2) Hero: Spotlight folgt der Maus ---------- */
  function initHero() {
    var hero = $('.hero'), spot = $('.hero__spot'), cone = $('.hero__cone');
    if (!hero || !spot) return;
    // Pausieren außerhalb des Viewports / bei verstecktem Tab
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { hero.classList.toggle('is-paused', !en[0].isIntersecting); }).observe(hero);
    }
    doc.addEventListener('visibilitychange', function () { hero.classList.toggle('is-paused', doc.hidden); });
    if (REDUCE || !finePointer) return;   // Touch: Spotlight wandert per CSS-Animation

    var pos = null, target = { x: 0, y: 0 }, raf = 0;
    function readCurrent() {
      var m = getComputedStyle(spot).transform, x = window.innerWidth * 0.66, y = window.innerHeight * 0.52;
      if (m && m !== 'none') { var v = m.match(/-?[\d.]+/g); if (v) { x = parseFloat(v[4]); y = parseFloat(v[5]); } }
      return { x: x, y: y };
    }
    function tick() {
      raf = 0;
      pos.x += (target.x - pos.x) * 0.12;
      pos.y += (target.y - pos.y) * 0.12;
      spot.style.transform = 'translate3d(' + pos.x.toFixed(1) + 'px,' + pos.y.toFixed(1) + 'px,0)';
      if (cone) {
        var w = hero.offsetWidth, h = hero.offsetHeight;
        var ang = Math.atan2(pos.x - w / 2, pos.y + h * 0.08) * 180 / Math.PI;
        cone.style.transform = 'rotate(' + Math.max(-38, Math.min(38, -ang)).toFixed(2) + 'deg)';
      }
      if (Math.abs(target.x - pos.x) > 0.5 || Math.abs(target.y - pos.y) > 0.5) raf = requestAnimationFrame(tick);
    }
    hero.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      var r = hero.getBoundingClientRect();
      if (!pos) { pos = readCurrent(); spot.classList.add('is-follow'); if (cone) cone.classList.add('is-follow'); }
      target.x = e.clientX - r.left; target.y = e.clientY - r.top;
      if (!raf) raf = requestAnimationFrame(tick);
    });
  }

  /* ---------- 3) Lenis + GSAP ---------- */
  function initSmooth() {
    if (!hasGSAP()) return;
    gsap.registerPlugin(ScrollTrigger);
    if (!REDUCE && typeof window.Lenis !== 'undefined') {
      lenis = new Lenis({ duration: 1.05, smoothWheel: true });
      window.__lenis = lenis;
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    }
  }

  function initScrollMotion() {
    if (!hasGSAP() || REDUCE) return;
    // Takt-Band läuft mit dem Scrollen
    var band = $('.beat-band__track');
    if (band) {
      gsap.fromTo(band, { x: 0 }, { x: function () { return -Math.max(0, band.scrollWidth - window.innerWidth) * 0.6; }, ease: 'none',
        scrollTrigger: { trigger: '.beat-band', start: 'top bottom', end: 'bottom top', scrub: 0.5, invalidateOnRefresh: true } });
    }
    // Kurse: horizontale Strecke per position: sticky, nur Bewegung per Scrub
    var sec = $('.kurse'), track = $('.kurse__track'), vp = $('.kurse__viewport'), now = $('.kurse__counter-now');
    var mm = gsap.matchMedia();
    mm.add('(min-width: 900px)', function () {
      sec.classList.add('is-h');
      var dist = 0;
      function measure() {
        sec.style.height = '';
        dist = Math.max(0, track.scrollWidth - vp.clientWidth);
        sec.style.height = (window.innerHeight + dist) + 'px';
      }
      measure();
      ScrollTrigger.addEventListener('refreshInit', measure);
      var count = track.children.length;
      var tw = gsap.to(track, { x: function () { return -dist; }, ease: 'none',
        scrollTrigger: { trigger: sec, start: 'top top', end: function () { return '+=' + dist; }, scrub: 0.6, invalidateOnRefresh: true,
          onUpdate: function (st) { var i = Math.min(count, Math.round(st.progress * (count - 1)) + 1); if (now) now.textContent = (i < 10 ? '0' : '') + i; } } });
      return function () {
        ScrollTrigger.removeEventListener('refreshInit', measure);
        tw.scrollTrigger && tw.scrollTrigger.kill(); tw.kill();
        gsap.set(track, { clearProps: 'transform' });
        sec.classList.remove('is-h'); sec.style.height = '';
      };
    });
  }

  /* ---------- 4) Reveals ---------- */
  function initReveal() {
    var els = $$('[data-reveal]');
    if (REDUCE || !('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add('is-in'); }); return; }
    els.forEach(function (el) {
      var sib = $$('[data-reveal]', el.parentElement).filter(function (s) { return s.parentElement === el.parentElement; });
      var i = sib.indexOf(el);
      if (i > 0) el.style.transitionDelay = Math.min(i, 4) * 70 + 'ms';
    });
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-in'); io.unobserve(e.target);
          setTimeout(function () { e.target.style.transitionDelay = ''; }, 1200);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 5) Aktive Navigation ---------- */
  function initNavSpy() {
    if (!('IntersectionObserver' in window)) return;
    var links = {};
    $$('.nav a').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) {
        var a = links[e.target.id];
        if (!a) return;
        if (e.isIntersecting) { $$('.nav a[aria-current]').forEach(function (x) { x.removeAttribute('aria-current'); }); a.setAttribute('aria-current', 'true'); }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(links).forEach(function (id) { var s = doc.getElementById(id); if (s) io.observe(s); });
  }

  /* ---------- 6) Tanz-Finder ---------- */
  function initFinder() {
    var form = $('#finder-form'), card = $('#finder-result');
    if (!form || !card) return;
    var t = $('#fr-title'), when = $('#fr-when'), why = $('#fr-why'), cta = $('#fr-cta'), plan = $('#fr-plan');
    var lastKey = '';
    function labels(anlass) {
      var L = anlass === 'kinder' ? EXP_LABELS.kinder : EXP_LABELS.def;
      $('#exp-legend').textContent = L.legend;
      $$('[data-exp]', form).forEach(function (el) { el.textContent = L[el.getAttribute('data-exp')]; });
    }
    function render(animate) {
      var a = form.elements.anlass.value, e = form.elements.erfahrung.value;
      var key = a + e;
      if (key === lastKey) return;
      lastKey = key;
      labels(a);
      var r = FINDER[a][e];
      function apply() {
        t.textContent = r.t; when.textContent = r.when; why.textContent = r.why;
        cta.setAttribute('data-course', r.course);
        if (r.link) { plan.setAttribute('href', r.link); plan.textContent = r.linkText; plan.removeAttribute('data-day'); }
        else { plan.setAttribute('href', '#kursplan'); plan.textContent = 'Im Kursplan zeigen'; plan.setAttribute('data-day', r.day); }
      }
      if (!animate || REDUCE) { apply(); return; }
      card.classList.add('is-swap');
      setTimeout(function () { apply(); card.classList.remove('is-swap'); }, 130);
    }
    form.addEventListener('change', function () { render(true); });
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    render(false);
  }

  /* ---------- 7) Schritt-Lehrer ---------- */
  function initSteps() {
    var stage = $('#steps-panel');
    if (!stage) return;
    var NS = 'http://www.w3.org/2000/svg';
    var feet = { L: $('#foot-L'), R: $('#foot-R') };
    var ghostsG = $('#floor-ghosts'), countList = $('#count-list'), stepsList = $('#steps-list');
    var nowC = $('#now-count'), nowT = $('#now-text');
    var bpmIn = $('#bpm'), bpmOut = $('#bpm-out'), bpmHint = $('#bpm-hint');
    var playBtn = $('#steps-play'), clickBox = $('#steps-click');
    var tabs = $$('.tabs .tab');
    var pulse = doc.createElementNS(NS, 'circle');
    pulse.setAttribute('r', '30'); pulse.setAttribute('class', 'pulse');
    $('#floor-feet').appendChild(pulse);

    var state = { dance: 'walzer', role: 'lead', bpm: 87, i: -1, playing: false, timer: 0, next: 0 };
    var seq = null;   // aufbereitete Schrittfolge
    var audio = null;

    function swapWords(s) {
      return s.replace(/Links|links|Rechts|rechts|vor|rück/g, function (w) {
        return { Links: 'Rechts', links: 'rechts', Rechts: 'Links', rechts: 'links', vor: 'rück', 'rück': 'vor' }[w];
      });
    }
    function mapPos(p, role) {
      if (role === 'lead') return p;
      return [400 - p[0], 440 - p[1], p[2] + 180];   // Punktspiegelung: Folgende steht gegenüber
    }
    function build() {
      var D = DANCES[state.dance], role = state.role;
      var other = function (f) { return role === 'lead' ? f : (f === 'L' ? 'R' : 'L'); };
      var pos = { L: null, R: null };
      pos[other('L')] = mapPos(D.start.L, role);
      pos[other('R')] = mapPos(D.start.R, role);
      var start = { L: pos.L.slice(), R: pos.R.slice() };
      var steps = D.steps.map(function (s) {
        var f = other(s.f);
        if (!s.stay) pos[f] = mapPos(s.to, role);
        return { f: f, at: pos[f].slice(), stay: !!s.stay, tap: !!s.tap, c: s.c, d: s.d, t: role === 'lead' ? s.t : swapWords(s.t) };
      });
      seq = { start: start, steps: steps };
    }
    function footTransform(p) { return 'translate(' + p[0] + 'px,' + p[1] + 'px) rotate(' + p[2] + 'deg) scale(' + FOOT_SCALE + ')'; }
    function placeFeet(instant) {
      ['L', 'R'].forEach(function (f) {
        var el = feet[f];
        if (instant) el.style.transition = 'none';
        el.style.transform = footTransform(seq.start[f]);
        el.classList.remove('is-active');
        if (instant) { el.getBoundingClientRect(); el.style.transition = ''; }
      });
    }
    function renderStatic() {
      // Geisterspuren mit Zählzeiten
      while (ghostsG.firstChild) ghostsG.removeChild(ghostsG.firstChild);
      seq.steps.forEach(function (s, i) {
        if (s.stay) return;
        var g = doc.createElementNS(NS, 'g');
        g.setAttribute('class', 'ghost'); g.setAttribute('data-i', i);
        var u = doc.createElementNS(NS, 'use');
        u.setAttribute('href', '#fp');
        var sx = s.f === 'R' ? -FOOT_SCALE : FOOT_SCALE;
        u.setAttribute('transform', 'translate(' + s.at[0] + ' ' + s.at[1] + ') rotate(' + s.at[2] + ') scale(' + sx + ' ' + FOOT_SCALE + ')');
        var tx = doc.createElementNS(NS, 'text');
        var off = s.f === 'L' ? -26 : 26;
        tx.setAttribute('x', s.at[0] + off); tx.setAttribute('y', s.at[1] + 5); tx.setAttribute('text-anchor', 'middle');
        tx.textContent = s.c;
        g.appendChild(u); g.appendChild(tx); ghostsG.appendChild(g);
      });
      // Zählzeiten-Leiste und Liste
      while (countList.firstChild) countList.removeChild(countList.firstChild);
      while (stepsList.firstChild) stepsList.removeChild(stepsList.firstChild);
      seq.steps.forEach(function (s) {
        var li = doc.createElement('li'); li.textContent = s.c; if (s.c === '&') li.className = 'is-half'; countList.appendChild(li);
        var li2 = doc.createElement('li'); li2.textContent = s.c + ' – ' + s.t; stepsList.appendChild(li2);
      });
      $('#role-label').textContent = state.role === 'lead' ? 'führenden' : 'folgenden';
      nowC.textContent = '–'; nowT.textContent = 'Bereit – drücken Sie auf Start';
      placeFeet(true);
      state.i = -1;
    }
    function setActive(i) {
      $$('li', countList).forEach(function (li, k) { li.classList.toggle('is-on', k === i); });
      $$('li', stepsList).forEach(function (li, k) { li.classList.toggle('is-on', k === i); });
      $$('.ghost', ghostsG).forEach(function (g) { g.classList.toggle('is-on', +g.getAttribute('data-i') === i); });
    }
    function click(accent) {
      if (!clickBox.checked) return;
      try {
        if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
        var o = audio.createOscillator(), g = audio.createGain(), t0 = audio.currentTime;
        o.frequency.value = accent ? 1560 : 1040;
        g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.25, t0 + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.06);
        o.connect(g); g.connect(audio.destination); o.start(t0); o.stop(t0 + 0.07);
      } catch (e) { /* ohne Ton weiter */ }
    }
    function doStep() {
      state.i = (state.i + 1) % seq.steps.length;
      var s = seq.steps[state.i], beat = 60000 / state.bpm, dur = s.d * beat;
      var el = feet[s.f];
      feet.L.classList.toggle('is-active', s.f === 'L');
      feet.R.classList.toggle('is-active', s.f === 'R');
      if (!s.stay) {
        el.style.transitionDuration = REDUCE ? '0ms' : Math.round(Math.min(320, dur * 0.7)) + 'ms';
        el.style.transform = footTransform(s.at);
      }
      if ((s.stay || s.tap) && !REDUCE) {
        var p = feet[s.f].style.transform.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px/);
        if (p) {
          pulse.setAttribute('cx', p[1]); pulse.setAttribute('cy', p[2]);
          pulse.animate([{ opacity: 0.9, transform: 'scale(0.6)' }, { opacity: 0, transform: 'scale(1.3)' }], { duration: Math.min(500, dur), easing: 'cubic-bezier(0.23, 1, 0.32, 1)' });
        }
      }
      setActive(state.i);
      nowC.textContent = s.c; nowT.textContent = s.t;
      click(state.i === 0 || s.c === '1');
      return dur;
    }
    function loop() {
      if (!state.playing) return;
      var dur = doStep();
      state.next += dur;
      state.timer = setTimeout(loop, Math.max(0, state.next - performance.now()));
    }
    function play(on) {
      state.playing = on;
      playBtn.setAttribute('aria-pressed', String(on));
      $('.btn__label', playBtn).textContent = on ? 'Pause' : 'Start';
      clearTimeout(state.timer);
      if (on) { state.next = performance.now(); loop(); }
    }
    function setBpmUi() {
      var D = DANCES[state.dance];
      bpmIn.min = D.bpm.min; bpmIn.max = D.bpm.max;
      bpmIn.value = state.bpm;
      var bars = state.bpm / D.beatsPerBar;
      bpmOut.textContent = state.bpm + ' BPM';
      bpmIn.setAttribute('aria-valuetext', state.bpm + ' Schläge pro Minute, etwa ' + Math.round(bars) + ' Takte pro Minute');
      bpmIn.style.setProperty('--fill', ((state.bpm - D.bpm.min) / (D.bpm.max - D.bpm.min) * 100).toFixed(1) + '%');
    }
    function selectDance(key, focus) {
      var was = state.playing;
      play(false);
      state.dance = key; state.bpm = DANCES[key].bpm.def;
      tabs.forEach(function (tb) {
        var on = tb.getAttribute('data-dance') === key;
        tb.setAttribute('aria-selected', String(on)); tb.tabIndex = on ? 0 : -1;
        if (on) { stage.setAttribute('aria-labelledby', tb.id); if (focus) tb.focus(); }
      });
      bpmHint.textContent = DANCES[key].hint;
      setBpmUi(); build(); renderStatic();
      if (was) play(true);
    }
    tabs.forEach(function (tb, idx) {
      tb.addEventListener('click', function () { selectDance(tb.getAttribute('data-dance'), false); });
      tb.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight') n = (idx + 1) % tabs.length;
        else if (e.key === 'ArrowLeft') n = (idx - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') n = 0; else if (e.key === 'End') n = tabs.length - 1;
        if (n !== null) { e.preventDefault(); selectDance(tabs[n].getAttribute('data-dance'), true); }
      });
    });
    bpmIn.addEventListener('input', function () { state.bpm = +bpmIn.value; setBpmUi(); });
    playBtn.addEventListener('click', function () { play(!state.playing); });
    $$('.seg__btn', stage.parentElement).forEach(function (b) {
      b.addEventListener('click', function () {
        var was = state.playing; play(false);
        state.role = b.getAttribute('data-role');
        $$('.seg__btn', stage.parentElement).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        build(); renderStatic();
        if (was) play(true);
      });
    });
    clickBox.addEventListener('change', function () { if (clickBox.checked && !audio) click(false); });
    // Außerhalb des Viewports / bei verstecktem Tab pausieren
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { if (!en[0].isIntersecting && state.playing) play(false); }).observe(stage);
    }
    doc.addEventListener('visibilitychange', function () { if (doc.hidden && state.playing) play(false); });
    selectDance('walzer', false);
  }

  /* ---------- 8) Kursplan ---------- */
  function initPlan() {
    var wrap = $('#plan-days'), tabs = $$('#days .day'), chips = $$('.levels .chip'), status = $('#plan-status');
    if (!wrap) return;
    wrap.classList.add('is-tabs');
    var level = 'alle', day = DAY_KEYS[new Date().getDay()];
    var todayBtn = $('#tab-' + day); if (todayBtn) todayBtn.classList.add('is-today');
    function apply(announce) {
      tabs.forEach(function (tb) {
        var d = tb.getAttribute('data-day'), on = d === day;
        tb.setAttribute('aria-selected', String(on)); tb.tabIndex = on ? 0 : -1;
        var n = $$('#tag-' + d + ' .plan-item').filter(function (li) { return level === 'alle' || li.getAttribute('data-level') === level || li.getAttribute('data-level') === 'offen'; }).length;
        $('.day__n', tb).textContent = n;
      });
      var visible = 0;
      $$('.plan-day').forEach(function (sec) {
        var on = sec.getAttribute('data-day') === day;
        sec.classList.toggle('is-active', on);
        var c = 0;
        $$('.plan-item', sec).forEach(function (li) {
          var lv = li.getAttribute('data-level');
          var show = level === 'alle' || lv === level || lv === 'offen';
          li.classList.toggle('is-out', !show);
          if (show) c++;
        });
        $('.plan-empty', sec).hidden = c > 0;
        if (on) visible = c;
      });
      if (announce) status.textContent = DAY_NAMES[day] + ': ' + visible + (visible === 1 ? ' Kurs' : ' Kurse') + ' für ' + LEVEL_NAMES[level] + '.';
    }
    function select(d, focus) {
      day = d; apply(true);
      if (focus) { var b = $('#tab-' + d); if (b) b.focus(); }
    }
    window.__selectDay = select;
    tabs.forEach(function (tb, idx) {
      tb.addEventListener('click', function () { select(tb.getAttribute('data-day'), false); });
      tb.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight') n = (idx + 1) % tabs.length;
        else if (e.key === 'ArrowLeft') n = (idx - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') n = 0; else if (e.key === 'End') n = tabs.length - 1;
        if (n !== null) { e.preventDefault(); select(tabs[n].getAttribute('data-day'), true); }
      });
    });
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        level = c.getAttribute('data-level');
        chips.forEach(function (x) { x.setAttribute('aria-pressed', String(x === c)); });
        apply(true);
      });
    });
    apply(false);
  }

  /* ---------- 9) Hochzeitstanz-Konfigurator ---------- */
  function initWedding() {
    var form = $('#wed-form');
    if (!form) return;
    var hours = $('#wed-hours'), hoursOut = $('#wed-hours-out'), song = $('#wed-song'), tempo = $('#wed-tempo');
    var priceEl = $('#wed-price'), list = $('#wed-breakdown'), warn = $('#wed-warn'), vinylSong = $('#vinyl-song'), vinyl = $('#vinyl');
    var disc = $('.vinyl__disc', vinyl);
    var shown = 0, anim = null, spin = null, inView = false;

    if (!REDUCE && disc.animate) {
      spin = disc.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], { duration: 2400, iterations: Infinity });
      spin.pause();
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (en) {
          inView = en[0].isIntersecting;
          if (inView && !doc.hidden) { spin.play(); vinyl.classList.add('is-playing'); } else { spin.pause(); vinyl.classList.remove('is-playing'); }
        }).observe(vinyl);
      }
      doc.addEventListener('visibilitychange', function () { if (doc.hidden) spin.pause(); else if (inView) spin.play(); });
    }

    function row(label, val) {
      var li = doc.createElement('li'), a = doc.createElement('span'), b = doc.createElement('span');
      a.textContent = label; b.textContent = val; li.appendChild(a); li.appendChild(b); return li;
    }
    function countTo(n) {
      if (anim) cancelAnimationFrame(anim);
      if (REDUCE) { shown = n; priceEl.textContent = n.toLocaleString('de-DE'); return; }
      var from = shown, t0 = performance.now(), D = 260;
      (function step(t) {
        var p = Math.min(1, (t - t0) / D), e = 1 - Math.pow(1 - p, 3);
        shown = Math.round(from + (n - from) * e);
        priceEl.textContent = shown.toLocaleString('de-DE');
        if (p < 1) anim = requestAnimationFrame(step);
      })(t0);
    }
    function calc() {
      var h = +hours.value, style = form.elements['wed-style'].value, tp = tempo.value;
      var extras = $$('input[name="wed-extra"]:checked', form).map(function (x) { return x.value; });
      hoursOut.textContent = h + (h === 1 ? ' Stunde' : ' Stunden');
      hours.setAttribute('aria-valuetext', h + ' Privatstunden');
      hours.style.setProperty('--fill', ((h - hours.min) / (hours.max - hours.min) * 100).toFixed(1) + '%');
      var total = h * WED_PRICE_PER_HOUR;
      while (list.firstChild) list.removeChild(list.firstChild);
      list.appendChild(row(h + ' × Privatstunde à ' + WED_PRICE_PER_HOUR + ' €', euro(h * WED_PRICE_PER_HOUR)));
      var S = WED_STYLE[style];
      list.appendChild(row(S.label, S.add ? euro(S.add) : 'inklusive'));
      total += S.add;
      if (tp === 'mix') { total += WED_MIX_EDIT; list.appendChild(row('Medley-Schnitt Ihres Liedes', euro(WED_MIX_EDIT))); }
      if (extras.indexOf('video') > -1) { total += WED_VIDEO; list.appendChild(row('Übungsvideo', euro(WED_VIDEO))); }
      if (extras.indexOf('weekend') > -1) { total += h * WED_WEEKEND_PER_HOUR; list.appendChild(row('Wochenendtermine (' + h + ' × ' + WED_WEEKEND_PER_HOUR + ' €)', euro(h * WED_WEEKEND_PER_HOUR))); }
      if (extras.indexOf('dress') > -1) list.appendChild(row('Generalprobe in Schuhen und Kleid', 'inklusive'));
      countTo(total);
      if (h < S.minHours) { warn.hidden = false; warn.textContent = 'Für „' + S.label.replace(/^Choreografie /, '') + '“ empfehlen wir mindestens ' + S.minHours + ' Stunden – sonst bleibt zum Üben kaum Zeit.'; }
      else warn.hidden = true;
      var title = song.value.trim();
      vinylSong.textContent = title || 'Ihr Lied';
      if (spin) spin.updatePlaybackRate(VINYL_RATE[tp] || 1);
      var cta = $('#wed-cta');
      cta.setAttribute('data-course', 'Hochzeitstanz privat');
      cta.setAttribute('data-summary', h + ' Stunden, ' + S.label + (title ? ', Lied: ' + title : '') + ', ca. ' + euro(total));
    }
    form.addEventListener('input', calc);
    form.addEventListener('change', calc);
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    $('#wed-cta').addEventListener('click', function () {
      var msg = $('#c-msg'), s = this.getAttribute('data-summary');
      if (msg && s && !msg.value.trim()) msg.value = 'Hochzeitstanz-Paket: ' + s;
    });
    calc();
  }

  /* ---------- 10) Kontaktformular ---------- */
  function initForm() {
    var form = $('#contact-form'), done = $('#form-done'), sum = $('#form-sum');
    if (!form) return;
    var name = $('#c-name'), mail = $('#c-mail'), ok = $('#c-ok');
    function setErr(input, id, msg) {
      var p = $('#' + id); p.textContent = msg;
      input.setAttribute('aria-invalid', msg ? 'true' : 'false');
      var f = input.closest('.field, .check'); if (f) f.classList.toggle('is-bad', !!msg);
      return !msg;
    }
    function validate() {
      var a = setErr(name, 'c-name-err', name.value.trim().length < 2 ? 'Bitte geben Sie Ihren Namen an.' : '');
      var b = setErr(mail, 'c-mail-err', /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail.value.trim()) ? '' : 'Bitte prüfen Sie die E-Mail-Adresse.');
      var c = setErr(ok, 'c-ok-err', ok.checked ? '' : 'Bitte stimmen Sie der Verarbeitung zu.');
      return a && b && c;
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate()) { var bad = $('[aria-invalid="true"]', form); if (bad) bad.focus(); return; }
      while (sum.firstChild) sum.removeChild(sum.firstChild);
      var rows = [['Name', name.value.trim()], ['E-Mail', mail.value.trim()], ['Telefon', $('#c-tel').value.trim()], ['Kurs', $('#c-kurs').value], ['Sie kommen', form.elements.wer.value], ['Nachricht', $('#c-msg').value.trim()]];
      rows.forEach(function (r) {
        if (!r[1]) return;
        var d = doc.createElement('div'), dt = doc.createElement('dt'), dd = doc.createElement('dd');
        dt.textContent = r[0]; dd.textContent = r[1].length > 160 ? r[1].slice(0, 160) + '…' : r[1];
        d.appendChild(dt); d.appendChild(dd); sum.appendChild(d);
      });
      form.hidden = true; done.hidden = false; done.focus();
    });
    [name, mail, ok].forEach(function (el) { el.addEventListener('change', function () { if (el.getAttribute('aria-invalid') === 'true') validate(); }); });
    $('#form-reset').addEventListener('click', function () { form.reset(); done.hidden = true; form.hidden = false; name.focus(); });
  }

  /* ---------- 11) Nächste Tanzparty ---------- */
  function initParty() {
    var el = $('#party-next');
    if (!el) return;
    var d = new Date(), add = (5 - d.getDay() + 7) % 7;
    if (add === 0 && (d.getHours() > 23 || (d.getHours() === 23 && d.getMinutes() >= 30))) add = 7;
    d.setDate(d.getDate() + add);
    el.textContent = (add === 0 ? 'heute, ' : 'Fr, ') + d.getDate() + '. ' + MONTHS[d.getMonth()];
  }

  /* ---------- Start in Etappen ---------- */
  initHeader();
  initHero();

  var queue = [initSmooth, initReveal, initNavSpy, initFinder, initSteps, initPlan, initWedding, initForm, initParty, initScrollMotion];
  var idle = window.requestIdleCallback ? function (fn) { window.requestIdleCallback(fn, { timeout: 200 }); } : function (fn) { setTimeout(fn, 16); };
  function runQueue() {
    var fn = queue.shift();
    if (!fn) {
      if (hasGSAP()) ScrollTrigger.refresh();
      return;
    }
    try { fn(); } catch (err) { if (window.console) console.warn('Taktvoll:', fn.name, err); }
    idle(runQueue);
  }
  setTimeout(function () { idle(runQueue); }, 60);
})();
