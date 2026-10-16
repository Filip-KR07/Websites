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
  { key: '3,5 t', m3: 20, len: 200 },
  { key: '7,5 t', m3: 38, len: 255 },
  { key: '12 t', m3: 54, len: 300 }
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
  const $ = (s, c) => (c || d).querySelector(s);
  const $$ = (s, c) => Array.from((c || d).querySelectorAll(s));
  const nf1 = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const nf0 = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 });
  const eur = v => nf0.format(v) + ' €';
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* privat/gesperrt */ } }
  };
  const hdr = $('.hd');
  let lenis = null;
  let volumeShared = null; // Volumen aus dem Rechner → Kosten & Formular

  /* ---------- Header: Schatten + Packband-Fortschritt ---------- */
  const tapeFill = $('.hd__tape-fill');
  let ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const y = window.scrollY, max = root.scrollHeight - innerHeight;
      hdr.classList.toggle('is-scrolled', y > 8);
      tapeFill.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0).toFixed(4) + ')';
    });
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

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

  /* ---------- Hero-Szene: einmal abspielen, dann ruhig ---------- */
  const scene = $('.zv-scene'), replay = $('.replay');
  if (scene && replay && !RM) {
    setTimeout(() => { replay.hidden = false; }, 4900);
    replay.addEventListener('click', () => {
      scene.classList.remove('is-playing');
      void scene.getBoundingClientRect();
      scene.classList.add('is-playing');
      replay.hidden = true;
      setTimeout(() => { replay.hidden = false; }, 4900);
    });
  }

  /* ================= Warteschlange: alles unterhalb des ersten Bildschirms ================= */
  const queue = [];
  const later = fn => queue.push(fn);
  function runQueue() {
    const t0 = performance.now();
    while (queue.length && performance.now() - t0 < 18) {
      const fn = queue.shift();
      try { performance.mark('zv:' + fn.name); fn(); } catch (err) { console.warn(err); }
    }
    if (queue.length) schedule(runQueue);
  }
  const schedule = fn => ('requestIdleCallback' in window) ? requestIdleCallback(fn, { timeout: 120 }) : setTimeout(fn, 16);

  /* ---------- Reveal ---------- */
  later(function initReveal() {
    const els = $$('[data-reveal]');
    els.forEach(el => { if (el.classList.contains('rail') || el.classList.contains('fleet')) Array.from(el.children).forEach((c, i) => c.style.setProperty('--i', i)); });
    if (RM || !('IntersectionObserver' in window)) { els.forEach(el => el.classList.add('is-in')); return; }
    const io = new IntersectionObserver(es => {
      es.forEach(e => {
        if (!e.isIntersecting) return;
        // alles davor ebenfalls aufdecken (bei schnellem Springen)
        const idx = els.indexOf(e.target);
        for (let i = 0; i <= idx; i++) { if (!els[i].classList.contains('is-in')) { els[i].classList.add('is-in'); io.unobserve(els[i]); } }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.01 });
    els.forEach(el => io.observe(el));
  });

  /* ---------- Lenis + GSAP ---------- */
  later(function initAnchors() {
    d.addEventListener('click', e => {
      const a = e.target.closest('a[href^="#"]'); if (!a) return;
      const id = a.getAttribute('href'); if (id.length < 2) return;
      const t = d.querySelector(id); if (!t) return;
      e.preventDefault();
      const off = id === '#inhalt' ? 0 : -(hdr.offsetHeight + 8);
      if (lenis) lenis.scrollTo(t, { offset: off, duration: 1.1 });
      else window.scrollTo({ top: t.getBoundingClientRect().top + scrollY + off, behavior: RM ? 'auto' : 'smooth' });
      if (history.replaceState) history.replaceState(null, '', id);
      if (id === '#inhalt') { t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true }); }
    });
  });

  function initMotion() {
    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);
    if (!RM && window.Lenis) {
      lenis = new Lenis({ lerp: 0.12, smoothWheel: true });
      window.__lenis = lenis;
      lenis.on('scroll', ScrollTrigger.update);
      lenis.on('scroll', onScroll);
      gsap.ticker.add(t => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }
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

  /* ---------- Volumenrechner ---------- */
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

    // LKW-Grafik (Seitenansicht), Laderaum aus Kartons
    const svg = $('#lkw'); const NS = 'http://www.w3.org/2000/svg';
    let currentKey = null, boxes = [];
    const el = (n, a) => { const e = d.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); return e; };
    function drawTruck(t) {
      currentKey = t.key; svg.textContent = '';
      const L = t.len, x0 = 12, top = 20, H = 96, base = top + H;
      svg.appendChild(el('rect', { x: x0, y: top, width: L, height: H, rx: 4, fill: '#F0EFE8', stroke: '#0F1B3D', 'stroke-width': 2 }));
      // Fahrerhaus rechts
      const cx = x0 + L + 4;
      svg.appendChild(el('path', { d: `M${cx} ${top + 30}h46l26 30v${H - 34}H${cx}z`, fill: '#FF7A1A', stroke: '#0F1B3D', 'stroke-width': 2, 'stroke-linejoin': 'round' }));
      svg.appendChild(el('path', { d: `M${cx + 8} ${top + 38}h34l18 22h-52z`, fill: '#16285A' }));
      svg.appendChild(el('rect', { x: x0 - 4, y: base, width: L + 84, height: 8, rx: 2, fill: '#0F1B3D' }));
      [x0 + 34, x0 + L - 40, cx + 50].forEach(wx => {
        svg.appendChild(el('circle', { cx: wx, cy: base + 12, r: 13, fill: '#0F1B3D' }));
        svg.appendChild(el('circle', { cx: wx, cy: base + 12, r: 5, fill: '#C8CFDD' }));
      });
      const lbl = el('text', { x: x0 + 10, y: top - 6, 'font-size': 13, 'font-family': 'Plex Mono, monospace', fill: '#0F1B3D', 'font-weight': 600 });
      lbl.textContent = t.key + ' · Laderaum ' + t.m3 + ' m³';
      svg.appendChild(lbl);
      // Kartonraster: Spalten vom Fahrerhaus nach hinten, unten nach oben
      const rows = 4, bw = 22, bh = 22, gap = 2;
      const cols = Math.floor((L - 8) / (bw + gap));
      boxes = [];
      const g = el('g', {});
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const bx = x0 + L - 4 - (c + 1) * (bw + gap) + gap, by = base - 4 - (r + 1) * (bh + gap) + gap;
          const b = el('g', { class: 'bx off' });
          b.appendChild(el('rect', { x: bx, y: by, width: bw, height: bh, rx: 2, fill: '#C9A27A', stroke: '#8C6A47', 'stroke-width': 1 }));
          b.appendChild(el('rect', { x: bx + bw / 2 - 2, y: by, width: 4, height: bh * .45, fill: '#EBD6B6' }));
          g.appendChild(b); boxes.push(b);
        }
      }
      svg.appendChild(g);
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
      boxes.forEach((b, i) => {
        const on = i < nOn;
        if (on === !b.classList.contains('off')) return;
        b.style.transitionDelay = RM ? '0ms' : (Math.abs(i - nOn) % 12) * 14 + 'ms';
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

  /* ---------- Kostenschätzung ---------- */
  later(function initCost() {
    const form = $('#cost-form'); if (!form) return;
    const vol = $('#c-vol'), km = $('#c-km'), volO = $('#c-vol-o'), kmO = $('#c-km-o');
    const sumEl = $('#rc-sum'), crewEl = $('#rc-crew'), linesEl = $('#rc-lines'), noEl = $('#rc-no'), hint = $('#c-vol-h');
    const chips = $$('.chip', form);
    let userTouchedVol = false;
    const fill = r => r.style.setProperty('--p', ((r.value - r.min) / (r.max - r.min) * 100).toFixed(2) + '%');
    function truckFor(v) {
      const fit = LKW.find(t => v <= t.m3); if (fit) return [fit];
      const out = []; let rest = v; const big = LKW[LKW.length - 1];
      while (rest > big.m3) { out.push(big); rest -= big.m3; } out.push(LKW.find(t => rest <= t.m3)); return out;
    }
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
      if (et > 0) lines.push(['Etagen: ' + (f1 ? f1 + '. OG' : 'EG') + (l1 ? ' (Aufzug)' : '') + ' → ' + (f2 ? f2 + '. OG' : 'EG') + (l2 ? ' (Aufzug)' : ''), et]);
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
      noEl.textContent = String(1000 + Math.round(v * 7 + k * 3) % 9000).padStart(4, '0');
      chips.forEach(c => c.classList.toggle('is-on', +c.dataset.km === k));
      fill(vol); fill(km);
    }
    form.addEventListener('input', e => { if (e.target === vol) { userTouchedVol = true; hint.textContent = 'eigener Wert – Volumenrechner überschreibt bei Änderung'; } calc(); });
    form.addEventListener('change', calc);
    form.addEventListener('submit', e => e.preventDefault());
    chips.forEach(c => c.addEventListener('click', () => { km.value = c.dataset.km; calc(); }));
    d.addEventListener('zv:volume', e => {
      const v = Math.max(+vol.min, Math.min(+vol.max, Math.round(e.detail.vol * 2) / 2));
      vol.value = v; userTouchedVol = false; hint.textContent = 'aus dem Volumenrechner übernommen';
      calc();
    });
    if (volumeShared != null) { vol.value = Math.max(3, Math.round(volumeShared * 2) / 2); hint.textContent = 'aus dem Volumenrechner übernommen'; }
    void userTouchedVol;
    calc();
  });

  /* ---------- Etappen: horizontale Strecke (sticky + Scrub) ---------- */
  function initStages() {
    const sec = $('#ablauf'); if (!sec || RM || !window.gsap || !window.ScrollTrigger) return;
    const sticky = $('.etappen__sticky', sec), track = $('.etappen__track', sec);
    const fillEl = $('.etappen__line-fill', sec), van = $('.etappen__van', sec), stops = $$('.etappen__stop', sec), route = $('.etappen__route', sec);
    let dist = 0, routeW = 0;
    function measure() {
      dist = Math.max(0, track.scrollWidth - innerWidth);
      sec.style.height = (innerHeight + dist) + 'px';
      routeW = route.clientWidth - 40;
    }
    const mm = gsap.matchMedia();
    mm.add('(min-width: 900px) and (min-height: 600px)', () => {
      sec.classList.add('is-h');
      measure();
      ScrollTrigger.addEventListener('refreshInit', measure);
      let lastStop = -1;
      const tw = gsap.to(track, {
        x: () => -dist, ease: 'none',
        scrollTrigger: {
          trigger: sec, start: 'top top', end: () => '+=' + dist, scrub: 0.5, invalidateOnRefresh: true,
          onUpdate(self) {
            const p = self.progress;
            fillEl.style.transform = 'scaleX(' + p.toFixed(4) + ')';
            van.style.transform = 'translateX(' + (p * routeW).toFixed(1) + 'px)';
            const s = Math.min(3, Math.floor(p * 3 + 0.15));
            if (s !== lastStop) { lastStop = s; stops.forEach((el, i) => el.classList.toggle('is-on', i <= s)); }
          }
        }
      });
      void sticky;
      return () => {
        ScrollTrigger.removeEventListener('refreshInit', measure);
        tw.scrollTrigger && tw.scrollTrigger.kill(); tw.kill();
        sec.classList.remove('is-h'); sec.style.height = ''; gsap.set(track, { clearProps: 'transform' });
      };
    });
  }

  /* ---------- Checkliste ---------- */
  later(function initChecklist() {
    const sec = $('#checkliste'); if (!sec) return;
    const boxes = $$('input[name="t"]', sec), stages = $$('.cl__stage', sec);
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
      stages.forEach(s => { const bs = $$('input', s); s.classList.toggle('done', bs.every(b => b.checked)); });
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
    d.addEventListener('zv:volume', e => {
      volP.hidden = false;
      volP.textContent = 'Aus dem Volumenrechner: ca. ' + nf1.format(e.detail.vol) + ' m³ – wird mit der Anfrage übernommen.';
    });
    if (volumeShared != null) { volP.hidden = false; volP.textContent = 'Aus dem Volumenrechner: ca. ' + nf1.format(volumeShared) + ' m³ – wird mit der Anfrage übernommen.'; }
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
    if (RM) return; // ohne Bewegung: keine Scroll-Choreografie nötig
    let k = 0;
    const next = () => {
      if (k >= VENDOR.length) {
        setTimeout(() => { initMotion(); setTimeout(() => { initStages(); setTimeout(() => window.ScrollTrigger && ScrollTrigger.refresh(), 30); }, 30); }, 30);
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

  function boot() { schedule(runQueue); }
  if (d.readyState === 'complete') boot(); else addEventListener('load', boot, { once: true });
})();
