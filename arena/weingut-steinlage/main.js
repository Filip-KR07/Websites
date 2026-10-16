/* Weingut Steinlage – Modell „Terroir“
   Ohne Build-Schritt. GSAP + ScrollTrigger + Lenis aus assets/vendor.
   Inhalte bleiben ohne JS vollständig sichtbar; JS ergänzt nur Bedienung und Bewegung. */
(function () {
  'use strict';

  /* ================= Konstanten (hier anpassen) ================= */

  // Weinproben: Preis pro Person in Euro
  var PAKETE = {
    klassik: { name: 'Klassik', preis: 18 },
    lagen: { name: 'Lagen', preis: 32 },
    sekt: { name: 'Sekt & Snacks', preis: 29 }
  };
  var VESPER_PREIS = 9;          // Winzervesper pro Person
  var PERSONEN_MIN = 2, PERSONEN_MAX = 24;
  // Startzeiten je Wochentag (0 = Sonntag … 6 = Samstag); leere Liste = keine offenen Proben
  var SLOTS = { 0: ['12:00', '14:30'], 1: [], 2: [], 3: ['16:00', '18:30'], 4: ['16:00', '18:30'], 5: ['16:00', '18:30'], 6: ['11:00', '14:00', '17:00'] };
  // Vinothek-Öffnungszeiten [von, bis] in Stunden, Zeitzone Europe/Berlin
  var OEFFNUNG = { 0: [11, 15], 3: [14, 18], 4: [14, 18], 5: [14, 18], 6: [10, 17] };

  // Wein-Finder: süß/körper auf 0–100, passende Speisen und Anlässe
  var WEINE = [
    { id: 'guts', name: 'Riesling trocken', stil: 'trocken · Gutswein', jahr: '2024', lage: 'Deidesheimer Hänge · Sandstein', alc: '12', preis: 9.8, s: 15, k: 30, acc: 'gold',
      essen: ['fisch', 'gemuese', 'nichts', 'wuerzig'], anlass: ['einfach', 'grill'], noten: 'Grüner Apfel, Zitronenschale, saftig.', grund: 'Unkompliziert und frisch – der Wein, der immer offen im Kühlschrank steht.' },
    { id: 'kalkmauer', name: 'Riesling Kalkmauer', stil: 'trocken · Lagenwein', jahr: '2023', lage: 'Kalkmauer · Kalkmergel', alc: '12,5', preis: 16.5, s: 10, k: 55, acc: 'gold',
      essen: ['fisch', 'gefluegel', 'kaese'], anlass: ['essen', 'geschenk'], noten: 'Limette, Kreide, salziger Abgang.', grund: 'Straffe Säure, die feinen Gerichten Kontur gibt – mit genug Tiefe für ein Abendessen.' },
    { id: 'sonnenwand', name: 'Riesling Sonnenwand Reserve', stil: 'trocken · Lagenwein', jahr: '2022', lage: 'Sonnenwand · Buntsandstein', alc: '13', preis: 29, s: 10, k: 82, acc: 'gold',
      essen: ['gefluegel', 'fisch', 'kaese'], anlass: ['geschenk', 'essen'], noten: 'Weinbergspfirsich, Rauch, Kräuter.', grund: 'Drei Jahre Reife, viel Kraft – ein Riesling, der auch Röstaromen standhält.' },
    { id: 'kabinett', name: 'Riesling Kabinett', stil: 'feinherb · Gutswein', jahr: '2024', lage: 'Mandelgrund · Lehm', alc: '10', preis: 11.5, s: 62, k: 22, acc: 'gold',
      essen: ['wuerzig', 'nichts', 'gemuese'], anlass: ['einfach', 'grill'], noten: 'Aprikose, Limette, leicht und saftig.', grund: 'Ein Hauch Restsüße fängt Schärfe auf – und bleibt mit 10 % schön leicht.' },
    { id: 'weissburgunder', name: 'Weißburgunder Mandelgrund', stil: 'trocken · Lagenwein', jahr: '2024', lage: 'Mandelgrund · Lehm und Löss', alc: '12,5', preis: 13.9, s: 25, k: 52, acc: 'green',
      essen: ['gemuese', 'gefluegel', 'fisch', 'kaese'], anlass: ['essen', 'einfach'], noten: 'Birne, Mandel, cremige Textur.', grund: 'Weich, mit wenig Säure – passt zu Gemüse, Pasta und hellem Fleisch.' },
    { id: 'rose', name: 'Spätburgunder Rosé', stil: 'trocken · Gutswein', jahr: '2024', lage: 'Lerchenberg · Kalk und Ton', alc: '11,5', preis: 9.5, s: 32, k: 24, acc: 'rose',
      essen: ['nichts', 'gemuese', 'fisch', 'wuerzig'], anlass: ['grill', 'einfach', 'feiern'], noten: 'Walderdbeere, Rhabarber, kühl getrunken.', grund: 'Leicht, rot-fruchtig und gekühlt perfekt für den Garten.' },
    { id: 'spaetburgunder', name: 'Spätburgunder Lerchenberg', stil: 'trocken · Lagenwein', jahr: '2022', lage: 'Lerchenberg · Kalkstein über Ton', alc: '13', preis: 24, s: 5, k: 84, acc: 'wine',
      essen: ['fleisch', 'kaese', 'gefluegel'], anlass: ['essen', 'geschenk'], noten: 'Sauerkirsche, Waldboden, feine Gerbstoffe.', grund: '18 Monate im Holzfass – genug Struktur für Rind, Wild und gereiften Käse.' },
    { id: 'sekt', name: 'Riesling-Sekt brut nature', stil: 'traditionelle Flaschengärung', jahr: '2021', lage: 'Am Steinbruch · Basalt', alc: '12', preis: 19.5, s: 4, k: 36, acc: 'gold',
      essen: ['nichts', 'fisch', 'kaese'], anlass: ['feiern', 'geschenk'], noten: 'Grüner Apfel, Brioche, feine Perlage.', grund: '30 Monate auf der Hefe, ohne Dosage – zum Anstoßen und für den Aperitif.' },
    { id: 'auslese', name: 'Riesling Auslese', stil: 'edelsüß · 0,375 l', jahr: '2023', lage: 'Sonnenwand · Buntsandstein', alc: '8', preis: 22, s: 95, k: 62, acc: 'gold',
      essen: ['dessert', 'kaese'], anlass: ['geschenk', 'essen'], noten: 'Honig, Mango, lebendige Säure.', grund: 'Süß, aber nie klebrig – zu Obstdessert oder Blauschimmelkäse.' }
  ];
  var ACC = { gold: ['#B8935A', '#85642F'], green: ['#4F5B3A', '#4F5B3A'], wine: ['#4A1426', '#4A1426'], rose: ['#C27C7E', '#9C4A55'] };

  /* ================= Grundlagen ================= */
  var doc = document.documentElement;
  var motionOff = /[?&]motion=off/.test(location.search);
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var still = motionOff || reduce;
  var lenis = null;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var euro = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
  var nb = function (s) { return s.replace(/ (€|%)/g, ' $1'); };

  /* ================= Header, Menü, Fortschritt ================= */
  function initHeader() {
    var hdr = $('.hdr'), bar = $('.progress i'), ticking = false;
    function onScroll() {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        var y = window.scrollY, max = doc.scrollHeight - innerHeight;
        hdr.classList.toggle('is-scrolled', y > 8);
        bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0).toFixed(4) + ')';
      });
    }
    addEventListener('scroll', onScroll, { passive: true }); onScroll();

    var btn = $('.burger'), menu = $('#mnav');
    function close(focusBtn) {
      if (menu.hidden) return;
      btn.setAttribute('aria-expanded', 'false');
      menu.classList.add('is-closing');
      setTimeout(function () { menu.hidden = true; menu.classList.remove('is-closing'); }, still ? 0 : 200);
      if (focusBtn) btn.focus();
    }
    function open() {
      menu.hidden = false; menu.classList.add('is-entering');
      btn.setAttribute('aria-expanded', 'true');
      requestAnimationFrame(function () { requestAnimationFrame(function () { menu.classList.remove('is-entering'); }); });
      var first = $('a', menu); if (first) first.focus();
    }
    btn.addEventListener('click', function () { btn.getAttribute('aria-expanded') === 'true' ? close() : open(); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(true); });
    addEventListener('resize', function () { if (innerWidth >= 900) close(); });
  }

  /* ================= Hero-Canvas: Höhenlinien + Rebzeilen im Wind ================= */
  function initHero() {
    var cv = $('.hero__canvas'); if (!cv || !cv.getContext) return;
    var ctx = cv.getContext('2d'), hero = cv.parentElement;
    var W = 0, H = 0, dpr = 1, stat = null, mask = null, rows = [], visible = true, raf = 0, last = 0, t0 = performance.now();
    var mouse = { x: -9999, y: -9999, on: false };
    var FPS = 30;

    // kleine deterministische Rausch-Funktion
    function n1(x, s) { return Math.sin(x * 1.7 + s) * .5 + Math.sin(x * 3.1 + s * 2.3) * .3 + Math.sin(x * 5.3 + s * .7) * .2; }

    function build() {
      var r = hero.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
      dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = W * dpr; cv.height = H * dpr;
      // statische Ebene: Höhenlinien einmal rendern
      stat = document.createElement('canvas'); stat.width = cv.width; stat.height = cv.height;
      var s = stat.getContext('2d'); s.scale(dpr, dpr);
      var mobile = W < 900;
      var cx = mobile ? W * .62 : W * .74, cy = mobile ? H * .2 : H * .36;
      var maxR = Math.hypot(W, H);
      for (var k = 0; k < 26; k++) {
        var R = 40 + k * (mobile ? 30 : 42);
        if (R > maxR) break;
        s.beginPath();
        for (var a = 0; a <= 120; a++) {
          var th = a / 120 * Math.PI * 2;
          var rr = R * (1 + .16 * n1(th, k * .37) + .05 * Math.sin(th * 2 + k * .2));
          var x = cx + Math.cos(th) * rr * 1.25, y = cy + Math.sin(th) * rr * .82;
          a ? s.lineTo(x, y) : s.moveTo(x, y);
        }
        s.closePath();
        s.strokeStyle = k % 5 === 0 ? 'rgba(79,91,58,.26)' : 'rgba(79,91,58,.13)';
        s.lineWidth = k % 5 === 0 ? 1.2 : .8;
        s.stroke();
      }
      // Rebzeilen (dynamisch): Pflanzen je Zeile mit Feder für Mausreaktion
      if (mobile) { mask = ctx.createLinearGradient(0, H * .62, 0, H * .9); mask.addColorStop(0, 'rgba(0,0,0,1)'); mask.addColorStop(1, 'rgba(0,0,0,.15)'); }
      else { mask = ctx.createLinearGradient(0, 0, W * .62, 0); mask.addColorStop(0, 'rgba(0,0,0,.92)'); mask.addColorStop(.55, 'rgba(0,0,0,.8)'); mask.addColorStop(1, 'rgba(0,0,0,0)'); }
      rows = [];
      var R = mobile ? 6 : 9;
      for (var i = 0; i < R; i++) {
        var t = i / (R - 1);
        var y0 = H * (mobile ? .8 : .6) + H * (mobile ? .26 : .44) * Math.pow(t, 1.35);
        var sc = .4 + t * (mobile ? .8 : 1);
        var gap = 24 * sc, plants = [];
        for (var x = -gap + (i % 2) * gap * .5; x < W + gap; x += gap) plants.push({ x: x, b: 0, v: 0, g: Math.random() < .14 });
        rows.push({ y0: y0, sc: sc, amp: 10 + 26 * (1 - t), ph: i * .9, plants: plants, a: .16 + t * .3 });
      }
    }
    function rowY(r, x) { return r.y0 - r.amp * (.6 * Math.sin(x * .0042 + r.ph) + .4 * Math.sin(x * .011 + r.ph * 1.7)); }

    function draw(now) {
      var t = (now - t0) / 1000;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var gust = .65 + .35 * Math.sin(t * .35) * Math.sin(t * .13 + 1);
      for (var i = 0; i < rows.length; i++) {
        var r = rows[i], sc = r.sc, h = 20 * sc, rad = 4.6 * sc;
        // Draht der Zeile
        ctx.beginPath();
        for (var x = -20; x <= W + 20; x += 24) { var yy = rowY(r, x) - h * .55; x === -20 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy); }
        ctx.strokeStyle = 'rgba(79,91,58,' + (r.a * .55).toFixed(3) + ')'; ctx.lineWidth = .7; ctx.stroke();
        var stems = new Path2D(), leaves = new Path2D(), grapes = new Path2D();
        for (var j = 0; j < r.plants.length; j++) {
          var p = r.plants[j], base = rowY(r, p.x);
          // Maus schiebt Pflanzen weg (Feder statt direkter Kopplung)
          var target = 0;
          if (mouse.on) {
            var dx = p.x - mouse.x, dy = (base - h) - mouse.y, d2 = dx * dx + dy * dy, R2 = 140 * 140;
            if (d2 < R2) target = (dx >= 0 ? 1 : -1) * (1 - d2 / R2) * 22 * sc;
          }
          p.v += (target - p.b) * .09; p.v *= .8; p.b += p.v;
          var sway = Math.sin(t * 1.25 + p.x * .013 + r.ph) * 4.2 * sc * gust + p.b;
          var tx = p.x + sway, ty = base - h;
          stems.moveTo(p.x, base); stems.quadraticCurveTo(p.x + sway * .2, base - h * .55, tx, ty);
          leaves.moveTo(tx + rad, ty); leaves.arc(tx, ty, rad, 0, Math.PI * 2);
          leaves.moveTo(tx - rad * .4 + rad * .8, ty + rad * .9); leaves.arc(tx - rad * .4, ty + rad * .9, rad * .8, 0, Math.PI * 2);
          if (p.g) { grapes.moveTo(tx + rad * .9 + 2.2 * sc, ty + rad * 1.6); grapes.arc(tx + rad * .9, ty + rad * 1.6, 2.2 * sc, 0, Math.PI * 2); }
        }
        ctx.strokeStyle = 'rgba(79,91,58,' + (r.a * .9).toFixed(3) + ')'; ctx.lineWidth = Math.max(.6, sc * .9); ctx.stroke(stems);
        ctx.fillStyle = 'rgba(79,91,58,' + r.a.toFixed(3) + ')'; ctx.fill(leaves);
        ctx.fillStyle = 'rgba(74,20,38,' + (r.a * 1.4).toFixed(3) + ')'; ctx.fill(grapes);
      }
      // Rebzeilen hinter dem Text ausblenden (Lesbarkeit), dann Höhenlinien darunterlegen
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = mask; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'destination-over';
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(stat, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
    }
    function loop(now) {
      raf = 0;
      if (!visible || document.hidden) return;
      raf = requestAnimationFrame(loop);
      if (now - last < 1000 / FPS - 2) return;
      last = now; draw(now);
    }
    function start() { if (!still && !raf && visible && !document.hidden) raf = requestAnimationFrame(loop); }
    function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; }

    build(); draw(performance.now());
    if (still) { addEventListener('resize', debounce(function () { build(); draw(performance.now()); }, 200)); return; }
    var lastW = innerWidth;
    addEventListener('resize', debounce(function () { if (Math.abs(innerWidth - lastW) < 2 && W) { /* nur Höhe (Adressleiste) */ } lastW = innerWidth; build(); draw(performance.now()); }, 200));
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; visible ? start() : stop(); }).observe(hero);
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
    hero.addEventListener('pointermove', function (e) { var r = cv.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.on = true; }, { passive: true });
    hero.addEventListener('pointerleave', function () { mouse.on = false; });
    start();
  }
  function debounce(fn, ms) { var id; return function () { clearTimeout(id); id = setTimeout(fn, ms); }; }

  /* ================= Lagen-Karte ================= */
  function initLagen() {
    var tabs = $$('.lagen__tabs [role="tab"]'), map = $('.map'), groups = $$('.lage', map), cards = $$('.lcard');
    function select(id, focus) {
      tabs.forEach(function (t) {
        var on = t.dataset.lage === id;
        t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1;
        if (on && focus) t.focus();
      });
      cards.forEach(function (c) {
        var on = c.dataset.lage === id;
        if (on) { c.removeAttribute('aria-hidden'); c.inert = false; } else { c.setAttribute('aria-hidden', 'true'); c.inert = true; }
      });
      groups.forEach(function (g) { g.classList.toggle('is-active', g.dataset.lage === id); });
      map.dataset.active = id;
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t.dataset.lage); });
      t.addEventListener('keydown', function (e) {
        var k = e.key, n = null;
        if (k === 'ArrowRight' || k === 'ArrowDown') n = (i + 1) % tabs.length;
        else if (k === 'ArrowLeft' || k === 'ArrowUp') n = (i - 1 + tabs.length) % tabs.length;
        else if (k === 'Home') n = 0; else if (k === 'End') n = tabs.length - 1;
        if (n !== null) { e.preventDefault(); select(tabs[n].dataset.lage, true); }
      });
    });
    groups.forEach(function (g) {
      g.addEventListener('click', function () {
        select(g.dataset.lage);
        var hint = $('.map__hint'); if (hint) hint.style.opacity = '0';
        // auf dem Handy zur Karte der Lage scrollen, damit die Infos sichtbar werden
        if (innerWidth < 900) scrollToEl($('.lagen__panel'), -12);
      });
    });
    select('steinbruch');
  }

  /* ================= Wein-Finder ================= */
  function initFinder() {
    var form = $('#finder-form'), lab = $('#etikett'), current = null, swapT = 0;
    var rs = $('#r-suess'), rk = $('#r-koerper');
    function txt(v, a, b, c) { return v < 30 ? a : v > 66 ? c : b; }
    function paint(r) { r.style.setProperty('--p', r.value + '%'); }
    function rank() {
      var an = form.anlass.value, es = form.essen.value, s = +rs.value, k = +rk.value;
      return WEINE.map(function (w) {
        var sc = 0;
        if (w.anlass.indexOf(an) > -1) sc += 3 - w.anlass.indexOf(an) * .4;
        if (w.essen.indexOf(es) > -1) sc += 4.2 - w.essen.indexOf(es) * .5;
        sc -= Math.abs(w.s - s) / 13 + Math.abs(w.k - k) / 15;
        return { w: w, sc: sc };
      }).sort(function (a, b) { return b.sc - a.sc; });
    }
    function fill(w, alt) {
      $('#e-yr').textContent = w.jahr;
      $('#e-name').textContent = w.name;
      $('#e-style').textContent = w.stil;
      $('#e-lage').textContent = w.lage;
      $('#e-alc').textContent = w.alc + ' % vol';
      $('#e-notes').textContent = w.noten;
      $('#e-reason').textContent = w.grund;
      $('#e-price').textContent = nb(euro.format(w.preis));
      $('#e-alt').textContent = alt.name + ' (' + nb(euro.format(alt.preis)) + ')';
      lab.style.setProperty('--acc', ACC[w.acc][0]);
      lab.style.setProperty('--acc-t', ACC[w.acc][1]);
    }
    function update() {
      paint(rs); paint(rk);
      rs.setAttribute('aria-valuetext', txt(+rs.value, 'trocken', 'halbtrocken bis feinherb', 'fruchtig-süß'));
      rk.setAttribute('aria-valuetext', txt(+rk.value, 'leicht', 'mittel', 'kräftig'));
      var r = rank(), w = r[0].w, alt = r[1].w;
      if (current === w.id) { $('#e-alt').textContent = alt.name + ' (' + nb(euro.format(alt.preis)) + ')'; return; }
      current = w.id;
      if (still) { fill(w, alt); return; }
      clearTimeout(swapT);
      lab.classList.add('is-swap');
      lab.style.transform = 'rotate(' + (Math.random() * 3 - 2).toFixed(2) + 'deg)';
      swapT = setTimeout(function () { fill(w, alt); lab.classList.remove('is-swap'); }, 170);
    }
    form.addEventListener('input', update);
    form.addEventListener('change', update);
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    update();
  }

  /* ================= Weinprobe buchen ================= */
  function initBooking() {
    var form = $('#booking'), done = $('#booking-done');
    var date = $('#b-date'), time = $('#b-time'), pers = $('#b-pers'), vesper = $('#b-vesper'), hint = $('#b-date-hint'), err = $('#b-err');
    var hintDefault = hint.textContent;
    function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
    var tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    var maxD = new Date(); maxD.setMonth(maxD.getMonth() + 9);
    date.min = iso(tomorrow); date.max = iso(maxD);
    function parse(v) { var p = v.split('-'); return p.length === 3 ? new Date(+p[0], p[1] - 1, +p[2]) : null; }
    function fmtDate(d) { return d.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'long' }); }
    function persons() { var n = parseInt(pers.value, 10); return isNaN(n) ? PERSONEN_MIN : Math.min(PERSONEN_MAX, Math.max(PERSONEN_MIN, n)); }
    function slots() {
      var d = parse(date.value), prev = time.value;
      while (time.firstChild) time.removeChild(time.firstChild);
      var list = d ? SLOTS[d.getDay()] : null;
      hint.classList.remove('is-err'); hint.textContent = hintDefault;
      if (!d) { time.add(new Option('Erst Datum wählen', '')); return; }
      if (!list.length) {
        time.add(new Option('Kein offener Termin', ''));
        hint.textContent = 'Montags und dienstags nur für Gruppen ab 10 Personen – bitte rufen Sie uns an.'; hint.classList.add('is-err');
        return;
      }
      time.add(new Option('Uhrzeit wählen', ''));
      list.forEach(function (s) { time.add(new Option(s + ' Uhr', s)); });
      if (list.indexOf(prev) > -1) time.value = prev; else if (list.length) time.value = list[0];
    }
    function summary() {
      var p = PAKETE[form.paket.value], n = persons(), d = parse(date.value);
      var sum = p.preis * n + (vesper.checked ? VESPER_PREIS * n : 0);
      $('#s-paket').textContent = p.name;
      $('#s-pers').textContent = n;
      $('#s-probe').textContent = n + ' × ' + nb(euro.format(p.preis));
      $('#s-vesper-row').hidden = !vesper.checked;
      $('#s-vesper').textContent = n + ' × ' + nb(euro.format(VESPER_PREIS));
      $('#s-termin').textContent = d && time.value ? fmtDate(d) + ', ' + time.value + ' Uhr' : d ? fmtDate(d) : 'noch offen';
      $('#s-sum').textContent = nb(euro.format(sum));
      return { paket: p.name, n: n, d: d, sum: sum };
    }
    $$('.stepper button').forEach(function (b) {
      b.addEventListener('click', function () { pers.value = Math.min(PERSONEN_MAX, Math.max(PERSONEN_MIN, persons() + (+b.dataset.step))); summary(); });
    });
    pers.addEventListener('blur', function () { pers.value = persons(); summary(); });
    date.addEventListener('change', function () { slots(); summary(); });
    form.addEventListener('input', summary);
    form.addEventListener('change', summary);
    function bad(el, on) { if (on) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid'); return on; }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = $('#b-name'), mail = $('#b-mail'), d = parse(date.value), msgs = [], first = null;
      function chk(el, cond, msg) { if (bad(el, cond)) { msgs.push(msg); first = first || el; } }
      chk(date, !d || date.value < date.min || date.value > date.max, 'Bitte ein Datum ab morgen wählen.');
      chk(time, !time.value, 'Bitte eine Uhrzeit wählen.');
      chk(name, name.value.trim().length < 2, 'Bitte Ihren Namen angeben.');
      chk(mail, !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail.value.trim()), 'Bitte eine gültige E-Mail-Adresse angeben.');
      var n = parseInt(pers.value, 10);
      chk(pers, isNaN(n) || n < PERSONEN_MIN || n > PERSONEN_MAX, 'Personen: 2 bis 24.');
      err.textContent = msgs.join(' ');
      if (first) { first.focus(); return; }
      var s = summary(), list = $('#d-list');
      while (list.firstChild) list.removeChild(list.firstChild);
      [['Paket', s.paket], ['Termin', fmtDate(s.d) + ', ' + time.value + ' Uhr'], ['Personen', String(s.n)], ['Vesper', vesper.checked ? 'ja' : 'nein'], ['E-Mail', mail.value.trim()], ['Summe (Beispiel)', nb(euro.format(s.sum))]]
        .concat($('#b-msg').value.trim() ? [['Anmerkung', $('#b-msg').value.trim()]] : [])
        .forEach(function (row) {
          var div = document.createElement('div'), dt = document.createElement('dt'), dd = document.createElement('dd');
          dt.textContent = row[0]; dd.textContent = row[1]; div.appendChild(dt); div.appendChild(dd); list.appendChild(div);
        });
      $('#d-name').textContent = name.value.trim().split(' ')[0];
      form.hidden = true; done.hidden = false;
      scrollToEl($('#probe'), 0);
      setTimeout(function () { done.focus({ preventScroll: true }); }, 60);
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    });
    $$('input, select', form).forEach(function (el) { ['input', 'change'].forEach(function (ev) { el.addEventListener(ev, function () { if (el.getAttribute('aria-invalid')) { bad(el, false); if (!$('[aria-invalid]', form)) err.textContent = ''; } }); }); });
    $('#d-back').addEventListener('click', function () {
      done.hidden = true; form.hidden = false; err.textContent = '';
      $('#b-name').focus();
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    });
    slots(); summary();
  }

  /* ================= Öffnungsstatus ================= */
  function initStatus() {
    var el = $('#status'), txt = $('#status-txt');
    try {
      var parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date());
      var get = function (t) { return (parts.filter(function (p) { return p.type === t; })[0] || {}).value; };
      var day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
      var h = +get('hour') + (+get('minute')) / 60, o = OEFFNUNG[day];
      var row = $('.hours tr[data-d="' + day + '"]'); if (row) row.classList.add('is-today');
      if (o && h >= o[0] && h < o[1]) { el.classList.add('is-open'); txt.textContent = 'Jetzt geöffnet · bis ' + o[1] + ' Uhr'; }
      else {
        var next = null;
        for (var i = 0; i < 8 && !next; i++) { var dd = (day + i) % 7, oo = OEFFNUNG[dd]; if (oo && (i > 0 || h < oo[0])) next = [i, dd, oo]; }
        var names = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
        el.classList.add('is-closed');
        txt.textContent = 'Gerade geschlossen · wieder ' + (next[0] === 0 ? 'heute' : next[0] === 1 ? 'morgen' : names[next[1]]) + ' ab ' + next[2][0] + ' Uhr';
      }
    } catch (e) { /* Grundtext bleibt */ }
  }

  /* ================= Reveal + aktive Navigation ================= */
  function initReveal() {
    var els = $$('[data-reveal]');
    if (still || !('IntersectionObserver' in window)) return;
    doc.classList.add('rv');
    // was schon im Bild ist, sofort zeigen
    els.forEach(function (el) { var r = el.getBoundingClientRect(); if (r.top < innerHeight * .95 && r.bottom > 0) el.classList.add('is-in'); });
    var io = new IntersectionObserver(function (es) {
      var k = 0;
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.style.transitionDelay = (k++ * 70) + 'ms';
        e.target.classList.add('is-in'); io.unobserve(e.target);
        setTimeout(function (t) { t.style.transitionDelay = ''; }.bind(null, e.target), 1200);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    els.forEach(function (el) { if (!el.classList.contains('is-in')) io.observe(el); });
  }
  function initNavSpy() {
    var links = $$('.nav a'), map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { links.forEach(function (a) { a.classList.remove('is-active'); }); var a = map[e.target.id]; if (a) a.classList.add('is-active'); } });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
  }

  /* ================= Scroll-Helfer ================= */
  function hdrH() { return $('.hdr').offsetHeight; }
  function scrollToEl(el, extra) {
    if (!el) return;
    var off = -(hdrH() + 12) + (extra || 0);
    if (lenis) lenis.scrollTo(el, { offset: off, duration: 1.1 });
    else window.scrollTo({ top: el.getBoundingClientRect().top + scrollY + off, behavior: still ? 'auto' : 'smooth' });
  }
  function initAnchors() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#"]'); if (!a) return;
      var id = a.getAttribute('href'); if (id.length < 2) return;
      var t = document.getElementById(id.slice(1)); if (!t) return;
      e.preventDefault();
      scrollToEl(t);
      history.replaceState(null, '', id);
      setTimeout(function () { if (!t.hasAttribute('tabindex')) t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true }); }, lenis ? 900 : 80);
    });
  }

  /* ================= GSAP: Lenis + „Ein Jahr im Weinberg“ ================= */
  function initMotion() {
    if (!window.gsap || !window.ScrollTrigger) return;
    var gsap = window.gsap, ST = window.ScrollTrigger;
    gsap.registerPlugin(ST);
    if (!still && window.Lenis) {
      lenis = new window.Lenis({ lerp: 0.11, smoothWheel: true });
      window.__lenis = lenis;
      doc.classList.add('has-lenis');
      lenis.on('scroll', ST.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    }
    if (still) return;
    var sec = $('#jahr'), view = $('.jahr__view', sec), track = $('#jahr-track'), num = $('#jahr-num'), bar = $('.jahr__bar i'), cards = $$('.mo', track);
    var mm = gsap.matchMedia();
    mm.add('(min-width: 900px)', function () {
      doc.classList.add('jahr-h');
      var dist = 0;
      function measure() {
        dist = Math.max(0, track.scrollWidth - view.clientWidth);
        sec.style.height = (innerHeight + dist) + 'px';
      }
      measure();
      var lastM = -1;
      var tw = gsap.to(track, {
        x: function () { return -dist; }, ease: 'none',
        scrollTrigger: {
          trigger: sec, start: 'top top', end: function () { return '+=' + dist; }, scrub: 0.6, invalidateOnRefresh: true,
          onRefreshInit: measure,
          onUpdate: function (self) {
            var m = Math.min(11, Math.floor(self.progress * 12));
            if (m !== lastM) { lastM = m; num.textContent = String(m + 1).padStart(2, '0'); }
            bar.style.transform = 'scaleX(' + (0.0833 + self.progress * 0.9167).toFixed(4) + ')';
          }
        }
      });
      // leichte Parallaxe der Bilder innerhalb der Karten
      var imgs = $$('.mo figure img', track).map(function (img) {
        gsap.set(img, { scale: 1.12 });
        return gsap.fromTo(img, { xPercent: -5 }, { xPercent: 5, ease: 'none', scrollTrigger: { trigger: img.closest('.mo'), containerAnimation: tw, start: 'left right', end: 'right left', scrub: true } });
      });
      return function () {
        doc.classList.remove('jahr-h'); sec.style.height = ''; gsap.set(track, { clearProps: 'transform' });
        imgs.forEach(function (t) { t.kill(); }); $$('.mo figure img', track).forEach(function (i) { gsap.set(i, { clearProps: 'transform' }); });
      };
    });
    // Hero-Komposition: sanfte Tiefe beim Herausscrollen (nur transform)
    mm.add('(min-width: 900px)', function () {
      gsap.to('.arch img', { yPercent: 8, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
      gsap.to('.oval', { yPercent: -14, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    });
    ST.refresh();
  }

  /* ================= Start in Etappen ================= */
  initHeader();
  initHero();
  var queue = [initAnchors, initLagen, initFinder, initBooking, initStatus, initReveal, initNavSpy, initMotion];
  var idle = window.requestIdleCallback || function (cb) { return setTimeout(function () { cb({ timeRemaining: function () { return 12; } }); }, 16); };
  function pump(deadline) {
    var t = performance.now();
    while (queue.length && performance.now() - t < 20) {
      try { queue.shift()(); } catch (e) { console.warn(e); }
      if (deadline && deadline.timeRemaining && deadline.timeRemaining() < 2) break;
    }
    if (queue.length) idle(pump, { timeout: 300 });
    else if (window.ScrollTrigger) window.ScrollTrigger.refresh();
  }
  setTimeout(function () { idle(pump, { timeout: 300 }); }, 60);
  addEventListener('load', function () { if (window.ScrollTrigger) window.ScrollTrigger.refresh(); });
})();
