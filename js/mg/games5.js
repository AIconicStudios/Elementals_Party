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
    const low = 1 - h; // 1 when sweeping at the feet
    g.save(); g.lineCap = 'round';
    g.shadowColor = front ? '#ffef7a' : 'rgba(0,0,0,0)'; g.shadowBlur = front ? 18 + low * 20 : 0;
    g.strokeStyle = front ? `rgb(255,${200 - low * 120},${60 - low * 40})` : 'rgba(120,90,60,0.65)'; g.lineWidth = front ? 11 : 6;
    g.beginPath(); g.moveTo(150, y0); g.quadraticCurveTo(640, cy, 1130, y0); g.stroke();
    if (front) { g.shadowBlur = 0; g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 3; g.setLineDash([14, 18]); g.lineDashOffset = -this._t * 120; g.beginPath(); g.moveTo(150, y0); g.quadraticCurveTo(640, cy, 1130, y0); g.stroke(); g.setLineDash([]); }
    g.restore();
  },
  draw(m, S, g) {
    this._t = m.t;
    MGH.scene(g, 'meadow', m.t);
    g.fillStyle = MGH.grad(g, this.ground, 720, ['#6fbf4a', '#4a8a30']); g.fillRect(0, this.ground + 6, 1280, 200);
    // the rope's shadow & a warning glow on the ground as it comes round to your feet
    const warn = ph => { const a = ((ph % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2); return a < Math.PI ? clamp(1 - (Math.PI - a) / 1.6, 0, 1) : 0; };
    const wv = Math.max(warn(S.ph), S.ph2 !== null ? warn(S.ph2) : 0);
    if (wv > 0) { g.fillStyle = `rgba(255,${200 - wv * 150},60,${0.15 + wv * 0.55})`; MGH.rr(g, 180, this.ground - 4, 920, 16, 8); g.fill(); MGH.glow(g, 640, this.ground, 500 * wv, `rgba(255,140,60,${0.25 * wv})`); }
    if (wv > 0.82) MGH.label(g, 'JUMP!', 640, 200, 44, '#ffe680');
    this.drawRope(g, S.ph, false); if (S.ph2 !== null) this.drawRope(g, S.ph2, false);
    [130, 1150].forEach((x, k) => Char.draw(g, x, 500, 34, -1, '#b9bcc8', { hat: 'helmet', mood: 'determined', seed: k, look: { x: k ? -1 : 1, y: 0 } }));
    S.p.forEach((p, i) => {
      g.fillStyle = 'rgba(0,0,0,0.28)'; g.beginPath(); g.ellipse(p.x, this.ground + 4, 26 - p.h * 0.1, 7, 0, 0, 7); g.fill();
      MGH.av(g, m, i, p.x, this.ground - 30 - p.h, 30, !p.alive ? 'out' : p.h > 20 ? 'cheer' : (wv > 0.6 ? 'scared' : 'determined'), { noFeet: false, alpha: p.alive ? 1 : 0.5 });
    });
    this.drawRope(g, S.ph, true); if (S.ph2 !== null) this.drawRope(g, S.ph2, true);
    MGH.label(g, `Rope speed ${'▮'.repeat(Math.round(S.w))}`, 640, 92, 20, '#fff');
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
    S.notes.forEach((n, k) => { if (!S.played.has(k) && m.t >= n.t) { S.played.add(k); Sfx.drum(4, 0.6); } });
    if (Math.floor(m.t / 0.42) !== Math.floor((m.t - dt) / 0.42) && m.t > 1.5 && m.t < S.end - 1) Sfx.drum(Math.floor(m.t / 0.42) % 2 ? 1 : 0, 0.35);
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
          S.fb[i] = { s: perfect ? 'PERFECT' : 'good', t: 0.4 }; S.hitT = S.hitT || [0, 0, 0, 0]; S.hitT[i] = m.t;
          if (!m.bot(i)) { Sfx.drum([0, 1, 2][l], 1); if (perfect && S.combo[i] % 8 === 0) Sfx.drum(3, 0.8); }
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
    MGH.scene(g, 'stage', m.t);
    const cols = ['#6bb0ff', '#ffd34d', '#ff6b9a'], lab = ['◀', '●', '▶'], beat = (m.t / 0.42) % 1;
    for (let i = 0; i < 4; i++) {
      const ox = i * 320 + 25, p = m.players[i];
      g.fillStyle = 'rgba(0,0,0,0.35)'; MGH.rr(g, ox, 40, 270, 520, 16); g.fill();
      for (let l = 0; l < 3; l++) {
        const x = ox + 45 + l * 90, press = m.held(i, this.keys[l]);
        g.fillStyle = `rgba(255,255,255,${0.04 + (press ? 0.12 : 0)})`; g.fillRect(x - 32, 40, 64, 520);
        // drum pad
        MGH.drum(g, x, 506, 34, cols[l], press ? 1 : 0); MGH.text(g, lab[l], x, 514 + (press ? 2 : 0), 16, '#5a3a20', 'center', 'bold');
        if (press) MGH.glow(g, x, 512, 60, cols[l], 0.6);
      }
      g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 3; g.beginPath(); g.moveTo(ox + 5, 512); g.lineTo(ox + 265, 512); g.stroke();
      S.notes.forEach((n, k) => {
        const st = S.hit[i].get(k); if (st > 0) return;
        const y = 512 - (n.t - m.t) * 420; if (y < 30 || y > 560) return;
        const x = ox + 45 + n.lane * 90;
        g.globalAlpha = st === 0 ? 0.25 : 1;
        MGH.glow(g, x, y, 36, cols[n.lane], 0.5);
        g.fillStyle = MGH.grad(g, y - 22, y + 22, [Char.shade(cols[n.lane], 0.4), cols[n.lane]]); g.beginPath(); g.arc(x, y, 22, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 3; g.stroke();
        g.globalAlpha = 1;
      });
      const fb = S.fb[i];
      if (fb.t > 0) MGH.label(g, fb.s, ox + 135, 470 - (0.4 - fb.t) * 60, 22, fb.s === 'miss' ? '#ff6b6b' : fb.s === 'good' ? '#9fd8ff' : '#ffe680');
      // the drummer dances: bounces on every beat, jumps and spins on hits
      const since = S.hitT ? m.t - S.hitT[i] : 9, hop = Math.max(0, 1 - beat / 0.3) * 12 + Math.max(0, 1 - since / 0.25) * 18;
      g.save(); g.translate(ox + 135, 648 - hop); g.rotate(Math.sin(m.t * 4.5 + i) * 0.18 + (since < 0.25 ? (1 - since / 0.25) * 0.3 : 0));
      MGH.av(g, m, i, 0, 0, 26, fb.t > 0 ? (fb.s === 'miss' ? 'hurt' : 'cheer') : 'happy', { look: { x: Math.sin(m.t * 2 + i), y: -0.5 } });
      g.restore();
      if (S.combo[i] >= 5) MGH.label(g, `🔥 ${S.combo[i]} combo!`, ox + 135, 80, 18, '#ffe680');
    }
  },
});

// 44 ---------------------------------------------------------------- Comet Trails
MG.def({
  id: 'comet', name: 'Comet Trails', type: 'Arena', controls: 'Move + button',
  how: 'You are a comet that never stops, leaving a burning trail. Steer with the arrows / stick: up, down, left or right (no reversing into yourself). Press the button for a short burst of speed (recharges in 3 s). Hit a wall or any trail and you burn out.',
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
      for (const [k, dx, dy] of [['left', -1, 0], ['right', 1, 0], ['up', 0, -1], ['down', 0, 1]]) if (m.pressed(i, k) && !(dx === -p.dx && dy === -p.dy)) { p.dx = dx; p.dy = dy; }
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
    const p = S.p[i], v = m.vin[i]; v.left = v.right = v.up = v.down = v.a = false; if (!p.alive) return;
    const nameOf = (dx, dy) => dx < 0 ? 'left' : dx > 0 ? 'right' : dy < 0 ? 'up' : 'down';
    const run = (dx, dy) => { let n = 0, x = p.x, y = p.y; while (n < 40) { x += dx; y += dy; if (!this.free(S, x, y)) break; n++; } return n; };
    const ahead = run(p.dx, p.dy), l = run(p.dy, -p.dx), r = run(-p.dy, p.dx);
    if (!S.botMem) S.botMem = [0, 0, 0, 0];
    S.botMem[i]--;
    if (ahead < 4 || (S.botMem[i] <= 0 && Math.random() < 0.02 && Math.max(l, r) > ahead + 6)) {
      if (Math.max(l, r) > ahead) { const nd = l >= r ? [p.dy, -p.dx] : [-p.dy, p.dx], nm = nameOf(nd[0], nd[1]); v[nm] = !m.prev[i][nm]; S.botMem[i] = 12; }
    }
    if (ahead > 25 && p.cd <= 0 && Math.random() < 0.01) v.a = true;
  },
  score(m, S) { return S.p.map(p => p.alive ? 1000 : p.outT); },
  fmt(s) { return s >= 1000 ? 'Still burning' : `burnt out at ${s.toFixed(1)}s`; },
  hud(m, S, i) { return S.p[i].alive ? (S.p[i].cd > 0 ? 'boost ' + Math.ceil(S.p[i].cd) : 'boost ready') : 'out'; },
  draw(m, S, g) {
    MGH.scene(g, 'space', m.t);
    g.strokeStyle = 'rgba(120,100,255,0.07)'; g.lineWidth = 1;
    for (let x = 0; x <= 1280; x += 40) { g.beginPath(); g.moveTo(x, 40); g.lineTo(x, 720); g.stroke(); }
    for (let y = 40; y <= 720; y += 40) { g.beginPath(); g.moveTo(0, y); g.lineTo(1280, y); g.stroke(); }
    g.strokeStyle = 'rgba(160,140,255,0.6)'; g.lineWidth = 3; g.strokeRect(1, 41, 1278, 678);
    g.save(); g.shadowBlur = 12;
    for (let y = 0; y < S.H; y++) for (let x = 0; x < S.W; x++) {
      const o = S.grid[y * S.W + x]; if (o < 0) continue;
      g.fillStyle = m.players[o].color; g.shadowColor = m.players[o].color; g.globalAlpha = S.p[o].alive ? 0.85 + 0.15 * Math.sin(m.t * 6 + x * 0.3 + y * 0.3) : 0.3;
      g.fillRect(x * S.cs + 1, 40 + y * S.cs + 1, S.cs - 2, S.cs - 2);
    }
    g.restore(); g.globalAlpha = 1;
    S.p.forEach((p, i) => { if (!p.alive) return; const X = (p.x + 0.5) * S.cs, Y = 40 + (p.y + 0.5) * S.cs; MGH.glow(g, X, Y, 40, m.players[i].color); MGH.fireball(g, X - p.dx * 6, Y - p.dy * 6, 9, m.t, p.dx, p.dy, ['#fff', m.players[i].color, '#ff3d1f']); MGH.av(g, m, i, X, Y, 13, p.boost > 0 ? 'cheer' : 'determined', { noFeet: true, noArms: true, look: { x: p.dx, y: p.dy } }); });
  },
});

// 45 ---------------------------------------------------------------- Elemental Pong
MG.def({
  id: 'pong', name: 'Elemental Pong', type: 'Arena', controls: 'Move + button',
  how: 'Each player guards one side of the court. Top and bottom players slide their paddle with LEFT/RIGHT; players on the side walls slide theirs with UP/DOWN. Press the button to smash — a ball hit mid-smash flies much faster. Let a ball past and you lose a heart; at zero your side becomes a wall.',
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
      // bottom/top paddles slide with LEFT/RIGHT; the side-wall paddles slide with UP/DOWN (LEFT/RIGHT still works there too)
      const ax = m.axis(i), side = i === 1 || i === 3;
      const mv = side ? (Math.abs(ax.y) > 0.2 ? ax.y : ax.x) : ax.x;
      P.pos = clamp(P.pos + mv * 1.15 * dt, 0.1, 0.9);
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
          // the rally speed creeps up slowly over the match; a smash only speeds up that one shot
          let sp = Math.min(600, 270 + m.t * 5); if (S.pad[i].smash > 0) { sp *= 1.35; MGH.shake(5); MGH.burst(b.x, b.y, [m.players[i].color, '#fff'], 16, { speed: 260, kind: 'spark', size: 3 }); }
          sp = Math.min(sp, 800);
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
    MGH.scene(g, 'night', m.t);
    MGH.glow(g, S.x0 + S.sz / 2, S.y0 + S.sz / 2, S.sz * 0.8, 'rgba(120,100,255,0.25)');
    g.fillStyle = MGH.grad(g, S.y0, S.y0 + S.sz, ['#14204a', '#0a1028']); g.fillRect(S.x0, S.y0, S.sz, S.sz);
    g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = 2; g.setLineDash([10, 10]); g.beginPath(); g.moveTo(S.x0, S.y0); g.lineTo(S.x0 + S.sz, S.y0 + S.sz); g.moveTo(S.x0 + S.sz, S.y0); g.lineTo(S.x0, S.y0 + S.sz); g.stroke(); g.setLineDash([]);
    g.strokeStyle = 'rgba(255,255,255,0.15)'; g.beginPath(); g.arc(S.x0 + S.sz / 2, S.y0 + S.sz / 2, 60, 0, 7); g.stroke();
    MGH.emoji(g, '✦', S.x0 + S.sz / 2, S.y0 + S.sz / 2, 30, m.t);
    for (let i = 0; i < 4; i++) {
      const p = m.players[i], q = this.padXY(S, i), alive = S.hp[i] > 0;
      const s = [[S.x0, S.y0 + S.sz, S.x0 + S.sz, S.y0 + S.sz], [S.x0, S.y0, S.x0, S.y0 + S.sz], [S.x0, S.y0, S.x0 + S.sz, S.y0], [S.x0 + S.sz, S.y0, S.x0 + S.sz, S.y0 + S.sz]][i];
      g.save(); g.shadowColor = alive ? p.color : '#000'; g.shadowBlur = alive ? 14 : 0; g.lineWidth = 6; g.strokeStyle = alive ? p.color : '#555'; g.beginPath(); g.moveTo(s[0], s[1]); g.lineTo(s[2], s[3]); g.stroke(); g.restore();
      if (!alive) { g.fillStyle = 'rgba(120,120,140,0.6)'; if (i % 2 === 0) g.fillRect(s[0], s[1] - 6, S.sz, 12); else g.fillRect(s[0] - 6, s[1], 12, S.sz); continue; }
      const sm = S.pad[i].smash > 0;
      g.save(); g.shadowColor = sm ? '#fff' : p.color; g.shadowBlur = sm ? 30 : 12;
      g.fillStyle = sm ? '#fff' : MGH.grad(g, q.y - 9, q.y + 9, [Char.shade(p.color, 0.4), p.color]);
      if (q.hor) MGH.rr(g, q.x - 70, q.y - 9, 140, 18, 9); else MGH.rr(g, q.x - 9, q.y - 70, 18, 140, 9);
      g.fill(); g.restore();
      const cpos = [[S.x0 + S.sz / 2, S.y0 + S.sz + 38], [S.x0 - 50, S.y0 + S.sz / 2], [S.x0 + S.sz / 2, S.y0 - 30], [S.x0 + S.sz + 50, S.y0 + S.sz / 2]][i];
      MGH.av(g, m, i, cpos[0] + (i % 2 === 0 ? (q.x - S.x0 - S.sz / 2) * 0.3 : 0), cpos[1] + (i % 2 ? (q.y - S.y0 - S.sz / 2) * 0.3 : 0), 20, sm ? 'angry' : 'determined', { noFeet: true });
      MGH.text(g, '❤️'.repeat(S.hp[i]), cpos[0], cpos[1] + (i === 2 ? -22 : 40), 14, '#fff', 'center');
    }
    for (const b of S.balls) {
      const c = b.last >= 0 ? m.players[b.last].color : '#ffffff';
      for (let k = 1; k < 6; k++) { g.globalAlpha = 0.12 * (6 - k); g.fillStyle = c; g.beginPath(); g.arc(b.x - b.vx * 0.012 * k, b.y - b.vy * 0.012 * k, 11 - k, 0, 7); g.fill(); } g.globalAlpha = 1;
      MGH.glow(g, b.x, b.y, 34, c); g.fillStyle = '#fff'; g.beginPath(); g.arc(b.x, b.y, 11, 0, 7); g.fill();
    }
  },
});

// 46 ---------------------------------------------------------------- Swing Across
MG.def({
  id: 'swing', name: 'Swing Across', type: 'Race', controls: '1 button', mouseA: true,
  how: 'Cross the chasm vine after vine. Every vine swings by itself — you ride it the moment you grab on. Your only job is WHEN to leap: press the button as your vine swings forward and fly to the next one (you catch it automatically if you reach it). The dotted line shows where you would fly. Miss and you splash down, then climb back onto your last vine.',
  wins: 'First across (else furthest).',
  GR: 900,
  init(m, S) {
    S.ropes = []; let x = 140;
    for (let k = 0; k < 13; k++) { const L = R.range(150, 195); S.ropes.push({ x, L, A: R.range(0.62, 0.82), w: Math.sqrt(this.GR / L), ph: R.range(0, 6.28) }); x += R.range(215, 255); }
    // every gap must be catchable: pull the next vine closer until a comfortable timing window exists
    for (let k = 0; k < S.ropes.length - 1; k++) {
      for (let tries = 0; tries < 12; tries++) {
        const P = { rope: k, l: S.ropes[k].L * 0.88, fly: false, fall: 0 }; let ok = 0, n = 0;
        for (let t = 0; t < 6; t += 0.05) { n++; if (this.predict(S, P, t).hit > k) ok++; }
        if (ok / n >= 0.14) break;
        for (let j = k + 1; j < S.ropes.length; j++) S.ropes[j].x -= 14;
      }
    }
    S.goal = S.ropes[S.ropes.length - 1].x;
    S.p = [0, 1, 2, 3].map(() => ({ rope: 0, l: S.ropes[0].L, fly: false, x: 0, y: 0, vx: 0, vy: 0, fin: 0, fall: 0, best: 0, grabT: 0, botP: R.range(0.55, 0.9) }));
  },
  // every vine is its own pendulum: angle and angular speed at time t
  ang(r, t) { return r.A * Math.sin(r.w * t + r.ph); },
  angV(r, t) { return r.A * r.w * Math.cos(r.w * t + r.ph); },
  tip(r, l, t) { const a = this.ang(r, t); return { x: r.x + Math.sin(a) * l, y: 20 + Math.cos(a) * l }; },
  pos(S, p, t) { if (p.fly || p.fall > 0) return { x: p.x, y: p.y }; return this.tip(S.ropes[p.rope], p.l, t); },
  // leap velocity: the vine's own swing speed plus a little jump forward and up
  leapV(S, p, t) { const r = S.ropes[p.rope], a = this.ang(r, t), av = this.angV(r, t); return { vx: Math.cos(a) * av * p.l + 140, vy: -Math.sin(a) * av * p.l - 280 }; },
  // can a flyer at (x, y) grab vine r at time t? (anywhere on its lower two-thirds)
  grab(r, x, y, t) {
    const a = this.ang(r, t), sx = Math.sin(a), cy = Math.cos(a), dx = x - r.x, dy = y - 20;
    const along = dx * sx + dy * cy, off = Math.abs(dx * cy - dy * sx);
    return along > r.L * 0.35 && along < r.L + 18 && off < 30 ? Math.min(r.L, along) : 0;
  },
  update(m, S, dt) {
    const t = m.t;
    S.p.forEach((p, i) => {
      if (p.fin) return;
      p.grabT -= dt;
      if (p.fall > 0) { p.fall -= dt; if (p.fall <= 0) { p.l = S.ropes[p.rope].L; p.grabT = 0.5; } return; }
      if (!p.fly) {
        if (m.pressed(i, 'a') && p.grabT <= 0 && p.rope < S.ropes.length - 1) {
          const q = this.pos(S, p, t), v = this.leapV(S, p, t);
          p.fly = true; p.x = q.x; p.y = q.y; p.vx = v.vx; p.vy = v.vy; if (!m.bot(i)) Sfx.whoosh();
        }
      } else {
        p.vy += this.GR * dt; p.x += p.vx * dt; p.y += p.vy * dt;
        for (let k = p.rope + 1; k < Math.min(S.ropes.length, p.rope + 3); k++) {
          const l = this.grab(S.ropes[k], p.x, p.y, t);
          if (l) {
            p.fly = false; p.rope = k; p.l = Math.max(l, S.ropes[k].L * 0.88); p.grabT = 0.25; // slide down near the end of the vine Sfx.tone(520 + k * 20, 0.08, 'triangle', 0.04);
            if (k === S.ropes.length - 1) { p.fin = t; Sfx.star(); }
            break;
          }
        }
        if (p.y > 360) { p.fly = false; p.fall = 1; if (!m.bot(i)) Sfx.tone(200, 0.3, 'sine', 0.05, -100); }
      }
      p.best = Math.max(p.best, p.rope);
    });
    if (S.p.some(p => p.fin) || m.t > 70) m.finish(this.score(m, S));
  },
  // where a leap right now would land: the vine index caught, or -1
  predict(S, p, t) {
    const q = this.pos(S, p, t), v = this.leapV(S, p, t); let x = q.x, y = q.y, vx = v.vx, vy = v.vy, tt = t;
    const pts = [];
    for (let k = 0; k < 90; k++) {
      vy += this.GR / 60; x += vx / 60; y += vy / 60; tt += 1 / 60; pts.push(x, y);
      for (let j = p.rope + 1; j < Math.min(S.ropes.length, p.rope + 3); j++) if (this.grab(S.ropes[j], x, y, tt)) return { hit: j, pts };
      if (y > 360) break;
    }
    return { hit: -1, pts };
  },
  bot(m, S, i) {
    const p = S.p[i], v = m.vin[i]; v.a = false;
    if (p.fly || p.fin || p.fall > 0 || p.grabT > 0) return;
    if (this.predict(S, p, m.t).hit > p.rope && Math.random() < p.botP * 0.12) v.a = true;
  },
  score(m, S) { return S.p.map(p => p.fin ? 1000 - p.fin : p.best + this.pos(S, p, m.t).x / 10000); },
  fmt(s) { return s >= 100 ? 'Across!' : `vine ${Math.floor(s) + 1}`; },
  hud(m, S, i) { return `vine ${S.p[i].rope + 1}/${S.ropes.length}`; },
  draw(m, S, g) {
    const t = m.t;
    for (let i = 0; i < 4; i++) {
      const ox = (i % 2) * 640, oy = 40 + Math.floor(i / 2) * 340, p = S.p[i];
      const me = this.pos(S, p, t);
      p.cam = lerp(p.cam === undefined ? 0 : p.cam, clamp(me.x - 220, 0, S.goal - 460), 0.12); const cam = p.cam;
      g.save(); g.beginPath(); g.rect(ox, oy, 640, 340); g.clip();
      // jungle: warm sky, sun rays, layered hills and trees
      g.fillStyle = MGH.grad(g, oy, oy + 340, ['#ffe6a8', '#9fe0c8', '#3f8a5a']); g.fillRect(ox, oy, 640, 340);
      g.save(); g.globalAlpha = 0.18; g.fillStyle = '#fff8d0'; for (let k = 0; k < 4; k++) { const sx = ox + 120 + k * 150 - (cam * 0.05) % 150; g.beginPath(); g.moveTo(sx, oy); g.lineTo(sx + 40, oy); g.lineTo(sx - 60, oy + 340); g.lineTo(sx - 120, oy + 340); g.fill(); } g.restore();
      for (let k = 0; k < 10; k++) { const tx = ox + ((k * 140 - cam * 0.25) % 1400 + 1400) % 1400 - 100; g.fillStyle = 'rgba(60,130,80,0.45)'; g.beginPath(); g.ellipse(tx + 60, oy + 250, 110, 70, 0, 0, 7); g.fill(); }
      for (let k = 0; k < 8; k++) { const tx = ox + ((k * 170 - cam * 0.5) % 1360 + 1360) % 1360 - 100; g.fillStyle = '#3a6a3a'; g.fillRect(tx + 44, oy + 120, 14, 220); g.fillStyle = 'rgba(40,100,50,0.9)'; g.beginPath(); g.arc(tx + 50, oy + 120, 50, 0, 7); g.arc(tx + 20, oy + 140, 34, 0, 7); g.arc(tx + 82, oy + 140, 34, 0, 7); g.fill(); }
      g.translate(ox - cam, oy); g.scale(1, 0.85);
      // river far below
      g.fillStyle = MGH.grad(g, 330, 420, ['#2a8ad8', '#0a3a7a']); g.fillRect(cam, 340, 720, 100);
      for (let x = Math.floor(cam / 40) * 40; x < cam + 720; x += 40) { g.strokeStyle = 'rgba(255,255,255,0.4)'; g.lineWidth = 2; g.beginPath(); g.arc(x + (t * 30) % 40, 348, 8, Math.PI, 0); g.stroke(); }
      // canopy branch
      g.fillStyle = MGH.grad(g, 0, 18, ['#7a5230', '#4a3020']); g.fillRect(cam - 10, 0, 720, 16);
      for (let x = Math.floor(cam / 30) * 30; x < cam + 720; x += 30) MGH.emoji(g, '🍃', x, 14 + (x % 60 ? 4 : -2), 18, x);
      // start ledge
      MGH.plat(g, -60, 230, 180, 20, 'grass');
      S.ropes.forEach((r, k) => {
        if (r.x < cam - 260 || r.x > cam + 900) return;
        const e = this.tip(r, r.L, t), a = this.ang(r, t);
        const last = k === S.ropes.length - 1;
        g.strokeStyle = last ? '#ffd34d' : '#4f9a3a'; g.lineWidth = 6; g.lineCap = 'round';
        g.beginPath(); g.moveTo(r.x, 14); g.quadraticCurveTo((r.x + e.x) / 2 - Math.sin(a) * 12, (14 + e.y) / 2, e.x, e.y); g.stroke();
        g.strokeStyle = 'rgba(255,255,255,0.25)'; g.lineWidth = 2; g.beginPath(); g.moveTo(r.x + 2, 14); g.quadraticCurveTo((r.x + e.x) / 2 - Math.sin(a) * 12 + 2, (14 + e.y) / 2, e.x + 2, e.y); g.stroke();
        for (let s = 0.3; s < 1; s += 0.22) MGH.emoji(g, '🌿', lerp(r.x, e.x, s), lerp(14, e.y, s), 12, k + s);
        g.fillStyle = '#7a5230'; g.beginPath(); g.arc(r.x, 14, 7, 0, 7); g.fill();
      });
      // where you'd fly if you leapt now (green = you'd catch the next vine)
      if (!p.fly && p.fall <= 0 && !p.fin) {
        const pr = this.predict(S, p, t); g.fillStyle = pr.hit >= 0 ? 'rgba(140,255,140,0.85)' : 'rgba(255,255,255,0.5)';
        for (let k = 0; k < pr.pts.length; k += 6) { g.beginPath(); g.arc(pr.pts[k], pr.pts[k + 1], 3, 0, 7); g.fill(); }
      }
      const fx = S.ropes[S.ropes.length - 1].x; MGH.plat(g, fx + 40, 220, 200, 20, 'grass'); MGH.emoji(g, '🏁', fx + 110, 190, 34);
      if (p.fall <= 0) MGH.av(g, m, i, me.x, me.y + 6, 18, p.fin ? 'cheer' : p.fly ? 'cheer' : 'determined', { noFeet: true, look: { x: 1, y: 0 } });
      g.restore();
      if (p.fall > 0) MGH.label(g, 'Splash! Climbing back…', ox + 320, oy + 170, 22, '#fff');
      g.strokeStyle = m.players[i].color; g.lineWidth = 3; g.strokeRect(ox + 2, oy + 2, 636, 336);
      MGH.label(g, m.players[i].name, ox + 60, oy + 28, 15, m.players[i].color);
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
    for (let i = 0; i < 4; i++) {
      const top = 40 + i * 170, p = S.p[i], cam = p.x - 170;
      g.save(); g.beginPath(); g.rect(0, top, 1280, 170); g.clip();
      g.fillStyle = MGH.grad(g, top, top + 170, [['#5fb8ff', '#d8f2ff'], ['#ffb37a', '#ffe8c8'], ['#8fa8ff', '#e0e8ff'], ['#7fd8c0', '#e0fff4']][i]); g.fillRect(0, top, 1280, 170);
      for (let k = 0; k < 6; k++) MGH.cloud(g, ((k * 260 - cam * 0.3) % 1560 + 1560) % 1560 - 140, top + 30 + (k % 3) * 45, 18, 'rgba(255,255,255,0.6)');
      S.gates.forEach(gt => {
        const x = gt.x - cam; if (x < -60 || x > 1340) return;
        const cl = (y, h) => { g.fillStyle = 'rgba(255,255,255,0.95)'; MGH.rr(g, x - 24, y, 48, h, 18); g.fill(); for (let yy = y + 10; yy < y + h; yy += 22) MGH.cloud(g, x, yy, 12, 'rgba(240,248,255,1)'); g.strokeStyle = 'rgba(160,190,220,0.8)'; g.lineWidth = 2; MGH.rr(g, x - 24, y, 48, h, 18); g.stroke(); };
        cl(top, gt.gap); cl(top + gt.gap + gt.size, 170 - gt.gap - gt.size);
        if (gt.star) MGH.star(g, x, top + gt.gap + gt.size / 2, 11, '#ffd34d', m.t * 2);
      });
      if (p.boost > 0) for (let s = 1; s < 5; s++) { g.globalAlpha = 0.15; g.fillStyle = m.players[i].color; g.beginPath(); g.arc(170 - s * 14, top + p.y, 14, 0, 7); g.fill(); } g.globalAlpha = 1;
      MGH.av(g, m, i, 170, top + p.y, 16, p.stun > 0 ? 'dizzy' : p.boost > 0 ? 'cheer' : p.vy < 0 ? 'determined' : 'happy', { noFeet: true, look: { x: 1, y: p.vy / 400 } });
      MGH.emoji(g, '🪁', 150, top + p.y - 26, 22, -0.3 + p.vy / 1200);
      g.restore();
      MGH.label(g, m.players[i].name, 60, top + 24, 15, m.players[i].color);
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(0, top + 168, 1280, 3);
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
    MGH.scene(g, 'cave', m.t); MGH.lanes(g, m);
    S.p.forEach((p, i) => {
      const ox = i * 320;
      g.fillStyle = MGH.grad(g, 50, 690, ['#8a7a66', '#c9b48a', '#e0c89a']); g.fillRect(ox + 30, 50, 260, 640);
      for (let k = 0; k < 9; k++) { g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(ox + 30 + k * 29, 50, 2, 640); }
      g.fillStyle = '#3a2a1c'; g.fillRect(ox + 18, 50, 12, 640); g.fillRect(ox + 290, 50, 12, 640);
      for (let k = 0; k < 7; k++) { g.fillStyle = 'rgba(90,60,30,0.6)'; g.beginPath(); g.moveTo(ox + 160 + (k - 3) * 22, 480); g.lineTo(ox + 152 + (k - 3) * 22, 495); g.lineTo(ox + 168 + (k - 3) * 22, 495); g.fill(); }
      for (const pin of p.pins) { if (pin.gone) continue; MGH.pin(g, ox + pin.x, pin.y, 1.05, pin.down); }
      if (p.ball) { MGH.shadow(g, ox + p.ball.x, p.ball.y + 16, 16, 0.35); MGH.rock(g, ox + p.ball.x, p.ball.y, 19, i, '#7a7a88', -p.ball.y / 12); }
      if (p.st === 'aim') { g.strokeStyle = '#fff'; g.lineWidth = 3; g.setLineDash([8, 6]); g.beginPath(); g.moveTo(ox + p.x, 640); g.lineTo(ox + p.x + Math.sin(p.ang) * 300, 640 - Math.cos(p.ang) * 300); g.stroke(); g.setLineDash([]); }
      if (p.st === 'pos' || p.st === 'aim') MGH.rock(g, ox + p.x, 640, 19, i, '#7a7a88');
      MGH.av(g, m, i, ox + p.x - 34, 672, 18, p.st === 'done' ? (p.down >= 8 ? 'cheer' : p.down >= 5 ? 'happy' : 'hurt') : 'determined', { look: { x: 0.3, y: -1 } });
    });
  },
});

// 49 ---------------------------------------------------------------- Mine Cart Rush
MG.def({
  id: 'minecart', name: 'Mine Cart Rush', type: 'Race', controls: 'Left/Right + button', dur: 35,
  // what waits on the wrong branch: a rock slide, a lit TNT cart or a collapsed trestle
  hazard(g, x, y, kind, t) {
    if (kind === 0) { for (const [dx, dy, r, c] of [[-26, 4, 18, '#6a5a4a'], [22, 6, 20, '#5a4a3a'], [0, -12, 22, '#7a6a58'], [-10, -34, 14, '#8a7a68'], [16, -26, 13, '#6a5a4a']]) { const gr = g.createRadialGradient(x + dx - r * 0.3, y + dy - r * 0.4, 2, x + dx, y + dy, r); gr.addColorStop(0, '#b8a890'); gr.addColorStop(1, c); g.fillStyle = gr; g.beginPath(); g.arc(x + dx, y + dy, r, 0, 7); g.fill(); } for (let q = 0; q < 3; q++) { const qq = (t * 0.7 + q / 3) % 1; g.fillStyle = `rgba(160,140,120,${0.5 * (1 - qq)})`; g.beginPath(); g.arc(x - 20 + q * 20, y - 40 - qq * 40, 6 + qq * 10, 0, 7); g.fill(); } }
    else if (kind === 1) { g.fillStyle = '#4a3020'; MGH.rr(g, x - 30, y - 30, 60, 36, 5); g.fill(); g.fillStyle = '#2a2a2a'; g.beginPath(); g.arc(x - 18, y + 8, 7, 0, 7); g.arc(x + 18, y + 8, 7, 0, 7); g.fill(); for (let q = 0; q < 4; q++) { g.fillStyle = '#d8302a'; MGH.rr(g, x - 24 + q * 12, y - 50, 10, 26, 3); g.fill(); g.fillStyle = '#fff'; g.fillRect(x - 24 + q * 12, y - 42, 10, 4); } g.strokeStyle = '#3a2a1a'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y - 50); g.quadraticCurveTo(x + 10, y - 66, x + 18, y - 62); g.stroke(); const f = 0.7 + Math.sin(t * 30) * 0.3; MGH.glow(g, x + 18, y - 62, 16 * f, 'rgba(255,200,60,0.9)'); MGH.text(g, 'TNT', x, y - 14, 14, '#ffe680', 'center', 'bold'); }
    else { g.fillStyle = '#050302'; g.fillRect(x - 46, y - 26, 92, 44); g.strokeStyle = '#6a4a2a'; g.lineWidth = 6; for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(x + sd * 46, y - 20); g.lineTo(x + sd * 30, y - 2 + sd * 4); g.stroke(); g.beginPath(); g.moveTo(x + sd * 46, y + 12); g.lineTo(x + sd * 22, y + 22); g.stroke(); } MGH.text(g, '💀', x, y + 6, 22, '#fff'); }
  },
  how: 'Your cart races down the mine. At each fork one branch is blocked — a rock slide, a lit TNT cart or a collapsed track. Steer LEFT or RIGHT onto the clear branch before you reach it. Press the button to jump over broken track. A crash costs you precious time.',
  wins: 'Furthest distance.',
  init(m, S) {
    S.ev = []; let d = 500;
    while (d < 16000) { if (Math.random() < 0.55) S.ev.push({ d, type: 'fork', safe: R.pick(['left', 'right']) }); else S.ev.push({ d, type: 'gap' }); d += R.range(380, 560); }
    S.p = [0, 1, 2, 3].map(() => ({ d: 0, v: 330, choice: null, air: 0, crash: 0, done: new Set(), side: 0, path: {}, wrongAt: -1, rx: R.range(0.18, 0.35) }));
  },
  update(m, S, dt) {
    S.p.forEach((p, i) => {
      if (p.crash > 0) { p.crash -= dt; return; }
      if (m.pressed(i, 'left')) p.choice = 'left'; if (m.pressed(i, 'right')) p.choice = 'right';
      if (m.pressed(i, 'a') && p.air <= 0) { p.air = 0.55; }
      p.air -= dt;
      p.v = Math.min(560, p.v + 6 * dt);
      p.d += p.v * dt;
      if (p.wrongAt > 0 && p.d >= p.wrongAt) { p.wrongAt = -1; p.crash = 1.3; p.v *= 0.7; MGH.burst(i * 320 + 160 + this.off(S, p, p.d), 520, ['#8a7765', '#ffd34d', '#555'], 26, { speed: 300 }); MGH.shake(6); if (!m.bot(i)) Sfx.boom(); }
      S.ev.forEach((e, k) => {
        if (p.done.has(k) || p.d < e.d) return;
        p.done.add(k);
        if (e.type === 'fork') {
          // the cart really takes the branch: the safe one curves round the rock, the other runs into broken track
          const side = p.choice === e.safe ? (e.safe === 'left' ? -1 : 1) : (e.safe === 'left' ? 1 : -1); p.path[k] = side;
          if (p.choice !== e.safe) p.wrongAt = e.d + 170; else MGH.burst(i * 320 + 160, 520, ['#ffe680'], 8, { speed: 140, kind: 'spark', size: 2 });
          p.choice = null;
        } else if (p.air <= 0) { p.crash = 1.1; p.v *= 0.75; MGH.burst(i * 320 + 160, 540, ['#8a7765', '#555'], 22, { speed: 260 }); if (!m.bot(i)) Sfx.bad(); }
      });
    });
  },
  DET: 340,
  bump(u) { return u <= 0 || u >= 1 ? 0 : 0.5 - 0.5 * Math.cos(u * Math.PI * 2); },
  // how far left/right this player's track is at a distance along the mine
  off(S, p, d) { let x = 0; S.ev.forEach((e, k) => { if (e.type === 'fork' && p.path[k]) x += p.path[k] * 110 * this.bump((d - e.d) / this.DET); }); return x; },
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
    MGH.scene(g, 'cave', m.t); MGH.lanes(g, m);
    S.p.forEach((p, i) => {
      const ox = i * 320, cx = ox + 160, yC = 520;
      g.fillStyle = 'rgba(30,20,10,0.55)'; g.fillRect(ox + 10, 40, 300, 680);
      for (let k = 0; k < 6; k++) { const y = ((k * 140 + p.d * 0.9) % 840) - 60; MGH.gem(g, ox + 24, y, 7, ['#5fd8ff', '#ff6ad5', '#7cf06a'][k % 3], m.t); MGH.gem(g, ox + 296, y + 70, 6, ['#ffd34d', '#5fd8ff'][k % 2], m.t); }
      // lantern posts
      for (let k = 0; k < 8; k++) { const y = ((k * 110 + p.d * 0.9) % 880) - 120; g.fillStyle = 'rgba(255,190,90,0.18)'; g.beginPath(); g.arc(ox + 30, y, 26, 0, 7); g.arc(ox + 290, y + 55, 26, 0, 7); g.fill(); }
      const yAt = dd => yC - (dd - p.d), X = dd => cx + this.off(S, p, dd);
      const railLine = (fx, broken) => { for (const sd of [-22, 22]) { g.strokeStyle = '#3a3a44'; g.lineWidth = 7; g.beginPath(); let started = false; for (let y = 760; y >= 20; y -= 16) { const dd = p.d + (yC - y); if (broken && broken(dd)) { started = false; continue; } const x = fx(dd) + sd; if (!started) { g.moveTo(x, y); started = true; } else g.lineTo(x, y); } g.stroke(); g.strokeStyle = '#b8b8c8'; g.lineWidth = 3; g.stroke(); } };
      const ties = (fx, broken) => { for (let y = 760 - ((760 - yC + p.d) % 34); y >= 20; y -= 34) { const dd = p.d + (yC - y); if (broken && broken(dd)) continue; const x = fx(dd); g.fillStyle = '#5a3d22'; MGH.rr(g, x - 34, y - 4, 68, 9, 3); g.fill(); g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(x - 32, y - 4, 64, 2); } };
      // upcoming (and passed) forks: the other branch, plus a rock pillar between them
      S.ev.forEach((e, k) => { if (e.type !== 'fork') return; const y0 = yAt(e.d), y1 = yAt(e.d + this.DET); if (y1 > 800 || y0 < -40) return;
        const midY = yAt(e.d + this.DET / 2); g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(cx + 6, midY + 18, 60, 16, 0, 0, 7); g.fill(); const rg = g.createLinearGradient(cx - 50, 0, cx + 50, 0); rg.addColorStop(0, '#8a7a68'); rg.addColorStop(1, '#4a3e32'); g.fillStyle = rg; g.beginPath(); g.moveTo(cx - 50, midY + 20); g.quadraticCurveTo(cx - 56, midY - 70, cx - 14, midY - 96); g.quadraticCurveTo(cx + 30, midY - 110, cx + 50, midY - 40); g.lineTo(cx + 48, midY + 20); g.closePath(); g.fill(); MGH.gem(g, cx - 10, midY - 50, 8, '#5fd8ff', m.t);
        for (const sd of [-1, 1]) { if (p.path[k] === sd) continue; const bad = (sd < 0 ? 'left' : 'right') !== e.safe, fx = dd => cx + sd * 110 * this.bump((dd - e.d) / this.DET), brk = bad ? dd => dd > e.d + 150 && dd < e.d + 200 : null;
          g.save(); g.beginPath(); g.rect(ox, Math.min(760, y1), 320, Math.max(0, Math.min(760, y0) - y1)); g.clip(); ties(fx, brk); railLine(fx, brk); g.restore();
          if (bad) { const hx = fx(e.d + 172), by = yAt(e.d + 172), kind = k % 3; g.fillStyle = '#0a0603'; g.beginPath(); g.ellipse(hx, by + 14, 46, 22, 0, 0, 7); g.fill(); this.hazard(g, hx, by, kind, m.t);
            const sx = fx(e.d + 60) + sd * 46, sy = yAt(e.d + 60); g.fillStyle = '#5a3d22'; g.fillRect(sx - 3, sy - 44, 6, 44); g.save(); g.translate(sx, sy - 54); g.rotate(Math.PI / 4); g.fillStyle = '#ffcc1a'; g.fillRect(-15, -15, 30, 30); g.strokeStyle = '#2a1a0a'; g.lineWidth = 3; g.strokeRect(-15, -15, 30, 30); g.restore(); MGH.text(g, '!', sx, sy - 45, 22, '#2a1a0a', 'center', 'bold'); } } });
      // this player's own track (straight, or bending round the rocks they've chosen)
      ties(X); railLine(X);
      S.ev.forEach((e, k) => {
        const y = yAt(e.d); if (y < 0 || y > 860) return;
        if (e.type === 'fork') {
          const sy = y + 70;
          if (sy < 760 && p.path[k] === undefined) {
            // a big lit signboard on two posts: green arrow = safe, red skull = crash
            const L = e.safe === 'left';
            MGH.glow(g, cx, sy - 20, 150, 'rgba(255,220,140,0.35)');
            g.fillStyle = '#4a3420'; g.fillRect(cx - 118, sy - 6, 10, 46); g.fillRect(cx + 108, sy - 6, 10, 46);
            g.fillStyle = '#2a1a0c'; MGH.rr(g, cx - 140, sy - 62, 280, 66, 12); g.fill(); g.strokeStyle = '#ffd34d'; g.lineWidth = 4; g.stroke();
            for (const [sd, ok] of [[-1, L], [1, !L]]) {
              g.fillStyle = ok ? '#2fae4a' : '#b8322c'; MGH.rr(g, cx + (sd < 0 ? -132 : 4), sy - 55, 128, 52, 9); g.fill();
              MGH.text(g, sd < 0 ? (ok ? '◀ ✔' : '◀ 💀') : (ok ? '✔ ▶' : '💀 ▶'), cx + sd * 68, sy - 18, 30, '#fff', 'center', 'bold');
            }
          }
        } else { const gx = X(e.d); g.fillStyle = '#0a0603'; g.beginPath(); g.ellipse(gx, y - 10, 46, 18, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,120,40,0.35)'; g.beginPath(); g.ellipse(gx, y - 6, 34, 10, 0, 0, 7); g.fill(); MGH.text(g, '⚠️', gx + 60, y - 4, 18, '#fff'); }
      });
      const air = p.air > 0 ? Math.sin((0.55 - p.air) / 0.55 * Math.PI) : 0;
      const sx = X(p.d) + (p.crash > 0 ? Math.sin(m.t * 40) * 6 : 0), tilt = Math.atan2(X(p.d + 20) - X(p.d - 20), 40) * 0.8;
      g.fillStyle = 'rgba(0,0,0,0.4)'; g.beginPath(); g.ellipse(sx, yC + 26, 34, 10, 0, 0, 7); g.fill();
      g.save(); g.translate(sx, yC - air * 30); g.rotate(tilt); g.scale(1 + air * 0.15, 1 + air * 0.15);
      g.fillStyle = MGH.grad(g, -10, 26, ['#8a6a4a', '#4a2e18']); MGH.rr(g, -32, -10, 64, 36, 6); g.fill(); g.strokeStyle = '#2a1a0c'; g.lineWidth = 3; g.stroke();
      g.fillStyle = '#9a9aa8'; g.fillRect(-32, -10, 64, 5); g.fillRect(-32, 8, 64, 4);
      for (const wx of [-22, 22]) { g.fillStyle = '#333'; g.beginPath(); g.arc(wx, 28, 7, 0, 7); g.fill(); }
      if (Math.random() < 0.3) MGH.burst(sx + R.range(-20, 20), yC + 30, ['#ffd34d', '#ff8a3d'], 1, { speed: 120, life: 0.3, size: 2 });
      g.restore();
      MGH.av(g, m, i, sx, yC - 20 - air * 30, 17, p.crash > 0 ? 'dizzy' : p.air > 0 ? 'cheer' : 'determined', { noFeet: true, look: { x: p.choice === 'left' ? -1 : p.choice === 'right' ? 1 : 0, y: -1 } });
      if (p.choice) MGH.text(g, p.choice === 'left' ? '◀' : '▶', sx + (p.choice === 'left' ? -50 : 50), yC - 10, 26, m.players[i].color, 'center', 'bold');
    });
  },
});

