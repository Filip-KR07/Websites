/* Bestattungen Weidner – Modell „Stille“
   Bewegungs-Handschrift „Kerzenatem“: Szenen langsam und gleichmäßig, Bedienelemente schnell.
   Start in Etappen: Header, Menü, Hero-Licht und Uhr sofort; alles darunter in kleinen Häppchen. */
(() => {
  'use strict';

  /* ------------------------------------------------------------------
     KOSTEN-ORIENTIERUNG – alle Werte in Euro als [von, bis].
     Unverbindliche Orientierungswerte für die Demo, keine Festpreise.
     ------------------------------------------------------------------ */
  const KOSTEN = {
    // Leistungen des Bestatters: Überführung, Versorgung, Formalitäten, Beratung, Organisation
    bestatter: { erde: [1900, 2600], feuer: [1700, 2400], see: [1700, 2400], baum: [1700, 2400] },
    // Sarg (Erdbestattung) bzw. Sarg zur Einäscherung + Urne – Index: 0 schlicht, 1 klassisch, 2 gehoben
    sarg: [[650, 950], [1100, 1700], [1900, 3200]],
    sargUrne: [[450, 700], [750, 1200], [1300, 2200]],
    krematorium: [350, 550],            // nur bei Feuer-, See- und Baumbestattung
    // Friedhof bzw. Ruhestätte: Grabstelle, Beisetzung, Reederei, Baumplatz
    ruhestaette: { erde: [1800, 3800], feuer: [1000, 2400], see: [650, 1100], baum: [900, 2500] },
    feier: [[0, 0], [250, 450], [500, 950]],          // keine / Abschiedsraum / Kapelle oder Kirche
    blumen: [[150, 300], [300, 600], [600, 1200]],    // dezent / mittel / reich
    musik: [200, 450],
    druck: [180, 400],
    anzeige: [350, 900],
    kaffeetafelProPerson: [12, 20],
    rundung: 50
  };

  const D = document, html = D.documentElement;
  const MOTION_OFF = html.classList.contains('motion-off');
  const REDUCED = html.classList.contains('reduced');
  const STILL = MOTION_OFF || REDUCED;
  const $ = (s, r = D) => r.querySelector(s);
  const $$ = (s, r = D) => [...r.querySelectorAll(s)];
  const mqDesk = window.matchMedia('(min-width: 900px)');
  const mqFine = window.matchMedia('(hover: hover) and (pointer: fine)');
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const smooth = t => t * t * (3 - 2 * t);
  const easeInOut = t => -(Math.cos(Math.PI * t) - 1) / 2;
  window.__stilleReady = true;

  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* privat/gesperrt – egal */ } }
  };

  /* ---------------- Sofort: Header, Fortschritt, Menü ---------------- */
  const header = $('.site-header');
  const bar = $('.progress span');
  let maxScroll = 1;
  const measure = () => { maxScroll = Math.max(1, D.documentElement.scrollHeight - window.innerHeight); };
  let ticking = false;
  const onScroll = () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const y = window.scrollY;
      header.classList.toggle('is-scrolled', y > 8);
      bar.style.transform = `scaleX(${Math.min(1, y / maxScroll).toFixed(4)})`;
    });
  };
  measure(); onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => { measure(); onScroll(); }, { passive: true });
  window.addEventListener('load', measure);

  const menu = $('#menu'), menuBtn = $('.menu-btn');
  if (menu && typeof menu.showModal === 'function') {
    menuBtn.addEventListener('click', () => { menu.showModal(); menuBtn.setAttribute('aria-expanded', 'true'); });
    $('.menu-close', menu).addEventListener('click', () => menu.close());
    menu.addEventListener('close', () => menuBtn.setAttribute('aria-expanded', 'false'));
    menu.addEventListener('click', e => { if (e.target === menu) menu.close(); });
  } else if (menuBtn) {
    menuBtn.addEventListener('click', () => { location.hash = 'trauerfall'; });
  }

  /* Anker: weich scrollen (Lenis, falls aktiv), Fokus an das Ziel geben */
  let lenis = null;
  const scrollToY = y => {
    if (lenis) lenis.scrollTo(y, { duration: 1.4 });
    else window.scrollTo({ top: y, behavior: STILL ? 'auto' : 'smooth' });
  };
  D.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href').slice(1);
    const target = id && D.getElementById(id);
    if (!target) return;
    e.preventDefault();
    const wasMenu = menu && menu.open;
    if (wasMenu) menu.close();
    const go = () => {
      scrollToY(target.getBoundingClientRect().top + window.scrollY - (header.offsetHeight + 12));
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
      history.replaceState(null, '', '#' + id);
    };
    wasMenu ? requestAnimationFrame(go) : go();
  });

  /* ---------------- Sofort: Uhr „Es ist … Uhr. Wir nehmen ab.“ ---------------- */
  const clock = $('[data-clock]');
  const tick = () => {
    const d = new Date(), h = d.getHours(), m = String(d.getMinutes()).padStart(2, '0');
    const night = h >= 21 || h < 7;
    clock.textContent = `Es ist ${h}:${m} Uhr. ${night ? 'Wir sind wach und nehmen ab.' : 'Wir nehmen ab, jetzt und in jeder Nacht.'}`;
  };
  if (clock) { tick(); setInterval(tick, 30000); }

  /* ---------------- Sofort (nach erstem Frame): Licht auf Papier ---------------- */
  requestAnimationFrame(() => initLight($('.hero-light')));

  function initLight(canvas) {
    if (!canvas || !canvas.getContext) return;
    const hero = $('.hero'), glow = $('.ht-glow');
    const ctx = canvas.getContext('2d', { alpha: false });
    const RES = 0.4;            // interne Auflösung: weiches Licht braucht keine Schärfe
    const FPS = 24;             // gedrosselte Bildrate – die Bewegung ist ohnehin sehr langsam
    const IGNITE = 1400;        // ms: das Licht „wird angezündet“
    let W = 0, H = 0, HW = 1, HH = 1, gx = 0, gy = 0, base = null, running = false, visible = true, raf = 0, last = 0;
    const sprite = stops => {
      const c = D.createElement('canvas'); c.width = c.height = 256;
      const g = c.getContext('2d'), gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
      stops.forEach(([o, col]) => gr.addColorStop(o, col));
      g.fillStyle = gr; g.fillRect(0, 0, 256, 256); return c;
    };
    const light = sprite([[0, 'rgba(255,252,245,1)'], [0.22, 'rgba(253,247,236,0.9)'], [0.5, 'rgba(246,237,221,0.45)'], [1, 'rgba(240,230,212,0)']]);
    const warm = sprite([[0, 'rgba(255,212,148,0.55)'], [0.4, 'rgba(242,192,122,0.16)'], [1, 'rgba(232,182,112,0)']]);
    const mist = sprite([[0, 'rgba(255,255,255,0.55)'], [0.6, 'rgba(255,255,255,0.18)'], [1, 'rgba(255,255,255,0)']]);
    const mists = Array.from({ length: 6 }, (_, i) => ({ x: (i * 0.23 + 0.05) % 1, y: 0.2 + ((i * 0.31) % 0.7), r: 0.28 + (i % 3) * 0.1, v: 0.004 + (i % 3) * 0.002, a: 0.05 + (i % 2) * 0.03, ph: i * 1.7 }));
    const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
    const tStart = performance.now();

    function resize() {
      const r = canvas.getBoundingClientRect();
      const k = Math.min(window.devicePixelRatio || 1, 2) * RES;
      W = Math.max(2, Math.round(r.width * k)); H = Math.max(2, Math.round(r.height * k));
      HW = r.width; HH = r.height;
      canvas.width = W; canvas.height = H;
      if (glow) { const g = glow.getBoundingClientRect(); gx = g.left - r.left; gy = g.top - r.top; }
      base = D.createElement('canvas'); base.width = W; base.height = H;
      const b = base.getContext('2d');
      const g = b.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#D8D0C3'); g.addColorStop(1, '#CBC1B2');
      b.fillStyle = g; b.fillRect(0, 0, W, H);
    }

    function draw(now) {
      const t = (now - tStart) / 1000 + 30;
      const k = STILL ? 1 : easeInOut(clamp((now - tStart) / IGNITE, 0, 1));
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      ctx.drawImage(base, 0, 0);
      ptr.x += (ptr.tx - ptr.x) * 0.035; ptr.y += (ptr.ty - ptr.y) * 0.035;
      const m = Math.max(W, H);
      const lx = 0.34 + Math.sin(t * 0.071) * 0.13 + Math.sin(t * 0.023 + 1) * 0.05 + ptr.x * 0.2;
      const ly = 0.40 + Math.cos(t * 0.053) * 0.1 + ptr.y * 0.16;
      const fl = 0.97 + 0.02 * Math.sin(t * 1.9) + 0.01 * Math.sin(t * 4.3);
      const R = m * (0.62 + 0.26 * k);
      ctx.globalAlpha = k * fl; ctx.drawImage(light, lx * W - R, ly * H - R, R * 2, R * 2);
      const r2 = R * 0.42;
      ctx.globalAlpha = 0.75 * k * fl; ctx.drawImage(warm, lx * W - r2, ly * H - r2, r2 * 2, r2 * 2);
      for (const n of mists) {
        const x = (((n.x + t * n.v) % 1.3) - 0.15) * W, y = (n.y + Math.sin(t * 0.05 + n.ph) * 0.04) * H, rr = n.r * m;
        ctx.globalAlpha = n.a * (0.7 + 0.3 * Math.sin(t * 0.09 + n.ph)) * k;
        ctx.drawImage(mist, x - rr, y - rr * 0.5, rr * 2, rr);
      }
      ctx.globalAlpha = 1;
      if (glow) { glow.style.setProperty('--lx', `${(lx * HW - gx).toFixed(0)}px`); glow.style.setProperty('--ly', `${(ly * HH - gy).toFixed(0)}px`); }
      return k;
    }

    function loop(now) {
      raf = 0;
      if (!running) return;
      raf = requestAnimationFrame(loop);
      if (now - last < 1000 / FPS) return;
      last = now;
      draw(now);
    }
    const start = () => { if (STILL || running || !visible || D.hidden) return; running = true; raf = requestAnimationFrame(loop); };
    const stop = () => { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; };

    resize(); draw(performance.now());
    let rT = 0;
    window.addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(() => { resize(); draw(performance.now()); }, 150); }, { passive: true });
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? start() : stop(); }).observe(canvas);
    D.addEventListener('visibilitychange', () => { D.hidden ? stop() : start(); });
    if (!STILL && mqFine.matches) {
      hero.addEventListener('pointermove', e => {
        const r = hero.getBoundingClientRect();
        ptr.tx = ((e.clientX - r.left) / r.width - 0.34) * 1.4; ptr.ty = ((e.clientY - r.top) / r.height - 0.4) * 1.4;
      }, { passive: true });
      hero.addEventListener('pointerleave', () => { ptr.tx = 0; ptr.ty = 0; });
    }
    start();
  }

  /* ---------------- Warteschlange für alles unterhalb ---------------- */
  const queue = [];
  const later = fn => ('requestIdleCallback' in window) ? requestIdleCallback(fn, { timeout: 250 }) : setTimeout(fn, 20);
  function pump() {
    const t = performance.now();
    while (queue.length && performance.now() - t < 14) {
      try { queue.shift()(); } catch (err) { console.warn(err); }
    }
    if (queue.length) later(pump);
    else if (window.ScrollTrigger) window.ScrollTrigger.refresh();
  }

  queue.push(initReveal, initNavSpy, initSteps, initPrint, initExplorer, initCosts, initPlan, initContact, initRings, initMotion, initMagnet);
  setTimeout(() => later(pump), 60);

  /* ---------------- Reveal: Belichtung statt Fade-up ---------------- */
  function initReveal() {
    const els = $$('[data-reveal]');
    if (MOTION_OFF || !('IntersectionObserver' in window)) { els.forEach(el => el.classList.add('is-in')); return; }
    const io = new IntersectionObserver(entries => {
      const inn = entries.filter(e => e.isIntersecting);
      inn.forEach((e, i) => {
        e.target.style.transitionDelay = `${Math.min(i, 5) * 70}ms`;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
        setTimeout(() => { e.target.style.transitionDelay = ''; }, 2400);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    els.forEach(el => io.observe(el));
  }

  /* ---------------- Navigation: aktueller Abschnitt ---------------- */
  function initNavSpy() {
    const links = $$('.main-nav a');
    const map = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        const a = map.get(e.target.id);
        if (a && e.isIntersecting) { links.forEach(l => l.removeAttribute('aria-current')); a.setAttribute('aria-current', 'true'); }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    map.forEach((_, id) => { const s = D.getElementById(id); if (s) io.observe(s); });
  }

  /* ---------------- Erste Schritte: Checkliste als Weg ---------------- */
  function initSteps() {
    const section = $('#trauerfall');
    const boxes = $$('#steps-list input[type="checkbox"]');
    const count = $('.steps-count'), dotsEl = $('.steps-dots');
    const dots = boxes.map(() => { const i = D.createElement('i'); dotsEl.append(i); return i; });
    const KEY = 'weidner-schritte';
    const saved = store.get(KEY) || [];
    boxes.forEach(b => { b.checked = saved.includes(b.name); });
    const update = () => {
      const done = boxes.filter(b => b.checked);
      count.textContent = String(done.length);
      boxes.forEach((b, i) => dots[i].classList.toggle('on', b.checked));
      store.set(KEY, done.map(b => b.name));
    };
    boxes.forEach(b => b.addEventListener('change', update));
    $('[data-steps-reset]').addEventListener('click', () => { boxes.forEach(b => { b.checked = false; }); update(); });
    update();

    // Der Weg: eine leicht handgezeichnete Linie durch alle Knoten
    const list = $('#steps-list'), svg = $('.path-svg', list), base = $('.path-base', svg), ink = $('.path-ink', svg);
    const build = () => {
      const h = Math.round(list.offsetHeight);
      svg.setAttribute('viewBox', `0 0 48 ${h}`);
      let d = 'M24 0';
      for (let y = 18; y < h; y += 18) d += ` L${(24 + Math.sin(y * 0.011 + 1.3) * 1.5 + Math.sin(y * 0.047) * 0.6).toFixed(2)} ${y}`;
      d += ` L24 ${h}`;
      base.setAttribute('d', d); ink.setAttribute('d', d); ink.setAttribute('pathLength', '1');
    };
    build();
    let rT = 0;
    window.addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(build, 200); }, { passive: true });
    if (STILL) ink.style.strokeDashoffset = '0';

    // Wegmarke „Jetzt / Bald / Später“
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) section.dataset.stage = e.target.dataset.i; });
    }, { rootMargin: '-38% 0px -52% 0px' });
    $$('.step-group', list).forEach(g => io.observe(g));
  }

  /* ---------------- Drucken (nur der gewählte Bereich) ---------------- */
  function initPrint() {
    const clear = () => html.removeAttribute('data-print');
    window.addEventListener('afterprint', clear);
    $$('[data-print]').forEach(btn => btn.addEventListener('click', () => {
      html.setAttribute('data-print', btn.dataset.print);
      if (btn.dataset.print === 'plan' && updatePlan) updatePlan();
      window.print();
      setTimeout(clear, 1000);
    }));
  }

  /* ---------------- Bestattungsarten: vier Landschaften ---------------- */
  const ARTS = ['erde', 'feuer', 'see', 'baum'];
  let artenSelect = null, artenGo = null;
  function initExplorer() {
    const section = $('#arten');
    const tabs = $$('.tablist [role="tab"]');
    const panels = $$('.panels [role="tabpanel"]');
    const rows = $$('.range-chart li');
    const paths = $$('.horizon .hz');
    const fill = $('.horizon .hz-fill');

    // Horizontlinien je Landschaft: 5 Ebenen, 73 Punkte, Koordinaten im viewBox 1440 × 360
    const NP = 73, LAYERS = 5, TAU = Math.PI * 2;
    const trees = [[0.06, 0.05, 80], [0.15, 0.06, 118], [0.25, 0.05, 70], [0.36, 0.04, 54], [0.55, 0.05, 104], [0.64, 0.08, 150], [0.75, 0.05, 96], [0.88, 0.07, 128], [0.97, 0.04, 70]];
    const shape = {
      erde: (u, l) => 118 + l * 50 + 26 * Math.sin(u * TAU * 1.1 + l * 0.6 + 0.4) + 9 * Math.sin(u * TAU * 3.3 + l * 1.7),
      feuer: (u, l) => 204 + l * 34 - (132 - l * 22) * Math.exp(-Math.pow((u - 0.64) / (0.12 + l * 0.05), 2)) + 2.5 * Math.sin(u * 44 + l),
      see: (u, l) => 150 + Math.pow(l, 1.35) * 46 + (1.4 + l * 2.3) * Math.sin(u * TAU * (17 - l * 3) + l * 1.3),
      baum: (u, l) => {
        if (l > 1) return 214 + (l - 1) * 42 + 5 * Math.sin(u * 7 + l);
        let h = 0;   // Kronendach: weiche, sich überlagernde Baumkronen
        trees.forEach(([c, w, ht]) => { const cc = c + (l ? 0.045 : 0); h += ht * (l ? 0.55 : 0.8) * Math.exp(-Math.pow((u - cc) / (w * 0.85), 2)); });
        return (l ? 196 : 226) - Math.min(h, 88) * (0.55 + 0.45 * u) - 3 * Math.sin(u * 60 + l);
      }
    };
    const pts = {};
    ARTS.forEach(a => { pts[a] = []; for (let l = 0; l < LAYERS; l++) { const arr = new Float32Array(NP); for (let k = 0; k < NP; k++) arr[k] = shape[a](k / (NP - 1), l); pts[a].push(arr); } });
    let pos = 0, drawn = -1;
    const render = p => {
      if (Math.abs(p - drawn) < 0.0005) return;
      drawn = p;
      const i = clamp(Math.floor(p), 0, 2), f = smooth(clamp(p - i, 0, 1));
      const A = pts[ARTS[i]], B = pts[ARTS[i + 1]];
      for (let l = 0; l < LAYERS; l++) {
        let d = '', px = 0, py = 0;
        for (let k = 0; k < NP; k++) {
          const x = k * 20, y = A[l][k] + (B[l][k] - A[l][k]) * f;
          if (k === 0) d = `M0 ${y.toFixed(1)}`;
          else d += ` Q${px} ${py.toFixed(1)} ${((px + x) / 2).toFixed(1)} ${((py + y) / 2).toFixed(1)}`;
          px = x; py = y;
        }
        d += ` L1440 ${py.toFixed(1)}`;
        paths[l].setAttribute('d', d);
        if (l === 0) fill.setAttribute('d', d + ' L1440 360 L0 360 Z');
      }
    };
    let tw = 0;
    const tweenTo = target => {
      cancelAnimationFrame(tw);
      if (STILL) { pos = target; render(pos); return; }
      const from = pos, t0 = performance.now(), dur = 1600;
      const step = now => { const q = clamp((now - t0) / dur, 0, 1); pos = from + (target - from) * easeInOut(q); render(pos); if (q < 1) tw = requestAnimationFrame(step); };
      tw = requestAnimationFrame(step);
    };

    let current = 0;
    const select = (idx, { focus = false, fromScroll = false } = {}) => {
      const tab = tabs[idx];
      tabs.forEach(t => { const on = t === tab; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; });
      panels.forEach(p => {
        const on = p.id === tab.getAttribute('aria-controls');
        if (on && p.hidden) { p.hidden = false; p.classList.remove('is-entering'); void p.offsetWidth; p.classList.add('is-entering'); }
        else if (!on) p.hidden = true;
      });
      rows.forEach(r => r.classList.toggle('is-active', r.dataset.art === tab.dataset.art));
      section.dataset.art = tab.dataset.art;
      current = idx;
      if (focus) tab.focus();
      if (!fromScroll && !(artenGo && artenGo(idx))) tweenTo(idx);
    };
    artenSelect = (idx, fromScroll) => { if (idx !== current) select(idx, { fromScroll }); };
    artenSelect.render = p => { pos = p; render(p); };
    panels.forEach((p, i) => { p.hidden = i !== 0; p.addEventListener('animationend', () => p.classList.remove('is-entering')); });
    rows.forEach(r => r.classList.toggle('is-active', r.dataset.art === 'erde'));
    render(0);
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(i));
      t.addEventListener('keydown', e => {
        let n = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % tabs.length;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') n = 0;
        else if (e.key === 'End') n = tabs.length - 1;
        if (n !== null) { e.preventDefault(); select(n, { focus: true }); }
      });
    });
    // Klick auf eine Zeile im Vergleich wählt die Landschaft
    rows.forEach(r => r.addEventListener('click', () => select(ARTS.indexOf(r.dataset.art))));
    $$('[data-to-kosten]').forEach(b => b.addEventListener('click', () => {
      const radio = $(`#cost-form input[name="art"][value="${b.dataset.toKosten}"]`);
      if (radio) { radio.checked = true; radio.dispatchEvent(new Event('change', { bubbles: true })); }
      scrollToY($('#kosten').getBoundingClientRect().top + window.scrollY - (header.offsetHeight + 12));
      setTimeout(() => radio && radio.focus({ preventScroll: true }), STILL ? 0 : 1100);
    }));
  }

  /* ---------------- Kosten-Orientierung ---------------- */
  function initCosts() {
    const form = $('#cost-form');
    const range = $('#gaeste'), out = $('#gaeste-out');
    const sum = $('#cr-sum'), total = $('.cr-total'), odo = $('.odo');
    const sa = $('#cr-a'), sb = $('#cr-b'), sc = $('#cr-c');
    const [segA, segB, segC] = $$('.cr-bar span');
    const add = (acc, r) => { acc[0] += r[0]; acc[1] += r[1]; return acc; };
    const rd = (n, up) => (up ? Math.ceil(n / KOSTEN.rundung) : Math.floor(n / KOSTEN.rundung)) * KOSTEN.rundung;
    const fmt = n => n.toLocaleString('de-DE');
    const span = r => r[1] === 0 ? '0 €' : `${fmt(rd(r[0]))}–${fmt(rd(r[1], true))} €`;

    // Zählwerk: jede Ziffer eine Walze (nur Darstellung, der Text bleibt in #cr-sum für Screenreader)
    let sig = '', reels = [];
    const odoSet = text => {
      const chars = [...text];
      const s = chars.map(c => (/\d/.test(c) ? 'd' : c)).join('');
      if (s !== sig) {
        sig = s; odo.replaceChildren(); reels = [];
        chars.forEach(c => {
          if (/\d/.test(c)) {
            const w = D.createElement('span'); w.className = 'od-d';
            const reel = D.createElement('span'); reel.className = 'od-reel';
            for (let n = 0; n < 10; n++) { const x = D.createElement('span'); x.textContent = String(n); reel.append(x); }
            w.append(reel); odo.append(w); reels.push(reel);
            reel.style.transition = 'none';
          } else { const x = D.createElement('span'); x.textContent = c; odo.append(x); }
        });
      }
      const digits = chars.filter(c => /\d/.test(c));
      reels.forEach((r, i) => {
        r.style.transitionDelay = `${i * 35}ms`;
        r.style.transform = `translateY(${-Number(digits[i]) * 10}%)`;
      });
      requestAnimationFrame(() => reels.forEach(r => { if (r.style.transition === 'none') r.style.transition = ''; }));
    };
    if (odo && !STILL) total.classList.add('has-odo');

    const calc = () => {
      const f = new FormData(form);
      const art = f.get('art') || 'erde';
      const aus = +f.get('aus') || 0;
      const gaeste = +range.value;
      out.textContent = String(gaeste);
      range.style.setProperty('--p', `${(gaeste / +range.max) * 100}%`);
      const A = add([...KOSTEN.bestatter[art]], art === 'erde' ? KOSTEN.sarg[aus] : KOSTEN.sargUrne[aus]);
      if (art !== 'erde') add(A, KOSTEN.krematorium);
      const B = [...KOSTEN.ruhestaette[art]];
      const C = [0, 0];
      add(C, KOSTEN.feier[+f.get('feier') || 0]);
      add(C, KOSTEN.blumen[+f.get('blumen') || 0]);
      if (f.get('musik')) add(C, KOSTEN.musik);
      if (f.get('druck')) add(C, KOSTEN.druck);
      if (f.get('anzeige')) add(C, KOSTEN.anzeige);
      add(C, [gaeste * KOSTEN.kaffeetafelProPerson[0], gaeste * KOSTEN.kaffeetafelProPerson[1]]);
      const T = [A[0] + B[0] + C[0], A[1] + B[1] + C[1]];
      sa.textContent = span(A); sb.textContent = span(B); sc.textContent = span(C);
      const text = span(T);
      if (sum.textContent !== text) sum.textContent = text;
      if (total.classList.contains('has-odo')) odoSet(text);
      const mid = r => (r[0] + r[1]) / 2, mt = mid(T) || 1;
      const pa = mid(A) / mt, pb = mid(B) / mt, pc = mid(C) / mt;
      segA.style.transform = `scaleX(${pa.toFixed(4)})`;
      segB.style.transform = `translateX(${(pa * 100).toFixed(2)}%) scaleX(${pb.toFixed(4)})`;
      segC.style.transform = `translateX(${((pa + pb) * 100).toFixed(2)}%) scaleX(${pc.toFixed(4)})`;
    };
    form.addEventListener('input', calc);
    form.addEventListener('change', calc);
    form.addEventListener('submit', e => e.preventDefault());
    calc();
    // „Beratung vereinbaren“ wählt das passende Anliegen vor
    $$('[data-anliegen]').forEach(a => a.addEventListener('click', () => { const s = $('#c-anliegen'); if (s) s.selectedIndex = 0; }));
  }

  /* ---------------- Vorsorge-Planer: der Brief ---------------- */
  let updatePlan = null;
  function initPlan() {
    const form = $('#plan-form');
    const outs = Object.fromEntries($$('[data-out]').map(el => [el.dataset.out, el]));
    const dateStr = new Date().toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
    outs.datum.textContent = `Lübeck, ${dateStr}`;
    const setOut = (key, val) => {
      const el = outs[key];
      const v = (val || '').trim();
      const next = v || 'noch offen';
      if (el.textContent === next) return;
      el.textContent = next;   // Nutzereingaben nur als Text
      el.classList.toggle('is-empty', !v);
      if (!STILL && v) { el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); }
    };
    updatePlan = () => {
      const f = new FormData(form);
      setOut('art', f.get('p-art'));
      setOut('ort', f.get('p-ort'));
      setOut('feier', f.get('p-feier'));
      setOut('musik', f.get('p-musik'));
      setOut('blumen', f.getAll('p-blumen').join(', '));
      setOut('worte', f.get('p-worte'));
      const n = (f.get('p-name') || '').trim();
      $('span', outs.name).textContent = n || '—';
    };
    form.addEventListener('input', updatePlan);
    form.addEventListener('change', updatePlan);
    form.addEventListener('submit', e => e.preventDefault());
    $('[data-plan-reset]').addEventListener('click', () => { form.reset(); updatePlan(); });
    updatePlan();
  }

  /* ---------------- Kontaktformular (nur clientseitig) ---------------- */
  function initContact() {
    const form = $('#contact-form'), success = $('#contact-success'), sumEl = $('#success-sum');
    const name = $('#c-name'), tel = $('#c-tel'), mail = $('#c-mail'), ok = $('#c-ok');
    const show = (input, errId, bad) => {
      const err = $('#' + errId);
      err.hidden = !bad;
      input.setAttribute('aria-invalid', String(bad));
      const ids = (input.getAttribute('aria-describedby') || '').split(' ').filter(x => x && x !== errId);
      if (bad) ids.push(errId);
      if (ids.length) input.setAttribute('aria-describedby', ids.join(' ')); else input.removeAttribute('aria-describedby');
      return bad;
    };
    const mailOk = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
    const telOk = v => v.replace(/[^\d]/g, '').length >= 6;
    form.addEventListener('submit', e => {
      e.preventDefault();
      const bad = [];
      if (show(name, 'c-name-err', !name.value.trim())) bad.push(name);
      const t = tel.value.trim(), m = mail.value.trim();
      const reach = (t && telOk(t)) || (m && mailOk(m));
      if (show(mail, 'c-mail-err', !reach)) bad.push(t ? tel : mail);
      if (show(ok, 'c-ok-err', !ok.checked)) bad.push(ok);
      if (bad.length) { bad[0].focus(); return; }
      sumEl.replaceChildren();
      const rows = [['Name', name.value.trim()], ['Telefon', t || '—'], ['E-Mail', m || '—'], ['Anliegen', $('#c-anliegen').value], ['Rückruf', $('#c-zeit').value], ['Nachricht', $('#c-msg').value.trim() || '—']];
      rows.forEach(([k, v]) => {
        const d = D.createElement('div'), dt = D.createElement('dt'), dd = D.createElement('dd');
        dt.textContent = k; dd.textContent = v; d.append(dt, dd); sumEl.append(d);
      });
      form.hidden = true; success.hidden = false; success.focus();
    });
    $('[data-contact-again]').addEventListener('click', () => {
      form.reset(); success.hidden = true; form.hidden = false; name.focus();
    });
  }

  /* ---------------- Jahresringe vorbereiten ---------------- */
  let ringsApi = null;
  function initRings() {
    const svg = $('.rings-svg');
    if (!svg) return;
    const rings = $$('.rings-disc .ring:not(.ring-bark)', svg), crack = $('.ring-crack', svg);
    [...rings, crack].forEach(p => p.setAttribute('pathLength', '1'));
    const labels = $$('.ring-label', svg), items = $$('.timeline li');
    const keyIdx = labels.map(l => rings.findIndex(r => r.dataset.year === l.dataset.year));
    const setView = () => svg.setAttribute('viewBox', mqDesk.matches ? '0 0 760 600' : '0 0 600 600');
    setView(); mqDesk.addEventListener('change', setView);
    const light = drawnCount => {
      labels.forEach((l, i) => l.classList.toggle('is-lit', drawnCount > keyIdx[i]));
      items.forEach(li => { const i = labels.findIndex(l => l.dataset.year === li.dataset.year); li.classList.toggle('is-lit', i > -1 && drawnCount > keyIdx[i]); });
    };
    ringsApi = { rings, crack, light };
    if (STILL || !window.gsap) { [...rings, crack].forEach(p => { p.style.strokeDashoffset = '0'; }); light(rings.length + 1); }
  }

  /* ---------------- Scroll-Choreografie (GSAP, Lenis) ---------------- */
  function initMotion() {
    const quote = $('[data-words]');
    // Wörter in Spans zerlegen (nur eigener, statischer Text – keine Nutzereingaben)
    if (quote) {
      const words = quote.textContent.split(' ');
      quote.textContent = '';
      words.forEach((w, i) => {
        const s = D.createElement('span'); s.className = 'w'; s.textContent = w; quote.append(s);
        if (i < words.length - 1) quote.append(D.createTextNode(' '));
      });
    }
    if (STILL || !window.gsap || !window.ScrollTrigger) { html.classList.remove('arten-scrolly'); return; }
    const { gsap, ScrollTrigger } = window;
    gsap.registerPlugin(ScrollTrigger);

    if (window.Lenis) {
      lenis = new window.Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.9 });
      window.__lenis = lenis;
      lenis.on('scroll', ScrollTrigger.update);
      lenis.on('scroll', onScroll);
      gsap.ticker.add(t => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }

    // 1 · Der Weg zeichnet sich mit dem Lesen
    gsap.fromTo('.path-ink', { strokeDashoffset: 1 }, {
      strokeDashoffset: 0, ease: 'none',
      scrollTrigger: { trigger: '#steps-list', start: 'top 62%', end: 'bottom 62%', scrub: 0.9 }
    });

    // 2 · Haltung: Wort für Wort aus der Dämmerung
    const mm = gsap.matchMedia();
    mm.add({ desk: '(min-width: 900px)', mob: '(max-width: 899px)' }, ctx => {
      const { desk } = ctx.conditions;
      gsap.fromTo('.stance-quote .w', { opacity: 0.16 }, {
        opacity: 1, ease: 'none', stagger: 0.12,
        scrollTrigger: { trigger: '.stance', start: desk ? 'top 10%' : 'top 70%', end: desk ? 'bottom 95%' : 'bottom 60%', scrub: 0.8 }
      });
      // 4 · Der Brief richtet sich auf
      gsap.fromTo('.sheet', { rotateX: 44, yPercent: 4, scale: 0.94 }, {
        rotateX: 0, yPercent: 0, scale: 1, ease: 'none',
        scrollTrigger: { trigger: '.plan-grid', start: 'top 95%', end: desk ? 'top 28%' : 'top 40%', scrub: 1 }
      });
      gsap.fromTo('.sheet-fold', { opacity: 1 }, { opacity: 0.4, ease: 'none', scrollTrigger: { trigger: '.plan-grid', start: 'top 95%', end: 'top 28%', scrub: 1 } });
      return () => {};
    });

    // 3 · Vier Landschaften: Scroll führt durch Erde, Feuer, Wasser, Baum (sticky, kein Pin)
    mm.add('(min-width: 900px) and (min-height: 700px)', () => {
      html.classList.add('arten-scrolly');
      const meter = $$('.arten-meter li');
      const st = ScrollTrigger.create({
        trigger: '.arten-track', start: 'top top', end: 'bottom bottom',
        onUpdate: self => {
          const x = self.progress * 3, i = Math.min(2, Math.floor(x));
          const p = i + smooth(clamp((x - i - 0.3) / 0.4, 0, 1));
          if (artenSelect) { artenSelect.render(p); artenSelect(Math.round(p), true); }
          meter.forEach((m, k) => m.style.setProperty('--f', clamp(self.progress * 4 - k, 0, 1).toFixed(3)));
        }
      });
      artenGo = idx => {
        const q = [0.04, 1 / 3, 2 / 3, 0.96][idx];
        scrollToY(st.start + q * (st.end - st.start));
        return true;
      };
      return () => { html.classList.remove('arten-scrolly'); artenGo = null; };
    });

    // 5 · Jahresringe wachsen von innen nach außen
    if (ringsApi) {
      const { rings, crack, light } = ringsApi;
      const S = 0.32;
      const tl = gsap.timeline({
        scrollTrigger: { trigger: '.rings', start: 'top 80%', end: 'bottom 70%', scrub: 1 },
        onUpdate: () => light(Math.floor((tl.time() - 0.5) / S) + 1)
      });
      tl.to(rings, { strokeDashoffset: 0, duration: 1, stagger: S, ease: 'none' });
      tl.to(crack, { strokeDashoffset: 0, duration: 2, ease: 'none' }, '>-1.6');
    }

    // Siegel dreht sich langsam mit dem Lesen
    gsap.fromTo('.seal svg', { rotation: -18 }, { rotation: 26, ease: 'none', scrollTrigger: { trigger: '.voices', start: 'top bottom', end: 'bottom top', scrub: 1.5 } });

    ScrollTrigger.addEventListener('refresh', measure);
  }

  /* ---------------- Magnetische Knöpfe (nur feiner Zeiger) ---------------- */
  function initMagnet() {
    if (STILL || !mqFine.matches) return;
    $$('.btn').forEach(btn => {
      const inner = btn.firstElementChild;
      if (!inner) return;
      let tx = 0, ty = 0, x = 0, y = 0, raf = 0;
      const loop = () => {
        x += (tx - x) * 0.16; y += (ty - y) * 0.16;
        inner.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)`;
        raf = (Math.abs(tx - x) > 0.05 || Math.abs(ty - y) > 0.05) ? requestAnimationFrame(loop) : 0;
      };
      const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
      btn.addEventListener('pointermove', e => {
        const r = btn.getBoundingClientRect();
        tx = clamp((e.clientX - r.left - r.width / 2) * 0.16, -7, 7);
        ty = clamp((e.clientY - r.top - r.height / 2) * 0.3, -5, 5);
        kick();
      });
      btn.addEventListener('pointerleave', () => { tx = 0; ty = 0; kick(); });
    });
  }
})();
