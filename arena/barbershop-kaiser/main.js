/* ==========================================================================
   KAISER Barbershop · Modell „Messing“
   Ohne Build-Schritt. Optional: GSAP + ScrollTrigger, Lenis.
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

  /* ------------------------------------------------------------------
     Helfer
     ------------------------------------------------------------------ */
  var doc = document.documentElement;
  var qs = function (s, r) { return (r || document).querySelector(s); };
  var qsa = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var easeInOut = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var dprMax = function () { return Math.min(window.devicePixelRatio || 1, 2); };
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
  function visibilityGate(el, onChange) {
    var inView = false;
    var update = function () { onChange(inView && !document.hidden); };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) { inView = entries[0].isIntersecting; update(); }, { rootMargin: '80px 0px' }).observe(el);
    } else { inView = true; }
    document.addEventListener('visibilitychange', update);
    update();
  }
  function headerOffset() { var h = qs('[data-header]'); return h ? h.offsetHeight : 0; }

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
     Hero: Headline-Reveal (clip-path) + Parallax
     ------------------------------------------------------------------ */
  function initHero() {
    var started = false;
    var start = function () { if (started) return; started = true; requestAnimationFrame(function () { doc.classList.add('hero-in'); }); };
    var fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    fontsReady.then(start);
    setTimeout(start, 900);

    if (!hasGSAP || reduced()) return;
    var mm = gsap.matchMedia();
    mm.add('(min-width: 900px)', function () {
      gsap.to('.hero-arch img', { yPercent: 8, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
      gsap.to('.hero-rays .rays', { rotation: 30, svgOrigin: '300 300', ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    });
  }

  /* ------------------------------------------------------------------
     Hero: generative Barber-Pole (Canvas, Helix-Streifen)
     Drehtempo = Grundtempo + Scroll-Geschwindigkeit (mit Feder geglättet)
     ------------------------------------------------------------------ */
  function initPole() {
    var canvas = qs('[data-pole]');
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    var BANDS = [ // Farbe, Anteil an einer Periode
      ['#7A1F1F', 0.34], ['#EFE8DC', 0.2], ['#C9A25E', 0.16], ['#EFE8DC', 0.2], ['#1C1715', 0.1]
    ];
    var BASE_SPEED = 0.22;   // Perioden pro Sekunde im Ruhezustand
    var SCROLL_GAIN = 0.035; // Zusatz pro px Scroll-Geschwindigkeit
    var W = 0, H = 0, dpr = 1, pitch = 60, period = 80;
    var phase = 0, boost = 0, running = false, raf = 0, last = 0, lastY = window.scrollY;
    var tile = null, shade = null;

    function resize() {
      var r = canvas.getBoundingClientRect();
      var w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
      if (w === W && h === H) return;
      W = w; H = h; dpr = dprMax();
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      pitch = W * 2.4;          // Steigung der Helix (px pro Umdrehung)
      period = W * 1.25;        // Höhe einer Farbfolge
      renderTile();
      draw();
    }
    /* Die Helix ist vertikal periodisch: Phase p = Bild bei Phase 0, um p·period nach oben verschoben.
       Deshalb einmal eine Kachel (Höhe H + period) zeichnen und pro Frame nur verschoben einblenden. */
    function renderTile() {
      tile = tile || document.createElement('canvas');
      var TH = H + Math.ceil(period) + 2;
      tile.width = Math.round(W * dpr); tile.height = Math.round(TH * dpr);
      var t = tile.getContext('2d');
      t.setTransform(dpr, 0, 0, dpr, 0, 0);
      var slices = Math.max(24, Math.round(W / 1.25)), sw = W / slices;
      for (var s = 0; s < slices; s++) {
        var cx = (s + 0.5) * sw;
        var theta = Math.asin(clamp((cx / W) * 2 - 1, -1, 1));
        var off = (theta / (2 * Math.PI)) * pitch;
        var k0 = Math.floor((off - period) / period), k1 = Math.ceil((TH + off) / period);
        for (var k = k0; k <= k1; k++) {
          var y = k * period - off;
          for (var b = 0; b < BANDS.length; b++) {
            var hgt = BANDS[b][1] * period;
            if (y + hgt > 0 && y < TH) { t.fillStyle = BANDS[b][0]; t.fillRect(s * sw, y, sw + 0.6, hgt + 0.6); }
            y += hgt;
          }
        }
      }
      // Schatten unter den Kappen
      shade = ctx.createLinearGradient(0, 0, 0, H);
      shade.addColorStop(0, 'rgba(0,0,0,.55)'); shade.addColorStop(0.06, 'rgba(0,0,0,0)'); shade.addColorStop(0.94, 'rgba(0,0,0,0)'); shade.addColorStop(1, 'rgba(0,0,0,.5)');
    }
    function draw() {
      var m = ((phase * period) % period + period) % period;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(tile, 0, -m * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = shade; ctx.fillRect(0, 0, W, H);
    }
    function velocity() {
      if (lenis) return lenis.velocity || 0;
      var y = window.scrollY, v = y - lastY; lastY = y; return v;
    }
    function tick(t) {
      if (!running) return;
      var dt = last ? Math.min(0.05, (t - last) / 1000) : 0.016; last = t;
      var target = clamp(velocity() * SCROLL_GAIN, -2.4, 3.2);
      boost = lerp(boost, target, 1 - Math.pow(0.9, dt * 60));
      phase += dt * (BASE_SPEED + boost);
      phase -= Math.floor(phase); // eine Periode genügt
      draw();
      raf = requestAnimationFrame(tick);
    }
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas); else window.addEventListener('resize', resize);
    resize();
    if (reduced()) return; // statisch
    visibilityGate(canvas, function (on) {
      if (on && !running) { running = true; last = 0; lastY = window.scrollY; raf = requestAnimationFrame(tick); }
      else if (!on && running) { running = false; cancelAnimationFrame(raf); }
    });
  }

  /* ------------------------------------------------------------------
     Reveal beim Scrollen
     ------------------------------------------------------------------ */
  function initReveal() {
    var els = qsa('[data-reveal]');
    if (motionOff || !('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add('is-in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ------------------------------------------------------------------
     Statement: Wort für Wort mit dem Scroll aufhellen
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
    gsap.fromTo(words, { opacity: 0.16 }, { opacity: 1, ease: 'none', stagger: 0.08, scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 48%', scrub: 0.4 } });
  }

  /* ------------------------------------------------------------------
     Nassrasur in vier Akten: gepinnte Szene (nur Desktop)
     ------------------------------------------------------------------ */
  function initRitual() {
    var section = qs('[data-ritual]');
    if (!section || !hasGSAP || reduced()) return;
    var figs = qsa('.ritual-fig', section), texts = qsa('.ritual-text', section), ticks = qsa('.ritual-ticks li', section);
    var imgs = figs.map(function (f) { return qs('img', f); });
    var mm = gsap.matchMedia();
    mm.add('(min-width: 900px) and (min-height: 560px)', function () {
      // Bühne per CSS „position: sticky“ (statt GSAP-Pin mit position: fixed):
      // kein Umschalten der Positionierung beim Scrollen → keine Layout-Verschiebung (CLS), kein Pin-Spacer.
      section.classList.add('is-pinned');
      figs.forEach(function (f, i) { f.style.zIndex = i + 1; });
      gsap.set(figs.slice(1), { clipPath: 'inset(100% 0% 0% 0%)' });
      gsap.set(imgs.slice(1), { scale: 1.18 });
      gsap.set(texts.slice(1), { autoAlpha: 0, y: 40 });
      var lastTick = -1;
      var setTick = function (idx) { if (idx === lastTick) return; lastTick = idx; ticks.forEach(function (t, i) { t.classList.toggle('is-active', i === idx); }); };
      var tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: section, start: 'top top', end: 'bottom bottom',
          scrub: 0.6, invalidateOnRefresh: true,
          onUpdate: function (self) { var t = self.progress * tl.duration(); setTick(clamp(Math.floor(t - 0.65) + 1, 0, 3)); }
        }
      });
      for (var i = 1; i < figs.length; i++) {
        var at = i - 1 + 0.3;
        tl.to(figs[i], { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.7, ease: 'power2.inOut' }, at)
          .to(imgs[i], { scale: 1, duration: 0.9, ease: 'power2.out' }, at)
          .to(imgs[i - 1], { scale: 0.94, duration: 0.7 }, at)
          .to(texts[i - 1], { autoAlpha: 0, y: -40, duration: 0.3, ease: 'power2.in' }, at)
          .to(texts[i], { autoAlpha: 1, y: 0, duration: 0.35, ease: 'power2.out' }, at + 0.35);
      }
      tl.to({}, { duration: 0.4 });
      return function () {
        section.classList.remove('is-pinned');
        gsap.set(figs.concat(texts, imgs), { clearProps: 'all' });
        figs.forEach(function (f) { f.style.zIndex = ''; });
        lastTick = -1; setTick(0);
      };
    });
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
    var pSolid = qs('[data-beard-solid]', svg), pStache = qs('[data-beard-stache]', svg), pStubble = qs('[data-beard-stubble]', svg);
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
    function morphTo(key) {
      var to = BEARDS[key];
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
    if (tot) tot.textContent = pad2(cards.length);

    function padLeft() { return parseFloat(getComputedStyle(track).paddingLeft) || 0; }
    function bounds() { min = Math.min(0, vp.clientWidth - track.scrollWidth); max = 0; }
    function index() {
      var pos = -x + 12, idx = 0, pl = padLeft();
      for (var i = 0; i < cards.length; i++) { if (cards[i].offsetLeft - pl <= pos) idx = i; }
      if (x <= min + 2) idx = cards.length - 1;
      return idx;
    }
    function render() {
      track.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0)';
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
    var el = qs('[data-open-status]'), txt = qs('[data-open-text]');
    if (el && txt) {
      var h = HOURS[now.wd], open = h && now.minutes >= h[0] * 60 && now.minutes < h[1] * 60;
      if (open) { el.classList.add('is-open'); txt.textContent = 'Jetzt geöffnet · bis ' + fmtHour(h[1]) + ' Uhr'; }
      else {
        el.classList.add('is-closed');
        var label = '';
        if (h && now.minutes < h[0] * 60) label = 'heute ab ' + fmtHour(h[0]) + ' Uhr';
        else {
          for (var i = 1; i <= 7; i++) { var wd = (now.wd + i) % 7; if (HOURS[wd]) { label = (i === 1 ? 'morgen' : WD_SHORT[wd]) + ' ab ' + fmtHour(HOURS[wd][0]) + ' Uhr'; break; } }
        }
        txt.textContent = 'Geschlossen · wieder ' + label;
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
    // sofort: alles, was im ersten Bildschirm sichtbar ist oder Eingaben annimmt
    safe('scroll', initScroll);
    safe('header', initHeader);
    safe('menu', initMenu);
    safe('hero', initHero);
    safe('pole', initPole);
    // danach in kleinen Häppchen
    var queue = [
      ['reveal', initReveal], ['status', initOpenStatus], ['statement', initStatement], ['ritual', initRitual],
      ['prices', initPrices], ['beard', initBeard], ['gallery', initGallery], ['booking', initBooking], ['deeplinks', initDeepLinks]
    ];
    var run = function () {
      var job = queue.shift();
      if (!job) return;
      safe(job[0], job[1]);
      nextTask(run);
    };
    nextTask(run);
    if (hasGSAP && document.fonts && document.fonts.ready) {
      // ScrollTrigger aktualisiert sich bei DOMContentLoaded/load selbst; nur nachziehen, wenn Schriften später fertig werden
      document.fonts.ready.then(function () { if (document.readyState === 'complete') ScrollTrigger.refresh(); });
    }
  }
  // Eigener Task statt direkt im Block der defer-Skripte (GSAP/ScrollTrigger/Lenis laufen dort schon am Stück)
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else nextTask(start);
})();
