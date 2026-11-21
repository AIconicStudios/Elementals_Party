'use strict';
// Party batch 8: Lily Hop, Spotlight Dance, Mole Patrol (1v3), Balloon Ride, Combo Cook

// ======================================================================== LILY HOP (one-button frog race across drifting pads)
MG.def({
  id: 'lilyhop', name: 'Lily Hop', type: 'Race', controls: '1 button', dur: 0,
  rows: [['a', 'Hop to the next pad']],
  how: 'Hop your frog across the pond! Each row of lily pads drifts sideways. Press A to hop straight ahead — you need a pad right in front of you to land on. Miss — or drift off the edge — and you splash back to the start bank. First to the far shore wins!',
  wins: 'First across the pond.',
  ROWS: 6,
  init(m, S) {
    S.rows = []; for (let r = 0; r < this.ROWS; r++) S.rows.push({ sp: (r % 2 ? -1 : 1) * R.range(60, 110 + r * 8), off: R.range(0, 200), gap: R.range(125, 175) });
    S.p = [0, 1, 2, 3].map(i => ({ row: -1, x: 200 + i * 290, hop: 0, splash: 0, fin: 0, react: R.range(0.05, 0.25), w: 0 }));
  },
  padsAt(S, r, t) { const R_ = S.rows[r], o = ((R_.off + R_.sp * t) % R_.gap + R_.gap) % R_.gap; const out = []; for (let x = o - R_.gap; x < 1340; x += R_.gap) out.push(x); return out; },
  rowY(r) { return 640 - (r + 1) * 64; },
  update(m, S, dt) {
    S.p.forEach((P, i) => {
      if (P.fin) return;
      if (P.splash > 0) { P.splash -= dt; return; }
      if (P.hop > 0) { P.hop -= dt; if (P.hop <= 0) this.land(m, S, P, i); return; }
      if (P.row >= 0) P.x += S.rows[P.row].sp * dt;
      if (P.row >= 0 && (P.x < 20 || P.x > 1260)) { this.splash(S, P); return; }
      if (m.pressed(i, 'a')) { P.hop = 0.28; Sfx.tone(600, 0.05, 'triangle', 0.03); }
    });
    if (S.p.every(P => P.fin) || m.t > 70) m.finish(this.score(m, S));
  },
  land(m, S, P, i) {
    const nr = P.row + 1;
    if (nr >= this.ROWS) { P.row = nr; P.fin = m.t; Sfx.coin(); return; }
    const pad = this.padsAt(S, nr, m.t).find(x => Math.abs(x - P.x) < 48);
    if (pad !== undefined) { P.row = nr; P.x = pad + (P.x - pad) * 0.5; Sfx.tone(800, 0.04, 'sine', 0.03); }
    else this.splash(S, P);
  },
  splash(S, P) { MGH.burst(P.x, this.rowY(P.row + 1), ['#9fe0ff', '#fff'], 12, { speed: 180 }); Sfx.noise(0.3, 900, 0.08, 'lowpass'); P.splash = 0.9; P.row = -1; P.x = clamp(P.x, 60, 1220); },
  bot(m, S, i) {
    const P = S.p[i], v = m.vin[i]; v.a = false; if (P.fin || P.hop > 0 || P.splash > 0) return;
    const nr = P.row + 1; if (nr >= this.ROWS) { v.a = true; return; }
    const look = 0.28 + 1 / 60, pads = this.padsAt(S, nr, m.t + look);
    const sp = P.row >= 0 ? S.rows[P.row].sp : 0, fx = P.x + sp * look;
    if (P.row >= 0 && (fx < 90 || fx > 1190)) { v.a = true; return; }
    if (pads.some(x => Math.abs(x - fx) < 30) && Math.random() < 0.3) v.a = true;
  },
  score(m, S) { return S.p.map(P => P.fin ? 100 - P.fin : P.row + 1); },
  fmt(s) { return s > 20 ? `${(100 - s).toFixed(1)}s` : `${Math.round(s)} rows`; },
  hud(m, S, i) { const P = S.p[i]; return P.fin ? '🏁' : `row ${P.row + 1}/${this.ROWS}`; },
  draw(m, S, g) {
    g.fillStyle = '#5aa83a'; g.fillRect(0, 0, 1280, 720);
    g.fillStyle = MGH.grad(g, 90, 650, ['#3a8ac8', '#4aa0d8', '#3a8ac8']); g.fillRect(0, this.rowY(this.ROWS - 1) - 32, 1280, this.ROWS * 64);
    for (let k = 0; k < 30; k++) { const x = (k * 97 + m.t * 20) % 1300, y = this.rowY(this.ROWS - 1) - 20 + (k * 53) % (this.ROWS * 64); g.strokeStyle = 'rgba(255,255,255,0.25)'; g.lineWidth = 2; g.beginPath(); g.arc(x, y, 6 + (k % 4) * 3, 0, Math.PI); g.stroke(); }
    g.fillStyle = '#7ac85a'; g.fillRect(0, 610, 1280, 110); g.fillRect(0, 40, 1280, this.rowY(this.ROWS - 1) - 72);
    for (let r = 0; r < this.ROWS; r++) { const y = this.rowY(r); this.padsAt(S, r, m.t).forEach(x => { g.fillStyle = '#3a9a3a'; g.beginPath(); g.ellipse(x, y, 40, 22, 0, 0.3, Math.PI * 2 - 0.3); g.lineTo(x, y); g.fill(); g.fillStyle = 'rgba(255,255,255,0.15)'; g.beginPath(); g.ellipse(x - 10, y - 6, 14, 6, 0, 0, 7); g.fill(); if ((r + Math.round(x)) % 5 === 0) { g.fillStyle = '#ff9ac8'; g.beginPath(); g.arc(x + 18, y - 4, 6, 0, 7); g.fill(); } }); }
    S.p.forEach((P, i) => {
      const p = m.players[i]; let y = P.fin ? this.rowY(this.ROWS) + 10 : this.rowY(P.row) + (P.row < 0 ? 30 : 0);
      if (P.hop > 0) { const k = 1 - P.hop / 0.28; y = y + (this.rowY(P.row + 1) - y) * k - Math.sin(Math.PI * k) * 30; }
      if (P.splash > 0) { g.globalAlpha = 0.5; }
      MGH.shadow(g, P.x, y + 14, 18, 0.3);
      g.fillStyle = '#5ac83a'; g.beginPath(); g.ellipse(P.x, y + 4, 22, 14, 0, 0, 7); g.fill();
      Char.draw(g, P.x, y - 10, 16, p.el.id, p.color, { mood: MGH.persona(P.splash > 0 ? 'hurt' : P.fin ? 'cheer' : 'determined', p.el.id), seed: i * 1.7, look: { x: 0, y: -1 }, headOnly: true });
      g.globalAlpha = 1;
    });
    MGH.text(g, 'FAR SHORE', 640, this.rowY(this.ROWS) + 20, 18, '#2a5a1a', 'center', 'bold');
  },
});

// ======================================================================== SPOTLIGHT DANCE (stay in your colour's spotlight)
MG.def({
  id: 'spotlight', name: 'Spotlight Dance', type: 'Arena', controls: 'Move', dur: 45,
  rows: [['stick', 'Dance into your spotlight']],
  how: 'Coloured spotlights glide around the stage. Find the spotlight in YOUR colour and stay inside it to score! Watch out: lights sometimes swap colours, and a white "star" light scores double for whoever is in it alone.',
  wins: 'Most points.',
  init(m, S) {
    S.b = [0, 1, 2, 3].map(i => Object.assign(MGH.body(300 + i * 230, 420, 22), { pts: 0 }));
    S.L = [0, 1, 2, 3].map(i => ({ owner: i, x: R.range(200, 1080), y: R.range(220, 620), a: R.range(0, 6), sp: R.range(0.4, 0.8) }));
    S.star = { x: 640, y: 400, a: 0 }; S.swapT = 8;
  },
  update(m, S, dt) {
    S.swapT -= dt; if (S.swapT <= 0) { S.swapT = R.range(6, 10); const o = R.shuffle(S.L.map(l => l.owner)); S.L.forEach((l, k) => { l.owner = o[k]; }); Sfx.tone(500, 0.2, 'triangle', 0.04, 300); }
    S.L.forEach(l => { l.a += dt * l.sp; l.x = clamp(l.x + Math.cos(l.a) * 120 * dt, 160, 1120); l.y = clamp(l.y + Math.sin(l.a * 1.3) * 90 * dt, 200, 640); if (l.x <= 160 || l.x >= 1120) l.a = Math.PI - l.a; });
    S.star.a += dt * 0.5; S.star.x = 640 + Math.cos(S.star.a) * 380; S.star.y = 420 + Math.sin(S.star.a * 1.4) * 170;
    S.b.forEach((b, i) => { const a = m.axis(i); MGH.steer(b, a.x, a.y, dt, 2000, 290, 7); MGH.integrate(b, dt, 40, 160, 1240, 700); const L = S.L.find(l => l.owner === i); if (dist(L.x, L.y, b.x, b.y) < 80) b.pts += dt * 10; });
    const inStar = S.b.filter(b => dist(S.star.x, S.star.y, b.x, b.y) < 70); if (inStar.length === 1) inStar[0].pts += dt * 20;
    MGH.collide(S.b, 0.6);
  },
  bot(m, S, i) { const b = S.b[i], L = S.L.find(l => l.owner === i), st = S.star, alone = S.b.filter((o, j) => j !== i && dist(st.x, st.y, o.x, o.y) < 90).length === 0; const go = alone && dist(st.x, st.y, b.x, b.y) < dist(L.x, L.y, b.x, b.y) * 0.6 ? st : L; MGH.aim(m, i, go.x + Math.cos(m.t + i) * 20, go.y, b, 14); },
  score(m, S) { return S.b.map(b => Math.round(b.pts)); },
  fmt(s) { return `${s} pts`; },
  hud(m, S, i) { return `${Math.round(S.b[i].pts)}`; },
  draw(m, S, g) {
    g.fillStyle = '#120a20'; g.fillRect(0, 0, 1280, 720);
    g.fillStyle = MGH.grad(g, 160, 720, ['#3a2a4a', '#2a1a38']); g.fillRect(40, 160, 1200, 560);
    for (let x = 40; x < 1240; x += 60) { g.fillStyle = 'rgba(255,255,255,0.03)'; g.fillRect(x, 160, 2, 560); }
    g.fillStyle = '#6a1a2a'; g.fillRect(0, 40, 1280, 110); for (let x = 0; x < 1280; x += 40) { g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x, 40, 16, 110); }
    MGH.crowd(g, m.t, 720, 30);
    g.save(); g.globalCompositeOperation = 'lighter';
    S.L.forEach(l => { const col = m.players[l.owner].color; const gr = g.createRadialGradient(l.x, l.y, 10, l.x, l.y, 90); gr.addColorStop(0, col + 'cc'); gr.addColorStop(1, col + '00'); g.fillStyle = gr; g.beginPath(); g.ellipse(l.x, l.y, 90, 70, 0, 0, 7); g.fill(); g.fillStyle = col + '22'; g.beginPath(); g.moveTo(l.x - 60, l.y); g.lineTo(l.x - 10, 150); g.lineTo(l.x + 10, 150); g.lineTo(l.x + 60, l.y); g.fill(); });
    const gr = g.createRadialGradient(S.star.x, S.star.y, 5, S.star.x, S.star.y, 80); gr.addColorStop(0, 'rgba(255,255,255,0.8)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(S.star.x, S.star.y, 80, 60, 0, 0, 7); g.fill();
    g.restore();
    MGH.star(g, S.star.x, S.star.y - 70, 12, '#fff', m.t, false);
    const ents = S.b.map((b, i) => ({ y: b.y, f: () => { const L = S.L.find(l => l.owner === i), inL = dist(L.x, L.y, b.x, b.y) < 80; MGH.drawBody(g, b, m.players[i], '', inL ? 'cheer' : 'determined'); } }));
    ents.sort((a, b) => a.y - b.y).forEach(e => e.f());
  },
});

// ======================================================================== MOLE PATROL (1 vs 3, secret A B X Y)
MG.def({
  id: 'molepatrol', name: 'Mole Patrol', type: 'Bluff', mode: '1v3', controls: 'A B X Y', dur: 0, noPadSkip: true,
  rows: [['abxy', 'Pick a hole: Y top · B right · A bottom · X left']],
  how: 'One player is a cheeky MOLE; three gardeners hold mallets. Each round, everybody secretly presses a button for a hole: TOP = Y, RIGHT = B, BOTTOM = A, LEFT = X. The mole pops up in its hole — one mallet on its hole MIGHT bonk it, but two mallets on the same hole always do! Gardeners, team up on the right hole — but the mole is watching your habits. Eight rounds: the mole needs five escapes, the gardeners three bonks.',
  wins: 'Mole: 5 escapes. Gardeners: 3 bonks.',
  init(m, S) { S.mole = m.players.findIndex((p, i) => m.teamOf(i) === 0); S.r = 0; S.esc = 0; S.bonk = 0; S.hist = []; S.win = -1; this.next(S); },
  next(S) { S.r++; S.ph = 'pick'; S.pt = 0; S.pick = [-1, -1, -1, -1]; S.bAt = [0, 1, 2, 3].map(() => R.range(0.6, 2.4)); },
  update(m, S, dt) {
    S.pt += dt;
    if (S.ph === 'pick') {
      m.players.forEach((p, i) => { if (S.pick[i] >= 0) return; const d = abxyPress(m, i); if (d >= 0) { S.pick[i] = d; Sfx.click(); } });
      if (S.pick.every(p => p >= 0) || S.pt > 6) { S.pick = S.pick.map(p => p >= 0 ? p : R.int(0, 3)); const mh = S.pick[S.mole]; const nW = [0, 1, 2, 3].filter(i => i !== S.mole && S.pick[i] === mh).length; S.caught = nW >= 2 || (nW === 1 && Math.random() < 0.45); if (S.caught) S.bonk++; else S.esc++; S.hist.push({ h: mh, c: S.caught }); S.ph = 'reveal'; S.pt = 0; if (S.caught) Sfx.punch(); else Sfx.coin(); }
      return;
    }
    if (S.pt > 2.6) { if (S.esc >= 5) { S.win = 0; m.finish(this.score(m, S)); } else if (S.bonk >= 3) { S.win = 1; m.finish(this.score(m, S)); } else this.next(S); }
  },
  bot(m, S, i) {
    if (S.ph !== 'pick' || S.pick[i] >= 0 || S.pt < S.bAt[i]) { abxyBot(m, i, -1); return; }
    if (i === S.mole) { const used = [0, 0, 0, 0]; S.hist.forEach(h => used[h.h]++); abxyBot(m, i, R.weighted([0, 1, 2, 3], d => 1 / (1 + used[d]))); return; }
    // gardeners guess where the mole likes to go, but spread out a little
    const used = [0, 0, 0, 0]; S.hist.forEach(h => used[h.h]++); used.forEach((u, d) => { used[d] = 1 / (1 + u); }); const taken = S.pick.filter((p, j) => j !== S.mole && p >= 0);
    const fresh = [0, 1, 2, 3].filter(d => !taken.includes(d)); abxyBot(m, i, taken.length === 1 && Math.random() < 0.7 ? taken[0] : taken.length >= 2 && Math.random() < 0.8 ? R.weighted(fresh, d => used[d]) : R.weighted([0, 1, 2, 3], d => used[d]));
  },
  score(m, S) { const moleWon = S.win === 0; return m.players.map((p, i) => (i === S.mole) === moleWon ? 1 : 0); },
  fmt(s) { return s ? 'WIN' : '—'; },
  hud(m, S, i) { return i === S.mole ? `🐹 escapes ${S.esc}/5` : `🔨 bonks ${S.bonk}/3`; },
  draw(m, S, g) {
    MGH.scene(g, 'meadow', m.t);
    g.fillStyle = 'rgba(120,80,40,0.35)'; g.beginPath(); g.ellipse(640, 400, 360, 250, 0, 0, 7); g.fill();
    const mp = m.players[S.mole];
    ABXY_POS.forEach(([x, y], d) => {
      const yy = y + 20; g.fillStyle = '#3a2410'; g.beginPath(); g.ellipse(x, yy + 20, 56, 20, 0, 0, 7); g.fill(); g.fillStyle = '#6a4a2a'; g.beginPath(); g.ellipse(x, yy + 26, 62, 14, 0, 0, Math.PI); g.fill();
      abxyBadge(g, d, x + 60, yy - 30, 16);
      if (S.ph === 'reveal') {
        const whack = [0, 1, 2, 3].filter(i => i !== S.mole && S.pick[i] === d);
        if (S.pick[S.mole] === d) { const up = Math.min(1, S.pt * 4) * 40; g.save(); g.beginPath(); g.rect(x - 60, yy - 100, 120, 120); g.clip(); g.fillStyle = '#8a6a4a'; g.beginPath(); g.ellipse(x, yy + 30 - up, 30, 34, 0, 0, 7); g.fill(); Char.draw(g, x, yy - 10 - up, 18, mp.el.id, mp.color, { headOnly: true, mood: S.caught ? 'dizzy' : 'smug', seed: S.mole }); g.restore(); if (S.caught) MGH.text(g, 'BONK!', x, yy - 80, 26, '#ff6b6b', 'center', 'bold'); }
        whack.forEach((i, k) => { const p = m.players[i]; g.save(); g.translate(x + 40 + k * 26, yy - 40); g.rotate(-0.8 + Math.min(1, S.pt * 4) * 0.9); g.fillStyle = '#8a5a2a'; g.fillRect(-3, 0, 6, 50); g.fillStyle = p.color; MGH.rr(g, -16, -10, 32, 20, 6); g.fill(); g.restore(); });
      }
    });
    Char.draw(g, 640, 400, 30, mp.el.id, mp.color, { mood: MGH.persona(S.ph === 'pick' ? 'smug' : S.caught ? 'hurt' : 'cheer', mp.el.id), seed: S.mole, look: { x: 0, y: 0.5 } }); MGH.text(g, 'MOLE', 640, 450, 16, mp.color, 'center', 'bold');
    m.players.forEach((p, i) => { if (i === S.mole) return; const k = [0, 1, 2, 3].filter(j => j !== S.mole).indexOf(i), x = [110, 1170, 110][k], y = [220, 400, 580][k]; Char.draw(g, x, y, 32, p.el.id, p.color, { mood: S.ph === 'pick' ? (S.pick[i] >= 0 ? 'determined' : 'nervous') : 'happy', seed: i * 1.7, look: { x: x < 640 ? 1 : -1, y: 0 } }); MGH.text(g, p.name + (S.ph === 'pick' && S.pick[i] >= 0 ? ' ✔' : ''), x, y + 62, 16, p.color, 'center', 'bold'); });
    MGH.label(g, `Round ${S.r}   ·   escapes ${S.esc}/5   ·   bonks ${S.bonk}/3`, 640, 76, 22, '#fff');
    if (S.ph === 'pick') MGH.text(g, `${S.pick[S.mole] >= 0 ? 'The mole has chosen…' : 'The mole is choosing…'}   ${Math.max(0, 6 - S.pt).toFixed(0)}s`, 640, 690, 20, '#fff', 'center', 'bold');
  },
});

// ======================================================================== BALLOON RIDE (ride the wind layers to the flag)
MG.def({
  id: 'balloonride', name: 'Balloon Ride', type: 'Skill', controls: '1 button', dur: 0,
  rows: [['a', 'Hold to fire the burner (rise)']],
  how: 'Steer a hot-air balloon with only your burner! HOLD A to heat the air and rise, let go to sink slowly. The wind blows a different way at each height — the arrows on the side show which way. Ride the right layers to drift over to the flag and land on the target pad. Closest landing in the time limit wins!',
  wins: 'Closest to the target pad (landing on it wins).',
  LAYERS: [{ y0: 120, y1: 260, w: 1 }, { y0: 260, y1: 400, w: -1 }, { y0: 400, y1: 540, w: 1 }, { y0: 540, y1: 660, w: 0.35 }],
  init(m, S) { S.tx = R.pick([980, 1100, 300]); S.L = this.LAYERS.map((l, k) => Object.assign({}, l, { w: l.w * (k === 3 ? 1 : R.range(0.7, 1.3)) * (S.tx < 640 ? -1 : 1) })); S.p = [0, 1, 2, 3].map(i => ({ x: S.tx < 640 ? 1100 - i * 50 : 180 + i * 50, y: 640, vy: 0, heat: 0, land: false, done: 0 })); },
  update(m, S, dt) {
    S.p.forEach((P, i) => {
      if (P.done) return;
      if (m.held(i, 'a')) P.heat = Math.min(1, P.heat + dt * 0.8); else P.heat = Math.max(0, P.heat - dt * 0.35);
      P.vy += ((0.45 - P.heat) * 160 - P.vy) * dt; P.y = clamp(P.y + P.vy * dt, 130, 652);
      const L = S.L.find(l => P.y >= l.y0 && P.y < l.y1); if (P.y < 648) P.x = clamp(P.x + (L ? L.w * 70 : 0) * dt, 40, 1240);
      if (P.y >= 650 && P.vy >= 0 && m.t > 3 && Math.abs(P.x - S.tx) < 50) { P.done = m.t; Sfx.coin(); }
    });
    if (S.p.every(P => P.done) || m.t > 50) m.finish(this.score(m, S));
  },
  bot(m, S, i) {
    const P = S.p[i], v = m.vin[i]; if (P.done) { v.a = false; return; }
    const dx = S.tx - P.x, low = S.L[3], toward = Math.sign(low.w) === Math.sign(dx);
    let ty; if (Math.abs(dx) < 30) ty = 670; else if (Math.abs(dx) < 260 && toward) ty = 600; else { const L = S.L.slice(0, 3).find(l => Math.sign(l.w) === Math.sign(dx)) || S.L[0]; ty = (L.y0 + L.y1) / 2; } v.a = P.y + P.vy * (P.look || 1.2) > ty; if (Math.random() < 0.01) P.look = R.range(0.6, 2);
  },
  score(m, S) { return S.p.map(P => P.done ? 2000 - P.done : 1000 - Math.abs(P.x - S.tx)); },
  fmt(s) { return s > 1500 ? `landed in ${(2000 - s).toFixed(1)}s` : `${Math.round(1000 - s)} px away`; },
  hud(m, S, i) { const P = S.p[i]; return P.done ? '🎯 landed!' : `${Math.round(Math.abs(P.x - S.tx) / 10)} m`; },
  draw(m, S, g) {
    g.fillStyle = MGH.grad(g, 0, 720, ['#4a90e8', '#a8d8ff', '#ffe8c8']); g.fillRect(0, 0, 1280, 720);
    S.L.forEach((l, k) => { g.fillStyle = k % 2 ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.12)'; g.fillRect(0, l.y0, 1280, l.y1 - l.y0); for (let q = 0; q < 6; q++) { const x = ((q * 230 + m.t * l.w * 70) % 1400 + 1400) % 1400 - 60, y = l.y0 + 30 + (q % 3) * 35; g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 40 * Math.sign(l.w), y); g.stroke(); } MGH.text(g, l.w > 0 ? '▶▶' : '◀◀', 30, (l.y0 + l.y1) / 2 + 6, 18, '#fff', 'center', 'bold'); });
    g.fillStyle = '#7ac85a'; g.fillRect(0, 680, 1280, 40);
    g.fillStyle = '#ff6b6b'; g.beginPath(); g.ellipse(S.tx, 684, 50, 10, 0, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.ellipse(S.tx, 684, 30, 6, 0, 0, 7); g.fill(); g.fillStyle = '#ff6b6b'; g.beginPath(); g.ellipse(S.tx, 684, 10, 2, 0, 0, 7); g.fill();
    g.fillStyle = '#888'; g.fillRect(S.tx + 60, 600, 4, 84); g.fillStyle = '#ffcf4a'; g.beginPath(); g.moveTo(S.tx + 64, 600); g.lineTo(S.tx + 100, 612); g.lineTo(S.tx + 64, 624); g.fill();
    S.p.forEach((P, i) => {
      const p = m.players[i], x = P.x, y = P.y - 30;
      g.fillStyle = p.color; g.beginPath(); g.arc(x, y - 40, 40, Math.PI * 0.85, Math.PI * 2.15); g.lineTo(x + 14, y); g.lineTo(x - 14, y); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 2; for (const dx of [-20, 0, 20]) { g.beginPath(); g.moveTo(x + dx * 0.7, y - 78); g.quadraticCurveTo(x + dx, y - 40, x + dx * 0.3, y - 4); g.stroke(); }
      if (m.held(i, 'a') && !P.done) MGH.flame(g, x, y + 4, 0.4, m.t, i);
      g.strokeStyle = '#5a3a20'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 14, y); g.lineTo(x - 12, y + 18); g.moveTo(x + 14, y); g.lineTo(x + 12, y + 18); g.stroke();
      g.fillStyle = '#a8703a'; MGH.rr(g, x - 16, y + 16, 32, 22, 5); g.fill();
      Char.draw(g, x, y + 12, 12, p.el.id, p.color, { headOnly: true, mood: MGH.persona(P.done ? 'cheer' : 'determined', p.el.id), seed: i * 1.7 });
      g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(x + 22, y - 10, 6, 40); g.fillStyle = '#ff8a3d'; g.fillRect(x + 22, y + 30 - 40 * P.heat, 6, 40 * P.heat);
    });
  },
});

// ======================================================================== COMBO COOK (race to punch in the recipe)
MG.def({
  id: 'combocook', name: 'Combo Cook', type: 'Reaction', controls: 'Move', dur: 0,
  rows: [['pad', 'Enter the recipe arrows']],
  how: 'The chef calls out a recipe of arrows. Punch it in with the d-pad or stick as fast as you can! One wrong arrow and you start that dish again. The first cook to finish scores 3, then 2, then 1. Recipes get longer each round.',
  wins: 'Most points after six dishes.',
  D: ['up', 'right', 'down', 'left'], G: ['▲', '▶', '▼', '◀'],
  init(m, S) { S.pts = [0, 0, 0, 0]; S.round = 0; this.next(S); },
  next(S) { S.round++; S.seq = []; for (let k = 0; k < 3 + S.round; k++) S.seq.push(R.int(0, 3)); S.ph = 'cook'; S.pt = 0; S.order = []; S.p = [0, 1, 2, 3].map(() => ({ k: 0, done: 0, err: 0, ax: '', bt: R.range(0.2, 0.4) })); },
  update(m, S, dt) {
    S.pt += dt;
    if (S.ph === 'cook') {
      S.p.forEach((P, i) => {
        P.err -= dt; if (P.done) return;
        const a = m.axis(i), now = a.x < -0.6 ? 'left' : a.x > 0.6 ? 'right' : a.y < -0.6 ? 'up' : a.y > 0.6 ? 'down' : '';
        const d = (m.bot(i) ? null : this.D.find(k => m.pressed(i, k))) || (now && now !== P.ax ? now : null); P.ax = now; if (!d) return;
        if (this.D.indexOf(d) === S.seq[P.k]) { P.k++; Sfx.tone(500 + P.k * 50, 0.04, 'triangle', 0.03); if (P.k >= S.seq.length) { P.done = S.pt; S.order.push(i); S.pts[i] += [3, 2, 1, 0][S.order.length - 1]; Sfx.coin(); } }
        else { P.k = 0; P.err = 0.4; Sfx.bad(); }
      });
      if (S.order.length >= 3 || S.pt > 12) { S.ph = 'show'; S.pt = 0; }
      return;
    }
    if (S.pt > 2.2) { if (S.round >= 6) m.finish(S.pts.slice()); else this.next(S); }
  },
  bot(m, S, i, dt) {
    const P = S.p[i], v = m.vin[i]; v.up = v.down = v.left = v.right = false; if (S.ph !== 'cook' || P.done || S.pt < 0.6) return;
    P.bt -= dt; if (P.bt > 0) return; P.bt = R.range(0.16, 0.34);
    const d = Math.random() < 0.93 ? S.seq[P.k] : R.int(0, 3); v[this.D[d]] = true;
  },
  score(m, S) { return S.pts.slice(); },
  fmt(s) { return `${s} pts`; },
  hud(m, S, i) { return `${S.pts[i]} pts`; },
  draw(m, S, g) {
    g.fillStyle = MGH.grad(g, 0, 720, ['#fff0d8', '#f4d0a0']); g.fillRect(0, 0, 1280, 720);
    for (let x = 0; x < 1280; x += 80) for (let y = 0; y < 260; y += 80) { g.fillStyle = (x + y) / 80 % 2 ? 'rgba(255,255,255,0.4)' : 'rgba(255,200,150,0.2)'; g.fillRect(x, y, 80, 80); }
    Char.npc(g, 200, 170, 40, 'chef', { mood: S.ph === 'cook' ? 'shout' : 'happy', look: { x: 1, y: 0.3 } });
    MGH.label(g, `Dish ${S.round} of 6`, 640, 60, 22, '#a8503a');
    const n = S.seq.length, w = Math.min(70, 900 / n);
    S.seq.forEach((d, k) => { const x = 640 - (n - 1) * w / 2 + k * w; g.fillStyle = '#fff'; MGH.rr(g, x - w * 0.42, 110, w * 0.84, w * 0.84, 10); g.fill(); g.strokeStyle = '#e8a060'; g.lineWidth = 3; g.stroke(); MGH.text(g, this.G[d], x, 110 + w * 0.6, w * 0.5, '#a8503a', 'center', 'bold'); });
    for (let i = 0; i < 4; i++) {
      const P = S.p[i], p = m.players[i], x = 160 + i * 320;
      g.fillStyle = '#c8c8d0'; MGH.rr(g, x - 110, 420, 220, 30, 8); g.fill(); g.fillStyle = '#5a5a6a'; g.beginPath(); g.ellipse(x, 420, 90, 18, 0, 0, 7); g.fill();
      const fill = P.k / S.seq.length; g.fillStyle = ['#ffcf4a', '#ff8a3d', '#7cf06a', '#ff6b8a'][i]; g.beginPath(); g.ellipse(x, 418, 80 * fill, 14 * fill, 0, 0, 7); g.fill();
      if (P.err > 0) { g.fillStyle = 'rgba(80,80,80,0.6)'; for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(x - 20 + k * 20, 380 - P.err * 60, 12, 0, 7); g.fill(); } }
      g.fillStyle = 'rgba(0,0,0,0.3)'; MGH.rr(g, x - 100, 470, 200, 14, 7); g.fill(); g.fillStyle = p.color; MGH.rr(g, x - 100, 470, 200 * fill, 14, 7); g.fill();
      Char.draw(g, x, 590, 36, p.el.id, p.color, { mood: MGH.persona(P.done ? 'cheer' : P.err > 0 ? 'hurt' : 'effort', p.el.id), seed: i * 1.7, look: { x: 0, y: -1 } });
      MGH.text(g, `${p.name}  ${S.pts[i]}`, x, 680, 20, p.color, 'center', 'bold');
      if (P.done) { const k = S.order.indexOf(i); MGH.label(g, ['1st +3', '2nd +2', '3rd +1'][k] || 'done', x, 360, 20, '#a8503a'); }
    }
  },
});
