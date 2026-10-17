/* ==========================================================================
   KAISER Barbershop · Modell „Messing“ – Gestaltungsidee „Schaufenster-Vergoldung“
   Ohne Build-Schritt. Optional: GSAP + ScrollTrigger, Lenis. Eigenes WebGL (Blattgold).
   ========================================================================== */
(function () {
  'use strict';
  window.__kaiserReady = true;

  /* ------------------------------------------------------------------
     Stammdaten – hier anpassen (Preise in €, Dauer in Minuten)
     ------------------------------------------------------------------ */
  var SERVICES = {
    haarschnitt: { name: 'Haarschnitt', dur: 45, price: 38 },
    bart: { name: 'Bart', dur: 30, price: 26 },
    kombi: { name: 'Kombi: Schnitt & Bart', dur: 75, price: 58 },
    rasur: { name: 'Klassische Nassrasur', dur: 40, price: 36 }
  };
  /* Arbeitstage je Barbier (0 = So … 6 = Sa). „meister“ = Meisterzuschlag. */
  var BARBERS = {
    murat: { name: 'Murat Kaiser', days: [2, 3, 4, 5], meister: true },
    deniz: { name: 'Deniz Yilmaz', days: [2, 3, 5, 6] },
    samir: { name: 'Samir Haddad', days: [2, 4, 5, 6] },
    luca: { name: 'Luca Brandt', days: [3, 4, 5, 6] },
    aleks: { name: 'Aleks Nowak', days: [2, 3, 4, 6] },
    jonas: { name: 'Jonas Weber', days: [3, 4, 5, 6] }
  };
  /* Reihenfolge für „Egal – erster freier Stuhl“ (Meister zuletzt) */
  var ANY_ORDER = ['deniz', 'samir', 'luca', 'aleks', 'jonas', 'murat'];
  var MEISTER_AUFSCHLAG = 5;          // € Aufschlag bei Murat
  var HOURS = { 2: [10, 20], 3: [10, 20], 4: [10, 20], 5: [10, 20], 6: [9, 16] }; // Öffnungszeiten [ab, bis] in Stunden
  var SLOT_MIN = 30;                  // Raster der Startzeiten in Minuten
  var DAYS_AHEAD = 7;                 // angezeigte Tage ab heute
  var VORLAUF_MIN = 60;               // heute frühestens in X Minuten buchbar
  var BELEGT_QUOTE = { normal: 0.42, samstag: 0.6 }; // Demo: Anteil belegter Slots (deterministisch erzeugt)
  var TZ = 'Europe/Berlin';

  /* Gestaltung: Barber-Pole-Farben und Blattgold-Parameter */
  var POLE_BANDS = [['#7A1F1F', 0.34], ['#EFE8DC', 0.2], ['#C9A25E', 0.16], ['#EFE8DC', 0.2], ['#1C1715', 0.1]];
  var GOLD = { leaf: 0.24, shade: 0.034, bevel: 0.02 }; // Blattgröße, Schattenversatz, Facette (jeweils in em)

  /* ------------------------------------------------------------------
     Helfer
     ------------------------------------------------------------------ */
  var doc = document.documentElement;
  var qs = function (s, r) { return (r || document).querySelector(s); };
  var qsa = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var smooth = function (a, b, v) { var t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  var easeInOut = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var dprMax = function (m) { return Math.min(window.devicePixelRatio || 1, m || 2); };
  var pad2 = function (n) { return (n < 10 ? '0' : '') + n; };

  var motionOff = doc.classList.contains('motion-off');
  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduced = function () { return motionOff || mqReduce.matches; };
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  var hasGSAP = !!(window.gsap && window.ScrollTrigger);
  var lenis = null;

  function safe(name, fn) {
    try { fn(); } catch (err) { if (window.console) console.warn('[Kaiser] ' + name + ':', err); }
  }
  function visibilityGate(el, onChange, margin) {
    var inView = false;
    var update = function () { onChange(inView && !document.hidden); };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) { inView = entries[entries.length - 1].isIntersecting; update(); }, { rootMargin: margin || '80px 0px' }).observe(el);
    } else { inView = true; }
    document.addEventListener('visibilitychange', update);
    update();
  }
  function headerOffset() { var h = qs('[data-header]'); return h ? h.offsetHeight : 0; }
  function scrollVelocity() { return lenis ? (lenis.velocity || 0) : 0; }
  function idle(fn, timeout) {
    if ('requestIdleCallback' in window) requestIdleCallback(fn, { timeout: timeout || 800 }); else setTimeout(fn, 60);
  }

  /* ------------------------------------------------------------------
     Smooth Scroll (Lenis) + ScrollTrigger
     ------------------------------------------------------------------ */
  function initScroll() {
    if (hasGSAP) gsap.registerPlugin(ScrollTrigger);
    if (!reduced() && window.Lenis) {
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
    var isTop = target.id === 'top';
    var focus = function () {
      if (opts.noFocus) return;
      var f = opts.focusEl || target;
      if (!f.hasAttribute('tabindex') && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(f.tagName)) f.setAttribute('tabindex', '-1');
      f.focus({ preventScroll: true });
    };
    var dest = function () { return isTop ? 0 : target.getBoundingClientRect().top + window.scrollY - headerOffset() + 1; };
    // Ändert sich unterwegs das Layout (spät geladene Bilder/Schriften), landet der Sprung leicht daneben → kurz nachführen.
    var settle = function (again) {
      var off = dest() - window.scrollY;
      if (Math.abs(off) > 3 && again) {
        if (lenis) lenis.scrollTo(dest(), { duration: 0.45, easing: easeInOut, onComplete: function () { settle(false); } });
        else { window.scrollTo({ top: dest(), behavior: 'auto' }); focus(); }
        return;
      }
      focus();
    };
    if (lenis) {
      lenis.scrollTo(dest(), { duration: 1.3, easing: easeInOut, onComplete: function () { settle(true); } });
    } else {
      window.scrollTo({ top: dest(), behavior: reduced() ? 'auto' : 'smooth' });
      setTimeout(function () { settle(true); }, reduced() ? 30 : 700);
    }
  }

  /* ------------------------------------------------------------------
     Header: Zustand, Scroll-Fortschritt, aktive Navigation
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
    ticking = true; requestAnimationFrame(update); // erst im nächsten Frame messen (kein erzwungenes Layout beim Start)

    var links = qsa('.main-nav a'), map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          links.forEach(function (l) { l.removeAttribute('aria-current'); });
          if (map[en.target.id]) map[en.target.id].setAttribute('aria-current', 'true');
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      qsa('main > section[id]').forEach(function (s) { io.observe(s); });
    }
  }

  /* ------------------------------------------------------------------
     Mobiles Menü (dialog: Fokusfalle + Escape nativ)
     ------------------------------------------------------------------ */
  function initMenu() {
    var dialog = qs('#menu'), openBtn = qs('[data-menu-open]');
    if (!dialog || !openBtn || typeof dialog.showModal !== 'function') return;
    qsa('.menu-list li', dialog).forEach(function (li, i) { li.style.setProperty('--i', i); });
    var closing = false;
    var open = function () { dialog.showModal(); openBtn.setAttribute('aria-expanded', 'true'); if (lenis) lenis.stop(); };
    var close = function (after) {
      if (closing || !dialog.open) return;
      closing = true;
      dialog.classList.add('is-closing');
      setTimeout(function () {
        dialog.classList.remove('is-closing');
        dialog.close();
        closing = false;
        openBtn.setAttribute('aria-expanded', 'false');
        if (lenis) lenis.start();
        if (typeof after === 'function') after(); else openBtn.focus();
      }, motionOff ? 0 : 200);
    };
    openBtn.addEventListener('click', open);
    qs('[data-menu-close]', dialog).addEventListener('click', function () { close(); });
    dialog.addEventListener('cancel', function (e) { e.preventDefault(); close(); });
    dialog.addEventListener('click', function (e) {
      var a = e.target.closest('a');
      if (!a) return;
      var href = a.getAttribute('href') || '';
      if (href.charAt(0) !== '#') return;
      e.preventDefault(); e.stopPropagation();
      var target = document.getElementById(href.slice(1));
      close(function () { if (target) { scrollToTarget(target); if (history.pushState) history.pushState(null, '', href); } });
    });
    window.matchMedia('(min-width: 1024px)').addEventListener('change', function (e) { if (e.matches && dialog.open) close(); });
  }


  /* ------------------------------------------------------------------
     Mikro-Interaktionen: Zeichen-Rollen, magnetische Plakette
     ------------------------------------------------------------------ */
  function initRoll() {
    if (!finePointer.matches || reduced()) return;
    qsa('[data-roll]').forEach(function (el) {
      var text = el.textContent.replace(/\s+/g, ' ').trim();
      if (!text) return;
      var roll = document.createElement('span'); roll.className = 'roll'; roll.setAttribute('aria-hidden', 'true');
      Array.prototype.forEach.call(text, function (ch, i) {
        var c = document.createElement('span'); c.className = 'roll-c'; c.style.setProperty('--i', i);
        var a = document.createElement('span'); a.textContent = ch === ' ' ? ' ' : ch;
        c.appendChild(a); c.appendChild(a.cloneNode(true)); roll.appendChild(c);
      });
      var sr = document.createElement('span'); sr.className = 'sr-only'; sr.textContent = text;
      el.textContent = ''; el.appendChild(roll); el.appendChild(sr);
    });
  }
  function initMagnet() {
    if (!finePointer.matches || reduced()) return;
    qsa('[data-magnet]').forEach(function (el) {
      var x = 0, y = 0, tx = 0, ty = 0, raf = 0;
      var loop = function () {
        x += (tx - x) * 0.2; y += (ty - y) * 0.2;
        el.style.translate = x.toFixed(2) + 'px ' + y.toFixed(2) + 'px';
        if (Math.abs(tx - x) > 0.05 || Math.abs(ty - y) > 0.05) raf = requestAnimationFrame(loop); else raf = 0;
      };
      el.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse') return;
        var r = el.getBoundingClientRect();
        tx = (e.clientX - (r.left + r.width / 2)) * 0.24; ty = (e.clientY - (r.top + r.height / 2)) * 0.32;
        if (!raf) raf = requestAnimationFrame(loop);
      });
      el.addEventListener('pointerleave', function () { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(loop); });
    });
  }

  /* ------------------------------------------------------------------
     Hero: Klingenwinkel, Türschild (Pendel), Siegel, Durchblick-Parallaxe
     ------------------------------------------------------------------ */
  var Hero = { pointer: null }; // gemeinsamer Zeiger für Blattgold und Durchblick
  function initHero() {
    var hero = qs('[data-hero]'), sign = qs('[data-sign]');
    if (!hero || !sign) return;
    // Klinge entlang der Schnittkante ausrichten (Kante läuft von (X, -25 %) nach (X - 26 %, 125 %))
    var r = sign.getBoundingClientRect();
    if (r.width) sign.style.setProperty('--blade-rot', (Math.atan2(1.5 * r.height, -0.26 * r.width) * 180 / Math.PI).toFixed(1) + 'deg');
    if (reduced()) return;

    // Türschild: gedämpftes Pendel, angestoßen von Scroll-Tempo und Zeiger
    var door = qs('[data-door]');
    if (door) {
      var ang = 0, vel = 0, raf = 0, last = 0, lastY = window.scrollY, ready = false, near = false;
      var STIFF = 52, DAMP = 1.6;
      setTimeout(function () { ready = true; }, 1750); // erst nach dem Einschwingen per CSS
      var tick = function (t) {
        var dt = last ? Math.min(0.04, (t - last) / 1000) : 0.016; last = t;
        vel += (-ang * STIFF - vel * DAMP) * dt; ang += vel * dt;
        door.style.transform = 'rotate(' + ang.toFixed(2) + 'deg)';
        if (Math.abs(ang) > 0.02 || Math.abs(vel) > 0.05) raf = requestAnimationFrame(tick); else { raf = 0; last = 0; door.style.transform = ''; }
      };
      var kick = function (dv) { if (!ready) return; vel = clamp(vel + dv, -90, 90); if (!raf) raf = requestAnimationFrame(tick); };
      window.addEventListener('scroll', function () { var y = window.scrollY, d = y - lastY; lastY = y; if (y < window.innerHeight) kick(clamp(d, -40, 40) * 0.9); }, { passive: true });
      if (finePointer.matches) hero.addEventListener('pointermove', function (e) {
        var b = door.getBoundingClientRect(), inside = e.clientX > b.left - 30 && e.clientX < b.right + 30 && e.clientY > b.top && e.clientY < b.bottom + 20;
        if (inside && !near) kick(clamp(e.movementX || 0, -30, 30) * 1.6);
        near = inside;
      });
    }
    // Siegel dreht sich mit dem Scroll, Durchblick folgt dem Zeiger (Tiefe hinter der Scheibe)
    if (hasGSAP) gsap.to('.seal-ring', { rotation: 150, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.4 } });
    var slitImg = qs('[data-hero-slit] img');
    if (finePointer.matches) {
      var px = 0, py = 0, tx = 0, ty = 0, sraf = 0;
      var sl = function () {
        px += (tx - px) * 0.08; py += (ty - py) * 0.08;
        if (slitImg) slitImg.style.transform = 'translate3d(' + (px * -14).toFixed(2) + 'px,' + (py * -10).toFixed(2) + 'px,0) scale(1.07)';
        if (Math.abs(tx - px) > 0.002 || Math.abs(ty - py) > 0.002) sraf = requestAnimationFrame(sl); else sraf = 0;
      };
      hero.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse') return;
        tx = e.clientX / window.innerWidth * 2 - 1; ty = e.clientY / window.innerHeight * 2 - 1;
        Hero.pointer = { x: e.clientX, y: e.clientY };
        if (Hero.onPointer) Hero.onPointer();
        if (!sraf) sraf = requestAnimationFrame(sl);
      });
    }
  }

  /* ------------------------------------------------------------------
     Blattgold (WebGL): Mattgold mit Blattkanten, Glanzgold-Kontur,
     ochsenblutroter Blockschatten. Licht folgt Maus (Desktop) bzw. Scroll.
     Rendert nur bei Bedarf – keine Dauerschleife.
     ------------------------------------------------------------------ */
  var GOLD_VS = 'attribute vec2 p;varying vec2 vUv;void main(){vUv=vec2(p.x*.5+.5,.5-p.y*.5);gl_Position=vec4(p,0.,1.);}';
  var GOLD_FS = [
    '#ifdef GL_FRAGMENT_PRECISION_HIGH', 'precision highp float;', '#else', 'precision mediump float;', '#endif',
    'uniform sampler2D uMask;uniform sampler2D uBlur;uniform vec2 uRes;uniform vec2 uBt;uniform vec2 uShade;uniform vec2 uLight;',
    'uniform float uEm;uniform float uLeaf;uniform float uSweep;uniform float uH;varying vec2 vUv;',
    'float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}',
    'float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x),mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x),f.y);}',
    'void main(){',
    ' vec2 uv=vUv;float m=texture2D(uMask,uv).r;',
    ' float s1=texture2D(uMask,uv-uShade*.34).r;float s2=texture2D(uMask,uv-uShade*.67).r;float s3=texture2D(uMask,uv-uShade).r;',
    ' float sd=max(s1,max(s2,s3));',
    ' if(m<.004&&sd<.004){gl_FragColor=vec4(0.);return;}',
    ' vec2 px=uv*uRes;',
    ' float bl=texture2D(uBlur,uv-vec2(uBt.x,0.)).r;float br=texture2D(uBlur,uv+vec2(uBt.x,0.)).r;',
    ' float bu=texture2D(uBlur,uv-vec2(0.,uBt.y)).r;float bd=texture2D(uBlur,uv+vec2(0.,uBt.y)).r;float b=texture2D(uBlur,uv).r;',
    ' vec2 gr=vec2(br-bl,bd-bu);',
    ' float edge=(1.-smoothstep(.42,.9,b))*m;',
    ' vec2 g=px/(uEm*uLeaf);float row=floor(g.y);g.x+=mod(row,2.)*.43;vec2 cell=floor(g);vec2 f=fract(g);',
    ' float r1=h21(cell);float r2=h21(cell+7.13);vec2 tilt=(vec2(r1,r2)-.5)*.18;',
    ' float seam=1.-smoothstep(0.,.03,min(min(f.x,1.-f.x),min(f.y,1.-f.y)));',
    ' vec2 q=px/(uEm*.045);vec2 cr=vec2(vn(q),vn(q+19.7))-.5;float grain=vn(px/(uEm*.09));',
    ' vec3 N=normalize(vec3(-gr*3.4*(.35+edge)+(tilt+cr*.1)*(1.-edge*.85),1.));',
    ' vec3 L=normalize(vec3(uLight,uH)-vec3(px,0.));vec3 Hh=normalize(L+vec3(0.,0.,1.));',
    ' float ndh=max(dot(N,Hh),0.);float dif=max(dot(N,L),0.);',
    ' vec3 deep=vec3(.34,.23,.09);vec3 gold=vec3(.80,.63,.35);vec3 hi=vec3(1.,.94,.78);',
    ' vec3 col=mix(deep,gold,.38+.62*dif);col*=.93+.14*r1;col*=.92+.16*grain;',
    ' col+=vec3(.07,.05,.02)*seam*(1.-edge);',
    ' col+=hi*mix(pow(ndh,22.)*.55,pow(ndh,150.)*1.7,edge);',
    ' float d=(px.x/uRes.x+px.y/uRes.y*.28)-uSweep;col+=hi*exp(-d*d*220.)*.6*(.45+edge);',
    ' vec3 sh=mix(vec3(.16,.04,.04),vec3(.44,.11,.10),s1);float sa=sd*(1.-m);',
    ' gl_FragColor=vec4(col*m+sh*sa,m+sa);',
    '}'
  ].join('\n');

  function initGold() {
    var sign = qs('[data-sign]'), name = qs('[data-sign-name]'), hero = qs('[data-hero]');
    if (!sign || !name || reduced()) return;
    var canvas = document.createElement('canvas');
    var gl = null;
    try { gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false }); } catch (e) { gl = null; }
    if (!gl) return;
    canvas.className = 'sign-gl'; canvas.setAttribute('aria-hidden', 'true');

    var prog, uni = {}, texMask, texBlur, W = 0, H = 0, em = 100, dpr = 1, lost = false;
    var light = { x: 0, y: 0 }, target = { x: 0, y: 0 }, sweep = -0.4, sweepT0 = 0, raf = 0, visible = true, ready = false;

    function shader(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
    function setupGL() {
      prog = gl.createProgram();
      gl.attachShader(prog, shader(gl.VERTEX_SHADER, GOLD_VS)); gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, GOLD_FS));
      gl.linkProgram(prog); if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('link');
      gl.useProgram(prog);
      var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      var loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      ['uMask', 'uBlur', 'uRes', 'uBt', 'uShade', 'uLight', 'uEm', 'uLeaf', 'uSweep', 'uH'].forEach(function (n) { uni[n] = gl.getUniformLocation(prog, n); });
      gl.uniform1i(uni.uMask, 0); gl.uniform1i(uni.uBlur, 1);
      texMask = makeTex(0); texBlur = makeTex(1);
    }
    function makeTex(unit) {
      var t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    }
    /* Schrift einmal in eine Maske rendern (scharf) + weichgezeichnete Viertel-Auflösung für die Facette */
    function buildMask() {
      var nr = name.getBoundingClientRect(), sr = sign.getBoundingClientRect();
      if (!nr.width || !nr.height) return false;
      var cs = getComputedStyle(name);
      var fs = parseFloat(cs.fontSize);
      var padX = fs * 0.08, padY = fs * 0.1;
      var cw = nr.width + padX * 2, ch = nr.height + padY * 2;
      dpr = dprMax(2);
      if (cw * ch * dpr * dpr > 2.6e6) dpr = Math.max(1, Math.sqrt(2.6e6 / (cw * ch)));
      W = Math.round(cw * dpr); H = Math.round(ch * dpr); em = fs * dpr;
      canvas.width = W; canvas.height = H;
      canvas.style.left = (nr.left - sr.left - padX).toFixed(1) + 'px'; canvas.style.top = (nr.top - sr.top - padY).toFixed(1) + 'px';
      canvas.style.width = cw.toFixed(1) + 'px'; canvas.style.height = ch.toFixed(1) + 'px';
      var mk = document.createElement('canvas'); mk.width = W; mk.height = H;
      var c = mk.getContext('2d');
      c.scale(dpr, dpr);
      c.font = cs.fontWeight + ' ' + fs + 'px ' + cs.fontFamily;
      var txt = name.textContent.trim().toUpperCase();
      var ls = parseFloat(cs.letterSpacing) || 0;
      var hasLS = 'letterSpacing' in c;
      if (hasLS) c.letterSpacing = ls + 'px';
      c.textBaseline = 'alphabetic'; c.fillStyle = '#fff';
      var met = c.measureText(txt);
      var A = met.fontBoundingBoxAscent || fs * 0.9, D = met.fontBoundingBoxDescent || fs * 0.25;
      var lh = parseFloat(cs.lineHeight); if (!lh || /normal/.test(cs.lineHeight)) lh = fs * 1.2;
      var pl = parseFloat(cs.paddingLeft) || 0, pr = parseFloat(cs.paddingRight) || 0, pt = parseFloat(cs.paddingTop) || 0;
      var contentW = nr.width - pl - pr;
      var x0 = padX + pl + (contentW - met.width) / 2, base = padY + pt + (lh - (A + D)) / 2 + A;
      if (hasLS || !ls) c.fillText(txt, x0, base);
      else { var x = x0; Array.prototype.forEach.call(txt, function (chr) { c.fillText(chr, x, base); x += c.measureText(chr).width + ls; }); }
      var bw = Math.max(4, Math.round(W / 4)), bh = Math.max(4, Math.round(H / 4));
      var bk = document.createElement('canvas'); bk.width = bw; bk.height = bh;
      var bc = bk.getContext('2d');
      if ('filter' in bc) bc.filter = 'blur(' + Math.max(0.6, fs * GOLD.bevel * dpr / 4).toFixed(2) + 'px)';
      bc.drawImage(mk, 0, 0, bw, bh);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texMask);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, mk);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, texBlur);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bk);
      gl.viewport(0, 0, W, H);
      gl.uniform2f(uni.uRes, W, H); gl.uniform2f(uni.uBt, 1.6 / bw, 1.6 / bh);
      gl.uniform2f(uni.uShade, em * GOLD.shade / W, em * GOLD.shade / H);
      gl.uniform1f(uni.uEm, em); gl.uniform1f(uni.uLeaf, GOLD.leaf); gl.uniform1f(uni.uH, em * 1.25);
      return true;
    }
    function draw() {
      if (lost) return;
      gl.uniform2f(uni.uLight, light.x, light.y); gl.uniform1f(uni.uSweep, sweep);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    function loop(t) {
      raf = 0;
      if (!ready || !visible) return;
      var moving = false;
      light.x += (target.x - light.x) * 0.12; light.y += (target.y - light.y) * 0.12;
      if (Math.abs(target.x - light.x) > 0.5 || Math.abs(target.y - light.y) > 0.5) moving = true;
      if (sweepT0) {
        var p = (t - sweepT0) / 1700;
        sweep = lerp(-0.45, 1.5, easeInOut(clamp(p, 0, 1)));
        if (p < 1) moving = true; else sweepT0 = 0;
      }
      draw();
      if (moving) raf = requestAnimationFrame(loop);
    }
    function kick() { if (!raf && ready && visible) raf = requestAnimationFrame(loop); }
    function aimAt(clientX, clientY) {
      var r = canvas.getBoundingClientRect(); if (!r.width) return;
      target.x = (clientX - r.left) * (W / r.width); target.y = (clientY - r.top) * (H / r.height);
      kick();
    }
    function aimByScroll() {
      var hh = hero ? hero.offsetHeight : window.innerHeight;
      var p = clamp(window.scrollY / (hh * 0.7), 0, 1);
      target.x = W * (0.12 + 0.8 * p); target.y = -H * (0.45 - 0.5 * p);
      kick();
    }

    var start = function () {
      if (!document.fonts || document.fonts.check('400 100px "Bodoni Moda"')) go(); else document.fonts.load('400 100px "Bodoni Moda"').then(go, go);
    };
    var go = function () {
      try { setupGL(); } catch (e) { if (window.console) console.warn('[Kaiser] gold', e); return; }
      // Maske im eigenen Task (hält die Aufgaben kurz)
      setTimeout(function () {
        try { if (!buildMask()) return; } catch (e) { return; }
        sign.appendChild(canvas);
        light.x = target.x = W * 0.16; light.y = target.y = -H * 0.5;
        ready = true; draw();
        requestAnimationFrame(function () {
          doc.classList.add('gl-on');
          setTimeout(function () { doc.classList.add('gl-done'); }, 650);
          sweepT0 = performance.now() + 120; kick();
        });
        if (finePointer.matches) Hero.onPointer = function () { if (Hero.pointer) aimAt(Hero.pointer.x, Hero.pointer.y); };
        else window.addEventListener('scroll', function () { if (visible) aimByScroll(); }, { passive: true });
        if (hero) visibilityGate(hero, function (on) { visible = on; if (on) kick(); }, '0px');
        var rt = 0;
        window.addEventListener('resize', function () {
          clearTimeout(rt); rt = setTimeout(function () { if (lost) return; if (buildMask()) { if (!finePointer.matches) aimByScroll(); draw(); } }, 160);
        });
      }, 30);
    };
    canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); lost = true; doc.classList.remove('gl-on', 'gl-done'); });
    // Erst nach dem Klingenschnitt (CSS, ~1,1 s) und wenn der Main-Thread Luft hat
    var wait = Math.max(0, 1250 - performance.now());
    setTimeout(function () { idle(start, 700); }, wait);
  }

  /* ------------------------------------------------------------------
     Barber-Pole (Canvas, Helix-Streifen): Säule im Hero, danach schmales
     Band am Rand. Drehtempo = Grundtempo + Scroll-Geschwindigkeit.
     Ruhig: gedrosselte Bildrate; außerhalb des Tabs pausiert.
     ------------------------------------------------------------------ */
  function initPole() {
    var pole = qs('[data-pole]'), canvas = qs('[data-pole-canvas]'), collar = qs('[data-pole-collar]');
    if (!pole || !canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    var BASE_SPEED = 0.22;   // Perioden pro Sekunde im Ruhezustand
    var SCROLL_GAIN = 0.035; // Zusatz pro px Scroll-Geschwindigkeit
    var IDLE_FPS = 24;
    var W = 0, H = 0, dpr = 1, pitch = 60, period = 80;
    var phase = 0, boost = 0, running = false, raf = 0, last = 0, lastDraw = 0, lastY = window.scrollY, lastScroll = 0;
    var tile = null, shade = null, band = -1, collarY = -1, scaleNow = -1;

    function resize() {
      var w = Math.max(1, canvas.clientWidth), h = Math.max(1, canvas.clientHeight);
      if (w === W && h === H) return;
      W = w; H = h; dpr = dprMax(2);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      pitch = W * 2.4; period = W * 1.25;
      renderTile(); draw();
    }
    function renderTile() {
      tile = tile || document.createElement('canvas');
      var TH = H + Math.ceil(period) + 2;
      tile.width = Math.round(W * dpr); tile.height = Math.round(TH * dpr);
      var t = tile.getContext('2d');
      t.setTransform(dpr, 0, 0, dpr, 0, 0);
      var slices = Math.max(20, Math.round(W / 1.25)), sw = W / slices;
      for (var s = 0; s < slices; s++) {
        var cx = (s + 0.5) * sw;
        var theta = Math.asin(clamp((cx / W) * 2 - 1, -1, 1));
        var off = (theta / (2 * Math.PI)) * pitch;
        var k0 = Math.floor((off - period) / period), k1 = Math.ceil((TH + off) / period);
        for (var k = k0; k <= k1; k++) {
          var y = k * period - off;
          for (var b = 0; b < POLE_BANDS.length; b++) {
            var hgt = POLE_BANDS[b][1] * period;
            if (y + hgt > 0 && y < TH) { t.fillStyle = POLE_BANDS[b][0]; t.fillRect(s * sw, y, sw + 0.6, hgt + 0.6); }
            y += hgt;
          }
        }
      }
      shade = ctx.createLinearGradient(0, 0, 0, H);
      shade.addColorStop(0, 'rgba(0,0,0,.5)'); shade.addColorStop(0.05, 'rgba(0,0,0,0)'); shade.addColorStop(0.95, 'rgba(0,0,0,0)'); shade.addColorStop(1, 'rgba(0,0,0,.45)');
    }
    function draw() {
      if (!tile) return;
      var m = ((phase * period) % period + period) % period;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(tile, 0, -m * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = shade; ctx.fillRect(0, 0, W, H);
    }
    /* Säule → Band: nur transform (scaleX) und Opazität der Kappen */
    function layout() {
      var y = window.scrollY, vh = window.innerHeight;
      var p = clamp(y / (vh * 0.55), 0, 1), e = p * p * (3 - 2 * p);
      var s = 1 - 0.76 * e;
      if (Math.abs(s - scaleNow) > 0.001) { scaleNow = s; pole.style.transform = 'scaleX(' + s.toFixed(4) + ')'; }
      var b = p > 0.97 ? 1 : 0;
      if (b !== band) { band = b; pole.classList.toggle('is-band', !!b); }
      if (collar) {
        var max = Math.max(1, document.documentElement.scrollHeight - vh);
        var cy = Math.round(clamp(y / max, 0, 1) * Math.max(0, H - 18));
        if (cy !== collarY) { collarY = cy; collar.style.transform = 'translateY(' + cy + 'px)'; }
      }
    }
    function velocity() {
      if (lenis) return lenis.velocity || 0;
      var y = window.scrollY, v = y - lastY; lastY = y; return v;
    }
    function tick(t) {
      if (!running) return;
      raf = requestAnimationFrame(tick);
      var dt = last ? Math.min(0.05, (t - last) / 1000) : 0.016; last = t;
      var v = velocity();
      if (Math.abs(v) > 0.3) lastScroll = t;
      var target = clamp(v * SCROLL_GAIN, -2.4, 3.2);
      boost = lerp(boost, target, 1 - Math.pow(0.9, dt * 60));
      phase += dt * (BASE_SPEED + boost);
      phase -= Math.floor(phase);
      var calm = t - lastScroll > 300 && Math.abs(boost) < 0.02;
      if (calm && t - lastDraw < 1000 / IDLE_FPS) return; // Ruhe: gedrosselt
      lastDraw = t;
      layout();
      draw();
    }
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas); else window.addEventListener('resize', resize);
    resize(); layout();
    if (reduced()) { window.addEventListener('scroll', function () { requestAnimationFrame(layout); }, { passive: true }); return; }
    var setRun = function () {
      var on = !document.hidden;
      if (on && !running) { running = true; last = 0; lastY = window.scrollY; raf = requestAnimationFrame(tick); }
      else if (!on && running) { running = false; cancelAnimationFrame(raf); }
    };
    document.addEventListener('visibilitychange', setRun);
    setRun();
  }

  /* ------------------------------------------------------------------
     Kapitel: Die ganze Seite wechselt die Farbe (Glas → Papier → Leder)
     ------------------------------------------------------------------ */
  function initChapters() {
    if (motionOff || !('IntersectionObserver' in window)) return;
    var sections = qsa('main > section');
    doc.classList.add('chapters');
    var current = 'glas';
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var c = en.target.getAttribute('data-chapter') || 'glas';
        if (c === current) return;
        current = c;
        if (c === 'glas') doc.removeAttribute('data-chapter'); else doc.setAttribute('data-chapter', c);
      });
    }, { rootMargin: '-50% 0px -50% 0px' });
    sections.forEach(function (s) { io.observe(s); });
  }

  /* ------------------------------------------------------------------
     Freischneiden: diagonaler Klingenzug beim Hereinscrollen
     ------------------------------------------------------------------ */
  function initCuts() {
    if (motionOff || !('IntersectionObserver' in window)) return;
    var CUT_MS = 1000;
    /* Ein vollständig beschnittenes Element gilt für den IntersectionObserver als unsichtbar –
       deshalb wird der (unbeschnittene) Elternknoten beobachtet. */
    var map = new Map();
    var reveal = function (el) {
      el.classList.add('is-cut');
      if (el.hasAttribute('data-cut')) {
        var d = parseFloat(el.style.getPropertyValue('--d')) || 0;
        setTimeout(function () { el.classList.add('is-done'); }, CUT_MS + d + 80);
      }
    };
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        (map.get(en.target) || [en.target]).forEach(reveal);
      });
    }, { rootMargin: '0px 0px -14% 0px', threshold: 0 });
    qsa('[data-cut]').forEach(function (el) {
      var p = el.parentElement || el;
      if (!map.has(p)) { map.set(p, []); io.observe(p); }
      map.get(p).push(el);
    });
    var gallery = qs('.gallery'); if (gallery) { qsa('.g-card', gallery).forEach(function (c, i) { c.style.setProperty('--i', i); }); io.observe(gallery); }
    var vf = qs('.voice-frame'); if (vf) { qsa('.voice', vf).forEach(function (c, i) { c.style.setProperty('--i', i); }); io.observe(vf); }
    qsa('.svc-row').forEach(function (r, i) { r.style.setProperty('--i', i % 2); io.observe(r); });
  }

  /* ------------------------------------------------------------------
     Statement: Wort für Wort vergolden (Scroll)
     ------------------------------------------------------------------ */
  function initStatement() {
    var el = qs('[data-words]');
    if (!el || !hasGSAP || reduced()) return;
    var words = [];
    var split = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var s = document.createElement('span'); s.className = 'w'; s.textContent = part; words.push(s); frag.appendChild(s);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1) split(n);
      });
    };
    split(el);
    gsap.fromTo(words, { opacity: 0.14 }, { opacity: 1, ease: 'none', stagger: 0.08, scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 50%', scrub: 0.4 } });
  }

  /* ------------------------------------------------------------------
     Leistungen: Vorschau im Klingenschnitt folgt dem Zeiger (Feder)
     ------------------------------------------------------------------ */
  function initServices() {
    var list = qs('[data-svc-list]'), prev = qs('[data-svc-preview]'), section = qs('.services');
    if (!list || !prev || !section || !finePointer.matches || reduced()) return;
    var imgs = qsa('img', prev), rows = qsa('.svc-row', list);
    var x = 0, y = 0, tx = 0, ty = 0, rot = 0, raf = 0, on = false, w = 280, h = 350, placed = false;
    var measure = function () { w = prev.offsetWidth; h = prev.offsetHeight; };
    if ('ResizeObserver' in window) new ResizeObserver(measure).observe(prev); else measure();
    var loop = function () {
      x += (tx - x) * 0.14; y += (ty - y) * 0.14;
      rot = lerp(rot, clamp((tx - x) * 0.05, -9, 9), 0.2);
      prev.style.transform = 'translate3d(' + (x - w / 2).toFixed(1) + 'px,' + (y - h / 2).toFixed(1) + 'px,0) rotate(' + rot.toFixed(2) + 'deg)';
      if (on || Math.abs(tx - x) > 0.3 || Math.abs(ty - y) > 0.3 || Math.abs(rot) > 0.05) raf = requestAnimationFrame(loop); else raf = 0;
    };
    list.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      var r = section.getBoundingClientRect();
      tx = e.clientX - r.left + w * 0.62; ty = e.clientY - r.top;
      if (!placed) { x = tx; y = ty; placed = true; }
      if (!raf) raf = requestAnimationFrame(loop);
    });
    rows.forEach(function (row) {
      row.addEventListener('pointerenter', function (e) {
        if (e.pointerType !== 'mouse') return;
        var i = +row.getAttribute('data-preview');
        imgs.forEach(function (im, k) { im.classList.toggle('is-active', k === i); });
        on = true; prev.classList.add('is-on');
        if (!raf) raf = requestAnimationFrame(loop);
      });
    });
    list.addEventListener('pointerleave', function () { on = false; placed = false; prev.classList.remove('is-on'); });
  }

  /* ------------------------------------------------------------------
     Ritual: Sticky-Bühne in vier Akten + Partikel (Dampf, Schaum, Klinge, kalter Nebel)
     ------------------------------------------------------------------ */
  function mulberry(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function sprite(size, paint) { var c = document.createElement('canvas'); c.width = c.height = size; paint(c.getContext('2d'), size); return c; }
  function createRitualFx(canvas, frame) {
    var noop = { time: function () {}, active: function () {}, resize: function () {} };
    if (!canvas || !frame || !canvas.getContext) return noop;
    /* Zwei Ebenen: weiche Dinge (Dampf, Schaumkörper, Nebel) in halber Auflösung, scharfe (Bläschen, Klinge) normal */
    var soft = canvas.cloneNode(false); soft.removeAttribute('data-ritual-fx'); canvas.parentNode.insertBefore(soft, canvas);
    var ctx = canvas.getContext('2d'), sctx = soft.getContext('2d');
    var W = 0, H = 0, dpr = 1, sdpr = 0.5, fx0 = 0, fy0 = 0, fw = 1, fh = 1;
    var T = 0, Tt = 0, on = false, visible = false, raf = 0, last = 0, lastDraw = 0, lastInput = 0, warm = false;
    var rnd = mulberry(20140211);
    var steamS = sprite(128, function (c, s) { var g = c.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); g.addColorStop(0, 'rgba(239,232,220,1)'); g.addColorStop(0.42, 'rgba(239,232,220,.38)'); g.addColorStop(1, 'rgba(239,232,220,0)'); c.fillStyle = g; c.fillRect(0, 0, s, s); });
    var bubbleS = sprite(48, function (c, s) {
      var r = s / 2 - 1.5, g = c.createRadialGradient(s * 0.42, s * 0.4, r * 0.15, s / 2, s / 2, r);
      g.addColorStop(0, 'rgba(255,255,255,.96)'); g.addColorStop(0.6, 'rgba(244,239,230,.86)'); g.addColorStop(0.88, 'rgba(214,205,190,.9)'); g.addColorStop(1, 'rgba(180,170,155,.55)');
      c.beginPath(); c.arc(s / 2, s / 2, r, 0, Math.PI * 2); c.fillStyle = g; c.fill(); c.lineWidth = 1; c.strokeStyle = 'rgba(140,128,112,.45)'; c.stroke();
      c.beginPath(); c.arc(s * 0.37, s * 0.35, r * 0.18, 0, Math.PI * 2); c.fillStyle = 'rgba(255,255,255,1)'; c.fill();
    });
    var bladeS = sprite(256, function (c, s) { /* Wechselklinge, gebürsteter Stahl – Schatten eingebacken */
      var blade = document.createElement('canvas'); blade.width = blade.height = s; var bc0 = blade.getContext('2d');
      paintBlade(bc0, s);
      c.save(); c.filter = 'blur(7px)'; c.globalAlpha = 0.55; c.drawImage(blade, 0, 9); c.restore();
      c.save(); c.globalCompositeOperation = 'source-atop'; c.fillStyle = '#000'; c.fillRect(0, 0, s, s); c.restore();
      c.drawImage(blade, 0, 0);
    });
    function paintBlade(c, s) {
      var w = s, h = s * 44 / 120, y0 = (s - h) / 2;
      var g = c.createLinearGradient(0, y0, 0, y0 + h); g.addColorStop(0, '#8D8A86'); g.addColorStop(0.18, '#F2EFEA'); g.addColorStop(0.5, '#B9B5AE'); g.addColorStop(0.82, '#EDE9E2'); g.addColorStop(1, '#7E7A74');
      c.fillStyle = g; c.fillRect(2, y0, w - 4, h);
      c.globalCompositeOperation = 'destination-out';
      var k = w / 120; c.fillRect(30 * k, y0 + 19.5 * k, 60 * k, 5 * k);
      [30, 60, 90].forEach(function (cx) { c.beginPath(); c.arc(cx * k, y0 + 22 * k, 4.6 * k, 0, Math.PI * 2); c.fill(); });
      c.beginPath(); c.moveTo(0, y0 + 19 * k); c.lineTo(13 * k, y0 + 19 * k); c.lineTo(16.5 * k, y0 + 22 * k); c.lineTo(13 * k, y0 + 25 * k); c.lineTo(0, y0 + 25 * k); c.fill();
      c.beginPath(); c.moveTo(w, y0 + 19 * k); c.lineTo(w - 13 * k, y0 + 19 * k); c.lineTo(w - 16.5 * k, y0 + 22 * k); c.lineTo(w - 13 * k, y0 + 25 * k); c.lineTo(w, y0 + 25 * k); c.fill();
      c.globalCompositeOperation = 'source-over'; c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(2, y0 + 5.5 * k, w - 4, 1); c.fillRect(2, y0 + h - 6.5 * k, w - 4, 1);
    }
    // Dampf: zeitbasierter Emitter
    var steam = []; for (var i = 0; i < 24; i++) steam.push({ a: false });
    var acc = 0;
    // Schaum: deterministisch (rückwärts scrollen ergibt dasselbe Bild)
    var foam = [];
    for (var j = 0; j < 160; j++) {
      var ang = rnd() * Math.PI * 2, rr = Math.pow(rnd(), 0.75);
      var bx = 0.46 + Math.cos(ang) * rr * 0.3, by = 0.52 + Math.sin(ang) * rr * 0.23;
      foam.push({ x: bx, y: by, s: 0.006 + rnd() * rnd() * 0.026, b: clamp(rr * 0.78 + rnd() * 0.2, 0, 0.98), ph: rnd() * 6.28, dir: rnd() < 0.5 ? -1 : 1, k: bx + 0.36 * by });
    }
    // Schaumkörper: weiche, cremige Basis unter den Bläschen
    var lather = []; for (var la = 0; la < 16; la++) { var a2 = rnd() * 6.28, r2 = Math.pow(rnd(), 0.8); lather.push({ x: 0.46 + Math.cos(a2) * r2 * 0.22, y: 0.52 + Math.sin(a2) * r2 * 0.16, s: 0.16 + rnd() * 0.14, b: r2 * 0.7, k: 0 }); lather[la].k = lather[la].x + 0.36 * lather[la].y; }
    // kalter Nebel / Funkeln (Akt IV)
    var mist = []; for (var m = 0; m < 22; m++) mist.push({ x: rnd(), y: rnd(), vx: (rnd() - 0.5) * 0.012, vy: 0.008 + rnd() * 0.016, s: 10 + rnd() * 26, ph: rnd() * 6.28 });

    function resize() {
      var r = canvas.getBoundingClientRect(), f = frame.getBoundingClientRect();
      if (!r.width) return;
      W = r.width; H = r.height; dpr = dprMax(1.5);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      soft.width = Math.round(W * sdpr); soft.height = Math.round(H * sdpr);
      fx0 = f.left - r.left; fy0 = f.top - r.top; fw = f.width; fh = f.height;
    }
    function spawnSteam(p) {
      p.a = true; p.life = 0; p.max = 3.4 + rnd() * 2.4;
      p.x = fx0 + fw * (0.3 + rnd() * 0.42); p.y = fy0 + fh * (0.42 + rnd() * 0.3);
      p.vy = fh * (0.13 + rnd() * 0.1); p.s = fw * (0.07 + rnd() * 0.05); p.g = fw * (0.04 + rnd() * 0.035); p.ph = rnd() * 6.28;
    }
    function draw(now, dt, sim) {
      if (!sim) { ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H); sctx.setTransform(sdpr, 0, 0, sdpr, 0, 0); sctx.clearRect(0, 0, W, H); }
      var w1 = 1 - smooth(0.7, 1.25, T);
      var foamP = smooth(0.85, 1.85, T);
      var bladeP = clamp((T - 2.0) / 0.85, 0, 1);
      var w4 = smooth(2.75, 3.3, T);
      var sec = now / 1000;
      // Dampf
      acc += dt * 9 * w1;
      for (var i = 0; i < steam.length; i++) {
        var p = steam[i];
        if (!p.a) { if (acc >= 1) { acc -= 1; spawnSteam(p); } else continue; }
        p.life += dt;
        if (p.life >= p.max) { p.a = false; continue; }
        p.y -= p.vy * dt; p.x += Math.sin(sec * 0.7 + p.ph) * fw * 0.012 * dt; p.s += p.g * dt;
        if (sim) continue;
        var lf = p.life / p.max;
        sctx.globalAlpha = Math.sin(Math.PI * lf) * 0.2 * (0.4 + 0.6 * w1);
        sctx.drawImage(steamS, p.x - p.s / 2, p.y - p.s / 2, p.s, p.s);
      }
      if (acc > 2) acc = 2;
      if (sim) return;
      // Schaum + Klinge
      if (foamP > 0 && bladeP < 1) {
        var line = -0.3 + 1.75 * bladeP;
        for (var lq = 0; lq < lather.length; lq++) {
          var L2 = lather[lq]; if (foamP < L2.b) continue;
          var la2 = clamp((foamP - L2.b) / 0.25, 0, 1) * 0.42;
          if (bladeP > 0 && L2.k < line) la2 *= 1 - clamp((line - L2.k) / 0.12, 0, 1);
          if (la2 <= 0.01) continue;
          var ls = L2.s * fw; sctx.globalAlpha = la2;
          sctx.drawImage(steamS, fx0 + L2.x * fw - ls / 2, fy0 + L2.y * fh - ls / 2, ls, ls);
        }
        for (var k = 0; k < foam.length; k++) {
          var b = foam[k];
          if (foamP < b.b) continue;
          var appear = clamp((foamP - b.b) / 0.1, 0, 1), alpha = 0.9 * appear;
          var x = fx0 + b.x * fw + Math.sin(sec * 1.3 + b.ph) * 0.8, y = fy0 + b.y * fh + Math.cos(sec * 1.1 + b.ph) * 0.6;
          if (bladeP > 0 && b.k < line) {
            var c = clamp((line - b.k) / 0.16, 0, 1);
            x += b.dir * c * c * fw * 0.08 + c * fw * 0.12; y -= c * fh * 0.05; alpha *= 1 - c;
            if (alpha <= 0.01) continue;
          }
          var s = b.s * fw * (0.55 + 0.45 * appear);
          ctx.globalAlpha = alpha;
          ctx.drawImage(bubbleS, x - s / 2, y - s / 2, s, s);
        }
        if (bladeP > 0) {
          var bc = line - 0.18, ang = Math.atan2(fh, -0.36 * fw);
          var bl = fh * 0.74;
          ctx.save();
          ctx.globalAlpha = smooth(0, 0.08, bladeP) * (1 - smooth(0.9, 1, bladeP));
          ctx.translate(fx0 + bc * fw, fy0 + fh * 0.5); ctx.rotate(ang);
          ctx.drawImage(bladeS, -bl / 2, -bl / 2, bl, bl);
          ctx.restore();
        }
      }
      // Kalte Kompresse: feiner Nebel, der sich setzt
      if (w4 > 0) {
        for (var n = 0; n < mist.length; n++) {
          var q = mist[n];
          var mx = fx0 + (((q.x + sec * q.vx) % 1 + 1) % 1) * fw, my = fy0 + (((q.y + sec * q.vy) % 1 + 1) % 1) * fh;
          sctx.globalAlpha = w4 * (0.2 + 0.16 * Math.sin(sec * 2.2 + q.ph));
          sctx.drawImage(steamS, mx - q.s / 2, my - q.s / 2, q.s, q.s);
        }
      }
      ctx.globalAlpha = 1; sctx.globalAlpha = 1;
    }
    function tick(t) {
      raf = 0;
      if (!on || !visible) return;
      raf = requestAnimationFrame(tick);
      if (t - lastDraw < 32) return; // 30 fps genügen für Dampf und Schaum
      var dt = last ? Math.min(0.05, (t - last) / 1000) : 0.016; last = t; lastDraw = t;
      T += (Tt - T) * (1 - Math.exp(-dt * 7));
      if (!warm) { warm = true; for (var s = 0; s < 90; s++) draw(t - (90 - s) * 33, 0.033, true); }
      draw(t, dt);
    }
    function wake() { if (!raf && on && visible) { last = 0; raf = requestAnimationFrame(tick); } }
    visibilityGate(frame, function (v) { visible = v; if (v) { resize(); wake(); } }, '0px');
    return {
      time: function (t) { Tt = t; if (!warm) T = t; lastInput = performance.now(); wake(); },
      active: function (a) { on = a; if (a) { resize(); wake(); } else { ctx.clearRect(0, 0, canvas.width, canvas.height); sctx.clearRect(0, 0, soft.width, soft.height); } },
      resize: resize
    };
  }
  function initRitual() {
    var section = qs('[data-ritual]');
    if (!section || !hasGSAP || reduced()) return;
    var figs = qsa('.act-fig', section), texts = qsa('.act-text', section), bigs = qsa('.act-big span', section);
    var ticks = qsa('[data-act-ticks] li:not(.act-marker)', section), marker = qs('.act-marker', section);
    var imgs = figs.map(function (f) { return qs('img', f); });
    var fx = createRitualFx(qs('[data-ritual-fx]', section), qs('[data-ritual-frame]', section));
    var HIDE = 'polygon(120% 0%, 140% 0%, 140% 100%, 140% 100%)', SHOW = 'polygon(-20% 0%, 140% 0%, 140% 100%, 0% 100%)';
    var mm = gsap.matchMedia();
    mm.add('(min-width: 900px) and (min-height: 560px)', function () {
      section.classList.add('is-sticky');
      imgs.forEach(function (im) { im.loading = 'eager'; });
      figs.forEach(function (f, i) { f.style.zIndex = i + 1; });
      gsap.set(figs.slice(1), { clipPath: HIDE });
      gsap.set(imgs.slice(1), { scale: 1.15, xPercent: 4 });
      gsap.set(texts.slice(1), { autoAlpha: 0, y: 36 });
      gsap.set(bigs.slice(1), { autoAlpha: 0, yPercent: 14 });
      var lastTick = -1;
      var setTick = function (idx) {
        if (idx === lastTick) return; lastTick = idx;
        ticks.forEach(function (t, i) { t.classList.toggle('is-active', i === idx); });
        if (marker) marker.style.transform = 'translateX(' + (idx * 100) + '%)';
      };
      var tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: section, start: 'top top', end: 'bottom bottom', scrub: 0.6, invalidateOnRefresh: true,
          onUpdate: function (self) { var t = self.progress * 4; setTick(clamp(Math.floor(t + 0.02), 0, 3)); fx.time(t); },
          onToggle: function (self) { fx.active(self.isActive); },
          onRefresh: function () { fx.resize(); }
        }
      });
      for (var i = 1; i < figs.length; i++) {
        var at = i - 0.3;
        tl.to(figs[i], { clipPath: SHOW, duration: 0.6, ease: 'power2.inOut' }, at)
          .to(imgs[i], { scale: 1, xPercent: 0, duration: 0.8, ease: 'power2.out' }, at)
          .to(imgs[i - 1], { scale: 1.06, xPercent: -3, duration: 0.6 }, at)
          .to(texts[i - 1], { autoAlpha: 0, y: -36, duration: 0.25, ease: 'power2.in' }, at)
          .to(texts[i], { autoAlpha: 1, y: 0, duration: 0.3, ease: 'power2.out' }, at + 0.3)
          .to(bigs[i - 1], { autoAlpha: 0, yPercent: -14, duration: 0.35 }, at)
          .to(bigs[i], { autoAlpha: 1, yPercent: 0, duration: 0.45, ease: 'power2.out' }, at + 0.15);
      }
      tl.set({}, {}, 4);
      return function () {
        section.classList.remove('is-sticky');
        fx.active(false);
        gsap.set(figs.concat(texts, imgs, bigs), { clearProps: 'all' });
        figs.forEach(function (f) { f.style.zIndex = ''; });
        lastTick = -1; setTick(0);
      };
    });
  }

  /* ------------------------------------------------------------------
     Spiegel: Spiegelbild wandert gegenläufig (Scroll + Zeiger), Lichtbahn gleitet
     ------------------------------------------------------------------ */
  function initMirror() {
    var mirror = qs('[data-mirror]'), reflect = qs('[data-mirror-reflect]'), sheen = qs('[data-mirror-sheen]');
    if (!mirror || !reflect || !sheen || reduced()) return;
    var sp = 0, px = 0, py = 0, cs = 0, cx = 0, cy = 0, raf = 0, visible = false;
    var measure = function () {
      var r = mirror.getBoundingClientRect(), vh = window.innerHeight;
      sp = clamp((vh / 2 - (r.top + r.height / 2)) / (vh / 2 + r.height / 2), -1, 1);
    };
    var loop = function () {
      cs += (sp - cs) * 0.12; cx += (px - cx) * 0.08; cy += (py - cy) * 0.08;
      reflect.style.transform = 'translate3d(' + (cx * -3).toFixed(2) + '%,' + (cs * -7 + cy * -2).toFixed(2) + '%,0)';
      sheen.style.transform = 'translateX(' + (-130 + (cs + 1) * 230 + cx * 25).toFixed(1) + '%) rotate(16deg)';
      if (Math.abs(sp - cs) > 0.001 || Math.abs(px - cx) > 0.002 || Math.abs(py - cy) > 0.002) raf = requestAnimationFrame(loop); else raf = 0;
    };
    var kick = function () { if (!raf) raf = requestAnimationFrame(loop); };
    visibilityGate(mirror, function (v) { visible = v; if (v) { measure(); kick(); } });
    window.addEventListener('scroll', function () { if (visible) { measure(); kick(); } }, { passive: true });
    if (finePointer.matches) {
      mirror.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse') return;
        var r = mirror.getBoundingClientRect();
        px = ((e.clientX - r.left) / r.width) * 2 - 1; py = ((e.clientY - r.top) / r.height) * 2 - 1; kick();
      });
      mirror.addEventListener('pointerleave', function () { px = 0; py = 0; kick(); });
    }
  }

  /* ------------------------------------------------------------------
     Preisliste: Detailtafel bei Hover/Fokus (Desktop) bzw. Tippen (mobil)
     ------------------------------------------------------------------ */
  function initPrices() {
    var card = qs('[data-price-card]'), plate = qs('[data-plate]');
    if (!card || !plate) return;
    var body = qs('.pc-body', card), inner = qs('.plate-inner', plate);
    var items = qsa('.pc-item', card);
    var mqWide = window.matchMedia('(min-width: 1100px)');
    var fName = qs('[data-plate-name]', plate), fDur = qs('[data-plate-dur]', plate), fBody = qs('[data-plate-body]', plate), fPrice = qs('[data-plate-price]', plate), fBook = qs('[data-plate-book]', plate);
    var active = null, hoverTimer = 0;

    function fill(item) {
      fName.textContent = qs('.pc-name', item).textContent.replace(/\s+/g, ' ').trim();
      fDur.textContent = qs('.pc-meta', item).textContent;
      fPrice.textContent = qs('.pc-price', item).textContent;
      while (fBody.firstChild) fBody.removeChild(fBody.firstChild);
      Array.prototype.forEach.call(qs('.pc-more', item).children, function (c) { fBody.appendChild(c.cloneNode(true)); });
      var book = item.getAttribute('data-book');
      fBook.hidden = !book;
      if (book) fBook.setAttribute('data-book-service', book); else fBook.removeAttribute('data-book-service');
    }
    function pulse() {
      if (reduced() || !inner.animate) return;
      inner.animate([{ opacity: 0.35, filter: 'blur(2px)', transform: 'translateY(4px)' }, { opacity: 1, filter: 'blur(0)', transform: 'none' }], { duration: 200, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' });
    }
    function setActive(item) {
      if (active === item) return;
      active = item;
      items.forEach(function (it) { qs('.pc-row', it).setAttribute('aria-expanded', it === item ? 'true' : 'false'); });
      if (!item) { plate.hidden = true; return; }
      fill(item);
      if (!mqWide.matches) { item.appendChild(plate); plate.classList.add('is-inline'); }
      plate.hidden = false;
      pulse();
    }
    function place() {
      if (mqWide.matches) {
        body.appendChild(plate); plate.classList.remove('is-inline');
        var a = active; active = null; setActive(a || items[0]);
      } else {
        plate.classList.add('is-inline');
        if (active) active.appendChild(plate); else plate.hidden = true;
      }
    }
    items.forEach(function (item) {
      var row = qs('.pc-row', item);
      row.addEventListener('click', function () {
        if (!mqWide.matches && active === item) { setActive(null); return; }
        setActive(item);
      });
      row.addEventListener('focus', function () { if (mqWide.matches) setActive(item); });
      row.addEventListener('pointerenter', function (e) {
        if (e.pointerType !== 'mouse' || !mqWide.matches) return;
        clearTimeout(hoverTimer);
        hoverTimer = setTimeout(function () { setActive(item); }, 50);
      });
      row.addEventListener('pointerleave', function () { clearTimeout(hoverTimer); });
    });
    mqWide.addEventListener('change', place);
    place();
  }


  /* ------------------------------------------------------------------
     Bart-Atelier: SVG-Profil, Bartstile morphen weich
     ------------------------------------------------------------------ */
  var BEARDS = {
    vollbart: {
      beard: [[210, 210], [230, 206], [238, 250], [270, 272], [306, 290], [316, 316], [334, 334], [354, 352], [364, 390], [350, 428], [318, 450], [282, 446], [252, 430], [226, 404], [210, 360], [214, 290]],
      stache: [[306, 292], [322, 286], [340, 289], [350, 298], [348, 309], [332, 313], [316, 313], [304, 304]],
      o: { solid: 1, stache: 1, stubble: 0 },
      info: { name: 'Vollbart', desc: 'Volle Länge an Wangen, Kinn und Hals. Die Wangenlinie setzen wir hoch genug für Kontur, die Halslinie zwei Finger über dem Adamsapfel.', grow: '6–10 Wochen', cut: 'alle 3–4 Wochen', care: 3, fit: 'schmalen und ovalen Gesichtern', service: 'Bart-Ritual mit heißem Tuch · 34 €', book: 'bart' }
    },
    stoppel: {
      beard: [[210, 212], [228, 208], [236, 250], [268, 270], [304, 288], [316, 314], [330, 338], [336, 352], [342, 378], [330, 398], [302, 410], [274, 414], [254, 426], [232, 400], [214, 358], [216, 290]],
      stache: [[308, 293], [322, 289], [336, 291], [343, 297], [342, 303], [332, 305], [318, 305], [308, 300]],
      o: { solid: 0, stache: 0, stubble: 1 },
      info: { name: 'Stoppel', desc: 'Drei bis fünf Millimeter, gleichmäßig mit der Maschine. Wangen- und Halslinie ziehen wir mit dem Messer – das macht den Unterschied zu „nicht rasiert“.', grow: '1–2 Wochen', cut: 'Kontur alle 2–3 Wochen', care: 2, fit: 'fast jedem; kaschiert ein weiches Kinn', service: 'Bart trimmen & Kontur · 26 €', book: 'bart' }
    },
    ducktail: {
      beard: [[210, 212], [229, 207], [236, 250], [268, 270], [305, 289], [316, 315], [334, 334], [350, 352], [358, 388], [352, 426], [338, 486], [306, 450], [264, 426], [232, 400], [212, 358], [215, 290]],
      stache: [[306, 292], [322, 286], [340, 289], [350, 298], [348, 309], [332, 313], [316, 313], [304, 304]],
      o: { solid: 1, stache: 1, stubble: 0 },
      info: { name: 'Ducktail', desc: 'Kurze Seiten, das Kinn läuft nach unten spitz zu – benannt nach dem Entenschwanz. Streckt das Gesicht optisch und braucht etwas Geduld beim Wachsenlassen.', grow: '8–12 Wochen', cut: 'alle 3 Wochen', care: 3, fit: 'runden und breiten Gesichtern', service: 'Bart-Ritual mit heißem Tuch · 34 €', book: 'bart' }
    },
    schnauzer: {
      beard: [[210, 212], [228, 208], [236, 250], [268, 270], [304, 288], [316, 314], [330, 338], [336, 352], [342, 378], [330, 398], [302, 410], [274, 414], [254, 426], [232, 400], [214, 358], [216, 290]],
      stache: [[300, 293], [320, 283], [343, 286], [357, 300], [356, 317], [338, 320], [314, 319], [297, 309]],
      o: { solid: 0, stache: 1, stubble: 0 },
      info: { name: 'Schnauzer', desc: 'Nur die Oberlippe, Wangen und Kinn glatt rasiert. Die Unterkante sitzt auf Lippenhöhe, die Enden etwas über die Mundwinkel hinaus.', grow: '4–6 Wochen', cut: 'alle 2 Wochen', care: 2, fit: 'markantem Kinn und kräftiger Nase', service: 'Klassische Nassrasur · 36 €', book: 'rasur' }
    }
  };

  function smoothPath(pts) {
    var n = pts.length, d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
    for (var i = 0; i < n; i++) {
      var p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      var c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
      var c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += 'C' + c1x.toFixed(1) + ' ' + c1y.toFixed(1) + ' ' + c2x.toFixed(1) + ' ' + c2y.toFixed(1) + ' ' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1);
    }
    return d + 'Z';
  }
  function initBeard() {
    var svg = qs('[data-face]');
    if (!svg) return;
    var pSolid = qs('[data-beard-solid]', svg), pStache = qs('[data-beard-stache]', svg), pStubble = qs('[data-beard-stubble]', svg), pContour = qs('[data-beard-contour]', svg);
    var marks = { cheek: qs('[data-mark="cheek"]', svg), neck: qs('[data-mark="neck"]', svg), chin: qs('[data-mark="chin"]', svg) };
    var info = {
      name: qs('[data-bi-name]'), desc: qs('[data-bi-desc]'), grow: qs('[data-bi-grow]'), cut: qs('[data-bi-cut]'),
      care: qs('[data-bi-care]'), fit: qs('[data-bi-fit]'), service: qs('[data-bi-service]'), book: qs('[data-bi-book]'),
      chartName: qs('[data-chart-name]'), chartNo: qs('[data-chart-no]')
    };
    var keys = Object.keys(BEARDS);
    var copy = function (a) { return a.map(function (p) { return [p[0], p[1]]; }); };
    var cur = { beard: copy(BEARDS.vollbart.beard), stache: copy(BEARDS.vollbart.stache), o: { solid: 1, stache: 1, stubble: 0 } };
    var anim = 0;

    function render(s) {
      var bd = smoothPath(s.beard), st = smoothPath(s.stache);
      pSolid.setAttribute('d', bd); pStache.setAttribute('d', st); pStubble.setAttribute('d', bd + st);
      if (pContour) pContour.setAttribute('d', (s.o.solid + s.o.stubble) > 0.5 ? bd : st);
      pSolid.style.opacity = s.o.solid.toFixed(3); pStache.style.opacity = s.o.stache.toFixed(3); pStubble.style.opacity = s.o.stubble.toFixed(3);
      var mo = Math.max(s.o.solid, s.o.stubble);
      var put = function (m, p, dx, dy) { m.setAttribute('transform', 'translate(' + (p[0] + dx).toFixed(1) + ' ' + (p[1] + dy).toFixed(1) + ')'); m.style.opacity = mo.toFixed(3); };
      put(marks.cheek, s.beard[3], -4, -14);
      put(marks.neck, s.beard[12], -14, 10);
      put(marks.chin, s.beard[8], 16, 0);
    }
    function setInfo(key, idx) {
      var d = BEARDS[key].info;
      info.name.textContent = d.name; info.desc.textContent = d.desc; info.grow.textContent = d.grow; info.cut.textContent = d.cut;
      info.fit.textContent = d.fit; info.service.textContent = d.service;
      info.care.setAttribute('data-level', d.care); info.care.setAttribute('aria-label', 'Pflegeaufwand ' + d.care + ' von 3');
      info.book.setAttribute('data-book-service', d.book); info.book.setAttribute('data-beard-style', d.name);
      info.chartName.textContent = d.name; info.chartNo.textContent = 'Nr. ' + pad2(idx + 1);
    }
    /* Kreidelinie: Die neue Kontur zeichnet sich nach, dann verblasst sie */
    function drawContour() {
      if (!pContour || reduced() || !pContour.animate) return;
      pContour.animate([{ strokeDashoffset: 1, opacity: 1 }, { strokeDashoffset: 0, opacity: 1, offset: 0.55 }, { strokeDashoffset: 0, opacity: 0 }], { duration: 2000, easing: 'cubic-bezier(0.77, 0, 0.175, 1)' });
    }
    function morphTo(key) {
      var to = BEARDS[key];
      drawContour();
      cancelAnimationFrame(anim);
      if (reduced()) { cur = { beard: copy(to.beard), stache: copy(to.stache), o: Object.assign({}, to.o) }; render(cur); return; }
      var from = { beard: copy(cur.beard), stache: copy(cur.stache), o: Object.assign({}, cur.o) };
      var t0 = performance.now(), DUR = 700;
      var step = function (now) {
        var t = easeInOut(clamp((now - t0) / DUR, 0, 1));
        cur.beard = from.beard.map(function (p, i) { return [lerp(p[0], to.beard[i][0], t), lerp(p[1], to.beard[i][1], t)]; });
        cur.stache = from.stache.map(function (p, i) { return [lerp(p[0], to.stache[i][0], t), lerp(p[1], to.stache[i][1], t)]; });
        cur.o = { solid: lerp(from.o.solid, to.o.solid, t), stache: lerp(from.o.stache, to.o.stache, t), stubble: lerp(from.o.stubble, to.o.stubble, t) };
        render(cur);
        if (t < 1) anim = requestAnimationFrame(step);
      };
      anim = requestAnimationFrame(step);
    }
    render(cur);
    qsa('input[name="beard"]').forEach(function (r) {
      r.addEventListener('change', function () { if (r.checked) { morphTo(r.value); setInfo(r.value, keys.indexOf(r.value)); } });
    });
    var checked = qs('input[name="beard"]:checked');
    if (checked && checked.value !== 'vollbart') { cur = { beard: copy(BEARDS[checked.value].beard), stache: copy(BEARDS[checked.value].stache), o: Object.assign({}, BEARDS[checked.value].o) }; render(cur); setInfo(checked.value, keys.indexOf(checked.value)); }
  }


  /* ------------------------------------------------------------------
     Galerie: ziehbare Strecke mit Trägheit und Gummiband an den Rändern
     ------------------------------------------------------------------ */
  function initGallery() {
    var vp = qs('[data-gallery]'), track = qs('[data-g-track]');
    if (!vp || !track) return;
    var cards = qsa('.g-card', track);
    var prev = qs('[data-g-prev]'), next = qs('[data-g-next]'), bar = qs('[data-g-bar]'), cur = qs('[data-g-current]'), tot = qs('[data-g-total]');
    var cursor = qs('[data-drag-cursor]');
    var FRICTION = 0.94;      // Abbremsen pro Frame (60 fps)
    var RUBBER = 0.35;        // Widerstand hinter dem Rand
    var x = 0, v = 0, min = 0, max = 0, mode = 'idle', target = 0, raf = 0, lastT = 0;
    var dragging = false, moved = false, pid = null, startX = 0, startY = 0, startPos = 0, samples = [];
    var lastIdx = -1;
    /* Bilder wandern in ihrer Schnittmaske gegen die Zugrichtung (Tiefe) */
    var centers = [], vpw = 0, para = !reduced(), gimgs = cards.map(function (c) { return qs('img', c); });
    if (tot) tot.textContent = pad2(cards.length);

    function padLeft() { return parseFloat(getComputedStyle(track).paddingLeft) || 0; }
    function bounds() {
      min = Math.min(0, vp.clientWidth - track.scrollWidth); max = 0;
      vpw = vp.clientWidth; centers = cards.map(function (c) { return c.offsetLeft + c.offsetWidth / 2; });
    }
    function index() {
      var pos = -x + 12, idx = 0, pl = padLeft();
      for (var i = 0; i < cards.length; i++) { if (cards[i].offsetLeft - pl <= pos) idx = i; }
      if (x <= min + 2) idx = cards.length - 1;
      return idx;
    }
    function render() {
      track.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0)';
      if (para) for (var gi = 0; gi < gimgs.length; gi++) {
        if (!gimgs[gi]) continue;
        var off = (centers[gi] || 0) + x - vpw / 2;
        gimgs[gi].style.transform = 'translate3d(' + (-off * 0.045).toFixed(1) + 'px,0,0) scale(1.16)';
      }
      var p = min === 0 ? 1 : clamp(x / min, 0, 1);
      if (bar) bar.style.transform = 'scaleX(' + (0.12 + 0.88 * p).toFixed(4) + ')';
      var idx = index();
      if (idx !== lastIdx) {
        lastIdx = idx;
        if (cur) cur.textContent = pad2(idx + 1);
        if (prev) prev.disabled = x >= max - 1;
        if (next) next.disabled = x <= min + 1;
      } else {
        if (prev) prev.disabled = x >= max - 1;
        if (next) next.disabled = x <= min + 1;
      }
    }
    function loop(t) {
      var dt = lastT ? Math.min(40, t - lastT) : 16.7; lastT = t;
      var f = dt / 16.67;
      if (mode === 'inertia') {
        x += v * dt;
        v *= Math.pow(FRICTION, f);
        if (x > max || x < min) {
          var edge = x > max ? max : min;
          v *= Math.pow(0.7, f);
          x += (edge - x) * (1 - Math.pow(0.84, f));
          if (Math.abs(edge - x) < 0.4 && Math.abs(v) < 0.02) { x = edge; mode = 'idle'; }
        } else if (Math.abs(v) < 0.015) { mode = 'idle'; }
      } else if (mode === 'tween') {
        x += (target - x) * (1 - Math.pow(0.84, f));
        if (Math.abs(target - x) < 0.4) { x = target; mode = 'idle'; }
      }
      render();
      if (mode !== 'idle') raf = requestAnimationFrame(loop); else lastT = 0;
    }
    function run(m) { mode = m; cancelAnimationFrame(raf); lastT = 0; raf = requestAnimationFrame(loop); }
    function goTo(i) {
      i = clamp(i, 0, cards.length - 1);
      target = clamp(-(cards[i].offsetLeft - padLeft()), min, max);
      if (reduced()) { x = target; mode = 'idle'; render(); return; }
      run('tween');
    }

    vp.addEventListener('pointerdown', function (e) {
      if (dragging || (e.pointerType === 'mouse' && e.button !== 0)) return; // Mehrfinger-Schutz
      dragging = true; moved = false; pid = e.pointerId;
      startX = e.clientX; startY = e.clientY; startPos = x; samples = [{ x: e.clientX, t: e.timeStamp }];
      mode = 'idle'; cancelAnimationFrame(raf);
      if (e.pointerType === 'mouse') { try { vp.setPointerCapture(pid); } catch (err) {} }
      if (cursor) cursor.classList.add('is-down');
    });
    vp.addEventListener('pointermove', function (e) {
      if (!dragging || e.pointerId !== pid) return;
      var dx = e.clientX - startX;
      if (!moved) {
        if (Math.abs(dx) < 4) return;
        if (e.pointerType !== 'mouse' && Math.abs(e.clientY - startY) > Math.abs(dx)) { dragging = false; return; }
        moved = true; vp.classList.add('is-dragging');
        if (e.pointerType !== 'mouse') { try { vp.setPointerCapture(pid); } catch (err) {} }
      }
      var nx = startPos + dx;
      if (nx > max) nx = max + (nx - max) * RUBBER;
      if (nx < min) nx = min + (nx - min) * RUBBER;
      x = nx; render();
      samples.push({ x: e.clientX, t: e.timeStamp });
      while (samples.length > 2 && e.timeStamp - samples[0].t > 90) samples.shift();
    });
    var end = function (e) {
      if (!dragging || (e && e.pointerId !== pid)) return;
      dragging = false; vp.classList.remove('is-dragging');
      if (cursor) cursor.classList.remove('is-down');
      var a = samples[0], b = samples[samples.length - 1];
      v = (b && a && b.t > a.t) ? (b.x - a.x) / (b.t - a.t) : 0;
      v = clamp(v, -4, 4);
      if (reduced()) v = 0;
      run('inertia');
    };
    vp.addEventListener('pointerup', end);
    vp.addEventListener('pointercancel', end);
    vp.addEventListener('lostpointercapture', end);
    vp.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    vp.addEventListener('dragstart', function (e) { e.preventDefault(); });
    vp.addEventListener('wheel', function (e) {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      mode = 'idle'; cancelAnimationFrame(raf);
      x = clamp(x - e.deltaX, min, max); render();
    }, { passive: false });
    vp.addEventListener('keydown', function (e) {
      var i = index();
      if (e.key === 'ArrowRight') { e.preventDefault(); goTo(i + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(x <= min + 2 ? i - 1 : (Math.abs(-(cards[i].offsetLeft - padLeft()) - x) > 8 ? i : i - 1)); }
      else if (e.key === 'Home') { e.preventDefault(); goTo(0); }
      else if (e.key === 'End') { e.preventDefault(); goTo(cards.length - 1); }
    });
    if (prev) prev.addEventListener('click', function () { var i = index(); goTo(Math.abs(-(cards[i].offsetLeft - padLeft()) - x) > 8 && x > min + 2 ? i : i - 1); });
    if (next) next.addEventListener('click', function () { goTo(index() + 1); });

    // Zieh-Cursor (nur feiner Zeiger), mit Lerp nachgeführt
    if (cursor && finePointer.matches && !reduced()) {
      var cx = -200, cy = -200, tx = -200, ty = -200, sc = 0.6, ts = 0.6, craf = 0, on = false;
      var cl = function () {
        cx = lerp(cx, tx, 0.22); cy = lerp(cy, ty, 0.22);
        ts = cursor.classList.contains('is-down') ? 0.82 : 1; sc = lerp(sc, on ? ts : 0.6, 0.2);
        cursor.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0) scale(' + sc.toFixed(3) + ')';
        if (on || Math.abs(sc - 0.6) > 0.01) craf = requestAnimationFrame(cl); else craf = 0;
      };
      vp.addEventListener('pointerenter', function (e) {
        if (e.pointerType !== 'mouse') return;
        on = true; tx = e.clientX; ty = e.clientY; if (cx < -100) { cx = tx; cy = ty; }
        cursor.classList.add('is-on'); if (!craf) craf = requestAnimationFrame(cl);
      });
      vp.addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse') { tx = e.clientX; ty = e.clientY; } });
      vp.addEventListener('pointerleave', function (e) { if (e.pointerType !== 'mouse') return; on = false; cursor.classList.remove('is-on'); });
      vp.style.cursor = 'none';
    }

    var onResize = function () { bounds(); x = clamp(x, min, max); lastIdx = -1; render(); };
    // ResizeObserver meldet die Startgröße selbst (nach dem Layout) – kein erzwungenes Layout beim Init
    if ('ResizeObserver' in window) new ResizeObserver(onResize).observe(vp); else { window.addEventListener('resize', onResize); onResize(); }
  }


  /* ------------------------------------------------------------------
     Team: Name zeigen → Stuhl im Grundriss leuchtet
     ------------------------------------------------------------------ */
  function initTeam() {
    var rows = qsa('.barber[data-chair]'), plan = qs('[data-plan]');
    if (!rows.length || !plan) return;
    var chairs = {};
    qsa('.plan-chair', plan).forEach(function (c) { chairs[c.getAttribute('data-chair')] = c; });
    var set = function (id) {
      rows.forEach(function (r) { r.classList.toggle('is-on', r.getAttribute('data-chair') === id); });
      Object.keys(chairs).forEach(function (k) { chairs[k].classList.toggle('is-on', k === id); });
    };
    rows.forEach(function (r) {
      var id = r.getAttribute('data-chair');
      r.addEventListener('pointerenter', function () { set(id); });
      r.addEventListener('focusin', function () { set(id); });
    });
    Object.keys(chairs).forEach(function (k) { chairs[k].addEventListener('pointerenter', function () { set(k); }); });
    set('murat');
  }

  /* ------------------------------------------------------------------
     Datum/Zeit in Köln
     ------------------------------------------------------------------ */
  var berlinFmt = null; // Intl-Formatter ist teuer im Aufbau → einmal erzeugen
  function berlinNow() {
    var parts = {};
    try {
      berlinFmt = berlinFmt || new Intl.DateTimeFormat('en-GB', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
      berlinFmt.formatToParts(new Date()).forEach(function (p) { parts[p.type] = p.value; });
    } catch (e) {
      var d = new Date(); parts = { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate(), hour: d.getHours(), minute: d.getMinutes() };
    }
    var y = +parts.year, m = +parts.month, day = +parts.day, h = +parts.hour % 24, min = +parts.minute;
    var date = new Date(Date.UTC(y, m - 1, day));
    return { date: date, wd: date.getUTCDay(), minutes: h * 60 + min };
  }
  var WD_SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  var WD_LONG = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  var MONTHS = ['Jan.', 'Feb.', 'März', 'Apr.', 'Mai', 'Juni', 'Juli', 'Aug.', 'Sept.', 'Okt.', 'Nov.', 'Dez.'];
  var MONTHS_LONG = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  var fmtTime = function (min) { return pad2(Math.floor(min / 60)) + ':' + pad2(min % 60); };
  var fmtHour = function (h) { return String(h); };


  function initOpenStatus() {
    var now = berlinNow();
    var el = qs('[data-open-status]'), state = qs('[data-open-state]'), txt = qs('[data-open-text]');
    if (el && txt && state) {
      var h = HOURS[now.wd], open = h && now.minutes >= h[0] * 60 && now.minutes < h[1] * 60;
      if (open) { el.classList.add('is-open'); state.textContent = 'Geöffnet'; txt.textContent = 'heute bis ' + fmtHour(h[1]) + ' Uhr'; }
      else {
        el.classList.add('is-closed');
        var label = '';
        if (h && now.minutes < h[0] * 60) label = 'heute ab ' + fmtHour(h[0]) + ' Uhr';
        else {
          for (var i = 1; i <= 7; i++) { var wd = (now.wd + i) % 7; if (HOURS[wd]) { label = (i === 1 ? 'morgen' : WD_SHORT[wd]) + ' ab ' + fmtHour(HOURS[wd][0]) + ' Uhr'; break; } }
        }
        state.textContent = 'Geschlossen'; txt.textContent = 'wieder ' + label;
      }
    }
    var row = qs('[data-hours] tr[data-day="' + (now.wd === 1 ? 0 : now.wd) + '"]');
    if (row) row.classList.add('is-today');
  }

  /* ------------------------------------------------------------------
     Termin-Buchung in drei Schritten
     ------------------------------------------------------------------ */
  var Booking = null;
  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15;
    return (h >>> 0) / 4294967296;
  }
  function initBooking() {
    var root = qs('[data-booking]');
    if (!root) return;
    var form = qs('[data-bk-form]', root), layout = qs('.bk-layout', root), stepsNav = qs('.bk-steps', root), done = qs('[data-bk-done]', root);
    var panels = qsa('[data-panel]', root), stepBtns = qsa('[data-goto]', root), line = qs('[data-bk-line]', root);
    var slotsWrap = qs('[data-slots]', root);
    var sum = {}; qsa('[data-sum]', root).forEach(function (el) { sum[el.getAttribute('data-sum')] = el; });
    var mqWeek = window.matchMedia('(min-width: 900px)');
    var now = berlinNow();
    var state = { step: 1, service: null, barber: 'egal', slot: null, dayIdx: 0 };

    var days = [];
    for (var i = 0; i < DAYS_AHEAD; i++) {
      var d = new Date(now.date.getTime() + i * 86400000);
      days.push({ idx: i, date: d, wd: d.getUTCDay(), key: d.getUTCFullYear() + '-' + pad2(d.getUTCMonth() + 1) + '-' + pad2(d.getUTCDate()), hours: HOURS[d.getUTCDay()] || null });
    }
    // erster Tag mit Öffnung als Startauswahl
    for (var j = 0; j < days.length; j++) { if (days[j].hours) { state.dayIdx = j; break; } }

    function svc() { return state.service ? SERVICES[state.service] : null; }
    function nSlots() { var s = svc(); return Math.ceil((s ? s.dur : SLOT_MIN) / SLOT_MIN); }
    function busy(barber, day, slotStart) {
      var q = day.wd === 6 ? BELEGT_QUOTE.samstag : BELEGT_QUOTE.normal;
      return hash(barber + '|' + day.key + '|' + slotStart) < q;
    }
    function barberFree(id, day, start) {
      if (BARBERS[id].days.indexOf(day.wd) < 0) return false;
      var n = nSlots();
      for (var k = 0; k < n; k++) { if (busy(id, day, start + k * SLOT_MIN)) return false; }
      return true;
    }
    /* Status eines Slots: 'free' | 'busy' | 'past' | 'none' ; liefert zugeteilten Barbier */
    function slotState(day, start) {
      if (!day.hours) return { s: 'none' };
      var s = svc(), dur = s ? s.dur : SLOT_MIN;
      if (start < day.hours[0] * 60 || start + dur > day.hours[1] * 60) return { s: 'none' };
      if (day.idx === 0 && start < now.minutes + VORLAUF_MIN) return { s: 'past' };
      if (state.barber !== 'egal') return barberFree(state.barber, day, start) ? { s: 'free', barber: state.barber } : { s: 'busy' };
      for (var i = 0; i < ANY_ORDER.length; i++) { if (barberFree(ANY_ORDER[i], day, start)) return { s: 'free', barber: ANY_ORDER[i] }; }
      return { s: 'busy' };
    }
    function dayWorks(day) { return !!day.hours && (state.barber === 'egal' || BARBERS[state.barber].days.indexOf(day.wd) >= 0); }
    function dayTimes(day) {
      var out = [];
      if (!day.hours) return out;
      for (var t = day.hours[0] * 60; t < day.hours[1] * 60; t += SLOT_MIN) out.push(t);
      return out;
    }
    function freeCount(day) { var c = 0; dayTimes(day).forEach(function (t) { if (slotState(day, t).s === 'free') c++; }); return c; }
    function dayLabel(day, long) { var dd = day.date.getUTCDate(); return long ? WD_LONG[day.wd] + ', ' + dd + '. ' + MONTHS_LONG[day.date.getUTCMonth()] : WD_SHORT[day.wd] + ', ' + dd + '. ' + MONTHS[day.date.getUTCMonth()]; }
    function slotLabel(sl) {
      var day = days[sl.dayIdx], s = svc();
      return dayLabel(day) + ' · ' + fmtTime(sl.start) + '–' + fmtTime(sl.start + (s ? s.dur : SLOT_MIN)) + ' Uhr';
    }
    function price() {
      var s = svc(); if (!s) return null;
      var b = state.slot ? state.slot.barber : (state.barber !== 'egal' ? state.barber : null);
      return s.price + (b && BARBERS[b].meister ? MEISTER_AUFSCHLAG : 0);
    }
    function bump(el) { if (reduced()) return; el.classList.remove('is-bump'); void el.offsetWidth; el.classList.add('is-bump'); }
    function setSum(key, val) { var el = sum[key]; if (el && el.textContent !== val) { el.textContent = val; bump(el); } }
    function updateSummary() {
      var s = svc();
      setSum('service', s ? s.name : '–');
      var bt;
      if (state.barber === 'egal') bt = state.slot ? 'Erster freier: ' + BARBERS[state.slot.barber].name.split(' ')[0] : 'Erster freier Stuhl';
      else bt = BARBERS[state.barber].name;
      setSum('barber', bt);
      setSum('slot', state.slot ? slotLabel(state.slot) : '–');
      setSum('dur', s ? s.dur + ' Min.' : '–');
      var p = price();
      setSum('price', p === null ? '–' : p + ' €');
    }

    /* --- Zeitslots rendern --- */
    function makeSlotBtn(day, t, st) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'slot';
      b.textContent = fmtTime(t);
      b.setAttribute('data-day', day.idx); b.setAttribute('data-t', t);
      var label = dayLabel(day, true) + ', ' + fmtTime(t) + ' Uhr';
      if (st.s === 'free') {
        var sel = state.slot && state.slot.dayIdx === day.idx && state.slot.start === t;
        b.setAttribute('aria-pressed', sel ? 'true' : 'false');
        b.setAttribute('aria-label', label + (sel ? ', gewählt' : ', frei'));
      } else {
        b.disabled = true;
        if (st.s === 'past') b.classList.add('is-past');
        b.setAttribute('aria-label', label + (st.s === 'past' ? ', nicht mehr buchbar' : ', belegt'));
      }
      return b;
    }
    function renderWeek() {
      var wrap = document.createElement('div'); wrap.className = 'week'; wrap.setAttribute('data-lenis-prevent', '');
      var grid = document.createElement('div'); grid.className = 'week-grid';
      grid.setAttribute('role', 'group'); grid.setAttribute('aria-label', 'Freie Zeiten der nächsten sieben Tage. Pfeiltasten wechseln zwischen den Zeiten.');
      var minT = Infinity, maxT = 0;
      days.forEach(function (d) { if (dayWorks(d)) { minT = Math.min(minT, d.hours[0] * 60); maxT = Math.max(maxT, d.hours[1] * 60); } });
      if (minT === Infinity) { minT = 10 * 60; maxT = 20 * 60; }
      var s0 = svc(); maxT -= (s0 ? s0.dur : SLOT_MIN) - SLOT_MIN; // letzte mögliche Startzeit
      var rows = []; for (var t = minT; t < maxT; t += SLOT_MIN) rows.push(t);
      grid.style.gridTemplateRows = 'auto repeat(' + rows.length + ', 2.4rem)';
      var corner = document.createElement('div'); corner.className = 'wk-corner'; corner.setAttribute('aria-hidden', 'true'); grid.appendChild(corner);
      days.forEach(function (d) {
        var h = document.createElement('div'); h.className = 'wk-head' + (dayWorks(d) ? '' : ' is-closed') + (d.idx === 0 ? ' is-today' : '');
        var wd = document.createElement('span'); wd.className = 'wd'; wd.textContent = WD_SHORT[d.wd];
        var dt = document.createElement('span'); dt.className = 'dt'; dt.textContent = d.date.getUTCDate() + '.' + (d.date.getUTCMonth() + 1) + '.';
        var fr = document.createElement('span'); fr.className = 'fr';
        fr.textContent = !d.hours ? 'Ruhetag' : (!dayWorks(d) ? 'nicht da' : freeCount(d) + ' frei');
        h.appendChild(wd); h.appendChild(dt); h.appendChild(fr); grid.appendChild(h);
      });
      rows.forEach(function (t, r) {
        var tl = document.createElement('div'); tl.className = 'wk-time'; tl.textContent = fmtTime(t); tl.setAttribute('aria-hidden', 'true');
        tl.style.gridRow = String(r + 2); tl.style.gridColumn = '1';
        grid.appendChild(tl);
        days.forEach(function (d, c) {
          var cell = document.createElement('div'); cell.className = 'wk-cell';
          cell.style.gridRow = String(r + 2); cell.style.gridColumn = String(c + 2);
          if (!dayWorks(d)) cell.classList.add('is-closed');
          else {
            var st = slotState(d, t);
            if (st.s !== 'none') { var b = makeSlotBtn(d, t, st); b.setAttribute('data-c', c); b.setAttribute('data-r', r); cell.appendChild(b); }
          }
          grid.appendChild(cell);
        });
      });
      days.forEach(function (d, c) {
        if (dayWorks(d)) return;
        var lab = document.createElement('div'); lab.className = 'wk-closed-label'; lab.setAttribute('aria-hidden', 'true');
        lab.textContent = !d.hours ? 'Ruhetag' : 'nicht im Laden';
        lab.style.gridColumn = String(c + 2); grid.appendChild(lab);
      });
      wrap.appendChild(grid);
      return wrap;
    }
    function renderDays() {
      var frag = document.createDocumentFragment();
      var tabs = document.createElement('div'); tabs.className = 'days'; tabs.setAttribute('role', 'tablist'); tabs.setAttribute('aria-label', 'Tag wählen');
      days.forEach(function (d) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'day-tab' + (dayWorks(d) ? '' : ' is-closed');
        b.setAttribute('role', 'tab'); b.id = 'day-tab-' + d.idx; b.setAttribute('aria-controls', 'day-panel');
        var sel = d.idx === state.dayIdx;
        b.setAttribute('aria-selected', sel ? 'true' : 'false'); b.tabIndex = sel ? 0 : -1;
        b.setAttribute('data-day-tab', d.idx);
        var wd = document.createElement('span'); wd.className = 'wd'; wd.textContent = WD_SHORT[d.wd];
        var dt = document.createElement('span'); dt.className = 'dt'; dt.textContent = d.date.getUTCDate() + '.';
        var fr = document.createElement('span'); fr.className = 'fr'; fr.textContent = !d.hours ? 'zu' : (!dayWorks(d) ? '–' : freeCount(d) + ' frei');
        b.setAttribute('aria-label', dayLabel(d, true) + (!d.hours ? ', Ruhetag' : (!dayWorks(d) ? ', Barbier nicht im Laden' : ', ' + freeCount(d) + ' Zeiten frei')));
        b.appendChild(wd); b.appendChild(dt); b.appendChild(fr); tabs.appendChild(b);
      });
      frag.appendChild(tabs);
      var panel = document.createElement('div'); panel.className = 'day-slots'; panel.id = 'day-panel'; panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', 'day-tab-' + state.dayIdx);
      var day = days[state.dayIdx];
      var times = dayWorks(day) ? dayTimes(day).filter(function (t) { return slotState(day, t).s !== 'none'; }) : [];
      if (!times.length) {
        var e = document.createElement('p'); e.className = 'day-empty';
        e.textContent = !day.hours ? WD_LONG[day.wd] + 's ist Ruhetag.' : (!dayWorks(day) ? BARBERS[state.barber].name.split(' ')[0] + ' ist an diesem Tag nicht im Laden.' : 'Keine Zeiten an diesem Tag.');
        panel.appendChild(e);
      } else times.forEach(function (t) { panel.appendChild(makeSlotBtn(day, t, slotState(day, t))); });
      frag.appendChild(panel);
      return frag;
    }
    function legend() {
      var l = document.createElement('p'); l.className = 'slots-legend'; l.setAttribute('aria-hidden', 'true');
      [['', 'frei'], ['lg-busy', 'belegt'], ['lg-sel', 'gewählt']].forEach(function (x) {
        var s = document.createElement('span'); var i = document.createElement('i'); if (x[0]) i.className = x[0];
        s.appendChild(i); s.appendChild(document.createTextNode(x[1])); l.appendChild(s);
      });
      return l;
    }
    var live = document.createElement('p'); live.className = 'sr-only'; live.setAttribute('aria-live', 'polite');
    function renderSlots(keepFocus) {
      var focused = document.activeElement, fDay = null, fT = null, fTab = null;
      if (keepFocus && focused && slotsWrap.contains(focused)) { fDay = focused.getAttribute('data-day'); fT = focused.getAttribute('data-t'); fTab = focused.getAttribute('data-day-tab'); }
      var oldWeek = qs('.week', slotsWrap), oldTop = oldWeek ? oldWeek.scrollTop : null;
      qsa(':scope > :not(.slots-fallback)', slotsWrap).forEach(function (n) { n.remove(); });
      var weekMode = mqWeek.matches;
      var view = weekMode ? renderWeek() : renderDays();
      slotsWrap.appendChild(view);
      slotsWrap.appendChild(legend());
      slotsWrap.appendChild(live);
      // Roving tabindex im Wochenraster
      if (weekMode) {
        var btns = qsa('.slot:not([disabled])', slotsWrap);
        btns.forEach(function (b) { b.tabIndex = -1; });
        var earliest = btns.slice().sort(function (a, b) { return (+a.getAttribute('data-c') - +b.getAttribute('data-c')) || (+a.getAttribute('data-r') - +b.getAttribute('data-r')); })[0];
        var first = qs('.slot[aria-pressed="true"]', slotsWrap) || earliest;
        if (first) first.tabIndex = 0;
        var wk = qs('.week', slotsWrap), head = qs('.wk-head', slotsWrap);
        if (wk) {
          if (keepFocus && oldTop !== null) wk.scrollTop = oldTop;
          else if (first) { // ersten freien (oder gewählten) Slot ins Bild holen
            var row = qs('.wk-time', slotsWrap), rh = row ? row.offsetHeight : 38;
            wk.scrollTop = Math.max(0, (+first.getAttribute('data-r') - 1) * rh);
          }
        }
      }
      if (fTab !== null) { var tb = qs('[data-day-tab="' + fTab + '"]', slotsWrap); if (tb) tb.focus(); }
      else if (fT !== null) { var fb = qs('.slot[data-day="' + fDay + '"][data-t="' + fT + '"]', slotsWrap); if (fb && !fb.disabled) { fb.tabIndex = 0; fb.focus(); } }
    }
    function pickDay() { // ohne Auswahl: ersten Tag mit freien Zeiten vorwählen
      if (state.slot) { state.dayIdx = state.slot.dayIdx; return; }
      if (dayWorks(days[state.dayIdx]) && freeCount(days[state.dayIdx]) > 0) return;
      for (var i = 0; i < days.length; i++) { if (dayWorks(days[i]) && freeCount(days[i]) > 0) { state.dayIdx = i; return; } }
    }
    function validateSlot() {
      if (!state.slot) return;
      var day = days[state.slot.dayIdx], st = slotState(day, state.slot.start);
      if (st.s !== 'free') { state.slot = null; live.textContent = 'Die gewählte Zeit passt nicht mehr zur Auswahl – bitte neu wählen.'; }
      else state.slot.barber = st.barber;
    }
    slotsWrap.addEventListener('click', function (e) {
      var tab = e.target.closest('[data-day-tab]');
      if (tab) { state.dayIdx = +tab.getAttribute('data-day-tab'); renderSlots(true); return; }
      var b = e.target.closest('.slot');
      if (!b || b.disabled) return;
      var day = days[+b.getAttribute('data-day')], t = +b.getAttribute('data-t'), st = slotState(day, t);
      if (st.s !== 'free') return;
      state.slot = { dayIdx: day.idx, start: t, barber: st.barber };
      state.dayIdx = day.idx;
      setError(3, '');
      renderSlots(true);
      updateSummary();
      live.textContent = 'Gewählt: ' + slotLabel(state.slot) + (state.barber === 'egal' ? ', bei ' + BARBERS[st.barber].name : '');
    });
    slotsWrap.addEventListener('keydown', function (e) {
      var tab = e.target.closest('[data-day-tab]');
      if (tab) {
        var i = +tab.getAttribute('data-day-tab'), n = days.length, ni = null;
        if (e.key === 'ArrowRight') ni = (i + 1) % n; else if (e.key === 'ArrowLeft') ni = (i - 1 + n) % n; else if (e.key === 'Home') ni = 0; else if (e.key === 'End') ni = n - 1;
        if (ni !== null) { e.preventDefault(); state.dayIdx = ni; renderSlots(false); var nt = qs('[data-day-tab="' + ni + '"]', slotsWrap); if (nt) nt.focus(); }
        return;
      }
      var b = e.target.closest('.slot');
      if (!b || !b.hasAttribute('data-c')) return;
      var c = +b.getAttribute('data-c'), r = +b.getAttribute('data-r');
      var all = qsa('.slot[data-c]:not([disabled])', slotsWrap);
      var at = function (cc, rr) { for (var k = 0; k < all.length; k++) { if (+all[k].getAttribute('data-c') === cc && +all[k].getAttribute('data-r') === rr) return all[k]; } return null; };
      var nearestInCol = function (cc, rr) { var best = null, bd = Infinity; all.forEach(function (x) { if (+x.getAttribute('data-c') !== cc) return; var dd = Math.abs(+x.getAttribute('data-r') - rr); if (dd < bd) { bd = dd; best = x; } }); return best; };
      var tgt = null, k;
      if (e.key === 'ArrowDown') { for (k = r + 1; k < 40 && !tgt; k++) tgt = at(c, k); }
      else if (e.key === 'ArrowUp') { for (k = r - 1; k >= 0 && !tgt; k--) tgt = at(c, k); }
      else if (e.key === 'ArrowRight') { for (k = c + 1; k < 7 && !tgt; k++) tgt = at(k, r) || nearestInCol(k, r); }
      else if (e.key === 'ArrowLeft') { for (k = c - 1; k >= 0 && !tgt; k--) tgt = at(k, r) || nearestInCol(k, r); }
      else if (e.key === 'Home') { tgt = nearestInCol(c, 0); }
      else if (e.key === 'End') { tgt = nearestInCol(c, 40); }
      else return;
      e.preventDefault();
      if (tgt) { all.forEach(function (x) { x.tabIndex = -1; }); tgt.tabIndex = 0; tgt.focus(); }
    });
    mqWeek.addEventListener('change', function () { renderSlots(false); });

    /* --- Schritte --- */
    function setError(n, msg) { var el = qs('[data-err="' + n + '"]', root); if (el) el.textContent = msg; }
    function canEnter(n) {
      if (n >= 2 && !state.service) { setError(1, 'Bitte wählen Sie zuerst eine Leistung.'); return 1; }
      return n;
    }
    function goStep(n, opts) {
      opts = opts || {};
      n = canEnter(n);
      var prevStep = state.step;
      state.step = n;
      panels.forEach(function (p) {
        var on = +p.getAttribute('data-panel') === n;
        p.classList.toggle('is-active', on);
        p.classList.remove('is-entering', 'from-left');
        if (on && prevStep !== n && !opts.instant) { void p.offsetWidth; p.classList.add('is-entering'); if (n < prevStep) p.classList.add('from-left'); }
      });
      stepBtns.forEach(function (b) {
        var k = +b.getAttribute('data-goto');
        b.classList.toggle('is-current', k === n);
        b.classList.toggle('is-done', k < n || (k === 1 && !!state.service && n !== 1));
        if (k === n) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
      });
      if (line) line.style.transform = 'scaleX(' + (n / 3).toFixed(4) + ')';
      if (n === 3) { pickDay(); renderSlots(false); }
      if (opts.focus) {
        var leg = qs('[data-panel="' + n + '"] .bk-legend', root);
        if (leg) { leg.setAttribute('tabindex', '-1'); leg.focus({ preventScroll: true }); }
        var top = root.getBoundingClientRect().top;
        if (top < headerOffset() - 4) scrollToTarget(root, { noFocus: true });
      }
    }
    qsa('[data-next]', root).forEach(function (b) { b.addEventListener('click', function () { goStep(+b.getAttribute('data-next'), { focus: true }); }); });
    qsa('[data-prev]', root).forEach(function (b) { b.addEventListener('click', function () { goStep(+b.getAttribute('data-prev'), { focus: true }); }); });
    stepBtns.forEach(function (b) { b.addEventListener('click', function () { goStep(+b.getAttribute('data-goto'), { focus: true }); }); });

    form.addEventListener('change', function (e) {
      var t = e.target;
      if (t.name === 'service') { state.service = t.value; setError(1, ''); validateSlot(); updateSummary(); if (state.step === 3) renderSlots(true); stepBtns[0].classList.toggle('is-done', state.step !== 1); }
      if (t.name === 'barber') { state.barber = t.value; validateSlot(); updateSummary(); if (state.step === 3) { pickDay(); renderSlots(true); } }
    });

    /* --- Formular prüfen & absenden --- */
    function fieldErr(name, msg) {
      var input = form.elements[name], out = qs('[data-field-err="' + name + '"]', form);
      if (out) out.textContent = msg;
      if (input) { if (msg) { input.setAttribute('aria-invalid', 'true'); if (out) { out.id = 'err-' + name; input.setAttribute('aria-describedby', out.id); } } else { input.removeAttribute('aria-invalid'); input.removeAttribute('aria-describedby'); } }
      return !msg;
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!state.service) { goStep(1, { focus: true }); setError(1, 'Bitte wählen Sie eine Leistung.'); return; }
      var ok = true, firstBad = null;
      var name = form.elements.name.value.trim(), phone = form.elements.phone.value.trim(), mail = form.elements.email.value.trim();
      if (!state.slot) { setError(3, 'Bitte wählen Sie eine freie Uhrzeit im Raster.'); ok = false; firstBad = firstBad || qs('.slot:not([disabled])', slotsWrap) || qs('[data-day-tab]', slotsWrap); } else setError(3, '');
      if (!fieldErr('name', name.length < 2 ? 'Bitte geben Sie Ihren Namen an.' : '')) { ok = false; firstBad = firstBad || form.elements.name; }
      var digits = phone.replace(/\D/g, '');
      if (!fieldErr('phone', (!/^[+()\d\s\/-]+$/.test(phone) || digits.length < 6) ? 'Bitte eine Telefonnummer angeben, z. B. 0221 1234567.' : '')) { ok = false; firstBad = firstBad || form.elements.phone; }
      if (!fieldErr('email', mail && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail) ? 'Diese E-Mail-Adresse sieht unvollständig aus.' : '')) { ok = false; firstBad = firstBad || form.elements.email; }
      if (!fieldErr('consent', form.elements.consent.checked ? '' : 'Bitte bestätigen Sie die Einwilligung.')) { ok = false; firstBad = firstBad || form.elements.consent; }
      if (!ok) { if (firstBad) firstBad.focus(); return; }
      showDone({ name: name, phone: phone, mail: mail, note: form.elements.note.value.trim() });
    });
    ['name', 'phone', 'email'].forEach(function (n) { form.elements[n].addEventListener('input', function () { if (form.elements[n].getAttribute('aria-invalid')) fieldErr(n, ''); }); });
    form.elements.consent.addEventListener('change', function () { if (form.elements.consent.checked) fieldErr('consent', ''); });

    var lastBooking = null;
    function showDone(c) {
      var s = svc(), b = BARBERS[state.slot.barber];
      lastBooking = { service: s, barber: b, slot: { dayIdx: state.slot.dayIdx, start: state.slot.start } };
      var list = qs('[data-done-list]', done);
      while (list.firstChild) list.removeChild(list.firstChild);
      var rows = [['Leistung', s.name], ['Barbier', b.name], ['Termin', slotLabel(state.slot)], ['Dauer', s.dur + ' Min.'], ['Preis', price() + ' € (Zahlung im Laden)'], ['Name', c.name], ['Telefon', c.phone]];
      if (c.mail) rows.push(['E-Mail', c.mail]);
      if (c.note) rows.push(['Notiz', c.note]);
      rows.forEach(function (r) {
        var div = document.createElement('div'), dt = document.createElement('dt'), dd = document.createElement('dd');
        dt.textContent = r[0]; dd.textContent = r[1]; div.appendChild(dt); div.appendChild(dd); list.appendChild(div);
      });
      layout.hidden = true; stepsNav.hidden = true; done.hidden = false;
      done.focus({ preventScroll: true });
      if (root.getBoundingClientRect().top < headerOffset()) scrollToTarget(root, { noFocus: true });
    }
    qs('[data-restart]', done).addEventListener('click', function () {
      form.reset(); qsa('[aria-invalid]', form).forEach(function (x) { x.removeAttribute('aria-invalid'); });
      qsa('[data-field-err]', form).forEach(function (x) { x.textContent = ''; });
      state.service = null; state.barber = 'egal'; state.slot = null;
      updateSummary();
      done.hidden = true; layout.hidden = false; stepsNav.hidden = false;
      goStep(1, { focus: true });
    });
    qs('[data-ics]', done).addEventListener('click', function () {
      if (!lastBooking) return;
      var day = days[lastBooking.slot.dayIdx], d = day.date;
      var stamp = function (min) { return d.getUTCFullYear() + pad2(d.getUTCMonth() + 1) + pad2(d.getUTCDate()) + 'T' + pad2(Math.floor(min / 60)) + pad2(min % 60) + '00'; };
      var ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//KAISER Barbershop Demo//DE', 'BEGIN:VEVENT',
        'UID:' + Date.now() + '@kaiser-barbershop.demo', 'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, ''),
        'DTSTART;TZID=Europe/Berlin:' + stamp(lastBooking.slot.start), 'DTEND;TZID=Europe/Berlin:' + stamp(lastBooking.slot.start + lastBooking.service.dur),
        'SUMMARY:KAISER Barbershop – ' + lastBooking.service.name + ' bei ' + lastBooking.barber.name.split(' ')[0],
        'LOCATION:Venloer Straße 211\\, 50823 Köln', 'DESCRIPTION:Demo-Termin – es wurde nichts gebucht.', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
      var url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
      var a = document.createElement('a'); a.href = url; a.download = 'kaiser-termin.ics'; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
    });

    // Fokus in Feldern: mobile Aktionsleiste ausblenden
    var bar = qs('.action-bar');
    if (bar) {
      form.addEventListener('focusin', function (e) { if (/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName) && e.target.type !== 'radio' && e.target.type !== 'checkbox') bar.classList.add('is-hidden'); });
      form.addEventListener('focusout', function () { bar.classList.remove('is-hidden'); });
    }

    Booking = {
      preset: function (opts) {
        if (!done.hidden) { done.hidden = true; layout.hidden = false; stepsNav.hidden = false; }
        if (opts.service && SERVICES[opts.service]) {
          var r = qs('input[name="service"][value="' + opts.service + '"]', form); if (r) r.checked = true;
          state.service = opts.service; setError(1, '');
        }
        if (opts.barber && (BARBERS[opts.barber] || opts.barber === 'egal')) {
          var rb = qs('input[name="barber"][value="' + opts.barber + '"]', form); if (rb) rb.checked = true;
          state.barber = opts.barber;
        }
        if (opts.note && !form.elements.note.value) form.elements.note.value = opts.note;
        validateSlot(); updateSummary();
        goStep(opts.barber ? (state.service ? 3 : 1) : (state.service ? 2 : 1), { instant: false });
      }
    };
    // Startzustand
    var preS = qs('input[name="service"]:checked', form); if (preS) state.service = preS.value;
    var preB = qs('input[name="barber"]:checked', form); if (preB) state.barber = preB.value;
    updateSummary();
    goStep(1, { instant: true });
  }

  /* Deep-Links: „… buchen“-Buttons befüllen die Buchung vor */
  function initDeepLinks() {
    document.addEventListener('click', function (e) {
      var el = e.target.closest && e.target.closest('[data-book-service], [data-book-barber]');
      if (!el || !Booking) return;
      var opts = {};
      if (el.hasAttribute('data-book-service')) opts.service = el.getAttribute('data-book-service');
      if (el.hasAttribute('data-book-barber')) opts.barber = el.getAttribute('data-book-barber');
      if (el.hasAttribute('data-beard-style')) opts.note = 'Bartwunsch: ' + el.getAttribute('data-beard-style');
      Booking.preset(opts);
    }, true);
  }


  /* ------------------------------------------------------------------
     Start
     ------------------------------------------------------------------ */
  /* Eigener Task pro Schritt: hält den Main-Thread frei, damit der Hero-Auftakt
     nicht hinter einem langen Init-Block hängt (scheduler.postTask, sonst MessageChannel). */
  var nextTask = (function () {
    if (window.scheduler && typeof window.scheduler.postTask === 'function') return function (fn) { window.scheduler.postTask(fn, { priority: 'user-visible' }); };
    if (typeof MessageChannel === 'function') {
      var ch = new MessageChannel(), q = [];
      ch.port1.onmessage = function () { var f = q.shift(); if (f) f(); };
      return function (fn) { q.push(fn); ch.port2.postMessage(0); };
    }
    return function (fn) { setTimeout(fn, 0); };
  })();


  function start() {
    // sofort: Scrollen, Header und Menü (nehmen Eingaben an)
    safe('scroll', initScroll);
    safe('header', initHeader);
    safe('menu', initMenu);
    // danach in kleinen Häppchen – zuerst der erste Bildschirm, dann der Rest
    var queue = [
      ['status', initOpenStatus], ['hero', initHero], ['pole', initPole], ['roll', initRoll], ['magnet', initMagnet], ['chapters', initChapters], ['cuts', initCuts], ['statement', initStatement], ['services', initServices],
      ['ritual', initRitual], ['mirror', initMirror], ['prices', initPrices], ['beard', initBeard], ['gallery', initGallery],
      ['team', initTeam], ['booking', initBooking], ['deeplinks', initDeepLinks], ['gold', initGold]
    ];
    var run = function () {
      var job = queue.shift();
      if (!job) { if (hasGSAP) requestAnimationFrame(function () { ScrollTrigger.refresh(); }); return; }
      safe(job[0], job[1]);
      nextTask(run);
    };
    nextTask(run);
    if (hasGSAP && document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { if (document.readyState === 'complete') ScrollTrigger.refresh(); });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else nextTask(start);
})();
