/* ==========================================================================
   Tanzschule Taktvoll – Modell „Drehung“ · main.js
   Bewegung im Dreivierteltakt: Vorhang, Spot, Zählzeit, Rueda, Schallplatte.
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
  var BASE = ((doc.currentScript && doc.currentScript.src) || '/arena/tanzschule-taktvoll/main.js').replace(/main\.js.*$/, '');
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

  /* ---------- 1b) Intro (Einzählen + Vorhang) überspringbar ---------- */
  function initIntro() {
    if (!root.classList.contains('intro')) return;
    var done = function () {
      root.classList.add('intro-done');
      ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(function (t) { window.removeEventListener(t, done, true); });
    };
    ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(function (t) { window.addEventListener(t, done, { capture: true, passive: true }); });
    setTimeout(done, 1200);
  }

  /* ---------- 1c) Navigation: Zeichen rollen beim Hover ---------- */
  function initNavRoll() {
    if (REDUCE || !finePointer) return;
    $$('.nav a').forEach(function (a) {
      var text = a.textContent;
      a.setAttribute('aria-label', text);
      while (a.firstChild) a.removeChild(a.firstChild);
      text.split('').forEach(function (ch, i) {
        var sp = doc.createElement('span');
        sp.className = 'roll'; sp.setAttribute('aria-hidden', 'true');
        sp.textContent = ch === ' ' ? '\u00a0' : ch;
        sp.setAttribute('data-c', sp.textContent);
        sp.style.transitionDelay = (i * 18) + 'ms';
        a.appendChild(sp);
      });
    });
  }

  /* ---------- 1d) Magnetische Buttons (nur feiner Zeiger) ---------- */
  function initMagnetic() {
    if (REDUCE || !finePointer) return;
    $$('.magnetic').forEach(function (el) {
      var cur = { x: 0, y: 0 }, tgt = { x: 0, y: 0 }, raf = 0;
      function tick() {
        cur.x += (tgt.x - cur.x) * 0.18; cur.y += (tgt.y - cur.y) * 0.18;
        el.style.translate = cur.x.toFixed(2) + 'px ' + cur.y.toFixed(2) + 'px';
        if (Math.abs(tgt.x - cur.x) > 0.05 || Math.abs(tgt.y - cur.y) > 0.05) raf = requestAnimationFrame(tick); else raf = 0;
      }
      el.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse') return;
        var r = el.getBoundingClientRect();
        tgt.x = (e.clientX - (r.left + r.width / 2)) * 0.22;
        tgt.y = (e.clientY - (r.top + r.height / 2)) * 0.32;
        if (!raf) raf = requestAnimationFrame(tick);
      });
      el.addEventListener('pointerleave', function () { tgt.x = 0; tgt.y = 0; if (!raf) raf = requestAnimationFrame(tick); });
    });
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

    // „drehen“: jeder Buchstabe dreht sich einmal um die eigene Achse – im Takt versetzt
    var turn = $('.ht-turn'), spinning = false;
    if (turn && turn.animate) {
      turn.addEventListener('pointerenter', function () {
        if (spinning) return; spinning = true;
        var letters = $$('i', turn), last = null;
        letters.forEach(function (l, n) {
          last = l.animate([{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(360deg)' }],
            { duration: 840, delay: n * 60, easing: 'cubic-bezier(0.77, 0, 0.175, 1)' });
        });
        if (last) last.onfinish = function () { spinning = false; };
      });
    }

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
    var mm = gsap.matchMedia();

    // Hero: „drehen“ schwingt beim Wegscrollen aus, der Stempel dreht sich mit
    var letters = $$('.ht-turn b');
    if (letters.length) {
      gsap.to(letters, { rotation: function (i) { return (i - 3) * 13; }, yPercent: function (i) { return Math.abs(i - 3) * 9; },
        transformOrigin: '50% 160%', ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.5 } });
    }
    var stamp = $('.hero__seal');
    if (stamp) gsap.to(stamp, { rotation: 110, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.8 } });

    // Akt-Vorhänge: öffnen sich mit dem Scrollen in das Kapitel hinein
    root.classList.add('acts');
    $$('.act').forEach(function (act) {
      var sec = act.parentElement;
      var tl = gsap.timeline({ scrollTrigger: { trigger: sec, start: 'top 92%', end: 'top 12%', scrub: 0.45 } });
      tl.fromTo($('.act__half--l', act), { xPercent: 0 }, { xPercent: -101, ease: 'power2.inOut' }, 0)
        .fromTo($('.act__half--r', act), { xPercent: 0 }, { xPercent: 101, ease: 'power2.inOut' }, 0)
        .fromTo($('.act__card', act), { opacity: 1, y: 0 }, { opacity: 0, y: -50, ease: 'power1.in', duration: 0.45 }, 0.1);
    });

    // Schallplatte gleitet aus der Hülle, der Tonarm senkt sich
    var vinyl = $('#vinyl'), sleeve = $('.sleeve');
    if (vinyl && sleeve) {
      vinyl.style.translate = '0 0';
      gsap.fromTo(vinyl, { xPercent: 0, rotation: -40 }, { xPercent: 46, rotation: 0, ease: 'power2.out',
        scrollTrigger: { trigger: sleeve, start: 'top 88%', end: 'top 38%', scrub: 0.6,
          onUpdate: function (st) { sleeve.classList.toggle('vinyl-out', st.progress > 0.9); } } });
    }

    // Plakat: „Freitag“ zieht quer durchs Bild
    var huge = $('.party__huge');
    if (huge) gsap.fromTo(huge, { xPercent: 8 }, { xPercent: -30, ease: 'none', scrollTrigger: { trigger: '.party', start: 'top bottom', end: 'bottom top', scrub: 0.4 } });

    // Programmheft: große „6“ dreht sich in den Takt
    var six = $('.kurse__big');
    if (six) gsap.fromTo(six, { rotation: -14, yPercent: 10 }, { rotation: 0, yPercent: 0, ease: 'none', transformOrigin: '50% 100%', scrollTrigger: { trigger: '.kurse', start: 'top bottom', end: 'top 30%', scrub: 0.5 } });
    mm.add('(min-width: 900px)', function () { return function () {}; });
  }

  /* ---------- 3b) Notenzeile: Laufband reagiert auf Scroll-Tempo ---------- */
  function initScore() {
    var band = $('.score'), track = $('.score__track');
    if (!band || !track || REDUCE) return;
    var setW = 0, x = 0, lastY = window.pageYOffset, vel = 0, skew = 0, raf = 0, inView = false;
    function measure() { var s = $('.score__set', track); setW = s ? s.offsetWidth : 0; }
    measure();
    window.addEventListener('resize', measure);
    function frame() {
      raf = 0;
      if (!inView || doc.hidden) return;
      var y = window.pageYOffset, d = y - lastY; lastY = y;
      vel += (d - vel) * 0.12;
      var dir = vel < -0.2 ? -1 : 1;
      x -= dir * 0.55 + vel * 0.32;
      if (setW) { x = x % setW; if (x > 0) x -= setW; }
      skew += (Math.max(-9, Math.min(9, -vel * 0.35)) - skew) * 0.15;
      track.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,0) skewX(' + skew.toFixed(2) + 'deg)';
      raf = requestAnimationFrame(frame);
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { inView = en[0].isIntersecting; if (inView && !raf) { lastY = window.pageYOffset; raf = requestAnimationFrame(frame); } }).observe(band);
    }
    doc.addEventListener('visibilitychange', function () { if (!doc.hidden && inView && !raf) raf = requestAnimationFrame(frame); });
  }

  /* ---------- 3c) Zählzeit: Sticky-Erzählung, Wort für Wort im Takt ---------- */
  function initTempo() {
    var sec = $('.tempo');
    if (!sec || REDUCE || !hasGSAP()) return;
    var lines = $$('.tempo__line', sec), nums = $$('.tempo__nums span', sec), wash = $('.tempo__wash', sec), spin = $('.tempo__spin', sec);
    var words = lines.map(function (line) {
      var out = [];
      Array.prototype.slice.call(line.childNodes).forEach(function (node) {
        if (node.nodeType === 3) {
          var frag = doc.createDocumentFragment();
          node.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(doc.createTextNode(part)); return; }
            var w = doc.createElement('span'); w.className = 'w'; w.textContent = part; frag.appendChild(w); out.push(w);
          });
          line.replaceChild(frag, node);
        } else if (node.nodeType === 1) { node.classList.add('w'); out.push(node); }
      });
      return out;
    });
    root.classList.add('tempo-on');
    if (nums[0]) nums[0].classList.add('is-on');
    var spun = false, lastBeat = 0;
    ScrollTrigger.create({ trigger: sec, start: 'top top', end: 'bottom bottom',
      onUpdate: function (st) {
        var p = st.progress, beat = Math.min(2, Math.floor(p / 0.29));
        words.forEach(function (ws, li) {
          var local = Math.max(0, Math.min(1, (p - li * 0.29) / 0.24));
          var n = Math.round(local * ws.length);
          ws.forEach(function (w, k) { w.classList.toggle('on', k < n); });
        });
        if (beat !== lastBeat) { lastBeat = beat; nums.forEach(function (s, k) { s.classList.toggle('is-on', k === beat); }); }
        var wv = Math.max(0, Math.min(1, (p - 0.66) / 0.2));
        wash.style.opacity = wv.toFixed(3);
        sec.classList.toggle('is-wash', wv > 0.5);
        if (p > 0.88 && !spun && spin.animate) {
          spun = true;
          spin.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], { duration: 1260, easing: 'cubic-bezier(0.77, 0, 0.175, 1)' });
        } else if (p < 0.8) spun = false;
      } });
  }

  /* ---------- 3d) Rueda: Team-Kreis dreht sich mit ---------- */
  function initRing() {
    var rot = $('.ring__rot'), name = $('#ring-name');
    if (!rot) return;
    var ms = $$('.ring__m', rot), people = $$('.person'), current = -1, hover = -1, deg = 0;
    var names = people.map(function (p) { return $('.person__n', p).textContent; });
    function mark(k) {
      if (k === current) return; current = k;
      ms.forEach(function (m, i) { m.classList.toggle('is-on', i === k); });
      people.forEach(function (p, i) { p.classList.toggle('is-on', i === k); });
      name.textContent = names[k] || '';
    }
    function nearest() {
      var best = 0, bd = 999;
      for (var k = 0; k < ms.length; k++) { var a = ((k * 360 / ms.length + deg) % 360 + 360) % 360; var d = Math.min(a, 360 - a); if (d < bd) { bd = d; best = k; } }
      return best;
    }
    people.forEach(function (p, i) {
      p.addEventListener('pointerenter', function () { hover = i; mark(i); });
      p.addEventListener('pointerleave', function () { hover = -1; mark(nearest()); });
    });
    mark(0);
    if (REDUCE || !hasGSAP()) return;
    ScrollTrigger.create({ trigger: '.team', start: 'top bottom', end: 'bottom top',
      onUpdate: function (st) {
        deg = -st.progress * 360 * 6 / 7;
        rot.style.setProperty('--rot', deg.toFixed(2) + 'deg');
        if (hover < 0) mark(nearest());
      } });
  }

  /* ---------- 4) Reveals ---------- */
  function initReveal() {
    var els = $$('[data-reveal]');
    if (REDUCE || !('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add('is-in'); }); return; }
    els.forEach(function (el) {
      var sib = $$('[data-reveal]', el.parentElement).filter(function (s) { return s.parentElement === el.parentElement; });
      var i = sib.indexOf(el);
      el.setAttribute('data-beat', String(i % 3 + 1));
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
          if (show) { li.style.setProperty('--i', c); c++; }
        });
        $('.plan-empty', sec).hidden = c > 0;
        if (on) visible = c;
      });
      if (announce) status.textContent = DAY_NAMES[day] + ': ' + visible + (visible === 1 ? ' Kurs' : ' Kurse') + ' für ' + LEVEL_NAMES[level] + '.';
    }
    var pencil = $('.pencil'), card = $('.dancecard');
    function swing() {
      if (!pencil || REDUCE) return;
      pencil.classList.remove('is-swing'); void pencil.getBoundingClientRect(); pencil.classList.add('is-swing');
    }
    if (card && 'IntersectionObserver' in window) {
      var cio = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { card.classList.add('is-drawn'); swing(); cio.disconnect(); } }, { threshold: 0.2 });
      cio.observe(card);
    } else if (card) card.classList.add('is-drawn');
    function select(d, focus) {
      if (d !== day) swing();
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
        swing(); apply(true);
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
          if (inView && !doc.hidden) spin.play(); else spin.pause();
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
  initIntro();
  initHeader();
  initHero();

  var queue = [initSmooth, initNavRoll, initMagnetic, initReveal, initNavSpy, initFinder, initSteps, initPlan, initWedding, initForm, initParty, initScore, initTempo, initRing, initScrollMotion];
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
  // GSAP/ScrollTrigger/Lenis erst nach dem ersten Bild laden – der erste Bildschirm wartet auf nichts.
  // Bei reduzierter Bewegung werden sie gar nicht gebraucht.
  function loadVendors(done) {
    if (REDUCE) { done(); return; }
    var files = ['assets/vendor/gsap.min.js', 'assets/vendor/ScrollTrigger.min.js', 'assets/vendor/lenis.min.js'], left = files.length;
    files.forEach(function (f) {
      var s = doc.createElement('script');
      s.src = BASE + f; s.async = false;
      s.onload = s.onerror = function () { if (--left === 0) done(); };
      doc.head.appendChild(s);
    });
  }
  requestAnimationFrame(function () { setTimeout(function () { loadVendors(function () { idle(runQueue); }); }, 60); });
})();
