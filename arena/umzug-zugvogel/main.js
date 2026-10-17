/* Zugvogel Umzüge – Modell „Etappe“
   Ohne Build-Schritt. GSAP + ScrollTrigger + Lenis (lokal unter assets/vendor).
   Alle Rechenwerte stehen als Konstanten direkt hier oben (siehe README). */

/* ===== Volumenrechner: Richtwerte in m³ je Stück (inkl. Stauraum) ===== */
const RAEUME = [
  { id: 'wohnen', name: 'Wohnen', items: [
    ['sofa', 'Sofa, 3-Sitzer', 2.0, 1], ['sessel', 'Sessel', 0.8, 1], ['couchtisch', 'Couchtisch', 0.4, 1],
    ['tv', 'TV-Board / Lowboard', 0.6, 1], ['vitrine', 'Regal / Vitrine', 0.8, 2], ['lampe', 'Stehlampe', 0.2, 0], ['teppich', 'Teppich (gerollt)', 0.2, 0] ] },
  { id: 'schlafen', name: 'Schlafen', items: [
    ['doppelbett', 'Doppelbett mit Matratze', 2.0, 1], ['einzelbett', 'Einzelbett', 1.0, 0], ['schranktuer', 'Kleiderschrank, je Tür', 0.6, 4],
    ['kommode', 'Kommode', 0.6, 1], ['nachttisch', 'Nachttisch', 0.2, 2] ] },
  { id: 'kueche', name: 'Küche & Essen', items: [
    ['esstisch', 'Esstisch', 0.8, 1], ['stuhl', 'Stuhl', 0.2, 4], ['kuehlschrank', 'Kühlschrank', 0.8, 1],
    ['waschmaschine', 'Waschmaschine', 0.5, 1], ['spueler', 'Geschirrspüler', 0.5, 0], ['kuechenmodul', 'Küchenschrank, je Modul', 0.4, 0] ] },
  { id: 'arbeit', name: 'Arbeit & Kind', items: [
    ['schreibtisch', 'Schreibtisch', 1.0, 1], ['buerostuhl', 'Bürostuhl', 0.3, 1], ['buecherregal', 'Bücherregal', 0.8, 1],
    ['kinderbett', 'Kinderbett', 0.8, 0], ['spielkiste', 'Spielzeugkiste', 0.3, 0] ] },
  { id: 'keller', name: 'Keller & Draußen', items: [
    ['fahrrad', 'Fahrrad', 0.5, 2], ['kellerregal', 'Kellerregal', 0.6, 1], ['garten', 'Gartenmöbel-Set', 1.0, 0],
    ['kinderwagen', 'Kinderwagen', 0.4, 0], ['kleinkram', 'Werkzeug / Kleinkram-Kiste', 0.3, 0] ] },
  { id: 'kartons', name: 'Kartons', items: [
    ['karton', 'Umzugskarton (Standard)', 0.1, 30], ['buecherkarton', 'Bücherkarton (klein)', 0.06, 6], ['kleiderbox', 'Kleiderbox', 0.3, 3] ] }
];
const lkwName = k => k.replace(' ', '-') + '-LKW'; // „7,5-t-LKW“
const KARTON_IDS = ['karton', 'buecherkarton', 'kleiderbox'];

/* ===== Fuhrpark: Laderaum je LKW-Klasse in m³ ===== */
const LKW = [
  { key: "3,5 t", m3: 20, cells: 5 },
  { key: "7,5 t", m3: 38, cells: 7 },
  { key: "12 t", m3: 54, cells: 9 }
];

/* ===== Kostenschätzung: Durchschnittswerte (Beispiel, brutto) ===== */
const KOSTEN = {
  STUNDENSATZ_PERSON: 42,      // € je Umzugshelfer und Stunde
  LEISTUNG_M3_PERSON_H: 2.8,   // m³, die eine Person pro Stunde trägt und verlädt (je Adresse)
  MIN_STUNDEN: 3,              // Mindesteinsatz in Stunden
  ANFAHRT: 89,                 // € Anfahrtspauschale Region Hannover
  LKW_TAG: { '3,5 t': 119, '7,5 t': 189, '12 t': 259 }, // € Fahrzeug je Einsatztag
  KM_FREI: 30,                 // km inklusive
  KM_SATZ: 1.45,               // € je km über KM_FREI (Diesel, Maut, Fahrzeug) je LKW
  FAHRT_KMH: 65,               // Ø Reisegeschwindigkeit für Fahrzeit des Teams
  UEBERNACHTUNG_AB_KM: 400,    // ab dieser Strecke wird eine Übernachtung fällig
  UEBERNACHTUNG_PERSON: 95,    // € je Person
  ETAGE_OHNE_AUFZUG: 3.2,      // € je m³ und Etage ohne Aufzug
  MIT_AUFZUG: 0.8,             // € je m³ pauschal, wenn ein Aufzug vorhanden ist
  PACK: { ohne: 0, teil: 6, komplett: 15 }, // € je m³ Packservice
  HALTEVERBOT: 145,            // € je Adresse (Antrag, Gebühr, Beschilderung)
  SPANNE: [0.9, 1.15],         // Unter-/Obergrenze der Preisspanne
  RUNDEN: 10                   // auf 10 € runden
};

/* ===== Checkliste ===== */
const CL_KEY = 'zugvogel-checkliste-v1';


(function () {
  'use strict';
  const d = document, root = d.documentElement;
  const RM = root.classList.contains('rm');
  const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, c) => (c || d).querySelector(s);
  const $$ = (s, c) => Array.from((c || d).querySelectorAll(s));
  const nf1 = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const nf0 = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 });
  const eur = v => nf0.format(v) + ' €';
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* privat/gesperrt */ } }
  };
  const hdr = $('.hd');
  let lenis = null;
  let volumeShared = null; // Volumen aus dem Rechner → Kosten & Formular

  /* ---------- Header: Schatten + Etappen-Leiste (LKW fährt die Seite entlang) ---------- */
  const route = $('.hd__route'), rDone = $('.hd__done'), rVan = $('.hd__van'), rStops = $('.hd__stops');
  let stopEls = [], stopPos = [], routeW = 0, ticking = false;
  function layoutStops() {
    const secs = $$('[data-stop]'); const max = Math.max(1, root.scrollHeight - innerHeight);
    routeW = route.clientWidth;
    if (!stopEls.length) {
      secs.forEach(() => { const i = d.createElement('i'); rStops.appendChild(i); stopEls.push(i); });
    }
    stopPos = secs.map(s => Math.min(1, Math.max(0, (s.getBoundingClientRect().top + scrollY - innerHeight * .3) / max)));
    stopEls.forEach((el, k) => { el.style.left = (stopPos[k] * 100).toFixed(2) + '%'; });
    onScroll();
  }
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const y = window.scrollY, max = root.scrollHeight - innerHeight;
      const p = max > 0 ? Math.min(1, y / max) : 0;
      hdr.classList.toggle('is-scrolled', y > 8);
      rDone.style.transform = 'scaleX(' + p.toFixed(4) + ')';
      rVan.style.transform = 'translateX(' + (p * routeW - 36 * p).toFixed(1) + 'px)';
      stopEls.forEach((el, k) => el.classList.toggle('is-past', stopPos[k] <= p + .002));
      heroScroll(y);
    });
  }
  addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Mobiles Menü (Fokusführung, Escape) ---------- */
  const burger = $('.burger'), menu = $('#menu');
  function setMenu(open) {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
    menu.hidden = !open;
    d.body.style.overflow = open ? 'hidden' : '';
    if (lenis) open ? lenis.stop() : lenis.start();
    if (open) { const f = $('a', menu); f && f.focus(); } else burger.focus({ preventScroll: true });
  }
  burger.addEventListener('click', () => setMenu(menu.hidden));
  menu.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  d.addEventListener('keydown', e => {
    if (menu.hidden) return;
    if (e.key === 'Escape') { setMenu(false); return; }
    if (e.key === 'Tab') {
      const f = [burger].concat($$('a', menu));
      const i = f.indexOf(d.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  });
  matchMedia('(min-width: 1140px)').addEventListener('change', e => { if (e.matches && !menu.hidden) setMenu(false); });

  /* ---------- Hero: Choreografie einmal, „Noch mal beladen“, Feder-Parallaxe ---------- */
  const scene = $('.zv-scene'), replay = $('.replay'), mapIn = $('.hero__map-in'), hero = $('.hero');
  const SCENE_MS = 6300;
  if (scene && replay && !RM) {
    setTimeout(() => { replay.hidden = false; }, SCENE_MS);
    replay.addEventListener('click', () => {
      [scene].concat($$('.hl', hero)).forEach(el => { el.style.animation = 'none'; });
      scene.classList.remove('is-playing');
      void scene.getBoundingClientRect();
      [scene].concat($$('.hl', hero)).forEach(el => { el.style.animation = ''; });
      scene.classList.add('is-playing');
      replay.hidden = true;
      setTimeout(() => { replay.hidden = false; }, SCENE_MS);
    });
  }
  const wide = matchMedia('(min-width: 900px)');
  let px = 0, py = 0, tx = 0, ty = 0, sy = 0, heroRaf = 0, heroVis = true;
  function heroFrame() {
    heroRaf = 0;
    px += (tx - px) * .09; py += (ty - py) * .09;
    mapIn.style.transform = 'translate3d(' + (px * -16).toFixed(2) + 'px,' + (py * -10 + sy).toFixed(2) + 'px,0)';
    if (Math.abs(tx - px) > .002 || Math.abs(ty - py) > .002) heroRaf = requestAnimationFrame(heroFrame);
  }
  function heroKick() { if (!heroRaf && heroVis) heroRaf = requestAnimationFrame(heroFrame); }
  function heroScroll(y) {
    if (RM || !wide.matches || !mapIn) return;
    const nsy = Math.min(y, innerHeight) * .14;
    if (Math.abs(nsy - sy) > .3) { sy = nsy; heroKick(); }
  }
  if (!RM && FINE && hero && mapIn) {
    hero.addEventListener('pointermove', e => { if (!wide.matches) return; tx = e.clientX / innerWidth - .5; ty = e.clientY / innerHeight - .5; heroKick(); }, { passive: true });
    hero.addEventListener('pointerleave', () => { tx = 0; ty = 0; heroKick(); });
    new IntersectionObserver(es => { heroVis = es[0].isIntersecting; }).observe(hero);
  }

  /* ================= Warteschlange: alles unterhalb des ersten Bildschirms ================= */
  const queue = [];
  const later = fn => queue.push(fn);
  function runQueue() {
    const t0 = performance.now();
    while (queue.length && performance.now() - t0 < 18) {
      const fn = queue.shift();
      try { fn(); } catch (err) { console.warn(err); }
    }
    if (queue.length) schedule(runQueue);
  }
  const schedule = fn => ('requestIdleCallback' in window) ? requestIdleCallback(fn, { timeout: 120 }) : setTimeout(fn, 16);

  /* ---------- Aufdecken: Packband-Abroller, Reveal, Kartons fallen auf den Stapel ---------- */
  later(function initReveal() {
    const els = $$('[data-reveal], [data-run], [data-map]');
    if (RM || !('IntersectionObserver' in window)) { els.forEach(el => el.classList.add('is-in')); return; }
    const io = new IntersectionObserver(es => {
      es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.01 });
    els.forEach(el => io.observe(el));
    // Sicherheitsnetz: was beim Springen über der Kante liegt, wird ebenfalls aufgedeckt
    addEventListener('scroll', () => {
      for (const el of els) { if (!el.classList.contains('is-in') && el.getBoundingClientRect().bottom < 0) { el.classList.add('is-in'); io.unobserve(el); } }
    }, { passive: true });
    // Checkliste: Kartons fallen nacheinander auf den Stapel
    const stages = $$('.cl__stage');
    stages.forEach((s, i) => { if (s.getBoundingClientRect().top > innerHeight) { s.classList.add('drop-pre'); s.style.setProperty('--r0', (i % 2 ? 3 : -3.5) + 'deg'); } });
    let batch = 0, bt = 0;
    const io2 = new IntersectionObserver(es => {
      es.forEach(e => {
        if (!e.isIntersecting) return;
        const s = e.target; io2.unobserve(s);
        if (!s.classList.contains('drop-pre')) return;
        s.style.animationDelay = (batch++ * 90) + 'ms';
        clearTimeout(bt); bt = setTimeout(() => { batch = 0; }, 120);
        s.classList.remove('drop-pre'); s.classList.add('drop-in');
      });
    }, { rootMargin: '0px 0px -6% 0px' });
    stages.forEach(s => io2.observe(s));
  });

  /* ---------- Anker (Lenis-sanft) ---------- */
  later(function initAnchors() {
    d.addEventListener('click', e => {
      const a = e.target.closest('a[href^="#"]'); if (!a) return;
      const id = a.getAttribute('href'); if (id.length < 2) return;
      const t = d.querySelector(id); if (!t) return;
      e.preventDefault();
      const off = id === '#inhalt' ? 0 : -(hdr.offsetHeight + 8);
      if (lenis) lenis.scrollTo(t, { offset: off, duration: 1.2 });
      else window.scrollTo({ top: t.getBoundingClientRect().top + scrollY + off, behavior: RM ? 'auto' : 'smooth' });
      if (history.replaceState) history.replaceState(null, '', id);
      if (id === '#inhalt') { t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true }); }
    });
  });

  /* ---------- Magnetische Buttons (nur feiner Zeiger) ---------- */
  later(function initMagnet() {
    if (RM || !FINE) return;
    $$('[data-magnet]').forEach(b => {
      b.addEventListener('pointermove', e => {
        const r = b.getBoundingClientRect();
        const dx = (e.clientX - r.left - r.width / 2) / r.width, dy = (e.clientY - r.top - r.height / 2) / r.height;
        b.style.translate = (dx * 10).toFixed(1) + 'px ' + (dy * 8).toFixed(1) + 'px';
      });
      b.addEventListener('pointerleave', () => { b.style.translate = ''; });
    });
  });

  function initMotion() {
    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);
    if (!RM && window.Lenis) {
      lenis = new Lenis({ lerp: 0.11, smoothWheel: true });
      window.__lenis = lenis;
      lenis.on('scroll', ScrollTrigger.update);
      lenis.on('scroll', onScroll);
      gsap.ticker.add(t => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }
    ScrollTrigger.addEventListener('refresh', layoutStops);
  }

  /* ---------- Aktiver Navigationspunkt ---------- */
  later(function initNavSpy() {
    const links = $$('.nav a'); const map = {};
    links.forEach(a => { map[a.getAttribute('href').slice(1)] = a; });
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) links.forEach(l => l.classList.toggle('is-active', l === map[e.target.id]));
    }), { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(id => { const s = d.getElementById(id); s && io.observe(s); });
  });

  /* ---------- Volumenrechner mit beladbarem LKW (isometrisch) ---------- */
  later(function initVolume() {
    const tabsEl = $('#volumen .tabs'), panelsEl = $('#volumen .vol__panels');
    if (!tabsEl) return;
    const counts = {};
    RAEUME.forEach(r => r.items.forEach(it => { counts[it[0]] = it[3]; }));
    const tabs = [], panels = [];
    RAEUME.forEach((r, ri) => {
      const tab = d.createElement('button');
      tab.type = 'button'; tab.className = 'tab'; tab.id = 'tab-' + r.id;
      tab.setAttribute('role', 'tab'); tab.setAttribute('aria-controls', 'pan-' + r.id);
      tab.setAttribute('aria-selected', ri === 0 ? 'true' : 'false'); tab.tabIndex = ri === 0 ? 0 : -1;
      const tn = d.createElement('span'); tn.textContent = r.name;
      const tc = d.createElement('span'); tc.className = 'tab__n'; tc.setAttribute('aria-hidden', 'true');
      tab.append(tn, tc); tabsEl.appendChild(tab); tabs.push(tab);
      const pan = d.createElement('div');
      pan.className = 'vol__panel'; pan.id = 'pan-' + r.id; pan.setAttribute('role', 'tabpanel');
      pan.setAttribute('aria-labelledby', tab.id); pan.tabIndex = 0; pan.hidden = ri !== 0;
      const ul = d.createElement('ul'); ul.className = 'items';
      r.items.forEach(([id, name, m3]) => {
        const li = d.createElement('li'); li.className = 'item'; li.dataset.id = id;
        const nm = d.createElement('span'); nm.className = 'item__name'; nm.id = 'it-' + id; nm.textContent = name;
        const vv = d.createElement('span'); vv.className = 'item__vol'; vv.textContent = nf1.format(m3).replace(',0', '') + ' m³ je Stück';
        if (m3 < 0.1) vv.textContent = '0,06 m³ je Stück';
        nm.appendChild(vv);
        const st = d.createElement('span'); st.className = 'step'; st.setAttribute('role', 'group'); st.setAttribute('aria-labelledby', 'it-' + id);
        const minus = d.createElement('button'); minus.type = 'button'; minus.className = 'minus'; minus.textContent = '−'; minus.setAttribute('aria-label', name + ': eins weniger');
        const out = d.createElement('output'); out.setAttribute('aria-live', 'polite');
        const plus = d.createElement('button'); plus.type = 'button'; plus.className = 'plus'; plus.textContent = '+'; plus.setAttribute('aria-label', name + ': eins mehr');
        minus.addEventListener('click', () => change(id, -1));
        plus.addEventListener('click', () => change(id, +1));
        st.append(minus, out, plus); li.append(nm, st); ul.appendChild(li);
      });
      pan.appendChild(ul); panelsEl.appendChild(pan); panels.push(pan);
    });
    function select(i, focus) {
      tabs.forEach((t, k) => { const on = k === i; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; panels[k].hidden = !on; });
      if (focus) tabs[i].focus();
      tabs[i].scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(i));
      t.addEventListener('keydown', e => {
        let n = null;
        if (e.key === 'ArrowRight') n = (i + 1) % tabs.length;
        else if (e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') n = 0; else if (e.key === 'End') n = tabs.length - 1;
        if (n !== null) { e.preventDefault(); select(n, true); }
      });
    });
    const MAX = 99;
    function change(id, dlt) { counts[id] = Math.max(0, Math.min(MAX, counts[id] + dlt)); render(); }

    // Isometrischer LKW: Laderaum als Kartonraster (Länge × 3 × 3), vordere Wand aufgeschnitten
    const svg = $('#lkw'); const NS = 'http://www.w3.org/2000/svg';
    const C30 = Math.cos(Math.PI / 6), W = 3, H = 3, S = 24;
    let currentKey = null, boxes = [];
    const el = (n, a, parent) => { const e = d.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); (parent || svg).appendChild(e); return e; };
    function drawTruck(t) {
      currentKey = t.key; svg.textContent = '';
      const L = t.cells;
      const P = (x, y, z) => [(x - y) * C30 * S, (x + y) * 0.5 * S - z * S];
      const minX = P(-2.9, W, 0)[0], maxX = P(L + .2, 0, 0)[0];
      const ox = 220 - (minX + maxX) / 2;
      const top = P(-2.9, 0, H + .3)[1], bot = P(L, W, -1.1)[1];
      const oy = 158 - (top + bot) / 2 + 12;
      const Q = pts => pts.map(([x, y, z]) => { const p = P(x, y, z); return (p[0] + ox).toFixed(1) + ',' + (p[1] + oy).toFixed(1); }).join(' ');
      const poly = (pts, fill, extra, parent) => el('polygon', Object.assign({ points: Q(pts), fill }, extra || {}), parent);
      const box = (x0, y0, z0, w, dd, h, top_, left, right, extra, parent) => {
        const x1 = x0 + w, y1 = y0 + dd, z1 = z0 + h;
        poly([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], top_, extra, parent);
        poly([[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]], right, extra, parent);
        poly([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], left, extra, parent);
      };
      poly([[-3.1, -.3, -1.1], [L + .5, -.3, -1.1], [L + .5, W + .7, -1.1], [-3.1, W + .7, -1.1]], '#0F1B3D', { opacity: .08 });
      box(-2.9, 0, -.75, 2.75, W, 3.05, '#FF9A4D', '#FF7A1A', '#E8650B');
      poly([[-2.6, W + .01, .9], [-1.2, W + .01, .9], [-1.2, W + .01, 2.0], [-2.75, W + .01, 2.0]], '#16285A');
      box(-2.9, .2, -.75, L + 2.9, W - .4, .6, '#1B2546', '#0A1230', '#121C3B');
      poly([[0, 0, 0], [L, 0, 0], [L, W, 0], [0, W, 0]], '#D6DCE8');
      poly([[0, 0, 0], [L, 0, 0], [L, 0, H], [0, 0, H]], '#22366A');
      poly([[0, 0, 0], [0, W, 0], [0, W, H], [0, 0, H]], '#1A2B57');
      for (let k = 1; k < L; k++) el('line', (() => { const a = P(k, 0, 0), b = P(k, 0, H); return { x1: a[0] + ox, y1: a[1] + oy, x2: b[0] + ox, y2: b[1] + oy, stroke: '#0F1B3D', 'stroke-width': 1, opacity: .45 }; })());
      // Kartons: Malreihenfolge hinten → vorn, Füllreihenfolge Fahrerhaus → Heck
      const cells = [];
      for (let x = 0; x < L; x++) for (let z = 0; z < H; z++) for (let y = 0; y < W; y++) cells.push({ x, y, z, i: cells.length });
      boxes = new Array(cells.length);
      cells.slice().sort((a, b) => (a.x + a.y + a.z) - (b.x + b.y + b.z) || a.z - b.z).forEach(c => {
        const g = el('g', { class: 'bx off' });
        const i = .05, x0 = c.x + i, y0 = c.y + i, z0 = c.z, s = 1 - 2 * i;
        box(x0, y0, z0, s, s, .94, '#DDBE98', '#C9A27A', '#B08A62', { stroke: '#8C6A47', 'stroke-width': .8, 'stroke-linejoin': 'round' }, g);
        const xm = x0 + s / 2;
        poly([[xm - .07, y0, z0 + .94], [xm + .07, y0, z0 + .94], [xm + .07, y0 + s, z0 + .94], [xm - .07, y0 + s, z0 + .94]], '#EBD6B6', null, g);
        boxes[c.i] = g;
      });
      // vordere Bordwand mit Schriftzug, Räder, aufgeschnittene Kanten
      poly([[0, W, 0], [L, W, 0], [L, W, .62], [0, W, .62]], '#0F1B3D');
      poly([[0, W + .01, .12], [L, W + .01, .12], [L, W + .01, .24], [0, W + .01, .24]], '#FF7A1A');
      const tp = P(.25, W, .3);
      const txt = el('text', { transform: `matrix(${C30.toFixed(4)},0.5,0,1,${(tp[0] + ox).toFixed(1)},${(tp[1] + oy).toFixed(1)})`, 'font-size': 9.5, 'font-weight': 900, fill: '#FAFAF7', class: 'van-word' });
      txt.textContent = 'ZUGVOGEL · ' + t.key.toUpperCase();
      [-1.55, L - 2.2, L - 1.05].forEach(wx => {
        const ring = [], hub = [];
        for (let k = 0; k < 20; k++) { const a = k / 20 * Math.PI * 2; ring.push([wx + .5 * Math.cos(a), W + .02, -.62 + .5 * Math.sin(a)]); hub.push([wx + .2 * Math.cos(a), W + .03, -.62 + .2 * Math.sin(a)]); }
        poly(ring, '#0A1230'); poly(hub, '#C8CFDD');
      });
      const edge = (a, b, dash) => { const p = P(...a), q = P(...b); el('line', { x1: p[0] + ox, y1: p[1] + oy, x2: q[0] + ox, y2: q[1] + oy, stroke: '#0F1B3D', 'stroke-width': 1.6, 'stroke-dasharray': dash ? '5 5' : 'none', 'stroke-linecap': 'round' }); };
      edge([0, 0, H], [L, 0, H]); edge([0, 0, H], [0, W, H]);
      edge([0, W, H], [L, W, H], true); edge([L, 0, H], [L, W, H], true); edge([L, W, .62], [L, W, H], true); edge([L, 0, 0], [L, 0, H]); edge([0, W, .62], [0, W, H], true);
      const lbl = el('text', { x: 8, y: 20, 'font-size': 13, 'font-family': 'Plex Mono, monospace', fill: '#0F1B3D', 'font-weight': 600 });
      lbl.textContent = t.key + ' · Laderaum ' + t.m3 + ' m³';
      void svg.getBoundingClientRect();
    }

    const outM3 = $('#vol-m3'), outTruck = $('#vol-truck'), bar = $('#vol-bar'), outLoad = $('#vol-load'), outItems = $('#vol-items'), outBoxes = $('#vol-boxes');
    let shown = 0, raf = 0;
    function tweenNumber(to) {
      cancelAnimationFrame(raf);
      if (RM) { shown = to; outM3.textContent = nf1.format(to); return; }
      const from = shown, t0 = performance.now(), dur = 280;
      const step = now => {
        const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        shown = from + (to - from) * e; outM3.textContent = nf1.format(shown);
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }
    function recommend(v) {
      if (v <= 0) return { trucks: [], main: LKW[0], fill: 0 };
      const fit = LKW.find(t => v <= t.m3);
      if (fit) return { trucks: [fit], main: fit, fill: v / fit.m3 };
      const big = LKW[LKW.length - 1]; const trucks = [];
      let rest = v;
      while (rest > big.m3) { trucks.push(big); rest -= big.m3; }
      trucks.push(LKW.find(t => rest <= t.m3));
      return { trucks, main: big, fill: 1, rest };
    }
    function render() {
      let vol = 0, items = 0, kartons = 0;
      RAEUME.forEach((r, ri) => {
        let roomN = 0;
        r.items.forEach(([id, , m3]) => {
          const n = counts[id]; vol += n * m3; roomN += n;
          if (KARTON_IDS.includes(id)) kartons += n; else items += n;
          const li = $('.item[data-id="' + id + '"]', panelsEl);
          $('output', li).textContent = n;
          $('.minus', li).disabled = n === 0;
          $('.plus', li).disabled = n >= MAX;
          li.classList.toggle('has', n > 0);
        });
        $('.tab__n', tabs[ri]).textContent = roomN;
      });
      vol = Math.round(vol * 10) / 10;
      tweenNumber(vol);
      const rec = recommend(vol);
      if (rec.main.key !== currentKey) drawTruck(rec.main);
      const nOn = Math.round(boxes.length * Math.min(1, rec.fill));
      let k = 0;
      boxes.forEach((b, i) => {
        const on = i < nOn;
        if (on === !b.classList.contains('off')) return;
        b.style.transitionDelay = RM ? '0ms' : Math.min(14, k++) * 22 + 'ms';
        b.classList.toggle('off', !on);
      });
      bar.style.transform = 'scaleX(' + Math.min(1, rec.fill).toFixed(3) + ')';
      bar.parentElement.classList.toggle('over', rec.trucks.length > 1);
      if (!rec.trucks.length) outTruck.textContent = 'Noch nichts ausgewählt.';
      else if (rec.trucks.length === 1) outTruck.textContent = 'Empfehlung: ' + lkwName(rec.main.key) + ' (bis ' + rec.main.m3 + ' m³)';
      else {
        const names = {}; rec.trucks.forEach(t => { names[t.key] = (names[t.key] || 0) + 1; });
        outTruck.textContent = 'Empfehlung: ' + Object.keys(names).map(k => names[k] + ' × ' + k).join(' + ') + ' – zwei Touren oder zwei Fahrzeuge';
      }
      const cap = rec.trucks.reduce((s, t) => s + t.m3, 0);
      outLoad.textContent = cap ? Math.round(vol / cap * 100) + ' %' : '0 %';
      outItems.textContent = items;
      outBoxes.textContent = kartons;
      volumeShared = vol;
      d.dispatchEvent(new CustomEvent('zv:volume', { detail: { vol, trucks: rec.trucks } }));
    }
    const defaults = Object.assign({}, counts);
    $('#vol-reset').addEventListener('click', () => { Object.assign(counts, defaults); render(); });
    render();
  });

  /* ---------- Kostenschätzung als Frachtbrief ---------- */
  later(function initCost() {
    const form = $('#cost-form'); if (!form) return;
    const vol = $('#c-vol'), km = $('#c-km'), volO = $('#c-vol-o'), kmO = $('#c-km-o');
    const sumEl = $('#rc-sum'), crewEl = $('#rc-crew'), linesEl = $('#rc-lines'), noEl = $('#rc-no'), hint = $('#c-vol-h');
    const fVol = $('#fb-vol'), fKm = $('#fb-km'), fFl = $('#fb-fl'), fPack = $('#fb-pack'), fHv = $('#fb-hv');
    const chips = $$('.chip', form);
    const fill = r => r.style.setProperty('--p', ((r.value - r.min) / (r.max - r.min) * 100).toFixed(2) + '%');
    function truckFor(v) {
      const fit = LKW.find(t => v <= t.m3); if (fit) return [fit];
      const out = []; let rest = v; const big = LKW[LKW.length - 1];
      while (rest > big.m3) { out.push(big); rest -= big.m3; } out.push(LKW.find(t => rest <= t.m3)); return out;
    }
    const flName = (fl, lift) => (fl ? fl + '. OG' : 'EG') + (lift ? ' (Aufzug)' : '');
    let last = '';
    function calc() {
      const v = +vol.value, k = +km.value;
      const f1 = +form.f1.value, f2 = +form.f2.value, l1 = form.l1.checked, l2 = form.l2.checked;
      const pack = form.pack.value, hv = (form.hv1.checked ? 1 : 0) + (form.hv2.checked ? 1 : 0);
      const trucks = truckFor(v);
      const crew = v <= 12 ? 2 : v <= 30 ? 3 : v <= 50 ? 4 : 5 + Math.floor((v - 50) / 25);
      const tragen = Math.max(KOSTEN.MIN_STUNDEN, 2 * v / (crew * KOSTEN.LEISTUNG_M3_PERSON_H));
      const fahrtH = k <= KOSTEN.KM_FREI ? 0.5 : k / KOSTEN.FAHRT_KMH;
      const stunden = tragen + fahrtH;
      const lines = [];
      lines.push(['Team: ' + crew + ' Personen × ' + nf1.format(stunden).replace(',0', '') + ' Std.', crew * stunden * KOSTEN.STUNDENSATZ_PERSON]);
      lines.push([trucks.map(t => lkwName(t.key)).join(' + ') + ' inkl. Anfahrt', trucks.reduce((s, t) => s + KOSTEN.LKW_TAG[t.key], 0) + KOSTEN.ANFAHRT]);
      if (k > KOSTEN.KM_FREI) lines.push(['Strecke ' + nf0.format(k) + ' km', (k - KOSTEN.KM_FREI) * KOSTEN.KM_SATZ * trucks.length]);
      if (k >= KOSTEN.UEBERNACHTUNG_AB_KM) lines.push(['Übernachtung Team', crew * KOSTEN.UEBERNACHTUNG_PERSON]);
      const etage = (fl, lift) => lift ? v * KOSTEN.MIT_AUFZUG : v * fl * KOSTEN.ETAGE_OHNE_AUFZUG;
      const et = etage(f1, l1) + etage(f2, l2);
      if (et > 0) lines.push(['Etagen: ' + flName(f1, l1) + ' → ' + flName(f2, l2), et]);
      if (KOSTEN.PACK[pack]) lines.push([pack === 'teil' ? 'Packservice Zerbrechliches' : 'Packservice komplett', v * KOSTEN.PACK[pack]]);
      if (hv) lines.push(['Halteverbotszone × ' + hv, hv * KOSTEN.HALTEVERBOT]);
      const total = lines.reduce((s, l) => s + l[1], 0);
      const r = x => Math.round(x / KOSTEN.RUNDEN) * KOSTEN.RUNDEN;
      const lo = r(total * KOSTEN.SPANNE[0]), hi = r(total * KOSTEN.SPANNE[1]);
      volO.textContent = nf1.format(v).replace(',0', '') + ' m³';
      kmO.textContent = nf0.format(k) + ' km';
      const txt = eur(lo) + ' – ' + eur(hi);
      if (txt !== last) {
        sumEl.textContent = txt; last = txt;
        if (!RM) { sumEl.classList.remove('tick'); void sumEl.offsetWidth; sumEl.classList.add('tick'); }
      }
      crewEl.textContent = crew + ' Personen · ca. ' + nf0.format(Math.ceil(stunden)) + ' Std. · ' + trucks.map(t => lkwName(t.key)).join(' + ');
      linesEl.textContent = '';
      lines.forEach(([a, b]) => {
        const li = d.createElement('li'); const s1 = d.createElement('span'); const s2 = d.createElement('span');
        s1.textContent = a; s2.textContent = 'ca. ' + eur(r(b)); li.append(s1, s2); linesEl.appendChild(li);
      });
      fVol.textContent = volO.textContent; fKm.textContent = kmO.textContent;
      fFl.textContent = flName(f1, l1) + ' → ' + flName(f2, l2);
      fPack.textContent = { ohne: 'ohne', teil: 'Zerbrechliches', komplett: 'komplett' }[pack];
      fHv.textContent = hv === 0 ? 'keine' : hv === 2 ? 'am Auszug und am Einzug' : form.hv1.checked ? 'am Auszug' : 'am Einzug';
      noEl.textContent = String(1000 + Math.round(v * 7 + k * 3) % 9000).padStart(4, '0');
      chips.forEach(c => c.classList.toggle('is-on', +c.dataset.km === k));
      fill(vol); fill(km);
    }
    form.addEventListener('input', e => { if (e.target === vol) hint.textContent = 'eigener Wert – Volumenrechner überschreibt bei Änderung'; calc(); });
    form.addEventListener('change', calc);
    form.addEventListener('submit', e => e.preventDefault());
    chips.forEach(c => c.addEventListener('click', () => { km.value = c.dataset.km; calc(); }));
    d.addEventListener('zv:volume', e => {
      const v = Math.max(+vol.min, Math.min(+vol.max, Math.round(e.detail.vol * 2) / 2));
      vol.value = v; hint.textContent = 'aus dem Volumenrechner übernommen';
      calc();
    });
    if (volumeShared != null) { vol.value = Math.max(3, Math.round(volumeShared * 2) / 2); hint.textContent = 'aus dem Volumenrechner übernommen'; }
    calc();
  });

  /* ---------- Etappen: horizontale Strecke (sticky + Scrub), LKW hält an jeder Etappe ---------- */
  function initStages() {
    const sec = $('#ablauf'); if (!sec || RM || !window.gsap || !window.ScrollTrigger) return;
    const track = $('.etappen__track', sec), asphalt = $('.etappen__asphalt', sec), fillEl = $('.etappen__line-fill', sec), van = $('.etappen__van', sec);
    const stages = $$('.stage', sec);
    let pos = [], len = 0;
    function measure() {
      const pad = stages[0].offsetLeft;
      pos = stages.map(s => -(s.offsetLeft - pad));
      len = Math.abs(pos[pos.length - 1]) * 1.5;
      sec.style.height = Math.round(innerHeight + len) + 'px';
    }
    const n = stages.length - 1, HOLD = .3;
    const mm = gsap.matchMedia();
    mm.add('(min-width: 900px) and (min-height: 600px)', () => {
      sec.classList.add('is-h');
      measure();
      ScrollTrigger.addEventListener('refreshInit', measure);
      let lastStop = -1, lastX = 0, tilt = 0;
      const st = ScrollTrigger.create({
        trigger: sec, start: 'top top', end: () => '+=' + len, invalidateOnRefresh: true,
        onUpdate(self) {
          const p = Math.min(1, self.progress / .92);
          const s = p * n; let i = Math.min(n - 1, Math.floor(s)); let f = s - i; if (s >= n) { i = n - 1; f = 1; }
          const k = f < HOLD ? 0 : (f - HOLD) / (1 - HOLD), e = k * k * (3 - 2 * k);
          const x = pos[i] + (pos[i + 1] - pos[i]) * e;
          track.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,0)';
          asphalt.style.transform = 'translate3d(' + (x % 76).toFixed(1) + 'px,0,0)';
          fillEl.style.transform = 'scaleX(' + self.progress.toFixed(4) + ')';
          const v = x - lastX; lastX = x;
          tilt += (Math.max(-2.2, Math.min(2.2, v * .09)) - tilt) * .3;
          van.style.transform = 'rotate(' + tilt.toFixed(2) + 'deg) translateY(' + (Math.abs(v) > .5 ? Math.sin(self.progress * 220) * .8 : 0).toFixed(2) + 'px)';
          const stop = Math.round(i + e);
          if (stop !== lastStop) { lastStop = stop; stages.forEach((el, j) => el.classList.toggle('is-on', j <= stop)); }
        }
      });
      return () => {
        ScrollTrigger.removeEventListener('refreshInit', measure);
        st.kill(); sec.classList.remove('is-h'); sec.style.height = ''; track.style.transform = '';
      };
    });
  }

  /* ---------- Straßen-Etappen: LKW fährt mit dem Scroll durchs Bild ---------- */
  function initRoads() {
    if (RM || !window.ScrollTrigger) return;
    $$('[data-road]').forEach(road => {
      const van = $('.road__van', road);
      let lastP = 0, tilt = 0;
      ScrollTrigger.create({
        trigger: road, start: 'top bottom', end: 'bottom top',
        onUpdate(self) {
          const w = road.clientWidth, p = self.progress;
          const v = (p - lastP) * 400; lastP = p;
          tilt += (Math.max(-3, Math.min(3, -v)) - tilt) * .25;
          van.style.transform = 'translateX(' + (-150 + p * (w + 170)).toFixed(1) + 'px) rotate(' + tilt.toFixed(2) + 'deg)';
        }
      });
    });
  }

  /* ---------- Checkliste als Kartonstapel ---------- */
  later(function initChecklist() {
    const sec = $('#checkliste'); if (!sec) return;
    const boxes = $$('input[name="t"]', sec), stages = $$('.cl__stage', sec), stk = $$('.stk', sec);
    const doneEl = $('#cl-done'), totalEl = $('#cl-total'), bar = $('#cl-bar'), status = $('#cl-status'), dateIn = $('#cl-date');
    const saved = store.get(CL_KEY) || {};
    const done = new Set(Array.isArray(saved.done) ? saved.done : []);
    boxes.forEach(b => { b.checked = done.has(b.value); });
    if (typeof saved.date === 'string') dateIn.value = saved.date;
    totalEl.textContent = boxes.length;
    const fmt = new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
    function save() { store.set(CL_KEY, { done: boxes.filter(b => b.checked).map(b => b.value), date: dateIn.value || '' }); }
    function dates() {
      const v = dateIn.value; const base = v ? new Date(v + 'T12:00:00') : null;
      stages.forEach(s => {
        const o = $('.cl__date-o', s);
        if (!base || isNaN(base)) { o.textContent = ''; return; }
        const dt = new Date(base); dt.setDate(dt.getDate() + (+s.dataset.off));
        o.textContent = (+s.dataset.off === 0 ? '' : 'ab ') + fmt.format(dt);
      });
    }
    function update(announce) {
      const n = boxes.filter(b => b.checked).length;
      doneEl.textContent = n;
      bar.style.transform = 'scaleX(' + (n / boxes.length).toFixed(3) + ')';
      stages.forEach((s, i) => {
        const all = $$('input', s).every(b => b.checked);
        s.classList.toggle('done', all);
        const k = stk.find(g => +g.dataset.stk === i); if (k) k.classList.toggle('is-done', all);
      });
      if (announce !== false) {
        const next = stages.find(s => !s.classList.contains('done'));
        status.textContent = n === 0 ? 'Noch nichts abgehakt.' : n === boxes.length ? 'Alles erledigt – willkommen im neuen Zuhause!' :
          n + ' von ' + boxes.length + ' erledigt' + (next ? ' · als Nächstes: ' + $('.cl__when p', next).textContent : '');
      }
    }
    sec.addEventListener('change', e => { if (e.target.name === 't') { update(); save(); } });
    dateIn.addEventListener('change', () => { dates(); save(); });
    $('#cl-reset').addEventListener('click', () => { boxes.forEach(b => { b.checked = false; }); dateIn.value = ''; dates(); update(); save(); });
    dates(); update();
  });

  /* ---------- Anfrageformular ---------- */
  later(function initForm() {
    const form = $('#anf-form'), ok = $('#anf-ok'), err = $('#f-err'), volP = $('#f-vol');
    if (!form) return;
    const volText = v => 'Aus dem Volumenrechner: ca. ' + nf1.format(v) + ' m³ – wird mit der Anfrage übernommen.';
    d.addEventListener('zv:volume', e => { volP.hidden = false; volP.textContent = volText(e.detail.vol); });
    if (volumeShared != null) { volP.hidden = false; volP.textContent = volText(volumeShared); }
    const check = {
      name: v => v.trim().length >= 2 || 'Bitte geben Sie Ihren Namen an.',
      tel: v => /^[+()\d\s/-]{6,}$/.test(v.trim()) || 'Bitte prüfen Sie die Telefonnummer.',
      mail: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Bitte prüfen Sie die E-Mail-Adresse.',
      von: v => v.trim().length >= 4 || 'Bitte geben Sie die Auszugsadresse (PLZ, Ort) an.',
      nach: v => v.trim().length >= 4 || 'Bitte geben Sie die Einzugsadresse (PLZ, Ort) an.'
    };
    function validate(field) {
      const fn = check[field.name]; if (!fn) return true;
      const res = fn(field.value); const bad = res !== true;
      field.setAttribute('aria-invalid', bad ? 'true' : 'false');
      return bad ? res : true;
    }
    form.addEventListener('blur', e => { if (check[e.target.name] && e.target.value) validate(e.target); }, true);
    form.addEventListener('input', e => { if (e.target.getAttribute('aria-invalid') === 'true') validate(e.target); });
    form.addEventListener('submit', e => {
      e.preventDefault();
      let first = null, msg = '';
      Object.keys(check).forEach(n => { const r = validate(form.elements[n]); if (r !== true && !first) { first = form.elements[n]; msg = r; } });
      const ds = form.elements.ds;
      if (!first && !ds.checked) { first = ds; msg = 'Bitte bestätigen Sie die Datenschutzhinweise.'; }
      ds.setAttribute('aria-invalid', ds.checked ? 'false' : 'true');
      if (first) { err.textContent = msg; first.focus(); return; }
      err.textContent = '';
      const sum = $('#ok-sum'); sum.textContent = '';
      const dateV = form.elements.datum.value;
      const rows = [['Name', form.elements.name.value], ['Telefon', form.elements.tel.value], ['E-Mail', form.elements.mail.value],
        ['Strecke', form.elements.von.value + ' → ' + form.elements.nach.value], ['Wunschtermin', dateV ? new Date(dateV + 'T12:00:00').toLocaleDateString('de-DE') : 'offen'],
        ['Art', form.elements.art.value], ['Besichtigung', form.elements.besicht.value]];
      if (volumeShared) rows.push(['Volumen', 'ca. ' + nf1.format(volumeShared) + ' m³']);
      if (form.elements.msg.value.trim()) rows.push(['Nachricht', form.elements.msg.value.trim()]);
      rows.forEach(([k, v]) => { const div = d.createElement('div'); const dt = d.createElement('dt'); const dd = d.createElement('dd'); dt.textContent = k; dd.textContent = v; div.append(dt, dd); sum.appendChild(div); });
      form.hidden = true; ok.hidden = false; ok.focus();
    });
    $('#ok-back').addEventListener('click', () => { ok.hidden = true; form.hidden = false; form.reset(); $$('[aria-invalid]', form).forEach(f => f.removeAttribute('aria-invalid')); form.elements.name.focus(); });
  });

  /* ---------- Abschnitte schrittweise rendern, danach GSAP, ScrollTrigger, Lenis nachladen ---------- */
  const VENDOR = ['gsap.min.js', 'ScrollTrigger.min.js', 'lenis.min.js'];
  function loadVendors() {
    if (RM) { layoutStops(); return; }
    let k = 0;
    const next = () => {
      if (k >= VENDOR.length) {
        setTimeout(() => { initMotion(); setTimeout(() => { initStages(); setTimeout(() => { initRoads(); setTimeout(() => window.ScrollTrigger ? ScrollTrigger.refresh() : layoutStops(), 30); }, 20); }, 30); }, 30);
        return;
      }
      const sc = d.createElement('script');
      sc.src = '/arena/umzug-zugvogel/assets/vendor/' + VENDOR[k++];
      sc.onload = () => setTimeout(next, 20);
      sc.onerror = () => setTimeout(next, 20);
      d.head.appendChild(sc);
    };
    next();
  }
  later(function releaseDeferred() {
    const cv = $$('[data-cv]');
    const step = () => {
      const el = cv.shift();
      if (!el) { loadVendors(); return; }
      el.removeAttribute('data-cv'); void el.offsetHeight; // ein Abschnitt pro Task
      setTimeout(() => schedule(step), 16);
    };
    setTimeout(() => schedule(step), 60);
  });
  let rz = 0;
  addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(layoutStops, 200); });

  function boot() { layoutStops(); schedule(runQueue); }
  if (d.readyState === 'complete') boot(); else addEventListener('load', boot, { once: true });
})();
