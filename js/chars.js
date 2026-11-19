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

const Char = {
  T() { return performance.now() / 1000; },

  draw(g, x, y, r, el, color, o = {}) {
    const t = o.t !== undefined ? o.t : this.T();
    const seed = o.seed || 0;
    const mood = o.mood || 'happy';
    const walk = o.walk || 0;
    const out = mood === 'out';
    const C = CLAN[el] || GENERIC;
    const skin = el >= 0 ? SKIN : { light: this.shade(color, 0.5), mid: color, dark: this.shade(color, -0.25), line: this.shade(color, -0.6), blush: 'rgba(255,150,160,0.35)' };
    const face = o.look && o.look.x > 0.25 ? 1 : -1; // -1 faces left (default), 1 faces right
    g.save();
    g.globalAlpha *= o.alpha !== undefined ? o.alpha : 1;
    const bob = out ? 0 : (walk > 0.1 ? Math.abs(Math.sin(t * 14 + seed)) * r * 0.14 : Math.sin(t * 3 + seed) * r * 0.05);
    const squash = out ? 1 : 1 + Math.sin(t * 3 + seed) * 0.025 + (mood === 'cheer' ? Math.sin(t * 12) * 0.06 : 0);
    g.translate(x, y - bob);
    if (out) g.rotate(0.4 * face);
    if (mood === 'hurt') g.translate(Math.sin(t * 50) * r * 0.06, 0);
    g.fillStyle = 'rgba(0,0,0,0.22)';
    g.beginPath(); g.ellipse(0, r * 1.3 + bob, r * 0.85, r * 0.15, 0, 0, 7); g.fill();
    g.scale(-face, 1); // everything below is drawn facing left
    if (!o.noFeet) this.shoes(g, r, C, t, seed, walk, out);
    if (!o.noArms) this.glove(g, r, C, mood, t, seed, walk, false);
    g.save(); g.scale(1 / Math.sqrt(squash), squash);
    this.body(g, r, skin);
    if (o.hat !== 'helmet') this.wrap(g, r, C, el, t, seed);
    this.face(g, r, mood, o.look ? clamp(o.look.y, -1, 1) : 0, t, seed, skin);
    if (o.hat === 'helmet') this.helmet(g, r, color);
    g.restore();
    if (!o.noArms) this.glove(g, r, C, mood, t, seed, walk, true);
    if (!o.simple) this.flair(g, r, el, t, seed);
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

  face(g, r, mood, ly, t, seed, skin) {
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
    let hx, hy, rot;
    if (front) {
      if (mood === 'cheer') { hx = -r * 0.85; hy = -r * 0.95 + Math.sin(t * 14) * r * 0.1; rot = -2.4; }
      else if (mood === 'scared') { hx = -r * 0.6; hy = r * 0.45; rot = -2.2; }
      else if (waving) { hx = -r * 1.05; hy = -r * 0.55 + w * r * 0.15; rot = -2.3; }
      else if (mood === 'determined') { hx = -r * 0.5 + (walk ? Math.sin(t * 14) * r * 0.2 : 0); hy = r * 0.32; rot = -1.2; }
      else if (mood === 'hurt' || mood === 'dizzy' || mood === 'out') { hx = -r * 0.25; hy = r * 0.78; rot = 0.3; }
      else { hx = -r * 0.02; hy = r * 0.38 + (walk ? Math.sin(t * 14) * r * 0.12 : 0); rot = -0.6; }
    } else {
      if (mood === 'cheer') { hx = r * 0.95; hy = -r * 0.85 + Math.sin(t * 14 + 1) * r * 0.1; rot = 2.4; }
      else { hx = r * 1.08; hy = r * 0.25 + (walk ? Math.sin(t * 14 + 3) * r * 0.15 : 0); rot = 0.6; }
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
