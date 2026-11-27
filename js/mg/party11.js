'use strict';
// Party batch 7: Bee Line, Cannon Fort (1v3), Relay Race (2v2), Kite Flyer, Cookie Copy, Top Battle, Fruit Tree (2v2), Plank Bridge

// ======================================================================== BEE LINE (collect pollen, bring it home)
MG.def({
  id: 'beeline', name: 'Bee Line', type: 'Coins', controls: 'Move + button', dur: 50,
  rows: [['stick', 'Fly'], ['a', 'Buzz-bump a rival bee']],
  how: 'You are a busy little bee! Fly over glowing flowers to gather pollen (you can carry 5), then fly back to YOUR hive in your corner to bank it. Press A to buzz-bump a rival carrying pollen — they drop some and you can grab it!',
  wins: 'Most pollen banked.',
  HIVE: [[90, 150], [1190, 150], [90, 640], [1190, 640]],
  init(m, S) {
    S.b = [0, 1, 2, 3].map(i => Object.assign(MGH.body(this.HIVE[i][0] + (i % 2 ? -80 : 80), this.HIVE[i][1], 20), { carry: 0, bank: 0, cd: 0, dash: 0, stun: 0 }));
    S.fl = []; for (let k = 0; k < 9; k++) S.fl.push({ x: R.range(260, 1020), y: R.range(140, 640), p: R.range(0, 3), col: R.pick(['#ff8ab8', '#ffe680', '#c87aff', '#ff9a4a']) });
    S.loose = [];
  },
  update(m, S, dt) {
    S.fl.forEach(f => { f.p = Math.min(3, f.p + dt * 0.35); });
    S.b.forEach((b, i) => {
      b.cd -= dt; b.dash -= dt; b.stun -= dt;
      const a = m.axis(i);
      if (b.stun > 0) { b.vx *= 0.9; b.vy *= 0.9; } else MGH.steer(b, a.x, a.y, dt, b.dash > 0 ? 4000 : 1700, b.dash > 0 ? 560 : 300 - b.carry * 18, 5);
      if (m.pressed(i, 'a') && b.cd <= 0 && b.stun <= 0) { b.dash = 0.2; b.cd = 1.3; Sfx.tone(200, 0.15, 'sawtooth', 0.04, 100); }
      MGH.integrate(b, dt, 20, 70, 1260, 710);
      S.fl.forEach(f => { if (f.p >= 1 && b.carry < 5 && dist(f.x, f.y, b.x, b.y) < 40) { f.p -= 1; b.carry++; Sfx.tone(1200, 0.04, 'sine', 0.03); } });
      S.loose.forEach(l => { if (!l.got && b.carry < 5 && dist(l.x, l.y, b.x, b.y) < 30 && l.t > 0.3) { l.got = true; b.carry++; Sfx.pop(); } });
      const [hx, hy] = this.HIVE[i]; if (b.carry && dist(hx, hy, b.x, b.y) < 60) { b.bank += b.carry; b.carry = 0; Sfx.coin(); MGH.burst(hx, hy, ['#ffe680', '#ffb13d'], 12, { speed: 160 }); }
    });
    // buzz-bumps knock pollen loose
    for (const a of S.b) if (a.dash > 0) for (const b of S.b) if (b !== a && b.stun <= 0 && dist(a.x, a.y, b.x, b.y) < a.r + b.r + 6) { b.stun = 0.7; const n = Math.min(b.carry, 2); b.carry -= n; for (let k = 0; k < n; k++) S.loose.push({ x: b.x + R.range(-30, 30), y: b.y + R.range(-30, 30), t: 0 }); b.vx = (b.x - a.x) * 8; b.vy = (b.y - a.y) * 8; Sfx.punch(); }
    S.loose.forEach(l => { l.t += dt; }); S.loose = S.loose.filter(l => !l.got && l.t < 8);
    MGH.collide(S.b, 0.6);
  },
  bot(m, S, i) {
    const b = S.b[i], v = m.vin[i]; v.a = false; const [hx, hy] = this.HIVE[i];
    let gx, gy;
    if (b.carry >= 5 || (b.carry >= 3 && dist(hx, hy, b.x, b.y) < 300)) { gx = hx; gy = hy; }
    else {
      const ops = S.fl.filter(f => f.p >= 1).map(f => ({ x: f.x, y: f.y, s: dist(f.x, f.y, b.x, b.y) - f.p * 40 })).concat(S.loose.map(l => ({ x: l.x, y: l.y, s: dist(l.x, l.y, b.x, b.y) - 80 })));
      const o = ops.sort((p, q) => p.s - q.s)[0]; if (o) { gx = o.x; gy = o.y; } else { gx = hx; gy = hy; }
      const prey = S.b.find((o, j) => j !== i && o.carry >= 2 && dist(o.x, o.y, b.x, b.y) < 120);
      if (prey && b.cd <= 0 && Math.random() < 0.1) { gx = prey.x; gy = prey.y; v.a = true; }
    }
    MGH.aim(m, i, gx, gy, b, 8);
  },
  score(m, S) { return S.b.map(b => b.bank); },
  fmt(s) { return `${s} pollen`; },
  hud(m, S, i) { return `🍯 ${S.b[i].bank}` + (S.b[i].carry ? ` (+${S.b[i].carry})` : ''); },
  draw(m, S, g) {
    MGH.scene(g, 'meadow', m.t);
    g.fillStyle = 'rgba(140,220,100,0.35)'; g.fillRect(0, 60, 1280, 660);
    this.HIVE.forEach(([x, y], i) => {
      const p = m.players[i]; MGH.shadow(g, x, y + 46, 46, 0.3);
      for (let k = 0; k < 4; k++) { g.fillStyle = k % 2 ? '#e8a830' : '#f4c040'; g.beginPath(); g.ellipse(x, y - 30 + k * 20, 44 - Math.abs(k - 1.5) * 8, 14, 0, 0, 7); g.fill(); }
      g.fillStyle = '#5a3a10'; g.beginPath(); g.arc(x, y + 10, 10, 0, 7); g.fill();
      g.fillStyle = p.color; MGH.rr(g, x - 34, y - 72, 68, 24, 8); g.fill(); MGH.text(g, `${S.b[i].bank}`, x, y - 54, 18, '#fff', 'center', 'bold');
    });
    S.fl.forEach(f => {
      g.strokeStyle = '#3a8a2a'; g.lineWidth = 4; g.beginPath(); g.moveTo(f.x, f.y + 10); g.lineTo(f.x, f.y + 40); g.stroke();
      if (f.p >= 1) MGH.glow(g, f.x, f.y, 36, 'rgba(255,240,140,0.6)');
      for (let k = 0; k < 6; k++) { g.fillStyle = f.col; g.beginPath(); g.arc(f.x + Math.cos(k * 1.05) * 12, f.y + Math.sin(k * 1.05) * 12, 9, 0, 7); g.fill(); }
      g.fillStyle = '#ffcf4a'; g.beginPath(); g.arc(f.x, f.y, 8, 0, 7); g.fill();
      for (let k = 0; k < Math.floor(f.p); k++) { g.fillStyle = '#fff6a0'; g.beginPath(); g.arc(f.x - 8 + k * 8, f.y - 24, 3, 0, 7); g.fill(); }
    });
    S.loose.forEach(l => { g.fillStyle = '#ffe680'; g.beginPath(); g.arc(l.x, l.y, 6, 0, 7); g.fill(); });
    S.b.forEach((b, i) => {
      const p = m.players[i], fl = Math.sin(m.t * 50 + i);
      MGH.shadow(g, b.x, b.y + 34, 16, 0.2);
      g.fillStyle = 'rgba(230,245,255,0.7)'; g.beginPath(); g.ellipse(b.x - 10, b.y - 22, 14, 7 + fl * 3, -0.6, 0, 7); g.ellipse(b.x + 10, b.y - 22, 14, 7 + fl * 3, 0.6, 0, 7); g.fill();
      g.fillStyle = '#ffd34d'; g.beginPath(); g.ellipse(b.x, b.y + 8, 22, 14, 0, 0, 7); g.fill(); g.fillStyle = '#3a2a10'; g.fillRect(b.x - 8, b.y - 4, 5, 24); g.fillRect(b.x + 4, b.y - 4, 5, 24);
      Char.draw(g, b.x, b.y - 10, 16, p.el.id, p.color, { mood: MGH.persona(b.stun > 0 ? 'dizzy' : b.carry >= 5 ? 'effort' : 'happy', p.el.id), seed: i * 1.7, look: b.face, headOnly: true });
      for (let k = 0; k < b.carry; k++) { g.fillStyle = '#ffe680'; g.beginPath(); g.arc(b.x - 16 + k * 8, b.y + 26, 4, 0, 7); g.fill(); }
    });
  },
});

// ======================================================================== CANNON FORT (1 vs 3)
MG.def({
  id: 'cannonfort', name: 'Cannon Fort', type: 'Arena', mode: '1v3', controls: 'Move + button', dur: 45,
  rows: [['stick', 'Runners: move · Gunner: aim'], ['a', 'Runners: ring the bell · Gunner: fire']],
  how: 'One player mans the cannons on top of the fort; three runners race across the field to ring the bell at the gate. GUNNER: move the target marker and press A to fire — the ball lands after a moment where the marker was. RUNNERS: dodge the shadows of falling cannonballs. A hit sends you back to the start line. To ring the bell, stand at the gate and HOLD A until the rope is pulled — four rings between you wins!',
  wins: 'Runners: 4 rings. Gunner: survive the clock.',
  init(m, S) {
    S.gun = m.players.findIndex((p, i) => m.teamOf(i) === 0); S.mk = { x: 640, y: 400 }; S.cd = 0; S.balls = []; S.rings = 0; S.win = -1;
    S.b = [0, 1, 2, 3].map(i => Object.assign(MGH.body(320 + i * 160, 680, 22), { stun: 0, cd: 0 }));
  },
  update(m, S, dt) {
    const G = S.gun, a = m.axis(G);
    S.mk.x = clamp(S.mk.x + a.x * 560 * dt, 80, 1200); S.mk.y = clamp(S.mk.y + a.y * 560 * dt, 220, 660);
    S.cd -= dt; if (m.pressed(G, 'a') && S.cd <= 0) { S.cd = 0.55; S.balls.push({ x: S.mk.x, y: S.mk.y, t: 0, T: 1.1 }); Sfx.boom(); }
    S.balls.forEach(b => { b.t += dt; if (b.t >= b.T && !b.hit) { b.hit = true; MGH.burst(b.x, b.y, ['#8a7a6a', '#ffb13d', '#fff'], 18, { speed: 260 }); Sfx.thud(); S.b.forEach((r, i) => { if (i !== G && r.stun <= 0 && dist(r.x, r.y, b.x, b.y) < 80) { r.stun = 1.0; r.pull = 0; r.back = true; Sfx.bad(); } }); } });
    S.balls = S.balls.filter(b => b.t < b.T + 0.5);
    S.b.forEach((r, i) => {
      if (i === G) return;
      r.stun -= dt; r.cd -= dt;
      if (r.stun > 0) { r.vx = r.vy = 0; if (r.back && r.stun < 0.5) { r.x = R.range(200, 1080); r.y = 680; r.back = false; } return; }
      const ax = m.axis(i); MGH.steer(r, r.pull > 0 ? 0 : ax.x, r.pull > 0 ? 0 : ax.y, dt, 2000, 230, 7); MGH.integrate(r, dt, 40, 200, 1240, 700);
      const atGate = dist(r.x, r.y, 640, 230) < 80; r.pull = atGate && m.held(i, 'a') ? (r.pull || 0) + dt : 0;
      if (r.pull >= 1.0) { r.pull = 0; S.rings++; r.x = R.range(200, 1080); r.y = 680; Sfx.bell ? Sfx.bell() : Sfx.coin(); MGH.burst(640, 160, ['#ffe680', '#fff'], 20, { speed: 240 }); }
    });
    if (S.rings >= 4) { S.win = 1; m.finish(this.score(m, S)); }
  },
  bot(m, S, i) {
    const v = m.vin[i]; v.a = false;
    if (i === S.gun) {
      // aim ahead of the runner closest to the gate
      const tg = S.b.filter((r, j) => j !== i && r.stun <= 0).sort((p, q) => p.y - q.y)[0]; if (!tg) { v.ax = v.ay = 0; return; }
      const lx = tg.x + tg.vx * 0.9, ly = tg.y + tg.vy * 0.9, dx = lx - S.mk.x, dy = ly - S.mk.y, l = Math.hypot(dx, dy);
      v.ax = l > 10 ? dx / l : 0; v.ay = l > 10 ? dy / l : 0; if (l < 40 && S.cd <= 0 && Math.random() < 0.15) v.a = true;
      return;
    }
    const r = S.b[i]; if (r.stun > 0) return;
    let gx = 640, gy = 230;
    const threat = S.balls.find(b => !b.hit && dist(b.x, b.y, r.x, r.y) < 110);
    if (threat) { gx = r.x + (r.x - threat.x) * 3; gy = r.y + (r.y - threat.y) * 3; }
    else if (Math.random() < 0.5) gx += Math.sin(m.t * 2 + i) * 200;
    MGH.aim(m, i, gx, gy, r, 8); if (dist(r.x, r.y, 640, 230) < 70 && !threat) { v.a = true; v.ax = v.ay = 0; }
  },
  score(m, S) { const rw = S.win === 1; return m.players.map((p, i) => (i === S.gun) !== rw ? 1 : 0); },
  fmt(s) { return s ? 'WIN' : '—'; },
  hud(m, S, i) { return i === S.gun ? '💣 GUNNER' : `🔔 ${S.rings}/4`; },
  draw(m, S, g) {
    MGH.scene(g, 'sky', m.t);
    g.fillStyle = MGH.grad(g, 200, 720, ['#8aca5a', '#5aa83a']); g.fillRect(0, 200, 1280, 520);
    // the fort
    g.fillStyle = '#9a8a7a'; g.fillRect(380, 60, 520, 160); for (let x = 380; x < 900; x += 52) g.fillRect(x, 40, 30, 24);
    g.fillStyle = '#5a3a20'; MGH.rr(g, 590, 140, 100, 80, 40); g.fill(); g.fillStyle = 'rgba(0,0,0,0.25)'; for (let y = 80; y < 220; y += 30) g.fillRect(380, y, 520, 2);
    MGH.bell(g, 640, 120, 1, '#ffd34d', Math.sin(m.t * 3) * 0.2);
    g.strokeStyle = 'rgba(255,230,120,0.5)'; g.setLineDash([8, 8]); g.lineWidth = 3; g.beginPath(); g.arc(640, 230, 80, 0, Math.PI); g.stroke(); g.setLineDash([]);
    g.fillStyle = '#222'; for (const x of [440, 840]) { g.beginPath(); g.arc(x, 52, 16, 0, 7); g.fill(); g.fillRect(x - 6, 52, 12, 30); }
    const gp = m.players[S.gun]; Char.draw(g, 520, 30, 22, gp.el.id, gp.color, { mood: MGH.persona('evil', gp.el.id), seed: S.gun, look: { x: 0, y: 1 } });
    g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(0, 684, 1280, 4);
    S.balls.forEach(b => { const k = Math.min(1, b.t / b.T); if (!b.hit) { g.fillStyle = `rgba(0,0,0,${0.15 + 0.3 * k})`; g.beginPath(); g.ellipse(b.x, b.y, 70 * (0.4 + 0.6 * k), 22 * (0.4 + 0.6 * k), 0, 0, 7); g.fill(); g.fillStyle = '#222'; g.beginPath(); g.arc(b.x, b.y - (1 - k) * 500, 16, 0, 7); g.fill(); } });
    // gunner's marker
    g.strokeStyle = S.cd <= 0 ? '#ff4a4a' : 'rgba(255,80,80,0.4)'; g.lineWidth = 4; g.beginPath(); g.arc(S.mk.x, S.mk.y, 30, 0, 7); g.moveTo(S.mk.x - 40, S.mk.y); g.lineTo(S.mk.x + 40, S.mk.y); g.moveTo(S.mk.x, S.mk.y - 40); g.lineTo(S.mk.x, S.mk.y + 40); g.stroke();
    S.b.forEach((r, i) => { if (i === S.gun) return; MGH.drawBody(g, r, m.players[i], '', r.stun > 0 ? 'dizzy' : 'determined'); if (r.pull > 0) { g.strokeStyle = '#ffe680'; g.lineWidth = 4; g.beginPath(); g.arc(r.x, r.y - 50, 14, -Math.PI / 2, -Math.PI / 2 + r.pull / 1.0 * Math.PI * 2); g.stroke(); } });
    for (let k = 0; k < 4; k++) { g.fillStyle = k < S.rings ? '#ffe680' : 'rgba(255,255,255,0.3)'; g.beginPath(); g.arc(1100 + k * 40, 80, 14, 0, 7); g.fill(); }
  },
});

// ======================================================================== RELAY RACE (2 vs 2)
MG.def({
  id: 'relay', name: 'Relay Race', type: 'Race', mode: '2v2', sport: true, controls: 'A & B buttons', dur: 0,
  rows: [['a', 'Run: A and B in turn (steady!)'], ['b', 'Waiting: press A to grab the baton']],
  how: 'Two legs, two runners per team. The first runner sprints by pressing A and B one after the other in a STEADY rhythm. Their teammate waits in the yellow zone and presses A to grab the baton as the runner arrives — too early and you have to wait, too late and the runner has to slow down. Then the second runner sprints home!',
  wins: 'First team across the line.',
  LEN: 100, ZONE: [46, 54],
  init(m, S) { S.go = 2; S.t = 0; S.tm = [0, 1].map(tm => { const mem = [0, 1, 2, 3].filter(i => m.teamOf(i) === tm); return { mem, leg: 0, d: 0, v: 0, fin: 0, pass: -1, msg: '', msgT: 0 }; }); S.P = [0, 1, 2, 3].map(() => ({ lastKey: null })); },
  update(m, S, dt) {
    S.t += dt; if (S.t < S.go) return;
    S.tm.forEach(T => {
      if (T.fin) return; T.msgT -= dt;
      const run = T.mem[T.leg], wait = T.mem[1];
      const q = MGM.cadence(m, run, S.P[run], dt); T.v += (10.5 * q - T.v) * 2 * dt;
      if (T.leg === 0) {
        const inZone = T.d >= this.ZONE[0] && T.d <= this.ZONE[1];
        if (m.pressed(wait, 'a') && T.pass < 0) { if (inZone) { T.leg = 1; T.pass = S.t; S.P[wait].rq = Math.max(0.5, S.P[run].rq || 0); S.P[wait].beat = S.P[run].beat; S.P[wait].lastKey = null; T.msg = T.d < 48 ? 'FLYING PASS!' : 'pass!'; T.msgT = 1; Sfx.coin(); if (T.d < 48) T.v += 1.5; } else { T.msg = 'too early!'; T.msgT = 0.8; Sfx.bad(); } }
        if (T.d > this.ZONE[1]) { T.v = Math.min(T.v, 2.5); T.d = this.ZONE[1]; if (T.msgT <= 0) { T.msg = 'GRAB IT!'; T.msgT = 0.4; } }
      }
      T.d += T.v * dt;
      if (T.d >= this.LEN) { T.fin = S.t - S.go; Sfx.coin(); }
    });
    if (S.tm.every(T => T.fin) || S.t > S.go + 60) m.finish(this.score(m, S));
  },
  bot(m, S, i, dt) {
    const v = m.vin[i]; v.a = v.b = false; if (S.t < S.go) return;
    const T = S.tm[m.teamOf(i)]; if (T.fin) return;
    const run = T.mem[T.leg];
    if (i === run) { MGM.botCadence(m, i, S.P[i], dt); return; }
    if (T.leg === 0 && i === T.mem[1]) { if (!T.bAt) T.bAt = R.range(46.5, 53); if (T.d >= T.bAt) { v.a = true; T.bAt = 0; } }
  },
  score(m, S) { return [0, 1, 2, 3].map(i => { const T = S.tm[m.teamOf(i)]; return T.fin ? 100 - T.fin : T.d / 10; }); },
  fmt(s) { return s > 30 ? `${(100 - s).toFixed(2)}s` : 'DNF'; },
  hud(m, S, i) { return MG.TEAMN[m.teamOf(i)]; },
  draw(m, S, g) {
    MGM.stadium(g, m.t);
    const X = d => 80 + d * 11.2;
    S.tm.forEach((T, tm) => {
      const y0 = tm ? 420 : 170, h = 210;
      g.fillStyle = MGH.grad(g, y0, y0 + h, ['#d8644a', '#c4553a', '#a8442a']); g.fillRect(0, y0, 1280, h);
      g.fillStyle = MG.TEAMC[tm]; g.fillRect(0, y0, 1280, 6);
      g.fillStyle = 'rgba(255,230,80,0.35)'; g.fillRect(X(this.ZONE[0]), y0 + 6, X(this.ZONE[1]) - X(this.ZONE[0]), h - 6);
      for (let k = 0; k < 8; k++) { g.fillStyle = k % 2 ? '#fff' : '#222'; g.fillRect(X(this.LEN), y0 + 6 + k * (h - 6) / 8, 10, (h - 6) / 8); }
      const run = T.mem[T.leg], wait = T.mem[1], rp = m.players[run], wp = m.players[wait];
      const x = X(Math.min(this.LEN, T.d));
      if (T.leg === 0) Char.draw(g, X(this.ZONE[0]) + 30, y0 + 120, 32, wp.el.id, wp.color, { mood: MGH.persona(T.d > 40 ? 'determined' : 'happy', wp.el.id), seed: wait * 1.7, look: { x: -1, y: 0 }, hands: T.d > 40 ? { n: { x: 1.2, y: 0, d: 0, o: true, m: true }, f: { x: 0.6, y: 0.3, d: 90, o: true, m: false } } : undefined });
      Char.draw(g, x, y0 + 120, 32, rp.el.id, rp.color, { mood: MGH.persona(T.fin ? 'cheer' : 'effort', rp.el.id), seed: run * 1.7, look: { x: 1, y: 0 }, walk: T.v > 1 && !T.fin ? 1 : 0, t: m.t * (0.5 + T.v * 0.08) });
      g.fillStyle = '#ffcf4a'; g.fillRect(x + 18, y0 + 110, 20, 6);
      if (T.leg === 1) { const p0 = m.players[T.mem[0]]; Char.draw(g, X(this.ZONE[1]) + 20, y0 + 60, 24, p0.el.id, p0.color, { mood: 'cheer', seed: T.mem[0] * 1.7 }); }
      if (!T.fin && S.t > S.go) MGM.drawCadence(g, 200, y0 + 30, S.P[run], 90);
      if (T.msgT > 0) MGH.label(g, T.msg, X(50), y0 + 40, 22, '#ffe680');
      MGH.text(g, MG.TEAMN[tm] + (T.fin ? `  ${T.fin.toFixed(2)}s` : ''), 1180, y0 + 34, 18, '#fff', 'center', 'bold');
    });
    if (S.t < S.go + 0.6) MGH.label(g, S.t < S.go ? 'Ready…' : 'GO!', 640, 120, 44, '#fff');
  },
});

// ======================================================================== KITE FLYER (keep your kite in the wind band)
MG.def({
  id: 'kite', name: 'Kite Flyer', type: 'Skill', controls: '1 button', dur: 40,
  rows: [['a', 'Hold to pull the kite up']],
  how: 'A ribbon of strong wind drifts up and down the sky. Keep your kite INSIDE the glowing band: HOLD A to tug the string and climb, let go to let it sink. Every moment inside the band scores. Gusts sometimes shove kites around!',
  wins: 'Most time in the wind band.',
  init(m, S) { S.p = [0, 1, 2, 3].map(i => ({ y: 400, vy: 0, sc: 0, gust: 0, look: R.range(0.15, 0.35), bias: R.range(-12, 12) })); S.ph = R.range(0, 6); },
  band(m, S) { const t = m.t; return 380 + Math.sin(t * 0.9 + S.ph) * 170 + Math.sin(t * 2.6) * 60; },
  update(m, S, dt) {
    const c = this.band(m, S);
    S.p.forEach((P, i) => {
      P.vy += (m.held(i, 'a') ? -520 : 360) * dt; if (Math.random() < dt * 0.5) P.gust = R.range(-420, 420); P.vy += P.gust * dt; P.gust *= Math.exp(-2 * dt);
      P.vy *= Math.exp(-1.4 * dt); P.y = clamp(P.y + P.vy * dt, 110, 650);
      if (Math.abs(P.y - c) < 40) P.sc += dt;
    });
  },
  bot(m, S, i) { const P = S.p[i], v = m.vin[i], c = this.band(m, S); v.a = P.y + P.vy * P.look > c + P.bias; if (Math.random() < 0.01) P.bias = R.range(-30, 30); },
  score(m, S) { return S.p.map(P => Math.round(P.sc * 10) / 10); },
  fmt(s) { return `${s.toFixed(1)}s`; },
  hud(m, S, i) { return `${S.p[i].sc.toFixed(1)}s`; },
  draw(m, S, g) {
    MGH.scene(g, 'sky', m.t);
    const c = this.band(m, S);
    const gr = g.createLinearGradient(0, c - 70, 0, c + 70); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(160,240,255,0.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, c - 70, 1280, 140); g.strokeStyle = 'rgba(255,255,255,0.5)'; g.setLineDash([10, 10]); g.beginPath(); g.moveTo(0, c - 40); g.lineTo(1280, c - 40); g.moveTo(0, c + 40); g.lineTo(1280, c + 40); g.stroke(); g.setLineDash([]);
    for (let k = 0; k < 10; k++) { const x = ((k * 160 + m.t * 300) % 1400) - 60; g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, c - 30 + (k % 3) * 25); g.quadraticCurveTo(x + 30, c - 40 + (k % 3) * 25, x + 60, c - 30 + (k % 3) * 25); g.stroke(); }
    g.fillStyle = '#7ac85a'; g.fillRect(0, 670, 1280, 50);
    S.p.forEach((P, i) => {
      const p = m.players[i], x = 220 + i * 280, kx = x + 120, inB = Math.abs(P.y - c) < 40;
      g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x + 14, 640); g.quadraticCurveTo(x + 60, (640 + P.y) / 2 + 40, kx, P.y + 30); g.stroke();
      g.save(); g.translate(kx, P.y); g.rotate(Math.sin(m.t * 3 + i) * 0.15 + P.vy * 0.0005);
      if (inB) MGH.glow(g, 0, 0, 50, 'rgba(255,255,200,0.6)');
      g.fillStyle = p.color; g.beginPath(); g.moveTo(0, -34); g.lineTo(26, 0); g.lineTo(0, 34); g.lineTo(-26, 0); g.closePath(); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, -34); g.lineTo(0, 34); g.moveTo(-26, 0); g.lineTo(26, 0); g.stroke();
      for (let k = 0; k < 4; k++) { g.fillStyle = ['#ff6b8a', '#ffe680', '#5ab8ff', '#7cf06a'][k]; g.beginPath(); g.arc(Math.sin(m.t * 5 + k) * 6, 40 + k * 12, 4, 0, 7); g.fill(); }
      g.restore();
      Char.draw(g, x, 630, 26, p.el.id, p.color, { mood: MGH.persona(inB ? 'cheer' : 'determined', p.el.id), seed: i * 1.7, look: { x: 0.6, y: -1 }, hands: m.held(i, 'a') ? { n: { x: 0.2, y: -0.6, d: 0, o: true, m: true }, f: { x: 0.8, y: -0.4, d: 0, o: true, m: false } } : undefined });
      MGH.text(g, `${P.sc.toFixed(1)}s`, x, 704, 16, '#fff', 'center', 'bold');
    });
  },
});

// ======================================================================== COOKIE COPY (memorise the sprinkles, repeat with A B X Y)
const COOKIE_COL = ['#e8b82e', '#e8453c', '#3fc35a', '#3f8ee8']; // Y B A X
MG.def({
  id: 'cookie', name: 'Cookie Copy', type: 'Memory', controls: 'A B X Y', dur: 0, noPadSkip: true,
  rows: [['abxy', 'Repeat the sprinkle colours']],
  how: 'The chef decorates a cookie with coloured sprinkles one by one — watch the order! Then copy it on your own cookie with the buttons: YELLOW = Y, RED = B, GREEN = A, BLUE = X. Every right sprinkle scores; one wrong and your cookie is done for that round. The recipes get longer!',
  wins: 'Most correct sprinkles.',
  init(m, S) { S.pts = [0, 0, 0, 0]; S.round = 0; this.next(S); },
  next(S) { S.round++; S.seq = []; for (let k = 0; k < 2 + S.round; k++) S.seq.push(R.int(0, 3)); S.ph = 'show'; S.pt = 0; S.p = [0, 1, 2, 3].map(() => ({ k: 0, bad: false, done: false, bt: R.range(0.3, 0.6), acc: R.range(0.86, 0.96) })); },
  update(m, S, dt) {
    S.pt += dt;
    if (S.ph === 'show') { const per = Math.max(0.45, 0.8 - S.round * 0.05); if (S.pt > per * S.seq.length + 0.8) { S.ph = 'copy'; S.pt = 0; Sfx.tone(880, 0.1, 'triangle', 0.05); } return; }
    if (S.ph === 'copy') {
      S.p.forEach((P, i) => {
        if (P.done) return; const d = abxyPress(m, i); if (d < 0) return;
        if (d === S.seq[P.k]) { P.k++; S.pts[i]++; Sfx.tone(600 + P.k * 60, 0.05, 'triangle', 0.03); if (P.k >= S.seq.length) { P.done = true; S.pts[i] += 2; } }
        else { P.bad = true; P.done = true; Sfx.bad(); }
      });
      if (S.p.every(P => P.done) || S.pt > 4 + S.seq.length * 1.2) { S.ph = 'show2'; S.pt = 0; }
      return;
    }
    if (S.pt > 2.2) { if (S.round >= 6) m.finish(S.pts.slice()); else this.next(S); }
  },
  bot(m, S, i, dt) {
    const P = S.p[i]; abxyBot(m, i, -1); if (S.ph !== 'copy' || P.done) return;
    P.bt -= dt; if (P.bt > 0) return; P.bt = R.range(0.3, 0.7);
    abxyBot(m, i, Math.random() < P.acc - S.round * 0.02 ? S.seq[P.k] : R.int(0, 3));
  },
  score(m, S) { return S.pts.slice(); },
  fmt(s) { return `${s} pts`; },
  hud(m, S, i) { return `${S.pts[i]} pts`; },
  cookie(g, x, y, r, seq, n, t) {
    MGH.shadow(g, x, y + r * 0.9, r, 0.3);
    g.fillStyle = '#d8a060'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.fillStyle = '#ffe0f0'; g.beginPath(); g.arc(x, y, r * 0.82, 0, 7); g.fill();
    for (let k = 0; k < n; k++) { const a = k * 2.4, rr = r * (0.2 + 0.5 * ((k * 37) % 10) / 10); g.save(); g.translate(x + Math.cos(a) * rr, y + Math.sin(a) * rr); g.rotate(a); g.fillStyle = COOKIE_COL[seq[k]]; MGH.rr(g, -9, -3, 18, 6, 3); g.fill(); g.restore(); }
  },
  draw(m, S, g) {
    g.fillStyle = MGH.grad(g, 0, 720, ['#ffe8f0', '#ffd0e0', '#f4b8cc']); g.fillRect(0, 0, 1280, 720);
    for (let x = 0; x < 1280; x += 60) { g.fillStyle = (x / 60) % 2 ? 'rgba(255,255,255,0.35)' : 'rgba(255,200,220,0.3)'; g.fillRect(x, 0, 60, 720); }
    MGH.label(g, `Round ${S.round} of 6 — ${S.seq.length} sprinkles`, 640, 50, 22, '#a83a6a');
    Char.npc(g, 380, 200, 40, 'chef', { mood: S.ph === 'show' ? 'happy' : 'smug', look: { x: 1, y: 0.4 } });
    const per = Math.max(0.45, 0.8 - S.round * 0.05), shown = S.ph === 'show' ? Math.min(S.seq.length, Math.floor(S.pt / per)) : S.ph === 'copy' ? 0 : S.seq.length;
    this.cookie(g, 640, 190, 110, S.seq, shown, m.t);
    if (S.ph === 'show' && shown > 0 && shown <= S.seq.length) { const d = S.seq[shown - 1]; abxyBadge(g, d, 800, 120, 24); }
    if (S.ph === 'copy') MGH.text(g, 'Your turn — copy it!', 640, 200, 28, '#a83a6a', 'center', 'bold');
    [[3, 'X'], [0, 'Y'], [2, 'A'], [1, 'B']].forEach(([d], k) => { abxyBadge(g, d, 960 + k * 60, 300, 18); g.fillStyle = COOKIE_COL[d]; MGH.rr(g, 945 + k * 60, 326, 30, 8, 4); g.fill(); });
    for (let i = 0; i < 4; i++) {
      const P = S.p[i], p = m.players[i], x = 160 + i * 320;
      this.cookie(g, x, 470, 80, S.seq, P.k, m.t);
      if (P.bad) MGH.text(g, '✖', x, 490, 80, 'rgba(220,40,40,0.8)', 'center', 'bold'); else if (P.done && S.ph !== 'show') MGH.text(g, '✔', x, 400, 40, '#3a9a3a', 'center', 'bold');
      Char.draw(g, x, 630, 28, p.el.id, p.color, { mood: MGH.persona(P.bad ? 'hurt' : P.done ? 'cheer' : 'determined', p.el.id), seed: i * 1.7, look: { x: 0, y: -1 } });
      MGH.text(g, `${p.name}  ${S.pts[i]}`, x, 700, 18, p.color, 'center', 'bold');
    }
  },
});

// ======================================================================== TOP BATTLE (spin tops in a bowl)
MG.def({
  id: 'tops', name: 'Top Battle', type: 'Arena', controls: 'Move + button', dur: 0,
  rows: [['a', 'Wind up, then let go to launch'], ['stick', 'Lean your top']],
  how: 'First, HOLD A to wind up your spinning top — the meter swings, so let go near the top for the fastest spin. Then the tops whirl around a big bowl! Lean with the stick to steer. Every bump costs spin; the faster top loses less. A top that slows to a stop topples over. Last top spinning wins!',
  wins: 'Last top spinning.',
  CX: 640, CY: 400, RR: 300,
  init(m, S) { S.ph = 'wind'; S.pt = 0; S.b = [0, 1, 2, 3].map(i => { const a = i * Math.PI / 2 + 0.6; return Object.assign(MGH.body(this.CX + Math.cos(a) * 200, this.CY + Math.sin(a) * 200, 26), { spin: 0, hold: 0, rot: 0, out: 0, set: false, tgt: R.range(0.65, 0.97) }); }); S.order = []; },
  update(m, S, dt) {
    S.pt += dt;
    if (S.ph === 'wind') {
      S.b.forEach((b, i) => { if (b.set) return; if (m.held(i, 'a')) b.hold += dt; else if (b.hold > 0.1) { b.spin = 0.55 + swingP(b.hold) * 0.45; b.set = true; Sfx.whoosh(false); } });
      if (S.b.every(b => b.set) || S.pt > 6) { S.b.forEach(b => { if (!b.set) { b.spin = 0.5; b.set = true; } }); S.ph = 'go'; S.pt = 0; Sfx.whistle(); }
      return;
    }
    S.b.forEach((b, i) => {
      if (b.out) return;
      b.rot += b.spin * 30 * dt; b.spin -= dt * 0.012;
      const a = m.axis(i), dx = b.x - this.CX, dy = b.y - this.CY;
      b.vx += (a.x * 360 - dx * 1.2) * dt; b.vy += (a.y * 360 - dy * 1.2) * dt; // the bowl pulls toward the middle
      b.vx += -dy * 0.9 * dt * b.spin; b.vy += dx * 0.9 * dt * b.spin; // tops drift round the bowl
      b.vx *= Math.exp(-0.5 * dt); b.vy *= Math.exp(-0.5 * dt); b.x += b.vx * dt; b.y += b.vy * dt;
      const d = Math.hypot(dx, dy); if (d > this.RR - b.r) { b.x = this.CX + dx / d * (this.RR - b.r); b.y = this.CY + dy / d * (this.RR - b.r); b.vx *= -0.5; b.vy *= -0.5; b.spin -= 0.02; }
      if (b.spin <= 0.06) { b.out = 1; S.order.push(i); Sfx.thud(); }
    });
    for (let x = 0; x < 4; x++) for (let y = x + 1; y < 4; y++) {
      const A = S.b[x], B = S.b[y]; if (A.out || B.out) continue;
      const dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy) || 1, mn = A.r + B.r; if (d >= mn) continue;
      const nx = dx / d, ny = dy / d, o = (mn - d) / 2; A.x -= nx * o; A.y -= ny * o; B.x += nx * o; B.y += ny * o;
      const rel = Math.max(80, -((B.vx - A.vx) * nx + (B.vy - A.vy) * ny));
      const k = 260 + rel * 0.6; A.vx -= nx * k * B.spin; A.vy -= ny * k * B.spin; B.vx += nx * k * A.spin; B.vy += ny * k * A.spin;
      const hurt = 0.05 + rel * 0.0002; A.spin -= hurt * (B.spin / (A.spin + B.spin)); B.spin -= hurt * (A.spin / (A.spin + B.spin));
      Sfx.tone(1400 + Math.random() * 400, 0.04, 'square', 0.03); MGH.burst((A.x + B.x) / 2, (A.y + B.y) / 2, ['#fff', '#ffe680'], 6, { speed: 200 });
    }
    if (S.b.filter(b => !b.out).length <= 1 || S.pt > 60) m.finish(this.score(m, S));
  },
  bot(m, S, i, dt) {
    const b = S.b[i], v = m.vin[i]; v.a = false; v.ax = v.ay = 0;
    if (S.ph === 'wind') { if (b.set) return; v.a = !(b.hold > 0.2 && swingP(b.hold) <= b.tgt && swingP(b.hold + 2 * dt) > b.tgt) && b.hold < 2.6; return; }
    if (b.out) return;
    const weak = S.b.filter((o, j) => j !== i && !o.out).sort((p, q) => p.spin - q.spin)[0];
    if (!b.mood || Math.random() < 0.01) b.mood = Math.random(); if (weak && (weak.spin < b.spin || b.mood > 0.6)) MGH.aim(m, i, weak.x, weak.y, b, 4); else MGH.aim(m, i, this.CX + (b.y - this.CY), this.CY - (b.x - this.CX), b, 4);
  },
  score(m, S) { return S.b.map((b, i) => b.out ? S.order.indexOf(i) + 1 : 10 + b.spin); },
  fmt(s) { return s >= 10 ? 'Still spinning!' : `out #${Math.round(s)}`; },
  hud(m, S, i) { const b = S.b[i]; return b.out ? 'toppled' : `spin ${Math.round(b.spin * 100)}%`; },
  draw(m, S, g) {
    GX.blit(g, BG3.stadium());
    const gr = g.createRadialGradient(this.CX, this.CY, 20, this.CX, this.CY, this.RR); gr.addColorStop(0, '#e8d8b8'); gr.addColorStop(0.8, '#c8a878'); gr.addColorStop(1, '#8a6a4a');
    g.fillStyle = gr; g.beginPath(); g.arc(this.CX, this.CY, this.RR, 0, 7); g.fill(); g.strokeStyle = '#5a3a20'; g.lineWidth = 12; g.stroke();
    for (let r = 60; r < this.RR; r += 60) { g.strokeStyle = 'rgba(90,60,30,0.15)'; g.lineWidth = 2; g.beginPath(); g.arc(this.CX, this.CY, r, 0, 7); g.stroke(); }
    S.b.forEach((b, i) => {
      const p = m.players[i];
      if (S.ph === 'wind') {
        Char.draw(g, b.x, b.y - 40, 26, p.el.id, p.color, { mood: MGH.persona('effort', p.el.id), seed: i * 1.7 });
        g.fillStyle = 'rgba(0,0,0,0.5)'; MGH.rr(g, b.x + 36, b.y - 70, 14, 70, 5); g.fill(); const pw = b.set ? (b.spin - 0.55) / 0.45 : b.hold > 0 ? swingP(b.hold) : 0; g.fillStyle = '#ffb13d'; g.fillRect(b.x + 38, b.y - 2 - 66 * pw, 10, 66 * pw);
        return;
      }
      MGH.shadow(g, b.x, b.y + 20, 26, 0.3);
      g.save(); g.translate(b.x, b.y); if (b.out) g.rotate(1.3);
      const wob = b.out ? 0 : (1 - b.spin) * 0.3 * Math.sin(m.t * 12);
      g.rotate(wob);
      g.fillStyle = p.color; g.beginPath(); g.moveTo(-28, -6); g.quadraticCurveTo(0, -30, 28, -6); g.lineTo(0, 24); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 3; for (let k = 0; k < 3; k++) { const a = b.rot + k * 2.1; g.beginPath(); g.moveTo(Math.cos(a) * 24, -8 + Math.sin(a) * 6); g.lineTo(0, 22); g.stroke(); }
      g.fillStyle = '#5a3a20'; g.fillRect(-3, -24, 6, 12);
      g.restore();
      Char.draw(g, b.x, b.y - 30, 14, p.el.id, p.color, { mood: MGH.persona(b.out ? 'dizzy' : b.spin < 0.3 ? 'nervous' : 'happy', p.el.id), seed: i * 1.7, headOnly: true, alpha: b.out ? 0.5 : 1 });
      if (!b.out) { g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(b.x - 24, b.y + 30, 48, 5); g.fillStyle = b.spin > 0.4 ? '#7cf06a' : '#ff6b6b'; g.fillRect(b.x - 24, b.y + 30, 48 * b.spin, 5); }
    });
    if (S.ph === 'wind') MGH.label(g, 'Wind up your top! Hold A, let go at the top', 640, 70, 26, '#fff');
  },
});

// ======================================================================== FRUIT TREE (2 vs 2)
MG.def({
  id: 'fruittree', name: 'Fruit Tree', type: 'Coins', mode: '2v2', controls: 'Move + button', dur: 45,
  rows: [['pad', 'Shaker: shake the glowing branch'], ['lr', 'Catcher: move the basket']],
  how: 'Each team has a fruit tree. The SHAKER sees which branch has ripe fruit glowing and presses that direction (LEFT, UP or RIGHT) to shake it — the right branch drops fruit. The CATCHER slides the basket LEFT and RIGHT to catch it. Wrong branch? A beehive falls instead — don\'t catch that! Swap jobs at half time.',
  wins: 'Most fruit caught.',
  init(m, S) { S.half = false; S.t0 = [0, 1].map(tm => [0, 1, 2, 3].filter(i => m.teamOf(i) === tm)); S.tm = [0, 1].map(tm => ({ pts: 0, glow: R.int(0, 2), bx: 0, drops: [], cd: 0, ax: '' })); },
  roles(S, tm) { const [a, b] = S.t0[tm]; return S.half ? { shake: b, catch: a } : { shake: a, catch: b }; },
  BR: [-150, 0, 150],
  update(m, S, dt) {
    if (!S.half && m.t > 22.5) { S.half = true; S.tm.forEach(T => { T.drops = []; }); Sfx.whistle(); }
    S.tm.forEach((T, tm) => {
      const R_ = this.roles(S, tm), cx = tm ? 960 : 320; T.cd -= dt;
      const a = m.axis(R_.shake), now = a.x < -0.6 ? 'left' : a.x > 0.6 ? 'right' : a.y < -0.6 ? 'up' : '';
      let d = (m.bot(R_.shake) ? null : ['left', 'up', 'right'].find(k => m.pressed(R_.shake, k))) || (now && now !== T.ax ? now : null); T.ax = now;
      if (d && T.cd <= 0) { const br = ['left', 'up', 'right'].indexOf(d); T.cd = 0.35; T.shook = { br, t: 0.3 }; T.drops.push({ x: cx + this.BR[br] + R.range(-20, 20), y: 220, vy: 0, bad: br !== T.glow }); if (br === T.glow) { T.glow = R.pick([0, 1, 2].filter(k => k !== br)); Sfx.tone(700, 0.05, 'triangle', 0.03); } else Sfx.tone(200, 0.1, 'square', 0.03); }
      if (T.shook) { T.shook.t -= dt; if (T.shook.t <= 0) T.shook = null; }
      T.bx = clamp(T.bx + m.axis(R_.catch).x * 420 * dt, -220, 220);
      T.drops.forEach(f => { f.vy += 700 * dt; f.y += f.vy * dt; if (!f.done && f.y > 600 && f.y < 640 && Math.abs(f.x - (cx + T.bx)) < 60) { f.done = true; if (f.bad) { T.pts = Math.max(0, T.pts - 2); Sfx.bad(); } else { T.pts++; Sfx.coin(); } } });
      T.drops = T.drops.filter(f => !f.done && f.y < 760);
    });
  },
  bot(m, S, i) {
    const v = m.vin[i], tm = m.teamOf(i), T = S.tm[tm], R_ = this.roles(S, tm), cx = tm ? 960 : 320; v.left = v.right = v.up = false; v.ax = 0;
    if (i === R_.shake) { if (T.cd <= 0 && Math.random() < 0.06) { const br = Math.random() < 0.85 ? T.glow : R.int(0, 2); v[['left', 'up', 'right'][br]] = true; } return; }
    const f = T.drops.filter(f => !f.bad && f.y < 620).sort((a, b) => b.y - a.y)[0], bad = T.drops.find(f => f.bad && f.y > 420 && Math.abs(f.x - (cx + T.bx)) < 70);
    let tx = f ? f.x - cx : T.bx; if (bad) tx = T.bx + (T.bx + cx > bad.x ? 120 : -120);
    v.ax = Math.abs(tx - T.bx) > 12 ? Math.sign(tx - T.bx) : 0;
  },
  score(m, S) { return [0, 1, 2, 3].map(i => S.tm[m.teamOf(i)].pts); },
  fmt(s) { return `${s} fruit`; },
  hud(m, S, i) { const tm = m.teamOf(i); return MG.TEAMN[tm] + (this.roles(S, tm).shake === i ? ' · shaker' : ' · catcher'); },
  draw(m, S, g) {
    MGH.scene(g, 'meadow', m.t);
    S.tm.forEach((T, tm) => {
      const cx = tm ? 960 : 320, R_ = this.roles(S, tm), sh = T.shook ? Math.sin(m.t * 60) * 6 : 0;
      g.fillStyle = '#6a4a2a'; g.fillRect(cx - 20, 260, 40, 380);
      this.BR.forEach((bx, k) => {
        const s = T.shook && T.shook.br === k ? sh : 0;
        g.strokeStyle = '#6a4a2a'; g.lineWidth = 12; g.beginPath(); g.moveTo(cx, 320); g.lineTo(cx + bx + s, 220); g.stroke();
        g.fillStyle = k === T.glow ? '#5ac83a' : '#4a9a3a'; g.beginPath(); g.arc(cx + bx + s, 190, 70, 0, 7); g.fill();
        if (k === T.glow) { MGH.glow(g, cx + bx, 190, 80, 'rgba(255,240,120,0.4)'); for (let q = 0; q < 4; q++) { g.fillStyle = '#ff4a3a'; g.beginPath(); g.arc(cx + bx + Math.cos(q * 1.6) * 34 + s, 200 + Math.sin(q * 1.6) * 24, 10, 0, 7); g.fill(); } }
        MGH.text(g, ['◀', '▲', '▶'][k], cx + bx, 130, 20, '#fff', 'center', 'bold');
      });
      T.drops.forEach(f => { if (f.bad) { g.fillStyle = '#e8b83a'; g.beginPath(); g.ellipse(f.x, f.y, 14, 18, 0, 0, 7); g.fill(); g.fillStyle = '#5a3a10'; for (let k = -1; k <= 1; k++) g.fillRect(f.x - 12, f.y + k * 8, 24, 3); } else { g.fillStyle = '#ff4a3a'; g.beginPath(); g.arc(f.x, f.y, 12, 0, 7); g.fill(); g.fillStyle = '#3a8a2a'; g.fillRect(f.x - 1, f.y - 16, 3, 6); } });
      const bx = cx + T.bx; g.fillStyle = '#c8904a'; g.beginPath(); g.moveTo(bx - 60, 600); g.lineTo(bx + 60, 600); g.lineTo(bx + 46, 640); g.lineTo(bx - 46, 640); g.fill(); g.strokeStyle = '#8a5a2a'; g.lineWidth = 3; g.stroke();
      const cp = m.players[R_.catch], sp = m.players[R_.shake];
      Char.draw(g, bx, 660, 22, cp.el.id, cp.color, { mood: MGH.persona('determined', cp.el.id), seed: R_.catch * 1.7, look: { x: 0, y: -1 }, hands: { n: { x: -1.2, y: -0.8, d: -100, o: true, m: true }, f: { x: 1.2, y: -0.8, d: -80, o: true, m: false } } });
      Char.draw(g, cx + 60, 340, 24, sp.el.id, sp.color, { mood: MGH.persona(T.shook ? 'effort' : 'happy', sp.el.id), seed: R_.shake * 1.7, look: { x: -0.5, y: -0.6 }, hands: { n: { x: -1, y: -1, d: -130, o: true, m: true }, f: { x: 0.4, y: -0.6, d: -60, o: true, m: false } } });
      MGH.text(g, `${MG.TEAMN[tm]}  ${T.pts}`, cx, 90, 26, MG.TEAMC[tm], 'center', 'bold');
    });
    if (S.half && m.t < 24.5) MGH.label(g, 'SWAP JOBS!', 640, 360, 40, '#ffe680');
  },
});

// ======================================================================== PLANK BRIDGE (drop the swinging plank across each gap)
MG.def({
  id: 'plank', name: 'Plank Bridge', type: 'Timing', controls: '1 button', dur: 0,
  rows: [['a', 'Drop the plank']],
  how: 'Six gaps stand between you and the finish! A plank swings back and forth above each gap like a pendulum. Press A to drop it — if it lands flat across the gap you run over. Land it crooked and it tumbles into the river, and you wait for the next plank. First across all six wins!',
  wins: 'First to the end.',
  init(m, S) { S.p = [0, 1, 2, 3].map(() => ({ gap: 0, st: 'swing', t: R.range(0, 6), sp: R.range(1.7, 2.2), fall: 0, fin: 0, ang: 0, ok: false, aim: R.range(0.08, 0.2) })); },
  update(m, S, dt) {
    S.p.forEach((P, i) => {
      if (P.fin) return;
      if (P.st === 'swing') { P.t += dt * P.sp * (1 + P.gap * 0.1); P.ang = Math.sin(P.t) * 0.9; if (m.pressed(i, 'a')) { P.st = 'drop'; P.fall = 0; P.ok = Math.abs(P.ang) < 0.16; Sfx.whoosh(false); } }
      else if (P.st === 'drop') { P.fall += dt; if (P.fall > 0.4) { if (P.ok) { P.st = 'walk'; P.fall = 0; Sfx.thud(); } else { P.st = 'miss'; P.fall = 0; Sfx.noise(0.3, 900, 0.08, 'lowpass'); } } }
      else if (P.st === 'walk') { P.fall += dt; if (P.fall > 0.7) { P.gap++; if (P.gap >= 6) { P.fin = m.t; Sfx.coin(); } else { P.st = 'swing'; P.t = R.range(0, 6); } } }
      else if (P.st === 'miss') { P.fall += dt; if (P.fall > 1.0) { P.st = 'swing'; P.t = R.range(0, 6); } }
    });
    if (S.p.every(P => P.fin) || m.t > 70) m.finish(this.score(m, S));
  },
  bot(m, S, i) { const P = S.p[i], v = m.vin[i]; v.a = false; if (P.st === 'swing' && Math.abs(P.ang) < P.aim && Math.cos(P.t) !== 0) { v.a = true; P.aim = R.range(0.06, 0.24); } },
  score(m, S) { return S.p.map(P => P.fin ? 100 - P.fin : P.gap); },
  fmt(s) { return s > 10 ? `${(100 - s).toFixed(1)}s` : `${Math.round(s)} gaps`; },
  hud(m, S, i) { return `${S.p[i].gap}/6`; },
  draw(m, S, g) {
    MGH.scene(g, 'forest', m.t);
    for (let i = 0; i < 4; i++) {
      const P = S.p[i], p = m.players[i], L = MGM.lane(i, 110, 150), gy = L.y1 - 30;
      g.fillStyle = MGH.grad(g, L.y0, L.y1, i % 2 ? ['#cfe8ff', '#a8d4f4'] : ['#d8f0ff', '#b4dcf8']); g.fillRect(0, L.y0, 1280, L.h); MGH.cloud(g, (200 + i * 310 + m.t * 10) % 1400 - 60, L.y0 + 30, 0.5);
      g.fillStyle = m.players[i].color; MGH.rr(g, 8, L.y0 + 8, 30, 22, 6); g.fill(); MGH.text(g, String(i + 1), 23, L.y0 + 25, 16, '#fff', 'center', 'bold');
      g.fillStyle = MGH.grad(g, gy, L.y1, ['#4aa8e8', '#2a78c8']); g.fillRect(0, gy + 6, 1280, L.y1 - gy - 6);
      for (let k = 0; k <= 6; k++) { const x = 60 + k * 190; g.fillStyle = '#7a5a3a'; g.fillRect(x, gy - 4, 70, L.y1 - gy + 4); g.fillStyle = '#5aa83a'; g.fillRect(x, gy - 8, 70, 8); }
      for (let k = 0; k < P.gap; k++) { const x = 130 + k * 190; g.fillStyle = '#c8904a'; g.fillRect(x, gy - 10, 120, 10); }
      if (!P.fin && P.gap < 6) {
        const gx = 190 + P.gap * 190, px = gx, py = L.y0 + 20;
        if (P.st === 'swing' || (P.st === 'drop' && P.fall < 0.4) || P.st === 'miss') {
          const k = P.st === 'drop' ? P.fall / 0.4 : P.st === 'miss' ? 1 : 0, ang = P.ang, y = py + 30 + k * (gy - 40 - py), rot = ang + (P.st === 'miss' ? P.fall * 3 : 0);
          if (P.st === 'swing') { g.strokeStyle = '#ccc'; g.lineWidth = 2; g.beginPath(); g.moveTo(px, py); g.lineTo(px + Math.sin(ang) * 20, py + 30); g.stroke(); }
          g.save(); g.translate(px, P.st === 'miss' ? gy + P.fall * 40 : y); g.rotate(rot); g.globalAlpha = P.st === 'miss' ? Math.max(0, 1 - P.fall) : 1; g.fillStyle = '#c8904a'; g.fillRect(-60, -5, 120, 10); g.strokeStyle = '#8a5a2a'; g.strokeRect(-60, -5, 120, 10); g.restore();
          if (P.st === 'swing') { g.strokeStyle = Math.abs(ang) < 0.16 ? 'rgba(120,255,120,0.8)' : 'rgba(255,255,255,0.3)'; g.lineWidth = 2; g.setLineDash([4, 4]); g.beginPath(); g.moveTo(px, py + 40); g.lineTo(px, gy - 10); g.stroke(); g.setLineDash([]); }
        }
      }
      const x = P.fin ? 60 + 6 * 190 + 35 : 60 + P.gap * 190 + 35 + (P.st === 'walk' ? Math.min(1, P.fall / 0.7) * 190 : 0);
      Char.draw(g, x, gy - 34, 22, p.el.id, p.color, { mood: MGH.persona(P.fin ? 'cheer' : P.st === 'miss' ? 'hurt' : 'determined', p.el.id), seed: i * 1.7, look: { x: 1, y: 0 }, walk: P.st === 'walk' ? 1 : 0 });
      MGH.text(g, P.fin ? `${P.fin.toFixed(1)}s` : `${P.gap}/6`, 1220, L.y0 + 26, 16, '#fff', 'center', 'bold');
    }
  },
});
