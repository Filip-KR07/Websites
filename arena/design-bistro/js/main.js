/* Linie 12 — Urbanes Bistro · main.js
   Progressive Enhancement: Ohne JavaScript, ohne GSAP oder mit "Bewegung reduzieren" ist alles sichtbar
   und bedienbar. Alles steckt in einer IIFE, es gibt keine globalen Variablen.
   1. Grundlagen  2. Hero-Intro  3. Navigation  4. Menü  5. Einblenden  6. Tabs (Tageskarte, Karte)
   7. Öffnungszeiten  8. Bowl-Baukasten  9. Gruppen-Anfrage  10. Scroll-Effekte (GSAP)  11. Handy-Leiste */
(() => {
  'use strict';

  /* ---------- 1. Grundlagen ---------- */
  const doc = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const motion = doc.classList.contains('motion'); // im <head> gesetzt (?motion=off, Systemeinstellung)
  const hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  if (hasGSAP) { gsap.registerPlugin(ScrollTrigger); ScrollTrigger.config({ ignoreMobileResize: true }); }
  const neuMessen = () => { if (hasGSAP) ScrollTrigger.refresh(); };
  const euro = (cent) => (cent / 100).toFixed(2).replace('.', ',');
  const klatsche = (el, klasse, ms = 700) => { // Animation per Klasse neu starten
    el.classList.remove(klasse); void el.offsetWidth; el.classList.add(klasse);
    clearTimeout(el._klatsch); el._klatsch = setTimeout(() => el.classList.remove(klasse), ms);
  };
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener?.('change', () => location.reload());
  const jahr = $('[data-jahr]');
  if (jahr) jahr.textContent = String(new Date().getFullYear());

  /* ---------- 2. Hero-Intro: startet, sobald das Foto dekodiert ist ---------- */
  const hero = $('[data-hero]');
  const heroImg = $('[data-hero-img]');
  const introFertig = () => doc.classList.add('intro-fertig'); // Streifen weg, Foto selbst wird Druck
  const bereit = () => {
    if (!doc.classList.contains('is-ready')) doc.classList.add('is-ready');
    if (doc.classList.contains('has-streifen')) setTimeout(introFertig, 1250);
  };
  if (!motion || !heroImg) {
    bereit();
  } else if (doc.classList.contains('is-ready')) {
    bereit(); // Sicherheits-Timeout im <head> war schneller
  } else {
    const notfall = setTimeout(bereit, 1200);
    const fertig = () => { clearTimeout(notfall); requestAnimationFrame(bereit); };
    const dekodieren = () => (heroImg.decode ? heroImg.decode().then(fertig, fertig) : fertig());
    if (heroImg.complete && heroImg.naturalWidth) dekodieren();
    else {
      heroImg.addEventListener('load', dekodieren, { once: true });
      heroImg.addEventListener('error', fertig, { once: true });
    }
  }

  // Endlos-Bewegungen (Sticker, Laufband) pausieren außerhalb des Bildschirms
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((ee) => ee.forEach((e) => e.target.classList.toggle('ist-weg', !e.isIntersecting)));
    [hero, $('[data-band]')].forEach((el) => el && io.observe(el));
  }

  /* ---------- 3. Navigation: hell über dem Foto, fest darunter, weg beim Runterscrollen ---------- */
  const nav = $('[data-nav]');
  const themeMeta = $('meta[name="theme-color"]');
  const leiste = $('[data-leiste]');
  const verdeckt = new Set(); // Bereiche, in denen die Handy-Leiste stören würde
  let navFest = null;
  let letzteY = window.scrollY;
  let raf = 0;
  const beimScrollen = () => {
    raf = 0;
    const y = window.scrollY;
    const heroH = hero ? hero.offsetHeight : 0;
    const fest = y > heroH - nav.offsetHeight - 160; // vor dem Hero-Ende, damit nichts unter der Leiste durchscheint
    if (fest !== navFest) {
      navFest = fest;
      nav.classList.toggle('is-fest', fest);
      if (themeMeta) themeMeta.content = fest ? '#F3EFE6' : '#16130F';
    }
    const delta = y - letzteY;
    const offen = document.querySelector('dialog[open]');
    if (y < heroH || delta < -8 || nav.matches(':focus-within') || offen) nav.classList.remove('is-weg');
    else if (delta > 8) nav.classList.add('is-weg');
    if (Math.abs(delta) > 8) letzteY = y;
    if (leiste) leiste.classList.toggle('is-sichtbar', y > heroH * 0.7 && verdeckt.size === 0);
  };
  window.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(beimScrollen); }, { passive: true });
  beimScrollen();

  if (leiste && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((ee) => {
      ee.forEach((e) => (e.isIntersecting ? verdeckt.add(e.target) : verdeckt.delete(e.target)));
      beimScrollen();
    });
    ['#reservieren', '#baukasten', '.fuss'].forEach((s) => { const el = $(s); if (el) io.observe(el); });
  }

  // Aktiver Abschnitt in der Navigation
  const spy = $$('[data-spy]');
  if (spy.length && 'IntersectionObserver' in window) {
    const aktiv = new Set();
    const io = new IntersectionObserver((ee) => {
      ee.forEach((e) => (e.isIntersecting ? aktiv.add(e.target.id) : aktiv.delete(e.target.id)));
      const id = [...aktiv].pop();
      spy.forEach((a) => (a.getAttribute('href') === `#${id}` ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
    }, { rootMargin: '-45% 0px -50% 0px' });
    spy.forEach((a) => { const el = $(a.getAttribute('href')); if (el) io.observe(el); });
  }

  const springZu = (ziel) => {
    if (!ziel) return;
    ziel.scrollIntoView({ behavior: motion ? 'smooth' : 'auto', block: 'start' });
    if (!ziel.hasAttribute('tabindex')) ziel.setAttribute('tabindex', '-1');
    ziel.focus({ preventScroll: true });
  };

  /* ---------- 4. Menü (Vollbild-Dialog) ---------- */
  const menu = $('[data-menu]');
  const burger = $('[data-menu-open]');
  if (menu && burger && typeof menu.showModal === 'function') {
    const oeffnen = () => {
      menu.classList.remove('is-zu');
      menu.showModal();
      doc.style.overflow = 'hidden';
      burger.setAttribute('aria-expanded', 'true');
    };
    const schliessen = (danach) => {
      if (!menu.open) return;
      const ende = () => {
        menu.classList.remove('is-zu');
        menu.close();
        doc.style.overflow = '';
        burger.setAttribute('aria-expanded', 'false');
        if (typeof danach === 'function') danach(); else burger.focus();
      };
      menu.classList.add('is-zu');
      setTimeout(ende, motion ? 160 : 0);
    };
    burger.addEventListener('click', oeffnen);
    $('[data-menu-close]', menu).addEventListener('click', () => schliessen());
    menu.addEventListener('cancel', (e) => { e.preventDefault(); schliessen(); });
    menu.addEventListener('click', (e) => { if (e.target === menu) schliessen(); });
    $$('a[href^="#"]', menu).forEach((a) => a.addEventListener('click', (e) => {
      e.preventDefault();
      const ziel = $(a.getAttribute('href'));
      schliessen(() => springZu(ziel));
    }));
    window.matchMedia('(min-width: 1024px)').addEventListener?.('change', (m) => { if (m.matches) schliessen(); });
  }

  /* ---------- 5. Einblenden beim Scrollen ---------- */
  if (motion && 'IntersectionObserver' in window) {
    doc.classList.add('rv-an');
    const io = new IntersectionObserver((ee) => ee.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    }), { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    $$('[data-rv], .anfahrt').forEach((el) => io.observe(el));
  }

  /* ---------- 6. Tabs: Tageskarte und Speisekarte ---------- */
  const tabs = (root, { start = 0, beiWechsel } = {}) => {
    const liste = $('[data-tablist]', root);
    const knoepfe = $$('[role="tab"]', liste);
    const panels = knoepfe.map((k) => document.getElementById(k.getAttribute('aria-controls')));
    let aktiv = -1;
    const zeige = (i, { fokus = false, animiert = true } = {}) => {
      if (i === aktiv) return;
      knoepfe.forEach((k, n) => {
        const an = n === i;
        k.setAttribute('aria-selected', String(an));
        k.tabIndex = an ? 0 : -1;
        panels[n].hidden = !an;
      });
      aktiv = i;
      if (animiert && motion) klatsche(panels[i], 'is-neu', 800);
      if (fokus) knoepfe[i].focus();
      if (beiWechsel) beiWechsel(knoepfe[i], panels[i]);
    };
    knoepfe.forEach((k, n) => {
      k.addEventListener('click', () => zeige(n));
      k.addEventListener('keydown', (e) => {
        const z = { ArrowRight: (n + 1) % knoepfe.length, ArrowLeft: (n - 1 + knoepfe.length) % knoepfe.length, Home: 0, End: knoepfe.length - 1 }[e.key];
        if (z === undefined) return;
        e.preventDefault();
        zeige(z, { fokus: true });
      });
    });
    panels.forEach((p) => p.setAttribute('tabindex', '0'));
    zeige(start, { animiert: false });
    return { knoepfe, panels, zeige };
  };

  // Tageskarte: heutigen Tag (Zeit am Ort des Restaurants) vorauswählen
  const tabelle = $('[data-oeffnungszeiten]');
  const zone = tabelle?.dataset.zeitzone || undefined;
  const jetztVorOrt = () => {
    const t = {};
    try {
      new Intl.DateTimeFormat('en-GB', { timeZone: zone, weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
        .formatToParts(new Date()).forEach((p) => { t[p.type] = p.value; });
    } catch (_) {
      const d = new Date();
      return { tag: d.getDay(), min: d.getHours() * 60 + d.getMinutes(), j: d.getFullYear(), m: d.getMonth() + 1, t: d.getDate() };
    }
    return { tag: { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[t.weekday], min: (+t.hour % 24) * 60 + +t.minute, j: +t.year, m: +t.month, t: +t.day };
  };

  const tagRoot = $('[data-tabs="tag"]');
  if (tagRoot) {
    const heute = jetztVorOrt().tag;
    const knoepfe = $$('[role="tab"]', tagRoot);
    const start = Math.max(0, knoepfe.findIndex((k) => +k.dataset.tab === heute));
    knoepfe[start]?.classList.add('tag-knopf--heute');
    knoepfe[start]?.setAttribute('aria-label', `${knoepfe[start].textContent.trim().slice(0, 2)} – heute`);
    tabs(tagRoot, { start });
    // "Heute auf der Tafel" im Hero
    const ziel = $('[data-heute-hero]');
    const panel = $(`[data-panel="${heute}"]`, tagRoot);
    if (ziel && panel) {
      const name = panel.dataset.name || '';
      ziel.textContent = '';
      if (/ruhetag/i.test(name)) ziel.textContent = 'Heute Ruhetag · ab Dienstag, 8 Uhr, wieder da';
      else {
        ziel.append('Heute auf der Tafel: ');
        const a = document.createElement('a');
        a.href = '#tageskarte';
        a.textContent = name;
        ziel.append(a);
      }
    }
  }

  // Speisekarte: gleitende Markierung hinter dem aktiven Reiter
  const karteRoot = $('[data-tabs="karte"]');
  if (karteRoot) {
    const marke = $('[data-marke]', karteRoot);
    $$('.karte__panel', karteRoot).forEach((p) => $$('.gericht', p).forEach((g, n) => g.style.setProperty('--n', n)));
    const setzeMarke = (knopf, sofort) => {
      if (!marke || !knopf) return;
      if (sofort) marke.style.transition = 'none';
      marke.style.setProperty('--x', `${knopf.offsetLeft}px`);
      marke.style.setProperty('--s', String(knopf.offsetWidth / 100));
      if (sofort) { void marke.offsetWidth; marke.style.transition = ''; }
      const liste = knopf.parentElement; // aktiven Reiter auf dem Handy in Sicht holen
      if (liste.scrollWidth > liste.clientWidth) {
        const links = knopf.offsetLeft - (liste.clientWidth - knopf.offsetWidth) / 2;
        liste.scrollTo({ left: links, behavior: sofort || !motion ? 'auto' : 'smooth' });
      }
    };
    const t = tabs(karteRoot, { beiWechsel: (k) => setzeMarke(k) });
    const aktiver = () => t.knoepfe.find((k) => k.getAttribute('aria-selected') === 'true');
    setzeMarke(aktiver(), true);
    doc.classList.add('reiter-bereit');
    window.addEventListener('resize', () => setzeMarke(aktiver(), true));
    document.fonts?.ready.then(() => setzeMarke(aktiver(), true));
  }

  /* ---------- 7. Öffnungszeiten: Live-Status (einzige Quelle ist die Tabelle in #besuch) ---------- */
  const TAGE = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  const TAGE_KURZ = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  const minuten = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + (m || 0); };
  const uhr = (m) => { const t = ((m % 1440) + 1440) % 1440; return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; };
  const uhrKurz = (m) => { const s = uhr(m); return s.endsWith(':00') ? String(+s.slice(0, 2)) : s.replace(/^0/, ''); };
  const zeiten = {};
  $$('tr[data-tag]', tabelle || document.createElement('table')).forEach((tr) => {
    zeiten[+tr.dataset.tag] = (tr.dataset.zeiten || '').split(',').map((r) => r.trim()).filter(Boolean).map((r) => {
      const [a, b] = r.split('-').map(minuten);
      return [a, b <= a ? b + 1440 : b];
    });
  });
  const berechneStatus = () => {
    const { tag, min } = jetztVorOrt();
    const heute = zeiten[tag] || [];
    const gestern = (zeiten[(tag + 6) % 7] || []).map(([a, b]) => [a - 1440, b - 1440]);
    const offen = [...gestern, ...heute].find(([a, b]) => min >= a && min < b);
    if (offen) {
      const rest = offen[1] - min;
      return rest <= 45 ? { art: 'bald', text: `Noch ${rest} Min. geöffnet · bis ${uhrKurz(offen[1])} Uhr` } : { art: 'offen', text: `Jetzt geöffnet · bis ${uhrKurz(offen[1])} Uhr` };
    }
    const spaeter = heute.find(([a]) => a > min);
    if (spaeter) return { art: 'zu', text: `Geschlossen · öffnet heute um ${uhrKurz(spaeter[0])} Uhr` };
    for (let i = 1; i <= 7; i += 1) {
      const t = (tag + i) % 7;
      if (zeiten[t]?.length) return { art: 'zu', text: `Geschlossen · öffnet ${i === 1 ? 'morgen' : TAGE[t]} um ${uhrKurz(zeiten[t][0][0])} Uhr` };
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

  /* ---------- 8. Bowl-Baukasten: Schale füllt sich, Bon rechnet mit ---------- */
  const bau = $('[data-bau]');
  if (bau) {
    const GRUND = parseInt(bau.dataset.grundpreis, 10) || 950;
    const INKL = parseInt(bau.dataset.inklusive, 10) || 3;
    const MAX = parseInt(bau.dataset.max, 10) || 5;
    const EXTRA = parseInt(bau.dataset.extra, 10) || 90;
    const SVGNS = 'http://www.w3.org/2000/svg';
    const keileG = $('[data-keile]', bau);
    const basisKreis = $('[data-schale-basis]', bau);
    const sauce = $('[data-schale-sauce]', bau);
    const crunchG = $('[data-schale-crunch]', bau);
    const zeilenEl = $('[data-bon-zeilen]', bau);
    const summeEl = $('[data-bon-summe]', bau);
    const miniSumme = $('[data-mini-summe]', bau);
    const nrEl = $('[data-bon-nr]', bau);
    const info = $('[data-topping-info]', bau);
    const voll = $('[data-topping-voll]', bau);
    const toppings = $$('input[name="topping"]', bau);

    // Sechs Keile rund um die Mitte: Platz 0 = Protein, 1–5 = Toppings
    const C = 200, R1 = 60, R2 = 152;
    const punkt = (r, grad) => { const a = (grad * Math.PI) / 180; return `${(C + r * Math.cos(a)).toFixed(1)} ${(C + r * Math.sin(a)).toFixed(1)}`; };
    const pfad = (k) => {
      const a0 = -90 + k * 60 + 3, a1 = -90 + (k + 1) * 60 - 3;
      return `M${punkt(R1, a0)}L${punkt(R2, a0)}A${R2} ${R2} 0 0 1 ${punkt(R2, a1)}L${punkt(R1, a1)}A${R1} ${R1} 0 0 0 ${punkt(R1, a0)}Z`;
    };
    const plaetze = new Map(); // Topping-Wert -> Platz (bleibt stabil, damit nichts umspringt)
    const keile = [];
    const setzeKeil = (k, wert, farbe) => {
      const alt = keile[k];
      if (alt && alt.dataset.wert === wert) return;
      if (alt) alt.remove();
      keile[k] = null;
      if (!wert) return;
      const p = document.createElementNS(SVGNS, 'path');
      p.setAttribute('d', pfad(k));
      p.setAttribute('class', 'keil is-neu');
      p.setAttribute('fill', farbe);
      p.dataset.wert = wert;
      keileG.appendChild(p);
      keile[k] = p;
    };

    let vorher = new Set();
    let summeVorher = null;
    const aktualisiere = () => {
      const basis = $('input[name="basis"]:checked', bau);
      const protein = $('input[name="protein"]:checked', bau);
      const sosse = $('input[name="sauce"]:checked', bau);
      const crunch = $$('input[name="crunch"]:checked', bau);

      // Plätze für Toppings verwalten
      const gewaehlt = toppings.filter((t) => t.checked);
      [...plaetze.keys()].forEach((w) => { if (!gewaehlt.some((t) => t.value === w)) plaetze.delete(w); });
      gewaehlt.forEach((t) => {
        if (plaetze.has(t.value)) return;
        for (let k = 1; k <= MAX; k += 1) if (![...plaetze.values()].includes(k)) { plaetze.set(t.value, k); break; }
      });
      const reihenfolge = gewaehlt.slice().sort((a, b) => plaetze.get(a.value) - plaetze.get(b.value));

      // Grafik
      if (basis) { basisKreis.style.setProperty('--basis', basis.dataset.farbe); }
      if (sosse) sauce.style.setProperty('--sauce', sosse.dataset.farbe);
      crunchG.classList.toggle('is-an', crunch.length > 0);
      setzeKeil(0, protein?.value, protein?.dataset.farbe);
      for (let k = 1; k <= MAX; k += 1) {
        const t = reihenfolge.find((x) => plaetze.get(x.value) === k);
        setzeKeil(k, t?.value, t?.dataset.farbe);
      }

      // Toppings: Grenze und Hinweis
      const n = gewaehlt.length;
      toppings.forEach((t) => { t.disabled = !t.checked && n >= MAX; });
      voll.hidden = n < MAX;
      info.textContent = n <= INKL ? `${n} von ${INKL} inklusive · bis zu ${MAX}` : `${n} gewählt · ${n - INKL} × +${euro(EXTRA)}`;
      info.classList.toggle('is-extra', n > INKL);

      // Bon
      const zeilen = [{ k: 'grund', t: 'Bowl, Grundpreis', p: euro(GRUND) }];
      let summe = GRUND;
      const plus = (c) => (c > 0 ? `+${euro(c)}` : 'inkl.');
      if (basis) { const c = +basis.dataset.preis || 0; summe += c; zeilen.push({ k: `b-${basis.value}`, t: `Basis: ${basis.value}`, p: plus(c), unter: true, extra: c > 0 }); }
      if (protein) { const c = +protein.dataset.preis || 0; summe += c; zeilen.push({ k: `p-${protein.value}`, t: `Protein: ${protein.value}`, p: plus(c), unter: true, extra: c > 0 }); }
      reihenfolge.forEach((t, i) => {
        const c = i >= INKL ? EXTRA : 0; summe += c;
        zeilen.push({ k: `t-${t.value}-${c}`, t: t.value === 'Ei' ? 'Wachsweiches Ei' : t.value, p: plus(c), unter: true, extra: c > 0 });
      });
      if (sosse) zeilen.push({ k: `s-${sosse.value}`, t: `Sauce: ${sosse.value}`, p: 'inkl.', unter: true });
      crunch.forEach((c) => { const cent = +c.dataset.preis || 0; summe += cent; zeilen.push({ k: `c-${c.value}`, t: `Crunch: ${c.value}`, p: plus(cent), unter: true, extra: true }); });

      const jetzt = new Set(zeilen.map((z) => z.k));
      zeilenEl.textContent = '';
      zeilen.forEach((z) => {
        const li = document.createElement('li');
        if (z.unter) li.classList.add('ist-unter');
        if (z.extra) li.classList.add('ist-extra');
        if (vorher.size && !vorher.has(z.k)) li.classList.add('is-neu');
        const a = document.createElement('span'); a.textContent = z.t;
        const b = document.createElement('span'); b.textContent = z.p;
        li.append(a, b);
        zeilenEl.appendChild(li);
      });
      vorher = jetzt;

      const text = `${euro(summe)} €`;
      if (summe !== summeVorher) {
        summeEl.textContent = text;
        if (miniSumme) miniSumme.textContent = text;
        if (summeVorher !== null && motion) { klatsche(summeEl, 'tick', 300); if (miniSumme) klatsche(miniSumme, 'tick', 300); }
        summeVorher = summe;
      }
      // Bon-Nummer aus der Auswahl (gleiche Bowl = gleiche Nummer)
      let h = 7;
      [...jetzt].join('|').split('').forEach((ch) => { h = (h * 31 + ch.charCodeAt(0)) % 9973; });
      nrEl.textContent = `Nr. ${String(h).padStart(4, '0')}`;
    };
    bau.addEventListener('change', aktualisiere);
    aktualisiere();

    // Zufallsbowl: Zutaten landen nacheinander in der Schale
    const zufall = $('[data-zufall]', bau);
    if (zufall) {
      zufall.hidden = false;
      const eins = (arr) => arr[Math.floor(Math.random() * arr.length)];
      const mischen = (arr) => arr.map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
      let laeuft = [];
      zufall.addEventListener('click', () => {
        laeuft.forEach(clearTimeout); laeuft = [];
        const schritte = [];
        ['basis', 'protein', 'sauce'].forEach((name) => schritte.push(() => { eins($$(`input[name="${name}"]`, bau)).checked = true; }));
        schritte.unshift(() => { toppings.forEach((t) => { t.checked = false; }); $$('input[name="crunch"]', bau).forEach((c) => { c.checked = false; }); });
        mischen(toppings).slice(0, 3 + Math.round(Math.random())).forEach((t) => schritte.push(() => { t.checked = true; }));
        if (Math.random() > 0.4) schritte.push(() => { eins($$('input[name="crunch"]', bau)).checked = true; });
        schritte.forEach((s, i) => laeuft.push(setTimeout(() => { s(); aktualisiere(); }, motion ? i * 80 : 0)));
      });
    }
  }

  /* ---------- 9. Gruppen-Anfrage: Prüfung direkt am Feld, Demo-Modus ohne Endpunkt ---------- */
  const form = $('[data-anfrage]');
  if (form) {
    form.noValidate = true; // eigene Meldungen statt Browser-Blasen (ohne JS greift "required")
    const el = form.elements;
    const personen = el.personen;
    const MIN = parseInt(personen.min, 10) || 6;
    const MAXP = parseInt(personen.max, 10) || 30;
    const datum = el.datum;
    const zeit = el.uhrzeit;
    const summe = $('[data-summe]', form);
    const senden = $('[data-senden]', form);
    const danke = $('[data-danke]');
    const vorlauf = parseInt(tabelle?.dataset.letzteAnfrage || '120', 10);
    const angefasst = new Set();
    let versucht = false;

    const iso = (j, m, t) => `${j}-${String(m).padStart(2, '0')}-${String(t).padStart(2, '0')}`;
    const heuteVorOrt = () => { const n = jetztVorOrt(); return { ...n, iso: iso(n.j, n.m, n.t) }; };
    const plusTage = (isoStr, n) => { const d = new Date(`${isoStr}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
    const wochentag = (isoStr) => new Date(`${isoStr}T12:00:00Z`).getUTCDay();
    const h = heuteVorOrt();
    datum.min = h.iso;
    datum.max = plusTage(h.iso, 90);

    // Stepper
    $$('[data-step]', form).forEach((b) => {
      b.hidden = false;
      b.addEventListener('click', () => {
        const n = Math.min(MAXP, Math.max(MIN, (parseInt(personen.value, 10) || MIN) + parseInt(b.dataset.step, 10)));
        personen.value = String(n);
        angefasst.add('personen');
        pruefeFeld('personen');
        zeigeSumme();
      });
    });
    const stepperStand = () => {
      const n = parseInt(personen.value, 10);
      const [minus, plus] = $$('[data-step]', form);
      if (minus) minus.disabled = n <= MIN;
      if (plus) plus.disabled = n >= MAXP;
    };

    // Uhrzeiten aus den Öffnungszeiten: alle 30 Min., bis "data-letzte-anfrage" Minuten vor Schluss
    const slots = (isoStr) => {
      const wt = wochentag(isoStr);
      const heute = isoStr === heuteVorOrt().iso ? heuteVorOrt().min : null;
      const out = [];
      (zeiten[wt] || []).forEach(([a, b]) => {
        for (let t = Math.ceil(a / 30) * 30; t <= b - vorlauf; t += 30) if (heute === null || t >= heute + 120) out.push(uhr(t));
      });
      return out;
    };
    const baueZeiten = () => {
      const alt = zeit.value;
      const liste = datum.value && !pruefeDatum() ? slots(datum.value) : [];
      zeit.textContent = '';
      const leer = document.createElement('option');
      leer.value = '';
      leer.textContent = datum.value ? (liste.length ? 'Bitte wählen' : 'Keine Zeit') : 'Zuerst Datum';
      zeit.appendChild(leer);
      liste.forEach((u) => { const o = document.createElement('option'); o.value = u; o.textContent = `${u} Uhr`; zeit.appendChild(o); });
      zeit.value = liste.includes(alt) ? alt : '';
    };

    // Regeln je Feld: gibt eine Meldung zurück oder ''
    const pruefeDatum = () => {
      const v = datum.value;
      if (!v) return 'Bitte wählen Sie ein Datum.';
      if (v < heuteVorOrt().iso) return 'Das Datum liegt in der Vergangenheit.';
      if (v > datum.max) return 'Anfragen sind bis zu drei Monate im Voraus möglich.';
      const wt = wochentag(v);
      if (!zeiten[wt]?.length) return `${TAGE[wt]}s ist Ruhetag – bitte wählen Sie einen anderen Tag.`;
      if (!slots(v).length) return 'Für heute nehmen wir keine Gruppen mehr an. Bitte wählen Sie einen anderen Tag.';
      return '';
    };
    const regeln = {
      personen: () => {
        const n = Number(personen.value);
        if (!personen.value || !Number.isInteger(n)) return `Bitte geben Sie eine Zahl zwischen ${MIN} und ${MAXP} ein.`;
        if (n < MIN) return `Für bis zu ${MIN - 1} Personen brauchen Sie nicht zu reservieren – kommen Sie einfach vorbei.`;
        if (n > MAXP) return `Ab ${MAXP + 1} Personen rufen Sie uns bitte an, dann planen wir die ganze Halle.`;
        return '';
      },
      datum: pruefeDatum,
      uhrzeit: () => (zeit.value ? '' : 'Bitte wählen Sie eine Uhrzeit.'),
      name: () => (el.name.value.trim().length > 1 ? '' : 'Bitte geben Sie Ihren Namen an.'),
      email: () => {
        const v = el.email.value.trim();
        if (!v) return 'Bitte geben Sie Ihre E-Mail-Adresse an.';
        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : 'Diese E-Mail-Adresse sieht unvollständig aus (Beispiel: name@beispiel.de).';
      },
      telefon: () => {
        const v = el.telefon.value.trim();
        return !v || /^[+0-9][0-9 ()/-]{5,}$/.test(v) ? '' : 'Bitte nur Ziffern, Leerzeichen, + und - verwenden.';
      },
      datenschutz: () => (el.datenschutz.checked ? '' : 'Bitte stimmen Sie der Verarbeitung Ihrer Angaben zu.'),
    };
    const feldEl = { personen, datum, uhrzeit: zeit, name: el.name, email: el.email, telefon: el.telefon, datenschutz: el.datenschutz };
    const pruefeFeld = (name) => {
      const meldung = regeln[name]();
      const input = feldEl[name];
      const box = $(`[data-fehler="${name}"]`, form);
      box.textContent = meldung;
      box.hidden = !meldung;
      input.setAttribute('aria-invalid', String(!!meldung));
      input.closest('.feld')?.classList.toggle('ist-ok', !meldung && name !== 'datenschutz' && !!String(input.value).trim());
      if (name === 'personen') stepperStand();
      return !meldung;
    };

    Object.entries(feldEl).forEach(([name, input]) => {
      // Beim Verlassen prüfen (sobald etwas eingegeben wurde), danach live, solange ein Fehler steht
      input.addEventListener('blur', () => {
        if (input.value || angefasst.has(name) || versucht) { angefasst.add(name); pruefeFeld(name); }
      });
      input.addEventListener('input', () => {
        if (input.getAttribute('aria-invalid') === 'true' || versucht) pruefeFeld(name);
        if (name === 'personen') { stepperStand(); zeigeSumme(); }
      });
      input.addEventListener('change', () => {
        angefasst.add(name);
        if (name === 'datum') { baueZeiten(); pruefeFeld('datum'); if (angefasst.has('uhrzeit') || versucht) pruefeFeld('uhrzeit'); }
        else pruefeFeld(name);
        zeigeSumme();
      });
    });

    const zeigeSumme = () => {
      const n = parseInt(personen.value, 10) || MIN;
      const teile = [`${n} Personen`];
      if (datum.value && !pruefeDatum()) {
        const d = new Date(`${datum.value}T12:00:00Z`);
        teile.push(`${TAGE_KURZ[d.getUTCDay()]}, ${d.getUTCDate()}. ${MONATE[d.getUTCMonth()]}`);
        teile.push(zeit.value ? `${zeit.value} Uhr` : 'Uhrzeit wählen');
      } else teile.push('Datum wählen');
      summe.textContent = teile.join(' · ');
    };

    baueZeiten();
    stepperStand();
    zeigeSumme();

    // Brunch-Knopf trägt den Anlass schon ein
    $$('[data-anlass]').forEach((a) => a.addEventListener('click', () => {
      const r = $(`input[name="anlass"][value="${a.dataset.anlass}"]`, form);
      if (r) r.checked = true;
    }));

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      versucht = true;
      const fehler = Object.keys(regeln).filter((name) => !pruefeFeld(name));
      if (fehler.length) { feldEl[fehler[0]].focus(); return; }
      form.classList.add('is-laedt');
      senden.setAttribute('aria-busy', 'true');
      $('[data-senden-text]', form).textContent = 'Wird gesendet …';
      const ziel = (form.dataset.endpoint || '').trim();
      let ok = true;
      try {
        if (ziel) {
          const antwort = await fetch(ziel, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
          ok = antwort.ok;
        } else {
          await new Promise((r) => setTimeout(r, 900)); // Demo: nichts wird versendet
        }
      } catch (_) { ok = false; }
      form.classList.remove('is-laedt');
      senden.removeAttribute('aria-busy');
      $('[data-senden-text]', form).textContent = 'Anfrage senden';
      if (!ok) {
        const box = $('[data-fehler="datenschutz"]', form);
        box.textContent = 'Das hat leider nicht geklappt. Bitte versuchen Sie es noch einmal oder rufen Sie uns an.';
        box.hidden = false;
        return;
      }
      const vorname = el.name.value.trim().split(/\s+/)[0];
      const d = new Date(`${datum.value}T12:00:00Z`);
      $('[data-danke-name]', danke).textContent = vorname ? `, ${vorname}` : '';
      $('[data-danke-text]', danke).textContent = `Ihre Anfrage für ${el.personen.value} Personen am ${TAGE[d.getUTCDay()]}, ${d.getUTCDate()}. ${MONATE[d.getUTCMonth()]} um ${zeit.value} Uhr ist notiert. Wir melden uns innerhalb eines Tages per E-Mail an ${el.email.value.trim()}.`;
      $('[data-danke-demo]', danke).hidden = !!ziel;
      form.hidden = true;
      danke.hidden = false;
      danke.focus({ preventScroll: true });
      if (danke.getBoundingClientRect().top < 80) danke.scrollIntoView({ behavior: motion ? 'smooth' : 'auto', block: 'center' });
      neuMessen();
    });

    $('[data-neu]', danke)?.addEventListener('click', () => {
      form.reset();
      versucht = false;
      angefasst.clear();
      $$('.feld__fehler', form).forEach((f) => { f.hidden = true; });
      $$('[aria-invalid]', form).forEach((f) => f.removeAttribute('aria-invalid'));
      $$('.ist-ok', form).forEach((f) => f.classList.remove('ist-ok'));
      danke.hidden = true;
      form.hidden = false;
      baueZeiten();
      stepperStand();
      zeigeSumme();
      personen.focus();
      neuMessen();
    });
  }

  /* ---------- 10. Scroll-Effekte (GSAP, nur mit Bewegung) ---------- */
  if (motion && hasGSAP) {
    const alsScroll = { trigger: hero, start: 'top top', end: 'bottom top', scrub: true };
    if (hero) {
      gsap.to('[data-hero-medien]', { yPercent: 14, ease: 'none', scrollTrigger: alsScroll });
      $$('.hero__maske').forEach((m, j) => gsap.to(m, { y: () => -(0.05 + (j % 3) * 0.045) * window.innerHeight, ease: 'none', scrollTrigger: { ...alsScroll, invalidateOnRefresh: true } }));
      gsap.to('.hero__unten', { y: -60, opacity: 0.2, ease: 'none', scrollTrigger: { ...alsScroll, end: '75% top' } });
      gsap.to('.hero__sticker .aufkleber', { rotate: 50, ease: 'none', scrollTrigger: alsScroll });
    }
    const riesig = $('[data-riesig] span');
    if (riesig) gsap.fromTo(riesig, { xPercent: 0 }, { xPercent: -28, ease: 'none', scrollTrigger: { trigger: '#brunch', start: 'top bottom', end: 'bottom top', scrub: true } });

    // Bildstrecke: zwei Reihen laufen gegeneinander (ab Tablet); darunter bleibt Wischen
    const mm = gsap.matchMedia();
    mm.add('(min-width: 700px)', () => {
      doc.classList.add('strecke-gekoppelt');
      const weg = (r) => Math.max(0, r.scrollWidth - window.innerWidth);
      $$('[data-reihe]').forEach((r) => {
        const links = r.dataset.reihe === 'links';
        gsap.fromTo(r, { x: () => (links ? 0 : -weg(r)) }, {
          x: () => (links ? -weg(r) : 0), ease: 'none',
          scrollTrigger: { trigger: '[data-strecke]', start: 'top bottom', end: 'bottom top', scrub: 0.4, invalidateOnRefresh: true },
        });
      });
      return () => doc.classList.remove('strecke-gekoppelt');
    });
    window.addEventListener('load', neuMessen, { once: true });
    document.fonts?.ready.then(neuMessen);
  }
})();
