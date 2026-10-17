/* ==========================================================================
   Zahnarztpraxis Dr. Lea Sommer – Modell „Klarheit“ (Demo)
   Bewegungs-Handschrift „kalibriert“: Scans mit konstanter Geschwindigkeit,
   Zustände mit kräftigem Ease-out, nichts federt nach.
   Alle anpassbaren Werte stehen gesammelt im Block „Konfiguration“.
   ========================================================================== */
(() => {
  'use strict';
  window.__sommerReady = true;

  /* ---------- Konfiguration ---------- */
  // Öffnungszeiten: Wochentag (0 = So … 6 = Sa) → [öffnet, schließt] in Minuten ab 0 Uhr
  const OEFFNUNGSZEITEN = { 1: [480, 1140], 2: [480, 1140], 3: [480, 840], 4: [480, 1140], 5: [480, 900] };
  const ZEITZONE = 'Europe/Berlin';
  // Atemübung: Sekunden je Phase und Anzahl der Runden; ATEM_FARBE = wie stark die Seite beim Einatmen aufhellt (0–1)
  const ATEM = { ein: 4, halten: 4, aus: 6, runden: 5 };
  const ATEM_FARBE = 0.75;
  // Panorama-Scanner im Hero: Geschwindigkeit der automatischen Fahrt (px/s) und Nachlauf der Maus (0–1, kleiner = träger)
  const SCANNER = { tempo: 130, nachlauf: 0.12, pauseNachMaus: 1400 };
  // Behandlungsweg: Höhe der „Zeichenlinie“ im Fenster (0 = oben, 1 = unten)
  const WEG_LINIE = 0.68;

  /* ---------- Grundlagen ---------- */
  const root = document.documentElement;
  const MOTION = root.classList.contains('motion-ok');
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const hasGSAP = !!(window.gsap && window.ScrollTrigger);
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const EASE = 'cubic-bezier(0.23, 1, 0.32, 1)';
  const EASE_IO = 'cubic-bezier(0.77, 0, 0.175, 1)';
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const hdrH = () => ($('.hdr') ? $('.hdr').offsetHeight : 64);
  const fade = (el, from = {}, dur = 260) => {
    if (!MOTION || !el || !el.animate) return;
    el.animate([{ opacity: 0, transform: 'translateY(6px)', ...from }, { opacity: 1, transform: 'none', filter: 'blur(0)' }], { duration: dur, easing: EASE });
  };

  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);

  /* ---------- Smooth Scroll (Lenis) ---------- */
  let lenis = null;
  if (MOTION && window.Lenis) {
    lenis = new window.Lenis({ duration: 1.1, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    window.__lenis = lenis;
    if (hasGSAP) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  function scrollToEl(el) {
    const off = -(hdrH() + 12);
    if (lenis) lenis.scrollTo(el, { offset: off, duration: 1.2 });
    else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + off, behavior: MOTION ? 'smooth' : 'auto' });
  }

  /* ---------- Header, Scan-Fortschritt, aktive Navigation ---------- */
  function initHeader() {
    const hdr = $('.hdr');
    const bar = $('.progress__bar');
    let ticking = false;
    const update = () => {
      ticking = false;
      const y = window.scrollY;
      hdr.classList.toggle('is-scrolled', y > 8);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max).toFixed(4) : 0})`;
    };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();

    const links = $$('.nav a');
    const map = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        links.forEach((a) => a.classList.remove('is-active'));
        const a = map.get(en.target.id);
        if (a) a.classList.add('is-active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach((s) => io.observe(s));
  }

  /* Navigation: Zeichen rollen beim Hover (nur feiner Zeiger) */
  function initRoll() {
    if (!MOTION || !finePointer.matches) return;
    $$('[data-roll]').forEach((a) => {
      const text = a.textContent.trim();
      a.textContent = '';
      const sr = document.createElement('span'); sr.className = 'sr-only'; sr.textContent = text;
      const vis = document.createElement('span'); vis.className = 'roll'; vis.setAttribute('aria-hidden', 'true');
      [...text].forEach((ch, i) => { const c = document.createElement('span'); c.className = 'roll__c'; c.style.setProperty('--i', i); c.textContent = ch; vis.append(c); });
      a.append(sr, vis);
    });
  }

  /* Magnetische Haupt-Buttons (nur feiner Zeiger) – nutzt `translate`, damit `:active { transform: scale() }` erhalten bleibt */
  function initMagnetic() {
    if (!MOTION || !finePointer.matches) return;
    $$('[data-magnetic]').forEach((el) => {
      let x = 0, y = 0, tx = 0, ty = 0, raf = 0;
      const step = () => {
        raf = 0;
        x += (tx - x) * 0.18; y += (ty - y) * 0.18;
        el.style.translate = `${x.toFixed(2)}px ${y.toFixed(2)}px`;
        if (Math.abs(tx - x) > 0.05 || Math.abs(ty - y) > 0.05) raf = requestAnimationFrame(step);
      };
      el.addEventListener('pointermove', (e) => {
        const b = el.getBoundingClientRect();
        tx = clamp((e.clientX - (b.left + b.width / 2)) * 0.22, -8, 8);
        ty = clamp((e.clientY - (b.top + b.height / 2)) * 0.32, -6, 6);
        if (!raf) raf = requestAnimationFrame(step);
      });
      el.addEventListener('pointerleave', () => { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(step); });
    });
  }

  /* ---------- Handy-Aktionsleiste: fährt ein, sobald die Hero-Buttons aus dem Bild sind ---------- */
  function initMobileBar() {
    const bar = $('.mbar');
    const anchor = $('.hero__actions');
    if (!bar) return;
    if (!anchor || !('IntersectionObserver' in window)) { bar.classList.add('is-shown'); return; }
    new IntersectionObserver(([en]) => {
      bar.classList.toggle('is-shown', !en.isIntersecting);
      bar.inert = en.isIntersecting; // eingefahren = nicht per Tab erreichbar
    }).observe(anchor);
  }

  /* ---------- Menü (Dialog) ---------- */
  const menu = $('#menu');
  const menuBtn = $('[data-menu-open]');
  function openMenu() {
    if (!menu || typeof menu.showModal !== 'function') return;
    menu.showModal();
    root.classList.add('menu-open');
    menuBtn.setAttribute('aria-expanded', 'true');
    if (lenis) lenis.stop();
    requestAnimationFrame(() => menu.classList.add('is-open'));
  }
  function closeMenu(immediate) {
    if (!menu || !menu.open) return;
    menu.classList.remove('is-open');
    menuBtn.setAttribute('aria-expanded', 'false');
    root.classList.remove('menu-open');
    if (lenis) lenis.start();
    if (immediate || !MOTION) menu.close();
    else setTimeout(() => { if (!menu.classList.contains('is-open')) menu.close(); }, 300);
  }
  function initMenu() {
    if (!menu) return;
    menuBtn.addEventListener('click', openMenu);
    $('[data-menu-close]').addEventListener('click', () => closeMenu());
    menu.addEventListener('cancel', (e) => { e.preventDefault(); closeMenu(); });
    menu.addEventListener('click', (e) => { if (e.target === menu) closeMenu(); });
    window.matchMedia('(min-width: 1241px)').addEventListener('change', (e) => { if (e.matches) closeMenu(true); });
  }

  /* ---------- Anker-Links ---------- */
  function initAnchors() {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a || e.defaultPrevented) return;
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const target = document.getElementById(id.slice(1));
      if (!target) return;
      e.preventDefault();
      if (a.dataset.anliegen && booking) booking.prefill(a.dataset.anliegen);
      if (menu && menu.contains(a)) closeMenu(true);
      if (id === '#top') {
        if (lenis) lenis.scrollTo(0, { duration: 1.2 }); else window.scrollTo({ top: 0, behavior: MOTION ? 'smooth' : 'auto' });
      } else {
        scrollToEl(target);
      }
      history.replaceState(null, '', id);
      if (target.tagName === 'SECTION') {
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      }
    });
  }

  /* ---------- Hero: Panorama-Scanner ----------
     Fenster (.pano__win) und Röntgenebene (.pano__xr) bewegen sich gegenläufig per transform –
     die Röntgenebene bleibt deckungsgleich mit der Zeichnung. Leerlauf = WAAPI auf dem Compositor,
     Maus/Finger = kurzer rAF-Nachlauf, der von selbst stoppt. */
  function bezier(x1, y1, x2, y2) {
    const A = (a, b) => 1 - 3 * b + 3 * a, B = (a, b) => 3 * b - 6 * a, C = (a) => 3 * a;
    const at = (t, a, b) => ((A(a, b) * t + B(a, b)) * t + C(a)) * t;
    const slope = (t, a, b) => 3 * A(a, b) * t * t + 2 * B(a, b) * t + C(a);
    const tFor = (x) => { let t = x; for (let i = 0; i < 8; i++) { const s = slope(t, x1, x2); if (Math.abs(s) < 1e-6) break; t -= (at(t, x1, x2) - x) / s; } return clamp(t, 0, 1); };
    return (x) => at(tFor(x), y1, y2);
  }
  const easeIO = bezier(0.77, 0, 0.175, 1);
  const LUT = Array.from({ length: 201 }, (_, i) => easeIO(i / 200));
  const invEase = (y) => { let lo = 0, hi = 200; while (lo < hi) { const m = (lo + hi) >> 1; if (LUT[m] < y) lo = m + 1; else hi = m; } return lo / 200; };

  function initPano() {
    const pano = $('[data-pano]');
    if (!pano) return;
    const img = $('.pano__img', pano), win = $('[data-pano-win]', pano), xr = $('[data-pano-xr]', pano);
    const hero = $('[data-hero]');
    let W = 0, w = 0, x = 0, tx = 0, raf = 0, anims = null, dir = -1, idle = 0, visible = true, dragging = false;
    const max = () => Math.max(0, W - w);
    const apply = (v) => {
      win.style.transform = `translate3d(${v.toFixed(1)}px,0,0)`;
      xr.style.transform = `translate3d(${(-v).toFixed(1)}px,0,0)`;
    };
    const measure = () => {
      const keep = W ? x / Math.max(1, max()) : 0.56;
      W = img.clientWidth; w = win.offsetWidth;
      xr.style.width = `${W}px`;
      x = tx = keep * max();
      if (anims) startAuto(); else apply(x);
    };
    const currentX = () => {
      const m = new DOMMatrixReadOnly(getComputedStyle(win).transform);
      return m.m41;
    };
    function stopAuto() {
      if (!anims) return;
      x = tx = currentX();
      anims.forEach((a) => a.cancel());
      anims = null;
      apply(x);
    }
    function startAuto() {
      if (anims) { x = currentX(); anims.forEach((a) => a.cancel()); anims = null; }
      const m = max();
      if (!MOTION || m < 20 || !win.animate) return;
      const D = clamp(m / SCANNER.tempo * 1000, 5200, 11000);
      const opts = { duration: D, iterations: Infinity, direction: 'alternate', easing: 'cubic-bezier(0.77, 0, 0.175, 1)' };
      anims = [
        win.animate([{ transform: 'translate3d(0px,0,0)' }, { transform: `translate3d(${m}px,0,0)` }], opts),
        xr.animate([{ transform: 'translate3d(0px,0,0)' }, { transform: `translate3d(${-m}px,0,0)` }], opts)
      ];
      const p = clamp(x / m, 0, 1);
      // Richtung beibehalten: vorwärts (0 → m) in geraden, rückwärts in ungeraden Durchläufen
      const t = dir > 0 ? invEase(p) * D : D + (1 - invEase(p)) * D;
      anims.forEach((a) => { a.currentTime = t; if (!visible || document.hidden) a.pause(); });
    }
    const step = () => {
      raf = 0;
      const k = dragging ? 0.35 : SCANNER.nachlauf;
      const d = tx - x;
      if (Math.abs(d) > 0.4) dir = d > 0 ? 1 : -1;
      x += d * k;
      apply(x);
      if (Math.abs(tx - x) > 0.3) raf = requestAnimationFrame(step);
    };
    const follow = (clientX) => {
      const b = img.getBoundingClientRect();
      tx = clamp(clientX - b.left - w / 2, 0, max());
      clearTimeout(idle);
      stopAuto();
      if (!raf) raf = requestAnimationFrame(step);
    };
    const resumeLater = (ms) => { clearTimeout(idle); idle = setTimeout(() => { if (!dragging) startAuto(); }, ms); };

    measure();
    if (window.ResizeObserver) new ResizeObserver(() => measure()).observe(img);
    if (!MOTION) return;

    // Maus: Scanner folgt im ganzen Hero
    hero.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') follow(e.clientX); });
    hero.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') resumeLater(SCANNER.pauseNachMaus); });
    // Finger/Stift: horizontal wischen auf dem Panorama (vertikal scrollt weiter)
    img.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse') return;
      dragging = true; follow(e.clientX);
    });
    img.addEventListener('pointermove', (e) => { if (dragging) follow(e.clientX); });
    const end = () => { if (!dragging) return; dragging = false; resumeLater(1800); };
    img.addEventListener('pointerup', end);
    img.addEventListener('pointercancel', end);

    new IntersectionObserver(([en]) => {
      visible = en.isIntersecting;
      if (anims) anims.forEach((a) => (visible && !document.hidden ? a.play() : a.pause()));
    }).observe(pano);
    document.addEventListener('visibilitychange', () => { if (anims) anims.forEach((a) => (document.hidden || !visible ? a.pause() : a.play())); });

    // Nach dem Scan-Intro: Scanner steht dort, wo die Scanlinie den Hero verlassen hat, und fährt los
    const kick = () => { if (raf || anims || dragging) return; x = tx = max(); dir = -1; apply(x); startAuto(); };
    const wait = root.classList.contains('scan-skip') ? 0 : Math.max(0, 1250 - performance.now());
    setTimeout(kick, wait);
  }

  /* ---------- Behandlungsweg: eine Linie, die sich beim Scrollen zeichnet und verzweigt ---------- */
  function initRoute() {
    const list = $('[data-route]');
    if (!list) return;
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'route__svg');
    svg.setAttribute('aria-hidden', 'true');
    list.prepend(svg);
    const stations = $$('.station', list);
    let paths = [], nodes = [];
    const mkPath = (d, cls) => { const p = document.createElementNS(NS, 'path'); p.setAttribute('d', d); p.setAttribute('class', cls); svg.append(p); return p; };
    const add = (d, y0, y1) => {
      mkPath(d, 'route__guide');
      const p = mkPath(d, 'route__path');
      p.setAttribute('pathLength', '1');
      paths.push({ el: p, y0, y1: Math.max(y1, y0 + 1), t: -1 });
    };
    const f = (n) => n.toFixed(1);
    function build() {
      const lb = list.getBoundingClientRect();
      svg.setAttribute('width', f(lb.width)); svg.setAttribute('height', f(lb.height));
      svg.setAttribute('viewBox', `0 0 ${f(lb.width)} ${f(lb.height)}`);
      svg.textContent = '';
      paths = []; nodes = [];
      const c = (el) => { const b = el.getBoundingClientRect(); return { x: b.left + b.width / 2 - lb.left, y: b.top + b.height / 2 - lb.top, top: b.top - lb.top, bottom: b.bottom - lb.top }; };
      const dots = stations.map((s) => c($('[data-dot]', s)));
      const x0 = dots[0].x;
      stations.forEach((s, i) => nodes.push({ el: s, y: dots[i].y }));
      for (let i = 0; i < dots.length - 1; i++) {
        const a = dots[i], b = dots[i + 1];
        add(`M${f(x0)} ${f(a.y + 8)}V${f(b.y - 8)}`, a.y, b.y);
        if (!stations[i].classList.contains('station--fork')) continue;
        const forks = $$('.fork', stations[i]).filter((li) => !li.classList.contains('fork--main'));
        const fd = forks.map((li) => ({ li, d: c($('[data-fdot]', li)), box: c(li) }));
        if (!fd.length) continue;
        const row = Math.abs(fd[0].d.y - fd[fd.length - 1].d.y) < 4;
        if (row) {
          // Desktop: Fächer aus der Hauptlinie, unter den Optionen wieder zusammen
          const yS = fd[0].d.y - Math.min(120, (fd[0].d.y - a.y) * 0.55);
          const yB = Math.max(...fd.map((o) => o.box.bottom)) + 18;
          const yE = Math.min(b.y - 20, yB + 90);
          fd.forEach((o) => {
            const k1 = (o.d.y - yS) * 0.62, k2 = (yE - yB) * 0.62;
            add(`M${f(x0)} ${f(yS)}C${f(x0)} ${f(yS + k1)} ${f(o.d.x)} ${f(o.d.y - k1)} ${f(o.d.x)} ${f(o.d.y)}V${f(yB)}C${f(o.d.x)} ${f(yB + k2)} ${f(x0)} ${f(yE - k2)} ${f(x0)} ${f(yE)}`, yS, yE);
            nodes.push({ el: o.li, y: o.d.y });
          });
        } else {
          // Handy: kleine Abzweige je Option, die neben der Hauptlinie mitlaufen
          fd.forEach((o) => {
            const yS = o.d.y - 34, yB = o.box.bottom - 6, yE = yB + 26;
            add(`M${f(x0)} ${f(yS)}C${f(x0)} ${f(yS + 22)} ${f(o.d.x)} ${f(o.d.y - 20)} ${f(o.d.x)} ${f(o.d.y)}V${f(yB)}C${f(o.d.x)} ${f(yB + 16)} ${f(x0)} ${f(yE - 14)} ${f(x0)} ${f(yE)}`, yS, yE);
            nodes.push({ el: o.li, y: o.d.y });
          });
        }
        const main = $('.fork--main', stations[i]);
        if (main) nodes.push({ el: main, y: c($('[data-fdot]', main)).y });
      }
      paths.sort((p, q) => p.y0 - q.y0);
      update(true);
    }
    function update(force) {
      if (!MOTION) { nodes.forEach((n) => n.el.classList.add('is-reached')); return; }
      const p = window.innerHeight * WEG_LINIE - list.getBoundingClientRect().top;
      for (const o of paths) {
        const t = clamp((p - o.y0) / (o.y1 - o.y0), 0, 1);
        if (force || Math.abs(t - o.t) > 0.0015) { o.t = t; o.el.style.strokeDashoffset = (1 - t).toFixed(4); }
      }
      for (const n of nodes) n.el.classList.toggle('is-reached', p >= n.y - 2);
    }
    let ticking = false, vis = false;
    const onScroll = () => { if (!ticking && vis) { ticking = true; requestAnimationFrame(() => { ticking = false; update(); }); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    new IntersectionObserver(([en]) => { vis = en.isIntersecting; if (vis) update(); }, { rootMargin: '20% 0px 20% 0px' }).observe(list);
    let rt = 0;
    const rebuild = () => { clearTimeout(rt); rt = setTimeout(build, 120); };
    if (window.ResizeObserver) new ResizeObserver(rebuild).observe(list);
    window.addEventListener('load', rebuild);
    build();
  }

  /* Überschrift des Behandlungswegs: Worte „entwickeln“ sich beim Scrollen von links nach rechts */
  function initWords() {
    const el = $('[data-words]');
    if (!el || !MOTION) return;
    const text = el.textContent.trim().replace(/\s+/g, ' ');
    el.textContent = '';
    const sr = document.createElement('span'); sr.className = 'sr-only'; sr.textContent = text;
    const vis = document.createElement('span'); vis.setAttribute('aria-hidden', 'true');
    const words = text.split(' ').map((wd, i, arr) => {
      const s = document.createElement('span'); s.className = 'w'; s.textContent = wd;
      vis.append(s); if (i < arr.length - 1) vis.append(' ');
      return s;
    });
    el.append(sr, vis);
    let lit = -1, ticking = false;
    const update = () => {
      ticking = false;
      const b = el.getBoundingClientRect(), vh = window.innerHeight;
      const p = clamp((vh * 0.86 - b.top) / (vh * 0.5), 0, 1);
      const n = Math.round(p * words.length);
      if (n === lit) return;
      lit = n;
      words.forEach((w, i) => w.classList.toggle('on', i < n));
    };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
    // Ohne Interaktion fertig: nach spätestens 2 s im Bild komplett lesbar
    new IntersectionObserver(([en], io) => { if (en.isIntersecting) { setTimeout(() => { if (lit < words.length) { lit = words.length; words.forEach((w) => w.classList.add('on')); } }, 2000); io.disconnect(); } }, { threshold: 0.6 }).observe(el);
  }

  /* ---------- Reveals: „entwickeln“ statt Einblenden ----------
     Beobachtet wird immer ein unbeschnittener Rahmen (clip-path am Ziel selbst würde die Schnittmenge auf 0 setzen). */
  function initReveals() {
    const dev = $$('[data-develop]');
    const titles = $$('.h-xl').filter((h) => !h.closest('.hero'));
    const rev = $$('[data-reveal]');
    if (!MOTION) { [...dev, ...rev].forEach((el) => el.classList.add('is-in')); }
    else {
      titles.forEach((t) => t.classList.add('dev'));
      const targets = new Map();
      const watch = (frame, els) => { targets.set(frame, (targets.get(frame) || []).concat(els)); };
      dev.forEach((f) => watch(f, [f]));
      titles.forEach((t) => watch(t.parentElement, [t]));
      new Set(rev.map((r) => r.parentElement)).forEach((list) => {
        const kids = $$(':scope > [data-reveal]', list);
        kids.forEach((k, i) => k.style.setProperty('--d', `${Math.min(i, 6) * 60}ms`));
        watch(list, kids);
      });
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          (targets.get(en.target) || []).forEach((el) => el.classList.add('is-in'));
          io.unobserve(en.target);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0 });
      targets.forEach((_, frame) => io.observe(frame));
    }
    const map = $('[data-map]');
    if (map) {
      new IntersectionObserver(([en]) => map.classList.toggle('is-vis', en.isIntersecting)).observe(map);
      const svg = $('svg', map);
      const mq = window.matchMedia('(max-width: 640px)');
      const setVB = () => svg.setAttribute('viewBox', mq.matches ? '138 84 390 362' : '0 0 640 480');
      setVB(); mq.addEventListener('change', setVB);
    }
  }

  /* ---------- Kapitel-Ton: Die ganze Seite wechselt im Kapitel „Ohne Angst“ auf Petrol ----------
     Erst blendet der Hintergrund (Compositor), zur Hälfte kippt die Schriftfarbe – so bleibt alles lesbar. */
  function initTone() {
    const secs = $$('[data-tone]').filter((s) => s !== root);
    if (!secs.length) return;
    let t = 0, cur = '';
    const set = (tone) => {
      if (tone === cur) return;
      cur = tone;
      if (tone) root.dataset.toneBg = tone; else delete root.dataset.toneBg;
      clearTimeout(t);
      t = setTimeout(() => { if (tone) root.dataset.tone = tone; else delete root.dataset.tone; }, 260);
    };
    const state = new Map();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => state.set(en.target, en.isIntersecting));
      const on = secs.find((s) => state.get(s));
      set(on ? on.dataset.tone : '');
    }, { rootMargin: '-50% 0px -50% 0px' });
    secs.forEach((s) => io.observe(s));
  }

  /* ---------- Zahnschema: auf schmalen Screens enger zuschneiden ---------- */
  function initChartCrop() {
    const svg = $('.chart__svg');
    if (!svg) return;
    const mq = window.matchMedia('(max-width: 640px)');
    const set = () => svg.setAttribute('viewBox', mq.matches ? '66 8 428 544' : '0 0 560 560');
    set(); mq.addEventListener('change', set);
  }

  /* ---------- Behandlungen: Bildvorschau folgt dem Mauszeiger und „entwickelt“ sich ---------- */
  function initServices() {
    const list = $('[data-svc-list]');
    const prev = $('[data-svc-preview]');
    if (!list || !prev || !MOTION || !finePointer.matches) return;
    const imgs = new Map($$('img', prev).map((i) => [i.dataset.key, i]));
    const nEl = $('[data-svc-n]', prev);
    const W = 300, H = 200;
    let x = 0, y = 0, tx = 0, ty = 0, on = false, raf = 0, cur = null;
    const step = () => {
      raf = 0;
      x += (tx - x) * 0.16; y += (ty - y) * 0.16;
      const cx = Math.min(x, window.innerWidth - W - 16);
      const cy = clamp(y, 12, window.innerHeight - H - 12);
      prev.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0)`;
      if (Math.abs(tx - x) > 0.3 || Math.abs(ty - y) > 0.3) raf = requestAnimationFrame(step);
    };
    const loop = () => { if (!raf) raf = requestAnimationFrame(step); };
    const hide = () => { prev.classList.remove('is-on'); on = false; };
    list.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      tx = e.clientX + 32; ty = e.clientY - H / 2;
      if (!on) { x = tx; y = ty; }
      loop();
    });
    $$('.svc', list).forEach((li) => {
      li.addEventListener('pointerenter', (e) => {
        if (e.pointerType !== 'mouse' || window.innerWidth < 900) return;
        const img = imgs.get(li.dataset.img);
        if (!img) { hide(); return; }
        if (cur && cur !== img) { cur.classList.remove('is-on'); cur.style.zIndex = ''; }
        cur = img; img.style.zIndex = '2'; img.classList.add('is-on');
        nEl.textContent = $('.svc__n', li).textContent;
        prev.classList.add('is-on'); on = true;
      });
    });
    list.addEventListener('pointerleave', hide);
    window.addEventListener('scroll', () => { if (on && !list.matches(':hover')) hide(); }, { passive: true });
  }

  /* ---------- Tabs (generisch, Pfeiltasten) ---------- */
  function makeTabs(list, onSelect) {
    const tabs = $$('[role="tab"]', list);
    const panels = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls')));
    let current = Math.max(0, tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true'));
    const select = (i, focus, animate) => {
      tabs.forEach((t, j) => {
        const on = j === i;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        panels[j].hidden = !on;
      });
      if (focus) tabs[i].focus();
      if (animate && i !== current) fade(panels[i], { filter: 'blur(2px)' }, 240);
      current = i;
      if (onSelect) onSelect(i, tabs[i]);
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(i, false, true));
      t.addEventListener('keydown', (e) => {
        let n = null;
        if (e.key === 'ArrowRight') n = (i + 1) % tabs.length;
        else if (e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') n = 0;
        else if (e.key === 'End') n = tabs.length - 1;
        if (n === null) return;
        e.preventDefault();
        select(n, true, false);
      });
    });
    select(current, false, false);
    return { select, get index() { return current; }, tabs };
  }

  /* ---------- Zahnschema ---------- */
  const POS_NAME = { 1: 'Mittlerer Schneidezahn', 2: 'Seitlicher Schneidezahn', 3: 'Eckzahn', 4: 'Erster kleiner Backenzahn', 5: 'Zweiter kleiner Backenzahn', 6: 'Erster großer Backenzahn', 7: 'Zweiter großer Backenzahn', 8: 'Weisheitszahn' };
  const POS_TYPE = { 1: 'incisor', 2: 'incisor', 3: 'canine', 4: 'premolar', 5: 'premolar', 6: 'molar', 7: 'molar', 8: 'wisdom' };
  const QUAD = { 1: 'Oberkiefer · Ihre rechte Seite', 2: 'Oberkiefer · Ihre linke Seite', 3: 'Unterkiefer · Ihre linke Seite', 4: 'Unterkiefer · Ihre rechte Seite' };
  const QUAD_SHORT = { 1: 'Oberkiefer rechts', 2: 'Oberkiefer links', 3: 'Unterkiefer links', 4: 'Unterkiefer rechts' };
  const REL_TEXT = { 1: 'Hier eher selten', 2: 'Möglich an dieser Stelle', 3: 'Häufig an dieser Stelle' };
  const TREAT = {
    fuellung: { label: 'Füllung', steps: ['Betäubung, wenn nötig – oft reicht wenig', 'Karies schonend entfernen, Zahn trocken legen', 'Kunststoff in Schichten aufbauen, härten, polieren'], cost: 'Die Kasse zahlt eine Standardfüllung. Aufwendigere Füllungen oder Inlays kosten extra – das besprechen wir vorher schriftlich.' },
    wurzel: { label: 'Wurzelbehandlung', steps: ['Röntgenbild und Betäubung', 'Entzündetes Gewebe entfernen, Kanäle reinigen und desinfizieren', 'Kanäle dicht füllen, Zahn verschließen – oft später eine Krone'], cost: 'Bei erhaltungswürdigen Zähnen Kassenleistung. Zusätzliche Verfahren können privat anfallen – das klären wir vorher.' },
    implantat: { label: 'Implantat', steps: ['3D-Planung und Beratung zu allen Alternativen', 'Implantat setzen in örtlicher Betäubung, dann einige Monate Einheilzeit', 'Krone aus Keramik nach digitalem Scan'], cost: 'Implantate sind keine Kassenleistung; die Kasse zahlt einen Festzuschuss zum Zahnersatz. Vorher bekommen Sie einen Heil- und Kostenplan.' },
    prophylaxe: { label: 'Prophylaxe', steps: ['Befund: Zahnfleisch, Beläge, Risikostellen', 'Zahnstein und Beläge entfernen, Zwischenräume reinigen', 'Politur, Fluorid und Tipps für zu Hause'], cost: 'Keine Regelleistung der Kassen, viele beteiligen sich aber. Mehr dazu in der Kosten-Info.' }
  };
  // Je Zahntyp: [Relevanz 1–3, Erklärung, Dauer]
  const BY_TYPE = {
    incisor: {
      job: 'Abbeißen, Sprechen',
      fuellung: [2, 'Kleine Defekte an Schneidezähnen füllen wir mit zahnfarbenem Komposit in mehreren Schichten – so passt die Farbe auch bei Tageslicht.', 'ca. 30–45 Min.'],
      wurzel: [2, 'Schneidezähne haben meist nur einen Wurzelkanal. Die Behandlung ist deshalb oft in einer Sitzung möglich.', 'meist 1 Sitzung'],
      implantat: [2, 'Fehlt ein Frontzahn, schont ein Implantat die gesunden Nachbarzähne. Hier zählt vor allem das Zahnfleisch – wir planen digital und zeigen Ihnen das Ergebnis vorab.', 'Planung + 2–3 Termine'],
      prophylaxe: [3, 'Hinter den unteren Schneidezähnen bildet sich besonders schnell Zahnstein, weil dort Speicheldrüsen münden. Vorne polieren wir außerdem Verfärbungen von Kaffee oder Tee weg.', 'Teil der Zahnreinigung (ca. 55 Min.)']
    },
    canine: {
      job: 'Führen, Greifen',
      fuellung: [2, 'Typisch am Eckzahn: keilförmige Defekte am Zahnhals, oft durch zu kräftiges Putzen. Eine dünne Füllung schützt und nimmt die Empfindlichkeit.', 'ca. 30 Min.'],
      wurzel: [2, 'Der Eckzahn hat die längste Wurzel im Mund. Wir messen die Kanallänge elektronisch und arbeiten mit Vergrößerung.', '1–2 Sitzungen'],
      implantat: [2, 'Eckzähne führen den Biss zur Seite. Fehlt einer, planen wir das Implantat besonders sorgfältig, damit der Biss stabil bleibt.', 'Planung + 2–3 Termine'],
      prophylaxe: [2, 'Am Eckzahn geht das Zahnfleisch durch zu festes Putzen oft zurück. Wir zeigen Ihnen eine sanftere Technik – mit Ihrer eigenen Bürste.', 'Teil der Zahnreinigung (ca. 55 Min.)']
    },
    premolar: {
      job: 'Zerkleinern',
      fuellung: [3, 'Karies beginnt hier oft unbemerkt in den Zwischenräumen. Ein Röntgenbild zeigt, wie tief sie reicht – dann füllen wir zahnfarben.', 'ca. 30–45 Min.'],
      wurzel: [2, 'Ein bis zwei Kanäle; beim oberen ersten kleinen Backenzahn sind es meist zwei. Häufig reichen ein bis zwei Sitzungen.', '1–2 Sitzungen'],
      implantat: [2, 'Eine Lücke an dieser Stelle fällt beim Lachen oft auf. Ein Implantat schließt sie, ohne die Nachbarzähne abzuschleifen.', 'Planung + 2–3 Termine'],
      prophylaxe: [2, 'Zwischen die kleinen Backenzähne kommt die Zahnbürste selten. Wir finden mit Ihnen die passende Größe für Zwischenraumbürstchen.', 'Teil der Zahnreinigung (ca. 55 Min.)']
    },
    molar: {
      job: 'Kauen und Mahlen',
      fuellung: [3, 'Auf den Kauflächen und zwischen den großen Backenzähnen entsteht am häufigsten Karies. Kleine Stellen füllen wir mit Komposit, große Defekte versorgen wir mit einem Keramik-Inlay.', 'ca. 45–60 Min.'],
      wurzel: [3, 'Drei bis vier feine, oft gekrümmte Kanäle – hier zählt Erfahrung. Wir arbeiten mit Kofferdam (einem dünnen Gummituch) und Vergrößerung.', 'meist 2 Sitzungen'],
      implantat: [3, 'Fehlt ein Backenzahn, kippen die Nachbarn mit der Zeit in die Lücke. Ein Implantat hält den Platz und die Kaukraft, ohne gesunde Zähne anzutasten.', 'Planung + 2–3 Termine'],
      prophylaxe: [3, 'Die feinen Rillen der Kauflächen sind Karies-Hotspots. Bei Kindern versiegeln wir sie, bei Erwachsenen reinigen wir sie gründlich mit Pulverstrahl.', 'Teil der Zahnreinigung (ca. 55 Min.)']
    },
    wisdom: {
      job: 'oft wenig Platz',
      fuellung: [1, 'Weisheitszähne sind schwer zu erreichen. Eine Füllung lohnt sich nur, wenn der Zahn gerade steht und sich gut putzen lässt.', 'ca. 30–45 Min.'],
      wurzel: [1, 'Selten sinnvoll: Die Kanäle sind oft stark gekrümmt. Meist besprechen wir eher, ob der Zahn entfernt werden sollte.', 'nach Befund'],
      implantat: [1, 'An dieser Stelle setzen wir in der Regel kein Implantat – ein fehlender Weisheitszahn muss nicht ersetzt werden.', 'entfällt meist'],
      prophylaxe: [2, 'Ganz hinten bleibt beim Putzen am meisten liegen. Eine Einbüschelbürste hilft – wir zeigen Ihnen, wie.', 'Teil der Zahnreinigung (ca. 55 Min.)']
    },
    gums: {
      fuellung: [1, 'Füllungen betreffen den Zahn selbst. Wählen Sie dafür im Schema einen einzelnen Zahn aus.', '—'],
      wurzel: [1, 'Eine Wurzelbehandlung betrifft das Innere eines Zahns. Entzündungen am Zahnfleisch behandeln wir anders – siehe Prophylaxe.', '—'],
      implantat: [2, 'Gesundes Zahnfleisch ist die Voraussetzung für jedes Implantat. Deshalb prüfen wir es vor jeder Planung.', 'Teil der Planung'],
      prophylaxe: [3, 'Blutet Ihr Zahnfleisch beim Putzen? Das ist oft ein frühes Zeichen einer Entzündung. Wir messen die Zahnfleischtaschen und reinigen dort, wo die Bürste nicht hinkommt. Bei Parodontitis beantragen wir die Therapie bei Ihrer Kasse.', 'ca. 55 Min., bei Parodontitis mehrere Termine']
    }
  };
  const AREAS = {
    incisor: { name: 'Schneidezähne', pos: [1, 2], where: 'Vorne · Ober- und Unterkiefer', facts: [['Anzahl', '8 Zähne'], ['Wurzeln', 'je 1'], ['Aufgabe', 'Abbeißen, Sprechen']] },
    canine: { name: 'Eckzähne', pos: [3], where: 'Ecke des Zahnbogens', facts: [['Anzahl', '4 Zähne'], ['Wurzeln', 'je 1, sehr lang'], ['Aufgabe', 'Führen, Greifen']] },
    premolar: { name: 'Kleine Backenzähne', pos: [4, 5], where: 'Seitlich · Ober- und Unterkiefer', facts: [['Anzahl', '8 Zähne'], ['Wurzeln', '1–2'], ['Aufgabe', 'Zerkleinern']] },
    molar: { name: 'Große Backenzähne', pos: [6, 7], where: 'Hinten · Ober- und Unterkiefer', facts: [['Anzahl', '8 Zähne'], ['Wurzeln', '2–3'], ['Aufgabe', 'Kauen und Mahlen']] },
    wisdom: { name: 'Weisheitszähne', pos: [8], where: 'Ganz hinten · nicht bei allen vorhanden', facts: [['Anzahl', 'bis zu 4'], ['Wurzeln', 'variabel'], ['Aufgabe', 'oft wenig Platz']] },
    gums: { name: 'Zahnfleisch & ganzer Mund', pos: [], where: 'Zahnhalteapparat', facts: [['Warnzeichen', 'Bluten beim Putzen'], ['Ursache', 'Beläge am Rand'], ['Vorbeugen', 'Zahnreinigung']] }
  };

  function toothFacts(fdi) {
    const q = Math.floor(fdi / 10), p = fdi % 10, up = q < 3, t = POS_TYPE[p];
    let roots, canals;
    if (t === 'incisor') { roots = '1'; canals = up ? '1' : '1–2'; }
    else if (t === 'canine') { roots = '1, sehr lang'; canals = '1'; }
    else if (t === 'premolar') {
      if (up && p === 4) { roots = 'meist 2'; canals = '2'; }
      else if (up) { roots = '1–2'; canals = '1–2'; }
      else { roots = '1'; canals = 'meist 1'; }
    } else if (t === 'molar') { roots = up ? '3' : '2'; canals = up ? '3–4' : '3'; }
    else { roots = 'variabel'; canals = 'variabel'; }
    return [['Wurzeln', roots], ['Kanäle', canals], ['Aufgabe', BY_TYPE[t].job]];
  }


  /* Zählwerk für die Zahnnummer: Ziffern rollen statt zu springen */
  function makeOdometer(el) {
    const sr = document.createElement('span'); sr.className = 'sr-only';
    const odo = document.createElement('span'); odo.className = 'odo'; odo.setAttribute('aria-hidden', 'true');
    const cols = [0, 1].map((k) => {
      const c = document.createElement('span'); c.className = 'odo__col';
      [k === 0 ? '' : null, '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].filter((v) => v !== null).forEach((d) => { const s = document.createElement('span'); s.textContent = d || ' '; c.append(s); });
      odo.append(c); return c;
    });
    el.textContent = '';
    el.append(sr, odo);
    return (val) => {
      const s = String(val).padStart(2, ' ');
      sr.textContent = String(val);
      const a = s[0] === ' ' ? 0 : +s[0] + 1, b = +s[1];
      cols[0].style.transform = `translateY(${-a * 0.8}em)`;
      cols[1].style.transform = `translateY(${-b * 0.8}em)`;
    };
  }

  let chart = null;
  function initChart() {
    const svg = $('.chart__svg');
    const panel = $('[data-tp]');
    if (!svg || !panel) return;
    const fig = $('[data-chart]');
    const teeth = $$('.tooth', svg);
    const byFdi = new Map(teeth.map((t) => [+t.dataset.fdi, t]));
    const center = new Map(teeth.map((t) => {
      const m = /translate\(([-\d.]+)[ ,]+([-\d.]+)\)/.exec($('.tooth__body', t).getAttribute('transform') || '');
      return [t, m ? [+m[1], +m[2]] : [280, 280]];
    }));
    const reticle = $('[data-reticle]', svg);
    const reticleIn = reticle && $('.chart__reticle-in', reticle);
    const areaBtns = $$('.area-btn');
    const q = (s) => $(s, panel);
    const el = {
      num: q('[data-tp-num]'), unit: q('[data-tp-unit]'), where: q('[data-tp-where]'), name: q('[data-tp-name]'),
      fk: [q('[data-tp-f1k]'), q('[data-tp-f2k]'), q('[data-tp-f3k]')], fv: [q('[data-tp-f1]'), q('[data-tp-f2]'), q('[data-tp-f3]')],
      fdi: q('[data-tp-fdi]'), title: q('.tp__title'), facts: q('.tp__facts'), live: q('[data-tp-live]'),
      ctaLabel: $('[data-tooth-cta-label]'), cta: $('[data-tooth-cta]')
    };
    const setNum = makeOdometer(el.num);
    const FDI_TEXT = el.fdi.textContent;
    const panes = {};
    $$('.tp__pane', panel).forEach((p) => { panes[p.dataset.pane] = p; });
    const tabRel = {};
    $$('.tp__tab', panel).forEach((t) => { tabRel[t.dataset.treat] = $('.rel', t); });
    // Laufende Markierung unter dem aktiven Tab
    const tabList = $('.tp__tabs', panel);
    const ink = $('[data-tp-ink]', panel);
    const placeInk = (tab) => { if (!ink || !tab) return; const y = tab.offsetTop + tab.offsetHeight - tabList.clientHeight; ink.style.transform = `translate(${tab.offsetLeft}px, ${y}px) scaleX(${(tab.offsetWidth - 10) / 100})`; };
    const tabs = makeTabs(tabList, (i, tab) => placeInk(tab));
    window.addEventListener('resize', () => placeInk(tabs.tabs[tabs.index]));

    let sel = { kind: 'tooth', fdi: 36 };
    let focusFdi = 36;

    function fillPane(key, data) {
      const p = panes[key];
      const [rel, text, dur] = data;
      $('.tp__rel .rel', p).dataset.rel = rel;
      $('[data-rel-text]', p).textContent = REL_TEXT[rel];
      $('[data-text]', p).textContent = text;
      $('[data-dur]', p).textContent = dur;
      $('[data-cost]', p).textContent = TREAT[key].cost;
      const ol = $('[data-steps]', p);
      ol.textContent = '';
      TREAT[key].steps.forEach((s) => { const li = document.createElement('li'); li.textContent = s; ol.append(li); });
      tabRel[key].dataset.rel = rel;
    }

    function moveReticle(tooth, animate) {
      if (!reticle) return;
      if (!tooth) { reticle.classList.remove('is-on'); return; }
      const [cx, cy] = center.get(tooth);
      if (!animate) { reticle.style.transition = 'none'; }
      reticle.style.transform = `translate(${cx}px, ${cy}px)`;
      reticle.classList.add('is-on');
      if (!animate) { reticle.getBoundingClientRect(); reticle.style.transition = ''; }
      else if (MOTION && reticleIn && reticleIn.animate) {
        // „Einrasten“: Ecken kommen aus 45° und etwas größer an
        reticleIn.animate([{ transform: 'rotate(45deg) scale(1.3)', opacity: 0.2 }, { transform: 'none', opacity: 1 }], { duration: 300, delay: 120, easing: EASE, fill: 'backwards' });
      }
    }

    function render(animate) {
      let typeKey, facts;
      if (sel.kind === 'tooth') {
        const fdi = sel.fdi, qd = Math.floor(fdi / 10), p = fdi % 10;
        typeKey = POS_TYPE[p];
        setNum(fdi);
        el.unit.textContent = 'Zahn';
        el.where.textContent = QUAD[qd];
        el.name.textContent = POS_NAME[p];
        facts = toothFacts(fdi);
        el.fdi.textContent = FDI_TEXT;
        el.ctaLabel.textContent = `Termin zu Zahn ${fdi} anfragen`;
      } else {
        const a = AREAS[sel.area];
        typeKey = sel.area;
        const count = a.pos.length ? teeth.filter((t) => a.pos.includes(+t.dataset.pos)).length : 32;
        setNum(sel.area === 'gums' ? 32 : count);
        el.unit.textContent = 'Zähne';
        el.where.textContent = a.where;
        el.name.textContent = a.name;
        facts = a.facts;
        el.fdi.textContent = a.pos.length ? `Im Zahnschema: ${teeth.filter((t) => a.pos.includes(+t.dataset.pos)).map((t) => t.dataset.fdi).sort().join(', ')}` : 'Betrifft alle Zähne – und das Gewebe, das sie hält.';
        el.ctaLabel.textContent = 'Termin dazu anfragen';
      }
      facts.forEach(([k, v], i) => { el.fk[i].textContent = k; el.fv[i].textContent = v; });
      Object.keys(TREAT).forEach((k) => fillPane(k, BY_TYPE[typeKey][k]));
      if (animate && MOTION) {
        [el.title, el.facts, panes[$$('.tp__tab', panel)[tabs.index].dataset.treat]].forEach((n, i) => {
          n.animate([{ opacity: 0, transform: 'translateX(-6px)', filter: 'blur(2px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }], { duration: 260, delay: i * 40, easing: EASE, fill: 'backwards' });
        });
      }
    }

    function setRoving(fdi) {
      teeth.forEach((t) => { t.tabIndex = +t.dataset.fdi === fdi ? 0 : -1; });
      focusFdi = fdi;
    }

    function selectTooth(fdi, { focus = false, animate = false, announce = false } = {}) {
      sel = { kind: 'tooth', fdi };
      teeth.forEach((t) => { t.style.removeProperty('--td'); t.setAttribute('aria-checked', String(+t.dataset.fdi === fdi)); t.classList.remove('in-area'); });
      setRoving(fdi);
      areaBtns.forEach((b) => b.setAttribute('aria-pressed', 'false'));
      fig.removeAttribute('data-area');
      moveReticle(byFdi.get(fdi), animate && !focus);
      render(animate);
      if (focus) byFdi.get(fdi).focus();
      if (announce) el.live.textContent = `Zahn ${fdi} gewählt: ${POS_NAME[fdi % 10]}, ${QUAD_SHORT[Math.floor(fdi / 10)]}.`;
    }

    function selectArea(key) {
      const a = AREAS[key];
      sel = { kind: 'area', area: key };
      // Zähne des Bereichs leuchten der Reihe nach entlang des Bogens auf
      let k = 0;
      teeth.forEach((t) => {
        const inA = a.pos.includes(+t.dataset.pos);
        t.setAttribute('aria-checked', 'false');
        t.style.setProperty('--td', MOTION && inA ? `${(k++) * 22}ms` : '0ms');
        t.classList.toggle('in-area', inA);
      });
      areaBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.area === key)));
      fig.dataset.area = key;
      moveReticle(null);
      render(true);
      el.live.textContent = key === 'gums' ? 'Bereich Zahnfleisch gewählt.' : `Bereich ${a.name} gewählt, ${a.pos.length * 4} Zähne hervorgehoben.`;
    }

    svg.addEventListener('click', (e) => {
      const t = e.target.closest('.tooth');
      if (t) selectTooth(+t.dataset.fdi, { animate: true, announce: false });
    });
    svg.addEventListener('keydown', (e) => {
      const t = e.target.closest('.tooth');
      if (!t) return;
      const i = teeth.indexOf(t);
      let n = -1;
      switch (e.key) {
        case 'ArrowRight': n = (i + 1) % teeth.length; break;
        case 'ArrowLeft': n = (i - 1 + teeth.length) % teeth.length; break;
        case 'ArrowDown':
        case 'ArrowUp': {
          const fdi = +t.dataset.fdi, qd = Math.floor(fdi / 10), p = fdi % 10;
          const nq = { 1: 4, 4: 1, 2: 3, 3: 2 }[qd];
          n = teeth.indexOf(byFdi.get(nq * 10 + p));
          break;
        }
        case 'Home': n = 0; break;
        case 'End': n = teeth.length - 1; break;
        case 'Enter': case ' ': n = i; break;
        default: return;
      }
      e.preventDefault();
      selectTooth(+teeth[n].dataset.fdi, { focus: true });
    });
    areaBtns.forEach((b) => b.addEventListener('click', () => {
      if (b.getAttribute('aria-pressed') === 'true') selectTooth(focusFdi, { animate: true });
      else selectArea(b.dataset.area);
    }));
    const stepTooth = (dir) => {
      let i;
      if (sel.kind === 'tooth') i = teeth.indexOf(byFdi.get(sel.fdi));
      else { const first = teeth.findIndex((t) => t.classList.contains('in-area')); i = first < 0 ? teeth.indexOf(byFdi.get(focusFdi)) : first - dir; }
      const n = (i + dir + teeth.length) % teeth.length;
      selectTooth(+teeth[n].dataset.fdi, { animate: true, announce: true });
    };
    $('[data-tp-prev]').addEventListener('click', () => stepTooth(-1));
    $('[data-tp-next]').addEventListener('click', () => stepTooth(1));

    el.cta.addEventListener('click', () => {
      const treat = $$('.tp__tab', panel)[tabs.index].dataset.treat;
      const anliegen = treat === 'prophylaxe' || (sel.kind === 'area' && sel.area === 'gums') ? 'pzr' : treat === 'implantat' ? 'ersatz' : 'zahn';
      let msg;
      if (sel.kind === 'tooth') { const nm = POS_NAME[sel.fdi % 10]; const n2 = nm.includes(' ') ? nm[0].toLowerCase() + nm.slice(1) : nm; msg = `Betrifft Zahn ${sel.fdi} (${n2}, ${QUAD_SHORT[Math.floor(sel.fdi / 10)]}) – Thema: ${TREAT[treat].label}.`; }
      else msg = `Betrifft: ${AREAS[sel.area].name} – Thema: ${TREAT[treat].label}.`;
      if (booking) booking.prefill(anliegen, msg);
    });

    selectTooth(36);
    requestAnimationFrame(() => placeInk(tabs.tabs[tabs.index]));

    // Erster Sichtkontakt: Zähne erscheinen wie auf einem Monitor, Quadrant für Quadrant von der Mitte nach außen
    if (MOTION && 'IntersectionObserver' in window) {
      teeth.forEach((t) => { t.style.opacity = '0'; });
      const io = new IntersectionObserver(([en]) => {
        if (!en.isIntersecting) return;
        io.disconnect();
        teeth.forEach((t) => {
          const p = +t.dataset.pos, lower = +t.dataset.q > 2;
          t.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 360, delay: p * 50 + (lower ? 25 : 0), easing: 'ease', fill: 'backwards' });
          t.style.opacity = '';
        });
      }, { threshold: 0.25 });
      io.observe(svg);
    }
    chart = { selectTooth };
  }

  /* ---------- Prophylaxe-Schritte (Sticky-Erzählung) + Zeitleiste ---------- */
  function initProphy() {
    const pv = $('[data-pv]');
    if (!pv) return;
    const steps = $$('.pstep');
    const segs = $$('.pv__seg', pv);
    const bars = $$('.ruler__scale span');
    const needle = $('[data-ruler-needle]');
    const ruler = $('.ruler');
    const nEl = $('[data-pv-n]'), minEl = $('[data-pv-min]');
    let cur = -1;
    const placeNeedle = () => {
      if (!needle || cur < 0) return;
      const m = +steps[cur].dataset.start;
      needle.style.transform = `translateX(${(m / 55 * ruler.clientWidth).toFixed(1)}px)`;
    };
    const set = (i) => {
      if (i === cur) return;
      cur = i;
      pv.dataset.step = String(i);
      steps.forEach((s, j) => s.classList.toggle('is-active', j === i));
      segs.forEach((s, j) => { s.classList.toggle('is-done', j < i); s.classList.toggle('is-now', j === i); });
      bars.forEach((b, j) => b.classList.toggle('is-on', j <= i));
      nEl.textContent = String(i + 1);
      minEl.textContent = `Minute ${steps[i].dataset.min}`;
      placeNeedle();
    };
    set(0);
    window.addEventListener('resize', placeNeedle);
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) set(steps.indexOf(en.target)); });
    }, { rootMargin: '-48% 0px -48% 0px' });
    steps.forEach((s) => io.observe(s));
    new IntersectionObserver(([en]) => pv.classList.toggle('is-vis', en.isIntersecting)).observe(pv);

    if (MOTION && hasGSAP) {
      gsap.to('.pv__orbit', {
        rotation: 360, svgOrigin: '200 200', ease: 'none',
        scrollTrigger: { trigger: '.psteps', start: 'top 55%', end: 'bottom 55%', scrub: 0.6 }
      });
    }
  }

  /* ---------- Kosten-Umschalter ---------- */
  function initCost() {
    const seg = $('[data-seg]');
    if (!seg) return;
    makeTabs(seg, (i) => { seg.dataset.active = String(i); });
  }

  /* ---------- Atemübung 4-4-6: Kreis atmet, die ganze Seite atmet die Farbe mit ---------- */
  function initBreath() {
    const box = $('[data-breath]');
    if (!box) return;
    const NS = 'http://www.w3.org/2000/svg';
    const circle = $('[data-breath-circle]', box);
    const dotsSvg = $('[data-breath-dots]', box);
    const atmo = $('[data-atmo-breath]');
    const phaseEl = $('[data-breath-phase]', box), countEl = $('[data-breath-count]', box);
    const btn = $('[data-breath-toggle]', box), label = $('[data-breath-label]', box), icon = $('[data-breath-icon]', box);
    const roundEl = $('[data-breath-round]', box), live = $('[data-breath-live]', box);
    const total = ATEM.ein + ATEM.halten + ATEM.aus;
    const PH = ['Einatmen', 'Halten', 'Ausatmen'];
    const S_MIN = 0.6, S_MAX = 1;
    const dots = [];
    for (let i = 0; i < total; i++) {
      const a = -Math.PI / 2 + ((i + 0.5) / total) * Math.PI * 2;
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', (150 + 140 * Math.cos(a)).toFixed(2));
      c.setAttribute('cy', (150 + 140 * Math.sin(a)).toFixed(2));
      c.setAttribute('r', '3.6');
      c.setAttribute('class', i < ATEM.ein ? 'd-in' : i < ATEM.ein + ATEM.halten ? 'd-hold' : 'd-out');
      dotsSvg.append(c); dots.push(c);
    }
    let running = false, elapsed = 0, last = 0, raf = 0, phase = -1, round = -1, lit = -1, shown = -1;
    const ease = (x) => 0.5 - 0.5 * Math.cos(Math.PI * x);
    const setScale = (s) => {
      const q = (s - S_MIN) / (S_MAX - S_MIN);
      if (MOTION) circle.style.transform = `scale(${s.toFixed(4)})`;
      else circle.style.opacity = (0.4 + 0.6 * q).toFixed(3);
      if (atmo && running) atmo.style.opacity = (q * ATEM_FARBE).toFixed(3);
    };
    const reset = (msg) => {
      setScale(S_MIN);
      if (atmo) { atmo.style.transition = 'opacity 900ms cubic-bezier(0.77, 0, 0.175, 1)'; atmo.style.opacity = '0'; }
      dots.forEach((d) => d.classList.remove('is-lit'));
      phaseEl.textContent = msg || 'Bereit?';
      countEl.textContent = msg ? '✓' : '4·4·6';
      roundEl.textContent = `${ATEM.runden} Runden · ca. ${ATEM.runden * total} Sekunden`;
    };
    const setBtn = (on) => {
      btn.setAttribute('aria-pressed', String(on));
      label.textContent = on ? 'Übung beenden' : 'Übung starten';
      icon.setAttribute('href', on ? '#i-stop' : '#i-play');
    };
    function start() {
      running = true; elapsed = 0; last = performance.now(); phase = -1; round = -1; lit = -1; shown = -1;
      if (atmo) atmo.style.transition = 'none';
      setBtn(true);
      raf = requestAnimationFrame(frame);
    }
    function stop(finished) {
      running = false;
      cancelAnimationFrame(raf); raf = 0;
      setBtn(false);
      reset(finished ? 'Gut gemacht' : '');
      live.textContent = finished ? 'Geschafft – fünf Runden.' : 'Übung beendet.';
    }
    function frame(now) {
      raf = 0;
      if (!running) return;
      const dt = Math.min(100, now - last);
      last = now;
      elapsed += dt / 1000;
      if (elapsed >= total * ATEM.runden) { stop(true); return; }
      const r = Math.floor(elapsed / total);
      const t = elapsed - r * total;
      let ph, p, dur;
      if (t < ATEM.ein) { ph = 0; dur = ATEM.ein; p = t / dur; }
      else if (t < ATEM.ein + ATEM.halten) { ph = 1; dur = ATEM.halten; p = (t - ATEM.ein) / dur; }
      else { ph = 2; dur = ATEM.aus; p = (t - ATEM.ein - ATEM.halten) / dur; }
      const s = ph === 0 ? S_MIN + (S_MAX - S_MIN) * ease(p) : ph === 1 ? S_MAX : S_MAX - (S_MAX - S_MIN) * ease(p);
      setScale(s);
      const l = Math.floor(t);
      if (l !== lit) { lit = l; dots.forEach((d, i) => d.classList.toggle('is-lit', i <= l)); }
      const remain = Math.max(1, Math.ceil(dur - p * dur - 0.001));
      if (remain !== shown) { shown = remain; countEl.textContent = String(remain); }
      if (ph !== phase || r !== round) {
        phase = ph;
        if (r !== round) { round = r; roundEl.textContent = `Runde ${r + 1} von ${ATEM.runden}`; }
        phaseEl.textContent = PH[ph];
        live.textContent = PH[ph];
      }
      raf = requestAnimationFrame(frame);
    }
    btn.addEventListener('click', () => (running ? stop(false) : start()));
    document.addEventListener('visibilitychange', () => { if (!document.hidden && running) { last = performance.now(); if (!raf) raf = requestAnimationFrame(frame); } });
    // Wer das Kapitel verlässt, beendet die Übung – die Seite soll nicht weiter „atmen“
    new IntersectionObserver(([en]) => { if (!en.isIntersecting && running) stop(false); }, { threshold: 0 }).observe(box);
    reset('');
  }

  /* ---------- Team-Karussell ---------- */
  function initTeam() {
    const vp = $('[data-team-viewport]');
    const track = $('[data-team-track]');
    if (!vp || !track) return;
    const cards = $$('.member', track);
    const prev = $('[data-team-prev]'), next = $('[data-team-next]');
    const bar = $('[data-team-bar]'), count = $('[data-team-count]');
    const chips = $$('.filters .chip');
    const visible = () => cards.filter((c) => !c.hidden);
    const gap = () => parseFloat(getComputedStyle(track).columnGap) || 16;
    let frac = 1;
    const measure = () => {
      frac = Math.min(1, vp.clientWidth / Math.max(1, vp.scrollWidth));
      bar.style.width = `${(frac * 100).toFixed(2)}%`;
      update();
    };
    const update = () => {
      const max = vp.scrollWidth - vp.clientWidth;
      const p = max > 0 ? vp.scrollLeft / max : 0;
      bar.style.transform = `translateX(${(p * (1 - frac) / frac * 100).toFixed(2)}%)`;
      if (prev) prev.disabled = vp.scrollLeft <= 4;
      if (next) next.disabled = vp.scrollLeft >= max - 4;
    };
    const step = (dir) => {
      const c = visible()[0];
      if (!c) return;
      vp.scrollBy({ left: dir * (c.getBoundingClientRect().width + gap()), behavior: MOTION ? 'smooth' : 'auto' });
    };
    if (prev) prev.addEventListener('click', () => step(-1));
    if (next) next.addEventListener('click', () => step(1));
    vp.addEventListener('keydown', (e) => {
      if (e.target !== vp) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    });
    vp.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
    window.addEventListener('resize', measure);
    measure();

    // Ziehen mit der Maus
    let down = false, moved = false, sx = 0, sl = 0;
    vp.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true; moved = false; sx = e.clientX; sl = vp.scrollLeft;
    });
    window.addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - sx;
      if (!moved && Math.abs(dx) > 6) { moved = true; vp.classList.add('is-drag'); }
      if (moved) { e.preventDefault(); vp.scrollLeft = sl - dx; }
    });
    window.addEventListener('pointerup', () => {
      if (!down) return;
      down = false;
      if (moved) {
        vp.classList.remove('is-drag');
        setTimeout(() => { moved = false; }, 0);
      }
    });
    vp.addEventListener('click', (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
    vp.addEventListener('dragstart', (e) => e.preventDefault());

    // Sprachfilter
    chips.forEach((ch) => ch.addEventListener('click', () => {
      const lang = ch.dataset.lang;
      chips.forEach((c) => c.setAttribute('aria-pressed', String(c === ch)));
      cards.forEach((c) => { c.hidden = lang !== 'all' && !c.dataset.langs.split(' ').includes(lang); });
      vp.scrollLeft = 0;
      const vis = visible();
      count.textContent = lang === 'all' ? `${vis.length} Personen` : `${vis.length} Personen sprechen ${lang === 'en' ? 'Englisch' : 'Türkisch'}`;
      if (MOTION) vis.forEach((c, i) => c.animate([{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], { duration: 520, delay: Math.min(i, 6) * 45, easing: EASE_IO, fill: 'backwards' }));
      measure();
    }));
  }

  /* ---------- Praxis-Rundgang: horizontale Strecke (Desktop, CSS sticky statt Pin) ---------- */
  function initTour() {
    const sec = $('[data-tour]');
    if (!sec || !hasGSAP || !MOTION) return;
    const track = $('[data-tour-track]', sec);
    const nEl = $('[data-tour-n]', sec);
    const n = $$('.tcard', track).length;
    const mm = gsap.matchMedia();
    mm.add('(min-width: 900px)', () => {
      sec.classList.add('is-h');
      const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
      const setDist = () => sec.style.setProperty('--tour-dist', `${dist()}px`);
      setDist();
      ScrollTrigger.addEventListener('refreshInit', setDist);
      let shown = 1;
      const tween = gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: {
          trigger: sec, start: 'top top', end: 'bottom bottom', scrub: 0.8, invalidateOnRefresh: true,
          onUpdate: (st) => { const k = Math.min(n, 1 + Math.floor(st.progress * n)); if (k !== shown && nEl) { shown = k; nEl.textContent = String(k).padStart(2, '0'); } }
        }
      });
      $$('.tcard__frame img', track).forEach((img) => {
        gsap.fromTo(img, { xPercent: -2.5 }, {
          xPercent: 2.5, ease: 'none',
          scrollTrigger: { trigger: img.closest('.tcard'), containerAnimation: tween, start: 'left right', end: 'right left', scrub: true }
        });
      });
      return () => {
        ScrollTrigger.removeEventListener('refreshInit', setDist);
        sec.classList.remove('is-h');
        sec.style.removeProperty('--tour-dist');
      };
    });
  }

  /* ---------- Bewertungs-Stempel dreht sich mit dem Scrollen ---------- */
  function initStamp() {
    const st = $('[data-stamp]');
    if (!st || !MOTION || !hasGSAP) return;
    gsap.fromTo(st, { rotation: -40 }, { rotation: 120, ease: 'none', scrollTrigger: { trigger: '.voices', start: 'top bottom', end: 'bottom top', scrub: 0.6 } });
  }

  /* ---------- Öffnungsstatus (Europe/Berlin) ---------- */
  function initOpenStatus() {
    const DAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    const fmt = (m) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
    let dtf = null; // einmal anlegen – Intl-Formatter sind teuer
    try { dtf = new Intl.DateTimeFormat('en-GB', { timeZone: ZEITZONE, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }); } catch (err) { dtf = null; }
    const run = () => {
      let day, mins;
      try {
        const parts = dtf.formatToParts(new Date());
        const get = (t) => (parts.find((p) => p.type === t) || {}).value;
        day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
        mins = (+get('hour') % 24) * 60 + +get('minute');
      } catch (err) {
        const d = new Date(); day = d.getDay(); mins = d.getHours() * 60 + d.getMinutes();
      }
      if (day < 0) return;
      const h = OEFFNUNGSZEITEN[day];
      const open = !!h && mins >= h[0] && mins < h[1];
      let long, short;
      if (open) {
        long = `Jetzt geöffnet · bis ${fmt(h[1])} Uhr`; short = `Geöffnet bis ${fmt(h[1])}`;
      } else {
        let nx = null;
        for (let i = 0; i < 8; i++) {
          const d = (day + i) % 7, hh = OEFFNUNGSZEITEN[d];
          if (!hh || (i === 0 && mins >= hh[0])) continue;
          nx = { d, i, hh }; break;
        }
        const when = nx.i === 0 ? 'heute' : nx.i === 1 ? 'morgen' : DAYS[nx.d];
        long = `Geschlossen · öffnet ${when} ${fmt(nx.hh[0])} Uhr`; short = `Öffnet ${nx.i === 0 ? 'heute' : nx.i === 1 ? 'morgen' : DAYS[nx.d].slice(0, 2)} ${fmt(nx.hh[0])}`;
      }
      $$('[data-open-dot]').forEach((d) => { d.dataset.state = open ? 'open' : 'closed'; });
      $$('[data-open-text]').forEach((t) => { t.textContent = long; });
      $$('[data-open-short]').forEach((t) => { t.textContent = short; });
      $$('.hours__t tr').forEach((tr) => tr.classList.toggle('is-today', +tr.dataset.day === day));
    };
    run();
    setInterval(run, 60000);
  }

  /* ---------- Terminanfrage (3 Schritte) ---------- */
  let booking = null;
  function initBooking() {
    const form = $('[data-bform]');
    if (!form) return;
    form.noValidate = true;
    const card = $('.bcard');
    const steps = $$('.bstep', form);
    const ind = $('.bsteps');
    const inds = $$('[data-bstep-ind]');
    const line = $('[data-bsteps-line]');
    const done = $('[data-bdone]');
    const sos = $('[data-sos]', form);
    const nextFirst = $('[data-next]', steps[0]);
    const sum = $('[data-slot-sum]', form);
    const msg = $('#f-msg');
    const counter = $('[data-count]', form);
    let cur = 0;

    const errEl = (k) => $(`[data-err="${k}"]`, form);
    const showErr = (k) => { const e = errEl(k); e.hidden = false; e.setAttribute('role', 'alert'); };
    const clearErr = (k) => { const e = errEl(k); if (e) { e.hidden = true; e.removeAttribute('role'); } };

    // Karte gleitet auf die neue Höhe statt zu springen (nur bei Nutzeraktionen)
    const morph = (change) => {
      if (!MOTION || !card.animate) { change(); return; }
      const h0 = card.offsetHeight;
      change();
      const h1 = card.offsetHeight;
      if (Math.abs(h1 - h0) < 2) return;
      card.style.overflow = 'clip';
      const a = card.animate([{ height: `${h0}px` }, { height: `${h1}px` }], { duration: 340, easing: 'cubic-bezier(0.32, 0.72, 0, 1)' });
      const end = () => { card.style.overflow = ''; };
      a.onfinish = end; a.oncancel = end;
    };

    function show(i, focus = true) {
      if (focus) { morph(() => showStep(i)); focusStep(i); } else showStep(i);
    }
    function focusStep(i) {
      $('.bstep__legend', steps[i]).focus({ preventScroll: true });
      if (card.getBoundingClientRect().top < hdrH()) scrollToEl(card);
    }
    function showStep(i) {
      steps.forEach((s, j) => { s.hidden = j !== i; });
      inds.forEach((li, j) => {
        li.classList.toggle('is-current', j === i);
        li.classList.toggle('is-done', j < i);
        if (j === i) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
      });
      line.style.transform = `translateX(${i * 100}%)`;
      cur = i;
      fade(steps[i], {}, 300);
    }

    function toggleSos(on) {
      sos.hidden = !on;
      nextFirst.hidden = on;
      if (on) fade(sos, {}, 300);
    }

    const updateSum = () => {
      const vals = $$('input[name="zeit"]:checked', form).map((i) => i.value);
      sum.textContent = vals.length ? `${vals.length} ${vals.length === 1 ? 'Zeitfenster' : 'Zeitfenster'} gewählt: ${vals.join(', ')}` : 'Noch kein Zeitfenster gewählt.';
    };

    const setInvalid = (input, bad) => {
      input.setAttribute('aria-invalid', String(bad));
      const id = input.getAttribute('aria-describedby');
      if (id) { const e = document.getElementById(id); if (e) e.hidden = !bad; }
    };
    const checks = {
      name: (v) => v.trim().length >= 2,
      tel: (v) => /^\+?[0-9][0-9\s/().-]{4,}$/.test(v.trim()) && v.replace(/\D/g, '').length >= 6,
      mail: (v) => v.trim() === '' || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
      ds: (_, el) => el.checked
    };
    const checkField = (name) => {
      const input = form.elements[name];
      const ok = checks[name](input.value, input);
      setInvalid(input, !ok);
      return ok;
    };

    function validate(i) {
      if (i === 0) {
        const v = form.elements.anliegen.value;
        if (!v) { showErr('anliegen'); $('input[name="anliegen"]', form).focus(); return false; }
        return v !== 'schmerz';
      }
      if (i === 1) {
        if (!$$('input[name="zeit"]:checked', form).length) { showErr('zeit'); $('input[name="zeit"]', form).focus(); return false; }
        return true;
      }
      const bad = ['name', 'tel', 'mail', 'ds'].filter((n) => !checkField(n));
      if (bad.length) { form.elements[bad[0]].focus(); return false; }
      return true;
    }

    form.addEventListener('click', (e) => {
      const n = e.target.closest('[data-next]');
      const p = e.target.closest('[data-prev]');
      const qk = e.target.closest('[data-quick]');
      if (n) { if (validate(cur)) show(cur + 1); }
      else if (p) show(cur - 1);
      else if (qk) {
        const row = qk.dataset.quick;
        $$('input[name="zeit"]', form).forEach((i) => {
          if (row === 'none') i.checked = false;
          else if (i.dataset.row === row) i.checked = true;
        });
        updateSum();
        if (row !== 'none') clearErr('zeit');
      }
    });
    form.addEventListener('change', (e) => {
      const t = e.target;
      if (t.name === 'anliegen') { clearErr('anliegen'); toggleSos(t.value === 'schmerz'); }
      if (t.name === 'zeit') { updateSum(); clearErr('zeit'); }
      if (t.name === 'ds' && t.getAttribute('aria-invalid') === 'true') checkField('ds');
    });
    form.addEventListener('input', (e) => {
      const t = e.target;
      if (t === msg) counter.textContent = String(msg.value.length);
      if (checks[t.name] && t.getAttribute('aria-invalid') === 'true') checkField(t.name);
    });
    form.addEventListener('focusout', (e) => {
      const t = e.target;
      if (['name', 'tel', 'mail'].includes(t.name) && t.value.trim() !== '') checkField(t.name);
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (cur < steps.length - 1) { if (validate(cur)) show(cur + 1); return; }
      if (!validate(cur)) return;
      renderDone();
    });

    function renderDone() {
      const fd = new FormData(form);
      const checked = $('input[name="anliegen"]:checked', form);
      const anliegen = checked ? $('.opt__t', checked.parentElement).textContent : '';
      const kasse = fd.get('kasse');
      const rows = [
        ['Anliegen', anliegen],
        ['Status', `${fd.get('status')} · ${kasse === 'Selbstzahler' ? 'Selbstzahler' : `${kasse} versichert`}`],
        ['Zeitfenster', fd.getAll('zeit').join(', ')],
        ['Ab wann', fd.get('ab')],
        ['Name', String(fd.get('name')).trim()],
        ['Telefon', String(fd.get('tel')).trim()]
      ];
      const mail = String(fd.get('mail') || '').trim();
      if (mail) rows.push(['E-Mail', mail]);
      rows.push(['Rückmeldung', `per ${fd.get('weg')}`]);
      const m = String(fd.get('msg') || '').trim();
      if (m) rows.push(['Nachricht', m]);
      const dl = $('[data-done-list]', done);
      dl.textContent = '';
      rows.forEach(([k, v]) => {
        const dt = document.createElement('dt'); dt.textContent = k;
        const dd = document.createElement('dd'); dd.textContent = v;
        dl.append(dt, dd);
      });
      const first = String(fd.get('name')).trim().split(/\s+/)[0];
      $('[data-done-title]', done).textContent = first ? `Danke, ${first}! Ihre Anfrage ist notiert.` : 'Danke! Ihre Anfrage ist notiert.';
      morph(() => { form.hidden = true; ind.hidden = true; done.hidden = false; });
      fade(done, { transform: 'translateY(12px) scale(.98)' }, 420);
      done.focus({ preventScroll: true });
      if (card.getBoundingClientRect().top < hdrH()) scrollToEl(card);
    }

    $('[data-reset]', done).addEventListener('click', () => {
      form.reset();
      $$('[aria-invalid]', form).forEach((i) => setInvalid(i, false));
      ['anliegen', 'zeit'].forEach(clearErr);
      counter.textContent = '0';
      toggleSos(false);
      updateSum();
      morph(() => { done.hidden = true; form.hidden = false; ind.hidden = false; showStep(0); });
      focusStep(0);
    });

    show(0, false);
    updateSum();

    booking = {
      prefill(anliegen, text) {
        if (!done.hidden) $('[data-reset]', done).click();
        const r = $(`input[name="anliegen"][value="${anliegen}"]`, form);
        if (r) { r.checked = true; clearErr('anliegen'); toggleSos(anliegen === 'schmerz'); }
        if (text) { msg.value = text; counter.textContent = String(msg.value.length); }
        if (cur !== 0) show(0, false);
      }
    };
  }

  /* ---------- Start ---------- */
  // Sofort: alles, was im ersten Bildschirm sichtbar ist oder Klicks abfängt.
  initHeader();
  initMenu();
  initBooking();
  initAnchors();
  initPano();
  initMobileBar();
  initTone();

  // Danach in kleinen Häppchen (je eigener Task), damit der Main-Thread nie lange blockiert.
  const pause = (window.scheduler && typeof window.scheduler.yield === 'function')
    ? () => window.scheduler.yield()
    : () => new Promise((r) => setTimeout(r, 0));
  const later = [initRoll, initMagnetic, initOpenStatus, initReveals, initWords, initRoute, initServices, initChart, initChartCrop, initProphy, initCost, initBreath, initTeam, initTour, initStamp];
  (async () => {
    for (const fn of later) {
      await pause();
      try { fn(); } catch (err) { console.warn(fn.name, err); }
    }
    if (hasGSAP) ScrollTrigger.refresh();
  })();

  if (hasGSAP) {
    window.addEventListener('load', () => ScrollTrigger.refresh());
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
})();
