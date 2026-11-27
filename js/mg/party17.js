'use strict';
// Party batch 12: Totem Tap, Paint Wars (2v2), Element Clash, Moon Hop, Rail Router, Statue Garden, Laser Vault

// ======================================================================== TOTEM TAP (press the colour of the bottom face)
MG.def({
  id: 'totem', name: 'Totem Tap', type: 'Reaction', controls: 'A B X Y', dur: 40, noPadSkip: true,
  rows: [['abxy', 'Press the colour of the bottom block']],
  how: 'Your totem pole is a stack of coloured faces. Press the button that matches the BOTTOM face to knock it out — Y yellow, B red, A green, X blue. The pole drops and the next face comes down. Wrong button and your hands are stunned for a moment. Most faces knocked out wins!',
  wins: 'Most faces knocked out.',
  init(m, S) { S.p = [0, 1, 2, 3].map(() => ({ st: Array.from({ length: 8 }, () => R.int(0, 3)), n: 0, stun: 0, hit: 0, bt: R.range(0.25, 0.45), acc: R.range(0.9, 0.97) })); },
  update(m, S, dt) {
    S.p.forEach((P, i) => {
      P.stun -= dt; P.hit = Math.max(0, P.hit - dt); if (P.stun > 0) return;
      const d = abxyPress(m, i); if (d < 0) return;
      if (d === P.st[0]) { P.st.shift(); P.st.push(R.int(0, 3)); P.n++; P.hit = 0.12; Sfx.tone(500 + (P.n % 8) * 60, 0.04, 'square', 0.03); }
      else { P.stun = 0.7; Sfx.bad(); }
    });
  },
  bot(m, S, i, dt) { const P = S.p[i]; abxyBot(m, i, -1); if (P.stun > 0) return; P.bt -= dt; if (P.bt > 0) return; P.bt = R.range(0.22, 0.42); abxyBot(m, i, Math.random() < P.acc ? P.st[0] : R.int(0, 3)); },
  score(m, S) { return S.p.map(P => P.n); },
  fmt(s) { return `${s} faces`; },
  hud(m, S, i) { return `${S.p[i].n}`; },
  draw(m, S, g) {
    MGH.scene(g, 'forest', m.t);
    for (let i = 0; i < 4; i++) {
      const P = S.p[i], p = m.players[i], x = 160 + i * 320;
      for (let k = P.st.length - 1; k >= 0; k--) {
        const y = 560 - k * 58 - (P.hit > 0 ? (P.hit / 0.12) * 58 : 0) + (k === 0 && P.hit > 0 ? 0 : 0), c = ABXY_KEY[P.st[k]][1];
        g.fillStyle = c; MGH.rr(g, x - 54, y - 26, 108, 52, 10); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 3; g.stroke();
        g.fillStyle = '#fff'; g.beginPath(); g.arc(x - 18, y - 6, 8, 0, 7); g.arc(x + 18, y - 6, 8, 0, 7); g.fill(); g.fillStyle = '#222'; g.beginPath(); g.arc(x - 18, y - 4, 4, 0, 7); g.arc(x + 18, y - 4, 4, 0, 7); g.fill();
        g.strokeStyle = '#222'; g.lineWidth = 3; g.beginPath(); g.arc(x, y + 8, 12, 0.2, Math.PI - 0.2); g.stroke();
        if (k === 0) { g.strokeStyle = '#fff'; g.lineWidth = 4; MGH.rr(g, x - 58, y - 30, 116, 60, 12); g.stroke(); abxyBadge(g, P.st[0], x + 78, y, 16); }
      }
      Char.draw(g, x - 90, 600, 26, p.el.id, p.color, { mood: MGH.persona(P.stun > 0 ? 'dizzy' : 'determined', p.el.id), seed: i * 1.7, look: { x: 1, y: 0 }, hands: P.hit > 0 ? { n: { x: 1.4, y: -0.6, d: 0, o: true, m: true }, f: { x: 0.6, y: 0.3, d: 90, o: true, m: false } } : undefined });
      g.fillStyle = '#6a4a2a'; g.fillRect(x - 60, 590, 120, 14);
      MGH.text(g, `${p.name}  ${P.n}`, x, 660, 20, p.color, 'center', 'bold');
    }
  },
});

// ======================================================================== PAINT WARS (2 vs 2 territory painting)
MG.def({
  id: 'paintwars', name: 'Paint Wars', type: 'Arena', mode: '2v2', controls: 'Move + button', dur: 45,
  rows: [['stick', 'Run and paint'], ['a', 'Paint splash (big blob)']],
  how: 'Run around the square to paint the floor tiles in your team\'s colour! Every tile you step on turns yours. Press A for a big SPLASH that paints a whole blob around you (it needs to refill). Bump into a rival to make them drop their paint brush for a moment. The team with the most tiles at the end wins!',
  wins: 'Team with the most tiles.',
  C: 32, GW: 36, GH: 18, OX: 64, OY: 120,
  init(m, S) { S.grid = new Array(this.GW * this.GH).fill(-1); const k = [0, 0]; S.b = m.players.map((p, i) => { const tm = m.teamOf(i), j = k[tm]++; return Object.assign(MGH.body(tm ? 1100 : 180, 250 + j * 300, 20), { tm, cd: 0, stun: 0 }); }); },
  paint(S, x, y, tm, r = 0) { const cx = Math.floor((x - this.OX) / this.C), cy = Math.floor((y - this.OY) / this.C); for (let dx = -r; dx <= r; dx++) for (let dy = -r; dy <= r; dy++) { if (dx * dx + dy * dy > r * r + 1) continue; const a = cx + dx, b = cy + dy; if (a >= 0 && b >= 0 && a < this.GW && b < this.GH) S.grid[b * this.GW + a] = tm; } },
  update(m, S, dt) {
    S.b.forEach((b, i) => {
      b.cd -= dt; b.stun -= dt; const a = m.axis(i);
      if (b.stun > 0) { b.vx *= 0.9; b.vy *= 0.9; } else MGH.steer(b, a.x, a.y, dt, 2000, 280, 7);
      MGH.integrate(b, dt, this.OX, this.OY, this.OX + this.GW * this.C, this.OY + this.GH * this.C);
      if (b.stun <= 0) this.paint(S, b.x, b.y, b.tm, 0);
      if (m.pressed(i, 'a') && b.cd <= 0 && b.stun <= 0) { b.cd = 3; this.paint(S, b.x, b.y, b.tm, 3); Sfx.noise(0.3, 900, 0.08, 'lowpass'); MGH.burst(b.x, b.y, [MG.TEAMC[b.tm], '#fff'], 16, { speed: 200 }); }
    });
    for (let x = 0; x < 4; x++) for (let y = x + 1; y < 4; y++) { const A = S.b[x], B = S.b[y]; if (A.tm === B.tm) continue; if (dist(A.x, A.y, B.x, B.y) < 40) { const fa = Math.hypot(A.vx, A.vy), fb = Math.hypot(B.vx, B.vy); if (fa > fb + 40 && B.stun <= 0) { B.stun = 1; Sfx.punch(); } else if (fb > fa + 40 && A.stun <= 0) { A.stun = 1; Sfx.punch(); } } }
    MGH.collide(S.b, 0.6);
  },
  bot(m, S, i) {
    const b = S.b[i], v = m.vin[i]; v.a = false;
    if (!b.goal || dist(b.goal.x, b.goal.y, b.x, b.y) < 30 || Math.random() < 0.01) { let best = null, bs = -1; for (let k = 0; k < 20; k++) { const a = R.int(0, this.GW - 1), c = R.int(0, this.GH - 1), own = S.grid[c * this.GW + a]; const sc = (own === b.tm ? 0 : own === -1 ? 1 : 1.6) - dist(this.OX + a * this.C, this.OY + c * this.C, b.x, b.y) / 900; if (sc > bs) { bs = sc; best = { x: this.OX + a * this.C + 16, y: this.OY + c * this.C + 16 }; } } b.goal = best; }
    MGH.aim(m, i, b.goal.x, b.goal.y, b, 8);
    if (b.cd <= 0) { let foe = 0; const cx = Math.floor((b.x - this.OX) / this.C), cy = Math.floor((b.y - this.OY) / this.C); for (let dx = -2; dx <= 2; dx++) for (let dy = -2; dy <= 2; dy++) { const a = cx + dx, c = cy + dy; if (a >= 0 && c >= 0 && a < this.GW && c < this.GH && S.grid[c * this.GW + a] !== b.tm) foe++; } if (foe > 12) v.a = true; }
  },
  score(m, S) { const c = [0, 0]; S.grid.forEach(t => { if (t >= 0) c[t]++; }); return m.players.map((p, i) => c[m.teamOf(i)]); },
  fmt(s) { return `${s} tiles`; },
  hud(m, S, i) { return MG.TEAMN[m.teamOf(i)]; },
  draw(m, S, g) {
    GX.blit(g, BG3.plaza(this.OX, this.OY, this.GW * this.C, this.GH * this.C));
    for (let y = 0; y < this.GH; y++) for (let x = 0; x < this.GW; x++) { const t = S.grid[y * this.GW + x]; if (t >= 0) { g.fillStyle = MG.TEAMC[t]; g.globalAlpha = 0.75; g.fillRect(this.OX + x * this.C, this.OY + y * this.C, this.C, this.C); g.globalAlpha = 1; } }
    g.strokeStyle = 'rgba(0,0,0,0.05)'; g.lineWidth = 1; for (let x = 0; x <= this.GW; x++) { g.beginPath(); g.moveTo(this.OX + x * this.C, this.OY); g.lineTo(this.OX + x * this.C, this.OY + this.GH * this.C); g.stroke(); }
    const c = [0, 0]; S.grid.forEach(t => { if (t >= 0) c[t]++; }); const tot = this.GW * this.GH;
    g.fillStyle = MG.TEAMC[0]; g.fillRect(340, 64, 600 * c[0] / tot, 26); g.fillStyle = MG.TEAMC[1]; g.fillRect(940 - 600 * c[1] / tot, 64, 600 * c[1] / tot, 26); g.strokeStyle = '#fff'; g.lineWidth = 2; g.strokeRect(340, 64, 600, 26);
    MGH.text(g, `${Math.round(c[0] / tot * 100)}%`, 300, 84, 20, MG.TEAMC[0], 'center', 'bold'); MGH.text(g, `${Math.round(c[1] / tot * 100)}%`, 980, 84, 20, MG.TEAMC[1], 'center', 'bold');
    S.b.forEach((b, i) => { MGH.drawBody(g, b, m.players[i], '', b.stun > 0 ? 'dizzy' : 'happy'); if (b.cd > 0) { g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 3; g.beginPath(); g.arc(b.x, b.y + 30, 10, -Math.PI / 2, -Math.PI / 2 + (1 - b.cd / 3) * Math.PI * 2); g.stroke(); } });
  },
});

// ======================================================================== ELEMENT CLASH (secret picks in a cycle of four elements)
const ECL = [{ n: 'Fire', e: '🔥' }, { n: 'Water', e: '🌊' }, { n: 'Earth', e: '⛰️' }, { n: 'Air', e: '🌪️' }]; // each beats the one before it: Water>Fire, Earth>Water, Air>Earth, Fire>Air
MG.def({
  id: 'eclash', name: 'Element Clash', type: 'Bluff', controls: 'A B X Y', dur: 0, noPadSkip: true,
  rows: [['abxy', 'Y Fire · B Water · A Earth · X Air']],
  how: 'Everyone secretly picks an element: Y = FIRE, B = WATER, A = EARTH, X = AIR. Water douses Fire, Earth soaks up Water, Air wears down Earth, and Fire eats Air. You score a point for every player whose element yours beats — and lose one for every player who beats you. Elements across the circle (Fire–Earth, Water–Air) just bounce off. Eight rounds!',
  wins: 'Most points after eight rounds.',
  init(m, S) { S.pts = [0, 0, 0, 0]; S.round = 0; S.hist = []; this.next(S); },
  next(S) { S.round++; S.pick = [-1, -1, -1, -1]; S.ph = 'pick'; S.pt = 0; S.bAt = [0, 1, 2, 3].map(() => R.range(0.6, 2.6)); S.gain = [0, 0, 0, 0]; },
  beats(a, b) { return a === (b + 1) % 4; },
  update(m, S, dt) {
    S.pt += dt;
    if (S.ph === 'pick') {
      m.players.forEach((p, i) => { if (S.pick[i] >= 0) return; const d = abxyPress(m, i); if (d >= 0) { S.pick[i] = d; Sfx.click(); } });
      if (S.pick.every(p => p >= 0) || S.pt > 7) { S.pick = S.pick.map(p => p >= 0 ? p : R.int(0, 3)); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if (i !== j) { if (this.beats(S.pick[i], S.pick[j])) S.gain[i]++; if (this.beats(S.pick[j], S.pick[i])) S.gain[i]--; } S.gain.forEach((g, i) => { S.pts[i] += g; }); S.hist.push(S.pick.slice()); S.ph = 'show'; S.pt = 0; Sfx.boom(); }
      return;
    }
    if (S.pt > 3) { if (S.round >= 8) m.finish(S.pts.slice()); else this.next(S); }
  },
  bot(m, S, i) {
    if (S.ph !== 'pick' || S.pick[i] >= 0 || S.pt < S.bAt[i]) { abxyBot(m, i, -1); return; }
    // counter what was popular last round, with some randomness
    const last = S.hist[S.hist.length - 1]; let d = R.int(0, 3);
    if (last && Math.random() < 0.6) { const cnt = [0, 0, 0, 0]; last.forEach((e, j) => { if (j !== i) cnt[e]++; }); const pop = cnt.indexOf(Math.max(...cnt)); d = (pop + 1) % 4; }
    abxyBot(m, i, d);
  },
  score(m, S) { return S.pts.slice(); },
  fmt(s) { return `${s} pts`; },
  hud(m, S, i) { return `${S.pts[i]} pts` + (S.ph === 'pick' && S.pick[i] >= 0 ? ' ✔' : ''); },
  draw(m, S, g) {
    MGH.scene(g, 'temple', m.t);
    g.fillStyle = 'rgba(20,10,40,0.45)'; g.fillRect(0, 0, 1280, 720);
    MGH.label(g, `Round ${S.round} of 8`, 640, 70, 22, '#ffe680');
    ABXY_POS.forEach(([x, y], d) => { const yy = y + 40; g.fillStyle = 'rgba(0,0,0,0.45)'; g.beginPath(); g.arc(x, yy, 54, 0, 7); g.fill(); MGH.emoji(g, ECL[d].e, x, yy + 16, 50); abxyBadge(g, d, x + 44, yy - 44, 15); MGH.text(g, ECL[d].n, x, yy + 74, 16, '#fff', 'center', 'bold'); });
    // the beats-cycle arrows
    g.strokeStyle = 'rgba(255,230,120,0.5)'; g.lineWidth = 3; for (let d = 0; d < 4; d++) { const [x1, y1] = ABXY_POS[d], [x2, y2] = ABXY_POS[(d + 1) % 4]; const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 + 40; g.beginPath(); g.moveTo(mx + (x1 - mx) * 0.4, my + (y1 + 40 - my) * 0.4); g.lineTo(mx + (x2 - mx) * 0.4, my + (y2 + 40 - my) * 0.4); g.stroke(); }
    MGH.text(g, 'each one beats the one before it →', 640, 700, 14, 'rgba(255,255,255,0.6)', 'center');
    m.players.forEach((p, i) => {
      const x = 110 + (i % 2) * 1060, y = 230 + Math.floor(i / 2) * 300;
      Char.draw(g, x, y, 38, p.el.id, p.color, { mood: S.ph === 'pick' ? (S.pick[i] >= 0 ? 'smug' : 'nervous') : S.gain[i] > 0 ? 'cheer' : S.gain[i] < 0 ? 'hurt' : 'neutral', seed: i * 1.7, look: { x: x < 640 ? 1 : -1, y: 0 } });
      MGH.text(g, `${p.name}  ${S.pts[i]}`, x, y + 74, 20, p.color, 'center', 'bold');
      if (S.ph === 'show') { MGH.emoji(g, ECL[S.pick[i]].e, x + (x < 640 ? 70 : -70), y - 10, 44); MGH.label(g, S.gain[i] > 0 ? `+${S.gain[i]}` : `${S.gain[i]}`, x, y - 70, 20, S.gain[i] > 0 ? '#7cf06a' : S.gain[i] < 0 ? '#ff8a8a' : '#fff'); }
      else MGH.text(g, S.pick[i] >= 0 ? '✔ chosen' : 'choosing…', x, y - 70, 16, S.pick[i] >= 0 ? '#7f7' : '#ddd', 'center', 'bold');
    });
  },
});

// ======================================================================== MOON HOP (climb floating rocks as the lava rises)
MG.def({
  id: 'moonhop', name: 'Moon Hop', type: 'Survival', controls: 'Move + button', dur: 0,
  rows: [['lr', 'Move'], ['a', 'Jump (floaty moon jumps!)']],
  how: 'Low gravity! Hop upward from rock to rock with A (you float a long way) and steer with LEFT/RIGHT. The glowing goo is rising from below — fall into it and you\'re out. Some rocks crumble a moment after you land. Highest climber when the others are gone wins!',
  wins: 'Last one above the goo.',
  init(m, S) {
    S.rocks = [{ x: 640, y: 660, w: 900, solid: true }]; let y = 560, px = 640; while (y > -6000) { px = clamp(px + R.range(-200, 200), 180, 1100); S.rocks.push({ x: px, y, w: R.range(130, 190), crumble: Math.random() < 0.15, t: -1 }); if (Math.random() < 0.45) { const ox = clamp(px + R.pick([-1, 1]) * R.range(300, 500), 160, 1120); S.rocks.push({ x: ox, y: y + R.range(-10, 10), w: R.range(110, 160), crumble: Math.random() < 0.3, t: -1 }); } y -= R.range(85, 110); }
    S.p = [0, 1, 2, 3].map(i => ({ x: 340 + i * 200, y: 660, vx: 0, vy: 0, gr: true, out: 0, top: 660 })); S.goo = 760; S.cam = 0; S.order = [];
  },
  update(m, S, dt) {
    S.goo -= dt * Math.min(55, 10 + m.t * 0.9);
    S.p.forEach((P, i) => {
      if (P.out) return;
      P.vx += (m.axis(i).x * 280 - P.vx) * 6 * dt;
      if (P.gr && m.pressed(i, 'a')) { P.vy = -520; P.from = P.y; P.gr = false; Sfx.tone(500, 0.06, 'sine', 0.03, 300); }
      P.vy += 700 * dt; const py = P.y; P.x = clamp(P.x + P.vx * dt, 40, 1240); P.y += P.vy * dt; P.gr = false;
      if (P.vy >= 0) for (const r of S.rocks) { if (r.gone) continue; if (py <= r.y && P.y >= r.y && Math.abs(P.x - r.x) < r.w / 2) { P.y = r.y; P.vy = 0; P.gr = true; if (r.crumble && r.t < 0) r.t = 0; break; } }
      P.top = Math.min(P.top, P.y);
      if (P.y > S.goo) { P.out = m.t; S.order.push(i); Sfx.noise(0.4, 500, 0.08, 'lowpass'); }
    });
    S.rocks.forEach(r => { if (r.t >= 0) { r.t += dt; if (r.t > 1.4) r.gone = true; } });
    const alive = S.p.filter(P => !P.out); const lead = Math.min(...S.p.map(P => P.out ? 1e9 : P.y)); S.cam += ((Math.min(lead, S.goo - 200) - 380) - S.cam) * 2 * dt;
    if (alive.length <= 1 || m.t > 90) m.finish(this.score(m, S));
  },
  bot(m, S, i) {
    const P = S.p[i], v = m.vin[i]; v.a = false; v.ax = 0; if (P.out) return;
    if (P.gr) {
      const up = S.rocks.filter(r => !r.gone && r.y < P.y - 30 && r.y > P.y - 170 && !(r.crumble && r.t > 0.3)).sort((a, b) => Math.abs(a.x - P.x) - Math.abs(b.x - P.x))[0];
      if (!up) return; const dx = up.x - P.x; v.ax = Math.abs(dx) > 30 ? Math.sign(dx) : 0;
      if (Math.abs(dx) < 140) { P.wait = (P.wait === undefined ? R.range(0.05, 0.3) : P.wait) - 1 / 60; if (P.wait <= 0) { v.a = true; P.wait = undefined; } }
      return;
    }
    // airborne: pick the highest rock we can still drift onto before reaching it
    let best = null;
    for (const r of S.rocks) {
      if (r.gone || r.y <= P.y || r.y > (P.from || 700) + 2) continue;
      const dy = r.y - P.y, disc = P.vy * P.vy + 2 * 700 * dy, t = (-P.vy + Math.sqrt(Math.max(0, disc))) / 700;
      if (Math.abs(r.x - P.x) - r.w / 2 + 10 < 270 * t && (!best || r.y < best.y)) best = r;
    }
    if (best) v.ax = Math.abs(best.x - P.x) > 10 ? Math.sign(best.x - P.x) : 0;
  },
  score(m, S) { return S.p.map(P => P.out ? Math.round((660 - P.top) / 10) : 10000 + Math.round((660 - P.top) / 10)); },
  fmt(s) { return s >= 10000 ? `survived (${s - 10000} m)` : `${s} m`; },
  hud(m, S, i) { const P = S.p[i]; return P.out ? 'in the goo' : `${Math.round((660 - P.top) / 10)} m`; },
  draw(m, S, g) {
    const c = S.cam;
    GX.blit(g, BG3.moon());
    g.fillStyle = '#f4f0e0'; g.beginPath(); g.arc(1100, 140, 60, 0, 7); g.fill(); g.fillStyle = 'rgba(0,0,0,0.08)'; g.beginPath(); g.arc(1080, 130, 12, 0, 7); g.arc(1120, 160, 8, 0, 7); g.fill();
    S.rocks.forEach(r => { const y = r.y - c; if (y < -40 || y > 760 || r.gone) return; const sh = r.t > 0 ? Math.sin(m.t * 50) * 3 : 0; g.fillStyle = r.crumble ? '#8a7a9a' : '#9a9aaa'; MGH.rr(g, r.x - r.w / 2 + sh, y, r.w, r.solid ? 80 : 20, 8); g.fill(); g.fillStyle = 'rgba(255,255,255,0.15)'; g.fillRect(r.x - r.w / 2 + 6 + sh, y + 3, r.w - 12, 4); if (r.crumble) { g.strokeStyle = '#4a3a5a'; g.lineWidth = 2; g.beginPath(); g.moveTo(r.x - 20 + sh, y + 2); g.lineTo(r.x + sh, y + 14); g.lineTo(r.x + 20 + sh, y + 4); g.stroke(); } });
    const gy = S.goo - c; g.fillStyle = MGH.grad(g, gy, gy + 300, ['#7cf06a', '#3a9a3a']); g.beginPath(); g.moveTo(0, 720); for (let x = 0; x <= 1280; x += 40) g.lineTo(x, gy + Math.sin(x * 0.02 + m.t * 3) * 8); g.lineTo(1280, 720); g.fill(); MGH.glow(g, 640, gy, 500, 'rgba(120,255,120,0.25)');
    S.p.forEach((P, i) => { if (P.out) return; const p = m.players[i]; Char.draw(g, P.x, P.y - c - 30, 22, p.el.id, p.color, { mood: MGH.persona(S.goo - P.y < 120 ? 'scared' : P.gr ? 'happy' : 'cheer', p.el.id), seed: i * 1.7, look: { x: P.vx / 200, y: 0 } }); });
  },
});

// ======================================================================== RAIL ROUTER (switch the points to send trains home)
MG.def({
  id: 'rails', name: 'Rail Router', type: 'Reaction', controls: 'A & B buttons', dur: 45,
  rows: [['a', 'Flip the first switch'], ['b', 'Flip the second switch']],
  how: 'Toy trains roll onto your little railway, each painted to match one of your three stations. Flip the switches to route every train to its own colour: A flips the FIRST switch (top track or the lower branch), B flips the SECOND switch on the lower branch. Right station +1, wrong station −1!',
  wins: 'Most trains delivered.',
  COLS: ['#e84a4a', '#3fc35a', '#3f8ee8'],
  init(m, S) { S.p = [0, 1, 2, 3].map(() => ({ s1: 0, s2: 0, trains: [], sp: 0.5, pts: 0, fx: [], bt: 0 })); S.seq = []; let t = 1; while (t < 46) { S.seq.push({ t, c: R.int(0, 2) }); t += R.range(1.4, 2.2) - Math.min(0.6, t * 0.012); } },
  update(m, S, dt) {
    S.p.forEach((P, i) => {
      if (m.pressed(i, 'a')) { P.s1 ^= 1; Sfx.click(); } if (m.pressed(i, 'b')) { P.s2 ^= 1; Sfx.click(); }
      S.seq.forEach(q => { if (!q['s' + i] && m.t >= q.t) { q['s' + i] = true; P.trains.push({ d: 0, c: q.c, r1: -1, r2: -1 }); } });
      P.trains.forEach(T => {
        T.d += dt * 0.22;
        if (T.r1 < 0 && T.d >= 0.3) T.r1 = P.s1;
        if (T.r1 === 1 && T.r2 < 0 && T.d >= 0.6) T.r2 = P.s2;
        if (T.d >= 1 && !T.done) { T.done = true; const st = T.r1 === 0 ? 0 : 1 + T.r2; const ok = st === T.c; P.pts += ok ? 1 : -1; P.fx.push({ st, ok, t: 0 }); if (ok) Sfx.coin(); else Sfx.bad(); }
      });
      P.trains = P.trains.filter(T => !T.done); P.fx.forEach(f => { f.t += dt; }); P.fx = P.fx.filter(f => f.t < 0.8);
    });
  },
  bot(m, S, i, dt) {
    const P = S.p[i], v = m.vin[i]; v.a = v.b = false; P.bt -= dt; if (P.bt > 0) return;
    // look at the next train to reach each switch
    const n1 = P.trains.filter(T => T.r1 < 0).sort((a, b) => b.d - a.d)[0], n2 = P.trains.filter(T => T.r1 === 1 && T.r2 < 0).sort((a, b) => b.d - a.d)[0];
    const want1 = n1 ? (n1.c === 0 ? 0 : 1) : P.s1, want2 = n2 ? n2.c - 1 : n1 && n1.c > 0 ? n1.c - 1 : P.s2;
    P.bt = R.range(0.25, 0.7); if (Math.random() < 0.1) { if (Math.random() < 0.5) v.a = true; else v.b = true; return; } if (want1 !== P.s1) v.a = true; else if (want2 !== P.s2) v.b = true;
  },
  score(m, S) { return S.p.map(P => P.pts); },
  fmt(s) { return `${s} trains`; },
  hud(m, S, i) { return `🚂 ${S.p[i].pts}`; },
  // track geometry inside a 300x300 panel: start (0,150) → switch1 (90,150) → top branch to station 0 (300,50); lower branch → switch2 (190,220) → stations 1 (300,170) and 2 (300,280)
  posOn(T) {
    const d = T.d; if (d < 0.3) return [d / 0.3 * 90, 150];
    if (T.r1 === 0) { const k = (d - 0.3) / 0.7; return [90 + k * 210, 150 - Math.min(1, k * 2) * 100]; }
    if (d < 0.6) { const k = (d - 0.3) / 0.3; return [90 + k * 100, 150 + k * 70]; }
    const k = (d - 0.6) / 0.4; return [190 + k * 110, 220 + (T.r2 === 0 ? -50 : 60) * Math.min(1, k * 2)];
  },
  draw(m, S, g) {
    MGH.scene(g, 'meadow', m.t);
    for (let i = 0; i < 4; i++) {
      const P = S.p[i], p = m.players[i], ox = 20 + i * 318, oy = 180;
      g.fillStyle = 'rgba(255,255,255,0.35)'; MGH.rr(g, ox, oy - 20, 300, 340, 14); g.fill();
      g.strokeStyle = '#6a4a2a'; g.lineWidth = 6; const T_ = (pts) => { g.beginPath(); pts.forEach(([x, y], k) => k ? g.lineTo(ox + x, oy + y) : g.moveTo(ox + x, oy + y)); g.stroke(); };
      T_([[0, 150], [90, 150]]); g.globalAlpha = P.s1 === 0 ? 1 : 0.35; T_([[90, 150], [195, 50], [300, 50]]); g.globalAlpha = P.s1 === 1 ? 1 : 0.35; T_([[90, 150], [190, 220]]); g.globalAlpha = P.s1 === 1 && P.s2 === 0 ? 1 : 0.35; T_([[190, 220], [245, 170], [300, 170]]); g.globalAlpha = P.s1 === 1 && P.s2 === 1 ? 1 : 0.35; T_([[190, 220], [245, 280], [300, 280]]); g.globalAlpha = 1;
      [[90, 150, 'A', P.s1], [190, 220, 'B', P.s2]].forEach(([x, y, k, s]) => { g.fillStyle = k === 'A' ? '#3fc35a' : '#e8453c'; g.beginPath(); g.arc(ox + x, oy + y, 14, 0, 7); g.fill(); MGH.text(g, k, ox + x, oy + y + 5, 14, '#fff', 'center', 'bold'); });
      [[300, 50], [300, 170], [300, 280]].forEach(([x, y], k) => { g.fillStyle = this.COLS[k]; MGH.rr(g, ox + x - 26, oy + y - 22, 30, 44, 6); g.fill(); g.fillStyle = '#fff'; g.fillRect(ox + x - 20, oy + y - 14, 18, 10); const f = P.fx.find(f => f.st === k); if (f) MGH.text(g, f.ok ? '+1' : '−1', ox + x - 12, oy + y - 30 - f.t * 30, 18, f.ok ? '#3a9a3a' : '#c82a2a', 'center', 'bold'); });
      P.trains.forEach(T => { const [x, y] = this.posOn(T); g.fillStyle = this.COLS[T.c]; MGH.rr(g, ox + x - 14, oy + y - 12, 28, 18, 5); g.fill(); g.fillStyle = '#333'; g.beginPath(); g.arc(ox + x - 8, oy + y + 7, 4, 0, 7); g.arc(ox + x + 8, oy + y + 7, 4, 0, 7); g.fill(); g.fillStyle = '#ffe680'; g.fillRect(ox + x + 8, oy + y - 8, 4, 6); });
      Char.draw(g, ox + 40, oy + 240, 26, p.el.id, p.color, { mood: MGH.persona(P.fx.some(f => !f.ok) ? 'hurt' : P.fx.length ? 'cheer' : 'determined', p.el.id), seed: i * 1.7, look: { x: 1, y: -0.5 } });
      MGH.text(g, `${p.name}  ${P.pts}`, ox + 150, oy + 340, 18, p.color, 'center', 'bold');
    }
  },
});

// ======================================================================== STATUE GARDEN (move only while the gardener isn't looking)
MG.def({
  id: 'statues', name: 'Statue Garden', type: 'Race', controls: 'Move', dur: 0,
  rows: [['stick', 'Sneak forward (freeze when watched!)']],
  how: 'Sneak across the garden to touch the fountain — but the grumpy gardener keeps spinning round to look. While their back is turned, MOVE! When they start to turn (their hat wobbles) and look your way, FREEZE like a statue. Anyone caught moving is sent back to the gate. First to the fountain wins!',
  wins: 'First to the fountain.',
  init(m, S) { S.g = { st: 'away', t: R.range(1.2, 2.2) }; S.p = [0, 1, 2, 3].map(i => ({ x: 200 + i * 290, y: 660, vx: 0, vy: 0, fin: 0, sent: 0, react: R.range(0.15, 0.4) })); },
  update(m, S, dt) {
    const G = S.g; G.t -= dt;
    if (G.t <= 0) { if (G.st === 'away') { G.st = 'turn'; G.t = R.range(0.45, 0.8); Sfx.tone(300, 0.2, 'triangle', 0.04, 200); } else if (G.st === 'turn') { G.st = 'look'; G.t = R.range(1.4, 2.6); Sfx.tone(700, 0.1, 'square', 0.05); } else { G.st = 'away'; G.t = R.range(1.2, 3.2); } }
    S.p.forEach((P, i) => {
      if (P.fin) return; P.sent -= dt;
      const a = m.axis(i); P.vx = a.x * 115; P.vy = a.y * 115; P.x = clamp(P.x + P.vx * dt, 60, 1220); P.y = clamp(P.y + P.vy * dt, 170, 680);
      if (G.st === 'look' && Math.hypot(P.vx, P.vy) > 15 && P.sent <= 0) { P.x = 200 + i * 290; P.y = 660; P.sent = 1.2; Sfx.bad(); }
      if (dist(P.x, P.y, 640, 210) < 70) { P.fin = m.t; Sfx.coin(); }
    });
    if (S.p.some(P => P.fin) && S.p.filter(P => P.fin).length >= 1 && (S.p.every(P => P.fin) || m.t - Math.min(...S.p.filter(P => P.fin).map(P => P.fin)) > 3) || m.t > 60) m.finish(this.score(m, S));
  },
  bot(m, S, i) {
    const P = S.p[i], v = m.vin[i]; v.ax = v.ay = 0; if (P.fin) return;
    const G = S.g; P.lag = (P.lag || 0); if (G.st === 'away') P.lag = 0; else P.lag += 1 / 60;
    const moving = G.st === 'away' || (G.st === 'turn' && P.lag < P.react) || (G.st === 'look' && P.lag < P.react * 0.3 && Math.random() < 0.3);
    if (moving) { const dx = 640 - P.x, dy = 210 - P.y, l = Math.hypot(dx, dy) || 1; v.ax = dx / l; v.ay = dy / l; } if (G.st === 'away' && Math.random() < 0.01) P.react = R.range(0.1, 0.55);
  },
  score(m, S) { return S.p.map(P => P.fin ? 1000 - P.fin : 500 - dist(P.x, P.y, 640, 210)); },
  fmt(s) { return s > 600 ? `${(1000 - s).toFixed(1)}s` : `${Math.round(500 - s)} px away`; },
  hud(m, S, i) { const P = S.p[i]; return P.fin ? '⛲ made it!' : P.sent > 0 ? 'CAUGHT!' : ''; },
  draw(m, S, g) {
    MGH.scene(g, 'meadow', m.t);
    g.fillStyle = 'rgba(120,200,90,0.45)'; g.fillRect(0, 150, 1280, 570);
    for (const [x, y] of [[200, 330], [1080, 330], [420, 480], [860, 480]]) { g.fillStyle = '#3a8a3a'; g.beginPath(); g.arc(x, y, 40, 0, 7); g.fill(); g.fillStyle = '#ff8ab8'; for (let k = 0; k < 5; k++) { g.beginPath(); g.arc(x + Math.cos(k * 1.3) * 26, y + Math.sin(k * 1.3) * 22, 6, 0, 7); g.fill(); } }
    g.fillStyle = '#c8c8d8'; g.beginPath(); g.ellipse(640, 220, 80, 30, 0, 0, 7); g.fill(); g.fillStyle = '#7ac8ff'; g.beginPath(); g.ellipse(640, 216, 66, 22, 0, 0, 7); g.fill(); g.fillStyle = '#c8c8d8'; g.fillRect(632, 150, 16, 66); for (let k = 0; k < 6; k++) { g.fillStyle = 'rgba(160,220,255,0.7)'; g.beginPath(); g.arc(640 + Math.cos(k + m.t * 3) * 20, 150 + ((m.t * 60 + k * 10) % 60), 4, 0, 7); g.fill(); }
    const G = S.g, look = G.st === 'look', wob = G.st === 'turn' ? Math.sin(m.t * 40) * 0.15 : 0;
    g.save(); g.translate(640, 120); g.rotate(wob); Char.npc(g, 0, 0, 34, 'guard', { mood: look ? 'angry' : 'happy', look: { x: 0, y: look ? 1 : -1 }, hat: 'helmet' }); g.restore();
    if (look) { g.fillStyle = 'rgba(255,80,80,0.1)'; g.beginPath(); g.moveTo(640, 140); g.lineTo(0, 720); g.lineTo(1280, 720); g.fill(); MGH.label(g, 'FREEZE!', 640, 70, 30, '#ff6b6b'); } else if (G.st === 'turn') MGH.label(g, 'turning…', 640, 70, 24, '#ffb13d'); else MGH.label(g, 'GO GO GO!', 640, 70, 24, '#7cf06a');
    S.p.forEach((P, i) => { const p = m.players[i]; MGH.shadow(g, P.x, P.y + 4, 22, 0.25); Char.draw(g, P.x, P.y - 36, 26, p.el.id, p.color, { mood: MGH.persona(P.fin ? 'cheer' : P.sent > 0 ? 'hurt' : look ? 'nervous' : 'determined', p.el.id), seed: i * 1.7, look: { x: 0, y: -1 }, walk: Math.hypot(P.vx, P.vy) > 25 ? 1 : 0 }); });
  },
});

// ======================================================================== LASER VAULT (grab gems through sweeping lasers)
MG.def({
  id: 'laservault', name: 'Laser Vault', type: 'Survival', controls: 'Move', dur: 45,
  rows: [['stick', 'Sneak through the vault']],
  how: 'Break into the gem vault! Laser beams sweep, blink and slide across the floor. Sneak around them and grab the glowing gems (each one is a point). Touch a laser and the alarm zaps you back to the door, dropping one of your gems. The lasers get busier as time goes on!',
  wins: 'Most gems.',
  init(m, S) { S.L = [{ k: 'sweep', x: 640, y: 400, a: 0, sp: 0.6, len: 360 }, { k: 'slide', x: 300, y: 260, dir: 1, sp: 120, len: 260, vert: false }, { k: 'blink', x: 960, y: 520, t: 0, on: true, len: 300, a: 0.5 }, { k: 'slide', x: 960, y: 250, dir: -1, sp: 90, len: 200, vert: true }]; S.gems = []; for (let k = 0; k < 4; k++) S.gems.push(this.gem()); S.b = [0, 1, 2, 3].map(i => Object.assign(MGH.body(160 + i * 320, 680, 18), { pts: 0, zap: 0 })); },
  gem() { return { x: R.range(150, 1130), y: R.range(170, 600) }; },
  seg(l, t) {
    if (l.k === 'sweep') { const a = l.a; return [l.x - Math.cos(a) * l.len, l.y - Math.sin(a) * l.len, l.x + Math.cos(a) * l.len, l.y + Math.sin(a) * l.len]; }
    if (l.k === 'blink') return [l.x - Math.cos(l.a) * l.len / 2, l.y - Math.sin(l.a) * l.len / 2, l.x + Math.cos(l.a) * l.len / 2, l.y + Math.sin(l.a) * l.len / 2];
    return l.vert ? [l.x - l.len / 2, l.y, l.x + l.len / 2, l.y] : [l.x, l.y - l.len / 2, l.x, l.y + l.len / 2];
  },
  segD(px, py, [x1, y1, x2, y2]) { const dx = x2 - x1, dy = y2 - y1, t = clamp(((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy), 0, 1); return dist(px, py, x1 + dx * t, y1 + dy * t); },
  update(m, S, dt) {
    const k = 1 + m.t / 40;
    S.L.forEach(l => { if (l.k === 'sweep') l.a += l.sp * k * dt; if (l.k === 'slide') { if (l.vert) { l.y += l.dir * l.sp * k * dt; if (l.y < 170 || l.y > 640) l.dir *= -1; } else { l.x += l.dir * l.sp * k * dt; if (l.x < 120 || l.x > 1160) l.dir *= -1; } } if (l.k === 'blink') { l.t += dt; if (l.t > (l.on ? 1.6 : 1.2)) { l.t = 0; l.on = !l.on; if (l.on) { l.x = R.range(300, 980); l.y = R.range(220, 600); l.a = R.range(0, 3); } } } });
    S.b.forEach((b, i) => {
      b.zap -= dt; const a = m.axis(i); if (b.zap > 0) { b.vx = b.vy = 0; return; }
      MGH.steer(b, a.x, a.y, dt, 2000, 220, 8); MGH.integrate(b, dt, 60, 150, 1220, 700);
      for (const l of S.L) { if (l.k === 'blink' && (!l.on || l.t < 0.3)) continue; if (this.segD(b.x, b.y, this.seg(l)) < 14) { b.zap = 1; b.x = 160 + i * 320; b.y = 680; if (b.pts > 0) { b.pts--; S.gems.push({ x: R.range(150, 1130), y: R.range(170, 600) }); } Sfx.tone(140, 0.4, 'sawtooth', 0.05, -60); break; } }
      S.gems.forEach(gm => { if (!gm.got && dist(gm.x, gm.y, b.x, b.y) < 30) { gm.got = true; b.pts++; Sfx.coin(); } });
    });
    S.gems = S.gems.filter(gm => !gm.got); while (S.gems.length < 4) S.gems.push(this.gem());
  },
  bot(m, S, i) {
    const b = S.b[i], v = m.vin[i]; if (b.zap > 0) return;
    const gm = S.gems.sort((p, q) => dist(p.x, p.y, b.x, b.y) - dist(q.x, q.y, b.x, b.y))[0]; let dx = gm.x - b.x, dy = gm.y - b.y; const l0 = Math.hypot(dx, dy) || 1; dx /= l0; dy /= l0;
    // steer away from lasers that are close
    for (const l of S.L) { if (l.k === 'blink' && !l.on) continue; const s = this.seg(l), d = this.segD(b.x + dx * 30, b.y + dy * 30, s); if (d < 45) { const nx = -(s[3] - s[1]), ny = s[2] - s[0], nl = Math.hypot(nx, ny) || 1, side = ((b.x - s[0]) * nx + (b.y - s[1]) * ny) > 0 ? 1 : -1; dx += nx / nl * side * 1.5; dy += ny / nl * side * 1.5; } }
    if (!b.sk) b.sk = R.range(0.6, 1); const l = Math.hypot(dx, dy) || 1; v.ax = dx / l * b.sk; v.ay = dy / l * b.sk;
  },
  score(m, S) { return S.b.map(b => b.pts); },
  fmt(s) { return `${s} gems`; },
  hud(m, S, i) { return `💎 ${S.b[i].pts}`; },
  draw(m, S, g) {
    g.fillStyle = '#0e1220'; g.fillRect(0, 0, 1280, 720);
    for (let x = 60; x < 1220; x += 60) for (let y = 150; y < 700; y += 60) { g.fillStyle = Math.floor((x + y) / 60) % 2 ? '#161c30' : '#1a2238'; g.fillRect(x, y, 60, 60); }
    g.strokeStyle = '#3a4a6a'; g.lineWidth = 6; g.strokeRect(60, 150, 1160, 550);
    S.gems.forEach(gm => MGH.gem(g, gm.x, gm.y, 14, '#5fd8ff', m.t));
    g.save(); g.beginPath(); g.rect(60, 150, 1160, 550); g.clip();
    S.L.forEach(l => { if (l.k === 'blink' && !l.on) return; const [x1, y1, x2, y2] = this.seg(l), warn = l.k === 'blink' && l.t < 0.3; g.strokeStyle = warn ? 'rgba(255,80,80,0.3)' : 'rgba(255,40,60,0.9)'; g.lineWidth = warn ? 2 : 5; g.shadowColor = '#ff2a3a'; g.shadowBlur = warn ? 0 : 16; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); g.shadowBlur = 0; for (const [x, y] of [[x1, y1], [x2, y2]]) { g.fillStyle = '#5a5a6a'; g.beginPath(); g.arc(x, y, 7, 0, 7); g.fill(); } }); g.restore();
    S.b.forEach((b, i) => { if (b.zap > 0 && Math.floor(m.t * 12) % 2) return; MGH.drawBody(g, b, m.players[i], '', b.zap > 0 ? 'dizzy' : 'determined'); });
    m.players.forEach((p, i) => MGH.text(g, `${p.name}  💎${S.b[i].pts}`, 160 + i * 320, 130, 18, p.color, 'center', 'bold'));
  },
});
