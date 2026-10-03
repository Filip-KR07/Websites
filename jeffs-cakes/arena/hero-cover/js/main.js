/* Jeff's Cakes – Seitenlogik ohne Bibliotheken.
   1 Cover (Hero)     2 Setlist (Vorschau, Filter)   3 Kuchen-Dialog   4 Bestellung
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

  /* 1 Cover (Hero) -----------------------------------------------------------
     Der Auftakt ist reines CSS (Abschnitt 5) und wartet auf nichts. Hier nur zwei Dinge:
     a) Einpassen: Jede große Zeile füllt ihre Spalte genau aus. Gestellt wird nur die Breitenachse von
        Archivo (62–125 %), die Schriftgröße bleibt aus dem CSS, also springt keine Höhe. Gemessen wird
        mit der echten Schrift; fehlt sie, bleiben die Näherungswerte aus dem CSS.
     b) Parallaxe: Beim Scrollen verschieben sich die Ebenen leicht gegeneinander (nur transform,
        nur solange das Cover sichtbar ist, aus bei „Bewegung reduzieren“ und ?motion=off). */
  var cover = $('.cover');
  html.classList.add('is-ready');

  if (cover) {
    $$('.cover__track', cover).forEach(function (b) { b.disabled = false; });   /* öffnet den Kuchen (Abschnitt 3) */
    var coverOben = $('.cover__block--oben', cover), coverUnten = $('.cover__block--unten', cover);
    var zCheese = $('[data-zeile="cheese"]', cover), zCake = $('[data-zeile="cake"]', cover), zJazz = $('[data-zeile="jazz"]', cover);
    var coverAmp = $('.cover__amp', cover), coverFoto = $('.cover__ebene', cover);
    var coverSchrift = false;

    var innenBreite = function (el) {
      var s = getComputedStyle(el);
      return el.clientWidth - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight);
    };
    /* Breitenachse so stellen, dass die Elemente zusammen genau „ziel“ Pixel breit sind.
       Reicht auch 125 % nicht (niedriges Fenster, Schrift nach Höhe begrenzt), wird gesperrt. */
    var passeBreite = function (els, ziel) {
      var setze = function (w) { els.forEach(function (el) { el.style.fontStretch = w + '%'; }); };
      var miss = function () { return els.reduce(function (s, el) { return s + el.getBoundingClientRect().width; }, 0); };
      var a = 62, b = 125;
      els.forEach(function (el) { el.style.letterSpacing = el.style.marginRight = ''; });
      setze(a); var wa = miss();
      setze(b); var wb = miss();
      if (ziel <= wa) return setze(a);
      if (ziel >= wb) {
        var zeichen = els.reduce(function (s, el) { return s + el.textContent.length; }, 0);
        var sperren = (ziel - wb) / zeichen;
        if (sperren > 0.5) els.forEach(function (el) { el.style.letterSpacing = sperren.toFixed(2) + 'px'; el.style.marginRight = (-sperren).toFixed(2) + 'px'; });
        return;
      }
      var w = a + (ziel - wa) / (wb - wa) * (b - a);   /* linear geschätzt … */
      setze(w); var m = miss();
      w = m > ziel ? a + (ziel - wa) / (m - wa) * (w - a) : w + (ziel - m) / (wb - m) * (b - w);   /* … und einmal nachgeschärft */
      setze(Math.round(w * 10) / 10);
    };
    var coverEinpassen = function () {
      if (!coverSchrift) return;
      var breit = innenBreite(coverOben);
      if (getComputedStyle(coverOben).flexDirection === 'row') passeBreite([zCheese, zCake], breit);   /* CHEESECAKE in einer Zeile */
      else { passeBreite([zCheese], breit); passeBreite([zCake], breit); }
      var luecke = parseFloat(getComputedStyle(coverUnten).columnGap) || 0;
      passeBreite([zJazz], innenBreite(coverUnten) - coverAmp.getBoundingClientRect().width - luecke);
    };
    if (document.fonts && document.fonts.load) {
      document.fonts.load('900 100px "Archivo"').then(function (f) {
        coverSchrift = !!(f && f.length);
        coverEinpassen();
      }, function () {});
    }
    var coverPassGeplant = false;
    var coverNeuPassen = function () { if (!coverPassGeplant) { coverPassGeplant = true; requestAnimationFrame(function () { coverPassGeplant = false; coverEinpassen(); }); } };
    if ('ResizeObserver' in window) new ResizeObserver(coverNeuPassen).observe(cover);
    else window.addEventListener('resize', coverNeuPassen);

    /* Parallaxe: „Cheesecake“ läuft nach links, „Jazz“ nach rechts, das Foto sinkt langsamer als die Seite */
    if (bewegung()) {
      var coverSichtbar = true, coverGeplant = false;
      var coverZeichnen = function () {
        coverGeplant = false;
        var h = cover.offsetHeight, y = Math.min(Math.max(window.scrollY, 0), h);
        zCheese.style.transform = zCake.style.transform = 'translate3d(' + (-y * 0.07).toFixed(1) + 'px,0,0)';
        zJazz.style.transform = 'translate3d(' + (y * 0.06).toFixed(1) + 'px,0,0)';
        coverAmp.style.transform = 'translate3d(0,' + (-y * 0.05).toFixed(1) + 'px,0) rotate(' + (-y * 0.012).toFixed(2) + 'deg)';
        coverFoto.style.transform = 'translate3d(0,' + Math.min(y * 0.12, coverFoto.offsetHeight * 0.12).toFixed(1) + 'px,0)';
      };
      var coverPlanen = function () { if (coverSichtbar && !coverGeplant) { coverGeplant = true; requestAnimationFrame(coverZeichnen); } };
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (e) { coverSichtbar = e[0].isIntersecting; coverPlanen(); }).observe(cover);
      }
      window.addEventListener('scroll', coverPlanen, { passive: true });
      coverPlanen();
    }
  }

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
