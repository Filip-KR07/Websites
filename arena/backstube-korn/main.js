/* Backstube Korn – Modell „Kruste“ · main.js
   Alle Werte für Backplan, Sortiment, Öffnungszeiten und Torten-Preise stehen hier oben
   als Konstanten und lassen sich ohne weitere Code-Kenntnisse anpassen. */
(function () {
  'use strict';
  window.__kornReady = true;

  /* ---------- Konstanten (Beispieldaten) ---------- */

  // Öffnungszeiten je Wochentag (0 = Sonntag … 6 = Samstag), Dezimalstunden.
  var HOURS = { 0: [7.5, 11], 1: [6.5, 18], 2: [6.5, 18], 3: [6.5, 18], 4: [6.5, 18], 5: [6.5, 18], 6: [6.5, 13] };

  // Backplan: Uhrzeit (Dezimalstunden) und Gebäck. wk = Montag bis Freitag.
  var OVEN_PLAN = {
    wk: [[5.75, 'Kaisersemmeln & Laugenbrezen'], [6.25, 'Bauernbrot & Krustis'], [7, 'Butter-Croissants'], [7.75, 'Dinkel-Vollkorn'], [8.5, 'Semmeln, 2. Charge'], [9.5, 'Roggen 48 h'], [10.5, 'Zimtschnecken & Plunder'], [11.5, 'Kartoffel-Kruste'], [12.5, 'Laugenbrezen, 2. Charge'], [13.5, 'Blechkuchen der Saison'], [14.5, 'Semmeln, 3. Charge'], [15.5, 'Roggen 48 h, 2. Charge'], [16.5, 'Feierabend-Baguette']],
    sa: [[5.75, 'Kaisersemmeln & Laugenbrezen'], [6.25, 'Bauernbrot & Krustis'], [7, 'Butter-Croissants'], [8, 'Roggen 48 h'], [9, 'Semmeln, 2. Charge'], [10, 'Hefezopf'], [11, 'Laugenbrezen, 2. Charge'], [12, 'Blechkuchen der Saison']],
    so: [[7, 'Semmeln & Brezen'], [7.75, 'Butter-Croissants'], [8.5, 'Sonntagszopf'], [9.5, 'Semmeln, 2. Charge']]
  };
  var DIAL_FROM = 5, DIAL_TO = 18;       // Ziffernblatt 5–18 Uhr
  var BAKE_WINDOW = 0.75;                // so lange vor der Charge gilt sie als „im Ofen“ (h)

  // Brotkorb: id, Name, Zusatz, Preis in Euro (Beispielpreise).
  var PRODUCTS = [
    ['roggen', 'Roggen 48 h', 'Sauerteig · 1000 g', 5.40],
    ['bauern', 'Bauernbrot', 'Roggenmisch · 1000 g', 4.60],
    ['dinkel', 'Dinkel-Vollkorn', 'mit Saaten · 750 g', 4.90],
    ['kartoffel', 'Kartoffel-Kruste', 'Weizenmisch · 750 g', 4.80],
    ['semmel', 'Kaisersemmel', 'pro Stück', 0.55],
    ['breze', 'Laugenbreze', 'pro Stück', 0.85],
    ['croissant', 'Butter-Croissant', 'pro Stück', 1.60],
    ['zimt', 'Zimtschnecke', 'pro Stück', 2.40]
  ];
  var MAX_PER_ITEM = 20;
  var PREORDER_CUTOFF = 18;   // Vorbestellung bis 18 Uhr am Vortag
  var PICKUP_DAYS = 6;        // so viele Abholtage werden angeboten
  var SLOT_MIN = 30;          // Abhol-Raster in Minuten

  // Torten-Preis-Orientierung (Euro).
  var CAKE = {
    base: { 1: 49, 2: 119, 3: 229 },
    serv: { 1: '10–12', 2: '25–30', 3: '50–60' },
    fill: { himbeer: [0, '#C2405A', 'Himbeer-Mascarpone'], schoko: [6, '#4A2A1A', 'Schoko-Ganache'], zitrone: [0, '#E3BE3C', 'Zitronen-Quark'], nougat: [8, '#9A6A3E', 'Haselnuss-Nougat'] }, // Aufpreis je Stock
    deco: { beeren: [9, true, 'Frische Beeren'], blueten: [14, true, 'Essbare Blüten'], drip: [7, true, 'Schoko-Drip'], schild: [6, false, 'Schild mit Aufschrift'] }, // [Preis, je Stock?, Name]
    rangeLow: 0.95, rangeHigh: 1.1,
    topY: { 1: 250, 2: 172, 3: 104 }   // Höhe der obersten Tortenfläche in der SVG
  };

  /* ---------- Hilfen ---------- */
  var d = document, html = d.documentElement;
  var motionOff = html.classList.contains('motion-off');
  var reduced = html.classList.contains('reduced');
  var still = motionOff || reduced;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var euro = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
  var fmtTime = function (h) { var m = Math.round(h * 60); return Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0'); };
  var nowH = function (dt) { dt = dt || new Date(); return dt.getHours() + dt.getMinutes() / 60 + dt.getSeconds() / 3600; };
  var planKey = function (day) { return day === 0 ? 'so' : day === 6 ? 'sa' : 'wk'; };
  var DAYN = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  var DAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  var NBSP = ' ';
  var lenis = null;

  /* ---------- Header, Fortschritt ---------- */
  var hdr = $('.hdr'), bar = $('.progress span');
  var ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var y = window.scrollY, max = html.scrollHeight - innerHeight;
      hdr.classList.toggle('is-scrolled', y > 8);
      bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0).toFixed(4) + ')';
    });
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Menü (Dialog mit Fokusführung) ---------- */
  (function menu() {
    var btn = $('.burger'), panel = $('#menu');
    if (!btn || !panel) return;
    var last = null;
    $$('li', panel).forEach(function (li, i) { li.style.setProperty('--i', i); });
    function open() {
      last = d.activeElement; panel.hidden = false; panel.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true'); btn.setAttribute('aria-label', 'Menü schließen');
      html.classList.add('menu-open'); if (lenis) lenis.stop();
      d.body.style.overflow = 'hidden';
      var f = $('a', panel); if (f) f.focus();
    }
    function close(focusBack) {
      panel.hidden = true; panel.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-label', 'Menü öffnen');
      html.classList.remove('menu-open'); if (lenis) lenis.start();
      d.body.style.overflow = '';
      if (focusBack !== false) (last && last.focus ? last : btn).focus();
    }
    btn.addEventListener('click', function () { panel.hidden ? open() : close(); });
    panel.addEventListener('click', function (e) { if (e.target.closest('a')) close(false); });
    d.addEventListener('keydown', function (e) {
      if (panel.hidden) return;
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      if (e.key === 'Tab') {
        var f = [btn].concat($$('a', panel)), i = f.indexOf(d.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      }
    });
    matchMedia('(min-width: 1024px)').addEventListener('change', function (m) { if (m.matches && !panel.hidden) close(false); });
  })();

  /* ---------- Hero: Mehlstaub (Canvas) ---------- */
  (function dust() {
    var panel = $('.hero__panel'), cv = $('.hero__dust');
    if (!panel || !cv || !cv.getContext) return;
    var ctx = cv.getContext('2d');
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var W = 0, H = 0, parts = [], running = false, visible = true, raf = 0, last = 0, acc = 0;
    var mouse = { x: -999, y: -999, vx: 0, vy: 0, t: 0 };
    // Partikel-Sprite einmal vorrendern, danach nur noch blitten.
    var sp = d.createElement('canvas'); sp.width = sp.height = 32;
    var sc = sp.getContext('2d'), g = sc.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, 'rgba(250,244,232,1)'); g.addColorStop(.35, 'rgba(250,244,232,.55)'); g.addColorStop(1, 'rgba(250,244,232,0)');
    sc.fillStyle = g; sc.fillRect(0, 0, 32, 32);

    function size() {
      var r = panel.getBoundingClientRect();
      W = r.width; H = r.height;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(Math.min(240, Math.max(70, W * H / 4200)));
      if (parts.length !== n) {
        parts = [];
        for (var i = 0; i < n; i++) parts.push(make(true));
      }
    }
    function make(anywhere) {
      var z = .35 + Math.random() * .65;
      return { x: Math.random() * W, y: anywhere ? Math.random() * H : H + 10, z: z, vx: 0, vy: 0,
        r: (1 + Math.random() * 3.4) * z, a: (.18 + Math.random() * .5) * z, ph: Math.random() * 6.28, sp: .4 + Math.random() * .8 };
    }
    function step(dt, t) {
      var active = t - mouse.t < 1600;
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        // sanftes Aufsteigen + Schweben
        p.vx += Math.sin(t * .0004 * p.sp + p.ph) * .0025 * dt;
        p.vy -= .0009 * p.z * dt;
        if (active) {
          var dx = p.x - mouse.x, dy = p.y - mouse.y, dd = dx * dx + dy * dy;
          if (dd < 30000) {
            var f = (1 - dd / 30000) * p.z;
            // Wirbel: entlang der Mausbewegung mitreißen und leicht um den Zeiger drehen
            p.vx += (mouse.vx * .05 - dy * .0009) * f * dt * .06;
            p.vy += (mouse.vy * .05 + dx * .0009) * f * dt * .06;
          }
        }
        p.vx *= Math.pow(.955, dt / 16); p.vy *= Math.pow(.955, dt / 16);
        p.x += p.vx * dt * .06; p.y += (p.vy - .12 * p.z) * dt * .06;
        if (p.y < -12 || p.x < -20 || p.x > W + 20) { var q = make(false); q.x = Math.random() * W; parts[i] = q; }
      }
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i], s = p.r * 2.6;
        ctx.globalAlpha = p.a;
        ctx.drawImage(sp, p.x - s / 2, p.y - s / 2, s, s);
      }
      ctx.globalAlpha = 1;
    }
    function loop(t) {
      raf = 0;
      if (!running) return;
      var dt = Math.min(48, t - (last || t)); last = t;
      // Ruhezustand: gedrosselt auf ~30 fps, bei Mausbewegung volle Rate
      var active = t - mouse.t < 1600;
      acc += dt;
      if (active || acc >= 32) { step(acc, t); draw(); acc = 0; }
      raf = requestAnimationFrame(loop);
    }
    function start() { if (running || still || !visible || d.hidden) return; running = true; last = 0; raf = requestAnimationFrame(loop); }
    function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }

    requestAnimationFrame(function () { size(); boot(); });
    function boot() {
    if (still) { draw(); }
    else {
      // kleiner Anfangs-Puff aus der Bildkomposition
      for (var i = 0; i < parts.length; i += 3) { parts[i].vy -= 1.5 * Math.random(); parts[i].vx += (Math.random() - .5) * 1.4; }
      start();
    }
    }
    var lastMove = 0;
    panel.addEventListener('pointermove', function (e) {
      var r = panel.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, t = performance.now();
      if (mouse.t && t - lastMove < 100) { mouse.vx += ((x - mouse.x) - mouse.vx) * .5; mouse.vy += ((y - mouse.y) - mouse.vy) * .5; }
      mouse.x = x; mouse.y = y; mouse.t = t; lastMove = t;
    }, { passive: true });
    panel.addEventListener('pointerleave', function () { mouse.vx = mouse.vy = 0; });
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; visible ? start() : stop(); }).observe(panel);
    d.addEventListener('visibilitychange', function () { d.hidden ? stop() : start(); });
    var rt; addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { size(); if (still) draw(); }, 150); });
  })();

  /* ---------- Ofenplan-Logik (auch für Hero-Etikett) ---------- */
  function nextCharge(dt) {
    dt = dt || new Date();
    var h = nowH(dt), plan = OVEN_PLAN[planKey(dt.getDay())];
    for (var i = 0; i < plan.length; i++) if (plan[i][0] > h) return { i: i, t: plan[i][0], what: plan[i][1], today: true, inH: plan[i][0] - h };
    var tm = new Date(dt); tm.setDate(tm.getDate() + 1);
    var p2 = OVEN_PLAN[planKey(tm.getDay())][0];
    return { i: -1, t: p2[0], what: p2[1], today: false, inH: 24 - h + p2[0] };
  }
  function heroTag() {
    var el = $('[data-hero-next]'); if (!el) return;
    var n = nextCharge();
    el.textContent = n.today
      ? n.what + ' · ' + fmtTime(n.t) + NBSP + 'Uhr'
      : n.what + ' · ' + fmtTime(n.t) + NBSP + 'Uhr';
    var k = $('.hero__tag .tag__k'); if (k) k.textContent = !n.today ? 'Morgen zuerst' : n.inH <= BAKE_WINDOW ? 'Jetzt im Ofen' : 'Als Nächstes';
  }
  heroTag(); setInterval(heroTag, 60000);

  function openState(dt) {
    dt = dt || new Date();
    var h = nowH(dt), o = HOURS[dt.getDay()];
    if (h >= o[0] && h < o[1]) return { open: true, text: 'Jetzt geöffnet – heute bis ' + fmtTime(o[1]) + NBSP + 'Uhr' };
    if (h < o[0]) return { open: false, text: 'Geschlossen – öffnet heute um ' + fmtTime(o[0]) + NBSP + 'Uhr' };
    var tm = new Date(dt); tm.setDate(tm.getDate() + 1);
    return { open: false, text: 'Geschlossen – öffnet ' + (tm.getDay() === 0 ? 'am Sonntag' : 'morgen') + ' um ' + fmtTime(HOURS[tm.getDay()][0]) + NBSP + 'Uhr' };
  }

  /* ---------- Ofenfrisch-Uhr ---------- */
  function initOven() {
    var root = $('#ofen'); if (!root) return;
    var svg = $('.dial__svg', root), NS = 'http://www.w3.org/2000/svg';
    var C = 200, R = 150, A0 = -150, A1 = 150;
    var ang = function (t) { return A0 + (Math.max(DIAL_FROM, Math.min(DIAL_TO, t)) - DIAL_FROM) / (DIAL_TO - DIAL_FROM) * (A1 - A0); };
    var pt = function (a, r) { var rad = a * Math.PI / 180; return [C + r * Math.sin(rad), C - r * Math.cos(rad)]; };
    var arc = function (a0, a1, r) { var p0 = pt(a0, r), p1 = pt(a1, r); return 'M' + p0[0].toFixed(2) + ' ' + p0[1].toFixed(2) + ' A' + r + ' ' + r + ' 0 ' + (a1 - a0 > 180 ? 1 : 0) + ' 1 ' + p1[0].toFixed(2) + ' ' + p1[1].toFixed(2); };
    var el = function (n, at) { var e = d.createElementNS(NS, n); for (var k in at) e.setAttribute(k, at[k]); return e; };

    // Skala einmal zeichnen
    var ticks = $('.dial__ticks', svg);
    for (var m = DIAL_FROM * 60; m <= DIAL_TO * 60; m += 15) {
      var a = ang(m / 60), major = m % 60 === 0, p0 = pt(a, major ? 166 : 169), p1 = pt(a, 176);
      ticks.appendChild(el('line', { x1: p0[0], y1: p0[1], x2: p1[0], y2: p1[1], 'class': major ? 'major' : '' }));
      if (major) { var lp = pt(a, 124), tx = el('text', { x: lp[0], y: lp[1] }); tx.textContent = m / 60; ticks.appendChild(tx); }
    }
    $('.dial__track', svg).setAttribute('d', arc(A0, A1, R));
    var done = $('.dial__done', svg), dots = $('.dial__dots', svg), hand = $('.dial__hand', svg);
    var list = $('[data-oven-list]', root), countEl = $('[data-oven-count]', root), whatEl = $('[data-oven-what]', root), kEl = $('[data-oven-k]', root);
    var srEl = $('[data-oven-sr]', root), nowEl = $('[data-oven-now]', root);
    var tabs = $$('[role="tab"]', root), panel = $('#oven-panel');
    var todayKey = planKey(new Date().getDay()), cur = todayKey, lastSr = '';

    tabs.forEach(function (t) {
      if (t.dataset.day === todayKey) { var s = d.createElement('span'); s.className = 'tab-today'; s.textContent = ' · heute'; t.appendChild(s); }
    });

    function render() {
      var plan = OVEN_PLAN[cur];
      while (dots.firstChild) dots.removeChild(dots.firstChild);
      while (list.firstChild) list.removeChild(list.firstChild);
      plan.forEach(function (c, i) {
        var p = pt(ang(c[0]), R), dot = el('circle', { cx: p[0], cy: p[1], r: 8 });
        dot.dataset.i = i; dots.appendChild(dot);
        var li = d.createElement('li'), tm = d.createElement('time'), nm = d.createElement('span'), st = d.createElement('span');
        tm.textContent = fmtTime(c[0]); nm.textContent = c[1].replace(' h', NBSP + 'h'); st.className = 'st';
        li.dataset.i = i; li.appendChild(tm); li.appendChild(nm); li.appendChild(st); list.appendChild(li);
        var on = function () { hl(i, true); }, off = function () { hl(i, false); };
        li.addEventListener('pointerenter', on); li.addEventListener('pointerleave', off);
        dot.addEventListener('pointerenter', on); dot.addEventListener('pointerleave', off);
      });
      tick();
    }
    function hl(i, on) {
      var dot = dots.children[i], li = list.children[i];
      if (dot) dot.classList.toggle('is-hl', on); if (li) li.classList.toggle('is-hl', on);
    }
    function tick() {
      var dt = new Date(), h = nowH(dt), plan = OVEN_PLAN[cur], isToday = cur === todayKey;
      var os = openState(dt);
      nowEl.textContent = isToday ? os.text : 'Backplan ' + (cur === 'wk' ? 'Montag bis Freitag' : cur === 'sa' ? 'Samstag' : 'Sonntag') + ' · ' + plan.length + ' Chargen';
      nowEl.classList.toggle('is-closed', isToday && !os.open);
      var next = isToday ? nextCharge(dt) : null;
      plan.forEach(function (c, i) {
        var li = list.children[i], dot = dots.children[i]; if (!li) return;
        var past = isToday && c[0] <= h, isNext = isToday && next.today && next.i === i;
        li.classList.toggle('is-past', past); li.classList.toggle('is-next', isNext);
        dot.classList.toggle('is-past', past); dot.classList.toggle('is-next', isNext);
        li.lastChild.textContent = !isToday ? '' : past ? 'in der Theke' : isNext ? (next.inH <= BAKE_WINDOW ? 'im Ofen' : 'als Nächstes') : 'kommt';
        li.lastChild.hidden = !isToday;
      });
      if (isToday && h >= DIAL_FROM && h <= DIAL_TO) {
        hand.classList.remove('is-off'); hand.style.transform = 'rotate(' + ang(h).toFixed(2) + 'deg)';
        done.setAttribute('d', ang(h) - A0 > .5 ? arc(A0, ang(h), R) : '');
      } else {
        hand.classList.add('is-off'); done.setAttribute('d', isToday && h > DIAL_TO ? arc(A0, A1, R) : '');
      }
      var sr;
      if (!isToday) {
        kEl.textContent = 'Erste Charge'; countEl.textContent = fmtTime(plan[0][0]); whatEl.textContent = plan[0][1];
        sr = '';
      } else if (next.today) {
        var s = Math.max(0, Math.round(next.inH * 3600));
        kEl.textContent = next.inH <= BAKE_WINDOW ? 'Fertig in' : 'Nächste Charge in';
        countEl.textContent = s < 3600 ? String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0') : Math.floor(s / 3600) + NBSP + 'h ' + String(Math.floor(s % 3600 / 60)).padStart(2, '0');
        whatEl.textContent = next.what + ' · ' + fmtTime(next.t) + NBSP + 'Uhr';
        sr = 'Nächste Charge: ' + next.what + ' um ' + fmtTime(next.t) + ' Uhr.';
      } else {
        kEl.textContent = 'Für heute fertig'; countEl.textContent = fmtTime(next.t);
        whatEl.textContent = 'Morgen zuerst: ' + next.what;
        sr = 'Für heute ist alles gebacken. Morgen um ' + fmtTime(next.t) + ' Uhr: ' + next.what + '.';
      }
      if (srEl && sr !== lastSr) { srEl.textContent = sr; lastSr = sr; }
    }
    function select(t, focus) {
      tabs.forEach(function (b) { var on = b === t; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; });
      panel.setAttribute('aria-labelledby', t.id);
      var changed = cur !== t.dataset.day;
      cur = t.dataset.day; render();
      if (focus) t.focus();
      if (changed && window.ScrollTrigger) ScrollTrigger.refresh();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t); });
      t.addEventListener('keydown', function (e) {
        var k = e.key, j = k === 'ArrowRight' ? i + 1 : k === 'ArrowLeft' ? i - 1 : k === 'Home' ? 0 : k === 'End' ? tabs.length - 1 : null;
        if (j === null) return; e.preventDefault(); select(tabs[(j + tabs.length) % tabs.length], true);
      });
    });
    select(tabs.filter(function (t) { return t.dataset.day === todayKey; })[0] || tabs[0]);
    // Sekundentakt nur, solange die Uhr sichtbar ist
    var timer = 0, vis = false;
    function run() { clearInterval(timer); timer = 0; if (vis && !d.hidden) timer = setInterval(tick, 1000); }
    new IntersectionObserver(function (es) { vis = es[0].isIntersecting; if (vis) tick(); run(); }).observe(root);
    d.addEventListener('visibilitychange', run);
  }

  function initOpenStatus() {
    var el = $('[data-open-status]'); if (!el) return;
    var upd = function () { var s = openState(); el.textContent = s.text; el.classList.toggle('is-open', s.open); el.classList.toggle('is-closed', !s.open); };
    upd(); setInterval(upd, 60000);
  }

  /* ---------- Brotkorb-Konfigurator ---------- */
  var basket = { qty: {} };
  function initBasket() {
    var form = $('#korb-form'); if (!form) return;
    var ul = $('[data-products]', form), daysEl = $('[data-days]', form), timeSel = $('[data-time]', form);
    var bagList = $('[data-bag-list]', form), bagTotal = $('[data-bag-total]', form), bagWhen = $('[data-bag-when]', form);
    var doneEl = $('#korb-done');
    PRODUCTS.forEach(function (p) {
      basket.qty[p[0]] = 0;
      var li = d.createElement('li'); li.dataset.id = p[0];
      li.innerHTML = '<span class="prod__name"></span><span class="prod__sub"><span class="prod__price"></span> · <span class="prod__u"></span></span>' +
        '<span class="stepper"><button type="button" data-d="-1" disabled>−</button><output aria-live="polite">0</output><button type="button" data-d="1">+</button></span>';
      $('.prod__name', li).textContent = p[1].replace(' h', NBSP + 'h');
      $('.prod__price', li).textContent = euro.format(p[3]);
      $('.prod__u', li).textContent = p[2];
      $('[data-d="-1"]', li).setAttribute('aria-label', p[1] + ': eins weniger');
      $('[data-d="1"]', li).setAttribute('aria-label', p[1] + ': eins mehr');
      $('output', li).setAttribute('aria-label', 'Menge ' + p[1]);
      ul.appendChild(li);
    });
    ul.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-d]'); if (!b) return;
      var li = b.closest('li'); setQty(li.dataset.id, basket.qty[li.dataset.id] + (+b.dataset.d));
    });
    function setQty(id, n) {
      n = Math.max(0, Math.min(MAX_PER_ITEM, n));
      var li = $('li[data-id="' + id + '"]', ul), out = $('output', li), was = basket.qty[id];
      basket.qty[id] = n; out.textContent = n;
      if (!still && n !== was) { out.classList.remove('bump'); void out.offsetWidth; out.classList.add('bump'); }
      $('[data-d="-1"]', li).disabled = n === 0; $('[data-d="1"]', li).disabled = n === MAX_PER_ITEM;
      li.classList.toggle('has', n > 0);
      summary(id);
    }
    basket.setQty = setQty;

    // Abholtage
    var first = new Date(); first.setHours(0, 0, 0, 0);
    first.setDate(first.getDate() + (nowH() < PREORDER_CUTOFF ? 1 : 2));
    for (var i = 0; i < PICKUP_DAYS; i++) {
      var dt = new Date(first); dt.setDate(first.getDate() + i);
      var o = HOURS[dt.getDay()], lab = d.createElement('label'), inp = d.createElement('input'), sp = d.createElement('span');
      inp.type = 'radio'; inp.name = 'tag'; inp.value = dt.toISOString().slice(0, 10); inp.dataset.wd = dt.getDay();
      inp.setAttribute('aria-label', DAYN[dt.getDay()] + ', ' + dt.getDate() + '.' + (dt.getMonth() + 1) + '., ' + fmtTime(o[0]) + ' bis ' + fmtTime(o[1]) + ' Uhr');
      var b = d.createElement('b'); b.textContent = DAYS[dt.getDay()] + ' ' + dt.getDate() + '.' + (dt.getMonth() + 1) + '.';
      var sm = d.createElement('small'); sm.textContent = fmtTime(o[0]) + '–' + fmtTime(o[1]);
      sp.appendChild(b); sp.appendChild(sm); lab.appendChild(inp); lab.appendChild(sp); daysEl.appendChild(lab);
    }
    daysEl.addEventListener('change', function (e) {
      var wd = +e.target.dataset.wd, o = HOURS[wd], prev = timeSel.value;
      while (timeSel.firstChild) timeSel.removeChild(timeSel.firstChild);
      var ph = d.createElement('option'); ph.value = ''; ph.textContent = 'Bitte wählen'; timeSel.appendChild(ph);
      for (var m = o[0] * 60; m <= o[1] * 60 - SLOT_MIN; m += SLOT_MIN) {
        var op = d.createElement('option'), v = fmtTime(m / 60); op.value = v; op.textContent = v + ' Uhr'; timeSel.appendChild(op);
      }
      if (prev && $('option[value="' + prev + '"]', timeSel)) timeSel.value = prev;
      $('[data-err="day"]', form).hidden = true;
      summary();
    });
    timeSel.addEventListener('change', function () { summary(); });

    function chosenDay() { var c = $('input[name="tag"]:checked', daysEl); return c ? new Date(c.value + 'T12:00:00') : null; }
    function whenText() {
      var dy = chosenDay(); if (!dy) return '–';
      return DAYS[dy.getDay()] + ', ' + dy.getDate() + '.' + (dy.getMonth() + 1) + '.' + (timeSel.value ? ', ' + timeSel.value + NBSP + 'Uhr' : '');
    }
    function lines() {
      return PRODUCTS.filter(function (p) { return basket.qty[p[0]] > 0; }).map(function (p) { return { id: p[0], n: basket.qty[p[0]], name: p[1], sum: basket.qty[p[0]] * p[3] }; });
    }
    function summary(changed) {
      var ls = lines(), total = 0;
      while (bagList.firstChild) bagList.removeChild(bagList.firstChild);
      if (!ls.length) { var e = d.createElement('li'); e.className = 'bag__empty'; e.textContent = 'Noch leer – oben Mengen wählen.'; bagList.appendChild(e); }
      ls.forEach(function (l) {
        total += l.sum;
        var li = d.createElement('li'), a = d.createElement('b'), b = d.createElement('span'), c = d.createElement('span');
        a.textContent = l.n + '×'; b.textContent = l.name.replace(' h', NBSP + 'h'); c.textContent = euro.format(l.sum);
        if (l.id === changed) li.className = 'in';
        li.appendChild(a); li.appendChild(b); li.appendChild(c); bagList.appendChild(li);
      });
      bagTotal.textContent = euro.format(total);
      bagWhen.textContent = whenText();
      if (ls.length) $('[data-err="items"]', form).hidden = true;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = [], name = form.elements.name, tel = form.elements.tel;
      var okItems = lines().length > 0, okDay = !!chosenDay(), okTime = !!timeSel.value;
      var okName = name.value.trim().length > 1, okTel = /^[+0-9 ()\/-]{6,}$/.test(tel.value.trim());
      $('[data-err="items"]', form).hidden = okItems; if (!okItems) bad.push($('button[data-d="1"]', ul));
      $('[data-err="day"]', form).hidden = okDay; if (!okDay) bad.push($('input[name="tag"]', daysEl));
      [[timeSel, okTime], [name, okName], [tel, okTel]].forEach(function (x) { x[0].setAttribute('aria-invalid', !x[1]); if (!x[1]) bad.push(x[0]); });
      $('[data-err="fields"]', form).hidden = okTime && okName && okTel;
      if (bad.length) { bad[0].focus(); return; }
      // Erfolgsansicht – nur textContent
      $('[data-done-name]', doneEl).textContent = name.value.trim();
      var dl = $('[data-done-list]', doneEl); while (dl.firstChild) dl.removeChild(dl.firstChild);
      var total = 0;
      lines().forEach(function (l) { total += l.sum; var li = d.createElement('li'); li.textContent = l.n + ' × ' + l.name + ' – ' + euro.format(l.sum); dl.appendChild(li); });
      var tl = d.createElement('li'); tl.textContent = 'Summe: ' + euro.format(total) + ' (Bezahlung bei Abholung)'; tl.style.fontWeight = '700'; dl.appendChild(tl);
      $('[data-done-when]', doneEl).textContent = 'Abholung: ' + whenText() + ' · Gesandtenstraße 14 · Rückfragen an ' + tel.value.trim();
      form.hidden = true; doneEl.hidden = false; doneEl.focus();
      if (lenis) lenis.scrollTo(doneEl, { offset: -100 }); else doneEl.scrollIntoView({ block: 'center' });
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    });
    [form.elements.name, form.elements.tel, timeSel].forEach(function (f) { f.addEventListener(f === timeSel ? 'change' : 'input', function () { f.removeAttribute('aria-invalid'); if (!$('[aria-invalid="true"]', form)) $('[data-err="fields"]', form).hidden = true; }); });
    $('[data-korb-reset]', doneEl).addEventListener('click', function () {
      PRODUCTS.forEach(function (p) { setQty(p[0], 0); });
      form.reset(); timeSel.innerHTML = '<option value="">Erst Tag wählen</option>'; summary();
      doneEl.hidden = true; form.hidden = false; $('button[data-d="1"]', ul).focus();
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    });
    // „Laib reservieren“ aus der Sauerteig-Strecke legt einen Roggen in die Tüte
    var res = $('.step--end .btn');
    if (res) res.addEventListener('click', function () { if (!basket.qty.roggen) setQty('roggen', 1); });
  }

  /* ---------- Torten-Konfigurator ---------- */
  var cakeState = null;
  function initCake() {
    var form = $('#cake-form'), svg = $('.cake__svg'); if (!form || !svg) return;
    var tiers = $$('.tier', svg), top = $('[data-top]', svg), label = $('[data-cake-label]', svg);
    var priceEl = $('[data-cake-price]'), servEl = $('[data-cake-serv]'), leadEl = $('[data-cake-lead]');
    var lblFld = $('[data-label-fld]', form), lblIn = form.elements.aufschrift;
    var round5 = function (v) { return Math.round(v / 5) * 5; };
    function upd() {
      var n = +form.querySelector('input[name="stock"]:checked').value;
      var fill = form.querySelector('input[name="fuellung"]:checked').value;
      var deco = $$('input[name="deko"]:checked', form).map(function (i) { return i.value; });
      tiers.forEach(function (t) { t.classList.toggle('is-off', +t.dataset.tier > n); });
      top.style.transform = 'translateY(' + CAKE.topY[n] + 'px)';
      svg.style.setProperty('--fill', CAKE.fill[fill][1]);
      svg.classList.toggle('has-drip', deco.indexOf('drip') > -1);
      $$('[data-deco]', svg).forEach(function (g) { g.classList.toggle('is-off', deco.indexOf(g.dataset.deco) < 0); });
      var hasSign = deco.indexOf('schild') > -1;
      lblIn.disabled = !hasSign; lblFld.classList.toggle('is-disabled', !hasSign);
      label.textContent = lblIn.value.trim() || 'Alles Gute';
      var p = CAKE.base[n] + CAKE.fill[fill][0] * n;
      deco.forEach(function (k) { p += CAKE.deco[k][0] * (CAKE.deco[k][1] ? n : 1); });
      var lo = round5(p * CAKE.rangeLow), hi = round5(p * CAKE.rangeHigh);
      priceEl.textContent = 'ca. ' + lo + '–' + hi + NBSP + '€';
      servEl.textContent = 'für ' + CAKE.serv[n] + ' Personen · unverbindlich';
      leadEl.textContent = n === 3 ? 'Vorlauf: etwa 3 Wochen – drei Stockwerke planen wir gemeinsam mit Ihnen.' : 'Vorlauf: mindestens 5 Tage' + (n === 2 ? ', für Hochzeiten besser 2–3 Wochen.' : '.');
      cakeState = { n: n, fill: CAKE.fill[fill][2], deco: deco.map(function (k) { return CAKE.deco[k][2]; }), sign: hasSign ? (lblIn.value.trim() || 'Alles Gute') : '', price: 'ca. ' + lo + '–' + hi + ' €', serv: CAKE.serv[n] };
    }
    form.addEventListener('change', upd); lblIn.addEventListener('input', upd);
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    upd();
    $('[data-cake-ask]').addEventListener('click', function () {
      var f = $('#kontakt-form'); if (!f || !cakeState) return;
      f.elements.anliegen.value = 'Torte für einen Anlass';
      f.elements.nachricht.value = 'Torte mit ' + cakeState.n + (cakeState.n > 1 ? ' Stockwerken' : ' Stockwerk') + ' für ' + cakeState.serv + ' Personen, Füllung ' + cakeState.fill +
        (cakeState.deco.length ? ', Deko: ' + cakeState.deco.join(', ') : '') + (cakeState.sign ? ' (Aufschrift: „' + cakeState.sign + '“)' : '') + '. Orientierung laut Konfigurator: ' + cakeState.price + '.';
    });
  }

  /* ---------- Kontaktformular ---------- */
  function initContact() {
    var f = $('#kontakt-form'), done = $('#kontakt-done'); if (!f) return;
    var job = $('[data-job]'); if (job) job.addEventListener('click', function () { f.elements.anliegen.value = 'Bewerbung'; });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var req = ['name', 'kontakt', 'anliegen', 'nachricht'].map(function (n) { return f.elements[n]; }), bad = [];
      req.forEach(function (el) { var ok = el.value.trim().length > 1; el.setAttribute('aria-invalid', !ok); if (!ok) bad.push(el); });
      var k = f.elements.kontakt.value.trim();
      if (k && !/@.+\./.test(k) && !/^[+0-9 ()\/-]{6,}$/.test(k)) { f.elements.kontakt.setAttribute('aria-invalid', 'true'); if (bad.indexOf(f.elements.kontakt) < 0) bad.unshift(f.elements.kontakt); }
      if (!f.elements.ok.checked) bad.push(f.elements.ok);
      $('[data-err="kontakt"]', f).hidden = !bad.length;
      if (bad.length) { bad[0].focus(); return; }
      $('[data-k-name]', done).textContent = f.elements.name.value.trim();
      var dl = $('[data-k-sum]', done); while (dl.firstChild) dl.removeChild(dl.firstChild);
      [['Kontakt', k], ['Anliegen', f.elements.anliegen.value], ['Wunschdatum', f.elements.datum.value ? new Date(f.elements.datum.value + 'T12:00:00').toLocaleDateString('de-DE') : '–'], ['Nachricht', f.elements.nachricht.value.trim()]].forEach(function (r) {
        var w = d.createElement('div'), dt = d.createElement('dt'), dd = d.createElement('dd'); dt.textContent = r[0]; dd.textContent = r[1]; w.appendChild(dt); w.appendChild(dd); dl.appendChild(w);
      });
      f.hidden = true; done.hidden = false; done.focus();
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    });
    $$('input, select, textarea', f).forEach(function (el) { el.addEventListener('input', function () { el.removeAttribute('aria-invalid'); }); });
    $('[data-k-reset]', done).addEventListener('click', function () { f.reset(); done.hidden = true; f.hidden = false; f.elements.name.focus(); if (window.ScrollTrigger) ScrollTrigger.refresh(); });
  }

  /* ---------- Reveals & aktive Navigation ---------- */
  function initReveals() {
    if (motionOff) return;
    $$('[data-reveal-rail]').forEach(function (r) { Array.prototype.forEach.call(r.children, function (c, i) { c.style.setProperty('--i', i); }); });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    $$('[data-reveal], [data-reveal-rail], .map').forEach(function (el) { io.observe(el); });
  }
  function initNav() {
    var links = $$('.nav a'), map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { var a = map[e.target.id]; if (a && e.isIntersecting) { links.forEach(function (l) { l.classList.toggle('is-active', l === a); }); } });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { var s = d.getElementById(id); if (s) io.observe(s); });
  }

  /* ---------- Lenis + GSAP: Sauerteig-Strecke ---------- */
  // GSAP, ScrollTrigger und Lenis werden erst nach dem ersten Bildschirm nachgeladen.
  var VENDOR = '/arena/backstube-korn/assets/vendor/';
  function loadScript(src, cb) { var s = d.createElement('script'); s.src = VENDOR + src; s.onload = cb; s.onerror = cb; d.head.appendChild(s); }
  function initMotion() {
    if (motionOff) return;
    loadScript('gsap.min.js', function () { loadScript('ScrollTrigger.min.js', function () {
      if (still) { setupMotion(); return; }
      loadScript('lenis.min.js', function () { idle(setupMotion); });
    }); });
  }
  function setupMotion() {
    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);
    if (!still && window.Lenis) {
      lenis = new Lenis({ lerp: 0.12, smoothWheel: true });
      window.__lenis = lenis;
      lenis.on('scroll', ScrollTrigger.update);
      lenis.on('scroll', onScroll);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
      d.addEventListener('click', function (e) {
        var a = e.target.closest('a[href^="#"]'); if (!a) return;
        var id = a.getAttribute('href'); if (id.length < 2) return;
        var t = d.querySelector(id); if (!t) return;
        e.preventDefault();
        lenis.scrollTo(t, { offset: id === '#inhalt' ? 0 : -(hdr.offsetHeight + 8), duration: 1.1 });
        if (id === '#inhalt') { t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true }); }
      });
    }
    var sec = $('#sauerteig'); if (!sec) return;
    var track = $('.sour__track', sec), view = $('.sour__view', sec), hEl = $('[data-sour-h]', sec);
    var dough = $('.jar__dough', sec), fill = $('.sour__ruler-fill', sec), steps = $$('.step', sec);
    var dist = 0;
    function measure() { dist = Math.max(0, track.scrollWidth - view.clientWidth + 40); sec.style.height = (innerHeight + dist) + 'px'; }
    var mm = gsap.matchMedia();
    mm.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', function () {
      sec.classList.add('sour--h');
      measure();
      ScrollTrigger.addEventListener('refreshInit', measure);
      var lastH = -1;
      var tw = gsap.to(track, {
        x: function () { return -dist; }, ease: 'none',
        scrollTrigger: {
          trigger: sec, start: 'top top', end: function () { return '+=' + dist; }, scrub: 0.5, invalidateOnRefresh: true,
          onUpdate: function (self) {
            var p = self.progress, h = Math.round(p * 48);
            fill.style.transform = 'scaleX(' + p.toFixed(4) + ')';
            dough.style.transform = 'scaleY(' + (0.25 + Math.min(1, p * 1.05) * 0.7).toFixed(3) + ')';
            if (h !== lastH) { lastH = h; hEl.textContent = String(h).padStart(2, '0'); }
          }
        }
      });
      hEl.textContent = '00';
      return function () {
        ScrollTrigger.removeEventListener('refreshInit', measure);
        tw.scrollTrigger && tw.scrollTrigger.kill(); tw.kill();
        sec.classList.remove('sour--h'); sec.style.height = ''; gsap.set(track, { clearProps: 'transform' });
        dough.style.transform = ''; hEl.textContent = '48';
      };
    });
    void steps;
    if (!cvs.length) ScrollTrigger.refresh();
  }

  /* ---------- Start in Etappen ---------- */
  var queue = [initOven, initBasket, initCake, initContact, initReveals, initNav, initOpenStatus, initMotion];
  var idle = window.requestIdleCallback ? function (fn) { requestIdleCallback(fn, { timeout: 300 }); } : function (fn) { setTimeout(fn, 16); };
  function pump() {
    var t0 = performance.now();
    while (queue.length && performance.now() - t0 < 20) {
      try { queue.shift()(); } catch (err) { if (window.console) console.warn(err); }
    }
    if (queue.length) idle(pump);
    else idle(layoutStep);
  }
  // Sektionen einzeln „aufwecken“, damit das erste Layout nicht in einem langen Task passiert
  var cvs = $$('.cv');
  function layoutStep() {
    var el = cvs.shift();
    if (el) { el.classList.remove('cv'); void el.offsetHeight; idle(layoutStep); return; }
    if (window.ScrollTrigger) requestAnimationFrame(function () { ScrollTrigger.refresh(); });
  }
  setTimeout(function () { idle(pump); }, 60);
})();
