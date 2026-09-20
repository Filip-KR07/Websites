/* filipkramar.de — main.js
   Progressive Enhancement: Ohne GSAP/Lenis oder bei "prefers-reduced-motion" ist die Seite
   vollständig sichtbar und nutzbar. Module in fester Reihenfolge, eine IIFE, keine Globals. */
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

  const splitChars = (el) => {
    const text = el.textContent;
    el.setAttribute('aria-label', text);
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

      const setOpen = (item, open) => {
        const btn = $('[data-faq-btn]', item);
        const panel = $('[data-faq-panel]', item);
        if (!btn || !panel) return;
        item.classList.toggle('is-open', open);
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        panel.setAttribute('data-open', open ? 'true' : 'false');
        if (open) panel.removeAttribute('inert'); else panel.setAttribute('inert', '');
      };

      items.forEach((item) => {
        const btn = $('[data-faq-btn]', item);
        const panel = $('[data-faq-panel]', item);
        if (!btn || !panel) return;

        // Startzustand aus dem HTML uebernehmen (kein Aufklappen beim Laden).
        setOpen(item, item.hasAttribute('data-faq-open'));
        root.classList.add('is-ready'); // erst jetzt darf CSS geschlossene Panels einklappen

        panel.addEventListener('transitionend', (e) => {
          if (e.target === panel && e.propertyName === 'grid-template-rows') notify();
        });

        btn.addEventListener('click', () => {
          const open = btn.getAttribute('aria-expanded') !== 'true';
          if (open && single) items.forEach((other) => { if (other !== item) setOpen(other, false); });
          setOpen(item, open);
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

  /* ---------- 3. Smooth Scroll (Lenis) ---------- */
  let lenis = null;
  if (motion && hasLenis && !isTouch) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const scrollToTarget = (target, offset = 0) => {
    if (lenis) {
      lenis.scrollTo(target, { offset, duration: 1.4, easing: (t) => 1 - Math.pow(1 - t, 4) });
    } else {
      const top = target.getBoundingClientRect().top + window.scrollY + offset;
      window.scrollTo({ top, behavior: motionOff() ? 'auto' : 'smooth' });
    }
  };

  /* ---------- 4. Nav: Scrolled-State + Section-Theme ---------- */
  const nav = $('[data-nav]');
  const themedSections = $$('[data-nav-theme]');
  const applyTheme = (theme) => {
    if (!nav) return;
    nav.classList.toggle('is-dark', theme === 'dark');
    setThemeColor(THEME[theme] || THEME.light);
  };
  const onScrollNav = () => {
    if (!nav) return;
    nav.classList.toggle('is-scrolled', window.scrollY > 40);
  };
  onScrollNav();
  window.addEventListener('scroll', onScrollNav, { passive: true });

  if (hasGSAP) {
    themedSections.forEach((sec) => {
      ScrollTrigger.create({
        trigger: sec,
        start: 'top 56px',
        end: 'bottom 56px',
        onToggle: (self) => { if (self.isActive) { applyTheme(sec.dataset.navTheme); if (sec.hasAttribute('data-hero')) setThemeColor(THEME.hero); } },
      });
    });
  } else {
    const fallbackTheme = () => {
      const y = 56;
      const hit = themedSections.find((s) => { const r = s.getBoundingClientRect(); return r.top <= y && r.bottom > y; });
      if (hit) applyTheme(hit.dataset.navTheme);
    };
    fallbackTheme();
    window.addEventListener('scroll', fallbackTheme, { passive: true });
  }

  /* ---------- 5. Fullscreen-Menü ---------- */
  const menu = $('[data-menu]');
  const menuToggle = $('[data-menu-toggle]');
  const menuLabel = $('[data-menu-label]');
  const menuLinks = $$('[data-menu-link]');
  const main = $('#main');
  let menuOpen = false;
  let lastFocus = null;

  const focusables = () => $$('a[href], button, [tabindex]:not([tabindex="-1"])', menu).filter((el) => el.offsetParent !== null || el === document.activeElement);

  const openMenu = () => {
    if (!menu || menuOpen) return;
    menuOpen = true;
    lastFocus = document.activeElement;
    menu.classList.add('is-open');
    menu.setAttribute('aria-hidden', 'false');
    body.classList.add('menu-open');
    menuToggle.setAttribute('aria-expanded', 'true');
    menuToggle.setAttribute('aria-label', 'Menü schließen');
    if (menuLabel) menuLabel.textContent = 'Schließen';
    if (main) main.setAttribute('inert', '');
    lenis?.stop();
    if (motion) {
      gsap.fromTo(menuLinks, { y: 32, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.045, duration: 0.55, delay: 0.18, ease: 'expo.out', overwrite: true });
      const art = $('[data-menu-art]'); const foot = $('[data-menu-foot]');
      if (art) gsap.fromTo(art, { scale: 1.06, autoAlpha: 0 }, { scale: 1, autoAlpha: 0.9, duration: 0.8, delay: 0.25, ease: 'expo.out', overwrite: true });
      if (foot) gsap.fromTo(foot, { y: 14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, delay: 0.4, ease: 'expo.out', overwrite: true });
    }
    setTimeout(() => menuLinks[0]?.focus(), 250);
  };
  const closeMenu = () => {
    if (!menu || !menuOpen) return;
    menuOpen = false;
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden', 'true');
    body.classList.remove('menu-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Menü öffnen');
    if (menuLabel) menuLabel.textContent = 'Menü';
    if (main) main.removeAttribute('inert');
    lenis?.start();
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  };
  menuToggle?.addEventListener('click', () => (menuOpen ? closeMenu() : openMenu()));
  document.addEventListener('keydown', (e) => {
    if (!menuOpen) return;
    if (e.key === 'Escape') { e.preventDefault(); closeMenu(); return; }
    if (e.key === 'Tab') {
      const f = focusables(); if (!f.length) return;
      const first = f[0]; const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // Anker-Links (Menü, Buttons, Footer)
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const go = () => scrollToTarget(target);
      if (menuOpen) { closeMenu(); setTimeout(go, 300); } else go();
    });
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
    const chars = heroEls.words.flatMap(splitChars);
    gsap.set(chars, { yPercent: 110 });
    gsap.set([heroEls.eyebrow, heroEls.sub, heroEls.caption, heroEls.scroll, nav, '[data-hero-actions]', '[data-hero-card]'], { autoAlpha: 0 });
    gsap.set(heroEls.art, { autoAlpha: 0, scale: 1.08, transformOrigin: '50% 100%' });
    gsap.set(heroEls.disc, { autoAlpha: 0, scale: 0.7 });

    const heroIntro = () => new Promise((resolve) => {
      gsap.timeline({ defaults: { ease: 'power4.out' }, onComplete: resolve })
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
      const seen = sessionStorage.getItem('fk-seen') === '1';
      sessionStorage.setItem('fk-seen', '1');
      body.classList.add('is-loading');
      lenis?.stop();
      const count = $('[data-preloader-count]', preloader);
      const rule = $('[data-preloader-rule]', preloader);
      const words = $$('.preloader__word', preloader);
      const counter = { v: 0 };
      const tl = gsap.timeline({
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

    introDone = runPreloader().then(heroIntro);
  } else if (preloader) {
    preloader.classList.add('is-done');
  }

  /* ---------- 7. Scroll-Module (nur mit Motion) ---------- */
  if (motion) {
    const mm = gsap.matchMedia();

    mm.add({ isDesktop: '(min-width: 900px)', isMobile: '(max-width: 899px)' }, (ctx) => {
      const { isDesktop } = ctx.conditions;
      const scrub = isTouch ? true : 0.8;

      /* 7a. Hero-Scrub: Full-Bleed-Rahmen wird zur Karte (nach dem Intro erstellt) */
      introDone.then(() => ctx.add(() => {
        if (!hero) return;
        if (isDesktop) {
          gsap.timeline({
            scrollTrigger: {
              trigger: hero, start: 'top top', end: '+=110%', pin: true, scrub, anticipatePin: 1, invalidateOnRefresh: true,
              onUpdate: (self) => hero.classList.toggle('is-framed', self.progress > 0.45),
            },
          })
            .fromTo(heroEls.frame, { scale: 1, borderRadius: 0 }, { scale: 0.76, borderRadius: 36, ease: 'power1.inOut' }, 0)
            .fromTo(heroEls.content, { yPercent: 0, autoAlpha: 1 }, { yPercent: -40, autoAlpha: 0, ease: 'power1.in', immediateRender: false }, 0)
            .fromTo(heroEls.scroll, { autoAlpha: 1 }, { autoAlpha: 0, immediateRender: false }, 0)
            .fromTo(heroEls.art, { yPercent: 0 }, { yPercent: -6, ease: 'none' }, 0)
            .fromTo(heroEls.disc, { yPercent: 0 }, { yPercent: 18, ease: 'none' }, 0)
            .fromTo(hero, { backgroundColor: '#F6F3EC' }, { backgroundColor: '#DCEAF7', ease: 'none' }, 0);
        } else {
          gsap.to(heroEls.content, {
            yPercent: -30, autoAlpha: 0, ease: 'none',
            scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom 40%', scrub: true },
          });
          gsap.to(heroEls.art, { yPercent: 12, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
        }
      }));

      /* 7b. Text-Reveals */
      $$('[data-reveal]').forEach((el) => {
        const type = el.dataset.reveal;
        const st = { trigger: el, start: 'top 88%', once: true, onEnter: () => el.classList.add('is-in') };
        if (type === 'words') {
          const words = splitWords(el);
          gsap.from(words, { yPercent: 110, duration: 1, stagger: 0.035, ease: 'power4.out', scrollTrigger: { ...st, start: 'top 85%' } });
        } else if (type === 'lines') {
          const lines = $$('.line', el);
          gsap.fromTo(lines, { clipPath: 'inset(0 0 100% 0)', y: 24 }, { clipPath: 'inset(0 0 0% 0)', y: 0, duration: 1.2, stagger: 0.16, ease: 'power4.out', scrollTrigger: st });
        } else if (type === 'figure') {
          gsap.from(el, { y: 50, scale: 0.97, autoAlpha: 0, duration: 1.3, ease: 'power3.out', scrollTrigger: st });
        } else {
          gsap.from(el, { y: 28, autoAlpha: 0, duration: 1, ease: 'power3.out', scrollTrigger: st });
        }
      });

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
        const tl = gsap.to(vTrack, {
          x: () => -dist(), ease: 'none',
          scrollTrigger: { trigger: ventures, start: 'top top', end: () => `+=${dist()}`, pin: true, scrub, anticipatePin: 1, invalidateOnRefresh: true },
        });
        $$('[data-ventures-card]', vTrack).forEach((card, i) => {
          gsap.from(card, {
            y: 60, autoAlpha: 0, duration: 1, ease: 'power3.out',
            scrollTrigger: { trigger: card, containerAnimation: tl, start: 'left 95%', once: true },
          });
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

          /* Cursor */
          const cur = $('[data-cursor]');
          if (cur) {
            doc.classList.add('cursor-on');
            const dot = $('.cursor__dot', cur); const ring = $('.cursor__ring', cur);
            const dx = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3.out' });
            const dy = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3.out' });
            const rx = gsap.quickTo(ring, 'x', { duration: 0.35, ease: 'power3.out' });
            const ry = gsap.quickTo(ring, 'y', { duration: 0.35, ease: 'power3.out' });
            window.addEventListener('pointermove', (e) => { dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); }, { passive: true });
            document.addEventListener('pointerover', (e) => { cur.classList.toggle('is-hover', !!e.target.closest('a, button, .card, .glass')); });
            document.addEventListener('mouseleave', () => gsap.to(cur, { autoAlpha: 0, duration: 0.2 }));
            document.addEventListener('mouseenter', () => gsap.to(cur, { autoAlpha: 1, duration: 0.2 }));
          }
        }
      }

      /* Hintergrund-Temperatur folgt den Sections */
      const BG = { paper: '#F6F3EC', sky: '#E4EEF8' };
      $$('[data-bg]').forEach((sec) => {
        ScrollTrigger.create({
          trigger: sec, start: 'top 60%', end: 'bottom 60%',
          onToggle: (self) => { if (self.isActive) gsap.to(body, { backgroundColor: BG[sec.dataset.bg] || BG.paper, duration: 0.9, ease: 'power2.out', overwrite: 'auto' }); },
        });
      });

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
    });

    /* ---------- 8. Refresh nach späten Loads ---------- */
    const refresh = debounce(() => { ScrollTrigger.refresh(); lenis?.resize(); }, 200);
    window.addEventListener('load', refresh);
    document.fonts?.ready.then(refresh);
    $$('img').forEach((img) => { if (!img.complete) img.addEventListener('load', refresh, { once: true }); });
    window.addEventListener('resize', refresh);
    introDone.then(refresh);
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
