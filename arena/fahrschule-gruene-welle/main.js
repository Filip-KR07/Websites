/* =========================================================================
   Fahrschule Grüne Welle – Modell „Spur“ · main.js
   Ohne Build-Schritt. GSAP/ScrollTrigger/Lenis liegen lokal unter assets/vendor.
   Alle Preise und Kursregeln sind fiktive Demo-Werte (siehe Konstanten unten).
   ========================================================================= */

/* ---------------------------------------------------------------------------
   KONSTANTEN – hier Preise, Kursregeln und Texte anpassen
   --------------------------------------------------------------------------- */

/** Kostenrechner: Preise in Euro (fiktiv). Fahrstunden/Sonderfahrten à 45 Minuten.
 *  grund      = Grundbetrag beim Ersterwerb (Anmeldung, Theorieunterricht, Lern-App)
 *  grundErw   = Grundbetrag bei Erweiterung (bereits eine Fahrerlaubnis vorhanden)
 *  stunde     = Übungsfahrstunde
 *  sonder     = Sonderfahrt (Überland/Autobahn/Dunkelheit), sonderAnz = Pflichtanzahl
 *  vorTheorie / vorPraxis   = Vorstellung zur Prüfung durch die Fahrschule
 *  tuevTheorie / tuevPraxis = Gebühr der Prüforganisation (gerundete Beispielwerte)
 *  empf       = typische Anzahl Übungsstunden je Vorerfahrung [keine, etwas, Führerschein vorhanden]
 *  neben      = Nebenkosten [Ersterwerb, Erweiterung] (Sehtest, Erste Hilfe, Passbild, Antrag)
 *  nurErweiterung = Klasse setzt eine andere Klasse voraus (BE braucht B)                       */
const PREISE = {
  B:  { grund: 449, grundErw: 199, stunde: 72, sonder: 89, sonderAnz: 12, vorTheorie: 99, vorPraxis: 259, tuevTheorie: 25.31, tuevPraxis: 130.05, empf: [28, 22, 16], neben: [125, 58] },
  BE: { grund: 199, grundErw: 199, stunde: 89, sonder: 99, sonderAnz: 5, vorTheorie: 0, vorPraxis: 229, tuevTheorie: 0, tuevPraxis: 130.05, empf: [8, 8, 7], neben: [58, 58], nurErweiterung: true },
  A:  { grund: 449, grundErw: 249, stunde: 79, sonder: 95, sonderAnz: 12, vorTheorie: 99, vorPraxis: 279, tuevTheorie: 25.31, tuevPraxis: 145, empf: [24, 18, 12], neben: [125, 58] },
  A2: { grund: 449, grundErw: 249, stunde: 76, sonder: 92, sonderAnz: 12, vorTheorie: 99, vorPraxis: 269, tuevTheorie: 25.31, tuevPraxis: 145, empf: [22, 16, 12], neben: [125, 58] },
  AM: { grund: 299, grundErw: 179, stunde: 62, sonder: 0, sonderAnz: 0, vorTheorie: 79, vorPraxis: 179, tuevTheorie: 25.31, tuevPraxis: 90, empf: [10, 8, 6], neben: [125, 58] },
};
/** ± Stunden um den typischen Wert, die als „grüner Bereich“ am Regler markiert werden */
const SPANNE = 6;

/** Kurskalender: Kursarten und Regeln. Termine werden ab dem aktuellen Monat erzeugt.
 *  regel: 'b14'  = Mo–Fr, alle 14 Tage ab dem Referenz-Montag
 *         'we12' = 1. und 2. Wochenende im Monat (Sa + So)
 *         'we3'  = 3. Wochenende im Monat (Sa + So)                                   */
const KURSE = [
  { id: 'b',  regel: 'b14',  kurz: 'B',    typ: 'Klasse B',      name: 'Intensivkurs Klasse B', zeit: '9:00–13:30 Uhr', plaetze: 16, inhalt: 'Kompletter Grund- und Klassenstoff in einer Woche' },
  { id: 'a',  regel: 'we12', kurz: 'A/A2', typ: 'Klasse A / A2', name: 'Wochenendkurs A/A2',    zeit: 'Sa & So 10:00–15:30 Uhr', plaetze: 12, inhalt: 'Grund- und Zweiradstoff an zwei Wochenenden' },
  { id: 'am', regel: 'we3',  kurz: 'AM',   typ: 'Klasse AM',     name: 'AM-Kompakt',            zeit: 'Sa & So 9:00–14:00 Uhr', plaetze: 12, inhalt: 'Roller-Theorie kompakt an einem Wochenende' },
];
const KURS_REFERENZ_MONTAG = '2026-01-05';
const KURS_MONATE = 4;            // angezeigte Monate ab heute
const THEORIE_WOCHENTAGE = [1, 3]; // Mo & Mi, 18:30 Uhr

/** Mindestalter je Klasse (für den Hinweis im Formular) */
const MINDESTALTER = { B: 18, B17: 17, B197: 18, BE: 18, A: 24, A2: 18, AM: 16 };

(() => {
  'use strict';

  const d = document;
  const w = window;
  const root = d.documentElement;
  const MOTION = root.classList.contains('motion-ok');
  const $ = (s, c = d) => c.querySelector(s);
  const $$ = (s, c = d) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const hasGsap = !!(w.gsap && w.ScrollTrigger);
  const raf = w.requestAnimationFrame.bind(w);
  const eur = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0, minimumFractionDigits: 0 });
  const fmtEur = (v) => eur.format(Math.round(v));
  const WD = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  const pad = (n) => String(n).padStart(2, '0');

  /* ---------------------------------------------------------------------
     1 · Smooth Scroll (Lenis) + ScrollTrigger
     --------------------------------------------------------------------- */
  let lenis = null;
  if (hasGsap) w.gsap.registerPlugin(w.ScrollTrigger);
  if (MOTION && w.Lenis) {
    lenis = new w.Lenis({ lerp: 0.11, smoothWheel: true });
    w.__lenis = lenis;
    if (hasGsap) {
      lenis.on('scroll', w.ScrollTrigger.update);
      w.gsap.ticker.add((t) => lenis.raf(t * 1000));
      w.gsap.ticker.lagSmoothing(0);
    } else {
      const loop = (t) => { lenis.raf(t); raf(loop); };
      raf(loop);
    }
  }

  const headerOffset = () => (parseFloat(getComputedStyle(root).getPropertyValue('--hdr-h')) || 72) + 12;
  function focusTarget(el) {
    if (!el) return;
    if (!el.matches('a, button, input, select, textarea, [tabindex]')) el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
  }
  function scrollToEl(el, cb) {
    if (!el) return;
    if (lenis) {
      lenis.scrollTo(el, { offset: -headerOffset(), duration: 1.2, onComplete: cb });
    } else {
      const y = el.getBoundingClientRect().top + w.scrollY - headerOffset();
      w.scrollTo({ top: y, behavior: MOTION ? 'smooth' : 'auto' });
      if (cb) setTimeout(cb, MOTION ? 650 : 0);
    }
  }

  /* ---------------------------------------------------------------------
     2 · Header: Zustand, Fortschritt, aktive Navigation, Menü
     --------------------------------------------------------------------- */
  const hdr = $('[data-hdr]');
  const prog = $('[data-progress]');
  let ticking = false;
  const scrollFns = [];
  function onScroll() {
    if (ticking) return;
    ticking = true;
    raf(() => {
      ticking = false;
      const y = w.scrollY || root.scrollTop;
      hdr.classList.toggle('is-scrolled', y > 24);
      const max = root.scrollHeight - w.innerHeight;
      prog.style.clipPath = `inset(0 ${(100 - (max > 0 ? clamp(y / max, 0, 1) : 0) * 100).toFixed(2)}% 0 0)`;
      for (const fn of scrollFns) fn(y);
    });
  }
  w.addEventListener('scroll', onScroll, { passive: true });

  // aktive Navigation
  const navLinks = $$('.nav a');
  const navMap = new Map(navLinks.map((a) => [a.getAttribute('href').slice(1), a]));
  if ('IntersectionObserver' in w) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        navLinks.forEach((a) => a.removeAttribute('aria-current'));
        const a = navMap.get(e.target.id);
        if (a) a.setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach((s) => io.observe(s));
  }

  // Menü (mobil)
  const menu = $('[data-menu]');
  const burger = $('[data-burger]');
  const burgerLabel = $('[data-burger-label]');
  let menuOpen = false;
  function openMenu() {
    menuOpen = true;
    menu.hidden = false;
    raf(() => raf(() => menu.classList.add('is-open')));
    burger.setAttribute('aria-expanded', 'true');
    burgerLabel.textContent = 'Menü schließen';
    if (lenis) lenis.stop();
    root.style.overflow = 'hidden';
    const first = $('a', menu);
    if (first) first.focus();
  }
  function closeMenu(returnFocus = true) {
    if (!menuOpen) return;
    menuOpen = false;
    menu.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    burgerLabel.textContent = 'Menü öffnen';
    if (lenis) lenis.start();
    root.style.overflow = '';
    setTimeout(() => { if (!menuOpen) menu.hidden = true; }, 230);
    if (returnFocus) burger.focus();
  }
  burger.addEventListener('click', () => (menuOpen ? closeMenu() : openMenu()));
  d.addEventListener('keydown', (e) => {
    if (!menuOpen) return;
    if (e.key === 'Escape') { e.preventDefault(); closeMenu(); return; }
    if (e.key === 'Tab') {
      const items = [burger, ...$$('a, button', menu)];
      const i = items.indexOf(d.activeElement);
      if (e.shiftKey && (i <= 0)) { e.preventDefault(); items[items.length - 1].focus(); }
      else if (!e.shiftKey && i === items.length - 1) { e.preventDefault(); items[0].focus(); }
      else if (i === -1) { e.preventDefault(); items[0].focus(); }
    }
  });
  w.addEventListener('resize', () => { if (menuOpen && w.innerWidth >= 1180) closeMenu(false); });

  // Ankerlinks mit Header-Versatz
  d.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href').slice(1);
    if (!id) return;
    const target = d.getElementById(id);
    if (!target) return;
    e.preventDefault();
    const wasMenu = menuOpen;
    if (wasMenu) closeMenu(false);
    const go = () => scrollToEl(target, () => focusTarget(target));
    if (wasMenu) setTimeout(go, 60); else go();
    if (history.replaceState) history.replaceState(null, '', '#' + id);
  });

  /* ---------------------------------------------------------------------
     3 · Kurskalender – Termine erzeugen (wird auch vom Hero genutzt)
     --------------------------------------------------------------------- */
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const dayKey = (dt) => `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
  const addDays = (dt, n) => { const x = new Date(dt); x.setDate(x.getDate() + n); return x; };
  function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function nthSaturday(y, m, n) { const first = new Date(y, m, 1); const off = (6 - first.getDay() + 7) % 7; return new Date(y, m, 1 + off + (n - 1) * 7); }

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const rangeEnd = new Date(today.getFullYear(), today.getMonth() + KURS_MONATE, 0);
  const courses = [];
  KURSE.forEach((k) => {
    const blocks = [];
    if (k.regel === 'b14') {
      const ref = new Date(KURS_REFERENZ_MONTAG + 'T00:00:00');
      let diff = Math.floor((addDays(monthStart, -7) - ref) / 864e5);
      let mon = addDays(ref, Math.ceil(diff / 14) * 14);
      while (mon <= rangeEnd) { blocks.push([0, 1, 2, 3, 4].map((i) => addDays(mon, i))); mon = addDays(mon, 14); }
    } else {
      for (let i = 0; i < KURS_MONATE; i++) {
        const y = monthStart.getFullYear(), m = monthStart.getMonth() + i;
        if (k.regel === 'we12') { const s1 = nthSaturday(y, m, 1), s2 = nthSaturday(y, m, 2); blocks.push([s1, addDays(s1, 1), s2, addDays(s2, 1)]); }
        if (k.regel === 'we3') { const s3 = nthSaturday(y, m, 3); blocks.push([s3, addDays(s3, 1)]); }
      }
    }
    blocks.forEach((days) => {
      const start = days[0], end = days[days.length - 1];
      const r = hash(k.id + dayKey(start)) % 100;
      let free = r < 14 ? 0 : r < 46 ? 1 + (r % 5) : 6 + (r % 7);
      free = Math.min(free, k.plaetze);
      courses.push({ ...k, uid: k.id + '-' + dayKey(start), days, start, end, free });
    });
  });
  courses.sort((a, b) => a.start - b.start);
  const upcoming = courses.filter((c) => c.start > today);
  const status = (c) => c.free === 0 ? { s: 'r', t: 'Ausgebucht – Warteliste' } : c.free <= 5 ? { s: 'y', t: c.free === 1 ? 'Noch 1 Platz' : `Noch ${c.free} Plätze` } : { s: 'g', t: `${c.free} Plätze frei` };
  const fmtDay = (dt) => `${WD[dt.getDay()]} ${pad(dt.getDate())}.${pad(dt.getMonth() + 1)}.`;
  function fmtRange(c) {
    if (c.regel === 'b14') return `${fmtDay(c.start)} – ${fmtDay(c.end)}${c.end.getFullYear()}`;
    if (c.regel === 'we12') return `Sa/So ${pad(c.days[0].getDate())}.–${pad(c.days[1].getDate())}.${pad(c.days[1].getMonth() + 1)}. und ${pad(c.days[2].getDate())}.–${pad(c.days[3].getDate())}.${pad(c.days[3].getMonth() + 1)}.`;
    return `Sa/So ${pad(c.days[0].getDate())}.–${fmtDay(c.days[1]).slice(3)}${c.days[1].getFullYear()}`;
  }

  // Hero-Karte: nächster Intensivkurs B
  const nextB = upcoming.find((c) => c.id === 'b' && c.free > 0) || upcoming.find((c) => c.id === 'b');
  if (nextB) {
    const st = status(nextB);
    $('[data-next-date]').textContent = `${fmtDay(nextB.start)} – ${fmtDay(nextB.end)}`;
    const chip = $('[data-next-seats]');
    chip.textContent = '';
    const dot = d.createElement('i'); dot.className = 'sig sig--' + st.s; dot.setAttribute('aria-hidden', 'true');
    chip.append(dot, st.t);
  }

  /* ---------------------------------------------------------------------
     4 · Hero: Ampel Rot → Rot-Gelb → Grün, Headline fährt los
     --------------------------------------------------------------------- */
  const hero = $('.hero');
  const ampel = $('[data-ampel]');
  const ampelStatus = $('[data-ampel-status]');
  const logoLights = $('[data-logo-lights]');
  const heroDashes = $('[data-hero-dashes]');
  const SIGNAL_TEXT = { red: 'Rot – bitte warten', redyellow: 'Rot-Gelb – gleich geht’s los', green: 'Grün – los geht’s' };
  const LOGO_CLASS = { red: 'is-r', redyellow: 'is-ry', green: 'is-g' };
  $$('.hl__in').forEach((el, i) => el.style.setProperty('--i', i));
  // Text, Bild und Aktionen sind sofort da (LCP, CTA im ersten Moment) – nur die Headline wartet an der Haltlinie
  const fadeDelays = { 'hero__eyebrow': 0, 'ampel-status': 60, 'hero__lede': 120, 'hero__visual': 180, 'hero__ctas': 240, 'hero__trust': 320, 'hero__note': 380 };
  $$('[data-hero-fade]').forEach((el) => {
    const key = Object.keys(fadeDelays).find((k) => el.classList.contains(k));
    el.style.setProperty('--d', key ? fadeDelays[key] : 0);
  });
  let timers = [];
  let dashAnim = null;
  function setSignal(s) {
    ampel.dataset.state = s;
    hero.dataset.signal = s;
    ampelStatus.textContent = SIGNAL_TEXT[s];
    logoLights.classList.remove('is-r', 'is-ry', 'is-g');
    logoLights.classList.add(LOGO_CLASS[s]);
  }
  function runSignal(replay) {
    timers.forEach(clearTimeout); timers = [];
    if (replay) {
      // Headline ohne Übergang zurück an die Haltlinie setzen
      $$('.hl__in').forEach((el) => { el.style.transition = 'none'; });
      hero.classList.remove('is-go');
      void hero.offsetWidth;
      $$('.hl__in').forEach((el) => { el.style.transition = ''; });
    }
    setSignal('red');
    const t1 = MOTION ? 450 : 200, t2 = MOTION ? 950 : 400;
    timers.push(setTimeout(() => setSignal('redyellow'), t1));
    timers.push(setTimeout(() => {
      setSignal('green');
      hero.classList.add('is-go');
      if (MOTION && heroDashes.animate) {
        if (dashAnim) dashAnim.cancel();
        dashAnim = heroDashes.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-360px)' }], { duration: 2200, easing: 'cubic-bezier(0.77, 0, 0.175, 1)', fill: 'forwards' });
      }
    }, t2));
  }
  hero.classList.add('is-ready');
  runSignal(false);
  ampel.addEventListener('click', () => runSignal(true));

  /* ---------------------------------------------------------------------
     5 · Fahrbahnlinie: SVG-Pfad durch die Seite, wird beim Scrollen gezeichnet
     --------------------------------------------------------------------- */
  const main = $('#main');
  const laneSvg = $('[data-lane]');
  const lanePath = $('[data-lane-path]');
  const laneGhost = $('[data-lane-ghost]');
  const laneCasing = $('[data-lane-casing]');
  const laneClip = $('[data-lane-clip]');
  const laneCar = $('[data-lane-car]');
  const lane = { ys: [], xs: [], skips: [], y0: 0, y1: 0, H: 0, top: 0, ok: false };
  function relRect(el) {
    const target = el.parentElement && el.parentElement.classList.contains('pin-spacer') ? el.parentElement : el;
    const r = target.getBoundingClientRect();
    const mt = main.getBoundingClientRect().top;
    return { top: r.top - mt, bottom: r.bottom - mt };
  }
  function buildLane() {
    const W = main.clientWidth;
    const H = main.scrollHeight;
    lane.top = main.getBoundingClientRect().top + w.scrollY;
    laneSvg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    laneSvg.setAttribute('width', W);
    laneSvg.setAttribute('height', H);
    laneSvg.style.height = H + 'px';
    const wrapEl = $('.signs .wrap');
    const gutter = wrapEl.getBoundingClientRect().left;
    const xl = Math.round(clamp(gutter * 0.5, 9, 84));
    const xr = W - xl;
    const h = clamp(W * 0.1 + 40, 90, 210);
    const road = relRect($('.hero__road'));
    const end = relRect($('[data-lane-end]'));
    let x = xl;
    let p = `M ${x} ${road.bottom}`;
    // Stützstellen für Position/Winkel des Autos direkt aus der Geometrie
    // (statt getPointAtLength – das kostete auf Mittelklasse-Handys > 400 ms pro Aufbau)
    const px = [x], py = [road.bottom];
    const CURVE_STEPS = 48;
    lane.skips = [];
    $$('[data-lane-x]').forEach((s) => {
      const v = s.dataset.laneX;
      const r = relRect(s);
      if (v === 'skip') {
        if (x !== null) { p += ` L ${x} ${r.top + 1}`; px.push(x); py.push(r.top + 1); }
        lane.skips.push([r.top + 1, r.bottom - 1]);
        x = null;
        return;
      }
      const nx = v === 'r' ? xr : xl;
      if (x === null) { p += ` M ${nx} ${r.top - 1}`; px.push(nx); py.push(r.top - 1); x = nx; return; }
      if (nx !== x) {
        const yb = r.top, y0 = yb - h / 2;
        p += ` L ${x} ${y0} C ${x} ${yb} ${nx} ${yb} ${nx} ${yb + h / 2}`;
        px.push(x); py.push(y0);
        // kubische Bézierkurve (x, y0) → (x, yb) → (nx, yb) → (nx, yb + h/2) abtasten
        for (let i = 1; i <= CURVE_STEPS; i++) {
          const t = i / CURVE_STEPS, u = 1 - t;
          const b0 = u * u * u, b1 = 3 * u * u * t, b2 = 3 * u * t * t, b3 = t * t * t;
          px.push(b0 * x + b1 * x + b2 * nx + b3 * nx);
          py.push(b0 * y0 + (b1 + b2) * yb + b3 * (yb + h / 2));
        }
        x = nx;
      }
    });
    p += ` L ${x} ${end.top}`;
    px.push(x); py.push(end.top);
    lanePath.setAttribute('d', p);
    laneGhost.setAttribute('d', p);
    laneCasing.setAttribute('d', p);
    laneClip.setAttribute('width', W);
    lane.xs = Float32Array.from(px);
    lane.ys = Float32Array.from(py);
    lane.y0 = road.bottom; lane.y1 = end.top; lane.H = H;
    lane.ok = true;
    updateLane();
  }
  function updateLane() {
    if (!lane.ok) return;
    if (!MOTION) { laneClip.setAttribute('height', lane.H); laneCar.classList.remove('is-on'); return; }
    const Y = clamp(w.scrollY - lane.top + w.innerHeight * 0.62, 0, lane.H);
    laneClip.setAttribute('height', Math.max(0, Y));
    const inSkip = lane.skips.some(([a, b]) => Y > a && Y < b);
    if (Y <= lane.y0 + 4 || Y >= lane.y1 - 2 || inSkip) { laneCar.classList.remove('is-on'); return; }
    // binäre Suche nach y
    const ys = lane.ys; let lo = 0, hi = ys.length - 1;
    while (lo < hi - 1) { const mid = (lo + hi) >> 1; if (ys[mid] <= Y) lo = mid; else hi = mid; }
    const t = ys[hi] > ys[lo] ? (Y - ys[lo]) / (ys[hi] - ys[lo]) : 0;
    const x = lane.xs[lo] + (lane.xs[hi] - lane.xs[lo]) * t;
    const a = Math.atan2(ys[hi] - ys[lo], lane.xs[hi] - lane.xs[lo]) * 57.2958;
    laneCar.setAttribute('transform', `translate(${x.toFixed(1)} ${Y.toFixed(1)}) rotate(${a.toFixed(1)})`);
    laneCar.classList.add('is-on');
  }
  scrollFns.push(updateLane);
  let laneT = 0;
  const rebuildLane = () => { clearTimeout(laneT); laneT = setTimeout(buildLane, 120); };

  /* ---------------------------------------------------------------------
     6 · Etappen: horizontale Strecke (Pin + Scrub) ab 900 px
     --------------------------------------------------------------------- */
  const route = $('[data-route]');
  if (hasGsap && MOTION) {
    const mm = w.gsap.matchMedia();
    mm.add('(min-width: 900px)', () => {
      route.classList.add('is-h');
      const track = $('[data-route-track]');
      const vp = $('[data-route-viewport]');
      const dashes = $('[data-route-dashes]');
      const car = $('[data-route-car]');
      const count = $('[data-route-count]');
      const numbered = $$('.stage:not(.stage--photo):not(.stage--goal)', track);
      let D = 0, offs = [];
      const measure = () => {
        D = Math.max(0, track.scrollWidth - vp.clientWidth);
        offs = numbered.map((el) => el.offsetLeft + el.offsetWidth * 0.5);
      };
      measure();
      const tween = w.gsap.to(track, {
        x: () => -D,
        ease: 'none',
        scrollTrigger: {
          trigger: route,
          start: 'top top',
          end: () => '+=' + Math.round(D * 1.05),
          pin: true,
          scrub: 0.6,
          invalidateOnRefresh: true,
          onRefreshInit: measure,
        },
        onUpdate() {
          const p = this.progress();
          const dist = p * D;
          dashes.style.transform = `translateX(${-(dist % 112)}px)`;
          car.style.setProperty('--spin', `${(dist / 9) * 57.3}deg`);
          const ref = dist + vp.clientWidth * 0.45;
          let n = 1;
          offs.forEach((o, i) => { if (o <= ref) n = i + 1; });
          if (count.textContent !== String(n)) count.textContent = String(n);
        },
      });
      return () => {
        route.classList.remove('is-h');
        tween.scrollTrigger && tween.scrollTrigger.kill();
        tween.kill();
        w.gsap.set(track, { clearProps: 'transform' });
        dashes.style.transform = '';
      };
    });
  }

  /* ---------------------------------------------------------------------
     7 · Führerscheinklassen-Explorer (Tabs)
     --------------------------------------------------------------------- */
  const tabs = $$('[data-tabs] [role="tab"]');
  const panels = $$('[data-panel]');
  const tablist = $('[data-tabs]');
  function selectTab(i, focus) {
    tabs.forEach((t, k) => {
      const on = k === i;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      panels[k].hidden = !on;
      panels[k].classList.remove('is-enter');
    });
    tablist.style.setProperty('--ti', i);
    const p = panels[i];
    $$('.xpanel__info > *', p).forEach((el, k) => el.style.setProperty('--k', k));
    void p.offsetWidth;
    p.classList.add('is-enter');
    if (focus) tabs[i].focus();
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => selectTab(i, false));
    t.addEventListener('keydown', (e) => {
      let n = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % tabs.length;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i - 1 + tabs.length) % tabs.length;
      if (e.key === 'Home') n = 0;
      if (e.key === 'End') n = tabs.length - 1;
      if (n !== null) { e.preventDefault(); selectTab(n, true); }
    });
  });
  panels.forEach((p, k) => { p.hidden = k !== 0; });
  // Panel 0 erst animieren, wenn es sichtbar wird
  if ('IntersectionObserver' in w) {
    const pio = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) { const i = tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true'); selectTab(i, false); e.target.classList.add('is-seen'); pio.disconnect(); } });
    }, { threshold: 0.2 });
    pio.observe($('[data-explorer]'));
  }

  /* ---------------------------------------------------------------------
     8 · Kostenrechner
     --------------------------------------------------------------------- */
  const calc = $('[data-calc]');
  const cHours = $('[data-calc-hours]');
  const cHoursOut = $('[data-calc-hours-out]');
  const cHoursHint = $('[data-calc-hours-hint]');
  const cBand = $('[data-calc-band]');
  const cExtra = $('[data-calc-extra]');
  const cExpHint = $('[data-calc-exp-hint]');
  const cLabel = $('[data-calc-label]');
  const cTotal = $('[data-calc-total]');
  const cLive = $('[data-calc-live]');
  const lines = Object.fromEntries($$('[data-calc-lines] li').map((li) => [li.dataset.k, li]));
  const segs = Object.fromEntries($$('[data-calc-bar] i').map((i) => [i.dataset.seg, i]));
  const legendNeben = $('[data-legend-neben]');
  const EXP_LABEL = ['Ersterwerb', 'Ersterwerb mit Vorerfahrung', 'Erweiterung'];
  let shownTotal = 0, totalAnim = 0, liveT = 0, lastCalc = null;

  const getClass = () => calc.querySelector('input[name="klasse"]:checked').value;
  const getExp = () => +calc.querySelector('input[name="erfahrung"]:checked').value;

  function applyPreset() {
    const k = getClass();
    const P = PREISE[k];
    const expInputs = $$('input[name="erfahrung"]', calc);
    expInputs.forEach((inp) => { inp.disabled = !!P.nurErweiterung && inp.value !== '2'; });
    if (P.nurErweiterung) expInputs[2].checked = true;
    cExpHint.hidden = !P.nurErweiterung;
    const e = getExp();
    const typ = P.empf[e];
    cHours.value = typ;
    const lo = clamp(typ - SPANNE, +cHours.min, +cHours.max), hi = clamp(typ + SPANNE, +cHours.min, +cHours.max);
    const span = +cHours.max - +cHours.min;
    cBand.style.setProperty('--b0', `calc(${((lo - cHours.min) / span) * 100}% - ${((lo - cHours.min) / span) * 30 - 15}px)`);
    cBand.style.setProperty('--bw', `calc(${((hi - lo) / span) * 100}% - ${((hi - lo) / span) * 30}px)`);
    cHoursHint.textContent = `Typisch bei uns für diese Auswahl: ${lo}–${hi} Stunden (grüner Bereich).`;
    compute();
  }

  function compute() {
    const k = getClass();
    const e = getExp();
    const P = PREISE[k];
    const n = +cHours.value;
    const v = {
      grund: e === 2 ? P.grundErw : P.grund,
      stunden: n * P.stunde,
      sonder: P.sonderAnz * P.sonder,
      pruef: P.vorTheorie + P.tuevTheorie + P.vorPraxis + P.tuevPraxis,
      neben: cExtra.checked ? P.neben[e === 2 ? 1 : 0] : 0,
    };
    const total = Object.values(v).reduce((a, b) => a + b, 0);
    lastCalc = { k, e, n, total };

    cHoursOut.textContent = n;
    const pct = ((n - cHours.min) / (cHours.max - cHours.min)) * 100;
    cHours.style.setProperty('--p', `calc(${pct}% + ${15 - pct * 0.3}px)`);
    cHours.setAttribute('aria-valuetext', `${n} Fahrstunden`);
    cLabel.textContent = `Klasse ${k} · ${EXP_LABEL[e]}`;

    lines.grund.querySelector('b').textContent = fmtEur(v.grund);
    lines.stunden.querySelector('small').textContent = `${n} × ${fmtEur(P.stunde)}`;
    lines.stunden.querySelector('b').textContent = fmtEur(v.stunden);
    lines.sonder.querySelector('small').textContent = P.sonderAnz ? `${P.sonderAnz} × ${fmtEur(P.sonder)} (Pflicht)` : 'für diese Klasse keine';
    lines.sonder.querySelector('b').textContent = fmtEur(v.sonder);
    lines.pruef.querySelector('small').textContent = P.vorTheorie ? 'Theorie + Praxis, inkl. Prüfgebühren' : 'nur Praxis, inkl. Prüfgebühr';
    lines.pruef.querySelector('b').textContent = fmtEur(v.pruef);
    lines.neben.hidden = !cExtra.checked;
    legendNeben.hidden = !cExtra.checked;
    lines.neben.querySelector('b').textContent = fmtEur(v.neben);

    let x = 0;
    ['grund', 'stunden', 'sonder', 'pruef', 'neben'].forEach((key) => {
      const f = total ? v[key] / total : 0;
      segs[key].style.setProperty('--x', x.toFixed(4));
      segs[key].style.setProperty('--w', f.toFixed(4));
      x += f;
    });

    animateTotal(total);
    clearTimeout(liveT);
    liveT = setTimeout(() => {
      cLive.textContent = `Beispielrechnung Klasse ${k}, ${EXP_LABEL[e]}, ${n} Übungsstunden: rund ${fmtEur(total)}.`;
    }, 600);
  }
  function animateTotal(to) {
    cancelAnimationFrame(totalAnim);
    const from = shownTotal;
    if (!MOTION || !from) { shownTotal = to; cTotal.textContent = fmtEur(to); return; }
    const t0 = performance.now(), dur = 420;
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      shownTotal = from + (to - from) * e;
      cTotal.textContent = fmtEur(shownTotal);
      if (p < 1) totalAnim = raf(step); else shownTotal = to;
    };
    totalAnim = raf(step);
  }
  $$('input[name="klasse"], input[name="erfahrung"]', calc).forEach((inp) => inp.addEventListener('change', applyPreset));
  cHours.addEventListener('input', compute);
  cExtra.addEventListener('change', compute);
  calc.addEventListener('submit', (e) => e.preventDefault());
  applyPreset();

  // Explorer → Rechner
  $$('[data-to-calc]').forEach((btn) => btn.addEventListener('click', () => {
    const inp = calc.querySelector(`input[name="klasse"][value="${btn.dataset.toCalc}"]`);
    if (inp) { inp.checked = true; applyPreset(); }
    const sec = $('#kosten');
    scrollToEl(sec, () => { if (inp) inp.focus({ preventScroll: true }); });
  }));

  /* ---------------------------------------------------------------------
     9 · Theorie-Quiz
     --------------------------------------------------------------------- */
  const quiz = $('[data-quiz]');
  const qItems = $$('.q', quiz);
  const qPos = $('[data-qz-pos]');
  const qFp = $('[data-qz-fp]');
  const qLights = $$('[data-qz-lights] li');
  const qFeedback = $('[data-qz-feedback]');
  const qVerdict = $('[data-qz-verdict]');
  const qExp = $('[data-qz-exptext]');
  const qNext = $('[data-qz-next]');
  const qLive = $('[data-qz-live]');
  const qResult = $('[data-qz-result]');
  const qList = $('[data-qz-list]');
  let qIdx = 0;
  let qAnswers = [];
  quiz.classList.add('is-live');

  function qShow(i, swap) {
    qIdx = i;
    qItems.forEach((q, k) => { q.classList.toggle('is-current', k === i); q.classList.remove('is-swap'); });
    if (swap) { void qItems[i].offsetWidth; qItems[i].classList.add('is-swap'); }
    qPos.textContent = i + 1;
    qLights.forEach((l, k) => l.classList.toggle('is-now', k === i));
    qFeedback.hidden = true;
  }
  function qFehlerpunkte() { return qAnswers.reduce((s, a) => s + (a && !a.ok ? a.points : 0), 0); }
  qItems.forEach((q, qi) => {
    const btns = $$('.ans', q);
    btns.forEach((b) => b.addEventListener('click', () => {
      if (qAnswers[qi]) return;
      const ok = b.hasAttribute('data-correct');
      const points = +q.dataset.points;
      qAnswers[qi] = { ok, points };
      btns.forEach((x) => {
        x.disabled = true;
        if (x.hasAttribute('data-correct')) x.classList.add('is-right');
        else if (x === b) x.classList.add('is-wrong');
        else x.classList.add('is-dim');
      });
      qLights[qi].classList.add(ok ? 'is-ok' : 'is-bad');
      qFp.textContent = qFehlerpunkte();
      const correctText = $('[data-correct] span:last-child', q).textContent;
      qVerdict.textContent = ok ? 'Richtig – grüne Welle.' : `Leider falsch: +${points} Fehlerpunkte`;
      qFeedback.classList.toggle('is-bad', !ok);
      qExp.textContent = $('.q__exp p', q).textContent;
      qNext.firstChild.textContent = qi === qItems.length - 1 ? 'Auswertung anzeigen' : 'Nächste Frage';
      qFeedback.hidden = false;
      qLive.textContent = ok ? 'Richtig.' : `Falsch. Richtig ist: ${correctText}.`;
      qNext.focus({ preventScroll: true });
      // Feedback sichtbar machen, falls es unter dem Viewport liegt
      const r = qFeedback.getBoundingClientRect();
      if (r.bottom > w.innerHeight - 20) {
        const delta = r.bottom - w.innerHeight + 90 + (parseFloat(getComputedStyle(root).getPropertyValue('--mbar-h')) || 0);
        if (lenis) lenis.scrollTo(w.scrollY + delta, { duration: 0.6 }); else w.scrollBy({ top: delta, behavior: MOTION ? 'smooth' : 'auto' });
      }
    }));
  });
  function qEnsureTop() {
    const r = quiz.getBoundingClientRect();
    if (r.top < headerOffset() - 4 || r.top > w.innerHeight * 0.6) scrollToEl(quiz);
  }
  qNext.addEventListener('click', () => {
    if (qIdx < qItems.length - 1) {
      qShow(qIdx + 1, true);
      qEnsureTop();
      const first = $('.ans', qItems[qIdx]);
      if (first) first.focus({ preventScroll: true });
    } else {
      qShowResult();
    }
  });
  function qShowResult() {
    const fp = qFehlerpunkte();
    const right = qAnswers.filter((a) => a.ok).length;
    const wrong5 = qAnswers.filter((a) => !a.ok && a.points === 5).length;
    const pass = fp <= 10 && wrong5 < 2;
    qList.hidden = true;
    qFeedback.hidden = true;
    qLights.forEach((l) => l.classList.remove('is-now'));
    qResult.hidden = false;
    qResult.dataset.pass = pass ? '1' : '0';
    $('[data-qz-rtag]', qResult).textContent = `${right} von ${qItems.length} richtig · ${fp} Fehlerpunkte`;
    $('[data-qz-rtitle]', qResult).textContent = pass ? 'Bestanden – grünes Licht.' : 'Diesmal noch Rot.';
    let txt;
    if (pass && fp === 0) txt = 'Fehlerfrei. In der echten Prüfung warten 30 Fragen – im Intensivkurs trainieren wir genau dieses Tempo.';
    else if (pass) txt = 'Unter 10 Fehlerpunkten – damit wären Sie durch. Die Erklärungen zu Ihren Fehlern sehen Sie unten.';
    else if (wrong5 >= 2) txt = 'Zwei falsche 5-Punkte-Fragen bedeuten in der echten Prüfung „nicht bestanden“ – egal wie gut der Rest war. Vorfahrt üben wir im Kurs besonders oft.';
    else txt = 'Mehr als 10 Fehlerpunkte. Kein Grund zur Sorge: Genau dafür gibt es den Theorieunterricht.';
    $('[data-qz-rtext]', qResult).textContent = txt;
    const rv = $('[data-qz-review]', qResult);
    rv.textContent = '';
    qItems.forEach((q, i) => {
      const a = qAnswers[i];
      const li = d.createElement('li');
      if (!a.ok) li.classList.add('is-bad');
      const dot = d.createElement('i'); dot.setAttribute('aria-hidden', 'true');
      const t = d.createElement('span'); t.textContent = `${i + 1}. ${$('.q__text', q).textContent}`;
      const s = d.createElement('small'); s.textContent = a.ok ? 'richtig' : `+${a.points} FP`;
      li.append(dot, t, s);
      rv.append(li);
    });
    qLive.textContent = `Ergebnis: ${pass ? 'bestanden' : 'nicht bestanden'}, ${right} von ${qItems.length} richtig, ${fp} Fehlerpunkte.`;
    qResult.focus({ preventScroll: true });
    qEnsureTop();
  }
  $('[data-qz-restart]').addEventListener('click', () => {
    qAnswers = [];
    qItems.forEach((q) => $$('.ans', q).forEach((b) => { b.disabled = false; b.classList.remove('is-right', 'is-wrong', 'is-dim'); }));
    qLights.forEach((l) => l.classList.remove('is-ok', 'is-bad'));
    qFp.textContent = '0';
    qResult.hidden = true;
    qList.hidden = false;
    qShow(0, true);
    qEnsureTop();
    $('.ans', qItems[0]).focus({ preventScroll: true });
  });
  qShow(0, false);

  /* ---------------------------------------------------------------------
     10 · Kurskalender (Darstellung) + Dialog
     --------------------------------------------------------------------- */
  const kalGrid = $('[data-kal-grid]');
  const kalList = $('[data-kal-list]');
  const kalMonth = $('[data-kal-month]');
  const kalPrev = $('[data-kal-prev]');
  const kalNext = $('[data-kal-next]');
  let kalOffset = 0;
  let kalSel = null;
  const dayMap = new Map();
  courses.forEach((c) => c.days.forEach((dt, i) => dayMap.set(dayKey(dt), { c, i })));
  // Ab dem Monat mit dem nächsten Termin starten, falls der laufende Monat keine mehr hat
  if (upcoming.length && upcoming[0].start.getMonth() !== today.getMonth()) kalOffset = 0;

  function renderKal(dir) {
    const y = monthStart.getFullYear(), m = monthStart.getMonth() + kalOffset;
    const first = new Date(y, m, 1);
    const last = new Date(y, m + 1, 0);
    kalMonth.textContent = `${MONATE[first.getMonth()]} ${first.getFullYear()}`;
    kalPrev.disabled = kalOffset <= 0;
    kalNext.disabled = kalOffset >= KURS_MONATE - 1;
    kalGrid.textContent = '';
    ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].forEach((t) => { const h = d.createElement('div'); h.className = 'kal__dow'; h.textContent = t; kalGrid.append(h); });
    const lead = (first.getDay() + 6) % 7;
    for (let i = 0; i < lead; i++) { const c = d.createElement('div'); c.className = 'kal__cell is-out'; kalGrid.append(c); }
    for (let day = 1; day <= last.getDate(); day++) {
      const dt = new Date(first.getFullYear(), first.getMonth(), day);
      const cell = d.createElement('div');
      cell.className = 'kal__cell';
      cell.textContent = day;
      if (dt < today) cell.classList.add('is-past');
      if (+dt === +today) cell.classList.add('is-today');
      if (THEORIE_WOCHENTAGE.includes(dt.getDay())) cell.classList.add('is-theory');
      const hit = dayMap.get(dayKey(dt));
      if (hit) {
        const { c, i } = hit;
        const st = status(c);
        const bar = d.createElement('button');
        bar.type = 'button';
        bar.tabIndex = -1;
        bar.className = `kal__bar s-${st.s}`;
        const prevIn = i > 0 && +addDays(c.days[i - 1], 1) === +dt;
        const nextIn = i < c.days.length - 1 && +addDays(c.days[i + 1], -1) === +dt;
        const dow = (dt.getDay() + 6) % 7;
        if (!prevIn || dow === 0) bar.classList.add('is-first');
        if (!nextIn || dow === 6) bar.classList.add('is-last');
        if (c.end < today) bar.classList.add('is-past');
        if (kalSel === c.uid) bar.classList.add('is-sel');
        bar.dataset.uid = c.uid;
        if (!prevIn || dow === 0) { const tag = d.createElement('span'); tag.className = 'kal__bartag'; tag.textContent = c.kurz; cell.append(tag); }
        cell.append(bar);
      }
      kalGrid.append(cell);
    }
    const tail = (7 - ((lead + last.getDate()) % 7)) % 7;
    for (let i = 0; i < tail; i++) { const c = d.createElement('div'); c.className = 'kal__cell is-out'; kalGrid.append(c); }

    // Liste
    kalList.textContent = '';
    const list = upcoming.filter((c) => c.start.getMonth() === first.getMonth() && c.start.getFullYear() === first.getFullYear());
    if (!list.length) {
      const p = d.createElement('p'); p.className = 'kal__empty';
      p.textContent = 'In diesem Monat beginnen keine weiteren Kurse mehr. Schauen Sie in den nächsten Monat – oder kommen Sie montags und mittwochs um 18:30 Uhr zur regulären Theorie.';
      kalList.append(p);
    }
    list.forEach((c) => kalList.append(courseCard(c)));
    if (dir) {
      [kalGrid, kalList].forEach((n) => {
        n.classList.remove('kal-in-next', 'kal-in-prev');
        void n.offsetWidth;
        n.classList.add(dir > 0 ? 'kal-in-next' : 'kal-in-prev');
      });
    }
  }
  function el(tag, cls, text) { const e = d.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function icon(id) { const s = d.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('aria-hidden', 'true'); const u = d.createElementNS('http://www.w3.org/2000/svg', 'use'); u.setAttribute('href', '#' + id); s.append(u); return s; }
  function courseCard(c) {
    const st = status(c);
    const art = el('article', 'course' + (kalSel === c.uid ? ' is-sel' : ''));
    art.dataset.uid = c.uid;
    const top = el('div', 'course__top');
    top.append(el('span', 'course__type', c.typ));
    const s = el('span', 'course__status'); const dot = el('i', 'sig sig--' + st.s); dot.setAttribute('aria-hidden', 'true'); s.append(dot, st.t);
    top.append(s);
    const h = el('h4', null, c.name);
    const when = el('p', 'course__when');
    const s1 = el('span'); s1.append(icon('i-cal'), fmtRange(c));
    const s2 = el('span'); s2.append(icon('i-clock'), c.zeit);
    when.append(s1, s2);
    const seats = el('div', 'seats'); seats.setAttribute('role', 'img'); seats.setAttribute('aria-label', `${c.free} von ${c.plaetze} Plätzen frei`);
    for (let i = 0; i < c.plaetze; i++) seats.append(el('i', i >= c.plaetze - c.free ? 'is-free' : ''));
    const foot = el('div', 'course__foot');
    foot.append(el('small', null, c.inhalt));
    const b = el('button', 'btn btn--sm ' + (c.free ? 'btn--dark' : 'btn--ghost'), c.free ? 'Platz anfragen' : 'Auf die Warteliste');
    b.type = 'button';
    b.addEventListener('click', () => openDlg(c, b));
    foot.append(b);
    art.append(top, h, when, seats, foot);
    return art;
  }
  kalPrev.addEventListener('click', () => { if (kalOffset > 0) { kalOffset--; renderKal(-1); } });
  kalNext.addEventListener('click', () => { if (kalOffset < KURS_MONATE - 1) { kalOffset++; renderKal(1); } });
  kalGrid.addEventListener('click', (e) => {
    const bar = e.target.closest('.kal__bar');
    if (!bar) return;
    kalSel = bar.dataset.uid;
    $$('.kal__bar', kalGrid).forEach((b) => b.classList.toggle('is-sel', b.dataset.uid === kalSel));
    let card = $$('.course', kalList).find((c) => c.dataset.uid === kalSel);
    $$('.course', kalList).forEach((c) => c.classList.toggle('is-sel', c === card));
    if (card) {
      const r = card.getBoundingClientRect();
      if (r.top < headerOffset() || r.bottom > w.innerHeight) scrollToEl(card);
    }
  });
  renderKal();

  // Dialog „Platz anfragen“
  const dlg = $('[data-dlg]');
  const dlgForm = $('[data-dlg-form]');
  const dlgOk = $('[data-dlg-ok]');
  let dlgTrigger = null, dlgCourse = null;
  function openDlg(c, trigger) {
    dlgCourse = c; dlgTrigger = trigger;
    $('[data-dlg-title]').textContent = c.free ? c.name : `${c.name} – Warteliste`;
    $('[data-dlg-meta]').textContent = `${fmtRange(c)} · ${c.zeit} · ${status(c).t}`;
    dlgForm.reset(); clearErrors(dlgForm);
    dlgForm.hidden = false; dlgOk.hidden = true;
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    if (lenis) lenis.stop();
    const f = $('#d-name'); if (f) f.focus();
  }
  function closeDlg() { if (dlg.open) dlg.close(); }
  dlg.addEventListener('close', () => { if (lenis) lenis.start(); if (dlgTrigger) dlgTrigger.focus({ preventScroll: true }); });
  $$('[data-dlg-close]', dlg).forEach((b) => b.addEventListener('click', closeDlg));
  dlg.addEventListener('click', (e) => { if (e.target === dlg) closeDlg(); });
  dlgForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#d-name'), kontakt = $('#d-kontakt');
    clearErrors(dlgForm);
    const errs = [];
    if (name.value.trim().length < 2) errs.push([name, 'Bitte geben Sie Ihren Namen an.']);
    const kv = kontakt.value.trim();
    if (!(EMAIL_RE.test(kv) || PHONE_RE.test(kv))) errs.push([kontakt, 'Bitte eine gültige Telefonnummer oder E-Mail-Adresse angeben.']);
    if (errs.length) { errs.forEach(([f, m]) => setError(f, m)); errs[0][0].focus(); return; }
    const sum = $('[data-dlg-summary]');
    sum.textContent = '';
    addSummary(sum, 'Kurs', dlgCourse.name);
    addSummary(sum, 'Termin', fmtRange(dlgCourse));
    addSummary(sum, 'Name', name.value.trim());
    addSummary(sum, 'Kontakt', kv);
    dlgForm.hidden = true; dlgOk.hidden = false;
    dlgOk.focus();
  });

  /* ---------------------------------------------------------------------
     11 · Anmeldeformular
     --------------------------------------------------------------------- */
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const PHONE_RE = /^[+(]?[0-9][0-9 ()/\-]{5,}$/;
  function setError(field, msg) {
    field.setAttribute('aria-invalid', 'true');
    const id = (field.getAttribute('aria-describedby') || '').split(' ').find((x) => x.endsWith('-err'));
    const errEl = id ? d.getElementById(id) : null;
    if (errEl) errEl.textContent = msg;
    const chk = field.closest('.check'); if (chk) chk.classList.add('is-invalid');
  }
  function clearError(field) {
    field.removeAttribute('aria-invalid');
    const id = (field.getAttribute('aria-describedby') || '').split(' ').find((x) => x.endsWith('-err'));
    const errEl = id ? d.getElementById(id) : null;
    if (errEl) errEl.textContent = '';
    const chk = field.closest('.check'); if (chk) chk.classList.remove('is-invalid');
  }
  function clearErrors(form) { $$('[aria-invalid]', form).forEach(clearError); }
  function addSummary(dl, k, v) {
    const row = d.createElement('div');
    const dt = d.createElement('dt'); dt.textContent = k;
    const dd = d.createElement('dd'); dd.textContent = v;
    row.append(dt, dd); dl.append(row);
  }

  const form = $('[data-form]');
  const formOk = $('[data-form-ok]');
  const fName = $('#f-name'), fMail = $('#f-mail'), fTel = $('#f-tel'), fKl = $('#f-klasse'), fBirth = $('#f-birth'), fMsg = $('#f-msg');
  const fDs = form.querySelector('input[name="dsgvo"]');
  const ageHint = $('[data-age-hint]');
  const rules = [
    [fName, () => fName.value.trim().length >= 2 || 'Bitte geben Sie Ihren Vor- und Nachnamen an.'],
    [fMail, () => EMAIL_RE.test(fMail.value.trim()) || 'Bitte geben Sie eine gültige E-Mail-Adresse an.'],
    [fTel, () => PHONE_RE.test(fTel.value.trim()) || 'Bitte geben Sie eine Telefonnummer an (mind. 6 Ziffern).'],
    [fKl, () => !!fKl.value || 'Bitte wählen Sie eine Klasse.'],
    [fDs, () => fDs.checked || 'Bitte bestätigen Sie die Einwilligung.'],
  ];
  function check(field) {
    const r = rules.find(([f]) => f === field);
    if (!r) return true;
    const res = r[1]();
    if (res === true) { clearError(field); return true; }
    setError(field, res); return false;
  }
  rules.forEach(([f]) => {
    f.addEventListener('blur', () => { if (f.dataset.touched) check(f); });
    f.addEventListener('input', () => { f.dataset.touched = '1'; if (f.getAttribute('aria-invalid')) check(f); });
    f.addEventListener('change', () => { f.dataset.touched = '1'; if (f.getAttribute('aria-invalid')) check(f); });
  });
  function ageCheck() {
    ageHint.textContent = ''; ageHint.classList.remove('is-warn');
    if (!fBirth.value) return;
    const b = new Date(fBirth.value + 'T00:00:00');
    if (isNaN(b) || b > today || today.getFullYear() - b.getFullYear() > 100) { ageHint.textContent = 'Bitte prüfen Sie das Datum.'; ageHint.classList.add('is-warn'); return; }
    let age = today.getFullYear() - b.getFullYear();
    if (today < new Date(today.getFullYear(), b.getMonth(), b.getDate())) age--;
    if (!fKl.value) { ageHint.textContent = `Sie sind ${age} Jahre alt – wählen Sie eine Klasse für den Altershinweis.`; return; }
    const min = MINDESTALTER[fKl.value];
    const label = fKl.options[fKl.selectedIndex].text.split(' – ')[0];
    if (age >= min) { ageHint.textContent = `Mindestalter für ${label} (${min} Jahre) erfüllt.`; return; }
    const minDate = new Date(b.getFullYear() + min, b.getMonth(), b.getDate());
    const months = Math.ceil((minDate - today) / (864e5 * 30.44));
    ageHint.classList.add('is-warn');
    ageHint.textContent = months <= 6
      ? `Passt: Sie können jetzt starten – die Prüfungen sind kurz vor Ihrem ${min}. Geburtstag möglich.`
      : `Für ${label} gilt ein Mindestalter von ${min} Jahren (bei Ihnen in ca. ${months} Monaten). Wir beraten Sie gern zum passenden Start.`;
  }
  fBirth.addEventListener('change', ageCheck);
  fKl.addEventListener('change', ageCheck);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let firstBad = null;
    rules.forEach(([f]) => { f.dataset.touched = '1'; if (!check(f) && !firstBad) firstBad = f; });
    if (firstBad) { firstBad.focus(); return; }
    const sum = $('[data-form-summary]');
    sum.textContent = '';
    addSummary(sum, 'Name', fName.value.trim());
    addSummary(sum, 'E-Mail', fMail.value.trim());
    addSummary(sum, 'Telefon', fTel.value.trim());
    addSummary(sum, 'Klasse', fKl.options[fKl.selectedIndex].text);
    addSummary(sum, 'Theorie', form.querySelector('input[name="theorie"]:checked').value.replace('&amp;', '&'));
    if (fBirth.value) { const b = new Date(fBirth.value + 'T00:00:00'); addSummary(sum, 'Geburtsdatum', `${pad(b.getDate())}.${pad(b.getMonth() + 1)}.${b.getFullYear()}`); }
    if (fMsg.value.trim()) addSummary(sum, 'Nachricht', fMsg.value.trim());
    form.hidden = true;
    formOk.hidden = false;
    formOk.focus({ preventScroll: true });
    const r = formOk.getBoundingClientRect();
    if (r.top < headerOffset() || r.top > w.innerHeight * 0.7) scrollToEl(formOk);
  });
  $('[data-form-reset]').addEventListener('click', () => {
    form.reset(); clearErrors(form); ageHint.textContent = '';
    rules.forEach(([f]) => delete f.dataset.touched);
    formOk.hidden = true; form.hidden = false;
    fName.focus();
  });

  // Rechner → Formular
  $('[data-calc-take]').addEventListener('click', () => {
    if (!lastCalc) return;
    fKl.value = lastCalc.k;
    fMsg.value = `Beispielrechnung: Klasse ${lastCalc.k}, ${EXP_LABEL[lastCalc.e]}, ${lastCalc.n} Übungsstunden – ca. ${fmtEur(lastCalc.total)}.`;
    ageCheck();
    const sec = $('#kontakt');
    scrollToEl(sec, () => fName.focus({ preventScroll: true }));
  });

  /* ---------------------------------------------------------------------
     12 · Reveal beim Scrollen
     --------------------------------------------------------------------- */
  const revealEls = $$('[data-reveal]');
  if (MOTION && 'IntersectionObserver' in w) {
    const groups = new Map();
    revealEls.forEach((el) => {
      const p = el.parentElement.closest('ul, ol, .sec__head, .team__intro, .where__grid, .faq__head') || el.parentElement;
      const list = groups.get(p) || [];
      list.push(el); groups.set(p, list);
      el.style.setProperty('--rd', Math.min(list.length - 1, 5) * 70);
    });
    const rio = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); rio.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    revealEls.forEach((el) => rio.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------------------------------------------------------------------
     13 · Layout-Änderungen → Fahrbahnlinie neu berechnen
     --------------------------------------------------------------------- */
  if (hasGsap) w.ScrollTrigger.addEventListener('refresh', rebuildLane);
  if ('ResizeObserver' in w) {
    let lastH = 0, lastW = 0;
    new ResizeObserver(() => {
      const H = main.scrollHeight, W = main.clientWidth;
      if (H !== lastH || W !== lastW) { lastH = H; lastW = W; rebuildLane(); }
    }).observe(main);
  } else {
    w.addEventListener('resize', rebuildLane);
  }
  if (!('IntersectionObserver' in w)) $('[data-explorer]').classList.add('is-seen');
  // ScrollTrigger refresht nach „load“ selbst (und löst damit rebuildLane aus) – kein zweiter Refresh nötig
  if (!hasGsap) w.addEventListener('load', rebuildLane);
  if (d.fonts && d.fonts.ready && d.fonts.status !== 'loaded') d.fonts.ready.then(() => { if (hasGsap) w.ScrollTrigger.refresh(); else rebuildLane(); });
  // Fahrbahnlinie erst nach dem ersten Bild aufbauen – sie beginnt unterhalb des Hero,
  // so blockiert das Vermessen der Seite nicht die Ampel-Choreografie.
  if ('requestIdleCallback' in w) w.requestIdleCallback(buildLane, { timeout: 700 });
  else setTimeout(buildLane, 200);
  onScroll();

  w.__gwReady = true;
})();
