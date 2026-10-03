/* Jeff's Cakes – Entwurf „Plakat“. Seitenlogik ohne Bibliotheken.
   1 Start & Druck-Helfer     2 Line-up einlesen      3 Programm markieren   4 Abzug am Mauszeiger
   5 Act-Blatt                6 Bestellung            7 Bestellformular      8 Öffnungsstatus
   9 Navigation               10 Einblenden           11 Blätter per Wisch   12 Toast */
(function () {
  'use strict';

  var html = document.documentElement;
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var bewegung = function () { return html.classList.contains('motion'); };
  var euro = function (n) { return n.toLocaleString('de-DE', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }) + ' €'; };
  var speicher = {
    lesen: function (k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    schreiben: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* privat, egal */ } }
  };
  var SPEICHER = 'jeffs-plakat-bestellung';
  var BUEHNE = {
    '1': ['Bühne 1', 'Classics'],
    '2': ['Bühne 2', 'Fruity'],
    '3': ['Bühne 3', 'Specials'],
    gast: ['Special Guest', 'nur im Herbst']
  };

  /* 1 Start & Druck-Helfer ----------------------------------------------------
     Startanimation, sobald die Schrift da ist (sonst springt die Headliner-Breite). */
  var gedruckt = function () { requestAnimationFrame(function () { html.classList.add('gedruckt'); }); };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(gedruckt, gedruckt); else gedruckt();

  /* Ein Druck = zwei Platten mit demselben Graustufenbild (Raster macht das CSS) */
  function platte(n, src, alt) {
    return '<span class="druck__platte druck__platte--' + n + '"' + (n === 2 ? ' aria-hidden="true"' : '') + '>' +
      '<span class="druck__raster"><img src="' + src + '" width="640" height="640" alt="' + esc(alt) + '" decoding="async"></span></span>';
  }
  function druckFuellen(el, src, alt) { el.innerHTML = platte(2, src, '') + platte(1, src, alt); }

  /* 2 Line-up einlesen -------------------------------------------------------------- */
  var acts = [], kuchen = {};
  $$('.act').forEach(function (li) {
    var k = {
      id: li.dataset.id,
      buehne: li.dataset.buehne,
      name: $('.act__name', li).textContent,
      text: $('.act__text', li).textContent,
      groessen: JSON.parse(li.dataset.groessen || '[]'),
      optionen: JSON.parse(li.dataset.optionen || '[]'),
      diaet: (li.dataset.diaet || '').split(' ').filter(Boolean),
      bild: 'img/acts/' + li.dataset.id + '.webp',
      el: li
    };
    kuchen[k.id] = k;
    acts.push(k);
    var knopf = $('.act__knopf', li);
    knopf.setAttribute('aria-haspopup', 'dialog');
    knopf.addEventListener('click', function () { abzugWeg(); oeffneAct(k.id); });
    knopf.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') abzugZeigen(k, e); });
    knopf.addEventListener('pointermove', function (e) { if (e.pointerType !== 'mouse') return; if (abzugSichtbar) abzugZiel(e); else abzugZeigen(k, e); });
    knopf.addEventListener('pointerleave', abzugWeg);
  });
  /* Trennpunkte: am Zeilenende ausblenden, damit keine Zeile mit „•“ endet */
  function zeilenenden() {
    $$('.acts').forEach(function (ul) {
      var lis = $$('.act', ul);
      lis.forEach(function (li, i) {
        var n = lis[i + 1];
        li.classList.toggle('zeilenende', !!n && n.offsetTop > li.offsetTop + 2);
      });
    });
  }
  zeilenenden();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(zeilenenden);
  if ('ResizeObserver' in window) { var roZeilen = null; new ResizeObserver(function () { cancelAnimationFrame(roZeilen); roZeilen = requestAnimationFrame(zeilenenden); }).observe($('.lineup')); }

  function preisText(k) {
    var preise = k.groessen.map(function (g) { return g[1]; });
    var min = Math.min.apply(null, preise), max = Math.max.apply(null, preise);
    return min === max ? euro(min) : 'ab ' + euro(min);
  }

  /* 3 Programm markieren (wie mit dem Textmarker) ------------------------------------ */
  var markierInfo = $('[data-markier-info]');
  var MARKIER_TEXT = { gf: 'glutenfrei möglich', lf: 'laktosefrei möglich', vegan: 'vegan' };
  $$('[data-markier-wert]').forEach(function (chip) {
    chip.addEventListener('click', function () {
      var an = chip.getAttribute('aria-pressed') !== 'true';
      var wert = an ? chip.dataset.markierWert : null;
      $$('[data-markier-wert]').forEach(function (c) { c.setAttribute('aria-pressed', String(an && c === chip)); });
      var n = 0;
      acts.forEach(function (k) {
        var passt = !!wert && k.diaet.indexOf(wert) > -1;
        k.el.classList.toggle('ist-markiert', passt);
        if (passt) n++;
      });
      markierInfo.textContent = wert ? n + ' von ' + acts.length + ' Acts markiert: ' + MARKIER_TEXT[wert] : '';
    });
  });

  /* 4 Abzug: kleiner Probedruck läuft am Mauszeiger mit (nur feine Maus, dekorativ) ------- */
  var abzug = $('[data-abzug]');
  var abzugDruck = $('[data-abzug-druck]');
  var feineMaus = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 900px)');
  var ax = 0, ay = 0, zx = 0, zy = 0, abzugLaeuft = false, abzugSichtbar = false, abzugId = null;
  function abzugZeigen(k, e) {
    if (!abzug || !feineMaus.matches) return;
    if (abzugId !== k.id) {
      abzugId = k.id;
      druckFuellen(abzugDruck, k.bild, '');
      $('[data-abzug-name]', abzug).textContent = k.name;
      $('[data-abzug-preis]', abzug).textContent = preisText(k);
    }
    zx = e.clientX; zy = e.clientY;
    if (!abzugSichtbar) { ax = zx; ay = zy; }
    abzugSichtbar = true;
    abzug.classList.add('ist-da');
    abzugSchritt();
  }
  function abzugZiel(e) {
    if (!abzugSichtbar) return;
    zx = e.clientX; zy = e.clientY;
    if (!abzugLaeuft) { abzugLaeuft = true; requestAnimationFrame(abzugSchritt); }
  }
  function abzugSchritt() {
    var f = bewegung() ? 0.2 : 1;
    ax += (zx - ax) * f; ay += (zy - ay) * f;
    var b = abzug.offsetWidth, h = abzug.offsetHeight;
    var x = ax + 28 + b > window.innerWidth - 12 ? ax - b - 28 : ax + 28;
    var y = Math.max(12, Math.min(window.innerHeight - h - 12, ay - h * 0.55));
    abzug.style.transform = 'translate3d(' + Math.round(x) + 'px,' + Math.round(y) + 'px,0) rotate(-2deg)';
    if (abzugSichtbar && (Math.abs(zx - ax) > 0.4 || Math.abs(zy - ay) > 0.4)) requestAnimationFrame(abzugSchritt);
    else abzugLaeuft = false;
  }
  function abzugWeg() {
    if (!abzug) return;
    abzugSichtbar = false;
    abzug.classList.remove('ist-da');
  }
  window.addEventListener('scroll', function () { if (abzugSichtbar) abzugWeg(); }, { passive: true });

  /* 5 Act-Blatt ----------------------------------------------------------------------- */
  var ad = $('[data-act-dialog]');
  var adForm = $('[data-act-form]');
  var adMenge = 1, adKuchen = null;

  function oeffneAct(id) {
    var k = kuchen[id];
    if (!k || !ad) return;
    adKuchen = k; adMenge = 1;
    var b = BUEHNE[k.buehne] || ['', ''];
    $('[data-act-plakat]', ad).dataset.buehne = k.buehne;
    druckFuellen($('[data-act-druck]', ad), k.bild, k.name);
    $('[data-act-riesig]', ad).textContent = k.name;
    $('[data-act-buehne]', ad).innerHTML = '<span>' + esc(b[0]) + '</span> ' + esc(b[1]);
    $('[data-act-name]', ad).textContent = k.name;
    $('[data-act-text]', ad).textContent = k.text;

    var standard = k.groessen[0][0].indexOf('ø') === 0 ? k.groessen.length - 1 : 0;
    $('[data-act-groessen]', ad).innerHTML = k.groessen.map(function (g, i) {
      return '<label><input type="radio" name="groesse" value="' + i + '"' + (i === standard ? ' checked' : '') + '>' +
        '<span><strong>' + esc(g[0]) + '</strong><small>' + euro(g[1]) + '</small></span></label>';
    }).join('');
    $('[data-act-optionen-gruppe]', ad).hidden = !k.optionen.length;
    $('[data-act-optionen]', ad).innerHTML = k.optionen.map(function (o) {
      return '<label><input type="checkbox" name="option" value="' + esc(o) + '"> ' + esc(o) + '</label>';
    }).join('');

    var i = acts.indexOf(k);
    var vorher = acts[(i - 1 + acts.length) % acts.length], nachher = acts[(i + 1) % acts.length];
    $('[data-act-vorher]', ad).textContent = vorher.name;
    $('[data-act-nachher]', ad).textContent = nachher.name;
    $('[data-act-schritt="-1"]', ad).setAttribute('aria-label', 'Vorheriger Act: ' + vorher.name);
    $('[data-act-schritt="1"]', ad).setAttribute('aria-label', 'Nächster Act: ' + nachher.name);

    adAktualisieren();
    if (!ad.open) ad.showModal();
    adForm.scrollTop = 0;
    $('[data-act-inhalt]', ad).scrollTop = 0;
  }
  function adGroesse() {
    var r = $('input[name="groesse"]:checked', ad);
    return adKuchen.groessen[r ? +r.value : 0];
  }
  function adAktualisieren() {
    $('[data-act-menge]', ad).textContent = adMenge;
    $('[data-act-summe]', ad).textContent = euro(adGroesse()[1] * adMenge);
  }
  if (ad) {
    ad.addEventListener('change', adAktualisieren);
    $$('[data-menge]', ad).forEach(function (b) {
      b.addEventListener('click', function () {
        adMenge = Math.min(20, Math.max(1, adMenge + (+b.dataset.menge)));
        adAktualisieren();
      });
    });
    $$('[data-act-schritt]', ad).forEach(function (b) {
      b.addEventListener('click', function () {
        var i = acts.indexOf(adKuchen) + (+b.dataset.actSchritt);
        oeffneAct(acts[(i + acts.length) % acts.length].id);
      });
    });
    adForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var g = adGroesse();
      var optionen = $$('input[name="option"]:checked', ad).map(function (i) { return i.value; });
      inDieBestellung({ id: adKuchen.id, groesse: g[0], preis: g[1], optionen: optionen, menge: adMenge });
      ad.close();
      toast(adMenge + ' × ' + adKuchen.name + ' (' + g[0] + ') ist in deiner Bestellung', 'Ansehen', oeffneKorb);
    });
  }
  $$('[data-act-oeffnen]').forEach(function (b) {
    b.addEventListener('click', function () { oeffneAct(b.dataset.actOeffnen); });
  });
  /* Bühnenbilder öffnen ihren Act per Maus/Finger (für die Tastatur gibt es den Namen) */
  $$('[data-act-bild]').forEach(function (f) {
    f.addEventListener('click', function () { oeffneAct(f.dataset.actBild); });
  });

  /* Alle Dialoge: Schließen-Knöpfe und Klick auf den Hintergrund */
  $$('dialog').forEach(function (d) {
    d.addEventListener('click', function (e) {
      if (e.target === d) d.close();
      var s = e.target.closest('[data-schliessen]');
      if (s && d.contains(s)) d.close();
    });
  });

  /* 6 Bestellung ------------------------------------------------------------------------ */
  var korb = $('[data-korb]');
  var posten = (speicher.lesen(SPEICHER) || []).filter(function (p) { return p && kuchen[p.id]; });
  var zahl = $('[data-korb-zahl]');

  function schluessel(p) { return [p.id, p.groesse, p.optionen.slice().sort().join('+')].join('|'); }
  function inDieBestellung(neu) {
    var gleich = posten.filter(function (p) { return schluessel(p) === schluessel(neu); })[0];
    if (gleich) gleich.menge = Math.min(20, gleich.menge + neu.menge);
    else posten.push(neu);
    speichern(true);
  }
  function speichern(hinzugefuegt) {
    speicher.schreiben(SPEICHER, posten);
    var anzahl = posten.reduce(function (s, p) { return s + p.menge; }, 0);
    zahl.textContent = anzahl;
    zahl.hidden = !anzahl;
    $('[data-korb-oeffnen]').setAttribute('aria-label', 'Bestellung öffnen, ' + anzahl + ' Artikel');
    if (hinzugefuegt && bewegung() && zahl.animate) {
      zahl.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.35)' }, { transform: 'scale(1)' }], { duration: 320, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' });
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
        '<div class="druck" aria-hidden="true">' + platte(2, k.bild, '') + platte(1, k.bild, '') + '</div>' +
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
      if (gleich) gleich.focus(); else $('#korb-titel').focus();
    }
    if (w) { posten.splice(+w.dataset.pWeg, 1); speichern(false); $('#korb-titel').focus(); }
  });

  /* 7 Bestellformular -----------------------------------------------------------------
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
        if (!ok && !fehler.length) fehler.push(f);
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
      var text = ['Hallo Jeff,', '', 'ich möchte bestellen:', ''].concat(zeilen, [
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
      $$('[aria-invalid]', form).forEach(function (el) { el.removeAttribute('aria-invalid'); });
      $('[data-zahlung-hinweis]').hidden = true;
      $('[data-korb-leer]').hidden = true;
      var danke = $('[data-danke]');
      danke.hidden = false;
      danke.focus();
    });
  }
  speichern(false);

  /* 8 Öffnungsstatus (Zeitzone Hamburg) -------------------------------------------------- */
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
    var j = jetztInHamburg(), text = '', offen = false;
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

  /* 9 Navigation ----------------------------------------------------------------------------- */
  var menue = $('[data-menue]');
  $('[data-menue-oeffnen]').addEventListener('click', function () { menue.showModal(); });
  if ('IntersectionObserver' in window) {
    var links = $$('.leiste__links a');
    var navIO = new IntersectionObserver(function (eintraege) {
      eintraege.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { a.setAttribute('aria-current', String(a.getAttribute('href') === '#' + e.target.id)); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['top', 'lineup', 'bestellen', 'cafe', 'geschichte'].forEach(function (id) { var s = document.getElementById(id); if (s) navIO.observe(s); });
  }

  /* 10 Einblenden beim Scrollen ----------------------------------------------------------------- */
  if (bewegung() && 'IntersectionObserver' in window) {
    var ziele = $$('.lineup__kopf .titel, .buehne, .gast__innen, .vorverkauf .titel, .schritt, .vorverkauf__fuss, .feiern .titel, .feier, .spielort__kopf, .spielort__bild, .spielort__info, .spielort__kasse, .geschichte__kopf, .geschichte__zitat, .geschichte__jeff, .geschichte__text');
    ziele.forEach(function (el) { el.setAttribute('data-ein', ''); });
    var einIO = new IntersectionObserver(function (eintraege) {
      var n = 0;
      eintraege.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.style.transitionDelay = Math.min(n++, 4) * 60 + 'ms';
        e.target.classList.add('ist-da');
        einIO.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.08 });
    ziele.forEach(function (el) { einIO.observe(el); });
    html.classList.add('einblenden');
  }

  /* 11 Blätter per Wisch nach unten schließen (nur Handy-Layout) ---------------------------------
     Folgt dem Finger 1:1, nach oben mit Gummiband. Schnell gewischt (> 0,11 px/ms) oder
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

  /* 12 Toast ------------------------------------------------------------------------------------------ */
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
      setTimeout(function () { el.remove(); }, 240);
    };
    if (knopfText) $('button', el).addEventListener('click', function () { weg(); aktion(); });
    el.getBoundingClientRect();
    el.classList.add('ist-da');
    var starten = function () { clearTimeout(toastTimer); toastTimer = setTimeout(weg, 5000); };
    el.addEventListener('pointerenter', function () { clearTimeout(toastTimer); });
    el.addEventListener('pointerleave', starten);
    starten();
  }

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
})();
