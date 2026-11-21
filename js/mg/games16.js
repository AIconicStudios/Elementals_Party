'use strict';
// Five more brawl arenas with gentle environments (no traps, no sky hazards) and ITEM CRATES that drop in:
// three closed, flat arenas where nobody can fall out, and two floating stages where you can be knocked off.
(() => {
  const howItems = 'Move, A = jump (jump again in the air). B = your power: TAP to strike, HOLD and release for a charged shot, UP+B to recover, DOWN+B to slam. ITEM CRATES parachute in now and then — touch one to grab it: ❤️ heal, 💪 power, 👟 speed, 🛡️ bubble, ⭐ invincible. ';
  const respawnPads = (g, S, col) => { for (const f of S.f) if (f.ground === 'respawn' && f.state !== 'dead') { g.globalAlpha = Math.min(1, f.respawnPlat / 0.6); g.fillStyle = col; g.beginPath(); g.ellipse(f.x, f.y + 4, 50, 10, 0, 0, 7); g.fill(); g.globalAlpha = 1; } };
  const ledge = (g, p, top, side, trim) => { const w = p.x1 - p.x0; g.fillStyle = MGH.grad(g, p.y, p.y + 28, [top, side]); MGH.rr(g, p.x0, p.y, w, 24, 8); g.fill(); g.fillStyle = trim; g.fillRect(p.x0 + 6, p.y - 3, w - 12, 5); };
  const walls = (g, c, st, col, edge) => { g.fillStyle = col; g.fillRect(c.x0 - 60, c.y0 - 400, 60, st.y - c.y0 + 700); g.fillRect(c.x1, c.y0 - 400, 60, st.y - c.y0 + 700); g.fillStyle = edge; g.fillRect(c.x0 - 8, c.y0 - 400, 8, st.y - c.y0 + 700); g.fillRect(c.x1, c.y0 - 400, 8, st.y - c.y0 + 700); };

  // ---------------------------------------------------------------- 1) Candy Kitchen (flat, closed)
  BrawlArena({
    id: 'brawlKitchen', name: 'Candy Kitchen',
    how: howItems + 'A giant bakery counter with walls on both sides — nobody falls out, so every hit takes HP. Lose all 100 HP and you lose one of your 3 lives.',
    lives: 3, stamina: 100, items: true, haz: [], switches: [],
    cage: { x0: 300, x1: 1300, y0: 80 },
    stage: { x0: 300, x1: 1300, y: 640, th: 200 },
    soft: [{ x0: 400, x1: 620, y: 470 }, { x0: 980, x1: 1200, y: 470 }],
    blast: { x0: -2000, x1: 4000, y0: -3000, y1: 3000 },
    spawn: [{ x: 460, y: 640 }, { x: 1140, y: 640 }, { x: 700, y: 640 }, { x: 900, y: 640 }],
    respawnY: 260,
    drawBack(g, S, t) {
      g.fillStyle = MGH.grad(g, 0, 720, ['#ffe0ec', '#ffc8dc', '#f4a8c4']); g.fillRect(0, 0, 1280, 720);
      for (let x = 0; x < 1280; x += 80) for (let y = 0; y < 720; y += 80) { g.fillStyle = (x + y) / 80 % 2 ? 'rgba(255,255,255,0.25)' : 'rgba(255,180,210,0.2)'; g.fillRect(x, y, 80, 80); }
      // window with clouds and a cupcake shelf
      g.fillStyle = '#9fd8ff'; MGH.rr(g, 520, 80, 240, 170, 16); g.fill(); MGH.cloud(g, 590 + Math.sin(t * 0.3) * 20, 150, 0.8); g.strokeStyle = '#fff'; g.lineWidth = 10; MGH.rr(g, 520, 80, 240, 170, 16); g.stroke(); g.beginPath(); g.moveTo(640, 80); g.lineTo(640, 250); g.stroke();
      g.fillStyle = '#c88a5a'; g.fillRect(60, 300, 300, 14); g.fillRect(920, 300, 300, 14);
      for (const x of [100, 180, 260, 960, 1040, 1120, 1190]) { g.fillStyle = '#f4c890'; g.beginPath(); g.moveTo(x - 20, 300); g.lineTo(x - 15, 272); g.lineTo(x + 15, 272); g.lineTo(x + 20, 300); g.fill(); g.fillStyle = ['#ff8ab8', '#9fe0ff', '#fff2a0'][x % 3]; g.beginPath(); g.arc(x, 268, 18, Math.PI, 0); g.fill(); g.fillStyle = '#e8432a'; g.beginPath(); g.arc(x, 250, 5, 0, 7); g.fill(); }
      for (let k = 0; k < 20; k++) { const x = (k * 71 + t * 20) % 1280, y = (k * 47 + t * 30) % 720; g.fillStyle = ['#ff6b8a', '#7cf06a', '#5fb8ff', '#ffe680'][k % 4]; g.globalAlpha = 0.5; g.fillRect(x, y, 6, 3); g.globalAlpha = 1; }
    },
    drawStage(g, S, t) {
      const c = this.A.cage, st = this.A.stage, w = st.x1 - st.x0;
      walls(g, c, st, '#f4e8d8', '#ff8ab8');
      // the counter: wooden worktop over cupboards
      g.fillStyle = '#e8d0b0'; g.fillRect(st.x0, st.y, w, 400); g.fillStyle = 'rgba(0,0,0,0.08)'; for (let x = st.x0 + 40; x < st.x1; x += 200) { MGH.rr(g, x, st.y + 50, 160, 140, 10); g.fill(); }
      g.fillStyle = MGH.grad(g, st.y - 4, st.y + 30, ['#c8905a', '#a8703a']); g.fillRect(st.x0, st.y, w, 28);
      // a big cake and a rolling pin as decoration
      g.fillStyle = '#ffe0ec'; MGH.rr(g, 760, st.y - 70, 80, 70, 8); g.fill(); g.fillStyle = '#ff8ab8'; g.fillRect(760, st.y - 74, 80, 12); MGH.flame(g, 800, st.y - 86, 0.3, t, 1);
      for (const p of this.A.soft) { ledge(g, p, '#fff2a0', '#e8c060', '#ff8ab8'); for (let x = p.x0 + 14; x < p.x1; x += 30) { g.fillStyle = ['#ff6b8a', '#7cf06a', '#5fb8ff'][(x / 30 | 0) % 3]; g.beginPath(); g.arc(x, p.y + 12, 4, 0, 7); g.fill(); } }
      respawnPads(g, S, 'rgba(255,255,255,0.8)');
    },
  });

  // ---------------------------------------------------------------- 2) Moonlit Dojo (flat, closed)
  BrawlArena({
    id: 'brawlDojo', name: 'Moonlit Dojo',
    how: howItems + 'A wooden dojo hall under the moon — paper walls keep everyone in, so it\'s HP: lose all 100 and you lose one of 3 lives. Low beams let you hop up and drop down (DOWN).',
    lives: 3, stamina: 100, items: true, haz: [], switches: [],
    cage: { x0: 280, x1: 1320, y0: 90 },
    stage: { x0: 280, x1: 1320, y: 640, th: 200 },
    soft: [{ x0: 340, x1: 520, y: 500 }, { x0: 1080, x1: 1260, y: 500 }, { x0: 700, x1: 900, y: 400 }],
    blast: { x0: -2000, x1: 4000, y0: -3000, y1: 3000 },
    spawn: [{ x: 420, y: 640 }, { x: 1180, y: 640 }, { x: 680, y: 640 }, { x: 920, y: 640 }],
    respawnY: 260,
    drawBack(g, S, t) {
      g.fillStyle = MGH.grad(g, 0, 720, ['#0e1430', '#22264a', '#3a2a4a']); g.fillRect(0, 0, 1280, 720);
      MGH.stars(g, t, 60, 400);
      MGH.glow(g, 1000, 140, 160, 'rgba(255,250,220,0.35)'); g.fillStyle = '#fff6d8'; g.beginPath(); g.arc(1000, 140, 60, 0, 7); g.fill();
      // cherry trees drifting petals
      for (let k = 0; k < 30; k++) { const x = (k * 97 + t * 25) % 1300 - 10, y = (k * 61 + t * 40) % 720; g.fillStyle = 'rgba(255,190,220,0.7)'; g.beginPath(); g.ellipse(x, y, 4, 2.5, k + t, 0, 7); g.fill(); }
      g.fillStyle = 'rgba(20,16,40,0.9)'; for (const x of [80, 1200]) { g.fillRect(x - 8, 300, 16, 420); g.beginPath(); g.arc(x, 290, 90, 0, 7); g.fill(); }
      g.fillStyle = 'rgba(255,170,210,0.35)'; for (const x of [80, 1200]) for (let k = 0; k < 10; k++) { g.beginPath(); g.arc(x + Math.cos(k) * 70, 290 + Math.sin(k * 1.7) * 60, 22, 0, 7); g.fill(); }
    },
    drawStage(g, S, t) {
      const c = this.A.cage, st = this.A.stage, w = st.x1 - st.x0;
      // shoji walls with lantern light
      for (const x0 of [c.x0 - 60, c.x1]) { g.fillStyle = '#f4ead0'; g.fillRect(x0, c.y0 - 400, 60, st.y - c.y0 + 700); g.strokeStyle = '#5a3a20'; g.lineWidth = 4; for (let y = c.y0 - 400; y < st.y; y += 60) { g.beginPath(); g.moveTo(x0, y); g.lineTo(x0 + 60, y); g.stroke(); } g.strokeRect(x0, c.y0 - 400, 60, st.y - c.y0 + 700); }
      for (const x of [c.x0 + 60, c.x1 - 60]) { g.strokeStyle = '#5a3a20'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, c.y0); g.lineTo(x, c.y0 + 60); g.stroke(); MGH.lantern(g, x, c.y0 + 90, 1, t, '#ff7a4a'); }
      // tatami floor
      g.fillStyle = '#5a3a20'; g.fillRect(st.x0, st.y, w, 400);
      for (let x = st.x0; x < st.x1; x += 130) { g.fillStyle = MGH.grad(g, st.y, st.y + 26, ['#d8c890', '#b8a870']); g.fillRect(x + 2, st.y, 126, 26); g.fillStyle = '#3a5a3a'; g.fillRect(x + 2, st.y, 126, 4); }
      for (const p of this.A.soft) { ledge(g, p, '#a87a4a', '#6a4a2a', '#c8a060'); g.fillStyle = '#5a3a20'; g.fillRect(p.x0 + 10, p.y + 24, 10, 30); g.fillRect(p.x1 - 20, p.y + 24, 10, 30); }
      respawnPads(g, S, 'rgba(255,240,200,0.8)');
    },
  });

  // ---------------------------------------------------------------- 3) Coral Reef (flat, closed, underwater)
  BrawlArena({
    id: 'brawlReef', name: 'Coral Reef',
    how: howItems + 'A sunken arena inside a glass dome on the sea floor — no edges to fall from, so it\'s HP: lose all 100 and you lose one of 3 lives. Fight on the sand or the clam-shell ledges.',
    lives: 3, stamina: 100, items: true, haz: [], switches: [],
    cage: { x0: 300, x1: 1300, y0: 80 },
    stage: { x0: 300, x1: 1300, y: 640, th: 200 },
    soft: [{ x0: 360, x1: 560, y: 450 }, { x0: 1040, x1: 1240, y: 450 }],
    blast: { x0: -2000, x1: 4000, y0: -3000, y1: 3000 },
    spawn: [{ x: 440, y: 640 }, { x: 1160, y: 640 }, { x: 700, y: 640 }, { x: 900, y: 640 }],
    respawnY: 260,
    drawBack(g, S, t) {
      g.fillStyle = MGH.grad(g, 0, 720, ['#0a6a9a', '#0a4a7a', '#062a4a']); g.fillRect(0, 0, 1280, 720);
      MGH.rays(g, 640, -60, t, 'rgba(200,240,255,0.06)', 7, 1.2);
      for (let k = 0; k < 5; k++) { const x = ((k * 300 + t * 30) % 1600) - 160, y = 180 + k * 70; g.fillStyle = 'rgba(255,170,60,0.6)'; g.beginPath(); g.ellipse(x, y, 18, 9, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(x - 16, y); g.lineTo(x - 30, y - 9); g.lineTo(x - 30, y + 9); g.fill(); }
      for (let k = 0; k < 25; k++) { const x = (k * 53) % 1280, y = 720 - ((k * 37 + t * 50) % 760); g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 1.5; g.beginPath(); g.arc(x + Math.sin(t + k) * 6, y, 3 + k % 4, 0, 7); g.stroke(); }
      for (let k = 0; k < 8; k++) { const x = 40 + k * 170; g.strokeStyle = 'rgba(40,140,80,0.6)'; g.lineWidth = 8; g.beginPath(); g.moveTo(x, 720); g.quadraticCurveTo(x + Math.sin(t + k) * 30, 560, x + Math.sin(t * 1.3 + k) * 20, 420 + (k % 3) * 30); g.stroke(); }
    },
    drawStage(g, S, t) {
      const c = this.A.cage, st = this.A.stage, w = st.x1 - st.x0;
      walls(g, c, st, 'rgba(180,230,255,0.25)', 'rgba(255,255,255,0.6)');
      g.fillStyle = MGH.grad(g, st.y, st.y + 200, ['#f4e0a8', '#d8b878', '#a88a50']); g.fillRect(st.x0, st.y, w, 400);
      for (let x = st.x0 + 30; x < st.x1; x += 90) { g.fillStyle = 'rgba(0,0,0,0.08)'; g.beginPath(); g.ellipse(x, st.y + 14, 20, 4, 0, 0, 7); g.fill(); }
      // coral clumps by the walls
      for (const [x, col] of [[st.x0 + 40, '#ff6b8a'], [st.x1 - 40, '#ff9a4a'], [st.x0 + 110, '#c87aff'], [st.x1 - 110, '#ff6b8a']]) { g.strokeStyle = col; g.lineWidth = 8; g.lineCap = 'round'; for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(x, st.y); g.quadraticCurveTo(x + k * 10, st.y - 40, x + k * 18, st.y - 60 - Math.abs(k) * -8); g.stroke(); } }
      for (const p of this.A.soft) {
        const cx = (p.x0 + p.x1) / 2, pw = p.x1 - p.x0;
        g.fillStyle = MGH.grad(g, p.y - 10, p.y + 40, ['#ffe0f0', '#d8a0c0']); g.beginPath(); g.ellipse(cx, p.y + 10, pw / 2, 22, 0, 0, Math.PI); g.fill();
        g.fillStyle = '#ffd0e8'; g.fillRect(p.x0, p.y, pw, 10); g.strokeStyle = 'rgba(150,80,120,0.4)'; g.lineWidth = 2; for (let k = 1; k < 8; k++) { g.beginPath(); g.moveTo(cx, p.y + 30); g.lineTo(p.x0 + k * pw / 8, p.y + 10); g.stroke(); }
        g.fillStyle = '#fff'; g.beginPath(); g.arc(cx, p.y + 18, 7, 0, 7); g.fill();
      }
      respawnPads(g, S, 'rgba(200,240,255,0.8)');
    },
  });

  // ---------------------------------------------------------------- 4) Sky Garden (floating, you can fall)
  BrawlArena({
    id: 'brawlGarden', name: 'Sky Garden',
    how: howItems + 'A calm flower island floating in the clouds. Knock rivals off the edges — each fall costs one of your 5 lives. No traps, no storms, just you, three floating ledges and the item crates.',
    lives: 5, items: true, haz: [], switches: [],
    stage: { x0: 340, x1: 1260, y: 620, th: 120 },
    soft: [{ x0: 380, x1: 600, y: 460 }, { x0: 1000, x1: 1220, y: 460 }, { x0: 680, x1: 920, y: 320 }],
    blast: { x0: -280, x1: 1880, y0: -560, y1: 1260 },
    spawn: [{ x: 490, y: 460 }, { x: 1110, y: 460 }, { x: 650, y: 620 }, { x: 950, y: 620 }],
    drawBack(g, S, t) {
      const px = k => -(S.cam.x - 800) * k, py = k => -(S.cam.y - 460) * k;
      g.fillStyle = MGH.grad(g, 0, 720, ['#7ac8ff', '#bfe6ff', '#fff0d8']); g.fillRect(0, 0, 1280, 720);
      MGH.glow(g, 200 + px(0.03), 120 + py(0.03), 200, 'rgba(255,250,200,0.6)');
      g.save(); g.translate(px(0.1), py(0.1)); for (let k = 0; k < 7; k++) MGH.cloud(g, ((k * 230 + t * 8) % 1500) - 100, 120 + (k % 3) * 120, 1.2 + (k % 2) * 0.5); g.restore();
      g.save(); g.translate(px(0.25), py(0.25)); for (const [x, y, s] of [[150, 520, 0.8], [1150, 420, 0.6]]) { g.fillStyle = 'rgba(120,170,110,0.6)'; g.beginPath(); g.ellipse(x, y, 90 * s, 22 * s, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(140,110,90,0.5)'; g.beginPath(); g.moveTo(x - 80 * s, y); g.lineTo(x, y + 100 * s); g.lineTo(x + 80 * s, y); g.fill(); } g.restore();
      MGH.flock(g, t, 160, 5);
    },
    drawStage(g, S, t) {
      const st = this.A.stage, w = st.x1 - st.x0;
      // the island: grassy top over a rocky underside with hanging roots
      g.fillStyle = MGH.grad(g, st.y, st.y + 260, ['#8a6a4a', '#5a4030', '#3a2820']); g.beginPath(); g.moveTo(st.x0 - 10, st.y); g.lineTo(st.x1 + 10, st.y); g.quadraticCurveTo(st.x1 - 80, st.y + 160, (st.x0 + st.x1) / 2, st.y + 280); g.quadraticCurveTo(st.x0 + 80, st.y + 160, st.x0 - 10, st.y); g.fill();
      g.strokeStyle = '#5a7a3a'; g.lineWidth = 3; for (let k = 0; k < 9; k++) { const x = st.x0 + 80 + k * (w - 160) / 8; g.beginPath(); g.moveTo(x, st.y + 30); g.quadraticCurveTo(x + Math.sin(t + k) * 8, st.y + 90, x + 4, st.y + 140 - (k % 3) * 20); g.stroke(); }
      g.fillStyle = MGH.grad(g, st.y - 6, st.y + 24, ['#8ae86a', '#5ab84a']); MGH.rr(g, st.x0 - 10, st.y - 4, w + 20, 26, 12); g.fill();
      for (let k = 0; k < 24; k++) { const x = st.x0 + 10 + k * w / 24; g.fillStyle = ['#ff8ab8', '#ffe680', '#fff', '#c87aff'][k % 4]; g.beginPath(); g.arc(x, st.y - 6 + Math.sin(t * 2 + k) * 1.5, 5, 0, 7); g.fill(); g.fillStyle = '#ffcf4a'; g.beginPath(); g.arc(x, st.y - 6, 2, 0, 7); g.fill(); }
      for (const p of this.A.soft) { const cx = (p.x0 + p.x1) / 2; g.fillStyle = 'rgba(255,255,255,0.9)'; for (let k = 0; k < 5; k++) { g.beginPath(); g.arc(p.x0 + 20 + k * (p.x1 - p.x0 - 40) / 4, p.y + 14, 22, 0, 7); g.fill(); } ledge(g, p, '#8ae86a', '#6ab84a', '#ffb8d8'); MGH.cloud(g, cx, p.y + 30, 0.6); }
      respawnPads(g, S, 'rgba(255,255,255,0.85)');
    },
  });

  // ---------------------------------------------------------------- 5) Clockwork Tower (floating, you can fall)
  BrawlArena({
    id: 'brawlClock', name: 'Clockwork Tower',
    how: howItems + 'The top of an old clock tower at dusk. A narrow main floor with stepping ledges — fall off the side and you lose one of your 5 lives. No traps, only the ticking of the great gears behind you.',
    lives: 5, items: true, haz: [], switches: [],
    stage: { x0: 400, x1: 1200, y: 620, th: 160 },
    soft: [{ x0: 260, x1: 440, y: 500 }, { x0: 1160, x1: 1340, y: 500 }, { x0: 560, x1: 760, y: 420 }, { x0: 840, x1: 1040, y: 420 }],
    blast: { x0: -280, x1: 1880, y0: -560, y1: 1260 },
    spawn: [{ x: 660, y: 420 }, { x: 940, y: 420 }, { x: 560, y: 620 }, { x: 1040, y: 620 }],
    drawBack(g, S, t) {
      const px = k => -(S.cam.x - 800) * k, py = k => -(S.cam.y - 460) * k;
      g.fillStyle = MGH.grad(g, 0, 720, ['#2a1a4a', '#8a3a5a', '#ffa05a']); g.fillRect(0, 0, 1280, 720);
      g.save(); g.translate(px(0.08), py(0.08)); g.fillStyle = 'rgba(40,20,50,0.7)'; for (let k = 0; k < 12; k++) { const x = k * 120 - 40, h = 80 + (k * 37) % 120; g.fillRect(x, 600 - h, 70, h + 200); g.beginPath(); g.moveTo(x - 6, 600 - h); g.lineTo(x + 35, 560 - h); g.lineTo(x + 76, 600 - h); g.fill(); } g.restore();
      // the great clock face and gears
      g.save(); g.translate(640 + px(0.2), 300 + py(0.2));
      g.fillStyle = 'rgba(255,240,210,0.85)'; g.beginPath(); g.arc(0, 0, 170, 0, 7); g.fill(); g.strokeStyle = '#5a3a2a'; g.lineWidth = 10; g.stroke();
      for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; g.fillStyle = '#5a3a2a'; g.fillRect(Math.cos(a) * 140 - 4, Math.sin(a) * 140 - 4, 8, 8); }
      g.lineCap = 'round'; g.strokeStyle = '#3a2418'; g.lineWidth = 8; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(t * 0.1 - 1.6) * 80, Math.sin(t * 0.1 - 1.6) * 80); g.stroke(); g.lineWidth = 5; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(t * 1.2) * 120, Math.sin(t * 1.2) * 120); g.stroke();
      g.restore();
      for (const [x, y, r, d] of [[200, 200, 90, 1], [1080, 240, 110, -1], [1180, 500, 60, 1]]) { g.save(); g.translate(x + px(0.15), y + py(0.15)); g.rotate(t * 0.3 * d); g.fillStyle = 'rgba(90,60,50,0.7)'; for (let k = 0; k < 10; k++) { g.rotate(Math.PI / 5); g.fillRect(-10, -r - 12, 20, 24); } g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill(); g.fillStyle = 'rgba(40,20,30,0.7)'; g.beginPath(); g.arc(0, 0, r * 0.3, 0, 7); g.fill(); g.restore(); }
    },
    drawStage(g, S, t) {
      const st = this.A.stage, w = st.x1 - st.x0;
      g.fillStyle = MGH.grad(g, st.y, st.y + 500, ['#8a5a4a', '#5a3a30', '#2a1818']); g.fillRect(st.x0 + 40, st.y, w - 80, 600);
      g.fillStyle = 'rgba(0,0,0,0.2)'; for (let y = st.y + 30; y < st.y + 600; y += 40) for (let x = st.x0 + 40 + ((y / 40) % 2) * 30; x < st.x1 - 40; x += 60) g.fillRect(x, y, 56, 3);
      g.fillStyle = MGH.grad(g, st.y - 6, st.y + 26, ['#c8a070', '#8a6a4a']); MGH.rr(g, st.x0 - 10, st.y - 4, w + 20, 28, 6); g.fill();
      g.fillStyle = '#e8c060'; g.fillRect(st.x0 - 10, st.y - 6, w + 20, 4);
      for (const p of this.A.soft) { ledge(g, p, '#b0a090', '#6a5a4a', '#e8c060'); const cx = (p.x0 + p.x1) / 2; g.save(); g.translate(cx, p.y + 40); g.rotate(t * 0.8 * (cx > 800 ? 1 : -1)); g.fillStyle = '#8a7060'; for (let k = 0; k < 8; k++) { g.rotate(Math.PI / 4); g.fillRect(-5, -24, 10, 10); } g.beginPath(); g.arc(0, 0, 18, 0, 7); g.fill(); g.restore(); }
      respawnPads(g, S, 'rgba(255,220,160,0.85)');
    },
  });
})();
