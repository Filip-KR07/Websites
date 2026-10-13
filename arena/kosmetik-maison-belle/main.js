/* ==========================================================================
   Maison Belle – Kosmetik & Skin Studio · Modell „Seide“ (Demo, fiktiv)
   Interaktionen ohne Build. Optional: GSAP + ScrollTrigger, Lenis.
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
     Anpassbare Werte (alle Beträge in Euro, unverbindliche Beispielwerte)
     ------------------------------------------------------------------ */
  /** Gutschein: Grenzen für den eigenen Betrag, Schrittweite, Gültigkeit
   *  (Jahre ab Ende des Kaufjahres) und Versandkosten je Zustellart. */
  var GIFT = {
    MIN: 25,
    MAX: 500,
    STEP: 5,
    VALID_YEARS: 3,
    SHIPPING: { mail: 0, post: 0, abholen: 0 },
    SHIP_NOTE: {
      mail: 'PDF kommt direkt nach der Zahlung · kostenfrei',
      post: 'Karte im Kuvert, 2–3 Werktage · Versand kostenfrei',
      abholen: 'Abholbereit ab dem nächsten Öffnungstag'
    }
  };
  /** Öffnungszeiten (0 = Sonntag … 6 = Samstag): [öffnet, schließt] in vollen Stunden, Zeitzone Europe/Berlin. */
  var HOURS = { 2: [10, 19], 3: [10, 19], 4: [10, 19], 5: [10, 19], 6: [10, 16] };
  /** Terminformular: Anzahl der Wunschtag-Chips (nur Öffnungstage) und Vorlauf in Tagen. */
  var BOOKING_DAYS = 12;
  var BOOKING_LEAD_DAYS = 1;
  /** Behandlungsmenü: Dauer-Gruppen in Minuten. */
  var DURATION = { kurz: [0, 45], mittel: [46, 75], lang: [76, 999] };
  /** Hautcheck: Empfehlung und Wirkstoff je Wunsch (Frage 3). Ausnahmen siehe evaluateQuiz(). */
  var QUIZ = {
    treatment: { glow: 'vitc', age: 'retinol', clear: 'signature', hydra: 'hydra', calm: 'calm' },
    active: { glow: 'vitc', age: 'retinol', clear: 'nia', hydra: 'hya', calm: 'nia' },
    typeLabel: { trocken: 'Trockene Haut', normal: 'Ausgeglichene Haut', misch: 'Mischhaut', oelig: 'Ölige Haut' },
    sensLabel: { '2': ', sensibel', '1': ', leicht reaktiv', '0': '' },
    typeReason: {
      trocken: 'Ihre Haut spannt nach dem Reinigen – ihr fehlen Feuchtigkeit und Lipide. Deshalb setzen wir auf Hyaluron und reichhaltige Masken statt austrocknender Peelings.',
      normal: 'Ihre Haut ist im Gleichgewicht. Wir können gezielt an Ihrem Wunsch arbeiten, statt erst Probleme auszugleichen.',
      misch: 'Glanz in der T-Zone, Ruhe an den Wangen: Wir behandeln beide Zonen unterschiedlich – klärend in der Mitte, pflegend außen.',
      oelig: 'Ihre Haut bildet viel Talg. Eine gründliche, aber sanfte Reinigung und Talg-regulierende Wirkstoffe bringen hier am meisten.'
    },
    sensReason: {
      '2': 'Weil Ihre Haut schnell reagiert, arbeiten wir ohne Dampf, ohne Duftstoffe und mit niedrigen Konzentrationen.',
      '1': 'Ihre Haut reagiert gelegentlich – neue Wirkstoffe testen wir zuerst an einer kleinen Stelle.',
      '0': 'Ihre Haut ist robust. Wir können mit wirksamen Konzentrationen arbeiten und schneller Ergebnisse sehen.'
    },
    treatReason: {
      vitc: 'Für mehr Frische ist Vitamin C der direkteste Weg: Der Teint wirkt klarer, Pigmentflecken werden über Wochen heller.',
      retinol: 'Retinol verfeinert Struktur und feine Linien. Wir dosieren es nach Ihrer Haut und begleiten die Kur über mehrere Termine.',
      signature: 'Das Signature Facial reinigt gründlich, klärt Poren mit sanfter Ausreinigung und beruhigt danach mit einer Maske nach Hauttyp.',
      hydra: 'Hydra-Glow füllt die Feuchtigkeitsspeicher mit Hyaluron in drei Molekülgrößen – spürbar geschmeidiger, ohne die Haut zu reizen.',
      calm: 'Calm & Barrier stärkt zuerst die Hautbarriere. Das ist die Grundlage, bevor wir mit stärkeren Wirkstoffen arbeiten.'
    },
    home: {
      kurz: 'Morgens: Wasser, Serum, LSF 50. Abends: milde Reinigung und Creme. Mehr braucht es nicht.',
      mittel: 'Ihre Basisroutine plus zweimal pro Woche ein mildes Peeling und eine Maske nach Hauttyp.',
      lang: 'Abends Doppelreinigung, Serum, Gesichtsöl – und sonntags eine Maske mit fünf Minuten Gesichtsmassage.'
    },
    activeName: { hya: 'Hyaluron', vitc: 'Vitamin C', retinol: 'Retinol', nia: 'Niacinamid' }
  };

  /* ------------------------------------------------------------------
     Grundlagen
     ------------------------------------------------------------------ */
  var root = document.documentElement;
  var motionOff = root.classList.contains('motion-off');
  var reduced = root.classList.contains('reduced');
  var MOTION = !motionOff && !reduced;             // volle Choreografie
  var UI_MOTION = !motionOff;                       // kleine UI-Übergänge (bei reduced nur Fades)
  var hasGSAP = !!(window.gsap && window.ScrollTrigger);
  var finePointer = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
  var EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';
  var EASE_IN_OUT = 'cubic-bezier(0.77, 0, 0.175, 1)';
  var lenis = null;

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  var euro = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
  function fmtEuro(n) { return euro.format(n); }
  function fmtEuroShort(n) { return n.toLocaleString('de-DE') + ' €'; }
  function headerH() { var h = $('[data-header]'); return h ? h.offsetHeight : 0; }

  var refreshTimer = 0;
  function scheduleRefresh(ms) {
    if (!hasGSAP) return;
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(function () { ScrollTrigger.refresh(); }, ms || 400);
  }

  /* Behandlungsdaten aus dem DOM (eine Quelle: das Menü in index.html) */
  var TREATS = {};
  $$('.treat').forEach(function (li) {
    var name = $('.treat-name', li).textContent.replace(/\s+/g, ' ').trim();
    TREATS[li.dataset.id] = { id: li.dataset.id, name: name, min: +li.dataset.min, price: +li.dataset.price, cat: li.dataset.cat, el: li };
  });

  /* ------------------------------------------------------------------
     Toast
     ------------------------------------------------------------------ */
  var toastEl = $('[data-toast]'), toastTimer = 0;
  function toast(text) {
    if (!toastEl) return;
    $('[data-toast-text]', toastEl).textContent = text;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-visible'); }, 3200);
  }

  /* ------------------------------------------------------------------
     Smooth Scroll (Lenis) + ScrollTrigger + Anker
     ------------------------------------------------------------------ */
  function initScroll() {
    if (hasGSAP) gsap.registerPlugin(ScrollTrigger);
    if (MOTION && window.Lenis) {
      lenis = new window.Lenis({ lerp: 0.095, smoothWheel: true, wheelMultiplier: 1, anchors: false });
      window.__lenis = lenis;
      if (hasGSAP) {
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
        gsap.ticker.lagSmoothing(0);
      } else {
        var loop = function (t) { lenis.raf(t); requestAnimationFrame(loop); };
        requestAnimationFrame(loop);
      }
    }
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button > 0) return;
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var target = document.getElementById(decodeURIComponent(id.slice(1)));
      if (!target) return;
      e.preventDefault();
      var dlg = a.closest('dialog');
      if (dlg && dlg.open) { closeMenu(function () { scrollToEl(target, { focus: true }); }); }
      else scrollToEl(target, { focus: true });
      if (history.replaceState) history.replaceState(null, '', id);
    });
  }

  function scrollToEl(target, opts) {
    opts = opts || {};
    var offset = opts.offset != null ? opts.offset : 0;
    var done = function () {
      if (opts.focusEl) { opts.focusEl.focus({ preventScroll: true }); return; }
      if (opts.focus) {
        if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      }
    };
    if (lenis) {
      lenis.scrollTo(target, {
        offset: offset, duration: 1.3,
        easing: function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; },
        onComplete: done
      });
    } else {
      var y = target.getBoundingClientRect().top + window.pageYOffset + offset;
      window.scrollTo({ top: y, behavior: UI_MOTION && !reduced ? 'smooth' : 'auto' });
      setTimeout(done, UI_MOTION && !reduced ? 700 : 0);
    }
  }

  /* ------------------------------------------------------------------
     Header, Fortschritt, aktive Navigation
     ------------------------------------------------------------------ */
  function initHeader() {
    var header = $('[data-header]');
    var bar = $('.scroll-progress span');
    var ticking = false;
    function update() {
      ticking = false;
      var y = window.pageYOffset;
      header.classList.toggle('is-scrolled', y > 24);
      var max = document.documentElement.scrollHeight - window.innerHeight;
      if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? clamp(y / max, 0, 1) : 0) + ')';
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();

    var links = $$('.nav a[href^="#"]');
    var map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var a = map[en.target.id];
        if (!a) return;
        if (en.isIntersecting) {
          links.forEach(function (l) { l.removeAttribute('aria-current'); });
          a.setAttribute('aria-current', 'true');
        } else if (a.getAttribute('aria-current')) {
          a.removeAttribute('aria-current');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
  }

  /* ------------------------------------------------------------------
     Menü (dialog)
     ------------------------------------------------------------------ */
  var menu, menuToggle;
  function initMenu() {
    menu = $('#menu'); menuToggle = $('.menu-toggle');
    if (!menu || !menuToggle || typeof menu.showModal !== 'function') return;
    menuToggle.addEventListener('click', function () {
      menu.showModal();
      menuToggle.setAttribute('aria-expanded', 'true');
      if (lenis) lenis.stop();
    });
    $('[data-menu-close]', menu).addEventListener('click', function () { closeMenu(); });
    menu.addEventListener('cancel', function (e) { e.preventDefault(); closeMenu(); });
    menu.addEventListener('click', function (e) { if (e.target === menu) closeMenu(); });
    menu.addEventListener('close', function () {
      menu.classList.remove('is-closing');
      menuToggle.setAttribute('aria-expanded', 'false');
      if (lenis) lenis.start();
    });
    window.addEventListener('resize', function () { if (window.innerWidth > 1120 && menu.open) menu.close(); });
  }
  function closeMenu(after) {
    if (!menu || !menu.open) { if (after) after(); return; }
    if (!UI_MOTION) { menu.close(); if (after) after(); return; }
    menu.classList.add('is-closing');
    setTimeout(function () { menu.close(); if (after) after(); }, 180);
  }

  /* ------------------------------------------------------------------
     Hero: Intro + Seidenwellen-Shader
     ------------------------------------------------------------------ */
  function initIntro() {
    var start = function () {
      requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.remove('is-loading'); }); });
    };
    var fired = false;
    var go = function () { if (!fired) { fired = true; start(); } };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(go);
    setTimeout(go, 700);
  }

  function initSilk() {
    var canvas = $('[data-silk]');
    if (!canvas) return;
    var gl = null;
    try { gl = canvas.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false, preserveDrawingBuffer: false }); } catch (e) { gl = null; }
    if (!gl) return; // CSS-Verlauf bleibt als Fallback sichtbar

    var vs = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
    var fs = [
      'precision mediump float;',
      'uniform vec2 uRes;uniform float uTime;uniform vec2 uMouse;uniform float uAspect;',
      'float hgt(vec2 p,float t){',
      '  vec2 q=p;',
      '  q.x+=0.32*sin(p.y*1.35+t*0.9);',
      '  q.y+=0.24*sin(p.x*1.05-t*0.7);',
      '  float h=0.55*sin(q.x*1.7+q.y*1.15+t*1.05);',
      '  h+=0.30*sin(q.x*-1.15+q.y*2.3-t*0.8+1.7);',
      '  h+=0.09*sin(q.x*3.4+q.y*-2.6+t*1.5+0.4);',
      '  vec2 d=p-uMouse;',
      '  h+=0.26*exp(-dot(d,d)*2.6);',
      '  return h;',
      '}',
      'void main(){',
      '  vec2 p=(gl_FragCoord.xy-0.5*uRes)/uRes.y*2.3;',
      '  float t=uTime*0.16;',
      '  float e=0.01;',
      '  float h=hgt(p,t);',
      '  float hx=hgt(p+vec2(e,0.),t)-h;',
      '  float hy=hgt(p+vec2(0.,e),t)-h;',
      '  vec3 n=normalize(vec3(-hx/e,-hy/e,2.4));',
      '  vec3 L=normalize(vec3(-0.55,0.65,0.85));',
      '  float diff=dot(n,L)*0.5+0.5;',
      '  vec3 H=normalize(L+vec3(0.,0.,1.));',
      '  float spec=pow(max(dot(n,H),0.),48.);',
      '  float rim=pow(1.-n.z,1.6);',
      '  vec3 cShadow=vec3(0.76,0.58,0.55);',
      '  vec3 cMid=vec3(0.87,0.745,0.69);',
      '  vec3 cLight=vec3(0.965,0.925,0.905);',
      '  vec3 cChamp=vec3(0.925,0.86,0.75);',
      '  vec3 col=mix(cShadow,cMid,smoothstep(0.18,0.6,diff));',
      '  col=mix(col,cLight,smoothstep(0.55,0.97,diff));',
      '  col=mix(col,cChamp,clamp(rim*0.9,0.,0.55));',
      '  col+=vec3(1.,0.97,0.93)*spec*0.38;',
      '  vec2 dm=p-uMouse;',
      '  col+=vec3(1.,0.95,0.9)*0.07*exp(-dot(dm,dm)*0.7);',
      '  float g=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453);',
      '  col+=(g-0.5)*0.012;',
      '  gl_FragColor=vec4(col,1.);',
      '}'
    ].join('\n');

    function sh(type, src) {
      var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { return null; }
      return s;
    }
    var v = sh(gl.VERTEX_SHADER, vs), f = sh(gl.FRAGMENT_SHADER, fs);
    if (!v || !f) return;
    var prog = gl.createProgram(); gl.attachShader(prog, v); gl.attachShader(prog, f); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var uRes = gl.getUniformLocation(prog, 'uRes'), uTime = gl.getUniformLocation(prog, 'uTime'), uMouse = gl.getUniformLocation(prog, 'uMouse');

    var RES_SCALE = 0.62; // Seide ist weich – reduzierte Auflösung spart Leistung
    var w = 0, h = 0, cssW = 0, cssH = 0;
    var mouse = { x: 0.9, y: 0.15, tx: 0.9, ty: 0.15 };
    var t0 = performance.now(), tFrozen = 21.0;
    var running = false, inView = true, raf = 0;

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      cssW = canvas.clientWidth; cssH = canvas.clientHeight;
      w = Math.max(2, Math.round(cssW * dpr * RES_SCALE)); h = Math.max(2, Math.round(cssH * dpr * RES_SCALE));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      gl.viewport(0, 0, w, h);
      if (!MOTION) draw(tFrozen);
    }
    function draw(time) {
      gl.uniform2f(uRes, w, h);
      gl.uniform1f(uTime, time);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    function frame(now) {
      raf = 0;
      if (!running) return;
      mouse.x = lerp(mouse.x, mouse.tx, 0.045);
      mouse.y = lerp(mouse.y, mouse.ty, 0.045);
      draw(tFrozen + (now - t0) / 1000);
      raf = requestAnimationFrame(frame);
    }
    function update() {
      var should = MOTION && inView && !document.hidden;
      if (should && !running) { running = true; if (!raf) raf = requestAnimationFrame(frame); }
      else if (!should) { running = false; if (raf) { cancelAnimationFrame(raf); raf = 0; } }
    }
    if (MOTION && finePointer) {
      window.addEventListener('pointermove', function (e) {
        if (!inView || !cssH) return;
        var r = canvas.getBoundingClientRect();
        var x = e.clientX - r.left, y = e.clientY - r.top;
        mouse.tx = (x - cssW / 2) / cssH * 2.3;
        mouse.ty = -(y - cssH / 2) / cssH * 2.3;
      }, { passive: true });
    }
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
    else window.addEventListener('resize', resize);
    resize();
    draw(tFrozen);
    requestAnimationFrame(function () { canvas.classList.add('is-ready'); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { inView = en[0].isIntersecting; update(); }, { rootMargin: '80px 0px' }).observe(canvas);
    }
    document.addEventListener('visibilitychange', update);
    update();
  }

  /* ------------------------------------------------------------------
     Reveals, Zähler, Wörter, Parallaxe
     ------------------------------------------------------------------ */
  function initReveals() {
    var els = $$('[data-reveal]');
    if (motionOff || !('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add('is-in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      var batch = entries.filter(function (e) { return e.isIntersecting; }).map(function (e) { return e.target; });
      batch.sort(function (a, b) { return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1; });
      batch.forEach(function (el, i) {
        el.style.transitionDelay = Math.min(i, 6) * 70 + 'ms';
        el.classList.add('is-in');
        io.unobserve(el);
        setTimeout(function () { el.style.transitionDelay = ''; }, 1200 + i * 70);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });
  }

  function initCounters() {
    var els = $$('[data-count]');
    if (!MOTION || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        var el = en.target, to = parseFloat(el.dataset.count), dec = +(el.dataset.decimals || 0);
        var t0 = performance.now(), dur = 1500;
        (function tick(now) {
          var p = clamp((now - t0) / dur, 0, 1);
          var v = to * (1 - Math.pow(1 - p, 4));
          el.textContent = v.toLocaleString('de-DE', { minimumFractionDigits: dec, maximumFractionDigits: dec });
          if (p < 1) requestAnimationFrame(tick);
        })(t0);
      });
    }, { threshold: 0.6 });
    els.forEach(function (el) {
      el.textContent = (0).toLocaleString('de-DE', { minimumFractionDigits: +(el.dataset.decimals || 0) });
      io.observe(el);
    });
  }

  function initWords() {
    var p = $('[data-words]');
    if (!p || !MOTION || !hasGSAP) return;
    var text = p.textContent.replace(/\s+/g, ' ').trim();
    p.textContent = '';
    var words = text.split(' ');
    var spans = [];
    words.forEach(function (w, i) {
      var s = document.createElement('span');
      s.className = 'w';
      s.textContent = w;
      p.appendChild(s);
      if (i < words.length - 1) p.appendChild(document.createTextNode(' '));
      spans.push(s);
    });
    gsap.fromTo(spans, { opacity: 0.16 }, {
      opacity: 1, ease: 'none', stagger: 0.06,
      scrollTrigger: { trigger: p, start: 'top 82%', end: 'bottom 48%', scrub: 0.4 }
    });
  }

  function initParallax() {
    if (!MOTION || !hasGSAP) return;
    $$('[data-parallax]').forEach(function (fig) {
      var img = $('img', fig);
      var amt = fig.dataset.parallax === 'slow' ? 4 : 7;
      gsap.fromTo(img, { yPercent: -amt }, { yPercent: amt, ease: 'none', scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: true } });
      gsap.fromTo(fig, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'power3.inOut', scrollTrigger: { trigger: fig, start: 'top 88%', once: true } });
    });
    // Akt-Bilder: weiches Aufdecken
    $$('.act-img').forEach(function (fig) {
      gsap.fromTo(fig, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'power3.inOut', scrollTrigger: { trigger: fig, start: 'top 90%', once: true } });
    });
  }

  /* ------------------------------------------------------------------
     II · Behandlungsmenü mit Filtern (FLIP-Übergänge)
     ------------------------------------------------------------------ */
  var carte = { reset: null };
  function initCarte() {
    var form = $('#filters'), grid = $('#menu-grid');
    if (!form || !grid) return;
    var items = $$('.treat', grid);
    var range = $('#f-price'), out = $('#f-price-out');
    var countOut = $('[data-count-out]'), countWord = $('[data-count-word]');
    var empty = $('#menu-empty');
    var token = 0, rangeTimer = 0;

    function state() {
      return {
        cat: (form.querySelector('input[name="cat"]:checked') || {}).value || 'alle',
        dur: (form.querySelector('input[name="dur"]:checked') || {}).value || 'alle',
        price: +range.value
      };
    }
    function matches(li, st) {
      if (st.cat !== 'alle' && li.dataset.cat !== st.cat) return false;
      if (st.dur !== 'alle') { var d = DURATION[st.dur], m = +li.dataset.min; if (m < d[0] || m > d[1]) return false; }
      return +li.dataset.price <= st.price;
    }
    function paintRange() {
      var v = +range.value, min = +range.min, max = +range.max;
      range.style.setProperty('--fill', ((v - min) / (max - min) * 100) + '%');
      out.textContent = v + ' €';
      range.setAttribute('aria-valuetext', 'bis ' + v + ' Euro');
    }
    function after(st) {
      var n = items.filter(function (li) { return !li.hidden; }).length;
      countOut.textContent = n;
      countWord.textContent = n === 1 ? 'Behandlung' : 'Behandlungen';
      empty.hidden = n !== 0;
      scheduleRefresh(700);
    }
    function apply() {
      var st = state();
      var my = ++token;
      items.forEach(function (li) { if (li.getAnimations) li.getAnimations().forEach(function (a) { a.cancel(); }); });
      if (!UI_MOTION || !items[0].animate) {
        items.forEach(function (li) { li.hidden = !matches(li, st); });
        after(st); return;
      }
      var leaving = items.filter(function (li) { return !li.hidden && !matches(li, st); });
      var layout = function () {
        if (my !== token) return;
        leaving.forEach(function (li) { li.getAnimations().forEach(function (a) { a.cancel(); }); });
        var first = new Map();
        items.forEach(function (li) { if (!li.hidden) first.set(li, li.getBoundingClientRect()); });
        items.forEach(function (li) { li.hidden = !matches(li, st); });
        var k = 0;
        items.forEach(function (li) {
          if (li.hidden) return;
          var last = li.getBoundingClientRect(), f = first.get(li);
          if (f) {
            var dx = f.left - last.left, dy = f.top - last.top;
            if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
              li.animate(reduced ? [{ opacity: 0.4 }, { opacity: 1 }] : [{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'translate(0,0)' }],
                { duration: reduced ? 260 : 620, easing: EASE_IN_OUT });
            }
          } else {
            li.animate(reduced ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 0, transform: 'translateY(18px) scale(.97)' }, { opacity: 1, transform: 'none' }],
              { duration: 520, delay: 80 + Math.min(k++, 8) * 45, easing: EASE_OUT, fill: 'backwards' });
          }
        });
        after(st);
      };
      if (leaving.length) {
        leaving.forEach(function (li) {
          li.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: reduced ? 'none' : 'scale(.96)' }], { duration: 170, easing: EASE_OUT, fill: 'forwards' });
        });
        setTimeout(layout, 170);
      } else layout();
    }
    form.addEventListener('change', function (e) { if (e.target !== range) apply(); });
    range.addEventListener('input', function () {
      paintRange();
      clearTimeout(rangeTimer);
      rangeTimer = setTimeout(apply, 110);
    });
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    form.addEventListener('reset', function () { setTimeout(function () { paintRange(); apply(); }, 0); });
    var resetBtn = $('[data-filter-reset]');
    if (resetBtn) resetBtn.addEventListener('click', function () { form.reset(); });
    carte.reset = function () { form.reset(); paintRange(); items.forEach(function (li) { li.hidden = false; }); after(); };
    paintRange();

    // Lichtkegel, der dem Mauszeiger auf der Karte folgt
    if (finePointer) {
      grid.addEventListener('pointermove', function (e) {
        var card = e.target.closest && e.target.closest('.treat-card');
        if (!card) return;
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      }, { passive: true });
    }
  }

  /** Zu einer Behandlungskarte springen und sie kurz hervorheben. */
  function gotoTreatment(id) {
    var t = TREATS[id];
    if (!t) return;
    if (t.el.hidden && carte.reset) carte.reset();
    var card = $('.treat-card', t.el);
    scrollToEl(t.el, { offset: -(headerH() + 40), focusEl: $('.treat-book', t.el) });
    t.el.classList.remove('is-highlight');
    setTimeout(function () { void t.el.offsetWidth; t.el.classList.add('is-highlight'); }, lenis ? 900 : 300);
    setTimeout(function () { t.el.classList.remove('is-highlight'); }, 3200);
    return card;
  }
  function initGoto() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('[data-goto]');
      if (!a) return;
      e.preventDefault();
      e.stopPropagation();
      gotoTreatment(a.dataset.goto);
    }, true);
  }

  /* ------------------------------------------------------------------
     „Vormerken“ → Terminformular
     ------------------------------------------------------------------ */
  function initBookLinks() {
    var select = $('#b-treat');
    var section = $('#termin');
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('[data-book]');
      if (!a || !select) return;
      e.preventDefault();
      e.stopPropagation();
      var id = a.dataset.book;
      if (booking.showForm) booking.showForm();
      if ($('option[value="' + id + '"]', select)) {
        select.value = id;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
      var t = TREATS[id];
      if (t) toast('„' + t.name.replace(/[„“]/g, '') + '“ ist im Terminformular vorgemerkt.');
      scrollToEl(section, { focusEl: select });
    }, true);
  }

  /* ------------------------------------------------------------------
     III · Hautcheck (5 Fragen → Empfehlung)
     ------------------------------------------------------------------ */
  function initQuiz() {
    var form = $('#quiz'), result = $('#quiz-result');
    if (!form || !result) return;
    var qs = $$('.q', form);
    var stepOut = $('[data-quiz-step]', form), bar = $('[data-quiz-bar]', form);
    var back = $('[data-quiz-back]', form), next = $('[data-quiz-next]', form), hint = $('[data-quiz-hint]', form);
    var orb = $('[data-orb]');
    var cur = 0, lastPointer = 0, advanceTimer = 0;

    function answer(i) { var c = qs[i].querySelector('input:checked'); return c ? c : null; }
    function show(i, dir, focus) {
      cur = i;
      qs.forEach(function (q, k) {
        q.classList.remove('is-enter', 'is-enter-back');
        q.classList.toggle('is-active', k === i);
      });
      if (UI_MOTION && dir) { void qs[i].offsetWidth; qs[i].classList.add(dir > 0 ? 'is-enter' : 'is-enter-back'); }
      stepOut.textContent = i + 1;
      bar.style.transform = 'scaleX(' + ((i + 1) / qs.length) + ')';
      back.disabled = i === 0;
      $('span', next).textContent = i === qs.length - 1 ? 'Auswerten' : 'Weiter';
      hint.textContent = '';
      if (focus) $('legend', qs[i]).focus({ preventScroll: true });
    }
    function goNext(focus) {
      clearTimeout(advanceTimer);
      if (!answer(cur)) { hint.textContent = 'Bitte wählen Sie eine Antwort.'; return; }
      if (cur < qs.length - 1) show(cur + 1, 1, focus);
      else showResult();
    }
    form.addEventListener('pointerdown', function (e) { if (e.target.closest('.opt')) lastPointer = performance.now(); });
    form.addEventListener('change', function (e) {
      var input = e.target;
      if (input.type !== 'radio') return;
      var qi = qs.indexOf(input.closest('.q'));
      var trail = $('[data-trail-val="' + (qi + 1) + '"]');
      if (trail) trail.textContent = input.dataset.short || '';
      if (orb && input.dataset.tone) orb.style.setProperty('--tone', input.dataset.tone);
      hint.textContent = '';
      if (performance.now() - lastPointer < 900 && qi === cur) {
        clearTimeout(advanceTimer);
        advanceTimer = setTimeout(function () { goNext(false); }, UI_MOTION ? 380 : 0);
      }
    });
    next.addEventListener('click', function () { goNext(true); });
    back.addEventListener('click', function () { clearTimeout(advanceTimer); if (cur > 0) show(cur - 1, -1, true); });
    form.addEventListener('submit', function (e) { e.preventDefault(); goNext(true); });

    function showResult() {
      var a = {};
      qs.forEach(function (q, i) { var c = answer(i); a['q' + (i + 1)] = c ? c.value : ''; });
      var r = evaluateQuiz(a);
      var t = TREATS[r.treatment];
      $('[data-r-type]', result).textContent = r.typeLabel;
      $('[data-r-name]', result).textContent = t.name;
      $('[data-r-meta]', result).textContent = t.min + ' Min. · ' + t.price + ' €';
      var list = $('[data-r-reasons]', result);
      list.textContent = '';
      r.reasons.forEach(function (txt) { var li = document.createElement('li'); li.textContent = txt; list.appendChild(li); });
      var act = $('[data-r-active]', result);
      act.textContent = QUIZ.activeName[r.active];
      act.dataset.active = r.active;
      $('[data-r-home]', result).textContent = r.home;
      $('[data-r-book]', result).dataset.book = r.treatment;
      $('[data-result-live]', result).textContent = 'Ergebnis: ' + r.typeLabel + '. Empfehlung: ' + t.name + '.';
      form.hidden = true;
      result.hidden = false;
      $('[data-r-type]', result).focus({ preventScroll: true });
      var card = $('.quiz-card');
      var rect = card.getBoundingClientRect();
      if (rect.top < 0 || rect.top > window.innerHeight * 0.5) scrollToEl(card, { offset: -(headerH() + 24) });
      scheduleRefresh(300);
    }
    $('[data-r-active]', result).addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      var key = this.dataset.active;
      if (actives.select) actives.select(key);
      scrollToEl($('#wirkstoffe'), { focusEl: $('#tab-' + key) });
    });
    $('[data-quiz-restart]', result).addEventListener('click', function () {
      form.reset();
      $$('[data-trail-val]').forEach(function (b) { b.textContent = '–'; });
      if (orb) orb.style.removeProperty('--tone');
      result.hidden = true;
      form.hidden = false;
      show(0, -1, true);
      scheduleRefresh(300);
    });
    show(0, 0, false);
  }

  /** Auswertung des Hautchecks – Regeln oben in QUIZ, Ausnahmen hier dokumentiert. */
  function evaluateQuiz(a) {
    var type = a.q1 || 'normal', sens = a.q2 || '0', concern = a.q3 || 'hydra', time = a.q4 || 'mittel', care = a.q5 || 'nein';
    var caution = care !== 'nein';
    var treatment = QUIZ.treatment[concern], active = QUIZ.active[concern];
    var extra = [];
    // Ausnahme 1: Schwangerschaft/Stillzeit oder ärztliche Präparate → kein Retinol, kein Microneedling.
    if (concern === 'age' && caution) { treatment = 'hydra'; active = 'hya'; }
    // Ausnahme 2: sehr reaktive Haut → erst Barriere stärken, dann stärkere Wirkstoffe.
    else if (sens === '2' && (concern === 'age' || concern === 'glow' || concern === 'clear')) {
      treatment = 'calm'; active = 'nia';
      if (concern === 'age') extra.push('Retinol kommt später dazu – sobald Ihre Hautbarriere stabil ist.');
      if (concern === 'glow') extra.push('Vitamin C führen wir danach in milder Form ein, wenn Ihre Haut ruhiger ist.');
      if (concern === 'clear') extra.push('Ausreinigung machen wir bei Ihrer Haut nur sehr behutsam und erst im zweiten Termin.');
    }
    var reasons = [QUIZ.typeReason[type], QUIZ.sensReason[sens], QUIZ.treatReason[treatment]].concat(extra);
    if (care === 'schwanger') reasons.push('In Schwangerschaft und Stillzeit verzichten wir auf Retinol und Microneedling – bitte erwähnen Sie es bei der Buchung.');
    if (care === 'medikament') reasons.push('Weil Sie ärztlich verordnete Präparate nutzen, stimmen wir die Wirkstoffe vorab mit Ihnen ab – bringen Sie die Namen gern mit.');
    return {
      typeLabel: QUIZ.typeLabel[type] + QUIZ.sensLabel[sens],
      treatment: treatment, active: active, reasons: reasons, home: QUIZ.home[time]
    };
  }

  /* ------------------------------------------------------------------
     IV · Wirkstoff-Explorer (Tabs mit Kreisen)
     ------------------------------------------------------------------ */
  var actives = { select: null };
  function initActives() {
    var orbit = $('[data-orbit]');
    if (!orbit) return;
    var tabs = $$('[role="tab"]', orbit);
    var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });
    var lines = $$('.orbit-lines line', orbit);
    var current = null;

    function select(key, focus) {
      tabs.forEach(function (t, i) {
        var on = t.dataset.key === key;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        panels[i].classList.toggle('is-active', on);
        panels[i].classList.remove('is-enter');
        if (on && current !== null && current !== key && UI_MOTION) { void panels[i].offsetWidth; panels[i].classList.add('is-enter'); }
        if (on && focus) t.focus();
      });
      lines.forEach(function (l) { l.classList.toggle('is-on', l.dataset.link.split(' ').indexOf(key) > -1); });
      current = key;
    }
    actives.select = select;
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t.dataset.key); });
      t.addEventListener('keydown', function (e) {
        var idx = i;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') idx = (i + 1) % tabs.length;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') idx = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') idx = 0;
        else if (e.key === 'End') idx = tabs.length - 1;
        else return;
        e.preventDefault();
        select(tabs[idx].dataset.key, true);
      });
    });
    select('hya');

    // Magnetische Kreise (Feder/Lerp, nur Maus)
    if (!MOTION || !finePointer) return;
    var inners = tabs.map(function (t) { return { el: $('.drop-inner', t), btn: t, x: 0, y: 0, tx: 0, ty: 0 }; });
    var raf = 0;
    function tick() {
      raf = 0;
      var moving = false;
      inners.forEach(function (d) {
        d.x = lerp(d.x, d.tx, 0.12); d.y = lerp(d.y, d.ty, 0.12);
        if (Math.abs(d.x - d.tx) > 0.05 || Math.abs(d.y - d.ty) > 0.05) moving = true;
        d.el.style.transform = 'translate(' + d.x.toFixed(2) + 'px,' + d.y.toFixed(2) + 'px)';
      });
      if (moving) raf = requestAnimationFrame(tick);
    }
    orbit.addEventListener('pointermove', function (e) {
      inners.forEach(function (d) {
        var r = d.btn.getBoundingClientRect();
        var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        var dx = e.clientX - cx, dy = e.clientY - cy;
        var dist = Math.sqrt(dx * dx + dy * dy), reach = r.width * 0.95;
        var f = dist < reach ? (1 - dist / reach) : 0;
        d.tx = clamp(dx * 0.22 * f, -16, 16); d.ty = clamp(dy * 0.22 * f, -16, 16);
      });
      if (!raf) raf = requestAnimationFrame(tick);
    }, { passive: true });
    orbit.addEventListener('pointerleave', function () {
      inners.forEach(function (d) { d.tx = 0; d.ty = 0; });
      if (!raf) raf = requestAnimationFrame(tick);
    });
  }

  /* ------------------------------------------------------------------
     V · Ritual – gepinnte Querstrecke (Desktop)
     ------------------------------------------------------------------ */
  function initRitual() {
    var section = $('#ablauf');
    if (!section || !hasGSAP || !MOTION) return;
    var pin = $('[data-ritual-pin]', section), track = $('[data-ritual-track]', section);
    var num = $('[data-rp-num]', section), bar = $('[data-rp-bar]', section);
    var ROMAN = ['I', 'II', 'III', 'IV'];
    var mm = gsap.matchMedia();
    mm.add('(min-width: 900px) and (min-height: 560px)', function () {
      section.classList.add('is-pinned');
      var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
      var tween = gsap.to(track, {
        x: function () { return -dist(); },
        ease: 'none',
        scrollTrigger: {
          trigger: pin, start: 'top top', end: function () { return '+=' + dist(); },
          pin: true, scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1,
          onUpdate: function (self) {
            bar.style.transform = 'scaleX(' + self.progress.toFixed(4) + ')';
            num.textContent = ROMAN[Math.min(3, Math.floor(self.progress * 3.999))];
          }
        }
      });
      // leichte Bildbewegung innerhalb der Strecke
      $$('.act-img img', track).forEach(function (img) {
        gsap.fromTo(img, { xPercent: -5, scale: 1.12 }, { xPercent: 5, scale: 1.12, ease: 'none', scrollTrigger: { trigger: img.parentNode, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
      });
      return function () {
        section.classList.remove('is-pinned');
        gsap.set(track, { clearProps: 'transform' });
        $$('.act-img img', track).forEach(function (img) { gsap.set(img, { clearProps: 'transform' }); });
      };
    });
  }

  /* ------------------------------------------------------------------
     VI · Gutschein-Konfigurator mit Live-Karte
     ------------------------------------------------------------------ */
  function initGift() {
    var form = $('#gift-form');
    if (!form) return;
    var card = $('[data-gift-card]'), stage = $('[data-gift-stage]'), tilt = $('[data-gift-tilt]');
    var vOut = $('[data-gc-value]'), mOut = $('[data-gc-msg]'), toOut = $('[data-gc-to]'), fromOut = $('[data-gc-from]');
    var codeOut = $('[data-gc-code]'), validOut = $('[data-gc-valid]');
    var total = $('#g-total'), shipNote = $('[data-ship-note]'), count = $('[data-msg-count]');
    var custom = $('#g-custom'), customWrap = $('[data-custom-wrap]'), customErr = $('#g-custom-err');
    var mail = $('#g-mail'), mailErr = $('#g-mail-err');
    var treatSel = $('#g-treat'), msg = $('#g-msg'), to = $('#g-to'), from = $('#g-from');
    var success = $('#gift-success'), grid = $('.gift-grid'), summary = $('[data-gift-summary]');
    var flipBtn = $('[data-gift-flip]'), flipLabel = $('[data-flip-label]');
    var faces = $$('.gc-face', card);
    var lastColor = 'puder', submitted = false;

    var year = new Date().getFullYear();
    validOut.textContent = '31.12.' + (year + GIFT.VALID_YEARS);
    function newCode() {
      var chars = 'ACDEFGHJKLMNPQRTUVWXYZ2346789', s = '';
      for (var i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)];
      codeOut.textContent = 'MB-' + String(year).slice(2) + '-' + s;
    }
    newCode();

    function val(name) { var c = form.querySelector('input[name="' + name + '"]:checked'); return c ? c.value : ''; }
    function customValue() {
      var raw = custom.value.trim();
      if (!raw) return null;
      var n = Number(raw.replace(',', '.'));
      return isFinite(n) ? n : NaN;
    }
    function customValid(n) { return n != null && !isNaN(n) && n >= GIFT.MIN && n <= GIFT.MAX && n % GIFT.STEP === 0; }
    function amount() {
      if (val('gtype') === 'behandlung') { var o = treatSel.selectedOptions[0]; return +o.dataset.price; }
      var a = val('gamount');
      if (a === 'eigen') { var n = customValue(); return customValid(n) ? n : null; }
      return +a;
    }
    function treatName() { var o = treatSel.selectedOptions[0]; return o.textContent.split(' · ')[0]; }

    function update() {
      var type = val('gtype');
      $$('[data-gblock]', form).forEach(function (b) { b.hidden = b.dataset.gblock !== type; });
      var isCustom = val('gamount') === 'eigen';
      customWrap.classList.toggle('is-open', isCustom);
      if (type === 'behandlung') {
        vOut.textContent = treatName();
        vOut.classList.add('is-treatment');
      } else {
        var a = amount();
        vOut.textContent = a != null ? fmtEuroShort(a) : '— €';
        vOut.classList.remove('is-treatment');
      }
      var m = msg.value.trim();
      mOut.textContent = '„' + (m || msg.getAttribute('placeholder')) + '“';
      toOut.textContent = to.value.trim() || 'Name der Beschenkten';
      toOut.classList.toggle('is-placeholder', !to.value.trim());
      fromOut.textContent = from.value.trim() || 'Ihr Name';
      fromOut.classList.toggle('is-placeholder', !from.value.trim());
      count.textContent = msg.value.length + '/' + msg.maxLength;
      var color = val('gcolor') || 'puder';
      if (color !== lastColor) {
        card.dataset.color = color;
        if (UI_MOTION && faces[0].animate) faces.forEach(function (f) { f.animate([{ filter: 'blur(3px)', opacity: 0.75 }, { filter: 'blur(0px)', opacity: 1 }], { duration: 320, easing: EASE_OUT }); });
        lastColor = color;
      }
      var ship = val('gship') || 'mail';
      var sum = amount();
      total.textContent = sum != null ? fmtEuro(sum + (GIFT.SHIPPING[ship] || 0)) : '–';
      shipNote.textContent = GIFT.SHIP_NOTE[ship];
      if (submitted) validate(false);
    }
    function setErr(input, el, text) {
      el.textContent = text;
      if (text) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
    }
    function validate(focus) {
      var firstBad = null;
      if (val('gtype') === 'wert' && val('gamount') === 'eigen') {
        var n = customValue();
        if (!customValid(n)) { setErr(custom, customErr, 'Bitte einen Betrag zwischen ' + GIFT.MIN + ' und ' + GIFT.MAX + ' € in ' + GIFT.STEP + '-€-Schritten eingeben.'); firstBad = firstBad || custom; }
        else setErr(custom, customErr, '');
      } else setErr(custom, customErr, '');
      var em = mail.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) { setErr(mail, mailErr, em ? 'Bitte prüfen Sie die E-Mail-Adresse.' : 'Bitte geben Sie Ihre E-Mail-Adresse an.'); firstBad = firstBad || mail; }
      else setErr(mail, mailErr, '');
      if (firstBad && focus) firstBad.focus();
      return !firstBad;
    }
    form.addEventListener('input', update);
    form.addEventListener('change', function (e) {
      update();
      if (e.target.name === 'gamount' && e.target.value === 'eigen') custom.focus();
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      submitted = true;
      if (!validate(true)) return;
      var rows = [
        ['Gutschein', val('gtype') === 'behandlung' ? treatName() : 'Wertgutschein über ' + fmtEuroShort(amount())],
        ['Für', to.value.trim() || '–'],
        ['Von', from.value.trim() || '–'],
        ['Nachricht', msg.value.trim() || msg.getAttribute('placeholder')],
        ['Kartenfarbe', ({ puder: 'Puder', pflaume: 'Pflaume', champagner: 'Champagner', nude: 'Nude' })[val('gcolor')]],
        ['Zustellung', ({ mail: 'PDF per E-Mail', post: 'Karte per Post', abholen: 'Im Studio abholen' })[val('gship')]],
        ['Bestätigung an', mail.value.trim()],
        ['Summe', total.textContent],
        ['Code', codeOut.textContent]
      ];
      fillSummary(summary, rows);
      grid.hidden = true;
      success.hidden = false;
      $('[data-gift-success-title]', success).focus({ preventScroll: true });
      scrollToEl(success, { offset: -(headerH() + 30) });
      scheduleRefresh(300);
    });
    $('[data-gift-again]').addEventListener('click', function () {
      success.hidden = true; grid.hidden = false; newCode();
      scheduleRefresh(300);
      $('input[name="gtype"]:checked', form).focus();
    });

    // Karte drehen
    flipBtn.addEventListener('click', function () {
      var on = !card.classList.contains('is-flipped');
      card.classList.toggle('is-flipped', on);
      flipBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
      flipLabel.textContent = on ? 'Vorderseite ansehen' : 'Rückseite ansehen';
      $('.gc-back', card).setAttribute('aria-hidden', on ? 'false' : 'true');
      $('.gc-front', card).setAttribute('aria-hidden', on ? 'true' : 'false');
    });

    // 3D-Kippen per Maus (Feder/Lerp)
    if (MOTION && finePointer) {
      var glare = $('[data-gc-glare]', card);
      var s = { rx: 0, ry: 0, trx: 0, try_: 0, gx: 0, gy: 0, tgx: 0, tgy: 0 }, raf = 0;
      var tick = function () {
        raf = 0;
        s.rx = lerp(s.rx, s.trx, 0.1); s.ry = lerp(s.ry, s.try_, 0.1);
        s.gx = lerp(s.gx, s.tgx, 0.1); s.gy = lerp(s.gy, s.tgy, 0.1);
        tilt.style.transform = 'rotateX(' + s.rx.toFixed(2) + 'deg) rotateY(' + s.ry.toFixed(2) + 'deg)';
        glare.style.transform = 'translate(' + s.gx.toFixed(1) + '%,' + s.gy.toFixed(1) + '%)';
        if (Math.abs(s.rx - s.trx) > 0.02 || Math.abs(s.ry - s.try_) > 0.02) raf = requestAnimationFrame(tick);
      };
      stage.addEventListener('pointermove', function (e) {
        var r = stage.getBoundingClientRect();
        var x = clamp((e.clientX - r.left) / r.width, 0, 1), y = clamp((e.clientY - r.top) / r.height, 0, 1);
        s.trx = (0.5 - y) * 16; s.try_ = (x - 0.5) * 20;
        s.tgx = (x - 0.5) * 50; s.tgy = (y - 0.5) * 50;
        stage.classList.add('is-tilting');
        if (!raf) raf = requestAnimationFrame(tick);
      }, { passive: true });
      stage.addEventListener('pointerleave', function () {
        s.trx = 0; s.try_ = 0; s.tgx = 0; s.tgy = 0;
        stage.classList.remove('is-tilting');
        if (!raf) raf = requestAnimationFrame(tick);
      });
    }
    update();
  }

  function fillSummary(dl, rows) {
    dl.textContent = '';
    rows.forEach(function (r) {
      var d = document.createElement('div');
      var dt = document.createElement('dt'); dt.textContent = r[0];
      var dd = document.createElement('dd'); dd.textContent = r[1];
      d.appendChild(dt); d.appendChild(dd); dl.appendChild(d);
    });
  }

  /* ------------------------------------------------------------------
     VIII · Kundenstimmen (Karussell)
     ------------------------------------------------------------------ */
  function initCarousel() {
    var wrap = $('[data-carousel]');
    if (!wrap) return;
    var slides = $$('.slide', wrap), dots = $('[data-dots]', wrap), curOut = $('[data-c-cur]', wrap);
    var i = 0;
    var btns = slides.map(function (s, k) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Stimme ' + (k + 1) + ' von ' + slides.length + ' anzeigen');
      b.addEventListener('click', function () { go(k); });
      dots.appendChild(b);
      return b;
    });
    function go(k) {
      i = (k + slides.length) % slides.length;
      slides.forEach(function (s, n) { s.classList.toggle('is-active', n === i); s.setAttribute('aria-hidden', n === i ? 'false' : 'true'); });
      btns.forEach(function (b, n) { if (n === i) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
      curOut.textContent = String(i + 1).padStart(2, '0');
    }
    $('[data-prev]', wrap).addEventListener('click', function () { go(i - 1); });
    $('[data-next]', wrap).addEventListener('click', function () { go(i + 1); });
    wrap.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(i - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); go(i + 1); }
    });
    var sx = null, sy = null;
    wrap.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') { sx = e.clientX; sy = e.clientY; } });
    wrap.addEventListener('pointerup', function (e) {
      if (sx === null) return;
      var dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) go(i + (dx < 0 ? 1 : -1));
      sx = sy = null;
    });
    wrap.addEventListener('pointercancel', function () { sx = sy = null; });
    go(0);
  }

  /* ------------------------------------------------------------------
     IX · Öffnungsstatus + Karte
     ------------------------------------------------------------------ */
  var DAY_NAMES = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  var DAY_SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  function berlinNow() {
    var parts = {};
    try {
      new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false, weekday: 'short' })
        .formatToParts(new Date()).forEach(function (p) { parts[p.type] = p.value; });
    } catch (e) {
      var d = new Date();
      return { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate(), wd: d.getDay(), h: d.getHours(), min: d.getMinutes() };
    }
    var wdMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return { y: +parts.year, m: +parts.month, d: +parts.day, wd: wdMap[parts.weekday], h: +parts.hour % 24, min: +parts.minute };
  }
  function initHours() {
    var now = berlinNow();
    var row = $('.hours tr[data-day="' + now.wd + '"]');
    if (row) row.classList.add('is-today');
    var box = $('[data-open-status]'), txt = $('[data-open-text]');
    if (!box) return;
    var today = HOURS[now.wd], hm = now.h + now.min / 60;
    if (today && hm >= today[0] && hm < today[1]) {
      box.classList.add('is-open');
      txt.textContent = 'Jetzt geöffnet · heute bis ' + today[1] + ' Uhr';
    } else {
      var label;
      if (today && hm < today[0]) label = 'öffnet heute um ' + today[0] + ' Uhr';
      else {
        for (var k = 1; k <= 7; k++) {
          var wd = (now.wd + k) % 7;
          if (HOURS[wd]) { label = 'öffnet ' + (k === 1 ? 'morgen' : DAY_NAMES[wd]) + ' um ' + HOURS[wd][0] + ' Uhr'; break; }
        }
      }
      txt.textContent = 'Gerade geschlossen · ' + label;
    }
  }
  function initMap() {
    var svg = $('.map-svg');
    if (!svg) return;
    $$('[data-map-target]').forEach(function (li) {
      var key = li.dataset.mapTarget;
      li.tabIndex = 0;
      var on = function () { svg.classList.add('hl-' + key); li.classList.add('is-hl'); };
      var off = function () { svg.classList.remove('hl-' + key); li.classList.remove('is-hl'); };
      li.addEventListener('pointerenter', on); li.addEventListener('pointerleave', off);
      li.addEventListener('focus', on); li.addEventListener('blur', off);
    });
    var route = $('[data-route]', svg);
    if (route && MOTION && 'IntersectionObserver' in window && route.animate) {
      var len = route.getTotalLength();
      route.style.strokeDasharray = '1 7';
      var io = new IntersectionObserver(function (en) {
        if (!en[0].isIntersecting) return;
        io.disconnect();
        route.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: 2200, easing: EASE_IN_OUT });
      }, { threshold: 0.5 });
      io.observe(svg);
    }
  }

  /* ------------------------------------------------------------------
     X · FAQ (sanftes Öffnen)
     ------------------------------------------------------------------ */
  function initFaq() {
    $$('.faq-item').forEach(function (d) {
      var sum = $('summary', d), body = $('.faq-body', d);
      sum.addEventListener('click', function (e) {
        if (!UI_MOTION || !body.animate) { scheduleRefresh(200); return; }
        e.preventDefault();
        if (d.dataset.anim) return;
        if (!d.open) {
          d.open = true;
          var h = body.scrollHeight;
          d.dataset.anim = '1';
          var a = body.animate([{ height: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }], { duration: reduced ? 200 : 320, easing: EASE_OUT });
          a.onfinish = a.oncancel = function () { delete d.dataset.anim; scheduleRefresh(200); };
        } else {
          var h2 = body.scrollHeight;
          d.dataset.anim = '1';
          var b = body.animate([{ height: h2 + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 200, easing: EASE_OUT });
          b.onfinish = function () { d.open = false; delete d.dataset.anim; scheduleRefresh(200); };
          b.oncancel = function () { delete d.dataset.anim; };
        }
      });
    });
  }

  /* ------------------------------------------------------------------
     XI · Terminanfrage
     ------------------------------------------------------------------ */
  var booking = { showForm: null };
  function initBooking() {
    var form = $('#booking-form'), success = $('#booking-success');
    if (!form) return;
    var daysWrap = $('[data-days]', form), fallback = $('#b-date');
    var summary = $('[data-booking-summary]');
    var submitted = false;
    var dateFmt = new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

    // Wunschtage: die nächsten Öffnungstage
    var now = berlinNow();
    var base = Date.UTC(now.y, now.m - 1, now.d);
    var made = 0;
    for (var k = BOOKING_LEAD_DAYS; made < BOOKING_DAYS && k < 60; k++) {
      var dt = new Date(base + k * 864e5), wd = dt.getUTCDay();
      if (!HOURS[wd]) continue;
      var iso = dt.toISOString().slice(0, 10);
      var label = document.createElement('label'); label.className = 'day';
      var input = document.createElement('input'); input.type = 'radio'; input.name = 'tag'; input.value = iso;
      input.dataset.long = dateFmt.format(dt);
      input.setAttribute('aria-label', input.dataset.long);
      var span = document.createElement('span');
      var sm = document.createElement('small'); sm.textContent = DAY_SHORT[wd];
      var b = document.createElement('b'); b.textContent = String(dt.getUTCDate()).padStart(2, '0') + '.' + String(dt.getUTCMonth() + 1).padStart(2, '0') + '.';
      span.appendChild(sm); span.appendChild(b);
      label.appendChild(input); label.appendChild(span);
      daysWrap.appendChild(label);
      made++;
    }
    fallback.disabled = true;

    var fields = {
      treat: $('#b-treat'), name: $('#b-name'), tel: $('#b-tel'), mail: $('#b-mail'), consent: $('#b-consent')
    };
    function err(id, text, input) {
      var el = $('#' + id);
      el.textContent = text;
      if (input) { if (text) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid'); }
    }
    function checked(name) { var c = form.querySelector('input[name="' + name + '"]:checked'); return c; }
    function validate(focus) {
      var bad = [];
      if (!fields.treat.value) { err('b-treat-err', 'Bitte wählen Sie eine Behandlung.', fields.treat); bad.push(fields.treat); } else err('b-treat-err', '', fields.treat);
      if (!checked('tag')) { err('b-day-err', 'Bitte wählen Sie einen Wunschtag.'); bad.push($('input[name="tag"]', form)); } else err('b-day-err', '');
      if (!checked('zeit')) { err('b-time-err', 'Bitte wählen Sie eine Tageszeit.'); bad.push($('input[name="zeit"]', form)); } else err('b-time-err', '');
      if (fields.name.value.trim().length < 2) { err('b-name-err', 'Bitte geben Sie Ihren Namen an.', fields.name); bad.push(fields.name); } else err('b-name-err', '', fields.name);
      var tel = fields.tel.value.trim(), digits = tel.replace(/\D/g, '');
      if (!/^[+()\d\s\/-]+$/.test(tel) || digits.length < 6) { err('b-tel-err', tel ? 'Bitte prüfen Sie die Telefonnummer.' : 'Bitte geben Sie eine Telefonnummer an, unter der wir Sie erreichen.', fields.tel); bad.push(fields.tel); } else err('b-tel-err', '', fields.tel);
      var em = fields.mail.value.trim();
      if (em && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) { err('b-mail-err', 'Bitte prüfen Sie die E-Mail-Adresse.', fields.mail); bad.push(fields.mail); } else err('b-mail-err', '', fields.mail);
      if (!fields.consent.checked) { err('b-consent-err', 'Bitte bestätigen Sie die Einwilligung.', fields.consent); bad.push(fields.consent); } else err('b-consent-err', '', fields.consent);
      if (bad.length && focus) bad[0].focus();
      return !bad.length;
    }
    form.addEventListener('change', function () { if (submitted) validate(false); });
    form.addEventListener('input', function () { if (submitted) validate(false); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      submitted = true;
      if (!validate(true)) return;
      var opt = fields.treat.selectedOptions[0];
      var rows = [
        ['Behandlung', opt.textContent],
        ['Wunschtag', checked('tag').dataset.long],
        ['Tageszeit', checked('zeit').value],
        ['Kosmetikerin', $('#b-who').value === 'egal' ? 'Egal – wer zuerst frei ist' : $('#b-who').value],
        ['Name', fields.name.value.trim()],
        ['Telefon', fields.tel.value.trim()]
      ];
      if (fields.mail.value.trim()) rows.push(['E-Mail', fields.mail.value.trim()]);
      if ($('#b-note').value.trim()) rows.push(['Hinweise', $('#b-note').value.trim()]);
      fillSummary(summary, rows);
      form.hidden = true;
      success.hidden = false;
      $('[data-booking-success-title]', success).focus({ preventScroll: true });
      var card = $('.booking-card');
      if (card.getBoundingClientRect().top < 0) scrollToEl(card, { offset: -(headerH() + 24) });
      scheduleRefresh(300);
    });
    booking.showForm = function () {
      if (!success.hidden) { success.hidden = true; form.hidden = false; scheduleRefresh(300); }
    };
    $('[data-booking-again]').addEventListener('click', function () {
      form.reset(); submitted = false;
      $$('.field-error', form).forEach(function (el) { el.textContent = ''; });
      $$('[aria-invalid]', form).forEach(function (el) { el.removeAttribute('aria-invalid'); });
      success.hidden = true; form.hidden = false;
      fields.treat.focus();
      scheduleRefresh(300);
    });
  }

  /* ------------------------------------------------------------------
     Start
     ------------------------------------------------------------------ */
  function safe(fn, name) { try { fn(); } catch (e) { if (window.console) console.warn('[Maison Belle] ' + name + ':', e); } }
  safe(initScroll, 'scroll');
  safe(initHeader, 'header');
  safe(initMenu, 'menu');
  safe(initIntro, 'intro');
  safe(initSilk, 'silk');
  safe(initReveals, 'reveals');
  safe(initCounters, 'counters');
  safe(initWords, 'words');
  safe(initParallax, 'parallax');
  safe(initCarte, 'carte');
  safe(initGoto, 'goto');
  safe(initBookLinks, 'book');
  safe(initQuiz, 'quiz');
  safe(initActives, 'actives');
  safe(initRitual, 'ritual');
  safe(initGift, 'gift');
  safe(initCarousel, 'carousel');
  safe(initHours, 'hours');
  safe(initMap, 'map');
  safe(initFaq, 'faq');
  safe(initBooking, 'booking');
  window.__maisonReady = true;
  if (hasGSAP) window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
