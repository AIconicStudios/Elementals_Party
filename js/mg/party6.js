'use strict';
// Party batch 3b: Snowball Roll, Pocket Soccer (2v2), Hide & Seek (1v3), Pizza Rush

// ======================================================================== SNOWBALL ROLL
MG.def({
  id: 'snowroll', name: 'Snowball Roll', type: 'Race', controls: 'Left/Right', dur: 35,
  rows: [['lr', 'Steer your snowball']],
  how: 'Push a snowball down the mountain — it grows bigger with every metre of fresh snow it rolls over! Steer around the rocks and trees: a bump knocks a chunk off. Patches of bare grass melt it a little. Bigger balls roll faster too.',
  wins: 'Biggest snowball at the bottom.',
  init(m, S) {
    S.p = [0, 1, 2, 3].map(() => ({ x: 0, y: 0, size: 14, vx: 0, bump: 0 }));
    S.obs = []; for (let y = 300; y < 9000; y += R.range(120, 200)) S.obs.push({ x: R.range(-120, 120), y, kind: R.pick(['rock', 'tree', 'tree', 'grass']) });
  },
  update(m, S, dt) {
    S.p.forEach((p, i) => {
      p.bump -= dt; const ax = m.axis(i).x; p.vx += (ax * 520 - p.vx * 4) * dt; p.x = clamp(p.x + p.vx * dt, -130, 130);
      const sp = 160 + p.size * 3; p.y += sp * dt; p.size += dt * 2.2 * (p.bump > 0 ? 0 : 1);
      S.obs.forEach(o => { if (o['h' + i]) return; if (Math.abs(o.y - p.y) < p.size * 0.5 + 16 && Math.abs(o.x - p.x) < p.size * 0.6 + (o.kind === 'grass' ? 40 : 18)) { o['h' + i] = 1; if (o.kind === 'grass') { p.size = Math.max(10, p.size * 0.9); } else { p.size = Math.max(10, p.size * 0.72); p.bump = 0.5; p.vx = (p.x > o.x ? 1 : -1) * 200; if (!m.bot(i)) Sfx.thud(); MGH.burst(160 + i * 320 + p.x * 0.9, 470, ['#fff', '#dff4ff'], 12, { speed: 200 }); } } });
    });
  },
  bot(m, S, i) {
    const p = S.p[i], v = m.vin[i]; v.left = v.right = false;
    const o = S.obs.find(o => !o['h' + i] && o.y > p.y && o.y < p.y + 220 && Math.abs(o.x - p.x) < p.size * 0.6 + 40);
    if (o && Math.random() > 0.08) { if (p.x >= o.x) v.right = true; else v.left = true; }
  },
  score(m, S) { return S.p.map(p => Math.round(p.size)); },
  fmt(s) { return `size ${s}`; },
  hud(m, S, i) { return `size ${Math.round(S.p[i].size)}`; },
  draw(m, S, g) {
    for (let i = 0; i < 4; i++) {
      const p = S.p[i], ox = i * 320, cam = p.y, pl = m.players[i];
      g.save(); g.beginPath(); g.rect(ox, 40, 320, 680); g.clip();
      g.fillStyle = MGH.grad(g, 40, 720, ['#e8f4ff', '#ffffff']); g.fillRect(ox, 40, 320, 680);
      for (let k = 0; k < 18; k++) { const yy = 720 - ((k * 61 + cam) % 760); g.fillStyle = 'rgba(180,210,240,0.5)'; g.beginPath(); g.ellipse(ox + MGH.hash(k) * 320, yy, 30, 6, 0, 0, 7); g.fill(); }
      g.strokeStyle = 'rgba(160,190,220,0.6)'; g.lineWidth = Math.max(4, p.size * 0.6); g.beginPath(); g.moveTo(ox + 160 + p.x * 0.9, 470); g.lineTo(ox + 160 + p.x * 0.9, 40); g.stroke();
      const sy = o => 470 + (o.y - cam) * 0.9;
      S.obs.forEach(o => { const y = sy(o); if (y < 0 || y > 760) return; const x = ox + 160 + o.x * 0.9; if (o.kind === 'rock') MGH.rock(g, x, y, 18, o.y, '#8a8a98'); else if (o.kind === 'grass') { g.fillStyle = '#8ac86a'; g.beginPath(); g.ellipse(x, y, 44, 14, 0, 0, 7); g.fill(); } else { g.fillStyle = '#5a3a20'; g.fillRect(x - 4, y - 8, 8, 16); g.fillStyle = '#3a7a5a'; g.beginPath(); g.moveTo(x - 22, y - 6); g.lineTo(x, y - 56); g.lineTo(x + 22, y - 6); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(x - 10, y - 32); g.lineTo(x, y - 56); g.lineTo(x + 10, y - 32); g.fill(); } });
      const bx = ox + 160 + p.x * 0.9, r = p.size;
      Char.draw(g, bx, 470 - r - 40, 22, pl.el.id, pl.color, { mood: p.bump > 0 ? 'hurt' : 'effort', seed: i, look: { x: 0, y: 1 }, hands: { n: { x: -0.6, y: 0.4, d: 120, o: true, m: false }, f: { x: 0.6, y: 0.4, d: 60, o: true, m: false } } });
      g.save(); g.translate(bx, 470); g.rotate(p.y * 0.02); const gr = g.createRadialGradient(-r * 0.3, -r * 0.3, 2, 0, 0, r); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#c8dcf0'); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill(); g.fillStyle = 'rgba(160,190,220,0.6)'; for (let q = 0; q < 4; q++) { g.beginPath(); g.arc(Math.cos(q * 1.6) * r * 0.5, Math.sin(q * 1.6) * r * 0.5, r * 0.12, 0, 7); g.fill(); } g.restore();
      MGH.text(g, `${pl.name} · ${Math.round(p.size)}`, ox + 160, 700, 18, pl.color, 'center', 'bold');
      g.restore(); g.fillStyle = '#9ab0c8'; g.fillRect(ox + 318, 40, 4, 680);
    }
  },
});

// ======================================================================== POCKET SOCCER (2 vs 2)
MG.def({
  id: 'soccer', name: 'Pocket Soccer', type: 'Arena', mode: '2v2', controls: 'Move + button', dur: 75, sport: true,
  rows: [['pad', 'Run (touch the ball to dribble)'], ['a', 'Kick']],
  how: 'Two against two on a mini pitch! Run into the ball to dribble it along, and press A to KICK it hard the way you are facing. RED scores in the goal on the RIGHT, BLUE in the goal on the LEFT. The ball bounces off the walls — use them for trick shots!',
  wins: 'The team with more goals.',
  F: { x0: 90, x1: 1190, y0: 120, y1: 660, g0: 300, g1: 480 },
  init(m, S) { S.goals = [0, 0]; this.kickoff(m, S); },
  kickoff(m, S) {
    const k = [0, 0];
    S.b = m.players.map((p, i) => { const tm = m.teamOf(i), j = k[tm]++, s = tm === 0 ? -1 : 1; return Object.assign(MGH.body(640 + s * (j ? 380 : 170), 390 + (j ? 0 : (tm ? 80 : -80)), 24), { cd: 0, face: { x: -s, y: 0 } }); });
    S.ball = { x: 640, y: 390, vx: 0, vy: 0 }; S.pause = 1.2;
  },
  update(m, S, dt) {
    const F = this.F; if (S.pause > 0) { S.pause -= dt; return; }
    const B = S.ball;
    S.b.forEach((b, i) => {
      const a = m.axis(i); MGH.steer(b, a.x, a.y, dt, 1700, 280, 5); b.cd -= dt;
      b.x += b.vx * dt; b.y += b.vy * dt; b.x = clamp(b.x, F.x0 + 20, F.x1 - 20); b.y = clamp(b.y, F.y0 + 20, F.y1 - 20);
      const d = dist(b.x, b.y, B.x, B.y);
      if (m.pressed(i, 'a') && d < 54 && b.cd <= 0) { const kx = (B.x - b.x) / (d || 1) * 0.6 + b.face.x * 0.4, ky = (B.y - b.y) / (d || 1) * 0.6 + b.face.y * 0.4, kl = Math.hypot(kx, ky) || 1; B.vx = kx / kl * 840 + b.vx * 0.3; B.vy = ky / kl * 840 + b.vy * 0.3; b.cd = 0.4; Sfx.punch(); MGH.burst(B.x, B.y, ['#fff'], 8, { speed: 150 }); }
      else if (d < 38 && d > 0) { const nx = (B.x - b.x) / d, ny = (B.y - b.y) / d; const tx = clamp(b.x + nx * 38, F.x0 + 12, F.x1 - 12), ty = clamp(b.y + ny * 38, F.y0 + 12, F.y1 - 12); B.x = tx; B.y = ty; if (dist(b.x, b.y, B.x, B.y) < 37) { b.x = B.x - nx * 38; b.y = B.y - ny * 38; b.vx *= 0.3; b.vy *= 0.3; } const rel = (b.vx - B.vx) * nx + (b.vy - B.vy) * ny; if (rel > 0) { B.vx += nx * rel * 1.15; B.vy += ny * rel * 1.15; } }
    });
    MGH.collide(S.b, 1);
    // the pitch is gently banked at the edges: a slow ball rolls back into play instead of sticking to a wall
    if (B.y < F.y0 + 60) B.vy += 260 * dt; if (B.y > F.y1 - 60) B.vy -= 260 * dt; if ((B.x < F.x0 + 60 || B.x > F.x1 - 60) && !(B.y > F.g0 && B.y < F.g1)) B.vx += (B.x < 640 ? 260 : -260) * dt;
    B.x += B.vx * dt; B.y += B.vy * dt; const sp = Math.hypot(B.vx, B.vy); if (sp > 0) { const ns = Math.max(0, sp - (40 + sp * 0.9) * dt); B.vx *= ns / sp; B.vy *= ns / sp; }
    const mouth = B.y > F.g0 && B.y < F.g1;
    if (B.y < F.y0 + 12) { B.y = F.y0 + 12; B.vy = Math.abs(B.vy) * 0.85 + 90; } if (B.y > F.y1 - 12) { B.y = F.y1 - 12; B.vy = -Math.abs(B.vy) * 0.85 - 90; }
    if (!mouth) { if (B.x < F.x0 + 12) { B.x = F.x0 + 12; B.vx = Math.abs(B.vx) * 0.85; } if (B.x > F.x1 - 12) { B.x = F.x1 - 12; B.vx = -Math.abs(B.vx) * 0.85; } }
    // bevelled corners deflect the ball back into play
    const C0 = 90; [[F.x0, F.y0 + C0, F.x0 + C0, F.y0], [F.x1 - C0, F.y0, F.x1, F.y0 + C0], [F.x1, F.y1 - C0, F.x1 - C0, F.y1], [F.x0 + C0, F.y1, F.x0, F.y1 - C0]].forEach(w => bounceSeg(B, w[0], w[1], w[2], w[3], 13, 0.9));
    if (B.x < F.x0 - 10 || B.x > F.x1 + 10) { const tm = B.x > 640 ? 0 : 1; S.goals[tm]++; Sfx.crowd('cheer'); Sfx.whistle(); MGH.shake(10); for (let k = 0; k < 3; k++) MGH.burst(B.x, B.y, [MG.TEAMC[tm], '#fff', '#ffd34d'], 30, { speed: 380, life: 1.2 }); S.flash = { tm, t: 1.6 }; this.kickoff(m, S); }
    if (S.flash) { S.flash.t -= dt; if (S.flash.t <= 0) S.flash = null; }
  },
  bot(m, S, i) {
    const b = S.b[i], v = m.vin[i], tm = m.teamOf(i), F = this.F, B = S.ball, gx = tm === 0 ? F.x1 + 40 : F.x0 - 40, own = tm === 0 ? F.x0 : F.x1; v.a = false;
    const mate = S.b[m.mates(i)[0]], me = dist(b.x, b.y, B.x, B.y) <= dist(mate.x, mate.y, B.x, B.y);
    if (me) { const dx = gx - B.x, dy = (390 - B.y) * (B.y < F.y0 + 70 || B.y > F.y1 - 70 ? 3 : 1), l = Math.hypot(dx, dy) || 1, bd = dist(b.x, b.y, B.x, B.y), behind = ((b.x - B.x) * dx + (b.y - B.y) * dy) / (l * (bd || 1)) < -0.3;
      const ax2 = B.x - dx / l * 60, ay2 = clamp(B.y - dy / l * 60, F.y0 + 40, F.y1 - 40); if (bd > 90 || !behind) MGH.aim(m, i, ax2, ay2, b); else MGH.aim(m, i, B.x, B.y, b);
      if (bd < 56 && (behind || Math.hypot(B.vx, B.vy) < 40) && Math.random() < 0.3) v.a = true; }
    else MGH.aim(m, i, (B.x + own) / 2, (B.y + 390) / 2, b);
  },
  score(m, S) { return m.players.map((p, i) => S.goals[m.teamOf(i)]); },
  fmt(s) { return `${s} goal${s === 1 ? '' : 's'}`; },
  hud(m, S, i) { return MG.TEAMN[m.teamOf(i)]; },
  draw(m, S, g) {
    const F = this.F;
    g.fillStyle = MGH.grad(g, 0, 720, ['#1a3a2a', '#2a4a3a']); g.fillRect(0, 0, 1280, 720); MGH.crowd(g, m.t, 112, 30, ['#c84a5a', '#4a6ac8', '#e8e8e8', '#c8a84a']);
    for (let k = 0; k < 11; k++) { g.fillStyle = k % 2 ? '#4ab84a' : '#5ac85a'; g.fillRect(F.x0 + k * 100, F.y0, 100, F.y1 - F.y0); }
    g.strokeStyle = '#fff'; g.lineWidth = 4; g.strokeRect(F.x0, F.y0, F.x1 - F.x0, F.y1 - F.y0); g.beginPath(); g.moveTo(640, F.y0); g.lineTo(640, F.y1); g.stroke(); g.beginPath(); g.arc(640, 390, 70, 0, 7); g.stroke();
    for (const [x, s] of [[F.x0, 1], [F.x1, -1]]) { g.strokeRect(s > 0 ? x : x - 130, 270, 130, 240); }
    g.fillStyle = '#2a4a3a'; for (const [ax, ay, bx2, by2, cx2, cy2] of [[F.x0, F.y0, F.x0 + 90, F.y0, F.x0, F.y0 + 90], [F.x1, F.y0, F.x1 - 90, F.y0, F.x1, F.y0 + 90], [F.x1, F.y1, F.x1 - 90, F.y1, F.x1, F.y1 - 90], [F.x0, F.y1, F.x0 + 90, F.y1, F.x0, F.y1 - 90]]) { g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx2, by2); g.lineTo(cx2, cy2); g.closePath(); g.fill(); }
    [[F.x0, 1, 1], [F.x1, -1, 0]].forEach(([x, s, owner]) => { g.fillStyle = 'rgba(255,255,255,0.75)'; g.fillRect(s > 0 ? x - 40 : x, F.g0, 40, F.g1 - F.g0); g.strokeStyle = MG.TEAMC[owner]; g.lineWidth = 6; g.strokeRect(s > 0 ? x - 40 : x, F.g0, 40, F.g1 - F.g0); });
    S.b.forEach((b, i) => { g.fillStyle = MG.TEAMC[m.teamOf(i)]; g.globalAlpha = 0.5; g.beginPath(); g.ellipse(b.x, b.y + 28, 30, 9, 0, 0, 7); g.fill(); g.globalAlpha = 1; MGH.drawBody(g, b, m.players[i]); });
    const B = S.ball; MGH.shadow(g, B.x, B.y + 12, 13, 0.3); g.save(); g.translate(B.x, B.y); g.rotate((B.x + B.y) * 0.03); g.fillStyle = '#fff'; g.beginPath(); g.arc(0, 0, 13, 0, 7); g.fill(); g.fillStyle = '#222'; for (let k = 0; k < 5; k++) { const a = k * 1.256; g.beginPath(); g.arc(Math.cos(a) * 8, Math.sin(a) * 8, 3.5, 0, 7); g.fill(); } g.restore();
    g.fillStyle = 'rgba(10,10,30,0.85)'; MGH.rr(g, 500, 50, 280, 52, 14); g.fill(); MGH.text(g, String(S.goals[0]), 580, 90, 38, MG.TEAMC[0], 'center', 'bold'); MGH.text(g, ':', 640, 88, 34, '#fff', 'center', 'bold'); MGH.text(g, String(S.goals[1]), 700, 90, 38, MG.TEAMC[1], 'center', 'bold');
    Char.npc(g, 640, 690, 18, 'ref', { mood: 'happy', t: m.t });
    if (S.flash) MGH.text(g, `GOAL! Team ${MG.TEAMN[S.flash.tm]}`, 640, 300, 64, MG.TEAMC[S.flash.tm], 'center', 'bold');
  },
});

// ======================================================================== HIDE & SEEK (1 vs 3)
MG.def({
  id: 'hideseek', name: 'Hide & Seek', type: 'Stealth', mode: '1v3', controls: 'Move + button', dur: 50,
  rows: [['pad', 'Sneak / search'], ['a', 'Search a bush (seeker)']],
  how: 'Night in the garden. ONE seeker carries a lantern; anyone caught in its light for a moment is found! The THREE hiders sneak about catching fireflies (three glow at a time; 10 are needed) — and can duck into bushes, where the light cannot see them. But a bush rustles when someone moves inside it… The seeker can press A next to a bush to search it. Hiders win by catching 10 fireflies; the seeker wins by finding all three, or when time runs out.',
  wins: 'Hiders: catch 10 fireflies. Seeker: find everyone or outlast the clock.',
  init(m, S) {
    S.seek = m.players.findIndex((p, i) => m.teamOf(i) === 0);
    S.b = m.players.map((p, i) => Object.assign(MGH.body(640, 380, 22), { found: false, seen: 0, cd: 0, bush: -1, rustle: 0 }));
    S.bushes = [[220, 220], [500, 180], [800, 200], [1080, 240], [180, 460], [460, 400], [820, 440], [1100, 470], [640, 600], [340, 620], [960, 630]].map(([x, y]) => ({ x, y, r: 56 }));
    S.flies = [...Array(3)].map(() => ({ x: R.range(80, 1200), y: R.range(130, 680), got: false, ph: R.range(0, 6) })); S.caught = 0; S.NEED = 10; S.respawn = [];
    S.win = -1; const far = [0, 1, 2, 3, 7, 8, 9, 10]; let k = 0; S.b.forEach((b, i) => { if (i === S.seek) return; const u = S.bushes[R.shuffle(far)[k++ % far.length]]; b.x = u.x; b.y = u.y; });
  },
  update(m, S, dt) {
    S.b.forEach((b, i) => {
      if (b.found) return; b.cd -= dt;
      const a = m.axis(i), sk = i === S.seek; MGH.steer(b, a.x, a.y, dt, 1700, sk ? 225 : 225, 6);
      b.x += b.vx * dt; b.y += b.vy * dt; b.x = clamp(b.x, 40, 1240); b.y = clamp(b.y, 110, 690);
      if (!sk) { b.bush = S.bushes.findIndex(u => dist(u.x, u.y, b.x, b.y) < u.r - 8); b.rustle = b.bush >= 0 && Math.hypot(b.vx, b.vy) > 150 ? 0.5 : Math.max(0, b.rustle - dt);
        S.flies.forEach(f => { if (!f.got && dist(f.x, f.y, b.x, b.y) < 34) { f.got = true; S.caught++; S.respawn.push(2.2); Sfx.coin(); MGH.pop('✨', f.x, f.y - 20, '#ffe680', 26); } }); }
    });
    const s = S.b[S.seek], fx = s.face.x, fy = s.face.y;
    if (m.pressed(S.seek, 'a') && s.cd <= 0) { s.cd = 2.5; const u = S.bushes.find(u => dist(u.x, u.y, s.x, s.y) < u.r + 40); if (u) { Sfx.noise(0.3, 1200, 0.06); S.b.forEach((b, i) => { if (i !== S.seek && !b.found && dist(u.x, u.y, b.x, b.y) < u.r) { b.found = true; Sfx.boom(); MGH.pop('FOUND!', b.x, b.y - 50, '#ffe680', 30); } }); } }
    S.b.forEach((b, i) => {
      if (i === S.seek || b.found) return;
      const dx = b.x - s.x, dy = b.y - s.y, d = Math.hypot(dx, dy), inCone = d < 250 && (dx * fx + dy * fy) / (d || 1) > 0.84 && b.bush < 0;
      b.seen = inCone ? b.seen + dt : Math.max(0, b.seen - dt * 2);
      if (b.seen > 0.8) { b.found = true; Sfx.boom(); MGH.pop('FOUND!', b.x, b.y - 50, '#ffe680', 30); }
    });
    S.respawn = S.respawn.map(t => t - dt); while (S.respawn.length && S.respawn[0] <= 0) { S.respawn.shift(); const f = S.flies.find(f => f.got); if (f) { f.got = false; f.x = R.range(80, 1200); f.y = R.range(130, 680); } }
    if (S.caught >= S.NEED) { S.win = 1; m.finish(this.score(m, S)); }
    else if (S.b.every((b, i) => i === S.seek || b.found)) { S.win = 0; m.finish(this.score(m, S)); }
  },
  bot(m, S, i) {
    const b = S.b[i], v = m.vin[i]; v.a = false; if (b.found) return;
    const s = S.b[S.seek];
    if (i === S.seek) {
      const tgt = S.b.filter((o, j) => j !== i && !o.found);
      const rust = S.bushes.find(u => tgt.some(o => o.bush >= 0 && S.bushes[o.bush] === u && o.rustle > 0));
      const vis = tgt.filter(o => o.bush < 0);
      const t = rust ? rust : vis.length ? vis.reduce((a, o) => (!a || dist(b.x, b.y, o.x, o.y) < dist(b.x, b.y, a.x, a.y) ? o : a), null) : S.bushes[Math.floor(m.t / 3) % S.bushes.length];
      MGH.aim(m, i, t.x, t.y, b);
      if (S.bushes.some(u => dist(u.x, u.y, b.x, b.y) < u.r + 36) && Math.random() < (rust ? 0.12 : 0.002)) v.a = true;
      return;
    }
    const d = dist(b.x, b.y, s.x, s.y), facing = ((b.x - s.x) * s.face.x + (b.y - s.y) * s.face.y) / (d || 1) > 0.5;
    if (d < 300 && facing || d < 140) { const u = b.hideIn && b.bush >= 0 ? S.bushes[b.bush] : S.bushes.reduce((a, u) => (!a || dist(b.x, b.y, u.x, u.y) - dist(s.x, s.y, u.x, u.y) * 0.8 < dist(b.x, b.y, a.x, a.y) - dist(s.x, s.y, a.x, a.y) * 0.8 ? u : a), null); b.hideIn = true; const du = dist(b.x, b.y, u.x, u.y); if (du > 10) { MGH.aim(m, i, u.x, u.y, b); if (b.bush >= 0 && du < 40) { v.ax *= 0.3; v.ay *= 0.3; v.left = v.right = v.up = v.down = false; } } else { v.ax = 0; v.ay = 0; v.left = v.right = v.up = v.down = false; } return; }
    b.hideIn = false;
    const f = S.flies.filter(f => !f.got).reduce((a, f) => (!a || dist(b.x, b.y, f.x, f.y) - dist(s.x, s.y, f.x, f.y) * 0.6 < dist(b.x, b.y, a.x, a.y) - dist(s.x, s.y, a.x, a.y) * 0.6 ? f : a), null);
    if (f) MGH.aim(m, i, f.x, f.y, b);
  },
  score(m, S) { const hidersWon = S.win === 1; return m.players.map((p, i) => (i === S.seek) !== hidersWon ? 1 : 0); },
  fmt(s) { return s ? 'won!' : 'lost'; },
  hud(m, S, i) { return i === S.seek ? '🏮 seeker' : S.b[i].found ? 'found' : `✨ ${S.caught}/${S.NEED}`; },
  draw(m, S, g) {
    g.fillStyle = '#1a2a3a'; g.fillRect(0, 0, 1280, 720);
    for (let k = 0; k < 60; k++) { g.fillStyle = 'rgba(40,70,60,0.6)'; g.fillRect(MGH.hash(k) * 1280, 110 + MGH.hash(k + 5) * 600, 3, 9); }
    S.flies.forEach(f => { if (f.got) return; const x = f.x + Math.sin(m.t * 2 + f.ph) * 8, y = f.y + Math.cos(m.t * 1.6 + f.ph) * 6; MGH.glow(g, x, y, 30, 'rgba(230,255,140,0.5)'); g.fillStyle = '#eaff9a'; g.beginPath(); g.arc(x, y, 4, 0, 7); g.fill(); });
    const s = S.b[S.seek], ang = Math.atan2(s.face.y, s.face.x);
    // lantern light cone
    g.save(); const lg = g.createRadialGradient(s.x, s.y, 10, s.x, s.y, 310); lg.addColorStop(0, 'rgba(255,240,170,0.55)'); lg.addColorStop(1, 'rgba(255,240,170,0)'); g.fillStyle = lg; g.beginPath(); g.moveTo(s.x, s.y); g.arc(s.x, s.y, 260, ang - 0.57, ang + 0.57); g.closePath(); g.fill(); g.restore();
    S.b.forEach((b, i) => { if (i === S.seek) return; if (b.found) { g.globalAlpha = 0.6; MGH.drawBody(g, b, m.players[i], null, 'shock'); g.globalAlpha = 1; return; } if (b.bush < 0) { MGH.drawBody(g, b, m.players[i], null, b.seen > 0 ? 'scared' : 'nervous'); if (b.seen > 0) { g.fillStyle = '#ff4a3a'; g.fillRect(b.x - 20, b.y - 56, 40 * b.seen / 0.8, 5); } } });
    S.bushes.forEach(u => { const sh = S.b.some(b => b.bush >= 0 && S.bushes[b.bush] === u && b.rustle > 0) ? Math.sin(m.t * 40) * 4 : 0; for (const [dx, dy, r] of [[-28, 8, 30], [26, 6, 30], [0, -16, 36], [-10, 18, 24], [18, 20, 24]]) { g.fillStyle = '#1f5a32'; g.beginPath(); g.arc(u.x + dx + sh, u.y + dy, r, 0, 7); g.fill(); } g.fillStyle = 'rgba(80,140,90,0.4)'; g.beginPath(); g.arc(u.x - 10 + sh, u.y - 26, 12, 0, 7); g.fill(); if (sh) MGH.text(g, '~', u.x, u.y - 60, 24, '#bfe8a0', 'center', 'bold'); });
    MGH.drawBody(g, s, m.players[S.seek], '🏮', 'determined');
    g.fillStyle = 'rgba(0,0,10,0.25)'; g.fillRect(0, 0, 1280, 720);
    MGH.label(g, `Fireflies ${S.caught} / ${S.NEED}`, 1130, 70, 20, '#eaff9a');
  },
});

// ======================================================================== PIZZA RUSH
const TOPS = [{ n: 'tomato', ic: '🍅' }, { n: 'cheese', ic: '🧀' }, { n: 'mushroom', ic: '🍄' }, { n: 'pepper', ic: '🫑' }, { n: 'olive', ic: '🫒' }, { n: 'pineapple', ic: '🍍' }];
MG.def({
  id: 'pizza', name: 'Pizza Rush', type: 'Arcade', controls: 'Left/Right + button', dur: 50,
  rows: [['lr', 'Pick a topping'], ['a', 'Add it to the pizza']],
  how: 'The chef is swamped with orders! Each ticket shows three toppings. Slide LEFT/RIGHT along the topping bins and press A to add one to your pizza. Add all three and it is served automatically (+1). Add the wrong topping and the pizza is ruined — start again! Orders get trickier the more you serve.',
  wins: 'Most pizzas served.',
  init(m, S) { S.p = [0, 1, 2, 3].map(() => ({ sel: 0, order: null, on: [], served: 0, msg: '', msgT: 0, bump: 0 })); S.p.forEach(p => this.newOrder(p)); },
  newOrder(p) { p.order = R.shuffle([...Array(TOPS.length).keys()]).slice(0, 3); p.on = []; },
  update(m, S, dt) {
    S.p.forEach((p, i) => {
      p.msgT -= dt; p.bump -= dt;
      if (m.pressed(i, 'left')) p.sel = (p.sel + TOPS.length - 1) % TOPS.length;
      if (m.pressed(i, 'right')) p.sel = (p.sel + 1) % TOPS.length;
      if (m.pressed(i, 'a') && p.bump <= 0) {
        if (p.order.includes(p.sel) && !p.on.includes(p.sel)) { p.on.push(p.sel); if (!m.bot(i)) Sfx.tone(700 + p.on.length * 100, 0.06, 'triangle', 0.05); if (p.on.length === 3) { p.served++; p.msg = 'Served! +1'; p.msgT = 0.8; Sfx.coin(); this.newOrder(p); } }
        else { p.msg = 'Wrong topping! Start again'; p.msgT = 1; p.on = []; p.bump = 0.6; if (!m.bot(i)) Sfx.bad(); }
      }
    });
  },
  bot(m, S, i) {
    const p = S.p[i], v = m.vin[i]; v.left = v.right = v.a = false; if (p.bump > 0) return; p.bt = (p.bt || 0) - 1 / 60; if (p.bt > 0) return; p.bt = R.range(0.28, 0.6);
    const need = p.order.filter(t => !p.on.includes(t)); const t = need[0]; if (t === undefined) return;
    if (p.sel === t) { v.a = Math.random() < 0.94 ? true : (v.right = true, false); } else if ((t - p.sel + TOPS.length) % TOPS.length <= TOPS.length / 2) v.right = true; else v.left = true;
  },
  score(m, S) { return S.p.map(p => p.served); },
  fmt(s) { return `${s} pizza${s === 1 ? '' : 's'}`; },
  hud(m, S, i) { return `🍕 ${S.p[i].served}`; },
  draw(m, S, g) {
    g.fillStyle = MGH.grad(g, 0, 720, ['#fff0d8', '#f4d8b0']); g.fillRect(0, 0, 1280, 720);
    for (let k = 0; k < 16; k++) for (let r = 0; r < 3; r++) { g.fillStyle = (k + r) % 2 ? '#e8e0d0' : '#fffaf0'; g.fillRect(k * 80, 40 + r * 40, 80, 40); }
    Char.npc(g, 640, 120, 30, 'chef', { mood: 'cheer', t: m.t, look: { x: Math.sin(m.t), y: 0 } });
    S.p.forEach((p, i) => {
      const ox = i * 320, cx = ox + 160, pl = m.players[i];
      g.fillStyle = '#c88a5a'; MGH.rr(g, ox + 14, 220, 292, 470, 16); g.fill(); g.fillStyle = '#e8c8a0'; MGH.rr(g, ox + 22, 228, 276, 454, 12); g.fill();
      // ticket
      g.fillStyle = '#fff'; MGH.rr(g, cx - 90, 236, 180, 70, 6); g.fill(); g.strokeStyle = '#c8302a'; g.lineWidth = 2; g.strokeRect(cx - 84, 242, 168, 58);
      p.order.forEach((t, k) => { MGH.emoji(g, TOPS[t].ic, cx - 50 + k * 50, 272, 30); if (p.on.includes(t)) MGH.text(g, '✔', cx - 50 + k * 50 + 14, 296, 18, '#3a9a3a', 'center', 'bold'); });
      // pizza
      g.fillStyle = '#e8b060'; g.beginPath(); g.arc(cx, 420, 92, 0, 7); g.fill(); g.fillStyle = '#d84a2a'; g.beginPath(); g.arc(cx, 420, 78, 0, 7); g.fill(); g.fillStyle = '#ffe08a'; g.globalAlpha = 0.7; g.beginPath(); g.arc(cx, 420, 70, 0, 7); g.fill(); g.globalAlpha = 1;
      p.on.forEach((t, k) => { for (let q = 0; q < 5; q++) { const a = q * 1.25 + k * 0.6, r = 20 + (q % 2) * 28; MGH.emoji(g, TOPS[t].ic, cx + Math.cos(a) * r, 420 + Math.sin(a) * r, 22); } });
      // bins
      TOPS.forEach((t, k) => { const bx = ox + 30 + k * 44, sel = p.sel === k; g.fillStyle = sel ? '#ffe680' : '#fff'; MGH.rr(g, bx, 560, 40, 50, 8); g.fill(); if (sel) { g.strokeStyle = pl.color; g.lineWidth = 4; MGH.rr(g, bx - 2, 558, 44, 54, 9); g.stroke(); } MGH.emoji(g, t.ic, bx + 20, 586, 26); });
      Char.draw(g, ox + 30 + p.sel * 44 + 20, 650, 18, pl.el.id, pl.color, { headOnly: true, mood: p.bump > 0 ? 'shock' : p.msgT > 0 ? 'cheer' : 'determined', seed: i });
      if (p.msgT > 0) MGH.text(g, p.msg, cx, 340, 16, p.msg.includes('+') ? '#3a9a3a' : '#c8302a', 'center', 'bold');
      MGH.text(g, `${pl.name} 🍕${p.served}`, cx, 708, 18, pl.color, 'center', 'bold');
    });
  },
});
