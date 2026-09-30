/* Trattoria da Rosella — Demo · main.js
   Progressive Enhancement: Ohne JS, ohne GSAP oder mit „Bewegung reduzieren“ ist die Seite
   vollständig sichtbar und bedienbar. Alles steckt in einer IIFE, es gibt keine Globals.
   1. Grundlagen  2. Hero-Intro  3. Navigation  4. Menü  5. Einblenden  6. Scroll-Effekte (GSAP)
   7. Speisekarte  8. Öffnungszeiten  9. Mittagstisch  10. Wäscheleine  11. Reservierung  12. Aufräumen */
(() => {
  'use strict';

  /* ---------- 1. Grundlagen ---------- */
  const doc = document.documentElement;
  doc.classList.add('skript-da'); // für das Sicherheitsnetz im <head>
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const motion = doc.classList.contains('motion'); // gesetzt im <head>
  const feinerZeiger = window.matchMedia('(hover: hover) and (pointer: fine)');
  const hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  const gsapAn = motion && hasGSAP;

  if (hasGSAP) {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
  }
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener?.('change', () => location.reload());

  const jahr = $('[data-jahr]');
  if (jahr) jahr.textContent = String(new Date().getFullYear());

  // Scrollsperre für Dialoge
  const sperre = (an) => { doc.style.overflow = an ? 'hidden' : ''; };

  /* ---------- 2. Hero-Intro: startet, sobald das Foto dekodiert ist ---------- */
  const heroImg = $('[data-hero-img]');
  const bereit = () => doc.classList.add('is-ready');
  if (!motion || !heroImg) {
    bereit();
  } else {
    const notfall = setTimeout(bereit, 1200); // langsames Netz: Intro läuft trotzdem
    const fertig = () => { clearTimeout(notfall); requestAnimationFrame(bereit); };
    const dekodieren = () => (heroImg.decode ? heroImg.decode().then(fertig, fertig) : fertig());
    if (heroImg.complete && heroImg.naturalWidth) dekodieren();
    else {
      heroImg.addEventListener('load', dekodieren, { once: true });
      heroImg.addEventListener('error', fertig, { once: true });
    }
  }

  /* ---------- 3. Navigation: fest beim Scrollen, weg beim Runterscrollen, aktiver Abschnitt ---------- */
  const nav = $('[data-nav]');
  const hero = $('[data-hero]');
  const mobilleiste = $('[data-mobilleiste]');
  const verdeckt = new Set(); // Bereiche, in denen die Mobilleiste stört
  let letzteY = window.scrollY;
  let navFest = null;
  let scrollRaf = 0;

  const beimScrollen = () => {
    scrollRaf = 0;
    const y = window.scrollY;
    const heroH = hero ? hero.offsetHeight : 0;
    const fest = y > 24;
    if (fest !== navFest) { navFest = fest; nav.classList.toggle('is-fest', fest); }
    const delta = y - letzteY;
    const offen = document.querySelector('dialog[open]');
    if (y < heroH * 0.8 || delta < -6 || nav.matches(':focus-within') || offen) nav.classList.remove('is-weg');
    else if (delta > 6) nav.classList.add('is-weg');
    if (Math.abs(delta) > 6) letzteY = y;
    if (mobilleiste) mobilleiste.classList.toggle('is-sichtbar', y > heroH * 0.55 && verdeckt.size === 0);
  };
  window.addEventListener('scroll', () => { if (!scrollRaf) scrollRaf = requestAnimationFrame(beimScrollen); }, { passive: true });
  beimScrollen();

  if (mobilleiste && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((eintraege) => {
      eintraege.forEach((e) => (e.isIntersecting ? verdeckt.add(e.target) : verdeckt.delete(e.target)));
      beimScrollen();
    });
    ['#reservieren', '.fuss'].forEach((s) => { const el = $(s); if (el) io.observe(el); });
  }

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

  /* ---------- 4. Menü (Dialog, Handy und Tablet) ---------- */
  const menu = $('[data-menu]');
  const burger = $('[data-menu-auf]');
  const menuZu = () => new Promise((fertig) => {
    if (!menu || !menu.open) { fertig(); return; }
    menu.classList.add('is-zu');
    menu.classList.remove('is-offen');
    setTimeout(() => {
      menu.close();
      menu.classList.remove('is-zu');
      burger?.setAttribute('aria-expanded', 'false');
      sperre(false);
      fertig();
    }, motion ? 230 : 200);
  });
  if (menu && burger && typeof menu.showModal === 'function') {
    $$('.menu__links a', menu).forEach((a, i) => a.style.setProperty('--i', i));
    burger.addEventListener('click', () => {
      if (menu.open) return;
      menu.showModal();
      sperre(true);
      burger.setAttribute('aria-expanded', 'true');
      requestAnimationFrame(() => requestAnimationFrame(() => menu.classList.add('is-offen')));
    });
    $('[data-menu-zu]', menu)?.addEventListener('click', () => { menuZu().then(() => burger.focus()); });
    menu.addEventListener('cancel', (e) => { e.preventDefault(); menuZu().then(() => burger.focus()); });
    $$('.menu__links a', menu).forEach((a) => a.addEventListener('click', (e) => {
      const ziel = $(a.getAttribute('href'));
      if (!ziel) return;
      e.preventDefault();
      menuZu().then(() => {
        ziel.scrollIntoView({ behavior: motion ? 'smooth' : 'auto', block: 'start' });
        if (!ziel.hasAttribute('tabindex')) ziel.setAttribute('tabindex', '-1');
        ziel.focus({ preventScroll: true });
      });
    }));
    window.matchMedia('(min-width: 1061px)').addEventListener?.('change', (m) => { if (m.matches) menuZu(); });
  }

  // Sprunglinks: Fokus ans Ziel mitnehmen (Tastatur, Screenreader)
  $$('a[href^="#"]').forEach((a) => {
    if (a.closest('.menu')) return;
    a.addEventListener('click', () => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const ziel = $(id);
      if (!ziel) return;
      requestAnimationFrame(() => {
        if (!ziel.hasAttribute('tabindex')) ziel.setAttribute('tabindex', '-1');
        ziel.focus({ preventScroll: true });
      });
    });
  });

  /* ---------- 5. Einblenden beim Scrollen ---------- */
  const reveals = $$('[data-reveal], .serviette, .tafel');
  if (motion && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((eintraege) => {
      eintraege.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------- 6. Scroll-Effekte (nur mit GSAP und Bewegung) ---------- */
  if (gsapAn) {
    // Hero: Name steigt, Foto bleibt zurück (Tiefe), Strahlen drehen sich ein wenig
    if (hero) {
      const st = { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.5 };
      gsap.to($$('[data-titel]', hero), { yPercent: -38, ease: 'none', scrollTrigger: st });
      gsap.to('[data-hero-tiefe]', { yPercent: 11, ease: 'none', scrollTrigger: { ...st } });
      gsap.to('[data-hero-strahlen]', { rotation: 16, ease: 'none', scrollTrigger: { ...st } });
      gsap.to('.hero__inhalt', { yPercent: -8, opacity: 0.2, ease: 'none', scrollTrigger: { trigger: hero, start: '35% top', end: 'bottom top', scrub: 0.5 } });
    }
    // Bogenbilder: leichte Parallaxe im Fenster
    $$('[data-parallax]').forEach((el) => {
      const staerke = parseFloat(el.dataset.parallax) || 0.07;
      gsap.fromTo(el, { yPercent: -staerke * 100 }, {
        yPercent: staerke * 100, ease: 'none',
        scrollTrigger: { trigger: el.closest('figure') || el, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
      });
    });
  }

  /* ---------- 7. Speisekarte: Reiter mit gezeichnetem Kringel, Blatt wird umgelegt ---------- */
  const reiterLeiste = $('[data-reiter]');
  const blatt = $('[data-blatt]');
  if (reiterLeiste && blatt) {
    const tabs = $$('[role="tab"]', reiterLeiste);
    const panels = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls')));
    const kringel = $('[data-reiter-kringel]', reiterLeiste);
    let aktiv = 0;
    let wechsel = null;
    reiterLeiste.hidden = false;
    panels.forEach((p, i) => { p.hidden = i !== 0; });

    const setzeKringel = (sofort = false) => {
      const t = tabs[aktiv];
      if (!kringel || !t) return;
      const b = t.offsetWidth + 16;
      const h = t.offsetHeight + 6;
      if (sofort || !motion) kringel.style.transition = 'none';
      kringel.style.transform = `translate(${t.offsetLeft - 8}px, ${t.offsetTop - 2}px) scale(${b / 100}, ${h / 44})`;
      kringel.classList.add('is-da');
      if (sofort || !motion) { kringel.getBoundingClientRect(); kringel.style.transition = ''; }
    };

    const zeige = (i, { fokus = false } = {}) => {
      if (i === aktiv) { if (fokus) tabs[i].focus(); return; }
      const alt = aktiv;
      aktiv = i;
      tabs.forEach((t, j) => {
        t.setAttribute('aria-selected', String(j === i));
        t.tabIndex = j === i ? 0 : -1;
      });
      if (fokus) tabs[i].focus();
      tabs[i].scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: motion ? 'smooth' : 'auto' });
      setzeKringel();
      clearTimeout(wechsel);
      blatt.classList.remove('is-rein');
      blatt.classList.add('is-raus');
      // 120 ms raus, 240 ms rein – das Blatt wird „umgelegt“
      wechsel = setTimeout(() => {
        panels[alt].hidden = true;
        panels[i].hidden = false;
        blatt.classList.remove('is-raus');
        void blatt.offsetWidth;
        blatt.classList.add('is-rein');
        wechsel = setTimeout(() => blatt.classList.remove('is-rein'), 260);
        if (hasGSAP) ScrollTrigger.refresh();
      }, motion ? 120 : 0);
    };

    tabs.forEach((t, i) => {
      t.addEventListener('click', () => zeige(i));
      t.addEventListener('keydown', (e) => {
        let n = null;
        if (e.key === 'ArrowRight') n = (aktiv + 1) % tabs.length;
        if (e.key === 'ArrowLeft') n = (aktiv - 1 + tabs.length) % tabs.length;
        if (e.key === 'Home') n = 0;
        if (e.key === 'End') n = tabs.length - 1;
        if (n !== null) { e.preventDefault(); zeige(n, { fokus: true }); }
      });
    });
    setzeKringel(true);
    window.addEventListener('resize', () => setzeKringel(true));
    document.fonts?.ready.then(() => setzeKringel(true));
  }

  /* ---------- 8. Öffnungszeiten: Live-Status und Grundlage für die Reservierung ---------- */
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
      return [a, b <= a ? b + 1440 : b];
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
    if (offen) {
      const rest = offen[1] - min;
      return rest <= 45
        ? { art: 'bald', text: `Noch geöffnet · bis ${uhr(offen[1])} Uhr` }
        : { art: 'offen', text: `Jetzt geöffnet · bis ${uhr(offen[1])} Uhr` };
    }
    const spaeter = heute.find(([a]) => a > min);
    if (spaeter) {
      const diff = spaeter[0] - min;
      return diff <= 60
        ? { art: 'bald', text: `Öffnet in ${diff} Min. · ${uhr(spaeter[0])} Uhr` }
        : { art: 'zu', text: `Gerade geschlossen · heute wieder ab ${uhr(spaeter[0])} Uhr` };
    }
    for (let i = 1; i <= 7; i += 1) {
      const t = (tag + i) % 7;
      if (zeiten[t] && zeiten[t].length) return { art: 'zu', text: `Geschlossen · ${i === 1 ? 'morgen' : TAGE[t]} ab ${uhr(zeiten[t][0][0])} Uhr` };
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
    $$('tr[data-tag]', tabelle).forEach((tr) => {
      const heute = +tr.dataset.tag === tag;
      tr.classList.toggle('is-heute', heute);
      if (heute) tr.style.setProperty('--zeile-b', `${tr.offsetWidth}px`);
    });
  };
  zeigeStatus();
  setInterval(zeigeStatus, 60 * 1000);
  window.addEventListener('resize', () => {
    const tr = $('tr.is-heute', tabelle || document);
    if (tr) tr.style.setProperty('--zeile-b', `${tr.offsetWidth}px`);
  });

  /* ---------- 9. Mittagstisch: heutigen Tag auf der Tafel einkreisen ---------- */
  const tafel = $('[data-tafel]');
  if (tafel) {
    const { tag, min } = jetztVorOrt();
    const zeile = $(`[data-wochentag="${tag}"]`, tafel);
    const hinweis = $('[data-tafel-hinweis]', tafel);
    if (zeile) {
      zeile.classList.add('is-heute');
      const tagEl = $('.tafel__tag', zeile);
      tagEl.insertAdjacentHTML('beforeend', '<svg class="tafel__heute-kringel" aria-hidden="true" preserveAspectRatio="none"><use href="#d-kringel"/></svg><span class="tafel__heute-label" aria-hidden="true">heute!</span>');
      tagEl.insertAdjacentHTML('afterbegin', '<span class="sr-only">Heute, </span>');
      if (hinweis && min > minuten('14:30')) {
        hinweis.textContent = 'Für heute ist der Mittagstisch vorbei – morgen gibt es den nächsten.';
        hinweis.hidden = false;
      }
    } else if (hinweis) {
      hinweis.textContent = tag === 1
        ? 'Montags ist Ruhetag. Ab Dienstag gibt es wieder Mittagstisch.'
        : 'Am Wochenende kochen wir à la carte – ab 12 Uhr durchgehend.';
      hinweis.hidden = false;
    }
  }

  /* ---------- 10. Wäscheleine: Fotos schwingen mit dem Scrollen und bei Berührung ---------- */
  const leine = $('[data-leine]');
  const spur = $('[data-leine-spur]');
  if (leine && spur) {
    const fotos = $$('[data-foto]', leine);
    const drift = gsapAn && feinerZeiger.matches && window.innerWidth >= 900;
    const hinweis = $('[data-leine-hinweis]');
    if (!drift) {
      // Seitlich scrollbar: auch per Tastatur erreichbar
      leine.tabIndex = 0;
      leine.setAttribute('role', 'region');
      leine.setAttribute('aria-label', 'Fotos aus dem Familienalbum, seitlich scrollbar');
    }
    if (hinweis && motion) hinweis.textContent = feinerZeiger.matches ? 'Vorsicht, frisch aufgehängt! Fahren Sie ruhig mal mit der Maus drüber.' : 'Vorsicht, frisch aufgehängt! Tippen Sie ein Foto an.';

    if (drift) {
      leine.classList.add('is-drift');
      gsap.to(spur, {
        x: () => -(spur.scrollWidth - leine.clientWidth), ease: 'none',
        scrollTrigger: { trigger: leine, start: 'top bottom', end: 'bottom top', scrub: 0.8, invalidateOnRefresh: true },
      });
    }

    if (motion) {
      // Feder-Pendel je Foto: Winkel a (Grad), Geschwindigkeit v. Etwas unterschiedliche Steifigkeit,
      // damit nicht alle im Gleichtakt schwingen.
      const zustand = fotos.map((el, i) => ({
        el,
        a: 0, v: 0,
        k: 46 + (i % 3) * 10 + (i % 2) * 5,
        basis: parseFloat(getComputedStyle(el.parentElement).getPropertyValue('--rot')) || 0,
      }));
      const posX = () => (drift ? gsap.getProperty(spur, 'x') : -leine.scrollLeft);
      let letztesX = posX();
      let vGlatt = 0;
      let vGlattAlt = 0;
      let letzteZeit = 0;
      let raf = 0;
      let sichtbar = false;
      let ruhe = 0;

      const schritt = (zeit) => {
        raf = 0;
        const dt = letzteZeit ? Math.min((zeit - letzteZeit) / 1000, 1 / 30) : 1 / 60;
        letzteZeit = zeit;
        const x = posX();
        const vx = (x - letztesX) / dt;
        letztesX = x;
        vGlatt += (vx - vGlatt) * Math.min(1, dt * 10);
        const beschl = (vGlatt - vGlattAlt) / dt;
        vGlattAlt = vGlatt;
        const neigung = clamp(vGlatt * 0.0026, -7, 7); // bei Bewegung leicht nachschleppen
        let energie = 0;
        zustand.forEach((s) => {
          const kraft = -s.k * (s.a - neigung) - 3.4 * s.v + clamp(beschl * 0.0016, -60, 60);
          s.v += kraft * dt;
          s.a = clamp(s.a + s.v * dt, -12, 12);
          energie += Math.abs(s.v) + Math.abs(s.a - neigung) * 4;
          s.el.style.transform = `rotate(${(s.basis + s.a).toFixed(3)}deg)`;
        });
        ruhe = energie < 0.08 && Math.abs(vGlatt) < 2 ? ruhe + dt : 0;
        if (sichtbar && ruhe < 0.4) raf = requestAnimationFrame(schritt);
        else letzteZeit = 0;
      };
      const wecken = () => {
        ruhe = 0;
        if (!raf && sichtbar) { letztesX = posX(); raf = requestAnimationFrame(schritt); }
      };

      new IntersectionObserver(([e]) => {
        sichtbar = e.isIntersecting;
        if (sichtbar) wecken();
      }).observe(leine);
      window.addEventListener('scroll', wecken, { passive: true });
      leine.addEventListener('scroll', wecken, { passive: true });

      zustand.forEach((s) => {
        // Maus streift das Foto: Schubs in Bewegungsrichtung
        s.el.addEventListener('pointermove', (e) => {
          if (e.pointerType !== 'mouse') return;
          s.v = clamp(s.v - e.movementX * 1.1, -140, 140);
          wecken();
        });
        // Antippen / Klicken: Schubs weg von der Stelle, an der man tippt
        s.el.addEventListener('pointerdown', (e) => {
          const r = s.el.getBoundingClientRect();
          const rel = (e.clientX - r.left) / r.width - 0.5;
          s.v = clamp(s.v + (rel >= 0 ? 1 : -1) * (70 + Math.abs(rel) * 80), -160, 160);
          wecken();
        });
      });
    }
  }

  /* ---------- 11. Reservierung: Abreißkalender, freie Uhrzeiten, Prüfung am Feld, Demo-Modus ---------- */
  const form = $('[data-buchung]');
  if (form) {
    form.noValidate = true; // Mit JS prüfen wir selbst (Meldungen direkt am Feld)
    const personen = $('#f-personen', form);
    const [minus, plus] = $$('[data-schritt]', form);
    const gruppeHinweis = $('[data-gruppe-hinweis]', form);
    const datumNativ = $('[data-datum]', form);
    const zeitNativ = $('[data-uhrzeit]', form);
    const kalender = $('[data-kalender]', form);
    const zeitenBox = $('[data-zeiten]', form);
    const summe = $('[data-summe]', form);
    const senden = $('[data-senden]', form);
    const danke = $('[data-danke]');
    const fehlerEl = (name) => $(`[data-fehler="${name}"]`, form);
    const MAX = parseInt(personen.max, 10) || 12;
    const GRUPPE = 9;
    const beruehrt = new Set();
    let versucht = false;

    // Personen
    const setzePersonen = (n) => {
      const roh = parseInt(n, 10);
      const wert = clamp(Number.isNaN(roh) ? 2 : roh, 1, MAX);
      personen.value = String(wert);
      minus.disabled = wert <= 1;
      plus.disabled = wert >= MAX;
      gruppeHinweis.classList.toggle('is-wichtig', wert >= GRUPPE);
      zeigeSumme();
    };
    $$('[data-schritt]', form).forEach((b) => b.addEventListener('click', () => {
      setzePersonen(parseInt(personen.value, 10) + parseInt(b.dataset.schritt, 10));
    }));
    personen.addEventListener('change', () => setzePersonen(personen.value));

    // Uhrzeiten eines Tages aus den Öffnungszeiten (letzte Reservierung = Schluss minus Vorlauf)
    const slotsFuer = (wochentag, abMin) => {
      const gruppen = [];
      (zeiten[wochentag] || []).forEach(([a, b]) => {
        const slots = [];
        for (let t = Math.ceil(a / 30) * 30; t <= b - vorlauf; t += 30) {
          if (abMin == null || t >= abMin + 60) slots.push(t);
        }
        if (slots.length) gruppen.push({ titel: a < 16 * 60 ? 'Mittags' : 'Abends', slots });
      });
      return gruppen;
    };

    const tage = [];
    const baueKalender = () => {
      const jetzt = jetztVorOrt();
      tage.length = 0;
      kalender.textContent = '';
      for (let i = 0; i < 14; i += 1) {
        const d = new Date(Date.UTC(jetzt.j, jetzt.m - 1, jetzt.t + i));
        const wt = d.getUTCDay();
        const iso = d.toISOString().slice(0, 10);
        const gruppen = slotsFuer(wt, i === 0 ? jetzt.min : null);
        const ruhetag = !(zeiten[wt] && zeiten[wt].length);
        const frei = gruppen.length > 0;
        tage.push({ iso, wt, tagImMonat: d.getUTCDate(), monat: d.getUTCMonth(), gruppen });
        const oben = i === 0 ? 'Heute' : i === 1 ? 'Morgen' : TAGE_KURZ[wt];
        const unten = ruhetag ? 'Ruhetag' : !frei ? (i === 0 ? 'vorbei' : 'belegt') : MONATE_KURZ[d.getUTCMonth()];
        const label = document.createElement('label');
        label.className = 'kalender__blatt';
        label.innerHTML = `<input type="radio" name="tag-wahl" value="${iso}" aria-describedby="f-datum-fehler"${frei ? '' : ' disabled'}><span class="kalender__face" aria-hidden="true"><span class="kalender__tag">${oben}</span><span class="kalender__zahl">${d.getUTCDate()}</span><span class="kalender__monat">${unten}</span></span>`;
        const beschreibung = `${i < 2 ? `${oben}, ` : ''}${TAGE[wt]}, ${d.getUTCDate()}. ${MONATE[d.getUTCMonth()]}${ruhetag ? ', Ruhetag' : !frei ? ', keine Uhrzeit mehr frei' : ''}`;
        $('input', label).setAttribute('aria-label', beschreibung);
        kalender.appendChild(label);
      }
    };
    const gewaehlterTag = () => tage.find((t) => t.iso === datumNativ.value);

    const baueZeiten = () => {
      const tag = gewaehlterTag();
      const vorher = zeitNativ.value;
      zeitenBox.textContent = '';
      zeitNativ.innerHTML = '<option value="">Bitte wählen</option>';
      if (!tag) {
        zeitenBox.innerHTML = '<p class="zeiten__leer">Bitte zuerst einen Tag wählen.</p>';
        return;
      }
      tag.gruppen.forEach((g) => {
        const gruppe = document.createElement('div');
        gruppe.className = 'zeiten__gruppe';
        gruppe.innerHTML = `<p class="zeiten__titel">${g.titel}</p><div class="chips"></div>`;
        const box = $('.chips', gruppe);
        g.slots.forEach((t) => {
          const l = document.createElement('label');
          l.className = 'chip';
          l.innerHTML = `<input type="radio" name="zeit-wahl" value="${uhr(t)}" aria-describedby="f-uhrzeit-fehler"><span class="chip__face">${uhr(t)}</span>`;
          box.appendChild(l);
          zeitNativ.insertAdjacentHTML('beforeend', `<option>${uhr(t)}</option>`);
        });
        zeitenBox.appendChild(gruppe);
      });
      const gleiche = $(`input[value="${vorher}"]`, zeitenBox);
      if (gleiche) { gleiche.checked = true; zeitNativ.value = vorher; } else zeitNativ.value = '';
    };

    const zeigeSumme = () => {
      const tag = gewaehlterTag();
      const n = parseInt(personen.value, 10) || 2;
      const p = `${n} ${n === 1 ? 'Person' : 'Personen'}`;
      if (!tag) { summe.textContent = `Tag wählen · ${p}`; return; }
      const d = `${TAGE_KURZ[tag.wt]}, ${tag.tagImMonat}. ${MONATE[tag.monat]}`;
      summe.textContent = zeitNativ.value ? `${d} · ${zeitNativ.value} Uhr · ${p}` : `${d} · Uhrzeit wählen · ${p}`;
    };

    kalender.addEventListener('change', (e) => {
      if (e.target.name !== 'tag-wahl') return;
      datumNativ.value = e.target.value;
      baueZeiten();
      zeigeSumme();
      pruefeFeld('datum');
      if (versucht) pruefeFeld('uhrzeit');
    });
    zeitenBox.addEventListener('change', (e) => {
      if (e.target.name !== 'zeit-wahl') return;
      zeitNativ.value = e.target.value;
      zeigeSumme();
      pruefeFeld('uhrzeit');
    });

    const initAuswahl = () => {
      baueKalender();
      const erster = $('input:not(:disabled)', kalender);
      if (erster) { erster.checked = true; datumNativ.value = erster.value; }
      zeitNativ.value = '';
      baueZeiten();
      zeigeSumme();
    };
    // Mit JS: Kalenderblätter und Zeit-Chips statt nativer Felder
    kalender.hidden = false;
    zeitenBox.hidden = false;
    datumNativ.hidden = true;
    zeitNativ.hidden = true;
    initAuswahl();
    setzePersonen(personen.value);

    // Prüfen: Meldung direkt am Feld. Beim Verlassen eines Feldes, nach dem ersten Absenden bei jeder Eingabe.
    const TELEFON = /^[+()\d][\d\s()/.-]{5,}\d$/;
    const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const regeln = {
      datum: () => ({ ok: !!datumNativ.value, feld: null, fokus: () => $('input:checked, input:not(:disabled)', kalender) }),
      uhrzeit: () => ({ ok: !!zeitNativ.value, feld: null, fokus: () => $('input', zeitenBox) }),
      name: () => { const f = form.elements.name; return { ok: f.value.trim().length > 1, feld: f }; },
      telefon: () => {
        const f = form.elements.telefon;
        const w = f.value.trim();
        const el = fehlerEl('telefon');
        el.textContent = w ? 'Diese Nummer sieht unvollständig aus – bitte prüfen Sie sie noch einmal.' : 'Bitte geben Sie eine Telefonnummer an, unter der wir Sie erreichen.';
        return { ok: TELEFON.test(w) && w.replace(/\D/g, '').length >= 6, feld: f };
      },
      email: () => { const f = form.elements.email; const w = f.value.trim(); return { ok: !w || EMAIL.test(w), feld: f }; },
      datenschutz: () => { const f = form.elements.datenschutz; return { ok: f.checked, feld: f }; },
    };
    const pruefeFeld = (name) => {
      const { ok, feld, fokus } = regeln[name]();
      const f = fehlerEl(name);
      if (f) f.hidden = ok;
      if (feld) { if (ok) feld.removeAttribute('aria-invalid'); else feld.setAttribute('aria-invalid', 'true'); }
      return ok ? null : (feld || (fokus && fokus()));
    };
    const pruefeAlle = () => Object.keys(regeln).map(pruefeFeld).filter(Boolean)[0] || null;

    ['name', 'telefon', 'email'].forEach((n) => {
      const f = form.elements[n];
      f.addEventListener('blur', () => { if (f.value.trim() || versucht) { beruehrt.add(n); pruefeFeld(n); } });
      f.addEventListener('input', () => { if (beruehrt.has(n) || versucht) pruefeFeld(n); });
    });
    form.elements.datenschutz.addEventListener('change', () => pruefeFeld('datenschutz'));

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      versucht = true;
      const problem = pruefeAlle();
      if (problem) { problem.focus({ preventScroll: false }); return; }
      fehlerEl('senden').hidden = true;
      form.classList.add('is-laedt');
      senden.disabled = true;
      senden.setAttribute('aria-busy', 'true');
      const daten = new FormData(form);
      daten.delete('tag-wahl');
      daten.delete('zeit-wahl');
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
        `Ihre Anfrage für ${TAGE[tag.wt]}, ${tag.tagImMonat}. ${MONATE[tag.monat]} um ${zeitNativ.value} Uhr für ${n} ${n === 1 ? 'Person' : 'Personen'} ist vollständig. Wir melden uns unter ${form.elements.telefon.value.trim()}, sobald der Tisch bestätigt ist.`;
      $('.danke__demo', danke).hidden = !demo;
      form.hidden = true;
      danke.hidden = false;
      danke.focus({ preventScroll: true });
      const box = danke.closest('.formular-zettel');
      if (box && box.getBoundingClientRect().top < 0) box.scrollIntoView({ behavior: motion ? 'smooth' : 'auto', block: 'start' });
      if (hasGSAP) ScrollTrigger.refresh();
    };
    $('[data-neu]', danke)?.addEventListener('click', () => {
      form.reset();
      versucht = false;
      beruehrt.clear();
      $$('.feld__fehler', form).forEach((f) => { f.hidden = true; });
      $$('[aria-invalid]', form).forEach((f) => f.removeAttribute('aria-invalid'));
      danke.hidden = true;
      form.hidden = false;
      initAuswahl();
      setzePersonen(2);
      form.elements.name.focus();
      if (hasGSAP) ScrollTrigger.refresh();
    });
  }

  /* ---------- 12. Aufräumen: neu messen, wenn Schriften und Bilder da sind ---------- */
  if (hasGSAP) {
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    window.addEventListener('load', () => ScrollTrigger.refresh());
  }
})();
