/* bewegt. Physiotherapie – Modell „Achse“
   Start in Etappen: Header, Menü und Hero sofort; alles darunter über eine Warteschlange in kleinen Häppchen.
   Motion-System „Tempo 2-1-3“ (Kurven/Dauern als CSS-Variablen in style.css): heben konzentrisch, senken exzentrisch. */
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
  var WAAGE_MAX_GRAD = 14;        // maximale Neigung der Waage im Rechner

  var doc = document, root = doc.documentElement;
  var MOTION_OFF = root.classList.contains('motion-off');
  var REDUCED = MOTION_OFF || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var FINE = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var EUR = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
  var lenis = null;
  function easeIO(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function poly(arr) {
    if (arr.length < 2) return '';
    var f = Figur.f, d = 'M' + f(arr[0][0]) + ' ' + f(arr[0][1]);
    for (var i = 1; i < arr.length; i++) d += 'L' + f(arr[i][0]) + ' ' + f(arr[i][1]);
    return d;
  }

  /* ---------- Header-Schatten + Achse (Scroll-Fortschritt) ---------- */
  var hdr = $('.hdr'), axisFill = $('.axis__line i'), ticking = false, scrollHooks = [];
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var y = window.scrollY, max = root.scrollHeight - innerHeight;
      hdr.classList.toggle('is-scrolled', y > 8);
      if (axisFill) axisFill.style.transform = 'scaleY(' + (max > 0 ? Math.min(1, y / max) : 0).toFixed(4) + ')';
      for (var i = 0; i < scrollHooks.length; i++) scrollHooks[i](y);
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
    addEventListener('resize', function () { if (!menu.hidden && innerWidth > 1199) close(true); });
  })();

  /* ---------- Hero: Treppenstufe mit Live-Messung ---------- */
  function arcPath(K, A, H, r) {
    var u = [A[0] - K[0], A[1] - K[1]], v = [H[0] - K[0], H[1] - K[1]];
    var lu = Math.hypot(u[0], u[1]), lv = Math.hypot(v[0], v[1]);
    var s = [K[0] + u[0] / lu * r, K[1] + u[1] / lu * r], e = [K[0] + v[0] / lv * r, K[1] + v[1] / lv * r];
    var sweep = (u[0] * v[1] - u[1] * v[0]) > 0 ? 1 : 0, f = Figur.f;
    return 'M' + f(K[0]) + ' ' + f(K[1]) + 'L' + f(s[0]) + ' ' + f(s[1]) + 'A' + r + ' ' + r + ' 0 0 ' + sweep + ' ' + f(e[0]) + ' ' + f(e[1]) + 'Z';
  }

  (function hero() {
    var svg = $('.lab'); if (!svg || !window.Figur) return;
    var f = Figur.f, fig = Figur.bind($('.fig--hero', svg)), seq = Figur.SEQ.treppe;
    var trail = $('.lab__trail', svg), arc = $('.lab__arc', svg), plumb = $('.lab__plumb', svg);
    var hud = {};
    $$('.hud__r', svg).forEach(function (g) { hud[g.getAttribute('data-hud')] = { lead: $('.hud__lead', g), v: $('.hud__v', g), last: null }; });
    function setV(h, val) { if (h.last !== val) { h.v.textContent = val + '°'; h.last = val; } }
    var pts = [], t0 = performance.now(), raf = 0, visible = true, last = 0;
    var m = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0 };

    function render(s, live) {
      var p = Figur.sample(seq, s);
      p.tb += m.x * 4 - m.y * 3; p.nk += m.x * 10 - m.y * 8; p.aF -= m.y * 22; p.aB -= m.y * 18; p.aF += m.x * 10;
      var q = Figur.draw(fig, p), S = q.s;
      if (live) { pts.push(S.F.K); if (pts.length > 54) pts.shift(); trail.setAttribute('d', poly(pts)); }
      arc.setAttribute('d', arcPath(S.F.K, S.F.A, S.H, 24));
      plumb.setAttribute('d', 'M' + f(S.H[0]) + ' -40V440');
      hud.knee.lead.setAttribute('d', 'M' + f(S.F.K[0] + 8) + ' ' + f(S.F.K[1]) + 'L412 206L430 206');
      hud.hip.lead.setAttribute('d', 'M' + f(S.H[0] - 8) + ' ' + f(S.H[1]) + 'L132 174L118 174');
      hud.trunk.lead.setAttribute('d', 'M' + f(S.S[0] - 8) + ' ' + f(S.S[1]) + 'L176 44L162 44');
      setV(hud.knee, Math.round(Figur.angle(S.F.K, S.F.A, S.H)));
      setV(hud.hip, Math.round(Figur.angle(S.H, S.S, S.F.K)));
      setV(hud.trunk, Math.round(Math.abs(p.tb)));
    }
    function frame(now) {
      raf = 0;
      var dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
      var k = 60, c = 15; // Feder für die Maus: weich, ohne Nachwippen
      m.vx += ((m.tx - m.x) * k - m.vx * c) * dt; m.vy += ((m.ty - m.y) * k - m.vy * c) * dt;
      m.x += m.vx * dt; m.y += m.vy * dt;
      render((now - t0) / 1000, true);
      if (visible && !doc.hidden) raf = requestAnimationFrame(frame);
    }
    function play() { if (!raf && visible && !doc.hidden) { last = 0; raf = requestAnimationFrame(frame); } }
    function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; }

    if (REDUCED) { render(2.9, false); trail.setAttribute('d', $('.lab__ghost', svg).getAttribute('d')); return; }
    render(0, false);
    // Figur erst losgehen lassen, wenn sie sich gezeichnet hat (CSS-Intro ~1 s)
    setTimeout(function () { t0 = performance.now(); play(); }, 900);
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

  /* ---------- Reveals: Überschriften schwenken um ihren Gelenkpunkt („Hebel“), Blöcke heben sich ---------- */
  later(function () {
    if (MOTION_OFF) return;
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) {
        if (!x.isIntersecting) return;
        var el = x.target; io.unobserve(el);
        el.classList.add('is-in'); el.classList.remove('is-pre');
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    function below(el) { return el.getBoundingClientRect().top > innerHeight; }
    $$('[data-lever]').forEach(function (el) { if (below(el)) { el.classList.add('lv'); io.observe(el); } });
    var blocks = '.th__head .sec__lead, .tabs, .kk__head .sec__lead, .kk__map, .kk__panel, .weg__sub, .ue__head .sec__lead, .player, .ko__head .sec__lead, .calc, .pg, .proto, .team__h, .team, .quotes, .map, .so__info, .faq__list, .te__head .sec__lead, .form';
    $$(blocks).forEach(function (el) {
      if (!below(el)) return;
      el.setAttribute('data-reveal', '');
      if (el.classList.contains('pg')) el.style.transitionDelay = ($$('.pg').indexOf(el) * 80) + 'ms';
      io.observe(el);
    });
    $$('.gonio, .map').forEach(function (el) { if (below(el)) { el.classList.add('is-pre'); io.observe(el); } });
  });

  /* ---------- Tabs (Pfeiltasten in beide Richtungen, Home/End) ---------- */
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
      var n = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: btns.length - 1 }[e.key];
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
    function place(b) {
      var vertical = getComputedStyle(list).flexDirection === 'column';
      ind.style.transform = vertical ? 'translateY(' + b.offsetTop + 'px) scaleY(' + (b.offsetHeight / 100).toFixed(3) + ')'
        : 'translateX(' + b.offsetLeft + 'px) scaleX(' + (b.offsetWidth / 100).toFixed(3) + ')';
    }
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
    var body = $('.body'), panel = $('.kk__panel'), seg = $('.seg'), kk = $('.kk'); if (!body) return;
    var wireP = $('.kk__wire path', kk), wireC = $('.kk__wire circle', kk), nameEl = $('[data-k="name"]', panel);
    var groups = { front: $('[data-side="front"]', body), back: $('[data-side="back"]', body) };
    var view = 'front', first = true;
    // Messlinie vom gewählten Punkt bis zur Überschrift im Panel
    function wire(animate) {
      if (innerWidth < 900) return;
      var dot = $('.rg[aria-checked="true"] .rg__dot', groups[view]); if (!dot) return;
      var kr = kk.getBoundingClientRect(), a = dot.getBoundingClientRect();
      var x1 = a.left + a.width / 2 - kr.left, y1 = a.top + a.height / 2 - kr.top;
      var x2 = panel.offsetLeft + nameEl.offsetLeft - 16, y2 = panel.offsetTop + nameEl.offsetTop + nameEl.offsetHeight * 0.55;
      var mx = x1 + (x2 - x1) * 0.5;
      wireP.setAttribute('d', 'M' + x1.toFixed(1) + ' ' + y1.toFixed(1) + 'C' + mx.toFixed(1) + ' ' + y1.toFixed(1) + ' ' + mx.toFixed(1) + ' ' + y2.toFixed(1) + ' ' + x2.toFixed(1) + ' ' + y2.toFixed(1));
      wireC.setAttribute('cx', x2.toFixed(1)); wireC.setAttribute('cy', y2.toFixed(1));
      if (animate && !REDUCED) { wireP.classList.remove('is-on'); void wireP.getBoundingClientRect(); }
      wireP.classList.add('is-on');
    }
    function fill(id) {
      var d = REGIONEN[id];
      nameEl.textContent = d.name;
      var ul = $('[data-k="ursachen"]', panel); ul.textContent = '';
      d.ursachen.forEach(function (u) { var li = doc.createElement('li'); li.textContent = u; ul.appendChild(li); });
      var tg = $('[data-k="therapien"]', panel); tg.textContent = '';
      d.th.forEach(function (t) { var li = doc.createElement('li'), a = doc.createElement('a'); a.href = '#therapien'; a.setAttribute('data-tab', t); a.textContent = TH_NAMEN[t]; li.appendChild(a); tg.appendChild(li); });
      $('[data-k="uebung"]', panel).textContent = d.ue;
      $('[data-k="anleitung"]', panel).textContent = d.an;
      if (!first && !REDUCED) { panel.classList.remove('is-swap'); void panel.offsetWidth; panel.classList.add('is-swap'); }
      wire(!first); first = false;
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
        choose($('.rg[aria-checked="true"]', groups[v]) || $('.rg', groups[v]));
      };
      $$('.seg__b', seg).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-view') === v); });
      if (REDUCED) { swap(); return; }
      // Drehung um die Körperachse: zusammenklappen, Seite wechseln, aufklappen
      body.classList.add('is-flip'); setTimeout(function () { swap(); body.classList.remove('is-flip'); }, 220);
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
    var rt = 0; addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { wire(false); }, 120); });
    if (doc.fonts) doc.fonts.ready.then(function () { wire(false); });
    // erst zeichnen, wenn die Karte in Sicht kommt
    if (!REDUCED) { wireP.classList.remove('is-on'); new IntersectionObserver(function (en, o) { if (en[0].isIntersecting) { o.disconnect(); wire(true); } }, { threshold: 0.4 }).observe(kk); }
  });

  /* ---------- Ihr Weg: Figur läuft die Bewegungskurve ab (sticky + Scrub, Desktop) ---------- */
  later(function () {
    if (!window.gsap || REDUCED || !window.Figur) return;
    var sec = $('.weg'), view = $('.weg__view'), track = $('.weg__track'), live = $('.weg__live'), curve = $('.weg__curve');
    var fig = Figur.bind($('.fig--weg', sec)), W = Figur.WEG, N = W.length - 1;
    var ghosts = $$('.ghost', sec).map(function (g) { return { el: g, at: +g.getAttribute('data-at'), on: false }; });
    var steps = $$('.step', sec);
    var mm = gsap.matchMedia();
    mm.add('(min-width: 900px)', function () {
      sec.classList.add('is-h');
      var D = 0;
      var setH = function () {
        var cs = getComputedStyle(view), avail = view.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
        D = Math.max(0, track.offsetWidth - avail + 24);
        sec.style.height = (innerHeight + D + innerHeight * 0.35) + 'px';
      };
      setH(); ScrollTrigger.addEventListener('refreshInit', setH);
      var st = { p: 0 }, lastS = -1;
      function render() {
        var p = st.p, s = p * N, a = Math.min(N - 1, Math.floor(s)), t = s - a;
        if (Math.abs(s - lastS) < 0.0005) return; lastS = s;
        Figur.draw(fig, Figur.mix(W[a], W[a + 1], easeIO(t)));
        live.setAttribute('transform', 'translate(' + (s * 400).toFixed(1) + ' 0)');
        curve.style.strokeDashoffset = (1 - p).toFixed(4);
        track.style.transform = 'translate3d(' + (-p * D).toFixed(1) + 'px,0,0)';
        for (var i = 0; i < ghosts.length; i++) { var on = ghosts[i].at <= p + 0.002; if (on !== ghosts[i].on) { ghosts[i].on = on; ghosts[i].el.classList.toggle('is-on', on); } }
        for (var j = 0; j < steps.length; j++) steps[j].classList.toggle('is-on', j / N <= p + 0.04);
      }
      var tw = gsap.to(st, { p: 1, ease: 'none', onUpdate: render,
        scrollTrigger: { trigger: sec, start: 'top top', end: function () { return '+=' + (D + innerHeight * 0.35); }, scrub: 0.5, invalidateOnRefresh: true } });
      render();
      return function () {
        tw.scrollTrigger && tw.scrollTrigger.kill(); tw.kill();
        ScrollTrigger.removeEventListener('refreshInit', setH); sec.classList.remove('is-h'); sec.style.height = '';
        track.style.transform = ''; curve.style.strokeDashoffset = '';
      };
    });
  });

  /* ---------- Praxis: Satz baut sich Wort für Wort auf ---------- */
  later(function () {
    var p = $('[data-words]'); if (!p || !window.gsap || REDUCED) return;
    var words = p.textContent.trim().split(/\s+/); p.textContent = '';
    var spans = words.map(function (w, i) { var s = doc.createElement('span'); s.className = 'w'; s.textContent = w; p.appendChild(s); if (i < words.length - 1) p.appendChild(doc.createTextNode(' ')); return s; });
    var tw = gsap.fromTo(spans, { opacity: 0.2 }, { opacity: 1, ease: 'none', stagger: 0.08,
      scrollTrigger: { trigger: p, start: 'top 82%', end: 'bottom 52%', scrub: true } });
    // ohne weiteres Scrollen nach ~2 s vollständig lesbar
    new IntersectionObserver(function (en, o) {
      if (!en[0].isIntersecting) return; o.disconnect();
      setTimeout(function () { if (tw.progress() < 1) { tw.scrollTrigger.kill(); gsap.to(spans, { opacity: 1, duration: 0.5, stagger: 0.012, overwrite: true }); } }, 2200);
    }, { threshold: 0.6 }).observe(p);
  });

  /* ---------- Übungs-Player mit Bewegungsbahnen und Tempo-Leiste ---------- */
  var PHASEN = {
    stuhl: [[0.9, 'Nach vorn neigen', 1], [2.2, 'Aufstehen', 1], [3.2, 'Stehen', 2], [6.0, 'Langsam setzen', 3], [7.0, 'Sitzen', 0]],
    ferse: [[1.5, 'Hochdrücken', 1], [2.5, 'Halten', 2], [4.5, 'Absenken', 3], [5.0, 'Pause', 0]],
    arme: [[2.5, 'Heben · einatmen', 1], [3.5, 'Halten', 2], [6.0, 'Senken · ausatmen', 3], [6.6, 'Pause', 0]]
  };
  // welcher Gelenkwinkel live gemessen wird
  var MESSUNG = {
    stuhl: ['Knie', function (s) { return Figur.angle(s.F.K, s.F.A, s.H); }],
    ferse: ['Sprunggelenk', function (s) { return Figur.angle(s.F.A, s.F.K, s.F.T); }],
    arme: ['Schulter', function (s) { return Figur.angle(s.S, s.H, s.AF.E); }]
  };
  var PHASE_STEP = { stuhl: [1, 2, 2, 3, 0], ferse: [1, 2, 3, 0], arme: [1, 2, 3, 0] };
  later(function () {
    var el = $('[data-player]'); if (!el || !window.Figur) return;
    var svg = $('.stage', el), fig = Figur.bind($('.fig--player', svg)), trail = $('.stage__trail', svg);
    var paths = { w: $('.path--w', svg), k: $('.path--k', svg), h: $('.path--h', svg) };
    var phaseEl = $('.player__phase', el), cnt = $('[data-count]', el), goalEls = $$('[data-goal], [data-goal-v]', el);
    var go = $('[data-go]', el), goL = $('[data-go-l]', el), live = $('[data-live]', el);
    var degK = $('[data-deg-k]', el), degV = $('[data-deg]', el), bar = $('[data-tempo]', el), head = $('.tempo__head', el);
    var st = { ex: 'stuhl', t: 0, reps: 0, goal: 10, run: false, raf: 0, last: 0, pts: [], phase: -1, deg: -1, bw: 0 };

    function phaseIdx(t) { var ph = PHASEN[st.ex]; for (var i = 0; i < ph.length; i++) if (t <= ph[i][0]) return i; return ph.length - 1; }
    function steps() { return $$('#ep-' + st.ex + ' .ep__steps li'); }
    function build() {
      var seq = Figur.SEQ[st.ex], dur = Figur.duration(st.ex), w = [], k = [], h = [];
      for (var i = 0; i <= 90; i++) { var s = Figur.solve(Figur.sample(seq, dur * i / 90 * 0.999)); w.push(s.AF.W); k.push(s.F.K); h.push(s.H); }
      paths.w.setAttribute('d', poly(w)); paths.k.setAttribute('d', poly(k)); paths.h.setAttribute('d', poly(h));
      degK.textContent = MESSUNG[st.ex][0]; st.deg = -1;
      bar.textContent = ''; var prev = 0;
      PHASEN[st.ex].forEach(function (ph) { var sp = doc.createElement('span'); sp.style.flexGrow = (ph[0] - prev).toFixed(2); sp.setAttribute('data-k', ph[2]); sp.textContent = ph[1]; bar.appendChild(sp); prev = ph[0]; });
      st.bw = bar.offsetWidth;
    }
    function render(trace) {
      var q = Figur.draw(fig, Figur.sample(Figur.SEQ[st.ex], st.t)), dur = Figur.duration(st.ex);
      if (trace) { st.pts.push(q.s.AF.W); if (st.pts.length > 40) st.pts.shift(); trail.setAttribute('d', poly(st.pts)); }
      var d = Math.round(MESSUNG[st.ex][1](q.s)); if (d !== st.deg) { st.deg = d; degV.textContent = d + '°'; }
      head.style.transform = 'translateX(' + (st.bw * st.t / dur).toFixed(1) + 'px)';
      var pi = phaseIdx(st.t);
      if (st.run && pi !== st.phase) {
        st.phase = pi; phaseEl.textContent = PHASEN[st.ex][pi][1];
        var sIdx = PHASE_STEP[st.ex][pi];
        steps().forEach(function (li, i) { li.classList.toggle('is-now', i === sIdx); });
      }
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
    addEventListener('resize', function () { st.bw = bar.offsetWidth; render(false); });
    tabs($('.player__pick', el), function (b) {
      var ex = b.getAttribute('data-ex'); if (ex === st.ex && st.t === 0 && !st.reps && st.bw) { render(false); return; }
      st.ex = ex;
      $$('.prop', svg).forEach(function (p) { p.hidden = p.getAttribute('data-prop') !== ex; });
      build(); reset();
    });
  });

  /* ---------- Rezept-Rechner mit Waage ---------- */
  later(function () {
    var f = $('#calc'); if (!f) return;
    var n = $('#c-n'), v = $('#c-v'), frei = $('#c-frei');
    var beam = $('.lever__beam', f), pans = $$('.lever__pan', f), degT = $('.lever__deg', f);
    var o = function (k) { return $('[data-o="' + k + '"]', f); };
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
      // schwerere Seite sinkt: links Kassenanteil, rechts Selbstzahler
      var a = Math.max(-WAAGE_MAX_GRAD, Math.min(WAAGE_MAX_GRAD, (selbst - kasse) / max * WAAGE_MAX_GRAD));
      beam.style.transform = 'rotate(' + a.toFixed(2) + 'deg)';
      pans.forEach(function (p) { p.style.transform = 'rotate(' + (-a).toFixed(2) + 'deg)'; });
      degT.textContent = Math.round(Math.abs(a)) + '°';
    }
    f.addEventListener('input', calc); f.addEventListener('change', calc);
    f.addEventListener('submit', function (e) { e.preventDefault(); });
    calc();
  });

  /* ---------- Goniometer-Skala für die Bewertung ---------- */
  later(function () {
    var g = $('.gonio__ticks'); if (!g) return;
    var NS = 'http://www.w3.org/2000/svg', d = '';
    for (var i = 0; i <= 27; i++) {
      var a = (-135 + i * 10) * Math.PI / 180, r1 = i % 5 === 0 ? 74 : 79, r2 = 84;
      d += 'M' + (110 + r1 * Math.sin(a)).toFixed(1) + ' ' + (110 - r1 * Math.cos(a)).toFixed(1) + 'L' + (110 + r2 * Math.sin(a)).toFixed(1) + ' ' + (110 - r2 * Math.cos(a)).toFixed(1);
    }
    var p = doc.createElementNS(NS, 'path'); p.setAttribute('d', d); g.appendChild(p);
  });

  /* ---------- Zahlen im Messprotokoll ---------- */
  later(function () {
    if (REDUCED) return;
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
    $$('[data-count-to]').forEach(function (el) { if (el.getBoundingClientRect().top > innerHeight) io.observe(el); });
  });

  /* ---------- Aktiver Navigationspunkt, Achse hell/dunkel ---------- */
  later(function () {
    var links = $$('.nav a, .axis a'), map = {};
    links.forEach(function (a) { var id = a.getAttribute('href').slice(1); (map[id] = map[id] || []).push(a); });
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) { var hit = map[x.target.id]; if (hit && x.isIntersecting) links.forEach(function (l) { l.classList.toggle('is-active', hit.indexOf(l) > -1); }); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { var s = doc.getElementById(id); if (s) io.observe(s); });
    var axis = $('.axis'); if (!axis) return;
    var dark = new Set();
    var io2 = new IntersectionObserver(function (en) {
      en.forEach(function (x) { x.isIntersecting ? dark.add(x.target) : dark.delete(x.target); });
      axis.classList.toggle('is-dark', dark.size > 0);
    }, { rootMargin: '-30% 0px -30% 0px' });
    $$('.uebungen, .ftr').forEach(function (s) { io2.observe(s); });
  });

  /* ---------- Achse: kleine Figur turnt beim Scrollen mit ---------- */
  later(function () {
    var g = $('.fig--rail'); if (!g || REDUCED || getComputedStyle($('.axis')).display === 'none') return;
    var fig = Figur.bind(g), seq = Figur.SEQ.arme, dur = Figur.duration('arme');
    scrollHooks.push(function (y) { Figur.draw(fig, Figur.sample(seq, (y / 140) % dur)); });
  });

  /* ---------- Maßband: läuft, Tempo folgt der Scroll-Geschwindigkeit ---------- */
  later(function () {
    var tape = $('.tape'), track = $('.tape__track', tape); if (!tape) return;
    if (REDUCED) { tape.classList.add('is-static'); return; }
    var list = $('.tape__list', track), clone = list.cloneNode(true); clone.setAttribute('aria-hidden', 'true'); track.appendChild(clone);
    var w = list.offsetWidth, x = 0, v = 0, lastY = scrollY, last = 0, raf = 0, vis = false;
    function frame(now) {
      raf = 0; var dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
      var dy = scrollY - lastY; lastY = scrollY;
      v += ((dy / Math.max(dt, 0.001)) * 0.25 - v) * 0.12; // geglättete Scroll-Geschwindigkeit
      var speed = 36 + Math.min(900, Math.abs(v)) * (dy < 0 ? -1 : 1);
      x -= speed * dt; if (x <= -w) x += w; if (x > 0) x -= w;
      track.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,0)';
      if (vis && !doc.hidden) raf = requestAnimationFrame(frame);
    }
    new IntersectionObserver(function (en) { vis = en[0].isIntersecting; if (vis && !raf) { last = 0; lastY = scrollY; raf = requestAnimationFrame(frame); } }).observe(tape);
    addEventListener('resize', function () { w = list.offsetWidth; });
    doc.addEventListener('visibilitychange', function () { if (!doc.hidden && vis && !raf) { last = 0; raf = requestAnimationFrame(frame); } });
  });

  /* ---------- Magnetische Buttons (nur feiner Zeiger) ---------- */
  later(function () {
    if (!FINE || REDUCED) return;
    $$('[data-magnet]').forEach(function (b) {
      var tx = 0, ty = 0, x = 0, y = 0, raf = 0;
      function loop() {
        x += (tx - x) * 0.2; y += (ty - y) * 0.2;
        b.style.setProperty('--mx', x.toFixed(2) + 'px'); b.style.setProperty('--my', y.toFixed(2) + 'px');
        raf = (Math.abs(tx - x) > 0.05 || Math.abs(ty - y) > 0.05) ? requestAnimationFrame(loop) : 0;
      }
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        tx = Math.max(-8, Math.min(8, (e.clientX - r.left - r.width / 2) * 0.22)); ty = Math.max(-6, Math.min(6, (e.clientY - r.top - r.height / 2) * 0.3));
        if (!raf) raf = requestAnimationFrame(loop);
      });
      b.addEventListener('pointerleave', function () { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(loop); });
    });
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
