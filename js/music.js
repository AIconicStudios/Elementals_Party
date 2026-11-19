'use strict';
// Original background music, synthesised live with WebAudio (no audio files needed).
// Two looping themes: 'board' (cheerful, bouncy) and 'mini' (fast, energetic).
// Rhythm minigames silence the music so their beat stays clear.
const Music = {
  cur: null, song: null, out: null, timer: null, step: 0, nextT: 0, duck: 1, noiseBuf: null,

  songs: {
    // C major, bouncy. 8 bars of eighth notes per loop. 0 = rest.
    board: {
      bpm: 116, swing: 0.12,
      chords: [[48, 52, 55], [45, 48, 52], [41, 45, 48], [43, 47, 50], [48, 52, 55], [45, 48, 52], [50, 53, 57], [43, 47, 50]],
      mel: [
        [76, 79, 84, 79, 76, 74, 72, 74], [76, 0, 81, 79, 76, 0, 72, 0], [77, 81, 84, 81, 77, 76, 77, 79], [79, 0, 83, 86, 83, 81, 79, 0],
        [84, 83, 84, 79, 76, 79, 84, 88], [86, 84, 81, 0, 84, 0, 81, 76], [77, 81, 86, 84, 81, 77, 74, 77], [79, 83, 86, 91, 89, 86, 83, 79],
      ],
      // second pass: a softer answering line an octave down
      mel2: [
        [64, 0, 67, 0, 72, 0, 67, 0], [69, 0, 72, 0, 76, 0, 72, 0], [65, 0, 69, 0, 72, 0, 69, 0], [67, 0, 71, 0, 74, 72, 71, 0],
        [72, 0, 76, 79, 76, 0, 72, 0], [69, 72, 76, 0, 72, 0, 69, 0], [74, 0, 77, 0, 81, 79, 77, 0], [79, 0, 77, 0, 74, 0, 71, 0],
      ],
      lead: 'square', leadVol: 0.05, bassVol: 0.11, padVol: 0.035, drums: 'bouncy',
    },
    // A minor, driving.
    mini: {
      bpm: 140, swing: 0,
      chords: [[45, 48, 52], [41, 45, 48], [48, 52, 55], [43, 47, 50], [50, 53, 57], [41, 45, 48], [40, 44, 47], [40, 44, 47]],
      mel: [
        [69, 72, 76, 81, 79, 76, 72, 76], [77, 0, 81, 0, 84, 81, 77, 0], [76, 79, 84, 0, 83, 79, 76, 79], [74, 0, 79, 83, 86, 0, 83, 0],
        [74, 77, 81, 86, 84, 81, 77, 81], [84, 0, 81, 0, 77, 81, 84, 89], [76, 80, 83, 88, 86, 83, 80, 83], [88, 0, 0, 0, 76, 0, 0, 0],
      ],
      mel2: [
        [81, 0, 76, 0, 81, 0, 84, 0], [81, 0, 77, 0, 72, 0, 77, 0], [79, 0, 76, 0, 72, 0, 79, 0], [83, 0, 79, 0, 74, 0, 79, 0],
        [81, 0, 77, 0, 74, 0, 77, 0], [81, 0, 84, 0, 89, 0, 84, 0], [83, 0, 80, 0, 76, 0, 80, 0], [76, 0, 80, 0, 83, 0, 88, 0],
      ],
      lead: 'sawtooth', leadVol: 0.032, bassVol: 0.12, padVol: 0.03, drums: 'drive',
    },
  },

  ctx() { Sfx.init(); return Sfx.ctx; },
  setup(c) {
    if (this.out) return;
    this.out = c.createGain(); this.out.gain.value = 0.0001; this.out.connect(c.destination);
    const len = c.sampleRate * 0.5, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (let k = 0; k < len; k++) d[k] = Math.random() * 2 - 1;
    this.noiseBuf = buf;
  },
  level() { return (Settings.music ? 0.9 : 0) * this.duck; },
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
    const e = 60 / this.song.bpm / 2;
    while (this.nextT < c.currentTime + 0.18) {
      const sw = this.step % 2 ? this.song.swing * e : 0;
      this.schedule(this.step, this.nextT + sw, e);
      this.nextT += e; this.step++;
    }
  },
  schedule(step, t, e) {
    const S = this.song, bars = S.chords.length;
    const bar = Math.floor(step / 8) % bars, i = step % 8, loop = Math.floor(step / (8 * bars));
    const ch = S.chords[bar];
    // melody: alternate the main tune and the answering line each loop
    const mel = loop % 2 ? S.mel2 : S.mel, n = mel[bar][i];
    if (n) { let len = 1; while (i + len < 8 && mel[bar][i + len] === 0 && len < 3) len++; this.note(n, t, e * len * 0.92, S.lead, S.leadVol, true); }
    // bass: root and octave bounce
    const root = ch[0] - 12;
    if (S.drums === 'drive') this.note(i % 2 ? root + 12 : root, t, e * 0.85, 'triangle', S.bassVol);
    else if (i === 0 || i === 3 || i === 4 || i === 6) this.note(i === 3 ? root + 7 : i === 6 ? root + 12 : root, t, e * 1.4, 'triangle', S.bassVol);
    // chords: off-beat plucks
    if (i % 2 === 1) ch.forEach(k => this.note(k + 12, t, e * 0.5, 'triangle', S.padVol));
    // drums
    if (S.drums === 'drive') { if (i % 2 === 0) this.kick(t); if (i === 2 || i === 6) this.snare(t); this.hat(t, i % 2 ? 0.02 : 0.012); }
    else { if (i === 0 || i === 4) this.kick(t); if (i === 2 || i === 6) this.snare(t, 0.06); if (i % 2 === 1) this.hat(t, 0.015); }
  },
  note(midi, t, dur, type, vol, lead) {
    const c = Sfx.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(440 * Math.pow(2, (midi - 69) / 12), t);
    if (lead) { const vib = c.createOscillator(), vg = c.createGain(); vib.frequency.value = 5.5; vg.gain.value = 3; vib.connect(vg); vg.connect(o.frequency); vib.start(t); vib.stop(t + dur + 0.05); }
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol * 0.4), t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.out); o.start(t); o.stop(t + dur + 0.02);
  },
  kick(t) {
    const c = Sfx.ctx, o = c.createOscillator(), g = c.createGain();
    o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    o.connect(g); g.connect(this.out); o.start(t); o.stop(t + 0.18);
  },
  noise(t, dur, vol, freq, type) {
    const c = Sfx.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noiseBuf; f.type = type; f.frequency.value = freq;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(this.out); s.start(t); s.stop(t + dur + 0.02);
  },
  snare(t, vol = 0.07) { this.noise(t, 0.14, vol, 1800, 'bandpass'); },
  hat(t, vol = 0.015) { this.noise(t, 0.04, vol, 7000, 'highpass'); },
};
