'use strict';
// Moot minigames 1-10

// 1 ---------------------------------------------------------------- Starfall Catch
MG.def({
  id: 'starfall', name: 'Starfall Catch', type: 'Arcade', controls: 'Left/Right', dur: 30,
  how: 'Stars fall from the cracked Sky. Slide your basket to catch them. Ash clouds cost 2 points.',
  wins: 'Most points.',
  init(m, S) {
    S.items = [];
    for (let t = 0.3; t < 29; t += R.range(0.28, 0.5)) S.items.push({ t, x: R.range(30, 290), ash: Math.random() < 0.28, v: 260 + t * 7 });
    S.bx = [160, 160, 160, 160]; S.pts = [0, 0, 0, 0];
    S.res = [new Set(), new Set(), new Set(), new Set()];
    S.pops = []; S.mood = [0, 1, 2, 3].map(() => ({ m: 'happy', t: 0 }));
  },
  yOf(it, t) { return 40 + (t - it.t) * it.v; },
  update(m, S, dt) {
    for (let i = 0; i < 4; i++) {
      const ax = m.axis(i).x; S.bx[i] = clamp(S.bx[i] + ax * 520 * dt, 40, 280);
      S.items.forEach((it, k) => {
        if (S.res[i].has(k)) return;
        const y = this.yOf(it, m.t);
        if (y >= 650) {
          S.res[i].add(k);
          if (y < 700 && Math.abs(it.x - S.bx[i]) < 48) {
            S.pts[i] += it.ash ? -2 : 1; S.mood[i] = { m: it.ash ? 'hurt' : 'cheer', t: 0.6 };
            MGH.burst(i * 320 + it.x, 645, it.ash ? ['#555', '#888', '#333'] : ['#ffe680', '#fff', '#ffd34d'], 16, { speed: 220, up: 80, grav: 200 });
            S.pops.push({ x: i * 320 + it.x, y: 640, s: it.ash ? '−2' : '+1', t: 0, c: it.ash ? '#f66' : '#ffe680' });
            if (!m.bot(i)) { if (it.ash) Sfx.bad(); else Sfx.coin(); }
          }
        }
      });
    }
    S.pops.forEach(p => { p.t += dt; }); S.pops = S.pops.filter(p => p.t < 0.8);
    S.mood.forEach(x => { x.t -= dt; });
  },
  bot(m, S, i) {
    if (!S.target) S.target = [];
    let best = null, bt = 1e9;
    S.items.forEach((it, k) => {
      if (it.ash || S.res[i].has(k)) return;
      const y = this.yOf(it, m.t); if (y < 40 || y > 650) return;
      const tt = (650 - y) / it.v;
      if (Math.abs(it.x - S.bx[i]) / 520 > tt + 0.1) return;
      if (tt < bt) { bt = tt; best = it; }
    });
    let tx = best ? best.x : 160;
    for (const [k, it] of S.items.entries()) {
      if (!it.ash || S.res[i].has(k)) continue;
      const y = this.yOf(it, m.t);
      if (y > 520 && y < 650 && Math.abs(it.x - tx) < 50) tx = it.x > 160 ? it.x - 100 : it.x + 100;
    }
    tx += (i - 1.5) * 3;
    const d = tx - S.bx[i];
    MGH.setLR(m, i, Math.abs(d) < 10 ? 0 : Math.sign(d));
  },
  score(m, S) { return S.pts.slice(); },
  hud(m, S, i) { return S.pts[i]; },
  draw(m, S, g) {
    MGH.scene(g, 'night', m.t);
    for (let i = 1; i < 4; i++) { g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(i * 320 - 1, 40, 2, 680); }
    // cracked sky
    g.strokeStyle = 'rgba(255,230,150,0.35)'; g.lineWidth = 2; g.beginPath(); for (let k = 0; k < 6; k++) { const x = 110 + k * 210; g.moveTo(x, 40); g.lineTo(x + 20, 62); g.lineTo(x - 6, 80); g.lineTo(x + 14, 100); } g.stroke();
    for (let i = 0; i < 4; i++) {
      S.items.forEach((it, k) => {
        if (S.res[i].has(k)) return;
        const y = this.yOf(it, m.t); if (y < 40 || y > 720) return;
        const x = i * 320 + it.x;
        if (it.ash) {
          for (let s = 1; s < 5; s++) { g.globalAlpha = 0.15; g.fillStyle = '#6a6070'; g.beginPath(); g.arc(x + Math.sin(m.t * 6 + s) * 4, y - s * 12, 14 - s * 2, 0, 7); g.fill(); }
          g.globalAlpha = 1; MGH.rock(g, x, y, 15, k, '#4a4250', m.t * 2 + k);
          MGH.glow(g, x, y, 22, 'rgba(255,70,30,0.35)');
        } else {
          g.strokeStyle = 'rgba(255,240,170,0.35)'; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y - 40); g.lineTo(x, y - 6); g.stroke(); g.lineCap = 'butt';
          MGH.star(g, x, y, 15, '#ffd34d', m.t * 3 + k);
        }
      });
      const x = i * 320 + S.bx[i], mv = m.axis(i).x, p = m.players[i];
      MGH.shadow(g, x, 690, 60, 0.35);
      MGH.av(g, m, i, x, 614, 26, S.mood[i].t > 0 ? S.mood[i].m : 'determined', { look: { x: mv * 0.5, y: -1 }, walk: Math.abs(mv) });
      // woven basket
      g.fillStyle = '#a8692e'; g.beginPath(); g.moveTo(x - 50, 646); g.lineTo(x + 50, 646); g.lineTo(x + 40, 682); g.lineTo(x - 40, 682); g.closePath(); g.fill();
      g.strokeStyle = '#6e3f18'; g.lineWidth = 2; for (let k = -40; k <= 40; k += 10) { g.beginPath(); g.moveTo(x + k * 1.2, 646); g.lineTo(x + k, 682); g.stroke(); } g.beginPath(); g.moveTo(x - 46, 664); g.lineTo(x + 46, 664); g.stroke();
      g.fillStyle = '#c98a4a'; MGH.rr(g, x - 54, 640, 108, 10, 5); g.fill(); g.strokeStyle = p.color; g.lineWidth = 3; g.stroke();
      for (let s = 0; s < Math.min(6, Math.max(0, S.pts[i])); s++) MGH.star(g, x - 30 + s * 12, 642 - (s % 2) * 5, 6, '#ffd34d', s, false);
    }
    S.pops.forEach(p => MGH.label(g, p.s, p.x, p.y - p.t * 60, 24, p.c));
  },
});

// 2 ---------------------------------------------------------------- Ankar's Gaze
MG.def({
  id: 'gaze', name: "Ankar's Gaze", type: 'Timing', controls: '1 button', dur: 40, mouseA: true,
  how: "Hold to run toward the finish. The Ankar's eye opens at random moments — if you are moving when it opens, you are thrown back to the start. Release to freeze.",
  wins: 'First to the finish, else furthest along.',
  init(m, S) { S.pos = [0, 0, 0, 0]; S.fin = [0, 0, 0, 0]; S.eye = 'closed'; S.et = R.range(1.5, 3); S.react = [0, 0, 0, 0]; S.flash = [0, 0, 0, 0]; },
  update(m, S, dt) {
    S.et -= dt;
    if (S.et <= 0) {
      if (S.eye === 'closed') { S.eye = 'tell'; S.et = 0.5; }
      else if (S.eye === 'tell') { S.eye = 'open'; S.et = R.range(1, 2.2); S.grace = 0.1; Sfx.tone(160, 0.3, 'sawtooth', 0.05); }
      else { S.eye = 'closed'; S.et = R.range(0.8, 3.2); }
    }
    if (S.grace > 0) S.grace -= dt;
    for (let i = 0; i < 4; i++) {
      if (S.fin[i]) continue;
      const run = m.held(i, 'a');
      if (run) {
        if (S.eye === 'open' && S.grace <= 0) { MGH.burst(100 + S.pos[i], 226 + i * 120, ['#ff4d6d', '#b46bff'], 22, { speed: 300 }); MGH.shake(6); S.pos[i] = 0; S.flash[i] = 0.6; if (!m.bot(i)) Sfx.bad(); }
        else S.pos[i] += 95 * dt;
      }
      if (S.pos[i] >= 1000) { S.fin[i] = m.t; }
      if (S.flash[i] > 0) S.flash[i] -= dt;
    }
    if (S.fin.every(f => f) || S.fin.some(f => f) && m.t > 0) {
      if (S.fin.some(f => f)) m.finish(this.score(m, S));
    }
  },
  bot(m, S, i, dt) {
    const v = m.vin[i];
    if (S.eye === 'closed') { S.react[i] = R.range(0.12, 0.48); v.a = true; }
    else { S.react[i] -= dt; if (S.react[i] <= 0) v.a = false; }
    if (S.eye === 'open') v.a = false;
  },
  score(m, S) { return S.pos.map((p, i) => S.fin[i] ? 5000 - S.fin[i] : p); },
  fmt(s) { return s >= 1000 ? 'Finished!' : Math.round(s / 10) + '%'; },
  hud(m, S, i) { return Math.min(100, Math.round(S.pos[i] / 10)) + '%'; },
  draw(m, S, g) {
    MGH.scene(g, 'temple', m.t);
    const open = S.eye === 'open' ? 1 : S.eye === 'tell' ? 0.25 + 0.15 * Math.sin(m.t * 40) : 0.06;
    // the Ankar: a hovering shadow beast with one huge eye
    g.save(); g.translate(1170, 178 + Math.sin(m.t * 1.6) * 8);
    MGH.glow(g, 0, 0, 170, S.eye === 'open' ? 'rgba(255,40,80,0.55)' : 'rgba(150,80,220,0.45)');
    g.fillStyle = '#2a0f45'; g.beginPath(); for (let k = 0; k <= 24; k++) { const a = k / 24 * Math.PI * 2, r = 92 + Math.sin(a * 5 + m.t * 3) * 8; g.lineTo(Math.cos(a) * r * 1.15, Math.sin(a) * r * 0.75); } g.closePath(); g.fill();
    for (let k = 0; k < 5; k++) { g.strokeStyle = '#2a0f45'; g.lineWidth = 9 - k; g.beginPath(); g.moveTo(-60 + k * 30, 50); g.quadraticCurveTo(-70 + k * 30 + Math.sin(m.t * 3 + k) * 20, 110, -50 + k * 30 + Math.sin(m.t * 2 + k) * 25, 150); g.stroke(); }
    g.fillStyle = '#f3e0ff'; g.beginPath(); g.ellipse(0, 0, 70, 46 * open, 0, 0, 7); g.fill();
    if (open > 0.2) { g.fillStyle = S.eye === 'open' ? '#ff2a5a' : '#8a3ad0'; g.beginPath(); g.arc(-10 + Math.sin(m.t * 2) * 10, 0, 26 * open, 0, 7); g.fill(); g.fillStyle = '#12051f'; g.beginPath(); g.ellipse(-10 + Math.sin(m.t * 2) * 10, 0, 6, 22 * open, 0, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(-22, -10, 6 * open, 0, 7); g.fill(); }
    g.strokeStyle = '#12051f'; g.lineWidth = 5; g.beginPath(); g.ellipse(0, 0, 72, 48 * Math.max(open, 0.08), 0, 0, 7); g.stroke();
    g.restore();
    if (S.eye === 'open') { g.save(); g.globalAlpha = 0.18 + 0.06 * Math.sin(m.t * 20); g.fillStyle = '#ff2a5a'; g.beginPath(); g.moveTo(1150, 140); g.lineTo(80, 180); g.lineTo(80, 700); g.closePath(); g.fill(); g.restore(); }
    for (let i = 0; i < 4; i++) {
      const y = 260 + i * 115, p = m.players[i];
      g.fillStyle = 'rgba(0,0,0,0.35)'; MGH.rr(g, 96, y - 4, 1012, 44, 14); g.fill();
      MGH.plat(g, 100, y - 10, 1000, 30, 'stone');
      g.fillStyle = p.color; g.globalAlpha = 0.35; g.fillRect(100, y - 10, Math.min(1000, S.pos[i]), 6); g.globalAlpha = 1;
      // finish flag
      g.fillStyle = '#ddd'; g.fillRect(1098, y - 70, 5, 64); g.fillStyle = (Math.floor(m.t * 4) % 2) ? '#fff' : '#222'; g.beginPath(); g.moveTo(1103, y - 70); g.lineTo(1140 + Math.sin(m.t * 6) * 4, y - 58); g.lineTo(1103, y - 46); g.fill();
      const x = 100 + S.pos[i], run = m.held(i, 'a') && !S.fin[i];
      const mood = S.fin[i] ? 'cheer' : S.flash[i] > 0 ? 'hurt' : (S.eye === 'open' ? 'scared' : S.eye === 'tell' ? 'nervous' : run ? 'determined' : 'happy');
      if (run && Math.random() < 0.3) MGH.burst(Math.min(x, 1100) - 16, y - 12, 'rgba(220,200,170,0.7)', 2, { speed: 60, life: 0.35 });
      MGH.av(g, m, i, Math.min(x, 1100), y - 26, 22, mood, { walk: run ? 1 : 0, look: { x: 1, y: 0 } });
      MGH.text(g, p.name, 90, y + 12, 18, p.color, 'right', 'bold');
    }
    MGH.label(g, S.eye === 'open' ? '👁️ THE EYE IS OPEN — FREEZE!' : (S.eye === 'tell' ? 'The eye twitches…' : 'Hold to run'), 560, 130, 30, S.eye === 'open' ? '#ff6d8d' : '#eee');
  },
});

// 3 ---------------------------------------------------------------- Lightning Rod
MG.def({
  id: 'lightning', name: 'Lightning Rod', type: 'Reaction', controls: '1 button', mouseA: true,
  how: 'Five rounds. After a hidden 1 to 5 second wait a bolt strikes. The first press scores a point. An early press loses one.',
  wins: 'Most points.',
  init(m, S) { S.pts = [0, 0, 0, 0]; S.round = 0; this.newRound(S); },
  newRound(S) { S.round++; S.wait = R.range(1, 5); S.bolt = false; S.bt = 0; S.lock = [false, false, false, false]; S.winner = -1; S.pause = 0; S.botT = [0, 1, 2, 3].map(() => R.range(0.2, 0.5)); S.botEarly = [0, 1, 2, 3].map(() => Math.random() < 0.06 ? R.range(0.3, S.wait) : -1); },
  boltPath() { const pts = [[640 + R.range(-200, 200), 40]]; let x = pts[0][0]; for (let y = 80; y <= 300; y += R.range(25, 45)) { x += R.range(-50, 50) + (640 - x) * 0.25; pts.push([x, y]); } pts.push([640, 318]); return pts; },
  update(m, S, dt) {
    if (S.pause > 0) { S.pause -= dt; if (S.pause <= 0) { if (S.round >= 5) m.finish(S.pts.slice()); else this.newRound(S); } return; }
    if (!S.bolt) { S.wait -= dt; if (S.wait <= 0) { S.bolt = true; S.bt = 0; Sfx.thunder(); S.path = this.boltPath(); MGH.shake(16); MGH.burst(620, 450, ['#ffe680', '#fff', '#9fd8ff'], 50, { speed: 600, kind: 'spark', size: 4 }); } }
    else S.bt += dt;
    for (let i = 0; i < 4; i++) {
      if (S.lock[i] || !m.pressed(i, 'a')) continue;
      if (!S.bolt) { S.pts[i]--; S.lock[i] = true; if (!m.bot(i)) Sfx.bad(); }
      else if (S.winner < 0) { S.winner = i; S.pts[i]++; S.pause = 1.4; S.react = S.bt; Sfx.tone(1200, 0.2, 'square', 0.05); Sfx.tone(1600, 0.25, 'triangle', 0.05, 0, 0.08); MGH.burst(190 + i * 300, 560, ['#ffe680', '#fff', m.players[i].color], 30, { speed: 300, kind: 'spark', size: 3 }); }
    }
    if (S.bolt && S.bt > 2 && S.winner < 0) S.pause = 1;
  },
  bot(m, S, i, dt) {
    const v = m.vin[i]; v.a = false;
    if (S.pause > 0 || S.lock[i]) return;
    if (!S.bolt && S.botEarly[i] > 0) { S.botEarly[i] -= dt; if (S.botEarly[i] <= 0) v.a = true; }
    if (S.bolt && S.bt >= S.botT[i]) v.a = !m.prev[i].a;
  },
  score(m, S) { return S.pts.slice(); },
  hud(m, S, i) { return S.pts[i]; },
  draw(m, S, g) {
    MGH.scene(g, 'storm', m.t);
    const flash = S.bolt && S.bt < 0.18, pre = !S.bolt && S.wait < 0.6;
    if (pre) { g.fillStyle = `rgba(200,210,255,${0.06 * Math.abs(Math.sin(m.t * 30))})`; g.fillRect(0, 0, 1280, 720); }
    // tower with the rod
    g.fillStyle = '#1a1e33'; g.beginPath(); g.moveTo(560, 720); g.lineTo(600, 360); g.lineTo(680, 360); g.lineTo(720, 720); g.fill();
    g.fillStyle = '#262b48'; for (let y = 400; y < 720; y += 40) g.fillRect(590 + (720 - y) * 0.02, y, 100 + (y - 360) * 0.2, 4);
    g.strokeStyle = '#c9d2ff'; g.lineWidth = 6; g.beginPath(); g.moveTo(640, 360); g.lineTo(640, 318); g.stroke();
    g.fillStyle = '#ffe680'; g.beginPath(); g.arc(640, 314, 7, 0, 7); g.fill();
    if (S.bolt && S.bt < 0.9 && S.path) {
      const a = 1 - S.bt / 0.9;
      MGH.glow(g, 640, 300, 260 * a + 40, `rgba(180,200,255,${0.6 * a})`);
      for (const [w, col] of [[16, `rgba(140,170,255,${0.35 * a})`], [7, `rgba(220,230,255,${0.9 * a})`], [3, `rgba(255,255,255,${a})`]]) {
        g.strokeStyle = col; g.lineWidth = w; g.lineJoin = 'round'; g.beginPath(); S.path.forEach(([x, y], k) => k ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke();
      }
      g.strokeStyle = `rgba(220,230,255,${0.7 * a})`; g.lineWidth = 2; S.path.forEach(([x, y], k) => { if (k % 2 || k === 0) return; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (k % 4 ? 40 : -40), y + 30); g.lineTo(x + (k % 4 ? 30 : -50), y + 60); g.stroke(); });
      MGH.label(g, '⚡ STRIKE! ⚡', 640, 230, 54, '#ffe680');
    } else if (!S.bolt) MGH.label(g, 'Wait for it…', 640, 230, 40, '#aab4ff');
    if (flash) { g.fillStyle = 'rgba(255,255,255,0.75)'; g.fillRect(0, 0, 1280, 720); }
    MGH.label(g, `Round ${S.round} / 5`, 640, 90, 22, '#dde');
    for (let i = 0; i < 4; i++) {
      const x = 190 + i * 300, p = m.players[i], cx = i < 2 ? x - 60 : x + 60;
      MGH.plat(g, x - 90, 600, 180, 26, 'stone');
      const mood = S.winner === i ? 'cheer' : S.lock[i] ? 'hurt' : (S.bolt ? 'shock' : pre ? 'nervous' : 'determined');
      MGH.av(g, m, i, x, 574, 34, mood, { look: { x: (640 - x) / 600, y: -0.8 } });
      if (S.winner === i) MGH.glow(g, x, 520, 90, 'rgba(255,240,140,0.5)');
      MGH.text(g, p.name + (S.lock[i] ? ' — too early!' : ''), x, 660, 20, p.color, 'center', 'bold');
      MGH.text(g, '⚡'.repeat(Math.max(0, S.pts[i])), x, 690, 20, '#ffe680');
    }
    if (S.winner >= 0) MGH.label(g, `${m.players[S.winner].name} — ${(S.react * 1000).toFixed(0)} ms`, 640, 470, 30, m.players[S.winner].color);
  },
});

// 4 ---------------------------------------------------------------- Perfect Pour
MG.def({
  id: 'pour', name: 'Perfect Pour', type: 'Timing', controls: '1 button', mouseA: true,
  how: 'Hold to fill your chalice and release at the line. Three rounds, the line moves each time. Fills stay hidden until all have released.',
  wins: 'Lowest total error.',
  init(m, S) { S.err = [0, 0, 0, 0]; S.round = 0; this.newRound(S); },
  newRound(S) { S.round++; S.line = R.range(0.4, 0.9); S.fill = [0, 0, 0, 0]; S.state = [0, 0, 0, 0]; S.t = 0; S.reveal = 0; S.botNoise = [0, 1, 2, 3].map(() => R.range(-0.07, 0.07)); },
  update(m, S, dt) {
    if (S.reveal > 0) { S.reveal -= dt; if (S.reveal <= 0) { if (S.round >= 3) m.finish(S.err.map(e => -e)); else this.newRound(S); } return; }
    S.t += dt;
    for (let i = 0; i < 4; i++) {
      if (S.state[i] === 2) continue;
      if (m.held(i, 'a')) { S.state[i] = 1; S.fill[i] += dt * 0.42; }
      else if (S.state[i] === 1) S.state[i] = 2;
      if (S.fill[i] >= 1.1) S.state[i] = 2;
      if (S.t > 8 && S.state[i] !== 1) S.state[i] = 2;
    }
    if (S.state.every(s => s === 2)) {
      for (let i = 0; i < 4; i++) S.err[i] += S.fill[i] > 1 ? 1 : Math.abs(S.fill[i] - S.line);
      S.reveal = 2.2; Sfx.coin();
    }
  },
  bot(m, S, i) { m.vin[i].a = S.reveal <= 0 && S.state[i] !== 2 && S.fill[i] < S.line + S.botNoise[i]; },
  score(m, S) { return S.err.map(e => -e); },
  fmt(s) { return 'error ' + (-s).toFixed(3); },
  hud(m, S, i) { return 'err ' + S.err[i].toFixed(2); },
  draw(m, S, g) {
    MGH.scene(g, 'temple', m.t);
    MGH.label(g, `Round ${S.round} / 3`, 640, 90, 22, '#eee');
    for (let i = 0; i < 4; i++) {
      const x = 190 + i * 300, p = m.players[i], top = 200, h = 380, show = S.reveal > 0;
      // jug pouring above
      if (S.state[i] === 1) { g.fillStyle = p.color; g.globalAlpha = 0.85; g.fillRect(x - 5, 150, 10, top + h - 150); g.globalAlpha = 1; MGH.emoji(g, '🫖', x + 30, 140, 42, 0.6); }
      // glass
      g.fillStyle = 'rgba(200,230,255,0.12)'; MGH.rr(g, x - 70, top, 140, h, 18); g.fill();
      if (show) {
        const f = Math.min(1.05, S.fill[i]), ly = top + h - f * h;
        g.save(); MGH.rr(g, x - 66, top, 132, h, 16); g.clip();
        g.fillStyle = MGH.grad(g, ly, top + h, [Char.shade(p.color, 0.3), Char.shade(p.color, -0.3)]); g.beginPath(); g.moveTo(x - 66, top + h);
        for (let k = 0; k <= 132; k += 6) g.lineTo(x - 66 + k, ly + Math.sin(k * 0.1 + m.t * 6) * 3); g.lineTo(x + 66, top + h); g.fill();
        for (let k = 0; k < 6; k++) { const by = top + h - ((m.t * 60 + k * 50) % (f * h)); g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.arc(x - 40 + k * 16, by, 3, 0, 7); g.fill(); }
        g.restore();
        if (S.fill[i] > 1) { g.fillStyle = p.color; for (let k = 0; k < 3; k++) { g.beginPath(); g.ellipse(x + (k - 1) * 60, top + h + 14, 30, 6, 0, 0, 7); g.fill(); } }
      } else { g.fillStyle = 'rgba(60,40,100,0.9)'; MGH.rr(g, x - 66, top + 4, 132, h - 8, 16); g.fill(); MGH.emoji(g, S.state[i] === 2 ? '✅' : S.state[i] === 1 ? '💧' : '🙈', x, top + h / 2, 44); }
      g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = 4; MGH.rr(g, x - 70, top, 140, h, 18); g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.3)'; g.fillRect(x - 58, top + 16, 8, h - 40);
      g.strokeStyle = '#ffe680'; g.lineWidth = 4; g.setLineDash([12, 8]); g.beginPath(); g.moveTo(x - 84, top + h - S.line * h); g.lineTo(x + 84, top + h - S.line * h); g.stroke(); g.setLineDash([]);
      const er = Math.abs(S.fill[i] - S.line);
      MGH.av(g, m, i, x + 112, 546, 24, show ? (S.fill[i] > 1 ? 'hurt' : er < 0.05 ? 'cheer' : er < 0.15 ? 'happy' : 'neutral') : (S.state[i] === 1 ? 'determined' : 'happy'), { look: { x: -1, y: -0.4 } });
      MGH.text(g, p.name, x, 640, 22, p.color, 'center', 'bold');
      if (show) MGH.label(g, S.fill[i] > 1 ? 'overflow!' : er < 0.02 ? 'PERFECT!' : `off by ${er.toFixed(3)}`, x, 680, 18, er < 0.05 && S.fill[i] <= 1 ? '#ffe680' : '#fff');
    }
  },
});

// 5 ---------------------------------------------------------------- Metronome Monk
MG.def({
  id: 'metronome', name: 'Metronome Monk', type: 'Rhythm', controls: '1 button', dur: 18, mouseA: true,
  how: 'A beat plays for 8 seconds, then goes silent. Keep tapping in time. Only taps in the silent 10 seconds count.',
  wins: 'Lowest average timing error.',
  init(m, S) { S.beat = R.range(0.5, 0.7); S.taps = [[], [], [], []]; S.lastBeat = -1; S.drift = [0, 0, 0, 0].map(() => R.range(-0.03, 0.03)); S.nextBot = [0, 1, 2, 3].map(() => 8 + R.range(0, 0.1)); },
  update(m, S, dt) {
    const k = Math.floor(m.t / S.beat);
    if (k !== S.lastBeat) { S.lastBeat = k; if (m.t < 8) Sfx.tone(1000, 0.05, 'square', 0.06); S.pulse = 0.15; }
    if (S.pulse > 0) S.pulse -= dt;
    for (let i = 0; i < 4; i++) if (m.pressed(i, 'a') && m.t >= 8) { S.taps[i].push(m.t); MGH.ring(190 + i * 300, 560, m.players[i].color, 30, 50, 0.4); }
  },
  bot(m, S, i, dt) {
    const v = m.vin[i]; v.a = false;
    if (m.t < 8) return;
    if (!S.botStart) { S.botStart = true; for (let j = 0; j < 4; j++) S.nextBot[j] = Math.ceil(8 / S.beat) * S.beat + R.range(-0.04, 0.04); }
    if (m.t >= S.nextBot[i]) { v.a = true; S.nextBot[i] += S.beat * (1 + S.drift[i]) + R.range(-0.04, 0.04); }
  },
  score(m, S) {
    return S.taps.map(ts => {
      let e = 0;
      for (const t of ts) { const ph = t / S.beat; e += Math.abs(ph - Math.round(ph)) * S.beat; }
      const expected = 10 / S.beat;
      const missing = Math.max(0, expected * 0.8 - ts.length) + Math.max(0, ts.length - expected * 1.2);
      return -((e + missing * S.beat * 0.5) / expected);
    });
  },
  fmt(s) { return `avg error ${(-s * 1000).toFixed(0)} ms`; },
  hud(m, S, i) { return S.taps[i].length + ' taps'; },
  draw(m, S, g) {
    MGH.scene(g, 'dojo', m.t);
    const silent = m.t >= 8, ph = (m.t / S.beat) % 1, beatN = Math.floor(m.t / S.beat);
    // the monk and his metronome
    const sw = Math.sin((m.t / S.beat) * Math.PI) * (silent ? 0.15 : 0.9);
    g.save(); g.translate(640, 330);
    g.fillStyle = '#5a3820'; g.beginPath(); g.moveTo(-60, 90); g.lineTo(60, 90); g.lineTo(30, -110); g.lineTo(-30, -110); g.closePath(); g.fill();
    g.strokeStyle = '#ffd34d'; g.lineWidth = 5; g.beginPath(); g.moveTo(0, 70); g.lineTo(Math.sin(sw) * 150, 70 - Math.cos(sw) * 150); g.stroke();
    g.fillStyle = '#ffd34d'; g.beginPath(); g.arc(Math.sin(sw) * 110, 70 - Math.cos(sw) * 110, 12, 0, 7); g.fill();
    g.restore();
    if (!silent && ph < 0.2) MGH.glow(g, 640, 300, 160, 'rgba(255,220,120,0.4)');
    Char.draw(g, 760, 400 + (silent ? 0 : Math.abs(Math.sin(ph * Math.PI)) * -6), 46, -1, '#d98a3a', { mood: silent ? 'sleepy' : 'happy', seed: 4, look: { x: -0.6, y: 0 } });
    MGH.label(g, silent ? '🤫 SILENCE — keep the beat!' : '🎵 Listen & groove…', 640, 110, 34, silent ? '#ffd34d' : '#fff');
    for (let k = 0; k < 4; k++) { const q = (m.t * 0.6 + k / 4) % 1; g.globalAlpha = 1 - q; MGH.emoji(g, k % 2 ? '🎵' : '🎶', 520 + k * 80 + Math.sin(q * 8 + k) * 18, 470 - q * 260, 26); } g.globalAlpha = 1;
    for (let i = 0; i < 4; i++) {
      const x = 190 + i * 300, p = m.players[i];
      const lt = S.taps[i].length ? S.taps[i][S.taps[i].length - 1] : -9, since = m.t - lt;
      // dancing: bounce + sway on the beat while listening, on your own taps in the silence
      const k = silent ? Math.max(0, 1 - since / 0.3) : Math.max(0, 1 - ph / 0.35);
      const bob = -k * 18, lean = Math.sin(beatN * Math.PI / 2 + i) * (silent ? k * 0.25 : 0.2);
      MGH.shadow(g, x, 612, 46 - k * 10, 0.35);
      g.save(); g.translate(x, 560 + bob); g.rotate(lean); g.scale(1 + k * 0.08, 1 - k * 0.08);
      MGH.av(g, m, i, 0, 0, 40, since < 0.2 ? 'cheer' : (silent ? 'determined' : 'happy'));
      g.restore();
      if (since < 0.25) MGH.ring(x, 540, p.color, 20, 50, 0.3);
      MGH.text(g, p.name, x, 650, 22, p.color, 'center', 'bold');
    }
  },
});

// 6 ---------------------------------------------------------------- Bellringer
MG.def({
  id: 'bell', name: 'Bellringer', type: 'Timing', controls: '1 button', mouseA: true,
  how: 'A pendulum swings across the screen. Press to ring the bell as it passes the centre. Five rings, each faster.',
  wins: 'Lowest total distance from centre.',
  init(m, S) { S.n = [0, 0, 0, 0]; S.tot = [0, 0, 0, 0]; S.ph = [0, 0, 0, 0].map(() => R.range(0, 6.28)); S.cool = [0, 0, 0, 0]; S.timer = [0, 0, 0, 0]; S.last = [null, null, null, null]; S.bp = [0, 0, 0, 0]; },
  speed(n) { return 2.2 + n * 0.8; },
  x(S, i) { return Math.sin(S.ph[i]); },
  update(m, S, dt) {
    for (let i = 0; i < 4; i++) {
      if (S.n[i] >= 5) continue;
      S.ph[i] += this.speed(S.n[i]) * dt;
      if (S.cool[i] > 0) { S.cool[i] -= dt; continue; }
      S.timer[i] += dt;
      if (m.pressed(i, 'a') || S.timer[i] > 6) {
        const d = S.timer[i] > 6 ? 1 : Math.abs(this.x(S, i));
        S.tot[i] += d; S.last[i] = d; S.n[i]++; S.cool[i] = 0.5; S.timer[i] = 0;
        MGH.ring(i * 320 + 160, 630, d < 0.1 ? '#ffe680' : '#fff', 14, d < 0.1 ? 120 : 60, 0.6);
        if (!m.bot(i)) Sfx.tone(900 - d * 500, 0.3, 'triangle', 0.07);
      }
    }
    if (S.n.every(n => n >= 5)) m.finish(S.tot.map(t => -t));
  },
  bot(m, S, i, dt) {
    const v = m.vin[i]; v.a = false;
    if (S.cool[i] > 0 || S.n[i] >= 5) return;
    const x = this.x(S, i), vel = Math.cos(S.ph[i]) * this.speed(S.n[i]);
    const tCross = Math.abs(x / (vel || 0.001));
    if (Math.sign(-x) === Math.sign(vel) && tCross < 0.02 + R.range(0, 0.06) && S.timer[i] > 0.3) v.a = true;
  },
  score(m, S) { return S.tot.map(t => -t); },
  fmt(s) { return 'distance ' + (-s).toFixed(3); },
  hud(m, S, i) { return `${S.n[i]}/5 · ${S.tot[i].toFixed(2)}`; },
  draw(m, S, g) {
    MGH.scene(g, 'night', m.t);
    for (let i = 0; i < 4; i++) {
      const cx = i * 320 + 160, p = m.players[i];
      // belfry arch
      g.fillStyle = '#2a2448'; MGH.rr(g, cx - 120, 70, 240, 600, 30); g.fill(); g.fillStyle = '#14112a'; MGH.rr(g, cx - 96, 96, 192, 560, 22); g.fill();
      g.fillStyle = 'rgba(255,230,140,0.2)'; g.fillRect(cx - 3, 120, 6, 470);
      g.fillStyle = MGH.grad(g, 560, 680, ['#6a6a88', '#3a3a50']); MGH.rr(g, cx - 70, 640, 140, 20, 6); g.fill();
      MGH.bell(g, cx, 600, 1.15, '#ffd34d', Math.sin(m.t * 3 + i) * 0.12 + (S.last[i] !== null && S.last[i] < 0.08 ? Math.sin(m.t * 25) * 0.15 : 0));
      const a = this.x(S, i) * 0.9, bx = cx + Math.sin(a) * 300, by = 100 + Math.cos(a) * 300;
      g.strokeStyle = '#c9b48a'; g.lineWidth = 4; g.beginPath(); g.moveTo(cx, 100); g.lineTo(bx, by); g.stroke();
      MGH.glow(g, bx, by, 50, 'rgba(255,240,180,0.35)');
      g.fillStyle = MGH.grad(g, by - 26, by + 26, [Char.shade(p.color, 0.4), Char.shade(p.color, -0.3)]); g.beginPath(); g.arc(bx, by, 26, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke();
      const l = S.last[i];
      MGH.av(g, m, i, cx - 92, 630, 22, l === null ? 'determined' : l < 0.08 ? 'cheer' : l < 0.25 ? 'happy' : 'hurt', { look: { x: 1, y: -0.5 } });
      if (l !== null) MGH.label(g, l < 0.08 ? 'PERFECT' : l.toFixed(2), cx, 690, 20, l < 0.08 ? '#ffe680' : '#fff');
    }
  },
});

// 7 ---------------------------------------------------------------- Forge Strike
MG.def({
  id: 'forge', name: 'Forge Strike', type: 'Timing', controls: '1 button', mouseA: true,
  how: 'A hammer marker sweeps back and forth over a shrinking gold zone. Press to strike. Seven strikes.',
  wins: 'Highest total (gold 3, near 1).',
  init(m, S) { S.pts = [0, 0, 0, 0]; S.n = [0, 0, 0, 0]; S.pos = [0, 0, 0, 0]; S.dir = [1, 1, 1, 1]; S.cool = [0, 0, 0, 0]; S.zone = [0, 0, 0, 0].map(() => R.range(0.2, 0.8)); S.msg = ['', '', '', '']; },
  w(n) { return 0.2 - n * 0.022; },
  update(m, S, dt) {
    for (let i = 0; i < 4; i++) {
      if (S.n[i] >= 7) continue;
      const sp = 0.9 + S.n[i] * 0.12;
      S.pos[i] += S.dir[i] * sp * dt;
      if (S.pos[i] > 1) { S.pos[i] = 1; S.dir[i] = -1; } if (S.pos[i] < 0) { S.pos[i] = 0; S.dir[i] = 1; }
      if (S.cool[i] > 0) { S.cool[i] -= dt; continue; }
      if (m.pressed(i, 'a')) {
        const d = Math.abs(S.pos[i] - S.zone[i]), w = this.w(S.n[i]);
        const pt = d < w / 2 ? 3 : d < w * 1.3 ? 1 : 0;
        S.pts[i] += pt; S.msg[i] = pt === 3 ? 'GOLD!' : pt ? 'near' : 'miss';
        MGH.burst(200 + S.pos[i] * 880, 140 + i * 145, pt === 3 ? ['#ffe680', '#fff', '#ff9a3d'] : ['#ff9a3d', '#aa5522'], pt === 3 ? 28 : 10, { speed: 380, kind: 'spark', size: 3, grav: 500 });
        S.n[i]++; S.cool[i] = 0.45; S.zone[i] = R.range(0.15, 0.85);
        if (!m.bot(i)) Sfx.tone(pt === 3 ? 1200 : pt ? 700 : 200, 0.15, 'square', 0.06);
      }
    }
    if (S.n.every(n => n >= 7)) m.finish(S.pts.slice());
  },
  bot(m, S, i) {
    const v = m.vin[i]; v.a = false;
    if (S.cool[i] > 0) return;
    const d = Math.abs(S.pos[i] - S.zone[i]);
    if (d < this.w(S.n[i]) * R.range(0.15, 0.9) && Math.random() < 0.5) v.a = true;
  },
  score(m, S) { return S.pts.slice(); },
  hud(m, S, i) { return `${S.pts[i]} (${S.n[i]}/7)`; },
  draw(m, S, g) {
    MGH.scene(g, 'lava', m.t);
    for (let i = 0; i < 4; i++) {
      const y = 150 + i * 140, p = m.players[i], x0 = 200, W = 880, w = this.w(S.n[i]);
      MGH.text(g, p.name, 180, y + 8, 20, p.color, 'right', 'bold');
      // glowing metal bar on an anvil
      g.fillStyle = '#2a2a30'; g.beginPath(); g.moveTo(x0 - 10, y + 26); g.lineTo(x0 + W + 10, y + 26); g.lineTo(x0 + W - 20, y + 46); g.lineTo(x0 + 20, y + 46); g.fill();
      g.fillStyle = MGH.grad(g, y - 22, y + 22, ['#5a2a1a', '#2a0e06']); MGH.rr(g, x0, y - 22, W, 44, 10); g.fill();
      g.fillStyle = 'rgba(255,140,40,0.55)'; MGH.rr(g, x0 + (S.zone[i] - w * 1.3) * W, y - 22, w * 2.6 * W, 44, 8); g.fill();
      g.fillStyle = MGH.grad(g, y - 22, y + 22, ['#fff6b0', '#ffd34d', '#ff8a3d']); MGH.rr(g, x0 + (S.zone[i] - w / 2) * W, y - 22, w * W, 44, 8); g.fill();
      MGH.glow(g, x0 + S.zone[i] * W, y, 60, 'rgba(255,220,120,0.4)');
      if (Math.random() < 0.15) MGH.burst(x0 + S.zone[i] * W + R.range(-30, 30), y, ['#ffd34d', '#ff8a3d'], 1, { speed: 90, up: 80, life: 0.5, size: 2 });
      const hx = x0 + S.pos[i] * W;
      g.fillStyle = '#fff'; g.fillRect(hx - 3, y - 30, 6, 60);
      MGH.hammer(g, hx + 14, y - 34, 0.85, -0.6 + Math.sin(m.t * 10) * 0.12);
      if (S.msg[i] === 'GOLD!' && Math.random() < 0.5) MGH.burst(hx, y, ['#ffe680', '#ff8a3d'], 3, { speed: 200, kind: 'spark', size: 2 });
      MGH.av(g, m, i, 1140, y - 4, 26, S.msg[i] === 'GOLD!' ? 'cheer' : S.msg[i] === 'miss' ? 'hurt' : 'determined', { look: { x: -1, y: 0 } });
      if (S.msg[i]) MGH.label(g, S.msg[i], 1225, y + 8, 18, S.msg[i] === 'GOLD!' ? '#ffe680' : '#fff');
    }
  },
});

// 8 ---------------------------------------------------------------- Rising Tide
MG.def({
  id: 'tide', name: 'Rising Tide', type: 'Survival', controls: 'Move + jump', dur: 50,
  how: 'Climb as the water rises all the way to the sky. Platforms crumble about a second after anyone stands on them and come back later, so keep hopping upward. Pure climbing: jump with A, no attacks, no power-ups.',
  wins: 'Last one alive.',
  init(m, S) {
    S.plats = [{ x: 0, y: 690, w: 1280, floor: true, load: 0, st: 'ok', tt: 0 }];
    for (let y = 600; y > 80; y -= 92) {
      const n = R.int(3, 4);
      for (let k = 0; k < n; k++) S.plats.push({ x: k * (1280 / n) + R.range(0, 1280 / n - 190), y: y + R.range(-12, 12), w: R.range(130, 185), load: 0, st: 'ok', tt: 0 });
    }
    S.b = [0, 1, 2, 3].map(i => ({ x: 220 + i * 280, y: 690, vx: 0, vy: 0, ground: true, alive: true, outT: 0, on: null, dir: i < 2 ? 1 : -1 }));
    S.water = 800; S.wall = 0;
  },
  solid(p) { return p.st === 'ok' || p.st === 'crack'; },
  update(m, S, dt) {
    S.water = 800 - m.t * 15.2; S.wall = Math.min(240, m.t * 5);
    // platform life cycle: ok -> (stood on 1.1s) crack 0.6s -> gone 4.5s -> back
    for (const p of S.plats) {
      if (p.floor) continue;
      const stood = S.b.some(b => b.alive && b.on === p);
      if (p.st === 'ok') { if (stood) p.load += dt; else p.load = Math.max(0, p.load - dt * 0.5); if (p.load > 1.1) { p.st = 'crack'; p.tt = 0.6; } }
      else if (p.st === 'crack') { p.tt -= dt; if (p.tt <= 0) { p.st = 'gone'; p.tt = 4.5; MGH.burst(p.x + p.w / 2, p.y, ['#9b7b55', '#6b5233', '#c9a36b'], 18, { speed: 160, grav: 700 }); } }
      else if (p.st === 'gone') { p.tt -= dt; if (p.tt <= 0 && p.y < S.water - 60) { p.st = 'ok'; p.load = 0; MGH.ring(p.x + p.w / 2, p.y, '#ffe680', 10, 60, 0.5); } }
    }
    for (let i = 0; i < 4; i++) {
      const b = S.b[i]; if (!b.alive) continue;
      const ax = m.axis(i).x;
      if (ax) b.dir = Math.sign(ax);
      b.vx = ax * 300;
      if (m.pressed(i, 'a') && b.ground) { b.vy = -820; b.ground = false; MGH.burst(b.x, b.y, '#d9c7a8', 6, { speed: 90, life: 0.4 }); }
      b.vy += 1900 * dt;
      const py = b.y;
      b.x = clamp(b.x + b.vx * dt, S.wall + 14, 1280 - S.wall - 14); b.y += b.vy * dt;
      b.ground = false; b.on = null;
      if (b.vy >= 0) for (const p of S.plats) {
        if (this.solid(p) && b.x > p.x && b.x < p.x + p.w && py <= p.y && b.y >= p.y) { b.y = p.y; b.vy = 0; b.ground = true; b.on = p; break; }
      }
      if (b.y > S.water || b.y > 760) { b.alive = false; b.outT = m.t; MGH.burst(b.x, S.water, ['#9fd8ff', '#ffffff', '#4f8dff'], 26, { speed: 300, up: 250, grav: 900 }); if (!m.bot(i)) Sfx.bad(); }
    }
    if (S.b.filter(b => b.alive).length <= 1) m.finish(this.score(m, S));
  },
  bot(m, S, i) {
    const b = S.b[i], v = m.vin[i]; if (!b.alive) return;
    v.a = false;
    const usable = p => p.st === 'ok' && p.load < 0.45 && p !== b.on && p.x + p.w > S.wall + 25 && p.x < 1280 - S.wall - 25 && p.y < S.water - 50;
    const onBad = !b.on || b.on.st !== 'ok' || b.on.load > 0.5 || b.on.floor;
    if (b.ground && (onBad || !b.goal || !usable(b.goal))) {
      let best = null, bs = -1e9;
      for (const p of S.plats) {
        if (!usable(p) || p.y < b.y - 140 || p.y > b.y + 160) continue;
        const dx = Math.abs(p.x + p.w / 2 - b.x);
        if (dx > 420) continue;
        const sc = (b.y - p.y) * 1.4 - dx * 0.5 + (p.y < S.water - 160 ? 60 : 0) + R.range(0, 20);
        if (sc > bs) { bs = sc; best = p; }
      }
      b.goal = best;
    }
    if (!b.goal) { MGH.setLR(m, i, 0); return; }
    const gx = clamp(b.goal.x + b.goal.w / 2, S.wall + 30, 1280 - S.wall - 30), dx = gx - b.x;
    MGH.setLR(m, i, Math.abs(dx) < 10 ? 0 : Math.sign(dx));
    const reach = b.goal.y < b.y - 5 ? b.goal.w / 2 + 70 : 230;
    if (b.ground && Math.abs(dx) < reach && (onBad || b.goal.y < b.y - 5 || Math.abs(dx) > b.goal.w / 2)) v.a = !m.prev[i].a;
    if (b.on === b.goal) b.goal = null;
  },
  score(m, S) { return S.b.map(b => b.alive ? 1000 + (740 - b.y) : b.outT); },
  fmt(s) { return s >= 1000 ? 'Survived' : `out at ${s.toFixed(1)}s`; },
  hud(m, S, i) { return S.b[i].alive ? 'alive' : 'out'; },
  draw(m, S, g) {
    const sky = clamp((800 - S.water) / 760, 0, 1);
    MGH.scene(g, sky > 0.6 ? 'sunset' : 'sky', m.t);
    // cliff walls closing in
    for (const side of [0, 1]) { const w = S.wall; if (w < 2) continue; const x0 = side ? 1280 - w : 0; g.fillStyle = MGH.grad(g, 40, 720, ['#6a5a4a', '#3a2e24']); g.fillRect(x0, 40, w, 680); g.fillStyle = 'rgba(0,0,0,0.2)'; for (let y = 60; y < 720; y += 50) g.fillRect(x0 + (side ? 0 : w - 10), y, 10, 30); }
    for (const p of S.plats) {
      if (p.floor) continue;
      if (p.st === 'gone') { if (p.tt < 1) { g.globalAlpha = 0.3; g.strokeStyle = '#ffe680'; g.setLineDash([6, 6]); MGH.rr(g, p.x, p.y, p.w, 14, 5); g.stroke(); g.setLineDash([]); g.globalAlpha = 1; } continue; }
      const sx = p.st === 'crack' ? Math.sin(m.t * 60) * 3 : (p.load > 0.5 ? Math.sin(m.t * 40) * 1.5 : 0);
      MGH.plat(g, p.x + sx, p.y, p.w, 16, p.st === 'crack' ? 'stone' : 'grass');
      const heat = clamp(p.load / 1.1, 0, 1);
      if (heat > 0.3 || p.st === 'crack') { g.strokeStyle = '#2a1a0a'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(p.x + p.w * 0.3 + sx, p.y); g.lineTo(p.x + p.w * 0.36 + sx, p.y + 8); g.lineTo(p.x + p.w * 0.33 + sx, p.y + 16); g.moveTo(p.x + p.w * 0.7 + sx, p.y); g.lineTo(p.x + p.w * 0.64 + sx, p.y + 16); g.stroke(); }
      if (p.st === 'crack' && Math.random() < 0.3) MGH.burst(p.x + Math.random() * p.w, p.y + 14, '#8a6a4a', 1, { speed: 40, grav: 600, life: 0.5 });
    }
    S.b.forEach((b, i) => {
      if (!b.alive) return;
      MGH.shadow(g, b.x, b.y, 18, 0.25);
      MGH.av(g, m, i, b.x, b.y - 17, 16, S.water - b.y < 90 || (b.on && b.on.st === 'crack') ? 'scared' : (b.ground ? 'determined' : 'cheer'), { walk: Math.abs(b.vx) > 10 ? 1 : 0, look: { x: b.dir * 0.8, y: -0.5 } });
    });
    MGH.surface(g, S.water, m.t, 'rgba(200,240,255,0.9)', ['rgba(40,150,255,0.72)', 'rgba(10,40,120,0.95)'], 7);
  },
});

// 9 ---------------------------------------------------------------- Ember Floor
MG.def({
  id: 'ember', name: 'Ember Floor', type: 'Survival', controls: 'Move', dur: 45,
  how: 'Floor tiles flash, then ignite in patterns. Stay on safe tiles.',
  wins: 'Last one alive.',
  init(m, S) {
    S.cols = 10; S.rows = 6; S.tw = 128; S.th = 680 / 6;
    S.state = new Array(60).fill(0); // 0 safe, 1 warn, 2 fire
    S.next = 1.5; S.phase = 'idle';
    S.b = [0, 1, 2, 3].map(i => Object.assign(MGH.body(300 + i * 230, 380, 24), { outT: 0 }));
  },
  tileAt(S, x, y) { const c = clamp(Math.floor(x / S.tw), 0, 9), r = clamp(Math.floor((y - 40) / S.th), 0, 5); return r * 10 + c; },
  pattern(S, t) {
    const k = R.int(0, 4), set = new Set();
    const a = R.int(0, 1);
    for (let r = 0; r < 6; r++) for (let c = 0; c < 10; c++) {
      const idx = r * 10 + c;
      if (k === 0 && r % 2 === a) set.add(idx);
      if (k === 1 && c % 2 === a) set.add(idx);
      if (k === 2 && (r + c) % 2 === a) set.add(idx);
      if (k === 3 && Math.random() < 0.45 + t * 0.006) set.add(idx);
      if (k === 4 && (Math.abs(c - 4.5) + Math.abs(r - 2.5) < 2.5 + a * 2 ? a === 0 : a === 1)) set.add(idx);
    }
    if (set.size >= 60) set.delete(R.int(0, 59));
    return set;
  },
  update(m, S, dt) {
    S.next -= dt;
    const speedUp = Math.max(0.55, 1 - m.t / 70);
    if (S.next <= 0) {
      if (S.phase === 'idle') { S.cur = this.pattern(S, m.t); S.cur.forEach(i => { S.state[i] = 1; }); S.phase = 'warn'; S.next = 1.1 * speedUp; }
      else if (S.phase === 'warn') { S.cur.forEach(i => { S.state[i] = 2; MGH.burst((i % 10 + 0.5) * S.tw, 40 + (Math.floor(i / 10) + 0.5) * S.th, ['#ff5a1f', '#ffd34d'], 3, { speed: 120, up: 100, life: 0.6 }); }); S.phase = 'fire'; S.next = 0.7; MGH.shake(3); Sfx.tone(140, 0.25, 'sawtooth', 0.04); }
      else { S.state.fill(0); S.phase = 'idle'; S.next = 0.5 * speedUp; }
    }
    S.b.forEach((b, i) => {
      if (!b.alive) return;
      const a = m.axis(i); MGH.steer(b, a.x, a.y, dt, 2600, 330, 9); MGH.integrate(b, dt);
      if (S.state[this.tileAt(S, b.x, b.y)] === 2) { b.alive = false; b.outT = m.t; MGH.burst(b.x, b.y, ['#ff5a1f', '#ffd34d', '#333'], 30, { speed: 280, up: 120 }); MGH.shake(8); if (!m.bot(i)) Sfx.bad(); }
    });
    MGH.collide(S.b, 0.5);
    if (S.b.filter(b => b.alive).length <= 1) m.finish(this.score(m, S));
  },
  bot(m, S, i) {
    const b = S.b[i]; if (!b.alive) return;
    const cur = this.tileAt(S, b.x, b.y);
    if (S.state[cur] !== 0 || !b.tgt || S.state[b.tgt] !== 0) {
      let best = cur, bd = 1e9;
      for (let k = 0; k < 60; k++) if (S.state[k] === 0) {
        const cx = (k % 10 + 0.5) * S.tw, cy = 40 + (Math.floor(k / 10) + 0.5) * S.th, d = dist(cx, cy, b.x, b.y) + Math.random() * 30;
        if (d < bd) { bd = d; best = k; }
      }
      b.tgt = best;
    }
    const cx = (b.tgt % 10 + 0.5) * S.tw, cy = 40 + (Math.floor(b.tgt / 10) + 0.5) * S.th;
    MGH.aim(m, i, cx, cy, b, 20);
  },
  score(m, S) { return S.b.map(b => b.alive ? 1000 : b.outT); },
  fmt(s) { return s >= 1000 ? 'Survived' : `out at ${s.toFixed(1)}s`; },
  hud(m, S, i) { return S.b[i].alive ? 'alive' : 'out'; },
  draw(m, S, g) {
    MGH.scene(g, 'lava', m.t);
    for (let k = 0; k < 60; k++) {
      const x = (k % 10) * S.tw, y = 40 + Math.floor(k / 10) * S.th, s = S.state[k], w = S.tw - 4, h = S.th - 4;
      if (s === 2) {
        g.fillStyle = MGH.grad(g, y, y + h, ['#ffd34d', '#ff5a1f', '#a81e08']); g.fillRect(x + 2, y + 2, w, h);
        for (let f = 0; f < 3; f++) { const fx = x + 2 + w * (0.25 + f * 0.25), fh = 30 + Math.sin(m.t * 12 + k + f) * 10; g.fillStyle = 'rgba(255,230,120,0.85)'; g.beginPath(); g.moveTo(fx - 10, y + h); g.quadraticCurveTo(fx, y + h - fh * 2, fx + 10, y + h); g.fill(); }
        if (Math.random() < 0.08) MGH.burst(x + S.tw / 2, y + S.th / 2, ['#ffd34d', '#ff8a3d'], 1, { speed: 60, up: 80, life: 0.6, size: 2 });
      } else {
        const warn = s === 1, pul = warn ? 0.5 + 0.5 * Math.sin(m.t * 26) : 0;
        g.fillStyle = MGH.grad(g, y, y + h, warn ? [`rgb(${120 + pul * 120},${50 + pul * 60},30)`, '#3a1a10'] : ((k + Math.floor(k / 10)) % 2 ? ['#4a3a34', '#2a201c'] : ['#433430', '#251c18']));
        g.fillRect(x + 2, y + 2, w, h);
        g.strokeStyle = warn ? `rgba(255,${150 + pul * 100},60,${0.5 + pul * 0.5})` : 'rgba(255,90,30,0.25)'; g.lineWidth = warn ? 3 : 1.5;
        g.beginPath(); g.moveTo(x + w * 0.2, y + 6); g.lineTo(x + w * 0.45, y + h * 0.5); g.lineTo(x + w * 0.35, y + h - 4); g.moveTo(x + w * 0.45, y + h * 0.5); g.lineTo(x + w * 0.85, y + h * 0.4); g.stroke();
        g.fillStyle = 'rgba(255,255,255,0.05)'; g.fillRect(x + 2, y + 2, w, 6);
      }
    }
    S.b.forEach((b, i) => { if (b.alive) { MGH.shadow(g, b.x, b.y + b.r * 1.2, b.r, 0.35); MGH.drawBody(g, b, m.players[i], '', S.state[this.tileAt(S, b.x, b.y)] === 1 ? 'scared' : null); } });
  },
});

// 10 ---------------------------------------------------------------- Gale Sumo
MG.def({
  id: 'sumo', name: 'Gale Sumo', type: 'Arena', controls: 'Move + dash', dur: 45,
  how: 'Dash into rivals to knock them off a ring that keeps shrinking. The dash recharges in 2 seconds.',
  wins: 'Last one in the ring.',
  init(m, S) {
    S.cx = 640; S.cy = 385; S.rad = 310;
    S.b = [0, 1, 2, 3].map(i => { const a = i * Math.PI / 2 + Math.PI / 4; return Object.assign(MGH.body(640 + Math.cos(a) * 180, 385 + Math.sin(a) * 180, 32), { cd: 0, outT: 0, dash: 0 }); });
  },
  update(m, S, dt) {
    S.rad = Math.max(110, 310 - m.t * 5);
    S.b.forEach((b, i) => {
      if (!b.alive) return;
      const a = m.axis(i); MGH.steer(b, a.x, a.y, dt, 1400, 260, 2.2);
      b.cd -= dt; b.dash -= dt;
      if (m.pressed(i, 'a') && b.cd <= 0) { b.vx += b.face.x * 720; b.vy += b.face.y * 720; b.cd = 2; b.dash = 0.3; MGH.burst(b.x - b.face.x * 20, b.y - b.face.y * 20, '#ffffff', 10, { speed: 160 }); if (!m.bot(i)) Sfx.tone(300, 0.15, 'sawtooth', 0.05, 300); }
      b.x += b.vx * dt; b.y += b.vy * dt;
      const v = Math.hypot(b.vx, b.vy); if (v > 900) { b.vx *= 900 / v; b.vy *= 900 / v; }
    });
    MGH.collide(S.b, 1.6);
    S.b.forEach((b, i) => { if (b.alive && dist(b.x, b.y, S.cx, S.cy) > S.rad + 8) { b.alive = false; b.outT = m.t; Sfx.boom(); MGH.burst(b.x, b.y, [m.players[i].color, '#fff'], 30, { speed: 400 }); MGH.shake(10); MGH.pop('OUT!', b.x, b.y - 30, '#fff', 34); } });
    if (S.b.filter(b => b.alive).length <= 1) m.finish(this.score(m, S));
  },
  bot(m, S, i) {
    const b = S.b[i]; if (!b.alive) return;
    const dc = dist(b.x, b.y, S.cx, S.cy);
    const v = m.vin[i]; v.a = false;
    if (dc > S.rad * 0.7) { MGH.aim(m, i, S.cx, S.cy, b); return; }
    const t = MGH.nearest(b, S.b);
    if (!t) return;
    MGH.aim(m, i, t.x + (t.x - S.cx) * 0.2, t.y + (t.y - S.cy) * 0.2, b);
    if (dist(b.x, b.y, t.x, t.y) < 150 && b.cd <= 0 && Math.random() < 0.08) v.a = true;
  },
  score(m, S) { return S.b.map(b => b.alive ? 1000 - dist(b.x, b.y, S.cx, S.cy) / 1000 : b.outT); },
  fmt(s) { return s >= 999 ? 'Last standing' : `out at ${s.toFixed(1)}s`; },
  hud(m, S, i) { return S.b[i].alive ? (S.b[i].cd > 0 ? 'recharging' : 'dash ready') : 'out'; },
  draw(m, S, g) {
    MGH.scene(g, 'sky', m.t); MGH.crowd(g, m.t, 600, 30, ['#6a8ac8', '#8a6ab8', '#c87a6a', '#6ab88a']);
    // floating stone arena
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(S.cx, S.cy + 40, S.rad * 1.02, S.rad * 0.92, 0, 0, 7); g.fill();
    g.fillStyle = '#6a5a4a'; g.beginPath(); g.ellipse(S.cx, S.cy + 22, S.rad, S.rad * 0.98, 0, 0, 7); g.fill();
    const gr = g.createRadialGradient(S.cx - S.rad * 0.3, S.cy - S.rad * 0.3, 20, S.cx, S.cy, S.rad);
    gr.addColorStop(0, '#f4fbff'); gr.addColorStop(1, '#bfd8ea'); g.fillStyle = gr; g.beginPath(); g.arc(S.cx, S.cy, S.rad, 0, 7); g.fill();
    g.strokeStyle = '#2a7fa8'; g.lineWidth = 10; g.stroke();
    g.strokeStyle = 'rgba(42,127,168,0.35)'; g.lineWidth = 3; g.beginPath(); g.arc(S.cx, S.cy, S.rad * 0.55, 0, 7); g.stroke();
    MGH.emoji(g, '🌀', S.cx, S.cy, 60, m.t * 0.6);
    for (let k = 0; k < 14; k++) { const a = m.t * 1.4 + k * 0.45; g.strokeStyle = `rgba(255,255,255,${0.25 + 0.2 * Math.sin(k)})`; g.lineWidth = 3; g.beginPath(); g.arc(S.cx, S.cy, S.rad + 24 + (k % 5) * 12, a, a + 0.5); g.stroke(); }
    S.b.forEach((b, i) => { if (b.alive) { MGH.shadow(g, b.x, b.y + b.r * 1.25, b.r, 0.3); if (b.dash > 0) for (let s = 1; s < 4; s++) { g.globalAlpha = 0.15; g.fillStyle = m.players[i].color; g.beginPath(); g.arc(b.x - b.vx * 0.02 * s, b.y - b.vy * 0.02 * s, b.r, 0, 7); g.fill(); g.globalAlpha = 1; } MGH.drawBody(g, b, m.players[i], b.dash > 0 ? '💨' : '', dist(b.x, b.y, S.cx, S.cy) > S.rad - 45 ? 'scared' : (b.dash > 0 ? 'angry' : null)); } });
  },
});
