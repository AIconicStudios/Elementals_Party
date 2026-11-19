'use strict';
// Shared minigame art kit: animated layered scenes and nicer props (rocks, platforms, coins, stars,
// gems, fireballs, clouds, water). All games draw through these so the Moot looks like one world.
Object.assign(MGH, {
  // deterministic noise for stable shapes
  hash(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); },
  grad(g, y0, y1, stops) { const gr = g.createLinearGradient(0, y0, 0, y1); stops.forEach((c, k) => gr.addColorStop(k / (stops.length - 1), c)); return gr; },
  glow(g, x, y, r, col, a = 1) { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.save(); g.globalAlpha *= a; g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore(); },
  ridge(g, y, amp, col, seed, t = 0, speed = 0, step = 40) {
    g.fillStyle = col; g.beginPath(); g.moveTo(0, 720);
    const off = (t * speed) % 2000;
    for (let x = -step; x <= 1280 + step; x += step) { const k = (x + off) / step + seed * 13; const h = (this.hash(Math.floor(k)) * (1 - (k % 1)) + this.hash(Math.floor(k) + 1) * (k % 1)); g.lineTo(x, y - h * amp); }
    g.lineTo(1280, 720); g.closePath(); g.fill();
  },
  cloud(g, x, y, s, col = 'rgba(255,255,255,0.85)') {
    g.fillStyle = col; g.beginPath();
    [[0, 0, 1], [-0.9, 0.2, 0.7], [0.9, 0.2, 0.75], [0.4, -0.35, 0.7], [-0.4, -0.3, 0.6]].forEach(([dx, dy, r]) => { g.moveTo(x + dx * s + r * s, y + dy * s); g.arc(x + dx * s, y + dy * s, r * s, 0, 7); });
    g.fill();
  },
  stars(g, t, n = 90, y1 = 720, a = 1) { for (let k = 0; k < n; k++) { const x = this.hash(k) * 1280, y = 40 + this.hash(k + 99) * (y1 - 40), tw = 0.4 + 0.6 * Math.abs(Math.sin(t * (0.5 + this.hash(k + 7)) + k)); g.globalAlpha = tw * a; g.fillStyle = '#fff'; g.fillRect(x, y, 1.6 + this.hash(k + 3) * 1.6, 1.6 + this.hash(k + 3) * 1.6); } g.globalAlpha = 1; },
  motes(g, t, col, n = 30, rise = 30, size = 2.5) { for (let k = 0; k < n; k++) { const x = (this.hash(k) * 1280 + Math.sin(t * 0.7 + k) * 30) % 1280, y = 720 - ((t * rise * (0.5 + this.hash(k + 5)) + this.hash(k + 11) * 720) % 680); g.globalAlpha = 0.25 + 0.5 * this.hash(k + 2); g.fillStyle = col; g.beginPath(); g.arc(x, y, size * (0.5 + this.hash(k + 4)), 0, 7); g.fill(); } g.globalAlpha = 1; },

  // full-screen animated environments
  scene(g, theme, t = 0) {
    const W = 1280, H = 720;
    switch (theme) {
      case 'sky': default:
        g.fillStyle = this.grad(g, 0, H, ['#4aa8ff', '#9fd8ff', '#e8f6ff']); g.fillRect(0, 0, W, H);
        this.glow(g, 1080, 120, 220, 'rgba(255,250,210,0.9)');
        for (let k = 0; k < 6; k++) this.cloud(g, ((k * 260 + t * (12 + k * 3)) % 1500) - 110, 90 + (k % 3) * 70, 26 + (k % 3) * 8);
        this.ridge(g, 600, 120, '#7fb7e6', 1); this.ridge(g, 660, 80, '#5d9fd1', 2);
        break;
      case 'meadow':
        g.fillStyle = this.grad(g, 0, H, ['#5fc0ff', '#bfe8ff', '#f4ffe8']); g.fillRect(0, 0, W, H);
        this.glow(g, 200, 110, 200, 'rgba(255,248,200,0.9)');
        for (let k = 0; k < 5; k++) this.cloud(g, ((k * 300 + t * 10) % 1500) - 110, 80 + (k % 2) * 60, 24);
        this.ridge(g, 520, 120, '#8fd17a', 3); this.ridge(g, 600, 70, '#6fbf5a', 4); this.ridge(g, 660, 40, '#58a848', 5);
        break;
      case 'sunset':
        g.fillStyle = this.grad(g, 0, H, ['#3a1f6b', '#c4497a', '#ff9a52', '#ffd27a']); g.fillRect(0, 0, W, H);
        this.glow(g, 640, 520, 300, 'rgba(255,220,140,0.9)');
        for (let k = 0; k < 4; k++) this.cloud(g, ((k * 360 + t * 8) % 1600) - 150, 140 + k * 40, 30, 'rgba(255,170,150,0.55)');
        this.ridge(g, 560, 140, '#5a2f6b', 6); this.ridge(g, 640, 90, '#3a1f4a', 7);
        break;
      case 'night':
        g.fillStyle = this.grad(g, 0, H, ['#070b24', '#16205a', '#2a2a70']); g.fillRect(0, 0, W, H);
        this.stars(g, t, 120, 500); this.glow(g, 1050, 130, 120, 'rgba(230,235,255,0.7)');
        g.fillStyle = '#eef'; g.beginPath(); g.arc(1050, 130, 34, 0, 7); g.fill(); g.fillStyle = '#16205a'; g.beginPath(); g.arc(1066, 120, 30, 0, 7); g.fill();
        this.ridge(g, 600, 120, '#141a44', 8); this.ridge(g, 670, 60, '#0c1030', 9);
        break;
      case 'storm': {
        g.fillStyle = this.grad(g, 0, H, ['#0a0d1c', '#1d2340', '#2e3352']); g.fillRect(0, 0, W, H);
        for (let k = 0; k < 7; k++) this.cloud(g, ((k * 230 + t * 30) % 1500) - 120, 70 + (k % 3) * 40, 46, 'rgba(40,46,80,0.9)');
        g.strokeStyle = 'rgba(160,180,255,0.25)'; g.lineWidth = 1.5; for (let k = 0; k < 70; k++) { const x = (this.hash(k) * 1400 + t * 300) % 1400 - 60, y = (this.hash(k + 9) * 720 + t * 900) % 760 - 40; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 8, y + 22); g.stroke(); }
        this.ridge(g, 640, 90, '#10142a', 10);
        break;
      }
      case 'lava': {
        g.fillStyle = this.grad(g, 0, H, ['#1a0606', '#4a0f08', '#8a2408']); g.fillRect(0, 0, W, H);
        this.ridge(g, 420, 200, '#2a0a06', 11); this.glow(g, 640, 760, 600, 'rgba(255,90,20,0.55)');
        this.motes(g, t, '#ff8a3d', 40, 60, 2.5);
        break;
      }
      case 'ocean': {
        g.fillStyle = this.grad(g, 0, H, ['#6fd0ff', '#b8ecff', '#2f8ad8', '#0a3a7a']); g.fillRect(0, 0, W, H);
        this.glow(g, 1000, 100, 200, 'rgba(255,255,220,0.9)');
        for (let k = 0; k < 4; k++) this.cloud(g, ((k * 360 + t * 10) % 1600) - 150, 90 + k * 25, 26);
        break;
      }
      case 'underwater': {
        g.fillStyle = this.grad(g, 0, H, ['#1a8ad0', '#0b5a9a', '#06305a']); g.fillRect(0, 0, W, H);
        for (let k = 0; k < 7; k++) { g.save(); g.globalAlpha = 0.08; g.fillStyle = '#dff6ff'; g.beginPath(); const x = k * 210 + Math.sin(t * 0.4 + k) * 40; g.moveTo(x, 0); g.lineTo(x + 70, 0); g.lineTo(x + 180, H); g.lineTo(x + 60, H); g.fill(); g.restore(); }
        this.motes(g, t, 'rgba(220,245,255,0.8)', 30, 40, 2.5);
        break;
      }
      case 'forest': {
        g.fillStyle = this.grad(g, 0, H, ['#9fe0c8', '#d9f5d0', '#5f9a5a']); g.fillRect(0, 0, W, H);
        for (let layer = 0; layer < 3; layer++) for (let k = 0; k < 14; k++) {
          const x = (k * 110 + layer * 50 + this.hash(k + layer * 20) * 60) % 1400 - 60, h = 160 + layer * 60 + this.hash(k + layer) * 80, base = 560 + layer * 50;
          g.fillStyle = ['#7fbf8a', '#4f9a5f', '#2f7040'][layer]; g.beginPath(); g.moveTo(x, base - h); g.lineTo(x - 50 - layer * 8, base); g.lineTo(x + 50 + layer * 8, base); g.fill();
        }
        g.fillStyle = '#3f7a3a'; g.fillRect(0, 640, W, 80);
        this.motes(g, t, 'rgba(255,255,170,0.9)', 18, 12, 2);
        break;
      }
      case 'ice': {
        g.fillStyle = this.grad(g, 0, H, ['#bfe8ff', '#e8f8ff', '#ffffff']); g.fillRect(0, 0, W, H);
        g.fillStyle = 'rgba(160,210,240,0.8)'; for (let k = 0; k < 9; k++) { const x = k * 160 + this.hash(k) * 60; g.beginPath(); g.moveTo(x - 90, 520); g.lineTo(x, 300 + this.hash(k + 4) * 120); g.lineTo(x + 90, 520); g.fill(); }
        g.fillStyle = 'rgba(255,255,255,0.9)'; for (let k = 0; k < 9; k++) { const x = k * 160 + this.hash(k) * 60, top = 300 + this.hash(k + 4) * 120; g.beginPath(); g.moveTo(x - 25, top + 40); g.lineTo(x, top); g.lineTo(x + 25, top + 40); g.fill(); }
        for (let k = 0; k < 50; k++) { const x = (this.hash(k) * 1280 + Math.sin(t + k) * 20) % 1280, y = (this.hash(k + 3) * 720 + t * 40) % 720; g.fillStyle = 'rgba(255,255,255,0.9)'; g.beginPath(); g.arc(x, y, 2, 0, 7); g.fill(); }
        break;
      }
      case 'desert': {
        g.fillStyle = this.grad(g, 0, H, ['#ffb35c', '#ffe0a0', '#f2c27a']); g.fillRect(0, 0, W, H);
        this.glow(g, 640, 170, 160, 'rgba(255,255,220,1)');
        this.ridge(g, 520, 130, '#d98a4a', 12, t, 4, 80); this.ridge(g, 610, 70, '#c06f38', 13, t, 8, 80);
        break;
      }
      case 'temple': {
        g.fillStyle = this.grad(g, 0, H, ['#2a1840', '#45285e', '#1a0f28']); g.fillRect(0, 0, W, H);
        for (let k = 0; k < 6; k++) { const x = 60 + k * 232; g.fillStyle = 'rgba(255,255,255,0.05)'; g.fillRect(x, 60, 46, 660); g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(x - 10, 60, 66, 18); }
        for (const x of [120, 1160]) { this.glow(g, x, 260, 120, 'rgba(255,170,60,0.6)'); g.fillStyle = '#ffb347'; g.beginPath(); g.ellipse(x, 252 + Math.sin(t * 9 + x) * 2, 8, 15, 0, 0, 7); g.fill(); }
        break;
      }
      case 'space': {
        g.fillStyle = this.grad(g, 0, H, ['#05030f', '#140a2e', '#0a0618']); g.fillRect(0, 0, W, H);
        this.glow(g, 300, 250, 380, 'rgba(120,60,200,0.35)'); this.glow(g, 1000, 500, 340, 'rgba(40,120,200,0.3)');
        this.stars(g, t, 160);
        g.fillStyle = '#c46a3a'; g.beginPath(); g.arc(1120, 140, 46, 0, 7); g.fill(); g.strokeStyle = 'rgba(255,220,160,0.6)'; g.lineWidth = 4; g.beginPath(); g.ellipse(1120, 140, 78, 16, -0.3, 0, 7); g.stroke();
        break;
      }
      case 'cave': {
        g.fillStyle = this.grad(g, 0, H, ['#1a1410', '#2e2418', '#120d08']); g.fillRect(0, 0, W, H);
        g.fillStyle = '#0d0a06'; for (let k = 0; k < 18; k++) { const x = k * 76 + this.hash(k) * 30; g.beginPath(); g.moveTo(x - 24, 40); g.lineTo(x, 40 + 50 + this.hash(k + 2) * 70); g.lineTo(x + 24, 40); g.fill(); }
        for (let k = 0; k < 8; k++) { const x = this.hash(k + 30) * 1280, y = 120 + this.hash(k + 31) * 400; this.glow(g, x, y, 30, ['rgba(120,220,255,0.5)', 'rgba(200,120,255,0.5)'][k % 2]); }
        break;
      }
      case 'stage': {
        g.fillStyle = this.grad(g, 0, H, ['#1a0a2e', '#2e1050', '#120626']); g.fillRect(0, 0, W, H);
        for (let k = 0; k < 4; k++) { const a = Math.sin(t * 0.8 + k * 1.7) * 0.35, x = 160 + k * 320; g.save(); g.translate(x, 40); g.rotate(a); g.globalAlpha = 0.12; g.fillStyle = ['#ff5ab4', '#5ad8ff', '#ffe65a', '#8aff6a'][k]; g.beginPath(); g.moveTo(-14, 0); g.lineTo(14, 0); g.lineTo(140, 700); g.lineTo(-140, 700); g.fill(); g.restore(); }
        g.fillStyle = '#2a1640'; g.fillRect(0, 600, W, 120); g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(0, 600, W, 6);
        break;
      }
      case 'dojo': {
        g.fillStyle = this.grad(g, 0, H, ['#3a2214', '#5a3820', '#2a180c']); g.fillRect(0, 0, W, H);
        for (let k = 0; k < 9; k++) { g.fillStyle = 'rgba(255,230,180,0.08)'; g.fillRect(k * 150, 60, 130, 380); g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 3; g.strokeRect(k * 150, 60, 130, 380); g.beginPath(); g.moveTo(k * 150 + 65, 60); g.lineTo(k * 150 + 65, 440); g.moveTo(k * 150, 250); g.lineTo(k * 150 + 130, 250); g.stroke(); }
        g.fillStyle = '#7a5530'; g.fillRect(0, 440, W, 280); g.strokeStyle = 'rgba(0,0,0,0.18)'; for (let y = 470; y < 720; y += 36) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
        break;
      }
    }
  },

  // ---- props
  rock(g, x, y, r, seed = 0, col = '#8a7a66', rot = 0) {
    g.save(); g.translate(x, y); g.rotate(rot);
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(r * 0.1, r * 0.85, r * 0.9, r * 0.25, 0, 0, 7); g.fill();
    const n = 9, pts = []; for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2, rr = r * (0.78 + this.hash(seed * 17 + k) * 0.3); pts.push([Math.cos(a) * rr, Math.sin(a) * rr]); }
    g.beginPath(); pts.forEach(([px, py], k) => k ? g.lineTo(px, py) : g.moveTo(px, py)); g.closePath();
    const gr = g.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r * 1.1); gr.addColorStop(0, this.tint(col, 0.35)); gr.addColorStop(1, this.tint(col, -0.45)); g.fillStyle = gr; g.fill();
    g.strokeStyle = this.tint(col, -0.6); g.lineWidth = Math.max(1, r * 0.06); g.stroke();
    g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = Math.max(1, r * 0.05); g.beginPath(); g.moveTo(-r * 0.2, -r * 0.1); g.lineTo(r * 0.15, r * 0.2); g.lineTo(r * 0.45, r * 0.1); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.18)'; g.beginPath(); g.ellipse(-r * 0.3, -r * 0.35, r * 0.28, r * 0.15, -0.5, 0, 7); g.fill();
    g.restore();
  },
  tint(col, k) { return Char.shade(col, k); },
  plat(g, x, y, w, h, kind = 'stone', t = 0) {
    const C = { stone: ['#a39a8a', '#6a6254'], wood: ['#c98a4a', '#7a4a22'], ice: ['#d8f4ff', '#7ac0e8'], grass: ['#8fd36a', '#6a4a2a'], metal: ['#b8c0cc', '#5a6270'], lava: ['#5a2a1a', '#2a0e06'], cloud: ['#ffffff', '#c8dcf0'], gold: ['#ffd34d', '#a8790a'] }[kind] || ['#aaa', '#555'];
    g.fillStyle = 'rgba(0,0,0,0.28)'; this.rr(g, x + 4, y + 6, w, h, Math.min(8, h / 2)); g.fill();
    g.fillStyle = this.grad(g, y, y + h, [C[0], C[1]]); this.rr(g, x, y, w, h, Math.min(8, h / 2)); g.fill();
    if (kind === 'grass') { g.fillStyle = '#6fc04a'; this.rr(g, x - 2, y - 2, w + 4, Math.min(9, h * 0.6), 5); g.fill(); g.fillStyle = '#8fe06a'; for (let k = 6; k < w - 4; k += 10) { g.beginPath(); g.moveTo(x + k, y); g.lineTo(x + k + 3, y - 5); g.lineTo(x + k + 6, y); g.fill(); } }
    else if (kind === 'wood') { g.strokeStyle = 'rgba(0,0,0,0.2)'; g.lineWidth = 1.5; for (let k = 24; k < w; k += 28) { g.beginPath(); g.moveTo(x + k, y + 2); g.lineTo(x + k, y + h - 2); g.stroke(); } }
    else if (kind === 'stone') { g.strokeStyle = 'rgba(0,0,0,0.18)'; g.lineWidth = 1.5; for (let k = 30; k < w; k += 36) { g.beginPath(); g.moveTo(x + k, y); g.lineTo(x + k - 4, y + h); g.stroke(); } }
    else if (kind === 'ice') { g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(x + 6, y + 2, w * 0.4, 2); }
    g.fillStyle = 'rgba(255,255,255,0.25)'; this.rr(g, x + 3, y + 1, w - 6, Math.max(2, h * 0.22), 3); g.fill();
  },
  coin(g, x, y, r, t = 0) {
    const w = Math.max(0.2, Math.abs(Math.cos(t * 3)));
    this.glow(g, x, y, r * 2.2, 'rgba(255,220,90,0.35)');
    g.fillStyle = '#ffd34d'; g.strokeStyle = '#a8790a'; g.lineWidth = Math.max(1, r * 0.16); g.beginPath(); g.ellipse(x, y, r * w, r, 0, 0, 7); g.fill(); g.stroke();
    if (w > 0.5) { g.fillStyle = '#fff1a8'; g.beginPath(); g.ellipse(x - r * 0.25 * w, y - r * 0.3, r * 0.28 * w, r * 0.2, 0, 0, 7); g.fill(); }
  },
  star(g, x, y, r, col = '#ffd34d', rot = 0, glow = true) {
    if (glow) this.glow(g, x, y, r * 2.4, 'rgba(255,230,120,0.45)');
    g.save(); g.translate(x, y); g.rotate(rot); g.beginPath();
    for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * 0.45 : r; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    g.closePath(); g.fillStyle = col; g.fill(); g.strokeStyle = this.tint(col, -0.35); g.lineWidth = Math.max(1, r * 0.1); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.45)'; g.beginPath(); g.arc(-r * 0.15, -r * 0.2, r * 0.18, 0, 7); g.fill();
    g.restore();
  },
  gem(g, x, y, r, col = '#5fd8ff', t = 0) {
    this.glow(g, x, y, r * 2.2, col, 0.35);
    g.save(); g.translate(x, y + Math.sin(t * 3) * 2);
    g.fillStyle = col; g.beginPath(); g.moveTo(0, -r); g.lineTo(r * 0.8, -r * 0.2); g.lineTo(0, r); g.lineTo(-r * 0.8, -r * 0.2); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.moveTo(0, -r); g.lineTo(r * 0.3, -r * 0.2); g.lineTo(-r * 0.3, -r * 0.2); g.closePath(); g.fill();
    g.strokeStyle = this.tint(col, -0.4); g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, -r); g.lineTo(r * 0.8, -r * 0.2); g.lineTo(0, r); g.lineTo(-r * 0.8, -r * 0.2); g.closePath(); g.stroke();
    g.restore();
  },
  fireball(g, x, y, r, t = 0, vx = 0, vy = 1, col = ['#ffe680', '#ff8a3d', '#ff3d1f']) {
    const a = Math.atan2(vy, vx);
    g.save(); g.translate(x, y); g.rotate(a);
    for (let k = 5; k >= 0; k--) { g.globalAlpha = 0.18 + 0.1 * (5 - k); g.fillStyle = col[2]; g.beginPath(); g.ellipse(-k * r * 0.45, Math.sin(t * 20 + k) * r * 0.12, r * (1 - k * 0.12), r * (0.85 - k * 0.1), 0, 0, 7); g.fill(); }
    g.globalAlpha = 1;
    const gr = g.createRadialGradient(r * 0.2, 0, 0, 0, 0, r); gr.addColorStop(0, col[0]); gr.addColorStop(0.6, col[1]); gr.addColorStop(1, col[2]);
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill();
    g.restore();
  },
  surface(g, y, t, top = 'rgba(120,200,255,0.75)', body = ['rgba(40,140,255,0.7)', 'rgba(10,50,140,0.9)'], amp = 6) {
    g.fillStyle = this.grad(g, y, 720, body); g.beginPath(); g.moveTo(0, 720);
    for (let x = 0; x <= 1280; x += 16) g.lineTo(x, y + Math.sin(x * 0.03 + t * 3) * amp + Math.sin(x * 0.011 - t * 2) * amp * 0.6);
    g.lineTo(1280, 720); g.closePath(); g.fill();
    g.strokeStyle = top; g.lineWidth = 4; g.beginPath(); for (let x = 0; x <= 1280; x += 16) { const yy = y + Math.sin(x * 0.03 + t * 3) * amp + Math.sin(x * 0.011 - t * 2) * amp * 0.6; x ? g.lineTo(x, yy) : g.moveTo(x, yy); } g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.35)'; for (let k = 0; k < 14; k++) { const x = (k * 97 + t * 30) % 1280; g.fillRect(x, y + 14 + (k % 3) * 18, 26, 2); }
  },
  shadow(g, x, y, rx, a = 0.3) { g.fillStyle = `rgba(0,0,0,${a})`; g.beginPath(); g.ellipse(x, y, rx, rx * 0.3, 0, 0, 7); g.fill(); },
  // shiny title-ish label on a pill
  label(g, s, x, y, size = 22, col = '#fff', bg = 'rgba(0,0,0,0.45)') {
    g.font = `bold ${size}px Georgia, "Segoe UI Emoji"`; const w = g.measureText(s).width + size * 1.2;
    g.fillStyle = bg; this.rr(g, x - w / 2, y - size * 0.95, w, size * 1.35, size * 0.6); g.fill();
    g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = size * 0.16; g.strokeStyle = 'rgba(0,0,0,0.6)'; g.strokeText(s, x, y); g.fillStyle = col; g.fillText(s, x, y);
  },
  emoji(g, ic, x, y, size, rot = 0) { g.save(); g.translate(x, y); g.rotate(rot); g.font = `${Math.round(size)}px "Segoe UI Emoji","Apple Color Emoji",sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.fillText(ic, 0, 0); g.restore(); g.textBaseline = 'alphabetic'; },
  // "WATCH" / "YOUR TURN" phase banner for memory & cursor games
  phase(g, watch, t, sub) {
    const pulse = 0.85 + 0.15 * Math.sin(t * 6);
    g.save(); g.translate(640, 92); g.scale(pulse, pulse);
    this.label(g, watch ? '👀 WATCH CLOSELY' : '👉 YOUR TURN!', 0, 12, 34, watch ? '#9fe0ff' : '#ffe680', watch ? 'rgba(20,60,120,0.75)' : 'rgba(120,70,0,0.8)');
    g.restore();
    if (sub) this.text(g, sub, 640, 138, 18, '#fff');
  },
});
