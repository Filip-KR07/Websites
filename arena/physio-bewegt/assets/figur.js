/* Figur – kleine 2D-Kinematik für Linien-Figuren (Seitenansicht, Blick nach rechts).
   Koordinaten: viewBox 0 0 400 480, Boden bei y = G. Eine Pose beschreibt Hüfte, Rumpf, Füße und Arme;
   Knie werden per 2-Gelenk-IK berechnet (beugen nach vorn). Wird auch von Node genutzt (statische Posen im HTML). */
(function (root) {
  'use strict';
  var G = 440;               // Bodenlinie
  var L = { thigh: 104, shin: 100, trunk: 128, ua: 74, fa: 68, foot: 34, ankle: 8 };
  var R = Math.PI / 180;

  // Standpose als Basis, alle anderen Posen überschreiben nur, was sich ändert.
  var BASE = { hx: 200, hy: G - 208, tb: 3, nk: 0, fA: 206, bA: 190, fL: 0, bL: 0, fY: 0, bY: 0, aF: 8, eF: 12, aB: -8, eB: 10 };
  // fY/bY: Höhe der Standfläche unter dem vorderen/hinteren Fuß (Treppenstufe, Fuß in der Luft)

  function pose(p) { var o = {}, k; for (k in BASE) o[k] = BASE[k]; for (k in p) o[k] = p[k]; return o; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function mix(a, b, t) { var o = {}; for (var k in a) o[k] = lerp(a[k], b[k], t); return o; }
  function easeIO(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  // Keyframe-Folge: [{t: Sekunden, p: Pose}] – liefert Pose zum Zeitpunkt s (zyklisch).
  function sample(seq, s) {
    var dur = seq[seq.length - 1].t; s = ((s % dur) + dur) % dur;
    for (var i = 1; i < seq.length; i++) if (s <= seq[i].t) {
      var a = seq[i - 1], b = seq[i], t = (s - a.t) / Math.max(1e-6, b.t - a.t);
      return mix(a.p, b.p, easeIO(t));
    }
    return seq[seq.length - 1].p;
  }

  function knee(h, a, flip) {
    var dx = a[0] - h[0], dy = a[1] - h[1], d = Math.min(Math.hypot(dx, dy), L.thigh + L.shin - 0.5);
    var c = (L.thigh * L.thigh + d * d - L.shin * L.shin) / (2 * L.thigh * d);
    var ang = Math.acos(Math.max(-1, Math.min(1, c))), base = Math.atan2(dy, dx);
    var k1 = [h[0] + L.thigh * Math.cos(base - ang), h[1] + L.thigh * Math.sin(base - ang)];
    var k2 = [h[0] + L.thigh * Math.cos(base + ang), h[1] + L.thigh * Math.sin(base + ang)];
    return (k1[0] > k2[0]) !== !!flip ? k1 : k2;
  }

  function solve(p) {
    var H = [p.hx, p.hy];
    var leg = function (ax, lift, gy) {
      var ly = Math.min(lift, L.foot - 4), run = Math.sqrt(L.foot * L.foot - ly * ly);
      var toe = [ax + L.foot, G - gy];
      var A = [toe[0] - run, G - gy - L.ankle - ly];
      return { A: A, K: knee(H, A), T: toe, heel: [A[0] - 6, A[1] + L.ankle * 0.9] };
    };
    var tb = p.tb * R, S = [H[0] + L.trunk * Math.sin(tb), H[1] - L.trunk * Math.cos(tb)];
    var arm = function (a, e) {
      var aa = (a - p.tb) * R, E = [S[0] + L.ua * Math.sin(aa), S[1] + L.ua * Math.cos(aa)];
      var fa = aa + e * R, W = [E[0] + L.fa * Math.sin(fa), E[1] + L.fa * Math.cos(fa)];
      return { E: E, W: W };
    };
    var hn = (p.tb + p.nk) * R;
    return {
      H: H, S: S,
      N: [S[0] + 14 * Math.sin(hn), S[1] - 14 * Math.cos(hn)],
      C: [S[0] + 36 * Math.sin(hn), S[1] - 36 * Math.cos(hn)],
      F: leg(p.fA, p.fL, p.fY), B: leg(p.bA, p.bL, p.bY),
      AF: arm(p.aF, p.eF), AB: arm(p.aB, p.eB)
    };
  }

  function f(n) { return Math.round(n * 10) / 10; }
  function pts(a) { return 'M' + a.map(function (q) { return f(q[0]) + ' ' + f(q[1]); }).join('L'); }

  // Winkel im Gelenk (Innenwinkel) zwischen den Segmenten j→a und j→b
  function angle(j, a, b) {
    var v1 = [a[0] - j[0], a[1] - j[1]], v2 = [b[0] - j[0], b[1] - j[1]];
    var c = (v1[0] * v2[0] + v1[1] * v2[1]) / (Math.hypot(v1[0], v1[1]) * Math.hypot(v2[0], v2[1]));
    return Math.acos(Math.max(-1, Math.min(1, c))) / R;
  }

  function parts(p) {
    var s = solve(p);
    return {
      s: s,
      legB: pts([s.H, s.B.K, s.B.A, s.B.T]) + 'M' + f(s.B.A[0]) + ' ' + f(s.B.A[1]) + 'L' + f(s.B.heel[0]) + ' ' + f(s.B.heel[1]),
      armB: pts([s.S, s.AB.E, s.AB.W]),
      legF: pts([s.H, s.F.K, s.F.A, s.F.T]) + 'M' + f(s.F.A[0]) + ' ' + f(s.F.A[1]) + 'L' + f(s.F.heel[0]) + ' ' + f(s.F.heel[1]),
      trunk: pts([s.H, s.S, s.N]),
      armF: pts([s.S, s.AF.E, s.AF.W]),
      joints: [s.H, s.F.K, s.F.A, s.S, s.AF.E, s.AF.W, s.B.K],
      head: s.C
    };
  }

  // Markup für eine Figur (auch statisch im HTML genutzt)
  function markup(p) {
    var q = parts(p), j = q.joints.map(function (c, i) {
      return '<circle class="fig-j" data-j="' + i + '" cx="' + f(c[0]) + '" cy="' + f(c[1]) + '" r="4.5"/>';
    }).join('');
    return '<path class="fig-l fig-back" data-p="legB" d="' + q.legB + '"/>' +
      '<path class="fig-l fig-back" data-p="armB" d="' + q.armB + '"/>' +
      '<path class="fig-l" data-p="legF" d="' + q.legF + '"/>' +
      '<path class="fig-l fig-trunk" data-p="trunk" d="' + q.trunk + '"/>' +
      '<path class="fig-l" data-p="armF" d="' + q.armF + '"/>' +
      '<circle class="fig-head" data-p="head" cx="' + f(q.head[0]) + '" cy="' + f(q.head[1]) + '" r="17"/>' + j;
  }

  // Bindet eine vorhandene <g>-Figur, damit draw() nur Attribute setzt (keine DOM-Neubauten pro Frame)
  function bind(g) {
    if (!g.querySelector('[data-p]')) g.innerHTML = markup(BASE);
    var o = { g: g, p: {}, j: [] };
    g.querySelectorAll('[data-p]').forEach(function (el) { o.p[el.getAttribute('data-p')] = el; });
    g.querySelectorAll('[data-j]').forEach(function (el) { o.j[+el.getAttribute('data-j')] = el; });
    return o;
  }
  function draw(o, p) {
    var q = parts(p);
    o.p.legB.setAttribute('d', q.legB); o.p.armB.setAttribute('d', q.armB);
    o.p.legF.setAttribute('d', q.legF); o.p.trunk.setAttribute('d', q.trunk); o.p.armF.setAttribute('d', q.armF);
    o.p.head.setAttribute('cx', f(q.head[0])); o.p.head.setAttribute('cy', f(q.head[1]));
    for (var i = 0; i < o.j.length; i++) { o.j[i].setAttribute('cx', f(q.joints[i][0])); o.j[i].setAttribute('cy', f(q.joints[i][1])); }
    return q;
  }

  /* ---------- Bewegungen ---------- */
  var STAND = pose({});
  var SEQ = {
    // Hero: Treppenstufe hinauf und wieder hinunter (Stufe 64 Einheiten hoch, ab x = 262)
    treppe: [
      { t: 0, p: pose({ hx: 196, tb: 4, fA: 200, bA: 186, aF: 6, eF: 14, aB: -6, eB: 12 }) },
      { t: 0.9, p: pose({ hx: 202, hy: G - 210, tb: 8, fA: 238, fY: 84, bA: 186, aF: -16, eF: 22, aB: 18, eB: 16 }) },
      { t: 1.5, p: pose({ hx: 212, hy: G - 204, tb: 15, nk: -6, fA: 276, fY: 64, bA: 188, bL: 12, aF: -20, eF: 26, aB: 22, eB: 18 }) },
      { t: 2.6, p: pose({ hx: 266, hy: G - 268, tb: 9, nk: -4, fA: 280, fY: 64, bA: 238, bY: 74, aF: 20, eF: 18, aB: -16, eB: 22 }) },
      { t: 3.2, p: pose({ hx: 272, hy: G - 272, tb: 3, fA: 282, fY: 64, bA: 266, bY: 64, aF: 6, eF: 14, aB: -6, eB: 12 }) },
      { t: 3.9, p: pose({ hx: 272, hy: G - 272, tb: 3, fA: 282, fY: 64, bA: 266, bY: 64, aF: 6, eF: 14, aB: -6, eB: 12 }) },
      { t: 4.7, p: pose({ hx: 258, hy: G - 252, tb: 10, nk: -4, fA: 282, fY: 64, bA: 226, bY: 50, aF: -14, eF: 20, aB: 16, eB: 16 }) },
      { t: 5.4, p: pose({ hx: 224, hy: G - 216, tb: 7, fA: 282, fY: 64, bA: 198, bY: 0, aF: 14, eF: 16, aB: -12, eB: 14 }) },
      { t: 6.1, p: pose({ hx: 202, hy: G - 210, tb: 5, fA: 226, fY: 26, bA: 188, aF: -6, eF: 16, aB: 8, eB: 14 }) },
      { t: 6.7, p: pose({ hx: 196, tb: 4, fA: 200, bA: 186, aF: 6, eF: 14, aB: -6, eB: 12 }) },
      { t: 7.6, p: pose({ hx: 196, tb: 4, fA: 200, bA: 186, aF: 6, eF: 14, aB: -6, eB: 12 }) }
    ],
    // Hero (alt): Kniebeuge mit Armheben
    hero: [
      { t: 0, p: STAND },
      { t: 1.7, p: pose({ hx: 148, hy: G - 128, tb: 36, nk: -14, aF: 168, eF: 6, aB: 156, eB: 6 }) },
      { t: 2.1, p: pose({ hx: 146, hy: G - 124, tb: 37, nk: -16, aF: 174, eF: 4, aB: 162, eB: 4 }) },
      { t: 3.8, p: STAND },
      { t: 4.6, p: STAND }
    ],
    // Übung 1: Aufstehen vom Stuhl ohne Hände
    stuhl: [
      { t: 0, p: pose({ hx: 150, hy: G - 116, tb: 8, nk: 0, fA: 216, bA: 204, aF: 70, eF: 70, aB: 60, eB: 70 }) },
      { t: 0.9, p: pose({ hx: 160, hy: G - 120, tb: 42, nk: -18, fA: 216, bA: 204, aF: 92, eF: 20, aB: 84, eB: 20 }) },
      { t: 2.2, p: pose({ hx: 206, hy: G - 207, tb: 2, fA: 216, bA: 204, aF: 70, eF: 70, aB: 62, eB: 70 }) },
      { t: 3.2, p: pose({ hx: 206, hy: G - 207, tb: 2, fA: 216, bA: 204, aF: 70, eF: 70, aB: 62, eB: 70 }) },
      { t: 5.2, p: pose({ hx: 162, hy: G - 122, tb: 40, nk: -16, fA: 216, bA: 204, aF: 92, eF: 20, aB: 84, eB: 20 }) },
      { t: 6.0, p: pose({ hx: 150, hy: G - 116, tb: 8, fA: 216, bA: 204, aF: 70, eF: 70, aB: 60, eB: 70 }) },
      { t: 7.0, p: pose({ hx: 150, hy: G - 116, tb: 8, fA: 216, bA: 204, aF: 70, eF: 70, aB: 60, eB: 70 }) }
    ],
    // Übung 2: Fersenheben mit leichter Abstützung
    ferse: [
      { t: 0, p: pose({ aF: 52, eF: 34, aB: 46, eB: 36 }) },
      { t: 1.5, p: pose({ hy: G - 226, fL: 20, bL: 20, aF: 56, eF: 30, aB: 50, eB: 32 }) },
      { t: 2.5, p: pose({ hy: G - 226, fL: 20, bL: 20, aF: 56, eF: 30, aB: 50, eB: 32 }) },
      { t: 4.5, p: pose({ aF: 52, eF: 34, aB: 46, eB: 36 }) },
      { t: 5.0, p: pose({ aF: 52, eF: 34, aB: 46, eB: 36 }) }
    ],
    // Übung 3: Arme heben im Stand (Schulterbeweglichkeit)
    arme: [
      { t: 0, p: pose({ aF: 6, eF: 8, aB: -4, eB: 8 }) },
      { t: 2.5, p: pose({ tb: -2, nk: -8, aF: 172, eF: 4, aB: 166, eB: 4 }) },
      { t: 3.5, p: pose({ tb: -2, nk: -8, aF: 172, eF: 4, aB: 166, eB: 4 }) },
      { t: 6.0, p: pose({ aF: 6, eF: 8, aB: -4, eB: 8 }) },
      { t: 6.6, p: pose({ aF: 6, eF: 8, aB: -4, eB: 8 }) }
    ]
  };

  /* Stationen für „Ihr Weg“: sitzen → aufstehen → Befund → Behandlung → Heimprogramm → laufen */
  var WEG = [
    pose({ hx: 150, hy: G - 116, tb: 8, fA: 216, bA: 204, aF: 70, eF: 70, aB: 60, eB: 70 }),
    pose({ hx: 166, hy: G - 128, tb: 40, nk: -16, fA: 216, bA: 204, aF: 92, eF: 20, aB: 84, eB: 20 }),
    pose({ tb: -2, nk: -8, aF: 172, eF: 4, aB: 150, eB: 6 }),
    pose({ hx: 148, hy: G - 128, tb: 36, nk: -14, aF: 100, eF: 6, aB: 90, eB: 6 }),
    pose({ hy: G - 226, fL: 20, bL: 20, aF: 56, eF: 30, aB: 50, eB: 32 }),
    pose({ hx: 206, hy: G - 214, tb: 12, nk: -6, fA: 252, fY: 26, bA: 134, bY: 46, bL: 18, aF: -34, eF: 84, aB: 48, eB: 76 })
  ];

  var api = { WEG: WEG, G: G, L: L, BASE: BASE, pose: pose, mix: mix, sample: sample, solve: solve, parts: parts, angle: angle,
    markup: markup, bind: bind, draw: draw, SEQ: SEQ, duration: function (k) { return SEQ[k][SEQ[k].length - 1].t; }, f: f };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Figur = api;
})(typeof window !== 'undefined' ? window : this);
