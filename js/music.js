'use strict';
// Original background music, synthesised live with WebAudio (no audio files).
// Hip-hop / trap engine on a 16th-note grid: punchy kick, sliding 808s, claps, rolling hi-hats,
// dark bells and pads. Two loops: 'board' (laid-back, dope) and 'mini' (hype).
// Rhythm minigames duck the music so their beat stays clear.
const Music = {
  cur: null, song: null, out: null, timer: null, step: 0, nextT: 0, duck: 1, noiseBuf: null, sat: null, comp: null,

  songs: {
    // F minor, 90 bpm boom-bap/trap: Fm – Db – Ab – Eb
    board: {
      bpm: 90,
      chords: [[53, 56, 60, 63], [49, 53, 56, 60], [56, 60, 63, 67], [51, 55, 58, 62]],
      roots: [41, 37, 44, 39],
      kick: [[0, 7, 10], [0, 3, 10], [0, 7, 10, 13], [0, 6, 9, 11]],
      sub: [[0, 7, 10], [0, 3, 10], [0, 7, 10, 13], [0, 6, 9, 11, 14]],
      clap: [4, 12],
      hat: 'roll',
      bell: [
        { 0: 77, 3: 80, 6: 84, 10: 82, 12: 80 },
        { 0: 77, 3: 80, 6: 77, 8: 75, 12: 73 },
        { 0: 80, 2: 82, 4: 84, 7: 87, 10: 84, 14: 82 },
        { 0: 82, 3: 79, 6: 75, 8: 77, 11: 75, 14: 72 },
      ],
      bell2: [
        { 0: 84, 4: 84, 6: 82, 10: 80, 12: 77 },
        { 2: 80, 4: 77, 8: 73, 10: 77 },
        { 0: 87, 3: 84, 6: 80, 8: 84, 12: 87, 14: 89 },
        { 0: 87, 4: 86, 8: 82, 10: 79, 12: 75 },
      ],
      bellType: 'bell', bellVol: 0.045, padVol: 0.022, subVol: 0.32, kickVol: 0.5, clapVol: 0.13, hatVol: 0.03,
    },
    // G minor, 145 bpm hype trap: Gm – Eb – Bb – F
    mini: {
      bpm: 145, half: true,
      chords: [[55, 58, 62], [51, 55, 58], [58, 62, 65], [53, 57, 60]],
      roots: [43, 39, 46, 41],
      kick: [[0, 3, 8, 11], [0, 6, 8, 14], [0, 3, 8, 11], [0, 4, 7, 10, 12, 14]],
      sub: [[0, 3, 8, 11], [0, 6, 8, 14], [0, 3, 8, 11], [0, 4, 7, 10, 12, 14]],
      clap: [8],
      hat: 'trap',
      bell: [
        { 0: 79, 2: 79, 4: 82, 6: 79, 8: 86, 11: 84, 14: 82 },
        { 0: 79, 2: 79, 4: 82, 6: 79, 8: 75, 12: 74 },
        { 0: 82, 2: 82, 4: 86, 6: 82, 8: 89, 11: 87, 14: 86 },
        { 0: 84, 3: 86, 6: 84, 8: 81, 12: 77, 14: 79 },
      ],
      bell2: [
        { 0: 91, 3: 89, 6: 86, 8: 91, 12: 94 },
        { 0: 87, 3: 86, 6: 82, 8: 79, 12: 82 },
        { 0: 89, 3: 91, 6: 94, 8: 89, 12: 86 },
        { 0: 89, 4: 88, 8: 86, 12: 84, 14: 86 },
      ],
      bellType: 'lead', bellVol: 0.03, padVol: 0.02, subVol: 0.3, kickVol: 0.55, clapVol: 0.15, hatVol: 0.032, stab: true,
    },
  },

  ctx() { Sfx.init(); return Sfx.ctx; },
  setup(c) {
    if (this.out) return;
    this.out = c.createGain(); this.out.gain.value = 0.0001;
    this.comp = c.createDynamicsCompressor(); this.comp.threshold.value = -14; this.comp.ratio.value = 4; this.comp.attack.value = 0.005; this.comp.release.value = 0.15;
    this.out.connect(this.comp); this.comp.connect(c.destination);
    const len = c.sampleRate * 0.5, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (let k = 0; k < len; k++) d[k] = Math.random() * 2 - 1;
    this.noiseBuf = buf;
    // gentle saturation for the 808
    this.sat = c.createWaveShaper(); const cv = new Float32Array(1024); for (let k = 0; k < 1024; k++) { const x = k / 512 - 1; cv[k] = Math.tanh(x * 2.2); } this.sat.curve = cv; this.sat.connect(this.out);
  },
  level() { return (Settings.music ? 0.85 : 0) * this.duck; },
  play(name) {
    if (Settings.test) return;
    if (this.cur === name && this.timer) return;
    this.stop();
    this.cur = name;
    if (!name) return;
    const c = this.ctx(); if (!c) return;
    this.setup(c);
    if (c.state === 'suspended') c.resume();
    this.song = this.songs[name]; this.step = 0; this.nextT = c.currentTime + 0.12;
    this.fade(this.level(), 1.2);
    this.timer = setInterval(() => this.tick(), 25);
  },
  stop() { if (this.timer) clearInterval(this.timer); this.timer = null; if (this.out) this.fade(0, 0.3); },
  fade(v, secs) { const c = Sfx.ctx; if (!c || !this.out) return; const g = this.out.gain; g.cancelScheduledValues(c.currentTime); g.setValueAtTime(Math.max(0.0001, g.value), c.currentTime); g.linearRampToValueAtTime(Math.max(0.0001, v), c.currentTime + secs); },
  setDuck(d, secs = 0.6) { this.duck = d; this.fade(this.level(), secs); },
  refresh() { if (!Settings.music) this.fade(0, 0.3); else if (this.cur && !this.timer) { const n = this.cur; this.cur = null; this.play(n); } else this.fade(this.level(), 0.4); },

  tick() {
    const c = Sfx.ctx; if (!c || !this.song) return;
    const e = 60 / this.song.bpm / (this.song.half ? 2 : 4); // one 16th (half-time feel for the hype loop)
    while (this.nextT < c.currentTime + 0.2) {
      this.schedule(this.step, this.nextT, e);
      this.nextT += e; this.step++;
    }
  },
  schedule(step, t, e) {
    const S = this.song, bars = S.chords.length;
    const bar = Math.floor(step / 16) % bars, i = step % 16, loop = Math.floor(step / (16 * bars));
    const ch = S.chords[bar], root = S.roots[bar];
    const intro = loop === 0 && bar < 2;
    // drums
    if (!intro || bar === 1) { if (S.kick[bar].includes(i)) this.kick(t, S.kickVol); }
    if (S.clap.includes(i) && !(intro && bar === 0)) this.clap(t, S.clapVol);
    if (S.hat === 'roll') {
      if (i % 2 === 0) this.hat(t, S.hatVol * (i % 4 ? 0.7 : 1));
      if (bar === 3 && i >= 12) { this.hat(t, S.hatVol * 0.6); this.hat(t + e / 2, S.hatVol * 0.5); }
      if (i === 14 && bar % 2) this.hat(t, S.hatVol * 1.4, 0.18);
    } else {
      // trap hats: steady 8ths with triplet and 32nd rolls
      const roll = (bar === 1 && i >= 12) || (bar === 3 && i >= 8 && i < 12);
      if (roll) { for (let k = 0; k < 3; k++) this.hat(t + k * e / 3, S.hatVol * (0.6 + k * 0.15)); }
      else if (bar === 3 && i >= 14) { for (let k = 0; k < 4; k++) this.hat(t + k * e / 4, S.hatVol * 0.7); }
      else this.hat(t, S.hatVol * (i % 2 ? 0.6 : 1));
      if (i === 6 || i === 14) this.hat(t, S.hatVol * 1.2, 0.16);
    }
    // 808: follows the kick, glides into the next root
    if (S.sub[bar].includes(i)) {
      const nextHit = S.sub[bar].find(x => x > i); const len = ((nextHit !== undefined ? nextHit : 16) - i) * e;
      const slide = i === 14 || (i >= 10 && bar === 3) ? S.roots[(bar + 1) % bars] - root : 0;
      this.sub808(root + (i === 10 && bar === 2 ? 7 : 0), t, Math.min(len, 0.9), S.subVol * (intro ? 0.0001 : 1), slide);
    }
    // pad: long soft chords at the top of each bar
    if (i === 0) ch.forEach((k, j) => this.pad(k, t, e * 15, S.padVol, j));
    // stabs for the hype loop
    if (S.stab && (i === 0 || i === 3) && !intro) ch.forEach(k => this.stab(k + 12, t, e * 1.2, 0.022));
    // bells / lead
    const mel = (loop % 2 ? S.bell2 : S.bell)[bar];
    const n = mel[i];
    if (n && !(intro && bar === 0 && i > 8)) {
      let len = 1; while (i + len < 16 && mel[i + len] === undefined && len < 4) len++;
      if (S.bellType === 'bell') this.bell(n, t, Math.max(0.5, e * len * 1.6), S.bellVol);
      else this.lead(n, t, e * len * 0.95, S.bellVol);
    }
  },

  // ---- instruments
  osc(type, f, t) { const o = Sfx.ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); return o; },
  hz(m) { return 440 * Math.pow(2, (m - 69) / 12); },
  env(g, t, a, peak, dur, sus = 0.0001) { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(Math.max(0.0001, sus), t + dur); },
  kick(t, vol = 0.5) {
    const c = Sfx.ctx, o = this.osc('sine', 160, t), g = c.createGain();
    o.frequency.exponentialRampToValueAtTime(42, t + 0.09);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    o.connect(g); g.connect(this.out); o.start(t); o.stop(t + 0.24);
    this.noise(t, 0.012, vol * 0.25, 3000, 'highpass'); // beater click
  },
  sub808(m, t, dur, vol, slide = 0) {
    const c = Sfx.ctx, f = this.hz(m), o = this.osc('sine', f * 1.5, t), g = c.createGain();
    o.frequency.exponentialRampToValueAtTime(f, t + 0.04);
    if (slide) o.frequency.exponentialRampToValueAtTime(this.hz(m + slide), t + dur * 0.95);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.setValueAtTime(vol, t + dur * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.sat); o.start(t); o.stop(t + dur + 0.02);
  },
  noise(t, dur, vol, freq, type, q = 1) {
    const c = Sfx.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noiseBuf; f.type = type; f.frequency.value = freq; f.Q.value = q;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(this.out); s.start(t, Math.random() * 0.3); s.stop(t + dur + 0.02);
  },
  clap(t, vol = 0.13) {
    for (let k = 0; k < 3; k++) this.noise(t + k * 0.011, 0.02, vol * 0.8, 1300, 'bandpass', 1.4);
    this.noise(t + 0.033, 0.16, vol, 1100, 'bandpass', 1.1);
  },
  snare(t, vol = 0.07) { this.clap(t, vol); },
  hat(t, vol = 0.03, open = 0) { this.noise(t, open || 0.035, vol, 8500, 'highpass'); },
  pad(m, t, dur, vol, j) {
    const c = Sfx.ctx, o = this.osc('sawtooth', this.hz(m), t), f = c.createBiquadFilter(), g = c.createGain();
    o.detune.value = (j % 2 ? 7 : -7); f.type = 'lowpass'; f.frequency.setValueAtTime(700, t); f.frequency.linearRampToValueAtTime(1100, t + dur * 0.5);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.25); g.gain.setValueAtTime(vol, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f); f.connect(g); g.connect(this.out); o.start(t); o.stop(t + dur + 0.05);
  },
  bell(m, t, dur, vol) {
    const c = Sfx.ctx;
    [[1, 1], [2.01, 0.35], [3.98, 0.12]].forEach(([r, a]) => {
      const o = this.osc('sine', this.hz(m) * r, t), g = c.createGain();
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol * a, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + dur * (r > 1 ? 0.5 : 1));
      o.connect(g); g.connect(this.out); o.start(t); o.stop(t + dur + 0.02);
    });
  },
  lead(m, t, dur, vol) {
    const c = Sfx.ctx, f = c.createBiquadFilter(), g = c.createGain();
    f.type = 'lowpass'; f.frequency.setValueAtTime(2600, t); f.frequency.exponentialRampToValueAtTime(900, t + dur);
    [-9, 9].forEach(dt => { const o = this.osc('sawtooth', this.hz(m), t); o.detune.value = dt; const vib = c.createOscillator(), vg = c.createGain(); vib.frequency.value = 6; vg.gain.value = 6; vib.connect(vg); vg.connect(o.detune); vib.start(t); vib.stop(t + dur + 0.05); o.connect(f); o.start(t); o.stop(t + dur + 0.05); });
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.setValueAtTime(vol, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    f.connect(g); g.connect(this.out);
  },
  stab(m, t, dur, vol) {
    const c = Sfx.ctx, o = this.osc('square', this.hz(m), t), f = c.createBiquadFilter(), g = c.createGain();
    f.type = 'lowpass'; f.frequency.setValueAtTime(3000, t); f.frequency.exponentialRampToValueAtTime(400, t + dur);
    this.env(g, t, 0.005, vol, dur);
    o.connect(f); f.connect(g); g.connect(this.out); o.start(t); o.stop(t + dur + 0.02);
  },
};
