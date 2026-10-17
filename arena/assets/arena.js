/* Die Arena – Tribüne, Spielplan mit Bühne, Filter/Suche, Platz 34
   Start in Etappen: Kopfzeile, Filter und Suche sofort; Bühne, Zeichen-Rollen, Magnete im Leerlauf. */
(() => {
  const root = document.documentElement;
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches || root.classList.contains('motion-off');
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const stageMQ = window.matchMedia('(min-width: 1100px)');
  const CURTAIN = 'cubic-bezier(.77,0,.175,1)';
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const idle = (fn) => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 600 }) : setTimeout(fn, 60));

  /* ---------- Kopfzeile und Filterleiste ---------- */
  const top = document.querySelector('.top');
  const bar = document.querySelector('[data-filterbar]');
  const topH = () => top.offsetHeight;
  const setBarH = () => root.style.setProperty('--bar-h', `${bar.offsetHeight}px`);
  setBarH();
  window.addEventListener('resize', setBarH);
  let stuck = false;

  /* ---------- Filter und Suche ---------- */
  const programm = document.querySelector('[data-programm]');
  const body = programm.querySelector('.programm__body');
  const acts = [...document.querySelectorAll('.act')];
  const cards = [...document.querySelectorAll('.card')];
  const chips = [...document.querySelectorAll('.chip')];
  const input = document.querySelector('[data-search-input]');
  const status = document.querySelector('[data-status]');
  const empty = document.querySelector('[data-empty]');
  let group = 'all';
  const visibleCards = () => cards.filter((c) => !c.hidden);

  const apply = () => {
    const words = input.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    let shown = 0;
    cards.forEach((card) => {
      const ok = (group === 'all' || card.dataset.group === group) && words.every((w) => card.dataset.search.includes(w));
      card.hidden = !ok;
      if (ok) shown++;
    });
    acts.forEach((act) => { act.hidden = !act.querySelector('.card:not([hidden])'); });
    status.textContent = shown === 1 ? '1 Modell' : `${shown} Modelle`;
    empty.hidden = shown > 0;
    stage.refresh();
    onScroll();
  };
  const toResults = () => {
    if (!stuck) return;
    const y = body.getBoundingClientRect().top + window.scrollY - topH() - bar.offsetHeight + 1;
    window.scrollTo({ top: y, behavior: still ? 'auto' : 'smooth' });
  };
  const setGroup = (g) => {
    group = g;
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.filter === g)));
  };
  chips.forEach((chip) => chip.addEventListener('click', () => {
    setGroup(chip.dataset.filter);
    apply();
    toResults();
    const row = chip.parentElement; // gewählten Chip in der Wischleiste mittig holen, ohne die Seite zu bewegen
    if (row.scrollWidth > row.clientWidth) row.scrollTo({ left: chip.offsetLeft - (row.clientWidth - chip.offsetWidth) / 2, behavior: still ? 'auto' : 'smooth' });
  }));
  input.addEventListener('input', apply);
  input.addEventListener('keydown', (e) => { if (e.key === 'Escape' && input.value) { input.value = ''; apply(); } });
  document.querySelector('[data-reset]').addEventListener('click', () => {
    input.value = '';
    setGroup('all');
    apply();
    input.focus();
  });

  /* ---------- Bühne: aktive Demo als Laptop und Handy, Wechsel als Vorhang ---------- */
  const stage = (() => {
    const el = document.querySelector('[data-stage]');
    const screen = el.querySelector('[data-screen]');
    const phoneScreen = el.querySelector('[data-phone-screen]');
    const seatLabel = el.querySelector('[data-stage-seat]');
    const modelLabel = el.querySelector('[data-stage-model]');
    let active = null, wanted = null, token = 0, ready = false, hoverTimer = 0;

    const layer = (box, src, delay, t) => new Promise((resolve) => {
      const img = new Image();
      img.alt = ''; img.decoding = 'async'; img.src = src;
      const done = () => {
        if (t !== token) return resolve();
        box.appendChild(img);
        const old = [...box.querySelectorAll('img')].filter((i) => i !== img);
        if (still || !old.length) { old.forEach((o) => o.remove()); return resolve(); }
        const a = img.animate([{ clipPath: 'inset(0 0 0 100%)' }, { clipPath: 'inset(0 0 0 0)' }], { duration: 680, delay, easing: CURTAIN, fill: 'backwards' });
        old.forEach((o) => o.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-8%)' }], { duration: 680, delay, easing: CURTAIN, fill: 'forwards' }));
        a.onfinish = () => { [...box.querySelectorAll('img')].filter((i) => i !== box.lastElementChild).forEach((o) => o.remove()); resolve(); };
      };
      (img.decode ? img.decode() : Promise.resolve()).then(done, done);
    });

    const show = (card) => {
      if (!ready || !card || card === active) return;
      if (active) active.classList.remove('is-active');
      active = card;
      card.classList.add('is-active');
      const t = ++token;
      seatLabel.textContent = `Block ${card.dataset.block} · Platz ${card.dataset.no}`;
      modelLabel.textContent = `„${card.dataset.model}“`;
      layer(screen, card.querySelector('.card__desk').getAttribute('src'), 0, t);
      layer(phoneScreen, card.querySelector('.card__phone img').getAttribute('src'), 90, t);
      // Nachbarn vorladen, damit der nächste Vorhang ohne Warten aufgeht
      const vis = visibleCards(), i = vis.indexOf(card);
      [vis[i + 1], vis[i - 1]].forEach((n) => { if (n) { const p = new Image(); p.src = n.querySelector('.card__desk').getAttribute('src'); } });
    };
    const request = (card, soon) => {
      wanted = card;
      clearTimeout(hoverTimer);
      if (soon) show(card); else hoverTimer = setTimeout(() => show(wanted), 70);
    };
    const refresh = () => {
      if (!ready) return;
      const vis = visibleCards();
      el.classList.toggle('is-off', !vis.length);
      if (!active || active.hidden) { if (active) active.classList.remove('is-active'); active = null; show(vis[0]); }
    };
    const enable = () => {
      ready = stageMQ.matches;
      if (!ready) { if (active) active.classList.remove('is-active'); active = null; return; }
      refresh();
    };
    el.addEventListener('click', () => { if (active) location.href = active.querySelector('a').href; });
    el.style.cursor = 'pointer';
    return { enable, refresh, request, get ready() { return ready; }, get el() { return el; } };
  })();

  /* ---------- Scroll: Kopfzeile, Saalbeleuchtung, Lesezeile, Tribünen-Kamera, Odometer ---------- */
  const hero = document.querySelector('[data-hero]');
  const cam = document.querySelector('[data-cam]');
  const tilt = document.querySelector('[data-tilt]');
  const heroText = hero.querySelector('.hero__text');
  const outro = document.querySelector('[data-outro]');
  const odo = document.querySelector('[data-odo]');
  const ptr = { x: 0, y: 0, tx: 0, ty: 0, inList: false, listY: 0 };
  let current = '', raf = 0, heroOn = true;

  const renderHero = () => {
    if (still || !heroOn) return;
    const p = clamp(-hero.getBoundingClientRect().top / hero.offsetHeight, 0, 1);
    cam.style.transform = `translate3d(0, ${(-p * 18).toFixed(2)}vh, 0) scale(${(1 + p * 0.42).toFixed(4)})`;
    tilt.style.transform = `rotateX(${(61 + p * 13 + ptr.y * 5).toFixed(2)}deg) rotateZ(${(ptr.x * -7).toFixed(2)}deg)`;
    heroText.style.transform = p ? `translate3d(0, ${(-p * 22).toFixed(2)}vh, 0)` : '';
    heroText.style.opacity = p ? String(clamp(1 - p * 1.6, 0, 1)) : '';
  };

  function onScroll() {
    top.classList.toggle('is-scrolled', window.scrollY > 8);
    const barTop = bar.getBoundingClientRect().top;
    const now = barTop <= topH() + 0.5 && window.scrollY > 8;
    if (now !== stuck) { stuck = now; bar.classList.toggle('is-stuck', now); }

    // Saalbeleuchtung: welcher Block steht in der Mitte des Fensters?
    const mid = window.innerHeight * 0.5;
    let next = '';
    for (const act of acts) {
      if (act.hidden) continue;
      const r = act.getBoundingClientRect();
      if (r.top < mid && r.bottom > mid) { next = act.dataset.act; break; }
    }
    if (next !== current) { current = next; if (next) programm.dataset.current = next; else delete programm.dataset.current; }

    // Lesezeile für die Bühne: der Zeiger, sonst 45 % der Fensterhöhe
    if (stage.ready) {
      const line = ptr.inList ? ptr.listY : window.innerHeight * 0.45;
      for (const card of cards) {
        if (card.hidden) continue;
        const r = card.getBoundingClientRect();
        if (r.top <= line && r.bottom > line) { stage.request(card, !ptr.inList); break; }
      }
    }

    if (odo && !still) {
      const r = outro.getBoundingClientRect();
      const p = clamp((window.innerHeight - r.top) / (window.innerHeight * 0.55) - 0.2, 0, 1);
      const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; // schwer anlaufen, sanft einrasten
      odo.style.transform = `translateY(${(-e * 50).toFixed(2)}%)`;
    }
    renderHero();
  }
  let scrollQueued = false;
  window.addEventListener('scroll', () => {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(() => { scrollQueued = false; onScroll(); });
  }, { passive: true });
  window.addEventListener('resize', onScroll);
  new IntersectionObserver(([e]) => { heroOn = e.isIntersecting; }).observe(hero);

  /* ---------- Etappe 2: alles unterhalb des ersten Bildschirms ---------- */
  const queue = [
    // Bühne
    () => {
      stage.enable();
      stageMQ.addEventListener('change', () => { stage.enable(); onScroll(); });
      document.querySelector('.acts').addEventListener('focusin', (e) => {
        const card = e.target.closest('.card');
        if (card && stage.ready) stage.request(card, true);
      });
      onScroll();
    },
    // Plätze auf der Tribüne führen zum Eintrag im Spielplan
    () => {
      document.querySelectorAll('.seat').forEach((seat) => seat.addEventListener('click', (e) => {
        const card = document.querySelector(seat.getAttribute('href'));
        if (!card) return;
        e.preventDefault();
        if (card.hidden) { input.value = ''; setGroup('all'); apply(); }
        card.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'center' });
        card.querySelector('a').focus({ preventScroll: true });
        if (stage.ready) stage.request(card, true);
      }));
    },
    // Zeiger: Tribüne neigt sich mit Feder, Bühne dreht sich leicht, Liste folgt dem Zeiger
    () => {
      if (!fine) return;
      const acts = document.querySelector('.acts');
      acts.addEventListener('pointerenter', () => { ptr.inList = true; });
      acts.addEventListener('pointerleave', () => { ptr.inList = false; });
      acts.addEventListener('pointermove', (e) => {
        ptr.listY = e.clientY;
        if (stage.ready) { const card = e.target.closest('.card'); if (card) stage.request(card, false); }
      }, { passive: true });
      if (still) return;
      const laptop = document.querySelector('.stage__laptop');
      const phone = document.querySelector('[data-phone]');
      const tick = () => {
        ptr.x += (ptr.tx - ptr.x) * 0.08;
        ptr.y += (ptr.ty - ptr.y) * 0.08;
        renderHero();
        if (stage.ready) {
          laptop.style.transform = `rotateY(${(ptr.x * -5).toFixed(2)}deg) rotateX(${(ptr.y * 3).toFixed(2)}deg)`;
          phone.style.transform = `translate3d(${(ptr.x * 16).toFixed(1)}px, ${(ptr.y * 14).toFixed(1)}px, 0)`;
        }
        raf = Math.abs(ptr.tx - ptr.x) + Math.abs(ptr.ty - ptr.y) > 0.002 ? requestAnimationFrame(tick) : 0;
      };
      window.addEventListener('pointermove', (e) => {
        ptr.tx = e.clientX / window.innerWidth - 0.5;
        ptr.ty = e.clientY / window.innerHeight - 0.5;
        if (!raf) raf = requestAnimationFrame(tick);
      }, { passive: true });
    },
    // Zeichen-Rollen in den Modellnamen
    () => {
      if (!fine || still) return;
      document.querySelectorAll('.card__word').forEach((w) => {
        const text = w.textContent;
        const chars = [...text].map((c, i) => `<span class="ch" style="--c:${i}"><span>${c}</span><span>${c}</span></span>`).join('');
        w.innerHTML = `<span class="sr-only">${text}</span><span class="roll" aria-hidden="true">${chars}</span>`;
      });
    },
    // Magnetische Knöpfe
    () => {
      if (!fine || still) return;
      document.querySelectorAll('[data-magnet]').forEach((el) => {
        let r = null;
        el.addEventListener('pointerenter', () => { r = el.getBoundingClientRect(); el.classList.add('is-magnet'); });
        el.addEventListener('pointermove', (e) => {
          if (!r) return;
          const dx = (e.clientX - (r.left + r.width / 2)) * 0.28, dy = (e.clientY - (r.top + r.height / 2)) * 0.36;
          el.style.translate = `${dx.toFixed(1)}px ${dy.toFixed(1)}px`;
        });
        el.addEventListener('pointerleave', () => { r = null; el.classList.remove('is-magnet'); el.style.translate = '0px 0px'; });
      });
    },
  ];
  const run = () => {
    const t0 = performance.now();
    while (queue.length && performance.now() - t0 < 20) queue.shift()();
    if (queue.length) idle(run);
  };

  onScroll();
  idle(run);
})();
