/* Modelle fürs Handwerk – Kapitel-Farben, Laptop-Deckel, Parallaxe, Zollstock, Schere, Magnete */
(() => {
  const root = document.documentElement;
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches || root.classList.contains('motion-off');
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const easeSet = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  const top = document.querySelector('.top');
  const body = document.body;
  const SCENES = { papier: '#F6F3EC', manufaktur: '#2B1D14', impuls: '#0A0C0F', kante: '#ECEAE5', nacht: '#0F1420' };
  const DARK = new Set(['manufaktur', 'impuls', 'nacht']);
  const scenes = [...document.querySelectorAll('[data-scene]')];
  const hero = document.querySelector('[data-hero]');
  const plates = [...hero.querySelectorAll('.plate a')];
  const title = hero.querySelector('.hero__text');
  const rigs = [...document.querySelectorAll('[data-devices]')].map((el) => ({ el, lid: el.querySelector('[data-lid]'), phone: el.querySelector('[data-phone]') }));
  const ruler = document.querySelector('[data-ruler]');
  const rulerBox = ruler && ruler.closest('.parts__body');
  const outro = document.querySelector('.outro');
  const scissors = document.querySelector('[data-scissors]');
  let scene = '';

  const render = () => {
    const vh = window.innerHeight;
    top.classList.toggle('is-scrolled', window.scrollY > 8);

    // Kapitel-Farbe: der Abschnitt, der die Linie bei 62 % kreuzt, färbt die ganze Seite
    let next = 'papier';
    for (const s of scenes) {
      const r = s.getBoundingClientRect();
      if (r.top < vh * 0.62 && r.bottom > vh * 0.62) { next = s.dataset.scene; break; }
    }
    if (next !== scene) {
      scene = next;
      body.style.backgroundColor = SCENES[next];
      body.classList.toggle('is-dark', DARK.has(next));
    }
    if (still) return;

    // Einstieg: Platten weichen beim Scrollen unterschiedlich schnell nach oben (Tiefe)
    const hr = hero.getBoundingClientRect();
    if (hr.bottom > 0) {
      const p = clamp(-hr.top / hr.height, 0, 1);
      plates.forEach((a, i) => { a.style.transform = p ? `translate3d(0, ${(-p * (30 + i * 70)).toFixed(1)}px, 0)` : ''; });
      title.style.transform = p ? `translate3d(0, ${(p * 60).toFixed(1)}px, 0)` : '';
    }

    // Der Bildschirm richtet sich auf, das Handy fährt hoch
    rigs.forEach(({ el, lid, phone }) => {
      const r = el.getBoundingClientRect();
      if (r.top > vh * 1.2 || r.bottom < -vh * 0.2) return;
      const e = easeSet(clamp((vh - r.top) / (vh * 0.8), 0, 1));
      lid.style.transform = `rotateX(${((1 - e) * 64).toFixed(2)}deg)`;
      phone.style.transform = `translate3d(0, ${((1 - e) * 42).toFixed(2)}%, 0) rotate(${((1 - e) * -6).toFixed(2)}deg)`;
    });

    // Zollstock füllt sich mit der Stückliste
    if (rulerBox) {
      const r = rulerBox.getBoundingClientRect();
      ruler.style.transform = `scaleY(${clamp((vh * 0.7 - r.top) / r.height, 0, 1).toFixed(4)})`;
    }

    // Schere schneidet Modell Nº 04 zu
    if (scissors) {
      const r = outro.getBoundingClientRect();
      const p = clamp((vh - r.top) / (vh * 0.9), 0, 1);
      scissors.style.transform = `translate3d(${(easeSet(p) * (r.width - 44)).toFixed(1)}px, 0, 0)`;
    }
  };

  let queued = false;
  const onScroll = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; render(); });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  render();

  // Magnetische Knöpfe (nur feiner Zeiger)
  if (fine && !still) {
    const init = () => document.querySelectorAll('[data-magnet]').forEach((el) => {
      let r = null;
      el.addEventListener('pointerenter', () => { r = el.getBoundingClientRect(); el.classList.add('is-magnet'); });
      el.addEventListener('pointermove', (e) => {
        if (!r) return;
        el.style.translate = `${((e.clientX - (r.left + r.width / 2)) * 0.28).toFixed(1)}px ${((e.clientY - (r.top + r.height / 2)) * 0.36).toFixed(1)}px`;
      });
      el.addEventListener('pointerleave', () => { r = null; el.classList.remove('is-magnet'); el.style.translate = '0px 0px'; });
    });
    (window.requestIdleCallback || setTimeout)(init);
  }
})();
