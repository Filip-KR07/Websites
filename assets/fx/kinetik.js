/* fx/kinetik — Kinetische Typo im Lauftext-Band + Haltung als Fenster mit Wort-Scrub.
   Ohne Motion laeuft hier nichts: Zeilen stehen, Zitat ist voll sichtbar (siehe kinetik.css). */
(() => {
  'use strict';
  if (!window.FK) return;

  FK.register('kinetik', (FK) => {
    if (!FK.motion) return;
    const { $, $$ } = FK;
    const band = $('[data-kinetik]');
    const stage = $('[data-kin-statement]');
    const words = stage ? splitQuote($('[data-kin-quote]', stage)) : [];

    const mm = gsap.matchMedia();
    mm.add({ isDesktop: '(min-width: 900px)', isMobile: '(max-width: 899px)', isTall: '(min-height: 620px)' }, (ctx) => {
      const { isDesktop, isTall } = ctx.conditions;
      const stops = [];
      if (band) stops.push(kinetic(band, isDesktop, FK));
      if (stage && words.length) statement(stage, words, isDesktop && isTall, FK);
      return () => stops.forEach((fn) => fn());
    });
  });

  /* ---------- Zitat in Woerter zerlegen (Zeilen und <em> bleiben erhalten) ---------- */
  const splitQuote = (quote) => {
    if (!quote) return [];
    const label = quote.textContent.replace(/\s+/g, ' ').trim();
    const walker = document.createTreeWalker(quote, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    const out = [];
    nodes.forEach((node) => {
      if (!node.textContent.trim()) return;
      const frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
        const w = document.createElement('span');
        w.className = 'kin-w';
        w.textContent = part;
        frag.appendChild(w);
        out.push(w);
      });
      node.replaceWith(frag);
    });
    quote.setAttribute('aria-label', label);
    return out;
  };

  /* ---------- 1. Lauftext: zwei Zeilen, gegenlaeufig, Tempo + Neigung folgen dem Scrollen ---------- */
  const kinetic = (band, isDesktop, FK) => {
    const { $, $$ } = FK;
    const cfg = isDesktop
      ? { base: 70, boost: 0.5, maxBoost: 1400, spin: 16, spinK: 0.12, skewK: 0.0034, drift: 0.07 }
      : { base: 34, boost: 0.24, maxBoost: 480, spin: 10, spinK: 0.06, skewK: 0, drift: 0.05 };

    const rows = $$('[data-kin-row]', band).map((row, i) => {
      const track = $('[data-kin-track]', row);
      return {
        row, track, set: $('[data-kin-set]', track),
        sign: i % 2 ? 1 : -1, // Zeile 1 nach links, Zeile 2 nach rechts
        w: 1, pos: 0, ready: false, wrap: (v) => v,
        setX: gsap.quickSetter(track, 'x', 'px'),
        skewTo: cfg.skewK ? gsap.quickTo(track, 'skewX', { duration: 0.6, ease: 'power3.out' }) : null,
      };
    });
    if (!rows.length) return () => {};

    // Breite eines Satzes messen, genug Kopien fuer nahtloses Laufen anlegen (nur beim Refresh)
    const measure = () => {
      const vw = window.innerWidth;
      rows.forEach((r, i) => {
        const b = r.set.getBoundingClientRect();
        const sk = Math.abs(Math.tan(((gsap.getProperty(r.track, 'skewX') || 0) * Math.PI) / 180));
        r.w = Math.max(1, b.width - b.height * sk); // Neigung aus der Breite herausrechnen
        const need = Math.max(2, Math.ceil(vw / r.w) + 1);
        while (r.track.children.length < need) r.track.appendChild(r.set.cloneNode(true));
        r.wrap = gsap.utils.wrap(-r.w, 0);
        if (!r.ready) { r.pos = -r.w * (i ? 0.42 : 0.04); r.ready = true; } // Zeilen versetzt starten
        r.pos = r.wrap(r.pos);
        r.setX(r.pos);
      });
      // Sterne drehen per CSS-Animation im Compositor (kinetik.css), hier nur das Tempo
      stars = rows.flatMap((r) => $$('.kin__sep svg', r.track).flatMap((svg) => svg.getAnimations()));
      lastRate = NaN;
    };

    // Tempo + Richtung der Sterne: nur bei spürbarer Änderung nachstellen, nicht jedes Bild
    const SPIN_CSS = 16; // Grad pro Sekunde bei playbackRate 1 (22,5 s pro Umdrehung)
    let stars = []; let lastRate = NaN; let lastRateAt = 0;
    const setSpin = (rate, now) => {
      const flip = Math.sign(rate) !== Math.sign(lastRate);
      if (!flip && (Math.abs(rate - lastRate) < 0.05 * Math.max(1, Math.abs(lastRate)) || now - lastRateAt < 90)) return;
      lastRate = rate; lastRateAt = now;
      stars.forEach((a) => (a.updatePlaybackRate ? a.updatePlaybackRate(rate) : (a.playbackRate = rate)));
    };

    let vel = 0; let lastUpd = 0; let dir = 1;
    let vSm = 0; let dirSm = 1; let lastSkew = 0; let running = false;

    const tick = (time, dtMs) => {
      const dt = Math.min(dtMs, 50) / 1000; // nach Tab-Wechsel keinen Sprung
      const k = 1 - Math.exp(-dt * 7);
      vSm += ((performance.now() - lastUpd < 120 ? vel : 0) - vSm) * k;
      dirSm += (dir - dirSm) * (1 - Math.exp(-dt * 4.5)); // Richtungswechsel weich
      const speed = cfg.base + Math.min(Math.abs(vSm) * cfg.boost, cfg.maxBoost);
      setSpin(((cfg.spin + Math.min(Math.abs(vSm) * cfg.spinK, 520)) * dirSm) / SPIN_CSS, time * 1000);
      rows.forEach((r) => {
        r.pos = r.wrap(r.pos + speed * dirSm * r.sign * dt);
        r.setX(r.pos);
      });
      if (cfg.skewK) {
        const sk = gsap.utils.clamp(-8, 8, vSm * cfg.skewK);
        if (Math.abs(sk - lastSkew) > 0.04) {
          lastSkew = sk;
          rows.forEach((r) => r.skewTo(-r.sign * sk));
        }
      }
    };
    const start = () => { if (!running) { running = true; band.classList.add('is-live'); gsap.ticker.add(tick); } };
    const stop = () => {
      if (!running) return;
      running = false;
      band.classList.remove('is-live'); // Sterne stehen still, solange das Band nicht im Bild ist
      gsap.ticker.remove(tick);
      vSm = 0; lastSkew = 0;
      rows.forEach((r) => r.skewTo?.(0)); // aufrichten, bevor das Band wieder ins Bild kommt
    };

    measure();
    ScrollTrigger.create({
      trigger: band, start: 'top bottom', end: 'bottom top',
      onRefresh: measure,
      onToggle: (self) => (self.isActive ? start() : stop()), // ausserhalb des Bildes steht alles
      onUpdate: (self) => {
        vel = self.getVelocity();
        lastUpd = performance.now();
        if (Math.abs(vel) > 6) dir = vel > 0 ? 1 : -1;
      },
    });

    // Versatz beim Durchscrollen: die Zeilen schieben sich gegeneinander
    const drift = () => window.innerWidth * cfg.drift;
    rows.forEach((r) => {
      gsap.fromTo(r.row, { x: () => -r.sign * drift() }, {
        x: () => r.sign * drift(), ease: 'none',
        scrollTrigger: { trigger: band, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true },
      });
    });

    return () => {
      stop();
      rows.forEach((r) => gsap.set(r.track, { skewX: 0 }));
    };
  };

  /* ---------- 2. Haltung: Fenster oeffnet sich, Worte leuchten nacheinander auf ---------- */
  const statement = (sec, words, pinIt, FK) => {
    const { $ } = FK;
    const inner = $('[data-kin-inner]', sec);
    const bust = $('[data-kin-bust]', sec);
    const glow = $('[data-kin-glow]', sec);
    const rule = $('[data-kin-rule]', sec);
    const quote = $('[data-kin-quote]', sec);
    const by = $('[data-kin-by]', sec);
    const scrub = FK.isTouch ? true : 0.8;
    const vh = () => window.innerHeight;
    const pinDist = () => (pinIt ? vh() * 1.2 : 0);

    // Fensterformen: gleiche Struktur, damit GSAP die Zahlen interpoliert
    const shut = pinIt ? 'inset(12% 8% 0% 8% round 40px)' : 'inset(7% 4% 0% 4% round 26px)';
    const open = 'inset(0% 0% 0% 0% round 0px)';
    // Beim Verlassen nur seitlich schliessen: die Unterkante bleibt die Abschnittskante, an der
    // auch die Navigation wieder hell wird (sonst dunkle Nav ueber Papier)
    const leave = pinIt ? 'inset(0% 3.5% 0% 3.5% round 40px)' : 'inset(0% 3% 0% 3% round 26px)';

    // Gestaffelte fromTo rendern nur das erste Wort sofort – Startzustand daher explizit setzen
    gsap.set(words, { opacity: 0.15 });
    if (bust) gsap.set(bust, { x: 0, y: 0, yPercent: -50 });
    if (glow) gsap.set(glow, { x: 0, y: 0, xPercent: -35, yPercent: -50 });

    // a) Hereinscrollen: Fenster wird randlos, Inhalt steigt, Bueste zoomt zurueck, Linie zeichnet
    const reveal = gsap.timeline({
      scrollTrigger: { trigger: sec, start: 'top bottom', end: 'top top', scrub, invalidateOnRefresh: true },
    });
    reveal
      .fromTo(sec, { clipPath: shut }, { clipPath: open, ease: 'sine.out', duration: 1 }, 0)
      .fromTo(inner, { y: () => vh() * (pinIt ? 0.14 : 0.08) }, { y: 0, ease: 'power1.out', duration: 1 }, 0);
    if (bust) reveal.fromTo(bust, { scale: 1.16 }, { scale: 1, ease: 'power1.out', duration: 1 }, 0);
    if (rule) reveal.fromTo(rule, { scaleX: 0 }, { scaleX: 1, ease: 'power2.inOut', duration: 0.45 }, 0.35);

    // b) Worte von 15 % auf 100 % – weiche Kante, etwa drei Worte gleichzeitig im Uebergang
    const light = (tl, at, span) => {
      const d = Math.min(0.16, span * 0.3);
      const each = words.length > 1 ? (span - d) / (words.length - 1) : 0;
      tl.fromTo(words, { opacity: 0.15 }, { opacity: 1, ease: 'none', duration: d, stagger: each }, at);
    };

    let pinST = null;
    if (pinIt) {
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: sec, start: 'top top', end: () => `+=${pinDist()}`, pin: true, scrub, invalidateOnRefresh: true },
      });
      light(tl, 0.03, 0.8);
      if (by) tl.fromTo(by, { opacity: 0.15, y: 16 }, { opacity: 1, y: 0, duration: 0.1, ease: 'power2.out' }, 0.86);
      if (glow) tl.fromTo(glow, { xPercent: -35 }, { xPercent: 20, duration: 1 }, 0);
      tl.to({}, { duration: 0.04 }, 0.96); // kurzer Halt am Ende
      pinST = tl.scrollTrigger;
    } else {
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: quote, start: 'top 82%', end: 'bottom 42%', scrub: true, invalidateOnRefresh: true },
      });
      light(tl, 0, 1);
      if (by) {
        gsap.fromTo(by, { opacity: 0.15, y: 12 }, {
          opacity: 1, y: 0, ease: 'power2.out',
          scrollTrigger: { trigger: by, start: 'top 92%', end: 'top 72%', scrub: true },
        });
      }
      if (glow) gsap.fromTo(glow, { xPercent: -45 }, { xPercent: 5, ease: 'none', scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: true } });
    }

    // c) Bueste dreht und wandert ueber die ganze Passage
    const passage = () => `+=${vh() + sec.offsetHeight + pinDist()}`;
    if (bust) {
      gsap.fromTo(bust, { y: () => -vh() * 0.05, rotation: pinIt ? -5 : -3 }, {
        y: () => vh() * 0.06, rotation: pinIt ? 4 : 2, ease: 'none',
        scrollTrigger: {
          trigger: sec, start: 'top bottom', end: passage, scrub: true, invalidateOnRefresh: true,
        },
      });
    }

    // d) Hinausscrollen: das Fenster schliesst sich wieder, gleicher Weg zurueck
    gsap.fromTo(sec, { clipPath: open }, {
      clipPath: leave, ease: 'power2.in', immediateRender: false,
      scrollTrigger: {
        trigger: sec,
        // Mit Pin als Zahl: ScrollTrigger rechnet sonst den eigenen Pin-Abstand ein zweites Mal drauf.
        // Ohne Pin: erst wenn das Fenster offen ist, sonst ueberlappen sich beide Clip-Tweens.
        start: () => (pinST ? pinST.end + Math.max(0, sec.offsetHeight - vh()) : (sec.offsetHeight > vh() ? 'bottom bottom' : 'top top')),
        end: () => `+=${vh() * 0.85}`,
        scrub, invalidateOnRefresh: true,
      },
    });
  };
})();
