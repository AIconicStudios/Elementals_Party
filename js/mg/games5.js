'use strict';
// Moot minigames 41-50: Left/Right + one button

// 41 ---------------------------------------------------------------- Skyrope Skip
MG.def({
  id: 'skip', name: 'Skyrope Skip', type: 'Timing', controls: '1 button', mouseA: true,
  how: 'Two Wardens turn a giant rope. Press to jump as it sweeps under your feet. It speeds up, changes pace, and after 20 seconds a second rope joins in (double-dutch).',
  wins: 'Last one skipping.',
  init(m, S) {
    S.ph = Math.PI * 0.2; S.ph2 = null; S.w = 3.2; S.target = 3.2;
    S.p = [0, 1, 2, 3].map(i => ({ x: 400 + i * 160, h: 0, vy: 0, alive: true, outT: 0, jumps: 0, rx: R.range(0.06, 0.12), err: R.range(0.01, 0.04) }));
    S.lastLap = 0;
  },
  ground: 600,
  ropeH(ph) { return (1 + Math.cos(ph)) / 2; }, // 1 = overhead, 0 = at the feet
  update(m, S, dt) {
    S.w = lerp(S.w, S.target, dt * 1.5);
    const prev = S.ph;
    S.ph += S.w * dt;
    if (Math.floor(S.ph / (Math.PI * 2)) !== Math.floor(prev / (Math.PI * 2))) {
      S.target = Math.min(8.8, 3.2 + m.t * 0.14) * (Math.random() < 0.15 ? R.range(0.7, 0.85) : 1);
      Sfx.tone(160, 0.06, 'triangle', 0.04);
    }
    if (m.t > 20 && S.ph2 === null) { S.ph2 = S.ph + Math.PI; MGH.pop('DOUBLE-DUTCH!', 640, 200, '#ffe680', 44); MGH.shake(6); }
    if (S.ph2 !== null) S.ph2 += S.w * dt;
    const danger = ph => { const a = ((ph % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2); return Math.abs(a - Math.PI) < 0.22; };
    S.p.forEach((p, i) => {
      if (!p.alive) return;
      if (m.pressed(i, 'a') && p.h <= 0) { p.vy = 560; p.jumps++; }
      p.vy -= 2300 * dt; p.h = Math.max(0, p.h + p.vy * dt); if (p.h <= 0) p.vy = 0;
      if ((danger(S.ph) || (S.ph2 !== null && danger(S.ph2))) && p.h < 10) {
        p.alive = false; p.outT = m.t; MGH.burst(p.x, this.ground - 20, [m.players[i].color, '#fff'], 26, { speed: 300 }); MGH.shake(8); MGH.pop('Tripped!', p.x, this.ground - 90, '#fff', 26);
        if (!m.bot(i)) Sfx.bad();
      }
    });
    if (S.p.filter(p => p.alive).length <= 1) m.finish(this.score(m, S));
  },
  bot(m, S, i) {
    const p = S.p[i], v = m.vin[i]; v.a = false;
    if (!p.alive || p.h > 0) return;
    const tt = ph => { const a = ((ph % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2); let d = Math.PI - 0.22 - a; if (d < 0) d += Math.PI * 2; return d / S.w; };
    let t = tt(S.ph); if (S.ph2 !== null) t = Math.min(t, tt(S.ph2));
    const slip = Math.random() < 0.004 * (S.w / 3);
    if (t < p.rx + R.range(-p.err, p.err) || slip) v.a = true;
  },
  score(m, S) { return S.p.map(p => p.alive ? 1000 : p.outT); },
  fmt(s) { return s >= 1000 ? 'Still skipping!' : `tripped at ${s.toFixed(1)}s`; },
  hud(m, S, i) { return S.p[i].alive ? `${S.p[i].jumps} jumps` : 'out'; },
  drawRope(g, ph, front) {
    const h = this.ropeH(ph), y0 = 470, mid = this.ground - h * 420 + 8;
    const cy = 2 * mid - y0;
    const inFront = Math.sin(ph) > 0;
    if (inFront !== front) return;
    g.strokeStyle = front ? '#e8d5a8' : '#9c8a62'; g.lineWidth = front ? 8 : 5; g.lineCap = 'round';
    g.beginPath(); g.moveTo(150, y0); g.quadraticCurveTo(640, cy, 1130, y0); g.stroke();
  },
  draw(m, S, g) {
    MGH.bg(g, '#7ec8ff', '#d9f0ff');
    g.fillStyle = '#6fbf4a'; g.beginPath(); g.ellipse(640, 760, 900, 190, 0, 0, 7); g.fill();
    g.fillStyle = '#5aa83a'; g.fillRect(0, this.ground + 8, 1280, 200);
    this.drawRope(g, S.ph, false); if (S.ph2 !== null) this.drawRope(g, S.ph2, false);
    [130, 1150].forEach((x, k) => Char.draw(g, x, 500, 34, -1, '#b9bcc8', { hat: 'helmet', mood: 'determined', seed: k, look: { x: k ? -1 : 1, y: 0 } }));
    S.p.forEach((p, i) => {
      g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(p.x, this.ground + 4, 26 - p.h * 0.1, 7, 0, 0, 7); g.fill();
      MGH.av(g, m, i, p.x, this.ground - 30 - p.h, 30, !p.alive ? 'out' : p.h > 20 ? 'cheer' : (S.w > 6 ? 'scared' : 'determined'), { noFeet: false, alpha: p.alive ? 1 : 0.5 });
    });
    this.drawRope(g, S.ph, true); if (S.ph2 !== null) this.drawRope(g, S.ph2, true);
    MGH.text(g, `Rope speed ${'▮'.repeat(Math.round(S.w))}`, 640, 90, 22, '#234', 'center', 'bold');
  },
});

// 42 ---------------------------------------------------------------- Leap of the Holds (long jump)
MG.def({
  id: 'longjump', name: 'Leap of the Holds', type: 'Skill', controls: 'Left/Right + button',
  how: 'Sprint by pressing LEFT and RIGHT alternately (same key twice makes you stumble). Press the button before the white line to take off — hold it to raise your angle, release to leap. Two attempts, best counts. Crossing the line is a foul.',
  wins: 'Longest leap.',
  init(m, S) {
    S.best = [0, 0, 0, 0]; S.att = 1;
    S.ax = 120; S.line = 760; S.mpx = 42;
    this.reset(S);
  },
  reset(S) { S.p = [0, 1, 2, 3].map(() => ({ x: 120, v: 0, last: null, st: 'run', ang: 0, hold: false, fx: 0, fy: 0, vx: 0, vy: 0, dist: 0, tm: 0, foul: false, botNext: 0, botAng: R.range(34, 46), botJump: R.range(10, 60) })); S.done = 0; S.wait = 0; },
  update(m, S, dt) {
    S.p.forEach((p, i) => {
      if (p.st === 'run') {
        p.tm += dt;
        for (const k of ['left', 'right']) if (m.pressed(i, k)) {
          if (p.last === k) { p.v *= 0.6; p.stumble = 0.3; } else { p.v = Math.min(11.5, p.v + 0.75); }
          p.last = k;
        }
        p.v = Math.max(0, p.v - 2.2 * dt);
        p.x += p.v * S.mpx * dt;
        if (m.pressed(i, 'a') && p.x <= S.line + 2) { p.st = 'angle'; p.ang = 5; }
        if (p.x > S.line + 4) { p.st = 'done'; p.foul = true; S.done++; MGH.pop('FOUL!', S.line, 40 + i * 170 + 60, '#ff6b6b', 30); }
        if (p.tm > 12 && p.st === 'run') { p.st = 'done'; S.done++; }
      } else if (p.st === 'angle') {
        if (m.held(i, 'a')) p.ang = Math.min(70, p.ang + 75 * dt);
        if (!m.held(i, 'a') || p.ang >= 70 || p.x > S.line + 4) {
          if (p.x > S.line + 4) { p.st = 'done'; p.foul = true; S.done++; return; }
          const a = p.ang * Math.PI / 180, sp = p.v * 0.95 + 0.6;
          p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp; p.fy = 0; p.fx = 0; p.st = 'fly';
          MGH.burst(p.x, 40 + i * 170 + 130, '#d9c7a8', 8, { speed: 120 });
        }
      } else if (p.st === 'fly') {
        p.fx += p.vx * dt * 1.6; p.fy += p.vy * dt * 1.6; p.vy -= 9.8 * dt * 1.6;
        if (p.fy <= 0 && p.vy < 0) {
          p.fy = 0; p.st = 'done'; S.done++; p.dist = Math.max(0, (p.x - S.line) / S.mpx + p.fx);
          S.best[i] = Math.max(S.best[i], p.dist);
          MGH.burst(S.line + (p.x - S.line) + p.fx * S.mpx, 40 + i * 170 + 130, ['#e8d5a8', '#c9a36b'], 22, { speed: 220, up: 100, grav: 500 });
          MGH.pop(p.dist.toFixed(2) + ' m', S.line + p.fx * S.mpx, 40 + i * 170 + 60, m.players[i].color, 28);
        }
      }
    });
    if (S.done >= 4) { S.wait += dt; if (S.wait > 1.6) { if (S.att >= 2) m.finish(S.best.slice()); else { S.att++; this.reset(S); } } }
  },
  bot(m, S, i, dt) {
    const p = S.p[i], v = m.vin[i]; v.left = v.right = false;
    if (p.st === 'run') {
      p.botNext -= dt; v.a = false;
      if (p.botNext <= 0) { v[p.last === 'left' ? 'right' : 'left'] = true; p.botNext = R.range(0.085, 0.13); if (Math.random() < 0.03) v[p.last || 'left'] = true; }
      if (S.line - p.x < p.botJump) v.a = true;
    } else if (p.st === 'angle') v.a = p.ang < p.botAng;
    else v.a = false;
  },
  score(m, S) { return S.best.slice(); },
  fmt(s) { return s.toFixed(2) + ' m'; },
  hud(m, S, i) { return `${S.best[i].toFixed(2)}m (try ${S.att}/2)`; },
  draw(m, S, g) {
    MGH.bg(g, '#8fd0ff', '#e6f6ff'); MGH.lanes(g, m, 4, false);
    for (let i = 0; i < 4; i++) {
      const top = 40 + i * 170, base = top + 130, p = S.p[i];
      g.fillStyle = '#c75b3a'; g.fillRect(20, base, S.line - 20, 14);
      g.fillStyle = '#e8d5a8'; g.fillRect(S.line, base - 2, 500, 18);
      g.fillStyle = '#fff'; g.fillRect(S.line - 3, base - 4, 6, 22);
      for (let mtr = 1; mtr <= 10; mtr++) { const x = S.line + mtr * S.mpx; g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x, base + 14, 2, 6); if (mtr % 2 === 0) MGH.text(g, mtr + 'm', x, base + 34, 12, '#345'); }
      if (S.best[i] > 0) { g.fillStyle = m.players[i].color; g.fillRect(S.line + S.best[i] * S.mpx - 2, base - 30, 4, 30); }
      let x = p.x, y = base - 22;
      if (p.st === 'fly' || (p.st === 'done' && !p.foul && p.dist > 0)) { x = p.x + p.fx * S.mpx; y = base - 22 - p.fy * S.mpx; }
      if (p.stumble > 0) p.stumble -= 1 / 60;
      const mood = p.foul ? 'hurt' : p.stumble > 0 ? 'dizzy' : p.st === 'fly' ? 'cheer' : p.st === 'done' ? 'happy' : 'determined';
      MGH.av(g, m, i, x, y, 20, mood, { walk: p.st === 'run' && p.v > 1 ? 1 : 0, look: { x: 1, y: 0 } });
      if (p.st === 'angle') { g.strokeStyle = '#fff'; g.lineWidth = 4; const a = p.ang * Math.PI / 180; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 70, y - Math.sin(a) * 70); g.stroke(); MGH.text(g, Math.round(p.ang) + '°', x + 40, y - 50, 18, '#fff', 'center', 'bold'); }
      g.fillStyle = '#234'; g.fillRect(20, top + 12, 160, 10); g.fillStyle = m.players[i].color; g.fillRect(20, top + 12, 160 * p.v / 11.5, 10);
      MGH.text(g, m.players[i].name, 190, top + 22, 15, '#123', 'left', 'bold');
    }
  },
});

// 43 ---------------------------------------------------------------- Moot Drums
MG.def({
  id: 'drums', name: 'Moot Drums', type: 'Rhythm', controls: 'Left/Right + button',
  how: 'Drum notes fall in three columns. Press LEFT, ACTION or RIGHT as each note reaches the line. Perfect hits score 3 and build a combo bonus; a miss breaks your combo.',
  wins: 'Most points.',
  init(m, S) {
    const beat = 0.42; S.notes = [];
    for (let t = 2; t < 30; t += beat * R.pick([1, 1, 1, 0.5, 2])) {
      const lane = R.int(0, 2); S.notes.push({ t, lane });
      if (Math.random() < 0.12 && lane !== 1) S.notes.push({ t, lane: 2 - lane });
    }
    S.pts = [0, 0, 0, 0]; S.combo = [0, 0, 0, 0]; S.hit = [new Map(), new Map(), new Map(), new Map()]; S.fb = [0, 1, 2, 3].map(() => ({ s: '', t: 0 }));
    S.end = S.notes[S.notes.length - 1].t + 1.5; S.played = new Set();
  },
  keys: ['left', 'a', 'right'],
  update(m, S, dt) {
    S.notes.forEach((n, k) => { if (!S.played.has(k) && m.t >= n.t) { S.played.add(k); Sfx.tone([330, 440, 550][n.lane], 0.09, 'triangle', 0.035); } });
    for (let i = 0; i < 4; i++) {
      S.fb[i].t -= dt;
      for (let l = 0; l < 3; l++) {
        if (!m.pressed(i, this.keys[l])) continue;
        let best = -1, bd = 1;
        S.notes.forEach((n, k) => { if (n.lane === l && !S.hit[i].has(k)) { const d = Math.abs(n.t - m.t); if (d < bd) { bd = d; best = k; } } });
        if (best >= 0 && bd < 0.17) {
          const perfect = bd < 0.07;
          S.hit[i].set(best, perfect ? 2 : 1); S.combo[i]++;
          S.pts[i] += (perfect ? 3 : 1) + Math.floor(S.combo[i] / 10);
          S.fb[i] = { s: perfect ? 'PERFECT' : 'good', t: 0.4 };
          MGH.burst(i * 320 + 70 + l * 90, 610, perfect ? ['#ffe680', '#fff'] : ['#9fd8ff'], perfect ? 12 : 6, { speed: 200, kind: 'spark', size: 2.5 });
        } else { S.combo[i] = 0; S.fb[i] = { s: 'miss', t: 0.4 }; }
      }
      S.notes.forEach((n, k) => { if (!S.hit[i].has(k) && m.t - n.t > 0.17) { S.hit[i].set(k, 0); if (S.combo[i]) { S.combo[i] = 0; S.fb[i] = { s: 'miss', t: 0.4 }; } } });
    }
    if (m.t > S.end) m.finish(S.pts.slice());
  },
  bot(m, S, i) {
    const v = m.vin[i]; v.left = v.right = v.a = false;
    if (!S.botErr) S.botErr = new Map();
    S.notes.forEach((n, k) => {
      if (S.hit[i].has(k)) return;
      const key = i * 1000 + k;
      if (!S.botErr.has(key)) S.botErr.set(key, Math.random() < 0.07 ? 9 : R.range(-0.07, 0.07));
      if (Math.abs(m.t - (n.t + S.botErr.get(key))) < 0.017) v[this.keys[n.lane]] = !m.prev[i][this.keys[n.lane]];
    });
  },
  score(m, S) { return S.pts.slice(); },
  hud(m, S, i) { return `${S.pts[i]} (x${S.combo[i]})`; },
  draw(m, S, g) {
    MGH.bg(g, '#1a0f2e', '#06030c');
    const cols = ['#6bb0ff', '#ffd34d', '#ff6b9a'], lab = ['◀', '●', '▶'];
    for (let i = 0; i < 4; i++) {
      const ox = i * 320 + 25;
      g.fillStyle = 'rgba(255,255,255,0.05)'; g.fillRect(ox, 40, 270, 680);
      for (let l = 0; l < 3; l++) {
        const x = ox + 45 + l * 90;
        g.strokeStyle = 'rgba(255,255,255,0.12)'; g.beginPath(); g.moveTo(x, 40); g.lineTo(x, 720); g.stroke();
        const press = m.held(i, this.keys[l]);
        g.fillStyle = press ? cols[l] : 'rgba(255,255,255,0.12)'; g.beginPath(); g.arc(x, 610, 30, 0, 7); g.fill();
        MGH.text(g, lab[l], x, 618, 22, press ? '#000' : cols[l], 'center', 'bold');
      }
      S.notes.forEach((n, k) => {
        const st = S.hit[i].get(k);
        if (st > 0) return;
        const y = 610 - (n.t - m.t) * 420; if (y < 30 || y > 720) return;
        const x = ox + 45 + n.lane * 90;
        g.globalAlpha = st === 0 ? 0.25 : 1;
        g.fillStyle = cols[n.lane]; g.beginPath(); g.arc(x, y, 24, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 3; g.stroke();
        g.globalAlpha = 1;
      });
      const fb = S.fb[i];
      if (fb.t > 0) MGH.text(g, fb.s, ox + 135, 560 - (0.4 - fb.t) * 60, 24, fb.s === 'miss' ? '#ff6b6b' : fb.s === 'good' ? '#9fd8ff' : '#ffe680', 'center', 'bold');
      MGH.av(g, m, i, ox + 135, 680, 22, fb.t > 0 ? (fb.s === 'miss' ? 'hurt' : 'cheer') : 'determined', { look: { x: 0, y: -1 } });
      if (S.combo[i] >= 5) MGH.text(g, `${S.combo[i]} combo!`, ox + 135, 80, 18, '#ffe680', 'center', 'bold');
    }
  },
});

// 44 ---------------------------------------------------------------- Comet Trails
MG.def({
  id: 'comet', name: 'Comet Trails', type: 'Arena', controls: 'Left/Right + button',
  how: 'You are a comet that never stops, leaving a burning trail. Press LEFT or RIGHT to turn 90°. Press the button for a short burst of speed (recharges in 3 s). Hit a wall or any trail and you burn out.',
  wins: 'Last comet burning.',
  init(m, S) {
    S.cs = 10; S.W = 128; S.H = 68;
    S.grid = new Int8Array(S.W * S.H).fill(-1);
    const st = [[20, 14, 1, 0], [107, 14, 0, 1], [107, 53, -1, 0], [20, 53, 0, -1]];
    S.p = st.map(([x, y, dx, dy]) => ({ x, y, dx, dy, acc: 0, alive: true, outT: 0, cd: 0, boost: 0 }));
    S.p.forEach((p, i) => { S.grid[p.y * S.W + p.x] = i; });
  },
  free(S, x, y) { return x >= 0 && y >= 0 && x < S.W && y < S.H && S.grid[y * S.W + x] < 0; },
  update(m, S, dt) {
    S.p.forEach((p, i) => {
      if (!p.alive) return;
      if (m.pressed(i, 'left')) { [p.dx, p.dy] = [p.dy, -p.dx]; }
      if (m.pressed(i, 'right')) { [p.dx, p.dy] = [-p.dy, p.dx]; }
      p.cd -= dt; p.boost -= dt;
      if (m.pressed(i, 'a') && p.cd <= 0) { p.boost = 0.7; p.cd = 3; MGH.ring((p.x + 0.5) * S.cs, 40 + (p.y + 0.5) * S.cs, m.players[i].color, 6, 40, 0.4); }
      p.acc += dt * (p.boost > 0 ? 34 : 17 + m.t * 0.15);
      while (p.acc >= 1 && p.alive) {
        p.acc -= 1;
        const nx = p.x + p.dx, ny = p.y + p.dy;
        if (!this.free(S, nx, ny)) { p.alive = false; p.outT = m.t; const X = (p.x + 0.5) * S.cs, Y = 40 + (p.y + 0.5) * S.cs; MGH.burst(X, Y, [m.players[i].color, '#fff', '#ffd34d'], 40, { speed: 380 }); MGH.shake(9); if (!m.bot(i)) Sfx.boom(); break; }
        p.x = nx; p.y = ny; S.grid[ny * S.W + nx] = i;
      }
    });
    if (S.p.filter(p => p.alive).length <= 1) m.finish(this.score(m, S));
  },
  bot(m, S, i) {
    const p = S.p[i], v = m.vin[i]; v.left = v.right = v.a = false; if (!p.alive) return;
    const run = (dx, dy) => { let n = 0, x = p.x, y = p.y; while (n < 40) { x += dx; y += dy; if (!this.free(S, x, y)) break; n++; } return n; };
    const ahead = run(p.dx, p.dy), l = run(p.dy, -p.dx), r = run(-p.dy, p.dx);
    if (!S.botMem) S.botMem = [0, 0, 0, 0];
    S.botMem[i]--;
    if (ahead < 4 || (S.botMem[i] <= 0 && Math.random() < 0.02 && Math.max(l, r) > ahead + 6)) {
      if (Math.max(l, r) > ahead) { v[l >= r ? 'left' : 'right'] = !m.prev[i].left && !m.prev[i].right; S.botMem[i] = 12; }
    }
    if (ahead > 25 && p.cd <= 0 && Math.random() < 0.01) v.a = true;
  },
  score(m, S) { return S.p.map(p => p.alive ? 1000 : p.outT); },
  fmt(s) { return s >= 1000 ? 'Still burning' : `burnt out at ${s.toFixed(1)}s`; },
  hud(m, S, i) { return S.p[i].alive ? (S.p[i].cd > 0 ? 'boost ' + Math.ceil(S.p[i].cd) : 'boost ready') : 'out'; },
  draw(m, S, g) {
    MGH.bg(g, '#05031a', '#0d0630');
    g.strokeStyle = 'rgba(120,100,255,0.08)'; g.lineWidth = 1;
    for (let x = 0; x <= 1280; x += 40) { g.beginPath(); g.moveTo(x, 40); g.lineTo(x, 720); g.stroke(); }
    for (let y = 40; y <= 720; y += 40) { g.beginPath(); g.moveTo(0, y); g.lineTo(1280, y); g.stroke(); }
    g.save(); g.shadowBlur = 10;
    for (let y = 0; y < S.H; y++) for (let x = 0; x < S.W; x++) {
      const o = S.grid[y * S.W + x]; if (o < 0) continue;
      g.fillStyle = m.players[o].color; g.shadowColor = m.players[o].color; g.globalAlpha = S.p[o].alive ? 0.9 : 0.35;
      g.fillRect(x * S.cs + 1, 40 + y * S.cs + 1, S.cs - 2, S.cs - 2);
    }
    g.restore(); g.globalAlpha = 1;
    S.p.forEach((p, i) => { if (p.alive) MGH.av(g, m, i, (p.x + 0.5) * S.cs, 40 + (p.y + 0.5) * S.cs, 13, p.boost > 0 ? 'cheer' : 'determined', { noFeet: true, noArms: true, look: { x: p.dx, y: p.dy } }); });
  },
});

// 45 ---------------------------------------------------------------- Elemental Pong
MG.def({
  id: 'pong', name: 'Elemental Pong', type: 'Arena', controls: 'Left/Right + button',
  how: 'Each player guards one side of the court. LEFT/RIGHT slides your paddle (on the side walls, LEFT is up). Press the button to smash — a ball hit mid-smash flies much faster. Let a ball past and you lose a heart; at zero your side becomes a wall.',
  wins: 'Last one with hearts (or most hearts).',
  dur: 60,
  init(m, S) {
    S.x0 = 340; S.y0 = 60; S.sz = 600;
    S.pad = [0, 1, 2, 3].map(() => ({ pos: 0.5, smash: 0, cd: 0 }));
    S.hp = [3, 3, 3, 3]; S.outT = [0, 0, 0, 0];
    S.balls = []; this.serve(S); S.next2 = 12;
  },
  // side 0 bottom, 1 left, 2 top, 3 right
  serve(S) { const a = R.range(0, Math.PI * 2); S.balls.push({ x: S.x0 + S.sz / 2, y: S.y0 + S.sz / 2, vx: Math.cos(a) * 280, vy: Math.sin(a) * 280, last: -1 }); },
  padXY(S, i) {
    const p = S.pad[i].pos, sm = S.pad[i].smash > 0 ? 18 : 0;
    if (i === 0) return { x: S.x0 + p * S.sz, y: S.y0 + S.sz - 14 - sm, hor: true };
    if (i === 2) return { x: S.x0 + p * S.sz, y: S.y0 + 14 + sm, hor: true };
    if (i === 1) return { x: S.x0 + 14 + sm, y: S.y0 + p * S.sz, hor: false };
    return { x: S.x0 + S.sz - 14 - sm, y: S.y0 + p * S.sz, hor: false };
  },
  update(m, S, dt) {
    S.next2 -= dt; if (S.next2 <= 0 && S.balls.length < 2) { this.serve(S); S.next2 = 999; }
    for (let i = 0; i < 4; i++) {
      const P = S.pad[i]; P.smash -= dt; P.cd -= dt;
      const ax = m.axis(i).x;
      P.pos = clamp(P.pos + ax * 1.15 * dt, 0.1, 0.9);
      if (m.pressed(i, 'a') && P.cd <= 0) { P.smash = 0.18; P.cd = 0.6; }
    }
    const L = S.x0, Rr = S.x0 + S.sz, T = S.y0, B = S.y0 + S.sz;
    for (const b of S.balls) {
      b.x += b.vx * dt; b.y += b.vy * dt;
      for (let i = 0; i < 4; i++) {
        const q = this.padXY(S, i); if (S.hp[i] <= 0) continue;
        const half = 70;
        const hit = q.hor ? Math.abs(b.x - q.x) < half && Math.abs(b.y - q.y) < 16 : Math.abs(b.y - q.y) < half && Math.abs(b.x - q.x) < 16;
        const towards = i === 0 ? b.vy > 0 : i === 2 ? b.vy < 0 : i === 1 ? b.vx < 0 : b.vx > 0;
        if (hit && towards) {
          const off = q.hor ? (b.x - q.x) / half : (b.y - q.y) / half;
          let sp = Math.hypot(b.vx, b.vy) * 1.04; if (S.pad[i].smash > 0) { sp *= 1.45; MGH.shake(5); MGH.burst(b.x, b.y, [m.players[i].color, '#fff'], 16, { speed: 260, kind: 'spark', size: 3 }); }
          sp = Math.min(sp, 900);
          const ang = off * 1.0;
          if (i === 0) { b.vx = Math.sin(ang) * sp; b.vy = -Math.cos(ang) * sp; }
          if (i === 2) { b.vx = Math.sin(ang) * sp; b.vy = Math.cos(ang) * sp; }
          if (i === 1) { b.vy = Math.sin(ang) * sp; b.vx = Math.cos(ang) * sp; }
          if (i === 3) { b.vy = Math.sin(ang) * sp; b.vx = -Math.cos(ang) * sp; }
          b.last = i; Sfx.tone(500 + i * 80, 0.05, 'square', 0.04);
        }
      }
      const out = b.y > B ? 0 : b.x < L ? 1 : b.y < T ? 2 : b.x > Rr ? 3 : -1;
      if (out >= 0) {
        if (S.hp[out] > 0) {
          S.hp[out]--; MGH.pop('−♥', b.x, b.y, '#ff6b6b', 30); MGH.burst(b.x, b.y, [m.players[out].color, '#fff'], 24, { speed: 300 }); MGH.shake(6);
          if (S.hp[out] === 0) S.outT[out] = m.t;
          b.x = S.x0 + S.sz / 2; b.y = S.y0 + S.sz / 2; const a = R.range(0, Math.PI * 2); b.vx = Math.cos(a) * 280; b.vy = Math.sin(a) * 280;
        } else {
          if (out === 0) { b.y = B; b.vy = -Math.abs(b.vy); } if (out === 2) { b.y = T; b.vy = Math.abs(b.vy); }
          if (out === 1) { b.x = L; b.vx = Math.abs(b.vx); } if (out === 3) { b.x = Rr; b.vx = -Math.abs(b.vx); }
        }
      }
      if (Math.abs(b.vx) < 60) b.vx = Math.sign(b.vx || 1) * 60; if (Math.abs(b.vy) < 60) b.vy = Math.sign(b.vy || 1) * 60;
    }
    if (S.hp.filter(h => h > 0).length <= 1) m.finish(this.score(m, S));
  },
  bot(m, S, i, dt) {
    const v = m.vin[i]; v.left = v.right = v.a = false; if (S.hp[i] <= 0) return;
    const q = this.padXY(S, i);
    let target = 0.5, close = false;
    let bestT = 1e9;
    for (const b of S.balls) {
      const towards = i === 0 ? b.vy > 0 : i === 2 ? b.vy < 0 : i === 1 ? b.vx < 0 : b.vx > 0; if (!towards) continue;
      const t = q.hor ? Math.abs((q.y - b.y) / b.vy) : Math.abs((q.x - b.x) / b.vx);
      if (t < bestT) {
        bestT = t;
        let px = q.hor ? b.x + b.vx * t : b.y + b.vy * t;
        const lo = q.hor ? S.x0 : S.y0, hi = lo + S.sz;
        for (let k = 0; k < 4; k++) { if (px < lo) px = 2 * lo - px; if (px > hi) px = 2 * hi - px; }
        target = (px - lo) / S.sz; close = t < 0.15;
      }
    }
    if (!S.botNoise) S.botNoise = [0, 0, 0, 0].map(() => R.range(-0.06, 0.06));
    if (Math.random() < 0.02) S.botNoise[i] = R.range(-0.08, 0.08);
    const d = target + S.botNoise[i] - S.pad[i].pos;
    if (Math.abs(d) > 0.02) { if (d > 0) v.right = true; else v.left = true; }
    if (close && Math.random() < 0.3) v.a = true;
  },
  score(m, S) { return S.hp.map((h, i) => h > 0 ? 100 + h : S.outT[i]); },
  fmt(s) { return s >= 100 ? `${Math.round(s - 100)} ♥ left` : `out at ${s.toFixed(1)}s`; },
  hud(m, S, i) { return S.hp[i] > 0 ? '♥'.repeat(S.hp[i]) : 'out'; },
  draw(m, S, g) {
    MGH.bg(g, '#101830', '#05070f');
    g.fillStyle = '#0c1430'; g.fillRect(S.x0, S.y0, S.sz, S.sz);
    g.strokeStyle = 'rgba(255,255,255,0.12)'; g.setLineDash([10, 10]); g.beginPath(); g.moveTo(S.x0, S.y0); g.lineTo(S.x0 + S.sz, S.y0 + S.sz); g.moveTo(S.x0 + S.sz, S.y0); g.lineTo(S.x0, S.y0 + S.sz); g.stroke(); g.setLineDash([]);
    for (let i = 0; i < 4; i++) {
      const p = m.players[i], q = this.padXY(S, i);
      g.lineWidth = 6; g.strokeStyle = S.hp[i] > 0 ? p.color : '#555';
      const s = [[S.x0, S.y0 + S.sz, S.x0 + S.sz, S.y0 + S.sz], [S.x0, S.y0, S.x0, S.y0 + S.sz], [S.x0, S.y0, S.x0 + S.sz, S.y0], [S.x0 + S.sz, S.y0, S.x0 + S.sz, S.y0 + S.sz]][i];
      g.beginPath(); g.moveTo(s[0], s[1]); g.lineTo(s[2], s[3]); g.stroke();
      if (S.hp[i] <= 0) continue;
      g.fillStyle = S.pad[i].smash > 0 ? '#fff' : p.color;
      if (q.hor) MGH.rr(g, q.x - 70, q.y - 9, 140, 18, 9); else MGH.rr(g, q.x - 9, q.y - 70, 18, 140, 9);
      g.fill();
      const cpos = [[S.x0 + S.sz / 2, S.y0 + S.sz + 38], [S.x0 - 50, S.y0 + S.sz / 2], [S.x0 + S.sz / 2, S.y0 - 30], [S.x0 + S.sz + 50, S.y0 + S.sz / 2]][i];
      MGH.av(g, m, i, cpos[0] + (i === 0 || i === 2 ? (q.x - S.x0 - S.sz / 2) * 0.3 : 0), cpos[1], 20, S.pad[i].smash > 0 ? 'determined' : 'happy', { noFeet: true });
      MGH.text(g, '♥'.repeat(S.hp[i]), cpos[0], cpos[1] + (i === 2 ? -22 : 40), 18, '#ff6b6b', 'center', 'bold');
    }
    for (const b of S.balls) {
      g.save(); g.shadowColor = b.last >= 0 ? m.players[b.last].color : '#fff'; g.shadowBlur = 20;
      g.fillStyle = '#fff'; g.beginPath(); g.arc(b.x, b.y, 11, 0, 7); g.fill(); g.restore();
    }
  },
});

// 46 ---------------------------------------------------------------- Swing Across
MG.def({
  id: 'swing', name: 'Swing Across', type: 'Race', controls: 'Left/Right + button',
  how: 'Cross the chasm on hanging vines. Press LEFT/RIGHT in time with your swing to pump higher, then press the button to let go and fly to the next vine — you grab it automatically. Fall and you climb back onto your last vine.',
  wins: 'First across (else furthest).',
  init(m, S) {
    S.ropes = []; let x = 120;
    for (let k = 0; k < 14; k++) { S.ropes.push({ x, L: R.range(150, 205) }); x += R.range(205, 255); }
    S.goal = S.ropes[S.ropes.length - 1].x;
    S.p = [0, 1, 2, 3].map(() => ({ rope: 0, th: 0.3, w: 0, L: S.ropes[0].L, fly: false, x: 0, y: 0, vx: 0, vy: 0, fin: 0, fall: 0, best: 0, botRel: R.range(-0.2, 0.15) }));
  },
  pos(S, p) { if (p.fly || p.fall > 0) return { x: p.x, y: p.y }; const r = S.ropes[p.rope]; return { x: r.x + Math.sin(p.th) * p.L, y: 20 + Math.cos(p.th) * p.L }; },
  update(m, S, dt) {
    S.p.forEach((p, i) => {
      if (p.fin) return;
      if (p.fall > 0) { p.fall -= dt; if (p.fall <= 0) { p.th = 0; p.w = 0; p.L = S.ropes[p.rope].L; } return; }
      if (!p.fly) {
        const ax = m.axis(i).x;
        p.w += (-(900 / p.L) * Math.sin(p.th)) * dt;
        if (ax && Math.sign(ax) === Math.sign(p.w)) p.w += ax * 2.4 * dt;
        p.w *= 1 - 0.15 * dt;
        p.th += p.w * dt; p.th = clamp(p.th, -1.45, 1.45);
        if (m.pressed(i, 'a') && p.rope < S.ropes.length - 1) {
          const q = this.pos(S, p);
          p.fly = true; p.x = q.x; p.y = q.y; p.vx = Math.cos(p.th) * p.w * p.L; p.vy = -Math.sin(p.th) * p.w * p.L;
        }
      } else {
        p.vy += 900 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
        for (let k = p.rope + 1; k < S.ropes.length; k++) {
          const r = S.ropes[k];
          if (Math.abs(p.x - r.x) < 18 && p.y > 40 && p.y < 20 + r.L + 10) {
            p.fly = false; p.rope = k; p.L = Math.max(70, p.y - 20); p.th = Math.asin(clamp((p.x - r.x) / p.L, -1, 1)); p.w = p.vx / p.L * Math.cos(p.th);
            if (S.cam) MGH.burst((i % 2) * 640 + p.x - S.cam[i], 40 + Math.floor(i / 2) * 340 + p.y * 0.85, ['#7ccf4a', '#c8e66b'], 8, { speed: 100 });
            if (k === S.ropes.length - 1) p.fin = m.t;
            break;
          }
        }
        if (p.y > 360) { p.fly = false; p.fall = 0.9; }
      }
      p.best = Math.max(p.best, p.rope);
    });
    if (S.p.some(p => p.fin) || m.t > 70) m.finish(this.score(m, S));
  },
  bot(m, S, i) {
    const p = S.p[i], v = m.vin[i]; v.left = v.right = v.a = false;
    if (p.fly || p.fin || p.fall > 0) return;
    if (p.w > 0) v.right = true; else v.left = true;
    const next = S.ropes[p.rope + 1]; if (!next) return;
    const q = this.pos(S, p), vx = Math.cos(p.th) * p.w * p.L, vy = -Math.sin(p.th) * p.w * p.L;
    if (vx <= 40) return;
    // simulate the flight
    let x = q.x, y = q.y, wx = vx, wy = vy;
    for (let k = 0; k < 120; k++) { wy += 900 / 60; x += wx / 60; y += wy / 60; if (Math.abs(x - next.x) < 14 && y > 50 && y < 20 + next.L) { if (Math.random() < 0.6) v.a = true; return; } if (y > 360) break; }
  },
  score(m, S) { return S.p.map(p => p.fin ? 1000 - p.fin : p.best + this.pos(S, p).x / 10000); },
  fmt(s) { return s >= 100 ? 'Across!' : `vine ${Math.floor(s) + 1}`; },
  hud(m, S, i) { return `vine ${S.p[i].rope + 1}/${S.ropes.length}`; },
  draw(m, S, g) {
    MGH.bg(g, '#2a4a2a', '#0e1a0e');
    for (let i = 0; i < 4; i++) {
      const ox = (i % 2) * 640, oy = 40 + Math.floor(i / 2) * 340, p = S.p[i];
      const me = this.pos(S, p), cam = clamp(me.x - 240, 0, S.goal - 500);
      if (!S.cam) S.cam = [0, 0, 0, 0]; S.cam[i] = cam;
      g.save(); g.beginPath(); g.rect(ox, oy, 640, 340); g.clip(); g.translate(ox - cam, oy); g.scale(1, 0.85);
      g.fillStyle = '#0a140a'; g.fillRect(cam, 330, 700, 100);
      g.fillStyle = '#4a3020'; g.fillRect(cam - 10, 0, 720, 14);
      S.ropes.forEach((r, k) => {
        const mine = !p.fly && p.fall <= 0 && p.rope === k;
        const ex = mine ? me.x : r.x + Math.sin(Math.sin(m.t + k) * 0.08) * r.L, ey = mine ? me.y : 20 + r.L;
        g.strokeStyle = k === S.ropes.length - 1 ? '#ffd34d' : '#5aa83a'; g.lineWidth = 4; g.beginPath(); g.moveTo(r.x, 14); g.lineTo(ex, ey); g.stroke();
        g.fillStyle = '#7ccf4a'; g.beginPath(); g.arc(r.x + 4, 60, 5, 0, 7); g.fill();
      });
      const fx = S.ropes[S.ropes.length - 1].x; MGH.text(g, '🏁', fx + 40, 80, 34, '#fff');
      if (p.fall <= 0) MGH.av(g, m, i, me.x, me.y, 18, p.fin ? 'cheer' : p.fly ? 'cheer' : (Math.abs(p.w) > 1.5 ? 'determined' : 'happy'), { noFeet: true, look: { x: 1, y: 0 } });
      g.restore();
      if (p.fall > 0) MGH.text(g, 'Fell! Climbing back…', ox + 320, oy + 170, 24, '#fff', 'center', 'bold');
      g.strokeStyle = m.players[i].color; g.lineWidth = 3; g.strokeRect(ox + 2, oy + 2, 636, 336);
      MGH.text(g, m.players[i].name, ox + 14, oy + 26, 16, m.players[i].color, 'left', 'bold');
    }
  },
});

// 47 ---------------------------------------------------------------- Zephyr Glide
MG.def({
  id: 'glide', name: 'Zephyr Glide', type: 'Race', controls: 'Left/Right + button', dur: 35, mouseA: true,
  how: 'Glide through the cloud gates. Press the button to flap upward; hold LEFT to brake or RIGHT to speed up. Clipping a cloud wall stuns you and knocks you back. Golden stars add a burst of speed.',
  wins: 'Furthest distance.',
  init(m, S) {
    S.gates = []; for (let x = 600; x < 12000; x += R.range(330, 430)) S.gates.push({ x, gap: R.range(40, 130), size: R.range(78, 95), star: Math.random() < 0.4 });
    S.p = [0, 1, 2, 3].map(() => ({ x: 0, y: 85, vy: 0, stun: 0, boost: 0, took: new Set() }));
  },
  update(m, S, dt) {
    S.p.forEach((p, i) => {
      if (p.stun > 0) { p.stun -= dt; p.y = clamp(p.y + 60 * dt, 15, 155); return; }
      const ax = m.axis(i).x;
      const sp = 260 + ax * 110 + (p.boost > 0 ? 160 : 0); p.boost -= dt;
      p.x += sp * dt;
      if (m.pressed(i, 'a')) { p.vy = -300; MGH.burst(170, 40 + i * 170 + p.y + 10, 'rgba(255,255,255,0.8)', 4, { speed: 80, life: 0.4 }); }
      p.vy += 900 * dt; p.y += p.vy * dt;
      if (p.y < 12) { p.y = 12; p.vy = 0; } if (p.y > 158) { p.y = 158; p.vy = -200; }
      S.gates.forEach((gt, k) => {
        if (Math.abs(gt.x - p.x) < 26) {
          if (p.y < gt.gap || p.y > gt.gap + gt.size) { p.stun = 0.8; p.x -= 120; p.vy = 0; MGH.burst(170, 40 + i * 170 + p.y, ['#fff', '#ccd'], 14, { speed: 200 }); if (!m.bot(i)) Sfx.bad(); }
          else if (gt.star && !p.took.has(k)) { p.took.add(k); p.boost = 1; MGH.burst(170, 40 + i * 170 + p.y, ['#ffe680', '#fff'], 14, { speed: 200, kind: 'spark', size: 2 }); }
        }
      });
    });
  },
  bot(m, S, i) {
    const p = S.p[i], v = m.vin[i]; v.left = v.right = v.a = false;
    const gt = S.gates.find(g => g.x > p.x - 20);
    if (!gt) return;
    const target = gt.gap + gt.size * 0.55 + (S.botOff ? S.botOff[i] : 0);
    if (!S.botOff) S.botOff = [0, 0, 0, 0].map(() => R.range(-8, 8));
    if (p.y > target && p.vy > -60) v.a = !m.prev[i].a;
    if (gt.x - p.x < 120 && Math.abs(p.y - target) > 25) v.left = true; else if (gt.x - p.x > 200) v.right = true;
  },
  score(m, S) { return S.p.map(p => p.x); },
  fmt(s) { return Math.round(s / 10) + ' m'; },
  hud(m, S, i) { return Math.round(S.p[i].x / 10) + 'm'; },
  draw(m, S, g) {
    MGH.bg(g, '#7ec8ff', '#cdeeff');
    for (let i = 0; i < 4; i++) {
      const top = 40 + i * 170, p = S.p[i], cam = p.x - 170;
      g.save(); g.beginPath(); g.rect(0, top, 1280, 170); g.clip();
      for (let k = 0; k < 6; k++) { const cx = ((k * 260 - cam * 0.3) % 1560 + 1560) % 1560 - 140; g.fillStyle = 'rgba(255,255,255,0.45)'; g.beginPath(); g.ellipse(cx, top + 30 + (k % 3) * 45, 70, 18, 0, 0, 7); g.fill(); }
      S.gates.forEach(gt => {
        const x = gt.x - cam; if (x < -60 || x > 1340) return;
        g.fillStyle = '#ffffff'; g.strokeStyle = '#a8c8e8'; g.lineWidth = 2;
        MGH.rr(g, x - 22, top, 44, gt.gap, 14); g.fill(); g.stroke();
        MGH.rr(g, x - 22, top + gt.gap + gt.size, 44, 170 - gt.gap - gt.size, 14); g.fill(); g.stroke();
        if (gt.star) MGH.text(g, '⭐', x, top + gt.gap + gt.size / 2 + 9, 22, '#fff');
      });
      MGH.av(g, m, i, 170, top + p.y, 16, p.stun > 0 ? 'dizzy' : p.boost > 0 ? 'cheer' : p.vy < 0 ? 'determined' : 'happy', { noFeet: true, look: { x: 1, y: p.vy / 400 } });
      g.restore();
      MGH.text(g, m.players[i].name, 12, top + 20, 15, '#234', 'left', 'bold');
      g.fillStyle = '#234'; g.fillRect(0, top + 168, 1280, 2);
    }
  },
});

// 48 ---------------------------------------------------------------- Boulder Bowling
MG.def({
  id: 'bowling', name: 'Boulder Bowling', type: 'Skill', controls: 'Left/Right + button',
  how: 'Slide LEFT/RIGHT to line up, press the button to start the swinging aim, press again to bowl. While it rolls, hold LEFT or RIGHT to curve it. Two rolls to knock down all ten stone pins.',
  wins: 'Most pins.',
  init(m, S) {
    S.p = [0, 1, 2, 3].map(() => ({ x: 160, st: 'pos', ang: 0, ball: null, roll: 1, pins: this.rack(), down: 0, wait: 0, botX: R.range(140, 180), botA: R.range(-0.1, 0.1), bt: R.range(0.5, 1.5) }));
  },
  rack() { const ps = []; for (let r = 0; r < 4; r++) for (let c = 0; c <= r; c++) ps.push({ x: 160 + (c - r / 2) * 34, y: 170 - r * 30, vx: 0, vy: 0, down: false }); return ps; },
  update(m, S, dt) {
    S.p.forEach((p, i) => {
      if (p.st === 'done') return;
      const ax = m.axis(i).x;
      if (p.st === 'pos') { p.x = clamp(p.x + ax * 160 * dt, 70, 250); if (m.pressed(i, 'a')) { p.st = 'aim'; p.t0 = m.t; } }
      else if (p.st === 'aim') { p.ang = Math.sin((m.t - p.t0) * 2.6) * 0.32; if (m.pressed(i, 'a')) { p.st = 'roll'; p.ball = { x: p.x, y: 640, vx: Math.sin(p.ang) * 420, vy: -Math.cos(p.ang) * 420 }; } }
      else if (p.st === 'roll') {
        const b = p.ball;
        b.vx += ax * 120 * dt; b.x += b.vx * dt; b.y += b.vy * dt;
        if (b.x < 30 || b.x > 290) { b.vx = 0; b.x = clamp(b.x, 30, 290); }
        for (const pin of p.pins) {
          if (!pin.down && dist(b.x, b.y, pin.x, pin.y) < 24) { pin.down = true; pin.vx = (pin.x - b.x) * 11 + b.vx * 0.3; pin.vy = (pin.y - b.y) * 7 + b.vy * 0.25; MGH.burst(i * 320 + pin.x, pin.y, ['#ddd', '#aaa'], 6, { speed: 160 }); Sfx.tone(300, 0.04, 'square', 0.03); }
        }
        if (b.y < 40) { p.st = 'settle'; p.wait = 0.9; }
      } else if (p.st === 'settle') {
        p.wait -= dt;
        if (p.wait <= 0) {
          const n = p.pins.filter(x => x.down).length;
          if (n === 10 || p.roll === 2) { p.down = n; p.st = 'done'; MGH.pop(n === 10 ? (p.roll === 1 ? 'STRIKE!' : 'SPARE!') : `${n} pins`, i * 320 + 160, 300, m.players[i].color, 30); if (n === 10) MGH.burst(i * 320 + 160, 150, ['#ffe680', '#fff', m.players[i].color], 40, { speed: 340 }); }
          else { p.roll = 2; p.pins = p.pins.filter(x => !x.down).concat(p.pins.filter(x => x.down).map(x => Object.assign(x, { gone: true }))); p.st = 'pos'; p.ball = null; }
        }
      }
      for (const pin of p.pins) if (pin.down && !pin.gone) { pin.x += pin.vx * dt; pin.y += pin.vy * dt; pin.vx *= 1 - 4 * dt; pin.vy *= 1 - 4 * dt;
        for (const o of p.pins) if (!o.down && dist(o.x, o.y, pin.x, pin.y) < 16 && Math.hypot(pin.vx, pin.vy) > 140 && Math.random() < 0.75) { o.down = true; o.vx = pin.vx * 0.5 + (o.x - pin.x) * 4; o.vy = pin.vy * 0.5 + (o.y - pin.y) * 4; } }
    });
    if (S.p.every(p => p.st === 'done')) { S.fin = (S.fin || 0) + dt; if (S.fin > 1.2) m.finish(S.p.map(p => p.down)); }
  },
  bot(m, S, i, dt) {
    const p = S.p[i], v = m.vin[i]; v.left = v.right = v.a = false;
    if (p.st === 'pos') { const standing = p.pins.filter(x => !x.down); const tx = standing.length ? sum(standing.map(x => x.x)) / standing.length + R.range(-3, 3) : p.botX; if (Math.abs(tx - p.x) > 4) v[tx > p.x ? 'right' : 'left'] = true; else { p.bt -= dt; if (p.bt <= 0) { v.a = true; p.bt = R.range(0.4, 1); } } }
    else if (p.st === 'aim') { if (Math.abs(p.ang - p.botA) < 0.03 && Math.random() < 0.5) { v.a = true; p.botA = R.range(-0.1, 0.1); } }
  },
  score(m, S) { return S.p.map(p => p.st === 'done' ? p.down : p.pins.filter(x => x.down).length); },
  fmt(s) { return `${s} pins`; },
  hud(m, S, i) { return `roll ${S.p[i].roll}${S.p[i].st === 'done' ? ' ✔ ' + S.p[i].down : ''}`; },
  draw(m, S, g) {
    MGH.bg(g, '#3a2a1c', '#170f08'); MGH.lanes(g, m);
    S.p.forEach((p, i) => {
      const ox = i * 320;
      g.fillStyle = '#c9a36b'; g.fillRect(ox + 30, 50, 260, 640);
      g.fillStyle = '#5a4022'; g.fillRect(ox + 18, 50, 12, 640); g.fillRect(ox + 290, 50, 12, 640);
      for (let k = 0; k < 7; k++) { g.fillStyle = 'rgba(90,60,30,0.6)'; g.beginPath(); g.moveTo(ox + 160 + (k - 3) * 22, 480); g.lineTo(ox + 152 + (k - 3) * 22, 495); g.lineTo(ox + 168 + (k - 3) * 22, 495); g.fill(); }
      for (const pin of p.pins) { if (pin.gone) continue; g.save(); g.translate(ox + pin.x, pin.y); if (pin.down) g.rotate(1.2); g.fillStyle = '#e8e4da'; g.beginPath(); g.ellipse(0, 0, 9, pin.down ? 6 : 13, 0, 0, 7); g.fill(); g.fillStyle = '#c33'; g.fillRect(-8, -3, 16, 3); g.restore(); }
      if (p.ball) { g.fillStyle = '#6b6b78'; g.beginPath(); g.arc(ox + p.ball.x, p.ball.y, 18, 0, 7); g.fill(); g.fillStyle = '#4a4a55'; g.beginPath(); g.arc(ox + p.ball.x + 5, p.ball.y - 5, 4, 0, 7); g.fill(); }
      if (p.st === 'aim') { g.strokeStyle = '#fff'; g.lineWidth = 3; g.setLineDash([8, 6]); g.beginPath(); g.moveTo(ox + p.x, 640); g.lineTo(ox + p.x + Math.sin(p.ang) * 300, 640 - Math.cos(p.ang) * 300); g.stroke(); g.setLineDash([]); }
      if (p.st === 'pos' || p.st === 'aim') { g.fillStyle = '#6b6b78'; g.beginPath(); g.arc(ox + p.x, 640, 18, 0, 7); g.fill(); }
      MGH.av(g, m, i, ox + p.x - 34, 672, 18, p.st === 'done' ? (p.down >= 8 ? 'cheer' : p.down >= 5 ? 'happy' : 'hurt') : 'determined', { look: { x: 0.3, y: -1 } });
    });
  },
});

// 49 ---------------------------------------------------------------- Mine Cart Rush
MG.def({
  id: 'minecart', name: 'Mine Cart Rush', type: 'Race', controls: 'Left/Right + button', dur: 35,
  how: 'Your cart races down the mine. At each fork a sign shows which way is safe — press LEFT or RIGHT before you reach it. Press the button to jump over broken track. A crash costs you precious time.',
  wins: 'Furthest distance.',
  init(m, S) {
    S.ev = []; let d = 500;
    while (d < 16000) { if (Math.random() < 0.55) S.ev.push({ d, type: 'fork', safe: R.pick(['left', 'right']) }); else S.ev.push({ d, type: 'gap' }); d += R.range(380, 560); }
    S.p = [0, 1, 2, 3].map(() => ({ d: 0, v: 330, choice: null, air: 0, crash: 0, done: new Set(), side: 0, rx: R.range(0.18, 0.35) }));
  },
  update(m, S, dt) {
    S.p.forEach((p, i) => {
      if (p.crash > 0) { p.crash -= dt; return; }
      if (m.pressed(i, 'left')) p.choice = 'left'; if (m.pressed(i, 'right')) p.choice = 'right';
      if (m.pressed(i, 'a') && p.air <= 0) { p.air = 0.55; }
      p.air -= dt;
      p.v = Math.min(560, p.v + 6 * dt);
      p.d += p.v * dt;
      p.side = lerp(p.side, 0, dt * 2);
      S.ev.forEach((e, k) => {
        if (p.done.has(k) || p.d < e.d) return;
        p.done.add(k);
        if (e.type === 'fork') {
          if (p.choice !== e.safe) { p.crash = 1.3; p.v *= 0.7; MGH.burst(i * 320 + 160, 520, ['#8a7765', '#ffd34d', '#555'], 26, { speed: 300 }); MGH.shake(6); if (!m.bot(i)) Sfx.boom(); }
          else { p.side = e.safe === 'left' ? -1 : 1; MGH.burst(i * 320 + 160, 520, ['#ffe680'], 8, { speed: 140, kind: 'spark', size: 2 }); }
          p.choice = null;
        } else if (p.air <= 0) { p.crash = 1.1; p.v *= 0.75; MGH.burst(i * 320 + 160, 540, ['#8a7765', '#555'], 22, { speed: 260 }); if (!m.bot(i)) Sfx.bad(); }
      });
    });
  },
  bot(m, S, i) {
    const p = S.p[i], v = m.vin[i]; v.left = v.right = v.a = false;
    const e = S.ev.find((e, k) => !p.done.has(k));
    if (!e) return;
    const tt = (e.d - p.d) / p.v;
    if (e.type === 'fork' && tt < 0.9 && !p.choice) { const right = Math.random() < 0.9 ? e.safe : (e.safe === 'left' ? 'right' : 'left'); v[right] = true; }
    if (e.type === 'gap' && tt < p.rx && p.air <= 0) v.a = true;
  },
  score(m, S) { return S.p.map(p => p.d); },
  fmt(s) { return Math.round(s / 10) + ' m'; },
  hud(m, S, i) { return Math.round(S.p[i].d / 10) + 'm'; },
  draw(m, S, g) {
    MGH.bg(g, '#2a1d12', '#0a0603'); MGH.lanes(g, m);
    S.p.forEach((p, i) => {
      const ox = i * 320, cx = ox + 160, yC = 520;
      // lantern posts
      for (let k = 0; k < 8; k++) { const y = ((k * 110 + p.d * 0.9) % 880) - 120; g.fillStyle = 'rgba(255,190,90,0.18)'; g.beginPath(); g.arc(ox + 30, y, 26, 0, 7); g.arc(ox + 290, y + 55, 26, 0, 7); g.fill(); }
      const rails = (x1, x2, y1, y2) => { g.strokeStyle = '#8a8a96'; g.lineWidth = 4; g.beginPath(); g.moveTo(x1 - 22, y1); g.lineTo(x2 - 22, y2); g.moveTo(x1 + 22, y1); g.lineTo(x2 + 22, y2); g.stroke(); };
      rails(cx, cx, 40, 720);
      for (let y = (p.d % 40) + 40; y < 720; y += 40) { g.fillStyle = '#5a3d22'; g.fillRect(cx - 32, y, 64, 8); }
      S.ev.forEach((e, k) => {
        const y = yC - (e.d - p.d); if (y < 0 || y > 760) return;
        if (e.type === 'fork') {
          rails(cx, cx - 110, y, y - 160); rails(cx, cx + 110, y, y - 160);
          const sy = y + 70;
          if (sy < 760) {
            g.fillStyle = '#3a2a1c'; MGH.rr(g, cx - 70, sy - 30, 140, 34, 6); g.fill();
            MGH.text(g, e.safe === 'left' ? '✔ ◀   ▶ 💀' : '💀 ◀   ▶ ✔', cx, sy - 6, 18, '#fff', 'center', 'bold');
          }
        } else { g.fillStyle = '#0a0603'; g.fillRect(cx - 40, y - 26, 80, 30); MGH.text(g, '⚠️', cx + 60, y - 4, 18, '#fff'); }
      });
      const air = p.air > 0 ? Math.sin((0.55 - p.air) / 0.55 * Math.PI) : 0;
      const sx = cx + p.side * 30 + (p.crash > 0 ? Math.sin(m.t * 40) * 6 : 0);
      g.fillStyle = 'rgba(0,0,0,0.4)'; g.beginPath(); g.ellipse(sx, yC + 26, 34, 10, 0, 0, 7); g.fill();
      g.save(); g.translate(sx, yC - air * 30); g.scale(1 + air * 0.15, 1 + air * 0.15);
      g.fillStyle = '#6b4a2a'; MGH.rr(g, -32, -10, 64, 36, 6); g.fill(); g.strokeStyle = '#3a2a1c'; g.lineWidth = 3; g.stroke();
      g.restore();
      MGH.av(g, m, i, sx, yC - 20 - air * 30, 17, p.crash > 0 ? 'dizzy' : p.air > 0 ? 'cheer' : 'determined', { noFeet: true, look: { x: p.choice === 'left' ? -1 : p.choice === 'right' ? 1 : 0, y: -1 } });
      if (p.choice) MGH.text(g, p.choice === 'left' ? '◀' : '▶', sx + (p.choice === 'left' ? -50 : 50), yC - 10, 26, m.players[i].color, 'center', 'bold');
    });
  },
});

// 50 ---------------------------------------------------------------- Fourfold Tug
MG.def({
  id: 'tug', name: 'Fourfold Tug', type: 'Rhythm', controls: '1 button', dur: 40, mouseA: true,
  how: 'Four ropes, one knot. A drum beats steadily — press the button exactly on the beat for a mighty pull (near the beat is a small pull, off-beat makes you slip). Drag the knot into your own circle.',
  wins: 'Knot in your circle, else closest.',
  init(m, S) {
    S.k = { x: 640, y: 385, vx: 0, vy: 0 };
    S.anchor = [[640, 690], [140, 385], [640, 80], [1140, 385]];
    S.beat = 0.62; S.slip = [0, 0, 0, 0]; S.flash = [0, 0, 0, 0]; S.lastBeat = -1; S.tag = ['', '', '', ''];
    S.bt = [0, 0, 0, 0].map(() => R.range(0.02, 0.07));
  },
  update(m, S, dt) {
    const k = Math.round(m.t / S.beat);
    if (Math.floor(m.t / S.beat) !== S.lastBeat) { S.lastBeat = Math.floor(m.t / S.beat); Sfx.tone(120, 0.12, 'sine', 0.12); S.pulse = 0.15; }
    S.pulse -= dt;
    for (let i = 0; i < 4; i++) {
      S.slip[i] -= dt; S.flash[i] -= dt;
      if (!m.pressed(i, 'a') || S.slip[i] > 0) continue;
      const off = Math.abs(m.t - k * S.beat);
      const a = S.anchor[i], dx = a[0] - S.k.x, dy = a[1] - S.k.y, d = Math.hypot(dx, dy) || 1;
      let f = 0;
      if (off < 0.06) { f = 95; S.tag[i] = 'PERFECT'; MGH.burst(S.k.x, S.k.y, [m.players[i].color, '#fff'], 10, { speed: 160 }); }
      else if (off < 0.13) { f = 35; S.tag[i] = 'good'; }
      else { S.slip[i] = 0.45; S.tag[i] = 'slip!'; }
      S.flash[i] = 0.35;
      S.k.vx += dx / d * f; S.k.vy += dy / d * f;
    }
    S.k.x += S.k.vx * dt; S.k.y += S.k.vy * dt; S.k.vx *= 1 - 2.5 * dt; S.k.vy *= 1 - 2.5 * dt;
    S.k.x = clamp(S.k.x, 160, 1120); S.k.y = clamp(S.k.y, 100, 670);
    for (let i = 0; i < 4; i++) if (dist(S.k.x, S.k.y, S.anchor[i][0], S.anchor[i][1]) < 120) { MGH.burst(S.k.x, S.k.y, [m.players[i].color, '#ffe680'], 50, { speed: 400 }); m.finish(this.score(m, S)); break; }
  },
  bot(m, S, i) {
    const v = m.vin[i]; v.a = false;
    if (!S.err) S.err = [0, 0, 0, 0];
    const kb = Math.round(m.t / S.beat) * S.beat;
    if (Math.abs(m.t - (kb + S.err[i])) < 0.017 && S.slip[i] <= 0) { v.a = !m.prev[i].a; S.err[i] = Math.random() < 0.15 ? R.range(-0.16, 0.16) : R.range(-0.07, 0.07); }
  },
  score(m, S) { return S.anchor.map(a => -dist(S.k.x, S.k.y, a[0], a[1])); },
  fmt(s) { return -s < 125 ? 'Pulled it home!' : `${Math.round(-s)} px away`; },
  hud(m, S, i) { return S.tag[i]; },
  draw(m, S, g) {
    MGH.bg(g, '#2a1a10', '#0d0805');
    g.strokeStyle = 'rgba(255,230,128,0.25)'; g.lineWidth = 2; g.beginPath(); g.arc(640, 385, 60 + Math.max(0, S.pulse || 0) * 300, 0, 7); g.stroke();
    for (let i = 0; i < 4; i++) {
      const a = S.anchor[i], p = m.players[i];
      g.strokeStyle = p.color; g.lineWidth = 3; g.globalAlpha = 0.6; g.beginPath(); g.arc(a[0], a[1], 120, 0, 7); g.stroke(); g.globalAlpha = 1;
      g.strokeStyle = '#d9c7a8'; g.lineWidth = 7; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(S.k.x, S.k.y); g.stroke();
      const lean = S.flash[i] > 0 ? 10 : 0, dx = a[0] - S.k.x, dy = a[1] - S.k.y, d = Math.hypot(dx, dy) || 1;
      MGH.av(g, m, i, a[0] + dx / d * lean, a[1] + dy / d * lean, 30, S.slip[i] > 0 ? 'dizzy' : S.flash[i] > 0 ? 'determined' : 'happy', { look: { x: -dx / d, y: -dy / d } });
      if (S.flash[i] > 0) MGH.text(g, S.tag[i], a[0], a[1] - 50, 20, S.tag[i] === 'PERFECT' ? '#ffe680' : S.tag[i] === 'good' ? '#9fd8ff' : '#ff6b6b', 'center', 'bold');
    }
    g.fillStyle = '#ffd34d'; g.beginPath(); g.arc(S.k.x, S.k.y, 20, 0, 7); g.fill(); g.strokeStyle = '#a8790a'; g.lineWidth = 4; g.stroke();
    const ph = (m.t % S.beat) / S.beat;
    g.fillStyle = 'rgba(255,255,255,0.1)'; g.fillRect(540, 700, 200, 12); g.fillStyle = ph < 0.1 || ph > 0.9 ? '#ffe680' : '#888'; g.fillRect(540 + ph * 200 - 4, 696, 8, 20);
  },
});
