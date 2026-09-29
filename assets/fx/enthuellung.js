/* fx/enthuellung — Enthüllungen und horizontale Verschiebungen
   1. Intro: Vorhang von unten, Bild skaliert gegen, Goldrahmen + Bildunterschrift gleiten ein,
      Kennzahlen bekommen gezeichnete Linien, Text und Bild laufen gegeneinander (Parallaxe).
   2. Projekte: Karten neigen sich mit dem Scroll-Tempo, Bilder wandern im horizontalen Lauf,
      Clip-Reveal beim Hereinkommen. Der horizontale Pin selbst gehört main.js (7f).
   3. Werte: Zeilen schieben sich von wechselnden Seiten herein, Linien ziehen sich durch,
      der Lorbeerkranz dreht sich langsam mit.
   4. Jetzt: Die Status-Karte kippt in 3D auf, ihre Zeilen folgen gestaffelt.
   Ohne Motion passiert hier nichts: der CSS-Zustand ist der Endzustand. */
(() => {
  'use strict';
  if (!window.FK) return;

  // Kurven der Tokens (style.css :root) als Ease-Funktion für GSAP
  const bezier = (x1, y1, x2, y2) => {
    const cx = 3 * x1; const bx = 3 * (x2 - x1) - cx; const ax = 1 - cx - bx;
    const cy = 3 * y1; const by = 3 * (y2 - y1) - cy; const ay = 1 - cy - by;
    const fx = (t) => ((ax * t + bx) * t + cx) * t;
    const fy = (t) => ((ay * t + by) * t + cy) * t;
    const dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
    const solve = (x) => {
      let t = x;
      for (let i = 0; i < 6; i++) {
        const e = fx(t) - x;
        if (Math.abs(e) < 1e-5) return t;
        const d = dx(t);
        if (Math.abs(d) < 1e-6) break;
        t -= e / d;
      }
      let lo = 0; let hi = 1; t = x;
      for (let i = 0; i < 30 && hi - lo > 1e-6; i++) {
        if (fx(t) < x) lo = t; else hi = t;
        t = (lo + hi) / 2;
      }
      return t;
    };
    return (p) => (p <= 0 ? 0 : (p >= 1 ? 1 : fy(solve(p))));
  };
  const EASE = {
    out: bezier(0.23, 1, 0.32, 1),       // --ease-out
    inOut: bezier(0.77, 0, 0.175, 1),    // --ease-in-out
    drawer: bezier(0.32, 0.72, 0, 1),    // --ease-drawer
  };

  window.FK.register('enthuellung', (FK) => {
    const { $, $$, motion, isTouch } = FK;
    if (!motion) return;
    const scrub = isTouch ? true : 0.8;
    const vw = () => window.innerWidth;

    /* ---------- 1. Intro ---------- */
    const intro = (isDesktop) => {
      const sec = $('#intro');
      if (!sec) return;
      const text = $('.intro__text', sec);
      const fig = $('.intro__figure', sec);
      const portrait = $('.intro__portrait', sec);
      const img = portrait && $('img', portrait);
      const frame = $('.intro__frame', sec);
      const edge = $('.intro__edge', sec);
      const laurel = $('.intro__laurel', sec);
      const cap = $('.intro__caption', sec);

      if (fig && portrait && img) {
        // Vorhang: Oberkante von 135 % auf 0; seitlich und unten Luft für den Schatten
        const clip = (top) => `inset(${top}% -15% -35% -15%)`;
        const tl = gsap.timeline({
          paused: true,
          onComplete: () => {
            gsap.set(portrait, { clearProps: 'clipPath' });
            gsap.set(img, { clearProps: 'willChange' });
          },
        });
        // Erst liegt der Goldrahmen, dann hebt sich der Vorhang, zuletzt Lorbeer und Bildunterschrift
        if (frame) tl.fromTo(frame, { x: 16, y: 16, autoAlpha: 0 }, { x: 0, y: 0, autoAlpha: 1, duration: 1.2, ease: EASE.out }, 0);
        tl.fromTo(portrait, { clipPath: clip(135) }, { clipPath: clip(0), duration: 1.6, ease: EASE.inOut }, 0.25)
          .fromTo(img, { scale: 1.3, transformOrigin: '50% 60%', willChange: 'transform' }, { scale: 1, duration: 2.2, ease: EASE.out }, 0.4);
        if (edge) {
          tl.fromTo(edge, { yPercent: 135 }, { yPercent: 0, duration: 1.6, ease: EASE.inOut }, 0.25)
            .fromTo(edge, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25, ease: 'none' }, 0.6)
            .to(edge, { autoAlpha: 0, duration: 0.45, ease: 'none' }, 1.6);
        }
        if (laurel) tl.fromTo(laurel, { autoAlpha: 0, x: -18, rotate: -14, transformOrigin: '8% 85%' }, { autoAlpha: 0.85, x: 0, rotate: 0, duration: 1.4, ease: EASE.out }, 1.0);
        if (cap) tl.fromTo(cap, { opacity: 0, x: -22 }, { opacity: 1, x: 0, duration: 1.1, ease: EASE.out }, 1.25);
        ScrollTrigger.create({ trigger: fig, start: 'top 72%', once: true, onEnter: () => tl.play() });
      }

      // Kennzahlen: Oberlinie, Zahlen, Unterstreichungen
      const stats = $('.stats', sec);
      if (stats) {
        const rule = $('.stats__rule', stats);
        const tl = gsap.timeline({ paused: true });
        if (rule) tl.fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: 1.4, ease: EASE.inOut }, 0);
        tl.fromTo($$('.stat__num', stats), { yPercent: 55, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.1, ease: EASE.out, stagger: 0.12 }, 0.25)
          .fromTo($$('.stat__label', stats), { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: EASE.out, stagger: 0.12 }, 0.45)
          .fromTo($$('.stat__rule', stats), { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: EASE.inOut, stagger: 0.14 }, 0.55);
        ScrollTrigger.create({ trigger: stats, start: 'top 86%', once: true, onEnter: () => tl.play() });
      }

      // Text und Bild laufen gegeneinander (nur nebeneinander, also Desktop)
      if (isDesktop && fig && text) {
        const st = () => ({ trigger: sec, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true });
        gsap.fromTo(text, { y: -40 }, { y: 40, ease: 'none', scrollTrigger: st() });
        gsap.fromTo(fig, { y: 40 }, { y: -40, ease: 'none', scrollTrigger: st() });
        if (laurel) gsap.fromTo(laurel, { yPercent: 35 }, { yPercent: -45, ease: 'none', scrollTrigger: st() });
      }
    };

    /* ---------- 2. Projekte ---------- */
    const projekte = (isDesktop, ctx) => {
      const sec = $('#projekte');
      const track = sec && $('[data-ventures-track]', sec);
      if (!track) return;
      const cards = $$('.card', track);
      const items = $$('[data-ventures-card]', track)
        .map((card) => ({ card, media: $('.card__media', card), plx: $('.card__plx', card) }))
        .filter((it) => it.media && it.plx);
      if (!items.length) return;

      // Horizontaler Tween aus main.js (7f), nur Desktop
      const pinST = isDesktop ? ScrollTrigger.getAll().find((st) => st.pin && st.trigger === sec) : null;
      const hTween = pinST && pinST.animation;

      if (!hTween) {
        // Mobil: Bilder öffnen sich von unten, gestaffelt
        const tl = gsap.timeline({ paused: true })
          .fromTo(items.map((it) => it.media), { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: EASE.drawer, stagger: 0.12 }, 0.12)
          .fromTo(items.map((it) => it.plx), { scale: 1.16 }, { scale: 1, duration: 1.6, ease: EASE.out, stagger: 0.12 }, 0.12);
        ScrollTrigger.create({ trigger: track, start: 'top 82%', once: true, onEnter: () => tl.play() });
        return;
      }

      // Clip-Reveal je Karte: Bild rollt von rechts herein, in Laufrichtung
      const reveals = items.map((it) => gsap.timeline({ paused: true })
        .fromTo(it.media, { clipPath: 'inset(0% 0% 0% 100%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: EASE.drawer }, 0)
        .fromTo(it.plx, { scale: 1.22 }, { scale: 1, duration: 1.7, ease: EASE.out }, 0));
      const started = new Set();
      const reveal = (i, delay = 0) => {
        if (started.has(i)) return;
        started.add(i);
        if (delay) ctx.add(() => gsap.delayedCall(delay, () => reveals[i].play()));
        else reveals[i].play();
      };

      // Welche Karten stehen beim Pin-Start schon im Bild? Gemessen bei jedem Refresh.
      let visibleAtStart = [];
      const measure = () => {
        const w = vw();
        visibleAtStart = items.map((it) => it.card.offsetLeft - track.offsetLeft < w * 0.9);
      };
      measure();
      ScrollTrigger.create({
        trigger: sec, start: 'top 70%', onRefresh: measure,
        onEnter: () => { let n = 0; items.forEach((_, i) => { if (visibleAtStart[i]) reveal(i, 0.1 * n++); }); },
      });

      items.forEach((it, i) => {
        // Übrige Karten beim Hereinlaufen
        ScrollTrigger.create({ trigger: it.card, containerAnimation: hTween, start: 'left 88%', onEnter: () => reveal(i) });
        // Bild wandert langsamer als die Karte (Tiefe)
        gsap.fromTo(it.plx, { xPercent: -10 }, {
          xPercent: 10, ease: 'none',
          scrollTrigger: { trigger: it.card, containerAnimation: hTween, start: 'left right', end: 'right left', scrub: true, invalidateOnRefresh: true },
        });
      });

      // Neigung nach Scroll-Tempo, weich zurück auf 0
      const clampSkew = gsap.utils.clamp(-6, 6);
      const skewTo = cards.map((c, i) => gsap.quickTo(c, 'skewX', { duration: 0.5 + i * 0.06, ease: 'power3.out' }));
      const setSkew = (v) => skewTo.forEach((fn) => fn(v));
      const settle = gsap.delayedCall(0.12, () => setSkew(0)).pause();
      ScrollTrigger.create({
        trigger: sec, start: 'top top', end: () => `+=${Math.max(0, track.scrollWidth - vw())}`, invalidateOnRefresh: true,
        onUpdate: (self) => { setSkew(clampSkew(self.getVelocity() / 260)); settle.restart(true); },
        onToggle: (self) => { if (!self.isActive) setSkew(0); },
      });
    };

    /* ---------- 3. Werte ---------- */
    const werte = (isDesktop) => {
      const sec = $('#werte');
      if (!sec) return;
      const shift = isDesktop ? 0.25 : 0.16;

      $$('.wert', sec).forEach((row, i) => {
        const dir = i % 2 ? 1 : -1;   // I und III von links, II von rechts
        const num = $('.wert__num', row);
        const p = $('p', row);
        const tl = gsap.timeline({
          defaults: { ease: 'none', duration: 1 },
          scrollTrigger: { trigger: row, start: 'top 96%', end: 'top 50%', scrub, invalidateOnRefresh: true },
        });
        tl.fromTo(row, { x: () => dir * vw() * shift }, { x: 0, ease: 'power2.out' }, 0)
          .fromTo(row, { opacity: 0.3 }, { opacity: 1, duration: 0.55 }, 0);
        if (num) tl.fromTo(num, { x: () => dir * vw() * (isDesktop ? 0.09 : 0.05) }, { x: 0, ease: 'power3.out' }, 0);
        if (p) tl.fromTo(p, { x: () => dir * vw() * (isDesktop ? 0.04 : 0.02) }, { x: 0, ease: 'power2.out' }, 0);
        // Linie bleibt stehen (Gegenbewegung zur Zeile) und zieht sich durch
        $$('.wert__line', row).forEach((ln) => {
          const end = ln.classList.contains('wert__line--end');
          tl.fromTo(ln, { x: () => -dir * vw() * shift }, { x: 0, ease: 'power2.out' }, 0)
            .fromTo(ln, { scaleX: 0 }, { scaleX: 1, ease: 'power1.inOut', duration: end ? 0.7 : 0.85 }, end ? 0.3 : 0.12);
        });
      });

      const laurel = $('.werte__laurel', sec);
      if (laurel) {
        gsap.fromTo(laurel, { rotate: -24, yPercent: -8 }, {
          rotate: 36, yPercent: 8, ease: 'none',
          scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true },
        });
      }
    };

    /* ---------- 4. Jetzt ---------- */
    const jetzt = () => {
      const sec = $('#jetzt');
      const card = sec && $('.jetzt__card', sec);
      if (!card) return;
      // Karte richtet sich auf: gekippt nach hinten, von unten
      // Auslöser ist das Raster: die gekippte Karte selbst hätte eine verschobene Box
      const grid = card.parentElement;
      gsap.timeline({ scrollTrigger: { trigger: grid, start: 'top 98%', end: 'top 52%', scrub, invalidateOnRefresh: true } })
        .fromTo(card, { rotateX: 25, y: 80, transformPerspective: 1100, transformOrigin: '50% 100%' }, { rotateX: 0, y: 0, ease: 'power2.out', duration: 1 }, 0)
        .fromTo(card, { opacity: 0 }, { opacity: 1, ease: 'none', duration: 0.45 }, 0);

      // Inhalt folgt gestaffelt; Zeilen schieben sich seitlich ein
      const head = [$('.jetzt__status', card), $('.jetzt__focus', card)].filter(Boolean);
      const rows = $$('.jetzt__row', card);
      const tail = [$('.jetzt__tags', card), $('.jetzt__cta', card)].filter(Boolean);
      const tl = gsap.timeline({ paused: true, defaults: { duration: 0.9, ease: EASE.out } })
        .fromTo(head, { y: 18, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.08 }, 0)
        .fromTo(rows, { x: -26, opacity: 0 }, { x: 0, opacity: 1, stagger: 0.07 }, 0.16)
        .fromTo(tail, { y: 14, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.08 }, 0.5);
      ScrollTrigger.create({ trigger: grid, start: 'top 78%', once: true, onEnter: () => tl.play() });
    };

    gsap.matchMedia().add({ isDesktop: '(min-width: 900px)', isMobile: '(max-width: 899px)' }, (ctx) => {
      const { isDesktop } = ctx.conditions;
      intro(isDesktop);
      projekte(isDesktop, ctx);
      werte(isDesktop);
      jetzt();
      // Der Hero-Pin (main.js 7a) entsteht erst nach dem Intro und landet hinten in der
      // Trigger-Liste. Danach neu sortieren, sonst liegt alles darunter um seine Pin-Länge daneben.
      FK.introDone.then(() => requestAnimationFrame(() => { ScrollTrigger.sort(); ScrollTrigger.refresh(); }));
    });
  });
})();
