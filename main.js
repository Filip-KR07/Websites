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
  const THEME = { light: '#F6F3EC', dark: '#0F1420' };

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
        onToggle: (self) => { if (self.isActive) applyTheme(sec.dataset.navTheme); },
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
    gsap.set([heroEls.eyebrow, heroEls.sub, heroEls.caption, heroEls.scroll, nav], { autoAlpha: 0 });
    gsap.set(heroEls.art, { autoAlpha: 0, scale: 1.08, transformOrigin: '50% 100%' });
    gsap.set(heroEls.disc, { autoAlpha: 0, scale: 0.7 });

    const heroIntro = () => new Promise((resolve) => {
      gsap.timeline({ defaults: { ease: 'power4.out' }, onComplete: resolve })
        .to(heroEls.disc, { autoAlpha: 1, scale: 1, duration: 1.8, ease: 'power2.out' }, 0)
        .to(heroEls.art, { autoAlpha: 1, scale: 1, duration: 1.8, ease: 'power2.out' }, 0.1)
        .to(chars, { yPercent: 0, duration: 1.2, stagger: 0.035 }, 0.15)
        .to(heroEls.eyebrow, { autoAlpha: 1, duration: 0.8 }, 0.5)
        .to(heroEls.sub, { autoAlpha: 1, duration: 0.8 }, 0.7)
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
        const st = { trigger: el, start: 'top 88%', once: true };
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
