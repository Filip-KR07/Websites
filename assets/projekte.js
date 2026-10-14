/* Case Studies: Kopfzeile, Einblenden, Zaehler, Filter und Suche. Ohne Bibliotheken. */
(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  $$('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });

  /* Kopfzeile bekommt Hintergrund, sobald gescrollt ist */
  const nav = $('[data-cs-nav]');
  const onScroll = () => nav && nav.classList.toggle('is-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* Einblenden beim Hereinscrollen; Tastaturfokus zeigt sofort */
  const reveals = $$('.cs-reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    reveals.forEach((el) => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    reveals.forEach((el) => io.observe(el));
    document.addEventListener('focusin', (e) => { const r = e.target.closest('.cs-reveal'); if (r) r.classList.add('is-in'); });
  }

  /* Zahlen zaehlen hoch */
  $$('[data-count]').forEach((el) => {
    const end = parseInt(el.dataset.count, 10);
    if (reduce || Number.isNaN(end)) return;
    const t0 = performance.now(); const dur = 1100;
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur); const k = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(end * k));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });

  /* Filter und Suche (nur Uebersicht) */
  const grid = $('[data-cs-grid]');
  if (!grid) return;
  const cards = $$('.cs-card', grid);
  const kindChips = $$('[data-filter-kind]');
  const groupChips = $$('[data-filter-group]');
  const input = $('[data-cs-search]');
  const status = $('[data-cs-status]');
  const empty = $('[data-cs-empty]');
  let kind = 'all'; let group = 'all';

  const apply = () => {
    const words = (input.value || '').toLowerCase().trim().split(/\s+/).filter(Boolean);
    let shown = 0;
    cards.forEach((card) => {
      const ok = (kind === 'all' || card.dataset.kind === kind)
        && (group === 'all' || card.dataset.group === group)
        && words.every((w) => card.dataset.search.includes(w));
      card.classList.toggle('is-hiding', !ok);
      if (ok) { shown++; card.classList.add('is-in'); }
    });
    status.textContent = shown === 1 ? '1 Case Study' : `${shown} Case Studies`;
    empty.hidden = shown > 0;
  };
  const press = (chips, chip) => chips.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
  kindChips.forEach((chip) => chip.addEventListener('click', () => { kind = chip.dataset.filterKind; press(kindChips, chip); apply(); }));
  groupChips.forEach((chip) => chip.addEventListener('click', () => { group = chip.dataset.filterGroup; press(groupChips, chip); apply(); }));
  input.addEventListener('input', apply);
  $('[data-cs-reset]')?.addEventListener('click', () => {
    input.value = ''; kind = 'all'; group = 'all';
    press(kindChips, kindChips[0]); press(groupChips, groupChips[0]);
    apply(); input.focus();
  });
})();
