'use strict';
// Signature win animations: every hero celebrates in their own way (a ~4 second loop).
// Char.win(g, x, y, r, el, t) draws the hero (facing right) plus their props.
// Hand poses use the side-view convention of Char.handPose: x < 0 = in front, y < 0 = up (head radii).
Object.assign(Char, {
  WIN_T: 4.2,
  win(g, x, y, r, el, t, o = {}) {
    const k = ((t % this.WIN_T) + this.WIN_T) % this.WIN_T / this.WIN_T, col = ELEMENTS[el].color;
    const H = (hx, hy, d, open) => ({ x: hx, y: hy, d, o: !!open, m: false });
    const draw = (oo) => Char.draw(g, oo.x !== undefined ? oo.x : x, oo.y !== undefined ? oo.y : y, r, el, col, Object.assign({ look: { x: 1, y: 0 }, noIdle: true, seed: 2, t }, o, oo));
    // where a posed hand lands on screen (hero facing right)
    const at = (P, yy = y) => ({ x: x - P.x * 0.7 * r, y: yy + 0.59 * r + P.y * 0.7 * r });
    const fn = this.WINS[el] || this.WINS[0];
    g.save(); fn.call(this, g, x, y, r, k, t, draw, H, at); g.restore();
  },
  ease(a) { return a < 0 ? 0 : a > 1 ? 1 : a * a * (3 - 2 * a); },
  WINS: {
    // Zephi: whirls into a little tornado, then pops out waving
    0(g, x, y, r, k, t, draw, H) {
      if (k < 0.45) { const s = Math.sin(k / 0.45 * Math.PI); for (let q = 0; q < 5; q++) { g.strokeStyle = `rgba(220,240,255,${0.8 - q * 0.12})`; g.lineWidth = r * 0.08; g.beginPath(); g.ellipse(x, y + r * (1.1 - q * 0.45), r * (0.5 + q * 0.28) * (0.6 + s), r * 0.16, 0, t * 12 + q, t * 12 + q + 4.4); g.stroke(); } draw({ y: y - s * r * 0.8, mood: 'cheer', look: { x: Math.cos(t * 25), y: 0 } }); }
      else { const w = Math.sin(t * 12); draw({ mood: 'cheer', hands: { n: H(-1.3, -0.85 + w * 0.05, -102 + 22 * w, 1), f: H(1.0, -1.6, -70, 1) } }); }
    },
    // Drip: drinks from a bottle, then sprays it up into the air like a wrestler
    1(g, x, y, r, k, t, draw, H, at) {
      if (k < 0.45) {
        const P = H(-0.5, -1.1, -150, 0); draw({ mood: 'happy', hands: { n: P, f: H(0.8, 0.2, 80) } });
        const p = at(P); g.save(); g.translate(p.x, p.y); g.rotate(-2.4); g.fillStyle = 'rgba(140,200,255,0.75)'; MGH.rr(g, -r * 0.12, -r * 0.5, r * 0.24, r * 0.55, r * 0.08); g.fill(); g.fillStyle = '#2a6fd8'; g.fillRect(-r * 0.07, -r * 0.62, r * 0.14, r * 0.14); g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(-r * 0.08, -r * 0.4, r * 0.05, r * 0.3); g.restore();
      } else if (k < 0.55) draw({ mood: 'effort', hands: { n: H(-0.9, 0.2, 100), f: H(0.8, 0.2, 80) } });
      else {
        const q = (k - 0.55) / 0.45; draw({ mood: q < 0.5 ? 'shock' : 'cheer', look: { x: 1, y: -1 }, hands: { n: H(-1.3, -1.5, -104, 1), f: H(1.0, -1.7, -66, 1) } });
        for (let d = 0; d < 26; d++) { const a = -Math.PI / 2 + (MGH.hash(d) - 0.5) * 1.4, sp = (0.6 + MGH.hash(d + 7)) * r * 3.2 * q; g.fillStyle = `rgba(140,200,255,${1 - q})`; g.beginPath(); g.arc(x + r * 0.7 + Math.cos(a) * sp, y - r * 0.3 + Math.sin(a) * sp + q * q * r * 2.2, r * 0.06, 0, 7); g.fill(); }
      }
    },
    // Pyra: sets his hand on fire and poses — it starts to burn, he blows it out and sighs
    2(g, x, y, r, k, t, draw, H, at) {
      const P = H(-1.45, -1.5, -95, 1), p = at(P);
      let mood = 'smug', size = 0;
      if (k < 0.15) { size = k / 0.15; mood = 'smug'; }
      else if (k < 0.45) { size = 1; mood = 'proud'; }
      else if (k < 0.65) { size = 1 + (k - 0.45) * 6; mood = 'shock'; }
      else if (k < 0.8) { size = Math.max(0, 2.2 - (k - 0.65) * 15); mood = 'nervous'; }
      else { size = 0; mood = 'happy'; }
      const shake = k > 0.45 && k < 0.65 ? Math.sin(t * 60) * r * 0.06 : 0;
      draw({ mood, x: x + shake, hands: { n: k > 0.65 && k < 0.8 ? H(-0.7, -0.5, -120, 1) : P, f: H(0.8, 0.2, 80) } });
      if (size > 0.02) MGH.flame(g, p.x + shake, p.y - r * 0.15, r * 0.009 * size, t, 3);
      if (k > 0.65 && k < 0.8) for (let q = 0; q < 4; q++) { g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = r * 0.04; g.beginPath(); g.moveTo(x + r * 0.7 + q * r * 0.12, y + r * 0.1); g.lineTo(x + r * 0.9 + q * r * 0.12, y - r * 0.05); g.stroke(); }
      if (k >= 0.8) { const q = (k - 0.8) / 0.2; g.fillStyle = `rgba(200,200,210,${0.6 * (1 - q)})`; g.beginPath(); g.arc(p.x, p.y - r * 0.4 - q * r, r * (0.15 + q * 0.3), 0, 7); g.fill(); MGH.text(g, 'phew…', x + r * 0.3, y - r * 1.6, r * 0.4, '#fff', 'center', 'bold'); }
    },
    // Pebble: leans on a shovel beside a tombstone for the rivals
    3(g, x, y, r, k, t, draw, H, at) {
      g.fillStyle = '#9a948a'; MGH.rr(g, x + r * 0.9, y - r * 0.2, r * 1.1, r * 1.5, r * 0.5); g.fill(); g.fillStyle = '#7a746a'; g.fillRect(x + r * 0.9, y + r * 1.1, r * 1.1, r * 0.2);
      MGH.text(g, 'R.I.P.', x + r * 1.45, y + r * 0.35, r * 0.32, '#4a4438', 'center', 'bold'); MGH.text(g, 'rivals', x + r * 1.45, y + r * 0.7, r * 0.22, '#4a4438', 'center', '');
      g.fillStyle = '#5a3a20'; g.beginPath(); g.ellipse(x + r * 1.45, y + r * 1.3, r * 0.8, r * 0.15, 0, 0, 7); g.fill();
      const P = H(-1.05, -0.35, 90), p = at(P), nod = k > 0.6 && k < 0.75;
      draw({ mood: 'stoic', y: y + (nod ? r * 0.05 : 0), hands: { n: P, f: H(0.6, 0.1, 80) } });
      g.strokeStyle = '#8a5a32'; g.lineWidth = r * 0.09; g.lineCap = 'round'; g.beginPath(); g.moveTo(p.x, p.y - r * 0.15); g.lineTo(p.x + r * 0.05, y + r * 1.05); g.stroke();
      g.fillStyle = '#9aa0aa'; g.strokeStyle = '#5a606a'; g.lineWidth = r * 0.03; g.beginPath(); g.moveTo(p.x - r * 0.18, y + r * 1.0); g.lineTo(p.x + r * 0.28, y + r * 1.0); g.quadraticCurveTo(p.x + r * 0.26, y + r * 1.3, p.x + r * 0.05, y + r * 1.42); g.quadraticCurveTo(p.x - r * 0.16, y + r * 1.3, p.x - r * 0.18, y + r * 1.0); g.fill(); g.stroke();
    },
    // Wisp: flicks a lighter, lights a cigar and blows smoke rings
    4(g, x, y, r, k, t, draw, H, at) {
      const P = H(-0.95, -0.55, 175), p = at(P), mouth = { x: x + r * 0.55, y: y - r * 0.08 };
      draw({ mood: 'smug', hands: { n: k < 0.35 ? P : H(-0.9, 0.1, 100), f: H(0.7, 0.2, 80) } });
      g.fillStyle = '#6a4024'; g.save(); g.translate(mouth.x, mouth.y); g.rotate(0.15); MGH.rr(g, 0, -r * 0.05, r * 0.42, r * 0.1, r * 0.04); g.fill(); g.fillStyle = '#c8a060'; g.fillRect(r * 0.08, -r * 0.05, r * 0.05, r * 0.1);
      if (k > 0.22) { g.fillStyle = '#ff7a2a'; g.beginPath(); g.arc(r * 0.42, 0, r * 0.05, 0, 7); g.fill(); } g.restore();
      if (k < 0.35) { g.fillStyle = '#c8c8d0'; MGH.rr(g, p.x - r * 0.08, p.y - r * 0.05, r * 0.16, r * 0.24, r * 0.03); g.fill(); if (k > 0.1) MGH.flame(g, p.x, p.y - r * 0.1, r * 0.006, t, 7); }
      for (let q = 0; q < 4; q++) { const ph = ((k - 0.35) * 2.4 + q * 0.25) % 1; if (k < 0.35) break; g.strokeStyle = `rgba(220,220,230,${0.75 * (1 - ph)})`; g.lineWidth = r * 0.05; g.beginPath(); g.ellipse(mouth.x + r * 0.5 + ph * r * 0.8, mouth.y - r * 0.2 - ph * r * 1.4, r * (0.12 + ph * 0.22), r * (0.08 + ph * 0.12), 0, 0, 7); g.stroke(); }
    },
    // Mizzle: pops open an umbrella and splashes in the puddles
    5(g, x, y, r, k, t, draw, H, at) {
      const hop = Math.abs(Math.sin(t * 5)) * r * 0.3, P = H(0.3, -1.6, -90), p = at(P, y - hop);
      for (let q = 0; q < 24; q++) { const dx = (MGH.hash(q) - 0.5) * r * 5, dy = ((t * 1.5 + MGH.hash(q + 3)) % 1) * r * 4 - r * 2.4; if (Math.abs(dx) < r * 1.1 && dy < -r * 0.2) continue; g.strokeStyle = 'rgba(140,190,255,0.7)'; g.lineWidth = r * 0.03; g.beginPath(); g.moveTo(x + dx, y + dy); g.lineTo(x + dx - r * 0.05, y + dy + r * 0.2); g.stroke(); }
      g.fillStyle = 'rgba(100,160,230,0.5)'; g.beginPath(); g.ellipse(x, y + r * 1.32, r * 1.1, r * 0.2, 0, 0, 7); g.fill();
      if (hop < r * 0.05) for (let q = 0; q < 6; q++) { g.fillStyle = 'rgba(140,200,255,0.8)'; g.beginPath(); g.arc(x + (q - 2.5) * r * 0.35, y + r * 1.1 - MGH.hash(q) * r * 0.3, r * 0.05, 0, 7); g.fill(); }
      draw({ y: y - hop, mood: 'cheer', hands: { n: H(-1.2, -0.6, -110, 1), f: P } });
      g.strokeStyle = '#5a3a20'; g.lineWidth = r * 0.05; g.beginPath(); g.moveTo(p.x, p.y + r * 0.3); g.lineTo(p.x, p.y - r * 0.9); g.stroke();
      g.save(); g.translate(p.x, p.y - r * 0.9); for (let q = 0; q < 6; q++) { g.fillStyle = q % 2 ? '#ffd23a' : '#4a6a8f'; g.beginPath(); g.moveTo(0, 0); g.arc(0, r * 0.05, r * 1.1, Math.PI + q * Math.PI / 6, Math.PI + (q + 1) * Math.PI / 6); g.closePath(); g.fill(); } g.restore();
    },
    // Flint: hoists a huge boulder, hurls it away, then flexes
    6(g, x, y, r, k, t, draw, H) {
      if (k < 0.55) {
        const lift = this.ease(k / 0.35); draw({ mood: 'effort', hands: { n: H(-0.6, 0.2 - lift * 1.9, -95), f: H(0.4, 0.2 - lift * 1.9, -85) } });
        MGH.rock(g, x, y - r * (0.2 + lift * 1.9), r * 0.95, 3, '#8a8478');
      } else {
        const q = (k - 0.55) / 0.45; if (q < 0.4) MGH.rock(g, x - q * r * 12, y - r * 2.1 - q * r * 4, r * 0.95 * (1 - q), 3, '#8a8478', q * 6);
        draw({ mood: 'stoic', hands: { n: H(-1.14, -0.78, -78), f: H(1.04, -0.78, -102) } });
        if (q > 0.3) MGH.text(g, '💪', x + r * 1.2, y - r * 1.2, r * 0.6, '#fff');
      }
    },
    // Blossom: blows a kiss under a shower of petals and hearts
    7(g, x, y, r, k, t, draw, H, at) {
      const kiss = k > 0.25 && k < 0.6, P = kiss ? H(-0.75 - (k - 0.25) * 2, -0.9, -150, 1) : H(-0.5, 0.2, 140);
      draw({ mood: 'love', hands: { n: P, f: H(0.3, -1.4, -80, 1) } });
      for (let q = 0; q < 18; q++) { const ph = (t * 0.4 + MGH.hash(q)) % 1; g.fillStyle = q % 3 ? '#ff9ac8' : '#ffd0e2'; g.save(); g.translate(x + (MGH.hash(q + 4) - 0.5) * r * 4 + Math.sin(t * 2 + q) * r * 0.3, y - r * 2.2 + ph * r * 3.6); g.rotate(t * 2 + q); g.beginPath(); g.ellipse(0, 0, r * 0.08, r * 0.045, 0, 0, 7); g.fill(); g.restore(); }
      if (k > 0.35) { const q = (k - 0.35) / 0.65; MGH.heart(g, x + r * (0.8 + q * 2), y - r * (0.5 + q * 1.2), r * 0.06 * (1 + q), `rgba(255,60,120,${1 - q})`); }
    },
    // Frost: skates a slide-spin, then the shades come down — deal with it
    8(g, x, y, r, k, t, draw, H) {
      const slide = k < 0.4 ? Math.sin(k / 0.4 * Math.PI) * r * 1.2 : 0, spin = k < 0.4 ? Math.cos(k / 0.4 * Math.PI * 4) : 1;
      g.fillStyle = 'rgba(200,235,255,0.6)'; g.beginPath(); g.ellipse(x, y + r * 1.3, r * 2, r * 0.25, 0, 0, 7); g.fill();
      draw({ x: x + slide, mood: k > 0.55 ? 'smug' : 'proud', look: { x: spin, y: 0 }, hands: k > 0.6 ? { n: H(-0.2, 0.25, 120), f: H(0.6, 0.25, 80) } : undefined });
      if (k > 0.45) { const d = this.ease((k - 0.45) / 0.15), sx = x + slide + r * 0.36, sy = y - r * 0.95 + d * r * 0.7; g.fillStyle = '#10141c'; g.beginPath(); g.ellipse(sx, sy, r * 0.17, r * 0.12, 0.1, 0, 7); g.fill(); g.fillRect(sx - r * 0.5, sy - r * 0.03, r * 0.5, r * 0.05); g.fillStyle = 'rgba(160,220,255,0.6)'; g.beginPath(); g.ellipse(sx - r * 0.04, sy - r * 0.04, r * 0.06, r * 0.025, -0.3, 0, 7); g.fill(); if (k > 0.65) MGH.text(g, 'deal with it', x + r * 0.4, y - r * 1.7, r * 0.3, '#bfe8ff', 'center', 'bold'); }
    },
    // Volt: struck by lightning — frizzled, smoking, and loving it
    9(g, x, y, r, k, t, draw, H) {
      const strike = k > 0.15 && k < 0.3;
      if (strike) { MGH.glow(g, x, y - r * 0.5, r * 3, 'rgba(255,255,200,0.6)'); g.strokeStyle = '#fff6a0'; g.lineWidth = r * 0.12; g.beginPath(); g.moveTo(x + r * 0.3, y - r * 4); g.lineTo(x - r * 0.2, y - r * 2.6); g.lineTo(x + r * 0.4, y - r * 2.4); g.lineTo(x, y - r * 1.1); g.stroke(); }
      const fried = k > 0.2;
      draw({ mood: strike ? 'shock' : fried ? 'starry' : 'determined', x: x + (strike ? Math.sin(t * 80) * r * 0.08 : 0), hands: fried ? { n: H(-1.1, -1.0, -95, 0), f: H(0.8, 0.2, 80) } : undefined });
      if (fried) { for (let q = 0; q < 6; q++) { const a = -Math.PI / 2 + (q - 2.5) * 0.4; g.strokeStyle = '#fff36a'; g.lineWidth = r * 0.04; g.beginPath(); g.moveTo(x + Math.cos(a) * r * 0.85, y - r * 0.3 + Math.sin(a) * r * 0.85); g.lineTo(x + Math.cos(a) * r * 1.15, y - r * 0.3 + Math.sin(a) * r * 1.15 + (q % 2 ? r * 0.1 : -r * 0.1)); g.stroke(); } for (let q = 0; q < 3; q++) { const ph = (t * 0.8 + q / 3) % 1; g.fillStyle = `rgba(90,90,100,${0.5 * (1 - ph)})`; g.beginPath(); g.arc(x - r * 0.3 + q * r * 0.3, y - r * 1.1 - ph * r * 1.2, r * (0.12 + ph * 0.2), 0, 7); g.fill(); } MGH.text(g, '👍', x + r * 1.0, y - r * 0.9, r * 0.5, '#fff'); }
    },
    // Dune: digs up a treasure chest full of gold
    10(g, x, y, r, k, t, draw, H, at) {
      g.fillStyle = '#e0c48a'; g.beginPath(); g.ellipse(x + r * 1.4, y + r * 1.2, r * 1.1, r * 0.35, 0, Math.PI, 0); g.fill();
      if (k < 0.45) { const dig = Math.sin(t * 9) > 0; const P = H(-0.9, dig ? 0.4 : -0.4, dig ? 120 : 160); draw({ mood: 'effort', hands: { n: P, f: H(0.6, 0.2, 80) } }); const p = at(P); g.strokeStyle = '#8a5a32'; g.lineWidth = r * 0.08; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x + r * 0.7, p.y + r * 0.6); g.stroke(); if (dig) MGH.burst && null; for (let q = 0; q < 3; q++) { g.fillStyle = 'rgba(200,170,110,0.8)'; g.beginPath(); g.arc(x + r * (1.2 + q * 0.2), y + r * (0.6 - Math.abs(Math.sin(t * 9 + q)) * 0.6), r * 0.06, 0, 7); g.fill(); } }
      else {
        const open = this.ease((k - 0.45) / 0.2);
        g.fillStyle = '#8a5a2a'; MGH.rr(g, x + r * 0.9, y + r * 0.6, r * 1.0, r * 0.65, r * 0.08); g.fill(); g.fillStyle = '#ffd34d'; g.fillRect(x + r * 0.9, y + r * 0.8, r * 1.0, r * 0.08);
        if (open > 0.3) { MGH.glow(g, x + r * 1.4, y + r * 0.5, r * 1.6, `rgba(255,220,100,${0.6 * open})`); for (let q = 0; q < 5; q++) MGH.coin(g, x + r * (1.1 + q * 0.15), y + r * (0.55 - Math.abs(Math.sin(t * 3 + q)) * 0.6 * open), r * 0.12, t * 4 + q); }
        g.save(); g.translate(x + r * 0.9, y + r * 0.6); g.rotate(-open * 1.2); g.fillStyle = '#a06a32'; MGH.rr(g, 0, -r * 0.3, r * 1.0, r * 0.32, r * 0.12); g.fill(); g.restore();
        draw({ mood: 'starry', hands: { n: H(-1.2, -1.4, -100, 1), f: H(1.0, -1.7, -70, 1) } });
      }
    },
    // Cinder: arms crossed while a volcano erupts behind
    11(g, x, y, r, k, t, draw, H) {
      const vg = g.createLinearGradient(x - r * 2.4, 0, x + r * 0.3, 0); vg.addColorStop(0, '#2a1a18'); vg.addColorStop(0.55, '#5a3428'); vg.addColorStop(1, '#3a2420');
      g.fillStyle = vg; g.beginPath(); g.moveTo(x - r * 2.6, y + r * 1.3); g.quadraticCurveTo(x - r * 1.9, y - r * 0.2, x - r * 1.5, y - r * 1.55); g.lineTo(x - r * 0.7, y - r * 1.55); g.quadraticCurveTo(x - r * 0.2, y - r * 0.2, x + r * 0.4, y + r * 1.3); g.closePath(); g.fill();
      g.fillStyle = '#ff6a1f'; g.beginPath(); g.ellipse(x - r * 1.1, y - r * 1.55, r * 0.4, r * 0.1, 0, 0, 7); g.fill();
      g.strokeStyle = 'rgba(255,110,30,0.85)'; g.lineWidth = r * 0.08; g.lineCap = 'round'; for (const [dx, len] of [[-1.3, 1.1], [-0.95, 0.8]]) { g.beginPath(); g.moveTo(x + r * dx, y - r * 1.5); g.quadraticCurveTo(x + r * (dx - 0.15), y - r * (1.5 - len * 0.5), x + r * (dx + 0.05), y - r * (1.5 - len)); g.stroke(); }
      const er = k > 0.2 ? Math.min(1, (k - 0.2) * 3) : 0;
      if (er > 0) { MGH.glow(g, x - r * 1.1, y - r * 1.8, r * 2 * er, 'rgba(255,120,40,0.5)'); for (let q = 0; q < 12; q++) { const ph = (t * 0.9 + MGH.hash(q)) % 1; g.fillStyle = `rgba(255,${120 + q * 10},40,${1 - ph})`; g.beginPath(); g.arc(x - r * 1.1 + (MGH.hash(q + 3) - 0.5) * r * 2.4 * ph, y - r * 1.7 - Math.sin(ph * Math.PI) * r * 2.2 * er, r * 0.1 * (1 - ph * 0.5), 0, 7); g.fill(); } }
      draw({ mood: 'smug', hands: { n: H(-0.42, 0.02, 175), f: H(-0.2, -0.05, 175) }, look: { x: 1, y: 0.2 } });
    },
    // Lumi: waves a magic wand into a burst of stars
    12(g, x, y, r, k, t, draw, H, at) {
      const sw = Math.sin(t * 6) * 0.6, P = H(-1.1, -1.0 + sw * 0.2, -120 + sw * 30), p = at(P);
      draw({ mood: 'proud', hands: { n: P, f: H(0.8, 0.2, 80) } });
      const tip = { x: p.x + r * 0.5, y: p.y - r * 0.6 }; g.strokeStyle = '#5a3a20'; g.lineWidth = r * 0.06; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(tip.x, tip.y); g.stroke();
      MGH.star(g, tip.x, tip.y, r * 0.14, '#ffd34d', t * 3, true);
      for (let q = 0; q < 10; q++) { const ph = (t * 0.7 + q / 10) % 1, a = q * 2.4; MGH.star(g, tip.x + Math.cos(a) * ph * r * 2, tip.y + Math.sin(a) * ph * r * 2 - ph * r * 0.5, r * 0.08 * (1 - ph), ['#ffe680', '#8fe0ff', '#ff9ad0'][q % 3], t + q, false); }
    },
    // Nyx: vanishes in a puff of smoke among bats, then reappears
    13(g, x, y, r, k, t, draw, H) {
      g.fillStyle = '#fff3b0'; g.beginPath(); g.arc(x - r * 1.4, y - r * 1.6, r * 0.6, 0.6, Math.PI * 2 - 0.6); g.arc(x - r * 1.1, y - r * 1.7, r * 0.5, Math.PI * 2 - 0.9, 0.9, true); g.closePath(); g.fill();
      const gone = k > 0.35 && k < 0.6, alpha = k < 0.3 ? 1 : k < 0.35 ? 1 - (k - 0.3) / 0.05 : gone ? 0 : Math.min(1, (k - 0.6) / 0.08);
      if (alpha > 0) draw({ mood: k > 0.6 ? 'evil' : 'smug', alpha, hands: k > 0.65 ? { n: H(-1.2, -0.9, -110, 1), f: H(1.0, -0.9, -70, 1) } : undefined });
      if (k > 0.28 && k < 0.7) { const q = (k - 0.28) / 0.42; for (let s = 0; s < 6; s++) { g.fillStyle = `rgba(60,40,90,${0.6 * (1 - q)})`; g.beginPath(); g.arc(x + Math.cos(s) * r * q * 1.2, y + Math.sin(s) * r * q * 0.8, r * (0.4 + q * 0.5), 0, 7); g.fill(); } }
      for (let b = 0; b < 5; b++) { const a = t * 2 + b * 1.25, bx = x + Math.cos(a) * r * 1.6, by = y - r * 0.6 + Math.sin(a * 1.3) * r * 0.9, f = Math.sin(t * 20 + b) * r * 0.12; g.fillStyle = '#1a1030'; g.beginPath(); g.moveTo(bx, by); g.quadraticCurveTo(bx - r * 0.2, by - r * 0.15 - f, bx - r * 0.32, by + f * 0.3); g.quadraticCurveTo(bx - r * 0.15, by, bx, by + r * 0.06); g.quadraticCurveTo(bx + r * 0.15, by, bx + r * 0.32, by + f * 0.3); g.quadraticCurveTo(bx + r * 0.2, by - r * 0.15 - f, bx, by); g.fill(); }
    },
    // Rivet: twirls a wrench; a little robot buddy pops up for a high-five
    14(g, x, y, r, k, t, draw, H, at) {
      const rb = { x: x + r * 1.6, y: y + r * 0.5 }, up = this.ease((k - 0.2) / 0.2);
      if (k > 0.2) { const ry = rb.y + (1 - up) * r; g.fillStyle = '#9aa6b4'; MGH.rr(g, rb.x - r * 0.4, ry - r * 0.5, r * 0.8, r * 0.75, r * 0.15); g.fill(); g.fillStyle = '#5a6676'; MGH.rr(g, rb.x - r * 0.3, ry - r * 0.4, r * 0.6, r * 0.32, r * 0.1); g.fill(); g.fillStyle = '#8fffb0'; g.beginPath(); g.arc(rb.x - r * 0.13, ry - r * 0.25, r * 0.06, 0, 7); g.arc(rb.x + r * 0.13, ry - r * 0.25, r * 0.06, 0, 7); g.fill(); g.strokeStyle = '#5a6676'; g.lineWidth = r * 0.05; g.beginPath(); g.moveTo(rb.x, ry - r * 0.5); g.lineTo(rb.x, ry - r * 0.75); g.stroke(); g.fillStyle = '#ff5a3a'; g.beginPath(); g.arc(rb.x, ry - r * 0.78, r * 0.06, 0, 7); g.fill(); const fist = k > 0.6 && k < 0.75 ? -r * 0.55 : -r * 0.2; g.fillStyle = '#c8d0da'; g.beginPath(); g.arc(rb.x - r * 0.5, ry + fist, r * 0.12, 0, 7); g.fill(); }
      const five = k > 0.6 && k < 0.75, spin = t * 10;
      const P = five ? H(-1.45, -0.6, -150, 1) : H(-1.1, -0.6, -110, 0), p = at(P);
      draw({ mood: five ? 'cheer' : 'laugh', hands: { n: P, f: H(0.8, 0.2, 80) } });
      if (!five) { g.save(); g.translate(p.x, p.y); g.rotate(spin); g.fillStyle = '#b8c2ce'; g.fillRect(-r * 0.04, -r * 0.4, r * 0.08, r * 0.8); g.beginPath(); g.arc(0, -r * 0.42, r * 0.1, 0, 7); g.arc(0, r * 0.42, r * 0.1, 0, 7); g.fill(); g.restore(); }
      if (five) MGH.text(g, '✋ HIGH FIVE!', x + r * 1.0, y - r * 1.5, r * 0.32, '#ffe680', 'center', 'bold');
    },
  },
});

// ======================================================================== NPCs
// Hosts, referees and helpers are the same round species as the heroes, but never one of the 15 playable heroes.
// kind: 'ref' (striped referee), 'host' (tuxedo + top hat), 'chef', 'guard'. o: any Char.draw options.
Char.NPC = { ref: 15, host: 16, chef: 17, guard: 18 };
Char.npc = function (g, x, y, r, kind = 'host', o = {}) {
  const id = Char.NPC[kind] !== undefined ? Char.NPC[kind] : 16, mood = { shout: 'cheer', shock: 'shock', smug: 'smug' }[o.mood] || o.mood || 'happy';
  Char.draw(g, x, y, r, id, '#ffffff', Object.assign({ seed: 5 + id, look: { x: 0, y: 0 } }, o, { mood }));
};
