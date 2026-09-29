/* filipkramar.de — main.js
   Progressive Enhancement: Ohne GSAP/Lenis oder bei "prefers-reduced-motion" ist die Seite
   vollständig sichtbar und nutzbar. Module in fester Reihenfolge, eine IIFE, einziges Global ist window.FK fuer die FX-Module (assets/fx). */
(() => {
  'use strict';

  /* ---------- 1. Flags ---------- */
  const doc = document.documentElement;
  const body = document.body;
  const hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  const hasLenis = typeof window.Lenis !== 'undefined';
  const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  const motionOff = () => mqReduce.matches || /[?&]motion=off\b/.test(location.search);
  const motion = hasGSAP && !motionOff();

  doc.classList.toggle('motion', motion);
  doc.classList.toggle('touch', isTouch);
  if (hasGSAP) {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
  }
  // Wechselt der Nutzer die Motion-Einstellung, die Seite einmal sauber neu laden.
  mqReduce.addEventListener?.('change', () => location.reload());

  /* ---------- 2. Helpers ---------- */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  const themeMeta = $('meta[name="theme-color"]');
  const setThemeColor = (hex) => { if (themeMeta && themeMeta.content !== hex) themeMeta.content = hex; };
  const THEME = { light: '#F6F3EC', dark: '#0F1420', hero: '#DCEAF7' };

  const splitWords = (el) => {
    if (el.dataset.splitDone) return $$('.w-in', el);
    const label = el.textContent.trim();
    const html = [];
    el.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        node.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          html.push(/^\s+$/.test(part) ? ' ' : `<span class="w"><span class="w-in">${part}</span></span>`);
        });
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const tag = node.tagName.toLowerCase();
        node.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          html.push(/^\s+$/.test(part) ? ' ' : `<span class="w"><span class="w-in"><${tag}>${part}</${tag}></span></span>`);
        });
      }
    });
    el.innerHTML = html.join('');
    el.setAttribute('aria-label', label);
    el.dataset.splitDone = '1';
    return $$('.w-in', el);
  };

  // Buchstaben sind nur Optik (aria-hidden). Den Namen setzt der Aufrufer auf die Überschrift,
  // nie als aria-label auf einen Span (generische Rollen dürfen keinen Namen tragen).
  const splitChars = (el) => {
    const text = el.textContent;
    el.innerHTML = Array.from(text).map((c) => `<span class="ch" aria-hidden="true">${c === ' ' ? '&nbsp;' : c}</span>`).join('');
    return $$('.ch', el);
  };

  const year = $('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());

/* ---------- 9. Neue Abschnitte: gemeinsame Helfer ---------- */
  const fkClamp = (v, a, b) => (v < a ? a : (v > b ? b : v));

  const fkFmtNum = (v, el) => {
    const raw = parseInt(el.dataset.decimals || '0', 10);
    const d = fkClamp(Number.isNaN(raw) ? 0 : raw, 0, 4);
    const n = d ? Number(v.toFixed(d)) : Math.round(v);
    try {
      return n.toLocaleString('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d });
    } catch (_) {
      return String(n);
    }
  };

  /* ---------- 9a. Zahlen: Sparkline-Pfade aus data-points bauen ---------- */
  /* Ohne JS bleiben die statisch im HTML hinterlegten Pfade stehen. */
  function fkSparks(env) {
    const { $, $$ } = env;
    const VB_W = 160, VB_H = 48, PAD_T = 4, PAD_B = 6, PAD_X = 2;

    $$('[data-spark]').forEach((svg) => {
      const raw = (svg.dataset.points || '').trim();
      if (!raw) return;
      const vals = raw.split(/[,\s]+/).map(Number).filter((n) => Number.isFinite(n));
      if (vals.length < 2) return;

      let min = Infinity, max = -Infinity;
      vals.forEach((v) => { if (v < min) min = v; if (v > max) max = v; });
      const span = (max - min) || 1;
      const stepX = (VB_W - PAD_X * 2) / (vals.length - 1);
      const usableY = VB_H - PAD_T - PAD_B;
      const r2 = (n) => Math.round(n * 100) / 100;

      const pts = vals.map((v, i) => [
        r2(PAD_X + i * stepX),
        r2(VB_H - PAD_B - ((v - min) / span) * usableY),
      ]);

      const line = 'M' + pts.map((p) => p[0] + ' ' + p[1]).join(' L');
      const last = pts[pts.length - 1];
      const area = line + ' L' + last[0] + ' ' + VB_H + ' L' + pts[0][0] + ' ' + VB_H + ' Z';

      const lineEl = $('[data-spark-line]', svg);
      const areaEl = $('[data-spark-area]', svg);
      const tickEl = $('[data-spark-tick]', svg);
      if (lineEl) lineEl.setAttribute('d', line);
      if (areaEl) areaEl.setAttribute('d', area);
      if (tickEl) tickEl.setAttribute('d', 'M' + last[0] + ' ' + last[1] + ' L' + last[0] + ' ' + (VB_H - PAD_B));
    });
  }

  /* ---------- 9b. Zahlen: Endwerte sauber formatiert ausgeben ---------- */
  /* Laeuft immer. Damit steht auch ohne Motion "18.000" statt "18000". */
  function fkFigures(env) {
    const { $$ } = env;
    $$('[data-figure-num]').forEach((el) => {
      const to = parseFloat(el.dataset.to);
      if (Number.isNaN(to)) return;
      el.textContent = fkFmtNum(to, el);
    });
  }

  /* ---------- 9c. Jetzt: Datum formatieren + "vor X aktualisiert" ---------- */
  function fkNow(env) {
    const { $, $$ } = env;
    $$('[data-now]').forEach((root) => {
      const timeEl = $('[data-now-date]', root);
      if (!timeEl) return;
      const raw = (timeEl.getAttribute('datetime') || '').trim();
      if (!/^\d{4}-\d{2}(-\d{2})?$/.test(raw)) return;      // Platzhalter: nichts anfassen
      const iso = raw.length === 7 ? raw + '-01' : raw;
      const d = new Date(iso + 'T12:00:00');
      if (Number.isNaN(d.getTime())) return;

      try {
        timeEl.textContent = new Intl.DateTimeFormat('de-DE', {
          day: 'numeric', month: 'long', year: 'numeric',
        }).format(d);
      } catch (_) { /* Formatierung optional */ }

      const sinceEl = $('[data-now-since]', root);
      if (!sinceEl || typeof Intl === 'undefined' || typeof Intl.RelativeTimeFormat !== 'function') return;
      const days = Math.round((Date.now() - d.getTime()) / 86400000);
      if (days < 0) return;                                  // Datum in der Zukunft: nichts behaupten
      try {
        const rtf = new Intl.RelativeTimeFormat('de-DE', { numeric: 'auto' });
        let txt;
        if (days < 1) txt = 'heute aktualisiert';
        else if (days < 14) txt = rtf.format(-days, 'day') + ' aktualisiert';
        else if (days < 60) txt = rtf.format(-Math.round(days / 7), 'week') + ' aktualisiert';
        else txt = rtf.format(-Math.round(days / 30), 'month') + ' aktualisiert';
        sinceEl.textContent = txt;
      } catch (_) { /* egal */ }
    });
  }

  /* ---------- 9d. Fragen: Akkordeon ---------- */
  /* Hoehe kommt aus CSS (grid-template-rows 0fr -> 1fr). JS setzt nur Zustand. */
  function fkFaq(env) {
    const { $, $$, debounce, onLayoutChange } = env;
    const roots = $$('[data-faq]');
    if (!roots.length) return;

    const notify = debounce(() => {
      if (typeof onLayoutChange === 'function') onLayoutChange();
    }, 140);

    roots.forEach((root) => {
      const items = $$('[data-faq-item]', root);
      const btns = items.map((it) => $('[data-faq-btn]', it)).filter(Boolean);
      if (!btns.length) return;
      const single = root.dataset.faqSingle !== 'false';

      // instant: ohne Höhen-Animation (für das Panel über der angetippten Frage)
      const setOpen = (item, open, instant = false) => {
        const btn = $('[data-faq-btn]', item);
        const panel = $('[data-faq-panel]', item);
        if (!btn || !panel) return;
        if (instant) {
          item.classList.add('is-instant');
          requestAnimationFrame(() => requestAnimationFrame(() => item.classList.remove('is-instant')));
        }
        item.classList.toggle('is-open', open);
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        panel.setAttribute('data-open', open ? 'true' : 'false');
        if (open) panel.removeAttribute('inert'); else panel.setAttribute('inert', '');
      };

      // Startzustand ohne Übergang einklappen: kein Zuklappen beim Laden, kein
      // transitionend, also auch kein ScrollTrigger-Refresh nur fürs Einklappen.
      root.classList.add('is-settling');
      items.forEach((item) => setOpen(item, item.hasAttribute('data-faq-open')));
      root.classList.add('is-ready'); // erst jetzt darf CSS geschlossene Panels einklappen
      requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('is-settling')));

      items.forEach((item) => {
        const btn = $('[data-faq-btn]', item);
        const panel = $('[data-faq-panel]', item);
        if (!btn || !panel) return;

        panel.addEventListener('transitionend', (e) => {
          if (e.target === panel && e.propertyName === 'grid-template-rows') notify();
        });

        btn.addEventListener('click', () => {
          const open = btn.getAttribute('aria-expanded') !== 'true';
          const others = open && single ? items.filter((o) => o !== item && o.classList.contains('is-open')) : [];
          // Klappt ein Panel ÜBER der Frage zu, rutscht sie sonst unter dem Finger weg:
          // das obere schließt sofort, der Scroll gleicht im selben Frame aus.
          const above = others.filter((o) => o.compareDocumentPosition(item) & Node.DOCUMENT_POSITION_FOLLOWING);
          const y0 = above.length ? btn.getBoundingClientRect().top : 0;
          others.forEach((o) => setOpen(o, false, above.includes(o)));
          setOpen(item, open);
          if (above.length) {
            const dy = btn.getBoundingClientRect().top - y0;
            const l = window.FK && window.FK.lenis;
            if (Math.abs(dy) > 0.5) {
              if (l) l.scrollTo(window.scrollY + dy, { immediate: true, force: true });
              else window.scrollBy(0, dy);
            }
          }
          // Refresh erst nach Ende der Hoehen-Animation (transitionend), Sicherheitsnetz 420 ms
          clearTimeout(item._fkT); item._fkT = setTimeout(notify, 420);
        });

        btn.addEventListener('keydown', (e) => {
          const i = btns.indexOf(btn);
          if (i < 0) return;
          let j = -1;
          if (e.key === 'ArrowDown') j = (i + 1) % btns.length;
          else if (e.key === 'ArrowUp') j = (i - 1 + btns.length) % btns.length;
          else if (e.key === 'Home') j = 0;
          else if (e.key === 'End') j = btns.length - 1;
          else return;
          e.preventDefault();
          btns[j].focus();
        });
      });
    });
  }

  /* ---------- 9e. Stimmen: Slider ---------- */
  /* Zwei Betriebsarten:
     A) Feiner Zeiger + GSAP  -> Transform-Slider mit Pointer-Drag, Velocity und Snap
     B) sonst (Touch / kein GSAP) -> nativer Scroller mit CSS-Scroll-Snap
     Beide teilen sich Index, Punkte, Pfeile, Fortschritt und aria-live. */
  function fkVoices(env) {
    const { $, $$, debounce, motion, isTouch, hasGSAP } = env;
    const root = $('[data-voices]');
    if (!root) return;

    const viewport = $('[data-voices-viewport]', root);
    const track = $('[data-voices-track]', root);
    const slides = $$('[data-voices-slide]', root);
    if (!viewport || !track || !slides.length) return;

    const prevBtn = $('[data-voices-prev]', root);
    const nextBtn = $('[data-voices-next]', root);
    const dots = $$('[data-voices-dot]', root);
    const live = $('[data-voices-live]', root);
    const bar = $('[data-voices-bar]', root);

    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const useDrag = hasGSAP && fine && !isTouch;

    let index = 0;
    let positions = slides.map(() => 0);
    let minX = 0;
    let curX = 0;
    let ready = false;

    if (useDrag) root.classList.add('is-drag');

    const setX = (x) => {
      curX = x;
      if (hasGSAP) gsap.set(track, { x: x });
      else track.style.transform = 'translate3d(' + x + 'px,0,0)';
    };

    const nearest = (x) => {
      let best = 0, bestD = Infinity;
      for (let i = 0; i < positions.length; i++) {
        const d = Math.abs(positions[i] - x);
        if (d < bestD) { bestD = d; best = i; }
      }
      return best;
    };

    /* Einzige Stelle, an der gemessen wird. */
    const build = () => {
      const cs = window.getComputedStyle(viewport);
      const padL = parseFloat(cs.paddingLeft) || 0;
      const padR = parseFloat(cs.paddingRight) || 0;

      if (useDrag) {
        if (hasGSAP) gsap.killTweensOf(track);
        setX(0);
        const tRect = track.getBoundingClientRect();
        const vRect = viewport.getBoundingClientRect();
        minX = Math.min(0, (vRect.right - padR) - tRect.right);
        positions = slides.map((s) => {
          const p = -(s.getBoundingClientRect().left - tRect.left);
          return Math.max(p, minX);
        });
      } else {
        const vRect = viewport.getBoundingClientRect();
        const sl = viewport.scrollLeft;
        positions = slides.map((s) => Math.max(0, s.getBoundingClientRect().left - vRect.left + sl - padL));
      }

      index = fkClamp(index, 0, positions.length - 1);
      if (useDrag) setX(positions[index]);
      sync();
      if (!ready) { ready = true; root.classList.add('is-ready'); }
    };

    function sync() {
      const n = positions.length;
      slides.forEach((s, i) => s.classList.toggle('is-active', i === index));
      dots.forEach((d, i) => {
        if (i === index) d.setAttribute('aria-current', 'true');
        else d.removeAttribute('aria-current');
      });
      const atStart = index <= 0;
      const atEnd = index >= n - 1;
      const focused = document.activeElement;
      if (prevBtn) prevBtn.disabled = atStart;
      if (nextBtn) nextBtn.disabled = atEnd;
      // Fokus nicht ins Leere laufen lassen, wenn der aktive Knopf deaktiviert wird.
      if (focused === prevBtn && atStart && nextBtn && !nextBtn.disabled) nextBtn.focus();
      else if (focused === nextBtn && atEnd && prevBtn && !prevBtn.disabled) prevBtn.focus();
      if (bar) bar.style.transform = 'scaleX(' + ((index + 1) / n) + ')';
      if (live) live.textContent = 'Stimme ' + (index + 1) + ' von ' + n;
    }

    const goTo = (i, animate) => {
      index = fkClamp(i, 0, positions.length - 1);
      const target = positions[index];
      if (useDrag) {
        if (animate && hasGSAP) {
          const dist = Math.abs(target - curX);
          const dur = motion ? fkClamp(0.32 + dist / 1500, 0.32, 1.05) : 0.2;
          gsap.to(track, {
            x: target, duration: dur, ease: 'power3.out', overwrite: true,
            onUpdate: () => { const v = Number(gsap.getProperty(track, 'x')); if (!Number.isNaN(v)) curX = v; },
            onComplete: () => { curX = target; },
          });
        } else {
          setX(target);
        }
      } else {
        viewport.scrollTo({ left: target, behavior: (animate && motion) ? 'smooth' : 'auto' });
      }
      sync();
    };

    /* --- Bedienung: Pfeile + Punkte --- */
    prevBtn?.addEventListener('click', () => goTo(index - 1, true));
    nextBtn?.addEventListener('click', () => goTo(index + 1, true));
    dots.forEach((d, i) => d.addEventListener('click', () => goTo(i, true)));

    /* --- Bedienung: Tastatur --- */
    viewport.addEventListener('keydown', (e) => {
      let i = -1;
      if (e.key === 'ArrowRight') i = index + 1;
      else if (e.key === 'ArrowLeft') i = index - 1;
      else if (e.key === 'Home') i = 0;
      else if (e.key === 'End') i = positions.length - 1;
      else return;
      e.preventDefault();
      goTo(i, true);
    });

    if (useDrag) {
      /* --- Betriebsart A: Pointer-Drag mit Velocity und Snap --- */
      let dragging = false;
      let pointerId = null;
      let startX = 0, startPos = 0, startIndex = 0;
      let lastX = 0, lastT = 0, vel = 0;

      const onDown = (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        if (e.target.closest('a, button')) return;
        dragging = true;
        pointerId = e.pointerId;
        try { viewport.setPointerCapture(pointerId); } catch (_) { /* egal */ }
        if (hasGSAP) gsap.killTweensOf(track);
        startX = e.clientX;
        startPos = curX;
        startIndex = index;
        lastX = e.clientX;
        lastT = e.timeStamp || performance.now();
        vel = 0;
        root.classList.add('is-dragging');
      };

      const onMove = (e) => {
        if (!dragging) return;
        const dx = e.clientX - startX;
        let nx = startPos + dx;
        if (nx > 0) nx = nx * 0.35;                          // Gummiband oben
        else if (nx < minX) nx = minX + (nx - minX) * 0.35;  // Gummiband unten
        setX(nx);
        const t = e.timeStamp || performance.now();
        const dt = t - lastT;
        if (dt > 0) {
          const inst = ((e.clientX - lastX) / dt) * 1000;    // px/s
          vel = vel * 0.7 + inst * 0.3;
          lastX = e.clientX;
          lastT = t;
        }
      };

      const onUp = () => {
        if (!dragging) return;
        dragging = false;
        root.classList.remove('is-dragging');
        if (pointerId !== null) { try { viewport.releasePointerCapture(pointerId); } catch (_) { /* egal */ } }
        pointerId = null;

        const projected = curX + vel * 0.16;
        let i = nearest(projected);
        if (Math.abs(vel) > 420 && i === startIndex) i = startIndex + (vel < 0 ? 1 : -1);
        goTo(i, true);
      };

      viewport.addEventListener('pointerdown', onDown);
      viewport.addEventListener('pointermove', onMove, { passive: true });
      viewport.addEventListener('pointerup', onUp);
      viewport.addEventListener('pointercancel', onUp);
      viewport.addEventListener('dragstart', (e) => e.preventDefault());
    } else {
      /* --- Betriebsart B: nativer Scroller, Index nachfuehren --- */
      let ticking = false;
      viewport.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          ticking = false;
          const i = nearest(viewport.scrollLeft);
          if (i !== index) { index = i; sync(); }
        });
      }, { passive: true });
    }

    /* --- Neu vermessen, wenn sich Layout oder Schrift aendern --- */
    const rebuild = debounce(build, 200);
    window.addEventListener('resize', rebuild);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(build).catch(() => {});
    window.addEventListener('load', rebuild);
    build();
  }

  /* ---------- 9f. Scroll-gebundene Teile (nur mit Motion, in matchMedia) ---------- */
  function fkFiguresScroll(env) {
    const { $, $$, isTouch } = env;
    const tiles = $$('[data-figure]');
    if (!tiles.length) return;
    const scrub = isTouch ? true : 0.6;

    tiles.forEach((tile) => {
      const wrap = $('[data-spark-wrap]', tile);
      const num = $('[data-figure-num]', tile);

      if (wrap) {
        gsap.fromTo(wrap,
          { clipPath: 'inset(0 100% 0 0)' },
          {
            clipPath: 'inset(0 0% 0 0)', ease: 'none',
            scrollTrigger: {
              trigger: tile, start: 'top 92%', end: 'top 52%',
              scrub: scrub, invalidateOnRefresh: true,
            },
          });
      }

      if (!num) return;
      const to = parseFloat(num.dataset.to);
      if (Number.isNaN(to)) return;
      const fromRaw = parseFloat(num.dataset.from || '0');
      const from = Number.isNaN(fromRaw) ? 0 : fromRaw;
      const render = (p) => { num.textContent = fkFmtNum(from + (to - from) * p, num); };

      ScrollTrigger.create({
        trigger: tile, start: 'top 92%', end: 'top 52%', invalidateOnRefresh: true,
        onUpdate: (self) => render(self.progress),
        onRefresh: (self) => render(self.progress),
      });
    });
  }

  function fkVoicesScroll(env) {
    const { $, isDesktop, isTouch } = env;
    if (!isDesktop) return;                       // Zeichen ist unter 900px ausgeblendet
    const mark = $('[data-voices-mark]');
    if (!mark) return;
    const sec = mark.closest('section') || mark;
    gsap.fromTo(mark,
      { yPercent: -10, rotate: -5 },
      {
        yPercent: 10, rotate: 5, ease: 'none',
        scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: isTouch ? true : 0.8 },
      });
  }

  /* ---------- 9g. Orchestrierung ---------- */
  function fkSectionsCore(env) {
    fkSparks(env);
    fkFigures(env);
    fkNow(env);
    fkFaq(env);
    fkVoices(env);
  }

  function fkSectionsScroll(env) {
    if (typeof window.gsap === 'undefined' || typeof window.ScrollTrigger === 'undefined') return;
    fkFiguresScroll(env);
    fkVoicesScroll(env);
  }

/* ----- >8 ----- Ende des einzufuegenden Blocks --------------------------- */

  /* ---------- 2b. Neue Abschnitte: Zahlen / Stimmen / Jetzt / Fragen (Kern, laeuft immer) ---------- */
  const fkEnv = {
    $, $$, debounce, motion, isTouch, hasGSAP,
    onLayoutChange: () => { if (window.ScrollTrigger && typeof ScrollTrigger.refresh === 'function') ScrollTrigger.refresh(); },
  };
  fkSectionsCore(fkEnv);

/* ---------- 2b. Hero-Szene: Shader-Quellen ---------- */

  const HERO_SCENE_VERT = [
    'attribute vec2 aPos;',
    'void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }',
  ].join('\n');

  /* Octaves als #define, damit die Schleifengrenze in GLSL ES 1.0 konstant ist. */
  const heroSceneFragSource = (octaves) => [
    '#ifdef GL_FRAGMENT_PRECISION_HIGH',
    'precision highp float;',
    '#else',
    'precision mediump float;',
    '#endif',
    '#define OCTAVES ' + octaves,
    '#define PI 3.14159265',
    '',
    'uniform vec2  uRes;    // Buffergroesse in Pixel',
    'uniform float uTime;   // Sekunden, laeuft nur waehrend die Szene sichtbar ist',
    'uniform vec2  uLight;  // Lichtposition 0..1, y nach oben',
    'uniform float uScroll; // 0..1 Scroll-Fortschritt durch den Hero',
    'uniform float uPower;  // 0..1 Bewegungsstaerke (0 = Standbild)',
    '',
    'float hash21(vec2 p){',
    '  vec3 p3 = fract(vec3(p.xyx) * 0.1031);',
    '  p3 += dot(p3, p3.yzx + 33.33);',
    '  return fract((p3.x + p3.y) * p3.z);',
    '}',
    '',
    'float vnoise(vec2 p){',
    '  vec2 i = floor(p);',
    '  vec2 f = fract(p);',
    '  vec2 u = f * f * (3.0 - 2.0 * f);',
    '  float a = hash21(i);',
    '  float b = hash21(i + vec2(1.0, 0.0));',
    '  float c = hash21(i + vec2(0.0, 1.0));',
    '  float d = hash21(i + vec2(1.0, 1.0));',
    '  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);',
    '}',
    '',
    '/* billige 2-Oktaven-Variante fuer die Warp-Felder */',
    'float fbmLow(vec2 p){',
    '  float v = 0.0;',
    '  float a = 0.58;',
    '  for (int i = 0; i < 2; i++){',
    '    v += a * vnoise(p);',
    '    p = mat2(0.80, 0.60, -0.60, 0.80) * p * 2.02;',
    '    a *= 0.5;',
    '  }',
    '  return v;',
    '}',
    '',
    'float fbm(vec2 p){',
    '  float v = 0.0;',
    '  float a = 0.55;',
    '  for (int i = 0; i < OCTAVES; i++){',
    '    v += a * vnoise(p);',
    '    p = mat2(0.80, 0.60, -0.60, 0.80) * p * 2.03;',
    '    a *= 0.5;',
    '  }',
    '  return v;',
    '}',
    '',
    'void main(){',
    '  vec2 uv = gl_FragCoord.xy / uRes;',
    '  float aspect = uRes.x / max(uRes.y, 1.0);',
    '  vec2 p = vec2(uv.x * aspect, uv.y);',
    '',
    '  float t = uTime * 0.035 * uPower;',
    '  float s = clamp(uScroll, 0.0, 1.0);',
    '',
    '  /* Scroll schiebt die Struktur nach oben und leicht zur Seite */',
    '  vec2 ps = p + vec2(s * 0.06, s * 0.22);',
    '',
    '  /* zweistufiges Domain-Warping: ergibt Adern statt Wolkenmatsch */',
    '  vec2 q = vec2(fbmLow(ps * 1.55 + vec2(0.0, t * 1.30)),',
    '                fbmLow(ps * 1.55 + vec2(3.7, 1.20 - t * 1.05)));',
    '  vec2 r = vec2(fbmLow(ps * 2.05 + 2.9 * q + vec2(1.7 + t * 0.85, 9.2)),',
    '                fbmLow(ps * 2.05 + 2.9 * q + vec2(8.3, 2.80 - t * 0.65)));',
    '  float f = fbm(ps * 1.85 + 3.1 * r + vec2(0.0, -t * 0.55));',
    '',
    '  /* Aderung: grobe Hauptader + feine Haarader */',
    '  float vein = 0.5 + 0.5 * sin((ps.x * 2.20 + ps.y * 1.05 + f * 5.6 + s * 0.8) * PI);',
    '  vein = pow(clamp(vein, 0.0, 1.0), 3.2);',
    '  float fein = 0.5 + 0.5 * sin((ps.y * 3.40 - ps.x * 0.80 + f * 8.4) * PI);',
    '  fein = pow(clamp(fein, 0.0, 1.0), 9.0);',
    '',
    '  /* Grundverlauf, nachgebaut aus linear-gradient(165deg,#EEF4FA,#DCEAF7,#BFD9F2,#A9CBEC) */',
    '  float grad = clamp(uv.y * 0.86 + uv.x * 0.14, 0.0, 1.0);',
    '  vec3 base = mix(vec3(0.662, 0.796, 0.925), vec3(0.749, 0.850, 0.949), smoothstep(0.0, 0.42, grad));',
    '  base = mix(base, vec3(0.862, 0.917, 0.968), smoothstep(0.34, 0.76, grad));',
    '  base = mix(base, vec3(0.933, 0.956, 0.980), smoothstep(0.70, 1.00, grad));',
    '',
    '  /* Ruhezone links und unten: dort stehen Glas-Karte, Titel und Buttons. */',
    '  float calm = mix(0.30, 1.0, smoothstep(0.05, 0.52, uv.x));',
    '  calm *= mix(0.55, 1.0, smoothstep(0.00, 0.34, uv.y));',
    '',
    '  /* Licht */',
    '  vec2 lp = vec2(uLight.x * aspect, uLight.y);',
    '  float d = distance(p, lp);',
    '  float core = exp(-d * d * 4.2);',
    '  float halo = exp(-d * 1.45);',
    '',
    '  float wash = clamp(vein * (0.55 + 0.75 * core) * calm, 0.0, 1.0);',
    '  vec3 col = base;',
    '  col = mix(col, vec3(0.964, 0.953, 0.925), wash * 0.55);',
    '  col = mix(col, vec3(0.913, 0.901, 0.878), fein * 0.34 * calm);',
    '  col = mix(col, vec3(0.298, 0.561, 0.839), smoothstep(0.60, 1.00, f) * 0.15 * calm * (1.0 - core * 0.7));',
    '  /* Gegenzug: flache Zonen leicht vertiefen, damit die Flaeche Spannweite behaelt */',
    '  col = mix(col, vec3(0.690, 0.804, 0.921), (1.0 - smoothstep(0.20, 0.58, f)) * 0.18 * calm);',
    '',
    '  /* Licht als Screen-Blend: nutzt nur den vorhandenen Spielraum nach oben,',
    '     clippt also nie zu einem harten weissen Fleck. */',
    '  vec3 lightCol = vec3(1.000, 0.988, 0.960) * core * 0.34',
    '                + vec3(0.862, 0.917, 0.968) * halo * 0.14;',
    '  lightCol = clamp(lightCol, 0.0, 1.0);',
    '  col = 1.0 - (1.0 - col) * (1.0 - lightCol);',
    '',
    '  /* Scroll kuehlt ab und nimmt Helligkeit - passt zum Wechsel auf #DCEAF7 */',
    '  col = mix(col, col * vec3(0.93, 0.965, 1.02), s);',
    '  col *= 1.0 - 0.07 * s;',
    '',
    '  /* Vignette */',
    '  float vig = length((uv - 0.5) * vec2(aspect, 1.0));',
    '  col *= 1.0 - 0.085 * smoothstep(0.35, 1.05, vig);',
    '',
    '  /* Dither gegen Banding in den weiten Blauflaechen */',
    '  col += (hash21(gl_FragCoord.xy + fract(uTime) * 64.0) - 0.5) * 0.009;',
    '',
    '  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);',
    '}',
  ].join('\n');

  /* ---------- 2c. Hero-Szene: Aufbau, Schleife, Abbau ----------
     initHeroScene(hero, { reduced }) -> Handle | null
     Handle: { refresh(), pause(), resume(), destroy(), isRunning() }
     Gibt null zurück, wenn kein Hero, kein Canvas-Support oder kein
     WebGL-Kontext da ist. Dann bleibt der bestehende CSS-Verlauf stehen. */
  const initHeroScene = (heroEl, options) => {
    if (!heroEl || typeof window.WebGLRenderingContext === 'undefined') return null;

    const cfg = options || {};
    const reduced = !!cfg.reduced;
    const frame = $('[data-hero-frame]', heroEl) || heroEl;

    /* --- DOM sicherstellen (Markup ist optional, siehe shader-hero.html) --- */
    let canvas = $('[data-hero-canvas]', heroEl);
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.className = 'hero__canvas';
      canvas.setAttribute('data-hero-canvas', '');
      canvas.setAttribute('aria-hidden', 'true');
      const sky = $('.hero__sky', frame);
      frame.insertBefore(canvas, sky ? sky.nextSibling : frame.firstChild);
    }
    if (!$('[data-hero-veil]', heroEl)) {
      const veil = document.createElement('div');
      veil.className = 'hero__veil';
      veil.setAttribute('data-hero-veil', '');
      veil.setAttribute('aria-hidden', 'true');
      canvas.insertAdjacentElement('afterend', veil);
    }

    const GL_ATTRS = {
      alpha: false, antialias: false, depth: false, stencil: false,
      premultipliedAlpha: false, preserveDrawingBuffer: false,
      powerPreference: 'low-power', failIfMajorPerformanceCaveat: true,
    };

    let gl = null;
    try {
      gl = canvas.getContext('webgl', GL_ATTRS) || canvas.getContext('experimental-webgl', GL_ATTRS);
    } catch (err) { gl = null; }
    if (!gl) { heroEl.classList.add('scene-off'); return null; }

    /* --- Qualitätsstufen --------------------------------------------------
       Die Szene wird absichtlich unter CSS-Auflösung gerendert und vom
       Browser glatt hochskaliert; für ein weiches Marmorfeld ist das nicht
       sichtbar und spart den Großteil der Füllrate. */
    const DPR_CAP = 2;
    const mqMobile = window.matchMedia('(max-width: 899px)');
    const mqFine = window.matchMedia('(hover: hover) and (pointer: fine)');

    let mobile = mqMobile.matches;
    let quality = mobile ? 0.36 : 0.50;        // Anteil der CSS-Pixel (bewusst sparsam: weiche Marmorflaeche braucht keine Schaerfe)
    let maxPixels = mobile ? 420000 : 1250000; // harte Obergrenze pro Frame
    let frameBudget = mobile ? 1000 / 30 : 1000 / 40; // Bildrate deckeln
    let downgrades = 0;
    let givenUp = false;

    const applyMediaState = () => {
      mobile = mqMobile.matches;
      maxPixels = mobile ? 420000 : 1250000;
      frameBudget = mobile ? 1000 / 30 : 1000 / 40;
      const target = mobile ? 0.40 : 0.58;
      const factor = Math.pow(0.78, downgrades);
      quality = Math.max(0.26, target * factor);
    };

    /* --- Shader / Programm ------------------------------------------------ */
    const compile = (type, src) => {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        gl.deleteShader(sh);
        return null;
      }
      return sh;
    };

    const vs = compile(gl.VERTEX_SHADER, HERO_SCENE_VERT);
    const fs = compile(gl.FRAGMENT_SHADER, heroSceneFragSource(mobile ? 3 : 4));
    let program = null;
    if (vs && fs) {
      program = gl.createProgram();
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.bindAttribLocation(program, 0, 'aPos');
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        gl.deleteProgram(program);
        program = null;
      }
    }
    if (!program) {
      if (vs) gl.deleteShader(vs);
      if (fs) gl.deleteShader(fs);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      heroEl.classList.add('scene-off');
      return null;
    }
    gl.deleteShader(vs);
    gl.deleteShader(fs);

    /* Fullscreen-Dreieck (ein Dreieck, kein Quad — spart die Diagonale) */
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    gl.useProgram(program);
    const uRes = gl.getUniformLocation(program, 'uRes');
    const uTime = gl.getUniformLocation(program, 'uTime');
    const uLight = gl.getUniformLocation(program, 'uLight');
    const uScroll = gl.getUniformLocation(program, 'uScroll');
    const uPower = gl.getUniformLocation(program, 'uPower');

    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    gl.disable(gl.CULL_FACE);

    /* --- Zustand ---------------------------------------------------------- */
    let destroyed = false;
    let contextLost = false;
    let running = false;
    let rafId = 0;
    let inView = true;
    let firstFrameDone = false;

    let elapsed = 0;        // Shader-Zeit, wächst nur während die Szene läuft
    let lastTs = 0;
    let acc = 0;            // Frame-Budget-Akkumulator
    let power = reduced ? 0 : 0.0001; // rampt nach dem ersten Bild auf 1

    let lightX = 0.72, lightY = 0.66;   // geglättete Lichtposition
    let aimX = 0.72, aimY = 0.66;       // Ziel (Zeiger oder Eigenbewegung)
    let pointerActive = false;

    let scrollY = 0;
    let scrollRange = 1;    // wird im Build/Refresh gemessen
    let viewW = window.innerWidth || 1;
    let viewH = window.innerHeight || 1;
    let scrollProgress = 0;

    /* Perf-Governor */
    let sampleCount = 0;
    let sampleSum = 0;
    let lastDrawTs = 0;

    /* --- Größe ------------------------------------------------------------
       Einziger Ort (neben refresh()), an dem gemessen wird. */
    const sizeTo = (cssW, cssH) => {
      const w = Math.max(1, Math.round(cssW));
      const h = Math.max(1, Math.round(cssH));
      const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
      let q = quality;
      const wanted = w * h * dpr * dpr * q * q;
      if (wanted > maxPixels) q *= Math.sqrt(maxPixels / wanted);
      const bw = Math.max(2, Math.round(w * dpr * q));
      const bh = Math.max(2, Math.round(h * dpr * q));
      if (bw === canvas.width && bh === canvas.height) return false;
      canvas.width = bw;
      canvas.height = bh;
      gl.viewport(0, 0, bw, bh);
      return true;
    };

    const measure = () => {
      // offsetWidth/offsetHeight ignorieren CSS-Transforms. Wichtig, weil der
      // Hero-Rahmen in der gepinnten Timeline von scale 1 auf 0.76 gescrubbt
      // wird und getBoundingClientRect dadurch die verkleinerte Box liefert.
      const w = frame.offsetWidth || window.innerWidth || 1;
      const hh = frame.offsetHeight || window.innerHeight || 1;
      viewW = window.innerWidth || w;
      viewH = window.innerHeight || hh;
      scrollRange = Math.max(200, hh * 1.6);
      return sizeTo(w, hh);
    };

    /* --- Zeichnen --------------------------------------------------------- */
    const draw = () => {
      if (destroyed || gl.isContextLost()) return;
      gl.useProgram(program);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, elapsed);
      gl.uniform2f(uLight, lightX, lightY);
      gl.uniform1f(uScroll, scrollProgress);
      gl.uniform1f(uPower, power);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!firstFrameDone) {
        firstFrameDone = true;
        heroEl.classList.add('has-scene');
      }
    };

    /* --- Schleife --------------------------------------------------------- */
    const tick = (ts) => {
      if (destroyed) return;
      rafId = requestAnimationFrame(tick);

      if (!lastTs) lastTs = ts;
      const raw = ts - lastTs;
      lastTs = ts;
      acc += raw;
      if (acc < frameBudget) return;
      const dt = Math.min(acc, 120) / 1000;
      acc = 0;

      elapsed += dt;

      /* Bewegungsstärke sanft hochfahren (ambiente Motion, darf lang sein) */
      if (power < 1) power = Math.min(1, power + dt / 1.6);

      /* Licht: Zeiger oder Eigenbewegung */
      if (!pointerActive) {
        aimX = 0.66 + 0.26 * Math.sin(elapsed * 0.11) + 0.07 * Math.sin(elapsed * 0.037);
        aimY = 0.62 + 0.17 * Math.cos(elapsed * 0.083) + 0.05 * Math.cos(elapsed * 0.029);
      }
      const k = 1 - Math.exp(-dt * 3.2);
      lightX += (aimX - lightX) * k;
      lightY += (aimY - lightY) * k;

      /* Scroll-Fortschritt (nur Rechnen, kein DOM-Lesen) */
      const target = Math.min(1, Math.max(0, scrollY / scrollRange));
      scrollProgress += (target - scrollProgress) * Math.min(1, dt * 6);

      draw();

      /* Governor: bleibt die Bildrate 90 Frames lang deutlich unter dem
         Budget, die Auflösung einmalig bzw. zweimalig senken. Das Nachmessen
         läuft über `relayout()` (debounced, außerhalb dieses rAF-Callbacks) —
         hier drin wird bewusst nichts aus dem Layout gelesen. */
      if (!givenUp) {
        // Abstand zwischen zwei GEZEICHNETEN Bildern messen, nicht zwischen
        // rAF-Aufrufen: sonst steht hier immer ~16 ms und der Governor
        // kann auf langsamer Hardware nie ausloesen.
        if (lastDrawTs) { sampleSum += ts - lastDrawTs; sampleCount++; }
        lastDrawTs = ts;
        // Erste Entscheidung schon nach 24 Bildern, damit der Einstieg in
        // den Hero nicht sekundenlang ruckelt; danach ruhiger nachmessen.
        if (sampleCount >= (downgrades === 0 ? 24 : 48)) {
          const avg = sampleSum / sampleCount;
          sampleSum = 0;
          sampleCount = 0;
          // Schwelle bewusst streng: die Szene darf die Seite nicht unter
          // etwa 50 Bilder pro Sekunde druecken, solange der Hero sichtbar ist.
          if (avg > frameBudget * 1.35) {
            if (downgrades < 2) { downgrades++; relayout(); }
            else { givenUp = true; giveUp(); }   // Hardware traegt die Szene nicht
          } else if (avg < frameBudget * 1.1) {
            sampleSum = 0; sampleCount = 0;      // laeuft rund, nicht weiter pruefen
          }
        }
      }
    };

    const start = () => {
      if (destroyed || contextLost || reduced || running) return;
      if (!inView || document.hidden) return;
      running = true;
      lastTs = 0;
      acc = frameBudget;              // erstes Bild sofort
      /* Nach einer langen Pause die Shader-Zeit zurückfalten, damit mediump
         nicht wegdriftet. Passiert nur, wenn gerade nichts zu sehen ist. */
      if (elapsed > 900) elapsed -= 900;
      rafId = requestAnimationFrame(tick);
    };

    const stop = () => {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
    };

    /* --- Eingaben --------------------------------------------------------- */
    const onScroll = () => { scrollY = window.scrollY || window.pageYOffset || 0; };

    const onPointerMove = (e) => {
      if (e.pointerType === 'touch') return;
      pointerActive = true;
      aimX = e.clientX / viewW;              // viewW/viewH sind gecacht
      aimY = 1 - e.clientY / viewH;          // GL: y zeigt nach oben
    };
    const onPointerLeave = () => { pointerActive = false; };

    const onVisibility = () => { if (document.hidden) stop(); else start(); };

    const onLost = (e) => {
      e.preventDefault();
      contextLost = true;          // sperrt jeden Neustart durch IO/visibility
      stop();
      firstFrameDone = false;
      heroEl.classList.remove('has-scene');
      heroEl.classList.add('scene-off');
    };

    // Letzte Stufe, wenn auch die kleinste Aufloesung zu teuer ist: Szene
    // abbauen und den bestehenden CSS-Verlauf allein stehen lassen.
    let giveUp = () => {};

    const relayout = debounce(() => {
      if (destroyed) return;
      applyMediaState();
      measure();
      if (reduced || !running) draw();
    }, 150);

    /* --- Beobachter ------------------------------------------------------- */
    let io = null;
    if (typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver((entries) => {
        inView = entries.some((en) => en.isIntersecting);
        // Ausserhalb des Sichtbereichs die Flaeche komplett aus dem Malpfad
        // nehmen. Das Pausieren der Zeichenschleife allein genuegt nicht:
        // eine grosse Canvas-Ebene kostet auch im Leerlauf jeden Frame
        // Compositing-Zeit, besonders auf Geraeten ohne echte Grafikeinheit.
        heroEl.classList.toggle('scene-idle', !inView);
        if (inView) start(); else stop();
      }, { rootMargin: '10% 0px 10% 0px', threshold: 0 });
      io.observe(heroEl);
    }

    let ro = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => relayout());
      ro.observe(frame);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', relayout);
    window.addEventListener('orientationchange', relayout);
    document.addEventListener('visibilitychange', onVisibility);
    canvas.addEventListener('webglcontextlost', onLost, false);
    if (mqFine.matches && !reduced) {
      heroEl.addEventListener('pointermove', onPointerMove, { passive: true });
      heroEl.addEventListener('pointerleave', onPointerLeave, { passive: true });
    }

    /* --- Start ------------------------------------------------------------ */
    measure();
    onScroll();
    if (reduced) {
      /* Genau ein Standbild: keine Schleife, keine Reaktion auf irgendwas. */
      power = 0;
      elapsed = 0;
      scrollProgress = 0;
      lightX = 0.70; lightY = 0.66;
      draw();
    } else {
      start();
    }

    /* --- Handle ----------------------------------------------------------- */
    const handle = {
      isRunning: () => running,
      refresh: () => { if (!destroyed) { applyMediaState(); measure(); if (reduced || !running) draw(); } },
      pause: stop,
      resume: start,
      destroy: () => {
        if (destroyed) return;
        destroyed = true;
        stop();
        io?.disconnect();
        ro?.disconnect();
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', relayout);
        window.removeEventListener('orientationchange', relayout);
        document.removeEventListener('visibilitychange', onVisibility);
        canvas.removeEventListener('webglcontextlost', onLost, false);
        heroEl.removeEventListener('pointermove', onPointerMove);
        heroEl.removeEventListener('pointerleave', onPointerLeave);
        heroEl.classList.remove('has-scene');
        heroEl.classList.add('scene-off');
        if (!gl.isContextLost()) {
          gl.bindBuffer(gl.ARRAY_BUFFER, null);
          gl.deleteBuffer(buffer);
          gl.useProgram(null);
          gl.deleteProgram(program);
        }
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        canvas.width = 1;
        canvas.height = 1;
        gl = null;
      },
    };

    // Notbremse verdrahten: baut die Szene ab und laesst den CSS-Verlauf stehen.
    giveUp = () => { try { handle.destroy(); } catch (e) { /* egal */ } };

    return handle;
  };

  /* ---------- 2c. Gepinnter Wort-Tausch (Abschnitt Fokus) ---------- */
  const typoSwap = (o) => {
    const sec = $('[data-typo-swap]');
    if (!sec) return;
    const slot = $('[data-typo-swap-slot]', sec);
    const words = $$('[data-typo-swap-word]', sec);
    if (!slot || words.length < 2) return;
  
    const railInner = $('[data-typo-swap-rail] i', sec);
    const meter = $('[data-typo-swap-meter]', sec);
    const totalEl = $('[data-typo-swap-total]', sec);
    const total = words.length;
    if (totalEl) totalEl.textContent = String(total).padStart(2, '0');
    const setRail = railInner ? gsap.quickSetter(railInner, 'scaleX') : null;
    // Beim Breakpoint-Wechsel Reste der anderen Betriebsart loeschen (inkl. GSAP-Transform-Cache)
    gsap.set(words, { clearProps: 'transform,opacity,visibility' });
    if (railInner) gsap.set(railInner, { clearProps: 'transform' });
    slot.classList.toggle('is-swapping', !!o.isDesktop);

    if (!o.isDesktop) {
      /* Mobil: KEIN Pin. Die Varianten bleiben als lesbare Liste stehen und
         kommen gestaffelt herein. */
      gsap.fromTo(words, { yPercent: 28, opacity: 0 }, {
        yPercent: 0, opacity: 1, duration: 0.85, stagger: 0.09, ease: 'power3.out',
        scrollTrigger: { trigger: slot, start: 'top 90%', once: true },
      });
      if (railInner) {
        gsap.fromTo(railInner, { scaleX: 0 }, {
          scaleX: 1, ease: 'none',
          scrollTrigger: { trigger: sec, start: 'top 80%', end: 'bottom 60%', scrub: true },
        });
      }
      if (meter) meter.textContent = String(total).padStart(2, '0');
      return;
    }
  
    /* Desktop: gestapelt, maskiert, gescrubbt im Pin. */
    gsap.set(words, { yPercent: 125 });
    gsap.set(words[0], { yPercent: 0 });

    let shown = 0;
    const marks = []; // Fortschritt, bei dem ein Tausch zur Haelfte durch ist
    const sync = (self) => {
      if (setRail) setRail(self.progress);
      if (!meter) return;
      let i = 1;
      marks.forEach((m) => { if (self.progress >= m) i++; });
      if (i !== shown) { shown = i; meter.textContent = String(i).padStart(2, '0'); }
    };
    const tl = gsap.timeline({
      defaults: { ease: 'power3.inOut' },
      scrollTrigger: {
        trigger: sec,
        start: 'top top',
        end: () => `+=${Math.round(total * 40)}%`, // etwa 0,4 Viewport pro Begriff
        pin: true,
        scrub: o.scrub,
        invalidateOnRefresh: true,
        onUpdate: sync,
        onRefresh: sync,
      },
    });

    tl.to({}, { duration: 0.4 }); // Ruhe, bevor der erste Tausch startet
    for (let i = 1; i < total; i++) {
      const label = `swap-${i}`;
      tl.to(words[i - 1], { yPercent: -125, duration: 0.5 }, label)
        .fromTo(words[i], { yPercent: 125 }, { yPercent: 0, duration: 0.55 }, `${label}+=0.12`)
        .to({}, { duration: 0.45 });
    }
    tl.to({}, { duration: 0.35 }); // Nachlauf, damit der letzte Begriff stehen bleibt
    for (let i = 1; i < total; i++) marks.push((tl.labels[`swap-${i}`] + 0.34) / tl.duration());
  };

  /* ---------- 3. Smooth Scroll (Lenis) ---------- */
  let lenis = null;
  if (motion && hasLenis && !isTouch) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    // Vor GSAP: Lenis scrollt auf sauberem Layout, der Scrub liest die Position im selben Frame
    gsap.ticker.add((t) => lenis.raf(t * 1000), false, true);
  }
  if (motion) {
    // Klassische Scrollbalken (Windows, Linux): Rinne waehrend des Preloaders halten (style.css)
    doc.classList.toggle('has-scrollbar', window.innerWidth - doc.clientWidth > 0);
    // Waehrend Preloader und Intro normale Lag-Glaettung (kein Sprung nach dem Init-Stau),
    // 0 erst, wenn gescrollt werden darf (siehe 6c)
    gsap.ticker.lagSmoothing(80, 33);
    // Scrollposition beim Laden setzt diese Datei selbst (6c), nicht der Browser
    ScrollTrigger.clearScrollMemory('manual');
    // Refreshes steuert Abschnitt 8 (gebuendelt, nie mitten im Scrollen)
    ScrollTrigger.config({ autoRefreshEvents: 'visibilitychange' });
  }

  // Erfuellt, sobald die FX-Module laufen und der erste Refresh durch ist (6c)
  let initResolve = null;
  const initDone = new Promise((r) => { initResolve = r; });

  // Pins zaehlen ab ihrem Spacer; data-land="0..1" landet an dieser Stelle des Pins
  const spacerOf = (el) => (el.parentElement && el.parentElement.classList.contains('pin-spacer') ? el.parentElement : el);
  const pinOf = (el) => (hasGSAP ? ScrollTrigger.getAll().find((s) => s.pin && (s.pin === el || s.pin.contains(el))) : null);
  const targetY = (target, offset = 0) => {
    if (typeof target === 'number') return target + offset;
    const st = pinOf(target);
    const land = parseFloat(target.dataset.land || (st ? st.pin.dataset.land : ''));
    if (st && !Number.isNaN(land)) return st.start + (st.end - st.start) * fkClamp(land, 0, 1) + offset;
    if (st && st.pin !== target) return st.start + (target.getBoundingClientRect().top - st.pin.getBoundingClientRect().top) + offset;
    return spacerOf(st ? st.pin : target).getBoundingClientRect().top + window.scrollY + offset;
  };
  const jumpTo = (y) => {
    const top = Math.max(0, Math.round(y));
    if (lenis) lenis.scrollTo(top, { immediate: true, force: true }); else window.scrollTo(0, top);
  };
  let jumpOff = null; // laufender Sprung: nach einem Refresh neu zielen
  const scrollToTarget = (target, offset = 0) => {
    jumpOff?.();
    let t = 0;
    const end = () => {
      clearTimeout(t);
      if (hasGSAP) { ScrollTrigger.removeEventListener('refresh', onRefresh); ScrollTrigger.removeEventListener('scrollEnd', end); }
      if (jumpOff === end) jumpOff = null;
    };
    const go = (again) => {
      const top = Math.max(0, Math.round(targetY(target, offset)));
      if (lenis) lenis.scrollTo(top, { duration: again ? 0.6 : 1.4, easing: (x) => 1 - Math.pow(1 - x, 4), force: true, onComplete: end });
      else window.scrollTo({ top, behavior: motionOff() ? 'auto' : 'smooth' });
    };
    const onRefresh = () => go(true);
    go(false);
    if (!hasGSAP) return;
    jumpOff = end;
    t = setTimeout(end, 4000);
    ScrollTrigger.addEventListener('refresh', onRefresh);
    if (!lenis) setTimeout(() => { if (jumpOff === end) ScrollTrigger.addEventListener('scrollEnd', end); }, 120);
  };

  /* Leseposition: Abschnitt auf 40 % Hoehe und Anteil darin. Uebersteht Breakpoint-Wechsel,
     Drehen und Neuladen, auch wenn Pins dazukommen oder wegfallen. */
  const readAnchor = () => {
    const line = window.innerHeight * 0.4;
    const secs = $$('main section[id], .footer');
    for (const el of secs) {
      const r = spacerOf(el).getBoundingClientRect();
      if (r.top <= line && r.bottom > line) return { id: el.id || 'footer', ratio: (line - r.top) / (r.height || 1), w: window.innerWidth, h: window.innerHeight, y: window.scrollY };
    }
    return { id: null, ratio: 0, w: window.innerWidth, h: window.innerHeight, y: window.scrollY };
  };
  const anchorTop = (a) => {
    const el = a.id === 'footer' ? $('.footer') : (a.id && document.getElementById(a.id));
    if (!el) return a.y;
    const r = spacerOf(el).getBoundingClientRect();
    return r.top + window.scrollY + a.ratio * r.height - window.innerHeight * 0.4;
  };

  /* ---------- 4. Nav: Scrolled-State + Section-Theme ---------- */
  const nav = $('[data-nav]');
  const onScrollNav = () => {
    if (!nav) return;
    nav.classList.toggle('is-scrolled', window.scrollY > 40);
  };
  onScrollNav();
  window.addEventListener('scroll', onScrollNav, { passive: true });

  /* Sonde: duenner Streifen im Viewport. Ein IntersectionObserver meldet, welche Flaechen dort
     liegen: ohne Layout-Lesen beim Scrollen; Pins, Transforms, clip-path und Refreshes inklusive.
     area(w, h) -> { top, right, bottom, left } in Viewport-Pixeln oder null. */
  const probe = (els, area, onChange) => {
    if (!els.length || typeof IntersectionObserver === 'undefined') return () => {};
    const hits = new Set();
    let io = null;
    const build = () => {
      io?.disconnect(); hits.clear();
      const w = window.innerWidth, h = window.innerHeight, a = area(w, h);
      if (!a) return;
      const m = (v) => `${-Math.max(0, Math.round(v))}px`;
      io = new IntersectionObserver((entries) => {
        entries.forEach((en) => { if (en.isIntersecting) hits.add(en.target); else hits.delete(en.target); });
        onChange(hits);
      }, { rootMargin: `${m(a.top)} ${m(w - a.right)} ${m(h - a.bottom)} ${m(a.left)}` });
      els.forEach((el) => io.observe(el));
    };
    const onResize = debounce(build, 150);
    let off = false;
    initDone.then(() => { if (!off) build(); }); // erst nach dem ersten Refresh messen (Layout ist dann sauber)
    window.addEventListener('resize', onResize);
    return () => { off = true; io?.disconnect(); window.removeEventListener('resize', onResize); };
  };
  // Innerstes Element = spaetestes in Dokumentreihenfolge (Karte im Abschnitt, Folgeabschnitt an der Kante)
  const innermost = (hits) => {
    let best = null;
    hits.forEach((el) => { if (!best || (best.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING)) best = el; });
    return best;
  };
  // Dunkle Karten in hellen Abschnitten (ergaenzend zu [data-nav-theme])
  const DARK_SURFACES = '.rx-panel, .jetzt__card, #leistungen .pillar--accent';
  const themedEls = [...new Set([...$$('[data-nav-theme]'), ...$$(DARK_SURFACES)])];
  const themeOf = (el) => (el ? (el.dataset.navTheme || 'dark') : 'light');
  // Streifen auf Hoehe der Nav-Schrift, mittlere Haelfte eines Elements
  const navBand = (el) => () => {
    const r = el && el.getBoundingClientRect();
    if (!r || !r.width) return null;
    return { top: 30, bottom: 42, left: r.left + r.width * 0.25, right: r.right - r.width * 0.25 };
  };

  if (nav) {
    // Marke und rechte Gruppe getrennt: dunkle Karten sind oft schmaler als der Viewport
    const st = { l: 'light', r: 'light', any: false, hero: false };
    const paint = () => {
      const dark = st.l === 'dark' && st.r === 'dark';
      nav.classList.toggle('is-dark', dark);
      nav.classList.toggle('is-dark-l', !dark && st.l === 'dark');
      nav.classList.toggle('is-dark-r', !dark && st.r === 'dark');
      nav.classList.toggle('is-mixed', !dark && st.any); // heller Schleier waere ueber dunkler Karte milchig
      setThemeColor(dark ? THEME.dark : (st.hero ? THEME.hero : THEME.light));
    };
    probe(themedEls, navBand($('.nav__brand', nav)), (hits) => { const el = innermost(hits); st.l = themeOf(el); st.hero = !!(el && el.hasAttribute('data-hero')); paint(); });
    probe(themedEls, navBand($('.nav__menu', nav)), (hits) => { st.r = themeOf(innermost(hits)); paint(); });
    probe(themedEls, (w) => ({ top: 30, bottom: 42, left: 0, right: w }), (hits) => { st.any = [...hits].some((el) => themeOf(el) === 'dark'); paint(); });
  }

  /* ---------- 5. Fullscreen-Menü ---------- */
  const menu = $('[data-menu]');
  const menuToggle = $('[data-menu-toggle]');
  const menuLabel = $('[data-menu-label]');
  const menuLinks = $$('[data-menu-link]');
  const main = $('#main');
  let menuOpen = false;
  let lastFocus = null;
  let menuInert = [];

  // Mit JS ist das Menü ein Dialog. Modal machen es die inert-Geschwister, nicht aria-modal:
  // so bleibt der Schließen-Schalter in der Nav für Screenreader erreichbar.
  if (menu) {
    menu.setAttribute('role', 'dialog');
    menu.setAttribute('aria-label', 'Menü');
    menu.setAttribute('aria-hidden', 'true');
  }

  // Tab-Kreis: Schalter (Schließen) + alles Sichtbare im Menü
  const focusables = () => [menuToggle, ...$$('a[href], button, [tabindex]:not([tabindex="-1"])', menu)]
    .filter((el) => el && (el.offsetParent !== null || el === document.activeElement));

  const setMenuInert = (on) => {
    if (on) {
      const outside = [...Array.from(body.children).filter((el) => el !== menu && el !== nav && el.tagName !== 'SCRIPT'), ...$$('.nav__brand, .nav__cta', nav || undefined)];
      menuInert = outside.filter((el) => !el.hasAttribute('inert'));
      menuInert.forEach((el) => el.setAttribute('inert', ''));
    } else {
      menuInert.forEach((el) => el.removeAttribute('inert'));
      menuInert = [];
    }
  };

  const openMenu = () => {
    if (!menu || menuOpen) return;
    menuOpen = true;
    lastFocus = document.activeElement;
    menu.scrollTop = 0;
    menu.classList.add('is-open');
    menu.setAttribute('aria-hidden', 'false');
    body.classList.add('menu-open');
    menuToggle.setAttribute('aria-expanded', 'true');
    menuToggle.setAttribute('aria-label', 'Menü schließen');
    if (menuLabel) menuLabel.textContent = 'Schließen';
    setMenuInert(true);
    lenis?.stop();
    if (motion) {
      gsap.fromTo(menuLinks, { y: 32, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.045, duration: 0.55, delay: 0.18, ease: 'expo.out', overwrite: true });
      const art = $('[data-menu-art]'); const foot = $('[data-menu-foot]');
      if (art) gsap.fromTo(art, { scale: 1.06, opacity: 0 }, { scale: 1, opacity: 0.9, duration: 0.8, delay: 0.25, ease: 'expo.out', overwrite: true });
      if (foot) gsap.fromTo(foot, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, delay: 0.4, ease: 'expo.out', overwrite: true });
    }
    setTimeout(() => { if (menuOpen) menuLinks[0]?.focus(); }, 250);
  };
  const closeMenu = (restore = true) => {
    if (!menu || !menuOpen) return;
    menuOpen = false;
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden', 'true');
    body.classList.remove('menu-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Menü öffnen');
    if (menuLabel) menuLabel.textContent = 'Menü';
    setMenuInert(false);
    lenis?.start();
    if (restore && lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  };
  menuToggle?.addEventListener('click', () => (menuOpen ? closeMenu() : openMenu()));
  document.addEventListener('keydown', (e) => {
    if (!menuOpen) return;
    if (e.key === 'Escape') { e.preventDefault(); closeMenu(); return; }
    if (e.key === 'Tab') {
      const f = focusables(); if (!f.length) return;
      const first = f[0]; const last = f[f.length - 1];
      const i = f.indexOf(document.activeElement);
      if (i < 0) { e.preventDefault(); (e.shiftKey ? last : first).focus(); }
      else if (e.shiftKey && i === 0) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); first.focus(); }
    }
  });

  // Sprungziel: nach dem Scrollen liegt der Fokus dort (Überschrift bzw. <main>), nicht mehr oben
  const focusTarget = (target) => {
    const f = target === main ? target : ($('h1, h2', target) || target);
    if (!f.hasAttribute('tabindex')) f.setAttribute('tabindex', '-1');
    f.focus({ preventScroll: true });
  };

  // Anker-Links (Menü, Buttons, Footer, Skip-Link)
  $$('a[href^="#"]').forEach((a) => {
    if (a.hasAttribute('data-menu-nojs')) return;
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const go = () => { scrollToTarget(target); focusTarget(target); };
      if (menuOpen) { closeMenu(false); setTimeout(go, 300); } else go();
    });
  });

  /* ---------- 5b. Fokus holt versteckte Reveals ins Bild ---------- */
  // Reine DOM-Regel für alle Module: landet Tastaturfokus in einem noch unsichtbaren
  // [data-reveal], wird der Reveal sofort fertig (eigene Reveals über el._fkReveal,
  // fremde über ihre GSAP-Tweens, zur Not per opacity 1). Maus/Touch bleiben unberührt.
  // Module markieren eigene Reveals mit data-fx-reveal (oder Klasse data-reveal), damit 7b sie nicht doppelt animiert.
  const REVEAL_SEL = '[data-reveal], [data-fx-reveal], .data-reveal';
  const keyboardFocus = (el) => { try { return el.matches(':focus-visible'); } catch (_) { return true; } };
  document.addEventListener('focusin', (e) => {
    const t = e.target;
    if (!(t instanceof Element) || !keyboardFocus(t)) return;
    for (let el = t.closest(REVEAL_SEL); el; el = el.parentElement && el.parentElement.closest(REVEAL_SEL)) {
      if (typeof el._fkReveal === 'function') { el._fkReveal(); continue; }
      const cs = getComputedStyle(el);
      if (parseFloat(cs.opacity) >= 0.99 && cs.visibility !== 'hidden') continue;
      if (window.gsap) gsap.getTweensOf(el).forEach((tw) => { const st = tw.scrollTrigger; if (!st || !st.vars.scrub) tw.progress(1); });
      const now = getComputedStyle(el);
      if (parseFloat(now.opacity) < 0.99) el.style.opacity = '1';
      if (now.visibility === 'hidden') el.style.visibility = 'visible';
    }
  });

  /* ---------- 6. Preloader + Hero-Intro ---------- */
  const preloader = $('[data-preloader]');
  const hero = $('[data-hero]');
  const heroEls = hero ? {
    frame: $('[data-hero-frame]', hero), art: $('[data-hero-art]', hero), disc: $('[data-hero-disc]', hero),
    caption: $('[data-hero-caption]', hero), eyebrow: $('[data-hero-eyebrow]', hero), sub: $('[data-hero-sub]', hero),
    scroll: $('[data-hero-scroll]', hero), content: $('.hero__content', hero), words: $$('[data-split]', hero),
  } : null;

  let introDone = Promise.resolve();

  if (motion && hero) {
    history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    // Name am h1 selbst, die zerlegten Wörter sind nur Optik
    const title = $('[data-hero-title]', hero);
    if (title) title.setAttribute('aria-label', title.textContent.replace(/\s+/g, ' ').trim());
    heroEls.words.forEach((w) => w.setAttribute('aria-hidden', 'true'));
    const chars = heroEls.words.flatMap(splitChars);
    const introHidden = [heroEls.eyebrow, heroEls.sub, heroEls.caption, heroEls.scroll, nav, $('[data-hero-actions]', hero), $('[data-hero-card]', hero)].filter(Boolean);
    gsap.set(chars, { yPercent: 110 });
    gsap.set(introHidden, { autoAlpha: 0 });
    gsap.set(heroEls.art, { autoAlpha: 0, scale: 1.08, transformOrigin: '50% 100%' });
    gsap.set(heroEls.disc, { autoAlpha: 0, scale: 0.7 });
    let preTl = null; let heroTl = null;

    const heroIntro = () => new Promise((resolve) => {
      heroTl = gsap.timeline({ defaults: { ease: 'power4.out' }, onComplete: resolve })
        .to(heroEls.disc, { autoAlpha: 1, scale: 1, duration: 1.8, ease: 'power2.out' }, 0)
        .to(heroEls.art, { autoAlpha: 1, scale: 1, duration: 1.8, ease: 'power2.out' }, 0.1)
        .to(chars, { yPercent: 0, duration: 1.2, stagger: 0.035 }, 0.15)
        .to(heroEls.eyebrow, { autoAlpha: 1, duration: 0.8 }, 0.5)
        .to(heroEls.sub, { autoAlpha: 1, duration: 0.8 }, 0.7)
        .to('[data-hero-actions]', { autoAlpha: 1, duration: 0.7 }, 0.85)
        .fromTo('[data-hero-card]', { y: 24 }, { autoAlpha: 1, y: 0, duration: 0.9, onComplete: () => $('[data-hero-card]')?.classList.add('is-in') }, 0.9)
        .to(nav, { autoAlpha: 1, duration: 0.8 }, 0.6)
        .to([heroEls.caption, heroEls.scroll], { autoAlpha: 1, duration: 0.8 }, 1.0);
    });

    const runPreloader = () => new Promise((resolve) => {
      if (!preloader) return resolve();
      preloader.style.animation = 'none'; // JS hat übernommen: CSS-Notbremse aus
      // Gesperrter Speicher (Cookies/Websitedaten blockiert) wirft: dann läuft das Intro eben jedes Mal
      let seen = false;
      try { seen = sessionStorage.getItem('fk-seen') === '1'; sessionStorage.setItem('fk-seen', '1'); } catch (_) { /* egal */ }
      body.classList.add('is-loading');
      lenis?.stop();
      const count = $('[data-preloader-count]', preloader);
      const rule = $('[data-preloader-rule]', preloader);
      const words = $$('.preloader__word', preloader);
      const counter = { v: 0 };
      const tl = preTl = gsap.timeline({
        onComplete: () => {
          preloader.classList.add('is-done');
          body.classList.remove('is-loading');
          lenis?.start();
          resolve();
        },
      });
      if (seen) {
        tl.to(preloader, { autoAlpha: 0, duration: 0.35, ease: 'power2.out' });
        return;
      }
      tl.fromTo(words, { yPercent: 110 }, { yPercent: 0, duration: 0.9, stagger: 0.1, ease: 'expo.out' }, 0)
        .fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: 'power2.inOut' }, 0.15)
        .to(counter, { v: 100, duration: 1.2, ease: 'power2.inOut', onUpdate: () => { if (count) count.textContent = String(Math.round(counter.v)).padStart(2, '0'); } }, 0.15)
        .to(preloader, { yPercent: -100, duration: 0.8, ease: 'expo.inOut' }, '+=0.1')
        .to('.preloader__inner', { yPercent: 30, autoAlpha: 0, duration: 0.4, ease: 'power2.in' }, '<');
    });

    // Wachhund: Das Intro darf die Seite nie festhalten. Steht nach 6 s sichtbarer Zeit
    // (Hintergrund-Tabs zählen nicht) nicht alles, wird der Endzustand hart gesetzt.
    introDone = new Promise((resolve) => {
      let settled = false; let dog = 0;
      const finish = () => { if (settled) return; settled = true; clearTimeout(dog); resolve(); };
      const force = () => {
        if (settled) return;
        try { preTl?.kill(); heroTl?.kill(); } catch (_) { /* egal */ }
        preloader?.classList.add('is-done');
        body.classList.remove('is-loading');
        try {
          lenis?.start();
          gsap.set(chars, { yPercent: 0 });
          gsap.set(introHidden, { autoAlpha: 1 });
          gsap.set('[data-hero-card]', { y: 0 });
          gsap.set([heroEls.art, heroEls.disc].filter(Boolean), { autoAlpha: 1, scale: 1 });
        } catch (_) { introHidden.concat(chars).forEach((el) => { if (el.style) { el.style.visibility = ''; el.style.opacity = ''; el.style.transform = ''; } }); }
        $('[data-hero-card]')?.classList.add('is-in');
        finish();
      };
      const arm = () => { clearTimeout(dog); dog = setTimeout(() => { if (!document.hidden) force(); }, 6000); };
      document.addEventListener('visibilitychange', () => { if (!document.hidden && !settled) arm(); });
      arm();
      runPreloader().then(heroIntro).then(finish, force);
    });

    // Tastaturfokus im weggescrollten Hero: zurück nach ganz oben (der gepinnte Hero selbst
    // meldet dort immer top 0, darum der Body als Ziel), damit man sieht, wo man ist
    heroEls.content?.addEventListener('focusin', (e) => {
      if (window.scrollY > 4 && keyboardFocus(e.target)) scrollToTarget(body);
    });
  } else if (preloader) {
    preloader.classList.add('is-done');
  }

  /* ---------- 6b. Hero-Szene (WebGL-Marmor) ---------- */
  // Bewusst NACH dem Intro und in einem Leerlauf-Slot: das Kompilieren der
  // Shader kostet einmalig Hauptthread-Zeit und darf die Intro-Timeline nicht
  // ins Stocken bringen.
  let heroScene = null;
  const sceneOff = /[?&]scene=off\b/.test(location.search); // Diagnose-Schalter
  const startHeroScene = () => { if (!heroScene && !sceneOff) heroScene = initHeroScene(hero, { reduced: motionOff() }); };
  introDone.then(() => {
    if (window.requestIdleCallback) requestIdleCallback(startHeroScene, { timeout: 1200 });
    else setTimeout(startHeroScene, 60);
  });

  /* ---------- 6c. Schnittstelle fuer FX-Module (assets/fx/*.js) ---------- */
  // Einziges Global der Seite. Jedes FX-Modul meldet sich mit FK.register(name, fn)
  // an. Alle Module laufen nach dem Laden aller Skripte; danach sortiert
  // ScrollTrigger die Trigger nach ihrer Position, damit Pins sauber verrechnet werden.
  const fxModules = [];
  window.FK = Object.freeze({
    motion, isTouch, hasGSAP, lenis, introDone, motionOff,
    $, $$, debounce, splitWords, splitChars, scrollToTarget,
    register: (name, fn) => { fxModules.push({ name, fn }); },
  });

  // Landepunkt beim Laden: Neuladen/Zurueck -> gespeicherte Leseposition, sonst #hash, sonst oben
  const POS_KEY = 'fk-pos';
  const landing = () => {
    let kind = '';
    try { kind = (performance.getEntriesByType('navigation')[0] || {}).type || ''; } catch (_) { /* egal */ }
    if (kind === 'reload' || kind === 'back_forward') {
      let saved = null;
      try { saved = JSON.parse(sessionStorage.getItem(POS_KEY) || 'null'); } catch (_) { saved = null; }
      // grob (vor dem Init, ohne Modul-Pins): Oberkante des Abschnitts; genau: Anteil darin
      if (saved && saved.path === location.pathname) return (rough) => (rough ? anchorTop({ ...saved, ratio: 0 }) + window.innerHeight * 0.4 : anchorTop(saved));
    }
    let el = null;
    try { el = location.hash.length > 1 ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null; } catch (_) { el = null; }
    return el ? () => targetY(el) : null;
  };
  if (motion) {
    window.addEventListener('pagehide', () => {
      try { sessionStorage.setItem(POS_KEY, JSON.stringify({ ...readAnchor(), path: location.pathname })); } catch (_) { /* egal */ }
    });
  }

  document.addEventListener('DOMContentLoaded', async () => {
    // Module einzeln, mit Pause dazwischen: der Preloader bekommt Bilder, statt einen langen Task abzuwarten
    // Pause erst nach ~40 ms Arbeit: jede Pause kostet einen internen Refresh von ScrollTrigger
    let slice = performance.now();
    for (const { name, fn } of fxModules) {
      try { fn(window.FK); } catch (err) { console.error(`[fx:${name}]`, err); }
      if (motion && performance.now() - slice > 40) {
        await new Promise((r) => setTimeout(r, 0));
        slice = performance.now();
      }
    }
    if (motion) {
      ScrollTrigger.sort();
      ScrollTrigger.refresh();
      const land = landing();
      if (land) {
        // Landen, solange niemand selbst gescrollt hat (nach load und Intro erneut, falls der Browser nachzieht)
        let moved = false;
        const stop = () => { moved = true; };
        ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach((t) => window.addEventListener(t, stop, { once: true, passive: true }));
        const put = () => { if (!moved) jumpTo(land()); };
        put();
        if (document.readyState !== 'complete') window.addEventListener('load', () => setTimeout(put, 0), { once: true });
        introDone.then(() => setTimeout(put, 60));
      }
    }
    initResolve();
  });
  // Nach dem Intro darf gescrollt werden: Lenis braucht dann keine Lag-Glaettung mehr
  if (motion) introDone.then(() => { if (lenis) gsap.ticker.lagSmoothing(0); });

  /* ---------- 7. Scroll-Module (nur mit Motion) ---------- */
  if (motion) {
    const mm = gsap.matchMedia();

    mm.add({ isDesktop: '(min-width: 900px)', isMobile: '(max-width: 899px)' }, (ctx) => {
      const { isDesktop } = ctx.conditions;
      const scrub = isTouch ? true : 0.8;
      const cleanups = []; // Sonden und Beobachter, die matchMedia nicht selbst zuruecknimmt

      /* 7a. Hero: Full-Bleed-Rahmen wird zur Karte.
         Pin und Scrub entstehen sofort, damit der Pin-Abstand vor dem ersten Refresh steht
         (Deep-Links, Neuladen). Bei Fortschritt 0 ist die Timeline neutral und beruehrt nur
         Eigenschaften, die das Intro nicht animiert (Rahmen, Inhalts-Huelle, yPercent, Hintergrund). */
      if (hero && isDesktop) {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: hero, start: 'top top', end: '+=110%', pin: true, scrub, invalidateOnRefresh: true,
            refreshPriority: 0, // schaltet das Sortieren nach Position bei jedem Refresh ein
            // Rundung und Schatten per CSS-Transition (is-framed), nicht pro Frame neu gemalt
            onUpdate: (self) => hero.classList.toggle('is-framed', self.progress > 0.03),
          },
        })
          .fromTo(heroEls.frame, { scale: 1 }, { scale: 0.76, ease: 'power1.inOut' }, 0)
          // opacity statt autoAlpha: Ueberschrift und Buttons bleiben im Accessibility-Baum
          .fromTo(heroEls.content, { yPercent: 0, opacity: 1 }, { yPercent: -40, opacity: 0, ease: 'power1.in', immediateRender: false }, 0)
          .fromTo(heroEls.art, { yPercent: 0 }, { yPercent: -6, ease: 'none' }, 0)
          .fromTo(heroEls.disc, { yPercent: 0 }, { yPercent: 18, ease: 'none' }, 0)
          .fromTo(hero, { backgroundColor: '#F6F3EC' }, { backgroundColor: '#DCEAF7', ease: 'none' }, 0);
        // Scroll-Hinweis ueber seine Kinder: das Intro blendet den Hinweis selbst per autoAlpha ein
        if (heroEls.scroll && heroEls.scroll.children.length) tl.fromTo(heroEls.scroll.children, { opacity: 1 }, { opacity: 0, immediateRender: false }, 0);
      } else if (hero) {
        gsap.to(heroEls.content, {
          yPercent: -30, opacity: 0, ease: 'none',
          scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom 40%', scrub: true },
        });
        gsap.to(heroEls.art, { yPercent: 12, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
      }

      /* 7b. Text-Reveals: ein ScrollTrigger.batch statt je ein Tween mit eigenem Trigger.
         Die Trigger tragen keine Tweens (billiger Refresh) und sterben nach dem Auslösen.
         Nur opacity, nie visibility: Tastatur und Screenreader erreichen alles. */
      const reveals = $$('[data-reveal]');
      const revealIn = (el, delay = 0) => {
        if (el._fkRv) return el._fkRv;
        const type = el.dataset.reveal;
        const v = { delay, onStart: () => el.classList.add('is-in') };
        ctx.add(() => { // im matchMedia-Kontext, damit ein Breakpoint-Wechsel auch laufende Reveals zurücksetzt
          if (type === 'words') el._fkRv = gsap.to($$('.w-in', el), { ...v, yPercent: 0, duration: 1, stagger: 0.035, ease: 'power4.out' });
          else if (type === 'lines') el._fkRv = gsap.to($$('.line', el), { ...v, clipPath: 'inset(0 0 0% 0)', y: 0, duration: 1.2, stagger: 0.16, ease: 'power4.out' });
          else if (type === 'figure') el._fkRv = gsap.to(el, { ...v, y: 0, scale: 1, opacity: 1, duration: 1.3, ease: 'power3.out' });
          else el._fkRv = gsap.to(el, { ...v, y: 0, opacity: 1, duration: 1, ease: 'power3.out' });
        });
        return el._fkRv;
      };
      reveals.forEach((el) => {
        const type = el.dataset.reveal;
        el._fkRv = null;
        if (type === 'words') {
          gsap.set(splitWords(el), { yPercent: 110 });
          $$('.w', el).forEach((w) => w.setAttribute('aria-hidden', 'true')); // Name kommt aus aria-label der Überschrift
        } else if (type === 'lines') gsap.set($$('.line', el), { clipPath: 'inset(0 0 100% 0)', y: 24 });
        else if (type === 'figure') gsap.set(el, { y: 50, scale: 0.97, opacity: 0 });
        else gsap.set(el, { y: 28, opacity: 0 });
        el._fkReveal = () => { el._fkSt?.kill(); revealIn(el).progress(1); };
      });
      ScrollTrigger.batch(reveals, {
        start: 'top 88%', interval: 0.08,
        // Was zusammen hereinkommt, läuft leicht versetzt nacheinander (Eyebrow, Titel, Lead)
        onEnter: (els, sts) => {
          els.forEach((el, i) => revealIn(el, i * 0.08));
          sts.forEach((st) => st.kill());
        },
      }).forEach((st) => { st.trigger._fkSt = st; });

      /* 7c. Zähler */
      $$('[data-count]').forEach((el) => {
        const end = parseFloat(el.dataset.count);
        if (Number.isNaN(end)) return;
        const o = { v: 0 };
        gsap.to(o, {
          v: end, duration: 1.8, ease: 'power2.out',
          onUpdate: () => { el.textContent = String(Math.round(o.v)); },
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        });
      });

      /* 7d. Marquee */
      const track = $('[data-marquee-track]');
      if (track && !track.dataset.cloned) {
        track.innerHTML += track.innerHTML;
        track.dataset.cloned = '1';
      }
      if (track) {
        const run = () => {
          const half = track.scrollWidth / 2;
          gsap.to(track, { x: -half, ease: 'none', duration: Math.max(12, half / 70), repeat: -1 });
        };
        if (document.fonts?.ready) document.fonts.ready.then(() => ctx.add(run)); else run();
      }

      /* 7e. Der Weg: Pfad zeichnen + leuchtender Punkt */
      const stage = $('[data-journey]');
      if (stage) {
        const svg = $('[data-journey-svg]', stage);
        const path = $('[data-journey-path]', stage);
        const dot = $('[data-journey-dot]', stage);
        const anchors = $$('[data-journey-anchor]', stage);
        const items = $$('[data-journey-item]', stage);
        // Leuchtpunkt als eigene HTML-Ebene: Puls und Glanz laufen im Compositor statt als SVG-Filter
        let orb = $('.weg__orb', stage);
        if (!orb) { orb = document.createElement('span'); orb.className = 'weg__orb'; orb.setAttribute('aria-hidden', 'true'); stage.appendChild(orb); }
        stage.classList.add('has-orb');
        let len = 0; let anchorY = [];
        const build = () => {
          const r = stage.getBoundingClientRect();
          svg.setAttribute('viewBox', `0 0 ${r.width} ${r.height}`);
          const pts = anchors.map((a) => { const b = a.getBoundingClientRect(); return { x: b.left - r.left + b.width / 2, y: b.top - r.top + b.height / 2 }; });
          anchorY = pts.map((p) => p.y);
          let d = `M${pts[0].x} 0 L${pts[0].x} ${pts[0].y}`;
          for (let i = 1; i < pts.length; i++) {
            const p = pts[i - 1]; const c = pts[i]; const dy = (c.y - p.y) * 0.55;
            d += ` C${p.x} ${p.y + dy} ${c.x} ${c.y - dy} ${c.x} ${c.y}`;
          }
          d += ` L${pts[pts.length - 1].x} ${r.height}`;
          path.setAttribute('d', d);
          len = path.getTotalLength();
          path.style.strokeDasharray = `${len}`;
        };
        build();
        const render = (progress) => {
          const l = len * progress;
          path.style.strokeDashoffset = `${len - l}`;
          const pt = path.getPointAtLength(l);
          dot.setAttribute('cx', pt.x); dot.setAttribute('cy', pt.y);
          orb.style.transform = `translate3d(${pt.x.toFixed(1)}px,${pt.y.toFixed(1)}px,0)`;
          items.forEach((it, i) => it.classList.toggle('is-active', pt.y >= anchorY[i] - 2));
        };
        render(0);
        ScrollTrigger.create({
          trigger: stage, start: 'top 72%', end: 'bottom 55%', scrub: true,
          onUpdate: (self) => render(self.progress),
          onRefresh: (self) => { build(); render(self.progress); },
        });
      }

      /* 7f. Projekte: horizontales Pinned-Scrolling (Desktop) */
      const ventures = $('[data-ventures]');
      const vTrack = $('[data-ventures-track]');
      if (ventures && vTrack && isDesktop) {
        const dist = () => Math.max(0, vTrack.scrollWidth - window.innerWidth);
        // Karten sind so gross, dass die Seitwaertsfahrt etwa einen Viewport lang ist (style.css).
        // Kein eigenes Einblenden je Karte: das Bild-Reveal kommt aus assets/fx/enthuellung.js.
        gsap.to(vTrack, {
          x: () => -dist(), ease: 'none',
          scrollTrigger: {
            trigger: ventures, start: 'top top', end: () => `+=${dist()}`, pin: true, scrub, invalidateOnRefresh: true,
            onRefresh: () => ventures.classList.toggle('is-short', dist() < window.innerHeight * 0.3), // Hinweis nur bei echter Fahrt
          },
        });
      } else if (vTrack) {
        gsap.from($$('[data-ventures-card]', vTrack), { y: 40, autoAlpha: 0, duration: 1, stagger: 0.1, ease: 'power3.out', scrollTrigger: { trigger: vTrack, start: 'top 85%', once: true } });
      }

      /* 7g. Parallax + Galerie */
      if (isDesktop) {
        $$('[data-parallax]').forEach((el) => {
          const v = parseFloat(el.dataset.parallax) || 0;
          const holder = el.closest('section') || el;
          gsap.fromTo(el, { y: -v / 2 }, { y: v / 2, ease: 'none', scrollTrigger: { trigger: holder, start: 'top bottom', end: 'bottom top', scrub: true } });
        });
      }
      const gStage = $('[data-gallery]');
      if (gStage) {
        $$('[data-gallery-tile]', gStage).forEach((tile) => {
          gsap.from(tile, { y: 60, scale: 0.94, autoAlpha: 0, duration: 1.3, ease: 'power3.out', scrollTrigger: { trigger: tile, start: 'top 92%', once: true } });
        });
        if (isDesktop) {
          $$('[data-speed]', gStage).forEach((el) => {
            const s = parseFloat(el.dataset.speed) || 1;
            gsap.to(el, { y: (1 - s) * 360, ease: 'none', scrollTrigger: { trigger: gStage, start: 'top bottom', end: 'bottom top', scrub: true } });
          });
        }
      }

      /* 7i. Ambient: Hero-Parallax + Lichtschein, Spotlight, Tilt, Cursor, Hintergrund-Temperatur */
      if (isDesktop && !isTouch && hero) {
        const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
        if (fine) {
          const artX = gsap.quickTo(heroEls.art, 'x', { duration: 0.9, ease: 'power3.out' });
          const artY = gsap.quickTo(heroEls.art, 'y', { duration: 0.9, ease: 'power3.out' });
          const discX = gsap.quickTo(heroEls.disc, 'x', { duration: 1.1, ease: 'power3.out' });
          const discY = gsap.quickTo(heroEls.disc, 'y', { duration: 1.1, ease: 'power3.out' });
          const card = $('[data-hero-card]');
          const cardX = card && gsap.quickTo(card, 'x', { duration: 0.8, ease: 'power3.out' });
          const cardY = card && gsap.quickTo(card, 'y', { duration: 0.8, ease: 'power3.out' });
          const cardRX = card && gsap.quickTo(card, 'rotateX', { duration: 0.8, ease: 'power3.out' });
          const cardRY = card && gsap.quickTo(card, 'rotateY', { duration: 0.8, ease: 'power3.out' });
          const glow = $('[data-hero-glow]');
          const glowX = glow && gsap.quickTo(glow, 'x', { duration: 1.4, ease: 'power2.out' });
          const glowY = glow && gsap.quickTo(glow, 'y', { duration: 1.4, ease: 'power2.out' });
          if (card) gsap.set(card, { transformPerspective: 900 });
          hero.addEventListener('pointermove', (e) => {
            const nx = (e.clientX / window.innerWidth) * 2 - 1;
            const ny = (e.clientY / window.innerHeight) * 2 - 1;
            artX(nx * 14); artY(ny * 10);
            discX(nx * -26); discY(ny * -18);
            if (card) { cardX(nx * 8); cardY(ny * 6); cardRY(nx * 3); cardRX(ny * -3); }
            if (glow) { glowX(e.clientX); glowY(e.clientY); }
          }, { passive: true });
          hero.addEventListener('pointerleave', () => { artX(0); artY(0); discX(0); discY(0); if (card) { cardX(0); cardY(0); cardRX(0); cardRY(0); } });

          /* Spotlight auf Glas-Karten */
          $$('.glass').forEach((g) => {
            g.addEventListener('pointermove', (e) => {
              const r = g.getBoundingClientRect();
              g.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
              g.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
            }, { passive: true });
          });

          /* 3D-Tilt auf Projekt-Karten */
          $$('[data-ventures-card]').forEach((c) => {
            const rx = gsap.quickTo(c, 'rotateX', { duration: 0.5, ease: 'power2.out' });
            const ry = gsap.quickTo(c, 'rotateY', { duration: 0.5, ease: 'power2.out' });
            const media = $('.card__media img', c);
            const mx = media && gsap.quickTo(media, 'x', { duration: 0.5, ease: 'power2.out' });
            const my = media && gsap.quickTo(media, 'y', { duration: 0.5, ease: 'power2.out' });
            c.addEventListener('pointerenter', () => gsap.to(c, { y: -8, duration: 0.28, ease: 'power3.out', overwrite: 'auto' }));
            c.addEventListener('pointermove', (e) => {
              const r = c.getBoundingClientRect();
              const px = (e.clientX - r.left) / r.width - 0.5; const py = (e.clientY - r.top) / r.height - 0.5;
              ry(px * 8); rx(py * -8);
              if (media) { mx(px * -6); my(py * -6); }
            }, { passive: true });
            c.addEventListener('pointerleave', () => { rx(0); ry(0); if (media) { mx(0); my(0); } gsap.to(c, { y: 0, duration: 0.5, ease: 'power2.out', overwrite: 'auto' }); });
          });

        }
      }

      /* Hintergrund-Temperatur folgt den Sections (Sonde auf 60 % Hoehe, stimmt auch nach Refresh und Neuladen) */
      const BG = { paper: '#F6F3EC', sky: '#E4EEF8' };
      let bgNow = null;
      cleanups.push(probe($$('[data-bg]'), (w, h) => ({ top: h * 0.6, bottom: h * 0.6 + 2, left: 0, right: w }), (hits) => {
        const sec = innermost(hits);
        if (!sec) return;
        const c = BG[sec.dataset.bg] || BG.paper;
        if (c === bgNow) return;
        gsap.to(body, { backgroundColor: c, duration: bgNow ? 0.9 : 0, ease: 'power2.out', overwrite: 'auto' });
        bgNow = c;
      }));

      /* 7k. Wort-Tausch im Abschnitt Fokus (nur Desktop, gepinnt) */
      typoSwap({ isDesktop, scrub });

      /* 7l. Fortschrittsanzeige + Abschnitts-Navigation */
      (() => {
        const bar = $('[data-progress] i');
        if (bar) {
          const set = gsap.quickSetter(bar, 'scaleX');
          ScrollTrigger.create({
            start: 0, end: 'max', onUpdate: (self) => set(self.progress), onRefresh: (self) => set(self.progress),
          });
        }

        const sidenav = $('[data-sidenav]');
        if (!sidenav || !isDesktop) return;
        const list = $('ol', sidenav);
        const items = $$('main section[id]').map((sec) => {
          const link = document.querySelector('[data-menu-link][href="#' + sec.id + '"] span');
          return { sec, label: sec.dataset.navLabel || (link ? link.textContent.trim() : (sec.id.charAt(0).toUpperCase() + sec.id.slice(1))) };
        });
        if (items.length < 3) return;
        list.innerHTML = '';
        const btns = items.map(({ sec, label }) => {
          const li = document.createElement('li');
          const b = document.createElement('button');
          b.type = 'button';
          b.setAttribute('aria-label', 'Zum Abschnitt ' + label);
          b.innerHTML = '<span class="lbl">' + label + '</span><span class="dot"></span>';
          b.addEventListener('click', () => scrollToTarget(sec));
          li.appendChild(b); list.appendChild(li);
          return b;
        });
        // Aktiver Abschnitt und eigenes Hell/Dunkel: Sonden auf Hoehe der Seitennavigation
        let active = -1, annT = 0, intro = false;
        introDone.then(() => { intro = true; });
        const setActive = (i) => {
          if (i === active) return;
          const first = active < 0;
          active = i;
          btns.forEach((b, k) => {
            b.classList.remove('is-announce');
            if (k === i) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
          });
          // Label kurz zeigen, wenn der Abschnitt wechselt; sonst nur bei Hover/Fokus
          clearTimeout(annT);
          if (first || !intro) return;
          btns[i].classList.add('is-announce');
          annT = setTimeout(() => btns[i].classList.remove('is-announce'), 1500);
        };
        const secs = items.map((it) => it.sec);
        cleanups.push(probe(secs, (w, h) => ({ top: h * 0.45, bottom: h * 0.45 + 2, left: 0, right: w }), (hits) => {
          const i = secs.indexOf(innermost(hits));
          if (i >= 0) setActive(i);
        }));
        cleanups.push(probe(themedEls, (w, h) => {
          const r = list.getBoundingClientRect();
          if (!r.width) return null;
          return { top: h / 2 - 1, bottom: h / 2 + 1, left: r.left, right: r.right };
        }, (hits) => sidenav.classList.toggle('is-dark', themeOf(innermost(hits)) === 'dark')));
        cleanups.push(() => clearTimeout(annT));
      })();


      /* 7j. Neue Abschnitte: Zahlen-Scrub + Stimmen-Ambient */
      fkSectionsScroll({ ...fkEnv, isDesktop, scrub });

      /* 7h. Magnetic Button */
      if (isDesktop && !isTouch) {
        $$('[data-magnetic]').forEach((btn) => {
          const inner = btn.firstElementChild || btn;
          const move = (e) => {
            const r = btn.getBoundingClientRect();
            const x = e.clientX - (r.left + r.width / 2); const y = e.clientY - (r.top + r.height / 2);
            gsap.to(btn, { x: x * 0.3, y: y * 0.3, duration: 0.6, ease: 'power3.out' });
            gsap.to(inner, { x: x * 0.12, y: y * 0.12, duration: 0.6, ease: 'power3.out' });
          };
          const leave = () => { gsap.to([btn, inner], { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, .5)' }); };
          btn.addEventListener('pointermove', move);
          btn.addEventListener('pointerleave', leave);
        });
      }

      return () => cleanups.forEach((f) => f());
    });

    /* ---------- 8. Refresh: gebuendelt, nie mitten im Scrollen ---------- */
    // Quellen: Schriften, load, Intro-Ende, Groesse und Drehung. Ohne Groessenaenderung nur,
    // wenn sich die Seitenhoehe wirklich geaendert hat (ein Refresh kostet hier ~100 ms).
    const signature = () => `${window.innerWidth}x${window.innerHeight}:${document.documentElement.scrollHeight}`;
    let sig = '';
    let sized = false;
    const runRefresh = debounce(() => {
      if (!sized && signature() === sig) return;
      sized = false;
      ScrollTrigger.refresh(true); // true: wartet bis zum Scroll-Ende, falls gerade gescrollt wird
    }, 200);
    const later = () => initDone.then(runRefresh);
    document.fonts?.ready.then(later);
    window.addEventListener('load', later);
    introDone.then(later);
    let lastW = window.innerWidth, lastH = window.innerHeight;
    const onResize = () => {
      const w = window.innerWidth, h = window.innerHeight;
      // Touch: reine Hoehenaenderung durch die Adressleiste ignorieren
      if (w === lastW && (h === lastH || (isTouch && Math.abs(h - lastH) < lastH * 0.25))) return;
      lastW = w; lastH = h; sized = true; runRefresh();
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);

    // Leseposition halten, wenn Breakpoint oder Drehung das Layout umbauen (Pins kommen/gehen)
    let anchor = null, hold = false, holdT = 0;
    const keep = () => { if (!hold && !ScrollTrigger.isRefreshing) anchor = readAnchor(); };
    ScrollTrigger.addEventListener('scrollEnd', keep);
    ScrollTrigger.addEventListener('refresh', () => {
      sig = signature();
      lenis?.resize();
      const moved = anchor && (anchor.w !== window.innerWidth || Math.abs(anchor.h - window.innerHeight) > (isTouch ? anchor.h * 0.25 : 0));
      if (!moved && !hold) { anchor = readAnchor(); return; }
      // Nach einem Groessenwechsel bauen alle Module ihre Pins neu, mehrere Refreshes folgen:
      // so lange an der alten Leseposition festhalten
      hold = true;
      jumpTo(anchorTop(anchor));
      clearTimeout(holdT);
      holdT = setTimeout(() => { hold = false; anchor = readAnchor(); }, 800);
    });

    // Beim Neuladen/Deep-Link schon jetzt grob landen (hinter dem Preloader) und dort bleiben, waehrend
    // die Module ihre Pins einsetzen; genau landet 6c nach dem Init
    const early = landing();
    if (early) {
      const stay = () => jumpTo(early(true));
      stay();
      ScrollTrigger.addEventListener('refresh', stay);
      initDone.then(() => ScrollTrigger.removeEventListener('refresh', stay));
    }

    // Endlos-Animationen ausserhalb des Bildes anhalten (sonst Style und Layout in jedem Leerlauf-Frame)
    if (typeof IntersectionObserver !== 'undefined') {
      const idle = new IntersectionObserver((entries) => entries.forEach((en) => en.target.classList.toggle('is-offscreen', !en.isIntersecting)), { rootMargin: '15% 0px' });
      $$('main section[id], .footer').forEach((s) => idle.observe(s));
    }
  } else {
    /* Ohne Motion: Pfad statisch zeichnen, alles sichtbar */
    const stage = $('[data-journey]');
    if (stage) {
      const svg = $('[data-journey-svg]', stage); const path = $('[data-journey-path]', stage);
      const anchors = $$('[data-journey-anchor]', stage);
      const draw = () => {
        const r = stage.getBoundingClientRect();
        svg.setAttribute('viewBox', `0 0 ${r.width} ${r.height}`);
        const pts = anchors.map((a) => { const b = a.getBoundingClientRect(); return { x: b.left - r.left + b.width / 2, y: b.top - r.top + b.height / 2 }; });
        let d = `M${pts[0].x} 0 L${pts[0].x} ${pts[0].y}`;
        for (let i = 1; i < pts.length; i++) { const p = pts[i - 1]; const c = pts[i]; const dy = (c.y - p.y) * 0.55; d += ` C${p.x} ${p.y + dy} ${c.x} ${c.y - dy} ${c.x} ${c.y}`; }
        d += ` L${pts[pts.length - 1].x} ${r.height}`;
        path.setAttribute('d', d);
      };
      draw();
      window.addEventListener('resize', debounce(draw, 200));
      window.addEventListener('load', draw);
    }
    $$('[data-journey-item]').forEach((it) => it.classList.add('is-active'));
  }
})();
