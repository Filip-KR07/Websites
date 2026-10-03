/* Jeff's Cheesecake – „Stadtpark“. Seitenlogik ohne Bibliotheken.
   1 Grundlagen          2 Saison (Aufmacher, Akzent)   3 Kuchen & Filter     4 Kuchen-Dialog
   5 Bestellung (Korb)   6 Bestellformular (Tage, Uhrzeit, E-Mail)              7 Öffnungsstatus
   8 Kopf & Navigation   9 Auftritt & Einblenden        10 Blätter per Wisch  11 Toast */
(function () {
  'use strict';

  /* 1 Grundlagen ---------------------------------------------------------------- */
  var html = document.documentElement;
  html.classList.add('js-ok');

  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var bewegung = function () { return html.classList.contains('motion'); };
  var euro = function (n) { return n.toLocaleString('de-DE', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }) + ' €'; };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var speicher = {
    lesen: function (k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    schreiben: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* privater Modus: egal */ } }
  };
  var SPEICHER_KEY = 'jeffs-stadtpark-bestellung';
  var WOCHENTAG = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

  /* Jetzt in Hamburg (unabhängig von der Zeitzone des Geräts) */
  function jetztInHamburg() {
    var t = {};
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', year: 'numeric', month: 'numeric', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(new Date()).forEach(function (p) { t[p.type] = p.value; });
    return {
      jahr: +t.year, monat: +t.month, tag: +t.day,
      wochentag: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(t.weekday),
      min: (+t.hour) * 60 + (+t.minute)
    };
  }

  /* 2 Saison ---------------------------------------------------------------------
     Herbst (Sep–Nov): Pumpkin Polka steht im HTML. Winter (Dez–Feb): Cinnamon Crossover.
     Frühling/Sommer (Mär–Aug): Latin Lemon. Zum Ansehen: ?saison=winter | sommer | herbst */
  var heute = jetztInHamburg();
  var SAISON = (function () {
    var wahl = (location.search.match(/[?&]saison=(herbst|winter|sommer|fruehling)\b/) || [])[1];
    var m = heute.monat;
    if (wahl === 'fruehling') { wahl = 'sommer'; m = 4; }
    else if (wahl === 'sommer') m = 7;
    else if (wahl === 'winter') m = 12;
    else if (wahl === 'herbst') m = 10;
    if (m >= 9 && m <= 11) return { id: 'herbst', name: 'Herbst', ausgabe: 'Herbst ' + heute.jahr, kuchen: 'pumpkin-polka' };
    if (m === 12 || m <= 2) {
      var j = m === 12 ? heute.jahr : heute.jahr - 1;
      return { id: 'winter', name: 'Winter', ausgabe: 'Winter ' + j + '/' + String(j + 1).slice(2), kuchen: 'cinnamon-crossover' };
    }
    var name = m <= 5 ? 'Frühling' : 'Sommer';
    return { id: 'sommer', name: name, ausgabe: name + ' ' + heute.jahr, kuchen: 'latin-lemon' };
  })();
  if (SAISON.id !== 'herbst') {
    html.dataset.saison = SAISON.id;
    var vorlage = $('[data-saison-vorlage="' + SAISON.id + '"]');
    var ort = $('[data-saison-inhalt]');
    if (vorlage && ort) {
      ort.innerHTML = '';
      ort.appendChild(vorlage.content.cloneNode(true));
    }
  }
  $$('[data-saison-name]').forEach(function (el) { el.textContent = SAISON.name; });
  $$('[data-saison-ausgabe]').forEach(function (el) { el.textContent = SAISON.ausgabe; });

  /* 3 Kuchen & Filter ---------------------------------------------------------------- */
  var raster = $('[data-raster]');
  var kuchen = {};
  var karten = $$('.kuchen', raster);
  if (SAISON.id !== 'herbst') {
    /* Außerhalb des Herbstes: Kürbis ans Ende, der Saisonkuchen nach vorn */
    var kuerbis = $('[data-id="pumpkin-polka"]', raster);
    var vorn = $('[data-id="' + SAISON.kuchen + '"]', raster);
    if (kuerbis) { kuerbis.classList.remove('kuchen--saison'); raster.appendChild(kuerbis); }
    if (vorn) {
      vorn.classList.add('kuchen--saison');
      $('.kuchen__rubrik', vorn).textContent = 'Saison · ' + SAISON.name;
      raster.insertBefore(vorn, raster.firstChild);
    }
    karten = $$('.kuchen', raster);
  }
  karten.forEach(function (li) {
    var bild = $('img', li);
    var k = {
      id: li.dataset.id,
      rubrik: $('.kuchen__rubrik', li).textContent,
      name: $('.kuchen__name', li).textContent,
      desc: $('.kuchen__desc', li).textContent,
      alt: bild ? bild.alt : '',
      gross: li.dataset.gross === '1',
      groessen: JSON.parse(li.dataset.groessen || '[]'),
      optionen: JSON.parse(li.dataset.optionen || '[]'),
      diaet: (li.dataset.diaet || '').split(' ').filter(Boolean),
      el: li
    };
    k.bildKlein = 'img/k/' + k.id + '-400.webp';
    k.bildGross = k.gross ? 'img/k/' + k.id + '-800.webp' : k.bildKlein;
    kuchen[k.id] = k;
    var knopf = $('.kuchen__waehlen', li);
    knopf.setAttribute('aria-haspopup', 'dialog');
    knopf.addEventListener('click', function () { oeffneKuchen(k.id); });
  });

  var filterKnoepfe = $$('[data-filter-wert]');
  var filterInfo = $('[data-filter-info]');
  function zaehle(wert) { return karten.filter(function (li) { return wert === 'alle' || kuchen[li.dataset.id].diaet.indexOf(wert) > -1; }).length; }
  $$('[data-filter-zahl]').forEach(function (el) { el.textContent = zaehle(el.dataset.filterZahl); });
  function filtern(wert) {
    raster.classList.add('ist-gefiltert');
    filterKnoepfe.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.filterWert === wert)); });
    var sichtbar = 0;
    karten.forEach(function (li) {
      var passt = wert === 'alle' || kuchen[li.dataset.id].diaet.indexOf(wert) > -1;
      li.hidden = !passt;
      if (passt) sichtbar++;
    });
    $('[data-raster-leer]').hidden = sichtbar > 0;
    filterInfo.textContent = sichtbar + ' von ' + karten.length + ' Kuchen';
  }
  filterKnoepfe.forEach(function (b) { b.addEventListener('click', function () { filtern(b.dataset.filterWert); }); });
  var zurueck = $('[data-filter-zurueck]');
  if (zurueck) zurueck.addEventListener('click', function () { filtern('alle'); });

  function preisText(k) {
    var preise = k.groessen.map(function (g) { return g[1]; });
    var min = Math.min.apply(null, preise), max = Math.max.apply(null, preise);
    return min === max ? euro(min) : 'ab ' + euro(min);
  }

  /* 4 Kuchen-Dialog -------------------------------------------------------------------- */
  var kd = $('[data-kuchen-dialog]');
  var kdForm = $('[data-kd-form]');
  var kdBild = $('[data-kd-bild]');
  var kdMenge = 1, kdKuchen = null;

  function oeffneKuchen(id) {
    var k = kuchen[id];
    if (!k || !kd) return;
    kdKuchen = k; kdMenge = 1;
    kdBild.removeAttribute('srcset');
    kdBild.src = k.bildGross;
    if (k.gross) { kdBild.srcset = k.bildKlein + ' 400w, ' + k.bildGross + ' 800w'; kdBild.sizes = '(min-width: 760px) 440px, 100vw'; }
    kdBild.alt = k.alt;
    $('[data-kd-rubrik]', kd).textContent = k.rubrik + ' · ' + preisText(k);
    $('[data-kd-name]', kd).textContent = k.name;
    $('[data-kd-desc]', kd).textContent = k.desc;

    /* Vorauswahl: bei Torten die große (häufigste Bestellung), sonst die erste */
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
    toastWeg();
    kd.showModal();
    var scroller = blattLayout.matches ? $('.kd', kd) : $('.kd__inhalt', kd);
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
      toast(kdMenge + ' × ' + kdKuchen.name + ' (' + g[0] + ') liegt in deiner Bestellung', 'Ansehen', oeffneKorb);
    });
  }
  /* Knöpfe außerhalb des Rasters (Saison, Bildstrecke, Für Feste). Delegiert, weil der Saison-Inhalt getauscht wird. */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-kuchen-oeffnen]');
    if (b) oeffneKuchen(b.dataset.kuchenOeffnen);
  });

  /* Alle Dialoge: Schließen-Knöpfe und Klick auf den Hintergrund */
  $$('dialog').forEach(function (d) {
    d.addEventListener('click', function (e) {
      if (e.target === d) d.close();
      var s = e.target.closest('[data-schliessen]');
      if (s && d.contains(s)) d.close();
    });
  });

  /* 5 Bestellung (Korb) ------------------------------------------------------------------ */
  var korb = $('[data-korb]');
  var posten = (speicher.lesen(SPEICHER_KEY) || []).filter(function (p) { return p && kuchen[p.id]; });
  var zahl = $('[data-korb-zahl]');
  var korbKnopf = $('[data-korb-oeffnen]');

  function schluessel(p) { return [p.id, p.groesse, p.optionen.slice().sort().join('+')].join('|'); }
  function inDieBestellung(neu) {
    var gleich = posten.filter(function (p) { return schluessel(p) === schluessel(neu); })[0];
    if (gleich) gleich.menge = Math.min(20, gleich.menge + neu.menge);
    else posten.push(neu);
    speichern(true);
  }
  function anzahl() { return posten.reduce(function (s, p) { return s + p.menge; }, 0); }
  function summe() { return posten.reduce(function (s, p) { return s + p.preis * p.menge; }, 0); }
  function speichern(hinzugefuegt) {
    speicher.schreiben(SPEICHER_KEY, posten);
    var n = anzahl();
    zahl.textContent = n;
    zahl.hidden = !n;
    korbKnopf.setAttribute('aria-label', 'Bestellung öffnen, ' + n + ' Artikel');
    if (hinzugefuegt && bewegung() && zahl.animate) {
      zahl.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.25)' }, { transform: 'scale(1)' }], { duration: 300, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' });
    }
    korbZeichnen();
  }
  function korbZeichnen() {
    var leer = !posten.length;
    $('[data-korb-leer]').hidden = !leer || !$('[data-danke]').hidden;
    $('[data-korb-posten-teil]').hidden = leer;
    $('[data-bestellung]').hidden = leer;
    if (!leer) $('[data-danke]').hidden = true;
    $('[data-korb-summe]').textContent = euro(summe());
    $('[data-posten]').innerHTML = posten.map(function (p, i) {
      var k = kuchen[p.id];
      return '<li>' +
        '<img src="' + k.bildKlein + '" alt="" width="72" height="54" loading="lazy">' +
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
    toastWeg();
    korbZeichnen();
    if (!korb.open) korb.showModal();
  }
  korbKnopf.addEventListener('click', oeffneKorb);
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

  /* 6 Bestellformular ----------------------------------------------------------------------
     Regeln von jeffscakes.com: mindestens 3 Werktage Vorlauf, Lieferung 11–19 Uhr nur im Hamburger Raum
     (PLZ 20000–22999), Abholung zu den Café-Zeiten, Winterpause 23.12.–11.1.,
     Überweisung: frühestens 2 Tage nach Zahlungseingang. */
  var form = $('[data-bestellung]');
  var datum = $('[data-datum]'), zeit = $('[data-zeit]'), tageOrt = $('[data-tageswahl]');
  var OEFFNUNG = JSON.parse($('[data-zeiten]').dataset.zeiten);

  function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function ausIso(s) { var t = s.split('-'); return new Date(+t[0], +t[1] - 1, +t[2]); }
  function inWinterpause(d) {
    var m = d.getMonth() + 1, t = d.getDate();
    return (m === 12 && t >= 23) || (m === 1 && t <= 11);
  }
  function fruehestens() {
    var h = jetztInHamburg();
    var d = new Date(h.jahr, h.monat - 1, h.tag);
    var werktage = 0;
    while (werktage < 3) { d.setDate(d.getDate() + 1); if (d.getDay() > 0 && d.getDay() < 6) werktage++; }
    while (inWinterpause(d)) d.setDate(d.getDate() + 1);
    return d;
  }
  function art() { return form.elements.art.value; }

  /* Schnellwahl: die nächsten sechs möglichen Tage */
  function tageZeichnen() {
    var d = fruehestens(), tage = [];
    while (tage.length < 6) {
      if (!inWinterpause(d)) tage.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    tageOrt.innerHTML = tage.map(function (t) {
      var wert = iso(t);
      return '<button type="button" class="tag" data-tag="' + wert + '" aria-pressed="' + (wert === datum.value) + '"' +
        ' aria-label="' + esc(t.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })) + '">' +
        '<small>' + t.toLocaleDateString('de-DE', { weekday: 'short' }).replace('.', '') + '</small>' +
        '<strong>' + t.getDate() + '. ' + t.toLocaleDateString('de-DE', { month: 'short' }) + '</strong></button>';
    }).join('');
  }
  function tageMarkieren() {
    $$('.tag', tageOrt).forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.tag === datum.value)); });
  }
  tageOrt.addEventListener('click', function (e) {
    var b = e.target.closest('[data-tag]');
    if (!b) return;
    datum.value = b.dataset.tag;
    datum.dispatchEvent(new Event('change', { bubbles: true }));
  });

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
      hinweis.textContent = 'Frühestens am ' + min.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' }) + ', denn wir backen frisch.';
      hinweis.classList.remove('ist-fehler');
      return true;
    }
    var d = ausIso(datum.value), fehler = '';
    if (d < min) fehler = 'Wir brauchen mindestens drei Werktage. Frühester Termin: ' + min.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' }) + '.';
    else if (inWinterpause(d)) fehler = 'Vom 23. Dezember bis 11. Januar ist Winterpause, dann backen wir nicht.';
    hinweis.textContent = fehler || (art() === 'liefern' ? 'Lieferung am ' : 'Abholung am ') + d.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    hinweis.classList.toggle('ist-fehler', !!fehler);
    datum.setAttribute('aria-invalid', String(!!fehler));
    return !fehler;
  }
  if (form) {
    datum.min = iso(fruehestens());
    form.addEventListener('change', function (e) {
      if (e.target.name === 'art') { artWechsel(); datumPruefen(); }
      if (e.target.name === 'zahlung') $('[data-zahlung-hinweis]').hidden = form.elements.zahlung.value !== 'Überweisung';
      if (e.target === datum) { datumPruefen(); zeitenFuellen(); tageMarkieren(); }
      if (e.target.getAttribute('aria-invalid') === 'true' && e.target.value && e.target !== datum) e.target.removeAttribute('aria-invalid');
    });
    tageZeichnen(); artWechsel(); datumPruefen();

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
      ]).filter(function (z, i, a) { return z !== '' || a[i - 1] !== ''; }).join('\n').replace(/ /g, ' ');
      var betreff = 'Bestellung für ' + ausIso(f.datum.value).toLocaleDateString('de-DE') + ' (' + (art() === 'liefern' ? 'Lieferung' : 'Abholung') + ')';
      window.location.href = 'mailto:info@jeffscakes.com?subject=' + encodeURIComponent(betreff) + '&body=' + encodeURIComponent(text);
      posten = [];
      var danke = $('[data-danke]');
      danke.hidden = false;
      speichern(false);
      form.reset(); artWechsel(); datumPruefen(); tageMarkieren();
      $('[data-zahlung-hinweis]').hidden = true;
      danke.focus();
    });
  }
  /* Danke-Ansicht zurücksetzen, sobald der Dialog zu ist */
  korb.addEventListener('close', function () { if (!posten.length) { $('[data-danke]').hidden = true; korbZeichnen(); } });
  speichern(false);

  /* 7 Öffnungsstatus (Zeitzone Hamburg) ------------------------------------------------------ */
  function minuten(s) { var t = s.split(':'); return (+t[0]) * 60 + (+t[1]); }
  function uhr(s) { var t = s.split(':'); return +t[0] + (t[1] !== '00' ? ':' + t[1] : '') + ' Uhr'; }
  var chip = $('[data-offen]');
  function statusSetzen() {
    var j = jetztInHamburg(), text, kurz, offen = false;
    var z = OEFFNUNG[j.wochentag] && OEFFNUNG[j.wochentag].split('-');
    if (z && j.min >= minuten(z[0]) && j.min < minuten(z[1])) {
      offen = true; text = 'Jetzt geöffnet · bis ' + uhr(z[1]); kurz = 'Offen bis ' + uhr(z[1]).replace(' Uhr', '');
    } else if (z && j.min < minuten(z[0])) {
      text = 'Noch geschlossen · öffnet heute um ' + uhr(z[0]); kurz = 'Ab ' + uhr(z[0]);
    } else {
      for (var i = 1; i <= 7; i++) {
        var t = (j.wochentag + i) % 7, n = OEFFNUNG[t];
        if (n) { text = 'Geschlossen · öffnet ' + (i === 1 ? 'morgen' : WOCHENTAG[t]) + ' um ' + uhr(n.split('-')[0]); break; }
      }
      kurz = 'Geschlossen';
    }
    $$('[data-status]').forEach(function (s) {
      $('[data-status-text]', s).textContent = text;
      s.classList.toggle('ist-offen', offen);
      s.classList.toggle('ist-zu', !offen);
      s.hidden = false;
    });
    if (chip) {
      $('[data-offen-text]', chip).textContent = kurz;
      chip.setAttribute('aria-label', text + ' – Öffnungszeiten und Anfahrt');
      chip.classList.toggle('ist-offen', offen);
      chip.classList.toggle('ist-zu', !offen);
      chip.hidden = false;
    }
    $$('.zeiten tr').forEach(function (tr) { tr.classList.toggle('ist-heute', tr.dataset.tage.split(' ').indexOf(String(j.wochentag)) > -1); });
  }
  statusSetzen();
  setInterval(statusSetzen, 30000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) statusSetzen(); });

  /* 8 Kopf & Navigation -------------------------------------------------------------------- */
  var menue = $('[data-menue]');
  $('[data-menue-oeffnen]').addEventListener('click', function () { menue.showModal(); });
  var kopf = $('[data-kopf]'), kopfGeplant = false;
  function kopfZeichnen() { kopfGeplant = false; kopf.classList.toggle('ist-gescrollt', window.scrollY > 8); }
  window.addEventListener('scroll', function () { if (!kopfGeplant) { kopfGeplant = true; requestAnimationFrame(kopfZeichnen); } }, { passive: true });
  kopfZeichnen();
  if ('IntersectionObserver' in window) {
    var links = $$('.kopf__nav a');
    var navIO = new IntersectionObserver(function (eintraege) {
      eintraege.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { a.setAttribute('aria-current', String(a.getAttribute('href') === '#' + e.target.id)); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['top', 'cafe', 'saison', 'karte', 'jeff', 'anlaesse', 'bestellen'].forEach(function (id) { var s = document.getElementById(id); if (s) navIO.observe(s); });
  }

  /* 9 Auftritt & Einblenden -----------------------------------------------------------------
     Titel startet, sobald Café-Foto und Schriften da sind (Sicherheitsnetz im <head> nach 1,2 s). */
  var titelBild = $('[data-titel-bild]');
  function bereit() { html.classList.add('is-ready'); }
  Promise.all([
    titelBild && titelBild.decode ? titelBild.decode().catch(function () {}) : null,
    document.fonts ? document.fonts.ready : null
  ]).then(bereit, bereit);

  if (bewegung() && 'IntersectionObserver' in window) {
    var revealIO = new IntersectionObserver(function (eintraege) {
      var n = 0;
      eintraege.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.style.transitionDelay = Math.min(n++, 4) * 70 + 'ms';
        e.target.classList.add('ist-sichtbar');
        revealIO.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.1 });
    $$('[data-reveal]').forEach(function (el) { revealIO.observe(el); });
  }

  /* 10 Blätter per Wisch nach unten schließen (nur Handy-Layout) --------------------------
     Folgt dem Finger 1:1, nach oben mit Gummiband. Schnell gewischt (> 0,11 px/ms) oder über
     ein Viertel der Höhe gezogen: zu. Sonst federt es zurück. */
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

  /* 11 Toast ---------------------------------------------------------------------------------- */
  var toastOrt = $('[data-toasts]'), toastTimer = null;
  /* Ein Dialog geht auf: offenen Hinweis sofort wegnehmen, er läge sonst unter dem Schleier */
  function toastWeg() { clearTimeout(toastTimer); $$('.toast', toastOrt).forEach(function (t) { t.remove(); }); }
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
    if (knopfText) $('button', el).addEventListener('click', function () { aktion(); });
    el.getBoundingClientRect();
    el.classList.add('ist-da');
    var starten = function () { clearTimeout(toastTimer); toastTimer = setTimeout(weg, 5000); };
    el.addEventListener('pointerenter', function () { clearTimeout(toastTimer); });
    el.addEventListener('pointerleave', starten);
    starten();
  }
})();
