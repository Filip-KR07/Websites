/* Jeff's Cakes – Seitenlogik ohne Bibliotheken.
   1 Intro & Kiste    2 Setlist (Vorschau, Filter)   3 Kuchen-Dialog   4 Bestellung
   5 Bestellformular  6 Öffnungsstatus               7 Navigation      8 Einblenden & Zitat
   9 Blätter per Wisch schließen (Handy)             10 Toast */
(function () {
  'use strict';

  var html = document.documentElement;
  html.classList.add('js-ok');

  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var bewegung = function () { return html.classList.contains('motion'); };
  var euro = function (n) { return n.toLocaleString('de-DE', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }) + ' €'; };
  var GENRE = { Classics: 'Classics', Fruity: 'Fruity', Specials: 'Specials', Seasonal: 'Saison' };
  var speicher = {
    lesen: function (k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    schreiben: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* privat, egal */ } }
  };

  /* 1 Intro & Plattenkiste ----------------------------------------------------
     Intro startet, wenn die vordere Hülle und die Schriften da sind (Sicherheitsnetz im <head> nach 1,6 s).

     Kiste: p ist die Position in der Kiste (0 = erste Hülle vorn), als Kommazahl. Hülle i liegt bei d = i − p.
     · Ziehen folgt dem Finger 1:1 (eine Hülle = 0,8 × Hüllenbreite Fingerweg), der Griffpunkt bleibt unterm Finger.
     · Loslassen: Endpunkt per Momentum-Projektion (Apple, Verzögerung 0,998) vorhersagen, nächste Hülle daran
       wählen, Feder startet mit der Fingergeschwindigkeit. Über die Enden hinaus: Gummiband (Apple, 0,55).
     · Feder nach Apple: Antwort (s) und Dämpfung (1 = ohne Nachschwingen). Jede Bewegung ist greifbar:
       Anfassen hält sie an der Stelle an, an der sie gerade ist.
     · Pfeiltasten springen ohne Animation (Tastatur ist häufig). Ohne „Bewegung“: alles springt. */
  var kiste = $('[data-kiste]');
  var heroBild = kiste && $('[data-huelle] img', kiste);
  var kisteHinweis = null;

  function bereit() {
    html.classList.add('is-ready');
    if (kisteHinweis) setTimeout(kisteHinweis, 1100);
  }
  Promise.all([
    heroBild && heroBild.decode ? heroBild.decode().catch(function () {}) : null,
    document.fonts ? document.fonts.ready : null
  ]).then(bereit, bereit);

  if (kiste) (function () {
    var STUFE_Y = 10, STUFE_Z = 0.09, SICHTBAR = 6, ZUG = 0.8;   // wie in style.css Abschnitt 5
    var FEDER = {
      schwung: { antwort: 0.42, daempfung: 0.82 },  // nach einem Wisch: etwas Nachschwingen
      ruhig: { antwort: 0.36, daempfung: 1 },       // langsam losgelassen, Tipp auf eine hintere Hülle
      knopf: { antwort: 0.34, daempfung: 1 }        // Vor/Zurück mit Maus oder Finger
    };
    var buehne = $('[data-kiste-buehne]', kiste);
    var welt = $('[data-kiste-welt]', kiste);
    var stapel = $('[data-kiste-stapel]', kiste);
    var huellen = $$('[data-huelle]', kiste);
    var N = huellen.length;
    var zurueck = $('[data-kiste-zurueck]', kiste), weiter = $('[data-kiste-weiter]', kiste);
    var bestellen = $('[data-kiste-bestellen]', kiste), ansage = $('[data-kiste-ansage]', kiste);

    /* Daten aus der Setlist: Name, Nummer, Preis (eine Quelle für die ganze Seite) */
    var daten = huellen.map(function (h) {
      var li = $('.track[data-id="' + h.dataset.id + '"]');
      var groessen = JSON.parse(li.dataset.groessen || '[]');
      var preise = groessen.map(function (g) { return g[1]; });
      var min = Math.min.apply(null, preise);
      var d = {
        id: h.dataset.id,
        nr: li.dataset.nr,
        genre: GENRE[li.dataset.genre] || li.dataset.genre,
        name: $('.track__name', li).textContent,
        preis: preisText({ groessen: groessen }),
        knopf: $('.track__knopf', li)
      };
      var band = $$('.kiste__band span', h);
      band[0].textContent = d.name;
      band[1].textContent = d.nr;
      $('.kiste__preis', h).innerHTML = (min !== Math.max.apply(null, preise) ? '<small>ab</small>' : '') + esc(euro(min)).replace(' ', '&nbsp;');
      return d;
    });

    var W = 300, S = 240;                 // Hüllenbreite, Fingerweg pro Hülle (px)
    var p = 0, v = 0, ziel = 0, feder = FEDER.ruhig, raf = 0, tVorher = 0;
    var zug = null, geplant = false, angefasst = false, imBild = true, vornGetippt = false;
    var gezeigt = -1, angesagt = 0;
    var stand = huellen.map(function () { return { an: true, hinten: null }; });
    var schatten = huellen.map(function (h) { return $('.kiste__schatten', h); });

    /* Lage einer Hülle bei Abstand d → [x %, y %, z px, Drehung °, Deckkraft, Schatten] */
    function lage(d) {
      if (d >= 0) {
        return [0, -d * STUFE_Y, -d * STUFE_Z * W, 0, d > SICHTBAR - 1 ? Math.max(0, SICHTBAR - d) : 1, Math.min(0.62, d * 0.13)];
      }
      /* herausgezogen: nach links, genau mit dem Finger. Erst ab 40 % hebt und kippt sie sich (dann liegt
         schon die nächste vorn), im letzten Viertel blendet sie aus. So bleibt der Griffpunkt unterm Finger. */
      var u = -d, k = Math.max(0, u - 0.4) / 0.6;
      return [-u * ZUG * 100, -k * 10, Math.min(u, 0.1) * 0.1 * W, -k * 6, u < 0.75 ? 1 : Math.max(0, 4 - 4 * u), 0];
    }
    function gummiband(weg, mass) { return (weg * mass * 0.55) / (mass + 0.55 * weg); }
    function projektion(vPxS) { return (vPxS / 1000) * 0.998 / (1 - 0.998); }
    function klemmen(i) { return Math.min(N - 1, Math.max(0, i)); }
    function aktuell() { return raf ? Math.round(ziel) : klemmen(Math.round(p)); }

    function laden(i) {
      var img = huellen[i] && $('img[data-src]', huellen[i]);
      if (!img) return;
      if (img.dataset.srcset) img.srcset = img.dataset.srcset;
      img.src = img.dataset.src;
      img.removeAttribute('data-src'); img.removeAttribute('data-srcset');
    }

    function zeichnen() {
      geplant = false;
      var pv = klemmen(p);
      var ueber = (p - pv) * S;   // Fingerweg über das Ende hinaus
      var gummi = ueber ? -Math.sign(ueber) * gummiband(Math.abs(ueber), W) : 0;
      stapel.style.transform = gummi ? 'translate3d(' + gummi.toFixed(2) + 'px,0,0)' : '';
      for (var i = 0; i < N; i++) {
        var d = i - pv, h = huellen[i], s = stand[i];
        if (d <= -1 || d >= SICHTBAR) {
          if (s.an) { h.style.visibility = 'hidden'; s.an = false; }
          continue;
        }
        if (!s.an) { h.style.visibility = 'visible'; s.an = true; }
        var l = lage(d);
        h.style.transform = 'translate3d(' + l[0].toFixed(3) + '%,' + l[1].toFixed(3) + '%,' + l[2].toFixed(2) + 'px) rotate(' + l[3].toFixed(3) + 'deg)';
        h.style.opacity = l[4] < 1 ? l[4].toFixed(3) : '';
        schatten[i].style.opacity = l[5].toFixed(3);
        var hinten = d > 0.5;
        if (hinten !== s.hinten) { h.classList.toggle('ist-hinten', hinten); s.hinten = hinten; }
      }
      var idx = Math.round(pv);
      if (idx !== gezeigt) etikett(idx);
    }
    function neuZeichnen() { if (!geplant) { geplant = true; requestAnimationFrame(zeichnen); } }

    function etikett(i) {
      gezeigt = i;
      var d = daten[i];
      $('[data-kiste-nr]', kiste).textContent = d.nr === 'Bonus' ? 'Bonus Track' : 'Track ' + d.nr;
      $('[data-kiste-genre]', kiste).textContent = d.genre;
      $('[data-kiste-name]', kiste).textContent = d.name;
      $('[data-kiste-preis]', kiste).textContent = d.preis;
      $('[data-kiste-bestellen-name]', kiste).textContent = ' – ' + d.name;
      $('[data-kiste-zaehler]', kiste).textContent = String(i + 1).padStart(2, '0');
      zurueck.setAttribute('aria-disabled', String(i === 0));
      weiter.setAttribute('aria-disabled', String(i === N - 1));
      for (var j = i - 1; j <= i + SICHTBAR + 1; j++) laden(j);   // Bilder kurz vorher nachladen
    }
    /* Liegt die Kiste still, wird die vordere Hülle angesagt (höflich, nicht bei jedem Zwischenschritt) */
    function ruhe() {
      var i = klemmen(Math.round(p));
      if (i === angesagt) return;
      angesagt = i;
      var d = daten[i];
      ansage.textContent = (d.nr === 'Bonus' ? 'Bonus Track' : 'Track ' + d.nr) + ', ' + d.name + ', ' + d.preis + '. Hülle ' + (i + 1) + ' von ' + N + '.';
    }

    /* Feder (Masse 1): Steifigkeit (2π/Antwort)², Reibung 2 · Dämpfung · 2π/Antwort, 240 Teilschritte/s */
    function schritt(t) {
      var dt = Math.min(0.05, Math.max(0, (t - tVorher) / 1000));
      tVorher = t;
      var w = 2 * Math.PI / feder.antwort, k = w * w, c = 2 * feder.daempfung * w;
      var n = Math.max(1, Math.ceil(dt * 240)), h = dt / n;
      for (var j = 0; j < n; j++) { v += (-k * (p - ziel) - c * v) * h; p += v * h; }
      if (Math.abs(p - ziel) < 0.0005 && Math.abs(v) < 0.005) {
        p = ziel; v = 0; raf = 0; zeichnen(); ruhe();
        return;
      }
      zeichnen();
      raf = requestAnimationFrame(schritt);
    }
    function federn(nach, art, vStart) {
      ziel = nach;
      feder = FEDER[art];
      if (typeof vStart === 'number') v = vStart;
      if (!bewegung()) { anhalten(); p = Math.round(ziel); v = 0; zeichnen(); ruhe(); return; }
      if (!raf) { tVorher = performance.now(); raf = requestAnimationFrame(schritt); }
    }
    function anhalten() { if (raf) cancelAnimationFrame(raf); raf = 0; }
    function sofort(i) { anhalten(); ziel = p = klemmen(i); v = 0; zeichnen(); ruhe(); }

    /* Ziehen und Wischen (Maus, Finger, Stift) */
    buehne.addEventListener('pointerdown', function (e) {
      if (zug || (e.pointerType === 'mouse' && e.button !== 0) || e.target.closest('button')) return;   // zweiter Finger: ignorieren
      angefasst = true;
      vornGetippt = false;
      var lief = !!raf;
      anhalten();   // mitten in der Bewegung gegriffen: bleibt, wo sie gerade ist
      zug = {
        id: e.pointerId, x0: e.clientX, y0: e.clientY, p0: p, aktiv: false,
        still: !lief && Math.abs(p - Math.round(p)) < 0.02,
        huelle: e.target.closest('[data-huelle]'),
        punkte: [[e.clientX, e.timeStamp]]
      };
      v = 0;
      if (e.pointerType === 'mouse') { try { buehne.setPointerCapture(e.pointerId); } catch (_) {} }
    });
    buehne.addEventListener('pointermove', function (e) {
      if (!zug || e.pointerId !== zug.id) return;
      var dx = e.clientX - zug.x0, dy = e.clientY - zug.y0;
      if (!zug.aktiv) {
        if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy)) return;   // erst eindeutig waagerecht
        zug.aktiv = true;
        kiste.classList.add('zieht');
        try { buehne.setPointerCapture(e.pointerId); } catch (_) {}
      }
      p = zug.p0 - dx / S;   // vom Griffpunkt aus gerechnet: 1:1
      zug.punkte.push([e.clientX, e.timeStamp]);
      if (zug.punkte.length > 12) zug.punkte.shift();
      neuZeichnen();
    });
    function loslassen(e, abgebrochen) {
      if (!zug || e.pointerId !== zug.id) return;
      var z = zug;
      zug = null;
      kiste.classList.remove('zieht');
      if (!z.aktiv) {
        var i = abgebrochen || !z.huelle ? -1 : huellen.indexOf(z.huelle);
        if (i > -1 && i === Math.round(p) && z.still) { vornGetippt = true; return; }   // vordere Hülle: öffnet beim click (s. u.)
        if (i > -1 && i !== Math.round(p)) { federn(i, 'ruhig', 0); return; }  // hintere Hülle nach vorn holen
        federn(klemmen(Math.round(p)), 'ruhig', 0);
        return;
      }
      /* Geschwindigkeit aus den letzten 100 ms; stand der Finger zuletzt still, ist sie 0 */
      var b = z.punkte[z.punkte.length - 1], a = b;
      for (var j = z.punkte.length - 1; j >= 0 && b[1] - z.punkte[j][1] <= 100; j--) a = z.punkte[j];
      var vx = !abgebrochen && b[1] > a[1] && e.timeStamp - b[1] < 60 ? (b[0] - a[0]) / (b[1] - a[1]) * 1000 : 0;
      var weit = p - projektion(vx) / S;
      federn(klemmen(Math.round(weit)), Math.abs(vx) > 300 ? 'schwung' : 'ruhig', -vx / S);
    }
    buehne.addEventListener('pointerup', function (e) { loslassen(e, false); });
    buehne.addEventListener('pointercancel', function (e) { loslassen(e, true); });
    buehne.addEventListener('dragstart', function (e) { e.preventDefault(); });
    /* Erst beim click öffnen, sonst landet der click des Tipps auf dem Hintergrund des Dialogs und schließt ihn */
    buehne.addEventListener('click', function () { if (vornGetippt) { vornGetippt = false; oeffnen(aktuell()); } });

    /* Tastatur: sofort, ohne Animation */
    kiste.addEventListener('keydown', function (e) {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      var i = { ArrowLeft: aktuell() - 1, ArrowRight: aktuell() + 1, Home: 0, End: N - 1 }[e.key];
      if (i === undefined) return;
      e.preventDefault();
      angefasst = true;
      sofort(i);
    });

    /* Vor/Zurück: mit Maus oder Finger federnd (mehrfach tippen zielt weiter), per Tastatur sofort.
       Am Ende ein kleiner Stups ins Gummiband, damit man sieht: hier ist die Kiste zu Ende. */
    function blaettern(r, e) {
      angefasst = true;
      var nach = aktuell() + r;
      if (e.detail === 0) { sofort(nach); return; }
      if (nach < 0 || nach > N - 1) {
        if (bewegung()) { ziel = klemmen(nach); feder = FEDER.schwung; v = r * 3; if (!raf) { tVorher = performance.now(); raf = requestAnimationFrame(schritt); } }
        return;
      }
      federn(nach, 'knopf');
    }
    zurueck.addEventListener('click', function (e) { blaettern(-1, e); });
    weiter.addEventListener('click', function (e) { blaettern(1, e); });

    /* Bestellen: öffnet den Kuchen-Dialog der Setlist */
    function oeffnen(i) { if (daten[i] && daten[i].knopf) daten[i].knopf.click(); }
    bestellen.addEventListener('click', function () { oeffnen(aktuell()); });

    /* Maße messen (Fingerweg und Tiefe hängen an der Hüllenbreite) */
    function messen() { W = welt.offsetWidth || W; S = W * ZUG; zeichnen(); }
    if ('ResizeObserver' in window) new ResizeObserver(messen).observe(welt);
    else window.addEventListener('resize', messen);
    messen();
    if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { imBild = e[0].isIntersecting; }).observe(buehne);

    bestellen.hidden = false;
    zurueck.hidden = weiter.hidden = false;

    /* Einmal nach dem Intro: die vordere Hülle hebt sich kurz an und fällt zurück. Zeigt, dass man blättern kann. */
    kisteHinweis = function () {
      if (!bewegung() || angefasst || !imBild || zug) return;
      feder = FEDER.ruhig; ziel = 0.25; v = 0;
      if (!raf) { tVorher = performance.now(); raf = requestAnimationFrame(schritt); }
      setTimeout(function () { if (!angefasst && !zug) federn(0, 'schwung'); }, 380);
    };
  })();

  /* 2 Setlist ---------------------------------------------------------------- */
  var kuchen = {};
  var tracks = $$('.track');
  tracks.forEach(function (li) {
    var k = {
      id: li.dataset.id,
      nr: li.dataset.nr,
      genre: GENRE[li.dataset.genre] || li.dataset.genre,
      name: $('.track__name', li).textContent,
      desc: $('.track__desc', li).textContent,
      bild: li.dataset.bild,
      gross: li.dataset.gross === '1',
      groessen: JSON.parse(li.dataset.groessen || '[]'),
      optionen: JSON.parse(li.dataset.optionen || '[]'),
      diaet: (li.dataset.diaet || '').split(' ').filter(Boolean),
      el: li
    };
    k.bildKlein = k.bild + '-480.webp';
    k.bildGross = k.bild + (k.gross ? '-960.webp' : '-480.webp');
    kuchen[k.id] = k;

    var knopf = $('.track__knopf', li);
    var daumen = document.createElement('img');
    daumen.className = 'track__daumen';
    daumen.src = k.bildKlein; daumen.alt = ''; daumen.width = 480; daumen.height = 320;
    daumen.loading = 'lazy'; daumen.decoding = 'async';
    knopf.insertBefore(daumen, knopf.firstChild);
    var pegel = document.createElement('span');
    pegel.className = 'track__pegel'; pegel.setAttribute('aria-hidden', 'true');
    pegel.innerHTML = '<i></i><i></i><i></i>';
    knopf.insertBefore(pegel, $('.track__haupt', knopf));
    knopf.setAttribute('aria-haspopup', 'dialog');

    knopf.addEventListener('click', function () { oeffneKuchen(k.id); });
    knopf.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') zeigeVorschau(k); });
    knopf.addEventListener('focus', function () { zeigeVorschau(k); });
  });

  /* Vorschau links (nur Desktop sichtbar): Bild weich überblenden, Text sofort */
  var vorschau = $('[data-vorschau]');
  var vorschauBilder = vorschau ? $$('.vorschau__bild', vorschau) : [];
  var aktuell = null, vorschauZug = 0;
  function zeigeVorschau(k) {
    if (!vorschau || aktuell === k) return;
    if (aktuell) aktuell.el.classList.remove('is-laeuft');
    aktuell = k;
    k.el.classList.add('is-laeuft');
    $('[data-vorschau-nr]').textContent = k.nr === 'Bonus' ? 'Bonus Track' : k.nr;
    $('[data-vorschau-name]').textContent = k.name;
    $('[data-vorschau-preis]').textContent = preisText(k);
    var zug = ++vorschauZug;
    var sichtbar = vorschauBilder.filter(function (b) { return b.classList.contains('is-aktiv'); })[0] || vorschauBilder[0];
    var naechstes = vorschauBilder[0] === sichtbar ? vorschauBilder[1] : vorschauBilder[0];
    naechstes.src = k.bildGross;
    var tauschen = function () {
      if (zug !== vorschauZug) return;
      naechstes.classList.add('is-aktiv');
      sichtbar.classList.remove('is-aktiv');
    };
    (naechstes.decode ? naechstes.decode() : Promise.resolve()).then(tauschen, tauschen);
  }
  function preisText(k) {
    var preise = k.groessen.map(function (g) { return g[1]; });
    var min = Math.min.apply(null, preise), max = Math.max.apply(null, preise);
    return min === max ? euro(min) : 'ab ' + euro(min) + (k.groessen[0][0].indexOf('ø') === 0 ? ' · ø 26 cm ' + euro(max) : '');
  }
  if (tracks.length) zeigeVorschau(kuchen[tracks[0].dataset.id]);

  /* Filter nach Ernährung */
  var filterInfo = $('[data-filter-info]');
  $$('[data-filter-wert]').forEach(function (chip) {
    chip.addEventListener('click', function () {
      var wert = chip.dataset.filterWert;
      $$('[data-filter-wert]').forEach(function (c) { c.setAttribute('aria-pressed', String(c === chip)); });
      var sichtbar = 0;
      tracks.forEach(function (li) {
        var passt = wert === 'alle' || kuchen[li.dataset.id].diaet.indexOf(wert) > -1;
        li.hidden = !passt;
        if (passt) sichtbar++;
      });
      $$('.seite').forEach(function (s) { s.hidden = !$$('.track', s).some(function (t) { return !t.hidden; }); });
      filterInfo.textContent = wert === 'alle' ? '' : sichtbar + ' von ' + tracks.length + ' Kuchen';
      var erster = tracks.filter(function (t) { return !t.hidden; })[0];
      if (erster) zeigeVorschau(kuchen[erster.dataset.id]);
    });
  });

  /* 3 Kuchen-Dialog ---------------------------------------------------------- */
  var kd = $('[data-kuchen-dialog]');
  var kdForm = $('[data-kd-form]');
  var kdMenge = 1, kdKuchen = null;

  function oeffneKuchen(id) {
    var k = kuchen[id];
    if (!k || !kd) return;
    kdKuchen = k; kdMenge = 1;
    var bild = $('[data-kd-bild]', kd);
    bild.src = k.bildGross; bild.alt = k.name;
    $('[data-kd-nr]', kd).textContent = k.nr === 'Bonus' ? 'Bonus Track' : 'Track ' + k.nr;
    $('[data-kd-genre]', kd).textContent = k.genre;
    $('[data-kd-name]', kd).textContent = k.name;
    $('[data-kd-desc]', kd).textContent = k.desc;

    var standard = k.groessen[0][0].indexOf('ø') === 0 ? k.groessen.length - 1 : 0;
    $('[data-kd-groessen]', kd).innerHTML = k.groessen.map(function (g, i) {
      return '<label><input type="radio" name="groesse" value="' + i + '"' + (i === standard ? ' checked' : '') + '>' +
        '<span><strong>' + esc(g[0]) + '</strong><small>' + euro(g[1]) + '</small></span></label>';
    }).join('');
    $('[data-kd-optionen-gruppe]', kd).hidden = !k.optionen.length;
    $('[data-kd-optionen]', kd).innerHTML = k.optionen.map(function (o) {
      return '<label><input type="checkbox" name="option" value="' + esc(o) + '"> ' + esc(o) + '</label>';
    }).join('');
    kdAktualisieren();
    kd.showModal();
    var scroller = window.matchMedia('(max-width: 759px)').matches ? $('.kd', kd) : $('.kd__inhalt', kd);
    if (scroller) scroller.scrollTop = 0;
  }
  function kdGroesse() {
    var r = $('input[name="groesse"]:checked', kd);
    return kdKuchen.groessen[r ? +r.value : 0];
  }
  function kdAktualisieren() {
    $('[data-kd-menge]', kd).textContent = kdMenge;
    $('[data-kd-summe]', kd).textContent = euro(kdGroesse()[1] * kdMenge);
  }
  if (kd) {
    kd.addEventListener('change', kdAktualisieren);
    $$('[data-menge]', kd).forEach(function (b) {
      b.addEventListener('click', function () {
        kdMenge = Math.min(20, Math.max(1, kdMenge + (+b.dataset.menge)));
        kdAktualisieren();
      });
    });
    kdForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var g = kdGroesse();
      var optionen = $$('input[name="option"]:checked', kd).map(function (i) { return i.value; });
      inDieBestellung({ id: kdKuchen.id, groesse: g[0], preis: g[1], optionen: optionen, menge: kdMenge });
      kd.close();
      toast(kdMenge + ' × ' + kdKuchen.name + ' (' + g[0] + ') ist in deiner Bestellung', 'Ansehen', oeffneKorb);
    });
  }
  $$('[data-kuchen-oeffnen]').forEach(function (b) {
    b.addEventListener('click', function () { oeffneKuchen(b.dataset.kuchenOeffnen); });
  });

  /* Alle Dialoge: Schließen-Knöpfe und Klick auf den Hintergrund */
  $$('dialog').forEach(function (d) {
    d.addEventListener('click', function (e) {
      if (e.target === d) d.close();
      var s = e.target.closest('[data-schliessen]');
      if (s && d.contains(s)) d.close();
    });
  });

  /* 4 Bestellung ------------------------------------------------------------- */
  var korb = $('[data-korb]');
  var posten = (speicher.lesen('jeffs-bestellung') || []).filter(function (p) { return kuchen[p.id]; });
  var zahl = $('[data-korb-zahl]');

  function schluessel(p) { return [p.id, p.groesse, p.optionen.slice().sort().join('+')].join('|'); }
  function inDieBestellung(neu) {
    var gleich = posten.filter(function (p) { return schluessel(p) === schluessel(neu); })[0];
    if (gleich) gleich.menge = Math.min(20, gleich.menge + neu.menge);
    else posten.push(neu);
    speichern(true);
  }
  function speichern(hinzugefuegt) {
    speicher.schreiben('jeffs-bestellung', posten);
    var anzahl = posten.reduce(function (s, p) { return s + p.menge; }, 0);
    zahl.textContent = anzahl;
    zahl.hidden = !anzahl;
    $('[data-korb-oeffnen]').setAttribute('aria-label', 'Bestellung öffnen, ' + anzahl + (anzahl === 1 ? ' Artikel' : ' Artikel'));
    if (hinzugefuegt && bewegung() && zahl.animate) {
      zahl.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.3)' }, { transform: 'scale(1)' }], { duration: 320, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' });
    }
    korbZeichnen();
  }
  function summe() { return posten.reduce(function (s, p) { return s + p.preis * p.menge; }, 0); }
  function korbZeichnen() {
    var leer = !posten.length;
    $('[data-korb-leer]').hidden = !leer;
    $('[data-korb-summe-zeile]').hidden = leer;
    $('[data-bestellung]').hidden = leer;
    if (!leer) $('[data-danke]').hidden = true;
    $('[data-korb-summe]').textContent = euro(summe());
    $('[data-posten]').innerHTML = posten.map(function (p, i) {
      var k = kuchen[p.id];
      return '<li>' +
        '<img src="' + k.bildKlein + '" alt="" width="64" height="64" loading="lazy">' +
        '<div><p class="posten__name">' + esc(k.name) + '</p>' +
        '<p class="posten__info">' + esc([p.groesse].concat(p.optionen).join(' · ')) + '</p>' +
        '<div class="posten__steuer"><div class="menge" role="group" aria-label="Anzahl ' + esc(k.name) + '">' +
        '<button type="button" data-p-menge="' + i + ':-1" aria-label="Eins weniger">−</button><output>' + p.menge + '</output>' +
        '<button type="button" data-p-menge="' + i + ':1" aria-label="Eins mehr">+</button></div>' +
        '<button type="button" class="posten__weg" data-p-weg="' + i + '">Entfernen</button></div></div>' +
        '<p class="posten__preis">' + euro(p.preis * p.menge) + '</p></li>';
    }).join('');
  }
  function oeffneKorb() {
    korbZeichnen();
    if (!korb.open) korb.showModal();
  }
  $('[data-korb-oeffnen]').addEventListener('click', oeffneKorb);
  $('[data-posten]').addEventListener('click', function (e) {
    var m = e.target.closest('[data-p-menge]'), w = e.target.closest('[data-p-weg]');
    if (m) {
      var teile = m.dataset.pMenge.split(':'), p = posten[+teile[0]];
      p.menge = Math.min(20, p.menge + (+teile[1]));
      if (p.menge < 1) posten.splice(+teile[0], 1);
      speichern(false);
      var gleich = $('[data-p-menge="' + m.dataset.pMenge + '"]');
      if (gleich) gleich.focus();
    }
    if (w) { posten.splice(+w.dataset.pWeg, 1); speichern(false); $('#korb-titel').focus(); }
  });

  /* 5 Bestellformular ---------------------------------------------------------
     Regeln von jeffscakes.com: 3 Werktage Vorlauf, Lieferung 11–19 Uhr nur im Hamburger Raum,
     Winterpause 23.12.–11.1., Überweisung = frühestens 2 Tage nach Zahlungseingang. */
  var form = $('[data-bestellung]');
  var datum = $('[data-datum]'), zeit = $('[data-zeit]');
  var OEFFNUNG = JSON.parse($('[data-zeiten]').dataset.zeiten);

  function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function ausIso(s) { var t = s.split('-'); return new Date(+t[0], +t[1] - 1, +t[2]); }
  function fruehestens() {
    var d = new Date(); d.setHours(0, 0, 0, 0);
    var werktage = 0;
    while (werktage < 3) { d.setDate(d.getDate() + 1); if (d.getDay() > 0 && d.getDay() < 6) werktage++; }
    while (inWinterpause(d)) d.setDate(d.getDate() + 1);
    return d;
  }
  function inWinterpause(d) {
    var m = d.getMonth() + 1, t = d.getDate();
    return (m === 12 && t >= 23) || (m === 1 && t <= 11);
  }
  function art() { return form.elements.art.value; }
  function zeitenFuellen() {
    var vorher = zeit.value, von = 11, bis = 19;
    if (art() === 'abholen' && datum.value) {
      var z = (OEFFNUNG[ausIso(datum.value).getDay()] || '11:00-19:00').split('-');
      von = parseInt(z[0], 10); bis = parseInt(z[1], 10);
    }
    var opts = ['<option value="">Bitte wählen</option>'];
    for (var h = von; h <= bis; h += 0.5) {
      if (art() === 'abholen' && h === bis) break;
      var t = String(Math.floor(h)).padStart(2, '0') + ':' + (h % 1 ? '30' : '00');
      opts.push('<option' + (t === vorher ? ' selected' : '') + '>' + t + '</option>');
    }
    zeit.innerHTML = opts.join('');
  }
  function artWechsel() {
    var liefern = art() === 'liefern';
    $('[data-adresse]').hidden = !liefern;
    $$('[data-adresse] input').forEach(function (i) { i.required = liefern; });
    $('[data-art-hinweis]').textContent = liefern
      ? 'Wir liefern im Hamburger Raum zwischen 11 und 19 Uhr. Versand außerhalb Hamburgs gibt es noch nicht.'
      : 'Abholung im Café, Linnering 5, zu den Öffnungszeiten.';
    zeitenFuellen();
  }
  function datumPruefen() {
    var hinweis = $('[data-datum-hinweis]');
    var min = fruehestens();
    if (!datum.value) { hinweis.textContent = 'Frühestens am ' + min.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' }) + ', wir backen frisch.'; hinweis.classList.remove('ist-fehler'); return true; }
    var d = ausIso(datum.value), fehler = '';
    if (d < min) fehler = 'Wir brauchen mindestens drei Werktage. Frühester Termin: ' + min.toLocaleDateString('de-DE') + '.';
    else if (inWinterpause(d)) fehler = 'Vom 23. Dezember bis 11. Januar ist Winterpause, dann backen wir nicht.';
    hinweis.textContent = fehler || d.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    hinweis.classList.toggle('ist-fehler', !!fehler);
    datum.setAttribute('aria-invalid', String(!!fehler));
    return !fehler;
  }
  if (form) {
    datum.min = iso(fruehestens());
    form.addEventListener('change', function (e) {
      if (e.target.name === 'art') artWechsel();
      if (e.target.name === 'zahlung') $('[data-zahlung-hinweis]').hidden = form.elements.zahlung.value !== 'Überweisung';
      if (e.target === datum) { datumPruefen(); zeitenFuellen(); }
      if (e.target.getAttribute('aria-invalid') === 'true' && e.target.value) e.target.removeAttribute('aria-invalid');
    });
    artWechsel(); datumPruefen();

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fehlerEl = $('[data-fehler]'), fehler = [];
      $$('input, select', form).forEach(function (f) {
        var ok = f.checkValidity();
        if (f.type !== 'radio') f.setAttribute('aria-invalid', String(!ok));
        if (!ok && fehler.length < 1) fehler.push(f);
      });
      var datumOk = datumPruefen();
      var plz = form.elements.plz.value.trim();
      var plzOk = art() !== 'liefern' || /^2[0-2]\d{3}$/.test(plz);
      if (!plzOk) form.elements.plz.setAttribute('aria-invalid', 'true');
      if (fehler.length || !datumOk || !plzOk) {
        fehlerEl.textContent = !plzOk && !fehler.length && datumOk
          ? 'Diese Postleitzahl liegt außerhalb unseres Liefergebiets. Wir liefern nur im Hamburger Raum, du kannst aber im Café abholen.'
          : 'Bitte prüf die markierten Felder.';
        fehlerEl.hidden = false;
        (fehler[0] || (!datumOk ? datum : form.elements.plz)).focus();
        return;
      }
      fehlerEl.hidden = true;
      var f = form.elements;
      var zeilen = posten.map(function (p) {
        return '- ' + p.menge + ' × ' + kuchen[p.id].name + ', ' + [p.groesse].concat(p.optionen).join(', ') + ': ' + euro(p.preis * p.menge);
      });
      var termin = ausIso(f.datum.value).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }) + ', ' + f.zeit.value + ' Uhr';
      var text = [
        'Hallo Jeff,', '', 'ich möchte bestellen:', ''
      ].concat(zeilen, [
        '', 'Zwischensumme: ' + euro(summe()) + (art() === 'liefern' ? ' zzgl. Lieferkosten' : ''),
        '', (art() === 'liefern' ? 'Lieferung am ' : 'Abholung im Café am ') + termin,
        art() === 'liefern' ? 'Adresse: ' + f.strasse.value + ', ' + f.plz.value + ' ' + f.ort.value : '',
        'Bezahlung: ' + f.zahlung.value,
        f.anmerkung.value ? '\nAnmerkung: ' + f.anmerkung.value : '',
        '', f.vorname.value + ' ' + f.nachname.value, f.email.value, f.telefon.value
      ]).filter(function (z, i, a) { return z !== '' || a[i - 1] !== ''; }).join('\n');
      var betreff = 'Bestellung für ' + ausIso(f.datum.value).toLocaleDateString('de-DE') + ' (' + (art() === 'liefern' ? 'Lieferung' : 'Abholung') + ')';
      window.location.href = 'mailto:info@jeffscakes.com?subject=' + encodeURIComponent(betreff) + '&body=' + encodeURIComponent(text);
      posten = [];
      speichern(false);
      form.reset(); artWechsel(); datumPruefen();
      $('[data-korb-leer]').hidden = true;
      var danke = $('[data-danke]');
      danke.hidden = false;
      danke.focus();
    });
  }
  speichern(false);

  /* 6 Öffnungsstatus (Zeitzone Hamburg) --------------------------------------- */
  var status = $('[data-status]');
  function jetztInHamburg() {
    var teile = {};
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(new Date()).forEach(function (p) { teile[p.type] = p.value; });
    return { tag: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(teile.weekday), min: (+teile.hour) * 60 + (+teile.minute) };
  }
  function minuten(s) { var t = s.split(':'); return (+t[0]) * 60 + (+t[1]); }
  function uhr(s) { var t = s.split(':'); return +t[0] + (t[1] !== '00' ? ':' + t[1] : '') + ' Uhr'; }
  function statusSetzen() {
    if (!status) return;
    var j = jetztInHamburg(), text, offen = false;
    var heute = OEFFNUNG[j.tag] && OEFFNUNG[j.tag].split('-');
    if (heute && j.min >= minuten(heute[0]) && j.min < minuten(heute[1])) { offen = true; text = 'Jetzt geöffnet · bis ' + uhr(heute[1]); }
    else if (heute && j.min < minuten(heute[0])) text = 'Öffnet heute um ' + uhr(heute[0]);
    else {
      for (var i = 1; i <= 7; i++) {
        var t = (j.tag + i) % 7, z = OEFFNUNG[t];
        if (z) { text = 'Geschlossen · öffnet ' + (i === 1 ? 'morgen' : ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'][t]) + ' um ' + uhr(z.split('-')[0]); break; }
      }
    }
    $('[data-status-text]').textContent = text;
    status.classList.toggle('ist-zu', !offen);
    status.hidden = false;
    $$('.zeiten tr').forEach(function (tr) { tr.classList.toggle('ist-heute', tr.dataset.tage.split(' ').indexOf(String(j.tag)) > -1); });
  }
  statusSetzen();
  setInterval(statusSetzen, 60000);

  /* 7 Navigation --------------------------------------------------------------- */
  var menue = $('[data-menue]');
  $('[data-menue-oeffnen]').addEventListener('click', function () { menue.showModal(); });
  /* Leiste hell oder dunkel, je nach Abschnitt direkt unter ihr */
  var nav = $('[data-nav]');
  var abschnitte = $$('main > section, .fuss');
  var navGeplant = false;
  function navFarbe() {
    navGeplant = false;
    var y = nav.offsetHeight / 2;
    for (var i = 0; i < abschnitte.length; i++) {
      var r = abschnitte[i].getBoundingClientRect();
      if (r.top <= y && r.bottom > y) { nav.classList.toggle('ist-hell', abschnitte[i].classList.contains('hell')); return; }
    }
  }
  window.addEventListener('scroll', function () { if (!navGeplant) { navGeplant = true; requestAnimationFrame(navFarbe); } }, { passive: true });
  window.addEventListener('resize', navFarbe);
  navFarbe();

  if ('IntersectionObserver' in window) {
    var links = $$('.nav__links a');
    var io = new IntersectionObserver(function (eintraege) {
      eintraege.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { a.setAttribute('aria-current', String(a.getAttribute('href') === '#' + e.target.id)); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['top', 'setlist', 'cafe', 'geschichte', 'bestellen'].forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
  }

  /* 8 Einblenden & Zitat ------------------------------------------------------- */
  if (bewegung() && 'IntersectionObserver' in window) {
    var revealIO = new IntersectionObserver(function (eintraege) {
      var n = 0;
      eintraege.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.style.transitionDelay = Math.min(n++, 4) * 70 + 'ms';
        e.target.classList.add('ist-sichtbar');
        revealIO.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    $$('[data-reveal]').forEach(function (el) { revealIO.observe(el); });

    /* Zitat: Wörter leuchten beim Scrollen nacheinander auf */
    var zitat = $('[data-woerter]');
    if (zitat) {
      var p = $('p', zitat);
      p.innerHTML = p.textContent.split(/(\s+)/).map(function (w) { return /^\s+$/.test(w) ? w : '<span class="wort">' + esc(w) + '</span>'; }).join('');
      zitat.classList.add('ist-geteilt');
      var woerter = $$('.wort', zitat), angezeigt = -1, geplant = false;
      var zeichnen = function () {
        geplant = false;
        var r = zitat.getBoundingClientRect(), vh = window.innerHeight;
        var fortschritt = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.3)));
        var n = Math.round(fortschritt * woerter.length);
        if (n === angezeigt) return;
        angezeigt = n;
        woerter.forEach(function (w, i) { w.classList.toggle('an', i < n); });
      };
      window.addEventListener('scroll', function () { if (!geplant) { geplant = true; requestAnimationFrame(zeichnen); } }, { passive: true });
      zeichnen();
    }
  }

  /* 9 Blätter per Wisch nach unten schließen (nur Handy-Layout) ---------------
     Folgt dem Finger 1:1, oben mit Gummiband. Schnell gewischt (> 0,11 px/ms) oder
     über ein Viertel der Höhe gezogen: zu. Sonst federt es zurück. */
  var blattLayout = window.matchMedia('(max-width: 759px)');
  $$('[data-griff]').forEach(function (griff) {
    var blatt = griff.closest('dialog'), startY = 0, dy = 0, verlauf = [], aktiv = false;
    griff.addEventListener('pointerdown', function (e) {
      if (!blattLayout.matches || aktiv) return;
      aktiv = true; startY = e.clientY; dy = 0; verlauf = [{ y: e.clientY, t: e.timeStamp }];
      griff.setPointerCapture(e.pointerId);
      blatt.classList.add('zieht');
    });
    griff.addEventListener('pointermove', function (e) {
      if (!aktiv) return;
      var roh = e.clientY - startY;
      dy = roh >= 0 ? roh : -(Math.abs(roh) * 40) / (40 + Math.abs(roh));
      blatt.style.transform = 'translateY(' + dy + 'px)';
      verlauf.push({ y: e.clientY, t: e.timeStamp });
      if (verlauf.length > 5) verlauf.shift();
    });
    var ende = function () {
      if (!aktiv) return;
      aktiv = false;
      var a = verlauf[0], b = verlauf[verlauf.length - 1];
      var tempo = b.t > a.t ? (b.y - a.y) / (b.t - a.t) : 0;
      blatt.classList.remove('zieht');
      blatt.style.transform = '';
      if (dy > blatt.offsetHeight * 0.25 || (tempo > 0.11 && dy > 10)) blatt.close();
    };
    griff.addEventListener('pointerup', ende);
    griff.addEventListener('pointercancel', ende);
  });

  /* 10 Toast ------------------------------------------------------------------- */
  var toastOrt = $('[data-toasts]'), toastTimer = null;
  function toast(text, knopfText, aktion) {
    var alt = $('.toast', toastOrt);
    if (alt) alt.remove();
    var el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = '<span>' + esc(text) + '</span>' + (knopfText ? '<button type="button">' + esc(knopfText) + '</button>' : '');
    toastOrt.appendChild(el);
    if (knopfText) $('button', el).addEventListener('click', function () { weg(); aktion(); });
    el.getBoundingClientRect();
    el.classList.add('ist-da');
    var weg = function () {
      clearTimeout(toastTimer);
      el.classList.add('geht');
      el.classList.remove('ist-da');
      setTimeout(function () { el.remove(); }, 260);
    };
    var starten = function () { clearTimeout(toastTimer); toastTimer = setTimeout(weg, 4500); };
    el.addEventListener('pointerenter', function () { clearTimeout(toastTimer); });
    el.addEventListener('pointerleave', starten);
    starten();
  }

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
})();
