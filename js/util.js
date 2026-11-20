'use strict';
// Shared helpers
const Settings = {
  speed: 1,          // animation delay multiplier (0 = instant)
  sound: true,
  music: true,
  test: false,       // headless test mode (minigames simulated instantly)
};

const R = {
  int(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); },
  pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
  shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
  d6() { return R.int(1, 6); },
  chance(p) { return Math.random() < p; },
  range(a, b) { return a + Math.random() * (b - a); },
  weighted(list, wfn) {
    const total = list.reduce((s, x) => s + wfn(x), 0);
    let r = Math.random() * total;
    for (const x of list) { r -= wfn(x); if (r <= 0) return x; }
    return list[list.length - 1];
  },
};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
const sum = a => a.reduce((s, x) => s + x, 0);

function sleep(ms) {
  const t = ms * Settings.speed * 1.15; // board pacing: a touch calmer than raw timings
  if (t <= 0 && !Settings.paused) return Promise.resolve();
  // while the board is paused, timers hold still
  return new Promise(r => { const go = () => (Settings.paused ? setTimeout(go, 120) : r()); setTimeout(go, t > 0 ? t : 0); });
}

// WebAudio synth for all sound effects: UI blips, coins, character voices, item sounds, drums, thunder.
const Sfx = {
  ctx: null, bus: null, nbuf: null,
  init() {
    if (this.ctx) return;
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { this.ctx = null; return; }
    const c = this.ctx;
    // mix chain: bus -> clean lows -> soft top -> glue comp -> limiter, plus a short room reverb send
    const comp = c.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3; comp.attack.value = 0.004; comp.release.value = 0.18;
    const lim = c.createDynamicsCompressor(); lim.threshold.value = -3; lim.ratio.value = 20; lim.attack.value = 0.001; lim.release.value = 0.08;
    const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 55;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 9500;
    const air = c.createBiquadFilter(); air.type = 'highshelf'; air.frequency.value = 4000; air.gain.value = 2.5;
    this.bus = c.createGain(); this.bus.gain.value = 1.1;
    this.bus.connect(hp); hp.connect(lp); lp.connect(air); air.connect(comp); comp.connect(lim); lim.connect(c.destination);
    const rl = Math.floor(c.sampleRate * 0.9), ir = c.createBuffer(2, rl, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let k = 0; k < rl; k++) d[k] = (Math.random() * 2 - 1) * Math.pow(1 - k / rl, 3.2); }
    const rev = c.createConvolver(); rev.buffer = ir; const send = c.createGain(); send.gain.value = 0.16; const ret = c.createGain(); ret.gain.value = 0.7;
    this.bus.connect(send); send.connect(rev); rev.connect(ret); ret.connect(comp);
    const len = c.sampleRate, b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0); for (let k = 0; k < len; k++) d[k] = Math.random() * 2 - 1; this.nbuf = b;
  },
  ok() { if (!Settings.sound || Settings.test || this.suppress) return null; this.init(); const c = this.ctx; if (!c) return null; if (c.state === 'suspended') c.resume(); return c; },
  tone(freq, dur = 0.08, type = 'square', vol = 0.06, slide = 0, delay = 0) {
    const c = this.ok(); if (!c) return;
    const t = c.currentTime + delay, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.linearRampToValueAtTime(Math.max(20, freq + slide), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    // buzzy waves get a filter that tracks their pitch (rounder, less beepy); every sound sits slightly left or right
    let node = o;
    if (type === 'square' || type === 'sawtooth') { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 0.8; f.frequency.setValueAtTime(Math.min(9000, freq * 5 + 600), t); f.frequency.exponentialRampToValueAtTime(Math.min(9000, freq * 2 + 300), t + dur); o.connect(f); node = f; }
    node.connect(g);
    if (c.createStereoPanner) { const pn = c.createStereoPanner(); pn.pan.value = (Math.random() - 0.5) * 0.5; g.connect(pn); pn.connect(this.bus); } else g.connect(this.bus);
    o.start(t); o.stop(t + dur + 0.02);
  },
  noise(dur = 0.1, freq = 2000, vol = 0.08, type = 'bandpass', delay = 0, sweep = 0, q = 1) {
    const c = this.ok(); if (!c) return;
    const t = c.currentTime + delay, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.nbuf; f.type = type; f.Q.value = q; f.frequency.setValueAtTime(freq, t); if (sweep) f.frequency.exponentialRampToValueAtTime(Math.max(40, freq + sweep), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(this.bus); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  },
  _st: 0,
  step() { this._st ^= 1; this.tone(this._st ? 420 : 500, 0.07, 'triangle', 0.045, 260); this.noise(0.04, 700, 0.035, 'lowpass'); },
  // every space type has its own landing sound
  land(type) {
    const T = (f, d, ty, v, sl, at) => this.tone(f, d, ty, v, sl || 0, at || 0);
    switch (type) {
      case 'blue': [784, 988, 1175, 1568].forEach((f, i) => T(f, 0.16, 'triangle', 0.05, 0, i * 0.06)); this.coin(); break;
      case 'red': [392, 370, 349, 262].forEach((f, i) => T(f, i === 3 ? 0.5 : 0.16, 'sawtooth', 0.035, i === 3 ? -40 : 0, i * 0.15)); break;
      case 'item': case 'gift': for (let k = 0; k < 8; k++) T(1046 * Math.pow(2, k / 8), 0.12, 'sine', 0.04, 0, k * 0.035); this.noise(0.3, 6000, 0.03, 'highpass', 0.1); break;
      case 'lucky': for (let k = 0; k < 6; k++) this.noise(0.02, 2500, 0.06, 'bandpass', k * 0.06, 0, 4); T(1318, 0.3, 'triangle', 0.05, 0, 0.4); break;
      case 'bank': T(1568, 0.6, 'sine', 0.06); T(2093, 0.5, 'sine', 0.03, 0, 0.01); break;
      case 'summon': T(110, 1.2, 'sawtooth', 0.05, -30); T(117, 1.2, 'sawtooth', 0.05, -30); this.noise(1, 300, 0.06, 'lowpass', 0.1); break;
      case 'doubler': this.noise(0.05, 4000, 0.08, 'bandpass'); T(1760, 0.12, 'square', 0.04, 0, 0.06); T(2637, 0.3, 'square', 0.04, 0, 0.12); break;
      case 'chameleon': T(500, 0.6, 'sine', 0.05, 600); T(700, 0.6, 'sine', 0.04, -300, 0.1); break;
      case 'swirl': this.whoosh(true); T(300, 0.5, 'sine', 0.04, 900); break;
      case 'party': T(330, 0.35, 'sawtooth', 0.05, 330); this.crowd('cheer'); break;
      case 'shutdown': T(220, 0.8, 'triangle', 0.05, -150); this.noise(0.8, 500, 0.05, 'lowpass'); break;
      case 'gate': T(523, 0.4, 'sine', 0.04, 260); T(784, 0.4, 'sine', 0.03, 260, 0.05); break;
    }
  },
  // each clan's little turn-start motif
  turn(el) {
    const M = [[784, 988, 1175, 1568], [659, 784, 988, 784], [523, 659, 784, 1046], [392, 392, 523, 392]][el] || [523, 659, 784];
    const ty = ['triangle', 'sine', 'square', 'triangle'][el] || 'triangle';
    M.forEach((f, i) => this.tone(f, 0.14, ty, 0.045, 0, i * 0.09));
  },
  // a little audience: cheers, "ooooh"s, "awww"s and laughter
  crowd(kind = 'cheer') {
    const c = this.ok(); if (!c) return;
    if (kind === 'cheer') { this.noise(1.3, 1400, 0.09, 'bandpass', 0, 600, 0.7); for (let k = 0; k < 6; k++) this.syl(k % 4, 0.05 + k * 0.07, 'e', 1.0 + k * 0.05, 1.5, 0.3, 0.025); }
    if (kind === 'ooh') for (let k = 0; k < 5; k++) this.syl(k % 4, k * 0.03, 'o', 1.0 + k * 0.02, 1.3, 0.7, 0.03);
    if (kind === 'aww') for (let k = 0; k < 5; k++) this.syl(k % 4, k * 0.03, 'a', 1.3, 0.9, 0.8, 0.028);
    if (kind === 'laugh') for (let k = 0; k < 4; k++) this.voice(k, 'laugh');
  },
  whistle() { this.tone(2200, 0.18, 'sine', 0.07, 200); this.tone(2400, 0.35, 'sine', 0.07, -100, 0.2); },
  tick() { this.tone(1500, 0.03, 'square', 0.04); },
  bird() { const f = 2400 + Math.random() * 1600; for (let k = 0; k < 2 + Math.floor(Math.random() * 3); k++) this.tone(f + k * 120, 0.07, 'sine', 0.015, Math.random() > 0.5 ? 500 : -500, k * 0.09); },
  breeze() { this.noise(2.5, 500, 0.018, 'bandpass', 0, 400, 0.6); },
  pop() { this.tone(600, 0.06, 'sine', 0.06, 500); },
  thud() { this.tone(90, 0.18, 'sine', 0.12, -40); this.noise(0.08, 400, 0.06, 'lowpass'); },
  coin() { this.tone(988, 0.07, 'square', 0.04); this.tone(1319, 0.14, 'square', 0.04, 0, 0.06); this.tone(2637, 0.1, 'sine', 0.02, 0, 0.06); },
  bad() { this.tone(240, 0.22, 'sawtooth', 0.05, -120); this.tone(180, 0.25, 'square', 0.03, -60, 0.05); },
  star() { [784, 988, 1175, 1568, 1976].forEach((f, i) => this.tone(f, 0.16, 'triangle', 0.05, 0, i * 0.06)); this.noise(0.4, 6000, 0.02, 'highpass', 0.1); },
  click() { this.tone(760, 0.03, 'triangle', 0.04); },
  dice() { this.noise(0.03, 1800 + Math.random() * 1500, 0.06, 'bandpass', 0, 0, 3); this.tone(300 + Math.random() * 300, 0.025, 'square', 0.02); },
  boom() { this.tone(110, 0.45, 'sine', 0.14, -70); this.noise(0.5, 400, 0.14, 'lowpass', 0, -300); },
  win() { [523, 659, 784, 1046, 1318].forEach((f, i) => this.tone(f, 0.22, 'triangle', 0.06, 0, i * 0.1)); this.tone(1046, 0.6, 'sine', 0.04, 0, 0.5); },
  whoosh(up = true) { this.noise(0.35, up ? 500 : 3000, 0.07, 'bandpass', 0, up ? 3000 : -2600, 2); },
  punch() { this.tone(140, 0.12, 'sine', 0.2, -80); this.noise(0.08, 1500, 0.16, 'lowpass', 0, -1200); this.noise(0.05, 4000, 0.06, 'highpass', 0.01); },
  thunder() {
    this.noise(0.06, 5000, 0.18, 'highpass'); [0.02, 0.07, 0.13].forEach(d => this.noise(0.05, 3000, 0.1, 'bandpass', d, 0, 2));
    this.noise(1.4, 300, 0.22, 'lowpass', 0.05, -220); this.tone(55, 1.1, 'sine', 0.12, -20, 0.05);
  },
  // drum kit for rhythm games: 0 kick, 1 snare, 2 tom, 3 cymbal
  drum(k, vol = 1) {
    if (k === 0) { this.tone(150, 0.2, 'sine', 0.25 * vol, -110); this.noise(0.02, 3000, 0.05 * vol, 'highpass'); }
    if (k === 1) { this.noise(0.16, 1800, 0.16 * vol, 'bandpass', 0, -600, 0.8); this.tone(220, 0.08, 'triangle', 0.06 * vol, -60); }
    if (k === 2) { this.tone(200, 0.25, 'sine', 0.18 * vol, -90); this.tone(400, 0.06, 'triangle', 0.04 * vol, -200); }
    if (k === 3) { this.noise(0.6, 7000, 0.07 * vol, 'highpass'); this.noise(0.25, 4500, 0.04 * vol, 'bandpass', 0.01, 0, 4); }
    if (k === 4) { this.noise(0.03, 9000, 0.05 * vol, 'highpass'); }
  },

  // ---- character voices: little formant-synth "words", a different voice for every clan
  VOICE: [
    { f: 560, type: 'triangle', breath: 0.05, vib: [7, 0.03] },   // Zephi: light, airy, high
    { f: 430, type: 'sine', breath: 0.0, vib: [16, 0.06] },       // Drip: bubbly, wobbly
    { f: 300, type: 'sawtooth', breath: 0.02, vib: [5, 0.02], growl: 32 }, // Pyra: raspy, punchy
    { f: 165, type: 'square', breath: 0.01, vib: [3, 0.01] },     // Pebble: deep, gravelly
  ],
  VOW: { a: [800, 1250], o: [520, 900], e: [420, 2100], u: [340, 760], i: [300, 2600] },
  syl(el, at, v, p0, p1, dur, vol = 0.09) {
    const c = this.ok(); if (!c) return; const V = this.VOICE[el] || this.VOICE[0];
    const t = c.currentTime + at, o = c.createOscillator(), g = c.createGain();
    o.type = V.type; o.frequency.setValueAtTime(V.f * p0, t); o.frequency.exponentialRampToValueAtTime(V.f * p1, t + dur);
    const vib = c.createOscillator(), vg = c.createGain(); vib.frequency.value = V.vib[0]; vg.gain.value = V.f * V.vib[1]; vib.connect(vg); vg.connect(o.frequency); vib.start(t); vib.stop(t + dur + 0.05);
    const [f1, f2] = this.VOW[v];
    const b1 = c.createBiquadFilter(), b2 = c.createBiquadFilter(), mix = c.createGain();
    b1.type = 'bandpass'; b1.frequency.value = f1; b1.Q.value = 5; b2.type = 'bandpass'; b2.frequency.value = f2; b2.Q.value = 7;
    o.connect(b1); o.connect(b2); b1.connect(mix); b2.connect(mix); mix.gain.value = 3.2;
    let src = mix;
    if (V.growl) { const am = c.createGain(), lf = c.createOscillator(), lg = c.createGain(); lf.frequency.value = V.growl; lg.gain.value = 0.35; am.gain.value = 0.7; lf.connect(lg); lg.connect(am.gain); mix.connect(am); lf.start(t); lf.stop(t + dur + 0.05); src = am; }
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.015); g.gain.setValueAtTime(vol, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(g); g.connect(this.bus); o.start(t); o.stop(t + dur + 0.05);
    if (V.breath) this.noise(dur, 2800, V.breath, 'bandpass', at, 0, 2);
  },
  voice(el, kind) {
    if (el < 0 || el > 3) return;
    const S = (a, v, p0, p1, d, vol) => this.syl(el, a, v, p0, p1, d, vol);
    switch (kind) {
      case 'ouch': S(0, 'a', 1.5, 1.15, 0.1, 0.11); S(0.09, 'u', 1.15, 0.7, 0.18, 0.1); break;
      case 'laugh': for (let k = 0; k < 4; k++) S(k * 0.11, 'a', 1.35 - k * 0.06, 1.2 - k * 0.06, 0.08, 0.08); break;
      case 'evil': for (let k = 0; k < 4; k++) S(k * 0.15, k < 3 ? 'u' : 'a', 0.85 - k * 0.04, 0.75 - k * 0.04, 0.11, 0.1); S(0.62, 'a', 0.9, 1.3, 0.22, 0.08); break;
      case 'cheer': S(0, 'e', 1.0, 1.7, 0.22, 0.1); S(0.2, 'i', 1.7, 1.5, 0.12, 0.07); break;
      case 'shock': S(0, 'o', 1.2, 1.9, 0.2, 0.11); break;
      case 'cry': S(0, 'u', 1.4, 1.0, 0.3, 0.08); S(0.28, 'u', 1.25, 0.8, 0.42, 0.07); break;
      case 'sad': S(0, 'o', 1.05, 0.72, 0.4, 0.08); break;
      case 'angry': S(0, 'a', 0.95, 0.8, 0.2, 0.12); this.noise(0.18, 600, 0.04, 'bandpass'); break;
      case 'hmph': S(0, 'u', 0.95, 0.8, 0.11, 0.09); this.noise(0.12, 1500, 0.04, 'bandpass', 0.06); break;
      case 'smug': S(0, 'u', 1.0, 1.25, 0.14, 0.07); S(0.13, 'e', 1.25, 1.1, 0.12, 0.06); break;
      case 'love': S(0, 'o', 1.1, 1.5, 0.3, 0.08); break;
      case 'nervous': for (let k = 0; k < 3; k++) S(k * 0.09, 'e', 1.3, 1.25, 0.07, 0.05); break;
      case 'yay': S(0, 'a', 1.1, 1.6, 0.18, 0.1); break;
      case 'grunt': S(0, 'u', 1.0, 0.85, 0.09, 0.09); break;
    }
  },
  // cartoon "talking": babbled syllables timed to a speech bubble, with each clan's own attitude
  talking: 0,
  babble(el, text, mood = 'happy') {
    if (el < 0 || el > 3 || !this.ok() || this.talking >= 2) return;
    const letters = String(text).replace(/[^a-z]/gi, '');
    const cfg = [ { step: 0.075, max: 9, wob: 0.18 }, { step: 0.09, max: 9, wob: 0.22 }, { step: 0.065, max: 10, wob: 0.14 }, { step: 0.13, max: 5, wob: 0.06 } ][el];
    let n = clamp(Math.round(letters.length / 3), 2, cfg.max);
    const q = /\?\s*$/.test(text), ex = /!/.test(text);
    let mood0 = mood, lo = 1;
    if (mood === 'angry' || mood === 'grim') lo = 0.85; if (mood === 'shock' || mood === 'scared' || mood === 'nervous') lo = 1.25; if (mood === 'cry' || mood === 'sad') lo = 0.95;
    if (mood === 'laugh' || mood === 'evil') { this.voice(el, mood === 'evil' ? 'evil' : 'laugh'); n = Math.min(n, 4); }
    const vow = 'aeiouaoeia';
    this.talking++; setTimeout(() => { this.talking = Math.max(0, this.talking - 1); }, n * cfg.step * 1000 + 300);
    const off = mood === 'laugh' || mood === 'evil' ? 0.55 : 0;
    for (let k = 0; k < n; k++) {
      const ch = letters.charCodeAt(k * 3 % Math.max(1, letters.length)) || 97, v = 'aeiou'.includes(String.fromCharCode(ch).toLowerCase()) ? String.fromCharCode(ch).toLowerCase() : vow[ch % vow.length];
      const last = k === n - 1;
      let p0 = lo * (1 + (Math.sin(k * 2.3 + ch) * cfg.wob)), p1 = p0 * (last ? (q ? 1.45 : ex ? 0.82 : el === 3 ? 0.8 : 0.9) : 1.04);
      if (el === 1) p0 *= 1 + 0.12 * Math.sin(k * 1.4); // sing-song
      if (mood0 === 'cry') { p1 = p0 * 0.8; }
      const d = cfg.step * (last ? 1.9 : 0.85 + 0.3 * Math.abs(Math.sin(ch + k)));
      const at = off + k * cfg.step * 1.05;
      this.syl(el, at, v, p0, p1, d, (last && ex ? 0.12 : 0.085) * (lo < 1 ? 1.2 : 1));
      if (ch % 3 === 0) this.noise(0.018, el === 3 ? 900 : 3200, 0.03, 'bandpass', at, 0, 3); // little consonant clicks
    }
  },
  moodVoice(el, mood) {
    const m = { evil: 'evil', laugh: 'laugh', cry: 'cry', shock: 'shock', angry: 'angry', smug: 'smug', starry: 'cheer', proud: 'cheer', cheer: 'cheer', sick: 'sad', nervous: 'nervous', sad: 'sad', love: 'love', hurt: 'ouch', dizzy: 'ouch', stoic: 'hmph', grim: 'hmph', scared: 'shock' }[mood];
    if (m) this.voice(el, el === 3 && (m === 'cheer' || m === 'laugh') ? 'hmph' : m);
  },

  // ---- item sounds: every item gets its own little jingle
  item(id) {
    const T = (f, d, ty, v, sl, at) => this.tone(f, d, ty, v, sl || 0, at || 0), N = (d, f, v, ty, at, sw, q) => this.noise(d, f, v, ty, at || 0, sw || 0, q || 1);
    const rattle = () => { for (let k = 0; k < 5; k++) N(0.025, 2000 + k * 300, 0.06, 'bandpass', k * 0.045, 0, 3); };
    const sparkle = (base = 1046) => [0, 4, 7, 12, 16].forEach((n, i) => T(base * Math.pow(2, n / 12), 0.14, 'triangle', 0.045, 0, i * 0.05));
    const clank = () => { T(1800, 0.05, 'square', 0.04); T(2700, 0.3, 'sine', 0.03, -200, 0.01); N(0.08, 4000, 0.06, 'highpass'); };
    const sneak = () => [392, 0, 349, 330, 0, 294].forEach((f, i) => f && T(f, 0.07, 'triangle', 0.06, 0, i * 0.09));
    const R_ = {
      double: () => { rattle(); T(660, 0.1, 'square', 0.04, 0, 0.25); T(1320, 0.14, 'square', 0.04, 0, 0.33); },
      sdouble: () => R_.double(),
      custom: () => { rattle(); T(880, 0.4, 'sine', 0.05, 440, 0.25); }, smagic: () => R_.custom(),
      advantage: () => { rattle(); sparkle(784); },
      reverse: () => { T(900, 0.35, 'sawtooth', 0.03, -700); T(200, 0.3, 'sawtooth', 0.03, 700, 0.3); },
      cursed: () => { T(220, 0.5, 'sawtooth', 0.04, -40); T(233, 0.5, 'sawtooth', 0.04, -40); },
      supercursed: () => { [196, 208, 233].forEach((f, i) => T(f, 0.8, 'sawtooth', 0.035, -60, i * 0.08)); N(0.8, 300, 0.05, 'lowpass'); },
      snail: () => T(500, 0.9, 'triangle', 0.07, -380), ssnail: () => R_.snail(),
      ice: () => [2093, 2637, 3136, 2349].forEach((f, i) => T(f, 0.35, 'sine', 0.04, 0, i * 0.06)),
      smagnet: () => { for (let k = 0; k < 6; k++) T(180 + k * 40, 0.12, 'sawtooth', 0.03, 60, k * 0.08); },
      robin: () => { T(1200, 0.15, 'triangle', 0.05, -500); N(0.12, 3000, 0.06, 'bandpass', 0.15); },
      swap: () => { T(400, 0.2, 'square', 0.03, 400); T(800, 0.2, 'square', 0.03, -400, 0.2); },
      thief: sneak, itemthief: sneak, starthief: () => { sneak(); T(1568, 0.3, 'sine', 0.04, 0, 0.55); }, plunder: () => { sneak(); clank(); },
      warp: () => { this.whoosh(true); T(300, 0.5, 'sine', 0.05, 1200); }, shophop: () => { this.whoosh(true); sparkle(880); }, swind: () => R_.shophop(),
      smoke: () => { N(0.6, 800, 0.1, 'lowpass', 0, -500); T(150, 0.3, 'sine', 0.06, -80); }, recall: () => [523, 659, 784, 1046].forEach((f, i) => T(f, 0.25, 'sawtooth', 0.025, 0, i * 0.08)),
      armor: clank, heavy: () => { clank(); T(110, 0.3, 'square', 0.04, -30, 0.05); }, camo: () => T(800, 0.5, 'sine', 0.04, -600), bag: () => { N(0.15, 700, 0.06, 'lowpass'); clank(); }, chain: () => { for (let k = 0; k < 4; k++) clank(); },
      antidote: () => { for (let k = 0; k < 5; k++) T(600 + Math.random() * 600, 0.08, 'sine', 0.04, 200, k * 0.07); }, jailbreak: () => { clank(); T(1500, 0.2, 'triangle', 0.04, 600, 0.1); },
      ghost: () => T(400, 0.9, 'sine', 0.05, 300), unicorn: () => { for (let k = 0; k < 10; k++) T(1046 * Math.pow(2, k / 7), 0.12, 'sine', 0.035, 0, k * 0.04); },
      deposit: () => { this.coin(); T(1568, 0.15, 'square', 0.03, 0, 0.18); }, gold: () => { sparkle(1318); this.coin(); }, itembag: () => { N(0.15, 900, 0.05, 'lowpass'); sparkle(988); }, sbox: () => { N(0.15, 900, 0.05, 'lowpass'); sparkle(1175); },
      callankar: () => { T(90, 1.2, 'sawtooth', 0.05, -20); T(95, 1.2, 'sawtooth', 0.05, -20); }, leash: () => { clank(); T(120, 0.6, 'sawtooth', 0.04, 40); },
      repel: () => { T(1400, 0.5, 'sine', 0.04, -200); T(1866, 0.5, 'sine', 0.03, -200, 0.05); }, bounty: () => { T(392, 0.15, 'square', 0.04); T(523, 0.3, 'square', 0.04, 0, 0.15); },
      typhoon: () => { this.whoosh(true); this.boom(); }, washout: () => { N(1.2, 600, 0.12, 'lowpass', 0, 1200); this.boom(); }, inferno: () => { N(1.0, 1500, 0.12, 'bandpass', 0, -1000); this.boom(); }, hollow: () => { this.boom(); T(60, 1.2, 'square', 0.05, -20); },
    };
    if (R_[id]) return R_[id]();
    let h = 0; for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) % 997;
    [0, 3 + h % 4, 7, 12].forEach((n, i) => T(440 * Math.pow(2, (h % 12 + n) / 12), 0.12, i % 2 ? 'triangle' : 'square', 0.035, 0, i * 0.06));
  },
};
