'use strict';
// Party batch 4b: Tightrope Gale (1v3), Dodgeball (2v2), Quick Draw, Penalty Kicks (1v3), Conveyor Sort

// ======================================================================== TIGHTROPE GALE (1 vs 3)
MG.def({
  id: 'tightrope', name: 'Tightrope Gale', type: 'Balance', mode: '1v3', controls: 'Move + button', dur: 55,
  rows: [['a', 'Walkers: hold to walk · Fan: blow'], ['b', 'Walkers: brace (standing, in the green)'], ['lr', 'Walkers: balance'], ['pad', 'Fan: pick a rope (up/down)']],
  how: 'Three walkers cross tightropes high above the circus floor; one player works the giant FAN. WALKERS: hold A to step forward and tilt LEFT/RIGHT to stay balanced — the wobble meter must stay in the middle. Standing still with the needle in the GREEN? Press B to BRACE: for a moment the fan cannot budge you (it needs a rest before you can brace again). Fall and you climb back on 30% further back. FAN: move UP/DOWN to pick a rope and press A to blast a gust at it (it takes a moment to spin up). Walkers win if two of them cross before time runs out!',
  wins: 'Walkers: two crossings. Fan: stop them!',
  ROPE: [230, 400, 570],
  init(m, S) {
    S.fan = m.players.findIndex((p, i) => m.teamOf(i) === 0); S.walk = [0, 1, 2, 3].filter(i => i !== S.fan);
    S.w = S.walk.map((i, k) => ({ i, rope: k, x: 0, bal: 0, bv: 0, fall: 0, done: false, falls: 0 }));
    S.f = { rope: 1, y: this.ROPE[1], spin: 0, gust: 0, cd: 0, dir: 1, sel: 0 }; S.crossed = 0; S.win = -1;
  },
  update(m, S, dt) {
    const F = S.f, fi = S.fan;
    F.cd -= dt; F.sel -= dt;
    if (F.sel <= 0 && F.spin <= 0) { const ay = m.axis(fi).y; const up = m.pressed(fi, 'up') || ay < -0.6, dn = m.pressed(fi, 'down') || ay > 0.6; if (up && F.rope > 0) { F.rope--; F.sel = 0.2; } else if (dn && F.rope < 2) { F.rope++; F.sel = 0.2; } }
    F.y += (this.ROPE[F.rope] - F.y) * Math.min(1, dt * 10);
    if (m.pressed(fi, 'a') && F.cd <= 0 && F.spin <= 0) { F.spin = 0.55; F.cd = 1.3; F.dir = R.pick([-1, 1]); Sfx.tone(120, 0.5, 'sawtooth', 0.03, 300); }
    if (F.spin > 0) { F.spin -= dt; if (F.spin <= 0) { F.gust = 0.6; F.gRope = F.rope; Sfx.whoosh(true); } }
    if (F.gust > 0) F.gust -= dt;
    S.w.forEach(W => {
      if (W.done) return;
      if (W.fall > 0) { W.fall -= dt; if (W.fall <= 0) { W.x = Math.max(0, W.x - 30); W.bal = 0; W.bv = 0; } return; }
      const i = W.i, walking = m.held(i, 'a');
      W.brace = (W.brace || 0) - dt; W.bcd = (W.bcd || 0) - dt;
      if (m.pressed(i, 'b') && !walking && Math.abs(W.bal) < 0.3 && W.bcd <= 0) { W.brace = 1.4; W.bcd = 4; Sfx.tone(500, 0.1, 'triangle', 0.04); }
      const braced = W.brace > 0 && !walking;
      const gust = F.gust > 0 && F.gRope === W.rope && !braced ? F.dir * 9.5 : 0;
      W.bv += (R.range(-1, 1) * (walking ? 3.2 : braced ? 0.3 : 1.4) + W.bal * (braced ? 0.6 : 2.4) + gust) * dt; W.bv -= m.axis(i).x * 6 * dt; W.bal += W.bv * dt; W.bv *= Math.exp(-1.6 * dt);
      if (walking) W.x += (1 - Math.min(0.7, Math.abs(W.bal))) * 6.2 * dt;
      if (Math.abs(W.bal) > 1) { W.fall = 1.4; W.falls++; Sfx.bad(); MGH.burst(140 + W.x * 10, this.ROPE[W.rope] + 20, ['#fff', m.players[i].color], 12, { speed: 200, grav: 600 }); }
      if (W.x >= 100) { W.done = true; S.crossed++; Sfx.coin(); MGH.burst(1150, this.ROPE[W.rope], ['#ffe680', '#fff'], 20, { speed: 240 }); }
    });
    if (S.crossed >= 2) { S.win = 1; m.finish(this.score(m, S)); }
  },
  bot(m, S, i, dt) {
    const v = m.vin[i]; v.a = v.b = false; v.ax = v.ay = 0; v.up = v.down = false;
    if (i === S.fan) {
      // blow at the walker closest to finishing (who isn't falling)
      const tg = S.w.filter(W => !W.done && W.fall <= 0).sort((a, b) => b.x - a.x)[0]; if (!tg) return;
      if (tg.rope < S.f.rope) v.up = !m.prev[i].up; else if (tg.rope > S.f.rope) v.down = !m.prev[i].down;
      else if (S.f.cd <= 0 && Math.random() < 0.07) v.a = true;
      return;
    }
    const W = S.w.find(W => W.i === i); if (!W || W.done || W.fall > 0) return;
    const gustSoon = S.f.spin > 0 && S.f.rope === W.rope;
    if (gustSoon && Math.abs(W.bal) < 0.3 && (W.bcd || 0) <= 0 && Math.random() < 0.06) { v.b = true; return; }
    v.ax = clamp(W.bal * 1.4 + W.bv * 0.6 + R.range(-0.25, 0.25), -1, 1);
    v.a = Math.abs(W.bal) < 0.45 && !gustSoon;
  },
  score(m, S) { const walkersWon = S.win === 1; return m.players.map((p, i) => (i === S.fan) !== walkersWon ? 1 : 0); },
  fmt(s) { return s ? 'WIN' : '—'; },
  hud(m, S, i) { return i === S.fan ? '🌀 FAN' : (W => W.done ? '✔ across' : `${Math.round(W.x)}%`)(S.w.find(W => W.i === i)); },
  draw(m, S, g) {
    // circus big top
    g.fillStyle = MGH.grad(g, 0, 720, ['#3a0a2a', '#6a1a3a', '#2a0a1a']); g.fillRect(0, 0, 1280, 720);
    for (let k = 0; k < 12; k++) { g.fillStyle = k % 2 ? 'rgba(255,80,80,0.18)' : 'rgba(255,255,255,0.06)'; g.beginPath(); g.moveTo(640, -60); g.lineTo(k * 120 - 60, 720); g.lineTo(k * 120 + 60, 720); g.fill(); }
    MGH.crowd(g, m.t, 690, 30);
    g.fillStyle = '#c8a060'; g.fillRect(110, 140, 20, 560); g.fillRect(1150, 140, 20, 560);
    MGH.text(g, `crossed ${S.crossed}/2`, 640, 80, 24, '#ffe680', 'center', 'bold');
    this.ROPE.forEach((y, r) => {
      const W = S.w.find(W => W.rope === r);
      g.strokeStyle = '#e8d8b0'; g.lineWidth = 4; g.beginPath(); g.moveTo(120, y); g.quadraticCurveTo(640, y + 18, 1160, y); g.stroke();
      g.fillStyle = '#8a5a2a'; g.fillRect(100, y - 6, 40, 12); g.fillRect(1140, y - 6, 40, 12);
      if (S.f.gust > 0 && S.f.gRope === r) for (let k = 0; k < 8; k++) { g.strokeStyle = 'rgba(200,240,255,0.5)'; g.lineWidth = 3; const yy = y - 60 + k * 14, xx = ((m.t * 900 + k * 170) % 1100) + 100; g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx + 70 * S.f.dir, yy); g.stroke(); }
      if (!W) return;
      const p = m.players[W.i], x = 140 + W.x * 10, sag = Math.sin(Math.PI * W.x / 100) * 18;
      if (W.fall > 0) { const k = 1 - W.fall / 1.4; Char.draw(g, x, y + sag - 50 + k * 300, 26, p.el.id, p.color, { mood: 'scared', seed: W.i, look: { x: 0, y: 1 } }); }
      else {
        g.save(); g.translate(x, y + sag); g.rotate(W.bal * 0.5);
        Char.draw(g, 0, -42, 26, p.el.id, p.color, { mood: MGH.persona(W.done ? 'cheer' : Math.abs(W.bal) > 0.6 ? 'scared' : 'determined', p.el.id), seed: W.i, look: { x: 1, y: 0 }, walk: m.held(W.i, 'a') ? 1 : 0, noShadow: true, hands: { n: { x: -1.5, y: -0.4, d: 180, o: true, m: true }, f: { x: 1.4, y: -0.4, d: 0, o: true, m: false } } });
        g.fillStyle = '#c8a060'; g.fillRect(-70, -50, 140, 4);
        g.restore();
        if (W.brace > 0) { MGH.glow(g, x, y + sag - 42, 46, 'rgba(120,200,255,0.5)'); g.strokeStyle = 'rgba(160,220,255,0.9)'; g.lineWidth = 3; g.beginPath(); g.arc(x, y + sag - 42, 40, 0, 7); g.stroke(); MGH.text(g, 'BRACED', x, y + sag - 92, 13, '#bfe6ff', 'center', 'bold'); }
        if (!W.done) { g.fillStyle = 'rgba(0,0,0,0.5)'; MGH.rr(g, x - 40, y - 108, 80, 10, 5); g.fill(); g.fillStyle = 'rgba(120,230,120,0.5)'; g.fillRect(x - 14, y - 108, 28, 10); g.fillStyle = Math.abs(W.bal) > 0.7 ? '#ff6b6b' : '#fff'; g.fillRect(x - 3 + clamp(W.bal, -1, 1) * 38, y - 112, 6, 18); }
      }
    });
    // the fan on its lift at the right
    const F = S.f, fp = m.players[S.fan], spin = m.t * (F.spin > 0 ? 30 : F.gust > 0 ? 40 : 4);
    g.fillStyle = '#5a5a6a'; g.fillRect(1196, 120, 12, 580);
    g.save(); g.translate(1230, F.y); g.fillStyle = '#3a3a4a'; g.beginPath(); g.arc(0, 0, 44, 0, 7); g.fill(); g.strokeStyle = '#9aa'; g.lineWidth = 3; g.stroke();
    for (let k = 0; k < 4; k++) { g.save(); g.rotate(spin + k * Math.PI / 2); g.fillStyle = F.spin > 0 ? '#ffb13d' : '#c8d0d8'; g.beginPath(); g.ellipse(0, -20, 9, 20, 0, 0, 7); g.fill(); g.restore(); }
    g.restore();
    Char.draw(g, 1230, F.y - 70, 22, fp.el.id, fp.color, { mood: MGH.persona(F.gust > 0 ? 'evil' : 'smug', fp.el.id), seed: S.fan, look: { x: -1, y: 0 } });
    if (F.spin > 0) MGH.text(g, 'GUST!', 1150, F.y - 40, 18, '#ffb13d', 'center', 'bold');
  },
});

// ======================================================================== DODGEBALL (2 vs 2)
MG.def({
  id: 'dodgeball', name: 'Dodgeball', type: 'Arena', mode: '2v2', sport: true, controls: 'Move + A & B', dur: 60,
  rows: [['stick', 'Move'], ['a', 'Throw (auto-aims)'], ['b', 'Dodge roll']],
  how: 'Stay on your side of the court! Run over a ball to pick it up and press A to throw it at the nearest rival — it aims for you. Press B to dodge-dive out of the way (you can\'t be hit mid-dive) — but you only have two dodges, and each one takes a few seconds to refill (the blue dots under you). Every hit scores a point for your team and sends the rival to the back line for a moment.',
  wins: 'Team with the most hits.',
  init(m, S) {
    S.hits = [0, 0]; const k = [0, 0];
    S.b = m.players.map((p, i) => { const tm = m.teamOf(i), j = k[tm]++; return Object.assign(MGH.body(tm ? 960 : 320, 280 + j * 220, 24), { ball: false, cd: 0, roll: 0, rcd: 0, stun: 0, tm, dg: 2, dgT: 0, trail: [] }); });
    S.balls = [250, 390, 530].map((y, k) => ({ x: k === 1 ? (Math.random() < 0.5 ? 560 : 720) : k ? 720 : 560, y, vx: 0, vy: 0, live: false, own: -1, t: 0 }));
  },
  update(m, S, dt) {
    S.b.forEach((b, i) => {
      b.cd -= dt; b.roll -= dt; b.rcd -= dt; b.stun -= dt; if (b.dg < 2) { b.dgT += dt; if (b.dgT > 3.5) { b.dg++; b.dgT = 0; } }
      if (b.roll > 0) { b.trail.push({ x: b.x, y: b.y, t: 0 }); } b.trail.forEach(q => { q.t += dt; }); b.trail = b.trail.filter(q => q.t < 0.25);
      const a = m.axis(i);
      if (b.stun > 0) { b.vx *= 0.85; b.vy *= 0.85; } else MGH.steer(b, a.x, a.y, dt, b.roll > 0 ? 4000 : 2000, b.roll > 0 ? 600 : (b.ball ? 280 : 310), 7);
      if (m.pressed(i, 'b') && b.rcd <= 0 && b.stun <= 0 && b.dg > 0) { b.roll = 0.3; b.rcd = 0.5; b.dg--; Sfx.whoosh(false); }
      const x0 = b.tm ? 660 : 60, x1 = b.tm ? 1220 : 620; MGH.integrate(b, dt, x0, 90, x1, 690);
      if (!b.ball && b.stun <= 0) for (const B of S.balls) if (!B.live && B.own < 0 && dist(B.x, B.y, b.x, b.y) < 38) { B.own = i; b.ball = true; Sfx.pop(); break; }
      if (b.ball && m.pressed(i, 'a') && b.cd <= 0 && b.stun <= 0) {
        const foes = S.b.filter(o => o.tm !== b.tm); const tg = foes.sort((p, q) => dist(p.x, p.y, b.x, b.y) - dist(q.x, q.y, b.x, b.y))[0];
        const B = S.balls.find(B => B.own === i), lead = dist(tg.x, tg.y, b.x, b.y) / 760 * 0.8, dx = tg.x + tg.vx * lead - b.x, dy = tg.y + tg.vy * lead - b.y, l = Math.hypot(dx, dy) || 1;
        B.live = true; B.x = b.x; B.y = b.y; B.vx = dx / l * 760; B.vy = dy / l * 760; B.t = 0; B.from = i; b.ball = false; b.cd = 0.4; Sfx.whoosh(true);
      }
    });
    S.balls.forEach(B => {
      if (B.own >= 0 && !B.live) { const o = S.b[B.own]; B.x = o.x + 20; B.y = o.y - 10; return; }
      if (!B.live) return;
      B.t += dt; B.x += B.vx * dt; B.y += B.vy * dt;
      if (B.y < 100 || B.y > 680) { B.vy *= -1; B.y = clamp(B.y, 100, 680); }
      for (let j = 0; j < 4; j++) { const o = S.b[j]; if (o.tm === S.b[B.from].tm || o.roll > 0 || o.stun > 0) continue; if (dist(o.x, o.y, B.x, B.y) < 42) { S.hits[1 - o.tm]++; o.stun = 1.2; o.vx = B.vx * 0.6; o.vy = B.vy * 0.6; if (o.ball) { const ob = S.balls.find(x => x.own === j); if (ob) { ob.own = -1; ob.x = o.x; } o.ball = false; } B.live = false; B.own = -1; B.vx *= -0.2; B.vy *= 0.2; Sfx.punch(); MGH.burst(o.x, o.y, ['#fff', '#ff6b6b'], 12, { speed: 200 }); break; } }
      if (B.live && (B.x < 40 || B.x > 1240 || B.t > 1.6)) { B.live = false; B.own = -1; B.x = clamp(B.x, 80, 1200); }
      if (!B.live && B.own < 0) { B.vx = B.vy = 0; if (Math.abs(B.x - 640) < 70) B.x = B.x < 640 ? 560 : 720; }
    });
  },
  bot(m, S, i) {
    const b = S.b[i], v = m.vin[i]; v.a = v.b = false;
    const incoming = S.balls.find(B => B.live && S.b[B.from].tm !== b.tm && dist(B.x, B.y, b.x, b.y) < 140);
    if (incoming && b.rcd <= 0 && b.dg > 0 && Math.random() < 0.15) { v.b = true; v.ax = -incoming.vy / 760; v.ay = incoming.vx / 760; return; }
    let gx, gy;
    if (!b.ball) { const free = S.balls.filter(B => !B.live && B.own < 0 && (b.tm ? B.x > 660 : B.x < 620)).sort((p, q) => dist(p.x, p.y, b.x, b.y) - dist(q.x, q.y, b.x, b.y))[0]; if (free) { gx = free.x; gy = free.y; } else { gx = b.tm ? 900 : 380; gy = 390 + Math.sin(m.t + i) * 160; } }
    else { gx = b.tm ? 760 : 520; gy = b.y + Math.sin(m.t * 2 + i) * 60; if (Math.abs(b.x - gx) < 200 && b.cd <= 0 && Math.random() < 0.06) v.a = true; }
    MGH.aim(m, i, gx, gy, b, 10);
  },
  score(m, S) { return m.players.map((p, i) => S.hits[m.teamOf(i)]); },
  fmt(s) { return `${s} hits`; },
  hud(m, S, i) { return MG.TEAMN[m.teamOf(i)]; },
  draw(m, S, g) {
    g.fillStyle = '#2a2a3a'; g.fillRect(0, 0, 1280, 720);
    g.fillStyle = MGH.grad(g, 80, 700, ['#d8a868', '#c08848']); g.fillRect(40, 80, 1200, 620);
    for (let x = 40; x < 1240; x += 60) { g.fillStyle = 'rgba(0,0,0,0.05)'; g.fillRect(x, 80, 2, 620); }
    g.fillStyle = MG.TEAMC[0]; g.globalAlpha = 0.15; g.fillRect(40, 80, 600, 620); g.fillStyle = MG.TEAMC[1]; g.fillRect(640, 80, 600, 620); g.globalAlpha = 1;
    g.strokeStyle = '#fff'; g.lineWidth = 5; g.strokeRect(40, 80, 1200, 620); g.beginPath(); g.moveTo(640, 80); g.lineTo(640, 700); g.stroke(); g.beginPath(); g.arc(640, 390, 70, 0, 7); g.stroke();
    MGH.text(g, `${S.hits[0]}`, 560, 60, 36, MG.TEAMC[0], 'center', 'bold'); MGH.text(g, `${S.hits[1]}`, 720, 60, 36, MG.TEAMC[1], 'center', 'bold');
    const ents = S.b.map((b, i) => ({ y: b.y, f: () => {
      g.fillStyle = MG.TEAMC[b.tm]; g.globalAlpha = 0.5; g.beginPath(); g.ellipse(b.x, b.y + 30, 30, 9, 0, 0, 7); g.fill(); g.globalAlpha = 1;
      // the dodge: a quick sideways dive with ghostly after-images and a puff of dust
      b.trail.forEach(q => { g.globalAlpha = 0.35 * (1 - q.t / 0.25); MGH.drawBody(g, Object.assign({}, b, { x: q.x, y: q.y }), m.players[i], '', 'determined'); }); g.globalAlpha = 1;
      if (b.roll > 0) { const k = 1 - b.roll / 0.3; g.save(); g.translate(b.x, b.y + 8); g.rotate(Math.sign(b.vx || 1) * Math.sin(k * Math.PI) * 0.9); MGH.drawBody(g, Object.assign({}, b, { x: 0, y: -8 }), m.players[i], '', 'determined'); g.restore(); if (Math.random() < 0.5) MGH.burst(b.x, b.y + 26, ['#e8d0a0', '#fff'], 2, { speed: 80 }); }
      else MGH.drawBody(g, b, m.players[i], '', b.stun > 0 ? 'dizzy' : b.ball ? 'determined' : 'happy');
      for (let k = 0; k < 2; k++) { const full = k < b.dg, part = k === b.dg ? b.dgT / 3.5 : 0; g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.arc(b.x - 8 + k * 16, b.y + 44, 6, 0, 7); g.fill(); g.fillStyle = '#5ab8ff'; g.beginPath(); g.moveTo(b.x - 8 + k * 16, b.y + 44); g.arc(b.x - 8 + k * 16, b.y + 44, 6, -Math.PI / 2, -Math.PI / 2 + (full ? 1 : part) * Math.PI * 2); g.fill(); }
    } })).concat(S.balls.map(B => ({ y: B.y + 1, f: () => { if (!B.live && B.own < 0) MGH.shadow(g, B.x, B.y + 14, 14, 0.3); g.fillStyle = '#e8432a'; g.beginPath(); g.arc(B.x, B.y, 13, 0, 7); g.fill(); g.strokeStyle = '#a82a1a'; g.lineWidth = 2; g.beginPath(); g.arc(B.x, B.y, 13, 0.3, 2.6); g.stroke(); g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.arc(B.x - 4, B.y - 4, 4, 0, 7); g.fill(); if (B.live) { g.strokeStyle = 'rgba(255,255,255,0.4)'; g.lineWidth = 4; g.beginPath(); g.moveTo(B.x, B.y); g.lineTo(B.x - B.vx * 0.05, B.y - B.vy * 0.05); g.stroke(); } } })));
    ents.sort((a, b) => a.y - b.y).forEach(e => e.f());
  },
});

// ======================================================================== QUICK DRAW (reaction with fake-outs)
MG.def({
  id: 'quickdraw', name: 'Quick Draw', type: 'Reaction', controls: '1 button', dur: 0,
  rows: [['a', 'Press on "GO!" only']],
  how: 'The host holds up signs. Press A the instant the sign says GO! — fastest gets 3 points, then 2, then 1. But watch out for tricks like "GOLD", "NO!" or "GO?" — press on a fake and you lose a point and sit out that turn.',
  wins: 'Most points after ten signs.',
  FAKES: ['GOLD', 'NO!', 'GO?', 'SO!', 'GOAT', 'OH!'],
  init(m, S) { S.pts = [0, 0, 0, 0]; S.k = 0; S.last = [null, null, null, null]; this.next(S); },
  next(S) { S.k++; S.ph = 'wait'; S.pt = 0; S.at = R.range(1.2, 3.2); S.fake = Math.random() < 0.35; S.sign = S.fake ? R.pick(this.FAKES) : 'GO!'; S.got = [-1, -1, -1, -1]; S.bad = [false, false, false, false]; S.order = []; S.bR = [0, 1, 2, 3].map(() => R.range(0.24, 0.5)); },
  update(m, S, dt) {
    S.pt += dt;
    if (S.ph === 'wait') {
      for (let i = 0; i < 4; i++) if (m.pressed(i, 'a') && !S.bad[i]) { S.bad[i] = true; S.pts[i]--; S.last[i] = 'too soon! −1'; Sfx.bad(); }
      if (S.pt >= S.at) { S.ph = 'sign'; S.pt = 0; Sfx.tone(S.fake ? 400 : 900, 0.12, 'square', 0.05); }
      return;
    }
    if (S.ph === 'sign') {
      for (let i = 0; i < 4; i++) if (m.pressed(i, 'a') && !S.bad[i] && S.got[i] < 0) {
        if (S.fake) { S.bad[i] = true; S.pts[i]--; S.last[i] = 'FAKE! −1'; Sfx.bad(); }
        else { S.got[i] = S.pt; S.order.push(i); const p = [3, 2, 1, 0][S.order.length - 1]; S.pts[i] += p; S.last[i] = `${Math.round(S.pt * 1000)} ms  +${p}`; Sfx.tone(1000 - S.order.length * 120, 0.06, 'triangle', 0.04); }
      }
      if (S.pt > (S.fake ? 1.6 : 1.5)) { S.ph = 'done'; S.pt = 0; if (S.fake) for (let i = 0; i < 4; i++) if (!S.bad[i]) S.last[i] = 'well held!'; }
      return;
    }
    if (S.pt > 1.6) { if (S.k >= 10) m.finish(S.pts.slice()); else { S.last = [null, null, null, null]; this.next(S); } }
  },
  bot(m, S, i) {
    const v = m.vin[i]; v.a = false;
    if (S.ph === 'wait' && S.pt > S.at - 0.02 && Math.random() < 0.01) v.a = true;
    if (S.ph === 'sign' && S.got[i] < 0 && !S.bad[i] && S.pt > S.bR[i]) { if (!S.fake || Math.random() < 0.003) v.a = true; }
  },
  score(m, S) { return S.pts.slice(); },
  fmt(s) { return `${s} pts`; },
  hud(m, S, i) { return `${S.pts[i]} pts`; },
  draw(m, S, g) {
    MGH.scene(g, 'desert', m.t);
    MGH.label(g, `Sign ${S.k} of 10`, 640, 70, 22, '#fff');
    const up = S.ph !== 'wait', lift = up ? Math.min(1, S.pt / 0.08) : 0;
    Char.npc(g, 640, 300, 44, 'host', { mood: up ? (S.fake ? 'smug' : 'shout') : 'happy', look: { x: 0, y: 0.3 }, hands: up ? { n: { x: -0.8, y: -1.9, d: -90, o: true, m: true }, f: { x: 0.8, y: -1.9, d: -90, o: true, m: false } } : undefined });
    // the sign
    const sy = 150 - lift * 10;
    g.fillStyle = '#8a5a2a'; g.fillRect(560, sy + 40, 8, 80); g.fillRect(712, sy + 40, 8, 80);
    g.fillStyle = up ? (S.fake ? '#f4e8c8' : '#7cf06a') : '#c8b088'; MGH.rr(g, 520, sy - 40, 240, 96, 14); g.fill(); g.strokeStyle = '#5a3a10'; g.lineWidth = 5; g.stroke();
    MGH.text(g, up ? S.sign : '…', 640, sy + 26, 56, up && !S.fake ? '#0a4a0a' : '#5a3a10', 'center', 'bold');
    for (let i = 0; i < 4; i++) {
      const x = 160 + i * 320, p = m.players[i], y = 560;
      MGH.shadow(g, x, y + 50, 40, 0.3);
      Char.draw(g, x, y, 40, p.el.id, p.color, { mood: MGH.persona(S.bad[i] ? 'hurt' : S.got[i] >= 0 ? (S.order[0] === i ? 'cheer' : 'happy') : up ? 'determined' : 'nervous', p.el.id), seed: i * 1.7, look: { x: (640 - x) / 600, y: -0.5 }, hands: S.got[i] >= 0 ? { n: { x: -0.5, y: -1.9, d: -90, o: true, m: true }, f: { x: 0.8, y: 0.3, d: 90, o: true, m: false } } : undefined });
      MGH.text(g, `${p.name}  ${S.pts[i]}`, x, y + 84, 20, p.color, 'center', 'bold');
      if (S.last[i]) MGH.label(g, S.last[i], x, y - 80, 18, S.last[i].includes('−') ? '#ff8a8a' : '#ffe680');
    }
  },
});

// ======================================================================== PENALTY KICKS (1 vs 3, secret A B X Y)
MG.def({
  id: 'penalty', name: 'Penalty Kicks', type: 'Bluff', mode: '1v3', sport: true, controls: 'A B X Y', dur: 0, noPadSkip: true,
  rows: [['abxy', 'X left · Y top · B right · A low middle']],
  how: 'Three shooters take turns against one keeper. Both pick secretly: X = LEFT corner, B = RIGHT corner, Y = TOP middle, A = LOW middle. If the keeper picks the same spot, it\'s SAVED! A diving keeper (X or B) also gets a fingertip to the middle-top shot one time in three. Nine kicks: the shooters need 6 goals to win.',
  wins: 'Shooters: 6 goals of 9. Keeper: 4 saves.',
  init(m, S) { S.keep = m.players.findIndex((p, i) => m.teamOf(i) === 0); S.shooters = [0, 1, 2, 3].filter(i => i !== S.keep); S.k = 0; S.goals = 0; S.saves = 0; S.log = []; S.win = -1; this.next(S); },
  next(S) { S.sh = S.shooters[S.k % 3]; S.ph = 'pick'; S.pt = 0; S.ps = -1; S.pk = -1; S.bA = R.range(0.7, 2.4); S.bB = R.range(0.7, 2.4); },
  update(m, S, dt) {
    S.pt += dt;
    if (S.ph === 'pick') {
      if (S.ps < 0) { const d = abxyPress(m, S.sh); if (d >= 0) { S.ps = d; Sfx.click(); } }
      if (S.pk < 0) { const d = abxyPress(m, S.keep); if (d >= 0) { S.pk = d; Sfx.click(); } }
      if ((S.ps >= 0 && S.pk >= 0) || S.pt > 6) {
        if (S.ps < 0) S.ps = R.int(0, 3); if (S.pk < 0) S.pk = R.int(0, 3);
        const tip = S.ps === 0 && (S.pk === 1 || S.pk === 3) && Math.random() < 0.34;
        S.saved = S.ps === S.pk || tip; S.tip = tip; S.ph = 'kick'; S.pt = 0; Sfx.whoosh(true);
      }
      return;
    }
    if (S.ph === 'kick') {
      if (S.pt > 0.6 && !S.scored) { S.scored = true; if (S.saved) { S.saves++; S.log.push(0); Sfx.thud(); } else { S.goals++; S.log.push(1); Sfx.crowd('cheer'); MGH.burst(this.spot(S.ps)[0], this.spot(S.ps)[1], ['#ffe680', '#fff'], 20, { speed: 240 }); } }
      if (S.pt > 2.2) {
        S.scored = false; S.k++;
        if (S.goals >= 6) { S.win = 1; m.finish(this.score(m, S)); }
        else if (S.saves >= 4) { S.win = 0; m.finish(this.score(m, S)); }
        else this.next(S);
      }
    }
  },
  spot(d) { return [[640, 250], [820, 330], [640, 380], [460, 330]][d]; },
  bot(m, S, i) {
    if (S.ph !== 'pick') { abxyBot(m, i, -1); return; }
    if (i === S.sh && S.ps < 0 && S.pt > S.bA) abxyBot(m, i, R.weighted([0, 1, 2, 3], k => [1, 1.3, 0.8, 1.3][k]));
    else if (i === S.keep && S.pk < 0 && S.pt > S.bB) abxyBot(m, i, R.weighted([0, 1, 2, 3], k => [0.8, 1.3, 1, 1.3][k]));
    else abxyBot(m, i, -1);
  },
  score(m, S) { const shootersWon = S.win === 1; return m.players.map((p, i) => (i === S.keep) !== shootersWon ? 1 : 0); },
  fmt(s) { return s ? 'WIN' : '—'; },
  hud(m, S, i) { return i === S.keep ? `🧤 ${S.saves} saves` : `⚽ ${S.goals} goals`; },
  draw(m, S, g) {
    g.fillStyle = MGH.grad(g, 0, 400, ['#1a2a5a', '#3a5a9a']); g.fillRect(0, 0, 1280, 400); MGH.crowd(g, m.t, 180, 40);
    g.fillStyle = MGH.grad(g, 200, 720, ['#4aaa4a', '#2a8a3a']); g.fillRect(0, 200, 1280, 520);
    for (let k = 0; k < 8; k++) { g.fillStyle = k % 2 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'; g.fillRect(0, 200 + k * 65, 1280, 65); }
    // goal
    g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 1; for (let x = 380; x <= 900; x += 20) { g.beginPath(); g.moveTo(x, 220); g.lineTo(x + (x - 640) * 0.06, 410); g.stroke(); } for (let y = 220; y <= 410; y += 20) { g.beginPath(); g.moveTo(380, y); g.lineTo(900, y); g.stroke(); }
    g.strokeStyle = '#fff'; g.lineWidth = 10; g.beginPath(); g.moveTo(380, 420); g.lineTo(380, 210); g.lineTo(900, 210); g.lineTo(900, 420); g.stroke();
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(640, 600, 6, 3, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 3; g.strokeRect(300, 420, 680, 200);
    if (S.ph === 'pick') [0, 1, 2, 3].forEach(d => { const [x, y] = this.spot(d); g.fillStyle = 'rgba(255,255,255,0.12)'; g.beginPath(); g.arc(x, y, 36, 0, 7); g.fill(); abxyBadge(g, d, x, y, 16); });
    // keeper
    const kp = m.players[S.keep], kk = S.ph === 'kick' ? Math.min(1, S.pt / 0.4) : 0, [dx, dy] = S.ph === 'kick' ? this.spot(S.pk) : [640, 360];
    const kx = 640 + (dx - 640) * kk, ky = 340 + (dy - 340) * kk;
    g.save(); g.translate(kx, ky); g.rotate(S.ph === 'kick' ? (S.pk === 1 ? 1 : S.pk === 3 ? -1 : 0) * kk * 1.1 : 0);
    Char.draw(g, 0, 0, 36, kp.el.id, kp.color, { mood: MGH.persona(S.ph === 'kick' && S.pt > 0.6 ? (S.saved ? 'cheer' : 'hurt') : 'determined', kp.el.id), seed: S.keep * 1.7, look: { x: 0, y: 1 }, hands: { n: { x: -1.3, y: -1.2, d: -130, o: true, m: true }, f: { x: 1.3, y: -1.2, d: -50, o: true, m: false } } });
    g.restore();
    // shooter and ball
    const sp = m.players[S.sh];
    const ball = S.ph === 'kick' ? (() => { const k = Math.min(1, S.pt / 0.6), [tx, ty] = this.spot(S.ps); const bx = 640 + (tx - 640) * k, by = 600 + (ty - 600) * k - Math.sin(Math.PI * k) * 40; return S.saved && S.pt > 0.6 ? [tx + (S.pt - 0.6) * 300 * (tx > 640 ? 1 : -1), ty + (S.pt - 0.6) * 200] : [bx, by]; })() : [640, 600];
    Char.draw(g, 600, 640, 40, sp.el.id, sp.color, { mood: MGH.persona(S.ph === 'kick' && S.pt > 0.6 ? (S.saved ? 'hurt' : 'cheer') : 'determined', sp.el.id), seed: S.sh * 1.7, look: { x: 0.4, y: -1 } });
    g.fillStyle = '#fff'; g.beginPath(); g.arc(ball[0], ball[1], 14, 0, 7); g.fill(); g.fillStyle = '#222'; g.beginPath(); g.arc(ball[0] + 3, ball[1] - 2, 5, 0, 7); g.fill();
    if (S.ph === 'kick' && S.pt > 0.6) MGH.label(g, S.saved ? (S.tip ? 'FINGERTIP SAVE!' : 'SAVED!') : 'GOAL!', 640, 140, 48, S.saved ? '#9fe0ff' : '#ffe680');
    // tally
    g.fillStyle = 'rgba(0,0,0,0.4)'; MGH.rr(g, 1030, 440, 200, 190, 16); g.fill();
    for (let k = 0; k < 9; k++) { const r = S.log[k]; g.fillStyle = r === undefined ? 'rgba(255,255,255,0.2)' : r ? '#ffe680' : '#5ab8ff'; g.beginPath(); g.arc(1090 + (k % 3) * 40, 530 + Math.floor(k / 3) * 36, 13, 0, 7); g.fill(); }
    MGH.text(g, `Goals ${S.goals}/6`, 1130, 472, 20, '#ffe680', 'center', 'bold'); MGH.text(g, `Saves ${S.saves}/4`, 1130, 498, 20, '#9fe0ff', 'center', 'bold');
    if (S.ph === 'pick') { MGH.text(g, `${sp.name} shoots${S.ps >= 0 ? ' ✔' : '…'}`, 200, 560, 20, sp.color, 'center', 'bold'); MGH.text(g, `${kp.name} keeps${S.pk >= 0 ? ' ✔' : '…'}`, 1080, 560, 20, kp.color, 'center', 'bold'); }
  },
});

// ======================================================================== CONVEYOR SORT (press the right direction for each parcel)
const SORT_K = [{ k: 'left', c: '#e84a4a', n: 'red', s: 'ball' }, { k: 'down', c: '#3fc35a', n: 'green', s: 'box' }, { k: 'right', c: '#3f8ee8', n: 'blue', s: 'star' }];
MG.def({
  id: 'sorter', name: 'Conveyor Sort', type: 'Reaction', controls: 'Move', dur: 45,
  rows: [['pad', 'LEFT red · DOWN green · RIGHT blue']],
  how: 'Toys roll down your conveyor belt into the sorting zone. Flick the right way for each: RED toys go LEFT, GREEN go DOWN, BLUE go RIGHT. Right bin +1, wrong bin −1, and a toy that falls off the end is lost. The belt speeds up!',
  wins: 'Most toys sorted.',
  init(m, S) {
    S.seq = []; let t = 1; while (t < 46) { S.seq.push({ t, k: R.int(0, 2) }); t += Math.max(0.42, 1.0 - t * 0.014) * R.range(0.8, 1.2); }
    S.p = [0, 1, 2, 3].map(() => ({ pts: 0, done: new Set(), fx: [], ax: '', bR: R.range(0.25, 0.45) }));
  },
  ZONE: 560,
  y(S, q, t) { const sp = 260 + t * 3; return 190 + (t - q.t) * sp; },
  update(m, S, dt) {
    const t = m.t;
    S.p.forEach((P, i) => {
      P.fx.forEach(f => { f.t += dt; }); P.fx = P.fx.filter(f => f.t < 0.5);
      const a = m.axis(i), now = a.x < -0.6 ? 'left' : a.x > 0.6 ? 'right' : a.y > 0.6 ? 'down' : '';
      let d = (m.bot(i) ? null : ['left', 'down', 'right'].find(k => m.pressed(i, k))) || (now && now !== P.ax ? now : null); P.ax = now;
      S.seq.forEach((q, n) => { if (!P.done.has(n) && t >= q.t && this.y(S, q, t) > 700) { P.done.add(n); P.fx.push({ txt: 'lost', col: '#ffb13d', t: 0 }); } });
      if (!d) return;
      const n = S.seq.findIndex((q, n) => !P.done.has(n) && t >= q.t && Math.abs(this.y(S, q, t) - this.ZONE) < 70);
      if (n < 0) return;
      P.done.add(n); const ok = SORT_K[S.seq[n].k].k === d; P.pts += ok ? 1 : -1; P.fx.push({ txt: ok ? '+1' : '−1', col: ok ? '#7cf06a' : '#ff6b6b', t: 0, d });
      if (ok) Sfx.tone(700 + P.pts * 8, 0.04, 'triangle', 0.03); else Sfx.bad();
    });
  },
  bot(m, S, i) {
    const P = S.p[i], v = m.vin[i], t = m.t; v.left = v.right = v.down = false;
    const n = S.seq.findIndex((q, n) => !P.done.has(n) && t >= q.t && this.y(S, q, t) > this.ZONE - 50 + P.bR * 60 && this.y(S, q, t) < this.ZONE + 60);
    if (n < 0) return;
    const k = Math.random() < 0.06 ? R.int(0, 2) : S.seq[n].k; v[SORT_K[k].k] = true; P.bR = R.range(0.2, 0.9);
  },
  score(m, S) { return S.p.map(P => P.pts); },
  fmt(s) { return `${s} toys`; },
  hud(m, S, i) { return `${S.p[i].pts}`; },
  draw(m, S, g) {
    g.fillStyle = MGH.grad(g, 0, 720, ['#3a3a5a', '#2a2a40']); g.fillRect(0, 0, 1280, 720);
    for (let k = 0; k < 6; k++) { g.fillStyle = 'rgba(255,230,140,0.08)'; g.beginPath(); g.moveTo(100 + k * 220, 0); g.lineTo(60 + k * 220, 720); g.lineTo(160 + k * 220, 720); g.fill(); }
    const t = m.t;
    for (let i = 0; i < 4; i++) {
      const P = S.p[i], ox = i * 320 + 160, p = m.players[i];
      // bins
      [[-110, 0], [0, 1], [110, 2]].forEach(([dx, k]) => { g.fillStyle = SORT_K[k].c; MGH.rr(g, ox + dx - 40, 630, 80, 70, 10); g.fill(); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(ox + dx - 34, 636, 68, 14); MGH.text(g, ['◀', '▼', '▶'][k], ox + dx, 684, 24, '#fff', 'center', 'bold'); });
      // belt
      g.fillStyle = '#4a4a5a'; g.fillRect(ox - 50, 150, 100, 470); g.fillStyle = '#5a5a6a'; for (let y = 150 + ((t * (260 + t * 3)) % 30); y < 620; y += 30) g.fillRect(ox - 50, y, 100, 4);
      g.fillStyle = 'rgba(255,230,120,0.25)'; g.fillRect(ox - 56, this.ZONE - 50, 112, 100); g.strokeStyle = '#ffe680'; g.lineWidth = 3; g.strokeRect(ox - 56, this.ZONE - 50, 112, 100);
      S.seq.forEach((q, n) => {
        if (P.done.has(n) || t < q.t) return; const y = this.y(S, q, t); if (y > 720) return; const K = SORT_K[q.k];
        g.fillStyle = K.c; g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 3;
        if (K.s === 'ball') { g.beginPath(); g.arc(ox, y, 22, 0, 7); g.fill(); g.stroke(); g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.arc(ox - 7, y - 7, 6, 0, 7); g.fill(); }
        else if (K.s === 'box') { MGH.rr(g, ox - 22, y - 22, 44, 44, 6); g.fill(); g.stroke(); g.fillStyle = '#ffe680'; g.fillRect(ox - 3, y - 22, 6, 44); }
        else MGH.star(g, ox, y, 26, K.c, 0, false);
      });
      P.fx.forEach(f => { g.globalAlpha = 1 - f.t / 0.5; MGH.text(g, f.txt, ox + (f.d === 'left' ? -80 : f.d === 'right' ? 80 : 0), 600 - f.t * 40, 22, f.col, 'center', 'bold'); g.globalAlpha = 1; });
      Char.draw(g, ox, 90, 26, p.el.id, p.color, { mood: MGH.persona('determined', p.el.id), seed: i * 1.7, look: { x: 0, y: 1 } });
      MGH.text(g, `${P.pts}`, ox + 70, 100, 28, p.color, 'center', 'bold');
    }
  },
});
