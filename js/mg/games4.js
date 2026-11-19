'use strict';
// Moot minigames 31-40

// 31 ---------------------------------------------------------------- Hot Streak
MG.def({
  id: 'streak', name: 'Hot Streak', type: 'Luck', controls: '1 button', dur: 45, mouseA: true,
  how: 'Hold to spin the meter and add to your pot. A skull wipes it. Release to bank the pot.',
  wins: 'First to bank 15.',
  init(m, S) { S.bank = [0, 0, 0, 0]; S.pot = [0, 0, 0, 0]; S.tick = [0, 0, 0, 0]; S.cool = [0, 0, 0, 0]; S.last = ['', '', '', '']; S.fin = [0, 0, 0, 0]; S.aim = [0, 1, 2, 3].map(() => R.int(4, 8)); },
  update(m, S, dt) {
    for (let i = 0; i < 4; i++) {
      if (S.fin[i]) continue;
      if (S.cool[i] > 0) { S.cool[i] -= dt; continue; }
      if (m.held(i, 'a')) {
        S.tick[i] += dt;
        if (S.tick[i] >= 0.45) {
          S.tick[i] = 0;
          if (Math.random() < 0.16) { MGH.burst(160 + i * 320, 300, ['#3a1a5c', '#b46bff', '#222'], 30, { speed: 320 }); MGH.shake(5); S.pot[i] = 0; S.last[i] = '💀'; S.cool[i] = 0.9; if (!m.bot(i)) Sfx.bad(); }
          else { const v = R.int(1, 3); S.pot[i] += v; S.last[i] = '+' + v; if (!m.bot(i)) Sfx.tone(500 + S.pot[i] * 30, 0.05, 'square', 0.04); }
        }
      } else if (m.released(i, 'a') || (S.pot[i] > 0 && !m.held(i, 'a'))) {
        if (S.pot[i] > 0) { MGH.burst(160 + i * 320, 570, ['#ffe680', '#fff'], 20, { speed: 240, up: 120, grav: 500 }); S.bank[i] += S.pot[i]; S.pot[i] = 0; S.last[i] = 'banked'; if (!m.bot(i)) Sfx.coin(); }
        S.tick[i] = 0;
        if (S.bank[i] >= 15) S.fin[i] = m.t;
      }
    }
    if (S.fin.some(f => f)) m.finish(this.score(m, S));
  },
  bot(m, S, i) {
    const need = 15 - S.bank[i];
    const target = Math.min(need, S.aim[i]);
    m.vin[i].a = S.cool[i] <= 0 && S.pot[i] < target;
    if (!m.vin[i].a) S.aim[i] = R.int(4, 8);
  },
  score(m, S) { return S.bank.map((b, i) => S.fin[i] ? 1000 - S.fin[i] : b); },
  fmt(s) { return s >= 100 ? 'Banked 15!' : `${s} banked`; },
  hud(m, S, i) { return `${S.bank[i]} (+${S.pot[i]})`; },
  draw(m, S, g) {
    MGH.bg(g, '#2a0e1e', '#0c040a');
    for (let i = 0; i < 4; i++) {
      const x = 160 + i * 320, p = m.players[i];
      g.save(); g.translate(x, 300); g.rotate(m.held(i, 'a') && S.cool[i] <= 0 ? m.t * 12 : 0);
      for (let k = 0; k < 8; k++) { g.fillStyle = k === 0 ? '#222' : (k % 2 ? p.color : '#fff'); g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 100, k * Math.PI / 4, (k + 1) * Math.PI / 4); g.fill(); }
      g.restore();
      const holding = m.held(i, 'a') && S.cool[i] <= 0;
      MGH.av(g, m, i, x - 115, 470, 24, S.fin[i] ? 'cheer' : S.last[i] === '💀' && S.cool[i] > 0 ? 'hurt' : S.last[i] === 'banked' ? 'cheer' : holding ? (S.pot[i] >= 6 ? 'scared' : 'determined') : 'happy', { look: { x: 1, y: -0.5 } });
      MGH.text(g, S.last[i], x, 460, 32, '#fff', 'center', 'bold');
      MGH.text(g, `pot ${S.pot[i]}`, x, 510, 26, '#ffe680', 'center', 'bold');
      g.fillStyle = '#333'; g.fillRect(x - 110, 560, 220, 20); g.fillStyle = p.color; g.fillRect(x - 110, 560, 220 * Math.min(1, S.bank[i] / 15), 20);
      MGH.text(g, `${p.name}: ${S.bank[i]} / 15`, x, 620, 20, p.color, 'center', 'bold');
    }
  },
});

// 32 ---------------------------------------------------------------- Hit or Stand 9
MG.def({
  id: 'nine', name: 'Hit or Stand 9', type: 'Luck', controls: 'Pick',
  how: 'Draw a number from 1 to 6. You may draw one more. Going over 9 is a bust. Three hands.',
  wins: 'Closest to 9 without busting (a point per hand).',
  init(m, S) { S.pts = [0, 0, 0, 0]; S.round = 1; this.deal(S); },
  deal(S) { S.c1 = [0, 1, 2, 3].map(() => R.d6()); S.c2 = [0, 0, 0, 0]; PickR.start(S, 2, 6, 1); },
  update(m, S, dt) {
    if (S.phase === 'pick') {
      if (PickR.update(m, S, dt, 2, i => S.c1[i] <= 4 ? 0 : 1)) {
        S.tot = S.c1.map((c, i) => { if (S.P[i].idx === 0) { S.c2[i] = R.d6(); } return c + S.c2[i]; });
        const valid = S.tot.map(t => t <= 9 ? t : -1); const best = Math.max(...valid);
        S.win = best > 0 ? valid.map((v, i) => v === best ? i : -1).filter(i => i >= 0) : [];
        S.win.forEach(i => S.pts[i]++);
        S.phase = 'reveal'; S.t = 0;
      }
    } else { S.t += dt; if (S.t > 2.8) { if (S.round >= 3) m.finish(S.pts.slice()); else { S.round++; this.deal(S); } } }
  },
  score(m, S) { return S.pts.slice(); },
  hud(m, S, i) { return S.pts[i]; },
  draw(m, S, g) {
    MGH.bg(g, '#0f2a18', '#051008');
    MGH.text(g, `Hand ${S.round} / 3`, 640, 100, 26, '#cdc');
    for (let i = 0; i < 4; i++) {
      const x = 160 + i * 320, p = m.players[i], mine = MGH.peek(m, i) || S.phase === 'reveal';
      g.fillStyle = '#f4f0e0'; MGH.rr(g, x - 90, 170, 80, 110, 10); g.fill();
      MGH.text(g, mine ? String(S.c1[i]) : '?', x - 50, 245, 44, '#222', 'center', 'bold');
      if (S.phase === 'reveal' && S.c2[i]) { g.fillStyle = '#f4f0e0'; MGH.rr(g, x + 10, 170, 80, 110, 10); g.fill(); MGH.text(g, String(S.c2[i]), x + 50, 245, 44, '#222', 'center', 'bold'); }
      MGH.av(g, m, i, x + 128, 225, 24, S.phase === 'reveal' ? (S.win.includes(i) ? 'cheer' : S.tot[i] > 9 ? 'hurt' : 'neutral') : (S.P[i].locked ? 'happy' : 'determined'), { look: { x: -1, y: 0 } });
      MGH.text(g, p.name, x, 320, 22, p.color, 'center', 'bold');
      if (S.phase === 'pick' && !m.bot(i)) ['Draw', 'Stand'].forEach((l, k) => { const sel = S.P[i].idx === k && MGH.peek(m, i); g.fillStyle = sel ? p.color : 'rgba(255,255,255,0.1)'; MGH.rr(g, x - 110 + k * 115, 360, 105, 50, 10); g.fill(); MGH.text(g, l, x - 57 + k * 115, 393, 20, sel ? '#000' : '#fff', 'center', 'bold'); });
      if (S.phase === 'reveal') MGH.text(g, S.tot[i] > 9 ? `${S.tot[i]} BUST` : `${S.tot[i]}${S.win.includes(i) ? ' ★' : ''}`, x, 400, 34, S.tot[i] > 9 ? '#f66' : '#ffe680', 'center', 'bold');
    }
    if (S.phase === 'pick') PickR.drawStatus(m, S, g);
  },
});

// 33 ---------------------------------------------------------------- Staircase
MG.def({
  id: 'stairs', name: 'Staircase', type: 'Luck', controls: '1 button', dur: 60, mouseA: true,
  how: 'Tap to roll. A roll only counts if it is the next number on the staircase, 1 to 6 in order.',
  wins: 'First to the top step.',
  init(m, S) { S.step = [0, 0, 0, 0]; S.roll = [0, 0, 0, 0]; S.anim = [0, 0, 0, 0]; S.fin = [0, 0, 0, 0]; S.bt = [0, 0, 0, 0]; },
  update(m, S, dt) {
    for (let i = 0; i < 4; i++) {
      if (S.fin[i]) continue;
      if (S.anim[i] > 0) { S.anim[i] -= dt; if (S.anim[i] <= 0) { if (S.roll[i] === S.step[i] + 1) { S.step[i]++; MGH.burst(30 + i * 320 + (S.step[i] - 1) * 42 + 21, 620 - (S.step[i] - 1) * 70, [m.players[i].color, '#fff'], 14, { speed: 200, up: 100, grav: 400 }); if (!m.bot(i)) Sfx.coin(); if (S.step[i] >= 6) S.fin[i] = m.t; } } continue; }
      if (m.pressed(i, 'a')) { S.roll[i] = R.d6(); S.anim[i] = 0.3; if (!m.bot(i)) Sfx.dice(); }
    }
    if (S.fin.some(f => f)) m.finish(this.score(m, S));
  },
  bot(m, S, i, dt) { const v = m.vin[i]; v.a = false; S.bt[i] -= dt; if (S.anim[i] <= 0 && S.bt[i] <= 0) { v.a = true; S.bt[i] = R.range(0.05, 0.2); } },
  score(m, S) { return S.step.map((s, i) => S.fin[i] ? 1000 - S.fin[i] : s); },
  fmt(s) { return s >= 100 ? 'Reached the top!' : `step ${s}`; },
  hud(m, S, i) { return `step ${S.step[i]}`; },
  draw(m, S, g) {
    MGH.bg(g, '#20202e', '#09090f');
    for (let i = 0; i < 4; i++) {
      const x0 = 30 + i * 320, p = m.players[i];
      for (let k = 0; k < 6; k++) { g.fillStyle = k < S.step[i] ? p.color : 'rgba(255,255,255,0.12)'; g.fillRect(x0 + k * 42, 620 - k * 70, 42, 70 + k * 70); MGH.text(g, String(k + 1), x0 + 21 + k * 42, 650, 18, '#000', 'center', 'bold'); }
      const sx = x0 + Math.max(0, S.step[i] - 1) * 42 + 21, sy = S.step[i] ? 620 - (S.step[i] - 1) * 70 - 20 : 680;
      MGH.av(g, m, i, sx, sy - 6, 15, S.fin[i] ? 'cheer' : (S.anim[i] <= 0 && S.roll[i] && S.roll[i] !== S.step[i] ? 'hurt' : 'determined'), { look: { x: 0.6, y: -0.6 } });
      g.fillStyle = '#fff'; MGH.rr(g, x0 + 200, 120, 80, 80, 12); g.fill();
      MGH.text(g, S.anim[i] > 0 ? String(R.d6()) : (S.roll[i] || '-'), x0 + 240, 178, 46, S.roll[i] === S.step[i] && S.anim[i] <= 0 && S.roll[i] ? '#0a0' : '#222', 'center', 'bold');
      MGH.text(g, `${p.name} needs ${Math.min(6, S.step[i] + 1)}`, x0 + 140, 90, 20, p.color, 'center', 'bold');
    }
  },
});

// 34 ---------------------------------------------------------------- Higher or Lower
MG.def({
  id: 'higher', name: 'Higher or Lower', type: 'Luck', controls: 'Pick',
  how: 'A number from 1 to 10 is shown. Bet whether the next one is higher or lower. A wrong bet is out.',
  wins: 'Last one alive.',
  init(m, S) { S.alive = [true, true, true, true]; S.outR = [0, 0, 0, 0]; S.round = 0; S.cur = R.int(3, 8); this.start(S); },
  start(S) { S.round++; PickR.start(S, 2, 5, 0); },
  update(m, S, dt) {
    if (S.phase === 'pick') {
      for (let i = 0; i < 4; i++) if (!S.alive[i]) S.P[i].locked = true;
      if (PickR.update(m, S, dt, 2, () => Math.random() < 0.88 ? (S.cur <= 5 ? 0 : 1) : R.int(0, 1))) {
        let nx; do { nx = R.int(1, 10); } while (nx === S.cur);
        S.next = nx;
        const right = S.P.map((P, i) => S.alive[i] && P.locked && ((P.idx === 0 && nx > S.cur) || (P.idx === 1 && nx < S.cur)));
        const alive = S.alive.map((a, i) => a && right[i]);
        if (alive.some(a => a)) S.alive.forEach((a, i) => { if (a && !alive[i]) { S.alive[i] = false; S.outR[i] = S.round; } });
        S.phase = 'reveal'; S.t = 0;
      }
    } else {
      S.t += dt;
      if (S.t > 2.4) { S.cur = S.next; if (S.alive.filter(a => a).length <= 1 || S.round >= 12) m.finish(this.score(m, S)); else this.start(S); }
    }
  },
  score(m, S) { return S.alive.map((a, i) => a ? 100 : S.outR[i]); },
  fmt(s) { return s >= 100 ? 'Survived' : `out in round ${s}`; },
  hud(m, S, i) { return S.alive[i] ? 'in' : 'out'; },
  draw(m, S, g) {
    MGH.bg(g, '#1a1a2e', '#07070f');
    MGH.text(g, String(S.cur), 480, 330, 160, '#fff', 'center', 'bold');
    if (S.phase === 'reveal') MGH.text(g, '→ ' + S.next, 800, 330, 120, '#ffe680', 'center', 'bold');
    else MGH.text(g, '?', 800, 330, 120, '#555', 'center', 'bold');
    if (S.phase === 'pick') PickR.drawOptions(m, S, g, ['▲ Higher', '▼ Lower'], 390, 420, 240, 100, 2, false);
    else PickR.drawOptions(m, S, g, ['▲ Higher', '▼ Lower'], 390, 420, 240, 100, 2, true);
    for (let i = 0; i < 4; i++) {
      MGH.av(g, m, i, 160 + i * 320 - 100, 668, 22, !S.alive[i] ? 'out' : S.phase === 'reveal' ? 'cheer' : (S.P[i].locked ? 'happy' : 'scared'));
      MGH.text(g, `${m.players[i].name}: ${S.alive[i] ? (S.P[i].locked ? '🔒' : '…') : '✖ out'}`, 160 + i * 320 + 10, 680, 20, m.players[i].color, 'center', 'bold');
    }
  },
});

// 35 ---------------------------------------------------------------- Tower of Tokens
MG.def({
  id: 'tower', name: 'Tower of Tokens', type: 'Skill', controls: '1 button', dur: 40, mouseA: true,
  how: 'A crane swings a block. Press to drop it. Overhanging parts break off, and a block that misses is lost.',
  wins: 'Tallest stable tower.',
  init(m, S) {
    S.t = [0, 1, 2, 3].map(() => ({ stack: [{ x: 160, w: 150 }], crane: 0, fall: null, ph: R.range(0, 6), cd: 0, miss: 0 }));
  },
  update(m, S, dt) {
    S.t.forEach((T, i) => {
      T.ph += dt * (1.8 + T.stack.length * 0.08);
      T.crane = 160 + Math.sin(T.ph) * 120;
      T.cd -= dt;
      const top = T.stack[T.stack.length - 1];
      if (!T.fall && T.cd <= 0 && m.pressed(i, 'a')) T.fall = { x: T.crane, w: top.w, y: 0 };
      if (T.fall) {
        T.fall.y += 900 * dt;
        if (T.fall.y >= 1) {
          const l = Math.max(T.fall.x - T.fall.w / 2, top.x - top.w / 2), r = Math.min(T.fall.x + T.fall.w / 2, top.x + top.w / 2);
          if (r - l >= 12) { MGH.burst(i * 320 + (l + r) / 2, 690 - T.stack.length * 26 + Math.max(0, (T.stack.length - 14) * 26), ['#d9c7a8', '#fff'], 10, { speed: 160 }); T.stack.push({ x: (l + r) / 2, w: r - l }); if (!m.bot(i)) Sfx.tone(400 + T.stack.length * 30, 0.08, 'triangle', 0.05); }
          else { T.miss = 0.6; if (!m.bot(i)) Sfx.bad(); }
          T.fall = null; T.cd = 0.25;
        }
      }
      T.miss -= dt;
    });
  },
  bot(m, S, i) {
    const T = S.t[i], v = m.vin[i]; v.a = false;
    if (T.fall || T.cd > 0) return;
    const top = T.stack[T.stack.length - 1];
    if (Math.abs(T.crane - top.x) < R.range(2, 14) && Math.random() < 0.7) v.a = true;
  },
  score(m, S) { return S.t.map(T => T.stack.length - 1 + T.stack[T.stack.length - 1].w / 1000); },
  fmt(s) { return `${Math.floor(s)} blocks`; },
  hud(m, S, i) { return S.t[i].stack.length - 1; },
  draw(m, S, g) {
    MGH.bg(g, '#2b2238', '#0e0b14'); MGH.lanes(g, m);
    S.t.forEach((T, i) => {
      const ox = i * 320, bh = 26, n = T.stack.length;
      const scroll = Math.max(0, (n - 14) * bh);
      g.save(); g.beginPath(); g.rect(ox, 40, 320, 680); g.clip();
      T.stack.forEach((b, k) => { const y = 690 - k * bh + scroll; g.fillStyle = k === 0 ? '#666' : m.players[i].color; g.fillRect(ox + b.x - b.w / 2, y - bh, b.w, bh - 2); });
      g.strokeStyle = '#aaa'; g.beginPath(); g.moveTo(ox + T.crane, 40); g.lineTo(ox + T.crane, 110); g.stroke();
      const top = T.stack[n - 1];
      if (!T.fall) { g.fillStyle = m.players[i].color; g.globalAlpha = 0.85; g.fillRect(ox + T.crane - top.w / 2, 110, top.w, bh - 2); g.globalAlpha = 1; }
      else { const y = lerp(110, 690 - n * bh + scroll, Math.min(1, T.fall.y)); g.fillStyle = m.players[i].color; g.fillRect(ox + T.fall.x - T.fall.w / 2, y, T.fall.w, bh - 2); }
      if (T.miss > 0) MGH.text(g, 'missed!', ox + 160, 200, 26, '#f66', 'center', 'bold');
      g.restore();
      MGH.av(g, m, i, ox + 38, 686, 18, T.miss > 0 ? 'hurt' : T.cd > 0 ? 'cheer' : 'determined', { look: { x: 0.6, y: -1 } });
    });
  },
});

// 36 ---------------------------------------------------------------- Balance Beam
MG.def({
  id: 'beam', name: 'Balance Beam', type: 'Skill', controls: 'Left/Right', dur: 45,
  how: 'Walk a swaying beam while gusts of wind push you. Falling is out.',
  wins: 'Last one on the beam.',
  init(m, S) {
    S.gusts = []; for (let t = 1; t < 46; t += R.range(1.2, 3)) S.gusts.push({ t, f: R.range(-1, 1) * (0.9 + t * 0.03), d: R.range(0.5, 1.2) });
    S.p = [0, 1, 2, 3].map(() => ({ a: R.range(-0.03, 0.03), w: 0, alive: true, outT: 0, lag: [] }));
  },
  gust(S, t) { let f = 0; for (const g of S.gusts) if (t >= g.t && t < g.t + g.d) f += g.f; return f; },
  update(m, S, dt) {
    const gf = this.gust(S, m.t);
    S.p.forEach((p, i) => {
      if (!p.alive) return;
      const ctrl = m.axis(i).x;
      p.w += (Math.sin(p.a) * 3.2 + gf * 1.6 + ctrl * 4.2) * dt;
      p.w *= (1 - 1.2 * dt);
      p.a += p.w * dt;
      if (Math.abs(p.a) > 0.95) { MGH.burst(i * 320 + 160 + Math.sign(p.a) * 120, 500, [m.players[i].color, '#fff'], 24, { speed: 280, grav: 600 }); MGH.shake(6); p.alive = false; p.outT = m.t; if (!m.bot(i)) Sfx.bad(); }
    });
    if (S.p.filter(p => p.alive).length <= 1) m.finish(this.score(m, S));
  },
  bot(m, S, i) {
    const p = S.p[i];
    p.lag.push(p.a + p.w * 0.45); if (p.lag.length > 6 + i * 2) p.lag.shift();
    const est = p.lag[0] + R.range(-0.04, 0.04);
    const skill = 1 - m.t / 120;
    MGH.setLR(m, i, Math.abs(est) < 0.04 ? 0 : (Math.random() < skill ? -Math.sign(est) : Math.sign(est)));
  },
  score(m, S) { return S.p.map(p => p.alive ? 1000 - Math.abs(p.a) : p.outT); },
  fmt(s) { return s >= 999 ? 'Still standing' : `fell at ${s.toFixed(1)}s`; },
  hud(m, S, i) { return S.p[i].alive ? 'balanced' : 'fell'; },
  draw(m, S, g) {
    MGH.bg(g, '#7fb6e8', '#2f5f8f'); MGH.lanes(g, m);
    const gf = this.gust(S, m.t);
    if (Math.abs(gf) > 0.1) for (let k = 0; k < 10; k++) { const y = 80 + k * 60, x = ((m.t * 600 * Math.sign(gf) + k * 300) % 1400 + 1400) % 1400 - 60; g.strokeStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 50 * Math.sign(gf), y); g.stroke(); }
    S.p.forEach((p, i) => {
      const cx = i * 320 + 160;
      g.fillStyle = '#5a3d22'; g.fillRect(cx - 150, 560, 300, 14);
      if (!p.alive) { MGH.text(g, '💫 fell', cx, 640, 28, '#fff', 'center', 'bold'); return; }
      g.save(); g.translate(cx, 560); g.rotate(p.a);
      g.strokeStyle = m.players[i].color; g.lineWidth = 8; g.lineCap = 'round';
      g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -120); g.moveTo(-70, -95); g.lineTo(70, -95); g.stroke();
      g.restore();
      const hx = cx + Math.sin(p.a) * 150, hy = 560 - Math.cos(p.a) * 150;
      MGH.av(g, m, i, hx, hy, 24, Math.abs(p.a) > 0.5 ? 'scared' : Math.abs(p.a) > 0.25 ? 'determined' : 'happy', { noFeet: true, look: { x: -Math.sign(p.a), y: 0.3 } });
    });
  },
});

// 37 ---------------------------------------------------------------- Slingshot
MG.def({
  id: 'sling', name: 'Slingshot', type: 'Skill', controls: 'Cursor', cursor: true,
  how: 'Aim with your cursor and fire at the moving targets. Stones take a moment to fly. Three shots.',
  wins: 'Highest total score.',
  init(m, S) {
    S.tg = [0, 1, 2].map(k => ({ y: 150 + k * 120, x: R.range(100, 1180), v: (k % 2 ? -1 : 1) * (170 + k * 60) }));
    S.shots = [3, 3, 3, 3]; S.pts = [0, 0, 0, 0]; S.stones = []; S.cd = [0, 0, 0, 0]; S.hits = []; S.bt = [0, 1, 2, 3].map(() => R.range(1, 3));
  },
  tpos(T, t) { let x = T.x + T.v * t; const span = 1080; x = ((x - 100) % (2 * span) + 2 * span) % (2 * span); return x > span ? 100 + 2 * span - x : 100 + x; },
  update(m, S, dt) {
    for (let i = 0; i < 4; i++) {
      S.cd[i] -= dt;
      if (S.shots[i] > 0 && S.cd[i] <= 0 && m.pressed(i, 'a') && m.cur[i].y < 560) {
        S.shots[i]--; S.cd[i] = 0.8;
        S.stones.push({ i, sx: 160 + i * 320, sy: 680, tx: m.cur[i].x, ty: m.cur[i].y, t: 0 });
        if (!m.bot(i)) Sfx.tone(250, 0.1, 'triangle', 0.06, 200);
      }
    }
    for (const s of S.stones) {
      s.t += dt / 0.45;
      if (s.t >= 1 && !s.done) {
        s.done = true;
        let best = 0;
        S.tg.forEach(T => { const d = dist(s.tx, s.ty, this.tpos(T, m.t), T.y); const p = d < 12 ? 5 : d < 28 ? 3 : d < 46 ? 1 : 0; best = Math.max(best, p); });
        S.pts[s.i] += best; S.hits.push({ x: s.tx, y: s.ty, p: best, t: 0, i: s.i });
        MGH.burst(s.tx, s.ty, best ? ['#ff3b3b', '#fff', '#ffe680'] : ['#8a7765', '#5a4a3a'], best ? 26 : 10, { speed: best ? 340 : 160, kind: best === 5 ? 'spark' : 'dot', size: 3 }); if (best === 5) { MGH.shake(5); MGH.ring(s.tx, s.ty, '#ffe680', 10, 80); }
        if (best) Sfx.coin();
      }
    }
    S.stones = S.stones.filter(s => !s.done);
    S.hits.forEach(h => { h.t += dt; }); S.hits = S.hits.filter(h => h.t < 1);
    if (S.shots.every(s => s === 0) && !S.stones.length) m.finish(S.pts.slice());
    if (m.t > 40) m.finish(S.pts.slice());
  },
  bot(m, S, i, dt) {
    const v = m.vin[i]; v.a = false;
    if (S.shots[i] <= 0) return;
    if (!S.btT) S.btT = [0, 1, 2, 3].map(() => R.int(0, 2));
    const T = S.tg[S.btT[i]];
    const px = this.tpos(T, m.t + 0.45 + R.range(-0.02, 0.02)) + R.range(-14, 14);
    const there = m.botCursor(i, px, T.y + R.range(-8, 8), 1500);
    S.bt[i] -= dt;
    if (there && S.bt[i] <= 0 && S.cd[i] <= 0) { v.a = true; S.bt[i] = R.range(1.2, 3); S.btT[i] = R.int(0, 2); }
  },
  score(m, S) { return S.pts.slice(); },
  hud(m, S, i) { return `${S.pts[i]} (${S.shots[i]} left)`; },
  draw(m, S, g) {
    MGH.bg(g, '#3c5c2a', '#1c2d12');
    S.tg.forEach(T => {
      const x = this.tpos(T, m.t);
      [46, 28, 12].forEach((r, k) => { g.fillStyle = ['#fff', '#e33', '#fff'][k]; g.beginPath(); g.arc(x, T.y, r, 0, 7); g.fill(); });
      g.fillStyle = '#e33'; g.beginPath(); g.arc(x, T.y, 6, 0, 7); g.fill();
    });
    for (let i = 0; i < 4; i++) { const x = 160 + i * 320; g.strokeStyle = m.players[i].color; g.lineWidth = 6; g.beginPath(); g.moveTo(x - 20, 700); g.lineTo(x, 660); g.lineTo(x + 20, 700); g.stroke(); MGH.text(g, '●'.repeat(S.shots[i]), x, 640, 18, m.players[i].color, 'center', 'bold');
      const lastHit = S.hits.filter(h => h.i === i).pop();
      MGH.av(g, m, i, x + 52, 686, 18, lastHit ? (lastHit.p ? 'cheer' : 'hurt') : 'determined', { look: { x: (m.cur[i].x - x) / 400, y: -1 } }); }
    for (const s of S.stones) { const x = lerp(s.sx, s.tx, s.t), y = lerp(s.sy, s.ty, s.t) - Math.sin(s.t * Math.PI) * 60; g.fillStyle = '#ccc'; g.beginPath(); g.arc(x, y, 7 + (1 - s.t) * 4, 0, 7); g.fill(); }
    S.hits.forEach(h => MGH.text(g, h.p ? '+' + h.p : 'miss', h.x, h.y - h.t * 40, 24, h.p ? m.players[h.i].color : '#aaa', 'center', 'bold'));
    MGH.cursors(m, g);
  },
});

// 38 ---------------------------------------------------------------- Flick Off
MG.def({
  id: 'flick', name: 'Flick Off', type: 'Skill', controls: '1 button (hold & release)', mouseA: true,
  how: 'Hold to charge the power meter and release to flick a coin toward the far edge. Closer to the edge is better, but falling off scores zero. Three flicks.',
  wins: 'Best single flick.',
  init(m, S) { S.p = [0, 1, 2, 3].map(() => ({ n: 0, best: 0, last: null, charge: 0, chg: false, coin: null, aim: R.range(0.6, 0.9) })); S.L = 560; },
  update(m, S, dt) {
    S.p.forEach((p, i) => {
      if (p.coin) {
        const c = p.coin; c.y += c.v * dt; c.v -= 520 * dt;
        if (c.y >= S.L) { MGH.burst(i * 320 + 160, 680 - S.L - 10, ['#e8b923', '#fff'], 18, { speed: 260, up: 150, grav: 700 }); p.last = 0; p.coin = null; p.n++; if (!m.bot(i)) Sfx.bad(); }
        else if (c.v <= 0) { const sc = Math.round(c.y / S.L * 100); p.last = sc; p.best = Math.max(p.best, sc); p.coin = null; p.n++; if (!m.bot(i)) Sfx.coin(); }
        return;
      }
      if (p.n >= 3) return;
      if (m.held(i, 'a')) { p.chg = true; p.charge += dt; }
      else if (p.chg) {
        p.chg = false;
        const pw = (1 - Math.cos(p.charge * Math.PI / 0.9)) / 2;
        p.coin = { y: 0, v: Math.sqrt(2 * 520 * S.L * 1.15) * pw }; p.charge = 0;
      }
    });
    if (S.p.every(p => p.n >= 3 && !p.coin)) m.finish(S.p.map(p => p.best));
  },
  bot(m, S, i) {
    const p = S.p[i], v = m.vin[i];
    if (p.coin || p.n >= 3) { v.a = false; return; }
    const pw = (1 - Math.cos(p.charge * Math.PI / 0.9)) / 2;
    const want = Math.sqrt(p.aim / 1.15) + (p.noise || 0);
    if (!v.a && !p.chg) v.a = true;
    else if (v.a && pw >= want && Math.sin(p.charge * Math.PI / 0.9) > 0) { v.a = false; p.aim = R.range(0.6, 0.92); p.noise = R.range(-0.06, 0.06); }
  },
  score(m, S) { return S.p.map(p => p.best); },
  fmt(s) { return `${s}% of the table`; },
  hud(m, S, i) { return `best ${S.p[i].best}%`; },
  draw(m, S, g) {
    MGH.bg(g, '#1a0f08', '#050302'); MGH.lanes(g, m);
    S.p.forEach((p, i) => {
      const cx = i * 320 + 160, base = 680;
      g.fillStyle = '#6b3f1d'; g.fillRect(cx - 70, base - S.L - 10, 140, S.L + 10);
      g.fillStyle = '#ffd34d'; g.fillRect(cx - 70, base - S.L - 10, 140, 6);
      const pw = (1 - Math.cos(p.charge * Math.PI / 0.9)) / 2;
      g.fillStyle = '#222'; g.fillRect(cx + 80, 200, 18, 400); g.fillStyle = m.players[i].color; g.fillRect(cx + 80, 600 - 400 * pw, 18, 400 * pw);
      const y = p.coin ? base - p.coin.y : base;
      g.fillStyle = '#e8b923'; g.beginPath(); g.arc(cx, y, 18, 0, 7); g.fill(); g.strokeStyle = m.players[i].color; g.lineWidth = 3; g.stroke();
      MGH.av(g, m, i, cx - 108, 664, 20, p.coin ? 'scared' : p.chg ? 'determined' : p.last === null ? 'happy' : p.last === 0 ? 'hurt' : p.last >= 85 ? 'cheer' : 'happy', { look: { x: 0.4, y: -1 } });
      MGH.text(g, `${p.n}/3 · last ${p.last === null ? '-' : p.last + '%'}`, cx, 110, 18, '#fff');
    });
  },
});

// 39 ---------------------------------------------------------------- Dig Site
MG.def({
  id: 'dig', name: 'Dig Site', type: 'Strategy', controls: 'Cursor', cursor: true, dur: 30,
  how: 'A shared grid of buried tiles. Everyone has 10 digs in 30 seconds. Gems score, bombs cost 3. Dug sand shows how many gems are next to it.',
  wins: 'Most gems.',
  init(m, S) {
    S.cols = 12; S.rows = 6; S.cell = 92; S.x0 = (1280 - 12 * 92) / 2; S.y0 = 110;
    const n = 72; const kinds = new Array(n).fill(0); R.shuffle([...Array(n).keys()]).slice(0, 18).forEach((k, j) => { kinds[k] = j < 12 ? 1 : 2; });
    S.kind = kinds; S.dug = new Array(n).fill(-1); S.left = [10, 10, 10, 10]; S.pts = [0, 0, 0, 0];
    S.bt = [0, 1, 2, 3].map(() => R.range(0.8, 2)); S.btTarget = [null, null, null, null];
  },
  idxAt(S, x, y) { const c = Math.floor((x - S.x0) / S.cell), r = Math.floor((y - S.y0) / S.cell); return c >= 0 && c < S.cols && r >= 0 && r < S.rows ? r * S.cols + c : -1; },
  adj(S, k) { const c = k % S.cols, r = Math.floor(k / S.cols); let n = 0; for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { const cc = c + dc, rr = r + dr; if ((dr || dc) && cc >= 0 && cc < S.cols && rr >= 0 && rr < S.rows && S.kind[rr * S.cols + cc] === 1) n++; } return n; },
  update(m, S, dt) {
    for (let i = 0; i < 4; i++) {
      if (S.left[i] <= 0 || !m.pressed(i, 'a')) continue;
      const k = this.idxAt(S, m.cur[i].x, m.cur[i].y);
      if (k < 0 || S.dug[k] >= 0) continue;
      S.dug[k] = i; S.left[i]--;
      const cx = S.x0 + (k % S.cols + 0.5) * S.cell, cy = S.y0 + (Math.floor(k / S.cols) + 0.5) * S.cell;
      MGH.burst(cx, cy, ['#c9a36b', '#8a6a3a'], 10, { speed: 160, grav: 400 });
      if (S.kind[k] === 1) { S.pts[i]++; MGH.burst(cx, cy, ['#9fe8ff', '#fff', '#5fd0ff'], 22, { speed: 260, kind: 'spark', size: 3 }); if (!m.bot(i)) Sfx.coin(); }
      else if (S.kind[k] === 2) { S.pts[i] -= 3; Sfx.boom(); MGH.burst(cx, cy, ['#ff5a1f', '#ffd34d', '#333'], 50, { speed: 420 }); MGH.ring(cx, cy, '#ffd34d', 20, 140); MGH.shake(14); MGH.pop('−3', cx, cy - 30, '#ff6b6b', 34); }
    }
    if (S.left.every(l => l <= 0)) m.finish(S.pts.slice());
  },
  bot(m, S, i, dt) {
    const v = m.vin[i]; v.a = false;
    if (S.left[i] <= 0) return;
    if (S.btTarget[i] === null || S.dug[S.btTarget[i]] >= 0) {
      let best = [], bs = -1;
      for (let k = 0; k < 72; k++) {
        if (S.dug[k] >= 0) continue;
        let s = 0; const c = k % S.cols, r = Math.floor(k / S.cols);
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { const kk = (r + dr) * S.cols + c + dc; if ((dr || dc) && c + dc >= 0 && c + dc < S.cols && r + dr >= 0 && r + dr < S.rows && S.dug[kk] >= 0) { if (S.kind[kk] === 0) s += this.adj(S, kk) - 0.5; else if (S.kind[kk] === 1) s += 0.5; } }
        s += Math.random() * 0.8;
        if (s > bs) { bs = s; best = k; }
      }
      S.btTarget[i] = best;
    }
    const k = S.btTarget[i], x = S.x0 + (k % S.cols + 0.5) * S.cell, y = S.y0 + (Math.floor(k / S.cols) + 0.5) * S.cell;
    S.bt[i] -= dt;
    if (m.botCursor(i, x, y, 600) && S.bt[i] <= 0) { v.a = true; S.bt[i] = R.range(1.2, 2.4); S.btTarget[i] = null; }
  },
  score(m, S) { return S.pts.slice(); },
  hud(m, S, i) { return `💎${S.pts[i]} (${S.left[i]} digs)`; },
  draw(m, S, g) {
    MGH.bg(g, '#3d2c18', '#1a1209');
    for (let k = 0; k < 72; k++) {
      const x = S.x0 + (k % S.cols) * S.cell, y = S.y0 + Math.floor(k / S.cols) * S.cell;
      const d = S.dug[k];
      g.fillStyle = d < 0 ? '#c9a36b' : '#4a3520'; g.fillRect(x + 2, y + 2, S.cell - 4, S.cell - 4);
      if (d >= 0) {
        g.strokeStyle = m.players[d].color; g.lineWidth = 3; g.strokeRect(x + 4, y + 4, S.cell - 8, S.cell - 8);
        if (S.kind[k] === 1) MGH.text(g, '💎', x + S.cell / 2, y + S.cell / 2 + 14, 40, '#fff');
        else if (S.kind[k] === 2) MGH.text(g, '💣', x + S.cell / 2, y + S.cell / 2 + 14, 40, '#fff');
        else { const n = this.adj(S, k); MGH.text(g, n ? String(n) : '·', x + S.cell / 2, y + S.cell / 2 + 12, 32, '#9fd8ff', 'center', 'bold'); }
      }
    }
    MGH.cursors(m, g, S.pts.map((p, i) => S.left[i] <= 0 ? (p > 2 ? 'cheer' : 'neutral') : 'determined'));
  },
});

// 40 ---------------------------------------------------------------- Hoard Heist
MG.def({
  id: 'heist', name: 'Hoard Heist', type: 'Stealth', controls: 'Move + grab', dur: 45,
  how: "Coins lie on the floor of a hall. A Warden's lantern sweeps the room. Grab coins while the beam is away and carry them to the door. If caught, you drop what you carry.",
  wins: 'Most coins banked at the door.',
  init(m, S) {
    S.coins = []; for (let k = 0; k < 34; k++) S.coins.push({ x: R.range(80, 1200), y: R.range(170, 560) });
    S.b = [0, 1, 2, 3].map(i => Object.assign(MGH.body(400 + i * 160, 660, 18), { carry: 0, bank: 0, stun: 0 }));
    S.ang = Math.PI / 2; S.w = 0.7; S.dir = 1; S.wx = 640; S.wy = 70;
  },
  inBeam(S, x, y) {
    const a = Math.atan2(y - S.wy, x - S.wx), d = dist(x, y, S.wx, S.wy);
    let da = Math.abs(a - S.ang); if (da > Math.PI) da = 2 * Math.PI - da;
    return d < 720 && da < 0.2;
  },
  update(m, S, dt) {
    S.ang += S.dir * S.w * dt;
    if (S.ang > Math.PI - 0.25) { S.ang = Math.PI - 0.25; S.dir = -1; S.w = R.range(0.5, 1.2); }
    if (S.ang < 0.25) { S.ang = 0.25; S.dir = 1; S.w = R.range(0.5, 1.2); }
    if (Math.random() < 0.004) S.dir *= -1;
    S.b.forEach((b, i) => {
      if (b.stun > 0) { b.stun -= dt; b.vx = b.vy = 0; return; }
      const a = m.axis(i); MGH.steer(b, a.x, a.y, dt, 2400, 260 - b.carry * 8, 9); MGH.integrate(b, dt, 0, 130);
      if (m.pressed(i, 'a')) {
        const c = S.coins.findIndex(c => dist(c.x, c.y, b.x, b.y) < 42);
        if (c >= 0) { MGH.burst(S.coins[c].x, S.coins[c].y, ['#ffe680', '#fff'], 10, { speed: 160 }); S.coins.splice(c, 1); b.carry++; if (!m.bot(i)) Sfx.coin(); }
      }
      if (b.carry > 0 && this.inBeam(S, b.x, b.y)) {
        for (let k = 0; k < b.carry; k++) S.coins.push({ x: clamp(b.x + R.range(-60, 60), 60, 1220), y: clamp(b.y + R.range(-60, 60), 160, 600) });
        b.carry = 0; b.stun = 0.6; MGH.pop('Caught!', b.x, b.y - 30, '#ffe680', 26); MGH.shake(4); if (!m.bot(i)) Sfx.bad();
      }
      if (b.y > 640 && Math.abs(b.x - 640) < 110 && b.carry) { MGH.pop('+' + b.carry, b.x, b.y - 30, '#ffe680', 30); MGH.burst(b.x, b.y, ['#ffe680', '#fff'], 20, { speed: 240 }); b.bank += b.carry; b.carry = 0; if (!m.bot(i)) Sfx.star(); }
    });
    MGH.collide(S.b, 0.4);
  },
  bot(m, S, i) {
    const b = S.b[i], v = m.vin[i]; v.a = false;
    const beamNear = (x, y) => [0, 0.25, 0.5].some(t => { const a0 = S.ang; S.ang += S.dir * S.w * t; const r = this.inBeam(S, x, y); S.ang = a0; return r; });
    let tx, ty;
    if (b.carry >= 3 || (b.carry > 0 && (m.t > 41 || beamNear(b.x, b.y))) || (!S.coins.length && b.carry)) { tx = 640; ty = 690; }
    else {
      const c = S.coins.slice().sort((p, q) => dist(p.x, p.y, b.x, b.y) - dist(q.x, q.y, b.x, b.y))[0];
      if (!c) { tx = 640; ty = 690; } else { tx = c.x; ty = c.y; if (dist(c.x, c.y, b.x, b.y) < 36) v.a = !m.prev[i].a; }
    }
    if (b.carry && beamNear(b.x, b.y)) { const a = Math.atan2(b.y - S.wy, b.x - S.wx) + Math.PI / 2 * (S.dir > 0 ? -1 : 1); tx = b.x + Math.cos(a) * 100; ty = b.y + Math.sin(a) * 100; }
    MGH.aim(m, i, tx, ty, b, 8);
  },
  score(m, S) { return S.b.map(b => b.bank); },
  fmt(s) { return `${s} coins`; },
  hud(m, S, i) { return `${S.b[i].bank} (+${S.b[i].carry})`; },
  draw(m, S, g) {
    MGH.bg(g, '#1c1612', '#0b0806');
    g.fillStyle = '#2a211a'; g.fillRect(0, 130, 1280, 590);
    g.fillStyle = '#5a3d22'; g.fillRect(530, 650, 220, 70); MGH.text(g, '🚪 DOOR', 640, 695, 22, '#ffe680', 'center', 'bold');
    S.coins.forEach(c => { g.fillStyle = '#e8b923'; g.beginPath(); g.arc(c.x, c.y, 10, 0, 7); g.fill(); });
    g.fillStyle = 'rgba(255,240,170,0.28)'; g.beginPath(); g.moveTo(S.wx, S.wy); g.arc(S.wx, S.wy, 720, S.ang - 0.2, S.ang + 0.2); g.closePath(); g.fill();
    MGH.text(g, '🏮', S.wx, S.wy + 12, 40, '#fff');
    S.b.forEach((b, i) => MGH.drawBody(g, b, m.players[i], b.stun > 0 ? '💫' : (b.carry ? '🪙' + b.carry : ''), b.stun > 0 ? 'dizzy' : this.inBeam(S, b.x, b.y) ? 'scared' : b.carry ? 'cheer' : null));
  },
});
