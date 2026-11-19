'use strict';
// Elemental characters with faces, moods, blinking, bobbing and walking feet.
// Char.draw(g, x, y, r, el, color, opts)
//   x,y  = centre of the body;  r = body radius
//   opts: mood ('happy'|'neutral'|'determined'|'scared'|'hurt'|'dizzy'|'out'|'cheer'|'sleepy'),
//         look {x,y} (unit-ish vector for pupils), walk (0..1 speed), t (time, s), seed,
//         alpha, scale, flip, hat ('helmet'), noFeet, prop (emoji held at side)
const Char = {
  T() { return performance.now() / 1000; },

  draw(g, x, y, r, el, color, o = {}) {
    const t = o.t !== undefined ? o.t : this.T();
    const seed = o.seed || 0;
    const mood = o.mood || 'happy';
    const walk = o.walk || 0;
    const out = mood === 'out';
    g.save();
    g.globalAlpha *= o.alpha !== undefined ? o.alpha : 1;
    // idle breathing / bounce
    const bob = out ? 0 : (walk > 0.1 ? Math.abs(Math.sin(t * 14 + seed)) * r * 0.12 : Math.sin(t * 3 + seed) * r * 0.04);
    const squash = out ? 1 : 1 + Math.sin(t * 3 + seed) * 0.03 + (mood === 'cheer' ? Math.sin(t * 12) * 0.06 : 0);
    g.translate(x, y - bob);
    if (out) g.rotate(0.35);
    if (mood === 'hurt') g.translate(Math.sin(t * 50) * r * 0.06, 0);

    // shadow
    g.fillStyle = 'rgba(0,0,0,0.28)';
    g.beginPath(); g.ellipse(0, r * 1.02 + bob, r * 0.8, r * 0.2, 0, 0, 7); g.fill();

    // feet
    if (!o.noFeet) {
      const ph = t * 14 + seed;
      const s1 = walk > 0.1 ? Math.sin(ph) * r * 0.25 : 0, s2 = -s1;
      g.fillStyle = this.shade(color, -0.35);
      g.beginPath(); g.ellipse(-r * 0.38 + s1, r * 0.92, r * 0.26, r * 0.15, 0, 0, 7); g.fill();
      g.beginPath(); g.ellipse(r * 0.38 + s2, r * 0.92, r * 0.26, r * 0.15, 0, 0, 7); g.fill();
    }

    g.scale(1 / Math.sqrt(squash), squash);
    if (!o.simple) this.behind(g, r, el, color, t, seed, mood);
    this.body(g, r, el, color, t, seed);

    // face
    const lx = o.look ? clamp(o.look.x, -1, 1) : 0, ly = o.look ? clamp(o.look.y, -1, 1) : 0;
    this.face(g, r, mood, lx, ly, t, seed);
    if (!o.noArms) this.arms(g, r, el, color, mood, t, seed, walk);
    if (!o.simple) this.front(g, r, el, color, t, seed);

    if (o.hat === 'helmet') {
      g.fillStyle = '#c9ced6'; g.strokeStyle = '#6b7280'; g.lineWidth = Math.max(1, r * 0.08);
      g.beginPath(); g.arc(0, -r * 0.35, r * 0.82, Math.PI * 1.05, Math.PI * 1.95); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = color; g.beginPath(); g.moveTo(0, -r * 1.25); g.lineTo(r * 0.15, -r * 0.95); g.lineTo(-r * 0.15, -r * 0.95); g.fill();
    }
    g.restore();
    if (o.prop) { g.save(); g.font = `${Math.round(r * 0.9)}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(o.prop, x + r * 1.05, y - bob + r * 0.2); g.restore(); }
  },

  body(g, r, el, color, t, seed) {
    const dark = this.shade(color, -0.4), light = this.shade(color, 0.45);
    const grad = g.createRadialGradient(-r * 0.35, -r * 0.45, r * 0.1, 0, 0, r * 1.2);
    grad.addColorStop(0, light); grad.addColorStop(0.55, color); grad.addColorStop(1, dark);
    g.lineWidth = Math.max(1.2, r * 0.09); g.strokeStyle = this.shade(color, -0.55);
    if (el === 1) { // Water: droplet
      g.beginPath();
      g.moveTo(0, -r * 1.35);
      g.bezierCurveTo(r * 0.35, -r * 0.85, r * 1.0, -r * 0.35, r * 0.98, r * 0.15);
      g.arc(0, r * 0.12, r * 0.98, 0, Math.PI, false);
      g.bezierCurveTo(-r * 1.0, -r * 0.35, -r * 0.35, -r * 0.85, 0, -r * 1.35);
      g.fillStyle = grad; g.fill(); g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.55)'; g.beginPath(); g.ellipse(-r * 0.45, -r * 0.35, r * 0.13, r * 0.28, -0.4, 0, 7); g.fill();
      return;
    }
    if (el === 2) { // Fire: flame crown behind the body
      for (let k = -1; k <= 1; k++) {
        const h = r * (1.05 + 0.3 * Math.sin(t * 9 + k * 2 + seed)) * (k === 0 ? 1.3 : 0.95);
        g.fillStyle = k === 0 ? '#ffd34d' : '#ff8a3d';
        g.beginPath(); g.moveTo(k * r * 0.45 - r * 0.32, -r * 0.55);
        g.quadraticCurveTo(k * r * 0.5 + Math.sin(t * 7 + k) * r * 0.15, -r * 0.55 - h * 1.4, k * r * 0.45 + r * 0.32, -r * 0.55);
        g.fill();
      }
    }
    if (el === 3) { // Earth: chunky rock
      g.beginPath();
      const pts = [[-0.95, -0.35], [-0.6, -0.92], [0.1, -1.0], [0.75, -0.8], [1.0, -0.15], [0.9, 0.6], [0.4, 0.98], [-0.45, 0.97], [-0.98, 0.5]];
      pts.forEach(([px, py], i) => i ? g.lineTo(px * r, py * r) : g.moveTo(px * r, py * r));
      g.closePath(); g.fillStyle = grad; g.fill(); g.stroke();
      g.strokeStyle = this.shade(color, -0.5); g.lineWidth = Math.max(1, r * 0.05);
      g.beginPath(); g.moveTo(r * 0.55, r * 0.35); g.lineTo(r * 0.75, r * 0.6); g.lineTo(r * 0.68, r * 0.8); g.stroke();
      // sprout
      g.strokeStyle = '#3f7a1c'; g.lineWidth = Math.max(1.2, r * 0.08);
      g.beginPath(); g.moveTo(r * 0.1, -r * 0.98); g.quadraticCurveTo(r * 0.15, -r * 1.3, r * 0.05, -r * 1.42); g.stroke();
      g.fillStyle = '#9be36b';
      const sw = Math.sin(t * 2.5 + seed) * 0.25;
      g.save(); g.translate(r * 0.08, -r * 1.35); g.rotate(-0.6 + sw); g.beginPath(); g.ellipse(r * 0.22, 0, r * 0.24, r * 0.11, 0, 0, 7); g.fill(); g.restore();
      g.save(); g.translate(r * 0.06, -r * 1.25); g.rotate(3.6 + sw); g.beginPath(); g.ellipse(r * 0.2, 0, r * 0.2, r * 0.1, 0, 0, 7); g.fill(); g.restore();
      return;
    }
    // Air & Fire: round body
    g.beginPath(); g.arc(0, 0, r, 0, 7); g.fillStyle = grad; g.fill(); g.stroke();
    if (el === 0) { // Air: swirl tuft and puffs
      g.strokeStyle = '#ffffff'; g.lineWidth = Math.max(1.2, r * 0.1); g.lineCap = 'round';
      const sw = Math.sin(t * 4 + seed) * 0.2;
      g.beginPath(); g.arc(r * 0.05, -r * 1.12, r * 0.28, Math.PI * 0.2 + sw, Math.PI * 1.7 + sw); g.stroke();
      g.beginPath(); g.arc(-r * 0.25, -r * 1.02, r * 0.16, Math.PI * 1.1 + sw, Math.PI * 2.4 + sw); g.stroke();
    }
  },

  // things drawn behind the body: Air wings, Fire aura
  behind(g, r, el, color, t, seed, mood) {
    if (el === 0) {
      const flap = Math.sin(t * (mood === 'cheer' || mood === 'scared' ? 18 : 6) + seed) * 0.35;
      for (const s of [-1, 1]) {
        g.save(); g.translate(s * r * 0.75, -r * 0.2); g.rotate(s * (0.5 + flap)); g.scale(s * 0.72, 0.72);
        g.fillStyle = 'rgba(255,255,255,0.92)'; g.strokeStyle = 'rgba(120,190,230,0.9)'; g.lineWidth = Math.max(1, r * 0.05);
        g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(r * 0.7, -r * 0.9, r * 1.1, -r * 0.55);
        g.quadraticCurveTo(r * 0.85, -r * 0.35, r * 1.0, -r * 0.2); g.quadraticCurveTo(r * 0.7, -r * 0.05, r * 0.8, r * 0.1);
        g.quadraticCurveTo(r * 0.4, r * 0.1, 0, 0); g.fill(); g.stroke();
        g.restore();
      }
    }
    if (el === 2) {
      g.fillStyle = 'rgba(255,140,40,0.18)'; g.beginPath(); g.arc(0, 0, r * (1.35 + Math.sin(t * 6 + seed) * 0.06), 0, 7); g.fill();
    }
  },
  // things drawn in front: Water bubbles, Fire embers, Earth crystal, Air breeze
  front(g, r, el, color, t, seed) {
    if (el === 1) {
      for (let k = 0; k < 3; k++) {
        const ph = ((t * 0.6 + k / 3 + seed * 0.13) % 1);
        const bx = Math.sin(ph * 9 + k * 2) * r * 0.25 + (k - 1) * r * 0.6, by = -r * 0.6 - ph * r * 1.3;
        g.globalAlpha *= 1; g.strokeStyle = `rgba(200,235,255,${0.85 * (1 - ph)})`; g.lineWidth = Math.max(0.8, r * 0.05);
        g.beginPath(); g.arc(bx, by, r * (0.08 + 0.05 * k), 0, 7); g.stroke();
      }
      // wave curl crest
      g.strokeStyle = '#d4f0ff'; g.lineWidth = Math.max(1, r * 0.07); g.lineCap = 'round';
      g.beginPath(); g.arc(r * 0.18, -r * 0.95, r * 0.14, Math.PI * 0.9, Math.PI * 2.1); g.stroke();
    }
    if (el === 2) {
      for (let k = 0; k < 3; k++) {
        const ph = ((t * 0.9 + k / 3 + seed * 0.21) % 1);
        g.fillStyle = `rgba(255,${180 + k * 20},60,${1 - ph})`;
        g.beginPath(); g.arc((k - 1) * r * 0.5 + Math.sin(ph * 10 + k) * r * 0.15, -r * 0.9 - ph * r * 1.1, r * 0.06 * (1 - ph * 0.5), 0, 7); g.fill();
      }
    }
    if (el === 3) {
      g.fillStyle = '#b48cff'; g.strokeStyle = '#6b3fa0'; g.lineWidth = Math.max(0.8, r * 0.04);
      g.beginPath(); g.moveTo(-r * 0.62, -r * 0.62); g.lineTo(-r * 0.5, -r * 0.98); g.lineTo(-r * 0.36, -r * 0.66); g.lineTo(-r * 0.48, -r * 0.5); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.7)'; g.beginPath(); g.arc(-r * 0.5, -r * 0.75, r * 0.03, 0, 7); g.fill();
    }
  },
  arms(g, r, el, color, mood, t, seed, walk) {
    const handCol = el === 0 ? '#ffffff' : this.shade(color, 0.15), edge = this.shade(color, -0.5);
    const pose = s => {
      const w = Math.sin(t * 10 + seed);
      switch (mood) {
        case 'cheer': return [s * r * 1.08, -r * 0.95 + Math.sin(t * 14 + s) * r * 0.12];
        case 'happy': return s > 0 && ((t + seed) % 5) < 1.6 ? [r * 1.2, -r * 0.5 + w * r * 0.18] : [s * r * 1.02, r * 0.5];
        case 'scared': return [s * r * 0.66, r * 0.42 + Math.sin(t * 40) * r * 0.03];
        case 'determined': return [s * r * 1.08, r * 0.2 + (walk ? Math.sin(t * 14 + s * 3) * r * 0.2 : 0)];
        case 'hurt': case 'dizzy': return [s * r * 1.0, r * 0.68];
        case 'out': return [s * r * 1.15, r * 0.5];
        default: return [s * r * 1.02, r * 0.52 + (walk ? Math.sin(t * 14 + s * 3) * r * 0.12 : 0)];
      }
    };
    g.lineCap = 'round';
    for (const s of [-1, 1]) {
      const [hx, hy] = pose(s);
      const sx = s * r * 0.78, sy = r * 0.18;
      if (mood !== 'scared') { g.strokeStyle = edge; g.lineWidth = r * 0.2; g.beginPath(); g.moveTo(sx, sy); g.lineTo(hx, hy); g.stroke();
        g.strokeStyle = this.shade(color, -0.1); g.lineWidth = r * 0.12; g.beginPath(); g.moveTo(sx, sy); g.lineTo(hx, hy); g.stroke(); }
      g.fillStyle = handCol; g.strokeStyle = edge; g.lineWidth = Math.max(0.8, r * 0.05);
      g.beginPath(); g.arc(hx, hy, r * 0.17, 0, 7); g.fill(); g.stroke();
    }
  },

  face(g, r, mood, lx, ly, t, seed) {
    const ex = r * 0.36, ey = -r * 0.08, ew = r * 0.24, eh = r * 0.3;
    const blink = ((t + seed * 1.7) % 3.4) < 0.12;
    const ink = '#1a1020';
    g.lineCap = 'round';
    // brows
    g.strokeStyle = ink; g.lineWidth = Math.max(1, r * 0.08);
    if (mood === 'determined' || mood === 'hurt') {
      g.beginPath(); g.moveTo(-ex - ew, ey - eh - r * 0.12); g.lineTo(-ex + ew * 0.8, ey - eh + r * 0.04); g.stroke();
      g.beginPath(); g.moveTo(ex + ew, ey - eh - r * 0.12); g.lineTo(ex - ew * 0.8, ey - eh + r * 0.04); g.stroke();
    } else if (mood === 'scared') {
      g.beginPath(); g.moveTo(-ex - ew, ey - eh - r * 0.02); g.lineTo(-ex + ew * 0.6, ey - eh - r * 0.2); g.stroke();
      g.beginPath(); g.moveTo(ex + ew, ey - eh - r * 0.02); g.lineTo(ex - ew * 0.6, ey - eh - r * 0.2); g.stroke();
    }
    // eyes
    for (const s of [-1, 1]) {
      const cx = s * ex, cy = ey;
      if (mood === 'out') {
        g.strokeStyle = ink; g.lineWidth = Math.max(1.2, r * 0.09);
        g.beginPath(); g.moveTo(cx - ew * 0.7, cy - ew * 0.7); g.lineTo(cx + ew * 0.7, cy + ew * 0.7); g.moveTo(cx + ew * 0.7, cy - ew * 0.7); g.lineTo(cx - ew * 0.7, cy + ew * 0.7); g.stroke();
        continue;
      }
      if (mood === 'dizzy') {
        g.strokeStyle = ink; g.lineWidth = Math.max(1, r * 0.06);
        g.beginPath(); for (let a = 0; a < 12; a += 0.3) { const rr = a / 12 * ew; const px = cx + Math.cos(a + t * 8 * s) * rr, py = cy + Math.sin(a + t * 8 * s) * rr; a ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke();
        continue;
      }
      if (mood === 'cheer' || (mood === 'happy' && blink) || mood === 'sleepy' || (blink && mood !== 'scared')) {
        g.strokeStyle = ink; g.lineWidth = Math.max(1.2, r * 0.09);
        g.beginPath();
        if (mood === 'cheer') g.arc(cx, cy + eh * 0.3, ew * 0.75, Math.PI * 1.15, Math.PI * 1.85);
        else { g.moveTo(cx - ew * 0.75, cy); g.lineTo(cx + ew * 0.75, cy); }
        g.stroke();
        continue;
      }
      if (mood === 'hurt') {
        g.strokeStyle = ink; g.lineWidth = Math.max(1.2, r * 0.09);
        g.beginPath(); g.moveTo(cx - ew * 0.7 * s, cy - eh * 0.5); g.lineTo(cx + ew * 0.5 * s, cy); g.lineTo(cx - ew * 0.7 * s, cy + eh * 0.5); g.stroke();
        continue;
      }
      const big = mood === 'scared' ? 1.25 : 1;
      g.fillStyle = '#fff';
      g.beginPath(); g.ellipse(cx, cy, ew * big, eh * big, 0, 0, 7); g.fill();
      g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = Math.max(0.8, r * 0.04); g.stroke();
      const pr = mood === 'scared' ? ew * 0.35 : ew * 0.55;
      const px = cx + lx * ew * 0.4, py = cy + ly * eh * 0.4;
      g.fillStyle = ink; g.beginPath(); g.arc(px, py, pr, 0, 7); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(px - pr * 0.35, py - pr * 0.4, pr * 0.35, 0, 7); g.fill();
    }
    // cheeks
    if (mood === 'happy' || mood === 'cheer') {
      g.fillStyle = 'rgba(255,110,140,0.45)';
      g.beginPath(); g.ellipse(-r * 0.6, r * 0.22, r * 0.15, r * 0.09, 0, 0, 7); g.fill();
      g.beginPath(); g.ellipse(r * 0.6, r * 0.22, r * 0.15, r * 0.09, 0, 0, 7); g.fill();
    }
    // mouth
    const my = r * 0.38;
    g.strokeStyle = ink; g.fillStyle = '#5a1020'; g.lineWidth = Math.max(1.2, r * 0.08);
    g.beginPath();
    switch (mood) {
      case 'happy': g.arc(0, my - r * 0.12, r * 0.22, Math.PI * 0.15, Math.PI * 0.85); g.stroke(); break;
      case 'cheer': g.arc(0, my - r * 0.12, r * 0.3, 0, Math.PI); g.closePath(); g.fill(); g.stroke();
        g.fillStyle = '#ff7a8a'; g.beginPath(); g.ellipse(0, my + r * 0.1, r * 0.12, r * 0.06, 0, 0, 7); g.fill(); break;
      case 'scared': g.ellipse(0, my, r * 0.12, r * 0.17, 0, 0, 7); g.fill(); g.stroke();
        g.fillStyle = '#9fd8ff'; g.beginPath(); g.ellipse(r * 0.85, -r * 0.45 + ((t * 0.8) % 0.4) * r, r * 0.09, r * 0.14, 0, 0, 7); g.fill(); break;
      case 'hurt': case 'dizzy':
        g.moveTo(-r * 0.25, my); for (let k = 0; k <= 4; k++) g.lineTo(-r * 0.25 + k * r * 0.125, my + (k % 2 ? -1 : 1) * r * 0.06); g.stroke(); break;
      case 'out': g.moveTo(-r * 0.2, my); g.lineTo(r * 0.2, my); g.stroke();
        g.fillStyle = '#ff7a8a'; g.beginPath(); g.ellipse(r * 0.08, my + r * 0.1, r * 0.08, r * 0.11, 0, 0, 7); g.fill(); break;
      case 'determined': g.moveTo(-r * 0.18, my); g.quadraticCurveTo(0, my - r * 0.06, r * 0.18, my); g.stroke(); break;
      case 'sleepy': g.arc(0, my, r * 0.07, 0, 7); g.stroke(); break;
      default: g.moveTo(-r * 0.15, my); g.lineTo(r * 0.15, my); g.stroke();
    }
  },

  shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = n >> 16, gg = (n >> 8) & 255, b = n & 255;
    const f = v => Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt);
    return `rgb(${f(r)},${f(gg)},${f(b)})`;
  },
};
