'use strict';
// The board's 2.5D world: a sunny sky, a big floating island that carries the Crossing, four themed
// Hold islands joined by rope bridges, a garden in the middle, waterfalls, birds and butterflies.
// Static parts are painted once into an offscreen canvas; the lively bits animate every frame.
const World = {
  cache: null, key: '',
  h(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); },
  lg(g, y0, y1, cols) { const gr = g.createLinearGradient(0, y0, 0, y1); cols.forEach((c, k) => gr.addColorStop(k / (cols.length - 1), c)); return gr; },
  rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); },
  cloud(g, x, y, s, col) { g.fillStyle = col; g.beginPath(); [[0, 0, 1], [-0.9, 0.2, 0.7], [0.9, 0.2, 0.75], [0.4, -0.35, 0.7], [-0.4, -0.3, 0.6]].forEach(([dx, dy, r]) => { g.moveTo(x + dx * s + r * s, y + dy * s); g.arc(x + dx * s, y + dy * s, r * s, 0, 7); }); g.fill(); },

  // ---------------------------------------------------------------- sky (screen space)
  sky(g, now) {
    g.fillStyle = this.lg(g, 0, 900, ['#5ab4ff', '#9ad6ff', '#cdeeff', '#eaf7ff']); g.fillRect(0, 0, 1600, 900);
    const sun = g.createRadialGradient(1380, 120, 10, 1380, 120, 380); sun.addColorStop(0, 'rgba(255,252,220,1)'); sun.addColorStop(0.15, 'rgba(255,245,200,0.8)'); sun.addColorStop(1, 'rgba(255,240,200,0)');
    g.fillStyle = sun; g.fillRect(0, 0, 1600, 900);
    // far mountains peeking through the haze
    g.fillStyle = 'rgba(150,190,230,0.55)'; g.beginPath(); g.moveTo(0, 900);
    for (let x = 0; x <= 1600; x += 80) g.lineTo(x, 700 - this.h(x * 0.37) * 140 - Math.sin(x * 0.004) * 40); g.lineTo(1600, 900); g.fill();
    // distant floating islets drifting
    for (let k = 0; k < 5; k++) {
      const x = ((k * 380 + now * (4 + k)) % 2000) - 200, y = 90 + (k % 3) * 260 + Math.sin(now * 0.4 + k) * 6, s = 0.5 + (k % 2) * 0.3;
      g.fillStyle = 'rgba(120,150,190,0.45)'; g.beginPath(); g.moveTo(x - 60 * s, y); g.lineTo(x + 60 * s, y); g.lineTo(x + 10 * s, y + 70 * s); g.closePath(); g.fill();
      g.fillStyle = 'rgba(140,190,150,0.55)'; g.beginPath(); g.ellipse(x, y, 62 * s, 12 * s, 0, 0, 7); g.fill();
    }
    for (let k = 0; k < 9; k++) this.cloud(g, ((k * 260 + now * (6 + k % 3 * 3)) % 1900) - 150, 60 + (k % 4) * 230, 30 + (k % 3) * 10, 'rgba(255,255,255,0.7)');
    // birds
    g.strokeStyle = 'rgba(40,60,90,0.6)'; g.lineWidth = 2;
    for (let k = 0; k < 5; k++) { const x = ((now * 40 + k * 70) % 2000) - 200, y = 70 + k * 14 + Math.sin(now * 2 + k) * 6, f = Math.sin(now * 10 + k) * 5; g.beginPath(); g.moveTo(x - 8, y - f); g.quadraticCurveTo(x - 3, y - 4, x, y); g.quadraticCurveTo(x + 3, y - 4, x + 8, y - f); g.stroke(); }
  },

  // ---------------------------------------------------------------- the islands (world space)
  island(g, G, now) {
    const key = (G.simple ? 's' : 'f');
    if (!this.cache || this.key !== key) { this.key = key; this.cache = this.paint(G); }
    // waterfalls behind the main cliff
    for (const [x, w] of [[470, 26], [1130, 20]]) { const gr = g.createLinearGradient(0, 800, 0, 900); gr.addColorStop(0, 'rgba(180,225,255,0.9)'); gr.addColorStop(1, 'rgba(180,225,255,0)'); g.fillStyle = gr; g.fillRect(x - w / 2, 800, w, 120); g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 2; for (let k = 0; k < 3; k++) { const y = 800 + ((now * 120 + k * 40) % 110); g.beginPath(); g.moveTo(x - w / 2 + 3, y); g.lineTo(x + w / 2 - 3, y); g.stroke(); } }
    g.drawImage(this.cache, 0, 0);
    // pond shimmer & fountain
    const pc = this.pond;
    for (let k = 0; k < 3; k++) { const r = ((now * 18 + k * 20) % 60); g.strokeStyle = `rgba(255,255,255,${0.5 - r / 120})`; g.lineWidth = 2; g.beginPath(); g.ellipse(pc.x, pc.y, r * 1.6, r * 0.7, 0, 0, 7); g.stroke(); }
    for (let k = 0; k < 10; k++) { const ph = (now * 1.4 + k / 10) % 1, a = k / 10 * Math.PI * 2; g.fillStyle = `rgba(200,235,255,${1 - ph})`; g.beginPath(); g.arc(pc.x + Math.cos(a) * ph * 30, pc.y - 30 - Math.sin(ph * Math.PI) * 34 + ph * 20, 2.5, 0, 7); g.fill(); }
    // butterflies over the garden
    for (let k = 0; k < 5; k++) { const x = 860 + Math.sin(now * 0.5 + k * 1.7) * 220, y = 520 + Math.cos(now * 0.7 + k) * 110, f = Math.abs(Math.sin(now * 14 + k)); g.fillStyle = ['#ff8ad0', '#ffd34d', '#8ad8ff', '#b48aff', '#ff9a5a'][k]; g.beginPath(); g.ellipse(x - 4 * f, y, 5 * f + 1, 4, -0.4, 0, 7); g.ellipse(x + 4 * f, y, 5 * f + 1, 4, 0.4, 0, 7); g.fill(); }
    // hold-island ambience: lava glow, windmill, water sparkle
    const hc = Render.HOMES;
    { const c = hc[0]; g.save(); g.translate(c.x + 112, c.y - 120); g.rotate(now * 1.6); g.fillStyle = 'rgba(255,255,255,0.95)'; for (let k = 0; k < 4; k++) { g.rotate(Math.PI / 2); g.beginPath(); g.ellipse(0, -18, 5, 18, 0, 0, 7); g.fill(); } g.restore(); g.fillStyle = '#8a7a6a'; g.beginPath(); g.arc(c.x + 112, c.y - 120, 4, 0, 7); g.fill(); }
    { const c = hc[2]; const gl = 0.45 + 0.2 * Math.sin(now * 2); const gr = g.createRadialGradient(c.x, c.y, 40, c.x, c.y, 175); gr.addColorStop(0, 'rgba(255,100,30,0)'); gr.addColorStop(1, `rgba(255,90,20,${gl * 0.35})`); g.fillStyle = gr; g.beginPath(); g.arc(c.x, c.y, 175, 0, 7); g.fill(); }
    { const c = hc[1]; for (let k = 0; k < 5; k++) { const a = now * 0.3 + k * 1.3; g.fillStyle = `rgba(255,255,255,${0.4 + 0.4 * Math.sin(now * 3 + k)})`; g.fillRect(c.x + Math.cos(a) * 150, c.y + Math.sin(a) * 140, 3, 3); } }
  },

  paint(G) {
    const cv = document.createElement('canvas'); cv.width = 1600; cv.height = 900;
    const g = cv.getContext('2d');
    // ---- main island: cliff body then grassy top
    const X0 = 318, X1 = 1282, Y0 = 108, Y1 = 792;
    g.fillStyle = this.lg(g, Y1 - 40, Y1 + 120, ['#8a6a4a', '#5a4030', '#2e2018']);
    g.beginPath(); g.moveTo(X0 + 20, Y1 - 30);
    for (let x = X0 + 20; x <= X1 - 20; x += 30) g.lineTo(x, Y1 + 40 + this.h(x) * 50 + Math.sin(x * 0.01) * 20);
    g.lineTo(X1 - 20, Y1 - 30); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.18)'; g.lineWidth = 2; for (let x = X0 + 40; x < X1 - 40; x += 46) { g.beginPath(); g.moveTo(x, Y1 + 4); g.lineTo(x + 10, Y1 + 30 + this.h(x + 3) * 30); g.stroke(); }
    // hanging roots & rocks
    for (let k = 0; k < 18; k++) { const x = X0 + 60 + k * 50, l = 20 + this.h(k + 40) * 50; g.strokeStyle = 'rgba(70,50,30,0.8)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, Y1 + 30); g.quadraticCurveTo(x + 8, Y1 + 30 + l / 2, x - 4, Y1 + 30 + l); g.stroke(); }
    g.fillStyle = 'rgba(0,0,0,0.2)'; this.rr(g, X0 + 6, Y0 + 14, X1 - X0, Y1 - Y0, 70); g.fill();
    g.fillStyle = this.lg(g, Y0, Y1, ['#8fd36a', '#6fbf4a', '#5aa83a']); this.rr(g, X0, Y0, X1 - X0, Y1 - Y0, 70); g.fill();
    g.strokeStyle = '#4a8a2a'; g.lineWidth = 6; g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.25)'; g.lineWidth = 3; this.rr(g, X0 + 6, Y0 + 6, X1 - X0 - 12, Y1 - Y0 - 12, 64); g.stroke();
    // grass tufts
    for (let k = 0; k < 220; k++) { const x = X0 + 30 + this.h(k) * (X1 - X0 - 60), y = Y0 + 30 + this.h(k + 500) * (Y1 - Y0 - 60); g.strokeStyle = `rgba(${40 + this.h(k + 9) * 40},${110 + this.h(k + 7) * 50},40,0.55)`; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 2, y - 6); g.moveTo(x, y); g.lineTo(x + 3, y - 7); g.stroke(); }
    // dirt path under the track
    g.strokeStyle = 'rgba(190,150,100,0.85)'; g.lineWidth = 74; g.lineJoin = 'round'; g.strokeRect(Render.X0, Render.Y0, Render.X1 - Render.X0, Render.Y1 - Render.Y0);
    g.strokeStyle = 'rgba(150,110,70,0.6)'; g.lineWidth = 2; g.setLineDash([3, 9]); g.strokeRect(Render.X0 - 34, Render.Y0 - 34, Render.X1 - Render.X0 + 68, Render.Y1 - Render.Y0 + 68); g.strokeRect(Render.X0 + 34, Render.Y0 + 34, Render.X1 - Render.X0 - 68, Render.Y1 - Render.Y0 - 68); g.setLineDash([]);
    // ---- the garden inside the Crossing
    g.fillStyle = 'rgba(120,200,90,0.5)'; this.rr(g, 400, 190, 800, 520, 30); g.fill();
    // cobbled plaza where the die lands
    g.fillStyle = this.lg(g, 200, 640, ['#d9cfbf', '#bfb3a0']); g.beginPath(); g.ellipse(552, 420, 150, 230, 0, 0, 7); g.fill();
    g.strokeStyle = 'rgba(120,100,80,0.35)'; g.lineWidth = 1.5; for (let k = 0; k < 60; k++) { const a = this.h(k) * Math.PI * 2, r = Math.sqrt(this.h(k + 77)) * 0.9; const x = 552 + Math.cos(a) * 150 * r, y = 420 + Math.sin(a) * 230 * r; g.beginPath(); g.ellipse(x, y, 12, 8, a, 0, 7); g.stroke(); }
    g.strokeStyle = '#a89878'; g.lineWidth = 5; g.beginPath(); g.ellipse(552, 420, 150, 230, 0, 0, 7); g.stroke();
    // pond with lily pads
    this.pond = { x: 1010, y: 590 };
    g.fillStyle = '#8a7a66'; g.beginPath(); g.ellipse(1010, 594, 118, 58, 0, 0, 7); g.fill();
    g.fillStyle = this.lg(g, 540, 640, ['#7fd0ff', '#2f8ad8']); g.beginPath(); g.ellipse(1010, 590, 108, 50, 0, 0, 7); g.fill();
    for (const [x, y] of [[960, 580], [1060, 600], [1000, 612]]) { g.fillStyle = '#4fa83a'; g.beginPath(); g.arc(x, y, 9, 0.4, Math.PI * 2 - 0.2); g.lineTo(x, y); g.fill(); }
    g.fillStyle = '#9a8a76'; g.beginPath(); g.ellipse(1010, 562, 22, 9, 0, 0, 7); g.fill(); g.fillStyle = '#b8a890'; g.fillRect(1004, 540, 12, 22);
    // trees & flowers
    const tree = (x, y, s, c) => { g.fillStyle = 'rgba(0,0,0,0.2)'; g.beginPath(); g.ellipse(x + 8, y + 4, 26 * s, 9 * s, 0, 0, 7); g.fill(); g.fillStyle = '#6a4a2a'; g.fillRect(x - 5 * s, y - 30 * s, 10 * s, 32 * s); for (const [dx, dy, r] of [[0, -58, 30], [-20, -42, 22], [20, -42, 22]]) { g.fillStyle = c; g.beginPath(); g.arc(x + dx * s, y + dy * s, r * s, 0, 7); g.fill(); } g.fillStyle = 'rgba(255,255,255,0.18)'; g.beginPath(); g.arc(x - 8 * s, y - 68 * s, 10 * s, 0, 7); g.fill(); };
    [[760, 680, 1, '#4f9a3a'], [1150, 690, 1.1, '#3f8a30'], [1160, 420, 0.9, '#5aa83a'], [840, 420, 0.8, '#6fb848'], [430, 700, 0.8, '#4f9a3a'], [1180, 250, 0.7, '#5aa83a']].forEach(([x, y, s, c]) => tree(x, y, s, c));
    for (let k = 0; k < 40; k++) { const x = 740 + this.h(k + 900) * 440, y = 450 + this.h(k + 950) * 250; if (Math.hypot((x - 1010) / 120, (y - 590) / 60) < 1.2) continue; g.fillStyle = ['#ff8ad0', '#fff', '#ffd34d', '#b48aff'][k % 4]; g.beginPath(); g.arc(x, y, 3, 0, 7); g.fill(); }
    // ---- Hold islands
    const theme = [
      { top: ['#ffffff', '#dbeeff'], rim: '#b8d8f0', cliff: ['#c8d8e8', '#8aa0b8'] },
      { top: ['#7fd8ff', '#2f8ad8'], rim: '#f4e0b0', cliff: ['#a08a6a', '#5a4a38'] },
      { top: ['#5a3a30', '#2a1a14'], rim: '#8a3a1a', cliff: ['#4a2a20', '#1a0e0a'] },
      { top: ['#8fd36a', '#4f9a3a'], rim: '#6a5a3a', cliff: ['#7a6a4a', '#3a2e20'] },
    ];
    Render.HOMES.forEach((c, el) => {
      const T = theme[el], R0 = 160;
      g.fillStyle = this.lg(g, c.y, c.y + R0 + 110, T.cliff); g.beginPath(); g.moveTo(c.x - R0, c.y + 10);
      for (let a = 0; a <= 1; a += 0.1) { const x = c.x - R0 + a * R0 * 2; g.lineTo(x, c.y + 40 + Math.sin(a * Math.PI) * (R0 * 0.75 + this.h(a * 10 + el) * 30)); }
      g.lineTo(c.x + R0, c.y + 10); g.closePath(); g.fill();
      g.fillStyle = 'rgba(0,0,0,0.2)'; g.beginPath(); g.ellipse(c.x + 6, c.y + 14, R0, R0 * 0.94, 0, 0, 7); g.fill();
      g.fillStyle = T.rim; g.beginPath(); g.ellipse(c.x, c.y + 6, R0 + 4, R0 * 0.96, 0, 0, 7); g.fill();
      const gr = g.createRadialGradient(c.x - 40, c.y - 50, 20, c.x, c.y, R0); gr.addColorStop(0, T.top[0]); gr.addColorStop(1, T.top[1]); g.fillStyle = gr; g.beginPath(); g.ellipse(c.x, c.y, R0, R0 * 0.94, 0, 0, 7); g.fill();
      if (el === 0) for (let k = 0; k < 10; k++) this.cloud(g, c.x + Math.cos(k * 0.63) * 145, c.y + Math.sin(k * 0.63) * 135, 20, 'rgba(255,255,255,0.9)');
      if (el === 2) { g.strokeStyle = 'rgba(255,120,40,0.75)'; g.lineWidth = 3; for (let k = 0; k < 7; k++) { const a = k * 0.9; g.beginPath(); g.moveTo(c.x + Math.cos(a) * 60, c.y + Math.sin(a) * 60); g.lineTo(c.x + Math.cos(a + 0.2) * 110, c.y + Math.sin(a + 0.2) * 100); g.lineTo(c.x + Math.cos(a) * 150, c.y + Math.sin(a) * 140); g.stroke(); } }
      if (el === 3) for (let k = 0; k < 8; k++) { const a = k * 0.8 + 0.3, x = c.x + Math.cos(a) * 148, y = c.y + Math.sin(a) * 138; g.fillStyle = '#8a7a66'; g.beginPath(); g.ellipse(x, y, 14, 10, a, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,0.2)'; g.beginPath(); g.ellipse(x - 4, y - 3, 5, 3, a, 0, 7); g.fill(); }
      if (el === 1) { g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 2; for (let k = 0; k < 6; k++) { g.beginPath(); g.ellipse(c.x, c.y, 60 + k * 16, 40 + k * 15, 0, 0.3 + k, 1.2 + k); g.stroke(); } }
    });
    // ---- rope bridges from each Waygate to its Hold
    for (let el = 0; el < 4; el++) {
      const a = Render.trackPos(el * 10), b = G.simple ? Render.homeCenter(el) : Render.ringPos(el, 16);
      const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
      for (let s = 30; s < L - 20; s += 15) { const x = a.x + ux * s, y = a.y + uy * s + Math.sin(s / L * Math.PI) * 8; g.fillStyle = s % 30 ? '#a8784a' : '#8a5a32'; g.save(); g.translate(x, y); g.rotate(Math.atan2(uy, ux)); g.fillRect(-6, -14, 12, 28); g.restore(); }
      g.strokeStyle = '#6a4a2a'; g.lineWidth = 3; for (const sd of [-1, 1]) { g.beginPath(); for (let s = 30; s < L - 20; s += 10) { const x = a.x + ux * s + nx * 15 * sd, y = a.y + uy * s + ny * 15 * sd + Math.sin(s / L * Math.PI) * 8 - 6; s === 30 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke(); }
    }
    return cv;
  },
};
