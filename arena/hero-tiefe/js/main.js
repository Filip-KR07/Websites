/* Salz & Glut — Restaurant-Demo · main.js
   Progressive Enhancement: Ohne JS, ohne GSAP/Lenis oder mit "Bewegung reduzieren" ist die Seite
   vollständig sichtbar und bedienbar. Alle Module stecken in einer IIFE, es gibt keine Globals. */
(() => {
  'use strict';

  /* ---------- 1. Grundlagen ---------- */
  const doc = document.documentElement;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const motion = doc.classList.contains('motion'); // gesetzt im <head> (prefers-reduced-motion, ?motion=off)
  const feinerZeiger = window.matchMedia('(hover: hover) and (pointer: fine)');
  const hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  const gsapAn = motion && hasGSAP;
  const EASE_OUT = 'cubic-bezier(.23,1,.32,1)';

  const neuMessen = () => { if (hasGSAP) ScrollTrigger.refresh(); };
  if (hasGSAP) {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
  }
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener?.('change', () => location.reload());

  const jahr = $('[data-jahr]');
  if (jahr) jahr.textContent = String(new Date().getFullYear());

  /* ---------- 2. Weiches Scrollen (nur Maus/Trackpad, Touch bleibt nativ) ---------- */
  let lenis = null;
  if (gsapAn && typeof window.Lenis !== 'undefined' && feinerZeiger.matches) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // Scrollsperre für Dialoge; zählt mit, falls zwei gleichzeitig offen sind
  let sperren = 0;
  const sperre = (an) => {
    sperren = Math.max(0, sperren + (an ? 1 : -1));
    const aktiv = sperren > 0;
    doc.style.overflow = aktiv ? 'hidden' : '';
    if (lenis) (aktiv ? lenis.stop() : lenis.start());
  };

  const scrollZu = (el, { fokus = true } = {}) => {
    if (!el) return;
    const ganzOben = el.id === 'top';
    if (lenis) {
      lenis.scrollTo(ganzOben ? 0 : el, { duration: 1.3, easing: (x) => 1 - Math.pow(1 - x, 4) });
    } else if (ganzOben) {
      window.scrollTo({ top: 0, behavior: motion ? 'smooth' : 'auto' });
    } else {
      el.scrollIntoView({ behavior: motion ? 'smooth' : 'auto', block: 'start' });
    }
    // Fokus mitnehmen, damit Tastatur und Screenreader am Ziel weitermachen
    if (!fokus) return;
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
  };

  /* ---------- 3. Hero-Intro: startet, sobald das Bild dekodiert ist ---------- */
  const hero = $('[data-hero]');
  const heroImg = $('[data-hero-img]');
  const bereit = () => doc.classList.add('is-ready');
  if (!motion || !heroImg) {
    bereit();
  } else {
    const notfall = setTimeout(bereit, 1400); // langsames Netz: Schrift kommt trotzdem
    const fertig = () => { clearTimeout(notfall); requestAnimationFrame(bereit); };
    const dekodieren = () => (heroImg.decode ? heroImg.decode().then(fertig, fertig) : fertig());
    if (heroImg.complete && heroImg.naturalWidth) dekodieren();
    else {
      heroImg.addEventListener('load', dekodieren, { once: true });
      heroImg.addEventListener('error', fertig, { once: true });
    }
  }

  /* ---------- 3b. Tiefe: Ebenen federn der Maus nach und trennen sich beim Scrollen ----------
     Maus (nur feiner Zeiger, nicht bei reduzierter Bewegung): zwei gedämpfte Federn folgen der Mausposition (−1…1),
     daraus berechnet jede Ebene ihren Versatz. Hinter der Schärfeebene (Foto, ferne Glut) geht es gegen die Maus
     und träge, davor (Schrift, Glut) mit der Maus und schneller, umso stärker, je näher die Ebene ist.
     Scrollen: Fortschritt 0…1, bis das Blatt „Küche“ oben ankommt. Die Schrift steigt schneller und fliegt nach vorn,
     das Foto weicht langsam zurück. Geschrieben wird nur transform/opacity. */
  const TIEFE = {
    bild: { x: -10, y: -7, kippX: 0.8, kippY: 1 },   // px bzw. Grad bei Maus am Rand
    schrift: { x: 7, y: 5 },                          // ganze Textebene
    titel: { x: 8, y: 5 },                            // „Salz & Glut“ zusätzlich (liegt etwas weiter vorn)
    amp: { x: 7, y: 4 },                              // das „&“ noch einmal zusätzlich
    // Zwei Federn: hinten träge und schwer, vorn leichter und schneller. So trennen sich die Ebenen auch zeitlich.
    feder: { hinten: { steif: 55, daempf: 10.5 }, vorn: { steif: 105, daempf: 13 } }, // Dämpfungsgrad ≈ 0,7 / 0,63
    scroll: { bildY: 0.04, bildZ: -70, bildKipp: 3, schriftY: 0.24, schriftZ: 170, schriftKipp: -7 }, // Kipp in Grad
  };
  const tiefe = (() => {
    const media = $('[data-hero-media]');
    const flug = $('[data-hero-flug]');
    if (!motion || !hero || !media || !flug) return null;
    const front = $('[data-hero-front]');
    const dim = $('[data-hero-dim]');
    const titel = $('[data-hero-titel]');
    const amp = $('[data-hero-amp]');
    const ebenen = $$('[data-tiefe-ebene]').map((el) => ({ el, k: parseFloat(el.dataset.tiefe) || 0 }));
    const r = (v, n = 2) => +v.toFixed(n);

    let P = parseFloat(getComputedStyle(hero).getPropertyValue('--tiefe-p')) || 1000;
    let H = hero.offsetHeight;
    let p = 0;                                   // Scroll-Fortschritt
    let zx = 0, zy = 0;                                // Ziel (Mausposition −1…1)
    const hinten = { x: 0, y: 0, vx: 0, vy: 0 };       // Foto, ferne Glut
    const vorn = { x: 0, y: 0, vx: 0, vy: 0 };         // Schrift, mittlere und nahe Glut
    let raf = 0, zuletzt = 0;

    const zeichne = () => {
      const T = TIEFE, S = T.scroll, sy = p * H;
      let { x, y } = hinten;
      media.style.transform = `perspective(${P}px) translate3d(${r(T.bild.x * x)}px, ${r(T.bild.y * y - S.bildY * sy)}px, ${r(S.bildZ * p, 1)}px) rotateX(${r(T.bild.kippX * y + S.bildKipp * p, 3)}deg) rotateY(${r(-T.bild.kippY * x, 3)}deg)`;
      ({ x, y } = vorn);
      // In Ruhe auf ganze Pixel runden, damit Text nie zwischen zwei Pixeln steht (bleibt gestochen scharf)
      const t = raf || p > 0 ? r : Math.round;
      flug.style.transform = `perspective(${P}px) translate3d(${t(T.schrift.x * x)}px, ${t(T.schrift.y * y - S.schriftY * sy)}px, ${r(S.schriftZ * p, 1)}px) rotateX(${r(S.schriftKipp * p, 3)}deg)`;
      if (titel) titel.style.translate = `${t(T.titel.x * x)}px ${t(T.titel.y * y)}px`;
      if (amp) amp.style.translate = `${t(T.amp.x * x)}px ${t(T.amp.y * y)}px`;
      // Glut-Ebenen: Maus nach Tiefe, beim Scrollen steigen nahe Ebenen schneller
      ebenen.forEach(({ el, k }) => {
        const f = k < 0 ? hinten : vorn;
        el.style.transform = `translate3d(${r(k * f.x)}px, ${r(k * 0.7 * f.y - (0.1 + k / 60) * sy)}px, 0)`;
      });
      if (front) front.style.opacity = String(r(1 - clamp((p - 0.08) / 0.55, 0, 1), 3));
      if (dim) dim.style.opacity = String(r(0.65 * p, 3));
    };

    const schritt = (t) => {
      const dt = Math.min(0.032, (t - (zuletzt || t)) / 1000) || 1 / 60;
      zuletzt = t;
      // Gedämpfte Feder (semi-implizites Euler-Verfahren): a = k·(Ziel − Lage) − d·v
      const feder = (f, { steif, daempf }) => {
        f.vx += (steif * (zx - f.x) - daempf * f.vx) * dt;
        f.vy += (steif * (zy - f.y) - daempf * f.vy) * dt;
        f.x += f.vx * dt; f.y += f.vy * dt;
        const ruhig = Math.abs(f.vx) + Math.abs(f.vy) < 0.002 && Math.abs(zx - f.x) + Math.abs(zy - f.y) < 0.001;
        if (ruhig) { f.x = zx; f.y = zy; f.vx = f.vy = 0; }
        return ruhig;
      };
      const ruhig = feder(hinten, TIEFE.feder.hinten) & feder(vorn, TIEFE.feder.vorn);
      if (ruhig) { raf = 0; zuletzt = 0; }
      else raf = requestAnimationFrame(schritt);
      zeichne();
    };
    const anstossen = () => { if (!raf) raf = requestAnimationFrame(schritt); };

    if (feinerZeiger.matches) {
      // Erst reagieren, wenn die Maus wirklich bewegt wird: Browser melden beim Laden oft eine Position,
      // ohne dass jemand die Maus angefasst hat. Dann soll das Layout ruhig in der Mitte stehen.
      let erste = null;
      window.addEventListener('pointermove', (e) => {
        if (e.pointerType !== 'mouse' || p >= 1) return;
        if (!erste) { erste = { x: e.clientX, y: e.clientY, bewegt: false }; return; }
        if (!erste.bewegt) {
          if (Math.abs(e.clientX - erste.x) + Math.abs(e.clientY - erste.y) < 3) return;
          erste.bewegt = true;
        }
        zx = clamp((e.clientX / window.innerWidth) * 2 - 1, -1, 1);
        zy = clamp((e.clientY / window.innerHeight) * 2 - 1, -1, 1);
        anstossen();
      }, { passive: true });
      const zurueck = () => { zx = 0; zy = 0; anstossen(); };
      doc.addEventListener('mouseleave', zurueck);
      window.addEventListener('blur', zurueck);
    }
    window.addEventListener('resize', () => {
      H = hero.offsetHeight;
      P = parseFloat(getComputedStyle(hero).getPropertyValue('--tiefe-p')) || 1000;
      zeichne();
    }, { passive: true });

    return {
      scroll(fortschritt) {
        p = clamp(fortschritt, 0, 1);
        hero.classList.toggle('is-verdeckt', p > 0.995);
        if (!raf) zeichne();
      },
    };
  })();

  /* ---------- 4. Navigation: transparent über dem Bild, fest darunter, weg beim Runterscrollen ---------- */
  const nav = $('[data-nav]');
  const mobilleiste = $('[data-mobilleiste]');
  const stilBox = $('[data-stil-box]');
  const themeMeta = $('meta[name="theme-color"]');
  const HERO_FARBE = '#0B0908';
  let navFest = false;
  let letzteY = window.scrollY;
  let verdeckt = new Set(); // Bereiche, in denen die Mobilleiste stört (Reservierung, Footer)

  const themeFarbe = () => {
    const farbe = navFest ? getComputedStyle(doc).getPropertyValue('--bg').trim() : HERO_FARBE;
    if (themeMeta && farbe && themeMeta.content !== farbe) themeMeta.content = farbe;
  };

  let scrollRaf = 0;
  const beimScrollen = () => {
    scrollRaf = 0;
    const y = window.scrollY;
    const heroH = hero ? hero.offsetHeight : 0;
    const fest = y > heroH - nav.offsetHeight;
    if (fest !== navFest) { navFest = fest; nav.classList.toggle('is-fest', fest); themeFarbe(); }

    const delta = y - letzteY;
    const offen = document.querySelector('dialog[open]');
    if (y < heroH * 1.1 || delta < -6 || nav.matches(':focus-within') || offen) nav.classList.remove('is-weg');
    else if (delta > 6) nav.classList.add('is-weg');
    if (Math.abs(delta) > 6) letzteY = y;

    if (mobilleiste) mobilleiste.classList.toggle('is-sichtbar', y > heroH * 0.6 && verdeckt.size === 0);
    // Stil-Knopf erst nach dem Hero, damit er dort nichts verdeckt
    if (stilBox) stilBox.classList.toggle('is-sichtbar', y > heroH * 0.6);
  };
  window.addEventListener('scroll', () => { if (!scrollRaf) scrollRaf = requestAnimationFrame(beimScrollen); }, { passive: true });
  beimScrollen();

  if (mobilleiste && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((eintraege) => {
      eintraege.forEach((e) => (e.isIntersecting ? verdeckt.add(e.target) : verdeckt.delete(e.target)));
      beimScrollen();
    });
    ['#reservieren', '.footer'].forEach((s) => { const el = $(s); if (el) io.observe(el); });
  }

  // Aktiver Abschnitt in der Navigation
  const spyLinks = $$('[data-spy]');
  if (spyLinks.length && 'IntersectionObserver' in window) {
    const aktiv = new Set();
    const setze = () => {
      const id = [...aktiv].pop();
      spyLinks.forEach((a) => (a.getAttribute('href') === `#${id}` ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
    };
    const io = new IntersectionObserver((eintraege) => {
      eintraege.forEach((e) => (e.isIntersecting ? aktiv.add(e.target.id) : aktiv.delete(e.target.id)));
      setze();
    }, { rootMargin: '-45% 0px -50% 0px' });
    spyLinks.forEach((a) => { const el = $(a.getAttribute('href')); if (el) io.observe(el); });
  }

  /* ---------- 5. Menü (Dialog) ---------- */
  const menu = $('[data-menu]');
  const burger = $('[data-menu-open]');
  const menuZu = () => new Promise((fertig) => {
    if (!menu || !menu.open) return fertig();
    menu.classList.add('is-zu');
    menu.classList.remove('is-offen');
    setTimeout(() => {
      menu.close();
      menu.classList.remove('is-zu');
      burger?.setAttribute('aria-expanded', 'false');
      sperre(false);
      fertig();
    }, motion ? 300 : 200);
  });
  if (menu && burger && typeof menu.showModal === 'function') {
    $$('.menu__links a', menu).forEach((a, i) => a.style.setProperty('--i', i));
    burger.addEventListener('click', () => {
      if (menu.open) return;
      menu.showModal();
      sperre(true);
      burger.setAttribute('aria-expanded', 'true');
      // Zwei Frames: Startzustand malen lassen, dann aufziehen
      requestAnimationFrame(() => requestAnimationFrame(() => menu.classList.add('is-offen')));
    });
    $('[data-menu-close]', menu)?.addEventListener('click', () => menuZu());
    menu.addEventListener('cancel', (e) => { e.preventDefault(); menuZu(); });
    window.matchMedia('(min-width: 1000px)').addEventListener?.('change', (e) => { if (e.matches) menuZu(); });
  }

  // Alle Anker-Links: weich scrollen, Menü vorher schließen
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey) return;
    const id = a.getAttribute('href').slice(1);
    const ziel = id && document.getElementById(id);
    if (!ziel) return;
    e.preventDefault();
    const los = () => { scrollZu(ziel); history.replaceState(null, '', `#${id}`); };
    if (menu && menu.open) menuZu().then(los); else los();
  });

  /* ---------- 6. Einblenden beim Scrollen ---------- */
  const reveals = $$('[data-reveal]');
  if (motion && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((eintraege) => {
      // Was gleichzeitig ins Bild kommt, erscheint gestaffelt in Dokumentreihenfolge
      const rein = eintraege.filter((e) => e.isIntersecting).map((e) => e.target)
        .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
      rein.forEach((el, i) => {
        el.style.setProperty('--d', String(Math.min(i, 6) * 70));
        el.classList.add('is-in');
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-in'));
  }

  // Zahlen zählen hoch, wenn sie erscheinen
  const zaehler = $$('[data-count]');
  if (motion && zaehler.length && 'IntersectionObserver' in window) {
    const zaehle = (el) => {
      const ziel = parseInt(el.dataset.count, 10);
      if (!(ziel > 1)) return;
      const t0 = performance.now();
      const dauer = 1400;
      el.textContent = '0';
      const tick = (t) => {
        const p = clamp((t - t0) / dauer, 0, 1);
        el.textContent = String(Math.round(ziel * (1 - Math.pow(1 - p, 4))));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver((eintraege) => {
      eintraege.forEach((e) => { if (e.isIntersecting) { io.unobserve(e.target); setTimeout(() => zaehle(e.target), 250); } });
    }, { rootMargin: '0px 0px -12% 0px' });
    zaehler.forEach((el) => io.observe(el));
  }

  // Laufband nur animieren, wenn es zu sehen ist
  const band = $('.band');
  if (band && motion && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => band.classList.toggle('is-pausiert', !e.isIntersecting)).observe(band);
  }

  /* ---------- 7. Scroll-Effekte (GSAP) ---------- */
  const worteTeilen = (el) => {
    const worte = [];
    const gehe = (knoten) => {
      Array.from(knoten.childNodes).forEach((n) => {
        if (n.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((teil) => {
            if (!teil) return;
            if (/^\s+$/.test(teil)) { frag.appendChild(document.createTextNode(teil)); return; }
            const s = document.createElement('span');
            s.className = 'wort';
            s.textContent = teil;
            frag.appendChild(s);
            worte.push(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === Node.ELEMENT_NODE) gehe(n);
      });
    };
    gehe(el);
    return worte;
  };

  if (gsapAn) {
    // Hero: Das Blatt "Küche" schiebt sich darüber, die Ebenen trennen sich (Modul 3b „Tiefe“)
    const blatt = $('#kueche');
    if (hero && blatt && tiefe) {
      ScrollTrigger.create({
        trigger: blatt, start: 'top bottom', end: 'top top',
        onUpdate: (st) => tiefe.scroll(st.progress),
        onRefresh: (st) => tiefe.scroll(st.progress),
      });
    }

    // Leitsatz: Wort für Wort heller beim Lesen
    $$('[data-words]').forEach((el) => {
      const worte = worteTeilen(el);
      gsap.fromTo(worte, { opacity: 0.16 }, {
        opacity: 1, ease: 'none', stagger: 0.08,
        scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 42%', scrub: true },
      });
    });

    // Bilder bewegen sich langsamer als die Seite
    $$('[data-parallax]').forEach((wrap) => {
      const img = $('img', wrap);
      const staerke = clamp(parseFloat(wrap.dataset.parallax) || 0.1, 0, 0.15) * 50;
      gsap.fromTo(img, { yPercent: -staerke }, {
        yPercent: staerke, ease: 'none',
        scrollTrigger: { trigger: wrap, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });
    $$('[data-tiefe]').forEach((el) => {
      gsap.fromTo(el, { yPercent: 10 }, {
        yPercent: -10, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });
  }

  /* ---------- 8. Signature-Gerichte: horizontal ---------- */
  const hs = $('[data-hscroll]');
  if (hs) {
    const track = $('[data-hscroll-track]', hs);
    const viewport = $('[data-hscroll-viewport]', hs);
    const balken = $('[data-hscroll-bar]', hs);
    const zurueck = $('[data-hscroll-prev]', hs);
    const weiter = $('[data-hscroll-next]', hs);
    let gepinnt = null; // ScrollTrigger, wenn die Sektion festgehalten wird

    const zeigeFortschritt = (p) => {
      if (balken) balken.style.transform = `scaleX(${0.08 + clamp(p, 0, 1) * 0.92})`;
      if (zurueck) zurueck.disabled = p <= 0.001;
      if (weiter) weiter.disabled = p >= 0.999;
    };
    const schritt = () => {
      const karte = $('.dish-card', track);
      return karte ? karte.offsetWidth + parseFloat(getComputedStyle(track).columnGap || 0) : 300;
    };
    const blaettern = (richtung) => {
      if (gepinnt) {
        const y = clamp(window.scrollY + richtung * schritt(), gepinnt.start, gepinnt.end);
        if (lenis) lenis.scrollTo(y, { duration: 0.9 }); else window.scrollTo({ top: y, behavior: 'smooth' });
      } else {
        viewport.scrollBy({ left: richtung * schritt(), behavior: motion ? 'smooth' : 'auto' });
      }
    };
    zurueck?.addEventListener('click', () => blaettern(-1));
    weiter?.addEventListener('click', () => blaettern(1));
    viewport.addEventListener('scroll', () => {
      if (gepinnt) return;
      const max = viewport.scrollWidth - viewport.clientWidth;
      zeigeFortschritt(max > 0 ? viewport.scrollLeft / max : 1);
    }, { passive: true });
    zeigeFortschritt(0);

    if (gsapAn) {
      const mm = gsap.matchMedia();
      mm.add('(min-width: 1024px) and (min-height: 760px) and (hover: hover) and (pointer: fine)', () => {
        doc.classList.add('hs-aktiv');
        viewport.scrollLeft = 0;
        viewport.removeAttribute('tabindex'); // Seite scrollt, nicht die Leiste
        const strecke = () => {
          const rand = parseFloat(getComputedStyle(viewport).paddingLeft) || 0;
          return Math.max(0, rand + track.scrollWidth - window.innerWidth);
        };
        const fahrt = gsap.to(track, { x: () => -strecke(), ease: 'none' });
        gepinnt = ScrollTrigger.create({
          trigger: hs, start: 'top top', end: () => `+=${strecke()}`,
          pin: true, scrub: true, animation: fahrt, invalidateOnRefresh: true,
          onUpdate: (self) => zeigeFortschritt(self.progress),
        });
        $$('[data-hscroll-img]', track).forEach((img) => {
          gsap.fromTo(img, { xPercent: -5 }, {
            xPercent: 5, ease: 'none',
            scrollTrigger: { trigger: img.parentElement, containerAnimation: fahrt, start: 'left right', end: 'right left', scrub: true },
          });
        });
        return () => {
          doc.classList.remove('hs-aktiv');
          viewport.setAttribute('tabindex', '0');
          gepinnt = null;
          zeigeFortschritt(0);
        };
      });
    }
  }

  /* ---------- 9. Speisekarte: Tabs mit gleitendem Aktiv-Zustand ---------- */
  const tabs = $('[data-tabs]');
  let tabClip = () => {};
  if (tabs) {
    const liste = $('[data-tablist]', tabs);
    const knoepfe = $$('[role="tab"]', liste);
    const panels = knoepfe.map((b) => document.getElementById(b.getAttribute('aria-controls')));
    let aktuell = 0;

    // Kopie der Leiste in Aktiv-Farben; clip-path schneidet genau das aktive Tab frei
    const kopie = liste.cloneNode(true);
    ['role', 'aria-label', 'data-tablist'].forEach((a) => kopie.removeAttribute(a));
    kopie.setAttribute('aria-hidden', 'true');
    kopie.classList.add('tabs__list--aktiv');
    $$('button', kopie).forEach((b) => {
      ['id', 'role', 'aria-controls', 'aria-selected'].forEach((a) => b.removeAttribute(a));
      b.tabIndex = -1;
    });
    liste.after(kopie);

    tabClip = (sofort) => {
      const b = knoepfe[aktuell];
      const rechts = liste.offsetWidth - b.offsetLeft - b.offsetWidth;
      const unten = liste.offsetHeight - b.offsetTop - b.offsetHeight;
      if (sofort) kopie.style.transition = 'none';
      kopie.style.clipPath = `inset(${b.offsetTop}px ${rechts}px ${unten}px ${b.offsetLeft}px round 999px)`;
      if (sofort) { void kopie.offsetWidth; kopie.style.transition = ''; }
    };

    const aktiviere = (i, { animiert = false, fokus = false } = {}) => {
      aktuell = i;
      knoepfe.forEach((b, j) => {
        const an = i === j;
        b.setAttribute('aria-selected', String(an));
        b.tabIndex = an ? 0 : -1;
        panels[j].hidden = !an;
      });
      tabClip(!animiert || !motion);
      const p = panels[i];
      p.classList.remove('is-rein');
      if (animiert && motion) {
        $$('.dish', p).forEach((d, k) => d.style.setProperty('--i', k));
        void p.offsetWidth; // Animation neu starten
        p.classList.add('is-rein');
      }
      if (fokus) knoepfe[i].focus();
      neuMessen();
    };

    // Maus/Touch: mit Bewegung. Tastatur: sofort (wird oft und schnell benutzt)
    knoepfe.forEach((b, i) => b.addEventListener('click', (e) => { if (i !== aktuell) aktiviere(i, { animiert: e.detail > 0 }); }));
    liste.addEventListener('keydown', (e) => {
      const tasten = { ArrowRight: 1, ArrowLeft: -1, Home: 'erst', End: 'letzt' };
      if (!(e.key in tasten)) return;
      e.preventDefault();
      const t = tasten[e.key];
      const n = knoepfe.length;
      const ziel = t === 'erst' ? 0 : t === 'letzt' ? n - 1 : (aktuell + t + n) % n;
      aktiviere(ziel, { fokus: true });
    });
    aktiviere(0);
    if ('ResizeObserver' in window) new ResizeObserver(() => tabClip(true)).observe(liste);
    document.fonts?.ready.then(() => tabClip(true));
  }

  /* ---------- 10. Bildvorschau neben dem Mauszeiger (Feder statt starrem Folgen) ---------- */
  const vorschau = $('[data-vorschau]');
  const karte = $('#karte');
  if (vorschau && karte && motion && feinerZeiger.matches) {
    const bild = $('img', vorschau);
    const quellen = $$('[data-preview]', karte).map((d) => d.dataset.preview);
    let vorgeladen = false;
    const vorladen = () => { if (vorgeladen) return; vorgeladen = true; quellen.forEach((q) => { const i = new Image(); i.src = q; }); };
    new IntersectionObserver(([e]) => { if (e.isIntersecting) vorladen(); }, { rootMargin: '400px 0px' }).observe(karte);

    // Federn: Position (x, y), Größe (s) und Neigung aus der Geschwindigkeit
    const F = { steif: 180, daempf: 22 };
    let x = 0, y = 0, vx = 0, vy = 0, zx = 0, zy = 0;
    let s = 0.9, vs = 0, zs = 0.9;
    let an = false, raf = 0, zuletzt = 0, erstes = true;

    const frame = (t) => {
      const dt = Math.min(0.032, (t - (zuletzt || t)) / 1000) || 0.016;
      zuletzt = t;
      const ax = F.steif * (zx - x) - F.daempf * vx;
      const ay = F.steif * (zy - y) - F.daempf * vy;
      const as = F.steif * (zs - s) - F.daempf * vs;
      vx += ax * dt; vy += ay * dt; vs += as * dt;
      x += vx * dt; y += vy * dt; s += vs * dt;
      const neigung = clamp(vx * 0.012, -7, 7);
      vorschau.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${neigung}deg) scale(${s})`;
      const ruhig = Math.abs(vx) + Math.abs(vy) + Math.abs(vs) < 0.5 && Math.abs(zx - x) + Math.abs(zy - y) < 0.5;
      if (an || !ruhig) raf = requestAnimationFrame(frame);
      else { raf = 0; zuletzt = 0; }
    };
    const start = () => { if (!raf) raf = requestAnimationFrame(frame); };
    const ziel = (e) => {
      const w = vorschau.offsetWidth, h = vorschau.offsetHeight;
      let nx = e.clientX + 32;
      if (nx + w > window.innerWidth - 16) nx = e.clientX - w - 32;
      zx = nx;
      zy = clamp(e.clientY - h / 2, 16, window.innerHeight - h - 16);
      if (erstes) { x = zx; y = zy; erstes = false; }
    };

    karte.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') { ziel(e); if (an) start(); } }, { passive: true });
    karte.addEventListener('pointerover', (e) => {
      const d = e.target.closest('[data-preview]');
      if (!d || e.pointerType !== 'mouse') return;
      vorladen();
      if (bild.getAttribute('src') !== d.dataset.preview) bild.src = d.dataset.preview;
      if (!an) { ziel(e); if (!raf) { x = zx; y = zy; } }
      an = true; zs = 1;
      vorschau.classList.add('is-sichtbar');
      start();
    });
    karte.addEventListener('pointerout', (e) => {
      const d = e.target.closest('[data-preview]');
      if (!d || (e.relatedTarget && d.contains(e.relatedTarget))) return;
      an = false; zs = 0.9;
      vorschau.classList.remove('is-sichtbar');
      start();
    });
  }

  /* ---------- 11. Stimmen: Überblenden mit Weichzeichner ---------- */
  const zitate = $('[data-zitate]');
  const zitatNav = $('[data-zitate-nav]');
  if (zitate && zitatNav) {
    const items = $$('.zitat', zitate);
    const index = $('[data-zitat-index]', zitatNav);
    let akt = 0;
    const zeige = (i) => {
      akt = (i + items.length) % items.length;
      items.forEach((z, j) => z.classList.toggle('is-aktiv', j === akt));
      index.textContent = String(akt + 1);
    };
    zitate.classList.add('is-slider');
    zitatNav.hidden = false;
    $('[data-zitat-total]', zitatNav).textContent = String(items.length);
    zeige(0);
    $('[data-zitat-prev]', zitatNav).addEventListener('click', () => zeige(akt - 1));
    $('[data-zitat-next]', zitatNav).addEventListener('click', () => zeige(akt + 1));

    // Wischen: Strecke ODER Tempo reicht (ein kurzer Wisch soll genügen)
    let startX = 0, startT = 0, aktivId = null;
    zitate.addEventListener('pointerdown', (e) => { if (aktivId !== null) return; aktivId = e.pointerId; startX = e.clientX; startT = performance.now(); });
    const ende = (e) => {
      if (e.pointerId !== aktivId) return;
      aktivId = null;
      const dx = e.clientX - startX;
      const tempo = Math.abs(dx) / Math.max(1, performance.now() - startT);
      if (Math.abs(dx) > 50 || (tempo > 0.11 && Math.abs(dx) > 12)) zeige(akt + (dx < 0 ? 1 : -1));
    };
    zitate.addEventListener('pointerup', ende);
    zitate.addEventListener('pointercancel', () => { aktivId = null; });
  }

  /* ---------- 12. Galerie + Lightbox (öffnet aus dem Vorschaubild heraus) ---------- */
  const lb = $('[data-lightbox]');
  const links = $$('[data-galerie] a');
  if (lb && links.length && typeof lb.showModal === 'function') {
    const bild = $('[data-lightbox-img]', lb);
    const buehne = $('[data-lightbox-stage]', lb);
    const unterschrift = $('[data-lightbox-cap]', lb);
    const zaehlerEl = $('[data-lightbox-count]', lb);
    const RADIUS_END = 10;
    let idx = 0;
    let schliesst = false;

    const massAnpassen = (w, h) => {
      const cs = getComputedStyle(buehne);
      const pw = buehne.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const ph = buehne.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      const f = Math.min(pw / w, ph / h, 1);
      bild.style.width = `${Math.round(w * f)}px`;
      bild.style.height = `${Math.round(h * f)}px`;
    };
    const zeigeBild = (i) => {
      idx = (i + links.length) % links.length;
      const a = links[idx];
      const vorschauBild = $('img', a);
      bild.src = vorschauBild.currentSrc || vorschauBild.src; // sofort da (Cache), dann groß nachladen
      bild.alt = vorschauBild.alt;
      unterschrift.textContent = vorschauBild.alt;
      zaehlerEl.textContent = `${idx + 1} / ${links.length}`;
      massAnpassen(+a.dataset.w || 1400, +a.dataset.h || 933);
      const meins = idx;
      const gross = new Image();
      gross.src = a.href;
      (gross.decode ? gross.decode() : Promise.resolve()).then(() => { if (idx === meins) bild.src = a.href; }).catch(() => {});
    };
    // FLIP: vom Rechteck des Vorschaubilds (object-fit: cover) ins große Bild
    const vonVorschau = (T, F, radius) => {
      const s = Math.max(T.width / F.width, T.height / F.height);
      const dx = (T.left + T.width / 2) - (F.left + F.width / 2);
      const dy = (T.top + T.height / 2) - (F.top + F.height / 2);
      const ix = Math.max(0, (F.width - T.width / s) / 2);
      const iy = Math.max(0, (F.height - T.height / s) / 2);
      return [
        { transform: `translate(${dx}px, ${dy}px) scale(${s})`, clipPath: `inset(${iy}px ${ix}px round ${radius / s}px)` },
        { transform: 'translate(0, 0) scale(1)', clipPath: `inset(0px 0px round ${RADIUS_END}px)` },
      ];
    };
    const radiusVon = (el) => parseFloat(getComputedStyle(el.closest('.galerie__item')).borderTopLeftRadius) || 12;

    const oeffne = (i) => {
      schliesst = false;
      lb.showModal();
      sperre(true);
      zeigeBild(i);
      requestAnimationFrame(() => lb.classList.add('is-offen'));
      if (!motion) return;
      const t = $('img', links[idx]);
      bild.animate(vonVorschau(t.getBoundingClientRect(), bild.getBoundingClientRect(), radiusVon(t)), { duration: 440, easing: EASE_OUT });
    };
    const schliesse = () => {
      if (schliesst || !lb.open) return;
      schliesst = true;
      lb.classList.remove('is-offen');
      const t = $('img', links[idx]);
      const T = t.getBoundingClientRect();
      const sichtbar = T.bottom > 0 && T.top < window.innerHeight;
      const ende = () => { bild.getAnimations().forEach((an) => an.cancel()); lb.close(); sperre(false); schliesst = false; };
      if (!motion) { ende(); return; }
      const kf = sichtbar ? vonVorschau(T, bild.getBoundingClientRect(), radiusVon(t)).reverse() : [{ opacity: 1 }, { opacity: 0 }];
      bild.animate(kf, { duration: sichtbar ? 320 : 180, easing: EASE_OUT, fill: 'forwards' }).finished.then(ende, ende);
    };
    const blaettere = (richtung, animiert) => {
      if (!animiert || !motion) { zeigeBild(idx + richtung); return; }
      bild.getAnimations().forEach((an) => an.cancel());
      bild.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateX(${-richtung * 28}px)` }], { duration: 140, easing: 'ease-out' })
        .finished.then(() => {
          zeigeBild(idx + richtung);
          bild.animate([{ opacity: 0, transform: `translateX(${richtung * 28}px)` }, { opacity: 1, transform: 'none' }], { duration: 240, easing: EASE_OUT });
        }, () => {});
    };

    links.forEach((a, i) => a.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      oeffne(i);
    }));
    $('[data-lightbox-close]', lb).addEventListener('click', schliesse);
    $('[data-lightbox-prev]', lb).addEventListener('click', (e) => blaettere(-1, e.detail > 0));
    $('[data-lightbox-next]', lb).addEventListener('click', (e) => blaettere(1, e.detail > 0));
    lb.addEventListener('cancel', (e) => { e.preventDefault(); schliesse(); });
    lb.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); blaettere(1, false); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); blaettere(-1, false); }
    });
    let gewischt = false;
    buehne.addEventListener('click', (e) => { if (e.target === buehne && !gewischt) schliesse(); gewischt = false; });
    window.addEventListener('resize', () => { if (lb.open) massAnpassen(+links[idx].dataset.w, +links[idx].dataset.h); });

    let sx = 0, st = 0, sid = null;
    buehne.addEventListener('pointerdown', (e) => { if (sid !== null) return; sid = e.pointerId; sx = e.clientX; st = performance.now(); });
    buehne.addEventListener('pointerup', (e) => {
      if (e.pointerId !== sid) return;
      sid = null;
      const dx = e.clientX - sx;
      const tempo = Math.abs(dx) / Math.max(1, performance.now() - st);
      if (Math.abs(dx) > 60 || (tempo > 0.11 && Math.abs(dx) > 16)) { gewischt = true; blaettere(dx < 0 ? 1 : -1, true); }
    });
    buehne.addEventListener('pointercancel', () => { sid = null; });
  }

  /* ---------- 13. Öffnungszeiten: Live-Status und Grundlage für Reservierungszeiten ---------- */
  const TAGE = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  const TAGE_KURZ = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  const MONATE_KURZ = ['Jan', 'Feb', 'März', 'Apr', 'Mai', 'Juni', 'Juli', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

  const tabelle = $('[data-oeffnungszeiten]');
  const zone = tabelle?.dataset.zeitzone || undefined;
  const vorlauf = parseInt(tabelle?.dataset.letzteReservierung || '90', 10);
  const minuten = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + (m || 0); };
  const uhr = (m) => {
    const t = m === 1440 ? 1440 : ((m % 1440) + 1440) % 1440;
    return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
  };
  const zeiten = {};
  $$('tr[data-tag]', tabelle || document.createElement('table')).forEach((tr) => {
    zeiten[+tr.dataset.tag] = (tr.dataset.zeiten || '').split(',').map((r) => r.trim()).filter(Boolean).map((r) => {
      const [a, b] = r.split('-').map(minuten);
      return [a, b <= a ? b + 1440 : b]; // bis nach Mitternacht
    });
  });

  // Uhrzeit in der Zeitzone des Restaurants, egal wo der Gast gerade ist
  const jetztVorOrt = () => {
    const teile = {};
    try {
      new Intl.DateTimeFormat('en-GB', { timeZone: zone, weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
        .formatToParts(new Date()).forEach((p) => { teile[p.type] = p.value; });
    } catch (_) {
      const d = new Date();
      return { tag: d.getDay(), min: d.getHours() * 60 + d.getMinutes(), j: d.getFullYear(), m: d.getMonth() + 1, t: d.getDate() };
    }
    const wt = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[teile.weekday];
    return { tag: wt, min: (+teile.hour % 24) * 60 + +teile.minute, j: +teile.year, m: +teile.month, t: +teile.day };
  };

  const berechneStatus = () => {
    const { tag, min } = jetztVorOrt();
    const heute = zeiten[tag] || [];
    const gestern = (zeiten[(tag + 6) % 7] || []).map(([a, b]) => [a - 1440, b - 1440]);
    const offen = [...gestern, ...heute].find(([a, b]) => min >= a && min < b);
    if (offen) return { art: 'offen', text: `Jetzt geöffnet · bis ${uhr(offen[1])} Uhr` };
    const spaeter = heute.find(([a]) => a > min);
    if (spaeter) {
      const diff = spaeter[0] - min;
      return diff <= 60
        ? { art: 'bald', text: `Öffnet in ${diff} Min. · ${uhr(spaeter[0])} Uhr` }
        : { art: 'zu', text: `Geschlossen · öffnet heute ${uhr(spaeter[0])} Uhr` };
    }
    for (let i = 1; i <= 7; i += 1) {
      const t = (tag + i) % 7;
      if (zeiten[t] && zeiten[t].length) return { art: 'zu', text: `Geschlossen · öffnet ${i === 1 ? 'morgen' : TAGE[t]} ${uhr(zeiten[t][0][0])} Uhr` };
    }
    return { art: 'zu', text: 'Derzeit geschlossen' };
  };
  const zeigeStatus = () => {
    if (!tabelle) return;
    const { art, text } = berechneStatus();
    $$('[data-status]').forEach((el) => {
      el.classList.remove('is-offen', 'is-bald', 'is-zu');
      el.classList.add(`is-${art}`);
      const t = $('[data-status-text]', el);
      if (t) t.textContent = text;
    });
    const { tag } = jetztVorOrt();
    $$('tr[data-tag]', tabelle).forEach((tr) => tr.classList.toggle('is-heute', +tr.dataset.tag === tag));
  };
  zeigeStatus();
  setInterval(zeigeStatus, 60 * 1000);

  /* ---------- 14. Reservierung ---------- */
  const form = $('[data-buchung]');
  if (form) {
    const personen = $('#b-personen', form);
    const gruppeHinweis = $('[data-gruppe-hinweis]', form);
    const [minus, plus] = $$('[data-step]', form);
    const datumNativ = $('[data-datum]', form);
    const zeitNativ = $('[data-uhrzeit]', form);
    const datenWrap = $('[data-daten-wrap]', form);
    const datenBox = $('[data-daten]', form);
    const zeitenBox = $('[data-zeiten]', form);
    const summe = $('[data-summe]', form);
    const senden = $('[data-senden]', form);
    const danke = $('[data-danke]');
    const fehlerEl = (name) => $(`[data-fehler="${name}"]`, form);
    const MAX = parseInt(personen.max, 10) || 8;
    let versucht = false;

    // Personen
    const setzePersonen = (n, { hinweis = false } = {}) => {
      const roh = parseInt(n, 10);
      const wert = clamp(Number.isNaN(roh) ? 2 : roh, 1, MAX);
      personen.value = String(wert);
      minus.disabled = wert <= 1;
      gruppeHinweis.hidden = !(hinweis || roh > MAX);
      zeigeSumme();
    };
    $$('[data-step]', form).forEach((b) => b.addEventListener('click', () => {
      const n = parseInt(personen.value, 10) + parseInt(b.dataset.step, 10);
      setzePersonen(n, { hinweis: n > MAX });
    }));
    personen.addEventListener('change', () => setzePersonen(personen.value));

    // Datum: die nächsten drei Wochen als Auswahl, Ruhetage gesperrt
    const slotsFuer = (wochentag, abMin) => {
      const gruppen = [];
      (zeiten[wochentag] || []).forEach(([a, b]) => {
        const slots = [];
        for (let t = Math.ceil(a / 30) * 30; t <= b - vorlauf; t += 30) {
          if (abMin == null || t >= abMin + 60) slots.push(t);
        }
        if (slots.length) gruppen.push({ titel: a < 16 * 60 ? 'Mittag' : 'Abend', slots });
      });
      return gruppen;
    };
    const tage = [];
    const baueDaten = () => {
      const jetzt = jetztVorOrt();
      tage.length = 0;
      datenBox.textContent = '';
      for (let i = 0; i < 21; i += 1) {
        const d = new Date(Date.UTC(jetzt.j, jetzt.m - 1, jetzt.t + i));
        const wt = d.getUTCDay();
        const iso = d.toISOString().slice(0, 10);
        const gruppen = slotsFuer(wt, i === 0 ? jetzt.min : null);
        const ruhetag = !(zeiten[wt] && zeiten[wt].length);
        const frei = gruppen.length > 0;
        tage.push({ iso, wt, tagImMonat: d.getUTCDate(), monat: d.getUTCMonth(), gruppen });

        const label = document.createElement('label');
        label.className = 'chip';
        const oben = i === 0 ? 'Heute' : i === 1 ? 'Morgen' : TAGE_KURZ[wt];
        const unten = ruhetag ? 'Ruhetag' : !frei ? 'Voll' : MONATE_KURZ[d.getUTCMonth()];
        const beschreibung = `${oben === TAGE_KURZ[wt] ? '' : `${oben}, `}${TAGE[wt]}, ${d.getUTCDate()}. ${MONATE[d.getUTCMonth()]}${ruhetag ? ', Ruhetag' : !frei ? ', keine Zeiten mehr frei' : ''}`;
        label.innerHTML = `<input type="radio" name="datum-wahl" value="${iso}"${frei ? '' : ' disabled'}><span class="chip__face" aria-hidden="true"><span class="chip__klein">${oben}</span><span class="chip__gross">${d.getUTCDate()}</span><span class="chip__klein">${unten}</span></span>`;
        $('input', label).setAttribute('aria-label', beschreibung);
        datenBox.appendChild(label);
      }
    };
    const gewaehlterTag = () => tage.find((t) => t.iso === datumNativ.value);

    const baueZeiten = () => {
      const tag = gewaehlterTag();
      const vorher = zeitNativ.value;
      zeitenBox.textContent = '';
      if (!tag) {
        zeitenBox.innerHTML = '<p class="zeiten-leer">Bitte zuerst ein Datum wählen.</p>';
        return;
      }
      tag.gruppen.forEach((g) => {
        const gruppe = document.createElement('div');
        gruppe.className = 'zeiten-gruppe';
        gruppe.innerHTML = `<p class="zeiten-gruppe__titel">${g.titel}</p><div class="chips chips--zeiten"></div>`;
        const box = $('.chips', gruppe);
        g.slots.forEach((t) => {
          const l = document.createElement('label');
          l.className = 'chip';
          l.innerHTML = `<input type="radio" name="uhrzeit-wahl" value="${uhr(t)}"><span class="chip__face">${uhr(t)}</span>`;
          box.appendChild(l);
        });
        zeitenBox.appendChild(gruppe);
      });
      // Gewählte Zeit behalten, wenn es sie am neuen Tag auch gibt
      const gleiche = $(`input[value="${vorher}"]`, zeitenBox);
      if (gleiche) gleiche.checked = true; else zeitNativ.value = '';
    };

    const zeigeSumme = () => {
      const tag = gewaehlterTag();
      const n = parseInt(personen.value, 10) || 2;
      const p = `${n} ${n === 1 ? 'Person' : 'Personen'}`;
      if (!tag) { summe.textContent = `Bitte Datum wählen · ${p}`; return; }
      const d = `${TAGE[tag.wt]}, ${tag.tagImMonat}. ${MONATE[tag.monat]}`;
      summe.textContent = zeitNativ.value ? `${d} · ${zeitNativ.value} Uhr · ${p}` : `${d} · Uhrzeit wählen · ${p}`;
    };

    datenBox.addEventListener('change', (e) => {
      if (e.target.name !== 'datum-wahl') return;
      datumNativ.value = e.target.value;
      baueZeiten();
      zeigeSumme();
      if (versucht) pruefe();
    });
    zeitenBox.addEventListener('change', (e) => {
      if (e.target.name !== 'uhrzeit-wahl') return;
      zeitNativ.value = e.target.value;
      zeigeSumme();
      if (versucht) pruefe();
    });

    const initAuswahl = () => {
      baueDaten();
      const erster = $('input:not(:disabled)', datenBox);
      if (erster) { erster.checked = true; datumNativ.value = erster.value; }
      zeitNativ.value = '';
      baueZeiten();
      zeigeSumme();
    };
    // Mit JS: Auswahl-Chips statt nativer Felder
    datenWrap.hidden = false;
    zeitenBox.hidden = false;
    datumNativ.tabIndex = -1;
    zeitNativ.tabIndex = -1;
    datumNativ.setAttribute('aria-hidden', 'true');
    zeitNativ.setAttribute('aria-hidden', 'true');
    initAuswahl();
    setzePersonen(personen.value);

    // Prüfen: Meldung direkt am Feld, Fokus auf das erste Problem
    const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const markiere = (name, feld, ok) => {
      const f = fehlerEl(name);
      if (f) f.hidden = ok;
      if (feld) feld.setAttribute('aria-invalid', String(!ok));
      return ok;
    };
    const pruefe = () => {
      const probleme = [];
      const name = form.elements.name;
      const email = form.elements.email;
      const ds = form.elements.datenschutz;
      if (!markiere('datum', null, !!datumNativ.value)) probleme.push($('input:not(:disabled)', datenBox));
      if (!markiere('uhrzeit', null, !!zeitNativ.value)) probleme.push($('input', zeitenBox));
      if (!markiere('name', name, name.value.trim().length > 1)) probleme.push(name);
      if (!markiere('email', email, EMAIL.test(email.value.trim()))) probleme.push(email);
      if (!markiere('datenschutz', ds, ds.checked)) probleme.push(ds);
      return probleme.filter(Boolean)[0] || null;
    };
    form.addEventListener('input', () => { if (versucht) pruefe(); });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      versucht = true;
      const problem = pruefe();
      if (problem) { problem.focus({ preventScroll: false }); return; }

      fehlerEl('senden').hidden = true;
      form.classList.add('is-laedt');
      senden.disabled = true;
      senden.setAttribute('aria-busy', 'true');
      const daten = new FormData(form);
      daten.delete('datum-wahl');
      daten.delete('uhrzeit-wahl');
      const ziel = (form.dataset.endpoint || '').trim();
      try {
        if (ziel) {
          const antwort = await fetch(ziel, { method: 'POST', body: daten, headers: { Accept: 'application/json' } });
          if (!antwort.ok) throw new Error(`HTTP ${antwort.status}`);
        } else {
          await new Promise((r) => setTimeout(r, 1100)); // Demo: so tun, als ob
        }
        zeigeDanke(!ziel);
      } catch (_) {
        fehlerEl('senden').hidden = false;
      } finally {
        form.classList.remove('is-laedt');
        senden.disabled = false;
        senden.removeAttribute('aria-busy');
      }
    });

    const zeigeDanke = (demo) => {
      const tag = gewaehlterTag();
      const n = parseInt(personen.value, 10);
      const vorname = form.elements.name.value.trim().split(/\s+/)[0];
      $('[data-danke-name]', danke).textContent = vorname ? `, ${vorname}` : '';
      $('[data-danke-text]', danke).textContent =
        `Wir haben Ihre Anfrage für ${TAGE[tag.wt]}, ${tag.tagImMonat}. ${MONATE[tag.monat]} um ${zeitNativ.value} Uhr für ${n} ${n === 1 ? 'Person' : 'Personen'} erhalten. Die Bestätigung kommt per E-Mail an ${form.elements.email.value.trim()}.`;
      $('[data-danke-demo]', danke).hidden = !demo;
      form.hidden = true;
      danke.hidden = false;
      danke.focus({ preventScroll: true });
      const box = danke.closest('.buchung');
      if (box && box.getBoundingClientRect().top < 0) scrollZu(box, { fokus: false });
      neuMessen();
    };
    $('[data-neu]', danke)?.addEventListener('click', () => {
      form.reset();
      versucht = false;
      $$('.feld-fehler', form).forEach((f) => { f.hidden = true; });
      $$('[aria-invalid]', form).forEach((f) => f.removeAttribute('aria-invalid'));
      danke.hidden = true;
      form.hidden = false;
      initAuswahl();
      setzePersonen(2);
      form.elements.name.focus();
      neuMessen();
    });

    // Anlässe: "Anfragen" trägt den Anlass schon in die Anmerkung ein
    const notiz = $('[data-notiz]', form);
    $$('[data-anlass]').forEach((a) => a.addEventListener('click', () => {
      const text = `Anfrage: ${a.dataset.anlass}. `;
      if (notiz && !notiz.value.includes(text.trim())) notiz.value = text + notiz.value;
    }));
  }

  /* ---------- 15. Demo-Stil: Farben, Schrift und Hero-Bild wechseln ---------- */
  const STILE = {
    glut: { hero: 'innen', alt: 'Der Gastraum am Abend: dunkles Holz, warmes Licht und gedeckte Tische', fokus: '50% 55%' },
    salon: { hero: 'salon', alt: 'Heller Gastraum mit roten Polstern, Holztischen und offener Küche', fokus: '50% 50%' },
    terrasse: { hero: 'terrasse', alt: 'Terrasse am See mit hellen Stühlen, Sonnensegel und Blick aufs Wasser', fokus: '50% 62%' },
  };
  const HERO_PFAD = '../../restaurant/assets/img/hero/';
  const MITTEL_PFAD = 'img/'; // mittel weichgezeichnete Kopien (Schärfentiefe), siehe NOTIZ.md
  const hochformat = window.matchMedia('(max-aspect-ratio: 4/5)');
  const heroDateien = (n) => ({
    hoch: `${HERO_PFAD}${n}-hoch.webp`,
    srcset: `${HERO_PFAD}${n}-800.webp 800w, ${HERO_PFAD}${n}-1400.webp 1400w, ${HERO_PFAD}${n}-2000.webp 2000w`,
    src: `${HERO_PFAD}${n}-1400.webp`,
    weich: `${HERO_PFAD}${n}-weich.webp`,
    weichHoch: `${HERO_PFAD}${n}-weich-hoch.webp`,
    mittel: `${MITTEL_PFAD}${n}-mittel.webp`,
    mittelHoch: `${MITTEL_PFAD}${n}-mittel-hoch.webp`,
  });
  const dekodiert = (img) => new Promise((fertig) => {
    const timer = setTimeout(fertig, 4000);
    (img.decode ? img.decode() : Promise.resolve()).then(() => { clearTimeout(timer); fertig(); }, () => { clearTimeout(timer); fertig(); });
  });
  const ladeHero = (n) => {
    const f = heroDateien(n);
    const img = new Image();
    const mittel = new Image();
    if (hochformat.matches) { img.src = f.hoch; mittel.src = f.mittelHoch; }
    else { img.sizes = heroImg?.sizes || '100vw'; img.srcset = f.srcset; img.src = f.src; mittel.src = f.mittel; }
    return Promise.all([dekodiert(img), dekodiert(mittel)]);
  };
  const setzeHero = (stil) => {
    const cfg = STILE[stil];
    const f = heroDateien(cfg.hero);
    const scharf = $('[data-hero-pic="scharf"]');
    const weich = $('[data-hero-pic="weich"]');
    if (!scharf || !weich) return;
    $('source', scharf).srcset = f.hoch;
    const s = $('img', scharf);
    s.srcset = f.srcset;
    s.src = f.src;
    s.alt = cfg.alt;
    $('source', weich).srcset = f.weichHoch;
    $('img', weich).src = f.weich;
    const mittel = $('[data-hero-pic="mittel"]');
    if (mittel) { $('source', mittel).srcset = f.mittelHoch; $('img', mittel).src = f.mittel; }
    hero.style.setProperty('--hero-fokus', cfg.fokus);
  };
  const stilKnoepfe = $$('[data-stil-set]');
  const markiereStil = (stil) => stilKnoepfe.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.stilSet === stil)));
  const nachStilwechsel = () => {
    themeFarbe();
    document.fonts?.ready.then(() => { tabClip(true); if (hasGSAP) ScrollTrigger.refresh(); });
  };
  let stilLaeuft = false;
  const wechsleStil = async (stil, knopf) => {
    if (!STILE[stil] || stilLaeuft || doc.dataset.stil === stil) return;
    stilLaeuft = true;
    markiereStil(stil);
    knopf?.setAttribute('aria-busy', 'true');
    await ladeHero(STILE[stil].hero);
    knopf?.removeAttribute('aria-busy');
    const anwenden = () => { doc.dataset.stil = stil; setzeHero(stil); };
    if (motion && document.startViewTransition) {
      try { await document.startViewTransition(anwenden).finished; } catch (_) { anwenden(); }
    } else anwenden();
    try { localStorage.setItem('sg-stil', stil); } catch (_) { /* privater Modus */ }
    nachStilwechsel();
    stilLaeuft = false;
  };
  // Beim Laden gespeicherten Stil übernehmen (Farben setzt schon das Skript im <head>)
  if (doc.dataset.stil && doc.dataset.stil !== 'glut' && STILE[doc.dataset.stil]) setzeHero(doc.dataset.stil);
  markiereStil(doc.dataset.stil || 'glut');
  stilKnoepfe.forEach((b) => b.addEventListener('click', () => wechsleStil(b.dataset.stilSet, b)));

  const stil = $('[data-stil-box]');
  const stilToggle = $('[data-stil-toggle]');
  if (stil && stilToggle) {
    let offenBeiY = 0;
    const setzeOffen = (auf) => {
      stil.classList.toggle('is-offen', auf);
      stilToggle.setAttribute('aria-expanded', String(auf));
      offenBeiY = window.scrollY;
    };
    // Beim Weiterscrollen zuklappen, damit das Panel keinen Inhalt verdeckt
    window.addEventListener('scroll', () => { if (stil.classList.contains('is-offen') && Math.abs(window.scrollY - offenBeiY) > 160) setzeOffen(false); }, { passive: true });
    stilToggle.addEventListener('click', () => setzeOffen(!stil.classList.contains('is-offen')));
    document.addEventListener('pointerdown', (e) => { if (!stil.contains(e.target)) setzeOffen(false); });
    stil.addEventListener('keydown', (e) => { if (e.key === 'Escape') { setzeOffen(false); stilToggle.focus(); } });
  }

  /* ---------- 16. Aufräumen: Maße neu messen, wenn Schriften und Bilder da sind ---------- */
  if (hasGSAP) {
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    window.addEventListener('load', () => ScrollTrigger.refresh());
  }
})();
