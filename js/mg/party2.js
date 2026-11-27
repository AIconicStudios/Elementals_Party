'use strict';
// Party batch 1b: Pocket Pool, Mini Golf Isle, Ice Hockey (2v2), Beach Volley (2v2), Snow Fort Siege (1v3)

// shared: aiming with left/right (fast) and up/down (fine), power that swings while A is held
function aimTurn(m, i, ang, dt) { const s = m.now[i]; if (s.left) ang -= 1.9 * dt; if (s.right) ang += 1.9 * dt; if (s.up) ang -= 0.35 * dt; if (s.down) ang += 0.35 * dt; return ang; }
function powerSwing(t) { return 0.5 - 0.5 * Math.cos(t * 2.4); }
function drawPowerBar(g, x, y, w, pw, col = '#ffd34d') { g.fillStyle = 'rgba(0,0,0,0.55)'; MGH.rr(g, x - w / 2 - 3, y - 3, w + 6, 18, 8); g.fill(); const gr = g.createLinearGradient(x - w / 2, 0, x + w / 2, 0); gr.addColorStop(0, '#7cf06a'); gr.addColorStop(0.6, col); gr.addColorStop(1, '#ff4a3a'); g.fillStyle = gr; MGH.rr(g, x - w / 2, y, w * pw, 12, 6); g.fill(); }
// circle vs segment bounce (walls); returns true when it hit
function bounceSeg(b, x1, y1, x2, y2, r, damp = 0.8) {
  const dx = x2 - x1, dy = y2 - y1, L2 = dx * dx + dy * dy, t = Math.max(0, Math.min(1, ((b.x - x1) * dx + (b.y - y1) * dy) / L2));
  const px = x1 + dx * t, py = y1 + dy * t, ex = b.x - px, ey = b.y - py, d = Math.hypot(ex, ey);
  if (d >= r || d < 1e-6) return false;
  const nx = ex / d, ny = ey / d; b.x = px + nx * r; b.y = py + ny * r;
  const vn = b.vx * nx + b.vy * ny; if (vn < 0) { b.vx -= (1 + damp) * vn * nx; b.vy -= (1 + damp) * vn * ny; }
  return true;
}
function segHit(ax, ay, bx, by, cx, cy, dx, dy) { // do segments AB and CD cross?
  const d = (bx - ax) * (dy - cy) - (by - ay) * (dx - cx); if (Math.abs(d) < 1e-9) return false;
  const u = ((cx - ax) * (dy - cy) - (cy - ay) * (dx - cx)) / d, v = ((cx - ax) * (by - ay) - (cy - ay) * (bx - ax)) / d;
  return u >= 0 && u <= 1 && v >= 0 && v <= 1;
}

// ======================================================================== POCKET POOL
MG.def({
  id: 'pool', name: 'Pocket Pool', type: 'Skill', controls: 'Move + hold', dur: 0, sport: true,
  rows: [['lr', 'Aim (▲▼ fine)'], ['a', 'Hold for power, let go']],
  how: 'Each hero owns FOUR balls in their colour. A roulette picks the turn order at the start (it stays the same all game). Take turns shooting the white cue ball: aim with LEFT/RIGHT (UP/DOWN for fine aim), hold A to swing the power bar and let go to shoot. Every coloured ball that drops counts for its OWNER — so sink yours and keep the others safe! Sink your own ball and you shoot again; pot the white and your turn ends. The FIRST hero to clear all four of their balls wins (after 8 shots each, most balls cleared wins).',
  wins: 'First to pocket all four of their balls.',
  T: { x0: 190, y0: 140, w: 900, h: 450 },
  init(m, S) {
    const T = this.T; S.pts = [0, 0, 0, 0]; S.order = R.shuffle([0, 1, 2, 3]); S.oi = 0; S.turn = S.order[0]; S.shots = [0, 0, 0, 0]; S.MAX = 8; S.win = -1; S.phase = 'spin'; S.spinHi = 0; S.spinStep = 0; S.pt = 0; S.hold = -1; S.ang = 0; S.msg = '';
    S.balls = [{ x: T.x0 + T.w * 0.25, y: T.y0 + T.h / 2, vx: 0, vy: 0, own: -1, in: false }];
    const rack = []; [1, 2, 3, 4, 3, 2, 1].forEach((n, c) => { for (let k = 0; k < n; k++) rack.push([c, k - (n - 1) / 2]); }); const own = R.shuffle([0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3]);
    rack.forEach(([c, r], k) => S.balls.push({ x: T.x0 + T.w * 0.62 + c * 22, y: T.y0 + T.h / 2 + r * 25, vx: 0, vy: 0, own: own[k], in: false }));
    S.pockets = [[0, 0], [0.5, 0], [1, 0], [0, 1], [0.5, 1], [1, 1]].map(([u, v]) => ({ x: T.x0 + u * T.w, y: T.y0 + v * T.h }));
  },
  moving(S) { return S.balls.some(b => !b.in && Math.hypot(b.vx, b.vy) > 4); },
  step(m, S, dt) {
    const T = this.T, r = 12, B = S.balls.filter(b => !b.in);
    for (let sub = 0; sub < 4; sub++) {
      const h = dt / 4;
      B.forEach(b => { b.x += b.vx * h; b.y += b.vy * h; const sp = Math.hypot(b.vx, b.vy); if (sp > 0) { const ns = Math.max(0, sp - (55 + sp * 0.55) * h); b.vx *= ns / sp; b.vy *= ns / sp; } });
      for (let a = 0; a < B.length; a++) for (let c = a + 1; c < B.length; c++) {
        const p = B[a], q = B[c], dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy);
        if (d < r * 2 && d > 0) { const nx = dx / d, ny = dy / d, ov = r * 2 - d; p.x -= nx * ov / 2; p.y -= ny * ov / 2; q.x += nx * ov / 2; q.y += ny * ov / 2; const rel = (p.vx - q.vx) * nx + (p.vy - q.vy) * ny; if (rel > 0) { p.vx -= rel * nx * 0.97; p.vy -= rel * ny * 0.97; q.vx += rel * nx * 0.97; q.vy += rel * ny * 0.97; if (rel > 60) Sfx.tone(1400 + Math.random() * 300, 0.02, 'sine', Math.min(0.06, rel / 6000)); } }
      }
      B.forEach(b => {
        if (b.in) return;
        for (const P of S.pockets) if (Math.hypot(b.x - P.x, b.y - P.y) < 25) { b.in = true; b.vx = b.vy = 0; S.potted.push(b); Sfx.thud(); MGH.burst(P.x, P.y, ['#fff', b.own >= 0 ? m.players[b.own].color : '#fff'], 10, { speed: 120 }); return; }
        if (b.x < T.x0 + r) { b.x = T.x0 + r; b.vx = -b.vx * 0.82; } if (b.x > T.x0 + T.w - r) { b.x = T.x0 + T.w - r; b.vx = -b.vx * 0.82; }
        if (b.y < T.y0 + r) { b.y = T.y0 + r; b.vy = -b.vy * 0.82; } if (b.y > T.y0 + T.h - r) { b.y = T.y0 + T.h - r; b.vy = -b.vy * 0.82; }
      });
    }
  },
  update(m, S, dt) {
    S.pt += dt; const i = S.turn, cue = S.balls[0];
    if (S.phase === 'spin') { // turn-order roulette: a light races round the players, then each place is revealed
      const SPIN = 2.4, REVEAL = 0.75;
      if (S.pt < SPIN) { S.spinStep -= dt; if (S.spinStep <= 0) { S.spinHi = (S.spinHi + 1) % 4; S.spinStep = 0.05 + S.pt * 0.05; Sfx.tone(500 + S.spinHi * 90, 0.04, 'triangle', 0.03); } }
      else { const k = Math.floor((S.pt - SPIN) / REVEAL); if (k !== S.revealed && k < 4) { S.revealed = k; Sfx.tone(700 + k * 120, 0.15, 'triangle', 0.06); } }
      if (S.pt > SPIN + REVEAL * 4 + 0.8) { S.phase = 'aim'; S.pt = 0; Sfx.whistle(); }
      return;
    }
    if (S.phase === 'aim') {
      S.ang = aimTurn(m, i, S.ang, dt);
      if (m.held(i, 'a')) { if (S.hold < 0) S.hold = 0; S.hold += dt; }
      else if (S.hold > 0) { const pw = powerSwing(S.hold); cue.vx = Math.cos(S.ang) * (160 + pw * 1150); cue.vy = Math.sin(S.ang) * (160 + pw * 1150); S.hold = -1; S.phase = 'roll'; S.pt = 0; S.potted = []; S.shots[i]++; Sfx.punch(); }
      if (S.pt > 30 && S.hold < 0) { S.hold = 0.6; } // a sleepy player shoots after a while
    } else if (S.phase === 'roll') {
      this.step(m, S, dt);
      if (!this.moving(S) && S.pt > 0.3) {
        let again = false, scratch = false;
        S.potted.forEach(b => { if (b.own < 0) scratch = true; else { S.pts[b.own]++; MGH.pop(`+1 ${m.players[b.own].name}`, b.x, b.y - 20, m.players[b.own].color, 26); if (b.own === i) again = true; } });
        if (scratch) { S.msg = `${m.players[i].name} potted the white — turn over!`; Sfx.bad(); cue.in = false; cue.x = this.T.x0 + this.T.w * 0.25; cue.y = this.T.y0 + this.T.h / 2; again = false; while (S.balls.some(b => b !== cue && !b.in && Math.hypot(b.x - cue.x, b.y - cue.y) < 26)) cue.y += 26; }
        else if (again) { S.msg = `${m.players[i].name} shoots again!`; Sfx.coin(); } else S.msg = '';
        const left = S.balls.filter(b => b.own >= 0 && !b.in).length;
        if (S.win < 0) { const order = [i].concat(S.order.filter(k => k !== i)); const w = order.find(k => S.pts[k] >= 4); if (w !== undefined) { S.win = w; S.msg = `${m.players[w].name} cleared all four!`; Sfx.coin(); m.finish(this.score(m, S)); return; } }
        if (!again) { let k = 0; do { S.oi++; if (S.oi >= 4) S.oi = 0; S.turn = S.order[S.oi]; k++; } while (S.shots[S.turn] >= S.MAX && k < 9); }
        if (left === 0 || S.shots.every(s => s >= S.MAX) && !again) { m.finish(this.score(m, S)); return; }
        if (again && S.shots[i] >= S.MAX) S.shots[i]--; // a bonus shot never runs out
        S.phase = 'aim'; S.pt = 0; S.ang = Math.atan2(this.T.y0 + this.T.h / 2 - cue.y, this.T.x0 + this.T.w * 0.7 - cue.x);
      }
    }
  },
  bot(m, S, i, dt) {
    const v = m.vin[i]; v.left = v.right = v.up = v.down = false;
    if (S.phase !== 'aim' || S.turn !== i) { v.a = false; return; }
    const pkey = `${i}|${S.shots.join()}|${S.pts.join()}|${S.balls.filter(b => b.in).length}`;
    if (!S.plan || S.plan.turnT !== pkey) {
      const cue = S.balls[0]; let best = null;
      S.balls.forEach(b => { if (b.in || b.own < 0) return; S.pockets.forEach(P => {
        const ux = P.x - b.x, uy = P.y - b.y, ul = Math.hypot(ux, uy), gx = b.x - ux / ul * 24, gy = b.y - uy / ul * 24;
        const ax = gx - cue.x, ay = gy - cue.y, al = Math.hypot(ax, ay), cut = (ax * ux + ay * uy) / (al * ul);
        if (cut < 0.35) return; const sc = (b.own === i ? 2 : -1.2) + cut - (al + ul) / 1400;
        if (!best || sc > best.sc) best = { sc, ang: Math.atan2(ay, ax), pw: clamp(0.3 + (al + ul) / 1500, 0.35, 0.92) };
      }); });
      if (!best || best.sc < -0.5) best = { ang: S.ang + R.range(-1, 1), pw: 0.35 };
      S.plan = { turnT: pkey, ang: best.ang + R.range(-0.012, 0.012), pw: best.pw + R.range(-0.05, 0.05) };
    }
    const d = Math.atan2(Math.sin(S.plan.ang - S.ang), Math.cos(S.plan.ang - S.ang));
    if (Math.abs(d) > 0.007) { if (Math.abs(d) > 0.08) { if (d > 0) v.right = true; else v.left = true; } else { if (d > 0) v.down = true; else v.up = true; } v.a = false; return; }
    if (S.pt < 1) return;
    v.a = !(S.hold > 0 && powerSwing(S.hold) >= S.plan.pw && S.hold < 1.3);
  },
  score(m, S) { return S.pts.map((p, k) => p + (k === S.win ? 10 : 0)); },
  fmt(s) { return s >= 10 ? 'cleared all 4!' : `${s} of 4 cleared`; },
  hud(m, S, i) { return `${S.pts[i]}/4` + (S.turn === i && S.phase === 'aim' ? ' 🎱' : '') + ` (${Math.max(0, S.MAX - S.shots[i])} shots)`; },
  draw(m, S, g) {
    this.drawTable(m, S, g);
    if (S.phase === 'spin') this.drawSpin(m, S, g); else this.drawOrder(m, S, g);
  },
  drawSpin(m, S, g) {
    const SPIN = 2.4, REVEAL = 0.75;
    g.fillStyle = 'rgba(10,6,4,0.72)'; g.fillRect(0, 0, 1280, 720);
    MGH.label(g, S.pt < SPIN ? '🎲 Picking the turn order…' : 'Turn order', 640, 130, 40, '#ffe680');
    const shown = S.pt < SPIN ? -1 : Math.min(3, Math.floor((S.pt - SPIN) / REVEAL));
    m.players.forEach((p, i) => {
      const x = 220 + i * 280, y = 330, place = S.order.indexOf(i), hi = S.pt < SPIN && S.spinHi === i, rev = place <= shown;
      g.fillStyle = hi ? 'rgba(255,230,120,0.35)' : 'rgba(255,255,255,0.08)'; MGH.rr(g, x - 110, y - 120, 220, 300, 24); g.fill();
      g.strokeStyle = hi ? '#ffe680' : rev ? p.color : 'rgba(255,255,255,0.25)'; g.lineWidth = hi || rev ? 6 : 2; g.stroke();
      if (hi) MGH.glow(g, x, y, 150, 'rgba(255,230,120,0.35)');
      Char.draw(g, x, y, 46, p.el.id, p.color, { mood: MGH.persona(rev && place === 0 ? 'cheer' : hi ? 'happy' : 'neutral', p.el.id), seed: i * 1.7 });
      MGH.text(g, p.name, x, y + 100, 24, p.color, 'center', 'bold');
      if (rev) { const k = Math.min(1, (S.pt - SPIN - place * REVEAL) / 0.25); g.save(); g.translate(x, y - 150); g.scale(k, k); g.fillStyle = ['#ffd34d', '#d8dce4', '#e0a060', '#8ac8ff'][place]; g.beginPath(); g.arc(0, 0, 40, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 4; g.stroke(); MGH.text(g, ['1st', '2nd', '3rd', '4th'][place], 0, 10, 28, '#2a1a10', 'center', 'bold'); g.restore(); }
    });
    if (shown >= 3) MGH.label(g, `${m.players[S.order[0]].name} breaks!`, 640, 620, 34, m.players[S.order[0]].color);
  },
  drawOrder(m, S, g) {
    g.fillStyle = 'rgba(0,0,0,0.45)'; MGH.rr(g, 8, 46, 150, 134, 14); g.fill(); MGH.text(g, 'Turn order', 83, 66, 16, '#ffe680', 'center', 'bold');
    S.order.forEach((i, k) => { const p = m.players[i], cur = S.turn === i; if (cur) { g.fillStyle = 'rgba(255,230,120,0.25)'; MGH.rr(g, 14, 72 + k * 26, 138, 24, 7); g.fill(); } MGH.text(g, `${k + 1}. ${p.name}${cur ? ' 🎱' : ''}`, 24, 90 + k * 26, 15, p.color, 'left', 'bold'); });
  },
  drawTable(m, S, g) {
    const T = this.T;
    g.fillStyle = MGH.grad(g, 0, 720, ['#3a2418', '#5a3a26', '#2a1810']); g.fillRect(0, 0, 1280, 720);
    for (let k = 0; k < 3; k++) { MGH.glow(g, 340 + k * 300, 60, 260, 'rgba(255,230,170,0.18)'); g.fillStyle = '#1a1a1a'; g.fillRect(332 + k * 300, 0, 16, 40); g.fillStyle = '#2a5a3a'; g.beginPath(); g.moveTo(300 + k * 300, 70); g.lineTo(380 + k * 300, 70); g.lineTo(360 + k * 300, 40); g.lineTo(320 + k * 300, 40); g.fill(); }
    // table
    g.fillStyle = 'rgba(0,0,0,0.4)'; MGH.rr(g, T.x0 - 46, T.y0 - 36, T.w + 92, T.h + 92, 30); g.fill();
    g.fillStyle = MGH.grad(g, T.y0 - 40, T.y0 + T.h + 40, ['#8a5230', '#5a3018']); MGH.rr(g, T.x0 - 42, T.y0 - 42, T.w + 84, T.h + 84, 28); g.fill();
    g.fillStyle = '#1f7a4a'; g.fillRect(T.x0 - 14, T.y0 - 14, T.w + 28, T.h + 28);
    const fg = g.createRadialGradient(T.x0 + T.w / 2, T.y0 + T.h / 2, 50, T.x0 + T.w / 2, T.y0 + T.h / 2, T.w * 0.65); fg.addColorStop(0, '#36a868'); fg.addColorStop(1, '#1f7a4a'); g.fillStyle = fg; g.fillRect(T.x0, T.y0, T.w, T.h);
    g.fillStyle = '#fff'; for (const [x, y] of [[0.25, -0.06], [0.5, -0.06], [0.75, -0.06], [0.25, 1.06], [0.5, 1.06], [0.75, 1.06]]) { g.beginPath(); g.arc(T.x0 + T.w * x, T.y0 + T.h * y, 4, 0, 7); g.fill(); }
    S.pockets.forEach(P => { g.fillStyle = '#0a0a0a'; g.beginPath(); g.arc(P.x, P.y, 25, 0, 7); g.fill(); g.strokeStyle = '#3a2010'; g.lineWidth = 4; g.stroke(); });
    // aim guide
    const cue = S.balls[0];
    if (S.phase === 'aim' && !cue.in) {
      let len = 0; const step = 6; let hx = cue.x, hy = cue.y, hit = null;
      while (len < 900) { hx += Math.cos(S.ang) * step; hy += Math.sin(S.ang) * step; len += step; if (hx < T.x0 + 12 || hx > T.x0 + T.w - 12 || hy < T.y0 + 12 || hy > T.y0 + T.h - 12) break; hit = S.balls.find(b => b !== cue && !b.in && Math.hypot(b.x - hx, b.y - hy) < 24); if (hit) break; }
      g.strokeStyle = 'rgba(255,255,255,0.6)'; g.setLineDash([8, 8]); g.lineWidth = 2; g.beginPath(); g.moveTo(cue.x, cue.y); g.lineTo(hx, hy); g.stroke(); g.setLineDash([]);
      g.strokeStyle = 'rgba(255,255,255,0.8)'; g.beginPath(); g.arc(hx, hy, 12, 0, 7); g.stroke();
      if (hit) { const nx = hit.x - hx, ny = hit.y - hy, nl = Math.hypot(nx, ny) || 1; g.strokeStyle = 'rgba(255,255,160,0.7)'; g.beginPath(); g.moveTo(hit.x, hit.y); g.lineTo(hit.x + nx / nl * 80, hit.y + ny / nl * 80); g.stroke(); }
      // cue stick
      const pull = S.hold > 0 ? powerSwing(S.hold) * 70 : 0; g.save(); g.translate(cue.x, cue.y); g.rotate(S.ang);
      g.fillStyle = MGH.grad(g, -6, 6, ['#f0d8a0', '#a8784a']); g.fillRect(-380 - pull, -5, 360, 10); g.fillStyle = m.players[S.turn].color; g.fillRect(-40 - pull, -5, 18, 10); g.fillStyle = '#eee'; g.fillRect(-24 - pull, -4, 6, 8); g.restore();
      if (S.hold > 0) drawPowerBar(g, cue.x, cue.y + 32, 120, powerSwing(S.hold));
    }
    // balls
    S.balls.forEach(b => {
      if (b.in) return; const col = b.own < 0 ? '#fdfdf8' : m.players[b.own].color;
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(b.x + 3, b.y + 5, 12, 9, 0, 0, 7); g.fill();
      const gr = g.createRadialGradient(b.x - 4, b.y - 5, 1, b.x, b.y, 12); gr.addColorStop(0, '#fff'); gr.addColorStop(0.35, col); gr.addColorStop(1, Char.shade(col, -0.45)); g.fillStyle = gr; g.beginPath(); g.arc(b.x, b.y, 12, 0, 7); g.fill();
      if (b.own >= 0) { g.fillStyle = '#fff'; g.beginPath(); g.arc(b.x, b.y, 5.5, 0, 7); g.fill(); MGH.text(g, String(b.own + 1), b.x, b.y + 3.5, 9, '#222', 'center', 'bold'); }
    });
    // players around the table
    m.players.forEach((p, i) => {
      const x = [120, 1160, 120, 1160][i], y = [260, 260, 540, 540][i], me = S.turn === i && S.phase === 'aim';
      if (me) MGH.glow(g, x, y - 10, 90, 'rgba(255,230,120,0.45)');
      Char.draw(g, x, y, 34, p.el.id, p.color, { mood: me ? 'determined' : 'happy', seed: i * 1.7, look: { x: x < 640 ? 1 : -1, y: 0 } });
      MGH.text(g, `${p.name} ${S.pts[i]}`, x, y + 70, 18, p.color, 'center', 'bold');
      for (let k = 0; k < S.MAX; k++) { g.fillStyle = k < S.shots[i] ? 'rgba(255,255,255,0.2)' : '#ffe680'; g.beginPath(); g.arc(x - 24 + k * 16, y + 88, 5, 0, 7); g.fill(); }
    });
    if (S.msg) MGH.label(g, S.msg, 640, 670, 22, '#fff');
    else if (S.phase === 'aim') { MGH.text(g, `${m.players[S.turn].name}'s shot  ·  ${Math.max(0, 30 - S.pt).toFixed(0)}s`, 640, 676, 22, m.players[S.turn].color, 'center', 'bold'); MGH.text(g, 'next: ' + [1, 2, 3].map(k => m.players[S.order[(S.oi + k) % 4]].name).join(' → '), 640, 700, 14, 'rgba(255,255,255,0.6)', 'center'); }
  },
});

// ======================================================================== MINI GOLF ISLE
const GOLF = [
  { name: 'Bumper Lane', par: 2, tee: [60, 160], cup: [540, 160], walls: [], bumpers: [[300, 110, 24], [300, 210, 24], [420, 160, 18]], sand: [[380, 40, 90, 50]], water: [], way: [] },
  { name: 'Dog Leg Pond', par: 3, tee: [60, 250], cup: [540, 70], walls: [[300, 0, 300, 205]], bumpers: [[150, 120, 18]], sand: [[180, 230, 60, 70]], water: [[400, 120, 90, 70]], way: [[330, 260]] },
  { name: 'Windmill Hill', par: 3, tee: [60, 160], cup: [545, 160], walls: [[320, 0, 320, 115], [320, 205, 320, 320]], bumpers: [[470, 90, 16], [470, 230, 16]], sand: [], water: [[200, 260, 80, 60], [200, 0, 80, 50]], way: [[320, 160]], mill: [320, 160, 62] },
  { name: 'Zig Zag', par: 3, tee: [50, 60], cup: [550, 260], walls: [[200, 0, 200, 210], [400, 110, 400, 320]], bumpers: [], sand: [[250, 240, 90, 60]], water: [], way: [[400, 55], [200, 265]] },
  { name: 'Island Green', par: 3, tee: [60, 160], cup: [490, 160], walls: [], bumpers: [[200, 100, 16], [200, 220, 16]], sand: [], water: [[340, 0, 60, 120], [340, 200, 60, 120], [420, 30, 170, 50], [420, 240, 170, 50]], way: [] },
  { name: 'Pinball Alley', par: 2, tee: [60, 160], cup: [560, 160], walls: [], bumpers: [[200, 80, 16], [200, 240, 16], [300, 160, 20], [400, 80, 16], [400, 240, 16], [480, 160, 14]], sand: [], water: [], way: [[300, 110]] },
  { name: 'Hairpin', par: 3, tee: [60, 70], cup: [70, 255], walls: [[0, 160, 440, 160]], bumpers: [[540, 60, 14], [540, 260, 14]], sand: [[220, 210, 90, 60]], water: [], way: [[510, 160]] },
  { name: 'Windmill Dash', par: 3, tee: [60, 160], cup: [540, 160], walls: [], bumpers: [[460, 70, 14], [460, 250, 14]], sand: [[400, 20, 60, 50], [400, 250, 60, 50]], water: [], way: [], mill: [300, 160, 70] },
  { name: 'Sand Trap Valley', par: 3, tee: [50, 160], cup: [550, 160], walls: [], bumpers: [[310, 40, 14], [310, 280, 14]], sand: [[150, 40, 110, 240], [370, 70, 100, 180]], water: [], way: [] },
  { name: 'Narrow Bridge', par: 3, tee: [60, 160], cup: [540, 160], walls: [], bumpers: [[500, 90, 12], [500, 230, 12]], sand: [], water: [[150, 0, 300, 128], [150, 192, 300, 128]], way: [] },
];
// every game picks one of these looks for its island
const GOLF_THEME = [
  { name: 'Tropical Isle', bg: ['#3ab8e8', '#1a88c8', '#0a5a98'], rim: '#f0dca0', frame: '#5a3a20', turf: ['#5ad45a', '#3aa83a'], sand: '#f0d898', water: '#3aa8e8', wall: ['#8a5a32', '#c88a4a'], bump: '#ff5a6e', fx: 'waves' },
  { name: 'Desert Canyon', bg: ['#ffb070', '#e8783a', '#a8482a'], rim: '#e8c890', frame: '#7a3a1a', turf: ['#9ac850', '#6a9a3a'], sand: '#f8e0a0', water: '#4ac0d8', wall: ['#8a4a2a', '#c87a4a'], bump: '#3ac8a8', fx: 'dunes' },
  { name: 'Frosty Peaks', bg: ['#cfe8ff', '#9ac8f0', '#6a98c8'], rim: '#f4f8ff', frame: '#5a6a8a', turf: ['#7ad8b8', '#4aa890'], sand: '#ffffff', water: '#8ad0ff', wall: ['#6a7a9a', '#aab8d0'], bump: '#5a8aff', fx: 'snow' },
  { name: 'Candy Land', bg: ['#ffb8d8', '#ff8ab8', '#d85a98'], rim: '#fff0f8', frame: '#a83a6a', turf: ['#9af0c8', '#5ac898'], sand: '#ffe680', water: '#8a5a3a', wall: ['#e85a8a', '#ffb0d0'], bump: '#ff5a5a', fx: 'sprinkles' },
  { name: 'Volcano Rim', bg: ['#4a1a1a', '#2a0a0a', '#1a0505'], rim: '#6a5a5a', frame: '#2a1a1a', turf: ['#4a8a3a', '#2a6a2a'], sand: '#8a8a8a', water: '#ff6a1a', wall: ['#3a2a2a', '#6a4a3a'], bump: '#ffd34d', fx: 'embers' },
  { name: 'Moonlit Garden', bg: ['#1a2050', '#101838', '#080c20'], rim: '#b8b0c8', frame: '#2a2440', turf: ['#3a8a4a', '#24683a'], sand: '#d8d0b0', water: '#2a4aa8', wall: ['#4a3a5a', '#8a7aa8'], bump: '#c88aff', fx: 'stars' },
];
MG.def({
  id: 'golf', name: 'Mini Golf Isle', type: 'Skill', controls: 'Move + hold', dur: 0, sport: true,
  rows: [['lr', 'Aim (▲▼ fine)'], ['a', 'Hold for power, let go']],
  how: 'Three holes on a tropical island — everyone putts at the same time on their own copy of the hole. Aim with LEFT/RIGHT (UP/DOWN to fine-tune), hold A to swing the power bar and let go to putt. Bumpers bounce, sand slows you, water costs a stroke, and on hole 3 time your putt past the spinning windmill! A ball moving too fast skips over the cup.',
  wins: 'Fewest strokes over three holes.',
  init(m, S) { S.hole = -1; S.tot = [0, 0, 0, 0]; S.holes = R.shuffle(GOLF.slice()).slice(0, 3); S.th = R.pick(GOLF_THEME); this.nextHole(m, S); },
  nextHole(m, S) {
    S.hole++; const H = S.holes[S.hole];
    S.p = m.players.map(() => ({ x: H.tee[0], y: H.tee[1], vx: 0, vy: 0, ang: Math.atan2(H.cup[1] - H.tee[1], H.cup[0] - H.tee[0]), hold: -1, strokes: 0, done: false, lx: H.tee[0], ly: H.tee[1], sink: 0 }));
    S.phase = 'play'; S.pt = 0; S.mill = 0;
  },
  segs(H) { const W = [[0, 0, 600, 0], [600, 0, 600, 320], [600, 320, 0, 320], [0, 320, 0, 0], ...H.walls]; return W; },
  inRect(x, y, R2) { return x > R2[0] && x < R2[0] + R2[2] && y > R2[1] && y < R2[1] + R2[3]; },
  update(m, S, dt) {
    S.pt += dt; const H = S.holes[S.hole]; S.mill += dt * 1.6;
    S.p.forEach((b, i) => {
      if (b.done) { b.sink += dt; return; }
      const moving = Math.hypot(b.vx, b.vy) > 3;
      if (!moving) {
        b.ang = aimTurn(m, i, b.ang, dt);
        if (m.held(i, 'a')) { if (b.hold < 0) b.hold = 0; b.hold += dt; }
        else if (b.hold > 0) { const pw = powerSwing(b.hold); b.vx = Math.cos(b.ang) * (40 + pw * 640); b.vy = Math.sin(b.ang) * (40 + pw * 640); b.hold = -1; b.strokes++; b.lx = b.x; b.ly = b.y; if (!m.bot(i)) Sfx.tone(900, 0.05, 'triangle', 0.06); }
        return;
      }
      for (let sub = 0; sub < 3; sub++) {
        const h = dt / 3; b.x += b.vx * h; b.y += b.vy * h;
        const sand = H.sand.some(r => this.inRect(b.x, b.y, r)), sp = Math.hypot(b.vx, b.vy), dec = (sand ? 520 : 95) + sp * (sand ? 1.2 : 0.35), ns = Math.max(0, sp - dec * h);
        if (sp > 0) { b.vx *= ns / sp; b.vy *= ns / sp; }
        this.segs(H).forEach(w => { if (bounceSeg(b, w[0], w[1], w[2], w[3], 7, 0.75) && sp > 80 && !m.bot(i)) Sfx.tone(500, 0.03, 'triangle', 0.04); });
        if (H.mill) { const [mx, my, ml] = H.mill; for (let k = 0; k < 4; k++) { const a = S.mill + k * Math.PI / 2; bounceSeg(b, mx, my, mx + Math.cos(a) * ml, my + Math.sin(a) * ml, 8, 0.6); } }
        H.bumpers.forEach(([bx, by, br]) => { const dx = b.x - bx, dy = b.y - by, d = Math.hypot(dx, dy); if (d < br + 7 && d > 0) { const nx = dx / d, ny = dy / d; b.x = bx + nx * (br + 7); b.y = by + ny * (br + 7); const vn = b.vx * nx + b.vy * ny; if (vn < 0) { b.vx -= 2.15 * vn * nx; b.vy -= 2.15 * vn * ny; Sfx.tone(700, 0.05, 'square', 0.03); } } });
        // the cup
        const cd = Math.hypot(b.x - H.cup[0], b.y - H.cup[1]), spd = Math.hypot(b.vx, b.vy);
        if (cd < 9) { if (spd < 330) { b.done = true; b.vx = b.vy = 0; b.x = H.cup[0]; b.y = H.cup[1]; if (!m.bot(i)) { Sfx.coin(); } MGH.pop(b.strokes === 1 ? 'HOLE IN ONE!' : b.strokes <= H.par ? 'In!' : 'In.', this.qx(i) + H.cup[0], this.qy(i) + H.cup[1] - 20, '#ffe680', b.strokes === 1 ? 30 : 22); return; } else { b.vx += (b.y - H.cup[1]) * 4; b.vy += (H.cup[0] - b.x) * 4; } }
        if (H.water.some(r => this.inRect(b.x, b.y, r))) { b.strokes++; b.x = b.lx; b.y = b.ly; b.vx = b.vy = 0; MGH.pop('Splash! +1', this.qx(i) + b.x, this.qy(i) + b.y - 20, '#8fd8ff', 20); if (!m.bot(i)) Sfx.tone(300, 0.2, 'sine', 0.05, -150); return; }
      }
      if (b.strokes >= 7 && Math.hypot(b.vx, b.vy) < 3 && !b.done) { b.done = true; b.strokes = 8; b.x = H.cup[0]; b.y = H.cup[1]; MGH.pop('Picked up (8)', this.qx(i) + 300, this.qy(i) + 160, '#ffb0b0', 20); }
    });
    if (S.phase === 'play' && (S.p.every(b => b.done) || S.pt > 45)) {
      S.p.forEach((b, i) => { if (!b.done) b.strokes = Math.min(8, b.strokes + 2); S.tot[i] += b.strokes; });
      S.phase = 'card'; S.pt = 0;
    }
    if (S.phase === 'card' && S.pt > 2.6) { if (S.hole >= S.holes.length - 1) m.finish(this.score(m, S)); else this.nextHole(m, S); }
  },
  // how far a resting ball still is from the cup, going round walls via the hole's waypoints
  pathDist(H, x, y) {
    const walls = this.segs(H).slice(4), clear = (ax, ay, bx, by) => !walls.some(w => segHit(ax, ay, bx, by, w[0], w[1], w[2], w[3]));
    if (clear(x, y, H.cup[0], H.cup[1])) return Math.hypot(x - H.cup[0], y - H.cup[1]);
    let best = 1e9; H.way.forEach(w => { if (clear(x, y, w[0], w[1])) best = Math.min(best, Math.hypot(x - w[0], y - w[1]) + Math.hypot(w[0] - H.cup[0], w[1] - H.cup[1]) + 40); });
    return best < 1e9 ? best : Math.hypot(x - H.cup[0], y - H.cup[1]) + 400;
  },
  // a silent copy of the ball physics used by the computer golfers to plan a shot
  simShot(H, x, y, ang, pw) {
    const b = { x, y, vx: Math.cos(ang) * (40 + pw * 640), vy: Math.sin(ang) * (40 + pw * 640) }, segs = this.segs(H); let sandEnd = false;
    for (let st = 0; st < 600; st++) { const h = 1 / 180;
      b.x += b.vx * h; b.y += b.vy * h;
      const sand = H.sand.some(r => this.inRect(b.x, b.y, r)), sp = Math.hypot(b.vx, b.vy); if (sp < 3) break;
      const dec = (sand ? 520 : 95) + sp * (sand ? 1.2 : 0.35), ns = Math.max(0, sp - dec * h); b.vx *= ns / sp; b.vy *= ns / sp; sandEnd = sand;
      segs.forEach(w => bounceSeg(b, w[0], w[1], w[2], w[3], 7, 0.75));
      H.bumpers.forEach(([bx, by, br]) => { const dx = b.x - bx, dy = b.y - by, d = Math.hypot(dx, dy); if (d < br + 7 && d > 0) { const nx = dx / d, ny = dy / d; b.x = bx + nx * (br + 7); b.y = by + ny * (br + 7); const vn = b.vx * nx + b.vy * ny; if (vn < 0) { b.vx -= 2.15 * vn * nx; b.vy -= 2.15 * vn * ny; } } });
      if (Math.hypot(b.x - H.cup[0], b.y - H.cup[1]) < 9 && Math.hypot(b.vx, b.vy) < 330) return { x: b.x, y: b.y, sunk: true };
      if (H.water.some(r => this.inRect(b.x, b.y, r))) return { x: b.x, y: b.y, water: true };
    }
    return { x: b.x, y: b.y, sand: sandEnd };
  },
  bot(m, S, i, dt) {
    const v = m.vin[i], b = S.p[i], H = S.holes[S.hole]; v.left = v.right = v.up = v.down = false;
    if (b.done || Math.hypot(b.vx, b.vy) > 3 || S.phase !== 'play') { v.a = false; return; }
    if (!b.plan || b.plan.s !== b.strokes) {
      // try a fan of shots with the real ball physics and keep the one that ends nearest the cup
      let best = null;
      for (let a = 0; a < 48; a++) for (const pw of [0.12, 0.2, 0.28, 0.36, 0.45, 0.55, 0.66, 0.8]) {
        const ang = a / 48 * Math.PI * 2, r = this.simShot(H, b.x, b.y, ang, pw), sc = r.sunk ? -1000 + pw : r.water ? 9999 : this.pathDist(H, r.x, r.y) + (r.sand ? 25 : 0);
        if (!best || sc < best.sc) best = { sc, ang, pw };
      }
      const skill = 0.06; b.plan = { s: b.strokes, ang: best.ang + R.range(-skill, skill), pw: clamp(best.pw + R.range(-0.05, 0.05), 0.08, 1), wait: R.range(0.4, 1.2) };
    }
    const d = Math.atan2(Math.sin(b.plan.ang - b.ang), Math.cos(b.plan.ang - b.ang));
    if (Math.abs(d) > 0.02) { if (Math.abs(d) > 0.12) { if (d > 0) v.right = true; else v.left = true; } else { if (d > 0) v.down = true; else v.up = true; } v.a = false; return; }
    b.plan.wait -= dt; if (b.plan.wait > 0) return;
    if (H.mill && b.x < 320) { const a = ((S.mill % (Math.PI / 2)) + Math.PI / 2) % (Math.PI / 2); if (b.hold < 0 && (a < 0.5 || a > 1.2)) { v.a = false; return; } }
    v.a = !(b.hold > 0 && powerSwing(b.hold) >= b.plan.pw && b.hold < 1.3);
  },
  score(m, S) { return S.tot.map(t => -t); },
  fmt(s) { return `${-s} strokes`; },
  hud(m, S, i) { const b = S.p[i]; return `${S.tot[i] + (S.phase === 'play' ? b.strokes : 0)} strokes` + (b.done ? ' ⛳' : ''); },
  qx(i) { return i % 2 ? 660 : 20; }, qy(i) { return i < 2 ? 52 : 384; },
  draw(m, S, g) {
    // ocean and island
    const T = S.th || GOLF_THEME[0];
    g.fillStyle = MGH.grad(g, 0, 720, T.bg); g.fillRect(0, 0, 1280, 720);
    for (let k = 0; k < 40; k++) { const x = (k * 97 + m.t * 20) % 1300 - 10, y = 40 + (k * 61) % 680;
      if (T.fx === 'waves') { g.strokeStyle = 'rgba(255,255,255,0.25)'; g.lineWidth = 2; g.beginPath(); g.arc(x, y, 8, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }
      else if (T.fx === 'dunes') { g.strokeStyle = 'rgba(255,230,180,0.25)'; g.lineWidth = 3; g.beginPath(); g.arc((k * 131) % 1280, 40 + (k * 61) % 680, 30, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); }
      else if (T.fx === 'snow') { g.fillStyle = 'rgba(255,255,255,0.8)'; g.beginPath(); g.arc((k * 131 + Math.sin(m.t + k) * 20) % 1280, (k * 61 + m.t * 30) % 720, 2.5, 0, 7); g.fill(); }
      else if (T.fx === 'sprinkles') { g.save(); g.translate((k * 131) % 1280, 40 + (k * 61) % 680); g.rotate(k); g.fillStyle = ['#fff', '#ffe680', '#8ae0ff', '#7cf06a'][k % 4]; g.fillRect(-6, -2, 12, 4); g.restore(); }
      else if (T.fx === 'embers') { const q = (m.t * 0.3 + k / 40) % 1; g.fillStyle = `rgba(255,${120 + (k % 3) * 40},40,${0.8 * (1 - q)})`; g.beginPath(); g.arc((k * 131) % 1280, 720 - q * 700, 2.5, 0, 7); g.fill(); }
      else { const a = 0.4 + 0.5 * Math.sin(m.t * 2 + k); g.fillStyle = `rgba(255,255,230,${a})`; g.fillRect((k * 131) % 1280, 40 + (k * 61) % 680, 2, 2); } }
    const H = S.holes[S.hole];
    S.p.forEach((b, i) => {
      const ox = this.qx(i), oy = this.qy(i), p = m.players[i];
      g.save(); g.translate(ox, oy);
      g.fillStyle = T.rim; MGH.rr(g, -12, -12, 624, 344, 26); g.fill();
      g.fillStyle = T.frame; MGH.rr(g, -6, -6, 612, 332, 18); g.fill();
      const tg = g.createLinearGradient(0, 0, 600, 320); tg.addColorStop(0, T.turf[0]); tg.addColorStop(1, T.turf[1]); g.fillStyle = tg; g.fillRect(0, 0, 600, 320);
      g.fillStyle = 'rgba(255,255,255,0.06)'; for (let k = 0; k < 12; k++) g.fillRect(k * 50, 0, 25, 320);
      H.sand.forEach(r => { g.fillStyle = T.sand; MGH.rr(g, r[0], r[1], r[2], r[3], 18); g.fill(); g.fillStyle = 'rgba(180,140,80,0.3)'; for (let k = 0; k < 8; k++) { g.beginPath(); g.arc(r[0] + MGH.hash(k + r[0]) * r[2], r[1] + MGH.hash(k * 3 + r[1]) * r[3], 2, 0, 7); g.fill(); } });
      H.water.forEach(r => { if (T.fx === 'embers') MGH.glow(g, r[0] + r[2] / 2, r[1] + r[3] / 2, Math.max(r[2], r[3]) * 0.7, 'rgba(255,120,30,0.4)'); g.fillStyle = T.water; MGH.rr(g, r[0], r[1], r[2], r[3], 18); g.fill(); g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 2; g.beginPath(); g.arc(r[0] + r[2] / 2 + Math.sin(m.t * 2) * 10, r[1] + r[3] / 2, 10, Math.PI, Math.PI * 1.8); g.stroke(); });
      H.walls.forEach(w => { g.strokeStyle = T.wall[0]; g.lineWidth = 12; g.lineCap = 'round'; g.beginPath(); g.moveTo(w[0], w[1]); g.lineTo(w[2], w[3]); g.stroke(); g.strokeStyle = T.wall[1]; g.lineWidth = 6; g.stroke(); });
      H.bumpers.forEach(([bx, by, br]) => { g.fillStyle = T.bump; g.beginPath(); g.arc(bx, by, br, 0, 7); g.fill(); g.fillStyle = '#ffd0d8'; g.beginPath(); g.arc(bx - br * 0.3, by - br * 0.3, br * 0.35, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.arc(bx, by, br, 0, 7); g.stroke(); });
      if (H.mill) { const [mx, my, ml] = H.mill; g.fillStyle = '#e8e0d0'; g.beginPath(); g.arc(mx, my, 20, 0, 7); g.fill(); for (let k = 0; k < 4; k++) { const a = S.mill + k * Math.PI / 2; g.strokeStyle = '#8a5a32'; g.lineWidth = 9; g.beginPath(); g.moveTo(mx, my); g.lineTo(mx + Math.cos(a) * ml, my + Math.sin(a) * ml); g.stroke(); g.strokeStyle = '#fff'; g.lineWidth = 4; g.stroke(); } g.fillStyle = '#c8302a'; g.beginPath(); g.arc(mx, my, 9, 0, 7); g.fill(); }
      // cup + flag
      g.fillStyle = '#123'; g.beginPath(); g.ellipse(H.cup[0], H.cup[1], 10, 8, 0, 0, 7); g.fill();
      g.strokeStyle = '#eee'; g.lineWidth = 3; g.beginPath(); g.moveTo(H.cup[0], H.cup[1]); g.lineTo(H.cup[0], H.cup[1] - 50); g.stroke();
      g.fillStyle = p.color; g.beginPath(); g.moveTo(H.cup[0], H.cup[1] - 50); g.lineTo(H.cup[0] + 26 + Math.sin(m.t * 6) * 3, H.cup[1] - 42); g.lineTo(H.cup[0], H.cup[1] - 34); g.fill();
      // aim + power
      if (!b.done && Math.hypot(b.vx, b.vy) < 3) { g.strokeStyle = 'rgba(255,255,255,0.75)'; g.setLineDash([6, 6]); g.lineWidth = 2; g.beginPath(); g.moveTo(b.x, b.y); g.lineTo(b.x + Math.cos(b.ang) * 90, b.y + Math.sin(b.ang) * 90); g.stroke(); g.setLineDash([]); if (b.hold > 0) drawPowerBar(g, b.x, b.y + 18, 90, powerSwing(b.hold)); }
      // ball
      if (!b.done || b.sink < 0.3) { g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(b.x + 2, b.y + 3, 7, 5, 0, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(b.x, b.y, 7 * (b.done ? 1 - b.sink * 3 : 1), 0, 7); g.fill(); g.strokeStyle = p.color; g.lineWidth = 2; g.stroke(); }
      // golfer
      Char.draw(g, 40, 290, 22, p.el.id, p.color, { mood: b.done ? (b.strokes <= H.par ? 'cheer' : 'happy') : Math.hypot(b.vx, b.vy) > 3 ? 'nervous' : 'determined', seed: i * 1.7, look: { x: 1, y: 0 } });
      MGH.text(g, `${p.name} · ${b.strokes} stroke${b.strokes === 1 ? '' : 's'}`, 300, 312, 15, '#fff', 'center', 'bold');
      g.restore();
    });
    MGH.label(g, `${T.name} · Hole ${S.hole + 1}: ${H.name} · par ${H.par}`, 640, 368, 18, '#fff', 'rgba(0,0,0,0.6)');
    if (S.phase === 'card') { g.fillStyle = 'rgba(10,20,40,0.85)'; MGH.rr(g, 400, 220, 480, 260, 24); g.fill(); MGH.text(g, `Scorecard after hole ${S.hole + 1}`, 640, 266, 24, '#ffe680', 'center', 'bold'); [0, 1, 2, 3].sort((a, b) => S.tot[a] - S.tot[b]).forEach((i, k) => MGH.text(g, `${k + 1}. ${m.players[i].name} — ${S.tot[i]}`, 640, 312 + k * 38, 24, m.players[i].color, 'center', 'bold')); }
  },
});

// ======================================================================== ICE HOCKEY (2 vs 2)
MG.def({
  id: 'hockey', name: 'Ice Hockey', type: 'Arena', mode: '2v2', controls: 'Move + A & B', dur: 75, sport: true,
  rows: [['pad', 'Skate'], ['a', 'Shoot'], ['b', 'Pass / body check']],
  how: 'Two against two on the ice! Skate into the puck to pick it up. A shoots it the way you are facing, B passes to your teammate. Without the puck, B is a body check — slam into the carrier to knock the puck loose. RED shoots into the goal on the RIGHT, BLUE into the goal on the LEFT. The ice is slippery — you glide!',
  wins: 'The team with more goals.',
  R: { x0: 80, x1: 1200, y0: 110, y1: 660, gy0: 320, gy1: 450 },
  init(m, S) { S.goals = [0, 0]; S.pk = { x: 640, y: 385, vx: 0, vy: 0 }; S.car = -1; S.pause = 1; this.faceoff(m, S); },
  side(m, tm) { return tm === 0 ? 1 : -1; }, // team 0 attacks to the right
  faceoff(m, S) {
    const spots = [[-180, -90], [-320, 90]], k = [0, 0];
    S.b = m.players.map((p, i) => { const tm = m.teamOf(i), j = k[tm]++, s = this.side(m, tm); return Object.assign(MGH.body(640 - s * Math.abs(spots[j][0]) , 385 + spots[j][1], 22), { cd: 0, ck: 0, pick: 0, touch: 0, face: { x: s, y: 0 } }); });
    S.pk = { x: 640, y: 385, vx: 0, vy: 0 }; S.car = -1; S.pause = 1.2;
  },
  update(m, S, dt) {
    const Rk = this.R;
    if (S.pause > 0) { S.pause -= dt; return; }
    S.b.forEach((b, i) => {
      const a = m.axis(i); MGH.steer(b, a.x, a.y, dt, 1150, b.ck > 0.8 ? 560 : 330, 1.1);
      b.cd -= dt; b.ck -= dt; b.pick -= dt;
      if (S.car === i) {
        if (m.pressed(i, 'a')) { S.pk.vx = b.face.x * 920 + b.vx * 0.4; S.pk.vy = b.face.y * 920 + b.vy * 0.4; S.car = -1; b.pick = 0.35; Sfx.punch(); MGH.burst(S.pk.x, S.pk.y, ['#fff', '#bfe8ff'], 8, { speed: 160 }); }
        else if (m.pressed(i, 'b')) { const mate = m.mates(i)[0]; const t = S.b[mate]; const dx = t.x + t.vx * 0.2 - b.x, dy = t.y + t.vy * 0.2 - b.y, d = Math.hypot(dx, dy) || 1; S.pk.vx = dx / d * 720; S.pk.vy = dy / d * 720; S.car = -1; b.pick = 0.35; Sfx.whoosh(); }
      } else if (m.pressed(i, 'b') && b.ck <= 0) { b.vx += b.face.x * 520; b.vy += b.face.y * 520; b.ck = 1.3; Sfx.whoosh(); }
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.x < Rk.x0 + 22) { b.x = Rk.x0 + 22; b.vx = Math.abs(b.vx) * 0.5; } if (b.x > Rk.x1 - 22) { b.x = Rk.x1 - 22; b.vx = -Math.abs(b.vx) * 0.5; }
      if (b.y < Rk.y0 + 22) { b.y = Rk.y0 + 22; b.vy = Math.abs(b.vy) * 0.5; } if (b.y > Rk.y1 - 22) { b.y = Rk.y1 - 22; b.vy = -Math.abs(b.vy) * 0.5; }
    });
    MGH.collide(S.b, 1.2);
    // checks knock the puck loose
    if (S.car >= 0) { const c = S.b[S.car]; S.b.forEach((b, i) => { if (m.teamOf(i) !== m.teamOf(S.car) && b.ck > 0.9 && dist(b.x, b.y, c.x, c.y) < 52) { S.pk.vx = b.vx * 0.8 + R.range(-150, 150); S.pk.vy = b.vy * 0.8 + R.range(-150, 150); c.pick = 0.6; S.car = -1; Sfx.punch(); MGH.shake(6); MGH.pop('CHECK!', c.x, c.y - 50, '#fff', 26); } }); }
    // puck
    const P = S.pk;
    if (S.car >= 0) { const c = S.b[S.car]; P.x = c.x + c.face.x * 30; P.y = c.y + c.face.y * 30 + 10; P.vx = c.vx; P.vy = c.vy; }
    else {
      P.x += P.vx * dt; P.y += P.vy * dt; const sp = Math.hypot(P.vx, P.vy); if (sp > 0) { const ns = Math.max(0, sp - (30 + sp * 0.35) * dt); P.vx *= ns / sp; P.vy *= ns / sp; }
      const inMouth = P.y > Rk.gy0 && P.y < Rk.gy1;
      if (P.x < Rk.x0 + 10 && !inMouth) { P.x = Rk.x0 + 10; P.vx = Math.abs(P.vx) * 0.85; } if (P.x > Rk.x1 - 10 && !inMouth) { P.x = Rk.x1 - 10; P.vx = -Math.abs(P.vx) * 0.85; }
      if (P.y < Rk.y0 + 10) { P.y = Rk.y0 + 10; P.vy = Math.abs(P.vy) * 0.85; } if (P.y > Rk.y1 - 10) { P.y = Rk.y1 - 10; P.vy = -Math.abs(P.vy) * 0.85; }
      // goals
      if (P.x < Rk.x0 - 6 || P.x > Rk.x1 + 6) {
        const tm = P.x > 640 ? 0 : 1; S.goals[tm]++; Sfx.crowd('cheer'); Sfx.whistle(); MGH.shake(10);
        for (let k = 0; k < 3; k++) MGH.burst(P.x < 640 ? Rk.x0 : Rk.x1, 385, [MG.TEAMC[tm], '#fff', '#ffd34d'], 30, { speed: 380, life: 1.2 });
        S.flash = { tm, t: 1.6 }; this.faceoff(m, S); return;
      }
      S.b.forEach((b, i) => { if (b.pick <= 0 && dist(b.x, b.y, P.x, P.y) < 36) { S.car = i; b.touch = 0; if (!m.bot(i)) Sfx.tone(600, 0.03, 'triangle', 0.04); } });
    }
    if (S.flash) { S.flash.t -= dt; if (S.flash.t <= 0) S.flash = null; }
  },
  bot(m, S, i) {
    const b = S.b[i], v = m.vin[i], tm = m.teamOf(i), s = this.side(m, tm), P = S.pk, Rk = this.R; v.a = false; v.b = false;
    const gx = s > 0 ? Rk.x1 : Rk.x0, myGoal = s > 0 ? Rk.x0 : Rk.x1, mate = m.mates(i)[0];
    if (S.car === i) {
      MGH.aim(m, i, gx, 385 + Math.sin(m.t + i) * 40, b);
      if (Math.abs(gx - b.x) < 360 && Math.random() < 0.06) v.a = true;
      const foe = S.b.find((o, j) => m.teamOf(j) !== tm && dist(o.x, o.y, b.x, b.y) < 90); if (foe && Math.random() < 0.04) v.b = true;
      return;
    }
    const teamHas = S.car >= 0 && m.teamOf(S.car) === tm, theyHave = S.car >= 0 && !teamHas;
    const dMe = dist(b.x, b.y, P.x, P.y), dMate = dist(S.b[mate].x, S.b[mate].y, P.x, P.y);
    if (teamHas) MGH.aim(m, i, gx - s * 260, 385 + (i % 2 ? -120 : 120), b);
    else if (dMe <= dMate || Math.random() < 0.002) { MGH.aim(m, i, P.x + P.vx * 0.15, P.y + P.vy * 0.15, b); if (theyHave && dMe < 110 && b.ck <= 0 && Math.random() < 0.1) v.b = true; }
    else MGH.aim(m, i, (P.x + myGoal) / 2, (P.y + 385) / 2, b);
  },
  score(m, S) { return m.players.map((p, i) => S.goals[m.teamOf(i)]); },
  fmt(s) { return `${s} goal${s === 1 ? '' : 's'}`; },
  hud(m, S, i) { return `${MG.TEAMN[m.teamOf(i)]}` + (S.car === i ? ' 🏒' : ''); },
  draw(m, S, g) {
    const Rk = this.R;
    g.fillStyle = MGH.grad(g, 0, 720, ['#1a2a4a', '#2a3a5a']); g.fillRect(0, 0, 1280, 720);
    MGH.crowd(g, m.t, 100, 30, ['#c84a5a', '#4a6ac8', '#8a8a9a', '#c8a84a']);
    // ice
    g.fillStyle = '#e8f4ff'; MGH.rr(g, Rk.x0 - 10, Rk.y0 - 10, Rk.x1 - Rk.x0 + 20, Rk.y1 - Rk.y0 + 20, 60); g.fill();
    const ig = g.createLinearGradient(0, Rk.y0, 0, Rk.y1); ig.addColorStop(0, '#f4faff'); ig.addColorStop(1, '#d4e8f8'); g.fillStyle = ig; MGH.rr(g, Rk.x0, Rk.y0, Rk.x1 - Rk.x0, Rk.y1 - Rk.y0, 52); g.fill();
    for (let k = 0; k < 14; k++) { g.strokeStyle = 'rgba(160,200,230,0.25)'; g.lineWidth = 1; g.beginPath(); g.moveTo(Rk.x0 + MGH.hash(k) * 1100, Rk.y0 + MGH.hash(k + 3) * 540); g.lineTo(Rk.x0 + MGH.hash(k + 7) * 1100, Rk.y0 + MGH.hash(k + 9) * 540); g.stroke(); }
    g.strokeStyle = '#d83a3a'; g.lineWidth = 6; g.beginPath(); g.moveTo(640, Rk.y0); g.lineTo(640, Rk.y1); g.stroke();
    g.strokeStyle = '#3a6ad8'; g.lineWidth = 5; for (const x of [430, 850]) { g.beginPath(); g.moveTo(x, Rk.y0); g.lineTo(x, Rk.y1); g.stroke(); }
    g.strokeStyle = '#3a6ad8'; g.lineWidth = 4; g.beginPath(); g.arc(640, 385, 80, 0, 7); g.stroke();
    // goals
    [[Rk.x0, 1, 1], [Rk.x1, -1, 0]].forEach(([x, s, owner]) => { g.fillStyle = 'rgba(255,255,255,0.7)'; g.fillRect(x - (s > 0 ? 40 : 0), Rk.gy0, 40, Rk.gy1 - Rk.gy0); g.strokeStyle = MG.TEAMC[owner]; g.lineWidth = 7; g.strokeRect(x - (s > 0 ? 40 : 0), Rk.gy0, 40, Rk.gy1 - Rk.gy0); g.strokeStyle = 'rgba(0,0,0,0.15)'; g.lineWidth = 1; for (let k = 1; k < 8; k++) { g.beginPath(); g.moveTo(x - (s > 0 ? 40 : 0), Rk.gy0 + k * 16); g.lineTo(x + (s > 0 ? 0 : 40), Rk.gy0 + k * 16); g.stroke(); } g.fillStyle = 'rgba(80,140,255,0.15)'; g.beginPath(); g.arc(x, 385, 90, s > 0 ? -Math.PI / 2 : Math.PI / 2, s > 0 ? Math.PI / 2 : Math.PI * 1.5); g.fill(); });
    // skaters
    S.b.forEach((b, i) => {
      const p = m.players[i], tc = MG.TEAMC[m.teamOf(i)];
      g.fillStyle = tc; g.globalAlpha = 0.45; g.beginPath(); g.ellipse(b.x, b.y + 28, 30, 10, 0, 0, 7); g.fill(); g.globalAlpha = 1;
      if (b.ck > 1) { g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 3; g.beginPath(); g.arc(b.x, b.y, 34, 0, 7); g.stroke(); }
      MGH.drawBody(g, b, p, null, S.car === i ? 'determined' : null);
      // stick
      g.strokeStyle = '#6a4a2a'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(b.x + b.face.x * 8, b.y + 6); g.lineTo(b.x + b.face.x * 34, b.y + 16 + b.face.y * 20); g.stroke();
    });
    const P = S.pk; g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(P.x + 2, P.y + 4, 11, 5, 0, 0, 7); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.ellipse(P.x, P.y, 11, 6, 0, 0, 7); g.fill(); g.fillStyle = '#444'; g.beginPath(); g.ellipse(P.x, P.y - 2, 11, 5, 0, 0, 7); g.fill();
    // scoreboard
    g.fillStyle = 'rgba(10,10,30,0.85)'; MGH.rr(g, 500, 48, 280, 52, 14); g.fill();
    MGH.text(g, String(S.goals[0]), 580, 88, 38, MG.TEAMC[0], 'center', 'bold'); MGH.text(g, ':', 640, 86, 34, '#fff', 'center', 'bold'); MGH.text(g, String(S.goals[1]), 700, 88, 38, MG.TEAMC[1], 'center', 'bold');
    if (S.flash) MGH.text(g, `GOAL! Team ${MG.TEAMN[S.flash.tm]}`, 640, 300, 64, MG.TEAMC[S.flash.tm], 'center', 'bold');
  },
});

// ======================================================================== BEACH VOLLEY (2 vs 2)
MG.def({
  id: 'volley', name: 'Beach Volley', type: 'Arena', mode: '2v2', controls: 'Left/Right + jump', dur: 45, sport: true,
  rows: [['lr', 'Run'], ['a', 'Jump (hit the ball in the air to SPIKE)']],
  how: 'Two against two on the sand. Run under the ball to bump it back over the net. Jump and touch the ball high up to SPIKE it down hard! Holding LEFT or RIGHT as you touch it steers the shot. If the ball lands on your side, the other team scores. First team to 5 points wins.',
  wins: 'First to 5 points (or the most points at the end).',
  init(m, S) { S.pts = [0, 0]; this.serve(m, S, R.int(0, 1)); },
  side(m, tm) { return tm === 0 ? -1 : 1; }, // team 0 plays on the left
  serve(m, S, tm) {
    const k = [0, 0];
    S.b = m.players.map((p, i) => { const t = m.teamOf(i), j = k[t]++; const x = 640 + this.side(m, t) * (j ? 470 : 230); return { x, y: 600, vx: 0, vy: 0, gnd: true, face: -this.side(m, t), cd: 0 }; });
    const srv = S.b.findIndex((b, i) => m.teamOf(i) === tm); S.ball = { x: S.b[srv].x, y: 330, vx: 0, vy: 0 }; S.wait = 1.2; S.last = -1;
  },
  update(m, S, dt) {
    if (S.wait > 0) { S.wait -= dt; return; }
    S.b.forEach((b, i) => {
      const tm = m.teamOf(i), s = this.side(m, tm), a = m.axis(i);
      b.vx += (a.x * 1900 - b.vx * 7) * dt; b.vx = clamp(b.vx, -360, 360); if (Math.abs(a.x) > 0.3) b.face = Math.sign(a.x);
      if (m.pressed(i, 'a') && b.gnd) { b.vy = -680; b.gnd = false; if (!m.bot(i)) Sfx.tone(500, 0.06, 'triangle', 0.05, 300); }
      b.vy += 1700 * dt; b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.y >= 600) { b.y = 600; b.vy = 0; b.gnd = true; }
      const lo = s < 0 ? 70 : 664, hi = s < 0 ? 616 : 1210; b.x = clamp(b.x, lo, hi);
      b.cd -= dt;
    });
    const B = S.ball, bk = 1 + Math.min(0.7, m.t * 0.016), bd = dt * bk; // the rally gets faster as the match goes on
    B.vy += 620 * bd; B.x += B.vx * bd; B.y += B.vy * bd;
    if (B.x < 30) { B.x = 30; B.vx = Math.abs(B.vx) * 0.8; } if (B.x > 1250) { B.x = 1250; B.vx = -Math.abs(B.vx) * 0.8; }
    // net
    if (B.y > 410 && Math.abs(B.x - 640) < 26) { B.x = 640 + Math.sign(B.x - 640 || 1) * 26; B.vx = -B.vx * 0.5; }
    if (B.y > 395 && B.y < 420 && Math.abs(B.x - 640) < 10 && B.vy > 0) { B.vy = -Math.abs(B.vy) * 0.5; }
    // touches
    S.b.forEach((b, i) => {
      const hx = b.x, hy = b.y - 70;
      if (b.cd <= 0 && dist(hx, hy, B.x, B.y) < 64) {
        const tm = m.teamOf(i), dir = -this.side(m, tm), ax = m.axis(i).x, high = !b.gnd && B.y < b.y - 80 && B.y < 420 && S.last >= 0;
        if (high && Math.abs(b.x - 640) < 300) { B.vx = dir * (470 + Math.random() * 90) + ax * 100; B.vy = 60 + Math.random() * 60; Sfx.punch(); MGH.burst(B.x, B.y, ['#fff', '#ffd34d'], 14, { speed: 260 }); MGH.pop('SPIKE!', B.x, B.y - 30, '#ffd34d', 26); MGH.shake(5); }
        else { const toNet = Math.abs(640 - b.x); B.vx = dir * clamp(toNet * 0.85 + 180, 220, 520) + ax * 140; B.vy = -640 - Math.random() * 80; Sfx.tone(400, 0.06, 'triangle', 0.07); }
        b.cd = 0.35; S.last = i;
      }
    });
    if (B.y >= 640) {
      const tm = B.x < 640 ? 1 : 0; S.pts[tm]++; Sfx.whistle(); MGH.burst(B.x, 630, ['#f0d898', '#fff'], 20, { speed: 200 });
      S.flash = { tm, t: 1.4 };
      if (S.pts[tm] >= 5) { m.finish(this.score(m, S)); return; }
      this.serve(m, S, tm);
    }
    if (S.flash) { S.flash.t -= dt; if (S.flash.t <= 0) S.flash = null; }
  },
  land(S) { // where the ball comes down to head height
    const B = S.ball; let x = B.x, y = B.y, vx = B.vx, vy = B.vy;
    for (let k = 0; k < 240; k++) { vy += 620 / 60; x += vx / 60; y += vy / 60; if (x < 30 || x > 1250) vx = -vx; if (vy > 0 && y > 520) break; }
    return x;
  },
  bot(m, S, i) {
    const b = S.b[i], v = m.vin[i], tm = m.teamOf(i), s = this.side(m, tm), B = S.ball; v.a = false; v.left = v.right = false;
    const lx = this.land(S), mine = (lx < 640) === (s < 0), mate = m.mates(i)[0], mb = S.b[mate];
    const home = 640 + s * (i < mate ? 230 : 470);
    let tx = home;
    const side = (B.x < 640) === (s < 0) ? 'mine' : 'theirs';
    if (b.lastSide !== side) { b.lastSide = side; b.err = Math.random() < 0.22 ? R.pick([-1, 1]) * R.range(70, 120) : R.range(-25, 25); }
    if (mine) { const me = Math.abs(b.x - lx) <= Math.abs(mb.x - lx); if (me) tx = lx + s * 18 + (b.err || 0); }
    if (tx < b.x - 12) v.left = true; else if (tx > b.x + 12) v.right = true;
    if (Math.abs(b.x - 640) < 260 && Math.abs(B.x - b.x) < 60 && B.y > 250 && B.y < 400 && B.vy > 0 && b.gnd && ((B.x < 640) === (s < 0)) && S.last >= 0 && Math.random() < 0.06) v.a = true;
  },
  score(m, S) { return m.players.map((p, i) => S.pts[m.teamOf(i)]); },
  fmt(s) { return `${s} pts`; },
  hud(m, S, i) { return MG.TEAMN[m.teamOf(i)]; },
  draw(m, S, g) {
    g.fillStyle = MGH.grad(g, 0, 720, ['#ffb86a', '#ffd89a', '#bfeaff']); g.fillRect(0, 0, 1280, 720);
    MGH.glow(g, 1000, 120, 160, 'rgba(255,240,180,0.9)'); g.fillStyle = '#ffe680'; g.beginPath(); g.arc(1000, 120, 50, 0, 7); g.fill();
    g.fillStyle = '#3aa8d8'; g.fillRect(0, 430, 1280, 80); for (let k = 0; k < 20; k++) { g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 2; g.beginPath(); g.arc((k * 70 + m.t * 30) % 1300, 450 + (k % 3) * 18, 12, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }
    for (const px of [120, 1160]) { g.strokeStyle = '#8a5a32'; g.lineWidth = 12; g.beginPath(); g.moveTo(px, 640); g.quadraticCurveTo(px + 20, 450, px + 10, 330); g.stroke(); for (let k = 0; k < 6; k++) { const a = -Math.PI / 2 + (k - 2.5) * 0.5; g.strokeStyle = '#3a9a3a'; g.lineWidth = 10; g.beginPath(); g.moveTo(px + 10, 330); g.quadraticCurveTo(px + 10 + Math.cos(a) * 60, 330 + Math.sin(a) * 40 - 20, px + 10 + Math.cos(a) * 110, 330 + Math.sin(a) * 30 + 30); g.stroke(); } }
    g.fillStyle = MGH.grad(g, 500, 720, ['#f8e4b0', '#e8c888']); g.fillRect(0, 500, 1280, 220);
    // net
    g.strokeStyle = '#fff'; g.lineWidth = 8; g.beginPath(); g.moveTo(640, 640); g.lineTo(640, 400); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(616, 400, 48, 70); g.strokeStyle = 'rgba(60,60,60,0.5)'; g.lineWidth = 1; for (let k = 0; k < 7; k++) { g.beginPath(); g.moveTo(616, 400 + k * 10); g.lineTo(664, 400 + k * 10); g.stroke(); } for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(616 + k * 12, 400); g.lineTo(616 + k * 12, 470); g.stroke(); }
    g.fillStyle = '#fff'; g.fillRect(612, 396, 56, 8);
    // players
    S.b.forEach((b, i) => {
      const p = m.players[i], tc = MG.TEAMC[m.teamOf(i)];
      MGH.shadow(g, b.x, 642, 30, 0.25);
      g.fillStyle = tc; g.globalAlpha = 0.5; g.beginPath(); g.ellipse(b.x, 642, 34, 9, 0, 0, 7); g.fill(); g.globalAlpha = 1;
      Char.draw(g, b.x, b.y - 30, 34, p.el.id, p.color, { mood: b.gnd ? 'determined' : 'cheer', seed: i * 1.7, look: { x: b.face, y: -0.5 }, walk: Math.abs(b.vx) > 60 ? 1 : 0 });
    });
    // ball
    const B = S.ball; MGH.shadow(g, B.x, 642, 16 * clamp(1 - (640 - B.y) / 600, 0.3, 1), 0.2);
    g.save(); g.translate(B.x, B.y); g.rotate(B.x * 0.02); const bg = g.createRadialGradient(-6, -6, 2, 0, 0, 20); bg.addColorStop(0, '#fff'); bg.addColorStop(1, '#f0e0b0'); g.fillStyle = bg; g.beginPath(); g.arc(0, 0, 20, 0, 7); g.fill();
    g.strokeStyle = '#ffb030'; g.lineWidth = 4; g.beginPath(); g.arc(0, 0, 20, -0.6, 0.9); g.stroke(); g.strokeStyle = '#3a8ae8'; g.beginPath(); g.arc(0, 0, 20, 2.4, 3.9); g.stroke(); g.restore();
    // score
    g.fillStyle = 'rgba(10,10,30,0.7)'; MGH.rr(g, 520, 52, 240, 52, 14); g.fill();
    MGH.text(g, String(S.pts[0]), 590, 92, 38, MG.TEAMC[0], 'center', 'bold'); MGH.text(g, '·', 640, 90, 34, '#fff', 'center', 'bold'); MGH.text(g, String(S.pts[1]), 690, 92, 38, MG.TEAMC[1], 'center', 'bold');
    if (S.flash) MGH.text(g, `Point Team ${MG.TEAMN[S.flash.tm]}!`, 640, 260, 52, MG.TEAMC[S.flash.tm], 'center', 'bold');
  },
});

// ======================================================================== SNOW FORT SIEGE (1 vs 3)
MG.def({
  id: 'snowfort', name: 'Snow Fort Siege', type: 'Arena', mode: '1v3', controls: 'Move + button', dur: 60,
  rows: [['pad', 'Run / aim'], ['a', 'Throw (fort)']],
  how: 'ONE hero defends the snow fort with a snowball cannon: move the target with the stick and press A to lob a snowball there (it takes a moment to land). THREE heroes grab the 9 flags one at a time and carry them back to their camp at the bottom — carrying slows you down. A runner hit by a snowball turns into a snowman for a couple of seconds and drops the flag. Runners win by bringing every flag home; the fort wins if any are left when time runs out.',
  wins: 'Runners: bring all 9 flags home. Fort: hold out until time runs out.',
  init(m, S) {
    S.solo = m.players.findIndex((p, i) => m.teamOf(i) === 0);
    S.ch = { x: 640, y: 380 }; S.cd = 0; S.balls = [];
    S.b = m.players.map((p, i) => i === S.solo ? null : Object.assign(MGH.body(340 + i * 200, 660, 20), { frozen: 0 }));
    S.flags = [...Array(9)].map((_, k) => ({ x: 150 + (k % 5) * 245 + R.range(-40, 40), y: 225 + Math.floor(k / 5) * 70 + R.range(-15, 15), got: false, by: null }));
    S.trees = [...Array(7)].map((_, k) => ({ x: 80 + k * 190 + R.range(-30, 30), y: R.pick([300, 420, 560]) }));
    S.win = -1;
  },
  update(m, S, dt) {
    const so = S.solo, a = m.axis(so);
    S.ch.x = clamp(S.ch.x + a.x * 560 * dt, 40, 1240); S.ch.y = clamp(S.ch.y + a.y * 560 * dt, 200, 700);
    S.cd -= dt;
    if (m.pressed(so, 'a') && S.cd <= 0) { S.cd = 0.45; S.balls.push({ sx: 640, sy: 150, x: S.ch.x, y: S.ch.y, t: 0 }); Sfx.thud(); }
    S.balls.forEach(bl => {
      bl.t += dt;
      if (bl.t >= 0.5 && !bl.hit) { bl.hit = true; Sfx.noise(0.15, 800, 0.08, 'lowpass'); MGH.burst(bl.x, bl.y, ['#fff', '#dff4ff'], 18, { speed: 220 }); S.b.forEach((b, i) => { if (b && b.frozen <= 0 && dist(b.x, b.y, bl.x, bl.y) < 52) { b.frozen = 2.6; if (b.flag) { b.flag.by = null; b.flag.x = b.x; b.flag.y = b.y - 30; b.flag = null; } Sfx.tone(1200, 0.2, 'sine', 0.05, -600); MGH.pop('BRRR!', b.x, b.y - 50, '#bfe8ff', 26); } }); }
    });
    S.balls = S.balls.filter(bl => bl.t < 0.9);
    S.b.forEach((b, i) => {
      if (!b) return;
      b.frozen -= dt;
      const ax = b.frozen > 0 ? { x: 0, y: 0 } : m.axis(i); MGH.steer(b, ax.x, ax.y, dt, 1600, b.flag ? 165 : 240, 6); b.x += b.vx * dt; b.y += b.vy * dt;
      b.x = clamp(b.x, 30, 1250); b.y = clamp(b.y, 210, 700);
      // grab a flag (one at a time) and carry it back to the camp at the bottom; carriers are slower
      if (b.frozen <= 0 && !b.flag) S.flags.forEach(f => { if (!f.got && !f.by && !b.flag && dist(b.x, b.y, f.x, f.y) < 34) { f.by = b; b.flag = f; Sfx.tone(900, 0.06, 'triangle', 0.05); } });
      if (b.flag) { b.flag.x = b.x + 18; b.flag.y = b.y - 10; if (b.y > 640) { b.flag.got = true; b.flag.by = null; b.flag = null; Sfx.coin(); MGH.pop('⚑ +1', b.x, b.y - 50, '#ffe680', 30); } }
    });
    MGH.collide(S.b.filter(b => b), 1);
    if (S.flags.every(f => f.got)) { S.win = 1; m.finish(this.score(m, S)); }
  },
  bot(m, S, i) {
    const v = m.vin[i]; v.a = false;
    if (i === S.solo) {
      const alive = S.b.filter(b => b && b.frozen <= 0); if (!alive.length) { m.vin[i].ax = 0; m.vin[i].ay = 0; return; }
      const t = alive.reduce((best, b) => { const fl = b.flag ? -1 : S.flags.filter(f => !f.got).reduce((d, f) => Math.min(d, dist(b.x, b.y, f.x, f.y)), 1e9); return !best || fl < best.fl ? { b, fl } : best; }, null).b;
      const tx = t.x + t.vx * 0.5, ty = t.y + t.vy * 0.5, dx = tx - S.ch.x, dy = ty - S.ch.y, d = Math.hypot(dx, dy);
      v.ax = d > 8 ? dx / d : 0; v.ay = d > 8 ? dy / d : 0; v.left = v.right = v.up = v.down = false;
      if (d < 34 && S.cd <= 0 && Math.random() < 0.5) v.a = true;
      return;
    }
    const b = S.b[i]; if (!b) return;
    if (b.flag) { MGH.aim(m, i, b.x * 0.7 + 640 * 0.3, 700, b); return; }
    const open = S.flags.filter(f => !f.got && !f.by); if (!open.length) { MGH.aim(m, i, b.x, 600, b); return; }
    const f = open.reduce((best, f) => (!best || dist(b.x, b.y, f.x, f.y) < dist(b.x, b.y, best.x, best.y) ? f : best), null);
    let tx = f.x, ty = f.y; const near = S.balls.find(bl => !bl.hit && dist(bl.x, bl.y, b.x, b.y) < 70); if (near) { tx = b.x + (b.x - near.x) * 3; ty = b.y + (b.y - near.y) * 3; }
    MGH.aim(m, i, tx, ty, b);
  },
  score(m, S) { const runnersWon = S.flags.every(f => f.got); return m.players.map((p, i) => (i === S.solo) !== runnersWon ? 1 : 0); },
  fmt(s) { return s ? 'won!' : 'lost'; },
  hud(m, S, i) { return i === S.solo ? '🏰 fort' : `⚑ ${S.flags.filter(f => f.got).length}/6` + (S.b[i] && S.b[i].flag ? ' carrying' : ''); },
  draw(m, S, g) {
    g.fillStyle = MGH.grad(g, 0, 720, ['#bcd8f0', '#e8f4ff', '#ffffff']); g.fillRect(0, 0, 1280, 720);
    for (let k = 0; k < 40; k++) { const x = (k * 71 + m.t * 25) % 1300, y = (k * 47 + m.t * 45) % 720; g.fillStyle = 'rgba(255,255,255,0.9)'; g.beginPath(); g.arc(x, y, 2 + k % 3, 0, 7); g.fill(); }
    g.fillStyle = 'rgba(180,210,240,0.35)'; for (let k = 0; k < 10; k++) { g.beginPath(); g.ellipse(MGH.hash(k) * 1280, 260 + MGH.hash(k + 4) * 440, 110, 26, 0, 0, 7); g.fill(); }
    // fort
    g.fillStyle = '#dce8f4'; MGH.rr(g, 420, 60, 440, 130, 16); g.fill(); g.strokeStyle = '#a8c0d8'; g.lineWidth = 3; for (let r = 0; r < 4; r++) for (let c = 0; c < 9; c++) { g.strokeRect(420 + c * 49 + (r % 2) * 24, 64 + r * 31, 49, 31); }
    for (let k = 0; k < 9; k++) { g.fillStyle = '#eef4fa'; g.fillRect(424 + k * 49, 40, 30, 26); }
    const solo = m.players[S.solo];
    Char.draw(g, 640, 120, 34, solo.el.id, solo.color, { mood: 'evil', seed: 3, look: { x: (S.ch.x - 640) / 400, y: 1 } });
    g.fillStyle = '#5a6a7a'; MGH.rr(g, 600, 150, 80, 30, 10); g.fill();
    // trees
    S.trees.forEach(t => { MGH.shadow(g, t.x, t.y + 6, 30, 0.2); g.fillStyle = '#6a4a2a'; g.fillRect(t.x - 5, t.y - 20, 10, 26); for (let k = 0; k < 3; k++) { g.fillStyle = '#3a7a5a'; g.beginPath(); g.moveTo(t.x - 34 + k * 6, t.y - 18 - k * 22); g.lineTo(t.x, t.y - 64 - k * 22); g.lineTo(t.x + 34 - k * 6, t.y - 18 - k * 22); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(t.x - 16 + k * 3, t.y - 46 - k * 22); g.lineTo(t.x, t.y - 64 - k * 22); g.lineTo(t.x + 16 - k * 3, t.y - 46 - k * 22); g.fill(); } });
    // flags
    g.fillStyle = 'rgba(80,140,255,0.18)'; g.fillRect(0, 640, 1280, 80); MGH.text(g, '⛺ CAMP — bring flags here', 640, 700, 18, '#2a4a8a', 'center', 'bold');
    S.flags.forEach(f => { if (f.got) return; g.strokeStyle = '#555'; g.lineWidth = 3; g.beginPath(); g.moveTo(f.x, f.y + 10); g.lineTo(f.x, f.y - 40); g.stroke(); g.fillStyle = MG.TEAMC[1]; g.beginPath(); g.moveTo(f.x, f.y - 40); g.lineTo(f.x + 28 + Math.sin(m.t * 6 + f.x) * 3, f.y - 32); g.lineTo(f.x, f.y - 22); g.fill(); });
    // runners
    S.b.forEach((b, i) => {
      if (!b) return; const p = m.players[i];
      if (b.frozen > 0) { MGH.shadow(g, b.x, b.y + 26, 26, 0.25); g.fillStyle = '#fff'; g.beginPath(); g.arc(b.x, b.y + 10, 26, 0, 7); g.fill(); g.beginPath(); g.arc(b.x, b.y - 22, 20, 0, 7); g.fill(); g.strokeStyle = '#bcd'; g.lineWidth = 2; g.stroke(); Char.draw(g, b.x, b.y - 22, 14, p.el.id, p.color, { headOnly: true, mood: 'dizzy', seed: i, noShadow: true }); g.fillStyle = '#ff8a2a'; g.beginPath(); g.moveTo(b.x - 4, b.y - 20); g.lineTo(b.x - 20, b.y - 18); g.lineTo(b.x - 4, b.y - 14); g.fill(); }
      else MGH.drawBody(g, b, p);
    });
    // snowballs in flight
    S.balls.forEach(bl => { if (bl.hit) return; const q = Math.min(1, bl.t / 0.5), x = bl.sx + (bl.x - bl.sx) * q, y = bl.sy + (bl.y - bl.sy) * q - Math.sin(q * Math.PI) * 160; g.strokeStyle = 'rgba(255,80,80,0.6)'; g.lineWidth = 2; g.beginPath(); g.arc(bl.x, bl.y, 40 * (1 - q) + 14, 0, 7); g.stroke(); MGH.shadow(g, bl.sx + (bl.x - bl.sx) * q, bl.sy + (bl.y - bl.sy) * q, 10, 0.2); g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, 11, 0, 7); g.fill(); g.strokeStyle = '#9ab'; g.lineWidth = 1.5; g.stroke(); });
    // crosshair
    g.strokeStyle = S.cd > 0 ? 'rgba(200,60,60,0.5)' : '#e8323e'; g.lineWidth = 3; g.beginPath(); g.arc(S.ch.x, S.ch.y, 28, 0, 7); g.stroke(); g.beginPath(); g.moveTo(S.ch.x - 38, S.ch.y); g.lineTo(S.ch.x - 16, S.ch.y); g.moveTo(S.ch.x + 16, S.ch.y); g.lineTo(S.ch.x + 38, S.ch.y); g.moveTo(S.ch.x, S.ch.y - 38); g.lineTo(S.ch.x, S.ch.y - 16); g.moveTo(S.ch.x, S.ch.y + 16); g.lineTo(S.ch.x, S.ch.y + 38); g.stroke();
    MGH.label(g, `Flags home ${S.flags.filter(f => f.got).length} / 9`, 1140, 70, 22, '#fff', 'rgba(40,60,120,0.75)');
  },
});
