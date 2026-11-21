'use strict';
// Party batch 11: Map Memory, Ship Battle (2v2), Copy Chain, Masquerade, Frog Catch, Scoop Stack

// ======================================================================== MAP MEMORY (remember the treasure path, walk it)
MG.def({
  id: 'mapmem', name: 'Map Memory', type: 'Memory', controls: 'Move', dur: 0,
  rows: [['pad', 'Step along the path']],
  how: 'The treasure map shows a dotted path for a few seconds — memorise it! Then the map rolls up and you walk the path yourself with the d-pad or stick, one square per press. Step off the path and you\'re back at the start. First to reach the X scores 3, then 2, then 1. Paths get longer.',
  wins: 'Most points after five maps.',
  N: 6, CS: 50,
  init(m, S) { S.pts = [0, 0, 0, 0]; S.round = 0; this.next(S); },
  next(S) {
    S.round++; const len = 4 + S.round; let path; do { path = [[0, this.N - 1]]; let ok = true; while (path.length < len + 1 && ok) { const [x, y] = path[path.length - 1], opts = [[1, 0], [-1, 0], [0, -1], [0, 1]].map(([dx, dy]) => [x + dx, y + dy]).filter(([a, b]) => a >= 0 && b >= 0 && a < this.N && b < this.N && !path.some(([c, d]) => c === a && d === b)); if (!opts.length) ok = false; else path.push(R.pick(opts)); } if (ok) break; } while (true);
    S.path = path; S.ph = 'show'; S.pt = 0; S.order = []; S.p = [0, 1, 2, 3].map(() => ({ k: 0, fx: 0, ax: '', fin: 0, bt: R.range(0.3, 0.5), acc: R.range(0.85, 0.97) }));
  },
  update(m, S, dt) {
    S.pt += dt;
    if (S.ph === 'show') { if (S.pt > 1.2 + S.path.length * 0.45) { S.ph = 'walk'; S.pt = 0; Sfx.tone(500, 0.12, 'triangle', 0.04); } return; }
    if (S.ph === 'walk') {
      S.p.forEach((P, i) => {
        P.fx -= dt; if (P.fin) return;
        const a = m.axis(i), now = a.x < -0.6 ? 'left' : a.x > 0.6 ? 'right' : a.y < -0.6 ? 'up' : a.y > 0.6 ? 'down' : '';
        const d = (m.bot(i) ? null : ['left', 'right', 'up', 'down'].find(k => m.pressed(i, k))) || (now && now !== P.ax ? now : null); P.ax = now; if (!d) return;
        const [x, y] = S.path[P.k], [nx, ny] = [x + (d === 'right') - (d === 'left'), y + (d === 'down') - (d === 'up')], [tx, ty] = S.path[P.k + 1];
        if (nx === tx && ny === ty) { P.k++; Sfx.tone(500 + P.k * 40, 0.04, 'triangle', 0.03); if (P.k >= S.path.length - 1) { P.fin = S.pt; S.order.push(i); S.pts[i] += [3, 2, 1, 0][S.order.length - 1]; Sfx.coin(); } }
        else { P.k = 0; P.fx = 0.5; Sfx.bad(); }
      });
      if (S.order.length >= 3 || S.p.every(P => P.fin) || S.pt > 20) { S.ph = 'end'; S.pt = 0; }
      return;
    }
    if (S.pt > 2.4) { if (S.round >= 5) m.finish(S.pts.slice()); else this.next(S); }
  },
  bot(m, S, i, dt) {
    const P = S.p[i], v = m.vin[i]; v.ax = v.ay = 0; if (S.ph !== 'walk' || P.fin) return;
    P.bt -= dt; if (P.bt > 0) return; P.bt = R.range(0.25, 0.5);
    const [x, y] = S.path[P.k]; let [tx, ty] = S.path[P.k + 1]; if (Math.random() > P.acc - S.round * 0.02) { const o = R.pick([[1, 0], [-1, 0], [0, 1], [0, -1]]); tx = x + o[0]; ty = y + o[1]; }
    v.ax = Math.sign(tx - x); v.ay = Math.sign(ty - y);
  },
  score(m, S) { return S.pts.slice(); },
  fmt(s) { return `${s} pts`; },
  hud(m, S, i) { return `${S.pts[i]} pts`; },
  grid(g, ox, oy, S, show, P, col, t) {
    const N = this.N, C = this.CS;
    g.fillStyle = '#f4e0b0'; MGH.rr(g, ox - 10, oy - 10, N * C + 20, N * C + 20, 12); g.fill(); g.strokeStyle = '#a8703a'; g.lineWidth = 4; g.stroke();
    for (let a = 0; a < N; a++) for (let b = 0; b < N; b++) { g.fillStyle = (a + b) % 2 ? 'rgba(160,110,50,0.12)' : 'rgba(160,110,50,0.05)'; g.fillRect(ox + a * C, oy + b * C, C, C); }
    const [ex, ey] = S.path[S.path.length - 1]; g.strokeStyle = '#c82a2a'; g.lineWidth = 6; g.beginPath(); g.moveTo(ox + ex * C + 12, oy + ey * C + 12); g.lineTo(ox + ex * C + C - 12, oy + ey * C + C - 12); g.moveTo(ox + ex * C + C - 12, oy + ey * C + 12); g.lineTo(ox + ex * C + 12, oy + ey * C + C - 12); g.stroke();
    if (show) { const n = Math.min(S.path.length, Math.floor(t / 0.45) + 1); g.strokeStyle = '#7a4a1a'; g.lineWidth = 4; g.setLineDash([6, 6]); g.beginPath(); S.path.slice(0, n).forEach(([a, b], k) => { const x = ox + a * C + C / 2, y = oy + b * C + C / 2; if (k) g.lineTo(x, y); else g.moveTo(x, y); }); g.stroke(); g.setLineDash([]); }
    if (P) { const [a, b] = S.path[P.k]; g.fillStyle = col; g.beginPath(); g.arc(ox + a * C + C / 2, oy + b * C + C / 2, 14, 0, 7); g.fill(); if (P.fx > 0) MGH.text(g, '✖', ox + a * C + C / 2, oy + b * C + C / 2 - 20, 20, '#c82a2a', 'center', 'bold'); }
  },
  draw(m, S, g) {
    g.fillStyle = MGH.grad(g, 0, 720, ['#2a5a8a', '#1a3a5a']); g.fillRect(0, 0, 1280, 720);
    MGH.label(g, `Map ${S.round} of 5`, 640, 70, 22, '#ffe680');
    if (S.ph === 'show') { this.grid(g, 640 - 150, 140, S, true, null, '#fff', S.pt); MGH.label(g, 'Memorise the path!', 640, 520, 30, '#fff'); return; }
    for (let i = 0; i < 4; i++) { const P = S.p[i], p = m.players[i], ox = 30 + i * 318, oy = 220; g.save(); g.translate(ox, oy); g.scale(0.88, 0.88); this.grid(g, 10, 10, S, S.ph === 'end', P, p.color, 99); g.restore(); Char.draw(g, ox + 140, 160, 26, p.el.id, p.color, { mood: MGH.persona(P.fin ? 'cheer' : P.fx > 0 ? 'hurt' : 'determined', p.el.id), seed: i * 1.7 }); MGH.text(g, `${p.name}  ${S.pts[i]}`, ox + 140, 540, 18, p.color, 'center', 'bold'); if (P.fin) { const k = S.order.indexOf(i); MGH.label(g, ['1st +3', '2nd +2', '3rd +1', 'done'][k], ox + 140, 580, 18, '#ffe680'); } }
  },
});

// ======================================================================== SHIP BATTLE (2 vs 2: captain steers, gunner fires)
MG.def({
  id: 'ships', name: 'Ship Battle', type: 'Arena', mode: '2v2', controls: 'Move + button', dur: 60,
  rows: [['pad', 'Captain: steer up / down'], ['a', 'Gunner: fire the cannon']],
  how: 'Each team crews a pirate ship. The CAPTAIN steers the ship up and down the sea; the GUNNER fires the cannon across at the other ship (press A — it needs a moment to reload). Cannonballs fly straight, so the gunner has to fire where the enemy ship WILL be — and the captain has to dodge! Swap jobs at half time.',
  wins: 'Team with the most hits.',
  init(m, S) { S.hits = [0, 0]; S.half = false; S.t0 = [0, 1].map(tm => [0, 1, 2, 3].filter(i => m.teamOf(i) === tm)); S.sh = [0, 1].map(tm => ({ y: 380, v: 0, cd: 0.5, hit: 0 })); S.balls = []; },
  roles(S, tm) { const [a, b] = S.t0[tm]; return S.half ? { cap: b, gun: a } : { cap: a, gun: b }; },
  X: [170, 1110],
  update(m, S, dt) {
    if (!S.half && m.t > 30) { S.half = true; Sfx.whistle(); }
    S.sh.forEach((s, tm) => {
      const R_ = this.roles(S, tm); s.cd -= dt; s.hit -= dt;
      s.v += (m.axis(R_.cap).y * 230 - s.v) * 2.5 * dt; s.y = clamp(s.y + s.v * dt, 170, 640);
      if (m.pressed(R_.gun, 'a') && s.cd <= 0) { s.cd = 0.9; S.balls.push({ x: this.X[tm] + (tm ? -70 : 70), y: s.y, vx: tm ? -900 : 900, tm }); Sfx.boom(); }
    });
    S.balls.forEach(b => { b.x += b.vx * dt; const o = S.sh[1 - b.tm]; if (!b.dead && Math.abs(b.x - this.X[1 - b.tm]) < 60 && Math.abs(b.y - o.y) < 56) { b.dead = true; S.hits[b.tm]++; o.hit = 0.6; Sfx.thud(); MGH.burst(b.x, b.y, ['#ffb13d', '#fff', '#8a6a4a'], 20, { speed: 260 }); } });
    S.balls = S.balls.filter(b => !b.dead && b.x > -40 && b.x < 1320);
  },
  bot(m, S, i) {
    const v = m.vin[i], tm = m.teamOf(i), R_ = this.roles(S, tm), s = S.sh[tm], o = S.sh[1 - tm]; v.a = false; v.ay = 0;
    if (i === R_.cap) { const inc = S.balls.filter(b => b.tm !== tm && Math.abs(b.y - s.y) < 60 && (tm ? b.x < this.X[1] : b.x > this.X[0])).sort((a, b) => Math.abs(a.x - this.X[tm]) - Math.abs(b.x - this.X[tm]))[0]; if (!s.goal || Math.random() < 0.01) s.goal = R.range(200, 610); if (inc && Math.random() < 0.25) s.goal = inc.y > s.y ? s.y - 120 : s.y + 120; v.ay = Math.abs(s.goal - s.y) > 15 ? Math.sign(s.goal - s.y) : 0; return; }
    if (i === R_.gun && s.cd <= 0) { const tFly = Math.abs(this.X[1] - this.X[0] - 140) / 900, pred = o.y + o.v * tFly * R.range(0.6, 1.3); if (Math.abs(pred - s.y) < 50 && Math.random() < 0.15) v.a = true; }
  },
  score(m, S) { return [0, 1, 2, 3].map(i => S.hits[m.teamOf(i)]); },
  fmt(s) { return `${s} hits`; },
  hud(m, S, i) { const tm = m.teamOf(i); return MG.TEAMN[tm] + (this.roles(S, tm).cap === i ? ' · captain' : ' · gunner'); },
  draw(m, S, g) {
    MGH.scene(g, 'ocean', m.t);
    g.fillStyle = 'rgba(20,80,140,0.35)'; g.fillRect(0, 140, 1280, 580);
    for (let k = 0; k < 14; k++) { g.strokeStyle = 'rgba(255,255,255,0.25)'; g.lineWidth = 2; g.beginPath(); const y = 160 + k * 40; for (let x = 0; x <= 1280; x += 40) g.lineTo(x, y + Math.sin(x * 0.02 + m.t * 2 + k) * 4); g.stroke(); }
    S.sh.forEach((s, tm) => {
      const x = this.X[tm], d = tm ? -1 : 1, R_ = this.roles(S, tm), bob = Math.sin(m.t * 2 + tm) * 3, y = s.y + bob;
      g.save(); g.translate(x, y); if (s.hit > 0) g.rotate(Math.sin(m.t * 40) * 0.08);
      g.fillStyle = '#6a3a1a'; g.beginPath(); g.moveTo(-70, 0); g.lineTo(70, 0); g.lineTo(50, 34); g.lineTo(-50, 34); g.closePath(); g.fill(); g.fillStyle = '#8a5a2a'; g.fillRect(-70, -6, 140, 8);
      g.fillStyle = '#5a3a1a'; g.fillRect(-4, -110, 8, 110); g.fillStyle = MG.TEAMC[tm]; g.beginPath(); g.moveTo(4, -100); g.quadraticCurveTo(50 * d + 4, -70, 4, -30); g.fill();
      g.fillStyle = '#333'; MGH.rr(g, d * 46, -16, 34 * d, 14, 6); g.fill();
      g.restore();
      const cp = m.players[R_.cap], gp = m.players[R_.gun];
      Char.draw(g, x - d * 30, y - 28, 18, cp.el.id, cp.color, { mood: MGH.persona(s.hit > 0 ? 'hurt' : 'determined', cp.el.id), seed: R_.cap, look: { x: d, y: 0 } });
      Char.draw(g, x + d * 30, y - 28, 18, gp.el.id, gp.color, { mood: MGH.persona(s.cd > 0.9 ? 'cheer' : 'determined', gp.el.id), seed: R_.gun, look: { x: d, y: 0 } });
      if (s.cd > 0) { g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(x - 30, y + 44, 60, 6); g.fillStyle = '#ffb13d'; g.fillRect(x - 30, y + 44, 60 * (1 - s.cd / 0.9), 6); }
      MGH.text(g, `${MG.TEAMN[tm]}  ${S.hits[tm]}`, tm ? 1100 : 180, 110, 26, MG.TEAMC[tm], 'center', 'bold');
    });
    S.balls.forEach(b => { g.fillStyle = '#222'; g.beginPath(); g.arc(b.x, b.y, 9, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,0.25)'; g.beginPath(); g.arc(b.x - b.vx * 0.02, b.y, 6, 0, 7); g.fill(); });
    if (S.half && m.t < 32) MGH.label(g, 'SWAP JOBS!', 640, 380, 40, '#ffe680');
  },
});

// ======================================================================== COPY CHAIN (each player adds a move; repeat the whole chain)
MG.def({
  id: 'copychain', name: 'Copy Chain', type: 'Memory', controls: 'A B X Y', dur: 0, noPadSkip: true,
  rows: [['abxy', 'Repeat the chain, then add one']],
  how: 'Build a chain of button moves together! On your turn, repeat the WHOLE chain so far with A, B, X and Y — then press one NEW button to add to it. Slip up and you\'re out. The chain keeps growing… last memory standing wins!',
  wins: 'Last one in.',
  init(m, S) { S.chain = []; S.alive = [true, true, true, true]; S.order = []; S.turn = R.int(0, 3); S.k = 0; S.ph = 'turn'; S.pt = 0; S.flash = null; S.bt = 0.6; },
  nextTurn(S) { do S.turn = (S.turn + 1) % 4; while (!S.alive[S.turn]); S.k = 0; S.ph = 'turn'; S.pt = 0; S.bt = R.range(0.5, 0.8); },
  update(m, S, dt) {
    S.pt += dt; if (S.flash) { S.flash.t -= dt; if (S.flash.t <= 0) S.flash = null; }
    if (S.ph === 'out') { if (S.pt > 1.6) { if (S.alive.filter(a => a).length <= 1) m.finish(this.score(m, S)); else this.nextTurn(S); } return; }
    if (S.ph === 'added') { if (S.pt > 0.7) this.nextTurn(S); return; }
    const i = S.turn, d = abxyPress(m, i);
    if (S.pt > 6 + S.chain.length * 0.6) { this.out(S, i); return; }
    if (d < 0) return;
    S.flash = { d, t: 0.25 }; Sfx.tone([660, 880, 520, 740][d], 0.08, 'triangle', 0.04);
    if (S.k < S.chain.length) { if (d === S.chain[S.k]) { S.k++; S.pt = 0; } else this.out(S, i); }
    else { S.chain.push(d); S.ph = 'added'; S.pt = 0; Sfx.coin(); }
  },
  out(S, i) { S.alive[i] = false; S.order.push(i); S.ph = 'out'; S.pt = 0; Sfx.bad(); },
  bot(m, S, i, dt) {
    abxyBot(m, i, -1); if (S.turn !== i || S.ph !== 'turn') return;
    S.bt -= dt; if (S.bt > 0) return; S.bt = R.range(0.3, 0.6);
    if (S.k < S.chain.length) { const slip = Math.random() < 0.015 * S.chain.length; abxyBot(m, i, slip ? R.int(0, 3) : S.chain[S.k]); } else abxyBot(m, i, R.int(0, 3));
  },
  score(m, S) { return [0, 1, 2, 3].map(i => S.alive[i] ? 100 : S.order.indexOf(i) + 1); },
  fmt(s) { return s >= 100 ? 'Last memory!' : `out #${s}`; },
  hud(m, S, i) { return !S.alive[i] ? 'out' : S.turn === i ? '👉 your turn' : ''; },
  draw(m, S, g) {
    g.fillStyle = MGH.grad(g, 0, 720, ['#1a1a3a', '#3a1a4a']); g.fillRect(0, 0, 1280, 720);
    MGH.label(g, `Chain length: ${S.chain.length}`, 640, 70, 24, '#fff');
    // the big button diamond
    ABXY_POS.forEach(([x, y], d) => { const on = S.flash && S.flash.d === d; if (on) MGH.glow(g, x, y + 40, 90, ABXY_KEY[d][1]); abxyBadge(g, d, x, y + 40, on ? 52 : 42); });
    // chain dots
    const n = S.chain.length; S.chain.forEach((d, k) => { const x = 640 - (n - 1) * 14 + k * 28, done = S.turn !== undefined && k < S.k && S.ph === 'turn'; g.fillStyle = done ? ABXY_KEY[d][1] : 'rgba(255,255,255,0.25)'; g.beginPath(); g.arc(x, 130, 9, 0, 7); g.fill(); });
    m.players.forEach((p, i) => {
      const x = 110 + (i % 2) * 1060, y = 230 + Math.floor(i / 2) * 300, my = S.turn === i && S.ph !== 'out';
      if (my) MGH.glow(g, x, y, 80, p.color + '66');
      Char.draw(g, x, y, 40, p.el.id, p.color, { mood: MGH.persona(!S.alive[i] ? 'sad' : my ? 'determined' : 'happy', p.el.id), seed: i * 1.7, look: { x: x < 640 ? 1 : -1, y: 0 }, alpha: S.alive[i] ? 1 : 0.35 });
      MGH.text(g, p.name, x, y + 76, 20, p.color, 'center', 'bold');
      if (my) MGH.text(g, S.k < S.chain.length ? `repeat ${S.k}/${S.chain.length}` : 'ADD ONE!', x, y - 80, 18, '#ffe680', 'center', 'bold');
    });
    if (S.ph === 'out') MGH.label(g, `${m.players[S.order[S.order.length - 1]].name} slipped up!`, 640, 640, 30, '#ff8a8a');
  },
});

// ======================================================================== MASQUERADE (find the real players hiding in the crowd)
MG.def({
  id: 'masquerade', name: 'Masquerade', type: 'Stealth', controls: 'Move + button', dur: 60,
  rows: [['stick', 'Walk (blend in!)'], ['a', 'Unmask the masker next to you']],
  how: 'A masked ball! Everyone wears the same mask among a crowd of guests. Find YOURSELF by moving (the guests stroll slowly and calmly…), then hunt the other players: walk up next to a masker you suspect and press A to unmask them. A real player = 1 point and they reappear elsewhere. A guest = you\'re spotted (your mask glows for a moment) — so don\'t act suspicious!',
  wins: 'Most players unmasked.',
  init(m, S) {
    S.all = []; for (let k = 0; k < 26; k++) S.all.push(Object.assign(MGH.body(R.range(120, 1160), R.range(180, 660), 20), { npc: true, wp: null, glow: 0, cd: 0, i: -1 }));
    S.p = [0, 1, 2, 3].map(i => { const b = Object.assign(MGH.body(R.range(120, 1160), R.range(180, 660), 20), { npc: false, glow: 0, cd: 0, i, pts: 0, cool: 0 }); S.all.push(b); return b; });
    S.all = R.shuffle(S.all);
  },
  update(m, S, dt) {
    S.all.forEach(b => {
      b.glow -= dt; b.cd -= dt; b.cool = (b.cool || 0) - dt;
      if (b.npc) { if (!b.wp || dist(b.wp.x, b.wp.y, b.x, b.y) < 20 || Math.random() < dt * 0.2) b.wp = Math.random() < 0.3 ? { x: b.x, y: b.y } : { x: R.range(100, 1180), y: R.range(170, 670) }; const dx = b.wp.x - b.x, dy = b.wp.y - b.y, l = Math.hypot(dx, dy) || 1; MGH.steer(b, l > 20 ? dx / l * 0.6 : 0, l > 20 ? dy / l * 0.6 : 0, dt, 800, 110, 6); }
      else { const a = m.axis(b.i); MGH.steer(b, a.x, a.y, dt, 900, 150, 7); }
      MGH.integrate(b, dt, 80, 150, 1200, 690);
    });
    S.p.forEach(P => {
      if (!m.pressed(P.i, 'a') || P.cd > 0) return; P.cd = 0.8;
      const t = S.all.filter(o => o !== P && dist(o.x, o.y, P.x, P.y) < 60).sort((a, b) => dist(a.x, a.y, P.x, P.y) - dist(b.x, b.y, P.x, P.y))[0]; if (!t) return;
      if (t.npc) { P.glow = 2.2; t.glow = 0.4; Sfx.bad(); } else if (t.cool <= 0) { P.pts++; t.glow = 1; t.cool = 2; Sfx.coin(); MGH.burst(t.x, t.y, [m.players[t.i].color, '#fff'], 20, { speed: 220 }); t.x = R.range(120, 1160); t.y = R.range(180, 660); t.vx = t.vy = 0; }
    });
  },
  bot(m, S, i) {
    const P = S.p[i], v = m.vin[i]; v.a = false;
    // bots stroll like guests, and get suspicious of anyone who glows or moves fast
    if (!P.wp || dist(P.wp.x, P.wp.y, P.x, P.y) < 20) P.wp = { x: R.range(100, 1180), y: R.range(170, 670) };
    const sus = S.p.filter(o => o !== P && (o.glow > 0 || Math.hypot(o.vx, o.vy) > 125) && o.cool <= 0).sort((a, b) => dist(a.x, a.y, P.x, P.y) - dist(b.x, b.y, P.x, P.y))[0];
    const tg = sus && dist(sus.x, sus.y, P.x, P.y) < 400 ? sus : null;
    const go = tg || P.wp, dx = go.x - P.x, dy = go.y - P.y, l = Math.hypot(dx, dy) || 1, sp = tg ? 0.9 : 0.6;
    v.ax = dx / l * sp; v.ay = dy / l * sp;
    if (P.cd <= 0) { const near = S.all.find(o => o !== P && dist(o.x, o.y, P.x, P.y) < 55); if (near && (near === tg || Math.random() < 0.004)) v.a = true; }
  },
  score(m, S) { return S.p.map(P => P.pts); },
  fmt(s) { return `${s} unmasked`; },
  hud(m, S, i) { return `🎭 ${S.p[i].pts}`; },
  draw(m, S, g) {
    g.fillStyle = MGH.grad(g, 0, 720, ['#2a0a2a', '#4a1a3a']); g.fillRect(0, 0, 1280, 720);
    for (let x = 80; x < 1200; x += 80) for (let y = 150; y < 690; y += 80) { g.fillStyle = ((x + y) / 80) % 2 ? '#3a1a3a' : '#e8d8c8'; g.globalAlpha = 0.35; g.fillRect(x, y, 80, 80); } g.globalAlpha = 1;
    for (let k = 0; k < 5; k++) { MGH.glow(g, 160 + k * 240, 90, 70, 'rgba(255,220,140,0.4)'); g.fillStyle = '#ffd34d'; g.beginPath(); g.arc(160 + k * 240, 90, 12, 0, 7); g.fill(); }
    const ents = S.all.map(b => ({ y: b.y, f: () => {
      MGH.shadow(g, b.x, b.y + 30, 20, 0.3);
      if (b.glow > 0) MGH.glow(g, b.x, b.y, 50, b.npc ? 'rgba(255,255,255,0.4)' : (m.players[b.i] ? m.players[b.i].color + 'aa' : '#fff'));
      // everyone looks the same: a long cloak and a masked guest face
      const sw = Math.sin(m.t * 6 + b.x * 0.1) * Math.min(1, Math.hypot(b.vx, b.vy) / 100) * 3;
      g.fillStyle = '#5a2a6a'; g.beginPath(); g.moveTo(b.x - 22, b.y + 28); g.quadraticCurveTo(b.x, b.y - 30, b.x + 22, b.y + 28); g.fill();
      Char.npc(g, b.x + sw, b.y - 14, 15, 'host', { mood: 'happy', headOnly: true, look: b.face, seed: 3 });
      g.fillStyle = '#ffd34d'; g.beginPath(); g.ellipse(b.x + sw, b.y - 16, 13, 5, 0, 0, 7); g.fill(); g.fillStyle = '#2a0a2a'; g.beginPath(); g.arc(b.x + sw - 5, b.y - 16, 2.5, 0, 7); g.arc(b.x + sw + 5, b.y - 16, 2.5, 0, 7); g.fill();
      if (!b.npc && b.cool > 0) MGH.text(g, m.players[b.i].name, b.x, b.y - 44, 14, m.players[b.i].color, 'center', 'bold');
    } }));
    ents.sort((a, b) => a.y - b.y).forEach(e => e.f());
    m.players.forEach((p, i) => { MGH.text(g, `${p.name} ${S.p[i].pts}`, 160 + i * 320, 140, 18, p.color, 'center', 'bold'); });
  },
});

// ======================================================================== FROG CATCH (flick your tongue at flies)
MG.def({
  id: 'frogcatch', name: 'Frog Catch', type: 'Arcade', controls: 'Move + button', dur: 40,
  rows: [['stick', 'Aim your tongue'], ['a', 'Flick!']],
  how: 'You\'re a frog on a lily pad! Aim with the stick and press A to flick your long sticky tongue — it catches the first bug it touches. Flies are 1 point, shiny beetles 3. Dragonflies dart about fast (2 points). Don\'t lick the wasps (−2)! Your tongue needs a moment to come back.',
  wins: 'Most points.',
  PADS: [[260, 540], [520, 600], [760, 600], [1020, 540]],
  init(m, S) { S.bugs = []; S.sp = 0; S.f = [0, 1, 2, 3].map(i => ({ ang: -Math.PI / 2, t: -1, hit: null, pts: 0, fx: '', fxT: 0 })); },
  update(m, S, dt) {
    S.sp -= dt; if (S.sp <= 0 && S.bugs.length < 9) { S.sp = R.range(0.3, 0.7); const k = Math.random(); S.bugs.push({ x: R.range(100, 1180), y: R.range(140, 440), vx: R.range(-80, 80), vy: R.range(-40, 40), kind: k < 0.55 ? 'fly' : k < 0.72 ? 'beetle' : k < 0.86 ? 'dragon' : 'wasp', ph: R.range(0, 6) }); }
    S.bugs.forEach(b => { b.ph += dt; const sp = b.kind === 'dragon' ? 3 : 1; if (Math.random() < dt * sp) { b.vx = R.range(-120, 120) * sp; b.vy = R.range(-60, 60) * sp; } b.x = clamp(b.x + b.vx * dt, 60, 1220); b.y = clamp(b.y + b.vy * dt + Math.sin(b.ph * 8) * 20 * dt, 120, 470); });
    S.f.forEach((F, i) => {
      F.fxT -= dt; const [px, py] = this.PADS[i], a = m.axis(i);
      if (Math.hypot(a.x, a.y) > 0.3) { const want = Math.atan2(Math.min(-0.15, a.y), a.x); F.ang += clamp(((want - F.ang + Math.PI * 3) % (Math.PI * 2)) - Math.PI, -5 * dt, 5 * dt); }
      if (F.t < 0 && m.pressed(i, 'a')) { F.t = 0; F.hit = null; Sfx.tone(500, 0.06, 'sine', 0.03, 300); }
      if (F.t >= 0) {
        F.t += dt; const len = F.t < 0.25 ? F.t / 0.25 * 420 : Math.max(0, (0.5 - F.t) / 0.25 * 420);
        const tx = px + Math.cos(F.ang) * len, ty = py - 30 + Math.sin(F.ang) * len;
        if (!F.hit && F.t < 0.25) { const b = S.bugs.find(b => !b.got && dist(b.x, b.y, tx, ty) < 24); if (b) { F.hit = b; b.got = true; F.t = 0.5 - F.t; const v = { fly: 1, beetle: 3, dragon: 2, wasp: -2 }[b.kind]; F.pts += v; F.fx = v > 0 ? `+${v}` : `${v}`; F.fxT = 0.8; if (v > 0) Sfx.coin(); else Sfx.bad(); } }
        if (F.hit) { F.hit.x = tx; F.hit.y = ty; }
        F.tx = tx; F.ty = ty; if (F.t >= 0.5) { F.t = -1; if (F.hit) F.hit.gone = true; F.hit = null; }
      }
    });
    S.bugs = S.bugs.filter(b => !b.gone);
  },
  bot(m, S, i) {
    const F = S.f[i], v = m.vin[i], [px, py] = this.PADS[i]; v.a = false;
    if (!F.tg || F.tg.got || Math.random() < 0.01) F.tg = S.bugs.filter(b => !b.got && b.kind !== 'wasp' && dist(b.x, b.y, px, py - 30) < 400).sort((a, b) => dist(a.x, a.y, px, py) - dist(b.x, b.y, px, py) - (a.kind === 'beetle' ? 150 : 0) + (b.kind === 'beetle' ? 150 : 0))[0];
    if (!F.tg) { v.ax = v.ay = 0; return; }
    const tx = F.tg.x + F.tg.vx * 0.2, ty = F.tg.y + F.tg.vy * 0.2, want = Math.atan2(ty - (py - 30), tx - px); v.ax = Math.cos(want); v.ay = Math.sin(want);
    if (F.t < 0 && Math.abs(((want - F.ang + Math.PI * 3) % (Math.PI * 2)) - Math.PI) < 0.08 && Math.random() < 0.25) v.a = true;
  },
  score(m, S) { return S.f.map(F => F.pts); },
  fmt(s) { return `${s} pts`; },
  hud(m, S, i) { return `${S.f[i].pts}`; },
  draw(m, S, g) {
    MGH.scene(g, 'forest', m.t);
    g.fillStyle = MGH.grad(g, 480, 720, ['#3a8ac8', '#2a6aa8']); g.fillRect(0, 480, 1280, 240);
    for (let k = 0; k < 12; k++) { g.strokeStyle = 'rgba(255,255,255,0.25)'; g.lineWidth = 2; g.beginPath(); g.arc((k * 113 + m.t * 10) % 1300, 520 + (k * 37) % 180, 10 + k % 3 * 6, 0, Math.PI); g.stroke(); }
    S.bugs.forEach(b => {
      if (b.got && !S.f.some(F => F.hit === b)) return; const fl = Math.sin(m.t * 60 + b.ph) * 0.5 + 0.5;
      g.fillStyle = 'rgba(230,245,255,0.7)'; g.beginPath(); g.ellipse(b.x - 5, b.y - 6, 7, 3 + fl * 3, -0.5, 0, 7); g.ellipse(b.x + 5, b.y - 6, 7, 3 + fl * 3, 0.5, 0, 7); g.fill();
      if (b.kind === 'fly') { g.fillStyle = '#3a3a4a'; g.beginPath(); g.arc(b.x, b.y, 7, 0, 7); g.fill(); }
      if (b.kind === 'beetle') { MGH.glow(g, b.x, b.y, 20, 'rgba(120,255,180,0.5)'); g.fillStyle = '#2ac88a'; g.beginPath(); g.ellipse(b.x, b.y, 11, 8, 0, 0, 7); g.fill(); g.strokeStyle = '#1a6a4a'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(b.x, b.y - 8); g.lineTo(b.x, b.y + 8); g.stroke(); }
      if (b.kind === 'dragon') { g.fillStyle = '#5a8aff'; g.fillRect(b.x - 16, b.y - 2, 32, 4); g.beginPath(); g.arc(b.x + 16, b.y, 4, 0, 7); g.fill(); }
      if (b.kind === 'wasp') { g.fillStyle = '#ffd34d'; g.beginPath(); g.ellipse(b.x, b.y, 11, 7, 0, 0, 7); g.fill(); g.fillStyle = '#222'; g.fillRect(b.x - 3, b.y - 7, 3, 14); g.fillRect(b.x + 4, b.y - 6, 3, 12); }
    });
    S.f.forEach((F, i) => {
      const [px, py] = this.PADS[i], p = m.players[i];
      g.fillStyle = '#3a9a3a'; g.beginPath(); g.ellipse(px, py + 14, 70, 22, 0, 0.3, Math.PI * 2 - 0.3); g.lineTo(px, py + 14); g.fill();
      g.fillStyle = '#5ac83a'; g.beginPath(); g.ellipse(px, py, 34, 24, 0, 0, 7); g.fill();
      Char.draw(g, px, py - 26, 18, p.el.id, p.color, { headOnly: true, mood: MGH.persona(F.fxT > 0 && F.fx.startsWith('-') ? 'hurt' : F.t >= 0 ? 'determined' : 'happy', p.el.id), seed: i * 1.7, look: { x: Math.cos(F.ang), y: Math.sin(F.ang) } });
      if (F.t >= 0 && F.tx !== undefined) { g.strokeStyle = '#ff6b8a'; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(px, py - 30); g.lineTo(F.tx, F.ty); g.stroke(); g.fillStyle = '#ff4a7a'; g.beginPath(); g.arc(F.tx, F.ty, 7, 0, 7); g.fill(); }
      else { g.strokeStyle = 'rgba(255,255,255,0.35)'; g.setLineDash([4, 8]); g.lineWidth = 2; g.beginPath(); g.moveTo(px, py - 30); g.lineTo(px + Math.cos(F.ang) * 120, py - 30 + Math.sin(F.ang) * 120); g.stroke(); g.setLineDash([]); }
      MGH.text(g, `${p.name}  ${F.pts}`, px, py + 60, 18, p.color, 'center', 'bold');
      if (F.fxT > 0) MGH.text(g, F.fx, px, py - 80, 22, F.fx.startsWith('-') ? '#ff6b6b' : '#ffe680', 'center', 'bold');
    });
  },
});

// ======================================================================== SCOOP STACK (catch ice-cream scoops on a wobbly cone)
MG.def({
  id: 'scoops', name: 'Scoop Stack', type: 'Skill', controls: 'Move', dur: 40,
  rows: [['lr', 'Slide your cone']],
  how: 'Ice-cream scoops drop from the parlour ceiling! Slide your cone LEFT and RIGHT to catch them. Each scoop stacks on top — and the taller your tower, the more it sways when you move, so glide gently. Move too fast with a tall stack and it topples (you keep half). Rotten green scoops make you drop your top three!',
  wins: 'Tallest stack (scoops caught) at the end.',
  init(m, S) { S.p = [0, 1, 2, 3].map(i => ({ x: 160 + i * 320, v: 0, stack: [], lean: 0, lv: 0, drops: [], sp: R.range(0, 0.6), best: 0, fx: '', fxT: 0 })); },
  update(m, S, dt) {
    S.p.forEach((P, i) => {
      P.fxT -= dt; const ox = 160 + i * 320;
      P.sp -= dt; if (P.sp <= 0) { P.sp = R.range(0.6, 1.1); P.drops.push({ x: ox + R.range(-130, 130), y: 120, kind: Math.random() < 0.15 ? 'rot' : 'good', col: R.pick(['#ffd0e0', '#fff4c8', '#a86a3a', '#c8f0ff', '#ffb8d8']) }); }
      const a = m.axis(i).x, prev = P.v; P.v += (a * 300 - P.v) * 6 * dt; P.x = clamp(P.x + P.v * dt, ox - 140, ox + 140);
      const acc = (P.v - prev) / dt, h = P.stack.length;
      P.lv += (-acc * 0.00004 * (1 + h * 0.25) - P.lean * (4 - Math.min(3, h * 0.12)) - P.lv * 1.5) * dt * 10; P.lean += P.lv * dt;
      if (Math.abs(P.lean) > 0.6 && h > 2) { const keep = Math.floor(h / 2); P.stack = P.stack.slice(0, keep); P.lean = 0; P.lv = 0; P.fx = 'TOPPLED!'; P.fxT = 1; Sfx.thud(); }
      const topY = 600 - 40 - h * 26;
      P.drops.forEach(d => { d.y += (240 + m.t * 3) * dt; const tipX = P.x + Math.sin(P.lean) * h * 26; if (!d.got && Math.abs(d.y - topY) < 16 && Math.abs(d.x - tipX) < 30) { d.got = true; if (d.kind === 'rot') { P.stack = P.stack.slice(0, Math.max(0, h - 3)); P.fx = 'YUCK! −3'; P.fxT = 1; Sfx.bad(); } else { P.stack.push(d.col); P.lv += (d.x - tipX) * 0.01; Sfx.pop(); } } });
      P.drops = P.drops.filter(d => !d.got && d.y < 720); P.best = Math.max(P.best, P.stack.length);
    });
  },
  bot(m, S, i) {
    const P = S.p[i], v = m.vin[i], h = P.stack.length, topY = 600 - 40 - h * 26;
    const d = P.drops.filter(d => d.kind === 'good' && d.y < topY).sort((a, b) => b.y - a.y)[0], bad = P.drops.find(d => d.kind === 'rot' && d.y > topY - 160 && d.y < topY && Math.abs(d.x - P.x) < 40);
    let tx = d ? d.x : P.x; if (bad) tx = P.x + (P.x > bad.x ? 80 : -80);
    const care = h > 6 ? 0.5 : 1; v.ax = clamp((tx - P.x) / 60, -1, 1) * care; if (Math.abs(P.lean) > 0.3) v.ax = Math.sign(P.lean) * 0.4;
  },
  score(m, S) { return S.p.map(P => P.stack.length); },
  fmt(s) { return `${s} scoops`; },
  hud(m, S, i) { return `🍦 ${S.p[i].stack.length}`; },
  draw(m, S, g) {
    g.fillStyle = MGH.grad(g, 0, 720, ['#ffe0ec', '#ffd0e0']); g.fillRect(0, 0, 1280, 720);
    for (let x = 0; x < 1280; x += 40) { g.fillStyle = (x / 40) % 2 ? '#ff8ab8' : '#fff'; g.fillRect(x, 40, 40, 60); }
    g.fillStyle = '#f4d8b0'; g.fillRect(0, 610, 1280, 110);
    S.p.forEach((P, i) => {
      const p = m.players[i], h = P.stack.length;
      P.drops.forEach(d => { g.fillStyle = d.kind === 'rot' ? '#7ab84a' : d.col; g.beginPath(); g.arc(d.x, d.y, 17, 0, 7); g.fill(); if (d.kind === 'rot') { g.fillStyle = '#4a7a2a'; g.beginPath(); g.arc(d.x - 5, d.y - 3, 3, 0, 7); g.arc(d.x + 6, d.y + 4, 2, 0, 7); g.fill(); } else { g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.arc(d.x - 6, d.y - 6, 4, 0, 7); g.fill(); } });
      g.save(); g.translate(P.x, 600); g.rotate(P.lean * 0.3);
      g.fillStyle = '#d8a060'; g.beginPath(); g.moveTo(-20, -40); g.lineTo(20, -40); g.lineTo(0, 10); g.closePath(); g.fill(); g.strokeStyle = 'rgba(120,70,20,0.4)'; g.lineWidth = 1.5; for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(k * 8, -40); g.lineTo(0, 8); g.stroke(); }
      P.stack.forEach((c, k) => { const lx = Math.sin(P.lean) * k * 26 * 0.7, y = -40 - k * 26 - 10; g.fillStyle = c; g.beginPath(); g.arc(lx, y, 19, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,0.4)'; g.beginPath(); g.arc(lx - 6, y - 6, 5, 0, 7); g.fill(); });
      g.restore();
      Char.draw(g, P.x, 660, 22, p.el.id, p.color, { headOnly: true, mood: MGH.persona(P.fxT > 0 ? 'hurt' : Math.abs(P.lean) > 0.35 ? 'scared' : 'happy', p.el.id), seed: i * 1.7 });
      MGH.text(g, `${p.name}  ${h}`, 160 + i * 320, 706, 18, p.color, 'center', 'bold');
      if (P.fxT > 0) MGH.label(g, P.fx, 160 + i * 320, 160, 20, '#ff6b6b');
      if (i) { g.fillStyle = 'rgba(0,0,0,0.08)'; g.fillRect(i * 320 - 1, 100, 2, 510); }
    });
  },
});
