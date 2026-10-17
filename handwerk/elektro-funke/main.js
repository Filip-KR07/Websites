/* =========================================================================
   Funke Elektrotechnik – Modell „Impuls“ · main.js
   Gestaltungsidee „Stromlaufplan“: Hero-Schaltplan, durch den beim Scrollen
   Strom fließt; Hauptschalter setzt die ganze Seite unter Spannung;
   Set Pieces: Sonnenbahn (PV), Wippschalter-Panel, Oszilloskop, Schützkette.
   Ohne Build-Schritt. GSAP/ScrollTrigger/Lenis liegen lokal unter assets/vendor.
   ========================================================================= */
(() => {
  'use strict';

  const d = document;
  const w = window;
  const root = d.documentElement;
  const MOTION = root.classList.contains('motion-ok');
  const FINE = w.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const DESK = () => w.matchMedia('(min-width: 900px)').matches;
  const $ = (s, c = d) => c.querySelector(s);
  const $$ = (s, c = d) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const nf0 = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 });
  const nf1 = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const fmt = (v, dec = 0) => (dec ? nf1 : nf0).format(v);
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const hasGsap = !!(w.gsap && w.ScrollTrigger);
  const raf = w.requestAnimationFrame.bind(w);
  let wizard = { preselect() {}, fromPV() {} };

  // Start in Etappen: alles unterhalb des ersten Bildschirms in kleinen Häppchen
  const queue = [];
  const later = (fn) => queue.push(fn);

  /* ---------------------------------------------------------------------
     1 · Smooth Scroll (Lenis) + ScrollTrigger
     --------------------------------------------------------------------- */
  let lenis = null;
  if (hasGsap) w.gsap.registerPlugin(w.ScrollTrigger);
  if (MOTION && w.Lenis) {
    lenis = new w.Lenis({ lerp: 0.11, smoothWheel: true, wheelMultiplier: 1 });
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
  const refreshST = (() => {
    let t = 0;
    return () => { if (!hasGsap) return; clearTimeout(t); t = setTimeout(() => w.ScrollTrigger.refresh(), 120); };
  })();

  const headerOffset = () => (parseFloat(getComputedStyle(root).getPropertyValue('--hdr-h')) || 72) + 12;

  function focusTarget(el) {
    if (!el) return;
    if (!el.matches('a, button, input, select, textarea, [tabindex]')) el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
  }
  function scrollToEl(el, cb) {
    if (!el) return;
    if (lenis) {
      lenis.scrollTo(el, { offset: -headerOffset(), duration: 1.25, onComplete: cb });
    } else {
      el.scrollIntoView({ behavior: MOTION ? 'smooth' : 'auto', block: 'start' });
      if (cb) setTimeout(cb, MOTION ? 600 : 0);
    }
  }


  /* ---------------------------------------------------------------------
     2 · Header, Fortschritt, Abend-Kapitel, Kabel-Tempo
     --------------------------------------------------------------------- */
  const hdr = $('[data-hdr]');
  const prog = $('[data-progress]');
  const dusk = $('.dusk');
  const chapters = $$('[data-dusk]');
  let scrollTick = false;
  let lastY = w.scrollY;
  let vel = 0;
  function updDusk() {
    if (!MOTION || !dusk) return;
    const vh = w.innerHeight;
    let o = 0;
    chapters.forEach((c) => {
      const r = c.getBoundingClientRect();
      const fin = clamp((vh * 0.95 - r.top) / (vh * 0.42), 0, 1);
      const fout = clamp((r.bottom - vh * 0.05) / (vh * 0.42), 0, 1);
      o = Math.max(o, Math.min(fin, fout));
    });
    dusk.style.opacity = o.toFixed(3);
    root.classList.toggle('in-dusk', o > 0.5 && root.dataset.power !== 'on');
  }
  function onScroll() {
    if (scrollTick) return;
    scrollTick = true;
    raf(() => {
      scrollTick = false;
      const y = w.scrollY || root.scrollTop;
      vel = lenis ? lenis.velocity : (y - lastY);
      lastY = y;
      const max = root.scrollHeight - w.innerHeight;
      prog.style.transform = `scaleX(${max > 0 ? clamp(y / max, 0, 1) : 0})`;
      updDusk();
      cableKick(vel);
    });
  }
  w.addEventListener('scroll', onScroll, { passive: true });
  w.addEventListener('resize', updDusk, { passive: true });

  // Kabel: Druck läuft konstant, Scroll-Tempo schiebt (auch rückwärts), federt zurück
  const cableTrack = $('[data-cable]');
  let cableAnim = null, cableRate = 1, cableId = 0;
  function cableKick(v) {
    if (!MOTION || !cableTrack || !cableTrack.getAnimations) return;
    if (!cableAnim) cableAnim = cableTrack.getAnimations()[0] || null;
    if (!cableAnim) return;
    cableRate = clamp(1 + v * 0.35, -7, 9);
    cableAnim.playbackRate = cableRate;
    if (!cableId) cableId = raf(cableDecay);
  }
  function cableDecay() {
    cableRate += (1 - cableRate) * 0.06;
    if (Math.abs(cableRate - 1) < 0.02) { cableRate = 1; cableId = 0; } else cableId = raf(cableDecay);
    if (cableAnim) cableAnim.playbackRate = cableRate;
  }
  onScroll();

  const navLinks = $$('.nav a[href^="#"]');
  if ('IntersectionObserver' in w && navLinks.length) {
    const map = new Map(navLinks.map((a) => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        navLinks.forEach((a) => a.removeAttribute('aria-current'));
        const a = map.get(e.target.id);
        if (a) a.setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach((s) => io.observe(s));
  }

  /* ---------------------------------------------------------------------
     3 · Mobiles Menü (Dialog mit Fokusführung + Escape)
     --------------------------------------------------------------------- */
  const menu = $('#menu');
  const menuBtn = $('[data-menu-open]');
  let menuCloseTimer = 0;
  if (menu && menuBtn && typeof menu.showModal === 'function') {
    menu.setAttribute('data-lenis-prevent', '');
    const openMenu = () => {
      clearTimeout(menuCloseTimer);
      if (!menu.open) menu.showModal();
      menuBtn.setAttribute('aria-expanded', 'true');
      raf(() => raf(() => menu.classList.add('is-open')));
      if (lenis) lenis.stop();
    };
    const closeMenu = (after) => {
      menu.classList.remove('is-open');
      menuBtn.setAttribute('aria-expanded', 'false');
      const done = () => { if (menu.open) menu.close(); if (lenis) lenis.start(); if (after) after(); };
      if (MOTION) menuCloseTimer = setTimeout(done, 360); else done();
    };
    menuBtn.addEventListener('click', openMenu);
    $('[data-menu-close]', menu).addEventListener('click', () => closeMenu());
    menu.addEventListener('cancel', (e) => { e.preventDefault(); closeMenu(); });
    menu.addEventListener('click', (e) => { if (e.target === menu) closeMenu(); });
    $$('a[href^="#"]', menu).forEach((a) => a.addEventListener('click', (e) => {
      const t = $(a.getAttribute('href'));
      if (!t) return;
      e.preventDefault();
      closeMenu(() => scrollToEl(t, () => focusTarget(t)));
    }));
  } else if (menuBtn) {
    menuBtn.addEventListener('click', () => { location.hash = '#leistungen'; });
  }

  /* ---------------------------------------------------------------------
     4 · Anker-Links (mit Lenis + Header-Versatz)
     --------------------------------------------------------------------- */
  d.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.closest('#menu')) return;
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    const t = $(id);
    if (!t) return;
    e.preventDefault();
    if (a.dataset.topic) wizard.preselect(a.dataset.topic);
    if (id === '#top') {
      if (lenis) lenis.scrollTo(0, { duration: 1.25 }); else w.scrollTo({ top: 0, behavior: MOTION ? 'smooth' : 'auto' });
      focusTarget($('#hero-title'));
      return;
    }
    const focusEl = id === '#anfrage' ? $('#anfrage-title') : t;
    scrollToEl(t, () => focusTarget(focusEl));
    if (history.replaceState) history.replaceState(null, '', id);
  });


  /* ---------------------------------------------------------------------
     5 · Reveal-Choreografie
     --------------------------------------------------------------------- */
  const revealEls = $$('[data-reveal]');
  revealEls.forEach((el) => {
    const sibs = Array.from(el.parentElement.children).filter((c) => c.hasAttribute('data-reveal'));
    el.style.setProperty('--i', Math.min(sibs.indexOf(el), 8));
  });
  // Reveal per Positionsprüfung (clip-path verdeckt das Element – IntersectionObserver sähe 0 px)
  let pendingReveal = MOTION ? revealEls.slice() : [];
  if (!MOTION) revealEls.forEach((el) => el.classList.add('is-in'));
  function checkReveal() {
    if (!pendingReveal.length) return;
    const vh = w.innerHeight;
    pendingReveal = pendingReveal.filter((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < vh * 0.9 && r.bottom > 0) { el.classList.add('is-in'); return false; }
      return true;
    });
  }
  w.addEventListener('scroll', () => raf(checkReveal), { passive: true });
  setTimeout(checkReveal, 60);

  /* ---------------------------------------------------------------------
     6 · Uhrzeit Europe/Berlin: Bürostatus + Uhren
     --------------------------------------------------------------------- */
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const berlinFmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', year: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  function berlin() {
    const p = {};
    berlinFmt.formatToParts(new Date()).forEach((x) => { p[x.type] = x.value; });
    return { day: DAYS.indexOf(p.weekday), h: +p.hour, m: +p.minute, year: +p.year };
  }
  const OPEN_MIN = 7 * 60;
  const CLOSE_MIN = 17 * 60;
  function updateTime() {
    const t = berlin();
    const mins = t.h * 60 + t.m;
    const weekday = t.day >= 1 && t.day <= 5;
    const open = weekday && mins >= OPEN_MIN && mins < CLOSE_MIN;
    let txt;
    if (open) txt = 'Büro geöffnet · bis 17:00';
    else if (weekday && mins < OPEN_MIN) txt = 'Büro geschlossen · öffnet 7:00';
    else if (t.day >= 1 && t.day <= 4) txt = 'Büro geschlossen · öffnet morgen 7:00';
    else txt = 'Büro geschlossen · öffnet Mo 7:00';
    const pill = $('[data-office]');
    if (pill) {
      pill.classList.toggle('is-open', open);
      $('[data-office-text]', pill).textContent = txt;
    }
    const hh = String(t.h).padStart(2, '0');
    const mm = String(t.m).padStart(2, '0');
    $$('[data-clock]').forEach((el) => { el.textContent = `${hh}:${mm}`; });
    return t;
  }
  const nowBerlin = updateTime();
  setInterval(updateTime, 30000);


  /* ---------------------------------------------------------------------
     7 · Hauptschalter „Strom“: ganze Seite unter Spannung (View Transition)
     --------------------------------------------------------------------- */
  const powerBtns = $$('[data-power-btn]');
  const themeMeta = $('meta[name="theme-color"]');
  const powerHooks = [];
  function applyPower(on) {
    root.dataset.power = on ? 'on' : 'off';
    powerBtns.forEach((b) => b.setAttribute('aria-pressed', String(on)));
    if (themeMeta) themeMeta.setAttribute('content', on ? '#0E1013' : '#E9E7DF');
    powerHooks.forEach((fn) => fn(on));
    updDusk();
  }
  function setPower(on, btn) {
    if (!MOTION || typeof d.startViewTransition !== 'function') { applyPower(on); return; }
    let x = w.innerWidth - 60, y = 32;
    if (btn) { const r = btn.getBoundingClientRect(); x = r.left + r.width / 2; y = r.top + r.height / 2; }
    const R = Math.hypot(Math.max(x, w.innerWidth - x), Math.max(y, w.innerHeight - y));
    const vt = d.startViewTransition(() => applyPower(on));
    vt.ready.then(() => {
      root.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${R}px at ${x}px ${y}px)`] },
        { duration: 780, easing: 'cubic-bezier(0.77, 0, 0.175, 1)', pseudoElement: '::view-transition-new(root)' });
    }).catch(() => {});
  }
  powerBtns.forEach((b) => b.addEventListener('click', () => setPower(root.dataset.power !== 'on', b)));

  /* ---------------------------------------------------------------------
     8 · Hero: Stromlaufplan – Strom fließt beim Scrollen durch die Abgänge
     --------------------------------------------------------------------- */
  const hero = $('[data-hero]');
  const plans = $$('.plan__svg');
  const segEls = (n) => plans.map((s) => $(`[data-seg="${n}"]`, s)).filter(Boolean);
  const segState = {};
  function setSeg(n, p) {
    p = clamp(p, 0, 1);
    if (segState[n] === p) return;
    segState[n] = p;
    segEls(n).forEach((el) => { el.style.strokeDashoffset = String(1 - p); });
    plans.forEach((s) => {
      const dot = $(`[data-dots="${n}"]`, s);
      if (dot) dot.classList.toggle('is-on', p >= 0.999);
      const ld = $(`[data-load="${n}"]`, s);
      if (ld) ld.classList.toggle('is-on', p >= 0.999);
    });
  }
  function tweenSeg(n, to, dur, delay = 0) {
    return new Promise((res) => {
      const from = segState[n] || 0;
      const t0 = performance.now() + delay;
      const tick = (now) => {
        const k = clamp((now - t0) / dur, 0, 1);
        if (now >= t0) setSeg(n, from + (to - from) * easeInOut(k));
        if (k < 1) raf(tick); else res();
      };
      raf(tick);
    });
  }
  const BRANCHES = [['b2', 0.02, 0.24], ['b3', 0.2, 0.42], ['b4', 0.38, 0.6], ['b1', 0.56, 0.78]];
  const sig = $('[data-sig]');
  let heroIntroDone = false;
  let scrubHero = null;
  function heroScrub(p) {
    if (!heroIntroDone) return;
    BRANCHES.forEach(([n, a, b]) => setSeg(n, (p - a) / (b - a)));
    if (root.dataset.power === 'on') setSeg('b1', 1);
    if (sig) sig.classList.toggle('is-signed', p > 0.82);
  }
  if (hero && MOTION) {
    if ('IntersectionObserver' in w) new IntersectionObserver((en) => hero.classList.toggle('is-live', en[0].isIntersecting)).observe(hero);
    const intro = () => tweenSeg('feed', 1, 650, 480).then(() => tweenSeg('bus', 1, 520)).then(() => {
      heroIntroDone = true;
      if (root.dataset.power === 'on') { setSeg('b1', 1); tweenSeg('b1on', 1, 420); }
      if (!scrubHero) {
        // Handy / ohne Scroll-Strecke: Abgänge nacheinander zeitgesteuert
        let p = Promise.resolve();
        ['b2', 'b3', 'b4', 'b1'].forEach((n) => { p = p.then(() => tweenSeg(n, 1, 420, 90)); });
        p.then(() => { if (sig) sig.classList.add('is-signed'); });
      } else heroScrub(scrubHero.progress);
    });
    intro();
  } else if (sig) sig.classList.add('is-signed');
  powerHooks.push((on) => {
    if (!MOTION) return;
    if (on) { setSeg('b1', 1); tweenSeg('b1on', 1, 420); } else tweenSeg('b1on', 0, 260);
  });

  // Kinetische Schrift: Buchstaben in Zeigernähe werden breiter (gefedert)
  const chars = $$('.hero__title .c');
  if (hero && MOTION && FINE && chars.length) {
    const ht = $('.ht');
    let cache = [], px = -9999, py = -9999, inside = false, id = 0;
    const cur = chars.map(() => ({ s: 112, w: 800 }));
    const measure = () => { cache = chars.map((c) => { const r = c.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }); };
    const step = () => {
      id = 0;
      let moving = false;
      chars.forEach((c, i) => {
        const [cx, cy] = cache[i] || [0, 0];
        const dd = inside ? Math.hypot(px - cx, (py - cy) * 1.4) : 9999;
        const k = clamp(1 - dd / 240, 0, 1);
        const ts = 112 + 13 * k * k, tw = 800 + 100 * k;
        const o = cur[i];
        o.s += (ts - o.s) * 0.14; o.w += (tw - o.w) * 0.14;
        if (Math.abs(ts - o.s) > 0.05) moving = true;
        c.style.fontStretch = `${o.s.toFixed(2)}%`;
        c.style.fontWeight = String(Math.round(o.w));
      });
      if (moving) id = raf(step);
    };
    const arm = () => {
      if (!DESK()) return;
      ht.classList.add('ht--done');
      hero.addEventListener('pointerenter', measure);
      hero.addEventListener('pointermove', (e) => {
        if (e.pointerType !== 'mouse' || !DESK()) return;
        if (!cache.length) measure();
        px = e.clientX; py = e.clientY; inside = true;
        if (!id) id = raf(step);
      }, { passive: true });
      hero.addEventListener('pointerleave', () => { inside = false; if (!id) id = raf(step); });
      w.addEventListener('scroll', () => { cache = []; }, { passive: true });
      w.addEventListener('resize', () => { cache = []; }, { passive: true });
    };
    setTimeout(arm, 1700);
  }

  /* ---------------------------------------------------------------------
     9 · Magnetische Buttons (nur feiner Zeiger, Feder per Lerp)
     --------------------------------------------------------------------- */
  if (MOTION && FINE) {
    $$('.btn--mag, .sos__call').forEach((btn) => {
      let tx = 0, ty = 0, x = 0, y = 0, id = 0;
      const step = () => {
        x += (tx - x) * 0.18; y += (ty - y) * 0.18;
        btn.style.translate = `${x.toFixed(2)}px ${y.toFixed(2)}px`;
        id = (Math.abs(tx - x) > 0.05 || Math.abs(ty - y) > 0.05) ? raf(step) : 0;
      };
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        tx = (e.clientX - (r.left + r.width / 2)) * 0.22;
        ty = (e.clientY - (r.top + r.height / 2)) * 0.3;
        if (!id) id = raf(step);
      });
      btn.addEventListener('pointerleave', () => { tx = 0; ty = 0; if (!id) id = raf(step); });
    });
  }

  /* ---------------------------------------------------------------------
     10 · Leistungen: Verteiler mit 9 Leitungsschutzschaltern (Tabs)
     --------------------------------------------------------------------- */
  later(() => {
    const board = $('[data-board]');
    if (!board) return;
    const tabs = $$('[role="tab"]', board);
    const panels = $$('[role="tabpanel"]', board);
    let cur = 0;
    function select(i, focus) {
      tabs.forEach((t, k) => { t.setAttribute('aria-selected', String(k === i)); t.tabIndex = k === i ? 0 : -1; });
      panels.forEach((p, k) => {
        p.hidden = k !== i;
        if (k === i && MOTION && i !== cur) { p.classList.remove('is-in'); void p.offsetWidth; p.classList.add('is-in'); }
      });
      cur = i;
      if (focus) tabs[i].focus();
    }
    select(0);
    tabs.forEach((t, i) => t.addEventListener('click', () => select(i)));
    board.querySelector('[role="tablist"]').addEventListener('keydown', (e) => {
      const i = tabs.indexOf(d.activeElement);
      if (i < 0) return;
      let n = -1;
      if (e.key === 'ArrowRight') n = (i + 1) % tabs.length;
      else if (e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') n = 0;
      else if (e.key === 'End') n = tabs.length - 1;
      if (n < 0) return;
      e.preventDefault();
      select(n, true);
    });
  });

  /* ---------------------------------------------------------------------
     11 · Zählwerk: Ziffernrollen wie beim Stromzähler
     --------------------------------------------------------------------- */
  later(() => {
    const drums = $$('[data-drum]');
    drums.forEach((el) => {
      if (el.dataset.yearsSince) {
        const yrs = nowBerlin.year - Number(el.dataset.yearsSince);
        if (yrs > 0) el.dataset.drum = String(yrs);
      }
      const o = makeOdo(el);
      el._odo = o;
      o.set(MOTION ? el.dataset.drum.replace(/\d/g, '0') : el.dataset.drum, true);
    });
    if (MOTION && 'IntersectionObserver' in w) {
      const io = new IntersectionObserver((en) => en.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        setTimeout(() => el._odo.set(el.dataset.drum), drums.indexOf(el) * 110);
        io.unobserve(el);
      }), { threshold: 0.6 });
      drums.forEach((el) => io.observe(el));
    }
  });

  /* ---------------------------------------------------------------------
     10 · PV-Rechner
     Richtwerte (Durchschnitt, Raum Leipzig). Alle Werte sind Annahmen
     für eine grobe Schätzung – kein Angebot.
     --------------------------------------------------------------------- */
  const PV = {
    M2_PER_KWP: 5,                                   // nutzbare Dachfläche je kWp
    YIELD: { sued: 950, sosw: 900, ow: 820, nonw: 700 }, // spezifischer Ertrag kWh/kWp·a
    SELF_RATE: { ohne: 0.30, mit: 0.65 },            // Eigenverbrauchsanteil am Ertrag
    AUTARKY_CAP: { ohne: 0.40, mit: 0.75 },          // Deckel: max. Anteil des Verbrauchs
    FEED_IN_CT: { bis10: 7.9, ueber10: 6.9 },        // Einspeisevergütung ct/kWh (Beispielwerte Teileinspeisung)
    COST_PER_KWP: 1400,                              // € je kWp inkl. Montage
    STORE_COST_PER_KWH: 650,                         // € je kWh Speicher
    STORE_KWH_PER_KWP: 1,                            // Speichergröße ≈ 1 kWh je kWp
    COST_RANGE: [0.9, 1.15],                         // Spanne der Investition
    CO2_KG_PER_KWH: 0.38,                            // CO₂-Faktor Strommix
    MODULE_WP: 430,                                  // Modulleistung für die Modulanzahl
    // Monatsverteilung in % des Jahres (Ertrag PV Leipzig / Verbrauch Haushalt)
    MONTH_YIELD: [2.6, 4.4, 8.0, 11.3, 13.3, 13.6, 13.8, 12.1, 9.3, 6.4, 3.2, 2.0],
    MONTH_USE: [9.6, 8.7, 8.8, 7.9, 7.6, 7.1, 7.2, 7.3, 7.6, 8.4, 9.0, 10.8],
  };
  const MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
  const ORIENT_LABEL = { sued: 'Süd', sosw: 'Süd-Ost/West', ow: 'Ost-West', nonw: 'Nord-Ost/West' };

  function pvCalc({ area, orient, use, store, price }) {
    const kwp = Math.round((area / PV.M2_PER_KWP) * 10) / 10;
    const spec = PV.YIELD[orient];
    const yieldKwh = kwp * spec;
    const k = store ? 'mit' : 'ohne';
    const self = Math.min(yieldKwh * PV.SELF_RATE[k], use * PV.AUTARKY_CAP[k]);
    const feed = Math.max(0, yieldKwh - self);
    const feedCt = kwp <= 10 ? PV.FEED_IN_CT.bis10 : (10 * PV.FEED_IN_CT.bis10 + (kwp - 10) * PV.FEED_IN_CT.ueber10) / kwp;
    const save = (self * price) / 100 + (feed * feedCt) / 100;
    const storeKwh = store ? Math.max(3, Math.round(kwp * PV.STORE_KWH_PER_KWP)) : 0;
    const cost = kwp * PV.COST_PER_KWP + storeKwh * PV.STORE_COST_PER_KWH;
    const lo = cost * PV.COST_RANGE[0];
    const hi = cost * PV.COST_RANGE[1];
    const payback = save > 0 ? (lo + hi) / 2 / save : 99;
    return {
      kwp, spec, yieldKwh, self, feed, save, storeKwh, lo, hi, payback,
      selfQ: yieldKwh ? self / yieldKwh : 0,
      autarky: use ? self / use : 0,
      co2: (yieldKwh * PV.CO2_KG_PER_KWH) / 1000,
      modules: Math.max(1, Math.round((kwp * 1000) / PV.MODULE_WP)),
      monthsY: PV.MONTH_YIELD.map((p) => (yieldKwh * p) / 100),
      monthsU: PV.MONTH_USE.map((p) => (use * p) / 100),
      use, orient, store, price,
    };
  }

  // Odometer: rollende Ziffern
  function makeOdo(el) {
    const sr = d.createElement('span');
    sr.className = 'sr-only';
    el.after(sr);
    el.setAttribute('aria-hidden', 'true');
    let cur = null;
    function set(str, instant) {
      sr.textContent = str;
      if (str === cur) return;
      const prev = cur || '';
      const isD = (c) => c >= '0' && c <= '9';
      const same = cur !== null && prev.length === str.length && Array.from(str).every((c, i) => (isD(c) && isD(prev[i])) || c === prev[i]);
      cur = str;
      if (!same) {
        el.textContent = '';
        Array.from(str).forEach((c, i) => {
          if (isD(c)) {
            const box = d.createElement('span');
            box.className = 'odo__d';
            const ph = d.createElement('span');
            ph.className = 'odo__ph';
            ph.textContent = '0';
            box.appendChild(ph);
            const strip = d.createElement('span');
            strip.className = 'odo__s';
            for (let n = 0; n < 10; n++) { const s = d.createElement('span'); s.textContent = String(n); strip.appendChild(s); }
            const pi = prev.length - (str.length - i);
            const start = pi >= 0 && isD(prev[pi]) ? Number(prev[pi]) : 0;
            strip.style.transition = 'none';
            strip.style.transform = `translateY(${-start * 10}%)`;
            box.appendChild(strip);
            el.appendChild(box);
          } else {
            const s = d.createElement('span');
            s.className = 'odo__c';
            s.textContent = c;
            el.appendChild(s);
          }
        });
        void el.offsetWidth;
      }
      const strips = el.querySelectorAll('.odo__s');
      const digits = Array.from(str).filter(isD);
      strips.forEach((s, i) => {
        s.style.transition = instant || !MOTION ? 'none' : '';
        s.style.transitionDelay = instant || !MOTION ? '' : `${(strips.length - 1 - i) * 28}ms`;
        s.style.transform = `translateY(${-Number(digits[i]) * 10}%)`;
      });
    }
    return { set };
  }

  /* ---------------------------------------------------------------------
     12 · Sonnenbahn über dem Dach (PV-Set-Piece)
     --------------------------------------------------------------------- */
  const sky = (() => {
    const api = { update() {}, month() {}, scrub() {} };
    const fig = $('[data-sky]');
    if (!fig) return api;
    const svg = $('svg', fig);
    const arc = $('[data-sky-arc]', fig), sun = $('[data-sky-sun]', fig), mods = $('[data-sky-mods]', fig);
    const rays = $$('[data-sky-rays] path', fig), info = $('[data-sky-info]', fig), ticks = $('[data-sky-ticks]', fig);
    const needle = $('[data-sky-needle]', fig), orientT = $('[data-sky-orient]', fig), yieldT = $('[data-sky-yield]', fig), modT = $('[data-sky-mod-t]', fig);
    const NS = 'http://www.w3.org/2000/svg';
    const NOON = [17.7, 25.7, 36.7, 48.7, 57.7, 61.7, 59.7, 52.7, 41.7, 29.7, 20.7, 15.7];
    const MLONG = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
    const ORF = { sued: 1, sosw: 0.94, ow: 0.86, nonw: 0.72 };
    const ORDEG = { sued: 0, sosw: 35, ow: 90, nonw: 145 };
    let month = 5, t = 0.5, orientF = 1, ry = 0, nMods = -1;
    const ROWS = [[186, 552, 728], [210, 543, 737], [234, 532, 748]];
    function buildMods(n) {
      if (n === nMods) return;
      nMods = n;
      mods.textContent = '';
      let left = n;
      for (let r = ROWS.length - 1; r >= 0 && left > 0; r--) {
        const [y, x0, x1] = ROWS[r];
        const cols = Math.floor((x1 - x0 + 3) / 25);
        const k = Math.min(cols, left);
        const off = x0 + ((x1 - x0) - (k * 25 - 3)) / 2;
        for (let c = 0; c < k; c++) {
          const rc = d.createElementNS(NS, 'rect');
          rc.setAttribute('x', (off + c * 25).toFixed(1)); rc.setAttribute('y', y);
          rc.setAttribute('width', '22'); rc.setAttribute('height', '20');
          mods.appendChild(rc);
        }
        left -= k;
      }
    }
    function geom() {
      ry = 200 + NOON[month] * 1.6;
      arc.setAttribute('d', `M60 360A540 ${ry.toFixed(1)} 0 0 1 1140 360`);
      ticks.textContent = '';
      for (let h = 1; h < 12; h++) {
        const [x, y] = pos(h / 12);
        const c = d.createElementNS(NS, 'path');
        c.setAttribute('d', `M${x.toFixed(1)} ${(y - 5).toFixed(1)}v10`);
        ticks.appendChild(c);
      }
      info.textContent = `Sonnenbahn Mitte ${MLONG[month]} · Mittagshöhe ${Math.round(NOON[month])}° · Leipzig 51,3° N`;
    }
    function pos(tt) { const a = Math.PI * tt; return [600 - 540 * Math.cos(a), 360 - ry * Math.sin(a)]; }
    function draw() {
      const [x, y] = pos(t);
      sun.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(t * 180).toFixed(1)})`);
      const elev = Math.sin(Math.PI * t) * (NOON[month] / 61.7);
      const inten = clamp(elev * orientF * 1.1, 0, 1);
      mods.style.fillOpacity = (0.1 + 0.9 * inten).toFixed(3);
      const targets = [[566, 196], [640, 190], [716, 196]];
      rays.forEach((p, i) => {
        p.setAttribute('d', `M${x.toFixed(1)} ${y.toFixed(1)}L${targets[i][0]} ${targets[i][1]}`);
        p.style.opacity = (inten * 0.9).toFixed(2);
      });
      fig.classList.toggle('is-sunny', inten > 0.3);
    }
    const mq = w.matchMedia('(max-width: 640px)');
    const setVB = () => svg.setAttribute('viewBox', mq.matches ? '290 20 660 370' : '0 0 1200 400');
    setVB();
    if (mq.addEventListener) mq.addEventListener('change', setVB);
    if ('IntersectionObserver' in w) new IntersectionObserver((en) => fig.classList.toggle('is-live', en[0].isIntersecting)).observe(fig);
    geom(); draw();
    api.update = (r) => {
      buildMods(Math.min(r.modules, 23));
      orientF = ORF[r.orient] || 1;
      needle.setAttribute('transform', `rotate(${ORDEG[r.orient] || 0})`);
      orientT.textContent = `Dach: ${ORIENT_LABEL[r.orient]}`;
      yieldT.textContent = `${fmt(Math.round(r.yieldKwh / 10) * 10)} kWh / Jahr`;
      modT.textContent = `${r.modules} Module à ${PV.MODULE_WP} Wp`;
      draw();
    };
    api.month = (i) => { const m = i >= 0 ? i : 5; if (m === month) return; month = m; geom(); draw(); };
    api.scrub = (p) => { t = 0.06 + 0.88 * p; draw(); };
    return api;
  })();

  later(() => {
  const pvForm = $('[data-pv-form]');
  const pv = { odos: {}, last: null, started: false };
  if (pvForm) {
    const area = $('#pv-area'), use = $('#pv-use'), price = $('#pv-price');
    const storeBtn = $('[data-pv-store]');
    const seg = $('[data-seg]');
    const presets = $$('[data-preset]');
    const outEls = { area: $('[data-out="area"]'), use: $('[data-out="use"]'), price: $('[data-out="price"]') };
    $$('[data-kpi]').forEach((el) => { pv.odos[el.dataset.kpi] = makeOdo(el); });
    const txt = (k) => $(`[data-kpi-text="${k}"]`);

    // Chart aufbauen
    const svg = $('[data-chart]');
    const NS = 'http://www.w3.org/2000/svg';
    const C = { w: 640, h: 250, l: 46, r: 6, t: 14, b: 30 };
    const pw = C.w - C.l - C.r, ph = C.h - C.t - C.b, slot = pw / 12, bw = 20;
    const mk = (tag, attrs, parent) => { const e = d.createElementNS(NS, tag); Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v)); (parent || svg).appendChild(e); return e; };
    const defs = mk('defs', {});
    const lg = mk('linearGradient', { id: 'cUseFill', x1: '0', y1: '0', x2: '0', y2: '1' }, defs);
    mk('stop', { offset: '0', 'stop-color': '#4DA3FF', 'stop-opacity': '.22' }, lg);
    mk('stop', { offset: '1', 'stop-color': '#4DA3FF', 'stop-opacity': '0' }, lg);
    const gGrid = mk('g', {});
    const gridLines = [], gridLabels = [];
    for (let i = 0; i <= 4; i++) {
      const y = C.t + ph - (ph * i) / 4;
      gridLines.push(mk('line', { class: 'c-grid', x1: C.l, x2: C.w - C.r, y1: y, y2: y }, gGrid));
      gridLabels.push(mk('text', { class: 'c-axis', x: C.l - 8, y: y + 4, 'text-anchor': 'end' }, gGrid));
    }
    const cols = [], bars = [], dots = [];
    MONTHS.forEach((m, i) => {
      const x = C.l + slot * i;
      cols.push(mk('rect', { class: 'c-col', x: x + 2, y: C.t, width: slot - 4, height: ph, rx: 6 }));
      mk('text', { class: 'c-axis', x: x + slot / 2, y: C.h - 8, 'text-anchor': 'middle' }).textContent = m;
    });
    MONTHS.forEach((m, i) => { bars.push(mk('rect', { class: 'c-bar', x: C.l + slot * i + (slot - bw) / 2, y: C.t + ph, width: bw, height: 0, rx: 3 })); });
    const area2 = mk('path', { class: 'c-area', d: '' });
    const line = mk('path', { class: 'c-line', d: '' });
    MONTHS.forEach(() => dots.push(mk('circle', { class: 'c-dot', r: 3.5, cx: 0, cy: 0 })));
    const tbody = $('[data-chart-table] tbody');
    const readout = $('[data-chart-readout]');

    let chartState = { y: new Array(12).fill(0), u: new Array(12).fill(0), max: 1000 };
    let chartAnim = 0;
    const niceMax = (v) => {
      const raw = v / 4;
      const steps = [50, 100, 150, 200, 250, 300, 400, 500, 750, 1000, 1500, 2000, 2500, 3000, 4000, 5000];
      const s = steps.find((x) => x >= raw) || Math.ceil(raw / 1000) * 1000;
      return s * 4;
    };
    function paintChart(st) {
      const yOf = (v) => C.t + ph - (v / st.max) * ph;
      bars.forEach((b, i) => {
        const h = Math.max(0, (st.y[i] / st.max) * ph);
        b.setAttribute('y', (C.t + ph - h).toFixed(1));
        b.setAttribute('height', h.toFixed(1));
      });
      const pts = st.u.map((v, i) => [C.l + slot * i + slot / 2, yOf(v)]);
      const dLine = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('');
      line.setAttribute('d', dLine);
      area2.setAttribute('d', `${dLine}L${pts[11][0].toFixed(1)} ${C.t + ph}L${pts[0][0].toFixed(1)} ${C.t + ph}Z`);
      dots.forEach((c, i) => { c.setAttribute('cx', pts[i][0].toFixed(1)); c.setAttribute('cy', pts[i][1].toFixed(1)); });
      gridLabels.forEach((t, i) => { t.textContent = fmt((st.max * i) / 4); });
    }
    function updateChart(r, instant) {
      const to = { y: r.monthsY, u: r.monthsU, max: niceMax(Math.max(...r.monthsY, ...r.monthsU)) };
      cancelAnimationFrame(chartAnim);
      if (instant || !MOTION) { chartState = to; paintChart(to); return; }
      const from = chartState;
      const t0 = performance.now();
      const dur = 650;
      const tick = (now) => {
        const p = easeOutCubic(clamp((now - t0) / dur, 0, 1));
        const lerp = (a, b) => a + (b - a) * p;
        chartState = { y: from.y.map((v, i) => lerp(v, to.y[i])), u: from.u.map((v, i) => lerp(v, to.u[i])), max: lerp(from.max, to.max) };
        paintChart(chartState);
        if (p < 1) chartAnim = raf(tick);
      };
      chartAnim = raf(tick);
    }
    function fillTable(r) {
      tbody.textContent = '';
      MONTHS.forEach((m, i) => {
        const tr = d.createElement('tr');
        [m, `${fmt(r.monthsY[i])} kWh`, `${fmt(r.monthsU[i])} kWh`].forEach((v, j) => {
          const c = d.createElement(j ? 'td' : 'th');
          if (!j) c.setAttribute('scope', 'row');
          c.textContent = v;
          tr.appendChild(c);
        });
        tbody.appendChild(tr);
      });
    }
    const defaultReadout = (r) => `Jahr · ${fmt(Math.round(r.yieldKwh / 10) * 10)} kWh Ertrag · ${fmt(r.use)} kWh Verbrauch`;
    let hoverIdx = -1;
    function showMonth(i) {
      hoverIdx = i;
      sky.month(i);
      const r = pv.last;
      if (!r) return;
      cols.forEach((c, k) => c.classList.toggle('is-on', k === i));
      bars.forEach((b, k) => b.classList.toggle('c-bar--dim', i >= 0 && k !== i));
      if (i < 0) { readout.textContent = defaultReadout(r); return; }
      const diff = r.monthsY[i] - r.monthsU[i];
      readout.textContent = `${MONTHS[i]} · Ertrag ${fmt(r.monthsY[i])} kWh · Verbrauch ${fmt(r.monthsU[i])} kWh · ${diff >= 0 ? 'Überschuss' : 'Bezug'} ${fmt(Math.abs(diff))} kWh`;
    }
    svg.addEventListener('pointermove', (e) => {
      const r = svg.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * C.w;
      const i = Math.floor((x - C.l) / slot);
      showMonth(i >= 0 && i < 12 ? i : -1);
    });
    svg.addEventListener('pointerleave', () => showMonth(-1));

    const fillRange = (inp) => {
      const p = ((inp.value - inp.min) / (inp.max - inp.min)) * 100;
      inp.style.setProperty('--p', `${p}%`);
    };
    $$('input[type="range"]').forEach((inp) => { fillRange(inp); inp.addEventListener('input', () => fillRange(inp)); });

    const read = () => ({
      area: Number(area.value),
      orient: (pvForm.querySelector('input[name="orient"]:checked') || {}).value || 'sued',
      use: Number(use.value),
      store: storeBtn.getAttribute('aria-checked') === 'true',
      price: Number(price.value),
    });

    let liveT = 0;
    const live = $('[data-pv-live]');
    function render(instant) {
      const s = read();
      const r = pvCalc(s);
      pv.last = r;
      sky.update(r);
      outEls.area.textContent = `${s.area} m²`;
      outEls.use.textContent = `${fmt(s.use)} kWh`;
      outEls.price.textContent = `${fmt(s.price, s.price % 1 ? 1 : 0)} ct/kWh`;
      presets.forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.preset) === s.use)));
      const radios = $$('input[name="orient"]', seg);
      seg.style.setProperty('--i', String(radios.findIndex((x) => x.checked)));
      if (pv.started) {
        pv.odos.kwp.set(fmt(r.kwp, 1), instant);
        pv.odos.yield.set(fmt(Math.round(r.yieldKwh / 10) * 10), instant);
        pv.odos.save.set(fmt(Math.round(r.save / 10) * 10), instant);
        pv.odos.selfq.set(fmt(Math.round(r.selfQ * 100)), instant);
        pv.odos.payback.set(r.payback > 30 ? '30' : fmt(r.payback, 1), instant);
        pv.odos.co2.set(fmt(r.co2, 1), instant);
        pv.odos.costlo.set(fmt(Math.round(r.lo / 100) * 100), instant);
        pv.odos.costhi.set(fmt(Math.round(r.hi / 100) * 100), instant);
        updateChart(r, instant);
      }
      txt('modules').textContent = `≈ ${r.modules} Module à ${PV.MODULE_WP} Wp`;
      txt('specific').textContent = `${fmt(r.spec)} kWh je kWp · ${ORIENT_LABEL[s.orient]}`;
      txt('storeinfo').textContent = r.storeKwh ? `inkl. ${r.storeKwh} kWh Speicher` : 'ohne Speicher';
      txt('payunit').textContent = r.payback > 30 ? 'Jahre +' : 'Jahre';
      txt('autarky').textContent = `Autarkie ${fmt(Math.round(r.autarky * 100))} %`;
      if (hoverIdx >= 0) showMonth(hoverIdx); else readout.textContent = defaultReadout(r);
      fillTable(r);
      clearTimeout(liveT);
      liveT = setTimeout(() => {
        live.textContent = `Schätzung: ${fmt(r.kwp, 1)} kWp, rund ${fmt(Math.round(r.yieldKwh / 10) * 10)} kWh Ertrag pro Jahr, Eigenverbrauch ${fmt(Math.round(r.selfQ * 100))} Prozent, Ersparnis etwa ${fmt(Math.round(r.save / 10) * 10)} Euro pro Jahr, Amortisation nach ca. ${fmt(Math.min(30, r.payback), 1)} Jahren.`;
      }, 900);
    }

    [area, use, price].forEach((inp) => inp.addEventListener('input', () => render()));
    $$('input[name="orient"]', seg).forEach((r) => r.addEventListener('change', () => render()));
    presets.forEach((b) => b.addEventListener('click', () => { use.value = b.dataset.preset; fillRange(use); render(); }));
    storeBtn.addEventListener('click', () => {
      storeBtn.setAttribute('aria-checked', String(storeBtn.getAttribute('aria-checked') !== 'true'));
      render();
    });

    // Erste Darstellung: Ziffern rollen beim ersten Sichtkontakt hoch
    render(true);
    const startPV = () => { if (pv.started) return; pv.started = true; render(!MOTION); };
    if (MOTION && 'IntersectionObserver' in w) {
      const io = new IntersectionObserver((en) => { if (en[0].isIntersecting) { startPV(); io.disconnect(); } }, { threshold: 0.25 });
      io.observe($('[data-pv-out]'));
    } else startPV();

    $('[data-pv-transfer]').addEventListener('click', () => {
      const r = pv.last;
      const s = read();
      const summary = `${fmt(r.kwp, 1)} kWp · ${ORIENT_LABEL[s.orient]} · ${fmt(s.use)} kWh/Jahr · ${r.storeKwh ? `${r.storeKwh} kWh Speicher` : 'ohne Speicher'} · ca. ${fmt(Math.round(r.save / 10) * 10)} €/Jahr Ersparnis`;
      wizard.fromPV(summary);
      const t = $('#anfrage');
      scrollToEl(t, () => focusTarget($('#anfrage-title')));
    });
  }
  });

  later(() => {
  /* ---------------------------------------------------------------------
     11 · Lichtschalter-Moment
     --------------------------------------------------------------------- */
  const lightSec = $('[data-light]');
  if (lightSec) {
    const sw = $('[data-light-switch]', lightSec);
    const stage = $('[data-light-stage]', lightSec);
    const stateEl = $('[data-light-state]', lightSec);
    const tag = $('[data-light-tag]', lightSec);
    const alt = $('[data-light-alt]', lightSec);
    const luxEl = $('[data-lux]', lightSec);
    const wattEl = $('[data-watt]', lightSec);
    const hintEl = $('#light-hint');
    let tw = 0;
    let tapAt = null; // Klick ins Zimmer: Licht breitet sich von dort aus
    const setOriginAt = (cx, cy, b) => {
      const far = Math.max(...[[0, 0], [b.width, 0], [0, b.height], [b.width, b.height]].map(([x, y]) => Math.hypot(x - cx, y - cy)));
      stage.style.setProperty('--cx', `${cx.toFixed(0)}px`);
      stage.style.setProperty('--cy', `${cy.toFixed(0)}px`);
      stage.style.setProperty('--r', `${Math.ceil(far + 24)}px`);
    };
    const setOrigin = () => {
      const a = sw.getBoundingClientRect();
      const b = stage.getBoundingClientRect();
      setOriginAt(a.left + a.width / 2 - b.left, a.top + a.height / 2 - b.top, b);
    };
    const tweenNum = (from, to, set) => {
      cancelAnimationFrame(tw);
      if (!MOTION) { set(to); return; }
      const t0 = performance.now();
      const tick = (now) => {
        const p = easeOutCubic(clamp((now - t0) / 700, 0, 1));
        set(from + (to - from) * p);
        if (p < 1) tw = raf(tick);
      };
      tw = raf(tick);
    };
    setOrigin();
    w.addEventListener('resize', setOrigin, { passive: true });
    sw.addEventListener('pointerdown', setOrigin);
    sw.addEventListener('click', () => {
      if (tapAt) { setOriginAt(tapAt[0], tapAt[1], stage.getBoundingClientRect()); tapAt = null; } else setOrigin();
      lightSec.classList.add('was-used');
      const on = sw.getAttribute('aria-pressed') !== 'true';
      sw.setAttribute('aria-pressed', String(on));
      lightSec.classList.toggle('is-lit', on);
      stateEl.textContent = on ? 'An' : 'Aus';
      if (hintEl) hintEl.textContent = on ? 'Noch einmal drücken – Licht aus.' : 'Drücken Sie den Schalter.';
      tag.textContent = on ? 'Licht an · 2.700 K' : 'Licht aus';
      alt.textContent = `Hotelzimmer mit Holzverkleidung, indirekter LED-Beleuchtung an Decke und Boden und hellem Vorhang. Das Licht ist ${on ? 'eingeschaltet' : 'ausgeschaltet'}.`;
      const l0 = Number(luxEl.textContent) || 0;
      const w0 = Number(wattEl.textContent) || 0;
      tweenNum(0, 1, (p) => {
        luxEl.textContent = String(Math.round(l0 + ((on ? 320 : 4) - l0) * p));
        wattEl.textContent = String(Math.round(w0 + ((on ? 46 : 0) - w0) * p));
      });
      if (MOTION) {
        sw.classList.remove('is-clicked');
        void sw.offsetWidth;
        sw.classList.add('is-clicked');
      }
    });
    sw.addEventListener('animationend', (e) => { if (e.animationName === 'switch-ring') sw.classList.remove('is-clicked'); });
    // Großes Ziel: Tippen/Klicken ins Zimmer schaltet ebenfalls (Tastatur bleibt beim Schalter)
    stage.addEventListener('click', (e) => {
      const b = stage.getBoundingClientRect();
      tapAt = [e.clientX - b.left, e.clientY - b.top];
      sw.click();
    });
  }
  });

  later(() => {
  /* ---------------------------------------------------------------------
     12 · Smart-Home-Panel
     --------------------------------------------------------------------- */
  const home = $('[data-home]');
  if (home) {
    const S = { light: { on: true, level: 70 }, blind: 'up', heat: { target: 21.0, ist: 20.4 }, ev: { charging: false, pct: 48 } };
    const el = {
      lightTile: $('[data-tile="light"]', home), lightToggle: $('[data-light-toggle]', home), dimmer: $('[data-dimmer]', home),
      lightTxt: $('[data-light-txt]', home), glow: $('.tile__glow', home),
      blindTile: $('[data-tile="blind"]', home), blindBtns: $$('[data-blind]', home), blindBadge: $('[data-blind-badge]', home),
      heatTile: $('[data-tile="heat"]', home), heatVal: $('[data-heat-val]', home), heatIst: $('[data-heat-ist]', home), heatBadge: $('[data-heat-badge]', home),
      evTile: $('[data-tile="ev"]', home), evRing: $('[data-ev-ring]', home), evPct: $('[data-ev-pct]', home), evTxt: $('[data-ev-txt]', home),
      evBtn: $('[data-ev-btn]', home), evBadge: $('[data-ev-badge]', home), evProg: $('[data-ev-progress]', home),
      power: $('[data-power]', home), live: $('[data-home-live]', home), scenes: $$('[data-scene]', home),
    };
    const say = (m) => { el.live.textContent = ''; setTimeout(() => { el.live.textContent = m; }, 30); };
    const t1 = (v) => fmt(v, 1);
    function renderHome() {
      // Licht
      el.lightTile.dataset.on = String(S.light.on);
      el.lightToggle.setAttribute('aria-checked', String(S.light.on));
      el.dimmer.value = String(S.light.level);
      el.dimmer.style.setProperty('--p', `${((S.light.level - 5) / 95) * 100}%`);
      el.dimmer.setAttribute('aria-valuetext', `${S.light.level} Prozent${S.light.on ? '' : ', Licht aus'}`);
      el.lightTxt.textContent = S.light.on ? `An · ${S.light.level} %` : 'Aus';
      el.glow.style.opacity = S.light.on ? String(0.25 + (S.light.level / 100) * 0.75) : '0';
      // Rollläden
      el.blindTile.dataset.state = S.blind;
      el.blindBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.blind === S.blind)));
      el.blindBadge.textContent = S.blind === 'up' ? 'offen' : 'geschlossen';
      // Heizung
      el.heatVal.textContent = t1(S.heat.target);
      el.heatIst.textContent = t1(S.heat.ist);
      const diff = S.heat.target - S.heat.ist;
      const mode = diff > 0.15 ? 'heat' : diff < -0.15 ? 'cool' : 'hold';
      el.heatTile.dataset.mode = mode;
      el.heatBadge.textContent = mode === 'heat' ? 'heizt' : mode === 'cool' ? 'Absenkung' : 'hält';
      // Wallbox
      el.evTile.dataset.state = S.ev.charging ? 'charging' : S.ev.pct >= 100 ? 'full' : 'idle';
      el.evRing.style.strokeDashoffset = String(100 - S.ev.pct);
      el.evPct.textContent = String(S.ev.pct);
      el.evProg.setAttribute('aria-valuenow', String(S.ev.pct));
      el.evBtn.setAttribute('aria-pressed', String(S.ev.charging));
      el.evBtn.textContent = S.ev.charging ? 'Laden stoppen' : S.ev.pct >= 100 ? 'Voll geladen' : 'Laden starten';
      el.evBtn.disabled = S.ev.pct >= 100 && !S.ev.charging;
      el.evBadge.textContent = S.ev.charging ? 'lädt · 11 kW' : S.ev.pct >= 100 ? 'voll' : 'bereit';
      if (S.ev.charging) {
        const min = Math.round((((100 - S.ev.pct) / 100) * 60 / 11) * 60);
        el.evTxt.textContent = `voll in ca. ${min >= 60 ? `${Math.floor(min / 60)} h ${min % 60} min` : `${min} min`}`;
      } else el.evTxt.textContent = S.ev.pct >= 100 ? 'Akku voll' : 'Fahrzeug verbunden';
      // Verbrauch
      const kw = 0.32 + (S.light.on ? (S.light.level / 100) * 0.14 : 0) + (mode === 'heat' ? 1.45 : mode === 'hold' ? 0.38 : 0.12) + (S.ev.charging ? 11 : 0);
      tweenPower(kw);
    }
    // Verbrauchsanzeige zählt weich zum neuen Wert (unterbrechbar)
    let powNow = null, powAnim = 0;
    function tweenPower(to) {
      cancelAnimationFrame(powAnim);
      if (powNow === null || !MOTION || Math.abs(to - powNow) < 0.05) { powNow = to; el.power.textContent = t1(to); return; }
      const from = powNow, t0 = performance.now();
      const tick = (now) => {
        const p = easeOutCubic(clamp((now - t0) / 420, 0, 1));
        powNow = from + (to - from) * p;
        el.power.textContent = t1(powNow);
        if (p < 1) powAnim = raf(tick);
      };
      powAnim = raf(tick);
    }
    const clearScene = () => el.scenes.forEach((b) => b.classList.remove('is-active'));

    el.lightToggle.addEventListener('click', () => {
      S.light.on = !S.light.on; clearScene(); renderHome();
      say(`Licht Wohnzimmer ${S.light.on ? `an, ${S.light.level} Prozent` : 'aus'}`);
    });
    el.dimmer.addEventListener('input', () => { S.light.level = Number(el.dimmer.value); S.light.on = true; clearScene(); renderHome(); });
    el.dimmer.addEventListener('change', () => say(`Helligkeit ${S.light.level} Prozent`));
    el.blindBtns.forEach((b) => b.addEventListener('click', () => {
      S.blind = b.dataset.blind; clearScene(); renderHome();
      say(`Rollläden ${S.blind === 'up' ? 'fahren auf' : 'fahren zu'}`);
    }));
    $$('[data-heat]', home).forEach((b) => b.addEventListener('click', () => {
      S.heat.target = clamp(Math.round((S.heat.target + Number(b.dataset.heat) * 0.5) * 10) / 10, 16, 26);
      clearScene(); renderHome();
    }));
    el.evBtn.addEventListener('click', () => {
      if (S.ev.pct >= 100 && !S.ev.charging) return;
      S.ev.charging = !S.ev.charging; clearScene(); renderHome();
      say(S.ev.charging ? 'Wallbox lädt mit 11 Kilowatt' : `Laden gestoppt bei ${S.ev.pct} Prozent`);
    });
    const SCENES = {
      cozy: { light: { on: true, level: 35 }, blind: 'down', target: 21.5, msg: 'Szene Gemütlich: Licht 35 Prozent, Rollläden zu, Heizung 21,5 Grad.' },
      morning: { light: { on: true, level: 80 }, blind: 'up', target: 21, msg: 'Szene Guten Morgen: Licht 80 Prozent, Rollläden auf, Heizung 21 Grad.' },
      off: { light: { on: false, level: S.light.level }, blind: 'down', target: 18, msg: 'Alles aus: Licht aus, Rollläden zu, Heizung abgesenkt auf 18 Grad. Die Wallbox lädt weiter.' },
    };
    el.scenes.forEach((b) => b.addEventListener('click', () => {
      const sc = SCENES[b.dataset.scene];
      S.light.on = sc.light.on;
      if (sc.light.on) S.light.level = sc.light.level;
      S.blind = sc.blind;
      S.heat.target = sc.target;
      renderHome();
      el.scenes.forEach((x) => x.classList.toggle('is-active', x === b));
      say(sc.msg);
    }));

    // Simulation: Ist-Temperatur + Ladestand, nur wenn sichtbar
    let simVisible = false;
    let simT = 0;
    const tickSim = () => {
      if (!simVisible || d.hidden) return;
      let changed = false;
      const diff = S.heat.target - S.heat.ist;
      if (Math.abs(diff) > 0.05) { S.heat.ist = Math.round((S.heat.ist + Math.sign(diff) * 0.1) * 10) / 10; changed = true; }
      if (S.ev.charging) {
        S.ev.pct = Math.min(100, S.ev.pct + 1);
        if (S.ev.pct >= 100) { S.ev.charging = false; say('Wallbox: Akku voll geladen'); }
        changed = true;
      }
      if (changed) renderHome();
    };
    if ('IntersectionObserver' in w) {
      new IntersectionObserver((en) => {
        simVisible = en[0].isIntersecting;
        clearInterval(simT);
        if (simVisible) simT = setInterval(tickSim, 900);
      }).observe(home);
    }
    renderHome();
  }
  });

  /* ---------------------------------------------------------------------
     13 · Referenzen als Oszilloskop: Kanal = Filter, Liste = Signal
     --------------------------------------------------------------------- */
  const osc = { onFilter() {}, velocity: 0 };
  later(() => {
    const box = $('[data-osc]');
    if (!box) return;
    const screen = $('[data-osc-screen]', box);
    const cv = $('[data-osc-canvas]', box);
    const ctx = cv.getContext('2d');
    const items = $$('.ref', box);
    const chEl = $('[data-osc-ch]', box), waveEl = $('[data-osc-wave]', box), specEl = $('[data-osc-spec]', box);
    const knobs = $$('.knob i', box);
    const WAVES = {
      all: { ch: 'CH1–4', label: '50 Hz' },
      pv: { ch: 'CH1 · PV', label: 'DC-Welligkeit' },
      smart: { ch: 'CH2 · KNX', label: 'Telegramm 9,6 kBit/s' },
      sanierung: { ch: 'CH3 · Bestand', label: 'Oberschwingungen' },
      gewerbe: { ch: 'CH4 · Drehstrom', label: 'L1 · L2 · L3' },
    };
    const BITS = [1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 0, 1];
    let wave = 'all', active = null, phase = 0, amp = 1, running = false, inView = false, last = 0, W = 0, H = 0, DPR = 1;
    items.forEach((li) => {
      const m = $('.ref__media', li);
      if (m) { screen.insertBefore(m, cv); li._media = m; }
      const h = $('.ref__title', li);
      const b = d.createElement('button');
      b.type = 'button';
      b.className = 'ref__btn';
      b.textContent = h.textContent;
      h.textContent = '';
      h.appendChild(b);
      const pick = () => activate(li);
      b.addEventListener('click', pick);
      b.addEventListener('focus', pick);
      if (FINE) li.addEventListener('pointerenter', pick);
    });
    function activate(li) {
      if (!li || li === active) return;
      active = li;
      items.forEach((x) => x.classList.toggle('is-active', x === li));
      items.forEach((x) => { if (x._media) x._media.classList.toggle('is-on', x === li); });
      const cat = li.dataset.cat.split(' ')[0];
      wave = cat;
      chEl.textContent = WAVES[cat].ch;
      waveEl.textContent = WAVES[cat].label;
      specEl.textContent = $('.ref__spec', li).textContent;
      if (!MOTION) drawFrame();
    }
    osc.onFilter = (f) => {
      const first = items.find((x) => f === 'all' || x.dataset.cat.split(' ').includes(f));
      active = null;
      activate(first);
      if (f !== 'all') { wave = f; chEl.textContent = WAVES[f].ch; waveEl.textContent = WAVES[f].label; }
    };
    function y(type, x, ph, k) {
      const a = 2 * Math.PI * x;
      switch (type) {
        case 'pv': return 0.25 + 0.55 * Math.abs(Math.sin(a * 2 + ph)) - 0.4;
        case 'smart': { const i = Math.floor(((x * 18) + ph * 1.6) % 18 + 18) % 18; return BITS[i] ? 0.5 : -0.35; }
        case 'sanierung': { const b = a * 2.5 + ph; return 0.55 * (Math.sin(b) + 0.28 * Math.sin(3 * b) + 0.14 * Math.sin(5 * b + 0.6)); }
        case 'gewerbe': return 0.62 * Math.sin(a * 2 + ph + k * 2.094);
        default: return 0.62 * Math.sin(a * 2.5 + ph);
      }
    }
    function size() {
      const r = screen.getBoundingClientRect();
      DPR = Math.min(2, w.devicePixelRatio || 1);
      W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
      cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    }
    function drawFrame() {
      if (!W) size();
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const n = wave === 'gewerbe' ? 3 : 1;
      const N = 180;
      for (let k = 0; k < n; k++) {
        ctx.beginPath();
        for (let i = 0; i <= N; i++) {
          const x = i / N;
          const yy = H / 2 - y(wave, x, phase, k) * H * 0.34 * amp;
          if (i) ctx.lineTo(x * W, yy); else ctx.moveTo(0, yy);
        }
        const a = k ? 0.55 : 1;
        ctx.lineJoin = 'round';
        ctx.strokeStyle = `rgba(230,255,58,${0.16 * a})`; ctx.lineWidth = 7; ctx.stroke();
        ctx.strokeStyle = `rgba(236,255,120,${0.95 * a})`; ctx.lineWidth = 1.8; ctx.stroke();
      }
    }
    function loop(now) {
      if (!running) return;
      raf(loop);
      if (now - last < 33) return; // 30 fps genügen
      const dt = Math.min(0.1, (now - last) / 1000 || 0.033);
      last = now;
      const v = Math.abs(osc.velocity);
      amp += ((1 + Math.min(v * 0.05, 0.55)) - amp) * 0.12;
      phase += dt * (1.1 + Math.min(v * 0.25, 6));
      osc.velocity *= 0.9;
      drawFrame();
    }
    const sync = () => {
      const should = MOTION && inView && !d.hidden;
      if (should && !running) { running = true; last = 0; raf(loop); } else if (!should) running = false;
    };
    if ('IntersectionObserver' in w) new IntersectionObserver((en) => { inView = en[0].isIntersecting; sync(); }).observe(screen);
    d.addEventListener('visibilitychange', sync);
    if ('ResizeObserver' in w) new ResizeObserver(() => { size(); drawFrame(); }).observe(screen);
    size();
    activate(items[0]);
    drawFrame();
    if (MOTION && hasGsap) {
      w.ScrollTrigger.create({ trigger: box, start: 'top bottom', end: 'bottom top', onUpdate: (st) => {
        osc.velocity = st.getVelocity() / 300;
        knobs.forEach((k, i) => { k.style.transform = `rotate(${(st.progress * (i ? -200 : 300)).toFixed(1)}deg)`; });
      } });
    }
  });

  later(() => {
  const fbar = $('[data-filter-bar]');
  if (fbar) {
    const btns = $$('button', fbar);
    const list = $('#ref-list');
    const items = $$('.ref', list);
    const live = $('[data-filter-live]');
    let current = 'all', busy = false, queued = null;
    const match = (el, f) => f === 'all' || el.dataset.cat.split(' ').includes(f);
    const canAnim = MOTION && typeof Element.prototype.animate === 'function';


    function apply(f) {
      if (busy) { queued = f; return; }
      if (f === current) return;
      current = f;
      osc.onFilter(f);
      btns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filter === f)));
      const n = items.filter((el) => match(el, f)).length;
      const label = (btns.find((b) => b.dataset.filter === f).firstChild.textContent || '').trim();
      live.textContent = `${n} Projekte${f === 'all' ? '' : ` in ${label}`} angezeigt`;
      if (!canAnim) { items.forEach((el) => { el.hidden = !match(el, f); }); refreshST(); return; }
      busy = true;
      const first = new Map();
      items.forEach((el) => { if (!el.hidden) first.set(el, el.getBoundingClientRect()); });
      const leaving = items.filter((el) => !el.hidden && !match(el, f));
      const outs = leaving.map((el) => el.animate(
        [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(0.96)' }],
        { duration: 170, easing: 'cubic-bezier(0.23, 1, 0.32, 1)', fill: 'forwards' },
      ).finished);
      Promise.all(outs).then(() => {
        leaving.forEach((el) => { el.hidden = true; el.getAnimations().forEach((a) => a.cancel()); });
        items.forEach((el) => { if (match(el, f)) el.hidden = false; });
       
        let k = 0;
        const anims = [];
        items.forEach((el) => {
          if (el.hidden) return;
          const last = el.getBoundingClientRect();
          const f0 = first.get(el);
          if (f0) {
            const dx = f0.left - last.left, dy = f0.top - last.top;
            if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
              anims.push(el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }],
                { duration: 560, easing: 'cubic-bezier(0.77, 0, 0.175, 1)' }).finished);
            }
          } else {
            anims.push(el.animate([{ opacity: 0, transform: 'translateY(18px) scale(0.97)' }, { opacity: 1, transform: 'none' }],
              { duration: 520, delay: 140 + k * 55, easing: 'cubic-bezier(0.23, 1, 0.32, 1)', fill: 'backwards' }).finished);
            k++;
          }
        });
        refreshST();
        return Promise.all(anims);
      }).catch(() => {}).finally(() => {
        busy = false;
        if (queued !== null) { const q = queued; queued = null; apply(q); }
      });
    }
    btns.forEach((b) => b.addEventListener('click', () => apply(b.dataset.filter)));
    // Toolbar: Pfeiltasten bewegen den Fokus (Roving Tabindex)
    fbar.addEventListener('keydown', (e) => {
      const i = btns.indexOf(d.activeElement);
      if (i < 0) return;
      let n = -1;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % btns.length;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i - 1 + btns.length) % btns.length;
      else if (e.key === 'Home') n = 0;
      else if (e.key === 'End') n = btns.length - 1;
      if (n < 0) return;
      e.preventDefault();
      btns.forEach((b, k) => { b.tabIndex = k === n ? 0 : -1; });
      btns[n].focus();
    });
  }
  });

  /* ---------------------------------------------------------------------
     14 · Scroll-Choreografie (GSAP, ohne Pins – sticky + Scrub)
     --------------------------------------------------------------------- */
  const flowSec = $('[data-flow-section]');
  const flowLine = $('[data-flow-line]');
  const flowSteps = $$('[data-flow-step]');
  function flowStops(vertical) {
    const track = $('.flow__track');
    const tr = track.getBoundingClientRect();
    return flowSteps.map((s) => {
      const n = $('.step__k', s).getBoundingClientRect();
      return vertical ? (n.top + n.height / 2 - tr.top) / tr.height : (n.left + n.width / 2 - tr.left) / tr.width;
    });
  }
  function renderFlow(p, stops, vertical) {
    flowLine.style.transform = vertical ? `scaleY(${p})` : `scaleX(${p})`;
    flowSteps.forEach((s, i) => s.classList.toggle('is-on', p >= stops[i] - 0.002));
  }

  later(() => {
    if (hasGsap && MOTION) {
      const { gsap, ScrollTrigger } = w;
      const mm = gsap.matchMedia();

      // Hero: Abgänge werden beim Scrollen der Reihe nach eingeschaltet (sticky Bühne)
      mm.add('(min-width: 900px)', () => {
        scrubHero = ScrollTrigger.create({
          trigger: hero, start: 'top top', end: 'bottom bottom',
          onUpdate: (st) => heroScrub(st.progress),
        });
        return () => { scrubHero.kill(); scrubHero = null; };
      });

      // Sonnenbahn: Sonne wandert mit dem Scroll von Ost nach West
      ScrollTrigger.create({ trigger: '[data-sky]', start: 'top 85%', end: 'bottom 10%', onUpdate: (st) => sky.scrub(st.progress) });

      // Ablauf: Schützkette – Kontakte schließen nacheinander (Desktop: sticky Bühne)
      if (flowSec && flowLine) {
        mm.add('(min-width: 900px) and (min-height: 680px)', () => {
          const proxy = { p: 0 };
          let stops = flowStops(false);
          const tw = gsap.to(proxy, {
            p: 1, ease: 'none',
            scrollTrigger: { trigger: flowSec, start: 'top top', end: 'bottom bottom', scrub: 0.5, onRefresh: () => { stops = flowStops(false); } },
            onUpdate: () => renderFlow(proxy.p, stops, false),
          });
          return () => { tw.scrollTrigger && tw.scrollTrigger.kill(); tw.kill(); };
        });
        mm.add('(min-width: 900px) and (max-height: 679px)', () => {
          const proxy = { p: 0 };
          let stops = flowStops(false);
          gsap.to(proxy, {
            p: 1, ease: 'none',
            scrollTrigger: { trigger: '.flow__track', start: 'top 80%', end: 'bottom 45%', scrub: 0.5, onRefresh: () => { stops = flowStops(false); } },
            onUpdate: () => renderFlow(proxy.p, stops, false),
          });
        });
        mm.add('(max-width: 899px)', () => {
          const proxy = { p: 0 };
          let stops = flowStops(true);
          gsap.to(proxy, {
            p: 1, ease: 'none',
            scrollTrigger: { trigger: '.flow__track', start: 'top 72%', end: 'bottom 55%', scrub: 0.5, onRefresh: () => { stops = flowStops(true); } },
            onUpdate: () => renderFlow(proxy.p, stops, true),
          });
        });
      }

      // Prüfstempel dreht sich beim Durchscrollen ein Stück (wie aufgedrückt)
      gsap.fromTo('[data-stamp]', { rotate: -24, scale: 1.06 }, { rotate: 6, scale: 1, ease: 'none', scrollTrigger: { trigger: '.voices', start: 'top bottom', end: 'bottom top', scrub: 0.6 } });
      // Notdienst-Foto: langsamer Zoom
      const sosImg = $('[data-sos-img]');
      if (sosImg) gsap.fromTo(sosImg, { scale: 1.12 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.sos', start: 'top bottom', end: 'bottom top', scrub: true } });
      // Über uns: Detailfoto schiebt sich gegen das Hauptfoto
      mm.add('(min-width: 900px)', () => {
        gsap.fromTo('.about__detail', { y: 70 }, { y: -30, ease: 'none', scrollTrigger: { trigger: '.about__grid', start: 'top bottom', end: 'bottom top', scrub: true } });
      });

      if (d.fonts && d.fonts.ready) d.fonts.ready.then(refreshST);
      w.addEventListener('load', refreshST);
    } else {
      root.classList.add('no-flow-anim');
      flowSteps.forEach((s) => s.classList.add('is-on'));
      sky.scrub(0.5);
    }
  });

  // Karte + Fußzeile: Animationen nur im Sichtbereich
  later(() => {
    const map = $('.map');
    const word = $('.ftr__word');
    if (!('IntersectionObserver' in w)) { if (word) word.classList.add('is-on'); return; }
    if (map) new IntersectionObserver((en) => map.classList.toggle('is-live', en[0].isIntersecting)).observe(map);
    if (word) new IntersectionObserver((en) => { if (en[0].isIntersecting) word.classList.add('is-on'); }, { threshold: 0.4 }).observe(word);
  });

  later(() => {
  /* ---------------------------------------------------------------------
     15 · Einzugsgebiet: Orte hervorheben
     --------------------------------------------------------------------- */
  const TOWNS = {
    markkleeberg: { name: 'Markkleeberg', km: 7, min: 15 },
    taucha: { name: 'Taucha', km: 10, min: 20 },
    markranstaedt: { name: 'Markranstädt', km: 11, min: 20 },
    schkeuditz: { name: 'Schkeuditz', km: 12, min: 25 },
    delitzsch: { name: 'Delitzsch', km: 21, min: 30 },
    wurzen: { name: 'Wurzen', km: 26, min: 35 },
    borna: { name: 'Borna', km: 26, min: 35 },
    grimma: { name: 'Grimma', km: 27, min: 35 },
  };
  const townBtns = $$('[data-town]');
  const townInfo = $('[data-town-info]');
  const defaultTownInfo = townInfo ? townInfo.textContent : '';
  let townSel = null;
  function highlightTown(key) {
    $$('.map__traces path').forEach((p) => p.classList.toggle('is-on', p.dataset.trace === key));
    $$('.map__towns g').forEach((g) => g.classList.toggle('is-on', g.dataset.node === key));
  }
  townBtns.forEach((b) => {
    b.addEventListener('click', () => {
      const key = b.dataset.town;
      townSel = townSel === key ? null : key;
      townBtns.forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.town === townSel)));
      highlightTown(townSel);
      if (townSel) {
        const t = TOWNS[townSel];
        townInfo.textContent = `${t.name}: ca. ${t.km} km Luftlinie · Anfahrt meist ${t.min}–${t.min + 15} min · Notdienst, Montage und Wartung`;
      } else townInfo.textContent = defaultTownInfo;
    });
    if (FINE) {
      b.addEventListener('pointerenter', () => highlightTown(b.dataset.town));
      b.addEventListener('pointerleave', () => highlightTown(townSel));
    }
  });
  });

  /* ---------------------------------------------------------------------
     Formular-Helfer
     --------------------------------------------------------------------- */
  function setError(field, errEl, on) {
    if (errEl) errEl.hidden = !on;
    if (!field) return;
    if (on) {
      field.setAttribute('aria-invalid', 'true');
      if (errEl && errEl.id) {
        const ids = (field.getAttribute('aria-describedby') || '').split(' ').filter(Boolean);
        if (!ids.includes(errEl.id)) field.setAttribute('aria-describedby', ids.concat(errEl.id).join(' '));
      }
    } else field.removeAttribute('aria-invalid');
  }
  const digits = (s) => (s.match(/\d/g) || []).length;
  function fillSummary(dl, rows) {
    dl.textContent = '';
    rows.filter(([, v]) => v && String(v).trim()).forEach(([k, v]) => {
      const row = d.createElement('div');
      const dt = d.createElement('dt');
      const dd = d.createElement('dd');
      dt.textContent = k;
      dd.textContent = String(v).trim();
      row.append(dt, dd);
      dl.appendChild(row);
    });
  }

  later(() => {
  /* ---------------------------------------------------------------------
     16 · Kurzbewerbung
     --------------------------------------------------------------------- */
  const apForm = $('[data-apply-form]');
  if (apForm) {
    const f = {
      job: $('#ap-job'), name: $('#ap-name'), phone: $('#ap-phone'), level: $('#ap-level'),
    };
    const err = { job: $('#ap-job-err'), name: $('#ap-name-err'), phone: $('#ap-phone-err'), level: $('#ap-level-err') };
    const bar = $('[data-apply-bar]');
    const cnt = $('[data-apply-count]');
    const body = $('[data-apply-body]');
    const done = $('[data-apply-done]');
    const valid = {
      job: () => !!f.job.value,
      name: () => f.name.value.trim().length >= 2,
      phone: () => digits(f.phone.value) >= 6,
      level: () => !!f.level.value,
    };
    const meter = () => {
      const n = Object.keys(valid).filter((k) => valid[k]()).length;
      bar.style.transform = `scaleX(${n / 4})`;
      cnt.textContent = `${n} von 4`;
    };
    Object.keys(f).forEach((k) => {
      f[k].addEventListener('input', () => { meter(); if (valid[k]()) setError(f[k], err[k], false); });
      f[k].addEventListener('change', () => { meter(); if (valid[k]()) setError(f[k], err[k], false); });
    });
    $$('[data-apply]').forEach((b) => b.addEventListener('click', () => {
      if (!done.hidden) $('[data-apply-reset]').click();
      f.job.value = b.dataset.apply;
      setError(f.job, err.job, false);
      meter();
      scrollToEl(apForm, () => f.name.focus({ preventScroll: true }));
    }));
    apForm.addEventListener('submit', (e) => {
      e.preventDefault();
      let first = null;
      Object.keys(valid).forEach((k) => {
        const ok = valid[k]();
        setError(f[k], err[k], !ok);
        if (!ok && !first) first = f[k];
      });
      if (first) { first.focus(); return; }
      fillSummary($('[data-apply-summary]'), [
        ['Stelle', f.job.options[f.job.selectedIndex].text],
        ['Name', f.name.value],
        ['Telefon', f.phone.value],
        ['Stand', f.level.value],
      ]);
      body.hidden = true;
      done.hidden = false;
      done.focus();
      refreshST();
    });
    $('[data-apply-reset]').addEventListener('click', () => {
      apForm.reset();
      Object.keys(f).forEach((k) => setError(f[k], err[k], false));
      done.hidden = true;
      body.hidden = false;
      meter();
      f.job.focus();
      refreshST();
    });
    meter();
  }
  });

  later(() => {
  /* ---------------------------------------------------------------------
     17 · Anfrage-Assistent (4 Schritte)
     --------------------------------------------------------------------- */
  wizard = (() => {
    const form = $('[data-wiz]');
    const api = { preselect() {}, fromPV() {} };
    if (!form) return api;
    const steps = $$('.wiz__step', form);
    const prog = $$('.wiz__prog li', form);
    const bar = $('[data-wiz-bar]', form);
    const live = $('[data-wiz-live]', form);
    const back = $('[data-wiz-back]', form);
    const next = $('[data-wiz-next]', form);
    const nav = $('[data-wiz-nav]', form);
    const panels = $('[data-wiz-panels]', form);
    const done = $('[data-wiz-done]', form);
    const chip = $('[data-pv-chip]', form);
    const chipText = $('[data-pv-chip-text]', form);
    const sosBox = $('[data-wiz-sos]', form);
    const TITLES = ['Anliegen', 'Objekt und Details', 'Termin', 'Kontakt'];
    let step = 1;
    let pvSummary = '';

    // Datum: frühestens morgen
    const dateInp = $('#wz-date');
    const tomorrow = new Date(Date.now() + 86400000);
    const iso = (dt) => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    dateInp.min = iso(tomorrow);

    const nextHTML = next.innerHTML;
    function go(n, dir) {
      const cur = steps[step - 1];
      const nxt = steps[n - 1];
      cur.hidden = true;
      nxt.hidden = false;
      nxt.classList.remove('is-entering', 'is-entering-back');
      void nxt.offsetWidth;
      nxt.classList.add(dir < 0 ? 'is-entering-back' : 'is-entering');
      step = n;
      prog.forEach((li, i) => {
        li.classList.toggle('is-current', i === n - 1);
        li.classList.toggle('is-done', i < n - 1);
      });
      bar.style.transform = `scaleX(${n / 4})`;
      back.hidden = n === 1;
      if (n === 4) next.textContent = 'Anfrage absenden'; else next.innerHTML = nextHTML;
      live.textContent = `Schritt ${n} von 4: ${TITLES[n - 1]}`;
      nxt.setAttribute('tabindex', '-1');
      nxt.focus({ preventScroll: true });
      const top = form.getBoundingClientRect().top;
      if (top < headerOffset()) scrollToEl(form);
      refreshST();
    }

    const anliegen = $$('input[name="anliegen"]', form);
    const updSos = () => { sosBox.hidden = !anliegen.some((c) => c.checked && c.dataset.key === 'notfall'); };
    anliegen.forEach((c) => c.addEventListener('change', () => { updSos(); if (anliegen.some((x) => x.checked)) setError(null, $('#wiz-s1-err'), false); }));

    const radioGroup = (name) => form.querySelector(`input[name="${name}"]`).closest('[role="radiogroup"]');
    function validate(n) {
      let first = null;
      const fail = (field, errEl, focusEl) => { setError(field, errEl, true); if (!first) first = focusEl || field; };
      if (n === 1) {
        const ok = anliegen.some((c) => c.checked);
        setError(null, $('#wiz-s1-err'), !ok);
        if (!ok) first = anliegen[0];
      }
      if (n === 2) {
        const obj = form.querySelector('input[name="objekt"]:checked');
        const grp = radioGroup('objekt');
        if (!obj) fail(grp, $('#obj-err'), form.querySelector('input[name="objekt"]')); else setError(grp, $('#obj-err'), false);
        const plz = $('#wz-plz');
        if (!/^\d{5}$/.test(plz.value.trim())) fail(plz, $('#wz-plz-err')); else setError(plz, $('#wz-plz-err'), false);
      }
      if (n === 3) {
        const u = form.querySelector('input[name="dringlichkeit"]:checked');
        const grp = radioGroup('dringlichkeit');
        if (!u) fail(grp, $('#urg-err'), form.querySelector('input[name="dringlichkeit"]')); else setError(grp, $('#urg-err'), false);
        if (dateInp.value && dateInp.value < dateInp.min) fail(dateInp, $('#wz-date-err')); else setError(dateInp, $('#wz-date-err'), false);
      }
      if (n === 4) {
        const nm = $('#wz-name'), ph = $('#wz-phone'), ml = $('#wz-mail'), ds = form.querySelector('input[name="datenschutz"]');
        if (nm.value.trim().length < 2) fail(nm, $('#wz-name-err')); else setError(nm, $('#wz-name-err'), false);
        if (digits(ph.value) < 6) fail(ph, $('#wz-phone-err')); else setError(ph, $('#wz-phone-err'), false);
        if (ml.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(ml.value.trim())) fail(ml, $('#wz-mail-err')); else setError(ml, $('#wz-mail-err'), false);
        if (!ds.checked) fail(ds, $('#wz-dsg-err')); else setError(ds, $('#wz-dsg-err'), false);
      }
      if (first) first.focus();
      return !first;
    }
    // Fehler beim Korrigieren entfernen
    form.addEventListener('input', (e) => {
      const t = e.target;
      if (t.getAttribute('aria-invalid') === 'true') {
        const errId = (t.getAttribute('aria-describedby') || '').split(' ').find((id) => id.endsWith('-err'));
        if (errId) setError(t, $(`#${errId}`), false);
      }
    });
    form.addEventListener('change', (e) => {
      const t = e.target;
      if (t.type === 'radio') {
        const grp = t.closest('[role="radiogroup"]');
        if (grp && grp.getAttribute('aria-invalid') === 'true') {
          const errId = (grp.getAttribute('aria-describedby') || '').split(' ').find((id) => id.endsWith('-err'));
          setError(grp, errId ? $(`#${errId}`) : null, false);
        }
      }
      if (t.name === 'datenschutz' && t.checked) setError(t, $('#wz-dsg-err'), false);
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validate(step)) return;
      if (step < 4) { go(step + 1, 1); return; }
      finish();
    });
    back.addEventListener('click', () => { if (step > 1) go(step - 1, -1); });

    const val = (name) => { const el = form.querySelector(`[name="${name}"]`); return el ? el.value : ''; };
    const checked = (name) => { const el = form.querySelector(`input[name="${name}"]:checked`); return el ? el.value : ''; };
    function finish() {
      const date = dateInp.value ? new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(`${dateInp.value}T12:00:00`)) : '';
      fillSummary($('[data-wiz-summary]', form), [
        ['Anliegen', anliegen.filter((c) => c.checked).map((c) => c.value).join(', ')],
        ['PV-Schätzung', pvSummary],
        ['Objekt', checked('objekt')],
        ['Baujahr', val('baujahr')],
        ['PLZ', val('plz')],
        ['Nachricht', val('nachricht')],
        ['Dringlichkeit', checked('dringlichkeit')],
        ['Wunschtermin', date || 'kein fester Termin'],
        ['Zeitfenster', val('zeitfenster')],
        ['Name', val('name')],
        ['Telefon', val('telefon')],
        ['E-Mail', val('email')],
      ]);
      panels.hidden = true;
      nav.hidden = true;
      prog.forEach((li) => { li.classList.remove('is-current'); li.classList.add('is-done'); });
      bar.style.transform = 'scaleX(1)';
      done.hidden = false;
      live.textContent = 'Anfrage vollständig. Demo – es wurde nichts gesendet.';
      done.focus();
      refreshST();
    }
    function reset() {
      form.reset();
      $$('[aria-invalid]', form).forEach((x) => x.removeAttribute('aria-invalid'));
      $$('.field__err', form).forEach((x) => { x.hidden = true; });
      pvSummary = '';
      chip.hidden = true;
      updSos();
      done.hidden = true;
      panels.hidden = false;
      nav.hidden = false;
      steps.forEach((s, i) => { s.hidden = i !== 0; });
      step = 2;
      go(1, -1);
    }
    $('[data-wiz-reset]', form).addEventListener('click', reset);
    $('[data-pv-chip-remove]', form).addEventListener('click', () => {
      pvSummary = '';
      chip.hidden = true;
      live.textContent = 'PV-Schätzung entfernt';
      const first = form.querySelector('input[name="objekt"]');
      if (first) first.focus();
    });

    api.preselect = (key) => {
      if (!done.hidden) reset();
      const c = anliegen.find((x) => x.dataset.key === key);
      if (c) { c.checked = true; updSos(); setError(null, $('#wiz-s1-err'), false); }
      if (step !== 1) go(1, -1);
    };
    api.fromPV = (summary) => {
      if (!done.hidden) reset();
      pvSummary = summary;
      chipText.textContent = summary;
      chip.hidden = false;
      const c = anliegen.find((x) => x.dataset.key === 'pv');
      if (c) c.checked = true;
      setError(null, $('#wiz-s1-err'), false);
      const obj = form.querySelector('input[name="objekt"][value="Einfamilienhaus"]');
      if (obj && !form.querySelector('input[name="objekt"]:checked')) obj.checked = true;
      if (step !== 2) go(2, 1);
      live.textContent = 'PV-Schätzung übernommen. Schritt 2 von 4: Objekt und Details';
    };
    return api;
  })();
  });

  // Häppchenweise starten (je ein Modul pro Task), danach einmal ScrollTrigger messen
  const runQueue = () => {
    const fn = queue.shift();
    if (fn) { try { fn(); } catch (err) { if (w.console) console.warn(err); } }
    if (queue.length) setTimeout(runQueue, 16);
    else {
      w.__funkeReady = true;
      refreshST();
      updDusk();
    }
  };
  raf(() => setTimeout(runQueue, 30));
})();
