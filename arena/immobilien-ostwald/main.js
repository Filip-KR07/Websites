/* ==========================================================================
   Ostwald Immobilien · Modell „Adresse“
   Ohne Build-Schritt. Optional: GSAP + ScrollTrigger, Lenis (assets/vendor).
   Alle Inhalte funktionieren auch ohne JavaScript und ohne diese Bibliotheken.
   ========================================================================== */
(function () {
  'use strict';
  window.__ostwaldReady = true;

  /* ------------------------------------------------------------------
     1) IMMOBILIENBEWERTUNG – fiktive Beispiel-Richtwerte (Stand 2026)
        Alle Werte sind erfunden und dienen nur der Demo.
     ------------------------------------------------------------------ */
  var VALUATION = {
    // Richtwert Eigentumswohnung, Bestand, gepflegt, 80–130 m² – Euro je m² Wohnfläche
    BASE_SQM: {
      westend: 9600, nordend: 8100, innenstadt: 8500, sachsenhausen: 7400, bornheim: 6900, ostend: 6800,
      bockenheim: 6700, europaviertel: 7600, dornbusch: 7100, riedberg: 6300, niederrad: 5500, hoechst: 4200
    },
    TYPE: { wohnung: 1.0, haus: 1.06, reihenhaus: 0.95, mfh: 0.74 },   // Objektart
    AGE: { vor1919: 1.04, 1919: 0.92, 1949: 0.86, 1979: 0.91, 2000: 1.0, 2015: 1.12 }, // Baujahr
    STATE: { renovierung: 0.8, gepflegt: 1.0, modernisiert: 1.08, neuwertig: 1.15 },    // Zustand
    EXTRA_PCT: { balkon: 0.03, aufzug: 0.02, garten: 0.03 },  // Zuschläge in Prozent
    PARKING: 28000,      // Stellplatz oder Garage pauschal in Euro
    SIZE: [               // Größenfaktor: bis [m²] → Faktor
      [45, 1.08], [80, 1.03], [130, 1.0], [200, 0.96], [Infinity, 0.92]
    ],
    SPREAD: 0.07,        // ± 7 % Spanne
    ROUND: 5000,         // Rundung der Spanne
    DEFAULT_AREA: { wohnung: 95, haus: 150, reihenhaus: 130, mfh: 520 },
    MAX_AREA: { wohnung: 400, haus: 600, reihenhaus: 400, mfh: 1500 }
  };

  /* ------------------------------------------------------------------
     2) FINANZIERUNGSRECHNER – Kaufnebenkosten Hessen (Beispielwerte)
     ------------------------------------------------------------------ */
  var FINANCE = {
    GRUNDERWERBSTEUER: 0.06,  // Hessen 6 %
    NOTAR_GRUNDBUCH: 0.02,    // ca. 2 %
    MAKLER: 0.0357,           // 3,57 % inkl. MwSt. (Käuferanteil)
    MAX_YEARS: 80             // Abbruch der Simulation
  };

  /* ------------------------------------------------------------------
     3) OBJEKTE – fiktive Exposé-Daten (Grundrisse in Metern)
     ------------------------------------------------------------------ */
  var IMG = {
    'altbau': [641, 'Altbau-Wohnzimmer mit Fischgrätparkett, blauem Sofa und hohen Sprossenfenstern'],
    'altbau-salon': [641, 'Wohnraum mit grauem Sofa, rundem Holztisch und hohem Fenster'],
    'altbau-essen': [620, 'Essbereich mit rundem Marmortisch, weißen Stühlen und Blick in die Küche'],
    'dach-lounge': [540, 'Sitzecke mit gelben Sesseln vor einer grafisch gestalteten Wand'],
    'dach-wohnen': [640, 'Heller Wohnraum mit weißer Ledercouch und Glastisch'],
    'glass': [721, 'Gläserne Hochhausfassade von unten gesehen'],
    'haus': [636, 'Stadthaus mit Holzfassade hinter Birken in der Abendsonne'],
    'haus-treppe': [627, 'Blick von der Galerie über eine geschwungene Treppe in den Wohnraum'],
    'hell': [640, 'Heller Raum mit weißem Sofa und Grünpflanze vor weißer Wand'],
    'hell-tisch': [1280, 'Kleiner weißer Esstisch mit zwei Stühlen und Orchidee'],
    'loft': [640, 'Loft mit Sichtmauerwerk, grauem Sofa und dunklem Dielenboden'],
    'loft-holz': [640, 'Wohnraum mit Holzverkleidung, Kamin und Fensterfront im Abendlicht'],
    'neubau': [640, 'Neubaufassade mit Holzbalkonen im Gegenlicht'],
    'neubau-schlafen': [640, 'Schlafzimmer mit raumhohem Vorhang und warmer Holzverkleidung'],
    'villa': [720, 'Moderne Villa mit Holzdeck und rundem Pool vor weitem Hügelpanorama']
  };

  var OBJECTS = {
    'OW-2611': {
      title: 'Altbau mit Fischgrätparkett nahe Palmengarten', loc: 'Westend-Süd', type: 'Altbauwohnung', district: 'westend',
      mode: 'kauf', price: 1290000, area: 128, rooms: 4, year: '1908', floor: '2. OG von 4', avail: 'nach Vereinbarung',
      heating: 'Gas-Zentralheizung (2019)', extra: ['Hausgeld', '465 € / Monat'],
      energy: { cls: 'E', val: 148, kind: 'Verbrauch' },
      text: 'Gründerzeithaus von 1908, zwei Straßen vom Palmengarten: 3,40 m hohe Decken mit Stuck, Fischgrätparkett in Eiche und Flügeltüren zwischen Salon und Wohnzimmer. Küche 2021 erneuert, Bad 2018. Dach und Fassade hat die Eigentümergemeinschaft 2022 saniert.',
      features: ['Stuck & Flügeltüren', 'Balkon zum Hof', 'Kellerabteil', 'Fahrradraum'],
      photos: ['altbau', 'altbau-salon', 'hell-tisch'],
      plan: [{ label: '2. Obergeschoss', w: 12.4, h: 10.6, balcony: { side: 'top', from: 1.2, len: 3.4, depth: 1.4, name: 'Balkon' }, rooms: [
        { n: 'Wohnen', x: 0, y: 0, w: 5.6, h: 5.4 }, { n: 'Salon', x: 5.6, y: 0, w: 3.8, h: 5.4 }, { n: 'Küche', x: 9.4, y: 0, w: 3, h: 5.4 },
        { n: 'Flur', x: 0, y: 5.4, w: 12.4, h: 1.6, t: 'hall' },
        { n: 'Schlafen', x: 0, y: 7, w: 4.6, h: 3.6 }, { n: 'Arbeiten', x: 4.6, y: 7, w: 3.4, h: 3.6 },
        { n: 'Bad', x: 8, y: 7, w: 2.8, h: 3.6, t: 'wet' }, { n: 'Abst.', x: 10.8, y: 7, w: 1.6, h: 3.6, t: 'store' }
      ] }]
    },
    'OW-2604': {
      title: 'Dachgeschoss mit Blick über den Holzhausenpark', loc: 'Nordend-West', type: 'Dachgeschosswohnung', district: 'nordend',
      mode: 'kauf', price: 985000, area: 104, rooms: 3, year: 'DG-Ausbau 2016', floor: '4. OG (DG) · Aufzug', avail: 'ab März 2027',
      heating: 'Fernwärme, Fußbodenheizung', extra: ['Hausgeld', '390 € / Monat'],
      energy: { cls: 'B', val: 58, kind: 'Bedarf' },
      text: 'Ausbau von 2016 mit Aufzug bis in die Wohnung, Fußbodenheizung und bodentiefen Fenstern. Vom Essplatz geht der Blick über die Baumkronen des Holzhausenparks, die Loggia liegt nach Westen. Ein Tiefgaragenstellplatz kann für 35.000 € dazu erworben werden.',
      features: ['Aufzug', 'Fußbodenheizung', 'Loggia West', 'TG-Stellplatz optional'],
      photos: ['dach-wohnen', 'dach-lounge', 'hell'],
      plan: [{ label: 'Dachgeschoss', w: 12, h: 9.6, slope: true, balcony: { side: 'right', from: 1, len: 3.4, depth: 1.6, name: 'Loggia' }, rooms: [
        { n: 'Wohnen', x: 0, y: 0, w: 7.2, h: 5 }, { n: 'Küche', x: 7.2, y: 0, w: 2.8, h: 5 }, { n: 'HWR', x: 10, y: 0, w: 2, h: 5, t: 'store' },
        { n: 'Flur', x: 0, y: 5, w: 12, h: 1.4, t: 'hall' },
        { n: 'Schlafen', x: 0, y: 6.4, w: 5, h: 3.2 }, { n: 'Arbeiten', x: 5, y: 6.4, w: 3.6, h: 3.2 }, { n: 'Bad', x: 8.6, y: 6.4, w: 3.4, h: 3.2, t: 'wet' }
      ] }]
    },
    'OW-2587': {
      title: 'Stadthaus mit Holzfassade und Garten', loc: 'Dornbusch', type: 'Einfamilienhaus', district: 'dornbusch',
      mode: 'kauf', price: 1650000, area: 182, rooms: 6, year: '1998', floor: 'EG, OG und Keller', avail: 'ab Sommer 2027',
      heating: 'Wärmepumpe (2023)', extra: ['Grundstück', '410 m²'],
      energy: { cls: 'B', val: 64, kind: 'Bedarf' },
      text: 'Architektenhaus mit Lärchenfassade auf 410 m² Grundstück in einer ruhigen Anliegerstraße, fünf Minuten zur U-Bahn Dornbusch. 2023 kamen Wärmepumpe und Photovoltaik dazu. Diele mit offener Treppe, Wohnbereich mit Kamin und Zugang zum Südgarten.',
      features: ['Südgarten', 'Kamin', 'Photovoltaik', 'Garage', 'Vollkeller'],
      photos: ['haus', 'haus-treppe', 'loft-holz'],
      plan: [
        { label: 'Erdgeschoss', short: 'EG', w: 9.6, h: 10, balcony: { side: 'top', from: 0.6, len: 7, depth: 2.2, name: 'Terrasse' }, rooms: [
          { n: 'Wohnen', x: 0, y: 0, w: 6, h: 5.6 }, { n: 'Essen', x: 6, y: 0, w: 3.6, h: 5.6 },
          { n: 'Diele', x: 3.6, y: 5.6, w: 6, h: 1.8, t: 'hall' }, { n: 'Küche', x: 0, y: 5.6, w: 3.6, h: 4.4 },
          { n: 'Arbeiten', x: 3.6, y: 7.4, w: 3.4, h: 2.6 }, { n: 'WC', x: 7, y: 7.4, w: 2.6, h: 2.6, t: 'wet' }
        ] },
        { label: 'Obergeschoss', short: 'OG', w: 9.6, h: 10, rooms: [
          { n: 'Schlafen', x: 0, y: 0, w: 5, h: 5 }, { n: 'Kind', x: 5, y: 0, w: 4.6, h: 5 },
          { n: 'Flur', x: 0, y: 5, w: 9.6, h: 1.4, t: 'hall' },
          { n: 'Kind 2', x: 0, y: 6.4, w: 4, h: 3.6 }, { n: 'Bad', x: 4, y: 6.4, w: 3, h: 3.6, t: 'wet' }, { n: 'Ankleide', x: 7, y: 6.4, w: 2.6, h: 3.6, t: 'store' }
        ] }
      ]
    },
    'OW-2571': {
      title: 'Villa am Lerchesberg mit Pool und Taunusblick', loc: 'Sachsenhausen-Süd', type: 'Villa', district: 'sachsenhausen-sued',
      mode: 'kauf', price: 2480000, area: 264, rooms: 7, year: '2007', floor: 'EG, OG und Keller', avail: 'nach Vereinbarung',
      heating: 'Gas-Brennwert, Solarthermie', extra: ['Grundstück', '980 m²'],
      energy: { cls: 'C', val: 88, kind: 'Bedarf' },
      text: 'Hanglage am Lerchesberg mit Fernblick bis in den Taunus. Wohnebene mit 42 m² Wohnzimmer, Glasfront zur Terrasse und beheiztem Außenpool; im Obergeschoss ein Elternbereich mit Ankleide und Bad en suite. Verkauf diskret – Besichtigung nur nach Vorprüfung.',
      features: ['Außenpool', 'Fernblick', 'Doppelgarage', 'Bad en suite', 'Weinkeller'],
      photos: ['villa', 'loft-holz', 'neubau-schlafen'],
      plan: [
        { label: 'Erdgeschoss', short: 'EG', w: 13, h: 10.4, balcony: { side: 'top', from: 0.5, len: 9, depth: 2.6, name: 'Terrasse & Pool' }, rooms: [
          { n: 'Wohnen', x: 0, y: 0, w: 7, h: 6 }, { n: 'Essen', x: 7, y: 0, w: 3.6, h: 6 }, { n: 'Küche', x: 10.6, y: 0, w: 2.4, h: 6 },
          { n: 'Halle', x: 4, y: 6, w: 9, h: 1.6, t: 'hall' }, { n: 'Gast', x: 0, y: 6, w: 4, h: 4.4 },
          { n: 'Arbeiten', x: 4, y: 7.6, w: 3.6, h: 2.8 }, { n: 'WC', x: 7.6, y: 7.6, w: 1.8, h: 2.8, t: 'wet' }, { n: 'HWR', x: 9.4, y: 7.6, w: 3.6, h: 2.8, t: 'store' }
        ] },
        { label: 'Obergeschoss', short: 'OG', w: 13, h: 10.4, rooms: [
          { n: 'Schlafen', x: 0, y: 0, w: 6, h: 5.4 }, { n: 'Ankleide', x: 6, y: 0, w: 2.4, h: 5.4, t: 'store' }, { n: 'Bad', x: 8.4, y: 0, w: 4.6, h: 5.4, t: 'wet' },
          { n: 'Flur', x: 0, y: 5.4, w: 13, h: 1.6, t: 'hall' },
          { n: 'Kind', x: 0, y: 7, w: 4.4, h: 3.4 }, { n: 'Kind 2', x: 4.4, y: 7, w: 4.4, h: 3.4 }, { n: 'Dusche', x: 8.8, y: 7, w: 2.2, h: 3.4, t: 'wet' }, { n: 'Abst.', x: 11, y: 7, w: 2, h: 3.4, t: 'store' }
        ] }
      ]
    },
    'OW-2545': {
      title: 'Maisonette zwei Straßen von der Schweizer Straße', loc: 'Sachsenhausen-Nord', type: 'Maisonette', district: 'sachsenhausen-nord',
      mode: 'kauf', price: 845000, area: 96, rooms: 3, year: '1912', floor: '4. OG und DG', avail: 'ab Januar 2027',
      heating: 'Gas-Etagenheizung', extra: ['Hausgeld', '310 € / Monat'],
      energy: { cls: 'D', val: 121, kind: 'Verbrauch' },
      text: 'Zwei Ebenen im Dach eines Jugendstilhauses: unten Wohnen mit offener Küche, oben Schlaf- und Arbeitszimmer unter sichtbaren Balken. Die Schweizer Straße mit Wochenmarkt liegt zwei Minuten entfernt, das Mainufer zehn.',
      features: ['Offene Treppe', 'Sichtbalken', 'Dachfenster', 'Kellerabteil'],
      photos: ['altbau-essen', 'haus-treppe', 'altbau-salon'],
      plan: [
        { label: '4. Obergeschoss', short: '4. OG', w: 8.4, h: 7, rooms: [
          { n: 'Wohnen', x: 0, y: 0, w: 5.2, h: 7 }, { n: 'Küche', x: 5.2, y: 0, w: 3.2, h: 2.6 },
          { n: 'Treppe', x: 5.2, y: 2.6, w: 3.2, h: 1.8, t: 'hall' }, { n: 'Bad', x: 5.2, y: 4.4, w: 3.2, h: 2.6, t: 'wet' }
        ] },
        { label: 'Dachgeschoss', short: 'DG', w: 8.4, h: 5.6, slope: true, rooms: [
          { n: 'Schlafen', x: 0, y: 0, w: 4.6, h: 5.6 }, { n: 'Galerie', x: 4.6, y: 0, w: 1.6, h: 5.6, t: 'hall' }, { n: 'Arbeiten', x: 6.2, y: 0, w: 2.2, h: 5.6 }
        ] }
      ]
    },
    'OW-2552': {
      title: 'Vermietete Zwei-Zimmer-Wohnung für Kapitalanleger', loc: 'Bockenheim', type: 'Etagenwohnung, vermietet', district: 'bockenheim',
      mode: 'kauf', price: 420000, area: 58, rooms: 2, year: '1961', floor: '1. OG von 5 · Aufzug', avail: 'vermietet seit 2017',
      heating: 'Fernwärme', extra: ['Mieteinnahme', '1.140 € kalt / Monat'],
      energy: { cls: 'C', val: 96, kind: 'Verbrauch' },
      text: 'Seit 2017 zuverlässig vermietet, Kaltmiete 1.140 € im Monat – das entspricht einer Bruttorendite von rund 3,3 %. Drei Minuten zur Leipziger Straße und zur U-Bahn Bockenheimer Warte. Fotos folgen nach Abstimmung mit dem Mieter, der Grundriss liegt vor.',
      features: ['Vermietet', 'Balkon', 'Aufzug', 'Kellerabteil'],
      photos: [], reserved: true,
      plan: [{ label: '1. Obergeschoss', w: 8.6, h: 7, balcony: { side: 'top', from: 0.8, len: 3, depth: 1.2, name: 'Balkon' }, rooms: [
        { n: 'Wohnen', x: 0, y: 0, w: 4.6, h: 4.2 }, { n: 'Schlafen', x: 4.6, y: 0, w: 4, h: 4.2 },
        { n: 'Küche', x: 0, y: 4.2, w: 3, h: 2.8 }, { n: 'Flur', x: 3, y: 4.2, w: 2.8, h: 2.8, t: 'hall' }, { n: 'Bad', x: 5.8, y: 4.2, w: 2.8, h: 2.8, t: 'wet' }
      ] }]
    },
    'OW-2598': {
      title: 'Loft mit Backsteinwand im früheren Lagerhaus', loc: 'Ostend', type: 'Loft', district: 'ostend',
      mode: 'miete', price: 2150, nk: 290, area: 86, rooms: 2, year: 'Umbau 2012', floor: '3. OG · Aufzug', avail: 'ab 1. Dezember',
      heating: 'Fernwärme', extra: ['Kaution', '3 Kaltmieten'],
      energy: { cls: 'C', val: 92, kind: 'Verbrauch' },
      text: 'Ehemaliges Lagerhaus nahe der Hanauer Landstraße: 3,60 m Raumhöhe, Sichtmauerwerk und Eichendielen. Offene Küche mit Insel, abgetrennter Schlafbereich, Bad mit bodengleicher Dusche. Zehn Minuten zur EZB, die Tram hält vor der Tür.',
      features: ['3,60 m Raumhöhe', 'Kücheninsel', 'Aufzug', 'Bodengleiche Dusche'],
      photos: ['loft', 'dach-lounge', 'loft-holz'],
      plan: [{ label: '3. Obergeschoss', w: 12.8, h: 7.2, rooms: [
        { n: 'Wohnen · Küche', x: 0, y: 0, w: 8, h: 7.2 }, { n: 'Schlafen', x: 8, y: 0, w: 4.8, h: 4.2 },
        { n: 'Flur', x: 8, y: 4.2, w: 2, h: 3, t: 'hall' }, { n: 'Bad', x: 10, y: 4.2, w: 2.8, h: 3, t: 'wet' }
      ] }]
    },
    'OW-2579': {
      title: 'Neubau mit Loggia im 7. Obergeschoss', loc: 'Europaviertel', type: 'Neubauwohnung', district: 'europaviertel',
      mode: 'miete', price: 1890, nk: 320, area: 92, rooms: 3, year: '2019', floor: '7. OG von 9 · Aufzug', avail: 'ab sofort',
      heating: 'Fernwärme, Fußbodenheizung', extra: ['Stellplatz', 'TG, 140 € / Monat'],
      energy: { cls: 'A', val: 41, kind: 'Bedarf' },
      text: 'Helle Ecklage mit Loggia nach Südwesten und Blick auf die Skyline. Einbauküche, Fußbodenheizung, Parkett und elektrische Rollläden. Messe und Skyline Plaza erreichen Sie zu Fuß, die U5 hält vor dem Haus.',
      features: ['Loggia Südwest', 'Einbauküche', 'Fußbodenheizung', 'Rollläden elektrisch'],
      photos: ['neubau', 'neubau-schlafen', 'glass'],
      plan: [{ label: '7. Obergeschoss', w: 11, h: 8.6, balcony: { side: 'top', from: 1, len: 4.2, depth: 1.6, name: 'Loggia' }, rooms: [
        { n: 'Wohnen', x: 0, y: 0, w: 6.6, h: 5 }, { n: 'Schlafen', x: 6.6, y: 0, w: 4.4, h: 5 },
        { n: 'Küche', x: 0, y: 5, w: 3.2, h: 3.6 }, { n: 'Flur', x: 3.2, y: 5, w: 7.8, h: 1.4, t: 'hall' },
        { n: 'Kind', x: 3.2, y: 6.4, w: 3.8, h: 2.2 }, { n: 'Bad', x: 7, y: 6.4, w: 4, h: 2.2, t: 'wet' }
      ] }]
    },
    'OW-2566': {
      title: 'Helle Zwei-Zimmer-Wohnung nahe Berger Straße', loc: 'Bornheim', type: 'Etagenwohnung', district: 'bornheim',
      mode: 'miete', price: 1290, nk: 230, area: 64, rooms: 2, year: '1956', floor: '2. OG von 4', avail: 'ab 1. Januar',
      heating: 'Gas-Zentralheizung', extra: ['Haustiere', 'nach Absprache'],
      energy: { cls: 'D', val: 118, kind: 'Verbrauch' },
      text: 'Ruhig zum Hof gelegen, frisch gestrichen, neue Dielen im Wohnzimmer. Die Berger Straße mit Cafés und Wochenmarkt ist drei Minuten entfernt, die U4 Bornheim Mitte fünf.',
      features: ['Balkon zum Hof', 'Wannenbad mit Fenster', 'Kellerabteil', 'Waschküche'],
      photos: ['hell', 'hell-tisch', 'altbau-essen'],
      plan: [{ label: '2. Obergeschoss', w: 9.2, h: 7.6, balcony: { side: 'top', from: 0.8, len: 3, depth: 1.2, name: 'Balkon' }, rooms: [
        { n: 'Wohnen', x: 0, y: 0, w: 5.2, h: 4.4 }, { n: 'Schlafen', x: 5.2, y: 0, w: 4, h: 4.4 },
        { n: 'Küche', x: 0, y: 4.4, w: 3.2, h: 3.2 }, { n: 'Flur', x: 3.2, y: 4.4, w: 3, h: 3.2, t: 'hall' }, { n: 'Bad', x: 6.2, y: 4.4, w: 3, h: 3.2, t: 'wet' }
      ] }]
    }
  };

  /* ------------------------------------------------------------------
     Grundlagen
     ------------------------------------------------------------------ */
  var BASE = '/arena/immobilien-ostwald/';
  var doc = document.documentElement;
  var qs = function (s, r) { return (r || document).querySelector(s); };
  var qsa = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var motionOff = doc.classList.contains('motion-off');
  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduced = motionOff || mqReduce.matches;
  var mqDesktop = window.matchMedia('(min-width: 900px)');
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasGSAP = !!(window.gsap && window.ScrollTrigger);
  var enhanced = hasGSAP && !reduced;
  var lenis = null;
  var SVGNS = 'http://www.w3.org/2000/svg';
  var NUM0 = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 });
  var fmt = function (n) { return NUM0.format(Math.round(n)); };
  var eur = function (n) { return fmt(n) + ' €'; };
  var dec = function (n, d) { return n.toLocaleString('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d }); };

  function safe(name, fn) {
    try { fn(); } catch (err) { if (window.console) console.warn('[Ostwald] ' + name + ':', err); }
  }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function svgEl(tag, attrs, text) {
    var n = document.createElementNS(SVGNS, tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (text != null) n.textContent = text;
    return n;
  }
  function headerH() { return mqDesktop.matches ? 76 : 64; }
  function focusNoScroll(n) { if (!n) return; try { n.focus({ preventScroll: true }); } catch (e) { n.focus(); } }

  var header = qs('[data-header]');

  /* ------------------------------------------------------------------
     Smooth Scroll (Lenis) + Anker
     ------------------------------------------------------------------ */
  function scrollToEl(target, done) {
    if (!target) return;
    var off = -(headerH() + 8);
    if (lenis) {
      lenis.scrollTo(target, { offset: off, duration: 1.3, onComplete: done });
    } else {
      var y = target.getBoundingClientRect().top + window.scrollY + off;
      window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
      if (done) setTimeout(done, reduced ? 30 : 600);
    }
  }
  function focusSection(target) {
    if (!target) return;
    if (!target.hasAttribute('tabindex') && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(target.tagName)) target.setAttribute('tabindex', '-1');
    setTimeout(function () { focusNoScroll(target); }, lenis ? 650 : 60);
  }

  function initScroll() {
    if (enhanced && window.Lenis) {
      lenis = new window.Lenis({ lerp: 0.11, smoothWheel: true });
      window.__lenis = lenis;
      lenis.on('scroll', window.ScrollTrigger.update);
      window.gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      window.gsap.ticker.lagSmoothing(0);
    }
    if (hasGSAP) window.gsap.registerPlugin(window.ScrollTrigger);
  }

  var ANLIEGEN = { verkaufen: 'Verkaufen', vermieten: 'Vermieten', suchen: 'Kaufen oder Mieten', bewertung: 'Bewertung vor Ort' };
  function setAnliegen(key) {
    var v = ANLIEGEN[key] || key;
    qsa('[data-contact-form] input[name="anliegen"]').forEach(function (r) { r.checked = (r.value === v); });
  }

  function initClicks() {
    document.addEventListener('click', function (e) {
      var t = e.target;
      if (!t.closest) return;
      var ex = t.closest('[data-expose]');
      if (ex && OBJECTS[ex.getAttribute('data-expose')]) {
        e.preventDefault();
        openExpose(ex.getAttribute('data-expose'), ex);
        return;
      }
      var a = t.closest('a[href^="#"]');
      if (!a || a.closest('[data-expose-dialog]')) return;
      var id = a.getAttribute('href').slice(1);
      var target = id && document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      if (a.hasAttribute('data-anliegen')) setAnliegen(a.getAttribute('data-anliegen'));
      var wasOpen = menuOpen;
      closeMenu(false);
      setTimeout(function () { scrollToEl(target); }, wasOpen && !reduced ? 120 : 0);
      if (history.replaceState) history.replaceState(null, '', '#' + id);
      focusSection(target);
    });
  }

  /* ------------------------------------------------------------------
     Kopfzeile, Fortschritt, aktive Navigation, Aktionsleiste
     ------------------------------------------------------------------ */
  function initHeader() {
    var bar = qs('[data-progress]');
    var ticking = false;
    function update() {
      ticking = false;
      var y = window.scrollY;
      header.classList.toggle('is-scrolled', y > 12);
      var max = document.documentElement.scrollHeight - window.innerHeight;
      if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? clamp(y / max, 0, 1) : 0).toFixed(4) + ')';
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update);
    update();

    // aktive Navigation
    var links = qsa('.main-nav a[href^="#"]');
    var map = {};
    links.forEach(function (l) { map[l.getAttribute('href').slice(1)] = l; });
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          var l = map[en.target.id];
          if (!l) return;
          if (en.isIntersecting) {
            links.forEach(function (x) { x.classList.remove('is-active'); x.removeAttribute('aria-current'); });
            l.classList.add('is-active');
            l.setAttribute('aria-current', 'true');
          } else if (l.classList.contains('is-active')) {
            l.classList.remove('is-active');
            l.removeAttribute('aria-current');
          }
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
    }

    // Aktionsleiste (Handy): im Kontaktbereich und bei Texteingabe ausblenden
    var actionBar = qs('.action-bar');
    if (actionBar) {
      var inContact = false, typing = false;
      var sync = function () { actionBar.classList.toggle('is-hidden', inContact || typing || menuOpen); };
      if ('IntersectionObserver' in window) {
        var contact = qs('#kontakt');
        var io2 = new IntersectionObserver(function (en) { inContact = en[0].isIntersecting; sync(); }, { rootMargin: '0px 0px -30% 0px' });
        if (contact) io2.observe(contact);
      }
      document.addEventListener('focusin', function (e) {
        typing = !!(e.target.matches && e.target.matches('input[type="text"], input[type="email"], input[type="tel"], textarea, select'));
        sync();
      });
      document.addEventListener('focusout', function () { typing = false; setTimeout(sync, 60); });
      actionBar.__sync = sync;
    }
  }

  /* ------------------------------------------------------------------
     Mobiles Menü
     ------------------------------------------------------------------ */
  var menuOpen = false;
  var toggle = qs('[data-menu-toggle]');
  var menu = qs('[data-menu]');
  var menuTimer = 0;
  function openMenu() {
    if (!menu || menuOpen) return;
    menuOpen = true;
    clearTimeout(menuTimer);
    menu.hidden = false;
    void menu.offsetWidth;
    menu.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    qs('.menu-toggle-label', toggle).textContent = 'Schließen';
    header.classList.add('menu-open');
    doc.classList.add('menu-lock');
    if (lenis) lenis.stop();
    var ab = qs('.action-bar'); if (ab && ab.__sync) ab.__sync();
    setTimeout(function () { focusNoScroll(qs('a', menu)); }, reduced ? 0 : 120);
  }
  function closeMenu(restore) {
    if (!menu || !menuOpen) return;
    menuOpen = false;
    menu.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    qs('.menu-toggle-label', toggle).textContent = 'Menü';
    header.classList.remove('menu-open');
    doc.classList.remove('menu-lock');
    if (lenis) lenis.start();
    var ab = qs('.action-bar'); if (ab && ab.__sync) ab.__sync();
    menuTimer = setTimeout(function () { if (!menuOpen) menu.hidden = true; }, reduced ? 0 : 440);
    if (restore) focusNoScroll(toggle);
  }
  function initMenu() {
    if (!toggle || !menu) return;
    toggle.addEventListener('click', function () { if (menuOpen) closeMenu(true); else openMenu(); });
    document.addEventListener('keydown', function (e) {
      if (!menuOpen) return;
      if (e.key === 'Escape') { e.preventDefault(); closeMenu(true); return; }
      if (e.key === 'Tab') {
        var f = [toggle].concat(qsa('a, button', menu));
        var i = f.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
        else if (i === -1) { e.preventDefault(); f[0].focus(); }
      }
    });
    mqDesktop.addEventListener && mqDesktop.addEventListener('change', function (m) { if (m.matches) closeMenu(false); });
  }

  /* ------------------------------------------------------------------
     Wort-Splits, Reveals, Stagger
     ------------------------------------------------------------------ */
  function splitWords(root) {
    var idx = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var parts = child.nodeValue.split(/(\s+)/);
          var frag = document.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
            var w = el('span', 'w');
            var wi = el('span', 'wi', p);
            wi.style.setProperty('--d', idx++);
            w.appendChild(wi);
            frag.appendChild(w);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1 && !child.classList.contains('visually-hidden')) {
          walk(child);
        }
      });
    })(root);
  }
  function initReveals() {
    var splits = qsa('[data-split]');
    if (!motionOff) splits.forEach(function (h) { splitWords(h); });
    qsa('[data-stagger]').forEach(function (list) {
      Array.prototype.forEach.call(list.children, function (c, i) { c.style.setProperty('--si', Math.min(i, 8)); });
    });
    var items = qsa('[data-reveal], [data-reveal-img], [data-split], [data-stagger]');
    if (motionOff || !('IntersectionObserver' in window)) {
      items.forEach(function (n) { n.classList.add('is-in', 'st-done'); });
      return;
    }
    // Elemente mit clip-path-Startzustand über ihr Elternelement beobachten (IO berücksichtigt den eigenen clip-path)
    var proxy = new Map();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var n = proxy.get(en.target) || en.target;
        n.classList.add('is-in');
        io.unobserve(en.target);
        if (n.hasAttribute('data-stagger')) {
          var count = Math.min(n.children.length, 9);
          setTimeout(function () { n.classList.add('st-done'); }, count * 70 + 1100);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.01 });
    items.forEach(function (n) {
      if (n.hasAttribute('data-reveal-img') && n.parentElement) { proxy.set(n.parentElement, n); io.observe(n.parentElement); }
      else io.observe(n);
    });
  }

  /* ------------------------------------------------------------------
     Hero-Intro, Zähler, Parallaxe
     ------------------------------------------------------------------ */
  function countUp(node, dur) {
    var target = parseFloat(node.getAttribute('data-count'));
    if (!isFinite(target)) return;
    var start = performance.now();
    node.textContent = '0';
    (function tick(now) {
      var t = clamp((now - start) / dur, 0, 1);
      var e = 1 - Math.pow(1 - t, 4);
      node.textContent = fmt(target * e);
      if (t < 1) requestAnimationFrame(tick);
    })(start);
  }
  function initHero() {
    var done = function () { doc.classList.remove('is-loading'); };
    if (!enhanced) { done(); return; }
    var gsap = window.gsap;
    var hero = qs('.hero');
    var lines = qsa('.hero-title .line-inner', hero);
    var fades = qsa('[data-hero-fade]', hero);
    var photo = qs('.hero-photo', hero);
    var photoImg = qs('img', photo);
    var clH = qsa('.cl--t, .cl--b', hero), clV = qsa('.cl--l, .cl--r', hero);
    var dims = qsa('.dim', hero);
    var doors = qsa('.door, .hero-north', hero);
    var card = qs('.hero-card', hero);
    var kpis = qsa('.kpi', hero);

    // Erst die CSS-Startzustände entfernen, dann identische Inline-Zustände setzen (gleicher Task → kein Flackern),
    // sonst liest GSAP das CSS-translateY als zusätzlichen y-Versatz.
    done();
    gsap.set(lines, { y: 0, yPercent: 105 });
    gsap.set(fades, { opacity: 0, y: 14 });
    gsap.set(photo, { clipPath: 'inset(100% 0% 0% 0%)' });
    gsap.set(photoImg, { scale: 1.14 });
    gsap.set(clH, { scaleX: 0, scaleY: 1, opacity: 0 });
    gsap.set(clV, { scaleY: 0, scaleX: 1, opacity: 0 });
    gsap.set(dims, { opacity: 0, scale: 0.96 });
    gsap.set(doors, { opacity: 0 });
    if (card) { card.style.transition = 'none'; gsap.set(card, { opacity: 0, y: 24 }); }
    gsap.set(kpis, { opacity: 0, y: 16 });

    var tl = gsap.timeline({ defaults: { ease: 'expo.out' }, delay: 0.1 });
    tl.to(lines, { yPercent: 0, duration: 1.25, stagger: 0.12 }, 0)
      .to(clH, { scaleX: 1, opacity: 0.55, duration: 1.1, ease: 'power3.inOut', stagger: 0.08 }, 0.15)
      .to(clV, { scaleY: 1, opacity: 0.55, duration: 1.1, ease: 'power3.inOut', stagger: 0.08 }, 0.25)
      .to(photo, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'power4.inOut' }, 0.35)
      .to(photoImg, { scale: 1, duration: 1.8, ease: 'power3.out' }, 0.35)
      .to(dims, { opacity: 1, scale: 1, duration: 0.8, ease: 'power2.out', stagger: 0.08 }, 1.0)
      .to(doors, { opacity: 1, duration: 0.8, ease: 'power1.out', stagger: 0.08 }, 1.1)
      .to(fades, { opacity: 1, y: 0, duration: 0.9, stagger: 0.07 }, 0.55);
    if (card) tl.to(card, { opacity: 1, y: 0, duration: 1, onComplete: function () { gsap.set(card, { clearProps: 'transform,opacity' }); card.style.transition = ''; } }, 1.15);
    tl.to(kpis, { opacity: 1, y: 0, duration: 0.9, stagger: 0.07, onStart: function () {
      qsa('[data-count]', hero).forEach(function (n) { countUp(n, 1600); });
    } }, 1.05);
  }
  function initParallax() {
    if (!enhanced) return;
    var gsap = window.gsap;
    qsa('[data-parallax-img]').forEach(function (img) {
      var box = img.parentElement;
      gsap.fromTo(img, { yPercent: -6 }, {
        yPercent: 6, ease: 'none',
        scrollTrigger: { trigger: box, start: 'top bottom', end: 'bottom top', scrub: 0.6 }
      });
    });
    // Konstruktionslinien im Hero driften minimal mit
    var frame = qs('.hero-frame');
    if (frame) {
      gsap.to(qsa('.door, .hero-north', frame), { y: -18, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6 } });
    }
  }

  /* ------------------------------------------------------------------
     Leistungen: Bild folgt dem Mauszeiger (Feder/Lerp)
     ------------------------------------------------------------------ */
  function initServicePreview() {
    var list = qs('[data-svc-list]');
    var prev = qs('[data-svc-preview]');
    var img = qs('[data-svc-preview-img]');
    if (!list || !prev || !img || !finePointer || reduced) return;
    var x = 0, y = 0, tx = 0, ty = 0, rot = 0, lastX = 0, raf = 0, active = false, hideT = 0;
    var W = 280, H = 187;
    var cache = {};
    qsa('.svc', list).forEach(function (li) {
      var key = li.getAttribute('data-svc-img');
      if (key && !cache[key]) { var im = new Image(); im.src = BASE + 'assets/img/' + key + '-480.webp'; cache[key] = im; }
    });
    function loop() {
      x += (tx - x) * 0.16;
      y += (ty - y) * 0.16;
      var vx = tx - lastX; lastX = tx;
      rot += (clamp(vx * 0.35, -7, 7) - rot) * 0.1;
      prev.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) rotate(' + rot.toFixed(2) + 'deg)';
      if (active || Math.abs(tx - x) > 0.5 || Math.abs(ty - y) > 0.5) raf = requestAnimationFrame(loop);
      else raf = 0;
    }
    function target(e) {
      tx = clamp(e.clientX + 36, 12, window.innerWidth - W - 12);
      ty = clamp(e.clientY - H / 2, headerH() + 8, window.innerHeight - H - 12);
    }
    list.addEventListener('pointerenter', function (e) {
      if (!mqDesktop.matches || e.pointerType !== 'mouse') return;
      clearTimeout(hideT);
      target(e);
      if (!prev.classList.contains('is-on')) { x = tx; y = ty; lastX = tx; }
      active = true;
      prev.classList.add('is-on');
      requestAnimationFrame(function () { prev.classList.add('is-visible'); });
      if (!raf) raf = requestAnimationFrame(loop);
    });
    list.addEventListener('pointermove', function (e) {
      if (!active) return;
      target(e);
      var li = e.target.closest && e.target.closest('.svc');
      var key = li && li.getAttribute('data-svc-img');
      if (key) {
        var src = BASE + 'assets/img/' + key + '-480.webp';
        if (img.getAttribute('src') !== src) img.setAttribute('src', src);
      }
      if (!raf) raf = requestAnimationFrame(loop);
    });
    list.addEventListener('pointerleave', function () {
      active = false;
      prev.classList.remove('is-visible');
      hideT = setTimeout(function () { if (!active) prev.classList.remove('is-on'); }, 300);
    });
  }

  /* ------------------------------------------------------------------
     Objekte: Filter, Ansicht Liste/Karte, Karte mit Pins
     ------------------------------------------------------------------ */
  var PRICE_RANGE = {
    kauf: { min: 300000, max: 2500000, step: 25000 },
    miete: { min: 800, max: 3000, step: 50 }
  };
  var objState = { mode: 'kauf', rooms: 0, max: 2500000 };
  var visibleIds = [];
  var mapApi = null;

  function setRangeFill(r) {
    var p = (r.value - r.min) / (r.max - r.min) * 100;
    r.style.setProperty('--fill', p + '%');
  }

  function initObjects() {
    var form = qs('[data-filters]');
    var grid = qs('[data-obj-grid]');
    if (!form || !grid) return;
    var items = qsa('.obj', grid);
    var range = qs('[data-price-range]', form);
    var out = qs('[data-price-out]', form);
    var count = qs('[data-result-count]');
    var empty = qs('[data-obj-empty]');
    var timers = [];

    function priceText(v) {
      return (objState.mode === 'miete' ? 'bis ' : '') + eur(v) + (objState.mode === 'miete' ? ' kalt' : '');
    }
    function setPriceOut() {
      out.textContent = objState.mode === 'miete' ? eur(range.value) + ' kalt' : eur(range.value);
      range.setAttribute('aria-valuetext', priceText(+range.value));
      setRangeFill(range);
    }
    function apply(animate) {
      timers.forEach(clearTimeout); timers = [];
      var vis = [];
      items.forEach(function (li) {
        var ok = li.getAttribute('data-mode') === objState.mode &&
          +li.getAttribute('data-rooms') >= objState.rooms &&
          +li.getAttribute('data-price') <= objState.max;
        if (ok) vis.push(li.getAttribute('data-id'));
        var isHidden = li.hidden;
        if (ok && isHidden) {
          li.hidden = false;
          li.classList.remove('is-out');
          if (animate && !reduced) {
            li.classList.add('is-in');
            void li.offsetWidth;
            timers.push(setTimeout(function () { li.classList.remove('is-in'); }, 20));
          }
        } else if (!ok && !isHidden) {
          if (animate && !reduced) {
            li.classList.add('is-out');
            timers.push(setTimeout(function () { li.hidden = true; li.classList.remove('is-out'); }, 220));
          } else li.hidden = true;
        } else if (ok) {
          li.classList.remove('is-out', 'is-in');
        }
      });
      visibleIds = vis;
      var n = vis.length;
      var label = objState.mode === 'miete' ? 'zur Miete' : 'zum Kauf';
      count.textContent = '';
      var s = el('strong', null, String(n));
      count.appendChild(s);
      count.appendChild(document.createTextNode(n === 1 ? ' Objekt ' + label : ' Objekte ' + label));
      if (empty) empty.hidden = n > 0;
      if (mapApi) mapApi.update();
    }

    form.addEventListener('change', function (e) {
      var t = e.target;
      if (t.name === 'mode') {
        objState.mode = t.value;
        var cfg = PRICE_RANGE[objState.mode];
        range.min = cfg.min; range.max = cfg.max; range.step = cfg.step; range.value = cfg.max;
        objState.max = cfg.max;
        setPriceOut();
        apply(true);
      } else if (t.name === 'rooms') {
        objState.rooms = +t.value;
        apply(true);
      }
    });
    var rangeT = 0;
    range.addEventListener('input', function () {
      objState.max = +range.value;
      setPriceOut();
      clearTimeout(rangeT);
      rangeT = setTimeout(function () { apply(true); }, 90);
    });
    var reset = qs('[data-filter-reset]');
    if (reset) reset.addEventListener('click', function () {
      qsa('input[name="rooms"]', form).forEach(function (r) { r.checked = r.value === '0'; });
      objState.rooms = 0;
      var cfg = PRICE_RANGE[objState.mode];
      range.value = cfg.max; objState.max = cfg.max;
      setPriceOut();
      apply(true);
      focusNoScroll(qs('input[name="rooms"]:checked', form));
    });
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    setPriceOut();
    apply(false);
    initViewTabs();
  }

  function initTabs(tablist, onChange) {
    var tabs = qsa('[role="tab"]', tablist);
    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
      });
      if (focus) tab.focus();
      if (onChange) onChange(tab);
    }
    tabs.forEach(function (t) {
      t.addEventListener('click', function () { if (!t.disabled) select(t, false); });
      t.addEventListener('keydown', function (e) {
        var enabled = tabs.filter(function (x) { return !x.disabled && !x.hidden; });
        var i = enabled.indexOf(t), n = -1;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % enabled.length;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i - 1 + enabled.length) % enabled.length;
        else if (e.key === 'Home') n = 0;
        else if (e.key === 'End') n = enabled.length - 1;
        if (n > -1) { e.preventDefault(); select(enabled[n], true); }
      });
    });
    return { select: select, tabs: tabs };
  }

  function initViewTabs() {
    var tl = qs('[data-view-tabs]');
    if (!tl) return;
    initTabs(tl, function (tab) {
      if (tab.id === 'tab-map' && mapApi) { mapApi.update(); mapApi.close(); }
      if (hasGSAP) window.ScrollTrigger.refresh();
    });
    mapApi = initMap();
  }

  function initMap() {
    var map = qs('[data-map]');
    if (!map) return null;
    var frame = map.parentNode;
    var pins = qsa('.map-pin', map);
    var list = qs('[data-map-list]');
    var pop = qs('[data-map-pop]', map);
    var popImg = qs('[data-map-pop-img]', pop);
    var districts = qsa('[data-district]', map);
    var openId = null;

    function priceShort(o) { return o.mode === 'miete' ? eur(o.price) + ' kalt' : eur(o.price); }
    function hot(id, on) {
      pins.forEach(function (p) { if (p.getAttribute('data-pin') === id) p.classList.toggle('is-hot', on); });
      qsa('button', list).forEach(function (b) { if (b.getAttribute('data-ml') === id) b.classList.toggle('is-hot', on); });
      var o = OBJECTS[id];
      if (o) districts.forEach(function (d) { if (d.getAttribute('data-district') === o.district) d.classList.toggle('is-hot', on); });
    }
    function update() {
      var n = 0;
      var used = {};
      pins.forEach(function (p) {
        var id = p.getAttribute('data-pin');
        var i = visibleIds.indexOf(id);
        p.hidden = i === -1;
        if (i > -1) { p.setAttribute('data-num', String(i + 1)); used[OBJECTS[id].district] = true; n++; }
        p.setAttribute('aria-expanded', id === openId ? 'true' : 'false');
      });
      districts.forEach(function (d) { d.classList.toggle('has-obj', !!used[d.getAttribute('data-district')]); });
      // Liste neben der Karte
      list.textContent = '';
      visibleIds.forEach(function (id, i) {
        var o = OBJECTS[id];
        var li = el('li');
        var b = el('button');
        b.type = 'button';
        b.setAttribute('data-ml', id);
        b.appendChild(el('span', 'ml-num', String(i + 1)));
        var mid = el('span');
        mid.appendChild(el('span', 'ml-title', o.title));
        mid.appendChild(el('span', 'ml-loc', o.loc + ' · ' + o.rooms + ' Zi. · ' + o.area + ' m²'));
        b.appendChild(mid);
        b.appendChild(el('span', 'ml-price', priceShort(o)));
        b.addEventListener('click', function (e) {
          e.stopPropagation();
          open(id, b);
          var r = map.getBoundingClientRect();
          if (r.top < headerH() || r.bottom > window.innerHeight) scrollToEl(map);
        });
        b.addEventListener('pointerenter', function () { hot(id, true); });
        b.addEventListener('pointerleave', function () { hot(id, false); });
        b.addEventListener('focus', function () { hot(id, true); });
        b.addEventListener('blur', function () { hot(id, false); });
        li.appendChild(b);
        list.appendChild(li);
      });
      if (openId && visibleIds.indexOf(openId) === -1) close();
    }
    var lastTrigger = null;
    function open(id, trigger) {
      var o = OBJECTS[id];
      var pin = pins.filter(function (p) { return p.getAttribute('data-pin') === id; })[0];
      if (!o || !pin) return;
      openId = id;
      lastTrigger = trigger || pin;
      pins.forEach(function (p) { p.setAttribute('aria-expanded', p === pin ? 'true' : 'false'); });
      qs('[data-map-pop-loc]', pop).textContent = o.loc + ' · ' + o.type;
      qs('[data-map-pop-title]', pop).textContent = o.title;
      qs('[data-map-pop-meta]', pop).textContent = o.rooms + ' Zi. · ' + o.area + ' m² · ' + priceShort(o);
      if (o.photos.length) {
        popImg.hidden = false;
        popImg.src = BASE + 'assets/img/' + o.photos[0] + '-480.webp';
        popImg.alt = '';
      } else popImg.hidden = true;
      pop.setAttribute('data-for', id);
      pop.hidden = false;
      var W = map.clientWidth, H = map.clientHeight;
      var px = parseFloat(pin.style.left) / 100 * W, py = parseFloat(pin.style.top) / 100 * H;
      var compact = W < 520;
      pop.classList.toggle('map-pop--compact', compact);
      // Handy: Vorschau als Karte unter der Karte statt darüber (verdeckt sonst andere Pins)
      if (compact && pop.parentNode !== frame) frame.insertBefore(pop, map.nextSibling);
      if (!compact && pop.parentNode !== map) map.appendChild(pop);
      pop.style.removeProperty('--pop-x'); pop.style.removeProperty('--pop-y');
      var pw = pop.offsetWidth, ph = pop.offsetHeight;
      var left, top, origin;
      if (compact) {
        pop.style.left = ''; pop.style.top = '';
        pop.style.setProperty('--pop-x', '0px'); pop.style.setProperty('--pop-y', '0px');
        pop.style.setProperty('--pop-origin', clamp(px / W * 100, 10, 90).toFixed(0) + '% 0%');
        requestAnimationFrame(function () { pop.classList.add('is-open'); });
        return;
      } else {
        left = clamp(px - pw / 2, 8, W - pw - 8);
        var above = py - ph - 24 >= 0;
        top = above ? py - ph - 24 : Math.min(py + 24, H - ph - 8);
        origin = clamp(px - left, 0, pw) + 'px ' + (above ? '100%' : '0%');
      }
      pop.style.left = left + 'px';
      pop.style.top = top + 'px';
      pop.style.setProperty('--pop-x', '0px');
      pop.style.setProperty('--pop-y', '0px');
      pop.style.setProperty('--pop-origin', origin);
      requestAnimationFrame(function () { pop.classList.add('is-open'); });
    }
    function close(restore) {
      if (!openId) return;
      var wasId = openId;
      openId = null;
      pop.classList.remove('is-open');
      pins.forEach(function (p) { p.setAttribute('aria-expanded', 'false'); });
      setTimeout(function () { if (!openId) pop.hidden = true; }, reduced ? 0 : 200);
      if (restore && lastTrigger) focusNoScroll(lastTrigger);
      return wasId;
    }
    pins.forEach(function (p) {
      var id = p.getAttribute('data-pin');
      p.addEventListener('click', function (e) {
        e.stopPropagation();
        if (openId === id) close(false); else open(id, p);
      });
      p.addEventListener('pointerenter', function () { hot(id, true); });
      p.addEventListener('pointerleave', function () { hot(id, false); });
    });
    qs('[data-map-pop-close]', pop).addEventListener('click', function () { close(true); });
    qs('[data-map-pop-open]', pop).addEventListener('click', function () {
      var id = pop.getAttribute('data-for');
      if (id) openExpose(id, this);
    });
    pop.addEventListener('click', function (e) { e.stopPropagation(); });
    document.addEventListener('click', function (e) { if (openId && !pop.contains(e.target)) close(false); });
    frame.addEventListener('keydown', function (e) { if (e.key === 'Escape' && openId) { e.preventDefault(); close(true); } });
    window.addEventListener('resize', function () { if (openId) { var id = openId; open(id, lastTrigger); } });
    update();
    return { update: update, close: function () { close(false); } };
  }

  /* ------------------------------------------------------------------
     Grundriss-Generator (SVG) für das Exposé
     ------------------------------------------------------------------ */
  var EPS = 0.001;
  function m2(r) { return dec(Math.round(r.w * r.h * 10) / 10, 1) + ' m²'; }
  function buildPlan(id, floor, narrow) {
    var VBW = narrow ? 420 : 560;
    var bal = floor.balcony;
    var extraTop = bal && bal.side === 'top' ? bal.depth : 0;
    var extraRight = bal && bal.side === 'right' ? bal.depth : 0;
    var s = Math.min((VBW - 110) / (floor.w + extraRight), (narrow ? 400 : 300) / (floor.h + extraTop), 46);
    var W = floor.w * s, H = floor.h * s;
    var x0 = Math.round((VBW - W - extraRight * s) / 2 + 10);
    var y0 = Math.round(46 + extraTop * s);
    var VBH = Math.round(y0 + H + 70);
    var X = function (v) { return x0 + v * s; }, Y = function (v) { return y0 + v * s; };
    var svg = svgEl('svg', { viewBox: '0 0 ' + VBW + ' ' + VBH, role: 'img', 'aria-label': 'Grundriss-Skizze ' + floor.label + ', ' + OBJECTS[id].title });
    var fsName = narrow ? 17 : 12.5, fsArea = narrow ? 15 : 12;
    var gRooms = svgEl('g'), gGaps = svgEl('g'), gDoors = svgEl('g'), gText = svgEl('g');

    // Balkon / Terrasse
    if (bal) {
      var bx, by, bw, bh;
      if (bal.side === 'top') { bx = X(bal.from); by = Y(-bal.depth); bw = bal.len * s; bh = bal.depth * s; }
      else { bx = X(floor.w); by = Y(bal.from); bw = bal.depth * s; bh = bal.len * s; }
      svg.appendChild(svgEl('rect', { x: bx, y: by, width: bw, height: bh, 'class': 'pl-balk' }));
      var bt = svgEl('text', { x: bx + bw / 2, y: by + bh / 2 + 4, 'class': 'pl-area' }, bal.name);
      bt.style.fontSize = Math.min(fsArea, (bal.side === 'top' ? bw : bw * 2.2) / (bal.name.length * 0.62)) + 'px';
      if (bal.side === 'right') bt.setAttribute('transform', 'rotate(90 ' + (bx + bw / 2) + ' ' + (by + bh / 2) + ')');
      svg.appendChild(bt);
    }
    var hall = floor.rooms.filter(function (r) { return r.t === 'hall'; })[0];
    floor.rooms.forEach(function (r) {
      var cls = 'pl-room' + (r.t === 'wet' ? ' is-wet' : '') + (r.t === 'hall' ? ' is-hall' : '');
      gRooms.appendChild(svgEl('rect', { x: X(r.x), y: Y(r.y), width: r.w * s, height: r.h * s, 'class': cls }));
      // Beschriftung
      var cx = X(r.x + r.w / 2), cy = Y(r.y + r.h / 2);
      var maxW = r.w * s - 10;
      var vertical = r.h * s > r.w * s * 1.6 && r.w * s < 70;
      var avail = vertical ? r.h * s - 14 : maxW;
      var f1 = Math.min(fsName, avail / (r.n.length * 0.7));
      var t1 = svgEl('text', { x: cx, y: cy - (r.t === 'hall' || r.h * s < 70 ? -4 : 2), 'class': 'pl-name' }, r.n);
      t1.style.fontSize = f1.toFixed(1) + 'px';
      if (vertical) t1.setAttribute('transform', 'rotate(-90 ' + cx + ' ' + cy + ')');
      gText.appendChild(t1);
      if (r.t !== 'hall' && r.h * s >= 70 && !vertical) {
        var area = m2(r);
        var f2 = Math.min(fsArea, maxW / (area.length * 0.6));
        var t2 = svgEl('text', { x: cx, y: cy + f1 + 4, 'class': 'pl-area' }, area);
        t2.style.fontSize = f2.toFixed(1) + 'px';
        gText.appendChild(t2);
      }
      // Tür zum Flur
      if (hall && r !== hall) {
        var d = Math.min(0.85, 0.42 * Math.min(r.w, r.h)), dd = d * s;
        var lo, hi, a, b, path;
        if (Math.abs(r.y + r.h - hall.y) < EPS || Math.abs(r.y - (hall.y + hall.h)) < EPS) {
          lo = Math.max(r.x, hall.x); hi = Math.min(r.x + r.w, hall.x + hall.w);
          if (hi - lo >= d + 0.3) {
            var above = Math.abs(r.y + r.h - hall.y) < EPS;
            var wy = Y(above ? hall.y : r.y);
            a = X(lo + 0.25); b = a + dd;
            gGaps.appendChild(svgEl('rect', { x: a, y: wy - 3, width: dd, height: 6, 'class': 'pl-gap' }));
            path = above
              ? 'M' + a + ' ' + wy + 'V' + (wy - dd) + 'A' + dd + ' ' + dd + ' 0 0 1 ' + b + ' ' + wy
              : 'M' + a + ' ' + wy + 'V' + (wy + dd) + 'A' + dd + ' ' + dd + ' 0 0 0 ' + b + ' ' + wy;
            gDoors.appendChild(svgEl('path', { d: path, 'class': 'pl-door' }));
          }
        } else if (Math.abs(r.x + r.w - hall.x) < EPS || Math.abs(r.x - (hall.x + hall.w)) < EPS) {
          lo = Math.max(r.y, hall.y); hi = Math.min(r.y + r.h, hall.y + hall.h);
          if (hi - lo >= d + 0.3) {
            var left = Math.abs(r.x + r.w - hall.x) < EPS;
            var wx = X(left ? hall.x : r.x);
            a = Y(lo + 0.25); b = a + dd;
            gGaps.appendChild(svgEl('rect', { x: wx - 3, y: a, width: 6, height: dd, 'class': 'pl-gap' }));
            path = left
              ? 'M' + wx + ' ' + a + 'H' + (wx - dd) + 'A' + dd + ' ' + dd + ' 0 0 0 ' + wx + ' ' + b
              : 'M' + wx + ' ' + a + 'H' + (wx + dd) + 'A' + dd + ' ' + dd + ' 0 0 1 ' + wx + ' ' + b;
            gDoors.appendChild(svgEl('path', { d: path, 'class': 'pl-door' }));
          }
        }
      }
    });
    svg.appendChild(gRooms);
    // Dachschrägen
    if (floor.slope) {
      var inset = 0.6 * s;
      svg.appendChild(svgEl('path', { d: 'M' + X(0) + ' ' + (Y(0) + inset) + 'H' + X(floor.w) + 'M' + X(0) + ' ' + (Y(floor.h) - inset) + 'H' + X(floor.w), 'class': 'pl-balk' }));
    }
    svg.appendChild(svgEl('rect', { x: X(0), y: Y(0), width: W, height: H, 'class': 'pl-outer' }));
    // Fenster in Außenwänden
    var gWin = svgEl('g');
    function win(x1, y1, x2, y2) {
      var horiz = Math.abs(y1 - y2) < EPS;
      if (horiz) {
        gWin.appendChild(svgEl('rect', { x: x1, y: y1 - 5, width: x2 - x1, height: 10, 'class': 'pl-wingap' }));
        gWin.appendChild(svgEl('path', { d: 'M' + x1 + ' ' + (y1 - 4) + 'H' + x2 + 'M' + x1 + ' ' + y1 + 'H' + x2 + 'M' + x1 + ' ' + (y1 + 4) + 'H' + x2 + 'M' + x1 + ' ' + (y1 - 5) + 'v10M' + x2 + ' ' + (y1 - 5) + 'v10', 'class': 'pl-win' }));
      } else {
        gWin.appendChild(svgEl('rect', { x: x1 - 5, y: y1, width: 10, height: y2 - y1, 'class': 'pl-wingap' }));
        gWin.appendChild(svgEl('path', { d: 'M' + (x1 - 4) + ' ' + y1 + 'V' + y2 + 'M' + x1 + ' ' + y1 + 'V' + y2 + 'M' + (x1 + 4) + ' ' + y1 + 'V' + y2 + 'M' + (x1 - 5) + ' ' + y1 + 'h10M' + (x1 - 5) + ' ' + y2 + 'h10', 'class': 'pl-win' }));
      }
    }
    floor.rooms.forEach(function (r) {
      if (r.t === 'hall' || r.t === 'store') return;
      var edges = [];
      if (r.y < EPS) edges.push(['h', r.x, r.x + r.w, 0]);
      if (Math.abs(r.y + r.h - floor.h) < EPS) edges.push(['h', r.x, r.x + r.w, floor.h]);
      if (r.x < EPS) edges.push(['v', r.y, r.y + r.h, 0]);
      if (Math.abs(r.x + r.w - floor.w) < EPS) edges.push(['v', r.y, r.y + r.h, floor.w]);
      edges.forEach(function (e) {
        var len = e[2] - e[1];
        var ww = Math.min(r.t === 'wet' ? 0.9 : 1.5, len * 0.45);
        var n = len > 4.6 && r.t !== 'wet' ? 2 : 1;
        for (var k = 0; k < n; k++) {
          var c = e[1] + len * (k + 0.5) / n;
          if (e[0] === 'h') win(X(c - ww / 2), Y(e[3]), X(c + ww / 2), Y(e[3]));
          else win(X(e[3]), Y(c - ww / 2), X(e[3]), Y(c + ww / 2));
        }
      });
    });
    svg.appendChild(gWin);
    svg.appendChild(gGaps);
    svg.appendChild(gDoors);
    svg.appendChild(gText);
    // Maßketten unten und links
    var dy = Y(floor.h) + 26, dx = X(0) - 26;
    svg.appendChild(svgEl('path', { d: 'M' + X(0) + ' ' + dy + 'H' + X(floor.w) + 'M' + X(0) + ' ' + (dy - 7) + 'v14M' + X(floor.w) + ' ' + (dy - 7) + 'v14M' + (X(0) - 5) + ' ' + (dy + 5) + 'l10 -10M' + (X(floor.w) - 5) + ' ' + (dy + 5) + 'l10 -10', 'class': 'pl-dim' }));
    var tw = svgEl('text', { x: X(floor.w / 2), y: dy + 20, 'class': 'pl-dimt' }, dec(floor.w, 2) + ' m');
    tw.style.fontSize = fsArea + 'px';
    svg.appendChild(tw);
    svg.appendChild(svgEl('path', { d: 'M' + dx + ' ' + Y(0) + 'V' + Y(floor.h) + 'M' + (dx - 7) + ' ' + Y(0) + 'h14M' + (dx - 7) + ' ' + Y(floor.h) + 'h14M' + (dx - 5) + ' ' + (Y(0) + 5) + 'l10 -10M' + (dx - 5) + ' ' + (Y(floor.h) + 5) + 'l10 -10', 'class': 'pl-dim' }));
    var th = svgEl('text', { x: dx - 9, y: Y(floor.h / 2), 'class': 'pl-dimt', transform: 'rotate(-90 ' + (dx - 9) + ' ' + Y(floor.h / 2) + ')' }, dec(floor.h, 2) + ' m');
    th.style.fontSize = fsArea + 'px';
    svg.appendChild(th);
    // Titel & Nordpfeil
    var meta = svgEl('text', { x: 18, y: 24, 'class': 'pl-meta' }, floor.label + ' · ' + id);
    svg.appendChild(meta);
    var ng = svgEl('g', { transform: 'translate(' + (VBW - 28) + ' 26)' });
    ng.appendChild(svgEl('circle', { r: 13, 'class': 'pl-dim' }));
    ng.appendChild(svgEl('path', { d: 'M0 -9 4 5 0 2 -4 5Z', fill: '#B48A4E' }));
    svg.appendChild(ng);
    return svg;
  }

  /* ------------------------------------------------------------------
     Exposé-Dialog: Galerie, Grundriss, Eckdaten
     ------------------------------------------------------------------ */
  var dialog = qs('[data-expose-dialog]');
  var exState = { id: null, trigger: null, idx: 0, imgs: [], thumbs: [], tabs: null };
  var ENERGY = [['A+', '#2F7A4C', '#fff'], ['A', '#4C9550', '#fff'], ['B', '#8DB451', '#13213B'], ['C', '#C6CC52', '#13213B'], ['D', '#EBD457', '#13213B'], ['E', '#EDB24A', '#13213B'], ['F', '#E58B3E', '#13213B'], ['G', '#D45F35', '#fff'], ['H', '#BC3A2E', '#fff']];

  function showPhoto(i, focusThumb) {
    var n = exState.imgs.length;
    if (!n) return;
    exState.idx = (i + n) % n;
    exState.imgs.forEach(function (im, k) { im.classList.toggle('is-active', k === exState.idx); im.setAttribute('aria-hidden', k === exState.idx ? 'false' : 'true'); });
    exState.thumbs.forEach(function (t, k) { t.setAttribute('aria-current', k === exState.idx ? 'true' : 'false'); });
    qs('[data-gallery-count]', dialog).textContent = 'Foto ' + (exState.idx + 1) + ' von ' + n;
    if (focusThumb) exState.thumbs[exState.idx].focus();
  }

  function fillExpose(id) {
    var o = OBJECTS[id];
    var narrow = window.innerWidth < 600;
    qs('[data-ex-ref]', dialog).textContent = id + ' · ' + o.loc + ' · ' + o.type;
    qs('[data-ex-title]', dialog).textContent = o.title;
    var price = qs('[data-ex-price]', dialog);
    price.textContent = o.mode === 'miete' ? eur(o.price) + ' kalt' : eur(o.price);
    price.appendChild(el('span', null, o.mode === 'miete'
      ? 'Kaltmiete zzgl. ca. ' + eur(o.nk) + ' Nebenkosten · provisionsfrei für Mieter'
      : 'Kaufpreis · Käuferprovision 3,57 % inkl. MwSt.'));
    if (o.reserved) price.appendChild(el('span', null, 'Derzeit reserviert – gern setzen wir Sie auf die Warteliste.'));
    var facts = qs('[data-ex-facts]', dialog);
    facts.textContent = '';
    [['Wohnfläche', 'ca. ' + o.area + ' m²'], ['Zimmer', String(o.rooms)], ['Baujahr', o.year], ['Lage im Haus', o.floor],
      ['Verfügbar', o.avail], ['Heizung', o.heating], [o.extra[0], o.extra[1]], ['Objekt-Nr.', id]].forEach(function (f) {
      var d = el('div');
      d.appendChild(el('dt', null, f[0]));
      d.appendChild(el('dd', null, f[1]));
      facts.appendChild(d);
    });
    qs('[data-ex-text]', dialog).textContent = o.text;
    var feats = qs('[data-ex-features]', dialog);
    feats.textContent = '';
    o.features.forEach(function (f) { feats.appendChild(el('li', null, f)); });
    // Energieskala
    var en = qs('[data-ex-energy]', dialog);
    en.textContent = '';
    var head = el('p', 'en-head');
    head.appendChild(el('span', null, 'Energieausweis (' + o.energy.kind + '): ' + o.energy.val + ' kWh/(m²·a)'));
    head.appendChild(el('strong', null, 'Klasse ' + o.energy.cls));
    en.appendChild(head);
    var scale = el('div', 'en-scale');
    scale.setAttribute('aria-hidden', 'true');
    var ci = 0;
    ENERGY.forEach(function (c, k) {
      var sp = el('span', null, c[0]);
      sp.style.background = c[1]; sp.style.color = c[2];
      if (c[0] === o.energy.cls) ci = k;
      scale.appendChild(sp);
    });
    var mk = el('span', 'en-marker');
    mk.style.left = ((ci + 0.5) / ENERGY.length * 100) + '%';
    scale.appendChild(mk);
    en.appendChild(scale);

    // Galerie
    var stage = qs('[data-gallery-stage]', dialog);
    var thumbs = qs('[data-gallery-thumbs]', dialog);
    stage.textContent = ''; thumbs.textContent = '';
    exState.imgs = []; exState.thumbs = []; exState.idx = 0;
    o.photos.forEach(function (name, k) {
      var meta = IMG[name];
      var im = el('img');
      im.src = BASE + 'assets/img/' + name + '-960.webp';
      im.srcset = BASE + 'assets/img/' + name + '-480.webp 480w, ' + BASE + 'assets/img/' + name + '-960.webp 960w';
      im.sizes = '(min-width: 900px) 640px, 100vw';
      im.width = 960; im.height = meta[0];
      im.alt = meta[1];
      im.decoding = 'async';
      if (meta[0] > 960) im.classList.add('is-portrait');
      stage.appendChild(im);
      exState.imgs.push(im);
      var tb = el('button');
      tb.type = 'button';
      tb.setAttribute('aria-label', 'Foto ' + (k + 1) + ' von ' + o.photos.length + ' zeigen');
      var ti = el('img');
      ti.src = BASE + 'assets/img/' + name + '-480.webp';
      ti.alt = ''; ti.width = 480; ti.height = Math.round(meta[0] / 2); ti.loading = 'lazy';
      tb.appendChild(ti);
      tb.addEventListener('click', function () { showPhoto(k); });
      thumbs.appendChild(tb);
      exState.thumbs.push(tb);
    });
    var gal = qs('[data-gallery]', dialog);
    var single = o.photos.length < 2;
    qsa('.gallery-btn', gal).forEach(function (b) { b.hidden = single; });
    thumbs.hidden = single;
    showPhoto(0);

    // Grundriss(e)
    var wrap = qs('[data-plan-wrap]', dialog);
    wrap.textContent = '';
    if (o.plan.length > 1) {
      var seg = el('div', 'plan-floors');
      seg.setAttribute('role', 'group');
      seg.setAttribute('aria-label', 'Geschoss wählen');
      wrap.appendChild(seg);
      var svgs = [];
      o.plan.forEach(function (f, k) {
        var b = el('button', null, f.short || f.label);
        b.type = 'button';
        b.setAttribute('aria-pressed', k === 0 ? 'true' : 'false');
        b.addEventListener('click', function () {
          qsa('button', seg).forEach(function (x, j) { x.setAttribute('aria-pressed', j === k ? 'true' : 'false'); });
          svgs.forEach(function (sv, j) { sv.style.display = j === k ? '' : 'none'; });
        });
        seg.appendChild(b);
        var sv = buildPlan(id, f, narrow);
        if (k > 0) sv.style.display = 'none';
        svgs.push(sv);
        wrap.appendChild(sv);
      });
    } else {
      wrap.appendChild(buildPlan(id, o.plan[0], narrow));
    }

    // Tabs: ohne Fotos direkt Grundriss
    var photoTab = qs('#ex-tab-photos', dialog), planTab = qs('#ex-tab-plan', dialog);
    photoTab.disabled = !o.photos.length;
    photoTab.hidden = !o.photos.length;
    exState.tabs.select(o.photos.length ? photoTab : planTab, false);

    var req = qs('[data-ex-request]', dialog);
    req.textContent = '';
    req.appendChild(document.createTextNode(o.mode === 'miete' ? 'Besichtigung anfragen' : (o.reserved ? 'Auf die Warteliste' : 'Besichtigung anfragen')));
    var ic = svgEl('svg', { 'class': 'i', 'aria-hidden': 'true' });
    ic.appendChild(svgEl('use', { href: '#i-arrow' }));
    req.appendChild(ic);
  }

  var exCloseT = 0;
  function openExpose(id, trigger) {
    if (!dialog || !OBJECTS[id]) return;
    clearTimeout(exCloseT);
    exState.id = id;
    exState.trigger = trigger || document.activeElement;
    fillExpose(id);
    dialog.classList.remove('is-closing');
    if (typeof dialog.showModal === 'function') { if (!dialog.open) dialog.showModal(); }
    else dialog.setAttribute('open', '');
    doc.classList.add('dialog-open');
    if (lenis) lenis.stop();
    var info = qs('.expose-info', dialog); if (info) info.scrollTop = 0;
    var inner = qs('.expose-inner', dialog); if (inner) inner.scrollTop = 0;
    requestAnimationFrame(function () { requestAnimationFrame(function () { dialog.classList.add('is-open'); }); });
    focusNoScroll(qs('[data-expose-close]', dialog));
  }
  function closeExpose(restore, after) {
    if (!dialog || !dialog.open) { if (after) after(); return; }
    dialog.classList.remove('is-open');
    dialog.classList.add('is-closing');
    exCloseT = setTimeout(function () {
      if (typeof dialog.close === 'function') dialog.close(); else dialog.removeAttribute('open');
      dialog.classList.remove('is-closing');
      doc.classList.remove('dialog-open');
      if (lenis) lenis.start();
      if (restore && exState.trigger && document.contains(exState.trigger)) focusNoScroll(exState.trigger);
      if (after) after();
    }, reduced ? 0 : 190);
  }
  function initExpose() {
    if (!dialog) return;
    exState.tabs = initTabs(qs('[data-expose-tabs]', dialog));
    qs('[data-expose-close]', dialog).addEventListener('click', function () { closeExpose(true); });
    dialog.addEventListener('cancel', function (e) { e.preventDefault(); closeExpose(true); });
    dialog.addEventListener('click', function (e) { if (e.target === dialog) closeExpose(true); });
    qs('[data-gallery-prev]', dialog).addEventListener('click', function () { showPhoto(exState.idx - 1); });
    qs('[data-gallery-next]', dialog).addEventListener('click', function () { showPhoto(exState.idx + 1); });
    var gal = qs('[data-gallery]', dialog);
    gal.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); showPhoto(exState.idx + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); showPhoto(exState.idx - 1); }
    });
    // Wischgeste
    var stage = qs('[data-gallery-stage]', dialog);
    var sx = 0, sy = 0, st = 0, track = false;
    stage.addEventListener('pointerdown', function (e) { if (e.pointerType === 'mouse') return; track = true; sx = e.clientX; sy = e.clientY; st = Date.now(); });
    stage.addEventListener('pointerup', function (e) {
      if (!track) return; track = false;
      var dx = e.clientX - sx, dy = e.clientY - sy, v = Math.abs(dx) / Math.max(1, Date.now() - st);
      if (Math.abs(dx) > Math.abs(dy) && (Math.abs(dx) > 40 || v > 0.11)) showPhoto(exState.idx + (dx < 0 ? 1 : -1));
    });
    stage.addEventListener('pointercancel', function () { track = false; });
    stage.style.touchAction = 'pan-y';
    // Besichtigung anfragen → Kontaktformular vorbelegen
    qs('[data-ex-request]', dialog).addEventListener('click', function (e) {
      e.preventDefault();
      var o = OBJECTS[exState.id];
      var ref = qs('[data-contact-ref]');
      if (ref && o) ref.value = exState.id + ' – ' + o.title;
      setAnliegen('Kaufen oder Mieten');
      var msg = qs('#c-msg');
      if (msg && o && !msg.value) msg.value = (o.reserved ? 'Bitte setzen Sie mich auf die Warteliste für ' : 'Ich möchte gern einen Besichtigungstermin für ') + exState.id + ' vereinbaren.';
      closeExpose(false, function () {
        var target = qs('#kontakt');
        scrollToEl(target, function () { focusNoScroll(qs('#c-name')); });
        if (!lenis) setTimeout(function () { focusNoScroll(qs('#c-name')); }, reduced ? 50 : 700);
      });
    });
  }

  /* ------------------------------------------------------------------
     Immobilienbewertung (4 Schritte)
     ------------------------------------------------------------------ */
  var LABELS = {
    art: { wohnung: 'Eigentumswohnung', haus: 'Einfamilienhaus', reihenhaus: 'Reihen- oder Doppelhaus', mfh: 'Mehrfamilienhaus' },
    zustand: { renovierung: 'renovierungsbedürftig', gepflegt: 'gepflegt', modernisiert: 'modernisiert', neuwertig: 'neuwertig' },
    extra: { balkon: 'Balkon/Terrasse', aufzug: 'Aufzug', stellplatz: 'Stellplatz/Garage', garten: 'Garten' }
  };
  function radioVal(form, name) { var r = qs('input[name="' + name + '"]:checked', form); return r ? r.value : ''; }
  function setError(form, name, on, focusEl) {
    var err = qs('[data-error-for="' + name + '"]', form);
    if (err) err.hidden = !on;
    qsa('[name="' + name + '"]', form).forEach(function (f) {
      if (on) { f.setAttribute('aria-invalid', 'true'); if (err) { if (!err.id) err.id = 'err-' + form.getAttribute('class').split(' ')[0] + '-' + name; f.setAttribute('aria-describedby', err.id); } }
      else { f.removeAttribute('aria-invalid'); f.removeAttribute('aria-describedby'); }
    });
    if (on && focusEl) focusNoScroll(focusEl);
    return on;
  }
  function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); }

  function computeValuation(d) {
    var V = VALUATION;
    var base = V.BASE_SQM[d.lage] || 7000;
    var sizeF = 1;
    for (var i = 0; i < V.SIZE.length; i++) { if (d.flaeche <= V.SIZE[i][0]) { sizeF = V.SIZE[i][1]; break; } }
    var pct = 1;
    d.extras.forEach(function (x) { if (V.EXTRA_PCT[x]) pct += V.EXTRA_PCT[x]; });
    var sqm = base * (V.TYPE[d.art] || 1) * (V.AGE[d.baujahr] || 1) * (V.STATE[d.zustand] || 1) * sizeF * pct;
    var point = sqm * d.flaeche + (d.extras.indexOf('stellplatz') > -1 ? V.PARKING : 0);
    var r = function (v) { return Math.round(v / V.ROUND) * V.ROUND; };
    return { low: r(point * (1 - V.SPREAD)), high: r(point * (1 + V.SPREAD)), sqmLow: sqm * (1 - V.SPREAD), sqmHigh: sqm * (1 + V.SPREAD), point: point };
  }

  function initValuation() {
    var root = qs('[data-val]');
    if (!root) return;
    var form = qs('[data-val-form]', root);
    var steps = qsa('[data-val-step]', form);
    var dots = qsa('[data-val-dot]', form);
    var bar = qs('[data-val-bar]', form);
    var back = qs('[data-val-back]', form);
    var next = qs('[data-val-next]', form);
    var result = qs('[data-val-result]', root);
    var area = qs('[data-flaeche]', form);
    var areaOut = qs('[data-flaeche-out]', form);
    var cur = 1, areaTouched = false;

    function setNextLabel() {
      next.textContent = '';
      next.appendChild(document.createTextNode(cur === 4 ? 'Spanne anzeigen' : 'Weiter'));
      var ic = svgEl('svg', { 'class': 'i', 'aria-hidden': 'true' });
      ic.appendChild(svgEl('use', { href: '#i-arrow' }));
      next.appendChild(ic);
    }
    function show(n, dir, focus) {
      cur = n;
      steps.forEach(function (s) {
        var on = +s.getAttribute('data-val-step') === n;
        s.hidden = !on;
        s.classList.remove('is-entering', 'from-back');
        if (on && dir) { void s.offsetWidth; s.classList.add('is-entering'); if (dir < 0) s.classList.add('from-back'); }
      });
      dots.forEach(function (d) {
        var k = +d.getAttribute('data-val-dot');
        if (k === n) d.setAttribute('aria-current', 'step'); else d.removeAttribute('aria-current');
        d.classList.toggle('is-done', k < n);
      });
      bar.style.transform = 'scaleX(' + (n / 4) + ')';
      back.hidden = n === 1;
      setNextLabel();
      if (focus) focusNoScroll(qs('.val-legend', steps[n - 1]));
    }
    function setArea() {
      areaOut.textContent = area.value + ' m²';
      area.setAttribute('aria-valuetext', area.value + ' Quadratmeter');
      setRangeFill(area);
    }
    area.addEventListener('input', function () { areaTouched = true; setArea(); });
    form.addEventListener('change', function (e) {
      var t = e.target;
      if (t.name === 'art') {
        setError(form, 'art', false);
        area.max = VALUATION.MAX_AREA[t.value] || 400;
        if (!areaTouched) area.value = VALUATION.DEFAULT_AREA[t.value] || 95;
        if (+area.value > +area.max) area.value = area.max;
        qs('.range-scale span:last-child', form).textContent = area.max + ' m²';
        setArea();
      }
      if (t.name === 'lage') setError(form, 'lage', false);
      if (t.name === 'consent' && t.checked) setError(form, 'consent', false);
    });
    ['name', 'email'].forEach(function (n) {
      var f = qs('[name="' + n + '"]', form);
      f.addEventListener('input', function () { if (f.getAttribute('aria-invalid')) setError(form, n, n === 'email' ? !validEmail(f.value) : !f.value.trim()); });
    });

    function validate(n) {
      if (n === 1 && !radioVal(form, 'art')) return !setError(form, 'art', true, qs('input[name="art"]', form));
      if (n === 2 && !radioVal(form, 'lage')) return !setError(form, 'lage', true, qs('input[name="lage"]', form));
      if (n === 4) {
        var name = qs('[name="name"]', form), mail = qs('[name="email"]', form), cons = qs('[name="consent"]', form);
        var bad = [];
        if (setError(form, 'name', !name.value.trim())) bad.push(name);
        if (setError(form, 'email', !validEmail(mail.value))) bad.push(mail);
        if (setError(form, 'consent', !cons.checked)) bad.push(cons);
        if (bad.length) { focusNoScroll(bad[0]); return false; }
      }
      return true;
    }
    function data() {
      return {
        art: radioVal(form, 'art'), lage: radioVal(form, 'lage'), flaeche: +area.value,
        baujahr: qs('[name="baujahr"]', form).value, zustand: radioVal(form, 'zustand') || 'gepflegt',
        extras: qsa('[name="extra"]:checked', form).map(function (c) { return c.value; }),
        name: qs('[name="name"]', form).value.trim(), email: qs('[name="email"]', form).value.trim(),
        anlass: qs('[name="anlass"]', form).value
      };
    }
    function showResult() {
      var d = data();
      var r = computeValuation(d);
      qs('[data-val-low]', result).textContent = eur(r.low);
      qs('[data-val-high]', result).textContent = eur(r.high);
      qs('[data-val-sqm]', result).textContent = 'entspricht ca. ' + eur(r.sqmLow) + ' bis ' + eur(r.sqmHigh) + ' je m² Wohnfläche';
      // Skala: Frankfurt gesamt für diese Fläche
      var vals = Object.keys(VALUATION.BASE_SQM).map(function (k) { return VALUATION.BASE_SQM[k]; });
      var f = (VALUATION.TYPE[d.art] || 1) * d.flaeche;
      var smin = Math.min.apply(null, vals) * f * 0.72, smax = Math.max.apply(null, vals) * f * 1.3;
      var a = clamp((r.low - smin) / (smax - smin), 0, 1), b = clamp((r.high - smin) / (smax - smin), 0, 1);
      var band = qs('[data-val-band]', result);
      band.style.left = (a * 100) + '%';
      band.style.width = Math.max(1.5, (b - a) * 100) + '%';
      band.style.transform = 'scaleX(0)';
      var short = function (v) { return v >= 1e6 ? dec(v / 1e6, 1) + ' Mio. €' : fmt(Math.round(v / 1000)) + ' Tsd. €'; };
      qs('[data-val-scale-min]', result).textContent = short(smin);
      qs('[data-val-scale-max]', result).textContent = short(smax);
      qs('[data-val-scale-label]', result).textContent = 'Frankfurt, ' + d.flaeche + ' m² (Beispielwerte)';
      var sum = qs('[data-val-summary]', result);
      sum.textContent = '';
      var lageLabel = (qs('input[name="lage"]:checked + span', form) || {}).textContent || d.lage;
      var bjLabel = qs('[name="baujahr"]', form).selectedOptions[0].textContent;
      [['Objekt', LABELS.art[d.art] + ', ' + d.flaeche + ' m²'], ['Lage', lageLabel], ['Baujahr', bjLabel],
        ['Zustand', LABELS.zustand[d.zustand]], ['Ausstattung', d.extras.length ? d.extras.map(function (x) { return LABELS.extra[x]; }).join(', ') : '–'],
        ['Anlass', d.anlass], ['Kontakt', d.name + ' · ' + d.email]].forEach(function (p) {
        sum.appendChild(el('dt', null, p[0]));
        sum.appendChild(el('dd', null, p[1]));
      });
      form.hidden = true;
      result.hidden = false;
      focusNoScroll(result);
      var rect = root.getBoundingClientRect();
      if (rect.top < 0) scrollToEl(root);
      requestAnimationFrame(function () {
        band.style.transition = reduced ? 'none' : 'transform 900ms cubic-bezier(0.77, 0, 0.175, 1) 200ms';
        requestAnimationFrame(function () { band.style.transform = 'scaleX(1)'; });
      });
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate(cur)) return;
      if (cur < 4) show(cur + 1, 1, true);
      else showResult();
    });
    back.addEventListener('click', function () { if (cur > 1) show(cur - 1, -1, true); });
    qs('[data-val-restart]', result).addEventListener('click', function () {
      form.reset();
      areaTouched = false;
      area.max = 400;
      qs('.range-scale span:last-child', form).textContent = '400 m²';
      setArea();
      ['art', 'lage', 'name', 'email', 'consent'].forEach(function (n) { setError(form, n, false); });
      result.hidden = true;
      form.hidden = false;
      show(1, 0, true);
    });
    setArea();
    show(1, 0, false);
  }

  /* ------------------------------------------------------------------
     Verkaufsprozess: gepinnte Zeitleiste mit Grundriss, der entsteht
     ------------------------------------------------------------------ */
  function initProcess() {
    var sec = qs('[data-process]');
    if (!sec) return;
    var pinEl = qs('[data-process-pin]', sec);
    var stepsEls = qsa('.pstep', sec);
    var stages = qsa('.pp-stage', sec);
    var sheetNo = qs('[data-sheet-no]', sec);
    var sheetTitle = qs('[data-sheet-title]', sec);
    var fill = qs('[data-chain-fill]', sec);
    var ticks = qsa('.chain-ticks li', sec);
    var titles = stepsEls.map(function (s) {
      var h = qs('.pstep-title', s).cloneNode(true);
      var hid = qs('.visually-hidden', h); if (hid) hid.remove();
      return h.textContent.trim();
    });
    stages.forEach(function (g) { qsa('path, circle', g).forEach(function (p) { if (!g.classList.contains('pp-hand')) p.setAttribute('pathLength', '1'); }); });
    var lastActive = -1;

    function setStage(g, t) {
      if (g.classList.contains('pp-text')) { g.style.opacity = t.toFixed(3); return; }
      if (g.classList.contains('pp-hand')) {
        var e = 1 - Math.pow(1 - t, 3);
        g.style.opacity = clamp(t * 1.6, 0, 1).toFixed(3);
        g.style.transform = 'scale(' + (1.22 - 0.22 * e).toFixed(4) + ')';
        return;
      }
      qsa('path, circle', g).forEach(function (p) {
        p.style.strokeDasharray = '1 1';
        p.style.strokeDashoffset = (1 - t).toFixed(4);
      });
    }
    function clearStages() {
      stages.forEach(function (g) {
        g.style.opacity = ''; g.style.transform = '';
        qsa('path, circle', g).forEach(function (p) { p.style.strokeDasharray = ''; p.style.strokeDashoffset = ''; });
      });
    }
    function setActive(i) {
      if (i === lastActive) return;
      lastActive = i;
      stepsEls.forEach(function (s, k) { s.classList.toggle('is-active', k === i); });
      ticks.forEach(function (t, k) { t.classList.toggle('is-active', k <= i); });
      if (sheetNo) sheetNo.textContent = '0' + (i + 1) + ' / 06';
      if (sheetTitle) sheetTitle.textContent = titles[i];
    }
    function progress(p) {
      var x = p * 6;
      setActive(Math.min(5, Math.floor(x)));
      stages.forEach(function (g) {
        var k = +g.getAttribute('data-stage');
        var t = k === 0 ? 1 : clamp((x - (k - 0.25)) / 0.75, 0, 1);
        setStage(g, t);
      });
      if (fill) fill.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    }

    if (!enhanced) { setActive(5); stepsEls.forEach(function (s) { s.classList.add('is-active'); }); return; }
    var gsap = window.gsap, ST = window.ScrollTrigger;
    var mm = gsap.matchMedia();
    mm.add('(min-width: 900px) and (min-height: 620px)', function () {
      sec.classList.add('is-pinned');
      lastActive = -1;
      progress(0);
      var st = ST.create({
        trigger: pinEl, start: 'top top', end: function () { return '+=' + Math.round(window.innerHeight * 3.6); },
        pin: true, scrub: true, anticipatePin: 1, invalidateOnRefresh: true,
        onUpdate: function (self) { progress(self.progress); }
      });
      return function () {
        st.kill();
        sec.classList.remove('is-pinned');
        clearStages();
        lastActive = -1; setActive(5);
        stepsEls.forEach(function (s) { s.classList.add('is-active'); });
        if (fill) fill.style.transform = '';
      };
    });
    mm.add('(max-width: 899px), (max-height: 619px)', function () {
      setActive(0);
      var sheet = qs('.process-sheet', sec);
      stages.forEach(function (g) { setStage(g, 0); });
      var proxy = { x: 0 };
      var tw = gsap.to(proxy, {
        x: 6, duration: 3.2, ease: 'power1.inOut', paused: true,
        onUpdate: function () {
          setActive(Math.min(5, Math.floor(proxy.x * 0.999)));
          stepsEls.forEach(function (s) { s.classList.add('is-active'); });
          stages.forEach(function (g) {
            var k = +g.getAttribute('data-stage');
            setStage(g, clamp((proxy.x - k * 0.9) / 1.1, 0, 1));
          });
        }
      });
      var st = ST.create({ trigger: sheet, start: 'top 75%', once: true, onEnter: function () { tw.play(); } });
      return function () { st.kill(); tw.kill(); clearStages(); lastActive = -1; setActive(5); stepsEls.forEach(function (s) { s.classList.add('is-active'); }); };
    });
  }

  /* ------------------------------------------------------------------
     Finanzierungsrechner
     ------------------------------------------------------------------ */
  function simulate(D, zins, tilg, bindung) {
    var rate = D * (zins + tilg) / 100 / 12;
    var rest = D, months = 0, interestBind = 0, restBind = D;
    var yearly = [D];
    var maxM = FINANCE.MAX_YEARS * 12;
    while (rest > 0.5 && months < maxM) {
      var zi = rest * zins / 100 / 12;
      var tg = Math.min(rest, rate - zi);
      rest -= tg;
      months++;
      if (months <= bindung * 12) interestBind += zi;
      if (months === bindung * 12) restBind = rest;
      if (months % 12 === 0) yearly.push(Math.max(0, rest));
    }
    if (months % 12 !== 0) yearly.push(0);
    if (months < bindung * 12) restBind = 0;
    return { rate: rate, months: months, interestBind: interestBind, restBind: restBind, yearly: yearly, done: rest <= 0.5 };
  }
  function niceMax(v) {
    if (v <= 0) return 100000;
    var p = Math.pow(10, Math.floor(Math.log10(v)));
    var m = v / p;
    var steps = [1, 1.2, 1.6, 2, 2.4, 3, 4, 5, 6, 8, 10];
    for (var i = 0; i < steps.length; i++) { if (m <= steps[i] + 1e-9) return steps[i] * p; }
    return 10 * p;
  }
  function initFinance() {
    var root = qs('[data-fin]');
    if (!root) return;
    var inp = {};
    qsa('[data-fin-in]', root).forEach(function (n) { var k = n.getAttribute('data-fin-in'); if (k === 'bindung') (inp.bindung = inp.bindung || []).push(n); else inp[k] = n; });
    var out = {}; qsa('[data-fin-out]', root).forEach(function (n) { out[n.getAttribute('data-fin-out')] = n; });
    var fact = {}; qsa('[data-fin-fact]', root).forEach(function (n) { fact[n.getAttribute('data-fin-fact')] = n; });
    var rateEl = qs('[data-fin-rate]', root), subEl = qs('[data-fin-sub]', root), quote = qs('[data-fin-ekquote]', root);
    var svg = qs('[data-fin-svg]', root), grid = qs('[data-fc-grid]', root), area = qs('[data-fc-area]', root), line = qs('[data-fc-line]', root);
    var bindLine = qs('[data-fc-bind]', root), bindLabel = qs('[data-fc-bind-label]', root);
    var ax = qs('[data-fc-axis-x]', root), ay = qs('[data-fc-axis-y]', root);
    var box = qs('[data-fin-chart-box]', root), hover = qs('[data-fc-hover]', root), tip = qs('[data-fc-tip]', root);
    var tipYear = qs('[data-fc-tip-year]', root), tipVal = qs('[data-fc-tip-val]', root), desc = qs('[data-fin-desc]', root);
    var dot = el('span', 'fc-dot'); dot.setAttribute('aria-hidden', 'true'); box.appendChild(dot);
    var hoverDot = qs('.fc-hover-dot', svg); if (hoverDot) hoverDot.style.display = 'none';
    box.tabIndex = 0;
    box.setAttribute('aria-label', 'Restschuld-Diagramm – mit Pfeiltasten durch die Jahre gehen');
    var last = null, hoverYear = -1;
    var VBW = 640, TOP = 12, BOTTOM = 250;

    function values() {
      var b = inp.bindung.filter(function (r) { return r.checked; })[0];
      return { preis: +inp.preis.value, ek: +inp.ek.value, zins: +inp.zins.value, tilg: +inp.tilg.value, bindung: b ? +b.value : 10, nk: inp.nk.checked };
    }
    function calc() {
      var v = values();
      if (+inp.ek.max !== v.preis) { inp.ek.max = v.preis; if (v.ek > v.preis) { inp.ek.value = v.preis; v.ek = v.preis; } }
      var nkSum = v.preis * (FINANCE.GRUNDERWERBSTEUER + FINANCE.NOTAR_GRUNDBUCH + FINANCE.MAKLER);
      var D = Math.max(0, v.preis - v.ek + (v.nk ? nkSum : 0));
      var sim = simulate(D, v.zins, v.tilg, v.bindung);
      out.preis.textContent = eur(v.preis);
      out.ek.textContent = eur(v.ek);
      out.zins.textContent = dec(v.zins, 2) + ' %';
      out.tilg.textContent = dec(v.tilg, 2) + ' %';
      inp.preis.setAttribute('aria-valuetext', eur(v.preis));
      inp.ek.setAttribute('aria-valuetext', eur(v.ek));
      inp.zins.setAttribute('aria-valuetext', dec(v.zins, 2) + ' Prozent');
      inp.tilg.setAttribute('aria-valuetext', dec(v.tilg, 2) + ' Prozent');
      ['preis', 'ek', 'zins', 'tilg'].forEach(function (k) { setRangeFill(inp[k]); });
      quote.textContent = 'entspricht ' + Math.round(v.ek / v.preis * 100) + ' % des Kaufpreises' + (v.nk ? '' : ' – Nebenkosten (' + eur(nkSum) + ') zusätzlich aus Eigenmitteln');
      rateEl.textContent = fmt(sim.rate);
      subEl.textContent = D > 0 ? 'bei einem Darlehen von ' + eur(D) : 'Ihr Eigenkapital deckt den Kaufpreis – kein Darlehen nötig';
      fact.nk.textContent = eur(nkSum);
      fact.darlehen.textContent = eur(D);
      fact.bindungLabel.textContent = v.bindung + ' Jahren';
      fact.rest.textContent = eur(sim.restBind);
      fact.zinsen.textContent = eur(sim.interestBind);
      var yrs = sim.months / 12;
      fact.dauer.textContent = D <= 0 ? '–' : (sim.done ? Math.round(yrs) + ' Jahren' : 'über ' + FINANCE.MAX_YEARS + ' Jahren');
      last = { D: D, sim: sim, v: v };
      draw();
      desc.textContent = 'Restschuld eines Darlehens über ' + eur(D) + ': nach ' + v.bindung + ' Jahren noch ' + eur(sim.restBind) + ', schuldenfrei nach etwa ' + Math.round(yrs) + ' Jahren.';
    }
    function geom() {
      var ys = last.sim.yearly;
      var N = Math.max(ys.length - 1, last.v.bindung, 1);
      var max = niceMax(last.D || 1);
      return {
        N: N, max: max,
        x: function (i) { return i / N * VBW; },
        y: function (val) { return BOTTOM - val / max * (BOTTOM - TOP); }
      };
    }
    function draw() {
      var g = geom(), ys = last.sim.yearly;
      grid.textContent = '';
      ay.textContent = ''; ax.textContent = '';
      for (var k = 0; k <= 4; k++) {
        var val = g.max * k / 4, yy = g.y(val);
        grid.appendChild(svgEl('line', { x1: 0, x2: VBW, y1: yy, y2: yy }));
        var lb = el('span', null, val === 0 ? '0' : fmt(val / 1000) + ' T€');
        lb.style.top = (yy / 280 * 100) + '%';
        ay.appendChild(lb);
      }
      var stepX = g.N > 40 ? 10 : 5;
      for (var yr = 0; yr <= g.N; yr += stepX) {
        var sx = el('span', null, yr + (yr === 0 ? '' : ' J.'));
        sx.style.left = (g.x(yr) / VBW * 100) + '%';
        if (g.x(yr) / VBW > 0.97) sx.style.transform = 'translateX(-100%)';
        if (yr === 0) sx.style.transform = 'none';
        ax.appendChild(sx);
      }
      if (!last.D) { line.setAttribute('d', ''); area.setAttribute('d', ''); }
      else {
        var d = '';
        ys.forEach(function (val, i) { d += (i ? 'L' : 'M') + g.x(i).toFixed(1) + ' ' + g.y(val).toFixed(1); });
        line.setAttribute('d', d);
        area.setAttribute('d', d + 'L' + g.x(ys.length - 1).toFixed(1) + ' ' + BOTTOM + 'L0 ' + BOTTOM + 'Z');
      }
      var bx = g.x(last.v.bindung);
      bindLine.setAttribute('x1', bx); bindLine.setAttribute('x2', bx);
      bindLine.setAttribute('y1', TOP); bindLine.setAttribute('y2', BOTTOM);
      bindLabel.style.left = 'calc(3.4rem + (100% - 3.4rem) * ' + (bx / VBW).toFixed(4) + ')';
      if (hoverYear > -1) setHover(Math.min(hoverYear, ys.length - 1));
    }
    function setHover(i) {
      if (!last || !last.D) return;
      var ys = last.sim.yearly;
      i = clamp(i, 0, ys.length - 1);
      hoverYear = i;
      var g = geom();
      var hx = g.x(i), hy = g.y(ys[i]);
      var hl = qs('.fc-hover-line', svg);
      hl.setAttribute('x1', hx); hl.setAttribute('x2', hx); hl.setAttribute('y1', TOP); hl.setAttribute('y2', BOTTOM);
      hover.classList.add('is-on');
      var sr = svg.getBoundingClientRect(), br = box.getBoundingClientRect();
      var px = sr.left - br.left + hx / VBW * sr.width, py = sr.top - br.top + hy / 280 * sr.height;
      dot.style.transform = 'translate(' + px.toFixed(1) + 'px,' + py.toFixed(1) + 'px)';
      dot.classList.add('is-on');
      tipYear.textContent = i === 0 ? 'Start' : 'nach ' + i + (i === 1 ? ' Jahr' : ' Jahren');
      tipVal.textContent = eur(ys[i]);
      tip.classList.add('is-on');
      var tw = tip.offsetWidth, th = tip.offsetHeight;
      var tx = clamp(px - tw / 2, 0, br.width - tw), ty = py - th - 14;
      if (ty < 0) ty = py + 14;
      tip.style.transform = 'translate(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px)';
    }
    function hideHover() {
      hoverYear = -1;
      hover.classList.remove('is-on'); tip.classList.remove('is-on'); dot.classList.remove('is-on');
    }
    box.addEventListener('pointermove', function (e) {
      if (!last) return;
      var sr = svg.getBoundingClientRect();
      var f = clamp((e.clientX - sr.left) / sr.width, 0, 1);
      setHover(Math.round(f * geom().N));
    });
    box.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') hideHover(); });
    box.addEventListener('keydown', function (e) {
      if (!last) return;
      var n = last.sim.yearly.length - 1;
      var i = hoverYear < 0 ? last.v.bindung : hoverYear;
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') i++;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') i--;
      else if (e.key === 'Home') i = 0;
      else if (e.key === 'End') i = n;
      else if (e.key === 'Escape') { hideHover(); return; }
      else return;
      e.preventDefault();
      setHover(clamp(i, 0, n));
    });
    box.addEventListener('focus', function () { if (hoverYear < 0 && last) setHover(Math.min(last.v.bindung, last.sim.yearly.length - 1)); });
    box.addEventListener('blur', hideHover);
    root.addEventListener('input', calc);
    root.addEventListener('change', calc);
    window.addEventListener('resize', function () { if (hoverYear > -1) setHover(hoverYear); });
    calc();
  }

  /* ------------------------------------------------------------------
     Kundenstimmen: Pfeile
     ------------------------------------------------------------------ */
  function initVoices() {
    var track = qs('[data-voices-track]');
    if (!track) return;
    var prev = qs('[data-voices-prev]'), next = qs('[data-voices-next]');
    function step() { var c = track.children[0]; return c ? c.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 20) : 300; }
    function sync() {
      var max = track.scrollWidth - track.clientWidth - 2;
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= max;
    }
    prev.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: reduced ? 'auto' : 'smooth' }); });
    next.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: reduced ? 'auto' : 'smooth' }); });
    track.addEventListener('scroll', function () { requestAnimationFrame(sync); }, { passive: true });
    window.addEventListener('resize', sync);
    sync();
  }

  /* ------------------------------------------------------------------
     Kontaktformular (nur clientseitig)
     ------------------------------------------------------------------ */
  function initContact() {
    var form = qs('[data-contact-form]');
    if (!form) return;
    var success = qs('[data-contact-success]');
    var summary = qs('[data-contact-summary]');
    var f = function (n) { return qs('[name="' + n + '"]', form); };
    ['name', 'email', 'msg'].forEach(function (n) {
      f(n).addEventListener('input', function () {
        if (f(n).getAttribute('aria-invalid')) setError(form, n, n === 'email' ? !validEmail(f(n).value) : !f(n).value.trim());
      });
    });
    f('consent').addEventListener('change', function () { if (f('consent').checked) setError(form, 'consent', false); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = [];
      if (setError(form, 'name', !f('name').value.trim())) bad.push(f('name'));
      if (setError(form, 'email', !validEmail(f('email').value))) bad.push(f('email'));
      if (setError(form, 'msg', !f('msg').value.trim())) bad.push(f('msg'));
      if (setError(form, 'consent', !f('consent').checked)) bad.push(f('consent'));
      if (bad.length) { focusNoScroll(bad[0]); return; }
      summary.textContent = '';
      var msg = f('msg').value.trim();
      if (msg.length > 220) msg = msg.slice(0, 217) + '…';
      [['Anliegen', radioVal(form, 'anliegen')], ['Name', f('name').value.trim()], ['E-Mail', f('email').value.trim()],
        ['Telefon', f('tel').value.trim() || '–'], ['Objekt', f('ref').value.trim() || '–'], ['Rückruf', f('zeit').value], ['Nachricht', msg]].forEach(function (p) {
        summary.appendChild(el('dt', null, p[0]));
        summary.appendChild(el('dd', null, p[1]));
      });
      form.hidden = true;
      success.hidden = false;
      focusNoScroll(success);
      var r = success.getBoundingClientRect();
      if (r.top < headerH()) scrollToEl(qs('.contact-card'));
    });
    qs('[data-contact-reset]').addEventListener('click', function () {
      form.reset();
      ['name', 'email', 'msg', 'consent'].forEach(function (n) { setError(form, n, false); });
      success.hidden = true;
      form.hidden = false;
      focusNoScroll(f('name'));
    });
  }

  /* ------------------------------------------------------------------
     Start
     ------------------------------------------------------------------ */
  safe('scroll', initScroll);
  safe('reveals', initReveals);
  safe('hero', initHero);
  safe('clicks', initClicks);
  safe('header', initHeader);
  safe('menu', initMenu);
  safe('parallax', initParallax);
  safe('services', initServicePreview);
  safe('objects', initObjects);
  safe('expose', initExpose);
  safe('valuation', initValuation);
  safe('process', initProcess);
  safe('finance', initFinance);
  safe('voices', initVoices);
  safe('contact', initContact);
  doc.classList.remove('is-loading');

  if (hasGSAP) {
    window.addEventListener('load', function () { window.ScrollTrigger.refresh(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { window.ScrollTrigger.refresh(); });
  }
})();
