'use strict';
// Heroes 15-29: dyed hair, bold hairstyles and little tattoos (no beards).
// Everything is drawn in the head's own frame: a circle of radius r at the origin, face to the left,
// eye at (-0.42r, -0.11r), mouth at (-0.8r, 0.3r). The hairline stays above the brows (y < -0.45r).
(() => {
  const lin = (g, y0, y1, stops) => { const gr = g.createLinearGradient(0, y0, 0, y1); stops.forEach((c, k) => gr.addColorStop(k / (stops.length - 1), c)); return gr; };
  const LW = r => Math.max(1, r * 0.04);
  // the base hair cap: covers the crown from a front hairline to the back of the head
  //   vol = how far it stands off the scalp, back = how low it reaches at the back (in r), front = how far the fringe pokes forward
  function cap(g, r, fill, ink, o = {}) {
    const v = (o.vol ?? 0.12) * r, back = (o.back ?? 0.05) * r, fr = (o.front ?? 0.05) * r, hl = (o.hairline ?? 0.48) * r;
    g.beginPath(); g.moveTo(-r * 0.88, -hl);
    g.bezierCurveTo(-r * 0.98 - fr, -r * 0.82 - v * 0.5, -r * 0.5, -r * 1.02 - v, r * 0.05, -r * 1.0 - v);
    g.bezierCurveTo(r * 0.68, -r * 0.98 - v, r * 1.02 + v, -r * 0.55, r * 1.0 + v * 0.6, back - r * 0.05);
    g.quadraticCurveTo(r * 0.95, back + r * 0.1, r * 0.82, back + r * 0.05);
    g.quadraticCurveTo(r * 0.62, -r * 0.3, r * 0.12, -hl - r * 0.04);
    g.quadraticCurveTo(-r * 0.45, -hl - r * 0.06, -r * 0.88, -hl);
    g.closePath(); g.fillStyle = fill; g.strokeStyle = ink; g.lineWidth = LW(r); g.lineJoin = 'round'; g.fill(); g.stroke();
  }
  const shine = (g, r, x = -0.3, y = -0.98, w = 0.3) => { g.fillStyle = 'rgba(255,255,255,0.32)'; g.beginPath(); g.ellipse(r * x, r * y, r * w, r * 0.065, -0.2, 0, 7); g.fill(); };
  const strands = (g, r, col, n = 4) => { g.strokeStyle = col; g.lineWidth = Math.max(0.6, r * 0.022); for (let k = 0; k < n; k++) { g.beginPath(); g.moveTo(-r * (0.7 - k * 0.22), -r * (0.62 + k * 0.08)); g.quadraticCurveTo(r * (0.1 + k * 0.1), -r * (1.0 - k * 0.02), r * (0.85 - k * 0.05), -r * (0.35 - k * 0.12)); g.stroke(); } };
  const spikes = (g, r, fill, ink, a0, a1, n, len, base = 0.9) => {
    g.beginPath(); let p = [Math.cos(a0) * r * base, Math.sin(a0) * r * base]; g.moveTo(p[0], p[1]);
    for (let k = 0; k < n; k++) { const am = a0 + (a1 - a0) * (k + 0.5) / n, ab = a0 + (a1 - a0) * (k + 1) / n, L = r * (1.0 + len * (0.75 + 0.25 * Math.sin(k * 2.1 + 1))); g.lineTo(Math.cos(am - 0.06) * L, Math.sin(am - 0.06) * L); g.lineTo(Math.cos(ab) * r * 1.02, Math.sin(ab) * r * 1.02); }
    g.lineTo(Math.cos(a1) * r * base, Math.sin(a1) * r * base); g.arc(0, 0, r * base, a1, a0, true); g.closePath(); g.fillStyle = fill; g.strokeStyle = ink; g.lineWidth = LW(r); g.lineJoin = 'round'; g.fill(); g.stroke();
  };
  const blob = (g, x, y, rr, fill, ink, lw) => { g.beginPath(); g.arc(x, y, rr, 0, 7); g.fillStyle = fill; g.fill(); if (ink) { g.strokeStyle = ink; g.lineWidth = lw; g.stroke(); } };

  const HAIR = {
    15(g, r) { // Gravo: violet undercut with a long swoop falling forward
      g.save(); g.beginPath(); g.arc(0, 0, r, 0, 7); g.clip(); g.fillStyle = 'rgba(70,40,120,0.25)'; g.beginPath(); g.arc(0, 0, r, Math.PI * 1.1, Math.PI * 2.1); g.lineTo(r * 0.3, -r * 0.1); g.fill(); g.restore(); // shaved sides
      g.beginPath(); g.moveTo(r * 0.75, -r * 0.55); g.bezierCurveTo(r * 0.6, -r * 1.25, -r * 0.6, -r * 1.35, -r * 1.12, -r * 0.82); g.quadraticCurveTo(-r * 1.2, -r * 0.62, -r * 1.02, -r * 0.5); g.quadraticCurveTo(-r * 0.6, -r * 0.78, r * 0.2, -r * 0.72); g.quadraticCurveTo(r * 0.55, -r * 0.65, r * 0.75, -r * 0.55); g.closePath();
      g.fillStyle = lin(g, -r * 1.3, -r * 0.5, ['#d8b8ff', '#9a6aff', '#5a2ab8']); g.strokeStyle = '#2a1060'; g.lineWidth = LW(r); g.fill(); g.stroke(); strands(g, r, 'rgba(60,20,120,0.4)', 3); shine(g, r, -0.35, -1.05, 0.28);
    },
    16(g, r) { // Echo: a big lavender afro puff
      cap(g, r, '#c89aff', '#6a3a9a', { vol: 0.05, back: 0.1 });
      for (let k = 0; k < 11; k++) { const a = -Math.PI * 0.95 + k * Math.PI * 0.95 / 10, x = r * 0.22 + Math.cos(a) * r * 0.78, y = -r * 0.72 + Math.sin(a) * r * 0.62; blob(g, x, y, r * 0.3, '#b880ff', '#6a3a9a', LW(r)); }
      blob(g, r * 0.22, -r * 0.82, r * 0.68, lin(g, -r * 1.5, -r * 0.3, ['#e8d0ff', '#b880ff', '#8a4ad8']));
      for (let k = 0; k < 14; k++) { g.fillStyle = 'rgba(255,255,255,0.28)'; g.beginPath(); g.arc(r * 0.22 + Math.cos(k * 2.4) * r * 0.45, -r * 0.85 + Math.sin(k * 1.7) * r * 0.4, r * 0.05, 0, 7); g.fill(); }
      g.fillStyle = '#ff6ad8'; g.beginPath(); g.ellipse(-r * 0.3, -r * 0.6, r * 0.32, r * 0.07, -0.25, 0, 7); g.fill(); // headband
    },
    17(g, r) { // Venom: lime anime spikes with darker roots
      cap(g, r, '#5aaa1a', '#1a4a0a', { vol: 0.06 });
      spikes(g, r, lin(g, -r * 1.6, -r * 0.5, ['#e8ff8a', '#9aff3a', '#4a9a10']), '#1a4a0a', -2.7, -0.15, 7, 0.55, 0.88);
      shine(g, r, -0.2, -1.05, 0.25);
    },
    18(g, r) { // Mags: a blunt bob, dyed half red, half blue
      g.save(); g.beginPath(); g.rect(-r * 2, -r * 2, r * 2.05, r * 4); g.clip(); cap(g, r, lin(g, -r, r * 0.4, ['#ff7a7a', '#e8323e']), '#7a0a14', { vol: 0.14, back: 0.45, front: 0.02 }); g.restore();
      g.save(); g.beginPath(); g.rect(r * 0.05, -r * 2, r * 2, r * 4); g.clip(); cap(g, r, lin(g, -r, r * 0.4, ['#7aa8ff', '#2a4aa8']), '#0a1a5a', { vol: 0.14, back: 0.45, front: 0.02 }); g.restore();
      g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = LW(r); g.beginPath(); g.moveTo(r * 0.05, -r * 1.12); g.lineTo(r * 0.05, -r * 0.55); g.stroke(); shine(g, r, -0.35, -1.0, 0.25);
    },
    19(g, r, t) { // Boo: long wavy white hair fading to icy blue tips
      const sw = Math.sin(t * 1.6) * r * 0.05;
      g.beginPath(); g.moveTo(-r * 0.88, -r * 0.47); g.bezierCurveTo(-r * 1.0, -r * 0.95, -r * 0.45, -r * 1.14, r * 0.05, -r * 1.12); g.bezierCurveTo(r * 0.8, -r * 1.05, r * 1.15, -r * 0.5, r * 1.12, r * 0.15);
      for (let k = 0; k < 4; k++) g.quadraticCurveTo(r * (1.25 - (k % 2) * 0.2) + sw, r * (0.35 + k * 0.28), r * (1.05 - k * 0.05) + sw, r * (0.5 + k * 0.28));
      g.lineTo(r * 0.65 + sw, r * 1.35); g.bezierCurveTo(r * 0.72, r * 0.8, r * 0.7, r * 0.3, r * 0.58, r * 0.02); g.bezierCurveTo(r * 0.4, -r * 0.35, r * 0.0, -r * 0.52, -r * 0.42, -r * 0.52); g.quadraticCurveTo(-r * 0.7, -r * 0.52, -r * 0.88, -r * 0.47); g.closePath();
      g.fillStyle = lin(g, -r * 1.1, r * 1.4, ['#ffffff', '#f0f8ff', '#9ad8ff']); g.strokeStyle = '#6a8ab0'; g.lineWidth = LW(r); g.fill(); g.stroke(); strands(g, r, 'rgba(120,170,220,0.45)', 4);
    },
    20(g, r) { // Tick: a teal pompadour quiff with a gold streak
      cap(g, r, '#1a9a8a', '#0a3a3a', { vol: 0.1, back: 0.0 });
      g.beginPath(); g.moveTo(-r * 0.9, -r * 0.55); g.bezierCurveTo(-r * 1.3, -r * 0.9, -r * 0.9, -r * 1.45, -r * 0.2, -r * 1.3); g.quadraticCurveTo(r * 0.3, -r * 1.22, r * 0.5, -r * 0.9); g.quadraticCurveTo(-r * 0.2, -r * 0.95, -r * 0.9, -r * 0.55); g.closePath();
      g.fillStyle = lin(g, -r * 1.45, -r * 0.6, ['#a8fff0', '#3ad8c8', '#1a8a7a']); g.strokeStyle = '#0a3a3a'; g.lineWidth = LW(r); g.fill(); g.stroke();
      g.strokeStyle = '#ffd34d'; g.lineWidth = Math.max(1, r * 0.06); g.beginPath(); g.moveTo(-r * 0.85, -r * 0.7); g.bezierCurveTo(-r * 1.0, -r * 1.05, -r * 0.6, -r * 1.3, -r * 0.1, -r * 1.2); g.stroke(); shine(g, r, -0.45, -1.2, 0.2);
    },
    21(g, r) { // Inky: shaggy black hair dripping into blue at the tips
      cap(g, r, lin(g, -r * 1.2, r * 0.3, ['#1a1a2a', '#14143a', '#3a4aff']), '#05051a', { vol: 0.16, back: 0.25 });
      g.fillStyle = '#14143a'; g.beginPath(); g.moveTo(-r * 0.92, -r * 0.5); for (let k = 0; k < 6; k++) { g.lineTo(-r * (0.8 - k * 0.14), -r * (k % 2 ? 0.52 : 0.38)); } g.lineTo(r * 0.0, -r * 0.6); g.closePath(); g.fill();
      for (let k = 0; k < 3; k++) { g.fillStyle = '#3a4aff'; g.beginPath(); g.ellipse(r * (0.92 - k * 0.05), r * (0.2 + k * 0.1), r * 0.05, r * 0.08, 0, 0, 7); g.fill(); }
      shine(g, r, -0.3, -1.05, 0.25);
    },
    22(g, r) { // Bubbles: pink hair in two space buns
      cap(g, r, lin(g, -r * 1.1, 0, ['#ffd0ec', '#ff9ad8']), '#a83a8a', { vol: 0.08 });
      for (const a of [-2.15, -0.95]) { const x = Math.cos(a) * r * 1.02, y = Math.sin(a) * r * 1.02; blob(g, x, y, r * 0.34, lin(g, y - r * 0.34, y + r * 0.34, ['#ffe0f4', '#ff8ad0']), '#a83a8a', LW(r)); g.strokeStyle = 'rgba(168,58,138,0.5)'; g.lineWidth = LW(r) * 0.7; g.beginPath(); g.arc(x, y, r * 0.2, 0.5, 3.5); g.stroke(); g.fillStyle = '#8ad8ff'; g.beginPath(); g.ellipse(x, y + r * 0.3, r * 0.14, r * 0.06, 0, 0, 7); g.fill(); }
      shine(g, r, -0.25, -0.95, 0.22);
    },
    23(g, r, t) { // Nova: long galaxy hair swept to one side, sprinkled with stars
      g.beginPath(); g.moveTo(-r * 0.9, -r * 0.46); g.bezierCurveTo(-r * 1.05, -r * 1.0, -r * 0.4, -r * 1.18, r * 0.15, -r * 1.12); g.bezierCurveTo(r * 0.85, -r * 1.02, r * 1.18, -r * 0.4, r * 1.15, r * 0.35); g.bezierCurveTo(r * 1.15, r * 0.8, r * 1.0, r * 1.15, r * 0.82, r * 1.4); g.lineTo(r * 0.6, r * 1.2); g.bezierCurveTo(r * 0.7, r * 0.7, r * 0.68, r * 0.2, r * 0.55, -r * 0.05); g.bezierCurveTo(r * 0.35, -r * 0.4, -r * 0.1, -r * 0.55, -r * 0.45, -r * 0.54); g.quadraticCurveTo(-r * 0.72, -r * 0.52, -r * 0.9, -r * 0.46); g.closePath();
      g.fillStyle = lin(g, -r * 1.1, r * 1.4, ['#c88aff', '#6a3aff', '#1a2a9a', '#0a0a3a']); g.strokeStyle = '#0a0a2a'; g.lineWidth = LW(r); g.fill(); g.stroke();
      for (let k = 0; k < 9; k++) { const x = r * (-0.3 + (k * 0.37) % 1.3), y = r * (-0.9 + (k * 0.53) % 2.1), a = 0.5 + 0.5 * Math.sin(t * 3 + k); if (y > -r * 0.5 && x < r * 0.55) continue; g.fillStyle = `rgba(255,255,255,${a})`; g.beginPath(); g.arc(x, y, r * 0.03, 0, 7); g.fill(); }
    },
    24(g, r, t) { // Candi: rainbow pigtails tied with bows
      const rb = lin(g, -r * 1.1, r * 1.2, ['#ff5a7a', '#ffb04a', '#fff05a', '#6ae07a', '#5ab8ff', '#b07aff']);
      cap(g, r, rb, '#a82a5a', { vol: 0.08 });
      const sw = Math.sin(t * 2.4) * 0.12;
      g.save(); g.translate(r * 0.8, -r * 0.55); g.rotate(0.35 + sw); g.beginPath(); g.moveTo(-r * 0.12, 0); g.bezierCurveTo(r * 0.35, r * 0.2, r * 0.25, r * 0.8, r * 0.05, r * 1.15); g.bezierCurveTo(-r * 0.15, r * 0.8, -r * 0.3, r * 0.3, -r * 0.12, 0); g.fillStyle = rb; g.strokeStyle = '#a82a5a'; g.lineWidth = LW(r); g.fill(); g.stroke(); g.restore();
      g.fillStyle = '#ff3a7a'; for (const [x, y] of [[r * 0.82, -r * 0.6]]) { g.beginPath(); g.moveTo(x, y); g.lineTo(x - r * 0.2, y - r * 0.15); g.lineTo(x - r * 0.2, y + r * 0.15); g.closePath(); g.moveTo(x, y); g.lineTo(x + r * 0.2, y - r * 0.15); g.lineTo(x + r * 0.2, y + r * 0.15); g.closePath(); g.fill(); g.beginPath(); g.arc(x, y, r * 0.06, 0, 7); g.fill(); }
      shine(g, r);
    },
    25(g, r, t) { // Briar: dark green hair in a long braid with a rose
      cap(g, r, lin(g, -r * 1.1, 0, ['#4a8a3a', '#1e4a1a']), '#0a2a0a', { vol: 0.08, back: 0.1 });
      const sw = Math.sin(t * 1.8) * r * 0.04; for (let k = 0; k < 6; k++) blob(g, r * (0.85 + (k % 2) * 0.06) + sw * k / 5, r * (0.15 + k * 0.2), r * (0.17 - k * 0.012), k % 2 ? '#2a5a2a' : '#3a7a3a', '#0a2a0a', LW(r) * 0.8);
      g.fillStyle = '#e8324a'; g.beginPath(); g.arc(-r * 0.4, -r * 0.82, r * 0.14, 0, 7); g.fill(); g.strokeStyle = '#8a0a1a'; g.lineWidth = LW(r) * 0.6; g.beginPath(); g.arc(-r * 0.4, -r * 0.82, r * 0.07, 0, 5); g.stroke();
      strands(g, r, 'rgba(10,40,10,0.4)', 3);
    },
    26(g, r) { // Piston: a mop of copper curls
      cap(g, r, '#b8602a', '#5a2a10', { vol: 0.12, back: 0.1 });
      for (let k = 0; k < 13; k++) { const a = -2.75 + k * 0.21, R = r * 1.02; blob(g, Math.cos(a) * R, Math.sin(a) * R, r * 0.17, k % 2 ? '#e0884a' : '#c8703a', '#5a2a10', LW(r) * 0.7); }
      for (let k = 0; k < 4; k++) blob(g, -r * (0.82 - k * 0.12), -r * (0.5 + (k % 2) * 0.05), r * 0.1, '#e0884a', '#5a2a10', LW(r) * 0.6);
      shine(g, r, -0.25, -1.08, 0.25);
    },
    27(g, r) { // Origa: a crisp white bob with folded, angular edges
      g.beginPath(); g.moveTo(-r * 0.92, -r * 0.48); g.lineTo(-r * 0.98, -r * 0.9); g.lineTo(-r * 0.45, -r * 1.15); g.lineTo(r * 0.3, -r * 1.12); g.lineTo(r * 0.95, -r * 0.75); g.lineTo(r * 1.1, r * 0.1); g.lineTo(r * 0.95, r * 0.42); g.lineTo(r * 0.72, r * 0.3); g.lineTo(r * 0.6, -r * 0.2); g.lineTo(r * 0.1, -r * 0.55); g.lineTo(-r * 0.92, -r * 0.48); g.closePath();
      g.fillStyle = lin(g, -r * 1.15, r * 0.4, ['#ffffff', '#ece6da']); g.strokeStyle = '#8a7a6a'; g.lineWidth = LW(r); g.lineJoin = 'miter'; g.fill(); g.stroke();
      g.strokeStyle = 'rgba(138,122,106,0.55)'; g.beginPath(); g.moveTo(-r * 0.45, -r * 1.15); g.lineTo(r * 0.1, -r * 0.55); g.moveTo(r * 0.3, -r * 1.12); g.lineTo(r * 0.6, -r * 0.2); g.stroke();
      g.fillStyle = '#e8324a'; g.beginPath(); g.moveTo(r * 0.55, -r * 0.95); g.lineTo(r * 0.75, -r * 0.82); g.lineTo(r * 0.5, -r * 0.75); g.closePath(); g.fill(); // red paper clip
    },
    28(g, r, t) { // Neon: hot-pink buzz cut with glowing shaved stripes
      cap(g, r, lin(g, -r * 1.05, -r * 0.4, ['#ff8ae8', '#ff3ad8']), '#7a0a6a', { vol: 0.02, back: -0.05, front: 0 });
      const gl = 0.6 + 0.4 * Math.sin(t * 5); g.save(); g.shadowColor = '#3affe8'; g.shadowBlur = r * 0.25 * gl; g.strokeStyle = `rgba(58,255,232,${0.7 + 0.3 * gl})`; g.lineWidth = Math.max(1, r * 0.05);
      for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(r * (0.1 + k * 0.2), -r * (0.95 - k * 0.05)); g.lineTo(r * (0.35 + k * 0.2), -r * (0.6 - k * 0.1)); g.stroke(); } g.restore();
    },
    29(g, r, t) { // Buzz: yellow-and-black striped spikes with little antennae
      cap(g, r, '#2a2a1a', '#000', { vol: 0.05 });
      spikes(g, r, lin(g, -r * 1.5, -r * 0.6, ['#ffe86a', '#ffd02a', '#c89a10']), '#3a2a0a', -2.6, -0.3, 5, 0.38, 0.9);
      g.strokeStyle = '#2a2a1a'; g.lineWidth = Math.max(1, r * 0.08); for (let k = 0; k < 3; k++) { const a = -2.3 + k * 0.6; g.beginPath(); g.arc(0, 0, r * 1.1, a - 0.12, a + 0.12); g.stroke(); }
      const bob = Math.sin(t * 6) * r * 0.04; g.strokeStyle = '#2a2a1a'; g.lineWidth = Math.max(1, r * 0.04);
      for (const s of [-1, 1]) { g.beginPath(); g.moveTo(r * (-0.2 + s * 0.15), -r * 1.15); g.quadraticCurveTo(r * (-0.3 + s * 0.3), -r * 1.55, r * (-0.4 + s * 0.35), -r * 1.6 + bob); g.stroke(); blob(g, r * (-0.4 + s * 0.35), -r * 1.6 + bob, r * 0.08, '#2a2a1a'); }
    },
  };
  // tattoos and small face details: cheek (-0.55r, 0.25r) and temple (0.05r, -0.3r) stay clear of the eye and mouth
  const TAT = {
    15(g, r) { g.strokeStyle = 'rgba(122,74,255,0.8)'; g.lineWidth = Math.max(0.8, r * 0.03); g.beginPath(); g.ellipse(-r * 0.45, r * 0.28, r * 0.12, r * 0.05, -0.3, 0, 7); g.stroke(); g.fillStyle = 'rgba(122,74,255,0.9)'; g.beginPath(); g.arc(-r * 0.45, r * 0.28, r * 0.035, 0, 7); g.fill(); },
    16(g, r) { g.strokeStyle = 'rgba(216,58,168,0.8)'; g.lineWidth = Math.max(0.8, r * 0.028); g.beginPath(); for (let k = 0; k <= 8; k++) { const x = -r * 0.62 + k * r * 0.045, y = r * 0.28 + Math.sin(k * 1.3) * r * (0.03 + (k % 3) * 0.02); k ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); },
    17(g, r) { g.fillStyle = 'rgba(90,170,26,0.85)'; for (const dx of [0, 0.1]) { g.beginPath(); g.moveTo(-r * (0.48 - dx), r * 0.12); g.quadraticCurveTo(-r * (0.52 - dx), r * 0.28, -r * (0.48 - dx), r * 0.32); g.quadraticCurveTo(-r * (0.44 - dx), r * 0.28, -r * (0.48 - dx), r * 0.12); g.fill(); } },
    18(g, r) { g.strokeStyle = 'rgba(232,50,62,0.85)'; g.lineWidth = Math.max(0.8, r * 0.035); g.beginPath(); g.moveTo(-r * 0.6, r * 0.27); g.lineTo(-r * 0.48, r * 0.27); g.moveTo(-r * 0.54, r * 0.21); g.lineTo(-r * 0.54, r * 0.33); g.stroke(); g.strokeStyle = 'rgba(58,106,255,0.85)'; g.beginPath(); g.moveTo(-r * 0.4, r * 0.27); g.lineTo(-r * 0.28, r * 0.27); g.stroke(); },
    19(g, r) { g.strokeStyle = 'rgba(106,138,176,0.8)'; g.lineWidth = Math.max(0.8, r * 0.028); g.beginPath(); for (let a = 0; a < 9; a += 0.3) { const rr = r * 0.012 * a; g.lineTo(-r * 0.48 + Math.cos(a) * rr, r * 0.27 + Math.sin(a) * rr); } g.stroke(); },
    20(g, r) { g.strokeStyle = 'rgba(10,90,90,0.75)'; g.lineWidth = Math.max(0.8, r * 0.028); g.beginPath(); g.arc(r * 0.08, -r * 0.3, r * 0.1, 0, 7); g.moveTo(r * 0.08, -r * 0.3); g.lineTo(r * 0.08, -r * 0.37); g.moveTo(r * 0.08, -r * 0.3); g.lineTo(r * 0.13, -r * 0.28); g.stroke(); },
    21(g, r) { g.fillStyle = 'rgba(30,40,180,0.75)'; for (const [x, y, s] of [[-0.48, 0.26, 0.06], [-0.38, 0.2, 0.03], [-0.56, 0.36, 0.025], [-0.42, 0.34, 0.02]]) { g.beginPath(); g.arc(r * x, r * y, r * s, 0, 7); g.fill(); } },
    22(g, r) { g.strokeStyle = 'rgba(90,170,230,0.85)'; g.lineWidth = Math.max(0.7, r * 0.025); for (const [x, y, s] of [[-0.5, 0.26, 0.05], [-0.4, 0.2, 0.03], [-0.42, 0.33, 0.025]]) { g.beginPath(); g.arc(r * x, r * y, r * s, 0, 7); g.stroke(); } },
    23(g, r) { g.fillStyle = 'rgba(255,211,77,0.95)'; const pts = [[-0.62, 0.2], [-0.5, 0.3], [-0.4, 0.22], [-0.32, 0.32]]; g.strokeStyle = 'rgba(255,211,77,0.6)'; g.lineWidth = Math.max(0.6, r * 0.015); g.beginPath(); pts.forEach(([x, y], k) => k ? g.lineTo(r * x, r * y) : g.moveTo(r * x, r * y)); g.stroke(); pts.forEach(([x, y]) => { g.beginPath(); g.arc(r * x, r * y, r * 0.025, 0, 7); g.fill(); }); },
    24(g, r) { g.fillStyle = 'rgba(255,58,122,0.85)'; const x = -r * 0.48, y = r * 0.27, s = r * 0.05; g.beginPath(); g.moveTo(x, y + s); g.bezierCurveTo(x - s * 1.6, y - s * 0.4, x - s * 0.5, y - s * 1.4, x, y - s * 0.4); g.bezierCurveTo(x + s * 0.5, y - s * 1.4, x + s * 1.6, y - s * 0.4, x, y + s); g.fill(); },
    25(g, r) { g.strokeStyle = 'rgba(26,90,26,0.8)'; g.lineWidth = Math.max(0.7, r * 0.025); g.beginPath(); g.moveTo(-r * 0.62, r * 0.36); g.bezierCurveTo(-r * 0.5, r * 0.2, -r * 0.4, r * 0.38, -r * 0.3, r * 0.2); g.stroke(); g.fillStyle = 'rgba(232,50,74,0.9)'; g.beginPath(); g.arc(-r * 0.3, r * 0.2, r * 0.035, 0, 7); g.fill(); },
    26(g, r) { g.strokeStyle = 'rgba(90,58,42,0.8)'; g.lineWidth = Math.max(0.7, r * 0.03); g.beginPath(); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; g.moveTo(-r * 0.48 + Math.cos(a) * r * 0.05, r * 0.27 + Math.sin(a) * r * 0.05); g.lineTo(-r * 0.48 + Math.cos(a) * r * 0.08, r * 0.27 + Math.sin(a) * r * 0.08); } g.stroke(); g.beginPath(); g.arc(-r * 0.48, r * 0.27, r * 0.05, 0, 7); g.stroke(); },
    27(g, r) { g.strokeStyle = 'rgba(232,50,74,0.85)'; g.lineWidth = Math.max(0.7, r * 0.025); g.beginPath(); g.moveTo(-r * 0.6, r * 0.3); g.lineTo(-r * 0.48, r * 0.22); g.lineTo(-r * 0.36, r * 0.3); g.lineTo(-r * 0.48, r * 0.27); g.closePath(); g.moveTo(-r * 0.48, r * 0.22); g.lineTo(-r * 0.44, r * 0.14); g.stroke(); },
    28(g, r, t) { const gl = 0.6 + 0.4 * Math.sin(t * 5); g.strokeStyle = `rgba(58,255,232,${gl})`; g.lineWidth = Math.max(0.8, r * 0.035); g.beginPath(); g.moveTo(-r * 0.45, r * 0.12); g.lineTo(-r * 0.53, r * 0.25); g.lineTo(-r * 0.45, r * 0.25); g.lineTo(-r * 0.52, r * 0.38); g.stroke(); },
    29(g, r) { g.strokeStyle = 'rgba(200,154,16,0.9)'; g.lineWidth = Math.max(0.7, r * 0.025); for (const [cx, cy] of [[-0.5, 0.25], [-0.42, 0.3], [-0.42, 0.2]]) { g.beginPath(); for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; g.lineTo(r * cx + Math.cos(a) * r * 0.04, r * cy + Math.sin(a) * r * 0.04); } g.closePath(); g.stroke(); } },
  };

  const face0 = Char.faceAcc.bind(Char);
  Char.faceAcc = function (g, r, el, mood, t, seed) {
    if (el < 15 || el > 29 || r < 4) return face0(g, r, el, mood, t, seed);
    g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
    if (r > 9 && TAT[el]) TAT[el](g, r, t);
    if (HAIR[el]) HAIR[el](g, r, t);
    g.restore();
  };
})();
