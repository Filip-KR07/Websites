/* ==========================================================================
   FORGE Athletic Club · Modell „Schmiede“
   Statisch, ohne Build. Optional: GSAP 3 + ScrollTrigger, Lenis.
   ========================================================================== */
(function () {
  'use strict';
  window.__forgeReady = true;

  /* ------------------------------------------------------------------
     Stammdaten – hier anpassen
     ------------------------------------------------------------------ */
  var TZ = 'Europe/Berlin';
  /* Öffnungszeiten je JS-Wochentag (0 = So … 6 = Sa): [ab, bis] in Stunden */
  var OEFFNUNG = { 0: [8, 20], 1: [6, 23], 2: [6, 23], 3: [6, 23], 4: [6, 23], 5: [6, 23], 6: [8, 20] };

  /* Mitgliedschaft – Monatspreise in € (inkl. MwSt.) */
  var PREISE = {
    zugang: {
      gym: { name: 'Open Gym', preis: 49 },
      kurse: { name: 'Gym + Kurse', preis: 69 },
      all: { name: 'All Access', preis: 89, saunaInklusive: true }
    },
    laufzeit: {
      m12: { name: '12 Monate', aufschlag: 0, startpaket: false },
      m6: { name: '6 Monate', aufschlag: 7, startpaket: true },
      flex: { name: 'Flex', aufschlag: 15, startpaket: true }
    },
    extras: {
      sauna: { name: 'Sauna & Recovery', preis: 12 },
      drinks: { name: 'Getränke-Flat', preis: 9 },
      towel: { name: 'Handtuch & Mietspind', preis: 6 },
      offpeak: { name: 'Off-Peak', preis: -10 }
    },
    rabatt: 0.15,      // Ermäßigung auf Zugang + Laufzeit-Aufschlag
    ptEinheit: 59,     // Personal Training je 60-Min.-Einheit
    startpaket: 39     // einmalig, entfällt bei 12 Monaten
  };

  var COACHES = {
    jw: 'Jonas Weber', mp: 'Mara Petrović', da: 'Deniz Aydın', lh: 'Lea Hoffmann',
    km: 'Kofi Mensah', sb: 'Svenja Brandt', ar: 'Ana Ruiz', ts: 'Tim Schulz'
  };
  var TYP = {
    strength: { code: 'STR', name: 'Strength' },
    conditioning: { code: 'CON', name: 'Conditioning' },
    boxing: { code: 'BOX', name: 'Boxing' },
    mobility: { code: 'MOB', name: 'Mobility' }
  };
  var LEVEL = { einsteiger: 'Einsteiger', alle: 'Alle Level', fortgeschritten: 'Fortgeschritten' };
  var TAGE = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
  var TAGE_KURZ = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  /* Kursbeschreibungen für den Detail-Dialog */
  var KURSINFO = {
    'Strength Basics': { text: 'Kniebeuge, Kreuzheben, Drücken und Rudern – Schritt für Schritt mit leichten Gewichten. Der Einstieg ins Krafttraining.', max: 10, bring: 'Sportkleidung, flache feste Schuhe, Trinkflasche' },
    'Barbell Club': { text: 'Für alle, die die Grundübungen sicher beherrschen: Kraftzyklen über sechs Wochen, jedes Gewicht wird protokolliert.', max: 8, bring: 'Trainingslog oder App, Gürtel optional' },
    'Kettlebell Lab': { text: 'Swings, Cleans, Get-ups und Carries für Kraftausdauer und Griffkraft. Kettlebells von 6 bis 32 kg.', max: 12, bring: 'Sportkleidung, flache Schuhe' },
    'Olympic Lifting': { text: 'Reißen und Stoßen in Teilbewegungen, mit Videoanalyse. Voraussetzung: sichere Kniebeuge und sicheres Kreuzheben.', max: 8, bring: 'Gewichtheberschuhe, falls vorhanden; Tape optional' },
    'Power Hour': { text: 'Eine schwere Grundübung, danach Zusatzübungen im Zirkel. Jede Station lässt sich skalieren.', max: 14, bring: 'Sportkleidung, Handtuch, Trinkflasche' },
    'Engine': { text: 'Intervalle auf Ruderergometer, Air Bike und SkiErg. Jede Runde hat eine Zielzone – Sie wissen vorher, wie hart es wird.', max: 12, bring: 'Handtuch, Trinkflasche, Pulsgurt optional' },
    'Sled & Sprint': { text: 'Schlitten schieben und ziehen, kurze Sprints auf der 25-Meter-Turfbahn. Kurz, explosiv, mit langen Pausen.', max: 10, bring: 'Schuhe mit gutem Grip, Trinkflasche' },
    'Zirkel 30': { text: 'Dreißig Minuten Ganzkörperzirkel mit Kurzhanteln und Körpergewicht – passt in jede Mittagspause.', max: 16, bring: 'Sportkleidung, Handtuch' },
    'Row & Ride': { text: 'Längere, gleichmäßige Einheiten auf Rudergerät und Bike. Grundlagenausdauer ohne Sprintdruck.', max: 12, bring: 'Handtuch, Trinkflasche' },
    'Boxing Basics': { text: 'Stand, Deckung, Gerade, Haken. Partnerübungen an der Pratze, kein Sparring. Leihhandschuhe liegen bereit.', max: 14, bring: 'Bandagen, falls vorhanden; Trinkflasche' },
    'Boxing Technik': { text: 'Kombinationen, Meidbewegungen und Footwork für alle, die die Grundlagen kennen.', max: 14, bring: 'Eigene Handschuhe und Bandagen' },
    'Bag Work': { text: 'Runden am Sandsack nach Rundenuhr: Technik unter Ermüdung, Rhythmus, Schlagkraft.', max: 14, bring: 'Handschuhe, Bandagen, Handtuch' },
    'Sparring Lab': { text: 'Kontrolliertes, freiwilliges Sparring mit Kopfschutz – nur nach Absprache mit dem Coach. Technik und Kontrolle zuerst.', max: 10, bring: 'Handschuhe (14–16 oz), Bandagen, Mundschutz; Kopfschutz leihbar' },
    'Morning Mobility': { text: 'Dreißig Minuten Gelenkmobilisation und Atmung zum Start in den Tag.', max: 16, bring: 'Bequeme Kleidung; Matten sind da' },
    'Mobility Flow': { text: 'Fließende Bewegungsfolgen für Hüfte, Wirbelsäule und Schultern – ruhig, aber nicht passiv.', max: 16, bring: 'Bequeme Kleidung; Matten und Bänder sind da' },
    'Stretch & Restore': { text: 'Langsame Dehnpositionen, Faszienrolle und Atemarbeit – Ausgleich nach schweren Trainingstagen.', max: 16, bring: 'Bequeme, warme Kleidung' }
  };

  /* Trainingsplan-Generator: Einheiten, Tage und Ziele */
  var PLAN_TAGE = { 2: [0, 3], 3: [0, 2, 4], 4: [0, 1, 3, 5], 5: [0, 1, 3, 4, 5], 6: [0, 1, 2, 3, 4, 5] }; // 0 = Montag
  var PLAN_ERFAHRUNG = {
    neu: { name: 'Einsteiger', saetze: '2–3 Sätze', wdh: '8–10 Wdh., leichtes Gewicht', int: -1, dauer: -10, tipp: 'Technik vor Gewicht' },
    mittel: { name: 'Etwas Erfahrung', saetze: '3–4 Sätze', wdh: '6–8 Wdh.', int: 0, dauer: 0, tipp: 'Gewichte notieren' },
    profi: { name: 'Fortgeschritten', saetze: '4–5 Sätze', wdh: '3–6 Wdh.', int: 1, dauer: 15, tipp: 'Wellen über 4 Wochen' }
  };
  var PLAN_ZIELE = {
    kraft: { name: 'Stärker werden', plaene: { 2: ['kraftA', 'kraftB'], 3: ['kraftA', 'kraftB', 'mix'], 4: ['kraftU', 'kraftO', 'kondiGA', 'kraftA'], 5: ['kraftU', 'kraftO', 'kondiGA', 'kraftU', 'kraftO'], 6: ['kraftU', 'kraftO', 'mobFlow', 'kraftU', 'kraftO', 'kondiGA'] } },
    kondition: { name: 'Kondition aufbauen', plaene: { 2: ['kondiInt', 'mix'], 3: ['kondiInt', 'kraftA', 'kondiGA'], 4: ['kondiInt', 'kraftA', 'kondiGA', 'kondiZirkel'], 5: ['kondiInt', 'kraftA', 'kondiGA', 'mobFlow', 'kondiZirkel'], 6: ['kondiInt', 'kraftA', 'kondiGA', 'mobFlow', 'kondiZirkel', 'kondiGA'] } },
    boxen: { name: 'Boxen lernen', plaene: { 2: ['boxTech', 'boxBag'], 3: ['boxTech', 'kraftA', 'boxBag'], 4: ['boxTech', 'kraftA', 'boxBag', 'kondiInt'], 5: ['boxTech', 'kraftA', 'boxBag', 'mobSchulter', 'boxKondi'], 6: ['boxTech', 'kraftA', 'boxBag', 'mobSchulter', 'boxKondi', 'kondiGA'] } },
    mobil: { name: 'Beweglicher werden', plaene: { 2: ['mobFlow', 'mobHuefte'], 3: ['mobFlow', 'kraftA', 'mobHuefte'], 4: ['mobFlow', 'kraftA', 'mobHuefte', 'mobSchulter'], 5: ['mobFlow', 'kraftA', 'mobHuefte', 'kondiGA', 'mobSchulter'], 6: ['mobFlow', 'kraftA', 'mobHuefte', 'kondiGA', 'mobSchulter', 'mobFlow'] } },
    allround: { name: 'Rundum fit', plaene: { 2: ['mix', 'kondiInt'], 3: ['kraftA', 'kondiInt', 'boxTech'], 4: ['kraftA', 'kondiInt', 'mobFlow', 'kraftB'], 5: ['kraftA', 'kondiInt', 'boxTech', 'mobFlow', 'kraftB'], 6: ['kraftA', 'kondiInt', 'boxTech', 'mobFlow', 'kraftB', 'kondiGA'] } }
  };
  /* {S} = Sätze, {W} = Wiederholungen – je nach Erfahrung */
  var EINHEITEN = {
    kraftA: { titel: 'Ganzkörper A', typ: 'strength', dauer: 60, int: 3, bloecke: [['Warm-up', '8 Min. Mobility, leere Stange'], ['Kraft', 'Kniebeuge {S} × {W}'], ['Kraft', 'Bankdrücken, Rudern im Wechsel'], ['Finish', 'Plank-Varianten, 3 Runden']] },
    kraftB: { titel: 'Ganzkörper B', typ: 'strength', dauer: 60, int: 3, bloecke: [['Warm-up', 'Hüfte & Schultern, 8 Min.'], ['Kraft', 'Kreuzheben {S} × {W}'], ['Kraft', 'Schulterdrücken, Klimmzug-Variante'], ['Finish', 'Farmer Carries, 4 Bahnen']] },
    kraftU: { titel: 'Kraft Unterkörper', typ: 'strength', dauer: 60, int: 4, bloecke: [['Warm-up', 'Sprunggelenk & Hüfte, 10 Min.'], ['Kraft', 'Kniebeuge {S} × {W}'], ['Kraft', 'Rumänisches Kreuzheben, Ausfallschritte'], ['Finish', 'Schlitten ziehen, 4 Bahnen']] },
    kraftO: { titel: 'Kraft Oberkörper', typ: 'strength', dauer: 60, int: 4, bloecke: [['Warm-up', 'Schultern & Brustwirbelsäule, 8 Min.'], ['Kraft', 'Bankdrücken {S} × {W}'], ['Kraft', 'Rudern, Schulterdrücken im Wechsel'], ['Finish', 'Bizeps/Trizeps, 2 Supersätze']] },
    mix: { titel: 'Kraft + Motor', typ: 'strength', dauer: 60, int: 4, bloecke: [['Warm-up', 'Ruderergometer 5 Min. locker'], ['Kraft', 'Kettlebell-Swings, Goblet Squats {S}'], ['Motor', '12 Min. Zirkel: Bike, Liegestütz, Ausfallschritte'], ['Finish', 'Dehnen, 5 Min.']] },
    kondiInt: { titel: 'Intervalle', typ: 'conditioning', dauer: 45, int: 4, bloecke: [['Warm-up', 'Rudern & Bike, 8 Min. steigernd'], ['Intervalle', '8 × 1 Min. zügig / 1 Min. locker'], ['Zusatz', 'Schlitten schieben, 4 Bahnen'], ['Cool-down', '5 Min. locker ausrudern']] },
    kondiGA: { titel: 'Grundlage', typ: 'conditioning', dauer: 45, int: 2, bloecke: [['Ausdauer', '30–40 Min. gleichmäßig, Sie können noch sprechen'], ['Wechsel', 'alle 10 Min. Gerät: Rudern, Bike, SkiErg'], ['Finish', 'Mobility für Hüfte, 5 Min.']] },
    kondiZirkel: { titel: 'Zirkel 30', typ: 'conditioning', dauer: 30, int: 3, bloecke: [['Zirkel', '6 Stationen à 40 Sek., 20 Sek. Pause'], ['Runden', '3–4 Durchgänge'], ['Finish', 'Atmung & Dehnen, 3 Min.']] },
    boxTech: { titel: 'Boxtechnik', typ: 'boxing', dauer: 60, int: 3, bloecke: [['Warm-up', 'Seilspringen, Schattenboxen'], ['Technik', 'Stand, Deckung, Gerade – an der Pratze'], ['Kombis', 'Gerade–Gerade–Haken, Partnerarbeit'], ['Finish', 'Rumpf, 3 Runden']] },
    boxBag: { titel: 'Sandsack-Runden', typ: 'boxing', dauer: 45, int: 4, bloecke: [['Warm-up', 'Footwork-Leiter, 6 Min.'], ['Runden', '6 × 2 Min. am Sack, 1 Min. Pause'], ['Fokus', 'Deckung oben halten, ausatmen beim Schlag'], ['Finish', 'Schultern lockern']] },
    boxKondi: { titel: 'Boxfitness', typ: 'boxing', dauer: 45, int: 4, bloecke: [['Warm-up', 'Seilspringen, 3 × 2 Min.'], ['Runden', 'Schattenboxen & Footwork nach Rundenuhr'], ['Motor', 'Burpees, Sprints im Wechsel'], ['Finish', 'Dehnen, 5 Min.']] },
    mobFlow: { titel: 'Mobility Flow', typ: 'mobility', dauer: 45, int: 1, bloecke: [['Atmung', '3 Min. ruhig ankommen'], ['Flow', 'Hüfte, Wirbelsäule, Schultern in Folgen'], ['Halten', 'Dehnpositionen je 60–90 Sek.']] },
    mobHuefte: { titel: 'Hüfte & Rücken', typ: 'mobility', dauer: 40, int: 2, bloecke: [['Mobilisation', '90/90-Sitz, Hüftbeuger, Cat-Cow'], ['Kraft', 'Glute Bridge, Bird-Dog {S}'], ['Halten', 'Tiefe Hocke, 3 × 45 Sek.']] },
    mobSchulter: { titel: 'Schulter & Brust', typ: 'mobility', dauer: 40, int: 2, bloecke: [['Mobilisation', 'Brustwirbelsäule über der Rolle'], ['Kraft', 'Band-Übungen für die Schulter {S}'], ['Halten', 'Hängen an der Stange, 3 × 20 Sek.']] }
  };
  var PAUSE_TAGE = [
    { titel: 'Erholung', bloecke: [['Bewegen', '30 Min. Spaziergang oder Rad'], ['Mobility', '10 Min. nach Lust und Gefühl']] },
    { titel: 'Pause', bloecke: [['Erholen', 'Schlaf, Essen und Trinken zählen mit'], ['Optional', 'Stretch & Restore im Studio']] }
  ];

  /* ------------------------------------------------------------------
     Helfer
     ------------------------------------------------------------------ */
  var doc = document.documentElement;
  var qs = function (s, r) { return (r || document).querySelector(s); };
  var qsa = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var pad2 = function (n) { return (n < 10 ? '0' : '') + n; };
  var dprMax = function () { return Math.min(window.devicePixelRatio || 1, 2); };
  var euro = function (v, forceCents) {
    var hasCents = Math.abs(v - Math.round(v)) > 0.001;
    return v.toLocaleString('de-DE', { minimumFractionDigits: (hasCents || forceCents) ? 2 : 0, maximumFractionDigits: 2 }) + ' €';
  };
  var el = function (tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  var motionOff = doc.classList.contains('motion-off');
  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduced = function () { return motionOff || mqReduce.matches; };
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  var mqDesk = window.matchMedia('(min-width: 900px)');
  var hasGSAP = !!(window.gsap && window.ScrollTrigger);
  var lenis = null;
  var scrollVel = 0;   // px/s, geglättet

  function safe(name, fn) {
    try { fn(); } catch (err) { if (window.console) console.warn('[FORGE] ' + name + ':', err); }
  }
  /* Ruft onChange(true/false) auf, wenn das Element sichtbar wird/verschwindet */
  function watchVisible(node, onChange, margin) {
    if (!('IntersectionObserver' in window)) { onChange(true); return; }
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { onChange(e.isIntersecting); });
    }, { rootMargin: margin || '0px' }).observe(node);
  }
  function scrollToEl(target) {
    if (!target) return;
    var hdr = parseInt(getComputedStyle(doc).getPropertyValue('--hdr'), 10) || 72;
    if (lenis) {
      lenis.scrollTo(target, { offset: -(hdr + 12), duration: 1.2 });
    } else {
      var y = target.getBoundingClientRect().top + window.pageYOffset - hdr - 12;
      window.scrollTo({ top: y, behavior: reduced() ? 'auto' : 'smooth' });
    }
  }
  function focusEl(target) {
    if (!target) return;
    if (!target.hasAttribute('tabindex') && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(target.tagName)) target.setAttribute('tabindex', '-1');
    try { target.focus({ preventScroll: true }); } catch (e) { target.focus(); }
  }

  /* ------------------------------------------------------------------
     Berliner Zeit (Override zum Testen: ?jetzt=Di-18:45)
     ------------------------------------------------------------------ */
  var fmtParts = null;
  try {
    fmtParts = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  } catch (e) { fmtParts = null; }
  var override = (function () {
    var m = /[?&]jetzt=([A-Za-z]{2})-(\d{1,2}):(\d{2})/.exec(location.search);
    if (!m) return null;
    var idx = TAGE_KURZ.map(function (t) { return t.toLowerCase(); }).indexOf(m[1].toLowerCase());
    if (idx < 0) return null;
    return { planDay: idx, mins: (+m[2]) * 60 + (+m[3]) };
  })();
  var WD = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
  function berlinNow() {
    var d = new Date(), planDay, mins, secs = d.getSeconds(), y, mo, da;
    if (fmtParts) {
      var p = {};
      fmtParts.formatToParts(d).forEach(function (x) { p[x.type] = x.value; });
      planDay = WD[p.weekday]; mins = (+p.hour % 24) * 60 + (+p.minute); secs = +p.second;
      y = +p.year; mo = +p.month; da = +p.day;
    } else {
      planDay = (d.getDay() + 6) % 7; mins = d.getHours() * 60 + d.getMinutes();
      y = d.getFullYear(); mo = d.getMonth() + 1; da = d.getDate();
    }
    if (override) {
      var diff = override.planDay - planDay;
      var dd = new Date(Date.UTC(y, mo - 1, da + diff));
      y = dd.getUTCFullYear(); mo = dd.getUTCMonth() + 1; da = dd.getUTCDate();
      planDay = override.planDay; mins = override.mins; secs = 0;
    }
    return { planDay: planDay, jsDay: (planDay + 1) % 7, mins: mins, secs: secs, y: y, mo: mo, da: da };
  }
  function weekDates(now) {
    // Datum (TT.MM.) für Mo–So der aktuellen Woche
    var out = [];
    for (var i = 0; i < 7; i++) {
      var dd = new Date(Date.UTC(now.y, now.mo - 1, now.da + (i - now.planDay)));
      out.push(pad2(dd.getUTCDate()) + '.' + pad2(dd.getUTCMonth() + 1) + '.');
    }
    return out;
  }
  var toMin = function (t) { var a = t.split(':'); return (+a[0]) * 60 + (+a[1]); };
  var hhmm = function (m) { return pad2(Math.floor(m / 60) % 24) + ':' + pad2(m % 60); };

  /* ------------------------------------------------------------------
     Smooth Scroll (Lenis) + ScrollTrigger
     ------------------------------------------------------------------ */
  function initScroll() {
    if (hasGSAP) gsap.registerPlugin(ScrollTrigger);
    if (!reduced() && window.Lenis && hasGSAP) {
      lenis = new window.Lenis({ lerp: 0.11, smoothWheel: true, anchors: false });
      window.__lenis = lenis;
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    }
    // globale, geglättete Scroll-Geschwindigkeit
    var lastY = window.pageYOffset, lastT = performance.now();
    var tick = function () {
      var now = performance.now(), y = window.pageYOffset, dt = Math.max(1, now - lastT);
      var v = lenis ? lenis.velocity * 60 : (y - lastY) / dt * 1000;
      scrollVel = lerp(scrollVel, v, 0.2);
      if (Math.abs(scrollVel) < 0.5) scrollVel = 0;
      lastY = y; lastT = now;
    };
    if (hasGSAP) gsap.ticker.add(tick);
    else (function loop() { tick(); requestAnimationFrame(loop); })();

    // Anker-Links: sanft scrollen und Fokus setzen
    document.addEventListener('click', function (ev) {
      var a = ev.target.closest && ev.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var target = document.getElementById(id.slice(1));
      if (!target) return;
      ev.preventDefault();
      var menu = qs('#menu');
      if (menu && menu.open) menu.close();
      scrollToEl(target);
      focusEl(target);
      if (history.replaceState) history.replaceState(null, '', id);
    });
  }

  /* ------------------------------------------------------------------
     Header, Fortschritt, aktiver Menüpunkt
     ------------------------------------------------------------------ */
  function initHeader() {
    var hdr = qs('.hdr'), bar = qs('.progress__bar');
    var lastY = window.pageYOffset, ticking = false;
    function update() {
      ticking = false;
      var y = window.pageYOffset, max = Math.max(1, doc.scrollHeight - window.innerHeight);
      if (bar) bar.style.transform = 'scaleX(' + clamp(y / max, 0, 1).toFixed(4) + ')';
      hdr.classList.toggle('is-solid', y > 40);
      var menuOpen = qs('#menu') && qs('#menu').open;
      var focusIn = hdr.contains(document.activeElement);
      if (y > 480 && y > lastY + 4 && !menuOpen && !focusIn) hdr.classList.add('is-hidden');
      else if (y < lastY - 4 || y < 480) hdr.classList.remove('is-hidden');
      lastY = y;
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    hdr.addEventListener('focusin', function () { hdr.classList.remove('is-hidden'); });
    update();

    // aktiver Navigationspunkt
    var links = qsa('.hdr__nav a');
    if ('IntersectionObserver' in window && links.length) {
      var map = {};
      links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          var a = map[e.target.id];
          if (!a) return;
          if (e.isIntersecting) {
            links.forEach(function (l) { l.removeAttribute('aria-current'); });
            a.setAttribute('aria-current', 'true');
          }
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
    }
  }

  /* ------------------------------------------------------------------
     Mobiles Menü
     ------------------------------------------------------------------ */
  function initMenu() {
    var dlg = qs('#menu'), openBtn = qs('[data-menu-open]'), closeBtn = qs('[data-menu-close]');
    if (!dlg || !openBtn || typeof dlg.showModal !== 'function') {
      if (openBtn) openBtn.addEventListener('click', function () { var n = qs('.hdr__nav'); if (n) n.style.display = 'block'; });
      return;
    }
    qsa('.menu__list li', dlg).forEach(function (li, i) { li.style.setProperty('--i', i); });
    openBtn.setAttribute('aria-expanded', 'false');
    openBtn.addEventListener('click', function () {
      dlg.showModal();
      openBtn.setAttribute('aria-expanded', 'true');
      if (lenis) lenis.stop();
    });
    closeBtn.addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('close', function () {
      openBtn.setAttribute('aria-expanded', 'false');
      if (lenis) lenis.start();
    });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  }

  /* ------------------------------------------------------------------
     Status: geöffnet, Öffnungszeiten-Tabelle, Live-Kurs
     ------------------------------------------------------------------ */
  function openState(now) {
    var o = OEFFNUNG[now.jsDay];
    var open = now.mins >= o[0] * 60 && now.mins < o[1] * 60;
    var text;
    if (open) text = 'bis ' + o[1] + ' Uhr';
    else if (now.mins < o[0] * 60) text = 'öffnet ' + o[0] + ' Uhr';
    else text = 'öffnet morgen ' + OEFFNUNG[(now.jsDay + 1) % 7][0] + ' Uhr';
    return { open: open, text: text };
  }
  function initStatus() {
    var status = qs('[data-status]'), hoursNow = qs('[data-hours-now]');
    function run() {
      var now = berlinNow(), st = openState(now);
      if (status) {
        var t = qs('.status__text', status);
        t.textContent = '';
        var b = el('b', null, st.open ? 'Jetzt geöffnet' : 'Geschlossen');
        t.appendChild(b);
        t.appendChild(document.createTextNode(' · ' + st.text));
        status.classList.toggle('is-open', st.open);
      }
      if (hoursNow) {
        hoursNow.textContent = st.open ? 'Jetzt geöffnet' : 'Geschlossen';
        hoursNow.className = 'hours__now ' + (st.open ? 'is-open' : 'is-closed');
      }
      qsa('[data-hours] tr[data-days]').forEach(function (tr) {
        tr.classList.toggle('is-today', +tr.getAttribute('data-days') === now.jsDay);
      });
    }
    run();
    setInterval(run, 30000);
  }

  /* ------------------------------------------------------------------
     Kursplan: Filter, Tabs, Live-Markierung, Dialog
     ------------------------------------------------------------------ */
  var kurse = [];
  function readKurse() {
    kurse = qsa('.kurs').map(function (li) {
      var tag = li.closest('.woche__tag');
      return {
        li: li,
        day: +tag.getAttribute('data-tag'),
        typ: li.getAttribute('data-typ'),
        level: li.getAttribute('data-level'),
        coach: li.getAttribute('data-coach'),
        start: li.getAttribute('data-start'),
        ende: li.getAttribute('data-ende'),
        raum: li.getAttribute('data-raum'),
        name: qs('.kurs__name', li).textContent
      };
    });
  }

  function initPlan() {
    readKurse();
    var form = qs('[data-filters]'), woche = qs('[data-woche]'), count = qs('[data-plan-count]');
    var tabsBox = qs('[data-day-tabs]'), tabs = qsa('[data-day-tabs] [role="tab"]');
    var tage = qsa('.woche__tag');
    var now = berlinNow(), dates = weekDates(now);
    var activeDay = now.planDay;

    // Datum + Heute in die Tagesköpfe, Live-Zeile in jede Karte
    tage.forEach(function (tag, i) {
      var kopf = qs('.woche__kopf', tag);
      var d = el('span', 'woche__datum', dates[i]);
      kopf.appendChild(d);
      if (i === now.planDay) { tag.classList.add('is-today'); qs('.woche__heute', kopf).hidden = false; }
    });
    kurse.forEach(function (k) {
      var live = el('span', 'kurs__live');
      live.setAttribute('aria-hidden', 'true');
      qs('.kurs__btn', k.li).appendChild(live);
      var sr = el('span', 'sr-only kurs__sr');
      qs('.kurs__btn', k.li).appendChild(sr);
    });

    // --- Filter
    function apply(animate) {
      var fd = new FormData(form);
      var typ = fd.get('typ') || 'alle', level = fd.get('level') || 'alle', coach = fd.get('coach') || 'alle';
      var n = 0, shown = [];
      kurse.forEach(function (k) {
        var ok = (typ === 'alle' || k.typ === typ) &&
          (level === 'alle' || k.level === level || k.level === 'alle') &&
          (coach === 'alle' || k.coach === coach);
        var was = !k.li.classList.contains('is-out');
        k.li.classList.toggle('is-out', !ok);
        if (ok) { n++; if (!was || animate) shown.push(k.li); }
      });
      tage.forEach(function (tag) {
        var any = qsa('.kurs:not(.is-out)', tag).length > 0;
        qs('.woche__leer', tag).hidden = any;
      });
      count.textContent = n === 0 ? 'Kein Kurs' : (n === 1 ? '1 Kurs' : n + ' Kurse');
      tabs.forEach(function (t) {
        var d = +t.getAttribute('data-day');
        var c = kurse.filter(function (k) { return k.day === d && !k.li.classList.contains('is-out'); }).length;
        t.setAttribute('aria-label', TAGE[d] + ', ' + (c === 1 ? '1 Kurs' : c + ' Kurse'));
      });
      if (!reduced() && shown.length && shown.length < 60) {
        shown.slice(0, 24).forEach(function (li, i) {
          if (li.animate) li.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 240, delay: i * 18, easing: 'cubic-bezier(0.23, 1, 0.32, 1)', fill: 'backwards' });
        });
      }
    }
    form.addEventListener('change', function () { apply(false); });
    form.addEventListener('reset', function () { setTimeout(function () { apply(false); }, 0); });
    apply(false);
    window.__forgeSetTyp = function (typ) {
      var r = qs('input[name="typ"][value="' + typ + '"]', form);
      if (r) { r.checked = true; apply(true); }
    };
    qsa('[data-filter-jump]').forEach(function (b) {
      b.addEventListener('click', function () {
        window.__forgeSetTyp(b.getAttribute('data-filter-jump'));
        var sec = qs('#kursplan');
        scrollToEl(sec);
        focusEl(qs('#plan-title'));
      });
    });

    // --- Tabs (schmale Bildschirme)
    function selectTab(d, focus) {
      activeDay = d;
      tabs.forEach(function (t) {
        var on = +t.getAttribute('data-day') === d;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        if (on && focus) t.focus();
      });
      tage.forEach(function (tag) { tag.classList.toggle('is-active', +tag.getAttribute('data-tag') === d); });
    }
    tabs.forEach(function (t, i) {
      var d = +t.getAttribute('data-day');
      t.id = 'tab-' + TAGE_KURZ[d].toLowerCase();
      t.textContent = '';
      t.appendChild(document.createTextNode(TAGE_KURZ[d]));
      t.appendChild(el('small', null, dates[d].slice(0, 6)));
      if (d === now.planDay) t.classList.add('is-today');
      t.addEventListener('click', function () { selectTab(d, false); });
      t.addEventListener('keydown', function (e) {
        var k = e.key, nx = null;
        if (k === 'ArrowRight') nx = (i + 1) % tabs.length;
        else if (k === 'ArrowLeft') nx = (i - 1 + tabs.length) % tabs.length;
        else if (k === 'Home') nx = 0;
        else if (k === 'End') nx = tabs.length - 1;
        if (nx !== null) { e.preventDefault(); selectTab(+tabs[nx].getAttribute('data-day'), true); }
      });
    });
    function mode() {
      var tabbed = !mqDesk.matches;
      tabsBox.hidden = !tabbed;
      woche.classList.toggle('is-tabbed', tabbed);
      tage.forEach(function (tag) {
        var d = +tag.getAttribute('data-tag');
        if (tabbed) { tag.setAttribute('role', 'tabpanel'); tag.setAttribute('aria-labelledby', 'tab-' + TAGE_KURZ[d].toLowerCase()); tag.tabIndex = -1; }
        else { tag.removeAttribute('role'); tag.setAttribute('aria-labelledby', 'tagname-' + TAGE_KURZ[d].toLowerCase()); tag.removeAttribute('tabindex'); }
      });
      selectTab(activeDay, false);
    }
    if (mqDesk.addEventListener) mqDesk.addEventListener('change', mode); else mqDesk.addListener(mode);
    mode();

    // --- Live-Markierung
    var clockEl = qs('[data-plan-clock] span');
    function live() {
      var n = berlinNow();
      if (clockEl) clockEl.textContent = 'Berlin · ' + TAGE_KURZ[n.planDay] + ' ' + hhmm(n.mins) + ' Uhr';
      var nextSet = false, liveList = [], next = null;
      kurse.slice().sort(function (a, b) { return a.day - b.day || toMin(a.start) - toMin(b.start); }).forEach(function (k) {
        var s = toMin(k.start), e = toMin(k.ende);
        var isToday = k.day === n.planDay;
        var isLive = isToday && n.mins >= s && n.mins < e;
        var isPast = isToday && n.mins >= e;
        var isNext = false;
        if (isToday && !nextSet && n.mins < s) { isNext = true; nextSet = true; next = k; }
        k.li.classList.toggle('is-live', isLive);
        k.li.classList.toggle('is-past', isPast);
        k.li.classList.toggle('is-next', isNext && !isLive);
        var lv = qs('.kurs__live', k.li), sr = qs('.kurs__sr', k.li);
        lv.textContent = '';
        sr.textContent = '';
        if (isLive) {
          var p = (n.mins - s + n.secs / 60) / (e - s);
          lv.appendChild(document.createTextNode('läuft jetzt · noch ' + (e - n.mins) + ' Min.'));
          var bar = el('i'); bar.style.setProperty('--p', p.toFixed(3)); lv.appendChild(bar);
          sr.textContent = ' – läuft gerade';
          liveList.push({ k: k, p: p, rest: e - n.mins });
        } else if (isNext && !isLive) {
          lv.textContent = 'als Nächstes · in ' + fmtDauer(s - n.mins);
          sr.textContent = ' – als Nächstes';
        }
      });
      // Hero-Widget
      var w = qs('[data-live]');
      if (w) {
        var label = qs('[data-live-label]', w), name = qs('[data-live-name]', w), meta = qs('[data-live-meta]', w), barEl = qs('[data-live-bar]', w), clk = qs('[data-clock]', w);
        clk.textContent = 'Berlin ' + hhmm(n.mins);
        w.classList.remove('is-now');
        if (liveList.length) {
          var L = liveList[liveList.length - 1];
          w.classList.add('is-now');
          label.textContent = liveList.length > 1 ? 'Läuft jetzt · ' + liveList.length + ' Kurse' : 'Läuft jetzt';
          name.textContent = L.k.name;
          meta.textContent = L.k.start + '–' + L.k.ende + ' · ' + COACHES[L.k.coach] + ' · noch ' + L.rest + ' Min.';
          barEl.style.setProperty('--p', L.p.toFixed(3));
        } else {
          var nx = next, when;
          if (!nx) {
            for (var i = 1; i <= 7 && !nx; i++) {
              var dd = (n.planDay + i) % 7;
              var list = kurse.filter(function (k) { return k.day === dd; }).sort(function (a, b) { return toMin(a.start) - toMin(b.start); });
              if (list.length) { nx = list[0]; when = i === 1 ? 'Morgen' : TAGE[dd]; }
            }
          } else {
            when = 'in ' + fmtDauer(toMin(nx.start) - n.mins);
          }
          label.textContent = 'Als Nächstes · ' + when;
          if (nx) {
            name.textContent = nx.name;
            meta.textContent = TAGE_KURZ[nx.day] + ' ' + nx.start + '–' + nx.ende + ' · ' + COACHES[nx.coach] + ' · ' + nx.raum;
          }
          barEl.style.setProperty('--p', 0);
        }
      }
    }
    function fmtDauer(m) {
      if (m < 60) return m + ' Min.';
      var h = Math.floor(m / 60), r = m % 60;
      return h + ' Std.' + (r ? ' ' + r + ' Min.' : '');
    }
    live();
    setInterval(live, 20000);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) live(); });

    // --- Kurs-Dialog
    var dlg = qs('#kurs-dialog'), current = null, opener = null;
    if (dlg && typeof dlg.showModal === 'function') {
      kurse.forEach(function (k) {
        qs('.kurs__btn', k.li).addEventListener('click', function () {
          current = k; opener = this;
          var info = KURSINFO[k.name] || { text: '', max: 12, bring: 'Sportkleidung, Handtuch, Trinkflasche' };
          var set = function (key, v) { var n = qs('[data-k="' + key + '"]', dlg); if (n) n.textContent = v; };
          set('code', TYP[k.typ].code + ' · ' + TYP[k.typ].name);
          set('name', k.name);
          set('when', TAGE[k.day] + ', ' + k.start + '–' + k.ende + ' Uhr');
          set('text', info.text);
          set('coach', COACHES[k.coach]);
          set('level', LEVEL[k.level]);
          set('raum', k.raum);
          set('plaetze', 'max. ' + info.max + ' Personen');
          set('bring', info.bring);
          dlg.showModal();
          if (lenis) lenis.stop();
        });
      });
      dlg.addEventListener('close', function () {
        if (lenis) lenis.start();
        if (dlg.returnValue !== 'choose' && opener) opener.focus();
        dlg.returnValue = '';
      });
      dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
      qs('[data-k-choose]', dlg).addEventListener('click', function () {
        if (!current) return;
        var k = current;
        dlg.close('choose');
        var s = toMin(k.start);
        prefillForm({
          interesse: TYP[k.typ].name,
          tag: TAGE[k.day],
          zeit: s < 10 * 60 ? 'Früh' : (s < 16 * 60 ? 'Mittag' : 'Abend'),
          nachricht: 'Wunschkurs fürs Probetraining: ' + k.name + ', ' + TAGE[k.day] + ' ' + k.start + '–' + k.ende + ' Uhr (' + COACHES[k.coach] + ').'
        });
      });
    }
  }

  /* Formular vorbefüllen und hinscrollen */
  function prefillForm(o) {
    var f = qs('[data-form]'), done = qs('[data-done]');
    if (!f) return;
    if (done && !done.hidden) { done.hidden = true; f.hidden = false; }
    if (o.interesse) { var sel = qs('#k-int', f); qsa('option', sel).forEach(function (op) { if (op.textContent === o.interesse) sel.value = op.value || op.textContent; }); }
    if (o.tag) { qs('#k-tag', f).value = o.tag; }
    if (o.zeit) { qsa('input[name="zeit"]', f).forEach(function (r) { r.checked = r.nextElementSibling && r.nextElementSibling.textContent === o.zeit; }); }
    if (o.nachricht) { qs('#k-msg', f).value = o.nachricht; }
    var target = qs('#probetraining');
    scrollToEl(target);
    setTimeout(function () {
      var nm = qs('#k-name', f);
      try { nm.focus({ preventScroll: true }); } catch (e) { nm.focus(); }
      var msg = qs('#k-msg', f);
      if (!reduced()) { msg.classList.remove('is-flash'); void msg.offsetWidth; msg.classList.add('is-flash'); }
    }, reduced() ? 0 : 900);
  }

  /* ------------------------------------------------------------------
     Mitgliedschafts-Konfigurator mit Zählwerk
     ------------------------------------------------------------------ */
  function Odo(node) {
    this.node = node; this.digits = [];
    node.textContent = '';
    this.wrap = el('span', 'odo__w'); this.wrap.style.display = 'inline-flex';
    this.cents = el('span', 'odo__c');
    node.appendChild(this.wrap); node.appendChild(this.cents);
  }
  Odo.prototype.set = function (value, instant) {
    var ints = String(Math.floor(value + 1e-6));
    var cents = Math.round((value - Math.floor(value + 1e-6)) * 100);
    while (this.digits.length < ints.length) {
      var d = el('span', 'odo__d'), s = el('span', 'odo__s');
      for (var i = 0; i < 10; i++) s.appendChild(el('span', null, String(i)));
      d.appendChild(s);
      this.wrap.insertBefore(d, this.wrap.firstChild);
      this.digits.unshift(s);
      if (!instant) { s.style.transition = 'none'; s.style.transform = 'translateY(0)'; void s.offsetWidth; s.style.transition = ''; }
    }
    while (this.digits.length > ints.length) {
      var x = this.digits.shift(); this.wrap.removeChild(x.parentNode);
    }
    var self = this;
    ints.split('').forEach(function (ch, i) {
      var s = self.digits[i];
      if (instant || reduced()) s.style.transition = 'none';
      s.style.transform = 'translateY(' + (-(+ch) * 10) + '%)';
      if (instant || reduced()) { void s.offsetWidth; s.style.transition = ''; }
    });
    this.cents.textContent = cents ? ',' + pad2(cents) : '';
    this.node.style.setProperty('--len', (ints.length + (cents ? 1.3 : 0)).toFixed(2));
  };

  var cfgSummary = '';
  function initCfg() {
    var form = qs('[data-cfg]');
    if (!form) return;
    var odo = new Odo(qs('[data-odo]', form));
    var lines = qs('[data-cfg-lines]', form), nameEl = qs('[data-cfg-name]', form);
    var startEl = qs('[data-cfg-start]', form), yearEl = qs('[data-cfg-year]', form);
    var liveEl = qs('[data-cfg-live]', form), mini = qs('[data-cfg-mini]', form);
    var pt = qs('#pt-range', form), ptOut = qs('[data-pt-out]', form);
    var saunaLbl = qs('[data-extra="sauna"]', form), saunaIn = qs('input[name="sauna"]', form), saunaNote = qs('[data-sauna-note]', form);
    var saunaNoteText = saunaNote.textContent, saunaPrice = qs('.tgl__price', saunaLbl), saunaPriceText = saunaPrice.textContent;
    var saunaWas = false, prevKeys = {}, liveTimer = null, first = true;

    function fillRange(r) { var p = (r.value - r.min) / (r.max - r.min) * 100; r.style.setProperty('--fill', p + '%'); }

    function calc() {
      var fd = new FormData(form);
      var z = PREISE.zugang[fd.get('zugang') || 'kurse'], l = PREISE.laufzeit[fd.get('laufzeit') || 'm12'];
      var allIn = !!z.saunaInklusive;
      // Sauna in All Access enthalten
      if (allIn && !saunaIn.disabled) { saunaWas = saunaIn.checked; saunaIn.checked = true; saunaIn.disabled = true; saunaLbl.classList.add('is-included'); saunaNote.textContent = 'Im Tarif All Access bereits enthalten'; saunaPrice.textContent = 'inklusive'; }
      else if (!allIn && saunaIn.disabled) { saunaIn.disabled = false; saunaIn.checked = saunaWas; saunaLbl.classList.remove('is-included'); saunaNote.textContent = saunaNoteText; saunaPrice.textContent = saunaPriceText; }

      var rows = [];
      var base = z.preis + l.aufschlag;
      rows.push(['z', z.name, euro(z.preis)]);
      rows.push(['l', 'Laufzeit ' + l.name, l.aufschlag ? '+' + euro(l.aufschlag) : '0 €']);
      var total = base;
      if (fd.get('rabatt')) { var r = Math.round(base * PREISE.rabatt * 100) / 100; total -= r; rows.push(['r', 'Ermäßigung ' + Math.round(PREISE.rabatt * 100) + ' %', '−' + euro(r)]); }
      ['sauna', 'drinks', 'towel', 'offpeak'].forEach(function (key) {
        var x = PREISE.extras[key];
        if (key === 'sauna' && allIn) { rows.push(['sauna', x.name, 'inklusive']); return; }
        if (fd.get(key)) { total += x.preis; rows.push([key, x.name, (x.preis < 0 ? '−' : '+') + euro(Math.abs(x.preis))]); }
      });
      var n = +pt.value;
      if (n) { total += n * PREISE.ptEinheit; rows.push(['pt', 'Personal Training ' + n + ' × ' + PREISE.ptEinheit + ' €', '+' + euro(n * PREISE.ptEinheit)]); }
      total = Math.round(total * 100) / 100;
      var start = l.startpaket ? PREISE.startpaket : 0;

      // Ausgabe
      ptOut.textContent = n === 1 ? '1 Einheit' : n + ' Einheiten';
      fillRange(pt);
      nameEl.textContent = z.name + ' · ' + l.name;
      odo.set(total, first);
      if (mini) mini.textContent = euro(total);
      startEl.textContent = start ? euro(start) : 'entfällt';
      yearEl.textContent = euro(Math.round((total * 12 + start) * 100) / 100);
      lines.textContent = '';
      var keys = {};
      rows.forEach(function (row) {
        var li = el('li'); li.appendChild(el('span', null, row[1])); li.appendChild(el('b', null, row[2]));
        if (!first && !prevKeys[row[0]] && !reduced()) li.classList.add('is-new');
        keys[row[0]] = true;
        lines.appendChild(li);
      });
      prevKeys = keys;
      clearTimeout(liveTimer);
      liveTimer = setTimeout(function () { liveEl.textContent = 'Monatspreis: ' + euro(total).replace(' €', ' Euro') + '.'; }, first ? 0 : 450);
      var extrasTxt = rows.filter(function (r) { return ['sauna', 'drinks', 'towel', 'offpeak', 'r', 'pt'].indexOf(r[0]) > -1; }).map(function (r) { return r[1]; });
      cfgSummary = 'Tarifwunsch: ' + z.name + ', ' + l.name + (extrasTxt.length ? ' – ' + extrasTxt.join(', ') : '') + '. Beispielpreis laut Rechner: ' + euro(total, true) + ' pro Monat.';
      first = false;
    }
    form.addEventListener('input', calc);
    form.addEventListener('change', calc);
    calc();
    qs('[data-cfg-cta]', form).addEventListener('click', function () {
      prefillForm({ nachricht: cfgSummary });
    });

    // Mini-Preis (Handy): sichtbar, solange die Optionen, aber nicht der Bon im Bild sind
    var miniBox = qs('.cfg__mini', form);
    if (miniBox && 'IntersectionObserver' in window) {
      var ctrlIn = false, bonIn = false;
      var upd = function () { miniBox.classList.toggle('is-on', ctrlIn && !bonIn); };
      new IntersectionObserver(function (e) { ctrlIn = e[0].isIntersecting; upd(); }, { rootMargin: '-30% 0px -30% 0px' }).observe(qs('.cfg__controls', form));
      new IntersectionObserver(function (e) { bonIn = e[0].isIntersecting; upd(); }).observe(qs('.bon', form));
    }
  }

  /* ------------------------------------------------------------------
     Trainingsplan-Generator
     ------------------------------------------------------------------ */
  var planText = '';
  function initGen() {
    var form = qs('[data-gen]');
    if (!form) return;
    var cardsEl = qs('[data-plan-cards]'), titleEl = qs('[data-plan-title]'), liveEl = qs('[data-plan-live]');
    var warn = qs('[data-gen-warn]', form), range = qs('#gen-tage', form), out = qs('[data-tage-out]', form);
    var first = true;

    function suggest(day, typ, erf) {
      var list = kurse.filter(function (k) { return k.day === day && k.typ === typ; });
      if (erf === 'neu') list = list.filter(function (k) { return k.level !== 'fortgeschritten'; });
      var pref = erf === 'neu' ? 'einsteiger' : (erf === 'profi' ? 'fortgeschritten' : 'alle');
      list.sort(function (a, b) {
        var pa = a.level === pref ? 0 : 1, pb = b.level === pref ? 0 : 1;
        return pa - pb || toMin(b.start) - toMin(a.start);
      });
      return list[0] || null;
    }
    function meter(n, light) {
      var m = el('div', 'meter');
      m.setAttribute('role', 'img');
      m.setAttribute('aria-label', 'Intensität ' + n + ' von 5');
      m.appendChild(el('span', null, 'Intensität'));
      for (var i = 1; i <= 5; i++) m.appendChild(el('i', i <= n ? 'on' : null));
      return m;
    }
    function build() {
      var fd = new FormData(form);
      var zielKey = fd.get('ziel') || 'kraft', erfKey = fd.get('erfahrung') || 'neu', n = +range.value;
      var ziel = PLAN_ZIELE[zielKey], erf = PLAN_ERFAHRUNG[erfKey];
      var units = ziel.plaene[n], days = PLAN_TAGE[n];
      out.textContent = n + ' Tage';
      var p = (n - range.min) / (range.max - range.min) * 100; range.style.setProperty('--fill', p + '%');
      titleEl.textContent = ziel.name + ' · ' + n + ' Tage · ' + erf.name;
      if (erfKey === 'neu' && n >= 5) {
        warn.hidden = false;
        warn.textContent = 'Hinweis: Für den Einstieg empfehlen unsere Coaches zwei bis vier Trainingstage – Erholung gehört zum Plan. Im Probetraining stimmen Sie das gemeinsam ab.';
      } else warn.hidden = true;

      var txt = ['FORGE Athletic Club – Wochenplan', ziel.name + ' · ' + n + ' Trainingstage · ' + erf.name, ''];
      cardsEl.textContent = '';
      var t = 0, r = 0;
      for (var d = 0; d < 7; d++) {
        var li = el('li', 'pcard');
        var idx = days.indexOf(d);
        var head = el('p', 'pcard__day');
        head.appendChild(el('b', null, TAGE_KURZ[d]));
        if (idx > -1) {
          var u = EINHEITEN[units[idx]];
          var dauer = Math.max(30, u.dauer + erf.dauer);
          var inten = clamp(u.int + erf.int, 1, 5);
          head.appendChild(el('span', null, 'Training ' + (++t)));
          li.appendChild(head);
          li.appendChild(el('h3', 'pcard__title', u.titel));
          var meta = el('p', 'pcard__meta');
          meta.appendChild(el('span', null, dauer + ' Min.'));
          meta.appendChild(el('span', null, TYP[u.typ].code));
          meta.appendChild(el('span', null, erf.tipp));
          li.appendChild(meta);
          li.appendChild(meter(inten));
          var ul = el('ul', 'pcard__blocks');
          var tx = [TAGE[d].toUpperCase() + ' – ' + u.titel + ' (' + dauer + ' Min., Intensität ' + inten + '/5)'];
          u.bloecke.forEach(function (b) {
            var text = b[1].replace('{S}', erf.saetze).replace('{W}', erf.wdh);
            var bl = el('li'); bl.appendChild(el('b', null, b[0])); bl.appendChild(el('span', null, text)); ul.appendChild(bl);
            tx.push('  · ' + b[0] + ': ' + text);
          });
          li.appendChild(ul);
          var k = suggest(d, u.typ, erfKey);
          var kp = el('p', 'pcard__kurs');
          kp.appendChild(el('b', null, k ? 'Passender Kurs' : 'Open Gym'));
          kp.appendChild(document.createTextNode(k ? k.name + ' · ' + k.start + ' Uhr · ' + COACHES[k.coach].split(' ')[0] : 'Kein passender Kurs – Plan frei trainieren'));
          li.appendChild(kp);
          tx.push('  → ' + (k ? 'Kurs: ' + k.name + ', ' + k.start + '–' + k.ende + ' Uhr (' + COACHES[k.coach] + ')' : 'Open Gym, frei nach Plan'));
          txt = txt.concat(tx, ['']);
        } else {
          var pz = PAUSE_TAGE[r++ % PAUSE_TAGE.length];
          li.classList.add('pcard--rest');
          head.appendChild(el('span', null, 'Ruhetag'));
          li.appendChild(head);
          li.appendChild(el('h3', 'pcard__title', pz.titel));
          li.appendChild(meter(1));
          var ul2 = el('ul', 'pcard__blocks');
          pz.bloecke.forEach(function (b) { var bl = el('li'); bl.appendChild(el('b', null, b[0])); bl.appendChild(el('span', null, b[1])); ul2.appendChild(bl); });
          li.appendChild(ul2);
          txt.push(TAGE[d].toUpperCase() + ' – ' + pz.titel + ': ' + pz.bloecke.map(function (b) { return b[1]; }).join('; '), '');
        }
        if (!first && !motionOff) { li.classList.add('is-deal'); li.style.setProperty('--i', d); }
        cardsEl.appendChild(li);
      }
      txt.push('Orientierung, kein medizinischer Rat. Bei Vorerkrankungen oder Schmerzen Training bitte vorab ärztlich abklären.', 'Probetraining: 030 555 81 20 · hello@forge-athletic.de');
      planText = txt.join('\n');
      if (!first) liveEl.textContent = 'Wochenplan aktualisiert: ' + ziel.name + ', ' + n + ' Trainingstage, ' + erf.name + '.';
      first = false;
    }
    form.addEventListener('input', build);
    form.addEventListener('change', build);
    build();

    // Aktionen
    var btnPrint = qs('[data-plan-print]'), btnDl = qs('[data-plan-dl]'), btnCopy = qs('[data-plan-copy]');
    function done(btn, label) {
      var span = qs('span', btn) || btn;
      var old = span.getAttribute('data-label') || span.textContent;
      span.setAttribute('data-label', old);
      span.textContent = label;
      btn.classList.add('is-done');
      clearTimeout(btn._t);
      btn._t = setTimeout(function () { span.textContent = old; btn.classList.remove('is-done'); }, 2000);
    }
    btnPrint.addEventListener('click', function () { window.print(); });
    btnDl.addEventListener('click', function () {
      var blob = new Blob([planText], { type: 'text/plain;charset=utf-8' });
      var url = URL.createObjectURL(blob), a = document.createElement('a');
      a.href = url; a.download = 'forge-wochenplan.txt';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    });
    btnCopy.addEventListener('click', function () {
      var ok = function () { done(btnCopy, 'Kopiert'); liveEl.textContent = 'Plan in die Zwischenablage kopiert.'; };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(planText).then(ok, fallback);
      } else fallback();
      function fallback() {
        var ta = el('textarea'); ta.value = planText; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); ok(); } catch (e) { done(btnCopy, 'Nicht möglich'); }
        ta.remove();
      }
    });
  }

  /* ------------------------------------------------------------------
     Coach-Karten (3D-Flip)
     ------------------------------------------------------------------ */
  function initCoaches() {
    qsa('[data-coach-card]').forEach(function (card) {
      var front = qs('.coach__flip', card), back = qs('.coach__back', card);
      var name = qs('.coach__name', card).textContent;
      var backBtn = el('button', 'coach__flip-back');
      backBtn.type = 'button';
      backBtn.setAttribute('aria-label', 'Zurück zur Vorderseite von ' + name);
      backBtn.tabIndex = -1;
      var NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg'), use = document.createElementNS(NS, 'use');
      svg.setAttribute('aria-hidden', 'true'); use.setAttribute('href', '#i-close'); svg.appendChild(use); backBtn.appendChild(svg);
      back.appendChild(backBtn);
      function set(on, focus) {
        card.classList.toggle('is-flipped', on);
        front.setAttribute('aria-pressed', on ? 'true' : 'false');
        front.tabIndex = on ? -1 : 0;
        backBtn.tabIndex = on ? 0 : -1;
        if (focus) (on ? backBtn : front).focus({ preventScroll: true });
      }
      front.addEventListener('click', function (e) { e.stopPropagation(); set(!card.classList.contains('is-flipped'), e.detail === 0); });
      backBtn.addEventListener('click', function (e) { e.stopPropagation(); set(false, e.detail === 0); });
      card.addEventListener('click', function () {
        if (finePointer.matches) return; // Maus: Hover dreht, Button hält fest
        set(!card.classList.contains('is-flipped'), false);
      });
      card.addEventListener('keydown', function (e) { if (e.key === 'Escape' && card.classList.contains('is-flipped')) set(false, true); });
    });
  }

  /* ------------------------------------------------------------------
     Zähler
     ------------------------------------------------------------------ */
  function initCounters() {
    qsa('[data-count]').forEach(function (n) {
      var target = +n.getAttribute('data-count'), de = n.getAttribute('data-format') === 'de';
      var fmt = function (v) { return de ? Math.round(v).toLocaleString('de-DE') : String(Math.round(v)); };
      if (reduced()) { n.textContent = fmt(target); return; }
      n.textContent = fmt(0);
      var started = false;
      watchVisible(n, function (vis) {
        if (!vis || started) return;
        started = true;
        var t0 = performance.now(), dur = 1400;
        (function step(t) {
          var p = clamp((t - t0) / dur, 0, 1), e = 1 - Math.pow(1 - p, 4);
          n.textContent = fmt(target * e);
          if (p < 1) requestAnimationFrame(step);
        })(t0);
      });
    });
  }

  /* ------------------------------------------------------------------
     Reveal-Choreografie
     ------------------------------------------------------------------ */
  function initReveal() {
    if (motionOff || !('IntersectionObserver' in window)) return;
    var groups = [
      ['.sec .kicker, .disc__intro .kicker', 'rv'],
      ['.sec .h2, .disc__intro .h2', 'rv-clip'],
      ['.sec__aside, .disc__lead, .filters, .woche, .legend, .cfg__controls, .bon, .pricelist, .gen, .planout, .jobs, .halle__text > p, .founder, .day__head, .watch, .score__stars, .map-info .ways li, .hours, .areas, .map, .faq-more, .contact__side > p, .contact__list, .form', 'rv'],
      ['.coach, .stats li, .quote, .lap, .faq details', 'rv'],
      ['.shot, .laps__photo', 'rv-img']
    ];
    if (!doc.classList.contains('has-hscroll')) groups.push(['.panel', 'rv']);
    if (!doc.classList.contains('has-strip')) groups.push(['.frame', 'rv']);
    // clip-path am Ziel kann die Schnittmenge auf 0 setzen → bei rv-clip das Elternelement beobachten
    var io = new IntersectionObserver(function (entries) {
      var batch = [];
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        (e.target.__rv || []).forEach(function (n) { batch.push(n); });
        io.unobserve(e.target);
      });
      batch.sort(function (a, b) { return a.getBoundingClientRect().top - b.getBoundingClientRect().top || a.getBoundingClientRect().left - b.getBoundingClientRect().left; });
      batch.forEach(function (t, i) {
        t.style.setProperty('--d', Math.min(i, 8) * 60 + 'ms');
        t.classList.add('is-in');
        setTimeout(function () { t.style.removeProperty('--d'); }, 1600);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0 });
    groups.forEach(function (g) {
      qsa(g[0]).forEach(function (n) {
        if (n.closest('.hero') || n.classList.contains('rv') || n.classList.contains('rv-clip')) return;
        n.classList.add(g[1]);
        var target = g[1] === 'rv-clip' ? n.parentElement : n;
        while (target !== n && target.parentElement && getComputedStyle(target).display === 'contents') target = target.parentElement;
        target.__rv = (target.__rv || []).concat(n);
        io.observe(target);
      });
    });
    // Karte: Route zeichnen
    var map = qs('.map');
    if (map) watchVisible(map, function (v) { if (v) map.classList.add('is-in'); }, '0px 0px -20% 0px');
  }

  /* ------------------------------------------------------------------
     Hero: Intro, Kinetik, Canvas, Stoppuhr
     ------------------------------------------------------------------ */
  function initHeroIntro() {
    var go = function () {
      requestAnimationFrame(function () {
        doc.classList.add('hero-in');
        setTimeout(function () { doc.classList.add('hero-done'); }, 1700);
      });
    };
    if (document.fonts && document.fonts.ready && !reduced()) {
      var fired = false, once = function () { if (!fired) { fired = true; go(); } };
      document.fonts.ready.then(once);
      setTimeout(once, 600);
    } else go();
  }

  function initHeroKinetic() {
    if (!hasGSAP || reduced()) return;
    var hero = qs('.hero'), title = qs('.hero__title');
    var lines = qsa('.kin', title);
    var dirs = [-26, 30, -18];
    lines.forEach(function (ln, i) {
      gsap.to(ln, { xPercent: dirs[i], ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6 } });
    });
    gsap.to('.hero__photo', { yPercent: -18, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6 } });
    // Geschwindigkeit → Neigung + Bewegungsunschärfe-Echo
    var skewTo = gsap.quickTo(title, 'skewX', { duration: 0.5, ease: 'power3' });
    var mb = 0;
    gsap.ticker.add(function () {
      var v = clamp(scrollVel / 2600, -1, 1);
      skewTo(-v * 9);
      mb = lerp(mb, Math.abs(v), 0.15);
      if (mb < 0.002) mb = 0;
      title.style.setProperty('--mb', mb.toFixed(3));
    });
  }

  function initHeroCanvas() {
    var cv = qs('.hero__canvas'), hero = qs('.hero');
    if (!cv || !cv.getContext) return;
    var ctx = cv.getContext('2d');
    var W = 0, H = 0, dpr = 1, streaks = [], dust = [], running = false, visible = true, raf = 0, last = 0;
    var boost = 0, px = 0.5, py = 0.45, tpx = 0.5, tpy = 0.45;

    function sprite(r, g, b) {
      var c = document.createElement('canvas'); c.width = 256; c.height = 4;
      var x = c.getContext('2d'), gr = x.createLinearGradient(0, 0, 256, 0);
      gr.addColorStop(0, 'rgba(' + r + ',' + g + ',' + b + ',0)');
      gr.addColorStop(0.75, 'rgba(' + r + ',' + g + ',' + b + ',.55)');
      gr.addColorStop(1, 'rgba(' + r + ',' + g + ',' + b + ',1)');
      x.fillStyle = gr; x.fillRect(0, 0, 256, 4);
      return c;
    }
    var sChalk = sprite(242, 242, 238), sGlut = sprite(255, 59, 47);

    function seed(s, initial) {
      var depth = Math.random();
      s.depth = depth;
      // Spuren sammeln sich in drei „Bahnen“
      var lane = [0.22, 0.52, 0.8][Math.floor(Math.random() * 3)];
      s.y = clamp(lane + (Math.random() - 0.5) * 0.34, 0.02, 0.98);
      s.v = 90 + Math.pow(depth, 2) * 1100;
      s.len = 30 + s.v * 0.32;
      s.th = 0.6 + depth * 2.2;
      s.a = 0.05 + depth * 0.4;
      s.red = Math.random() < 0.13;
      s.x = initial ? Math.random() * (W + s.len) : -s.len - Math.random() * W * 0.5;
    }
    function resize() {
      var r = hero.getBoundingClientRect();
      dpr = dprMax(); W = Math.max(1, r.width); H = Math.max(1, r.height);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(clamp(W / 18, 26, 90));
      streaks = []; dust = [];
      for (var i = 0; i < n; i++) { var s = {}; seed(s, true); streaks.push(s); }
      var m = Math.round(clamp(W / 28, 18, 60));
      for (var j = 0; j < m; j++) dust.push({ x: Math.random() * W, y: Math.random() * H, r: 0.5 + Math.random() * 1.4, vy: 6 + Math.random() * 18, vx: (Math.random() - 0.5) * 8, a: 0.1 + Math.random() * 0.35, ph: Math.random() * 6.28 });
      if (!running) draw(0);
    }
    function draw(dt) {
      ctx.clearRect(0, 0, W, H);
      var target = clamp(Math.abs(scrollVel) / 900, 0, 5);
      boost = lerp(boost, target, 0.06);
      px = lerp(px, tpx, 0.05); py = lerp(py, tpy, 0.05);
      var pyAbs = py * H;
      // Streifen
      for (var i = 0; i < streaks.length; i++) {
        var s = streaks[i];
        var near = Math.max(0, 1 - Math.abs(s.y * H - pyAbs) / (H * 0.12));
        var sp = s.v * (1 + boost * (0.6 + s.depth)) * (1 + near * 0.8);
        s.x += sp * dt;
        var len = s.len * (1 + boost * 0.7 + near * 0.6);
        if (s.x - len > W) { seed(s, false); continue; }
        ctx.globalAlpha = clamp(s.a * (1 + near * 1.2), 0, s.red ? 0.85 : 0.6);
        ctx.drawImage(s.red ? sGlut : sChalk, s.x - len, s.y * H - s.th / 2, len, s.th);
      }
      // Kreidestaub
      ctx.fillStyle = '#F2F2EE';
      for (var j = 0; j < dust.length; j++) {
        var d = dust[j];
        d.y -= d.vy * dt * (1 + boost * 0.4); d.x += d.vx * dt + (px - 0.5) * 6 * dt;
        d.ph += dt * 1.5;
        if (d.y < -4) { d.y = H + 4; d.x = Math.random() * W; }
        if (d.x < -4) d.x = W + 4; else if (d.x > W + 4) d.x = -4;
        ctx.globalAlpha = d.a * (0.6 + 0.4 * Math.sin(d.ph));
        ctx.fillRect(d.x, d.y, d.r, d.r);
      }
      ctx.globalAlpha = 1;
    }
    function frame(t) {
      raf = 0;
      if (!running) return;
      var dt = last ? Math.min(0.05, (t - last) / 1000) : 0.016;
      last = t;
      draw(dt);
      raf = requestAnimationFrame(frame);
    }
    function start() { if (running || reduced()) return; running = true; last = 0; raf = requestAnimationFrame(frame); }
    function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }
    function sync() { if (visible && !document.hidden) start(); else stop(); }

    resize();
    if (reduced()) {
      // statisches Standbild
      for (var k = 0; k < 3; k++) draw(0.02);
    }
    if ('ResizeObserver' in window) new ResizeObserver(function () { resize(); }).observe(hero);
    else window.addEventListener('resize', resize);
    watchVisible(hero, function (v) { visible = v; sync(); });
    document.addEventListener('visibilitychange', sync);
    if (finePointer.matches) {
      hero.addEventListener('pointermove', function (e) {
        var r = hero.getBoundingClientRect();
        tpx = (e.clientX - r.left) / r.width; tpy = (e.clientY - r.top) / r.height;
      });
      hero.addEventListener('pointerleave', function () { tpx = 0.5; tpy = 0.45; });
    }
    sync();
  }

  function initHeroTilt() {
    if (reduced() || !finePointer.matches) return;
    var hero = qs('.hero'), frame = qs('.hero__frame');
    if (!frame) return;
    var tx = 0, ty = 0, x = 0, y = 0, on = false;
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 2; ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
      if (!on) { on = true; requestAnimationFrame(loop); }
    });
    hero.addEventListener('pointerleave', function () { tx = 0; ty = 0; });
    function loop() {
      x = lerp(x, tx, 0.08); y = lerp(y, ty, 0.08);
      frame.style.transform = 'perspective(900px) rotateY(' + (x * 5).toFixed(2) + 'deg) rotateX(' + (-y * 4).toFixed(2) + 'deg) translate3d(' + (x * 6).toFixed(1) + 'px,' + (y * 6).toFixed(1) + 'px,0)';
      if (Math.abs(x - tx) > 0.001 || Math.abs(y - ty) > 0.001) requestAnimationFrame(loop); else on = false;
    }
  }

  function initTimer() {
    var t = qs('[data-rest]'), setEl = qs('[data-set]'), arc = qs('.timer__arc');
    if (!t || reduced()) return;
    var TOTAL = 90, rest = 47, set = 3, iv = null;
    function render(instant) {
      t.textContent = pad2(Math.floor(rest / 60)) + ':' + pad2(rest % 60);
      setEl.textContent = set;
      if (instant) arc.style.transition = 'none';
      arc.style.strokeDashoffset = String(100 - (rest / TOTAL) * 100);
      if (instant) { void arc.getBoundingClientRect(); arc.style.transition = ''; }
    }
    function tick() {
      rest--;
      if (rest < 0) { rest = TOTAL; set = set >= 5 ? 1 : set + 1; render(true); return; }
      render(false);
    }
    render(true);
    var vis = true;
    function sync() {
      var run = vis && !document.hidden;
      if (run && !iv) iv = setInterval(tick, 1000);
      else if (!run && iv) { clearInterval(iv); iv = null; }
    }
    watchVisible(qs('.hero'), function (v) { vis = v; sync(); });
    document.addEventListener('visibilitychange', sync);
  }

  /* ------------------------------------------------------------------
     Laufbänder
     ------------------------------------------------------------------ */
  function initBands() {
    var tracks = qsa('[data-marquee]');
    if (!tracks.length || reduced()) return;
    var vis = false, x = tracks.map(function () { return 0; }), last = 0;
    watchVisible(qs('.bands'), function (v) { vis = v; if (v) { last = 0; requestAnimationFrame(loop); } });
    function loop(t) {
      if (!vis || document.hidden) return;
      var dt = last ? Math.min(0.05, (t - last) / 1000) : 0.016; last = t;
      var v = scrollVel;
      tracks.forEach(function (tr, i) {
        var dir = +tr.getAttribute('data-marquee');
        var w = tr.scrollWidth / 2;
        var speed = (50 + Math.abs(v) * 0.35) * (v < -10 ? -1 : 1);
        x[i] += dir * speed * dt;
        if (x[i] <= -w) x[i] += w; else if (x[i] > 0) x[i] -= w;
        tr.style.transform = 'translate3d(' + x[i].toFixed(1) + 'px,0,0)';
      });
      requestAnimationFrame(loop);
    }
    document.addEventListener('visibilitychange', function () { if (!document.hidden && vis) { last = 0; requestAnimationFrame(loop); } });
  }

  /* ------------------------------------------------------------------
     Disziplinen: horizontale Strecke (≥ 900 px)
     ------------------------------------------------------------------ */
  function initDisc() {
    if (!hasGSAP || reduced()) return;
    var pin = qs('.disc__pin'), track = qs('.disc__track');
    var no = qs('[data-disc-no]'), bar = qs('[data-disc-bar]');
    var panels = qsa('.panel', track);
    var mm = gsap.matchMedia();
    mm.add('(min-width: 900px)', function () {
      doc.classList.add('has-hscroll');
      var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
      var tween = gsap.to(track, {
        x: function () { return -dist(); }, ease: 'none',
        scrollTrigger: {
          trigger: pin, start: 'top top', end: function () { return '+=' + dist(); },
          pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1,
          onUpdate: function (self) {
            bar.style.transform = 'scaleX(' + self.progress.toFixed(4) + ')';
            var c = 0, edge = window.innerWidth * 0.62;
            panels.forEach(function (p) { if (p.getBoundingClientRect().left < edge) c++; });
            no.textContent = pad2(c);
          }
        }
      });
      panels.forEach(function (p) {
        var img = qs('.panel__media img', p);
        gsap.fromTo(img, { '--px': '-15%' }, { '--px': '0%', ease: 'none', scrollTrigger: { trigger: p, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
        var nr = qs('.panel__no', p);
        gsap.fromTo(nr, { xPercent: 40 }, { xPercent: -30, ease: 'none', scrollTrigger: { trigger: p, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
      });
      return function () {
        doc.classList.remove('has-hscroll');
        gsap.set(track, { clearProps: 'transform' });
      };
    });
  }

  /* ------------------------------------------------------------------
     Ein Tag in der Halle: Zeitraffer-Strecke (≥ 900 px)
     ------------------------------------------------------------------ */
  function initDayStrip() {
    if (!hasGSAP || reduced()) return;
    var box = qs('[data-day-strip]'), track = qs('[data-day-track]');
    if (!box || !track) return;
    var mm = gsap.matchMedia();
    mm.add('(min-width: 900px)', function () {
      doc.classList.add('has-strip');
      var tw = gsap.to(track, {
        x: function () { return -Math.max(0, track.scrollWidth - window.innerWidth); }, ease: 'none',
        scrollTrigger: { trigger: box, start: 'top bottom', end: 'bottom top', scrub: 0.7, invalidateOnRefresh: true }
      });
      var imgs = qsa('.frame__img', track);
      var skew = gsap.quickTo(imgs, 'skewX', { duration: 0.6, ease: 'power3' });
      var fn = function () { skew(clamp(-scrollVel / 260, -6, 6)); };
      gsap.ticker.add(fn);
      return function () {
        gsap.ticker.remove(fn);
        tw.kill();
        doc.classList.remove('has-strip');
        gsap.set(track, { clearProps: 'transform' });
        gsap.set(imgs, { clearProps: 'transform' });
      };
    });
  }

  /* ------------------------------------------------------------------
     Probetraining: Stoppuhr läuft mit dem Scrollen
     ------------------------------------------------------------------ */
  function initLaps() {
    if (!hasGSAP || reduced()) return;
    var list = qs('[data-laps]'), watch = qs('[data-watch]'), bar = qs('[data-watch-bar]');
    if (!list || !watch) return;
    var laps = qsa('.lap', list);
    var marks = laps.map(function (l) { return toMin(qs('.lap__t', l).textContent) * 60; });
    var TOTAL = 75 * 60;
    doc.classList.add('has-laps');
    function render(p) {
      var s = Math.round(p * TOTAL);
      watch.textContent = pad2(Math.floor(s / 3600)) + ':' + pad2(Math.floor(s / 60) % 60) + ':' + pad2(s % 60);
      bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
      laps.forEach(function (l, i) { l.classList.toggle('is-on', s >= marks[i]); });
    }
    render(0);
    ScrollTrigger.create({
      trigger: list, start: 'top 75%', end: 'bottom 55%', scrub: true,
      onUpdate: function (self) { render(self.progress); },
      onLeave: function () { render(1); }
    });
  }

  /* ------------------------------------------------------------------
     Kontaktformular (nur clientseitig)
     ------------------------------------------------------------------ */
  function initForm() {
    var form = qs('[data-form]'), done = qs('[data-done]');
    if (!form || !done) return;
    var fields = {
      name: { input: qs('#k-name'), check: function (v) { return v.trim().length >= 2 ? '' : 'Bitte geben Sie Ihren Namen an.'; } },
      email: { input: qs('#k-mail'), check: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Bitte geben Sie eine gültige E-Mail-Adresse an.'; } },
      dsgvo: { input: qs('#k-dsgvo'), check: function (v, i) { return i.checked ? '' : 'Bitte stimmen Sie der Verarbeitung Ihrer Angaben zu.'; } }
    };
    function validate(key) {
      var f = fields[key], msg = f.check(f.input.value, f.input);
      var err = document.getElementById(f.input.getAttribute('aria-describedby'));
      err.textContent = msg;
      f.input.setAttribute('aria-invalid', msg ? 'true' : 'false');
      f.input.closest('.field').classList.toggle('is-invalid', !!msg);
      return !msg;
    }
    Object.keys(fields).forEach(function (k) {
      var i = fields[k].input;
      i.addEventListener('blur', function () { if (i.value || i.type === 'checkbox') validate(k); });
      i.addEventListener('input', function () { if (i.getAttribute('aria-invalid') === 'true') validate(k); });
      i.addEventListener('change', function () { if (i.getAttribute('aria-invalid') === 'true') validate(k); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstBad = null;
      Object.keys(fields).forEach(function (k) { if (!validate(k) && !firstBad) firstBad = fields[k].input; });
      if (firstBad) { firstBad.focus(); return; }
      var fd = new FormData(form);
      var sum = qs('[data-done-sum]', done);
      sum.textContent = '';
      var add = function (k, v) {
        if (!v) return;
        var d = el('div'); d.appendChild(el('dt', null, k)); d.appendChild(el('dd', null, v)); sum.appendChild(d);
      };
      add('Name', fd.get('name').trim());
      add('E-Mail', fd.get('email').trim());
      add('Telefon', (fd.get('telefon') || '').trim());
      add('Interesse', fd.get('interesse'));
      add('Wunschtermin', fd.get('tag') + ', ' + (fd.get('zeit') || 'Uhrzeit offen'));
      add('Nachricht', (fd.get('nachricht') || '').trim());
      qs('[data-done-name]', done).textContent = fd.get('name').trim().split(/\s+/)[0];
      form.hidden = true;
      done.hidden = false;
      focusEl(done);
      scrollToEl(qs('#probetraining'));
    });
    qs('[data-done-reset]', done).addEventListener('click', function () {
      form.reset();
      Object.keys(fields).forEach(function (k) {
        var i = fields[k].input; i.removeAttribute('aria-invalid'); i.closest('.field').classList.remove('is-invalid');
        document.getElementById(i.getAttribute('aria-describedby')).textContent = '';
      });
      done.hidden = true;
      form.hidden = false;
      qs('#k-name').focus();
    });
  }

  /* ------------------------------------------------------------------
     Start
     ------------------------------------------------------------------ */
  safe('scroll', initScroll);
  safe('header', initHeader);
  safe('menu', initMenu);
  safe('status', initStatus);
  safe('plan', initPlan);
  safe('cfg', initCfg);
  safe('gen', initGen);
  safe('coaches', initCoaches);
  safe('form', initForm);
  safe('disc', initDisc);
  safe('day', initDayStrip);
  safe('laps', initLaps);
  safe('kinetic', initHeroKinetic);
  safe('canvas', initHeroCanvas);
  safe('tilt', initHeroTilt);
  safe('timer', initTimer);
  safe('bands', initBands);
  safe('counters', initCounters);
  safe('reveal', initReveal);
  safe('intro', initHeroIntro);
  if (hasGSAP) {
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }
})();
