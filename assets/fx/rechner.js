/* fx/rechner — Rendite-Rechner
   Regler + Zahlenfeld je Annahme, Rechnung live, Diagramm ueber 24 Monate.
   Jeder Wert gleitet mit --ease-out auf sein Ziel und laesst sich jederzeit
   umlenken (wie gsap.quickTo). Spaetere Monatspunkte brauchen etwas laenger:
   die Linie biegt sich kurz und legt sich wieder gerade. Ohne Motion sofort. */
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
    const euro = (v) => `${fmt(v, Math.abs(v) < 1000 ? 2 : 0)} €`;
    const euro0 = (v) => `${fmt(v, 0)} €`;
    const amount = (v) => fmt(v, v < 100 ? 1 : 0);
    const times = (v) => `×${fmt(v, v < 10 ? 2 : (v < 100 ? 1 : 0))}`;
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
      invest: { min: 500, max: 30000, log: true, dec: 0, say: 'Euro', def: 3000 },
    };
    // Beispielwerte (ohne Investition: die bleibt deine)
    const PRESETS = {
      handwerk: { visitors: 300, inquiry: 1.5, close: 30, value: 3500, margin: 20 },
      beratung: { visitors: 600, inquiry: 1, close: 20, value: 1500, margin: 60 },
      shop: { visitors: 4000, inquiry: 2, close: 50, value: 60, margin: 25 },
    };
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

    const calc = (v) => {
      const inquiries = v.visitors * v.inquiry / 100;
      const orders = inquiries * v.close / 100;
      const revMonth = orders * v.value;
      const profitMonth = revMonth * v.margin / 100;
      const payback = profitMonth > 0 ? v.invest / profitMonth : Infinity;
      const roi = profitMonth * 12 / v.invest;
      return { inquiries, orders, revMonth, profitMonth, payback, roi };
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
    const zeroed = (s) => s.replace(/\d/g, '0');

    /* ---------- Werte-Motor: Ziel (T) und Anzeige (C) ---------- */
    const NP = 25; const I_INV = 25; const I_MAX = 26; const I_M = 27; const N = 33;
    // C Anzeige, T Ziel, S Start der laufenden Bewegung, T0 Startzeit, DUR Dauer in ms
    const C = new Float64Array(N); const T = new Float64Array(N); const S = new Float64Array(N);
    const T0 = new Float64Array(N); const DUR = new Float64Array(N);
    for (let i = 0; i < NP; i++) DUR[i] = 520 + i * 18;
    DUR[I_INV] = 560; DUR[I_MAX] = 700;
    for (let i = I_M; i < N; i++) DUR[i] = 760;

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
      let line = ''; let dots = '';
      for (let i = 0; i < NP; i++) {
        const y = r2(yOf(C[i], k));
        line += `${i ? 'L' : 'M'}${i * DX} ${y}`;
        if (i) dots += `M${i * DX} ${y}h.01`;
      }
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
      move(E.end, 0, endY, C[NP - 1] >= C[I_INV] ? ' translateY(calc(-100% - 16px))' : ' translateY(16px)');
      if (drawP < 1) {
        // Stift an der Spitze der wachsenden Linie
        const xi = drawP * 24; const i0 = Math.floor(xi); const i1 = Math.min(24, i0 + 1);
        const v = C[i0] + (C[i1] - C[i0]) * (xi - i0);
        move(E.pen, drawP * bw, yOf(v, k) * sy);
      } else move(E.pen, bw, endY);

      setText(E.endVal, euro0(C[NP - 1]));
      setText(E.invVal, euro0(C[I_INV]));
      const m = (i) => C[I_M + i] * countK;
      setText(outs[0], amount(m(0)));
      setText(outs[1], amount(m(1)));
      setText(outs[2], euro(m(2)));
      setText(outs[3], euro(m(3)));
      setText(outs[4], euro(m(4)));
      setText(outs[5], euro(m(5)));

      if (readMonth >= 0 && E.guide) {
        move(E.guide, readMonth * DX * sx, 0);
        setText(E.guideText, `Monat ${readMonth} · ${euro0(C[readMonth])}`);
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
    let curRoi = E.roi ? E.roi.textContent.trim() : '×0';
    let lastRoi = null; let rot = 0; let liveTimer = 0; let booted = false;
    let odoLive = true; // false, solange der Auftritt die Ziffern noch auf 0 haelt

    const verdict = (r) => {
      let pre = 'Die Website hat sich nach'; let post = 'bezahlt.'; let num; let unit; let say;
      const roiStr = times(r.roi);
      if (r.payback <= 36) {
        if (r.payback < 2) {
          const w = Math.max(1, Math.round(r.payback * 52 / 12));
          num = String(w); unit = w === 1 ? 'Woche' : 'Wochen';
        } else { num = fmt(r.payback, 1); unit = 'Monaten'; }
        say = `Die Website hat sich nach ${num} ${unit} bezahlt, Rendite im ersten Jahr ${roiStr}.`;
        setText(E.dockPay, `Bezahlt nach ${num} ${unit}`);
      } else {
        pre = 'Mit diesen Werten braucht sie länger als'; num = '36'; unit = 'Monate,'; post = 'bis sie sich bezahlt hat.';
        say = `Mit diesen Werten hat sich die Website nach 36 Monaten noch nicht bezahlt, Rendite im ersten Jahr ${roiStr}.`;
        setText(E.dockPay, 'Nicht in 36 Monaten bezahlt');
      }
      setText(E.pre, pre); setText(E.post, post); setText(E.unit, unit);
      setText(E.dockRoi, roiStr);
      curPay = num; curRoi = roiStr;
      if (odoLive) { odoPay(num); odoRoi(roiStr); }
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
      if (!motion) { keys.forEach((k) => setValue(k, target[k], 'set')); return; }
      presetTl = gsap.timeline({ onComplete: () => { presetTl = null; } });
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

      range.addEventListener('input', () => { userEdit(); setValue(key, fromPos(f, parseFloat(range.value)), 'range'); });
      if (f.log) {
        // Pfeiltasten springen auf den naechsten runden Wert statt auf 1/1000 der Skala
        range.addEventListener('keydown', (e) => {
          const map = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 10, PageDown: -10 };
          let n = null;
          if (e.key in map) n = stepBy(f, vals[key], map[e.key]);
          else if (e.key === 'Home') n = f.min;
          else if (e.key === 'End') n = f.max;
          if (n === null) return;
          e.preventDefault(); userEdit(); setValue(key, n, 'key');
        });
      }
      card.addEventListener('focusin', () => hot(key, true));
      card.addEventListener('focusout', () => hot(key, false));
      range.addEventListener('pointerdown', () => {
        card.classList.add('is-dragging'); hot(key, true);
        const up = () => {
          card.classList.remove('is-dragging');
          if (!card.contains(document.activeElement)) hot(key, false);
          window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
        };
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
      };
      num.addEventListener('change', commit);
      num.addEventListener('blur', commit);
      num.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); commit(); return; }
        if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
        e.preventDefault();
        const n = (e.key === 'ArrowUp' ? 1 : -1) * (e.shiftKey ? 10 : 1);
        userEdit(); setValue(key, stepBy(f, vals[key], n), 'commit');
      });
    });
    if (Object.keys(ui).length !== 6) return;
    const DEFAULTS = { ...vals };

    chips.forEach((chip) => chip.addEventListener('click', () => {
      const p = PRESETS[chip.dataset.rxPreset];
      if (!p) return;
      chips.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
      activeChip = chip;
      hlTo(chip);
      animateTo(p);
    }));
    E.reset?.addEventListener('click', () => { userEdit(); animateTo(DEFAULTS); });

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
      // Puls nur im Bild; Dock nur, wenn die Tafel nicht zu sehen ist
      new IntersectionObserver((entries) => entries.forEach((en) => {
        root.classList.toggle('is-visible', en.isIntersecting);
        E.dock?.classList.toggle('is-shown', !en.isIntersecting);
      })).observe(panel);
    }
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
      odoPay(curPay); odoRoi(curRoi);
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
        gsap.from(formula, { y: 40, autoAlpha: 0, duration: 1.1, ease: easeOut, clearProps: 'transform,opacity,visibility', scrollTrigger: fST });
        gsap.from($$('.rx-formula__cap, .rx-formula__row', formula), {
          y: 16, autoAlpha: 0, duration: 0.9, stagger: 0.09, delay: 0.2, ease: easeOut, clearProps: 'transform,opacity,visibility', scrollTrigger: { ...fST },
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
      const verdictBits = $$('.rx-verdict__text > *, .rx-medal', panel);
      const axisBits = $$('.rx-axis span', panel);
      const metricBits = $$('.rx-metric', panel);
      const markerIn = E.marker && E.marker.firstElementChild;
      const pillIn = E.pillText;
      const endIn = E.end && E.end.firstElementChild;

      draw.p = 0; draw.q = 0; count.k = 0; countK = 0;
      applyDraw();
      odoLive = false;
      odoPay(zeroed(curPay)); odoRoi(zeroed(curRoi));
      gsap.set([markerIn, pillIn, endIn, E.pen].filter(Boolean), { autoAlpha: 0 });

      const tl = gsap.timeline({ paused: true, defaults: { ease: easeOut } });
      tl.from(panel, { y: 90, autoAlpha: 0, duration: 1.2, clearProps: 'transform,opacity,visibility' }, 0)
        .from(headBits, { y: 14, autoAlpha: 0, duration: 0.8, stagger: 0.06, clearProps: 'transform,opacity,visibility' }, 0.25)
        .from(verdictBits, { y: 28, autoAlpha: 0, duration: 1, stagger: 0.08, clearProps: 'transform,opacity,visibility' }, 0.32)
        .from(axisBits, { y: 8, autoAlpha: 0, duration: 0.7, stagger: 0.05, clearProps: 'transform,opacity,visibility' }, 0.55)
        .to(draw, { q: 1, duration: 0.9, ease: easeInOut, onUpdate: applyDraw }, 0.45)
        .to(E.pen, { autoAlpha: 1, duration: 0.3 }, 0.62)
        .to(draw, { p: 1, duration: 1.7, ease: easeInOut, onUpdate: applyDraw }, 0.62)
        .to(count, { k: 1, duration: 1.8, onUpdate: () => { countK = count.k; requestRender(); } }, 0.7)
        .from(metricBits, { y: 18, autoAlpha: 0, duration: 0.9, stagger: 0.07, clearProps: 'transform,opacity,visibility' }, 0.72)
        .call(() => {
          odoLive = true;
          odoPay(curPay); odoRoi(curRoi);
          if (E.ring) { rot += 120; E.ring.style.transform = `rotate(${rot}deg)`; }
        }, null, 0.85)
        .fromTo(markerIn, { scale: 0.4, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.8, clearProps: 'transform' }, 1.3)
        .fromTo(pillIn, { y: 10, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7, clearProps: 'transform' }, 1.4)
        .to(endIn, { autoAlpha: 1, duration: 0.6 }, 2.05);

      ScrollTrigger.create({ trigger: E.grid || panel, start: 'top 72%', once: true, onEnter: () => tl.play() });

      return () => {
        tl.kill();
        finish();
        gsap.set([markerIn, pillIn, endIn, E.pen].filter(Boolean), { clearProps: 'opacity,visibility,transform' });
      };
    });
  });
})();
