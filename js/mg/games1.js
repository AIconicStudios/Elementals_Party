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
    S.pops = [];
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
            S.pts[i] += it.ash ? -2 : 1;
            S.pops.push({ x: i * 320 + it.x, y: 640, s: it.ash ? '−2' : '+1', t: 0, c: it.ash ? '#f66' : '#ffe680' });
            if (!m.bot(i)) { if (it.ash) Sfx.bad(); else Sfx.coin(); }
          }
        }
      });
    }
    S.pops.forEach(p => { p.t += dt; }); S.pops = S.pops.filter(p => p.t < 0.8);
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
    MGH.bg(g, '#0d0b2a', '#2a1640'); MGH.lanes(g, m);
    for (let i = 0; i < 4; i++) {
      S.items.forEach((it, k) => {
        if (S.res[i].has(k)) return;
        const y = this.yOf(it, m.t); if (y < 40 || y > 720) return;
        g.font = '28px "Segoe UI Emoji"'; g.textAlign = 'center'; g.fillText(it.ash ? '☁️' : '⭐', i * 320 + it.x, y);
      });
      const x = i * 320 + S.bx[i];
      g.fillStyle = m.players[i].color; MGH.rr(g, x - 45, 650, 90, 26, 10); g.fill();
      g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke();
    }
    S.pops.forEach(p => MGH.text(g, p.s, p.x, p.y - p.t * 50, 26, p.c, 'center', 'bold'));
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
        if (S.eye === 'open' && S.grace <= 0) { S.pos[i] = 0; S.flash[i] = 0.6; if (!m.bot(i)) Sfx.bad(); }
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
    MGH.bg(g, '#1b0e2e', '#0a0612');
    // eye
    const open = S.eye === 'open' ? 1 : S.eye === 'tell' ? 0.25 + 0.15 * Math.sin(m.t * 40) : 0.05;
    g.save(); g.translate(1150, 110);
    g.fillStyle = '#3a1a5c'; g.beginPath(); g.ellipse(0, 0, 90, 55, 0, 0, 7); g.fill();
    g.fillStyle = S.eye === 'open' ? '#ff4d6d' : '#e0c3ff'; g.beginPath(); g.ellipse(0, 0, 70, 50 * open, 0, 0, 7); g.fill();
    if (open > 0.2) { g.fillStyle = '#12051f'; g.beginPath(); g.arc(0, 0, 18 * open, 0, 7); g.fill(); }
    g.restore();
    for (let i = 0; i < 4; i++) {
      const y = 230 + i * 120, p = m.players[i];
      g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(100, y - 30, 1000, 60);
      g.fillStyle = '#ffe680'; g.fillRect(1100, y - 34, 8, 68);
      const x = 100 + S.pos[i];
      g.fillStyle = S.flash[i] > 0 ? '#fff' : p.color; g.beginPath(); g.arc(Math.min(x, 1100), y, 20, 0, 7); g.fill();
      MGH.text(g, p.name, 90, y + 6, 18, p.color, 'right', 'bold');
      if (S.fin[i]) MGH.text(g, '🏁', 1140, y + 10, 30, '#fff');
    }
    MGH.text(g, S.eye === 'open' ? 'THE EYE IS OPEN — FREEZE!' : (S.eye === 'tell' ? 'The eye twitches…' : 'Hold to run'), 640, 120, 30, S.eye === 'open' ? '#ff4d6d' : '#ddd', 'center', 'bold');
  },
});

// 3 ---------------------------------------------------------------- Lightning Rod
MG.def({
  id: 'lightning', name: 'Lightning Rod', type: 'Reaction', controls: '1 button', mouseA: true,
  how: 'Five rounds. After a hidden 1 to 5 second wait a bolt strikes. The first press scores a point. An early press loses one.',
  wins: 'Most points.',
  init(m, S) { S.pts = [0, 0, 0, 0]; S.round = 0; this.newRound(S); },
  newRound(S) { S.round++; S.wait = R.range(1, 5); S.bolt = false; S.bt = 0; S.lock = [false, false, false, false]; S.winner = -1; S.pause = 0; S.botT = [0, 1, 2, 3].map(() => R.range(0.2, 0.5)); S.botEarly = [0, 1, 2, 3].map(() => Math.random() < 0.06 ? R.range(0.3, S.wait) : -1); },
  update(m, S, dt) {
    if (S.pause > 0) { S.pause -= dt; if (S.pause <= 0) { if (S.round >= 5) m.finish(S.pts.slice()); else this.newRound(S); } return; }
    if (!S.bolt) { S.wait -= dt; if (S.wait <= 0) { S.bolt = true; S.bt = 0; Sfx.boom(); } }
    else S.bt += dt;
    for (let i = 0; i < 4; i++) {
      if (S.lock[i] || !m.pressed(i, 'a')) continue;
      if (!S.bolt) { S.pts[i]--; S.lock[i] = true; if (!m.bot(i)) Sfx.bad(); }
      else if (S.winner < 0) { S.winner = i; S.pts[i]++; S.pause = 1.4; S.react = S.bt; }
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
    const flash = S.bolt && S.bt < 0.15;
    MGH.bg(g, flash ? '#fff' : '#101428', flash ? '#ccd' : '#05060d');
    MGH.text(g, `Round ${S.round} / 5`, 640, 100, 26, '#aab');
    if (S.bolt) {
      g.strokeStyle = '#ffe680'; g.lineWidth = 8; g.beginPath(); g.moveTo(640, 120); g.lineTo(600, 260); g.lineTo(670, 280); g.lineTo(620, 450); g.stroke();
      MGH.text(g, 'STRIKE!', 640, 540, 80, '#ffe680', 'center', 'bold');
    } else MGH.text(g, 'Wait for it…', 640, 360, 50, '#556', 'center', 'bold');
    for (let i = 0; i < 4; i++) {
      const x = 190 + i * 300, p = m.players[i];
      g.fillStyle = p.color; g.globalAlpha = S.lock[i] ? 0.25 : 1; g.fillRect(x - 6, 560, 12, 120); g.globalAlpha = 1;
      MGH.text(g, p.name + (S.lock[i] ? ' (too early!)' : '') + (S.winner === i ? ' ⚡' : ''), x, 700, 20, p.color, 'center', 'bold');
    }
    if (S.winner >= 0) MGH.text(g, `${m.players[S.winner].name} — ${(S.react * 1000).toFixed(0)} ms`, 640, 620, 30, m.players[S.winner].color, 'center', 'bold');
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
    MGH.bg(g, '#1a1030', '#08050f');
    MGH.text(g, `Round ${S.round} / 3`, 640, 90, 26, '#aab');
    for (let i = 0; i < 4; i++) {
      const x = 190 + i * 300, p = m.players[i], top = 200, h = 380;
      g.strokeStyle = '#ddd'; g.lineWidth = 4; MGH.rr(g, x - 70, top, 140, h, 14); g.stroke();
      const show = S.reveal > 0;
      if (show) { g.fillStyle = p.color; const f = Math.min(1.05, S.fill[i]); g.fillRect(x - 66, top + h - f * h, 132, f * h); }
      else { g.fillStyle = 'rgba(80,60,120,0.85)'; g.fillRect(x - 66, top + 4, 132, h - 8); MGH.text(g, S.state[i] === 2 ? '✔ done' : (S.state[i] === 1 ? 'pouring…' : 'hold'), x, top + h / 2, 22, '#fff'); }
      g.strokeStyle = '#ffe680'; g.lineWidth = 3; g.beginPath(); g.moveTo(x - 80, top + h - S.line * h); g.lineTo(x + 80, top + h - S.line * h); g.stroke();
      MGH.text(g, p.name, x, 630, 22, p.color, 'center', 'bold');
      if (show) MGH.text(g, S.fill[i] > 1 ? 'overflow!' : `off by ${Math.abs(S.fill[i] - S.line).toFixed(3)}`, x, 660, 18, '#fff');
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
    for (let i = 0; i < 4; i++) if (m.pressed(i, 'a') && m.t >= 8) S.taps[i].push(m.t);
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
    MGH.bg(g, '#20140a', '#0a0604');
    const silent = m.t >= 8;
    MGH.text(g, silent ? 'SILENCE — keep the beat!' : 'Listen to the beat…', 640, 140, 40, silent ? '#ffd34d' : '#fff', 'center', 'bold');
    if (!silent) { g.fillStyle = S.pulse > 0 ? '#ffe680' : '#553'; g.beginPath(); g.arc(640, 330, 70, 0, 7); g.fill(); }
    else { g.fillStyle = '#332'; g.beginPath(); g.arc(640, 330, 70, 0, 7); g.fill(); MGH.text(g, '🧘', 640, 352, 60, '#fff'); }
    for (let i = 0; i < 4; i++) {
      const x = 190 + i * 300, p = m.players[i];
      const lt = S.taps[i].length ? S.taps[i][S.taps[i].length - 1] : -9;
      g.fillStyle = p.color; g.globalAlpha = m.t - lt < 0.12 ? 1 : 0.35; g.beginPath(); g.arc(x, 560, 40, 0, 7); g.fill(); g.globalAlpha = 1;
      MGH.text(g, p.name, x, 640, 22, p.color, 'center', 'bold');
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
    MGH.bg(g, '#141d2a', '#05080d'); MGH.lanes(g, m);
    for (let i = 0; i < 4; i++) {
      const cx = i * 320 + 160, p = m.players[i];
      g.fillStyle = '#ffe680'; g.fillRect(cx - 3, 120, 6, 470);
      MGH.text(g, '🔔', cx, 640, 40, '#fff');
      const a = this.x(S, i) * 0.9;
      const bx = cx + Math.sin(a) * 300, by = 100 + Math.cos(a) * 300;
      g.strokeStyle = '#aaa'; g.lineWidth = 3; g.beginPath(); g.moveTo(cx, 100); g.lineTo(bx, by); g.stroke();
      g.fillStyle = p.color; g.beginPath(); g.arc(bx, by, 26, 0, 7); g.fill();
      if (S.last[i] !== null) MGH.text(g, S.last[i] < 0.08 ? 'PERFECT' : S.last[i].toFixed(2), cx, 690, 22, '#fff', 'center', 'bold');
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
    MGH.bg(g, '#2a0f08', '#0d0402');
    for (let i = 0; i < 4; i++) {
      const y = 140 + i * 145, p = m.players[i], x0 = 200, W = 880;
      MGH.text(g, p.name, 180, y + 8, 20, p.color, 'right', 'bold');
      g.fillStyle = '#3a2a22'; g.fillRect(x0, y - 22, W, 44);
      const w = this.w(S.n[i]);
      g.fillStyle = '#8a6d1a'; g.fillRect(x0 + (S.zone[i] - w * 1.3) * W, y - 22, w * 2.6 * W, 44);
      g.fillStyle = '#ffd34d'; g.fillRect(x0 + (S.zone[i] - w / 2) * W, y - 22, w * W, 44);
      g.fillStyle = '#fff'; g.fillRect(x0 + S.pos[i] * W - 4, y - 32, 8, 64);
      MGH.text(g, '🔨', x0 + S.pos[i] * W, y - 36, 26, '#fff');
      MGH.text(g, S.msg[i], 1180, y + 8, 22, '#ffe680', 'center', 'bold');
    }
  },
});

// 8 ---------------------------------------------------------------- Rising Tide
MG.def({
  id: 'tide', name: 'Rising Tide', type: 'Survival', controls: 'Move + jump', dur: 45,
  how: 'Climb the platforms as the water rises and the arena shrinks. Touch the water and you are out.',
  wins: 'Last one alive.',
  init(m, S) {
    S.plats = [{ x: 0, y: 690, w: 1280 }];
    for (let y = 600; y > 60; y -= 95) {
      const n = R.int(3, 4);
      for (let k = 0; k < n; k++) S.plats.push({ x: k * (1280 / n) + R.range(0, 1280 / n - 200), y: y + R.range(-12, 12), w: R.range(150, 210) });
    }
    S.b = [0, 1, 2, 3].map(i => ({ x: 220 + i * 280, y: 690, vx: 0, vy: 0, ground: true, alive: true, outT: 0 }));
    S.water = 740; S.wall = 0;
  },
  update(m, S, dt) {
    S.water = 800 - m.t * 15.5; S.wall = Math.min(260, m.t * 6);
    for (let i = 0; i < 4; i++) {
      const b = S.b[i]; if (!b.alive) continue;
      const ax = m.axis(i).x;
      b.vx = ax * 300;
      if (m.pressed(i, 'a') && b.ground) { b.vy = -820; b.ground = false; }
      b.vy += 1900 * dt;
      const py = b.y;
      b.x = clamp(b.x + b.vx * dt, S.wall + 14, 1280 - S.wall - 14); b.y += b.vy * dt;
      b.ground = false;
      if (b.vy >= 0) for (const p of S.plats) {
        if (b.x > p.x && b.x < p.x + p.w && py <= p.y && b.y >= p.y) { b.y = p.y; b.vy = 0; b.ground = true; break; }
      }
      if (b.y > S.water || b.y > 760) { b.alive = false; b.outT = m.t; if (!m.bot(i)) Sfx.bad(); }
    }
    if (S.b.filter(b => b.alive).length <= 1) m.finish(this.score(m, S));
  },
  bot(m, S, i) {
    const b = S.b[i], v = m.vin[i]; if (!b.alive) return;
    if (b.ground && (!b.goal || b.goal.y >= b.y - 5 || Math.random() < 0.01)) {
      const above = S.plats.filter(p => p.y < b.y - 20 && p.y > b.y - 150 && p.x + p.w > S.wall + 20 && p.x < 1280 - S.wall - 20);
      b.goal = above.length ? above.sort((a, c) => Math.abs(a.x + a.w / 2 - b.x) - Math.abs(c.x + c.w / 2 - b.x))[0] : null;
    }
    v.a = false;
    if (b.goal) {
      const gx = clamp(b.goal.x + b.goal.w / 2, S.wall + 30, 1280 - S.wall - 30);
      const dx = gx - b.x;
      MGH.setLR(m, i, Math.abs(dx) < 15 ? 0 : Math.sign(dx));
      if (b.ground && Math.abs(dx) < b.goal.w / 2 - 10) v.a = !m.prev[i].a;
    } else MGH.setLR(m, i, 0);
  },
  score(m, S) { return S.b.map(b => b.alive ? 1000 + (740 - b.y) : b.outT); },
  fmt(s) { return s >= 1000 ? 'Survived' : `out at ${s.toFixed(1)}s`; },
  hud(m, S, i) { return S.b[i].alive ? 'alive' : 'out'; },
  draw(m, S, g) {
    MGH.bg(g, '#0b2440', '#06101d');
    g.fillStyle = '#2a1a0a'; g.fillRect(0, 40, S.wall, 680); g.fillRect(1280 - S.wall, 40, S.wall, 680);
    g.fillStyle = '#9b7b55';
    for (const p of S.plats) { MGH.rr(g, p.x, p.y, p.w, 12, 5); g.fill(); }
    S.b.forEach((b, i) => {
      if (!b.alive) return;
      g.fillStyle = m.players[i].color; MGH.rr(g, b.x - 14, b.y - 36, 28, 36, 8); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke();
    });
    g.fillStyle = 'rgba(40,120,255,0.65)'; g.fillRect(0, S.water, 1280, 720 - S.water);
    g.fillStyle = 'rgba(160,210,255,0.5)'; for (let x = 0; x < 1280; x += 40) { g.beginPath(); g.arc(x + (m.t * 40) % 40, S.water, 14, Math.PI, 0); g.fill(); }
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
    S.b = [0, 1, 2, 3].map(i => Object.assign(MGH.body(300 + i * 230, 380, 18), { outT: 0 }));
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
      else if (S.phase === 'warn') { S.cur.forEach(i => { S.state[i] = 2; }); S.phase = 'fire'; S.next = 0.7; Sfx.tone(140, 0.25, 'sawtooth', 0.04); }
      else { S.state.fill(0); S.phase = 'idle'; S.next = 0.5 * speedUp; }
    }
    S.b.forEach((b, i) => {
      if (!b.alive) return;
      const a = m.axis(i); MGH.steer(b, a.x, a.y, dt, 2600, 330, 9); MGH.integrate(b, dt);
      if (S.state[this.tileAt(S, b.x, b.y)] === 2) { b.alive = false; b.outT = m.t; if (!m.bot(i)) Sfx.bad(); }
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
    for (let k = 0; k < 60; k++) {
      const x = (k % 10) * S.tw, y = 40 + Math.floor(k / 10) * S.th, s = S.state[k];
      g.fillStyle = s === 2 ? '#ff5a1f' : s === 1 ? (Math.sin(m.t * 30) > 0 ? '#ffb347' : '#5a3020') : ((k + Math.floor(k / 10)) % 2 ? '#3b2a22' : '#33241d');
      g.fillRect(x, y, S.tw - 2, S.th - 2);
      if (s === 2) MGH.text(g, '🔥', x + S.tw / 2, y + S.th / 2 + 12, 34, '#fff');
    }
    S.b.forEach((b, i) => { if (b.alive) MGH.drawBody(g, b, m.players[i]); });
  },
});

// 10 ---------------------------------------------------------------- Gale Sumo
MG.def({
  id: 'sumo', name: 'Gale Sumo', type: 'Arena', controls: 'Move + dash', dur: 45,
  how: 'Dash into rivals to knock them off a ring that keeps shrinking. The dash recharges in 2 seconds.',
  wins: 'Last one in the ring.',
  init(m, S) {
    S.cx = 640; S.cy = 385; S.rad = 310;
    S.b = [0, 1, 2, 3].map(i => { const a = i * Math.PI / 2 + Math.PI / 4; return Object.assign(MGH.body(640 + Math.cos(a) * 180, 385 + Math.sin(a) * 180, 26), { cd: 0, outT: 0, dash: 0 }); });
  },
  update(m, S, dt) {
    S.rad = Math.max(110, 310 - m.t * 5);
    S.b.forEach((b, i) => {
      if (!b.alive) return;
      const a = m.axis(i); MGH.steer(b, a.x, a.y, dt, 1400, 260, 2.2);
      b.cd -= dt; b.dash -= dt;
      if (m.pressed(i, 'a') && b.cd <= 0) { b.vx += b.face.x * 720; b.vy += b.face.y * 720; b.cd = 2; b.dash = 0.3; if (!m.bot(i)) Sfx.tone(300, 0.15, 'sawtooth', 0.05, 300); }
      b.x += b.vx * dt; b.y += b.vy * dt;
      const v = Math.hypot(b.vx, b.vy); if (v > 900) { b.vx *= 900 / v; b.vy *= 900 / v; }
    });
    MGH.collide(S.b, 1.6);
    S.b.forEach((b, i) => { if (b.alive && dist(b.x, b.y, S.cx, S.cy) > S.rad + 8) { b.alive = false; b.outT = m.t; Sfx.boom(); } });
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
    MGH.bg(g, '#9fd8ff', '#3b78a8');
    g.fillStyle = '#e9f7ff'; g.beginPath(); g.arc(S.cx, S.cy, S.rad, 0, 7); g.fill();
    g.strokeStyle = '#2a7fa8'; g.lineWidth = 8; g.stroke();
    for (let k = 0; k < 12; k++) { const a = m.t + k; g.strokeStyle = 'rgba(255,255,255,0.4)'; g.lineWidth = 3; g.beginPath(); g.arc(S.cx, S.cy, S.rad + 30 + k * 8, a, a + 0.6); g.stroke(); }
    S.b.forEach((b, i) => { if (b.alive) MGH.drawBody(g, b, m.players[i], b.dash > 0 ? '💨' : ''); });
  },
});
