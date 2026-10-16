/* Raumlinie Architekten – Modell „Grundriss“ (Demo)
   Start in Etappen: Header, Menü und Hero sofort; alles darunter in einer Warteschlange. */
(() => {
  'use strict';

  /* ===== Kostenrahmen: Kennwerte (Beispielwerte, brutto, Preisstand 2026, Region Stuttgart) =====
     €/m² Bruttogeschossfläche für Bauwerk = Kostengruppen 300 + 400 nach DIN 276.
     Hier anpassen, wenn das Büro eigene Erfahrungswerte hat. */
  const KOSTEN = {
    neubau:      { einfach: [2300, 2800], mittel: [2800, 3400], gehoben: [3400, 4400] },
    umbau:       { einfach: [1400, 1900], mittel: [1900, 2600], gehoben: [2600, 3600] },
    aufstockung: { einfach: [2700, 3200], mittel: [3200, 3900], gehoben: [3900, 4900] },
  };
  const NEBENKOSTEN = [0.21, 0.24];   // KG 700 inkl. Planungshonorar, Anteil am Bauwerk
  const RUNDUNG = 1000;               // Ergebnis auf volle 1.000 € runden
  const STANDARD_TEXT = {
    einfach: 'Einfach: Kunststofffenster, Vinyl oder Fliese, Standard-Haustechnik, wenig Einbauten.',
    mittel: 'Mittel: Holz-Alu-Fenster, Parkett, Fußbodenheizung mit Wärmepumpe.',
    gehoben: 'Gehoben: große Verglasungen, Naturstein, Einbaumöbel, Lüftungsanlage, Smart Home.',
  };
  const ART_TEXT = { neubau: 'Neubau', umbau: 'Umbau / Sanierung', aufstockung: 'Aufstockung' };

/*MODEL*/
/* Hausmodell für die Hero-Zeichnung: Maße in Metern (x = Breite, y = Höhe, z = Tiefe).
   project(t): t = 0 → Ansicht Süd (Orthogonal), t = 1 → Axonometrie. */
const HAUS = (() => {
  const L = (a, b, k) => ({ p: [a, b], k });
  const R = (pts, k) => ({ p: pts, k, closed: true });
  const E = [];
  // Hauptkörper mit Satteldach (x 0–10, z 0–8, Traufe 6, First 9)
  const A0 = [0, 0, 0], B0 = [10, 0, 0], C0 = [10, 6, 0], D0 = [0, 6, 0], R0 = [5, 9, 0];
  const A1 = [0, 0, 8], B1 = [10, 0, 8], C1 = [10, 6, 8], D1 = [0, 6, 8], R1 = [5, 9, 8];
  E.push(L(A0, B0, 'k'), L(B0, C0, 'k'), L(C0, R0, 'k'), L(R0, D0, 'k'), L(D0, [0, 3.4, 0], 'k'));
  E.push(L(B1, C1, 'k'), L(C1, R1, 'k'), L(R1, D1, 'k'));
  E.push(L(B0, B1, 'k'), L(C0, C1, 'k'), L(D0, D1, 'k'), L(R0, R1, 'k'));
  E.push(L(A1, B1, 'h'), L(D1, A1, 'h'), L(A0, A1, 'h'));
  // Anbau mit Flachdach (x -5–0, z 0–6, Höhe 3,4)
  const F0 = [-5, 0, 0], G0 = [-5, 3.4, 0], H0 = [0, 3.4, 0], F1 = [-5, 0, 6], G1 = [-5, 3.4, 6], H1 = [0, 3.4, 6];
  E.push(L(F0, A0, 'k'), L(F0, G0, 'k'), L(G0, H0, 'k'), L(G0, G1, 'k'), L(G1, H1, 'k'), L(H0, H1, 'k'));
  E.push(L(F0, F1, 'h'), L(F1, G1, 'h'), L(F1, [0, 0, 6], 'h'));
  // Attika-Linie Anbau
  E.push(L([-5, 3.1, 0], [0, 3.1, 0], 'f'));
  // Öffnungen Südfassade
  const rect = (x1, y1, x2, y2, z, k) => R([[x1, y1, z], [x2, y1, z], [x2, y2, z], [x1, y2, z]], k);
  E.push(rect(1.2, 0, 4.6, 2.6, 0, 'w'), rect(6.6, 0, 7.8, 2.4, 0, 'w'));
  E.push(rect(1.6, 3.6, 3.6, 5.0, 0, 'w'), rect(6.4, 3.6, 8.4, 5.0, 0, 'w'), rect(4.4, 6.6, 5.6, 7.7, 0, 'w'));
  E.push(rect(-4.4, 0.5, -0.7, 2.6, 0, 'w'));
  E.push(L([2.9, 0, 0], [2.9, 2.6, 0], 'f'), L([1.6, 4.3, 0], [3.6, 4.3, 0], 'f'), L([6.4, 4.3, 0], [8.4, 4.3, 0], 'f'));
  // Öffnungen Ostfassade (x = 10)
  const side = (z1, y1, z2, y2, k) => R([[10, y1, z1], [10, y1, z2], [10, y2, z2], [10, y2, z1]], k);
  E.push(side(2, 3.6, 4.2, 5.0, 'w'), side(5, 0.8, 7, 2.6, 'w'));
  // Dachflächenfenster (rechte Dachfläche)
  const roof = (s1, s2, z1, z2) => { const P = s => [5 + 5 * s, 9 - 3 * s, 0]; const a = P(s1), b = P(s2); return R([[a[0], a[1], z1], [b[0], b[1], z1], [b[0], b[1], z2], [a[0], a[1], z2]], 'w'); };
  E.push(roof(0.25, 0.55, 2.4, 3.6), roof(0.25, 0.55, 5, 6.2));
  // Gelände (Grundfläche, fällt in der Ansicht auf die Geländelinie zusammen)
  E.push(R([[-7, 0, -1.5], [11.5, 0, -1.5], [11.5, 0, 9], [-7, 0, 9]], 'g'));
  // Bemaßungen: a, b, Text, Offset (Bildschirmrichtung senkrecht), Gruppe
  const D = [
    { a: [-5, -1.1, 0], b: [0, -1.1, 0], t: '5,00', g: 'x' },
    { a: [0, -1.1, 0], b: [10, -1.1, 0], t: '10,00', g: 'x' },
    { a: [-5, -2.1, 0], b: [10, -2.1, 0], t: '15,00', g: 'x' },
    { a: [-6.3, 0, 0], b: [-6.3, 3.4, 0], t: '3,40', g: 'y' },
    { a: [-6.3, 3.4, 0], b: [-6.3, 6, 0], t: '2,60', g: 'y' },
    { a: [-6.3, 6, 0], b: [-6.3, 9, 0], t: '3,00', g: 'y' },
    { a: [11.3, 0, 0], b: [11.3, 0, 8], t: '8,00', g: 'z' },
    { a: [-5.6, 3.4, 0], b: [-5.6, 3.4, 6], t: '6,00', g: 'z' },
  ];
  const C = [2.5, 4.2, 4], S = 38, OX = 400, OY = 318;
  function proj(t) {
    const th = t * 0.66, ph = t * 0.46; // ca. 38° / 26°
    const ct = Math.cos(th), st = Math.sin(th), cp = Math.cos(ph), sp = Math.sin(ph);
    return ([x, y, z]) => {
      x -= C[0]; y -= C[1]; z -= C[2];
      const x1 = x * ct + z * st, z1 = -x * st + z * ct;
      const y2 = y * cp + z1 * sp;
      return [OX + x1 * S, OY - y2 * S];
    };
  }
  const f = n => (Math.round(n * 10) / 10).toString();
  function paths(t) {
    const P = proj(t);
    return E.map(e => { const q = e.p.map(P); return 'M' + q.map(v => f(v[0]) + ' ' + f(v[1])).join('L') + (e.closed ? 'Z' : ''); });
  }
  function dims(t) {
    const P = proj(t);
    return D.map(d => {
      const a = P(d.a), b = P(d.b), dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
      const ux = dx / len, uy = dy / len, k = 5;
      // Architektur-Schrägstrich an beiden Enden (45° zur Maßlinie)
      const tx = (ux - uy) * k * 0.7071, ty = (uy + ux) * k * 0.7071;
      const tick = p => `M${f(p[0] - tx)} ${f(p[1] - ty)}L${f(p[0] + tx)} ${f(p[1] + ty)}`;
      const ext = d.g === 'x' ? 3 : 3;
      const line = `M${f(a[0] - ux * ext)} ${f(a[1] - uy * ext)}L${f(b[0] + ux * ext)} ${f(b[1] + uy * ext)}`;
      // Text: Mitte, leicht versetzt (links bzw. oberhalb der Linie)
      let nx = uy, ny = -ux; if (ny > 0 || (Math.abs(ny) < 0.2 && nx > 0)) { nx = -nx; ny = -ny; }
      return { d: line + tick(a) + tick(b), x: f((a[0] + b[0]) / 2 + nx * 9), y: f((a[1] + b[1]) / 2 + ny * 9 + 3), len, g: d.g, t: d.t };
    });
  }
  return { E, D, paths, dims };
})();
/*ENDMODEL*/


  const d = document, html = d.documentElement;
  const $ = (s, r = d) => r.querySelector(s), $$ = (s, r = d) => [...r.querySelectorAll(s)];
  const MOTION = html.classList.contains('motion-ok');
  const REDUCED = !MOTION;
  const hasGSAP = () => typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const fmt = n => new Intl.NumberFormat('de-DE').format(n);
  let lenis = null;

  /* ---------- Header: Zustand + Scroll-Fortschritt ---------- */
  const hdr = $('.hdr'), bar = $('.hdr__progress span');
  let ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const y = window.scrollY, max = d.documentElement.scrollHeight - innerHeight;
      hdr.classList.toggle('is-scrolled', y > 8);
      bar.style.transform = `scaleX(${max > 0 ? clamp(y / max) : 0})`;
    });
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Menü (mobil) ---------- */
  const menu = $('#menu'), mbtn = $('.menu-btn'), abar = $('.abar');
  function setMenu(open) {
    mbtn.setAttribute('aria-expanded', String(open));
    mbtn.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
    abar && abar.classList.toggle('is-hidden', open);
    if (open) {
      menu.hidden = false; menu.classList.add('is-pre');
      menu.getBoundingClientRect();
      menu.classList.remove('is-pre');
      d.body.style.overflow = 'hidden'; lenis && lenis.stop();
      $('a', menu).focus();
    } else {
      menu.classList.add('is-pre');
      d.body.style.overflow = ''; lenis && lenis.start();
      setTimeout(() => { if (mbtn.getAttribute('aria-expanded') === 'false') { menu.hidden = true; menu.classList.remove('is-pre'); } }, MOTION ? 220 : 0);
    }
  }
  mbtn.addEventListener('click', () => setMenu(mbtn.getAttribute('aria-expanded') !== 'true'));
  d.addEventListener('keydown', e => {
    if (e.key === 'Escape' && mbtn.getAttribute('aria-expanded') === 'true') { setMenu(false); mbtn.focus(); }
    if (e.key === 'Tab' && mbtn.getAttribute('aria-expanded') === 'true') {
      const f = [mbtn, ...$$('a', menu)], i = f.indexOf(d.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  });

  /* ---------- Anker (mit Lenis weich) ---------- */
  d.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    const t = id.length > 1 && d.querySelector(id);
    if (!t) return;
    e.preventDefault();
    if (mbtn.getAttribute('aria-expanded') === 'true') setMenu(false);
    if (lenis) lenis.scrollTo(t, { offset: -70, duration: 1.1 });
    else t.scrollIntoView({ behavior: MOTION ? 'smooth' : 'auto' });
    history.replaceState(null, '', id);
    if (id !== '#top') setTimeout(() => { t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true }); }, MOTION ? 900 : 0);
  });

  /* ---------- Hero: Ansicht → Axonometrie ---------- */
  const hero = $('#hero'), edges = $$('.hz-edges path'), dimG = $$('.hz-dims .dm');
  const vLabel = $('.js-view'), degLabel = $('.js-deg');
  let lastT = -1;
  const easeIO = x => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  function renderHouse(p) {
    const t = easeIO(clamp((p - 0.06) / 0.8));
    if (Math.abs(t - lastT) < 0.0005) return;
    lastT = t;
    const P = HAUS.paths(t), D = HAUS.dims(t);
    for (let i = 0; i < edges.length; i++) edges[i].setAttribute('d', P[i]);
    for (let i = 0; i < dimG.length; i++) {
      const g = dimG[i], m = D[i];
      g.firstChild.setAttribute('d', m.d);
      const tx = g.lastChild; tx.setAttribute('x', m.x); tx.setAttribute('y', m.y);
      if (m.g === 'z') g.style.opacity = clamp((t - 0.35) / 0.4);
    }
    vLabel.textContent = t > 0.5 ? 'Axonometrie' : 'Ansicht Süd';
    degLabel.textContent = Math.round(t * 38) + '°';
  }

  /* ---------- Lenis + ScrollTrigger ---------- */
  function initScroll() {
    if (!hasGSAP()) return;
    gsap.registerPlugin(ScrollTrigger);
    if (MOTION && typeof window.Lenis !== 'undefined') {
      lenis = new Lenis({ lerp: 0.12, smoothWheel: true });
      window.__lenis = lenis;
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(t => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }
    if (!MOTION) return;
    const st = { p: 0 };
    const mm = gsap.matchMedia();
    mm.add('(min-width: 900px)', () => {
      gsap.to(st, { p: 1, ease: 'none', onUpdate: () => renderHouse(st.p), scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom bottom', scrub: 0.5 } });
      return () => { st.p = 0; renderHouse(0); };
    });
    mm.add('(max-width: 899px)', () => {
      gsap.to(st, { p: 1, ease: 'none', onUpdate: () => renderHouse(st.p), scrollTrigger: { trigger: hero, start: 'top top', end: () => '+=' + Math.round(innerHeight * 0.55), scrub: 0.4 } });
      return () => { st.p = 0; renderHouse(0); };
    });
  }

  /* ---------- Reveal ---------- */
  function initReveal() {
    const els = $$('[data-reveal]'), groups = $$('[data-reveal-group]');
    if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('is-in')); groups.forEach(g => [...g.children].forEach(c => c.classList.add('is-in'))); return; }
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const el = en.target;
        if (el.hasAttribute('data-reveal-group')) {
          [...el.children].filter(c => !c.hidden).forEach((c, i) => { c.style.transitionDelay = Math.min(i, 9) * 50 + 'ms'; c.classList.add('is-in'); setTimeout(() => { c.style.transitionDelay = ''; }, 1200); });
        } else el.classList.add('is-in');
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(e => io.observe(e)); groups.forEach(g => io.observe(g));
  }

  /* ---------- Aktive Navigation ---------- */
  function initNav() {
    const links = $$('.nav a'), map = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => { const a = map.get(en.target.id); if (a && en.isIntersecting) { links.forEach(l => l.classList.remove('is-active')); a.classList.add('is-active'); } });
    }, { rootMargin: '-45% 0px -50% 0px' });
    map.forEach((a, id) => { const s = d.getElementById(id); s && io.observe(s); });
  }

  /* ---------- Projektindex: Filter + Vorschau am Cursor ---------- */
  function initProjects() {
    const list = $('.pi'), rows = $$('.pi__row', list), chips = $$('.pf .chip'), count = $('.js-pcount');
    chips.forEach(ch => ch.addEventListener('click', () => {
      const f = ch.dataset.f;
      chips.forEach(c => c.setAttribute('aria-pressed', String(c === ch)));
      let k = 0;
      rows.forEach(r => {
        const show = f === 'alle' || r.dataset.type === f;
        const was = !r.hidden;
        r.hidden = !show;
        r.classList.add('is-in');
        if (show && MOTION) { r.classList.remove('is-enter'); void r.offsetWidth; r.style.setProperty('--k', k); r.classList.add('is-enter'); }
        if (show) k++;
        if (!show && was) r.classList.remove('is-enter');
      });
      count.textContent = k;
      if (list.scrollLeft) list.scrollTo({ left: 0 });
    }));
    list.addEventListener('animationend', e => e.target.classList.remove('is-enter'));

    const pv = $('.pv'), pvIn = $('.pv__in'), cap = $('.pv__cap');
    const fine = matchMedia('(hover: hover) and (pointer: fine) and (min-width: 900px)');
    let built = false, imgs = {}, active = null, on = false, raf = 0;
    const pos = { x: 0, y: 0, tx: 0, ty: 0, r: 0 };
    function build() {
      if (built) return; built = true;
      rows.forEach(r => {
        const n = r.dataset.img, im = new Image();
        im.alt = ''; im.decoding = 'async';
        im.sizes = '380px';
        im.srcset = `/arena/architektur-raumlinie/assets/img/${n}-480.webp 480w, /arena/architektur-raumlinie/assets/img/${n}-960.webp 960w`;
        im.src = `/arena/architektur-raumlinie/assets/img/${n}-480.webp`;
        pvIn.appendChild(im); imgs[n] = im;
      });
    }
    function loop() {
      const k = REDUCED ? 1 : 0.16;
      const dx = pos.tx - pos.x, dy = pos.ty - pos.y;
      pos.x += dx * k; pos.y += dy * k;
      pos.r += ((clamp(dx * 0.04, -6, 6)) - pos.r) * 0.12;
      pv.style.transform = `translate3d(${pos.x.toFixed(1)}px, ${pos.y.toFixed(1)}px, 0) rotate(${REDUCED ? 0 : pos.r.toFixed(2)}deg)`;
      if (on || Math.abs(dx) + Math.abs(dy) > 0.5) raf = requestAnimationFrame(loop); else raf = 0;
    }
    function target(e) {
      const w = pv.offsetWidth || 340, h = w * 0.75 + 30;
      let x = e.clientX + 36; if (x + w > innerWidth - 16) x = e.clientX - w - 36;
      const y = clamp(e.clientY - h / 2, 76, innerHeight - h - 16);
      pos.tx = x; pos.ty = y;
    }
    list.addEventListener('pointerenter', e => {
      if (!fine.matches || e.pointerType !== 'mouse') return;
      build(); target(e); pos.x = pos.tx; pos.y = pos.ty; on = true; pv.classList.add('is-on');
      if (!raf) raf = requestAnimationFrame(loop);
    });
    list.addEventListener('pointermove', e => {
      if (!on) return; target(e);
      const row = e.target.closest('.pi__row');
      if (row && row !== active) {
        active = row;
        Object.values(imgs).forEach(im => im.classList.toggle('is-on', im === imgs[row.dataset.img]));
        cap.textContent = `${$('.pi__no', row).textContent} — ${$('.pi__t', row).firstChild.textContent.trim()} · ${$('.pi__y', row).textContent}`;
      }
      if (!raf) raf = requestAnimationFrame(loop);
    });
    list.addEventListener('pointerleave', () => { on = false; active = null; pv.classList.remove('is-on'); Object.values(imgs).forEach(im => im.classList.remove('is-on')); });
  }

  /* ---------- Grundriss-Explorer ---------- */
  function initPlan() {
    const svg = $('.plan'), rooms = $$('.room', svg), info = $('.gx__info');
    const nm = $('.js-rname'), ar = $('.js-rarea'), dm = $('.js-rdim'), or = $('.js-ro'), tx = $('.js-rinfo');
    let timer = 0;
    function select(r, focus) {
      rooms.forEach(x => x.setAttribute('aria-pressed', String(x === r)));
      const apply = () => {
        nm.textContent = r.dataset.name; ar.textContent = r.dataset.area;
        dm.textContent = `${r.dataset.w} × ${r.dataset.h} m`; or.textContent = r.dataset.o; tx.textContent = r.dataset.info;
        info.classList.remove('is-swap');
      };
      clearTimeout(timer);
      if (MOTION) { info.classList.add('is-swap'); timer = setTimeout(apply, 140); } else apply();
      if (focus) r.focus();
    }
    rooms.forEach((r, i) => {
      r.addEventListener('click', () => select(r));
      r.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(r); }
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); select(rooms[(i + 1) % rooms.length], true); }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); select(rooms[(i - 1 + rooms.length) % rooms.length], true); }
      });
    });
    rooms[0].setAttribute('aria-pressed', 'true');
    $$('.gx__tg input').forEach(inp => {
      const sync = () => svg.classList.toggle('is-' + inp.dataset.layer, inp.checked);
      inp.addEventListener('change', sync); sync();
    });
  }

  /* ---------- Leistungsphasen ---------- */
  function initPhases() {
    const tabs = $$('.ph__tabs [role="tab"]'), panels = $$('.ph__p'), fill = $('.ph__fill'), fee = $$('.ph__fee span');
    let cur = 0;
    function sel(i, focus) {
      i = (i + tabs.length) % tabs.length;
      tabs.forEach((t, k) => { t.setAttribute('aria-selected', String(k === i)); t.tabIndex = k === i ? 0 : -1; });
      panels.forEach((p, k) => { p.hidden = k !== i; p.classList.remove('is-enter'); });
      if (MOTION && i !== cur) { void panels[i].offsetWidth; panels[i].classList.add('is-enter'); }
      fee.forEach((f, k) => f.classList.toggle('is-on', k === i));
      fill.style.transform = `scaleX(${(i + 1) / tabs.length})`;
      cur = i;
      if (focus) tabs[i].focus();
    }
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => sel(i));
      t.addEventListener('keydown', e => {
        const k = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
        if (k !== undefined) { e.preventDefault(); sel(k, true); }
      });
    });
    $('.js-ph-prev').addEventListener('click', () => sel(cur - 1));
    $('.js-ph-next').addEventListener('click', () => sel(cur + 1));
    sel(0);
  }

  /* ---------- Kostenrahmen-Rechner ---------- */
  function initCalc() {
    const form = $('#kr'), range = $('#bgf'), out = $('#bgf-out');
    const el = s => $(s);
    const r = n => Math.round(n / RUNDUNG) * RUNDUNG;
    let last = '';
    function calc() {
      const art = form.art.value, std = form.std.value, bgf = +range.value;
      const [a, b] = KOSTEN[art][std];
      const bau = [r(bgf * a), r(bgf * b)], neb = [r(bau[0] * NEBENKOSTEN[0]), r(bau[1] * NEBENKOSTEN[1])];
      const sum = [bau[0] + neb[0], bau[1] + neb[1]];
      out.textContent = bgf;
      range.style.setProperty('--fill', ((bgf - range.min) / (range.max - range.min) * 100).toFixed(1) + '%');
      el('.js-kmin').textContent = fmt(sum[0]); el('.js-kmax').textContent = fmt(sum[1]);
      el('.js-kbau').textContent = `${fmt(bau[0])} – ${fmt(bau[1])} €`;
      el('.js-kneben').textContent = `${fmt(neb[0])} – ${fmt(neb[1])} €`;
      el('.js-kqm').textContent = `${fmt(a)} – ${fmt(b)} €/m² BGF`;
      el('.js-stdtxt').textContent = STANDARD_TEXT[std];
      const steps = [500000, 1000000, 1500000, 2000000, 3000000, 4000000];
      const scale = steps.find(s => s >= sum[1] * 1.15) || 4000000;
      el('.js-kscale').textContent = scale >= 1000000 ? fmt(scale / 1000000).replace('.', ',') + ' Mio. €' : fmt(scale / 1000) + ' Tsd. €';
      el('.js-krange').style.transform = `translateX(${(sum[0] / scale * 100).toFixed(2)}%) scaleX(${((sum[1] - sum[0]) / scale).toFixed(4)})`;
      last = `Kostenrahmen-Rechner: ${ART_TEXT[art]}, ${bgf} m² BGF, Standard ${std} – ca. ${fmt(sum[0])} bis ${fmt(sum[1])} € (Orientierung).`;
    }
    form.addEventListener('input', calc);
    form.addEventListener('submit', e => e.preventDefault());
    calc();
    $('.js-kcta').addEventListener('click', () => {
      const msg = $('#cf-msg'); if (msg && !msg.value.trim()) msg.value = last + '\n';
      const sel = $('#cf-art'), art = form.art.value;
      if (sel) sel.selectedIndex = { neubau: 0, umbau: 1, aufstockung: 2 }[art];
    });
  }

  /* ---------- Kontaktformular (nur clientseitig) ---------- */
  function initForm() {
    const f = $('#cf'), ok = $('#cf-ok'), sum = $('.cf__sum', ok);
    const rules = [
      ['cf-name', v => v.trim().length >= 2, 'Bitte geben Sie Ihren Namen an.'],
      ['cf-mail', v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()), 'Bitte prüfen Sie die E-Mail-Adresse.'],
      ['cf-msg', v => v.trim().length >= 10, 'Ein, zwei Sätze zu Ihrem Vorhaben helfen uns bei der Vorbereitung.'],
    ];
    const setErr = (inp, msg) => { const e = $('#' + inp.id + '-e'); inp.setAttribute('aria-invalid', msg ? 'true' : 'false'); if (e) e.textContent = msg || ''; };
    rules.forEach(([id, test, msg]) => { const inp = $('#' + id); inp.addEventListener('blur', () => { if (inp.value) setErr(inp, test(inp.value) ? '' : msg); }); inp.addEventListener('input', () => { if (inp.getAttribute('aria-invalid') === 'true' && test(inp.value)) setErr(inp, ''); }); });
    const ds = $('#cf-ds');
    ds.addEventListener('change', () => { if (ds.checked) setErr(ds, ''); });
    f.addEventListener('submit', e => {
      e.preventDefault();
      let first = null;
      rules.forEach(([id, test, msg]) => { const inp = $('#' + id); const good = test(inp.value); setErr(inp, good ? '' : msg); if (!good && !first) first = inp; });
      if (!ds.checked) { setErr(ds, 'Bitte bestätigen Sie die Datenschutzhinweise.'); first = first || ds; } else setErr(ds, '');
      if (first) { first.focus(); return; }
      sum.textContent = '';
      const add = (k, v, wide) => { if (!v) return; const div = d.createElement('div'); if (wide) div.className = 'is-wide'; const dt = d.createElement('dt'); dt.textContent = k; const dd = d.createElement('dd'); dd.textContent = v; div.append(dt, dd); sum.appendChild(div); };
      add('Name', f.name.value.trim()); add('E-Mail', f.email.value.trim());
      add('Telefon', f.tel.value.trim() || '–'); add('Vorhaben', f.art.value);
      add('Grundstück / Bestand', f.grund.value, true);
      add('Nachricht', f.msg.value.trim(), true);
      f.hidden = true; ok.hidden = false; ok.focus();
    });
    $('.js-cf-reset').addEventListener('click', () => { f.reset(); f.hidden = false; ok.hidden = true; $$('[aria-invalid]', f).forEach(x => x.setAttribute('aria-invalid', 'false')); $('#cf-name').focus(); });
  }

  /* ---------- Start ---------- */
  initScroll();
  const queue = [initReveal, initNav, initProjects, initPlan, initPhases, initCalc, initForm, () => { if (hasGSAP()) ScrollTrigger.refresh(); window.__raumReady = true; }];
  const idle = window.requestIdleCallback ? cb => requestIdleCallback(cb, { timeout: 120 }) : cb => setTimeout(cb, 16);
  function run() {
    const t0 = performance.now();
    while (queue.length && performance.now() - t0 < 20) {
      const fn = queue.shift();
      try { fn(); } catch (err) { console.warn(err); }
    }
    if (queue.length) idle(run);
  }
  window.__raumReady = false;
  setTimeout(() => idle(run), 0);
})();
