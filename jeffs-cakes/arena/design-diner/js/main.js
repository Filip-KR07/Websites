/* Jeff's Cheesecake – Entwurf „Diner“. Seitenlogik ohne Bibliotheken.
   1 Kuchen von der Tafel   2 Tortenvitrine (drehbare Etagere)   3 Filter        4 Kuchen-Dialog
   5 Bestellzettel           6 Bestellformular                     7 Öffnungsstatus 8 Navigation
   9 Einblenden              10 Blätter per Wisch schließen        11 Toast */
(function () {
  'use strict';

  var html = document.documentElement;
  html.classList.add('js-ok');

  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var bewegung = function () { return html.classList.contains('motion'); };
  var euro = function (n) { return n.toLocaleString('de-DE', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }) + ' €'; };
  var speicher = {
    lesen: function (k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    schreiben: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* privat, egal */ } }
  };
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /* Leuchtschrift geht an, sobald die Schriften da sind (Sicherheitsnetz im <head> nach 1,6 s) */
  var bereitListe = [];
  var istBereit = false;
  function bereit() {
    if (istBereit) return;
    istBereit = true;
    html.classList.add('is-ready');
    bereitListe.forEach(function (f) { f(); });
  }
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(bereit, bereit);
  setTimeout(bereit, 1600);

  /* 1 Kuchen von der Tafel ------------------------------------------------------ */
  var kuchen = {};
  var zeilen = $$('.zeile');
  zeilen.forEach(function (li) {
    var k = {
      id: li.dataset.id,
      kategorie: li.dataset.kategorie,
      name: $('.zeile__name', li).textContent.trim(),
      desc: $('.zeile__desc', li).textContent.trim(),
      bild: li.dataset.bild,
      gross: li.dataset.gross === '1',
      groessen: JSON.parse(li.dataset.groessen || '[]'),
      optionen: JSON.parse(li.dataset.optionen || '[]'),
      diaet: (li.dataset.diaet || '').split(' ').filter(Boolean),
      el: li
    };
    k.bildKlein = k.bild + '-480.webp';
    k.bildGross = k.bild + (k.gross ? '-960.webp' : '-480.webp');
    k.glocke = 'img/glocke/' + k.id + '.webp';
    kuchen[k.id] = k;

    var knopf = $('.zeile__knopf', li);
    var desc = $('.zeile__desc', li);
    desc.id = 'desc-' + k.id;
    knopf.setAttribute('aria-label', k.name + ', ' + preisText(k));
    knopf.setAttribute('aria-describedby', desc.id);
    knopf.setAttribute('aria-haspopup', 'dialog');
    knopf.addEventListener('click', function () { oeffneKuchen(k.id); });
  });
  function preisText(k) {
    var preise = k.groessen.map(function (g) { return g[1]; });
    var min = Math.min.apply(null, preise), max = Math.max.apply(null, preise);
    return min === max ? euro(min) : 'ab ' + euro(min);
  }

  /* 2 Tortenvitrine --------------------------------------------------------------
     Zwei Etagen mit je 9 Kuchen drehen gemeinsam um die Stange. Ziehen folgt dem Finger 1:1,
     beim Loslassen schwingt die Etagere mit dem Schwung des Fingers weiter (Feder, Apple-Projektion)
     und rastet auf dem nächsten Kuchen ein. Pfeile und Pfeiltasten drehen um einen Platz.
     Es läuft nur etwas, solange jemand dreht: kein Dauer-Karussell. */
  var vitrine = $('[data-vitrine]');
  if (vitrine) (function () {
    var N = 9, SCHRITT = 2 * Math.PI / N;
    var etagen = $$('[data-etage]', vitrine).map(function (el) {
      return {
        el: el, name: el.dataset.etage,
        glocken: $$('.glocke', el).map(function (g) {
          return { el: g, i: parseInt(g.style.getPropertyValue('--i'), 10) || 0, id: g.dataset.kuchen, schatten: $('.glocke__schatten', g), z: null };
        })
      };
    });
    /* Maße aus dem CSS (cqw) in px umrechnen: CSS bleibt die einzige Quelle */
    function messen() {
      var w = vitrine.clientWidth;
      etagen.forEach(function (e) {
        var cs = getComputedStyle(e.el);
        e.rx = parseFloat(cs.getPropertyValue('--rx')) * w / 100;
        e.ry = parseFloat(cs.getPropertyValue('--ry')) * w / 100;
        e.sb = parseFloat(cs.getPropertyValue('--sb')) || 0.7;
      });
    }
    messen();
    var unten = etagen.filter(function (e) { return e.name === 'unten'; })[0] || etagen[0];

    /* Startpose: mit Bewegung steht die Etagere zwei Plätze weiter und dreht sich beim Laden zurück */
    var phi = bewegung() ? 2 * SCHRITT : 0, v = 0, ziel = 0, zeta = 1, antwort = 0.5, laeuft = false, zeit = 0;
    var vorneIdx = -1;

    function zeichnen() {
      for (var e = 0; e < etagen.length; e++) {
        var et = etagen[e];
        for (var j = 0; j < et.glocken.length; j++) {
          var g = et.glocken[j], a = g.i * SCHRITT + phi, s = Math.sin(a), c = Math.cos(a);
          var sc = et.sb + (1 - et.sb) * (c + 1) / 2;
          g.el.style.transform = 'translate(' + (s * et.rx).toFixed(2) + 'px,' + (c * et.ry).toFixed(2) + 'px) scale(' + sc.toFixed(4) + ')';
          var z = Math.round(51 + 48 * c);
          if (z !== g.z) { g.el.style.zIndex = z; g.z = z; }
          g.schatten.style.opacity = (0.62 * (1 - c) / 2).toFixed(3);
        }
      }
      vorneAktualisieren();
    }
    function vorneAktualisieren() {
      var idx = ((Math.round(-phi / SCHRITT) % N) + N) % N;
      if (idx === vorneIdx) return;
      vorneIdx = idx;
      etagen.forEach(function (et) {
        et.glocken.forEach(function (g) { g.el.classList.toggle('ist-vorne', g.i === idx); });
        var g = et.glocken.filter(function (x) { return x.i === idx; })[0];
        var a = $('[data-vorne="' + et.name + '"]');
        if (!g || !a) return;
        var k = kuchen[g.id];
        a.href = '#k-' + g.id;
        a.dataset.kuchen = g.id;
        $('[data-vorne-name]', a).textContent = k.name;
        $('[data-vorne-preis]', a).textContent = preisText(k);
        a.setAttribute('aria-label', (et.name === 'oben' ? 'Oben: ' : 'Unten: ') + k.name + ', ' + preisText(k) + ', auswählen');
      });
    }
    function vorneNamen() {
      return etagen.map(function (et) { var g = et.glocken.filter(function (x) { return x.i === vorneIdx; })[0]; return g ? kuchen[g.id].name : ''; }).join(' und ');
    }

    /* Feder (halbimplizites Euler-Verfahren). antwort = Reaktionszeit in s, zeta = Dämpfung (1 = kein Überschwingen) */
    function drehenAuf(zielWinkel, startV, daempfung, reaktion) {
      ziel = zielWinkel; v = startV || 0; zeta = daempfung || 1; antwort = reaktion || 0.5;
      if (!bewegung()) { phi = ziel; v = 0; laeuft = false; zeichnen(); return; }
      if (!laeuft) { laeuft = true; zeit = performance.now(); requestAnimationFrame(schritt); }
    }
    function schritt(t) {
      if (!laeuft) return;
      var dt = Math.min(0.034, Math.max(0, (t - zeit) / 1000)); zeit = t;
      var k = Math.pow(2 * Math.PI / antwort, 2), d = 4 * Math.PI * zeta / antwort, h = dt / 4;
      for (var n = 0; n < 4; n++) { v += (-k * (phi - ziel) - d * v) * h; phi += v * h; }
      if (Math.abs(phi - ziel) < 0.0005 && Math.abs(v) < 0.003) { phi = ziel; v = 0; laeuft = false; }
      zeichnen();
      if (laeuft) requestAnimationFrame(schritt);
    }
    function einrasten(winkel) { return Math.round(winkel / SCHRITT) * SCHRITT; }
    function drehen(richtung) {
      var basis = laeuft ? ziel : einrasten(phi);
      drehenAuf(basis - richtung * SCHRITT, laeuft ? v : 0, 1, 0.45);
      ansage();
    }
    var ansageTimer;
    function ansage() {
      clearTimeout(ansageTimer);
      ansageTimer = setTimeout(function () {
        var idx = ((Math.round(-ziel / SCHRITT) % N) + N) % N, namen = etagen.map(function (et) { var g = et.glocken.filter(function (x) { return x.i === idx; })[0]; return g ? kuchen[g.id].name : ''; });
        $('[data-vorne-ansage]').textContent = 'Vorne: ' + namen.join(' und ');
      }, 250);
    }

    /* Ziehen und Wischen */
    var zug = null, klickSperre = false;
    vitrine.addEventListener('pointerdown', function (e) {
      if (zug || (e.pointerType === 'mouse' && e.button !== 0)) return;
      zug = { id: e.pointerId, x0: e.clientX, y0: e.clientY, phi0: phi, verlauf: [{ x: e.clientX, t: e.timeStamp }], aktiv: false };
    });
    vitrine.addEventListener('pointermove', function (e) {
      if (!zug || e.pointerId !== zug.id) return;
      var dx = e.clientX - zug.x0, dy = e.clientY - zug.y0;
      if (!zug.aktiv) {
        if (Math.abs(dx) < 8) return;                                   /* ~10 px Schwelle, dann 1:1 */
        if (Math.abs(dy) > Math.abs(dx)) { zug = null; return; }        /* eher Scrollen: loslassen */
        zug.aktiv = true; zug.x0 = e.clientX; zug.phi0 = phi; dx = 0;  /* ab der aktuellen Lage weiter */
        laeuft = false; v = 0;
        try { vitrine.setPointerCapture(e.pointerId); } catch (err) { /* egal */ }
        vitrine.classList.add('zieht');
      }
      phi = zug.phi0 + dx / unten.rx;
      zug.verlauf.push({ x: e.clientX, t: e.timeStamp });
      if (zug.verlauf.length > 6) zug.verlauf.shift();
      zeichnen();
    });
    function loslassen(e) {
      if (!zug || e.pointerId !== zug.id) return;
      var war = zug; zug = null;
      if (!war.aktiv) return;
      vitrine.classList.remove('zieht');
      klickSperre = true;
      setTimeout(function () { klickSperre = false; }, 0);
      var a = war.verlauf[0], b = war.verlauf[war.verlauf.length - 1];
      var px = b.t - a.t > 0 && e.type !== 'pointercancel' ? (b.x - a.x) / (b.t - a.t) : 0;   /* px/ms */
      var omega = px * 1000 / unten.rx;                                                      /* rad/s */
      /* Projektion wie UIScrollView (Verzögerung 0.99 = „fast“): wohin der Schwung die Etagere trägt */
      var wurf = Math.max(-Math.PI, Math.min(Math.PI, omega * 0.99 / (1 - 0.99) / 1000));
      drehenAuf(einrasten(phi + wurf), omega, Math.abs(omega) > 3 ? 0.82 : 1, 0.55);
      ansage();
    }
    vitrine.addEventListener('pointerup', loslassen);
    vitrine.addEventListener('pointercancel', loslassen);
    /* nur wenn die Vitrine selbst den Zeiger verliert (beim Übernehmen gibt das angetippte Kind ihn ab) */
    vitrine.addEventListener('lostpointercapture', function (e) { if (e.target === vitrine && zug && zug.aktiv) loslassen(e); });
    vitrine.addEventListener('dragstart', function (e) { e.preventDefault(); });

    /* Antippen: Kuchen öffnen und nebenbei nach vorn drehen */
    vitrine.addEventListener('click', function (e) {
      var g = e.target.closest('.glocke');
      if (!g) return;
      e.preventDefault();
      if (klickSperre) return;
      var i = parseInt(g.style.getPropertyValue('--i'), 10) || 0;
      var zielWinkel = -i * SCHRITT, aktuell = phi;
      zielWinkel += Math.round((aktuell - zielWinkel) / (2 * Math.PI)) * 2 * Math.PI;
      drehenAuf(zielWinkel, v, 1, 0.5);
      oeffneKuchen(g.dataset.kuchen);
    }, true);
    $$('.glocke', vitrine).forEach(function (g) { g.tabIndex = -1; g.setAttribute('aria-haspopup', 'dialog'); });

    $$('[data-drehen]').forEach(function (b) {
      b.addEventListener('click', function () { drehen(+b.dataset.drehen); });
    });
    $$('[data-vorne]').forEach(function (a) {
      a.setAttribute('aria-haspopup', 'dialog');
      a.addEventListener('click', function (e) { e.preventDefault(); oeffneKuchen(a.dataset.kuchen || a.getAttribute('href').slice(3)); });
    });
    var steuer = $('.vitrine__steuer');
    if (steuer) steuer.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); drehen(-1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); drehen(1); }
    });

    if ('ResizeObserver' in window) new ResizeObserver(function () { messen(); zeichnen(); }).observe(vitrine);
    else window.addEventListener('resize', function () { messen(); zeichnen(); });
    zeichnen();
    bereitListe.push(function () { if (phi !== 0) drehenAuf(0, 0, 1, 1.05); });
    if (istBereit && phi !== 0) drehenAuf(0, 0, 1, 1.05);
  })();

  /* 3 Filter nach Ernährung ---------------------------------------------------------- */
  var filterInfo = $('[data-filter-info]');
  $$('[data-filter-wert]').forEach(function (chip) {
    chip.addEventListener('click', function () {
      var wert = chip.dataset.filterWert, sichtbar = 0;
      $$('[data-filter-wert]').forEach(function (c) { c.setAttribute('aria-pressed', String(c === chip)); });
      zeilen.forEach(function (li) {
        var passt = wert === 'alle' || kuchen[li.dataset.id].diaet.indexOf(wert) > -1;
        li.hidden = !passt;
        if (passt) sichtbar++;
      });
      $$('[data-gruppe]').forEach(function (s) { s.hidden = !$$('.zeile', s).some(function (t) { return !t.hidden; }); });
      filterInfo.textContent = wert === 'alle' ? '' : sichtbar + ' von ' + zeilen.length + ' Kuchen';
    });
  });

  /* 4 Kuchen-Dialog -------------------------------------------------------------------- */
  var kd = $('[data-kuchen-dialog]');
  var kdForm = $('[data-kd-form]');
  var kdMenge = 1, kdKuchen = null;

  function oeffneKuchen(id) {
    var k = kuchen[id];
    if (!k || !kd) return;
    kdKuchen = k; kdMenge = 1;
    var bild = $('[data-kd-bild]', kd);
    bild.src = k.bildGross; bild.alt = k.name;
    $('[data-kd-kategorie]', kd).textContent = [k.kategorie, diaetText(k)].filter(Boolean).join(' · ');
    $('[data-kd-name]', kd).textContent = k.name;
    $('[data-kd-desc]', kd).textContent = k.desc;

    var standard = k.groessen[0][0].indexOf('ø') === 0 ? k.groessen.length - 1 : 0;
    $('[data-kd-groessen]', kd).innerHTML = k.groessen.map(function (g, i) {
      var d = g[0].indexOf('ø') === 0 ? parseInt(g[0].replace(/\D+/g, ''), 10) : 0;
      return '<label><input type="radio" name="groesse" value="' + i + '"' + (i === standard ? ' checked' : '') + '>' +
        '<span class="groesse">' + (d ? '<span class="groesse__teller" style="--d:' + d + '" aria-hidden="true"></span>' : '') +
        '<strong>' + esc(g[0]) + '</strong><small>' + euro(g[1]) + '</small></span></label>';
    }).join('');
    $('[data-kd-optionen-gruppe]', kd).hidden = !k.optionen.length;
    $('[data-kd-optionen]', kd).innerHTML = k.optionen.map(function (o) {
      return '<label><input type="checkbox" name="option" value="' + esc(o) + '"> ' + esc(o) + '</label>';
    }).join('');
    kdAktualisieren();
    if (!kd.open) kd.showModal();
    var scroller = window.matchMedia('(max-width: 759px)').matches ? $('.kd', kd) : $('.kd__inhalt', kd);
    if (scroller) scroller.scrollTop = 0;
  }
  function diaetText(k) {
    var d = k.diaet, hat = function (x) { return d.indexOf(x) > -1; };
    if (hat('vegan') && hat('gf')) return 'vegan, glutenfrei möglich';
    if (hat('vegan')) return 'auch vegan';
    if (hat('lf') && hat('gf')) return 'laktose- oder glutenfrei möglich';
    if (hat('lf')) return 'laktosefrei möglich';
    return '';
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
      toast(kdMenge + ' × ' + kdKuchen.name + ' (' + g[0].replace(/ /g, '\u00a0') + ') ist notiert', 'Zettel ansehen', oeffneZettel);
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

  /* 5 Bestellzettel ---------------------------------------------------------------------- */
  var zettel = $('[data-zettel]');
  var posten = (speicher.lesen('jeffs-diner-zettel') || []).filter(function (p) { return p && kuchen[p.id]; });
  var zahl = $('[data-zettel-zahl]');
  var leiste = $('[data-zettel-leiste]');

  function schluessel(p) { return [p.id, p.groesse, p.optionen.slice().sort().join('+')].join('|'); }
  function inDieBestellung(neu) {
    var gleich = posten.filter(function (p) { return schluessel(p) === schluessel(neu); })[0];
    if (gleich) gleich.menge = Math.min(20, gleich.menge + neu.menge);
    else posten.push(neu);
    speichern(true);
  }
  function summe() { return posten.reduce(function (s, p) { return s + p.preis * p.menge; }, 0); }
  function speichern(hinzugefuegt) {
    speicher.schreiben('jeffs-diner-zettel', posten);
    var anzahl = posten.reduce(function (s, p) { return s + p.menge; }, 0);
    zahl.textContent = anzahl;
    zahl.hidden = !anzahl;
    $('.zettel-knopf').setAttribute('aria-label', 'Bestellzettel öffnen, ' + (anzahl ? anzahl + ' Artikel' : 'noch leer'));
    html.classList.toggle('hat-posten', anzahl > 0);
    if (leiste) {
      leiste.hidden = !anzahl;
      $('[data-zettel-leiste-zahl]').textContent = anzahl;
      $('[data-zettel-leiste-info]').textContent = euro(summe());
      leiste.setAttribute('aria-label', 'Bestellzettel ansehen, ' + anzahl + ' Artikel, ' + euro(summe()));
    }
    if (hinzugefuegt && bewegung() && zahl.animate) {
      zahl.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.35)' }, { transform: 'scale(1)' }], { duration: 300, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' });
    }
    zettelZeichnen();
  }
  function zettelZeichnen() {
    var leer = !posten.length;
    $('[data-zettel-leer]').hidden = !leer;
    $('[data-zettel-spalten]').hidden = leer;
    $('[data-zettel-summe-zeile]').hidden = leer;
    $('[data-bestellung]').hidden = leer;
    if (!leer) $('[data-danke]').hidden = true;
    $('[data-zettel-summe]').textContent = euro(summe());
    $('[data-posten]').innerHTML = posten.map(function (p, i) {
      var k = kuchen[p.id];
      return '<li>' +
        '<span class="posten__anz" aria-hidden="true">' + p.menge + '</span>' +
        '<div><p class="posten__name">' + esc(k.name) + '</p>' +
        '<p class="posten__info">' + esc([p.groesse].concat(p.optionen).join(' · ')) + '</p>' +
        '<div class="posten__steuer"><div class="menge" role="group" aria-label="Anzahl ' + esc(k.name) + '">' +
        '<button type="button" data-p-menge="' + i + ':-1" aria-label="Eins weniger">−</button><output>' + p.menge + '</output>' +
        '<button type="button" data-p-menge="' + i + ':1" aria-label="Eins mehr">+</button></div>' +
        '<button type="button" class="posten__weg" data-p-weg="' + i + '">Entfernen</button></div></div>' +
        '<p class="posten__preis">' + euro(p.preis * p.menge) + '</p></li>';
    }).join('');
  }
  function oeffneZettel() {
    zettelZeichnen();
    if (!zettel.open) zettel.showModal();
  }
  $$('[data-zettel-oeffnen]').forEach(function (b) { b.addEventListener('click', oeffneZettel); });
  $('[data-posten]').addEventListener('click', function (e) {
    var m = e.target.closest('[data-p-menge]'), w = e.target.closest('[data-p-weg]');
    if (m) {
      var teile = m.dataset.pMenge.split(':'), p = posten[+teile[0]];
      p.menge = Math.min(20, p.menge + (+teile[1]));
      if (p.menge < 1) posten.splice(+teile[0], 1);
      speichern(false);
      var gleich = $('[data-p-menge="' + m.dataset.pMenge + '"]');
      if (gleich) gleich.focus(); else $('#zettel-titel').focus();
    }
    if (w) { posten.splice(+w.dataset.pWeg, 1); speichern(false); $('#zettel-titel').focus(); }
  });
  var heute = $('[data-heute]');
  if (heute) heute.textContent = new Date().toLocaleDateString('de-DE');

  /* 6 Bestellformular ---------------------------------------------------------------------
     Regeln von jeffscakes.com: 3 Werktage Vorlauf, Lieferung 11–19 Uhr nur im Hamburger Raum,
     Winterpause 23.12.–11.1., Überweisung = frühestens 2 Tage nach Zahlungseingang. */
  var form = $('[data-bestellung]');
  var datum = $('[data-datum]'), zeit = $('[data-zeit]');
  var OEFFNUNG = JSON.parse($('[data-zeiten]').dataset.zeiten);

  function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function ausIso(s) { var t = s.split('-'); return new Date(+t[0], +t[1] - 1, +t[2]); }
  function inWinterpause(d) {
    var m = d.getMonth() + 1, t = d.getDate();
    return (m === 12 && t >= 23) || (m === 1 && t <= 11);
  }
  function fruehestens() {
    var d = new Date(); d.setHours(0, 0, 0, 0);
    var werktage = 0;
    while (werktage < 3) { d.setDate(d.getDate() + 1); if (d.getDay() > 0 && d.getDay() < 6) werktage++; }
    while (inWinterpause(d)) d.setDate(d.getDate() + 1);
    return d;
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
    if (!datum.value) {
      hinweis.textContent = 'Frühestens am ' + min.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' }) + ', wir backen frisch.';
      hinweis.classList.remove('ist-fehler');
      return true;
    }
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
      if (e.target.getAttribute('aria-invalid') === 'true' && e.target.value && e.target !== datum) e.target.removeAttribute('aria-invalid');
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
      var zeilenText = posten.map(function (p) {
        return '- ' + p.menge + ' × ' + kuchen[p.id].name + ', ' + [p.groesse].concat(p.optionen).join(', ') + ': ' + euro(p.preis * p.menge);
      });
      var termin = ausIso(f.datum.value).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }) + ', ' + f.zeit.value + ' Uhr';
      var text = ['Hallo Jeff,', '', 'ich möchte bestellen:', ''].concat(zeilenText, [
        '', 'Zwischensumme: ' + euro(summe()) + (art() === 'liefern' ? ' zzgl. Lieferkosten' : ''),
        '', (art() === 'liefern' ? 'Lieferung am ' : 'Abholung im Café am ') + termin,
        art() === 'liefern' ? 'Adresse: ' + f.strasse.value + ', ' + f.plz.value + ' ' + f.ort.value : '',
        'Bezahlung: ' + f.zahlung.value,
        f.anmerkung.value ? '\nAnmerkung: ' + f.anmerkung.value : '',
        '', f.vorname.value + ' ' + f.nachname.value, f.email.value, f.telefon.value
      ]).filter(function (z, i, a) { return z !== '' || a[i - 1] !== ''; }).join('\n').replace(/ /g, ' ');
      var betreff = 'Bestellung für ' + ausIso(f.datum.value).toLocaleDateString('de-DE') + ' (' + (art() === 'liefern' ? 'Lieferung' : 'Abholung') + ')';
      window.location.href = 'mailto:info@jeffscakes.com?subject=' + encodeURIComponent(betreff) + '&body=' + encodeURIComponent(text);
      posten = [];
      speichern(false);
      form.reset(); artWechsel(); datumPruefen();
      $('[data-zahlung-hinweis]').hidden = true;
      $$('[aria-invalid]', form).forEach(function (el) { el.removeAttribute('aria-invalid'); });
      $('[data-zettel-leer]').hidden = true;
      var danke = $('[data-danke]');
      danke.hidden = false;
      danke.focus();
    });
  }
  speichern(false);

  /* 7 Öffnungsstatus (Zeitzone Hamburg): OPEN-Schild im Hero und Zeile im Café ---------- */
  function jetztInHamburg() {
    var teile = {};
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(new Date()).forEach(function (p) { teile[p.type] = p.value; });
    return { tag: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(teile.weekday), min: (+teile.hour) * 60 + (+teile.minute) };
  }
  function minuten(s) { var t = s.split(':'); return (+t[0]) * 60 + (+t[1]); }
  function uhr(s) { var t = s.split(':'); return +t[0] + (t[1] !== '00' ? ':' + t[1] : '') + ' Uhr'; }
  function statusSetzen() {
    var j = jetztInHamburg(), text, offen = false;
    var heuteZ = OEFFNUNG[j.tag] && OEFFNUNG[j.tag].split('-');
    if (heuteZ && j.min >= minuten(heuteZ[0]) && j.min < minuten(heuteZ[1])) { offen = true; text = 'Jetzt geöffnet · bis ' + uhr(heuteZ[1]); }
    else if (heuteZ && j.min < minuten(heuteZ[0])) text = 'Geschlossen · öffnet heute um ' + uhr(heuteZ[0]);
    else {
      for (var i = 1; i <= 7; i++) {
        var t = (j.tag + i) % 7, z = OEFFNUNG[t];
        if (z) { text = 'Geschlossen · öffnet ' + (i === 1 ? 'morgen' : ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'][t]) + ' um ' + uhr(z.split('-')[0]); break; }
      }
    }
    $$('[data-status-text]').forEach(function (el) { el.textContent = text; });
    var st = $('[data-status]');
    if (st) { st.classList.toggle('ist-zu', !offen); st.hidden = false; }
    var schild = $('[data-offen]');
    if (schild) schild.classList.toggle('ist-offen', offen);
    $$('.zeiten tr').forEach(function (tr) { tr.classList.toggle('ist-heute', tr.dataset.tage.split(' ').indexOf(String(j.tag)) > -1); });
  }
  statusSetzen();
  setInterval(statusSetzen, 60000);

  /* 8 Navigation --------------------------------------------------------------------------- */
  var menue = $('[data-menue]');
  $('[data-menue-oeffnen]').addEventListener('click', function () { menue.showModal(); });
  if ('IntersectionObserver' in window) {
    var links = $$('.nav__links a');
    var io = new IntersectionObserver(function (eintraege) {
      eintraege.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { a.setAttribute('aria-current', String(a.getAttribute('href') === '#' + e.target.id)); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['top', 'karte', 'geschichte', 'cafe', 'bestellen'].forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
  }

  /* 9 Einblenden beim Scrollen (einmalig, kurz gestaffelt) ---------------------------------- */
  if (bewegung() && 'IntersectionObserver' in window) {
    var revealIO = new IntersectionObserver(function (eintraege) {
      var n = 0;
      eintraege.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.style.transitionDelay = Math.min(n++, 4) * 60 + 'ms';
        e.target.classList.add('ist-sichtbar');
        revealIO.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.08 });
    $$('[data-reveal]').forEach(function (el) { revealIO.observe(el); });
  }

  /* 10 Blätter per Wisch nach unten schließen (nur Handy-Layout) ----------------------------
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

  /* 11 Toast --------------------------------------------------------------------------------- */
  var toastOrt = $('[data-toasts]'), toastTimer = null;
  function toast(text, knopfText, aktion) {
    var alt = $('.toast', toastOrt);
    if (alt) alt.remove();
    var el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = '<span>' + esc(text) + '</span>' + (knopfText ? '<button type="button">' + esc(knopfText) + '</button>' : '');
    toastOrt.appendChild(el);
    var weg = function () {
      clearTimeout(toastTimer);
      el.classList.add('geht');
      el.classList.remove('ist-da');
      setTimeout(function () { el.remove(); }, 260);
    };
    if (knopfText) $('button', el).addEventListener('click', function () { weg(); aktion(); });
    el.getBoundingClientRect();
    el.classList.add('ist-da');
    var starten = function () { clearTimeout(toastTimer); toastTimer = setTimeout(weg, 4500); };
    el.addEventListener('pointerenter', function () { clearTimeout(toastTimer); });
    el.addEventListener('pointerleave', starten);
    starten();
  }
})();
