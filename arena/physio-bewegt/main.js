/* bewegt. Physiotherapie – Modell „Achse“
   Start in Etappen: Header, Menü und Hero sofort; alles darunter über eine Warteschlange in kleinen Häppchen. */
(function () {
  'use strict';

  /* ===== Rechner-Werte (Beispielwerte, vor dem Livegang prüfen) =====
     kasse  = Vergütung je Behandlung durch die gesetzliche Kasse (gerundeter Beispielwert in €)
     selbst = Preis je Behandlung für Selbstzahler:innen in dieser Praxis (Beispiel in €) */
  var PREISE = {
    kg:  { name: 'Krankengymnastik', kasse: 31.60, selbst: 36.00 },
    mt:  { name: 'Manuelle Therapie', kasse: 37.90, selbst: 44.00 },
    mld: { name: 'Manuelle Lymphdrainage 45 Min.', kasse: 54.30, selbst: 62.00 },
    kgg: { name: 'KG am Gerät', kasse: 58.90, selbst: 55.00 }
  };
  var ZUZAHLUNG_PAUSCHALE = 10;   // € je Verordnung (gesetzliche Zuzahlung)
  var ZUZAHLUNG_ANTEIL = 0.10;    // 10 % der Behandlungskosten

  var doc = document, root = doc.documentElement;
  var MOTION_OFF = root.classList.contains('motion-off');
  var REDUCED = MOTION_OFF || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var FINE = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var EUR = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
  var lenis = null;

  /* ---------- Header: Schatten + Scroll-Fortschritt ---------- */
  var hdr = $('.hdr'), bar = $('.hdr__progress i'), ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var y = window.scrollY, max = root.scrollHeight - innerHeight;
      hdr.classList.toggle('is-scrolled', y > 8);
      bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0).toFixed(4) + ')';
    });
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- Mobiles Menü (Fokusführung, Escape) ---------- */
  (function () {
    var btn = $('.menu-btn'), menu = $('#menu'), last = null;
    function focusables() { return $$('a, button', menu); }
    function open() {
      last = doc.activeElement; menu.hidden = false; menu.classList.add('is-pre');
      requestAnimationFrame(function () { requestAnimationFrame(function () { menu.classList.remove('is-pre'); }); });
      btn.setAttribute('aria-expanded', 'true'); btn.querySelector('.sr').textContent = 'Menü schließen';
      doc.body.style.overflow = 'hidden'; if (lenis) lenis.stop();
      focusables()[0].focus();
    }
    function close(noFocus) {
      menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); btn.querySelector('.sr').textContent = 'Menü öffnen';
      doc.body.style.overflow = ''; if (lenis) lenis.start();
      if (!noFocus && last) last.focus();
    }
    btn.addEventListener('click', function () { menu.hidden ? open() : close(); });
    $('.menu__close').addEventListener('click', function () { close(); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) close(true); });
    doc.addEventListener('keydown', function (e) {
      if (menu.hidden) return;
      if (e.key === 'Escape') { close(); return; }
      if (e.key === 'Tab') {
        var f = focusables(), first = f[0], lst = f[f.length - 1];
        if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); lst.focus(); }
        else if (!e.shiftKey && doc.activeElement === lst) { e.preventDefault(); first.focus(); }
      }
    });
    addEventListener('resize', function () { if (!menu.hidden && innerWidth > 1180) close(true); });
  })();

  /* ---------- Hero: Linien-Figur mit Bewegungsbogen ---------- */
  function arcPath(K, A, H, r) {
    var u = [A[0] - K[0], A[1] - K[1]], v = [H[0] - K[0], H[1] - K[1]];
    var lu = Math.hypot(u[0], u[1]), lv = Math.hypot(v[0], v[1]);
    var s = [K[0] + u[0] / lu * r, K[1] + u[1] / lu * r], e = [K[0] + v[0] / lv * r, K[1] + v[1] / lv * r];
    var sweep = (u[0] * v[1] - u[1] * v[0]) > 0 ? 1 : 0, f = Figur.f;
    return 'M' + f(K[0]) + ' ' + f(K[1]) + 'L' + f(s[0]) + ' ' + f(s[1]) + 'A' + r + ' ' + r + ' 0 0 ' + sweep + ' ' + f(e[0]) + ' ' + f(e[1]) + 'Z';
  }
  function trailPath(arr) {
    if (arr.length < 2) return '';
    var f = Figur.f, d = 'M' + f(arr[0][0]) + ' ' + f(arr[0][1]);
    for (var i = 1; i < arr.length; i++) d += 'L' + f(arr[i][0]) + ' ' + f(arr[i][1]);
    return d;
  }

  (function hero() {
    var svg = $('.hero .stage'); if (!svg || !window.Figur) return;
    var fig = Figur.bind($('.fig--hero', svg)), seq = Figur.SEQ.hero, dur = Figur.duration('hero');
    var trail = $('.stage__trail', svg), ktrail = $('.stage__trail--knee', svg), arc = $('.stage__arc', svg), deg = $('.stage__deg', svg);
    // gestrichelte Soll-Bahn des Handgelenks (einmal berechnet)
    var ghost = [];
    for (var i = 0; i <= 60; i++) ghost.push(Figur.solve(Figur.sample(seq, 2.1 * i / 60)).AF.W);
    $('.stage__ghost', svg).setAttribute('d', trailPath(ghost));

    var pts = [], kpts = [], lastDeg = -1, t0 = performance.now(), raf = 0, visible = true, last = 0;
    var m = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0 };

    function render(s, live) {
      var p = Figur.sample(seq, s);
      p.tb += m.x * 5; p.hx += m.x * 6; p.nk += m.x * 10 - m.y * 8; p.aF -= m.y * 16; p.aB -= m.y * 13;
      var q = Figur.draw(fig, p), S = q.s;
      if (live) {
        pts.push(S.AF.W); if (pts.length > 46) pts.shift();
        kpts.push(S.F.K); if (kpts.length > 30) kpts.shift();
        trail.setAttribute('d', trailPath(pts)); ktrail.setAttribute('d', trailPath(kpts));
      }
      arc.setAttribute('d', arcPath(S.F.K, S.F.A, S.H, 26));
      var a = Math.round(Figur.angle(S.F.K, S.F.A, S.H));
      if (a !== lastDeg) { deg.textContent = a + '°'; lastDeg = a; }
    }
    function frame(now) {
      raf = 0;
      var dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
      // Feder für die Maus (weich, ohne Nachwippen)
      var k = 60, c = 15;
      m.vx += ((m.tx - m.x) * k - m.vx * c) * dt; m.vy += ((m.ty - m.y) * k - m.vy * c) * dt;
      m.x += m.vx * dt; m.y += m.vy * dt;
      render((now - t0) / 1000, true);
      if (visible && !doc.hidden) raf = requestAnimationFrame(frame);
    }
    function play() { if (!raf && visible && !doc.hidden) { last = 0; raf = requestAnimationFrame(frame); } }
    function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; }

    if (REDUCED) {
      render(1.95, false);
      trail.setAttribute('d', trailPath(ghost));
      return;
    }
    render(0, false); play();
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; visible ? play() : stop(); }).observe(svg);
    doc.addEventListener('visibilitychange', function () { doc.hidden ? stop() : play(); });
    if (FINE) addEventListener('pointermove', function (e) {
      if (!visible) return;
      var r = svg.getBoundingClientRect();
      m.tx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width * 0.9)));
      m.ty = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height * 0.7)));
    }, { passive: true });
  })();

  /* ---------- Warteschlange für alles unterhalb des ersten Bildschirms ---------- */
  var queue = [];
  function later(fn) { queue.push(fn); }
  function pump() {
    var t = performance.now();
    while (queue.length && performance.now() - t < 14) {
      var r = null;
      try { r = queue.shift()(); } catch (err) { console.warn(err); }
      if (r && r.then) { r.then(function () { setTimeout(pump, 16); }); return; }
    }
    if (queue.length) setTimeout(pump, 16);
    else if (window.ScrollTrigger) ScrollTrigger.refresh();
  }

  /* ---------- Lenis + GSAP (erst nach dem ersten Bild nachgeladen) ---------- */
  var VENDOR = '/arena/physio-bewegt/assets/vendor/';
  function load(src) {
    return new Promise(function (res) { var s = doc.createElement('script'); s.src = VENDOR + src; s.onload = s.onerror = res; doc.head.appendChild(s); });
  }
  later(function () { return load('gsap.min.js').then(function () { return Promise.all([load('ScrollTrigger.min.js'), REDUCED ? null : load('lenis.min.js')]); }); });
  later(function () {
    if (!window.gsap) return;
    gsap.registerPlugin(ScrollTrigger);
    if (!REDUCED && window.Lenis) {
      lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 1 });
      window.__lenis = lenis;
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    }
  });

  /* Anker-Links: sanft scrollen, Fokus mitnehmen */
  later(function () {
    doc.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#"]'); if (!a) return;
      var id = a.getAttribute('href'); if (id.length < 2) return;
      var t = doc.getElementById(id.slice(1)); if (!t) return;
      e.preventDefault();
      var off = -(hdr.offsetHeight + 8);
      if (lenis) lenis.scrollTo(t, { offset: off, duration: 1.1 });
      else window.scrollTo({ top: t.getBoundingClientRect().top + scrollY + off, behavior: REDUCED ? 'auto' : 'smooth' });
      if (!t.hasAttribute('tabindex')) t.setAttribute('tabindex', '-1');
      t.focus({ preventScroll: true });
      if (history.replaceState) history.replaceState(null, '', id);
    });
  });

  /* ---------- Reveals (nur Elemente unterhalb des Viewports) ---------- */
  later(function () {
    if (MOTION_OFF) return;
    var els = $$('.sec__head, .tabs, .kk__map, .kk__panel, .ablauf__head, .player, .calc, .pg, .stats, .team__h, .team, .quotes, .map, .so__info, .faq__list, .form');
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('is-in'); io.unobserve(x.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (el, i) {
      if (el.getBoundingClientRect().top < innerHeight) return;
      el.setAttribute('data-reveal', '');
      if (el.classList.contains('pg')) el.style.transitionDelay = (i % 3) * 60 + 'ms';
      io.observe(el);
    });
  });

  /* ---------- Tabs (Pfeiltasten, Home/End) ---------- */
  function tabs(list, onChange) {
    var btns = $$('[role="tab"]', list);
    function select(b, focus) {
      btns.forEach(function (x) {
        var on = x === b; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1;
        var p = doc.getElementById(x.getAttribute('aria-controls')); if (p) p.hidden = !on;
      });
      if (focus) b.focus();
      if (onChange) onChange(b);
    }
    list.addEventListener('click', function (e) { var b = e.target.closest('[role="tab"]'); if (b) select(b); });
    list.addEventListener('keydown', function (e) {
      var i = btns.indexOf(doc.activeElement); if (i < 0) return;
      var n = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: btns.length - 1 }[e.key];
      if (n === undefined) return;
      e.preventDefault(); select(btns[(n + btns.length) % btns.length], true);
    });
    var cur = btns.filter(function (b) { return b.getAttribute('aria-selected') === 'true'; })[0] || btns[0];
    select(cur);
    return { select: select, btns: btns };
  }

  var therapyTabs = null;
  later(function () {
    var list = $('.therapien .tabs__list'), ind = $('.tabs__ind', list), first = true;
    function place(b) { ind.style.transform = 'translateX(' + b.offsetLeft + 'px) scaleX(' + (b.offsetWidth / 100).toFixed(3) + ')'; }
    therapyTabs = tabs(list, function (b) {
      place(b);
      var p = doc.getElementById(b.getAttribute('aria-controls'));
      if (!first && !REDUCED) { p.classList.remove('is-enter'); void p.offsetWidth; p.classList.add('is-enter'); }
      if (!first && list.scrollWidth > list.clientWidth) b.scrollIntoView({ block: 'nearest', inline: 'center', behavior: REDUCED ? 'auto' : 'smooth' });
      first = false;
    });
    var reset = function () { place($('[aria-selected="true"]', list)); };
    addEventListener('resize', reset); if (doc.fonts) doc.fonts.ready.then(reset);
  });

  /* ---------- Körperkarte ---------- */
  var REGIONEN = {
    kiefer: { name: 'Kiefer & Kopf', ursachen: ['Zähnepressen oder Knirschen, oft nachts', 'Fehlhaltung von Kopf und Nacken', 'Spannungskopfschmerz bei Stress'], th: ['mt', 'kg'], ue: 'Zunge an den Gaumen', an: 'Zungenspitze hinter die oberen Schneidezähne legen, Zähne leicht auseinander, Lippen locker. 30 Sekunden ruhig durch die Nase atmen, mehrmals täglich.' },
    schulter: { name: 'Schulter', ursachen: ['Überlastung bei Arbeit über Kopf', 'Enge unter dem Schulterdach (Impingement)', 'Nach Sturz oder Operation'], th: ['kg', 'mt', 'geraet'], ue: 'Pendeln im Stand', an: 'Mit der gesunden Hand an einem Tisch abstützen, den betroffenen Arm locker hängen lassen und kleine Kreise pendeln. 30 Sekunden, dann Richtung wechseln.' },
    ellenbogen: { name: 'Ellenbogen', ursachen: ['Tennis- oder Golferellenbogen durch wiederholtes Greifen', 'Lange Arbeit mit Maus und Tastatur', 'Überlastung beim Sport'], th: ['mt', 'kg'], ue: 'Unterarm-Dehnung', an: 'Arm gestreckt nach vorn, Handfläche nach unten. Mit der anderen Hand die Finger sanft zu sich ziehen, 20 Sekunden halten, 3-mal.' },
    hand: { name: 'Handgelenk', ursachen: ['Sehnenscheiden-Reizung', 'Nach einem Bruch und Gips', 'Arthrose am Daumensattelgelenk'], th: ['mt', 'kg', 'mld'], ue: 'Handgelenk kreisen', an: 'Ellenbogen am Körper, Fäuste locker. Langsam 10-mal in jede Richtung kreisen, danach die Finger weit öffnen und schließen.' },
    huefte: { name: 'Hüfte & Leiste', ursachen: ['Arthrose des Hüftgelenks', 'Verkürzter Hüftbeuger durch viel Sitzen', 'Nach Hüft-Endoprothese'], th: ['kg', 'geraet', 'mt'], ue: 'Hüftbeuger-Dehnung im Kniestand', an: 'Ein Knie auf einem Kissen, das andere Bein vorn aufgestellt. Becken leicht nach vorn schieben, bis es vorn in der Leiste zieht. 30 Sekunden pro Seite.' },
    knie: { name: 'Knie', ursachen: ['Arthrose oder Knorpelschaden', 'Reizung der Kniescheibe bei Läufer:innen', 'Nach Meniskus- oder Kreuzband-OP'], th: ['kg', 'geraet', 'sport'], ue: 'Aufstehen vom Stuhl', an: 'Vorn auf der Stuhlkante sitzen, ohne Hände aufstehen und langsam wieder hinsetzen. 10-mal, Knie zeigen dabei in Richtung der Füße.' },
    fuss: { name: 'Sprunggelenk & Fuß', ursachen: ['Umknicken mit Bänderverletzung', 'Fersensporn oder gereizte Fußsohle', 'Schwellung nach Operation'], th: ['kg', 'mld', 'sport'], ue: 'Fersenheben', an: 'Hüftbreit stehen, leicht an einer Lehne abstützen. Auf die Zehenballen hochdrücken, kurz halten, langsam absenken. 12-mal.' },
    nacken: { name: 'Nacken', ursachen: ['Lange Bildschirmarbeit mit vorgeschobenem Kopf', 'Verspannung durch Stress und flache Atmung', 'Verschleiß der Halswirbelsäule'], th: ['mt', 'kg'], ue: 'Kinn-Nicken im Sitzen', an: 'Aufrecht sitzen, das Kinn sanft nach hinten schieben, als wollten Sie ein Doppelkinn machen. 5 Sekunden halten, 8-mal wiederholen.' },
    bws: { name: 'Oberer Rücken', ursachen: ['Rundrücken durch Sitzen', 'Blockierte Rippengelenke', 'Schwache Muskulatur zwischen den Schulterblättern'], th: ['mt', 'kg', 'geraet'], ue: 'Arme heben im Stand', an: 'Aufrecht stehen und die gestreckten Arme langsam vor dem Körper nach oben führen, dabei einatmen. Beim Senken ausatmen. 10-mal.' },
    lws: { name: 'Unterer Rücken', ursachen: ['Bewegungsmangel und langes Sitzen', 'Verspannte Rückenstrecker', 'Bandscheibenvorfall (ärztlich abklären)'], th: ['kg', 'geraet', 'mt'], ue: 'Katze und Kuh', an: 'Im Vierfüßlerstand den Rücken langsam rund machen, dann sanft ins leichte Hohlkreuz. Im Atemrhythmus 10-mal, ohne Schmerz.' },
    isg: { name: 'Gesäß & Iliosakralgelenk', ursachen: ['Einseitige Belastung, z. B. Tragen eines Kindes', 'Schwache Gesäßmuskulatur', 'Nach Schwangerschaft'], th: ['mt', 'kg'], ue: 'Becken heben (Brücke)', an: 'Auf dem Rücken liegen, Füße aufgestellt. Becken anheben, bis Knie, Hüfte und Schultern eine Linie bilden. 3 Sekunden halten, 10-mal.' },
    hamstring: { name: 'Oberschenkel-Rückseite', ursachen: ['Zerrung beim Sprint oder Fußball', 'Verkürzung durch viel Sitzen', 'Ausstrahlung aus dem Rücken'], th: ['sport', 'kg'], ue: 'Dehnung auf der Stuhlkante', an: 'Ein Bein gestreckt nach vorn, Ferse am Boden. Mit geradem Rücken nach vorn neigen, bis es hinten im Oberschenkel zieht. 30 Sekunden.' },
    wade: { name: 'Wade & Achillessehne', ursachen: ['Plötzlich gesteigertes Lauftraining', 'Reizung der Achillessehne', 'Wadenkrämpfe bei Überlastung'], th: ['sport', 'kg', 'mld'], ue: 'Wadendehnung an der Wand', an: 'Hände an die Wand, ein Bein nach hinten, Ferse bleibt am Boden. Hinteres Knie gestreckt, 30 Sekunden halten, dann mit gebeugtem Knie wiederholen.' }
  };
  var TH_NAMEN = { kg: 'Krankengymnastik', mt: 'Manuelle Therapie', mld: 'Lymphdrainage', sport: 'Sportphysio', geraet: 'KG am Gerät' };

  later(function () {
    var body = $('.body'), panel = $('.kk__panel'), seg = $('.seg'); if (!body) return;
    var groups = { front: $('[data-side="front"]', body), back: $('[data-side="back"]', body) };
    var view = 'front', first = true;
    function fill(id) {
      var d = REGIONEN[id];
      $('[data-k="name"]', panel).textContent = d.name;
      var ul = $('[data-k="ursachen"]', panel); ul.textContent = '';
      d.ursachen.forEach(function (u) { var li = doc.createElement('li'); li.textContent = u; ul.appendChild(li); });
      var tg = $('[data-k="therapien"]', panel); tg.textContent = '';
      d.th.forEach(function (t) { var li = doc.createElement('li'), a = doc.createElement('a'); a.href = '#therapien'; a.setAttribute('data-tab', t); a.textContent = TH_NAMEN[t]; li.appendChild(a); tg.appendChild(li); });
      $('[data-k="uebung"]', panel).textContent = d.ue;
      $('[data-k="anleitung"]', panel).textContent = d.an;
      if (!first && !REDUCED) { panel.classList.remove('is-swap'); void panel.offsetWidth; panel.classList.add('is-swap'); }
      first = false;
    }
    function choose(g, focus) {
      $$('.rg', groups[view]).forEach(function (x) { var on = x === g; x.setAttribute('aria-checked', on); x.tabIndex = on ? 0 : -1; });
      if (focus) g.focus();
      fill(g.getAttribute('data-r'));
    }
    function setView(v) {
      if (v === view) return;
      var swap = function () {
        groups[view].hidden = true; view = v; groups[v].hidden = false;
        body.setAttribute('data-view', v); seg.setAttribute('data-v', v);
        var sel = $('.rg[aria-checked="true"]', groups[v]) || $('.rg', groups[v]);
        choose(sel);
      };
      $$('.seg__b', seg).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-view') === v); });
      if (REDUCED) { swap(); return; }
      body.classList.add('is-flip'); setTimeout(function () { swap(); body.classList.remove('is-flip'); }, 180);
    }
    seg.addEventListener('click', function (e) { var b = e.target.closest('.seg__b'); if (b) setView(b.getAttribute('data-view')); });
    body.addEventListener('click', function (e) { var g = e.target.closest('.rg'); if (g) choose(g); });
    body.addEventListener('keydown', function (e) {
      var g = e.target.closest('.rg'); if (!g) return;
      var all = $$('.rg', groups[view]), i = all.indexOf(g);
      var n = { ArrowDown: i + 1, ArrowRight: i + 1, ArrowUp: i - 1, ArrowLeft: i - 1, Home: 0, End: all.length - 1 }[e.key];
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); choose(g); return; }
      if (n === undefined) return;
      e.preventDefault(); choose(all[(n + all.length) % all.length], true);
    });
    panel.addEventListener('click', function (e) {
      var a = e.target.closest('[data-tab]'); if (!a || !therapyTabs) return;
      var b = doc.getElementById('tab-' + a.getAttribute('data-tab')); if (b) therapyTabs.select(b);
    });
    choose($('.rg[data-r="knie"]', body));
  });

  /* ---------- Ablauf: horizontale Strecke per sticky + Scrub (Desktop) ---------- */
  later(function () {
    if (!window.gsap || REDUCED) return;
    var sec = $('.ablauf'), view = $('.ablauf__view'), path = $('.ablauf__path');
    var mm = gsap.matchMedia();
    mm.add('(min-width: 900px)', function () {
      sec.classList.add('is-h');
      var dist = function () { return Math.max(0, view.scrollWidth - innerWidth + 64); };
      var setH = function () { sec.style.height = (innerHeight + dist()) + 'px'; };
      setH(); ScrollTrigger.addEventListener('refreshInit', setH);
      var tl = gsap.timeline({ scrollTrigger: { trigger: sec, start: 'top top', end: function () { return '+=' + dist(); }, scrub: 0.6, invalidateOnRefresh: true } });
      tl.fromTo(view, { x: 0 }, { x: function () { return -dist(); }, ease: 'none' }, 0)
        .fromTo(path, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', ease: 'none' }, 0);
      return function () { ScrollTrigger.removeEventListener('refreshInit', setH); sec.classList.remove('is-h'); sec.style.height = ''; gsap.set([view, path], { clearProps: 'all' }); };
    });
  });

  /* ---------- Praxis: leichte Parallaxe der Bilder ---------- */
  later(function () {
    if (!window.gsap || REDUCED) return;
    $$('.pg img').forEach(function (img, i) {
      gsap.fromTo(img, { yPercent: -4, scale: 1.08 }, { yPercent: 4, scale: 1.08, ease: 'none', scrollTrigger: { trigger: img.parentNode, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  });

  /* ---------- Übungs-Player ---------- */
  var PHASEN = {
    stuhl: [[0.9, 'Nach vorn neigen', 1], [2.2, 'Aufstehen', 2], [3.2, 'Stehen', 2], [6.0, 'Langsam setzen', 3], [7.0, 'Sitzen', 0]],
    ferse: [[1.5, 'Hochdrücken', 1], [2.5, 'Halten', 2], [4.5, 'Absenken', 3], [5.0, 'Pause', 0]],
    arme: [[2.5, 'Heben · einatmen', 1], [3.5, 'Halten', 2], [6.0, 'Senken · ausatmen', 3], [6.6, 'Pause', 0]]
  };
  later(function () {
    var el = $('[data-player]'); if (!el || !window.Figur) return;
    var svg = $('.stage', el), fig = Figur.bind($('.fig--player', svg)), trail = $('.stage__trail', svg);
    var ring = $('.ring__v', el), phaseEl = $('.player__phase', el), cnt = $('[data-count]', el), goalEls = $$('[data-goal], [data-goal-v]', el);
    var go = $('[data-go]', el), goL = $('[data-go-l]', el), live = $('[data-live]', el);
    var st = { ex: 'stuhl', t: 0, reps: 0, goal: 10, run: false, raf: 0, last: 0, pts: [], phase: -1 };

    function phaseAt(t) { var ph = PHASEN[st.ex]; for (var i = 0; i < ph.length; i++) if (t <= ph[i][0]) return ph[i]; return ph[ph.length - 1]; }
    function steps() { return $$('#ep-' + st.ex + ' .ep__steps li'); }
    function render(trace) {
      var q = Figur.draw(fig, Figur.sample(Figur.SEQ[st.ex], st.t));
      if (trace) { st.pts.push(q.s.AF.W); if (st.pts.length > 40) st.pts.shift(); trail.setAttribute('d', trailPath(st.pts)); }
      ring.style.strokeDashoffset = (100 - 100 * st.t / Figur.duration(st.ex)).toFixed(2);
      var ph = phaseAt(st.t);
      if (st.run && ph !== st.phase) { st.phase = ph; phaseEl.textContent = ph[1]; steps().forEach(function (li, i) { li.classList.toggle('is-now', i === ph[2]); }); }
    }
    function tick(now) {
      st.raf = 0;
      var dt = Math.min(0.1, (now - (st.last || now)) / 1000); st.last = now;
      st.t += dt;
      var dur = Figur.duration(st.ex);
      if (st.t >= dur) {
        st.t -= dur; st.reps++;
        cnt.textContent = st.reps; if (!REDUCED) { cnt.classList.remove('is-bump'); void cnt.offsetWidth; cnt.classList.add('is-bump'); }
        live.textContent = 'Wiederholung ' + st.reps + ' von ' + st.goal;
        if (st.reps >= st.goal) { st.t = 0; render(false); stop('Geschafft!'); live.textContent = 'Geschafft: ' + st.goal + ' Wiederholungen.'; return; }
      }
      render(!REDUCED);
      if (st.run) st.raf = requestAnimationFrame(tick);
    }
    function start() {
      if (st.reps >= st.goal) reset();
      st.run = true; st.last = 0; st.phase = -1; go.setAttribute('aria-pressed', 'true'); goL.textContent = 'Pause';
      st.raf = requestAnimationFrame(tick);
    }
    function stop(label) {
      st.run = false; if (st.raf) cancelAnimationFrame(st.raf); st.raf = 0;
      go.setAttribute('aria-pressed', 'false'); goL.textContent = st.reps >= st.goal ? 'Nochmal' : (st.t > 0 || st.reps ? 'Weiter' : 'Start');
      phaseEl.textContent = label || 'Pausiert';
    }
    function reset() {
      stop('Bereit'); st.t = 0; st.reps = 0; st.pts = []; trail.setAttribute('d', ''); cnt.textContent = '0'; goL.textContent = 'Start';
      steps().forEach(function (li) { li.classList.remove('is-now'); }); render(false);
    }
    go.addEventListener('click', function () { st.run ? stop() : start(); });
    $('[data-reset]', el).addEventListener('click', reset);
    $$('[data-step]', el).forEach(function (b) {
      b.addEventListener('click', function () {
        st.goal = Math.max(3, Math.min(20, st.goal + +b.getAttribute('data-step')));
        goalEls.forEach(function (g) { g.textContent = st.goal; });
        if (st.reps >= st.goal && st.run) stop('Geschafft!');
      });
    });
    doc.addEventListener('visibilitychange', function () { if (doc.hidden && st.run) stop(); });
    tabs($('.player__pick', el), function (b) {
      var ex = b.getAttribute('data-ex'); if (ex === st.ex && st.t === 0 && !st.reps) { render(false); return; }
      st.ex = ex;
      $$('.prop', svg).forEach(function (p) { p.hidden = p.getAttribute('data-prop') !== ex; });
      reset();
    });
    render(false);
  });

  /* ---------- Rezept-Rechner ---------- */
  later(function () {
    var f = $('#calc'); if (!f) return;
    var n = $('#c-n'), v = $('#c-v'), frei = $('#c-frei');
    var o = function (k) { return $('[data-o="' + k + '"]', f); }, b = function (k) { return $('[data-b="' + k + '"]', f); };
    function fillRange(r) { r.style.setProperty('--fill', ((r.value - r.min) / (r.max - r.min) * 100) + '%'); }
    function calc() {
      var hm = PREISE[f.querySelector('input[name="hm"]:checked').value], cn = +n.value, cv = +v.value;
      $('#c-n-o').textContent = cn; $('#c-v-o').textContent = cv; fillRange(n); fillRange(v);
      var kosten = hm.kasse * cn * cv;
      var kasse = frei.checked ? 0 : ZUZAHLUNG_PAUSCHALE * cv + ZUZAHLUNG_ANTEIL * kosten;
      var selbst = hm.selbst * cn * cv, max = Math.max(kasse, selbst, 1);
      o('kasse').textContent = EUR.format(kasse);
      o('selbst').textContent = EUR.format(selbst);
      o('kdet').textContent = frei.checked ? 'Zuzahlungsbefreit – die Kasse übernimmt die vollen ' + EUR.format(kosten) + '.'
        : (cv > 1 ? cv + ' × ' : '') + EUR.format(ZUZAHLUNG_PAUSCHALE) + ' Pauschale + 10 % von ' + EUR.format(kosten);
      o('sdet').textContent = (cn * cv) + ' × ' + EUR.format(hm.selbst) + ' ' + hm.name;
      b('kasse').style.transform = 'scaleX(' + Math.max(0.015, kasse / max).toFixed(3) + ')';
      b('selbst').style.transform = 'scaleX(' + Math.max(0.015, selbst / max).toFixed(3) + ')';
    }
    f.addEventListener('input', calc); f.addEventListener('change', calc);
    f.addEventListener('submit', function (e) { e.preventDefault(); });
    calc();
  });

  /* ---------- Zahlen hochzählen ---------- */
  later(function () {
    if (REDUCED) return;
    var els = $$('[data-count-to]');
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) {
        if (!x.isIntersecting) return; io.unobserve(x.target);
        var el = x.target, to = +el.getAttribute('data-count-to'), t0 = performance.now(), D = 900;
        (function step(now) {
          var p = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(to * e); if (p < 1) requestAnimationFrame(step);
        })(t0);
      });
    }, { threshold: 0.6 });
    els.forEach(function (el) { if (el.getBoundingClientRect().top > innerHeight) io.observe(el); });
  });

  /* ---------- Aktiver Navigationspunkt ---------- */
  later(function () {
    var links = $$('.nav a'), map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) { var a = map[x.target.id]; if (a && x.isIntersecting) { links.forEach(function (l) { l.classList.toggle('is-active', l === a); }); } });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { var s = doc.getElementById(id); if (s) io.observe(s); });
  });

  /* ---------- Termin-Formular ---------- */
  later(function () {
    var form = $('#form'), done = $('#done'); if (!form) return;
    function err(id, msg) {
      var inp = doc.getElementById(id), e = doc.getElementById('e-' + id.slice(2));
      e.textContent = msg || ''; if (msg) inp.setAttribute('aria-invalid', 'true'); else inp.removeAttribute('aria-invalid');
      return !msg;
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.elements['name'].value.trim(), tel = form.tel.value.trim(), mail = form.mail.value.trim();
      var ok = [
        err('f-name', name.length < 2 ? 'Bitte geben Sie Ihren Namen an.' : ''),
        err('f-tel', !tel && !mail ? 'Bitte Telefon oder E-Mail angeben, damit wir Sie erreichen.' : (tel && !/^[+()\d\s\/-]{6,}$/.test(tel) ? 'Bitte prüfen Sie die Telefonnummer.' : '')),
        err('f-mail', mail && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail) ? 'Bitte prüfen Sie die E-Mail-Adresse.' : ''),
        err('f-th', !form.anliegen.value ? 'Bitte wählen Sie ein Anliegen.' : ''),
        err('f-ok', !form.ok.checked ? 'Bitte stimmen Sie der Nutzung Ihrer Angaben zu.' : '')
      ];
      if (ok.indexOf(false) > -1) { var bad = $('[aria-invalid="true"]', form); if (bad) bad.focus(); return; }
      var zeiten = $$('input[name="zeit"]:checked', form).map(function (c) { return c.value; });
      var rows = [['Name', name], ['Kontakt', [tel, mail].filter(Boolean).join(' · ')], ['Anliegen', form.anliegen.value],
        ['Rezept', form.querySelector('input[name="rezept"]:checked').value], ['Wunschzeit', zeiten.join(', ') || 'flexibel']];
      if (form.msg.value.trim()) rows.push(['Nachricht', form.msg.value.trim()]);
      var dl = $('[data-sum]', done); dl.textContent = '';
      rows.forEach(function (r) { var d = doc.createElement('div'), dt = doc.createElement('dt'), dd = doc.createElement('dd'); dt.textContent = r[0]; dd.textContent = r[1]; d.appendChild(dt); d.appendChild(dd); dl.appendChild(d); });
      form.hidden = true; done.hidden = false; done.classList.add('is-in'); done.focus({ preventScroll: false });
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    });
    form.addEventListener('input', function (e) { if (e.target.getAttribute('aria-invalid')) { e.target.removeAttribute('aria-invalid'); var m = doc.getElementById('e-' + e.target.id.slice(2)); if (m) m.textContent = ''; } });
    $('[data-again]', done).addEventListener('click', function () { form.reset(); done.hidden = true; form.hidden = false; form.elements['name'].focus(); if (window.ScrollTrigger) ScrollTrigger.refresh(); });
  });

  // Warteschlange erst nach dem ersten Bild anstoßen
  var started = false;
  var kick = function () { if (started) return; started = true; setTimeout(pump, 30); };
  if (doc.readyState === 'complete') kick(); else addEventListener('load', kick, { once: true });
  setTimeout(kick, 1200);
})();
