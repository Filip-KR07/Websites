/* ==========================================================================
   Lichtwerk – Hochzeitsfotografie (Demo, Modell „Silber“)
   Entwicklungsbad-Hero (WebGL), Galerie + Lightbox, Love-Story-Strecke,
   Paket-Konfigurator, Verfügbarkeits-Check, Stimmen, Anfrageformular.
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
     Konstanten – hier anpassen (alle Preise in Euro inkl. 19 % USt.)
     Die Rechnung ist eine unverbindliche Beispielrechnung.
     ------------------------------------------------------------------ */
  var PREISE = {
    grundpauschale: 450,          // Vorgespräch, Planung, Bildauswahl & Bearbeitung, Online-Galerie
    proStunde: 240,               // Begleitung durch die Fotografin, je Stunde
    secondShooterProStunde: 95,   // Zweite Kamera (Tom Richter), je Stunde der Begleitung
    verlobung: 290,               // Verlobungsshooting, ca. 90 Minuten
    alben: { keins: 0, fineart: 690, eltern: 1050 } // Album-Optionen
  };
  var ALBUM_TEXT = { keins: 'Nur digital', fineart: 'Fine-Art-Album 30×30', eltern: 'Album + 2 Elternalben' };
  var BILDER_PRO_STUNDE = [70, 90];   // Faustregel für die Bildanzahl
  var SECOND_SHOOTER_FAKTOR = 1.33;   // ca. ein Drittel mehr Bilder mit zweiter Kamera

  /* Verfügbarkeit (Demo-Daten): Wahrscheinlichkeiten [belegt, angefragt] je Tagestyp */
  var VERFUEGBARKEIT = {
    monateVoraus: 18,
    saisonMonate: [5, 6, 7, 8, 9],          // Mai bis September
    saison: { sa: [0.52, 0.22], fr: [0.22, 0.14], so: [0.12, 0.10], werktag: [0.03, 0.04] },
    nebensaison: { sa: [0.15, 0.12], sonst: [0.02, 0.03] }
  };

  /* Entwicklungsbad: Dauer der Animation in Millisekunden */
  var ENTWICKLUNG_MS = 4800;

  /* ------------------------------------------------------------------
     Grundlagen
     ------------------------------------------------------------------ */
  var root = document.documentElement;
  var OFF = root.classList.contains('motion-off');
  var REDUCED = root.classList.contains('reduced');
  var MOTION = !OFF && !REDUCED;
  var hasGSAP = !!(window.gsap && window.ScrollTrigger);
  var lenis = null;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function pad(n, l) { return String(n).padStart(l || 2, '0'); }
  var nf = new Intl.NumberFormat('de-DE');
  function euro(n) { return nf.format(Math.round(n)) + ' €'; }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function headerH() { var h = $('[data-header]'); return h ? h.offsetHeight : 0; }

  /* ------------------------------------------------------------------
     Smooth Scroll (Lenis) + ScrollTrigger
     ------------------------------------------------------------------ */
  function initScroll() {
    if (hasGSAP) gsap.registerPlugin(ScrollTrigger);
    if (MOTION && window.Lenis) {
      lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true, anchors: false });
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

  function scrollToTarget(target, opts) {
    opts = opts || {};
    var focusEl = opts.focus || target;
    var done = function () {
      if (!focusEl.hasAttribute('tabindex') && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(focusEl.tagName)) focusEl.setAttribute('tabindex', '-1');
      focusEl.focus({ preventScroll: true });
    };
    if (lenis) {
      lenis.scrollTo(target, { offset: -headerH() + 1, duration: 1.3, easing: function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }, onComplete: done });
    } else {
      var y = target.getBoundingClientRect().top + window.pageYOffset - headerH() + 1;
      window.scrollTo({ top: y, behavior: MOTION ? 'smooth' : 'auto' });
      setTimeout(done, MOTION ? 700 : 0);
    }
  }

  /* ------------------------------------------------------------------
     Header: Zustand, Fortschritt, aktiver Abschnitt, Aktionsleiste
     ------------------------------------------------------------------ */
  function initHeader() {
    var header = $('[data-header]');
    var bar = $('[data-progress]');
    var action = $('.action-bar');
    var contact = $('#anfrage');
    var ticking = false;
    var darks = $$('.story, .contact, .site-footer');
    function update() {
      ticking = false;
      var y = window.pageYOffset;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      header.classList.toggle('is-scrolled', y > 12);
      var line = header.offsetHeight * 0.5, dark = false;
      for (var i = 0; i < darks.length; i++) { var r = darks[i].getBoundingClientRect(); if (r.top <= line && r.bottom >= line) { dark = true; break; } }
      header.classList.toggle('is-dark', dark);
      if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? clamp(y / max, 0, 1) : 0).toFixed(4) + ')';
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();

    // Aktiver Navigationspunkt
    var links = $$('.main-nav a');
    var map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          var a = map[en.target.id];
          if (!a) return;
          if (en.isIntersecting) { links.forEach(function (l) { l.classList.remove('is-current'); }); a.classList.add('is-current'); }
          else a.classList.remove('is-current');
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });

      // Aktionsleiste im Kontaktbereich ausblenden (sie würde die Formular-Buttons verdecken)
      if (action && contact) {
        new IntersectionObserver(function (en) { action.classList.toggle('is-hidden', en[0].isIntersecting); }, { rootMargin: '0px 0px -30% 0px' }).observe(contact);
      }
    }
  }

  /* ------------------------------------------------------------------
     Mobiles Menü (Dialog mit Fokusführung)
     ------------------------------------------------------------------ */
  function initMenu() {
    var menu = $('[data-menu]');
    var openBtn = $('[data-menu-open]');
    var closeBtn = $('[data-menu-close]');
    if (!menu || !openBtn) return;
    $$('.menu-list li', menu).forEach(function (li, i) { li.style.setProperty('--i', i); });
    function focusables() { return $$('a[href], button:not([disabled])', menu); }
    function open() {
      menu.hidden = false;
      menu.classList.remove('is-closing');
      menu.classList.add('is-open');
      openBtn.setAttribute('aria-expanded', 'true');
      root.style.overflow = 'hidden';
      if (lenis) lenis.stop();
      setTimeout(function () { closeBtn.focus(); }, 30);
      document.addEventListener('keydown', onKey);
    }
    function close(restore) {
      openBtn.setAttribute('aria-expanded', 'false');
      document.removeEventListener('keydown', onKey);
      root.style.overflow = '';
      if (lenis) lenis.start();
      var finish = function () { menu.hidden = true; menu.classList.remove('is-open', 'is-closing'); };
      if (MOTION) { menu.classList.add('is-closing'); setTimeout(finish, 200); } else finish();
      if (restore !== false) openBtn.focus();
    }
    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key !== 'Tab') return;
      var f = focusables(); var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    openBtn.addEventListener('click', open);
    closeBtn.addEventListener('click', function () { close(); });
    $$('a[href^="#"]', menu).forEach(function (a) { a.addEventListener('click', function () { close(false); }); });
    window.addEventListener('resize', function () { if (!menu.hidden && window.innerWidth >= 900) close(false); });
  }

  /* ------------------------------------------------------------------
     Hero: Entwicklungsbad (WebGL) – Schwarz → Negativ → Positiv + Filmkorn
     ------------------------------------------------------------------ */
  var VERT = 'attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
  var FRAG = [
    'precision mediump float;',
    'uniform sampler2D uTex;uniform sampler2D uNoise;uniform float uP;uniform float uT;uniform vec2 uScale;uniform vec2 uRes;',
    'varying vec2 v;',
    'float h(vec2 q){q=fract(q*vec2(123.34,456.21));q+=dot(q,q+45.32);return fract(q.x*q.y);}',
    'void main(){',
    '  vec2 uv=(v-.5)*uScale+.5;',
    '  vec3 c=texture2D(uTex,uv).rgb;',
    '  float l=dot(c,vec3(.299,.587,.114));',
    // Negativ mit orangefarbener Filmmaske
    '  vec3 neg=(1.-c)*vec3(.98,.74,.56)+vec3(.02,.0,-.02);',
    // Phase 1: aus Schwarz entsteht das Negativ – zuerst die dichten Stellen
    '  float a=smoothstep(.0,.36,uP);',
    '  float em=smoothstep(.0,1.,a*1.35-(1.-l)*.35);',
    '  vec3 negShow=neg*em;',
    // Phase 2: Entwicklerwelle kippt das Negativ zum Positiv
    // Entwicklerwelle: fbm-Rauschen kommt vorberechnet aus einer kleinen Textur (statt 64 Hashes pro Pixel)
    '  float f=v.x*.42+(1.-v.y)*.38+texture2D(uNoise,v).r*.42;',
    '  float front=mix(-.2,1.32,smoothstep(.34,.80,uP));',
    '  float pos=1.-smoothstep(front-.07,front+.07,f);',
    '  float edge=1.-clamp(abs(f-front)/.07,0.,1.);',
    // Phase 3: Kontrast und Sättigung setzen sich
    '  float k=smoothstep(.62,1.,uP);',
    '  vec3 g=vec3(l);',
    '  vec3 p=mix(mix(g,c,.35)*.82+.1,c,k);',
    '  vec3 col=mix(negShow,p,pos);',
    '  col+=edge*.08*vec3(1.,.9,.86)*step(.001,uP)*(1.-k);',
    // Rotlicht der Dunkelkammer am Anfang
    '  col+=vec3(.10,.012,.008)*(1.-a)*(1.-length(v-.5)*1.3);',
    // Vignette und Filmkorn
    '  col*=mix(.86,1.,smoothstep(.95,.3,length(v-.5)));',
    '  float gr=h(v*uRes+fract(uT*7.13)*vec2(71.,113.))-.5;',
    '  float ga=mix(.11,.055,k)*(.6+.8*l*(1.-l)*2.);',
    '  col+=gr*ga;',
    '  gl_FragColor=vec4(clamp(col,0.,1.),1.);',
    '}'
  ].join('\n');

  function initHero() {
    var hero = $('.hero');
    var frame = $('[data-dev-frame]');
    var img = $('[data-dev-img]');
    var canvas = $('[data-dev-canvas]');
    var steps = $$('.darkroom-steps li');
    var timeEl = $('[data-dev-time]');
    var replay = $('[data-dev-replay]');
    var glow = $('.hero-glow');
    var print = $('.hero-print');
    if (!frame || !img) return;

    // Fettstift-Markierung: Pfad in echten Pixeln aufbauen, damit Strichstärke und
    // Zeichen-Animation (stroke-dashoffset) bei jedem Seitenverhältnis stimmen.
    var mark = $('.hero-mark'), markPath = mark && $('path', mark);
    var MK = [[7, 8.5], [31, 1.5, 72, 2.5, 97.5, 5.5], [99.6, 30, 99.2, 72, 96.8, 95.5], [72, 99.6, 28, 98.8, 3.8, 95.8], [1, 72, .4, 32, 3.2, 6.5], [5, 2.2, 13, .6, 24, 2.8]];
    var fitMark = function () {
      if (!markPath) return;
      var w = mark.clientWidth || mark.getBoundingClientRect().width, h = mark.clientHeight || mark.getBoundingClientRect().height;
      if (!w || !h) return;
      var d = MK.map(function (seg, i) {
        return (i ? 'C' : 'M') + seg.map(function (v, k) { return (k % 2 ? v * h / 100 : v * w / 100).toFixed(1); }).join(' ');
      }).join('');
      mark.setAttribute('viewBox', '0 0 ' + w.toFixed(1) + ' ' + h.toFixed(1));
      markPath.removeAttribute('vector-effect');
      markPath.removeAttribute('pathLength');
      markPath.setAttribute('d', d);
      var len = Math.ceil(markPath.getTotalLength()) + 2;
      markPath.style.strokeDasharray = len;
      markPath.style.setProperty('--len', len);
      mark.classList.add('is-fit');
    };
    fitMark();
    if (mark && 'ResizeObserver' in window) new ResizeObserver(fitMark).observe(mark.parentNode);

    // Text-Einstieg
    $$('[data-hero-in]').forEach(function (n, i) { n.style.setProperty('--d', (i * 90) + 'ms'); });
    var ready = function () { hero.classList.add('is-ready'); };
    if (document.fonts && document.fonts.ready) {
      var t = setTimeout(ready, 700);
      document.fonts.ready.then(function () { clearTimeout(t); requestAnimationFrame(ready); });
    } else ready();

    var progress = MOTION ? 0 : 1;
    var playing = false, startT = 0, raf = 0, visible = true;
    var setStepUI = function (p) {
      var idx = p >= 1 ? 3 : p < 0.5 ? 0 : p < 0.74 ? 1 : 2;
      steps.forEach(function (li, i) {
        li.classList.toggle('is-active', i === idx);
        li.classList.toggle('is-done', i < idx);
      });
      if (timeEl) { var s = Math.round(p * 150); timeEl.textContent = pad(Math.floor(s / 60)) + ':' + pad(s % 60); }
      if (glow) glow.style.opacity = (0.95 - 0.6 * p).toFixed(3);
      if (replay) replay.disabled = p < 1;
      if (print) print.classList.toggle('is-developed', p >= 1);
    };

    // Ohne Bewegung (reduced motion / ?motion=off) bleibt das fertige Foto mit CSS-Korn stehen –
    // kein WebGL-Kontext, keine Shader-Kompilierung.
    if (!MOTION) { setStepUI(1); return; }

    // --- WebGL ---
    var gl = null, prog = null, U = {}, texReady = false;
    try { gl = canvas.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false, preserveDrawingBuffer: false }); } catch (e) { gl = null; }

    if (!gl) {
      // Rückfall: CSS-Filter-Entwicklung
      if (MOTION) {
        frame.classList.add('css-dev');
        var t0 = performance.now();
        (function tick(now) { var p = clamp((now - t0 - 300) / ENTWICKLUNG_MS, 0, 1); setStepUI(p); if (p < 1) requestAnimationFrame(tick); })(t0);
        if (replay) replay.addEventListener('click', function () { frame.classList.remove('css-dev'); void frame.offsetWidth; frame.classList.add('css-dev'); var t1 = performance.now(); (function tick(now) { var p = clamp((now - t1 - 300) / ENTWICKLUNG_MS, 0, 1); setStepUI(p); if (p < 1) requestAnimationFrame(tick); })(t1); });
      } else setStepUI(1);
      return;
    }

    function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; }
    prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { setStepUI(1); return; }
    gl.useProgram(prog);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    ['uTex', 'uNoise', 'uP', 'uT', 'uScale', 'uRes'].forEach(function (k) { U[k] = gl.getUniformLocation(prog, k); });
    var tex = gl.createTexture();

    // Entwicklerwelle: fbm-Rauschen einmalig als kleine Textur (Einheit 1) statt 64 Hash-Aufrufen je Pixel und Bild
    (function noiseTex() {
      var N = 128, L = 16, lat = new Float32Array(L * L), seed = 7;
      for (var i = 0; i < lat.length; i++) { seed = (seed * 16807) % 2147483647; lat[i] = seed / 2147483647; }
      var vn = function (x, y) {
        var xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
        var ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
        var g = function (a, b) { return lat[((b % L + L) % L) * L + ((a % L + L) % L)]; };
        var a = g(xi, yi), b = g(xi + 1, yi), c = g(xi, yi + 1), d = g(xi + 1, yi + 1);
        return (a + (b - a) * ux) + ((c + (d - c) * ux) - (a + (b - a) * ux)) * uy;
      };
      var data = new Uint8Array(N * N);
      for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
        var qx = x / N * 3.2, qy = y / N * 2.4, s = 0, amp = 0.5;
        for (var o = 0; o < 4; o++) { s += amp * vn(qx, qy); qx *= 2.03; qy *= 2.03; amp *= 0.5; }
        data[y * N + x] = Math.round(clamp(s, 0, 1) * 255);
      }
      var nt = gl.createTexture();
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, nt);
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, N, N, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, data);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.uniform1i(U.uNoise, 1);
      gl.activeTexture(gl.TEXTURE0);
    })();
    var imgAR = 1.5;

    function size() {
      var r = frame.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = Math.max(2, Math.round(r.width * dpr)), h = Math.max(2, Math.round(r.height * dpr));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      gl.viewport(0, 0, w, h);
      var cAR = w / h;
      gl.uniform2f(U.uScale, Math.min(1, cAR / imgAR), Math.min(1, imgAR / cAR));
      gl.uniform2f(U.uRes, w, h);
    }

    function draw(now) {
      if (!texReady) return;
      gl.uniform1f(U.uP, progress);
      gl.uniform1f(U.uT, (now || performance.now()) / 1000);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

    function loop(now) {
      raf = 0;
      if (!visible || document.hidden) return;
      if (playing) {
        var raw = clamp((now - startT - 350) / ENTWICKLUNG_MS, 0, 1);
        progress = ease(raw);
        setStepUI(raw);
        draw(now);
        if (raw >= 1) playing = false;
        raf = requestAnimationFrame(loop);
        return;
      }
      // Nach der Entwicklung steht das Bild still: Das lebendige Korn liefert die
      // CSS-Ebene (.grain--live, nur Compositor) – kein Dauer-Neuzeichnen per WebGL.
    }
    function kick() { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(loop); }

    function develop() {
      if (!MOTION) { progress = 1; setStepUI(1); draw(); return; }
      progress = 0; startT = performance.now(); playing = true; setStepUI(0); kick();
    }

    var source = new Image();
    source.decoding = 'async';
    source.onload = function () {
      imgAR = source.naturalWidth / source.naturalHeight;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, source);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.uniform1i(U.uTex, 0);
      texReady = true;
      size();
      if (MOTION) gl.uniform1f(U.uP, 0);
      draw();
      frame.classList.add('has-gl');
      develop();
    };
    source.onerror = function () { setStepUI(1); };
    var pick = function () { source.src = img.currentSrc || img.src; };
    if (img.complete && img.naturalWidth) pick(); else img.addEventListener('load', pick, { once: true });

    if ('ResizeObserver' in window) new ResizeObserver(function () { if (texReady) { size(); draw(); } }).observe(frame);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) kick(); }, { rootMargin: '80px 0px' }).observe(frame);
    }
    document.addEventListener('visibilitychange', function () { if (!document.hidden) kick(); });
    if (replay) replay.addEventListener('click', develop);
    canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); frame.classList.remove('has-gl'); });

    // Sanfte Maus-Parallaxe für den Abzug (Lerp)
    if (MOTION && fine && print) {
      var tx = 0, ty = 0, cx = 0, cy = 0, mrAF = 0;
      var step = function () {
        cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
        print.style.transform = 'translate3d(' + (cx * 10).toFixed(2) + 'px,' + (cy * 8).toFixed(2) + 'px,0)';
        if (glow) glow.style.translate = (cx * -26).toFixed(1) + 'px ' + (cy * -18).toFixed(1) + 'px';
        mrAF = (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) ? requestAnimationFrame(step) : 0;
      };
      hero.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse') return;
        tx = (e.clientX / window.innerWidth - 0.5) * 2; ty = (e.clientY / window.innerHeight - 0.5) * 2;
        if (!mrAF) mrAF = requestAnimationFrame(step);
      });
      hero.addEventListener('pointerleave', function () { tx = 0; ty = 0; if (!mrAF) mrAF = requestAnimationFrame(step); });
    }
  }

  /* ------------------------------------------------------------------
     Reveal-Choreografie
     ------------------------------------------------------------------ */
  var revealIO = null;
  function initReveal() {
    var targets = $$('[data-reveal], .g-item, .story-panel, [data-map]');
    if (!('IntersectionObserver' in window) || OFF) { targets.forEach(function (t) { t.classList.add('is-in'); }); return; }
    revealIO = new IntersectionObserver(function (entries) {
      var batch = entries.filter(function (e) { return e.isIntersecting; });
      batch.forEach(function (en, i) {
        var t = en.target;
        if (!t.style.getPropertyValue('--d') && batch.length > 1) t.style.setProperty('--d', (i * 70) + 'ms');
        t.classList.add('is-in');
        revealIO.unobserve(t);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    targets.forEach(function (t) { revealIO.observe(t); });
  }

  /* Haltung: Wörter leuchten beim Scrollen auf */
  function initStatement() {
    var p = $('[data-words]');
    if (!p) return;
    var words = p.textContent.trim().split(/\s+/);
    p.textContent = '';
    var spans = words.map(function (w, i) {
      var s = el('span', 'w', w);
      p.appendChild(s);
      if (i < words.length - 1) p.appendChild(document.createTextNode(' '));
      return s;
    });
    if (!MOTION) return;
    var lit = -1;
    var setLit = function (n) {
      if (n === lit) return; lit = n;
      spans.forEach(function (s, i) { s.classList.toggle('is-lit', i < n); });
    };
    if (hasGSAP) {
      ScrollTrigger.create({ trigger: p, start: 'top 82%', end: 'bottom 48%', onUpdate: function (self) { setLit(Math.round(self.progress * spans.length)); } });
    } else setLit(spans.length);
  }

  /* ------------------------------------------------------------------
     Galerie: Kapitel-Tabs + Lightbox
     ------------------------------------------------------------------ */
  function initGallery() {
    var tablist = $('.g-tabs');
    var tabs = $$('.g-tab');
    var ink = $('[data-tab-ink]');
    var panel = $('[data-g-panel]');
    var grid = $('[data-g-grid]');
    var items = $$('.g-item', grid);
    var status = $('[data-g-status]');
    if (!tablist || !grid) return;
    var current = 'alle';

    // Justierte Reihen wie auf einem Kontaktbogen: gleiche Höhe je Reihe, volle Breite
    function justify() {
      var W = grid.clientWidth;
      if (!W) return;
      var gap = parseFloat(getComputedStyle(grid).columnGap) || 0;
      var T = W < 600 ? 128 : W < 1000 ? 210 : clamp(W * 0.21, 240, 320);
      var budget = W - 1;
      var rows = [], row = [], sum = 0;
      items.filter(function (it) { return !it.hidden; }).forEach(function (it) {
        var ar = parseFloat(it.style.getPropertyValue('--ar')) || 1.5;
        row.push({ it: it, ar: ar }); sum += ar;
        var h = (budget - gap * (row.length - 1)) / sum;
        if (h > T) return;
        if (row.length > 1) {
          var ps = sum - ar, hp = (budget - gap * (row.length - 2)) / ps;
          if (Math.abs(Math.log(hp / T)) < Math.abs(Math.log(h / T))) {
            rows.push({ r: row.slice(0, -1), h: hp });
            row = [row[row.length - 1]]; sum = ar;
            var h1 = (budget) / sum;
            if (h1 <= T) { rows.push({ r: row, h: h1 }); row = []; sum = 0; }
            return;
          }
        }
        rows.push({ r: row, h: h }); row = []; sum = 0;
      });
      if (row.length) rows.push({ r: row, h: Math.min(T, (budget - gap * (row.length - 1)) / sum) });
      rows.forEach(function (R) {
        R.r.forEach(function (o) { o.it.style.width = Math.floor(o.ar * R.h) + 'px'; });
      });
      grid.classList.add('is-justified');
    }
    justify();
    if ('ResizeObserver' in window) {
      var lastW = 0;
      new ResizeObserver(function () { if (grid.clientWidth !== lastW) { lastW = grid.clientWidth; justify(); } }).observe(grid);
    } else window.addEventListener('resize', justify);

    function moveInk(tab, instant) {
      if (!ink || !tab) return;
      ink.style.setProperty('--x', tab.offsetLeft + (tab === tabs[0] ? 0 : 16) + 'px');
      var w = tab.offsetWidth - (tab === tabs[0] ? 16 : 32);
      ink.style.setProperty('--s', (w / 100).toFixed(3));
      if (!instant) ink.classList.add('is-ready');
    }

    function select(tab, focus) {
      var filter = tab.getAttribute('data-filter');
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
      });
      panel.setAttribute('aria-labelledby', tab.id);
      if (focus) tab.focus();
      moveInk(tab);
      // Tab im (mobil scrollbaren) Tablist sichtbar halten
      var tl = tablist.getBoundingClientRect(), tr = tab.getBoundingClientRect();
      if (tr.left < tl.left || tr.right > tl.right) tablist.scrollTo({ left: tablist.scrollLeft + (tr.left - tl.left) - 24, behavior: MOTION ? 'smooth' : 'auto' });
      if (filter === current) return;
      current = filter;
      var apply = function () {
        var shown = [];
        items.forEach(function (it) {
          var on = filter === 'alle' || it.getAttribute('data-cat') === filter;
          it.hidden = !on;
          if (on) shown.push(it);
        });
        justify();
        if (!OFF) {
          shown.forEach(function (it) { it.classList.remove('is-in'); });
          void grid.offsetWidth;
          shown.forEach(function (it, i) { it.style.setProperty('--d', Math.min(i * 55, 600) + 'ms'); it.classList.add('is-in'); if (revealIO) revealIO.unobserve(it); });
        }
        grid.classList.remove('is-swapping');
        if (status) status.textContent = shown.length + ' Bilder: ' + tab.textContent.replace(/\d+/g, '').trim();
        if (hasGSAP) ScrollTrigger.refresh();
      };
      if (MOTION) { grid.classList.add('is-swapping'); setTimeout(apply, 230); } else apply();
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(tab); });
      tab.addEventListener('keydown', function (e) {
        var k = e.key, n = null;
        if (k === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
        else if (k === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (k === 'Home') n = tabs[0];
        else if (k === 'End') n = tabs[tabs.length - 1];
        if (n) { e.preventDefault(); select(n, true); }
      });
    });
    var edge = function () { tablist.classList.toggle('at-end', tablist.scrollLeft + tablist.clientWidth >= tablist.scrollWidth - 4); };
    tablist.addEventListener('scroll', edge, { passive: true });
    window.addEventListener('resize', edge);
    edge();
    moveInk(tabs[0], true);
    requestAnimationFrame(function () { ink && ink.classList.add('is-ready'); });
    window.addEventListener('resize', function () { moveInk($('.g-tab[aria-selected="true"]'), true); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { moveInk($('.g-tab[aria-selected="true"]'), true); });

    initLightbox(items);
  }

  function initLightbox(items) {
    var dlg = $('[data-lb]');
    if (!dlg || typeof dlg.showModal !== 'function') return;
    var stage = $('[data-lb-stage]', dlg), fig = $('[data-lb-fig]', dlg), img = $('[data-lb-img]', dlg), cap = $('[data-lb-cap]', dlg);
    var count = $('[data-lb-count]', dlg), strip = $('[data-lb-strip]', dlg), stripWrap = $('[data-lb-strip-wrap]', dlg);
    var list = [], idx = 0, opener = null, busy = false;
    var MARK = 'M5 9C28 4 70 6 95 7C97 31 98 68 94 93C70 97 31 95 6 92C3 68 2 34 7 4';

    function data(it) {
      var im = $('img', it), btn = $('.g-open', it);
      return { src: im.getAttribute('src'), srcset: im.getAttribute('srcset'), alt: im.getAttribute('alt'), cap: btn.getAttribute('data-cap'), w: +im.getAttribute('width'), h: +im.getAttribute('height'), thumb: im.getAttribute('src').replace('-960.', '-480.') };
    }

    function buildStrip() {
      strip.textContent = '';
      list.forEach(function (d, i) {
        var li = el('li');
        var b = el('button', 'lb-thumb');
        b.type = 'button';
        b.setAttribute('aria-label', 'Bild ' + (i + 1) + ': ' + d.cap);
        var t = el('img'); t.src = d.thumb; t.alt = ''; t.width = Math.round(64 * d.w / d.h); t.height = 64; t.loading = 'lazy'; t.decoding = 'async';
        var no = el('span', 'lb-thumb-no', '▸ ' + pad(i + 1)); no.setAttribute('aria-hidden', 'true');
        var svgNS = 'http://www.w3.org/2000/svg';
        var svg = document.createElementNS(svgNS, 'svg'); svg.setAttribute('class', 'lb-mark'); svg.setAttribute('viewBox', '0 0 100 100'); svg.setAttribute('preserveAspectRatio', 'none'); svg.setAttribute('aria-hidden', 'true');
        var path = document.createElementNS(svgNS, 'path'); path.setAttribute('d', MARK); path.setAttribute('pathLength', '1'); path.setAttribute('vector-effect', 'non-scaling-stroke');
        svg.appendChild(path);
        b.appendChild(t); b.appendChild(svg); b.appendChild(no);
        b.addEventListener('click', function () { go(i); });
        li.appendChild(b); strip.appendChild(li);
      });
    }

    function render(i) {
      var d = list[i];
      img.src = d.src; img.srcset = d.srcset; img.sizes = '(max-width: 960px) 100vw, 960px';
      img.width = d.w; img.height = d.h; img.alt = d.alt;
      cap.textContent = d.cap;
      count.textContent = pad(i + 1) + ' / ' + pad(list.length);
      $$('.lb-thumb', strip).forEach(function (b, j) {
        if (j === i) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
      });
      var cur = $$('.lb-thumb', strip)[i];
      if (cur) {
        var wr = stripWrap.getBoundingClientRect(), br = cur.getBoundingClientRect();
        var target = stripWrap.scrollLeft + (br.left - wr.left) - (wr.width - br.width) / 2;
        stripWrap.scrollTo({ left: target, behavior: MOTION && dlg.open ? 'smooth' : 'auto' });
      }
      [i - 1, i + 1].forEach(function (j) { var n = list[(j + list.length) % list.length]; if (n) { var p = new Image(); p.src = n.src; } });
    }

    function go(i, dir) {
      if (busy || !list.length) return;
      i = (i + list.length) % list.length;
      if (i === idx && dlg.open) return;
      dir = dir || (i > idx ? 1 : -1);
      if (!MOTION || !dlg.open) { idx = i; render(i); fig.style.transform = ''; fig.style.opacity = ''; return; }
      busy = true;
      fig.style.setProperty('--dir', dir);
      fig.classList.remove('is-settle', 'is-drag');
      fig.style.transform = ''; fig.style.opacity = '';
      fig.classList.add('is-out');
      setTimeout(function () {
        idx = i; render(i);
        fig.classList.remove('is-out');
        fig.classList.add('is-in-start');
        var show = function () {
          requestAnimationFrame(function () {
            fig.classList.remove('is-in-start'); fig.classList.add('is-settle');
            busy = false;
          });
        };
        var timer = setTimeout(show, 260);
        if (img.decode) img.decode().then(function () { clearTimeout(timer); show(); }, function () { clearTimeout(timer); show(); });
      }, 160);
    }

    function open(it) {
      list = items.filter(function (x) { return !x.hidden; }).map(data);
      var visibleItems = items.filter(function (x) { return !x.hidden; });
      idx = Math.max(0, visibleItems.indexOf(it));
      opener = document.activeElement;
      buildStrip();
      render(idx);
      dlg.classList.remove('is-closing');
      dlg.showModal();
      dlg.focus();
      if (lenis) lenis.stop();
      root.style.overflow = 'hidden';
      render(idx);
    }
    function close() {
      var finish = function () { dlg.classList.remove('is-closing'); if (dlg.open) dlg.close(); };
      if (MOTION) { dlg.classList.add('is-closing'); setTimeout(finish, 170); } else finish();
    }
    dlg.addEventListener('close', function () {
      root.style.overflow = '';
      if (lenis) lenis.start();
      fig.classList.remove('is-out', 'is-in-start', 'is-settle', 'is-drag'); busy = false;
      if (opener && opener.focus) opener.focus({ preventScroll: true });
    });
    dlg.addEventListener('cancel', function (e) { e.preventDefault(); close(); });
    dlg.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(idx + 1, 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go(idx - 1, -1); }
      else if (e.key === 'Home') { e.preventDefault(); go(0, -1); }
      else if (e.key === 'End') { e.preventDefault(); go(list.length - 1, 1); }
    });
    // Klick auf den dunklen Rand schließt
    dlg.addEventListener('click', function (e) { if (e.target === stage && !justDragged) close(); });
    $('[data-lb-close]', dlg).addEventListener('click', close);
    $('[data-lb-prev]', dlg).addEventListener('click', function () { go(idx - 1, -1); });
    $('[data-lb-next]', dlg).addEventListener('click', function () { go(idx + 1, 1); });

    items.forEach(function (it) { $('.g-open', it).addEventListener('click', function () { open(it); }); });

    // Wischen (Pointer Events, Geschwindigkeit statt fester Schwelle)
    var sx = 0, sy = 0, st = 0, dx = 0, dragging = false, pid = null, justDragged = false;
    stage.addEventListener('pointerdown', function (e) {
      if (busy || pid !== null || e.button !== 0 || e.target.closest('button')) return;
      pid = e.pointerId; sx = e.clientX; sy = e.clientY; st = performance.now(); dx = 0; dragging = false;
    });
    stage.addEventListener('pointermove', function (e) {
      if (e.pointerId !== pid) return;
      var mx = e.clientX - sx, my = e.clientY - sy;
      if (!dragging) {
        if (Math.abs(mx) < 8) return;
        if (Math.abs(my) > Math.abs(mx)) { pid = null; return; }
        dragging = true; stage.setPointerCapture(pid); fig.classList.remove('is-settle'); fig.classList.add('is-drag');
      }
      dx = mx;
      var damp = (idx === 0 && dx > 0) || (idx === list.length - 1 && dx < 0) ? 0.35 : 0.85;
      fig.style.transform = 'translateX(' + (dx * damp).toFixed(1) + 'px)';
      fig.style.opacity = String(1 - Math.min(Math.abs(dx) / 700, 0.35));
    });
    var end = function (e) {
      if (e.pointerId !== pid) return;
      pid = null;
      if (!dragging) return;
      dragging = false;
      justDragged = true; setTimeout(function () { justDragged = false; }, 0);
      var v = Math.abs(dx) / Math.max(1, performance.now() - st);
      fig.classList.remove('is-drag');
      if (Math.abs(dx) > 70 || v > 0.11) {
        go(idx + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
      } else {
        fig.classList.add('is-settle'); fig.style.transform = ''; fig.style.opacity = '';
      }
    };
    stage.addEventListener('pointerup', end);
    stage.addEventListener('pointercancel', end);
  }

  /* ------------------------------------------------------------------
     Love Story: horizontale, scroll-gesteuerte Bildstrecke
     ------------------------------------------------------------------ */
  function initStory() {
    var section = $('[data-story]');
    if (!section || !hasGSAP || !MOTION) return;
    var pin = $('[data-story-pin]', section);
    var track = $('[data-story-track]', section);
    var fill = $('[data-axis-fill]', section);
    var years = $$('.axis-years span', section);
    var panels = $$('.story-panel', section);
    var mm = gsap.matchMedia();
    mm.add('(min-width: 900px)', function () {
      root.classList.add('story-h');
      panels.forEach(function (p) { p.classList.add('is-in'); });
      var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
      // Statt GSAP-Pin (position: fixed → Layout-Shifts) hält position: sticky die Bühne.
      // Die Sektion bekommt die Scrollstrecke als Höhe; gesetzt vor jeder Neuberechnung.
      var setHeight = function () { section.style.height = (pin.offsetHeight + dist()) + 'px'; };
      setHeight();
      ScrollTrigger.addEventListener('refreshInit', setHeight);
      var setYear = function (n) { years.forEach(function (y, i) { y.classList.toggle('is-on', i <= n); }); };
      var tween = gsap.to(track, {
        x: function () { return -dist(); }, ease: 'none',
        scrollTrigger: {
          trigger: section, start: 'top top', end: 'bottom bottom', scrub: 0.8, invalidateOnRefresh: true,
          onUpdate: function (self) { if (fill) fill.style.transform = 'scaleX(' + self.progress.toFixed(4) + ')'; }
        }
      });
      panels.forEach(function (panel, i) {
        var im = $('.story-img img', panel);
        gsap.fromTo(im, { filter: 'grayscale(1) brightness(0.5) contrast(1.15)' }, {
          filter: 'grayscale(0) brightness(1) contrast(1)', ease: 'none',
          scrollTrigger: { trigger: panel, containerAnimation: tween, start: 'left 92%', end: 'center 55%', scrub: true }
        });
        gsap.fromTo(im, { xPercent: -5 }, { xPercent: 5, ease: 'none', scrollTrigger: { trigger: panel, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
        ScrollTrigger.create({ trigger: panel, containerAnimation: tween, start: 'left 62%', onEnter: function () { setYear(i); }, onLeaveBack: function () { setYear(i - 1); } });
      });
      return function () { ScrollTrigger.removeEventListener('refreshInit', setHeight); section.style.height = ''; root.classList.remove('story-h'); gsap.set(track, { clearProps: 'x' }); };
    });
  }

  /* ------------------------------------------------------------------
     Paket-Konfigurator
     ------------------------------------------------------------------ */
  var cfgState = null;
  function initConfigurator() {
    var form = $('[data-cfg-form]');
    if (!form) return;
    var hours = $('[data-hours]'), second = $('[data-second]'), eng = $('[data-engagement]');
    var albums = $$('[data-album]');
    var out = {
      hoursNum: $('[data-hours-num]'), hint: $('[data-hours-hint]'), secondPrice: $('[data-second-price]'),
      tHours: $('[data-t-hours]'), tSecond: $('[data-t-second]'), tEng: $('[data-t-eng]'), tAlbum: $('[data-t-album]'), tImages: $('[data-t-images]'),
      price: $('[data-price]'), live: $('[data-price-live]'), no: $('[data-ticket-no]')
    };
    var presets = $$('[data-preset]');
    var shownPrice = null, priceRaf = 0, liveTimer = 0;

    function read() {
      var album = 'keins';
      albums.forEach(function (r) { if (r.checked) album = r.value; });
      return { h: +hours.value, second: second.checked, eng: eng.checked, album: album };
    }
    function calc(s) {
      var total = PREISE.grundpauschale + s.h * PREISE.proStunde + (s.second ? s.h * PREISE.secondShooterProStunde : 0) + (s.eng ? PREISE.verlobung : 0) + PREISE.alben[s.album];
      var f = s.second ? SECOND_SHOOTER_FAKTOR : 1;
      var lo = Math.round(s.h * BILDER_PRO_STUNDE[0] * f / 10) * 10, hi = Math.round(s.h * BILDER_PRO_STUNDE[1] * f / 10) * 10;
      return { total: total, lo: lo, hi: hi };
    }
    function setText(node, text) {
      if (!node || node.textContent === text) return;
      node.textContent = text;
      if (MOTION && cfgState) { node.classList.remove('is-flash'); void node.offsetWidth; node.classList.add('is-flash'); }
    }
    function animatePrice(to) {
      if (shownPrice === null || !MOTION) { shownPrice = to; out.price.textContent = euro(to); return; }
      var from = shownPrice, t0 = performance.now(), dur = 520;
      cancelAnimationFrame(priceRaf);
      (function tick(now) {
        var t = clamp((now - t0) / dur, 0, 1), e = 1 - Math.pow(1 - t, 3);
        shownPrice = from + (to - from) * e;
        out.price.textContent = euro(Math.round(shownPrice / 10) * 10);
        if (t < 1) priceRaf = requestAnimationFrame(tick); else { shownPrice = to; out.price.textContent = euro(to); }
      })(t0);
    }
    function hint(h) {
      if (h <= 3) return 'Trauung, Gratulation und ein kurzes Paarshooting.';
      if (h <= 6) return 'Vom Ankommen der Gäste bis zur Hochzeitstorte.';
      if (h <= 9) return 'Vom Getting Ready bis zum ersten Tanz.';
      return 'Vom Getting Ready bis zur Party – inklusive Brautstraußwurf.';
    }
    function update() {
      var s = read(), r = calc(s);
      var pct = (s.h - hours.min) / (hours.max - hours.min) * 100;
      hours.style.setProperty('--p', pct + '%');
      hours.setAttribute('aria-valuetext', s.h + ' Stunden');
      out.hoursNum.textContent = s.h;
      out.hint.textContent = hint(s.h);
      out.secondPrice.textContent = s.second ? '+ ' + euro(s.h * PREISE.secondShooterProStunde) : '+ 95 €/h';
      setText(out.tHours, s.h + ' Stunden');
      setText(out.tSecond, s.second ? s.h + ' h · Tom Richter' : '–');
      setText(out.tEng, s.eng ? 'ca. 90 Minuten' : '–');
      setText(out.tAlbum, ALBUM_TEXT[s.album]);
      setText(out.tImages, nf.format(r.lo) + '–' + nf.format(r.hi));
      out.no.textContent = pad(s.h) + (s.second ? '1' : '0') + (['keins', 'fineart', 'eltern'].indexOf(s.album)) + (s.eng ? '1' : '0');
      animatePrice(r.total);
      clearTimeout(liveTimer);
      liveTimer = setTimeout(function () { out.live.textContent = 'Beispielrechnung: ' + euro(r.total).replace(' €', ' Euro') + ' für ' + s.h + ' Stunden' + (s.second ? ' mit Second Shooter' : '') + '.'; }, 700);
      presets.forEach(function (b) {
        var p = b.getAttribute('data-preset').split(',');
        var on = +p[0] === s.h && (p[1] === '1') === s.second && p[2] === s.album && (p[3] === '1') === s.eng;
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      cfgState = { s: s, total: r.total, summary: s.h + ' h' + (s.second ? ' · Second Shooter' : '') + (s.eng ? ' · Verlobungsshooting' : '') + ' · ' + ALBUM_TEXT[s.album] + ' – ' + euro(r.total) };
    }
    form.addEventListener('input', update);
    form.addEventListener('change', update);
    presets.forEach(function (b) {
      b.addEventListener('click', function () {
        var p = b.getAttribute('data-preset').split(',');
        hours.value = p[0]; second.checked = p[1] === '1';
        albums.forEach(function (r) { r.checked = r.value === p[2]; });
        eng.checked = p[3] === '1';
        update();
      });
    });
    var engBtn = $('[data-preset-engagement]');
    if (engBtn) engBtn.addEventListener('click', function () { eng.checked = true; update(); });
    var take = $('[data-cfg-take]');
    if (take) take.addEventListener('click', function () { setPackageInForm(); });
    cfgState = null;
    update();
  }

  function setPackageInForm() {
    var box = $('[data-f-pkg]'), txt = $('[data-f-pkg-text]'), chk = $('[data-f-pkg-check]');
    if (!box || !cfgState) return;
    txt.textContent = cfgState.summary;
    chk.checked = true;
    box.hidden = false;
  }

  /* ------------------------------------------------------------------
     Verfügbarkeits-Check (Demo-Daten)
     ------------------------------------------------------------------ */
  function initAvailability() {
    var card = $('[data-cal]');
    if (!card) return;
    var body = $('[data-cal-body]', card), sel = $('[data-cal-month]', card), cap = $('[data-cal-caption]', card), result = $('[data-cal-result]', card);
    var prev = $('[data-cal-prev]', card), next = $('[data-cal-next]', card);
    var MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
    var fmtLong = new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    var fmtShort = new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: 'numeric', month: 'short' });
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var first = new Date(today.getFullYear(), today.getMonth(), 1);
    var last = new Date(today.getFullYear(), today.getMonth() + VERFUEGBARKEIT.monateVoraus + 1, 0);
    var view = new Date(first), selected = null, focusDate = null;

    function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
    function same(a, b) { return a && b && a.getTime() === b.getTime(); }
    function hash(d) {
      var x = (d.getFullYear() * 400 + (d.getMonth() + 1) * 32 + d.getDate()) >>> 0;
      x = Math.imul(x ^ (x >>> 16), 0x45d9f3b) >>> 0; x = Math.imul(x ^ (x >>> 16), 0x45d9f3b) >>> 0; x = (x ^ (x >>> 16)) >>> 0;
      return x / 4294967296;
    }
    function status(d) {
      var dow = d.getDay(), m = d.getMonth() + 1, r = hash(d), p;
      if (VERFUEGBARKEIT.saisonMonate.indexOf(m) > -1) {
        var S = VERFUEGBARKEIT.saison;
        p = dow === 6 ? S.sa : dow === 5 ? S.fr : dow === 0 ? S.so : S.werktag;
      } else {
        p = dow === 6 ? VERFUEGBARKEIT.nebensaison.sa : VERFUEGBARKEIT.nebensaison.sonst;
      }
      if (r < p[0]) return 'belegt';
      if (r < p[0] + p[1]) return 'angefragt';
      return 'frei';
    }
    function inRange(d) { return d >= today && d <= last; }
    var LABEL = { frei: 'frei', angefragt: 'angefragt', belegt: 'belegt' };

    // Monatsauswahl befüllen
    for (var m = new Date(first); m <= last; m = new Date(m.getFullYear(), m.getMonth() + 1, 1)) {
      var o = el('option', null, MONTHS[m.getMonth()] + ' ' + m.getFullYear());
      o.value = m.getFullYear() + '-' + m.getMonth();
      sel.appendChild(o);
    }

    function render(focusIt) {
      body.textContent = '';
      var y = view.getFullYear(), mo = view.getMonth();
      sel.value = y + '-' + mo;
      cap.textContent = 'Verfügbarkeit im ' + MONTHS[mo] + ' ' + y;
      prev.disabled = view <= first;
      next.disabled = new Date(y, mo + 1, 1) > last;
      var start = (new Date(y, mo, 1).getDay() + 6) % 7;
      var days = new Date(y, mo + 1, 0).getDate();
      if (!focusDate || focusDate.getMonth() !== mo || focusDate.getFullYear() !== y) {
        focusDate = null;
        if (selected && selected.getMonth() === mo && selected.getFullYear() === y) focusDate = selected;
        else for (var dd = 1; dd <= days; dd++) { var c = new Date(y, mo, dd); if (inRange(c)) { focusDate = c; break; } }
      }
      var tr = el('tr'), cells = 0, focusBtn = null;
      for (var i = 0; i < start; i++) { tr.appendChild(el('td')); cells++; }
      for (var d = 1; d <= days; d++) {
        var date = new Date(y, mo, d);
        var td = el('td');
        var b = el('button', 'day');
        b.type = 'button';
        var n = el('span', 'day-n', String(d)); b.appendChild(n);
        b.setAttribute('data-date', iso(date));
        if (!inRange(date)) {
          b.disabled = true;
          b.setAttribute('aria-label', fmtLong.format(date) + ', nicht wählbar');
        } else {
          var s = status(date);
          b.setAttribute('data-s', s);
          b.setAttribute('aria-label', fmtLong.format(date) + ', ' + LABEL[s]);
          b.setAttribute('aria-pressed', same(date, selected) ? 'true' : 'false');
        }
        if (same(date, today)) b.classList.add('is-today');
        b.tabIndex = same(date, focusDate) ? 0 : -1;
        if (same(date, focusDate)) focusBtn = b;
        td.appendChild(b); tr.appendChild(td); cells++;
        if (cells % 7 === 0) { body.appendChild(tr); tr = el('tr'); }
      }
      if (cells % 7 !== 0) { while (cells % 7 !== 0) { tr.appendChild(el('td')); cells++; } body.appendChild(tr); }
      if (focusIt && focusBtn) focusBtn.focus();
    }

    function goMonth(delta, keepDay) {
      var nv = new Date(view.getFullYear(), view.getMonth() + delta, 1);
      if (nv < first || nv > last) return false;
      view = nv;
      if (keepDay && focusDate) {
        var dim = new Date(nv.getFullYear(), nv.getMonth() + 1, 0).getDate();
        var cand = new Date(nv.getFullYear(), nv.getMonth(), Math.min(focusDate.getDate(), dim));
        focusDate = inRange(cand) ? cand : null;
      } else focusDate = null;
      render(keepDay);
      return true;
    }

    function choose(date, fromKey) {
      selected = date; focusDate = date;
      if (date.getMonth() !== view.getMonth() || date.getFullYear() !== view.getFullYear()) view = new Date(date.getFullYear(), date.getMonth(), 1);
      render(fromKey !== false);
      showResult(date);
    }

    function nearbyFree(date) {
      var out = [];
      for (var k = 1; k <= 28 && out.length < 3; k++) {
        [k, -k].forEach(function (off) {
          if (out.length >= 3) return;
          var c = new Date(date.getFullYear(), date.getMonth(), date.getDate() + off);
          var dow = c.getDay();
          if (inRange(c) && (dow === 5 || dow === 6 || dow === 0) && status(c) === 'frei') out.push(c);
        });
      }
      return out.sort(function (a, b) { return a - b; });
    }

    function showResult(date) {
      var s = status(date);
      result.textContent = '';
      var head = el('div', 'res-head');
      head.appendChild(el('p', 'res-date', fmtLong.format(date)));
      head.appendChild(el('span', 'res-pill res-pill--' + s, LABEL[s]));
      result.appendChild(head);
      var text, actions = el('div', 'res-actions');
      var popular = date.getDay() === 6 && VERFUEGBARKEIT.saisonMonate.indexOf(date.getMonth() + 1) > -1;
      if (s === 'frei') {
        text = 'Im Demo-Kalender ist dieser Tag noch frei.' + (popular ? ' Samstage in der Saison sind schnell vergeben – eine frühe Anfrage lohnt sich.' : '') + ' Nach dem Vorgespräch halten wir das Datum sieben Tage unverbindlich für Sie frei.';
        actions.appendChild(requestBtn(date, 'Dieses Datum anfragen', s));
      } else if (s === 'angefragt') {
        text = 'Für diesen Tag liegt bereits eine Anfrage vor, die noch nicht bestätigt ist. Gern setzen wir Sie auf die Warteliste – solche Termine werden immer wieder frei.';
        actions.appendChild(requestBtn(date, 'Auf die Warteliste', s));
      } else {
        text = 'Dieser Tag ist leider vergeben. Vielleicht passt einer dieser freien Tage in der Nähe – oder Tom Richter begleitet Sie als eigenständiger Fotograf.';
      }
      result.appendChild(el('p', 'res-text', text));
      if (s !== 'frei') {
        var alts = nearbyFree(date);
        if (alts.length) {
          actions.appendChild(el('span', 'res-alt-label', 'Freie Wochenendtage in der Nähe:'));
          alts.forEach(function (a) {
            var c = el('button', 'chip', fmtShort.format(a));
            c.type = 'button';
            c.setAttribute('aria-label', fmtLong.format(a) + ' auswählen');
            c.addEventListener('click', function () { choose(a, true); });
            actions.appendChild(c);
          });
        }
      }
      result.appendChild(actions);
    }

    function requestBtn(date, label, s) {
      var b = el('a', 'btn btn--ink btn--sm', label);
      b.href = '#anfrage';
      b.addEventListener('click', function () {
        var input = $('[data-f-date]'), hintEl = $('[data-f-date-hint]');
        if (input) input.value = iso(date);
        if (hintEl) { hintEl.textContent = 'Aus dem Verfügbarkeits-Check übernommen (Demo-Status: ' + s + ').'; hintEl.classList.add('is-status'); }
        var msg = $('#f-msg');
        if (msg && s === 'angefragt' && !msg.value) msg.value = 'Bitte setzen Sie uns für diesen Tag auf die Warteliste.';
      });
      return b;
    }

    body.addEventListener('click', function (e) {
      var b = e.target.closest('.day');
      if (!b || b.disabled) return;
      var p = b.getAttribute('data-date').split('-');
      choose(new Date(+p[0], +p[1] - 1, +p[2]), true);
    });
    body.addEventListener('keydown', function (e) {
      var b = e.target.closest('.day');
      if (!b) return;
      var p = b.getAttribute('data-date').split('-');
      var d = new Date(+p[0], +p[1] - 1, +p[2]);
      var delta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
      var nd = null;
      if (delta) nd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + delta);
      else if (e.key === 'Home') nd = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
      else if (e.key === 'End') nd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + (6 - (d.getDay() + 6) % 7));
      else if (e.key === 'PageUp' || e.key === 'PageDown') {
        e.preventDefault(); focusDate = d; goMonth(e.key === 'PageUp' ? -1 : 1, true); return;
      }
      if (!nd) return;
      e.preventDefault();
      if (!inRange(nd)) return;
      focusDate = nd;
      if (nd.getMonth() !== view.getMonth() || nd.getFullYear() !== view.getFullYear()) view = new Date(nd.getFullYear(), nd.getMonth(), 1);
      render(true);
    });
    prev.addEventListener('click', function () { goMonth(-1); });
    next.addEventListener('click', function () { goMonth(1); });
    sel.addEventListener('change', function () { var p = sel.value.split('-'); view = new Date(+p[0], +p[1], 1); focusDate = null; render(false); });
    render(false);

    // Leerer Zustand mit Abkürzung: die nächsten freien Samstage direkt antippbar
    (function emptyState() {
      var sats = [];
      for (var k = 0, c; k < 500 && sats.length < 3; k++) {
        c = new Date(today.getFullYear(), today.getMonth(), today.getDate() + k);
        if (!inRange(c)) break;
        if (c.getDay() === 6 && status(c) === 'frei') sats.push(c);
      }
      if (!sats.length) return;
      var box = el('div', 'res-actions res-actions--empty');
      box.appendChild(el('span', 'res-alt-label', 'Oder gleich einer der nächsten freien Samstage:'));
      sats.forEach(function (a) {
        var c = el('button', 'chip', fmtShort.format(a));
        c.type = 'button';
        c.setAttribute('aria-label', fmtLong.format(a) + ' auswählen');
        c.addEventListener('click', function () { choose(a, true); });
        box.appendChild(c);
      });
      result.appendChild(box);
    })();
  }

  /* ------------------------------------------------------------------
     Stimmen: langsame Überblendung
     ------------------------------------------------------------------ */
  function initQuotes() {
    var quotes = $$('[data-quote]');
    var now = $('[data-q-now]');
    if (quotes.length < 2) return;
    var i = 0;
    function show(n) {
      i = (n + quotes.length) % quotes.length;
      quotes.forEach(function (q, j) { q.classList.toggle('is-active', j === i); q.setAttribute('aria-hidden', j === i ? 'false' : 'true'); });
      if (now) now.textContent = pad(i + 1);
    }
    $('[data-q-prev]').addEventListener('click', function () { show(i - 1); });
    $('[data-q-next]').addEventListener('click', function () { show(i + 1); });
    show(0);
    // Wischen auf Touch
    var stage = $('[data-quotes-stage]'), x0 = null;
    stage.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') x0 = e.clientX; });
    stage.addEventListener('pointerup', function (e) { if (x0 === null) return; var d = e.clientX - x0; x0 = null; if (Math.abs(d) > 50) show(i + (d < 0 ? 1 : -1)); });
  }

  /* ------------------------------------------------------------------
     Anfrageformular (nur clientseitig – Demo)
     ------------------------------------------------------------------ */
  function initForm() {
    var form = $('[data-form]');
    if (!form) return;
    var success = $('[data-form-success]'), sum = $('[data-success-sum]'), reset = $('[data-form-reset]');
    var dateIn = $('[data-f-date]');
    var todayIso = (function () { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); })();
    if (dateIn) dateIn.min = todayIso;
    var tried = false;

    var rules = {
      names: function (v) { return v.trim().length >= 3 ? '' : 'Bitte nennen Sie uns Ihre Namen.'; },
      email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Bitte geben Sie eine gültige E-Mail-Adresse an.'; },
      date: function (v) { if (!v) return 'Bitte wählen Sie ein (Wunsch-)Datum.'; return v < todayIso ? 'Das Datum liegt in der Vergangenheit.' : ''; },
      message: function (v) { return v.trim().length >= 10 ? '' : 'Erzählen Sie uns kurz von Ihrem Tag (mind. 10 Zeichen).'; },
      consent: function (v, f) { return f.checked ? '' : 'Bitte stimmen Sie der Verarbeitung Ihrer Angaben zu.'; }
    };
    function check(field) {
      var rule = rules[field.name];
      if (!rule) return true;
      var msg = rule(field.value, field);
      var err = document.getElementById(field.getAttribute('aria-describedby').split(' ').filter(function (id) { return /-err$/.test(id); })[0]);
      field.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (err) err.textContent = msg;
      return !msg;
    }
    Object.keys(rules).forEach(function (name) {
      var f = form.elements[name];
      if (!f) return;
      f.addEventListener(f.type === 'checkbox' ? 'change' : 'blur', function () { if (tried) check(f); });
      f.addEventListener('input', function () { if (tried && f.getAttribute('aria-invalid') === 'true') check(f); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      tried = true;
      var firstBad = null;
      Object.keys(rules).forEach(function (name) { var f = form.elements[name]; if (f && !check(f) && !firstBad) firstBad = f; });
      if (firstBad) { firstBad.focus(); return; }
      var E = form.elements;
      var dateTxt = '';
      if (E.date.value) { var p = E.date.value.split('-'); dateTxt = new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(+p[0], +p[1] - 1, +p[2])); }
      var rows = [
        ['Namen', E.names.value.trim()],
        ['E-Mail', E.email.value.trim()],
        ['Telefon', E.phone.value.trim() || '–'],
        ['Hochzeitsdatum', dateTxt],
        ['Ort', E.place.value.trim() || '–'],
        ['Gäste', E.guests.value || '–']
      ];
      var pkgBox = $('[data-f-pkg]');
      if (pkgBox && !pkgBox.hidden && E.pkg.checked) rows.push(['Paket', $('[data-f-pkg-text]').textContent]);
      rows.push(['Nachricht', E.message.value.trim()]);
      sum.textContent = '';
      rows.forEach(function (r) { var d = el('div'); d.appendChild(el('dt', null, r[0])); d.appendChild(el('dd', null, r[1])); sum.appendChild(d); });
      form.hidden = true;
      success.hidden = false;
      success.focus({ preventScroll: true });
      var card = $('[data-form-card]');
      if (card.getBoundingClientRect().top < headerH()) scrollToTarget(card, { focus: success });
    });

    reset.addEventListener('click', function () {
      form.reset(); tried = false;
      $$('[aria-invalid]', form).forEach(function (f) { f.removeAttribute('aria-invalid'); });
      $$('[data-err]', form).forEach(function (p) { p.textContent = ''; });
      var hintEl = $('[data-f-date-hint]'); if (hintEl) { hintEl.textContent = 'Noch unsicher? Tragen Sie Ihr Wunschdatum ein.'; hintEl.classList.remove('is-status'); }
      success.hidden = true; form.hidden = false;
      form.elements.names.focus();
    });
  }

  /* ------------------------------------------------------------------
     Start
     ------------------------------------------------------------------ */
  function boot() {
    try { initScroll(); } catch (e) { /* weiter ohne Smooth Scroll */ }
    initHeader();
    initMenu();
    // Der Rest läuft in einzelnen Häppchen: zwischen den Schritten darf der Browser
    // zeichnen und auf Eingaben reagieren (statt eines langen Start-Tasks).
    var queue = [initHero, initStatement, initGallery, initConfigurator, initAvailability, initQuotes, initForm, initReveal, initStory, function () {
      window.__lichtwerkReady = true;
      if (hasGSAP) {
        ScrollTrigger.refresh();
        if (document.readyState !== 'complete') window.addEventListener('load', function () { ScrollTrigger.refresh(); });
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
      }
    }];
    (function next() {
      var fn = queue.shift();
      if (!fn) return;
      try { fn(); } catch (e) { if (window.console) console.error(e); }
      if (queue.length) setTimeout(next, 0);
    })();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
