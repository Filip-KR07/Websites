/* Bestattungen Weidner – Modell „Stille“
   Start in Etappen: Header, Menü und Hero-Licht sofort; alles darunter in kleinen Häppchen. */
(() => {
  'use strict';

  /* ------------------------------------------------------------------
     KOSTEN-ORIENTIERUNG – alle Werte in Euro als [von, bis].
     Unverbindliche Orientierungswerte für die Demo, keine Festpreise.
     ------------------------------------------------------------------ */
  const KOSTEN = {
    // Leistungen des Bestatters: Überführung, Versorgung, Formalitäten, Beratung, Organisation
    bestatter: { erde: [1900, 2600], feuer: [1700, 2400], see: [1700, 2400], baum: [1700, 2400] },
    // Sarg (Erdbestattung) bzw. Sarg zur Einäscherung + Urne – Index: 0 schlicht, 1 klassisch, 2 gehoben
    sarg: [[650, 950], [1100, 1700], [1900, 3200]],
    sargUrne: [[450, 700], [750, 1200], [1300, 2200]],
    krematorium: [350, 550],            // nur bei Feuer-, See- und Baumbestattung
    // Friedhof bzw. Ruhestätte: Grabstelle, Beisetzung, Reederei, Baumplatz
    ruhestaette: { erde: [1800, 3800], feuer: [1000, 2400], see: [650, 1100], baum: [900, 2500] },
    feier: [[0, 0], [250, 450], [500, 950]],          // keine / Abschiedsraum / Kapelle oder Kirche
    blumen: [[150, 300], [300, 600], [600, 1200]],    // dezent / mittel / reich
    musik: [200, 450],
    druck: [180, 400],
    anzeige: [350, 900],
    kaffeetafelProPerson: [12, 20],
    rundung: 50
  };

  const D = document, html = D.documentElement;
  const MOTION_OFF = html.classList.contains('motion-off');
  const REDUCED = html.classList.contains('reduced');
  const STILL = MOTION_OFF || REDUCED;
  const $ = (s, r = D) => r.querySelector(s);
  const $$ = (s, r = D) => [...r.querySelectorAll(s)];
  const mqDesk = window.matchMedia('(min-width: 900px)');
  const mqFine = window.matchMedia('(hover: hover) and (pointer: fine)');
  window.__stilleReady = true;

  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* privat/gesperrt – egal */ } }
  };

  /* ---------------- Sofort: Header, Fortschritt, Menü ---------------- */
  const header = $('.site-header');
  const bar = $('.progress span');
  let maxScroll = 1;
  const measure = () => { maxScroll = Math.max(1, D.documentElement.scrollHeight - window.innerHeight); };
  let ticking = false;
  const onScroll = () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const y = window.scrollY;
      header.classList.toggle('is-scrolled', y > 8);
      bar.style.transform = `scaleX(${Math.min(1, y / maxScroll).toFixed(4)})`;
    });
  };
  measure(); onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => { measure(); onScroll(); }, { passive: true });
  window.addEventListener('load', measure);

  const menu = $('#menu'), menuBtn = $('.menu-btn');
  if (menu && typeof menu.showModal === 'function') {
    menuBtn.addEventListener('click', () => { menu.showModal(); menuBtn.setAttribute('aria-expanded', 'true'); });
    $('.menu-close', menu).addEventListener('click', () => menu.close());
    menu.addEventListener('close', () => menuBtn.setAttribute('aria-expanded', 'false'));
    menu.addEventListener('click', e => { if (e.target === menu) menu.close(); });
  } else if (menuBtn) {
    menuBtn.addEventListener('click', () => { location.hash = 'trauerfall'; });
  }

  /* Anker: weich scrollen (Lenis, falls aktiv), Fokus an das Ziel geben */
  let lenis = null;
  D.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href').slice(1);
    const target = id && D.getElementById(id);
    if (!target) return;
    e.preventDefault();
    const wasMenu = menu && menu.open;
    if (wasMenu) menu.close();
    const go = () => {
      const off = -(header.offsetHeight + 12);
      if (lenis) lenis.scrollTo(target, { offset: off, duration: 1.2 });
      else window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY + off, behavior: STILL ? 'auto' : 'smooth' });
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
      history.replaceState(null, '', '#' + id);
    };
    wasMenu ? requestAnimationFrame(go) : go();
  });

  /* ---------------- Sofort (nach erstem Frame): Hero-Licht ---------------- */
  requestAnimationFrame(() => initGlow($('.glow')));

  function initGlow(canvas) {
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    const RES = 0.5;            // interne Auflösung: weiches Licht braucht keine Schärfe
    const FPS = 24;             // gedrosselte Bildrate – die Bewegung ist ohnehin sehr langsam
    let W = 0, H = 0, base = null, running = false, visible = true, raf = 0, last = 0;
    const sprite = (stops) => {
      const c = D.createElement('canvas'); c.width = c.height = 256;
      const g = c.getContext('2d'), gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
      stops.forEach(([o, col]) => gr.addColorStop(o, col));
      g.fillStyle = gr; g.fillRect(0, 0, 256, 256); return c;
    };
    const warm = sprite([[0, 'rgba(255,206,130,0.95)'], [0.16, 'rgba(236,172,92,0.6)'], [0.48, 'rgba(201,140,70,0.18)'], [1, 'rgba(201,140,70,0)']]);
    const core = sprite([[0, 'rgba(255,240,215,0.9)'], [0.35, 'rgba(255,220,170,0.25)'], [1, 'rgba(255,220,170,0)']]);
    const mist = sprite([[0, 'rgba(190,186,176,0.55)'], [0.55, 'rgba(160,160,152,0.2)'], [1, 'rgba(150,150,145,0)']]);
    // Lichter: Lissajous-Bahnen mit sehr langsamer Geschwindigkeit
    const lights = [
      { x: 0.52, y: 0.62, ax: 0.07, ay: 0.05, sx: 0.050, sy: 0.037, r: 0.62, a: 0.78, ph: 0.0 },
      { x: 0.36, y: 0.38, ax: 0.10, ay: 0.07, sx: 0.031, sy: 0.043, r: 0.42, a: 0.42, ph: 1.7 },
      { x: 0.68, y: 0.28, ax: 0.08, ay: 0.06, sx: 0.041, sy: 0.027, r: 0.36, a: 0.32, ph: 3.1 }
    ];
    const mists = Array.from({ length: 7 }, (_, i) => ({
      x: (i * 0.173 + 0.08) % 1, y: 0.15 + ((i * 0.37) % 0.8), r: 0.45 + (i % 3) * 0.14,
      v: 0.006 + (i % 4) * 0.0025, a: 0.07 + (i % 3) * 0.03, ph: i * 1.3
    }));
    const ptr = { x: 0, y: 0, tx: 0, ty: 0 };

    function resize() {
      const r = canvas.getBoundingClientRect();
      const k = Math.min(window.devicePixelRatio || 1, 2) * RES;
      W = Math.max(2, Math.round(r.width * k)); H = Math.max(2, Math.round(r.height * k));
      canvas.width = W; canvas.height = H;
      base = D.createElement('canvas'); base.width = W; base.height = H;
      const b = base.getContext('2d');
      const g = b.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#202528'); g.addColorStop(0.55, '#2A2F33'); g.addColorStop(1, '#3A3832');
      b.fillStyle = g; b.fillRect(0, 0, W, H);
      const f = b.createRadialGradient(W * 0.5, H * 1.02, 0, W * 0.5, H * 1.02, H * 0.6);
      f.addColorStop(0, 'rgba(201,168,106,0.20)'); f.addColorStop(1, 'rgba(201,168,106,0)');
      b.fillStyle = f; b.fillRect(0, 0, W, H);
    }

    function draw(t) {
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      ctx.drawImage(base, 0, 0);
      const m = Math.max(W, H);
      ptr.x += (ptr.tx - ptr.x) * 0.04; ptr.y += (ptr.ty - ptr.y) * 0.04;
      ctx.globalCompositeOperation = 'lighter';
      const pos = lights.map((L, i) => {
        const x = (L.x + Math.sin(t * L.sx + L.ph) * L.ax + (i === 0 ? ptr.x * 0.05 : 0)) * W;
        const y = (L.y + Math.cos(t * L.sy + L.ph) * L.ay + (i === 0 ? ptr.y * 0.04 : 0)) * H;
        const fl = 0.9 + 0.06 * Math.sin(t * 1.3 + L.ph) + 0.04 * Math.sin(t * 3.1 + L.ph * 2);
        const R = L.r * m;
        ctx.globalAlpha = L.a * fl; ctx.drawImage(warm, x - R, y - R, R * 2, R * 2);
        return { x, y, R, fl, a: L.a };
      });
      // Nebel darüber: zieht sehr langsam seitwärts
      ctx.globalCompositeOperation = 'source-over';
      for (const n of mists) {
        const x = (((n.x + t * n.v) % 1.4) - 0.2) * W;
        const y = (n.y + Math.sin(t * 0.05 + n.ph) * 0.04) * H;
        const R = n.r * m;
        ctx.globalAlpha = n.a * (0.75 + 0.25 * Math.sin(t * 0.08 + n.ph));
        ctx.drawImage(mist, x - R, y - R * 0.6, R * 2, R * 1.2);
      }
      // Kern des Hauptlichts schimmert durch den Nebel
      ctx.globalCompositeOperation = 'lighter';
      const p = pos[0], cr = p.R * 0.32;
      ctx.globalAlpha = 0.38 * p.fl; ctx.drawImage(core, p.x - cr, p.y - cr, cr * 2, cr * 2);
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    }

    const t0 = performance.now() - 40000; // nicht bei Phase 0 beginnen
    function loop(now) {
      raf = 0;
      if (!running) return;
      raf = requestAnimationFrame(loop);
      if (now - last < 1000 / FPS) return;
      last = now;
      draw((now - t0) / 1000);
    }
    const start = () => { if (STILL || running || !visible || D.hidden) return; running = true; raf = requestAnimationFrame(loop); };
    const stop = () => { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; };

    resize(); draw(40);
    let rT = 0;
    window.addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(() => { resize(); draw((performance.now() - t0) / 1000); }, 150); }, { passive: true });
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? start() : stop(); }).observe(canvas);
    D.addEventListener('visibilitychange', () => { D.hidden ? stop() : start(); });
    if (!STILL && mqFine.matches) {
      $('.hero').addEventListener('pointermove', e => {
        ptr.tx = (e.clientX / window.innerWidth - 0.5) * 2; ptr.ty = (e.clientY / window.innerHeight - 0.5) * 2;
      }, { passive: true });
    }
    start();
  }

  /* ---------------- Warteschlange für alles unterhalb ---------------- */
  const queue = [];
  const later = fn => ('requestIdleCallback' in window) ? requestIdleCallback(fn, { timeout: 250 }) : setTimeout(fn, 20);
  function pump() {
    const t = performance.now();
    while (queue.length && performance.now() - t < 14) {
      try { queue.shift()(); } catch (err) { console.warn(err); }
    }
    if (queue.length) later(pump);
    else if (window.ScrollTrigger) window.ScrollTrigger.refresh();
  }

  queue.push(initReveal, initNavSpy, initSteps, initPrint, initExplorer, initCosts, initPlan, initContact, initMotion);
  setTimeout(() => later(pump), 60);

  /* ---------------- Reveal ---------------- */
  function initReveal() {
    const els = $$('[data-reveal], [data-reveal-group]');
    if (MOTION_OFF || !('IntersectionObserver' in window)) { els.forEach(el => el.classList.add('is-in')); return; }
    const io = new IntersectionObserver(entries => {
      const inn = entries.filter(e => e.isIntersecting);
      inn.forEach((e, i) => {
        e.target.style.transitionDelay = `${Math.min(i, 5) * 60}ms`;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
        setTimeout(() => { e.target.style.transitionDelay = ''; }, 1400);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(el => io.observe(el));
  }

  /* ---------------- Navigation: aktueller Abschnitt ---------------- */
  function initNavSpy() {
    const links = $$('.main-nav a');
    const map = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        const a = map.get(e.target.id);
        if (!a) return;
        if (e.isIntersecting) { links.forEach(l => l.removeAttribute('aria-current')); a.setAttribute('aria-current', 'true'); }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    map.forEach((_, id) => { const s = D.getElementById(id); if (s) io.observe(s); });
  }

  /* ---------------- Erste Schritte (Checkliste) ---------------- */
  function initSteps() {
    const boxes = $$('#steps-list input[type="checkbox"]');
    const count = $('.steps-count'), ring = $('.ring-fg');
    const KEY = 'weidner-schritte';
    const saved = store.get(KEY) || [];
    boxes.forEach(b => { b.checked = saved.includes(b.name); });
    const update = () => {
      const done = boxes.filter(b => b.checked);
      count.textContent = String(done.length);
      ring.style.strokeDashoffset = String(125.7 * (1 - done.length / boxes.length));
      store.set(KEY, done.map(b => b.name));
    };
    boxes.forEach(b => b.addEventListener('change', update));
    $('[data-steps-reset]').addEventListener('click', () => { boxes.forEach(b => { b.checked = false; }); update(); });
    update();
  }

  /* ---------------- Drucken (nur der gewählte Bereich) ---------------- */
  function initPrint() {
    const clear = () => html.removeAttribute('data-print');
    window.addEventListener('afterprint', clear);
    $$('[data-print]').forEach(btn => btn.addEventListener('click', () => {
      html.setAttribute('data-print', btn.dataset.print);
      if (btn.dataset.print === 'plan') updatePlan && updatePlan();
      window.print();
      setTimeout(clear, 1000);
    }));
  }

  /* ---------------- Bestattungsarten-Explorer ---------------- */
  function initExplorer() {
    const tabs = $$('.tablist [role="tab"]');
    const panels = $$('.panels [role="tabpanel"]');
    const rows = $$('.range-chart li');
    const select = (tab, focus) => {
      tabs.forEach(t => {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
      });
      panels.forEach(p => {
        const on = p.id === tab.getAttribute('aria-controls');
        if (on && p.hidden) { p.hidden = false; p.classList.remove('is-entering'); void p.offsetWidth; p.classList.add('is-entering'); }
        else if (!on) p.hidden = true;
      });
      rows.forEach(r => r.classList.toggle('is-active', r.dataset.art === tab.dataset.art));
      if (focus) tab.focus();
    };
    panels.forEach((p, i) => { p.hidden = i !== 0; p.addEventListener('animationend', () => p.classList.remove('is-entering')); });
    rows.forEach(r => r.classList.toggle('is-active', r.dataset.art === 'erde'));
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(t, false));
      t.addEventListener('keydown', e => {
        let n = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % tabs.length;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') n = 0;
        else if (e.key === 'End') n = tabs.length - 1;
        if (n !== null) { e.preventDefault(); select(tabs[n], true); }
      });
    });
    // Klick auf eine Zeile im Vergleich wählt den Tab
    rows.forEach(r => r.addEventListener('click', () => { const t = tabs.find(x => x.dataset.art === r.dataset.art); if (t) select(t, false); }));
    $$('[data-to-kosten]').forEach(b => b.addEventListener('click', () => {
      const radio = $(`#cost-form input[name="art"][value="${b.dataset.toKosten}"]`);
      if (radio) { radio.checked = true; radio.dispatchEvent(new Event('change', { bubbles: true })); }
      const target = $('#kosten'), off = -(header.offsetHeight + 12);
      if (lenis) lenis.scrollTo(target, { offset: off, duration: 1.2 });
      else window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY + off, behavior: STILL ? 'auto' : 'smooth' });
      setTimeout(() => radio && radio.focus({ preventScroll: true }), STILL ? 0 : 900);
    }));
  }

  /* ---------------- Kosten-Orientierung ---------------- */
  function initCosts() {
    const form = $('#cost-form');
    const range = $('#gaeste'), out = $('#gaeste-out');
    const sum = $('#cr-sum'), total = $('.cr-total');
    const sa = $('#cr-a'), sb = $('#cr-b'), sc = $('#cr-c');
    const [segA, segB, segC] = $$('.cr-bar span');
    const add = (acc, r) => { acc[0] += r[0]; acc[1] += r[1]; return acc; };
    const rd = (n, up) => (up ? Math.ceil(n / KOSTEN.rundung) : Math.floor(n / KOSTEN.rundung)) * KOSTEN.rundung;
    const fmt = n => n.toLocaleString('de-DE');
    const span = r => r[1] === 0 ? '0 €' : `${fmt(rd(r[0]))}–${fmt(rd(r[1], true))} €`;
    let first = true;
    const calc = () => {
      const f = new FormData(form);
      const art = f.get('art') || 'erde';
      const aus = +f.get('aus') || 0;
      const gaeste = +range.value;
      out.textContent = String(gaeste);
      range.style.setProperty('--p', `${(gaeste / +range.max) * 100}%`);
      const A = add([...KOSTEN.bestatter[art]], art === 'erde' ? KOSTEN.sarg[aus] : KOSTEN.sargUrne[aus]);
      if (art !== 'erde') add(A, KOSTEN.krematorium);
      const B = [...KOSTEN.ruhestaette[art]];
      const C = [0, 0];
      add(C, KOSTEN.feier[+f.get('feier') || 0]);
      add(C, KOSTEN.blumen[+f.get('blumen') || 0]);
      if (f.get('musik')) add(C, KOSTEN.musik);
      if (f.get('druck')) add(C, KOSTEN.druck);
      if (f.get('anzeige')) add(C, KOSTEN.anzeige);
      add(C, [gaeste * KOSTEN.kaffeetafelProPerson[0], gaeste * KOSTEN.kaffeetafelProPerson[1]]);
      const T = [A[0] + B[0] + C[0], A[1] + B[1] + C[1]];
      sa.textContent = span(A); sb.textContent = span(B); sc.textContent = span(C);
      const text = span(T);
      if (!first && !STILL && sum.textContent !== text) {
        total.classList.add('is-updating');
        setTimeout(() => { sum.textContent = text; total.classList.remove('is-updating'); }, 120);
      } else sum.textContent = text;
      const mid = r => (r[0] + r[1]) / 2, mt = mid(T) || 1;
      const pa = mid(A) / mt, pb = mid(B) / mt, pc = mid(C) / mt;
      segA.style.transform = `scaleX(${pa.toFixed(4)})`;
      segB.style.transform = `translateX(${(pa * 100).toFixed(2)}%) scaleX(${pb.toFixed(4)})`;
      segC.style.transform = `translateX(${((pa + pb) * 100).toFixed(2)}%) scaleX(${pc.toFixed(4)})`;
      first = false;
    };
    form.addEventListener('input', calc);
    form.addEventListener('change', calc);
    form.addEventListener('submit', e => e.preventDefault());
    calc();
    // „Beratung vereinbaren“ wählt das passende Anliegen vor
    $$('[data-anliegen]').forEach(a => a.addEventListener('click', () => { const s = $('#c-anliegen'); if (s) s.selectedIndex = 0; }));
  }

  /* ---------------- Vorsorge-Planer ---------------- */
  let updatePlan = null;
  function initPlan() {
    const form = $('#plan-form');
    const outs = Object.fromEntries($$('[data-out]').map(el => [el.dataset.out, el]));
    const dateStr = new Date().toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
    outs.datum.textContent = `Lübeck, ${dateStr}`;
    const setOut = (key, val) => {
      const el = outs[key];
      const v = (val || '').trim();
      const next = v || 'noch offen';
      if (el.textContent === next) return;
      el.textContent = next;
      el.classList.toggle('is-empty', !v);
      if (!STILL) { el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); }
    };
    updatePlan = () => {
      const f = new FormData(form);
      setOut('art', f.get('p-art'));
      setOut('ort', f.get('p-ort'));
      setOut('feier', f.get('p-feier'));
      setOut('musik', f.get('p-musik'));
      setOut('blumen', f.getAll('p-blumen').join(', '));
      setOut('worte', f.get('p-worte'));
      const n = (f.get('p-name') || '').trim();
      $('span', outs.name).textContent = n || '—';
    };
    form.addEventListener('input', updatePlan);
    form.addEventListener('change', updatePlan);
    form.addEventListener('submit', e => e.preventDefault());
    $('[data-plan-reset]').addEventListener('click', () => { form.reset(); updatePlan(); });
    updatePlan();
  }

  /* ---------------- Kontaktformular (nur clientseitig) ---------------- */
  function initContact() {
    const form = $('#contact-form'), success = $('#contact-success'), sumEl = $('#success-sum');
    const name = $('#c-name'), tel = $('#c-tel'), mail = $('#c-mail'), ok = $('#c-ok');
    const show = (input, errId, bad) => {
      const err = $('#' + errId);
      err.hidden = !bad;
      input.setAttribute('aria-invalid', String(bad));
      const ids = (input.getAttribute('aria-describedby') || '').split(' ').filter(x => x && x !== errId);
      if (bad) ids.push(errId);
      if (ids.length) input.setAttribute('aria-describedby', ids.join(' ')); else input.removeAttribute('aria-describedby');
      return bad;
    };
    const mailOk = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
    const telOk = v => v.replace(/[^\d]/g, '').length >= 6;
    form.addEventListener('submit', e => {
      e.preventDefault();
      const bad = [];
      if (show(name, 'c-name-err', !name.value.trim())) bad.push(name);
      const t = tel.value.trim(), m = mail.value.trim();
      const reach = (t && telOk(t)) || (m && mailOk(m));
      if (show(mail, 'c-mail-err', !reach)) bad.push(t ? tel : mail);
      if (show(ok, 'c-ok-err', !ok.checked)) bad.push(ok);
      if (bad.length) { bad[0].focus(); return; }
      sumEl.replaceChildren();
      const rows = [['Name', name.value.trim()], ['Telefon', t || '—'], ['E-Mail', m || '—'], ['Anliegen', $('#c-anliegen').value], ['Rückruf', $('#c-zeit').value], ['Nachricht', $('#c-msg').value.trim() || '—']];
      rows.forEach(([k, v]) => {
        const d = D.createElement('div'), dt = D.createElement('dt'), dd = D.createElement('dd');
        dt.textContent = k; dd.textContent = v; d.append(dt, dd); sumEl.append(d);
      });
      form.hidden = true; success.hidden = false; success.focus();
    });
    $('[data-contact-again]').addEventListener('click', () => {
      form.reset(); success.hidden = true; form.hidden = false; name.focus();
    });
  }

  /* ---------------- Scroll-Choreografie (GSAP, Lenis) ---------------- */
  function initMotion() {
    const quote = $('[data-words]');
    // Wörter in Spans zerlegen (nur eigener, statischer Text – keine Nutzereingaben)
    if (quote) {
      const words = quote.textContent.split(' ');
      quote.textContent = '';
      words.forEach((w, i) => {
        const s = D.createElement('span'); s.className = 'w'; s.textContent = w; quote.append(s);
        if (i < words.length - 1) quote.append(D.createTextNode(' '));
      });
    }
    if (STILL || !window.gsap || !window.ScrollTrigger) return;
    const { gsap, ScrollTrigger } = window;
    gsap.registerPlugin(ScrollTrigger);

    if (window.Lenis) {
      lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
      window.__lenis = lenis;
      lenis.on('scroll', ScrollTrigger.update);
      lenis.on('scroll', onScroll);
      gsap.ticker.add(t => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }

    const mm = gsap.matchMedia();
    mm.add('(min-width: 900px)', () => {
      const ws = $$('.stance-quote .w');
      gsap.fromTo(ws, { opacity: 0.18 }, {
        opacity: 1, ease: 'none', stagger: 0.1,
        scrollTrigger: { trigger: '.stance', start: 'top 35%', end: 'bottom 85%', scrub: 0.6 }
      });
      gsap.fromTo('.sign-line', { scaleX: 0, transformOrigin: '0 50%' }, {
        scaleX: 1, ease: 'none',
        scrollTrigger: { trigger: '.stance', start: 'center 60%', end: 'bottom 85%', scrub: 0.6 }
      });
      return () => {};
    });
    ScrollTrigger.addEventListener('refresh', measure);
  }
})();
