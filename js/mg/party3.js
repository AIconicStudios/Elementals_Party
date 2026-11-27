'use strict';
// Party batch 2a: Musical Cushions, Freeze Tag (1v3), Raft Rapids (2v2), Memory Match, Cake Stack

// ======================================================================== MUSICAL CUSHIONS
MG.def({
  id: 'cushions', name: 'Musical Cushions', type: 'Survival', controls: 'Move', dur: 0,
  rows: [['pad', 'Dance about, then dash to a cushion!']],
  how: 'The host spins a tune and everyone dances around the room. When the music STOPS, cushions pop up — dash onto one! There is always one cushion fewer than players: whoever is left standing is out. Bump into rivals to knock them off course. Last one sitting pretty wins.',
  wins: 'Last hero to grab a cushion.',
  init(m, S) {
    S.b = [0, 1, 2, 3].map(i => Object.assign(MGH.body(400 + i * 160, 430, 24), { out: false, outT: 0, seat: -1 }));
    S.round = 0; this.music(S);
  },
  music(S) { S.round++; S.phase = 'music'; S.pt = 0; S.len = R.range(3.5, 7); S.cush = []; S.b.forEach(b => { b.seat = -1; }); S.note = 0; },
  update(m, S, dt) {
    S.pt += dt;
    S.b.forEach((b, i) => {
      if (b.out) return;
      if (b.seat >= 0) { b.vx = b.vy = 0; const c = S.cush[b.seat]; b.x += (c.x - b.x) * 0.3; b.y += (c.y - 8 - b.y) * 0.3; return; }
      const a = m.axis(i); MGH.steer(b, a.x, a.y, dt, 1700, S.phase === 'music' ? 240 : 290, 6);
      b.x += b.vx * dt; b.y += b.vy * dt; b.x = clamp(b.x, 120, 1160); b.y = clamp(b.y, 230, 650);
    });
    MGH.collide(S.b.filter(b => !b.out && b.seat < 0), 1.5);
    if (S.phase === 'music') {
      if (S.pt > S.note) { S.note += 0.25; const sc = [523, 587, 659, 784, 880, 784, 659, 587]; Sfx.tone(sc[Math.floor(S.pt * 4) % 8], 0.18, 'triangle', 0.04); }
      if (S.pt > S.len) {
        S.phase = 'grab'; S.pt = 0; Sfx.tone(200, 0.3, 'sawtooth', 0.05, -80); MGH.shake(4);
        const n = S.b.filter(b => !b.out).length - 1;
        for (let k = 0; k < n; k++) { let x, y, ok = false, tries = 0; while (!ok && tries++ < 50) { x = R.range(180, 1100); y = R.range(270, 620); ok = S.cush.every(c => dist(c.x, c.y, x, y) > 160); } S.cush.push({ x, y, by: -1 }); MGH.burst(x, y, ['#ffd34d', '#ff8ad0'], 10, { speed: 150 }); }
      }
    } else if (S.phase === 'grab') {
      S.b.forEach((b, i) => { if (b.out || b.seat >= 0) return; S.cush.forEach((c, k) => { if (c.by < 0 && dist(b.x, b.y, c.x, c.y) < 38) { c.by = i; b.seat = k; Sfx.tone(700 + i * 80, 0.1, 'triangle', 0.06); } }); });
      if (S.cush.every(c => c.by >= 0) || S.pt > 6) {
        S.b.forEach((b, i) => { if (!b.out && b.seat < 0) { b.out = true; b.outT = m.t; Sfx.bad(); MGH.pop('OUT!', b.x, b.y - 60, '#ff6a6a', 34); } });
        S.phase = 'show'; S.pt = 0;
      }
    } else if (S.phase === 'show' && S.pt > 1.6) {
      if (S.b.filter(b => !b.out).length <= 1) m.finish(this.score(m, S)); else this.music(S);
    }
  },
  bot(m, S, i) {
    const b = S.b[i]; if (b.out || b.seat >= 0) return;
    if (S.phase === 'music') { const a = m.t * 0.8 + i * 1.6; MGH.aim(m, i, 640 + Math.cos(a) * 300, 440 + Math.sin(a) * 140, b); return; }
    b.react = b.react === undefined || S.pt < 0.05 ? R.range(0.15, 0.45) : b.react;
    if (S.pt < b.react) { m.vin[i].ax = 0; m.vin[i].ay = 0; m.vin[i].left = m.vin[i].right = m.vin[i].up = m.vin[i].down = false; return; }
    const free = S.cush.filter(c => c.by < 0); if (!free.length) return;
    const c = free.reduce((best, c) => (!best || dist(b.x, b.y, c.x, c.y) < dist(b.x, b.y, best.x, best.y) ? c : best), null);
    MGH.aim(m, i, c.x, c.y, b);
  },
  score(m, S) { return S.b.map(b => b.out ? b.outT : 1000); },
  fmt(s) { return s >= 1000 ? 'sitting pretty!' : `out at ${s.toFixed(0)}s`; },
  hud(m, S, i) { return S.b[i].out ? 'out' : S.b[i].seat >= 0 ? 'seated' : ''; },
  draw(m, S, g) {
    GX.blit(g, BG3.party()); BG3.disco(g, m.t);
    // disco floor
    for (let r = 0; r < 6; r++) for (let c = 0; c < 12; c++) { const on = S.phase === 'music' && ((r + c + Math.floor(S.pt * 4)) % 3 === 0); g.fillStyle = on ? ['#ff5a9a', '#5ab8ff', '#ffd34d', '#7cf06a'][(r * 3 + c) % 4] : (r + c) % 2 ? '#3a2a5a' : '#4a3a6a'; g.globalAlpha = on ? 0.7 : 1; g.fillRect(100 + c * 90, 220 + r * 75, 88, 73); g.globalAlpha = 1; }
    if (S.phase === 'music') for (let k = 0; k < 4; k++) { const a = m.t * 1.5 + k * 1.6; g.fillStyle = ['rgba(255,90,154,0.12)', 'rgba(90,184,255,0.12)', 'rgba(255,211,77,0.12)', 'rgba(124,240,106,0.12)'][k]; g.beginPath(); g.moveTo(640, 60); g.lineTo(640 + Math.cos(a) * 900 - 60, 720); g.lineTo(640 + Math.cos(a) * 900 + 60, 720); g.fill(); }
    // disco ball + DJ booth
    g.fillStyle = '#c8c8d8'; g.beginPath(); g.arc(640, 60, 30, 0, 7); g.fill(); for (let k = 0; k < 10; k++) { g.fillStyle = `rgba(255,255,255,${0.3 + 0.5 * Math.abs(Math.sin(m.t * 3 + k))})`; g.fillRect(625 + (k % 4) * 8, 40 + Math.floor(k / 4) * 12, 6, 6); }
    g.fillStyle = '#2a1a3a'; MGH.rr(g, 520, 130, 240, 70, 14); g.fill(); g.fillStyle = '#1a1a1a'; for (const x of [575, 705]) { g.beginPath(); g.arc(x, 160, 24, 0, 7); g.fill(); g.strokeStyle = '#555'; g.lineWidth = 2; g.beginPath(); g.arc(x, 160, 14, m.t * 6, m.t * 6 + 4); g.stroke(); }
    Char.npc(g, 640, 112, 32, 'host', { mood: S.phase === 'music' ? 'cheer' : 'shock', t: m.t });
    if (S.phase === 'music') for (let k = 0; k < 3; k++) { const ph = (m.t * 0.8 + k / 3) % 1; MGH.text(g, k % 2 ? '♪' : '♫', 540 + k * 100 + Math.sin(ph * 6) * 20, 120 - ph * 80, 30, `rgba(255,230,140,${1 - ph})`, 'center', 'bold'); }
    else if (S.phase === 'grab') MGH.text(g, 'GRAB A CUSHION!', 640, 250, 46, '#ffe680', 'center', 'bold');
    MGH.label(g, `Round ${S.round}`, 140, 70, 22, '#fff');
    // cushions
    S.cush.forEach(c => { const pop = Math.min(1, S.pt * 6); g.save(); g.translate(c.x, c.y); g.scale(pop, pop); MGH.shadow(g, 0, 12, 42, 0.3); const gr = g.createRadialGradient(-10, -12, 4, 0, 0, 44); gr.addColorStop(0, '#ffb0d8'); gr.addColorStop(1, '#d83a7a'); g.fillStyle = gr; MGH.rr(g, -42, -22, 84, 44, 20); g.fill(); g.fillStyle = '#ffd34d'; for (const [x, y] of [[-42, -22], [42, -22], [-42, 22], [42, 22]]) { g.beginPath(); g.arc(x * 0.92, y * 0.8, 5, 0, 7); g.fill(); } g.restore(); });
    S.b.forEach((b, i) => { if (b.out) { g.globalAlpha = 0.45; MGH.drawBody(g, b, m.players[i], null, 'cry'); g.globalAlpha = 1; } else MGH.drawBody(g, b, m.players[i], null, S.phase === 'music' ? 'cheer' : b.seat >= 0 ? 'proud' : 'determined'); });
  },
});

// ======================================================================== FREEZE TAG (1 vs 3)
MG.def({
  id: 'freezetag', name: 'Freeze Tag', type: 'Arena', mode: '1v3', controls: 'Move + dash', dur: 40,
  rows: [['pad', 'Run'], ['a', 'Dash / dodge']],
  how: 'One hero is IT and chases the other three around the garden. A tagged runner turns into an ice block! Runners can thaw a frozen friend by standing next to them for a moment. Everyone can DASH with A — the chaser to pounce, runners to dodge (it needs a few seconds to recharge). If all three runners are frozen at once, IT wins. If anyone is still running when time is up, the runners win.',
  wins: 'IT: freeze all three at once. Runners: survive the clock.',
  init(m, S) {
    S.it = m.players.findIndex((p, i) => m.teamOf(i) === 0);
    S.b = m.players.map((p, i) => Object.assign(MGH.body(i === S.it ? 640 : 300 + i * 230, i === S.it ? 420 : 620, 24), { frozen: false, thaw: 0, cd: 0, dash: 0 }));
    S.posts = [[300, 300], [980, 300], [640, 520], [250, 560], [1030, 560]].map(([x, y]) => ({ x, y, r: 40 }));
    S.allT = 0; S.won = -1;
  },
  update(m, S, dt) {
    S.b.forEach((b, i) => {
      b.cd -= dt; b.dash -= dt;
      if (b.frozen) { b.vx = b.vy = 0; return; }
      const a = m.axis(i), it = i === S.it;
      MGH.steer(b, a.x, a.y, dt, 1900, it ? 256 : 274, 6);
      if (m.pressed(i, 'a') && b.cd <= 0) { b.vx = b.face.x * (it ? 780 : 640); b.vy = b.face.y * (it ? 780 : 640); b.cd = it ? 2.4 : 3.2; b.dash = 0.25; Sfx.whoosh(); }
      b.x += b.vx * dt; b.y += b.vy * dt; b.x = clamp(b.x, 50, 1230); b.y = clamp(b.y, 90, 690);
      S.posts.forEach(p => { const d = dist(b.x, b.y, p.x, p.y); if (d < p.r + b.r && d > 0) { b.x = p.x + (b.x - p.x) / d * (p.r + b.r); b.y = p.y + (b.y - p.y) / d * (p.r + b.r); } });
    });
    const it = S.b[S.it];
    S.b.forEach((b, i) => {
      if (i === S.it) return;
      b.safe = (b.safe || 0) - dt;
      if (!b.frozen && b.safe <= 0 && dist(b.x, b.y, it.x, it.y) < 48) { b.frozen = true; b.thaw = 0; Sfx.tone(1200, 0.25, 'sine', 0.05, -700); MGH.burst(b.x, b.y, ['#bfe8ff', '#fff'], 18, { speed: 220 }); MGH.pop('FROZEN!', b.x, b.y - 60, '#bfe8ff', 28); }
      if (b.frozen) {
        const helper = S.b.some((o, j) => j !== S.it && j !== i && !o.frozen && dist(o.x, o.y, b.x, b.y) < 64);
        b.thaw = helper ? b.thaw + dt : Math.max(0, b.thaw - dt);
        if (b.thaw > 0.8) { b.frozen = false; b.thaw = 0; b.safe = 1.5; Sfx.tone(600, 0.15, 'triangle', 0.06, 400); MGH.pop('Thawed!', b.x, b.y - 60, '#ffe680', 24); }
      }
    });
    MGH.collide(S.b.filter(b => !b.frozen), 1);
    if (S.b.every((b, i) => i === S.it || b.frozen)) { S.won = 0; m.finish(this.score(m, S)); }
  },
  bot(m, S, i) {
    const b = S.b[i], v = m.vin[i]; v.a = false; if (b.frozen) return;
    const it = S.b[S.it];
    if (i === S.it) {
      const prey = S.b.filter((o, j) => j !== S.it && !o.frozen); if (!prey.length) return;
      // guard a frozen one if a rescuer is coming, otherwise chase the nearest runner
      const t = prey.reduce((best, o) => (!best || dist(b.x, b.y, o.x, o.y) < dist(b.x, b.y, best.x, best.y) ? o : best), null);
      MGH.aim(m, i, t.x + t.vx * 0.3, t.y + t.vy * 0.3, b); if (dist(b.x, b.y, t.x, t.y) < 190 && b.cd <= 0 && Math.random() < 0.15) v.a = true; return;
    }
    const dI = dist(b.x, b.y, it.x, it.y), ice = S.b.find((o, j) => j !== i && j !== S.it && o.frozen);
    if (dI < 120 && b.cd <= 0 && Math.random() < 0.25) { const ax = b.x - it.x, ay = b.y - it.y, l = Math.hypot(ax, ay) || 1; b.face = { x: ax / l, y: ay / l }; v.a = true; }
    if (ice && dI > 260) { MGH.aim(m, i, ice.x, ice.y, b); return; }
    let fx = b.x - it.x, fy = b.y - it.y; const l = Math.hypot(fx, fy) || 1; fx /= l; fy /= l;
    fx += (640 - b.x) / 900; fy += (400 - b.y) / 600; // keep away from the walls
    MGH.aim(m, i, b.x + fx * 120 + Math.sin(m.t * 2 + i) * 40, b.y + fy * 120, b);
  },
  score(m, S) { const itWon = S.won === 0; return m.players.map((p, i) => (i === S.it) === itWon ? 1 : 0); },
  fmt(s) { return s ? 'won!' : 'lost'; },
  hud(m, S, i) { return (i === S.it ? '🫵 IT' : S.b[i].frozen ? '🧊' : 'running') + (S.b[i].cd > 0 || S.b[i].frozen ? '' : ' ⚡'); },
  draw(m, S, g) {
    GX.blit(g, BG3.meadow());
    S.posts.forEach(p => { MGH.shadow(g, p.x, p.y + 30, 46, 0.25); g.fillStyle = '#5a3a20'; g.fillRect(p.x - 8, p.y - 10, 16, 40); for (const [dx, dy, r] of [[-18, -30, 26], [18, -30, 26], [0, -52, 30]]) { g.fillStyle = '#3f9a32'; g.beginPath(); g.arc(p.x + dx, p.y + dy, r, 0, 7); g.fill(); } g.fillStyle = 'rgba(255,255,255,0.18)'; g.beginPath(); g.arc(p.x - 8, p.y - 62, 10, 0, 7); g.fill(); });
    S.b.forEach((b, i) => {
      const p = m.players[i];
      if (i === S.it) { g.fillStyle = 'rgba(255,60,60,0.25)'; g.beginPath(); g.arc(b.x, b.y + 10, 46, 0, 7); g.fill(); MGH.drawBody(g, b, p, '🫵', b.dash > 0 ? 'angry' : 'evil'); return; }
      MGH.drawBody(g, b, p, null, b.frozen ? 'shock' : 'scared');
      if (b.frozen) { g.fillStyle = 'rgba(190,230,255,0.55)'; MGH.rr(g, b.x - 34, b.y - 50, 68, 92, 12); g.fill(); g.strokeStyle = '#e8f8ff'; g.lineWidth = 3; g.stroke(); g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(b.x - 26, b.y - 44, 8, 50); if (b.thaw > 0) { g.fillStyle = '#ffe680'; g.fillRect(b.x - 30, b.y + 48, 60 * b.thaw / 1.1, 6); } }
    });
    const left = Math.max(0, 45 - m.t); MGH.label(g, `Runners left: ${S.b.filter((b, i) => i !== S.it && !b.frozen).length}`, 1130, 70, 20, '#fff');
  },
});

// ======================================================================== RAFT RAPIDS (2 vs 2)
MG.def({
  id: 'raft', name: 'Raft Rapids', type: 'Race', mode: '2v2', controls: 'Left/Right + button', dur: 75,
  rows: [['a', 'Paddle when your oar meter is in the green'], ['lr', 'Lean to steer']],
  how: 'Each team shares a raft — one hero paddles on the left, the other on the right. Your oar meter swings back and forth: press A when it is in the GREEN zone for a strong stroke. A stroke on the left pushes the raft a little to the right, and the other way round. Stroke together (within a beat of each other) for a SYNC BOOST! Lean with LEFT/RIGHT to steer around the rocks. First team down the river wins.',
  wins: 'First team to the finish (or furthest along).',
  LEN: 5200,
  init(m, S) {
    S.raft = [0, 1].map(tm => ({ x: 0, y: 0, vx: 0, sp: 60, crash: 0, done: 0, lastStroke: [-9, -9] }));
    S.seat = m.players.map((p, i) => { const tm = m.teamOf(i), mates = [0, 1, 2, 3].filter(j => m.teamOf(j) === tm); return { tm, side: mates.indexOf(i) === 0 ? -1 : 1, ph: R.range(0, 6), cd: 0, good: 0 }; });
    S.rocks = []; for (let y = 400; y < this.LEN - 200; y += R.range(160, 260)) S.rocks.push({ x: R.range(-150, 150), y, r: R.range(22, 36) });
    S.win = -1;
  },
  meter(s) { return 0.5 + 0.5 * Math.sin(s.ph); },
  update(m, S, dt) {
    S.seat.forEach((s, i) => {
      s.ph += dt * 3.2; s.cd -= dt; s.good -= dt;
      const R0 = S.raft[s.tm]; if (R0.done) return;
      if (m.pressed(i, 'a') && s.cd <= 0) {
        const v = this.meter(s), good = v > 0.72; s.cd = 0.35;
        R0.sp += good ? 95 : 25; R0.vx += -s.side * (good ? 70 : 20);
        if (good) { s.good = 0.3; const other = (s.side < 0 ? 1 : 0); R0.lastStroke[s.side < 0 ? 0 : 1] = m.t; if (Math.abs(R0.lastStroke[0] - R0.lastStroke[1]) < 0.3) { R0.sp += 120; R0.lastStroke = [-9, -9]; MGH.pop('SYNC!', s.tm ? 960 : 320, 300, '#ffe680', 34); Sfx.tone(980, 0.12, 'triangle', 0.07); } else if (!m.bot(i)) Sfx.tone(520, 0.06, 'triangle', 0.05); }
        else if (!m.bot(i)) Sfx.tone(260, 0.06, 'triangle', 0.04);
      }
      const ax = m.axis(i).x; R0.vx += ax * 160 * dt;
    });
    S.raft.forEach((R0, tm) => {
      if (R0.done) return;
      R0.sp = Math.max(55, R0.sp - R0.sp * 0.55 * dt); R0.vx *= Math.pow(0.4, dt);
      R0.crash -= dt; R0.y += (R0.crash > 0 ? 20 : R0.sp) * dt; R0.x = clamp(R0.x + R0.vx * dt, -200, 200);
      S.rocks.forEach(r => { if (Math.abs(r.y - R0.y) < r.r + 28 && Math.abs(r.x - R0.x) < r.r + 46 && R0.crash <= 0) { R0.crash = 0.9; R0.sp = 40; R0.vx = (R0.x > r.x ? 1 : -1) * 120; Sfx.thud(); MGH.shake(5); } });
      if (R0.y >= this.LEN) { R0.done = m.t; Sfx.crowd('cheer'); if (S.win < 0) S.win = tm; }
    });
    if (S.raft.every(R0 => R0.done)) m.finish(this.score(m, S));
    else if (S.win >= 0 && m.t > S.raft[S.win].done + 3) m.finish(this.score(m, S));
  },
  bot(m, S, i) {
    const s = S.seat[i], v = m.vin[i], R0 = S.raft[s.tm]; v.a = false; v.left = v.right = false;
    const ahead = S.rocks.find(r => r.y > R0.y && r.y < R0.y + 260 && Math.abs(r.x - R0.x) < r.r + 60);
    if (ahead) { if (R0.x >= ahead.x) v.right = true; else v.left = true; }
    const want = this.meter(s); if (want > 0.78 && s.cd <= 0 && Math.random() < 0.5) v.a = true;
  },
  score(m, S) { return m.players.map((p, i) => { const R0 = S.raft[m.teamOf(i)]; return R0.done ? 10000 - R0.done * 10 : R0.y / 10; }); },
  fmt(s) { return s > 5000 ? `finished in ${((10000 - s) / 10).toFixed(1)}s` : `${Math.round(s * 10)} m`; },
  hud(m, S, i) { return `${MG.TEAMN[S.seat[i].tm]} · ${Math.round(Math.min(1, S.raft[S.seat[i].tm].y / this.LEN) * 100)}%`; },
  draw(m, S, g) {
    [0, 1].forEach(tm => {
      const R0 = S.raft[tm], ox = tm ? 640 : 0, cam = R0.y - 160;
      g.save(); g.beginPath(); g.rect(ox, 40, 640, 680); g.clip(); g.translate(ox + 320, 0);
      g.fillStyle = '#5aa84a'; g.fillRect(-320, 40, 640, 680);
      for (let k = 0; k < 12; k++) { const yy = 720 - ((k * 120 + cam * 0.9) % 1440) ; g.fillStyle = '#3f8a32'; g.beginPath(); g.arc(-290 + (k % 2) * 580, yy, 40, 0, 7); g.fill(); }
      const wg = g.createLinearGradient(-240, 0, 240, 0); wg.addColorStop(0, '#2a78c0'); wg.addColorStop(0.5, '#4aa8e8'); wg.addColorStop(1, '#2a78c0'); g.fillStyle = wg; g.fillRect(-240, 40, 480, 680);
      for (let k = 0; k < 30; k++) { const yy = 720 - (((k * 47 + cam * 1.6) % 700) + 20); g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 2; g.beginPath(); g.moveTo(-200 + MGH.hash(k) * 400, yy); g.lineTo(-200 + MGH.hash(k) * 400 + 20, yy - 4); g.stroke(); }
      const fy = 720 - (this.LEN - cam); if (fy > 0 && fy < 760) { for (let k = 0; k < 12; k++) { g.fillStyle = k % 2 ? '#fff' : '#111'; g.fillRect(-240 + k * 40, fy - 10, 40, 20); } }
      S.rocks.forEach(r => { const yy = 720 - (r.y - cam); if (yy < 0 || yy > 760) return; MGH.rock(g, r.x, yy, r.r, r.y, '#7a7a88'); g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 3; g.beginPath(); g.arc(r.x, yy + 6, r.r + 6, 0.2, Math.PI - 0.2); g.stroke(); });
      // raft + paddlers
      const ry = 720 - (R0.y - cam);
      g.save(); g.translate(R0.x, ry); g.rotate(R0.vx * 0.0015 + (R0.crash > 0 ? Math.sin(m.t * 30) * 0.1 : 0));
      g.fillStyle = 'rgba(0,0,0,0.2)'; MGH.rr(g, -66, -36, 132, 92, 16); g.fill();
      g.fillStyle = '#a8743a'; MGH.rr(g, -60, -42, 120, 88, 14); g.fill(); g.strokeStyle = '#6a4a22'; g.lineWidth = 3; for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(-60, k * 17); g.lineTo(60, k * 17); g.stroke(); }
      [0, 1, 2, 3].filter(i => S.seat[i].tm === tm).forEach(i => { const s = S.seat[i], x = s.side * 32; const stroke = s.good > 0 ? 1 : 0; g.strokeStyle = '#5a3a20'; g.lineWidth = 6; g.beginPath(); g.moveTo(x, -6); g.lineTo(x + s.side * 52, 20 - stroke * 30); g.stroke(); Char.draw(g, x, -12, 22, m.players[i].el.id, m.players[i].color, { mood: R0.crash > 0 ? 'hurt' : s.good > 0 ? 'cheer' : 'effort', seed: i, look: { x: 0, y: -1 }, noFeet: true }); });
      g.restore();
      g.restore();
      // oar meters
      [0, 1, 2, 3].filter(i => S.seat[i].tm === tm).forEach(i => { const s = S.seat[i], x = ox + (s.side < 0 ? 40 : 600), v = this.meter(s); g.fillStyle = 'rgba(0,0,0,0.5)'; MGH.rr(g, x - 14, 400, 28, 220, 10); g.fill(); g.fillStyle = 'rgba(124,240,106,0.6)'; g.fillRect(x - 10, 404, 20, 220 * 0.28); g.fillStyle = m.players[i].color; g.beginPath(); g.arc(x, 616 - v * 210, 12, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke(); MGH.text(g, m.players[i].name, x, 640, 13, m.players[i].color, 'center', 'bold'); });
      g.fillStyle = MG.TEAMC[tm]; MGH.rr(g, ox + 250, 50, 140, 30, 12); g.fill(); MGH.text(g, `TEAM ${MG.TEAMN[tm].toUpperCase()}`, ox + 320, 71, 16, '#fff', 'center', 'bold');
      g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(ox + 100, 92, 440, 8); g.fillStyle = MG.TEAMC[tm]; g.fillRect(ox + 100, 92, 440 * Math.min(1, R0.y / this.LEN), 8);
      if (R0.done) MGH.text(g, 'FINISHED!', ox + 320, 300, 48, '#ffe680', 'center', 'bold');
    });
    g.fillStyle = '#222'; g.fillRect(637, 40, 6, 680);
  },
});

// ======================================================================== MEMORY MATCH
MG.def({
  id: 'memory', name: 'Memory Match', type: 'Memory', controls: 'Move + button', dur: 0,
  rows: [['pad', 'Move the cursor'], ['a', 'Flip a card']],
  how: 'Twenty cards lie face down — ten matching pairs. Take turns: move your cursor and flip two cards with A. A match is yours to keep and you go again; otherwise the cards flip back and the next hero goes. Watch every flip closely and remember where things are!',
  wins: 'Most pairs when the table is cleared.',
  ICONS: ['🌪️', '🌊', '🔥', '⛰️', '❄️', '⚡', '🌷', '🌙', '⚙️', '✨'],
  init(m, S) {
    S.cards = R.shuffle([...Array(20).keys()].map(k => k % 10)).map(v => ({ v, up: false, got: -1 }));
    S.turn = 0; S.cur = 0; S.pick = []; S.pts = [0, 0, 0, 0]; S.phase = 'pick'; S.pt = 0; S.seen = {};
  },
  update(m, S, dt) {
    S.pt += dt; const i = S.turn;
    if (S.phase === 'pick') {
      const c = S.cur % 5, r = Math.floor(S.cur / 5);
      if (m.pressed(i, 'left')) S.cur = r * 5 + (c + 4) % 5; if (m.pressed(i, 'right')) S.cur = r * 5 + (c + 1) % 5;
      if (m.pressed(i, 'up')) S.cur = ((r + 3) % 4) * 5 + c; if (m.pressed(i, 'down')) S.cur = ((r + 1) % 4) * 5 + c;
      const card = S.cards[S.cur];
      if ((m.pressed(i, 'a') || S.pt > 9) && card.got < 0 && !card.up) {
        card.up = true; S.pick.push(S.cur); S.seen[S.cur] = card.v; Sfx.tone(700, 0.05, 'triangle', 0.05); S.pt = 0;
        if (S.pick.length === 2) { S.phase = 'look'; }
      } else if (S.pt > 9) { const free = S.cards.map((c, k) => (c.got < 0 && !c.up ? k : -1)).filter(k => k >= 0); S.cur = R.pick(free); }
    } else if (S.phase === 'look' && S.pt > 1.1) {
      const [a, b] = S.pick, A = S.cards[a], B = S.cards[b];
      if (A.v === B.v) { A.got = B.got = i; S.pts[i]++; Sfx.coin(); MGH.pop('Pair!', 640, 360, m.players[i].color, 40); }
      else { A.up = B.up = false; S.turn = (S.turn + 1) % 4; }
      S.pick = []; S.phase = 'pick'; S.pt = 0;
      if (S.cards.every(c => c.got >= 0)) m.finish(this.score(m, S));
    }
  },
  bot(m, S, i) {
    const v = m.vin[i]; v.a = v.left = v.right = v.up = v.down = false;
    if (S.turn !== i || S.phase !== 'pick' || S.pt < 0.45) return;
    if (!S.goal || S.goal.n !== S.pick.length + ':' + S.turn + ':' + S.cards.filter(c => c.got >= 0).length) {
      const known = Object.entries(S.seen).filter(([k]) => S.cards[k].got < 0 && !S.cards[k].up && Math.random() < 0.75);
      let target = -1;
      if (S.pick.length === 1) { const want = S.cards[S.pick[0]].v; const k = known.find(([k2, val]) => val === want && +k2 !== S.pick[0]); if (k) target = +k[0]; }
      else { for (const [k1, v1] of known) { const k2 = known.find(([k3, v3]) => v3 === v1 && k3 !== k1); if (k2) { target = +k1; break; } } }
      if (target < 0) { const free = S.cards.map((c, k) => (c.got < 0 && !c.up && S.seen[k] === undefined ? k : -1)).filter(k => k >= 0); target = free.length ? R.pick(free) : S.cards.findIndex(c => c.got < 0 && !c.up); }
      S.goal = { n: S.pick.length + ':' + S.turn + ':' + S.cards.filter(c => c.got >= 0).length, k: target };
    }
    const t = S.goal.k, tc = t % 5, tr = Math.floor(t / 5), c = S.cur % 5, r = Math.floor(S.cur / 5);
    if (Math.random() < 0.3) { if (tc < c) v.left = true; else if (tc > c) v.right = true; else if (tr < r) v.up = true; else if (tr > r) v.down = true; else v.a = true; }
  },
  score(m, S) { return S.pts.slice(); },
  fmt(s) { return `${s} pair${s === 1 ? '' : 's'}`; },
  hud(m, S, i) { return `${S.pts[i]} pairs` + (S.turn === i ? ' ◀' : ''); },
  draw(m, S, g) {
    g.fillStyle = MGH.grad(g, 0, 720, ['#1a4a3a', '#2a6a4a', '#143a2a']); g.fillRect(0, 0, 1280, 720);
    g.fillStyle = '#8a5a32'; MGH.rr(g, 250, 80, 780, 600, 30); g.fill(); g.fillStyle = '#2a7a4a'; MGH.rr(g, 266, 96, 748, 568, 22); g.fill();
    S.cards.forEach((c, k) => {
      const x = 290 + (k % 5) * 144, y = 116 + Math.floor(k / 5) * 136, sel = S.phase === 'pick' && S.cur === k;
      if (c.got >= 0) { g.fillStyle = 'rgba(0,0,0,0.15)'; MGH.rr(g, x, y, 124, 120, 12); g.fill(); return; }
      g.fillStyle = 'rgba(0,0,0,0.3)'; MGH.rr(g, x + 4, y + 6, 124, 120, 12); g.fill();
      if (c.up) { g.fillStyle = '#fffaf0'; MGH.rr(g, x, y, 124, 120, 12); g.fill(); MGH.emoji(g, this.ICONS[c.v], x + 62, y + 62, 60); }
      else { const gr = g.createLinearGradient(x, y, x + 124, y + 120); gr.addColorStop(0, '#7a4ad8'); gr.addColorStop(1, '#4a2a9a'); g.fillStyle = gr; MGH.rr(g, x, y, 124, 120, 12); g.fill(); g.strokeStyle = 'rgba(255,255,255,0.4)'; g.lineWidth = 3; MGH.rr(g, x + 10, y + 10, 104, 100, 8); g.stroke(); MGH.text(g, '✦', x + 62, y + 76, 40, 'rgba(255,230,140,0.7)', 'center', 'bold'); }
      if (sel) { g.strokeStyle = m.players[S.turn].color; g.lineWidth = 6; MGH.rr(g, x - 4, y - 4, 132, 128, 14); g.stroke(); }
    });
    m.players.forEach((p, i) => { const x = i < 2 ? 125 : 1155, y = 200 + (i % 2) * 300, me = S.turn === i; if (me) MGH.glow(g, x, y, 100, 'rgba(255,230,120,0.4)'); Char.draw(g, x, y, 38, p.el.id, p.color, { mood: me ? 'determined' : 'happy', seed: i, look: { x: i < 2 ? 1 : -1, y: 0 } }); MGH.text(g, `${p.name}: ${S.pts[i]}`, x, y + 84, 20, p.color, 'center', 'bold'); });
  },
});

// ======================================================================== CAKE STACK
MG.def({
  id: 'cake', name: 'Cake Stack', type: 'Timing', controls: '1 button', dur: 45,
  rows: [['a', 'Drop the layer']],
  how: 'Build the tallest cake! A sponge layer slides back and forth above your stack — press A to drop it. Any part hanging over the edge gets sliced off, so your layers get narrower. Drop it perfectly on top for a PERFECT bonus that keeps the layer full width. Miss completely and your cake is finished!',
  wins: 'Tallest cake (most layers).',
  init(m, S) { S.p = [0, 1, 2, 3].map(() => ({ layers: [{ x: 0, w: 180 }], cur: { x: -140, w: 180, dir: 1 }, done: false, sp: 220, perfect: 0 })); },
  update(m, S, dt) {
    S.p.forEach((p, i) => {
      p.perfect = Math.max(0, p.perfect - dt);
      if (p.done) return;
      const c = p.cur; c.x += c.dir * p.sp * dt; if (c.x > 150) { c.x = 150; c.dir = -1; } if (c.x < -150) { c.x = -150; c.dir = 1; }
      if (m.pressed(i, 'a')) {
        const top = p.layers[p.layers.length - 1], l = Math.max(c.x - c.w / 2, top.x - top.w / 2), r = Math.min(c.x + c.w / 2, top.x + top.w / 2);
        if (Math.abs(c.x - top.x) < 6) { p.layers.push({ x: top.x, w: top.w }); p.perfect = 0.8; if (!m.bot(i)) Sfx.coin(); }
        else if (r - l <= 6) { p.done = true; p.doneT = m.t; Sfx.bad(); MGH.burst(160 + i * 320, 300, ['#ffd0a0', '#fff'], 14, { speed: 200 }); return; }
        else { p.layers.push({ x: (l + r) / 2, w: r - l }); if (!m.bot(i)) Sfx.tone(500 + p.layers.length * 30, 0.08, 'triangle', 0.06); }
        const nt = p.layers[p.layers.length - 1]; p.cur = { x: -150 * c.dir, w: nt.w, dir: c.dir }; p.sp = Math.min(520, p.sp + 14);
      }
    });
    if (S.p.every(p => p.done)) m.finish(this.score(m, S));
  },
  bot(m, S, i) {
    const p = S.p[i], v = m.vin[i]; v.a = false; if (p.done) return;
    const top = p.layers[p.layers.length - 1]; p.err = p.err === undefined ? R.range(-14, 14) * (1 + p.layers.length * 0.06) : p.err;
    if (Math.abs(p.cur.x - (top.x + p.err)) < p.sp / 60) { v.a = true; p.err = undefined; }
  },
  score(m, S) { return S.p.map(p => p.layers.length - 1); },
  fmt(s) { return `${s} layer${s === 1 ? '' : 's'}`; },
  hud(m, S, i) { return `${S.p[i].layers.length - 1} layers` + (S.p[i].done ? ' ✔' : ''); },
  draw(m, S, g) {
    g.fillStyle = MGH.grad(g, 0, 720, ['#ffe8f0', '#ffd0e0', '#f0b8d0']); g.fillRect(0, 0, 1280, 720);
    for (let k = 0; k < 8; k++) { g.fillStyle = k % 2 ? 'rgba(255,255,255,0.35)' : 'rgba(255,180,210,0.35)'; g.fillRect(k * 160, 0, 80, 720); }
    g.fillStyle = '#c88a5a'; g.fillRect(0, 640, 1280, 80); g.fillStyle = '#a86a3a'; g.fillRect(0, 640, 1280, 8);
    Char.npc(g, 640, 120, 30, 'chef', { mood: 'happy', t: m.t, look: { x: Math.sin(m.t), y: 0 } });
    const cols = ['#fff0d8', '#ffd0e8', '#d8b0ff', '#c8f0d0', '#fff4a0', '#ffc8a0'];
    S.p.forEach((p, i) => {
      const cx = 160 + i * 320, base = 620, lh = 22, maxVis = 18, off = Math.max(0, p.layers.length - maxVis);
      g.fillStyle = '#e8e8f0'; g.beginPath(); g.ellipse(cx, base + 12, 130, 18, 0, 0, 7); g.fill(); g.strokeStyle = '#c8c8d8'; g.lineWidth = 3; g.stroke();
      p.layers.forEach((L, k) => { if (k < off) return; const y = base - (k - off) * lh; g.fillStyle = k === 0 ? '#c8c8d8' : cols[k % cols.length]; MGH.rr(g, cx + L.x - L.w / 2, y - lh + 2, L.w, lh - 2, 6); g.fill(); if (k) { g.fillStyle = 'rgba(255,255,255,0.7)'; g.fillRect(cx + L.x - L.w / 2, y - lh + 2, L.w, 4); g.fillStyle = '#ff5a7a'; for (let q = 0; q < Math.floor(L.w / 30); q++) { g.beginPath(); g.arc(cx + L.x - L.w / 2 + 15 + q * 30, y - lh + 4, 3, 0, 7); g.fill(); } } });
      if (!p.done) { const y = base - (p.layers.length - off) * lh - 30, c = p.cur; g.fillStyle = cols[p.layers.length % cols.length]; g.globalAlpha = 0.9; MGH.rr(g, cx + c.x - c.w / 2, y, c.w, lh - 2, 6); g.fill(); g.globalAlpha = 1; g.strokeStyle = 'rgba(0,0,0,0.25)'; g.setLineDash([5, 5]); g.beginPath(); g.moveTo(cx + c.x, y + lh); g.lineTo(cx + c.x, y + 40); g.stroke(); g.setLineDash([]); }
      if (p.perfect > 0) MGH.text(g, 'PERFECT!', cx, base - (p.layers.length - off) * lh - 70, 26, '#ff4a8a', 'center', 'bold');
      Char.draw(g, cx + (i % 2 ? 110 : -110), 590, 26, m.players[i].el.id, m.players[i].color, { mood: p.done ? (p.layers.length > 8 ? 'proud' : 'sad') : 'determined', seed: i, look: { x: i % 2 ? -1 : 1, y: -0.5 } });
      MGH.text(g, `${m.players[i].name}: ${p.layers.length - 1}`, cx, 690, 20, m.players[i].color, 'center', 'bold');
    });
  },
});
