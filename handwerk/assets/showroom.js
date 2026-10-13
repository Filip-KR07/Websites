/* Modelle fürs Handwerk – Übersicht: Kopfzeile und Einblenden */
(() => {
  const top = document.querySelector('.top');
  const onScroll = () => top.classList.toggle('is-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const items = [...document.querySelectorAll('[data-reveal]')];
  if (!('IntersectionObserver' in window)) {
    items.forEach(el => el.classList.add('is-in'));
    return;
  }

  // Geschwister im selben Block kommen leicht versetzt (60 ms), nie mehr als 6 Stufen
  const groups = new Map();
  items.forEach(el => {
    const parent = el.parentElement;
    const i = groups.get(parent) || 0;
    el.style.setProperty('--d', `${Math.min(i, 6) * 60}ms`);
    groups.set(parent, i + 1);
  });

  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  items.forEach(el => io.observe(el));
})();
