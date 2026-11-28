'use strict';
// Five closed brawl arenas: walls on both sides AND a ceiling, so nobody can fall or fly out —
// every hit takes HP (lose all 100 and you lose one of 3 lives). No random hazards: just weapons dropping in.
(() => {
  const HOW = 'A sealed arena — the walls and the ceiling bounce you back in, so nobody falls out: every hit takes HP. Lose all 100 HP and you lose one of your 3 lives. ';
  const ledge = (g, p, top, side, trim) => { const w = p.x1 - p.x0; g.fillStyle = MGH.grad(g, p.y, p.y + 26, [top, side]); MGH.rr(g, p.x0, p.y, w, 24, 8); g.fill(); g.fillStyle = trim; g.fillRect(p.x0 + 6, p.y - 3, w - 12, 5); };
  // side walls plus a ceiling slab, drawn in world space around the cage
  const box = (g, c, st, wall, edge, ceil) => {
    const h = st.y - c.y0 + 700;
    g.fillStyle = wall; g.fillRect(c.x0 - 80, c.y0 - 400, 80, h); g.fillRect(c.x1, c.y0 - 400, 80, h);
    g.fillStyle = ceil || wall; g.fillRect(c.x0 - 80, c.y0 - 400, c.x1 - c.x0 + 160, 400);
    g.fillStyle = edge; g.fillRect(c.x0 - 8, c.y0, 8, st.y - c.y0); g.fillRect(c.x1, c.y0, 8, st.y - c.y0); g.fillRect(c.x0 - 8, c.y0 - 8, c.x1 - c.x0 + 16, 8);
  };
  const pads = (g, S, col) => { for (const f of S.f) if (f.ground === 'respawn' && f.state !== 'dead') { g.globalAlpha = Math.min(1, f.respawnPlat / 0.6); g.fillStyle = col; g.beginPath(); g.ellipse(f.x, f.y + 4, 50, 10, 0, 0, 7); g.fill(); g.globalAlpha = 1; } };
  const base = (o) => Object.assign({ lives: 3, stamina: 100, items: false, haz: [], switches: [], blast: { x0: -3000, x1: 5000, y0: -4000, y1: 4000 }, respawnY: 280 }, o);

  // ---------------------------------------------------------------- 1) Neon Arcade
  BrawlArena(base({
    id: 'brawlArcade', name: 'Neon Arcade',
    how: HOW + 'An after-hours arcade: hop between glowing cabinets and the high-score balcony.',
    cage: { x0: 280, x1: 1320, y0: 110 }, stage: { x0: 280, x1: 1320, y: 640, th: 200 },
    soft: [{ x0: 360, x1: 540, y: 500 }, { x0: 1060, x1: 1240, y: 500 }, { x0: 640, x1: 960, y: 360 }],
    spawn: [{ x: 450, y: 640 }, { x: 1150, y: 640 }, { x: 700, y: 640 }, { x: 900, y: 640 }],
    drawBack(g, S, t) {
      g.fillStyle = MGH.grad(g, 0, 720, ['#140628', '#2a0a4a', '#0a0418']); g.fillRect(0, 0, 1280, 720);
      for (let k = 0; k < 9; k++) { const x = 40 + k * 150, hue = (k * 40 + t * 30) % 360; g.fillStyle = '#1a0a2a'; g.fillRect(x, 260, 110, 360); g.fillStyle = `hsl(${hue},90%,55%)`; g.fillRect(x + 12, 290, 86, 64); g.fillStyle = 'rgba(0,0,0,0.5)'; for (let y = 292; y < 352; y += 6) g.fillRect(x + 12, y, 86, 2); g.fillStyle = `hsl(${(hue + 180) % 360},90%,60%)`; g.beginPath(); g.arc(x + 40, 400, 9, 0, 7); g.fill(); g.fillStyle = '#ff3ad8'; g.beginPath(); g.arc(x + 70, 404, 7, 0, 7); g.fill(); }
      g.save(); g.globalCompositeOperation = 'lighter'; for (let k = 0; k < 3; k++) { g.strokeStyle = ['rgba(255,58,216,0.5)', 'rgba(58,255,232,0.5)', 'rgba(255,220,60,0.4)'][k]; g.lineWidth = 6; g.beginPath(); g.moveTo(0, 120 + k * 22); g.lineTo(1280, 120 + k * 22); g.stroke(); } g.restore();
      MGH.text(g, 'HI-SCORE 999999', 640, 90, 28, `hsl(${(t * 120) % 360},90%,65%)`, 'center', 'bold');
    },
    drawStage(g, S, t) {
      const c = this.A.cage, st = this.A.stage, w = st.x1 - st.x0;
      box(g, c, st, '#1a0a2a', '#ff3ad8', '#120620');
      for (let x = c.x0; x < c.x1; x += 60) { g.fillStyle = `hsl(${(x + t * 120) % 360},90%,60%)`; g.beginPath(); g.arc(x + 30, c.y0 + 10, 5, 0, 7); g.fill(); } // ceiling bulbs
      for (let x = st.x0; x < st.x1; x += 80) for (let r = 0; r < 3; r++) { g.fillStyle = (x / 80 + r) % 2 ? '#2a1a4a' : '#3a2a6a'; g.fillRect(x, st.y + r * 40, 80, 40); }
      g.fillStyle = '#3affe8'; g.fillRect(st.x0, st.y - 4, w, 6);
      for (const p of this.A.soft) { ledge(g, p, '#3a2a6a', '#1a0a3a', '#ff3ad8'); for (let x = p.x0 + 16; x < p.x1; x += 26) { g.fillStyle = `hsl(${(x * 3 + t * 200) % 360},90%,60%)`; g.fillRect(x, p.y + 10, 10, 4); } }
      pads(g, S, 'rgba(58,255,232,0.7)');
    },
  }));

  // ---------------------------------------------------------------- 2) Crystal Cavern
  BrawlArena(base({
    id: 'brawlCavern', name: 'Crystal Cavern',
    how: HOW + 'Deep underground among glowing crystals — the cave walls and stalactite ceiling keep everyone in.',
    cage: { x0: 300, x1: 1300, y0: 130 }, stage: { x0: 300, x1: 1300, y: 640, th: 200 },
    soft: [{ x0: 340, x1: 520, y: 470 }, { x0: 1080, x1: 1260, y: 470 }, { x0: 700, x1: 900, y: 420 }, { x0: 560, x1: 680, y: 300 }, { x0: 920, x1: 1040, y: 300 }],
    spawn: [{ x: 430, y: 640 }, { x: 1170, y: 640 }, { x: 700, y: 640 }, { x: 900, y: 640 }],
    drawBack(g, S, t) {
      g.fillStyle = MGH.grad(g, 0, 720, ['#0a0820', '#1a1040', '#0a0618']); g.fillRect(0, 0, 1280, 720);
      for (let k = 0; k < 14; k++) { const x = (k * 97) % 1280, y = 200 + (k * 61) % 380, s = 20 + (k % 4) * 12, gl = 0.5 + 0.5 * Math.sin(t * 1.5 + k); MGH.glow(g, x, y, s * 2.5, `rgba(${k % 2 ? '180,120,255' : '90,220,255'},${0.25 * gl})`); g.fillStyle = k % 2 ? '#8a5aff' : '#3ac8ff'; g.beginPath(); g.moveTo(x, y - s * 1.6); g.lineTo(x + s * 0.5, y); g.lineTo(x, y + s * 0.4); g.lineTo(x - s * 0.5, y); g.closePath(); g.fill(); }
    },
    drawStage(g, S, t) {
      const c = this.A.cage, st = this.A.stage, w = st.x1 - st.x0;
      box(g, c, st, '#2a2440', '#8a7aff', '#1e1a30');
      for (let x = c.x0 + 20; x < c.x1; x += 70) { g.fillStyle = '#3a3458'; g.beginPath(); g.moveTo(x - 22, c.y0); g.lineTo(x, c.y0 + 30 + (x % 3) * 14); g.lineTo(x + 22, c.y0); g.fill(); g.fillStyle = 'rgba(120,220,255,0.6)'; g.beginPath(); g.arc(x, c.y0 + 26 + (x % 3) * 14, 3, 0, 7); g.fill(); }
      g.fillStyle = MGH.grad(g, st.y, st.y + 200, ['#4a4068', '#2a2440']); g.fillRect(st.x0, st.y, w, 400);
      for (let x = st.x0 + 40; x < st.x1; x += 140) { const gl = 0.6 + 0.4 * Math.sin(t * 2 + x); MGH.glow(g, x, st.y + 4, 30, `rgba(90,220,255,${0.4 * gl})`); g.fillStyle = '#5ad8ff'; g.beginPath(); g.moveTo(x - 8, st.y); g.lineTo(x, st.y - 22); g.lineTo(x + 8, st.y); g.fill(); }
      for (const p of this.A.soft) ledge(g, p, '#6a5a9a', '#3a3458', '#9ae8ff');
      pads(g, S, 'rgba(150,230,255,0.8)');
    },
  }));

  // ---------------------------------------------------------------- 3) Pirate Galleon (below deck)
  BrawlArena(base({
    id: 'brawlGalleon', name: 'Pirate Galleon',
    how: HOW + 'Below deck on a rocking pirate ship — fight on the cargo crates and the hanging lantern beams.',
    cage: { x0: 300, x1: 1300, y0: 120 }, stage: { x0: 300, x1: 1300, y: 640, th: 200 },
    soft: [{ x0: 360, x1: 500, y: 540 }, { x0: 1100, x1: 1240, y: 540 }, { x0: 520, x1: 760, y: 420 }, { x0: 840, x1: 1080, y: 420 }, { x0: 700, x1: 900, y: 290 }],
    spawn: [{ x: 430, y: 640 }, { x: 1170, y: 640 }, { x: 700, y: 640 }, { x: 900, y: 640 }],
    drawBack(g, S, t) {
      g.fillStyle = MGH.grad(g, 0, 720, ['#3a2210', '#2a1608', '#1a0e04']); g.fillRect(0, 0, 1280, 720);
      for (let x = 0; x < 1280; x += 64) { g.fillStyle = (x / 64) % 2 ? 'rgba(0,0,0,0.12)' : 'rgba(255,200,120,0.04)'; g.fillRect(x, 0, 64, 720); }
      for (const x of [260, 640, 1020]) { const sea = 0.5 + 0.5 * Math.sin(t + x); g.fillStyle = '#5a3a1a'; g.beginPath(); g.arc(x, 220, 48, 0, 7); g.fill(); g.fillStyle = MGH.grad(g, 180, 260, ['#7ad8ff', '#2a7ab8']); g.beginPath(); g.arc(x, 220, 38, 0, 7); g.fill(); g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 3; g.beginPath(); g.moveTo(x - 30, 230 + sea * 6); g.quadraticCurveTo(x, 222 + sea * 6, x + 30, 232 + sea * 6); g.stroke(); }
    },
    drawStage(g, S, t) {
      const c = this.A.cage, st = this.A.stage, w = st.x1 - st.x0;
      box(g, c, st, '#4a2a12', '#c8903a', '#3a200c');
      for (let x = c.x0; x < c.x1; x += 120) { g.fillStyle = '#5a3418'; g.fillRect(x, c.y0, 22, 30); } // beams under the ceiling
      for (const x of [520, 1080]) { const sw = Math.sin(t * 1.2 + x) * 0.15; g.save(); g.translate(x, c.y0); g.rotate(sw); g.strokeStyle = '#2a1a0a'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 70); g.stroke(); MGH.glow(g, 0, 84, 50, 'rgba(255,190,90,0.5)'); g.fillStyle = '#c8903a'; g.fillRect(-10, 70, 20, 28); g.fillStyle = '#ffd88a'; g.fillRect(-6, 74, 12, 20); g.restore(); }
      g.fillStyle = MGH.grad(g, st.y, st.y + 200, ['#a8703a', '#6a4220']); g.fillRect(st.x0, st.y, w, 400);
      g.strokeStyle = 'rgba(40,20,8,0.5)'; g.lineWidth = 2; for (let x = st.x0; x < st.x1; x += 90) { g.beginPath(); g.moveTo(x, st.y); g.lineTo(x, st.y + 200); g.stroke(); }
      for (const p of this.A.soft) { const pw = p.x1 - p.x0; g.fillStyle = '#8a5a2a'; g.fillRect(p.x0, p.y, pw, 26); g.strokeStyle = '#4a2a10'; g.lineWidth = 3; g.strokeRect(p.x0, p.y, pw, 26); g.beginPath(); g.moveTo(p.x0, p.y); g.lineTo(p.x1, p.y + 26); g.stroke(); }
      pads(g, S, 'rgba(255,220,150,0.8)');
    },
  }));

  // ---------------------------------------------------------------- 4) Forge Hall
  BrawlArena(base({
    id: 'brawlForge', name: 'Forge Hall',
    how: HOW + 'A giant smithy: brawl on the anvils and chain-hung platforms while the furnaces roar safely behind glass.',
    cage: { x0: 280, x1: 1320, y0: 110 }, stage: { x0: 280, x1: 1320, y: 640, th: 200 },
    soft: [{ x0: 380, x1: 540, y: 520 }, { x0: 1060, x1: 1220, y: 520 }, { x0: 620, x1: 980, y: 400 }, { x0: 380, x1: 520, y: 290 }, { x0: 1080, x1: 1220, y: 290 }],
    spawn: [{ x: 450, y: 640 }, { x: 1150, y: 640 }, { x: 700, y: 640 }, { x: 900, y: 640 }],
    drawBack(g, S, t) {
      g.fillStyle = MGH.grad(g, 0, 720, ['#2a1410', '#1a0a08', '#100604']); g.fillRect(0, 0, 1280, 720);
      for (const x of [220, 640, 1060]) { g.fillStyle = '#3a2420'; MGH.rr(g, x - 110, 230, 220, 240, 20); g.fill(); const gl = 0.7 + 0.3 * Math.sin(t * 4 + x); g.fillStyle = MGH.grad(g, 280, 440, [`rgba(255,${180 + gl * 50},80,1)`, '#ff5a1a', '#8a1a0a']); MGH.rr(g, x - 80, 280, 160, 160, 14); g.fill(); MGH.flame(g, x, 440, 1.3, t, x); g.strokeStyle = 'rgba(200,220,255,0.35)'; g.lineWidth = 4; MGH.rr(g, x - 80, 280, 160, 160, 14); g.stroke(); }
      for (let k = 0; k < 18; k++) { const x = (k * 71 + t * 40) % 1280, y = 470 - ((k * 37 + t * 70) % 300); g.fillStyle = 'rgba(255,170,60,0.7)'; g.fillRect(x, y, 3, 3); }
    },
    drawStage(g, S, t) {
      const c = this.A.cage, st = this.A.stage, w = st.x1 - st.x0;
      box(g, c, st, '#3a2a28', '#ff8a3a', '#2a1c1a');
      g.fillStyle = MGH.grad(g, st.y, st.y + 200, ['#5a4a48', '#2a2020']); g.fillRect(st.x0, st.y, w, 400);
      for (let x = st.x0; x < st.x1; x += 100) { g.fillStyle = 'rgba(255,140,60,0.25)'; g.fillRect(x, st.y, 100, 3); g.fillStyle = '#6a5a58'; g.beginPath(); g.arc(x + 50, st.y + 30, 5, 0, 7); g.fill(); }
      for (const p of this.A.soft) { const pw = p.x1 - p.x0, cx = (p.x0 + p.x1) / 2; g.strokeStyle = '#6a6a72'; g.lineWidth = 3; for (const x of [p.x0 + 14, p.x1 - 14]) { g.beginPath(); g.moveTo(x, c.y0); g.lineTo(x, p.y); g.stroke(); } g.fillStyle = MGH.grad(g, p.y, p.y + 24, ['#8a8a96', '#4a4a52']); MGH.rr(g, p.x0, p.y, pw, 22, 6); g.fill(); g.fillStyle = '#ff8a3a'; g.fillRect(cx - 20, p.y - 2, 40, 4); }
      pads(g, S, 'rgba(255,170,90,0.8)');
    },
  }));

  // ---------------------------------------------------------------- 5) Snow Globe
  BrawlArena(base({
    id: 'brawlGlobe', name: 'Snow Globe',
    how: HOW + 'Shrunk down inside a snow globe! Bounce off the glass and battle across the rooftops of a tiny winter village.',
    cage: { x0: 300, x1: 1300, y0: 120 }, stage: { x0: 300, x1: 1300, y: 640, th: 200 },
    soft: [{ x0: 380, x1: 540, y: 500 }, { x0: 1060, x1: 1220, y: 500 }, { x0: 700, x1: 900, y: 450 }, { x0: 560, x1: 700, y: 320 }, { x0: 900, x1: 1040, y: 320 }],
    spawn: [{ x: 440, y: 640 }, { x: 1160, y: 640 }, { x: 700, y: 640 }, { x: 900, y: 640 }],
    drawBack(g, S, t) {
      g.fillStyle = MGH.grad(g, 0, 720, ['#1a2a5a', '#3a5a9a', '#9ab8e8']); g.fillRect(0, 0, 1280, 720);
      for (let k = 0; k < 6; k++) { const x = 100 + k * 220; g.fillStyle = 'rgba(255,255,255,0.18)'; g.beginPath(); g.moveTo(x - 90, 620); g.lineTo(x, 420 - (k % 2) * 60); g.lineTo(x + 90, 620); g.fill(); }
    },
    drawStage(g, S, t) {
      const c = this.A.cage, st = this.A.stage, w = st.x1 - st.x0;
      // glass: translucent walls and a curved dome top with a glint
      box(g, c, st, 'rgba(200,230,255,0.22)', 'rgba(255,255,255,0.7)', 'rgba(200,230,255,0.18)');
      g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 6; g.beginPath(); g.arc((c.x0 + c.x1) / 2, c.y0 + 420, 560, Math.PI * 1.15, Math.PI * 1.85); g.stroke();
      g.fillStyle = MGH.grad(g, st.y, st.y + 200, ['#ffffff', '#d8e8ff', '#a8c0e8']); g.fillRect(st.x0, st.y, w, 400);
      for (let x = st.x0 + 60; x < st.x1; x += 160) { g.fillStyle = '#3a8a4a'; for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(x - 26 + k * 6, st.y - k * 18); g.lineTo(x, st.y - 40 - k * 18); g.lineTo(x + 26 - k * 6, st.y - k * 18); g.fill(); } g.fillStyle = '#fff'; g.beginPath(); g.arc(x, st.y - 72, 5, 0, 7); g.fill(); }
      for (const p of this.A.soft) { const pw = p.x1 - p.x0; g.fillStyle = ['#c84a3a', '#3a6ab8', '#e8a83a'][Math.floor(p.x0 / 100) % 3]; g.fillRect(p.x0 + 10, p.y + 18, pw - 20, 60); g.fillStyle = '#ffd88a'; g.fillRect(p.x0 + pw / 2 - 10, p.y + 34, 20, 18); g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(p.x0 - 6, p.y + 22); g.quadraticCurveTo(p.x0 + pw / 2, p.y - 18, p.x1 + 6, p.y + 22); g.closePath(); g.fill(); g.fillStyle = '#e8f0ff'; MGH.rr(g, p.x0, p.y, pw, 14, 7); g.fill(); }
      for (let k = 0; k < 60; k++) { const x = c.x0 + (k * 97 + Math.sin(t + k) * 20) % (c.x1 - c.x0), y = c.y0 + ((k * 53 + t * 40) % (st.y - c.y0)); g.fillStyle = 'rgba(255,255,255,0.85)'; g.beginPath(); g.arc(x, y, 2 + (k % 3), 0, 7); g.fill(); }
      pads(g, S, 'rgba(255,255,255,0.8)');
    },
  }));
})();
