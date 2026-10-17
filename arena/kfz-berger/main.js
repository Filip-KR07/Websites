/* ==========================================================================
   Kfz-Meisterwerkstatt Berger – Modell „Drehmoment“ (Demo)
   Alle Werte sind Beispielwerte eines fiktiven Betriebs. Zum Anpassen
   die Konstanten in diesem Block ändern.
   ========================================================================== */
(async () => {
  'use strict';
  const pause = () => new Promise(r => (window.requestIdleCallback ? requestIdleCallback(() => r(), { timeout: 150 }) : setTimeout(r, 16)));

  /* ---------- Betriebsdaten ---------- */
  const OPENING = {            // Wochentag (0 = So) -> [öffnet, schließt] in Stunden
    0: null,
    1: [7.5, 18], 2: [7.5, 18], 3: [7.5, 18], 4: [7.5, 18], 5: [7.5, 18],
    6: [8, 12]
  };
  const SLOT_TIMES = {          // Annahme-Slots pro Tag (Stunden)
    weekday: [7.5, 8.5, 9.5, 10.5, 11.5, 13, 14, 15, 16],
    saturday: [8, 9, 10, 11]
  };
  const SLOT_BOOKED_RATE = 0.5;  // simulierte Auslastung (0–1)
  const LOAN_CARS = 4;           // Ersatzwagen gesamt
  const LIFT_JOBS = [
    'Inspektion · Kompakt', 'Bremsen vorn · SUV', 'HU-Vorbereitung · Kombi', 'Klimaservice · Kleinwagen',
    'Räderwechsel · Transporter', 'Diagnose · Hybrid', 'Zahnriemen · Kombi', 'Achsvermessung · SUV',
    'Ölservice · Kleinwagen', 'Batterietest · E-Auto', 'Stoßdämpfer · Kompakt', 'Lichttest · Van'
  ];

  /* ---------- Service-Rechner ----------
     Preise in € inkl. 19 % MwSt. für einen Kompaktwagen mit Benzin/Diesel,
     Zeiten in Stunden. `scale` = wie stark der Klassenfaktor wirkt (1 = voll). */
  const VEHICLE_CLASSES = {
    kleinwagen:  { label: 'Kleinwagen',         price: 0.88, time: 0.9 },
    kompakt:     { label: 'Kompakt',            price: 1.0,  time: 1.0 },
    mittel:      { label: 'Mittelklasse/Kombi', price: 1.18, time: 1.1 },
    suv:         { label: 'SUV/Van',            price: 1.32, time: 1.2 },
    transporter: { label: 'Transporter',        price: 1.5,  time: 1.3 }
  };
  const DRIVES = {
    verbrenner: 'Benzin/Diesel',
    hybrid: 'Hybrid',
    elektro: 'Elektro'
  };
  const SERVICES = {
    inspektion: { label: 'Inspektion',               min: 159, max: 279, tMin: 1.5,  tMax: 2.5,  scale: 1,    drive: { hybrid: 1.1, elektro: 0.72 } },
    bremsen:    { label: 'Bremsen vorn',             min: 239, max: 369, tMin: 1.25, tMax: 2,    scale: 1,    drive: { elektro: 1.05 } },
    reifen:     { label: 'Räderwechsel',             min: 49,  max: 79,  tMin: 0.5,  tMax: 0.75, scale: 0.5,  drive: {} },
    klima:      { label: 'Klimaservice',             min: 119, max: 169, tMin: 1,    tMax: 1.25, scale: 0.4,  drive: { hybrid: 1.12, elektro: 1.18 } },
    hu:         { label: 'HU/AU',                    min: 149, max: 169, tMin: 0.75, tMax: 1,    scale: 0.15, drive: { elektro: 0.86 }, labelElektro: 'HU (ohne AU)' }
  };
  const COMBO_TIME_FACTOR = 0.85; // ab zwei Leistungen arbeiten zwei Leute parallel
  const SAME_DAY_MAX_HOURS = 4;   // darüber: Abholung am Folgetag
  const PRICE_SCALE_MAX = 1500;   // Skala der Preisleiste in €

  /* ---------- HU ---------- */
  const HU_INTERVAL = 24;         // Monate (Pkw)
  const HU_FIRST = 36;            // Monate nach Erstzulassung (Neuwagen)
  const HU_COLORS = [             // Plakettenfarbe: Index = (Jahr - 2024) mod 6
    { name: 'braun',  bg: '#8B5A2B', fg: '#FFFFFF' },
    { name: 'rosa',   bg: '#F4A6C8', fg: '#16181B' },
    { name: 'grün',   bg: '#3E9B57', fg: '#FFFFFF' },
    { name: 'orange', bg: '#F28A1E', fg: '#16181B' },
    { name: 'blau',   bg: '#2F6FD6', fg: '#FFFFFF' },
    { name: 'gelb',   bg: '#F5D33D', fg: '#16181B' }
  ];

  /* ---------- Drehzahlmesser ---------- */
  const RPM_IDLE = 850;
  const RPM_MAX = 7900;
  const RPM_SCALE = 8000;
  const RPM_SPEED_FULL = 3600;    // px/s Scrolltempo für Vollausschlag
  const LED_THRESHOLDS = [3400, 4100, 4800, 5500, 6100, 6700, 7300];

  /* ======================================================================== */
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const root = document.documentElement;
  const motionOK = root.classList.contains('motion-ok');
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  const DAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  const DAYS_S = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  const nbsp = ' ';
  // Ganzzahlen deutsch formatieren ohne Intl (dessen erste Initialisierung kostet auf schwachen Handys spürbar Zeit)
  const fmtInt = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const euro = n => fmtInt(n) + nbsp + '€';
  const hhmm = h => { const H = Math.floor(h); const M = Math.round((h - H) * 60); return H + ':' + String(M).padStart(2, '0'); };
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const hasGSAP = !!(window.gsap && window.ScrollTrigger);
  let lenis = null;

  /* ---------- Smooth Scroll ----------
     Lenis wird erst nach dem Hero-Intro (oder beim ersten Scrollen) gestartet – siehe startScroll() unten.
     Bis dahin scrollt der Browser nativ; der Wechsel ist nicht spürbar. */
  if (hasGSAP) {
    gsap.registerPlugin(ScrollTrigger);
    // kein automatisches Refresh bei DOMContentLoaded/load: Die Trigger entstehen erst nach dem Intro, refresh() folgt dann gezielt
    ScrollTrigger.config({ autoRefreshEvents: 'visibilitychange,resize' });
  }
  function initLenis() {
    if (lenis || !motionOK || !window.Lenis) return;
    lenis = new Lenis({ duration: 1.1, smoothWheel: true, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    window.__lenis = lenis;
    if (hasGSAP) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(t => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const loop = t => { lenis.raf(t); requestAnimationFrame(loop); };
      requestAnimationFrame(loop);
    }
  }
  const hdrH = () => $('[data-hdr]').offsetHeight;
  // Ziel nach dem Scrollen nachmessen: Kapitel mit content-visibility bekommen erst unterwegs ihre echte Höhe
  function scrollToEl(el, after, tries = 0) {
    if (!el) return;
    const fix = () => {
      const off = el.getBoundingClientRect().top - hdrH() - 12;
      if (Math.abs(off) > 6 && tries < 3) scrollToEl(el, after, tries + 1);
      else if (after) after();
    };
    if (lenis) {
      lenis.scrollTo(el, { offset: -hdrH() - 12, duration: tries ? 0.5 : 1.2, onComplete: () => requestAnimationFrame(fix) });
    } else {
      const y = el.getBoundingClientRect().top + scrollY - hdrH() - 12;
      window.scrollTo({ top: y, behavior: motionOK && !tries ? 'smooth' : 'auto' });
      setTimeout(fix, motionOK && !tries ? 700 : 30);
    }
  }
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.hasAttribute('data-preset')) return;
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    const el = document.getElementById(id.slice(1));
    if (!el) return;
    e.preventDefault();
    closeMenu(false);
    scrollToEl(el);
    history.replaceState(null, '', id);
  });

  /* ---------- Scrollhöhe nur bei Layoutänderung messen (kein erzwungenes Layout pro Frame) ---------- */
  let maxScroll = 1;
  const measureMax = () => { maxScroll = Math.max(1, document.documentElement.scrollHeight - innerHeight); };
  if ('ResizeObserver' in window) new ResizeObserver(measureMax).observe(document.body); // meldet sich einmal sofort nach dem ersten Layout
  else measureMax();
  addEventListener('resize', measureMax, { passive: true });

  /* ---------- Header: Zustand, Fortschritt, aktive Navigation ---------- */
  const hdr = $('[data-hdr]');
  const prog = $('[data-progress]');
  let lastY = -1;
  function onScrollUI() {
    const y = window.scrollY;
    if (y === lastY) return;
    lastY = y;
    hdr.classList.toggle('is-solid', y > 24);
    prog.style.transform = 'scaleX(' + clamp(y / maxScroll, 0, 1).toFixed(4) + ')';
  }
  addEventListener('scroll', onScrollUI, { passive: true });
  onScrollUI();

  const navLinks = $$('.nav a');
  const navMap = new Map(navLinks.map(a => [a.getAttribute('href').slice(1), a]));
  const secIO = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      navLinks.forEach(a => a.removeAttribute('aria-current'));
      const a = navMap.get(en.target.id);
      if (a) a.setAttribute('aria-current', 'location');
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main > section[id]').forEach(s => secIO.observe(s));

  /* ---------- Mobile Navigation ---------- */
  const burger = $('[data-burger]');
  const mnav = $('[data-mnav]');
  $$('li', mnav).forEach((li, i) => li.style.setProperty('--i', i));
  function openMenu() {
    mnav.hidden = false;
    burger.setAttribute('aria-expanded', 'true');
    $('.sr', burger).textContent = 'Menü schließen';
    hdr.classList.add('is-solid');
    requestAnimationFrame(() => mnav.classList.add('is-open'));
    if (lenis) lenis.stop();
    document.body.style.overflow = 'hidden';
    const first = $('a', mnav);
    if (first) first.focus();
  }
  function closeMenu(focusBurger = true) {
    if (mnav.hidden) return;
    mnav.classList.remove('is-open');
    mnav.hidden = true;
    burger.setAttribute('aria-expanded', 'false');
    $('.sr', burger).textContent = 'Menü öffnen';
    if (lenis) lenis.start();
    document.body.style.overflow = '';
    onScrollUI();
    if (focusBurger) burger.focus();
  }
  burger.addEventListener('click', () => (mnav.hidden ? openMenu() : closeMenu()));
  document.addEventListener('keydown', e => {
    if (mnav.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); closeMenu(); return; }
    if (e.key === 'Tab') {
      const f = [burger, ...$$('a, button', mnav)];
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && (i <= 0)) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      else if (i === -1) { e.preventDefault(); f[0].focus(); }
    }
  });
  matchMedia('(min-width: 900px)').addEventListener('change', e => { if (e.matches) closeMenu(false); });

  /* ---------- Titel in Wörter teilen (Masken-Reveal) – erst kurz bevor sie ins Bild kommen ---------- */
  function splitWords(h) {
    if (h.classList.contains('is-split')) return;
    let wi = 0;
    const walk = node => {
      Array.from(node.childNodes).forEach(n => {
        if (n.nodeType === 3) {
          const parts = n.textContent.split(/( +)/);
          const frag = document.createDocumentFragment();
          parts.forEach(p => {
            if (!p) return;
            if (/^ +$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'w';
            const i = document.createElement('span'); i.textContent = p; i.style.setProperty('--wi', wi++);
            w.appendChild(i); frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    };
    walk(h);
    h.classList.add('is-split');
  }
  if (motionOK) {
    const spIO = new IntersectionObserver(entries => entries.forEach(en => {
      if (en.isIntersecting && en.boundingClientRect.top > innerHeight * 0.5) splitWords(en.target);
      if (en.isIntersecting) spIO.unobserve(en.target);
    }), { rootMargin: '0px 0px 60% 0px' });
    $$('[data-split]').forEach(h => spIO.observe(h));
  }

  /* ---------- Reveals „Einrasten“ ---------- */
  const revealEls = $$('[data-reveal], [data-split]');
  revealEls.forEach(el => {
    const sibs = Array.from(el.parentElement.children).filter(c => c.hasAttribute('data-reveal'));
    el.style.setProperty('--i', Math.max(0, Math.min(sibs.indexOf(el), 6)));
  });
  if (root.classList.contains('motion-forced-off')) {
    revealEls.forEach(el => el.classList.add('in'));
  } else {
    const rio = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('in'); rio.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    revealEls.forEach(el => rio.observe(el));
  }

  /* ---------- Zähler ---------- */
  if (motionOK) {
    const cio = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        cio.unobserve(en.target);
        const el = en.target, end = +el.dataset.count, t0 = performance.now(), dur = 1300;
        const step = now => {
          const p = clamp((now - t0) / dur, 0, 1), e = 1 - Math.pow(1 - p, 4);
          el.textContent = fmtInt(end * e);
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    $$('[data-count]').forEach(el => { el.textContent = '0'; cio.observe(el); });
  }

  /* ======================================================================
     1) Drehzahlmesser – Nadel folgt der Scroll-Geschwindigkeit
     ====================================================================== */
  const tach = {
    needle: $('[data-tach-needle]'),
    prog: $('[data-tach-prog]'),
    rpmTxt: $('[data-tach-rpm]'),
    gearTxt: $('[data-tach-gear]'),
    leds: $$('[data-tach-leds] .led'),
    logo: $('[data-logo-needle]'),
    wrap: $('[data-tach-wrap]')
  };
  const T = { rpm: RPM_IDLE, v: 0, target: RPM_IDLE, speed: 0, idle: RPM_IDLE, running: false, last: 0, y: scrollY, heroVisible: true, sweep: 0, lastTxt: '', lastGear: '', ledMask: -1, logoA: 999, needleA: 999 };
  const angleOf = rpm => -120 + (clamp(rpm, 0, RPM_SCALE) / RPM_SCALE) * 240;
  function renderTach() {
    const r = T.rpm;
    const la = -122 + clamp(r, 0, RPM_SCALE) / RPM_SCALE * 244;
    if (tach.logo && Math.abs(la - T.logoA) > 0.4) { tach.logo.setAttribute('transform', 'rotate(' + la.toFixed(1) + ' 20 22)'); T.logoA = la; }
    if (!T.heroVisible) return;
    // Nadel als eigene Ebene: reine CSS-Transformation, kein Neuzeichnen des Zifferblatts
    const na = angleOf(r);
    if (Math.abs(na - T.needleA) > 0.05) { tach.needle.style.transform = 'rotate(' + na.toFixed(2) + 'deg)'; T.needleA = na; }
    tach.prog.style.strokeDashoffset = (1000 - clamp(r, 0, RPM_SCALE) / RPM_SCALE * 1000).toFixed(1);
    const txt = String(Math.round(clamp(r, 0, 9999) / 10) * 10).padStart(4, '0');
    if (txt !== T.lastTxt) { tach.rpmTxt.textContent = txt; T.lastTxt = txt; }
    let mask = 0;
    LED_THRESHOLDS.forEach((th, i) => { if (r >= th) mask |= 1 << i; });
    if (r > 7500 && (performance.now() / 70 | 0) % 2) mask = 0; // Begrenzer blinkt
    if (mask !== T.ledMask) {
      tach.leds.forEach((l, i) => l.classList.toggle('on', !!(mask & (1 << i))));
      T.ledMask = mask;
    }
    const p = scrollY / maxScroll;
    const gear = (T.speed < 40 && r < 1300) ? 'N' : String(1 + Math.min(5, Math.floor(p * 6)));
    if (gear !== T.lastGear) { tach.gearTxt.textContent = gear; T.lastGear = gear; }
  }
  function tachFrame() {
    // eigene, monotone Zeitbasis: Der rAF-Zeitstempel kann vor dem Scroll-Event liegen, das den Loop gestartet hat
    const now = performance.now();
    const raw = (now - T.last) / 1000;
    const dt = raw > 0.002 ? Math.min(0.034, raw) : 0.016;
    T.last = now;
    const y = scrollY;
    const inst = Math.abs(y - T.y) / dt;
    T.y = y;
    T.speed += (inst - T.speed) * (inst > T.speed ? 0.35 : 0.08);
    if (T.sweep) {
      const t = (now - T.sweep) / 1000;
      if (t < 0.75) { const e = t / 0.75; T.rpm = RPM_SCALE * (e < .5 ? 4 * e * e * e : 1 - Math.pow(-2 * e + 2, 3) / 2); }
      else if (t < 1.7) { const e = (t - 0.75) / 0.95; T.rpm = RPM_SCALE + (T.idle - RPM_SCALE) * (1 - Math.pow(1 - e, 3)); }
      else { T.sweep = 0; T.v = 0; }
    } else {
      const k = clamp(T.speed / RPM_SPEED_FULL, 0, 1);
      T.target = T.idle + Math.pow(k, 0.72) * (RPM_MAX - T.idle);
      if (T.target > 7500) T.target += Math.sin(now / 38) * 180; // am Begrenzer
      const stiff = 90, damp = 2 * Math.sqrt(stiff) * 0.62;
      const acc = stiff * (T.target - T.rpm) - damp * T.v;
      T.v += acc * dt;
      T.rpm += T.v * dt;
    }
    renderTach();
    const settled = !T.sweep && T.speed < 2 && Math.abs(T.rpm - T.target) < 1.5 && Math.abs(T.v) < 2;
    if (settled) { T.running = false; T.rpm = T.target; renderTach(); return; }
    requestAnimationFrame(tachFrame);
  }
  function kickTach() {
    if (!motionOK || T.running) return;
    T.running = true;
    T.last = performance.now();
    T.y = scrollY;
    requestAnimationFrame(tachFrame);
  }
  if (motionOK) {
    addEventListener('scroll', kickTach, { passive: true });
    new IntersectionObserver(([en]) => { T.heroVisible = en.isIntersecting; if (en.isIntersecting) kickTach(); }).observe(tach.wrap);
    // Leerlauf: nur die Digitalanzeige zittert minimal – kein Dauer-Animationsloop, die Nadel bleibt ruhig
    setInterval(() => {
      if (document.hidden || !T.heroVisible || T.sweep || T.running) return;
      const txt = String(Math.round((RPM_IDLE + Math.random() * 30 - 15) / 10) * 10).padStart(4, '0');
      if (txt !== T.lastTxt) { tach.rpmTxt.textContent = txt; T.lastTxt = txt; }
    }, 900);
  }
  renderTach();

  /* ---------- Hero-Intro ----------
     Die Klasse `hero-go` setzt ein kleines Inline-Skript am Ende von index.html, damit das Intro nicht auf
     GSAP/Lenis/main.js warten muss. Hier startet nur der Nadel-Sweep – 650 ms nach dem Intro-Start. */
  const sweepFrom = t0 => {
    if (!motionOK) return;
    setTimeout(() => { T.sweep = performance.now(); kickTach(); }, Math.max(0, 650 - (performance.now() - t0)));
  };
  if (root.classList.contains('hero-go')) sweepFrom(window.__heroGoAt || performance.now());
  else {
    document.addEventListener('berger:herogo', () => sweepFrom(window.__heroGoAt || performance.now()), { once: true });
    setTimeout(() => { if (!root.classList.contains('hero-go')) { root.classList.add('hero-go'); sweepFrom(performance.now()); } }, 1500);
  }

  /* ======================================================================
     Hero-Set-Piece: Explosionszeichnung der Radbaugruppe
     Jedes Bauteil hängt an einer eigenen gedämpften Feder (schwere Teile
     schwingen später und weiter nach). Ziel = Scrollfortschritt in der Lauf-Sektion.
     ====================================================================== */
  const xd = $('[data-xd]');
  const xdRun = $('[data-xd-run]');
  const xdStage = $('[data-xd-stage]');
  const mqDesk = matchMedia('(min-width: 900px)');
  const XP = $$('.xd-part', xd).map(g => {
    const id = g.dataset.part;
    const lead = $('[data-lead="' + id + '"]', xd);
    const lbl = $('[data-lbl="' + id + '"]', xd);
    const circ = $('.balloon', lbl), num = $('.balloon-n', lbl), t1 = $('.lbl-t', lbl), t2 = $('.lbl-s', lbl);
    return {
      g, id, lead, dot: $('[data-dot="' + id + '"]', xd), circ, num, t1, t2,
      off: g.dataset.off.split(',').map(Number), anc: g.dataset.anchor.split(',').map(Number), mass: +g.dataset.mass,
      lane: { x: +circ.getAttribute('cx'), y: +circ.getAttribute('cy') },
      x: 0, v: 0
    };
  });
  // Handy: engere Spreizung, eigene Beschriftungsspuren (nur Positionsnummern, Text steht in der Stückliste)
  const LANES_M = { schrauben: [-330, -330], felge: [-110, -330], sattel: [140, -330], reifen: [-300, 330], scheibe: [40, 330], nabe: [290, 330] };
  const XD = { P_REST: 0.68, spread: 1, rigX: 0, target: 0, running: false, last: 0, top: 0, len: 1, ready: false, mobile: false };
  function xdLayout() {
    XD.mobile = !mqDesk.matches;
    XD.spread = XD.mobile ? 0.42 : 1;
    XD.rigX = XD.mobile ? -80 : 0;
    xd.setAttribute('viewBox', XD.mobile ? '-390 -380 780 760' : '-700 -360 1400 720');
    XP.forEach(p => {
      const [lx, ly] = XD.mobile ? LANES_M[p.id] : [p.lane.x, p.lane.y];
      p.bx = lx; p.by = ly > 0 ? ly - 18 : ly + 18;
      p.circ.setAttribute('cx', lx); p.circ.setAttribute('cy', ly);
      p.num.setAttribute('x', lx); p.num.setAttribute('y', ly + 6);
      p.t1.setAttribute('x', lx + 28); p.t2.setAttribute('x', lx + 28);
    });
    const r = xdRun.getBoundingClientRect();
    XD.top = r.top + scrollY - (hdr ? hdr.offsetHeight : 0);
    XD.len = Math.max(1, xdRun.offsetHeight - xdStage.offsetHeight);
  }
  function xdRender() {
    XP.forEach(p => {
      const tx = p.off[0] * p.x * XD.spread + XD.rigX, ty = p.off[1] * p.x * XD.spread;
      p.g.setAttribute('transform', 'translate(' + tx.toFixed(1) + ' ' + ty.toFixed(1) + ')');
      const ax = (p.anc[0] + tx).toFixed(1), ay = (p.anc[1] + ty).toFixed(1);
      p.lead.setAttribute('d', 'M' + ax + ' ' + ay + 'L' + p.bx + ' ' + p.by);
      p.dot.setAttribute('cx', ax); p.dot.setAttribute('cy', ay);
    });
  }
  const xdProgress = () => XD.P_REST + (1 - XD.P_REST) * clamp((scrollY - XD.top) / XD.len, 0, 1);
  function xdFrame() {
    const now = performance.now();
    const dt = Math.min(0.034, Math.max(0.004, (now - XD.last) / 1000));
    XD.last = now;
    XD.target = xdProgress();
    let moving = false;
    XP.forEach(p => {
      const k = 150 / p.mass, c = 2 * Math.sqrt(k) * 0.5; // ζ = 0,5: sichtbares, kurzes Nachschwingen
      p.v += (k * (XD.target - p.x) - c * p.v) * dt;
      p.x += p.v * dt;
      if (Math.abs(p.v) > 0.0006 || Math.abs(XD.target - p.x) > 0.0006) moving = true;
    });
    xdRender();
    if (moving) requestAnimationFrame(xdFrame);
    else { XD.running = false; XP.forEach(p => { p.x = XD.target; p.v = 0; }); xdRender(); }
  }
  function xdKick() {
    if (!XD.ready || XD.running) return;
    XD.running = true; XD.last = performance.now();
    requestAnimationFrame(xdFrame);
  }
  xdLayout();
  if (motionOK) {
    addEventListener('scroll', xdKick, { passive: true });
    // Intro: Linien zeichnen sich (CSS), dann fliegt die Baugruppe auseinander
    const go = () => {
      setTimeout(() => {
        XD.ready = true;
        xd.classList.remove('drawing');
        xdKick();
      }, Math.max(0, 720 - (performance.now() - (window.__heroGoAt || 0))));
    };
    if (root.classList.contains('hero-go')) go(); else document.addEventListener('berger:herogo', go, { once: true });
  } else {
    xd.classList.remove('drawing');
    XP.forEach(p => { p.x = XD.P_REST; });
    xdRender();
  }
  const xdRelayout = () => { xdLayout(); if (!motionOK || !XD.ready) { if (!motionOK) xdRender(); return; } xdKick(); };
  addEventListener('resize', xdRelayout, { passive: true });
  mqDesk.addEventListener('change', () => { xdLayout(); xdRender(); });
  if ('ResizeObserver' in window) new ResizeObserver(() => xdLayout()).observe(xdRun);

  /* ======================================================================
     Laufband „Reifenspur“: Tempo und Richtung folgen der Scroll-Geschwindigkeit
     ====================================================================== */
  const tread = $('[data-tread]');
  if (tread && motionOK) {
    const TR = { x: 0, v: 0, y: scrollY, dir: 1, raf: 0, vis: false, half: 1 };
    const measureTread = () => { TR.half = tread.scrollWidth / 2 || 1; };
    measureTread();
    addEventListener('resize', measureTread, { passive: true });
    if (document.fonts) document.fonts.ready.then(measureTread);
    const loop = () => {
      TR.raf = 0;
      if (!TR.vis || document.hidden) return;
      const y = scrollY, dy = y - TR.y; TR.y = y;
      if (Math.abs(dy) > 0.5) TR.dir = dy > 0 ? 1 : -1;
      TR.v += (Math.abs(dy) * 1.1 - TR.v) * 0.12;
      TR.x -= (0.45 + TR.v) * TR.dir;
      if (TR.x <= -TR.half) TR.x += TR.half;
      if (TR.x > 0) TR.x -= TR.half;
      tread.style.transform = 'translate3d(' + TR.x.toFixed(1) + 'px,0,0) skewX(' + clamp(-TR.v * 0.35 * TR.dir, -10, 10).toFixed(2) + 'deg)';
      TR.raf = requestAnimationFrame(loop);
    };
    new IntersectionObserver(([en]) => { TR.vis = en.isIntersecting; if (TR.vis && !TR.raf) { TR.y = scrollY; TR.raf = requestAnimationFrame(loop); } }).observe(tread.parentElement);
    document.addEventListener('visibilitychange', () => { if (!document.hidden && TR.vis && !TR.raf) TR.raf = requestAnimationFrame(loop); });
  }

  /* ======================================================================
     Mikro-Interaktionen (nur feiner Zeiger): Zeichen-Rollen, Magnet, CAD-Fadenkreuz
     ====================================================================== */
  if (fine && motionOK) {
    $$('.nav a').forEach(a => {
      const t = a.textContent;
      a.setAttribute('aria-label', t);
      a.textContent = '';
      const r = document.createElement('span'); r.className = 'roll'; r.setAttribute('aria-hidden', 'true');
      Array.from(t).forEach((ch, i) => { const s = document.createElement('span'); s.textContent = ch; s.style.setProperty('--c', i); r.appendChild(s); });
      a.appendChild(r);
    });
    $$('[data-magnet]').forEach(b => {
      b.addEventListener('pointermove', e => {
        const r = b.getBoundingClientRect();
        b.style.setProperty('--mx', ((e.clientX - r.left - r.width / 2) * 0.22).toFixed(1) + 'px');
        b.style.setProperty('--my', ((e.clientY - r.top - r.height / 2) * 0.3).toFixed(1) + 'px');
      });
      b.addEventListener('pointerleave', () => { b.style.setProperty('--mx', '0px'); b.style.setProperty('--my', '0px'); });
    });
    const cur = document.createElement('div');
    cur.className = 'cad-cursor'; cur.setAttribute('aria-hidden', 'true');
    const curT = document.createElement('span'); cur.appendChild(curT);
    document.body.appendChild(cur);
    const C = { x: 0, y: 0, tx: 0, ty: 0, raf: 0, on: false, el: null };
    const cLoop = () => {
      C.x += (C.tx - C.x) * 0.28; C.y += (C.ty - C.y) * 0.28;
      cur.style.transform = 'translate3d(' + C.x.toFixed(1) + 'px,' + C.y.toFixed(1) + 'px,0)';
      C.raf = (C.on || Math.abs(C.tx - C.x) > 0.3) ? requestAnimationFrame(cLoop) : 0;
    };
    $$('[data-cad]').forEach(el => {
      el.addEventListener('pointermove', e => {
        if (e.target.closest('a, button, input, select, textarea, label')) { cur.classList.remove('on'); return; }
        const r = el.getBoundingClientRect();
        C.tx = e.clientX; C.ty = e.clientY;
        if (!C.on) { C.on = true; C.x = C.tx; C.y = C.ty; }
        cur.classList.add('on');
        curT.textContent = 'X ' + String(Math.round((e.clientX - r.left) / r.width * 1000)).padStart(4, '0') + '  Y ' + String(Math.round((e.clientY - r.top) / r.height * 1000)).padStart(4, '0');
        if (!C.raf) C.raf = requestAnimationFrame(cLoop);
      });
      el.addEventListener('pointerleave', () => { C.on = false; cur.classList.remove('on'); });
    });
  }

  /* Karriere: Zahnkranz rastet beim Scrollen in 10°-Schritten weiter */
  const jobs = $('#karriere');
  if (jobs && motionOK) {
    let jv = false, jr = 0;
    new IntersectionObserver(([en]) => { jv = en.isIntersecting; }).observe(jobs);
    addEventListener('scroll', () => {
      if (!jv || jr) return;
      jr = requestAnimationFrame(() => {
        jr = 0;
        const r = jobs.getBoundingClientRect();
        const p = clamp(1 - (r.top + r.height) / (innerHeight + r.height), 0, 1);
        jobs.style.setProperty('--ratchet', (Math.round(p * 18) * 10) + 'deg');
      });
    }, { passive: true });
  }

  await pause(); // ---- Start in Etappen: jeder Block in einem eigenen kurzen Task ----

  /* ======================================================================
     5) Live-Werkstattstatus (simuliert, deterministisch pro Tag)
     ====================================================================== */
  function rng(seed) {
    return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  const daySeed = d => d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  function slotsFor(date, nowH) {
    const day = date.getDay();
    const times = day === 6 ? SLOT_TIMES.saturday : SLOT_TIMES.weekday;
    const r = rng(daySeed(date) * 7 + 3);
    return times.map(t => ({ t, booked: r() < SLOT_BOOKED_RATE, past: nowH != null && t + 0.25 <= nowH }));
  }
  function nextOpenDay(from) {
    const d = new Date(from);
    for (let i = 1; i <= 7; i++) {
      d.setDate(d.getDate() + 1);
      if (OPENING[d.getDay()]) return new Date(d);
    }
    return d;
  }
  function computeStatus(now = new Date()) {
    const day = now.getDay(), h = now.getHours() + now.getMinutes() / 60;
    const hrs = OPENING[day];
    const open = !!hrs && h >= hrs[0] && h < hrs[1];
    let refDate = now, slots, label;
    if (hrs && h < hrs[1] - 0.5) {
      slots = slotsFor(now, h);
      label = 'heute';
    } else {
      refDate = nextOpenDay(now);
      slots = slotsFor(refDate, null);
      label = refDate.getDay() === (day + 1) % 7 ? 'morgen' : DAYS[refDate.getDay()];
    }
    const free = slots.filter(s => !s.booked && !s.past);
    const r = rng(daySeed(now) * 13 + (h < 12 ? 1 : 2));
    const cars = 1 + Math.floor(r() * (LOAN_CARS - 1));
    let opensTxt = '';
    if (!open) {
      if (hrs && h < hrs[0]) opensTxt = 'öffnet heute ' + hhmm(hrs[0]);
      else { const nd = nextOpenDay(now); opensTxt = 'öffnet ' + DAYS_S[nd.getDay()] + ' ' + hhmm(OPENING[nd.getDay()][0]); }
    }
    return { now, open, h, hrs, slots, free, label, refDate, cars, opensTxt };
  }
  function renderStatus() {
    const s = computeStatus();
    const n = s.free.length;
    let state = s.open ? (n >= 3 ? 'open' : 'few') : 'closed';
    if (!s.open && s.hrs && s.h < s.hrs[0] && n < 3) state = 'few';
    const termine = n === 1 ? 'Termin' : 'Termine';
    let short, long;
    if (s.open) {
      short = n ? 'Geöffnet · heute noch ' + n + ' ' + termine + ' frei' : 'Geöffnet · heute ausgebucht';
    } else {
      short = 'Geschlossen · ' + s.opensTxt;
    }
    long = short + ' · Ersatzwagen: ' + s.cars + ' von ' + LOAN_CARS + ' frei';
    const chip = $('[data-status-chip]');
    chip.dataset.state = state;
    $('[data-status-short]').textContent = short;
    const facts = $('[data-status-facts]');
    facts.dataset.state = state;
    $('span:last-child', facts).textContent = short + ' · ' + s.cars + nbsp + 'Ersatzwagen frei';
    $('[data-status-long]').textContent = long;

    const stState = $('[data-st-state]');
    stState.dataset.state = state;
    stState.textContent = s.open ? (state === 'few' ? 'Fast voll' : 'Geöffnet') : 'Geschlossen';
    $('[data-st-free]').textContent = n;
    $('[data-st-free-txt]').textContent = termine + ' ' + s.label + ' noch frei';
    const seg = $('[data-st-seg]');
    seg.style.setProperty('--n', s.slots.length);
    seg.textContent = '';
    const nextSlot = s.free[0];
    s.slots.forEach(sl => {
      const i = document.createElement('i');
      i.className = sl.past ? 'past' : (sl.booked ? 'booked' : 'free' + (sl === nextSlot ? ' next' : ''));
      const b = document.createElement('b');
      b.textContent = hhmm(sl.t);
      i.appendChild(b);
      seg.appendChild(i);
    });
    $('[data-st-next]').textContent = nextSlot
      ? 'Nächster freier Slot: ' + s.label + ' ' + hhmm(nextSlot.t) + nbsp + 'Uhr'
      : 'Heute ausgebucht – rufen Sie an, wir finden eine Lücke.';
    $('[data-st-cars]').textContent = s.cars;
    $$('[data-st-fleet] li').forEach((li, i) => { li.style.setProperty('--k', i); li.classList.toggle('avail', i < s.cars); });
    $('[data-st-clock]').textContent = 'Stand ' + String(s.now.getHours()).padStart(2, '0') + ':' + String(s.now.getMinutes()).padStart(2, '0');

    // Hebebühnen
    const lifts = $$('[data-st-lifts] li');
    lifts.forEach((li, i) => {
      const job = $('.l-job', li), bar = $('.l-bar i', li), pct = $('.l-pct', li);
      if (!s.open) {
        li.classList.add('idle'); job.textContent = 'Feierabend'; bar.style.setProperty('--p', 0); pct.textContent = '–';
        return;
      }
      const r2 = rng(daySeed(s.now) * 31 + i * 101);
      const period = 1.4 + r2() * 1.6, offset = r2() * period;
      const x = (s.h - s.hrs[0] + offset);
      const cycle = Math.floor(x / period), phase = (x % period) / period;
      const pick = rng(daySeed(s.now) + i * 977 + cycle * 7)();
      if (phase > 0.9) {
        li.classList.add('idle'); job.textContent = 'frei · wird vorbereitet'; bar.style.setProperty('--p', 0); pct.textContent = '–';
      } else {
        li.classList.remove('idle');
        job.textContent = LIFT_JOBS[Math.floor(pick * LIFT_JOBS.length)];
        const p = clamp(phase / 0.9, 0.03, 1);
        bar.style.setProperty('--p', p.toFixed(3));
        pct.textContent = Math.round(p * 100) + nbsp + '%';
      }
    });

    // Öffnungszeiten: heute markieren
    $$('.hours tr').forEach(tr => tr.classList.toggle('today', +tr.dataset.day === s.now.getDay()));
  }
  renderStatus();
  setInterval(() => { if (!document.hidden) renderStatus(); }, 20000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) renderStatus(); });


  await pause(); // ---- Start in Etappen: jeder Block in einem eigenen kurzen Task ----

  /* ======================================================================
     Leistungen – schwebendes Vorschaubild (nur Maus)
     ====================================================================== */
  const svcTable = $('[data-svc]');
  const float = $('[data-svc-float]');
  if (fine && float && innerWidth >= 900) {
    const imgs = $$('[data-svc-img]', float);
    const tag = $('[data-svc-tag]');
    const P = { x: 0, y: 0, tx: 0, ty: 0, raf: 0, on: false };
    const loop = () => {
      P.x += (P.tx - P.x) * (motionOK ? 0.16 : 1);
      P.y += (P.ty - P.y) * (motionOK ? 0.16 : 1);
      const rot = motionOK ? clamp((P.tx - P.x) * 0.04, -6, 6) : 0;
      float.style.transform = 'translate3d(' + P.x.toFixed(1) + 'px,' + P.y.toFixed(1) + 'px,0) rotate(' + rot.toFixed(2) + 'deg)';
      if (P.on || Math.abs(P.tx - P.x) > 0.5) P.raf = requestAnimationFrame(loop); else P.raf = 0;
    };
    $$('.svc-list .svc-row').forEach(row => {
      row.addEventListener('pointerenter', () => {
        imgs.forEach(im => im.classList.toggle('on', im.dataset.svcImg === row.dataset.img));
        tag.textContent = $('.svc-no', row).textContent;
      });
    });
    const list = $('.svc-list');
    list.addEventListener('pointermove', e => {
      const r = svcTable.getBoundingClientRect();
      P.tx = clamp(e.clientX - r.left + 28, 0, r.width - 300);
      P.ty = e.clientY - r.top - 110;
      if (!P.on) { P.on = true; P.x = P.tx; P.y = P.ty; float.classList.add('on'); }
      if (!P.raf) P.raf = requestAnimationFrame(loop);
    });
    list.addEventListener('pointerleave', () => { P.on = false; float.classList.remove('on'); });
  }


  await pause(); // ---- Start in Etappen: jeder Block in einem eigenen kurzen Task ----

  /* ======================================================================
     3) Interaktive Seitenansicht
     ====================================================================== */
  const car = $('[data-car]');
  const carBox = $('[data-car-box]');
  const tabs = $$('[data-car-tabs] [role="tab"]');
  const ind = $('[data-car-ind]');
  const panels = $$('[data-panel]');
  const hots = $$('.hot');
  const selOut = $('[data-car-sel]');
  function placeInd(tab) {
    if (!ind || !tab) return;
    ind.style.transform = 'translateX(' + tab.offsetLeft + 'px) scaleX(' + (tab.offsetWidth / 100) + ')';
  }
  let onPartSelect = null;
  function selectPart(part, focus, noMeasure) {
    tabs.forEach(t => {
      const on = t.dataset.part === part;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      if (on) { if (!noMeasure) placeInd(t); if (focus) t.focus(); }
    });
    panels.forEach(p => {
      const on = p.dataset.panel === part;
      if (on && p.hidden) { p.hidden = false; p.classList.remove('enter'); void p.offsetWidth; p.classList.add('enter'); }
      else p.hidden = !on;
    });
    hots.forEach(h => h.classList.toggle('is-active', h.dataset.part === part));
    car.dataset.active = part;
    if (onPartSelect) onPartSelect(part);
    const selT = tabs.find(t => t.dataset.part === part);
    if (selOut && selT) selOut.textContent = selT.textContent;
  }
  panels.forEach(p => { p.hidden = p.dataset.panel !== 'motor'; });
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => selectPart(t.dataset.part));
    t.addEventListener('keydown', e => {
      let j = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % tabs.length;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i - 1 + tabs.length) % tabs.length;
      if (e.key === 'Home') j = 0;
      if (e.key === 'End') j = tabs.length - 1;
      if (j !== null) { e.preventDefault(); selectPart(tabs[j].dataset.part, true); }
    });
  });
  hots.forEach(h => h.addEventListener('click', () => selectPart(h.dataset.part)));
  car.addEventListener('click', e => {
    const hit = e.target.closest('[data-hit]');
    if (hit) selectPart(hit.dataset.hit);
  });
  selectPart('motor', false, true);
  const placeSel = () => placeInd(tabs.find(t => t.getAttribute('aria-selected') === 'true'));
  requestAnimationFrame(placeSel); // Layout erst im nächsten Frame lesen – kein erzwungenes Layout während der Initialisierung
  addEventListener('resize', placeSel);
  if (document.fonts) document.fonts.ready.then(() => placeInd(tabs.find(t => t.getAttribute('aria-selected') === 'true')));


  await pause(); // ---- Start in Etappen: jeder Block in einem eigenen kurzen Task ----

  /* ======================================================================
     2) Service-Rechner
     ====================================================================== */
  const calc = $('[data-calc]');
  const co = {
    sheet: $('.co-sheet'), veh: $('[data-co-veh]'), lines: $('[data-co-lines]'), min: $('[data-co-min]'), max: $('[data-co-max]'),
    bar: $('[data-co-bar]'), time: $('[data-co-time]'), ready: $('[data-co-ready]'), hint: $('[data-co-hint]'), live: $('[data-co-live]'), id: $('[data-co-id]')
  };
  co.id.textContent = String(new Date().getFullYear()).slice(2) + String(new Date().getMonth() + 1).padStart(2, '0') + '-' + String(Math.floor(Math.random() * 900) + 100);
  const round5 = n => Math.round(n / 5) * 5;
  const fmtH = h => {
    if (h < 1) return Math.round(h * 60 / 5) * 5 + nbsp + 'min';
    const r = Math.round(h * 4) / 4;
    return String(r).replace('.', ',');
  };
  function fmtRange(a, b) {
    if (b < 1) return 'ca. ' + Math.round(a * 60 / 5) * 5 + '–' + Math.round(b * 60 / 5) * 5 + nbsp + 'min';
    return 'ca. ' + fmtH(a).replace(nbsp + 'min', '') + (a < 1 ? nbsp + 'min' : '') + '–' + fmtH(b) + nbsp + 'h';
  }
  let lastCalc = null;
  function computeCalc() {
    const fd = new FormData(calc);
    const cls = fd.get('klasse') || 'kompakt';
    const drv = fd.get('antrieb') || 'verbrenner';
    const sel = fd.getAll('leistung');
    const C = VEHICLE_CLASSES[cls];
    let min = 0, max = 0, tMin = 0, tMax = 0;
    const lines = sel.map(k => {
      const S = SERVICES[k];
      const f = (1 + (C.price - 1) * S.scale) * (S.drive[drv] || 1);
      const a = round5(S.min * f), b = round5(S.max * f);
      min += a; max += b;
      tMin += S.tMin * C.time; tMax += S.tMax * C.time;
      return { key: k, label: (drv === 'elektro' && S.labelElektro) ? S.labelElektro : S.label, a, b };
    });
    if (sel.length > 1) { tMin *= COMBO_TIME_FACTOR; tMax *= COMBO_TIME_FACTOR; }
    return { cls, drv, sel, lines, min, max, tMin, tMax, vehLabel: C.label + ' · ' + DRIVES[drv] };
  }
  let prevKeys = [];
  // Preisanzeige zählt wie ein Zählwerk zum neuen Wert (unterbrechbar: startet immer beim gerade angezeigten Wert)
  const PT = { a: null, b: null, raf: 0 };
  const takeBtn = $('[data-co-take]');
  const showPrice = (a, b) => { co.min.textContent = fmtInt(a); co.max.textContent = fmtInt(b); };
  function tweenPrice(r) {
    cancelAnimationFrame(PT.raf);
    if (!r.lines.length) { PT.a = PT.b = null; co.min.textContent = '—'; co.max.textContent = ''; return; }
    if (!motionOK || PT.a == null) { PT.a = r.min; PT.b = r.max; showPrice(r.min, r.max); return; }
    const a0 = PT.a, b0 = PT.b, t0 = performance.now(), dur = 450;
    const step = now => {
      const p = clamp((now - t0) / dur, 0, 1), e = 1 - Math.pow(1 - p, 4);
      PT.a = Math.round(a0 + (r.min - a0) * e); PT.b = Math.round(b0 + (r.max - b0) * e);
      showPrice(PT.a, PT.b);
      if (p < 1) PT.raf = requestAnimationFrame(step);
    };
    PT.raf = requestAnimationFrame(step);
  }
  // Stempel „Richtwert“ setzt bei jeder Änderung neu auf (Feder mit Nachschwingen)
  const stamp = $('[data-co-stamp]');
  let stampN = 0;
  const thump = getComputedStyle(root).getPropertyValue('--ease-thump').trim() || 'ease-out';
  function stampIt(r) {
    if (!motionOK || !stamp.animate || !r.lines.length || !stampN++) return;
    stamp.animate([
      { transform: 'rotate(-17deg) scale(1.5)', opacity: 0 },
      { transform: 'rotate(-11deg) scale(1)', opacity: 0.82 }
    ], { duration: 560, easing: thump });
  }
  function renderCalc() {
    const r = computeCalc();
    lastCalc = r;
    co.veh.textContent = r.vehLabel;
    co.lines.textContent = '';
    if (!r.lines.length) {
      const li = document.createElement('li');
      li.className = 'empty';
      li.textContent = 'Bitte mindestens eine Leistung wählen.';
      co.lines.appendChild(li);
    }
    r.lines.forEach(l => {
      const li = document.createElement('li');
      if (!prevKeys.includes(l.key)) li.className = 'new';
      const a = document.createElement('span'); a.textContent = l.label;
      const b = document.createElement('span'); b.className = 'tnum'; b.textContent = fmtInt(l.a) + '–' + euro(l.b);
      li.append(a, b);
      co.lines.appendChild(li);
    });
    prevKeys = r.sel.slice();
    // leerer Zustand: Preis gedimmt, Übernahme-Button als nicht verfügbar markiert
    co.sheet.classList.toggle('is-empty', !r.lines.length);
    takeBtn.setAttribute('aria-disabled', r.lines.length ? 'false' : 'true');
    tweenPrice(r);
    stampIt(r);
    const aPct = clamp(r.min / PRICE_SCALE_MAX, 0, 1) * 100;
    const w = r.lines.length ? Math.max(0.012, clamp((r.max - r.min) / PRICE_SCALE_MAX, 0, 1 - aPct / 100)) : 0;
    co.bar.style.setProperty('--a', aPct.toFixed(2) + '%');
    co.bar.style.setProperty('--w', w.toFixed(4));
    co.bar.style.transform = 'translateX(' + aPct.toFixed(2) + '%) scaleX(' + w.toFixed(4) + ')';
    co.time.textContent = r.lines.length ? fmtRange(r.tMin, r.tMax) : '–';
    const sameDay = r.tMax <= SAME_DAY_MAX_HOURS;
    co.ready.textContent = !r.lines.length ? '–' : (sameDay ? 'am selben Tag' : 'am Folgetag');
    co.hint.classList.toggle('warn', !sameDay && r.lines.length > 0);
    co.hint.textContent = !r.lines.length ? 'Wählen Sie links eine oder mehrere Leistungen.'
      : sameDay ? (r.tMax <= 1.5 ? 'Wartetermin möglich – Kaffee und WLAN im Kundenraum.' : 'Bringen Sie das Auto morgens, abholen ab 16 Uhr.')
      : 'Bleibt über Nacht: Ersatzwagen ohne Aufpreis, nach Verfügbarkeit.';
    co.live.textContent = r.lines.length
      ? 'Beispielrechnung: ' + r.min + ' bis ' + r.max + ' Euro, Werkstattzeit ' + co.time.textContent.replace(/ /g, ' ') + ', Abholung ' + co.ready.textContent + '.'
      : 'Keine Leistung gewählt.';
    if (motionOK) { co.sheet.classList.add('tick'); requestAnimationFrame(() => requestAnimationFrame(() => co.sheet.classList.remove('tick'))); }
  }
  calc.addEventListener('change', renderCalc);
  renderCalc();

  // Voreinstellungen aus Leistungen / Fahrzeug-Check
  $$('[data-preset]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    const key = a.dataset.preset;
    $$('input[name="leistung"]', calc).forEach(i => { i.checked = i.value === key; });
    renderCalc();
    scrollToEl($('#rechner'), () => { const i = $('input[name="leistung"][value="' + key + '"]', calc); if (i) i.focus({ preventScroll: true }); });
  }));

  /* ---------- Übernahme ins Formular ---------- */
  const form = $('[data-form]');
  const takeover = $('[data-takeover]');
  let takeoverData = null;
  function setTakeover(title, text, opts = {}) {
    takeoverData = { title, text };
    $('[data-takeover-title]').textContent = title;
    $('[data-takeover-text]').textContent = text;
    takeover.hidden = false;
    if (opts.cls) form.elements.klasse.value = opts.cls;
    if (opts.services) $$('input[name="f-leistung"]', form).forEach(i => { if (opts.services.includes(i.value)) i.checked = true; });
    if (opts.date) form.elements.datum.value = opts.date;
    if (opts.loan) form.elements.ersatzwagen.checked = true;
    scrollToEl($('#termin'), () => form.elements.name.focus({ preventScroll: true }));
  }
  $('[data-takeover-x]').addEventListener('click', () => { takeover.hidden = true; takeoverData = null; form.elements.name.focus(); });
  $('[data-co-take]').addEventListener('click', () => {
    const r = lastCalc || computeCalc();
    if (!r.lines.length) { co.hint.textContent = 'Bitte zuerst mindestens eine Leistung wählen.'; co.live.textContent = co.hint.textContent; return; }
    const txt = r.vehLabel + ': ' + r.lines.map(l => l.label).join(', ') + ' – Richtwert ' + fmtInt(r.min) + '–' + euro(r.max) + ', ' + co.time.textContent;
    setTakeover('Aus dem Service-Rechner übernommen', txt, { cls: r.cls, services: r.sel, loan: r.tMax > SAME_DAY_MAX_HOURS });
  });


  await pause(); // ---- Start in Etappen: jeder Block in einem eigenen kurzen Task ----

  /* ======================================================================
     4) HU-Erinnerung
     ====================================================================== */
  const hu = $('[data-hu]');
  const huM = $('[data-hu-m]'), huY = $('[data-hu-y]');
  const now0 = new Date();
  (function fillYears() {
    const y = now0.getFullYear();
    huY.textContent = '';
    for (let i = y - 4; i <= y; i++) { const o = document.createElement('option'); o.value = o.textContent = i; huY.appendChild(o); }
    const base = new Date(now0.getFullYear(), now0.getMonth() - 17, 1);
    huM.value = String(base.getMonth() + 1);
    huY.value = String(base.getFullYear());
  })();
  const H = {
    rot: $('[data-hu-rot]'), svg: $('.hu-sticker'), year: $('[data-hu-year]'), due: $('[data-hu-due]'), state: $('[data-hu-state]'),
    tip: $('[data-hu-tip]'), cycle: $('[data-hu-cycle]'), cd: { d: $('[data-cd="d"]'), h: $('[data-cd="h"]'), m: $('[data-cd="m"]'), s: $('[data-cd="s"]') }
  };
  let huRes = null, huRotation = 0;
  function computeHU() {
    const basis = (new FormData(hu)).get('hu-basis') || 'hu';
    const m = +huM.value, y = +huY.value;
    const interval = basis === 'ez' ? HU_FIRST : HU_INTERVAL;
    const due = new Date(y, m - 1 + interval, 1);        // erster Tag des Fälligkeitsmonats
    const end = new Date(due.getFullYear(), due.getMonth() + 1, 0, 23, 59, 59); // Monatsende
    const start = new Date(y, m - 1, 1);
    return { basis, interval, due, end, start, dueM: due.getMonth() + 1, dueY: due.getFullYear() };
  }
  function renderHU() {
    const r = computeHU();
    huRes = r;
    const c = HU_COLORS[(((r.dueY - 2024) % 6) + 6) % 6];
    H.svg.style.setProperty('--hs', c.bg);
    H.svg.style.setProperty('--hs-fg', c.fg);
    H.year.textContent = String(r.dueY).slice(2);
    // kürzester Drehweg, damit der Fälligkeitsmonat oben steht
    const target = -r.dueM * 30;
    let delta = ((target - huRotation) % 360 + 540) % 360 - 180;
    huRotation += delta;
    H.rot.style.transform = 'rotate(' + huRotation + 'deg)';
    H.due.textContent = MONTHS[r.dueM - 1] + ' ' + r.dueY;
    const now = new Date();
    const monthsLeft = (r.dueY - now.getFullYear()) * 12 + (r.dueM - 1 - now.getMonth());
    let state, label, tip;
    if (now > r.end) {
      const over = -monthsLeft - 1; // volle Monate seit Ablauf des Fälligkeitsmonats
      state = 'few'; label = over < 1 ? 'überfällig seit diesem Monat' : 'überfällig seit ' + over + ' ' + (over === 1 ? 'Monat' : 'Monaten');
      tip = 'Bitte zeitnah einen Termin vereinbaren. Bei mehr als zwei Monaten Überziehung wird in der Regel eine erweiterte Prüfung fällig, die etwas mehr kostet – Orientierung, keine Rechtsberatung.';
    } else if (monthsLeft <= 2) {
      state = 'few'; label = monthsLeft <= 0 ? 'diesen Monat fällig' : 'bald fällig · in ' + monthsLeft + ' ' + (monthsLeft === 1 ? 'Monat' : 'Monaten');
      tip = 'Jetzt ist ein guter Zeitpunkt: Bis zu einem Monat vor Fälligkeit verlieren Sie in der Regel keine Zeit. Prüfingenieur bei uns: Di und Do.';
    } else {
      state = 'open'; label = 'gültig · noch ' + monthsLeft + ' Monate';
      tip = 'Tipp: Bis zu einem Monat vor Fälligkeit verlieren Sie in der Regel keine Zeit – die nächste Frist läuft dann ab dem ursprünglichen Monat.';
    }
    H.state.dataset.state = state;
    $('span:last-child', H.state).textContent = label;
    H.tip.textContent = tip;
    H.tip.classList.toggle('warn', state === 'few');
    // Zyklus-Balken
    H.cycle.style.setProperty('--n', r.interval);
    H.cycle.textContent = '';
    const elapsed = (now.getFullYear() - r.start.getFullYear()) * 12 + (now.getMonth() - r.start.getMonth());
    for (let i = 0; i < r.interval; i++) {
      const s = document.createElement('i');
      if (elapsed >= r.interval) s.className = 'c-over';
      else if (i < elapsed) s.className = 'c-done';
      else if (i === elapsed) s.className = 'c-now';
      H.cycle.appendChild(s);
    }
    tickHU();
  }
  // Tage als Zählwerk: jede Ziffer rollt auf ihren Wert (nur mit Bewegung)
  function setOdo(el, txt) {
    if (!motionOK) { el.textContent = txt; return; }
    if (el.dataset.odo !== String(txt.length)) {
      el.textContent = '';
      for (let i = 0; i < txt.length; i++) {
        const dg = document.createElement('span'); dg.className = 'd';
        const col = document.createElement('span'); col.style.setProperty('--k', i);
        for (let n = 0; n < 10; n++) { const s = document.createElement('span'); s.textContent = n; col.appendChild(s); }
        dg.appendChild(col); el.appendChild(dg);
      }
      el.dataset.odo = String(txt.length);
    }
    Array.from(el.children).forEach((dg, i) => { dg.firstChild.style.transform = 'translateY(' + (-(+txt[i]) * 10) + '%)'; });
  }
  function tickHU() {
    if (!huRes) return;
    let ms = Math.max(0, huRes.end - new Date());
    const d = Math.floor(ms / 864e5); ms -= d * 864e5;
    const h = Math.floor(ms / 36e5); ms -= h * 36e5;
    const m = Math.floor(ms / 6e4); ms -= m * 6e4;
    const s = Math.floor(ms / 1e3);
    setOdo(H.cd.d, String(d).padStart(3, '0'));
    H.cd.h.textContent = String(h).padStart(2, '0');
    H.cd.m.textContent = String(m).padStart(2, '0');
    H.cd.s.textContent = String(s).padStart(2, '0');
  }
  hu.addEventListener('change', renderHU);
  renderHU();
  let huTimer = 0;
  new IntersectionObserver(([en]) => {
    clearInterval(huTimer);
    if (en.isIntersecting) huTimer = setInterval(() => { if (!document.hidden) tickHU(); }, 1000);
  }).observe($('[data-hu-out]'));

  const isoDate = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  function nextTueThu(from) {
    const d = new Date(from);
    for (let i = 0; i < 14; i++) { if (d.getDay() === 2 || d.getDay() === 4) return d; d.setDate(d.getDate() + 1); }
    return d;
  }
  $('[data-hu-take]').addEventListener('click', () => {
    const r = huRes || computeHU();
    const tomorrow = new Date(); tomorrow.setHours(0, 0, 0, 0); tomorrow.setDate(tomorrow.getDate() + 1);
    const early = new Date(r.dueY, r.dueM - 2, 1);
    const date = nextTueThu(early > tomorrow ? early : tomorrow);
    setTakeover('Aus der HU-Erinnerung übernommen', 'HU/AU fällig: ' + MONTHS[r.dueM - 1] + ' ' + r.dueY + ' – Vorschlag: ' + DAYS[date.getDay()] + ', ' + date.toLocaleDateString('de-DE'), { services: ['hu'], date: isoDate(date) });
  });
  $('[data-hu-ics]').addEventListener('click', () => {
    const r = huRes || computeHU();
    const remind = new Date(r.dueY, r.dueM - 2, 1);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const day = remind < today ? new Date(today.getTime() + 864e5) : remind;
    const next = new Date(day.getTime() + 864e5);
    const ymd = d => isoDate(d).replace(/-/g, '');
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Kfz-Berger Demo//HU-Erinnerung//DE', 'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT', 'UID:hu-' + Date.now() + '@kfz-berger.de', 'DTSTAMP:' + stamp,
      'DTSTART;VALUE=DATE:' + ymd(day), 'DTEND;VALUE=DATE:' + ymd(next),
      'SUMMARY:HU fällig im ' + MONTHS[r.dueM - 1] + ' ' + r.dueY + ' – Termin vereinbaren',
      'DESCRIPTION:Kfz-Meisterwerkstatt Berger (Demo)\\, Tel. 0231 555 72 40\\, Rheinische Straße 140\\, 44147 Dortmund. HU/AU im Haus: Di + Do.',
      'BEGIN:VALARM', 'TRIGGER:PT9H', 'ACTION:DISPLAY', 'DESCRIPTION:HU-Erinnerung', 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = 'hu-erinnerung.ics';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  });


  await pause(); // ---- Start in Etappen: jeder Block in einem eigenen kurzen Task ----

  /* ======================================================================
     Set Piece: Diagnose-Scan über die Seitenansicht
     Beim ersten Erscheinen fährt ein Prüfbalken über das Auto und hakt die
     Prüfpunkte im Protokoll ab; danach rastet er (Feder) am gewählten Bauteil ein.
     ====================================================================== */
  const SCAN_POS = { licht: 0.113, klima: 0.45, motor: 0.25, bremsen: 0.274, reifen: 0.762 };   // Lage im Zeichnungsrahmen (0–1)
  const SCAN_LOG = [['licht', 0.11], ['klima', 0.15], ['motor', 0.22], ['bremsen', 0.28], ['reifen', 0.77], ['licht-r', 0.9]];
  const scanLog = $('[data-scan-log]');
  const logItems = new Map($$('li', scanLog).map(li => [li.dataset.log, li]));
  const beamEl = document.createElement('i');
  beamEl.className = 'scan-beam'; beamEl.setAttribute('aria-hidden', 'true');
  carBox.appendChild(beamEl);
  const SC = { x: -0.1, v: 0, target: -0.1, raf: 0, done: false, last: 0, w: 1 };
  const placeBeam = () => { beamEl.style.transform = 'translate3d(' + (SC.x * SC.w).toFixed(1) + 'px,0,0)'; };
  const measureScan = () => { SC.w = carBox.clientWidth; placeBeam(); };
  function flashPart(part) {
    $$('.p-' + part, car).forEach(el => { el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 420); });
  }
  function lockFrame() {
    const now = performance.now(), dt = Math.min(0.034, Math.max(0.004, (now - SC.last) / 1000)); SC.last = now;
    const k = 120, c = 2 * Math.sqrt(k) * 0.45;
    SC.v += (k * (SC.target - SC.x) - c * SC.v) * dt; SC.x += SC.v * dt;
    placeBeam();
    if (Math.abs(SC.v) > 0.0004 || Math.abs(SC.target - SC.x) > 0.0004) SC.raf = requestAnimationFrame(lockFrame);
    else { SC.raf = 0; SC.x = SC.target; placeBeam(); }
  }
  function lockOn(part) {
    if (!SC.done || !motionOK) return;
    SC.target = SCAN_POS[part] != null ? SCAN_POS[part] : 0.5;
    logItems.forEach((li, k) => li.classList.toggle('sel', k === part || (part === 'licht' && k === 'licht-r')));
    carBox.classList.add('is-locked');
    if (!SC.raf) { SC.last = performance.now(); SC.raf = requestAnimationFrame(lockFrame); }
  }
  function runScan() {
    measureScan();
    carBox.classList.add('is-scanning');
    const t0 = performance.now(), dur = 1700;
    let li = 0;
    const step = now => {
      const p = clamp((now - t0) / dur, 0, 1);
      const e = p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      SC.x = -0.1 + e * 1.2;
      placeBeam();
      while (li < SCAN_LOG.length && SC.x >= SCAN_LOG[li][1]) {
        const [k] = SCAN_LOG[li];
        const item = logItems.get(k); if (item) item.classList.add('done');
        flashPart(k === 'licht-r' ? 'licht' : k);
        li++;
      }
      if (p < 1) requestAnimationFrame(step);
      else {
        carBox.classList.remove('is-scanning');
        SC.done = true; SC.v = 0;
        lockOn(car.dataset.active || 'motor');
      }
    };
    requestAnimationFrame(step);
  }
  if (motionOK) {
    const sio = new IntersectionObserver(([en]) => { if (en.isIntersecting) { sio.disconnect(); runScan(); } }, { threshold: 0.55 });
    sio.observe(carBox);
    addEventListener('resize', measureScan, { passive: true });
  } else {
    logItems.forEach(li => li.classList.add('done'));
  }
  onPartSelect = lockOn;

  await pause(); // ---- Start in Etappen: jeder Block in einem eigenen kurzen Task ----

  /* ======================================================================
     Set Piece: Ablauf als Oszilloskop-Spur
     Jeder Schritt hat seine eigene Signalform (Klingeln, ruhiges Gespräch,
     unruhige Messwerte, Freigabe-Sprung, Arbeitstakt, ausschwingende Übergabe).
     Desktop: horizontale Strecke in einer hohen Sektion (position: sticky),
     Handy/ohne Bewegung: Wisch-Schiene mit derselben Spur.
     ====================================================================== */
  const flow = $('[data-flow]');
  const flowTrack = $('[data-flow-track]');
  const steps = $$('.step', flow);
  const gearOut = $('[data-shift-gear]');
  const traceP = $('[data-trace]'), ghostP = $('[data-trace-ghost]');
  const scopeEl = $('[data-scope]'), liveEl = $('[data-scope-live]'), beamDot = $('[data-beam]');
  const pager = $('[data-flow-pager]');
  const fpBtns = $$('button', pager);
  const fpN = $('[data-fp-n]');
  const mqMobile = matchMedia('(max-width: 899px)');
  const SCOPE = { W: 1, H: 160, mid: 80, amp: 60, segs: [], idx: -1 };
  // Signalformen je Schritt, u = 0…1 innerhalb des Schritts, Rückgabe −1…1
  const WAVES = [
    u => Math.exp(-Math.pow((u - 0.42) / 0.045, 2)) * Math.sin(u * 140) * 0.95,                               // Termin: das Telefon klingelt
    u => Math.sin(u * Math.PI * 4) * 0.42,                                                                     // Dialogannahme: ruhiges Gespräch
    u => (Math.sin(u * 61) * 0.35 + Math.sin(u * 23 + 1.3) * 0.3 + Math.sin(u * 137) * 0.18) * (0.6 + 0.4 * Math.sin(u * 9)), // Diagnose: Messrauschen
    u => { const s = 1 / (1 + Math.exp(-(u - 0.38) * 60)); return 0.35 - s * 1.0 + (u > 0.38 ? Math.exp(-(u - 0.38) * 22) * Math.sin((u - 0.38) * 70) * 0.25 : 0); }, // Freigabe: Sprung
    u => -0.65 + (((u * 9) % 1) < 0.5 ? 0.0 : 0.9) * 1,                                                        // Reparatur: Arbeitstakt
    u => -0.65 * Math.exp(-u * 5) * Math.cos(u * Math.PI * 9)                                                  // Übergabe: schwingt aus
  ];
  const yAt = x => {
    for (let i = 0; i < SCOPE.segs.length; i++) {
      const [a, b] = SCOPE.segs[i];
      if (x >= a && x < b) {
        const u = (x - a) / (b - a);
        const edge = Math.min(1, u / 0.06, (1 - u) / 0.06); // weiche Übergänge zwischen den Schritten
        return WAVES[i](u) * clamp(edge, 0, 1);
      }
    }
    return 0;
  };
  function buildScope() {
    const tr = flowTrack.getBoundingClientRect();
    const sl = flow.classList.contains('is-rail') ? flowTrack.scrollLeft : 0;
    SCOPE.W = Math.max(flowTrack.scrollWidth, flowTrack.offsetWidth);
    SCOPE.H = flow.classList.contains('is-rail') ? 120 : clamp(innerHeight * 0.2, 130, 200);
    SCOPE.mid = SCOPE.H / 2; SCOPE.amp = SCOPE.H * 0.4;
    flow.style.setProperty('--scope-h', SCOPE.H + 'px');
    scopeEl.style.setProperty('--scope-w', SCOPE.W + 'px');
    SCOPE.segs = steps.map((st, i) => {
      const r = st.getBoundingClientRect();
      const a = r.left - tr.left + sl;
      const nx = steps[i + 1] ? steps[i + 1].getBoundingClientRect().left - tr.left + sl : a + r.width + 40;
      return [a, nx];
    });
    let d = '';
    for (let x = 0; x <= SCOPE.W; x += 3) d += (x ? 'L' : 'M') + x + ' ' + (SCOPE.mid - yAt(x) * SCOPE.amp).toFixed(1);
    [traceP, ghostP].forEach(p => { const s = p.ownerSVGElement; s.setAttribute('viewBox', '0 0 ' + SCOPE.W + ' ' + SCOPE.H); s.setAttribute('preserveAspectRatio', 'none'); p.setAttribute('d', d); });
  }
  function setBeam(bx) {
    bx = clamp(bx, 0, SCOPE.W);
    liveEl.style.setProperty('--beam', bx.toFixed(1) + 'px');
    beamDot.style.transform = 'translate3d(' + bx.toFixed(1) + 'px,' + (SCOPE.mid - yAt(bx) * SCOPE.amp).toFixed(1) + 'px,0)';
    let idx = 0;
    SCOPE.segs.forEach(([a], i) => { if (bx >= a + 30) idx = i; });
    if (idx !== SCOPE.idx) {
      SCOPE.idx = idx;
      if (gearOut) gearOut.textContent = idx + 1;
      steps.forEach((st, k) => st.classList.toggle('on', k === idx));
    }
  }

  /* Wisch-Schiene (Handy, oder ohne Bewegung) */
  let fpIdx = -1, fpRaf = 0;
  function railUpdate() {
    fpRaf = 0;
    const max = flowTrack.scrollWidth - flowTrack.clientWidth;
    const step = steps[1] ? steps[1].offsetLeft - steps[0].offsetLeft : 1;
    const i = flowTrack.scrollLeft >= max - 4 ? steps.length - 1 : clamp(Math.round(flowTrack.scrollLeft / step), 0, steps.length - 1);
    setBeam(motionOK ? flowTrack.scrollLeft + flowTrack.clientWidth * 0.78 : SCOPE.W);
    if (i === fpIdx) return;
    fpIdx = i;
    fpN.textContent = i + 1;
    if (!motionOK) { if (gearOut) gearOut.textContent = i + 1; steps.forEach((st, k) => st.classList.toggle('on', k === i)); }
    fpBtns.forEach((b, k) => { if (k === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
  }
  function railSetup(on) {
    flow.classList.toggle('is-rail', on);
    pager.hidden = !on;
    if (on) {
      flowTrack.tabIndex = 0;
      flowTrack.setAttribute('aria-label', 'Ablauf in sechs Schritten – seitlich wischen');
      fpIdx = -1; SCOPE.idx = -1;
      buildScope();
      railUpdate();
    } else {
      flowTrack.removeAttribute('tabindex');
      flowTrack.removeAttribute('aria-label');
    }
  }
  flowTrack.addEventListener('scroll', () => { if (!fpRaf && flow.classList.contains('is-rail')) fpRaf = requestAnimationFrame(railUpdate); }, { passive: true });
  fpBtns.forEach((b, k) => b.addEventListener('click', () => {
    flowTrack.scrollTo({ left: steps[k].offsetLeft, behavior: motionOK ? 'smooth' : 'auto' });
  }));
  const wantsH = () => hasGSAP && motionOK && !mqMobile.matches;
  if (!wantsH()) railSetup(true);
  mqMobile.addEventListener('change', () => { if (!wantsH()) railSetup(true); });
  addEventListener('resize', () => { if (flow.classList.contains('is-rail')) { buildScope(); railUpdate(); } }, { passive: true });

  await pause(); // ---- Start in Etappen: jeder Block in einem eigenen kurzen Task ----

  /* ======================================================================
     GSAP-Choreografie – erst nach dem Hero-Intro und in kleinen Häppchen
     initialisiert, damit der erste Bildschirm ohne lange Tasks aufbaut.
     ====================================================================== */
  if (hasGSAP && motionOK) {
    const mm = gsap.matchMedia();

    // Ablauf: horizontale Strecke (nur Desktop). Statt GSAP-Pin (position: fixed → CLS)
    // hält CSS `position: sticky` die Bühne; die Sektion bekommt die nötige Scrollhöhe.
    const initFlow = () => mm.add('(min-width: 900px)', () => {
      railSetup(false);
      flow.classList.add('is-h');
      const view = $('.flow-view', flow);
      const dist = () => Math.max(0, flowTrack.scrollWidth - view.clientWidth);
      const setH = () => { flow.style.height = Math.round(innerHeight + dist() * 1.1 + innerHeight * 0.2) + 'px'; };
      const rebuild = () => { buildScope(); setBeam(-(gsap.getProperty(flowTrack, 'x') || 0) + view.clientWidth * 0.62); };
      setH(); buildScope();
      ScrollTrigger.addEventListener('refreshInit', setH);
      ScrollTrigger.addEventListener('refresh', rebuild);
      const tw = gsap.to(flowTrack, {
        x: () => -dist(), ease: 'none',
        onUpdate: () => setBeam(-gsap.getProperty(flowTrack, 'x') + view.clientWidth * 0.62),
        scrollTrigger: { trigger: flow, start: 'top top', end: 'bottom bottom', scrub: 0.8, invalidateOnRefresh: true }
      });
      setBeam(view.clientWidth * 0.62);
      return () => {
        ScrollTrigger.removeEventListener('refreshInit', setH);
        ScrollTrigger.removeEventListener('refresh', rebuild);
        tw.scrollTrigger && tw.scrollTrigger.kill(); tw.kill();
        flow.classList.remove('is-h'); flow.style.height = '';
        gsap.set(flowTrack, { clearProps: 'transform' });
        railSetup(true);
      };
    });

    // Auftragszettel läuft beim Hereinscrollen aus dem Druckerschlitz
    const initFeed = () => mm.add('(min-width: 0px)', () => {
      const sheet = $('.co-sheet');
      const tw = gsap.fromTo(sheet, { yPercent: -62 }, {
        yPercent: 0, ease: 'none',
        scrollTrigger: { trigger: '.calc-out', start: 'top 92%', end: 'top 45%', scrub: 0.9 }
      });
      return () => { tw.scrollTrigger && tw.scrollTrigger.kill(); tw.kill(); gsap.set(sheet, { clearProps: 'transform' }); };
    });

    // Kapitel mit content-visibility bekommen ihre echte Höhe erst unterwegs → Trigger-Positionen nachziehen
    let roT = 0, roOn = false;
    const cvRO = new ResizeObserver(() => { if (!roOn) return; clearTimeout(roT); roT = setTimeout(() => ScrollTrigger.refresh(), 160); });
    $$('#status, #leistungen, #fahrzeug, #rechner, #hu').forEach(s => cvRO.observe(s));
    setTimeout(() => { roOn = true; }, 2500);
    const queue = [initFlow, initFeed];
    const idle = window.requestIdleCallback ? cb => requestIdleCallback(cb, { timeout: 900 }) : cb => setTimeout(cb, 120);
    const pump = () => {
      const f = queue.shift();
      if (f) f();
      if (queue.length) idle(pump);
      else if (document.readyState === 'complete') ScrollTrigger.refresh();
      else addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
    };
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      ['scroll', 'wheel', 'touchstart', 'keydown'].forEach(t => removeEventListener(t, start));
      initLenis();
      idle(pump);
    };
    ['scroll', 'wheel', 'touchstart', 'keydown'].forEach(t => addEventListener(t, start, { passive: true }));
    setTimeout(start, scrollY > 0 ? 0 : 700);
    if (document.fonts) document.fonts.ready.then(() => { if (started && !queue.length && document.readyState === 'complete') ScrollTrigger.refresh(); });
  }

  await pause(); // ---- Start in Etappen: jeder Block in einem eigenen kurzen Task ----

  /* ======================================================================
     Terminanfrage – Validierung & Erfolgsansicht
     ====================================================================== */
  const done = $('[data-done]');
  const dateIn = form.elements.datum;
  const tmr = new Date(); tmr.setDate(tmr.getDate() + 1);
  dateIn.min = isoDate(tmr);
  let tried = false;
  function setErr(input, errEl, msg) {
    if (input) input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    errEl.textContent = msg || '';
  }
  function validate() {
    const f = form.elements;
    const errs = [];
    const name = f.name.value.trim();
    setErr(f.name, $('#e-name'), name.length < 2 ? 'Bitte geben Sie Ihren Namen an.' : '');
    if (name.length < 2) errs.push(f.name);
    const tel = f.telefon.value.trim();
    const telOk = /^[+()\d\s/-]{6,}$/.test(tel) && (tel.match(/\d/g) || []).length >= 6;
    setErr(f.telefon, $('#e-tel'), !tel ? 'Bitte eine Telefonnummer für den Rückruf angeben.' : (!telOk ? 'Die Telefonnummer sieht unvollständig aus.' : ''));
    if (!telOk) errs.push(f.telefon);
    const mail = f.email.value.trim();
    const mailOk = !mail || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail);
    setErr(f.email, $('#e-mail'), mailOk ? '' : 'Bitte eine gültige E-Mail-Adresse angeben (oder leer lassen).');
    if (!mailOk) errs.push(f.email);
    const kz = f.kennzeichen.value.trim();
    const kzOk = !kz || /^[A-ZÄÖÜ]{1,3}[-\s]?[A-Z]{1,2}[-\s]?\d{1,4}[EH]?$/i.test(kz);
    setErr(f.kennzeichen, $('#e-kz'), kzOk ? '' : 'Format z. B. DO-AB 1234 (oder leer lassen).');
    if (!kzOk) errs.push(f.kennzeichen);
    const carv = f.fahrzeug.value.trim();
    setErr(f.fahrzeug, $('#e-car'), carv.length < 2 ? 'Bitte Marke und Modell angeben.' : '');
    if (carv.length < 2) errs.push(f.fahrzeug);
    const svc = $$('input[name="f-leistung"]:checked', form);
    $('#e-svc').textContent = svc.length ? '' : 'Bitte mindestens eine Leistung auswählen.';
    if (!svc.length) errs.push($('input[name="f-leistung"]', form));
    let dMsg = '';
    if (!dateIn.value) dMsg = 'Bitte einen Wunschtermin wählen.';
    else {
      const d = new Date(dateIn.value + 'T12:00:00');
      if (d < new Date(dateIn.min + 'T00:00:00')) dMsg = 'Der Termin muss in der Zukunft liegen.';
      else if (d.getDay() === 0) dMsg = 'Sonntags ist geschlossen – bitte Mo bis Sa wählen.';
      else if (svc.some(i => i.value === 'hu') && ![2, 4].includes(d.getDay())) dMsg = 'HU/AU ist nur dienstags und donnerstags möglich.';
    }
    setErr(dateIn, $('#e-date'), dMsg);
    if (dMsg) errs.push(dateIn);
    const ds = f.datenschutz.checked;
    setErr(f.datenschutz, $('#e-ds'), ds ? '' : 'Bitte stimmen Sie der Verarbeitung Ihrer Angaben zu.');
    if (!ds) errs.push(f.datenschutz);
    return errs;
  }
  form.addEventListener('input', () => { if (tried) validate(); });
  form.addEventListener('change', () => { if (tried) validate(); });
  form.addEventListener('submit', e => {
    e.preventDefault();
    tried = true;
    const errs = validate();
    if (errs.length) { errs[0].focus(); return; }
    const f = form.elements;
    const labels = $$('input[name="f-leistung"]:checked', form).map(i => i.nextElementSibling.textContent);
    const d = new Date(dateIn.value + 'T12:00:00');
    const rows = [
      ['Name', f.name.value.trim()],
      ['Telefon', f.telefon.value.trim()],
      ['E-Mail', f.email.value.trim() || '–'],
      ['Fahrzeug', f.fahrzeug.value.trim() + (f.kennzeichen.value.trim() ? ' (' + f.kennzeichen.value.trim().toUpperCase() + ')' : '') + ' · ' + f.klasse.options[f.klasse.selectedIndex].text],
      ['Leistungen', labels.join(', ')],
      ['Wunschtermin', DAYS[d.getDay()] + ', ' + d.toLocaleDateString('de-DE') + ' · ' + f.bringzeit.value],
      ['Extras', [f.ersatzwagen.checked ? 'Ersatzwagen' : '', f.holservice.checked ? 'Hol- & Bringservice' : ''].filter(Boolean).join(', ') || '–']
    ];
    if (takeoverData) rows.push(['Übernommen', takeoverData.text]);
    if (f.nachricht.value.trim()) rows.push(['Nachricht', f.nachricht.value.trim()]);
    const dl = $('[data-done-sum]');
    dl.textContent = '';
    rows.forEach(([k, v]) => {
      const dt = document.createElement('dt'); dt.textContent = k;
      const dd = document.createElement('dd'); dd.textContent = v;
      dl.append(dt, dd);
    });
    $('[data-done-name]').textContent = f.name.value.trim().split(/\s+/)[0];
    form.hidden = true;
    done.hidden = false;
    done.focus({ preventScroll: true });
    scrollToEl($('#termin'));
  });
  $('[data-done-reset]').addEventListener('click', () => {
    form.reset();
    tried = false;
    $$('[data-err]', form).forEach(el => { el.textContent = ''; });
    $$('[aria-invalid]', form).forEach(el => el.removeAttribute('aria-invalid'));
    takeover.hidden = true; takeoverData = null;
    done.hidden = true;
    form.hidden = false;
    form.elements.name.focus();
  });

  if (!(hasGSAP && motionOK)) initLenis();
  window.__bergerReady = true;
})();
