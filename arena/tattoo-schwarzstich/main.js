/* ==========================================================================
   Schwarzstich Tattoo – Modell „Tinte“ (Demo, fiktiver Betrieb)
   Alle Rechenwerte stehen als Konstanten direkt hier oben.
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- Rechner: grobe Sitzungsdauer (unverbindliche Beispielrechnung) ---------- */
  var SESSION = {
    setupMin: 30,            // Vorbereitung, Stencil, Platzierung je Termin (Minuten)
    aspect: 0.7,             // angenommenes Seitenverhältnis: Fläche = Länge² × 0,7
    minPerCm2: {             // reine Stechzeit je cm² nach Stil (Minuten)
      blackwork: 1.6,
      fineline: 0.85,
      neotrad: 2.2,
      dotwork: 1.9,
      offen: 1.6
    },
    maxSessionMin: 330,      // höchstens 5,5 h Stechzeit pro Sitzung
    minSessionMin: 60,       // kürzester Termin inkl. Vorbereitung
    figureCm: 172,           // Silhouette entspricht 1,72 m …
    figureUnits: 458         // … auf 458 SVG-Einheiten (Kopf bis Fuß)
  };

  /* Körperstellen: pain = Empfindlichkeit 1–5 (Erfahrungswert), factor = Zeitfaktor, max = sinnvolle Maximalgröße in cm */
  var ZONES = {
    'hals':          { pain: 4, factor: 1.2,  max: 14, note: 'Sichtbare Stelle – wir besprechen vorher, ob das zu Ihrem Alltag passt.' },
    'nacken':        { pain: 3, factor: 1.1,  max: 16, note: 'Gut abdeckbar und beliebt für kleinere Motive.' },
    'brust':         { pain: 3, factor: 1.1,  max: 45, note: 'Das Brustbein ist deutlich empfindlicher als die Außenseiten.' },
    'bauch':         { pain: 3, factor: 1.15, max: 35, note: 'Haut verändert sich hier mit dem Körper – Motive mit etwas Luft altern besser.' },
    'rippen':        { pain: 5, factor: 1.25, max: 35, note: 'Eine der empfindlichsten Stellen. Kürzere Sitzungen sind hier normal.' },
    'huefte':        { pain: 3, factor: 1.1,  max: 25, note: 'Gut versteckt. In der Heilung drückt der Hosenbund – lockere Kleidung einplanen.' },
    'oberarm':       { pain: 2, factor: 1.0,  max: 30, note: 'Klassiker: gut auszuhalten, viel ruhige Fläche.' },
    'unterarm':      { pain: 2, factor: 1.0,  max: 26, note: 'Sehr beliebt, gut auszuhalten, heilt meist unkompliziert.' },
    'hand':          { pain: 4, factor: 1.3,  max: 12, note: 'Linien verlaufen hier schneller – ein Nachstechen eher mit einplanen.' },
    'oberschenkel':  { pain: 2, factor: 1.0,  max: 40, note: 'Große, ruhige Fläche und gut auszuhalten.' },
    'schienbein':    { pain: 4, factor: 1.15, max: 30, note: 'Der Knochen liegt nah unter der Haut – spürbar empfindlicher.' },
    'wade':          { pain: 2, factor: 1.0,  max: 30, note: 'Viel Muskel, gut auszuhalten.' },
    'fuss':          { pain: 4, factor: 1.3,  max: 12, note: 'Empfindlich und im Schuh belastet – Linien verlaufen leichter.' },
    'ruecken-oben':  { pain: 2, factor: 1.0,  max: 60, note: 'Die größte zusammenhängende Fläche – ideal für große Projekte.' },
    'ruecken-unten': { pain: 3, factor: 1.05, max: 50, note: 'Mittel empfindlich, entlang der Wirbelsäule spürbarer.' }
  };

  var STYLE_LABEL = { blackwork: 'Blackwork', fineline: 'Fine Line', neotrad: 'Neo-Traditional', dotwork: 'Dotwork', offen: 'Noch offen' };
  var STYLE_ARTIST = { blackwork: 'ronja', fineline: 'ben', neotrad: 'sami', dotwork: 'ronja' };
  var ARTIST_LABEL = { egal: 'Egal – wer am besten passt', ronja: 'Ronja', ben: 'Ben', sami: 'Sami', gast: 'Gast-Artist' };
  var ARTIST_STYLE = { ronja: 'blackwork', ben: 'fineline', sami: 'neotrad' };
  var WHEN_LABEL = { flexibel: 'flexibel', '4wochen': 'nächste 4 Wochen', '3monate': 'in 1–3 Monaten', spaeter: 'später in diesem Jahr' };

  /* ---------- Grundlagen ---------- */
  var root = document.documentElement;
  var motionOff = root.classList.contains('motion-off');
  var reduced = root.classList.contains('reduced') || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var animate = !motionOff && !reduced;
  var finePointer = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var fmt = function (n, d) { return n.toLocaleString('de-DE', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); };
  var lenis = null;

  function headerOffset() { var h = $('#header'); return h ? h.offsetHeight + 12 : 80; }

  /* ---------- Smooth Scroll (Lenis + ScrollTrigger) ---------- */
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);
  if (animate && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1, anchors: false });
    window.__lenis = lenis;
    if (hasGsap) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      var lraf = function (t) { lenis.raf(t); requestAnimationFrame(lraf); };
      requestAnimationFrame(lraf);
    }
  }
  function lockScroll(on) { if (lenis) { if (on) lenis.stop(); else lenis.start(); } }

  function scrollToEl(el, after, noFocus) {
    if (!el) return;
    var done = function () {
      if (noFocus) { if (after) after(); return; }
      if (!el.hasAttribute('tabindex') && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) el.setAttribute('tabindex', '-1');
      el.focus({ preventScroll: true });
      if (after) after();
    };
    if (lenis) {
      lenis.scrollTo(el, { offset: -headerOffset() + 1, duration: 1.3, easing: function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }, onComplete: done });
    } else {
      var y = el.getBoundingClientRect().top + window.scrollY - headerOffset() + 1;
      window.scrollTo({ top: y, behavior: animate ? 'smooth' : 'auto' });
      setTimeout(done, animate ? 600 : 0);
    }
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented) return;
    var id = a.getAttribute('href');
    if (id.length < 2) return;
    var target = document.getElementById(id.slice(1));
    if (!target) return;
    e.preventDefault();
    closeMenu(false);
    if (history.pushState) history.pushState(null, '', id);
    scrollToEl(target);
  });

  /* ---------- Header, Fortschritt, aktive Navigation ---------- */
  var header = $('#header');
  var bar = $('.progress-bar');
  function onScroll() {
    var y = window.scrollY || (lenis ? lenis.scroll : 0);
    header.classList.toggle('is-scrolled', y > 30);
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? clamp(y / max, 0, 1) : 0) + ')';
  }
  if (lenis) lenis.on('scroll', onScroll); else window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var navLinks = $$('.nav-list a');
  if ('IntersectionObserver' in window && navLinks.length) {
    var navIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        navLinks.forEach(function (l) { l.classList.toggle('is-active', l.getAttribute('href') === '#' + en.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['arbeiten', 'artists', 'flash', 'anfrage', 'pflege', 'studio', 'stimmen', 'anfahrt', 'faq'].forEach(function (id) { var s = document.getElementById(id); if (s) navIO.observe(s); });
  }

  /* ---------- Mobiles Menü ---------- */
  var menu = $('#menu'), menuBtn = $('.menu-btn');
  function openMenu() {
    menu.hidden = false;
    requestAnimationFrame(function () { menu.classList.add('is-open'); });
    menuBtn.setAttribute('aria-expanded', 'true');
    menuBtn.querySelector('.menu-btn-label').textContent = 'Schließen';
    lockScroll(true);
    document.body.style.overflow = 'hidden';
    var first = menu.querySelector('a'); if (first) first.focus();
  }
  function closeMenu(returnFocus) {
    if (!menu || menu.hidden) return;
    menu.classList.remove('is-open');
    menu.hidden = true;
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.querySelector('.menu-btn-label').textContent = 'Menü';
    lockScroll(false);
    document.body.style.overflow = '';
    if (returnFocus !== false) menuBtn.focus();
  }
  if (menuBtn) {
    menuBtn.addEventListener('click', function () { if (menu.hidden) openMenu(); else closeMenu(); });
    document.addEventListener('keydown', function (e) {
      if (menu.hidden) return;
      if (e.key === 'Escape') { e.preventDefault(); closeMenu(); }
      if (e.key === 'Tab') {
        var f = [menuBtn].concat($$('a', menu));
        var i = f.indexOf(document.activeElement);
        if (e.shiftKey && (i <= 0)) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
        else if (i === -1) { e.preventDefault(); f[0].focus(); }
      }
    });
    window.addEventListener('resize', function () { if (window.innerWidth >= 900) closeMenu(false); });
  }

  /* ---------- Tinten-Reveal ---------- */
  function ink(el) {
    if (el.classList.contains('is-inked')) return;
    el.classList.add('is-inked');
    if (!animate) return;
    var fin = function (e) { if (e && e.target !== el) return; el.classList.add('ink-done'); el.removeEventListener('animationend', fin); };
    el.addEventListener('animationend', fin);
    // Sicherheitsnetz, falls animationend ausbleibt (z. B. Tab im Hintergrund)
    setTimeout(function () { el.classList.add('ink-done'); }, 3200);
  }
  var inkEls = $$('[data-ink]');
  var heroInk = $$('.hero [data-ink]');
  if (!motionOff) {
    if ('IntersectionObserver' in window) {
      var inkIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { ink(en.target); inkIO.unobserve(en.target); }
        });
      }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
      inkEls.forEach(function (el) { if (heroInk.indexOf(el) === -1) inkIO.observe(el); });
    } else inkEls.forEach(ink);
    var startHero = function () { heroInk.forEach(ink); };
    if (document.fonts && document.fonts.ready) {
      Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 900); })]).then(function () { setTimeout(startHero, 120); });
    } else setTimeout(startHero, 200);
  }

  /* ---------- Hero: Dotwork-Mandala auf Canvas (Nadel zeichnet Punkt für Punkt) ----------
     Leistung: Fertige Punkte werden einmal in ein Offscreen-Bitmap „gebacken“. Danach zeichnet das
     Canvas nur noch neu, solange die Nadel zeichnet oder der Mauszeiger Punkte verdrängt. Die langsame
     Drehung macht CSS (Compositor, siehe .hero-canvas in style.css) – kein Dauer-Neuzeichnen. */
  (function heroCanvas() {
    var cv = $('.hero-canvas'), wrap = $('.hero-canvas-wrap');
    if (!cv || !cv.getContext || !wrap) return;
    var ctx = cv.getContext('2d');
    var base = document.createElement('canvas'), bctx = base.getContext('2d');
    var TAU = Math.PI * 2, DRAW_MS = 2600, FRESH_MS = 240, RAD = 80, PUSH = 16, CELL = 40;
    var BONE = '#B7B3A9', RED = '#D9262F', FRESH = '#E5484F'; // BONE = Knochen mit 78 % Deckung auf Schwarz, deckend gerechnet
    var N = 0, PX, PY, BORN, RING, grid = [], cols = 0;
    var W = 0, H = 0, dpr = 1, R = 0, dotR = 1.25, start = 0, baked = 0, visible = true, raf = 0;
    var ptr = { cx: 0, cy: 0, on: false }, sm = { x: 0, y: 0, s: 0, init: false };

    function density(x, y) {
      var r = Math.sqrt(x * x + y * y), t = Math.atan2(y, x), k, edge;
      if (r > 0.98) return 0;
      if (r < 0.045) return 1;
      if (r < 0.075) return 0;
      if (r < 0.16) return 0.85 - (r - 0.075) * 5;
      if (r > 0.175 && r < 0.2) return 0.95;
      if (r >= 0.2 && r < 0.235) return 0;
      if (r >= 0.235 && r < 0.56) {
        k = (r - 0.235) / 0.325; edge = Math.pow(Math.abs(Math.cos(6 * t)), 0.7);
        if (k < edge * 0.98) return 0.12 + 0.85 * Math.pow(k / Math.max(edge, 1e-3), 2.2);
        return 0;
      }
      if (r >= 0.56 && r < 0.6) return 0;
      if (r >= 0.6 && r < 0.63) return 1;
      if (r >= 0.65 && r < 0.86) {
        k = (r - 0.65) / 0.21;
        edge = 1 - Math.abs(((t * 24 / (2 * Math.PI)) % 1 + 1) % 1 - 0.5) * 2;
        if (k < Math.pow(edge, 1.6)) return 0.85 - 0.6 * k;
        return 0;
      }
      if (r > 0.895 && r < 0.915) return (Math.floor((t + Math.PI) / (2 * Math.PI) * 96) % 2 === 0) ? 0.9 : 0;
      return 0;
    }
    function band(r) { return r < 0.17 ? 5 : r < 0.21 ? 4 : r < 0.58 ? 3 : r < 0.64 ? 1 : r < 0.88 ? 0 : 2; }

    function build() {
      W = wrap.offsetWidth; H = wrap.offsetHeight;
      if (!W || !H) return false;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = base.width = Math.round(W * dpr); cv.height = base.height = Math.round(H * dpr);
      R = Math.min(W, H) * 0.47;
      dotR = W < 520 ? 1.15 : 1.25;
      var spacingPx = W < 520 ? 4.2 : 3.5;
      var s = spacingPx / R, row = 0, seed = 7, tmp = [];
      var rnd = function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
      for (var y = -1; y <= 1; y += s * 0.866, row++) {
        for (var x = -1 + (row % 2 ? s / 2 : 0); x <= 1; x += s) {
          var jx = x + (rnd() - 0.5) * s * 0.7, jy = y + (rnd() - 0.5) * s * 0.7;
          var d = density(jx, jy);
          if (d > 0 && rnd() < d) {
            var r = Math.sqrt(jx * jx + jy * jy), a = Math.atan2(jy, jx);
            tmp.push({ x: jx * R, y: jy * R, ring: r >= 0.6 && r < 0.63, key: band(r) + (a + Math.PI) / (2 * Math.PI) * 0.999 });
          }
        }
      }
      tmp.sort(function (p, q) { return p.key - q.key; });
      N = tmp.length;
      PX = new Float32Array(N); PY = new Float32Array(N); BORN = new Float32Array(N); RING = new Uint8Array(N);
      cols = Math.ceil((2 * R) / CELL) + 1; grid = new Array(cols * cols);
      for (var i = 0; i < N; i++) {
        var p = tmp[i];
        PX[i] = p.x; PY[i] = p.y; RING[i] = p.ring ? 1 : 0; BORN[i] = (i / N) * DRAW_MS;
        var gi = Math.min(cols - 1, Math.floor((p.y + R) / CELL)) * cols + Math.min(cols - 1, Math.floor((p.x + R) / CELL));
        (grid[gi] || (grid[gi] = [])).push(i);
      }
      baked = 0;
      bctx.setTransform(1, 0, 0, 1, 0, 0); bctx.clearRect(0, 0, base.width, base.height);
      return true;
    }
    // Reife Punkte (älter als FRESH_MS) einmalig ins Offscreen-Bitmap zeichnen
    function bakeTo(limit) {
      if (baked >= N || BORN[baked] > limit) return;
      var pb = new Path2D(), pr = new Path2D();
      while (baked < N && BORN[baked] <= limit) {
        var i = baked++, path = RING[i] ? pr : pb;
        path.moveTo(PX[i] + dotR, PY[i]); path.arc(PX[i], PY[i], dotR, 0, TAU);
      }
      bctx.setTransform(dpr, 0, 0, dpr, W / 2 * dpr, H / 2 * dpr);
      bctx.fillStyle = BONE; bctx.fill(pb);
      bctx.fillStyle = RED; bctx.fill(pr);
    }
    function spinAngle() {
      var a = cv.getAnimations ? cv.getAnimations()[0] : null;
      if (!a || a.currentTime == null) return 0;
      var dur = +a.effect.getTiming().duration || 180000;
      return ((a.currentTime % dur) / dur) * TAU;
    }
    function toLocal(cx, cy) {
      var r = wrap.getBoundingClientRect(), px = cx - (r.left + r.width / 2), py = cy - (r.top + r.height / 2);
      var a = -spinAngle(), c = Math.cos(a), s = Math.sin(a);
      return { x: px * c - py * s, y: px * s + py * c };
    }
    function push(i, path, rr) {
      var X = PX[i], Y = PY[i];
      if (sm.s > 0) {
        var dx = X - sm.x, dy = Y - sm.y, dd = dx * dx + dy * dy;
        if (dd < RAD * RAD) { var d = Math.sqrt(dd) || 1, k = 1 - d / RAD, f = k * k * PUSH * sm.s; X += dx / d * f; Y += dy / d * f; }
      }
      path.moveTo(X + rr, Y); path.arc(X, Y, rr, 0, TAU);
    }

    function frame(now) {
      raf = 0;
      if (!N) return;
      if (!start) start = now;
      var t = animate ? now - start : Infinity;
      bakeTo(t - FRESH_MS);
      // Zeiger mit Feder (Lerp) – Stärke blendet ein und aus, statt hart zu springen
      var near = false, l = null;
      if (ptr.on) { l = toLocal(ptr.cx, ptr.cy); near = Math.sqrt(l.x * l.x + l.y * l.y) < R + RAD; }
      if (near) {
        if (!sm.init) { sm.x = l.x; sm.y = l.y; sm.init = true; }
        sm.x += (l.x - sm.x) * 0.2; sm.y += (l.y - sm.y) * 0.2;
      }
      sm.s += ((near ? 1 : 0) - sm.s) * 0.12;
      if (!near && sm.s < 0.004) { sm.s = 0; sm.init = false; }

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.drawImage(base, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, W / 2 * dpr, H / 2 * dpr);
      if (sm.s > 0) {
        // Loch ins Bitmap stanzen und die Punkte darin verdrängt neu zeichnen
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath(); ctx.arc(sm.x, sm.y, RAD + 2, 0, TAU); ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
        var Q = RAD + 3 + dotR, pb = new Path2D(), pr = new Path2D();
        var x0 = Math.max(0, Math.floor((sm.x - Q + R) / CELL)), x1 = Math.min(cols - 1, Math.floor((sm.x + Q + R) / CELL));
        var y0 = Math.max(0, Math.floor((sm.y - Q + R) / CELL)), y1 = Math.min(cols - 1, Math.floor((sm.y + Q + R) / CELL));
        for (var gy = y0; gy <= y1; gy++) for (var gx = x0; gx <= x1; gx++) {
          var cell = grid[gy * cols + gx]; if (!cell) continue;
          for (var k = 0; k < cell.length; k++) {
            var i = cell[k]; if (i >= baked) continue;
            var ex = PX[i] - sm.x, ey = PY[i] - sm.y;
            if (ex * ex + ey * ey < Q * Q) push(i, RING[i] ? pr : pb, dotR);
          }
        }
        ctx.fillStyle = BONE; ctx.fill(pb);
        ctx.fillStyle = RED; ctx.fill(pr);
      }
      if (baked < N) {
        // frisch gestochene Punkte: wachsen kurz und leuchten rot, bevor sie ins Bitmap wandern
        var pf = new Path2D(), pr2 = new Path2D();
        for (var j = baked; j < N && BORN[j] <= t; j++) push(j, RING[j] ? pr2 : pf, dotR * (0.6 + 0.4 * (t - BORN[j]) / FRESH_MS));
        ctx.fillStyle = FRESH; ctx.fill(pf);
        ctx.fillStyle = RED; ctx.fill(pr2);
      }
      var busy = baked < N || near || sm.s > 0;
      if (animate && busy && visible && !document.hidden) raf = requestAnimationFrame(frame);
    }
    function kick() { if (!raf && N && visible && !document.hidden) raf = requestAnimationFrame(frame); }
    function init() {
      if (!build()) return;
      if (!animate) { frame(performance.now()); return; }
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) kick(); }, { threshold: 0 }).observe(wrap);
        var heroEl = $('.hero');
        new IntersectionObserver(function (en) { heroEl.classList.toggle('is-off', !en[0].isIntersecting); }, { threshold: 0 }).observe(heroEl);
      }
      document.addEventListener('visibilitychange', kick);
      if (finePointer) {
        var art = $('.hero');
        art.addEventListener('pointermove', function (e) {
          ptr.cx = e.clientX; ptr.cy = e.clientY; ptr.on = true;
          var r = wrap.getBoundingClientRect(), dx = e.clientX - r.left - r.width / 2, dy = e.clientY - r.top - r.height / 2;
          if (sm.s > 0 || dx * dx + dy * dy < (R + RAD) * (R + RAD)) kick(); // abseits des Mandalas nichts neu zeichnen
        });
        art.addEventListener('pointerleave', function () { ptr.on = false; kick(); });
      }
      kick();
    }
    var rz, lastW = 0;
    window.addEventListener('resize', function () {
      clearTimeout(rz);
      rz = setTimeout(function () {
        if (wrap.offsetWidth === lastW) return;
        lastW = wrap.offsetWidth;
        var old = start; if (!build()) return; start = old;
        if (!animate) { frame(performance.now()); return; }
        if (start) bakeTo(performance.now() - start - FRESH_MS);
        frame(performance.now());
      }, 200);
    });
    // Aufbau erst, wenn der Browser Luft hat: erster Bildschirm (Titel, Foto) zuerst
    var go = function () { lastW = wrap.offsetWidth; init(); };
    if (window.requestIdleCallback) requestIdleCallback(go, { timeout: 400 }); else setTimeout(go, 60);
  })();

  /* ---------- Manifest: Wörter füllen sich beim Scrollen ---------- */
  (function manifest() {
    var el = $('[data-words]');
    if (!el) return;
    var words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    var spans = words.map(function (w, i) {
      var s = document.createElement('span'); s.className = 'w'; s.textContent = w;
      el.appendChild(s); if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
      return s;
    });
    if (!animate || !hasGsap) { spans.forEach(function (s) { s.style.opacity = '1'; }); return; }
    gsap.fromTo(spans, { opacity: 0.16 }, { opacity: 1, ease: 'none', stagger: 0.12, scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 48%', scrub: 0.6 } });
  })();

  /* ---------- Zahlen zählen hoch ---------- */
  (function counters() {
    var els = $$('[data-count]');
    if (!animate || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        var el = en.target, to = parseFloat(el.dataset.count), dec = +(el.dataset.decimals || 0);
        if (to > 999) return;
        var t0 = performance.now(), dur = 1200;
        var step = function (now) {
          var k = clamp((now - t0) / dur, 0, 1), e = 1 - Math.pow(1 - k, 4);
          el.textContent = fmt(to * e, dec);
          if (k < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    els.forEach(function (el) { io.observe(el); });
  })();

  /* ---------- Stile: Vorschaubild folgt dem Cursor (Lerp) ---------- */
  (function stylePreview() {
    var list = $('.style-list'), pv = $('.style-preview');
    if (!list || !pv || !finePointer) return;
    var img = pv.querySelector('img');
    var cur = { x: 0, y: 0 }, tgt = { x: 0, y: 0 }, on = false, raf = 0, rot = 0;
    function loop() {
      var px = cur.x;
      cur.x += (tgt.x - cur.x) * (animate ? 0.14 : 1);
      cur.y += (tgt.y - cur.y) * (animate ? 0.14 : 1);
      var vx = cur.x - px;
      rot += ((animate ? clamp(vx * 0.35, -10, 10) : 0) - rot) * 0.1;
      pv.style.transform = 'translate3d(' + (cur.x - pv.offsetWidth / 2) + 'px,' + (cur.y - pv.offsetHeight / 2) + 'px,0) rotate(' + rot.toFixed(2) + 'deg)';
      if (on || Math.abs(tgt.x - cur.x) > 0.3 || Math.abs(tgt.y - cur.y) > 0.3) raf = requestAnimationFrame(loop); else raf = 0;
    }
    list.addEventListener('pointerenter', function (e) { cur.x = tgt.x = e.clientX + 120; cur.y = tgt.y = e.clientY; });
    list.addEventListener('pointermove', function (e) {
      if (window.innerWidth < 900) return;
      tgt.x = e.clientX + 150; tgt.y = e.clientY;
      var row = e.target.closest('.style-row');
      if (row) {
        var src = row.dataset.img;
        if (img.getAttribute('src') !== src) { img.src = src; pv.classList.toggle('is-paper', /\.svg$/.test(src)); }
        if (!on) { on = true; pv.classList.add('is-on'); }
      }
      if (!raf) raf = requestAnimationFrame(loop);
    });
    list.addEventListener('pointerleave', function () { on = false; pv.classList.remove('is-on'); });
  })();

  /* ---------- Portfolio: Filter (FLIP), Farbe beim Scrollen auf Touch, Lightbox ---------- */
  var pf = (function portfolio() {
    var grid = $('#pf-grid');
    if (!grid) return null;
    var items = $$('.pf-item', grid).filter(function (li) { return li.dataset.artist; });
    var chips = $$('.chip');
    var countEl = $('#pf-count'), empty = $('#pf-empty');
    var state = { artist: 'alle', style: 'alle' };

    function apply(silent) {
      var before = new Map();
      if (animate && !silent) items.forEach(function (li) { if (!li.hidden) before.set(li, li.getBoundingClientRect()); });
      var n = 0;
      items.forEach(function (li) {
        var ok = (state.artist === 'alle' || li.dataset.artist === state.artist) && (state.style === 'alle' || li.dataset.style === state.style);
        li.hidden = !ok; if (ok) n++;
      });
      countEl.textContent = n;
      empty.hidden = n > 0;
      chips.forEach(function (c) { c.setAttribute('aria-pressed', String(state[c.dataset.filter] === c.dataset.value)); });
      if (!animate || silent) return;
      items.forEach(function (li, i) {
        if (li.hidden) return;
        var r = li.getBoundingClientRect(), b = before.get(li);
        if (b) {
          var dx = b.left - r.left, dy = b.top - r.top, sx = b.width / r.width, sy = b.height / r.height;
          if (Math.abs(dx) + Math.abs(dy) > 1 || Math.abs(1 - sx) > 0.01 || Math.abs(1 - sy) > 0.01) {
            li.animate([{ transformOrigin: '0 0', transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + sx + ',' + sy + ')' }, { transformOrigin: '0 0', transform: 'none' }], { duration: 520, easing: 'cubic-bezier(0.77, 0, 0.175, 1)' });
          }
        } else {
          li.animate([{ opacity: 0, transform: 'scale(.96)' }, { opacity: 1, transform: 'none' }], { duration: 420, delay: 60 + i * 30, easing: 'cubic-bezier(0.23, 1, 0.32, 1)', fill: 'backwards' });
        }
      });
      if (hasGsap) setTimeout(function () { ScrollTrigger.refresh(); }, 560);
    }
    chips.forEach(function (c) {
      c.addEventListener('click', function () { state[c.dataset.filter] = c.dataset.value; apply(); });
    });
    $('#pf-reset').addEventListener('click', function () { state.artist = 'alle'; state.style = 'alle'; apply(); });
    $$('[data-show-artist]').forEach(function (b) {
      b.addEventListener('click', function () {
        state.artist = b.dataset.showArtist; state.style = 'alle'; apply(true);
        scrollToEl($('#arbeiten'));
      });
    });

    // Touch: Farbe zieht ein, sobald das Bild durch die Bildschirmmitte läuft
    if (!finePointer && 'IntersectionObserver' in window) {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { en.target.classList.toggle('is-color', en.isIntersecting); });
      }, { rootMargin: '-38% 0px -38% 0px' });
      items.forEach(function (li) { cio.observe(li); });
    }

    // Lightbox
    var lb = $('#lightbox'), lbMedia = $('#lb-media'), lbTitle = $('#lb-title'), lbMeta = $('#lb-meta'), lbCount = $('#lb-count');
    var list = [], idx = 0, opener = null, dir = 0;
    function render() {
      var btn = list[idx].querySelector('.pf-btn');
      lbMedia.textContent = '';
      lbMedia.classList.remove('is-paper');
      if (btn.dataset.full) {
        var src = btn.dataset.full, im = document.createElement('img');
        im.src = src; im.width = +btn.dataset.w; im.height = +btn.dataset.h; im.decoding = 'async';
        im.alt = btn.querySelector('.pf-img').getAttribute('alt') || '';
        if (/\.svg$/.test(src)) lbMedia.classList.add('is-paper');
        lbMedia.appendChild(im);
      } else if (btn.dataset.symbol) {
        lbMedia.classList.add('is-paper');
        var svg = btn.querySelector('.pf-svg').cloneNode(true);
        lbMedia.appendChild(svg);
      }
      lbTitle.textContent = btn.dataset.title;
      lbMeta.textContent = btn.dataset.meta;
      lbCount.textContent = String(idx + 1).padStart(2, '0') + ' / ' + String(list.length).padStart(2, '0');
      // Richtung sichtbar machen: das neue Motiv kommt von der Seite, in die geblättert wurde
      var el = lbMedia.firstElementChild;
      if (animate && dir && el && el.animate) {
        el.animate([{ opacity: 0, transform: 'translateX(' + (dir * 28) + 'px)' }, { opacity: 1, transform: 'none' }], { duration: 240, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' });
      }
      dir = 0;
    }
    function open(li) {
      list = items.filter(function (x) { return !x.hidden; });
      idx = Math.max(0, list.indexOf(li));
      opener = li.querySelector('.pf-btn');
      render();
      lb.showModal();
      lockScroll(true);
    }
    function go(d, quiet) { idx = (idx + d + list.length) % list.length; dir = quiet ? 0 : d; render(); }
    items.forEach(function (li) { li.querySelector('.pf-btn').addEventListener('click', function () { open(li); }); });
    $('#lb-prev').addEventListener('click', function () { go(-1); });
    $('#lb-next').addEventListener('click', function () { go(1); });
    $('#lb-close').addEventListener('click', function () { lb.close(); });
    lb.addEventListener('keydown', function (e) {
      // Tastatur blättert ohne Animation (häufige Aktion, soll sofort reagieren)
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1, true); }
      if (e.key === 'ArrowRight') { e.preventDefault(); go(1, true); }
    });
    lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
    lb.addEventListener('close', function () { lockScroll(false); if (opener) opener.focus({ preventScroll: true }); });

    // Touch: Wischen blättert – das Bild folgt dem Finger, ein schneller Schwung reicht
    var sw = null;
    lbMedia.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' || !e.isPrimary || list.length < 2) return;
      sw = { x: e.clientX, t: performance.now(), id: e.pointerId, dx: 0 };
    });
    lbMedia.addEventListener('pointermove', function (e) {
      if (!sw || e.pointerId !== sw.id) return;
      sw.dx = e.clientX - sw.x;
      var el = lbMedia.firstElementChild;
      if (el && animate) { el.style.transition = 'none'; el.style.transform = 'translateX(' + sw.dx + 'px)'; el.style.opacity = String(1 - Math.min(0.5, Math.abs(sw.dx) / 600)); }
    });
    function endSwipe(e) {
      if (!sw || e.pointerId !== sw.id) return;
      var dx = sw.dx, v = Math.abs(dx) / Math.max(1, performance.now() - sw.t), el = lbMedia.firstElementChild;
      sw = null;
      if (e.type === 'pointerup' && (Math.abs(dx) > 70 || (Math.abs(dx) > 18 && v > 0.35))) { go(dx < 0 ? 1 : -1); return; }
      if (el) { el.style.transition = 'transform 200ms cubic-bezier(0.23, 1, 0.32, 1), opacity 200ms ease'; el.style.transform = ''; el.style.opacity = ''; }
    }
    lbMedia.addEventListener('pointerup', endSwipe);
    lbMedia.addEventListener('pointercancel', endSwipe);
    $('#lb-request').addEventListener('click', function (e) {
      var item = list[idx];
      e.preventDefault();
      lb.close();
      if (wiz) wiz.prefill(item.dataset.style, item.dataset.artist === 'gast' ? 'gast' : item.dataset.artist);
      scrollToEl($('#anfrage'));
    });
    return { apply: apply };
  })();

  /* ---------- Flash Day: Motive reservieren (Demo) ---------- */
  (function flash() {
    var dlg = $('#flash-dialog');
    if (!dlg) return;
    var form = $('#fd-form'), body = $('#fd-body'), done = $('#fd-done');
    var freeEl = $('#flash-free');
    var card = null, pendingStamp = null;
    function updateFree() { freeEl.textContent = $$('.flash-card:not(.is-taken)').length; }
    function setErr(input, errId, bad) {
      var err = document.getElementById(errId);
      if (input) { if (bad) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid'); }
      if (err) err.hidden = !bad;
    }
    $$('.flash-card .flash-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        card = b.closest('.flash-card');
        if (card.classList.contains('is-taken')) return;
        form.reset();
        $$('.field-error', form).forEach(function (e) { e.hidden = true; });
        $$('[aria-invalid]', form).forEach(function (e) { e.removeAttribute('aria-invalid'); });
        body.hidden = false; done.hidden = true;
        $('#fd-use').setAttribute('href', card.querySelector('.flash-art use').getAttribute('href'));
        $('#fd-title').textContent = card.dataset.title;
        $('#fd-meta').textContent = card.dataset.size + ' · ' + card.dataset.price + ' · bei ' + card.dataset.artist;
        dlg.showModal();
        lockScroll(true);
        setTimeout(function () { $('#fd-name').focus(); }, 30);
      });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = $('#fd-name'), contact = $('#fd-contact'), age = $('#fd-age');
      var time = form.querySelector('input[name="zeit"]:checked');
      var cv = contact.value.trim();
      var okName = name.value.trim().length >= 2;
      var okContact = /\S+@\S+\.\S+/.test(cv) || cv.replace(/\D/g, '').length >= 6;
      setErr(name, 'fd-name-err', !okName);
      setErr(contact, 'fd-contact-err', !okContact);
      setErr(null, 'fd-time-err', !time);
      setErr(age, 'fd-age-err', !age.checked);
      if (!okName) return name.focus();
      if (!okContact) return contact.focus();
      if (!time) return form.querySelector('input[name="zeit"]:not(:disabled)').focus();
      if (!age.checked) return age.focus();
      $('#fd-done-name').textContent = name.value.trim().split(' ')[0];
      $('#fd-done-text').textContent = '„' + card.dataset.title + '“ ist für Sie vorgemerkt: Samstag, 14. November, ' + time.value + ' Uhr bei ' + card.dataset.artist + '. Bitte kommen Sie zehn Minuten früher und bringen Sie Ihren Ausweis mit.';
      body.hidden = true; done.hidden = false; done.focus();
      card.classList.add('is-taken', 'is-mine');
      card.querySelector('.stamp').textContent = 'Reserviert';
      var b = card.querySelector('.flash-btn');
      b.disabled = true;
      b.textContent = 'Reserviert';
      pendingStamp = card;
      updateFree();
    });
    $$('[data-close]', dlg).forEach(function (b) { b.addEventListener('click', function () { dlg.close(); }); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', function () {
      lockScroll(false);
      if (pendingStamp) {
        var c = pendingStamp; pendingStamp = null;
        c.classList.add('just-stamped');
        c.setAttribute('tabindex', '-1');
        c.focus({ preventScroll: true });
      } else if (card) {
        var btn = card.querySelector('.flash-btn'); if (btn && !btn.disabled) btn.focus({ preventScroll: true });
      }
    });
    updateFree();
  })();

  /* ---------- Anfrage-Assistent mit Körper-Silhouette ---------- */
  var wiz = (function wizard() {
    var form = $('#wiz');
    if (!form) return null;
    var stage = $('.fig-stage', form), svg = $('.fig', form);
    var zones = $$('.zone', form);
    var zoneSel = $('#f-zone'), sizeIn = $('#f-size'), sizeOut = $('#size-out'), sizeHint = $('#size-hint');
    var artistSel = $('#f-artist'), artistHint = $('#artist-hint');
    var readout = $('#fig-readout'), estV = $('#est-value'), estS = $('#est-sessions');
    var zoneInfo = $('#zone-info'), painEl = $('#zone-pain'), noteEl = $('#zone-note');
    var ell = $('.fig-size', form);
    var idea = $('#f-idea'), ideaCount = $('#idea-count');
    var stepBtns = $$('.wiz-step-btn', form);
    var panels = $$('.wiz-panel', form);
    var success = $('#wiz-success');
    var step = 1;
    var current = null; // ausgewähltes .zone-Element

    function viewNow() { var r = form.querySelector('input[name="ansicht"]:checked'); return r ? r.value : 'vorne'; }
    function styleNow() { var r = form.querySelector('input[name="stil"]:checked'); return r ? r.value : 'offen'; }

    function estimate() {
      if (!current) return null;
      var z = ZONES[current.dataset.zone] || { factor: 1 };
      var s = +sizeIn.value;
      var work = s * s * SESSION.aspect * SESSION.minPerCm2[styleNow()] * z.factor;
      var sessions = Math.max(1, Math.ceil(work / SESSION.maxSessionMin));
      var total = Math.max(SESSION.minSessionMin, work + SESSION.setupMin * sessions);
      return { hours: Math.round(total / 30) / 2, sessions: sessions };
    }
    function hoursText(h) { return h < 1 ? 'ca. 1 h' : 'ca. ' + fmt(h, h % 1 ? 1 : 0) + ' h'; }
    function updateEstimate() {
      var e = estimate();
      if (!e) { estV.textContent = '–'; estS.textContent = 'Wählen Sie Stelle und Größe'; return; }
      estV.textContent = hoursText(e.hours).replace('ca. ', '≈ ');
      estS.textContent = e.sessions === 1 ? 'in 1 Sitzung · ' + STYLE_LABEL[styleNow()] : 'verteilt auf ca. ' + e.sessions + ' Sitzungen · ' + STYLE_LABEL[styleNow()];
    }
    function updateEllipse() {
      if (!current || !ell) return;
      var bb = current.getBBox();
      var units = (+sizeIn.value / SESSION.figureCm) * SESSION.figureUnits;
      ell.setAttribute('cx', (bb.x + bb.width / 2).toFixed(1));
      ell.setAttribute('cy', (bb.y + bb.height / 2).toFixed(1));
      ell.setAttribute('rx', (units * 0.42).toFixed(1));
      ell.setAttribute('ry', (units / 2).toFixed(1));
      ell.classList.toggle('is-on', current.dataset.view === viewNow());
    }
    function updateSize() {
      var s = +sizeIn.value;
      sizeOut.textContent = s + ' cm';
      sizeIn.setAttribute('aria-valuetext', s + ' Zentimeter');
      sizeIn.style.setProperty('--p', ((s - +sizeIn.min) / (+sizeIn.max - +sizeIn.min) * 100) + '%');
      var z = current ? ZONES[current.dataset.zone] : null;
      if (z && s > z.max) {
        sizeHint.textContent = 'Für ' + current.dataset.label + ' sind eher bis ' + z.max + ' cm üblich – wir beraten Sie gern zu Alternativen.';
        sizeHint.classList.add('is-warn');
      } else {
        sizeHint.textContent = s <= 4 ? 'Sehr klein: feine Details brauchen etwas Platz, sonst laufen sie mit den Jahren zu.' : '';
        sizeHint.classList.remove('is-warn');
      }
      updateEllipse(); updateEstimate(); updateSummary();
    }
    function setRoving() {
      ['vorne', 'hinten'].forEach(function (v) {
        var zs = zones.filter(function (z) { return z.dataset.view === v; });
        var sel = zs.filter(function (z) { return z === current; })[0] || zs[0];
        zs.forEach(function (z) { z.setAttribute('tabindex', z === sel ? '0' : '-1'); });
      });
    }
    function selectZone(z, opts) {
      opts = opts || {};
      current = z;
      zones.forEach(function (x) { x.setAttribute('aria-checked', String(x === z)); });
      setRoving();
      if (!z) {
        readout.textContent = 'Tippen Sie auf eine Stelle der Silhouette.';
        zoneInfo.hidden = true; if (ell) ell.classList.remove('is-on');
        updateEstimate(); updateSummary(); return;
      }
      zoneSel.value = z.id.replace(/^z-/, '');
      zoneSel.removeAttribute('aria-invalid'); $('#f-zone-err').hidden = true;
      if (z.dataset.view !== viewNow()) setView(z.dataset.view, true);
      var info = ZONES[z.dataset.zone];
      readout.textContent = '';
      var strong = document.createElement('strong'); strong.textContent = z.dataset.label;
      readout.appendChild(document.createTextNode('Gewählt: ')); readout.appendChild(strong);
      readout.appendChild(document.createTextNode(' · ' + (z.dataset.view === 'vorne' ? 'Vorderseite' : 'Rückseite')));
      if (info) {
        zoneInfo.hidden = false;
        $$('i', painEl).forEach(function (i, k) { i.classList.toggle('on', k < info.pain); });
        painEl.setAttribute('aria-label', 'Empfindlichkeit ' + info.pain + ' von 5');
        painEl.setAttribute('role', 'img');
        noteEl.textContent = info.note;
      }
      if (opts.focus) z.focus();
      updateSize();
    }
    function setView(v, fromSelect) {
      var radio = form.querySelector('input[name="ansicht"][value="' + v + '"]');
      if (radio && !radio.checked) radio.checked = true;
      stage.dataset.view = v;
      if (animate && svg.animate && !fromSelect) {
        svg.animate([{ transform: 'rotateY(90deg)', opacity: 0.4 }, { transform: 'rotateY(0deg)', opacity: 1 }], { duration: 380, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' });
      }
      updateEllipse();
    }
    $$('input[name="ansicht"]', form).forEach(function (r) { r.addEventListener('change', function () { setView(r.value); }); });

    zones.forEach(function (z) {
      z.addEventListener('click', function () { selectZone(z); });
      z.addEventListener('keydown', function (e) {
        var same = zones.filter(function (x) { return x.dataset.view === z.dataset.view; });
        var i = same.indexOf(z), n = null;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') n = same[(i + 1) % same.length];
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') n = same[(i - 1 + same.length) % same.length];
        if (e.key === 'Home') n = same[0];
        if (e.key === 'End') n = same[same.length - 1];
        if (n) { e.preventDefault(); selectZone(n, { focus: true }); }
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); selectZone(z); }
      });
    });
    zoneSel.addEventListener('change', function () {
      var z = zoneSel.value ? document.getElementById('z-' + zoneSel.value) : null;
      selectZone(z);
    });
    sizeIn.addEventListener('input', updateSize);
    $$('input[name="stil"]', form).forEach(function (r) {
      r.addEventListener('change', function () {
        var suggest = STYLE_ARTIST[r.value];
        if (suggest && artistSel.value === 'egal') artistHint.textContent = 'Passt gut zu ' + ARTIST_LABEL[suggest] + ' – Sie können trotzdem „egal“ lassen.';
        else artistHint.textContent = '';
        updateEstimate(); updateSummary();
      });
    });
    artistSel.addEventListener('change', function () { artistHint.textContent = ''; updateSummary(); });
    idea.addEventListener('input', function () {
      ideaCount.textContent = idea.value.trim().length;
      if (idea.value.trim().length >= 20) { idea.removeAttribute('aria-invalid'); $('#f-idea-err').hidden = true; }
    });

    function updateSummary() {
      var e = estimate();
      var map = {
        stelle: current ? current.dataset.label + ', ' + current.dataset.view : '–',
        groesse: sizeIn.value + ' cm',
        stil: STYLE_LABEL[styleNow()],
        artist: ARTIST_LABEL[artistSel.value],
        dauer: e ? hoursText(e.hours) + (e.sessions > 1 ? ', ' + e.sessions + ' Sitzungen' : ', 1 Sitzung') : '–'
      };
      $$('[data-sum]', form).forEach(function (dd) { dd.textContent = map[dd.dataset.sum]; });
      return map;
    }

    function err(input, id, bad) {
      var el = document.getElementById(id);
      if (input) { if (bad) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid'); }
      if (el) el.hidden = !bad;
      return !bad;
    }
    function validate(n) {
      if (n === 1) {
        if (!err(zoneSel, 'f-zone-err', !current)) { return { ok: false, focus: zones.filter(function (z) { return z.getAttribute('tabindex') === '0' && z.dataset.view === viewNow(); })[0] || zoneSel }; }
      }
      if (n === 4) {
        if (!err(idea, 'f-idea-err', idea.value.trim().length < 20)) return { ok: false, focus: idea };
      }
      if (n === 5) {
        var name = $('#f-name'), mail = $('#f-mail'), age = $('#f-age'), priv = $('#f-privacy');
        var a = err(name, 'f-name-err', name.value.trim().length < 2);
        var b = err(mail, 'f-mail-err', !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail.value.trim()));
        var c = err(age, 'f-age-err', !age.checked);
        var d = err(priv, 'f-privacy-err', !priv.checked);
        if (!(a && b && c && d)) return { ok: false, focus: !a ? name : !b ? mail : !c ? age : priv };
      }
      return { ok: true };
    }
    function goTo(n, focusPanel) {
      form.dataset.dir = n < step ? 'back' : 'fwd';
      step = n;
      form.dataset.step = String(n);
      stepBtns.forEach(function (b) {
        var k = +b.dataset.goto;
        if (k === n) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
        b.classList.toggle('is-done', k < n);
      });
      updateSummary();
      if (focusPanel) {
        var p = panels[n - 1];
        p.setAttribute('tabindex', '-1');
        p.focus({ preventScroll: true });
        var top = $('.wiz-main', form).getBoundingClientRect().top;
        if (top < headerOffset() || top > window.innerHeight * 0.6) scrollToEl($('.wiz-steps', form) || form, null, true);
      }
    }
    form.addEventListener('click', function (e) {
      var b = e.target.closest('[data-wiz]');
      if (b && b.dataset.wiz === 'next') {
        var v = validate(step);
        if (!v.ok) { if (v.focus) v.focus.focus(); return; }
        goTo(Math.min(5, step + 1), true);
      }
      if (b && b.dataset.wiz === 'back') goTo(Math.max(1, step - 1), true);
      var sb = e.target.closest('.wiz-step-btn');
      if (sb) {
        var target = +sb.dataset.goto;
        if (target <= step) { goTo(target, true); return; }
        for (var k = step; k < target; k++) {
          var r = validate(k);
          if (!r.ok) { goTo(k, false); if (r.focus) r.focus.focus(); return; }
        }
        goTo(target, true);
      }
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      for (var k = 1; k <= 5; k++) {
        var r = validate(k);
        if (!r.ok) { goTo(k, false); if (r.focus) r.focus.focus(); return; }
      }
      var map = updateSummary();
      var name = $('#f-name').value.trim();
      $('#ok-name').textContent = name.split(' ')[0];
      var sum = $('#ok-summary'); sum.textContent = '';
      var rows = [['Stelle', map.stelle], ['Größe', map.groesse], ['Stil', map.stil], ['Artist', map.artist], ['Dauer (grob)', map.dauer],
        ['Zeitraum', WHEN_LABEL[$('#f-when').value]], ['E-Mail', $('#f-mail').value.trim()], ['Idee', idea.value.trim()]];
      rows.forEach(function (r) {
        var d = document.createElement('div'), dt = document.createElement('dt'), dd = document.createElement('dd');
        dt.textContent = r[0]; dd.textContent = r[1]; if (r[0] === 'Idee' || r[0] === 'E-Mail') d.className = 'wide'; d.appendChild(dt); d.appendChild(dd); sum.appendChild(d);
      });
      form.classList.add('is-sent');
      success.hidden = false;
      success.focus({ preventScroll: true });
      scrollToEl($('#anfrage'), null, true);
    });
    $('#wiz-restart').addEventListener('click', function () {
      form.reset();
      form.classList.remove('is-sent'); success.hidden = true;
      selectZone(null); setView('vorne', true); updateSize(); ideaCount.textContent = '0';
      goTo(1, true);
    });

    function prefill(style, artist) {
      if (style) { var r = form.querySelector('input[name="stil"][value="' + style + '"]'); if (r) r.checked = true; }
      if (artist && artistSel.querySelector('option[value="' + artist + '"]')) artistSel.value = artist;
      artistHint.textContent = '';
      updateEstimate(); updateSummary();
    }
    $$('[data-prefill-artist]').forEach(function (a) {
      a.addEventListener('click', function () { var ar = a.dataset.prefillArtist; prefill(ARTIST_STYLE[ar], ar); });
    });

    setRoving(); updateSize(); goTo(1, false);
    return { prefill: prefill };
  })();

  /* ---------- Pflege: Tag-Regler ---------- */
  var careCards = $$('.care-card');
  var careRail = null; // wird in der Scroll-Choreografie gesetzt (Desktop): { goTo(card) }
  (function careTool() {
    var input = $('#care-day'), out = $('#care-day-out'), now = $('#care-now');
    if (!input) return;
    function upd(e) {
      var d = +input.value;
      out.textContent = d >= 45 ? '45+' : String(d);
      input.setAttribute('aria-valuetext', d === 0 ? 'heute gestochen' : d >= 45 ? 'über sechs Wochen' : d + (d === 1 ? ' Tag' : ' Tage'));
      input.style.setProperty('--p', (d / 45 * 100) + '%');
      var hit = null;
      careCards.forEach(function (c) {
        var on = d >= +c.dataset.from && d <= +c.dataset.to;
        c.classList.toggle('is-now', on); if (on) hit = c;
      });
      if (hit) {
        now.textContent = '';
        var s = document.createElement('strong');
        s.textContent = hit.querySelector('.care-when').textContent + ' – ' + hit.querySelector('.care-title').textContent + ': ';
        now.appendChild(s);
        now.appendChild(document.createTextNode(hit.querySelector('li').textContent));
        // Desktop: Der Regler zieht die Zeitleiste zur passenden Phase
        if (e && careRail) careRail.goTo(hit);
      }
    }
    input.addEventListener('input', upd);
    upd();
  })();

  /* ---------- Öffnungsstatus (Ortszeit Kiel) ---------- */
  (function hoursNow() {
    var el = $('#hours-now');
    if (!el || !window.Intl) return;
    try {
      var parts = new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', weekday: 'short', hour: 'numeric', hour12: false }).formatToParts(new Date());
      var wd = '', hr = 0;
      parts.forEach(function (p) { if (p.type === 'weekday') wd = p.value.replace('.', ''); if (p.type === 'hour') hr = +p.value; });
      var openDays = ['Di', 'Mi', 'Do', 'Fr', 'Sa'];
      var isOpen = openDays.indexOf(wd) > -1 && hr >= 12 && hr < 20;
      if (isOpen) { el.textContent = 'Jetzt geöffnet – bis 20 Uhr'; el.classList.add('is-open'); }
      else {
        var next = (openDays.indexOf(wd) > -1 && hr < 12) ? 'heute ab 12 Uhr' : (wd === 'Sa' || wd === 'So' || wd === 'Mo') ? 'Dienstag ab 12 Uhr' : 'morgen ab 12 Uhr';
        el.textContent = 'Gerade geschlossen – wieder ' + next;
      }
    } catch (e) { /* ohne Intl-Zeitzone einfach nichts anzeigen */ }
  })();

  /* ---------- Einblendungen für Listen ---------- */
  (function reveals() {
    var groups = [['.hero-kicker, .hero-lead, .hero-ctas, .hero-trust, .hero-cap', 90], ['.style-row', 60], ['.artist', 70], ['.flash-card', 45], ['.quote', 70], ['.steps li', 50], ['.care-head .care-tool', 0], ['.stat', 70]];
    if (!animate || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    groups.forEach(function (g) {
      $$(g[0]).forEach(function (el, i) { el.setAttribute('data-reveal', ''); el.style.setProperty('--d', (i % 6) * g[1] + 'ms'); io.observe(el); });
    });
  })();

  /* ---------- Scroll-Choreografie (GSAP) ---------- */
  if (hasGsap && animate) {
    var mm = gsap.matchMedia();
    mm.add('(min-width: 900px)', function () {
      // Hero-Parallaxe
      gsap.to('.hero-figure', { yPercent: -10, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
      gsap.to('.hero-canvas-wrap', { y: 80, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
      gsap.to('.hero-title', { y: -50, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
      gsap.fromTo('.studio-fig--b', { y: 60 }, { y: -40, ease: 'none', scrollTrigger: { trigger: '.studio', start: 'top bottom', end: 'bottom top', scrub: true } });

      // Pflege: siehe eigenes matchMedia unten (braucht auch Mindesthöhe)
    });
    mm.add('(min-width: 900px) and (min-height: 640px)', function () {
      // Pflege: horizontale Strecke mit Tageszähler. Die Bühne klebt per CSS (position: sticky),
      // GSAP schiebt nur die Karten – kein Pin, also kein Layout-Shift.
      root.classList.add('has-pin');
      var pin = $('.care-pin'), list = $('.care-list'), track = $('.care-track'), big = $('#care-big'), fill = $('.care-line-fill');
      var dist = 0, stops = [], focus = null;
      function measure() {
        var cs = getComputedStyle(track);
        var left = track.getBoundingClientRect().left + parseFloat(cs.paddingLeft);
        dist = Math.max(0, Math.round(left + list.scrollWidth + parseFloat(getComputedStyle(root).fontSize) * 3 - window.innerWidth));
        pin.style.setProperty('--care-dist', dist + 'px');
        // Haltepunkte: Karte i erreicht die Leseposition bei Fortschritt p = Abstand / Abstand der letzten Karte
        var lastLeft = careCards[careCards.length - 1].offsetLeft || 1;
        stops = careCards.map(function (c) { return { p: c.offsetLeft / lastLeft, day: +c.dataset.from, card: c }; });
      }
      function dayAt(p) {
        for (var i = 0; i < stops.length - 1; i++) {
          var a = stops[i], b = stops[i + 1];
          if (p <= b.p) { var k = (p - a.p) / Math.max(1e-4, b.p - a.p); return { day: a.day + (b.day - a.day) * k, card: k < 0.5 ? a.card : b.card }; }
        }
        return { day: Infinity, card: stops[stops.length - 1].card };
      }
      measure();
      ScrollTrigger.addEventListener('refreshInit', measure);
      var tl = gsap.to(list, {
        x: function () { return -dist; }, ease: 'none',
        scrollTrigger: {
          trigger: pin, start: 'top top', end: 'bottom bottom', scrub: 0.5, invalidateOnRefresh: true,
          onUpdate: function (self) {
            var p = self.progress;
            if (fill) fill.style.transform = 'scaleX(' + p.toFixed(3) + ')';
            var r = dayAt(p), d = Math.round(r.day);
            big.textContent = (r.day >= 45 || p > 0.995) ? '∞' : String(d);
            if (r.card !== focus) { if (focus) focus.classList.remove('is-focus'); focus = r.card; focus.classList.add('is-focus'); }
          }
        }
      });
      var st = tl.scrollTrigger;
      careRail = {
        goTo: function (card) {
          if (!st || !st.isActive) return; // nur, wenn die Bühne gerade klebt – sonst springt der Regler unter dem Finger weg
          var stop = stops.filter(function (x) { return x.card === card; })[0];
          if (!stop) return;
          var y = st.start + Math.min(1, stop.p) * (st.end - st.start);
          if (lenis) lenis.scrollTo(y, { duration: 0.9, easing: function (t) { return 1 - Math.pow(1 - t, 3); } });
          else window.scrollTo({ top: y, behavior: 'smooth' });
        }
      };
      return function () {
        careRail = null;
        ScrollTrigger.removeEventListener('refreshInit', measure);
        root.classList.remove('has-pin'); tl.kill(); gsap.set(list, { clearProps: 'transform' });
        pin.style.removeProperty('--care-dist');
        if (focus) focus.classList.remove('is-focus');
      };
    });
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  }

  window.__inkReady = true;
})();
