'use strict';
// DUELS (part 3): Hot Air Hockey, Hoop Duel, Boxing, Treasure Dig

// ===================================================================== HOT AIR HOCKEY (top-down table, first to 5)
MG.def({
  id: 'airhockey', name: 'Hot Air Hockey', type: 'Duel', mode: 'duel', controls: 'Move', dur: 0, sport: true,
  rows: [['stick', 'Move your mallet (your half only)']],
  how: 'Air hockey on a glowing table! Move your mallet around your half and smack the puck into the other goal. Hit it on the move for a harder shot, bank it off the walls to trick your rival. Now and then a GOLDEN puck drops in — it counts double! First to 5 goals wins.',
  wins: 'First to 5 goals.',
  T: { x0: 200, x1: 1080, y0: 150, y1: 650 },
  init(m, S) { S.d = DU.pair(m); S.score = [0, 0]; S.mal = [0, 1].map(j => ({ x: j ? 980 : 300, y: 400, vx: 0, vy: 0, px: 0, py: 0 })); this.serve(S, R.int(0, 1)); S.flash = 0; },
  serve(S, toward) { S.pk = { x: 640, y: 400, vx: 0, vy: 0, gold: Math.random() < 0.18, trail: [] }; S.wait = 1.2; S.toward = toward; },
  update(m, S, dt) {
    const T = this.T; S.flash -= dt;
    S.mal.forEach((M, j) => { const i = S.d[j], a = m.axis(i), tx = M.x + a.x * 640 * dt, ty = M.y + a.y * 640 * dt; M.px = M.x; M.py = M.y; M.x = clamp(tx, j ? 660 : T.x0 + 52, j ? T.x1 - 52 : 620); M.y = clamp(ty, T.y0 + 44, T.y1 - 44); M.vx = (M.x - M.px) / dt; M.vy = (M.y - M.py) / dt; });
    if (S.ph === 'end') { if ((S.endT -= dt) <= 0) m.finish(this.score(m, S)); return; }
    if (S.wait > 0) { S.wait -= dt; if (S.wait <= 0) { S.pk.vx = (S.toward ? 1 : -1) * 260; S.pk.vy = R.range(-120, 120); } return; }
    const P = S.pk, n = 4; for (let k = 0; k < n; k++) {
      P.x += P.vx * dt / n; P.y += P.vy * dt / n;
      if (P.y < T.y0 + 18) { P.y = T.y0 + 18; P.vy = Math.abs(P.vy) * 0.92; Sfx.tone(420, 0.03, 'triangle', 0.02); }
      if (P.y > T.y1 - 18) { P.y = T.y1 - 18; P.vy = -Math.abs(P.vy) * 0.92; Sfx.tone(420, 0.03, 'triangle', 0.02); }
      const inGoal = P.y > 330 && P.y < 470;
      if (P.x < T.x0 + 18) { if (inGoal) { this.goal(m, S, 1); return; } P.x = T.x0 + 18; P.vx = Math.abs(P.vx) * 0.92; }
      if (P.x > T.x1 - 18) { if (inGoal) { this.goal(m, S, 0); return; } P.x = T.x1 - 18; P.vx = -Math.abs(P.vx) * 0.92; }
      S.mal.forEach(M => { const dx = P.x - M.x, dy = P.y - M.y, d = Math.hypot(dx, dy) || 1; if (d < 52) { const nx = dx / d, ny = dy / d; P.x = M.x + nx * 52; P.y = M.y + ny * 52; const rel = (P.vx - M.vx) * nx + (P.vy - M.vy) * ny; if (rel < 0) { P.vx -= 1.9 * rel * nx; P.vy -= 1.9 * rel * ny; } const sp = Math.hypot(P.vx, P.vy); if (sp > 1300) { P.vx *= 1300 / sp; P.vy *= 1300 / sp; } if (k === 0) Sfx.tone(260, 0.04, 'square', 0.03); } });
      P.y = clamp(P.y, T.y0 + 18, T.y1 - 18); if (!(P.y > 330 && P.y < 470)) P.x = clamp(P.x, T.x0 + 18, T.x1 - 18);
    }
    if (!S.anc || Math.hypot(P.x - S.anc.x, P.y - S.anc.y) > 80) { S.anc = { x: P.x, y: P.y }; S.slow = 0; } S.slow += dt; if (S.slow > 2.5) { S.anc = null; S.slow = 0; const dx = 640 - P.x, dy = 400 - P.y, l = Math.hypot(dx, dy) || 1; P.vx = dx / l * 300; P.vy = dy / l * 300; MGH.pop('air jet!', P.x, P.y - 30, '#9fe0ff', 16); }
    P.vx *= Math.exp(-0.25 * dt); P.vy *= Math.exp(-0.25 * dt); P.trail.unshift({ x: P.x, y: P.y }); P.trail.length = Math.min(P.trail.length, 10);
  },
  goal(m, S, j) { const v = S.pk.gold ? 2 : 1; S.score[j] += v; S.flash = 1; S.flashJ = j; Sfx.coin(); MGH.burst(j ? 220 : 1060, 400, ['#ffe680', '#fff', m.players[S.d[j]].color], 30, { speed: 300 }); MGH.shake(6); if (S.score[j] >= 5) { S.ph = 'end'; S.endT = 2.4; return; } this.serve(S, j); },
  bot(m, S, i) {
    const v = m.vin[i], j = S.d.indexOf(i); v.ax = v.ay = 0; if (j < 0) return; const M = S.mal[j], P = S.pk, home = j ? 1030 : 250, mine = j ? P.x > 640 : P.x < 640;
    M.react = M.react || R.range(0.7, 0.92);
    let tx, ty; if (mine && S.wait <= 0) {
      if (!M.aim || (M.aimT -= 1 / 60) <= 0) { const gy = R.range(350, 450), k = R.int(0, 2); M.aim = { x: j ? this.T.x0 : this.T.x1, y: k === 0 ? 2 * (this.T.y0 + 18) - gy : k === 1 ? 2 * (this.T.y1 - 18) - gy : gy }; M.aimT = 1.2; }
      const ax = M.aim.x - P.x, ay = M.aim.y - P.y, al = Math.hypot(ax, ay) || 1, behind = (j ? M.x > P.x - 10 : M.x < P.x + 10);
      if (Math.abs(P.x - (j ? this.T.x1 : this.T.x0)) < 75 && (P.y < 320 || P.y > 480)) { tx = home - (j ? 90 : -90); ty = 400; } else if (behind) { tx = P.x + ax / al * 30; ty = P.y + ay / al * 30; } else { tx = P.x - ax / al * 60; ty = P.y - ay / al * 60 + (M.y < P.y ? -40 : 40); } }
    else { tx = home - (j ? 60 : -60); ty = clamp(P.y + P.vy * 0.3, 340, 460); }
    const dx = tx - M.x, dy = ty - M.y, l = Math.hypot(dx, dy); if (l > 6) { v.ax = dx / l * Math.min(1, l / 40) * M.react; v.ay = dy / l * Math.min(1, l / 40) * M.react; }
  },
  score(m, S) { return DU.scores(m, S.score[0], S.score[1]); },
  fmt(s) { return s < 0 ? 'watching' : `${s} goals`; },
  hud(m, S, i) { const j = S.d.indexOf(i); return j < 0 ? '👀 watching' : `🏒 ${S.score[j]}`; },
  draw(m, S, g) {
    const T = this.T, t = m.t;
    GX.vfill(g, 0, 40, 1280, 680, ['#140a2a', '#24124a']);
    for (let k = 0; k < 10; k++) { MGH.glow(g, 128 * k + 64, 80, 60, `rgba(${k % 2 ? '255,80,200' : '80,200,255'},0.2)`); }
    // table: neon rim, air holes, centre line and circles
    g.fillStyle = 'rgba(0,0,0,0.5)'; MGH.rr(g, T.x0 - 26, T.y0 - 20, T.x1 - T.x0 + 52, T.y1 - T.y0 + 52, 30); g.fill();
    g.fillStyle = '#2a2a48'; MGH.rr(g, T.x0 - 22, T.y0 - 22, T.x1 - T.x0 + 44, T.y1 - T.y0 + 44, 28); g.fill();
    const tg = g.createLinearGradient(0, T.y0, 0, T.y1); tg.addColorStop(0, '#e8f4ff'); tg.addColorStop(1, '#c8dcf0'); g.fillStyle = tg; MGH.rr(g, T.x0, T.y0, T.x1 - T.x0, T.y1 - T.y0, 20); g.fill();
    g.fillStyle = 'rgba(60,80,120,0.18)'; for (let x = T.x0 + 30; x < T.x1; x += 40) for (let y = T.y0 + 25; y < T.y1; y += 40) { g.beginPath(); g.arc(x, y, 2, 0, 7); g.fill(); }
    g.strokeStyle = 'rgba(232,50,62,0.7)'; g.lineWidth = 4; g.beginPath(); g.moveTo(640, T.y0); g.lineTo(640, T.y1); g.stroke(); g.beginPath(); g.arc(640, 400, 70, 0, 7); g.stroke();
    g.strokeStyle = 'rgba(42,106,232,0.6)'; [T.x0, T.x1].forEach(x => { g.beginPath(); g.arc(x, 400, 110, x === T.x0 ? -Math.PI / 2 : Math.PI / 2, x === T.x0 ? Math.PI / 2 : Math.PI * 1.5); g.stroke(); });
    [[T.x0, 0], [T.x1, 1]].forEach(([x, k]) => { const c = MG.TEAMC ? m.players[S.d[1 - k]].color : '#fff'; g.fillStyle = '#111'; g.fillRect(x - (k ? 0 : 14), 330, 14, 140); MGH.glow(g, x, 400, 70, (S.flash > 0 && S.flashJ === 1 - k ? 'rgba(255,230,120,0.9)' : 'rgba(255,255,255,0.15)')); });
    g.save(); g.shadowBlur = 0; g.strokeStyle = '#ff3aa0'; g.lineWidth = 3; MGH.rr(g, T.x0 - 22, T.y0 - 22, T.x1 - T.x0 + 44, T.y1 - T.y0 + 44, 28); g.stroke(); g.restore();
    // puck with trail
    const P = S.pk; P.trail.forEach((q, k) => { g.fillStyle = P.gold ? `rgba(255,210,60,${0.3 - k * 0.03})` : `rgba(40,40,60,${0.25 - k * 0.025})`; g.beginPath(); g.arc(q.x, q.y, 18 - k, 0, 7); g.fill(); });
    if (P.gold) MGH.glow(g, P.x, P.y, 40, 'rgba(255,220,80,0.6)'); const pg = g.createRadialGradient(P.x - 5, P.y - 5, 2, P.x, P.y, 19); pg.addColorStop(0, P.gold ? '#fff6b0' : '#6a6a80'); pg.addColorStop(1, P.gold ? '#d89a10' : '#1a1a2a'); g.fillStyle = pg; g.beginPath(); g.arc(P.x, P.y, 18, 0, 7); g.fill(); g.strokeStyle = 'rgba(255,255,255,0.3)'; g.lineWidth = 2; g.beginPath(); g.arc(P.x, P.y, 12, 0, 7); g.stroke();
    // mallets with the player's hero leaning over the table edge
    S.mal.forEach((M, j) => { const p = m.players[S.d[j]]; Char.draw(g, j ? T.x1 + 90 : T.x0 - 90, M.y, 34, p.el.id, p.color, { mood: MGH.persona(S.flash > 0 ? (S.flashJ === j ? 'cheer' : 'hurt') : 'determined', p.el.id), seed: S.d[j] * 1.7, look: { x: j ? -1 : 1, y: 0 }, hands: { n: { x: 1.4, y: 0, d: 0, o: false, m: true }, f: { x: 1.2, y: 0.3, d: 0, o: false, m: false } } });
      const mg = g.createRadialGradient(M.x - 8, M.y - 8, 3, M.x, M.y, 32); mg.addColorStop(0, Char.shade(p.color, 0.5)); mg.addColorStop(1, Char.shade(p.color, -0.3)); g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.arc(M.x + 4, M.y + 6, 32, 0, 7); g.fill(); g.fillStyle = mg; g.beginPath(); g.arc(M.x, M.y, 32, 0, 7); g.fill(); g.fillStyle = Char.shade(p.color, -0.2); g.beginPath(); g.arc(M.x, M.y, 14, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,0.4)'; g.beginPath(); g.arc(M.x - 4, M.y - 5, 6, 0, 7); g.fill(); });
    // score lights
    S.d.forEach((i, j) => { const p = m.players[i], x = j ? 900 : 380; g.fillStyle = 'rgba(0,0,0,0.6)'; MGH.rr(g, x - 110, 56, 220, 60, 14); g.fill(); g.strokeStyle = p.color; g.lineWidth = 3; g.stroke(); MGH.text(g, p.name, x - 40, 94, 20, p.color, 'center', 'bold'); MGH.text(g, String(S.score[j]), x + 60, 100, 36, '#ffe680', 'center', 'bold'); });
    if (S.wait > 0 && S.ph !== 'end') MGH.label(g, P.gold ? '✨ GOLDEN PUCK — worth 2!' : 'Face-off!', 640, 400 - 90, 24, P.gold ? '#ffe680' : '#fff');
    if (S.ph === 'end') MGH.label(g, `${m.players[S.d[S.score[0] >= 5 ? 0 : 1]].name} wins!`, 640, 400, 34, '#ffe680');
  },
});

// ===================================================================== HOOP DUEL (one-on-one basketball, first to 5)
MG.def({
  id: 'hoopduel', name: 'Hoop Duel', type: 'Duel', mode: 'duel', controls: 'Move + A & B', dur: 0, sport: true,
  rows: [['lr', 'Dribble / defend'], ['a', 'Shoot (or STEAL when defending)'], ['b', 'Jump — block shots!']],
  how: 'One-on-one on the playground court! With the ball, move and press A to take a jump shot — closer is easier, and a defender right in your face makes it harder. Without the ball, press A next to the dribbler to try a STEAL, and press B to JUMP and swat a shot away. Loose balls are anyone\'s! First to 5 baskets wins (shots from beyond the arc count 2).',
  wins: 'First to 5 points.',
  HOOP: { x: 1100, y: 300 }, GY: 620,
  init(m, S) { S.d = DU.pair(m); S.score = [0, 0]; S.p = [0, 1].map(j => ({ x: j ? 760 : 520, y: this.GY, vy: 0, face: 1, jumpT: 0, cd: 0, stun: 0 })); S.ball = { own: R.int(0, 1), x: 0, y: 0, vx: 0, vy: 0, fly: null }; S.msg = ''; S.msgT = 0; S.ph = 'play'; this.check(S, S.ball.own); },
  check(S, j) { S.ball = { own: j, x: 0, y: 0, vx: 0, vy: 0, fly: null }; S.p[j].x = 380; S.p[1 - j].x = 760; S.p.forEach(P => { P.y = this.GY; P.vy = 0; }); S.pause = 1; },
  update(m, S, dt) {
    S.msgT -= dt; if (S.ph === 'end') { if ((S.endT -= dt) <= 0) m.finish(this.score(m, S)); return; }
    if (S.pause > 0) { S.pause -= dt; return; }
    const H = this.HOOP, B = S.ball;
    (Math.random() < 0.5 ? [0, 1] : [1, 0]).forEach(j => { const P = S.p[j], i = S.d[j], a = m.axis(i); P.cd -= dt; P.stun -= dt;
      if (P.stun <= 0) { P.x = clamp(P.x + a.x * (B.own === j ? 250 : 290) * dt, 120, 1150); if (Math.abs(a.x) > 0.3) P.face = Math.sign(a.x); }
      if (P.y >= this.GY && m.pressed(i, 'b') && P.stun <= 0) { P.vy = -620; Sfx.tone(400, 0.05, 'triangle', 0.03); }
      P.vy += 1700 * dt; P.y = Math.min(this.GY, P.y + P.vy * dt); if (P.y >= this.GY) P.vy = 0;
      if (m.pressed(i, 'a') && P.cd <= 0 && P.stun <= 0) { P.cd = 0.5;
        if (B.own === j) { // shoot: success depends on distance and how close the defender is
          const d = Math.abs(H.x - P.x), D = S.p[1 - j], guard = Math.abs(D.x - P.x) < 80 ? 0.25 : 0, three = d > 420, pr = clamp(0.92 - d / 900 - guard, 0.12, 0.9);
          B.own = -1; B.fly = { sx: P.x, sy: P.y - 90, t: 0, T: 0.9, made: Math.random() < pr, three, by: j }; Sfx.whoosh(false); }
        else if (B.own === 1 - j && Math.abs(S.p[1 - j].x - P.x) < 70) { if (Math.random() < 0.38) { B.own = j; S.msg = 'STOLEN!'; S.msgT = 1; Sfx.coin(); } else { P.stun = 0.4; S.msg = 'reach-in!'; S.msgT = 0.7; } } }
    });
    if (B.own >= 0) { const P = S.p[B.own]; B.x = P.x + P.face * 30; B.y = P.y - 20 - Math.abs(Math.sin(m.t * 9)) * 40; }
    else if (B.fly) { const F = B.fly; F.t += dt; const k = Math.min(1, F.t / F.T), tx = F.made ? H.x - 40 : H.x - 40 + R.range(-1, 1) * 0, ty = H.y; B.x = F.sx + (tx - F.sx) * k; B.y = F.sy + (ty - F.sy) * k - Math.sin(k * Math.PI) * 180;
      const D = S.p[1 - F.by]; if (k < 0.4 && D.y < this.GY - 60 && Math.abs(D.x - B.x) < 50 && Math.abs((D.y - 90) - B.y) < 60) { B.fly = null; B.vx = (D.x < B.x ? 1 : -1) * 260; B.vy = -200; S.msg = 'BLOCKED!'; S.msgT = 1.2; Sfx.thud(); MGH.shake(4); return; }
      if (k >= 1) { if (F.made) { const v = F.three ? 2 : 1; S.score[F.by] += v; S.msg = F.three ? 'FROM DOWNTOWN! +2' : 'SWISH! +1'; S.msgT = 1.4; Sfx.coin(); MGH.burst(H.x - 40, H.y, ['#ffe680', '#fff'], 20, { speed: 200 }); if (S.score[F.by] >= 5) { S.ph = 'end'; S.endT = 2.4; return; } this.check(S, 1 - F.by); }
        else { B.fly = null; B.vx = R.range(-280, -120); B.vy = -260; S.msg = 'clank!'; S.msgT = 0.8; Sfx.tone(180, 0.1, 'square', 0.03); } } }
    else { B.vy += 1400 * dt; B.x += B.vx * dt; B.y += B.vy * dt; if (B.y > this.GY - 14) { B.y = this.GY - 14; B.vy = -Math.abs(B.vy) * 0.6; B.vx *= 0.8; } if (B.x < 120 || B.x > 1150) B.vx *= -1;
      const near = [0, 1].filter(j => Math.abs(S.p[j].x - B.x) < 40 && Math.abs(S.p[j].y - 40 - B.y) < 80).sort((a, b) => Math.abs(S.p[a].x - B.x) - Math.abs(S.p[b].x - B.x) + R.range(-8, 8)); if (near.length) { B.own = near[0]; Sfx.click(); } }
  },
  bot(m, S, i) {
    const v = m.vin[i], j = S.d.indexOf(i); v.a = v.b = false; v.ax = 0; if (j < 0 || S.pause > 0) return; const P = S.p[j], B = S.ball, D = S.p[1 - j], H = this.HOOP;
    if (B.own === j) { const want = R.range(0, 1) < 0.5 ? 760 : 900; P.goalX = P.goalX || R.range(650, 960); if (Math.abs(P.x - P.goalX) > 20) v.ax = Math.sign(P.goalX - P.x); else if (P.cd <= 0) { v.a = !m.prev[i].a; P.goalX = null; } return; }
    if (B.fly && B.fly.by !== j && B.fly.t < 0.25 && Math.abs(P.x - B.x) < 90 && Math.random() < 0.25) { v.b = true; return; }
    if (B.own < 0 && !B.fly) { v.ax = Math.sign(B.x - P.x); return; }
    if (B.own === 1 - j) { const gx = D.x + 50; v.ax = Math.abs(gx - P.x) > 14 ? Math.sign(gx - P.x) : 0; if (Math.abs(D.x - P.x) < 60 && P.cd <= 0 && Math.random() < 0.04) v.a = true; }
  },
  score(m, S) { return DU.scores(m, S.score[0], S.score[1]); },
  fmt(s) { return s < 0 ? 'watching' : `${s} pts`; },
  hud(m, S, i) { const j = S.d.indexOf(i); return j < 0 ? '👀 watching' : `🏀 ${S.score[j]}`; },
  draw(m, S, g) {
    const t = m.t, H = this.HOOP;
    // sunny playground: city skyline, chain fence, painted asphalt court
    GX.vfill(g, 0, 40, 1280, 460, ['#7ac0f0', '#c8e4f8']);
    for (let k = 0; k < 14; k++) { const h = 100 + MGH.hash(k) * 160; g.fillStyle = '#9ab0c8'; g.fillRect(k * 96, 500 - h, 84, h); for (let w = 0; w < 6; w++) { g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(k * 96 + 10 + (w % 3) * 24, 520 - h + Math.floor(w / 3) * 30, 12, 16); } }
    g.strokeStyle = 'rgba(120,130,140,0.6)'; g.lineWidth = 1.5; for (let x = 0; x < 1280; x += 24) { g.beginPath(); g.moveTo(x, 380); g.lineTo(x + 24, 500); g.moveTo(x + 24, 380); g.lineTo(x, 500); g.stroke(); } g.fillStyle = '#7a8088'; g.fillRect(0, 376, 1280, 6);
    GX.vfill(g, 0, 500, 1280, 220, ['#5a6a7a', '#3a4a5a']);
    g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = 4; g.beginPath(); g.moveTo(0, 640); g.lineTo(1280, 640); g.stroke(); g.beginPath(); g.ellipse(H.x, 640, 420, 70, 0, Math.PI, Math.PI * 1.5); g.stroke(); g.fillStyle = 'rgba(232,90,60,0.35)'; g.fillRect(H.x - 220, 600, 220, 40);
    // hoop: pole, backboard, rim and net
    g.fillStyle = '#4a4a54'; g.fillRect(H.x + 70, H.y - 40, 14, 340); g.fillStyle = '#fff'; MGH.rr(g, H.x + 20, H.y - 110, 16, 150, 4); g.fill(); g.strokeStyle = '#e8323e'; g.lineWidth = 3; g.strokeRect(H.x + 22, H.y - 60, 12, 50);
    g.strokeStyle = '#ff6a1a'; g.lineWidth = 5; g.beginPath(); g.ellipse(H.x - 40, H.y, 42, 8, 0, 0, 7); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 1.5; for (let k = -3; k <= 3; k++) { g.beginPath(); g.moveTo(H.x - 40 + k * 12, H.y + 4); g.lineTo(H.x - 40 + k * 7, H.y + 50); g.stroke(); } g.beginPath(); g.moveTo(H.x - 72, H.y + 22); g.lineTo(H.x - 8, H.y + 22); g.moveTo(H.x - 64, H.y + 40); g.lineTo(H.x - 16, H.y + 40); g.stroke();
    // players
    S.p.forEach((P, j) => { const p = m.players[S.d[j]], has = S.ball.own === j, air = P.y < this.GY; GX.shadow(g, P.x, this.GY + 6, 30 - (this.GY - P.y) * 0.08, 0.35);
      Char.draw(g, P.x, P.y - 44, 34, p.el.id, p.color, { mood: MGH.persona(P.stun > 0 ? 'dizzy' : has ? 'determined' : air ? 'cheer' : 'happy', p.el.id), seed: S.d[j] * 1.7, look: { x: has ? 1 : (S.ball.x > P.x ? 1 : -1), y: 0 }, walk: Math.abs(m.axis(S.d[j]).x) > 0.3 ? 1 : 0, noShadow: true, hands: air ? { n: { x: 0.6, y: -1.6, d: -90, o: true, m: true }, f: { x: -0.4, y: -1.4, d: -90, o: true, m: false } } : has ? { n: { x: 0.9, y: 0.3, d: 0, o: true, m: true }, f: { x: -0.6, y: 0.2, d: 0, o: true, m: false } } : undefined }); });
    // the ball
    const B = S.ball; if (!(B.own < 0 && !B.fly && B.y > 700)) { GX.shadow(g, B.x, this.GY + 4, 14, 0.25); const bg = g.createRadialGradient(B.x - 4, B.y - 4, 2, B.x, B.y, 15); bg.addColorStop(0, '#ffb070'); bg.addColorStop(1, '#c85a14'); g.fillStyle = bg; g.beginPath(); g.arc(B.x, B.y, 14, 0, 7); g.fill(); g.strokeStyle = '#3a1a08'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(B.x - 14, B.y); g.lineTo(B.x + 14, B.y); g.moveTo(B.x, B.y - 14); g.lineTo(B.x, B.y + 14); g.stroke(); g.beginPath(); g.arc(B.x - 18, B.y, 14, -0.9, 0.9); g.arc(B.x + 18, B.y, 14, 2.2, 4.1); g.stroke(); }
    S.d.forEach((i, j) => { const p = m.players[i], x = j ? 900 : 380; g.fillStyle = 'rgba(0,0,0,0.55)'; MGH.rr(g, x - 110, 56, 220, 60, 14); g.fill(); g.strokeStyle = p.color; g.lineWidth = 3; g.stroke(); MGH.text(g, p.name, x - 40, 94, 20, p.color, 'center', 'bold'); MGH.text(g, String(S.score[j]), x + 60, 100, 34, '#ffe680', 'center', 'bold'); });
    if (S.msgT > 0) MGH.label(g, S.msg, 640, 200, 28, '#ffe680');
    if (S.ph === 'end') MGH.label(g, `${m.players[S.d[S.score[0] >= 5 ? 0 : 1]].name} wins the duel!`, 640, 260, 32, '#ffe680');
  },
});

// ===================================================================== BOXING (jab, hooks, guard — knock 'em down!)
MG.def({
  id: 'boxing', name: 'Boxing', type: 'Duel', mode: 'duel', controls: 'Move + A & B', dur: 0,
  rows: [['lr', 'Step in / out'], ['a', 'Jab · toward + A = power HOOK'], ['b', 'Hold to guard (time it for a parry!)']],
  how: 'Glove up for a championship bout! Step left and right around the ring. A throws a quick JAB; push TOWARD your rival and press A for a big HOOK (more damage, slower to recover). HOLD B to guard — and if you raise your guard just before a punch lands, you PARRY it and leave them wobbling. Empty their energy to knock them down — three knockdowns (or the most energy after 75 seconds) wins!',
  wins: 'Three knockdowns, or most energy at the bell.',
  init(m, S) { S.d = DU.pair(m); S.b = [0, 1].map(j => ({ x: j ? 790 : 490, hp: 100, kd: 0, st: 'idle', t: 0, kind: '', guard: 0, gT: 0, stag: 0, down: 0, hit: 0, face: j ? -1 : 1 })); S.time = 75; S.ph = 'fight'; S.ref = 0; },
  update(m, S, dt) {
    if (S.ph === 'end') { if ((S.endT -= dt) <= 0) m.finish(this.score(m, S)); return; }
    S.time -= dt; if (S.time <= 0) { S.ph = 'end'; S.endT = 2.6; S.bell = true; Sfx.whistle(); return; }
    S.b.forEach((B, j) => { const i = S.d[j], O = S.b[1 - j], a = m.axis(i); B.hit -= dt; B.stag -= dt;
      if (B.down > 0) { B.down -= dt; S.ref += dt; if (B.down <= 0) { B.hp = 60; S.ref = 0; } return; }
      B.face = O.x > B.x ? 1 : -1;
      B.guard = m.held(i, 'b') && B.stag <= 0 && B.st === 'idle'; if (m.pressed(i, 'b')) B.gT = 0.18; B.gT -= dt;
      if (B.st === 'idle' && B.stag <= 0 && !B.guard) { const nx = B.x + a.x * 220 * dt; if (Math.abs(nx - O.x) > 140) B.x = clamp(nx, 300, 980); }
      if (B.st === 'idle' && B.stag <= 0 && !B.guard && m.pressed(i, 'a')) { const hook = Math.abs(a.x) > 0.4 && Math.sign(a.x) === B.face; B.st = 'punch'; B.kind = hook ? (a.x > 0 ? 'hookR' : 'hookL') : 'jab'; B.t = 0; Sfx.whoosh(false); }
      if (B.st === 'punch') { B.t += dt; const hook = B.kind !== 'jab', hitAt = hook ? 0.28 : 0.12, end = hook ? 0.7 : 0.32;
        if (B.t >= hitAt && !B.landed) { B.landed = true; if (Math.abs(O.x - B.x) < (hook ? 200 : 190) && O.down <= 0) {
          if (O.guard && O.gT > 0) { B.stag = 0.9; B.st = 'idle'; B.landed = false; MGH.pop('PARRY!', O.x, 300, '#9fe0ff', 26); Sfx.tone(900, 0.1, 'triangle', 0.06); return; }
          const dmg = O.guard ? (hook ? 4 : 1) : (hook ? 13 : 5); O.hp -= dmg; O.hit = 0.3; O.x = clamp(O.x + B.face * (hook ? 40 : 14), 300, 980); Sfx.thud(); MGH.burst((B.x + O.x) / 2, 330, ['#fff', '#ffe680'], hook ? 14 : 6, { speed: 200 }); if (hook && !O.guard) MGH.shake(5);
          if (O.hp <= 0) { O.kd++; O.down = 3.2; O.hp = 0; S.ref = 0; Sfx.boom(); MGH.shake(10); if (O.kd >= 3) { S.ph = 'end'; S.endT = 3; } } } }
        if (B.t >= end) { B.st = 'idle'; B.landed = false; } }
    });
  },
  bot(m, S, i) {
    const v = m.vin[i], j = S.d.indexOf(i); v.a = v.b = false; v.ax = 0; if (j < 0) return; const B = S.b[j], O = S.b[1 - j]; if (B.down > 0) return;
    const d = Math.abs(O.x - B.x); B.bt = (B.bt || 0) - 1 / 60;
    if (O.st === 'punch' && O.t < 0.15 && d < 160 && Math.random() < 0.35) { v.b = true; return; }
    if (B.guarding > 0) { B.guarding -= 1 / 60; v.b = true; return; }
    if (d > 180) { v.ax = B.face; return; }
    if (B.bt <= 0 && B.st === 'idle') { B.bt = R.range(0.35, 0.8); if (Math.random() < 0.35) { v.ax = B.face; } v.a = true; if (Math.random() < 0.15) B.guarding = R.range(0.3, 0.7); }
    else if (d < 150) v.ax = -B.face * 0.6;
  },
  score(m, S) { return DU.scores(m, S.b[1].kd * 100 + S.b[0].hp, S.b[0].kd * 100 + S.b[1].hp); },
  fmt(s) { return s < 0 ? 'watching' : `${Math.floor(s / 100)} knockdowns`; },
  hud(m, S, i) { const j = S.d.indexOf(i); return j < 0 ? '👀 watching' : `🥊 ${Math.max(0, Math.round(S.b[j].hp))}`; },
  glove(g, x, y, col, s = 1) { g.save(); g.translate(x, y); g.scale(s, s); const gg = g.createRadialGradient(-4, -5, 2, 0, 0, 16); gg.addColorStop(0, Char.shade(col, 0.4)); gg.addColorStop(1, Char.shade(col, -0.3)); g.fillStyle = gg; g.beginPath(); g.ellipse(0, 0, 15, 13, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(-6, -10, 7, 6, 0, 0, 7); g.fill(); g.fillStyle = '#fff'; g.fillRect(-12, 9, 18, 6); g.fillStyle = 'rgba(255,255,255,0.4)'; g.beginPath(); g.ellipse(-4, -5, 5, 3, -0.4, 0, 7); g.fill(); g.restore(); },
  draw(m, S, g) {
    const t = m.t;
    GX.vfill(g, 0, 40, 1280, 680, ['#0a0a1a', '#1a1a3a']);
    // spotlights + crowd
    g.save(); g.globalCompositeOperation = 'lighter'; [380, 900].forEach(x => { const sp = g.createLinearGradient(0, 40, 0, 600); sp.addColorStop(0, 'rgba(255,250,220,0.22)'); sp.addColorStop(1, 'rgba(255,250,220,0.02)'); g.fillStyle = sp; g.beginPath(); g.moveTo(x - 20, 40); g.lineTo(x + 20, 40); g.lineTo(x + 260, 600); g.lineTo(x - 260, 600); g.fill(); }); g.restore();
    MGH.crowd(g, t, 300, 34);
    for (let k = 0; k < 20; k++) if (Math.sin(t * 4 + k * 3.1) > 0.97) MGH.glow(g, MGH.hash(k) * 1280, 220 + MGH.hash(k + 1) * 80, 30, 'rgba(255,255,255,0.8)'); // camera flashes
    // the ring: apron, canvas, posts and three ropes
    g.fillStyle = '#1a3a7a'; g.beginPath(); g.moveTo(180, 520); g.lineTo(1100, 520); g.lineTo(1160, 640); g.lineTo(120, 640); g.fill(); MGH.text(g, 'YUPPIES CHAMPIONSHIP', 640, 600, 22, 'rgba(255,255,255,0.7)', 'center', 'bold');
    const cg = g.createLinearGradient(0, 420, 0, 520); cg.addColorStop(0, '#e8e0d0'); cg.addColorStop(1, '#c8bca8'); g.fillStyle = cg; g.beginPath(); g.moveTo(240, 420); g.lineTo(1040, 420); g.lineTo(1100, 520); g.lineTo(180, 520); g.fill();
    [[240, 420], [1040, 420], [180, 520], [1100, 520]].forEach(([x, y], k) => { g.fillStyle = k % 2 ? '#e8323e' : '#2a6ae8'; g.fillRect(x - 7, y - 150, 14, 150); g.fillStyle = '#fff'; g.fillRect(x - 9, y - 156, 18, 10); });
    for (let r = 0; r < 3; r++) { g.strokeStyle = ['#e8323e', '#fff', '#2a6ae8'][r]; g.lineWidth = 4; const yb = 470 - r * 42, yt = 370 - r * 42; g.beginPath(); g.moveTo(180, yb + 50); g.lineTo(240, yt + 50); g.lineTo(1040, yt + 50); g.lineTo(1100, yb + 50); g.stroke(); }
    // referee
    const anyDown = S.b.some(B => B.down > 0); Char.npc(g, 640, 360, 26, 'ref', { mood: anyDown ? 'shock' : 'happy', t, hands: anyDown ? { n: { x: 1.2, y: -1.2 + Math.sin(t * 6) * 0.4, d: -60, o: true, m: true }, f: { x: -0.6, y: 0.3, d: 0, o: true, m: false } } : undefined });
    if (anyDown) { const n = Math.min(10, 1 + Math.floor(S.ref / 0.32)); MGH.label(g, String(n), 640, 270, 44, '#ffe680'); }
    // boxers
    S.b.forEach((B, j) => { const p = m.players[S.d[j]], y = 430, f = B.face, k = B.st === 'punch' ? (B.kind === 'jab' ? Math.sin(Math.min(1, B.t / 0.32) * Math.PI) : Math.sin(Math.min(1, B.t / 0.7) * Math.PI)) : 0;
      if (B.down > 0) { g.save(); g.translate(B.x, y + 30); g.rotate(-f * 1.4); Char.draw(g, 0, -30, 38, p.el.id, p.color, { mood: 'dizzy', seed: S.d[j] * 1.7, noShadow: true }); g.restore(); for (let q = 0; q < 3; q++) { const a = t * 5 + q * 2.1; MGH.star(g, B.x + Math.cos(a) * 30, y - 10 + Math.sin(a) * 8, 7, '#ffe680', a, false); } return; }
      const bob = Math.sin(t * 6 + j) * 4, lean = B.st === 'punch' ? f * k * 0.25 : B.hit > 0 ? -f * 0.25 : B.stag > 0 ? Math.sin(t * 20) * 0.15 : 0;
      GX.shadow(g, B.x, y + 64, 50, 0.35);
      g.save(); g.translate(B.x, y + 60); g.rotate(lean);
      Char.draw(g, 0, -60 + bob, 40, p.el.id, p.color, { mood: MGH.persona(B.hit > 0 ? 'hurt' : B.stag > 0 ? 'dizzy' : B.st === 'punch' ? 'angry' : 'determined', p.el.id), seed: S.d[j] * 1.7, look: { x: f, y: 0 }, noShadow: true, noArms: true });
      g.restore();
      // gloves: guard up, jab straight, hook swings round
      const gx = B.x, gy = y - 6 + bob, col = j ? '#2a6ae8' : '#e8323e';
      let lx = gx + f * 30, ly = gy - 18, rx = gx + f * 44, ry = gy;
      if (B.guard) { lx = gx + f * 30; ly = gy - 34; rx = gx + f * 38; ry = gy - 22; }
      if (B.st === 'punch') { if (B.kind === 'jab') { rx = gx + f * (44 + k * 70); ry = gy - 14; } else { const a = (B.kind === 'hookR' ? -1 : 1) * (1 - k) * 1.4; rx = gx + f * (40 + k * 62) ; ry = gy - 20 - Math.sin(k * Math.PI) * 26 + a * 10; } }
      this.glove(g, lx, ly, col, 1.0); this.glove(g, rx, ry, col, B.st === 'punch' && B.kind !== 'jab' ? 1.25 : 1.1);
      if (B.st === 'punch' && B.kind !== 'jab' && k > 0.6) { g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 3; g.beginPath(); g.arc(gx + f * 40, gy - 20, 60, f > 0 ? -1.2 : Math.PI + 0.2, f > 0 ? -0.2 : Math.PI + 1.2); g.stroke(); }
      // energy bars + knockdown pips
      const bx = j ? 760 : 120; g.fillStyle = 'rgba(0,0,0,0.6)'; MGH.rr(g, bx, 60, 400, 50, 12); g.fill(); g.strokeStyle = p.color; g.lineWidth = 3; g.stroke(); MGH.text(g, p.name, bx + 14, 82, 18, p.color, 'left', 'bold');
      const hg = g.createLinearGradient(bx + 14, 0, bx + 386, 0); hg.addColorStop(0, '#ff4a3a'); hg.addColorStop(0.5, '#ffd34d'); hg.addColorStop(1, '#5ae85a'); g.fillStyle = 'rgba(255,255,255,0.15)'; MGH.rr(g, bx + 14, 90, 372, 12, 6); g.fill(); g.fillStyle = hg; MGH.rr(g, bx + 14, 90, 372 * clamp(B.hp / 100, 0, 1), 12, 6); g.fill();
      for (let q = 0; q < 3; q++) { g.fillStyle = q < B.kd ? '#ff4a3a' : 'rgba(255,255,255,0.2)'; g.beginPath(); g.arc(bx + 330 + q * 20, 78, 7, 0, 7); g.fill(); }
    });
    MGH.label(g, `⏱ ${Math.max(0, Math.ceil(S.time))}`, 640, 80, 22, '#fff');
    if (S.ph === 'end') { const w = this.score(m, S), [a, b] = S.d, win = w[a] >= w[b] ? 0 : 1; MGH.label(g, `${S.bell ? 'The bell! ' : 'K.O.! '}${m.players[S.d[win]].name} is the champ!`, 640, 230, 32, '#ffe680'); }
  },
});

// ===================================================================== TREASURE DIG (detector beeps — dig up the chest first)
MG.def({
  id: 'treasuredig', name: 'Treasure Dig', type: 'Duel', mode: 'duel', controls: 'Move + A', dur: 0,
  rows: [['stick', 'Sweep your metal detector'], ['a', 'Dig here']],
  how: 'Each of you has your own patch of beach with a treasure chest buried somewhere in it. Sweep your METAL DETECTOR around — the closer you get, the faster it beeps and the brighter the light glows. Press A to DIG a spot (it takes a moment). Wrong spot? Maybe an old boot… First to dig up their chest wins the round. Best of three.',
  wins: 'Best of 3 rounds.',
  COLS: 8, ROWS: 5, CS: 64,
  init(m, S) { S.d = DU.pair(m); S.wins = [0, 0]; S.round = 0; this.newRound(S); },
  newRound(S) { S.round++; S.ph = 'dig'; S.pt = 0; S.winner = -1; S.f = [0, 1].map(j => ({ x: 4 * 64, y: 2 * 64, chest: { c: R.int(0, 7), r: R.int(0, 4) }, dug: new Set(), digT: 0, cell: null, beep: 0, finds: [] })); },
  ox(j) { return j ? 690 : 70; }, oy: 250,
  update(m, S, dt) {
    S.pt += dt;
    if (S.ph === 'won') { if (S.pt > 2.8) { if (S.wins.some(w => w >= 2)) m.finish(this.score(m, S)); else this.newRound(S); } return; }
    S.d.forEach((i, j) => { const F = S.f[j], a = m.axis(i);
      if (F.digT > 0) { F.digT -= dt; if (F.digT <= 0) { const key = F.cell.c + ',' + F.cell.r; F.dug.add(key); if (F.cell.c === F.chest.c && F.cell.r === F.chest.r) { S.wins[j]++; S.winner = j; S.ph = 'won'; S.pt = 0; Sfx.coin(); MGH.burst(this.ox(j) + F.cell.c * 64 + 32, this.oy + F.cell.r * 64 + 32, ['#ffe680', '#fff'], 30, { speed: 260 }); } else { F.finds.push({ ...F.cell, k: R.pick(['🥾', '🐚', '🦀', '🪨', '🥫']) }); Sfx.tone(240, 0.08, 'triangle', 0.03); } } return; }
      F.x = clamp(F.x + a.x * 280 * dt, 0, 8 * 64 - 1); F.y = clamp(F.y + a.y * 280 * dt, 0, 5 * 64 - 1);
      const c = Math.floor(F.x / 64), r = Math.floor(F.y / 64);
      if (m.pressed(i, 'a') && !F.dug.has(c + ',' + r)) { F.cell = { c, r }; F.digT = 0.7; Sfx.thud(); }
      const dd = Math.hypot(F.x - (F.chest.c * 64 + 32), F.y - (F.chest.r * 64 + 32)); F.near = clamp(1 - dd / 380, 0, 1); F.beep -= dt * (0.6 + F.near * 7); if (F.beep <= 0) { F.beep = 1; F.blip = 0.12; if (!m.bot(i)) Sfx.tone(600 + F.near * 900, 0.04, 'sine', 0.025); } F.blip = (F.blip || 0) - dt;
    });
  },
  bot(m, S, i) {
    const v = m.vin[i], j = S.d.indexOf(i); v.a = false; v.ax = v.ay = 0; if (j < 0 || S.ph !== 'dig') return; const F = S.f[j]; if (F.digT > 0) return;
    // a sweeping search that homes in as the beeping speeds up
    F.goal = F.goal && Math.random() > 0.01 ? F.goal : null;
    if (!F.goal || (Math.abs(F.goal.x - F.x) < 10 && Math.abs(F.goal.y - F.y) < 10)) {
      if (F.near > 0.82 + R.range(-0.05, 0.05)) { const c = Math.floor(F.x / 64), r = Math.floor(F.y / 64); if (!F.dug.has(c + ',' + r)) { v.a = true; F.best = null; return; } }
      const step = 40 + (1 - F.near) * 90, cand = [0, 1, 2, 3, 4, 5, 6, 7].map(k => { const a = k / 8 * 6.28; return { x: clamp(F.x + Math.cos(a) * step, 10, 500), y: clamp(F.y + Math.sin(a) * step, 10, 310) }; });
      const sense = p => 1 - Math.hypot(p.x - (F.chest.c * 64 + 32), p.y - (F.chest.r * 64 + 32)) / 380 + R.range(-0.3, 0.3);
      F.goal = cand.sort((p, q) => sense(q) - sense(p))[0];
    }
    const dx = F.goal.x - F.x, dy = F.goal.y - F.y, l = Math.hypot(dx, dy) || 1; v.ax = dx / l * 0.55; v.ay = dy / l * 0.55;
  },
  score(m, S) { return DU.scores(m, S.wins[0], S.wins[1]); },
  fmt(s) { return s < 0 ? 'watching' : `${s} chest${s === 1 ? '' : 's'}`; },
  hud(m, S, i) { const j = S.d.indexOf(i); return j < 0 ? '👀 watching' : `🪙 ${S.wins[j]}`; },
  draw(m, S, g) {
    const t = m.t;
    GX.vfill(g, 0, 40, 1280, 190, ['#5ab0f0', '#bfe4fa']); GX.vfill(g, 0, 150, 1280, 70, ['#2a8ac8', '#5ab8e0']);
    for (let k = 0; k < 10; k++) { g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 2; const x = (k * 140 + t * 20) % 1400 - 60; g.beginPath(); g.moveTo(x, 170 + (k % 3) * 14); g.quadraticCurveTo(x + 20, 164 + (k % 3) * 14, x + 40, 170 + (k % 3) * 14); g.stroke(); }
    GX.vfill(g, 0, 214, 1280, 506, ['#f4dca0', '#e8c880']);
    for (let k = 0; k < 120; k++) { g.fillStyle = 'rgba(190,150,90,0.3)'; g.fillRect(MGH.hash(k) * 1280, 220 + MGH.hash(k + 5) * 500, 2, 2); }
    [[640, 300, '🌴'], [640, 560, '🐚']].forEach(([x, y, e]) => MGH.text(g, e, x, y, 48, '#fff'));
    S.d.forEach((i, j) => { const F = S.f[j], p = m.players[i], ox = this.ox(j), oy = this.oy;
      g.fillStyle = 'rgba(160,120,60,0.18)'; MGH.rr(g, ox - 10, oy - 10, 8 * 64 + 20, 5 * 64 + 20, 14); g.fill(); g.strokeStyle = p.color; g.lineWidth = 3; g.setLineDash([10, 8]); g.stroke(); g.setLineDash([]);
      F.dug.forEach(key => { const [c, r] = key.split(',').map(Number), x = ox + c * 64, y = oy + r * 64; g.fillStyle = '#b8904a'; g.beginPath(); g.ellipse(x + 32, y + 36, 26, 16, 0, 0, 7); g.fill(); g.fillStyle = '#8a6a38'; g.beginPath(); g.ellipse(x + 32, y + 38, 18, 10, 0, 0, 7); g.fill(); });
      F.finds.forEach(f => MGH.text(g, f.k, ox + f.c * 64 + 32, oy + f.r * 64 + 44, 24, '#fff'));
      if (S.ph === 'won' && S.winner === j) { const x = ox + F.chest.c * 64 + 32, y = oy + F.chest.r * 64 + 34; MGH.glow(g, x, y, 80, 'rgba(255,220,80,0.7)'); g.fillStyle = '#8a5a2a'; MGH.rr(g, x - 26, y - 14, 52, 32, 6); g.fill(); g.fillStyle = '#ffd34d'; g.fillRect(x - 26, y - 4, 52, 5); g.fillStyle = '#a86a2a'; g.beginPath(); g.ellipse(x, y - 14, 26, 12, 0, Math.PI, 0); g.fill(); for (let q = 0; q < 5; q++) MGH.coin(g, x - 20 + q * 10, y - 24 - Math.abs(Math.sin(t * 6 + q)) * 10, 6, t * 5 + q); }
      // the hero with the detector sweeping over the sand
      const dx = ox + F.x, dy = oy + F.y, dig = F.digT > 0, sw = Math.sin(t * 6) * 10;
      if (dig) { for (let q = 0; q < 4; q++) { const ph = (t * 3 + q / 4) % 1; g.fillStyle = `rgba(200,160,90,${1 - ph})`; g.beginPath(); g.arc(dx + Math.cos(q * 1.6) * 30 * ph, dy - ph * 40 + ph * ph * 30, 4, 0, 7); g.fill(); } }
      g.strokeStyle = '#5a5a60'; g.lineWidth = 3; g.beginPath(); g.moveTo(dx - 24, dy - 40); g.lineTo(dx + sw * (dig ? 0 : 1), dy + 4); g.stroke();
      g.fillStyle = '#3a3a48'; g.beginPath(); g.ellipse(dx + sw * (dig ? 0 : 1), dy + 6, 16, 6, 0, 0, 7); g.fill(); g.fillStyle = F.blip > 0 ? `rgba(${Math.round(120 + F.near * 135)},${Math.round(255 - F.near * 120)},80,1)` : '#5a5a60'; g.beginPath(); g.arc(dx - 22, dy - 42, 5, 0, 7); g.fill(); if (F.blip > 0) MGH.glow(g, dx - 22, dy - 42, 16 + F.near * 20, `rgba(255,${Math.round(220 - F.near * 140)},80,0.8)`);
      Char.draw(g, dx - 40, dy - 54 + (dig ? Math.sin(t * 20) * 3 : 0), 26, p.el.id, p.color, { mood: MGH.persona(S.ph === 'won' ? (S.winner === j ? 'cheer' : 'sad') : F.near > 0.75 ? 'shock' : 'determined', p.el.id), seed: i * 1.7, look: { x: 1, y: 0.4 }, walk: Math.abs(m.axis(i).x) + Math.abs(m.axis(i).y) > 0.3 ? 1 : 0, hands: { n: { x: 0.65, y: 0.25, d: 30, o: false, m: true }, f: { x: 0.4, y: 0.4, d: 30, o: false, m: false } } });
      if (dig) MGH.text(g, '⛏️', dx + 10, dy - 20 - Math.abs(Math.sin(t * 16)) * 14, 28, '#fff');
      g.fillStyle = 'rgba(0,0,0,0.45)'; MGH.rr(g, ox + 130, 222, 252, 26, 13); g.fill(); MGH.text(g, `${p.name} · 🪙 ${S.wins[j]}`, ox + 256, 241, 16, p.color, 'center', 'bold');
    });
    MGH.label(g, `Round ${S.round} / 3`, 640, 80, 20, '#fff');
    if (S.ph === 'won') MGH.label(g, `${m.players[S.d[S.winner]].name} struck gold!`, 640, 130, 28, '#ffe680');
  },
});
