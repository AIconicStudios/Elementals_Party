'use strict';
// The Ring Legends (heroes 15-19): original wrestling-crossover characters.
// Their head pieces, face details and championship belts, layered onto the shared character art.
(() => {
  const orn0 = Char.ornament.bind(Char);
  Char.ornament = function (g, r, kind, t, seed) {
    const lw = Math.max(1, r * 0.04); g.lineWidth = lw; g.lineJoin = 'round'; g.lineCap = 'round';
    if (kind === 'mohawk') { // a tall red spiked mohawk
      g.save(); g.translate(-r * 0.42, r * 0.04); g.fillStyle = '#e8323e'; g.strokeStyle = '#7a0a14';
      g.beginPath(); g.moveTo(-r * 0.95, r * 0.02);
      for (let k = 0; k <= 6; k++) { const a = Math.PI * (1 - k / 6), x = Math.cos(a) * r * 0.85, y = -Math.sin(a) * r * 0.5, sp = r * (0.36 + 0.06 * Math.sin(k * 2.3)); g.lineTo(x + Math.cos(a) * sp * 0.3, y - sp); g.lineTo(Math.cos(a - 0.26) * r * 0.85, -Math.sin(a - 0.26) * r * 0.5); }
      g.lineTo(r * 0.85, r * 0.02); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.3)'; g.beginPath(); g.ellipse(-r * 0.2, -r * 0.62, r * 0.25, r * 0.06, -0.2, 0, 7); g.fill(); g.restore();
    } else if (kind === 'crest') { // the luchador mask's fin crest with flames
      g.save(); g.translate(-r * 0.42, r * 0.3); g.fillStyle = '#ffd34d'; g.strokeStyle = '#a87800';
      g.beginPath(); g.moveTo(-r * 0.6, -r * 0.35); g.quadraticCurveTo(-r * 0.1, -r * 1.05, r * 0.55, -r * 0.55); g.quadraticCurveTo(r * 0.1, -r * 0.55, -r * 0.6, -r * 0.35); g.fill(); g.stroke();
      g.fillStyle = '#e8323e'; g.beginPath(); g.moveTo(-r * 0.4, -r * 0.45); g.quadraticCurveTo(0, -r * 0.85, r * 0.35, -r * 0.58); g.quadraticCurveTo(0, -r * 0.6, -r * 0.4, -r * 0.45); g.fill(); g.restore();
    } else if (kind === 'crown') { // a jewelled golden crown, tilted with swagger
      g.save(); g.translate(-r * 0.42, -r * 0.08); g.rotate(-0.12); const gl = 0.5 + 0.5 * Math.sin(t * 3 + seed);
      g.fillStyle = '#ffd34d'; g.strokeStyle = '#a87800'; g.beginPath(); g.moveTo(-r * 0.5, 0); g.lineTo(-r * 0.55, -r * 0.42); g.lineTo(-r * 0.27, -r * 0.2); g.lineTo(0, -r * 0.5); g.lineTo(r * 0.27, -r * 0.2); g.lineTo(r * 0.55, -r * 0.42); g.lineTo(r * 0.5, 0); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = '#e8323e'; g.beginPath(); g.arc(0, -r * 0.12, r * 0.08, 0, 7); g.fill(); g.fillStyle = '#5ab8ff'; g.beginPath(); g.arc(-r * 0.3, -r * 0.08, r * 0.05, 0, 7); g.arc(r * 0.3, -r * 0.08, r * 0.05, 0, 7); g.fill();
      for (const x of [-0.55, 0, 0.55]) { g.fillStyle = '#fff6c8'; g.beginPath(); g.arc(r * x, -r * (x ? 0.44 : 0.52), r * 0.05, 0, 7); g.fill(); }
      g.fillStyle = `rgba(255,255,255,${0.6 * gl})`; g.beginPath(); g.arc(-r * 0.2, -r * 0.3, r * 0.04, 0, 7); g.fill(); g.restore();
    } else if (kind === 'longhair') { // long black hair swept back
      g.save(); g.translate(-r * 0.42, r * 0.02); const sw = Math.sin(t * 2 + seed) * r * 0.05;
      g.fillStyle = '#1a1a22'; g.strokeStyle = '#000'; g.beginPath(); g.moveTo(-r * 0.95, r * 0.05); g.quadraticCurveTo(-r * 0.7, -r * 0.62, r * 0.2, -r * 0.55); g.quadraticCurveTo(r * 1.05, -r * 0.4, r * 1.1 + sw, r * 0.6); g.quadraticCurveTo(r * 1.25 + sw, r * 1.1, r * 0.9 + sw, r * 1.3); g.quadraticCurveTo(r * 0.8, r * 0.6, r * 0.5, r * 0.1); g.quadraticCurveTo(-r * 0.2, -r * 0.25, -r * 0.95, r * 0.05); g.fill(); g.stroke();
      g.strokeStyle = '#3a4a3a'; g.lineWidth = lw * 0.8; for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(-r * 0.4 + k * r * 0.35, -r * 0.45); g.quadraticCurveTo(r * 0.6 + k * r * 0.1, -r * 0.3, r * 0.9 + sw, r * (0.5 + k * 0.2)); g.stroke(); } g.restore();
    } else if (kind === 'bandana') { // a stars-and-stripes style bandana, knot tails flapping
      g.save(); g.translate(-r * 0.42, r * 0.04); const fl = Math.sin(t * 5 + seed) * 0.25;
      g.fillStyle = '#e8323e'; g.strokeStyle = '#7a0a14'; g.beginPath(); g.ellipse(0, -r * 0.08, r * 0.92, r * 0.48, 0, Math.PI, 0); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = '#fff'; for (let k = 0; k < 3; k++) { g.beginPath(); g.ellipse(0, -r * 0.1, r * (0.86 - k * 0.22), r * (0.4 - k * 0.1), 0, Math.PI * 1.15, Math.PI * 1.45); g.lineTo(0, -r * 0.1); g.fill(); }
      g.fillStyle = '#3a7aff'; g.beginPath(); g.ellipse(r * 0.35, -r * 0.3, r * 0.3, r * 0.16, 0.3, 0, 7); g.fill(); g.fillStyle = '#fff'; for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(r * (0.22 + k * 0.12), -r * (0.32 + (k % 2) * 0.05), r * 0.03, 0, 7); g.fill(); }
      g.fillStyle = '#e8323e'; g.save(); g.translate(r * 0.9, -r * 0.05); g.rotate(0.5 + fl); g.beginPath(); g.ellipse(r * 0.2, 0, r * 0.24, r * 0.08, 0, 0, 7); g.fill(); g.rotate(0.5 - fl * 1.5); g.beginPath(); g.ellipse(r * 0.18, r * 0.05, r * 0.2, r * 0.07, 0, 0, 7); g.fill(); g.restore(); g.restore();
    } else orn0(g, r, kind, t, seed);
  };

  const face0 = Char.faceAcc.bind(Char);
  Char.faceAcc = function (g, r, el, mood, t, seed) {
    const k = FACEACC[el]; if (!['brute', 'luchamask', 'shades', 'facepaint', 'beard'].includes(k) || r < 5) return face0(g, r, el, mood, t, seed);
    const ex = -r * 0.42, ey = -r * 0.11, lw = Math.max(0.8, r * 0.035);
    g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
    if (k === 'brute') { // heavy brow, stubble and a scar
      g.strokeStyle = '#2a1410'; g.lineWidth = lw * 2.2; g.beginPath(); g.moveTo(ex - r * 0.22, ey - r * 0.24); g.lineTo(ex + r * 0.2, ey - r * 0.3); g.stroke();
      g.fillStyle = 'rgba(60,40,30,0.4)'; for (let q = 0; q < 26; q++) { g.beginPath(); g.arc(-r * 0.95 + MGHash(q) * r * 0.6, r * (0.2 + MGHash(q + 9) * 0.32), r * 0.014, 0, 7); g.fill(); }
      g.strokeStyle = 'rgba(160,60,60,0.8)'; g.lineWidth = lw; g.beginPath(); g.moveTo(-r * 0.2, -r * 0.35); g.lineTo(-r * 0.08, -r * 0.08); g.stroke(); for (let q = 0; q < 3; q++) { g.beginPath(); g.moveTo(-r * 0.19 + q * r * 0.05, -r * (0.3 - q * 0.08)); g.lineTo(-r * 0.1 + q * r * 0.05, -r * (0.32 - q * 0.08)); g.stroke(); }
    }
    if (k === 'luchamask') { // a full mask: colour over the face with trimmed eye holes and a forehead emblem
      g.save(); g.beginPath(); g.arc(0, 0, r * 1.02, 0, 7); g.clip();
      g.fillStyle = '#2ad07a'; g.beginPath(); g.rect(-r * 1.2, -r * 1.2, r * 2.4, r * 1.32); g.ellipse(ex, ey, r * 0.24, r * 0.3, 0, 0, 7, true); g.fill('evenodd');
      g.strokeStyle = '#ffd34d'; g.lineWidth = lw * 1.6; g.beginPath(); g.ellipse(ex, ey, r * 0.27, r * 0.33, 0, 0, 7); g.stroke();
      g.beginPath(); g.moveTo(ex - r * 0.25, ey - r * 0.1); g.lineTo(ex - r * 0.5, ey - r * 0.42); g.moveTo(ex + r * 0.25, ey - r * 0.1); g.lineTo(ex + r * 0.5, ey - r * 0.42); g.stroke();
      g.fillStyle = '#e8323e'; g.beginPath(); g.moveTo(-r * 0.6, -r * 0.82); g.lineTo(-r * 0.45, -r * 0.62); g.lineTo(-r * 0.3, -r * 0.82); g.lineTo(-r * 0.45, -r * 0.72); g.closePath(); g.fill();
      g.strokeStyle = '#ffd34d'; g.lineWidth = lw; for (let q = 0; q < 5; q++) { g.beginPath(); g.moveTo(r * 0.1 + q * r * 0.12, r * 0.1); g.lineTo(r * 0.1 + q * r * 0.12, r * 0.2); g.stroke(); }
      g.restore();
    }
    if (k === 'shades') { // gold-rimmed shades and a confident smirk line
      g.fillStyle = '#1a1a2a'; g.strokeStyle = '#ffd34d'; g.lineWidth = lw; g.beginPath(); rrPath(g, ex - r * 0.3, ey - r * 0.16, r * 0.56, r * 0.28, r * 0.1); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(ex + r * 0.26, ey - r * 0.08); g.lineTo(r * 0.3, ey - r * 0.15); g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.55)'; g.beginPath(); g.ellipse(ex - r * 0.12, ey - r * 0.06, r * 0.08, r * 0.03, -0.4, 0, 7); g.fill();
      const fl = ((t * 0.7 + seed) % 3) < 0.2; if (fl) MGH.star(g, ex + r * 0.15, ey - r * 0.12, r * 0.1, '#fff', t * 8, false);
    }
    if (k === 'facepaint') { // cold green-and-black war paint
      g.fillStyle = 'rgba(20,30,20,0.78)'; g.beginPath(); g.moveTo(ex - r * 0.35, ey - r * 0.3); g.lineTo(ex + r * 0.3, ey - r * 0.25); g.lineTo(ex + r * 0.15, ey + r * 0.35); g.lineTo(ex - r * 0.2, ey + r * 0.15); g.closePath(); g.fill();
      g.strokeStyle = '#7adf3a'; g.lineWidth = lw * 1.2; g.beginPath(); g.moveTo(ex - r * 0.1, ey + r * 0.2); g.lineTo(ex - r * 0.05, ey + r * 0.55); g.moveTo(ex + r * 0.1, ey + r * 0.2); g.lineTo(ex + r * 0.12, ey + r * 0.5); g.stroke();
      g.fillStyle = '#7adf3a'; g.beginPath(); g.arc(ex, ey, r * 0.06, 0, 7); g.fill();
    }
    if (k === 'beard') { // a big bushy brown beard and handlebar moustache
      g.fillStyle = '#7a4a24'; g.strokeStyle = '#3a2010'; g.lineWidth = lw;
      g.beginPath(); g.moveTo(-r * 1.0, r * 0.2); g.quadraticCurveTo(-r * 1.02, r * 0.75, -r * 0.6, r * 0.9); g.quadraticCurveTo(-r * 0.2, r * 0.85, -r * 0.1, r * 0.4); g.quadraticCurveTo(-r * 0.5, r * 0.5, -r * 1.0, r * 0.2); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(-r * 1.02, r * 0.18); g.quadraticCurveTo(-r * 0.75, r * 0.06, -r * 0.45, r * 0.2); g.quadraticCurveTo(-r * 0.35, r * 0.35, -r * 0.3, r * 0.42); g.quadraticCurveTo(-r * 0.5, r * 0.3, -r * 0.7, r * 0.28); g.quadraticCurveTo(-r * 0.9, r * 0.3, -r * 1.02, r * 0.24); g.closePath(); g.fill(); g.stroke();
    }
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
