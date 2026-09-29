/* fx/rechner — Rendite-Rechner
   Regler + Zahlenfeld je Annahme, Rechnung live, Diagramm ueber 24 Monate.
   Jeder Wert gleitet mit --ease-out auf sein Ziel und laesst sich jederzeit
   umlenken (wie gsap.quickTo). Spaetere Monatspunkte brauchen etwas laenger:
   die Linie biegt sich kurz und legt sich wieder gerade. Ohne Motion sofort.

   Schnittstelle (liest u. a. fx/finale): Hat sich eine Eingabe gesetzt (Zahlenfeld
   bestaetigt, Regler losgelassen, Beispiel fertig geladen; 300 ms entprellt, nie
   beim Laden und nie pro Zieh-Frame), feuert
   document 'fk:rechner' mit detail = { paybackText: 'bezahlt nach 5,6 Monaten' |
   'nach 36 Monaten noch nicht bezahlt', roiPct (Rendite 1. Jahr nach Abzug der
   Investition, ganze %), ordersToPayback, inputs: { visitors, inquiryRate,
   closeRate, orderValue, margin, running, invest }, summary (Klartext-Zeilen
   mit allen Annahmen und Ergebnissen, z. B. fuer eine E-Mail) }. */
(() => {
  'use strict';
  if (!window.FK) return;

  FK.register('rechner', (FK) => {
    const { $, $$, motion } = FK;
    const root = $('[data-fx-rechner]');
    if (!root || root.dataset.rxReady) return;
    root.dataset.rxReady = '1';

    /* ---------- Kurven aus den Tokens (--ease-out, --ease-in-out) ---------- */
    const bezier = (x1, y1, x2, y2) => {
      const cx = 3 * x1; const bx = 3 * (x2 - x1) - cx; const ax = 1 - cx - bx;
      const cy = 3 * y1; const by = 3 * (y2 - y1) - cy; const ay = 1 - cy - by;
      const fx = (t) => ((ax * t + bx) * t + cx) * t;
      const fy = (t) => ((ay * t + by) * t + cy) * t;
      return (x) => {
        if (x <= 0) return 0;
        if (x >= 1) return 1;
        let lo = 0; let hi = 1; let t = x;
        for (let i = 0; i < 24; i++) {
          const v = fx(t);
          if (Math.abs(v - x) < 1e-6) break;
          if (v < x) lo = t; else hi = t;
          t = (lo + hi) / 2;
        }
        return fy(t);
      };
    };
    const easeOut = bezier(0.23, 1, 0.32, 1);
    const easeInOut = bezier(0.77, 0, 0.175, 1);

    /* ---------- Zahlen de-DE ---------- */
    const NF = [0, 1, 2].map((d) => new Intl.NumberFormat('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d }));
    const fmt = (v, d = 0) => NF[d].format(v);
    // Schaetzungen nur in ganzen Euro, Minus als echtes Minuszeichen
    const euro = (v) => `${fmt(Math.round(v), 0).replace('-', '−')} €`;
    const amount = (v) => fmt(v, v < 100 ? 1 : 0);
    // Rendite als Prozent mit Vorzeichen: +113 %, −52 %
    const pct = (v) => { const p = Math.round(v * 100); return `${p > 0 ? '+' : p < 0 ? '−' : ''}${fmt(Math.abs(p))} %`; };
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    const roundTo = (v, d) => { const k = 10 ** d; return Math.round(v * k) / k; };
    const r2 = (v) => Math.round(v * 100) / 100;

    // "1.000", "1,5", "20000", "1.5" -> Zahl
    const parse = (s) => {
      let t = String(s).replace(/[\s €%]/g, '');
      if (!t) return null;
      if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
      else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, '');
      if (!/^(\d+\.?\d*|\.\d+)$/.test(t)) return null;
      const v = parseFloat(t);
      return Number.isFinite(v) ? v : null;
    };

    /* ---------- Felder: Grenzen, Skala, Schritte ---------- */
    const FIELDS = {
      visitors: { min: 50, max: 20000, log: true, dec: 0, say: 'Besucher pro Monat', def: 500 },
      inquiry: { min: 0.1, max: 10, step: 0.1, dec: 1, say: 'Prozent', def: 1.5 },
      close: { min: 1, max: 100, step: 1, dec: 0, say: 'Prozent', def: 25 },
      value: { min: 50, max: 50000, log: true, dec: 0, say: 'Euro', def: 1000 },
      margin: { min: 5, max: 100, step: 1, dec: 0, say: 'Prozent', def: 30 },
      running: { min: 0, max: 500, step: 5, dec: 0, say: 'Euro im Monat', def: 30 },
      invest: { min: 500, max: 30000, log: true, dec: 0, say: 'Euro', def: 3000 },
    };
    // Beispielwerte (ohne laufende Kosten und Investition: die bleiben deine).
    // Im Shop ist jeder Kauf schon ein Auftrag: Kaufquote statt Anfragequote.
    const PRESETS = {
      vorsichtig: { visitors: 200, inquiry: 1, close: 25, value: 1000, margin: 30 },
      handwerk: { visitors: 300, inquiry: 1.5, close: 30, value: 3500, margin: 20 },
      beratung: { visitors: 600, inquiry: 1, close: 20, value: 1500, margin: 60 },
      shop: { visitors: 4000, inquiry: 1, close: 100, value: 60, margin: 25 },
    };
    const SHOP = 'shop';
    // Log-Regler rasten auf runde Werte ein
    const niceStep = (v) => (v < 200 ? 10 : v < 1000 ? 50 : v < 5000 ? 100 : v < 20000 ? 500 : 1000);
    const snapLog = (f, v) => { const s = niceStep(v); return clamp(Math.round(v / s) * s, f.min, f.max); };
    const toUnit = (f, v) => clamp(f.log ? Math.log(v / f.min) / Math.log(f.max / f.min) : (v - f.min) / (f.max - f.min), 0, 1);
    const fromUnit = (f, u) => {
      const k = clamp(u, 0, 1);
      return f.log ? snapLog(f, f.min * (f.max / f.min) ** k) : roundTo(f.min + k * (f.max - f.min), f.dec);
    };
    const toPos = (f, v) => (f.log ? Math.round(toUnit(f, v) * 1000) : v);
    const fromPos = (f, pos) => (f.log ? fromUnit(f, pos / 1000) : roundTo(clamp(pos, f.min, f.max), f.dec));
    const stepBy = (f, v, n) => {
      if (!f.log) return roundTo(clamp(v + n * f.step, f.min, f.max), f.dec);
      let x = v;
      for (let i = 0; i < Math.abs(n); i++) x = n > 0 ? x + niceStep(x) : x - niceStep(x - 1);
      return snapLog(f, clamp(x, f.min, f.max));
    };

    // Gewinn pro Monat = Rohgewinn der Auftraege minus laufende Kosten.
    // Rendite im 1. Jahr netto: (12 Monatsgewinne - Investition) / Investition.
    // Spanne: halbe bis 1,5-fache Anfragequote verschiebt den Rohgewinn um je die Haelfte.
    const calc = (v) => {
      const inquiries = v.visitors * v.inquiry / 100;
      const orders = inquiries * v.close / 100;
      const revMonth = orders * v.value;
      const gross = revMonth * v.margin / 100;
      const profitMonth = gross - v.running;
      const payback = profitMonth > 0 ? v.invest / profitMonth : Infinity;
      const roi = (profitMonth * 12 - v.invest) / v.invest;
      const perOrder = v.value * v.margin / 100;
      const ordersToPay = Math.max(1, Math.ceil(v.invest / perOrder - 1e-9));
      return { inquiries, orders, revMonth, profitMonth, payback, roi, perOrder, ordersToPay, spread: gross * 0.5 };
    };

    /* ---------- Elemente ---------- */
    const pick = (k) => $(`[data-rx-${k}]`, root);
    const panel = pick('panel');
    const chart = pick('chart');
    const E = {
      line: pick('line'), glow: pick('glow'), gain: pick('gain'), loss: pick('loss'), dots: pick('dots'),
      inv: pick('invline'), drop: pick('drop'), clipUp: pick('clip-up'), clipDown: pick('clip-down'),
      wipe: pick('wipe'), wipeInv: pick('wipe-inv'), marker: pick('marker'), pill: pick('pill'),
      pillText: pick('pill-text'), pen: pick('pen'), end: pick('end'), endVal: pick('endval'),
      invVal: pick('inv'), live: pick('live'), pre: pick('pre'), post: pick('post'), unit: pick('unit'),
      odo: pick('odo'), roi: pick('roi'), ring: pick('ring'), dock: pick('dock'), dockPay: pick('dock-pay'),
      dockRoi: pick('dock-roi'), dockBtn: pick('dock-btn'), guide: pick('guide'), guideText: pick('guide-text'),
      hl: pick('hl'), chipbox: pick('chipbox'), reset: pick('reset'), grid: pick('grid'), fields: pick('fields'),
      band: pick('band'), endCap: pick('endcap'), orders: pick('orders'), ordersWord: pick('orders-word'),
      per: pick('per'), verdict: pick('verdict'),
    };
    if (!panel || !chart || !E.line || !E.odo) return;
    const outs = ['inquiries', 'orders', 'revYear', 'revMonth', 'profitYear', 'profitMonth'].map((k) => $(`[data-rx-out="${k}"]`, root));
    const chips = $$('[data-rx-preset]', root);

    /* ---------- Rollende Ziffern (Zaehlwerk) ---------- */
    const odometer = (node) => {
      let shape = null; let strips = [];
      return (str) => {
        node.dataset.value = str;
        const sh = str.replace(/\d/g, '0');
        const fresh = sh !== shape;
        if (fresh) {
          shape = sh; strips = [];
          node.textContent = '';
          Array.from(str).forEach((ch) => {
            if (/\d/.test(ch)) {
              const col = document.createElement('span'); col.className = 'rx-odo__col';
              const ghost = document.createElement('span'); ghost.className = 'rx-odo__ghost'; ghost.textContent = '0';
              const strip = document.createElement('span'); strip.className = 'rx-odo__strip';
              strip.style.transitionDelay = `${strips.length * 50}ms`;
              strip.innerHTML = '<span>0</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span><span>9</span>';
              col.append(ghost, strip); node.append(col); strips.push(strip);
            } else {
              const sep = document.createElement('span'); sep.className = 'rx-odo__sep'; sep.textContent = ch; node.append(sep);
            }
          });
          if (motion) void node.offsetWidth; // Startlage 0 festschreiben, dann rollen
        }
        let k = 0;
        Array.from(str).forEach((ch) => { if (/\d/.test(ch)) { strips[k].style.transform = `translateY(${-Number(ch) * 10}%)`; k += 1; } });
      };
    };
    const odoPay = odometer(E.odo);
    const odoRoi = E.roi ? odometer(E.roi) : () => {};
    const odoOrd = E.orders ? odometer(E.orders) : () => {};
    const zeroed = (s) => s.replace(/\d/g, '0');

    /* ---------- Werte-Motor: Ziel (T) und Anzeige (C) ---------- */
    const NP = 25; const I_INV = 25; const I_MAX = 26; const I_M = 27; const I_BAND = 33; const N = 34;
    // C Anzeige, T Ziel, S Start der laufenden Bewegung, T0 Startzeit, DUR Dauer in ms
    const C = new Float64Array(N); const T = new Float64Array(N); const S = new Float64Array(N);
    const T0 = new Float64Array(N); const DUR = new Float64Array(N);
    for (let i = 0; i < NP; i++) DUR[i] = 520 + i * 18;
    DUR[I_INV] = 560; DUR[I_MAX] = 700;
    for (let i = I_M; i < I_BAND; i++) DUR[i] = 760;
    DUR[I_BAND] = 900; // die Spanne atmet etwas langsamer nach als die Linie

    const W0 = 720; const H0 = 360; const DX = W0 / 24; const HEAD = 1.3;
    let bw = chart.clientWidth || 1; let bh = chart.clientHeight || 1; // px, danach per ResizeObserver
    let pillW = 130;
    let countK = 1; // Einzaehlen beim Auftritt
    let drawP = 1;  // Zeichenfortschritt beim Auftritt
    let late = 0;   // 0 bezahlt in 24 Monaten, 1 bis 36, 2 nicht in 36
    let pillBelow = false;
    let readMonth = -1;

    const setText = (node, s) => { if (node && node.textContent !== s) node.textContent = s; };
    const move = (node, x, y, tail = '') => { if (node) node.style.transform = `translate3d(${r2(x)}px,${r2(y)}px,0)${tail}`; };
    const yOf = (v, k) => clamp(H0 - v * k, -60, H0);

    const render = () => {
      const k = H0 / (C[I_MAX] > 0 ? C[I_MAX] : 1);
      let line = ''; let dots = ''; let hi = ''; let lo = '';
      for (let i = 0; i < NP; i++) {
        const y = r2(yOf(C[i], k));
        line += `${i ? 'L' : 'M'}${i * DX} ${y}`;
        if (i) dots += `M${i * DX} ${y}h.01`;
        // Spanne um die Linie: oben optimistisch, unten vorsichtig
        const d = C[I_BAND] * i;
        hi += `${i ? 'L' : 'M'}${i * DX} ${r2(yOf(C[i] + d, k))}`;
        lo = `L${i * DX} ${r2(yOf(C[i] - d, k))}${lo}`;
      }
      if (E.band) E.band.setAttribute('d', `${hi}${lo}Z`);
      const invY = r2(clamp(H0 - C[I_INV] * k, 0, H0));
      const area = `${line}L${W0} ${invY}L0 ${invY}Z`;
      E.line.setAttribute('d', line);
      E.glow.setAttribute('d', line);
      E.gain.setAttribute('d', area);
      E.loss.setAttribute('d', area);
      E.dots.setAttribute('d', dots);
      E.inv.setAttribute('d', `M0 ${invY}H${W0}`);
      E.clipUp.setAttribute('height', r2(invY + 40));
      E.clipDown.setAttribute('y', invY);
      E.clipDown.setAttribute('height', r2(H0 - invY + 10));

      // Schnittpunkt Gewinn / Investition auf der aktuellen (gleitenden) Linie
      let bx = W0;
      for (let i = 1; i < NP; i++) {
        if (C[i] >= C[I_INV]) {
          const a = C[i - 1]; const b = C[i];
          bx = (i - 1 + (b > a ? (C[I_INV] - a) / (b - a) : 0)) * DX;
          break;
        }
      }
      E.drop.setAttribute('d', `M${r2(bx)} ${invY}V${H0}`);

      const sx = bw / W0; const sy = bh / H0;
      const mx = bx * sx; const my = invY * sy;
      move(E.marker, mx, my);
      if (late) move(E.pill, bw, my, ' translate(-100%,calc(-100% - 14px))');
      else {
        const half = pillW / 2 + 2;
        move(E.pill, clamp(mx, half, Math.max(half, bw - half)), my, pillBelow ? ' translate(-50%,14px)' : ' translate(-50%,calc(-100% - 14px))');
      }
      const endY = yOf(C[NP - 1], k) * sy;
      const net = C[NP - 1] - C[I_INV];
      move(E.end, 0, endY, net >= 0 || endY > bh - 56 ? ' translateY(calc(-100% - 16px))' : ' translateY(16px)');
      if (drawP < 1) {
        // Stift an der Spitze der wachsenden Linie
        const xi = drawP * 24; const i0 = Math.floor(xi); const i1 = Math.min(24, i0 + 1);
        const v = C[i0] + (C[i1] - C[i0]) * (xi - i0);
        move(E.pen, drawP * bw, yOf(v, k) * sy);
      } else move(E.pen, bw, endY);

      // Ende der Linie: was nach Abzug der Investition bleibt (oder noch fehlt)
      setText(E.endVal, `${net < 0 ? '−' : '+'}${euro(Math.abs(net))}`);
      setText(E.endCap, net < 0 ? 'Nach 24 Monaten noch offen' : 'Überschuss nach 24 Monaten');
      setText(E.invVal, euro(C[I_INV]));
      const m = (i) => C[I_M + i] * countK;
      setText(outs[0], amount(m(0)));
      setText(outs[1], amount(m(1)));
      setText(outs[2], euro(m(2)));
      setText(outs[3], euro(m(3)));
      setText(outs[4], euro(m(4)));
      setText(outs[5], euro(m(5)));

      if (readMonth >= 0 && E.guide) {
        move(E.guide, readMonth * DX * sx, 0);
        setText(E.guideText, `Monat ${readMonth} · ${euro(C[readMonth])}`);
      }
    };

    // Laeuft nur, solange sich etwas bewegt
    let running = false; let dirty = false;
    const tick = () => {
      const now = performance.now();
      let busy = false;
      for (let i = 0; i < N; i++) {
        if (C[i] === T[i]) continue;
        const k = (now - T0[i]) / DUR[i];
        if (k >= 1) C[i] = T[i];
        else { C[i] = S[i] + (T[i] - S[i]) * easeOut(k); busy = true; }
        dirty = true;
      }
      if (dirty) render();
      dirty = false;
      if (!busy) { gsap.ticker.remove(tick); running = false; }
    };
    // Neues Ziel: ab der aktuellen Anzeige neu starten (umlenkbar, ohne Sprung)
    const aim = (i, v) => {
      if (T[i] === v) return;
      S[i] = C[i]; T0[i] = performance.now(); T[i] = v;
    };
    const kick = () => { if (!running) { running = true; gsap.ticker.add(tick); } };
    const requestRender = () => { if (motion) { dirty = true; kick(); } else render(); };

    /* ---------- Urteil, Medaille, Pille, Dock, Ansage ---------- */
    let curPay = E.odo.textContent.trim() || '0';
    let curRoi = E.roi ? E.roi.textContent.trim() : '0';
    let curOrd = E.orders ? E.orders.textContent.trim() : '1';
    let lastRoi = null; let rot = 0; let liveTimer = 0; let booted = false; let roiLen = 0;
    let odoLive = true; // false, solange der Auftritt die Ziffern noch auf 0 haelt

    // Amortisation in Worten: unter 2 Monaten in Wochen, ueber 36 Monaten null
    const payParts = (r) => {
      if (!(r.payback <= 36)) return null;
      if (r.payback < 2) { const w = Math.max(1, Math.round(r.payback * 52 / 12)); return { num: String(w), unit: w === 1 ? 'Woche' : 'Wochen' }; }
      return { num: fmt(r.payback, 1), unit: 'Monaten' };
    };

    // Modellergebnis im Konjunktiv: "haette sich ... selbst bezahlt"
    const verdict = (r) => {
      let pre = 'Mit deinen Annahmen hätte sich die Website nach'; let post = 'selbst bezahlt.'; let num; let unit; let say;
      const roiStr = pct(r.roi);
      const n = r.ordersToPay;
      const ordSay = `${fmt(n)} ${n === 1 ? 'Auftrag deckt' : 'Aufträge decken'} die Investition, pro Auftrag bleiben im Schnitt ${euro(r.perOrder)} Gewinn.`;
      const pp = payParts(r);
      if (pp) {
        num = pp.num; unit = pp.unit;
        say = `Mit deinen Annahmen hätte sich die Website nach ${num} ${unit} selbst bezahlt.`;
        setText(E.dockPay, `Bezahlt nach ${num} ${unit}`);
      } else {
        pre = 'Mit deinen Annahmen dauert es länger als'; num = '36'; unit = 'Monate,'; post = 'bis sie sich selbst bezahlt.';
        say = 'Mit deinen Annahmen hätte sich die Website auch nach 36 Monaten noch nicht selbst bezahlt.';
        setText(E.dockPay, 'Nach 36 Monaten nicht bezahlt');
      }
      say += ` Rendite im ersten Jahr nach Abzug der Investition: ${roiStr}. ${ordSay}`;
      setText(E.pre, pre); setText(E.post, post); setText(E.unit, unit);
      setText(E.dockRoi, roiStr);
      setText(E.ordersWord, n === 1 ? 'Auftrag deckt' : 'Aufträge decken');
      setText(E.per, euro(r.perOrder));
      // Lange Prozentzahlen werden kleiner, damit sie in der Medaille bleiben
      if (E.roi && roiStr.length !== roiLen) {
        roiLen = roiStr.length;
        E.roi.parentElement.style.setProperty('--k', String(Math.max(0.4, Math.min(1, 5 / roiLen))));
      }
      curPay = num; curRoi = roiStr; curOrd = fmt(n);
      if (odoLive) { odoPay(num); odoRoi(roiStr); odoOrd(curOrd); }
      // Medaille dreht sich mit der Rendite
      if (motion && E.ring && lastRoi !== null && r.roi !== lastRoi) {
        rot += clamp((r.roi - lastRoi) * 36, -110, 110);
        E.ring.style.transform = `rotate(${r2(rot)}deg)`;
      }
      lastRoi = r.roi;
      // Screenreader: erst ansagen, wenn die Eingabe ruht
      if (booted) {
        clearTimeout(liveTimer);
        liveTimer = setTimeout(() => setText(E.live, say), 900);
      }
    };

    const recalc = () => {
      const r = calc(vals);
      for (let i = 0; i < NP; i++) aim(i, r.profitMonth * i);
      aim(I_INV, vals.invest);
      aim(I_MAX, Math.max(r.profitMonth * 24, vals.invest) * HEAD);
      [r.inquiries, r.orders, r.revMonth * 12, r.revMonth, r.profitMonth * 12, r.profitMonth].forEach((v, i) => aim(I_M + i, v));
      aim(I_BAND, r.spread);
      late = r.payback <= 24 ? 0 : (r.payback <= 36 ? 1 : 2);
      pillBelow = r.payback > 17 && r.payback <= 24;
      chart.classList.toggle('is-late', late === 1);
      chart.classList.toggle('is-never', late === 2);
      setText(E.pillText, late === 2 ? 'Nicht in 36 Monaten bezahlt' : `Bezahlt ab Monat ${Math.max(1, Math.ceil(r.payback - 1e-9))}`);
      verdict(r);
      if (!motion || !booted) { C.set(T); render(); } else kick();
    };
    let queued = false;
    const queueRecalc = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; recalc(); });
    };

    /* ---------- Eingaben verdrahten ---------- */
    const vals = {};
    const ui = {};
    let presetTl = null;
    let activeChip = null;

    const setValue = (key, v, src) => {
      const u = ui[key];
      if (!u) return;
      vals[key] = v;
      if (src !== 'text') u.num.value = fmt(v, u.f.dec);
      if (src !== 'range') u.range.value = String(toPos(u.f, v));
      if (u.fill) u.fill.style.transform = `scaleX(${Math.round(toUnit(u.f, v) * 1e4) / 1e4})`;
      u.range.setAttribute('aria-valuetext', `${fmt(v, u.f.dec)} ${u.f.say}`);
      queueRecalc();
    };

    /* ---------- Ergebnis fuer andere Module: Event fk:rechner (siehe Kopf) ---------- */
    let shop = false; // Shop-Wortlaut aktiv (Kaufquote statt Anfragequote)
    let sent = '';
    const announce = FK.debounce(() => {
      const v = { ...vals };
      const key = JSON.stringify(v);
      if (key === sent) return; // nichts geaendert (z. B. abgebrochene Wischgeste)
      sent = key;
      const r = calc(v);
      const pp = payParts(r);
      const roiPct = Math.round(r.roi * 100);
      const q = (k) => fmt(v[k], FIELDS[k].dec);
      const summary = [
        'Meine Annahmen im Rendite-Rechner:',
        `Besucher pro Monat: ${q('visitors')}`,
        `${shop ? 'Kaufquote' : 'Anfragequote'}: ${q('inquiry')} %`,
        `Abschlussquote: ${q('close')} %`,
        `Durchschnittlicher Auftragswert: ${euro(v.value)}`,
        `Marge: ${q('margin')} %`,
        `Laufende Kosten pro Monat: ${euro(v.running)}`,
        `Investition in die Website: ${euro(v.invest)}`,
        '',
        'Ergebnis der Beispielrechnung (keine Zusage):',
        `Gewinn pro Monat nach laufenden Kosten: ${euro(r.profitMonth)}`,
        pp ? `Die Website hätte sich nach ${pp.num} ${pp.unit} selbst bezahlt.` : 'Die Website hätte sich nach 36 Monaten noch nicht selbst bezahlt.',
        `Rendite im 1. Jahr nach Abzug der Investition: ${pct(r.roi)}`,
        `Aufträge, die die Investition decken: ${fmt(r.ordersToPay)}`,
      ].join('\n').replace(/\u00a0/g, ' ');
      document.dispatchEvent(new CustomEvent('fk:rechner', {
        detail: {
          paybackText: pp ? `bezahlt nach ${pp.num} ${pp.unit}` : 'nach 36 Monaten noch nicht bezahlt',
          roiPct, ordersToPayback: r.ordersToPay,
          inputs: { visitors: v.visitors, inquiryRate: v.inquiry, closeRate: v.close, orderValue: v.value, margin: v.margin, running: v.running, invest: v.invest },
          summary,
        },
      }));
    }, 300);

    // Chip-Hervorhebung: die dunkle Kopie wird per clip-path auf den aktiven Chip gezogen
    const hlTo = (chip) => {
      const hl = E.hl; const box = E.chipbox;
      if (!hl || !box) return;
      if (!chip) { hl.classList.remove('is-on'); return; }
      const W = box.offsetWidth; const H = box.offsetHeight;
      const l = chip.offsetLeft; const t = chip.offsetTop; const w = chip.offsetWidth; const h = chip.offsetHeight;
      if (!hl.classList.contains('is-on')) {
        const cx = l + w / 2; const cy = t + h / 2;
        hl.style.transition = 'none';
        hl.style.clipPath = `inset(${cy}px ${W - cx}px ${H - cy}px ${cx}px round 999px)`;
        void hl.offsetWidth;
        hl.style.transition = '';
      }
      hl.classList.add('is-on');
      hl.style.clipPath = `inset(${t}px ${W - l - w}px ${H - t - h}px ${l}px round 999px)`;
    };

    const stopPreset = () => {
      if (presetTl) { presetTl.kill(); presetTl = null; }
      $$('.rx-field.is-moving', root).forEach((c) => {
        c.classList.remove('is-moving');
        if (!c.contains(document.activeElement)) hot(c.dataset.rxField, false);
      });
    };
    const userEdit = () => {
      stopPreset();
      if (activeChip) {
        activeChip = null;
        chips.forEach((c) => c.setAttribute('aria-pressed', 'false'));
        hlTo(null);
      }
    };

    // Beispielwerte: Regler gleiten gestaffelt auf ihre neue Stellung
    const animateTo = (target) => {
      stopPreset();
      const keys = Object.keys(target).filter((k) => ui[k] && target[k] !== vals[k]);
      if (!motion) { keys.forEach((k) => setValue(k, target[k], 'set')); announce(); return; }
      presetTl = gsap.timeline({ onComplete: () => { presetTl = null; announce(); } });
      keys.forEach((k, i) => {
        const u = ui[k]; const o = { u: toUnit(u.f, vals[k]) };
        presetTl.to(o, {
          u: toUnit(u.f, target[k]), duration: 0.95, ease: easeInOut,
          onStart: () => { u.card.classList.add('is-moving'); hot(k, true); },
          onUpdate: () => setValue(k, fromUnit(u.f, o.u), 'set'),
          onComplete: () => { setValue(k, target[k], 'set'); u.card.classList.remove('is-moving'); hot(k, false); },
        }, i * 0.06);
      });
    };

    // Formel-Begriff leuchtet, solange seine Karte aktiv ist
    const hot = (key, on) => { const t = $(`[data-rx-term="${key}"]`, root); if (t) t.classList.toggle('is-hot', on); };

    // Shop-Beispiel: Kaufquote statt Anfragequote. Gilt, bis ein anderes Beispiel
    // oder Zuruecksetzen gewaehlt wird (Beschriftung wechselt nicht unter dem Finger).
    const setShop = (on) => {
      if (on === shop) return;
      shop = on;
      $$('[data-rx-shop]', root).forEach((el) => {
        if (el.dataset.rxDef == null) el.dataset.rxDef = el.textContent;
        el.textContent = on ? el.dataset.rxShop : el.dataset.rxDef;
        if (motion && el.animate) el.animate([{ opacity: 0, filter: 'blur(3px)' }, { opacity: 1, filter: 'blur(0)' }], { duration: 320, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' });
      });
    };

    $$('[data-rx-field]', root).forEach((card) => {
      const key = card.dataset.rxField;
      const f = FIELDS[key];
      const num = $('[data-rx-num]', card);
      const range = $('[data-rx-range]', card);
      if (!f || !num || !range) return;
      const u = { card, num, range, f, fill: $('[data-rx-fill]', card) };
      ui[key] = u;
      const start = parse(num.value);
      vals[key] = start == null ? f.def : roundTo(clamp(start, f.min, f.max), f.dec);
      num.disabled = false; range.disabled = false;

      // Touch: erst eine klar waagrechte Bewegung verstellt den Regler. Tippen auf die
      // Schiene oder senkrechtes Wischen (Browser scrollt: pointercancel) aendert nichts.
      let tg = null;
      range.addEventListener('input', () => {
        if (tg && !tg.live) { tg.pending = range.value; range.value = String(toPos(f, vals[key])); return; }
        userEdit(); setValue(key, fromPos(f, parseFloat(range.value)), 'range');
      });
      range.addEventListener('change', () => { if (!tg) announce(); });
      if (f.log) {
        // Pfeiltasten springen auf den naechsten runden Wert statt auf 1/1000 der Skala
        range.addEventListener('keydown', (e) => {
          const map = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 10, PageDown: -10 };
          let n = null;
          if (e.key in map) n = stepBy(f, vals[key], map[e.key]);
          else if (e.key === 'Home') n = f.min;
          else if (e.key === 'End') n = f.max;
          if (n === null) return;
          e.preventDefault(); userEdit(); setValue(key, n, 'key'); announce();
        });
      }
      card.addEventListener('focusin', () => hot(key, true));
      card.addEventListener('focusout', () => hot(key, false));
      range.addEventListener('pointerdown', (e) => {
        card.classList.add('is-dragging'); hot(key, true);
        const touchy = e.pointerType !== 'mouse';
        const g = touchy ? { id: e.pointerId, x: e.clientX, y: e.clientY, from: vals[key], chip: activeChip, live: false, pending: null } : null;
        tg = g;
        const horiz = (x, y) => { const dx = Math.abs(x - g.x); return dx > 8 && dx > Math.abs(y - g.y) * 1.5; };
        const move = (ev) => {
          if (!g || g.live) return;
          const pt = ev.touches ? ev.touches[0] : (ev.pointerId === g.id ? ev : null);
          if (pt && horiz(pt.clientX, pt.clientY)) g.live = true;
        };
        const up = (ev) => {
          if (g && ev.pointerId !== g.id) return;
          card.classList.remove('is-dragging');
          if (!card.contains(document.activeElement)) hot(key, false);
          window.removeEventListener('pointermove', move); window.removeEventListener('touchmove', move);
          window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
          if (!g) return;
          tg = null;
          if (ev.type === 'pointercancel') {
            // Seite hat gescrollt: alten Wert und aktives Beispiel zurueck
            if (g.live && g.from !== vals[key]) setValue(key, g.from, 'set');
            else range.value = String(toPos(f, vals[key]));
            if (g.chip && activeChip !== g.chip) {
              activeChip = g.chip;
              chips.forEach((c) => c.setAttribute('aria-pressed', String(c === g.chip)));
              hlTo(g.chip);
            }
            return;
          }
          // Ohne pointermove (manche Browser): waagrechtes Loslassen zaehlt trotzdem
          if (!g.live && g.pending != null && horiz(ev.clientX, ev.clientY)) {
            userEdit(); setValue(key, fromPos(f, parseFloat(g.pending)), 'set');
          } else if (!g.live) range.value = String(toPos(f, vals[key]));
          announce();
        };
        if (g) { window.addEventListener('pointermove', move, { passive: true }); window.addEventListener('touchmove', move, { passive: true }); }
        window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
      });

      num.addEventListener('input', () => {
        const v = parse(num.value);
        if (v === null || v < f.min || v > f.max) return; // erst beim Verlassen begrenzen
        userEdit(); setValue(key, roundTo(v, f.dec), 'text');
      });
      const commit = () => {
        const v = parse(num.value);
        const next = v === null ? vals[key] : roundTo(clamp(v, f.min, f.max), f.dec);
        if (next !== vals[key]) userEdit();
        setValue(key, next, 'commit');
        announce();
      };
      num.addEventListener('change', commit);
      num.addEventListener('blur', commit);
      num.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); commit(); return; }
        if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
        e.preventDefault();
        const n = (e.key === 'ArrowUp' ? 1 : -1) * (e.shiftKey ? 10 : 1);
        userEdit(); setValue(key, stepBy(f, vals[key], n), 'commit'); announce();
      });
    });
    if (Object.keys(ui).length !== 7) return;
    const DEFAULTS = { ...vals };

    chips.forEach((chip) => chip.addEventListener('click', () => {
      const p = PRESETS[chip.dataset.rxPreset];
      if (!p) return;
      chips.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
      activeChip = chip;
      hlTo(chip);
      setShop(chip.dataset.rxPreset === SHOP);
      animateTo(p);
    }));
    E.reset?.addEventListener('click', () => { userEdit(); setShop(false); animateTo(DEFAULTS); });

    /* ---------- Groessen, Sichtbarkeit, Dock ---------- */
    ['marker', 'pill', 'pen', 'end'].forEach((k) => { if (E[k]) { E[k].style.left = ''; E[k].style.top = ''; E[k].style.transform = ''; } });
    if ('ResizeObserver' in window) {
      const ro = new ResizeObserver((entries) => {
        entries.forEach((en) => {
          const box = en.borderBoxSize && en.borderBoxSize[0];
          if (en.target === chart) { bw = en.contentRect.width || 1; bh = en.contentRect.height || 1; }
          else if (en.target === E.pillText) pillW = box ? box.inlineSize : en.target.offsetWidth;
          else if (en.target === E.chipbox && activeChip) hlTo(activeChip);
        });
        requestRender();
      });
      ro.observe(chart);
      if (E.pillText) ro.observe(E.pillText);
      if (E.chipbox) ro.observe(E.chipbox);
    } else {
      window.addEventListener('resize', FK.debounce(() => { bw = chart.clientWidth || 1; bh = chart.clientHeight || 1; requestRender(); }, 150));
    }

    if ('IntersectionObserver' in window) {
      // Puls nur im Bild
      new IntersectionObserver((entries) => entries.forEach((en) => {
        root.classList.toggle('is-visible', en.isIntersecting);
      })).observe(panel);
      // Dock, sobald das Urteil nicht mehr lesbar ist (unter der Navigation oder aus dem Bild)
      let dockIO = null; let navH = -1;
      const watchDock = () => {
        const h = Math.round(parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 68);
        if (!E.dock || h === navH) return;
        navH = h;
        dockIO?.disconnect();
        dockIO = new IntersectionObserver((entries) => entries.forEach((en) => {
          E.dock.classList.toggle('is-shown', en.intersectionRatio < 0.75);
        }), { rootMargin: `-${h + 8}px 0px 0px 0px`, threshold: [0, 0.75] });
        dockIO.observe(E.verdict || panel);
      };
      watchDock();
      window.addEventListener('resize', FK.debounce(watchDock, 200));
    }
    // Beim Tippen (Tastatur offen) macht das Dock Platz fuer das Feld
    E.fields?.addEventListener('focusin', (e) => { if (e.target.matches('[data-rx-num]')) root.classList.add('is-typing'); });
    E.fields?.addEventListener('focusout', (e) => { if (e.target.matches('[data-rx-num]')) root.classList.remove('is-typing'); });
    E.dockBtn?.addEventListener('click', () => {
      const nav = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 68;
      FK.scrollToTarget(panel, -(nav + 12));
    });

    // Monats-Ablesung im Diagramm, nur mit feinem Zeiger
    if (E.guide && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      let left = 0;
      chart.addEventListener('pointerenter', (e) => { left = chart.getBoundingClientRect().left; readMonth = -1; if (e.pointerType === 'mouse') chart.classList.add('is-reading'); });
      chart.addEventListener('pointermove', (e) => {
        if (e.pointerType !== 'mouse') return;
        const m = clamp(Math.round(((e.clientX - left) / bw) * 24), 0, 24);
        if (m === readMonth) return;
        readMonth = m;
        chart.classList.add('is-reading');
        requestRender();
      }, { passive: true });
      chart.addEventListener('pointerleave', () => { readMonth = -1; chart.classList.remove('is-reading'); });
    }

    /* ---------- Erster Stand ---------- */
    Object.keys(ui).forEach((k) => {
      const u = ui[k];
      u.num.value = fmt(vals[k], u.f.dec);
      u.range.value = String(toPos(u.f, vals[k]));
      if (u.fill) u.fill.style.transform = `scaleX(${Math.round(toUnit(u.f, vals[k]) * 1e4) / 1e4})`;
      u.range.setAttribute('aria-valuetext', `${fmt(vals[k], u.f.dec)} ${u.f.say}`);
    });
    recalc();
    booted = true;
    sent = JSON.stringify(vals); // Startwerte nicht melden

    if (!motion) return;

    /* ---------- Auftritt + Scroll-Verschiebungen (nur mit Motion) ---------- */
    const draw = { p: 1, q: 1 };
    const count = { k: 1 };
    const applyDraw = () => {
      // Kante der Wischmaske liegt genau unter dem Stift
      const edge = (k) => r2(k >= 1 ? W0 + 40 : 10 + k * W0);
      E.wipe.setAttribute('width', edge(draw.p));
      E.wipeInv.setAttribute('width', edge(draw.q));
      drawP = draw.p;
      requestRender();
    };
    const finish = () => {
      draw.p = 1; draw.q = 1; count.k = 1; countK = 1;
      applyDraw();
      odoLive = true;
      odoPay(curPay); odoRoi(curRoi); odoOrd(curOrd);
    };

    const mm = gsap.matchMedia();
    mm.add({ isDesktop: '(min-width: 900px)', isMobile: '(max-width: 899px)' }, (ctx) => {
      const { isDesktop } = ctx.conditions;
      const ghost = pick('ghost'); const art = pick('art'); const aura = pick('aura');
      const scrub = FK.isTouch ? true : 0.6;
      const across = { trigger: root, start: 'top bottom', end: 'bottom top', scrub, invalidateOnRefresh: true };

      // Geisterwort zieht quer durch den Abschnitt
      if (ghost) gsap.fromTo(ghost, { xPercent: 6 }, { xPercent: isDesktop ? -24 : -38, ease: 'none', scrollTrigger: { ...across } });
      if (isDesktop) {
        if (art) gsap.fromTo(art, { yPercent: -16, rotation: -7 }, { yPercent: 24, rotation: 6, ease: 'none', scrollTrigger: { ...across } });
        if (aura) gsap.fromTo(aura, { yPercent: -10, xPercent: -4 }, { yPercent: 12, xPercent: 4, ease: 'none', scrollTrigger: { ...across } });
      }

      // Chips
      const chipBits = $$('.rx-presets__top, .rx-presets__list:not(.rx-presets__hl) .rx-chip', root);
      if (chipBits.length) {
        gsap.from(chipBits, {
          y: 18, opacity: 0, duration: 0.9, stagger: 0.06, ease: easeOut, clearProps: 'transform,opacity',
          scrollTrigger: { trigger: E.chipbox || root, start: 'top 90%', once: true },
        });
      }

      // Formel-Tafel: Rahmen, dann Zeile fuer Zeile
      const formula = pick('formula');
      if (formula) {
        const fST = { trigger: formula, start: 'top 90%', once: true };
        gsap.from(formula, { y: 40, opacity: 0, duration: 1.1, ease: easeOut, clearProps: 'transform,opacity', scrollTrigger: fST });
        gsap.from($$('.rx-formula__cap, .rx-formula__row', formula), {
          y: 16, opacity: 0, duration: 0.9, stagger: 0.09, delay: 0.2, ease: easeOut, clearProps: 'transform,opacity', scrollTrigger: { ...fST },
        });
      }

      // Eingabekarten staffeln herein, die Reglerlinien ziehen sich auf
      // (nur opacity statt visibility: die Felder bleiben per Tastatur erreichbar)
      const cards = $$('[data-rx-field]', root);
      const tracks = $$('[data-rx-track]', root);
      const legend = $('.rechner__legend', root);
      const inST = { trigger: E.fields || root, start: 'top 86%', once: true };
      gsap.from([legend, ...cards].filter(Boolean), {
        y: 56, opacity: 0, duration: 1.1, stagger: 0.075, ease: easeOut, clearProps: 'transform,opacity', scrollTrigger: inST,
      });
      gsap.from(tracks, { scaleX: 0, duration: 1.3, stagger: 0.075, delay: 0.25, ease: easeInOut, clearProps: 'transform', scrollTrigger: { ...inST } });

      // Ergebnis-Tafel: Rahmen, Urteil, Linie zeichnet sich, Zahlen zaehlen hoch
      const headBits = $$('.rx-panel__head > *', panel);
      const verdictBits = $$('.rx-verdict__text > *, .rx-medal, .rx-panel__fine, .rx-orders', panel);
      const axisBits = $$('.rx-axis span', panel);
      const metricBits = $$('.rx-metric', panel);
      const markerIn = E.marker && E.marker.firstElementChild;
      const pillIn = E.pillText;
      const endIn = E.end && E.end.firstElementChild;

      draw.p = 0; draw.q = 0; count.k = 0; countK = 0;
      applyDraw();
      odoLive = false;
      odoPay(zeroed(curPay)); odoRoi(zeroed(curRoi)); odoOrd(zeroed(curOrd));
      gsap.set([markerIn, pillIn, endIn, E.pen].filter(Boolean), { opacity: 0 });

      const tl = gsap.timeline({ paused: true, defaults: { ease: easeOut } });
      tl.from(panel, { y: 90, opacity: 0, duration: 1.2, clearProps: 'transform,opacity' }, 0)
        .from(headBits, { y: 14, opacity: 0, duration: 0.8, stagger: 0.06, clearProps: 'transform,opacity' }, 0.25)
        .from(verdictBits, { y: 28, opacity: 0, duration: 1, stagger: 0.08, clearProps: 'transform,opacity' }, 0.32)
        .from(axisBits, { y: 8, opacity: 0, duration: 0.7, stagger: 0.05, clearProps: 'transform,opacity' }, 0.55)
        .to(draw, { q: 1, duration: 0.9, ease: easeInOut, onUpdate: applyDraw }, 0.45)
        .to(E.pen, { opacity: 1, duration: 0.3 }, 0.62)
        .to(draw, { p: 1, duration: 1.7, ease: easeInOut, onUpdate: applyDraw }, 0.62)
        .to(count, { k: 1, duration: 1.8, onUpdate: () => { countK = count.k; requestRender(); } }, 0.7)
        .from(metricBits, { y: 18, opacity: 0, duration: 0.9, stagger: 0.07, clearProps: 'transform,opacity' }, 0.72)
        .call(() => {
          odoLive = true;
          odoPay(curPay); odoRoi(curRoi); odoOrd(curOrd);
          if (E.ring) { rot += 120; E.ring.style.transform = `rotate(${rot}deg)`; }
        }, null, 0.85)
        .fromTo(markerIn, { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.8, clearProps: 'transform' }, 1.3)
        .fromTo(pillIn, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, clearProps: 'transform' }, 1.4)
        .to(endIn, { opacity: 1, duration: 0.6 }, 2.05);

      ScrollTrigger.create({ trigger: E.grid || panel, start: 'top 72%', once: true, onEnter: () => tl.play() });

      return () => {
        tl.kill();
        finish();
        gsap.set([markerIn, pillIn, endIn, E.pen].filter(Boolean), { clearProps: 'opacity,transform' });
      };
    });
  });
})();
