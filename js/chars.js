'use strict';
// The Fourfold clan characters: round peach heroes in side profile, with an element
// headwrap, floating gloves and shoes, moods, blinking, bobbing and walking.
// Char.draw(g, x, y, r, el, color, opts)
//   x,y = centre of the body; r = body radius; el = 0 Air, 1 Water, 2 Fire, 3 Earth (-1 = generic)
//   opts: mood ('happy'|'neutral'|'determined'|'scared'|'hurt'|'dizzy'|'out'|'cheer'|'sleepy'),
//         look {x,y}, walk (0..1), t, seed, alpha, hat ('helmet'), noFeet, noArms, simple, prop
const CLAN = [
  { wrap: '#e4e9f0', wrap2: '#9fb0c8', hem: '#9fb0c8', pattern: 'swirl', glove: '#f4f6fa', cuff: '#b9c4d4', shoe: '#e8ebf0', sole: '#8a93a3', lace: '#9aa6b8' },             // Air
  { wrap: '#3f7fd8', wrap2: '#ffffff', hem: '#2a5fa8', pattern: 'wave', glove: '#4a8fe0', cuff: '#ffffff', shoe: '#4a8fe0', sole: '#2a5fa8', lace: '#9fd0ff', boot: true },  // Water
  { wrap: '#e8432a', wrap2: '#ffc23a', hem: '#ffc23a', pattern: 'flame', glove: '#e8432a', cuff: '#ffc23a', shoe: '#e0442b', sole: '#ffffff', lace: '#ffd34d' },           // Fire
  { wrap: '#7a4f2a', wrap2: '#6fae3c', hem: '#5a3a1a', pattern: 'leaf', glove: '#4f8a2c', cuff: '#7a4f2a', shoe: '#7a4a24', sole: '#4a2c14', lace: '#c9a36b', boot: true }, // Earth
];
const GENERIC = { wrap: '#9aa0ad', wrap2: '#cfd3dc', hem: '#cfd3dc', pattern: 'none', glove: '#cfd3dc', cuff: '#9aa0ad', shoe: '#8a8f99', sole: '#5a5f69', lace: '#cfd3dc' };
const SKIN = { light: '#ffe0b0', mid: '#fbb064', dark: '#ef8f45', line: '#a8582a', blush: 'rgba(255,105,105,0.5)' };

// Pebble's emotional range: stoic, grim, angry, feisty - never bubbly
const PEBBLE_MOOD = { cheer: 'stoic', laugh: 'stoic', starry: 'stoic', love: 'stoic', proud: 'stoic', evil: 'smug', cry: 'grim', sad: 'grim', scared: 'grim', nervous: 'grim', shock: 'angry' };
const Char = {
  T() { return performance.now() / 1000; },

  draw(g, x, y, r, el, color, o = {}) {
    const t = o.t !== undefined ? o.t : this.T();
    const seed = o.seed || 0;
    let mood = o.mood || 'happy';
    // Pebble (Earth) never goes bubbly: wins are a stoic nod, losses turn into a scowl or feisty anger
    if (el === 3 && PEBBLE_MOOD[mood]) mood = PEBBLE_MOOD[mood];
    const walk = o.walk || 0;
    const out = mood === 'out';
    const C = CLAN[el] || GENERIC;
    const skin = el >= 0 ? SKIN : { light: this.shade(color, 0.5), mid: color, dark: this.shade(color, -0.25), line: this.shade(color, -0.6), blush: 'rgba(255,150,160,0.35)' };
    const face = o.look && o.look.x > 0.25 ? 1 : -1; // -1 faces left (default), 1 faces right
    g.save();
    g.globalAlpha *= o.alpha !== undefined ? o.alpha : 1;
    const bob = out ? 0 : (walk > 0.1 ? Math.abs(Math.sin(t * 14 + seed)) * r * 0.14 : Math.sin(t * 3 + seed) * r * 0.05);
    let squash = out ? 1 : 1 + Math.sin(t * 3 + seed) * 0.025 + (mood === 'cheer' ? Math.sin(t * 12) * 0.06 : 0);
    // ---- clan idle life: each clan stands still differently and strikes a signature pose every few seconds
    const idle = this.idle(r, el, mood, walk, out, t, seed, o);
    squash += idle.sq;
    this._pose = idle.pose; this._pp = idle.pp;
    const faceMood = idle.face || mood;
    this._el = el;
    g.translate(x, y - bob);
    if (out) g.rotate(0.4 * face);
    if (mood === 'hurt') g.translate(Math.sin(t * 50) * r * 0.06, 0);
    if (mood === 'evil' || mood === 'laugh') g.translate(Math.sin(t * 32) * r * 0.035, -Math.abs(Math.sin(t * 11)) * r * 0.1);
    if (mood === 'angry') g.translate(Math.sin(t * 55) * r * 0.045, 0);
    if (mood === 'shock') g.translate(Math.sin(t * 60) * r * 0.02, -r * 0.08);
    if (mood === 'starry') g.translate(0, -Math.abs(Math.sin(t * 6)) * r * 0.12);
    if (mood === 'cry') g.translate(Math.sin(t * 20) * r * 0.015, 0);
    if (mood === 'stoic') { const nk = (t + seed) % 2.6; if (nk < 0.5) g.translate(0, Math.sin(nk / 0.5 * Math.PI) * r * 0.07); }
    g.fillStyle = 'rgba(0,0,0,0.22)';
    const shrink = 1 - Math.min(0.5, idle.lift / (r * 1.6));
    g.beginPath(); g.ellipse(0, r * 1.3 + bob, r * 0.85 * shrink, r * 0.15 * shrink, 0, 0, 7); g.fill();
    if (idle.pose) this.poseFx(g, r, el, idle.pose, idle.pp, t, true);
    g.translate(0, -idle.lift);
    g.scale(-face * idle.flip, 1); // everything below is drawn facing left
    if (!o.noFeet) this.shoes(g, r, C, t, seed, walk, out);
    if (!o.noArms) this.glove(g, r, C, faceMood, t, seed, walk, false);
    g.save(); g.scale(1 / Math.sqrt(squash), squash);
    this.body(g, r, skin);
    if (mood === 'angry' || mood === 'sick' || mood === 'evil') { g.save(); g.beginPath(); g.arc(0, 0, r, 0, 7); g.clip(); const tg = g.createLinearGradient(0, -r, 0, r); const c = mood === 'angry' ? '255,40,30' : mood === 'sick' ? '90,200,60' : '120,40,160'; tg.addColorStop(0, `rgba(${c},${mood === 'evil' ? 0.25 : 0.45})`); tg.addColorStop(1, `rgba(${c},0)`); g.fillStyle = tg; g.fillRect(-r, -r, r * 2, r * 2); g.restore(); }
    if (o.hat !== 'helmet') this.wrap(g, r, C, el, t, seed);
    this.face(g, r, faceMood, o.look ? clamp(o.look.y, -1, 1) : 0, t, seed, skin);
    if (o.hat === 'helmet') this.helmet(g, r, color);
    g.restore();
    if (!o.noArms) this.glove(g, r, C, faceMood, t, seed, walk, true);
    if (!o.simple) this.flair(g, r, el, t, seed);
    this.moodFx(g, r, faceMood, t, seed);
    if (!o.simple) this.flourish(g, r, el, faceMood, t, seed);
    if (idle.pose) this.poseFx(g, r, el, idle.pose, idle.pp, t, false);
    this._pose = null;
    g.restore();
    if (o.prop) { g.save(); g.font = `${Math.round(r * 0.9)}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(o.prop, x + face * r * 1.2, y - bob + r * 0.1); g.restore(); }
  },

  body(g, r, skin) {
    const gr = g.createRadialGradient(-r * 0.3, -r * 0.4, r * 0.1, 0, 0, r * 1.05);
    gr.addColorStop(0, skin.light); gr.addColorStop(0.55, skin.mid); gr.addColorStop(1, skin.dark);
    g.lineWidth = Math.max(1.2, r * 0.06); g.strokeStyle = skin.line;
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill(); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.45)'; g.beginPath(); g.ellipse(r * 0.48, -r * 0.12, r * 0.08, r * 0.2, 0.3, 0, 7); g.fill();
    // nose bump on the facing side
    g.fillStyle = skin.mid; g.beginPath(); g.arc(-r * 0.97, -r * 0.02, r * 0.17, 0, 7); g.fill(); g.stroke();
    g.beginPath(); g.arc(-r * 0.86, -r * 0.02, r * 0.16, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.4)'; g.beginPath(); g.arc(-r * 1.02, -r * 0.09, r * 0.05, 0, 7); g.fill();
  },

  // element headwrap over the top of the head with a knot ornament
  wrap(g, r, C, el, t, seed) {
    if (C.pattern === 'none') return;
    const edge = x => -r * 0.42 + x * 0.12;
    g.save();
    g.beginPath(); g.arc(0, 0, r * 1.01, 0, 7); g.clip();
    g.fillStyle = C.wrap;
    g.beginPath(); g.moveTo(-r * 1.1, edge(-r * 1.1)); g.quadraticCurveTo(0, -r * 0.5, r * 1.1, edge(r * 1.1)); g.lineTo(r * 1.1, -r * 1.2); g.lineTo(-r * 1.1, -r * 1.2); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.18)'; g.beginPath(); g.ellipse(-r * 0.1, -r * 0.82, r * 0.5, r * 0.1, -0.1, 0, 7); g.fill();
    g.lineWidth = Math.max(1, r * 0.06); g.lineCap = 'round';
    if (C.pattern === 'wave') {
      g.strokeStyle = C.wrap2;
      const off = (t * r * 0.12) % (r * 0.28);
      for (let k = -5; k <= 5; k++) { const cx = k * r * 0.28 + off; g.beginPath(); g.arc(cx, -r * 0.58, r * 0.12, Math.PI, Math.PI * 1.9); g.stroke(); }
    } else if (C.pattern === 'flame') {
      for (let k = -4; k <= 4; k++) {
        const fx = k * r * 0.26, h = r * (0.22 + 0.08 * Math.sin(t * 8 + k));
        g.fillStyle = k % 2 ? C.wrap2 : '#ff8a2a';
        g.beginPath(); g.moveTo(fx - r * 0.11, -r * 0.46); g.quadraticCurveTo(fx, -r * 0.46 - h * 1.7, fx + r * 0.11, -r * 0.46); g.fill();
      }
    } else if (C.pattern === 'leaf') {
      g.strokeStyle = '#4a2c14'; g.beginPath(); g.moveTo(-r, -r * 0.62); g.quadraticCurveTo(0, -r * 0.74, r, -r * 0.6); g.stroke();
      g.fillStyle = C.wrap2;
      for (let k = -3; k <= 3; k++) { g.save(); g.translate(k * r * 0.3, -r * 0.66 + (k % 2) * r * 0.08); g.rotate(k * 0.7); g.beginPath(); g.ellipse(0, 0, r * 0.1, r * 0.05, 0, 0, 7); g.fill(); g.restore(); }
      g.fillStyle = '#4a2c14'; for (let k = -3; k <= 3; k++) { g.beginPath(); g.arc(k * r * 0.33 + r * 0.12, -r * 0.84, r * 0.03, 0, 7); g.fill(); }
    } else if (C.pattern === 'swirl') {
      g.strokeStyle = C.wrap2;
      for (let k = -2; k <= 2; k++) { g.beginPath(); g.arc(k * r * 0.45, -r * 0.68, r * 0.13, 0, Math.PI * 1.5); g.stroke(); }
    }
    g.restore();
    g.strokeStyle = C.hem; g.lineWidth = Math.max(1.5, r * 0.1); g.lineCap = 'round';
    g.beginPath(); g.moveTo(-r * 0.93, edge(-r * 0.93) + r * 0.02); g.quadraticCurveTo(0, -r * 0.5, r * 0.96, edge(r * 0.96)); g.stroke();
    // tails of the knot hanging at the back
    g.fillStyle = C.wrap; g.strokeStyle = this.shade(C.wrap, -0.35); g.lineWidth = Math.max(0.8, r * 0.04);
    const sw = Math.sin(t * 4 + seed) * 0.15;
    g.save(); g.translate(r * 0.9, -r * 0.42); g.rotate(0.5 + sw); g.beginPath(); g.moveTo(0, 0); g.lineTo(r * 0.32, r * 0.05); g.lineTo(r * 0.26, r * 0.2); g.closePath(); g.fill(); g.stroke(); g.restore();
    // ornament on top
    g.save(); g.translate(r * 0.42, -r * 0.92);
    if (el === 1) {
      g.fillStyle = '#6fb0ff'; g.strokeStyle = '#2a5fa8'; g.lineWidth = Math.max(1, r * 0.05);
      g.beginPath(); g.arc(0, -r * 0.08, r * 0.2, 0, 7); g.fill(); g.stroke();
      g.fillStyle = '#e8f6ff'; g.beginPath(); g.arc(-r * 0.05, -r * 0.16, r * 0.1, Math.PI, 0); g.fill();
      const d = (t * 0.8 + seed * 0.3) % 1; g.fillStyle = `rgba(120,190,255,${1 - d})`; g.beginPath(); g.ellipse(r * 0.28, r * 0.05 + d * r * 0.5, r * 0.06, r * 0.09, 0, 0, 7); g.fill();
    } else if (el === 2) {
      for (let k = 0; k < 3; k++) {
        const h = r * (0.45 + 0.15 * Math.sin(t * 10 + k * 2 + seed)) * (k === 1 ? 1.25 : 0.85);
        g.fillStyle = k === 1 ? '#ffd34d' : '#ff7a2a';
        g.beginPath(); g.moveTo((k - 1) * r * 0.16 - r * 0.12, 0); g.quadraticCurveTo((k - 1) * r * 0.2 + Math.sin(t * 7 + k) * r * 0.06, -h, (k - 1) * r * 0.16 + r * 0.12, 0); g.fill();
      }
    } else if (el === 3) {
      g.fillStyle = '#c98a4a'; g.strokeStyle = '#5a3a1a'; g.lineWidth = Math.max(1, r * 0.05);
      g.beginPath(); g.arc(0, 0, r * 0.13, 0, 7); g.fill(); g.stroke();
      g.strokeStyle = '#3f7a1c'; g.lineWidth = Math.max(1, r * 0.06);
      g.beginPath(); g.moveTo(0, -r * 0.1); g.quadraticCurveTo(r * 0.04, -r * 0.3, -r * 0.02, -r * 0.42); g.stroke();
      const s2 = Math.sin(t * 2.5 + seed) * 0.25; g.fillStyle = '#7ccf4a';
      g.save(); g.translate(0, -r * 0.38); g.rotate(-0.5 + s2); g.beginPath(); g.ellipse(r * 0.17, 0, r * 0.18, r * 0.08, 0, 0, 7); g.fill(); g.restore();
      g.save(); g.translate(0, -r * 0.32); g.rotate(3.5 + s2); g.beginPath(); g.ellipse(r * 0.15, 0, r * 0.15, r * 0.07, 0, 0, 7); g.fill(); g.restore();
    } else if (el === 0) {
      g.strokeStyle = '#8a93a3'; g.lineWidth = Math.max(1, r * 0.05);
      g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -r * 0.25); g.stroke();
      g.translate(0, -r * 0.27); g.rotate(t * 9 + seed);
      g.fillStyle = '#f4f6fa';
      for (let k = 0; k < 3; k++) { g.rotate(Math.PI * 2 / 3); g.beginPath(); g.ellipse(r * 0.17, 0, r * 0.17, r * 0.06, 0, 0, 7); g.fill(); g.stroke(); }
      g.fillStyle = '#b9c4d4'; g.beginPath(); g.arc(0, 0, r * 0.05, 0, 7); g.fill();
    }
    g.restore();
  },

  // Idle behaviour per clan. Returns body lift, squash, paper-flip (for Air's twirl), pose and face override.
  //   Air (Zephi): floats on the breeze, twirls around.
  //   Water (Drip): jiggles like jelly, does a splash-hop.
  //   Fire (Pyra): bounces on its toes like a boxer, fist-pumps.
  //   Earth (Pebble): slow sturdy breathing, stomps the ground then flexes.
  idle(r, el, mood, walk, out, t, seed, o) {
    const res = { lift: 0, sq: 0, flip: 1, pose: null, pp: -1, face: null };
    const calm = !out && walk < 0.1 && !o.noIdle && !o.noFeet && el >= 0 && (mood === 'happy' || mood === 'neutral' || mood === 'determined' || mood === 'sleepy');
    if (!calm) return res;
    const per = 6.5 + el * 0.4, k = ((t + seed * 1.37) % per) / per;
    const pp = k > 0.8 ? (k - 0.8) / 0.2 : -1;
    const posing = pp >= 0 && mood !== 'determined';
    if (el === 0) {
      res.lift = r * (0.12 + 0.08 * Math.sin(t * 2.2 + seed));
      if (posing) { res.flip = Math.cos(pp * Math.PI * 2); res.lift += Math.sin(pp * Math.PI) * r * 0.3; res.pose = 'spin'; }
    } else if (el === 1) {
      res.sq = Math.sin(t * 5 + seed) * 0.05;
      if (posing) {
        const h = Math.sin(Math.min(1, pp / 0.75) * Math.PI);
        res.lift = pp < 0.75 ? h * r * 0.6 : 0;
        res.sq = pp < 0.08 ? -0.14 : pp > 0.75 ? 0.2 * (1 - (pp - 0.75) / 0.25) : 0.08;
        res.pose = 'splash';
      }
    } else if (el === 2) {
      res.lift = Math.abs(Math.sin(t * 8 + seed)) * r * 0.07;
      if (posing) { res.lift += Math.sin(pp * Math.PI) * r * 0.18; res.pose = 'pump'; }
    } else if (el === 3) {
      res.sq = Math.sin(t * 1.6 + seed) * 0.035;
      if (posing) {
        if (pp < 0.35) { res.lift = Math.sin(pp / 0.35 * Math.PI / 2) * r * 0.35; res.pose = 'stomp'; }
        else if (pp < 0.42) { res.lift = r * 0.35 * (1 - (pp - 0.35) / 0.07); res.pose = 'stomp'; }
        else { res.sq = pp < 0.55 ? 0.14 * (1 - (pp - 0.42) / 0.13) : 0; res.pose = 'flex'; }
      }
    }
    res.pp = pp;
    return res;
  },
  // effects that go with the signature poses (back = drawn behind the body)
  poseFx(g, r, el, pose, pp, t, back) {
    g.save();
    if (pose === 'spin' && !back) {
      g.strokeStyle = 'rgba(220,240,255,0.85)'; g.lineWidth = Math.max(1.5, r * 0.07); g.lineCap = 'round';
      for (let k = 0; k < 3; k++) { const a = pp * 14 + k * 2.1, rr = r * (1.25 + k * 0.18); g.beginPath(); g.ellipse(0, r * 0.2 - k * r * 0.35, rr, rr * 0.3, 0, a, a + 2.2); g.stroke(); }
    }
    if (pose === 'splash' && !back && pp > 0.72) {
      const q = (pp - 0.72) / 0.28;
      for (let k = 0; k < 8; k++) { const a = Math.PI + (k / 7) * Math.PI, d = r * (0.6 + q * 1.1); g.fillStyle = `rgba(120,190,255,${1 - q})`; g.beginPath(); g.ellipse(Math.cos(a) * d, r * 1.15 + Math.sin(a) * d * 0.6 - q * r * 0.2, r * 0.07, r * 0.11, 0, 0, 7); g.fill(); }
      g.strokeStyle = `rgba(160,215,255,${1 - q})`; g.lineWidth = r * 0.05; g.beginPath(); g.ellipse(0, r * 1.3, r * (0.6 + q), r * (0.12 + q * 0.15), 0, 0, 7); g.stroke();
    }
    if (pose === 'pump' && back) {
      for (let k = 0; k < 7; k++) { const a = -Math.PI / 2 + (k - 3) * 0.35, h = r * (0.5 + 0.35 * Math.sin(t * 12 + k)) * Math.sin(pp * Math.PI); g.fillStyle = k % 2 ? 'rgba(255,200,60,0.85)' : 'rgba(255,110,40,0.8)'; g.beginPath(); g.moveTo(Math.cos(a - 0.15) * r, Math.sin(a - 0.15) * r); g.quadraticCurveTo(Math.cos(a) * (r + h * 1.8), Math.sin(a) * (r + h * 1.8), Math.cos(a + 0.15) * r, Math.sin(a + 0.15) * r); g.fill(); }
    }
    if ((pose === 'flex' || pose === 'stomp') && back && pp > 0.4 && pp < 0.75) {
      const q = (pp - 0.4) / 0.35;
      for (let s = -1; s <= 1; s += 2) for (let k = 0; k < 3; k++) { g.fillStyle = `rgba(190,160,110,${0.7 * (1 - q)})`; g.beginPath(); g.arc(s * r * (0.5 + q * 0.9 + k * 0.2), r * 1.25 - q * r * 0.3 - k * r * 0.12, r * (0.14 + q * 0.12), 0, 7); g.fill(); }
      g.fillStyle = `rgba(120,90,60,${1 - q})`; for (let k = 0; k < 4; k++) { g.beginPath(); g.arc((k - 1.5) * r * 0.5, r * 1.2 - Math.sin(q * Math.PI) * r * (0.4 + k % 2 * 0.3), r * 0.06, 0, 7); g.fill(); }
    }
    g.restore();
  },
  // celebration flourish for strong happy emotions, unique per clan
  flourish(g, r, el, mood, t, seed) {
    if (!['cheer', 'laugh', 'starry', 'proud', 'love'].includes(mood) || el < 0) return;
    g.save();
    if (el === 0) { g.strokeStyle = 'rgba(225,240,255,0.75)'; g.lineWidth = Math.max(1.5, r * 0.06); g.lineCap = 'round'; for (let k = 0; k < 3; k++) { const a = t * 5 + k * 2.1; g.beginPath(); g.ellipse(0, -r * 0.1, r * 1.45, r * 0.5, -0.2, a, a + 1.6); g.stroke(); } }
    if (el === 1) for (let k = 0; k < 6; k++) { const ph = (t * 1.2 + k / 6) % 1, side = k % 2 ? 1 : -1; const x = side * ph * r * 1.2, y = -r * 1.1 - Math.sin(ph * Math.PI) * r * 0.9 + ph * r * 0.5; g.fillStyle = `rgba(110,185,255,${1 - ph * 0.7})`; g.beginPath(); g.ellipse(x, y, r * 0.06, r * 0.09, 0, 0, 7); g.fill(); }
    if (el === 2) for (let k = 0; k < 5; k++) { const ph = (t * 1.6 + k / 5) % 1; const x = (k - 2) * r * 0.45, y = r * 0.9 - ph * r * 2.4; g.fillStyle = `rgba(255,${130 + k * 25},40,${(1 - ph) * 0.9})`; g.beginPath(); g.moveTo(x - r * 0.08, y); g.quadraticCurveTo(x, y - r * 0.3, x + r * 0.08, y); g.quadraticCurveTo(x, y + r * 0.08, x - r * 0.08, y); g.fill(); }
    if (el === 3) for (let k = 0; k < 4; k++) { const a = t * 2.5 + k * Math.PI / 2; const x = Math.cos(a) * r * 1.45, y = Math.sin(a) * r * 0.45 - r * 0.1; if (k % 2) { g.fillStyle = '#8a7a66'; g.beginPath(); g.arc(x, y, r * 0.1, 0, 7); g.fill(); } else { g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = '#7ccf4a'; g.beginPath(); g.ellipse(0, 0, r * 0.13, r * 0.06, 0, 0, 7); g.fill(); g.restore(); } }
    g.restore();
  },

  // the extended emotions: returns true when it drew the whole face
  faceEx(g, r, mood, t, seed, skin) {
    const ink = '#2a1410';
    const ex = -r * 0.42, ey = -r * 0.12, ew = r * 0.17, eh = r * 0.23, mx = -r * 0.8, my = r * 0.3;
    const lw = Math.max(1, r * 0.05);
    const eye = (sc = 1, pr = 0.68, lid = 0, pdx = -0.25, pdy = 0.08) => {
      g.save(); g.beginPath(); g.ellipse(ex, ey, ew * sc, eh * sc, 0, 0, 7); g.clip();
      g.fillStyle = '#fff'; g.fillRect(ex - ew * 2, ey - eh * 2, ew * 4, eh * 4);
      const px = ex + ew * pdx, py = ey + eh * pdy;
      g.fillStyle = ink; g.beginPath(); g.arc(px, py, ew * pr, 0, 7); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(px - ew * pr * 0.35, py - ew * pr * 0.4, ew * pr * 0.38, 0, 7); g.fill();
      if (lid > 0) { g.fillStyle = skin.mid; g.fillRect(ex - ew * 2, ey - eh * 2, ew * 4, eh * (1 + lid * 2)); g.strokeStyle = ink; g.lineWidth = lw; g.beginPath(); g.moveTo(ex - ew * 1.2, ey - eh + eh * lid * 2); g.lineTo(ex + ew * 1.2, ey - eh + eh * lid * 2); g.stroke(); }
      g.restore();
      g.strokeStyle = ink; g.lineWidth = Math.max(0.8, r * 0.035); g.beginPath(); g.ellipse(ex, ey, ew * sc, eh * sc, 0, 0, 7); g.stroke();
    };
    const brow = (x1, y1, x2, y2, w = 1) => { g.strokeStyle = ink; g.lineWidth = lw * w; g.beginPath(); g.moveTo(ex + x1 * ew, ey + y1 * eh); g.lineTo(ex + x2 * ew, ey + y2 * eh); g.stroke(); };
    const blush = (a = 1) => { g.fillStyle = skin.blush; g.globalAlpha *= a; g.beginPath(); g.ellipse(-r * 0.3, r * 0.2, r * 0.17, r * 0.1, 0, 0, 7); g.fill(); g.globalAlpha /= a; };
    g.lineCap = 'round'; g.lineJoin = 'round';
    // ---- resting faces: open eyes, closed mouth, a different personality per clan
    if ((mood === 'happy' || mood === 'neutral') && this._el >= 0) {
      const blink = ((t + seed * 1.7) % 3.6) < 0.12;
      const shut = () => { g.strokeStyle = ink; g.lineWidth = Math.max(1.2, r * 0.06); g.beginPath(); g.moveTo(ex - ew, ey + eh * 0.15); g.quadraticCurveTo(ex, ey + eh * 0.45, ex + ew, ey + eh * 0.15); g.stroke(); };
      const lashes = (n, sc = 1) => { g.strokeStyle = ink; g.lineWidth = Math.max(0.8, r * 0.035); for (let k = 0; k < n; k++) { const a = -Math.PI / 2 + 0.25 + k * 0.32; g.beginPath(); g.moveTo(ex + Math.cos(a) * ew * sc, ey + Math.sin(a) * eh * sc); g.lineTo(ex + Math.cos(a) * ew * sc * 1.45 + r * 0.02, ey + Math.sin(a) * eh * sc * 1.3); g.stroke(); } };
      const lineMouth = (pts) => { g.strokeStyle = ink; g.lineWidth = lw; g.beginPath(); g.moveTo(mx + pts[0] * r, my + pts[1] * r); g.quadraticCurveTo(mx + pts[2] * r, my + pts[3] * r, mx + pts[4] * r, my + pts[5] * r); g.stroke(); };
      const look = Math.sin(t * 0.7 + seed * 2.3) * 0.12; // eyes drift around a little
      switch (this._el) {
        case 0: // Zephi (Air): curious and cute - big round eye, lifted brow, pursed "o" lips
          blush(0.8);
          if (blink) shut(); else { eye(1.12, 0.6, 0, -0.3 + look, -0.05); lashes(2, 1.12); }
          g.strokeStyle = ink; g.lineWidth = lw; g.beginPath(); g.moveTo(ex - ew * 1.1, ey - eh * 1.45); g.quadraticCurveTo(ex, ey - eh * 1.85, ex + ew * 1.0, ey - eh * 1.5); g.stroke();
          g.fillStyle = '#e0606e'; g.strokeStyle = ink; g.lineWidth = lw; g.beginPath(); g.ellipse(mx - r * 0.02, my, r * 0.065, r * 0.07, 0, 0, 7); g.fill(); g.stroke();
          g.fillStyle = '#7a2030'; g.beginPath(); g.ellipse(mx - r * 0.035, my, r * 0.022, r * 0.03, 0, 0, 7); g.fill();
          return true;
        case 1: { // Drip (Water): sweet and gentle - sparkly eye, long lashes, rosy cheeks, tiny closed smile
          blush(1.25);
          g.fillStyle = 'rgba(255,255,255,0.55)'; g.beginPath(); g.arc(-r * 0.24, r * 0.16, r * 0.035, 0, 7); g.fill();
          if (blink) shut(); else {
            eye(1.06, 0.74, 0, -0.22 + look, 0.1);
            g.fillStyle = '#fff'; g.beginPath(); g.arc(ex - ew * 0.02, ey + eh * 0.38, ew * 0.16, 0, 7); g.fill();
            const tw = 0.5 + 0.5 * Math.sin(t * 4 + seed); g.fillStyle = `rgba(255,255,255,${0.6 + tw * 0.4})`; g.save(); g.translate(ex - ew * 0.55, ey - eh * 0.25); g.rotate(t); const q = ew * 0.12 * (0.7 + tw * 0.5); g.fillRect(-q * 2, -q * 0.35, q * 4, q * 0.7); g.fillRect(-q * 0.35, -q * 2, q * 0.7, q * 4); g.restore();
            lashes(3, 1.06);
          }
          g.strokeStyle = ink; g.lineWidth = lw * 0.8; g.beginPath(); g.moveTo(ex - ew * 0.9, ey - eh * 1.42); g.quadraticCurveTo(ex, ey - eh * 1.62, ex + ew * 0.8, ey - eh * 1.35); g.stroke();
          lineMouth([-0.09, -0.01, 0.0, 0.07, 0.08, -0.01]);
          return true;
        }
        case 2: // Pyra (Fire): confident - sharp brow, focused eye, closed half-smirk
          blush(0.55);
          if (blink) shut(); else eye(1, 0.62, 0.14, -0.38 + look * 0.5, 0.12);
          brow(-1.35, -1.05, 1.15, -1.35, 1.5);
          g.strokeStyle = ink; g.lineWidth = lw; g.beginPath(); g.moveTo(mx - r * 0.1, my + r * 0.01); g.lineTo(mx + r * 0.06, my + r * 0.02); g.quadraticCurveTo(mx + r * 0.14, my + r * 0.015, mx + r * 0.17, my - r * 0.06); g.stroke();
          g.lineWidth = lw * 0.7; g.beginPath(); g.moveTo(mx + r * 0.15, my - r * 0.1); g.lineTo(mx + r * 0.2, my - r * 0.03); g.stroke();
          return true;
        case 3: // Pebble (Earth): calm and smug - relaxed half-lidded eye, quiet knowing smirk
          blush(0.65);
          if (blink) shut(); else eye(1, 0.62, 0.38, -0.3 + look * 0.4, 0.3);
          brow(-1.2, -1.35, 1.1, -1.4, 1.2);
          lineMouth([-0.11, -0.04, -0.02, 0.04, 0.1, 0.01]);
          g.strokeStyle = ink; g.lineWidth = lw * 0.7; g.beginPath(); g.moveTo(mx - r * 0.14, my - r * 0.07); g.quadraticCurveTo(mx - r * 0.125, my - r * 0.02, mx - r * 0.1, my - r * 0.03); g.stroke();
          return true;
      }
    }
    // ---- game-face (focused, ready to play): also different per clan
    if (mood === 'determined' && this._el >= 0) {
      const blink = ((t + seed * 1.7) % 3.6) < 0.12;
      const shut = () => { g.strokeStyle = ink; g.lineWidth = Math.max(1.2, r * 0.06); g.beginPath(); g.moveTo(ex - ew, ey + eh * 0.2); g.lineTo(ex + ew, ey + eh * 0.2); g.stroke(); };
      switch (this._el) {
        case 0: // Zephi: eager - wide bright eye, perky brow, cheeks puffed in a tiny "o"
          blush(0.9);
          if (blink) shut(); else eye(1.15, 0.5, 0, -0.45, -0.05);
          brow(-1.2, -1.45, 1.1, -1.7, 1.2);
          g.fillStyle = skin.light; g.globalAlpha *= 0.6; g.beginPath(); g.arc(-r * 0.72, r * 0.22, r * 0.12, 0, 7); g.fill(); g.globalAlpha /= 0.6;
          g.strokeStyle = ink; g.lineWidth = lw; g.fillStyle = '#e0606e'; g.beginPath(); g.ellipse(mx - r * 0.02, my, r * 0.045, r * 0.05, 0, 0, 7); g.fill(); g.stroke();
          return true;
        case 1: // Drip: concentrating hard - big glossy eye, worried brow, biting the lip
          blush(1.1);
          if (blink) shut(); else { eye(1.05, 0.72, 0, -0.35, 0.05); g.fillStyle = '#fff'; g.beginPath(); g.arc(ex - ew * 0.05, ey + eh * 0.4, ew * 0.15, 0, 7); g.fill(); }
          brow(-1.2, -1.25, 1.0, -1.6, 1);
          g.strokeStyle = ink; g.lineWidth = lw; g.beginPath(); g.moveTo(mx - r * 0.1, my); g.lineTo(mx + r * 0.08, my); g.stroke();
          g.fillStyle = '#fff'; g.fillRect(mx - r * 0.04, my, r * 0.05, r * 0.035); g.strokeStyle = ink; g.lineWidth = lw * 0.5; g.strokeRect(mx - r * 0.04, my, r * 0.05, r * 0.035);
          return true;
        case 2: // Pyra: smug - lazy half-lid eye, one cocky raised brow, closed smirk curling up
          blush(0.6);
          if (blink) shut(); else eye(1, 0.6, 0.36, -0.45, 0.28);
          g.strokeStyle = ink; g.lineWidth = lw * 1.4; g.beginPath(); g.moveTo(ex - ew * 1.25, ey - eh * 1.1); g.quadraticCurveTo(ex, ey - eh * 1.75, ex + ew * 1.15, ey - eh * 1.55); g.stroke();
          g.lineWidth = lw * 1.1; g.beginPath(); g.moveTo(mx - r * 0.09, my + r * 0.03); g.quadraticCurveTo(mx + r * 0.08, my + r * 0.07, mx + r * 0.22, my - r * 0.08); g.stroke();
          g.lineWidth = lw * 0.7; g.beginPath(); g.moveTo(mx + r * 0.19, my - r * 0.12); g.quadraticCurveTo(mx + r * 0.25, my - r * 0.08, mx + r * 0.24, my - r * 0.03); g.stroke();
          return true;
        case 3: // Pebble: locked in - heavy half-lid, low flat brow, mouth set in a hard line
          blush(0.35);
          if (blink) shut(); else eye(1, 0.58, 0.5, -0.45, 0.32);
          brow(-1.35, -1.0, 1.15, -1.1, 1.9);
          g.strokeStyle = ink; g.lineWidth = lw * 1.2; g.beginPath(); g.moveTo(mx - r * 0.12, my + r * 0.01); g.lineTo(mx + r * 0.1, my + r * 0.01); g.stroke();
          return true;
      }
    }
    switch (mood) {
      case 'evil': {
        blush(0.6);
        eye(1, 0.45, 0.42, -0.45, 0.25);
        brow(-1.3, -0.55, 1.2, -1.35, 1.6);
        // huge sinister grin with teeth
        g.fillStyle = '#5a1020'; g.strokeStyle = ink; g.lineWidth = lw;
        g.beginPath(); g.moveTo(mx - r * 0.12, my - r * 0.12); g.quadraticCurveTo(mx + r * 0.2, my + r * 0.32, mx + r * 0.5, my - r * 0.18); g.quadraticCurveTo(mx + r * 0.2, my + r * 0.02, mx - r * 0.12, my - r * 0.12); g.fill(); g.stroke();
        g.fillStyle = '#fff'; g.beginPath(); g.moveTo(mx - r * 0.08, my - r * 0.09); g.quadraticCurveTo(mx + r * 0.2, my + r * 0.05, mx + r * 0.45, my - r * 0.15); g.lineTo(mx + r * 0.4, my - r * 0.08); g.quadraticCurveTo(mx + r * 0.2, my + r * 0.1, mx - r * 0.04, my - r * 0.04); g.fill();
        return true;
      }
      case 'laugh': {
        blush(1.3);
        g.strokeStyle = ink; g.lineWidth = lw * 1.5; g.beginPath(); g.moveTo(ex - ew, ey - eh * 0.4); g.lineTo(ex + ew * 0.2, ey + eh * 0.1); g.lineTo(ex - ew * 0.9, ey + eh * 0.55); g.stroke();
        for (let k = 0; k < 2; k++) { const ph = (t * 2 + k * 0.5) % 1; g.fillStyle = `rgba(140,210,255,${1 - ph})`; g.beginPath(); g.ellipse(ex - ew * 1.3 - ph * r * 0.4, ey - ph * r * 0.2 + ph * ph * r * 0.5, r * 0.05, r * 0.07, 0, 0, 7); g.fill(); }
        const open = 0.18 + Math.abs(Math.sin(t * 14)) * 0.08;
        g.fillStyle = '#5a1020'; g.strokeStyle = ink; g.lineWidth = lw;
        g.beginPath(); g.moveTo(mx - r * 0.12, my - r * 0.06); g.lineTo(mx + r * 0.3, my - r * 0.1); g.quadraticCurveTo(mx + r * 0.15, my + r * open * 2.2, mx - r * 0.12, my - r * 0.06); g.fill(); g.stroke();
        g.fillStyle = '#ff7a8a'; g.beginPath(); g.ellipse(mx + r * 0.08, my + r * open * 0.9, r * 0.08, r * 0.05, 0, 0, 7); g.fill();
        return true;
      }
      case 'cry': {
        blush(1.2);
        brow(-1.2, -1.5, 1.1, -0.95, 1.2);
        g.strokeStyle = ink; g.lineWidth = lw * 1.4; g.beginPath(); g.arc(ex, ey + eh * 0.1, ew * 0.95, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
        // tear rivers
        g.fillStyle = 'rgba(140,210,255,0.55)'; g.beginPath(); rrPath(g, ex - ew * 0.5, ey, ew * 0.5, r * 0.9, ew * 0.25); g.fill();
        for (let k = 0; k < 4; k++) { const ph = (t * 1.8 + k / 4) % 1; g.fillStyle = `rgba(100,190,255,${1 - ph * 0.6})`; g.beginPath(); g.ellipse(ex - ew * 0.25 + Math.sin(k) * 2, ey + ph * r * 1.0, r * 0.05, r * 0.08, 0, 0, 7); g.fill(); }
        // wobbly bawling mouth
        g.fillStyle = '#5a1020'; g.strokeStyle = ink; g.lineWidth = lw;
        const wob = Math.sin(t * 25) * r * 0.02;
        g.beginPath(); g.ellipse(mx + r * 0.05, my + r * 0.04 + wob, r * 0.14, r * 0.1 + wob, 0, 0, 7); g.fill(); g.stroke();
        return true;
      }
      case 'shock': {
        blush(0.5);
        brow(-1.1, -1.9, 1.1, -2.1, 1.2);
        eye(1.45, 0.25, 0, -0.2, 0);
        g.fillStyle = '#5a1020'; g.strokeStyle = ink; g.lineWidth = lw;
        g.beginPath(); g.ellipse(mx + r * 0.02, my + r * 0.12, r * 0.1, r * 0.22, 0, 0, 7); g.fill(); g.stroke();
        return true;
      }
      case 'angry': {
        brow(-1.3, -0.5, 1.2, -1.4, 2);
        eye(1, 0.55, 0.35, -0.3, 0.2);
        g.fillStyle = '#fff'; g.strokeStyle = ink; g.lineWidth = lw;
        g.beginPath(); rrPath(g, mx - r * 0.12, my - r * 0.05, r * 0.32, r * 0.13, r * 0.04); g.fill(); g.stroke();
        g.beginPath(); for (let k = 1; k < 4; k++) { g.moveTo(mx - r * 0.12 + k * r * 0.08, my - r * 0.05); g.lineTo(mx - r * 0.12 + k * r * 0.08, my + r * 0.08); } g.moveTo(mx - r * 0.12, my + r * 0.015); g.lineTo(mx + r * 0.2, my + r * 0.015); g.stroke();
        return true;
      }
      case 'smug': {
        blush(0.8);
        brow(-1.1, -1.3, 1.1, -1.55, 1);
        eye(1, 0.6, 0.5, -0.55, 0.3);
        g.strokeStyle = ink; g.lineWidth = lw * 1.2; g.beginPath(); g.moveTo(mx - r * 0.08, my + r * 0.02); g.quadraticCurveTo(mx + r * 0.15, my + r * 0.06, mx + r * 0.28, my - r * 0.1); g.stroke();
        return true;
      }
      case 'starry': {
        blush(1.3);
        g.save(); g.translate(ex, ey); g.rotate(Math.sin(t * 3) * 0.3); const sc = 1 + Math.sin(t * 10) * 0.1;
        g.fillStyle = '#ffd34d'; g.strokeStyle = '#a8790a'; g.lineWidth = lw * 0.8; g.beginPath();
        for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = (k % 2 ? ew * 0.55 : ew * 1.35) * sc; k ? g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : g.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
        g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#fff'; g.beginPath(); g.arc(-ew * 0.3, -ew * 0.3, ew * 0.25, 0, 7); g.fill(); g.restore();
        g.fillStyle = '#5a1020'; g.strokeStyle = ink; g.lineWidth = lw;
        g.beginPath(); g.moveTo(mx - r * 0.14, my - r * 0.05); g.quadraticCurveTo(mx + r * 0.06, my + r * 0.3, mx + r * 0.26, my - r * 0.06); g.closePath(); g.fill(); g.stroke();
        return true;
      }
      case 'sick': {
        eye(0.9, 0.5, 0.45, -0.1, 0.3);
        g.fillStyle = 'rgba(80,60,120,0.35)'; g.beginPath(); g.ellipse(ex, ey + eh * 1.05, ew * 0.9, eh * 0.25, 0, 0, 7); g.fill();
        g.strokeStyle = ink; g.lineWidth = lw; g.beginPath(); g.moveTo(mx - r * 0.12, my); for (let k = 0; k <= 5; k++) g.lineTo(mx - r * 0.12 + k * r * 0.06, my + (k % 2 ? -1 : 1) * r * 0.04 + Math.sin(t * 6) * r * 0.01); g.stroke();
        return true;
      }
      case 'nervous': {
        blush(0.6);
        brow(-1.1, -1.4, 1.1, -1.1, 1);
        eye(1.05, 0.5, 0, -0.25 + Math.sin(t * 9) * 0.5, 0.05);
        g.strokeStyle = ink; g.lineWidth = lw; g.beginPath(); g.moveTo(mx - r * 0.1, my); for (let k = 0; k <= 4; k++) g.lineTo(mx - r * 0.1 + k * r * 0.07, my + (k % 2 ? -1 : 1) * r * 0.035); g.stroke();
        return true;
      }
      case 'sad': {
        blush(0.5);
        brow(-1.2, -1.55, 1.1, -1.05, 1.1);
        eye(1, 0.62, 0.3, -0.25, 0.35);
        g.strokeStyle = ink; g.lineWidth = lw * 1.1; g.beginPath(); g.arc(mx + r * 0.05, my + r * 0.12, r * 0.12, Math.PI * 1.15, Math.PI * 1.85); g.stroke();
        return true;
      }
      case 'effort': {
        blush(1.4);
        brow(-1.3, -0.6, 1.2, -1.25, 1.6);
        g.strokeStyle = ink; g.lineWidth = lw * 1.5; g.beginPath(); g.moveTo(ex - ew * 1.0, ey - eh * 0.45); g.lineTo(ex + ew * 0.5, ey); g.lineTo(ex - ew * 1.0, ey + eh * 0.45); g.stroke();
        g.fillStyle = '#fff'; g.strokeStyle = ink; g.lineWidth = lw; g.beginPath(); rrPath(g, mx - r * 0.12, my - r * 0.06, r * 0.34, r * 0.14, r * 0.05); g.fill(); g.stroke();
        g.beginPath(); g.moveTo(mx - r * 0.12, my + r * 0.01); g.lineTo(mx + r * 0.22, my + r * 0.01); g.stroke();
        return true;
      }
      case 'love': {
        blush(1.6);
        g.save(); g.translate(ex, ey); const hs = ew * (1.25 + Math.sin(t * 9) * 0.12);
        g.fillStyle = '#ff4d7a'; g.strokeStyle = '#a8123a'; g.lineWidth = lw * 0.7; g.beginPath(); g.moveTo(0, hs * 0.9); g.bezierCurveTo(-hs * 1.4, -hs * 0.1, -hs * 0.6, -hs * 1.1, 0, -hs * 0.35); g.bezierCurveTo(hs * 0.6, -hs * 1.1, hs * 1.4, -hs * 0.1, 0, hs * 0.9); g.fill(); g.stroke();
        g.fillStyle = 'rgba(255,255,255,0.7)'; g.beginPath(); g.arc(-hs * 0.35, -hs * 0.3, hs * 0.2, 0, 7); g.fill(); g.restore();
        g.strokeStyle = ink; g.lineWidth = lw * 1.2; g.beginPath(); g.arc(mx + r * 0.04, my - r * 0.06, r * 0.13, Math.PI * 0.15, Math.PI * 0.95); g.stroke();
        return true;
      }
      case 'stoic': { // Pebble's victory: same calm half-lidded eye, firm flat brow, a tight knowing smirk
        blush(0.45);
        const bl = ((t + seed * 1.7) % 3.6) < 0.12;
        if (bl) { g.strokeStyle = ink; g.lineWidth = Math.max(1.2, r * 0.06); g.beginPath(); g.moveTo(ex - ew, ey + eh * 0.2); g.lineTo(ex + ew, ey + eh * 0.2); g.stroke(); }
        else eye(1, 0.6, 0.47, -0.34, 0.32);
        brow(-1.3, -1.12, 1.15, -1.18, 1.7);
        g.strokeStyle = ink; g.lineWidth = lw * 1.1; g.beginPath(); g.moveTo(mx - r * 0.13, my - r * 0.06); g.quadraticCurveTo(mx - r * 0.03, my + r * 0.03, mx + r * 0.1, my + r * 0.015); g.stroke();
        g.lineWidth = lw * 0.7; g.beginPath(); g.moveTo(mx - r * 0.16, my - r * 0.1); g.quadraticCurveTo(mx - r * 0.15, my - r * 0.04, mx - r * 0.12, my - r * 0.04); g.stroke();
        return true;
      }
      case 'grim': { // Pebble when things go wrong: narrowed glare, brow pushed down, flat frown - no tears
        blush(0.3);
        eye(1, 0.55, 0.4, -0.36, 0.3);
        brow(-1.35, -0.85, 1.15, -1.35, 1.8);
        g.strokeStyle = ink; g.lineWidth = lw * 1.1; g.beginPath(); g.moveTo(mx - r * 0.11, my + r * 0.04); g.quadraticCurveTo(mx, my - r * 0.02, mx + r * 0.11, my + r * 0.045); g.stroke();
        return true;
      }
      case 'proud': {
        blush(1);
        brow(-1.1, -1.5, 1.1, -1.6, 1);
        g.strokeStyle = ink; g.lineWidth = lw * 1.3; g.beginPath(); g.arc(ex, ey + eh * 0.35, ew * 0.9, Math.PI * 1.15, Math.PI * 1.85); g.stroke();
        g.beginPath(); g.arc(mx + r * 0.05, my - r * 0.08, r * 0.14, Math.PI * 0.15, Math.PI * 0.9); g.stroke();
        return true;
      }
    }
    return false;
  },

  // extra effects around the character for strong emotions
  moodFx(g, r, mood, t, seed) {
    if (mood === 'effort') for (let k = 0; k < 3; k++) { const ph = (t * 2 + k / 3) % 1; g.fillStyle = `rgba(150,210,255,${1 - ph})`; g.beginPath(); g.ellipse(r * (0.3 + k * 0.3) + ph * r * 0.4, -r * 0.7 + ph * r * 0.3, r * 0.05, r * 0.09, 0.5, 0, 7); g.fill(); }
    if (mood === 'love') for (let k = 0; k < 3; k++) { const ph = (t * 0.8 + k / 3) % 1; const x = (k - 1) * r * 0.6 + Math.sin(ph * 8 + k) * r * 0.15, y = -r * 1.1 - ph * r * 1.1, hs = r * 0.13 * (1 - ph * 0.4); g.fillStyle = `rgba(255,80,130,${1 - ph})`; g.beginPath(); g.moveTo(x, y + hs); g.bezierCurveTo(x - hs * 1.4, y, x - hs * 0.6, y - hs, x, y - hs * 0.35); g.bezierCurveTo(x + hs * 0.6, y - hs, x + hs * 1.4, y, x, y + hs); g.fill(); }
    if (mood === 'angry') for (let k = 0; k < 3; k++) { const ph = (t * 1.3 + k / 3) % 1; g.fillStyle = `rgba(255,255,255,${0.8 * (1 - ph)})`; g.beginPath(); g.arc((k - 1) * r * 0.45 + Math.sin(ph * 6) * r * 0.08, -r * 1.15 - ph * r * 0.8, r * (0.1 + ph * 0.18), 0, 7); g.fill(); }
    if (mood === 'nervous' || mood === 'sick') for (let k = 0; k < 2; k++) { const ph = (t * 0.9 + k * 0.5) % 1; g.fillStyle = `rgba(150,210,255,${1 - ph})`; g.beginPath(); g.ellipse(r * (0.2 + k * 0.45), -r * 0.6 + ph * r * 0.7, r * 0.06, r * 0.1, 0, 0, 7); g.fill(); }
    if (mood === 'starry') for (let k = 0; k < 5; k++) { const a = t * 2 + k * 1.26; const x = Math.cos(a) * r * 1.45, y = Math.sin(a) * r * 1.2 - r * 0.2; g.fillStyle = '#ffe680'; g.save(); g.translate(x, y); g.rotate(a * 2); const q = r * 0.09 * (1 + Math.sin(t * 8 + k) * 0.4); g.fillRect(-q * 2, -q * 0.4, q * 4, q * 0.8); g.fillRect(-q * 0.4, -q * 2, q * 0.8, q * 4); g.restore(); }
    if (mood === 'shock') { g.fillStyle = '#ff4d4d'; g.font = `bold ${Math.round(r * 0.5)}px Georgia`; g.textAlign = 'center'; g.save(); g.scale(-1, 1); g.fillText('!', r * 0.25, -r * 1.25 - Math.abs(Math.sin(t * 10)) * r * 0.15); g.fillText('!', -r * 0.2, -r * 1.35 - Math.abs(Math.sin(t * 10 + 1)) * r * 0.15); g.restore(); }
    if (mood === 'stoic' || mood === 'grim') { const ph = ((t + seed) % 2.6) / 2.6; if (ph > 0.15 && ph < 0.55) { const q = (ph - 0.15) / 0.4; for (let k = 0; k < 2; k++) { g.fillStyle = `rgba(235,225,205,${0.75 * (1 - q)})`; g.beginPath(); g.arc(-r * (1.05 + q * 0.55), r * (0.08 + k * 0.1) + q * r * 0.05 * (k ? 1 : -1), r * (0.07 + q * 0.09), 0, 7); g.fill(); } } }
    if (mood === 'evil') { g.strokeStyle = 'rgba(150,60,200,0.35)'; g.lineWidth = r * 0.06; for (let k = 0; k < 2; k++) { const rr = r * (1.15 + ((t * 0.8 + k * 0.5) % 1) * 0.5); g.globalAlpha *= 1; g.beginPath(); g.arc(0, 0, rr, 0, 7); g.stroke(); } }
  },

  face(g, r, mood, ly, t, seed, skin) {
    if (this.faceEx(g, r, mood, t, seed, skin)) return;
    const ink = '#2a1410';
    const ex = -r * 0.42, ey = -r * 0.12, ew = r * 0.17, eh = r * 0.23;
    const blink = ((t + seed * 1.7) % 3.6) < 0.12;
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.fillStyle = skin.blush; g.beginPath(); g.ellipse(-r * 0.3, r * 0.2, r * 0.17, r * 0.1, 0, 0, 7); g.fill();
    g.strokeStyle = ink; g.lineWidth = Math.max(1, r * 0.05);
    if (mood === 'determined' || mood === 'hurt') { g.beginPath(); g.moveTo(ex - ew * 1.1, ey - eh - r * 0.02); g.lineTo(ex + ew * 1.1, ey - eh + r * 0.08); g.stroke(); }
    else if (mood === 'scared') { g.beginPath(); g.moveTo(ex - ew, ey - eh - r * 0.1); g.lineTo(ex + ew, ey - eh - r * 0.16); g.stroke(); }
    if (mood === 'out') {
      g.lineWidth = Math.max(1.2, r * 0.07);
      g.beginPath(); g.moveTo(ex - ew, ey - ew); g.lineTo(ex + ew, ey + ew); g.moveTo(ex + ew, ey - ew); g.lineTo(ex - ew, ey + ew); g.stroke();
    } else if (mood === 'dizzy') {
      g.lineWidth = Math.max(1, r * 0.05); g.beginPath();
      for (let a = 0; a < 12; a += 0.3) { const rr = a / 12 * ew * 1.1; const px = ex + Math.cos(a + t * 8) * rr, py = ey + Math.sin(a + t * 8) * rr; a ? g.lineTo(px, py) : g.moveTo(px, py); }
      g.stroke();
    } else if (mood === 'cheer' || mood === 'sleepy' || (blink && mood !== 'scared')) {
      g.lineWidth = Math.max(1.2, r * 0.07); g.beginPath();
      if (mood === 'cheer') g.arc(ex, ey + eh * 0.35, ew * 0.9, Math.PI * 1.15, Math.PI * 1.85);
      else { g.moveTo(ex - ew, ey + eh * 0.2); g.quadraticCurveTo(ex, ey + eh * 0.5, ex + ew, ey + eh * 0.2); }
      g.stroke();
    } else if (mood === 'hurt') {
      g.lineWidth = Math.max(1.2, r * 0.07); g.beginPath(); g.moveTo(ex + ew, ey - eh * 0.6); g.lineTo(ex - ew * 0.6, ey); g.lineTo(ex + ew, ey + eh * 0.6); g.stroke();
    } else {
      const big = mood === 'scared' ? 1.2 : 1;
      g.fillStyle = '#fff'; g.beginPath(); g.ellipse(ex, ey, ew * big, eh * big, 0, 0, 7); g.fill();
      g.strokeStyle = ink; g.lineWidth = Math.max(0.8, r * 0.035); g.stroke();
      const pr = mood === 'scared' ? ew * 0.42 : ew * 0.68;
      const px = ex - ew * 0.25, py = ey + ly * eh * 0.3 + eh * 0.08;
      g.fillStyle = ink; g.beginPath(); g.arc(px, py, pr, 0, 7); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(px - pr * 0.35, py - pr * 0.4, pr * 0.38, 0, 7); g.fill();
      g.strokeStyle = ink; g.lineWidth = Math.max(0.8, r * 0.035);
      for (let k = 0; k < 3; k++) { const a = -Math.PI / 2 + 0.25 + k * 0.32; g.beginPath(); g.moveTo(ex + Math.cos(a) * ew * big, ey + Math.sin(a) * eh * big); g.lineTo(ex + Math.cos(a) * ew * big * 1.45 + r * 0.02, ey + Math.sin(a) * eh * big * 1.3); g.stroke(); }
    }
    const mx = -r * 0.8, my = r * 0.3;
    g.strokeStyle = ink; g.fillStyle = '#c23a4a'; g.lineWidth = Math.max(1, r * 0.05);
    g.beginPath();
    switch (mood) {
      case 'cheer': g.moveTo(mx - r * 0.14, my - r * 0.04); g.quadraticCurveTo(mx + r * 0.05, my + r * 0.26, mx + r * 0.22, my - r * 0.04); g.closePath(); g.fill(); g.stroke(); break;
      case 'scared': g.ellipse(mx, my, r * 0.08, r * 0.12, 0, 0, 7); g.fill(); g.stroke();
        g.fillStyle = '#9fd8ff'; g.beginPath(); g.ellipse(r * 0.15, -r * 0.38 + ((t * 0.8) % 0.4) * r, r * 0.06, r * 0.1, 0, 0, 7); g.fill(); break;
      case 'hurt': case 'dizzy': g.moveTo(mx - r * 0.1, my); for (let k = 0; k <= 4; k++) g.lineTo(mx - r * 0.1 + k * r * 0.07, my + (k % 2 ? -1 : 1) * r * 0.04); g.stroke(); break;
      case 'out': g.moveTo(mx - r * 0.1, my); g.lineTo(mx + r * 0.12, my); g.stroke(); g.fillStyle = '#ff7a8a'; g.beginPath(); g.ellipse(mx, my + r * 0.07, r * 0.05, r * 0.08, 0, 0, 7); g.fill(); break;
      case 'determined': g.moveTo(mx - r * 0.1, my); g.lineTo(mx + r * 0.12, my - r * 0.02); g.stroke(); break;
      case 'happy': g.arc(mx + r * 0.02, my - r * 0.06, r * 0.12, Math.PI * 0.2, Math.PI * 0.95); g.stroke(); break;
      default: // the signature pursed "o" lips
        g.fillStyle = '#e0606e'; g.ellipse(mx - r * 0.03, my, r * 0.09, r * 0.085, 0, 0, 7); g.fill(); g.stroke();
        g.fillStyle = '#7a2030'; g.beginPath(); g.ellipse(mx - r * 0.05, my, r * 0.03, r * 0.04, 0, 0, 7); g.fill();
    }
  },

  // floating mitten; front = the one in front of the body
  glove(g, r, C, mood, t, seed, walk, front) {
    const w = Math.sin(t * 10 + seed);
    const waving = mood === 'happy' && ((t + seed) % 5) < 1.6;
    // Poses are chosen so the front hand never covers the eye (-0.42r,-0.12r), the nose or the mouth.
    let hx, hy, rot;
    const sw = walk ? Math.sin(t * 14 + (front ? 0 : Math.PI)) * r * 0.15 : 0;
    const limp = mood === 'hurt' || mood === 'dizzy' || mood === 'out' || mood === 'sad' || mood === 'cry';
    const ex = this.glovePose(r, mood, t, front);
    if (ex) { [hx, hy, rot] = ex; }
    else if (front) {
      if (mood === 'cheer') { hx = -r * 0.75; hy = -r * 1.25 + Math.sin(t * 14) * r * 0.1; rot = -2.5; }
      else if (mood === 'scared') { hx = -r * 1.32; hy = r * 0.38 + Math.sin(t * 40) * r * 0.03; rot = -1.9; }
      else if (waving) { hx = -r * 1.3; hy = -r * 0.5 + w * r * 0.12; rot = -2.3 + w * 0.3; }
      else if (mood === 'determined') { hx = -r * 1.2 + sw; hy = r * 0.62; rot = -1.4; }
      else if (limp) { hx = -r * 0.35; hy = r * 0.98; rot = 0.4; }
      else { hx = -r * 0.2 + sw; hy = r * 0.62; rot = -0.5; }
    } else {
      if (mood === 'cheer') { hx = r * 0.7; hy = -r * 1.22 + Math.sin(t * 14 + 1) * r * 0.1; rot = 2.5; }
      else if (mood === 'scared') { hx = r * 1.0; hy = -r * 0.3; rot = 2.0; }
      else if (limp) { hx = r * 0.75; hy = r * 0.98; rot = 0.3; }
      else { hx = r * 0.92 + sw; hy = r * 0.55; rot = 0.5; }
    }
    const s = r * 0.24;
    g.save(); g.translate(hx, hy); g.rotate(rot);
    g.fillStyle = front ? C.glove : this.shade(C.glove, -0.15); g.strokeStyle = this.shade(C.glove, -0.55); g.lineWidth = Math.max(0.8, r * 0.04);
    g.beginPath(); g.ellipse(0, 0, s * 1.05, s * 0.9, 0, 0, 7); g.fill(); g.stroke();
    g.beginPath(); g.ellipse(-s * 0.85, -s * 0.45, s * 0.38, s * 0.28, -0.6, 0, 7); g.fill(); g.stroke();
    g.fillStyle = C.cuff; g.beginPath(); rrPath(g, s * 0.6, -s * 0.55, s * 0.55, s * 1.1, s * 0.2); g.fill(); g.stroke();
    if (C.pattern === 'flame') { g.fillStyle = '#ffd34d'; g.beginPath(); g.moveTo(-s * 0.3, s * 0.2); g.quadraticCurveTo(-s * 0.1, -s * 0.8, s * 0.2, s * 0.2); g.fill(); }
    if (C.pattern === 'wave') { g.strokeStyle = '#ffffff'; g.beginPath(); g.moveTo(-s * 0.6, 0); g.lineTo(s * 0.4, 0); g.moveTo(-s * 0.5, s * 0.35); g.lineTo(s * 0.4, s * 0.35); g.stroke(); }
    g.restore();
  },

  glovePose(r, mood, t, front) {
    const q = Math.sin(t * 18), shake = Math.sin(t * 40) * r * 0.05;
    const pose = this._pose, pp = this._pp;
    if (pose === 'spin') return front ? [-r * 1.3, -r * 0.15, -1.8] : [r * 1.25, -r * 0.15, 1.8];
    if (pose === 'splash') return front ? [-r * 0.85, -r * 1.2, -2.5] : [r * 0.8, -r * 1.2, 2.5];
    if (pose === 'pump') { const up = Math.abs(Math.sin(pp * Math.PI * 3)); return front ? [-r * 0.65, -r * (0.9 + up * 0.45), -2.6] : [r * 0.95, r * 0.6, 0.3]; }
    if (pose === 'stomp') return front ? [-r * 0.7, r * 0.75, -0.3] : [r * 0.8, r * 0.75, 0.3];
    if (pose === 'flex') return front ? [-r * 1.18, -r * 0.6 + shake * 0.4, -2.0] : [r * 1.12, -r * 0.6 - shake * 0.4, 2.0];
    if (mood === 'effort') return front ? [-r * 1.0, r * 0.5 + q * r * 0.06, -1.3] : [r * 0.98, r * 0.5 - q * r * 0.06, 1.2];
    if (mood === 'love') return front ? [-r * 0.55, r * 0.62, -0.9] : [r * 0.4, r * 0.66, 0.9];
    switch (mood) {
      case 'evil': return front ? [-r * 0.45 + q * r * 0.12, r * 0.58 + Math.cos(t * 18) * r * 0.06, -0.6] : [r * 0.9, r * 0.5, 0.5];      // rubbing hands
      case 'laugh': return front ? [-r * 0.15, r * 0.7 + Math.abs(Math.sin(t * 11)) * r * 0.1, -0.2] : [r * 0.95, r * 0.6, 0.4];          // holding the belly
      case 'shock': return front ? [-r * 1.18, -r * 0.65 + shake, -2.5] : [r * 0.95, -r * 0.8 + shake, 2.5];                          // hands thrown up
      case 'angry': return front ? [-r * 1.22, r * 0.45 + shake, -1.4] : [r * 1.0, r * 0.4 - shake, 1.2];                            // shaking fists
      case 'stoic': return front ? [-r * 1.12, -r * 0.42, -1.9] : [r * 0.95, r * 0.65, 0.3];                                         // one firm fist, other hand on hip
      case 'grim': return front ? [-r * 0.15, r * 0.85, -0.3] : [r * 0.92, r * 0.55, 0.4];                                            // arms folded
      case 'smug': case 'proud': return front ? [-r * 0.62, r * 0.85, -0.2] : [r * 0.95, r * 0.65, 0.3];                             // hands on hips
      case 'starry': return front ? [-r * 0.8, -r * 1.2 + Math.sin(t * 9) * r * 0.1, -2.5] : [r * 0.75, -r * 1.2 + Math.sin(t * 9 + 1) * r * 0.1, 2.5];
      case 'sick': return front ? [-r * 0.1, r * 0.55, -0.3] : [r * 0.9, r * 0.6, 0.4];
      case 'nervous': return front ? [-r * 0.3 + Math.sin(t * 12) * r * 0.08, r * 0.62, -0.5] : [r * 0.9, r * 0.55, 0.5];
    }
    return null;
  },

  shoes(g, r, C, t, seed, walk, out) {
    const ph = t * 14 + seed;
    for (const s of [-1, 1]) {
      const p2 = ph + (s > 0 ? Math.PI : 0);
      const swing = walk > 0.1 ? Math.sin(p2) * r * 0.25 : 0, lift = walk > 0.1 ? Math.max(0, Math.cos(p2)) * r * 0.1 : 0;
      g.save(); g.translate(s * r * 0.36 + swing, r * 1.2 - lift); if (out) g.rotate(0.3 * s);
      g.fillStyle = C.shoe; g.strokeStyle = this.shade(C.shoe, -0.55); g.lineWidth = Math.max(0.8, r * 0.04);
      if (C.boot) { g.beginPath(); rrPath(g, -r * 0.12, -r * 0.3, r * 0.26, r * 0.3, r * 0.06); g.fill(); g.stroke(); }
      g.beginPath(); g.moveTo(r * 0.16, -r * 0.12); g.quadraticCurveTo(r * 0.16, -r * 0.2, -r * 0.05, -r * 0.18); g.quadraticCurveTo(-r * 0.32, -r * 0.16, -r * 0.34, -r * 0.02); g.lineTo(r * 0.16, -r * 0.02); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = C.sole; g.fillRect(-r * 0.35, -r * 0.03, r * 0.52, r * 0.07);
      if (!C.boot) { g.strokeStyle = C.lace; g.lineWidth = Math.max(0.8, r * 0.035); g.beginPath(); g.moveTo(-r * 0.02, -r * 0.16); g.lineTo(r * 0.08, -r * 0.1); g.stroke(); }
      g.restore();
    }
  },

  helmet(g, r, color) {
    g.fillStyle = '#c9ced6'; g.strokeStyle = '#5b6170'; g.lineWidth = Math.max(1, r * 0.06);
    g.beginPath(); g.arc(0, -r * 0.18, r * 0.98, Math.PI * 1.03, Math.PI * 1.97); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.ellipse(r * 0.25, -r * 0.75, r * 0.2, r * 0.07, 0.3, 0, 7); g.fill();
    g.fillStyle = color; g.beginPath(); g.moveTo(-r * 0.12, -r * 1.12); g.quadraticCurveTo(r * 0.3, -r * 1.55, r * 0.55, -r * 1.05); g.closePath(); g.fill();
  },

  flair(g, r, el, t, seed) {
    for (let k = 0; k < 3; k++) {
      const ph = ((t * 0.55 + k / 3 + seed * 0.17) % 1), a = k * 2.1 + seed;
      const x = Math.cos(a) * r * 1.35, y = -r * 0.3 - ph * r * 0.9 + Math.sin(a) * r * 0.3;
      const al = Math.sin(ph * Math.PI) * 0.9;
      if (el === 1) { g.fillStyle = `rgba(120,190,255,${al})`; g.beginPath(); g.ellipse(x, y, r * 0.05, r * 0.08, 0, 0, 7); g.fill(); }
      if (el === 2) { g.fillStyle = `rgba(255,${150 + k * 30},50,${al})`; g.beginPath(); g.arc(x, y, r * 0.06, 0, 7); g.fill(); }
      if (el === 3) { g.save(); g.translate(x, y + ph * r * 1.6); g.rotate(ph * 6); g.fillStyle = `rgba(110,175,60,${al})`; g.beginPath(); g.ellipse(0, 0, r * 0.08, r * 0.04, 0, 0, 7); g.fill(); g.restore(); }
      if (el === 0) { g.strokeStyle = `rgba(200,215,235,${al})`; g.lineWidth = Math.max(1, r * 0.04); g.beginPath(); g.arc(x, y, r * 0.12, ph * 4, ph * 4 + 3.5); g.stroke(); }
    }
  },

  shade(hex, amt) {
    if (hex[0] !== '#') return hex;
    const n = parseInt(hex.slice(1), 16);
    const r = n >> 16, gg = (n >> 8) & 255, b = n & 255;
    const f = v => Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt);
    return `rgb(${f(r)},${f(gg)},${f(b)})`;
  },
};
function rrPath(g, x, y, w, h, r) { g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
