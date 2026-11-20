'use strict';
// 62-64 -------------------------------------------------------------- three more brawl arenas
// They use the same fighters and moves as Fourfold Clash (games7.js) but each arena has its own layout
// and SWITCHES: hit one (strike or shot) and it springs a trap on everyone else — whoever set it off is safe.
(() => {
  const H = (dmg, base, grow, ang) => ({ dmg, base, grow, ang });
  const onFloor = (S, f, y) => f.lives > 0 && f.state !== 'dead' && Math.abs(f.y - y) < 6;
  const rivals = (S, i) => S.f.filter(o => o.i !== i && o.lives > 0 && o.state !== 'dead');
  // bots now and then walk over to a ready switch that would catch someone
  const goalFor = (game, S, f) => {
    const B = f.ai; if (!B) return null;
    B.goalT = (B.goalT || 0) - 1 / 60;
    if (B.goalT <= 0) { B.goalT = R.range(1.5, 3); B.goal = null; const ws = S.sw.filter(w => w.cd <= 0 && game.A.useful(game, S, w, f)); if (ws.length && Math.random() < 0.35) B.goal = R.pick(ws); }
    if (B.goal && (B.goal.cd > 0 || Math.abs(B.goal.x - f.x) < 40)) B.goal = null;
    return B.goal;
  };
  const howCommon = 'Move, A = jump (jump again in the air). B = your clan power: TAP to strike, HOLD and release for a charged shot, UP+B to recover, DOWN+B to slam. ';

  // ---------------------------------------------------------------- Temple of Traps: fall off and you lose a life
  BrawlArena({
    id: 'brawlTemple', name: 'Temple of Traps',
    how: howCommon + 'An old jungle temple floating over the abyss: get knocked out and you lose one of your 5 lives. Strike a LEVER to fire spikes across the far half of the temple floor, or ring the GONG on the top ledge to drop the side ledges and shoot flame jets from the floor. Whoever sets a trap off is safe from it!',
    lives: 5, taken: [1.12, 0.98, 0.88, 1.0],
    stage: { x0: 300, x1: 1300, y: 640, th: 130 },
    soft: [{ x0: 330, x1: 560, y: 470 }, { x0: 1040, x1: 1270, y: 470 }, { x0: 660, x1: 940, y: 320 }],
    blast: { x0: -280, x1: 1880, y0: -560, y1: 1260 },
    spawn: [{ x: 450, y: 470 }, { x: 1150, y: 470 }, { x: 640, y: 640 }, { x: 960, y: 640 }],
    haz: ['meteor', 'crystal', 'gale'],
    switches: [
      { x: 360, y: 470, kind: 'spikesR', look: 'lever', icon: '🗡️', label: 'SPIKE TRAP!', cdMax: 9 },
      { x: 1240, y: 470, kind: 'spikesL', look: 'lever', icon: '🗡️', label: 'SPIKE TRAP!', cdMax: 9 },
      { x: 800, y: 320, kind: 'gong', look: 'gong', icon: '🔥', label: 'FLAME JETS!', cdMax: 12 },
    ],
    fire(game, m, S, w, i) {
      const col = m.players[i].color;
      if (w.kind === 'spikesR' || w.kind === 'spikesL') {
        const right = w.kind === 'spikesR', x0 = right ? 800 : 300;
        game.trap(S, { kind: 'spikes', x: x0 + 250, y: 615, w: 500, h: 50, warn: 0.8, life: 0.9, own: i, col, hit: H(10, 340, 8.5, 80) });
      } else {
        // the gong: the side ledges fall away for a moment and flames burst from the floor vents
        S.f.forEach(f => { if (f.ground === game.A.soft[0] || f.ground === game.A.soft[1]) { f.ground = null; f.vy = 100; } });
        game.A.soft[0].offT = 3; game.A.soft[1].offT = 3;
        for (const x of [420, 640, 960, 1180]) game.trap(S, { kind: 'flame', x, y: 640 - 150, w: 80, h: 300, warn: 0.9, life: 0.8, own: i, col, hit: H(9, 320, 8.5, 85) });
        S.shake = Math.max(S.shake, 8); Sfx.boom();
      }
    },
    useful(game, S, w, f) {
      const r = rivals(S, f.i);
      if (w.kind === 'spikesR') return r.some(o => onFloor(S, o, 640) && o.x > 800);
      if (w.kind === 'spikesL') return r.some(o => onFloor(S, o, 640) && o.x < 800);
      return r.some(o => onFloor(S, o, 640) || onFloor(S, o, 470));
    },
    botGoal: goalFor,
    drawBack(g, S, t) {
      const cam = S.cam, px = k => -(cam.x - 800) * k, py = k => -(cam.y - 470) * k;
      const sky = g.createLinearGradient(0, 0, 0, 720); sky.addColorStop(0, '#1a3a4a'); sky.addColorStop(0.5, '#3a7a6a'); sky.addColorStop(0.8, '#e8a85a'); sky.addColorStop(1, '#ffcf7a');
      g.fillStyle = sky; g.fillRect(0, 0, 1280, 720);
      MGH.glow(g, 300 + px(0.04), 520 + py(0.04), 360, 'rgba(255,190,110,0.5)');
      // distant step pyramids and jungle canopy
      g.save(); g.translate(px(0.12), py(0.12));
      for (const [x, y, s] of [[200, 560, 1], [1050, 540, 1.3], [700, 590, 0.7]]) { g.fillStyle = 'rgba(30,60,50,0.75)'; for (let k = 0; k < 5; k++) g.fillRect(x - (140 - k * 26) * s, y - k * 34 * s, (280 - k * 52) * s, 34 * s); g.fillRect(x - 20 * s, y - 210 * s, 40 * s, 40 * s); }
      g.restore();
      g.save(); g.translate(px(0.3), py(0.3));
      for (let k = 0; k < 14; k++) { const x = k * 110 - 60; g.fillStyle = k % 2 ? 'rgba(20,70,40,0.9)' : 'rgba(30,90,50,0.9)'; g.beginPath(); g.arc(x, 640 + (k % 3) * 16, 90, 0, 7); g.fill(); }
      for (let k = 0; k < 6; k++) { const x = 100 + k * 220; g.strokeStyle = 'rgba(40,90,40,0.7)'; g.lineWidth = 5; g.beginPath(); g.moveTo(x, -40); g.quadraticCurveTo(x + Math.sin(t + k) * 20, 120, x + 10, 240 + (k % 3) * 40); g.stroke(); }
      g.restore();
      if (S.wind) { g.fillStyle = `rgba(220,240,255,${Math.abs(S.wind) * 0.12})`; g.fillRect(0, 0, 1280, 720); }
    },
    drawStage(g, S, t) {
      const { x0, x1, y, th } = this.A.stage, w = x1 - x0;
      // temple block with carved steps underneath
      g.fillStyle = MGH.grad(g, y, y + 380, ['#8a7a5a', '#5a4a3a', '#2a2018']);
      g.beginPath(); g.moveTo(x0 - 10, y); g.lineTo(x1 + 10, y); g.lineTo(x1 - 30, y + th); g.lineTo(x1 - 120, y + th + 60); g.lineTo(x1 - 260, y + th + 150); g.lineTo(x0 + 260, y + th + 150); g.lineTo(x0 + 120, y + th + 60); g.lineTo(x0 + 30, y + th); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 3; for (let k = 1; k < 6; k++) { g.beginPath(); g.moveTo(x0 + 20, y + k * 28); g.lineTo(x1 - 20, y + k * 28); g.stroke(); }
      // glowing glyph eyes on the temple face
      for (const ex of [x0 + w * 0.3, x0 + w * 0.7]) { MGH.glow(g, ex, y + 80, 40, 'rgba(120,255,200,0.4)'); g.fillStyle = '#7fffd0'; g.beginPath(); g.ellipse(ex, y + 80, 18, 8, 0, 0, 7); g.fill(); }
      // floor: worn stone tiles with spike slots and flame vents
      g.fillStyle = MGH.grad(g, y - 6, y + 34, ['#d8c8a0', '#a8906a', '#7a6a4a']); g.fillRect(x0 - 10, y, w + 20, 34);
      g.fillStyle = 'rgba(0,0,0,0.25)'; for (let x = x0; x < x1; x += 80) g.fillRect(x, y + 2, 3, 30);
      g.fillStyle = '#3a2e22'; for (let x = x0 + 20; x < x1 - 20; x += 26) g.fillRect(x + 6, y + 4, 12, 4);
      for (const vx of [420, 640, 960, 1180]) { g.fillStyle = '#2a1a10'; MGH.rr(g, vx - 22, y - 2, 44, 10, 4); g.fill(); MGH.glow(g, vx, y, 26, 'rgba(255,120,40,0.4)'); }
      g.fillStyle = '#5fae4a'; g.fillRect(x0 - 10, y - 3, w + 20, 4);
      // ledges: mossy carved slabs (the side ones crumble away when the gong rings)
      this.A.soft.forEach((p, k) => {
        const pw = p.x1 - p.x0, gone = p.offT > 0;
        if (gone) { g.save(); g.globalAlpha = p.offT < 0.6 ? 1 - p.offT / 0.6 : 0.18; g.setLineDash([8, 8]); g.strokeStyle = '#d8c8a0'; g.lineWidth = 2; g.strokeRect(p.x0, p.y, pw, 22); g.restore(); return; }
        g.fillStyle = MGH.grad(g, p.y, p.y + 30, ['#d8c8a0', '#9a8460']); MGH.rr(g, p.x0, p.y, pw, 24, 6); g.fill();
        g.fillStyle = '#5fae4a'; g.fillRect(p.x0 + 4, p.y - 3, pw - 8, 5);
        g.fillStyle = 'rgba(0,0,0,0.2)'; for (let x = p.x0 + 30; x < p.x1; x += 40) g.fillRect(x, p.y + 4, 2, 18);
        g.fillStyle = '#7a6a4a'; g.fillRect(p.x0 + pw / 2 - 18, p.y + 24, 36, 26);
      });
      for (const f of S.f) if (f.ground === 'respawn' && f.state !== 'dead') { g.globalAlpha = Math.min(1, f.respawnPlat / 0.6); g.fillStyle = 'rgba(255,255,255,0.8)'; g.beginPath(); g.ellipse(f.x, f.y + 4, 50, 10, 0, 0, 7); g.fill(); g.globalAlpha = 1; }
    },
  });

  // ---------------------------------------------------------------- Ledge Cage: closed forge arena, ledges, fight to the end
  BrawlArena({
    id: 'brawlCage', name: 'Ledge Cage',
    how: howCommon + 'A closed iron forge — nobody can fall out, so it\'s a fight to the end! Every hit takes HP; lose all 100 HP and you lose one of your 3 lives. Hop up onto the ledges (one or two levels up) and drop back down (DOWN). Smash a wall BUTTON to electrify the far half of the floor, or the top button to swing the spiked wrecking ball across the floor. Whoever sets a trap off is safe from it!',
    lives: 3, stamina: 100, taken: [1.26, 0.92, 0.86, 0.9],
    cage: { x0: 300, x1: 1300, y0: 90 },
    stage: { x0: 300, x1: 1300, y: 640, th: 200 },
    soft: [{ x0: 330, x1: 560, y: 480 }, { x0: 1040, x1: 1270, y: 480 }, { x0: 680, x1: 920, y: 330 }],
    blast: { x0: -2000, x1: 4000, y0: -3000, y1: 3000 },
    spawn: [{ x: 440, y: 480 }, { x: 1160, y: 480 }, { x: 640, y: 640 }, { x: 960, y: 640 }],
    respawnY: 240, haz: [],
    switches: [
      { x: 345, y: 640, kind: 'shockR', look: 'button', icon: '⚡', label: 'ZAP!', cdMax: 9 },
      { x: 1255, y: 640, kind: 'shockL', look: 'button', icon: '⚡', label: 'ZAP!', cdMax: 9 },
      { x: 800, y: 330, kind: 'ball', look: 'button', icon: '💣', label: 'WRECKING BALL!', cdMax: 12 },
    ],
    fire(game, m, S, w, i) {
      const col = m.players[i].color;
      if (w.kind === 'shockR' || w.kind === 'shockL') {
        const right = w.kind === 'shockR';
        game.trap(S, { kind: 'shock', x: right ? 1050 : 550, y: 618, w: 500, h: 44, warn: 0.8, life: 1.0, own: i, col, hit: H(9, 300, 7.5, 75) });
      } else {
        const fromLeft = S.f[i].x > 800, vx = (fromLeft ? 1 : -1) * 1000 / 1.1;
        game.trap(S, { kind: 'ball', x: fromLeft ? 340 : 1260, y: 585, w: 110, h: 110, vx, warn: 0.9, life: 1.1, anchor: 90, own: i, col, hit: H(13, 420, 10, 38) });
      }
    },
    useful(game, S, w, f) {
      const r = rivals(S, f.i);
      if (w.kind === 'shockR') return r.some(o => onFloor(S, o, 640) && o.x > 800);
      if (w.kind === 'shockL') return r.some(o => onFloor(S, o, 640) && o.x < 800);
      return r.some(o => onFloor(S, o, 640));
    },
    botGoal: goalFor,
    drawBack(g, S, t) {
      const sky = g.createLinearGradient(0, 0, 0, 720); sky.addColorStop(0, '#120c14'); sky.addColorStop(0.6, '#2a1418'); sky.addColorStop(1, '#4a1a10');
      g.fillStyle = sky; g.fillRect(0, 0, 1280, 720);
      const px = k => -(S.cam.x - 800) * k;
      // molten glow, gears and chains far behind
      MGH.glow(g, 640, 760, 600, 'rgba(255,90,30,0.4)');
      g.save(); g.translate(px(0.15), 0);
      for (const [x, y, r] of [[160, 200, 90], [1100, 160, 120], [640, 120, 60]]) { g.save(); g.translate(x, y); g.rotate(t * 0.2 * (r > 80 ? 1 : -1)); g.fillStyle = 'rgba(70,50,50,0.7)'; for (let k = 0; k < 10; k++) { g.rotate(Math.PI / 5); g.fillRect(-12, -r - 16, 24, 24); } g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill(); g.fillStyle = 'rgba(25,15,15,0.9)'; g.beginPath(); g.arc(0, 0, r * 0.35, 0, 7); g.fill(); g.restore(); }
      for (let k = 0; k < 7; k++) { const x = 60 + k * 200; g.strokeStyle = 'rgba(90,80,80,0.5)'; g.lineWidth = 6; g.setLineDash([14, 6]); g.beginPath(); g.moveTo(x, 0); g.lineTo(x + Math.sin(t * 0.7 + k) * 10, 380); g.stroke(); g.setLineDash([]); }
      g.restore();
      for (let k = 0; k < 30; k++) { const x = (k * 97 + t * 30) % 1280, y = 720 - ((k * 53 + t * 60) % 720); g.fillStyle = `rgba(255,${150 + (k % 3) * 30},60,0.6)`; g.fillRect(x, y, 3, 3); }
    },
    drawStage(g, S, t) {
      const c = this.A.cage, { x0, x1, y } = this.A.stage, w = x1 - x0;
      // iron walls and ceiling
      g.fillStyle = MGH.grad(g, c.y0 - 200, y + 200, ['#3a3440', '#2a2430', '#1a1420']);
      g.fillRect(x0 - 140, c.y0 - 200, 140, y - c.y0 + 400); g.fillRect(x1, c.y0 - 200, 140, y - c.y0 + 400); g.fillRect(x0 - 140, c.y0 - 200, w + 280, 200);
      g.fillStyle = 'rgba(255,255,255,0.08)'; for (let yy = c.y0; yy < y; yy += 60) { g.fillRect(x0 - 140, yy, 140, 4); g.fillRect(x1, yy, 140, 4); }
      g.fillStyle = '#5a5060'; for (let yy = c.y0 + 20; yy < y; yy += 60) for (const xx of [x0 - 16, x1 + 16]) { g.beginPath(); g.arc(xx, yy, 5, 0, 7); g.fill(); }
      // hazard stripes on the inside edges
      for (const xx of [x0 - 10, x1]) for (let yy = c.y0; yy < y; yy += 40) { g.fillStyle = (yy / 40) % 2 ? '#ffcf3a' : '#2a2430'; g.fillRect(xx, yy, 10, 40); }
      g.fillStyle = '#6a6070'; for (let xx = x0; xx < x1; xx += 50) g.fillRect(xx, c.y0 - 10, 30, 10);
      // floor: steel plates over a glowing grate
      g.fillStyle = MGH.grad(g, y, y + 200, ['#7a7480', '#4a4450', '#2a2430']); g.fillRect(x0 - 140, y, w + 280, 200);
      g.fillStyle = '#9a94a0'; g.fillRect(x0, y - 2, w, 6);
      for (let xx = x0; xx < x1; xx += 100) { g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(xx, y + 4, 3, 40); g.fillStyle = '#5a5460'; g.beginPath(); g.arc(xx + 12, y + 14, 4, 0, 7); g.fill(); }
      MGH.glow(g, 800, y + 60, 400, 'rgba(255,100,30,0.25)');
      // ledges: steel girders with rivets
      for (const p of this.A.soft) {
        const pw = p.x1 - p.x0;
        g.fillStyle = MGH.grad(g, p.y, p.y + 24, ['#a8a0b0', '#5a5460']); g.fillRect(p.x0, p.y, pw, 22);
        g.strokeStyle = '#3a3440'; g.lineWidth = 3; g.beginPath(); for (let x = p.x0; x < p.x1 - 20; x += 40) { g.moveTo(x, p.y + 22); g.lineTo(x + 20, p.y + 4); g.lineTo(x + 40, p.y + 22); } g.stroke();
        g.fillStyle = '#ffcf3a'; g.fillRect(p.x0, p.y - 3, pw, 4);
        g.strokeStyle = '#6a6070'; g.lineWidth = 4; g.beginPath(); g.moveTo(p.x0 + 20, p.y); g.lineTo(p.x0 + 20, c.y0); g.moveTo(p.x1 - 20, p.y); g.lineTo(p.x1 - 20, c.y0); g.stroke();
      }
      for (const f of S.f) if (f.ground === 'respawn' && f.state !== 'dead') { g.globalAlpha = Math.min(1, f.respawnPlat / 0.6); g.fillStyle = 'rgba(255,200,120,0.8)'; g.beginPath(); g.ellipse(f.x, f.y + 4, 50, 10, 0, 0, 7); g.fill(); g.globalAlpha = 1; }
    },
  });

  // ---------------------------------------------------------------- Sand Colosseum: flat floor, no ledges, fight to the end
  BrawlArena({
    id: 'brawlColosseum', name: 'Sand Colosseum',
    how: howCommon + 'A walled sand arena with no ledges at all and nowhere to fall — it\'s a straight fight to the end! Every hit takes HP; lose all 100 HP and you lose one of your 3 lives. Smash a CANNON\'s fuse to fire a cannonball across the floor (jump it!), or ring the GONG in the middle to burst sand geysers under your rivals. Whoever sets a trap off is safe from it!',
    lives: 3, stamina: 100, taken: [1.2, 0.88, 0.8, 0.92],
    cage: { x0: 280, x1: 1320, y0: 70 },
    stage: { x0: 280, x1: 1320, y: 640, th: 200 },
    soft: [],
    blast: { x0: -2000, x1: 4000, y0: -3000, y1: 3000 },
    spawn: [{ x: 420, y: 640 }, { x: 1180, y: 640 }, { x: 640, y: 640 }, { x: 960, y: 640 }],
    respawnY: 260, haz: ['meteor', 'crystal'],
    switches: [
      { x: 330, y: 640, kind: 'cannonL', look: 'lever', icon: '💣', label: 'CANNON!', cdMax: 8 },
      { x: 1270, y: 640, kind: 'cannonR', look: 'lever', icon: '💣', label: 'CANNON!', cdMax: 8 },
      { x: 800, y: 640, kind: 'gong', look: 'gong', icon: '🌪️', label: 'SAND GEYSERS!', cdMax: 11 },
    ],
    fire(game, m, S, w, i) {
      const col = m.players[i].color;
      if (w.kind === 'cannonL' || w.kind === 'cannonR') {
        const L = w.kind === 'cannonL';
        game.trap(S, { kind: 'cannon', x: L ? 300 : 1300, y: 598, w: 56, h: 56, vx: (L ? 1 : -1) * 1000, warn: 0.6, life: 1.04, own: i, col, hit: H(12, 380, 9.5, 32) });
        S.shake = Math.max(S.shake, 5);
      } else {
        // geysers erupt under the rivals (with a warning so they can dodge)
        rivals(S, i).forEach(o => game.trap(S, { kind: 'geyser', x: clamp(o.x + R.range(-30, 30), 330, 1270), y: 640 - 160, w: 100, h: 320, warn: 1.0, life: 0.7, own: i, col, hit: H(9, 330, 8.5, 88) }));
        game.trap(S, { kind: 'geyser', x: R.range(330, 1270), y: 640 - 160, w: 100, h: 320, warn: 1.0, life: 0.7, own: i, col, hit: H(9, 330, 8.5, 88) });
      }
    },
    useful(game, S, w, f) {
      const r = rivals(S, f.i).filter(o => onFloor(S, o, 640));
      if (w.kind === 'cannonL') return r.some(o => o.x > f.x);
      if (w.kind === 'cannonR') return r.some(o => o.x < f.x);
      return r.length > 0;
    },
    botGoal: goalFor,
    drawBack(g, S, t) {
      const px = k => -(S.cam.x - 800) * k;
      const sky = g.createLinearGradient(0, 0, 0, 720); sky.addColorStop(0, '#3a8ae8'); sky.addColorStop(0.6, '#9fd0ff'); sky.addColorStop(1, '#ffe2b0');
      g.fillStyle = sky; g.fillRect(0, 0, 1280, 720);
      MGH.cloud(g, (t * 10) % 1500 - 150, 90, 1); MGH.cloud(g, (t * 6 + 700) % 1500 - 150, 140, 0.7);
      // the curved stands full of cheering fans
      g.save(); g.translate(px(0.2), 0);
      g.fillStyle = '#c89a6a'; g.fillRect(-200, 220, 1700, 360);
      for (let r = 0; r < 4; r++) { g.fillStyle = r % 2 ? '#b0845a' : '#d8aa78'; g.fillRect(-200, 240 + r * 80, 1700, 10); }
      for (let r = 0; r < 3; r++) MGH.crowd(g, t + r, 290 + r * 95, 34, ['#8a5a3a', '#5a6a8a', '#7a3a3a', '#4a6a4a', '#8a7a3a'], r === 0);
      g.fillStyle = 'rgba(255,232,196,0.3)'; g.fillRect(-200, 220, 1700, 360); // haze pushes the stands back
      for (let k = 0; k < 9; k++) { const x = -120 + k * 190; g.fillStyle = '#e8d0a8'; g.fillRect(x, 190, 40, 400); g.fillStyle = '#f8e8c8'; g.fillRect(x - 8, 180, 56, 16); }
      for (let k = 0; k < 5; k++) { const x = 40 + k * 330; g.fillStyle = ['#ff6a3d', '#4f8dff', '#7ccf4a', '#ffd34d', '#b46bff'][k]; g.beginPath(); g.moveTo(x, 150); g.lineTo(x + 60, 150 + Math.sin(t * 3 + k) * 6); g.lineTo(x + 60, 190); g.lineTo(x, 195); g.fill(); g.fillStyle = '#ddd'; g.fillRect(x - 3, 140, 4, 80); }
      g.restore();
    },
    drawStage(g, S, t) {
      const c = this.A.cage, { x0, x1, y } = this.A.stage, w = x1 - x0;
      // stone arena walls
      g.fillStyle = MGH.grad(g, c.y0, y, ['#b89a72', '#8a6e4e']); g.fillRect(x0 - 140, c.y0 + 160, 140, y - c.y0); g.fillRect(x1, c.y0 + 160, 140, y - c.y0);
      g.fillStyle = 'rgba(0,0,0,0.15)'; for (let yy = c.y0 + 180; yy < y; yy += 44) { g.fillRect(x0 - 140, yy, 140, 3); g.fillRect(x1, yy, 140, 3); }
      g.fillStyle = '#d8c09a'; g.fillRect(x0 - 150, c.y0 + 150, 160, 16); g.fillRect(x1 - 10, c.y0 + 150, 160, 16);
      // a shimmering force wall above the stone (you bounce off it)
      for (const xx of [x0, x1]) { g.fillStyle = `rgba(160,220,255,${0.12 + 0.06 * Math.sin(t * 3)})`; g.fillRect(xx - 6, c.y0, 12, 170); }
      g.fillStyle = `rgba(160,220,255,${0.1 + 0.05 * Math.sin(t * 3)})`; g.fillRect(x0, c.y0 - 6, w, 10);
      // cannons on the walls
      for (const [xx, d] of [[x0 + 4, 1], [x1 - 4, -1]]) { g.save(); g.translate(xx, y - 42); g.scale(d, 1); g.fillStyle = '#2a2a34'; MGH.rr(g, -20, -20, 70, 40, 12); g.fill(); g.fillStyle = '#4a4a58'; g.fillRect(40, -24, 14, 48); g.fillStyle = '#6a4a2a'; g.beginPath(); g.arc(4, 22, 16, 0, 7); g.fill(); g.restore(); }
      // sand floor
      g.fillStyle = MGH.grad(g, y, y + 200, ['#f0d49a', '#d8b070', '#a8804a']); g.fillRect(x0 - 140, y, w + 280, 200);
      g.fillStyle = '#f8e2b0'; g.fillRect(x0, y - 3, w, 5);
      g.fillStyle = 'rgba(160,110,60,0.35)'; for (let k = 0; k < 40; k++) { const sx = x0 + ((k * 137) % w), sy = y + 12 + (k * 31) % 60; g.beginPath(); g.ellipse(sx, sy, 10, 3, 0, 0, 7); g.fill(); }
      for (const f of S.f) if (f.ground === 'respawn' && f.state !== 'dead') { g.globalAlpha = Math.min(1, f.respawnPlat / 0.6); g.fillStyle = 'rgba(255,255,255,0.8)'; g.beginPath(); g.ellipse(f.x, f.y + 4, 50, 10, 0, 0, 7); g.fill(); g.globalAlpha = 1; }
    },
  });
})();
