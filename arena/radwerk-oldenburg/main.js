/* Radwerk Oldenburg – Modell „Kette“
   Motion-Handschrift „Treten & Rollen“: Scroll und Zeiger geben Schwung, alles rollt mit Reibung aus.
   Start in Etappen: Header + Hero sofort, alles darunter häppchenweise im Leerlauf. */
(() => {
  'use strict';

  /* ================= Konstanten (hier anpassen) ================= */

  // Hero: Raddrehung je gescrolltem Pixel, Übersetzung, Ausroll-Reibung, Radumfang für Tacho/ODO
  const HERO = { degPerPx: 0.42, ringTeeth: 38, sprocketTeeth: 16, ringRadius: 34, coast: 0.075, wheelM: 2.2, introSpin: 520, pointerGain: 0.55 };

  // Rahmengrößen-Rechner: Faustformeln Schrittlänge × Faktor (City/Trekking/E-Bike/Gravel in cm, MTB in Zoll)
  const FRAME = {
    saddleFactor: 0.885, // Sattelhöhe (Mitte Tretlager – Oberkante Sattel) = Schrittlänge × 0,885
    types: {
      city:   { label: 'City / Trekking', factor: 0.66,  unit: 'cm', sizes: [[0, 'XS'], [46, 'S'], [51, 'M'], [56, 'L'], [61, 'XL']], geo: { stack0: 570, stackK: 1.0, reach0: 365, reachK: 0.45, barFwd: -45, barRise: 95, wheel: 350, drop: 70, head: 150, torso: 72 } },
      ebike:  { label: 'E-Bike',          factor: 0.66,  unit: 'cm', sizes: [[0, 'XS'], [46, 'S'], [51, 'M'], [56, 'L'], [61, 'XL']], geo: { stack0: 590, stackK: 1.0, reach0: 380, reachK: 0.45, barFwd: -30, barRise: 80, wheel: 350, drop: 70, head: 165, torso: 66 } },
      gravel: { label: 'Gravel / Renn',   factor: 0.665, unit: 'cm', sizes: [[0, 'XS'], [49, 'S'], [52, 'M'], [56, 'L'], [59, 'XL']], geo: { stack0: 545, stackK: 1.1, reach0: 378, reachK: 0.6,  barFwd: 75,  barRise: 15, wheel: 345, drop: 72, head: 125, torso: 44 } },
      mtb:    { label: 'MTB',             factor: 0.226, unit: '″',  sizes: [[0, 'XS'], [15, 'S'], [16.5, 'M'], [18.5, 'L'], [20.5, 'XL']], geo: { stack0: 600, stackK: 0.6, reach0: 425, reachK: 1.2,  barFwd: 10,  barRise: 30, wheel: 370, drop: 45, head: 110, torso: 54 } }
    },
    proportion: { long: 0.49, short: 0.44, implausibleHigh: 0.54, implausibleLow: 0.39 }
  };

  // E-Bike-Reichweite: Verbrauch in Wh/km bei 85 kg, flach, 20 °C (Durchschnittswerte)
  const RANGE = {
    usable: 0.9,                                        // nutzbarer Anteil der Nennkapazität
    base: { eco: 5.2, tour: 7.8, sport: 10.8, turbo: 15.5 },
    terrain: { flat: 1, rolling: 1.18, hilly: 1.42 },
    weightRef: 85, weightPerKg: 0.0045,                 // +0,45 % Verbrauch je kg über 85 kg
    tempRef: 20, coldLossPerDeg: 0.011, heatFrom: 30, heatLossPerDeg: 0.004,
    spread: [0.88, 1.12],                               // Spanne um den Mittelwert
    mapPxPerKm: 2.6, mapBaseR: 100                      // Karte: Pixel je km Luftlinie, Grundradius der Kreise
  };

  // Werkstatt-Termin
  const BOOKING = {
    days: 12,                                           // buchbare Werktage ab morgen
    slots: ['10:00', '11:30', '13:00', '15:00', '17:00'],
    saturdaySlots: ['10:00', '11:30', '13:00'],
    closedWeekdays: [0]                                 // 0 = Sonntag
  };

  // Anfahrt-Karte: Länge der Strecke Hbf → Laden und Fahrzeit
  const ROUTE = { km: 0.8, minutes: 3, zoom: 1.9 };

  // Öffnungszeiten für „Jetzt geöffnet“
  const HOURS = { 1: [10, 19], 2: [10, 19], 3: [10, 19], 4: [10, 19], 5: [10, 19], 6: [10, 16] };

  /* ================= Hilfen ================= */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const MOTION = root.classList.contains('motion');
  const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const eur = n => n.toLocaleString('de-DE') + ' €';
  const fmt = (n, d = 0) => n.toLocaleString('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d });
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const idle = window.requestIdleCallback ? cb => requestIdleCallback(cb, { timeout: 300 }) : cb => setTimeout(cb, 16);
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const onceInView = (nodes, cb, opts = { rootMargin: '0px 0px -10% 0px' }) => {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); cb(e.target); } }), opts);
    nodes.forEach(n => io.observe(n));
  };

  /* ================= Etappe 1: Header ================= */
  function initHeader() {
    const header = $('.site-header');
    const bar = $('.progress span');
    const btn = $('.menu-btn');
    const nav = $('#nav');
    let ticking = false;
    const update = () => {
      ticking = false;
      const y = window.scrollY;
      header.classList.toggle('is-scrolled', y > 8);
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    requestAnimationFrame(() => setTimeout(update, 0));

    const close = (focusBtn) => {
      btn.setAttribute('aria-expanded', 'false');
      nav.classList.remove('is-open');
      if (focusBtn) btn.focus();
    };
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
      if (open) setTimeout(() => $('a', nav).focus(), 30);
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('is-open')) close(true); });
    $$('a', nav).forEach(a => a.addEventListener('click', () => close(false)));
    document.addEventListener('click', e => { if (nav.classList.contains('is-open') && !nav.contains(e.target) && !btn.contains(e.target)) close(false); });
  }

  /* ================= Etappe 1: Hero „Ausfahrt“ – Räder, Kette, Tacho, Fahrtwind ================= */
  function initHero() {
    const hero = $('.hero');
    const wr = $('#wheel-r'), wf = $('#wheel-f'), crank = $('#crank'), chain = $('.bike .chain');
    const ring = $('.pk-ring'), lines = $$('.hero .ht');
    const tSpeed = $('.t-speed'), tOdo = $('.t-odo');
    const canvas = $('.hero-wind');
    if (!hero || !wr || !MOTION) return;
    const ratio = HERO.ringTeeth / HERO.sprocketTeeth;
    let pedal = HERO.introSpin, target = 0, cur = 0, vel = 0, shownSpeed = 0, raf = 0, visible = true;

    // Fahrtwind: Striche, die bei Tempo länger und schneller werden
    const ctx = canvas.getContext('2d');
    let W = 0, H = 0, dpr = 1, streaks = [], wind = 1;
    const seed = n => { let s = n; return () => (s = (s * 16807) % 2147483647) / 2147483647; };
    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = hero.clientWidth; H = hero.clientHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const r = seed(7), n = W < 700 ? 22 : 44;
      streaks = Array.from({ length: n }, (_, i) => ({ x: r() * W, y: (0.12 + r() * 0.82) * H, len: 30 + r() * 140, sp: 0.5 + r() * 1.2, a: 0.05 + r() * 0.16, sig: i % 9 === 0, w: r() < 0.2 ? 2 : 1 }));
      draw(0);
    };
    const draw = v => {
      ctx.clearRect(0, 0, W, H);
      for (const s of streaks) {
        const L = s.len * (0.35 + Math.min(3, v * 0.5));
        ctx.strokeStyle = s.sig ? `rgba(0,194,168,${Math.min(0.55, s.a * 2.4)})` : `rgba(242,241,236,${s.a})`;
        ctx.lineWidth = s.w;
        ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x + L, s.y); ctx.stroke();
      }
    };
    const moveWind = v => {
      for (const s of streaks) { s.x -= (0.15 + v * 2.2) * s.sp; if (s.x + s.len * 3 < 0) { s.x = W + Math.random() * 120; } }
    };

    const apply = () => {
      const c = cur / ratio;
      wr.style.transform = `rotate(${cur.toFixed(2)}deg)`;
      wf.style.transform = `rotate(${cur.toFixed(2)}deg)`;
      crank.style.transform = `rotate(${c.toFixed(2)}deg)`;
      chain.style.strokeDashoffset = (-(c * Math.PI / 180) * HERO.ringRadius).toFixed(2);
      if (ring) ring.style.transform = `rotate(${(-cur * 0.12).toFixed(2)}deg)`;
      const lean = clamp(vel * 0.9, 0, 9);
      lines.forEach(l => { l.style.transform = lean > 0.05 ? `skewX(${(-lean).toFixed(2)}deg)` : ''; });
      const kmh = clamp(vel * 60 / 360 * HERO.wheelM * 3.6, 0, 59.9);
      shownSpeed += (kmh - shownSpeed) * 0.2;
      tSpeed.textContent = fmt(shownSpeed, 1).padStart(4, '0');
      tOdo.textContent = fmt(Math.abs(cur) / 360 * HERO.wheelM / 1000, 3);
    };
    const tick = () => {
      raf = 0;
      if (!visible || document.hidden) return;
      target = window.scrollY * HERO.degPerPx + pedal;
      const prev = cur;
      const d = target - cur;
      cur = Math.abs(d) < 0.04 ? target : cur + d * HERO.coast;
      vel = cur - prev;
      wind = Math.max(Math.abs(vel), wind * 0.94);
      apply();
      moveWind(wind); draw(wind);
      if (cur !== target || wind > 0.02 || shownSpeed > 0.05) raf = requestAnimationFrame(tick);
    };
    const kick = () => { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(tick); };
    addEventListener('scroll', kick, { passive: true });
    document.addEventListener('visibilitychange', kick);
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; kick(); }).observe(hero);
    // Kurbeln mit dem Zeiger: horizontale Bewegung tritt in die Pedale
    if (FINE) {
      let lx = null;
      hero.addEventListener('pointermove', e => { if (lx !== null) pedal += Math.abs(e.clientX - lx) * HERO.pointerGain; lx = e.clientX; kick(); }, { passive: true });
      hero.addEventListener('pointerleave', () => { lx = null; });
    }
    // Maße erst nach dem ersten Frame lesen – kein erzwungenes Layout beim Start
    requestAnimationFrame(() => setTimeout(() => {
      if ('ResizeObserver' in window) new ResizeObserver(() => resize()).observe(hero); else resize();
      kick();
    }, 0));
  }

  /* ================= Etappe 2: Lenis + GSAP ================= */
  let lenis = null;
  const ST = () => MOTION && window.gsap && window.ScrollTrigger;
  function initSmooth() {
    if (!ST()) return;
    gsap.registerPlugin(ScrollTrigger);
    if (window.Lenis) {
      lenis = new Lenis({ lerp: 0.12, smoothWheel: true });
      window.__lenis = lenis;
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(t => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }
  }
  function initAnchors() {
    $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const t = document.getElementById(id.slice(1));
      if (!t) return;
      if (lenis) { e.preventDefault(); lenis.scrollTo(t, { offset: id === '#inhalt' ? 0 : -8, duration: 1.2 }); history.replaceState(null, '', id); }
      if (id === '#inhalt') { t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: !!lenis }); }
    }));
  }

  /* ================= Tempo: Laufband reagiert auf Scroll-Geschwindigkeit ================= */
  function initTempo() {
    const band = $('.laufband');
    if (!band || !MOTION || !band.getAnimations) return;
    const anims = () => band.getAnimations({ subtree: true });
    let lastY = scrollY, lastT = performance.now(), v = 0, raf = 0, inView = true;
    const loop = () => {
      raf = 0;
      v *= 0.92;
      const dir = v < 0 ? -1 : 1;
      const rate = dir * (1 + Math.min(7, Math.abs(v) * 2.6));
      anims().forEach(a => { a.playbackRate = rate; });
      if (Math.abs(v) > 0.01) raf = requestAnimationFrame(loop);
      else anims().forEach(a => { a.playbackRate = 1; });
    };
    addEventListener('scroll', () => {
      const now = performance.now(), y = scrollY;
      const inst = (y - lastY) / Math.max(8, now - lastT);
      lastY = y; lastT = now;
      v = v * 0.6 + inst * 0.4;
      if (inView && !raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
    new IntersectionObserver(([e]) => { inView = e.isIntersecting; anims().forEach(a => (inView ? a.play() : a.pause())); }).observe(band);
  }

  /* ================= Sortiment: Vorbeifahrt (sticky + Scrub, Tiefen-Parallax) ================= */
  function initRaeder() {
    const sec = $('.raeder'), track = $('.raeder-track'), vp = $('.raeder-viewport');
    const count = $('.raeder-count b');
    const cards = $$('.typ', track);
    const ghost = $('.raeder-ghost span');
    if (!sec) return;
    if (!ST()) return;
    const mm = gsap.matchMedia();
    mm.add('(min-width: 900px) and (min-height: 600px)', () => {
      sec.classList.add('is-strecke');
      const dist = () => {
        const pad = parseFloat(getComputedStyle(vp).paddingLeft) || 0;
        return Math.max(0, track.scrollWidth - (vp.clientWidth - pad * 2));
      };
      const setH = () => { sec.style.height = (innerHeight + dist()) + 'px'; };
      setH();
      ScrollTrigger.addEventListener('refreshInit', setH);
      const tw = gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: {
          trigger: sec, start: 'top top', end: () => '+=' + dist(), scrub: 0.6, invalidateOnRefresh: true,
          onUpdate: self => {
            const n = Math.min(cards.length, 1 + Math.round(self.progress * (cards.length - 1)));
            count.textContent = String(n).padStart(2, '0');
            if (ghost) ghost.style.transform = `translateX(${(-self.progress * dist() * 0.32).toFixed(1)}px)`;
          }
        }
      });
      // Tiefe: Bild im Rahmen gegenläufig, große Nummer langsamer als die Karte
      const tws = [];
      cards.forEach(card => {
        const img = $('.ph img', card), no = $('.typ-no', card);
        const st = { trigger: card, containerAnimation: tw, start: 'left right', end: 'right left', scrub: true };
        if (img) tws.push(gsap.fromTo(img, { xPercent: -6 }, { xPercent: 6, ease: 'none', scrollTrigger: st }));
        if (no) tws.push(gsap.fromTo(no, { x: 90 }, { x: -60, ease: 'none', scrollTrigger: { ...st } }));
      });
      return () => { sec.classList.remove('is-strecke'); ScrollTrigger.removeEventListener('refreshInit', setH); sec.style.height = ''; tws.forEach(t => t.kill()); tw.kill(); gsap.set(track, { clearProps: 'transform' }); if (ghost) ghost.style.transform = ''; };
    });
    mm.add('(max-width: 899px), (max-height: 599px)', () => {
      const onS = () => { const w = cards[0].getBoundingClientRect().width + 22; count.textContent = String(Math.min(cards.length, 1 + Math.round(vp.scrollLeft / w))).padStart(2, '0'); };
      vp.addEventListener('scroll', onS, { passive: true });
      onceInView([track], t => t.classList.add('is-in'));
      return () => vp.removeEventListener('scroll', onS);
    });
  }

  /* ================= Werkstatt: Satz setzt sich aus Fragmenten zusammen, Seite wechselt die Farbe ================= */
  function initWerkstatt() {
    const stage = $('.werk-stage'), sticky = $('.werk-sticky'), h = $('[data-assemble]'), ringSvg = $('.werk-ring');
    if (!stage || !h || !ST()) return;
    // Text zerlegen: Klartext für Screenreader, Zeichen-Spans nur visuell
    const text = h.textContent.replace(/\s+/g, ' ').trim();
    const sr = el('span', 'sr-only', text);
    const vis = el('span'); vis.setAttribute('aria-hidden', 'true');
    const r = (() => { let s = 11; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
    const chars = [];
    text.split(' ').forEach((word, wi, arr) => {
      const w = el('span', 'w' + (/[0-9€]/.test(word) ? ' hl' : ''));
      [...word].forEach(ch => {
        const c = el('span', 'c', ch);
        c._o = { x: (r() - 0.5) * 220, y: (r() - 0.5) * 160, rot: (r() - 0.5) * 80 };
        chars.push(c); w.append(c);
      });
      vis.append(w);
      if (wi < arr.length - 1) vis.append(document.createTextNode(' '));
    });
    h.replaceChildren(sr, vis);
    const n = chars.length;
    let lastFlip = null;
    const render = p => {
      const tTop = innerHeight / stage.offsetHeight;          // Fortschritt, an dem die Bühne oben ankommt
      const a = clamp(p / (tTop * 0.9));                         // Montage-Phase
      chars.forEach((c, i) => {
        const k = easeOut(clamp((a - (i / n) * 0.45) / 0.55));
        const o = c._o, q = 1 - k;
        c.style.transform = q < 0.002 ? '' : `translate(${(o.x * q).toFixed(1)}px, ${(o.y * q).toFixed(1)}px) rotate(${(o.rot * q).toFixed(1)}deg)`;
        c.style.opacity = (0.15 + 0.85 * k).toFixed(3);
      });
      const flip = p > tTop + (1 - tTop) * 0.3;
      if (flip !== lastFlip) { sticky.classList.toggle('is-chalk', flip); lastFlip = flip; }
      if (ringSvg) ringSvg.style.transform = `rotate(${(p * 220).toFixed(1)}deg)`;
    };
    ScrollTrigger.create({ trigger: stage, start: 'top bottom', end: 'bottom bottom', scrub: 0.4, onUpdate: s => render(s.progress), onRefresh: s => render(s.progress) });
    render(0);
  }

  /* ================= Kleinteile: Überschriften, Bilder, Listen ================= */
  function initReveal() {
    if (!MOTION) return;
    const heads = $$('main h2').filter(x => !x.closest('.hero, .werkstatt .werk-sticky, .raeder-sticky'));
    heads.forEach(x => x.setAttribute('data-ride', ''));
    $$('.crew-row').forEach((x, i) => x.style.setProperty('--i', i));
    $$('.price-table tbody tr').forEach((x, i) => x.style.setProperty('--i', i));
    onceInView([...heads, ...$$('[data-wipe], .crew, .price-table, .quote')], t => t.classList.add('is-in'));
  }

  /* ================= Odometer im Fließtext ================= */
  function initOdo() {
    if (!MOTION) return;
    const odos = $$('.odo');
    odos.forEach(o => {
      const txt = o.textContent.trim();
      const drum = el('span', 'odo-drum'); drum.setAttribute('aria-hidden', 'true');
      let di = 0;
      [...txt].forEach(ch => {
        if (!/\d/.test(ch)) { drum.append(el('span', 'od-sep', ch)); return; }
        const wrap = el('span', 'od'), col = el('span', 'od-col');
        for (let k = 0; k <= 9; k++) col.append(el('span', null, String(k)));
        col.dataset.to = ch; col.style.setProperty('--d', di++);
        wrap.append(col); drum.append(wrap);
      });
      o.replaceChildren(el('span', 'sr-only', txt), drum);
    });
    onceInView(odos, o => $$('.od-col', o).forEach(c => { c.style.transform = `translateY(${-1.5 * +c.dataset.to}em)`; }), { rootMargin: '0px 0px -15% 0px' });
  }

  /* ================= Siegel dreht mit ================= */
  function initSeal() {
    const ring = $('.seal-ring');
    if (!ring || !ST()) return;
    gsap.fromTo(ring, { rotation: 0 }, { rotation: 260, ease: 'none', svgOrigin: '100 100', scrollTrigger: { trigger: '.stimmen', start: 'top bottom', end: 'bottom top', scrub: 0.5 } });
  }

  /* ================= Navigation: aktiver Abschnitt, Zeichen-Rollen ================= */
  function initActiveNav() {
    const links = $$('.nav a[href^="#"]');
    const map = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver(es => es.forEach(e => {
      const a = map.get(e.target.id);
      if (a && e.isIntersecting) { links.forEach(l => l.removeAttribute('aria-current')); a.setAttribute('aria-current', 'true'); }
    }), { rootMargin: '-45% 0px -50% 0px' });
    map.forEach((a, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
  }
  function initRoll() {
    if (!MOTION || !FINE) return;
    $$('.roll').forEach(a => {
      const t = a.textContent;
      const mk = cls => { const s = el('span', cls); [...t].forEach((ch, i) => { const c = el('span', null, ch); c.style.setProperty('--c', i); s.append(c); }); return s; };
      const b = mk('r-b'); b.setAttribute('aria-hidden', 'true');
      a.setAttribute('aria-label', t);
      a.replaceChildren(mk('r-a'), b);
    });
  }

  /* ================= Zeiger: Cursor-Ring und magnetische Buttons ================= */
  function initPointer() {
    if (!MOTION || !FINE || innerWidth < 900) return;
    const cur = el('div', 'cursor'); cur.setAttribute('aria-hidden', 'true'); cur.append(el('i'), el('b'));
    document.body.append(cur);
    let tx = 0, ty = 0, x = 0, y = 0, raf = 0;
    const loop = () => {
      x += (tx - x) * 0.22; y += (ty - y) * 0.22;
      cur.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.3 ? requestAnimationFrame(loop) : 0;
    };
    addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      tx = e.clientX; ty = e.clientY;
      if (!cur.classList.contains('is-on')) { x = tx; y = ty; cur.classList.add('is-on'); }
      const t = e.target;
      cur.classList.toggle('is-off', !!t.closest('input, textarea, select'));
      cur.classList.toggle('is-link', !!t.closest('a, button, summary, label'));
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
    document.addEventListener('pointerleave', () => cur.classList.remove('is-on'));

    $$('[data-magnet]').forEach(b => {
      let mx = 0, my = 0, cx = 0, cy = 0, r2 = 0;
      const step = () => {
        cx += (mx - cx) * 0.2; cy += (my - cy) * 0.2;
        b.style.translate = `${cx.toFixed(2)}px ${cy.toFixed(2)}px`;
        r2 = Math.abs(mx - cx) + Math.abs(my - cy) > 0.05 ? requestAnimationFrame(step) : 0;
        if (!r2 && mx === 0 && my === 0) b.style.translate = '';
      };
      b.addEventListener('pointermove', e => {
        const r = b.getBoundingClientRect();
        mx = clamp((e.clientX - (r.left + r.width / 2)) * 0.18, -8, 8);
        my = clamp((e.clientY - (r.top + r.height / 2)) * 0.3, -6, 6);
        if (!r2) r2 = requestAnimationFrame(step);
      });
      b.addEventListener('pointerleave', () => { mx = 0; my = 0; if (!r2) r2 = requestAnimationFrame(step); });
    });
  }

  /* ================= Bike-Explorer mit Explosionsansicht ================= */
  const PARTS = {
    schaltung: { name: 'Schaltung', desc: 'Das Schaltwerk führt die Kette über die Ritzel. Springt der Gang unter Last oder rattert es, ist meist der Zug gelängt – selten das Schaltwerk selbst.', tips: ['Nach den ersten 300 km Zugspannung nachstellen lassen – neue Züge längen sich.', 'Schaltröllchen regelmäßig von Dreck befreien, nicht ölen.', 'Beim Abstellen nicht aufs Schaltwerk legen: Ein verbogenes Schaltauge kostet wenig, eine verbogene Kassette nicht.'], int: 'alle 1.500 km prüfen', price: 'Einstellen ab 12 €' },
    bremse: { name: 'Scheibenbremse', desc: 'Hydraulische Scheibenbremsen packen auch bei Regen zu. Wird der Druckpunkt weich oder schleift es metallisch, sind Beläge oder Bremsflüssigkeit dran.', tips: ['Belagstärke prüfen: unter 1,5 mm Reibmaterial wechseln.', 'Scheibe nie mit Kettenöl oder Sprühfett in Berührung bringen – Beläge sind dann hin.', 'Neue Beläge einbremsen: zehnmal kräftig aus 25 km/h abbremsen.'], int: 'Beläge alle 1.000–2.000 km', price: 'Beläge ab 25 € + Material' },
    motor: { name: 'Mittelmotor', desc: 'Der Motor misst Trittkraft und Trittfrequenz und gibt passend dazu Kraft ab. Er ist versiegelt – Wartung heißt hier vor allem: Software und Diagnose.', tips: ['Beim Schalten kurz den Druck vom Pedal nehmen – schont Kette und Ritzel enorm.', 'Nicht mit dem Hochdruckreiniger putzen, Wasser drückt sich in Dichtungen.', 'Einmal im Jahr Fehlerspeicher auslesen und Software aktualisieren lassen.'], int: 'Diagnose jährlich', price: 'im E-Bike-Service enthalten' },
    akku: { name: 'Akku', desc: 'Lithium-Ionen-Akkus altern mit Ladezyklen und Hitze. Nach etwa 500–1.000 Vollzyklen sind oft noch 70–80 % Kapazität übrig – je nach Pflege.', tips: ['Zwischen 20 und 80 % laden schont die Zellen im Alltag.', 'Im Winter drinnen lagern und erst kurz vor der Fahrt einsetzen.', 'Kontakte sauber und trocken halten, nie mit Fett einsprühen.'], int: 'Akku-Test jährlich', price: 'Test im E-Bike-Service' },
    kette: { name: 'Kette', desc: 'Eine gelängte Kette frisst Ritzel und Kettenblatt mit. Rechtzeitig getauscht kostet sie wenig – zu spät getauscht wird es ein ganzer Antrieb.', tips: ['Alle 300–500 km reinigen und sparsam ölen, Überschuss abwischen.', 'Ab 0,5 % Längung (Kettenlehre) wechseln, bei E-Bikes früher.', 'Nach Regenfahrten trocken wischen – die Oldenburger Luft rostet gern.'], int: 'Längung alle 1.000 km messen', price: 'Kettenwechsel ab 15 € + Kette' },
    reifen: { name: 'Reifen', desc: 'Der richtige Druck entscheidet über Pannen, Rollwiderstand und Reichweite. Die meisten Platten in der Werkstatt sind Durchschläge wegen zu wenig Luft.', tips: ['Einmal im Monat Druck prüfen – Angabe steht auf der Reifenflanke.', 'Glasscherben aus dem Profil pulen, bevor sie sich durcharbeiten.', 'Bei sichtbarem Gewebe oder Rissen in der Flanke wechseln.'], int: 'Druck monatlich', price: 'Reifenwechsel ab 18 €' }
  };
  function initExplorer() {
    const tabs = $$('.hotspots .hs');
    const panel = $('#part-panel');
    if (!tabs.length) return;
    const inner = $('.part-inner', panel);
    const svgParts = $$('.ebike .part');
    const keys = Object.keys(PARTS);
    let current = 'schaltung';
    const render = key => {
      const p = PARTS[key];
      $('.part-code', panel).textContent = `Bauteil ${String(keys.indexOf(key) + 1).padStart(2, '0')} / ${String(keys.length).padStart(2, '0')}`;
      $('.part-name', panel).textContent = p.name;
      $('.part-desc', panel).textContent = p.desc;
      $('.part-tips', panel).replaceChildren(...p.tips.map(t => el('li', null, t)));
      $('.pm-int', panel).textContent = p.int;
      $('.pm-price', panel).textContent = p.price;
    };
    const select = (key, focus) => {
      if (key === current) { if (focus) tabs.find(t => t.dataset.part === key).focus(); return; }
      current = key;
      tabs.forEach(t => { const on = t.dataset.part === key; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; if (on) { panel.setAttribute('aria-labelledby', t.id); if (focus) t.focus(); } });
      svgParts.forEach(g => g.classList.toggle('is-active', g.dataset.part === key));
      if (MOTION) { inner.classList.add('is-swapping'); setTimeout(() => { render(key); inner.classList.remove('is-swapping'); }, 160); }
      else render(key);
    };
    svgParts.forEach(g => g.classList.toggle('is-active', g.dataset.part === current));
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(t.dataset.part));
      t.addEventListener('keydown', e => {
        let n = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % tabs.length;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') n = 0;
        else if (e.key === 'End') n = tabs.length - 1;
        if (n !== null) { e.preventDefault(); select(tabs[n].dataset.part, true); }
      });
    });

    // Explosionsansicht: Desktop scroll-gekoppelt, sonst Schalter (+ einmal automatisch beim Hineinscrollen)
    const stageWrap = $('.ex-stage'), stage = $('#ex-stage'), toggle = $('.ex-toggle');
    const setEx = v => stage.style.setProperty('--ex', v.toFixed(3));
    const setToggle = on => { toggle.setAttribute('aria-pressed', String(on)); toggle.textContent = on ? 'Zusammenbauen' : 'Explosionsansicht'; };
    toggle.addEventListener('click', () => {
      const on = toggle.getAttribute('aria-pressed') !== 'true';
      stage.classList.toggle('ex-anim', MOTION);
      setEx(on ? 1 : 0); setToggle(on);
    });
    if (ST()) {
      const mm = gsap.matchMedia();
      mm.add('(min-width: 900px) and (min-height: 640px)', () => {
        stageWrap.classList.add('is-scrub'); stage.classList.remove('ex-anim');
        const proxy = { ex: 0 };
        const tl = gsap.timeline({ scrollTrigger: { trigger: stageWrap, start: 'top top', end: 'bottom bottom', scrub: 0.7 }, onUpdate: () => setEx(proxy.ex) });
        tl.to(proxy, { ex: 0, duration: 0.08 }).to(proxy, { ex: 1, duration: 0.36, ease: 'power2.inOut' }).to(proxy, { ex: 1, duration: 0.34 }).to(proxy, { ex: 0, duration: 0.22, ease: 'power2.inOut' });
        return () => { stageWrap.classList.remove('is-scrub'); tl.scrollTrigger.kill(); tl.kill(); setEx(0); setToggle(false); };
      });
      mm.add('(max-width: 899px), (max-height: 639px)', () => {
        onceInView([stage], () => setTimeout(() => { if (toggle.getAttribute('aria-pressed') !== 'true') toggle.click(); }, 350), { threshold: 0.55 });
      });
    }
  }

  /* ================= Range-Inputs: Füllstand ================= */
  const paintRange = r => r.style.setProperty('--p', ((r.value - r.min) / (r.max - r.min) * 100) + '%');

  /* ================= Rahmengrößen-Rechner ================= */
  function initFrame() {
    const form = $('#frame-form');
    if (!form) return;
    const hIn = $('#f-height'), sIn = $('#f-inseam');
    const out = { h: $('#f-height-out'), s: $('#f-inseam-out'), frame: $('#r-frame'), unit: $('#r-unit'), size: $('#r-size'), saddle: $('#r-saddle'), prop: $('#r-prop'), hint: $('#r-hint') };
    const svg = { frame: $('#fit-frame'), parts: $('#fit-parts'), body: $('#fit-body'), arm: $('#fit-arm'), head: $('#fit-head'), wr: $('#fit-wr'), wf: $('#fit-wf'), dim: $('#fit-dimline'), dimT: $('#fit-dimtext') };
    const K = 0.215, GROUND = 400, BBX = 255;
    let cur = null, tgt = null, raf = 0, labelText = '';

    const compute = () => {
      const H = +hIn.value, S = +sIn.value;
      const type = form.elements.type.value;
      const T = FRAME.types[type];
      const raw = S * T.factor;
      const frame = T.unit === 'cm' ? Math.round(raw) : Math.round(raw * 2) / 2;
      const size = T.sizes.reduce((a, [min, l]) => (frame >= min ? l : a), 'XS');
      const saddle = S * FRAME.saddleFactor;
      const ratio = S / H;
      const st = (T.unit === 'cm' ? frame : frame * 2.54) * 10;
      const g = T.geo;
      return { H, S, type, frame, size, unit: T.unit, saddle, ratio, draw: { st, saddle: saddle * 10, H: H * 10, stack: g.stack0 + (st - 500) * g.stackK, reach: g.reach0 + (st - 500) * g.reachK, barFwd: g.barFwd, barRise: g.barRise, wheel: g.wheel, drop: g.drop, head: g.head, torso: g.torso } };
    };
    const ik = (a, b, l1, l2, pickLower) => {
      const dx = b.x - a.x, dy = b.y - a.y; let d = Math.hypot(dx, dy);
      d = Math.min(d, l1 + l2 - 0.01);
      const x = (d * d + l1 * l1 - l2 * l2) / (2 * d);
      const h = Math.sqrt(Math.max(0, l1 * l1 - x * x));
      const ux = dx / Math.hypot(dx, dy), uy = dy / Math.hypot(dx, dy);
      const px = a.x + ux * x, py = a.y + uy * x;
      const c1 = { x: px - uy * h, y: py + ux * h }, c2 = { x: px + uy * h, y: py - ux * h };
      return pickLower ? (c1.y > c2.y ? c1 : c2) : (c1.x > c2.x ? c1 : c2);
    };
    const P = (x, y) => ({ x, y });
    const f = n => n.toFixed(1);
    const draw = d => {
      const R = d.wheel * K, wy = GROUND - R;
      const bb = P(BBX, wy + d.drop * K);
      const sa = 73 * Math.PI / 180, dir = P(-Math.cos(sa), -Math.sin(sa));
      const stTop = P(bb.x + dir.x * d.st * K, bb.y + dir.y * d.st * K);
      const ht = P(bb.x + d.reach * K, bb.y - d.stack * K);
      const ha = 71 * Math.PI / 180;
      const hb = P(ht.x + Math.cos(ha) * d.head * K, ht.y + Math.sin(ha) * d.head * K);
      const rear = P(bb.x - 445 * K, wy);
      const front = P(hb.x + (wy - hb.y) / Math.tan(69 * Math.PI / 180) + 14, wy);
      const seat = P(bb.x + dir.x * d.saddle * K, bb.y + dir.y * d.saddle * K);
      const bar = P(ht.x + d.barFwd * K, ht.y - d.barRise * K);
      const stemTop = P(ht.x - 4, ht.y - 14);
      const crankA = 30 * Math.PI / 180;
      const pedal = P(bb.x + Math.cos(crankA) * 170 * K, bb.y + Math.sin(crankA) * 170 * K);
      svg.wr.setAttribute('cx', f(rear.x)); svg.wr.setAttribute('cy', f(wy)); svg.wr.setAttribute('r', f(R - 4));
      svg.wf.setAttribute('cx', f(front.x)); svg.wf.setAttribute('cy', f(wy)); svg.wf.setAttribute('r', f(R - 4));
      svg.frame.setAttribute('d', `M${f(rear.x)} ${f(rear.y)}L${f(bb.x)} ${f(bb.y)}L${f(stTop.x)} ${f(stTop.y)}Z M${f(stTop.x)} ${f(stTop.y)}L${f(ht.x)} ${f(ht.y)}L${f(hb.x)} ${f(hb.y)}L${f(bb.x)} ${f(bb.y)} M${f(hb.x)} ${f(hb.y)}L${f(front.x)} ${f(front.y)}`);
      const barEnd = d.barFwd > 40 ? `Q${f(bar.x + 22)} ${f(bar.y + 4)} ${f(bar.x + 14)} ${f(bar.y + 26)}` : `L${f(bar.x - 10)} ${f(bar.y + 2)}`;
      svg.parts.setAttribute('d', `M${f(stTop.x)} ${f(stTop.y)}L${f(seat.x)} ${f(seat.y)} M${f(seat.x - 26)} ${f(seat.y - 2)}L${f(seat.x + 22)} ${f(seat.y - 2)} M${f(ht.x)} ${f(ht.y)}L${f(stemTop.x)} ${f(stemTop.y)}L${f(bar.x)} ${f(bar.y)}${barEnd} M${f(bb.x)} ${f(bb.y)}L${f(pedal.x)} ${f(pedal.y)} M${f(pedal.x - 9)} ${f(pedal.y)}L${f(pedal.x + 9)} ${f(pedal.y)}`);
      const hip = P(seat.x - 10 * K, seat.y - 60 * K);
      const ankle = P(pedal.x - 25 * K, pedal.y - 75 * K);
      const leg = d.saddle / FRAME.saddleFactor * 1.05 * K;
      const knee = ik(hip, ankle, leg * 0.5, leg * 0.5, false);
      const torso = d.H * 0.3 * K, arm = d.H * 0.36 * K;
      let sh = null;
      for (let deg = Math.round(d.torso); deg >= 18; deg -= 1) {
        const a = deg * Math.PI / 180, s = P(hip.x + Math.cos(a) * torso, hip.y - Math.sin(a) * torso);
        sh = s; if (Math.hypot(bar.x - s.x, bar.y - s.y) <= arm * 0.94) break;
      }
      const elbow = ik(sh, bar, arm * 0.5, arm * 0.5, true);
      const tu = P((sh.x - hip.x) / torso, (sh.y - hip.y) / torso);
      const hr = d.H * 0.054 * K, neck = d.H * 0.035 * K;
      svg.body.setAttribute('d', `M${f(pedal.x + 12 * K * 4)} ${f(pedal.y)}L${f(ankle.x)} ${f(ankle.y)}L${f(knee.x)} ${f(knee.y)}L${f(hip.x)} ${f(hip.y)}L${f(sh.x)} ${f(sh.y)}`);
      svg.arm.setAttribute('d', `M${f(sh.x)} ${f(sh.y)}L${f(elbow.x)} ${f(elbow.y)}L${f(bar.x)} ${f(bar.y)}`);
      svg.head.setAttribute('cx', f(sh.x + tu.x * (neck + hr))); svg.head.setAttribute('cy', f(sh.y + tu.y * (neck + hr))); svg.head.setAttribute('r', f(hr));
      const off = -30;
      const a1 = P(bb.x + off, bb.y), a2 = P(stTop.x + off, stTop.y);
      svg.dim.setAttribute('d', `M${f(a1.x)} ${f(a1.y)}L${f(a2.x)} ${f(a2.y)} M${f(a1.x - 6)} ${f(a1.y)}L${f(a1.x + 6)} ${f(a1.y)} M${f(a2.x - 6)} ${f(a2.y)}L${f(a2.x + 6)} ${f(a2.y)}`);
      const mx = (a1.x + a2.x) / 2 - 14, my = (a1.y + a2.y) / 2;
      svg.dimT.setAttribute('x', f(mx)); svg.dimT.setAttribute('y', f(my));
      svg.dimT.setAttribute('transform', `rotate(73 ${f(mx)} ${f(my)})`);
      svg.dimT.setAttribute('text-anchor', 'middle');
      svg.dimT.textContent = labelText;
    };
    const tick = () => {
      let moving = false;
      for (const k in tgt) { const dlt = tgt[k] - cur[k]; if (Math.abs(dlt) > 0.2) { cur[k] += dlt * 0.18; moving = true; } else cur[k] = tgt[k]; }
      draw(cur);
      raf = moving ? requestAnimationFrame(tick) : 0;
    };
    const update = () => {
      [hIn, sIn].forEach(paintRange);
      const r = compute();
      out.h.textContent = r.H + ' cm';
      out.s.textContent = r.S + ' cm';
      out.frame.textContent = r.unit === 'cm' ? String(r.frame) : fmt(r.frame, r.frame % 1 ? 1 : 0);
      out.unit.textContent = r.unit === 'cm' ? ' cm' : ' Zoll';
      out.size.textContent = r.size;
      out.saddle.textContent = fmt(r.saddle, 0) + ' cm';
      const P_ = FRAME.proportion;
      let prop = 'ausgeglichen', hint = 'Ausgeglichene Proportionen – die Standardgeometrie passt meist ohne Umbau.';
      if (r.ratio >= P_.implausibleHigh || r.ratio <= P_.implausibleLow) { prop = 'bitte nachmessen'; hint = 'Das Verhältnis von Schrittlänge zu Körpergröße ist ungewöhnlich – messen Sie die Schrittlänge am besten noch einmal.'; }
      else if (r.ratio > P_.long) { prop = 'lange Beine'; hint = 'Lange Beine, kürzerer Oberkörper: Ein kompakter Rahmen mit kürzerem Oberrohr oder ein höherer Lenker sitzt meist entspannter.'; }
      else if (r.ratio < P_.short) { prop = 'langer Oberkörper'; hint = 'Langer Oberkörper: Ein etwas längeres Oberrohr oder ein längerer Vorbau entlastet Schultern und Handgelenke.'; }
      out.prop.textContent = prop;
      out.hint.textContent = hint;
      labelText = r.unit === 'cm' ? `${r.frame} CM` : `${fmt(r.frame, r.frame % 1 ? 1 : 0)}″`;
      tgt = r.draw;
      if (!cur || !MOTION) { cur = { ...tgt }; draw(cur); return; }
      if (!raf) raf = requestAnimationFrame(tick);
    };
    form.addEventListener('input', update);
    form.addEventListener('change', update);
    form.addEventListener('submit', e => e.preventDefault());
    update();
  }

  /* ================= E-Bike-Reichweite mit Karte ================= */
  function initRange() {
    const form = $('#range-form');
    if (!form) return;
    const wIn = $('#r-weight'), tIn = $('#r-temp');
    const o = { min: $('#rg-min'), max: $('#rg-max'), detail: $('#rg-detail'), w: $('#r-weight-out'), t: $('#r-temp-out'), cMin: $('#rwm-min'), cMax: $('#rwm-max') };
    const dests = $$('#dest-list li').map(li => { const s = el('span', 'dest-state'); li.firstElementChild.append(s); return { li, km: +li.dataset.km, s }; });
    const pins = $$('#rwm-dests g');
    let shown = { min: +o.min.textContent, max: +o.max.textContent }, raf = 0;
    const calc = () => {
      const fd = new FormData(form);
      const wh = +fd.get('wh'), mode = fd.get('mode'), terrain = fd.get('terrain');
      const kg = +wIn.value, temp = +tIn.value;
      let cap = 1;
      if (temp < RANGE.tempRef) cap -= (RANGE.tempRef - temp) * RANGE.coldLossPerDeg;
      if (temp > RANGE.heatFrom) cap -= (temp - RANGE.heatFrom) * RANGE.heatLossPerDeg;
      const usable = wh * RANGE.usable * cap;
      const cons = RANGE.base[mode] * RANGE.terrain[terrain] * (1 + (kg - RANGE.weightRef) * RANGE.weightPerKg);
      const mid = usable / cons;
      return { kg, temp, usable, cons, min: Math.round(mid * RANGE.spread[0]), max: Math.round(mid * RANGE.spread[1]) };
    };
    const show = (a, b) => { o.min.textContent = String(Math.round(a)); o.max.textContent = String(Math.round(b)); };
    const state = (km, r) => (km <= r.min ? 'ok' : km <= r.max ? 'tight' : 'far');
    const update = () => {
      [wIn, tIn].forEach(paintRange);
      const r = calc();
      o.w.textContent = r.kg + ' kg';
      o.t.textContent = (r.temp < 0 ? '−' + Math.abs(r.temp) : r.temp) + ' °C';
      o.detail.textContent = `≈ ${fmt(r.cons, 1)} Wh/km · ${fmt(r.usable)} Wh nutzbar`;
      // Kreis = halbe Reichweite (hin und zurück) als Luftlinie
      const sc = km => (km / 2 * RANGE.mapPxPerKm / RANGE.mapBaseR).toFixed(3);
      o.cMin.style.transform = `scale(${sc(r.min)})`;
      o.cMax.style.transform = `scale(${sc(r.max)})`;
      dests.forEach(d => { const st = state(d.km, r); d.li.className = st; d.s.textContent = st === 'ok' ? 'drin' : st === 'tight' ? 'knapp' : 'zu weit'; });
      pins.forEach(g => g.setAttribute('class', state(+g.dataset.km, r)));
      if (!MOTION) { show(r.min, r.max); shown = r; return; }
      const from = { ...shown }, t0 = performance.now();
      cancelAnimationFrame(raf);
      const step = now => {
        const p = Math.min(1, (now - t0) / 420), e = easeOut(p);
        show(from.min + (r.min - from.min) * e, from.max + (r.max - from.max) * e);
        if (p < 1) raf = requestAnimationFrame(step); else shown = { min: r.min, max: r.max };
      };
      raf = requestAnimationFrame(step);
    };
    form.addEventListener('input', update);
    form.addEventListener('change', update);
    form.addEventListener('submit', e => e.preventDefault());
    update();
  }

  /* ================= Werkstatt-Termin ================= */
  function initBooking() {
    const form = $('#book-form');
    if (!form) return;
    const steps = $$('.step', form), inds = $$('[data-step-ind]');
    const daysBox = $('#days'), slotsBox = $('#slots');
    const done = $('#booking-done');
    const err2 = $('#slot-error');
    const WD = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'], MON = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
    let step = 1;
    const days = [];
    const d = new Date(); d.setHours(12, 0, 0, 0);
    while (days.length < BOOKING.days) { d.setDate(d.getDate() + 1); if (!BOOKING.closedWeekdays.includes(d.getDay())) days.push(new Date(d)); }
    days.forEach((day, i) => {
      const lab = el('label', 'day');
      const inp = el('input'); inp.type = 'radio'; inp.name = 'day'; inp.value = String(i);
      inp.setAttribute('aria-label', `${WD[day.getDay()]}, ${day.getDate()}. ${MON[day.getMonth()]}`);
      const sp = el('span'); sp.append(el('b', null, WD[day.getDay()]), el('i', null, String(day.getDate())), el('b', null, MON[day.getMonth()]));
      lab.append(inp, sp); daysBox.append(lab);
    });
    const busy = (di, si) => ((days[di].getDate() * 3 + si * 7 + di) % 5 === 0) || (di === 0 && si < 2);
    const renderSlots = di => {
      const list = days[di].getDay() === 6 ? BOOKING.saturdaySlots : BOOKING.slots;
      const prev = form.elements.slot && form.elements.slot.value;
      slotsBox.replaceChildren(...list.map((t, si) => {
        const lab = el('label', 'slot');
        const inp = el('input'); inp.type = 'radio'; inp.name = 'slot'; inp.value = t;
        const b = busy(di, si);
        inp.disabled = b;
        inp.setAttribute('aria-label', b ? `${t} Uhr – belegt` : `${t} Uhr`);
        if (!b && t === prev) inp.checked = true;
        lab.append(inp, el('span', null, t)); return lab;
      }));
    };
    daysBox.addEventListener('change', e => { if (e.target.name === 'day') { renderSlots(+e.target.value); err2.textContent = ''; } });
    renderSlots(0);
    const pkgInput = () => form.querySelector('input[name="pkg"]:checked');
    const total = () => { let s = +pkgInput().dataset.price; $$('.extras input:checked', form).forEach(c => { s += +c.dataset.price; }); return s; };
    const lines = () => {
      const out = [[pkgInput().dataset.label, eur(+pkgInput().dataset.price)]];
      $$('.extras input:checked', form).forEach(c => out.push([c.dataset.label, '+' + eur(+c.dataset.price)]));
      const di = form.querySelector('input[name="day"]:checked');
      const sl = form.querySelector('input[name="slot"]:checked');
      if (di && sl) { const day = days[+di.value]; out.push(['Abgabe', `${WD[day.getDay()]}, ${day.getDate()}. ${MON[day.getMonth()]} · ${sl.value} Uhr`]); }
      return out;
    };
    const renderList = ul => ul.replaceChildren(...lines().map(([a, b]) => { const li = el('li'); li.append(el('span', null, a), el('span', null, b)); return li; }));
    const refresh = () => { $$('[data-sum]', form).forEach(s => { s.textContent = eur(total()); }); renderList($('#sum-list')); };
    form.addEventListener('change', refresh);
    const go = n => {
      step = n;
      steps.forEach(s => s.classList.toggle('is-active', +s.dataset.step === n));
      inds.forEach(i => { const k = +i.dataset.stepInd; i.classList.toggle('is-current', k === n); i.classList.toggle('is-done', k < n); if (k === n) i.setAttribute('aria-current', 'step'); else i.removeAttribute('aria-current'); });
      const legend = $('.step.is-active .step-title', form);
      legend.setAttribute('tabindex', '-1'); legend.focus({ preventScroll: true });
      const top = $('#booking').getBoundingClientRect().top;
      if (top < 0) { if (lenis) lenis.scrollTo('#booking', { offset: -90 }); else $('#booking').scrollIntoView({ block: 'start' }); }
      refresh();
    };
    const validate2 = () => {
      if (!form.querySelector('input[name="day"]:checked')) { err2.textContent = 'Bitte wählen Sie einen Abgabetag.'; return false; }
      if (!form.querySelector('input[name="slot"]:checked')) { err2.textContent = 'Bitte wählen Sie eine freie Uhrzeit.'; return false; }
      err2.textContent = ''; return true;
    };
    const fieldErr = (inp, msg) => { const e = $('#' + inp.id + '-err'); e.textContent = msg; inp.setAttribute('aria-invalid', msg ? 'true' : 'false'); if (msg) inp.setAttribute('aria-describedby', e.id); else inp.removeAttribute('aria-describedby'); return !msg; };
    const validate3 = () => {
      const n = $('#b-name'), p = $('#b-phone');
      const a = fieldErr(n, n.value.trim().length >= 2 ? '' : 'Bitte geben Sie Ihren Namen an.');
      const b = fieldErr(p, /^\+?[\d\s/()-]{6,}$/.test(p.value.trim()) ? '' : 'Bitte geben Sie eine Telefonnummer an, z. B. 0441 123456.');
      if (!a) n.focus(); else if (!b) p.focus();
      return a && b;
    };
    $$('[data-next]', form).forEach(b => b.addEventListener('click', () => { if (step === 2 && !validate2()) return; go(step + 1); }));
    $$('[data-prev]', form).forEach(b => b.addEventListener('click', () => go(step - 1)));
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (!validate3()) return;
      const ul = $('#done-list');
      renderList(ul);
      const extra = [['Name', $('#b-name').value.trim()], ['Telefon', $('#b-phone').value.trim()]];
      if ($('#b-bike').value.trim()) extra.push(['Rad', $('#b-bike').value.trim()]);
      extra.push(['Summe', eur(total())]);
      extra.forEach(([a, b]) => { const li = el('li'); li.append(el('span', null, a), el('span', null, b)); ul.append(li); });
      form.hidden = true; $('.steps').hidden = true; done.hidden = false; done.focus();
    });
    $('#book-reset').addEventListener('click', () => { form.reset(); form.hidden = false; $('.steps').hidden = false; done.hidden = true; renderSlots(0); go(1); });
    $$('#b-name, #b-phone').forEach(i => i.addEventListener('input', () => { if (i.getAttribute('aria-invalid') === 'true') fieldErr(i, ''); }));
    steps.forEach(s => s.classList.toggle('is-active', +s.dataset.step === 1));
    refresh();
  }

  /* ================= Anfahrt: Fahrt durch die Karte ================= */
  function initRoute() {
    const sec = $('.standort'), stage = $('.route-stage'), route = $('#route'), rider = $('#rider'), cam = $('#map-cam'), radius = $('#map-radius');
    if (!route || !MOTION) return;
    const kmEl = $('#map-km'), minEl = $('#map-min');
    const L = route.getTotalLength();
    const stops = $$('.route-stops .stop');
    const R0 = { x: 640, y: 207 };
    const render = p => {
      const d = clamp(p / 0.62);
      route.style.strokeDashoffset = (1000 * (1 - d)).toFixed(1);
      const pt = route.getPointAtLength(d * L), pt2 = route.getPointAtLength(Math.min(L, d * L + 2));
      const ang = Math.atan2(pt2.y - pt.y, pt2.x - pt.x) * 180 / Math.PI;
      rider.setAttribute('transform', `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)}) rotate(${ang.toFixed(1)})`);
      const q = easeInOut(clamp((p - 0.55) / 0.4));
      const sF = ROUTE.zoom, s = sF + (1 - sF) * q;
      const tx = (400 - pt.x * sF) * (1 - q), ty = (320 - pt.y * sF) * (1 - q);
      cam.setAttribute('transform', `translate(${tx.toFixed(1)} ${ty.toFixed(1)}) scale(${s.toFixed(3)})`);
      const k = 0.15 + 0.85 * easeOut(clamp((p - 0.6) / 0.35));
      radius.setAttribute('transform', `translate(${R0.x} ${R0.y}) scale(${k.toFixed(3)}) translate(${-R0.x} ${-R0.y})`);
      kmEl.textContent = fmt(d * ROUTE.km, 1);
      minEl.textContent = String(Math.round(d * ROUTE.minutes));
      stops.forEach(s2 => s2.classList.toggle('is-past', d >= +s2.dataset.at));
    };
    if (ST()) {
      const mm = gsap.matchMedia();
      mm.add('(min-width: 900px) and (min-height: 640px)', () => {
        stage.classList.add('is-scrub'); sec.classList.add('is-scrubbing');
        const t = ScrollTrigger.create({ trigger: stage, start: 'top top', end: 'bottom bottom', scrub: 0.6, onUpdate: s => render(s.progress), onRefresh: s => render(s.progress) });
        render(0);
        return () => { t.kill(); stage.classList.remove('is-scrub'); sec.classList.remove('is-scrubbing'); cam.removeAttribute('transform'); radius.removeAttribute('transform'); route.style.strokeDashoffset = ''; };
      });
      mm.add('(max-width: 899px), (max-height: 639px)', () => { onceInView([$('.map', sec)], () => sec.classList.add('is-drawn'), { threshold: 0.4 }); });
    } else {
      onceInView([$('.map', sec)], () => sec.classList.add('is-drawn'), { threshold: 0.4 });
    }
  }

  /* ================= Jetzt geöffnet ================= */
  function initOpenNow() {
    const n = $('#open-now'); if (!n) return;
    const now = new Date(), wd = now.getDay(), h = now.getHours() + now.getMinutes() / 60;
    const t = HOURS[wd];
    if (t && h >= t[0] && h < t[1]) { n.textContent = `Jetzt geöffnet – bis ${t[1]} Uhr`; n.classList.add('is-open'); }
    else {
      let k = 0, nd = wd; const today = t && h < t[0];
      if (!today) { do { nd = (nd + 1) % 7; k++; } while (!HOURS[nd] && k < 7); }
      const names = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
      n.textContent = `Gerade geschlossen – öffnet ${today ? 'heute' : (k === 1 ? 'morgen' : names[nd])} um ${HOURS[nd][0]} Uhr`;
    }
  }

  /* ================= Start ================= */
  initHeader();
  initHero();

  const queue = [initSmooth, initAnchors, initTempo, initRaeder, initWerkstatt, initReveal, initActiveNav, initRoll, initExplorer, initFrame, initRange, initBooking, initOdo, initSeal, initRoute, initPointer, initOpenNow];
  const run = () => {
    const t0 = performance.now();
    while (queue.length && performance.now() - t0 < 20) { try { queue.shift()(); } catch (e) { console.warn(e); } }
    if (queue.length) idle(run);
    else if (ST()) ScrollTrigger.refresh();
  };
  // Bibliotheken erst nach dem ersten Frame nachladen (GSAP, ScrollTrigger, Lenis), dann die Warteschlange abarbeiten
  const VENDOR = ['gsap.min.js', 'ScrollTrigger.min.js', 'lenis.min.js'].map(f => '/arena/radwerk-oldenburg/assets/vendor/' + f);
  const load = src => new Promise(res => { const sc = document.createElement('script'); sc.src = src; sc.async = false; sc.onload = sc.onerror = res; document.head.append(sc); });
  const startQueue = () => idle(run);
  if (MOTION) requestAnimationFrame(() => setTimeout(() => { Promise.all(VENDOR.map(load)).then(startQueue); }, 0));
  else startQueue();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (ST() && !queue.length) ScrollTrigger.refresh(); });
})();
