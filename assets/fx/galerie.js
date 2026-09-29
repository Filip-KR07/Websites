/* fx/galerie — Grid-Zoom
   Desktop: Abschnitt pinnt, ein Bild fuellt den Viewport und schrumpft in die
   Mitte der Collage, die anderen fliegen von aussen herein. Mobil: Snap-Streifen
   mit Clip-Reveal. Ohne Motion bleibt die fertige Collage stehen. */
(() => {
  'use strict';
  if (!window.FK) return;

  FK.register('galerie', (FK) => {
    const { $, $$ } = FK;
    const section = $('[data-fx-galerie]');
    if (!section) return;
    const strip = $('[data-galerie-strip]', section);
    const tiles = $$('[data-galerie-tile]', section);
    const center = $('[data-galerie-center]', section);
    const title = $('[data-galerie-title]', section);
    const eyebrow = $('[data-galerie-eyebrow]', section);
    const quote = $('[data-galerie-quote]', section);
    const now = $('[data-galerie-now]', section);
    const bars = $$('[data-galerie-meter] i', section);
    if (!strip || !tiles.length || !center) return;

    /* Mobil-Streifen: Zaehler (auch ohne Motion). Per Tastatur erreichbar sind die Bilder selbst (tabindex im HTML) */
    if ('IntersectionObserver' in window && now) {
      const ratios = new Map();
      let active = -1;
      const setActive = (i) => {
        if (i === active) return;
        active = i;
        now.textContent = String(i + 1).padStart(2, '0');
        bars.forEach((b, k) => b.classList.toggle('is-on', k === i));
      };
      setActive(0);
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => ratios.set(e.target, e.intersectionRatio));
        const last = tiles.length - 1;
        if ((ratios.get(tiles[last]) || 0) > 0.98) { setActive(last); return; }
        let best = 0, bestR = -1;
        tiles.forEach((t, i) => { const r = ratios.get(t) || 0; if (r > bestR + 0.02) { best = i; bestR = r; } });
        setActive(best);
      }, { root: strip, threshold: [0, 0.25, 0.5, 0.75, 0.99] });
      tiles.forEach((t) => io.observe(t));
    }

    if (!FK.motion) return;
    section.classList.add('is-fx');

    const inners = tiles.map((t) => $('[data-galerie-inner]', t));
    const caps = tiles.map((t) => $('.galerie__cap', t));
    const frames = tiles.map((t) => $('.galerie__frame', t));
    const ghost = $('[data-galerie-ghost] span', section);
    const ring = $('[data-galerie-ring]', section);
    const words = FK.splitWords(title);

    /* Ueberschrift + Zitat: eigene kurze Timelines, vor- und zurueckspielbar */
    // Nur Deckkraft (kein visibility:hidden), damit Screenreader den Text immer finden
    const headTimeline = () => gsap.timeline({ paused: true })
      .fromTo(eyebrow, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, 0)
      .fromTo(words, { yPercent: 110 }, { yPercent: 0, duration: 1, stagger: 0.05, ease: 'power4.out' }, 0.05);
    const quoteTimeline = (from) => gsap.timeline({ paused: true })
      .fromTo(quote, { opacity: 0, ...from }, { opacity: 1, x: 0, y: 0, duration: 1, ease: 'power3.out' }, 0);

    const mm = gsap.matchMedia();
    mm.add({ isDesktop: '(min-width: 900px)', isMobile: '(max-width: 899px)' }, (ctx) => {
      const { isDesktop } = ctx.conditions;
      const scrub = FK.isTouch ? true : 0.8;

      if (isDesktop) {
        /* Geometrie relativ zur Viewport-Mitte des gepinnten Abschnitts.
           offset* ignoriert Transforms, gelesen wird nur beim Refresh. */
        const rel = (el) => {
          let x = 0, y = 0, n = el;
          while (n && n !== section) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
          return { x, y };
        };
        const box = (el) => {
          const p = rel(el);
          const w = el.offsetWidth, h = el.offsetHeight;
          return { cx: p.x + w / 2 - section.clientWidth / 2, cy: p.y + h / 2 - section.clientHeight / 2, w, h };
        };

        /* Zoom wahrnehmungsgleich: Skala logarithmisch, Verlauf weich */
        let zoomS = 1;
        const cover = () => {
          const b = box(center);
          zoomS = Math.max(section.clientWidth / b.w, section.clientHeight / b.h) * 1.04;
          return zoomS;
        };
        const inOut = gsap.parseEase('power1.inOut');
        const zoomEase = (t) => {
          const g = inOut(t);
          return zoomS > 1.001 ? (Math.pow(zoomS, 1 - g) - zoomS) / (1 - zoomS) : g;
        };

        /* Anflug: Richtung (Grad), Drehung, Tiefe (Startskala), Einsatz */
        const FLY = [
          { a: 190, r: -9, d: 1.18, at: 0.1 },  // 1 von links
          { a: -96, r: 6, d: 0.86, at: 0.04 },  // 2 von oben
          { a: -12, r: 11, d: 1.26, at: 0.16 }, // 3 von rechts
          { a: 94, r: -7, d: 0.9, at: 0.07 },   // 5 von unten
          { a: 28, r: 8, d: 1.12, at: 0.2 },    // 6 von rechts unten
        ];
        const offscreen = (el, c) => {
          const b = box(el);
          const W = section.clientWidth / 2, H = section.clientHeight / 2;
          const rad = (c.a * Math.PI) / 180, dx = Math.cos(rad), dy = Math.sin(rad);
          const r = (Math.hypot(b.w, b.h) / 2) * c.d + 40;
          const need = (p, d, half) => (Math.abs(d) < 1e-3 ? Infinity : (half + r - Math.sign(d) * p) / Math.abs(d));
          const t = Math.min(need(b.cx, dx, W), need(b.cy, dy, H));
          return { x: dx * t, y: dy * t };
        };

        const headTl = headTimeline();
        const quoteTl = quoteTimeline({ x: 56 });
        let headOn = false, quoteOn = false, settled = false;
        const textState = (p) => {
          // Etiketten erst, wenn die Collage steht (vorher waere das Mittelbild riesig)
          if (settled !== p >= 0.64) { settled = !settled; section.classList.toggle('is-settled', settled); }
          if (!headOn && p >= 0.64) { headOn = true; eyebrow.classList.add('is-in'); headTl.timeScale(1).play(); }
          else if (headOn && p < 0.52) { headOn = false; eyebrow.classList.remove('is-in'); headTl.timeScale(1.8).reverse(); }
          if (!quoteOn && p >= 0.8) { quoteOn = true; quote.classList.add('is-in'); quoteTl.timeScale(1).play(); }
          else if (quoteOn && p < 0.7) { quoteOn = false; quote.classList.remove('is-in'); quoteTl.timeScale(1.8).reverse(); }
        };

        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: section, start: 'top top', end: '+=150%',
            pin: true, scrub, invalidateOnRefresh: true,
            // refreshPriority schaltet das Sortieren bei jedem Refresh ein: der Hero-Pin
            // entsteht erst nach dem Intro, ohne Sortierung starten alle spaeteren Pins zu frueh
            refreshPriority: 0,
          },
          // Beim Neumessen spult ScrollTrigger kurz auf 0: das ist kein Scrollen, danach neu anwenden
          onUpdate() { if (!ScrollTrigger.isRefreshing) textState(this.progress()); },
        });
        const reapply = () => textState(tl.progress());
        ScrollTrigger.addEventListener('refresh', reapply);

        /* Tastatur: wer ein Bild fokussiert, landet bei der fertigen Collage (wie data-land) */
        const land = parseFloat(section.dataset.land) || 0.85;
        const settle = (e) => {
          if (tl.progress() >= 0.64 || !e.target.matches?.(':focus-visible')) return;
          const st = tl.scrollTrigger;
          const y = st.start + (st.end - st.start) * land;
          if (FK.lenis) FK.lenis.scrollTo(y, { duration: 1.1 });
          else window.scrollTo({ top: y, behavior: FK.motionOff() ? 'auto' : 'smooth' });
        };
        strip.addEventListener('focusin', settle);

        /* Mittleres Bild: vom Vollbild in die Mittelzelle, Bild innen zieht nach */
        const cInner = inners[tiles.indexOf(center)];
        tl.fromTo(center,
          { x: () => -box(center).cx, y: () => -box(center).cy, scale: cover },
          { x: 0, y: 0, scale: 1, duration: 0.62, ease: zoomEase }, 0)
          .fromTo(cInner, { scale: 1.25 }, { scale: 1, duration: 0.7, ease: 'power1.inOut' }, 0);

        /* Die anderen fuenf: aus verschiedenen Richtungen, nach Tiefe gestaffelt */
        tiles.filter((t) => t !== center).forEach((el, i) => {
          const c = FLY[i] || FLY[0];
          tl.fromTo(el,
            { x: () => offscreen(el, c).x, y: () => offscreen(el, c).y, rotation: c.r, scale: c.d },
            { x: 0, y: 0, rotation: 0, scale: 1, duration: 0.44, ease: 'power3.out' }, c.at)
            .fromTo(inners[tiles.indexOf(el)], { scale: 1.25 }, { scale: 1, duration: 0.5, ease: 'power2.out' }, c.at);
        });
        /* Goldrahmen legt sich um das Mittelbild, Schriftband zieht dahinter vorbei */
        if (ring) tl.fromTo(ring, { opacity: 0, scale: 1.08 }, { opacity: 1, scale: 1, duration: 0.2, ease: 'power2.out' }, 0.5);
        if (ghost) tl.fromTo(ghost, { xPercent: 4 }, { xPercent: -30, duration: 1 }, 0);
        tl.set({}, {}, 1);

        /* Beim Verlassen: leichte Tiefen-Parallaxe */
        const DRIFT = [-9, -4, -14, -3, -6, -11];
        const exit = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: { trigger: section.parentNode, start: 'bottom bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true, refreshPriority: -1 },
        });
        tiles.forEach((t, i) => exit.fromTo(t, { yPercent: 0 }, { yPercent: DRIFT[i] || -6 }, 0));
        return () => {
          ScrollTrigger.removeEventListener('refresh', reapply);
          strip.removeEventListener('focusin', settle);
          section.classList.remove('is-settled');
        };
      }

      /* Mobil: kein Pin. Ueberschrift, dann Clip-Reveal je Bild, dann Zitat */
      const headTl = headTimeline();
      ScrollTrigger.create({
        trigger: title, start: 'top 86%', once: true,
        onEnter: () => { eyebrow.classList.add('is-in'); headTl.play(); },
      });

      /* Clip-Reveal je Bild, sobald es im Streifen sichtbar wird */
      let io = null;
      if ('IntersectionObserver' in window) {
        gsap.set(frames, { clipPath: 'inset(100% 0% 0% 0%)' });
        gsap.set(inners, { scale: 1.3 });
        gsap.set(caps, { opacity: 0, y: 10 });
        const shown = new Set(), visible = new Set();
        let armed = false;
        const show = (i, delay) => {
          if (shown.has(i)) return;
          shown.add(i);
          ctx.add(() => {
            gsap.to(frames[i], { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: 'power4.out', delay });
            gsap.to(inners[i], { scale: 1.14, duration: 1.4, ease: 'power3.out', delay });
            gsap.to(caps[i], { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', delay: delay + 0.35 });
          });
        };
        io = new IntersectionObserver((entries) => {
          entries.forEach((e) => {
            const i = tiles.indexOf(e.target);
            if (e.isIntersecting) { visible.add(i); if (armed) show(i, 0); } else visible.delete(i);
          });
        }, { root: strip, threshold: 0.15 });
        tiles.forEach((t) => io.observe(t));
        ScrollTrigger.create({
          trigger: strip, start: 'top 84%', once: true,
          onEnter: () => { armed = true; [...visible].sort((a, b) => a - b).forEach((i, k) => show(i, k * 0.09)); },
        });
      } else {
        gsap.set(inners, { scale: 1.14 });
      }

      /* Beim Wischen wandert das Bild im Rahmen leicht mit. Eigener Scroll-Listener statt
         ScrollTrigger am Streifen: ein Refresh setzt so nie mitten im Wischen scrollLeft zurueck. */
      const setX = inners.map((n) => gsap.quickSetter(n, 'xPercent'));
      let geo = [], raf = 0;
      const drift = () => {
        raf = 0;
        const x = strip.scrollLeft;
        geo.forEach((g, i) => setX[i](-5 + 10 * gsap.utils.clamp(0, 1, (x + g.vw - g.l) / (g.vw + g.w))));
      };
      const measureStrip = () => {
        const sr = strip.getBoundingClientRect();
        geo = tiles.map((t) => { const r = t.getBoundingClientRect(); return { l: r.left - sr.left + strip.scrollLeft, w: r.width, vw: sr.width }; });
        drift();
      };
      const onStrip = () => { if (!raf) raf = requestAnimationFrame(drift); };
      measureStrip();
      strip.addEventListener('scroll', onStrip, { passive: true });
      const ro = 'ResizeObserver' in window ? new ResizeObserver(measureStrip) : null;
      ro?.observe(strip);

      const quoteTl = quoteTimeline({ y: 24 });
      ScrollTrigger.create({
        trigger: quote, start: 'top 90%', once: true,
        onEnter: () => { quote.classList.add('is-in'); quoteTl.play(); },
      });

      return () => {
        io?.disconnect();
        ro?.disconnect();
        strip.removeEventListener('scroll', onStrip);
        cancelAnimationFrame(raf);
        gsap.set(inners, { clearProps: 'transform' });
      };
    });
  });
})();
