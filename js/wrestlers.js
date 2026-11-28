'use strict';
// The Ring Legends (heroes 15-19): original wrestling-crossover characters.
// Their hair, masks, crowns and beards are drawn in the head's own frame — a circle of radius r at the
// origin, face to the left, eye at (-0.42r, -0.11r) — so every piece hugs the head exactly.
(() => {
  const ang = (a, R) => [Math.cos(a) * R, Math.sin(a) * R];
  const grad = (g, y0, y1, c0, c1) => { const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, c0); gr.addColorStop(1, c1); return gr; };

  const HEAD = {
    // Brick: shaved head with a thick spiked mohawk that grows out of the scalp along the crown
    15(g, r, t) {
      // shaved stubble shading on the scalp
      g.save(); g.beginPath(); g.arc(0, 0, r, 0, 7); g.clip();
      g.fillStyle = 'rgba(60,30,20,0.13)'; g.beginPath(); g.arc(0, 0, r, Math.PI * 1.08, Math.PI * 1.95); g.lineTo(0, -r * 0.2); g.fill();
      g.restore();
      const a0 = -2.25, a1 = -0.3, N = 7, base = r * 0.86;
      const path = () => { g.beginPath(); let [x, y] = ang(a0, base); g.moveTo(x, y);
        for (let k = 0; k < N; k++) { const aa = a0 + (a1 - a0) * (k + 0.5) / N, ab = a0 + (a1 - a0) * (k + 1) / N, H = r * (1.42 - 0.09 * Math.abs(k - 2.2)) + Math.sin(t * 3 + k) * r * 0.015;
          [x, y] = ang(aa - 0.05, H); g.lineTo(x, y); [x, y] = ang(ab, r * 1.06); g.lineTo(x, y); }
        [x, y] = ang(a1, base); g.lineTo(x, y); g.arc(0, 0, base, a1, a0, true); g.closePath(); };
      g.fillStyle = grad(g, -r * 1.4, -r * 0.6, '#ff6a5a', '#b8141e'); g.strokeStyle = '#6a0a10'; g.lineWidth = Math.max(1, r * 0.045); g.lineJoin = 'round'; path(); g.fill(); g.stroke();
      g.strokeStyle = 'rgba(255,200,190,0.55)'; g.lineWidth = Math.max(0.8, r * 0.03); g.beginPath(); g.arc(0, 0, r * 1.12, a0 + 0.25, a1 - 0.4); g.stroke();
    },
    // Rayo: a full luchador mask — colour over the whole head, eye and mouth openings, trims, crest and back lacing
    16(g, r, t) {
      const ex = -r * 0.42, ey = -r * 0.11;
      g.save(); g.beginPath(); g.arc(0, 0, r * 1.005, 0, 7); g.clip();
      g.beginPath(); g.rect(-r * 1.2, -r * 1.2, r * 2.4, r * 2.4); g.ellipse(ex, ey, r * 0.25, r * 0.31, 0, 0, 7); g.ellipse(-r * 0.72, r * 0.5, r * 0.42, r * 0.3, -0.2, 0, 7);
      g.fillStyle = grad(g, -r, r, '#5af0a0', '#159a52'); g.fill('evenodd');
      // red flame swoosh from the eye to the back of the head
      g.fillStyle = '#e8323e'; g.beginPath(); g.moveTo(ex + r * 0.2, ey - r * 0.22); g.quadraticCurveTo(r * 0.3, -r * 0.6, r * 1.0, -r * 0.45); g.quadraticCurveTo(r * 0.45, -r * 0.3, r * 0.95, -r * 0.05); g.quadraticCurveTo(r * 0.35, -r * 0.05, ex + r * 0.24, ey + r * 0.05); g.closePath(); g.fill();
      // gold trims
      g.strokeStyle = '#ffd34d'; g.lineWidth = Math.max(1.2, r * 0.07); g.beginPath(); g.ellipse(ex, ey, r * 0.27, r * 0.33, 0, 0, 7); g.stroke();
      g.beginPath(); g.ellipse(-r * 0.72, r * 0.5, r * 0.44, r * 0.32, -0.2, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
      // white diamond on the forehead
      g.fillStyle = '#fff'; g.beginPath(); g.moveTo(-r * 0.2, -r * 0.82); g.lineTo(-r * 0.08, -r * 0.6); g.lineTo(-r * 0.2, -r * 0.42); g.lineTo(-r * 0.32, -r * 0.6); g.closePath(); g.fill();
      // laces at the back
      g.strokeStyle = '#ffd34d'; g.lineWidth = Math.max(0.8, r * 0.03); for (let k = 0; k < 4; k++) { const y = -r * 0.1 + k * r * 0.16; g.beginPath(); g.moveTo(r * 0.78, y); g.lineTo(r * 0.92, y + r * 0.12); g.moveTo(r * 0.92, y); g.lineTo(r * 0.78, y + r * 0.12); g.stroke(); }
      g.restore();
      // the nose is masked too
      g.fillStyle = '#2ac070'; g.strokeStyle = '#0e6a38'; g.lineWidth = Math.max(0.8, r * 0.035); g.beginPath(); g.arc(-r * 0.97, -r * 0.02, r * 0.17, 0, 7); g.fill(); g.beginPath(); g.arc(-r * 0.97, -r * 0.02, r * 0.17, 1.66, 4.62); g.stroke();
      // a small gold crest seated on the crown
      g.fillStyle = grad(g, -r * 1.3, -r * 0.9, '#fff3b0', '#e0a800'); g.strokeStyle = '#8a6200'; g.lineWidth = Math.max(0.8, r * 0.035);
      g.beginPath(); const [x0, y0] = ang(-2.0, r * 0.97), [x1, y1] = ang(-1.0, r * 0.97); g.moveTo(x0, y0); g.quadraticCurveTo(-r * 0.25, -r * 1.42, r * 0.15, -r * 1.32); g.quadraticCurveTo(r * 0.2, -r * 1.1, x1, y1); g.arc(0, 0, r * 0.97, -1.0, -2.0, true); g.fill(); g.stroke();
    },
    // Duke: a glossy blond pompadour hugging the scalp, with a small crown seated on top
    17(g, r, t) {
      g.fillStyle = grad(g, -r * 1.25, -r * 0.2, '#fff0a0', '#d89a20'); g.strokeStyle = '#8a5a10'; g.lineWidth = Math.max(1, r * 0.04); g.lineJoin = 'round';
      g.beginPath(); g.moveTo(-r * 0.86, -r * 0.48);
      g.bezierCurveTo(-r * 1.18, -r * 0.7, -r * 1.02, -r * 1.22, -r * 0.45, -r * 1.2);   // the quiff rolls forward over the brow
      g.bezierCurveTo(-r * 0.1, -r * 1.3, r * 0.55, -r * 1.18, r * 0.88, -r * 0.7);
      g.quadraticCurveTo(r * 1.08, -r * 0.3, r * 0.98, r * 0.1);
      g.arc(0, 0, r * 0.99, Math.atan2(0.1, 0.98), -2.6, true); g.closePath(); g.fill(); g.stroke();
      // comb lines + shine
      g.strokeStyle = 'rgba(140,90,20,0.55)'; g.lineWidth = Math.max(0.7, r * 0.025); for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(-r * (0.8 - k * 0.12), -r * (0.62 + k * 0.1)); g.quadraticCurveTo(r * 0.1, -r * (1.12 - k * 0.08), r * (0.86 - k * 0.04), -r * (0.5 - k * 0.15)); g.stroke(); }
      g.fillStyle = 'rgba(255,255,255,0.6)'; g.beginPath(); g.ellipse(-r * 0.45, -r * 1.05, r * 0.25, r * 0.07, -0.2, 0, 7); g.fill();
      // crown, its base following the top of the hair
      g.save(); g.translate(r * 0.12, -r * 1.2); g.rotate(0.12); const w = r * 0.42, h = r * 0.34, gl = 0.5 + 0.5 * Math.sin(t * 3);
      g.fillStyle = grad(g, -h, 0, '#fff3b0', '#e0a800'); g.strokeStyle = '#7a5800'; g.beginPath(); g.moveTo(-w, r * 0.04); g.lineTo(-w * 1.08, -h); g.lineTo(-w * 0.5, -h * 0.45); g.lineTo(0, -h * 1.15); g.lineTo(w * 0.5, -h * 0.45); g.lineTo(w * 1.08, -h); g.lineTo(w, r * 0.04); g.quadraticCurveTo(0, r * 0.12, -w, r * 0.04); g.fill(); g.stroke();
      g.fillStyle = '#e8323e'; g.beginPath(); g.arc(0, -h * 0.18, r * 0.065, 0, 7); g.fill(); g.fillStyle = '#5ab8ff'; g.beginPath(); g.arc(-w * 0.6, -h * 0.1, r * 0.045, 0, 7); g.arc(w * 0.6, -h * 0.1, r * 0.045, 0, 7); g.fill();
      g.fillStyle = `rgba(255,255,255,${0.4 + 0.5 * gl})`; for (const [x, y] of [[-w * 1.08, -h], [0, -h * 1.15], [w * 1.08, -h]]) { g.beginPath(); g.arc(x, y, r * 0.045, 0, 7); g.fill(); }
      g.restore();
    },
    // Viper: long straight black hair from a side parting, falling down behind the head
    18(g, r, t) {
      const sw = Math.sin(t * 1.8) * r * 0.04;
      g.fillStyle = grad(g, -r * 1.1, r * 1.3, '#3a4a3a', '#0a0e0a'); g.strokeStyle = '#000'; g.lineWidth = Math.max(1, r * 0.04); g.lineJoin = 'round';
      g.beginPath(); g.moveTo(-r * 0.9, -r * 0.44);
      g.bezierCurveTo(-r * 0.98, -r * 0.95, -r * 0.45, -r * 1.12, r * 0.05, -r * 1.1);
      g.bezierCurveTo(r * 0.75, -r * 1.05, r * 1.12, -r * 0.55, r * 1.1, r * 0.1);
      g.bezierCurveTo(r * 1.12 + sw, r * 0.6, r * 1.02 + sw, r * 1.05, r * 0.9 + sw, r * 1.35);
      g.lineTo(r * 0.62 + sw, r * 1.22); g.bezierCurveTo(r * 0.7, r * 0.8, r * 0.72, r * 0.35, r * 0.6, r * 0.05);
      g.bezierCurveTo(r * 0.45, -r * 0.35, r * 0.0, -r * 0.5, -r * 0.42, -r * 0.5);  // hairline sits above the brow
      g.quadraticCurveTo(-r * 0.7, -r * 0.5, -r * 0.9, -r * 0.44); g.closePath(); g.fill(); g.stroke();
      g.strokeStyle = 'rgba(122,223,58,0.35)'; g.lineWidth = Math.max(0.7, r * 0.025); for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(-r * (0.5 - k * 0.25), -r * (1.0 - k * 0.04)); g.bezierCurveTo(r * (0.5 + k * 0.08), -r * 0.9, r * (0.95 - k * 0.05), -r * 0.2, r * (0.9 - k * 0.06) + sw, r * (0.9 + k * 0.08)); g.stroke(); }
      g.fillStyle = 'rgba(255,255,255,0.22)'; g.beginPath(); g.ellipse(-r * 0.25, -r * 0.92, r * 0.3, r * 0.06, -0.25, 0, 7); g.fill();
    },
    // Tank wears the clan headwrap as a stars-and-stripes bandana (it already hugs the head), plus a big beard
    19() {},
  };
  const FACE = {
    15(g, r) { // heavy brow, stubble and a scar
      const ex = -r * 0.42, ey = -r * 0.11, lw = Math.max(0.8, r * 0.035);
      g.strokeStyle = '#2a1410'; g.lineWidth = lw * 2.4; g.lineCap = 'round'; g.beginPath(); g.moveTo(ex - r * 0.22, ey - r * 0.3); g.lineTo(ex + r * 0.22, ey - r * 0.35); g.stroke();
      g.save(); g.beginPath(); g.arc(0, 0, r, 0, 7); g.clip(); g.fillStyle = 'rgba(60,40,30,0.38)'; for (let q = 0; q < 30; q++) { g.beginPath(); g.arc(-r * 0.98 + MGHash(q) * r * 0.62, r * (0.22 + MGHash(q + 9) * 0.5), r * 0.014, 0, 7); g.fill(); } g.restore();
      g.strokeStyle = 'rgba(170,70,70,0.85)'; g.lineWidth = lw; g.beginPath(); g.moveTo(-r * 0.18, -r * 0.42); g.lineTo(-r * 0.06, -r * 0.12); g.stroke(); for (let q = 0; q < 3; q++) { g.beginPath(); g.moveTo(-r * 0.19 + q * r * 0.045, -r * (0.36 - q * 0.08)); g.lineTo(-r * 0.09 + q * r * 0.045, -r * (0.38 - q * 0.08)); g.stroke(); }
    },
    17(g, r, t) { // gold-rimmed shades
      const ex = -r * 0.42, ey = -r * 0.11, lw = Math.max(0.8, r * 0.035);
      g.fillStyle = '#1a1a2a'; g.strokeStyle = '#ffd34d'; g.lineWidth = lw; g.beginPath(); rrPath(g, ex - r * 0.3, ey - r * 0.16, r * 0.56, r * 0.27, r * 0.1); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(ex + r * 0.26, ey - r * 0.08); g.lineTo(r * 0.45, ey - r * 0.12); g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.55)'; g.beginPath(); g.ellipse(ex - r * 0.12, ey - r * 0.06, r * 0.08, r * 0.03, -0.4, 0, 7); g.fill();
      if (((t * 0.7) % 3) < 0.2 && typeof MGH !== 'undefined') MGH.star(g, ex + r * 0.15, ey - r * 0.12, r * 0.1, '#fff', t * 8, false);
    },
    18(g, r) { // cold war paint across the eye, two fang stripes down the cheek
      const ex = -r * 0.42, ey = -r * 0.11;
      g.save(); g.beginPath(); g.arc(0, 0, r, 0, 7); g.clip();
      g.fillStyle = 'rgba(16,26,16,0.72)'; g.beginPath(); g.moveTo(ex - r * 0.36, ey - r * 0.28); g.quadraticCurveTo(ex, ey - r * 0.42, ex + r * 0.34, ey - r * 0.24); g.lineTo(ex + r * 0.22, ey + r * 0.3); g.quadraticCurveTo(ex, ey + r * 0.2, ex - r * 0.26, ey + r * 0.22); g.closePath(); g.fill();
      g.fillStyle = '#7adf3a'; for (const dx of [-0.08, 0.1]) { g.beginPath(); g.moveTo(ex + r * dx - r * 0.035, ey + r * 0.26); g.lineTo(ex + r * dx + r * 0.035, ey + r * 0.26); g.lineTo(ex + r * dx, ey + r * 0.55); g.closePath(); g.fill(); }
      g.restore();
    },
    19(g, r, t) { // a big bushy beard that grows from the jaw line, under the mouth
      const lw = Math.max(0.8, r * 0.035);
      g.fillStyle = grad(g, r * 0.4, r * 1.4, '#9a6030', '#5a3414'); g.strokeStyle = '#3a2010'; g.lineWidth = lw; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(-r * 0.89, r * 0.45); g.quadraticCurveTo(-r * 0.55, r * 0.66, -r * 0.1, r * 0.6); g.quadraticCurveTo(r * 0.25, r * 0.58, r * 0.42, r * 0.9);
      g.bezierCurveTo(r * 0.25, r * 1.35, -r * 0.45, r * 1.5, -r * 0.88, r * 1.08); g.quadraticCurveTo(-r * 1.08, r * 0.75, -r * 0.89, r * 0.45); g.closePath(); g.fill(); g.stroke();
      g.strokeStyle = 'rgba(40,20,8,0.5)'; for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(-r * (0.85 - k * 0.15), r * 0.7); g.quadraticCurveTo(-r * (0.8 - k * 0.15), r * 1.0, -r * (0.65 - k * 0.12), r * 1.2); g.stroke(); }
      // handlebar moustache just above the mouth
      g.fillStyle = '#6a3a18'; g.beginPath(); g.moveTo(-r * 1.0, r * 0.2); g.quadraticCurveTo(-r * 0.85, r * 0.12, -r * 0.66, r * 0.2); g.quadraticCurveTo(-r * 0.52, r * 0.12, -r * 0.42, r * 0.06); g.quadraticCurveTo(-r * 0.45, r * 0.26, -r * 0.66, r * 0.27); g.quadraticCurveTo(-r * 0.86, r * 0.3, -r * 1.0, r * 0.26); g.closePath(); g.fill();
    },
  };

  const face0 = Char.faceAcc.bind(Char);
  Char.faceAcc = function (g, r, el, mood, t, seed) {
    if (el < 15 || el > 19 || r < 4) return face0(g, r, el, mood, t, seed);
    g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
    if (FACE[el]) FACE[el](g, r, t);
    if (HEAD[el]) HEAD[el](g, r, t);
    g.restore();
  };

  // championship belts on the Ring Legends' waists
  const out0 = Char.outfit.bind(Char);
  Char.outfit = function (g, r, el) {
    out0(g, r, el); const O = this.OUTFIT[el]; if (!O || !O.belt || r < 6) return;
    const rx = r * 0.68, ry = r * 0.6, y = ry * 0.3;
    g.save(); g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, 7); g.clip();
    g.fillStyle = '#2a1a10'; g.fillRect(-rx * 1.1, y - r * 0.07, rx * 2.2, r * 0.14);
    const gr = g.createLinearGradient(0, y - r * 0.2, 0, y + r * 0.2); gr.addColorStop(0, '#fff3b0'); gr.addColorStop(0.5, '#ffc83a'); gr.addColorStop(1, '#a87800');
    g.fillStyle = gr; g.strokeStyle = '#7a5800'; g.lineWidth = Math.max(0.8, r * 0.025); g.beginPath(); g.ellipse(-rx * 0.15, y, r * 0.24, r * 0.17, 0, 0, 7); g.fill(); g.stroke();
    g.fillStyle = '#e8323e'; g.beginPath(); g.arc(-rx * 0.15, y, r * 0.06, 0, 7); g.fill(); g.restore();
  };
})();
