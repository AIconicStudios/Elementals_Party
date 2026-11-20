'use strict';
// The board's 2.5D world. The camera looks down at the ground at an angle (Render.T squashes the ground),
// so spaces are round discs set into sandy paths across lush grass, while characters, trees, bushes,
// signposts and gates stand upright on top. The ground is painted once into a big offscreen canvas.
const World = {
  OX: -220, OY: -300, GW: 2040, GH: 1500, // ground canvas covers world x -220..1820, y -300..1200
  cache: null, key: '', decor: [],
  h(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); },
  lg(g, y0, y1, cols) { const gr = g.createLinearGradient(0, y0, 0, y1); cols.forEach((c, k) => gr.addColorStop(k / (cols.length - 1), c)); return gr; },
  rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); },

  // ---------------------------------------------------------------- ground (drawn under the tilted camera)
  ground(g, G) {
    const key = G.simple ? 's' : 'f';
    if (!this.cache || this.key !== key) { this.key = key; this.cache = this.paint(G); this.decor = this.makeDecor(G); }
    g.drawImage(this.cache, this.OX, this.OY);
  },
  // a sandy path band between points (drawn in layers for soft edges)
  path(g, draw, w) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    for (const [lw, col] of [[w + 18, 'rgba(90,120,40,0.35)'], [w + 8, '#c9a35e'], [w, '#e9cf8c'], [w - 18, '#f1dca0']]) { g.strokeStyle = col; g.lineWidth = lw; draw(); g.stroke(); }
  },
  paint(G) {
    const cv = document.createElement('canvas'); cv.width = this.GW; cv.height = this.GH;
    const g = cv.getContext('2d'); g.translate(-this.OX, -this.OY);
    const X0 = this.OX, Y0 = this.OY, X1 = X0 + this.GW, Y1 = Y0 + this.GH;
    // lush grass with soft light and dark patches
    g.fillStyle = this.lg(g, Y0, Y1, ['#7fcf4e', '#6cc043', '#5fb33a']); g.fillRect(X0, Y0, this.GW, this.GH);
    for (let k = 0; k < 140; k++) { const x = X0 + this.h(k) * this.GW, y = Y0 + this.h(k + 300) * this.GH, r = 60 + this.h(k + 600) * 160; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, k % 3 ? 'rgba(150,220,90,0.35)' : 'rgba(40,110,30,0.25)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
    for (let k = 0; k < 2600; k++) { const x = X0 + this.h(k * 3.1) * this.GW, y = Y0 + this.h(k * 7.7) * this.GH; g.strokeStyle = this.h(k) > 0.5 ? 'rgba(40,110,30,0.45)' : 'rgba(170,230,110,0.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 3, y - 9); g.moveTo(x + 3, y); g.lineTo(x + 5, y - 10); g.stroke(); }
    for (let k = 0; k < 160; k++) { const x = X0 + this.h(k * 5.3 + 9) * this.GW, y = Y0 + this.h(k * 2.9 + 4) * this.GH; g.fillStyle = 'rgba(60,150,50,0.6)'; for (let l = 0; l < 3; l++) { g.beginPath(); g.arc(x + Math.cos(l * 2.1) * 5, y + Math.sin(l * 2.1) * 5, 5, 0, 7); g.fill(); } }
    // ---- the Crossing path: a big sandy loop
    const R = Render, pad = 0;
    this.path(g, () => { g.beginPath(); g.moveTo(R.X0 + 40, R.Y0); g.arcTo(R.X1, R.Y0, R.X1, R.Y1, 40); g.arcTo(R.X1, R.Y1, R.X0, R.Y1, 40); g.arcTo(R.X0, R.Y1, R.X0, R.Y0, 40); g.arcTo(R.X0, R.Y0, R.X1, R.Y0, 40); g.closePath(); }, 92);
    // pebbles in the sand
    for (let k = 0; k < 500; k++) { const t = this.h(k) * 4, side = Math.floor(t), f = t - side; let x, y; if (side === 0) { x = R.X0 + f * (R.X1 - R.X0); y = R.Y0; } else if (side === 1) { x = R.X1; y = R.Y0 + f * (R.Y1 - R.Y0); } else if (side === 2) { x = R.X1 - f * (R.X1 - R.X0); y = R.Y1; } else { x = R.X0; y = R.Y1 - f * (R.Y1 - R.Y0); } x += (this.h(k + 7) - 0.5) * 70; y += (this.h(k + 9) - 0.5) * 70; g.fillStyle = this.h(k + 2) > 0.5 ? 'rgba(170,130,80,0.55)' : 'rgba(255,245,210,0.6)'; g.beginPath(); g.ellipse(x, y, 2 + this.h(k + 3) * 3, 1.5 + this.h(k + 5) * 2, 0, 0, 7); g.fill(); }
    // painted direction arrows at the corners (clockwise)
    const arrow = (x, y, a) => { g.save(); g.translate(x, y); g.rotate(a); g.strokeStyle = 'rgba(255,160,40,0.85)'; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(-34, 0); g.lineTo(26, 0); g.moveTo(10, -14); g.lineTo(28, 0); g.lineTo(10, 14); g.stroke(); g.restore(); };
    arrow(R.X0 + 130, R.Y0 - 64, 0); arrow(R.X1 + 64, R.Y0 + 130, Math.PI / 2); arrow(R.X1 - 130, R.Y1 + 64, Math.PI); arrow(R.X0 - 64, R.Y1 - 130, -Math.PI / 2);
    // ---- paths to the Holds
    for (let el = 0; el < 4; el++) { const a = R.trackPos(el * 10), b = R.homeCenter(el); this.path(g, () => { g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); }, 64); }
    // ---- the Holds: themed grounds
    const theme = [
      { rim: '#b9d6ee', a: '#ffffff', b: '#cfe6fa' },
      { rim: '#f1dca0', a: '#7fd8ff', b: '#2f8ad8' },
      { rim: '#6a3424', a: '#5a3a30', b: '#2a1810' },
      { rim: '#7a6a44', a: '#5aa83a', b: '#3f7a2a' },
    ];
    const B3 = typeof Board3D !== 'undefined' && Board3D.ok();
    R.HOMES.forEach((c, el) => {
      const sp3 = B3 && Board3D.hold(el, G.simple);
      if (sp3) { Board3D.putGround(g, sp3, c.x, c.y); return; }
      const T = theme[el], r0 = 168;
      g.fillStyle = 'rgba(0,0,0,0.18)'; g.beginPath(); g.arc(c.x + 4, c.y + 8, r0 + 10, 0, 7); g.fill();
      g.fillStyle = T.rim; g.beginPath(); g.arc(c.x, c.y, r0 + 10, 0, 7); g.fill();
      const gr = g.createRadialGradient(c.x - 40, c.y - 40, 10, c.x, c.y, r0); gr.addColorStop(0, T.a); gr.addColorStop(1, T.b); g.fillStyle = gr; g.beginPath(); g.arc(c.x, c.y, r0, 0, 7); g.fill();
      if (el === 0) { g.strokeStyle = 'rgba(160,190,220,0.6)'; g.lineWidth = 2; for (let k = 1; k < 5; k++) { g.beginPath(); g.arc(c.x, c.y, k * 34, 0, 7); g.stroke(); } }
      if (el === 1) { g.strokeStyle = 'rgba(255,255,255,0.45)'; g.lineWidth = 3; for (let k = 0; k < 7; k++) { g.beginPath(); g.ellipse(c.x, c.y, 40 + k * 18, 30 + k * 17, 0, k, k + 1.4); g.stroke(); } }
      if (el === 2) { g.strokeStyle = 'rgba(255,120,40,0.85)'; g.lineWidth = 4; g.lineCap = 'round'; for (let k = 0; k < 9; k++) { const a = k * 0.7; g.beginPath(); g.moveTo(c.x + Math.cos(a) * 40, c.y + Math.sin(a) * 40); g.lineTo(c.x + Math.cos(a + 0.25) * 100, c.y + Math.sin(a + 0.25) * 100); g.lineTo(c.x + Math.cos(a) * 160, c.y + Math.sin(a) * 160); g.stroke(); } }
      if (el === 3) for (let k = 0; k < 40; k++) { const a = this.h(k + el * 50) * 7, d = Math.sqrt(this.h(k + 99)) * 150; g.fillStyle = 'rgba(30,70,20,0.35)'; g.beginPath(); g.arc(c.x + Math.cos(a) * d, c.y + Math.sin(a) * d, 6 + this.h(k) * 8, 0, 7); g.fill(); }
      // stepping-stone ring (full board) or a round plaza (starter)
      if (G.simple) { g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.arc(c.x, c.y, 92, 0, 7); g.fill(); }
      else { g.strokeStyle = 'rgba(120,90,50,0.35)'; g.lineWidth = 50; g.beginPath(); g.arc(c.x, c.y, R.RING, 0, 7); g.stroke(); }
    });
    // ---- a pond and flowerbeds in the middle field
    const pond3 = B3 && Board3D.pond();
    if (pond3) Board3D.putGround(g, pond3, 1010, 638); else {
    g.fillStyle = '#c9b48a'; g.beginPath(); g.ellipse(1010, 640, 128, 70, 0, 0, 7); g.fill();
    g.fillStyle = this.lg(g, 540, 660, ['#8fe0ff', '#3a9ae0', '#2a78c0']); g.beginPath(); g.ellipse(1010, 636, 116, 60, 0, 0, 7); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 3; g.beginPath(); g.ellipse(990, 624, 60, 22, 0, 3.4, 5.6); g.stroke();
    for (const [x, y] of [[960, 630], [1060, 648], [1010, 665]]) { g.fillStyle = '#4fa83a'; g.beginPath(); g.arc(x, y, 11, 0.4, Math.PI * 2 - 0.2); g.lineTo(x, y); g.fill(); }
    }
    for (let k = 0; k < 90; k++) { const x = 440 + this.h(k + 900) * 720, y = 140 + this.h(k + 950) * 620; if (Math.hypot((x - 1010) / 140, (y - 640) / 80) < 1.1) continue; g.fillStyle = ['#ff8ad0', '#ffffff', '#ffd34d', '#b48aff', '#ff6a5a'][k % 5]; for (let l = 0; l < 5; l++) { g.beginPath(); g.arc(x + Math.cos(l * 1.26) * 3, y + Math.sin(l * 1.26) * 3, 2.4, 0, 7); g.fill(); } g.fillStyle = '#ffe680'; g.beginPath(); g.arc(x, y, 1.6, 0, 7); g.fill(); }
    return cv;
  },

  // ---------------------------------------------------------------- upright decor (sorted by depth with the tokens)
  makeDecor(G) {
    const D = [], R = Render, add = (x, y, kind, s = 1, v = 0) => D.push({ x, y, kind, s, v });
    // bushes framing the world and the inner field
    for (let k = 0; k < 30; k++) { const t = k / 30 * Math.PI * 2, x = 800 + Math.cos(t) * 990 + (this.h(k) - 0.5) * 60, y = 450 + Math.sin(t) * 660 + (this.h(k + 5) - 0.5) * 60; if (R.HOMES.some(c => Math.hypot(c.x - x, c.y - y) < 260)) continue; add(x, y, 'bush', 1.2 + this.h(k + 2) * 0.6, k); }
    [[480, 170], [1130, 170], [480, 740], [700, 760], [860, 150], [1140, 520]].forEach(([x, y], k) => add(x, y, 'bush', 0.9 + this.h(k) * 0.3, k));
    [[620, 360], [880, 330], [740, 560], [560, 600]].forEach(([x, y], k) => add(x, y, 'tree', 1 + this.h(k + 3) * 0.2, k + 3));
    // signposts beside the corners
    add(R.X0 + 70, R.Y0 + 70, 'sign', 1, 0); add(R.X1 - 70, R.Y1 - 70, 'sign', 1, 1);
    // rocks and flowers by the paths
    for (let k = 0; k < 10; k++) add(R.X0 + 80 + this.h(k + 30) * (R.X1 - R.X0 - 160), k % 2 ? R.Y0 + 70 : R.Y1 - 70, k % 3 ? 'flowers' : 'rock', 0.8 + this.h(k) * 0.4, k);
    // each Hold's centrepiece
    R.HOMES.forEach((c, el) => add(c.x + [-1, 1, 1, -1][el] * 120, c.y - 92, ['windmill', 'shell', 'volcano', 'stones'][el], 1, el));
    return D;
  },
  drawDecor(g, d, now) {
    if (typeof Board3D !== 'undefined' && Board3D.drawDecor(g, d, now)) return;
    const s = d.s;
    g.save(); g.translate(d.x, d.y); g.scale(s, s);
    g.fillStyle = 'rgba(0,0,0,0.22)'; g.beginPath(); g.ellipse(4, 2, d.kind === 'tree' ? 34 : 26, 8, 0, 0, 7); g.fill();
    if (d.kind === 'bush') {
      const sway = Math.sin(now * 1.3 + d.v) * 1.5;
      for (const [dx, dy, r, c] of [[-18, -14, 18, '#3f9a32'], [16, -14, 18, '#3a8f2e'], [0, -26, 22, '#4fae3c'], [-6, -16, 16, '#58bb44'], [10, -30, 12, '#6fcf54']]) { g.fillStyle = c; g.beginPath(); g.arc(dx + sway, dy, r, 0, 7); g.fill(); }
      g.fillStyle = 'rgba(255,255,255,0.18)'; g.beginPath(); g.arc(-6 + sway, -38, 7, 0, 7); g.fill();
      if (d.v % 3 === 0) { g.fillStyle = '#ff6a5a'; for (const [bx, by] of [[-12, -22], [8, -32], [18, -16]]) { g.beginPath(); g.arc(bx + sway, by, 3, 0, 7); g.fill(); } }
    } else if (d.kind === 'tree') {
      g.fillStyle = '#7a5230'; g.beginPath(); g.moveTo(-7, 0); g.lineTo(-5, -50); g.lineTo(5, -50); g.lineTo(7, 0); g.fill();
      const sway = Math.sin(now * 0.9 + d.v) * 2;
      for (const [dx, dy, r, c] of [[-22, -62, 26, '#3a8a2e'], [22, -62, 26, '#358228'], [0, -88, 32, '#4aa83a'], [-10, -72, 22, '#5ab846'], [12, -96, 16, '#6fcf54']]) { g.fillStyle = c; g.beginPath(); g.arc(dx + sway, dy, r, 0, 7); g.fill(); }
      g.fillStyle = 'rgba(255,255,255,0.16)'; g.beginPath(); g.arc(-10 + sway, -104, 10, 0, 7); g.fill();
    } else if (d.kind === 'sign') {
      g.fillStyle = '#8a5a32'; g.fillRect(-4, -54, 8, 54);
      for (const [y, dir] of [[-50, d.v ? -1 : 1], [-30, d.v ? 1 : -1]]) { g.fillStyle = '#c98a4a'; g.beginPath(); g.moveTo(-30 * dir, y - 9); g.lineTo(22 * dir, y - 9); g.lineTo(32 * dir, y); g.lineTo(22 * dir, y + 9); g.lineTo(-30 * dir, y + 9); g.closePath(); g.fill(); g.strokeStyle = '#6a3e18'; g.lineWidth = 2; g.stroke(); g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.moveTo(-14 * dir, y); g.lineTo(12 * dir, y); g.moveTo(5 * dir, y - 5); g.lineTo(12 * dir, y); g.lineTo(5 * dir, y + 5); g.stroke(); }
    } else if (d.kind === 'rock') {
      g.fillStyle = '#9a9488'; g.beginPath(); g.ellipse(0, -10, 18, 13, 0, 0, 7); g.fill(); g.fillStyle = '#b8b2a6'; g.beginPath(); g.ellipse(-4, -14, 9, 6, 0, 0, 7); g.fill();
    } else if (d.kind === 'flowers') {
      for (let k = 0; k < 5; k++) { const x = (k - 2) * 7, h = 12 + (k % 2) * 6; g.strokeStyle = '#3a8a2e'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, -h); g.stroke(); g.fillStyle = ['#ff8ad0', '#ffd34d', '#fff', '#b48aff', '#ff6a5a'][(k + d.v) % 5]; g.beginPath(); g.arc(x, -h, 4.5, 0, 7); g.fill(); }
    } else if (d.kind === 'windmill') {
      g.fillStyle = '#e8eef6'; g.beginPath(); g.moveTo(-16, 0); g.lineTo(-10, -80); g.lineTo(10, -80); g.lineTo(16, 0); g.fill(); g.strokeStyle = '#9ab0c8'; g.lineWidth = 2; g.stroke();
      g.save(); g.translate(0, -80); g.rotate(now * 1.4); g.fillStyle = '#fff'; for (let k = 0; k < 4; k++) { g.rotate(Math.PI / 2); g.beginPath(); g.ellipse(0, -24, 6, 24, 0, 0, 7); g.fill(); g.stroke(); } g.restore();
    } else if (d.kind === 'shell') {
      g.fillStyle = '#ffd8c8'; g.beginPath(); g.moveTo(-30, 0); g.quadraticCurveTo(0, -60, 30, 0); g.closePath(); g.fill(); g.strokeStyle = '#e09a8a'; g.lineWidth = 2; for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(0, -2); g.lineTo(k * 12, -40 + Math.abs(k) * 8); g.stroke(); }
      for (let k = 0; k < 6; k++) { const ph = (now * 0.8 + k / 6) % 1; g.fillStyle = `rgba(200,240,255,${1 - ph})`; g.beginPath(); g.arc(Math.sin(k * 2) * 10, -50 - ph * 40, 3, 0, 7); g.fill(); }
    } else if (d.kind === 'volcano') {
      g.fillStyle = '#4a2a20'; g.beginPath(); g.moveTo(-44, 0); g.lineTo(-12, -62); g.lineTo(12, -62); g.lineTo(44, 0); g.fill();
      g.fillStyle = '#ff6a1f'; g.beginPath(); g.moveTo(-12, -62); g.lineTo(-6, -40); g.lineTo(2, -55); g.lineTo(8, -38); g.lineTo(12, -62); g.fill();
      for (let k = 0; k < 6; k++) { const ph = (now * 0.9 + k / 6) % 1; g.fillStyle = `rgba(${120 + ph * 80},${100 + ph * 60},100,${0.5 * (1 - ph)})`; g.beginPath(); g.arc(Math.sin(k + now) * 8 + ph * 10, -70 - ph * 60, 8 + ph * 12, 0, 7); g.fill(); }
    } else if (d.kind === 'stones') {
      for (const [x, h] of [[-26, 54], [0, 70], [26, 48]]) { g.fillStyle = '#8a8478'; g.fillRect(x - 9, -h, 18, h); g.fillStyle = '#a8a294'; g.fillRect(x - 9, -h, 6, h); }
      g.fillStyle = '#7a7466'; g.fillRect(-36, -76, 72, 10);
    }
    g.restore();
  },
  // soft shadows of clouds drifting over the land
  cloudShadows(g, now) {
    for (let k = 0; k < 5; k++) {
      const x = ((now * (14 + k * 3) + k * 520) % 2600) - 500, y = 100 + k * 190 + Math.sin(now * 0.1 + k) * 40, r = 220 + (k % 3) * 70;
      const gr = g.createRadialGradient(x, y, r * 0.2, x, y, r); gr.addColorStop(0, 'rgba(10,40,20,0.16)'); gr.addColorStop(1, 'rgba(10,40,20,0)');
      g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, r * 1.3, r, 0, 0, 7); g.fill();
    }
  },
  // warm sunlight from the top right and a soft vignette (screen space)
  light(g, now) {
    const sun = g.createRadialGradient(1500, -80, 50, 1500, -80, 1100); sun.addColorStop(0, 'rgba(255,240,190,0.35)'); sun.addColorStop(0.5, 'rgba(255,230,170,0.08)'); sun.addColorStop(1, 'rgba(255,230,170,0)');
    g.fillStyle = sun; g.fillRect(0, 0, 1600, 900);
    for (let k = 0; k < 3; k++) { g.save(); g.globalAlpha = 0.05 + 0.02 * Math.sin(now * 0.5 + k); g.fillStyle = '#fff8d0'; g.translate(1500, -80); g.rotate(0.55 + k * 0.18 + Math.sin(now * 0.1) * 0.03); g.fillRect(-30, 0, 60 + k * 30, 1400); g.restore(); }
    const v = g.createRadialGradient(800, 450, 420, 800, 450, 980); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,20,10,0.32)');
    g.fillStyle = v; g.fillRect(0, 0, 1600, 900);
  },
  butterfly(g, x, y, now, k) {
    const f = Math.abs(Math.sin(now * 14 + k)), col = ['#ff8ad0', '#ffd34d', '#8ad8ff', '#b48aff', '#ff9a5a', '#7cf06a', '#ffffff'][k % 7];
    g.fillStyle = col; g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 1;
    g.beginPath(); g.ellipse(x - 6 * f, y, 7 * f + 1, 5, -0.4, 0, 7); g.ellipse(x + 6 * f, y, 7 * f + 1, 5, 0.4, 0, 7); g.fill(); g.stroke();
    g.fillStyle = '#333'; g.fillRect(x - 1, y - 4, 2, 8);
  },
  // the arch over each Waygate space
  gate(g, x, y, el, now, closed) {
    const col = ELEMENTS[el].color;
    g.save(); g.translate(x, y);
    for (const s of [-1, 1]) { g.fillStyle = '#7a5230'; g.fillRect(s * 44 - 6, -84, 12, 84); g.fillStyle = '#9a6a40'; g.fillRect(s * 44 - 6, -84, 4, 84); g.fillStyle = '#4fa83a'; for (let k = 0; k < 4; k++) { g.beginPath(); g.ellipse(s * 44 + (k % 2 ? 6 : -6), -20 - k * 18, 6, 4, 0.5, 0, 7); g.fill(); } }
    g.fillStyle = '#8a5a32'; g.beginPath(); g.moveTo(-58, -84); g.quadraticCurveTo(0, -122, 58, -84); g.lineTo(58, -72); g.quadraticCurveTo(0, -108, -58, -72); g.closePath(); g.fill();
    g.fillStyle = closed ? '#555' : col; g.beginPath(); g.arc(0, -98, 17, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 3; g.stroke();
    g.font = '18px "Segoe UI Emoji"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.fillText(closed ? '🔒' : ELEMENTS[el].glyph, 0, -97); g.textBaseline = 'alphabetic';
    if (!closed) for (let k = 0; k < 3; k++) { const a = now * 2 + k * 2.1; g.fillStyle = `rgba(255,255,255,${0.5 + 0.5 * Math.sin(now * 4 + k)})`; g.beginPath(); g.arc(Math.cos(a) * 34, -50 + Math.sin(a) * 26, 2.5, 0, 7); g.fill(); }
    g.restore();
  },
};
