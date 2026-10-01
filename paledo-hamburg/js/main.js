/* Aurel — Degustationsrestaurant · Demo-Design "Fine Dining" · main.js
   Progressive Enhancement: Ohne JavaScript, ohne GSAP/Lenis oder mit "Bewegung reduzieren" ist die Seite
   vollständig sichtbar und bedienbar. Alles steckt in einer IIFE, es gibt keine Globals.
   1. Grundlagen  2. Weiches Scrollen & Anker  3. Hero-Intro  4. Navigation  5. Menü-Dialog
   6. Einblenden  7. Scroll-Effekte (GSAP)  8. Menü-Konfigurator  9. Öffnungszeiten  10. Reservierung  11. Aufräumen */
(() => {
  'use strict';

  /* ---------- 1. Grundlagen ---------- */
  const doc = document.documentElement;
  doc.classList.add('js-ok'); // Sicherheitsnetz im <head> weiß damit: Skript läuft
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const motion = doc.classList.contains('motion');
  const feinerZeiger = window.matchMedia('(hover: hover) and (pointer: fine)');
  const hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  const gsapAn = motion && hasGSAP;
  const EASE_IN_OUT = 'cubic-bezier(.77,0,.175,1)';
  const ROEMISCH = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  const neuMessen = () => { if (hasGSAP) ScrollTrigger.refresh(); };
  const neuStarten = (el, klasse) => { el.classList.remove(klasse); void el.offsetWidth; el.classList.add(klasse); };

  if (hasGSAP) {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
  }
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener?.('change', () => location.reload());
  const jahr = $('[data-jahr]');
  if (jahr) jahr.textContent = String(new Date().getFullYear());

  /* ---------- 2. Weiches Scrollen (nur Maus/Trackpad) & Anker-Links ---------- */
  let lenis = null;
  if (gsapAn && typeof window.Lenis !== 'undefined' && feinerZeiger.matches) {
    lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  let sperren = 0;
  const sperre = (an) => {
    sperren = Math.max(0, sperren + (an ? 1 : -1));
    doc.style.overflow = sperren ? 'hidden' : '';
    if (lenis) (sperren ? lenis.stop() : lenis.start());
  };
  const nav = $('[data-nav]');
  const scrollZu = (el, { fokus = true, dauer = 1.6 } = {}) => {
    if (!el) return;
    const oben = el.id === 'top';
    const versatz = el.matches('section, main') ? 0 : -((nav?.offsetHeight || 0) + 24);
    if (lenis) lenis.scrollTo(oben ? 0 : el, { offset: versatz, duration: dauer, easing: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2) });
    else if (oben) window.scrollTo({ top: 0, behavior: motion ? 'smooth' : 'auto' });
    else el.scrollIntoView({ behavior: motion ? 'smooth' : 'auto', block: 'start' });
    if (!fokus) return;
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
  };

  /* ---------- 3. Hero-Intro: CSS-Animation, startet, sobald das Bild dekodiert ist ---------- */
  const hero = $('[data-hero]');
  const heroImg = $('[data-hero-img]');
  const bereit = () => doc.classList.add('is-ready');
  if (!motion || !heroImg) {
    bereit();
  } else {
    const notfall = setTimeout(bereit, 1200); // langsames Netz: das Intro läuft trotzdem
    const fertig = () => { clearTimeout(notfall); requestAnimationFrame(bereit); };
    const dekodieren = () => (heroImg.decode ? heroImg.decode().then(fertig, fertig) : fertig());
    if (heroImg.complete && heroImg.naturalWidth) dekodieren();
    else {
      heroImg.addEventListener('load', dekodieren, { once: true });
      heroImg.addEventListener('error', fertig, { once: true });
    }
  }

  /* ---------- 4. Navigation: Fläche nach dem ersten Scrollen, weg beim Runterscrollen, Handy-Leiste ---------- */
  const leiste = $('[data-leiste]');
  const menu = $('[data-menu]');
  let letzteY = window.scrollY;
  const verdeckt = new Set(); // Bereiche, in denen die Handy-Leiste stört (Reservierung, Footer)
  let scrollRaf = 0;
  const beimScrollen = () => {
    scrollRaf = 0;
    const y = window.scrollY;
    const heroH = hero ? hero.offsetHeight : 0;
    nav.classList.toggle('is-fest', y > 8);
    const delta = y - letzteY;
    if (y < heroH * 0.85 || delta < -6 || nav.matches(':focus-within') || menu?.open) nav.classList.remove('is-weg');
    else if (delta > 6) nav.classList.add('is-weg');
    if (Math.abs(delta) > 6) letzteY = y;
    if (leiste) leiste.classList.toggle('is-sichtbar', y > heroH * 0.7 && verdeckt.size === 0);
  };
  window.addEventListener('scroll', () => { if (!scrollRaf) scrollRaf = requestAnimationFrame(beimScrollen); }, { passive: true });
  beimScrollen();
  if (leiste && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((eintraege) => {
      eintraege.forEach((e) => (e.isIntersecting ? verdeckt.add(e.target) : verdeckt.delete(e.target)));
      beimScrollen();
    });
    ['#reservierung', '.fuss'].forEach((s) => { const el = $(s); if (el) io.observe(el); });
  }
  // Aktiver Abschnitt
  const spyLinks = $$('[data-spy]');
  if (spyLinks.length && 'IntersectionObserver' in window) {
    const aktiv = new Set();
    const io = new IntersectionObserver((eintraege) => {
      eintraege.forEach((e) => (e.isIntersecting ? aktiv.add(e.target.id) : aktiv.delete(e.target.id)));
      const id = [...aktiv].pop();
      spyLinks.forEach((a) => (a.getAttribute('href') === `#${id}` ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
    }, { rootMargin: '-45% 0px -50% 0px' });
    spyLinks.forEach((a) => { const el = $(a.getAttribute('href')); if (el) io.observe(el); });
  }

  /* ---------- 5. Menü (Dialog) ---------- */
  const burger = $('[data-menu-auf]');
  const menuZu = () => new Promise((fertig) => {
    if (!menu || !menu.open) { fertig(); return; }
    menu.classList.remove('is-offen');
    setTimeout(() => {
      menu.close();
      burger?.setAttribute('aria-expanded', 'false');
      sperre(false);
      fertig();
    }, motion ? 300 : 0);
  });
  if (menu && burger && typeof menu.showModal === 'function') {
    $$('.menu__links li', menu).forEach((li, i) => li.style.setProperty('--i', i));
    burger.addEventListener('click', () => {
      if (menu.open) return;
      menu.showModal();
      sperre(true);
      burger.setAttribute('aria-expanded', 'true');
      requestAnimationFrame(() => requestAnimationFrame(() => menu.classList.add('is-offen')));
    });
    $('[data-menu-zu]', menu)?.addEventListener('click', () => { menuZu().then(() => burger.focus()); });
    menu.addEventListener('cancel', (e) => { e.preventDefault(); menuZu().then(() => burger.focus()); });
  }
  // Alle Anker-Links: Menü erst schließen, dann weich scrollen und den Fokus mitnehmen
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey) return;
    const id = a.getAttribute('href').slice(1);
    const ziel = id && document.getElementById(id);
    if (!ziel) return;
    e.preventDefault();
    menuZu().then(() => {
      scrollZu(ziel);
      if (history.replaceState) history.replaceState(null, '', `#${id}`);
    });
  });

  /* ---------- 6. Einblenden beim Scrollen ---------- */
  // Leitsätze: in Wörter mit eigener Maske teilen (Kursives bleibt erhalten)
  const teileWorte = (el) => {
    const gehe = (knoten) => {
      Array.from(knoten.childNodes).forEach((n) => {
        if (n.nodeType === 1) { gehe(n); return; }
        if (n.nodeType !== 3) return;
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((t) => {
          if (!t) return;
          if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(t)); return; }
          const w = document.createElement('span');
          w.className = 'wort';
          const innen = document.createElement('span');
          innen.textContent = t;
          w.appendChild(innen);
          frag.appendChild(w);
        });
        n.replaceWith(frag);
      });
    };
    gehe(el);
  };
  const zeilenVerzoegern = (el) => {
    const worte = $$('.wort', el);
    let zeile = -1; let oben = null; let inZeile = 0;
    worte.forEach((w) => {
      const t = Math.round(w.offsetTop);
      if (oben === null || Math.abs(t - oben) > 4) { zeile += 1; oben = t; inZeile = 0; }
      w.firstChild.style.setProperty('--d', `${zeile * 110 + inZeile * 22}ms`);
      inZeile += 1;
    });
  };
  const zeilen = $$('[data-zeilen]');
  if (motion) zeilen.forEach(teileWorte);

  const reveals = $$('[data-reveal], [data-zeilen]');
  if (motion && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((eintraege) => {
      const neu = eintraege.filter((e) => e.isIntersecting).map((e) => e.target);
      neu.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top || a.getBoundingClientRect().left - b.getBoundingClientRect().left);
      neu.forEach((el, i) => {
        if (el.hasAttribute('data-zeilen')) zeilenVerzoegern(el);
        else el.style.setProperty('--d', `${Math.min(i, 6) * 80}ms`);
        el.classList.add('is-in');
        io.unobserve(el);
      });
    }, { threshold: 0, rootMargin: '0px 0px -10% 0px' });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------- 7. Scroll-Effekte (GSAP, nur mit Bewegung) ---------- */
  if (gsapAn) {
    // Hero: Foto sinkt langsamer als die Seite, die Schrift steigt etwas schneller – beide Fassungen gleich
    if (hero) {
      const st = { trigger: hero, start: 'top top', end: 'bottom top', scrub: true, invalidateOnRefresh: true };
      gsap.to('[data-hero-tiefe]', { yPercent: 8, ease: 'none', scrollTrigger: st });
      gsap.to('[data-hero-schrift]', { y: () => -window.innerHeight * 0.12, ease: 'none', scrollTrigger: { ...st } });
    }
    // Bilder mit leichter Parallaxe im Rahmen
    $$('[data-parallax]').forEach((img) => {
      const f = parseFloat(img.dataset.parallax) || 0.08;
      gsap.fromTo(img, { yPercent: -f * 50 }, {
        yPercent: f * 50, ease: 'none',
        scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });
    // Der Salon: Bühne bleibt stehen, der Bogen öffnet sich bis zum Bildrand
    const raum = $('[data-raum]');
    if (raum) {
      const mm = gsap.matchMedia();
      mm.add('(min-width: 900px) and (min-height: 560px)', () => {
        raum.classList.add('raum--pin');
        const bild = $('[data-raum-bild]', raum);
        const text = $('[data-raum-text]', raum);
        const bogen = () => {
          const r = Math.round(window.innerWidth * 0.14 + 24);
          return `inset(13% 36% 9% 36% round ${r}px ${r}px 0px 0px)`;
        };
        gsap.set(text, { xPercent: -50 });
        const tl = gsap.timeline({
          scrollTrigger: { trigger: raum, start: 'top top', end: '+=120%', scrub: 0.6, pin: true, anticipatePin: 1, invalidateOnRefresh: true },
        });
        tl.fromTo(bild, { clipPath: bogen }, { clipPath: 'inset(0% 0% 0% 0% round 0px 0px 0px 0px)', ease: 'power1.inOut', duration: 1 }, 0)
          .fromTo($('img', bild), { scale: 1.14 }, { scale: 1, ease: 'none', duration: 1 }, 0)
          .fromTo(text, { autoAlpha: 0, y: 36 }, { autoAlpha: 1, y: 0, ease: 'power2.out', duration: 0.35 }, 0.62);
        return () => { raum.classList.remove('raum--pin'); gsap.set(text, { clearProps: 'all' }); };
      });
    }
  }

  /* ---------- 8. Menü-Konfigurator: Umfang, Küche, Begleitung, Summe, Foto im Bogen ---------- */
  const menue = $('[data-menue]');
  const konfig = $('[data-konfig]');
  const liste = $('[data-gaenge]');
  const buchungForm = $('[data-buchung]');
  const wert = (ctx, name) => ($(`input[name="${name}"]:checked`, ctx) || {}).value;
  const preisVon = (ctx, prefix = '') => {
    const u = wert(ctx, `${prefix}umfang`) || '7';
    const menuePreis = parseInt($(`input[name="umfang"][value="${u}"]`, konfig)?.dataset.preis || '0', 10);
    const b = wert(ctx, `${prefix}begleitung`) || 'ohne';
    const bInput = $(`input[name="begleitung"][value="${b}"]`, konfig);
    const begleitPreis = bInput ? parseInt(bInput.getAttribute(`data-preis-${u}`) || '0', 10) : 0;
    return { u, b, menuePreis, begleitPreis, summe: menuePreis + begleitPreis };
  };
  if (menue && konfig && liste) {
    const gaenge = $$('.gang', liste);
    const extra = gaenge.filter((g) => g.hasAttribute('data-nur7'));
    const summeBox = $('.summe', menue);
    const summeText = $('[data-summe-text]', menue);
    const sichtbar = () => gaenge.filter((g) => !g.hidden);
    const BEGLEITUNG_TEXT = { wein: 'mit Weinbegleitung', frei: 'mit alkoholfreier Begleitung', ohne: 'ohne Begleitung' };

    const zeigeSumme = (anim) => {
      const p = preisVon(konfig);
      const veg = wert(konfig, 'kueche') === 'vegetarisch' ? ' vegetarisch' : '';
      summeText.textContent = `${p.u} Gänge${veg} ${BEGLEITUNG_TEXT[p.b]} · ${p.summe} € pro Person`;
      if (anim && motion) neuStarten(summeText, 'is-neu');
      // Begleitungspreise an den Knöpfen passend zum Umfang
      const reihe = $('input[name="begleitung"]', konfig).closest('.wahl__reihe');
      const inputs = $$('input[name="begleitung"]', reihe);
      const labels = $$('.wahl__opt', reihe);
      const invers = $$('.wahl__invers > span', reihe);
      inputs.forEach((inp, j) => {
        const preis = parseInt(inp.getAttribute(`data-preis-${p.u}`) || '0', 10);
        if (!preis) return;
        [labels[j], invers[j]].forEach((el) => { const s = el && $('[data-preis-anzeige]', el); if (s) s.textContent = `+ ${preis} €`; });
      });
    };

    // FLIP: Positionen merken, ändern, von der alten Position aus sanft an die neue gleiten (nur transform)
    const flip = (aendern) => {
      const els = [...sichtbar(), summeBox].filter(Boolean);
      const vorher = new Map(els.map((el) => [el, el.getBoundingClientRect().top]));
      aendern();
      const bewegt = [];
      els.forEach((el) => {
        if (el.hidden) return;
        const dy = vorher.get(el) - el.getBoundingClientRect().top;
        if (Math.abs(dy) < 1) return;
        el.style.transition = 'none';
        el.style.transform = `translateY(${dy}px)`;
        bewegt.push(el);
      });
      if (!bewegt.length) return;
      void liste.offsetWidth;
      bewegt.forEach((el) => {
        el.style.transition = `transform 300ms ${EASE_IN_OUT}`;
        el.style.transform = '';
      });
      setTimeout(() => bewegt.forEach((el) => { el.style.transition = ''; }), 340);
    };

    let umfang = wert(konfig, 'umfang');
    let lauf = 0;
    const setzeUmfang = (u) => {
      if (u === umfang) return;
      umfang = u;
      const meiner = ++lauf;
      const fuenf = u === '5';
      if (!motion) {
        extra.forEach((g) => { g.hidden = fuenf; });
        nachUmfang();
        return;
      }
      if (fuenf) {
        extra.forEach((g) => g.classList.add('is-weg'));
        setTimeout(() => {
          if (meiner !== lauf) return;
          flip(() => extra.forEach((g) => { g.hidden = true; g.classList.remove('is-weg'); }));
          nachUmfang();
        }, 180);
      } else {
        flip(() => extra.forEach((g) => { g.classList.remove('is-weg'); g.hidden = false; g.classList.add('is-kommt'); }));
        requestAnimationFrame(() => extra.forEach((g) => g.classList.add('is-kommt-an')));
        setTimeout(() => { if (meiner === lauf) extra.forEach((g) => g.classList.remove('is-kommt', 'is-kommt-an')); }, 420);
        nachUmfang();
      }
    };
    const nachUmfang = () => {
      if (motion) neuStarten(liste, 'is-neu-gezaehlt');
      zeigeSumme(true);
      if (aktiverGang && aktiverGang.hidden) aktiviere(sichtbar()[0]);
      else aktiviere(aktiverGang, { erzwingen: true });
      neuMessen();
    };

    // Foto im Bogen neben der Karte
    const bogen = $('[data-menue-bogen]');
    const [imgA, imgB] = bogen ? $$('[data-bogen-img]', bogen) : [];
    const nrEl = bogen && $('[data-bogen-nr]', bogen);
    const nameEl = bogen && $('[data-bogen-name]', bogen);
    let vorne = imgA;
    let wunsch = 0;
    let aktiverGang = gaenge[0];
    const nameVon = (g, veg) => {
      const teil = $(veg ? '.gang__name .gang__vegetarisch' : '.gang__name .gang__klassisch', g);
      return (teil || $('.gang__name', g)).textContent.trim();
    };
    const aktiviere = (g, { erzwingen = false } = {}) => {
      if (!g || g.hidden || (!erzwingen && g === aktiverGang && g.classList.contains('is-aktiv'))) return;
      aktiverGang = g;
      gaenge.forEach((x) => x.classList.toggle('is-aktiv', x === g));
      if (!bogen || bogen.offsetParent === null) return; // auf dem Handy ausgeblendet: nichts laden
      const veg = wert(konfig, 'kueche') === 'vegetarisch';
      nrEl.textContent = `Gang ${ROEMISCH[sichtbar().indexOf(g)] || ''}`;
      const src = (veg && g.dataset.bildVeg) || g.dataset.bild;
      // Bildunterschrift: eigener Text, wenn das Foto nicht den Gang zeigt (z. B. die Weinbegleitung)
      nameEl.textContent = (src === g.dataset.bild && g.dataset.bildName) || nameVon(g, veg);
      if (!src || vorne.getAttribute('src') === src) return;
      const hinten = vorne === imgA ? imgB : imgA;
      const meiner = ++wunsch;
      hinten.loading = 'eager';
      hinten.setAttribute('src', src);
      const tauschen = () => {
        if (meiner !== wunsch) return;
        hinten.classList.add('is-an');
        vorne.classList.remove('is-an');
        vorne = hinten;
      };
      (hinten.decode ? hinten.decode() : Promise.resolve()).then(tauschen, tauschen);
    };
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((eintraege) => {
        eintraege.forEach((e) => { if (e.isIntersecting) aktiviere(e.target); });
      }, { rootMargin: '-38% 0px -52% 0px' });
      gaenge.forEach((g) => io.observe(g));
    }
    gaenge.forEach((g) => {
      g.addEventListener('pointerenter', () => { if (feinerZeiger.matches) aktiviere(g); });
    });

    konfig.addEventListener('change', (e) => {
      const n = e.target.name;
      if (n === 'umfang') setzeUmfang(e.target.value);
      else {
        if (motion) neuStarten(liste, 'is-wechsel');
        zeigeSumme(true);
        if (n === 'kueche') aktiviere(aktiverGang, { erzwingen: true });
        neuMessen();
      }
    });
    zeigeSumme(false);
    aktiviere(gaenge[0], { erzwingen: true });

    // "Mit diesem Menü anfragen": Auswahl ins Reservierungsformular übernehmen
    $('[data-menue-uebernehmen]', menue)?.addEventListener('click', () => {
      if (!buchungForm) return;
      const setze = (name, value) => {
        const r = $(`input[name="${name}"][value="${value}"]`, buchungForm);
        if (r && !r.checked) { r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true })); }
      };
      setze('b-umfang', wert(konfig, 'umfang'));
      setze('b-kueche', wert(konfig, 'kueche'));
      setze('b-begleitung', wert(konfig, 'begleitung'));
    });
  }

  /* ---------- 9. Öffnungszeiten: Live-Status und Grundlage für die Reservierungszeiten ---------- */
  const TAGE = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  const TAGE_KURZ = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  const MONATE_KURZ = ['Jan', 'Feb', 'März', 'Apr', 'Mai', 'Juni', 'Juli', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
  const tabelle = $('[data-oeffnungszeiten]');
  const zone = tabelle?.dataset.zeitzone || undefined;
  const einlass = parseInt(tabelle?.dataset.einlass || '60', 10);
  const minuten = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + (m || 0); };
  const uhr = (m) => { const t = ((m % 1440) + 1440) % 1440; return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; };
  const zeiten = {};
  $$('tr[data-tag]', tabelle || document.createElement('table')).forEach((tr) => {
    zeiten[+tr.dataset.tag] = (tr.dataset.zeiten || '').split(',').map((r) => r.trim()).filter(Boolean).map((r) => {
      const [a, b] = r.split('-').map(minuten);
      return [a, b <= a ? b + 1440 : b];
    });
  });
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
      return diff <= 60 ? { art: 'bald', text: `Öffnet in ${diff} Min. · ${uhr(spaeter[0])} Uhr` } : { art: 'zu', text: `Heute ab ${uhr(spaeter[0])} Uhr geöffnet` };
    }
    for (let i = 1; i <= 7; i += 1) {
      const t = (tag + i) % 7;
      if (zeiten[t] && zeiten[t].length) return { art: 'zu', text: `Geschlossen · wieder ${i === 1 ? 'morgen' : TAGE[t]} ab ${uhr(zeiten[t][0][0])} Uhr` };
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

  /* ---------- 10. Reservierung ---------- */
  if (buchungForm) {
    const form = buchungForm;
    const datumNativ = $('[data-datum]', form);
    const zeitNativ = $('[data-uhrzeit]', form);
    const datenBox = $('[data-daten]', form);
    const zeitenBox = $('[data-zeiten]', form);
    const summe = $('[data-buchung-summe]', form);
    const senden = $('[data-senden]', form);
    const danke = $('[data-danke]');
    const fehlerEl = (name) => $(`[data-fehler="${name}"]`, form);
    const TAGE_VORAUS = 28;
    let versucht = false;
    const beruehrt = new Set();

    const slotsFuer = (wochentag, abMin) => {
      const out = [];
      (zeiten[wochentag] || []).forEach(([a, b]) => {
        for (let t = a; t <= a + einlass && t < b; t += 30) {
          if (abMin == null || t >= abMin + 120) out.push({ t, teil: a < 16 * 60 ? 'Mittag' : 'Abend' });
        }
      });
      return out;
    };
    const tage = [];
    const baueDaten = () => {
      const jetzt = jetztVorOrt();
      tage.length = 0;
      datenBox.textContent = '';
      for (let i = 0; i < TAGE_VORAUS; i += 1) {
        const d = new Date(Date.UTC(jetzt.j, jetzt.m - 1, jetzt.t + i));
        const wt = d.getUTCDay();
        const slots = slotsFuer(wt, i === 0 ? jetzt.min : null);
        if (!slots.length) continue; // Ruhetage und vergangene Zeiten gar nicht erst anbieten
        const iso = d.toISOString().slice(0, 10);
        tage.push({ iso, wt, tagImMonat: d.getUTCDate(), monat: d.getUTCMonth(), slots });
        const label = document.createElement('label');
        label.className = 'chip';
        const oben = i === 0 ? 'Heute' : i === 1 ? 'Morgen' : TAGE_KURZ[wt];
        label.innerHTML = `<input type="radio" name="datum-wahl" value="${iso}"><span class="chip__flaeche" aria-hidden="true"><span class="chip__klein">${oben}</span><span class="chip__gross">${d.getUTCDate()}</span><span class="chip__klein">${MONATE_KURZ[d.getUTCMonth()]}</span></span>`;
        $('input', label).setAttribute('aria-label', `${i < 2 ? `${oben}, ` : ''}${TAGE[wt]}, ${d.getUTCDate()}. ${MONATE[d.getUTCMonth()]}`);
        datenBox.appendChild(label);
      }
    };
    const gewaehlterTag = () => tage.find((t) => t.iso === datumNativ.value);
    const baueZeiten = () => {
      const tag = gewaehlterTag();
      const vorher = zeitNativ.value;
      zeitenBox.textContent = '';
      if (!tag) { zeitenBox.innerHTML = '<p class="zeiten-leer">Bitte zuerst einen Abend wählen.</p>'; return; }
      const mehrereTeile = new Set(tag.slots.map((s) => s.teil)).size > 1;
      tag.slots.forEach(({ t, teil }) => {
        const l = document.createElement('label');
        l.className = 'chip';
        l.innerHTML = `<input type="radio" name="uhrzeit-wahl" value="${uhr(t)}"><span class="chip__flaeche">${mehrereTeile ? `<span class="chip__klein">${teil}</span>` : ''}${uhr(t)} Uhr</span>`;
        zeitenBox.appendChild(l);
      });
      const gleiche = $(`input[value="${vorher}"]`, zeitenBox);
      if (gleiche) gleiche.checked = true; else zeitNativ.value = '';
    };
    const personen = () => parseInt(wert(form, 'personen') || '2', 10);
    const BEGL = { wein: 'mit Weinbegleitung', frei: 'alkoholfrei begleitet', ohne: 'Begleitung am Abend wählen' };
    const zeigeSumme = () => {
      const tag = gewaehlterTag();
      const n = personen();
      const p = preisVon(form, 'b-');
      const veg = wert(form, 'b-kueche') === 'vegetarisch' ? ' vegetarisch' : '';
      const menueTeil = `${p.u} Gänge${veg}, ${BEGL[p.b] || ''}`;
      const richtwert = `Richtwert ${p.summe * n} € für ${n === 1 ? 'eine Person' : `${n} Personen`}`;
      if (!tag) { summe.textContent = `Bitte wählen Sie einen Abend · ${menueTeil}`; return; }
      const d = `${TAGE[tag.wt]}, ${tag.tagImMonat}. ${MONATE[tag.monat]}`;
      summe.textContent = zeitNativ.value ? `${d} · ${zeitNativ.value} Uhr · ${menueTeil} · ${richtwert}` : `${d} · bitte Uhrzeit wählen · ${menueTeil}`;
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
    form.addEventListener('change', (e) => { if (/^(personen|b-)/.test(e.target.name)) zeigeSumme(); });

    const initAuswahl = () => {
      baueDaten();
      // Ersten freien Abend vorwählen, damit die Uhrzeiten gleich sichtbar sind
      const erster = $('input', datenBox);
      if (erster) erster.checked = true;
      datumNativ.value = erster ? erster.value : '';
      zeitNativ.value = '';
      baueZeiten();
      zeigeSumme();
    };
    // Mit JS: Auswahl-Kacheln statt nativer Felder
    datenBox.hidden = false;
    zeitenBox.hidden = false;
    [datumNativ, zeitNativ].forEach((f) => { f.hidden = true; f.tabIndex = -1; });
    initAuswahl();

    // Prüfen: Meldung direkt am Feld, beim Verlassen eines Feldes und nach dem ersten Absenden bei jeder Eingabe
    const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const regeln = {
      datum: () => !!datumNativ.value,
      uhrzeit: () => !!zeitNativ.value,
      name: () => form.elements.name.value.trim().length > 1,
      email: () => EMAIL.test(form.elements.email.value.trim()),
      telefon: () => form.elements.telefon.value.replace(/\D/g, '').length >= 6,
      storno: () => form.elements.storno.checked,
      datenschutz: () => form.elements.datenschutz.checked,
    };
    const feldFuer = {
      datum: () => $('input', datenBox), uhrzeit: () => $('input', zeitenBox),
      name: () => form.elements.name, email: () => form.elements.email, telefon: () => form.elements.telefon,
      storno: () => form.elements.storno, datenschutz: () => form.elements.datenschutz,
    };
    const markiere = (name) => {
      const ok = regeln[name]();
      const f = fehlerEl(name);
      if (f) f.hidden = ok;
      const feld = feldFuer[name]();
      if (feld && !['datum', 'uhrzeit'].includes(name)) feld.setAttribute('aria-invalid', String(!ok));
      return ok;
    };
    const pruefe = () => {
      let erstes = null;
      Object.keys(regeln).forEach((name) => { if (!markiere(name) && !erstes) erstes = feldFuer[name](); });
      return erstes;
    };
    ['name', 'email', 'telefon'].forEach((name) => {
      const feld = form.elements[name];
      feld.addEventListener('blur', () => { if (feld.value.trim()) beruehrt.add(name); if (beruehrt.has(name) || versucht) markiere(name); });
      feld.addEventListener('input', () => { if (beruehrt.has(name) || versucht) markiere(name); });
    });
    ['storno', 'datenschutz'].forEach((name) => form.elements[name].addEventListener('change', () => { if (versucht) markiere(name); }));

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      versucht = true;
      const problem = pruefe();
      if (problem) {
        problem.focus({ preventScroll: true });
        scrollZu(problem.closest('.feld-gruppe, .feld-wrap, .haken') || problem, { fokus: false, dauer: 0.8 });
        return;
      }
      fehlerEl('senden').hidden = true;
      form.classList.add('is-laedt');
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
          await new Promise((r) => setTimeout(r, 900)); // Demo: nichts wird versendet
        }
        zeigeDanke(!ziel);
      } catch (_) {
        fehlerEl('senden').hidden = false;
      } finally {
        form.classList.remove('is-laedt');
        senden.removeAttribute('aria-busy');
      }
    });

    const zeigeDanke = (demo) => {
      const tag = gewaehlterTag();
      const n = personen();
      const vorname = form.elements.name.value.trim().split(/\s+/)[0];
      const mail = form.elements.email.value.trim();
      const wann = `${TAGE[tag.wt]}, ${tag.tagImMonat}. ${MONATE[tag.monat]} um ${zeitNativ.value} Uhr für ${n === 1 ? 'eine Person' : `${n} Personen`}`;
      $('[data-danke-name]', danke).textContent = vorname ? `, ${vorname}` : '';
      $('[data-danke-text]', danke).textContent = demo
        ? `So sähe es im Livebetrieb aus: Ihre Anfrage für ${wann} ginge jetzt an das Restaurant, die Bestätigung käme per E-Mail an ${mail}.`
        : `Ihre Anfrage für ${wann} ist bei uns angekommen. Wir bestätigen Ihren Tisch per E-Mail an ${mail}.`;
      $('[data-danke-demo]', danke).hidden = !demo;
      form.hidden = true;
      danke.hidden = false;
      danke.focus({ preventScroll: true });
      const box = danke.closest('.buchung');
      if (box && box.getBoundingClientRect().top < 0) scrollZu(box, { fokus: false, dauer: 0.8 });
      neuMessen();
    };
    $('[data-neu]', danke)?.addEventListener('click', () => {
      form.reset();
      versucht = false;
      beruehrt.clear();
      $$('.feld-fehler', form).forEach((f) => { f.hidden = true; });
      $$('[aria-invalid]', form).forEach((f) => f.removeAttribute('aria-invalid'));
      danke.hidden = true;
      form.hidden = false;
      initAuswahl();
      form.elements.name.focus();
      neuMessen();
    });
  }

  /* ---------- 11. Aufräumen: Maße neu messen, wenn Schriften und Bilder da sind ---------- */
  if (document.fonts?.ready) document.fonts.ready.then(neuMessen);
  window.addEventListener('load', neuMessen, { once: true });
})();
