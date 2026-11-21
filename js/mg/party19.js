'use strict';
// Party batch 14: Color Camo, Firework Finale, Trapdoor Trouble (1v3), Log Roll, Treasure Auction, Balloon Bumpers

// ======================================================================== COLOR CAMO (match your chameleon to its leaf)
MG.def({
  id: 'camo', name: 'Color Camo', type: 'Reaction', controls: 'A B X Y', dur: 40, noPadSkip: true,
  rows: [['abxy', 'Change colour: Y yellow · B red · A green · X blue']],
  how: 'Your chameleon hops from leaf to leaf, and every leaf is a different colour. Press the button of the leaf\'s colour to blend in — Y yellow, B red, A green, X blue. Every moment you match, you earn camo points. When the hungry bird swoops past, anyone NOT matching gets pecked and loses points!',
  wins: 'Most camo points.',
  init(m, S) { S.p = [0, 1, 2, 3].map(() => ({ col: R.int(0, 3), leaf: R.int(0, 3), hop: R.range(1, 2.4), pts: 0, peck: 0, react: R.range(0.25, 0.6), w: 0 })); S.bird = { t: R.range(5, 8), x: -200, on: false }; },
  update(m, S, dt) {
    S.bird.t -= dt; if (S.bird.t <= 0 && !S.bird.on) { S.bird.on = true; S.bird.x = -200; Sfx.tone(900, 0.3, 'sawtooth', 0.04, -400); }
    if (S.bird.on) { S.bird.x += 900 * dt; S.p.forEach((P, i) => { const x = 160 + i * 320; if (Math.abs(S.bird.x - x) < 30 && !P.pecked && P.col !== P.leaf) { P.pecked = true; P.peck = 1; P.pts = Math.max(0, P.pts - 15); Sfx.bad(); } }); if (S.bird.x > 1500) { S.bird.on = false; S.bird.t = R.range(4, 7); S.p.forEach(P => { P.pecked = false; }); } }
    S.p.forEach((P, i) => {
      P.peck -= dt; P.hop -= dt; if (P.hop <= 0) { P.hop = R.range(1.0, 2.6) - Math.min(0.6, m.t * 0.012); let n; do n = R.int(0, 3); while (n === P.leaf); P.leaf = n; P.hopT = 0.25; }
      P.hopT = Math.max(0, (P.hopT || 0) - dt);
      const d = abxyPress(m, i); if (d >= 0) { P.col = d; Sfx.tone(600 + d * 100, 0.03, 'sine', 0.02); }
      if (P.col === P.leaf) P.pts += dt * 4;
    });
  },
  bot(m, S, i, dt) { const P = S.p[i]; abxyBot(m, i, -1); if (P.col === P.leaf) { P.w = 0; return; } P.w += dt; if (P.w > P.react) { abxyBot(m, i, Math.random() < 0.9 ? P.leaf : R.int(0, 3)); P.w = 0; P.react = R.range(0.2, 0.7); } },
  score(m, S) { return S.p.map(P => Math.round(P.pts)); },
  fmt(s) { return `${s} pts`; },
  hud(m, S, i) { return `🦎 ${Math.round(S.p[i].pts)}`; },
  draw(m, S, g) {
    MGH.scene(g, 'forest', m.t);
    for (let i = 0; i < 4; i++) {
      const P = S.p[i], p = m.players[i], x = 160 + i * 320, y = 430, lc = ABXY_KEY[P.leaf][1], cc = ABXY_KEY[P.col][1];
      g.strokeStyle = '#4a3a1a'; g.lineWidth = 10; g.beginPath(); g.moveTo(x - 140, 520); g.quadraticCurveTo(x, 470, x + 140, 520); g.stroke();
      g.fillStyle = lc; g.beginPath(); g.ellipse(x, y + 40, 100, 34, -0.1, 0, 7); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 90, y + 44); g.lineTo(x + 90, y + 36); g.stroke();
      const hop = P.hopT > 0 ? Math.sin(P.hopT / 0.25 * Math.PI) * 30 : 0, match = P.col === P.leaf;
      g.save(); g.translate(x, y + 10 - hop); if (match) g.globalAlpha = 0.55;
      g.fillStyle = cc; g.beginPath(); g.ellipse(0, 0, 46, 22, 0, 0, 7); g.fill(); g.beginPath(); g.arc(44, -8, 18, 0, 7); g.fill();
      g.strokeStyle = cc; g.lineWidth = 8; g.beginPath(); g.moveTo(-44, 4); g.quadraticCurveTo(-80, 10, -70, -16); g.arc(-62, -16, 8, Math.PI, Math.PI * 2.6); g.stroke();
      g.globalAlpha = 1; g.fillStyle = '#fff'; g.beginPath(); g.arc(50, -14, 8, 0, 7); g.fill(); g.fillStyle = '#222'; g.beginPath(); g.arc(52, -14, 4, 0, 7); g.fill();
      g.restore();
      if (P.peck > 0) MGH.text(g, 'PECK! −15', x, y - 60, 20, '#ff6b6b', 'center', 'bold');
      Char.draw(g, x, 620, 22, p.el.id, p.color, { headOnly: true, mood: MGH.persona(P.peck > 0 ? 'hurt' : match ? 'smug' : 'nervous', p.el.id), seed: i * 1.7 });
      MGH.text(g, `${p.name}  ${Math.round(P.pts)}`, x, 680, 18, p.color, 'center', 'bold');
      abxyBadge(g, P.leaf, x + 90, y - 10, 13);
    }
    if (S.bird.on) { const bx = S.bird.x, by = 330 + Math.sin(bx * 0.01) * 30; g.fillStyle = '#3a3a5a'; g.beginPath(); g.ellipse(bx, by, 40, 20, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(bx - 10, by); g.lineTo(bx - 40, by - 40 * Math.sin(m.t * 20)); g.lineTo(bx + 20, by); g.fill(); g.fillStyle = '#ffb13d'; g.beginPath(); g.moveTo(bx + 38, by - 4); g.lineTo(bx + 60, by); g.lineTo(bx + 38, by + 4); g.fill(); } else if (S.bird.t < 1.2) MGH.label(g, 'The bird is coming…', 640, 120, 24, '#ffe680');
  },
});

// ======================================================================== FIREWORK FINALE (button rhythm: launch on the line)
MG.def({
  id: 'fireworks', name: 'Firework Finale', type: 'Rhythm', controls: 'A B X Y', dur: 0, noPadSkip: true,
  rows: [['abxy', 'Light the rocket of that colour on the line']],
  how: 'Rockets rise up your launch rack in four colours. When a rocket crosses the glowing fuse line, press its button — Y yellow, B red, A green, X blue — to light it and fire it into the sky! Perfect timing makes the biggest bursts. Keep a streak going for bonus points.',
  wins: 'Highest score.',
  init(m, S) { S.notes = []; let t = 2, gap = 0.6; while (t < 36) { S.notes.push({ t, d: R.int(0, 3) }); if (Math.random() < 0.15) S.notes.push({ t, d: (S.notes[S.notes.length - 1].d + 2) % 4 }); t += gap * R.pick([1, 1, 0.5, 1.5]); if (t > 22) gap = 0.48; } S.end = t + 2; S.p = [0, 1, 2, 3].map(() => ({ pts: 0, streak: 0, hit: new Set(), fx: '', fxT: 0, bursts: [], err: R.range(0.02, 0.08) })); },
  LINE: 230, SPD: 260,
  update(m, S, dt) {
    const t = m.t;
    S.p.forEach((P, i) => {
      P.fxT -= dt; P.bursts.forEach(b => { b.t += dt; }); P.bursts = P.bursts.filter(b => b.t < 1.2);
      const d = abxyPress(m, i);
      if (d >= 0) { const n = S.notes.findIndex((q, j) => q.d === d && !P.hit.has(j) && Math.abs(q.t - t) < 0.17); if (n < 0) { P.streak = 0; P.fx = 'fizzle'; P.fxT = 0.4; } else { P.hit.add(n); const perf = Math.abs(S.notes[n].t - t) < 0.07; P.streak++; P.pts += (perf ? 3 : 1) + Math.floor(P.streak / 8); P.fx = perf ? 'PERFECT' : 'good'; P.fxT = 0.4; P.bursts.push({ x: 60 + i * 320 + 50 + d * 50, y: R.range(80, 160), c: ABXY_KEY[d][1], t: 0, big: perf }); Sfx.tone(700 + d * 120, 0.05, 'triangle', 0.03); } }
      S.notes.forEach((q, j) => { if (!P.hit.has(j) && t - q.t > 0.17 && !q['m' + i]) { q['m' + i] = true; P.streak = 0; } });
    });
    if (t > S.end) m.finish(this.score(m, S));
  },
  bot(m, S, i) { const P = S.p[i]; abxyBot(m, i, -1); S.notes.forEach((q, j) => { if (!P.hit.has(j) && !q['b' + i] && m.t >= q.t - P.err) { q['b' + i] = true; if (Math.random() < 0.88) abxyBot(m, i, q.d); P.err = R.range(-0.03, 0.1); } }); },
  score(m, S) { return S.p.map(P => P.pts); },
  fmt(s) { return `${s} pts`; },
  hud(m, S, i) { return `${S.p[i].pts}` + (S.p[i].streak > 4 ? ` · ${S.p[i].streak}🔥` : ''); },
  draw(m, S, g) {
    g.fillStyle = MGH.grad(g, 0, 720, ['#05051a', '#1a1040']); g.fillRect(0, 0, 1280, 720); MGH.stars(g, m.t, 80, 500);
    const t = m.t;
    for (let i = 0; i < 4; i++) {
      const P = S.p[i], p = m.players[i], ox = 60 + i * 320;
      P.bursts.forEach(b => { const k = b.t / 1.2, r = (b.big ? 90 : 60) * Math.min(1, k * 2); for (let a = 0; a < 14; a++) { const an = a / 14 * Math.PI * 2; g.fillStyle = b.c; g.globalAlpha = 1 - k; g.beginPath(); g.arc(b.x + Math.cos(an) * r, b.y + Math.sin(an) * r + k * 30, 4, 0, 7); g.fill(); } g.globalAlpha = 1; });
      g.fillStyle = 'rgba(255,255,255,0.06)'; MGH.rr(g, ox, 200, 220, 470, 14); g.fill();
      g.fillStyle = 'rgba(255,200,80,0.5)'; g.fillRect(ox, this.LINE - 3, 220, 6); MGH.glow(g, ox + 110, this.LINE, 80, 'rgba(255,200,80,0.2)');
      [3, 0, 2, 1].forEach((d, k) => abxyBadge(g, d, ox + 35 + k * 50, 690, 13));
      S.notes.forEach((q, j) => { if (P.hit.has(j)) return; const y = this.LINE + (q.t - t) * this.SPD; if (y < 200 || y > 680) return; const col = [1, 3, 2, 0].indexOf(q.d); const x = ox + 35 + [3, 0, 2, 1].indexOf(q.d) * 50; g.fillStyle = ABXY_KEY[q.d][1]; g.beginPath(); g.moveTo(x, y - 18); g.lineTo(x + 10, y + 6); g.lineTo(x - 10, y + 6); g.closePath(); g.fill(); g.fillRect(x - 6, y + 6, 12, 14); g.fillStyle = '#ffb13d'; g.beginPath(); g.arc(x, y + 24, 4 + Math.sin(t * 30) * 1.5, 0, 7); g.fill(); });
      if (P.fxT > 0) MGH.text(g, P.fx, ox + 110, 260, 18, P.fx === 'PERFECT' ? '#ffe680' : P.fx === 'good' ? '#9fffa0' : '#ff9a9a', 'center', 'bold');
      Char.draw(g, ox + 110, 640, 20, p.el.id, p.color, { headOnly: true, mood: MGH.persona(P.streak > 8 ? 'cheer' : 'determined', p.el.id), seed: i * 1.7 });
      MGH.text(g, `${p.name}  ${P.pts}`, ox + 110, 190, 18, p.color, 'center', 'bold');
    }
  },
});

// ======================================================================== TRAPDOOR TROUBLE (1 vs 3)
MG.def({
  id: 'trapdoor', name: 'Trapdoor Trouble', type: 'Arena', mode: '1v3', controls: 'Move + button', dur: 45,
  rows: [['stick', 'Runners: move'], ['abxy', 'Trapper: open a trapdoor (Y B A X)']],
  how: 'The castle hall has four big trapdoor zones, one per button: TOP = Y, RIGHT = B, BOTTOM = A, LEFT = X. RUNNERS grab gems scattered around the hall — collect 25 between you to win! The TRAPPER presses a button to open that trapdoor: it creaks and wobbles for a second (runners, get off!) then drops — anyone on it falls to the dungeon for a few seconds and loses a gem. Each trapdoor needs a rest after it opens.',
  wins: 'Runners: 25 gems. Trapper: stop them!',
  Z: [[440, 160, 400, 170], [860, 260, 300, 300], [440, 470, 400, 170], [120, 260, 300, 300]],
  init(m, S) { S.trap = m.players.findIndex((p, i) => m.teamOf(i) === 0); S.z = [0, 1, 2, 3].map(() => ({ st: 'shut', t: 0, cd: 0 })); S.b = [0, 1, 2, 3].map(i => Object.assign(MGH.body(640 + (i % 2 ? 60 : -60), 400 + (i < 2 ? -40 : 40), 20), { fall: 0, gems: 0 })); S.gems = []; for (let k = 0; k < 6; k++) S.gems.push(this.gem()); S.tot = 0; S.win = -1; },
  gem() { return { x: R.range(150, 1130), y: R.range(180, 620) }; },
  inZ(x, y, k) { const [zx, zy, w, h] = this.Z[k]; return x > zx && x < zx + w && y > zy && y < zy + h; },
  update(m, S, dt) {
    const d = abxyPress(m, S.trap); if (d >= 0 && S.z[d].st === 'shut' && S.z[d].cd <= 0) { S.z[d].st = 'warn'; S.z[d].t = 1.0; Sfx.tone(160, 0.6, 'sawtooth', 0.04, 40); }
    S.z.forEach((z, k) => { z.cd -= dt; z.t -= dt; if (z.st === 'warn' && z.t <= 0) { z.st = 'open'; z.t = 1.2; Sfx.thud(); S.b.forEach((b, i) => { if (i !== S.trap && b.fall <= 0 && this.inZ(b.x, b.y, k)) { b.fall = 2.5; if (b.gems > 0) { b.gems--; S.tot--; } Sfx.bad(); } }); } else if (z.st === 'open' && z.t <= 0) { z.st = 'shut'; z.cd = 2.5; } });
    S.b.forEach((b, i) => {
      if (i === S.trap) return; b.fall -= dt; if (b.fall > 0) { b.vx = b.vy = 0; if (b.fall < 0.1) { b.x = 640; b.y = 400; } return; }
      const a = m.axis(i); MGH.steer(b, a.x, a.y, dt, 2000, 270, 7); MGH.integrate(b, dt, 110, 150, 1170, 650);
      S.gems.forEach(gm => { if (!gm.got && dist(gm.x, gm.y, b.x, b.y) < 28) { gm.got = true; b.gems++; S.tot++; Sfx.coin(); } });
    });
    S.gems = S.gems.filter(gm => !gm.got); while (S.gems.length < 6) S.gems.push(this.gem());
    if (S.tot >= 25) { S.win = 1; m.finish(this.score(m, S)); }
  },
  bot(m, S, i) {
    if (i === S.trap) { abxyBot(m, i, -1); const best = [0, 1, 2, 3].map(k => ({ k, n: S.b.filter((b, j) => j !== S.trap && b.fall <= 0 && this.inZ(b.x + b.vx * 0.6, b.y + b.vy * 0.6, k)).length })).filter(o => S.z[o.k].st === 'shut' && S.z[o.k].cd <= 0).sort((a, b) => b.n - a.n)[0]; if (best && best.n > 0 && Math.random() < 0.05) abxyBot(m, i, best.k); return; }
    const b = S.b[i], v = m.vin[i]; if (b.fall > 0) return;
    const danger = S.z.findIndex((z, k) => z.st !== 'shut' && this.inZ(b.x, b.y, k) && (z.st === 'open' || z.t < 1));
    if (danger >= 0) { const [zx, zy, w, h] = this.Z[danger]; MGH.aim(m, i, 640, 400, b, 4); return; }
    const gm = S.gems.filter(gm => !S.z.some((z, k) => z.st !== 'shut' && this.inZ(gm.x, gm.y, k))).sort((p, q) => dist(p.x, p.y, b.x, b.y) - dist(q.x, q.y, b.x, b.y))[0] || S.gems[0];
    MGH.aim(m, i, gm.x, gm.y, b, 6);
  },
  score(m, S) { const rw = S.win === 1; return m.players.map((p, i) => (i === S.trap) !== rw ? 1 : 0); },
  fmt(s) { return s ? 'WIN' : '—'; },
  hud(m, S, i) { return i === S.trap ? '🕳️ TRAPPER' : `💎 ${S.tot}/25`; },
  draw(m, S, g) {
    g.fillStyle = '#2a2030'; g.fillRect(0, 0, 1280, 720);
    g.fillStyle = MGH.grad(g, 150, 650, ['#6a5a6a', '#5a4a5a']); g.fillRect(110, 150, 1060, 500);
    for (let x = 110; x < 1170; x += 60) for (let y = 150; y < 650; y += 50) { g.strokeStyle = 'rgba(0,0,0,0.15)'; g.strokeRect(x, y, 60, 50); }
    this.Z.forEach(([zx, zy, w, h], k) => {
      const z = S.z[k], wob = z.st === 'warn' ? Math.sin(m.t * 40) * 3 : 0;
      if (z.st === 'open') { g.fillStyle = '#05050a'; g.fillRect(zx, zy, w, h); g.fillStyle = 'rgba(120,60,200,0.25)'; g.fillRect(zx, zy, w, h); }
      else { g.fillStyle = z.st === 'warn' ? '#8a5a3a' : '#7a5a3a'; g.fillRect(zx + wob, zy, w, h); g.strokeStyle = '#4a3020'; g.lineWidth = 4; g.strokeRect(zx + wob, zy, w, h); for (let x = zx + 30; x < zx + w; x += 40) { g.fillStyle = 'rgba(0,0,0,0.15)'; g.fillRect(x + wob, zy, 4, h); } if (z.st === 'warn') { g.fillStyle = `rgba(255,60,40,${0.2 + 0.2 * Math.sin(m.t * 20)})`; g.fillRect(zx, zy, w, h); } }
      abxyBadge(g, k, zx + w / 2, zy + h / 2, 18); if (z.cd > 0 && z.st === 'shut') { g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(zx, zy, w, h); }
    });
    S.gems.forEach(gm => MGH.gem(g, gm.x, gm.y, 12, '#ff6bc8', m.t));
    S.b.forEach((b, i) => { if (i === S.trap) return; if (b.fall > 0) return; MGH.drawBody(g, b, m.players[i], '', 'determined'); });
    const tp = m.players[S.trap]; Char.draw(g, 640, 90, 30, tp.el.id, tp.color, { mood: MGH.persona('evil', tp.el.id), seed: S.trap, hands: { n: { x: -0.8, y: -1.2, d: -120, o: true, m: true }, f: { x: 0.8, y: -1.2, d: -60, o: true, m: false } } });
    MGH.text(g, `💎 ${S.tot} / 25`, 1100, 100, 26, '#ff9ad8', 'center', 'bold');
    S.b.forEach((b, i) => { if (i !== S.trap && b.fall > 0) MGH.text(g, `${m.players[i].name}: in the dungeon!`, 200, 100 + i * 20, 14, m.players[i].color, 'center', 'bold'); });
  },
});

// ======================================================================== LOG ROLL (keep your footing on a spinning log)
MG.def({
  id: 'logroll', name: 'Log Roll', type: 'Balance', controls: 'Move', dur: 0,
  rows: [['lr', 'Run against the spin']],
  how: 'Each lumberjack balances on a log spinning in the river. The log keeps changing which way it rolls and how fast — run the OTHER way (LEFT or RIGHT) to stay on top! The more you drift off the top, the harder it is to recover. Slip off and you\'re in the water. Last one standing wins!',
  wins: 'Last one on their log.',
  init(m, S) { S.p = [0, 1, 2, 3].map(() => ({ pos: 0, v: 0, spin: 0, target: R.range(-1, 1), tt: R.range(1, 2), out: 0, sk: R.range(0.75, 1) })); S.order = []; },
  update(m, S, dt) {
    const k = 1 + m.t * 0.03;
    S.p.forEach((P, i) => {
      if (P.out) return;
      P.tt -= dt; if (P.tt <= 0) { P.target = R.range(-1.4, 1.4) * Math.min(2, k); P.tt = R.range(0.8, 2.2) / Math.min(1.8, k); }
      P.spin += (P.target - P.spin) * 2.5 * dt;
      const ax = m.axis(i).x; P.v += (-P.spin * 1.6 + ax * 2.2 + P.pos * 1.8) * dt; P.v *= Math.exp(-2 * dt); P.pos += P.v * dt;
      if (Math.abs(P.pos) > 1) { P.out = m.t; S.order.push(i); Sfx.noise(0.5, 700, 0.08, 'lowpass'); MGH.burst(160 + i * 320, 520, ['#9fe0ff', '#fff'], 20, { speed: 240 }); }
    });
    if (S.p.filter(P => !P.out).length <= 1 || m.t > 90) m.finish(this.score(m, S));
  },
  bot(m, S, i) { const P = S.p[i], v = m.vin[i]; if (P.out) { v.ax = 0; return; } if (!P.rt || (P.rt -= 1 / 60) <= 0) { P.rt = R.range(0.04, 0.16); v.ax = clamp((P.spin * 0.75 - P.pos * 1.2 - P.v * 0.5) * P.sk + R.range(-0.15, 0.15), -1, 1); } },
  score(m, S) { return S.p.map((P, i) => P.out ? S.order.indexOf(i) + 1 : 10); },
  fmt(s) { return s >= 10 ? 'Still rolling!' : `out #${s}`; },
  hud(m, S, i) { return S.p[i].out ? 'splash!' : 'rolling'; },
  draw(m, S, g) {
    MGH.scene(g, 'forest', m.t);
    g.fillStyle = MGH.grad(g, 470, 720, ['#4aa0d8', '#2a70b0']); g.fillRect(0, 470, 1280, 250);
    for (let k = 0; k < 16; k++) { g.strokeStyle = 'rgba(255,255,255,0.3)'; g.lineWidth = 2; const y = 490 + (k % 6) * 36, x = ((k * 97 + m.t * 60) % 1400) - 60; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 40, y); g.stroke(); }
    S.p.forEach((P, i) => {
      const p = m.players[i], x = 160 + i * 320, y = 520, R0 = 46;
      g.save(); g.translate(x, y); g.fillStyle = '#8a5a30'; g.fillRect(-130, -R0, 260, R0 * 2); g.fillStyle = '#c8905a'; g.beginPath(); g.ellipse(130, 0, 14, R0, 0, 0, 7); g.fill();
      const rot = m.t * P.spin * 3; for (let k = 0; k < 6; k++) { const yy = Math.sin(rot + k) * R0; if (Math.cos(rot + k) > 0) { g.strokeStyle = 'rgba(60,30,10,0.4)'; g.lineWidth = 3; g.beginPath(); g.moveTo(-126, yy); g.lineTo(126, yy); g.stroke(); } }
      g.restore();
      MGH.text(g, P.spin > 0.2 ? '⟳' : P.spin < -0.2 ? '⟲' : '·', x + 150, y - 20, 26, '#fff', 'center', 'bold');
      if (!P.out) { const a = P.pos * 1.3, cx = x + Math.sin(a) * 20, cy = y - R0 - 28 + (1 - Math.cos(a)) * 30; g.save(); g.translate(cx, cy); g.rotate(a * 0.8); Char.draw(g, 0, 0, 26, p.el.id, p.color, { mood: MGH.persona(Math.abs(P.pos) > 0.6 ? 'scared' : 'determined', p.el.id), seed: i * 1.7, look: { x: Math.sign(P.v), y: 0 }, walk: 1, t: m.t * 2, hands: { n: { x: -1.4, y: -0.4 + P.pos, d: 180, o: true, m: true }, f: { x: 1.4, y: -0.4 - P.pos, d: 0, o: true, m: false } } }); g.restore(); g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(x - 50, 410, 100, 8); g.fillStyle = Math.abs(P.pos) > 0.6 ? '#ff6b6b' : '#7cf06a'; g.fillRect(x - 3 + P.pos * 48, 406, 6, 16); }
      else { Char.draw(g, x, 600, 18, p.el.id, p.color, { headOnly: true, mood: 'sad', seed: i * 1.7 }); }
      MGH.text(g, p.name, x, 700, 18, p.color, 'center', 'bold');
    });
  },
});

// ======================================================================== TREASURE AUCTION (secret bids with A B X Y)
MG.def({
  id: 'auction', name: 'Treasure Auction', type: 'Strategy', controls: 'A B X Y', dur: 0, noPadSkip: true,
  rows: [['abxy', 'Bid: A = 1 · X = 2 · B = 3 · Y = 4 coins']],
  how: 'You start with 12 coins. Each round a treasure goes up for auction, worth 1 to 6 points. Everyone bids secretly: A = 1 coin, X = 2, B = 3, Y = 4 (you can\'t bid more than you have — no coins means you pass). The highest bid wins the treasure and PAYS; if the top bid is tied, whoever bid FIRST wins it — so be quick if you mean it! Eight treasures — spend wisely.',
  wins: 'Most treasure points.',
  BID: [4, 3, 1, 2], // Y B A X
  init(m, S) { S.coins = [12, 12, 12, 12]; S.pts = [0, 0, 0, 0]; S.round = 0; S.tr = R.shuffle([1, 2, 3, 4, 5, 6, R.int(2, 5), R.int(1, 6)]); this.next(S); },
  next(S) { S.round++; S.val = S.tr[S.round - 1]; S.pick = [-1, -1, -1, -1]; S.when = [9, 9, 9, 9]; S.ph = 'bid'; S.pt = 0; S.win = -1; S.bAt = [0, 1, 2, 3].map(() => R.range(0.8, 2.5)); },
  update(m, S, dt) {
    S.pt += dt;
    if (S.ph === 'bid') {
      m.players.forEach((p, i) => { if (S.pick[i] >= 0 || S.coins[i] <= 0) return; const d = abxyPress(m, i); if (d >= 0 && this.BID[d] <= S.coins[i]) { S.pick[i] = d; S.when[i] = S.pt; Sfx.click(); } else if (d >= 0) Sfx.bad(); });
      if (S.pick.every((p, i) => p >= 0 || S.coins[i] <= 0) || S.pt > 8) {
        S.bids = S.pick.map((d, i) => d >= 0 ? this.BID[d] : 0); const top = Math.max(...S.bids), who = [0, 1, 2, 3].filter(i => S.bids[i] === top && top > 0);
        if (who.length) { S.win = who.sort((a, b) => S.when[a] - S.when[b])[0]; S.coins[S.win] -= top; S.pts[S.win] += S.val; Sfx.coin(); } else Sfx.bad();
        S.ph = 'show'; S.pt = 0;
      }
      return;
    }
    if (S.pt > 3) { if (S.round >= 8) m.finish(S.pts.slice()); else this.next(S); }
  },
  bot(m, S, i) {
    if (S.ph !== 'bid' || S.pick[i] >= 0 || S.coins[i] <= 0 || S.pt < S.bAt[i]) { abxyBot(m, i, -1); return; }
    const left = 9 - S.round, budget = S.coins[i] / Math.max(1, left) * 1.6; if (!S.style) S.style = [0, 1, 2, 3].map(() => R.range(0.6, 1.5)); let want = clamp(Math.round(S.val / 6 * budget * 2 * S.style[i] + R.range(-1.5, 1.5)), 1, Math.min(4, S.coins[i]));
    abxyBot(m, i, this.BID.indexOf(want));
  },
  score(m, S) { return S.pts.map((p, i) => p + S.coins[i] * 0.01); },
  fmt(s) { return `${Math.floor(s)} pts`; },
  hud(m, S, i) { return `${S.pts[i]} pts · ${S.coins[i]}🪙` + (S.ph === 'bid' && S.pick[i] >= 0 ? ' ✔' : ''); },
  draw(m, S, g) {
    g.fillStyle = MGH.grad(g, 0, 720, ['#3a1a10', '#5a2a1a']); g.fillRect(0, 0, 1280, 720);
    for (let k = 0; k < 6; k++) { g.fillStyle = 'rgba(255,200,120,0.06)'; g.fillRect(100 + k * 200, 0, 80, 720); }
    Char.npc(g, 640, 160, 36, 'host', { mood: S.ph === 'show' ? 'happy' : 'shout', look: { x: 0, y: 0.4 } });
    MGH.label(g, `Treasure ${S.round} of 8`, 640, 64, 22, '#ffe680');
    g.fillStyle = '#8a5a2a'; g.fillRect(540, 230, 200, 26); g.fillStyle = '#a8703a'; MGH.rr(g, 560, 256, 160, 90, 10); g.fill(); g.fillStyle = '#ffd34d'; g.fillRect(560, 286, 160, 10); MGH.gem(g, 640, 236, 20, ['#5fd8ff', '#ff6bc8', '#7cf06a', '#ffd34d', '#c87aff', '#ff8a3d'][S.val - 1], m.t);
    MGH.text(g, `worth ${S.val} point${S.val > 1 ? 's' : ''}`, 640, 380, 28, '#ffe680', 'center', 'bold');
    [[2, 1], [3, 2], [1, 3], [0, 4]].forEach(([d, v], k) => { abxyBadge(g, d, 470 + k * 110, 440, 16); MGH.text(g, `${v} 🪙`, 470 + k * 110 + 40, 446, 18, '#fff', 'center', 'bold'); });
    m.players.forEach((p, i) => {
      const x = 160 + i * 320, y = 590;
      Char.draw(g, x, y, 34, p.el.id, p.color, { mood: S.ph === 'show' ? (S.win === i ? 'cheer' : 'neutral') : S.pick[i] >= 0 ? 'smug' : 'nervous', seed: i * 1.7, look: { x: 0, y: -1 } });
      MGH.text(g, `${p.name}  ${S.pts[i]} pts`, x, y + 64, 18, p.color, 'center', 'bold'); MGH.text(g, `${S.coins[i]} 🪙`, x, y + 88, 16, '#ffd34d', 'center', 'bold');
      if (S.ph === 'show') MGH.label(g, S.bids[i] ? `bid ${S.bids[i]}` : 'pass', x, y - 70, 18, S.win === i ? '#ffe680' : '#fff');
      else MGH.text(g, S.coins[i] <= 0 ? 'no coins' : S.pick[i] >= 0 ? '✔ bid placed' : 'thinking…', x, y - 70, 16, S.pick[i] >= 0 ? '#7f7' : '#ddd', 'center', 'bold');
    });
    if (S.ph === 'show') MGH.label(g, S.win >= 0 ? `${m.players[S.win].name} wins the treasure!` : 'Nobody bid!', 640, 500, 26, S.win >= 0 ? m.players[S.win].color : '#ff9a9a');
  },
});

// ======================================================================== BALLOON BUMPERS (pop the balloon on a rival's back)
MG.def({
  id: 'balloonbump', name: 'Balloon Bumpers', type: 'Arena', controls: 'Move + button', dur: 0,
  rows: [['stick', 'Drive'], ['a', 'Dash']],
  how: 'Everyone rides a bumper tub with three balloons tied to the back. Ram into a rival from BEHIND or the side to pop one of their balloons — a head-on bump just bounces! Press A for a dash. Lose all three balloons and you\'re out. Last tub with balloons wins!',
  wins: 'Last one with balloons.',
  init(m, S) { S.b = [0, 1, 2, 3].map(i => { const a = i * Math.PI / 2 + Math.PI / 4; return Object.assign(MGH.body(640 + Math.cos(a) * 260, 410 + Math.sin(a) * 200, 28), { h: a + Math.PI, bal: 3, inv: 0, cd: 0, dash: 0, out: 0 }); }); S.order = []; },
  update(m, S, dt) {
    S.b.forEach((b, i) => {
      if (b.out) return; b.inv -= dt; b.cd -= dt; b.dash -= dt;
      const a = m.axis(i), l = Math.hypot(a.x, a.y);
      if (l > 0.3) { const want = Math.atan2(a.y, a.x); b.h += clamp(((want - b.h + Math.PI * 3) % (Math.PI * 2)) - Math.PI, -4 * dt, 4 * dt); }
      const acc = b.dash > 0 ? 1600 : l > 0.3 ? 520 : 0; b.vx += Math.cos(b.h) * acc * dt; b.vy += Math.sin(b.h) * acc * dt; b.vx *= Math.exp(-2 * dt); b.vy *= Math.exp(-2 * dt);
      const sp = Math.hypot(b.vx, b.vy), mx = b.dash > 0 ? 520 : 280; if (sp > mx) { b.vx *= mx / sp; b.vy *= mx / sp; }
      if (m.pressed(i, 'a') && b.cd <= 0) { b.dash = 0.25; b.cd = 1.5; Sfx.whoosh(false); }
      MGH.integrate(b, dt, 70, 130, 1210, 690);
    });
    for (let x = 0; x < 4; x++) for (let y = x + 1; y < 4; y++) {
      const A = S.b[x], B = S.b[y]; if (A.out || B.out) continue; const dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy) || 1, mn = A.r + B.r; if (d >= mn) continue;
      const nx = dx / d, ny = dy / d, o = (mn - d) / 2; A.x -= nx * o; A.y -= ny * o; B.x += nx * o; B.y += ny * o;
      const hit = (att, tgt, ux, uy) => { // att rams tgt: the balloons are behind the target
        const sp = att.vx * ux + att.vy * uy; if (sp < 120 || tgt.inv > 0) return; const back = Math.cos(tgt.h) * ux + Math.sin(tgt.h) * uy; if (back > -0.2) { tgt.bal--; tgt.inv = 1; Sfx.pop(); MGH.burst(tgt.x - Math.cos(tgt.h) * 40, tgt.y - Math.sin(tgt.h) * 40, ['#ff6b8a', '#fff'], 14, { speed: 200 }); if (tgt.bal <= 0) { tgt.out = 1; S.order.push(S.b.indexOf(tgt)); } } };
      hit(A, B, nx, ny); hit(B, A, -nx, -ny);
      const rel = (B.vx - A.vx) * nx + (B.vy - A.vy) * ny; if (rel < 0) { A.vx += nx * rel * 1.1; A.vy += ny * rel * 1.1; B.vx -= nx * rel * 1.1; B.vy -= ny * rel * 1.1; Sfx.thud(); }
    }
    if (S.b.filter(b => !b.out).length <= 1 || m.t > 90) m.finish(this.score(m, S));
  },
  bot(m, S, i) {
    const b = S.b[i], v = m.vin[i]; v.a = false; if (b.out) return;
    if (b.tg === undefined || S.b[b.tg].out || b.tg === i || Math.random() < 0.006) { const o = [0, 1, 2, 3].filter(j => j !== i && !S.b[j].out); b.tg = R.pick(o); } const t = S.b[b.tg]; if (!t) return;
    if (Math.random() < 0.004) b.wan = R.range(0.4, 1); if (b.wan > 0) { b.wan -= 1 / 60; MGH.aim(m, i, 640 + Math.sin(m.t + i) * 400, 410 + Math.cos(m.t * 1.3 + i) * 200, b, 4); return; }
    // circle round to the target's back
    const bx = t.x - Math.cos(t.h) * 70, by = t.y - Math.sin(t.h) * 70; const d = dist(bx, by, b.x, b.y);
    if (d > 60) MGH.aim(m, i, bx, by, b, 4); else MGH.aim(m, i, t.x, t.y, b, 4);
    if (d < 140 && b.cd <= 0 && Math.random() < 0.06) v.a = true;
  },
  score(m, S) { return S.b.map((b, i) => b.out ? S.order.indexOf(i) + 1 : 10 + b.bal); },
  fmt(s) { return s >= 10 ? `${s - 10} balloons left` : `out #${s}`; },
  hud(m, S, i) { return S.b[i].out ? 'out' : '🎈'.repeat(S.b[i].bal); },
  draw(m, S, g) {
    g.fillStyle = '#1a2a4a'; g.fillRect(0, 0, 1280, 720);
    g.fillStyle = MGH.grad(g, 130, 690, ['#e8e0d0', '#d0c8b8']); MGH.rr(g, 70, 130, 1140, 560, 40); g.fill(); g.strokeStyle = '#ffcf4a'; g.lineWidth = 10; g.stroke();
    for (let k = 0; k < 20; k++) { g.fillStyle = ['#ff6b8a', '#5ab8ff', '#ffe680', '#7cf06a'][k % 4]; g.beginPath(); g.arc(90 + k * 58, 120, 8, 0, 7); g.fill(); }
    S.b.forEach((b, i) => {
      if (b.out) return; const p = m.players[i]; if (b.inv > 0 && Math.floor(m.t * 12) % 2) return;
      for (let k = 0; k < b.bal; k++) { const a = b.h + Math.PI + (k - 1) * 0.5, bx = b.x + Math.cos(a) * 60, by = b.y + Math.sin(a) * 60 - 30; g.strokeStyle = '#999'; g.lineWidth = 1; g.beginPath(); g.moveTo(b.x - Math.cos(b.h) * 24, b.y - Math.sin(b.h) * 24); g.lineTo(bx, by + 14); g.stroke(); g.fillStyle = p.color; g.beginPath(); g.ellipse(bx, by, 13, 16, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.arc(bx - 4, by - 6, 3, 0, 7); g.fill(); }
      MGH.shadow(g, b.x, b.y + 16, 30, 0.3);
      g.save(); g.translate(b.x, b.y); g.rotate(b.h); g.fillStyle = '#444'; g.beginPath(); g.arc(0, 0, 30, 0, 7); g.fill(); g.fillStyle = p.color; g.beginPath(); g.arc(0, 0, 25, 0, 7); g.fill(); g.fillStyle = '#ddd'; g.fillRect(22, -10, 8, 20); if (b.dash > 0) { g.fillStyle = '#ffb13d'; g.beginPath(); g.moveTo(-30, -8); g.lineTo(-50, 0); g.lineTo(-30, 8); g.fill(); } g.restore();
      Char.draw(g, b.x, b.y - 10, 16, p.el.id, p.color, { headOnly: true, mood: MGH.persona(b.inv > 0 ? 'hurt' : b.dash > 0 ? 'determined' : 'happy', p.el.id), seed: i * 1.7, look: { x: Math.cos(b.h), y: Math.sin(b.h) } });
    });
  },
});
