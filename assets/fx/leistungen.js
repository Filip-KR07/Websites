/* fx/leistungen — Säulen als Kartenstapel, Arbeitsweise als Zählwerk.
   Desktop: gepinnter Stapel (jede Karte gleitet über die vorige) und ein
   sticky Zählwerk, das beim Schrittwechsel weiterrollt.
   Handy: sticky Stapel ohne Pin, je Schritt eigene Linie und Ziffer.
   Ohne Motion passiert hier nichts: CSS zeigt eine ruhige Liste. */
(() => {
  'use strict';
  if (!window.FK) return;

  const MQ = { isDesktop: '(min-width: 900px)', isMobile: '(max-width: 899px)' };

  /* ---------- Säulen ---------- */
  const pillars = (FK, scrub) => {
    const { $, $$ } = FK;
    const sec = $('#leistungen');
    const stage = sec && $('[data-pillars-stage]', sec);
    if (!stage) return;
    const cards = $$('[data-pillar]', sec).map((el) => ({
      el,
      num: $('[data-pillar-num]', el),
      art: $('[data-pillar-art]', el),
      body: $('[data-pillar-body]', el),
      shade: $('[data-pillar-shade]', el),
    }));
    const n = cards.length;
    if (n < 2) return;
    const dots = $$('[data-pillars-dot]', sec);
    const fill = $('[data-pillars-fill]', sec);
    const word = $('[data-pillars-word]', sec);

    // Leere Marken im Fluss: sticky Karten taugen nicht als Messpunkt
    const marks = cards.map(({ el }) => {
      const m = document.createElement('span');
      m.className = 'pillar__mark';
      m.setAttribute('aria-hidden', 'true');
      el.before(m);
      return m;
    });

    let active = -1;
    const setActive = (i) => {
      if (i === active) return;
      active = i;
      cards.forEach(({ el }, k) => {
        el.classList.toggle('is-active', k === i);
        el.classList.toggle('is-in', k === i); // Glanz-Sweep der Glas-Karte
      });
      dots.forEach((d, k) => d.classList.toggle('is-active', k === i));
    };

    const desktop = () => {
      // Zeitachse: kurzes Halten, dann je Karte Einflug + Halten
      const PRE = 0.3; const MOVE = 1; const HOLD = 0.45;
      const at = (i) => PRE + (i - 1) * (MOVE + HOLD);
      const total = at(n - 1) + MOVE + HOLD;
      const pinLen = () => Math.round(window.innerHeight * 2.7);
      const setFill = fill ? gsap.quickSetter(fill, 'scaleY') : () => {};
      let on = false;

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: stage, start: 'top top', end: () => '+=' + pinLen(),
          pin: true, scrub, anticipatePin: 1, invalidateOnRefresh: true,
          refreshPriority: 0, // schaltet das Sortieren nach Position bei jedem Refresh ein
        },
      });

      // Tiefe d im Stapel: etwas höher, kleiner, dunkler
      const depth = (d) => ({ yPercent: -5.5 * d, scale: 1 - 0.075 * d });
      const shade = [0, 0.3, 0.5, 0.64];

      cards.forEach((c, i) => {
        gsap.set(c.el, { transformPerspective: 1800, transformOrigin: '50% 0%' });
        const t0 = i === 0 ? 0 : at(i);
        const life = total - t0;
        // Einflug von unten, leicht gekippt, landet flach auf dem Stapel
        if (i > 0) {
          tl.fromTo(c.el, { yPercent: 122, rotationX: 16, scale: 1 }, { yPercent: 0, rotationX: 0, duration: MOVE, ease: 'power2.out' }, t0)
            .fromTo(c.body, { y: 90 }, { y: 0, duration: MOVE * 0.9, ease: 'power3.out' }, t0 + MOVE * 0.1);
        }
        // Parallaxe innen: Ziffer bleibt zurück, Fragment treibt und dreht
        tl.fromTo(c.num, { yPercent: i === 0 ? -6 : -34 }, { yPercent: 16, duration: life }, t0)
          .fromTo(c.art, { yPercent: i === 0 ? 4 : 30, rotation: i === 0 ? -3 : -12 }, { yPercent: -16, rotation: 9, duration: life }, t0);
        // Jede spätere Karte schiebt diese eine Ebene tiefer (feste Start- und Zielwerte)
        for (let j = i + 1; j < n; j++) {
          const d = j - i;
          tl.fromTo(c.el, depth(d - 1), { ...depth(d), duration: MOVE, ease: 'power1.inOut', immediateRender: false }, at(j))
            .fromTo(c.shade, { opacity: shade[d - 1] }, { opacity: shade[Math.min(d, 3)], duration: MOVE, ease: 'power1.inOut', immediateRender: false }, at(j));
        }
      });

      // Welche Karte liegt oben? (aus der geglätteten Zeitachse, nicht aus dem Scroll)
      const sync = () => {
        setFill(tl.progress());
        if (!on) return;
        const t = tl.time();
        let i = 0;
        for (let k = 1; k < n; k++) if (t >= at(k) + MOVE * 0.62) i = k;
        setActive(i);
      };
      tl.eventCallback('onUpdate', sync);
      setFill(0);

      // Erste Karte wird aktiv, sobald die Bühne ins Bild kommt
      ScrollTrigger.create({
        trigger: stage, start: 'top 62%',
        onEnter: () => { on = true; sync(); },
        onLeaveBack: () => { on = false; setActive(-1); },
      });

      // Wort hinter dem Stapel wandert über die ganze Strecke quer
      if (word) {
        gsap.fromTo(word, { xPercent: 18 }, {
          xPercent: -62, ease: 'none',
          scrollTrigger: { trigger: stage, start: 'top bottom', end: () => '+=' + (window.innerHeight + pinLen()), scrub: true, invalidateOnRefresh: true },
        });
      }
    };

    const mobile = () => {
      const stickTop = (el) => parseFloat(getComputedStyle(el).top) || 0;
      cards.forEach((c, i) => {
        // Goldlinie, sobald die Karte ins Bild kommt
        ScrollTrigger.create({
          trigger: marks[i], start: 'top 72%',
          onEnter: () => setActive(i), onLeaveBack: () => setActive(i - 1),
        });
        // Ziffer und Fragment kommen mit leichtem Versatz an
        gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: { trigger: marks[i], start: 'top bottom', end: () => 'top ' + stickTop(c.el) + 'px', scrub: true, invalidateOnRefresh: true },
        })
          .fromTo(c.num, { yPercent: 28 }, { yPercent: 0 }, 0)
          .fromTo(c.art, { yPercent: 18, rotation: -8 }, { yPercent: 0, rotation: 0 }, 0);
        // Die vorige Karte tritt zurück, während diese darüber gleitet
        if (i > 0) {
          const prev = cards[i - 1];
          gsap.timeline({
            defaults: { ease: 'none' },
            scrollTrigger: { trigger: marks[i], start: 'top bottom', end: () => 'top ' + stickTop(c.el) + 'px', scrub: true, invalidateOnRefresh: true },
          })
            .fromTo(prev.el, { scale: 1 }, { scale: 0.93 }, 0)
            .fromTo(prev.shade, { opacity: 0 }, { opacity: 0.3 }, 0);
        }
      });
    };

    gsap.matchMedia().add(MQ, (ctx) => {
      if (ctx.conditions.isDesktop) desktop(); else mobile();
      return () => { active = -2; setActive(-1); };
    });
  };

  /* ---------- Arbeitsweise ---------- */
  const steps = (FK) => {
    const { $, $$ } = FK;
    const sec = $('#arbeitsweise');
    if (!sec) return;
    const items = $$('[data-step]', sec);
    const n = items.length;
    if (!n) return;
    const wrap = $('[data-process-steps]', sec);
    const fill = $('[data-process-fill]', sec);
    const odo = $('[data-odo]', sec);
    const strip = $('[data-odo-strip]', sec);

    let cur = -2;
    const setStep = (i) => {
      i = Math.max(-1, Math.min(n - 1, i));
      if (i === cur) return;
      const first = cur === -2;
      cur = i;
      items.forEach((s, k) => {
        s.classList.toggle('is-active', k === i);
        s.classList.toggle('is-reached', k <= i);
      });
      // Zählwerk rollt zur nächsten Ziffer (unterbrechbar, startet vom aktuellen Wert)
      if (strip) {
        gsap.to(strip, {
          yPercent: (-100 * Math.max(0, i)) / n,
          duration: first ? 0 : 0.95, ease: 'power3.inOut', overwrite: true,
        });
      }
    };

    gsap.matchMedia().add(MQ, (ctx) => {
      if (ctx.conditions.isDesktop) {
        setStep(-1);
        // Schritt wird aktiv, wenn er die Bildschirmmitte passiert
        items.forEach((s, i) => {
          ScrollTrigger.create({
            trigger: s, start: 'top center',
            onEnter: () => setStep(i), onLeaveBack: () => setStep(i - 1),
          });
        });
        // Linie füllt sich genau bis zur Mitte
        if (fill && wrap) {
          gsap.fromTo(fill, { scaleY: 0 }, {
            scaleY: 1, ease: 'none',
            scrollTrigger: { trigger: wrap, start: 'top center', end: 'bottom center', scrub: true },
          });
        }
        // Zählwerk erscheint einmal mit der linken Spalte (Abschnitt als Messpunkt,
        // die Spalte selbst ist sticky)
        if (odo) {
          gsap.fromTo(odo, { y: 48, autoAlpha: 0 }, {
            y: 0, autoAlpha: 1, duration: 1.2, ease: 'power3.out',
            scrollTrigger: { trigger: sec, start: 'top 25%', once: true },
          });
        }
      } else {
        items.forEach((s) => {
          const line = $('.step__line i', s);
          const num = $('.step__num-in', s);
          const body = $('.step__body', s);
          if (line) {
            gsap.fromTo(line, { scaleY: 0 }, {
              scaleY: 1, ease: 'none',
              scrollTrigger: { trigger: s, start: 'top 72%', end: 'bottom 55%', scrub: true },
            });
          }
          if (num) {
            gsap.fromTo(num, { yPercent: 110 }, {
              yPercent: 0, duration: 0.9, ease: 'expo.out',
              scrollTrigger: { trigger: s, start: 'top 86%', toggleActions: 'play none none reverse' },
            });
          }
          if (body) {
            gsap.fromTo(body, { opacity: 0.35, y: 24 }, {
              opacity: 1, y: 0, ease: 'none',
              scrollTrigger: { trigger: s, start: 'top 90%', end: 'top 58%', scrub: true },
            });
          }
        });
      }
      return () => { cur = -2; items.forEach((s) => s.classList.remove('is-active', 'is-reached')); };
    });
  };

  FK.register('leistungen', (FK) => {
    if (!FK.motion) return;
    const scrub = FK.isTouch ? true : 0.6;
    pillars(FK, scrub);
    steps(FK);
  });
})();
