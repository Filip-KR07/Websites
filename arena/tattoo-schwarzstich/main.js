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

  /* ---------- Etappenstart: alles unterhalb des ersten Bildschirms in kleinen Häppchen ---------- */
  var laterQ = [], laterBusy = false;
  function later(fn) { laterQ.push(fn); if (!laterBusy) { laterBusy = true; setTimeout(runLater, 60); } }
  function runLater() {
    var t0 = performance.now();
    while (laterQ.length && performance.now() - t0 < 18) { try { laterQ.shift()(); } catch (e) { if (window.console) console.warn(e); } }
    if (laterQ.length) { (window.requestIdleCallback || setTimeout)(runLater, window.requestIdleCallback ? { timeout: 120 } : 16); }
    else { laterBusy = false; if (hasGsap) ScrollTrigger.refresh(); }
  }

  /* ---------- Hero: Tinte breitet sich im Wasser aus (WebGL, ohne Bibliothek) ----------
     Rendert bewusst in halber Auflösung (weiche Tinte braucht keine Schärfe), DPR ≤ 2.
     Volle Bildrate nur während des Einlaufs, beim Rühren mit dem Zeiger und beim Scrollen,
     sonst gedrosselte Drift mit ~15 fps; außerhalb des Viewports und bei verdecktem Tab Stillstand. */
  var INK = {
    renderScale: 0.5,      // Anteil der CSS-Auflösung (Handy 0,4)
    introSec: 6,           // so lange läuft die Tinte mit voller Bildrate aus
    idleFps: 15,           // Drift danach
    growSec: 2.4,          // Zeitkonstante der Ausbreitung
    spreadPortrait: 0.5    // Hochformat: Tinte bleibt im oberen Teil, Text unten bleibt auf Papier
  };
  var inkGL = (function () {
    var hero = $('.hero'), cv = $('.hero-ink');
    if (!hero || !cv) return null;
    var gl = null;
    try { gl = cv.getContext('webgl', { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'low-power' }); } catch (e) { gl = null; }
    if (!gl) return null;
    var FS = [
      'precision mediump float;',
      'uniform vec2 uRes; uniform float uT; uniform vec2 uSrc; uniform vec3 uM; uniform float uGrow; uniform float uFlood; uniform float uSpread;',
      'float h(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}',
      'float n(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1.,0.)),u.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),u.x),u.y);}',
      'float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p=mat2(1.6,1.2,-1.2,1.6)*p;a*=.5;}return v;}',
      'void main(){',
      ' vec2 uv=gl_FragCoord.xy/uRes.y;',
      ' vec2 p=uv-uSrc/uRes.y;',
      ' vec2 m=uv-uM.xy/uRes.y; float md=exp(-dot(m,m)*26.);',
      ' p+=vec2(-m.y,m.x)*md*uM.z;',
      ' float t=uT;',
      ' vec2 q=vec2(fbm(p*1.7+vec2(0.,-t*.07)),fbm(p*1.7+vec2(5.2,1.3)+t*.05));',
      ' vec2 r=vec2(fbm(p*2.5+3.3*q+vec2(1.7,9.2)+t*.03),fbm(p*2.5+3.3*q+vec2(8.3,2.8)-t*.035));',
      ' float f=fbm(p*2.1+2.7*r);',
      ' vec2 e=vec2(p.x*1.25,(p.y-uGrow*.2)*.72);',
      ' float rad=(.05+uGrow*.78)*uSpread+uFlood*2.4;',
      ' float env=1.-smoothstep(rad*.2,rad,length(e)+(f-.5)*.8);',
      ' float ink=smoothstep(.6,.7,env*(.5+f)+uFlood*.5);',
      ' float rg=1.-abs(2.*fbm(p*3.6+2.8*r)-1.);',
      ' float fil=pow(rg,9.)*smoothstep(.0,.55,env)*.95;',
      ' float a=clamp(ink+fil,0.,1.);',
      ' vec3 col=mix(vec3(.91,.886,.839),vec3(.043),a);',
      ' float rw=pow(1.-abs(2.*fbm(p*3.+2.*q+7.)-1.),16.)*smoothstep(.1,.6,env)*(1.-uFlood);',
      ' float drop=exp(-dot(p,p)*260.)*(1.-uGrow);',
      ' col=mix(col,vec3(.70,.07,.106),clamp(rw*.9+drop,0.,1.)*(1.-a*.85));',
      ' col+=(h(gl_FragCoord.xy+fract(t*7.)*91.)-.5)*.045;',
      ' gl_FragColor=vec4(col,1.);',
      '}'
    ].join('\n');
    function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; }
    var vs = sh(gl.VERTEX_SHADER, 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}'), fs = sh(gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) return null;
    var pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null;
    gl.useProgram(pr);
    var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var U = {}; ['uRes', 'uT', 'uSrc', 'uM', 'uGrow', 'uFlood', 'uSpread'].forEach(function (k) { U[k] = gl.getUniformLocation(pr, k); });

    var W = 0, H = 0, k = 1, src = { x: 0, y: 0 }, flood = 0, t0 = performance.now(), visible = true, raf = 0, idleT = 0, lastStir = -1e9;
    var mouse = { x: -999, y: -999, s: 0, ts: 0 };
    var tip = $('.dagger');
    function size() {
      var r = hero.getBoundingClientRect();
      var scale = window.innerWidth < 900 ? 0.4 : INK.renderScale;
      k = Math.min(window.devicePixelRatio || 1, 2) * scale;
      W = Math.max(2, Math.round(r.width * k)); H = Math.max(2, Math.round(r.height * k));
      cv.width = W; cv.height = H; gl.viewport(0, 0, W, H);
      // Quelle der Tinte: die Klingenspitze des Dolchs (SVG-Punkt 200/760)
      if (tip && tip.getScreenCTM) {
        var m = tip.getScreenCTM(), pt = tip.createSVGPoint(); pt.x = 200; pt.y = 760;
        var s = pt.matrixTransform(m);
        src.x = (s.x - r.left) * k; src.y = H - (s.y - r.top) * k;
      } else { src.x = W * 0.72; src.y = H * 0.12; }
    }
    function draw(now) {
      var t = animate ? (now - t0) / 1000 : 14;
      var grow = 1 - Math.exp(-t / INK.growSec);
      mouse.s += (mouse.ts - mouse.s) * 0.08; mouse.ts *= 0.94;
      gl.uniform2f(U.uRes, W, H); gl.uniform1f(U.uT, t + 3.0); gl.uniform2f(U.uSrc, src.x, src.y);
      gl.uniform3f(U.uM, mouse.x, mouse.y, mouse.s); gl.uniform1f(U.uGrow, grow); gl.uniform1f(U.uFlood, flood); gl.uniform1f(U.uSpread, W / H < 0.8 ? INK.spreadPortrait : 1);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      return t;
    }
    function frame(now) {
      raf = 0;
      if (!visible || document.hidden) return;
      var t = draw(now);
      if (!animate) return;
      if (t < INK.introSec || now - lastStir < 1600 || mouse.s > 0.01) raf = requestAnimationFrame(frame);
      else idleT = setTimeout(function () { idleT = 0; if (!raf) raf = requestAnimationFrame(frame); }, 1000 / INK.idleFps);
    }
    function kick() { if (idleT) { clearTimeout(idleT); idleT = 0; } if (!raf) raf = requestAnimationFrame(frame); }
    size();
    draw(performance.now());
    cv.classList.add('is-live');
    if (animate) kick();
    window.addEventListener('resize', function () { size(); kick(); if (!animate) draw(performance.now()); });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) kick(); }).observe(hero);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) kick(); });
    if (animate && finePointer) {
      var lx = 0, ly = 0;
      hero.addEventListener('pointermove', function (e) {
        var r = hero.getBoundingClientRect();
        var x = (e.clientX - r.left) * k, y = H - (e.clientY - r.top) * k;
        var v = Math.hypot(e.clientX - lx, e.clientY - ly); lx = e.clientX; ly = e.clientY;
        mouse.x = x; mouse.y = y; mouse.ts = Math.min(1.1, mouse.ts + v * 0.012);
        lastStir = performance.now(); kick();
      });
    }
    return {
      flood: function (p) { var f = clamp((p - 0.18) / 0.62, 0, 1); f = f * f * (3 - 2 * f); if (Math.abs(f - flood) > 0.002) { flood = f; if (animate) kick(); else draw(performance.now()); } },
      resize: function () { size(); kick(); }
    };
  })();

  /* ---------- Hero: Der Dolch wird Stich für Stich gezogen, die Nadel läuft mit ---------- */
  (function daggerDraw() {
    var svg = $('.dagger'), dot = $('.needle-dot'), hero = $('.hero');
    if (!svg) return;
    if (!animate) { svg.classList.add('is-drawn'); return; }
    var paths = $$('.ln', svg);
    var lens = paths.map(function (p) { try { return p.getTotalLength(); } catch (e) { return 100; } });
    var total = lens.reduce(function (a, b) { return a + b; }, 0) || 1;
    var DUR = 2600, DELAY = 300, STITCHES = 150, t0 = performance.now();
    function step(now) {
      var k = clamp((now - t0 - DELAY) / DUR, 0, 1);
      k = Math.floor(k * STITCHES) / STITCHES;          // die Nadel springt in Stichen, nicht stufenlos
      var e = 1 - Math.pow(1 - k, 1.6);
      var at = e * total, acc = 0, active = -1;
      for (var i = 0; i < paths.length; i++) {
        var local = clamp((at - acc) / lens[i], 0, 1);
        paths[i].style.strokeDashoffset = String(1 - local);
        if (local > 0 && local < 1 && active < 0) active = i;
        acc += lens[i];
      }
      if (dot && active > -1) {
        var p = paths[active], l = clamp((at - (acc = lens.slice(0, active).reduce(function (a, b) { return a + b; }, 0))) / lens[active], 0, 1);
        var pt = p.getPointAtLength(l * lens[active]).matrixTransform(svg.getScreenCTM());
        var r = hero.getBoundingClientRect();
        dot.style.opacity = '1';
        dot.style.transform = 'translate3d(' + (pt.x - r.left).toFixed(1) + 'px,' + (pt.y - r.top).toFixed(1) + 'px,0)';
      }
      if (k < 1) requestAnimationFrame(step);
      else {
        svg.classList.add('is-drawn');
        paths.forEach(function (p) { p.style.strokeDasharray = 'none'; p.style.strokeDashoffset = '0'; });
        if (dot) { dot.style.transition = 'opacity 400ms ease'; dot.style.opacity = '0'; }
      }
    }
    requestAnimationFrame(step);
  })();

  /* ---------- Manifest: Der Text wird Zeichen für Zeichen gestochen (Scroll-Scrub) ---------- */
  later(function stitchText() {
    var el = $('[data-stitch]');
    if (!el || !animate || !hasGsap) return;
    var text = el.textContent.trim();
    el.textContent = '';
    var sr = document.createElement('span'); sr.className = 'visually-hidden'; sr.textContent = text; el.appendChild(sr);
    var vis = document.createElement('span'); vis.setAttribute('aria-hidden', 'true'); el.appendChild(vis);
    var chars = [];
    text.split(/\s+/).forEach(function (w, i, arr) {
      var ws = document.createElement('span'); ws.className = 'mt-w';
      for (var j = 0; j < w.length; j++) { var c = document.createElement('span'); c.className = 'mt-c'; c.textContent = w[j]; ws.appendChild(c); chars.push(c); }
      vis.appendChild(ws); if (i < arr.length - 1) vis.appendChild(document.createTextNode(' '));
    });
    var needle = document.createElement('span'); needle.className = 'stitch-needle'; needle.setAttribute('aria-hidden', 'true'); el.appendChild(needle);
    root.classList.add('stitch-on');
    var pos = [], shown = 0;
    function measure() { pos = chars.map(function (c) { return [c.offsetLeft + c.offsetWidth + 2, c.offsetTop + c.offsetHeight * 0.1]; }); }
    measure();
    ScrollTrigger.create({
      trigger: el, start: 'top 80%', end: 'bottom 45%',
      onRefresh: measure,
      onUpdate: function (self) {
        var n = Math.round(self.progress * chars.length), i;
        if (n > shown) for (i = shown; i < n; i++) chars[i].classList.add('on');
        else for (i = n; i < shown; i++) chars[i].classList.remove('on');
        shown = n;
        var p = pos[Math.max(0, n - 1)] || [0, 0];
        needle.style.transform = 'translate3d(' + p[0] + 'px,' + p[1] + 'px,0)';
        needle.classList.toggle('is-on', n > 0 && n < chars.length);
      }
    });
  });

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

  /* ---------- Stile: Die Körperkarte klebt, jede Stil-Zeile setzt ihre Stellen darauf ---------- */
  later(function bodyMap() {
    var rows = $$('.style-row'), map = $('.body-map');
    if (!rows.length || !map || !('IntersectionObserver' in window)) return;
    var spots = $$('.bm-spot', map), imgs = $$('.bm-img', map), nm = $('.bm-name', map), wh = $('.bm-where', map);
    var cur = null;
    function set(row) {
      if (row === cur) return;
      if (cur) cur.classList.remove('is-active');
      cur = row; row.classList.add('is-active');
      var k = row.dataset.style;
      spots.forEach(function (g) { g.classList.toggle('on', g.dataset.for === k); });
      imgs.forEach(function (im) { im.classList.toggle('on', im.dataset.for === k); });
      if (nm) nm.textContent = row.querySelector('.style-name').textContent;
      if (wh) wh.textContent = row.querySelector('.style-where').textContent.replace(/^Sitzt gut:\s*/, '');
    }
    root.classList.add('styles-live');
    set(rows[0]);
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) set(en.target); });
    }, { rootMargin: '-46% 0px -46% 0px' });
    rows.forEach(function (r) { io.observe(r); });
  });

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

  /* ---------- Flash-Wand: Motive werden gestochen, Lupe zoomt beim Überfahren ---------- */
  later(function flashWall() {
    var sheet = $('.sheet');
    if (!sheet) return;
    var cards = $$('.flash-card', sheet);
    if (animate && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-drawn'); io.unobserve(en.target); } });
      }, { threshold: 0.3 });
      cards.forEach(function (c, i) { c.style.setProperty('--fd', (i % 3) * 90 + 'ms'); io.observe(c); });
    } else cards.forEach(function (c) { c.classList.add('is-drawn'); });

    if (!finePointer) return;
    var lens = $('.flash-lens', sheet), art = $('.lens-art', sheet), use = art && art.querySelector('use');
    if (!lens || !use) return;
    sheet.classList.add('has-lens');
    var ZOOM = 2.4;                       // Vergrößerung der Lupe
    var cur = { x: 0, y: 0 }, tgt = { x: 0, y: 0 }, box = { x: 0, y: 0 }, raf = 0, active = null;
    function place() {
      var R = lens.offsetWidth / 2;
      lens.style.transform = 'translate3d(' + cur.x.toFixed(1) + 'px,' + cur.y.toFixed(1) + 'px,0)';
      art.style.transform = 'translate3d(' + (R - (cur.x - box.x) * ZOOM).toFixed(1) + 'px,' + (R - (cur.y - box.y) * ZOOM).toFixed(1) + 'px,0)';
    }
    function loop() {
      var f = animate ? 0.3 : 1;
      cur.x += (tgt.x - cur.x) * f; cur.y += (tgt.y - cur.y) * f;
      place();
      raf = (Math.abs(tgt.x - cur.x) > 0.2 || Math.abs(tgt.y - cur.y) > 0.2) ? requestAnimationFrame(loop) : 0;
    }
    function off() { sheet.classList.remove('lens-on'); active = null; }
    sheet.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
      var card = e.target.closest('.flash-card'), svg = card && !e.target.closest('button') && card.querySelector('.flash-art');
      if (!svg) return off();
      var ar = svg.getBoundingClientRect(), sr = sheet.getBoundingClientRect();
      if (e.clientX < ar.left || e.clientX > ar.right || e.clientY < ar.top || e.clientY > ar.bottom) return off();
      if (active !== card) {
        active = card;
        use.setAttribute('href', svg.querySelector('use').getAttribute('href'));
        art.style.width = (ar.width * ZOOM) + 'px'; art.style.height = (ar.height * ZOOM) + 'px';
        box.x = ar.left - sr.left; box.y = ar.top - sr.top;
      }
      tgt.x = e.clientX - sr.left; tgt.y = e.clientY - sr.top;
      if (!sheet.classList.contains('lens-on')) { cur.x = tgt.x; cur.y = tgt.y; place(); sheet.classList.add('lens-on'); }
      if (!raf) raf = requestAnimationFrame(loop);
    });
    sheet.addEventListener('pointerleave', off);
  });

  /* ---------- Magnetische Buttons (nur feiner Zeiger) ---------- */
  later(function magnets() {
    if (!finePointer || !animate) return;
    $$('[data-magnetic]').forEach(function (el) {
      var x = 0, y = 0, tx = 0, ty = 0, raf = 0;
      function loop() {
        x += (tx - x) * 0.2; y += (ty - y) * 0.2;
        el.style.translate = x.toFixed(2) + 'px ' + y.toFixed(2) + 'px';
        raf = (Math.abs(tx - x) > 0.05 || Math.abs(ty - y) > 0.05) ? requestAnimationFrame(loop) : 0;
      }
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        tx = (e.clientX - (r.left + r.width / 2)) * 0.22; ty = (e.clientY - (r.top + r.height / 2)) * 0.32;
        if (!raf) raf = requestAnimationFrame(loop);
      });
      el.addEventListener('pointerleave', function () { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(loop); });
    });
  });

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

  /* ---------- Pflege: heilende Haut (Rötung, Folie, Schuppen, Silberhaut) ---------- */
  var skin = (function () {
    var svg = $('.skin-svg');
    if (!svg) return null;
    var red = $('.sk-red', svg), film = $$('.sk-film', svg), flakes = $('.sk-flakes', svg), silver = $('.sk-silver', svg), tat = $('.sk-tattoo', svg), state = $('#skin-state');
    var last = -1;
    function bell(x, c, w) { return Math.max(0, 1 - Math.abs(x - c) / w); }
    return function (d) {
      d = Math.max(0, Math.min(60, d));
      var r = Math.round(d * 2) / 2;
      if (r === last) return; last = r;
      red.style.opacity = clamp(d <= 2 ? 0.9 : 0.9 - (d - 2) * 0.15, 0, 0.9).toFixed(2);
      film.forEach(function (f) { f.style.opacity = clamp(1 - d * 0.8, 0, 1).toFixed(2); });
      flakes.style.opacity = bell(d, 11, 5).toFixed(2);
      silver.style.opacity = (bell(d, 20, 11) * 0.55).toFixed(2);
      tat.style.transform = 'scale(' + (1 + 0.045 * clamp(1 - d / 4, 0, 1)).toFixed(3) + ')';
      if (state) state.textContent = d < 1 ? 'Frisch gestochen, unter Folie' : d < 4 ? 'Gerötet, nässt leicht' : d < 8 ? 'Spannt und juckt' : d < 15 ? 'Schält sich' : d < 29 ? 'Silberhaut, leicht milchig' : d < 45 ? 'Ausgeheilt' : 'Verheilt. Sonnenschutz bleibt.';
    };
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
      if (skin && (e || !careRail)) { skin(d); var bg = $('#care-big'); if (bg) bg.textContent = d >= 45 ? '45+' : String(d); }
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
    if (skin && 'IntersectionObserver' in window) {
      var cio = new IntersectionObserver(function (es) {
        if (careRail) return;
        es.forEach(function (en) {
          if (!en.isIntersecting) return;
          var c = en.target, d = +c.dataset.from;
          skin(d); var bg = $('#care-big'); if (bg) bg.textContent = d >= 45 ? '∞' : String(d);
        });
      }, { rootMargin: '-40% 0px -50% 0px' });
      careCards.forEach(function (c) { cio.observe(c); });
    }
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
    var groups = [['.manifest-notes li', 80], ['.artist', 70], ['.quote', 70], ['.steps li', 50], ['.care-head .care-tool', 0]];
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
      // Hero: Dolch steigt, Name sinkt – die Tinte flutet das Blatt (siehe unten)
      gsap.to('.hero-dagger', { y: -90, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
      gsap.to('.ht-word', { y: 60, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
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
            if (skin) skin(r.day >= 45 ? 50 : r.day);
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
    // Kapitelwechsel: Beim Verlassen des Bogens läuft die Tinte über das ganze Blatt
    if (inkGL) ScrollTrigger.create({ trigger: '.hero', start: 'top top', end: 'bottom top', onUpdate: function (self) { inkGL.flood(self.progress); } });
    window.addEventListener('load', function () { ScrollTrigger.refresh(); if (inkGL) inkGL.resize(); });
  }

  window.__inkReady = true;
})();
