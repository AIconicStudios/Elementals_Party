'use strict';
// =====================================================================================================
// Cute pass for the board's creatures: the fork guardians, the zoo pet and the Holds' guard puppies.
// One style for all of them: soft gradients, a dark ink outline, big glossy eyes, rosy cheeks.
// =====================================================================================================
(() => {
  const INK = '#3a2a4a';
  const outline = (g, w = 2.5) => { g.strokeStyle = INK; g.lineWidth = w; g.lineJoin = 'round'; g.stroke(); };
  const grad = (g, x, y, r, c0, c1, c2) => { const gr = g.createRadialGradient(x - r * 0.35, y - r * 0.45, r * 0.08, x, y, r * 1.1); gr.addColorStop(0, c0); gr.addColorStop(0.45, c1); gr.addColorStop(1, c2); return gr; };
  // a big glossy cartoon eye
  const eye = (g, x, y, r, lx = 0, ly = 0, iris = '#2a1a3a', shut = false) => {
    if (shut) { g.strokeStyle = INK; g.lineWidth = r * 0.35; g.lineCap = 'round'; g.beginPath(); g.arc(x, y, r * 0.7, 0.2, Math.PI - 0.2); g.stroke(); g.lineCap = 'butt'; return; }
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(x, y, r * 0.86, r, 0, 0, 7); g.fill(); g.strokeStyle = INK; g.lineWidth = 1.6; g.stroke();
    const ix = x + lx * r * 0.22, iy = y + ly * r * 0.2 + r * 0.1;
    const ig = g.createRadialGradient(ix, iy - r * 0.2, 1, ix, iy, r * 0.7); ig.addColorStop(0, Char.shade ? Char.shade(iris, 0.4) : iris); ig.addColorStop(1, iris); g.fillStyle = ig; g.beginPath(); g.ellipse(ix, iy, r * 0.62, r * 0.74, 0, 0, 7); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(ix - r * 0.22, iy - r * 0.3, r * 0.24, r * 0.28, -0.3, 0, 7); g.fill(); g.beginPath(); g.arc(ix + r * 0.22, iy + r * 0.25, r * 0.11, 0, 7); g.fill();
  };
  const blush = (g, x, y, r) => { g.fillStyle = 'rgba(255,110,140,0.45)'; g.beginPath(); g.ellipse(x, y, r, r * 0.55, 0, 0, 7); g.fill(); };

  // ----------------------------------------------------------------- the Holds' guard puppy
  BoardArt.puppy = (g, x, y, t, awake, chase) => {
    g.save(); g.translate(x, y); g.scale(1.3, 1.3); g.translate(-x, -y);
    const wag = Math.sin(t * (awake ? 16 : 3)) * (awake ? 0.6 : 0.15), bob = chase ? Math.abs(Math.sin(t * 14)) * 4 : Math.sin(t * 2) * 1;
    g.save(); g.translate(x, y - bob);
    g.fillStyle = 'rgba(0,0,0,0.2)'; g.beginPath(); g.ellipse(0, 2 + bob, 20, 5, 0, 0, 7); g.fill();
    // tail
    g.save(); g.translate(-14, -10); g.rotate(-0.9 + wag); g.fillStyle = '#e8b070'; g.beginPath(); g.ellipse(0, -8, 4, 9, 0, 0, 7); g.fill(); outline(g, 2); g.restore();
    // body sitting
    g.fillStyle = grad(g, 0, -12, 16, '#fff2d8', '#f0c48a', '#c88a50'); g.beginPath(); g.ellipse(0, -11, 15, 13, 0, 0, 7); g.fill(); outline(g);
    g.fillStyle = '#fff6e8'; g.beginPath(); g.ellipse(3, -8, 8, 8, 0, 0, 7); g.fill();
    for (const sd of [-1, 1]) { g.fillStyle = '#f4d0a0'; g.beginPath(); g.ellipse(sd * 7 + 2, -1, 5, 3.5, 0, 0, 7); g.fill(); outline(g, 1.8); }
    // head
    const hy = -32; g.fillStyle = grad(g, 4, hy, 15, '#fff6e0', '#f4c890', '#c8884a'); g.beginPath(); g.arc(4, hy, 14, 0, 7); g.fill(); outline(g);
    // floppy ears
    for (const sd of [-1, 1]) { g.save(); g.translate(4 + sd * 12, hy - 6); g.rotate(sd * (0.35 + (awake ? Math.sin(t * 8) * 0.1 : 0))); g.fillStyle = '#a8683a'; g.beginPath(); g.ellipse(0, 8, 5.5, 11, 0, 0, 7); g.fill(); outline(g, 2); g.restore(); }
    g.fillStyle = '#fff8ee'; g.beginPath(); g.ellipse(8, hy + 5, 8, 6, 0, 0, 7); g.fill();
    g.fillStyle = INK; g.beginPath(); g.ellipse(9, hy + 2, 3, 2.2, 0, 0, 7); g.fill();
    eye(g, -1, hy - 3, 3.6, 0.6, 0, '#3a2010', !awake); eye(g, 10, hy - 3, 3.6, 0.6, 0, '#3a2010', !awake);
    blush(g, -4, hy + 5, 3); blush(g, 15, hy + 4, 3);
    if (awake && chase) { g.fillStyle = '#ff7a8a'; g.beginPath(); g.ellipse(9, hy + 10, 3, 4, 0, 0, 7); g.fill(); }
    else { g.strokeStyle = INK; g.lineWidth = 1.4; g.beginPath(); g.arc(7, hy + 6, 2, 0.2, Math.PI - 0.2); g.arc(11, hy + 6, 2, 0.2, Math.PI - 0.2); g.stroke(); }
    // collar + tag
    g.fillStyle = '#e8323e'; MGH.rr(g, -6, hy + 11, 22, 4, 2); g.fill(); g.fillStyle = '#ffd34d'; g.beginPath(); g.arc(5, hy + 17, 2.8, 0, 7); g.fill();
    g.restore();
    if (!awake) MGH.text(g, 'z', x + 18 + Math.sin(t * 2) * 3, y - 54 - (t % 2) * 8, 13, '#fff', 'center', 'bold');
    if (awake) MGH.text(g, chase ? 'WOOF!' : '?', x + 16, y - 58, chase ? 16 : 14, chase ? '#ff6a4a' : '#fff', 'center', 'bold');
    g.restore();
  };

  // ----------------------------------------------------------------- the zoo pet: a chubby baby dragon that grows
  BoardArt.dragon = (g, x, y, t, k, lunge, munch) => {
    const flap = Math.sin(t * 6) * 0.3, angry = k > 0.75, sc = 0.6 + k * 0.7;
    g.save(); g.translate(x, y); g.scale(sc * (1 + lunge * 0.2), sc * (1 + lunge * 0.2));
    // tail with a heart tip
    g.strokeStyle = '#7ad0a8'; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); g.moveTo(16, -10); g.quadraticCurveTo(40, -6 + Math.sin(t * 3) * 4, 44, -22); g.stroke(); g.strokeStyle = INK; g.lineWidth = 2; g.stroke(); g.lineCap = 'butt';
    g.fillStyle = '#ff8ab0'; g.beginPath(); g.moveTo(44, -18); g.bezierCurveTo(36, -26, 40, -34, 44, -28); g.bezierCurveTo(48, -34, 52, -26, 44, -18); g.fill(); outline(g, 1.6);
    // wings
    for (const sd of [-1, 1]) { g.save(); g.translate(sd * 14, -36); g.rotate(sd * (0.5 + flap)); g.fillStyle = '#c8b0ff'; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(sd * 22, -18, sd * 26, -4); g.quadraticCurveTo(sd * 18, -2, sd * 16, 6); g.quadraticCurveTo(sd * 8, 2, 0, 0); g.fill(); outline(g, 1.8); g.restore(); }
    // body
    g.fillStyle = grad(g, 0, -20, 26, '#d8fff0', '#8ae0b8', '#3a9a78'); g.beginPath(); g.ellipse(0, -18, 24, 22, 0, 0, 7); g.fill(); outline(g);
    g.fillStyle = '#fff4d0'; g.beginPath(); g.ellipse(0, -12, 14, 14, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(200,160,80,0.5)'; g.lineWidth = 1.2; for (let q = 0; q < 3; q++) { g.beginPath(); g.moveTo(-9, -18 + q * 6); g.quadraticCurveTo(0, -15 + q * 6, 9, -18 + q * 6); g.stroke(); }
    for (const sd of [-1, 1]) { g.fillStyle = '#8ae0b8'; g.beginPath(); g.ellipse(sd * 14, 2, 8, 5, 0, 0, 7); g.fill(); outline(g, 1.8); g.fillStyle = '#fff'; for (let c = 0; c < 3; c++) { g.beginPath(); g.arc(sd * 14 - 4 + c * 4, 4, 1.3, 0, 7); g.fill(); } }
    // head
    const hy = -50 - lunge * 4; g.fillStyle = grad(g, 0, hy, 22, '#e0fff4', '#9ae8c0', '#4aa888'); g.beginPath(); g.ellipse(0, hy, 22, 19, 0, 0, 7); g.fill(); outline(g);
    for (const sd of [-1, 1]) { g.fillStyle = '#fff0c0'; g.beginPath(); g.moveTo(sd * 9, hy - 14); g.quadraticCurveTo(sd * 14, hy - 30, sd * 18, hy - 24); g.quadraticCurveTo(sd * 16, hy - 16, sd * 13, hy - 12); g.fill(); outline(g, 1.6); }
    g.fillStyle = '#c8a0ff'; for (let q = 0; q < 3; q++) { g.beginPath(); g.arc(-4 + q * 4, hy - 19, 3, 0, 7); g.fill(); }
    eye(g, -8, hy - 2, 6.5, 0, 0.3, angry ? '#c82a4a' : '#2a6a5a'); eye(g, 8, hy - 2, 6.5, 0, 0.3, angry ? '#c82a4a' : '#2a6a5a');
    if (angry) { g.strokeStyle = INK; g.lineWidth = 2.5; g.lineCap = 'round'; g.beginPath(); g.moveTo(-14, hy - 12); g.lineTo(-4, hy - 9); g.moveTo(14, hy - 12); g.lineTo(4, hy - 9); g.stroke(); g.lineCap = 'butt'; }
    blush(g, -14, hy + 7, 4); blush(g, 14, hy + 7, 4);
    const open = Math.min(1, lunge + munch);
    if (open > 0.1) { g.fillStyle = '#7a1a3a'; g.beginPath(); g.ellipse(0, hy + 9, 6 + open * 3, 2 + open * 6, 0, 0, 7); g.fill(); outline(g, 1.4); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(-5, hy + 5); g.lineTo(-3, hy + 9); g.lineTo(-1, hy + 5); g.moveTo(1, hy + 5); g.lineTo(3, hy + 9); g.lineTo(5, hy + 5); g.fill(); }
    else { g.strokeStyle = INK; g.lineWidth = 1.6; g.beginPath(); g.arc(-3, hy + 8, 3, 0.2, Math.PI - 0.2); g.arc(3, hy + 8, 3, 0.2, Math.PI - 0.2); g.stroke(); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(3, hy + 10); g.lineTo(5, hy + 13); g.lineTo(6, hy + 9); g.fill(); }
    g.restore();
  };
  // replace the beast in the zoo pen
  const oldPen = BoardArt.zooPen;
  BoardArt.zooPen = function (g, x, y, t, G) {
    // draw the pen without its old beast: temporarily hide the beast by drawing pen parts ourselves
    this.sunShadow(g, x, y, 130, 60);
    g.fillStyle = '#c8a878'; g.beginPath(); g.ellipse(x, y, 80, 38, 0, 0, 7); g.fill(); g.fillStyle = '#9ad86a'; g.beginPath(); g.ellipse(x, y + 2, 70, 30, 0, 0, 7); g.fill();
    for (let q = 0; q < 8; q++) { g.fillStyle = q % 2 ? '#7ac04a' : '#b8f080'; g.beginPath(); g.arc(x - 44 + q * 12, y + 8 + (q % 3) * 3, 3, 0, 7); g.fill(); }
    // a feeding bowl
    g.fillStyle = '#e8443a'; g.beginPath(); g.ellipse(x + 34, y + 6, 10, 4, 0, 0, 7); g.fill(); g.fillStyle = '#ffb04a'; g.beginPath(); g.ellipse(x + 34, y + 4, 7, 2.5, 0, 0, 7); g.fill();
    const Z = G.zoo, k = Math.min(1, Z.size / BD.ZOOSTAR), lunge = Board.ui.zoo ? Math.sin(Math.min(1, (Board.ui.zoo.t || 0) / 0.5) * Math.PI) : 0, munch = Z.anim > 0 ? Math.abs(Math.sin(t * 14)) : 0;
    g.save(); g.translate(x - 4, y + 2 - lunge * 16); g.scale(1.05, 1.05); BoardArt.dragon(g, 0, 0, t, k, lunge, munch); g.restore();
    if (Z.size < 6 && !Board.ui.zoo) MGH.text(g, 'z', x + 26 + Math.sin(t * 2) * 3, y - 52 - (t % 2) * 8, 14, '#fff', 'center', 'bold');
    g.strokeStyle = '#8a6a3a'; g.lineWidth = 4; g.beginPath(); g.ellipse(x, y + 2, 80, 36, 0, 0.05, Math.PI - 0.05); g.stroke(); g.beginPath(); g.ellipse(x, y - 12, 80, 36, 0, 0.05, Math.PI - 0.05); g.stroke();
    for (let q = 0; q <= 8; q++) { const a = q / 8 * Math.PI, px = x + Math.cos(a) * 80, py = y + Math.sin(a) * 36; g.fillStyle = '#a8804a'; MGH.rr(g, px - 3.5, py - 26, 7, 28, 3); g.fill(); g.fillStyle = '#ff8ab0'; g.beginPath(); g.arc(px, py - 27, 3.5, 0, 7); g.fill(); }
    GX.plank(g, x - 46, y + 36, 92, 22, '#ffe8c0'); MGH.text(g, '🍖 Don\'t feed me!', x, y + 52, 10, '#8a2a3a', 'center', 'bold');
    if (G.info) { g.fillStyle = 'rgba(0,0,0,0.5)'; MGH.rr(g, x - 40, y - 150, 80, 10, 5); g.fill(); g.fillStyle = k > 0.99 ? '#ff4a7a' : '#ffb04a'; MGH.rr(g, x - 40, y - 150, 80 * k, 10, 5); g.fill(); }
  };

  // ----------------------------------------------------------------- the stone Alternator: a cute grumpy boulder
  const golem = (g, t, hit) => {
    const sq = Math.sin(t * 3) * 1.5;
    g.fillStyle = 'rgba(0,0,0,0.0)';
    for (const sd of [-1, 1]) { g.fillStyle = grad(g, sd * 14, -2, 9, '#e0dce8', '#a8a4b8', '#6a6680'); g.beginPath(); g.ellipse(sd * 14, -2, 10, 6, 0, 0, 7); g.fill(); outline(g, 2); }
    g.fillStyle = grad(g, 0, -34, 34, '#f0eef8', '#b8b4c8', '#7a768e'); g.beginPath(); g.moveTo(-30, -8); g.quadraticCurveTo(-34, -62 - sq, 0, -66 - sq); g.quadraticCurveTo(34, -62 - sq, 30, -8); g.quadraticCurveTo(0, 2, -30, -8); g.fill(); outline(g, 3);
    g.fillStyle = 'rgba(90,86,110,0.35)'; g.beginPath(); g.ellipse(14, -46, 6, 4, 0.4, 0, 7); g.fill(); g.beginPath(); g.ellipse(-18, -20, 5, 3, -0.3, 0, 7); g.fill();
    g.fillStyle = '#6ac04a'; g.beginPath(); g.ellipse(-4, -62 - sq, 20, 7, -0.1, Math.PI, 0); g.quadraticCurveTo(8, -58 - sq, -24, -60 - sq); g.fill(); outline(g, 2);
    g.fillStyle = '#fff'; for (let p = 0; p < 5; p++) { const a = p / 5 * 6.28; g.beginPath(); g.arc(6 + Math.cos(a) * 3, -70 - sq + Math.sin(a) * 3, 2.4, 0, 7); g.fill(); } g.fillStyle = '#ffd34d'; g.beginPath(); g.arc(6, -70 - sq, 1.8, 0, 7); g.fill();
    eye(g, -11, -38, 7.5, 0, 0.3, '#3a4a8a', hit > 0.5); eye(g, 11, -38, 7.5, 0, 0.3, '#3a4a8a', hit > 0.5);
    g.strokeStyle = INK; g.lineWidth = 3.5; g.lineCap = 'round'; g.beginPath(); g.moveTo(-19, -51); g.lineTo(-5, -47); g.moveTo(19, -51); g.lineTo(5, -47); g.stroke(); g.lineCap = 'butt';
    blush(g, -18, -27, 4.5); blush(g, 18, -27, 4.5);
    g.strokeStyle = INK; g.lineWidth = 2.2; g.beginPath(); g.moveTo(-6, -22); g.quadraticCurveTo(0, -26, 6, -22); g.stroke();
    // stubby arms crossed
    g.fillStyle = grad(g, 0, -16, 20, '#e0dce8', '#a8a4b8', '#7a768e'); g.beginPath(); g.ellipse(-8, -14, 14, 6, 0.25, 0, 7); g.fill(); outline(g, 2); g.beginPath(); g.ellipse(8, -14, 14, 6, -0.25, 0, 7); g.fill(); outline(g, 2);
  };
  BoardArt._golem = golem;
  // ----------------------------------------------------------------- the roaming Ankar: a one-eyed shadow puff that grows redder with anger
  BoardArt.ankar = function (g, x, y, t, A) {
    const k = Math.min(1, A.anger || 0), red = k >= 1, bob = Math.sin(t * 3) * 4, bite = Board.ui.ankarBite ? Math.abs(Math.sin(t * 16)) : 0;
    const c0 = red ? '#ff8a8a' : '#8a7aa8', c1 = red ? '#d8262e' : k > 0.5 ? '#6a3a6a' : '#4a3a6a', c2 = red ? '#6a0a14' : '#1e1430';
    g.save(); g.translate(x, y);
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(0, 4, 34, 10, 0, 0, 7); g.fill();
    if (red) { const gl = g.createRadialGradient(0, -50, 10, 0, -50, 90); gl.addColorStop(0, 'rgba(255,60,60,0.35)'); gl.addColorStop(1, 'rgba(255,60,60,0)'); g.fillStyle = gl; g.beginPath(); g.arc(0, -50, 90, 0, 7); g.fill(); }
    g.translate(0, bob - 8);
    // wispy tail-feet
    for (let q = 0; q < 5; q++) { const a = -0.8 + q * 0.4, w = Math.sin(t * 5 + q) * 4; g.fillStyle = c2; g.beginPath(); g.ellipse(Math.sin(a) * 26 + w, -6, 9, 12, a * 0.5, 0, 7); g.fill(); }
    g.fillStyle = grad(g, 0, -46, 42, c0, c1, c2); g.beginPath(); g.moveTo(-36, -10); g.quadraticCurveTo(-46, -84, 0, -90); g.quadraticCurveTo(46, -84, 36, -10); g.quadraticCurveTo(0, 2, -36, -10); g.fill(); outline(g, 3);
    // horns
    for (const sd of [-1, 1]) { g.fillStyle = red ? '#ffd0a0' : '#e8dcc8'; g.beginPath(); g.moveTo(sd * 18, -82); g.quadraticCurveTo(sd * 34, -104, sd * 30, -116); g.quadraticCurveTo(sd * 26, -98, sd * 8, -86); g.fill(); outline(g, 2); }
    // the one big eye
    const lx = Math.sin(t * 0.9) * 0.4, ey = -56;
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(0, ey, 20, 18, 0, 0, 7); g.fill(); outline(g, 2.5);
    g.fillStyle = red ? '#ff2a2a' : k > 0.5 ? '#ff9a2a' : '#ffd34d'; g.beginPath(); g.arc(lx * 10, ey + 2, 10, 0, 7); g.fill();
    g.fillStyle = INK; g.beginPath(); g.ellipse(lx * 10, ey + 2, 3.5, 8, 0, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(lx * 10 - 4, ey - 3, 3, 0, 7); g.fill();
    // angry brow
    g.strokeStyle = INK; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(-20, ey - 22 + k * 4); g.lineTo(0, ey - 18 + k * 10); g.lineTo(20, ey - 22 + k * 4); g.stroke(); g.lineCap = 'butt';
    // grinning mouth with fangs
    const mo = 4 + bite * 10; g.fillStyle = '#2a0a1a'; g.beginPath(); g.ellipse(0, -26, 16, mo, 0, 0, Math.PI); g.fill(); outline(g, 2);
    g.fillStyle = '#fff'; g.beginPath(); g.moveTo(-10, -26); g.lineTo(-7, -26 + 6 + bite * 3); g.lineTo(-4, -26); g.moveTo(4, -26); g.lineTo(7, -26 + 6 + bite * 3); g.lineTo(10, -26); g.fill();
    g.restore();
    // anger meter
    g.fillStyle = 'rgba(0,0,0,0.55)'; MGH.rr(g, x - 32, y - 142, 64, 9, 4.5); g.fill(); g.fillStyle = red ? '#ff3a3a' : '#ff9a3a'; MGH.rr(g, x - 32, y - 142, 64 * k, 9, 4.5); g.fill();
    MGH.text(g, red ? 'ANKAR — RED!' : 'Ankar', x, y - 150, 12, red ? '#ff6a6a' : '#e8dcff', 'center', 'bold');
  };
  // a cute dice for the Competitor
  const die = (g, x, y, r, a) => { g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = '#fff'; MGH.rr(g, -r, -r, r * 2, r * 2, r * 0.4); g.fill(); g.strokeStyle = INK; g.lineWidth = 2; g.stroke(); g.fillStyle = '#e8323e'; g.beginPath(); g.arc(0, 0, r * 0.22, 0, 7); g.fill(); g.fillStyle = INK; for (const [dx, dy] of [[-0.5, -0.5], [0.5, 0.5]]) { g.beginPath(); g.arc(dx * r, dy * r, r * 0.18, 0, 7); g.fill(); } g.restore(); };
  const sack = (g, x, y, t) => { const jig = Math.sin(t * 6) * 2; g.fillStyle = grad(g, x, y + jig, 13, '#f8e0b0', '#d8a868', '#a87038'); g.beginPath(); g.moveTo(x - 4, y - 12 + jig); g.quadraticCurveTo(x - 16, y + jig, x - 10, y + 12 + jig); g.quadraticCurveTo(x, y + 16 + jig, x + 10, y + 12 + jig); g.quadraticCurveTo(x + 16, y + jig, x + 4, y - 12 + jig); g.closePath(); g.fill(); outline(g, 2); g.fillStyle = '#8a5028'; g.fillRect(x - 6, y - 12 + jig, 12, 3); MGH.text(g, '🪙', x, y + 6 + jig, 11, '#fff'); };

  BoardArt.guardian = function (g, f, t, G) {
    const kind = G.guard[f], B = BD.BRANCHES[f], A = BD.spaces[B.a], first = BD.spaces[B.ids[0]], hit = Board.ui.guardHit && Board.ui.guardHit.f === f ? Math.max(0, 1 - (Board.ui.guardHit.t || 0) / 0.8) : 0;
    const bz = (P0, C, E, q) => { const u = 1 - q; return { x: u * u * P0.x + 2 * u * q * C.x + q * q * E.x, y: u * u * P0.y + 2 * u * q * C.y + q * q * E.y }; };
    const ent = bz(A, B.ctrl, BD.spaces[B.b], 0.08), side = { x: first.y - A.y, y: -(first.x - A.x) }, l = Math.hypot(side.x, side.y) || 1;
    if (kind === 'gate') return BoardArt._gate(g, f, t, G, ent, A, first);
    const inw = [[0, 1], [-1, 0], [0, -1], [1, 0]][f], alg = [[1, 0], [0, 1], [-1, 0], [0, -1]][f];
    let x = A.x + inw[0] * 105 - alg[0] * 95, y = A.y + inw[1] * 105 - alg[1] * 95 + 10;
    if (kind === 'alternator') { const onMain = G.alt[f] === 'main', S3 = BD.spaces[B.a + 1], st = Board.ui.altStomp && Board.ui.altStomp.f === f ? Math.min(1, (Board.ui.altStomp.t || 0) / 0.8) : 1;
      const tx = onMain ? (A.x + S3.x) / 2 : ent.x, ty = onMain ? (A.y + S3.y) / 2 + 4 : ent.y + 4, fx = onMain ? ent.x : (A.x + S3.x) / 2, fy = onMain ? ent.y + 4 : (A.y + S3.y) / 2 + 4;
      x = fx + (tx - fx) * st; y = fy + (ty - fy) * st - Math.sin(st * Math.PI) * 40; }
    this.sunShadow(g, x, y, 90, 120);
    const shake = hit * Math.sin(t * 40) * 3, tag = (txt) => { g.fillStyle = 'rgba(40,24,60,0.85)'; MGH.rr(g, x - 30, y + 16, 60, 20, 10); g.fill(); g.strokeStyle = '#ffe680'; g.lineWidth = 1.5; g.stroke(); MGH.text(g, txt, x, y + 31, 13, '#ffe680', 'center', 'bold'); };
    // a little round stone stage so the guardian stands firmly on the ground
    const stand = () => { g.fillStyle = 'rgba(0,0,0,0.28)'; g.beginPath(); g.ellipse(x + 4, y + 8, 46, 14, 0, 0, 7); g.fill(); g.fillStyle = '#8a8298'; g.beginPath(); g.ellipse(x, y + 4, 40, 12, 0, 0, 7); g.fill(); g.fillStyle = '#c8c0d4'; g.beginPath(); g.ellipse(x, y, 40, 12, 0, 0, 7); g.fill(); outline(g, 2); g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(x, y + 1, 22, 6, 0, 0, 7); g.fill(); };
    if (kind === 'alternator') { g.save(); g.translate(x + shake, y); g.scale(1.12, 1.12); golem(g, t, hit); g.restore(); tag(`🚫 ${BD.GUARDS.alternator.toll[G.tod]}🪙`); return; }
    if (kind === 'collector') { stand(); Char.npc(g, x + shake, y - 44, 42, 'host', { t, mood: hit > 0 ? 'smug' : 'happy', look: { x: -0.4, y: 0.2 }, hands: { n: { x: 1.1, y: -0.2, d: 20, o: false, m: true }, f: { x: -0.9, y: 0.1, d: 0, o: true, m: false } } }); g.save(); g.translate(x + 50 + shake, y - 16); g.scale(1.6, 1.6); sack(g, 0, 0, t); g.restore(); if (Math.sin(t * 6) > 0.9) MGH.star(g, x + 64, y - 46, 6, '#ffe680', t, false); tag(`${BD.GUARDS.collector.toll[G.tod]}🪙`); return; }
    // the Competitor: the sensei with a big die bouncing in one hand
    stand(); Char.npc(g, x + shake, y - 44, 42, 'sensei', { t, mood: hit > 0 ? 'smug' : 'determined', look: { x: 0.4, y: 0 }, hands: { n: { x: 1.2, y: -1.0, d: -50, o: true, m: true }, f: { x: -0.9, y: 0.1, d: 0, o: true, m: false } } });
    const dz = Math.abs(Math.sin(t * 3)) * 22; die(g, x + 54 + shake, y - 108 - dz, 15, t * 3);
    tag(`🎲 d${BD.GUARDS.competitor.die[G.tod]}`);
  };
  // keep the iron gate from the previous art pass
  BoardArt._gate = function (g, f, t, G, ent, A, first) {
    const gx = ent.x, gy = ent.y + 10, ang = Math.atan2(first.y - A.y, first.x - A.x) + Math.PI / 2, ca = Math.cos(ang), sa = Math.sin(ang);
    this.sunShadow(g, gx, gy, 90, 70);
    for (const sd of [-1, 1]) { const px = gx + ca * 44 * sd, py = gy + sa * 18 * sd; const sg = g.createLinearGradient(px - 7, 0, px + 7, 0); sg.addColorStop(0, '#8a8a9a'); sg.addColorStop(1, '#5a5a6a'); g.fillStyle = sg; MGH.rr(g, px - 7, py - 66, 14, 66, 3); g.fill(); g.fillStyle = '#ffd34d'; g.beginPath(); g.arc(px, py - 70, 7, 0, 7); g.fill(); g.strokeStyle = INK; g.lineWidth = 1.5; g.stroke(); }
    g.strokeStyle = '#4a4a5a'; g.lineWidth = 3.5; for (let q = -4; q <= 4; q++) { const px = gx + ca * q * 10, py = gy + sa * q * 4; g.beginPath(); g.moveTo(px, py); g.lineTo(px, py - 56 - Math.cos(q / 4 * 1.5) * 8); g.stroke(); g.fillStyle = '#ffd34d'; g.beginPath(); g.arc(px, py - 58 - Math.cos(q / 4 * 1.5) * 8, 2.5, 0, 7); g.fill(); }
    g.beginPath(); g.moveTo(gx - ca * 44, gy - sa * 18 - 20); g.lineTo(gx + ca * 44, gy + sa * 18 - 20); g.stroke();
    MGH.glow(g, gx, gy - 30, 20, 'rgba(255,210,80,0.5)'); g.fillStyle = '#ffd34d'; MGH.rr(g, gx - 10, gy - 36, 20, 17, 4); g.fill(); g.strokeStyle = INK; g.lineWidth = 1.5; g.stroke(); g.strokeStyle = '#ffd34d'; g.lineWidth = 3.5; g.beginPath(); g.arc(gx, gy - 36, 6, Math.PI, 0); g.stroke();
    g.fillStyle = INK; g.beginPath(); g.arc(gx, gy - 29, 2.2, 0, 7); g.fill(); g.fillRect(gx - 1, gy - 28, 2, 5);
  };
})();
