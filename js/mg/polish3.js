'use strict';
// Polish pass 3: richer, baked backdrops for the arena games that still had flat or empty backgrounds.
const BG3 = (() => {
  const h = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const tuft = (g, x, y, s, c1 = 'rgba(40,110,40,0.8)', c2 = 'rgba(170,230,110,0.85)') => { for (let b = 0; b < 6; b++) { const a = (b / 5 - 0.5) * 1.3, l = (8 + h(x + b) * 8) * s; const gr = g.createLinearGradient(x, y, x + Math.sin(a) * l, y - l); gr.addColorStop(0, c1); gr.addColorStop(1, c2); g.strokeStyle = gr; g.lineWidth = 2 * s; g.lineCap = 'round'; g.beginPath(); g.moveTo(x + (b - 3) * s, y); g.quadraticCurveTo(x + Math.sin(a) * l * 0.4, y - l * 0.6, x + Math.sin(a) * l, y - l); g.stroke(); } };
  const flowers = (g, x, y, col) => { for (let f = 0; f < 4; f++) { const fx = x + (h(x + f) - 0.5) * 26, fy = y + (h(y + f) - 0.5) * 12; g.strokeStyle = '#3a8a32'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(fx, fy + 7); g.lineTo(fx, fy); g.stroke(); g.fillStyle = col; for (let q = 0; q < 5; q++) { const a = q / 5 * 6.28; g.beginPath(); g.arc(fx + Math.cos(a) * 2.8, fy + Math.sin(a) * 2.8, 2.4, 0, 7); g.fill(); } g.fillStyle = '#ffb030'; g.beginPath(); g.arc(fx, fy, 1.6, 0, 7); g.fill(); } };
  const bush = (g, x, y, s, c0 = '#8ad860', c1 = '#2f7f30') => { const lg = g.createRadialGradient(x - 10 * s, y - 26 * s, 4, x, y - 14 * s, 36 * s); lg.addColorStop(0, c0); lg.addColorStop(1, c1); g.fillStyle = 'rgba(0,0,0,0.2)'; g.beginPath(); g.ellipse(x + 8 * s, y + 2, 34 * s, 9 * s, 0, 0, 7); g.fill(); g.fillStyle = lg; g.beginPath(); g.arc(x, y - 16 * s, 22 * s, 0, 7); g.arc(x - 18 * s, y - 8 * s, 15 * s, 0, 7); g.arc(x + 18 * s, y - 8 * s, 15 * s, 0, 7); g.fill(); g.fillStyle = 'rgba(220,255,170,0.3)'; g.beginPath(); g.arc(x - 8 * s, y - 26 * s, 8 * s, 0, 7); g.fill(); };
  const planks = (g, x0, y0, w, hh, c0, c1, ph = 26) => { for (let y = y0, r = 0; y < y0 + hh; y += ph, r++) { const off = (r % 3) * 140; for (let x = x0 - off; x < x0 + w; x += 300) { const gx = Math.max(x0, x), gw = Math.min(x + 300, x0 + w) - gx; if (gw <= 0) continue; const gr = g.createLinearGradient(0, y, 0, y + ph); gr.addColorStop(0, h(r * 7 + x) > 0.5 ? c0 : c1); gr.addColorStop(1, h(r * 3 + x) > 0.5 ? c1 : c0); g.fillStyle = gr; g.fillRect(gx, y, gw, Math.min(ph, y0 + hh - y)); g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(gx, y, 2, ph); } g.fillStyle = 'rgba(0,0,0,0.16)'; g.fillRect(x0, y, w, 2); for (let k = 0; k < w / 50; k++) { g.strokeStyle = 'rgba(90,50,20,0.12)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x0 + h(r + k) * w, y + 6 + h(k) * (ph - 12)); g.lineTo(x0 + h(r + k) * w + 40, y + 8 + h(k + 2) * (ph - 12)); g.stroke(); } } };
  const flag = (g, x0, y0, w, hh) => { for (let y = y0, r = 0; y < y0 + hh; y += 50, r++) for (let x = x0 + (r % 2) * 35; x < x0 + w; x += 70) { const gw = Math.min(68, x0 + w - x), gh = Math.min(48, y0 + hh - y); if (gw <= 4) continue; const c = 120 + h(x * 3 + y) * 40; g.fillStyle = `rgb(${c},${c - 8},${c + 6})`; g.fillRect(x, y, gw, gh); g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(x, y, gw, 4); g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(x, y + gh - 4, gw, 4); } };
  const crowd = (g, y0, rows, dark = 0.5) => { for (let r = 0; r < rows; r++) for (let k = 0; k < 44; k++) { const x = k * 30 + (r % 2) * 15, y = y0 + r * 22; g.fillStyle = `hsl(${h(k + r * 50) * 360},45%,${30 + h(k * 3 + r) * 25}%)`; g.beginPath(); g.arc(x, y, 10, 0, 7); g.fill(); g.fillStyle = `rgba(0,0,0,${dark * 0.5})`; g.fillRect(x - 12, y + 6, 24, 14); } g.fillStyle = `rgba(10,10,30,${dark * 0.6})`; g.fillRect(0, y0 - 14, 1280, rows * 22 + 18); };
  return {
    // a moonlit garden for the Ankar's hunt
    night: () => GX.bake('bg3_night', g => {
      GX.vfill(g, 0, 0, 1280, 720, ['#14183a', '#1e2a4a', '#24402e', '#1c3424']);
      for (let k = 0; k < 60; k++) { g.fillStyle = `rgba(255,255,230,${0.3 + h(k) * 0.5})`; g.fillRect(h(k) * 1280, 40 + h(k + 3) * 120, 2, 2); }
      MGH.glow(g, 1120, 90, 140, 'rgba(200,220,255,0.35)'); g.fillStyle = '#f4f0e0'; g.beginPath(); g.arc(1120, 90, 38, 0, 7); g.fill();
      g.fillStyle = '#0e1a14'; g.beginPath(); g.moveTo(0, 190); for (let x = 0; x <= 1280; x += 30) g.lineTo(x, 170 - Math.abs(Math.sin(x * 0.02)) * 40 - h(x) * 14); g.lineTo(1280, 220); g.lineTo(0, 220); g.fill();
      const gg = g.createLinearGradient(0, 200, 0, 720); gg.addColorStop(0, '#2a4a34'); gg.addColorStop(1, '#1c3424'); g.fillStyle = gg; g.fillRect(0, 200, 1280, 520);
      for (let k = 0; k < 300; k++) tuft(g, h(k * 3.1) * 1280, 210 + h(k * 7.3) * 510, 0.7, 'rgba(20,50,30,0.8)', 'rgba(80,140,90,0.7)');
      g.fillStyle = 'rgba(160,150,120,0.25)'; g.beginPath(); g.ellipse(640, 470, 420, 150, 0, 0, 7); g.fill();
      for (let k = 0; k < 40; k++) { g.fillStyle = 'rgba(180,170,140,0.35)'; g.beginPath(); g.ellipse(640 + Math.cos(k) * 380 * h(k), 470 + Math.sin(k * 1.7) * 130 * h(k + 1), 10, 6, 0, 0, 7); g.fill(); }
      for (const [x, y] of [[90, 260], [1190, 280], [70, 650], [1210, 660], [400, 220], [880, 222]]) bush(g, x, y, 1.1, '#3a6a4a', '#14301e');
      for (const [x, y] of [[230, 240], [1050, 240]]) { g.fillStyle = '#2a2a34'; g.fillRect(x - 3, y - 70, 6, 70); MGH.glow(g, x, y - 72, 60, 'rgba(255,200,110,0.45)'); g.fillStyle = '#ffd88a'; MGH.rr(g, x - 8, y - 84, 16, 18, 4); g.fill(); }
    }),
    // a stone fire arena with glowing cracks, a lava moat and braziers
    lava: () => GX.bake('bg3_lava', g => {
      GX.vfill(g, 0, 0, 1280, 720, ['#2a0806', '#4a1208', '#1a0604']);
      const mg = g.createLinearGradient(0, 40, 0, 720); mg.addColorStop(0, '#ff7a20'); mg.addColorStop(1, '#c82a08'); g.fillStyle = mg; g.fillRect(0, 40, 1280, 680);
      for (let k = 0; k < 40; k++) { g.fillStyle = `rgba(255,${200 + h(k) * 55},80,0.5)`; g.beginPath(); g.ellipse(h(k) * 1280, 50 + h(k + 2) * 660, 20 + h(k + 4) * 30, 6, 0, 0, 7); g.fill(); }
      g.fillStyle = 'rgba(0,0,0,0.5)'; MGH.rr(g, 28, 68, 1232, 640, 30); g.fill();
      flag(g, 30, 64, 1220, 636); g.fillStyle = 'rgba(60,20,10,0.45)'; g.fillRect(30, 64, 1220, 636);
      for (let k = 0; k < 14; k++) { let x = 60 + h(k) * 1160, y = 90 + h(k + 5) * 580; g.strokeStyle = 'rgba(255,140,40,0.75)'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, y); for (let q = 0; q < 5; q++) { x += (h(k * 9 + q) - 0.5) * 70; y += (h(k * 4 + q) - 0.3) * 50; g.lineTo(x, y); } g.stroke(); g.strokeStyle = 'rgba(255,230,150,0.6)'; g.lineWidth = 1; g.stroke(); }
      g.strokeStyle = '#3a1a10'; g.lineWidth = 10; MGH.rr(g, 25, 62, 1230, 644, 26); g.stroke(); g.strokeStyle = 'rgba(255,160,60,0.6)'; g.lineWidth = 3; MGH.rr(g, 31, 68, 1218, 632, 22); g.stroke();
    }),
    braziers: (g, t) => { for (const [x, y] of [[60, 96], [1220, 96], [60, 676], [1220, 676]]) { g.fillStyle = '#3a2a2a'; g.beginPath(); g.moveTo(x - 18, y); g.lineTo(x + 18, y); g.lineTo(x + 10, y + 20); g.lineTo(x - 10, y + 20); g.fill(); MGH.flame(g, x, y - 2, 0.6, t, x); MGH.glow(g, x, y - 10, 70, 'rgba(255,150,60,0.35)'); } },
    // deep space with nebulae for the comet trails
    nebula: () => GX.bake('bg3_nebula', g => {
      GX.vfill(g, 0, 0, 1280, 720, ['#06061a', '#0e0a2a', '#08081a']);
      for (const [x, y, r, c] of [[300, 260, 360, 'rgba(140,60,200,0.22)'], [950, 480, 420, 'rgba(40,120,220,0.2)'], [700, 160, 260, 'rgba(255,80,140,0.14)'], [160, 600, 280, 'rgba(60,200,180,0.12)']]) { const gr = g.createRadialGradient(x, y, 10, x, y, r); gr.addColorStop(0, c); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
      for (let k = 0; k < 260; k++) { const a = 0.3 + h(k) * 0.7; g.fillStyle = `rgba(255,255,255,${a})`; const s = h(k + 7) > 0.92 ? 2.5 : 1.2; g.beginPath(); g.arc(h(k * 2.1) * 1280, 40 + h(k * 3.3) * 680, s, 0, 7); g.fill(); }
      g.fillStyle = '#c88a5a'; g.beginPath(); g.arc(1180, 120, 34, 0, 7); g.fill(); g.strokeStyle = 'rgba(255,220,170,0.6)'; g.lineWidth = 4; g.beginPath(); g.ellipse(1180, 120, 56, 12, -0.3, 0, 7); g.stroke();
    }),
    // a party room for musical cushions: curtains, a stage glow and a disco ball
    party: () => GX.bake('bg3_party', g => {
      GX.vfill(g, 0, 0, 1280, 720, ['#2a1040', '#4a1a5a', '#2a0a30']);
      for (let k = 0; k < 14; k++) { const x = k * 96; const cg = g.createLinearGradient(x, 0, x + 96, 0); cg.addColorStop(0, '#6a1a4a'); cg.addColorStop(0.5, '#a83a6a'); cg.addColorStop(1, '#5a1440'); g.fillStyle = cg; g.beginPath(); g.moveTo(x, 40); g.quadraticCurveTo(x + 48, 60, x + 96, 40); g.lineTo(x + 96, 140); g.quadraticCurveTo(x + 48, 160, x, 140); g.fill(); }
      for (let k = 0; k < 30; k++) { g.fillStyle = ['#ffd34d', '#5ac8ff', '#ff6a9a', '#7cf06a'][k % 4]; g.beginPath(); g.arc(k * 44 + 20, 150 + Math.sin(k) * 6, 5, 0, 7); g.fill(); }
    }),
    disco: (g, t) => { g.strokeStyle = '#888'; g.lineWidth = 2; g.beginPath(); g.moveTo(640, 40); g.lineTo(640, 70); g.stroke(); const bg = g.createRadialGradient(632, 84, 2, 640, 92, 24); bg.addColorStop(0, '#ffffff'); bg.addColorStop(1, '#7a7a9a'); g.fillStyle = bg; g.beginPath(); g.arc(640, 92, 22, 0, 7); g.fill(); for (let k = 0; k < 6; k++) { const a = t * 1.5 + k * 1.05; g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = ['rgba(255,90,160,0.08)', 'rgba(90,200,255,0.08)', 'rgba(255,220,80,0.08)'][k % 3]; g.beginPath(); g.moveTo(640, 92); g.lineTo(640 + Math.cos(a) * 900 - 40, 92 + Math.abs(Math.sin(a)) * 700 + 300); g.lineTo(640 + Math.cos(a) * 900 + 40, 92 + Math.abs(Math.sin(a)) * 700 + 300); g.fill(); g.restore(); } for (let k = 0; k < 10; k++) { const a = t * 2 + k; if (Math.sin(a * 3) > 0.6) MGH.star(g, 640 + Math.cos(a) * 16, 92 + Math.sin(a) * 16, 3, '#fff', a, false); } },
    // a sunny garden for freeze tag
    meadow: () => GX.bake('bg3_meadow', g => {
      GX.vfill(g, 0, 0, 1280, 720, ['#8ad860', '#6cc04a', '#52a83a']);
      for (let k = 0; k < 80; k++) { const x = h(k) * 1280, y = 40 + h(k + 300) * 680, r = 60 + h(k + 600) * 140, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, k % 3 ? 'rgba(255,250,170,0.14)' : 'rgba(30,90,40,0.15)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
      for (let k = 0; k < 320; k++) tuft(g, h(k * 4.3) * 1280, 60 + h(k * 6.1) * 660, 0.8);
      for (let k = 0; k < 50; k++) flowers(g, h(k * 5.3) * 1280, 70 + h(k * 2.9) * 640, ['#ff8ad0', '#ffffff', '#ffd34d', '#c8a0ff', '#ff6a5a'][k % 5]);
      g.strokeStyle = 'rgba(220,190,130,0.5)'; g.lineWidth = 40; g.lineCap = 'round'; g.beginPath(); g.moveTo(-20, 560); g.bezierCurveTo(300, 420, 700, 700, 1300, 480); g.stroke(); g.strokeStyle = 'rgba(240,215,160,0.5)'; g.lineWidth = 26; g.stroke();
      for (let x = 0; x < 1300; x += 60) bush(g, x, 70, 0.9);
    }),
    // a school gym for dodgeball: wooden floor, bleachers, banners
    gym: () => GX.bake('bg3_gym', g => {
      GX.vfill(g, 0, 0, 1280, 720, ['#4a3a5a', '#3a2a4a']);
      crowd(g, 52, 1, 0.4); for (let k = 0; k < 6; k++) { g.fillStyle = ['#e8323e', '#2a6ae8', '#ffd34d', '#3ac85a', '#e8323e', '#2a6ae8'][k]; g.beginPath(); g.moveTo(80 + k * 220, 40); g.lineTo(140 + k * 220, 40); g.lineTo(110 + k * 220, 70); g.fill(); }
      planks(g, 40, 80, 1200, 620, '#e0b070', '#c8945a');
      const sh = g.createRadialGradient(640, 300, 50, 640, 390, 700); sh.addColorStop(0, 'rgba(255,255,230,0.18)'); sh.addColorStop(1, 'rgba(0,0,0,0.2)'); g.fillStyle = sh; g.fillRect(40, 80, 1200, 620);
      g.strokeStyle = '#2a2a3a'; g.lineWidth = 10; g.strokeRect(40, 80, 1200, 620);
    }),
    // a stadium for top battle
    stadium: () => GX.bake('bg3_stadium', g => {
      GX.vfill(g, 0, 0, 1280, 720, ['#1a1430', '#2a1a40', '#120a20']);
      crowd(g, 70, 4, 0.55);
      for (const x of [160, 1120]) { const lg = g.createLinearGradient(x, 0, 640, 600); lg.addColorStop(0, 'rgba(255,250,220,0.25)'); lg.addColorStop(1, 'rgba(255,250,220,0)'); g.fillStyle = lg; g.beginPath(); g.moveTo(x - 20, 40); g.lineTo(x + 20, 40); g.lineTo(640 + (x - 640) * 0.1 + 260, 720); g.lineTo(640 + (x - 640) * 0.1 - 260, 720); g.fill(); g.fillStyle = '#fff8d0'; g.beginPath(); g.arc(x, 40, 10, 0, 7); g.fill(); }
      g.fillStyle = '#2a2040'; g.fillRect(0, 640, 1280, 80);
    }),
    // a cosy bedroom with a window, fairy lights and a big quilted mattress for the pillow fight
    bedroom: (t) => GX.bake('bg3_bedroom', g => {
      GX.vfill(g, 0, 0, 1280, 720, ['#3a2a60', '#4a3474']);
      for (let x = 0; x < 1280; x += 40) { g.fillStyle = x % 80 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.08)'; g.fillRect(x, 0, 20, 720); }
      for (let k = 0; k < 40; k++) { g.fillStyle = 'rgba(255,220,250,0.12)'; MGH.star(g, h(k) * 1280, 40 + h(k + 1) * 100, 5, 'rgba(255,220,250,0.2)', 0, false); }
      g.fillStyle = '#5a3a22'; MGH.rr(g, 1040, 30, 200, 100, 8); g.fill(); g.fillStyle = '#1a1a4a'; MGH.rr(g, 1050, 38, 180, 84, 4); g.fill(); g.fillStyle = '#ffe8b0'; g.beginPath(); g.arc(1180, 70, 22, 0, 7); g.fill(); for (let k = 0; k < 10; k++) { g.fillStyle = '#fff'; g.fillRect(1060 + h(k) * 160, 44 + h(k + 4) * 70, 2, 2); } g.fillStyle = '#5a3a22'; g.fillRect(1138, 38, 4, 84); g.fillRect(1050, 78, 180, 4);
      g.strokeStyle = 'rgba(80,60,40,0.8)'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 30); for (let x = 0; x <= 1000; x += 50) g.quadraticCurveTo(x + 25, 50, x + 50, 30); g.stroke();
      g.fillStyle = 'rgba(0,0,0,0.3)'; MGH.rr(g, 108, 142, 1080, 570, 40); g.fill();
      const mg = g.createLinearGradient(0, 130, 0, 700); mg.addColorStop(0, '#ffb0d8'); mg.addColorStop(1, '#e87aa8'); g.fillStyle = mg; MGH.rr(g, 100, 130, 1080, 570, 40); g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.45)'; g.lineWidth = 2; g.setLineDash([6, 6]); for (let x = 190; x < 1180; x += 90) { g.beginPath(); g.moveTo(x, 140); g.lineTo(x, 690); g.stroke(); } for (let y = 220; y < 700; y += 90) { g.beginPath(); g.moveTo(110, y); g.lineTo(1170, y); g.stroke(); } g.setLineDash([]);
      for (let x = 190; x < 1180; x += 90) for (let y = 220; y < 700; y += 90) { g.fillStyle = 'rgba(160,60,110,0.35)'; g.beginPath(); g.arc(x, y, 4, 0, 7); g.fill(); }
      g.strokeStyle = '#c85a8a'; g.lineWidth = 6; MGH.rr(g, 100, 130, 1080, 570, 40); g.stroke();
    }),
    fairy: (g, t) => { for (let k = 0; k < 21; k++) { const x = 25 + k * 50 - 25, y = 30 + Math.sin(k * 0.5) * 0 + 14; const on = Math.sin(t * 3 + k) > -0.3; MGH.glow(g, x, y + 8, 14, on ? 'rgba(255,220,120,0.6)' : 'rgba(255,220,120,0.15)'); g.fillStyle = on ? ['#ffe080', '#ff9ad0', '#9ae0ff'][k % 3] : '#7a6a5a'; g.beginPath(); g.arc(x, y + 8, 4, 0, 7); g.fill(); } },
    // a moon landscape for moon hop
    moon: () => GX.bake('bg3_moon', g => {
      GX.vfill(g, 0, 0, 1280, 720, ['#06061e', '#14123a', '#2a1a4a']);
      for (const [x, y, r, c] of [[300, 200, 300, 'rgba(120,80,220,0.18)'], [1000, 350, 340, 'rgba(60,140,240,0.14)']]) { const gr = g.createRadialGradient(x, y, 10, x, y, r); gr.addColorStop(0, c); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
      for (let k = 0; k < 200; k++) { g.fillStyle = `rgba(255,255,255,${0.3 + h(k) * 0.7})`; g.fillRect(h(k * 2.1) * 1280, h(k * 3.3) * 720, h(k + 9) > 0.9 ? 3 : 1.5, h(k + 9) > 0.9 ? 3 : 1.5); }
      const eg = g.createRadialGradient(180, 600, 20, 200, 620, 200); eg.addColorStop(0, '#9ad8ff'); eg.addColorStop(0.5, '#3a8ae0'); eg.addColorStop(1, '#1a3a8a'); g.fillStyle = eg; g.beginPath(); g.arc(200, 640, 150, 0, 7); g.fill(); g.fillStyle = 'rgba(90,200,110,0.7)'; g.beginPath(); g.ellipse(160, 600, 50, 30, 0.5, 0, 7); g.ellipse(250, 680, 40, 24, -0.3, 0, 7); g.fill();
      for (let k = 0; k < 2; k++) { g.fillStyle = k ? '#3a3050' : '#2a2440'; g.beginPath(); g.moveTo(0, 720); for (let x = 0; x <= 1280; x += 20) g.lineTo(x, 640 - k * 40 - Math.abs(Math.sin(x * 0.006 + k * 2)) * 60 - h(x + k) * 10); g.lineTo(1280, 720); g.fill(); }
    }),
    // a town square for paint wars
    plaza: (OX, OY, W, H) => GX.bake(`bg3_plaza_${OX}_${OY}_${W}_${H}`, g => {
      GX.vfill(g, 0, 0, 1280, 720, ['#6cc04a', '#4fa83a']);
      for (let k = 0; k < 200; k++) tuft(g, h(k * 4.3) * 1280, 40 + h(k * 6.1) * 680, 0.8);
      g.fillStyle = 'rgba(0,0,0,0.25)'; MGH.rr(g, OX - 18, OY - 12, W + 36, H + 36, 18); g.fill();
      g.fillStyle = '#b8a890'; MGH.rr(g, OX - 16, OY - 16, W + 32, H + 32, 18); g.fill();
      for (let y = OY; y < OY + H; y += 30) for (let x = OX + ((y - OY) / 30 % 2) * 15; x < OX + W; x += 30) { const c = 220 + h(x + y * 3) * 26; g.fillStyle = `rgb(${c},${c - 6},${c - 16})`; g.fillRect(x + 1, y + 1, Math.min(28, OX + W - x - 1), 28); }
      for (let x = 30; x < 1280; x += 140) bush(g, x, 70, 0.8); for (let x = 90; x < 1280; x += 140) bush(g, x, 712, 0.8);
      for (const [x, y, c] of [[60, 200, '#e8323e'], [60, 520, '#2a6ae8'], [1220, 200, '#e8323e'], [1220, 520, '#2a6ae8']]) { g.fillStyle = '#9a9aa8'; MGH.rr(g, x - 18, y - 24, 36, 34, 6); g.fill(); g.fillStyle = c; g.beginPath(); g.ellipse(x, y - 24, 16, 6, 0, 0, 7); g.fill(); g.fillRect(x - 18, y - 26, 6, 18); }
    }),
    // a haunted mansion hall
    mansion: () => GX.bake('bg3_mansion', g => {
      GX.vfill(g, 0, 0, 1280, 720, ['#1a1424', '#120e1a']);
      for (let x = 0; x < 1280; x += 60) { g.fillStyle = x % 120 ? '#2a1e36' : '#241a30'; g.fillRect(x, 40, 60, 70); g.fillStyle = 'rgba(255,220,255,0.05)'; for (let y = 50; y < 110; y += 20) { g.beginPath(); g.arc(x + 30, y, 4, 0, 7); g.fill(); } }
      g.fillStyle = '#3a2418'; g.fillRect(0, 104, 1280, 8);
      planks(g, 0, 112, 1280, 608, '#3a2a2a', '#2e2024', 32);
      g.fillStyle = 'rgba(120,20,40,0.45)'; MGH.rr(g, 300, 240, 680, 340, 20); g.fill(); g.strokeStyle = 'rgba(220,170,60,0.5)'; g.lineWidth = 4; MGH.rr(g, 316, 256, 648, 308, 14); g.stroke();
      for (const [x, y] of [[90, 60], [1190, 60], [640, 50]]) { g.fillStyle = '#5a4020'; g.fillRect(x - 30, y + 10, 60, 6); for (let q = -1; q <= 1; q++) { g.fillStyle = '#f4e8d0'; g.fillRect(x + q * 20 - 3, y - 6, 6, 16); } }
    }),
    candles: (g, t) => { for (const [x, y] of [[90, 60], [1190, 60], [640, 50]]) for (let q = -1; q <= 1; q++) { const fl = 1 + Math.sin(t * 12 + q + x) * 0.15; MGH.glow(g, x + q * 20, y - 10, 30 * fl, 'rgba(255,190,90,0.45)'); g.fillStyle = '#ffd060'; g.beginPath(); g.ellipse(x + q * 20, y - 12, 3, 6 * fl, 0, 0, 7); g.fill(); } },
    // a night garden with hedges and a pond for hide & seek
    garden: () => GX.bake('bg3_garden', g => {
      GX.vfill(g, 0, 0, 1280, 720, ['#1a2e2a', '#162620']);
      for (let k = 0; k < 300; k++) tuft(g, h(k * 3.1) * 1280, 90 + h(k * 7.3) * 630, 0.7, 'rgba(20,50,30,0.8)', 'rgba(70,120,90,0.7)');
      g.strokeStyle = 'rgba(140,130,110,0.3)'; g.lineWidth = 46; g.lineCap = 'round'; g.beginPath(); g.moveTo(-20, 400); g.bezierCurveTo(400, 300, 800, 560, 1300, 380); g.stroke();
      g.fillStyle = '#102a3a'; g.beginPath(); g.ellipse(1080, 600, 110, 50, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(140,190,255,0.25)'; g.beginPath(); g.ellipse(1060, 590, 60, 14, 0, 0, 7); g.fill();
      for (let x = 0; x < 1300; x += 50) bush(g, x, 100, 0.9, '#3a6a4a', '#14301e');
    }),
    // a castle hall for trapdoor trouble
    castle: () => GX.bake('bg3_castle', g => {
      GX.vfill(g, 0, 0, 1280, 720, ['#2a2030', '#1e1824']);
      for (let y = 40; y < 150; y += 24) for (let x = ((y / 24) % 2) * 30; x < 1280; x += 60) { const c = 70 + h(x + y) * 20; g.fillStyle = `rgb(${c},${c - 6},${c + 10})`; g.fillRect(x + 1, y + 1, 58, 22); }
      for (const x of [200, 640, 1080]) { g.fillStyle = ['#a8203a', '#2a4aa8', '#a8203a'][x === 640 ? 1 : 0]; g.beginPath(); g.moveTo(x - 30, 46); g.lineTo(x + 30, 46); g.lineTo(x + 30, 130); g.lineTo(x, 112); g.lineTo(x - 30, 130); g.fill(); g.fillStyle = '#ffd34d'; MGH.star(g, x, 80, 10, '#ffd34d', 0, false); }
      flag(g, 110, 150, 1060, 500);
      g.fillStyle = 'rgba(0,0,0,0.15)'; g.fillRect(110, 150, 1060, 500); const sh = g.createRadialGradient(640, 400, 100, 640, 400, 700); sh.addColorStop(0, 'rgba(255,220,170,0.12)'); sh.addColorStop(1, 'rgba(0,0,0,0.35)'); g.fillStyle = sh; g.fillRect(110, 150, 1060, 500);
      g.strokeStyle = '#3a2a3a'; g.lineWidth = 10; g.strokeRect(110, 150, 1060, 500);
    }),
    torches: (g, t) => { for (const x of [420, 860]) { g.fillStyle = '#4a3a2a'; g.fillRect(x - 4, 90, 8, 30); MGH.glow(g, x, 84, 60, 'rgba(255,160,70,0.45)'); MGH.flame(g, x, 92, 0.45, t, x); } },
  };
})();
// ---- second batch: temple hall, sunset canyon, theatre stage, high-tech vault
Object.assign(BG3, (() => {
  const h = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  return {
    temple: () => GX.bake('bg3_temple', g => {
      GX.vfill(g, 0, 0, 1280, 720, ['#1a0e2a', '#2a1640', '#140a20']);
      for (let y = 40; y < 250; y += 30) for (let x = ((y / 30) % 2) * 40; x < 1280; x += 80) { const c = 46 + h(x + y) * 18; g.fillStyle = `rgb(${c},${c - 14},${c + 14})`; g.fillRect(x + 1, y + 1, 78, 28); }
      for (const x of [40, 300, 560, 820]) { const pg = g.createLinearGradient(x - 22, 0, x + 22, 0); pg.addColorStop(0, '#5a4a6a'); pg.addColorStop(0.5, '#9a8aaa'); pg.addColorStop(1, '#4a3a5a'); g.fillStyle = pg; g.fillRect(x - 20, 60, 40, 660); g.fillStyle = '#b8a8c8'; g.fillRect(x - 28, 52, 56, 14); g.fillRect(x - 28, 700, 56, 20); g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 2; for (let q = -12; q <= 12; q += 8) { g.beginPath(); g.moveTo(x + q, 66); g.lineTo(x + q, 700); g.stroke(); } }
      const cg = g.createLinearGradient(0, 240, 0, 720); cg.addColorStop(0, '#6a1a3a'); cg.addColorStop(1, '#3a0a20'); g.fillStyle = cg; g.fillRect(90, 240, 1030, 480); g.strokeStyle = '#d8a040'; g.lineWidth = 4; g.strokeRect(96, 246, 1018, 468);
      for (let k = 0; k < 20; k++) { g.fillStyle = 'rgba(255,200,90,0.08)'; g.fillRect(100 + k * 52, 250, 2, 460); }
    }),
    templeFx: (g, t) => { for (const x of [170, 690]) { g.fillStyle = '#3a2a2a'; g.fillRect(x - 4, 150, 8, 30); MGH.glow(g, x, 140, 70, 'rgba(255,150,70,0.4)'); MGH.flame(g, x, 150, 0.5, t, x); } },
    canyon: () => GX.bake('bg3_canyon', g => {
      GX.vfill(g, 0, 0, 1280, 720, ['#2a1a50', '#a84a6a', '#ff9a5a', '#ffd08a']);
      MGH.glow(g, 640, 560, 380, 'rgba(255,220,140,0.6)'); g.fillStyle = '#fff2c0'; g.beginPath(); g.arc(640, 560, 70, 0, 7); g.fill();
      for (let k = 0; k < 6; k++) { g.fillStyle = 'rgba(255,200,170,0.35)'; g.beginPath(); g.ellipse(h(k) * 1280, 120 + h(k + 3) * 200, 120, 18, 0, 0, 7); g.fill(); }
      for (const [y, col, amp] of [[470, '#7a3a5a', 90], [540, '#5a2a44', 70], [620, '#3a1a30', 50]]) { g.fillStyle = col; g.beginPath(); g.moveTo(0, 720); for (let x = 0; x <= 1280; x += 20) g.lineTo(x, y - Math.abs(Math.sin(x * 0.007 + y)) * amp - h(x + y) * 8); g.lineTo(1280, 720); g.fill(); }
      for (let k = 0; k < 4; k++) { const x = 160 + k * 320; g.fillStyle = 'rgba(20,10,30,0.4)'; g.fillRect(x - 90, 690, 180, 30); }
    }),
    stage: () => GX.bake('bg3_stage', g => {
      g.fillStyle = '#120a20'; g.fillRect(0, 0, 1280, 720);
      const fl = g.createLinearGradient(0, 160, 0, 720); fl.addColorStop(0, '#5a3a2a'); fl.addColorStop(1, '#3a2418'); g.fillStyle = fl; g.fillRect(40, 160, 1200, 560);
      for (let y = 160; y < 720; y += 30) { g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(40, y, 1200, 2); for (let x = 40 + (y / 30 % 2) * 100; x < 1240; x += 200) g.fillRect(x, y, 2, 30); }
      const sh = g.createRadialGradient(640, 420, 80, 640, 440, 700); sh.addColorStop(0, 'rgba(255,230,180,0.12)'); sh.addColorStop(1, 'rgba(0,0,0,0.45)'); g.fillStyle = sh; g.fillRect(40, 160, 1200, 560);
      for (let x = 0; x < 1280; x += 40) { const cg = g.createLinearGradient(x, 0, x + 40, 0); cg.addColorStop(0, '#6a0a1a'); cg.addColorStop(0.5, '#b82a3a'); cg.addColorStop(1, '#5a0a18'); g.fillStyle = cg; g.beginPath(); g.moveTo(x, 40); g.lineTo(x + 40, 40); g.lineTo(x + 40, 130 + Math.sin(x * 0.05) * 10); g.quadraticCurveTo(x + 20, 150, x, 130 + Math.sin(x * 0.05) * 10); g.fill(); }
      g.fillStyle = '#d8a040'; for (let x = 0; x < 1280; x += 16) { g.beginPath(); g.moveTo(x, 132 + Math.sin(x * 0.05) * 10); g.lineTo(x + 8, 146 + Math.sin(x * 0.05) * 10); g.lineTo(x + 16, 132 + Math.sin(x * 0.05) * 10); g.fill(); }
      for (const sd of [0, 1]) { const x0 = sd ? 1240 : 0; const cg = g.createLinearGradient(x0, 0, x0 + 40, 0); cg.addColorStop(0, sd ? '#8a1a2a' : '#5a0a18'); cg.addColorStop(1, sd ? '#5a0a18' : '#8a1a2a'); g.fillStyle = cg; g.fillRect(x0, 40, 40, 680); }
      g.strokeStyle = '#d8a040'; g.lineWidth = 3; g.strokeRect(40, 160, 1200, 560);
    }),
    vault: () => GX.bake('bg3_vault', g => {
      GX.vfill(g, 0, 0, 1280, 720, ['#0a0e1a', '#121a2a']);
      for (let x = 0; x < 1280; x += 160) { g.fillStyle = '#1e2638'; g.fillRect(x + 6, 40, 148, 104); g.strokeStyle = '#3a4a6a'; g.lineWidth = 3; g.strokeRect(x + 6, 40, 148, 104); g.fillStyle = '#5a6a8a'; g.beginPath(); g.arc(x + 80, 92, 30, 0, 7); g.fill(); g.strokeStyle = '#8a9aba'; g.lineWidth = 4; g.beginPath(); g.arc(x + 80, 92, 22, 0, 7); g.stroke(); for (let q = 0; q < 4; q++) { const a = q * 1.57 + x; g.beginPath(); g.moveTo(x + 80, 92); g.lineTo(x + 80 + Math.cos(a) * 20, 92 + Math.sin(a) * 20); g.stroke(); } g.fillStyle = '#ffd34d'; for (let q = 0; q < 3; q++) g.fillRect(x + 16 + q * 14, 128 - q * 4, 12, 8); }
      for (let x = 60; x < 1220; x += 60) for (let y = 150; y < 700; y += 60) { const gr = g.createLinearGradient(x, y, x + 60, y + 60); gr.addColorStop(0, '#222a40'); gr.addColorStop(1, '#161c2e'); g.fillStyle = gr; g.fillRect(x + 1, y + 1, 58, 58); g.fillStyle = '#4a5a7a'; for (const [dx, dy] of [[6, 6], [52, 6], [6, 52], [52, 52]]) { g.beginPath(); g.arc(x + dx, y + dy, 2, 0, 7); g.fill(); } }
      g.strokeStyle = 'rgba(80,200,255,0.25)'; g.lineWidth = 1; for (let x = 60; x <= 1220; x += 60) { g.beginPath(); g.moveTo(x, 150); g.lineTo(x, 700); g.stroke(); } for (let y = 150; y <= 700; y += 60) { g.beginPath(); g.moveTo(60, y); g.lineTo(1220, y); g.stroke(); }
      g.strokeStyle = '#3a4a6a'; g.lineWidth = 8; g.strokeRect(60, 150, 1160, 550); g.strokeStyle = 'rgba(90,210,255,0.6)'; g.lineWidth = 2; g.strokeRect(66, 156, 1148, 538);
    }),
  };
})());
