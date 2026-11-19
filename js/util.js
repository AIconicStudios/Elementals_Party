'use strict';
// Shared helpers
const Settings = {
  speed: 1,          // animation delay multiplier (0 = instant)
  sound: true,
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
  const t = ms * Settings.speed;
  return new Promise(r => setTimeout(r, t > 0 ? t : 0));
}

// Tiny WebAudio synth for feedback
const Sfx = {
  ctx: null,
  init() { if (!this.ctx) { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { this.ctx = null; } } },
  tone(freq, dur = 0.08, type = 'square', vol = 0.06, slide = 0) {
    if (!Settings.sound || Settings.test || this.suppress) return;
    this.init(); const c = this.ctx; if (!c) return;
    if (c.state === 'suspended') c.resume();
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, c.currentTime);
    if (slide) o.frequency.linearRampToValueAtTime(freq + slide, c.currentTime + dur);
    g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime + dur + 0.02);
  },
  step() { this.tone(520, 0.04, 'triangle', 0.04); },
  coin() { if (this.suppress) return; this.tone(880, 0.06, 'square', 0.05); setTimeout(() => this.tone(1320, 0.08, 'square', 0.05), 60); },
  bad() { this.tone(220, 0.2, 'sawtooth', 0.05, -100); },
  star() { if (this.suppress) return; [660, 880, 1100, 1320].forEach((f, i) => setTimeout(() => this.tone(f, 0.1, 'triangle', 0.06), i * 70)); },
  click() { this.tone(700, 0.03, 'square', 0.03); },
  dice() { this.tone(300 + Math.random() * 300, 0.03, 'square', 0.03); },
  boom() { this.tone(120, 0.35, 'sawtooth', 0.08, -80); },
  win() { if (this.suppress) return; [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.tone(f, 0.18, 'triangle', 0.07), i * 120)); },
};
