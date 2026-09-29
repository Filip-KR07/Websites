/* fx/wert — Die Rechnung.
   Eine Waage erzählt die Geschichte: links liegt die Investition, rechts fallen
   mit dem Scrollen Münzen in die Schale, bis der Balken kippt.
   Der Scroll-Fortschritt (gescrubbt) entscheidet, WAS in den Schalen liegt.
   WIE sich der Balken bewegt, rechnet eine kleine Feder-Simulation aus: so
   schwingt die Waage nach, wenn etwas landet, und bleibt jederzeit unterbrechbar.
   Ohne Motion bleibt der Endzustand aus wert.css stehen. */
(() => {
  'use strict';
  if (!window.FK) return;

  window.FK.register('wert', (FK) => {
    const sec = FK.$('#wert');
    if (!sec || !FK.motion) return;

    const { $, $$ } = FK;
    const q = (s) => $(s, sec);
    const el = {
      pin: q('[data-wert-pin]'), scale: q('[data-wert-scale]'), beam: q('[data-wert-beam]'),
      panL: q('[data-wert-pan="l"]'), panR: q('[data-wert-pan="r"]'),
      shL: q('[data-wert-shadow="l"]'), shR: q('[data-wert-shadow="r"]'),
      block: q('[data-wert-block]'), coins: $$('[data-wert-coin]', sec), labels: $$('[data-wert-label]', sec),
      glint: q('[data-wert-glint]'), ring: q('[data-wert-ring]'), night: q('[data-wert-night]'),
      flash: q('[data-wert-flash]'), verdict: q('[data-wert-verdict]'),
      tens: q('[data-wert-tens]'), ones: q('[data-wert-ones]'), month: q('[data-wert-month]'),
      stepList: q('[data-wert-steps]'), steps: $$('[data-wert-step]', sec), cta: q('[data-wert-cta]'),
      ledger: q('.waage__ledger'),
    };
    if (!el.pin || !el.scale || !el.beam || !el.panL || !el.panR || !el.block) return;

    // Geometrie in Einheiten der Waage (1000 x 800), siehe wert.css
    const R = 330;               // Drehpunkt bis Aufhängung
    const PAN_W = 260, PAN_H = 330, SHADOW_W = 240, COIN = 50, BLOCK_H = 150;
    const PAN_TOP = 250;         // Aufhängung in der Waage
    const TH_MIN = -14, TH_MAX = 9, TH_STOP = 18; // Grad
    const RAD = Math.PI / 180;

    // Feder für den Balken: etwas unterdämpft, wie eine echte Waage
    const PERIOD = 1.25, ZETA = 0.3;
    const W0 = (2 * Math.PI) / PERIOD;
    const KICK_COIN = 11, KICK_BLOCK = 46; // Grad pro Sekunde beim Aufprall

    const CFG = {
      desk: {
        n: 12, block: 0.03,
        coins: [0.34, 0.46, 0.5, 0.54, 0.575, 0.61, 0.64, 0.675, 0.72, 0.76, 0.8, 0.85],
        labels: [0, 1, 3, 5, 8, 11], // Münze je Eintrag im Kassenbuch
        steps: [0.012, 0.22, 0.44, 0.655], month: [0.02, 0.92], night: [0.17, 0.33, 0.48],
      },
      mob: {
        n: 6, block: 0.04,
        coins: [0.3, 0.46, 0.56, 0.66, 0.75, 0.84],
        labels: [0, 1, 2, 3, 4, 5],
        month: [0.03, 0.92], night: [0.14, 0.3, 0.46],
      },
    };

    // Fallhöhe je Münze in Prozent ihrer eigenen Höhe (Start knapp über der Waage)
    const coinFall = el.coins.map((c) => {
      const topUnits = (parseFloat(c.style.top) || 0) * (PAN_H / 100);
      return ((PAN_TOP + topUnits + 70) / COIN) * 100;
    });
    const coinRot = el.coins.map((c) => parseFloat(c.style.getPropertyValue('--r')) || 0);
    const BLOCK_FALL = ((PAN_TOP + 116 + 60) / BLOCK_H) * 100;
    const labelIn = el.labels.map((li) => li.firstElementChild);
    const labelDot = labelIn.map((s) => s && s.firstElementChild);
    const flashRings = el.flash ? $$('i', el.flash) : [];
    const flashGlow = el.flash ? $('b', el.flash) : null;

    const fix = (v) => v.toFixed(3);
    const render = (th) => {
      const dx = R * (1 - Math.cos(th * RAD));
      const dy = R * Math.sin(th * RAD); // > 0: rechte Schale unten
      el.beam.style.transform = `rotate(${fix(th)}deg)`;
      el.panL.style.transform = `translate3d(${fix((dx / PAN_W) * 100)}%,${fix((-dy / PAN_H) * 100)}%,0)`;
      el.panR.style.transform = `translate3d(${fix((-dx / PAN_W) * 100)}%,${fix((dy / PAN_H) * 100)}%,0)`;
      if (el.shL && el.shR) {
        // Näher am Boden: kleiner und dunkler
        const kl = -dy / 80, kr = dy / 80;
        el.shL.style.transform = `translate3d(${fix((dx / SHADOW_W) * 100)}%,0,0) scale(${fix(1 - kl * 0.1)})`;
        el.shR.style.transform = `translate3d(${fix((-dx / SHADOW_W) * 100)}%,0,0) scale(${fix(1 - kr * 0.1)})`;
        el.shL.style.opacity = fix(0.6 + kl * 0.28);
        el.shR.style.opacity = fix(0.6 + kr * 0.28);
      }
    };

    // Rollziffern: meist ruhig, gegen Ende jedes Monats rollt die Ziffer weiter
    const renderMonth = (v) => {
      const whole = Math.floor(v);
      const fr = v - whole;
      const e = fr < 0.7 ? 0 : ((t) => t * t * (3 - 2 * t))((fr - 0.7) / 0.3);
      const vs = Math.min(12, whole + e);
      if (el.ones) el.ones.style.transform = `translate3d(0,${fix((-vs / 13) * 100)}%,0)`;
      if (el.tens) el.tens.style.transform = `translate3d(0,${fix((-Math.min(1, Math.max(0, vs - 9)) / 2) * 100)}%,0)`;
    };

    const mm = gsap.matchMedia();
    mm.add({ isDesktop: '(min-width: 900px)', isMobile: '(max-width: 899px)' }, (ctx) => {
      const { isDesktop } = ctx.conditions;
      const cfg = isDesktop ? CFG.desk : CFG.mob;
      const scrub = FK.isTouch ? true : 0.8;
      const coins = el.coins.slice(0, cfg.n);
      const labelOf = new Map(cfg.labels.map((ci, k) => [ci, k]));
      const tipN = Math.floor((-TH_MIN * cfg.n) / (TH_MAX - TH_MIN)) + 1; // erste Münzzahl mit Übergewicht rechts

      const st = { th: 0, w: 0, target: 0, visible: false, dirty: false };
      const want = { block: false, coin: coins.map(() => false) };
      const onPan = coins.map(() => false);
      let blockOn = false;
      let tipped = false;
      const coinTl = [];
      const labelTw = [];
      let blockTl = null;
      let verdictTw = null;
      let litRaf = 0;
      let dropClock = 0;
      let live = true; // nach dem Aufräumen dürfen späte Rückrufe nichts mehr anfassen
      const DROP_GAP = 0.09;

      /* ---------- Physik ---------- */
      const thetaFor = (n) => TH_MIN + ((TH_MAX - TH_MIN) * n) / cfg.n;
      const count = () => onPan.reduce((a, b) => a + (b ? 1 : 0), 0);
      const updateTarget = () => {
        const n = count();
        st.target = blockOn ? thetaFor(n) : (n ? TH_MAX : 0);
      };

      const tick = (time, deltaMs) => {
        const dt = Math.min(deltaMs / 1000, 0.05) / 2;
        for (let i = 0; i < 2; i++) {
          const a = -W0 * W0 * (st.th - st.target) - 2 * ZETA * W0 * st.w;
          st.w += a * dt;
          st.th += st.w * dt;
          if (st.th > TH_STOP) { st.th = TH_STOP; st.w *= -0.35; }
          else if (st.th < -TH_STOP) { st.th = -TH_STOP; st.w *= -0.35; }
        }
        // Leises Atmen, max. ±0,6°
        const sway = 0.42 * Math.sin(time * 1.7) + 0.16 * Math.sin(time * 2.9 + 1.3);
        render(st.th + sway);
      };

      const setVisible = (on) => {
        if (on && !live) return;
        if (on === st.visible) return;
        st.visible = on;
        if (on) {
          // Was sich außerhalb des Bildes geändert hat, steht schon still
          if (st.dirty) { st.th = st.target; st.w = 0; st.dirty = false; }
          gsap.ticker.add(tick);
        } else {
          gsap.ticker.remove(tick);
        }
      };

      /* ---------- Kassenbuch + Kipp-Moment ---------- */
      const showLabel = (k, instant) => {
        const inner = labelIn[k];
        if (!inner) return;
        labelTw[k]?.kill();
        if (instant) { gsap.set(inner, { yPercent: 0 }); gsap.set(labelDot[k], { scale: 1 }); return; }
        labelTw[k] = gsap.timeline()
          .to(inner, { yPercent: 0, duration: 0.7, ease: 'expo.out' }, 0)
          .fromTo(labelDot[k], { scale: 0.3 }, { scale: 1, duration: 0.55, ease: 'back.out(3)' }, 0.08);
      };
      const hideLabel = (k, instant) => {
        const inner = labelIn[k];
        if (!inner) return;
        labelTw[k]?.kill();
        if (instant) { gsap.set(inner, { yPercent: 115 }); return; }
        labelTw[k] = gsap.to(inner, { yPercent: 115, duration: 0.3, ease: 'power2.out' });
      };

      const lightCta = () => {
        const btn = el.cta && $('.btn', el.cta);
        if (!btn) return;
        btn.classList.remove('is-lit');
        cancelAnimationFrame(litRaf);
        litRaf = requestAnimationFrame(() => { litRaf = requestAnimationFrame(() => btn.classList.add('is-lit')); });
      };

      const flash = () => {
        if (!flashRings.length) return;
        gsap.fromTo(flashRings, { scale: 0.35, autoAlpha: 0.95 }, { scale: 2.9, autoAlpha: 0, duration: 1.4, ease: 'expo.out', stagger: 0.16, overwrite: true });
        if (flashGlow) {
          gsap.fromTo(flashGlow, { autoAlpha: 0, scale: 0.6 }, {
            keyframes: [{ autoAlpha: 1, scale: 1, duration: 0.22, ease: 'power2.out' }, { autoAlpha: 0, duration: 0.9, ease: 'power2.inOut' }],
            overwrite: true,
          });
        }
      };

      const checkTip = (instant) => {
        const on = blockOn && count() >= tipN;
        if (on === tipped) return;
        tipped = on;
        verdictTw?.kill();
        if (!el.verdict) return;
        if (on) {
          if (instant) { gsap.set(el.verdict, { autoAlpha: 1, yPercent: 0, scale: 1 }); return; }
          verdictTw = gsap.fromTo(el.verdict, { autoAlpha: 0, yPercent: 40, scale: 0.94 }, { autoAlpha: 1, yPercent: 0, scale: 1, duration: 0.9, delay: 0.12, ease: 'expo.out' });
          flash();
          lightCta();
        } else {
          verdictTw = instant ? gsap.set(el.verdict, { autoAlpha: 0 }) : gsap.to(el.verdict, { autoAlpha: 0, yPercent: 25, duration: 0.3, ease: 'power2.out' });
        }
      };

      /* ---------- Münzen ---------- */
      const glint = (i) => {
        if (!el.glint) return;
        const c = coins[i];
        el.glint.style.left = `calc(${c.style.left} + 0.6%)`;
        el.glint.style.top = `calc(${c.style.top} - 1.5%)`;
        gsap.fromTo(el.glint, { autoAlpha: 1, scale: 0.3, rotation: -30 }, { autoAlpha: 0, scale: 1.25, rotation: 25, duration: 0.6, ease: 'power2.out', overwrite: true });
      };

      const land = (i, instant) => {
        if (!live || onPan[i]) return;
        onPan[i] = true;
        updateTarget();
        if (instant) st.dirty = true;
        else { st.w += KICK_COIN; if (labelOf.has(i)) glint(i); }
        if (labelOf.has(i)) showLabel(labelOf.get(i), instant);
        checkTip(instant);
      };
      const unland = (i, instant) => {
        if (!onPan[i]) return;
        onPan[i] = false;
        updateTarget();
        if (instant) st.dirty = true;
        if (labelOf.has(i)) hideLabel(labelOf.get(i), instant);
        checkTip(instant);
      };

      const dropCoin = (i, instant) => {
        const c = coins[i];
        coinTl[i]?.kill();
        if (instant) {
          gsap.set(c, { yPercent: 0, rotation: coinRot[i], rotationY: 0, scaleX: 1, scaleY: 1, autoAlpha: 1 });
          land(i, true);
          return;
        }
        const hidden = gsap.getProperty(c, 'autoAlpha') < 0.05;
        const from = hidden ? -coinFall[i] : gsap.getProperty(c, 'yPercent');
        const k = Math.sqrt(Math.max(0.03, -from / coinFall[i])); // Fallzeit wächst mit der Wurzel der Höhe
        const fall = 0.58 * k;
        const spin = i % 2 ? 1 : -1;
        // Bei schnellem Scrollen fallen sie trotzdem nacheinander
        const now = gsap.ticker.time;
        const delay = Math.max(0, dropClock - now);
        dropClock = now + delay + DROP_GAP;
        coinTl[i] = gsap.timeline({ delay })
          .set(c, { yPercent: from, transformPerspective: 320 })
          .to(c, { autoAlpha: 1, duration: 0.12, ease: 'none' }, 0)
          .to(c, { yPercent: 0, duration: fall, ease: 'power2.in' }, 0) // freier Fall: quadratisch
          .fromTo(c, { rotation: coinRot[i] + spin * 70, rotationY: 0 }, { rotation: coinRot[i], rotationY: 720, duration: fall, ease: 'power1.out' }, 0)
          .add(() => land(i, false), fall)
          .to(c, { scaleY: 0.84, scaleX: 1.1, duration: 0.07, ease: 'power2.out' }, fall)
          .to(c, { scaleY: 1, scaleX: 1, duration: 0.45, ease: 'elastic.out(1, 0.45)' }, fall + 0.07)
          .to(c, { yPercent: -18, duration: 0.12, ease: 'power2.out' }, fall)
          .to(c, { yPercent: 0, duration: 0.12, ease: 'power2.in' }, fall + 0.12)
          .to(c, { yPercent: -4, duration: 0.06, ease: 'power2.out' }, fall + 0.24)
          .to(c, { yPercent: 0, duration: 0.06, ease: 'power2.in' }, fall + 0.3)
          .set(c, { rotationY: 0, transformPerspective: 0 });
      };

      const liftCoin = (i, instant) => {
        const c = coins[i];
        coinTl[i]?.kill();
        unland(i, instant);
        if (instant) { gsap.set(c, { yPercent: -coinFall[i], autoAlpha: 0, rotationY: 0, scaleX: 1, scaleY: 1 }); return; }
        // zurück, woher sie kam: nach oben
        coinTl[i] = gsap.to(c, { yPercent: -coinFall[i] * 0.3, autoAlpha: 0, scaleX: 1, scaleY: 1, rotationY: 0, transformPerspective: 0, duration: 0.34, ease: 'power2.out' });
      };

      /* ---------- Marmorblock ---------- */
      const dropBlock = (instant) => {
        blockTl?.kill();
        if (instant) {
          gsap.set(el.block, { yPercent: 0, autoAlpha: 1 });
          if (!blockOn) { blockOn = true; updateTarget(); st.dirty = true; }
          return;
        }
        const hidden = gsap.getProperty(el.block, 'autoAlpha') < 0.05;
        const from = hidden ? -BLOCK_FALL : gsap.getProperty(el.block, 'yPercent');
        const fall = 0.62 * Math.sqrt(Math.max(0.03, -from / BLOCK_FALL));
        blockTl = gsap.timeline()
          .set(el.block, { yPercent: from })
          .to(el.block, { autoAlpha: 1, duration: 0.14, ease: 'none' }, 0)
          .to(el.block, { yPercent: 0, duration: fall, ease: 'power2.in' }, 0)
          .add(() => {
            if (!live || blockOn) return;
            blockOn = true; updateTarget(); st.w -= KICK_BLOCK; checkTip(false);
          }, fall)
          .to(el.block, { yPercent: -3.5, duration: 0.1, ease: 'power2.out' }, fall)
          .to(el.block, { yPercent: 0, duration: 0.12, ease: 'power2.in' }, fall + 0.1);
      };
      const liftBlock = (instant) => {
        blockTl?.kill();
        if (blockOn) { blockOn = false; updateTarget(); if (instant) st.dirty = true; checkTip(instant); }
        if (instant) { gsap.set(el.block, { yPercent: -BLOCK_FALL, autoAlpha: 0 }); return; }
        blockTl = gsap.to(el.block, { yPercent: -BLOCK_FALL * 0.3, autoAlpha: 0, duration: 0.36, ease: 'power2.out' });
      };

      // Scroll-Fortschritt -> was liegt in den Schalen
      const sync = (p) => {
        // Beim Neumessen spult ScrollTrigger die Timeline kurz auf 0 zurück, das ist kein Scrollen
        if (!live || ScrollTrigger.isRefreshing) return;
        const instant = !st.visible;
        const wb = p >= cfg.block;
        if (wb !== want.block) { want.block = wb; if (wb) dropBlock(instant); else liftBlock(instant); }
        for (let i = 0; i < coins.length; i++) {
          const w = p >= cfg.coins[i];
          if (w === want.coin[i]) continue;
          want.coin[i] = w;
          if (w) dropCoin(i, instant); else liftCoin(i, instant);
        }
      };

      /* ---------- Startzustand (nur mit Motion, zur Laufzeit) ---------- */
      el.coins.forEach((c, i) => gsap.set(c, { yPercent: -coinFall[i], rotation: coinRot[i], autoAlpha: 0 }));
      gsap.set(el.block, { yPercent: -BLOCK_FALL, autoAlpha: 0 });
      gsap.set(labelIn, { yPercent: 115 });
      if (el.verdict) gsap.set(el.verdict, { autoAlpha: 0 });
      if (el.glint) gsap.set(el.glint, { autoAlpha: 0 });
      render(0);
      const mo = { v: 1 };
      renderMonth(1);

      /* ---------- Gescrubbte Timeline ---------- */
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        onUpdate: () => sync(tl.progress()),
        scrollTrigger: isDesktop
          ? { trigger: el.pin, start: 'top top', end: '+=180%', pin: true, scrub, invalidateOnRefresh: true }
          : { trigger: el.scale, start: 'top 62%', end: 'bottom 22%', scrub, invalidateOnRefresh: true },
      });
      tl.to({}, { duration: 1 }, 0);
      const resync = () => sync(tl.progress());
      ScrollTrigger.addEventListener('refresh', resync);

      const [n0, n1, n2] = cfg.night;
      if (el.ring) {
        tl.fromTo(el.ring, { rotation: 0 }, { rotation: 180, duration: n1, ease: 'sine.inOut' }, 0)
          .to(el.ring, { rotation: 360, duration: 1 - n1, ease: 'sine.inOut' }, n1);
      }
      if (el.night) {
        tl.fromTo(el.night, { opacity: 0 }, { opacity: 0.95, duration: n1 - n0, ease: 'sine.inOut' }, n0)
          .to(el.night, { opacity: 0, duration: n2 - n1, ease: 'sine.inOut' }, n1);
      }
      const [m0, m1] = cfg.month;
      tl.fromTo(mo, { v: 1 }, { v: 12, duration: m1 - m0, onUpdate: () => renderMonth(mo.v) }, m0);

      if (isDesktop) {
        // Sanfter Kamera-Schub über den ganzen Pin
        tl.fromTo(el.scale, { scale: 0.965 }, { scale: 1.025, duration: 1 }, 0);

        // Die vier Sätze: Zeile für Zeile, aktive Zeile voll, erledigte leiser
        el.steps.forEach((li, i) => {
          const text = $('.waage__step-text', li);
          const bar = $('.waage__step-bar', li);
          const t0 = cfg.steps[i];
          const t1 = cfg.steps[i + 1] ?? 0.94;
          if (text) tl.fromTo(text, { yPercent: 115 }, { yPercent: 0, duration: 0.05, ease: 'power3.out' }, t0);
          if (bar) tl.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: t1 - t0 }, t0);
          if (i) tl.to(el.steps[i - 1], { opacity: 0.66, duration: 0.03 }, t0);
        });

        // Anflug vor dem Pin: Waage steigt auf, Spalten laufen ein
        const pre = { trigger: el.pin, start: 'top bottom', end: 'top top', scrub, invalidateOnRefresh: true };
        gsap.fromTo(el.scale, { yPercent: 10 }, { yPercent: 0, ease: 'none', scrollTrigger: pre });
        const cols = [el.month, el.stepList, el.cta, el.ledger].filter(Boolean);
        gsap.fromTo(cols, { y: 56, opacity: 0 }, {
          y: 0, opacity: 1, ease: 'power2.out', stagger: 0.12,
          scrollTrigger: { trigger: el.pin, start: 'top 88%', end: 'top 20%', scrub, invalidateOnRefresh: true },
        });
      } else {
        // Handy: Sätze erscheinen einzeln beim Hereinscrollen
        el.steps.forEach((li) => {
          const text = $('.waage__step-text', li);
          const bar = $('.waage__step-bar', li);
          const st2 = { trigger: li, start: 'top 90%', once: true };
          if (text) gsap.fromTo(text, { yPercent: 115 }, { yPercent: 0, duration: 0.9, ease: 'expo.out', scrollTrigger: st2 });
          if (bar) gsap.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: 1.2, delay: 0.1, ease: 'expo.out', scrollTrigger: { ...st2 } });
        });
        // Überzählige Münzen gibt es auf dem Handy nicht
        gsap.set(el.coins.slice(cfg.n), { autoAlpha: 0 });
      }

      // Simulation nur, solange die Waage im Bild ist. Zuletzt messen, damit der
      // Pin-Abstand dieses Abschnitts schon in der Höhe steckt.
      ScrollTrigger.create({
        trigger: isDesktop ? sec : el.scale, start: 'top bottom', end: 'bottom top', refreshPriority: -1,
        onToggle: (self) => setVisible(self.isActive),
      });

      return () => {
        live = false;
        ScrollTrigger.removeEventListener('refresh', resync);
        setVisible(false);
        cancelAnimationFrame(litRaf);
        [...coinTl, ...labelTw, blockTl, verdictTw].forEach((t) => t && t.kill());
        gsap.killTweensOf([...flashRings, flashGlow, el.glint].filter(Boolean));
        const touched = [el.beam, el.panL, el.panR, el.shL, el.shR, el.block, el.glint, el.verdict, el.tens, el.ones,
          ...el.coins, ...labelIn, ...labelDot, ...flashRings, flashGlow].filter(Boolean);
        gsap.set(touched, { clearProps: 'transform,opacity,visibility' });
        if (el.glint) { el.glint.style.left = ''; el.glint.style.top = ''; }
        $('.btn', el.cta || sec)?.classList.remove('is-lit');
      };
    });
  });
})();
