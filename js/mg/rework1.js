'use strict';
// Reworked games (same ids, they replace the earlier versions): Lily Hop, Tumble Tower, Snowball Fight, Space Lander, Jump Rope

// ======================================================================== LILY HOP — spinning lily pads
MG.def({
  id: 'lilyhop', name: 'Lily Hop', type: 'Race', controls: '1 button', dur: 0,
  rows: [['a', 'Hop the way your lily pad points'], ['lr', 'On the bank: step left / right']],
  how: 'Race your frog across the pond! On the bank you can step LEFT and RIGHT, and the first row of the pond is all lily pads. Every lily pad has an arrow that keeps turning round: UP, RIGHT, DOWN, LEFT… Press A to hop the way YOUR pad is pointing right now — so wait for the arrow to face the way you want to go. Hop into open water and you splash back to the bank! Land on a pad where another frog sits and you BUMP them one pad further along (maybe into the water…). First frog to the far bank wins!',
  wins: 'First across the pond.',
  COLS: 9, ROWS: 6, CW: 120, RH: 82, OX: 100, OY: 590,
  init(m, S) {
    // carve the pond: water holes, but always a way through
    let ok = false; while (!ok) { S.pad = []; for (let r = 0; r < this.ROWS; r++) { const row = []; for (let c = 0; c < this.COLS; c++) row.push(Math.random() < 0.72 ? { per: R.range(0.55, 0.95), off: R.int(0, 3), ph: R.range(0, 1) } : null); S.pad.push(row); } for (let c = 0; c < this.COLS; c++) if (!S.pad[0][c]) S.pad[0][c] = { per: R.range(0.55, 0.95), off: R.int(0, 3), ph: R.range(0, 1) }; ok = this.reach(S); }
    S.p = [0, 1, 2, 3].map(i => ({ r: -1, c: 1 + i * 2, hop: 0, from: null, splash: 0, fin: 0, bump: 0, react: R.range(0.1, 0.35), w: 0 })); S.order = [];
  },
  reach(S) { const seen = new Set(), q = []; for (let c = 0; c < this.COLS; c++) if (S.pad[0][c]) { q.push([0, c]); seen.add('0,' + c); } while (q.length) { const [r, c] = q.shift(); if (r === this.ROWS - 1) return true; for (const [dr, dc] of [[1, 0], [0, 1], [0, -1], [-1, 0]]) { const a = r + dr, b = c + dc; if (a >= 0 && a < this.ROWS && b >= 0 && b < this.COLS && S.pad[a][b] && !seen.has(a + ',' + b)) { seen.add(a + ',' + b); q.push([a, b]); } } } return false; },
  // a pad's arrow: 0 up, 1 right, 2 down, 3 left (it pauses at each direction, then turns)
  dirOf(P, t) { const k = (t / P.per + P.ph); return (Math.floor(k) + P.off) % 4; },
  turnOf(P, t) { const k = (t / P.per + P.ph) % 1; return k > 0.75 ? (k - 0.75) / 0.25 : 0; },
  xy(r, c) { return [this.OX + c * this.CW + this.CW / 2, r < 0 ? this.OY + 70 : r >= this.ROWS ? this.OY - this.ROWS * this.RH - 40 : this.OY - r * this.RH]; },
  update(m, S, dt) {
    const t = m.t;
    S.p.forEach((P, i) => {
      if (P.fin) return; P.bump -= dt;
      if (P.splash > 0) { P.splash -= dt; if (P.splash <= 0) { P.r = -1; } return; }
      if (P.hop > 0) { P.hop -= dt; if (P.hop <= 0) this.land(m, S, P, i); return; }
      if (P.r < 0) { // on the bank: step sideways freely to line up with a pad
        const ax = m.axis(i).x, now = ax < -0.6 ? -1 : ax > 0.6 ? 1 : 0, side = (m.bot(i) ? 0 : m.pressed(i, 'left') ? -1 : m.pressed(i, 'right') ? 1 : 0) || (now && now !== P.bx ? now : 0); P.bx = now;
        if (side) { const nc = clamp(P.c + side, 0, this.COLS - 1); if (nc !== P.c && !S.p.some((q, j) => j !== i && q.r < 0 && q.c === nc && !q.fin)) { P.c = nc; Sfx.tone(600, 0.03, 'triangle', 0.02); } }
      }
      if (!m.pressed(i, 'a')) return;
      let dr = 1, dc = 0;
      if (P.r >= 0) { const pd = S.pad[P.r][P.c], d = this.dirOf(pd, t); dr = [1, 0, -1, 0][d]; dc = [0, 1, 0, -1][d]; }
      const nr = P.r + dr, nc = P.c + dc; if (nc < 0 || nc >= this.COLS || nr < -1) { P.bump = 0.3; Sfx.tone(200, 0.05, 'triangle', 0.02); return; }
      P.from = [P.r, P.c]; P.r = nr; P.c = nc; P.hop = 0.3; Sfx.tone(700, 0.05, 'sine', 0.03, 300);
    });
    if (S.p.every(P => P.fin) || (S.order.length >= 3) || t > 80) m.finish(this.score(m, S));
  },
  land(m, S, P, i) {
    if (P.r >= this.ROWS) { P.fin = m.t; S.order.push(i); Sfx.coin(); return; }
    if (P.r < 0) return;
    if (!S.pad[P.r][P.c]) { this.splash(P); return; }
    // bump a frog already sitting here one pad further the same way
    const o = S.p.find((q, j) => j !== i && !q.fin && q.hop <= 0 && q.splash <= 0 && q.r === P.r && q.c === P.c);
    if (o) { const dr = P.r - P.from[0], dc = P.c - P.from[1]; o.from = [o.r, o.c]; o.r += dr; o.c = clamp(o.c + dc, 0, this.COLS - 1); o.hop = 0.35; o.bump = 0.6; P.bump = 0.3; Sfx.thud(); MGH.burst(...this.xy(P.r, P.c), ['#fff', '#7cf06a'], 10, { speed: 180 }); }
  },
  splash(P) { P.splash = 1.1; Sfx.noise(0.3, 900, 0.08, 'lowpass'); MGH.burst(...this.xy(P.r, P.c), ['#9fe0ff', '#fff'], 18, { speed: 200 }); },
  bot(m, S, i, dt) {
    const P = S.p[i], v = m.vin[i]; v.a = false; if (P.fin || P.hop > 0 || P.splash > 0) return;
    if (P.r < 0) { if (S.pad[0][P.c]) { P.w += dt; if (P.w > P.react) { v.a = true; P.w = 0; } } else if (Math.random() < 0.02) v.a = true; return; }
    const d = this.dirOf(S.pad[P.r][P.c], m.t + 0.05), dr = [1, 0, -1, 0][d], dc = [0, 1, 0, -1][d], nr = P.r + dr, nc = P.c + dc;
    const above = P.r + 1 >= this.ROWS || S.pad[P.r + 1][P.c]; P.stuck = (P.stuck || 0) + dt;
    const good = nr >= this.ROWS || (nr >= 0 && nc >= 0 && nc < this.COLS && S.pad[nr][nc] && (dr === 1 || (dr === 0 && (!above || P.stuck > 4) && (nr + 1 >= this.ROWS || S.pad[nr + 1][nc] || P.stuck > 6)) || (dr === -1 && P.stuck > 8)));
    if (good && this.turnOf(S.pad[P.r][P.c], m.t) === 0) { P.w += dt; if (P.w > P.react) { v.a = Math.random() < 0.92; P.w = 0; P.react = R.range(0.08, 0.3); if (dr === 1) P.stuck = 0; } } else P.w = 0;
  },
  score(m, S) { return S.p.map((P, i) => P.fin ? 100 - S.order.indexOf(i) : P.r + 1); },
  fmt(s) { return s > 50 ? ['1st!', '2nd', '3rd', '4th'][100 - s] : `row ${s}`; },
  hud(m, S, i) { const P = S.p[i]; return P.fin ? '🏁' : `row ${Math.max(0, P.r + 1)}/${this.ROWS}`; },
  draw(m, S, g) {
    const t = m.t, top = this.OY - this.ROWS * this.RH - 10;
    g.fillStyle = '#5aa83a'; g.fillRect(0, 0, 1280, 720);
    g.fillStyle = MGH.grad(g, top, this.OY + 40, ['#2a7ab8', '#3a9ad8', '#2a7ab8']); g.fillRect(0, top + 20, 1280, this.OY + 40 - top - 20);
    for (let k = 0; k < 40; k++) { const x = (k * 97 + t * 14) % 1300, y = top + 30 + (k * 53) % (this.OY - top); g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 2; g.beginPath(); g.ellipse(x, y, 12 + (k % 3) * 6, 4, 0, 0, Math.PI); g.stroke(); }
    // banks with reeds and flowers
    g.fillStyle = MGH.grad(g, this.OY + 30, 720, ['#7ac85a', '#5aa83a']); g.fillRect(0, this.OY + 38, 1280, 200); g.fillStyle = MGH.grad(g, 0, top + 24, ['#5aa83a', '#7ac85a']); g.fillRect(0, 40, 1280, top - 16);
    for (let k = 0; k < 26; k++) { const x = k * 51 + 8; g.strokeStyle = '#3a7a2a'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, top + 26); g.quadraticCurveTo(x + Math.sin(t + k) * 4, top + 6, x + 4, top - 14); g.stroke(); g.beginPath(); g.moveTo(x + 20, this.OY + 40); g.quadraticCurveTo(x + 22 + Math.sin(t * 1.2 + k) * 4, this.OY + 20, x + 26, this.OY + 6); g.stroke(); }
    MGH.text(g, '🏁 FAR BANK', 640, top - 6, 18, '#2a5a1a', 'center', 'bold');
    for (let r = 0; r < this.ROWS; r++) for (let c = 0; c < this.COLS; c++) {
      const P = S.pad[r][c]; if (!P) continue; const [x, y] = this.xy(r, c), d = this.dirOf(P, t), tr = this.turnOf(P, t), ang = (d + tr) * Math.PI / 2 - Math.PI / 2;
      g.fillStyle = 'rgba(0,40,60,0.25)'; g.beginPath(); g.ellipse(x + 4, y + 6, 50, 30, 0, 0, 7); g.fill();
      g.fillStyle = MGH.grad(g, y - 30, y + 30, ['#6ad84a', '#3a9a2a']); g.beginPath(); g.ellipse(x, y, 50, 30, 0, 0.25, Math.PI * 2 - 0.25); g.lineTo(x, y); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(30,90,20,0.4)'; g.lineWidth = 2; for (let k = 0; k < 5; k++) { const a = k * 1.2 + 0.6; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 44, y + Math.sin(a) * 26); g.stroke(); }
      g.save(); g.translate(x, y); g.scale(1, 0.62); g.rotate(ang); g.fillStyle = tr > 0 ? 'rgba(255,255,255,0.6)' : '#fff'; g.beginPath(); g.moveTo(30, 0); g.lineTo(6, -16); g.lineTo(6, -7); g.lineTo(-22, -7); g.lineTo(-22, 7); g.lineTo(6, 7); g.lineTo(6, 16); g.closePath(); g.fill(); g.strokeStyle = 'rgba(30,90,20,0.6)'; g.lineWidth = 2; g.stroke(); g.restore();
      if ((r * 3 + c) % 4 === 0) { g.fillStyle = '#ff9ac8'; g.beginPath(); g.arc(x + 32, y - 14, 7, 0, 7); g.fill(); g.fillStyle = '#ffe680'; g.beginPath(); g.arc(x + 32, y - 14, 3, 0, 7); g.fill(); }
    }
    // frogs with riders
    S.p.forEach((P, i) => {
      const p = m.players[i]; let [x, y] = this.xy(P.fin ? this.ROWS : P.r, P.c), h = 0;
      if (P.hop > 0 && P.from) { const k = 1 - P.hop / 0.3, [x0, y0] = this.xy(P.from[0], P.from[1]); x = x0 + (x - x0) * k; y = y0 + (y - y0) * k; h = Math.sin(k * Math.PI) * 40; }
      if (P.splash > 0) { g.globalAlpha = Math.min(1, P.splash); y += (1.1 - P.splash) * 20; }
      MGH.shadow(g, x, y + 10, 24, 0.3);
      const sq = P.bump > 0 ? 1 + Math.sin(P.bump * 30) * 0.12 : 1;
      g.save(); g.translate(x, y - h); g.scale(sq, 2 - sq);
      g.fillStyle = '#4ac83a'; g.beginPath(); g.ellipse(0, 0, 26, 18, 0, 0, 7); g.fill(); g.fillStyle = '#8ae86a'; g.beginPath(); g.ellipse(0, 6, 16, 9, 0, 0, 7); g.fill();
      for (const sd of [-1, 1]) { g.fillStyle = '#4ac83a'; g.beginPath(); g.arc(sd * 12, -14, 9, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(sd * 12, -15, 6, 0, 7); g.fill(); g.fillStyle = '#222'; g.beginPath(); g.arc(sd * 12, -15, 3, 0, 7); g.fill(); g.fillStyle = '#3a9a2a'; g.beginPath(); g.ellipse(sd * 24, 12, 10, 5, sd * 0.4, 0, 7); g.fill(); }
      g.restore();
      Char.draw(g, x, y - h - 30, 17, p.el.id, p.color, { mood: MGH.persona(P.splash > 0 ? 'hurt' : P.fin ? 'cheer' : P.bump > 0 ? 'dizzy' : 'determined', p.el.id), seed: i * 1.7, look: { x: 0, y: -1 }, noFeet: true });
      g.globalAlpha = 1;
      if (P.splash > 0) MGH.text(g, 'SPLASH!', x, y - 70, 18, '#bfe6ff', 'center', 'bold');
    });
    m.players.forEach((p, i) => { MGH.text(g, p.name + (S.p[i].fin ? ` 🏁${S.order.indexOf(i) + 1}` : ''), 170 + i * 310, 700, 18, p.color, 'center', 'bold'); });
  },
});

// ======================================================================== TUMBLE TOWER — pull with the colour bar
MG.def({
  id: 'tumble', name: 'Tumble Tower', type: 'Strategy', controls: 'Move + button', dur: 0,
  rows: [['pad', 'Pick a block'], ['a', 'Pick it, then stop the slider']],
  how: 'Take turns pulling a block from the tower. Pick a block with the stick and press A — then a slider zooms back and forth along a colour bar: press A again to stop it. GREEN = a clean pull that steadies the tower (wobble goes DOWN a level). YELLOW = it comes out, but the tower wobbles a level MORE. RED = CRASH — you topple it and lose! The wobblier the tower, the faster the slider (level 5 is crazy — and has no yellow at all). Risky blocks (a lonely block, or one low down with lots on top) have a smaller green zone, so choose carefully!',
  wins: 'Don\'t topple it! Survivors rank by clean pulls (the game ends after 40 pulls).',
  BW: 70, BH: 26, BASE: 600, CX: 640,
  init(m, S) {
    S.L = []; for (let k = 0; k < 14; k++) S.L.push([1, 1, 1]); S.top = [0, 0, 0];
    S.turn = R.int(0, 3); S.pulls = [0, 0, 0, 0]; S.W = 1; S.ph = 'pick'; S.pt = 0; S.loser = -1; S.sel = { r: 4, c: 1 }; S.ax = ''; S.msg = ''; S.msgT = 0; S.fall = null; S.cur = 0; S.dir = 1; S.zone = null;
    this.botPlan(S);
  },
  canPull(S, r, c) { return r < S.L.length - 1 && S.L[r][c] === 1 && S.L[r].reduce((a, b) => a + b, 0) > 1; },
  // how risky is pulling this block: lonely layers and heavy loads above are risky (0 safe … 1 very risky)
  risk(S, r, c) { const l = S.L[r], n = l[0] + l[1] + l[2]; let k = n === 3 ? (c === 1 ? 0.05 : 0.2) : (l[1] && c !== 1 ? 0.45 : 0.75); return clamp(k + (S.L.length - r) / S.L.length * 0.25, 0, 1); },
  zones(S, rk) { const green = clamp(0.32 - rk * 0.22, 0.06, 0.32), yellow = S.W >= 5 ? 0 : clamp(0.26 + rk * 0.06, 0.2, 0.34); return { g: green, y: yellow }; },
  speed(S) { return [0, 0.7, 1.0, 1.4, 1.9, 2.6][S.W]; },
  update(m, S, dt) {
    S.pt += dt; S.msgT -= dt;
    if (S.ph === 'fall') { S.fall.forEach(b => { b.vy += 1400 * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.a += b.va * dt; if (b.y > 640) { b.y = 640; b.vy *= -0.3; b.vx *= 0.7; b.va *= 0.6; } }); if (S.pt > 3) m.finish(this.score(m, S)); return; }
    const i = S.turn;
    if (S.ph === 'pick') {
      if (!this.options(S).length) { S.msg = 'The tower stands! No more blocks to pull'; S.msgT = 3; m.finish(this.score(m, S)); return; }
      const a = m.axis(i), now = a.x < -0.6 ? 'left' : a.x > 0.6 ? 'right' : a.y < -0.6 ? 'up' : a.y > 0.6 ? 'down' : '';
      const d = (m.bot(i) ? null : ['left', 'right', 'up', 'down'].find(k => m.pressed(i, k))) || (now && now !== S.ax ? now : null); S.ax = now;
      if (d === 'up') S.sel.r = Math.min(S.L.length - 2, S.sel.r + 1); if (d === 'down') S.sel.r = Math.max(0, S.sel.r - 1);
      if (d === 'left') S.sel.c = Math.max(0, S.sel.c - 1); if (d === 'right') S.sel.c = Math.min(2, S.sel.c + 1);
      if (d) Sfx.tone(700, 0.03, 'triangle', 0.02);
      if (m.pressed(i, 'a') || S.pt > 14) {
        if (!this.canPull(S, S.sel.r, S.sel.c)) { if (S.pt > 14) { const o = this.options(S)[0]; S.sel = { r: o.r, c: o.c }; } else { S.msg = 'can\'t pull that one!'; S.msgT = 1; Sfx.bad(); return; } }
        S.zone = this.zones(S, this.risk(S, S.sel.r, S.sel.c)); S.ph = 'slide'; S.pt = 0; S.cur = R.range(-1, 1); S.dir = R.pick([-1, 1]); Sfx.tone(500, 0.06, 'triangle', 0.03);
      }
      return;
    }
    if (S.ph === 'slide') {
      S.cur += S.dir * this.speed(S) * dt * 2; if (S.cur > 1) { S.cur = 1; S.dir = -1; } if (S.cur < -1) { S.cur = -1; S.dir = 1; }
      if ((m.pressed(i, 'a') && S.pt > 0.15) || S.pt > 6) {
        const off = Math.abs(S.cur), z = S.zone; const res = off < z.g ? 'g' : off < z.g + z.y ? 'y' : 'r';
        if (res === 'r') { this.topple(m, S); return; }
        S.L[S.sel.r][S.sel.c] = 0; const k = S.top.indexOf(0); S.top[k] = 1; if (S.top.every(b => b)) { S.L.push([1, 1, 1]); S.top = [0, 0, 0]; }
        S.pulls[i]++; if (res === 'g') { S.W = Math.max(1, S.W - 1); S.msg = 'Clean pull!'; Sfx.coin(); } else { S.W = Math.min(5, S.W + 1); S.msg = `Wobble ${S.W}!`; Sfx.thud(); MGH.shake(3 + S.W); }
        S.msgT = 1.1; S.ph = 'pause'; S.pt = 0; S.last = res;
      }
      return;
    }
    if (S.ph === 'pause' && S.pt > 0.9 && S.pulls.reduce((a, b) => a + b, 0) >= 40) { S.msg = 'The tower survived 40 pulls!'; S.msgT = 3; m.finish(this.score(m, S)); return; }
    if (S.ph === 'pause' && S.pt > 0.9) { S.turn = (S.turn + 1) % 4; S.ph = 'pick'; S.pt = 0; S.sel = { r: Math.min(S.sel.r, S.L.length - 2), c: 1 }; this.botPlan(S); }
  },
  topple(m, S) {
    S.ph = 'fall'; S.pt = 0; S.loser = S.turn; Sfx.boom(); MGH.shake(16);
    S.fall = []; const lean = Math.random() < 0.5 ? -1 : 1;
    S.L.forEach((l, r) => l.forEach((b, c) => { if (b) { const p = this.bp(S, r, c); S.fall.push({ x: p.x, y: p.y, vx: lean * R.range(60, 360) * (r / S.L.length + 0.3), vy: R.range(-300, 0), a: 0, va: R.range(-6, 6), lay: r % 2 }); } }));
  },
  options(S) { const o = []; S.L.forEach((l, r) => l.forEach((b, c) => { if (this.canPull(S, r, c)) o.push({ r, c, k: this.risk(S, r, c) }); })); return o.sort((a, b) => a.k - b.k); },
  botPlan(S) { S.plan = null; },
  bot(m, S, i) {
    const v = m.vin[i]; v.a = false; v.ax = v.ay = 0; if (S.turn !== i || S.ph === 'fall') return;
    if (S.ph === 'pick') {
      if (!S.plan) { const o = this.options(S); S.plan = o[Math.min(o.length - 1, Math.floor(Math.random() * Math.min(3, o.length)))]; S.think = R.range(0.6, 1.5); }
      S.think -= 1 / 60; if (S.think > 0) return;
      if (S.sel.r !== S.plan.r) { if (!S.bStep || S.bStep-- <= 0) { v.ay = S.sel.r < S.plan.r ? -1 : 1; S.bStep = 4; } return; }
      if (S.sel.c !== S.plan.c) { if (!S.bStep || S.bStep-- <= 0) { v.ax = S.sel.c < S.plan.c ? 1 : -1; S.bStep = 4; } return; }
      v.a = !m.prev[i].a; return;
    }
    if (S.ph === 'slide' && S.pt > 0.3) { const lag = 0.05 + S.W * 0.03, pred = S.cur + S.dir * this.speed(S) * 2 * lag; if (Math.abs(pred) < S.zone.g * 0.8 && Math.random() < 0.5) v.a = !m.prev[i].a; }
  },
  score(m, S) { return [0, 1, 2, 3].map(i => i === S.loser ? -1 : S.pulls[i]); },
  fmt(s) { return s < 0 ? 'TOPPLED IT!' : `${s} clean pulls`; },
  hud(m, S, i) { return S.loser === i ? '💥 toppled' : `${S.pulls[i]} pulls` + (S.turn === i && S.ph !== 'fall' ? ' 👉' : ''); },
  bp(S, r, c) { return { x: this.CX + (c - 1) * this.BW, y: this.BASE - (r + 0.5) * this.BH }; },
  block(g, x, y, w, h, lay, hl, col) {
    g.fillStyle = 'rgba(60,30,10,0.25)'; MGH.rr(g, x - w / 2 + 3, y - h / 2 + 4, w - 2, h - 2, 4); g.fill();
    g.fillStyle = MGH.grad(g, y - h / 2, y + h / 2, lay ? ['#f8d4a0', '#e0a868', '#c8904a'] : ['#f0c48a', '#d89c5a', '#b88040']); MGH.rr(g, x - w / 2 + 1, y - h / 2 + 1, w - 2, h - 2, 4); g.fill();
    g.strokeStyle = 'rgba(140,80,30,0.3)'; g.lineWidth = 1.2; for (const dy of [-6, 0, 5]) { g.beginPath(); g.moveTo(x - w / 2 + 6, y + dy); g.bezierCurveTo(x - 10, y + dy - 2, x + 10, y + dy + 2, x + w / 2 - 6, y + dy); g.stroke(); }
    if (lay) { g.strokeStyle = 'rgba(120,70,20,0.35)'; g.beginPath(); g.ellipse(x, y, h * 0.32, h * 0.22, 0, 0, 7); g.stroke(); }
    g.fillStyle = 'rgba(255,255,255,0.28)'; MGH.rr(g, x - w / 2 + 3, y - h / 2 + 2, w - 6, 4, 2); g.fill();
    if (hl) { g.strokeStyle = col; g.lineWidth = 4; MGH.rr(g, x - w / 2 - 1, y - h / 2 - 1, w + 2, h + 2, 5); g.stroke(); }
  },
  draw(m, S, g) {
    // a cosy games room: wallpaper, window light, a round wooden table
    g.fillStyle = MGH.grad(g, 0, 720, ['#4a3a5a', '#6a4a5a', '#4a2a3a']); g.fillRect(0, 0, 1280, 720);
    for (let x = 0; x < 1280; x += 64) { g.fillStyle = 'rgba(255,220,180,0.04)'; g.fillRect(x, 0, 32, 520); }
    g.fillStyle = '#2a1a2a'; MGH.rr(g, 980, 80, 220, 260, 12); g.fill(); g.fillStyle = MGH.grad(g, 90, 330, ['#3a5a9a', '#6a8ac8']); MGH.rr(g, 992, 92, 196, 236, 8); g.fill(); MGH.stars(g, m.t, 14, 320, 0.8); g.fillStyle = '#f4f0d8'; g.beginPath(); g.arc(1140, 140, 22, 0, 7); g.fill(); g.strokeStyle = '#2a1a2a'; g.lineWidth = 8; g.beginPath(); g.moveTo(1090, 92); g.lineTo(1090, 328); g.moveTo(992, 210); g.lineTo(1188, 210); g.stroke();
    MGH.glow(g, 640, 60, 420, 'rgba(255,210,140,0.22)'); g.strokeStyle = '#2a1a10'; g.lineWidth = 3; g.beginPath(); g.moveTo(640, 0); g.lineTo(640, 30); g.stroke(); g.fillStyle = '#a8703a'; g.beginPath(); g.moveTo(600, 60); g.lineTo(680, 60); g.lineTo(660, 30); g.lineTo(620, 30); g.fill(); g.fillStyle = '#fff6d0'; g.beginPath(); g.arc(640, 62, 10, 0, 7); g.fill();
    g.fillStyle = MGH.grad(g, 600, 720, ['#9a6a3a', '#6a4220']); g.beginPath(); g.ellipse(640, 640, 560, 70, 0, 0, 7); g.fill(); g.fillStyle = '#b8804a'; g.beginPath(); g.ellipse(640, 618, 540, 52, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(80,40,10,0.25)'; g.lineWidth = 2; for (let k = 1; k < 5; k++) { g.beginPath(); g.ellipse(640, 618, 540 - k * 90, 52 - k * 9, 0, 0, 7); g.stroke(); }
    const col = m.players[S.turn].color;
    if (S.ph === 'fall') S.fall.forEach(b => { g.save(); g.translate(b.x, b.y); g.rotate(b.a); this.block(g, 0, 0, this.BW, this.BH, b.lay, false); g.restore(); });
    else {
      const sway = Math.sin(m.t * (1.5 + S.W)) * (S.W - 1) * 0.006;
      g.save(); g.translate(this.CX, this.BASE); g.rotate(sway); g.translate(-this.CX, -this.BASE);
      MGH.shadow(g, this.CX, this.BASE + 6, this.BW * 1.8, 0.35);
      S.L.forEach((l, r) => l.forEach((b, c) => {
        const p = this.bp(S, r, c), sel = (S.ph === 'pick' || S.ph === 'slide') && S.sel.r === r && S.sel.c === c;
        if (!b) { g.fillStyle = 'rgba(30,15,5,0.6)'; g.fillRect(p.x - this.BW / 2 + 4, p.y - this.BH / 2 + 4, this.BW - 8, this.BH - 8); if (sel) { g.strokeStyle = col; g.lineWidth = 3; g.setLineDash([4, 4]); g.strokeRect(p.x - this.BW / 2, p.y - this.BH / 2, this.BW, this.BH); g.setLineDash([]); } return; }
        const off = sel && S.ph === 'slide' ? 10 : 0;
        this.block(g, p.x, p.y + off, this.BW, this.BH, r % 2, sel, sel && !this.canPull(S, r, c) ? '#ff4a4a' : col);
      }));
      S.top.forEach((b, c) => { if (b) { const p = this.bp(S, S.L.length, c); this.block(g, p.x, p.y, this.BW, this.BH, S.L.length % 2, false); } });
      g.restore();
    }
    // the wobble level
    g.fillStyle = 'rgba(0,0,0,0.45)'; MGH.rr(g, 40, 90, 220, 70, 14); g.fill(); MGH.text(g, 'WOBBLE', 150, 116, 16, '#ffe8c8', 'center', 'bold');
    for (let k = 1; k <= 5; k++) { g.fillStyle = k <= S.W ? ['#7cf06a', '#c8f06a', '#ffd34d', '#ff9a3d', '#ff4a3a'][k - 1] : 'rgba(255,255,255,0.15)'; MGH.rr(g, 54 + (k - 1) * 40, 128, 32, 20, 6); g.fill(); }
    // the slider bar
    if (S.ph === 'slide' || S.ph === 'pause') {
      const z = S.zone, x0 = 340, w = 600, y0 = 640, X = v => x0 + w / 2 + v * w / 2;
      g.fillStyle = 'rgba(0,0,0,0.6)'; MGH.rr(g, x0 - 10, y0 - 14, w + 20, 46, 14); g.fill();
      g.fillStyle = '#ff4a3a'; g.fillRect(x0, y0, w, 18); g.fillStyle = '#ffd34d'; g.fillRect(X(-(z.g + z.y)), y0, (z.g + z.y) * w, 18); g.fillStyle = '#5ad84a'; g.fillRect(X(-z.g), y0, z.g * w, 18);
      g.fillStyle = '#fff'; g.fillRect(X(S.cur) - 4, y0 - 8, 8, 34); g.strokeStyle = '#222'; g.lineWidth = 2; g.strokeRect(X(S.cur) - 4, y0 - 8, 8, 34);
    }
    // players round the table
    const seats = [[180, 560], [360, 610], [920, 610], [1100, 560]];
    m.players.forEach((p, i) => {
      const [x, y] = seats[i], my = S.turn === i && S.ph !== 'fall';
      if (my) MGH.glow(g, x, y - 20, 70, p.color + '66');
      const mood = S.ph === 'fall' ? (i === S.loser ? 'cry' : 'laugh') : my ? (S.ph === 'slide' ? 'effort' : 'nervous') : (S.W >= 4 ? 'scared' : 'happy');
      Char.draw(g, x, y, 40, p.el.id, p.color, { mood: MGH.persona(mood, p.el.id), seed: i * 1.7, look: { x: x < 640 ? 1 : -1, y: -0.3 }, hands: my && S.ph === 'slide' ? { n: { x: x < 640 ? 1.2 : -1.2, y: -0.6, d: x < 640 ? 0 : 180, o: true, m: true }, f: { x: 0.6, y: 0.3, d: 90, o: true, m: false } } : undefined });
      MGH.text(g, `${p.name}  ${S.pulls[i]}`, x, y + 76, 18, p.color, 'center', 'bold');
      if (my) MGH.text(g, '▼ your turn', x, y - 76, 16, '#ffe680', 'center', 'bold');
    });
    if (S.ph === 'pick') MGH.label(g, `${m.players[S.turn].name}: pick a block, then press A   ${Math.max(0, 14 - S.pt).toFixed(0)}s`, 640, 690, 18, col);
    if (S.msgT > 0) MGH.label(g, S.msg, 640, 200, 30, S.msg.startsWith('Clean') ? '#7cf06a' : '#ffb13d');
    if (S.ph === 'fall') MGH.label(g, `CRASH! ${m.players[S.loser].name} toppled the tower!`, 640, 200, 36, '#ff8a3d');
  },
});

// ======================================================================== SNOWBALL FIGHT — forts that crumble and can be rebuilt
MG.def({
  id: 'snowfight', name: 'Snowball Fight', type: 'Arena', mode: '2v2', sport: true, controls: 'Move + A & B', dur: 60,
  rows: [['lr', 'Move'], ['a', 'Hold for power, let go to throw (at the back: rebuild)'], ['b', 'Hold to duck behind the wall']],
  how: 'Two snow forts face each other. HOLD A to pack a snowball — the power bar swings — and let go to lob it over the walls. Hold B to crouch behind your wall. But every snowball that hits a wall knocks a chunk off it, and a low wall can\'t hide you! To REBUILD, run right to the back of your side and HOLD A to pack more snow onto the wall — while you\'re back there, you\'re out in the open. Every hit on a rival scores!',
  wins: 'Team with the most hits.',
  WALL: [430, 850], GY: 620, HP: 8,
  init(m, S) { S.hits = [0, 0]; S.wall = [this.HP, this.HP]; const k = [0, 0]; S.p = m.players.map((p, i) => { const tm = m.teamOf(i), j = k[tm]++; return { tm, x: tm ? 960 + j * 170 : 150 + j * 170, hold: 0, cd: 0, stun: 0, duck: false, build: 0, tgt: 0.5 }; }); S.balls = []; S.flakes = []; },
  zone(tm) { return tm ? [900, 1240] : [40, 380]; },
  atBack(P) { return P.tm ? P.x > 1200 : P.x < 80; },
  update(m, S, dt) {
    S.p.forEach((P, i) => {
      P.cd -= dt; P.stun -= dt; if (P.stun > 0) { P.hold = 0; P.duck = false; P.build = 0; return; }
      P.duck = m.held(i, 'b') && S.wall[P.tm] > 2; const z = this.zone(P.tm); if (!P.duck) P.x = clamp(P.x + m.axis(i).x * 260 * dt, z[0], z[1]);
      if (this.atBack(P) && S.wall[P.tm] < this.HP && m.held(i, 'a') && !P.duck) { P.build += dt; P.hold = 0; if (P.build > 0.7) { P.build = 0; S.wall[P.tm]++; Sfx.tone(400, 0.06, 'triangle', 0.03); } return; } else P.build = 0;
      if (!P.duck && P.cd <= 0 && m.held(i, 'a')) P.hold += dt;
      else if (P.hold > 0.08 && !P.duck) { const pw = swingP(P.hold), d = P.tm ? -1 : 1; S.balls.push({ x: P.x + d * 20, y: this.GY - 70, vx: d * (360 + pw * 720), vy: -520, tm: P.tm }); P.hold = 0; P.cd = 0.7; Sfx.whoosh(false); }
      else P.hold = 0;
    });
    S.balls.forEach(b => {
      b.vy += 1100 * dt; b.x += b.vx * dt; b.y += b.vy * dt;
      this.WALL.forEach((wx, wt) => { const h = 30 + S.wall[wt] * 11; if (!b.dead && Math.abs(b.x - wx) < 34 && b.y > this.GY - h) { b.dead = true; if (S.wall[wt] > 0 && wt !== b.tm) S.wall[wt]--; MGH.burst(b.x, b.y, ['#fff', '#dff4ff'], 12, { speed: 160 }); Sfx.thud(); } });
      S.p.forEach(P => { if (b.dead || P.tm === b.tm || P.stun > 0) return; const top = this.GY - (P.duck ? 56 : 104); if (Math.abs(b.x - P.x) < 28 && b.y > top && b.y < this.GY) { b.dead = true; P.stun = 1.2; S.hits[b.tm]++; Sfx.punch(); MGH.burst(b.x, b.y, ['#fff', '#bfe6ff'], 18, { speed: 220 }); } });
      if (b.y > this.GY) { b.dead = true; MGH.burst(b.x, this.GY, ['#fff'], 6, { speed: 100 }); }
    });
    S.balls = S.balls.filter(b => !b.dead && b.x > -50 && b.x < 1330);
    if (Math.random() < dt * 20) S.flakes.push({ x: R.range(0, 1280), y: 40, v: R.range(30, 70), s: R.range(1.5, 3.5) }); S.flakes.forEach(f => { f.y += f.v * dt; f.x += Math.sin(f.y * 0.03) * 0.3; }); S.flakes = S.flakes.filter(f => f.y < 720);
  },
  bot(m, S, i, dt) {
    const P = S.p[i], v = m.vin[i]; v.a = v.b = false; v.ax = 0; if (P.stun > 0) return;
    const inc = S.balls.find(b => b.tm !== P.tm && Math.abs(b.x - P.x) < 220 && b.vy > -200);
    if (inc && S.wall[P.tm] > 2 && Math.random() < 0.6) { v.b = true; return; }
    const mate = S.p.find((q, j) => j !== i && q.tm === P.tm), builder = S.wall[P.tm] <= 4 && (!mate || !this.atBack(mate));
    if (builder) { const bx = P.tm ? 1230 : 50; v.ax = Math.abs(bx - P.x) > 10 ? Math.sign(bx - P.x) : 0; if (this.atBack(P)) v.a = true; return; }
    if (!P.wander || Math.random() < 0.01) P.wander = R.range(...this.zone(P.tm)); v.ax = Math.abs(P.wander - P.x) > 20 ? Math.sign(P.wander - P.x) : 0;
    if (P.cd > 0) return;
    const foe = S.p.filter(o => o.tm !== P.tm && o.stun <= 0).sort((a, b) => Math.abs(a.x - P.x) - Math.abs(b.x - P.x))[0]; if (!foe) return;
    if (!P.hold) P.tgt = clamp((Math.abs(foe.x - P.x) / (2 * 520 / 1100) - 360) / 720 + R.range(-0.07, 0.07), 0.02, 0.98);
    const now = swingP(P.hold), nx = swingP(P.hold + 2 * dt); v.a = !(P.hold > 0.1 && now <= P.tgt && nx >= P.tgt);
  },
  score(m, S) { return m.players.map((p, i) => S.hits[m.teamOf(i)]); },
  fmt(s) { return `${s} hits`; },
  hud(m, S, i) { return MG.TEAMN[m.teamOf(i)]; },
  wallDraw(g, wx, hp, tm, t) {
    const n = hp; // rows of snow bricks
    for (let r = 0; r < n; r++) { const y = this.GY - 12 - r * 11, w = 74 - r * 1.5; for (let c = 0; c < 2; c++) { const x = wx - w / 2 + c * w / 2 + (r % 2) * 6; g.fillStyle = MGH.grad(g, y - 7, y + 6, ['#ffffff', '#dceefa']); MGH.rr(g, x, y - 6, w / 2 - 2, 12, 5); g.fill(); g.strokeStyle = 'rgba(140,180,210,0.6)'; g.lineWidth = 1.2; g.stroke(); } }
    g.fillStyle = 'rgba(255,255,255,0.8)'; for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(wx - 24 + k * 24, this.GY - 12 - (n - 1) * 11 - 6, 7, Math.PI, 0); g.fill(); }
    g.fillStyle = MG.TEAMC[tm]; g.fillRect(wx - 2, this.GY - 40 - n * 11, 4, 34); g.beginPath(); g.moveTo(wx + 2, this.GY - 40 - n * 11); g.lineTo(wx + 22 * (tm ? -1 : 1), this.GY - 34 - n * 11 + Math.sin(t * 5) * 2); g.lineTo(wx + 2, this.GY - 28 - n * 11); g.fill();
  },
  draw(m, S, g) {
    g.fillStyle = MGH.grad(g, 0, 720, ['#a8d0f0', '#d8ecfa', '#f4faff']); g.fillRect(0, 0, 1280, 720);
    MGH.ridge(g, 380, 90, '#c8dcf0', 3); MGH.ridge(g, 440, 60, '#b0c8e0', 7);
    for (let k = 0; k < 9; k++) { const x = 60 + k * 150; g.fillStyle = '#4a7a5a'; g.beginPath(); g.moveTo(x, 470); g.lineTo(x - 30, 540); g.lineTo(x + 30, 540); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(x, 470); g.lineTo(x - 12, 496); g.lineTo(x + 12, 496); g.fill(); }
    g.fillStyle = MGH.grad(g, this.GY - 40, 720, ['#ffffff', '#e4f0fa']); g.beginPath(); g.moveTo(0, 720); g.lineTo(0, this.GY - 20); for (let x = 0; x <= 1280; x += 40) g.lineTo(x, this.GY - 10 + Math.sin(x * 0.02) * 6); g.lineTo(1280, 720); g.fill();
    g.fillStyle = 'rgba(120,170,220,0.2)'; g.fillRect(0, this.GY + 4, 90, 110); g.fillRect(1190, this.GY + 4, 90, 110); MGH.text(g, 'rebuild', 45, this.GY + 40, 14, '#4a7aaa', 'center', 'bold'); MGH.text(g, 'rebuild', 1235, this.GY + 40, 14, '#4a7aaa', 'center', 'bold');
    MGH.text(g, `${S.hits[0]}`, 560, 80, 44, MG.TEAMC[0], 'center', 'bold'); MGH.text(g, `${S.hits[1]}`, 720, 80, 44, MG.TEAMC[1], 'center', 'bold');
    this.WALL.forEach((wx, tm) => this.wallDraw(g, wx, S.wall[tm], tm, m.t));
    S.p.forEach((P, i) => {
      const p = m.players[i], d = P.tm ? -1 : 1, crouch = P.duck ? 1 : 0;
      MGH.shadow(g, P.x, this.GY + 4, 26, 0.25);
      // crouching: the hero kneels low with arms over the head (no squashing)
      const hands = P.duck ? { n: { x: -0.3, y: -1.7, d: -60, o: true, m: true }, f: { x: 0.4, y: -1.7, d: -120, o: true, m: false } } : P.build > 0 ? { n: { x: 1.2 * d, y: 0.6, d: 90, o: true, m: true }, f: { x: 0.9 * d, y: 0.4, d: 90, o: true, m: false } } : P.hold > 0 ? { n: { x: -0.6 * d, y: -1.6, d: d > 0 ? -150 : -30, o: true, m: true }, f: { x: 0.8 * d, y: 0.2, d: 90, o: true, m: false } } : undefined;
      const feet = P.duck ? [{ x: -0.5, lift: 0.1, tip: -0.2 }, { x: 0.5, lift: 0.1, tip: -0.2 }] : undefined;
      Char.draw(g, P.x, this.GY - 44 + crouch * 26, 30, p.el.id, p.color, { mood: MGH.persona(P.stun > 0 ? 'dizzy' : P.hold > 0 ? 'determined' : P.duck ? 'scared' : P.build > 0 ? 'effort' : 'happy', p.el.id), seed: i * 1.7, look: { x: P.duck ? 0 : d, y: P.duck ? 0.6 : 0 }, hands, feet, noIdle: P.duck });
      if (P.hold > 0) { g.fillStyle = '#fff'; g.beginPath(); g.arc(P.x - d * 12, this.GY - 112, 9, 0, 7); g.fill(); g.fillStyle = 'rgba(0,0,0,0.5)'; MGH.rr(g, P.x - 30, this.GY - 150, 60, 10, 5); g.fill(); g.fillStyle = '#5ab8ff'; MGH.rr(g, P.x - 30, this.GY - 150, 60 * swingP(P.hold), 10, 5); g.fill(); }
      if (P.build > 0) { g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(P.x - 24, this.GY - 130, 48, 6); g.fillStyle = '#fff'; g.fillRect(P.x - 24, this.GY - 130, 48 * P.build / 0.7, 6); }
      g.fillStyle = MG.TEAMC[P.tm]; g.fillRect(P.x - 14, this.GY + 14, 28, 5);
    });
    S.balls.forEach(b => { MGH.shadow(g, b.x, this.GY + 2, 8, 0.15); g.fillStyle = '#fff'; g.beginPath(); g.arc(b.x, b.y, 9, 0, 7); g.fill(); g.strokeStyle = '#bfd8e8'; g.lineWidth = 1.5; g.stroke(); });
    S.flakes.forEach(f => { g.fillStyle = 'rgba(255,255,255,0.85)'; g.beginPath(); g.arc(f.x, f.y, f.s, 0, 7); g.fill(); });
  },
});

// ======================================================================== SPACE LANDER — gentler, prettier
MG.def({
  id: 'lander', name: 'Space Lander', type: 'Skill', controls: 'Move + button', dur: 0,
  rows: [['a', 'Hold to fire the thruster'], ['lr', 'Tilt']],
  how: 'Bring your little lander down onto the glowing pad! HOLD A to fire the thruster (it pushes the way your ship points) and tilt with LEFT/RIGHT — let go of the stick and the ship levels itself out. Watch the speed light: GREEN means slow enough to land. Touch down on the pad while it\'s green! First to land each round scores 3, then 2, then 1. Three rounds.',
  wins: 'Most points after three rounds.',
  init(m, S) { S.pts = [0, 0, 0, 0]; S.round = 0; this.next(S); },
  next(S) { S.round++; S.pad = R.range(90, 230); S.ph = 'fly'; S.pt = 0; S.order = []; S.p = [0, 1, 2, 3].map(() => ({ x: R.range(60, 260), y: 140, vx: R.range(-25, 25), vy: 0, a: 0, fuel: 1, st: 'fly', sc: 0, k: R.range(0.85, 1.2), dust: 0 })); },
  update(m, S, dt) {
    S.pt += dt;
    if (S.ph === 'fly') {
      S.p.forEach((P, i) => {
        if (P.st !== 'fly') { P.dust -= dt; return; }
        const ax = m.axis(i).x; if (Math.abs(ax) > 0.2) P.a = clamp(P.a + ax * 2 * dt, -0.9, 0.9); else P.a *= Math.exp(-3 * dt);
        const th = m.held(i, 'a') && P.fuel > 0; if (th) { P.vx += Math.sin(P.a) * 190 * dt; P.vy -= Math.cos(P.a) * 190 * dt; P.fuel = Math.max(0, P.fuel - dt * 0.06); }
        P.vy += 70 * dt; P.vx *= Math.exp(-0.25 * dt); P.x += P.vx * dt; P.y += P.vy * dt; P.x = clamp(P.x, 18, 302); if (P.y < 80) { P.y = 80; P.vy = Math.max(0, P.vy); }
        P.th = th;
        if (P.y >= 636) {
          P.y = 636; const onPad = Math.abs(P.x - S.pad) < 60, soft = P.vy < 105 && Math.abs(P.vx) < 70 && Math.abs(P.a) < 0.45;
          if (onPad && soft) { P.st = 'land'; P.dust = 1; S.order.push(i); P.sc = [3, 2, 1, 0][S.order.length - 1]; S.pts[i] += P.sc; Sfx.coin(); MGH.burst(i * 320 + P.x, 640, ['#c8c0b0', '#fff'], 14, { speed: 120 }); }
          else { P.st = 'crash'; Sfx.boom(); MGH.burst(i * 320 + P.x, 640, ['#ffb13d', '#ff5a3a', '#888'], 24, { speed: 260 }); }
        }
      });
      if (S.p.every(P => P.st !== 'fly') || S.pt > 35) { S.ph = 'show'; S.pt = 0; }
      return;
    }
    if (S.pt > 2.5) { if (S.round >= 3) m.finish(S.pts.slice()); else this.next(S); }
  },
  bot(m, S, i) {
    const P = S.p[i], v = m.vin[i]; v.a = false; v.ax = 0; if (P.st !== 'fly') return;
    const dx = S.pad - P.x, h = 636 - P.y;
    const wantVx = clamp(dx * 0.7, -60, 60) * (h > 50 ? 1 : 0.3), wantA = clamp((wantVx - P.vx) * 0.015 * P.k, -0.45, 0.45) * (h < 40 ? 0 : 1);
    v.ax = clamp((wantA - P.a) * 5, -1, 1);
    const wantVy = h > 220 ? 120 : h > 70 ? 70 : 40; v.a = P.vy > wantVy * P.k || (Math.abs(wantVx - P.vx) > 25 && h > 120 && Math.abs(P.a) > 0.12);
  },
  score(m, S) { return S.pts.slice(); },
  fmt(s) { return `${s} pts`; },
  hud(m, S, i) { const P = S.p[i]; return `${S.pts[i]} pts` + (P.st === 'land' ? ' ✔' : P.st === 'crash' ? ' 💥' : ''); },
  draw(m, S, g) {
    g.fillStyle = MGH.grad(g, 0, 720, ['#040414', '#0e0e30', '#1a1440']); g.fillRect(0, 0, 1280, 720); MGH.stars(g, m.t, 160, 640);
    // a blue planet and a ringed one hanging in the sky
    MGH.glow(g, 1080, 150, 120, 'rgba(90,160,255,0.35)'); g.fillStyle = MGH.grad(g, 90, 210, ['#7ac0ff', '#2a6ad8']); g.beginPath(); g.arc(1080, 150, 60, 0, 7); g.fill(); g.fillStyle = 'rgba(120,220,120,0.6)'; g.beginPath(); g.ellipse(1060, 140, 22, 14, 0.4, 0, 7); g.ellipse(1100, 172, 14, 9, 0, 0, 7); g.fill();
    g.fillStyle = '#e8b86a'; g.beginPath(); g.arc(200, 110, 26, 0, 7); g.fill(); g.strokeStyle = 'rgba(255,220,160,0.7)'; g.lineWidth = 4; g.beginPath(); g.ellipse(200, 110, 48, 12, -0.3, 0, 7); g.stroke();
    for (let i = 0; i < 4; i++) {
      const P = S.p[i], p = m.players[i], ox = i * 320;
      g.save(); g.beginPath(); g.rect(ox, 40, 320, 680); g.clip();
      // moon surface: grey dunes with craters
      g.fillStyle = MGH.grad(g, 630, 720, ['#a8a8b8', '#6a6a7a']); g.beginPath(); g.moveTo(ox, 720); for (let x = 0; x <= 320; x += 16) g.lineTo(ox + x, 642 + (Math.abs(x - S.pad) < 66 ? 0 : 8 + Math.sin(x * 0.06 + i) * 7)); g.lineTo(ox + 320, 720); g.fill();
      for (let k = 0; k < 4; k++) { const cx = ox + 30 + k * 80 + (k % 2) * 10; if (Math.abs(cx - ox - S.pad) < 70) continue; g.fillStyle = 'rgba(60,60,80,0.45)'; g.beginPath(); g.ellipse(cx, 676 + (k % 2) * 16, 18, 5, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(220,220,230,0.4)'; g.lineWidth = 1.5; g.beginPath(); g.ellipse(cx, 675 + (k % 2) * 16, 18, 5, 0, Math.PI, Math.PI * 2); g.stroke(); }
      // landing pad with lights
      MGH.glow(g, ox + S.pad, 640, 70, 'rgba(120,255,160,0.35)'); g.fillStyle = '#5a5a6a'; g.fillRect(ox + S.pad - 60, 636, 120, 10); g.fillStyle = '#7cf06a'; g.fillRect(ox + S.pad - 60, 634, 120, 4);
      for (const sd of [-1, 1]) { g.fillStyle = Math.sin(m.t * 6) > 0 ? '#ffe680' : '#8a6a2a'; g.beginPath(); g.arc(ox + S.pad + sd * 60, 632, 4, 0, 7); g.fill(); }
      // the lander
      const spd = Math.hypot(P.vx, P.vy), okSpd = P.vy < 105 && Math.abs(P.vx) < 70;
      g.save(); g.translate(ox + P.x, P.y); g.rotate(P.st === 'crash' ? 1.2 : P.a); if (P.st === 'crash') g.globalAlpha = 0.55;
      if (P.th && P.st === 'fly') { MGH.glow(g, 0, 26, 30, 'rgba(255,170,80,0.6)'); MGH.flame(g, 0, 22, 0.4, m.t, i); }
      g.strokeStyle = '#c8c8d0'; g.lineWidth = 3; g.beginPath(); g.moveTo(-12, 6); g.lineTo(-22, 22); g.moveTo(12, 6); g.lineTo(22, 22); g.moveTo(-26, 22); g.lineTo(-18, 22); g.moveTo(18, 22); g.lineTo(26, 22); g.stroke();
      g.fillStyle = MGH.grad(g, -14, 12, ['#f4f6fa', '#b8c0cc']); MGH.rr(g, -18, -12, 36, 22, 8); g.fill(); g.fillStyle = p.color; g.fillRect(-18, 4, 36, 5); g.fillStyle = '#ffd34d'; g.fillRect(-6, 9, 12, 4);
      g.fillStyle = 'rgba(160,220,255,0.85)'; g.beginPath(); g.arc(0, -12, 13, 0, 7); g.fill(); g.strokeStyle = '#8a9aaa'; g.lineWidth = 3; g.stroke();
      g.save(); g.beginPath(); g.arc(0, -12, 12, 0, 7); g.clip(); Char.draw(g, 0, -8, 10, p.el.id, p.color, { mood: MGH.persona(P.st === 'crash' ? 'dizzy' : P.st === 'land' ? 'cheer' : 'determined', p.el.id), seed: i * 1.7, headOnly: true }); g.restore();
      g.fillStyle = 'rgba(255,255,255,0.6)'; g.beginPath(); g.ellipse(-5, -18, 4, 2.5, -0.5, 0, 7); g.fill();
      g.restore();
      if (P.dust > 0) for (let k = 0; k < 6; k++) { g.fillStyle = `rgba(200,200,210,${P.dust * 0.4})`; g.beginPath(); g.arc(ox + P.x + (k - 2.5) * 14 * (2 - P.dust), 640, 6 * P.dust + 2, 0, 7); g.fill(); }
      g.restore();
      g.fillStyle = 'rgba(0,0,0,0.5)'; MGH.rr(g, ox + 10, 60, 12, 80, 6); g.fill(); g.fillStyle = P.fuel > 0.25 ? '#ffb13d' : '#ff4a4a'; g.fillRect(ox + 12, 138 - 76 * P.fuel, 8, 76 * P.fuel);
      if (P.st === 'fly') { g.fillStyle = okSpd ? '#7cf06a' : '#ff6b6b'; g.beginPath(); g.arc(ox + 300, 70, 9, 0, 7); g.fill(); MGH.text(g, okSpd ? 'slow enough' : 'too fast', ox + 250, 75, 13, okSpd ? '#9fffa0' : '#ff9a9a', 'center', 'bold'); }
      else MGH.text(g, P.st === 'land' ? `LANDED +${P.sc}` : 'CRASH!', ox + 160, 80, 18, P.st === 'land' ? '#7cf06a' : '#ff6b6b', 'center', 'bold');
      MGH.text(g, `${p.name}  ${S.pts[i]}`, ox + 160, 712, 16, p.color, 'center', 'bold');
      if (i) { g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(ox - 1, 40, 2, 680); }
    }
    MGH.label(g, `Round ${S.round} of 3`, 640, 100, 18, '#fff');
  },
});

// ======================================================================== JUMP ROPE — with the double-rope finale (merged with Skyrope Skip)
MG.def({
  id: 'jumprope', name: 'Jump Rope', type: 'Timing', controls: '1 button', dur: 0,
  rows: [['a', 'Jump']],
  how: 'Two friendly hosts swing a long rope and all four of you stand in the middle. Press A to JUMP just before the rope sweeps under your feet! Jump too early or too late and it catches you — you\'re out. The rope changes pace as it goes, and after a while a SECOND rope joins in (double-dutch!) so you have to jump twice as often. Last one skipping wins!',
  wins: 'Last one jumping.',
  init(m, S) { S.ph = [0, 0.5]; S.sp = 0.7; S.target = 0.7; S.two = false; S.alive = [true, true, true, true]; S.order = []; S.j = [0, 0, 0, 0]; S.count = 0; S.err = [0, 1, 2, 3].map(() => R.range(-0.05, 0.05)); S.go = 2.2; S.t = 0; S.paceT = 6; },
  update(m, S, dt) {
    S.t += dt; if (S.t < S.go) return;
    S.paceT -= dt; if (S.paceT <= 0) { S.paceT = R.range(4, 7); S.target = clamp(0.65 + S.count * 0.012 + R.range(-0.12, 0.12), 0.6, S.two ? 1.05 : 1.6); }
    S.sp += (S.target - S.sp) * dt;
    if (!S.two && S.t - S.go > 22) { S.two = true; S.ph[1] = S.ph[0] + 0.5; S.target = Math.min(S.target, 0.9); Sfx.whistle(); }
    S.j = S.j.map(j => Math.max(0, j - dt));
    for (let i = 0; i < 4; i++) if (S.alive[i] && S.j[i] <= 0 && m.pressed(i, 'a')) { S.j[i] = 0.42; Sfx.tone(600, 0.04, 'triangle', 0.03); }
    for (let r = 0; r < (S.two ? 2 : 1); r++) {
      const prev = S.ph[r]; S.ph[r] += dt * S.sp;
      if (Math.floor(prev + 0.5) !== Math.floor(S.ph[r] + 0.5)) {
        S.count++; Sfx.tone(200, 0.05, 'square', 0.03);
        for (let i = 0; i < 4; i++) if (S.alive[i]) { const h = S.j[i] > 0 ? Math.sin(Math.PI * S.j[i] / 0.42) : 0; if (h < 0.35) { S.alive[i] = false; S.order.push(i); Sfx.thud(); MGH.burst(310 + i * 220, 560, ['#fff', m.players[i].color], 12, { speed: 200 }); } }
      }
    }
    if (!S.two) S.ph[1] = S.ph[0] + 0.5;
    if (S.alive.filter(a => a).length <= 1 || S.count > 120) m.finish(this.score(m, S));
  },
  bot(m, S, i) {
    const v = m.vin[i]; v.a = false; if (!S.alive[i] || S.t < S.go || S.j[i] > 0) return;
    let to = 9; for (let r = 0; r < (S.two ? 2 : 1); r++) to = Math.min(to, ((0.5 - (S.ph[r] % 1)) + 1) % 1 / S.sp);
    const want = 0.21 + S.err[i]; if (to < want && to > want - 0.05) { v.a = Math.random() < 0.95 - S.count * 0.002; S.err[i] = R.range(-0.06, 0.06); }
  },
  score(m, S) { return [0, 1, 2, 3].map(i => S.alive[i] ? 100 : S.order.indexOf(i) + 1); },
  fmt(s) { return s >= 100 ? 'Still skipping!' : `out #${s}`; },
  hud(m, S, i) { return S.alive[i] ? `${S.count} skips` : 'out'; },
  rope(g, ph, front, col) {
    const a = ph * Math.PI * 2, sag = Math.cos(a), depth = Math.sin(a), midY = 560 - 40 + sag * 230, x0 = 172, x1 = 1108, hy = 500;
    if ((depth > 0) !== front) return;
    // ground shadow of the rope
    if (front) { g.strokeStyle = 'rgba(0,0,0,0.15)'; g.lineWidth = 8; g.beginPath(); g.moveTo(x0, 600); g.quadraticCurveTo(640, 612, x1, 600); g.stroke(); }
    g.lineCap = 'round';
    g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = front ? 11 : 7; g.beginPath(); g.moveTo(x0, hy + 3); g.quadraticCurveTo(640, midY * 2 - hy + 3, x1, hy + 3); g.stroke();
    g.strokeStyle = col; g.lineWidth = front ? 8 : 5; g.beginPath(); g.moveTo(x0, hy); g.quadraticCurveTo(640, midY * 2 - hy, x1, hy); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.45)'; g.lineWidth = 2; g.setLineDash([8, 10]); g.beginPath(); g.moveTo(x0, hy - 2); g.quadraticCurveTo(640, midY * 2 - hy - 2, x1, hy - 2); g.stroke(); g.setLineDash([]);
  },
  draw(m, S, g) {
    MGH.scene(g, 'meadow', m.t);
    g.fillStyle = 'rgba(200,170,120,0.55)'; g.beginPath(); g.ellipse(640, 600, 560, 60, 0, 0, 7); g.fill();
    const hand = ph => -0.4 + Math.sin(ph * Math.PI * 2) * 0.6;
    Char.npc(g, 120, 520, 40, 'host', { mood: 'happy', look: { x: 1, y: 0 }, hands: { n: { x: 1.2, y: hand(S.ph[0]), d: 0, o: true, m: true }, f: { x: 1.1, y: S.two ? hand(S.ph[1]) : 0.3, d: S.two ? 0 : 90, o: true, m: false } } });
    Char.npc(g, 1160, 520, 40, 'chef', { mood: 'happy', look: { x: -1, y: 0 }, hands: { n: { x: -1.2, y: hand(S.ph[0]), d: 180, o: true, m: true }, f: { x: -1.1, y: S.two ? hand(S.ph[1]) : 0.3, d: S.two ? 180 : 90, o: true, m: false } } });
    const ropes = S.two ? [[S.ph[0], '#e84a5a'], [S.ph[1], '#3a8ae8']] : [[S.ph[0], '#e84a5a']];
    ropes.forEach(([ph, c]) => this.rope(g, ph, false, c));
    for (let i = 0; i < 4; i++) {
      const p = m.players[i], x = 310 + i * 220, h = S.j[i] > 0 ? Math.sin(Math.PI * S.j[i] / 0.42) * 70 : 0;
      MGH.shadow(g, x, 600, 30 - h * 0.15, 0.3);
      Char.draw(g, x, 552 - h, 36, p.el.id, p.color, { mood: MGH.persona(!S.alive[i] ? 'sad' : h > 10 ? 'cheer' : 'determined', p.el.id), seed: i * 1.7, alpha: S.alive[i] ? 1 : 0.4, feet: h > 10 ? [{ x: -0.3, lift: 0.5, tip: 0.3 }, { x: 0.3, lift: 0.5, tip: 0.3 }] : undefined, hands: h > 10 ? { n: { x: -1.1, y: -1.2, d: -130, o: true, m: true }, f: { x: 1.1, y: -1.2, d: -50, o: true, m: false } } : undefined });
      MGH.text(g, p.name, x, 640, 18, p.color, 'center', 'bold');
    }
    ropes.forEach(([ph, c]) => this.rope(g, ph, true, c));
    MGH.label(g, `${S.count} skips` + (S.two ? '  ·  DOUBLE ROPE!' : ''), 640, 90, 28, '#fff');
    if (S.t < S.go) MGH.label(g, 'Get ready to jump!', 640, 200, 34, '#ffe680');
  },
});
