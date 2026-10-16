/* Klangraum Musikschule – Modell „Takt“
   Alle Inhalte stehen im HTML; dieses Skript ergänzt Klang, Interaktion und Bewegung. */
(() => {
  'use strict';

  /* =========================================================
     Konstanten (hier anpassen)
     ========================================================= */

  // Klaviatur im Hero: weiße Tasten (Tastatur A–K) und schwarze Tasten (W E T Z U)
  const WHITE_KEYS = [
    { key: 'a', name: 'C', f: 261.63 }, { key: 's', name: 'D', f: 293.66 }, { key: 'd', name: 'E', f: 329.63 },
    { key: 'f', name: 'F', f: 349.23 }, { key: 'g', name: 'G', f: 392.0 }, { key: 'h', name: 'A', f: 440.0 },
    { key: 'j', name: 'H', f: 493.88 }, { key: 'k', name: 'C', f: 523.25 }
  ];
  const BLACK_KEYS = [ // after = Index der weißen Taste links davon
    { key: 'w', name: 'Cis', f: 277.18, after: 0 }, { key: 'e', name: 'Dis', f: 311.13, after: 1 },
    { key: 't', name: 'Fis', f: 369.99, after: 3 }, { key: 'z', alt: 'y', name: 'Gis', f: 415.3, after: 4 },
    { key: 'u', name: 'Ais', f: 466.16, after: 5 }
  ];
  const KEY_COLORS = ['#FF4F3A', '#FFC42E', '#2F5BFF'];

  // Rhythmus-Sequencer: 8 Achtel, Startmuster
  const SEQ_ROWS = [
    { id: 'kick', label: 'Bass', pattern: [1, 0, 0, 0, 1, 0, 1, 0] },
    { id: 'snare', label: 'Snare', pattern: [0, 0, 1, 0, 0, 0, 1, 0] },
    { id: 'hat', label: 'Hi-Hat', pattern: [1, 1, 1, 1, 1, 1, 1, 1] }
  ];

  // Instrumenten-Finder: Punkte je Wunsch, Alters- und Übezeit-Regeln
  const FINDER_WISH = {
    band: { gitarre: 3, schlagzeug: 3, gesang: 2, klavier: 1.5, saxofon: 1 },
    klassik: { klavier: 3, geige: 3.2, gesang: 1, gitarre: 1, saxofon: .5 },
    singen: { gesang: 4, klavier: 1.5, gitarre: 1.5 },
    rhythmus: { schlagzeug: 4, gitarre: 1, klavier: 1 },
    jazz: { saxofon: 4, klavier: 2.5, gitarre: 1, gesang: 1, schlagzeug: 1.5 },
    lieder: { gitarre: 4, klavier: 3, gesang: 2 }
  };
  const FINDER_AGE = { // Zu-/Abschläge; -99 = nicht passend
    kita: { gitarre: -1.5, saxofon: -99, schlagzeug: -.5, klavier: 1, geige: 1, gesang: .5 },
    kind: { saxofon: -.3 },
    teen: {}, adult: {}
  };
  const FINDER_EASY = ['gitarre', 'gesang', 'schlagzeug']; // schneller Einstieg bei wenig Übezeit
  const FINDER_STEEP = ['geige', 'saxofon', 'klavier'];    // lohnt sich mit mehr Übezeit
  const INSTRUMENTS = {
    klavier: { name: 'Klavier', img: 'klavier', alt: 'Hände auf einer Klaviertastatur', why: 'Sie hören Melodie und Begleitung gleichzeitig – die beste Grundlage für jede Musikrichtung.' },
    gitarre: { name: 'Gitarre', img: 'gitarre', alt: 'Frau spielt Akustikgitarre', why: 'Mit wenigen Griffen spielen Sie erste Songs und begleiten sich selbst.' },
    geige: { name: 'Geige', img: 'violine', alt: 'Geige mit Bogen auf dunklem Grund', why: 'Ein Instrument fürs Ohr: Sie lernen genau hinzuhören und spielen früh im Ensemble.' },
    schlagzeug: { name: 'Schlagzeug', img: 'sticks', alt: 'Trommelstöcke auf einer Snare-Trommel', why: 'Sie sind das Fundament jeder Band – und Fortschritte hört man sofort.' },
    gesang: { name: 'Gesang', art: 5, why: 'Ihr Instrument tragen Sie immer bei sich – Atem und Stimme wachsen mit jeder Stunde.' },
    saxofon: { name: 'Saxofon', img: 'blaeser', alt: 'Saxofone im warmen Bühnenlicht', why: 'Der Ton ist nah an der Stimme, ideal für Jazz, Soul und Big Band.' },
    musikgarten: { name: 'Musikgarten', art: 7, why: 'Singen, Bewegen, Rasseln mit Begleitperson – ganz ohne Leistungsdruck.' }
  };
  const FINDER_NAME = { 'band:gitarre': 'E-Gitarre', 'band:klavier': 'Keyboard', 'jazz:klavier': 'Jazz-Piano', 'klassik:gesang': 'Klassischer Gesang', 'band:gesang': 'Pop-Gesang', 'rhythmus:schlagzeug': 'Schlagzeug', 'kita:gesang': 'Kinderchor' };
  const AGE_TO_PLAN = { baby: 'klein', kita: 'klein', kind: 'kind', teen: 'teen', adult: 'adult' };

  // Probestunde: Lehrkräfte, Unterrichtstage (0 = So … 6 = Sa) und Zeitfenster
  const TEACHERS = [
    { id: 'af', name: 'Anouk Feld', mono: 'AF', color: '#FF4F3A', instr: ['klavier', 'musikgarten'], days: [1, 3, 6], note: 'Leitung · Klavier & Musikgarten' },
    { id: 'rz', name: 'Ruth Zimmermann', mono: 'RZ', color: '#2F5BFF', instr: ['klavier'], days: [1, 2, 4, 6], note: 'Klassik & Pop' },
    { id: 'jb', name: 'Jonas Brehm', mono: 'JB', color: '#FFC42E', instr: ['gitarre'], days: [1, 2, 4, 5, 6], note: 'Gitarre, E-Bass · Bandcoach' },
    { id: 'mk', name: 'Mirela Kovač', mono: 'MK', color: '#FFF8EC', instr: ['geige'], days: [2, 3, 5], note: 'Geige & Bratsche' },
    { id: 'ts', name: 'Tobi Schauer', mono: 'TS', color: '#FF4F3A', instr: ['schlagzeug'], days: [2, 4, 5], note: 'Schlagzeug & Cajón' },
    { id: 'lh', name: 'Lea Hartung', mono: 'LH', color: '#2F5BFF', instr: ['gesang'], days: [1, 3, 4], note: 'Pop, Musical & Chöre' },
    { id: 'do', name: 'Daniel Okafor', mono: 'DO', color: '#FFC42E', instr: ['saxofon'], days: [3, 5, 6], note: 'Saxofon & Klarinette · Jazz' },
    { id: 'hv', name: 'Hanna Vogt', mono: 'HV', color: '#FFF8EC', instr: ['musikgarten'], days: [1, 2, 5], note: 'Musikgarten & Früherziehung' }
  ];
  const SLOT_TIMES = { week: ['14:00', '14:45', '15:30', '16:15', '17:00', '17:45', '18:30', '19:15'], sat: ['9:30', '10:15', '11:00', '11:45', '12:30'] };
  const SLOT_DAYS_AHEAD = 16;  // so weit im Voraus werden Termine angeboten
  const SLOT_MAX_DAYS = 8;     // höchstens so viele Tage zur Auswahl
  const WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  const MONTHS = ['Jan.', 'Feb.', 'März', 'Apr.', 'Mai', 'Juni', 'Juli', 'Aug.', 'Sep.', 'Okt.', 'Nov.', 'Dez.'];

  /* ========================================================= */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const motionOff = root.classList.contains('motion-off');
  const reduce = motionOff || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hdrH = () => $('.hdr')?.offsetHeight || 64;
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };

  /* ---------- Audio (erst nach Nutzerinteraktion) ---------- */
  const A = {
    ctx: null, out: null, on: true, noiseBuf: null,
    get() {
      if (!this.on) return null;
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        this.ctx = new AC();
        const comp = this.ctx.createDynamicsCompressor();
        this.out = this.ctx.createGain(); this.out.gain.value = .55;
        this.out.connect(comp); comp.connect(this.ctx.destination);
        const len = this.ctx.sampleRate * .5; this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const d = this.noiseBuf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return this.ctx;
    },
    env(g, t, a, peak, dec, sustain = 0) {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(peak, t + a);
      g.gain.exponentialRampToValueAtTime(Math.max(sustain, 0.0001), t + a + dec);
    },
    // Stimmen für Klaviatur und Hörproben
    voice(type, f, t, dur = .6, dest) {
      const c = this.ctx; dest = dest || this.out;
      const g = c.createGain(); g.connect(dest);
      const osc = (wave, freq, vol = 1) => { const o = c.createOscillator(); o.type = wave; o.frequency.value = freq; if (vol === 1) { o.connect(g); } else { const v = c.createGain(); v.gain.value = vol; o.connect(v); v.connect(g); } o.start(t); o.stop(t + dur + 1.2); return o; };
      const lp = (freq) => { const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = freq; return fl; };
      const vib = (o, rate, depth, delay = .15) => { const l = c.createOscillator(); const lg = c.createGain(); l.frequency.value = rate; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(depth, t + delay + .2); l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + dur + 1.2); };
      if (type === 'piano') {
        osc('triangle', f); osc('sine', f * 2, .25); osc('sine', f * 3, .06);
        this.env(g, t, .006, .55, Math.max(dur, .9));
      } else if (type === 'guitar') {
        g.disconnect(); const fl = lp(f * 6); fl.connect(dest); g.connect(fl);
        fl.frequency.setValueAtTime(f * 9, t); fl.frequency.exponentialRampToValueAtTime(f * 1.6, t + .5);
        osc('sawtooth', f, .5); osc('triangle', f * 2, .3);
        this.env(g, t, .004, .5, 1.1);
      } else if (type === 'violin') {
        g.disconnect(); const fl = lp(2600); fl.connect(dest); g.connect(fl);
        const o = osc('sawtooth', f, .55); vib(o, 5.6, f * .012);
        g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(.32, t + .09); g.gain.setValueAtTime(.32, t + dur); g.gain.exponentialRampToValueAtTime(.0001, t + dur + .25);
      } else if (type === 'sax') {
        g.disconnect(); const fl = lp(1500); fl.Q.value = 2; fl.connect(dest); g.connect(fl);
        const o = osc('square', f, .4); osc('sawtooth', f, .2); vib(o, 5, f * .008, .25);
        g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(.34, t + .05); g.gain.setValueAtTime(.3, t + dur); g.gain.exponentialRampToValueAtTime(.0001, t + dur + .15);
      } else if (type === 'voice') {
        g.disconnect(); const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = .9; bp.connect(dest); g.connect(bp);
        const dry = c.createGain(); dry.gain.value = .6; g.connect(dry); dry.connect(dest);
        const o = osc('triangle', f); const o2 = osc('sawtooth', f, .18); vib(o, 5.2, f * .014, .2); vib(o2, 5.2, f * .014, .2);
        g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(.4, t + .08); g.gain.setValueAtTime(.36, t + dur); g.gain.exponentialRampToValueAtTime(.0001, t + dur + .3);
      } else if (type === 'bell') {
        osc('sine', f); osc('sine', f * 2.76, .3); osc('sine', f * 5.4, .1);
        this.env(g, t, .003, .45, 1.4);
      }
    },
    drum(kind, t, dest) {
      const c = this.ctx; dest = dest || this.out;
      if (kind === 'kick') {
        const o = c.createOscillator(); const g = c.createGain(); o.connect(g); g.connect(dest);
        o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + .16);
        this.env(g, t, .002, .95, .32); o.start(t); o.stop(t + .45);
      } else {
        const n = c.createBufferSource(); n.buffer = this.noiseBuf;
        const fl = c.createBiquadFilter(); const g = c.createGain();
        fl.type = kind === 'hat' ? 'highpass' : 'bandpass'; fl.frequency.value = kind === 'hat' ? 7000 : 1800;
        n.connect(fl); fl.connect(g); g.connect(dest);
        this.env(g, t, .001, kind === 'hat' ? .22 : .55, kind === 'hat' ? .05 : .16);
        n.start(t); n.stop(t + .3);
        if (kind === 'snare') { const o = c.createOscillator(); const og = c.createGain(); o.type = 'triangle'; o.frequency.value = 190; o.connect(og); og.connect(dest); this.env(og, t, .001, .3, .1); o.start(t); o.stop(t + .2); }
      }
    }
  };

  /* ---------- Etappen-Start ---------- */
  const queue = [];
  const later = fn => queue.push(fn);
  const idle = window.requestIdleCallback ? cb => requestIdleCallback(cb, { timeout: 300 }) : cb => setTimeout(() => cb({ timeRemaining: () => 16 }), 16);
  function drain() {
    idle(deadline => {
      const start = performance.now();
      while (queue.length && performance.now() - start < 20) { try { queue.shift()(); } catch (e) { console.warn(e); } }
      if (queue.length) drain();
    });
  }

  /* =========================================================
     Sofort: Header, Menü, Fortschritt, Klangpult
     ========================================================= */
  function initHeader() {
    const hdr = $('.hdr'); const bar = $('.progress span');
    let ticking = false;
    const onScroll = () => {
      if (ticking) return; ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const y = window.scrollY; hdr.classList.toggle('is-scrolled', y > 8);
        const max = document.documentElement.scrollHeight - innerHeight;
        bar.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
      });
    };
    addEventListener('scroll', onScroll, { passive: true }); onScroll();

    const btn = $('.menu-btn'); const menu = $('#menu');
    const close = (focus = true) => { if (menu.hidden) return; menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); if (focus) btn.focus(); };
    btn.addEventListener('click', () => {
      if (menu.hidden) { menu.hidden = false; btn.setAttribute('aria-expanded', 'true'); $('a', menu).focus(); }
      else close();
    });
    menu.addEventListener('click', e => { if (e.target.closest('a')) close(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    menu.addEventListener('keydown', e => {
      if (e.key !== 'Tab') return;
      const f = $$('a', menu); const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); btn.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); btn.focus(); }
    });
    matchMedia('(min-width: 900px)').addEventListener('change', e => { if (e.matches) close(false); });
  }

  // ---------- Klangpult: Klaviatur, Sequencer, Visualizer ----------
  const Vis = (() => {
    const cv = $('.vis'); if (!cv) return { hit() {}, start() {} };
    const ctx = cv.getContext('2d');
    let W = 0, H = 0, dpr = 1, raf = 0, visible = true, staff = null;
    const waves = [];
    function size() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      const r = cv.getBoundingClientRect(); W = Math.max(1, Math.round(r.width * dpr)); H = Math.max(1, Math.round(r.height * dpr));
      cv.width = W; cv.height = H;
      staff = document.createElement('canvas'); staff.width = W; staff.height = H;
      const s = staff.getContext('2d'); s.strokeStyle = 'rgba(255,248,236,.12)'; s.lineWidth = dpr;
      for (let i = 0; i < 5; i++) { const y = Math.round(H * (.22 + i * .12)) + .5; s.beginPath(); s.moveTo(0, y); s.lineTo(W, y); s.stroke(); }
      draw(performance.now());
    }
    function draw(now) {
      ctx.clearRect(0, 0, W, H); ctx.drawImage(staff, 0, 0);
      if (!waves.length) { // Ruhezustand: eine stille, dünne Welle
        ctx.strokeStyle = 'rgba(255,196,46,.45)'; ctx.lineWidth = 1.5 * dpr; ctx.beginPath();
        for (let x = 0; x <= W; x += 4 * dpr) { const y = H * .46 + Math.sin(x / W * Math.PI * 6) * H * .05 * Math.sin(Math.PI * x / W); x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
        ctx.stroke(); return;
      }
      ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
      const mid = H * .46;
      for (let i = waves.length - 1; i >= 0; i--) {
        const w = waves[i]; const age = (now - w.t0) / 1000;
        const amp = reduce ? w.a * .8 : w.a * Math.exp(-age / w.decay);
        if (!reduce && amp < .01) { waves.splice(i, 1); continue; }
        ctx.strokeStyle = w.c; ctx.lineWidth = (2 + w.a * 2.5) * dpr; ctx.globalAlpha = Math.min(1, amp * 1.4);
        ctx.beginPath();
        const k = (Math.PI * 2 / W) * w.k; const ph = reduce ? w.ph : w.ph + age * w.speed;
        for (let x = 0; x <= W; x += 3 * dpr) {
          const env = Math.sin(Math.PI * x / W);
          const y = mid + Math.sin(x * k + ph) * amp * H * .34 * env;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    }
    function loop(now) {
      raf = 0; draw(now); if (!waves.length) draw(now);
      if (waves.length && visible && !document.hidden && !reduce) raf = requestAnimationFrame(loop);
    }
    function kick() { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(loop); }
    function hit(freq, color, a = 1, decay = .9) {
      const k = 1.5 + Math.log2(freq / 220) * 3.2;
      waves.push({ c: color, a, decay, k, ph: Math.random() * 6.28, speed: 3 + k * .9, t0: performance.now() });
      if (waves.length > 14) waves.shift();
      if (reduce) { draw(performance.now()); clearTimeout(hit.t); hit.t = setTimeout(() => { waves.length = 0; draw(performance.now()); }, 700); }
      else kick();
    }
    new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) kick(); }).observe(cv);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) kick(); });
    let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(size, 150); });
    size();
    return { hit, start() { if (reduce) return; hit(330, '#FF4F3A', .8, .7); setTimeout(() => hit(440, '#FFC42E', .7, .7), 160); setTimeout(() => hit(262, '#2F5BFF', .9, .8), 320); } };
  })();

  function initPult() {
    const pult = $('#pult'); if (!pult) return;
    const keysEl = $('[data-keys]', pult); const noteEl = $('[data-note]', pult); const hintEl = $('[data-note-hint]', pult);
    const soundBtn = $('[data-sound]', pult); const soundLbl = $('[data-sound-label]', pult);
    const keyMap = new Map(); let hinted = false;

    const showNote = (name, muted) => {
      noteEl.textContent = name;
      if (!hinted) { hinted = true; hintEl.textContent = ''; }
      hintEl.textContent = muted ? 'Ton aus – nur Anzeige' : '';
    };
    const play = (k) => {
      const c = A.get();
      if (c) A.voice('piano', k.f, c.currentTime + .005, .7);
      Vis.hit(k.f, k.color, 1, .95);
      showNote(k.name, !A.on);
    };
    const mk = (k, i, black) => {
      const b = el('button', 'key' + (black ? ' key--b' : ''));
      b.type = 'button'; b.setAttribute('aria-label', `Ton ${k.name}, Taste ${k.key.toUpperCase()}`);
      k.color = KEY_COLORS[i % 3]; b.style.setProperty('--kc', k.color);
      b.append(el('span', 'nn', k.name.length > 1 ? k.name : k.name), el('kbd', null, k.key.toUpperCase()));
      if (black) b.style.left = `calc(${k.after + 1} * ((100% - 28px) / 8 + 4px) - 2px - (100% - 28px) / 8 * .31)`;
      const down = e => { e.preventDefault(); b.classList.add('is-down'); play(k); };
      const up = () => b.classList.remove('is-down');
      b.addEventListener('pointerdown', down);
      b.addEventListener('pointerup', up); b.addEventListener('pointerleave', up); b.addEventListener('pointercancel', up);
      b.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); b.classList.add('is-down'); play(k); } });
      b.addEventListener('keyup', e => { if (e.key === 'Enter' || e.key === ' ') up(); });
      keysEl.append(b); keyMap.set(k.key, { k, b }); if (k.alt) keyMap.set(k.alt, { k, b });
    };
    WHITE_KEYS.forEach((k, i) => mk(k, i, false));
    BLACK_KEYS.forEach((k, i) => mk(k, i + 1, true));

    // Tastatur A–K, solange der Hero sichtbar ist und kein Formularfeld den Fokus hat
    let inView = true;
    new IntersectionObserver(es => { inView = es[0].isIntersecting; }).observe(pult);
    const typing = t => t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
    document.addEventListener('keydown', e => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey || typing(e.target) || !inView) return;
      const m = keyMap.get(e.key.toLowerCase()); if (!m) return;
      m.b.classList.add('is-down'); play(m.k);
    });
    document.addEventListener('keyup', e => { const m = keyMap.get((e.key || '').toLowerCase()); if (m) m.b.classList.remove('is-down'); });

    soundBtn.addEventListener('click', () => {
      A.on = !A.on;
      soundBtn.setAttribute('aria-pressed', String(A.on)); soundLbl.textContent = A.on ? 'Ton an' : 'Ton aus';
      if (A.ctx) A.out.gain.setTargetAtTime(A.on ? .55 : 0, A.ctx.currentTime, .02);
      if (A.on) A.get();
    });

    // Sequencer
    const rowsEl = $('[data-steps]', pult); const stepBtns = [];
    SEQ_ROWS.forEach((r, ri) => {
      const row = el('div', `srow srow--${ri + 1}`); row.append(el('span', 'srow__l', r.label));
      const btns = r.pattern.map((on, si) => {
        const b = el('button', 'step'); b.type = 'button';
        b.setAttribute('aria-pressed', String(!!on)); b.setAttribute('aria-label', `${r.label}, Schritt ${si + 1}`);
        b.addEventListener('click', () => { const v = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', String(v)); r.pattern[si] = v ? 1 : 0; });
        row.append(b); return b;
      });
      stepBtns.push(btns); rowsEl.append(row);
    });
    const playBtn = $('[data-play]', pult); const playLbl = $('[data-play-label]', pult);
    const tempo = $('[data-tempo]', pult); const tempoOut = $('[data-tempo-out]', pult);
    let bpm = +tempo.value, playing = false, step = 0, nextT = 0, timer = 0;
    tempo.addEventListener('input', () => { bpm = +tempo.value; tempoOut.textContent = bpm; tempo.setAttribute('aria-valuetext', `${bpm} Schläge pro Minute`); });
    const VIS_DRUM = { kick: [110, '#FF4F3A', .9], snare: [300, '#2F5BFF', .7], hat: [900, '#FFC42E', .35] };
    const head = (s) => { stepBtns.forEach(row => row.forEach((b, i) => b.classList.toggle('is-head', i === s))); };
    function schedule() {
      const now = performance.now();
      while (nextT < now + 120) {
        const s = step, when = nextT;
        const c = A.get();
        SEQ_ROWS.forEach(r => {
          if (!r.pattern[s]) return;
          if (c) A.drum(r.id, c.currentTime + Math.max(0, (when - now) / 1000));
        });
        setTimeout(() => {
          if (!playing) return; head(s);
          SEQ_ROWS.forEach(r => { if (r.pattern[s]) { const v = VIS_DRUM[r.id]; Vis.hit(v[0], v[1], v[2], .35); } });
        }, Math.max(0, when - now));
        step = (step + 1) % 8; nextT += 60000 / bpm / 2;
      }
    }
    const stop = () => { playing = false; clearInterval(timer); head(-1); playBtn.setAttribute('aria-pressed', 'false'); playLbl.textContent = 'Takt starten'; };
    playBtn.addEventListener('click', () => {
      if (playing) return stop();
      A.get(); playing = true; step = 0; nextT = performance.now() + 40;
      playBtn.setAttribute('aria-pressed', 'true'); playLbl.textContent = 'Stopp';
      schedule(); timer = setInterval(schedule, 30);
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden && playing) stop(); });
  }

  /* =========================================================
     Später: Finder, Kursplan, Lehrkräfte, Buchung, Motion
     ========================================================= */
  const imgTag = (name, alt) => {
    const i = new Image(); i.decoding = 'async'; i.width = 960; i.height = 640; i.alt = alt || '';
    i.sizes = '(min-width: 900px) 34vw, 90vw';
    i.srcset = `/arena/musikschule-klangraum/assets/img/${name}-480.webp 480w, /arena/musikschule-klangraum/assets/img/${name}-960.webp 960w`;
    i.src = `/arena/musikschule-klangraum/assets/img/${name}-960.webp`; return i;
  };

  let bookSetInstr = null;

  function initFinder() {
    const f = $('[data-finder]'); if (!f) return;
    const out = { name: $('[data-res-name]'), why: $('[data-res-why]'), course: $('[data-res-course]'), alt: $('[data-res-alt]'), art: $('[data-res-art]'), book: $('[data-res-book]'), bookName: $('[data-res-book-name]'), card: $('.res__card', f) };
    const time = $('#f-time'); const timeOut = $('#f-time-out');
    let last = '', current = 'gitarre';
    const findCourse = (instr, age, wish) => {
      const pa = AGE_TO_PLAN[age];
      const pick = sel => $$(`.c${sel}`)[0];
      const li = pick(`[data-instr="${instr}"][data-age="${pa}"]`) || (wish === 'band' || wish === 'jazz' ? pick(`[data-instr="band"][data-age="${pa}"]`) : null) || pick(`[data-instr="${instr}"]`);
      if (!li) return 'Einzelunterricht – Zeit nach Absprache';
      const day = li.closest('.pday').querySelector('.pday__h').firstChild.textContent.trim().slice(0, 2);
      const t = li.querySelector('span').textContent.split(' · ')[0];
      return `${li.querySelector('b').textContent} · ${day} ${t}`;
    };
    function compute() {
      const age = f.age.value, wish = f.wish.value, mins = +time.value;
      timeOut.textContent = mins === 0 ? 'kaum Zeit' : mins >= 45 ? '45 Min.+ am Tag' : `${mins} Min. am Tag`;
      time.setAttribute('aria-valuetext', timeOut.textContent);
      let ranked;
      if (age === 'baby') ranked = ['musikgarten', 'gesang', 'klavier'];
      else {
        const sc = {};
        Object.keys(INSTRUMENTS).forEach(k => { if (k !== 'musikgarten') sc[k] = (FINDER_WISH[wish][k] || 0); });
        Object.entries(FINDER_AGE[age] || {}).forEach(([k, v]) => { if (k in sc) sc[k] += v; });
        FINDER_EASY.forEach(k => { if (mins < 15) sc[k] += 1; });
        FINDER_STEEP.forEach(k => { if (mins >= 20) sc[k] += 1; else if (mins < 10) sc[k] -= 1; });
        ranked = Object.keys(sc).filter(k => sc[k] > -50).sort((a, b) => sc[b] - sc[a]);
        if (age === 'kita') ranked.splice(2, 0, 'musikgarten');
      }
      const top = ranked[0]; current = top;
      const info = INSTRUMENTS[top];
      const name = FINDER_NAME[`${wish}:${top}`] || FINDER_NAME[`${age}:${top}`] || info.name;
      const timeTxt = age === 'baby' ? 'Üben im eigentlichen Sinn ist noch kein Thema – Singen im Alltag genügt.' : mins < 10 ? 'Auch mit wenig Übezeit kommen Sie hier gut voran.' : mins >= 30 ? `Mit ${mins >= 45 ? 'über 45' : mins} Minuten am Tag sind schnelle Fortschritte realistisch.` : `${mins} Minuten am Tag reichen für hörbare Fortschritte.`;
      const key = top + name + age;
      out.name.textContent = name;
      out.why.textContent = `${info.why} ${timeTxt}`;
      out.course.textContent = findCourse(top, age, wish);
      out.alt.textContent = ranked.slice(1, 3).map(k => INSTRUMENTS[k].name).join(', ');
      out.bookName.textContent = info.name;
      if (key !== last) {
        out.art.textContent = '';
        if (info.img) out.art.append(imgTag(info.img, info.alt));
        else { const svg = $$('.icard__art svg')[info.art === 5 ? 0 : 1]; if (svg) out.art.append(svg.cloneNode(true)); }
        if (last && !reduce) { out.card.classList.remove('is-swap'); void out.card.offsetWidth; out.card.classList.add('is-swap'); }
        last = key;
      }
    }
    f.addEventListener('input', compute); f.addEventListener('change', compute);
    f.addEventListener('submit', e => e.preventDefault());
    out.book.addEventListener('click', () => { if (bookSetInstr) bookSetInstr(current); });
    compute();
  }

  function initPlan() {
    const plan = $('[data-plan]'); if (!plan) return;
    const items = $$('.c', plan); const sels = $$('[data-f]');
    const count = $('[data-count]'); const countLbl = $('[data-count-label]'); const empty = $('[data-empty]');
    const tabs = $$('[data-daytabs] [role="tab"]'); const days = $$('.pday', plan);
    tabs.forEach(t => t.append(el('span', 'n')));
    let cur = 0;
    const select = (i, focus) => {
      cur = i;
      tabs.forEach((t, j) => { t.setAttribute('aria-selected', String(j === i)); t.tabIndex = j === i ? 0 : -1; });
      days.forEach((d, j) => d.classList.toggle('is-cur', j === i));
      if (focus) tabs[i].focus();
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(i));
      t.addEventListener('keydown', e => {
        const n = tabs.length; let j = null;
        if (e.key === 'ArrowRight') j = (i + 1) % n; else if (e.key === 'ArrowLeft') j = (i - 1 + n) % n; else if (e.key === 'Home') j = 0; else if (e.key === 'End') j = n - 1;
        if (j != null) { e.preventDefault(); select(j, true); }
      });
    });
    // Rollen nur, wenn die Tabs sichtbar sind (Handy)
    const mq = matchMedia('(max-width: 899px)');
    const roles = () => {
      days.forEach((d, i) => {
        if (mq.matches) { d.setAttribute('role', 'tabpanel'); d.setAttribute('aria-labelledby', tabs[i].id); d.removeAttribute('aria-label'); }
        else { d.removeAttribute('role'); d.removeAttribute('aria-labelledby'); d.setAttribute('aria-label', d.querySelector('.pday__h').firstChild.textContent.trim()); }
      });
    };
    mq.addEventListener('change', roles); roles();
    // aria-label wird für den Finder gebraucht (Tageskürzel)
    function apply() {
      const v = Object.fromEntries(sels.map(s => [s.dataset.f, s.value]));
      let n = 0; const per = days.map(() => 0);
      items.forEach(li => {
        const ok = (!v.instr || li.dataset.instr === v.instr) && (!v.age || li.dataset.age === v.age) && (!v.level || li.dataset.level === v.level);
        li.classList.toggle('is-off', !ok); li.setAttribute('aria-hidden', String(!ok));
        if (ok) { n++; per[days.indexOf(li.closest('.pday'))]++; }
      });
      count.textContent = n; countLbl.textContent = n === 1 ? 'Kurs' : 'Kurse';
      empty.hidden = n > 0;
      const filtered = sels.some(s => s.value);
      tabs.forEach((t, i) => { t.querySelector('.n').textContent = filtered && per[i] ? per[i] : ''; });
      if (n && !per[cur]) select(per.findIndex(x => x > 0));
    }
    sels.forEach(s => s.addEventListener('change', apply));
    $('[data-reset]').addEventListener('click', () => { sels.forEach(s => { s.value = ''; }); apply(); });
    // Heute vorauswählen (Mo–Sa)
    const wd = new Date().getDay(); select(wd >= 1 && wd <= 6 ? wd - 1 : 0);
    apply();
  }

  // Hörproben: kurze generierte Tonfolgen je Instrument (Halbtöne relativ zu A4 = 440 Hz)
  const hz = n => 440 * Math.pow(2, n / 12);
  const PHRASES = {
    klavier: { type: 'piano', bpm: 132, notes: [[-9, 0, .5], [-5, .5, .5], [-2, 1, .5], [3, 1.5, .5], [7, 2, .5], [10, 2.5, .5], [15, 3, 1.5], [-9, 3, 1.5], [-2, 3, 1.5]] },
    klavier2: { type: 'piano', bpm: 150, notes: [[3, 0, .5], [5, .5, .5], [7, 1, .5], [8, 1.5, .5], [5, 2, .5], [7, 2.5, .5], [3, 3, .5], [10, 3.5, .5], [15, 4, 1.5]] },
    gitarre: { type: 'guitar', bpm: 120, strum: [[-26, -22, -19, -14, -10, -2], [-21, -17, -14, -9, -5, -2], [-26, -22, -19, -14, -10, -2]], at: [0, 1.5, 2.5] },
    geige: { type: 'violin', bpm: 96, notes: [[0, 0, .9], [2, 1, .9], [4, 2, .5], [7, 2.5, .5], [5, 3, 1.6]] },
    schlagzeug: { drums: [['kick', 0], ['hat', 0], ['hat', .5], ['snare', 1], ['hat', 1], ['hat', 1.5], ['kick', 2], ['kick', 2.5], ['hat', 2], ['snare', 3], ['hat', 3], ['snare', 3.5], ['snare', 3.75], ['kick', 4], ['hat', 4]], bpm: 110 },
    gesang: { type: 'voice', bpm: 96, notes: [[3, 0, .9], [5, 1, .9], [7, 2, .9], [10, 3, .5], [7, 3.5, 1.4]] },
    saxofon: { type: 'sax', bpm: 140, notes: [[-9, 0, .4], [-6, .5, .4], [-4, 1, .4], [-3, 1.5, .25], [-2, 1.75, .6], [1, 2.5, .4], [-2, 3, 1.4]] },
    musikgarten: { type: 'bell', bpm: 132, notes: [[10, 0, .9], [7, 1, .9], [10, 2, .5], [7, 2.5, .5], [12, 3, .9], [10, 4, 1.2]] }
  };
  function initTeam() {
    const cards = $$('.tcard'); let active = null;
    const stopActive = () => {
      if (!active) return;
      const { bus, btn, mono, t } = active; clearTimeout(t);
      if (bus && A.ctx) { bus.gain.setTargetAtTime(0, A.ctx.currentTime, .03); setTimeout(() => bus.disconnect(), 300); }
      btn.setAttribute('aria-pressed', 'false'); btn.querySelector('.hear__l').textContent = 'Hörprobe'; mono.classList.remove('is-playing');
      active = null;
    };
    cards.forEach(card => {
      const btn = $('.hear', card); const mono = $('.mono', card);
      btn.setAttribute('aria-label', `Hörprobe ${card.dataset.voice === 'schlagzeug' ? 'Groove' : 'Tonfolge'} von ${card.dataset.teacher} abspielen`);
      btn.addEventListener('click', () => {
        const same = active && active.btn === btn; stopActive(); if (same) return;
        const p = PHRASES[card.dataset.voice]; const beat = 60 / p.bpm;
        const c = A.get(); let bus = null, dur = 0;
        if (c) { bus = c.createGain(); bus.gain.value = 1; bus.connect(A.out); }
        const t0 = c ? c.currentTime + .05 : 0;
        if (p.drums) { p.drums.forEach(([k, b]) => { if (c) A.drum(k, t0 + b * beat, bus); dur = Math.max(dur, b * beat + .4); }); }
        else if (p.strum) { p.strum.forEach((ch, i) => ch.forEach((n, j) => { if (c) A.voice(p.type, hz(n), t0 + p.at[i] * beat + j * .022, .9, bus); })); dur = (p.at[p.at.length - 1] + 2) * beat; }
        else { p.notes.forEach(([n, b, l]) => { if (c) A.voice(p.type, hz(n), t0 + b * beat, l * beat, bus); dur = Math.max(dur, (b + l) * beat + .5); }); }
        btn.setAttribute('aria-pressed', 'true'); btn.querySelector('.hear__l').textContent = A.on ? 'Spielt …' : 'Ton ist aus';
        if (!reduce) mono.classList.add('is-playing');
        active = { bus, btn, mono, t: setTimeout(stopActive, dur * 1000 + 200) };
      });
    });
  }

  function initBooking() {
    const wiz = $('[data-wiz]'); if (!wiz) return;
    const steps = $$('.wiz__step', wiz); const nav = $$('[data-steps-nav] li'); const done = $('[data-done]', wiz);
    const tPick = $('[data-teacher-pick]', wiz); const slots = $('[data-slots]', wiz);
    let cur = 1;
    const go = (n, focus = true) => {
      cur = n; done.hidden = true;
      steps.forEach(s => s.classList.toggle('is-cur', +s.dataset.step === n));
      nav.forEach((li, i) => { li.classList.toggle('is-on', i + 1 === n); li.classList.toggle('is-done', i + 1 < n); });
      $$('[data-err]', wiz).forEach(e => { e.hidden = true; });
      if (focus) $('.wiz__h', steps[n - 1]).focus({ preventScroll: true });
    };
    const val = name => (wiz.querySelector(`[name="${name}"]:checked`) || {}).value;
    function renderTeachers() {
      const instr = val('b-instr'); tPick.textContent = '';
      const list = TEACHERS.filter(t => t.instr.includes(instr));
      list.forEach((t, i) => {
        const lab = el('label'); const inp = el('input'); inp.type = 'radio'; inp.name = 'b-teacher'; inp.value = t.id; if (i === 0 && list.length === 1) inp.checked = true;
        const sp = el('span'); const m = el('span', 'tm', t.mono); m.style.background = t.color;
        const txt = el('span', 'tt'); txt.append(el('b', null, t.name), el('small', null, t.note));
        sp.append(m, txt); lab.append(inp, sp); tPick.append(lab);
        inp.addEventListener('change', renderSlots);
      });
    }
    // Termine deterministisch erzeugen (gleiche Lehrkraft + Tag = gleiche Belegung)
    function renderSlots() {
      const tid = val('b-teacher'); slots.textContent = ''; if (!tid) return;
      const t = TEACHERS.find(x => x.id === tid); const ti = TEACHERS.indexOf(t);
      const daysWrap = el('div', 'slots__days'); daysWrap.setAttribute('role', 'radiogroup'); daysWrap.setAttribute('aria-label', 'Tag');
      const timesLbl = el('p', 'slots__lbl', 'Uhrzeit'); const times = el('div', 'slots__times'); times.setAttribute('role', 'radiogroup'); times.setAttribute('aria-label', 'Uhrzeit');
      const base = new Date(); base.setHours(12, 0, 0, 0);
      let shown = 0;
      for (let d = 1; d <= SLOT_DAYS_AHEAD && shown < SLOT_MAX_DAYS; d++) {
        const day = new Date(base); day.setDate(base.getDate() + d);
        if (!t.days.includes(day.getDay())) continue;
        shown++;
        const lab = el('label'); const inp = el('input'); inp.type = 'radio'; inp.name = 'b-day';
        inp.value = `${WEEKDAYS[day.getDay()]}, ${day.getDate()}. ${MONTHS[day.getMonth()]}`;
        inp.setAttribute('aria-label', inp.value);
        const sp = el('span'); sp.append(el('small', null, WEEKDAYS[day.getDay()]), el('b', null, String(day.getDate())), el('small', null, MONTHS[day.getMonth()]));
        lab.append(inp, sp); daysWrap.append(lab);
        inp.addEventListener('change', () => {
          times.textContent = '';
          const list = day.getDay() === 6 ? SLOT_TIMES.sat : SLOT_TIMES.week;
          list.forEach((tm, k) => {
            const busy = ((day.getDate() * 7 + k * 3 + ti * 5) % 5) < 2;
            const l2 = el('label'); const i2 = el('input'); i2.type = 'radio'; i2.name = 'b-time'; i2.value = tm; i2.disabled = busy;
            const s2 = el('span', null, `${tm} Uhr`); if (busy) { s2.style.opacity = '.4'; s2.style.textDecoration = 'line-through'; i2.setAttribute('aria-label', `${tm} Uhr, belegt`); }
            l2.append(i2, s2); times.append(l2);
          });
        });
      }
      slots.append(el('p', 'slots__lbl', 'Tag'), daysWrap, timesLbl, times);
    }
    $$('[name="b-instr"]', wiz).forEach(i => i.addEventListener('change', () => { renderTeachers(); slots.textContent = ''; }));
    const check = n => {
      if (n === 1) return !!val('b-instr');
      if (n === 2) return !!val('b-teacher');
      if (n === 3) return !!val('b-day') && !!val('b-time');
      const name = wiz['b-name'], contact = wiz['b-contact'], ok = wiz['b-ok'];
      const okName = name.value.trim().length > 1, okContact = /\S+@\S+\.\S+|^[+\d][\d\s/()-]{5,}$/.test(contact.value.trim());
      name.setAttribute('aria-invalid', String(!okName)); contact.setAttribute('aria-invalid', String(!okContact));
      return okName && okContact && ok.checked;
    };
    wiz.addEventListener('click', e => {
      if (e.target.closest('[data-next]')) {
        const step = steps[cur - 1];
        if (!check(cur)) { const er = $('[data-err]', step); er.hidden = false; return; }
        go(cur + 1);
      } else if (e.target.closest('[data-back]')) go(cur - 1);
      else if (e.target.closest('[data-restart]')) { wiz.reset(); tPick.textContent = ''; slots.textContent = ''; go(1); }
    });
    wiz.addEventListener('submit', e => {
      e.preventDefault();
      if (!check(4)) { $('[data-err]', steps[3]).hidden = false; return; }
      const t = TEACHERS.find(x => x.id === val('b-teacher'));
      const rows = [['Instrument', INSTRUMENTS[val('b-instr')].name], ['Lehrkraft', t.name], ['Termin', `${val('b-day')}, ${val('b-time')} Uhr`], ['Name', wiz['b-name'].value.trim()], ['Kontakt', wiz['b-contact'].value.trim()], ['Für', wiz['b-who'].value]];
      if (wiz['b-age'].value.trim()) rows.push(['Alter', wiz['b-age'].value.trim()]);
      if (wiz['b-msg'].value.trim()) rows.push(['Hinweis', wiz['b-msg'].value.trim()]);
      const sum = $('[data-sum]', wiz); sum.textContent = '';
      rows.forEach(([k, v]) => sum.append(el('dt', null, k), el('dd', null, v)));
      steps.forEach(s => s.classList.remove('is-cur')); nav.forEach(li => { li.classList.remove('is-on'); li.classList.add('is-done'); });
      done.hidden = false; done.focus({ preventScroll: true });
    });
    bookSetInstr = instr => {
      const r = wiz.querySelector(`[name="b-instr"][value="${instr}"]`); if (!r) return;
      r.checked = true; renderTeachers(); slots.textContent = ''; go(2, false);
      setTimeout(() => $('.wiz__h', steps[1]).focus({ preventScroll: true }), 900);
    };
    go(1, false);
  }

  function initReveal() {
    if (motionOff) return;
    const groups = [
      ['.sec-head, .instr__head, .finder__box, .filters, .plan, .school__text, .adults__card, .visit__text, .map, .faq__grid > div:first-child, .final__in', 0],
      ['.tgrid .tcard', 60], ['.vgrid .vcard', 70], ['.acc details', 40], ['.ph', 160]
    ];
    const els = [];
    groups.forEach(([sel, stag]) => {
      const list = $$(sel);
      // Auf dem Handy die Wisch-Schiene als Ganzes aufdecken
      if (sel === '.tgrid .tcard' && matchMedia('(max-width: 639px)').matches) { els.push($('.tgrid')); return; }
      list.forEach((n, i) => { if (stag) n.style.setProperty('--d', `${Math.min(i, 6) * stag}ms`); els.push(n); });
    });
    els.forEach(n => n.classList.add('rv'));
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in'); io.unobserve(e.target);
      if (e.target.classList.contains('school__text')) countUp(e.target);
    }), { rootMargin: '0px 0px 4% 0px', threshold: 0 });
    els.forEach(n => io.observe(n));
    // Sicherheitsnetz: nach 2,5 s alles sichtbar, was schon passiert wurde
    setTimeout(() => els.forEach(n => { if (n.getBoundingClientRect().top < innerHeight) n.classList.add('is-in'); }), 2500);
  }
  function countUp(scope) {
    if (reduce) return;
    $$('[data-count-to]', scope).forEach(n => {
      const to = +n.dataset.countTo, t0 = performance.now(), D = 1100;
      const step = now => { const p = Math.min(1, (now - t0) / D); const e = 1 - Math.pow(1 - p, 3); n.textContent = Math.round(to * e); if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    });
  }

  function initNavSpy() {
    const links = $$('.nav a'); const map = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver(es => es.forEach(e => {
      const a = map.get(e.target.id); if (!a) return;
      if (e.isIntersecting) { links.forEach(l => l.classList.remove('is-cur')); a.classList.add('is-cur'); }
    }), { rootMargin: '-45% 0px -50% 0px' });
    map.forEach((a, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
  }

  function initMotion() {
    const hasG = window.gsap && window.ScrollTrigger;
    let lenis = null;
    if (!reduce && window.Lenis) {
      lenis = new window.Lenis({ duration: 1.1, easing: t => 1 - Math.pow(1 - t, 4) });
      window.__lenis = lenis;
      if (hasG) { lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0); }
      else { const r = t => { lenis.raf(t); requestAnimationFrame(r); }; requestAnimationFrame(r); }
    }
    // Ankerlinks weich und mit Header-Abstand
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href^="#"]'); if (!a) return;
      const id = a.getAttribute('href'); if (id.length < 2) return;
      const t = document.querySelector(id); if (!t) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(t, { offset: -hdrH() - 8, duration: 1.2 });
      else t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
      if (id === '#inhalt') t.setAttribute('tabindex', '-1');
      history.replaceState(null, '', id);
    });
    if (!hasG) return;
    gsap.registerPlugin(ScrollTrigger);
    if (reduce) return;
    const mm = gsap.matchMedia();
    // Horizontale Strecke: Sticky-Sektion + Scrub (kein Pin), nur Desktop
    mm.add('(min-width: 900px)', () => {
      const sec = $('.instr'); const rail = $('[data-rail]', sec); const track = $('[data-track]', sec);
      sec.classList.add('is-strecke');
      const dist = () => Math.max(0, track.scrollWidth - rail.clientWidth);
      const setH = () => { sec.style.height = `${innerHeight + dist()}px`; };
      setH(); ScrollTrigger.addEventListener('refreshInit', setH);
      const tw = gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: sec, start: 'top top', end: () => `+=${dist()}`, scrub: .5, invalidateOnRefresh: true } });
      return () => { ScrollTrigger.removeEventListener('refreshInit', setH); tw.scrollTrigger?.kill(); tw.kill(); sec.classList.remove('is-strecke'); sec.style.height = ''; gsap.set(track, { clearProps: 'transform' }); };
    });
    // Kleine Parallaxe der Hero-Formen
    mm.add('(min-width: 900px)', () => {
      gsap.to('.shape--sun', { yPercent: 40, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
      gsap.to('.hero__photo', { y: -40, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    });
    ScrollTrigger.refresh();
  }

  /* ---------- Start ---------- */
  initHeader();
  initPult();
  later(() => Vis.start());
  later(initFinder);
  later(initPlan);
  later(initTeam);
  later(initBooking);
  later(initNavSpy);
  later(initReveal);
  later(initMotion);
  drain();
})();
