'use strict';
// Moot minigames 11-20

// 11 ---------------------------------------------------------------- Rockfall Run
MG.def({
  id: 'rockfall', name: 'Rockfall Run', type: 'Survival', controls: 'Left/Right', dur: 45,
  how: 'Dodge boulders falling in a narrow canyon. They speed up over time.',
  wins: 'Last one alive.',
  init(m, S) {
    S.rocks = [];
    let t = 0.8;
    while (t < 46) { S.rocks.push({ t, x: R.range(30, 290), r: R.range(16, 26), v: 260 + t * 7 }); t += Math.max(0.24, 0.6 - t * 0.008); }
    S.x = [160, 160, 160, 160]; S.alive = [true, true, true, true]; S.outT = [0, 0, 0, 0];
  },
  y(r, t) { return 40 + (t - r.t) * r.v; },
  update(m, S, dt) {
    for (let i = 0; i < 4; i++) {
      if (!S.alive[i]) continue;
      S.x[i] = clamp(S.x[i] + m.axis(i).x * 400 * dt, 20, 300);
      for (const r of S.rocks) {
        const y = this.y(r, m.t);
        if (y > 610 && y < 690 && dist(S.x[i], 650, r.x, y) < r.r + 16) { S.alive[i] = false; S.outT[i] = m.t; if (!m.bot(i)) Sfx.boom(); break; }
      }
    }
    if (S.alive.filter(a => a).length <= 1) m.finish(this.score(m, S));
  },
  bot(m, S, i) {
    if (!S.alive[i]) return;
    if (!S.slack) S.slack = [0, 1, 2, 3].map(() => R.range(0.6, 1.4));
    const cur = S.x[i];
    let best = cur, bs = -1e9;
    for (let x = 20; x <= 300; x += 10) {
      let s = -Math.abs(x - cur) * 0.5;
      for (const r of S.rocks) {
        const y = this.y(r, m.t); if (y < 300 || y > 700) continue;
        const tArr = (650 - y) / r.v;
        // can't dodge in time if the path crosses this rock just before it arrives
        const lo = Math.min(x, cur), hi = Math.max(x, cur);
        const blocks = r.x + r.r + 18 > lo && r.x - r.r - 18 < hi;
        if (blocks && Math.abs(x - cur) / 400 > tArr) s -= 3000 * (1 - clamp(tArr, 0, 1));
        if (Math.abs(x - r.x) < r.r + 20) s -= 2000 * (1.2 - clamp(tArr, 0, 1));
      }
      if (s > bs) { bs = s; best = x; }
    }
    if (Math.random() < 0.05 * S.slack[i] * (m.t / 30)) best = cur + R.range(-40, 40);
    const d = best - cur; MGH.setLR(m, i, Math.abs(d) < 5 ? 0 : Math.sign(d));
  },
  score(m, S) { return S.alive.map((a, i) => a ? 1000 : S.outT[i]); },
  fmt(s) { return s >= 1000 ? 'Survived' : `out at ${s.toFixed(1)}s`; },
  hud(m, S, i) { return S.alive[i] ? 'alive' : 'out'; },
  draw(m, S, g) {
    MGH.bg(g, '#4a3626', '#1f140b'); MGH.lanes(g, m);
    for (let i = 0; i < 4; i++) {
      for (const r of S.rocks) { const y = this.y(r, m.t); if (y < 40 || y > 740) continue; g.fillStyle = '#8a7765'; g.beginPath(); g.arc(i * 320 + r.x, y, r.r, 0, 7); g.fill(); g.strokeStyle = '#3a2a1a'; g.lineWidth = 3; g.stroke(); }
      if (S.alive[i]) { g.fillStyle = m.players[i].color; g.beginPath(); g.arc(i * 320 + S.x[i], 650, 16, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke(); }
      else MGH.text(g, '💥 OUT', i * 320 + 160, 660, 28, '#fff', 'center', 'bold');
    }
  },
});

// 12 ---------------------------------------------------------------- Ankar's Chase
MG.def({
  id: 'chase', name: "Ankar's Chase", type: 'Survival', controls: 'Move', dur: 40,
  how: 'The Ankar hunts the nearest player. A touched player is frozen for 3 seconds.',
  wins: 'Fewest freezes (tie: most time free).',
  init(m, S) {
    S.b = [0, 1, 2, 3].map(i => Object.assign(MGH.body(160 + (i % 2) * 960, 160 + Math.floor(i / 2) * 420, 20), { frozen: 0, imm: 0, fr: 0, free: 0 }));
    S.a = Object.assign(MGH.body(640, 380, 30), {});
  },
  update(m, S, dt) {
    S.b.forEach((b, i) => {
      if (b.frozen > 0) { b.frozen -= dt; b.vx = b.vy = 0; if (b.frozen <= 0) b.imm = 1.2; return; }
      b.free += dt; b.imm -= dt;
      const a = m.axis(i); MGH.steer(b, a.x, a.y, dt, 2400, 300, 8); MGH.integrate(b, dt);
    });
    MGH.collide(S.b, 0.5);
    const targets = S.b.filter(b => b.frozen <= 0 && b.imm <= 0);
    const t = MGH.nearest(S.a, targets);
    const sp = 215 + m.t * 3.2;
    if (t) { const d = dist(t.x, t.y, S.a.x, S.a.y) || 1; S.a.x += (t.x - S.a.x) / d * sp * dt; S.a.y += (t.y - S.a.y) / d * sp * dt; }
    S.b.forEach((b, i) => {
      if (b.frozen <= 0 && b.imm <= 0 && dist(b.x, b.y, S.a.x, S.a.y) < b.r + S.a.r) { b.frozen = 3; b.fr++; if (!m.bot(i)) Sfx.bad(); }
    });
  },
  bot(m, S, i) {
    const b = S.b[i]; if (b.frozen > 0) return;
    let ax = b.x - S.a.x, ay = b.y - S.a.y; const d = Math.hypot(ax, ay) || 1; ax /= d; ay /= d;
    const wall = 120;
    if (b.x < wall) ax += 1.4; if (b.x > 1280 - wall) ax -= 1.4; if (b.y < 40 + wall) ay += 1.4; if (b.y > 720 - wall) ay -= 1.4;
    ax += -ay * 0.6; ay += ax * 0.3;
    const v = m.vin[i]; v.left = v.right = v.up = v.down = false; v.ax = clamp(ax, -1, 1); v.ay = clamp(ay, -1, 1);
    if (d > 400 && Math.random() < 0.5) { v.ax *= 0.3; v.ay *= 0.3; }
  },
  score(m, S) { return S.b.map(b => -b.fr * 100 + b.free); },
  fmt(s) { const fr = Math.ceil(-s / 100 - 0.0001); return `${Math.max(0, fr)} freezes`; },
  hud(m, S, i) { return `❄${S.b[i].fr}`; },
  draw(m, S, g) {
    MGH.bg(g, '#1a1030', '#0a0618');
    S.b.forEach((b, i) => { MGH.drawBody(g, b, m.players[i], b.frozen > 0 ? '🧊' : (b.imm > 0 ? '✨' : '')); });
    g.save(); g.translate(S.a.x, S.a.y); g.shadowColor = '#b46bff'; g.shadowBlur = 30;
    g.fillStyle = '#3a1a5c'; g.beginPath(); g.ellipse(0, 0, 36, 24, 0, 0, 7); g.fill();
    g.fillStyle = '#ff4d6d'; g.beginPath(); g.arc(0, 0, 12, 0, 7); g.fill(); g.restore();
  },
});

// 13 ---------------------------------------------------------------- Hot Coal
MG.def({
  id: 'coal', name: 'Hot Coal', type: 'Arena', controls: 'Move + pass',
  how: 'One player holds a burning coal. Touch someone and press to pass it on. After a hidden fuse of 10 to 20 seconds the holder is out. Three rounds.',
  wins: 'Last one in.',
  init(m, S) {
    S.b = [0, 1, 2, 3].map(i => Object.assign(MGH.body(260 + i * 250, 380, 22), { outT: 0 }));
    S.place = 0; this.newRound(m, S);
  },
  newRound(m, S) {
    const alive = S.b.map((b, i) => i).filter(i => S.b[i].alive);
    S.holder = R.pick(alive); S.fuse = R.range(10, 20); S.cool = 0; S.prev = -1; S.pause = 0;
  },
  update(m, S, dt) {
    if (S.pause > 0) { S.pause -= dt; if (S.pause <= 0) this.newRound(m, S); return; }
    S.fuse -= dt; S.cool -= dt;
    S.b.forEach((b, i) => {
      if (!b.alive) return;
      const a = m.axis(i); MGH.steer(b, a.x, a.y, dt, 2400, i === S.holder ? 330 : 300, 8); MGH.integrate(b, dt);
    });
    MGH.collide(S.b, 0.8);
    const h = S.b[S.holder];
    if (m.pressed(S.holder, 'a') && S.cool <= 0) {
      for (let j = 0; j < 4; j++) {
        const o = S.b[j];
        if (j === S.holder || !o.alive || (j === S.prev && S.cool > -0.8)) continue;
        if (dist(h.x, h.y, o.x, o.y) < h.r + o.r + 14) { S.prev = S.holder; S.holder = j; S.cool = 0.4; Sfx.tone(600, 0.08, 'square', 0.05); break; }
      }
    }
    if (S.fuse <= 0) {
      h.alive = false; h.outT = ++S.place; Sfx.boom();
      if (S.b.filter(b => b.alive).length <= 1) m.finish(this.score(m, S));
      else S.pause = 1.5;
    }
  },
  bot(m, S, i) {
    const b = S.b[i]; if (!b.alive) return;
    const v = m.vin[i]; v.a = false;
    if (i === S.holder) {
      const t = MGH.nearest(b, S.b.filter((o, j) => j !== S.prev || S.cool < -0.8));
      if (t) { MGH.aim(m, i, t.x, t.y, b); if (dist(b.x, b.y, t.x, t.y) < 60) v.a = !m.prev[i].a; }
    } else {
      const h = S.b[S.holder];
      let ax = b.x - h.x, ay = b.y - h.y; const d = Math.hypot(ax, ay) || 1; ax /= d; ay /= d;
      if (b.x < 120) ax += 1.5; if (b.x > 1160) ax -= 1.5; if (b.y < 160) ay += 1.5; if (b.y > 600) ay -= 1.5;
      v.ax = clamp(ax + -ay * 0.5, -1, 1); v.ay = clamp(ay + ax * 0.5, -1, 1);
      if (d > 350) { v.ax *= 0.2; v.ay *= 0.2; }
    }
  },
  score(m, S) { return S.b.map(b => b.alive ? 10 : b.outT); },
  fmt(s) { return s >= 10 ? 'Last one in' : `out #${s}`; },
  hud(m, S, i) { return !S.b[i].alive ? 'out' : (i === S.holder ? '🔥' : ''); },
  draw(m, S, g) {
    MGH.bg(g, '#2a1208', '#0e0503');
    S.b.forEach((b, i) => { if (b.alive) MGH.drawBody(g, b, m.players[i], i === S.holder ? '🔥' : ''); });
    if (S.pause > 0) MGH.text(g, '💥 BOOM!', 640, 380, 80, '#ffb347', 'center', 'bold');
  },
});

// 14 ---------------------------------------------------------------- Hill of Stars
MG.def({
  id: 'hill', name: 'Hill of Stars', type: 'Arena', controls: 'Move + push', dur: 45,
  how: 'A glowing zone drifts around the arena. Standing in it alone scores. If two stand in it, scoring pauses. Push to shove rivals out.',
  wins: 'Most seconds held.',
  init(m, S) { S.b = [0, 1, 2, 3].map(i => Object.assign(MGH.body(160 + i * 320, 650, 22), { cd: 0, held: 0, push: 0 })); S.z = { x: 640, y: 380, r: 95 }; S.ph = R.range(0, 6); },
  update(m, S, dt) {
    S.z.x = 640 + Math.sin(m.t * 0.37 + S.ph) * 430; S.z.y = 380 + Math.sin(m.t * 0.53 + S.ph * 2) * 220;
    S.b.forEach((b, i) => {
      const a = m.axis(i); MGH.steer(b, a.x, a.y, dt, 2200, 290, 6); b.cd -= dt; b.push -= dt;
      if (m.pressed(i, 'a') && b.cd <= 0) {
        b.cd = 1; b.push = 0.25;
        S.b.forEach(o => { if (o === b) return; const d = dist(o.x, o.y, b.x, b.y); if (d < 90) { o.vx += (o.x - b.x) / d * 700; o.vy += (o.y - b.y) / d * 700; } });
      }
      MGH.integrate(b, dt);
    });
    MGH.collide(S.b, 0.8);
    const inside = S.b.filter(b => dist(b.x, b.y, S.z.x, S.z.y) < S.z.r);
    if (inside.length === 1) inside[0].held += dt;
    S.contested = inside.length > 1;
  },
  bot(m, S, i) {
    const b = S.b[i]; const v = m.vin[i]; v.a = false;
    MGH.aim(m, i, S.z.x + Math.sin(m.t * 0.37 + S.ph + 0.3) * 40, S.z.y, b, 10);
    const n = MGH.nearest(b, S.b); if (n && dist(n.x, n.y, b.x, b.y) < 70 && b.cd <= 0 && Math.random() < 0.1) v.a = true;
  },
  score(m, S) { return S.b.map(b => b.held); },
  fmt(s) { return s.toFixed(1) + ' s'; },
  hud(m, S, i) { return S.b[i].held.toFixed(1) + 's'; },
  draw(m, S, g) {
    MGH.bg(g, '#101a33', '#060a14');
    g.fillStyle = S.contested ? 'rgba(255,120,120,0.35)' : 'rgba(255,230,128,0.35)'; g.beginPath(); g.arc(S.z.x, S.z.y, S.z.r, 0, 7); g.fill();
    g.strokeStyle = '#ffe680'; g.lineWidth = 3; g.stroke(); MGH.text(g, '⭐', S.z.x, S.z.y + 14, 40, '#fff');
    S.b.forEach((b, i) => {
      if (b.push > 0) { g.strokeStyle = m.players[i].color; g.lineWidth = 3; g.beginPath(); g.arc(b.x, b.y, 90 * (1 - b.push * 3), 0, 7); g.stroke(); }
      MGH.drawBody(g, b, m.players[i]);
    });
  },
});

// 15 ---------------------------------------------------------------- Fireball Dodge
MG.def({
  id: 'fireball', name: 'Fireball Dodge', type: 'Arena', controls: 'Move + fire', dur: 45,
  how: 'Three hearts each. Fire a ball in the direction you face. It bounces once. A hit costs a heart.',
  wins: 'Last one alive.',
  init(m, S) {
    S.b = [0, 1, 2, 3].map(i => Object.assign(MGH.body(160 + (i % 2) * 960, 180 + Math.floor(i / 2) * 400, 20), { hp: 3, cd: 0, inv: 0, outT: 0 }));
    S.balls = [];
  },
  update(m, S, dt) {
    S.b.forEach((b, i) => {
      if (!b.alive) return;
      const a = m.axis(i); MGH.steer(b, a.x, a.y, dt, 2400, 280, 8); MGH.integrate(b, dt);
      b.cd -= dt; b.inv -= dt;
      if (m.pressed(i, 'a') && b.cd <= 0) { b.cd = 0.8; S.balls.push({ x: b.x + b.face.x * 30, y: b.y + b.face.y * 30, vx: b.face.x * 520, vy: b.face.y * 520, o: i, bounce: 1 }); Sfx.tone(420, 0.06, 'square', 0.04); }
    });
    MGH.collide(S.b, 0.5);
    for (const f of S.balls) {
      f.x += f.vx * dt; f.y += f.vy * dt;
      let hitWall = false;
      if (f.x < 10 || f.x > 1270) { f.vx *= -1; hitWall = true; f.x = clamp(f.x, 10, 1270); }
      if (f.y < 50 || f.y > 710) { f.vy *= -1; hitWall = true; f.y = clamp(f.y, 50, 710); }
      if (hitWall) { if (f.bounce > 0) f.bounce--; else f.dead = true; }
      S.b.forEach((b, i) => {
        if (f.dead || !b.alive || b.inv > 0 || (i === f.o && f.bounce > 0)) return;
        if (dist(f.x, f.y, b.x, b.y) < b.r + 10) { f.dead = true; b.hp--; b.inv = 0.8; Sfx.bad(); if (b.hp <= 0) { b.alive = false; b.outT = m.t; } }
      });
    }
    S.balls = S.balls.filter(f => !f.dead);
    if (S.b.filter(b => b.alive).length <= 1) m.finish(this.score(m, S));
  },
  bot(m, S, i) {
    const b = S.b[i]; if (!b.alive) return;
    const v = m.vin[i]; v.a = false;
    const t = MGH.nearest(b, S.b);
    let ax = 0, ay = 0;
    for (const f of S.balls) {
      if (f.o === i && f.bounce > 0) continue;
      const dx = b.x - f.x, dy = b.y - f.y, d = Math.hypot(dx, dy);
      if (d < 220 && (dx * f.vx + dy * f.vy) > 0) { const l = Math.hypot(f.vx, f.vy); ax += -f.vy / l * 1.5; ay += f.vx / l * 1.5; }
    }
    if (t) {
      const dx = t.x - b.x, dy = t.y - b.y, d = Math.hypot(dx, dy) || 1;
      if (d > 300) { ax += dx / d; ay += dy / d; } else if (d < 180) { ax -= dx / d; ay -= dy / d; }
      if (Math.abs(ax) + Math.abs(ay) < 0.3) { b.face = { x: dx / d, y: dy / d }; if (b.cd <= 0 && Math.random() < 0.15) v.a = true; }
      else if (b.cd <= 0 && Math.random() < 0.05) { b.face = { x: dx / d, y: dy / d }; v.a = true; }
    }
    if (b.x < 100) ax += 1; if (b.x > 1180) ax -= 1; if (b.y < 140) ay += 1; if (b.y > 620) ay -= 1;
    v.left = v.right = v.up = v.down = false; v.ax = clamp(ax, -1, 1); v.ay = clamp(ay, -1, 1);
    if (v.a && t) { const dx = t.x - b.x, dy = t.y - b.y, d = Math.hypot(dx, dy) || 1; v.ax = dx / d * 0.15; v.ay = dy / d * 0.15; }
  },
  score(m, S) { return S.b.map(b => b.alive ? 100 + b.hp : b.outT); },
  fmt(s) { return s >= 100 ? `alive, ${Math.round(s - 100)}♥` : `out at ${s.toFixed(1)}s`; },
  hud(m, S, i) { return S.b[i].alive ? '♥'.repeat(S.b[i].hp) : 'out'; },
  draw(m, S, g) {
    MGH.bg(g, '#2b0d0d', '#0d0303');
    S.b.forEach((b, i) => { if (b.alive && !(b.inv > 0 && Math.sin(m.t * 40) > 0)) MGH.drawBody(g, b, m.players[i], '♥'.repeat(b.hp)); });
    for (const f of S.balls) { g.fillStyle = m.players[f.o].color; g.shadowColor = '#ff7a3d'; g.shadowBlur = 16; g.beginPath(); g.arc(f.x, f.y, 10, 0, 7); g.fill(); g.shadowBlur = 0; }
  },
});

// 16 ---------------------------------------------------------------- Cloud Hop
MG.def({
  id: 'cloud', name: 'Cloud Hop', type: 'Race', controls: '1 button', mouseA: true,
  how: 'Auto-run across floating platforms. Press to jump. A fall sends you back to your last platform.',
  wins: 'First to the finish.',
  init(m, S) {
    S.plats = []; let x = 0;
    S.plats.push({ x: 0, w: 400, y: 0 });
    x = 400;
    while (x < 5200) { const gap = R.range(70, 150), w = R.range(110, 280); x += gap; S.plats.push({ x, w, y: R.int(-1, 1) * 25 }); x += w; }
    S.end = x;
    S.p = [0, 1, 2, 3].map(() => ({ x: 40, y: 0, vy: 0, ground: true, last: 0, fin: 0, resp: 0 }));
  },
  platAt(S, x, y) { return S.plats.find(p => x >= p.x && x <= p.x + p.w); },
  update(m, S, dt) {
    for (let i = 0; i < 4; i++) {
      const p = S.p[i]; if (p.fin) continue;
      if (p.resp > 0) { p.resp -= dt; continue; }
      p.x += 270 * dt;
      if (m.pressed(i, 'a') && p.ground) { p.vy = -560; p.ground = false; if (!m.bot(i)) Sfx.tone(500, 0.08, 'triangle', 0.05); }
      const py = p.y; p.vy += 1500 * dt; p.y += p.vy * dt;
      const pl = this.platAt(S, p.x);
      p.ground = false;
      if (pl && p.vy >= 0 && py <= pl.y + 1 && p.y >= pl.y) { p.y = pl.y; p.vy = 0; p.ground = true; p.last = S.plats.indexOf(pl); }
      if (p.y > 120) { const lp = S.plats[p.last]; p.x = lp.x + 10; p.y = lp.y; p.vy = 0; p.resp = 0.5; }
      if (p.x >= S.end) p.fin = m.t;
    }
    if (S.p.some(p => p.fin)) m.finish(this.score(m, S));
  },
  bot(m, S, i) {
    const p = S.p[i], v = m.vin[i]; v.a = false;
    if (!p.ground) return;
    const pl = this.platAt(S, p.x); if (!pl) return;
    const toEdge = pl.x + pl.w - p.x;
    if (toEdge < R.range(8, 40) || (Math.random() < 0.002)) v.a = true;
  },
  score(m, S) { return S.p.map(p => p.fin ? 1e5 - p.fin : p.x); },
  fmt(s) { return s >= 1e4 ? 'Finished!' : Math.round(s) + ' m'; },
  hud(m, S, i) { return Math.round(S.p[i].x / S.end * 100) + '%'; },
  draw(m, S, g) {
    MGH.bg(g, '#7ec8ff', '#d9f0ff');
    for (let i = 0; i < 4; i++) {
      const top = 40 + i * 170, base = top + 115, p = S.p[i], cam = p.x - 250;
      g.save(); g.beginPath(); g.rect(0, top, 1280, 170); g.clip();
      g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(0, top, 1280, 170);
      for (const pl of S.plats) { const x = pl.x - cam; if (x > 1280 || x + pl.w < 0) continue; g.fillStyle = '#fff'; MGH.rr(g, x, base + pl.y, pl.w, 16, 8); g.fill(); }
      const fx = S.end - cam; if (fx < 1280) { g.fillStyle = '#ffd34d'; g.fillRect(fx, top, 8, 170); }
      g.globalAlpha = p.resp > 0 ? 0.4 : 1;
      g.fillStyle = m.players[i].color; MGH.rr(g, 236, base + p.y - 30, 28, 30, 8); g.fill(); g.strokeStyle = '#123'; g.lineWidth = 2; g.stroke();
      g.globalAlpha = 1;
      MGH.text(g, m.players[i].name, 12, top + 24, 18, '#123', 'left', 'bold');
      g.restore();
      g.fillStyle = '#123'; g.fillRect(0, top + 168, 1280, 2);
    }
  },
});

// 17 ---------------------------------------------------------------- Current Surf
MG.def({
  id: 'surf', name: 'Current Surf', type: 'Race', controls: 'Left/Right', dur: 40,
  how: 'Ride a river current. Steer through rings for speed boosts. Rocks slow you.',
  wins: 'Furthest distance.',
  init(m, S) {
    S.obj = []; for (let d = 600; d < 20000; d += R.range(160, 300)) S.obj.push({ d, x: R.range(40, 280), ring: Math.random() < 0.45 });
    S.p = [0, 1, 2, 3].map(() => ({ x: 160, d: 0, boost: 0, slow: 0, hit: new Set() }));
  },
  update(m, S, dt) {
    for (let i = 0; i < 4; i++) {
      const p = S.p[i];
      p.x = clamp(p.x + m.axis(i).x * 330 * dt, 20, 300);
      p.boost -= dt; p.slow -= dt;
      const v = p.slow > 0 ? 130 : 300 + (p.boost > 0 ? 220 : 0);
      p.d += v * dt;
      S.obj.forEach((o, k) => {
        if (p.hit.has(k)) return;
        if (Math.abs(o.d - p.d) < 18 && Math.abs(o.x - p.x) < (o.ring ? 34 : 30)) { p.hit.add(k); if (o.ring) { p.boost = 1; if (!m.bot(i)) Sfx.coin(); } else { p.slow = 1; if (!m.bot(i)) Sfx.bad(); } }
      });
    }
  },
  bot(m, S, i) {
    const p = S.p[i];
    const next = S.obj.filter((o, k) => o.d > p.d + 10 && o.d < p.d + 500 && !p.hit.has(k));
    let tx = 160;
    const ring = next.find(o => o.ring); if (ring) tx = ring.x;
    const rock = next.find(o => !o.ring && o.d < (ring ? ring.d : 1e9) && Math.abs(o.x - p.x) < 50);
    if (rock) tx = rock.x > 160 ? rock.x - 90 : rock.x + 90;
    if (Math.random() < 0.15) tx += R.range(-60, 60);
    const d = tx - p.x; MGH.setLR(m, i, Math.abs(d) < 8 ? 0 : Math.sign(d));
  },
  score(m, S) { return S.p.map(p => p.d); },
  fmt(s) { return Math.round(s / 10) + ' m'; },
  hud(m, S, i) { return Math.round(S.p[i].d / 10) + 'm'; },
  draw(m, S, g) {
    MGH.bg(g, '#1f6fb5', '#0a3a6a'); MGH.lanes(g, m);
    for (let i = 0; i < 4; i++) {
      const p = S.p[i], ox = i * 320;
      for (let k = 0; k < 14; k++) { const y = ((k * 60 + p.d * 0.9) % 700) + 40; g.strokeStyle = 'rgba(255,255,255,0.12)'; g.beginPath(); g.moveTo(ox + 30 + (k * 53) % 260, y); g.lineTo(ox + 50 + (k * 53) % 260, y + 14); g.stroke(); }
      S.obj.forEach((o, k) => {
        const y = 580 - (o.d - p.d); if (y < 40 || y > 720) return;
        if (o.ring) { g.strokeStyle = p.hit.has(k) ? 'rgba(255,230,128,0.3)' : '#ffe680'; g.lineWidth = 5; g.beginPath(); g.ellipse(ox + o.x, y, 30, 12, 0, 0, 7); g.stroke(); }
        else { g.fillStyle = '#5a5248'; g.beginPath(); g.arc(ox + o.x, y, 22, 0, 7); g.fill(); }
      });
      g.fillStyle = m.players[i].color; g.beginPath(); g.ellipse(ox + p.x, 580, 14, 28, 0, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke();
      if (p.boost > 0) MGH.text(g, '💨', ox + p.x, 640, 24, '#fff');
    }
  },
});

// 18 ---------------------------------------------------------------- Burrow Dash
MG.def({
  id: 'burrow', name: 'Burrow Dash', type: 'Race', controls: 'Left/Right + mash',
  how: 'Tunnel down by tapping to dig. Steer around boulders, which stop you for a second.',
  wins: 'First to the bottom.',
  init(m, S) {
    S.goal = 2600;
    S.rocks = []; for (let d = 250; d < S.goal - 50; d += R.range(90, 170)) S.rocks.push({ d, x: R.range(40, 280) });
    S.p = [0, 1, 2, 3].map(() => ({ x: 160, d: 0, v: 0, stun: 0, fin: 0, hit: new Set(), tap: 0 }));
  },
  update(m, S, dt) {
    for (let i = 0; i < 4; i++) {
      const p = S.p[i]; if (p.fin) continue;
      p.x = clamp(p.x + m.axis(i).x * 260 * dt, 20, 300);
      if (p.stun > 0) { p.stun -= dt; p.v = 0; continue; }
      if (m.pressed(i, 'a')) p.v = Math.min(420, p.v + 55);
      p.v = Math.max(0, p.v - 240 * dt);
      p.d += p.v * dt;
      S.rocks.forEach((r, k) => { if (!p.hit.has(k) && Math.abs(r.d - p.d) < 20 && Math.abs(r.x - p.x) < 40) { p.hit.add(k); p.stun = 1; if (!m.bot(i)) Sfx.bad(); } });
      if (p.d >= S.goal) p.fin = m.t;
    }
    if (S.p.some(p => p.fin) || m.t > 60) m.finish(this.score(m, S));
  },
  bot(m, S, i, dt) {
    const p = S.p[i], v = m.vin[i];
    p.tap -= dt; v.a = false;
    if (p.tap <= 0) { v.a = true; p.tap = R.range(0.11, 0.17); }
    const r = S.rocks.find((r, k) => !p.hit.has(k) && r.d > p.d && r.d < p.d + 140);
    let tx = p.x;
    if (r && Math.abs(r.x - p.x) < 60) tx = r.x > 160 ? r.x - 80 : r.x + 80;
    const d = tx - p.x; MGH.setLR(m, i, Math.abs(d) < 6 ? 0 : Math.sign(d));
  },
  score(m, S) { return S.p.map(p => p.fin ? 1e5 - p.fin : p.d); },
  fmt(s) { return s >= 1e4 ? 'Reached the bottom!' : Math.round(s / 26) + '%'; },
  hud(m, S, i) { return Math.min(100, Math.round(S.p[i].d / S.goal * 100)) + '%'; },
  draw(m, S, g) {
    MGH.bg(g, '#5a3d22', '#2a1a0c'); MGH.lanes(g, m);
    for (let i = 0; i < 4; i++) {
      const p = S.p[i], ox = i * 320;
      const by = 200 + (S.goal - p.d); if (by < 720) { g.fillStyle = '#ffd34d'; g.fillRect(ox + 4, by, 312, 10); }
      S.rocks.forEach((r, k) => { const y = 200 + (r.d - p.d); if (y < 40 || y > 720) return; g.fillStyle = p.hit.has(k) ? '#555' : '#8a8a8a'; g.beginPath(); g.arc(ox + r.x, y, 26, 0, 7); g.fill(); });
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(ox + p.x - 16, 40, 32, 160);
      g.fillStyle = m.players[i].color; g.beginPath(); g.arc(ox + p.x, 200, 18, 0, 7); g.fill();
      MGH.text(g, p.stun > 0 ? '💫' : '⛏️', ox + p.x, 236, 22, '#fff');
    }
  },
});

// 19 ---------------------------------------------------------------- Unicorn Sprint
MG.def({
  id: 'unicorn', name: 'Unicorn Sprint', type: 'Race', controls: '1 button', mouseA: true,
  how: 'Mash to gallop. The heat meter fills as you mash, and in the red zone you stumble for 1 second. Pace yourself.',
  wins: 'First across the line.',
  init(m, S) { S.goal = 2400; S.p = [0, 1, 2, 3].map(() => ({ d: 0, v: 0, heat: 0, stum: 0, fin: 0, tap: 0 })); },
  update(m, S, dt) {
    for (let i = 0; i < 4; i++) {
      const p = S.p[i]; if (p.fin) continue;
      p.heat = Math.max(0, p.heat - 0.32 * dt);
      if (p.stum > 0) { p.stum -= dt; p.v *= 0.9; }
      else if (m.pressed(i, 'a')) { p.v = Math.min(480, p.v + 45); p.heat += 0.075; if (p.heat >= 1) { p.stum = 1; p.heat = 0.55; if (!m.bot(i)) Sfx.bad(); } }
      p.v = Math.max(0, p.v - 160 * dt);
      p.d += p.v * dt;
      if (p.d >= S.goal) p.fin = m.t;
    }
    if (S.p.some(p => p.fin) || m.t > 60) m.finish(this.score(m, S));
  },
  bot(m, S, i, dt) {
    const p = S.p[i], v = m.vin[i]; v.a = false; p.tap -= dt;
    const limit = 0.78 + (i % 2) * 0.08;
    if (p.tap <= 0 && p.heat < limit) { v.a = true; p.tap = R.range(0.1, 0.18); }
  },
  score(m, S) { return S.p.map(p => p.fin ? 1e5 - p.fin : p.d); },
  fmt(s) { return s >= 1e4 ? 'Crossed the line!' : Math.round(s / 24) + '%'; },
  hud(m, S, i) { return Math.min(100, Math.round(S.p[i].d / S.goal * 100)) + '%'; },
  draw(m, S, g) {
    MGH.bg(g, '#2b4d1f', '#13240c');
    for (let i = 0; i < 4; i++) {
      const y = 140 + i * 145, p = S.p[i], x = 80 + p.d / S.goal * 1080;
      g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(60, y - 40, 1140, 80);
      g.fillStyle = '#fff'; g.fillRect(1160, y - 44, 6, 88);
      MGH.text(g, '🦄', x, y + 16, 50, '#fff');
      g.fillStyle = m.players[i].color; g.fillRect(x - 30, y + 26, 60, 6);
      g.fillStyle = '#222'; g.fillRect(60, y + 44, 200, 10);
      g.fillStyle = p.heat > 0.8 ? '#ff4d4d' : '#ffb347'; g.fillRect(60, y + 44, 200 * Math.min(1, p.heat), 10);
      g.fillStyle = 'rgba(255,0,0,0.4)'; g.fillRect(220, y + 44, 40, 10);
      MGH.text(g, m.players[i].name + (p.stum > 0 ? ' — stumbled!' : ''), 280, y + 54, 16, m.players[i].color, 'left', 'bold');
    }
  },
});

// 20 ---------------------------------------------------------------- Rune Echo
MG.def({
  id: 'rune', name: 'Rune Echo', type: 'Memory', controls: 'Pick (4 directions)',
  how: 'Four elemental runes light up in a sequence. Repeat it. Everyone plays the same sequence at once and it grows each round. A mistake is out.',
  wins: 'Longest sequence survived.',
  init(m, S) { S.seq = [R.int(0, 3), R.int(0, 3)]; S.alive = [true, true, true, true]; S.best = [0, 0, 0, 0]; this.show(S); },
  show(S) { S.seq.push(R.int(0, 3)); S.phase = 'show'; S.t = 0; S.prog = [0, 0, 0, 0]; S.done = [false, false, false, false]; S.flash = [-1, -1, -1, -1]; S.botT = [0, 0, 0, 0]; },
  dirs: ['up', 'right', 'down', 'left'],
  update(m, S, dt) {
    S.t += dt;
    if (S.phase === 'show') {
      const k = Math.floor(S.t / 0.6);
      if (k >= S.seq.length) { S.phase = 'input'; S.t = 0; }
      else if (Math.floor((S.t - dt) / 0.6) !== k || S.t === dt) Sfx.tone([523, 659, 784, 392][S.seq[k]], 0.25, 'triangle', 0.06);
      return;
    }
    if (S.phase === 'input') {
      for (let i = 0; i < 4; i++) {
        if (!S.alive[i] || S.done[i]) continue;
        for (let d = 0; d < 4; d++) if (m.pressed(i, this.dirs[d])) {
          S.flash[i] = d;
          if (S.seq[S.prog[i]] === d) { S.prog[i]++; if (S.prog[i] >= S.seq.length) { S.done[i] = true; S.best[i] = S.seq.length; } }
          else { S.alive[i] = false; if (!m.bot(i)) Sfx.bad(); }
          break;
        }
      }
      const timeUp = S.t > 2.5 + S.seq.length * 0.9;
      if (timeUp) for (let i = 0; i < 4; i++) if (S.alive[i] && !S.done[i]) S.alive[i] = false;
      if (S.alive.every((a, i) => !a || S.done[i])) {
        const alive = S.alive.filter(a => a).length;
        if (alive <= 1) m.finish(this.score(m, S));
        else { S.phase = 'gap'; S.t = 0; }
      }
      return;
    }
    if (S.phase === 'gap' && S.t > 0.8) this.show(S);
  },
  bot(m, S, i, dt) {
    const v = m.vin[i]; v.up = v.down = v.left = v.right = false;
    if (S.phase !== 'input' || !S.alive[i] || S.done[i]) return;
    S.botT[i] -= dt; if (S.botT[i] > 0) return;
    S.botT[i] = R.range(0.25, 0.45);
    let d = S.seq[S.prog[i]];
    if (Math.random() < 0.015 + S.seq.length * 0.012) d = (d + R.int(1, 3)) % 4;
    v[this.dirs[d]] = true;
  },
  score(m, S) { return S.best.map((b, i) => b + (S.alive[i] ? 0.5 : 0)); },
  fmt(s) { return `sequence ${Math.floor(s)}`; },
  hud(m, S, i) { return S.alive[i] ? `${S.prog[i]}/${S.seq.length}` : `out (${S.best[i]})`; },
  draw(m, S, g) {
    MGH.bg(g, '#151530', '#07070f');
    const runes = [['🌪️', '#8fe0ff'], ['🔥', '#ff6a3d'], ['⛰️', '#7ccf4a'], ['🌊', '#4f8dff']];
    const pos = [[640, 170], [790, 320], [640, 470], [490, 320]];
    const k = S.phase === 'show' ? Math.floor(S.t / 0.6) : -1;
    const lit = k >= 0 && k < S.seq.length && (S.t % 0.6) < 0.45 ? S.seq[k] : -1;
    for (let d = 0; d < 4; d++) {
      g.fillStyle = lit === d ? runes[d][1] : 'rgba(255,255,255,0.08)'; g.beginPath(); g.arc(pos[d][0], pos[d][1], 70, 0, 7); g.fill();
      g.strokeStyle = runes[d][1]; g.lineWidth = 4; g.stroke();
      MGH.text(g, runes[d][0], pos[d][0], pos[d][1] + 20, 56, '#fff');
    }
    MGH.text(g, S.phase === 'show' ? `Watch… (${S.seq.length})` : S.phase === 'input' ? 'Repeat it!' : 'Well done', 640, 600, 30, '#fff', 'center', 'bold');
    for (let i = 0; i < 4; i++) {
      const x = 160 + i * 320, p = m.players[i];
      MGH.text(g, `${p.name}: ${S.alive[i] ? (S.done[i] ? '✔' : '…') : '✖ out'}`, x, 680, 22, p.color, 'center', 'bold');
    }
  },
});
