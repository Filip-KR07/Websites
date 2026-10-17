/* ==========================================================================
   Lichtwerk – Hochzeitsfotografie (Demo, Modell „Silber“)
   Dunkelkammer: Kontaktbogen-Shader mit Fadenzähler und Lichtleck,
   „Licht an“-Kapitel, Leuchttisch-Galerie (FLIP), Filmrolle, Filmdose-
   Konfigurator, Terminbuch, Elbe-Karte, Laufband, Formular.
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

  /* Dunkelkammer im Hero */
  var ENTWICKLUNG_MS = 3600;   // Dauer: Negativ → Positiv
  var LUPE_FAKTOR = 2;         // Vergrößerung des Fadenzählers

  /* Motion-System (gleiche Werte wie die CSS-Variablen) */
  var EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';
  var EASE_IN_OUT = 'cubic-bezier(0.77, 0, 0.175, 1)';
  var EASE_DRAWER = 'cubic-bezier(0.32, 0.72, 0, 1)';

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
  function easeIO(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  var SVGNS = 'http://www.w3.org/2000/svg';
  function mark(symbol, cls) {
    var s = document.createElementNS(SVGNS, 'svg');
    s.setAttribute('class', cls); s.setAttribute('viewBox', symbol === 'g-tick' ? '0 0 150 30' : '0 0 150 100');
    s.setAttribute('preserveAspectRatio', 'none'); s.setAttribute('aria-hidden', 'true');
    var u = document.createElementNS(SVGNS, 'use'); u.setAttribute('href', '#' + symbol); s.appendChild(u);
    return s;
  }

  /* Rollende Ziffern: jede Ziffer ist eine kleine Filmrolle mit 0–9 */
  function makeOdo(node) {
    if (!node) return { set: function () {} };
    var sr = null;
    if (!node.closest('[aria-hidden="true"]')) {
      sr = el('span', 'sr-only');
      node.parentNode.insertBefore(sr, node.nextSibling);
    }
    node.setAttribute('aria-hidden', 'true');
    var reels = [], text = '';
    function build(t, roll) {
      node.textContent = ''; reels = [];
      for (var i = 0; i < t.length; i++) {
        var ch = t.charAt(i);
        if (/\d/.test(ch)) {
          var col = el('span', 'odo-col'), reel = el('span', 'odo-reel');
          for (var d = 0; d < 10; d++) reel.appendChild(el('span', null, String(d)));
          col.appendChild(reel); node.appendChild(col);
          reel.style.transform = 'translateY(' + (roll ? 0 : -ch * 10) + '%)';
          reels.push({ reel: reel, d: +ch });
        } else {
          node.appendChild(el('span', 'odo-ch', ch === ' ' ? ' ' : ch));
          reels.push(null);
        }
      }
    }
    function apply(stagger) {
      var k = 0;
      for (var i = reels.length - 1; i >= 0; i--) {
        var r = reels[i]; if (!r) continue;
        r.reel.style.transitionDelay = stagger ? (k * 45) + 'ms' : '0ms';
        r.reel.style.transform = 'translateY(' + (-r.d * 10) + '%)';
        k++;
      }
    }
    function set(t) {
      t = t.replace(/ /g, ' ');
      if (sr) sr.textContent = t;
      if (t === text) return;
      var same = t.length === text.length && t.split('').every(function (c, i) { return /\d/.test(c) === /\d/.test(text.charAt(i)) && (/\d/.test(c) || c === text.charAt(i)); });
      if (!MOTION) { build(t, false); text = t; return; }
      if (!same) { build(t, true); void node.offsetWidth; }
      for (var i = 0; i < t.length; i++) if (reels[i]) reels[i].d = +t.charAt(i);
      apply(true);
      text = t;
    }
    var initial = node.textContent.trim().replace(/\s/g, ' ');
    build(initial, false); text = initial; if (sr) sr.textContent = initial;
    return { set: set };
  }

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
      lenis.scrollTo(target, { offset: -headerH() + 1, duration: 1.3, easing: easeIO, onComplete: function () {
        var off = target.getBoundingClientRect().top - headerH() + 1;
        if (Math.abs(off) > 3) lenis.scrollTo(target, { offset: -headerH() + 1, duration: 0.45, easing: easeIO, onComplete: done }); else done();
      } });
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
    var statement = $('[data-statement]');
    var darks = $$('.hero, .story, .contact, .site-footer');
    var ticking = false;
    function update() {
      ticking = false;
      var y = window.pageYOffset;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      header.classList.toggle('is-scrolled', y > 12);
      var line = header.offsetHeight * 0.5, dark = false, i, r;
      for (i = 0; i < darks.length; i++) { r = darks[i].getBoundingClientRect(); if (r.top <= line && r.bottom >= line) { dark = true; break; } }
      if (!dark && statement && statement.classList.contains('is-scrub') && !statement.classList.contains('is-light')) {
        r = statement.getBoundingClientRect(); if (r.top <= line && r.bottom >= line) dark = true;
      }
      header.classList.toggle('is-dark', dark);
      if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? clamp(y / max, 0, 1) : 0).toFixed(4) + ')';
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    window.__headerUpdate = onScroll;
    update();

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
      if (action && contact) {
        new IntersectionObserver(function (en) { action.classList.toggle('is-hidden', en[0].isIntersecting); }, { rootMargin: '0px 0px -30% 0px' }).observe(contact);
      }
    }
  }

  /* Navigation: Buchstaben rollen beim Hover (Kopie per text-shadow) */
  function initRoll() {
    $$('[data-roll]').forEach(function (a) {
      var t = a.textContent;
      a.textContent = '';
      a.appendChild(el('span', 'sr-only', t));
      var r = el('span', 'roll'); r.setAttribute('aria-hidden', 'true');
      t.split('').forEach(function (ch, i) { var s = el('span', null, ch); s.style.setProperty('--i', i); r.appendChild(s); });
      a.appendChild(r);
    });
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
     HERO: Kontaktbogen unter Rotlicht (WebGL)
     Die Filmstreifen werden in einen Atlas gezeichnet; der Shader zeigt
     erst das Negativ, dann zieht die Entwicklerwelle das Positiv hoch.
     Dazu: Fadenzähler (Lupe ×2) unter der Maus, Lichtleck beim Scrollen.
     ------------------------------------------------------------------ */
  var VERT = 'attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
  var FRAG = [
    '#ifdef GL_FRAGMENT_PRECISION_HIGH',
    'precision highp float;',
    '#else',
    'precision mediump float;',
    '#endif',
    'uniform sampler2D uTex;uniform sampler2D uNoise;',
    'uniform float uP;uniform float uT;uniform float uLeak;uniform float uLoupe;uniform float uLR;uniform float uMag;',
    'uniform vec2 uRes;uniform vec2 uMouse;',
    'varying vec2 v;',
    'float h(vec2 q){q=fract(q*vec2(123.34,456.21));q+=dot(q,q+45.32);return fract(q.x*q.y);}',
    'void main(){',
    '  vec2 px=v*uRes;',
    // Fadenzähler: quadratisches Fenster, darin ×uMag
    '  vec2 d=px-uMouse;',
    '  float inside=step(max(abs(d.x),abs(d.y)),uLR);',
    '  float m=mix(1.,uMag,uLoupe*inside);',
    '  vec2 uv=(uMouse+d/m)/uRes;',
    '  vec4 tx=texture2D(uTex,uv);',
    '  vec3 c=tx.rgb;float a=tx.a;',
    '  float l=dot(c,vec3(.299,.587,.114));',
    '  float n=texture2D(uNoise,v).r;',
    // Negativ mit orangefarbener Maske, taucht aus dem Schwarz auf
    '  vec3 neg=(1.-c)*vec3(.97,.70,.50)+vec3(.03,.0,-.02);',
    '  float a1=smoothstep(0.,.3,uP);',
    '  vec3 negShow=neg*clamp(a1*1.45-l*.45,0.,1.);',
    // Entwicklerwelle von links nach rechts, mit Schlieren aus der Rauschtextur
    '  float f=v.x*.62+(1.-v.y)*.18+n*.38;',
    '  float front=mix(-.3,1.36,smoothstep(.3,.82,uP));',
    '  float pos=1.-smoothstep(front-.06,front+.06,f);',
    '  float edge=1.-clamp(abs(f-front)/.06,0.,1.);',
    '  float k=smoothstep(.72,1.,uP);',
    '  vec3 g=vec3(l);',
    '  vec3 pc=mix(mix(g,c,.35)*.82+.1,c,k);',
    '  vec3 col=mix(negShow,pc,pos);',
    '  col+=edge*.06*(1.-k)*vec3(1.,.9,.85)*step(.001,uP);',
    // Leuchttisch unter der Lupe
    '  col=mix(col,col*1.05+.02,uLoupe*inside);',
    // Lichtleck vom rechten Rand (Scroll): Screen-Mischung, auch über dem Papier
    '  float band=smoothstep(1.08-uLeak*1.25,1.3-uLeak*.85,v.x+(v.y-.5)*.28+n*.22)*uLeak;',
    '  vec3 lc=mix(vec3(.94,.24,.08),vec3(1.,.8,.5),smoothstep(.35,1.,band));',
    '  vec3 base=mix(vec3(.957,.945,.92),col,a);',
    '  col=1.-(1.-base)*(1.-lc*band);',
    '  float A=max(a,band*.9);',
    // Korn (nur auf dem Film, bewegt sich nur während der Entwicklung)
    '  float gr=h(px+fract(uT*7.13)*vec2(71.,113.))-.5;',
    '  col+=gr*mix(.09,.03,k)*a;',
    '  gl_FragColor=vec4(clamp(col,0.,1.)*A,A);',
    '}'
  ].join('\n');

  function initHero() {
    var hero = $('[data-hero]');
    var sheet = $('[data-sheet]');
    var paper = $('[data-sheet-paper]');
    var canvas = $('[data-sheet-canvas]');
    var loupe = $('[data-loupe]');
    var steps = $$('.timer-steps li');
    var timeEl = $('[data-timer-time]');
    var replay = $('[data-timer-replay]');
    if (!hero || !sheet || !paper) return;
    $$('.fr', sheet).forEach(function (f, i) { f.style.setProperty('--fi', (i % 5) + Math.floor(i / 5) * 1.5); });

    var lit = false;
    function setStep(p) {
      var idx = p >= 1 ? 3 : p < 0.45 ? 0 : p < 0.7 ? 1 : 2;
      steps.forEach(function (li, i) { li.classList.toggle('is-active', i === idx); li.classList.toggle('is-done', i < idx); });
      if (timeEl) { var s = Math.round(p * 90); timeEl.textContent = pad(Math.floor(s / 60)) + ':' + pad(s % 60); }
      if (replay) replay.disabled = p < 1;
      if (p >= 0.84 && !lit) { lit = true; hero.classList.add('is-lit'); }
      if (p >= 1) sheet.classList.add('is-developed');
    }
    function reset() {
      lit = false; hero.classList.remove('is-lit'); sheet.classList.remove('is-developed');
      void hero.offsetWidth;
    }
    if (!MOTION) { setStep(1); return; }

    // CSS-Rückfall (ohne WebGL): Bilder entwickeln sich per Filter-Animation
    function cssDevelop() {
      sheet.classList.remove('has-gl');
      var t0 = performance.now(), dur = 3100;
      (function tick(now) { var p = clamp((now - t0) / dur, 0, 1); setStep(p); if (p < 1) requestAnimationFrame(tick); })(t0);
    }
    var gl = null;
    try { gl = canvas.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: true, preserveDrawingBuffer: false }); } catch (e) { gl = null; }
    if (!gl) {
      cssDevelop();
      if (replay) replay.addEventListener('click', function () { reset(); $$('.fr img', sheet).forEach(function (im) { im.style.animation = 'none'; void im.offsetWidth; im.style.animation = ''; }); cssDevelop(); });
      return;
    }
    function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; }
    var prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { cssDevelop(); return; }
    gl.useProgram(prog);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var U = {};
    ['uTex', 'uNoise', 'uP', 'uT', 'uLeak', 'uLoupe', 'uLR', 'uMag', 'uRes', 'uMouse'].forEach(function (k) { U[k] = gl.getUniformLocation(prog, k); });
    gl.uniform1f(U.uMag, LUPE_FAKTOR);

    // Schlieren der Entwicklerwelle: fbm-Rauschen einmalig als kleine Textur
    (function noiseTex() {
      var N = 64, L = 16, lat = new Float32Array(L * L), seed = 11;
      for (var i = 0; i < lat.length; i++) { seed = (seed * 16807) % 2147483647; lat[i] = seed / 2147483647; }
      var g = function (a, b) { return lat[((b % L + L) % L) * L + ((a % L + L) % L)]; };
      var vn = function (x, y) {
        var xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
        var ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
        var a = g(xi, yi), b = g(xi + 1, yi), c = g(xi, yi + 1), d = g(xi + 1, yi + 1);
        return (a + (b - a) * ux) + ((c + (d - c) * ux) - (a + (b - a) * ux)) * uy;
      };
      var data = new Uint8Array(N * N);
      for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
        var qx = x / N * 4.2, qy = y / N * 2.2, s = 0, amp = 0.5;
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
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform1i(U.uTex, 0);

    // --- Atlas: Filmstreifen exakt wie im DOM nachzeichnen ---
    var atlas = document.createElement('canvas'), actx = atlas.getContext('2d');
    var W = 0, H = 0, dprC = 1, texReady = false;
    function offIn(node) { var x = 0, y = 0; while (node && node !== paper) { x += node.offsetLeft; y += node.offsetTop; node = node.offsetParent; } return { x: x, y: y }; }
    function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); c.fill(); }
    function drawCover(c, img, x, y, w, h, rot) {
      var iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
      c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
      if (!iw) { c.fillStyle = '#24211e'; c.fillRect(x, y, w, h); c.restore(); return; }
      if (rot) {
        c.translate(x + w / 2, y + h / 2); c.rotate(-Math.PI / 2);
        var s1 = Math.max(h / iw, w / ih); c.drawImage(img, -iw * s1 / 2, -ih * s1 / 2, iw * s1, ih * s1);
      } else {
        var s2 = Math.max(w / iw, h / ih); c.drawImage(img, x + (w - iw * s2) / 2, y + (h - ih * s2) / 2, iw * s2, ih * s2);
      }
      c.restore();
    }
    var paintedW = 0, paintedH = 0;
    function paintAtlas() {
      W = paper.offsetWidth; H = paper.offsetHeight;
      if (!W || !H) return false;
      paintedW = W; paintedH = H;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var sA = Math.min(dpr * 1.5, 2.5);
      atlas.width = Math.round(W * sA); atlas.height = Math.round(H * sA);
      actx.setTransform(sA, 0, 0, sA, 0, 0);
      actx.clearRect(0, 0, W, H);
      var cq = sheet.offsetWidth / 100;
      $$('[data-strip]', paper).forEach(function (strip) {
        if (!strip.offsetWidth) return;
        var o = offIn(strip), sw = strip.offsetWidth, shh = strip.offsetHeight;
        actx.fillStyle = '#0D0C0B'; actx.fillRect(o.x, o.y, sw, shh);
        // Perforation (wie background der .strip)
        var tw = 2.275 * cq, th = 1.05 * cq;
        actx.fillStyle = '#F4F1EB';
        for (var x = o.x + 0.5 * cq; x < o.x + sw - tw * 0.2; x += tw) {
          var hx = x + tw * 5 / 23, hw = tw * 13 / 23, hh = th * 0.8;
          if (hx + hw > o.x + sw) break;
          rr(actx, hx, o.y + 0.4 * cq + th * 0.1, hw, hh, tw * 2 / 23);
          rr(actx, hx, o.y + shh - 0.4 * cq - th + th * 0.1, hw, hh, tw * 2 / 23);
        }
        // Randbeschriftung
        $$('.strip-edge span', strip).forEach(function (sp) {
          var so = offIn(sp), cs = getComputedStyle(sp);
          actx.font = cs.fontWeight + ' ' + cs.fontSize + ' Epilogue, sans-serif';
          try { actx.letterSpacing = cs.letterSpacing; } catch (e) { /* ältere Browser */ }
          actx.fillStyle = cs.color; actx.textBaseline = 'top';
          var txt = sp.textContent;
          if (sp.parentNode.classList.contains('strip-edge--bottom')) txt = '▸ ' + txt;
          actx.fillText(txt, so.x + parseFloat(cs.paddingLeft || 0), so.y + 0.5);
        });
        $$('.fr', strip).forEach(function (fr) {
          var fo = offIn(fr), im = $('img', fr);
          drawCover(actx, bitmaps.get(im) || im, fo.x, fo.y, fr.offsetWidth, fr.offsetHeight, fr.classList.contains('fr--rot'));
        });
      });
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas);
      return true;
    }
    function size() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      dprC = dpr;
      var w = Math.max(2, Math.round(W * dpr)), h = Math.max(2, Math.round(H * dpr));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      gl.viewport(0, 0, w, h);
      gl.uniform2f(U.uRes, w, h);
    }

    // --- Zustand & Schleife (läuft nur bei Bewegung) ---
    var P = 0, developing = false, t0 = 0, raf = 0, visible = true;
    var leak = 0, leakT = 0, lp = 0, lpT = 0, mx = 0, my = 0, tx = 0, ty = 0;
    function draw(now) {
      if (!texReady) return;
      gl.uniform1f(U.uP, P);
      gl.uniform1f(U.uT, developing ? (now || performance.now()) / 1000 : 3.7);
      gl.uniform1f(U.uLeak, leak);
      gl.uniform1f(U.uLoupe, lp);
      gl.uniform1f(U.uLR, (loupe ? loupe.clientWidth / 2 : 0) * dprC);
      gl.uniform2f(U.uMouse, mx * dprC, (H - my) * dprC);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    function frame(now) {
      raf = 0;
      if (!visible || document.hidden) return;
      var more = false;
      if (developing) {
        var raw = clamp((now - t0) / ENTWICKLUNG_MS, 0, 1);
        P = easeIO(raw); setStep(raw);
        if (raw >= 1) developing = false; else more = true;
      }
      lp += (lpT - lp) * 0.2; mx += (tx - mx) * 0.24; my += (ty - my) * 0.24;
      if (Math.abs(lpT - lp) > 0.003 || Math.abs(tx - mx) > 0.3 || Math.abs(ty - my) > 0.3) more = true; else { lp = lpT; mx = tx; my = ty; }
      leak += (leakT - leak) * 0.22;
      if (Math.abs(leakT - leak) > 0.002) more = true; else leak = leakT;
      if (loupe) loupe.style.transform = 'translate(' + mx.toFixed(1) + 'px,' + my.toFixed(1) + 'px)';
      draw(now);
      if (more) raf = requestAnimationFrame(frame);
    }
    function kick() { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame); }
    function develop() { reset(); P = 0; t0 = performance.now(); developing = true; setStep(0); kick(); }

    // Bilder + Schrift abwarten, dann Atlas zeichnen und entwickeln
    var imgs = $$('[data-strip] .fr img', paper).filter(function (im) { return im.closest('[data-strip]').offsetWidth > 0; });
    // Bilder außerhalb des Hauptthreads dekodieren (ImageBitmap), dann ist drawImage billig
    var bitmaps = new Map();
    var waits = imgs.map(function (im) {
      return new Promise(function (res) {
        var dec = function () {
          if (window.createImageBitmap) createImageBitmap(im).then(function (bm) { bitmaps.set(im, bm); res(); }, res);
          else if (im.decode) im.decode().then(res, res); else res();
        };
        if (im.complete && im.naturalWidth) return dec();
        im.addEventListener('load', dec, { once: true }); im.addEventListener('error', res, { once: true });
      });
    });
    if (document.fonts && document.fonts.load) waits.push(document.fonts.load('640 10px Epilogue').catch(function () {}));
    var started = false;
    var start = function () {
      if (started) return; started = true;
      if (!paintAtlas()) { cssDevelop(); return; }
      size(); texReady = true;
      sheet.classList.add('has-gl');
      draw();
      develop();
    };
    Promise.all(waits).then(start);
    setTimeout(start, 2600); // spätestens dann – fehlende Bilder bleiben dunkel

    var rsT = 0;
    if ('ResizeObserver' in window) new ResizeObserver(function () {
      if (!texReady) return;
      clearTimeout(rsT);
      rsT = setTimeout(function () { if (paper.offsetWidth === paintedW && paper.offsetHeight === paintedH) return; if (paintAtlas()) { size(); draw(); } }, 160);
    }).observe(paper);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) kick(); }, { rootMargin: '60px 0px' }).observe(hero);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) kick(); });
    if (replay) replay.addEventListener('click', develop);
    canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); texReady = false; sheet.classList.remove('has-gl', 'is-looking'); sheet.classList.add('is-developed'); hero.classList.add('is-lit'); });

    // Lichtleck: wächst, während der Hero aus dem Bild scrollt
    window.addEventListener('scroll', function () {
      var hgt = hero.offsetHeight || 1;
      leakT = Math.pow(clamp(window.pageYOffset / (hgt * 0.85), 0, 1), 1.4);
      kick();
    }, { passive: true });

    // Fadenzähler: folgt der Maus mit Feder, nur bei feinem Zeiger
    if (fine && loupe) {
      var rotRad = 0;
      var readRot = function () {
        var m = getComputedStyle(sheet).transform;
        var mm = /matrix\(([^,]+),([^,]+)/.exec(m || '');
        rotRad = mm ? Math.atan2(parseFloat(mm[2]), parseFloat(mm[1])) : 0;
      };
      readRot(); window.addEventListener('resize', readRot);
      var toLocal = function (x, y) {
        var r = paper.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        var dx = x - cx, dy = y - cy, c = Math.cos(-rotRad), s = Math.sin(-rotRad);
        return { x: dx * c - dy * s + W / 2, y: dx * s + dy * c + H / 2 };
      };
      paper.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse' || !texReady) return;
        var p = toLocal(e.clientX, e.clientY);
        if (!sheet.classList.contains('is-looking')) { mx = p.x; my = p.y; }
        tx = p.x; ty = p.y; lpT = 1;
        sheet.classList.add('is-looking');
        kick();
      });
      paper.addEventListener('pointerleave', function () { lpT = 0; sheet.classList.remove('is-looking'); kick(); });
    }
  }

  /* ------------------------------------------------------------------
     HALTUNG: „Licht an“ – Hintergrund kippt von Dunkelkammer zu Papier,
     ein Lichtleck läuft durch, danach zieht jedes Wort Schärfe.
     ------------------------------------------------------------------ */
  function initStatement() {
    var sec = $('[data-statement]'), p = $('[data-words]');
    if (!sec || !p) return;
    var words = p.textContent.trim().split(/\s+/);
    p.textContent = '';
    var spans = words.map(function (w, i) {
      var s = el('span', 'w', w);
      p.appendChild(s);
      if (i < words.length - 1) p.appendChild(document.createTextNode(' '));
      return s;
    });
    if (!MOTION || !hasGSAP) return;
    sec.classList.add('is-scrub');
    var dark = $('[data-st-dark]', sec), leak = $('[data-leak]', sec);
    var lit = -1;
    function setLit(n) { if (n === lit) return; lit = n; spans.forEach(function (s, i) { s.classList.toggle('is-on', i < n); }); }
    ScrollTrigger.create({
      trigger: sec, start: 'top top', end: 'bottom bottom',
      onUpdate: function (self) {
        var pr = self.progress;
        var s = clamp(pr / 0.26, 0, 1), e = easeIO(s);
        dark.style.opacity = (1 - e).toFixed(3);
        leak.style.opacity = Math.sin(s * Math.PI).toFixed(3);
        leak.style.transform = 'translateX(' + ((0.55 - e * 1.25) * 100).toFixed(1) + '%)';
        sec.classList.toggle('is-light', s > 0.55);
        setLit(Math.round(clamp((pr - 0.24) / 0.58, 0, 1) * spans.length));
        sec.classList.toggle('is-signed', pr > 0.86);
        if (window.__headerUpdate) window.__headerUpdate();
      }
    });
  }

  /* ------------------------------------------------------------------
     GALERIE: Leuchttisch mit Kapitel-Tabs, FLIP beim Filtern
     ------------------------------------------------------------------ */
  function initGallery() {
    var tablist = $('.g-tabs');
    var tabs = $$('.g-tab');
    var ink = $('[data-tab-ink]');
    var panel = $('[data-g-panel]');
    var grid = $('[data-g-grid]');
    var items = $$('.g-item', grid);
    var status = $('[data-g-status]');
    var odo = makeOdo($('[data-g-odo]'));
    if (!tablist || !grid) return;
    var current = 'alle';
    items.forEach(function (it) { $('.g-open', it).appendChild(mark('g-loop', 'g-mark')); });

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
            var h1 = budget / sum;
            if (h1 <= T) { rows.push({ r: row, h: h1 }); row = []; sum = 0; }
            return;
          }
        }
        rows.push({ r: row, h: h }); row = []; sum = 0;
      });
      if (row.length) rows.push({ r: row, h: Math.min(T, (budget - gap * (row.length - 1)) / sum) });
      rows.forEach(function (R) { R.r.forEach(function (o) { o.it.style.width = Math.floor(o.ar * R.h) + 'px'; }); });
      grid.classList.add('is-justified');
    }
    justify();
    if ('ResizeObserver' in window) {
      var lastW = 0;
      new ResizeObserver(function () { if (grid.clientWidth !== lastW) { lastW = grid.clientWidth; justify(); } }).observe(grid);
    } else window.addEventListener('resize', justify);

    function moveInk(tab, animate) {
      if (!ink || !tab) return;
      var name = $('.g-tab-name', tab);
      ink.classList.toggle('is-moving', !!animate && MOTION);
      ink.style.setProperty('--x', (tab.offsetLeft + name.offsetLeft) + 'px');
      ink.style.setProperty('--s', (name.offsetWidth / 100).toFixed(3));
      if (animate && MOTION) { ink.classList.remove('is-redraw'); void ink.getBoundingClientRect(); ink.classList.add('is-redraw'); }
    }
    function matches(it, f) { return f === 'alle' || it.getAttribute('data-cat') === f; }

    function select(tab, focus) {
      var filter = tab.getAttribute('data-filter');
      tabs.forEach(function (t) { var on = t === tab; t.setAttribute('aria-selected', on ? 'true' : 'false'); t.tabIndex = on ? 0 : -1; });
      panel.setAttribute('aria-labelledby', tab.id);
      if (focus) tab.focus();
      moveInk(tab, true);
      var tl = tablist.getBoundingClientRect(), tr = tab.getBoundingClientRect();
      if (tr.left < tl.left || tr.right > tl.right) tablist.scrollTo({ left: tablist.scrollLeft + (tr.left - tl.left) - 24, behavior: MOTION ? 'smooth' : 'auto' });
      if (filter === current) return;
      current = filter;
      var before = new Map();
      items.forEach(function (it) { if (!it.hidden) before.set(it, it.getBoundingClientRect()); });
      var leaving = items.filter(function (it) { return !it.hidden && !matches(it, filter); });
      var apply = function () {
        var shown = [];
        items.forEach(function (it) { var on = matches(it, filter); it.hidden = !on; it.classList.remove('is-leaving'); if (on) shown.push(it); });
        justify();
        if (MOTION && grid.animate) {
          var vh = window.innerHeight;
          shown.forEach(function (it, i) {
            var a = it.getBoundingClientRect(), b = before.get(it);
            it.classList.add('is-in');
            if (a.bottom < -200 || a.top > vh + 200) return;
            if (b) {
              var dx = b.left - a.left, dy = b.top - a.top, sx = b.width / a.width, sy = b.height / a.height;
              if (Math.abs(dx) < 1 && Math.abs(dy) < 1 && Math.abs(sx - 1) < 0.01) return;
              it.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + sx + ',' + sy + ')' }, { transform: 'none' }],
                { duration: 640, easing: EASE_IN_OUT, delay: Math.min(i * 16, 160) });
            } else {
              it.animate([{ opacity: 0, transform: 'scale(.96)', filter: 'blur(6px)' }, { opacity: 1, transform: 'none', filter: 'none' }],
                { duration: 560, easing: EASE_OUT, delay: 140 + Math.min(i * 45, 400), fill: 'backwards' });
            }
          });
        } else shown.forEach(function (it) { it.classList.add('is-in'); });
        odo.set(pad(shown.length));
        if (status) status.textContent = shown.length + ' Bilder: ' + $('.g-tab-name', tab).textContent;
        if (hasGSAP) ScrollTrigger.refresh();
      };
      if (MOTION && leaving.length) { leaving.forEach(function (it) { it.classList.add('is-leaving'); }); setTimeout(apply, 170); } else apply();
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
    moveInk(tabs[0], false);
    window.addEventListener('resize', function () { moveInk($('.g-tab[aria-selected="true"]'), false); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { moveInk($('.g-tab[aria-selected="true"]'), false); });

    initLightbox(items);
  }

  /* Lightbox mit FLIP: das Bild fliegt vom Raster auf den Leuchttisch und zurück */
  function initLightbox(items) {
    var dlg = $('[data-lb]');
    if (!dlg || typeof dlg.showModal !== 'function') return;
    var stage = $('[data-lb-stage]', dlg), fig = $('[data-lb-fig]', dlg), img = $('[data-lb-img]', dlg), cap = $('[data-lb-cap]', dlg);
    var wrap = $('.lb-imgwrap', dlg);
    var count = $('[data-lb-count]', dlg), strip = $('[data-lb-strip]', dlg), stripWrap = $('[data-lb-strip-wrap]', dlg);
    var list = [], shownItems = [], idx = 0, opener = null, busy = false, closing = false;

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
        var svg = document.createElementNS(SVGNS, 'svg'); svg.setAttribute('class', 'lb-mark'); svg.setAttribute('viewBox', '0 0 150 100'); svg.setAttribute('preserveAspectRatio', 'none'); svg.setAttribute('aria-hidden', 'true');
        var u = document.createElementNS(SVGNS, 'use'); u.setAttribute('href', '#g-loop'); svg.appendChild(u);
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
      $$('.lb-thumb', strip).forEach(function (b, j) { if (j === i) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
      var cur = $$('.lb-thumb', strip)[i];
      if (cur) {
        var wr = stripWrap.getBoundingClientRect(), br = cur.getBoundingClientRect();
        stripWrap.scrollTo({ left: stripWrap.scrollLeft + (br.left - wr.left) - (wr.width - br.width) / 2, behavior: MOTION && dlg.open ? 'smooth' : 'auto' });
      }
      [i - 1, i + 1].forEach(function (j) { var n = list[(j + list.length) % list.length]; if (n) { var p = new Image(); p.src = n.src; } });
    }
    // Zielrechteck des großen Bildes (so wie CSS es setzt: max 960 px, ganz sichtbar)
    function targetRect(d) {
      var r = wrap.getBoundingClientRect();
      var w0 = Math.min(960, d.w), h0 = w0 * d.h / d.w;
      var s = Math.min(1, Math.min(r.width, 960) / w0, r.height / h0);
      var w = w0 * s, h = h0 * s;
      return { left: r.left + (r.width - w) / 2, top: r.top + (r.height - h) / 2, width: w, height: h };
    }
    function fly(src, from, to, dur, ease, done) {
      var f = el('img', 'lb-fly'); f.src = src; f.alt = '';
      f.style.width = to.width + 'px'; f.style.height = to.height + 'px';
      dlg.appendChild(f);
      fig.classList.add('is-flying');
      var a = f.animate([
        { transform: 'translate(' + from.left + 'px,' + from.top + 'px) scale(' + (from.width / to.width) + ',' + (from.height / to.height) + ')' },
        { transform: 'translate(' + to.left + 'px,' + to.top + 'px) scale(1,1)' }
      ], { duration: dur, easing: ease, fill: 'forwards' });
      a.onfinish = function () { done && done(f); };
      return f;
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
        var show = function () { requestAnimationFrame(function () { fig.classList.remove('is-in-start'); fig.classList.add('is-settle'); busy = false; }); };
        var timer = setTimeout(show, 260);
        if (img.decode) img.decode().then(function () { clearTimeout(timer); show(); }, function () { clearTimeout(timer); show(); });
      }, 170);
    }
    function open(it) {
      shownItems = items.filter(function (x) { return !x.hidden; });
      list = shownItems.map(data);
      idx = Math.max(0, shownItems.indexOf(it));
      opener = document.activeElement;
      buildStrip();
      var thumb = $('img', it), from = thumb.getBoundingClientRect();
      closing = false;
      dlg.classList.remove('is-closing');
      if (MOTION) dlg.classList.add('is-entering');
      dlg.showModal();
      dlg.focus();
      if (lenis) lenis.stop();
      root.style.overflow = 'hidden';
      render(idx);
      if (MOTION && from.width && dlg.animate) {
        busy = true;
        it.style.visibility = 'hidden';
        var to = targetRect(list[idx]);
        fly(thumb.currentSrc || thumb.src, from, to, 620, EASE_DRAWER, function (f) {
          fig.classList.remove('is-flying'); f.remove(); busy = false; it.style.visibility = '';
        });
        setTimeout(function () { dlg.classList.remove('is-entering'); }, 240);
      } else dlg.classList.remove('is-entering');
    }
    function close() {
      if (closing) return;
      if (!MOTION) { dlg.close(); return; }
      closing = true;
      var it = shownItems[idx], thumb = it && $('img', it);
      var r = thumb ? thumb.getBoundingClientRect() : null;
      var from = img.getBoundingClientRect();
      dlg.classList.add('is-closing');
      var finish = function () { dlg.classList.remove('is-closing'); if (dlg.open) dlg.close(); };
      if (r && r.width && r.bottom > 0 && r.top < window.innerHeight && from.width && dlg.animate) {
        it.style.visibility = 'hidden';
        fly(img.currentSrc || img.src, { left: from.left, top: from.top, width: from.width, height: from.height }, { left: from.left, top: from.top, width: from.width, height: from.height }, 1, 'linear', function (f) {
          var a = f.animate([
            { transform: 'translate(' + from.left + 'px,' + from.top + 'px) scale(1,1)' },
            { transform: 'translate(' + r.left + 'px,' + r.top + 'px) scale(' + (r.width / from.width) + ',' + (r.height / from.height) + ')' }
          ], { duration: 460, easing: EASE_IN_OUT, fill: 'forwards' });
          a.onfinish = function () { it.style.visibility = ''; f.remove(); finish(); };
        });
      } else setTimeout(finish, 200);
    }
    dlg.addEventListener('close', function () {
      root.style.overflow = '';
      if (lenis) lenis.start();
      fig.classList.remove('is-out', 'is-in-start', 'is-settle', 'is-drag', 'is-flying'); busy = false; closing = false;
      $$('.lb-fly', dlg).forEach(function (f) { f.remove(); });
      items.forEach(function (x) { x.style.visibility = ''; });
      if (opener && opener.focus) opener.focus({ preventScroll: true });
    });
    dlg.addEventListener('cancel', function (e) { e.preventDefault(); close(); });
    dlg.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(idx + 1, 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go(idx - 1, -1); }
      else if (e.key === 'Home') { e.preventDefault(); go(0, -1); }
      else if (e.key === 'End') { e.preventDefault(); go(list.length - 1, 1); }
    });
    dlg.addEventListener('click', function (e) { if ((e.target === stage || e.target === wrap) && !justDragged) close(); });
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
      if (Math.abs(dx) > 70 || v > 0.11) go(idx + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
      else { fig.classList.add('is-settle'); fig.style.transform = ''; fig.style.opacity = ''; }
    };
    stage.addEventListener('pointerup', end);
    stage.addEventListener('pointercancel', end);
  }

  /* ------------------------------------------------------------------
     LOVE STORY: Filmrolle – der Streifen läuft aus der Dose, mit Trägheit
     (Scrub mit Nachlauf), Biegung nach Tempo und Bildern, die sich auf dem
     Weg vom Negativ zum Positiv entwickeln. Unter 900 px: vertikal.
     ------------------------------------------------------------------ */
  function initStory() {
    var section = $('[data-story]');
    if (!section) return;
    var frames = $$('.sf', section);
    var odo = makeOdo($('[data-story-odo]'));
    if (!MOTION) return;
    // Negativ-Kopie über jedes Bild legen (gleiche Datei, schon im Cache)
    var negs = frames.map(function (fr) {
      var im = $('.sf-frame img', fr), pic = el('span', 'sf-pic');
      im.parentNode.insertBefore(pic, im); pic.appendChild(im);
      var n = im.cloneNode(); n.className = 'sf-neg'; n.alt = ''; n.setAttribute('aria-hidden', 'true'); n.removeAttribute('fetchpriority');
      pic.appendChild(n);
      return n;
    });
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (en) {
        en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
      }, { threshold: 0.35 });
      frames.forEach(function (f) { io.observe(f); });
    }
    if (!hasGSAP) return;
    var stage = $('[data-story-stage]', section), track = $('[data-story-track]', section), can = $('[data-story-can]', section), label = $('[data-can-label]', section);
    var outro = $('.story-outro', section), film = $('[data-story-film]', section);
    var mm = gsap.matchMedia();
    mm.add('(min-width: 900px)', function () {
      root.classList.add('story-h'); section.classList.add('is-strecke');
      var startX = 0, endX = 0;
      var measure = function () {
        var sw = stage.clientWidth || window.innerWidth;
        var canLeft = can.offsetLeft || sw * 0.8;
        startX = canLeft - 70;
        film.style.clipPath = 'inset(-40px ' + Math.round(sw - canLeft - can.offsetWidth * 0.32) + 'px -40px 0)';
        var outroCenter = outro.offsetLeft + outro.offsetWidth / 2;
        endX = sw * 0.4 - outroCenter;
        section.style.setProperty('--story-h', Math.round((window.innerHeight) + (startX - endX) * 1.05) + 'px');
      };
      measure();
      ScrollTrigger.addEventListener('refreshInit', measure);
      var skewTo = gsap.quickTo(track, 'skewX', { duration: 0.7, ease: 'power3' });
      var rest = 0;
      var tween = gsap.fromTo(track, { x: function () { return startX; } }, {
        x: function () { return endX; }, ease: 'none',
        scrollTrigger: {
          trigger: section, start: 'top top', end: 'bottom bottom', scrub: 1.1, invalidateOnRefresh: true,
          onUpdate: function (self) {
            if (label) label.setAttribute('transform', 'translate(' + (-((self.progress * 1300) % 108)).toFixed(1) + ' 0)');
            skewTo(clamp(self.getVelocity() / -420, -3.2, 3.2));
            clearTimeout(rest); rest = setTimeout(function () { skewTo(0); }, 140);
          }
        }
      });
      frames.forEach(function (fr, i) {
        gsap.fromTo(negs[i], { clipPath: 'inset(0% 0% 0% 0%)' }, {
          clipPath: 'inset(0% 0% 0% 100%)', ease: 'none',
          scrollTrigger: { trigger: fr, containerAnimation: tween, start: 'left 74%', end: 'center 46%', scrub: true }
        });
        ScrollTrigger.create({ trigger: fr, containerAnimation: tween, start: 'left 60%', end: 'right 60%', onToggle: function (self) { if (self.isActive) odo.set(pad(i + 1)); } });
      });
      return function () {
        ScrollTrigger.removeEventListener('refreshInit', measure);
        section.style.removeProperty('--story-h');
        root.classList.remove('story-h'); section.classList.remove('is-strecke');
        gsap.set(track, { clearProps: 'transform' });
        film.style.clipPath = '';
        negs.forEach(function (n) { gsap.set(n, { clearProps: 'clipPath' }); });
      };
    });
  }

  /* ------------------------------------------------------------------
     PAKETE: Konfigurator mit Filmdose – Stunden ziehen den Film heraus,
     Second Shooter stellt eine zweite Dose dazu, Alben stapeln sich.
     ------------------------------------------------------------------ */
  var cfgState = null;
  function initConfigurator() {
    var form = $('[data-cfg-form]');
    if (!form) return;
    var hours = $('[data-hours]'), second = $('[data-second]'), eng = $('[data-engagement]');
    var albums = $$('[data-album]');
    var scene = $('[data-scene]'), tongue = $('[data-tongue]'), tstrip = $('[data-tongue-strip]');
    var canHours = $('[data-can-hours]'), canImgs = $('[data-can-imgs]');
    var out = {
      hoursNum: $('[data-hours-num]'), hint: $('[data-hours-hint]'), secondPrice: $('[data-second-price]'),
      tHours: $('[data-t-hours]'), tSecond: $('[data-t-second]'), tEng: $('[data-t-eng]'), tAlbum: $('[data-t-album]'), tImages: $('[data-t-images]'),
      live: $('[data-price-live]'), no: $('[data-ticket-no]')
    };
    var price = makeOdo($('[data-price]'));
    var presets = $$('[data-preset]');
    var liveTimer = 0;

    // Filmzunge: zwölf Bilder als Negativ-Vorschau
    if (tstrip) {
      ['kleid', 'anstecker', 'schleife', 'altar', 'ringtausch', 'strauss', 'hero', 'baum', 'braut', 'sekt', 'treppe', 'tafel'].forEach(function (n) {
        var s = el('span'), im = el('img');
        im.src = '/arena/fotografie-lichtwerk/assets/img/' + n + '-480.webp'; im.alt = ''; im.width = 480; im.height = 320; im.loading = 'lazy'; im.decoding = 'async';
        s.appendChild(im); tstrip.appendChild(s);
      });
    }
    function setTongue(h) {
      if (!tongue || !tstrip) return;
      var avail = tongue.clientWidth, sw = tstrip.scrollWidth;
      var L = 70 + (h - 2) / 10 * Math.max(0, avail - 70);
      tstrip.style.transform = 'translateX(' + Math.round(L - sw) + 'px)';
    }
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
      hours.style.setProperty('--deg', (s.h * 33) + 'deg');
      hours.setAttribute('aria-valuetext', s.h + ' Stunden');
      out.hoursNum.textContent = s.h;
      out.hint.textContent = hint(s.h);
      out.secondPrice.textContent = s.second ? '+ ' + euro(s.h * PREISE.secondShooterProStunde) : '+ 95 €/h';
      var imgsTxt = nf.format(r.lo) + '–' + nf.format(r.hi);
      setText(out.tHours, s.h + ' Stunden');
      setText(out.tSecond, s.second ? s.h + ' h · Tom Richter' : '–');
      setText(out.tEng, s.eng ? 'ca. 90 Minuten' : '–');
      setText(out.tAlbum, ALBUM_TEXT[s.album]);
      setText(out.tImages, imgsTxt);
      out.no.textContent = pad(s.h) + (s.second ? '1' : '0') + (['keins', 'fineart', 'eltern'].indexOf(s.album)) + (s.eng ? '1' : '0');
      if (canHours) canHours.textContent = s.h + ' h';
      if (canImgs) canImgs.textContent = imgsTxt;
      if (scene) { scene.classList.toggle('has-second', s.second); scene.classList.toggle('has-eng', s.eng); scene.setAttribute('data-album', s.album); }
      setTongue(s.h);
      price.set(euro(r.total));
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
    if ('ResizeObserver' in window && tongue) new ResizeObserver(function () { setTongue(+hours.value); }).observe(tongue);
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
     VERFÜGBARKEIT: Terminbuch mit Fettstift (Demo-Daten)
     ------------------------------------------------------------------ */
  function initAvailability() {
    var card = $('[data-cal]');
    if (!card) return;
    var body = $('[data-cal-body]', card), sel = $('[data-cal-month]', card), cap = $('[data-cal-caption]', card), result = $('[data-cal-result]', card);
    var prev = $('[data-cal-prev]', card), next = $('[data-cal-next]', card);
    var readout = $('[data-readout]'), rDate = $('[data-readout-date]'), rState = $('[data-readout-state]');
    var MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
    var fmtLong = new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    var fmtShort = new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: 'numeric', month: 'short' });
    var fmtRead = new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var first = new Date(today.getFullYear(), today.getMonth(), 1);
    var last = new Date(today.getFullYear(), today.getMonth() + VERFUEGBARKEIT.monateVoraus + 1, 0);
    var view = new Date(first), selected = null, focusDate = null, freshSel = false;

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
        b.appendChild(el('span', 'day-n', String(d)));
        b.setAttribute('data-date', iso(date));
        if (!inRange(date)) {
          b.disabled = true;
          b.setAttribute('aria-label', fmtLong.format(date) + ', nicht wählbar');
        } else {
          var s = status(date);
          b.setAttribute('data-s', s);
          b.setAttribute('aria-label', fmtLong.format(date) + ', ' + LABEL[s]);
          b.setAttribute('aria-pressed', same(date, selected) ? 'true' : 'false');
          if (same(date, selected)) { var mk = mark('g-loop', 'day-mark'); if (!freshSel || !MOTION) mk.style.animation = 'none'; b.appendChild(mk); }
        }
        if (same(date, today)) b.classList.add('is-today');
        b.tabIndex = same(date, focusDate) ? 0 : -1;
        if (same(date, focusDate)) focusBtn = b;
        td.appendChild(b); tr.appendChild(td); cells++;
        if (cells % 7 === 0) { body.appendChild(tr); tr = el('tr'); }
      }
      if (cells % 7 !== 0) { while (cells % 7 !== 0) { tr.appendChild(el('td')); cells++; } body.appendChild(tr); }
      freshSel = false;
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
      selected = date; focusDate = date; freshSel = true;
      if (date.getMonth() !== view.getMonth() || date.getFullYear() !== view.getFullYear()) view = new Date(date.getFullYear(), date.getMonth(), 1);
      render(fromKey !== false);
      showResult(date);
    }
    function nearbyFree(date) {
      var res = [];
      for (var k = 1; k <= 28 && res.length < 3; k++) {
        [k, -k].forEach(function (off) {
          if (res.length >= 3) return;
          var c = new Date(date.getFullYear(), date.getMonth(), date.getDate() + off);
          var dow = c.getDay();
          if (inRange(c) && (dow === 5 || dow === 6 || dow === 0) && status(c) === 'frei') res.push(c);
        });
      }
      return res.sort(function (a, b) { return a - b; });
    }
    function showResult(date) {
      var s = status(date);
      if (readout) {
        rDate.textContent = fmtRead.format(date);
        rState.textContent = LABEL[s] + '.';
        readout.setAttribute('data-s', s);
        if (MOTION) { readout.classList.remove('is-swap'); void readout.offsetWidth; readout.classList.add('is-swap'); }
      }
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
      if (MOTION) { result.classList.remove('is-new'); void result.offsetWidth; result.classList.add('is-new'); }
    }
    function requestBtn(date, label, s) {
      var b = el('a', 'btn btn--ink btn--sm');
      b.appendChild(el('span', null, label));
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
      else if (e.key === 'PageUp' || e.key === 'PageDown') { e.preventDefault(); focusDate = d; goMonth(e.key === 'PageUp' ? -1 : 1, true); return; }
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

    // Leerer Zustand mit Abkürzung: die nächsten freien Samstage
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
     Stimmen: langsame Überblendung mit Unschärfe
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
    var stage = $('[data-quotes-stage]'), x0 = null;
    stage.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') x0 = e.clientX; });
    stage.addEventListener('pointerup', function (e) { if (x0 === null) return; var d = e.clientX - x0; x0 = null; if (Math.abs(d) > 50) show(i + (d < 0 ? 1 : -1)); });
  }

  /* ------------------------------------------------------------------
     REGION: Die Elbe zeichnet sich mit dem Scrollen, Orte tauchen auf
     ------------------------------------------------------------------ */
  function initRegion() {
    var map = $('[data-map]'), elbe = $('[data-elbe]');
    if (!map || !elbe || !MOTION || !hasGSAP) return;
    map.classList.add('is-scrub');
    var places = $$('.map-places g', map).map(function (g) { return { g: g, at: parseFloat(g.getAttribute('data-at')) || 0 }; });
    var set = function (p) {
      elbe.style.strokeDashoffset = (1 - p).toFixed(4);
      places.forEach(function (o) { o.g.classList.toggle('is-on', p >= o.at); });
    };
    set(0);
    ScrollTrigger.create({ trigger: map, start: 'top 85%', end: 'bottom 55%', scrub: 0.6, onUpdate: function (self) { set(self.progress); }, onRefresh: function (self) { set(self.progress); } });
  }

  /* Laufband „Außerdem“: Tempo und Richtung folgen dem Scrollen */
  function initMarquee() {
    var box = $('[data-marquee]'), track = $('[data-marquee-track]');
    if (!box || !track || !MOTION || !track.getAnimations) return;
    var anim = track.getAnimations()[0];
    if (!anim) return;
    var rate = 1, target = 1, dir = 1, raf = 0, vis = false;
    if (lenis) lenis.on('scroll', function (e) { target = 1 + Math.min(Math.abs(e.velocity || 0) * 0.35, 7); dir = (e.direction || 1) < 0 ? -1 : 1; if (vis && !raf) raf = requestAnimationFrame(loop); });
    function loop() {
      raf = 0;
      target += (1 - target) * 0.06;
      rate += (target * dir - rate) * 0.1;
      anim.playbackRate = rate;
      if (vis && (Math.abs(target - 1) > 0.01 || Math.abs(rate - dir) > 0.01)) raf = requestAnimationFrame(loop);
    }
    new IntersectionObserver(function (en) { vis = en[0].isIntersecting; if (vis) anim.play(); else anim.pause(); }).observe(box);
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
     Mikro-Interaktionen: kontextueller Cursor, magnetische Buttons
     ------------------------------------------------------------------ */
  function initCursor() {
    if (!MOTION || !fine) return;
    var c = el('div', 'cursor'); c.setAttribute('aria-hidden', 'true');
    document.body.appendChild(c);
    var x = -100, y = -100, tx = -100, ty = -100, raf = 0, label = '';
    function loop() {
      raf = 0;
      x += (tx - x) * 0.22; y += (ty - y) * 0.22;
      c.style.translate = x.toFixed(1) + 'px ' + y.toFixed(1) + 'px';
      if (Math.abs(tx - x) > 0.4 || Math.abs(ty - y) > 0.4) raf = requestAnimationFrame(loop);
    }
    document.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      tx = e.clientX; ty = e.clientY;
      var t = e.target.closest && e.target.closest('[data-cursor]');
      var l = t ? t.getAttribute('data-cursor') : '';
      if (l !== label) { label = l; if (l) { c.textContent = l; x = tx; y = ty; } c.classList.toggle('is-on', !!l); }
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
    document.addEventListener('pointerleave', function () { label = ''; c.classList.remove('is-on'); });
    window.addEventListener('scroll', function () { if (label) { label = ''; c.classList.remove('is-on'); } }, { passive: true });
  }
  function initMagnet() {
    if (!MOTION || !fine) return;
    $$('[data-magnet]').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse') return;
        var r = b.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) * 0.22, dy = (e.clientY - (r.top + r.height / 2)) * 0.3;
        b.style.translate = dx.toFixed(1) + 'px ' + dy.toFixed(1) + 'px';
      });
      b.addEventListener('pointerleave', function () { b.style.translate = ''; });
    });
  }

  /* ------------------------------------------------------------------
     Reveal: „entwickeln“ (Dichte + Schärfe), in Gruppen gestaffelt
     ------------------------------------------------------------------ */
  var revealIO = null;
  function initReveal() {
    var targets = $$('[data-reveal], .g-item, .process-list li');
    if (!('IntersectionObserver' in window) || OFF) { targets.forEach(function (t) { t.classList.add('is-in'); }); return; }
    revealIO = new IntersectionObserver(function (entries) {
      var batch = entries.filter(function (e) { return e.isIntersecting; });
      batch.forEach(function (en, i) {
        var t = en.target;
        if (batch.length > 1) t.style.setProperty('--d', Math.min(i * 60, 480) + 'ms');
        t.classList.add('is-in');
        revealIO.unobserve(t);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    targets.forEach(function (t) { revealIO.observe(t); });
    // Sicherheitsnetz: nichts bleibt dauerhaft unentwickelt
    setTimeout(function () { targets.forEach(function (t) { var r = t.getBoundingClientRect(); if (r.top < window.innerHeight && r.bottom > 0) t.classList.add('is-in'); }); }, 2000);
  }

  /* ------------------------------------------------------------------
     Start in Etappen
     ------------------------------------------------------------------ */
  /* Nachgezeichnete Abschnitte (content-visibility) ändern ihre Höhe: Trigger neu messen */
  function initLazySections() {
    if (!hasGSAP || !('ResizeObserver' in window)) return;
    var t = 0, seen = new Map();
    var ro = new ResizeObserver(function (en) {
      var changed = false;
      en.forEach(function (e) { var h = Math.round(e.contentRect.height); if (seen.get(e.target) !== h) { if (seen.has(e.target)) changed = true; seen.set(e.target, h); } });
      if (changed) { clearTimeout(t); t = setTimeout(function () { ScrollTrigger.refresh(); }, 220); }
    });
    $$('.packages, .avail, .about, .voices, .region, .faq, .contact, .site-footer').forEach(function (s) { ro.observe(s); });
  }

  function boot() {
    try { initScroll(); } catch (e) { /* weiter ohne Smooth Scroll */ }
    initMenu();
    initRoll();
    // Erst zeichnen lassen; Header und Hero bekommen eigene Tasks, danach der Rest in Häppchen
    var queue = [initHeader, function initHeroSafe() { try { initHero(); } catch (e) { if (window.console) console.error(e); } },
      initStatement, initGallery, initStory, initConfigurator, initAvailability, initQuotes, initRegion, initMarquee, initForm, initCursor, initMagnet, initReveal, initLazySections, function () {
      window.__lichtwerkReady = true;
      if (hasGSAP) {
        ScrollTrigger.refresh();
        if (document.readyState !== 'complete') window.addEventListener('load', function () { ScrollTrigger.refresh(); });
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
      }
    }];
    var idle = window.requestIdleCallback ? function (f) { requestIdleCallback(f, { timeout: 120 }); } : function (f) { setTimeout(f, 16); };
    var next = function () {
      var fn = queue.shift();
      if (!fn) return;
      try { fn(); } catch (e) { if (window.console) console.error(e); }
      if (queue.length) idle(next);
    };
    requestAnimationFrame(function () { setTimeout(next, 0); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
