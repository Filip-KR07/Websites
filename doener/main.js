/* ATEŞ Döner & Grill – Demo */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------------------------------------------------------
     Öffnungszeiten & Live-Status (Zeitzone Berlin)
     Tage: 0 = Sonntag … 6 = Samstag, Zeiten in Minuten.
     Schließzeit nach Mitternacht = Wert über 24 h.
     --------------------------------------------------------- */
  const HOURS = {
    0: [11 * 60, 24 * 60],
    1: [10 * 60, 25 * 60],
    2: [10 * 60, 25 * 60],
    3: [10 * 60, 25 * 60],
    4: [10 * 60, 25 * 60],
    5: [10 * 60, 27 * 60],
    6: [10 * 60, 27 * 60],
  };
  const WEEKDAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

  function berlinNow() {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Europe/Berlin',
      weekday: 'short',
      hour: 'numeric',
      minute: 'numeric',
      hourCycle: 'h23',
    }).formatToParts(new Date());
    const get = (t) => parts.find((p) => p.type === t).value;
    const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
    return { day, minutes: Number(get('hour')) * 60 + Number(get('minute')) };
  }

  const fmt = (m) => {
    const h = Math.floor(m / 60) % 24;
    return `${String(h).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  };

  function openState() {
    const { day, minutes } = berlinNow();
    const yesterday = (day + 6) % 7;
    const [yOpen, yClose] = HOURS[yesterday];
    // Noch in der Nacht von gestern geöffnet?
    if (yClose > 24 * 60 && minutes < yClose - 24 * 60) {
      return { open: true, label: `Geöffnet · bis ${fmt(yClose)}`, today: day };
    }
    const [open, close] = HOURS[day];
    if (minutes >= open && minutes < close) {
      return { open: true, label: `Geöffnet · bis ${fmt(close)}`, today: day };
    }
    if (minutes < open) {
      return { open: false, label: `Geschlossen · ab ${fmt(open)}`, today: day };
    }
    const next = (day + 1) % 7;
    return { open: false, label: `Geschlossen · ${WEEKDAYS[next].slice(0, 2)} ab ${fmt(HOURS[next][0])}`, today: day };
  }

  function renderStatus() {
    const state = openState();
    $$('[data-open-status]').forEach((el) => {
      el.classList.toggle('is-open', state.open);
      el.classList.toggle('is-closed', !state.open);
      $('[data-open-label]', el).textContent = state.label;
    });
    $$('[data-hours] tr').forEach((row) => {
      row.classList.toggle('is-today', Number(row.dataset.days) === state.today);
    });
  }
  renderStatus();
  setInterval(renderStatus, 60 * 1000);

  const year = $('[data-year]');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------------------------------------------------------
     Hero: Hintergrundvideo mit Glut-Fallback
     --------------------------------------------------------- */
  const hero = $('[data-hero]');
  const video = $('[data-hero-video]');
  const canvas = $('[data-embers]');
  const toggle = $('[data-media-toggle]');
  const toggleLabel = $('[data-media-label]');
  let userPaused = reduceMotion.matches;
  let heroVisible = true;

  const embers = createEmbers(canvas);

  // Optionales Standbild: wird nur gesetzt, wenn die Datei existiert
  const poster = new Image();
  poster.onload = () => { video.poster = poster.src; };
  poster.src = 'assets/video/hero-poster.jpg';

  function videoReady() {
    hero.classList.add('has-video');
    embers.stop();
    syncMedia();
  }

  if (video) {
    if (reduceMotion.matches) {
      video.removeAttribute('autoplay');
      video.preload = 'metadata';
    }
    // Wenn Autoplay schon vor dem Script losgelaufen ist
    if (video.readyState >= 2) videoReady();
    video.addEventListener('loadeddata', videoReady, { once: true });
    // Kein Video vorhanden → Fallback bleibt
    const sources = $$('source', video);
    const lastSource = sources[sources.length - 1];
    lastSource && lastSource.addEventListener('error', () => {
      hero.classList.remove('has-video');
      syncMedia();
    });
  }

  function hasVideo() {
    return hero.classList.contains('has-video');
  }

  function syncMedia() {
    const shouldPlay = !userPaused && heroVisible && !document.hidden;
    if (hasVideo()) {
      if (shouldPlay) {
        const p = video.play();
        p && p.catch(() => {});
      } else {
        video.pause();
      }
    } else if (shouldPlay) {
      embers.start();
    } else {
      embers.stop();
      embers.drawStatic();
    }
    toggle.setAttribute('aria-pressed', String(userPaused));
    toggleLabel.textContent = userPaused
      ? (hasVideo() ? 'Hintergrundvideo abspielen' : 'Hintergrund-Animation abspielen')
      : (hasVideo() ? 'Hintergrundvideo pausieren' : 'Hintergrund-Animation pausieren');
  }

  toggle.addEventListener('click', () => {
    userPaused = !userPaused;
    syncMedia();
  });

  new IntersectionObserver(([entry]) => {
    heroVisible = entry.isIntersecting;
    syncMedia();
  }).observe(hero);

  document.addEventListener('visibilitychange', syncMedia);
  syncMedia();

  /* Glut-Partikel auf Canvas – nur solange kein Video läuft */
  function createEmbers(el) {
    const ctx = el.getContext('2d');
    let w = 0, h = 0, dpr = 1, raf = 0, last = 0;
    let particles = [];

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = el.clientWidth;
      h = el.clientHeight;
      el.width = Math.round(w * dpr);
      el.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(90, Math.max(36, (w * h) / 16000)));
      particles = Array.from({ length: count }, () => spawn(true));
    }

    function spawn(anywhere) {
      return {
        x: Math.random() * w,
        y: anywhere ? Math.random() * h : h + 10,
        r: 0.6 + Math.random() * 2.2,
        vy: 18 + Math.random() * 52,
        sway: 10 + Math.random() * 30,
        phase: Math.random() * Math.PI * 2,
        life: 0.4 + Math.random() * 0.6,
        hue: 18 + Math.random() * 26,
      };
    }

    function draw(t, dt) {
      ctx.clearRect(0, 0, w, h);

      // Pulsierender Glutschein vom unteren Rand
      const flicker = 0.82 + Math.sin(t * 0.0021) * 0.08 + Math.sin(t * 0.0057) * 0.05;
      const g = ctx.createRadialGradient(w * 0.66, h * 1.05, 0, w * 0.66, h * 1.05, Math.max(w, h) * 0.8);
      g.addColorStop(0, `rgba(255, 106, 32, ${0.55 * flicker})`);
      g.addColorStop(0.35, `rgba(190, 52, 12, ${0.28 * flicker})`);
      g.addColorStop(1, 'rgba(18, 16, 14, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      ctx.globalCompositeOperation = 'lighter';
      for (const p of particles) {
        p.y -= p.vy * dt;
        p.phase += dt * 1.4;
        const x = p.x + Math.sin(p.phase) * p.sway;
        const progress = 1 - p.y / h;
        const alpha = Math.max(0, p.life * (1 - progress * 1.1));
        if (p.y < -10 || alpha <= 0) Object.assign(p, spawn(false));

        const glow = ctx.createRadialGradient(x, p.y, 0, x, p.y, p.r * 6);
        glow.addColorStop(0, `hsla(${p.hue}, 100%, 70%, ${alpha})`);
        glow.addColorStop(0.3, `hsla(${p.hue}, 100%, 55%, ${alpha * 0.4})`);
        glow.addColorStop(1, `hsla(${p.hue}, 100%, 50%, 0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, p.y, p.r * 6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
    }

    function frame(t) {
      const dt = Math.min(0.05, (t - (last || t)) / 1000);
      last = t;
      draw(t, dt);
      raf = requestAnimationFrame(frame);
    }

    resize();
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resize();
        if (!raf) draw(performance.now(), 0);
      }, 150);
    });

    return {
      start() {
        if (raf) return;
        last = 0;
        raf = requestAnimationFrame(frame);
      },
      stop() {
        cancelAnimationFrame(raf);
        raf = 0;
      },
      drawStatic() {
        draw(2000, 0);
      },
    };
  }

  /* ---------------------------------------------------------
     Header: solide nach dem Hero, Aktionsleiste auf dem Handy
     --------------------------------------------------------- */
  const header = $('[data-header]');
  const actionBar = $('[data-action-bar]');
  const sentinel = document.createElement('div');
  sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:80px;pointer-events:none';
  hero.appendChild(sentinel);
  new IntersectionObserver(([entry]) => {
    header.classList.toggle('is-solid', !entry.isIntersecting);
  }).observe(sentinel);

  new IntersectionObserver(([entry]) => {
    actionBar.classList.toggle('is-visible', !entry.isIntersecting);
  }, { rootMargin: '-40% 0px 0px 0px' }).observe(hero);

  // Aktiver Navigationspunkt
  const navLinks = $$('.nav a');
  const sections = navLinks.map((a) => $(a.getAttribute('href'))).filter(Boolean);
  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${entry.target.id}`));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach((s) => navObserver.observe(s));

  /* ---------------------------------------------------------
     Mobile-Menü
     --------------------------------------------------------- */
  const burger = $('[data-burger]');
  const menu = $('[data-mobile-menu]');
  const burgerLabel = $('.sr-only', burger);

  function setMenu(open) {
    burger.setAttribute('aria-expanded', String(open));
    burgerLabel.textContent = open ? 'Menü schließen' : 'Menü öffnen';
    document.body.style.overflow = open ? 'hidden' : '';
    header.classList.toggle('menu-open', open);
    if (open) {
      menu.hidden = false;
      requestAnimationFrame(() => requestAnimationFrame(() => menu.classList.add('is-open')));
    } else {
      menu.classList.remove('is-open');
      const done = () => { if (!menu.classList.contains('is-open')) menu.hidden = true; };
      reduceMotion.matches ? done() : setTimeout(done, 250);
    }
  }
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
      burger.focus();
    }
  });
  matchMedia('(min-width: 900px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

  /* ---------------------------------------------------------
     Scroll-Reveal mit leichter Staffelung
     --------------------------------------------------------- */
  const revealObserver = new IntersectionObserver((entries) => {
    const entering = entries.filter((e) => e.isIntersecting);
    entering.forEach((entry, i) => {
      entry.target.style.setProperty('--d', `${Math.min(i, 5) * 60}ms`);
      entry.target.classList.add('is-in');
      revealObserver.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
  $$('[data-reveal]').forEach((el) => revealObserver.observe(el));

  /* ---------------------------------------------------------
     Zahlen hochzählen (einmalig)
     --------------------------------------------------------- */
  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      countObserver.unobserve(entry.target);
      countUp(entry.target);
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach((el) => countObserver.observe(el));

  function formatNumber(el, value) {
    const decimals = Number(el.dataset.decimals || 0);
    return value.toLocaleString('de-DE', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      useGrouping: el.dataset.format === 'thousand',
    });
  }

  function countUp(el) {
    const target = Number(el.dataset.count);
    if (reduceMotion.matches) {
      el.textContent = formatNumber(el, target);
      return;
    }
    const duration = 1400;
    const start = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 4);
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const decimals = Number(el.dataset.decimals || 0);
      const factor = Math.pow(10, decimals);
      el.textContent = formatNumber(el, Math.round(target * ease(t) * factor) / factor);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ---------------------------------------------------------
     Speisekarte: Tabs mit clip-path-Indikator
     --------------------------------------------------------- */
  const tabsRoot = $('[data-tabs]');
  const tabs = $$('[role="tab"]', tabsRoot);
  const activeList = $('[data-tabs-active]', tabsRoot);
  const activeClones = $$('.tabs__tab', activeList);
  const scroller = $('.tabs__scroller', tabsRoot);
  let current = 0;

  function clipTo(index) {
    const el = activeClones[index];
    const left = el.offsetLeft;
    const right = activeList.offsetWidth - (left + el.offsetWidth);
    activeList.style.clipPath = `inset(6px ${right}px 6px ${left}px round 999px)`;
  }

  function selectTab(index, { focus = false } = {}) {
    if (index === current) return;
    const prevPanel = $(`#${tabs[current].getAttribute('aria-controls')}`);
    const nextPanel = $(`#${tabs[index].getAttribute('aria-controls')}`);

    tabs.forEach((tab, i) => {
      const selected = i === index;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });

    prevPanel.hidden = true;
    prevPanel.classList.remove('is-entering');
    nextPanel.hidden = false;
    nextPanel.classList.remove('is-entering');
    void nextPanel.offsetWidth;
    nextPanel.classList.add('is-entering');

    current = index;
    clipTo(index);
    if (focus) tabs[index].focus();

    // Aktiven Tab auf dem Handy in Sicht scrollen
    const tab = tabs[index];
    const tabLeft = tab.offsetLeft;
    const tabRight = tabLeft + tab.offsetWidth;
    if (tabLeft < scroller.scrollLeft || tabRight > scroller.scrollLeft + scroller.clientWidth) {
      scroller.scrollTo({ left: tabLeft - 24, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    }
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => selectTab(i));
    tab.addEventListener('keydown', (e) => {
      // Tastatur: sofort, ohne Übergang
      let next = null;
      if (e.key === 'ArrowRight') next = (current + 1) % tabs.length;
      if (e.key === 'ArrowLeft') next = (current - 1 + tabs.length) % tabs.length;
      if (e.key === 'Home') next = 0;
      if (e.key === 'End') next = tabs.length - 1;
      if (next === null) return;
      e.preventDefault();
      tabsRoot.classList.add('no-anim');
      selectTab(next, { focus: true });
      requestAnimationFrame(() => tabsRoot.classList.remove('no-anim'));
    });
  });

  function initClip() {
    tabsRoot.classList.add('no-anim');
    clipTo(current);
    requestAnimationFrame(() => requestAnimationFrame(() => tabsRoot.classList.remove('no-anim')));
  }
  initClip();
  document.fonts && document.fonts.ready.then(initClip);
  window.addEventListener('resize', initClip);

  /* ---------------------------------------------------------
     Bewertungen: Pfeile für das Scroll-Snap-Karussell
     --------------------------------------------------------- */
  const carousel = $('[data-carousel]');
  const prev = $('[data-carousel-prev]');
  const next = $('[data-carousel-next]');

  function step() {
    const card = carousel.firstElementChild;
    return card.offsetWidth + parseFloat(getComputedStyle(carousel).columnGap || 16);
  }
  function updateArrows() {
    prev.disabled = carousel.scrollLeft < 4;
    next.disabled = carousel.scrollLeft + carousel.clientWidth > carousel.scrollWidth - 4;
  }
  prev.addEventListener('click', () => carousel.scrollBy({ left: -step(), behavior: 'smooth' }));
  next.addEventListener('click', () => carousel.scrollBy({ left: step(), behavior: 'smooth' }));
  carousel.addEventListener('scroll', updateArrows, { passive: true });
  window.addEventListener('resize', updateArrows);
  updateArrows();
})();
