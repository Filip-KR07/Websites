/* ==========================================================================
   Lindner – Tischlerei & Innenausbau · Modell „Manufaktur“
   Ohne Build-Schritt. Abhängigkeiten (optional): GSAP + ScrollTrigger, Lenis.
   ========================================================================== */
(function () {
  'use strict';

  var doc = document.documentElement;
  doc.classList.add('js');

  var qs = function (s, r) { return (r || document).querySelector(s); };
  var qsa = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var smooth = function (a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  var easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };
  var dprMax = function () { return Math.min(window.devicePixelRatio || 1, 2); };

  var motionOff = doc.classList.contains('motion-off');
  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduced = function () { return motionOff || mqReduce.matches; };
  var mqDesktop = window.matchMedia('(min-width: 900px)');
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasGSAP = !!(window.gsap && window.ScrollTrigger);
  var lenis = null;

  function safe(name, fn) {
    try { fn(); } catch (err) { if (window.console) console.warn('[Lindner] ' + name + ':', err); }
  }

  /* ------------------------------------------------------------------
     Rauschen (Simplex 2D, deterministisch)
     ------------------------------------------------------------------ */
  function makeNoise(seed) {
    var perm = new Uint8Array(512), p = new Uint8Array(256), i, s = (seed >>> 0) || 1;
    var rand = function () { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
    for (i = 0; i < 256; i++) p[i] = i;
    for (i = 255; i > 0; i--) { var j = Math.floor(rand() * (i + 1)), t = p[i]; p[i] = p[j]; p[j] = t; }
    for (i = 0; i < 512; i++) perm[i] = p[i & 255];
    var gx = [1, -1, 1, -1, 1, -1, 0, 0], gy = [1, 1, -1, -1, 0, 0, 1, -1];
    var F2 = 0.5 * (Math.sqrt(3) - 1), G2 = (3 - Math.sqrt(3)) / 6;
    return function (x, y) {
      var s2 = (x + y) * F2, i0 = Math.floor(x + s2), j0 = Math.floor(y + s2), t0 = (i0 + j0) * G2;
      var x0 = x - (i0 - t0), y0 = y - (j0 - t0);
      var i1 = x0 > y0 ? 1 : 0, j1 = 1 - i1;
      var x1 = x0 - i1 + G2, y1 = y0 - j1 + G2, x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;
      var ii = i0 & 255, jj = j0 & 255, n = 0, g, tt;
      tt = 0.5 - x0 * x0 - y0 * y0; if (tt > 0) { g = perm[ii + perm[jj]] & 7; tt *= tt; n += tt * tt * (gx[g] * x0 + gy[g] * y0); }
      tt = 0.5 - x1 * x1 - y1 * y1; if (tt > 0) { g = perm[ii + i1 + perm[jj + j1]] & 7; tt *= tt; n += tt * tt * (gx[g] * x1 + gy[g] * y1); }
      tt = 0.5 - x2 * x2 - y2 * y2; if (tt > 0) { g = perm[ii + 1 + perm[jj + 1]] & 7; tt *= tt; n += tt * tt * (gx[g] * x2 + gy[g] * y2); }
      return 70 * n;
    };
  }

  /* Hilfsfunktion: Canvas-Animation nur, wenn sichtbar und Tab aktiv */
  function visibilityGate(el, onChange) {
    var inView = false;
    var update = function () { onChange(inView && !document.hidden); };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) { inView = entries[0].isIntersecting; update(); }, { rootMargin: '120px 0px' }).observe(el);
    } else { inView = true; }
    document.addEventListener('visibilitychange', update);
    update();
  }

  /* ------------------------------------------------------------------
     Smooth Scroll (Lenis) + ScrollTrigger
     ------------------------------------------------------------------ */
  function headerOffset() {
    var h = qs('[data-header]');
    return h ? h.offsetHeight : 0;
  }

  function initScroll() {
    if (hasGSAP) gsap.registerPlugin(ScrollTrigger);
    if (!reduced() && window.Lenis) {
      lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1, anchors: false });
      window.__lenis = lenis;
      if (hasGSAP) {
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
        gsap.ticker.lagSmoothing(0);
      } else {
        var raf = function (t) { lenis.raf(t); requestAnimationFrame(raf); };
        requestAnimationFrame(raf);
      }
    }

    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var target = document.getElementById(decodeURIComponent(id.slice(1)));
      if (!target) return;
      e.preventDefault();
      scrollToTarget(target);
      if (history.pushState) history.pushState(null, '', id);
    });
  }

  function scrollToTarget(target) {
    var top = target.id === 'top' ? 0 : null;
    var focus = function () {
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    };
    if (lenis) {
      lenis.scrollTo(top === null ? target : 0, { offset: top === null ? -headerOffset() + 1 : 0, duration: 1.4, easing: function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }, onComplete: focus });
    } else {
      var y = top === null ? target.getBoundingClientRect().top + window.scrollY - headerOffset() + 1 : 0;
      window.scrollTo({ top: y, behavior: reduced() ? 'auto' : 'smooth' });
      setTimeout(focus, reduced() ? 0 : 600);
    }
  }

  /* ------------------------------------------------------------------
     Header: Zustand, Fortschritt, aktive Navigation
     ------------------------------------------------------------------ */
  function initHeader() {
    var header = qs('[data-header]'), bar = qs('[data-progress]');
    var ticking = false;
    var update = function () {
      ticking = false;
      var y = window.scrollY || 0;
      var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      header.classList.toggle('is-scrolled', y > 8);
      if (bar) bar.style.transform = 'scaleX(' + clamp(y / max, 0, 1).toFixed(4) + ')';
    };
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();

    var links = qsa('.main-nav a');
    var map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          links.forEach(function (l) { l.removeAttribute('aria-current'); });
          var link = map[en.target.id];
          if (link) link.setAttribute('aria-current', 'true');
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      qsa('main > section[id]').forEach(function (s) { io.observe(s); });
    }
  }

  /* ------------------------------------------------------------------
     Mobiles Menü (dialog)
     ------------------------------------------------------------------ */
  function initMenu() {
    var dialog = qs('#menu'), openBtn = qs('[data-menu-open]');
    if (!dialog || !openBtn || typeof dialog.showModal !== 'function') return;
    qsa('.menu-list li', dialog).forEach(function (li, i) { li.style.setProperty('--i', i); });
    var closing = false;
    var open = function () {
      dialog.showModal();
      openBtn.setAttribute('aria-expanded', 'true');
      if (lenis) lenis.stop();
    };
    var close = function (after) {
      if (closing || !dialog.open) return;
      closing = true;
      dialog.classList.add('is-closing');
      var done = function () {
        dialog.classList.remove('is-closing');
        dialog.close();
        closing = false;
        openBtn.setAttribute('aria-expanded', 'false');
        if (lenis) lenis.start();
        if (typeof after === 'function') after(); else openBtn.focus();
      };
      setTimeout(done, motionOff ? 0 : 230);
    };
    openBtn.addEventListener('click', open);
    qs('[data-menu-close]', dialog).addEventListener('click', function () { close(); });
    dialog.addEventListener('cancel', function (e) { e.preventDefault(); close(); });
    dialog.addEventListener('click', function (e) {
      var a = e.target.closest('a');
      if (!a) return;
      var href = a.getAttribute('href') || '';
      if (href.charAt(0) === '#') {
        e.preventDefault();
        e.stopPropagation();
        var target = document.getElementById(href.slice(1));
        close(function () { if (target) { scrollToTarget(target); if (history.pushState) history.pushState(null, '', href); } });
      }
    });
    mqDesktop.addEventListener('change', function (e) { if (e.matches && dialog.open) close(); });
  }

  /* ------------------------------------------------------------------
     Hero: Variable-Font-Morph der Überschrift + Ladesequenz
     ------------------------------------------------------------------ */
  function initHeroTitle() {
    // Die Einbrenn-Sequenz läuft rein per CSS ab dem ersten Bild; hier nur das Signal für die Start-Warteschlange.
    doc.classList.remove('is-loading'); doc.classList.add('hero-in');
    doc.dispatchEvent(new Event('lindner:hero'));
  }

  /* ------------------------------------------------------------------
     Hero: Stammscheibe (Hirnholz) – einmal gezeichnet, danach nur noch
     per CSS-Transform bewegt. Jahresringe folgen der Rinde, die Markröhre
     sitzt exzentrisch, Trockenrisse, Markstrahlen, Sägespuren.
     ------------------------------------------------------------------ */
  function sliceStages(ctx, S) {
    var cx = S / 2, cy = S / 2, R = S / 2 * 0.935, k = S / 1000;
    var nA = makeNoise(7), nB = makeNoise(19), nC = makeNoise(41);
    var rs = 90217;
    var rnd = function () { rs = (rs * 16807) % 2147483647; return (rs - 1) / 2147483646; };
    var N = 260, TAU = Math.PI * 2, i, j;
    var P = { x: cx + R * 0.085, y: cy - R * 0.065 };
    var B = [];
    for (i = 0; i < N; i++) {
      var th = i / N * TAU, c = Math.cos(th), s = Math.sin(th);
      var b = R * (1 + 0.022 * nA(c * 1.3, s * 1.3) + 0.009 * nA(c * 4.2 + 3, s * 4.2));
      B.push({ x: cx + c * b, y: cy + s * b, c: c, s: s });
    }
    var ringPath = function (sv, amp) {
      var path = new Path2D();
      for (var q = 0; q <= N; q++) {
        var bq = B[q % N];
        var w = 1 + amp * nB(bq.c * 1.6 + sv * 3.1, bq.s * 1.6 - sv * 2.3) + amp * 0.35 * nB(bq.c * 5 + sv * 9, bq.s * 5);
        var x = P.x + (bq.x - P.x) * sv * w, y = P.y + (bq.y - P.y) * sv * w;
        if (q === 0) path.moveTo(x, y); else path.lineTo(x, y);
      }
      path.closePath();
      return path;
    };
    var disc = ringPath(1, 0), widths = [], sum = 0, acc = 0.012;
    var stages = [];
    stages.push(function () {
    // Rinde
    var bark = new Path2D();
    for (i = 0; i <= N; i++) {
      var bi = B[i % N], bw = 1.035 + 0.02 * (nC(bi.c * 9, bi.s * 9) + 1) + 0.008 * nC(bi.c * 30, bi.s * 30);
      var bx = P.x + (bi.x - P.x) * bw, by = P.y + (bi.y - P.y) * bw;
      if (i === 0) bark.moveTo(bx, by); else bark.lineTo(bx, by);
    }
    bark.closePath();
    ctx.fillStyle = '#3F281A';
    ctx.fill(bark);
    ctx.save(); ctx.clip(bark);
    ctx.strokeStyle = 'rgba(15, 8, 4, .55)'; ctx.lineCap = 'round';
    for (i = 0; i < 180; i++) {
      var bt = B[Math.floor(rnd() * N)], l0 = 1.0 + rnd() * 0.02, l1 = l0 + 0.015 + rnd() * 0.03;
      ctx.lineWidth = (0.8 + rnd() * 1.6) * k;
      ctx.beginPath(); ctx.moveTo(P.x + (bt.x - P.x) * l0, P.y + (bt.y - P.y) * l0); ctx.lineTo(P.x + (bt.x - P.x) * l1, P.y + (bt.y - P.y) * l1); ctx.stroke();
    }
    ctx.restore();

    // Splint (hell) und Kern (dunkler)
    ctx.fillStyle = '#DCC096'; ctx.fill(disc);
    ctx.save(); ctx.clip(disc);
    ctx.fillStyle = 'rgba(196, 146, 98, .5)'; ctx.fill(ringPath(0.76, 0.012));
    ctx.fillStyle = '#C5935F'; ctx.fill(ringPath(0.72, 0.012));
    var g = ctx.createRadialGradient(P.x, P.y, 0, P.x, P.y, R * 0.8);
    g.addColorStop(0, 'rgba(150, 96, 52, .35)'); g.addColorStop(0.25, 'rgba(150, 96, 52, 0)'); g.addColorStop(1, 'rgba(150, 96, 52, 0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
    ctx.restore();
    });

    // Jahresringe: Breiten wie echte Jahre – Folgen schmaler und breiter Jahre
    var run = 1;
    for (i = 0; i < 64; i++) {
      if (rnd() < 0.18) run = 0.45 + rnd() * 0.5; else if (rnd() < 0.25) run = 1 + rnd() * 0.6;
      var wv = run * (0.75 + rnd() * 0.5) * (i < 8 ? 1.5 : 1);
      widths.push(wv); sum += wv;
    }
    var ringStage = function (from, to) { return function () {
    ctx.save(); ctx.clip(disc);
    ctx.lineJoin = 'round';
    for (var i = from; i < to; i++) {
      acc += widths[i] / sum * 0.985;
      var sv = Math.min(acc, 0.996), heart = sv < 0.72;
      var rp = ringPath(sv, 0.012 + sv * 0.008);
      // Porenkranz (ringporig, Eiche) direkt nach der Jahresgrenze
      ctx.setLineDash([0.9 * k, 2.4 * k]);
      ctx.lineWidth = 1.4 * k;
      ctx.strokeStyle = heart ? 'rgba(92, 52, 24, .32)' : 'rgba(120, 82, 46, .26)';
      ctx.stroke(ringPath(Math.max(0.01, sv - widths[i] / sum * 0.86), 0.012 + sv * 0.008));
      ctx.setLineDash([]);
      ctx.lineWidth = (0.7 + widths[i] * 1.5) * k;
      ctx.strokeStyle = heart ? 'rgba(98, 56, 26, ' + (0.42 + rnd() * 0.3).toFixed(2) + ')' : 'rgba(146, 100, 58, ' + (0.36 + rnd() * 0.28).toFixed(2) + ')';
      ctx.stroke(rp);
    }
    ctx.restore();
    }; };
    stages.push(ringStage(0, 22), ringStage(22, 44), ringStage(44, widths.length));
    stages.push(function () {
    ctx.save(); ctx.clip(disc);
    // Markstrahlen („Spiegel“) – hell glänzende Radiallinien
    ctx.lineCap = 'round';
    for (i = 0; i < 420; i++) {
      var bt2 = B[Math.floor(rnd() * N)], s0 = 0.05 + rnd() * 0.85, s1 = s0 + 0.02 + rnd() * 0.12;
      ctx.lineWidth = (0.5 + rnd() * 1.1) * k;
      ctx.strokeStyle = rnd() < 0.7 ? 'rgba(252, 236, 210, .32)' : 'rgba(90, 52, 24, .18)';
      ctx.beginPath(); ctx.moveTo(P.x + (bt2.x - P.x) * s0, P.y + (bt2.y - P.y) * s0); ctx.lineTo(P.x + (bt2.x - P.x) * s1, P.y + (bt2.y - P.y) * s1); ctx.stroke();
    }
    // Sägespuren: flache Bögen eines großen Kreissägeblatts
    for (i = 0; i < 90; i++) {
      ctx.lineWidth = (1 + rnd() * 2.2) * k;
      ctx.strokeStyle = i % 2 ? 'rgba(255, 248, 235, .05)' : 'rgba(60, 34, 14, .045)';
      ctx.beginPath(); ctx.arc(-S * 0.9, S * 0.5, S * 1.25 + i * 9 * k, -0.6, 0.6); ctx.stroke();
    }
    ctx.restore();
    });
    stages.push(function () {
    ctx.save(); ctx.clip(disc);
    // Trockenrisse
    var cracks = [0.11, 0.3, 0.5];
    var bAt = function (aa, sv) {
      var f = ((aa / TAU) % 1 + 1) % 1 * N, i0 = Math.floor(f) % N, i1 = (i0 + 1) % N, fr = f - Math.floor(f);
      var bx = B[i0].x + (B[i1].x - B[i0].x) * fr, by = B[i0].y + (B[i1].y - B[i0].y) * fr;
      return [P.x + (bx - P.x) * sv, P.y + (by - P.y) * sv];
    };
    for (j = 0; j < cracks.length; j++) {
      var a0 = cracks[j] * TAU + (rnd() - 0.5) * 0.2, depth = 0.5 + rnd() * 0.2, half = 0.006 + rnd() * 0.006;
      var crack = new Path2D(), steps = 26, q2, side;
      for (side = -1; side <= 1; side += 2) {
        for (q2 = 0; q2 <= steps; q2++) {
          var t = side < 0 ? q2 / steps : 1 - q2 / steps;
          var sv2 = 1.01 - t * (1.01 - depth);
          var aa = a0 + side * half * Math.pow(1 - t, 1.4) + nC(t * 3, j * 3) * 0.006;
          var pt = bAt(aa, sv2), x2 = pt[0], y2 = pt[1];
          if (side < 0 && q2 === 0) crack.moveTo(x2, y2); else crack.lineTo(x2, y2);
        }
      }
      crack.closePath();
      ctx.lineWidth = 2.4 * k; ctx.strokeStyle = 'rgba(70, 38, 16, .35)'; ctx.stroke(crack);
      ctx.fillStyle = '#2A170B'; ctx.fill(crack);
    }
    // Mark
    ctx.fillStyle = 'rgba(70, 38, 16, .75)';
    ctx.beginPath(); ctx.ellipse(P.x, P.y, 5 * k, 3.6 * k, 0.6, 0, TAU); ctx.fill();
    ctx.restore();
    });
    stages.push(function () {
    ctx.save(); ctx.clip(disc);
    // Korn: feines Rauschen, einmal als Muster
    var tile = document.createElement('canvas'); tile.width = tile.height = 96;
    var tc = tile.getContext('2d'), id = tc.createImageData(96, 96), d = id.data;
    for (i = 0; i < d.length; i += 4) { var v = rnd(); d[i] = 60; d[i + 1] = 36; d[i + 2] = 18; d[i + 3] = v < 0.5 ? 0 : (v - 0.5) * 70; }
    tc.putImageData(id, 0, 0);
    ctx.fillStyle = ctx.createPattern(tile, 'repeat'); ctx.fillRect(0, 0, S, S);
    // Kambium hell, Rand oxidiert, Licht von links oben
    ctx.restore();
    ctx.lineWidth = 2.2 * k; ctx.strokeStyle = 'rgba(244, 226, 196, .7)'; ctx.stroke(disc);
    ctx.save(); ctx.clip(disc);
    var g2 = ctx.createRadialGradient(cx, cy, R * 0.72, cx, cy, R * 1.02);
    g2.addColorStop(0, 'rgba(90, 52, 22, 0)'); g2.addColorStop(1, 'rgba(90, 52, 22, .28)');
    ctx.fillStyle = g2; ctx.fillRect(0, 0, S, S);
    var g3 = ctx.createLinearGradient(0, 0, S, S);
    g3.addColorStop(0, 'rgba(255, 250, 238, .14)'); g3.addColorStop(0.55, 'rgba(255, 250, 238, 0)'); g3.addColorStop(1, 'rgba(40, 20, 8, .16)');
    ctx.fillStyle = g3; ctx.fillRect(0, 0, S, S);
    ctx.restore();
    });
    return stages;
  }

  function initSlice() {
    var wrap = qs('[data-slice-wrap]'), canvas = qs('[data-slice]'), hero = qs('.hero');
    if (!wrap || !canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d'), size = 0;
    var draw = function () {
      var S = Math.round(wrap.getBoundingClientRect().width);
      if (S < 20 || S === size) return;
      size = S;
      var dpr = Math.min(dprMax(), 1800 / S);
      canvas.width = Math.round(S * dpr); canvas.height = Math.round(S * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, S, S);
      // In Etappen zeichnen (je Etappe ein eigener Task), danach aufdecken
      var stages = sliceStages(ctx, S), my = S;
      var step = function () {
        if (my !== size) return;
        var fn = stages.shift();
        if (fn) { fn(); setTimeout(step, 0); }
        else requestAnimationFrame(function () { wrap.classList.add('is-drawn'); });
      };
      step();
    };
    draw();
    var rt = 0;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(draw, 220); });

    if (!hasGSAP || reduced()) return;
    var stamp = qs('[data-stamp]'), print = qs('.hero-print');
    gsap.to(wrap, { rotation: -22, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.8 } });
    if (stamp) gsap.to(stamp, { rotation: 4, yPercent: -30, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.8 } });
    if (print) gsap.to(print, { yPercent: -28, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.8 } });

    // Streiflicht folgt der Maus mit Feder (nur feiner Zeiger)
    var sheen = qs('[data-slice-sheen]');
    if (!finePointer || !sheen) return;
    var st = { x: 0, y: 0, tx: 0, ty: 0, vx: 0, vy: 0 }, raf = 0;
    var tick = function () {
      raf = 0;
      var ax = (st.tx - st.x) * 0.06, ay = (st.ty - st.y) * 0.06;
      st.vx = (st.vx + ax) * 0.78; st.vy = (st.vy + ay) * 0.78;
      st.x += st.vx; st.y += st.vy;
      sheen.style.transform = 'translate3d(' + st.x.toFixed(1) + 'px,' + st.y.toFixed(1) + 'px,0)';
      if (Math.abs(st.tx - st.x) + Math.abs(st.ty - st.y) + Math.abs(st.vx) + Math.abs(st.vy) > 0.3) raf = requestAnimationFrame(tick);
    };
    hero.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      var r = wrap.getBoundingClientRect(), sw = sheen.offsetWidth;
      st.tx = e.clientX - r.left - sw / 2; st.ty = e.clientY - r.top - sw / 2;
      hero.classList.add('is-lit');
      if (!raf) raf = requestAnimationFrame(tick);
    }, { passive: true });
    hero.addEventListener('pointerleave', function () { hero.classList.remove('is-lit'); });
  }

  /* ------------------------------------------------------------------
     Hobelspäne: fliegen beim Scrollen aus dem Hobel-Foto. Vorgezeichnete
     Sprites, Physik nur solange Späne in der Luft sind.
     ------------------------------------------------------------------ */
  function makeShaving(seed) {
    var c = document.createElement('canvas'), Z = 120;
    c.width = c.height = Z;
    var x = c.getContext('2d'), rs = seed * 4813 + 17;
    var rnd = function () { rs = (rs * 16807) % 2147483647; return (rs - 1) / 2147483646; };
    var turns = 0.7 + rnd() * 0.8, r0 = 30 + rnd() * 16, w = 5 + rnd() * 9, ph = rnd() * 6, lift = 8 + rnd() * 16;
    var prev = null, n = 70;
    x.lineCap = 'round';
    for (var i = 0; i <= n; i++) {
      var t = i / n, a = t * turns * Math.PI * 2 + ph, r = r0 * (1 - 0.42 * t);
      var px = Z / 2 + Math.cos(a) * r, py = Z / 2 + Math.sin(a) * r * 0.62 + (t - 0.5) * lift;
      if (prev) {
        var face = Math.abs(Math.cos(t * Math.PI * 1.7 + ph));
        var lw = 1.4 + w * face * (1 - t * 0.45), L = 0.5 + 0.5 * face;
        x.lineWidth = lw + 1.4; x.strokeStyle = 'rgba(150, 108, 64, .5)';
        x.beginPath(); x.moveTo(prev[0], prev[1]); x.lineTo(px, py); x.stroke();
        x.lineWidth = lw;
        x.strokeStyle = 'rgba(' + Math.round(200 + 42 * L) + ',' + Math.round(166 + 58 * L) + ',' + Math.round(118 + 76 * L) + ',.92)';
        x.beginPath(); x.moveTo(prev[0], prev[1]); x.lineTo(px, py); x.stroke();
      }
      prev = [px, py];
    }
    return c;
  }

  function initShavings() {
    var canvas = qs('[data-shavings]'), hero = qs('.hero'), src = qs('.hero-photo');
    if (!canvas || !hero || !src || reduced() || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    var sprites = [0, 1, 2, 3, 4, 5, 6].map(makeShaving);
    var W = 0, H = 0, dpr = 1, parts = [], raf = 0, last = 0, visible = true, budget = 0, lastY = window.scrollY;
    var resize = function () {
      var r = hero.getBoundingClientRect();
      W = Math.round(r.width); H = Math.round(r.height); dpr = Math.min(dprMax(), 1.25);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    };
    resize();
    window.addEventListener('resize', resize);
    var spawn = function (n, power) {
      var hr = hero.getBoundingClientRect(), r = src.getBoundingClientRect();
      for (var i = 0; i < n && parts.length < 46; i++) {
        parts.push({
          x: r.left - hr.left + r.width * (0.3 + Math.random() * 0.35),
          y: r.top - hr.top + r.height * (0.3 + Math.random() * 0.3),
          vx: (Math.random() * 2.4 - 0.5) * power, vy: -(1.6 + Math.random() * 3.6) * power,
          rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.16,
          s: 0.45 + Math.random() * 0.45, life: 0, max: 1.1 + Math.random() * 0.8,
          img: sprites[(Math.random() * sprites.length) | 0]
        });
      }
      if (!raf && visible) { last = 0; raf = requestAnimationFrame(loop); }
    };
    var loop = function (t) {
      raf = 0;
      var dt = last ? Math.min(0.05, (t - last) / 1000) : 0.016; last = t;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (var i = parts.length - 1; i >= 0; i--) {
        var p = parts[i];
        p.life += dt;
        if (p.life > p.max) { parts.splice(i, 1); continue; }
        p.vy += 9 * dt; p.vx *= 0.992; p.vy *= 0.992;
        p.x += p.vx * dt * 60; p.y += p.vy * dt * 60; p.rot += p.vr;
        var a = 1 - smooth(0.62, 1, p.life / p.max);
        var c = Math.cos(p.rot) * p.s * dpr, s = Math.sin(p.rot) * p.s * dpr;
        ctx.globalAlpha = a;
        ctx.setTransform(c, s, -s, c, p.x * dpr, p.y * dpr);
        ctx.drawImage(p.img, -60, -60);
      }
      ctx.globalAlpha = 1;
      if (parts.length && visible) raf = requestAnimationFrame(loop);
      else { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height); }
    };
    visibilityGate(hero, function (v) { visible = v; if (!v) { parts.length = 0; } });
    var onScroll = function (y) {
      var dy = y - lastY; lastY = y;
      if (!visible || y > H * 0.9 || dy <= 0) return;
      budget += Math.min(dy, 120) * 0.06;
      if (budget >= 1) { var n = Math.min(4, Math.floor(budget)); budget -= n; spawn(n, 1 + Math.min(dy, 80) / 60); }
    };
    if (lenis) lenis.on('scroll', function (e) { onScroll(e.scroll); });
    else window.addEventListener('scroll', function () { onScroll(window.scrollY); }, { passive: true });
    // Erster Hobelzug: ein kleiner Schwall Späne, wenn das Foto liegt
    if (mqDesktop.matches) setTimeout(function () { if (window.scrollY < 40) spawn(7, 1.2); }, 1150);
    src.addEventListener('pointerdown', function () { spawn(6, 1.3); });
  }

  /* ------------------------------------------------------------------
     Mikro-Interaktionen: Zeichen-Rollen in der Navigation, magnetische Knöpfe
     ------------------------------------------------------------------ */
  function initMicro() {
    if (reduced() || !finePointer) return;
    qsa('.main-nav a').forEach(function (a) {
      var txt = a.textContent.trim();
      var roll = document.createElement('span'); roll.className = 'roll'; roll.setAttribute('aria-hidden', 'true');
      Array.from(txt).forEach(function (ch, i) {
        var s = document.createElement('span'); s.textContent = ch; s.setAttribute('data-c', ch); s.style.setProperty('--i', i); roll.appendChild(s);
      });
      var sr = document.createElement('span'); sr.className = 'sr-only'; sr.textContent = txt;
      a.textContent = ''; a.appendChild(roll); a.appendChild(sr);
    });
    qsa('[data-magnetic], .header-cta, .pcard--end .btn, .ws-visit, [data-take-material]').forEach(function (el) {
      var st = { x: 0, y: 0, tx: 0, ty: 0 }, raf = 0;
      var tick = function () {
        raf = 0;
        st.x += (st.tx - st.x) * 0.18; st.y += (st.ty - st.y) * 0.18;
        el.style.translate = st.x.toFixed(2) + 'px ' + st.y.toFixed(2) + 'px';
        if (Math.abs(st.tx - st.x) + Math.abs(st.ty - st.y) > 0.05) raf = requestAnimationFrame(tick);
      };
      el.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse') return;
        var r = el.getBoundingClientRect();
        st.tx = (e.clientX - r.left - r.width / 2) * 0.22; st.ty = (e.clientY - r.top - r.height / 2) * 0.32;
        if (!raf) raf = requestAnimationFrame(tick);
      });
      el.addEventListener('pointerleave', function () { st.tx = 0; st.ty = 0; if (!raf) raf = requestAnimationFrame(tick); });
    });
  }

  /* ------------------------------------------------------------------
     Werkstatt-Zitat: Brennspur läuft Zeichen für Zeichen mit dem Scroll
     ------------------------------------------------------------------ */
  function initBurn() {
    var lib = qs('[data-lib]');
    if (lib && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { lib.classList.add('is-marked'); io.disconnect(); } }, { threshold: 0.35 });
      io.observe(lib);
    } else if (lib) lib.classList.add('is-marked');

    var p = qs('[data-burn]');
    if (!p || reduced() || !hasGSAP) return;
    var text = p.textContent;
    var sr = document.createElement('span'); sr.className = 'sr-only'; sr.textContent = text;
    var vis = document.createElement('span'); vis.setAttribute('aria-hidden', 'true');
    var chars = [];
    text.split(/(\s+)/).forEach(function (part) {
      if (!part) return;
      if (/^\s+$/.test(part)) { vis.appendChild(document.createTextNode(' ')); return; }
      var w = document.createElement('span'); w.style.whiteSpace = 'nowrap'; w.style.display = 'inline-block';
      Array.from(part).forEach(function (c) { var s = document.createElement('span'); s.className = 'burn-ch'; s.textContent = c; w.appendChild(s); chars.push(s); });
      vis.appendChild(w);
    });
    p.textContent = ''; p.appendChild(sr); p.appendChild(vis);
    var lit = -1;
    var set = function (pr) {
      var n = Math.round(pr * (chars.length + 3));
      if (n === lit) return;
      for (var i = 0; i < chars.length; i++) {
        chars[i].classList.toggle('is-lit', i < n - 3);
        chars[i].classList.toggle('is-hot', i >= n - 3 && i < n);
      }
      lit = n;
    };
    set(0);
    ScrollTrigger.create({ trigger: p, start: 'top 82%', end: 'bottom 48%', scrub: true, onUpdate: function (self) { set(self.progress); }, onLeave: function () { set(1); } });
  }

  /* ------------------------------------------------------------------
     Reveals (IntersectionObserver) + Wort-Masken
     ------------------------------------------------------------------ */
  function splitWords(el) {
    var i = 0;
    var walk = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var parts = n.textContent.split(/([ \t\r\n]+)/);
          var frag = document.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^[ \t\r\n]+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span'); w.className = 'w';
            var wi = document.createElement('span'); wi.className = 'wi'; wi.textContent = p;
            wi.style.setProperty('--i', i++);
            w.appendChild(wi); frag.appendChild(w);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1) { walk(n); }
      });
    };
    walk(el);
  }

  function initReveals() {
    if (motionOff) return;
    qsa('[data-split]').forEach(splitWords);
    qsa('[data-reveal-stagger]').forEach(function (list) {
      Array.prototype.forEach.call(list.children, function (c, i) { c.style.setProperty('--i', i); });
    });
    var els = qsa('[data-reveal], [data-split], [data-reveal-stagger], [data-map]');
    if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('is-in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(function (e) { io.observe(e); });
  }

  /* ------------------------------------------------------------------
     Leistungen: Bildwechsel im fixierten Rahmen
     ------------------------------------------------------------------ */
  function initServices() {
    var items = qsa('.service'), frames = qsa('[data-sv]');
    var cap = qs('[data-sv-cap]'), capNo = qs('[data-sv-no]');
    if (!items.length || !frames.length) return;
    var current = 0, timer = 0;
    var set = function (i) {
      if (i === current) return;
      var prev = frames[current], next = frames[i];
      frames.forEach(function (f) { if (f !== prev) f.classList.remove('is-leaving'); f.classList.remove('is-entering'); });
      prev.classList.remove('is-active'); prev.classList.add('is-leaving');
      next.classList.add('is-active');
      void next.offsetWidth;
      next.classList.add('is-entering');
      items.forEach(function (it, k) { it.classList.toggle('is-active', k === i); });
      if (cap) {
        cap.textContent = items[i].getAttribute('data-caption') || '';
        if (!reduced()) cap.animate([{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { duration: 450, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' });
      }
      if (capNo) capNo.textContent = 'Abb. ' + (2) + '.' + (i + 1);
      current = i;
      clearTimeout(timer);
      timer = setTimeout(function () { frames.forEach(function (f) { f.classList.remove('is-leaving'); }); }, 1100);
    };
    if (capNo) capNo.textContent = 'Abb. 2.1';
    items[0].classList.add('is-active');
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        if (!mqDesktop.matches) return;
        entries.forEach(function (en) { if (en.isIntersecting) set(items.indexOf(en.target)); });
      }, { rootMargin: '-46% 0px -46% 0px' });
      items.forEach(function (it) { io.observe(it); });
    }
    items.forEach(function (it, i) {
      if (finePointer) it.addEventListener('pointerenter', function () { if (mqDesktop.matches) set(i); });
      it.addEventListener('focusin', function () { if (mqDesktop.matches) set(i); });
    });
  }

  /* ------------------------------------------------------------------
     Materialbibliothek: prozedurale Tischplatte
     ------------------------------------------------------------------ */
  var WOODS = {
    eiche: { name: 'Eiche', early: [208, 168, 120], late: [140, 96, 56], sp: 4.6, con: 0.72, pores: 0.75, wave: 7, fib: 0.09, rays: 0.3, vary: 0.05, tilt: 0.045 },
    nussbaum: { name: 'Nussbaum', early: [126, 92, 68], late: [72, 50, 37], sp: 5.2, con: 0.55, pores: 0.2, wave: 10, fib: 0.1, streak: 0.12, vary: 0.08, tilt: 0.05 },
    esche: { name: 'Esche', early: [230, 213, 180], late: [170, 138, 94], sp: 5.6, con: 0.82, pores: 0.6, wave: 6, fib: 0.06, vary: 0.035, tilt: 0.04 },
    kirsche: { name: 'Kirsche', early: [192, 140, 110], late: [142, 90, 66], sp: 3.8, con: 0.5, pores: 0.05, wave: 8, fib: 0.07, flecks: 0.4, vary: 0.06, tilt: 0.05 },
    ahorn: { name: 'Ahorn', early: [238, 227, 205], late: [205, 184, 150], sp: 4.2, con: 0.42, pores: 0, wave: 5, fib: 0.045, vary: 0.03, tilt: 0.04 }
  };
  var FINISH_NAMES = { natur: 'natur geölt', weiss: 'weiß geölt', lack: 'lackiert matt' };

  /* Rendert eine verleimte Platte. Koordinaten in „Design-Pixeln“ (CSS-px);
     scale = Design-Pixel pro Canvas-Pixel (< 1 bei hoher Pixeldichte, > 1 für kleine Muster). */
  function woodJob(target, w, h, key, opts) {
    opts = opts || {};
    var wd = WOODS[key];
    var ctx = target.getContext('2d');
    var img = ctx.createImageData(w, h), px = img.data;
    var seedBase = opts.seed || 7;
    var nA = makeNoise(seedBase + 1), nB = makeNoise(seedBase + 2), nC = makeNoise(seedBase + 3), nD = makeNoise(seedBase + 4);
    var sc = opts.scale || 1;
    var Hd = h * sc, Wd = w * sc;
    var lamN = opts.lamellae || 5;
    var lams = [], acc = 0, i;
    var rs = seedBase * 7919 + 104729;
    var rnd = function () { rs = (rs * 16807) % 2147483647; return (rs - 1) / 2147483646; };
    for (i = 0; i < lamN; i++) {
      var lh = (Hd / lamN) * (0.85 + rnd() * 0.3);
      var cathedral = rnd() < 0.62;
      lams.push({
        top: acc, h: lh,
        pith: (rnd() - 0.5) * lh * (cathedral ? 0.5 : 3.6),
        d0: 2 + rnd() * (cathedral ? 10 : 40),
        tilt: wd.tilt * (0.7 + rnd() * 0.8),
        x0: Wd * (0.05 + rnd() * 0.55),
        dir: rnd() < 0.5 ? 1 : -1,
        tone: 1 + (rnd() - 0.5) * wd.vary * 2,
        off: rnd() * 100
      });
      acc += lh;
    }
    var fix = Hd / acc; lams.forEach(function (l) { l.top *= fix; l.h *= fix; });
    var E = wd.early, Lt = wd.late, sp = wd.sp;
    var y = 0, x, li = 0, o = 0;
    // In Zeilenblöcken rechnen: step(deadline) gibt nach Ablauf der Frist ab und macht beim nächsten Aufruf weiter.
    var step = function (until) {
    for (; y < h; y++) {
      if ((y & 7) === 0 && y && performance.now() > until) return false;
      var v = y * sc;
      while (li < lams.length - 1 && v >= lams[li].top + lams[li].h) li++;
      var L = lams[li];
      var ly0 = v - L.top - L.h / 2 - L.pith;
      var glue = (li > 0 && v - L.top < sc) ? 0.86 : 1;
      for (x = 0; x < w; x++) {
        var u = x * sc;
        var ly = ly0 + nA(u * 0.0028 + L.off, v * 0.018) * wd.wave + nA(u * 0.011, v * 0.05 + L.off) * wd.wave * 0.25;
        var d = L.d0 + Math.max(0, (u - L.x0) * L.dir) * L.tilt;
        var r = Math.sqrt(ly * ly + d * d) + nB(u * 0.012, v * 0.05) * 1.1;
        var n = r / sp + 0.3 * Math.sin(r * 0.09 + L.off) + nC(r * 0.03, L.off) * 0.5;
        var t = n - Math.floor(n);
        var late = Math.pow(smooth(0.45, 0.96, t), 1.8) * wd.con;
        var fib = nD(u * 0.006, v * 1.1) * 0.6 + nD(u * 0.05, v * 3.2) * 0.4;
        var k = 1 + fib * wd.fib;
        if (wd.streak) k *= 1 + nC(u * 0.004, v * 0.02 + 3) * wd.streak;
        if (wd.flame) k *= 1 + Math.sin(u * 0.45 + nA(u * 0.02, v * 0.04) * 5) * wd.flame;
        var cr = lerp(E[0], Lt[0], late), cg = lerp(E[1], Lt[1], late), cb = lerp(E[2], Lt[2], late);
        if (wd.pores && t < 0.32) {
          var pm = 1 - t / 0.32;
          var pz = nB(u * 0.07, v * 1.7);
          if (pz > 0.42) { var pk = 1 - wd.pores * pm * 0.42 * smooth(0.42, 0.7, pz); cr *= pk; cg *= pk; cb *= pk; }
        }
        k *= 1 + nC(u * 0.0022, v * 0.012 + 11) * 0.05;
        if (wd.rays) { var rr = nA(u * 0.12, v * 0.9 + 9); if (rr > 0.6) { var rk = 1 + wd.rays * 0.3 * smooth(0.6, 0.8, rr); cr *= rk; cg *= rk; cb *= rk; } }
        if (wd.flecks) { var fl = nC(u * 0.16, v * 0.7); if (fl > 0.68) { var fk = 1 - wd.flecks * 0.3 * smooth(0.68, 0.85, fl); cr *= fk; cg *= fk; cb *= fk; } }
        k *= L.tone * glue;
        px[o++] = cr * k; px[o++] = cg * k; px[o++] = cb * k; px[o++] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return true;
    };
    return { step: step };
  }
  function renderWood(target, w, h, key, opts) { woodJob(target, w, h, key, opts).step(Infinity); }
  var idleTask = window.requestIdleCallback
    ? function (fn) { requestIdleCallback(function (dl) { fn(performance.now() + Math.max(6, Math.min(14, dl.timeRemaining()))); }, { timeout: 500 }); }
    : function (fn) { setTimeout(function () { fn(performance.now() + 10); }, 16); };

  function renderEdge(target, w, h, key) {
    var wd = WOODS[key], ctx = target.getContext('2d');
    var img = ctx.createImageData(w, h), px = img.data, o = 0, nA = makeNoise(91), nB = makeNoise(92);
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var n = (y / h) * 4.5 + nA(x * 0.004, y * 0.08) * 0.9;
        var t = n - Math.floor(n);
        var late = Math.pow(smooth(0.5, 0.97, t), 1.4) * wd.con;
        var k = 0.78 * (1 + nB(x * 0.01, y * 0.9) * wd.fib);
        px[o++] = lerp(wd.early[0], wd.late[0], late) * k;
        px[o++] = lerp(wd.early[1], wd.late[1], late) * k;
        px[o++] = lerp(wd.early[2], wd.late[2], late) * k;
        px[o++] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  function initLibrary() {
    var lib = qs('[data-lib]');
    if (!lib) return;
    var board = qs('[data-board]', lib), canA = qs('[data-board-a]', lib), canB = qs('[data-board-b]', lib);
    var edge = qs('[data-edge]', lib), glint = qs('[data-glint]', lib), sheen = qs('[data-sheen]', lib);
    var out = qs('[data-board-current]', lib);
    var top = qs('.board-top', lib);
    var cache = {}, pending = {}, gen = 0, size = { w: 0, h: 0 }, wood = 'eiche', finish = 'natur', anim = null, glintAnim = null;
    var getChecked = function (name) { var el = qs('input[name="' + name + '"]:checked', lib); return el ? el.value : null; };
    wood = getChecked('holz') || 'eiche';
    finish = getChecked('oberflaeche') || 'natur';
    board.setAttribute('data-finish', finish);

    var newJob = function (key) {
      var c = document.createElement('canvas');
      c.width = size.w; c.height = size.h;
      return { c: c, job: woodJob(c, size.w, size.h, key, { seed: 7, scale: size.q ? 1 / size.q : 1 }) };
    };
    // Synchron (bei einem Klick auf ein noch nicht vorbereitetes Holz) …
    var texture = function (key) {
      if (cache[key]) return cache[key];
      var t = pending[key] || newJob(key);
      t.job.step(Infinity);
      delete pending[key];
      cache[key] = t.c;
      return t.c;
    };
    // … sonst in Leerlauf-Häppchen, damit beim Scrollen keine langen Tasks entstehen.
    var textureAsync = function (key, done) {
      if (cache[key]) { done(); return; }
      var g = gen, t = pending[key] || (pending[key] = newJob(key));
      var tick = function (until) {
        if (g !== gen) return;
        if (cache[key]) { done(); return; }
        if (t.job.step(until)) { delete pending[key]; cache[key] = t.c; done(); }
        else idleTask(tick);
      };
      idleTask(tick);
    };
    var paint = function (canvas, key) {
      var t = texture(key), ctx = canvas.getContext('2d');
      if (canvas.width !== size.w || canvas.height !== size.h) { canvas.width = size.w; canvas.height = size.h; }
      ctx.drawImage(t, 0, 0);
    };
    var paintEdge = function () {
      var r = edge.getBoundingClientRect();
      var w = Math.max(1, Math.round(r.width * Math.min(dprMax(), 1.5))), h = Math.max(1, Math.round(r.height * Math.min(dprMax(), 1.5)));
      edge.width = w; edge.height = h;
      renderEdge(edge, w, h, wood);
    };
    var measure = function () {
      var r = top.getBoundingClientRect();
      var q = Math.min(dprMax(), 1.5);
      var w = Math.round(r.width * q), h = Math.round(r.height * q);
      if (!w || !h) return false;
      if (Math.abs(w - size.w) < 24 && size.w) return false;
      size.w = w; size.h = h; size.q = q; cache = {}; pending = {}; gen++;
      return true;
    };
    var full = function () {
      if (!measure()) return;
      canB.style.clipPath = 'inset(0 100% 0 0)';
      paintEdge();
      var first = wood;
      textureAsync(first, function () {
        if (!anim) paint(canA, wood);
        lib.classList.add('has-canvas');
        prewarm();
      });
    };
    var prewarm = function () {
      var keys = Object.keys(WOODS).filter(function (k) { return !cache[k]; });
      var next = function () { var k = keys.shift(); if (k) textureAsync(k, next); };
      next();
    };

    var setWood = function (key) {
      if (key === wood && !anim) return;
      var prevAnim = anim;
      if (prevAnim) { prevAnim.cancel(); if (glintAnim) glintAnim.cancel(); paint(canA, wood); }
      wood = key;
      updateCaption();
      if (!size.w) return;
      if (reduced()) {
        paint(canB, key);
        canB.style.clipPath = 'inset(0 0 0 0)';
        anim = canB.animate([{ opacity: 0 }, { opacity: 1 }], { duration: motionOff ? 1 : 350, easing: 'ease' });
      } else {
        paint(canB, key);
        anim = canB.animate([{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)' }], { duration: 950, easing: 'cubic-bezier(0.77, 0, 0.175, 1)', fill: 'forwards' });
        glintAnim = glint.animate([
          { transform: 'translateX(-100%)', opacity: 0 },
          { opacity: 1, offset: 0.15 },
          { opacity: 1, offset: 0.85 },
          { transform: 'translateX(560%)', opacity: 0 }
        ], { duration: 950, easing: 'cubic-bezier(0.77, 0, 0.175, 1)' });
      }
      var a = anim;
      a.onfinish = function () {
        if (anim !== a) return;
        paint(canA, wood);
        a.cancel();
        canB.style.clipPath = 'inset(0 100% 0 0)';
        anim = null;
      };
      paintEdge();
    };
    var setFinish = function (f) {
      finish = f;
      board.setAttribute('data-finish', f);
      updateCaption();
    };
    var updateCaption = function () {
      if (out) out.textContent = WOODS[wood].name + ', ' + FINISH_NAMES[finish];
    };

    lib.addEventListener('change', function (e) {
      var t = e.target;
      if (t.name === 'holz') setWood(t.value);
      if (t.name === 'oberflaeche') setFinish(t.value);
    });

    // Swatches (erst, wenn der Abschnitt in die Nähe kommt – siehe startOnce)
    var paintSwatches = function () {
      var list = qsa('[data-swatch]', lib);
      var next = function () {
        var c = list.shift(); if (!c) return;
        var job = woodJob(c, c.width, c.height, c.getAttribute('data-swatch'), { scale: 1.6, lamellae: 1, seed: 3 });
        var tick = function (until) { if (job.step(until)) next(); else idleTask(tick); };
        idleTask(tick);
      };
      next();
    };

    // Licht folgt der Maus (Feder) + leichte Neigung
    if (finePointer && !reduced()) {
      var s = { x: 0.3, y: 0.2, tx: 0.3, ty: 0.2, rx: 0, ry: 0, trx: 0, try_: 0 }, raf = 0;
      var tick = function () {
        raf = 0;
        s.x += (s.tx - s.x) * 0.08; s.y += (s.ty - s.y) * 0.08;
        s.rx += (s.trx - s.rx) * 0.08; s.ry += (s.try_ - s.ry) * 0.08;
        sheen.style.setProperty('--lx', (s.x * 100).toFixed(2) + '%');
        sheen.style.setProperty('--ly', (s.y * 100).toFixed(2) + '%');
        board.style.transform = 'rotateX(' + s.rx.toFixed(3) + 'deg) rotateY(' + s.ry.toFixed(3) + 'deg)';
        if (Math.abs(s.tx - s.x) + Math.abs(s.ty - s.y) + Math.abs(s.trx - s.rx) + Math.abs(s.try_ - s.ry) > 0.002) raf = requestAnimationFrame(tick);
      };
      var stage = qs('.lib-stage', lib);
      stage.addEventListener('pointermove', function (e) {
        var r = top.getBoundingClientRect();
        var px = clamp((e.clientX - r.left) / r.width, -0.2, 1.2), py = clamp((e.clientY - r.top) / r.height, -0.2, 1.2);
        s.tx = px; s.ty = py;
        s.trx = (0.5 - py) * 4; s.try_ = (px - 0.5) * 5;
        if (!raf) raf = requestAnimationFrame(tick);
      });
      stage.addEventListener('pointerleave', function () {
        s.tx = 0.3; s.ty = 0.2; s.trx = 0; s.try_ = 0;
        if (!raf) raf = requestAnimationFrame(tick);
      });
      qs('.board-wrap', lib).style.perspective = '1600px';
    }

    // Erst rendern, wenn der Abschnitt in die Nähe kommt
    var started = false;
    var startOnce = function () { if (started) return; started = true; paintSwatches(); full(); };
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { startOnce(); io.disconnect(); } }, { rootMargin: '600px 0px' });
      io.observe(lib);
    } else startOnce();
    var rt = 0;
    window.addEventListener('resize', function () { if (!started) return; clearTimeout(rt); rt = setTimeout(full, 200); });

    // „Diese Kombination anfragen“
    var take = qs('[data-take-material]', lib);
    if (take) take.addEventListener('click', function () {
      if (window.__lindnerWizard) window.__lindnerWizard.takeMaterial(WOODS[wood].name, FINISH_NAMES[finish]);
    });
    updateCaption();
  }

  /* ------------------------------------------------------------------
     Projekte: horizontale, gepinnte Strecke (Desktop) / native Liste (mobil)
     ------------------------------------------------------------------ */
  function initProjects() {
    var section = qs('#projekte'), pin = qs('[data-projects-pin]'), viewport = qs('[data-projects-viewport]'), track = qs('[data-projects-track]');
    if (!section || !track) return;
    var cards = qsa('[data-pcard]', track);
    var cur = qs('[data-pp-cur]'), bar = qs('[data-pp-bar]');
    var n = cards.length, last = -1;
    var setProgress = function (p) {
      p = clamp(p, 0, 1);
      if (bar) bar.style.transform = 'scaleX(' + (1 / n + p * (1 - 1 / n)).toFixed(4) + ')';
      var i = Math.min(n - 1, Math.round(p * (n - 1)));
      if (i !== last && cur) { cur.textContent = String(i + 1).padStart(2, '0'); last = i; }
    };
    setProgress(0);
    viewport.addEventListener('scroll', function () {
      if (section.classList.contains('is-pinned')) return;
      var max = viewport.scrollWidth - viewport.clientWidth;
      setProgress(max > 0 ? viewport.scrollLeft / max : 0);
    }, { passive: true });
    viewport.setAttribute('tabindex', '0');
    viewport.setAttribute('role', 'region');
    viewport.setAttribute('aria-label', 'Projekte, horizontal scrollbar');

    if (!hasGSAP || reduced()) return;
    var mm = gsap.matchMedia();
    mm.add('(min-width: 900px)', function () {
      section.classList.add('is-pinned');
      viewport.removeAttribute('tabindex');
      var dist = function () { return Math.max(0, track.scrollWidth - viewport.clientWidth); };
      // Sticky statt GSAP-Pin: Abschnitt so hoch wie Bildschirm + Streckenlänge, die Bühne klebt per CSS.
      var setH = function () { section.style.height = Math.round(window.innerHeight + dist()) + 'px'; };
      setH();
      ScrollTrigger.addEventListener('refreshInit', setH);
      var tween = gsap.to(track, {
        x: function () { return -dist(); },
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: function () { return '+=' + dist(); },
          scrub: 0.6,
          invalidateOnRefresh: true,
          onUpdate: function (self) { setProgress(self.progress); }
        }
      });
      qsa('.pcard-media img', track).forEach(function (img) {
        gsap.fromTo(img, { xPercent: -5 }, {
          xPercent: 5, ease: 'none',
          scrollTrigger: { trigger: img.closest('.pcard'), containerAnimation: tween, start: 'left right', end: 'right left', scrub: true }
        });
      });
      qsa('.pcard-sample', track).forEach(function (smp) {
        gsap.fromTo(smp, { x: 28 }, {
          x: -10, ease: 'none',
          scrollTrigger: { trigger: smp.closest('.pcard'), containerAnimation: tween, start: 'left right', end: 'right left', scrub: true }
        });
      });
      return function () {
        section.classList.remove('is-pinned');
        section.style.height = '';
        ScrollTrigger.removeEventListener('refreshInit', setH);
        viewport.setAttribute('tabindex', '0');
        gsap.set(track, { clearProps: 'transform' });
        setProgress(0);
      };
    });
  }

  /* Holzmuster der Projekt-Kacheln – in kleinen Häppchen im Leerlauf gerendert */
  function initSamples() {
    var list = qsa('[data-wood-sample]');
    var next = function () {
      var el = list.shift();
      if (!el) return;
      var cv = qs('canvas', el), r = el.getBoundingClientRect();
      var w = Math.max(40, Math.min(640, Math.round(r.width))), h = Math.max(20, Math.round(r.height));
      cv.width = w; cv.height = h;
      var job = woodJob(cv, w, h, el.getAttribute('data-wood-sample'), { seed: +el.getAttribute('data-seed') || 7, lamellae: 1, scale: 1.6 });
      var go = function (deadline) { if (job.step(deadline)) { el.classList.add('is-ready'); idleTask(function (d) { next(); }); } else idleTask(go); };
      idleTask(go);
    };
    next();
  }

  /* ------------------------------------------------------------------
     Ablauf: Skizze zeichnet sich beim Scrollen
     ------------------------------------------------------------------ */
  function initProcess() {
    var svg = qs('.sketch-svg'), stepsEl = qs('[data-steps]'), pin = qs('[data-process-pin]');
    if (!svg || !stepsEl) return;
    var steps = qsa('.step', stepsEl), stepLabel = qs('[data-sketch-step]');
    var groups = [1, 2, 3, 4, 5].map(function (k) {
      return { paths: qsa('.sk.s' + k, svg), notes: qsa('.sk-note.n' + k, svg) };
    });
    var lastStep = -1;
    var setStep = function (k) {
      if (k === lastStep) return;
      lastStep = k;
      steps.forEach(function (s, i) {
        s.classList.toggle('is-active', i === k - 1);
        s.classList.toggle('is-done', i < k - 1);
      });
      if (stepLabel) stepLabel.textContent = String(k);
    };
    // sp: 0…5 (eine Einheit je Blatt). Blatt 1 (Notizen, Daumenskizzen) entsteht schon beim Hereinscrollen,
    // damit das Papier beim Ankommen nie leer ist; der gepinnte Teil zeichnet dann Blatt 2–5.
    var ENTRY = 0.92;
    var setProgress = function (sp) {
      sp = clamp(sp, 0, 5);
      groups.forEach(function (g, gi) {
        var local = clamp(sp - gi, 0, 1);
        var m = g.paths.length;
        g.paths.forEach(function (path, i) {
          var start = m > 1 ? (i / m) * 0.72 : 0;
          var pp = clamp((local - start) / 0.28, 0, 1);
          var v = (1 - pp).toFixed(3);
          if (path.__v !== v) { path.__v = v; path.style.strokeDashoffset = v; path.style.opacity = pp > 0 ? 1 : 0; }
        });
        var no = clamp((local - 0.55) / 0.35, 0, 1).toFixed(2);
        g.notes.forEach(function (t) { if (t.__v !== no) { t.__v = no; t.style.opacity = no; } });
      });
      setStep(Math.min(5, Math.floor(sp) + 1));
    };

    if (reduced() || !hasGSAP) {
      stepsEl.classList.remove('is-live');
      if (stepLabel) stepLabel.textContent = '5';
      return;
    }
    stepsEl.classList.add('is-live');
    setProgress(0);
    var mm = gsap.matchMedia();
    var section = qs('#ablauf'), sketch = qs('.process-sketch');
    // Zwei aneinandergrenzende Strecken: Eingang (Blatt 1) und Hauptteil (Blatt 2–5).
    // Hauptteil: erstes Fünftel = Schritt 1 (Blatt 1 wird fertig), danach je Fünftel ein Blatt.
    // Letztes Stück der Strecke: Skizze → Werkstück. Das Foto wischt unter den Linien herein.
    var PH = 0.16;
    var photoG = qs('[data-sketch-photo]', svg), lines = qs('.sk-lines', svg), grid = qs('.sk-grid', svg), done = qs('.sk-done', svg);
    var img = photoG && qs('image', photoG);
    if (img && img.getAttribute('data-href')) img.setAttribute('href', img.getAttribute('data-href'));
    var lastPh = -1;
    var setPhoto = function (t) {
      t = Math.round(clamp(t, 0, 1) * 200) / 200;
      if (t === lastPh || !photoG) return;
      lastPh = t;
      var e = t * t * (3 - 2 * t);
      photoG.style.clipPath = 'inset(0 ' + (100 - e * 100).toFixed(1) + '% 0 0)';
      if (lines) lines.style.opacity = (1 - 0.62 * e).toFixed(3);
      if (grid) grid.style.opacity = (1 - e).toFixed(3);
      if (done) done.style.opacity = smooth(0.7, 1, t).toFixed(2);
      sketch && sketch.classList.toggle('is-built', t > 0.98);
    };
    var mainMap = function (p) {
      setPhoto((p - (1 - PH)) / PH);
      p = Math.min(1, p / (1 - PH));
      return p < 0.2 ? ENTRY + (1 - ENTRY) * (p / 0.2) : 1 + (p - 0.2) * 5;
    };
    var pair = function (entryCfg, mainCfg) {
      var main = null, entry = null;
      main = ScrollTrigger.create(Object.assign(mainCfg, {
        onUpdate: function (self) {
          if (self.progress <= 0 && entry && entry.progress < 1) { setPhoto(0); setProgress(entry.progress * ENTRY); return; }
          setProgress(mainMap(self.progress));
        }
      }));
      entry = ScrollTrigger.create(Object.assign(entryCfg, {
        onUpdate: function (self) { if (!main || main.progress <= 0) { setPhoto(0); setProgress(self.progress * ENTRY); } }
      }));
      setProgress(main.progress > 0 ? mainMap(main.progress) : entry.progress * ENTRY);
      return function () { entry.kill(); main.kill(); };
    };
    // Im gepinnten Zustand hält die Schrittliste die Höhe des längsten geöffneten Schritts –
    // sonst verschiebt das Auf- und Zuklappen den vertikal zentrierten Block (Layout-Shift).
    var lockSteps = function () {
      stepsEl.style.minHeight = '';
      var base = 0, tallest = 0;
      steps.forEach(function (st) {
        var more = qs('.step-more', st), inner = more && more.firstElementChild;
        base += st.offsetHeight - (more ? more.offsetHeight : 0);
        if (inner) tallest = Math.max(tallest, inner.scrollHeight);
      });
      stepsEl.style.minHeight = Math.ceil(base + tallest) + 'px';
    };
    mm.add('(min-width: 900px)', function () {
      section.classList.add('is-pinned');
      lockSteps();
      ScrollTrigger.addEventListener('refreshInit', lockSteps);
      // Sticky statt GSAP-Pin: Bühne klebt per CSS, der Abschnitt liefert die Scrollstrecke.
      var setH = function () { section.style.height = Math.round(window.innerHeight * 4.1) + 'px'; };
      setH();
      ScrollTrigger.addEventListener('refreshInit', setH);
      var kill = pair(
        { trigger: section, start: 'top 70%', end: 'top top' },
        { trigger: section, start: 'top top', end: function () { return '+=' + Math.round(window.innerHeight * 3.1); } }
      );
      return function () {
        kill(); section.classList.remove('is-pinned'); section.style.height = '';
        ScrollTrigger.removeEventListener('refreshInit', setH);
        ScrollTrigger.removeEventListener('refreshInit', lockSteps);
        stepsEl.style.minHeight = '';
      };
    });
    mm.add('(max-width: 899px)', function () {
      return pair(
        { trigger: sketch || stepsEl, start: 'top 92%', end: 'top 30%' },
        { trigger: stepsEl, start: 'top 60%', end: 'bottom 88%' }
      );
    });
  }

  /* ------------------------------------------------------------------
     Jahresringe + Zeitleiste + Zähler
     ------------------------------------------------------------------ */
  function initRings() {
    var svg = qs('[data-rings-svg]'), fig = qs('[data-rings]');
    if (!svg) return;
    var NS = 'http://www.w3.org/2000/svg';
    var since = 1987, now = new Date().getFullYear(), N = Math.max(10, now - since);
    var noise = makeNoise(5), R = 232, marks = { 1996: -0.32, 2009: -0.78, 2016: -1.22, 2021: -1.66 };
    var widths = [], total = 0, k;
    for (k = 0; k < N; k++) {
      var w = (1.5 - 0.75 * (k / N)) * (0.7 + 0.6 * (noise(k * 0.37, 2.2) * 0.5 + 0.5));
      widths.push(w); total += w;
    }
    var radii = [], acc = 0;
    for (k = 0; k < N; k++) { acc += widths[k]; radii.push((acc / total) * R); }
    var ex = 10, ey = -7; // Mark leicht außermittig
    var ringPath = function (r, kk, amp) {
      var pts = [], M = 72;
      for (var i = 0; i < M; i++) {
        var a = (i / M) * Math.PI * 2;
        var wob = 1 + amp * noise(Math.cos(a) * 1.3 + kk * 0.045, Math.sin(a) * 1.3 + 7.1) + 0.012 * noise(Math.cos(a) * 4 + kk * 0.2, Math.sin(a) * 4);
        var f = r / R;
        pts.push([ex * (1 - f) + Math.cos(a) * r * wob, ey * (1 - f) + Math.sin(a) * r * wob * 0.97]);
      }
      var d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
      for (var j = 0; j < M; j++) {
        var p0 = pts[(j - 1 + M) % M], p1 = pts[j], p2 = pts[(j + 1) % M], p3 = pts[(j + 2) % M];
        d += 'C' + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + ' ' + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) + ' ' + (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + ' ' + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) + ' ' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1);
      }
      return d + 'Z';
    };
    var ringsG = document.createElementNS(NS, 'g'), tagsG = document.createElementNS(NS, 'g');
    var rings = [];
    // Risse
    [[-0.6, 0.62], [2.3, 0.48], [4.1, 0.38]].forEach(function (c) {
      var p = document.createElementNS(NS, 'path');
      var a = c[0], len = c[1] * R;
      p.setAttribute('d', 'M' + (ex + Math.cos(a) * 12).toFixed(1) + ' ' + (ey + Math.sin(a) * 12).toFixed(1) + 'L' + (Math.cos(a + 0.05) * len * 0.5).toFixed(1) + ' ' + (Math.sin(a + 0.05) * len * 0.5).toFixed(1) + 'L' + (Math.cos(a - 0.02) * len).toFixed(1) + ' ' + (Math.sin(a - 0.02) * len).toFixed(1));
      p.setAttribute('class', 'crack');
      ringsG.appendChild(p);
    });
    var pith = document.createElementNS(NS, 'ellipse');
    pith.setAttribute('cx', ex); pith.setAttribute('cy', ey); pith.setAttribute('rx', 3.2); pith.setAttribute('ry', 2.6); pith.setAttribute('class', 'pith');
    ringsG.appendChild(pith);
    for (k = 0; k < N; k++) {
      var year = since + k + 1;
      var p = document.createElementNS(NS, 'path');
      p.setAttribute('d', ringPath(radii[k], k, 0.035 + 0.025 * (k / N)));
      p.setAttribute('class', 'ring' + (marks[year] ? ' mark' : (k % 5 === 4 ? ' late' : '')));
      ringsG.appendChild(p);
      rings.push(p);
      if (marks[year]) {
        var ang = marks[year];
        var tx = ex * (1 - radii[k] / R) + Math.cos(ang) * radii[k], ty = ey * (1 - radii[k] / R) + Math.sin(ang) * radii[k];
        var g = document.createElementNS(NS, 'g');
        g.setAttribute('class', 'ring-tag');
        g.setAttribute('data-year', year);
        var rect = document.createElementNS(NS, 'rect');
        rect.setAttribute('x', (tx - 23).toFixed(1)); rect.setAttribute('y', (ty - 10).toFixed(1)); rect.setAttribute('width', 46); rect.setAttribute('height', 20); rect.setAttribute('rx', 10);
        var txt = document.createElementNS(NS, 'text');
        txt.setAttribute('x', tx.toFixed(1)); txt.setAttribute('y', (ty + 4.5).toFixed(1)); txt.setAttribute('text-anchor', 'middle');
        txt.textContent = String(year);
        g.appendChild(rect); g.appendChild(txt);
        tagsG.appendChild(g);
      }
    }
    var bark = document.createElementNS(NS, 'path');
    bark.setAttribute('d', ringPath(R + 7, N + 2, 0.05));
    bark.setAttribute('class', 'bark');
    ringsG.appendChild(bark);
    svg.appendChild(ringsG); svg.appendChild(tagsG);
    var tags = qsa('.ring-tag', tagsG);
    var yearEl = qs('[data-rings-year]');
    var tl = qs('[data-timeline]'), tlItems = tl ? qsa('li', tl) : [];
    var lastShown = -1;
    var setProgress = function (p) {
      var grown = clamp(p, 0, 1) * N;
      var shown = Math.floor(grown);
      rings.forEach(function (r, i) {
        var o = clamp(grown - i, 0, 1);
        if (r.__o !== o) { r.__o = o; r.style.opacity = o; }
      });
      var outer = shown > 0 ? radii[Math.min(N - 1, Math.max(0, Math.ceil(grown) - 1))] : 8;
      var sc = clamp((outer + 7) / (R + 7), 0.04, 1);
      bark.style.transform = 'scale(' + sc.toFixed(4) + ')';
      if (shown !== lastShown) {
        lastShown = shown;
        var y = since + shown;
        if (yearEl) yearEl.textContent = String(y);
        tags.forEach(function (t) { t.style.opacity = +t.getAttribute('data-year') <= y ? 1 : 0; });
        tlItems.forEach(function (li) { li.classList.toggle('is-reached', +li.getAttribute('data-year') <= y); });
      }
    };
    bark.style.transformOrigin = ex + 'px ' + ey + 'px';
    bark.style.transformBox = 'view-box';

    if (reduced() || !hasGSAP) { setProgress(1); return; }
    if (tl) tl.classList.add('is-live');
    setProgress(0);
    var mm = gsap.matchMedia();
    mm.add('(min-width: 900px)', function () {
      var st = ScrollTrigger.create({ trigger: tl, start: 'top 75%', end: 'bottom 45%', scrub: 0.6, onUpdate: function (s) { setProgress(s.progress); } });
      return function () { st.kill(); };
    });
    mm.add('(max-width: 899px)', function () {
      var st = ScrollTrigger.create({ trigger: fig, start: 'top 80%', end: 'bottom 30%', scrub: 0.5, onUpdate: function (s) { setProgress(s.progress); } });
      return function () { st.kill(); };
    });
  }

  function initCounters() {
    var els = qsa('[data-count]');
    var fmt = function (v) { return Math.round(v).toLocaleString('de-DE'); };
    els.forEach(function (el) {
      var since = el.getAttribute('data-since');
      if (since) el.setAttribute('data-count', String(new Date().getFullYear() - parseInt(since, 10)));
      var to = parseFloat(el.getAttribute('data-count'));
      var suf = el.getAttribute('data-suffix') || '';
      el.__final = fmt(to) + suf;
      el.textContent = el.__final;
      el.style.minWidth = (el.__final.length * 0.62) + 'em';
    });
    if (reduced() || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        var el = en.target, to = parseFloat(el.getAttribute('data-count')), suf = el.getAttribute('data-suffix') || '';
        var t0 = performance.now(), dur = 1700;
        var step = function (t) {
          var p = clamp((t - t0) / dur, 0, 1);
          el.textContent = fmt(to * easeOut(p)) + suf;
          if (p < 1) requestAnimationFrame(step); else el.textContent = el.__final;
        };
        el.textContent = '0' + suf;
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ------------------------------------------------------------------
     Kundenstimmen
     ------------------------------------------------------------------ */
  function initQuotes() {
    var root = qs('[data-quotes]');
    if (!root) return;
    var quotes = qsa('[data-quote]', root), nav = qs('[data-quotes-nav]', root);
    var cur = qs('[data-quotes-cur]', root), bar = qs('[data-quotes-bar]', root), stage = qs('[data-quotes-stage]', root);
    var i = 0, n = quotes.length;
    root.classList.add('is-ready');
    nav.hidden = false;
    var show = function (k) {
      i = (k + n) % n;
      quotes.forEach(function (q, j) {
        q.classList.toggle('is-active', j === i);
        if (j === i) q.removeAttribute('aria-hidden'); else q.setAttribute('aria-hidden', 'true');
      });
      if (cur) cur.textContent = String(i + 1).padStart(2, '0');
      if (bar) bar.style.transform = 'scaleX(' + ((i + 1) / n).toFixed(3) + ')';
    };
    stage.setAttribute('aria-live', 'off');
    show(0);
    stage.setAttribute('aria-live', 'polite');
    qs('[data-quotes-prev]', root).addEventListener('click', function () { show(i - 1); });
    qs('[data-quotes-next]', root).addEventListener('click', function () { show(i + 1); });
    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); show(i - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); show(i + 1); }
    });
    var sx = 0, sy = 0, t0 = 0, down = false;
    stage.addEventListener('pointerdown', function (e) { if (e.pointerType === 'mouse') return; down = true; sx = e.clientX; sy = e.clientY; t0 = performance.now(); });
    stage.addEventListener('pointerup', function (e) {
      if (!down) return; down = false;
      var dx = e.clientX - sx, dy = e.clientY - sy, v = Math.abs(dx) / Math.max(1, performance.now() - t0);
      if (Math.abs(dx) > Math.abs(dy) && (Math.abs(dx) > 50 || v > 0.4)) show(i + (dx < 0 ? 1 : -1));
    });
    stage.addEventListener('pointercancel', function () { down = false; });
  }

  /* ------------------------------------------------------------------
     Einzugsgebiet: Orte hervorheben
     ------------------------------------------------------------------ */
  function initMap() {
    var map = qs('[data-map]'), list = qs('[data-town-list]');
    if (!map) return;
    qsa('.town', map).forEach(function (t, i) { t.style.setProperty('--i', i); });
    if (!list) return;
    var hot = function (id, on) {
      qsa('[data-town="' + id + '"]').forEach(function (el) { el.classList.toggle('is-hot', on); });
    };
    qsa('li[data-town]', list).concat(qsa('.town', map)).forEach(function (el) {
      var id = el.getAttribute('data-town');
      el.addEventListener('pointerenter', function () { hot(id, true); });
      el.addEventListener('pointerleave', function () { hot(id, false); });
    });
  }

  /* ------------------------------------------------------------------
     Anfrage-Assistent
     ------------------------------------------------------------------ */
  function initWizard() {
    var form = qs('[data-wizard]');
    if (!form) return;
    var card = form.parentElement;
    var panels = qsa('[data-wz-panel]', form), indicators = qsa('.wz-step', form);
    var bar = qs('[data-wz-bar]', form), live = qs('[data-wz-live]', form);
    var back = qs('[data-wz-back]', form), next = qs('[data-wz-next]', form), submit = qs('[data-wz-submit]', form);
    var success = qs('[data-wz-success]', card), summary = qs('[data-wz-summary]', card);
    var fromLib = qs('[data-from-lib]', form), fromLibText = qs('[data-from-lib-text]', form), finishField = qs('[data-finish-field]', form);
    var textarea = qs('#f-text', form), counter = qs('[data-count-text]', form);
    var step = 1, total = panels.length;
    var actionBar = qs('.action-bar');

    var val = function (name) {
      var els = form.elements[name];
      if (!els) return '';
      if (els.length !== undefined && els.tagName !== 'SELECT') {
        for (var i = 0; i < els.length; i++) if (els[i].checked) return els[i].value;
        return '';
      }
      if (els.type === 'checkbox') return els.checked ? 'ja' : '';
      return (els.value || '').trim();
    };
    var errEl = function (name) { return qs('[data-error-for="' + name + '"]', form); };
    var setError = function (name, msg) {
      var e = errEl(name); if (e) e.textContent = msg || '';
      var els = form.elements[name];
      var list = els ? (els.length !== undefined && els.tagName !== 'SELECT' ? Array.prototype.slice.call(els) : [els]) : [];
      if (name === 'dims') list = qsa('.dims input', form);
      list.forEach(function (el) { if (msg) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid'); });
      return list[0];
    };
    var rules = {
      1: function () { return [['vorhaben', val('vorhaben') ? '' : 'Bitte wählen Sie eine Option – Einzelheiten können Sie im nächsten Schritt beschreiben.']]; },
      2: function () {
        var dimsBad = qsa('.dims input', form).some(function (inp) {
          var v = inp.value.trim(); if (!v) return false;
          var num = Number(v); return !(Number.isInteger(num) && num >= 1 && num <= 3000);
        });
        return [
          ['raum', val('raum') ? '' : 'Bitte wählen Sie einen Raum. Passt keiner, nehmen Sie „Etwas anderes“.'],
          ['dims', dimsBad ? 'Bitte nur ganze Zentimeter zwischen 1 und 3.000 eingeben.' : '']
        ];
      },
      3: function () {
        return [
          ['zeitraum', val('zeitraum') ? '' : 'Bitte wählen Sie einen Zeitraum – „Noch offen“ ist völlig in Ordnung.'],
          ['budget', val('budget') ? '' : 'Bitte wählen Sie einen Rahmen – auch „Weiß ich noch nicht“ hilft uns weiter.']
        ];
      },
      4: function () {
        var mail = val('email'), tel = val('telefon');
        return [
          ['name', val('name').length >= 2 ? '' : 'Bitte geben Sie Ihren Namen an.'],
          ['email', !mail ? 'Bitte geben Sie Ihre E-Mail-Adresse an.' : (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail) ? '' : 'Diese E-Mail-Adresse sieht unvollständig aus – fehlt ein @ oder die Endung?')],
          ['telefon', !tel || /^\+?[0-9][0-9 ()\/-]{4,}$/.test(tel) ? '' : 'Bitte prüfen Sie die Telefonnummer – erlaubt sind Ziffern, Leerzeichen und +.'],
          ['plz', /^\d{5}$/.test(val('plz')) ? '' : 'Bitte geben Sie eine fünfstellige Postleitzahl an.'],
          ['datenschutz', val('datenschutz') ? '' : 'Bitte bestätigen Sie die Einwilligung, damit wir Ihnen antworten dürfen.']
        ];
      }
    };
    var validate = function (k) {
      var first = null;
      rules[k]().forEach(function (r) {
        var el = setError(r[0], r[1]);
        if (r[1] && !first) first = el;
      });
      if (first) { first.focus(); if (live) live.textContent = 'Bitte prüfen Sie die markierten Angaben.'; return false; }
      return true;
    };
    // Fehler beim Korrigieren entfernen
    form.addEventListener('input', function (e) { var n = e.target.name; if (!n) return; if (e.target.closest('.dims')) n = 'dims'; if (e.target.getAttribute('aria-invalid')) setError(n, ''); });
    form.addEventListener('change', function (e) { var n = e.target.name; if (n && (e.target.type === 'radio' || e.target.type === 'checkbox' || e.target.tagName === 'SELECT')) setError(n, ''); });

    var show = function (k, dir) {
      panels.forEach(function (p) {
        var on = +p.getAttribute('data-wz-panel') === k;
        p.classList.toggle('is-active', on);
        p.classList.remove('is-entering', 'from-left');
        if (on && dir) { void p.offsetWidth; p.classList.add('is-entering'); if (dir < 0) p.classList.add('from-left'); }
      });
      indicators.forEach(function (li, i) {
        li.classList.toggle('is-current', i === k - 1);
        li.classList.toggle('is-done', i < k - 1);
        if (i === k - 1) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
      });
      if (bar) bar.style.transform = 'scaleX(' + (k / total) + ')';
      back.hidden = k === 1;
      next.hidden = k === total;
      submit.classList.toggle('is-visible', k === total);
      step = k;
      if (dir) {
        var q = qs('[data-wz-panel="' + k + '"] .wz-q', form);
        if (live) live.textContent = 'Schritt ' + k + ' von ' + total + ': ' + (q ? q.textContent : '');
        var r = card.getBoundingClientRect();
        if (r.top < headerOffset()) scrollToTarget(card);
        if (q) q.focus({ preventScroll: true });
      }
    };

    next.addEventListener('click', function () { if (validate(step)) show(step + 1, 1); });
    back.addEventListener('click', function () { show(step - 1, -1); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (step < total) { if (validate(step)) show(step + 1, 1); return; }
      if (!validate(total)) return;
      // Zusammenfassung – nur textContent, nie innerHTML
      while (summary.firstChild) summary.removeChild(summary.firstChild);
      var dims = ['breite', 'hoehe', 'tiefe'].map(val);
      var dimTxt = dims.some(Boolean) ? dims.map(function (v) { return v || '–'; }).join(' × ') + ' cm (B × H × T)' : '';
      var wood = val('holzwunsch') + (val('oberflaeche') ? ', ' + val('oberflaeche') : '');
      var rows = [
        ['Vorhaben', val('vorhaben')], ['Raum', val('raum')], ['Maße', dimTxt], ['Holz', wood],
        ['Notiz', val('beschreibung')], ['Zeitraum', val('zeitraum')], ['Budget', val('budget')],
        ['Name', val('name')], ['E-Mail', val('email')], ['Telefon', val('telefon')], ['PLZ', val('plz')], ['Rückmeldung', val('rueckmeldung')]
      ];
      rows.forEach(function (r) {
        if (!r[1]) return;
        var d = document.createElement('div'), dt = document.createElement('dt'), dd = document.createElement('dd');
        dt.textContent = r[0]; dd.textContent = r[1];
        d.appendChild(dt); d.appendChild(dd); summary.appendChild(d);
      });
      qs('[data-wz-name]', card).textContent = val('name');
      form.hidden = true;
      success.hidden = false;
      var r = card.getBoundingClientRect();
      if (r.top < headerOffset() || r.top > window.innerHeight * 0.5) scrollToTarget(card);
      success.focus({ preventScroll: true });
    });
    qs('[data-wz-reset]', card).addEventListener('click', function () {
      form.reset();
      clearLib();
      qsa('[aria-invalid]', form).forEach(function (el) { el.removeAttribute('aria-invalid'); });
      qsa('[data-error-for]', form).forEach(function (el) { el.textContent = ''; });
      if (counter) counter.textContent = '0';
      success.hidden = true;
      form.hidden = false;
      show(1, -1);
    });

    if (textarea && counter) textarea.addEventListener('input', function () { counter.textContent = String(textarea.value.length); });

    // Aktionsleiste ausblenden, solange im Formular getippt wird
    if (actionBar) {
      form.addEventListener('focusin', function (e) { if (e.target.matches('input:not([type=radio]):not([type=checkbox]), textarea, select')) actionBar.classList.add('is-hidden'); });
      form.addEventListener('focusout', function () { actionBar.classList.remove('is-hidden'); });
    }

    // Vorbelegung aus Leistungen
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('[data-prefill]');
      if (!a) return;
      var v = a.getAttribute('data-prefill');
      qsa('input[name="vorhaben"]', form).forEach(function (r) { r.checked = r.value === v; });
      setError('vorhaben', '');
    });

    var clearLib = function () {
      if (finishField) finishField.value = '';
      if (fromLib) fromLib.hidden = true;
    };
    if (qs('[data-from-lib-clear]', form)) qs('[data-from-lib-clear]', form).addEventListener('click', function () {
      clearLib();
      qsa('input[name="holzwunsch"]', form).forEach(function (r) { r.checked = r.value === 'Noch offen'; });
    });

    window.__lindnerWizard = {
      takeMaterial: function (woodName, finishName) {
        qsa('input[name="holzwunsch"]', form).forEach(function (r) { r.checked = r.value === woodName; });
        if (finishField) finishField.value = finishName;
        if (fromLib && fromLibText) { fromLibText.textContent = woodName + ', ' + finishName; fromLib.hidden = false; }
      }
    };

    show(1, 0);
  }

  /* ------------------------------------------------------------------
     Start
     ------------------------------------------------------------------ */
  function boot() {
    // Sofort: nur, was der erste Bildschirm braucht – damit die Hero-Sequenz ohne Wartezeit startet.
    safe('scroll', initScroll);
    safe('header', initHeader);
    safe('menu', initMenu);
    safe('heroTitle', initHeroTitle);
    safe('reveals', initReveals);
    safe('services', initServices);
    window.__lindnerReady = true;

    // Danach in kleinen Häppchen (je Aufgabe ein eigener Task), Reihenfolge = Reihenfolge der Pins.
    var queue = [
      ['slice', initSlice], ['shavings', initShavings], ['micro', initMicro], ['library', initLibrary], ['projects', initProjects], ['samples', initSamples], ['process', initProcess],
      ['rings', initRings], ['counters', initCounters], ['quotes', initQuotes], ['map', initMap], ['wizard', initWizard], ['burn', initBurn]
    ];
    var idle = window.requestIdleCallback ? function (fn) { requestIdleCallback(fn, { timeout: 300 }); } : function (fn) { setTimeout(fn, 16); };
    var finish = function () {
      if (!hasGSAP) return;
      var refresh = function () { ScrollTrigger.refresh(); };
      refresh();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
      if (document.readyState !== 'complete') window.addEventListener('load', refresh);
      // Direkt aufgerufene Anker (#ablauf …) nach dem Anlegen der Pins neu anfahren
      var target = location.hash.length > 1 ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
      if (target && target.id !== 'top') {
        var y = target.getBoundingClientRect().top + window.scrollY - headerOffset() + 1;
        if (lenis) lenis.scrollTo(y, { immediate: true, force: true }); else window.scrollTo(0, y);
      }
    };
    var run = function () {
      var job = queue.shift();
      if (!job) { finish(); return; }
      safe(job[0], job[1]);
      idle(run);
    };
    var started = false;
    var kickoff = function () { if (started) return; started = true; requestAnimationFrame(function () { setTimeout(run, 0); }); };
    if (doc.classList.contains('hero-in')) kickoff();
    else { doc.addEventListener('lindner:hero', kickoff, { once: true }); setTimeout(kickoff, 1600); }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
