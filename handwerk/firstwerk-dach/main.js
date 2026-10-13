/* =========================================================================
   FIRSTWERK – Dach & Holzbau · Demo-Modell „Kante“
   Vanilla JS + GSAP/ScrollTrigger + Lenis (lokal). Ohne JS und bei
   reduzierter Bewegung bleibt alles sichtbar und bedienbar.
   ========================================================================= */
(() => {
  'use strict';

  const d = document;
  const html = d.documentElement;
  const REDUCE = html.classList.contains('reduce');
  const $ = (s, c = d) => c.querySelector(s);
  const $$ = (s, c = d) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const mqDesk = matchMedia('(min-width: 900px)');
  const mqFine = matchMedia('(hover: hover) and (pointer: fine)');
  const hasGSAP = !!(window.gsap && window.ScrollTrigger);
  const fmt = new Intl.NumberFormat('de-DE');

  // Cubic-bezier easing (entspricht den CSS-Tokens)
  function bezier(x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const sx = t => ((ax * t + bx) * t + cx) * t;
    const sy = t => ((ay * t + by) * t + cy) * t;
    const dx = t => (3 * ax * t + 2 * bx) * t + cx;
    return x => {
      if (x <= 0) return 0; if (x >= 1) return 1;
      let t = x;
      for (let i = 0; i < 6; i++) { const e = sx(t) - x; const de = dx(t); if (Math.abs(e) < 1e-5 || !de) break; t -= e / de; }
      return sy(clamp(t, 0, 1));
    };
  }
  const easeInOut = bezier(0.77, 0, 0.175, 1);
  const easeOut = bezier(0.23, 1, 0.32, 1);

  const hdr = $('[data-hdr]');
  const hdrH = () => (hdr ? hdr.offsetHeight : 64);

  /* ------------------------------------------------------------ Lenis + GSAP */
  let lenis = null;
  if (!REDUCE && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.11, smoothWheel: true, wheelMultiplier: 1, autoRaf: !hasGSAP });
    window.__lenis = lenis;
  }
  if (hasGSAP) {
    gsap.registerPlugin(ScrollTrigger);
    if (lenis) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(t => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }
  }

  function scrollToEl(el, after) {
    if (!el) return;
    const offset = -(hdrH() + 12);
    if (lenis) {
      lenis.scrollTo(el, { offset, duration: 1.15, easing: t => 1 - Math.pow(1 - t, 4), onComplete: after });
    } else {
      const y = el.getBoundingClientRect().top + window.scrollY + offset;
      window.scrollTo({ top: y, behavior: REDUCE ? 'auto' : 'smooth' });
      if (after) setTimeout(after, REDUCE ? 0 : 500);
    }
  }
  function focusEl(el) {
    if (!el) return;
    if (!el.hasAttribute('tabindex') && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
  }

  // Anker-Links weich scrollen
  d.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const id = a.getAttribute('href').slice(1);
    const target = id ? d.getElementById(id) : null;
    if (!target) return;
    e.preventDefault();
    const go = () => {
      scrollToEl(target, () => {
        if (a.dataset.focus !== 'off') focusEl(id === 'top' ? $('#hero-h') : (target.querySelector('h2, h1') || target));
      });
      history.replaceState(null, '', '#' + id);
    };
    if (menu && menu.open) closeMenu(go); else go();
  });

  /* ------------------------------------------------------------ Header */
  const progressBar = $('[data-progress]');
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const y = window.scrollY;
      const max = d.documentElement.scrollHeight - window.innerHeight;
      if (progressBar) progressBar.style.transform = `scaleX(${max > 0 ? clamp(y / max, 0, 1) : 0})`;
      if (hdr) hdr.classList.toggle('is-scrolled', y > 8);
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Aktiver Navigationspunkt
  const navLinks = $$('.nav a[href^="#"]');
  if ('IntersectionObserver' in window && navLinks.length) {
    const map = new Map(navLinks.map(a => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        navLinks.forEach(a => a.removeAttribute('aria-current'));
        const a = map.get(en.target.id);
        if (a) a.setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main > section[id]').forEach(s => io.observe(s));
  }

  /* ------------------------------------------------------------ Menü (Dialog) */
  const menu = $('[data-menu]');
  const burger = $('[data-menu-open]');
  function openMenu() {
    if (!menu || menu.open) return;
    $$('.menu__list li', menu).forEach((li, i) => li.style.setProperty('--n', i));
    menu.showModal();
    burger.setAttribute('aria-expanded', 'true');
    if (lenis) lenis.stop();
  }
  function closeMenu(after) {
    if (!menu || !menu.open) { if (after) after(); return; }
    const done = () => {
      menu.classList.remove('is-closing');
      menu.close();
      burger.setAttribute('aria-expanded', 'false');
      if (lenis) lenis.start();
      if (after) after(); else burger.focus();
    };
    if (REDUCE && !matchMedia('(prefers-reduced-motion: reduce)').matches) { done(); return; }
    menu.classList.add('is-closing');
    let finished = false;
    const fin = () => { if (finished) return; finished = true; done(); };
    menu.addEventListener('animationend', fin, { once: true });
    setTimeout(fin, 320);
  }
  if (menu && burger) {
    burger.addEventListener('click', openMenu);
    $('[data-menu-close]', menu).addEventListener('click', () => closeMenu());
    menu.addEventListener('cancel', e => { e.preventDefault(); closeMenu(); });
    menu.addEventListener('click', e => { if (e.target === menu) closeMenu(); });
    mqDesk.addEventListener('change', () => { if (mqDesk.matches && menu.open) closeMenu(); });
  }

  /* ------------------------------------------------------------ Überschriften in Wörter teilen */
  function split(el) {
    if (el.classList.contains('is-split')) return;
    const frag = d.createDocumentFragment();
    let cur = null, i = 0;
    const word = () => {
      const w = d.createElement('span'); w.className = 'w';
      const inner = d.createElement('span'); inner.className = 'w__i'; inner.style.setProperty('--wi', i++);
      w.appendChild(inner); frag.appendChild(w); cur = inner;
    };
    Array.from(el.childNodes).forEach(node => {
      if (node.nodeType === 3) {
        node.textContent.split(/([ \t\n\r]+)/).forEach(part => {
          if (!part) return;
          if (/^[ \t\n\r]+$/.test(part)) { frag.appendChild(d.createTextNode(' ')); cur = null; }
          else { if (!cur) word(); cur.appendChild(d.createTextNode(part)); }
        });
      } else { if (!cur) word(); cur.appendChild(node); }
    });
    el.textContent = '';
    el.appendChild(frag);
    el.classList.add('is-split');
  }

  /* ------------------------------------------------------------ Scroll-Reveal */
  const revealIO = ('IntersectionObserver' in window && !REDUCE) ? new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-in'); revealIO.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -8% 0px' }) : null;

  function initReveal() {
    if (!revealIO) { $$('[data-split]').forEach(el => el.classList.add('is-in')); return; }
    $$('[data-split]').forEach(el => { if (el.closest('.hero')) return; split(el); revealIO.observe(el); });
    const groups = [
      '.sec-lead', '.services__more', '.config__stage', '.config__panel', '.ba__steps li', '.compare', '.quiz', '.check__fig',
      '.prow', '.storm__side', '.storm__lead', '.call', '.stat', '.person', '.crew', '.g', '.values li', '.quote', '.rating',
      '.towns', '.plz', '.area__map', '.career__lead', '.career__fig', '.benefits li', '.azubi', '.faq__box', '.qa', '.wiz', '.contact', '.step'
    ];
    groups.forEach(sel => {
      $$(sel).forEach(el => {
        if (el.closest('.hero')) return;
        const sibs = Array.from(el.parentElement.children).filter(c => c.matches(sel));
        const idx = Math.max(0, sibs.indexOf(el));
        el.style.setProperty('--d', Math.min(idx, 6) * 70 + 'ms');
        el.classList.add('rv');
        revealIO.observe(el);
      });
    });
    const crew = $('.crew');
    if (crew) $$('.crew__grid li', crew).forEach((li, i) => li.style.setProperty('--n', i));
  }

  /* ------------------------------------------------------------ Hero „Giebel“ */
  function initHero() {
    const hero = $('[data-hero]');
    if (!hero) return;
    const title = $('.hero__title', hero);
    if (!REDUCE) split(title);
    const delays = [['.hero__kicker', 0], ['.hero__fig', 160], ['.hero__lead', 420], ['.hero__cta', 500], ['.hero__phone', 580]];
    delays.forEach(([s, t]) => { const el = $(s, hero); if (el) el.style.setProperty('--d', t + 'ms'); });
    $$('.trust li', hero).forEach((li, i) => li.style.setProperty('--d', 640 + i * 70 + 'ms'));
    requestAnimationFrame(() => requestAnimationFrame(() => { hero.classList.add('is-loaded'); title.classList.add('is-in'); }));

    const frame = $('[data-gable]', hero);
    const mask = $('[data-gable-mask]', hero);
    const img = $('.hero__img', hero);
    const svg = $('[data-gable-dims]', hero);
    const pitchOut = $('[data-gable-pitch]', hero);
    const el = n => $('.' + n, svg);
    const E = { outline: el('gd-outline'), over: el('gd-over'), w: el('gd-wline'), wt: el('gd-wt'), h: el('gd-hline'), ht: el('gd-ht'), arc: el('gd-arc'), at: el('gd-at'), ridge: el('gd-ridge') };
    const M = 48;
    let W = 0, H = 0, gw = 0, last = -1;
    const comma = (v, n = 1) => v.toFixed(n).replace('.', ',');

    function measure() {
      W = frame.clientWidth; H = frame.clientHeight;
      gw = Math.min(W * 0.56, H * 0.92);
      svg.setAttribute('viewBox', `${-M} ${-M} ${W + 2 * M} ${H + 2 * M}`);
      last = -1;
    }
    function render(p) {
      if (!W) return;
      if (Math.abs(p - last) < 0.0005) return;
      last = p;
      const q = easeInOut(clamp(p, 0, 1));
      const rise0 = gw / 2;
      const xl = lerp((W - gw) / 2, 0, q), xr = W - xl;
      const ye = lerp(rise0, 0, q);
      const half = W / 2 - xl;
      const th = Math.atan2(ye, half);
      const deg = th * 180 / Math.PI;
      const small = W < 520;
      mask.style.clipPath = `polygon(${xl}px ${H}px, ${xl}px ${ye}px, ${W / 2}px 0px, ${xr}px ${ye}px, ${xr}px ${H}px)`;
      img.style.transform = `scale(${lerp(1.14, 1, q)})`;
      E.outline.setAttribute('points', `${xl},${H} ${xl},${ye} ${W / 2},0 ${xr},${ye} ${xr},${H}`);
      const ov = small ? 14 : 24, cx = Math.cos(th) * ov, cy = Math.sin(th) * ov;
      E.over.setAttribute('d', `M${xl} ${ye}L${xl - cx} ${ye + cy}M${xr} ${ye}L${xr + cx} ${ye + cy}`);
      // Breite
      const by = H + (small ? 14 : 20);
      E.w.setAttribute('d', `M${xl} ${H + 4}V${by + 6}M${xr} ${H + 4}V${by + 6}M${xl} ${by}H${xr}M${xl - 5} ${by + 5}L${xl + 5} ${by - 5}M${xr - 5} ${by + 5}L${xr + 5} ${by - 5}`);
      E.wt.setAttribute('x', W / 2); E.wt.setAttribute('y', by + 16); E.wt.setAttribute('text-anchor', 'middle');
      E.wt.textContent = `B ${comma((xr - xl) / gw * 11.4, 2)} m`;
      // Höhe
      const hx = xr + (small ? 12 : 22);
      E.h.setAttribute('d', `M${xr + 4} 0H${hx + 6}M${xr + 4} ${H}H${hx + 6}M${hx} 0V${H}M${hx - 5} 5L${hx + 5} -5M${hx - 5} ${H + 5}L${hx + 5} ${H - 5}`);
      E.ht.setAttribute('x', hx + 14); E.ht.setAttribute('y', H / 2);
      E.ht.setAttribute('transform', `rotate(-90 ${hx + 14} ${H / 2})`); E.ht.setAttribute('text-anchor', 'middle');
      // Neigungswinkel (außen an der Traufe)
      const r = small ? 26 : 38;
      E.arc.setAttribute('d', `M${xl - r - 20} ${ye}H${xl}M${xl - r} ${ye}A${r} ${r} 0 0 0 ${xl - r * Math.cos(th)} ${ye + r * Math.sin(th)}`);
      E.at.setAttribute('x', xl - r - 6); E.at.setAttribute('y', ye + (small ? 16 : 20)); E.at.setAttribute('text-anchor', 'end');
      E.at.textContent = `${Math.round(deg)}°`;
      E.at.style.opacity = deg < 3 ? 0 : 1;
      E.ridge.setAttribute('d', `M${W / 2 - 7} -16L${W / 2 + 7} -16L${W / 2} -5Z`);
      if (pitchOut) pitchOut.textContent = `${comma(deg)}°`;
    }

    measure(); render(0);
    if ('ResizeObserver' in window) new ResizeObserver(() => { const p = last < 0 ? 0 : last; measure(); render(p); }).observe(frame);

    if (REDUCE || !hasGSAP) return;
    const proxy = { p: 0 };
    const mm = gsap.matchMedia();
    mm.add('(min-width: 900px)', () => {
      const t = gsap.to(proxy, {
        p: 1, ease: 'none',
        onUpdate: () => render(proxy.p),
        scrollTrigger: { trigger: hero, start: 'top top', end: '+=70%', pin: true, scrub: 0.6, anticipatePin: 1, invalidateOnRefresh: true }
      });
      return () => { t.scrollTrigger && t.scrollTrigger.kill(); t.kill(); proxy.p = 0; render(0); };
    });
    mm.add('(max-width: 899px)', () => {
      const t = gsap.to(proxy, {
        p: 1, ease: 'none',
        onUpdate: () => render(proxy.p),
        scrollTrigger: { trigger: frame, start: 'top 62%', end: 'bottom 30%', scrub: 0.5 }
      });
      return () => { t.scrollTrigger && t.scrollTrigger.kill(); t.kill(); proxy.p = 0; render(0); };
    });
  }

  /* ------------------------------------------------------------ Laufband im Dachwinkel */
  function initRidge() {
    const ridge = $('[data-ridge]');
    if (!ridge) return;
    const tracks = $$('[data-ridge-track]', ridge);
    const halves = $$('.ridge__half', ridge);
    const base = tracks[0].innerHTML;
    let P = 0, D = 0, s = 0, running = false, visible = false, lastT = 0, boost = 0;

    function layout() {
      tracks.forEach(t => { t.innerHTML = base; });
      P = tracks[0].scrollWidth;
      const band = tracks[0].parentElement;
      const Wb = band.offsetWidth;
      const halfW = halves[0].clientWidth;
      const ovL = band.offsetLeft + Wb - halfW;
      const ovR = -tracks[1].parentElement.offsetLeft;
      D = Wb - ovL - ovR;
      const copies = Math.max(2, Math.ceil((Wb + P) / Math.max(P, 1)) + 1);
      tracks.forEach(t => { t.innerHTML = base.repeat(copies); });
      draw();
    }
    const mod = (a, n) => ((a % n) + n) % n;
    function draw() {
      if (!P) return;
      const sl = mod(s, P), sr = mod(s + D, P);
      tracks[0].style.transform = `translate3d(${-sl}px,0,0)`;
      tracks[1].style.transform = `translate3d(${-sr}px,0,0)`;
    }
    function tick(now) {
      if (!running) return;
      const dt = Math.min(0.05, (now - (lastT || now)) / 1000);
      lastT = now;
      const v = lenis ? Math.abs(lenis.velocity || 0) : 0;
      boost = lerp(boost, Math.min(v * 0.9, 9), 0.08);
      s -= (46 + boost * 26) * dt;
      draw();
      requestAnimationFrame(tick);
    }
    function start() { if (running || REDUCE || !visible || d.hidden) return; running = true; lastT = 0; requestAnimationFrame(tick); }
    function stop() { running = false; }

    layout();
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(layout);
    let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(layout, 120); });
    if (REDUCE) return;
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; visible ? start() : stop(); }).observe(ridge);
    d.addEventListener('visibilitychange', () => { d.hidden ? stop() : start(); });
  }

  /* ------------------------------------------------------------ Leistungen: Karten-Stapel */
  function initStack() {
    if (REDUCE || !hasGSAP) return;
    const cards = $$('.stack .card');
    const mm = gsap.matchMedia();
    mm.add('(min-width: 900px)', () => {
      const tweens = [];
      cards.forEach((card, i) => {
        if (i === cards.length - 1) return;
        const inner = $('.card__in', card);
        const next = cards[i + 1];
        tweens.push(gsap.fromTo(inner, { scale: 1, '--dim': 0 }, {
          scale: 0.93, '--dim': 0.38, ease: 'none',
          scrollTrigger: { trigger: next, start: 'top bottom', end: () => `top ${hdrH() + 20 + (i + 1) * 12}px`, scrub: true, invalidateOnRefresh: true }
        }));
      });
      return () => tweens.forEach(t => { t.scrollTrigger && t.scrollTrigger.kill(); t.kill(); gsap.set(t.targets(), { clearProps: 'all' }); });
    });
  }

  /* ------------------------------------------------------------ Dach-Konfigurator */
  const SHAPES = {
    sattel: { name: 'Satteldach', pitch: '30–50°', text: 'Der Klassiker: zwei Flächen, ein First. Günstig zu decken, viel Platz unterm Dach, gut für Gauben und Solar.' },
    walm: { name: 'Walmdach', pitch: '25–45°', text: 'Vier geneigte Flächen, kein Giebel: windschlüpfrig und typisch für Stadthäuser an der Küste. Etwas weniger Dachraum.' },
    pult: { name: 'Pultdach', pitch: '7–25°', text: 'Eine Fläche, eine hohe Wand: viel Licht auf der hohen Seite und ideal für eine große Solaranlage nach Süden.' },
    flach: { name: 'Flachdach', pitch: '2–5°', text: 'Abdichtung statt Eindeckung. Begrünbar, begehbar und typisch für Anbauten, Garagen und Gewerbehallen.' },
    mansard: { name: 'Mansarddach', pitch: 'unten ~70°, oben ~25°', text: 'Geknickte Flächen und fast volle Wohnfläche im Dachgeschoss – typisch für Hamburger Stadtvillen der Gründerzeit.' }
  };
  const MATS = {
    ton: { name: 'Tonziegel', with: 'mit Tonziegeln', min: 'ab 22°', life: '60–80 Jahre', weight: 'ca. 40–55 kg/m²', care: 1, careT: 'gering', price: 2, priceT: 'mittel' },
    beton: { name: 'Betondachstein', with: 'mit Betondachsteinen', min: 'ab 22°', life: '40–60 Jahre', weight: 'ca. 42–50 kg/m²', care: 2, careT: 'mittel (Moos)', price: 1, priceT: 'günstig' },
    schiefer: { name: 'Schiefer', with: 'mit Schiefer', min: 'ab 25°', life: '80–100+ Jahre', weight: 'ca. 30–45 kg/m²', care: 1, careT: 'sehr gering', price: 4, priceT: 'hoch' },
    metall: { name: 'Stehfalz Metall', with: 'mit Stehfalz-Metall', min: 'ab 3°', life: '50–80 Jahre', weight: 'ca. 5–7 kg/m²', care: 1, careT: 'gering', price: 3, priceT: 'gehoben' },
    gruen: { name: 'Gründach', with: 'als Gründach', min: '0–15° (bis 35° mit Schubsicherung)', life: '40+ Jahre, schützt die Abdichtung', weight: 'ca. 80–150 kg/m²', care: 2, careT: '1–2 × im Jahr', price: 3, priceT: 'gehoben' }
  };
  const OK = ['ok', 'Bewährte Kombination.'];
  const GRUEN_STEIL = ['partial', 'Begrünung über 15° braucht Schubschwellen – bis etwa 35° machbar, darüber nicht.'];
  const FIT = {
    sattel: { ton: ['ok', 'Bewährte Kombination – in Hamburg wohl die häufigste.'], beton: OK, schiefer: OK, metall: ['ok', 'Modern und leicht – Stehfalz läuft auch über Gauben sauber.'], gruen: GRUEN_STEIL },
    walm: { ton: OK, beton: OK, schiefer: ['ok', 'Klassisch: Schiefer auf dem Walmdach, mit Graten in Zink oder Schiefer.'], metall: OK, gruen: GRUEN_STEIL },
    pult: { ton: ['partial', 'Ziegel brauchen meist 22° oder mehr – flache Pultdächer decken wir lieber mit Metall.'], beton: ['partial', 'Betondachsteine erst ab etwa 22° – bei flachen Pultdächern prüfen wir die Neigung.'], schiefer: ['partial', 'Schiefer ab 25° – nur bei steilen Pultdächern sinnvoll.'], metall: ['ok', 'Ideal: Stehfalz ist schon ab 3° regensicher.'], gruen: ['ok', 'Bis 15° problemlos begrünbar – und mit Solar kombinierbar.'] },
    flach: { ton: ['no', 'Tonziegel brauchen mindestens 22° Neigung – auf einem Flachdach geht das nicht.'], beton: ['no', 'Betondachsteine brauchen Neigung – auf einem Flachdach nicht möglich.'], schiefer: ['no', 'Schiefer braucht mindestens 25° – auf einem Flachdach nicht möglich.'], metall: ['partial', 'Ab 3° Gefälle mit Sonderfalz möglich – oft ist eine Abdichtung sinnvoller.'], gruen: ['ok', 'Der Klassiker: extensive Begrünung auf wurzelfester Abdichtung, gern mit Solar.'] },
    mansard: { ton: OK, beton: OK, schiefer: ['ok', 'Typisch für Mansarddächer – Schiefer auf den steilen Flächen.'], metall: OK, gruen: ['no', 'Die steilen Mansardflächen lassen sich nicht begrünen.'] }
  };
  const BADGE = { ok: 'Passt', partial: 'Bedingt', no: 'Geht nicht' };

  function initConfig() {
    const root = $('[data-config]');
    if (!root) return;
    const svg = $('[data-cfg-svg]', root);
    const defs = $('[data-cfg-defs]', root);
    const form = $('[data-cfg-form]', root);
    const sheet = $('[data-cfg-sheet]', root);
    const NS = 'http://www.w3.org/2000/svg';
    const XL = 'http://www.w3.org/1999/xlink';
    const mk = (tag, attrs = {}, parent) => { const n = d.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); if (parent) parent.appendChild(n); return n; };

    // Geometrie (Meter): x = Trauflänge, y = Hausbreite, z = Höhe
    const L = 11, Dp = 8, H = 3.4, T = a => Math.tan(a * Math.PI / 180);
    const G = [[0, 0, 0], [L, 0, 0], [L, Dp, 0], [0, Dp, 0]];
    const Ev = [[0, 0, H], [L, 0, H], [L, Dp, H], [0, Dp, H]];
    const geo = {
      sattel: { B: Ev, R: [[0, 4, H + 4 * T(40)], [L, 4, H + 4 * T(40)]], g: 1 },
      walm: { B: Ev, R: [[4, 4, H + 4 * T(38)], [L - 4, 4, H + 4 * T(38)]], g: 0 },
      pult: { B: Ev, R: [[0, Dp, H + Dp * T(12)], [L, Dp, H + Dp * T(12)]], g: 0 },
      flach: { B: Ev.map(p => [p[0], p[1], H + 0.45]), R: [[4, 4, H + 0.45], [L - 4, 4, H + 0.45]], g: 0 },
      mansard: { B: [[0, 1.1, H + 2.6], [L, 1.1, H + 2.6], [L, Dp - 1.1, H + 2.6], [0, Dp - 1.1, H + 2.6]], R: [[0, 4, H + 3.8], [L, 4, H + 3.8]], g: 1 }
    };
    const verts = k => [...G, ...Ev, ...geo[k].B, ...geo[k].R].map(p => p.slice());
    const FACES = [
      { i: [0, 1, 5, 4], wall: 1 }, { i: [1, 2, 6, 5], wall: 1 }, { i: [2, 3, 7, 6], wall: 1 }, { i: [3, 0, 4, 7], wall: 1 },
      { i: [4, 5, 9, 8] }, { i: [5, 6, 10, 9] }, { i: [6, 7, 11, 10] }, { i: [7, 4, 8, 11] },
      { i: [8, 9, 13, 12] }, { i: [9, 10, 13] }, { i: [10, 11, 12, 13] }, { i: [11, 8, 12] }
    ];

    // Kamera
    const th = 34 * Math.PI / 180, ph = 27 * Math.PI / 180;
    const cam = [-Math.sin(th) * Math.cos(ph), -Math.cos(th) * Math.cos(ph), Math.sin(ph)];
    const rv = [Math.cos(th), -Math.sin(th), 0];
    const uv = [Math.sin(th) * Math.sin(ph), Math.cos(th) * Math.sin(ph), Math.cos(ph)];
    const light = (() => { const l = [-0.35, -0.75, 0.62]; const n = Math.hypot(...l); return l.map(v => v / n); })();
    const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const norm = a => { const n = Math.hypot(a[0], a[1], a[2]); return n ? [a[0] / n, a[1] / n, a[2] / n] : [0, 0, 0]; };
    const C3 = [L / 2, Dp / 2, H / 2];
    let K = 40, OX = 300, OY = 220;
    const pr = p => { const q = sub(p, C3); return [dot(q, rv) * K + OX, -dot(q, uv) * K + OY]; };
    const prDir = v => [dot(v, rv) * K, -dot(v, uv) * K];

    // Maßstab so wählen, dass alle Formen in die Bühne passen
    (() => {
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      K = 1; OX = 0; OY = 0;
      const pad = [[-1.2, -1.2, 0], [L + 1.2, -1.2, 0], [L + 1.2, Dp + 1.2, 0], [-1.2, Dp + 1.2, 0]];
      Object.keys(geo).forEach(k => [...verts(k), ...pad].forEach(p => { const [x, y] = pr(p); x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }));
      K = Math.min((600 - 70) / (x1 - x0), (440 - 90) / (y1 - y0));
      OX = 300 - (x0 + x1) / 2 * K;
      OY = 236 - (y0 + y1) / 2 * K;
    })();

    // SVG-Ebenen aufbauen
    const holder = $('[data-cfg-static]', svg);
    holder.textContent = '';
    const gGround = mk('g', {}, holder);
    for (let v = -2; v <= L + 2; v += 1) { const a = pr([v, -2, 0]), b = pr([v, Dp + 2, 0]); mk('line', { class: 'cfg-gridline', x1: a[0], y1: a[1], x2: b[0], y2: b[1] }, gGround); }
    for (let v = -2; v <= Dp + 2; v += 1) { const a = pr([-2, v, 0]), b = pr([L + 2, v, 0]); mk('line', { class: 'cfg-gridline', x1: a[0], y1: a[1], x2: b[0], y2: b[1] }, gGround); }
    mk('polygon', { class: 'cfg-ground', points: [[-0.7, -0.7, 0], [L + 0.7, -0.7, 0], [L + 0.7, Dp + 0.7, 0], [-0.7, Dp + 0.7, 0]].map(p => pr(p).join(',')).join(' ') }, gGround);
    const gWall = mk('g', {}, holder);
    const gRoofB = mk('g', { class: 'cfg-roofb' }, holder);
    const gRoofA = mk('g', { class: 'cfg-roofb' }, holder);
    const gShade = mk('g', {}, holder);
    const gWin = mk('g', {}, holder);
    const gEdge = mk('g', {}, holder);
    const polys = FACES.map((f, i) => {
      const pa = mk('pattern', { id: `pf-a-${i}` }, defs);
      const pb = mk('pattern', { id: `pf-b-${i}` }, defs);
      return {
        wall: mk('polygon', { class: 'cfg-wall' }, gWall),
        rb: mk('polygon', { fill: `url(#pf-b-${i})` }, gRoofB),
        ra: mk('polygon', { fill: `url(#pf-a-${i})` }, gRoofA),
        sh: mk('polygon', { fill: '#121212' }, gShade),
        pa, pb
      };
    });
    const edges = [];
    // Fenster (fest an den Wänden)
    const winDefs = [
      { q: [[1.3, 0, 1.25], [2.6, 0, 1.25], [2.6, 0, 2.55], [1.3, 0, 2.55]] },
      { q: [[3.7, 0, 1.25], [5.0, 0, 1.25], [5.0, 0, 2.55], [3.7, 0, 2.55]] },
      { q: [[6.4, 0, 0], [7.5, 0, 0], [7.5, 0, 2.3], [6.4, 0, 2.3]] },
      { q: [[8.7, 0, 1.25], [10.0, 0, 1.25], [10.0, 0, 2.55], [8.7, 0, 2.55]] },
      { q: [[0, 4.8, 1.25], [0, 3.2, 1.25], [0, 3.2, 2.55], [0, 4.8, 2.55]] },
      { q: [[0, 4.55, H + 0.75], [0, 3.45, H + 0.75], [0, 3.45, H + 1.75], [0, 4.55, H + 1.75]], gable: 1 }
    ];
    const wins = winDefs.map(w => ({ ...w, el: mk('polygon', { class: 'cfg-win', points: w.q.map(p => pr(p).join(',')).join(' ') }, gWin) }));

    function setHref(p, id) { p.setAttribute('href', '#' + id); p.setAttributeNS(XL, 'xlink:href', '#' + id); }

    let cur = verts('sattel'), curG = 1;
    let shape = 'sattel', mat = 'ton';
    function render() {
      const V = cur;
      const info = FACES.map((f, fi) => {
        const P = f.i.map(i => V[i]);
        let n = [0, 0, 0];
        for (let k = 0; k < P.length; k++) { const a = P[k], b = P[(k + 1) % P.length]; n[0] += (a[1] - b[1]) * (a[2] + b[2]); n[1] += (a[2] - b[2]) * (a[0] + b[0]); n[2] += (a[0] - b[0]) * (a[1] + b[1]); }
        const area = Math.hypot(...n) / 2;
        n = norm(n);
        const cen = P.reduce((s, p) => [s[0] + p[0] / P.length, s[1] + p[1] / P.length, s[2] + p[2] / P.length], [0, 0, 0]);
        if (dot(n, sub(cen, C3)) < 0) n = n.map(v => -v);
        const vis = area > 1e-3 && dot(n, cam) > 0.002;
        return { P, n, area, vis };
      });
      info.forEach((f, fi) => {
        const pl = polys[fi];
        if (!f.vis) { [pl.wall, pl.ra, pl.rb, pl.sh].forEach(e => e.setAttribute('visibility', 'hidden')); return; }
        const pts = f.P.map(p => pr(p).map(v => v.toFixed(2)).join(',')).join(' ');
        const roof = FACES[fi].wall ? 0 : clamp((Math.abs(f.n[2]) - 0.06) / 0.14, 0, 1);
        const lam = Math.max(0, dot(f.n, light));
        [pl.wall, pl.ra, pl.rb, pl.sh].forEach(e => { e.setAttribute('visibility', 'visible'); e.setAttribute('points', pts); });
        pl.ra.setAttribute('opacity', roof.toFixed(3));
        pl.rb.setAttribute('opacity', roof.toFixed(3));
        pl.sh.setAttribute('fill-opacity', (0.46 * (1 - lam) * (roof ? 0.8 : 1) + 0.02).toFixed(3));
        if (roof > 0) {
          const u = norm(sub(f.P[1], f.P[0]));
          let v = norm(cross(f.n, u));
          if (v[2] < 0) v = v.map(x => -x);
          const U = prDir(u), Vd = prDir(v.map(x => -x)), O = pr(f.P[0]);
          const m = `matrix(${U[0].toFixed(3)} ${U[1].toFixed(3)} ${Vd[0].toFixed(3)} ${Vd[1].toFixed(3)} ${O[0].toFixed(2)} ${O[1].toFixed(2)})`;
          pl.pa.setAttribute('patternTransform', m);
          pl.pb.setAttribute('patternTransform', m);
        }
      });
      // Kanten geometrisch zusammenfassen: nur Silhouetten und echte Knicke zeichnen
      const emap = new Map();
      const kp = p => p.map(v => v.toFixed(3)).join(',');
      info.forEach(f => {
        if (!f.vis) return;
        f.P.forEach((a, k) => {
          const b = f.P[(k + 1) % f.P.length];
          if (Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) < 1e-3) return;
          const ka = kp(a), kb = kp(b);
          const key = ka < kb ? ka + '|' + kb : kb + '|' + ka;
          if (!emap.has(key)) emap.set(key, { a, b, n: [] });
          emap.get(key).n.push(f.n);
        });
      });
      let li = 0;
      emap.forEach(e => {
        let o = 1;
        if (e.n.length >= 2) { const ang = Math.acos(clamp(dot(e.n[0], e.n[1]), -1, 1)) * 180 / Math.PI; o = clamp((ang - 1) / 5, 0, 1); }
        if (o <= 0) return;
        let ln = edges[li];
        if (!ln) { ln = mk('line', { class: 'cfg-edge' }, gEdge); edges.push(ln); }
        li++;
        const a = pr(e.a), b = pr(e.b);
        ln.setAttribute('visibility', 'visible');
        ln.setAttribute('x1', a[0].toFixed(2)); ln.setAttribute('y1', a[1].toFixed(2));
        ln.setAttribute('x2', b[0].toFixed(2)); ln.setAttribute('y2', b[1].toFixed(2));
        ln.setAttribute('stroke-opacity', o.toFixed(2));
      });
      for (let k = li; k < edges.length; k++) edges[k].setAttribute('visibility', 'hidden');
      wins.forEach(w => { if (w.gable) w.el.setAttribute('opacity', curG.toFixed(3)); });
    }

    function setMaterial(next, animate) {
      polys.forEach(p => { setHref(p.pb, 'mat-' + mat); setHref(p.pa, 'mat-' + next); });
      mat = next;
      if (animate && !REDUCE) {
        gRoofA.style.transition = 'none'; gRoofA.style.opacity = '0';
        void gRoofA.getBoundingClientRect();
        gRoofA.style.transition = 'opacity 280ms ease'; gRoofA.style.opacity = '1';
        const done = () => { polys.forEach(p => setHref(p.pb, 'mat-' + mat)); };
        setTimeout(done, 320);
      } else { gRoofA.style.opacity = '1'; polys.forEach(p => setHref(p.pb, 'mat-' + mat)); }
    }

    let from = null, fromG = 1, to = null, toG = 1, t0 = 0, raf = 0;
    const DUR = 720;
    function step(now) {
      const t = clamp((now - t0) / DUR, 0, 1), e = easeInOut(t);
      cur = from.map((p, i) => [lerp(p[0], to[i][0], e), lerp(p[1], to[i][1], e), lerp(p[2], to[i][2], e)]);
      curG = lerp(fromG, toG, e);
      render();
      raf = t < 1 ? requestAnimationFrame(step) : 0;
    }
    function morph(next) {
      shape = next;
      to = verts(next); toG = geo[next].g;
      if (REDUCE) { cur = to; curG = toG; render(); return; }
      from = cur.map(p => p.slice()); fromG = curG; t0 = performance.now();
      if (!raf) raf = requestAnimationFrame(step);
    }

    // Steckbrief
    const V = n => $(`[data-cfg-v="${n}"]`, sheet);
    const fitEl = $('[data-cfg-fit]', sheet), fitBadge = $('[data-cfg-fit-badge]', sheet), fitText = $('[data-cfg-fit-text]', sheet), fixBtn = $('[data-cfg-fix]', sheet);
    const svgTitle = $('#cfg-svg-t');
    function updateSheet(animate) {
      const s = SHAPES[shape], m = MATS[mat], f = FIT[shape][mat];
      const apply = () => {
        $('[data-cfg-sheet-title]', sheet).textContent = `${s.name} ${m.with}`;
        $('[data-cfg-desc]', sheet).textContent = s.text;
        V('pitch').textContent = s.pitch;
        V('min').textContent = m.min;
        V('life').textContent = m.life;
        V('weight').textContent = m.weight;
        V('care').textContent = m.careT;
        V('price').textContent = m.priceT;
        $('[data-cfg-meter]', sheet).dataset.val = m.care;
        $('[data-cfg-euro]', sheet).dataset.val = m.price;
        fitEl.dataset.state = f[0];
        fitBadge.textContent = BADGE[f[0]];
        fitText.textContent = f[1];
        fixBtn.hidden = f[0] !== 'no';
        $('[data-cfg-name]', root).textContent = `${s.name} / ${m.name}`;
        $('[data-cfg-pitch]', root).textContent = s.pitch;
        if (svgTitle) svgTitle.textContent = `Schematisches Haus: ${s.name} ${m.with}`;
      };
      if (!animate || REDUCE) { apply(); return; }
      sheet.classList.add('is-swapping');
      setTimeout(() => { apply(); sheet.classList.remove('is-swapping'); }, 150);
    }

    form.addEventListener('change', e => {
      const t = e.target;
      if (t.name === 'form') { morph(t.value); updateSheet(true); }
      if (t.name === 'mat') { setMaterial(t.value, true); updateSheet(true); }
    });
    fixBtn.addEventListener('click', () => {
      const pick = Object.keys(MATS).find(k => FIT[shape][k][0] === 'ok');
      const input = $(`input[name="mat"][value="${pick}"]`, form);
      if (input) { input.checked = true; input.dispatchEvent(new Event('change', { bubbles: true })); input.focus(); }
    });
    $('[data-cfg-cta]', root).addEventListener('click', e => {
      e.preventDefault();
      const s = SHAPES[shape], m = MATS[mat];
      prefill({
        anliegen: (shape === 'flach' || mat === 'gruen') ? 'flachdach' : 'sanierung',
        dachform: s.name,
        message: `Aus dem Konfigurator: ${s.name} ${m.with}.`,
        note: `Übernommen aus dem Konfigurator: ${s.name} ${m.with}.`
      });
    });

    // Startzustand aus dem Formular (z. B. nach Zurück-Navigation)
    const f0 = $('input[name="form"]:checked', form), m0 = $('input[name="mat"]:checked', form);
    shape = f0 ? f0.value : 'sattel';
    const startMat = m0 ? m0.value : 'ton';
    cur = verts(shape); curG = geo[shape].g;
    mat = startMat; setMaterial(startMat, false);
    render(); updateSheet(false);
  }

  /* ------------------------------------------------------------ Vorher / Nachher */
  function initCompare() {
    const root = $('[data-compare]');
    if (!root) return;
    const before = $('[data-compare-before]', root);
    const handle = $('[data-compare-handle]', root);
    const lblL = $('.compare__label--l', root), lblR = $('.compare__label--r', root);
    let pos = 50, dragId = null, touched = false, anim = 0;
    function set(p) {
      pos = clamp(p, 0, 100);
      before.style.clipPath = `inset(0 ${(100 - pos).toFixed(2)}% 0 0)`;
      handle.style.transform = `translateX(${pos.toFixed(2)}cqw)`;
      const r = Math.round(pos);
      handle.setAttribute('aria-valuenow', r);
      handle.setAttribute('aria-valuetext', `${r} Prozent Vorher, ${100 - r} Prozent Nachher`);
      lblL.style.opacity = pos < 16 ? 0 : 1;
      lblR.style.opacity = pos > 84 ? 0 : 1;
    }
    function tweenTo(target, dur = 220, ease = easeOut) {
      cancelAnimationFrame(anim);
      if (REDUCE) { set(target); return; }
      const start = pos, t0 = performance.now();
      const stepFn = now => { const t = clamp((now - t0) / dur, 0, 1); set(lerp(start, target, ease(t))); if (t < 1) anim = requestAnimationFrame(stepFn); };
      anim = requestAnimationFrame(stepFn);
    }
    const fromEvent = e => { const r = root.getBoundingClientRect(); return (e.clientX - r.left) / r.width * 100; };
    root.addEventListener('pointerdown', e => {
      if (dragId !== null || (e.pointerType === 'mouse' && e.button !== 0)) return;
      touched = true;
      dragId = e.pointerId;
      root.setPointerCapture(e.pointerId);
      root.classList.add('is-drag');
      const target = fromEvent(e);
      if (Math.abs(target - pos) > 4) tweenTo(target, 200); else set(target);
      if (e.pointerType === 'mouse') handle.focus({ preventScroll: true });
    });
    root.addEventListener('pointermove', e => { if (e.pointerId !== dragId) return; cancelAnimationFrame(anim); set(fromEvent(e)); });
    const end = e => { if (e.pointerId !== dragId) return; dragId = null; root.classList.remove('is-drag'); try { root.releasePointerCapture(e.pointerId); } catch (_) {} };
    root.addEventListener('pointerup', end);
    root.addEventListener('pointercancel', end);
    root.addEventListener('lostpointercapture', () => { dragId = null; root.classList.remove('is-drag'); });
    handle.addEventListener('keydown', e => {
      const stepK = e.shiftKey ? 10 : 5;
      let n = null;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') n = pos - stepK;
      else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') n = pos + stepK;
      else if (e.key === 'PageDown') n = pos - 20;
      else if (e.key === 'PageUp') n = pos + 20;
      else if (e.key === 'Home') n = 0;
      else if (e.key === 'End') n = 100;
      if (n === null) return;
      e.preventDefault(); touched = true; cancelAnimationFrame(anim); set(n);
    });
    set(50);
    // Einmaliger Hinweis beim ersten Sichtkontakt
    if (!REDUCE && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver(([en]) => {
        if (!en.isIntersecting) return;
        io.disconnect();
        setTimeout(() => {
          if (touched) return;
          tweenTo(64, 520, easeInOut);
          setTimeout(() => { if (!touched) tweenTo(38, 700, easeInOut); }, 560);
          setTimeout(() => { if (!touched) tweenTo(50, 520, easeInOut); }, 1300);
        }, 450);
      }, { threshold: 0.6 });
      io.observe(root);
    }
  }

  /* ------------------------------------------------------------ Dach-Check */
  function initQuiz() {
    const root = $('[data-quiz]');
    if (!root) return;
    const qs = $$('.quiz__q', root);
    const N = qs.length;
    const count = $('[data-q-count]', root);
    const bars = $$('.quiz__bar li', root);
    const back = $('[data-q-back]', root);
    const result = $('[data-q-result]', root);
    const top = $('.quiz__top', root);
    const answers = new Array(N).fill(null);
    let idx = 0, busy = false;

    function show(i, focus) {
      qs.forEach((q, k) => { q.hidden = k !== i; });
      result.hidden = true; top.hidden = false;
      const q = qs[i];
      q.classList.remove('is-enter'); void q.offsetWidth; q.classList.add('is-enter');
      count.textContent = `Frage ${i + 1} von ${N}`;
      bars.forEach((b, k) => b.classList.toggle('is-on', k <= i));
      back.hidden = i === 0;
      idx = i;
      if (focus) $('.quiz__title', q).focus({ preventScroll: true });
    }
    qs.forEach((q, qi) => {
      $$('.opt', q).forEach(btn => {
        btn.setAttribute('aria-pressed', 'false');
        btn.addEventListener('click', () => {
          if (busy) return;
          $$('.opt', q).forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
          answers[qi] = { v: +btn.dataset.v, label: btn.textContent.replace(/^[A-D]/, '').trim() };
          busy = true;
          setTimeout(() => { busy = false; qi < N - 1 ? show(qi + 1, true) : finish(); }, REDUCE ? 0 : 260);
        });
      });
    });
    back.addEventListener('click', () => { if (idx > 0) show(idx - 1, true); });

    const LEVEL = [
      { t: 'Inspektion reicht.', x: 'Ihr Dach wirkt gesund. Eine Sichtprüfung alle zwei Jahre hält es so: Wir reinigen die Rinnen, prüfen Anschlüsse und dokumentieren alles mit Drohnenfotos.' },
      { t: 'Reparatur – bald.', x: 'Einzelne Schäden sind kein Grund für ein neues Dach, aber ein Grund, zeitnah zu handeln. Kleine Undichtigkeiten werden sonst schnell zu nassem Holz und Schimmel.' },
      { t: 'Sanierung + Dämmung.', x: 'Alter, Feuchtigkeit und Wärmeverlust sprechen für eine Komplettsanierung. Mit der Dämmung sinken die Heizkosten spürbar – und Zuschüsse sind möglich, wir prüfen das für Sie.' }
    ];
    function finish() {
      const [age, leak, heat, dmg, insp] = answers.map(a => (a ? a.v : 0));
      let level = 0;
      if (leak >= 2 || dmg >= 3 || (dmg >= 1 && age >= 2) || (insp >= 2 && age >= 2)) level = 1;
      if (age >= 2 && (leak >= 2 || heat >= 2 || (heat >= 1 && (dmg >= 1 || age >= 3)))) level = 2;
      if (age >= 3 && leak >= 3) level = 2;
      const why = [];
      if (leak === 3) why.push('Regelmäßige Feuchte: Holz und Dämmung können schon gelitten haben.');
      if (leak === 2) why.push('Feuchte nach Starkregen deutet auf undichte Anschlüsse oder eine alte Unterdeckung.');
      if (dmg === 3) why.push('Verrutschte oder fehlende Ziegel: Hier kann Wasser eindringen.');
      if (dmg === 1) why.push('Moos hält Feuchtigkeit fest und schadet der Deckung auf Dauer.');
      why.push(['Unter 15 Jahre: Die Deckung ist meist noch gut.', '15–30 Jahre: Anschlüsse und Dichtungen altern zuerst.', '30–45 Jahre: Viele Deckungen sind am Ende ihrer Lebensdauer.', 'Älter als 45 Jahre oder unbekannt: Zeit für einen genauen Blick.'][age]);
      if (heat === 2) why.push('Kalt im Winter, heiß im Sommer – typisch für ein schlecht gedämmtes Dach.');
      if (heat === 1) why.push('Kühle Räume: Die Dämmung entspricht vermutlich nicht mehr dem Stand der Technik.');
      if (insp === 2) why.push('Lange keine Prüfung: Kleine Schäden bleiben so unentdeckt.');
      if (insp === 1) why.push('Letzte Prüfung vor 3–5 Jahren – eine neue lohnt sich.');
      const L = LEVEL[level];
      $('[data-q-rtitle]', root).textContent = L.t;
      $('[data-q-rtext]', root).textContent = L.x + (level < 2 && heat >= 1 ? ' Tipp: Denken Sie die Dämmung gleich mit.' : '');
      const ul = $('[data-q-why]', root);
      ul.textContent = '';
      why.slice(0, 4).forEach(t => { const li = d.createElement('li'); li.textContent = t; ul.appendChild(li); });
      qs.forEach(q => { q.hidden = true; });
      back.hidden = true; top.hidden = true;
      result.hidden = false;
      const gauge = $('[data-q-gauge]', root), needle = $('[data-q-needle]', root);
      gauge.dataset.level = level;
      needle.style.transform = 'translateX(0px)';
      requestAnimationFrame(() => requestAnimationFrame(() => { needle.style.transform = `translateX(${gauge.clientWidth * (level * 2 + 1) / 6}px)`; }));
      $('[data-q-rtitle]', root).focus({ preventScroll: true });
      const r = root.getBoundingClientRect();
      if (r.top < hdrH()) scrollToEl(root);
      const labels = ['Alter der Deckung', 'Feuchte Flecken', 'Heizkosten / kalte Räume', 'Sichtbare Schäden', 'Letzte Prüfung'];
      root.dataset.summary = `Online-Dach-Check – Empfehlung: ${L.t.replace(/\.$/, '')}\n` + answers.map((a, k) => `${labels[k]}: ${a ? a.label : '–'}`).join('\n');
      root.dataset.level = level;
      root.dataset.heat = heat;
    }
    $('[data-q-restart]', root).addEventListener('click', () => {
      answers.fill(null);
      $$('.opt', root).forEach(b => b.setAttribute('aria-pressed', 'false'));
      show(0, true);
    });
    $('[data-q-cta]', root).addEventListener('click', e => {
      e.preventDefault();
      const level = +root.dataset.level;
      prefill({
        anliegen: level === 0 ? 'check' : level === 1 ? 'reparatur' : (+root.dataset.heat >= 1 ? 'daemmung' : 'sanierung'),
        message: root.dataset.summary,
        note: 'Ihr Dach-Check-Ergebnis ist übernommen – prüfen Sie kurz das Anliegen und weiter geht’s.'
      });
    });
    show(0, false);
  }

  /* ------------------------------------------------------------ Projekte: Bild folgt dem Cursor */
  function initProjects() {
    const list = $('[data-plist]');
    if (!list) return;
    const rows = $$('.prow', list);
    let cursor = null, inner = null, imgs = [], tag = null;
    let x = 0, y = 0, tx = 0, ty = 0, rot = 0, raf = 0, active = -1, on = false;
    function build() {
      cursor = d.createElement('div'); cursor.className = 'pcursor'; cursor.setAttribute('aria-hidden', 'true');
      inner = d.createElement('div'); inner.className = 'pcursor__in';
      rows.forEach(r => {
        const src = $('img', r);
        const im = d.createElement('img');
        im.alt = ''; im.decoding = 'async'; im.loading = 'lazy';
        im.sizes = '300px'; im.srcset = src.getAttribute('srcset'); im.src = src.getAttribute('src');
        inner.appendChild(im); imgs.push(im);
      });
      tag = d.createElement('span'); tag.className = 'pcursor__tag';
      inner.appendChild(tag);
      cursor.appendChild(inner);
      d.body.appendChild(cursor);
    }
    function loop() {
      const k = REDUCE ? 1 : 0.15;
      const nx = lerp(x, tx, k), ny = lerp(y, ty, k);
      const vx = nx - x;
      x = nx; y = ny;
      rot = REDUCE ? 0 : lerp(rot, clamp(vx * 0.35, -9, 9), 0.12);
      cursor.style.transform = `translate3d(${(x - 150).toFixed(1)}px, ${(y - 200).toFixed(1)}px, 0) rotate(${rot.toFixed(2)}deg)`;
      if (on || Math.abs(tx - x) > 0.5 || Math.abs(rot) > 0.05) raf = requestAnimationFrame(loop); else raf = 0;
    }
    function setActive(i) {
      if (i === active) return;
      active = i;
      rows.forEach((r, k) => r.classList.toggle('is-active', k === i));
      imgs.forEach((im, k) => im.classList.toggle('is-on', k === i));
      if (i >= 0) tag.textContent = `${$('.prow__place', rows[i]).textContent} · ${$('.prow__meta dd', rows[i]).textContent}`;
    }
    function enable() {
      if (!cursor) build();
      list.addEventListener('pointermove', onMove);
      list.addEventListener('pointerleave', onLeave);
      rows.forEach((r, i) => r.addEventListener('pointerenter', r._pe = () => setActive(i)));
    }
    function disable() {
      list.removeEventListener('pointermove', onMove);
      list.removeEventListener('pointerleave', onLeave);
      rows.forEach(r => r._pe && r.removeEventListener('pointerenter', r._pe));
      onLeave();
    }
    function onMove(e) {
      if (e.pointerType !== 'mouse') return;
      tx = e.clientX; ty = e.clientY;
      if (!on) {
        on = true; x = tx; y = ty;
        list.classList.add('is-hover'); cursor.classList.add('is-on');
      }
      if (!raf) raf = requestAnimationFrame(loop);
    }
    function onLeave() {
      on = false;
      list.classList.remove('is-hover');
      if (cursor) cursor.classList.remove('is-on');
      setActive(-1);
    }
    const mq = matchMedia('(hover: hover) and (pointer: fine) and (min-width: 900px)');
    const apply = () => (mq.matches ? enable() : disable());
    mq.addEventListener('change', apply);
    apply();
  }

  /* ------------------------------------------------------------ Regen-Canvas */
  function initRain() {
    const c = $('[data-rain]');
    if (!c || !c.getContext) return;
    const sec = c.parentElement;
    const ctx = c.getContext('2d');
    const SL = 0.27;
    let w = 0, h = 0, drops = [], running = false, visible = false, last = 0;
    const rnd = (a, b) => a + Math.random() * (b - a);
    const drop = init => ({ x: rnd(-h * SL, w), y: init ? rnd(-h, h) : rnd(-140, -20), l: rnd(14, 46), v: rnd(780, 1350), g: Math.floor(Math.random() * 3) });
    function resize() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = sec.clientWidth; h = sec.clientHeight;
      c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(clamp(w * h / 7000, 40, 260));
      drops = Array.from({ length: n }, () => drop(true));
      draw(0);
    }
    const ALPHA = [0.07, 0.13, 0.22];
    function draw(dt) {
      ctx.clearRect(0, 0, w, h);
      ctx.lineCap = 'round';
      for (let gI = 0; gI < 3; gI++) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(236,234,229,${ALPHA[gI]})`;
        ctx.lineWidth = 0.7 + gI * 0.35;
        for (const p of drops) {
          if (p.g !== gI) continue;
          if (dt) { p.y += p.v * dt * (0.8 + gI * 0.2); p.x += p.v * dt * SL * (0.8 + gI * 0.2); }
          if (p.y - p.l > h || p.x - p.l * SL > w) { Object.assign(p, drop(false)); }
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.l * SL, p.y - p.l);
        }
        ctx.stroke();
      }
    }
    function tick(now) {
      if (!running) return;
      const dt = Math.min(0.05, (now - (last || now)) / 1000);
      last = now;
      draw(dt);
      requestAnimationFrame(tick);
    }
    const start = () => { if (running || REDUCE || !visible || d.hidden) return; running = true; last = 0; requestAnimationFrame(tick); };
    const stop = () => { running = false; };
    resize();
    let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 150); });
    if (REDUCE) return;
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; visible ? start() : stop(); }).observe(sec);
    d.addEventListener('visibilitychange', () => { d.hidden ? stop() : start(); });
  }

  /* ------------------------------------------------------------ Zähler */
  function initCounters() {
    const els = $$('[data-count]');
    els.forEach(el => {
      const since = el.dataset.since;
      const target = since ? new Date().getFullYear() - +since : +el.dataset.count;
      el.dataset.target = target;
      el.textContent = fmt.format(target);
    });
    if (REDUCE || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        const el = en.target, target = +el.dataset.target, t0 = performance.now(), dur = 1700;
        const stepFn = now => {
          const t = clamp((now - t0) / dur, 0, 1);
          el.textContent = fmt.format(Math.round(target * easeOut(t)));
          if (t < 1) requestAnimationFrame(stepFn);
        };
        requestAnimationFrame(stepFn);
      });
    }, { threshold: 0.6 });
    els.forEach(el => { el.textContent = '0'; io.observe(el); });
  }

  /* ------------------------------------------------------------ Ablauf: Giebel-Linie */
  function initProcess() {
    const root = $('[data-process]');
    if (!root) return;
    const svg = $('[data-process-svg]', root);
    const lineEl = $('[data-process-line]', root);
    const track = $('.process__track', root);
    const steps = $$('.step', root);
    const nodes = steps.map(s => $('.step__node', s));
    let fracs = [], total = 0;
    function layout() {
      if (!mqDesk.matches) return;
      const r = root.getBoundingClientRect();
      const pts = nodes.map(n => { const b = n.getBoundingClientRect(); return [b.left + b.width / 2 - r.left, b.top + b.height / 2 - r.top]; });
      svg.setAttribute('viewBox', `0 0 ${r.width} ${r.height}`);
      const str = pts.map(p => p.map(v => v.toFixed(1)).join(',')).join(' ');
      lineEl.setAttribute('points', str); track.setAttribute('points', str);
      total = 0; fracs = [0];
      for (let i = 1; i < pts.length; i++) { total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); fracs.push(total); }
      fracs = fracs.map(f => f / total);
      lineEl.style.strokeDasharray = total;
      setP(curP);
    }
    let curP = REDUCE ? 1 : 0;
    function setP(p) {
      curP = p;
      if (total) lineEl.style.strokeDashoffset = total * (1 - p);
      steps.forEach((s, i) => s.classList.toggle('is-on', p >= fracs[i] - 0.001 && p > 0));
    }
    layout();
    window.addEventListener('resize', layout);
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(layout);
    if (REDUCE || !hasGSAP) { setP(1); steps.forEach(s => s.classList.add('is-on')); return; }
    const mm = gsap.matchMedia();
    mm.add('(min-width: 900px)', () => {
      const st = ScrollTrigger.create({ trigger: root, start: 'top 75%', end: 'bottom 55%', scrub: 0.6, onUpdate: s => setP(s.progress), onRefresh: layout });
      return () => st.kill();
    });
    mm.add('(max-width: 899px)', () => {
      const io = new IntersectionObserver(entries => entries.forEach(en => { if (en.isIntersecting) en.target.classList.add('is-on'); }), { rootMargin: '0px 0px -35% 0px' });
      steps.forEach(s => io.observe(s));
      return () => io.disconnect();
    });
  }

  /* ------------------------------------------------------------ Karte + PLZ */
  function initArea() {
    const towns = $$('[data-towns] li');
    const map = $('[data-map]');
    towns.forEach(li => {
      const g = map && $(`.town[data-town="${li.dataset.town}"]`, map);
      if (!g) return;
      li.addEventListener('pointerenter', () => g.classList.add('is-hi'));
      li.addEventListener('pointerleave', () => g.classList.remove('is-hi'));
    });
    const form = $('[data-plz]');
    if (!form) return;
    const out = $('[data-plz-out]', form);
    const input = $('input', form);
    form.addEventListener('submit', e => {
      e.preventDefault();
      const v = input.value.replace(/\D/g, '');
      out.textContent = '';
      const b = d.createElement('b');
      let state, text;
      if (v.length !== 5) { state = 'out'; b.textContent = 'PLZ?'; text = 'Bitte fünf Ziffern eingeben.'; }
      else {
        const p2 = v.slice(0, 2), p3 = v.slice(0, 3);
        if (p2 === '20' || p2 === '22' || /^21[0-6]/.test(v) || p3 === '253' || p3 === '254') { state = 'ok'; b.textContent = 'Ja'; text = 'Liegt in unserem Gebiet – wir kommen gern vorbei.'; }
        else if (p3 === '217' || p3 === '255' || p3 === '213' || p3 === '235' || p3 === '239') { state = 'edge'; b.textContent = 'Randgebiet'; text = 'Knapp außerhalb – rufen Sie kurz an, oft passt es trotzdem.'; }
        else { state = 'out'; b.textContent = 'Eher nicht'; text = 'Außerhalb unseres Gebiets. Bei größeren Projekten fragen Sie gern trotzdem.'; }
      }
      out.dataset.state = state;
      out.appendChild(b);
      out.appendChild(d.createTextNode(text));
    });
  }

  /* ------------------------------------------------------------ Anfrage-Assistent */
  let wizApi = null;
  function prefill(o) { if (wizApi) wizApi.prefill(o); }

  function initWizard() {
    const form = $('[data-wiz]');
    if (!form) return;
    form.noValidate = true;
    const steps = $$('.wiz__step', form);
    const ind = $$('[data-wiz-steps] li', form);
    const btnBack = $('[data-wiz-back]', form), btnNext = $('[data-wiz-next]', form), btnSubmit = $('[data-wiz-submit]', form);
    const countEl = $('[data-wiz-count]', form);
    const nav = $('.wiz__nav', form);
    const done = $('[data-wiz-done]', form);
    const note = $('[data-wiz-note]', form);
    const N = steps.length;
    let cur = 0;

    // Fehlertexte mit Radiogruppen verknüpfen
    $$('input[name="anliegen"]', form).forEach(i => i.setAttribute('aria-describedby', 'err-anliegen'));
    $$('input[name="dringlichkeit"]', form).forEach(i => i.setAttribute('aria-describedby', 'err-dringlichkeit'));

    function go(i, focus = true) {
      steps.forEach((s, k) => { s.hidden = k !== i; });
      const s = steps[i];
      if (focus && !REDUCE) { s.classList.remove('is-enter'); void s.offsetWidth; s.classList.add('is-enter'); }
      ind.forEach((li, k) => { li.classList.toggle('is-done', k < i); if (k === i) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current'); });
      btnBack.hidden = i === 0;
      btnNext.hidden = i === N - 1;
      btnSubmit.hidden = i !== N - 1;
      countEl.textContent = `Schritt ${i + 1} von ${N}`;
      cur = i;
      if (focus) {
        const t = $('.wiz__title', s);
        if (form.getBoundingClientRect().top < hdrH()) scrollToEl(form, () => t.focus({ preventScroll: true }));
        else t.focus({ preventScroll: true });
      }
    }
    const err = name => $(`[data-err="${name}"]`, form);
    function setErr(name, bad, field) {
      const e = err(name);
      if (e) e.hidden = !bad;
      const fields = field ? [field] : $$(`[name="${name}"]`, form);
      fields.forEach(f => { if (bad) f.setAttribute('aria-invalid', 'true'); else f.removeAttribute('aria-invalid'); });
      return bad;
    }
    function validate(i) {
      const bad = [];
      const val = n => (form.elements[n] ? form.elements[n].value.trim() : '');
      if (i === 0 && setErr('anliegen', !form.querySelector('input[name="anliegen"]:checked'))) bad.push(form.querySelector('input[name="anliegen"]'));
      if (i === 1 && setErr('plz', !/^\d{5}$/.test(val('plz')), form.elements.plz)) bad.push(form.elements.plz);
      if (i === 2 && setErr('dringlichkeit', !form.querySelector('input[name="dringlichkeit"]:checked'))) bad.push(form.querySelector('input[name="dringlichkeit"]'));
      if (i === 3) {
        if (setErr('name', val('name').length < 2, form.elements.name)) bad.push(form.elements.name);
        if (setErr('telefon', val('telefon').replace(/\D/g, '').length < 6, form.elements.telefon)) bad.push(form.elements.telefon);
        const m = val('email');
        if (setErr('email', m !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(m), form.elements.email)) bad.push(form.elements.email);
        if (setErr('datenschutz', !form.elements.datenschutz.checked, form.elements.datenschutz)) bad.push(form.elements.datenschutz);
      }
      if (bad.length) bad[0].focus();
      return bad.length === 0;
    }
    form.addEventListener('input', e => {
      const t = e.target;
      if (!t.name || t.getAttribute('aria-invalid') !== 'true') return;
      if (t.type === 'radio') return;
      t.removeAttribute('aria-invalid');
      const map = { plz: 'plz', name: 'name', telefon: 'telefon', email: 'email' };
      if (map[t.name]) err(map[t.name]).hidden = true;
    });
    form.addEventListener('change', e => {
      const t = e.target;
      if (t.name === 'anliegen') { setErr('anliegen', false); $('[data-sos]', form).hidden = t.value !== 'sturm'; }
      if (t.name === 'dringlichkeit') { setErr('dringlichkeit', false); $('[data-sos2]', form).hidden = !/^Akut/.test(t.value); }
      if (t.name === 'datenschutz' && t.checked) setErr('datenschutz', false, t);
    });
    btnNext.addEventListener('click', () => { if (validate(cur)) go(cur + 1); });
    btnBack.addEventListener('click', () => go(cur - 1));
    form.addEventListener('keydown', e => {
      if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'checkbox' && cur < N - 1) { e.preventDefault(); if (validate(cur)) go(cur + 1); }
    });
    form.addEventListener('submit', e => {
      e.preventDefault();
      for (let i = 0; i < N; i++) { if (!validate(i)) { if (i !== cur) { go(i); validate(i); } return; } }
      const label = name => { const c = form.querySelector(`input[name="${name}"]:checked`); return c ? c.closest('label').textContent.trim() : ''; };
      const v = n => (form.elements[n] ? form.elements[n].value.trim() : '');
      const rows = [
        ['Anliegen', label('anliegen')],
        ['Gebäude', label('gebaeude')],
        ['Dachform', v('dachform') || 'weiß nicht'],
        ['Dachfläche', v('flaeche') || 'weiß nicht'],
        ['Ort', [v('plz'), v('ort')].filter(Boolean).join(' ')],
        ['Baujahr', v('baujahr')],
        ['Dringlichkeit', label('dringlichkeit')],
        ['Erreichbar', v('erreichbar')],
        ['Name', v('name')],
        ['Telefon', v('telefon')],
        ['E-Mail', v('email')],
        ['Nachricht', v('nachricht')]
      ].filter(r => r[1]);
      const dl = $('[data-wiz-sum]', form);
      dl.textContent = '';
      rows.forEach(([k, val]) => {
        const row = d.createElement('div');
        const dt = d.createElement('dt'); dt.textContent = k;
        const dd = d.createElement('dd'); dd.textContent = val;
        row.append(dt, dd); dl.appendChild(row);
      });
      const first = v('name').split(/\s+/)[0];
      $('[data-wiz-donetitle]', form).textContent = first ? `Danke, ${first}! Wir melden uns.` : 'Danke! Wir melden uns.';
      steps.forEach(s => { s.hidden = true; });
      nav.hidden = true; note.hidden = true;
      ind.forEach(li => { li.classList.add('is-done'); li.removeAttribute('aria-current'); });
      done.hidden = false;
      const t = $('[data-wiz-donetitle]', form);
      if (form.getBoundingClientRect().top < hdrH()) scrollToEl(form, () => t.focus({ preventScroll: true })); else t.focus({ preventScroll: true });
    });
    $('[data-wiz-reset]', form).addEventListener('click', () => {
      form.reset();
      $$('[aria-invalid]', form).forEach(f => f.removeAttribute('aria-invalid'));
      $$('.wiz__err, [data-sos], [data-sos2]', form).forEach(e => { e.hidden = true; });
      done.hidden = true; nav.hidden = false; note.hidden = true;
      go(0);
    });

    wizApi = {
      prefill(o) {
        if (o.anliegen) { const r = form.querySelector(`input[name="anliegen"][value="${o.anliegen}"]`); if (r) { r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true })); } }
        if (o.dachform && form.elements.dachform) form.elements.dachform.value = o.dachform;
        if (o.message && form.elements.nachricht) form.elements.nachricht.value = o.message;
        if (o.note) { note.textContent = o.note; note.hidden = false; } else note.hidden = true;
        if (!done.hidden) { done.hidden = true; nav.hidden = false; }
        go(0, false);
        scrollToEl($('#anfrage'), () => $('.wiz__title', steps[0]).focus({ preventScroll: true }));
      }
    };
    // Karten-Links („… anfragen“) wählen das passende Anliegen vor
    $$('[data-prefill]').forEach(a => a.addEventListener('click', e => {
      e.preventDefault();
      const r = form.querySelector(`input[name="anliegen"][value="${a.dataset.prefill}"]`);
      wizApi.prefill({ anliegen: a.dataset.prefill, note: r ? `Vorausgewählt: ${r.closest('label').textContent.trim()} – Sie können das jederzeit ändern.` : '' });
    }));
    go(0, false);
  }

  /* ------------------------------------------------------------ Aktionsleiste (Handy) */
  function initActionbar() {
    const bar = $('.actionbar');
    const inq = $('#anfrage');
    if (!bar || !inq || !('IntersectionObserver' in window)) return;
    new IntersectionObserver(([en]) => bar.classList.toggle('is-hidden', en.isIntersecting), { rootMargin: '0px 0px -30% 0px' }).observe(inq);
  }

  /* ------------------------------------------------------------ Start */
  initHero();
  initReveal();
  initRidge();
  initStack();
  initConfig();
  initCompare();
  initQuiz();
  initProjects();
  initRain();
  initCounters();
  initProcess();
  initArea();
  initWizard();
  initActionbar();

  if (hasGSAP) {
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(() => ScrollTrigger.refresh());
    window.addEventListener('load', () => ScrollTrigger.refresh());
  }
})();
