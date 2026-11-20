'use strict';
// Moot minigames 31-40

// 31 ---------------------------------------------------------------- Hot Streak
MG.def({
  id: 'streak', name: 'Hot Streak', type: 'Luck', controls: '1 button', dur: 45, mouseA: true,
  how: 'Hold to spin and grow your pot. Let go to bank it. The bigger your pot, the likelier the SKULL — it wipes the pot! First to bank 30 wins.',
  wins: 'First to bank 30.',
  init(m, S) { S.bank = [0, 0, 0, 0]; S.pot = [0, 0, 0, 0]; S.tick = [0, 0, 0, 0]; S.cool = [0, 0, 0, 0]; S.last = ['', '', '', '']; S.fin = [0, 0, 0, 0]; S.aim = [0, 1, 2, 3].map(() => R.int(4, 8)); },
  update(m, S, dt) {
    for (let i = 0; i < 4; i++) {
      if (S.fin[i]) continue;
      if (S.cool[i] > 0) { S.cool[i] -= dt; continue; }
      if (m.held(i, 'a')) {
        S.tick[i] += dt;
        if (S.tick[i] >= 0.6) {
          S.tick[i] = 0;
          if (Math.random() < 0.06 + S.pot[i] * 0.022) { MGH.burst(160 + i * 320, 300, ['#3a1a5c', '#b46bff', '#222'], 30, { speed: 320 }); MGH.shake(5); S.pot[i] = 0; S.last[i] = '💀'; S.cool[i] = 0.9; if (!m.bot(i)) Sfx.bad(); }
          else { const v = R.int(1, 3); S.pot[i] += v; S.last[i] = '+' + v; if (!m.bot(i)) Sfx.tone(500 + S.pot[i] * 30, 0.05, 'square', 0.04); }
        }
      } else if (m.released(i, 'a') || (S.pot[i] > 0 && !m.held(i, 'a'))) {
        if (S.pot[i] > 0) { MGH.burst(160 + i * 320, 570, ['#ffe680', '#fff'], 20, { speed: 240, up: 120, grav: 500 }); S.bank[i] += S.pot[i]; S.pot[i] = 0; S.last[i] = 'banked'; if (!m.bot(i)) Sfx.coin(); }
        S.tick[i] = 0;
        if (S.bank[i] >= 30) S.fin[i] = m.t;
      }
    }
    if (S.fin.some(f => f)) m.finish(this.score(m, S));
  },
  bot(m, S, i) {
    const need = 30 - S.bank[i];
    const target = Math.min(need, S.aim[i]);
    m.vin[i].a = S.cool[i] <= 0 && S.pot[i] < target;
    if (!m.vin[i].a) S.aim[i] = R.int(4, 8);
  },
  score(m, S) { return S.bank.map((b, i) => S.fin[i] ? 1000 - S.fin[i] : b); },
  fmt(s) { return s >= 100 ? 'Banked 30!' : `${s} banked`; },
  hud(m, S, i) { return `${S.bank[i]} (+${S.pot[i]})`; },
  draw(m, S, g) {
    MGH.scene(g, 'stage', m.t);
    for (let i = 0; i < 4; i++) {
      const x = 160 + i * 320, p = m.players[i], spin = m.held(i, 'a') && S.cool[i] <= 0;
      MGH.glow(g, x, 300, 150, spin ? 'rgba(255,230,120,0.35)' : 'rgba(255,255,255,0.08)');
      g.fillStyle = '#3a2468'; g.beginPath(); g.arc(x, 300, 112, 0, 7); g.fill();
      for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; g.fillStyle = (Math.floor(m.t * 8) + k) % 2 ? '#fff6b0' : '#a0742a'; g.beginPath(); g.arc(x + Math.cos(a) * 106, 300 + Math.sin(a) * 106, 4, 0, 7); g.fill(); }
      g.save(); g.translate(x, 300); g.rotate(spin ? m.t * 12 : 0);
      for (let k = 0; k < 8; k++) { g.fillStyle = k === 0 ? '#222' : (k % 2 ? p.color : '#fff'); g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 98, k * Math.PI / 4, (k + 1) * Math.PI / 4); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 2; g.stroke(); }
      MGH.emoji(g, '💀', Math.cos(Math.PI / 8) * 64, Math.sin(Math.PI / 8) * 64, 22);
      g.restore();
      g.fillStyle = '#fff6d0'; g.beginPath(); g.arc(x, 300, 16, 0, 7); g.fill();
      g.fillStyle = '#ff4d6d'; g.beginPath(); g.moveTo(x - 12, 180); g.lineTo(x + 12, 180); g.lineTo(x, 204); g.fill();
      MGH.av(g, m, i, x - 112, 470, 24, S.fin[i] ? 'cheer' : S.last[i] === '💀' && S.cool[i] > 0 ? 'hurt' : S.last[i] === 'banked' ? 'cheer' : spin ? (S.pot[i] >= 6 ? 'scared' : 'determined') : 'happy', { look: { x: 1, y: -0.5 } });
      if (S.last[i]) MGH.label(g, S.last[i], x + 30, 455, 24, '#fff');
      MGH.coin(g, x + 10, 505, 12, m.t); MGH.text(g, `pot ${S.pot[i]}`, x + 60, 512, 22, '#ffe680', 'center', 'bold');
      g.fillStyle = 'rgba(0,0,0,0.5)'; MGH.rr(g, x - 110, 560, 220, 20, 10); g.fill(); g.fillStyle = MGH.grad(g, 560, 580, [Char.shade(p.color, 0.3), p.color]); MGH.rr(g, x - 110, 560, 220 * Math.min(1, S.bank[i] / 30), 20, 10); g.fill();
      MGH.text(g, `${p.name}: ${S.bank[i]} / 30`, x, 620, 20, p.color, 'center', 'bold');
    }
  },
});

// 35 ---------------------------------------------------------------- Tower of Tokens (a fall down a crystal well)
MG.def({
  id: 'tokens', name: 'Tower of Tokens', type: 'Arcade', controls: 'Left/Right + A', dur: 40,
  how: 'Everyone is falling down the glowing crystal well! Steer LEFT/RIGHT to drop through the gaps in the ledges and grab gems on the way (gold tokens are worth 5). Don\'t ride a ledge up into the spiky ceiling — that spills 3 of your gems for others to grab. A = a quick sideways dash that bumps other fallers. Cracked ledges crumble when you stand on them.',
  wins: 'Most gems.',
  init(m, S) {
    S.cy = 0; S.next = 420; S.L = []; S.G = []; S.dust = [];
    S.p = [0, 1, 2, 3].map(i => ({ x: 280 + i * 240, y: 140, vx: 0, vy: 0, on: null, gems: 0, inv: 0, dash: 0, cd: 0, face: 1, mood: 0, hurt: 0 }));
    while (S.next < 1400) this.spawn(S);
    for (let k = 0; k < 40; k++) S.dust.push({ x: R.range(0, 1280), y: R.range(0, 720), s: R.range(1, 3), v: R.range(0.2, 0.7) });
  },
  // a crystal ledge across the well with one or two gaps, plus gems to collect around it
  spawn(S) {
    const y = S.next, two = Math.random() < 0.4, gaps = [];
    if (two) { gaps.push({ x: R.range(140, 560), w: R.range(110, 150) }); gaps.push({ x: R.range(720, 1140), w: R.range(110, 150) }); }
    else gaps.push({ x: R.range(140, 1140), w: R.range(130, 175) });
    const kind = Math.random() < 0.22 ? 'crack' : 'solid';
    S.L.push({ y, gaps, kind, crumble: -1 });
    // a trail of gems falling through one gap, and a few sitting on the ledge
    const gp = R.pick(gaps);
    for (let k = 1; k <= 3; k++) S.G.push({ x: gp.x + R.range(-20, 20), y: y + k * 46, v: 1 });
    for (let k = 0; k < (Math.random() < 0.6 ? 2 : 1); k++) { let x = R.range(70, 1210); if (!gaps.some(g => Math.abs(x - g.x) < g.w / 2 + 30)) S.G.push({ x, y: y - 30, v: 1 }); }
    if (Math.random() < 0.18) S.G.push({ x: R.range(100, 1180), y: y + 100, v: 5 });
    S.next += R.range(170, 230);
  },
  inGap(L, x, r) { return L.kind === 'gone' || L.gaps.some(g => Math.abs(x - g.x) < g.w / 2 - r * 0.45); },
  update(m, S, dt) {
    const V = Math.min(310, 150 + m.t * 4.2); // the well scrolls faster and faster
    S.cy += V * dt;
    while (S.next < S.cy + 1300) this.spawn(S);
    S.L = S.L.filter(L => L.y > S.cy - 60); S.G = S.G.filter(g => g.y > S.cy - 40 && !g.got);
    for (const d of S.dust) { d.y -= V * d.v * dt; if (d.y < 40) { d.y = 720; d.x = R.range(0, 1280); } }
    const R0 = 24;
    S.p.forEach((P, i) => {
      P.inv -= dt; P.cd -= dt; P.dash -= dt; P.hurt -= dt;
      const ax = m.axis(i).x; if (Math.abs(ax) > 0.2) P.face = Math.sign(ax);
      if (m.pressed(i, 'a') && P.cd <= 0) { P.dash = 0.18; P.cd = 0.9; P.vx = P.face * 900; if (!m.bot(i)) Sfx.whoosh(); }
      if (P.dash <= 0) P.vx += (ax * 380 - P.vx) * Math.min(1, dt * 12);
      P.x = clamp(P.x + P.vx * dt, 50, 1230);
      // standing on a ledge: carried upward with it until you walk off into a gap
      if (P.on && (P.on.kind === 'gone' || this.inGap(P.on, P.x, R0))) P.on = null;
      if (P.on) {
        P.y = P.on.y - R0; P.vy = 0;
        if (P.on.kind === 'crack' && P.on.crumble < 0) P.on.crumble = 0.6;
      } else {
        const py = P.y; P.vy = Math.min(720, P.vy + 1500 * dt); P.y += P.vy * dt;
        for (const L of S.L) if (py + R0 <= L.y + 2 && P.y + R0 >= L.y && !this.inGap(L, P.x, R0)) { P.y = L.y - R0; P.vy = 0; P.on = L; break; }
      }
      // can't fall out of the bottom of the screen
      if (P.y - S.cy > 690) { P.y = S.cy + 690; P.vy = Math.min(P.vy, V); }
      // the spiky ceiling
      if (P.y - R0 - S.cy < 66 && P.inv <= 0) {
        const lose = Math.min(3, P.gems); P.gems -= lose; P.inv = 1.6; P.hurt = 0.8;
        for (let k = 0; k < lose; k++) S.G.push({ x: clamp(P.x + R.range(-110, 110), 70, 1210), y: P.y + R.range(160, 260), v: 1, spill: true });
        if (P.on) { P.y = P.on.y + 30; P.on = null; P.vy = 200; }
        MGH.burst(P.x, P.y - S.cy, ['#ff6b8a', '#fff', m.players[i].color], 18, { speed: 260 }); MGH.pop(lose ? `-${lose} 💎` : 'ouch!', P.x, P.y - S.cy - 40, '#ff6b6b', 28); if (!m.bot(i)) { Sfx.bad(); MGH.shake(5); }
      }
      // gems
      for (const gm of S.G) if (!gm.got && Math.abs(gm.x - P.x) < R0 + 14 && Math.abs(gm.y - P.y) < R0 + 14) { gm.got = true; P.gems += gm.v; P.mood = 0.5; MGH.pop(`+${gm.v}`, gm.x, gm.y - S.cy - 20, gm.v > 1 ? '#ffd34d' : '#9fe8ff', gm.v > 1 ? 32 : 22); if (!m.bot(i)) Sfx.tone(gm.v > 1 ? 1100 : 880 + P.gems * 6, 0.06, 'triangle', 0.05); }
      P.mood -= dt;
    });
    // ledges crumble
    for (const L of S.L) if (L.crumble > 0) { L.crumble -= dt; if (L.crumble <= 0) { L.kind = 'gone'; MGH.burst(640, L.y - S.cy, ['#8fa8c8', '#c8d8f0'], 20, { speed: 200 }); } }
    // fallers bump each other sideways
    for (let a = 0; a < 4; a++) for (let b = a + 1; b < 4; b++) {
      const A = S.p[a], B = S.p[b], dx = B.x - A.x, dy = B.y - A.y;
      if (Math.abs(dx) < 46 && Math.abs(dy) < 44) { const push = (46 - Math.abs(dx)) / 2 * (Math.sign(dx) || 1); A.x -= push; B.x += push; if (A.dash > 0) B.vx += A.face * 500; if (B.dash > 0) A.vx += B.face * 500; }
    }
  },
  bot(m, S, i, dt) {
    const P = S.p[i], v = m.vin[i]; v.left = v.right = v.a = false; v.ax = 0;
    P.bt = (P.bt || 0) - dt;
    // the next ledge below: aim for its nearest gap; detour for a close gem
    const below = S.L.find(L => L.y > P.y + 30 && L.kind !== 'gone');
    let tx = P.x;
    if (P.on) { const g = P.on.gaps.reduce((a, b) => Math.abs(b.x - P.x) < Math.abs(a.x - P.x) ? b : a); tx = g.x; }
    else if (below) { const g = below.gaps.reduce((a, b) => Math.abs(b.x - P.x) < Math.abs(a.x - P.x) ? b : a); tx = g.x; }
    const gem = S.G.filter(gm => gm.y > P.y - 20 && gm.y < P.y + 220 && Math.abs(gm.x - P.x) < 260).sort((a, b) => b.v - a.v || Math.abs(a.x - P.x) - Math.abs(b.x - P.x))[0];
    if (gem && !P.on) tx = gem.x;
    if (P.bt <= 0) { P.aimErr = R.range(-30, 30); P.bt = R.range(0.3, 0.7); }
    const d = tx + (P.on ? 0 : P.aimErr || 0) - P.x;
    v.ax = Math.abs(d) > 8 ? clamp(d / 60, -1, 1) * 0.92 : 0;
    if (P.on && P.y - S.cy < 220 && Math.abs(d) > 120 && P.cd <= 0 && Math.random() < 0.05) { P.face = Math.sign(d); v.a = true; }
  },
  score(m, S) { return S.p.map(P => P.gems); },
  fmt(s) { return `${s} gems`; },
  hud(m, S, i) { return `💎 ${S.p[i].gems}`; },
  draw(m, S, g) {
    // deep crystal well: dark violet-teal rock, glowing crystal veins drifting past
    g.fillStyle = MGH.grad(g, 40, 720, ['#120a2a', '#0e2a3a', '#08121e']); g.fillRect(0, 40, 1280, 680);
    for (let k = 0; k < 9; k++) {
      const y = ((k * 157 - S.cy * 0.45) % 900 + 900) % 900 - 90, x = k % 2 ? 1230 : 50, c = ['#5fd8ff', '#c86aff', '#7cf0c0'][k % 3];
      MGH.glow(g, x, y, 90, c + '55'); g.fillStyle = c; g.globalAlpha = 0.7;
      for (let j = 0; j < 3; j++) { const ox = x + (k % 2 ? -1 : 1) * j * 16, h = 40 + j * 14; g.beginPath(); g.moveTo(ox - 8, y + 20); g.lineTo(ox + (k % 2 ? -10 : 10), y - h); g.lineTo(ox + 9, y + 20); g.fill(); }
      g.globalAlpha = 1;
    }
    g.fillStyle = 'rgba(30,20,50,0.85)'; g.fillRect(0, 40, 26, 680); g.fillRect(1254, 40, 26, 680);
    for (const d of S.dust) { g.fillStyle = `rgba(190,230,255,${0.25 + d.v * 0.4})`; g.fillRect(d.x, d.y, d.s, d.s * 3); }
    // ledges
    for (const L of S.L) {
      if (L.kind === 'gone') continue;
      const y = L.y - S.cy; if (y < 20 || y > 760) continue;
      const shake = L.crumble > 0 ? Math.sin(m.t * 60) * 3 : 0;
      const xs = [0]; L.gaps.slice().sort((a, b) => a.x - b.x).forEach(gp => { xs.push(gp.x - gp.w / 2, gp.x + gp.w / 2); }); xs.push(1280);
      for (let k = 0; k < xs.length; k += 2) {
        const x0 = xs[k] + shake, w = xs[k + 1] - xs[k]; if (w < 4) continue;
        g.fillStyle = L.kind === 'crack' ? MGH.grad(g, y, y + 22, ['#a89ab8', '#6a5a7a']) : MGH.grad(g, y, y + 22, ['#7ab0d8', '#3a5a8a']);
        MGH.rr(g, x0, y, w, 22, 8); g.fill();
        g.fillStyle = L.kind === 'crack' ? 'rgba(255,220,180,0.5)' : 'rgba(180,240,255,0.8)'; g.fillRect(x0 + 6, y + 2, Math.max(0, w - 12), 3);
        if (L.kind === 'crack') { g.strokeStyle = 'rgba(40,20,40,0.7)'; g.lineWidth = 2; for (let c = x0 + 30; c < x0 + w - 20; c += 70) { g.beginPath(); g.moveTo(c, y + 2); g.lineTo(c + 8, y + 11); g.lineTo(c - 4, y + 20); g.stroke(); } }
      }
    }
    // gems
    for (const gm of S.G) { const y = gm.y - S.cy; if (y < 50 || y > 740) continue; if (gm.v > 1) { MGH.glow(g, gm.x, y, 40, 'rgba(255,210,80,0.6)'); MGH.coin(g, gm.x, y, 15, m.t); } else MGH.gem(g, gm.x, y, 10, gm.spill ? '#ff9ad8' : '#5fd8ff', m.t); }
    // fallers
    S.p.forEach((P, i) => {
      const y = P.y - S.cy; if (P.inv > 0 && Math.sin(m.t * 30) > 0.3) return;
      if (P.dash > 0) { g.globalAlpha = 0.35; MGH.av(g, m, i, P.x - P.face * 26, y, 22, 'determined'); g.globalAlpha = 1; }
      MGH.av(g, m, i, P.x, y, 22, P.hurt > 0 ? 'hurt' : P.mood > 0 ? 'cheer' : P.on ? 'nervous' : 'happy', { look: { x: P.face, y: 0.6 } });
      MGH.text(g, String(P.gems), P.x, y - 58, 16, m.players[i].color, 'center', 'bold');
    });
    // spiky ceiling
    g.fillStyle = MGH.grad(g, 40, 70, ['#3a0a1a', '#7a1a3a']); g.fillRect(0, 40, 1280, 18);
    for (let x = 0; x < 1280; x += 32) { g.fillStyle = '#ff6b8a'; g.beginPath(); g.moveTo(x, 56); g.lineTo(x + 16, 80); g.lineTo(x + 32, 56); g.fill(); g.fillStyle = 'rgba(255,255,255,0.4)'; g.beginPath(); g.moveTo(x + 10, 56); g.lineTo(x + 16, 72); g.lineTo(x + 18, 56); g.fill(); }
    MGH.glow(g, 640, 60, 400, 'rgba(255,60,110,0.15)');
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
    MGH.scene(g, 'sky', m.t);
    const gf = this.gust(S, m.t);
    // canyon far below
    g.fillStyle = MGH.grad(g, 600, 720, ['#6a5a8a', '#2a1a3a']); g.fillRect(0, 600, 1280, 120);
    if (Math.abs(gf) > 0.1) for (let k = 0; k < 14; k++) { const y = 80 + k * 42, x = ((m.t * 700 * Math.sign(gf) + k * 300) % 1400 + 1400) % 1400 - 60; g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, y); g.lineTo(x - Math.sign(gf) * 90, y); g.stroke(); MGH.emoji(g, '🍃', x, y, 14, m.t * 5 + k); }
    if (Math.abs(gf) > 0.1) MGH.label(g, gf > 0 ? 'gust →' : '← gust', 640, 100, 22, '#fff');
    S.p.forEach((p, i) => {
      const cx = i * 320 + 160;
      for (const s of [-1, 1]) { g.fillStyle = '#6a5a4a'; g.beginPath(); g.moveTo(cx + s * 150, 574); g.lineTo(cx + s * 135, 720); g.lineTo(cx + s * 165, 720); g.fill(); }
      g.fillStyle = MGH.grad(g, 556, 574, ['#c98a4a', '#7a4a22']); MGH.rr(g, cx - 150, 556, 300, 18, 6); g.fill();
      if (!p.alive) { MGH.label(g, '💫 fell', cx, 640, 24, '#fff'); return; }
      g.save(); g.translate(cx, 560); g.rotate(p.a);
      g.strokeStyle = m.players[i].color; g.lineWidth = 8; g.lineCap = 'round';
      g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -120); g.stroke();
      g.strokeStyle = '#c9a36b'; g.lineWidth = 6; g.beginPath(); g.moveTo(-80, -95); g.lineTo(80, -95); g.stroke(); g.lineCap = 'butt';
      g.fillStyle = '#ffd34d'; for (const s of [-1, 1]) { g.beginPath(); g.arc(s * 80, -95, 9, 0, 7); g.fill(); }
      g.restore();
      const hx = cx + Math.sin(p.a) * 150, hy = 560 - Math.cos(p.a) * 150;
      MGH.av(g, m, i, hx, hy, 24, Math.abs(p.a) > 0.5 ? 'scared' : Math.abs(p.a) > 0.25 ? 'nervous' : 'happy', { noFeet: true, look: { x: -Math.sign(p.a), y: 0.3 } });
      if (Math.abs(p.a) > 0.5) MGH.emoji(g, '💦', hx + 30, hy - 40, 20);
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
    MGH.scene(g, 'meadow', m.t);
    S.tg.forEach(T => {
      const x = this.tpos(T, m.t);
      g.fillStyle = '#7a4a22'; g.fillRect(x - 4, T.y + 40, 8, 60);
      MGH.shadow(g, x, T.y + 100, 30, 0.25);
      [50, 38, 26, 14].forEach((r, k) => { g.fillStyle = ['#fff', '#e33', '#fff', '#e33'][k]; g.beginPath(); g.arc(x, T.y, r, 0, 7); g.fill(); });
      g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 2; g.beginPath(); g.arc(x, T.y, 50, 0, 7); g.stroke();
      MGH.glow(g, x, T.y, 20, 'rgba(255,240,140,0.5)');
    });
    for (let i = 0; i < 4; i++) { const x = 160 + i * 320; g.strokeStyle = '#7a4a22'; g.lineWidth = 8; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, 712); g.lineTo(x, 680); g.lineTo(x - 22, 650); g.moveTo(x, 680); g.lineTo(x + 22, 650); g.stroke(); g.strokeStyle = m.players[i].color; g.lineWidth = 3; g.beginPath(); g.moveTo(x - 22, 650); g.lineTo(x, 664); g.lineTo(x + 22, 650); g.stroke(); g.lineCap = 'butt';
      MGH.text(g, '●'.repeat(Math.max(0, S.ammo ? S.ammo[i] : 0)), x, 710, 14, '#fff');
      const lastHit = S.hits.filter(h => h.i === i).pop();
      MGH.av(g, m, i, x + 54, 686, 18, lastHit ? (lastHit.p ? 'cheer' : 'hurt') : 'determined', { look: { x: (m.cur[i].x - x) / 400, y: -1 } }); }
    for (const s of S.stones) { const x = lerp(s.sx, s.tx, s.t), y = lerp(s.sy, s.ty, s.t) - Math.sin(s.t * Math.PI) * 60; MGH.rock(g, x, y, 7 + (1 - s.t) * 4, 3, '#9a9a9a', s.t * 10); }
    S.hits.forEach(h => MGH.label(g, h.p ? '+' + h.p : 'miss', h.x, h.y - h.t * 40, 22, h.p ? m.players[h.i].color : '#ccc'));
    MGH.cursors(m, g);
  },
});

// 38 ---------------------------------------------------------------- Flick Off
MG.def({
  id: 'flick', name: 'Flick Off', type: 'Skill', controls: '1 button (hold & release)', mouseA: true,
  how: 'Hold to charge the power meter and release to flick a coin toward the far edge. Closer to the edge is better, but falling off scores zero. Watch the WIND flag — it pushes or slows each flick — and land in the GOLD ZONE near the edge for +15. Three flicks.',
  wins: 'Best single flick.',
  init(m, S) { S.p = [0, 1, 2, 3].map(() => ({ n: 0, best: 0, last: null, charge: 0, chg: false, coin: null, aim: R.range(0.6, 0.9), wind: Math.round(R.range(-0.12, 0.12) * 100) / 100 })); S.L = 560; },
  update(m, S, dt) {
    S.p.forEach((p, i) => {
      if (p.coin) {
        const c = p.coin; c.y += c.v * dt; c.v -= 520 * dt;
        if (c.y >= S.L) { MGH.burst(i * 320 + 160, 680 - S.L - 10, ['#e8b923', '#fff'], 18, { speed: 260, up: 150, grav: 700 }); p.last = 0; p.coin = null; p.n++; p.wind = Math.round(R.range(-0.12, 0.12) * 100) / 100; if (!m.bot(i)) Sfx.bad(); }
        else if (c.v <= 0) { let sc = Math.round(c.y / S.L * 100); if (sc >= 88) { sc += 15; MGH.pop('GOLD +15', i * 320 + 160, 680 - c.y - 30, '#ffe680', 26); } p.last = sc; p.best = Math.max(p.best, sc); p.coin = null; p.n++; p.wind = Math.round(R.range(-0.12, 0.12) * 100) / 100; if (!m.bot(i)) Sfx.coin(); }
        return;
      }
      if (p.n >= 3) return;
      if (m.held(i, 'a')) { p.chg = true; p.charge += dt; }
      else if (p.chg) {
        p.chg = false;
        const pw = (1 - Math.cos(p.charge * Math.PI / 0.9)) / 2;
        p.coin = { y: 0, v: Math.sqrt(2 * 520 * S.L * 1.15) * pw * (1 + p.wind) }; p.charge = 0;
      }
    });
    if (S.p.every(p => p.n >= 3 && !p.coin)) m.finish(S.p.map(p => p.best));
  },
  bot(m, S, i) {
    const p = S.p[i], v = m.vin[i];
    if (p.coin || p.n >= 3) { v.a = false; return; }
    const pw = (1 - Math.cos(p.charge * Math.PI / 0.9)) / 2;
    const want = Math.min(0.97, Math.sqrt(p.aim / 1.15) / (1 + p.wind * 0.8) + (p.noise || 0));
    if (!v.a && !p.chg) v.a = true;
    else if (v.a && pw >= want && Math.sin(p.charge * Math.PI / 0.9) > 0) { v.a = false; p.aim = R.range(0.8, 0.95); p.noise = R.range(-0.1, 0.08); }
  },
  score(m, S) { return S.p.map(p => p.best); },
  fmt(s) { return s > 100 ? `${s - 15}% + gold` : `${s}% of the table`; },
  hud(m, S, i) { return `best ${S.p[i].best}%`; },
  draw(m, S, g) {
    MGH.scene(g, 'night', m.t);
    S.p.forEach((p, i) => {
      const cx = i * 320 + 160, base = 680;
      // the ledge: a tall stone pillar with a golden lip
      g.fillStyle = MGH.grad(g, base - S.L - 10, base, ['#8a7a66', '#4a3e30']); g.fillRect(cx - 70, base - S.L - 10, 140, S.L + 10);
      g.fillStyle = MGH.grad(g, base - S.L - 14, base - S.L, ['#ffe680', '#c98a1a']); MGH.rr(g, cx - 74, base - S.L - 14, 148, 10, 4); g.fill();
      MGH.glow(g, cx, base - S.L - 10, 60, 'rgba(255,230,120,0.25)');
      // gold zone near the edge and this flick's wind flag
      g.fillStyle = 'rgba(255,215,80,0.35)'; g.fillRect(cx - 70, base - S.L, 140, S.L * 0.12); MGH.text(g, 'GOLD +15', cx, base - S.L * 0.94, 13, '#ffe680', 'center', 'bold');
      if (p.n < 3) { const wx = cx - 100, wy = 150, wl = 12 + Math.abs(p.wind) * 220, wd = p.wind >= 0 ? -1 : 1; g.strokeStyle = '#ddd'; g.lineWidth = 3; g.beginPath(); g.moveTo(wx, wy); g.lineTo(wx, wy + 50); g.stroke(); g.fillStyle = p.wind >= 0 ? '#7cf06a' : '#ff6b6b'; g.beginPath(); g.moveTo(wx, wy); g.lineTo(wx + 8 + Math.sin(m.t * 8) * 3, wy + wd * wl * 0.2 - wd * 0); g.lineTo(wx + 16, wy + 12); g.fill(); MGH.text(g, p.wind >= 0 ? `tailwind +${Math.round(p.wind * 100)}%` : `headwind ${Math.round(p.wind * 100)}%`, wx, wy - 8, 12, '#fff'); }
      const pw = (1 - Math.cos(p.charge * Math.PI / 0.9)) / 2;
      g.fillStyle = 'rgba(0,0,0,0.5)'; MGH.rr(g, cx + 80, 200, 20, 400, 10); g.fill();
      g.fillStyle = MGH.grad(g, 200, 600, ['#ff4d6d', '#ffd34d', '#6fdc8c']); MGH.rr(g, cx + 80, 600 - 400 * pw, 20, 400 * pw, 10); g.fill();
      const y = p.coin ? base - p.coin.y : base - 14;
      if (p.coin) for (let s = 1; s < 4; s++) { g.globalAlpha = 0.2; MGH.coin(g, cx, y + s * 12, 16, m.t * 10); } g.globalAlpha = 1;
      MGH.coin(g, cx, y, 18, p.coin ? m.t * 12 : 0);
      MGH.av(g, m, i, cx - 108, 664, 20, p.coin ? 'nervous' : p.chg ? 'determined' : p.last === null ? 'happy' : p.last === 0 ? 'hurt' : p.last >= 85 ? 'cheer' : 'happy', { look: { x: 0.4, y: -1 } });
      MGH.label(g, `${p.n}/3 · last ${p.last === null ? '-' : p.last + '%'}`, cx, 110, 16, '#fff');
    });
  },
});

// 39 ---------------------------------------------------------------- Dig Site
MG.def({
  id: 'dig', name: 'Dig Site', type: 'Strategy', controls: 'Move + dig', dur: 55,
  how: 'A shared grid of buried tiles. Step your shovel around with the arrows / stick and press the button to dig. Everyone has 10 digs in 55 seconds. Gems score, bombs cost 3. Dug sand shows how many gems are next to it.',
  wins: 'Most gems.',
  init(m, S) {
    S.cols = 12; S.rows = 6; S.cell = 92; S.x0 = (1280 - 12 * 92) / 2; S.y0 = 110;
    const n = 72; const kinds = new Array(n).fill(0); R.shuffle([...Array(n).keys()]).slice(0, 18).forEach((k, j) => { kinds[k] = j < 12 ? 1 : 2; });
    S.kind = kinds; S.dug = new Array(n).fill(-1); S.left = [10, 10, 10, 10]; S.pts = [0, 0, 0, 0];
    S.bt = [0, 1, 2, 3].map(() => R.range(0.8, 2)); S.btTarget = [null, null, null, null];
    S.sel = [[2, 1], [9, 1], [2, 4], [9, 4]].map(([c, r]) => ({ c, r })); S.mv = [0, 0, 0, 0];
  },
  idxAt(S, x, y) { const c = Math.floor((x - S.x0) / S.cell), r = Math.floor((y - S.y0) / S.cell); return c >= 0 && c < S.cols && r >= 0 && r < S.rows ? r * S.cols + c : -1; },
  adj(S, k) { const c = k % S.cols, r = Math.floor(k / S.cols); let n = 0; for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { const cc = c + dc, rr = r + dr; if ((dr || dc) && cc >= 0 && cc < S.cols && rr >= 0 && rr < S.rows && S.kind[rr * S.cols + cc] === 1) n++; } return n; },
  update(m, S, dt) {
    for (let i = 0; i < 4; i++) {
      const sl = S.sel[i];
      if (m.pressed(i, 'left')) sl.c = Math.max(0, sl.c - 1); if (m.pressed(i, 'right')) sl.c = Math.min(S.cols - 1, sl.c + 1);
      if (m.pressed(i, 'up')) sl.r = Math.max(0, sl.r - 1); if (m.pressed(i, 'down')) sl.r = Math.min(S.rows - 1, sl.r + 1);
      if (S.left[i] <= 0 || !m.pressed(i, 'a')) continue;
      const k = sl.r * S.cols + sl.c;
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
    const k = S.btTarget[i], tc = k % S.cols, tr = Math.floor(k / S.cols), sl = S.sel[i];
    v.left = v.right = v.up = v.down = false;
    S.bt[i] -= dt; S.mv[i] -= dt;
    if (S.mv[i] <= 0 && (sl.c !== tc || sl.r !== tr)) { S.mv[i] = 0.16; if (sl.c < tc) v.right = true; else if (sl.c > tc) v.left = true; else if (sl.r < tr) v.down = true; else v.up = true; }
    else if (sl.c === tc && sl.r === tr && S.bt[i] <= 0) { v.a = true; S.bt[i] = R.range(1.2, 2.4); S.btTarget[i] = null; }
  },
  score(m, S) { return S.pts.slice(); },
  hud(m, S, i) { return `💎${S.pts[i]} (${S.left[i]} digs)`; },
  draw(m, S, g) {
    MGH.scene(g, 'desert', m.t);
    g.fillStyle = 'rgba(60,30,10,0.4)'; MGH.rr(g, S.x0 - 14, S.y0 - 14, S.cols * S.cell + 28, S.rows * S.cell + 28, 18); g.fill();
    for (let k = 0; k < 72; k++) {
      const x = S.x0 + (k % S.cols) * S.cell, y = S.y0 + Math.floor(k / S.cols) * S.cell, d = S.dug[k], c = S.cell - 4;
      if (d < 0) { g.fillStyle = MGH.grad(g, y, y + c, ['#d9b47a', '#a8804a']); MGH.rr(g, x + 2, y + 2, c, c, 10); g.fill(); g.fillStyle = 'rgba(255,255,255,0.18)'; MGH.rr(g, x + 6, y + 5, c - 8, 10, 5); g.fill(); g.fillStyle = 'rgba(120,80,30,0.35)'; for (let s = 0; s < 4; s++) { g.beginPath(); g.arc(x + 14 + MGH.hash(k * 4 + s) * (c - 24), y + 22 + MGH.hash(k * 9 + s) * (c - 30), 3, 0, 7); g.fill(); } }
      else {
        g.fillStyle = MGH.grad(g, y, y + c, ['#5a3a1c', '#3a2410']); MGH.rr(g, x + 2, y + 2, c, c, 10); g.fill();
        g.strokeStyle = m.players[d].color; g.lineWidth = 3; MGH.rr(g, x + 5, y + 5, c - 6, c - 6, 8); g.stroke();
        if (S.kind[k] === 1) MGH.gem(g, x + S.cell / 2, y + S.cell / 2, 22, '#5fd8ff', m.t + k);
        else if (S.kind[k] === 2) MGH.emoji(g, '💥', x + S.cell / 2, y + S.cell / 2, 40);
        else { const n = this.adj(S, k); MGH.text(g, n ? String(n) : '·', x + S.cell / 2, y + S.cell / 2 + 12, 32, ['#9a8a7a', '#9fd8ff', '#7cf06a', '#ffd34d', '#ff8a3d'][Math.min(4, n)], 'center', 'bold'); }
      }
    }
    // each player's shovel marker on the grid
    for (let i = 0; i < 4; i++) {
      const sl = S.sel[i], x = S.x0 + sl.c * S.cell, y = S.y0 + sl.r * S.cell, o = 3 + i * 4, pulse = 0.6 + 0.4 * Math.sin(m.t * 6 + i);
      g.strokeStyle = m.players[i].color; g.globalAlpha = pulse; g.lineWidth = 4; MGH.rr(g, x + o, y + o, S.cell - o * 2, S.cell - o * 2, 10); g.stroke(); g.globalAlpha = 1;
      MGH.av(g, m, i, x + 22 + (i % 2) * 48, y + 30 + Math.floor(i / 2) * 36, 11, S.left[i] <= 0 ? (S.pts[i] > 2 ? 'cheer' : 'neutral') : 'determined', { noFeet: true, prop: '⛏️' });
    }
    for (let i = 0; i < 4; i++) MGH.text(g, `${m.players[i].name}: ${'⛏'.repeat(Math.max(0, S.left[i]))}`, 160 + i * 320, 700, 16, m.players[i].color, 'center', 'bold');
  },
});

// 40 ---------------------------------------------------------------- Hoard Heist
MG.def({
  id: 'heist', name: 'Hoard Heist', type: 'Stealth', controls: 'Move + grab', dur: 45,
  how: "Coins lie on the floor of a hall. A Warden's lantern sweeps the room. Grab coins while the beam is away and carry them to the door. If the light catches you, everything you carry is flung to random spots in the hall. When every coin is banked the game ends at once.",
  wins: 'Most coins banked at the door.',
  init(m, S) {
    S.coins = []; for (let k = 0; k < 34; k++) S.coins.push({ x: R.range(80, 1200), y: R.range(170, 560) });
    S.b = [0, 1, 2, 3].map(i => Object.assign(MGH.body(400 + i * 160, 660, 23), { carry: 0, bank: 0, stun: 0 }));
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
        for (let k = 0; k < b.carry; k++) { const c = { x: R.range(80, 1200), y: R.range(170, 560) }; S.coins.push(c); S.fly = S.fly || []; S.fly.push({ fx: b.x, fy: b.y, c, t: 0 }); }
        b.carry = 0; b.stun = 0.6; MGH.pop('Caught!', b.x, b.y - 30, '#ffe680', 26); MGH.shake(4); if (!m.bot(i)) Sfx.bad();
      }
      if (b.y > 640 && Math.abs(b.x - 640) < 110 && b.carry) { MGH.pop('+' + b.carry, b.x, b.y - 30, '#ffe680', 30); MGH.burst(b.x, b.y, ['#ffe680', '#fff'], 20, { speed: 240 }); b.bank += b.carry; b.carry = 0; if (!m.bot(i)) Sfx.star(); }
    });
    MGH.collide(S.b, 0.4);
    if (S.fly) { S.fly.forEach(f => { f.t += dt; }); S.fly = S.fly.filter(f => f.t < 0.7); }
    // every coin banked: the game ends and the richest thief is crowned
    if (!S.coins.length && S.b.every(b => !b.carry) && !m.done) { MGH.burst(640, 400, ['#ffe680', '#fff'], 60, { speed: 400 }); m.finish(this.score(m, S)); }
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
    MGH.scene(g, 'temple', m.t);
    g.fillStyle = MGH.grad(g, 130, 720, ['#3a2a20', '#1e1610']); g.fillRect(0, 130, 1280, 590);
    for (let x = 0; x < 1280; x += 80) for (let y = 130; y < 720; y += 80) { g.fillStyle = (x + y) % 160 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.12)'; g.fillRect(x, y, 80, 80); }
    // the door
    g.fillStyle = MGH.grad(g, 640, 720, ['#7a4a22', '#3a200c']); MGH.rr(g, 530, 640, 220, 90, 14); g.fill(); g.strokeStyle = '#ffd34d'; g.lineWidth = 4; g.stroke(); MGH.label(g, '🚪 BANK HERE', 640, 690, 18, '#ffe680');
    S.coins.forEach((c, k) => MGH.coin(g, c.x, c.y, 10, m.t + k));
    if (S.fly) S.fly.forEach(f => { const k = Math.min(1, f.t / 0.7); MGH.coin(g, lerp(f.fx, f.c.x, k), lerp(f.fy, f.c.y, k) - Math.sin(k * Math.PI) * 120, 10, f.t * 12); });
    // lantern beam
    const gr = g.createRadialGradient(S.wx, S.wy, 10, S.wx, S.wy, 720); gr.addColorStop(0, 'rgba(255,240,170,0.5)'); gr.addColorStop(1, 'rgba(255,240,170,0.05)');
    g.fillStyle = gr; g.beginPath(); g.moveTo(S.wx, S.wy); g.arc(S.wx, S.wy, 720, S.ang - 0.2, S.ang + 0.2); g.closePath(); g.fill();
    Char.draw(g, S.wx + 40, S.wy - 6, 22, -1, '#6a6a8a', { mood: 'determined', seed: 7, noFeet: true, look: { x: Math.cos(S.ang), y: 0.5 } });
    MGH.lantern(g, S.wx, S.wy, 1.1, m.t);
    S.b.forEach((b, i) => { MGH.shadow(g, b.x, b.y + b.r * 1.25, b.r, 0.35); MGH.drawBody(g, b, m.players[i], b.stun > 0 ? '💫' : (b.carry ? '🪙' + b.carry : ''), b.stun > 0 ? 'dizzy' : this.inBeam(S, b.x, b.y) ? 'scared' : b.carry ? 'cheer' : null); });
    MGH.label(g, `🪙 ${S.coins.length} left on the floor`, 1120, 100, 18, '#ffe680');
  },
});
