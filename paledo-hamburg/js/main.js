/* Paledo – Café & Deli · Entwurf im Aurel-Design · main.js
   Progressive Enhancement: Ohne JavaScript, ohne GSAP/Lenis oder mit "Bewegung reduzieren" ist die Seite
   vollständig sichtbar und bedienbar. Alles steckt in einer IIFE, es gibt keine Globals.
   1. Grundlagen  2. Weiches Scrollen & Anker  3. Hero-Intro  4. Navigation  5. Menü-Dialog
   6. Einblenden  7. Scroll-Effekte (GSAP)  8. Bowl-Baukasten  9. Öffnungszeiten  10. Aufräumen */
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
  const ROEMISCH = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  const neuMessen = () => { if (hasGSAP) ScrollTrigger.refresh(); };
  const neuStarten = (el, klasse) => { el.classList.remove(klasse); void el.offsetWidth; el.classList.add(klasse); };

  // Texte der Oberfläche: Deutsch (index.html) oder Englisch (en.html mit <html lang="en">)
  const TEXT = doc.lang === 'en' ? {
    locale: 'en-GB',
    wort: { base: ['base', 'bases'], dressing: ['dressing', 'dressings'], topping: ['topping', 'toppings'], extra: ['extra', 'extras'] },
    gewaehlt: (n) => `${n} selected`, optional: 'optional',
    vonMax: (n, max) => `${n} of ${max}${n >= max ? ', that’s the limit' : ''}`,
    ueber: (n, mehr, p) => `${n} selected, ${mehr} × ${p} extra`,
    inkl: (n, frei, p) => `${n} of ${frei} included${p ? `, each extra ${p}` : ''}`,
    warm: 'Warm', kalt: 'Cold', mit: 'with', extra: 'extra', leer: 'Still empty – start with a base.', schritt: 'Step',
    teilenText: 'My bowl at Paledo:', teilenTitel: 'My Paledo bowl', kopiert: 'Copied', teilen: 'Share bowl',
    tage: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], morgen: 'tomorrow',
    zeit: (h, m) => `${h % 12 || 12}${m ? `:${String(m).padStart(2, '0')}` : ''} ${h < 12 ? 'am' : 'pm'}`,
    offen: (z) => `Open now · until ${z}`, bald: (d, z) => `Opens in ${d} min · ${z}`, heute: (z) => `Opens today at ${z}`,
    wieder: (tag, z) => `Opens again ${tag} at ${z}`, zu: 'Closed for now',
  } : {
    locale: 'de-DE',
    wort: { base: ['Base', 'Bases'], dressing: ['Dressing', 'Dressings'], topping: ['Topping', 'Toppings'], extra: ['Extra', 'Extras'] },
    gewaehlt: (n) => `${n} gewählt`, optional: 'optional',
    vonMax: (n, max) => `${n} von ${max}${n >= max ? ', mehr geht nicht' : ''}`,
    ueber: (n, mehr, p) => `${n} gewählt, ${mehr} × ${p} extra`,
    inkl: (n, frei, p) => `${n} von ${frei} inklusive${p ? `, jede weitere ${p}` : ''}`,
    warm: 'Warm', kalt: 'Kalt', mit: 'mit', extra: 'extra', leer: 'Noch leer – fang mit einer Base an.', schritt: 'Schritt',
    teilenText: 'Meine Bowl bei Paledo:', teilenTitel: 'Meine Paledo-Bowl', kopiert: 'Kopiert', teilen: 'Bowl teilen',
    tage: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'], morgen: 'morgen',
    zeit: (h, m) => `${h}${m ? `:${String(m).padStart(2, '0')}` : ''} Uhr`,
    offen: (z) => `Jetzt geöffnet · bis ${z}`, bald: (d, z) => `Öffnet in ${d} Min. · ${z}`, heute: (z) => `Öffnet heute ab ${z}`,
    wieder: (tag, z) => `Öffnet wieder ${tag} ab ${z}`, zu: 'Derzeit geschlossen',
  };

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
  const verdeckt = new Set(); // Bereiche, in denen die Handy-Leiste stört (Footer)
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
    ['.fuss'].forEach((s) => { const el = $(s); if (el) io.observe(el); });
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

  /* ---------- 8. Bowl-Baukasten: Zutaten wählen, Preis rechnen, Foto im Bogen ---------- */
  const menue = $('[data-menue]');
  const konfig = $('[data-konfig]');
  const liste = $('[data-gaenge]');
  const wert = (ctx, name) => ($(`input[name="${name}"]:checked`, ctx) || {}).value;
  const cent = (s) => Math.round(parseFloat(s || '0') * 100);
  const euro = (c) => new Intl.NumberFormat(TEXT.locale, { style: 'currency', currency: 'EUR' }).format(c / 100);
  if (menue && konfig && liste) {
    const schritte = $$('.gang', liste);
    const summeText = $('[data-summe-text]', menue);
    const summeListe = $('[data-summe-liste]', menue);
    const anzahl = (n, art) => `${n} ${TEXT.wort[art][n === 1 ? 0 : 1]}`;
    const gewaehlt = (s) => $$('input:checked', s);

    const zaehlerText = (s) => {
      const n = gewaehlt(s).length;
      const frei = parseInt(s.dataset.frei || '0', 10);
      const max = parseInt(s.dataset.max || '0', 10);
      const auf = cent(s.dataset.aufpreis);
      if (s.dataset.schritt === 'extra') return `· ${n ? TEXT.gewaehlt(n) : TEXT.optional}`;
      if (max) return `· ${TEXT.vonMax(n, max)}`;
      const mehr = Math.max(0, n - frei);
      if (mehr) return `· ${TEXT.ueber(n, mehr, euro(auf))}`;
      return `· ${TEXT.inkl(n, frei, auf ? euro(auf) : '')}`;
    };

    const rechne = () => {
      let preis = cent(konfig.dataset.grundpreis);
      const teile = {};
      schritte.forEach((s) => {
        const art = s.dataset.schritt;
        const inputs = gewaehlt(s);
        teile[art] = inputs.map((i) => i.value);
        if (art === 'extra') inputs.forEach((i) => { preis += cent(i.dataset.preis); });
        else preis += Math.max(0, inputs.length - parseInt(s.dataset.frei || '0', 10)) * cent(s.dataset.aufpreis);
      });
      const getraenk = $('input[name="getraenk"]:checked', konfig);
      preis += cent(getraenk?.dataset.preis);
      return { preis, teile, getraenk: getraenk && getraenk.value !== 'ohne' ? getraenk.value : '', temperatur: wert(konfig, 'temperatur') === 'warm' ? TEXT.warm : TEXT.kalt };
    };

    // Höchstzahl (z. B. zwei Dressings): übrige Zutaten sperren, solange das Maximum erreicht ist
    const begrenze = (s) => {
      const max = parseInt(s.dataset.max || '0', 10);
      if (!max) return;
      const voll = gewaehlt(s).length >= max;
      $$('input', s).forEach((i) => { if (!i.checked) i.disabled = voll; });
    };

    let stand = null;
    const zeigeSumme = (anim) => {
      stand = rechne();
      const { preis, teile, getraenk, temperatur } = stand;
      const mengen = ['base', 'dressing', 'topping'].map((a) => anzahl((teile[a] || []).length, a)).join(', ');
      const extras = (teile.extra || []).length ? ` + ${anzahl(teile.extra.length, 'extra')}` : '';
      summeText.textContent = `${temperatur} · ${mengen}${extras}${getraenk ? ` · ${TEXT.mit} ${getraenk}` : ''} · ${euro(preis)}`;
      const gruppen = ['base', 'dressing', 'topping'].map((a) => (teile[a] || []).join(', ')).filter(Boolean);
      if ((teile.extra || []).length) gruppen.push(`${TEXT.extra} ${teile.extra.join(', ')}`);
      summeListe.textContent = gruppen.length ? gruppen.join(' · ') : TEXT.leer;
      schritte.forEach((s) => { const z = $('[data-zaehler]', s); if (z) z.textContent = zaehlerText(s); });
      if (anim && motion) neuStarten(summeText, 'is-neu');
    };

    // Foto im Bogen neben der Karte
    const bogen = $('[data-menue-bogen]');
    const [imgA, imgB] = bogen ? $$('[data-bogen-img]', bogen) : [];
    const nrEl = bogen && $('[data-bogen-nr]', bogen);
    const nameEl = bogen && $('[data-bogen-name]', bogen);
    let vorne = imgA;
    let wunsch = 0;
    let aktiver = null;
    const aktiviere = (s) => {
      if (!s || s === aktiver) return;
      aktiver = s;
      schritte.forEach((x) => x.classList.toggle('is-aktiv', x === s));
      if (!bogen || bogen.offsetParent === null) return; // auf dem Handy ausgeblendet: nichts laden
      nrEl.textContent = `${TEXT.schritt} ${ROEMISCH[schritte.indexOf(s)] || ''}`;
      nameEl.textContent = s.dataset.bildName || $('.gang__name', s).textContent.trim();
      const src = s.dataset.bild;
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
      schritte.forEach((s) => io.observe(s));
    }
    schritte.forEach((s) => {
      s.addEventListener('pointerenter', () => { if (feinerZeiger.matches) aktiviere(s); });
      s.addEventListener('change', () => { begrenze(s); aktiviere(s); zeigeSumme(true); });
      begrenze(s);
    });
    konfig.addEventListener('change', () => zeigeSumme(true));
    zeigeSumme(false);
    aktiviere(schritte[0]);

    // "Bowl teilen": Teilen-Menü des Geräts, sonst in die Zwischenablage
    const teilen = $('[data-teilen]', menue);
    const kannTeilen = typeof navigator.share === 'function';
    if (teilen && (kannTeilen || navigator.clipboard)) {
      teilen.hidden = false;
      const knopfText = $('[data-teilen-text]', teilen);
      let zurueck = 0;
      teilen.addEventListener('click', () => {
        const text = `${TEXT.teilenText} ${summeListe.textContent} (${euro(stand.preis)})`;
        const url = `${location.href.split('#')[0]}#bowls`;
        if (kannTeilen) { navigator.share({ title: TEXT.teilenTitel, text, url }).catch(() => {}); return; }
        navigator.clipboard.writeText(`${text} ${url}`).then(() => {
          knopfText.textContent = TEXT.kopiert;
          clearTimeout(zurueck);
          zurueck = setTimeout(() => { knopfText.textContent = TEXT.teilen; }, 2000);
        }, () => {});
      });
    }
  }

  /* ---------- 9. Öffnungszeiten: Live-Status ---------- */
  const tabelle = $('[data-oeffnungszeiten]');
  const zone = tabelle?.dataset.zeitzone || undefined;
  const minuten = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + (m || 0); };
  const uhr = (m) => { const t = ((m % 1440) + 1440) % 1440; return TEXT.zeit(Math.floor(t / 60), t % 60); };
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
    if (offen) return { art: 'offen', text: TEXT.offen(uhr(offen[1])) };
    const spaeter = heute.find(([a]) => a > min);
    if (spaeter) {
      const diff = spaeter[0] - min;
      return diff <= 60 ? { art: 'bald', text: TEXT.bald(diff, uhr(spaeter[0])) } : { art: 'zu', text: TEXT.heute(uhr(spaeter[0])) };
    }
    for (let i = 1; i <= 7; i += 1) {
      const t = (tag + i) % 7;
      if (zeiten[t] && zeiten[t].length) return { art: 'zu', text: TEXT.wieder(i === 1 ? TEXT.morgen : TEXT.tage[t], uhr(zeiten[t][0][0])) };
    }
    return { art: 'zu', text: TEXT.zu };
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

  /* ---------- 10. Aufräumen: Maße neu messen, wenn Schriften und Bilder da sind ---------- */
  if (document.fonts?.ready) document.fonts.ready.then(neuMessen);
  window.addEventListener('load', neuMessen, { once: true });
})();
