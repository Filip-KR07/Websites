/* Die Arena – Kopfzeile, Filter/Suche und das Arena-Feld im Einstieg */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Kopfzeile ---------- */
  const top = document.querySelector('.top');
  const bar = document.querySelector('[data-filterbar]');
  const topH = () => top.offsetHeight;
  let stuck = false;
  const onScroll = () => {
    top.classList.toggle('is-scrolled', window.scrollY > 8);
    const now = bar.getBoundingClientRect().top <= topH() + 0.5 && window.scrollY > 8;
    if (now !== stuck) { stuck = now; bar.classList.toggle('is-stuck', now); top.classList.toggle('has-bar', now); }
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Filter und Suche ---------- */
  const grid = document.querySelector('[data-grid]');
  const cards = [...document.querySelectorAll('.card')];
  const chips = [...document.querySelectorAll('.chip')];
  const input = document.querySelector('[data-search-input]');
  const status = document.querySelector('[data-status]');
  const empty = document.querySelector('[data-empty]');
  let group = 'all';

  const apply = () => {
    const words = input.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    let shown = 0, step = 0;
    cards.forEach(card => {
      const okGroup = group === 'all' || card.dataset.group === group;
      const okText = words.every(w => card.dataset.search.includes(w));
      const visible = okGroup && okText;
      const wasHidden = card.hidden;
      card.hidden = !visible;
      if (visible) {
        shown++;
        card.classList.remove('is-pending');
        if (wasHidden) {
          card.classList.remove('is-entering');
          void card.offsetWidth; // Animation neu starten
          card.style.setProperty('--d', `${Math.min(step++, 8) * 40}ms`);
          card.classList.add('is-entering');
        }
      }
    });
    status.textContent = shown === 1 ? '1 Modell' : `${shown} Modelle`;
    empty.hidden = shown > 0;
  };
  // Liegt die Leiste oben an, springt die Ansicht zum Anfang der Ergebnisse statt mitten in eine leere Fläche
  const toResults = () => {
    if (!stuck) return;
    const y = grid.getBoundingClientRect().top + window.scrollY - topH() - bar.offsetHeight - 16;
    window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
  };

  chips.forEach(chip => chip.addEventListener('click', () => {
    group = chip.dataset.filter;
    chips.forEach(c => c.setAttribute('aria-pressed', String(c === chip)));
    apply();
    toResults();
    chip.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
  }));
  input.addEventListener('input', apply);
  input.addEventListener('keydown', e => { if (e.key === 'Escape' && input.value) { input.value = ''; apply(); } });
  document.querySelector('[data-reset]').addEventListener('click', () => {
    input.value = '';
    group = 'all';
    chips.forEach(c => c.setAttribute('aria-pressed', String(c.dataset.filter === 'all')));
    apply();
    input.focus();
  });
  cards.forEach(card => card.addEventListener('animationend', () => card.classList.remove('is-entering')));

  /* ---------- Karten beim Scrollen einblenden (reihenweise leicht versetzt) ---------- */
  if ('IntersectionObserver' in window) {
    const below = cards.filter(c => c.getBoundingClientRect().top > window.innerHeight);
    below.forEach(c => c.classList.add('is-pending'));
    const io = new IntersectionObserver(entries => {
      const hits = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left);
      hits.forEach((e, i) => {
        const c = e.target;
        c.style.setProperty('--rd', `${Math.min(i, 3) * 70}ms`);
        c.classList.add('is-shown');
        requestAnimationFrame(() => c.classList.remove('is-pending'));
        const done = ev => { if (ev.propertyName !== 'opacity' && ev.propertyName !== 'translate') return; if (ev.propertyName === 'translate' || reduce) { c.classList.remove('is-shown'); c.style.removeProperty('--rd'); c.removeEventListener('transitionend', done); } };
        c.addEventListener('transitionend', done);
        io.unobserve(c);
      });
    }, { rootMargin: '0px 0px -6% 0px' });
    below.forEach(c => io.observe(c));
  }

  /* ---------- Arena-Feld: Ränge eines Amphitheaters von oben, Punkte wandern auf den Ringen ---------- */
  const canvas = document.querySelector('[data-field]');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const RINGS = 11, SECTIONS = 28;
  let w = 0, h = 0, dpr = 1, running = false, raf = 0, visible = true;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const dots = Array.from({ length: 90 }, (_, i) => ({
    ring: 2 + (i * 7) % (RINGS - 2),
    angle: (i * 2.399) % (Math.PI * 2),           // goldener Winkel verteilt gleichmäßig
    speed: (0.0006 + ((i * 13) % 10) * 0.00012) * (i % 2 ? 1 : -1),
    size: 0.8 + ((i * 7) % 5) * 0.28,
  }));

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const draw = t => {
    pointer.x += (pointer.tx - pointer.x) * 0.05;
    pointer.y += (pointer.ty - pointer.y) * 0.05;
    ctx.clearRect(0, 0, w, h);
    const wide = w > 900;
    const cx = w * (wide ? 0.68 : 0.5) + pointer.x * 24;
    const cy = h * (wide ? 0.46 : 0.25) + pointer.y * 16;
    const outer = Math.max(w, h) * (wide ? 0.46 : 0.62);
    const inner = outer * 0.24, tilt = 0.44 + pointer.y * 0.03;
    const rOf = i => inner + (outer - inner) * (i / (RINGS - 1));

    // Arena-Boden (innerste Fläche) als warmer Schimmer
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, inner * 1.4);
    glow.addColorStop(0, 'rgba(200,169,106,0.16)');
    glow.addColorStop(1, 'rgba(200,169,106,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.ellipse(cx, cy, inner * 1.4, inner * 1.4 * tilt, 0, 0, Math.PI * 2); ctx.fill();

    // Ränge
    for (let i = 0; i < RINGS; i++) {
      const r = rOf(i);
      ctx.strokeStyle = `rgba(200,169,106,${0.34 - i * 0.022})`;
      ctx.lineWidth = i === 0 ? 1.4 : 0.9;
      ctx.beginPath(); ctx.ellipse(cx, cy, r, r * tilt, 0, 0, Math.PI * 2); ctx.stroke();
    }
    // Aufgänge zwischen den Blöcken
    ctx.strokeStyle = 'rgba(246,243,236,0.06)';
    ctx.lineWidth = 1;
    for (let s = 0; s < SECTIONS; s++) {
      const a = (s / SECTIONS) * Math.PI * 2 + t * 0.00001;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * rOf(1), cy + Math.sin(a) * rOf(1) * tilt);
      ctx.lineTo(cx + Math.cos(a) * rOf(RINGS - 1), cy + Math.sin(a) * rOf(RINGS - 1) * tilt);
      ctx.stroke();
    }
    // Zuschauer: Punkte auf den Rängen, vorne heller als hinten
    dots.forEach(d => {
      if (!reduce) d.angle += d.speed * 16;
      const r = rOf(d.ring);
      const x = cx + Math.cos(d.angle) * r, y = cy + Math.sin(d.angle) * r * tilt;
      const front = (Math.sin(d.angle) + 1) / 2;
      ctx.fillStyle = `rgba(246,243,236,${0.18 + front * 0.55})`;
      ctx.beginPath(); ctx.arc(x, y, d.size * (0.7 + front * 0.6), 0, Math.PI * 2); ctx.fill();
    });
  };

  const loop = t => { draw(t); raf = running ? requestAnimationFrame(loop) : 0; };
  const start = () => { if (!running && !reduce && visible && !document.hidden) { running = true; raf = requestAnimationFrame(loop); } };
  const stop = () => { running = false; cancelAnimationFrame(raf); };

  resize(); draw(0);
  window.addEventListener('resize', () => { resize(); draw(performance.now()); });
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    window.addEventListener('pointermove', e => {
      pointer.tx = e.clientX / window.innerWidth - 0.5;
      pointer.ty = e.clientY / window.innerHeight - 0.5;
    }, { passive: true });
  }
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; visible ? start() : stop(); }).observe(canvas);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  start();
})();
