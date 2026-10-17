/* ==========================================================================
   Maison Belle – Kosmetik & Skin Studio · Modell „Seide“ (Demo, fiktiv)
   Gestaltungsidee „Seide und Licht“. Interaktionen ohne Build.
   Optional: GSAP + ScrollTrigger, Lenis (liegen unter assets/vendor/).
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
  /** Behandlungskarte: Dauer-Gruppen in Minuten. */
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
  /** Seidenbahn im Hero (WebGL): Lage der Bahn je Bildschirmform. Mittellinie y = a + b·x + c·x² + Welle,
   *  x/y in Bildschirmhöhen (Mitte = 0, y nach oben). Farben der Seide stehen im Shader (cDeep/cMid/cHi). */
  var SILK = {
    wide: { a: -0.6, b: 0.94, c: 0.18, amp: 0.035, k: 3.4, ph: 0.4, half: 0.13, twist: -0.34 },  // twist = Lage der Verdrehung (längs)
    tall: { a: -0.116, b: 0.346, c: 2.18, amp: 0.01, k: 9.0, ph: 0.2, half: 0.062, twist: -0.19 },
    QUALITY: [0.5, 0.38, 0.28], // Auflösung relativ zur Anzeige; sinkt automatisch auf langsamen Geräten
    INTRO_MS: 1150              // Aufrollen der Bahn (≤ 1,2 s, blockiert nichts)
  };
  /** Kapitel-Töne: data-tone der Abschnitte → Farbe der Kopfzeile (die Seite selbst färbt CSS). */
  var TONE_HEX = { puder: '#F4E9E4', cream: '#FAF3EE', champ: '#F2E7D6', nude: '#EDD9CE', quiz: '#FAF3EE' };

  /* ------------------------------------------------------------------
     Grundlagen
     ------------------------------------------------------------------ */
  var root = document.documentElement;
  var motionOff = root.classList.contains('motion-off');
  var reduced = root.classList.contains('reduced');
  var MOTION = !motionOff && !reduced;             // volle Choreografie
  var UI_MOTION = !motionOff;                       // kleine UI-Übergänge (bei reduced nur Fades)
  var hasGSAP = !!(window.gsap && window.ScrollTrigger);
  /** GSAP, ScrollTrigger und Lenis werden nacheinander nachgeladen – jede Datei in einem eigenen Task,
   *  damit der erste Bildschirm nicht auf einen langen Skript-Block wartet (Preload steht im <head>). */
  var VENDOR = ['gsap.min.js', 'ScrollTrigger.min.js', 'lenis.min.js'].map(function (f) { return '/arena/kosmetik-maison-belle/assets/vendor/' + f; });
  var finePointer = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
  var EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';
  var EASE_IN_OUT = 'cubic-bezier(0.77, 0, 0.175, 1)';
  var lenis = null;

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smooth(a, b, v) { var t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  var euro = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
  function fmtEuro(n) { return euro.format(n); }
  function fmtEuroShort(n) { return n.toLocaleString('de-DE') + ' €'; }
  function headerH() { var h = $('[data-header]'); return h ? h.offsetHeight : 0; }

  var refreshTimer = 0;
  function scheduleRefresh(ms) {
    if (!hasGSAP) return;
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(function () { ScrollTrigger.refresh(); }, ms || 400);
  }

  /* Behandlungsdaten aus dem DOM (eine Quelle: die Karte in index.html) */
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
      lenis = new window.Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 1, anchors: false });
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
        offset: offset, duration: 1.4,
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
     Header, Faden-Fortschritt, aktive Navigation
     ------------------------------------------------------------------ */
  var header = $('[data-header]');
  function initHeader() {
    var bar = $('.scroll-thread span');
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
     Kapitel-Töne: die ganze Seite wechselt die Farbe, Kopfzeile und
     Kolumnentitel ziehen mit (Morgen → Mittag → Abend).
     ------------------------------------------------------------------ */
  function initTones() {
    var layer = $('[data-tone-layer]');
    var rh = $('[data-running-head]'), rhNum = $('[data-rh-num]'), rhName = $('[data-rh-name]');
    var secs = $$('main [data-tone]');
    if (!layer || !secs.length || !('IntersectionObserver' in window)) return;
    root.classList.add('toned');
    var current = null, swapT = 0;
    function apply(sec) {
      if (sec === current) return;
      current = sec;
      var tone = sec.dataset.tone, dark = tone === 'pflaume';
      if (!dark) layer.dataset.tone = tone === 'quiz' ? 'cream' : tone;
      header.classList.toggle('on-dark', dark);
      header.style.setProperty('--hdr-bg', dark ? 'rgba(59, 31, 43, .97)' : (TONE_HEX[tone] || TONE_HEX.puder));
      if (rh) {
        rh.classList.toggle('on-dark', dark);
        var name = sec.dataset.chapter || '', num = sec.dataset.num || '';
        if (rhName.textContent !== name) {
          clearTimeout(swapT);
          if (UI_MOTION) {
            rh.classList.add('is-swapping');
            swapT = setTimeout(function () { rhName.textContent = name; rhNum.textContent = num; rh.classList.remove('is-swapping'); }, 260);
          } else { rhName.textContent = name; rhNum.textContent = num; }
        }
      }
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) apply(en.target); });
    }, { rootMargin: '-50% 0px -50% 0px' });
    secs.forEach(function (s) { io.observe(s); });
  }

  /* ------------------------------------------------------------------
     Menü (dialog)
     ------------------------------------------------------------------ */
  var menu, menuToggle;
  function initMenu() {
    menu = $('#menu'); menuToggle = $('.menu-toggle');
    if (!menu || !menuToggle || typeof menu.showModal !== 'function') return;
    $$('.menu-list li', menu).forEach(function (li, i) { li.style.setProperty('--i', i); });
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
    window.addEventListener('resize', function () { if (window.innerWidth > 1199 && menu.open) menu.close(); });
  }
  function closeMenu(after) {
    if (!menu || !menu.open) { if (after) after(); return; }
    if (!UI_MOTION) { menu.close(); if (after) after(); return; }
    menu.classList.add('is-closing');
    setTimeout(function () { menu.close(); if (after) after(); }, 180);
  }

  /* ------------------------------------------------------------------
     Hero: Intro (Sicherheitsnetz) + Seidenbahn-Shader
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

  var silk = { scroll: 0 };
  function initSilk() {
    var canvas = $('[data-silk]');
    if (!canvas) return;
    var gl = null;
    try { gl = canvas.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: true, preserveDrawingBuffer: false }); } catch (e) { gl = null; }
    if (!gl) { root.classList.add('silk-none'); return; }

    var vs = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
    var fs = [
      'precision mediump float;',
      'uniform vec2 uRes;uniform float uTime;uniform vec2 uMouse;uniform float uLift;uniform vec2 uLight;',
      'uniform vec4 uBand;uniform vec4 uBand2;uniform float uIntro;uniform float uScroll;uniform float uAsp;',
      // Mittellinie der Bahn und ihre Steigung
      'float cy(float x,float t){return uBand.x+uBand.y*x+uBand.z*x*x+uBand.w*sin(uBand2.y*x+uBand2.z+t*.22)+uScroll*.42;}',
      'float cd(float x,float t){return uBand.y+2.*uBand.z*x+uBand.w*uBand2.y*cos(uBand2.y*x+uBand2.z+t*.22);}',
      // Bahn-Koordinaten: x = quer (−1…1 innerhalb), y = längs, z = Nähe zur Verdrehung
      'vec3 bc(vec2 p,float t){',
      '  float c=cy(p.x,t),s=cd(p.x,t),iv=inversesqrt(1.+s*s);',
      '  float v=(p.y-c)*iv,u=(p.x+(p.y-c)*s)*iv;',
      '  float tz=1.-smoothstep(0.,.32,abs(u-uBand2.w));',
      '  float w=uBand2.x*(1.-.48*tz);',
      '  return vec3(v/w,u,tz);',
      '}',
      // Falten: schräg laufendes Plissee, das langsam wandert, dazu eine Welle, die durch die Bahn läuft
      'float fo(float d,float u,float t){',
      '  float f=6.+2.6*sin(u*1.2+.7);',          // Faltendichte ändert sich längs der Bahn (fächert auf)
      '  float h=.55*sin(d*f+u*1.6+t*.45+1.6*sin(u*1.1-t*.25));',
      '  h+=.2*sin(d*f*1.9-u*2.3-t*.6+1.);',
      '  h+=.42*sin(u*4.2-t*.85+d*2.6)*(1.-d*d);',
      '  h+=.35*d*d*d*d;',
      '  return h;',
      '}',
      'float hg(vec2 p,float t,float ex){',
      '  vec3 b=bc(p,t);',
      '  float h=fo(b.x,b.y,t)*(1.-.5*b.z)+b.z*.8*sin(b.x*3.);',
      '  vec2 dm=p-uMouse;h+=uLift*1.5*exp(-dot(dm,dm)*18.);',
      '  h+=1.6*(1.-smoothstep(0.,.14,p.x-ex));',   // aufrollende Kante beim Intro
      '  return h;',
      '}',
      'void main(){',
      '  vec2 p=(gl_FragCoord.xy-.5*uRes)/uRes.y;',
      '  float t=uTime;',
      '  float ex=mix(.5*uAsp+.2,-.5*uAsp-.35,uIntro);',
      '  vec3 b=bc(p,t);',
      '  float ad=abs(b.x);',
      '  float aa=2.4/(uRes.y*uBand2.x);',
      '  float aB=(1.-smoothstep(1.-aa,1.,ad))*smoothstep(ex-.004,ex+.004,p.x);',
      '  vec2 ps=p+vec2(-.02,.042);',
      '  float ds=abs(bc(ps,t).x);',
      '  float aS=(1.-smoothstep(.75,1.5,ds))*.17*smoothstep(ex-.05,ex+.12,ps.x);',
      '  vec3 col=vec3(0.);',
      '  if(aB>0.002){',
      '    float e=1.5/uRes.y;',
      '    float h0=hg(p,t,ex);',
      '    vec2 g=vec2(hg(p+vec2(e,0.),t,ex)-h0,hg(p+vec2(0.,e),t,ex)-h0)/e;',
      '    vec3 n=normalize(vec3(-g*.028,1.));',
      '    vec3 L=normalize(vec3(uLight-p,.7));',
      '    vec3 H=normalize(L+vec3(0.,0.,1.));',
      '    float wr=clamp((dot(n,L)+.3)/1.3,0.,1.);',
      '    float nh=max(dot(n,H),0.);',
      '    float sp=pow(nh,22.)*.17+pow(nh,90.)*.26;',
      '    float ao=smoothstep(-1.1,.8,h0);',
      '    vec3 cDeep=vec3(.65,.48,.455),cMid=vec3(.855,.715,.655),cHi=vec3(.975,.925,.89);',
      '    col=mix(cDeep,cMid,smoothstep(.12,.62,wr));',
      '    col=mix(col,cHi,smoothstep(.62,1.,wr)*.85);',
      '    col*=mix(.86,1.,ao)*(1.-.08*b.z);',
      '    col+=sp*vec3(1.,.95,.9);',
      '    col=mix(col,vec3(.93,.84,.72),pow(1.-n.z,1.5)*.3);',
      '    col=mix(col,cHi,smoothstep(.88,.99,ad)*.18);',
      '    col+=(fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-.5)*.016;',
      '  }',
      '  float aT=aB+aS*(1.-aB);',
      '  gl_FragColor=vec4(col*aB+vec3(.23,.12,.17)*aS*(1.-aB),aT);',
      '}'
    ].join('\n');

    /* Shader im Hintergrund kompilieren (KHR_parallel_shader_compile), damit der Main-Thread nicht blockiert */
    var pext = gl.getExtension('KHR_parallel_shader_compile');
    function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; }
    var v = sh(gl.VERTEX_SHADER, vs), f = sh(gl.FRAGMENT_SHADER, fs);
    var prog = gl.createProgram(); gl.attachShader(prog, v); gl.attachShader(prog, f); gl.linkProgram(prog);
    (function waitCompile() {
      if (pext && !gl.getProgramParameter(prog, pext.COMPLETION_STATUS_KHR)) { setTimeout(waitCompile, 50); return; }
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        if (window.console) console.warn(gl.getShaderInfoLog(f) || gl.getProgramInfoLog(prog));
        root.classList.add('silk-none'); return;
      }
      setTimeout(setup, 0);
    })();
    function setup() {
    gl.useProgram(prog);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var U = {};
    ['uRes', 'uTime', 'uMouse', 'uLift', 'uLight', 'uBand', 'uBand2', 'uIntro', 'uScroll', 'uAsp'].forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });

    /* Adaptive Qualität: Schafft das Gerät die Seide nicht flüssig (mittlere Frame-Zeit > 40 ms),
       sinkt die Auflösung stufenweise; bei sehr langsamer Grafik (> 120 ms) bleibt ein Standbild stehen. */
    var level = 1, floor = 0, RES = SILK.QUALITY[1]; // startet vorsichtig, steigt auf schnellen Geräten auf
    var SLOW_MS = 40, VERY_SLOW_MS = 120;
    var w = 0, h = 0, cssW = 0, cssH = 0, band = SILK.wide;
    var m = { x: 0.3, y: 0.1, tx: 0.3, ty: 0.1, lift: 0, tlift: 0, lx: -0.35, ly: 0.45, tlx: -0.35, tly: 0.45 };
    var t0 = performance.now(), tBase = 14.0, tNow = tBase;
    var intro = MOTION ? 0 : 1, introStart = 0;
    var running = false, inView = true, raf = 0, frozen = false, active = 0, lastFrame = 0, idleSkip = false;
    var lastTs = 0, warm = 2, acc = 0, n = 0;

    function pickBand() { band = cssW / Math.max(1, cssH) >= 0.9 ? SILK.wide : SILK.tall; }
    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      cssW = canvas.clientWidth; cssH = canvas.clientHeight;
      pickBand();
      w = Math.max(2, Math.round(cssW * dpr * RES)); h = Math.max(2, Math.round(cssH * dpr * RES));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      gl.viewport(0, 0, w, h);
      if (!running) draw(tNow);
    }
    function draw(time) {
      gl.uniform2f(U.uRes, w, h);
      gl.uniform1f(U.uTime, time);
      gl.uniform2f(U.uMouse, m.x, m.y);
      gl.uniform1f(U.uLift, m.lift);
      gl.uniform2f(U.uLight, m.lx, m.ly);
      gl.uniform4f(U.uBand, band.a, band.b, band.c, band.amp);
      gl.uniform4f(U.uBand2, band.half, band.k, band.ph, band.twist);
      gl.uniform1f(U.uIntro, intro);
      gl.uniform1f(U.uScroll, silk.scroll);
      gl.uniform1f(U.uAsp, w / h);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    function govern(now) {
      if (lastTs) {
        if (warm > 0) warm--;
        else {
          acc += now - lastTs; n++;
          if (n >= 3 && (n >= 12 || acc >= 500)) {
            var avg = acc / n;
            acc = 0; n = 0;
            if (avg > VERY_SLOW_MS || (avg > SLOW_MS && level === SILK.QUALITY.length - 1)) { frozen = true; return; }
            if (avg > SLOW_MS) { level++; floor = level; RES = SILK.QUALITY[level]; resize(); warm = 3; }
            else if (avg < 21 && level > floor) { level--; RES = SILK.QUALITY[level]; resize(); warm = 3; }
          }
        }
      }
      lastTs = now;
    }
    function frame(now) {
      raf = 0;
      if (!running) return;
      // Ruhezustand: Seide atmet mit halber Bildrate weiter; Maus, Scroll und Intro laufen mit voller Rate
      var busy = intro < 1 || now - active < 1400;
      idleSkip = !busy && !idleSkip;
      if (!idleSkip) {
        govern(now);
        if (frozen) { intro = 1; draw(tNow); running = false; return; } // Standbild im Endzustand
        if (intro < 1) {
          if (!introStart) introStart = now;
          var k = clamp((now - introStart) / SILK.INTRO_MS, 0, 1);
          intro = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
        }
        m.x = lerp(m.x, m.tx, 0.05); m.y = lerp(m.y, m.ty, 0.05);
        m.lift = lerp(m.lift, m.tlift, 0.04);
        m.lx = lerp(m.lx, m.tlx, 0.035); m.ly = lerp(m.ly, m.tly, 0.035);
        if (!finePointer) { m.tlx = -0.3 + Math.sin((now - t0) / 5200) * 0.35; m.tly = 0.45 + Math.cos((now - t0) / 6100) * 0.1; }
        tNow = tBase + (now - t0) / 1000 * 0.62;
        draw(tNow);
      }
      raf = requestAnimationFrame(frame);
    }
    function update() {
      var should = MOTION && inView && !document.hidden && !frozen;
      if (should && !running) { running = true; lastTs = 0; warm = 2; acc = 0; n = 0; if (!raf) raf = requestAnimationFrame(frame); }
      else if (!should && running) { running = false; if (raf) { cancelAnimationFrame(raf); raf = 0; } }
    }
    silk.poke = function () { active = performance.now(); };
    if (MOTION && finePointer) {
      window.addEventListener('pointermove', function (e) {
        if (!inView || !cssH) return;
        var r = canvas.getBoundingClientRect();
        var x = (e.clientX - r.left - cssW / 2) / cssH, y = -(e.clientY - r.top - cssH / 2) / cssH;
        m.tx = x; m.ty = y; m.tlx = x * 0.9 - 0.15; m.tly = y + 0.4; m.tlift = 1;
        active = performance.now();
      }, { passive: true });
      document.documentElement.addEventListener('pointerleave', function () { m.tlift = 0; }, { passive: true });
    }
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
    else window.addEventListener('resize', resize);
    resize();
    draw(tNow);
    requestAnimationFrame(function () { canvas.classList.add('is-ready'); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { inView = en[0].isIntersecting; update(); }, { rootMargin: '60px 0px' }).observe(canvas);
    }
    document.addEventListener('visibilitychange', update);
    update();
    silk.redraw = function () { if (!running && !frozen) draw(tNow); };
    }
  }

  /** Hero beim Scrollen: Zeilen driften unterschiedlich schnell, das Bild sinkt langsamer, die Seide hebt ab. */
  function initHeroScroll() {
    if (!MOTION || !hasGSAP) return;
    var hero = $('.hero');
    if (!hero) return;
    var l1 = $('.ht-l1'), l2 = $('.ht-l2'), l3 = $('.ht-l3'), fig = $('[data-hero-fig]'), label = $('.care-label');
    ScrollTrigger.create({
      trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.5,
      onUpdate: function (self) {
        var p = self.progress;
        l1.style.transform = 'translate3d(' + (-p * 6).toFixed(2) + 'vw,' + (-p * 8).toFixed(2) + 'vh,0)';
        l2.style.transform = 'translate3d(' + (p * 4).toFixed(2) + 'vw,' + (-p * 4).toFixed(2) + 'vh,0)';
        l3.style.transform = 'translate3d(0,' + (-p * 16).toFixed(2) + 'vh,0)';
        if (fig) fig.style.transform = 'translate3d(0,' + (p * 14).toFixed(2) + 'vh,0)';
        if (label) label.style.transform = 'translate3d(0,' + (-p * 10).toFixed(2) + 'vh,0)';
        silk.scroll = p;
        if (silk.poke) silk.poke();
        if (silk.redraw) silk.redraw();
      }
    });
  }

  /* ------------------------------------------------------------------
     Zeichen-Zerlegung für Überschriften + Zeichen-Rollen für Links
     ------------------------------------------------------------------ */
  /** Zerlegt Text in Wörter (span.spw) und Zeichen (span.sc), Inline-Elemente wie <em> bleiben erhalten.
   *  Screenreader lesen eine unsichtbare Klartext-Kopie, die zerlegte Fassung ist aria-hidden. */
  function splitChars(el) {
    if (el.dataset.splitDone) return;
    el.dataset.splitDone = '1';
    var plain = el.textContent.replace(/\s+/g, ' ').trim();
    var vis = document.createElement('span');
    vis.setAttribute('aria-hidden', 'true');
    var i = 0;
    function walk(src, dst) {
      Array.prototype.forEach.call(src.childNodes, function (node) {
        if (node.nodeType === 3) {
          var parts = node.textContent.split(/(\s+)/);
          parts.forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { dst.appendChild(document.createTextNode(' ')); return; }
            var word = document.createElement('span'); word.className = 'spw';
            for (var k = 0; k < part.length; k++) {
              var c = document.createElement('span'); c.className = 'sc';
              c.style.setProperty('--i', i++);
              c.textContent = part[k];
              word.appendChild(c);
            }
            dst.appendChild(word);
          });
        } else if (node.nodeType === 1) {
          var clone = node.cloneNode(false);
          dst.appendChild(clone);
          walk(node, clone);
        }
      });
    }
    walk(el, vis);
    var sr = document.createElement('span'); sr.className = 'sr-only'; sr.textContent = plain;
    el.textContent = '';
    el.appendChild(sr); el.appendChild(vis);
  }
  function initSplit() {
    var els = $$('[data-split]');
    if (!els.length) return;
    if (motionOff || !('IntersectionObserver' in window)) return; // Text bleibt einfach stehen
    els.forEach(splitChars);
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.2 });
    els.forEach(function (el) { io.observe(el); });
  }
  /** Links/Buttons: Zeichen rollen beim Hover nach oben (nur feiner Zeiger). */
  function initRoll() {
    if (!finePointer || !UI_MOTION) return;
    $$('[data-roll], [data-roll-btn]').forEach(function (a) {
      var target = a.hasAttribute('data-roll-btn') ? $('span', a) : a;
      if (!target || target.querySelector('.roll')) return;
      var text = target.textContent.replace(/\s+/g, ' ').trim();
      if (!a.getAttribute('aria-label')) a.setAttribute('aria-label', a.textContent.replace(/\s+/g, ' ').trim());
      var wrap = document.createElement('span'); wrap.className = 'roll'; wrap.setAttribute('aria-hidden', 'true');
      for (var k = 0; k < text.length; k++) {
        var c = document.createElement('span'); c.className = 'rc';
        c.style.setProperty('--i', k);
        c.textContent = text[k];
        wrap.appendChild(c);
      }
      target.textContent = '';
      target.appendChild(wrap);
    });
  }
  /** Magnetische Buttons (nur feiner Zeiger): folgen dem Zeiger gefedert ein Stück, kehren weich zurück. */
  function initMagnetic() {
    if (!finePointer || !MOTION) return;
    $$('[data-magnetic]').forEach(function (el) {
      var s = { x: 0, y: 0, tx: 0, ty: 0 }, raf = 0;
      function tick() {
        raf = 0;
        s.x = lerp(s.x, s.tx, 0.16); s.y = lerp(s.y, s.ty, 0.16);
        el.style.translate = s.x.toFixed(2) + 'px ' + s.y.toFixed(2) + 'px';
        if (Math.abs(s.x - s.tx) > 0.05 || Math.abs(s.y - s.ty) > 0.05) raf = requestAnimationFrame(tick);
      }
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        s.tx = clamp((e.clientX - (r.left + r.width / 2)) * 0.28, -12, 12);
        s.ty = clamp((e.clientY - (r.top + r.height / 2)) * 0.36, -9, 9);
        if (!raf) raf = requestAnimationFrame(tick);
      });
      el.addEventListener('pointerleave', function () { s.tx = 0; s.ty = 0; if (!raf) raf = requestAnimationFrame(tick); });
    });
  }

  /* ------------------------------------------------------------------
     Reveals, Zähler, Wörter, gezeichnete Linien, Tiefen-Parallax
     ------------------------------------------------------------------ */
  function initReveals() {
    var els = $$('[data-reveal]');
    if (motionOff || !('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add('is-in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      var batch = entries.filter(function (e) { return e.isIntersecting; }).map(function (e) { return e.target; });
      batch.sort(function (a, b) { return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1; });
      batch.forEach(function (el, i) {
        el.style.transitionDelay = Math.min(i, 6) * 60 + 'ms';
        el.classList.add('is-in');
        io.unobserve(el);
        setTimeout(function () { el.style.transitionDelay = ''; }, 1300 + i * 60);
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
        var t0 = performance.now(), dur = 1600;
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

  /** Statement baut sich Wort für Wort auf (nur vorwärts). Bleibt der Leser stehen, ist der Satz nach ~2 s fertig. */
  function initWords() {
    var p = $('[data-words]');
    if (!p || !MOTION || !hasGSAP) return;
    var text = p.textContent.replace(/\s+/g, ' ').trim();
    p.setAttribute('aria-label', text);
    p.textContent = '';
    var words = text.split(' ');
    var spans = [];
    words.forEach(function (w, i) {
      var s = document.createElement('span');
      s.className = 'w'; s.setAttribute('aria-hidden', 'true');
      s.textContent = w;
      p.appendChild(s);
      if (i < words.length - 1) p.appendChild(document.createTextNode(' '));
      spans.push(s);
    });
    var shown = 0, idleT = 0, done = false;
    function paint(k) {
      for (var i = 0; i < spans.length; i++) {
        var f = clamp(k - i, 0, 1);
        spans[i].style.opacity = (0.2 + 0.8 * f).toFixed(3);
      }
    }
    function finish() {
      if (done) return; done = true;
      spans.forEach(function (s, i) { s.style.transitionDelay = (i * 14) + 'ms'; s.style.opacity = '1'; });
    }
    paint(0);
    ScrollTrigger.create({
      trigger: p, start: 'top 85%', end: 'bottom 50%',
      onUpdate: function (self) {
        if (done) return;
        var k = self.progress * (spans.length + 2);
        if (k > shown) { shown = k; paint(shown); }
        if (self.progress >= 0.999) finish();
        clearTimeout(idleT);
        idleT = setTimeout(finish, 2000);
      },
      onLeave: finish
    });
  }

  function initDraw() {
    var paths = $$('[data-draw]');
    if (!paths.length || motionOff || !('IntersectionObserver' in window)) return;
    paths.forEach(function (pth) { try { pth.style.setProperty('--len', Math.ceil(pth.getTotalLength()) + 1); } catch (e) {} });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        var el = en.target;
        setTimeout(function () { el.classList.add('is-drawn'); }, 250);
      });
    }, { threshold: 0.5 });
    paths.forEach(function (pth) { io.observe(pth); });
  }

  /** Tiefen-Parallax: Ebenen mit data-depth wandern beim Scrollen unterschiedlich schnell, das Bild darin gegenläufig. */
  function initDepth() {
    if (!MOTION || !hasGSAP) return;
    $$('[data-depth]').forEach(function (fig) {
      var d = parseFloat(fig.dataset.depth) || 0;
      var img = $('img', fig);
      gsap.fromTo(fig, { y: function () { return -d * window.innerHeight * 0.5; } }, {
        y: function () { return d * window.innerHeight * 0.5; }, ease: 'none',
        scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true }
      });
      if (img) gsap.fromTo(img, { yPercent: -5 }, { yPercent: 5, ease: 'none', scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: true } });
      gsap.fromTo(fig, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'power3.inOut', scrollTrigger: { trigger: fig, start: 'top 92%', once: true } });
    });
  }

  /* ------------------------------------------------------------------
     Seidenband: Text läuft auf der Bahn mit dem Scroll; schnelles Scrollen
     bringt die Bahn zum Flattern. Läuft nur, solange sichtbar und bewegt.
     ------------------------------------------------------------------ */
  function initRibbons() {
    var ribbons = $$('[data-ribbon]');
    if (!ribbons.length || !MOTION) return;
    ribbons.forEach(function (rb, idx) {
      var tp = $('[data-rb-text]', rb), path = $('[data-rb-path]', rb);
      if (!tp || !path) return;
      var base = path.getAttribute('d');
      var nums = base.match(/-?\d+(\.\d+)?/g).map(Number);
      var dir = idx % 2 ? -1 : 1;
      var reps = +rb.dataset.reps || 2, half = 0; // half = Länge einer Wiederholung
      try { half = $('.rb-text', rb).getComputedTextLength() / reps; } catch (e) { half = 1800; }
      if (!half) half = 1800;
      var state = { inView: false, off: 0, vel: 0, flutter: 0, lastY: window.pageYOffset, raf: 0, still: 0 };
      function tick() {
        state.raf = 0;
        var y = window.pageYOffset, dy = y - state.lastY; state.lastY = y;
        state.vel = lerp(state.vel, dy, 0.18);
        state.off -= dir * (dy * 0.55);
        var o = ((state.off % half) + half) % half;
        tp.setAttribute('startOffset', (-o).toFixed(1));
        state.flutter = lerp(state.flutter, clamp(Math.abs(state.vel) * 1.4, 0, 46), 0.08);
        var a = state.flutter * Math.sin(performance.now() / 260);
        var q = nums.slice();
        q[3] -= a; q[5] += a * 0.8; q[9] -= a * 0.7;
        path.setAttribute('d', 'M' + q[0] + ' ' + q[1] + 'C' + q[2] + ' ' + q[3].toFixed(1) + ' ' + q[4] + ' ' + q[5].toFixed(1) + ' ' + q[6] + ' ' + q[7] + 'S' + q[8] + ' ' + q[9].toFixed(1) + ' ' + q[10] + ' ' + q[11]);
        if (Math.abs(dy) < 0.1 && state.flutter < 0.2) state.still++; else state.still = 0;
        if (state.inView && state.still < 30) state.raf = requestAnimationFrame(tick);
      }
      function kick() { state.still = 0; if (state.inView && !state.raf) state.raf = requestAnimationFrame(tick); }
      window.addEventListener('scroll', kick, { passive: true });
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (en) { state.inView = en[0].isIntersecting; state.lastY = window.pageYOffset; kick(); }, { rootMargin: '100px 0px' }).observe(rb);
      }
    });
  }

  /* ------------------------------------------------------------------
     II · Ritual – Sticky-Szene: Bilder öffnen sich wie Tropfen und Stoff
     ------------------------------------------------------------------ */
  /** Tropfen: organischer Kreis, der sich ausbreitet (Polygon mit leichter Welle). */
  function dropPoly(cx, cy, r, phase) {
    var pts = [], N = 40;
    for (var i = 0; i < N; i++) {
      var a = i / N * Math.PI * 2;
      var rr = r * (1 + 0.045 * Math.sin(3 * a + phase) + 0.03 * Math.sin(5 * a - phase * 1.3));
      pts.push((cx + Math.cos(a) * rr * 0.78).toFixed(2) + '% ' + (cy + Math.sin(a) * rr * 1.18).toFixed(2) + '%');
    }
    return 'polygon(' + pts.join(',') + ')';
  }
  /** Stoff: eine wellige Kante zieht diagonal über das Bild (wie zurückgeschlagene Seide). */
  function foldPoly(p, phase) {
    var pts = ['-2% -2%'], N = 18;
    var base = -30 + p * 160;
    for (var i = 0; i <= N; i++) {
      var y = i / N * 104 - 2;
      var x = base - y * 0.28 + 5 * Math.sin(y / 100 * Math.PI * 2.2 + phase + p * 3) * (1 - p * 0.6);
      pts.push(x.toFixed(2) + '% ' + y.toFixed(2) + '%');
    }
    pts.push('-2% 102%');
    return 'polygon(' + pts.join(',') + ')';
  }
  function initRitual() {
    var section = $('#ablauf');
    if (!section) return;
    var acts = $$('.act', section);
    var imgs = acts.map(function (a) { return $('.act-img', a); });
    var texts = acts.map(function (a) { return $('.act-text', a); });
    var threads = $$('.rp-thread i', section);
    // Handy / ohne Szene: jedes Bild öffnet sich beim Erreichen
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
      }, { threshold: 0.3 });
      acts.forEach(function (a) { io.observe(a); });
    } else acts.forEach(function (a) { a.classList.add('is-in'); });

    if (!hasGSAP || !MOTION) return;
    var mm = gsap.matchMedia();
    mm.add('(min-width: 900px) and (min-height: 560px)', function () {
      if (!root.classList.contains('scene')) return;
      var scroller = $('[data-ritual]', section);
      function render(prog) {
        var s = prog * 3.15;
        for (var k = 0; k < acts.length; k++) {
          // Bild k öffnet sich zwischen s = k−0.85 und k−0.1
          if (k > 0) {
            var r = smooth(k - 0.9, k - 0.12, s);
            var cp;
            if (k === 2) cp = r >= 1 ? 'none' : foldPoly(r, k);
            else cp = r >= 1 ? 'none' : dropPoly(k === 1 ? 34 : 66, k === 1 ? 38 : 62, r * 92, s * 2.2 + k);
            imgs[k].style.clipPath = r <= 0 ? 'polygon(50% 50%, 50% 50%, 50% 50%)' : cp;
            var im = imgs[k].firstElementChild;
            if (im) im.style.transform = 'scale(' + (1.14 - 0.14 * r).toFixed(4) + ')';
          }
          // Text k: sichtbar um s ≈ k, weicher Wechsel an den Übergängen
          var o;
          if (k === 0) o = 1 - smooth(0.3, 0.52, s);
          else if (k === acts.length - 1) o = smooth(k - 0.48, k - 0.26, s);
          else o = smooth(k - 0.48, k - 0.26, s) * (1 - smooth(k + 0.3, k + 0.52, s));
          var dirY = s < k ? 1 : -1;
          texts[k].style.opacity = o.toFixed(3);
          texts[k].style.transform = 'translate3d(0,' + ((1 - o) * 28 * dirY).toFixed(2) + 'px,0)';
          acts[k].classList.toggle('is-current', o > 0.5);
          if (threads[k]) threads[k].style.transform = 'scaleX(' + (k === 0 ? smooth(0, 0.3, s) : smooth(k - 0.9, k - 0.12, s)).toFixed(3) + ')';
        }
      }
      var st = ScrollTrigger.create({
        trigger: scroller, start: 'top top', end: 'bottom bottom', scrub: 0.6,
        onUpdate: function (self) { render(self.progress); }
      });
      render(0);
      return function () {
        st.kill();
        acts.forEach(function (a, k) {
          imgs[k].style.clipPath = ''; texts[k].style.opacity = ''; texts[k].style.transform = '';
          var im = imgs[k].firstElementChild; if (im) im.style.transform = '';
        });
      };
    });
  }

  /* ------------------------------------------------------------------
     III · La Carte (Filter mit FLIP-Übergängen, Bildvorschau am Zeiger)
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
      out.textContent = v + ' €';
      range.setAttribute('aria-valuetext', 'bis ' + v + ' Euro');
    }
    function after() {
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
        after(); return;
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
            var dy = f.top - last.top;
            if (Math.abs(dy) > 1) {
              li.animate(reduced ? [{ opacity: 0.4 }, { opacity: 1 }] : [{ transform: 'translateY(' + dy + 'px)' }, { transform: 'translateY(0)' }],
                { duration: reduced ? 260 : 720, easing: EASE_IN_OUT });
            }
          } else {
            li.animate(reduced ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 0, transform: 'translateY(22px)', clipPath: 'inset(0 0 100% 0)' }, { opacity: 1, transform: 'none', clipPath: 'inset(0 0 0% 0)' }],
              { duration: 620, delay: 90 + Math.min(k++, 8) * 50, easing: EASE_OUT, fill: 'backwards' });
          }
        });
        after();
      };
      if (leaving.length) {
        leaving.forEach(function (li) {
          li.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: reduced ? 'none' : 'translateX(-12px)' }], { duration: 180, easing: EASE_OUT, fill: 'forwards' });
        });
        setTimeout(layout, 180);
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

    // Bildvorschau, die dem Zeiger gefedert folgt und sich wie ein Schleier öffnet (Desktop, feiner Zeiger)
    if (!finePointer || !UI_MOTION) return;
    var mqWide = matchMedia('(min-width: 1101px)');
    var pv = document.createElement('div');
    pv.className = 'carte-preview'; pv.setAttribute('aria-hidden', 'true');
    var imA = new Image(), imB = new Image();
    imA.alt = ''; imB.alt = ''; imA.decoding = 'async'; imB.decoding = 'async';
    imB.className = 'is-out';
    pv.appendChild(imA); pv.appendChild(imB);
    var shownSrc = '', front = imA, back = imB;
    var pos = { x: 0, y: 0, tx: 0, ty: 0, r: 0, tr: 0 }, raf = 0, on = false;
    var cache = {};
    function srcFor(name) { return '/arena/kosmetik-maison-belle/assets/img/' + name + '-480.webp'; }
    function preload() { items.forEach(function (li) { var n = li.dataset.img; if (n && !cache[n]) { cache[n] = new Image(); cache[n].src = srcFor(n); } }); }
    function show(name) {
      var src = srcFor(name);
      if (src === shownSrc) return;
      shownSrc = src;
      if (!front.getAttribute('src')) { front.src = src; return; }
      back.src = src;
      back.classList.remove('is-out'); front.classList.add('is-out');
      var t = front; front = back; back = t;
    }
    function tick() {
      raf = 0;
      pos.x = lerp(pos.x, pos.tx, 0.14); pos.y = lerp(pos.y, pos.ty, 0.14);
      pos.r = lerp(pos.r, pos.tr, 0.1);
      pv.style.transform = 'translate3d(' + pos.x.toFixed(1) + 'px,' + pos.y.toFixed(1) + 'px,0) rotate(' + pos.r.toFixed(2) + 'deg)';
      pos.tr = clamp((pos.tx - pos.x) * 0.05, -5, 5);
      if (on || Math.abs(pos.x - pos.tx) > 0.3 || Math.abs(pos.y - pos.ty) > 0.3) raf = requestAnimationFrame(tick);
    }
    grid.addEventListener('pointerenter', function () {
      if (!mqWide.matches) return;
      if (!pv.parentNode) { document.body.appendChild(pv); preload(); }
    });
    grid.addEventListener('pointermove', function (e) {
      if (!mqWide.matches || !pv.parentNode) return;
      var li = e.target.closest && e.target.closest('.treat');
      var overBtn = e.target.closest && e.target.closest('.treat-book');
      pos.tx = e.clientX + 36; pos.ty = e.clientY - 150;
      if (!on) { pos.x = pos.tx; pos.y = pos.ty + 30; }
      if (li && li.dataset.img && !overBtn) {
        show(li.dataset.img);
        if (!on) { on = true; pv.classList.add('is-on'); }
      } else if (on) { on = false; pv.classList.remove('is-on'); }
      if (!raf) raf = requestAnimationFrame(tick);
    }, { passive: true });
    grid.addEventListener('pointerleave', function () { on = false; pv.classList.remove('is-on'); });
    window.addEventListener('scroll', function () { if (on) { on = false; pv.classList.remove('is-on'); } }, { passive: true });
  }

  /** Zu einer Behandlung springen und sie kurz hervorheben. */
  function gotoTreatment(id) {
    var t = TREATS[id];
    if (!t) return;
    if (t.el.hidden && carte.reset) carte.reset();
    scrollToEl(t.el, { offset: -(headerH() + 140), focusEl: $('.treat-book', t.el) });
    t.el.classList.remove('is-highlight');
    setTimeout(function () { void t.el.offsetWidth; t.el.classList.add('is-highlight'); }, lenis ? 1000 : 300);
    setTimeout(function () { t.el.classList.remove('is-highlight'); }, 3400);
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
     IV · Hautcheck (5 Fragen → Empfehlung), Raumfarbe folgt der Antwort
     ------------------------------------------------------------------ */
  function initQuiz() {
    var form = $('#quiz'), result = $('#quiz-result');
    if (!form || !result) return;
    var room = $('#hautcheck');
    var qs = $$('.q', form);
    var stepOut = $('[data-quiz-step]', form), threads = $$('[data-quiz-bar] i', form);
    var back = $('[data-quiz-back]', form), next = $('[data-quiz-next]', form), hint = $('[data-quiz-hint]', form);
    var cur = 0, lastPointer = 0, advanceTimer = 0;
    qs.forEach(function (q) { $$('.opt', q).forEach(function (o, i) { o.style.setProperty('--i', i); }); });

    function answer(i) { var c = qs[i].querySelector('input:checked'); return c ? c : null; }
    function tone() {
      var c = answer(cur) || (cur > 0 ? answer(cur - 1) : null);
      room.style.setProperty('--quiz-tone', c && c.dataset.tone ? c.dataset.tone : '');
      if (!c) room.style.removeProperty('--quiz-tone');
    }
    function show(i, dir, focus) {
      cur = i;
      qs.forEach(function (q, k) {
        q.classList.remove('is-enter', 'is-enter-back');
        q.classList.toggle('is-active', k === i);
      });
      if (UI_MOTION && dir) { void qs[i].offsetWidth; qs[i].classList.add(dir > 0 ? 'is-enter' : 'is-enter-back'); }
      stepOut.textContent = i + 1;
      threads.forEach(function (t, k) { t.classList.toggle('is-done', k <= i); });
      back.disabled = i === 0;
      var lbl = $('span', next);
      lbl.textContent = i === qs.length - 1 ? 'Auswerten' : 'Weiter';
      hint.textContent = '';
      tone();
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
      if (input.dataset.tone) room.style.setProperty('--quiz-tone', input.dataset.tone);
      hint.textContent = '';
      if (performance.now() - lastPointer < 900 && qi === cur) {
        clearTimeout(advanceTimer);
        advanceTimer = setTimeout(function () { goNext(false); }, UI_MOTION ? 420 : 0);
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
      $('[data-r-meta]', result).textContent = t.min + ' Min. · ' + t.price + ' €';
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
      room.style.removeProperty('--quiz-tone');
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
     V · Wirkstoff-Explorer (Tabs mit Tropfen)
     ------------------------------------------------------------------ */
  var actives = { select: null };
  function initActives() {
    var orbit = $('[data-orbit]');
    if (!orbit) return;
    var tabs = $$('[role="tab"]', orbit);
    var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });
    var lines = $$('[data-link]', orbit);
    var current = null;
    panels.forEach(function (p) { Array.prototype.forEach.call(p.children, function (c, i) { c.style.setProperty('--i', i); }); });

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

    // Magnetische Tropfen (Feder/Lerp, nur Maus)
    if (!MOTION || !finePointer) return;
    var inners = tabs.map(function (t) { return { el: $('.drop-inner', t), btn: t, x: 0, y: 0, tx: 0, ty: 0 }; });
    var raf = 0;
    function tick() {
      raf = 0;
      var moving = false;
      inners.forEach(function (d) {
        d.x = lerp(d.x, d.tx, 0.1); d.y = lerp(d.y, d.ty, 0.1);
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
    var success = $('#gift-success'), summary = $('[data-gift-summary]');
    var flipBtn = $('[data-gift-flip]'), flipLabel = $('[data-flip-label]');
    var faces = $$('.gc-face', card);
    var lastColor = 'puder', submitted = false;
    var mini = $('[data-gift-mini]'), miniVal = $('[data-gm-value]'), miniTo = $('[data-gm-to]'), miniCard = $('[data-gm-card]');

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
      var before = vOut.textContent;
      if (type === 'behandlung') {
        vOut.textContent = treatName();
        vOut.classList.add('is-treatment');
      } else {
        var a = amount();
        vOut.textContent = a != null ? fmtEuroShort(a) : '— €';
        vOut.classList.remove('is-treatment');
      }
      if (UI_MOTION && before !== vOut.textContent) { vOut.classList.remove('is-shine'); void vOut.offsetWidth; vOut.classList.add('is-shine'); }
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
      if (mini) {
        miniVal.textContent = vOut.textContent;
        miniTo.textContent = to.value.trim() ? 'Für ' + to.value.trim() : 'Live-Vorschau';
        miniCard.dataset.color = color;
      }
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
      if (card.classList.contains('is-flipped')) flipBtn.click();
      form.hidden = true;
      success.hidden = false;
      $('[data-gift-success-title]', success).focus({ preventScroll: true });
      var top = success.getBoundingClientRect().top;
      if (top < headerH() || top > window.innerHeight * 0.6) scrollToEl(success, { offset: -(headerH() + 30) });
      scheduleRefresh(300);
    });
    // Live-Pille (Handy/Tablet): erscheint, sobald die große Vorschau aus dem Bild ist
    if (mini && 'IntersectionObserver' in window) {
      var mqMini = matchMedia('(max-width: 899px)');
      var stageOut = false;
      var syncMini = function () { mini.classList.toggle('is-on', mqMini.matches && stageOut && !form.hidden); };
      // Prüft per Scroll, solange das Gutschein-Kapitel sichtbar ist (auch bei Sprüngen über die Karte hinweg)
      var watch = false, miniTick = false;
      var measure = function () {
        miniTick = false;
        var r = stage.getBoundingClientRect();
        var out = r.bottom < headerH() + 40;
        if (out !== stageOut) { stageOut = out; syncMini(); }
      };
      window.addEventListener('scroll', function () { if (watch && !miniTick) { miniTick = true; requestAnimationFrame(measure); } }, { passive: true });
      new IntersectionObserver(function (en) { watch = en[0].isIntersecting; measure(); }).observe($('#gutschein'));
      if (mqMini.addEventListener) mqMini.addEventListener('change', syncMini);
      form.addEventListener('submit', function () { setTimeout(syncMini, 0); });
      mini.addEventListener('click', function () { scrollToEl(stage, { offset: -(headerH() + 16) }); });
    }
    $('[data-gift-again]').addEventListener('click', function () {
      success.hidden = true; form.hidden = false; newCode();
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
     VIII · Kundenstimmen (Karussell, Wörter tauchen nacheinander auf)
     ------------------------------------------------------------------ */
  function initCarousel() {
    var wrap = $('[data-carousel]');
    if (!wrap) return;
    var slides = $$('.slide', wrap), dots = $('[data-dots]', wrap), curOut = $('[data-c-cur]', wrap);
    var i = 0;
    if (UI_MOTION) {
      slides.forEach(function (s) {
        var p = $('blockquote p', s);
        var text = p.textContent.replace(/\s+/g, ' ').trim();
        p.setAttribute('aria-label', text);
        p.textContent = '';
        text.split(' ').forEach(function (w, k, arr) {
          var sp = document.createElement('span'); sp.className = 'vw'; sp.setAttribute('aria-hidden', 'true');
          sp.style.setProperty('--i', k); sp.textContent = w;
          p.appendChild(sp);
          if (k < arr.length - 1) p.appendChild(document.createTextNode(' '));
        });
      });
    }
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
  /** Lageplan: Auf schmalen Bildschirmen auf die Kö zoomen (größere Beschriftung). */
  var MAP_VIEWBOX = { full: '0 0 640 480', narrow: '128 48 492 404' };
  function initMap() {
    var svg = $('.map-svg');
    if (!svg) return;
    if (window.matchMedia) {
      var mqMap = matchMedia('(max-width: 599px)');
      var setVB = function () { svg.setAttribute('viewBox', mqMap.matches ? MAP_VIEWBOX.narrow : MAP_VIEWBOX.full); };
      setVB();
      if (mqMap.addEventListener) mqMap.addEventListener('change', setVB);
    }
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
        route.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: 2400, easing: EASE_IN_OUT });
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
          var a = body.animate([{ height: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }], { duration: reduced ? 200 : 360, easing: EASE_OUT });
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
  /* Sofort: was der erste Bildschirm braucht (Kopfzeile, Menü, Intro). Danach laden GSAP, ScrollTrigger und
     Lenis nacheinander; der Rest startet in kleinen Häppchen (≈ 8 ms je Task, danach wird abgegeben),
     damit der Main-Thread während des Hero-Intros frei bleibt (keine langen Boot-Tasks). */
  safe(initHeader, 'header');
  safe(initMenu, 'menu');
  safe(initIntro, 'intro');
  window.__maisonReady = true;
  var queue = [
    [initScroll, 'scroll'], [initTones, 'tones'], [initRoll, 'roll'], [initSplit, 'split'], [initCarousel, 'carousel'], [initBooking, 'booking'],
    [initMagnetic, 'magnetic'], [initHeroScroll, 'heroScroll'], [initReveals, 'reveals'], [initWords, 'words'], [initDraw, 'draw'],
    [initDepth, 'depth'], [initCounters, 'counters'], [initRibbons, 'ribbons'], [initRitual, 'ritual'],
    [initCarte, 'carte'], [initGoto, 'goto'], [initBookLinks, 'book'], [initQuiz, 'quiz'],
    [initActives, 'actives'], [initGift, 'gift'], [initHours, 'hours'], [initMap, 'map'], [initFaq, 'faq']
  ];
  var yieldTask = function (fn) {
    if (window.scheduler && typeof scheduler.postTask === 'function') scheduler.postTask(fn, { priority: 'user-visible' });
    else setTimeout(fn, 0);
  };
  function runQueue() {
    var t0 = performance.now();
    while (queue.length) {
      var job = queue.shift();
      safe(job[0], job[1]);
      if (queue.length && performance.now() - t0 > 8) { yieldTask(runQueue); return; }
    }
    window.__maisonBooted = true;
    if (hasGSAP) {
      ScrollTrigger.refresh();
      if (document.readyState !== 'complete') window.addEventListener('load', function () { ScrollTrigger.refresh(); });
    }
  }
  function loadVendors(done) {
    var i = 0;
    if (window.gsap && window.ScrollTrigger) { done(); return; }
    (function next() {
      if (i >= VENDOR.length) { done(); return; }
      var s = document.createElement('script');
      s.src = VENDOR[i++];
      s.onload = s.onerror = function () { setTimeout(next, 0); };
      document.head.appendChild(s);
    })();
  }
  loadVendors(function () {
    hasGSAP = !!(window.gsap && window.ScrollTrigger);
    if (!hasGSAP) root.classList.remove('scene'); // Sticky-Szene braucht ScrollTrigger
    yieldTask(runQueue);
  });
  // Seide startet kurz nach dem Zeichen-Intro (Leinwand unsichtbar bis zum ersten Bild, rollt dann auf)
  setTimeout(function () {
    var start = function () { safe(initSilk, 'silk'); };
    if ('requestIdleCallback' in window) requestIdleCallback(start, { timeout: 900 }); else start();
  }, 650);
})();
