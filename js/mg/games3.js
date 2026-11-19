'use strict';
// Moot minigames 21-30

// shared helper for secret-pick rounds
const PickR = {
  start(S, n, time, startIdx = 0) {
    S.P = [0, 1, 2, 3].map(() => ({ idx: startIdx, locked: false }));
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
  how: 'A coin is hidden in one of three chests, which then shuffle. Pick where it ended. Five rounds, faster each time.',
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
    } else if (S.phase === 'reveal' && S.t > 1.6) { if (S.round >= 5) m.finish(this.score(m, S)); else this.next(S); }
  },
  score(m, S) { return S.pts.map((p, i) => p * 100 - S.ttot[i]); },
  fmt(s) { return `${Math.round(s / 100)} correct`; },
  hud(m, S, i) { return S.pts[i]; },
  slotX(k) { return 360 + k * 280; },
  draw(m, S, g) {
    MGH.scene(g, 'cave', m.t);
    g.fillStyle = MGH.grad(g, 440, 720, ['#5a3a20', '#2a1a0c']); g.fillRect(0, 470, 1280, 250);
    MGH.label(g, `Round ${S.round} / 5`, 110, 92, 20, '#eee');
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
  id: 'counterfeit', name: 'Spot the Counterfeit', type: 'Search', controls: 'Cursor', cursor: true,
  how: 'A grid of coins with one subtle fake. The first to click it scores. A wrong click costs a point. Six rounds.',
  wins: 'Most points.',
  init(m, S) { S.pts = [0, 0, 0, 0]; S.round = 0; this.next(S); },
  next(S) {
    S.round++; S.cols = 9; S.rows = 5; S.fake = R.int(0, 44); S.t = 0; S.lock = [0, 0, 0, 0]; S.found = -1; S.pause = 0;
    S.kind = R.int(0, 2); S.delta = 0.14 - S.round * 0.012;
    S.botT = [0, 1, 2, 3].map(() => R.range(2, 7)); S.botTarget = [0, 1, 2, 3].map(() => Math.random() < 0.8 ? S.fake : R.int(0, 44));
  },
  cell(S, k) { return { x: 200 + (k % S.cols) * 110, y: 170 + Math.floor(k / S.cols) * 100 }; },
  update(m, S, dt) {
    if (S.pause > 0) { S.pause -= dt; if (S.pause <= 0) { if (S.round >= 6) m.finish(S.pts.slice()); else this.next(S); } return; }
    S.t += dt;
    for (let i = 0; i < 4; i++) {
      S.lock[i] -= dt;
      if (S.lock[i] > 0 || !m.pressed(i, 'a')) continue;
      const c = m.cur[i];
      for (let k = 0; k < 45; k++) {
        const p = this.cell(S, k);
        if (dist(c.x, c.y, p.x, p.y) < 40) {
          if (k === S.fake) { S.pts[i]++; S.found = i; S.pause = 1.5; Sfx.coin(); MGH.burst(p.x, p.y, ['#ffe680', '#fff', m.players[i].color], 30, { speed: 300, kind: 'spark', size: 3 }); MGH.ring(p.x, p.y, '#ffe680', 30, 90); }
          else { S.pts[i]--; S.lock[i] = 1; MGH.pop('−1', p.x, p.y - 20, '#ff6b6b', 26); if (!m.bot(i)) Sfx.bad(); }
          break;
        }
      }
      if (S.pause > 0) break;
    }
    if (S.t > 12 && S.pause <= 0) { S.pause = 1.2; }
  },
  bot(m, S, i, dt) {
    const v = m.vin[i]; v.a = false;
    if (S.pause > 0 || S.t < S.botT[i] - 1.2) return;
    const p = this.cell(S, S.botTarget[i]);
    if (m.botCursor(i, p.x, p.y, 500) && S.t >= S.botT[i] && S.lock[i] <= 0) { v.a = true; S.botT[i] = S.t + R.range(1.5, 3); S.botTarget[i] = Math.random() < 0.7 ? S.fake : R.int(0, 44); }
  },
  score(m, S) { return S.pts.slice(); },
  hud(m, S, i) { return S.pts[i]; },
  draw(m, S, g) {
    MGH.scene(g, 'temple', m.t);
    g.fillStyle = 'rgba(40,20,10,0.6)'; MGH.rr(g, 150, 130, 980, 560, 30); g.fill(); g.strokeStyle = 'rgba(255,210,120,0.4)'; g.lineWidth = 3; g.stroke();
    MGH.label(g, `Round ${S.round} / 6 — find the fake!`, 640, 100, 26, '#ffe680');
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
    MGH.cursors(m, g, [0, 1, 2, 3].map(i => S.pause > 0 && S.found === i ? 'cheer' : S.lock[i] > 0 ? 'hurt' : 'determined'));
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
  id: 'constellation', name: 'Constellation Trace', type: 'Memory', controls: 'Cursor', cursor: true,
  how: 'A star pattern flashes for 3 seconds, then hides. Click the stars in order to redraw it. Three patterns.',
  wins: 'Most stars correct.',
  init(m, S) { S.pts = [0, 0, 0, 0]; S.time = [0, 0, 0, 0]; S.round = 0; this.next(S); },
  next(S) {
    S.round++; S.stars = [];
    while (S.stars.length < 14) { const s = { x: R.range(160, 1120), y: R.range(130, 620) }; if (S.stars.every(o => dist(o.x, o.y, s.x, s.y) > 95)) S.stars.push(s); }
    S.pat = R.shuffle([...S.stars.keys()]).slice(0, 4 + S.round);
    S.prog = [0, 0, 0, 0]; S.out = [false, false, false, false]; S.phase = 'show'; S.t = 0;
    S.botMem = [0, 1, 2, 3].map(() => S.pat.map(k => Math.random() < 0.88 ? k : R.int(0, 13)));
    S.botWait = [0, 0, 0, 0];
  },
  update(m, S, dt) {
    S.t += dt;
    if (S.phase === 'show') { if (S.t > 3.6) { S.phase = 'go'; S.t = 0; Sfx.tone(880, 0.1, 'square', 0.05); Sfx.tone(1320, 0.2, 'square', 0.05, 0, 0.1); } return; }
    if (S.phase === 'go') { if (S.t > 0.7) { S.phase = 'trace'; S.t = 0; } return; }
    if (S.phase === 'trace') {
      for (let i = 0; i < 4; i++) {
        if (S.out[i] || S.prog[i] >= S.pat.length || !m.pressed(i, 'a')) continue;
        const c = m.cur[i];
        // forgiving: the nearest star within a generous radius counts
        let k = -1, bd = 58; S.stars.forEach((s, j) => { const d = dist(s.x, s.y, c.x, c.y); if (d < bd) { bd = d; k = j; } });
        if (k < 0) continue;
        if (k === S.pat[S.prog[i]]) { S.prog[i]++; S.pts[i]++; MGH.burst(S.stars[k].x, S.stars[k].y, [m.players[i].color, '#fff'], 10, { speed: 160, kind: 'spark', size: 2 }); if (!m.bot(i)) Sfx.tone(700 + S.prog[i] * 80, 0.08, 'triangle', 0.05); if (S.prog[i] >= S.pat.length) S.time[i] += S.t; }
        else if (!S.pat.slice(0, S.prog[i]).includes(k)) { S.out[i] = true; S.time[i] += S.t; if (!m.bot(i)) Sfx.bad(); }
      }
      if (S.t > 14 || S.prog.every((p, i) => S.out[i] || p >= S.pat.length)) { S.phase = 'reveal'; S.t = 0; }
      return;
    }
    if (S.phase === 'reveal' && S.t > 1.8) { if (S.round >= 3) m.finish(this.score(m, S)); else this.next(S); }
  },
  bot(m, S, i, dt) {
    const v = m.vin[i]; v.a = false;
    if (S.phase !== 'trace' || S.out[i] || S.prog[i] >= S.pat.length) return;
    const s = S.stars[S.botMem[i][S.prog[i]]];
    if (m.botCursor(i, s.x, s.y, 520)) { S.botWait[i] += dt; if (S.botWait[i] > 0.15) { v.a = true; S.botWait[i] = 0; } }
  },
  score(m, S) { return S.pts.map((p, i) => p * 100 - S.time[i]); },
  fmt(s) { return `${Math.round(s / 100)} stars`; },
  hud(m, S, i) { return S.pts[i]; },
  draw(m, S, g) {
    MGH.scene(g, 'space', m.t);
    if (S.phase === 'show') MGH.phase(g, true, m.t, `Memorise the pattern — ${(3.6 - S.t).toFixed(1)}s`);
    else if (S.phase === 'go') MGH.label(g, 'GO! Click the stars in order', 640, 100, 34, '#ffe680', 'rgba(120,70,0,0.85)');
    else if (S.phase === 'trace') MGH.phase(g, false, m.t, `Pattern ${S.round}/3 — click the stars in order`);
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
    MGH.cursors(m, g, [0, 1, 2, 3].map(i => S.out[i] ? 'hurt' : S.prog[i] >= S.pat.length ? 'cheer' : S.phase === 'show' ? 'neutral' : 'determined'));
  },
});

// 24 ---------------------------------------------------------------- Missing Relic
MG.def({
  id: 'relic', name: 'Missing Relic', type: 'Memory', controls: 'Pick',
  how: 'Eight relics show for 4 seconds, the screen blinks, and one has vanished. Pick it. Five rounds.',
  wins: 'Most correct (tie: faster total).',
  pool: ['🏺', '👑', '🗡️', '💎', '📿', '🔮', '🪔', '🛡️', '🏹', '📜', '🧭', '⚱️', '🪬', '🔔', '🗝️', '🍷'],
  init(m, S) { S.pts = [0, 0, 0, 0]; S.tt = [0, 0, 0, 0]; S.round = 0; this.next(S); },
  next(S) {
    S.round++; S.rel = R.shuffle(this.pool).slice(0, 8); S.miss = R.int(0, 7);
    S.after = R.shuffle(S.rel.filter((x, k) => k !== S.miss)); S.phase = 'show'; S.t = 0;
  },
  update(m, S, dt) {
    S.t += dt;
    if (S.phase === 'show' && S.t > 4 - S.round * 0.35) { S.phase = 'blink'; S.t = 0; }
    else if (S.phase === 'blink' && S.t > 0.5) { PickR.start(S, 8, 7, 0); }
    else if (S.phase === 'pick') {
      if (PickR.update(m, S, dt, 4, () => Math.random() < 0.75 - S.round * 0.05 ? S.miss : R.int(0, 7))) {
        S.mood = [0, 1, 2, 3].map(i => S.P[i].locked && S.P[i].idx === S.miss ? 'cheer' : 'hurt');
        for (let i = 0; i < 4; i++) { if (S.P[i].locked && S.P[i].idx === S.miss) S.pts[i]++; S.tt[i] += S.t; }
        S.phase = 'reveal'; S.t = 0;
      }
    } else if (S.phase === 'reveal' && S.t > 1.8) { if (S.round >= 5) m.finish(this.score(m, S)); else this.next(S); }
  },
  score(m, S) { return S.pts.map((p, i) => p * 100 - S.tt[i]); },
  fmt(s) { return `${Math.round(s / 100)} correct`; },
  hud(m, S, i) { return S.pts[i]; },
  draw(m, S, g) {
    MGH.scene(g, 'temple', m.t);
    MGH.label(g, `Round ${S.round} / 5`, 110, 92, 20, '#eee');
    const pedestal = (x, y, r) => { MGH.glow(g, x, y, 80, 'rgba(255,220,140,0.3)'); g.fillStyle = MGH.grad(g, y + 40, y + 70, ['#c9b48a', '#7a6a4a']); MGH.rr(g, x - 60, y + 40, 120, 26, 6); g.fill(); MGH.emoji(g, r, x, y + Math.sin(m.t * 2 + x) * 4, 74); };
    if (S.phase === 'show') { MGH.phase(g, true, m.t, 'Remember all eight relics!'); S.rel.forEach((r, k) => pedestal(200 + (k % 4) * 290, 260 + Math.floor(k / 4) * 200, r)); }
    else if (S.phase === 'blink') { g.fillStyle = `rgba(255,255,255,${1 - S.t / 0.5})`; g.fillRect(0, 40, 1280, 680); }
    else {
      S.after.forEach((r, k) => MGH.emoji(g, r, 260 + k * 125, 190, 52));
      MGH.label(g, 'Which relic vanished?', 640, 262, 24, '#ffe680');
      PickR.drawOptions(m, S, g, S.rel, 260, 300, 175, 140, 4, S.phase === 'reveal');
      if (S.phase === 'reveal') { const x = 260 + (S.miss % 4) * 187, y = 300 + Math.floor(S.miss / 4) * 152; g.strokeStyle = '#7f7'; g.lineWidth = 6; MGH.rr(g, x, y, 175, 140, 14); g.stroke(); MGH.glow(g, x + 87, y + 70, 120, 'rgba(120,255,140,0.35)'); }
      PickR.drawStatus(m, S, g);
    }
  },
});

// 25 ---------------------------------------------------------------- Lowest Unique
MG.def({
  id: 'lowest', name: 'Lowest Unique', type: 'Bluff', controls: 'Pick',
  how: 'Everyone secretly picks a number from 1 to 10 within 8 seconds. The lowest number nobody else picked wins the round. Three rounds.',
  wins: 'Most rounds.',
  init(m, S) { S.pts = [0, 0, 0, 0]; S.round = 1; S.win = -1; PickR.start(S, 10, 8, 0); },
  update(m, S, dt) {
    if (S.phase === 'pick') {
      if (PickR.update(m, S, dt, 5, () => R.weighted([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], k => [6, 8, 7, 5, 3, 2, 1, 1, 0.5, 0.5][k]))) {
        const picks = S.P.map(p => p.locked ? p.idx : -1);
        S.win = -1;
        for (let v = 0; v < 10; v++) { const who = picks.map((x, i) => x === v ? i : -1).filter(i => i >= 0); if (who.length === 1) { S.win = who[0]; break; } }
        if (S.win >= 0) S.pts[S.win]++;
        S.mood = [0, 1, 2, 3].map(i => i === S.win ? 'cheer' : 'neutral');
        S.phase = 'reveal'; S.t = 0;
      }
    } else { S.t += dt; if (S.t > 2.5) { if (S.round >= 3) m.finish(S.pts.slice()); else { S.round++; PickR.start(S, 10, 8, 0); } } }
  },
  score(m, S) { return S.pts.slice(); },
  hud(m, S, i) { return S.pts[i]; },
  draw(m, S, g) {
    MGH.scene(g, 'night', m.t);
    MGH.label(g, `Round ${S.round} / 3 — lowest number nobody else picked wins`, 640, 140, 22, '#dde');
    PickR.drawOptions(m, S, g, ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'], 240, 200, 150, 120, 5, S.phase === 'reveal');
    if (S.phase === 'reveal') MGH.label(g, S.win >= 0 ? `${m.players[S.win].name} wins with ${S.P[S.win].idx + 1}!` : 'No unique number!', 640, 560, 32, S.win >= 0 ? m.players[S.win].color : '#fff');
    PickR.drawStatus(m, S, g);
  },
});

// 26 ---------------------------------------------------------------- Odd One Out
MG.def({
  id: 'oddone', name: 'Odd One Out', type: 'Bluff', controls: 'Pick',
  how: 'Pick the left or right door. The lone player on a side scores. A 2-2 split scores nothing. Five rounds.',
  wins: 'Most points.',
  init(m, S) { S.pts = [0, 0, 0, 0]; S.round = 1; S.win = -1; PickR.start(S, 2, 5, 0); },
  update(m, S, dt) {
    if (S.phase === 'pick') {
      if (PickR.update(m, S, dt, 2, () => R.int(0, 1))) {
        S.P.forEach(p => { if (!p.locked) { p.idx = R.int(0, 1); p.locked = true; } });
        const left = S.P.map((p, i) => p.idx === 0 ? i : -1).filter(i => i >= 0), right = S.P.map((p, i) => p.idx === 1 ? i : -1).filter(i => i >= 0);
        S.win = left.length === 1 ? left[0] : right.length === 1 ? right[0] : -1;
        if (S.win >= 0) S.pts[S.win]++;
        S.mood = [0, 1, 2, 3].map(i => i === S.win ? 'cheer' : (S.win >= 0 ? 'hurt' : 'neutral'));
        S.phase = 'reveal'; S.t = 0;
      }
    } else { S.t += dt; if (S.t > 2.2) { if (S.round >= 5) m.finish(S.pts.slice()); else { S.round++; PickR.start(S, 2, 5, 0); } } }
  },
  score(m, S) { return S.pts.slice(); },
  hud(m, S, i) { return S.pts[i]; },
  draw(m, S, g) {
    MGH.scene(g, 'dojo', m.t);
    MGH.label(g, `Round ${S.round} / 5 — be the only one through your door`, 640, 140, 22, '#eee');
    for (const [k, x] of [[0, 290], [1, 642]]) { g.fillStyle = MGH.grad(g, 220, 480, ['#7a4a22', '#3a200c']); MGH.rr(g, x + 40, 220, 260, 260, 130); g.fill(); g.fillStyle = '#ffd34d'; g.beginPath(); g.arc(x + (k ? 90 : 250), 360, 9, 0, 7); g.fill(); }
    PickR.drawOptions(m, S, g, ['🚪 Left', 'Right 🚪'], 290, 220, 340, 260, 2, S.phase === 'reveal');
    if (S.phase === 'reveal') MGH.label(g, S.win >= 0 ? `${m.players[S.win].name} is the odd one out!` : 'No lone player — nobody scores.', 640, 580, 30, S.win >= 0 ? m.players[S.win].color : '#fff');
    PickR.drawStatus(m, S, g);
  },
});

// 27 ---------------------------------------------------------------- Two-Thirds
MG.def({
  id: 'twothirds', name: 'Two-Thirds', type: 'Bluff', controls: 'Pick (slider)',
  how: 'Set a slider from 0 to 100. The number closest to two-thirds of the average wins the round. Three rounds.',
  wins: 'Most rounds.',
  init(m, S) { S.pts = [0, 0, 0, 0]; S.round = 1; this.start(S); },
  start(S) { S.v = [50, 50, 50, 50]; S.lock = [false, false, false, false]; S.t = 0; S.phase = 'pick'; S.rep = [0, 0, 0, 0]; S.botV = [0, 1, 2, 3].map(() => Math.round(R.range(12, 45))); S.botAt = [0, 1, 2, 3].map(() => R.range(1, 5)); },
  update(m, S, dt) {
    S.t += dt;
    if (S.phase === 'pick') {
      for (let i = 0; i < 4; i++) {
        if (S.lock[i]) continue;
        if (m.bot(i)) { if (S.t > S.botAt[i]) { S.v[i] = S.botV[i]; S.lock[i] = true; } continue; }
        const dir = (m.held(i, 'right') || m.held(i, 'up') ? 1 : 0) - (m.held(i, 'left') || m.held(i, 'down') ? 1 : 0);
        if (dir) { S.rep[i] += dt; if (m.pressed(i, 'left') || m.pressed(i, 'right') || m.pressed(i, 'up') || m.pressed(i, 'down') || S.rep[i] > 0.3) S.v[i] = clamp(S.v[i] + dir * (S.rep[i] > 0.3 ? 2 : 1), 0, 100); }
        else S.rep[i] = 0;
        if (m.pressed(i, 'a')) { S.lock[i] = true; Sfx.click(); }
      }
      if (S.lock.every(l => l) || S.t > 10) {
        const avg = sum(S.v) / 4; S.target = avg * 2 / 3;
        const d = S.v.map(v => Math.abs(v - S.target)); const best = Math.min(...d);
        S.winners = d.map((x, i) => x === best ? i : -1).filter(i => i >= 0);
        S.winners.forEach(i => S.pts[i]++);
        S.phase = 'reveal'; S.t = 0;
      }
    } else if (S.t > 3) { if (S.round >= 3) m.finish(S.pts.slice()); else { S.round++; this.start(S); } }
  },
  score(m, S) { return S.pts.slice(); },
  hud(m, S, i) { return S.pts[i]; },
  draw(m, S, g) {
    MGH.scene(g, 'space', m.t);
    MGH.label(g, `Round ${S.round} / 3 — get closest to ⅔ of everyone's average`, 640, 110, 22, '#dde');
    for (let i = 0; i < 4; i++) {
      const y = 200 + i * 105, p = m.players[i], show = S.phase === 'reveal' || MGH.peek(m, i);
      g.fillStyle = 'rgba(0,0,0,0.4)'; MGH.rr(g, 236, y - 12, 808, 24, 12); g.fill();
      g.fillStyle = MGH.grad(g, y - 10, y + 10, ['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.08)']); MGH.rr(g, 240, y - 9, 800, 18, 9); g.fill();
      for (let k = 0; k <= 100; k += 10) { g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(240 + k * 8 - 1, y + 10, 2, 8); }
      if (show) { MGH.glow(g, 240 + S.v[i] * 8, y, 30, p.color); MGH.av(g, m, i, 240 + S.v[i] * 8, y - 6, 13, 'determined', { noFeet: true }); }
      MGH.av(g, m, i, 80, y - 4, 22, S.phase === 'reveal' ? (S.winners.includes(i) ? 'cheer' : 'neutral') : (S.lock[i] ? 'happy' : 'determined'));
      MGH.text(g, p.name, 220, y + 7, 20, p.color, 'right', 'bold');
      MGH.label(g, show ? String(S.v[i]) : (S.lock[i] ? '🔒' : '…'), 1100, y + 8, 22, '#fff');
    }
    if (S.phase === 'reveal') {
      const x = 240 + S.target * 8; MGH.glow(g, x, 360, 60, 'rgba(255,230,120,0.4)');
      g.strokeStyle = '#ffe680'; g.lineWidth = 4; g.setLineDash([10, 6]); g.beginPath(); g.moveTo(x, 170); g.lineTo(x, 560); g.stroke(); g.setLineDash([]);
      MGH.label(g, `⅔ of average = ${S.target.toFixed(1)} — ${S.winners.map(i => m.players[i].name).join(' & ')} win${S.winners.length > 1 ? '' : 's'}`, 640, 620, 24, '#ffe680');
    } else { MGH.phase(g, false, m.t); MGH.label(g, `⏱ ${Math.max(0, 10 - S.t).toFixed(1)}`, 1180, 92, 22, '#fff'); MGH.secretHint(g, 690); }
  },
});

// 28 ---------------------------------------------------------------- Standoff
MG.def({
  id: 'standoff', name: 'Standoff', type: 'Bluff', controls: 'Pick',
  how: 'Each round everyone secretly chooses Reload, Block or Shoot (naming a target). Shooting needs ammo from a Reload. A shot player who isn’t blocking is out.',
  wins: 'Last one alive.',
  init(m, S) { S.names = m.players.map(p => p.name); S.chosen = [null, null, null, null]; S.alive = [true, true, true, true]; S.ammo = [0, 0, 0, 0]; S.blocks = [0, 0, 0, 0]; S.round = 0; S.outR = [0, 0, 0, 0]; this.start(S); },
  opts(S, i) {
    const o = [{ k: 'reload', l: '🔄 Reload' }];
    if (S.blocks[i] < 2) o.push({ k: 'block', l: '🛡️ Block' });
    if (S.ammo[i] > 0) for (let j = 0; j < 4; j++) if (j !== i && S.alive[j]) o.push({ k: 'shoot', t: j, l: `🔫 Shoot ${S.names ? S.names[j] : 'P' + (j + 1)}` });
    return o;
  },
  start(S) { S.round++; S.P = [0, 1, 2, 3].map(() => ({ idx: 0, locked: false })); S.t = 0; S.phase = 'pick'; S.botAt = [0, 1, 2, 3].map(() => R.range(0.8, 3)); S.log = []; },
  update(m, S, dt) {
    S.t += dt;
    if (S.phase === 'pick') {
      for (let i = 0; i < 4; i++) {
        if (!S.alive[i]) { S.P[i].locked = true; continue; }
        const o = this.opts(S, i), P = S.P[i];
        if (m.bot(i)) {
          if (!P.locked && S.t > S.botAt[i]) {
            const threat = S.ammo.some((a, j) => j !== i && S.alive[j] && a > 0);
            let pick;
            const shots = o.filter(y => y.k === 'shoot');
            if (S.ammo[i] > 0 && shots.length && Math.random() < 0.6) pick = o.indexOf(R.pick(shots));
            else if (threat && S.blocks[i] < 2 && Math.random() < 0.55) pick = o.findIndex(x => x.k === 'block');
            else pick = 0;
            P.idx = Math.max(0, pick); P.locked = true;
          }
        } else { P.idx = Math.min(P.idx, o.length - 1); MGH.pick(m, i, P, o.length, o.length); }
      }
      if (S.P.every(p => p.locked) || S.t > 8) {
        const ch = S.P.map((P, i) => S.alive[i] ? this.opts(S, i)[P.locked ? P.idx : 0] : null);
        const shot = [false, false, false, false];
        S.chosen = ch.map(c => c ? (c.k === 'reload' ? '🔄' : c.k === 'block' ? '🛡️' : '🔫→' + S.names[c.t]) : null);
        ch.forEach((c, i) => {
          if (!c) return;
          if (c.k === 'reload') { S.ammo[i]++; S.blocks[i] = 0; S.log.push(`${m.players[i].name} reloads`); }
          if (c.k === 'block') { S.blocks[i]++; S.log.push(`${m.players[i].name} blocks`); } else S.blocks[i] = c.k === 'reload' ? 0 : S.blocks[i];
          if (c.k === 'shoot') { S.ammo[i]--; S.blocks[i] = 0; S.log.push(`${m.players[i].name} shoots ${m.players[c.t].name}`); if (!(ch[c.t] && ch[c.t].k === 'block')) shot[c.t] = true; }
        });
        shot.forEach((s, i) => { if (s && S.alive[i]) { MGH.burst(160 + i * 320, 190, ['#ff4d6d', '#fff', '#ffd34d'], 34, { speed: 380 }); MGH.shake(12); S.alive[i] = false; S.outR[i] = S.round; S.log.push(`💀 ${m.players[i].name} is out`); Sfx.boom(); } });
        S.phase = 'reveal'; S.t = 0;
      }
    } else if (S.t > 2.6) {
      if (S.alive.filter(a => a).length <= 1 || S.round >= 12) m.finish(this.score(m, S)); else this.start(S);
    }
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
    for (let i = 0; i < 4; i++) {
      const x = 160 + i * 320, p = m.players[i];
      MGH.shadow(g, x, 290, 44, 0.35);
      MGH.av(g, m, i, x, 248, 30, !S.alive[i] ? 'out' : (S.phase === 'reveal' ? 'scared' : S.ammo[i] > 0 ? 'smug' : 'determined'), { prop: S.alive[i] && S.ammo[i] > 0 ? '🔫' : null });
      MGH.text(g, p.name, x, 314, 20, p.color, 'center', 'bold');
      if (S.phase === 'reveal' && S.chosen[i]) MGH.label(g, S.chosen[i], x, 170, 22, '#ffe680');
      for (let k = 0; k < 3; k++) { g.fillStyle = k < S.ammo[i] ? '#ffd34d' : 'rgba(255,255,255,0.15)'; MGH.rr(g, x - 30 + k * 22, 322, 14, 20, 5); g.fill(); }
      if (S.alive[i] && S.phase === 'pick' && !m.bot(i)) {
        const o = this.opts(S, i);
        o.forEach((op, k) => {
          const y = 352 + k * 46, sel = S.P[i].idx === k && MGH.peek(m, i);
          g.fillStyle = sel ? p.color : 'rgba(0,0,0,0.45)'; MGH.rr(g, x - 125, y, 250, 40, 10); g.fill(); g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 1.5; g.stroke();
          MGH.text(g, op.l, x, y + 27, 18, sel ? '#000' : '#fff', 'center', 'bold');
        });
        if (S.P[i].locked) MGH.emoji(g, '🔒', x + 140, 372, 24);
      }
    }
    if (S.phase === 'reveal') S.log.forEach((l, k) => MGH.label(g, l, 640, 400 + k * 40, 22, '#ffe680'));
    else PickR.drawStatus(m, { P: S.P, phase: 'pick', pickT: 8, t: S.t }, g);
  },
});

// 29 ---------------------------------------------------------------- Sealed Bids
MG.def({
  id: 'bids', name: 'Sealed Bids', type: 'Bluff', controls: 'Pick (sliders)',
  how: 'Three treasures are worth 1, 2 and 3 points. You have 6 tokens: secretly split them between the treasures (up/down picks a treasure, left/right adds or removes a token, the button seals your bids). The single highest bid wins each treasure. Equal bids cancel each other out! Three auctions.',
  wins: 'Most points.',
  init(m, S) { S.pts = [0, 0, 0, 0]; S.round = 1; this.start(S); },
  start(S) {
    S.b = [0, 1, 2, 3].map(() => [0, 0, 0]); S.sel = [0, 0, 0, 0]; S.lock = [false, false, false, false]; S.t = 0; S.phase = 'pick';
    S.botAt = [0, 1, 2, 3].map(() => R.range(1, 5));
  },
  update(m, S, dt) {
    S.t += dt;
    if (S.phase === 'pick') {
      for (let i = 0; i < 4; i++) {
        if (S.lock[i]) continue;
        const b = S.b[i];
        if (m.bot(i)) {
          if (S.t > S.botAt[i]) { const w = [R.range(0.2, 1), R.range(0.5, 1.5), R.range(0.6, 2)]; let left = 6; for (let k = 2; k >= 0; k--) { const n = k ? Math.min(left, Math.round(6 * w[k] / sum(w))) : left; b[k] = n; left -= n; } S.lock[i] = true; }
          continue;
        }
        if (m.pressed(i, 'up')) S.sel[i] = (S.sel[i] + 2) % 3;
        if (m.pressed(i, 'down')) S.sel[i] = (S.sel[i] + 1) % 3;
        if (m.pressed(i, 'right') && sum(b) < 6) b[S.sel[i]]++;
        if (m.pressed(i, 'left') && b[S.sel[i]] > 0) b[S.sel[i]]--;
        if (m.pressed(i, 'a')) { S.lock[i] = true; Sfx.click(); }
      }
      if (S.lock.every(l => l) || S.t > 15) {
        S.res = [0, 1, 2].map(k => {
          const bids = S.b.map((b, i) => ({ i, v: b[k] })).filter(x => x.v > 0);
          const vals = {}; bids.forEach(x => { vals[x.v] = (vals[x.v] || 0) + 1; });
          const uniq = bids.filter(x => vals[x.v] === 1).sort((a, b) => b.v - a.v);
          const w = uniq.length ? uniq[0].i : -1; if (w >= 0) S.pts[w] += k + 1; return w;
        });
        S.phase = 'reveal'; S.t = 0;
      }
    } else if (S.t > 3.2) { if (S.round >= 3) m.finish(S.pts.slice()); else { S.round++; this.start(S); } }
  },
  score(m, S) { return S.pts.slice(); },
  hud(m, S, i) { return S.pts[i]; },
  draw(m, S, g) {
    MGH.scene(g, 'temple', m.t);
    MGH.label(g, `Auction ${S.round} / 3`, 640, 92, 24, '#fff');
    const rel = [['🏺', 1, '#c98a4a'], ['👑', 2, '#ffd34d'], ['💎', 3, '#5fd8ff']];
    // the three treasures on display
    rel.forEach(([e, v, c], k) => {
      const y = 215 + k * 130;
      MGH.glow(g, 110, y, 70, c, 0.4); MGH.emoji(g, e, 110, y - 6, 60 + Math.sin(m.t * 2 + k) * 3);
      MGH.label(g, `${v} pt`, 110, y + 50, 16, '#ffe680');
      if (S.phase === 'reveal') { const w = S.res[k]; MGH.label(g, w >= 0 ? `→ ${m.players[w].name}` : '→ tie, nobody', 110, y + 78, 14, w >= 0 ? m.players[w].color : '#aaa'); }
    });
    for (let i = 0; i < 4; i++) {
      const x = 330 + i * 250, p = m.players[i], show = S.phase === 'reveal' || MGH.peek(m, i), mine = !m.bot(i) && S.phase === 'pick';
      MGH.av(g, m, i, x - 92, 140, 16, S.phase === 'reveal' ? (S.res.includes(i) ? 'cheer' : 'hurt') : (S.lock[i] ? 'happy' : 'determined'), { noFeet: true });
      MGH.text(g, `${p.name} ${S.lock[i] ? '🔒' : ''}`, x + 10, 150, 20, p.color, 'center', 'bold');
      for (let k = 0; k < 3; k++) {
        const y = 175 + k * 130, sel = mine && S.sel[i] === k && MGH.peek(m, i), won = S.phase === 'reveal' && S.res[k] === i;
        g.fillStyle = won ? 'rgba(120,255,140,0.25)' : sel ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.4)'; MGH.rr(g, x - 100, y, 200, 86, 12); g.fill();
        g.strokeStyle = won ? '#7f7' : sel ? p.color : 'rgba(255,255,255,0.25)'; g.lineWidth = won || sel ? 4 : 1.5; g.stroke();
        if (show) { const n = S.b[i][k]; for (let t = 0; t < n; t++) MGH.coin(g, x - 70 + (t % 6) * 28, y + 44, 11, 0); if (!n) MGH.text(g, '0', x, y + 54, 28, '#888', 'center', 'bold'); }
        else MGH.text(g, '?', x, y + 56, 36, '#fff', 'center', 'bold');
        if (won) MGH.emoji(g, '👑', x + 88, y + 6, 26);
        if (sel) { MGH.text(g, '◀', x - 90, y + 52, 18, '#fff'); MGH.text(g, '▶', x + 90, y + 52, 18, '#fff'); }
      }
      if (mine) { const left = 6 - sum(S.b[i]); for (let t = 0; t < 6; t++) { g.globalAlpha = t < left ? 1 : 0.2; MGH.coin(g, x - 70 + t * 28, 590, 10, 0); } g.globalAlpha = 1; MGH.text(g, `${left} token${left === 1 ? '' : 's'} left`, x, 622, 15, '#ddd'); }
    }
    if (S.phase === 'pick') { MGH.label(g, `↑↓ treasure · ←→ add/remove token · button = seal · ties cancel · ⏱ ${Math.max(0, 15 - S.t).toFixed(0)}`, 640, 662, 17, '#fff'); MGH.secretHint(g, 700); }
  },
});

// 30 ---------------------------------------------------------------- Prize Pick
MG.def({
  id: 'prize', name: 'Prize Pick', type: 'Bluff', controls: 'Pick',
  how: 'Prizes are worth 1 to 4. Everyone picks one. Players who picked the same prize cancel out. Three rounds.',
  wins: 'Most points.',
  init(m, S) { S.pts = [0, 0, 0, 0]; S.round = 1; PickR.start(S, 4, 6, 0); },
  update(m, S, dt) {
    if (S.phase === 'pick') {
      if (PickR.update(m, S, dt, 4, () => R.weighted([0, 1, 2, 3], k => [1, 2, 3, 3.5][k]))) {
        const picks = S.P.map(p => p.locked ? p.idx : -1);
        S.gain = picks.map(v => v >= 0 && picks.filter(x => x === v).length === 1 ? v + 1 : 0);
        S.gain.forEach((g, i) => { S.pts[i] += g; });
        S.mood = S.gain.map(v => v >= 3 ? 'cheer' : v > 0 ? 'happy' : 'hurt');
        S.phase = 'reveal'; S.t = 0;
      }
    } else { S.t += dt; if (S.t > 2.5) { if (S.round >= 3) m.finish(S.pts.slice()); else { S.round++; PickR.start(S, 4, 6, 0); } } }
  },
  score(m, S) { return S.pts.slice(); },
  hud(m, S, i) { return S.pts[i]; },
  draw(m, S, g) {
    MGH.scene(g, 'forest', m.t);
    MGH.label(g, `Round ${S.round} / 3 — grab a prize nobody else grabs`, 640, 140, 22, '#fff');
    PickR.drawOptions(m, S, g, ['🪙 1', '💰 2', '💎 3', '⭐ 4'], 170, 230, 220, 200, 4, S.phase === 'reveal');
    if (S.phase === 'reveal') S.gain.forEach((v, i) => MGH.label(g, `${m.players[i].name}: +${v}`, 160 + i * 320, 560, 24, m.players[i].color));
    PickR.drawStatus(m, S, g);
  },
});
