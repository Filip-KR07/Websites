/* fx/kontakt — Finale
   1. Kontakt: Nachtkreis waechst aus der Mitte (clip-path), Astrolabium dreht mit,
      Ueberschrift steigt Zeichen fuer Zeichen in 3D auf, feine Welle beim Hover.
   2. Footer: Vorhang – der Kontakt-Abschnitt gleitet weg, der Footer liegt darunter,
      die Signatur steigt auf und faechert sich auf.
   Ohne Motion bleibt alles im statischen Endzustand (CSS). */
(() => {
  'use strict';
  if (!window.FK) return;

  // Kubische Bezier-Kurve als GSAP-Ease – dieselben Kurven wie die CSS-Tokens
  const bezier = (x1, y1, x2, y2) => {
    const cx = 3 * x1; const bx = 3 * (x2 - x1) - cx; const ax = 1 - cx - bx;
    const cy = 3 * y1; const by = 3 * (y2 - y1) - cy; const ay = 1 - cy - by;
    const sx = (t) => ((ax * t + bx) * t + cx) * t;
    const sy = (t) => ((ay * t + by) * t + cy) * t;
    const dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
    const solve = (x) => {
      let t = x;
      for (let i = 0; i < 8; i++) {
        const e = sx(t) - x;
        if (Math.abs(e) < 1e-5) return t;
        const d = dx(t);
        if (Math.abs(d) < 1e-6) break;
        t -= e / d;
      }
      let lo = 0; let hi = 1; t = x;
      for (let i = 0; i < 30; i++) {
        const v = sx(t);
        if (Math.abs(v - x) < 1e-5) break;
        if (x > v) lo = t; else hi = t;
        t = (lo + hi) / 2;
      }
      return t;
    };
    return (p) => (p <= 0 ? 0 : p >= 1 ? 1 : sy(solve(p)));
  };
  const EASE = { out: bezier(0.23, 1, 0.32, 1), inOut: bezier(0.77, 0, 0.175, 1), drawer: bezier(0.32, 0.72, 0, 1) };
  // Verzoegerung im Ease statt in der Position: alle Scrub-Tweens starten bei 0 und
  // zeigen so auch nach einem Refresh sofort ihren Startzustand.
  const window01 = (from, span, ease) => (p) => ease(Math.min(1, Math.max(0, (p - from) / span)));

  // Woerter + Zeichen zerlegen, <em> bleibt erhalten; Volltext als aria-label
  const splitKeepEm = (el, label = true) => {
    if (el.dataset.kxSplit) return Array.from(el.querySelectorAll('.kx-ch'));
    const text = el.textContent.replace(/\s+/g, ' ').trim();
    const out = [];
    el.childNodes.forEach((node) => {
      const em = node.nodeType === Node.ELEMENT_NODE && node.tagName === 'EM';
      if (node.nodeType !== Node.TEXT_NODE && !em) return;
      node.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) { out.push(' '); return; }
        const chars = Array.from(part).map((c) => `<span class="kx-ch">${c}</span>`).join('');
        out.push(`<span class="kx-word" aria-hidden="true">${em ? `<em>${chars}</em>` : chars}</span>`);
      });
    });
    el.innerHTML = out.join('');
    if (label) el.setAttribute('aria-label', text);
    el.dataset.kxSplit = '1';
    return Array.from(el.querySelectorAll('.kx-ch'));
  };

  window.FK.register('kontakt', (FK) => {
    const { $, $$ } = FK;
    const sec = $('[data-kx]');
    if (!sec || !FK.motion) return;

    const stage = $('[data-kx-stage]', sec);
    const stars = $('[data-kx-stars]', sec);
    const astro = $('[data-kx-astro]', sec);
    const ringOuter = $('[data-kx-ring="outer"]', sec);
    const ringInner = $('[data-kx-ring="inner"]', sec);
    const inner = $('[data-kx-inner]', sec);
    const title = $('[data-kx-title]', sec);
    const ins = $$('[data-kx-in]', sec);
    const cta = $('[data-kx-cta]', sec);
    const chars = title ? splitKeepEm(title) : [];

    const foot = $('[data-kx-footer]');
    const curtain = foot && $('[data-kx-curtain]', foot);
    const shade = foot && $('[data-kx-shade]', foot);
    const rule = foot && $('[data-kx-rule]', foot);
    const mark = foot && $('[data-kx-mark]', foot);
    const markChars = mark ? splitKeepEm(mark, false) : []; // Signatur ist aria-hidden

    // Inhalt: Augenbraue, Zeichen in 3D, Text, Button, Rest
    const buildReveal = () => {
      const [eyebrow, lead, ...rest] = ins;
      return gsap.timeline()
        .to(eyebrow, { y: 0, opacity: 1, duration: 0.8, ease: EASE.out }, 0)
        .to(chars, { yPercent: 0, rotateX: 0, opacity: 1, duration: 1.2, ease: EASE.out, stagger: 0.03 }, 0.06)
        .to(lead, { y: 0, opacity: 1, duration: 0.9, ease: EASE.out }, 0.42)
        .to(cta, { y: 0, scale: 1, opacity: 1, duration: 1, ease: EASE.out }, 0.56)
        .to(rest, { y: 0, opacity: 1, duration: 0.8, ease: EASE.out, stagger: 0.08 }, 0.7);
    };

    const mm = gsap.matchMedia();
    mm.add({ isDesktop: '(min-width: 900px)', isMobile: '(max-width: 899px)' }, (ctx) => {
      const { isDesktop } = ctx.conditions;
      // Buehnen-Ebenen bewegen sich nur beim Hereinkommen; danach ruhen sie
      // (GSAP gibt die Ebenen dann frei, das spart beim Footer Kompositing).
      const enter = { trigger: sec, start: 'top bottom', end: 'bottom bottom', scrub: true };
      const openStage = () => { stage.style.clipPath = 'none'; };
      const cleanups = [];
      const on = (el, type, fn, opts) => { el.addEventListener(type, fn, opts); cleanups.push(() => el.removeEventListener(type, fn, opts)); };

      // Startzustaende (matchMedia setzt sie beim Wechsel sauber zurueck)
      gsap.set(chars, { yPercent: 70, rotateX: -95, opacity: 0, transformOrigin: '50% 100%', transformPerspective: 800 });
      gsap.set(ins, { y: 26, opacity: 0 });
      gsap.set(cta, { y: 34, scale: 0.94, opacity: 0 });

      // Ebenen der Buehne: Ringe gegenlaeufig, Sterne mit Tiefe
      gsap.fromTo(ringOuter, { rotate: -40 }, { rotate: 0, ease: 'none', scrollTrigger: enter });
      gsap.fromTo(ringInner, { rotate: 56 }, { rotate: 0, ease: 'none', scrollTrigger: enter });
      gsap.fromTo(stars, { yPercent: 9 }, { yPercent: 0, ease: 'none', scrollTrigger: enter });

      if (isDesktop) {
        // 1. Kreis waechst mit dem Scrollen aus der Mitte bis randlos (71 % = Ecke);
        //    ganz offen faellt der Clip weg
        gsap.fromTo(stage, { clipPath: 'circle(0% at 50% 50%)' }, {
          clipPath: 'circle(71% at 50% 50%)', ease: 'none',
          scrollTrigger: { ...enter, onLeave: openStage, onRefresh: (self) => { if (self.progress === 1) openStage(); } },
        });
        gsap.fromTo(astro, { scale: 1.4, rotate: -24 }, { scale: 1, rotate: 0, ease: 'none', scrollTrigger: enter });

        // 2. Inhalt spielt ab, sobald der Kreis die Mitte fuellt; rueckwaerts schneller
        const reveal = buildReveal().pause();
        ScrollTrigger.create({
          trigger: sec, start: 'top 42%', end: 'max',
          onEnter: () => reveal.timeScale(1).play(),
          onLeaveBack: () => reveal.timeScale(1.8).reverse(),
        });
        // Tastatur: Fokus im Abschnitt zeigt den Inhalt sofort
        on(sec, 'focusin', () => { if (reveal.progress() < 1) reveal.timeScale(2).play(); });

        // 3. Beim Verlassen eilt der Inhalt leicht voraus (Tiefe zum Footer)
        gsap.fromTo(inner, { y: 0 }, {
          y: () => -window.innerHeight * 0.1, ease: 'none',
          scrollTrigger: { trigger: sec, start: 'bottom bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true },
        });
      } else {
        // Mobil: kein Scrub fuer den Kreis – einmal abspielen, dann bleibt es dunkel
        gsap.set(stage, { clipPath: 'circle(0% at 50% 38%)' });
        gsap.set(astro, { scale: 1.3, rotate: -16 });
        const tl = gsap.timeline({ paused: true })
          .to(stage, { clipPath: 'circle(110% at 50% 38%)', duration: 1.5, ease: EASE.drawer, onComplete: openStage }, 0)
          .to(astro, { scale: 1, rotate: 0, duration: 1.9, ease: EASE.out }, 0)
          .add(buildReveal(), 0.5);
        ScrollTrigger.create({ trigger: sec, start: 'top 72%', end: 'max', once: true, onEnter: () => tl.play() });
        on(sec, 'focusin', () => { if (tl.progress() < 1) tl.timeScale(2).play(); });
      }

      // Footer: Vorhang + Signatur. Waehrend des Aufstiegs endet der Clip genau an
      // der Goldlinie (Rule sitzt .25em ueber der Unterkante = 22.7 %), am Schluss
      // oeffnet er sich fuer die Unterlaenge des p.
      const CLIP_LINE = 'inset(-25% -6% 22.7% -6%)';
      const CLIP_OPEN = 'inset(-25% -6% 0% -6%)';
      if (curtain) {
        if (isDesktop) {
          // Zeichen starten zur Mitte gerafft und faechern sich auf (Masse beim Refresh)
          const spread = (el) => (mark.offsetWidth / 2 - (el.offsetLeft + el.offsetWidth / 2)) * 0.3;
          const mid = (markChars.length - 1) / 2;
          const ftl = gsap.timeline({ scrollTrigger: { trigger: foot, start: 'top bottom', end: 'bottom bottom', scrub: true, invalidateOnRefresh: true } })
            .fromTo(curtain, { yPercent: -100 }, { yPercent: 0, ease: 'none', duration: 1 }, 0)
            .fromTo(shade, { opacity: 1 }, { opacity: 0.35, ease: 'none', duration: 1 }, 0)
            .fromTo(rule, { scaleX: 0 }, { scaleX: 1, ease: window01(0.06, 0.5, EASE.inOut), duration: 1 }, 0)
            .fromTo(mark, { clipPath: CLIP_LINE }, { clipPath: CLIP_OPEN, ease: window01(0.72, 0.26, EASE.out), duration: 1 }, 0);
          // Von der Mitte nach aussen: aufsteigen und auffaechern
          markChars.forEach((ch, i) => {
            const from = 0.36 + Math.abs(i - mid) * 0.03;
            const span = Math.min(0.5, 0.98 - from);
            ftl.fromTo(ch, { yPercent: 120, x: () => spread(ch), rotate: i % 2 ? 5 : -5 }, {
              yPercent: 0, x: 0, rotate: 0, ease: window01(from, span, EASE.out), duration: 1,
            }, 0);
          });
        } else {
          // Mobil: Signatur steigt einmal auf
          gsap.set(markChars, { yPercent: 120 });
          gsap.set(rule, { scaleX: 0 });
          gsap.set(mark, { clipPath: CLIP_LINE });
          const ftl = gsap.timeline({ paused: true })
            .to(rule, { scaleX: 1, duration: 1.1, ease: EASE.inOut }, 0)
            .to(markChars, { yPercent: 0, duration: 1.1, ease: EASE.out, stagger: 0.04 }, 0.15)
            .to(mark, { clipPath: CLIP_OPEN, duration: 0.6, ease: EASE.out }, 1.1);
          ScrollTrigger.create({ trigger: foot, start: 'top 90%', end: 'max', once: true, onEnter: () => ftl.play() });
        }
      }

      // Feine Welle ueber der Ueberschrift (nur Maus, nur transform)
      const cleanup = () => cleanups.forEach((fn) => fn());
      const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
      if (!isDesktop || FK.isTouch || !fine || !title) return cleanup;
      const setY = chars.map((c) => gsap.quickTo(c, 'y', { duration: 0.55, ease: 'power3.out' }));
      let centers = []; let amp = 0; let sigma = 1;
      const measure = () => {
        const fs = parseFloat(getComputedStyle(title).fontSize) || 100;
        amp = fs * 0.085; sigma = fs * 0.6;
        centers = chars.map((c) => { const r = c.getBoundingClientRect(); return r.left + r.width / 2; });
      };
      const onMove = (e) => {
        if (!centers.length) measure();
        for (let i = 0; i < chars.length; i++) {
          const d = (e.clientX - centers[i]) / sigma;
          setY[i](-amp * Math.exp(-d * d));
        }
      };
      const onLeave = () => { setY.forEach((s) => s(0)); centers = []; };
      on(title, 'pointerenter', measure);
      on(title, 'pointermove', onMove, { passive: true });
      on(title, 'pointerleave', onLeave);
      return cleanup;
    });
  });
})();
