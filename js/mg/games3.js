'use strict';
// Moot minigames 21-30

// shared helper for secret-pick rounds
const PickR = {
  start(S, n, time, startIdx = 0) {
    S.P = [0, 1, 2, 3].map(() => ({ idx: startIdx, locked: false }));
    time = Math.max(12, time * 2.2); // plenty of time to think, peek and decide
    S.n = n; S.pickT = time; S.phase = 'pick'; S.t = 0;
    S.botAt = [0, 1, 2, 3].map(() => R.range(0.8, Math.min(time - 0.5, 4)));
  },
  // returns true when the pick phase has ended
  update(m, S, dt, cols, botChoice) {
    S.t += dt;
    for (let i = 0; i < 4; i++) {
      const P = S.P[i];
      if (m.bot(i)) { if (!P.locked && S.t >= S.botAt[i]) { P.idx = botChoice(i); P.locked = true; } }
      else MGH.pick(m, i, P, S.n, cols);
    }
    return S.P.every(p => p.locked) || S.t >= S.pickT;
  },
  drawStatus(m, S, g, y = 690) {
    for (let i = 0; i < 4; i++) {
      const p = m.players[i];
      const mood = S.phase === 'reveal' && S.mood ? S.mood[i] : (S.P[i].locked ? 'happy' : 'determined');
      MGH.av(g, m, i, 160 + i * 320 - 116, y - 14, 20, mood, { look: { x: 0.6, y: -0.3 } });
      MGH.text(g, `${p.name}: ${S.phase === 'reveal' ? '' : (S.P[i].locked ? '🔒 locked' : 'choosing…')}`, 160 + i * 320 + 28, y, 18, p.color, 'center', 'bold');
    }
    if (S.phase === 'pick') { MGH.phase(g, false, (S.t || 0)); MGH.label(g, `⏱ ${Math.max(0, S.pickT - S.t).toFixed(1)}`, 1180, 92, 22, '#fff'); MGH.secretHint(g); }
  },
  // draws a row/grid of option boxes with each human's cursor (hidden picks)
  drawOptions(m, S, g, labels, x0, y0, w, h, cols, reveal) {
    labels.forEach((lab, k) => {
      const x = x0 + (k % cols) * (w + 12), y = y0 + Math.floor(k / cols) * (h + 12);
      g.fillStyle = 'rgba(0,0,0,0.3)'; MGH.rr(g, x + 4, y + 6, w, h, 14); g.fill();
      g.fillStyle = MGH.grad(g, y, y + h, ['rgba(255,255,255,0.22)', 'rgba(255,255,255,0.06)']); MGH.rr(g, x, y, w, h, 14); g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.45)'; g.lineWidth = 2; g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.15)'; MGH.rr(g, x + 6, y + 4, w - 12, h * 0.25, 10); g.fill();
      MGH.text(g, lab, x + w / 2, y + h / 2 + 10, Math.min(36, h * 0.45), '#fff', 'center', 'bold');
      for (let i = 0; i < 4; i++) {
        const P = S.P[i];
        const showDot = reveal ? P.idx === k && P.locked : (MGH.peek(m, i) && P.idx === k);
        if (showDot) { g.fillStyle = m.players[i].color; g.beginPath(); g.arc(x + 14 + i * 18, y + 14, 7, 0, 7); g.fill(); }
      }
    });
  },
};

// 21 ---------------------------------------------------------------- Hidden Hoard
MG.def({
  id: 'hoard', name: 'Hidden Hoard', type: 'Memory', controls: 'Pick',
  how: 'A coin is hidden in one of three chests, which then shuffle. Pick where it ended. Four rounds, faster each time.',
  wins: 'Most correct (tie: faster total).',
  init(m, S) { S.pts = [0, 0, 0, 0]; S.ttot = [0, 0, 0, 0]; S.round = 0; this.next(S); },
  next(S) {
    S.round++; S.coin = R.int(0, 2); S.slot = [0, 1, 2]; S.swaps = []; S.phase = 'show'; S.t = 0;
    const n = 4 + S.round * 2; for (let k = 0; k < n; k++) { const a = R.int(0, 2); let b = R.int(0, 1); if (b >= a) b++; S.swaps.push([a, b]); }
    S.sw = 0.55 - S.round * 0.07; S.k = 0; S.anim = 0;
  },
  update(m, S, dt) {
    S.t += dt;
    if (S.phase === 'show' && S.t > 1.9) { S.phase = 'shuffle'; S.t = 0; }
    else if (S.phase === 'shuffle') {
      S.anim = S.t / S.sw;
      if (S.t >= S.sw) { const [a, b] = S.swaps[S.k]; const ia = S.slot.indexOf(a), ib = S.slot.indexOf(b); [S.slot[ia], S.slot[ib]] = [S.slot[ib], S.slot[ia]]; S.k++; S.t = 0; Sfx.tone(300, 0.04, 'square', 0.03); if (S.k >= S.swaps.length) { PickR.start(S, 3, 5, 1); } }
    } else if (S.phase === 'pick') {
      const ans = S.slot.indexOf(S.coin);
      if (PickR.update(m, S, dt, 3, i => Math.random() < 0.95 - S.round * 0.09 ? ans : R.int(0, 2))) {
        S.mood = [0, 1, 2, 3].map(i => S.P[i].locked && S.P[i].idx === ans ? 'cheer' : 'hurt');
        for (let i = 0; i < 4; i++) { if (S.P[i].locked && S.P[i].idx === ans) S.pts[i]++; S.ttot[i] += S.t; }
        S.phase = 'reveal'; S.t = 0;
      }
    } else if (S.phase === 'reveal' && S.t > 1.6) { if (S.round >= 4) m.finish(this.score(m, S)); else this.next(S); }
  },
  score(m, S) { return S.pts.map((p, i) => p * 100 - S.ttot[i]); },
  fmt(s) { return `${Math.round(s / 100)} correct`; },
  hud(m, S, i) { return S.pts[i]; },
  slotX(k) { return 360 + k * 280; },
  draw(m, S, g) {
    MGH.scene(g, 'cave', m.t);
    g.fillStyle = MGH.grad(g, 440, 720, ['#5a3a20', '#2a1a0c']); g.fillRect(0, 470, 1280, 250);
    MGH.label(g, `Round ${S.round} / 4`, 110, 92, 20, '#eee');
    if (S.phase === 'show' || S.phase === 'shuffle') MGH.phase(g, true, m.t, S.phase === 'show' ? 'The coin goes into this chest…' : 'Follow the chest with the coin!');
    const pos = [0, 1, 2].map(c => this.slotX(S.slot.indexOf(c)));
    let hop = [0, 0, 0];
    if (S.phase === 'shuffle' && S.k < S.swaps.length) {
      const [a, b] = S.swaps[S.k], t = clamp(S.anim, 0, 1);
      const xa = this.slotX(S.slot.indexOf(a)), xb = this.slotX(S.slot.indexOf(b));
      pos[a] = lerp(xa, xb, t); pos[b] = lerp(xb, xa, t); hop[a] = -Math.sin(t * Math.PI) * 50; hop[b] = Math.sin(t * Math.PI) * 20;
    }
    for (let c = 0; c < 3; c++) {
      const open = (S.phase === 'show' || S.phase === 'reveal') && c === S.coin, x = pos[c], y = 360 + hop[c];
      MGH.shadow(g, x, 470, 90, 0.4);
      if (open) { MGH.glow(g, x, y - 10, 120, 'rgba(255,220,90,0.6)'); MGH.coin(g, x, y - 70 - Math.sin(m.t * 4) * 6, 26, m.t * 2); }
      g.fillStyle = MGH.grad(g, y, y + 100, ['#b07038', '#6a3e18']); MGH.rr(g, x - 85, y, 170, 100, 12); g.fill();
      g.fillStyle = '#ffd34d'; g.fillRect(x - 85, y + 40, 170, 10); g.fillRect(x - 10, y + 30, 20, 30);
      g.save(); g.translate(x - 85, y); g.rotate(open ? -0.55 : 0); g.fillStyle = MGH.grad(g, -50, 0, ['#c98a4a', '#7a4a22']); MGH.rr(g, 0, -40, 170, 44, 16); g.fill(); g.fillStyle = '#ffd34d'; g.fillRect(0, -8, 170, 8); g.restore();
    }
    if (S.phase === 'pick' || S.phase === 'reveal') {
      for (let k = 0; k < 3; k++) for (let i = 0; i < 4; i++) {
        const P = S.P[i], show = S.phase === 'reveal' ? P.locked && P.idx === k : (MGH.peek(m, i) && P.idx === k);
        if (show) MGH.av(g, m, i, this.slotX(k) - 54 + i * 36, 530, 13, S.phase === 'reveal' ? (k === S.slot.indexOf(S.coin) ? 'cheer' : 'hurt') : 'determined', { noFeet: true });
      }
      PickR.drawStatus(m, S, g);
    }
  },
});

// 22 ---------------------------------------------------------------- Spot the Counterfeit
MG.def({
  id: 'counterfeit', name: 'Spot the Counterfeit', type: 'Search', controls: 'Move + A',
  how: 'A grid of coins with one subtle fake. Hop your marker from coin to coin with the stick / arrows and press A on the fake. The first to find it scores; a wrong pick costs a point. Five rounds.',
  wins: 'Most points.',
  init(m, S) { S.pts = [0, 0, 0, 0]; S.round = 0; this.next(S); },
  next(S) {
    S.round++; S.cols = 9; S.rows = 5; S.fake = R.int(0, 44); S.t = 0; S.lock = [0, 0, 0, 0]; S.found = -1; S.pause = 0;
    S.kind = R.int(0, 2); S.delta = 0.14 - S.round * 0.012;
    S.botT = [0, 1, 2, 3].map(() => R.range(2, 7)); S.botTarget = [0, 1, 2, 3].map(() => Math.random() < 0.8 ? S.fake : R.int(0, 44));
    // each player's marker starts in a different corner of the grid
    if (!S.sel) S.sel = [0, 8, 36, 44]; S.rep = [0, 0, 0, 0]; S.held = [false, false, false, false];
  },
  // move a marker one coin in the pushed direction (holding repeats)
  hop(m, S, i, dt) {
    const a = m.axis(i), mag = Math.max(Math.abs(a.x), Math.abs(a.y));
    S.rep[i] -= dt;
    if (mag < 0.4) { S.held[i] = false; return; }
    if (S.held[i] && S.rep[i] > 0) return;
    const c = S.sel[i] % S.cols, rw = Math.floor(S.sel[i] / S.cols);
    let nc = c, nr = rw;
    if (Math.abs(a.x) >= Math.abs(a.y)) nc = clamp(c + Math.sign(a.x), 0, S.cols - 1); else nr = clamp(rw + Math.sign(a.y), 0, S.rows - 1);
    S.sel[i] = nr * S.cols + nc; S.rep[i] = S.held[i] ? 0.11 : 0.3; S.held[i] = true;
    if (!m.bot(i)) Sfx.tone(560, 0.02, 'triangle', 0.02);
  },
  cell(S, k) { return { x: 200 + (k % S.cols) * 110, y: 170 + Math.floor(k / S.cols) * 100 }; },
  update(m, S, dt) {
    if (S.pause > 0) { S.pause -= dt; if (S.pause <= 0) { if (S.round >= 5) m.finish(S.pts.slice()); else this.next(S); } return; }
    S.t += dt;
    for (let i = 0; i < 4; i++) {
      S.lock[i] -= dt;
      this.hop(m, S, i, dt);
      if (S.lock[i] > 0 || !m.pressed(i, 'a')) continue;
      for (let k = 0; k < 45; k++) {
        const p = this.cell(S, k);
        if (k === S.sel[i]) {
          if (k === S.fake) { S.pts[i]++; S.found = i; S.pause = 1.5; Sfx.coin(); MGH.burst(p.x, p.y, ['#ffe680', '#fff', m.players[i].color], 30, { speed: 300, kind: 'spark', size: 3 }); MGH.ring(p.x, p.y, '#ffe680', 30, 90); }
          else { S.pts[i]--; S.lock[i] = 1; MGH.pop('−1', p.x, p.y - 20, '#ff6b6b', 26); if (!m.bot(i)) Sfx.bad(); }
          break;
        }
      }
      if (S.pause > 0) break;
    }
    if (S.t > 25 && S.pause <= 0) { S.pause = 1.2; }
  },
  bot(m, S, i, dt) {
    const v = m.vin[i]; v.a = false;
    if (S.pause > 0 || S.t < S.botT[i] - 1.2) return;
    v.ax = v.ay = 0;
    const tg = S.botTarget[i], dc = tg % S.cols - S.sel[i] % S.cols, dr = Math.floor(tg / S.cols) - Math.floor(S.sel[i] / S.cols);
    if (dc || dr) { if (!S.held[i]) { if (dc) v.ax = Math.sign(dc); else v.ay = Math.sign(dr); } return; }
    if (S.t >= S.botT[i] && S.lock[i] <= 0) { v.a = true; S.botT[i] = S.t + R.range(1.5, 3); S.botTarget[i] = Math.random() < 0.7 ? S.fake : R.int(0, 44); }
  },
  score(m, S) { return S.pts.slice(); },
  hud(m, S, i) { return S.pts[i]; },
  draw(m, S, g) {
    MGH.scene(g, 'temple', m.t);
    g.fillStyle = 'rgba(40,20,10,0.6)'; MGH.rr(g, 150, 130, 980, 560, 30); g.fill(); g.strokeStyle = 'rgba(255,210,120,0.4)'; g.lineWidth = 3; g.stroke();
    MGH.label(g, `Round ${S.round} / 5 — find the fake!`, 640, 100, 26, '#ffe680');
    for (let k = 0; k < 45; k++) {
      const p = this.cell(S, k), f = k === S.fake;
      let r = 34, col = '#ffd34d';
      if (f && S.kind === 0) r = 34 * (1 - S.delta * 0.6);
      if (f && S.kind === 1) col = '#f0cf5a';
      const gr = g.createRadialGradient(p.x - r * 0.35, p.y - r * 0.35, 3, p.x, p.y, r); gr.addColorStop(0, Char.shade(col, 0.45)); gr.addColorStop(1, Char.shade(col, -0.25));
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(p.x + 3, p.y + 5, r, r * 0.95, 0, 0, 7); g.fill();
      g.fillStyle = gr; g.beginPath(); g.arc(p.x, p.y, r, 0, 7); g.fill();
      g.strokeStyle = '#8a6d1a'; g.lineWidth = 3; g.stroke(); g.strokeStyle = 'rgba(138,109,26,0.5)'; g.lineWidth = 1.5; g.beginPath(); g.arc(p.x, p.y, r * 0.78, 0, 7); g.stroke();
      g.fillStyle = '#b8901a'; g.font = 'bold 26px Georgia'; g.textAlign = 'center';
      g.save(); g.translate(p.x, p.y + 9); if (f && S.kind === 2) g.rotate(0.35); g.fillText('★', 0, 0); g.restore();
      if ((m.t * 0.7 + k * 0.13) % 3 < 0.1) MGH.glow(g, p.x - 10, p.y - 10, 20, 'rgba(255,255,255,0.8)');
      if (S.pause > 0 && f) { g.strokeStyle = '#fff'; g.lineWidth = 6; g.beginPath(); g.arc(p.x, p.y, 44 + Math.sin(m.t * 10) * 3, 0, 7); g.stroke(); }
    }
    // markers: a ring in each player's colour (stacked when several sit on the same coin)
    for (let i = 0; i < 4; i++) {
      const p = this.cell(S, S.sel[i]), same = [0, 1, 2, 3].filter(j => j < i && S.sel[j] === S.sel[i]).length, rr = 40 + same * 6;
      g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 7; g.beginPath(); g.arc(p.x, p.y, rr, 0, 7); g.stroke();
      g.strokeStyle = m.players[i].color; g.lineWidth = 4; g.beginPath(); g.arc(p.x, p.y, rr, 0, 7); g.stroke();
      const ang = -Math.PI * 0.75 + i * Math.PI / 2; MGH.av(g, m, i, p.x + Math.cos(ang) * (rr + 8), p.y + Math.sin(ang) * (rr + 8), 11, S.pause > 0 && S.found === i ? 'cheer' : S.lock[i] > 0 ? 'hurt' : 'determined', { headOnly: true });
    }
    if (S.found >= 0 && S.pause > 0) MGH.label(g, `${m.players[S.found].name} found it!`, 640, 700, 28, m.players[S.found].color);
  },
});
MGH.cursors = (m, g, moods) => {
  m.players.forEach((p, i) => {
    const c = m.cur[i];
    Char.draw(g, c.x + 28, c.y + 30, 16, p.el.id, p.color, { mood: MGH.persona((moods && moods[i]) || 'determined', p.el.id), seed: i * 1.7, look: { x: -0.7, y: -0.7 }, noFeet: true });
    g.strokeStyle = '#000'; g.lineWidth = 4; g.beginPath(); g.arc(c.x, c.y, 12, 0, 7); g.stroke();
    g.strokeStyle = p.color; g.lineWidth = 3; g.beginPath(); g.arc(c.x, c.y, 12, 0, 7); g.moveTo(c.x - 18, c.y); g.lineTo(c.x + 18, c.y); g.moveTo(c.x, c.y - 18); g.lineTo(c.x, c.y + 18); g.stroke();
    MGH.text(g, String(i + 1), c.x + 16, c.y - 14, 14, p.color, 'left', 'bold');
  });
};

// 23 ---------------------------------------------------------------- Constellation Trace
MG.def({
  id: 'constellation', name: 'Constellation Trace', type: 'Memory', controls: 'Move + A',
  how: 'A star pattern flashes for 3 seconds, then hides. Your marker sits on a star: push a direction to hop to the next star that way, and press A to link the star you are on. Link them in order to redraw the pattern — but the night sky slowly TURNS while you trace, so remember the shape, not the spot! Three patterns, each sky turns faster.',
  wins: 'Most stars correct.',
  init(m, S) { S.pts = [0, 0, 0, 0]; S.time = [0, 0, 0, 0]; S.round = 0; this.next(S); },
  next(S) {
    S.round++; S.stars = [];
    while (S.stars.length < 14) { const s = { x: R.range(160, 1120), y: R.range(130, 620) }; if (S.stars.every(o => dist(o.x, o.y, s.x, s.y) > 95)) S.stars.push(s); }
    S.pat = R.shuffle([...S.stars.keys()]).slice(0, 4 + S.round);
    S.prog = [0, 0, 0, 0]; S.out = [false, false, false, false]; S.phase = 'show'; S.t = 0;
    S.botMem = [0, 1, 2, 3].map(() => S.pat.map(k => Math.random() < 0.88 ? k : R.int(0, 13)));
    S.botWait = [0, 0, 0, 0];
    // everyone's marker starts on the star nearest the middle
    let c = 0, bd = 1e9; S.stars.forEach((s, k) => { const d = dist(s.x, s.y, 640, 375); if (d < bd) { bd = d; c = k; } });
    S.on = [c, c, c, c]; S.hopT = [0, 0, 0, 0]; S.held = [false, false, false, false]; S.hopFx = [0, 0, 0, 0];
  },
  // the nearest star roughly in the pushed direction
  hop(S, from, ax, ay) {
    const a = Math.atan2(ay, ax), s0 = S.stars[from]; let best = -1, bs = 1e9;
    S.stars.forEach((s, k) => { if (k === from) return; const dx = s.x - s0.x, dy = s.y - s0.y, d = Math.hypot(dx, dy); let da = Math.abs(Math.atan2(dy, dx) - a); if (da > Math.PI) da = Math.PI * 2 - da; if (da > 0.8) return; const sc = d * (1 + da * 1.6); if (sc < bs) { bs = sc; best = k; } });
    return best;
  },
  steer(m, S, i, dt) {
    S.hopT[i] -= dt; S.hopFx[i] = Math.max(0, S.hopFx[i] - dt * 5);
    const a = m.axis(i), mag = Math.hypot(a.x, a.y);
    if (mag < 0.35) { S.held[i] = false; return; }
    if (mag > 0.55 && (!S.held[i] || S.hopT[i] <= 0)) { const k = this.hop(S, S.on[i], a.x, a.y); if (k >= 0) { S.on[i] = k; S.hopFx[i] = 1; if (!m.bot(i)) Sfx.tone(520, 0.04, 'triangle', 0.04); } S.hopT[i] = S.held[i] ? 0.22 : 0.4; S.held[i] = true; }
  },
  update(m, S, dt) {
    S.t += dt;
    if (S.phase === 'show') { if (S.t > 3.6) { S.phase = 'go'; S.t = 0; Sfx.tone(880, 0.1, 'square', 0.05); Sfx.tone(1320, 0.2, 'square', 0.05, 0, 0.1); } return; }
    if (S.phase === 'go') { if (S.t > 0.7) { S.phase = 'trace'; S.t = 0; } return; }
    if (S.phase === 'trace') {
      // the sky wheels around its centre (direction alternates each pattern)
      const w = (0.05 + S.round * 0.03) * (S.round % 2 ? 1 : -1) * dt, cw = Math.cos(w), sw = Math.sin(w);
      for (const s of S.stars) { const dx = s.x - 640, dy = s.y - 375; s.x = 640 + dx * cw - dy * sw; s.y = 375 + dx * sw + dy * cw; }
      for (let i = 0; i < 4; i++) {
        if (S.out[i] || S.prog[i] >= S.pat.length) continue;
        this.steer(m, S, i, dt);
        if (!m.pressed(i, 'a')) continue;
        const k = S.on[i];
        if (S.pat.slice(0, S.prog[i]).includes(k) && k !== S.pat[S.prog[i]]) continue; // already linked: no harm
        if (k === S.pat[S.prog[i]]) { S.prog[i]++; S.pts[i]++; MGH.burst(S.stars[k].x, S.stars[k].y, [m.players[i].color, '#fff'], 10, { speed: 160, kind: 'spark', size: 2 }); if (!m.bot(i)) Sfx.tone(700 + S.prog[i] * 80, 0.08, 'triangle', 0.05); if (S.prog[i] >= S.pat.length) S.time[i] += S.t; }
        else if (!S.pat.slice(0, S.prog[i]).includes(k)) { S.out[i] = true; S.time[i] += S.t; if (!m.bot(i)) Sfx.bad(); }
      }
      if (S.t > 28 || S.prog.every((p, i) => S.out[i] || p >= S.pat.length)) { S.phase = 'reveal'; S.t = 0; }
      return;
    }
    if (S.phase === 'reveal' && S.t > 1.8) { if (S.round >= 3) m.finish(this.score(m, S)); else this.next(S); }
  },
  bot(m, S, i, dt) {
    const v = m.vin[i]; v.a = false;
    if (S.phase !== 'trace' || S.out[i] || S.prog[i] >= S.pat.length) return;
    const tk = S.botMem[i][S.prog[i]], s = S.stars[tk], o = S.stars[S.on[i]];
    v.ax = v.ay = 0; v.left = v.right = v.up = v.down = false;
    S.botWait[i] += dt;
    if (S.on[i] === tk) { if (S.botWait[i] > 0.3) { v.a = true; S.botWait[i] = 0; } return; }
    // tap toward the target star, one hop at a time
    if (S.hopFx[i] > 0.9) S.botWait[i] = 0; // just hopped: let go of the stick for a moment
    else if (S.botWait[i] > 0.26) { const d = Math.hypot(s.x - o.x, s.y - o.y) || 1; v.ax = (s.x - o.x) / d; v.ay = (s.y - o.y) / d; }
  },
  score(m, S) { return S.pts.map((p, i) => p * 100 - S.time[i]); },
  fmt(s) { return `${Math.round(s / 100)} stars`; },
  hud(m, S, i) { return S.pts[i]; },
  draw(m, S, g) {
    MGH.scene(g, 'space', m.t);
    if (S.phase === 'show') MGH.phase(g, true, m.t, `Memorise the pattern — ${(3.6 - S.t).toFixed(1)}s`);
    else if (S.phase === 'go') MGH.label(g, 'GO! Hop with the stick, link with A', 640, 100, 34, '#ffe680', 'rgba(120,70,0,0.85)');
    else if (S.phase === 'trace') MGH.phase(g, false, m.t, `Pattern ${S.round}/3 — hop to a star, press A to link it`);
    if (S.phase === 'show' || S.phase === 'reveal') {
      const n = S.phase === 'show' ? Math.min(S.pat.length, Math.floor(S.t / 0.35) + 1) : S.pat.length;
      g.strokeStyle = 'rgba(160,210,255,0.85)'; g.lineWidth = 4; g.shadowColor = '#8fd0ff'; g.shadowBlur = 12; g.beginPath();
      S.pat.slice(0, n).forEach((k, j) => { const s = S.stars[k]; if (j) g.lineTo(s.x, s.y); else g.moveTo(s.x, s.y); }); g.stroke(); g.shadowBlur = 0;
      S.pat.slice(0, n).forEach((k, j) => MGH.label(g, String(j + 1), S.stars[k].x + 22, S.stars[k].y - 18, 16, '#9fd8ff'));
    }
    S.stars.forEach((s, k) => { MGH.glow(g, s.x, s.y, 40, 'rgba(200,230,255,0.35)'); g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = 1.5; g.beginPath(); g.arc(s.x, s.y, 46, 0, 7); g.stroke(); MGH.star(g, s.x, s.y, 11 + Math.sin(m.t * 3 + k) * 1.5, '#ffffff', m.t * 0.5 + k, false); });
    if (S.phase === 'trace' || S.phase === 'go') for (let i = 0; i < 4; i++) {
      g.strokeStyle = m.players[i].color; g.lineWidth = 3; g.globalAlpha = 0.75; g.beginPath();
      for (let j = 0; j < S.prog[i]; j++) { const s = S.stars[S.pat[j]]; if (j) g.lineTo(s.x + i * 2, s.y + i * 2); else g.moveTo(s.x + i * 2, s.y + i * 2); }
      g.stroke(); g.globalAlpha = 1;
      MGH.text(g, `${m.players[i].name}: ${S.prog[i]}/${S.pat.length}${S.out[i] ? ' ✖' : ''}`, 160 + i * 320, 700, 20, m.players[i].color, 'center', 'bold');
    }
    // markers: a ring in each player's colour around the star they sit on (shared stars stack the rings)
    if (S.phase === 'trace' || S.phase === 'go') for (let i = 0; i < 4; i++) {
      if (S.out[i]) continue;
      const s = S.stars[S.on[i]], same = [0, 1, 2, 3].filter(j => j < i && !S.out[j] && S.on[j] === S.on[i]).length, r = 22 + same * 7 + S.hopFx[i] * 8;
      g.strokeStyle = m.players[i].color; g.lineWidth = 4; g.beginPath(); g.arc(s.x, s.y, r, 0, 7); g.stroke();
      const ang = -Math.PI / 2 + i * Math.PI / 2; MGH.av(g, m, i, s.x + Math.cos(ang) * (r + 18), s.y + Math.sin(ang) * (r + 18), 12, S.prog[i] >= S.pat.length ? 'cheer' : 'determined', { headOnly: true });
    }
  },
});

// 25 ---------------------------------------------------------------- Highest Unique (secret ABXY picks)
const ABXY_POS = [[640, 220], [860, 380], [640, 540], [420, 380]], ABXY_KEY = [['Y', '#e8b82e'], ['B', '#e8453c'], ['A', '#3fc35a'], ['X', '#3f8ee8']];
const abxyPress = (m, i) => m.pressed(i, 'y') || m.pressed(i, 'up') ? 0 : m.pressed(i, 'b') || m.pressed(i, 'right') ? 1 : m.pressed(i, 'a') || m.pressed(i, 'down') ? 2 : m.pressed(i, 'x') || m.pressed(i, 'left') ? 3 : -1;
const abxyBot = (m, i, d) => { const v = m.vin[i]; ['a', 'b', 'x', 'y'].forEach(k => { v[k] = false; }); if (d >= 0) v[['y', 'b', 'a', 'x'][d]] = true; };
const abxyBadge = (g, d, x, y, r = 22) => { g.fillStyle = ABXY_KEY[d][1]; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 3; g.stroke(); MGH.text(g, ABXY_KEY[d][0], x, y + r * 0.36, r * 1.1, '#fff', 'center', 'bold'); };
MG.def({
  id: 'lowest', name: 'Highest Unique', type: 'Bluff', controls: 'A B X Y', dur: 0, noPadSkip: true,
  rows: [['abxy', 'Secretly pick a number']],
  how: 'Four numbers sit on the buttons: Y = 4, B = 3, X = 2, A = 1. Everyone secretly presses one. The HIGHEST number that nobody else picked scores its value — pick 4 and someone copies you, you both get nothing! Six rounds.',
  wins: 'Most points after six rounds.',
  VAL: [4, 3, 1, 2],
  init(m, S) { S.pts = [0, 0, 0, 0]; S.round = 0; S.hist = [[], [], [], []]; this.next(S); },
  next(S) { S.round++; S.pick = [-1, -1, -1, -1]; S.phase = 'pick'; S.pt = 0; S.win = -1; S.bAt = [0, 1, 2, 3].map(() => R.range(0.8, 3.2)); },
  update(m, S, dt) {
    S.pt += dt;
    if (S.phase === 'pick') {
      m.players.forEach((p, i) => { if (S.pick[i] >= 0) return; const d = abxyPress(m, i); if (d >= 0) { S.pick[i] = d; Sfx.click(); } });
      if (S.pick.every(p => p >= 0) || S.pt > 8) {
        S.pick = S.pick.map(p => p >= 0 ? p : R.int(0, 3)); S.phase = 'reveal'; S.pt = 0; Sfx.drum(0);
        const vals = S.pick.map(d => this.VAL[d]);
        for (const v of [4, 3, 2, 1]) { const who = vals.map((x, i) => x === v ? i : -1).filter(i => i >= 0); if (who.length === 1) { S.win = who[0]; S.pts[S.win] += v; break; } }
        vals.forEach((v, i) => S.hist[i].push(v));
        if (S.win >= 0) Sfx.coin(); else Sfx.bad();
      }
    } else if (S.pt > 3) { if (S.round >= 6) m.finish(this.score(m, S)); else this.next(S); }
  },
  bot(m, S, i) {
    if (S.phase !== 'pick' || S.pick[i] >= 0 || S.pt < S.bAt[i]) { abxyBot(m, i, -1); return; }
    const v = R.weighted([4, 3, 2, 1], k => [2.2, 3, 2.4, 1.6][4 - k]);
    abxyBot(m, i, this.VAL.indexOf(v));
  },
  score(m, S) { return S.pts.slice(); },
  fmt(s) { return `${s} pts`; },
  hud(m, S, i) { return `${S.pts[i]} pts` + (S.phase === 'pick' && S.pick[i] >= 0 ? ' ✔' : ''); },
  draw(m, S, g) {
    MGH.scene(g, 'night', m.t);
    MGH.label(g, `Round ${S.round} of 6 — the highest number nobody else picked scores`, 640, 100, 22, '#dde');
    ABXY_POS.forEach(([x, y], d) => {
      const v = this.VAL[d];
      g.fillStyle = 'rgba(0,0,0,0.45)'; g.beginPath(); g.arc(x, y, 66, 0, 7); g.fill();
      g.fillStyle = MGH.grad(g, y - 58, y + 58, ['#ffe680', '#e8a83a']); g.beginPath(); g.arc(x, y, 58, 0, 7); g.fill();
      MGH.text(g, String(v), x, y + 22, 64, '#5a3a10', 'center', 'bold');
      abxyBadge(g, d, x + 50, y - 50, 18);
      if (S.phase === 'reveal') { const who = [0, 1, 2, 3].filter(i => S.pick[i] === d); who.forEach((i, k) => { Char.draw(g, x + (k - (who.length - 1) / 2) * 46, y + 100, 18, m.players[i].el.id, m.players[i].color, { mood: i === S.win ? 'cheer' : who.length > 1 ? 'shock' : 'sad', seed: i * 1.7 }); }); if (who.length > 1) MGH.text(g, 'CLASH!', x, y - 74, 20, '#ff6b6b', 'center', 'bold'); }
    });
    m.players.forEach((p, i) => {
      const x = 110 + (i % 2) * 1060, y = 220 + Math.floor(i / 2) * 300;
      Char.draw(g, x, y, 40, p.el.id, p.color, { mood: S.phase === 'pick' ? (S.pick[i] >= 0 ? 'smug' : 'nervous') : i === S.win ? 'cheer' : 'determined', seed: i * 1.7, look: { x: x < 640 ? 1 : -1, y: 0 } });
      MGH.text(g, `${p.name}  ${S.pts[i]}`, x, y + 80, 20, p.color, 'center', 'bold');
      if (S.phase === 'pick') MGH.text(g, S.pick[i] >= 0 ? '✔ picked' : 'choosing…', x, y - 76, 16, S.pick[i] >= 0 ? '#7f7' : '#ddd', 'center', 'bold');
      MGH.text(g, S.hist[i].join(' · '), x, y + 104, 14, 'rgba(255,255,255,0.6)', 'center');
    });
    if (S.phase === 'reveal') MGH.label(g, S.win >= 0 ? `${m.players[S.win].name} scores ${this.VAL[S.pick[S.win]]}!` : 'Nobody was unique!', 640, 690, 28, S.win >= 0 ? m.players[S.win].color : '#fff');
    else MGH.text(g, `${Math.max(0, 8 - S.pt).toFixed(0)}s`, 640, 690, 22, '#fff', 'center', 'bold');
  },
});

// 28 ---------------------------------------------------------------- Standoff (secret ABXY picks)
MG.def({
  id: 'standoff', name: 'Standoff', type: 'Bluff', controls: 'A B X Y', dur: 0, noPadSkip: true,
  rows: [['abxy', 'Y reload · A block · X shoot · B big blast']],
  how: 'Everyone secretly presses a button. Y = RELOAD (+1 ammo). A = BLOCK (not three times in a row). X = SHOOT (1 ammo): it knocks out everyone who is RELOADING. B = BIG BLAST (3 ammo): it knocks out everyone who isn\'t blasting too — even blockers! A shot with no ammo just clicks.',
  wins: 'Last one standing.',
  init(m, S) { S.alive = [true, true, true, true]; S.ammo = [0, 0, 0, 0]; S.blocks = [0, 0, 0, 0]; S.round = 0; S.outR = [0, 0, 0, 0]; S.ch = []; this.start(S); },
  start(S) { S.round++; S.pick = S.alive.map(a => a ? -1 : 9); S.t = 0; S.phase = 'pick'; S.bAt = [0, 1, 2, 3].map(() => R.range(0.8, 3)); S.log = []; },
  NAMES: ['reload', 'blast', 'block', 'shoot'],
  update(m, S, dt) {
    S.t += dt;
    if (S.phase === 'pick') {
      m.players.forEach((p, i) => { if (S.pick[i] !== -1) return; const d = abxyPress(m, i); if (d >= 0) { S.pick[i] = d; Sfx.click(); } });
      if (S.pick.every(p => p !== -1) || S.t > 10) {
        const act = S.pick.map((d, i) => { if (!S.alive[i]) return null; let a = d < 0 ? 'reload' : this.NAMES[d]; if (a === 'block' && S.blocks[i] >= 2) a = 'fumble'; if (a === 'shoot' && S.ammo[i] < 1) a = 'click'; if (a === 'blast' && S.ammo[i] < 3) a = 'click'; return a; });
        S.ch = act;
        const out = [false, false, false, false], shoot = act.some(a => a === 'shoot'), blast = act.some(a => a === 'blast');
        act.forEach((a, i) => {
          if (!a) return;
          if (a === 'reload') { S.ammo[i] = Math.min(3, S.ammo[i] + 1); S.log.push(`${m.players[i].name} reloads`); }
          if (a === 'shoot') { S.ammo[i]--; S.log.push(`${m.players[i].name} shoots!`); }
          if (a === 'blast') { S.ammo[i] -= 3; S.log.push(`${m.players[i].name} BIG BLAST!`); }
          if (a === 'block') S.log.push(`${m.players[i].name} blocks`);
          if (a === 'click') S.log.push(`${m.players[i].name}: click… no ammo!`);
          if (a === 'fumble') S.log.push(`${m.players[i].name} is too tired to block`);
          S.blocks[i] = a === 'block' ? S.blocks[i] + 1 : 0;
        });
        act.forEach((a, i) => {
          if (!a) return;
          if (blast && a !== 'blast' && act.some((b, j) => j !== i && b === 'blast')) out[i] = true;
          else if (shoot && (a === 'reload' || a === 'click' || a === 'fumble') && act.some((b, j) => j !== i && b === 'shoot')) out[i] = true;
        });
        out.forEach((o, i) => { if (o && S.alive[i]) { MGH.burst(160 + i * 320, 220, ['#ff4d6d', '#fff', '#ffd34d'], 34, { speed: 380 }); MGH.shake(12); S.alive[i] = false; S.outR[i] = S.round; S.log.push(`💥 ${m.players[i].name} is out`); Sfx.boom(); } });
        S.phase = 'reveal'; S.t = 0;
      }
    } else if (S.t > 3) {
      if (S.alive.filter(a => a).length <= 1 || S.round >= 12) m.finish(this.score(m, S)); else this.start(S);
    }
  },
  bot(m, S, i) {
    if (S.phase !== 'pick' || S.pick[i] !== -1 || S.t < S.bAt[i]) { abxyBot(m, i, -1); return; }
    const rivalsAmmo = S.ammo.filter((a, j) => j !== i && S.alive[j]), threat = rivalsAmmo.some(a => a > 0), big = rivalsAmmo.some(a => a >= 3);
    let a;
    if (S.ammo[i] >= 3 && Math.random() < 0.6) a = 'blast';
    else if (S.ammo[i] > 0 && Math.random() < 0.4) a = 'shoot';
    else if ((threat || big) && S.blocks[i] < 2 && Math.random() < (big ? 0.4 : 0.55)) a = 'block';
    else a = 'reload';
    abxyBot(m, i, this.NAMES.indexOf(a));
  },
  score(m, S) { return S.alive.map((a, i) => a ? 100 : S.outR[i]); },
  fmt(s) { return s >= 100 ? 'Survived' : `out in round ${s}`; },
  hud(m, S, i) { return S.alive[i] ? `ammo ${S.ammo[i]}` : 'out'; },
  draw(m, S, g) {
    MGH.scene(g, 'desert', m.t);
    g.fillStyle = 'rgba(80,40,10,0.35)'; g.fillRect(0, 300, 1280, 420);
    MGH.emoji(g, '🌵', 60, 600, 70); MGH.emoji(g, '🌵', 1220, 560, 60);
    const tw = (m.t * 60) % 1500 - 100; MGH.emoji(g, '🌾', tw, 650, 30, m.t * 6);
    MGH.label(g, `Round ${S.round}`, 640, 90, 24, '#fff');
    const ICON = { reload: '🔄 Reload', block: '🛡️ Block', shoot: '💦 Shoot', blast: '💥 BIG BLAST', click: '…click', fumble: '😩 tired' };
    for (let i = 0; i < 4; i++) {
      const x = 160 + i * 320, p = m.players[i];
      MGH.shadow(g, x, 290, 44, 0.35);
      MGH.av(g, m, i, x, 248, 30, !S.alive[i] ? 'out' : (S.phase === 'reveal' ? 'scared' : S.ammo[i] > 0 ? 'smug' : 'determined'));
      MGH.text(g, p.name, x, 314, 20, p.color, 'center', 'bold');
      if (S.phase === 'reveal' && S.ch[i]) MGH.label(g, ICON[S.ch[i]], x, 160, 22, '#ffe680');
      for (let k = 0; k < 3; k++) { g.fillStyle = k < S.ammo[i] ? '#5ac8ff' : 'rgba(255,255,255,0.15)'; MGH.rr(g, x - 30 + k * 22, 322, 14, 20, 5); g.fill(); }
      if (S.blocks[i] >= 2 && S.alive[i]) MGH.text(g, 'can\'t block', x, 364, 14, '#ffb13d', 'center', 'bold');
      if (S.phase === 'pick' && S.alive[i]) MGH.text(g, S.pick[i] >= 0 ? '✔ ready' : 'choosing…', x, 392, 16, S.pick[i] >= 0 ? '#7f7' : '#ddd', 'center', 'bold');
    }
    if (S.phase === 'reveal') S.log.forEach((l, k) => MGH.label(g, l, 640, 440 + k * 36, 20, '#ffe680'));
    else {
      // the button legend (same for everyone)
      [[0, 'Reload'], [3, 'Shoot (1)'], [2, 'Block'], [1, 'Big blast (3)']].forEach(([d, l], k) => { const x = 250 + k * 260; abxyBadge(g, d, x - 70, 560, 20); MGH.text(g, l, x + 10, 568, 20, '#fff', 'center', 'bold'); });
      MGH.text(g, `${Math.max(0, 10 - S.t).toFixed(0)}s`, 640, 640, 22, '#fff', 'center', 'bold');
    }
  },
});
