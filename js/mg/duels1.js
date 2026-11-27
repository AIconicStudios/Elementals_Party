'use strict';
// DUELS (part 1): two-player face-offs (they also run in free play; the other two players watch)
// + Number Climb, which also has a 4-player version

const DU = {
  pair(m) { return m.duel || [0, 1]; },
  // full score array: the two duelists get their scores, watchers get -1 (never win)
  scores(m, a, b) { const [x, y] = this.pair(m), s = [-1, -1, -1, -1]; s[x] = a; s[y] = b; return s; },
  on(m, i) { return this.pair(m).includes(i); },
  hud(m, i, txt) { return this.on(m, i) ? txt : '👀 watching'; },
};

// ===================================================================== NUMBER CLIMB (2-player duel + 4-player race)
// Climb the vines and grab hanging numbers 1–9; touch the + − × ÷ stones by the water to change what a number does.
// Hit the host's target EXACTLY to win the round. Five rounds: easy sums → times → mixed → big → negative.
const NC = {
  // the classic layout: a stone ledge on top, four pairs of twin vines each side, floating platforms in the middle,
  // and a row of little islands over the water at the bottom where the + − × ÷ signs stand
  ISL: [[30, 205], [285, 435], [515, 765], [845, 995], [1075, 1250]], // islands [x0, x1] (top at GY)
  ROPES: [190, 300, 410, 520, 760, 870, 980, 1090],                    // centre of each twin-vine pair
  PLAT: [[585, 695, 330], [570, 710, 465]],                            // floating platforms [x0, x1, y]
  TOP: 200, BOT: 520, GY: 620,
  SITES: [80, 130, 355, 595, 685, 920, 1150, 1210],
  target(round) {
    if (round === 0) return R.int(9, 18);
    if (round === 1) return R.pick([24, 27, 28, 32, 35, 36, 42, 45, 48]);
    if (round === 2) return R.int(31, 58);
    if (round === 3) return R.int(64, 99);
    return -R.int(6, 21);
  },
  apply(tot, op, v) { if (op === '+') return tot + v; if (op === '−') return tot - v; if (op === '×') return tot * v; if (op === '÷') return tot % v === 0 ? tot / v : null; return tot; },
  near(r, d) { const rx = this.ROPES[r]; let best = -1, bd = 1e9; this.ROPES.forEach((qx, q) => { const dd = (qx - rx) * d; if (q !== r && dd > 0 && dd < 130 && dd < bd) { bd = dd; best = q; } }); return best; },
  islandAt(x) { return this.ISL.find(([a, b]) => x >= a && x <= b); },
  standOn(x, y) { return (Math.abs(y - this.GY) < 1 && this.islandAt(x)) || this.PLAT.some(([a, b, py]) => x >= a && x <= b && Math.abs(y - py) < 1); },
};
// ---------------------------------------------------------------- Number Climb art: a sunset jungle lagoon
const NCART = {
  // the static backdrop, drawn once
  bg(g) {
    GX.vfill(g, 0, 0, 1280, 620, ['#ff7f7a', '#ffa47a', '#ffd08a', '#ffe8b0', '#c8e8f0']);
    // sun with soft rays
    g.save(); g.translate(640, 420); for (let k = 0; k < 14; k++) { g.rotate(Math.PI * 2 / 14); g.fillStyle = 'rgba(255,240,190,0.13)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(-40, -700); g.lineTo(40, -700); g.fill(); } g.restore();
    MGH.glow(g, 640, 420, 360, 'rgba(255,230,160,0.6)'); g.fillStyle = '#fff4c8'; g.beginPath(); g.arc(640, 420, 70, 0, 7); g.fill(); g.fillStyle = "rgba(255,200,140,0.5)"; for (let k = 0; k < 3; k++) g.fillRect(560, 424 + k * 14, 160, 4);
    // far mountains, misty layers
    const ridge = (y, amp, f, col, seed) => { g.fillStyle = col; g.beginPath(); g.moveTo(0, 620); for (let x = 0; x <= 1280; x += 16) g.lineTo(x, y - Math.abs(Math.sin(x * f + seed)) * amp - Math.sin(x * f * 2.7 + seed) * amp * 0.25); g.lineTo(1280, 620); g.fill(); };
    ridge(470, 150, 0.004, 'rgba(190,120,150,0.55)', 1); ridge(520, 110, 0.006, 'rgba(150,100,140,0.6)', 3);
    // the cliff with the waterfall (right side, behind island 4)
    g.fillStyle = '#6a5a7a'; g.beginPath(); g.moveTo(940, 620); g.lineTo(960, 420); g.quadraticCurveTo(1000, 360, 1060, 372); g.lineTo(1120, 380); g.quadraticCurveTo(1170, 420, 1180, 620); g.fill();
    g.fillStyle = 'rgba(80,140,90,0.8)'; for (let k = 0; k < 9; k++) { g.beginPath(); g.arc(970 + k * 25, 378 + Math.sin(k) * 8, 18, 0, 7); g.fill(); }
    // far jungle tree line with palm silhouettes
    g.fillStyle = '#2f6a5a'; g.beginPath(); g.moveTo(0, 620); for (let x = 0; x <= 1280; x += 22) g.lineTo(x, 572 - Math.abs(Math.sin(x * 0.05)) * 18 - Math.sin(x * 0.013) * 10); g.lineTo(1280, 620); g.fill();
    for (const [x, h] of [[30, 90], [330, 70], [640, 60], [900, 84], [1250, 76]]) { g.strokeStyle = '#24584a'; g.lineWidth = 6; g.beginPath(); g.moveTo(x, 600); g.quadraticCurveTo(x + 10, 600 - h / 2, x + 4, 600 - h); g.stroke(); g.fillStyle = '#24584a'; for (let q = 0; q < 6; q++) { const a = -Math.PI / 2 + (q - 2.5) * 0.55; g.beginPath(); g.ellipse(x + 4 + Math.cos(a) * 22, 600 - h + Math.sin(a) * 10 + 8, 24, 6, a, 0, 7); g.fill(); } }
    // lagoon base
    GX.vfill(g, 0, 606, 1280, 114, ['#6ab8d8', '#2a7ab8', '#1a4a88']);
    // sun reflection column
    for (let k = 0; k < 10; k++) { g.fillStyle = `rgba(255,236,180,${0.5 - k * 0.04})`; g.beginPath(); g.ellipse(640, 616 + k * 10, 70 - k * 4, 2.5, 0, 0, 7); g.fill(); }
  },
  falls(g, t) {
    const x0 = 1040, w = 34, y0 = 380, y1 = 612;
    const fg = g.createLinearGradient(x0, 0, x0 + w, 0); fg.addColorStop(0, 'rgba(200,240,255,0.65)'); fg.addColorStop(0.5, 'rgba(255,255,255,0.9)'); fg.addColorStop(1, 'rgba(180,230,255,0.65)'); g.fillStyle = fg; g.fillRect(x0, y0, w, y1 - y0);
    g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 2; for (let k = 0; k < 6; k++) { const y = y0 + ((t * 160 + k * 40) % (y1 - y0)); g.beginPath(); g.moveTo(x0 + 4 + k * 5, y); g.lineTo(x0 + 4 + k * 5, y + 18); g.stroke(); }
    for (let k = 0; k < 7; k++) { const a = (t * 0.8 + k / 7) % 1; g.fillStyle = `rgba(255,255,255,${0.5 * (1 - a)})`; g.beginPath(); g.arc(x0 + w / 2 + (k - 3) * 9 * a * 2, y1 - a * 26, 8 + a * 12, 0, 7); g.fill(); }
  },
  water(g, t) {
    for (let k = 0; k < 22; k++) { const row = k % 4, x = (k * 83 + t * (18 + row * 8)) % 1340 - 30, y = 626 + row * 22; g.strokeStyle = `rgba(255,255,255,${0.45 - row * 0.07})`; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 14, y - 6, x + 28, y); g.stroke(); }
    for (let k = 0; k < 14; k++) if (Math.sin(t * 3 + k * 2.3) > 0.85) MGH.star(g, (k * 97) % 1280, 630 + (k * 37) % 80, 3.5, '#fff', 0, false);
    // lily pads with flowers bobbing between the islands
    for (const [x, y] of [[345, 660], [652, 690], [930, 664], [40, 694], [1250, 668]]) { const b = Math.sin(t * 1.5 + x) * 2; g.fillStyle = '#3a9a4a'; g.beginPath(); g.ellipse(x, y + b, 22, 7, 0, 0.3, Math.PI * 2 - 0.1); g.lineTo(x, y + b); g.fill(); g.fillStyle = '#ff9ac8'; for (let q = 0; q < 5; q++) { const a = q / 5 * 6.28; g.beginPath(); g.ellipse(x + 4 + Math.cos(a) * 4, y - 3 + b + Math.sin(a) * 2, 4, 2.5, a, 0, 7); g.fill(); } g.fillStyle = '#ffe680'; g.beginPath(); g.arc(x + 4, y - 3 + b, 2, 0, 7); g.fill(); }
    // a fish leaps now and then
    const ph = (t % 7) / 1.1; if (ph < 1) { const fx = 360 + Math.floor(t / 7) % 3 * 300 + ph * 60, fy = 640 - Math.sin(ph * Math.PI) * 50; GX.fish(g, fx, fy, 12, '#ff9a4a', Math.cos(ph * Math.PI) * -0.9); }
  },
  palm(g, x, y, lean, t, h = 120) {
    const tx = x + lean * h * 0.5, ty = y - h, sw = Math.sin(t * 1.2 + x) * 0.06;
    g.strokeStyle = '#8a6a3a'; g.lineWidth = 10; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + lean * h * 0.1, y - h * 0.6, tx, ty); g.stroke();
    g.strokeStyle = 'rgba(60,40,20,0.4)'; g.lineWidth = 10; g.setLineDash([3, 9]); g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + lean * h * 0.1, y - h * 0.6, tx, ty); g.stroke(); g.setLineDash([]); g.lineCap = 'butt';
    for (let q = 0; q < 7; q++) { const a = -Math.PI / 2 + (q - 3) * 0.55 + sw, len = 54; g.save(); g.translate(tx, ty); g.rotate(a); g.fillStyle = q % 2 ? '#3aa840' : '#2a8a3a'; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(len * 0.5, -14, len, 6 + Math.abs(q - 3) * 3); g.quadraticCurveTo(len * 0.5, 4, 0, 0); g.fill(); g.restore(); }
    g.fillStyle = '#6a4a22'; for (let q = 0; q < 3; q++) { g.beginPath(); g.arc(tx - 6 + q * 6, ty + 6, 5, 0, 7); g.fill(); }
  },
  islands(g, t) {
    const PAL = [[48, -0.5], null, null, null, [1236, 0.5]];
    NC.ISL.forEach(([a, b], k) => {
      const y = NC.GY;
      g.fillStyle = 'rgba(20,60,110,0.35)'; g.beginPath(); g.ellipse((a + b) / 2, y + 44, (b - a) / 2 + 18, 9, 0, 0, 7); g.fill();
      const sg = g.createLinearGradient(0, y - 6, 0, y + 46); sg.addColorStop(0, '#ffe2a8'); sg.addColorStop(0.5, '#e8c080'); sg.addColorStop(1, '#a87a44'); g.fillStyle = sg;
      g.beginPath(); g.moveTo(a - 14, y + 42); g.quadraticCurveTo(a - 6, y - 4, a + 22, y - 2); g.lineTo(b - 22, y - 2); g.quadraticCurveTo(b + 6, y - 4, b + 14, y + 42); g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.55)'; g.beginPath(); g.ellipse((a + b) / 2, y + 41, (b - a) / 2 + 10, 3, 0, 0, 7); g.fill();
      for (let q = 0; q < 10; q++) { g.fillStyle = 'rgba(160,110,60,0.35)'; g.beginPath(); g.arc(a + 10 + MGH.hash(q + k * 13) * (b - a - 20), y + 10 + MGH.hash(q + 5 + k) * 26, 1.6, 0, 7); g.fill(); }
      // grass lip with tufts and flowers
      g.fillStyle = '#5ac040'; MGH.rr(g, a + 2, y - 9, b - a - 4, 12, 6); g.fill(); g.fillStyle = '#7ad85a'; MGH.rr(g, a + 6, y - 9, b - a - 12, 4, 2); g.fill();
      for (let x = a + 10; x < b - 8; x += 15) { g.fillStyle = '#3a9a2a'; g.beginPath(); g.moveTo(x - 4, y - 6); g.lineTo(x - 1, y - 16 - (x % 7)); g.lineTo(x + 2, y - 6); g.fill(); }
      for (let q = 0; q < 4; q++) { const fx = a + 26 + q * (b - a - 52) / 3, c = ['#ff6a8a', '#ffd34d', '#ffffff', '#c88aff'][(q + k) % 4]; g.fillStyle = c; for (let p = 0; p < 5; p++) { const an = p / 5 * 6.28; g.beginPath(); g.arc(fx + Math.cos(an) * 3, y - 12 + Math.sin(an) * 3, 2.6, 0, 7); g.fill(); } g.fillStyle = '#ffb030'; g.beginPath(); g.arc(fx, y - 12, 1.8, 0, 7); g.fill(); }
      // rocks and a shell
      g.fillStyle = '#8a8a96'; g.beginPath(); g.ellipse(b - 14, y + 30, 12, 8, 0, 0, 7); g.fill(); g.fillStyle = '#a8a8b4'; g.beginPath(); g.ellipse(b - 17, y + 27, 6, 3, 0, 0, 7); g.fill();
      g.fillStyle = '#ffc8d8'; g.beginPath(); g.moveTo(a + 18, y + 30); g.arc(a + 18, y + 30, 7, Math.PI, 0); g.fill(); g.strokeStyle = '#e898b0'; g.lineWidth = 1; for (let q = -2; q <= 2; q++) { g.beginPath(); g.moveTo(a + 18, y + 30); g.lineTo(a + 18 + q * 3, y + 24); g.stroke(); }
      if (PAL[k]) { const [px, lean] = PAL[k]; this.palm(g, px, y - 2, lean, t, 104); }
    });
  },
  totem(g, x, y, op, used, t) {
    const col = { '+': '#7cf06a', '−': '#6ac8ff', '×': '#ffb04a', '÷': '#d08aff' }[op];
    GX.shadow(g, x, y + 2, 34, 0.35);
    const sg = g.createLinearGradient(x - 26, 0, x + 26, 0); sg.addColorStop(0, '#6a6a7a'); sg.addColorStop(0.5, '#9a9aaa'); sg.addColorStop(1, '#5a5a6a'); g.fillStyle = sg;
    g.beginPath(); g.moveTo(x - 26, y); g.lineTo(x - 22, y - 50); g.quadraticCurveTo(x, y - 60, x + 22, y - 50); g.lineTo(x + 26, y); g.closePath(); g.fill();
    g.fillStyle = '#4a9a3a'; g.beginPath(); g.ellipse(x - 6, y - 52, 18, 6, -0.1, 0, 7); g.fill(); g.fillStyle = '#6ac04a'; g.beginPath(); g.ellipse(x + 10, y - 54, 9, 4, 0.2, 0, 7); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.2)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x - 18, y - 12); g.lineTo(x - 8, y - 6); g.moveTo(x + 14, y - 38); g.lineTo(x + 20, y - 30); g.stroke();
    MGH.glow(g, x, y - 26, used ? 42 : 30, used ? col + 'cc' : col + '55');
    const dg = g.createRadialGradient(x - 5, y - 31, 2, x, y - 26, 18); dg.addColorStop(0, '#ffffff'); dg.addColorStop(0.35, col); dg.addColorStop(1, Char.shade(col, -0.35)); g.fillStyle = dg; g.beginPath(); g.arc(x, y - 26, 17, 0, 7); g.fill(); g.strokeStyle = 'rgba(40,30,50,0.6)'; g.lineWidth = 2.5; g.stroke();
    g.font = 'bold 30px Georgia'; g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 5; g.strokeStyle = 'rgba(30,20,40,0.85)'; g.strokeText(op, x, y - 15); g.fillStyle = '#fff'; g.fillText(op, x, y - 15);
    if (used) for (let q = 0; q < 3; q++) { const a = t * 2 + q * 2.1; MGH.star(g, x + Math.cos(a) * 30, y - 26 + Math.sin(a) * 14, 4, col, a, false); }
  },
  canopyArt(b) {
    {
      for (let k = 0; k < 20; k++) { const x = k * 68 - 10, y = 66 + MGH.hash(k) * 30; b.fillStyle = '#1f5a2a'; b.beginPath(); b.arc(x, y - 20, 50, 0, 7); b.fill(); }
      b.fillStyle = '#5a3a1e'; b.fillRect(0, 34, 1280, 14); b.fillStyle = 'rgba(255,255,255,0.12)'; b.fillRect(0, 36, 1280, 3);
      for (let k = 0; k < 18; k++) GX.canopy(b, k * 76, 92 + (k % 2) * 16, 66, k % 3 ? '#2f7a3a' : '#3f8a3a', k, 0);
      for (let k = 0; k < 16; k++) { const x = 30 + k * 82 + MGH.hash(k + 4) * 30, y = 108 + MGH.hash(k + 9) * 26, c = ['#ff5a7a', '#ffd34d', '#ff8ac8', '#ffffff'][k % 4]; for (let p = 0; p < 5; p++) { const a = p / 5 * 6.28; b.fillStyle = c; b.beginPath(); b.ellipse(x + Math.cos(a) * 6, y + Math.sin(a) * 6, 6, 3.5, a, 0, 7); b.fill(); } b.fillStyle = '#ffb030'; b.beginPath(); b.arc(x, y, 3, 0, 7); b.fill(); }
      for (let k = 0; k < 9; k++) { const x = 80 + k * 140, y = 120 + MGH.hash(k + 2) * 16; b.strokeStyle = '#3a7a2a'; b.lineWidth = 2; b.beginPath(); b.moveTo(x, y - 14); b.lineTo(x, y); b.stroke(); b.fillStyle = k % 2 ? '#ffb030' : '#ffd34d'; b.beginPath(); b.ellipse(x, y + 8, 8, 10, 0, 0, 7); b.fill(); b.fillStyle = 'rgba(255,255,255,0.4)'; b.beginPath(); b.arc(x - 3, y + 4, 2.5, 0, 7); b.fill(); }
    }
  },
  canopy(g, t) {
    // parrots perched on the canopy, bobbing
    for (const [x, y, c] of [[410, 128, '#e8323e'], [1000, 132, '#2a8ae8'], [876, 120, '#3ac85a']]) { const b = Math.sin(t * 3 + x) * 2, look = Math.sin(t * 0.8 + x) > 0 ? 1 : -1;
      g.fillStyle = c; g.beginPath(); g.ellipse(x, y + b, 10, 14, 0, 0, 7); g.fill(); g.beginPath(); g.arc(x + 2 * look, y - 14 + b, 8, 0, 7); g.fill();
      g.fillStyle = '#ffd34d'; g.beginPath(); g.ellipse(x - 4 * look, y + 2 + b, 6, 10, 0.2 * look, 0, 7); g.fill(); g.fillStyle = '#3a8ae8'; g.beginPath(); g.moveTo(x - 4, y + 10 + b); g.lineTo(x - 8 * look, y + 30 + b); g.lineTo(x + 2, y + 12 + b); g.fill();
      g.fillStyle = '#f4e8c8'; g.beginPath(); g.moveTo(x + 9 * look, y - 15 + b); g.quadraticCurveTo(x + 16 * look, y - 12 + b, x + 9 * look, y - 7 + b); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(x + 4 * look, y - 16 + b, 3, 0, 7); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.arc(x + 5 * look, y - 16 + b, 1.6, 0, 7); g.fill(); }
  },
  // a pair of twin vines (you climb with a hand on each), with leaves and the odd flower
  vine(g, rx, r, t) {
    for (const sd of [-11, 11]) {
      const sw = Math.sin(t * 1.3 + r + sd) * 2.5, X = y => rx + sd + sw * Math.sin((y - NC.TOP + 10) / (NC.BOT - NC.TOP + 60) * Math.PI);
      g.lineCap = 'round'; g.strokeStyle = '#2a5a1e'; g.lineWidth = 6; g.beginPath(); g.moveTo(rx + sd, NC.TOP - 4); for (let y = NC.TOP - 4; y <= NC.BOT + 44; y += 16) g.lineTo(X(y), y); g.stroke();
      g.strokeStyle = '#5aa83a'; g.lineWidth = 2.5; g.stroke(); g.lineCap = 'butt';
      for (let y = NC.TOP + 14 + (sd > 0 ? 20 : 0); y < NC.BOT + 40; y += 40) { const s2 = sd > 0 ? 1 : -1, lx = X(y); g.save(); g.translate(lx, y); g.rotate(s2 * 0.8 + Math.sin(t * 2 + y) * 0.1); g.fillStyle = '#3a9a32'; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(s2 * 7, -6, s2 * 14, 0); g.quadraticCurveTo(s2 * 7, 6, 0, 0); g.fill(); g.restore(); }
    }
    g.fillStyle = '#4a7a2a'; g.beginPath(); g.ellipse(rx, NC.BOT + 46, 14, 5, 0, 0, 7); g.fill();
    if (r % 3 === 0) { const fy = NC.TOP + 70 + r * 18; g.fillStyle = '#ff8ac8'; for (let p = 0; p < 5; p++) { const a = p / 5 * 6.28; g.beginPath(); g.arc(rx - 11 + Math.cos(a) * 4, fy + Math.sin(a) * 4, 3, 0, 7); g.fill(); } g.fillStyle = '#fff2a0'; g.beginPath(); g.arc(rx - 11, fy, 2, 0, 7); g.fill(); }
  },
  // the long stone ledge along the top, raised in the middle where the host stands
  ledge(g, t) {
    const slab = (x0, x1, y, h) => { g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x0, y + h, x1 - x0, 8); const sg = g.createLinearGradient(0, y, 0, y + h); sg.addColorStop(0, '#c8a878'); sg.addColorStop(0.4, '#9a7a52'); sg.addColorStop(1, '#5a4228'); g.fillStyle = sg; g.fillRect(x0, y, x1 - x0, h);
      g.strokeStyle = 'rgba(40,25,10,0.45)'; g.lineWidth = 1.5; for (let x = x0; x < x1; x += 40) { g.beginPath(); g.moveTo(x + ((y / 10) % 2) * 20, y); g.lineTo(x + ((y / 10) % 2) * 20, y + h); g.stroke(); } g.beginPath(); g.moveTo(x0, y + h / 2); g.lineTo(x1, y + h / 2); g.stroke();
      g.fillStyle = '#5ac040'; g.fillRect(x0, y - 6, x1 - x0, 8); g.fillStyle = '#7ad85a'; g.fillRect(x0, y - 6, x1 - x0, 3); for (let x = x0 + 6; x < x1; x += 13) { g.fillStyle = '#3a9a2a'; g.beginPath(); g.moveTo(x - 3, y - 4); g.lineTo(x, y - 12 - (x % 5)); g.lineTo(x + 3, y - 4); g.fill(); } };
    slab(0, 572, 178, 24); slab(708, 1280, 178, 24); slab(562, 718, 132, 70);
    for (const rx of NC.ROPES) for (const sd of [-11, 11]) { g.fillStyle = '#3a2a18'; g.beginPath(); g.arc(rx + sd, NC.TOP - 2, 4, 0, 7); g.fill(); }
  },
  // a floating grass platform with dangling roots
  plat(g, a, b, y, t) {
    g.fillStyle = 'rgba(0,0,0,0.18)'; g.beginPath(); g.ellipse((a + b) / 2 + 6, y + 40, (b - a) / 2, 6, 0, 0, 7); g.fill();
    const dg = g.createLinearGradient(0, y, 0, y + 26); dg.addColorStop(0, '#8a5a2e'); dg.addColorStop(1, '#4a2e14'); g.fillStyle = dg; g.beginPath(); g.moveTo(a, y); g.lineTo(b, y); g.quadraticCurveTo(b - 10, y + 22, (a + b) / 2, y + 28); g.quadraticCurveTo(a + 10, y + 22, a, y); g.fill();
    g.strokeStyle = '#6a4a22'; g.lineWidth = 2; for (let q = 0; q < 5; q++) { const x = a + 16 + q * (b - a - 32) / 4, l = 16 + (q % 3) * 8; g.beginPath(); g.moveTo(x, y + 18); g.quadraticCurveTo(x + Math.sin(t * 1.5 + q) * 4, y + 18 + l / 2, x + Math.sin(t + q) * 3, y + 18 + l); g.stroke(); }
    g.fillStyle = '#5ac040'; MGH.rr(g, a - 4, y - 8, b - a + 8, 12, 6); g.fill(); g.fillStyle = '#8ae86a'; MGH.rr(g, a, y - 8, b - a, 4, 2); g.fill();
    for (let x = a + 6; x < b - 4; x += 12) { g.fillStyle = '#3a9a2a'; g.beginPath(); g.moveTo(x - 3, y - 5); g.lineTo(x, y - 13 - (x % 5)); g.lineTo(x + 3, y - 5); g.fill(); }
  },
  branch(g, t) {
    const bg = g.createLinearGradient(0, 108, 0, 136); bg.addColorStop(0, '#8a5a2e'); bg.addColorStop(1, '#4a2e14'); g.fillStyle = bg;
    g.beginPath(); g.moveTo(500, 118); g.quadraticCurveTo(640, 104, 780, 116); g.lineTo(782, 136); g.quadraticCurveTo(640, 126, 498, 138); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(40,20,10,0.4)'; g.lineWidth = 1.5; for (let x = 520; x < 770; x += 34) { g.beginPath(); g.moveTo(x, 122); g.quadraticCurveTo(x + 12, 126, x + 24, 122); g.stroke(); }
    for (const x of [520, 770]) { g.fillStyle = '#3a9a3a'; g.beginPath(); g.ellipse(x, 116, 16, 7, x < 640 ? -0.4 : 0.4, 0, 7); g.fill(); }
  },
  // a hanging number "fruit": glossy, coloured by size, on a little stalk with a leaf
  tag(g, tg, t, a) {
    const sw = Math.sin(t * 1.8 + tg.sw * 2) * 1.5, x = tg.x + sw, y = tg.y + 2, v = tg.v, cols = v <= 3 ? ['#9af07a', '#3aa83a'] : v <= 6 ? ['#ffd070', '#e8862a'] : ['#ff8aa8', '#c83a6a'];
    g.globalAlpha = a;
    g.strokeStyle = '#4a7a2a'; g.lineWidth = 2; g.beginPath(); g.moveTo(tg.x - 11, y - 22); g.quadraticCurveTo(x, y - 30, x, y - 17); g.quadraticCurveTo(x, y - 30, tg.x + 11, y - 22); g.stroke();
    g.fillStyle = '#4aa83a'; g.beginPath(); g.ellipse(x + 7, y - 20, 7, 3.5, -0.5, 0, 7); g.fill();
    g.fillStyle = 'rgba(0,0,0,0.18)'; g.beginPath(); g.arc(x + 2, y + 3, 17, 0, 7); g.fill();
    const fg = g.createRadialGradient(x - 6, y - 6, 2, x, y, 18); fg.addColorStop(0, cols[0]); fg.addColorStop(1, cols[1]); g.fillStyle = fg; g.beginPath(); g.arc(x, y, 17, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.55)'; g.beginPath(); g.ellipse(x - 6, y - 8, 6, 3.5, -0.6, 0, 7); g.fill();
    g.font = 'bold 22px Georgia'; g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 4; g.strokeStyle = 'rgba(40,20,10,0.8)'; g.strokeText(String(v), x, y + 8); g.fillStyle = '#fff'; g.fillText(String(v), x, y + 8);
    g.globalAlpha = 1;
  },
};
const ncDef = (spec) => MG.def(Object.assign({
  type: 'Duel', controls: 'Move + A', dur: 0,
  rows: [['stick', 'Walk · climb the twin vines · LEFT/RIGHT = reach to the next pair · UP at a sign = take it'], ['a', 'Jump (from vines too)']],
  wins: 'Most rounds won (5 rounds).',
  init(m, S) {
    S.who = this.who(m); S.round = 0; S.wins = [0, 0, 0, 0]; S.fx = [];
    S.tags = []; NC.ROPES.forEach((rx, r) => { [0.1, 0.38, 0.66, 0.94].forEach((f, k) => { if ((k + r) % 4 === 3) return; S.tags.push({ r, x: rx, y: NC.TOP + 50 + f * (NC.BOT - NC.TOP - 40), v: R.int(1, 9), t: 0, sw: R.range(0, 6) }); }); });
    this.newRound(m, S);
  },
  newRound(m, S) {
    S.target = NC.target(S.round); S.ph = 'show'; S.pt = 0; S.winner = -1;
    { const sites = R.shuffle(NC.SITES.slice()); S.ops = ['+', '−', '×', '÷'].map((o, k) => ({ o, x: sites[k], t: 0, pop: 0 })); }
    S.p = [0, 1, 2, 3].map(i => { const k = S.who.indexOf(i), x = k < 0 ? -999 : [110, 1170, 600, 680][k]; return { x, y: NC.GY, vx: 0, vy: 0, st: 'ground', rope: -1, tot: null, op: null, fall: 0, face: x < 640 ? 1 : -1, clim: 0, bump: 0, last: '', lastT: 0, nope: 0 }; });
    S.tags.forEach(t => { t.v = R.int(1, 9); t.t = 0; });
  },
  update(m, S, dt) {
    S.pt += dt;
    S.tags.forEach(t => { if (t.t > 0) { t.t -= dt; if (t.t <= 0) t.v = R.int(1, 9); } t.sw += dt; });
    if (S.ops) S.ops.forEach(o => { o.pop = Math.max(0, o.pop - dt); if (o.t > 0) { o.t -= dt; if (o.t <= 0) { const used = S.ops.filter(q => q !== o && q.t <= 0).map(q => q.x).concat(S.who.map(j => S.p[j].x)); const free = NC.SITES.filter(x => used.every(u => Math.abs(u - x) > 60)); o.x = R.pick(free.length ? free : NC.SITES); o.pop = 0.4; } } });
    if (S.ph === 'show') { if (S.pt > 2.2) { S.ph = 'go'; S.pt = 0; } return; }
    if (S.ph === 'won') { if (S.pt > 2.6) { S.round++; if (S.round >= 5) { m.finish(this.score(m, S)); return; } this.newRound(m, S); } return; }
    if (S.pt > 180) { // a hidden safety (no timer is shown): after 3 minutes the closest total takes the round
      const best = S.who.slice().sort((a, b) => Math.abs((S.p[a].tot ?? 999) - S.target) - Math.abs((S.p[b].tot ?? 999) - S.target))[0]; this.roundWin(m, S, best, true); return; }
    S.who.forEach(i => {
      const P = S.p[i], a = m.axis(i); P.lastT -= dt; P.nope -= dt; P.bump -= dt;
      if (P.fall > 0) { P.fall -= dt; if (P.fall <= 0) { const I = NC.ISL.slice().sort((p, q) => Math.abs((p[0] + p[1]) / 2 - P.x) - Math.abs((q[0] + q[1]) / 2 - P.x))[0]; P.x = clamp(P.x, I[0] + 20, I[1] - 20); P.y = NC.GY; P.vx = P.vy = 0; P.st = 'ground'; } return; }
      if (Math.abs(a.x) > 0.3) P.face = Math.sign(a.x);
      if (P.st === 'rope') {
        const rx = NC.ROPES[P.rope]; P.x = rx; const cy = a.y < -0.4 ? -1 : a.y > 0.4 ? 1 : 0;
        // someone else on this vine is solid: you can't climb through them
        let ny = clamp(P.y + cy * 190 * dt, NC.TOP + 40, NC.BOT + 40); S.who.forEach(j => { const Q = S.p[j]; if (j === i || Q.fall > 0 || !((Q.st === 'rope' && Q.rope === P.rope) || (Q.st === 'swing' && Q.sw.to === P.rope))) return; if (Q.y < P.y && ny < Q.y + 46) ny = Math.max(ny, Q.y + 46); if (Q.y >= P.y && ny > Q.y - 46) ny = Math.min(ny, Q.y - 46); });
        if (cy && Math.abs(ny - P.y) < 0.01 && !P.blk) { P.blk = 0.6; MGH.pop('blocked!', P.x, P.y - 70, '#fff', 15); } P.blk = Math.max(0, (P.blk || 0) - dt);
        P.y = ny; if (cy) P.clim += dt * 7;
        // swing across to the neighbouring vine (left/right), unless someone is hanging there
        const sx = Math.abs(a.x) > 0.6 && Math.abs(a.y) < 0.5 ? Math.sign(a.x) : 0;
        if (sx && !m.pressed(i, 'a')) { const nb = NC.near(P.rope, sx);
          if (nb >= 0 && !S.who.some(j => j !== i && S.p[j].fall <= 0 && ((S.p[j].st === 'rope' && S.p[j].rope === nb) || (S.p[j].st === 'swing' && S.p[j].sw.to === nb)) && Math.abs(S.p[j].y - P.y) < 46)) { P.st = 'swing'; P.sw = { from: P.rope, to: nb, t: 0 }; P.face = sx; if (!m.bot(i)) Sfx.whoosh(); return; } }
        if (m.pressed(i, 'a')) { P.st = 'air'; P.vy = -380; P.vx = (Math.abs(a.x) > 0.3 ? Math.sign(a.x) : P.face) * 250; P.rope = -1; if (!m.bot(i)) Sfx.tone(520, 0.05, 'triangle', 0.04, 300); }
        else if (cy > 0 && P.y >= NC.BOT + 36) { P.st = 'air'; P.vy = 0; P.vx = 0; P.rope = -1; }
      } else if (P.st === 'swing') {
        const W = P.sw; W.t += dt / 0.32; const q = Math.min(1, W.t), x0 = NC.ROPES[W.from], x1 = NC.ROPES[W.to]; P.x = x0 + (x1 - x0) * q;
        if (q >= 1) { P.st = 'rope'; P.rope = W.to; P.x = x1; }
      } else {
        if (P.st === 'ground') { P.vx += (a.x * 240 - P.vx) * Math.min(1, dt * 12); if (m.pressed(i, 'a')) { P.st = 'air'; P.vy = -560; if (!m.bot(i)) Sfx.tone(520, 0.05, 'triangle', 0.04, 300); } }
        else P.vx += (a.x * 230 - P.vx) * Math.min(1, dt * 3);
        if (P.st === 'air') { P.vy += 1500 * dt; }
        P.x = clamp(P.x + P.vx * dt, 30, 1250); const py = P.y; P.y += (P.st === 'air' ? P.vy : 0) * dt;
        if (P.st === 'ground' && !NC.standOn(P.x, P.y)) { P.st = 'air'; P.vy = 0; }
        if (P.st === 'air') {
          const I = NC.islandAt(P.x); if (I && P.vy > 0 && py <= NC.GY && P.y >= NC.GY) { P.y = NC.GY; P.vy = 0; P.st = 'ground'; }
          NC.PLAT.forEach(([a, b, y]) => { if (P.st === 'air' && P.x >= a && P.x <= b && P.vy > 0 && py <= y && P.y >= y) { P.y = y; P.vy = 0; P.st = 'ground'; } });
          // grab a vine when you touch it while holding up (or while jumping up through it)
          const r = NC.ROPES.findIndex(rx => Math.abs(rx - P.x) < 14); if (r >= 0 && P.bump <= 0 && !(m.bot(i) && P.wantGround) && P.y - 40 > NC.TOP && P.y - 40 < NC.BOT + 10 && (a.y < -0.3 || P.vy < 0)) { P.st = 'rope'; P.rope = r; P.vx = P.vy = 0; }
          if (P.y > 660) { P.fall = 1.3; S.fx.push({ k: 'splash', x: P.x, t: 0 }); if (!m.bot(i)) Sfx.noise(0.3, 900, 0.08, 'lowpass'); }
        }
        if (P.st === 'ground') { const r = NC.ROPES.findIndex(rx => Math.abs(rx - P.x) < 14); if (r >= 0 && a.y < -0.5) { P.st = 'rope'; P.rope = r; P.y = Math.min(P.y, NC.BOT + 40); } }
      }
      // grab numbers (reach from the vine or mid-jump)
      // your board: a number first, then a sign, then a number (the answer becomes your new number), and so on
      if (P.st !== 'ground') S.tags.forEach(t => { if (t.t > 0 || Math.abs(t.x - P.x) > 16 || Math.abs(t.y - (P.y - 46)) > 34) return;
        if (P.tot !== null && P.op === null) return; // you need a sign first: climb straight past
        const res = P.tot === null ? t.v : NC.apply(P.tot, P.op, t.v);
        if (res === null) { if (P.nope <= 0) { P.nope = 0.6; P.last = `${P.tot} ÷ ${t.v} ✖`; P.lastT = 1.2; if (!m.bot(i)) Sfx.bad(); } return; }
        P.last = P.tot === null ? `${t.v}` : `${P.tot} ${P.op} ${t.v} = ${res}`; P.lastT = 1.6; P.tot = clamp(res, -199, 199); P.op = null; t.t = 2.2; if (!m.bot(i)) Sfx.coin(); S.fx.push({ k: 'pop', x: t.x, y: t.y, v: t.v, c: m.players[i].color, t: 0 });
        if (P.tot === S.target) this.roundWin(m, S, i, false); });
      // operator stones by the water
      if (P.st === 'ground' && P.y === NC.GY && P.tot !== null) S.ops.forEach(o => { if (Math.abs(o.x - P.x) >= 26 || o.pop > 0 || P.op === o.o) return;
        P.op = o.o; S.fx.push({ k: 'opgo', x: o.x, o: o.o, t: 0 }); if (!m.bot(i)) Sfx.tone(820, 0.06, 'triangle', 0.04);
        // the sign hops to an island that has no sign on it
        const used = S.ops.filter(q => q !== o).map(q => q.x), free = NC.SITES.filter(x => !used.includes(x) && Math.abs(x - o.x) > 30); o.x = R.pick(free.length ? free : NC.SITES.filter(x => !used.includes(x))); o.pop = 0.4; });
    });
    // climbers bump on a shared vine / crowd each other on islands (4-player)
    for (let x = 0; x < S.who.length; x++) for (let y = x + 1; y < S.who.length; y++) { const A = S.p[S.who[x]], B = S.p[S.who[y]]; if (A.fall > 0 || B.fall > 0) continue; if (Math.abs(A.x - B.x) < 26 && Math.abs(A.y - B.y) < 40) { if (A.st === 'ground' && B.st === 'ground') { const d = Math.sign(B.x - A.x) || 1, push = (26 - Math.abs(B.x - A.x)) / 2; A.x -= d * push; B.x += d * push; if (A.vx * d > 0) A.vx = 0; if (B.vx * d < 0) B.vx = 0; } } }
    S.fx.forEach(f => { f.t += dt; }); S.fx = S.fx.filter(f => f.t < 1.2);
  },
  roundWin(m, S, i, timeUp) { S.wins[i]++; S.winner = i; S.ph = 'won'; S.pt = 0; S.timeUp = timeUp; Sfx.coin(); Sfx.crowd && Sfx.crowd('cheer'); MGH.burst(640, 120, ['#ffe680', '#fff', m.players[i].color], 30, { speed: 300 }); },
  // ---------------------------------------------------------------- bots: pick the number (or operator) that gets closest, then go get it
  bot(m, S, i) {
    const v = m.vin[i]; v.a = false; v.ax = v.ay = 0; if (!S.who.includes(i) || S.ph !== 'go') return; const P = S.p[i]; if (P.fall > 0) return;
    P.think = (P.think || 0) - 1 / 60;
    const state = `${P.tot}|${P.op}`;
    if (P.think <= 0 || !P.goal || P.goalState !== state || (P.goal.tag && P.goal.tag.t > 0)) {
      P.think = R.range(2.5, 4); P.goalState = state; let best = null;
      const cost = (x, y) => Math.abs(x - P.x) / 300 + Math.abs(y - P.y) / 300;
      // only the lowest number on each chain: climbing up to it never brushes another number first
      const open = t => t.t <= 0 && !S.tags.some(q => q !== t && q.r === t.r && q.t <= 0 && q.y > t.y);
      if (P.tot === null) S.tags.forEach(t => { if (!open(t)) return; const sc = -cost(t.x, t.y) - Math.abs(t.v - S.target) * 0.02 + (t.v === S.target ? 50 : 0); if (!best || sc > best.sc) best = { sc, tag: t }; });
      else if (P.op === null) S.ops.forEach(o => S.tags.forEach(t => { if (!open(t)) return; const r = NC.apply(P.tot, o.o, t.v); if (r === null) return; const sc = -Math.abs(r - S.target) * 3 - cost(o.x, NC.GY) - Math.abs(t.x - o.x) / 300 + (r === S.target ? 50 : 0); if (!best || sc > best.sc) best = { sc, op: o.o, tag: t }; }));
      else S.tags.forEach(t => { if (!open(t)) return; const r = NC.apply(P.tot, P.op, t.v); if (r === null) return; const sc = -Math.abs(r - S.target) * 3 - cost(t.x, t.y) + (r === S.target ? 50 : 0); if (!best || sc > best.sc) best = { sc, tag: t }; });
      P.goal = best || { tag: null };
    }
    if (P.st === 'rope' && P.blk > 0.45) { P.stuck = (P.stuck || 0) + 1; if (P.stuck > 2) { P.stuck = 0; v.a = !m.prev[i].a; v.ax = R.pick([-1, 1]); P.think = 0; return; } }
    const G = P.goal;
    if (P.tot !== null && P.op === null) { const o = S.ops.find(q => q.o === G.op) || S.ops[0]; this.botGo(m, S, i, o.x, NC.GY, true); return; }
    if (!G.tag) return; this.botGo(m, S, i, G.tag.x, G.tag.y + 46, false);
  },
  botGo(m, S, i, tx, ty, ground) {
    const v = m.vin[i], P = S.p[i]; this.botGo2(m, S, i, tx, ty, ground);
    if (P.st === 'ground' && P.tot !== null && v.ax) { const want = P.goal && P.goal.op, bad = S.ops.find(o => o.o !== want && o.o !== P.op && (o.x - P.x) * v.ax > 0 && Math.abs(o.x - P.x) < 46); if (bad && !(ground && Math.abs(tx - bad.x) < 5)) v.a = true; } if (v.a && m.prev[i].a) v.a = false; // a tap, not a hold
  },
  botGo2(m, S, i, tx, ty, ground) {
    const v = m.vin[i], P = S.p[i]; P.wantGround = ground;
    if (P.st === 'rope') { const dx = tx - P.x; if (ground || Math.abs(dx) > 30) { // leave the vine toward the target
        if (ground) { v.ay = 1; if (P.y > NC.BOT) { v.a = true; v.ax = Math.sign(dx) || 1; } return; }
        const nb = NC.near(P.rope, Math.sign(dx)); if (nb >= 0) { v.ax = Math.sign(dx); v.ay = ty < P.y - 20 ? -0.3 : ty > P.y + 20 ? 0.3 : 0; } else { v.ay = 1; if (P.y > NC.BOT) { v.a = true; v.ax = Math.sign(dx); } } return; }
      v.ay = ty < P.y - 6 ? -1 : ty > P.y + 6 ? 1 : 0; return; }
    if (P.st === 'air') { v.ax = Math.sign(tx - P.x) * 0.8; v.ay = ground ? 0 : -1; return; }
    // on the ground: walk to the right island, jump gaps, then climb
    const dx = tx - P.x, myI = NC.islandAt(P.x), tI = NC.islandAt(clamp(tx, 30, 1250)) || NC.ISL.slice().sort((p, q) => Math.abs((p[0] + p[1]) / 2 - tx) - Math.abs((q[0] + q[1]) / 2 - tx))[0];
    if (!myI) { v.ax = Math.sign(dx); return; }
    if (myI !== tI) { const dir = Math.sign(dx), edge = dir > 0 ? myI[1] : myI[0], toEdge = (edge - P.x) * dir; // run up, then leap the gap at full speed
      v.ax = dir; if (toEdge < 26 && P.vx * dir > 90) v.a = true; return; }
    if (ground) { v.ax = Math.abs(dx) > 6 ? Math.sign(dx) : 0; return; }
    const r = NC.ROPES.filter(rx => NC.islandAt(rx)).sort((a, b) => Math.abs(a - tx) - Math.abs(b - tx))[0]; const rd = r - P.x;
    if (Math.abs(rd) > 12) { v.ax = Math.sign(rd); return; }
    v.ay = -1;
  },
  score(m, S) { return [0, 1, 2, 3].map(i => S.who.includes(i) ? S.wins[i] : -1); },
  fmt(s) { return s < 0 ? 'watching' : `${s} round${s === 1 ? '' : 's'}`; },
  hud(m, S, i) { const P = S.p[i]; return S.who.includes(i) ? `⭐${S.wins[i]} · ${P.tot === null ? '_' : P.tot}${P.op ? ' ' + P.op : ''}` : '👀 watching'; },
  // ---------------------------------------------------------------- art
  climber(g, m, S, i, P) {
    const p = m.players[i], t = m.t, r = 22;
    if (P.fall > 0) { // flail into the water, then a head bobbing as they swim back
      const k = 1 - P.fall / 1.3; if (k < 0.35) { g.save(); g.translate(P.x, Math.min(650, P.y - 28 + k * 200)); g.rotate(Math.sin(t * 30) * 0.4); Char.draw(g, 0, 0, r, p.el.id, p.color, { mood: 'shock', seed: i * 1.7, noShadow: true, hands: { n: { x: -1.2, y: -1.3 + Math.sin(t * 30) * 0.3, d: -120, o: true, m: false }, f: { x: 1.2, y: -1.3 - Math.sin(t * 30) * 0.3, d: -60, o: true, m: false } } }); g.restore(); }
      else { Char.draw(g, P.x + (k - 0.35) * 60 * (P.face || 1), 652 + Math.sin(t * 6) * 3, 16, p.el.id, p.color, { headOnly: true, mood: 'sad', seed: i * 1.7, noShadow: true }); g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 2; g.beginPath(); g.ellipse(P.x + (k - 0.35) * 60 * (P.face || 1), 664, 22, 5, 0, 0, 7); g.stroke(); }
      return; }
    if (P.st === 'swing') { // one hand lets go and reaches across to the next vine
      const q = Math.min(1, P.sw.t), dir = Math.sign(NC.ROPES[P.sw.to] - NC.ROPES[P.sw.from]) || 1, arc = Math.sin(q * Math.PI) * 14;
      Char.draw(g, P.x - 4 * dir, P.y - 30 + arc, r, p.el.id, p.color, { mood: MGH.persona('cheer', p.el.id), seed: i * 1.7, noShadow: true, look: { x: dir, y: -0.2 }, hands: { n: { x: -0.9 * dir, y: -1.2, d: -120, o: false, m: true }, f: { x: 1.4 * dir, y: -1.3, d: dir > 0 ? -40 : -140, o: true, m: false } } });
      return; }
    if (P.st === 'rope') { // hand over hand: arms take turns reaching up, feet hug the vine
      const ph = Math.sin(P.clim), ph2 = Math.cos(P.clim);
      Char.draw(g, P.x, P.y - 30, r, p.el.id, p.color, { mood: MGH.persona('determined', p.el.id), seed: i * 1.7, noShadow: true, look: { x: P.face * 0.5, y: -0.4 }, hands: { n: { x: -0.12, y: -1.4 + ph * 0.3, d: -90, o: false, m: true }, f: { x: 0.12, y: -1.1 - ph * 0.3, d: -90, o: false, m: false } }, feet: [{ x: -0.2, lift: 0.15 + ph2 * 0.1, tip: 0.4 }, { x: 0.35, lift: 0.3 - ph2 * 0.1, tip: 0.4 }] });
      return; }
    const air = P.st === 'air';
    Char.draw(g, P.x, P.y - 28, r, p.el.id, p.color, { mood: MGH.persona(air ? 'cheer' : 'happy', p.el.id), seed: i * 1.7, look: { x: P.face, y: 0 }, walk: !air && Math.abs(P.vx) > 30 ? 1 : 0, hands: air ? { n: { x: -0.4, y: -1.5, d: -90, o: true, m: true }, f: { x: 1.0, y: -0.9, d: -40, o: true, m: false } } : undefined });
  },
  draw(m, S, g) {
    const t = m.t;
    GX.blit(g, GX.bake('numclimb_bg', b => { NCART.bg(b); NCART.canopyArt(b); }));
    // drifting clouds, birds, the waterfall's moving water
    for (let k = 0; k < 6; k++) { const x = (k * 260 + t * 7) % 1560 - 140; MGH.cloud(g, x, 190 + (k % 3) * 46, 22 + (k % 2) * 8, 'rgba(255,238,228,0.75)'); }
    for (let k = 0; k < 4; k++) { const x = (k * 380 + t * 40) % 1500 - 100, y = 250 + Math.sin(t * 0.7 + k) * 30 + k * 18, fl = Math.sin(t * 9 + k) * 5; g.strokeStyle = 'rgba(80,40,60,0.55)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 9, y - fl); g.quadraticCurveTo(x - 4, y - 4, x, y); g.quadraticCurveTo(x + 4, y - 4, x + 9, y - fl); g.stroke(); }
    NCART.falls(g, t);
    NCART.water(g, t);
    // islands with their palms (baked look, drawn live so the palm fronds sway)
    NCART.islands(g, t);
    // operator totems
    (S.ops || []).forEach(o => { if (o.t > 0) return; const k = o.pop > 0 ? 1 - o.pop / 0.4 : 1; g.save(); g.translate(o.x, NC.GY); g.scale(k, k); NCART.totem(g, 0, 0, o.o, S.who.some(i => S.p[i].op === o.o), t); g.restore(); if (o.pop > 0) for (let q = 0; q < 6; q++) MGH.star(g, o.x + Math.cos(q) * 30 * k, NC.GY - 30 + Math.sin(q) * 20 * k, 4, '#fff', q, false); });
    // canopy along the top, vines hang from it
    NCART.canopy(g, t);
    NCART.ledge(g, t); NC.ROPES.forEach((rx, r) => NCART.vine(g, rx, r, t)); NC.PLAT.forEach(([a, b, y]) => NCART.plat(g, a, b, y, t));
    // the host on the podium with the target sign
    Char.npc(g, 598, 100, 24, 'host', { mood: S.ph === 'won' ? 'cheer' : 'happy', t, look: { x: 1, y: 0 } });
    const pulse = S.ph === 'show' ? 1 + Math.sin(t * 10) * 0.05 : 1;
    g.save(); g.translate(672, 58); g.scale(pulse, pulse); g.rotate(Math.sin(t * 1.4) * 0.03);
    g.strokeStyle = '#7a5a2e'; g.lineWidth = 3; g.beginPath(); g.moveTo(-6, -50); g.lineTo(-30, -30); g.moveTo(86, -50); g.lineTo(110, -30); g.stroke();
    GX.plank(g, -36, -30, 152, 66, '#c8945a'); g.fillStyle = '#fffaf0'; MGH.rr(g, -26, -22, 132, 50, 8); g.fill();
    MGH.text(g, 'TARGET', 40, -9, 11, '#a87a3a', 'center', 'bold'); MGH.text(g, String(S.target), 40, 22, 32, S.target < 0 ? '#e8323e' : '#2a1a10', 'center', 'bold');
    g.restore();
    g.fillStyle = 'rgba(40,20,10,0.6)'; MGH.rr(g, 572, 214, 136, 24, 12); g.fill(); MGH.text(g, `Round ${S.round + 1} of 5`, 640, 231, 14, '#ffe8b0', 'center', 'bold');
    for (let q = 0; q < 5; q++) { g.fillStyle = q < S.round ? '#ffd34d' : q === S.round ? '#fff' : 'rgba(255,255,255,0.3)'; g.beginPath(); g.arc(612 + q * 14, 250, 4, 0, 7); g.fill(); }
    // hanging number fruit
    S.tags.forEach(tg => { let a = 1; if (tg.t > 0) { const k = 1 - tg.t / 2.2; if (k > 0.75) a = (k - 0.75) * 4; else return; } NCART.tag(g, tg, t, a); });
    // butterflies
    for (let k = 0; k < 3; k++) { const x = 200 + k * 420 + Math.sin(t * 0.6 + k * 2) * 120, y = 420 + Math.sin(t * 0.9 + k) * 70, fl = Math.abs(Math.sin(t * 14 + k)); g.fillStyle = ['#ff8ac8', '#ffd34d', '#8ae0ff'][k]; g.beginPath(); g.ellipse(x - 5 * fl, y, 6 * fl + 1, 4, -0.5, 0, 7); g.ellipse(x + 5 * fl, y, 6 * fl + 1, 4, 0.5, 0, 7); g.fill(); g.fillStyle = '#3a2a2a'; g.fillRect(x - 1, y - 4, 2, 8); }
    // climbers
    S.who.forEach(i => this.climber(g, m, S, i, S.p[i]));
    S.fx.forEach(f => { if (f.k === 'opgo') { const k = f.t / 1.2; for (let q = 0; q < 8; q++) { g.fillStyle = `rgba(255,255,255,${0.7 * (1 - k)})`; g.beginPath(); g.arc(f.x + Math.cos(q * 0.8) * k * 50, NC.GY - 26 + Math.sin(q * 0.8) * k * 30 - k * 20, 8 * (1 - k) + 2, 0, 7); g.fill(); } return; } if (f.k === 'splash') { const k = f.t / 1.2; for (let q = 0; q < 10; q++) { const a = -Math.PI / 2 + (q - 4.5) * 0.28; g.fillStyle = `rgba(220,245,255,${1 - k})`; g.beginPath(); g.arc(f.x + Math.cos(a) * k * 64, 640 + Math.sin(a) * k * 56 + k * k * 64, 4.5 - k * 2, 0, 7); g.fill(); } g.strokeStyle = `rgba(255,255,255,${1 - k})`; g.lineWidth = 3; g.beginPath(); g.ellipse(f.x, 646, 10 + k * 54, 3 + k * 9, 0, 0, 7); g.stroke(); }
      else { const k = f.t / 1.2; g.globalAlpha = 1 - k * 0.6; MGH.text(g, String(f.v), f.x + 18, f.y - k * 60, 28 + k * 8, f.c, 'center', 'bold'); g.globalAlpha = 1; for (let q = 0; q < 5; q++) MGH.star(g, f.x + 18 + Math.cos(q * 1.26) * k * 40, f.y + Math.sin(q * 1.26) * k * 40, 5 * (1 - k), '#ffe680', q, false); } });
    // personal signboards hanging from the canopy: total and current sign
    S.who.forEach((i, k) => { const p = m.players[i], P = S.p[i], n = S.who.length, x = n === 2 ? (k ? 1080 : 200) : [140, 340, 940, 1140][k], y = 84, sw = Math.sin(t * 1.2 + k) * 0.025, hit = P.tot === S.target;
      g.save(); g.translate(x, y - 50); g.rotate(sw); g.translate(-x, -(y - 50));
      g.strokeStyle = '#6a4a22'; g.lineWidth = 3; g.beginPath(); g.moveTo(x - 60, y - 62); g.lineTo(x - 60, y - 34); g.moveTo(x + 60, y - 62); g.lineTo(x + 60, y - 34); g.stroke();
      GX.plank(g, x - 94, y - 36, 188, 72, '#a8743e');
      g.fillStyle = '#24402e'; MGH.rr(g, x - 84, y - 28, 168, 56, 8); g.fill(); g.fillStyle = 'rgba(255,255,255,0.05)'; for (let q = 0; q < 4; q++) { g.beginPath(); g.ellipse(x - 50 + q * 34, y + 4 + (q % 2) * 6, 16, 5, 0.3, 0, 7); g.fill(); }
      g.fillStyle = p.color; MGH.rr(g, x - 60, y - 44, 120, 20, 10); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 2; g.stroke(); MGH.text(g, p.name, x, y - 29, 13, '#fff', 'center', 'bold');
      if (hit) MGH.glow(g, x - 18, y + 8, 40, 'rgba(160,255,160,0.5)');
      MGH.text(g, `${P.tot}`, x - 18, y + 20, 30, hit ? '#b8ffb0' : '#f4f4e8', 'center', 'bold');
      const oc = { '+': '#7cf06a', '−': '#6ac8ff', '×': '#ffb04a', '÷': '#d08aff' }[P.op] || '#ffe680'; g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.arc(x + 52, y + 10, 15, 0, 7); g.fill(); MGH.text(g, P.op, x + 52, y + 20, 26, oc, 'center', 'bold');
      for (let q = 0; q < S.wins[i]; q++) MGH.star(g, x - 74 + q * 15, y + 34, 6, '#ffe680', 0, false);
      g.restore();
      if (P.lastT > 0) MGH.label(g, P.last, P.x, P.y - 92, 15, m.players[i].color); });
    if (S.ph === 'show') MGH.label(g, S.round === 4 ? `Negative round! Make ${S.target}` : `Make ${S.target}!`, 640, 360, 36, '#ffe680');
    if (S.ph === 'won' && S.winner >= 0) { MGH.label(g, `${m.players[S.winner].name} ${S.timeUp ? 'was closest' : `made ${S.target}`}! ⭐`, 640, 360, 34, m.players[S.winner].color); for (let q = 0; q < 14; q++) { const a = q / 14 * 6.28 + t; MGH.star(g, 640 + Math.cos(a) * 260, 360 + Math.sin(a) * 60, 7, ['#ffe680', '#ff8ac8', '#8ae0ff'][q % 3], a, false); } }
  },
}, spec));

ncDef({ id: 'numclimb', name: 'Number Climb', mode: 'duel',
  how: 'A maths duel in the jungle! The host holds up a TARGET number. Climb the vines and grab the hanging numbers 1–9 — each one is applied to your total using your current sign. Change your sign at the + − × ÷ stones on the islands (stand at one and press UP) — it then vanishes and pops up somewhere else! ÷ only works when it divides evenly. Hold LEFT/RIGHT on a vine to swing to the next vine. Climbers are solid: you cannot climb through each other. Hit the target EXACTLY to win the round! Grabbed numbers grow back as new ones. Five rounds: easy sums, times, mixed, big numbers — and finally a NEGATIVE target. Fall in the water and you swim back.',
  who(m) { return DU.pair(m); } });
ncDef({ id: 'numclimb4', name: 'Number Climb Party', type: 'Wits',
  how: 'Everyone climbs at once! The host holds up a TARGET number. Climb the vines and grab hanging numbers 1–9 — each is applied to your total with your current sign. Stand at a + − × ÷ stone and press UP to change sign — the stone then pops up somewhere else (÷ only when it divides evenly). Swing between vines with LEFT/RIGHT; climbers block each other, so get out of the way! First to hit the target EXACTLY wins the round. Five rounds getting harder, ending with a NEGATIVE target. Bump rivals off your vine and mind the water!',
  who() { return [0, 1, 2, 3]; } });
