/* Radwerk Oldenburg – Modell „Kette“
   Start in Etappen: Header + Hero sofort, alles darunter häppchenweise im Leerlauf. */
(() => {
  'use strict';

  /* ================= Konstanten (hier anpassen) ================= */

  // Hero: Raddrehung in Grad je gescrolltem Pixel, Übersetzung Kettenblatt/Ritzel
  const HERO = { degPerPx: 0.42, ringTeeth: 38, sprocketTeeth: 16, ringRadius: 34, lerp: 0.14 };

  // Rahmengrößen-Rechner: Faustformeln Schrittlänge × Faktor (City/Trekking/E-Bike/Gravel in cm, MTB in Zoll)
  const FRAME = {
    saddleFactor: 0.885, // Sattelhöhe (Mitte Tretlager – Oberkante Sattel) = Schrittlänge × 0,885
    types: {
      city:   { label: 'City / Trekking', factor: 0.66,  unit: 'cm', sizes: [[0, 'XS'], [46, 'S'], [51, 'M'], [56, 'L'], [61, 'XL']], geo: { stack0: 570, stackK: 1.0, reach0: 365, reachK: 0.45, barFwd: -45, barRise: 95, wheel: 350, drop: 70, head: 150 , torso: 72 } },
      ebike:  { label: 'E-Bike',          factor: 0.66,  unit: 'cm', sizes: [[0, 'XS'], [46, 'S'], [51, 'M'], [56, 'L'], [61, 'XL']], geo: { stack0: 590, stackK: 1.0, reach0: 380, reachK: 0.45, barFwd: -30, barRise: 80, wheel: 350, drop: 70, head: 165 , torso: 66 } },
      gravel: { label: 'Gravel / Renn',   factor: 0.665, unit: 'cm', sizes: [[0, 'XS'], [49, 'S'], [52, 'M'], [56, 'L'], [59, 'XL']], geo: { stack0: 545, stackK: 1.1, reach0: 378, reachK: 0.6,  barFwd: 75,  barRise: 15, wheel: 345, drop: 72, head: 125 , torso: 44 } },
      mtb:    { label: 'MTB',             factor: 0.226, unit: '″',  sizes: [[0, 'XS'], [15, 'S'], [16.5, 'M'], [18.5, 'L'], [20.5, 'XL']], geo: { stack0: 600, stackK: 0.6, reach0: 425, reachK: 1.2,  barFwd: 10,  barRise: 30, wheel: 370, drop: 45, head: 110 , torso: 54 } }
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
    scaleMax: 200                                       // km auf der Skala
  };

  // Werkstatt-Termin
  const BOOKING = {
    days: 12,                                           // buchbare Werktage ab morgen
    slots: ['10:00', '11:30', '13:00', '15:00', '17:00'],
    saturdaySlots: ['10:00', '11:30', '13:00'],
    closedWeekdays: [0]                                 // 0 = Sonntag
  };

  // Öffnungszeiten für „Jetzt geöffnet“
  const HOURS = { 1: [10, 19], 2: [10, 19], 3: [10, 19], 4: [10, 19], 5: [10, 19], 6: [10, 16] };

  /* ================= Hilfen ================= */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const MOTION = root.classList.contains('motion');
  const eur = n => n.toLocaleString('de-DE') + ' €';
  const fmt = (n, d = 0) => n.toLocaleString('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d });
  const idle = window.requestIdleCallback ? cb => requestIdleCallback(cb, { timeout: 300 }) : cb => setTimeout(cb, 16);
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

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
    update();

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

  /* ================= Etappe 1: Hero-Fahrrad (scroll-gekoppelt) ================= */
  function initHeroBike() {
    const wr = $('#wheel-r'), wf = $('#wheel-f'), crank = $('#crank'), chain = $('.bike .chain');
    if (!wr || !MOTION) return;
    const ratio = HERO.ringTeeth / HERO.sprocketTeeth;
    let target = 0, cur = 0, raf = 0, visible = true;
    const apply = () => {
      const c = cur / ratio;
      wr.setAttribute('transform', `rotate(${cur.toFixed(2)} 200 360)`);
      wf.setAttribute('transform', `rotate(${cur.toFixed(2)} 640 360)`);
      crank.setAttribute('transform', `rotate(${c.toFixed(2)} 375 375)`);
      chain.style.strokeDashoffset = (-(c * Math.PI / 180) * HERO.ringRadius).toFixed(2);
    };
    const tick = () => {
      const d = target - cur;
      cur = Math.abs(d) < 0.05 ? target : cur + d * HERO.lerp;
      apply();
      raf = cur !== target ? requestAnimationFrame(tick) : 0;
    };
    const onScroll = () => {
      target = window.scrollY * HERO.degPerPx;
      if (visible && !raf && !document.hidden) raf = requestAnimationFrame(tick);
    };
    addEventListener('scroll', onScroll, { passive: true });
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) onScroll(); }).observe($('.hero-fig'));
  }

  /* ================= Etappe 2: Lenis + GSAP ================= */
  let lenis = null;
  function initSmooth() {
    if (!MOTION || !window.gsap || !window.ScrollTrigger) return;
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
      if (lenis) { e.preventDefault(); lenis.scrollTo(t, { offset: id === '#inhalt' ? 0 : -76, duration: 1.1 }); history.replaceState(null, '', id); }
      if (id === '#inhalt') { t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: !!lenis }); }
    }));
  }

  /* ================= Sortiment: horizontale Strecke (sticky + Scrub) ================= */
  function initRaeder() {
    const sec = $('.raeder'), track = $('.raeder-track'), vp = $('.raeder-viewport');
    const count = $('.raeder-count b');
    const cards = $$('.bike-card', track);
    if (!sec || !window.gsap || !MOTION) return;
    const mm = gsap.matchMedia();
    mm.add('(min-width: 900px)', () => {
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
          trigger: sec, start: 'top top', end: () => '+=' + dist(), scrub: 0.5, invalidateOnRefresh: true,
          onUpdate: self => { const n = Math.min(cards.length, 1 + Math.round(self.progress * (cards.length - 1))); count.textContent = String(n).padStart(2, '0'); }
        }
      });
      return () => { ScrollTrigger.removeEventListener('refreshInit', setH); sec.style.height = ''; tw.kill(); gsap.set(track, { clearProps: 'transform' }); };
    });
    // Handy / ohne Strecke: Zähler aus der nativen Schiene
    mm.add('(max-width: 899px)', () => {
      const onS = () => { const w = cards[0].getBoundingClientRect().width + 14; count.textContent = String(Math.min(cards.length, 1 + Math.round(vp.scrollLeft / w))).padStart(2, '0'); };
      vp.addEventListener('scroll', onS, { passive: true });
      return () => vp.removeEventListener('scroll', onS);
    });
  }

  /* ================= Kettenteiler ================= */
  function initChains() {
    if (!window.gsap || !MOTION) return;
    $$('.chain-divider').forEach((d, i) => {
      gsap.fromTo($('.chain-row', d), { x: i % 2 ? -432 : 0 }, { x: i % 2 ? 0 : -432, ease: 'none', scrollTrigger: { trigger: d, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  }

  /* ================= Reveal ================= */
  function initReveal() {
    if (!MOTION) return;
    $$('[data-reveal-group]').forEach(g => [...g.children].forEach((c, i) => c.style.setProperty('--i', i)));
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    $$('[data-reveal], [data-reveal-group], [data-reveal-img]').forEach(n => io.observe(n));
  }

  /* ================= Navigation: aktiver Abschnitt ================= */
  function initActiveNav() {
    const links = $$('.nav a[href^="#"]');
    const map = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver(es => es.forEach(e => {
      const a = map.get(e.target.id);
      if (a && e.isIntersecting) { links.forEach(l => l.removeAttribute('aria-current')); a.setAttribute('aria-current', 'true'); }
    }), { rootMargin: '-45% 0px -50% 0px' });
    map.forEach((a, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
  }

  /* ================= Bike-Explorer ================= */
  const PARTS = {
    schaltung: { name: 'Schaltung', desc: 'Das Schaltwerk führt die Kette über die Ritzel. Springt der Gang unter Last oder rattert es, ist meist der Zug gelängt – selten das Schaltwerk selbst.', tips: ['Nach den ersten 300 km Zugspannung nachstellen lassen – neue Züge längen sich.', 'Schaltröllchen regelmäßig von Dreck befreien, nicht ölen.', 'Beim Abstellen nicht aufs Schaltwerk legen: Ein verbogenes Schaltauge kostet wenig, eine verbogene Kassette nicht.'], int: 'alle 1.500 km prüfen', price: 'Einstellen ab 12 €' },
    bremse: { name: 'Scheibenbremse', desc: 'Hydraulische Scheibenbremsen packen auch bei Regen zu. Wird der Druckpunkt weich oder schleift es metallisch, sind Beläge oder Bremsflüssigkeit dran.', tips: ['Belagstärke prüfen: unter 1,5 mm Reibmaterial wechseln.', 'Scheibe nie mit Kettenöl oder Sprühfett in Berührung bringen – Beläge sind dann hin.', 'Neue Beläge einbremsen: zehnmal kräftig aus 25 km/h abbremsen.'], int: 'Beläge alle 1.000–2.000 km', price: 'Beläge ab 25 € + Material' },
    motor: { name: 'Mittelmotor', desc: 'Der Motor misst Trittkraft und Trittfrequenz und gibt passend dazu Kraft ab. Er ist versiegelt – Wartung heißt hier vor allem: Software und Diagnose.', tips: ['Beim Schalten kurz den Druck vom Pedal nehmen – schont Kette und Ritzel enorm.', 'Nicht mit dem Hochdruckreiniger putzen, Wasser drückt sich in Dichtungen.', 'Einmal im Jahr Fehlerspeicher auslesen und Software aktualisieren lassen.'], int: 'Diagnose jährlich', price: 'im E-Bike-Service enthalten' },
    akku: { name: 'Akku', desc: 'Lithium-Ionen-Akkus altern mit Ladezyklen und Hitze. Nach etwa 500–1.000 Vollzyklen sind oft noch 70–80 % Kapazität übrig – je nach Pflege.', tips: ['Zwischen 20 und 80 % laden schont die Zellen im Alltag.', 'Im Winter drinnen lagern und erst kurz vor der Fahrt einsetzen.', 'Kontakte sauber und trocken halten, nie mit Fett einsprühen.'], int: 'Akku-Test jährlich', price: 'Test im E-Bike-Service' },
    kette: { name: 'Kette', desc: 'Eine gelängte Kette frisst Ritzel und Kettenblatt mit. Rechtzeitig getauscht kostet sie wenig – zu spät getauscht wird es ein ganzer Antrieb.', tips: ['Alle 300–500 km reinigen und sparsam ölen, Überschuss abwischen.', 'Ab 0,5 % Längung (Kettenlehre) wechseln, bei E-Bikes früher.', 'Nach Regenfahrten trocken wischen – die Oldenburger Luft rostet gern.'], int: 'Längung alle 1.000 km messen', price: 'Kettenwechsel ab 15 € + Kette' },
    reifen: { name: 'Reifen', desc: 'Der richtige Druck entscheidet über Pannen, Rollwiderstand und Reichweite. Die meisten Platten in der Werkstatt sind Durchschläge wegen zu wenig Luft.', tips: ['Einmal im Monat Druck prüfen – Angabe steht auf der Reifenflanke.', 'Glasscherben aus dem Profil pulen, bevor sie sich durcharbeiten.', 'Bei sichtbarem Gewebe oder Rissen in der Flanke wechseln.'], int: 'Druck monatlich', price: 'Reifenwechsel ab 18 €' }
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
      $('.part-code', panel).textContent = `BAUTEIL ${String(keys.indexOf(key) + 1).padStart(2, '0')} / ${String(keys.length).padStart(2, '0')}`;
      $('.part-name', panel).textContent = p.name;
      $('.part-desc', panel).textContent = p.desc;
      const ul = $('.part-tips', panel);
      ul.replaceChildren(...p.tips.map(t => el('li', null, t)));
      $('.pm-int', panel).textContent = p.int;
      $('.pm-price', panel).textContent = p.price;
    };
    const select = (key, focus) => {
      if (key === current) { if (focus) tabs.find(t => t.dataset.part === key).focus(); return; }
      current = key;
      tabs.forEach(t => { const on = t.dataset.part === key; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; if (on) { panel.setAttribute('aria-labelledby', t.id); if (focus) t.focus(); } });
      svgParts.forEach(g => g.classList.toggle('is-active', g.dataset.part === key));
      if (MOTION) { inner.classList.add('is-swapping'); setTimeout(() => { render(key); inner.classList.remove('is-swapping'); }, 170); }
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
      // Zeichnung: Sitzrohr in mm (MTB in cm umgerechnet)
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
      // Fahrer:in
      const hip = P(seat.x - 10 * K, seat.y - 60 * K);          // Hüftgelenk über den Sitzknochen
      const ankle = P(pedal.x - 25 * K, pedal.y - 75 * K);       // Knöchel über dem Pedal
      const leg = d.saddle / FRAME.saddleFactor * 1.05 * K;      // Hüfte–Knöchel ≈ Schrittlänge × 1,05
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
      // Maßlinie am Sitzrohr
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
      out.h.textContent = r.H + ' cm';
      out.s.textContent = r.S + ' cm';
      out.frame.textContent = r.unit === 'cm' ? String(r.frame) : fmt(r.frame, r.frame % 1 ? 1 : 0);
      out.unit.textContent = r.unit === 'cm' ? ' cm' : ' Zoll';
      out.size.textContent = r.size;
      out.saddle.textContent = fmt(r.saddle, 0) + ' cm';
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

  /* ================= E-Bike-Reichweite ================= */
  function initRange() {
    const form = $('#range-form');
    if (!form) return;
    const wIn = $('#r-weight'), tIn = $('#r-temp');
    const o = { min: $('#rg-min'), max: $('#rg-max'), detail: $('#rg-detail'), fill: $('#rs-fill'), w: $('#r-weight-out'), t: $('#r-temp-out') };
    const dests = $$('#dest-list li').map(li => { const s = el('span', 'dest-state'); li.firstElementChild.append(s); return { li, km: +li.dataset.km, s }; });
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
    const update = () => {
      [wIn, tIn].forEach(paintRange);
      const r = calc();
      o.w.textContent = r.kg + ' kg';
      o.t.textContent = (r.temp < 0 ? '−' + Math.abs(r.temp) : r.temp) + ' °C';
      o.detail.textContent = `≈ ${fmt(r.cons, 1)} Wh/km · ${fmt(r.usable)} Wh nutzbar`;
      const L = Math.min(100, r.min / RANGE.scaleMax * 100), Rr = Math.max(0, 100 - Math.min(100, r.max / RANGE.scaleMax * 100));
      o.fill.style.clipPath = `inset(0 ${Rr.toFixed(1)}% 0 ${L.toFixed(1)}% round 7px)`;
      dests.forEach(d => {
        const st = d.km <= r.min ? 'ok' : d.km <= r.max ? 'tight' : 'far';
        d.li.className = st;
        d.s.textContent = st === 'ok' ? 'drin' : st === 'tight' ? 'knapp' : 'zu weit';
      });
      // Zahlen kurz hochzählen (nur mit Motion)
      if (!MOTION) { show(r.min, r.max); shown = r; return; }
      const from = { ...shown }, t0 = performance.now();
      cancelAnimationFrame(raf);
      const step = now => {
        const p = Math.min(1, (now - t0) / 280), e = 1 - Math.pow(1 - p, 3);
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
    const WD = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'], MON = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
    let step = 1;

    // Tage erzeugen
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
    // Ersten Tag mit freiem Slot vorbereiten (ohne vorzuwählen)
    renderSlots(0);

    const err2 = $('#slot-error');
    const pkgInput = () => form.querySelector('input[name="pkg"]:checked');
    const total = () => { let s = +pkgInput().dataset.price; $$('.extras input:checked', form).forEach(c => s += +c.dataset.price); return s; };
    const lines = () => {
      const out = [[pkgInput().dataset.label, eur(+pkgInput().dataset.price)]];
      $$('.extras input:checked', form).forEach(c => out.push([c.dataset.label, '+' + eur(+c.dataset.price)]));
      const di = form.elements.day && form.querySelector('input[name="day"]:checked');
      const sl = form.querySelector('input[name="slot"]:checked');
      if (di && sl) { const day = days[+di.value]; out.push(['Abgabe', `${WD[day.getDay()]}, ${day.getDate()}. ${MON[day.getMonth()]} · ${sl.value} Uhr`]); }
      return out;
    };
    const renderList = ul => ul.replaceChildren(...lines().map(([a, b]) => { const li = el('li'); li.append(el('span', null, a), el('span', null, b)); return li; }));
    const refresh = () => { $$('[data-sum]', form).forEach(s => s.textContent = eur(total())); renderList($('#sum-list')); };
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

  /* ================= Jetzt geöffnet ================= */
  function initOpenNow() {
    const n = $('#open-now'); if (!n) return;
    const now = new Date(), wd = now.getDay(), h = now.getHours() + now.getMinutes() / 60;
    const t = HOURS[wd];
    if (t && h >= t[0] && h < t[1]) { n.textContent = `Jetzt geöffnet – bis ${t[1]} Uhr`; n.classList.add('is-open'); }
    else {
      let k = 0, nd = wd, today = t && h < t[0];
      if (!today) { do { nd = (nd + 1) % 7; k++; } while (!HOURS[nd] && k < 7); }
      const names = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
      n.textContent = `Gerade geschlossen – öffnet ${today ? 'heute' : (k === 1 ? 'morgen' : names[nd])} um ${HOURS[nd][0]} Uhr`;
    }
  }

  /* ================= Start ================= */
  initHeader();
  initHeroBike();

  const queue = [initSmooth, initAnchors, initRaeder, initChains, initReveal, initActiveNav, initExplorer, initFrame, initRange, initBooking, initOpenNow];
  const run = () => {
    const t0 = performance.now();
    while (queue.length && performance.now() - t0 < 20) { try { queue.shift()(); } catch (e) { console.warn(e); } }
    if (queue.length) idle(run);
    else if (window.ScrollTrigger && MOTION) { ScrollTrigger.refresh(); }
  };
  idle(run);
  // Nach dem Laden der Schriften Maße neu berechnen
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (window.ScrollTrigger && !queue.length) ScrollTrigger.refresh(); });
})();
