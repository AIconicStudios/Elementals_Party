'use strict';
// Batch 15b: five more movement games — Puppy Fetch, Shady Spot, Sandcastle Rush, Magnet Mania, Glowbug Net

// ===================================================================== PUPPY FETCH (throw sticks, then call the puppy to you)
MG.def({
  id: 'fetch', name: 'Puppy Fetch', type: 'Arena', controls: 'Move + A & B', dur: 50,
  rows: [['stick', 'Run'], ['a', 'Throw your stick'], ['b', 'Hold: call the puppy']],
  how: 'Biscuit the puppy LOVES fetch! Grab a stick from the grass and THROW it (A). Biscuit races after it and brings it back to whoever is CALLING (hold B) and closest — or to the thrower if nobody calls. Every stick Biscuit brings you scores a point (the golden ball scores 3). Calling slows you down, so pick your moment to steal!',
  wins: 'Most fetches.',
  init(m, S) {
    S.b = [0, 1, 2, 3].map(i => Object.assign(MGH.body(260 + i * 250, 600, 22), { has: null, pts: 0, call: false, cd: 0 }));
    S.st = []; for (let k = 0; k < 5; k++) this.stick(S); S.sp = 0;
    S.pup = { x: 640, y: 420, st: 'idle', t: 0, tg: null, carry: null, face: 1, vx: 0, vy: 0, joy: 0 };
  },
  stick(S) { S.st.push({ x: R.range(140, 1140), y: R.range(240, 660), z: 0, vx: 0, vy: 0, vz: 0, by: -1, gold: Math.random() < 0.12, ground: true, rot: R.range(0, 6), live: false }); },
  update(m, S, dt) {
    S.sp -= dt; if (S.sp <= 0 && S.st.filter(s => s.ground && !s.live).length < 4) { this.stick(S); S.sp = 1.8; }
    S.b.forEach((b, i) => {
      b.cd -= dt; b.call = m.held(i, 'b');
      const a = m.axis(i); MGH.steer(b, a.x, a.y, dt, 2400, b.call ? 150 : 310, 8); MGH.integrate(b, dt, 70, 200, 1210, 690);
      if (!b.has) { const s = S.st.find(s => s.ground && s !== S.pup.tg && dist(s.x, s.y, b.x, b.y + 20) < 34); if (s) { b.has = s; s.ground = false; s.held = i; Sfx.pop(); } }
      else if (m.pressed(i, 'a') && b.cd <= 0) { const s = b.has, f = b.face || { x: 1, y: 0 }, l = Math.hypot(f.x, f.y) || 1; s.x = b.x; s.y = b.y + 10; s.vx = f.x / l * 520; s.vy = f.y / l * 420; s.vz = 330; s.z = 30; s.by = i; s.held = -1; s.flying = true; s.live = true; b.has = null; b.cd = 0.4; Sfx.whoosh(false); }
    });
    MGH.collide(S.b, 0.6);
    S.st.forEach(s => { if (!s.flying) return; s.x += s.vx * dt; s.y += s.vy * dt; s.vz -= 900 * dt; s.z += s.vz * dt; s.rot += dt * 12; if (s.x < 80 || s.x > 1200) s.vx *= -0.5; if (s.y < 220 || s.y > 680) s.vy *= -0.5; s.x = clamp(s.x, 80, 1200); s.y = clamp(s.y, 220, 680); if (s.z <= 0) { s.z = 0; s.flying = false; s.ground = true; s.vx = s.vy = 0; } });
    // Biscuit
    const P = S.pup; P.t += dt; P.joy -= dt;
    if (P.st === 'idle') { const s = S.st.filter(s => s.live && (s.ground || s.flying)).sort((p, q) => dist(p.x, p.y, P.x, P.y) - dist(q.x, q.y, P.x, P.y))[0]; if (s) { P.st = 'chase'; P.tg = s; Sfx.tone(700, 0.08, 'square', 0.03, 900); } else { P.vx *= 0.9; P.vy *= 0.9; } }
    if (P.st === 'chase') { const s = P.tg; if (!s || s.held >= 0 && !s.flying && !s.ground) { P.st = 'idle'; P.tg = null; } else { const dx = s.x - P.x, dy = s.y - P.y, l = Math.hypot(dx, dy) || 1; P.vx = dx / l * 390; P.vy = dy / l * 390; if (l < 24 && s.ground) { P.st = 'carry'; P.carry = s; s.ground = false; s.held = 99; P.tg = null; Sfx.tone(900, 0.05, 'square', 0.03); } } }
    if (P.st === 'carry') { const s = P.carry, callers = S.b.map((b, i) => ({ b, i })).filter(o => o.b.call && dist(o.b.x, o.b.y, P.x, P.y) < 520).sort((p, q) => dist(p.b.x, p.b.y, P.x, P.y) - dist(q.b.x, q.b.y, P.x, P.y)); const who = callers.length ? callers[0].i : (s.by >= 0 ? s.by : 0); P.to = who; const T = S.b[who], dx = T.x - P.x, dy = T.y + 10 - P.y, l = Math.hypot(dx, dy) || 1; P.vx = dx / l * 330; P.vy = dy / l * 330; s.x = P.x + P.face * 22; s.y = P.y + 4; if (l < 40) { const v = s.gold ? 3 : 1; T.pts += v; MGH.pop(`+${v}`, T.x, T.y - 60, '#ffe680', 28); Sfx.coin(); S.st = S.st.filter(q => q !== s); P.carry = null; P.st = 'idle'; P.joy = 0.8; } }
    if (P.joy > 0) { P.vx *= 0.8; P.vy *= 0.8; }
    P.x = clamp(P.x + P.vx * dt, 80, 1200); P.y = clamp(P.y + P.vy * dt, 220, 680); if (Math.abs(P.vx) > 20) P.face = P.vx > 0 ? 1 : -1;
  },
  bot(m, S, i) {
    const b = S.b[i], v = m.vin[i], P = S.pup; v.a = false; v.b = false;
    // steal: pup carrying a stick nearby → move toward it and call
    if (P.st === 'carry') { const mine = P.carry && P.carry.by === i, d = dist(P.x, P.y, b.x, b.y); const others = S.b.filter((o, j) => j !== i && o.call).map(o => dist(o.x, o.y, P.x, P.y)); const closer = others.some(o => o < d);
      if (mine && !others.length) { MGH.aim(m, i, b.x, b.y, b, 99); return; }
      if (d < 420 && (!closer || d < 160)) { v.b = Math.random() < 0.9; MGH.aim(m, i, P.x, P.y, b, 30); return; } }
    if (!b.has) { const s = S.st.filter(s => s.ground && s !== P.tg && !(s.live && P.st === 'chase')).sort((p, q) => dist(p.x, p.y, b.x, b.y) - (p.gold ? 200 : 0) - dist(q.x, q.y, b.x, b.y) + (q.gold ? 200 : 0))[0]; if (s) MGH.aim(m, i, s.x, s.y - 20, b, 4); else MGH.aim(m, i, P.x, P.y, b, 80); return; }
    // throw toward open space away from rivals once the pup is free
    if (P.st === 'idle' || P.st === 'chase') { const away = S.b.filter((o, j) => j !== i).reduce((acc, o) => ({ x: acc.x + (b.x - o.x), y: acc.y + (b.y - o.y) }), { x: 0, y: 0 }); const l = Math.hypot(away.x, away.y) || 1; v.ax = away.x / l; v.ay = away.y / l; if (b.cd <= 0 && Math.random() < (P.st === 'idle' ? 0.08 : 0.02)) v.a = true; }
  },
  score(m, S) { return S.b.map(b => b.pts); },
  fmt(s) { return `${s} fetches`; },
  hud(m, S, i) { return `🦴 ${S.b[i].pts}`; },
  stickDraw(g, s, x, y) { g.save(); g.translate(x, y); g.rotate(s.rot); if (s.gold) { MGH.glow(g, 0, 0, 20, 'rgba(255,220,80,0.6)'); const gg = g.createRadialGradient(-3, -3, 1, 0, 0, 10); gg.addColorStop(0, '#fff6c0'); gg.addColorStop(1, '#e8a820'); g.fillStyle = gg; g.beginPath(); g.arc(0, 0, 10, 0, 7); g.fill(); g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 1.5; g.beginPath(); g.arc(0, 0, 10, 0.6, 2.4); g.stroke(); } else { g.strokeStyle = '#6a4220'; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(-18, 0); g.lineTo(18, 0); g.moveTo(4, 0); g.lineTo(12, -8); g.stroke(); g.strokeStyle = '#a8703a'; g.lineWidth = 2; g.beginPath(); g.moveTo(-16, -1); g.lineTo(16, -1); g.stroke(); g.lineCap = 'butt'; } g.restore(); },
  pupDraw(g, P, t) {
    const run = Math.hypot(P.vx, P.vy) > 40, ph = t * (run ? 18 : 4), wag = Math.sin(t * (P.joy > 0 ? 30 : 14)) * 0.6, hop = run ? Math.abs(Math.sin(ph)) * 6 : P.joy > 0 ? Math.abs(Math.sin(t * 14)) * 12 : 0;
    GX.shadow(g, P.x, P.y + 26, 36, 0.35);
    g.save(); g.translate(P.x, P.y - hop); g.scale(P.face, 1);
    g.save(); g.translate(-28, -8); g.rotate(-0.8 + wag); g.fillStyle = '#c87a3a'; g.beginPath(); g.ellipse(0, -10, 5, 12, 0, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(0, -20, 4, 0, 7); g.fill(); g.restore();
    g.fillStyle = '#a85a2a'; [[-18, 1], [-8, -1], [10, 1], [20, -1]].forEach(([lx, s]) => { g.beginPath(); g.ellipse(lx + (run ? Math.sin(ph) * 6 * s : 0), 16, 5, 9, 0, 0, 7); g.fill(); });
    const fur = g.createRadialGradient(-4, -8, 3, 0, 0, 32); fur.addColorStop(0, '#f4b070'); fur.addColorStop(1, '#c87a3a'); g.fillStyle = fur; g.beginPath(); g.ellipse(0, 0, 30, 18, 0, 0, 7); g.fill();
    g.fillStyle = '#fff4e0'; g.beginPath(); g.ellipse(8, 6, 16, 9, 0, 0, Math.PI); g.fill();
    g.fillStyle = '#e83a3a'; MGH.rr(g, 14, -14, 8, 18, 3); g.fill(); g.fillStyle = '#ffd34d'; g.beginPath(); g.arc(20, 2, 3.5, 0, 7); g.fill();
    g.fillStyle = fur; g.beginPath(); g.arc(28, -16, 15, 0, 7); g.fill();
    g.fillStyle = '#fff4e0'; g.beginPath(); g.ellipse(38, -10, 9, 7, 0, 0, 7); g.fill(); g.fillStyle = '#2a1a10'; g.beginPath(); g.ellipse(45, -13, 4, 3, 0, 0, 7); g.fill();
    g.fillStyle = '#8a4a1a'; g.save(); g.translate(20, -26); g.rotate(-0.4 + (run ? Math.sin(ph) * 0.3 : 0)); g.beginPath(); g.ellipse(0, 6, 6, 12, 0.3, 0, 7); g.fill(); g.restore();
    g.fillStyle = '#1a1a1a'; g.beginPath(); g.arc(32, -20, 3, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(33, -21, 1, 0, 7); g.fill();
    if (!P.carry) { g.fillStyle = '#ff6a8a'; g.beginPath(); g.ellipse(40, -3 + Math.sin(t * 20) * 1, 3, 5, 0, 0, 7); g.fill(); }
    g.restore();
    if (P.joy > 0) for (let q = 0; q < 2; q++) MGH.heart(g, P.x - 10 + q * 22, P.y - 46 - (0.8 - P.joy) * 30, 0.7, '#ff6a8a');
  },
  draw(m, S, g) {
    // sunny park
    GX.vfill(g, 0, 0, 1280, 210, ['#6ab8f0', '#bfe4fa']);
    [[160, 60], [700, 80], [1100, 50]].forEach(([x, y], k) => MGH.cloud(g, (x + m.t * (4 + k)) % 1400 - 60, y, 26 + k * 3));
    for (let k = 0; k < 9; k++) { const x = k * 150 + 20; g.fillStyle = '#5a3a1e'; g.fillRect(x - 5, 140, 10, 70); GX.canopy(g, x, 128, 52, '#4a9a3a', k, m.t); }
    GX.vfill(g, 0, 200, 1280, 520, ['#7ccf5a', '#5ab048', '#4a9a3e']);
    for (let k = 0; k < 6; k++) { g.fillStyle = 'rgba(255,255,255,0.05)'; g.fillRect(0, 200 + k * 90, 1280, 45); }
    for (let k = 0; k < 90; k++) { const x = MGH.hash(k) * 1280, y = 210 + MGH.hash(k + 3) * 500; g.strokeStyle = 'rgba(30,90,20,0.4)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 3, y - 8); g.moveTo(x, y); g.lineTo(x + 3, y - 7); g.stroke(); if (k % 7 === 0) { g.fillStyle = ['#fff', '#ffe060', '#ff9ad0'][k % 3]; g.beginPath(); g.arc(x, y - 8, 3, 0, 7); g.fill(); } }
    g.fillStyle = '#c8a070'; g.beginPath(); g.ellipse(640, 720, 300, 60, 0, Math.PI, 0); g.fill();
    // doghouse
    g.fillStyle = '#c85a3a'; g.fillRect(1150, 210, 80, 60); g.fillStyle = '#8a3a20'; g.beginPath(); g.moveTo(1140, 212); g.lineTo(1190, 176); g.lineTo(1240, 212); g.fill(); g.fillStyle = '#2a1a10'; g.beginPath(); g.arc(1190, 252, 18, Math.PI, 0); g.fillRect(1172, 252, 36, 18); g.fill(); MGH.text(g, 'BISCUIT', 1190, 230, 11, '#fff', 'center', 'bold');
    const ents = [];
    S.st.forEach(s => { if (s.held >= 0 && !s.flying) return; ents.push({ y: s.y, f: () => { GX.shadow(g, s.x, s.y + 4, 14, 0.3); this.stickDraw(g, s, s.x, s.y - s.z); if (s.live && s.ground) { g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 2; g.beginPath(); g.arc(s.x, s.y, 20 + Math.sin(m.t * 6) * 3, 0, 7); g.stroke(); } } }); });
    S.b.forEach((b, i) => ents.push({ y: b.y, f: () => {
      const p = m.players[i]; MGH.drawBody(g, b, p, '', b.call ? 'cheer' : b.has ? 'determined' : 'happy');
      if (b.has) this.stickDraw(g, b.has, b.x + 22, b.y - 6);
      if (b.call) { for (let q = 0; q < 3; q++) { const ph = (m.t * 2 + q / 3) % 1; g.strokeStyle = `rgba(255,255,255,${0.8 * (1 - ph)})`; g.lineWidth = 2.5; g.beginPath(); g.arc(b.x + 12, b.y - 40, 10 + ph * 26, -0.9, 0.2); g.stroke(); } MGH.text(g, '🎶', b.x - 16, b.y - 62, 16, '#fff'); }
    } }));
    const P = S.pup; ents.push({ y: P.y, f: () => { this.pupDraw(g, P, m.t); if (P.carry) { this.stickDraw(g, P.carry, P.x + P.face * 40, P.y - 14); g.save(); g.globalAlpha = 0.85; const T = S.b[P.to]; if (T) { g.strokeStyle = m.players[P.to].color; g.lineWidth = 2; g.setLineDash([6, 6]); g.beginPath(); g.moveTo(P.x, P.y); g.lineTo(T.x, T.y); g.stroke(); g.setLineDash([]); } g.restore(); } } });
    ents.sort((a, b) => a.y - b.y).forEach(e => e.f());
  },
});

// ===================================================================== SHADY SPOT (stay in the drifting cloud shadows on a scorching beach)
MG.def({
  id: 'shade', name: 'Shady Spot', type: 'Survival', controls: 'Move + A', dur: 45,
  rows: [['stick', 'Run'], ['a', 'Hip-bump shove']],
  how: 'Scorching sun on the beach! Little clouds drift across the sky and their SHADOWS slide over the sand. Every moment you stand in shade earns cool points — standing in the sun just makes you sweat. Shadows get crowded, so HIP-BUMP (A) rivals out of yours! The clouds get smaller as the day heats up.',
  wins: 'Most time in the shade.',
  init(m, S) { S.b = [0, 1, 2, 3].map(i => Object.assign(MGH.body(260 + i * 250, 450, 22), { pts: 0, cd: 0, bump: 0, hot: 0 })); S.cl = []; for (let k = 0; k < 3; k++) this.cloud(S, R.range(200, 1100)); S.sp = 2; },
  cloud(S, x) { const dir = R.pick([-1, 1]); S.cl.push({ x: x !== undefined ? x : (dir > 0 ? -150 : 1430), y: R.range(280, 620), vx: dir * R.range(50, 95), vy: R.range(-15, 15), r: R.range(80, 120), seed: R.range(0, 9) }); },
  inShade(S, b) { return S.cl.some(c => { const dx = (b.x - c.x) / (c.r * 1.25), dy = (b.y + 24 - c.y) / (c.r * 0.55); return dx * dx + dy * dy < 1; }); },
  update(m, S, dt) {
    S.sp -= dt; if (S.sp <= 0) { this.cloud(S); S.sp = R.range(2.2, 3.4); }
    S.cl.forEach(c => { c.x += c.vx * dt; c.y = clamp(c.y + c.vy * dt, 260, 640); c.r = Math.max(52, c.r - dt * 0.9); }); S.cl = S.cl.filter(c => c.x > -260 && c.x < 1540);
    S.b.forEach((b, i) => {
      b.cd -= dt; b.bump -= dt;
      if (m.pressed(i, 'a') && b.cd <= 0) { b.cd = 0.9; b.bump = 0.25; S.b.forEach((o, j) => { if (j === i) return; const d = dist(o.x, o.y, b.x, b.y); if (d < 70) { const l = d || 1; o.vx += (o.x - b.x) / l * 620; o.vy += (o.y - b.y) / l * 620; o.hit = 0.4; } }); Sfx.thud(); }
      b.hit = (b.hit || 0) - dt;
      const a = b.hit > 0 ? { x: 0, y: 0 } : m.axis(i); MGH.steer(b, a.x, a.y, dt, 2200, 290, b.hit > 0 ? 2 : 7); MGH.integrate(b, dt, 60, 220, 1220, 690);
      b.shade = this.inShade(S, b); if (b.shade) { b.pts += dt; b.hot = Math.max(0, b.hot - dt * 2); } else b.hot = Math.min(1, b.hot + dt * 0.8);
    });
    MGH.collide(S.b, 0.5);
  },
  bot(m, S, i) {
    const b = S.b[i], v = m.vin[i]; v.a = false;
    const c = S.cl.filter(c => c.x > 80 && c.x < 1200).map(c => ({ c, s: dist(c.x + c.vx * 0.6, c.y, b.x, b.y + 24) - c.r * 0.5 + S.b.filter((o, j) => j !== i && dist(o.x, o.y, c.x, c.y) < c.r).length * 60 })).sort((p, q) => p.s - q.s)[0];
    if (!c) { MGH.aim(m, i, 640, 450, b, 30); return; }
    b.off = b.off || { x: R.range(-0.5, 0.5), y: R.range(-0.4, 0.4) }; if (Math.random() < 0.01) b.off = { x: R.range(-0.5, 0.5), y: R.range(-0.4, 0.4) };
    MGH.aim(m, i, c.c.x + c.c.vx * 0.4 + b.off.x * c.c.r, c.c.y - 24 + b.off.y * c.c.r * 0.4, b, 10);
    if (b.cd <= 0 && b.shade && S.b.some((o, j) => j !== i && dist(o.x, o.y, b.x, b.y) < 60) && Math.random() < 0.08) v.a = true;
  },
  score(m, S) { return S.b.map(b => Math.round(b.pts * 10)); },
  fmt(s) { return `${(s / 10).toFixed(1)}s shade`; },
  hud(m, S, i) { return `🌥️ ${S.b[i].pts.toFixed(1)}s`; },
  draw(m, S, g) {
    // blazing sky + sea + sand
    GX.vfill(g, 0, 0, 1280, 200, ['#2a9ae8', '#8ad0f8']);
    MGH.glow(g, 1120, 70, 220, 'rgba(255,240,150,0.7)'); g.fillStyle = '#fff6b0'; g.beginPath(); g.arc(1120, 70, 44, 0, 7); g.fill();
    for (let k = 0; k < 12; k++) { const a = m.t * 0.3 + k * 0.52; g.strokeStyle = 'rgba(255,240,150,0.4)'; g.lineWidth = 4; g.beginPath(); g.moveTo(1120 + Math.cos(a) * 56, 70 + Math.sin(a) * 56); g.lineTo(1120 + Math.cos(a) * 80, 70 + Math.sin(a) * 80); g.stroke(); }
    GX.vfill(g, 0, 150, 1280, 70, ['#2a8ac8', '#5ab8e0']);
    for (let k = 0; k < 10; k++) { g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 2; const x = (k * 140 + m.t * 20) % 1400 - 60; g.beginPath(); g.moveTo(x, 170 + (k % 3) * 14); g.quadraticCurveTo(x + 20, 164 + (k % 3) * 14, x + 40, 170 + (k % 3) * 14); g.stroke(); }
    g.fillStyle = 'rgba(255,255,255,0.8)'; g.beginPath(); g.moveTo(0, 220); for (let x = 0; x <= 1280; x += 20) g.lineTo(x, 214 + Math.sin(x * 0.03 + m.t * 2) * 4); g.lineTo(1280, 226); g.lineTo(0, 226); g.fill();
    GX.vfill(g, 0, 222, 1280, 498, ['#f8e0a8', '#f0d090', '#e8c078']);
    for (let k = 0; k < 160; k++) { g.fillStyle = 'rgba(190,150,90,0.35)'; g.fillRect(MGH.hash(k) * 1280, 230 + MGH.hash(k + 5) * 490, 2, 2); }
    // heat shimmer
    g.save(); g.globalAlpha = 0.08; for (let k = 0; k < 8; k++) { g.strokeStyle = '#fff'; g.lineWidth = 6; g.beginPath(); for (let x = 0; x <= 1280; x += 30) g.lineTo(x, 260 + k * 60 + Math.sin(x * 0.02 + m.t * 3 + k) * 6); g.stroke(); } g.restore();
    // beach props: towels, shells, a sandcastle
    [[180, 640, '#ff6a6a'], [1080, 300, '#6ac8ff']].forEach(([x, y, c]) => { g.fillStyle = c; MGH.rr(g, x - 40, y - 18, 80, 36, 6); g.fill(); g.fillStyle = 'rgba(255,255,255,0.6)'; for (let s = 0; s < 3; s++) g.fillRect(x - 40, y - 12 + s * 12, 80, 4); });
    // cloud shadows on the sand
    S.cl.forEach(c => { g.save(); g.fillStyle = 'rgba(40,60,110,0.32)'; g.beginPath(); for (let q = 0; q < 5; q++) { const a = q / 5 * Math.PI * 2 + c.seed; g.ellipse(c.x + Math.cos(a) * c.r * 0.45, c.y + Math.sin(a) * c.r * 0.2, c.r * 0.75, c.r * 0.38, 0, 0, 7); } g.fill(); g.restore(); g.strokeStyle = 'rgba(40,60,110,0.2)'; g.lineWidth = 2; g.beginPath(); g.ellipse(c.x, c.y, c.r * 1.25, c.r * 0.55, 0, 0, 7); g.stroke(); });
    const ents = S.b.map((b, i) => ({ y: b.y, f: () => {
      const p = m.players[i];
      if (b.bump > 0) { g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 3; g.beginPath(); g.arc(b.x, b.y + 10, 30 + (0.25 - b.bump) * 160, 0, 7); g.stroke(); }
      MGH.drawBody(g, b, p, '', b.hit > 0 ? 'dizzy' : b.shade ? 'happy' : b.hot > 0.6 ? 'hurt' : 'determined');
      if (!b.shade) { const sw = b.hot; for (let q = 0; q < 2; q++) { const ph = (m.t * 1.5 + q * 0.5 + i) % 1; g.fillStyle = `rgba(120,200,255,${sw * (1 - ph)})`; g.beginPath(); g.ellipse(b.x + (q ? 18 : -18), b.y - 40 + ph * 30, 3, 5, 0, 0, 7); g.fill(); } if (b.hot > 0.5) { g.fillStyle = `rgba(255,80,60,${(b.hot - 0.5) * 0.5})`; g.beginPath(); g.arc(b.x, b.y - 10, 30, 0, 7); g.fill(); } }
      else MGH.text(g, '😎', b.x + 22, b.y - 50, 16, '#fff');
    } }));
    ents.sort((a, b) => a.y - b.y).forEach(e => e.f());
    // the clouds themselves, drifting overhead (drawn high in the sky band, offset from their shadows)
    S.cl.forEach(c => MGH.cloud(g, c.x, 90 + (c.y - 260) * 0.1, c.r * 0.32, 'rgba(255,255,255,0.92)'));
  },
});

// ===================================================================== SANDCASTLE RUSH (carry wet sand to build the tallest castle)
MG.def({
  id: 'sandcastle', name: 'Sandcastle Rush', type: 'Strategy', controls: 'Move + A & B', dur: 50,
  rows: [['stick', 'Run'], ['a', 'Fill bucket at the shore · build at your plot'], ['b', 'Kick a rival castle']],
  how: 'Build the tallest sandcastle! Run down to the WET SAND by the sea and HOLD A to fill your bucket, then carry it back up to your plot and press A to add a level. Waves roll in now and then — get caught in one and it knocks you back and empties your bucket! Feeling cheeky? Press B at a rival\'s castle to kick a level off (it costs your bucket).',
  wins: 'Tallest castle.',
  PLOT: [200, 500, 780, 1080],
  init(m, S) { S.b = [0, 1, 2, 3].map(i => Object.assign(MGH.body(this.PLOT[i], 330, 22), { full: false, fill: 0, h: 0, cd: 0, wave: 0, kick: 0 })); S.wave = { t: 5, st: 'calm', x: 0, k: 0 }; },
  update(m, S, dt) {
    const W = S.wave; W.t -= dt;
    if (W.st === 'calm' && W.t <= 0) { W.st = 'warn'; W.t = 1.2; Sfx.noise(1.2, 300, 0.04, 'lowpass'); }
    else if (W.st === 'warn' && W.t <= 0) { W.st = 'in'; W.t = 1.4; }
    else if (W.st === 'in' && W.t <= 0) { W.st = 'calm'; W.t = R.range(3, 5.5); }
    W.k = W.st === 'in' ? Math.sin((1.4 - W.t) / 1.4 * Math.PI) : 0; const waterY = 720 - 200 * (0.28 + 0.72 * W.k) - (W.st === 'warn' ? 10 : 0);
    S.wy = waterY;
    S.b.forEach((b, i) => {
      b.cd -= dt; b.wave -= dt; b.kick -= dt;
      const wet = b.y + 24 > 560, plot = Math.abs(b.x - this.PLOT[i]) < 70 && b.y < 360;
      const filling = m.held(i, 'a') && wet && !b.full && b.wave <= 0;
      const a = filling || b.wave > 0 ? { x: 0, y: 0 } : m.axis(i); MGH.steer(b, a.x, a.y, dt, 2400, b.full ? 230 : 300, b.wave > 0 ? 2 : 8); MGH.integrate(b, dt, 60, 260, 1220, 690);
      if (filling) { b.fill += dt / 0.7; if (b.fill >= 1) { b.full = true; b.fill = 0; Sfx.pop(); } } else if (!b.full) b.fill = 0;
      if (m.pressed(i, 'a') && b.full && plot) { b.full = false; b.h = Math.min(30, b.h + 1); MGH.burst(this.PLOT[i], 290 - b.h * 7, ['#e8c080', '#fff'], 10, { speed: 120 }); Sfx.thud(); }
      if (m.pressed(i, 'b') && b.cd <= 0) { const j = this.PLOT.findIndex((x, k) => k !== i && Math.abs(b.x - x) < 70 && b.y < 370); if (j >= 0 && S.b[j].h > 0 && b.full) { S.b[j].h--; b.full = false; b.cd = 2.5; b.kick = 0.3; MGH.burst(this.PLOT[j], 290 - S.b[j].h * 7, ['#e8c080', '#c8a060'], 16, { speed: 220 }); Sfx.bad(); MGH.pop('KICK!', this.PLOT[j], 180, '#ff8a6a', 24); } }
      if (W.st === 'in' && b.y + 24 > waterY && b.wave <= 0) { b.wave = 0.9; b.vy = -380; b.vx *= 0.3; if (b.full) { b.full = false; MGH.pop('Washed out!', b.x, b.y - 50, '#9fe0ff', 20); } b.fill = 0; Sfx.noise(0.3, 900, 0.06, 'lowpass'); }
    });
    MGH.collide(S.b, 0.5);
  },
  bot(m, S, i) {
    const b = S.b[i], v = m.vin[i], W = S.wave; v.a = false; v.b = false;
    const danger = W.st === 'warn' || (W.st === 'in' && W.t > 0.3);
    if (!b.full) {
      b.wary = b.wary === undefined ? Math.random() < 0.8 : b.wary; if (W.st === 'calm') b.wary = undefined;
      if (danger && b.wary && b.y > 420) { MGH.aim(m, i, b.x, 380, b, 6); return; }
      if (danger && b.wary) { MGH.aim(m, i, b.x, 420, b, 20); return; }
      const tx = clamp(b.x, 100, 1180); if (b.y + 24 < 575) MGH.aim(m, i, tx, 580, b, 6); else { v.a = true; v.ax = v.ay = 0; } return;
    }
    // full bucket: usually build, sometimes kick the leader
    const lead = S.b.map((o, j) => ({ o, j })).filter(o => o.j !== i).sort((p, q) => q.o.h - p.o.h)[0];
    if (!b.plan) b.plan = lead && lead.o.h >= b.h && lead.o.h > 2 && b.cd <= 0 && Math.random() < 0.22 ? 'kick' : 'build';
    const tx = b.plan === 'kick' ? this.PLOT[lead.j] : this.PLOT[i];
    MGH.aim(m, i, tx, 320, b, 6);
    if (Math.abs(b.x - tx) < 50 && b.y < 350) { if (b.plan === 'kick') v.b = true; else v.a = true; b.plan = null; }
  },
  score(m, S) { return S.b.map(b => b.h); },
  fmt(s) { return `${s} levels`; },
  hud(m, S, i) { const b = S.b[i]; return `🏰 ${b.h}${b.full ? ' 🪣' : ''}`; },
  castle(g, x, y, h, col, t) {
    GX.shadow(g, x + 10, y + 8, 70, 0.3);
    const sand = (yy, w) => { const sg = g.createLinearGradient(x - w, 0, x + w, 0); sg.addColorStop(0, '#d8b070'); sg.addColorStop(0.4, '#f4d8a0'); sg.addColorStop(1, '#b8904a'); return sg; };
    for (let k = 0; k < h; k++) { const w = 58 - k * 1.5, yy = y - k * 7; g.fillStyle = sand(yy, w); g.fillRect(x - w, yy - 7, w * 2, 8); g.fillStyle = 'rgba(120,80,30,0.18)'; g.fillRect(x - w, yy - 1, w * 2, 2); }
    const top = y - h * 7, w = Math.max(14, 58 - h * 1.5);
    if (h > 0) { g.fillStyle = '#e8c888'; for (let q = -2; q <= 2; q++) g.fillRect(x + q * w * 0.4 - 5, top - 10, 10, 10); g.fillStyle = '#5a3a1a'; g.beginPath(); g.arc(x, y - 4, 10, Math.PI, 0); g.fillRect(x - 10, y - 4, 20, 6); g.fill(); }
    if (h >= 4) { const th = h * 4.5; [-1, 1].forEach(s => { g.fillStyle = '#e8c888'; g.fillRect(x + s * 62 - 8, y - th - 8, 16, th + 8); g.beginPath(); g.moveTo(x + s * 62 - 10, y - th - 8); g.lineTo(x + s * 62, y - th - 24); g.lineTo(x + s * 62 + 10, y - th - 8); g.fill(); }); }
    g.strokeStyle = '#5a3a1a'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, top - 10); g.lineTo(x, top - 40); g.stroke(); g.fillStyle = col; g.beginPath(); g.moveTo(x, top - 40); g.lineTo(x + 22 + Math.sin(t * 6) * 3, top - 34); g.lineTo(x, top - 28); g.fill();
  },
  draw(m, S, g) {
    GX.vfill(g, 0, 0, 1280, 160, ['#5ab0f0', '#bfe4fa']);
    [[200, 60], [900, 80]].forEach(([x, y], k) => MGH.cloud(g, (x + m.t * 5) % 1400 - 60, y, 26));
    GX.vfill(g, 0, 150, 1280, 570, ['#f4dca0', '#ecd090', '#d8b878']);
    for (let k = 0; k < 160; k++) { g.fillStyle = 'rgba(190,150,90,0.3)'; g.fillRect(MGH.hash(k) * 1280, 160 + MGH.hash(k + 5) * 400, 2, 2); }
    // wet sand + sea + incoming wave
    const wy = S.wy || 670; GX.vfill(g, 0, 545, 1280, 175, ['#c8a868', '#b09058']);
    g.fillStyle = 'rgba(255,255,255,0.15)'; for (let k = 0; k < 20; k++) { g.beginPath(); g.ellipse(MGH.hash(k + 40) * 1280, 570 + MGH.hash(k + 41) * 120, 20, 4, 0, 0, 7); g.fill(); }
    const sea = g.createLinearGradient(0, wy, 0, 720); sea.addColorStop(0, 'rgba(90,190,230,0.9)'); sea.addColorStop(1, 'rgba(30,110,180,1)'); g.fillStyle = sea;
    g.beginPath(); g.moveTo(0, 720); for (let x = 0; x <= 1280; x += 20) g.lineTo(x, wy + Math.sin(x * 0.02 + m.t * 2) * 6); g.lineTo(1280, 720); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 5; g.beginPath(); for (let x = 0; x <= 1280; x += 20) { const yy = wy + Math.sin(x * 0.02 + m.t * 2) * 6; x ? g.lineTo(x, yy) : g.moveTo(x, yy); } g.stroke();
    if (S.wave.st === 'warn') MGH.label(g, '🌊 Wave coming!', 640, 520, 24, '#9fe0ff');
    MGH.text(g, '— wet sand: hold A to fill —', 640, 568, 15, 'rgba(255,255,255,0.8)', 'center', 'bold');
    // plots + castles
    S.b.forEach((b, i) => { const x = this.PLOT[i], p = m.players[i]; g.strokeStyle = p.color; g.lineWidth = 3; g.setLineDash([8, 6]); g.beginPath(); g.ellipse(x, 300, 80, 26, 0, 0, 7); g.stroke(); g.setLineDash([]); });
    const ents = S.b.map((b, i) => ({ y: 300, f: () => this.castle(g, this.PLOT[i], 300, b.h, m.players[i].color, m.t) }));
    S.b.forEach((b, i) => ents.push({ y: b.y + 30, f: () => {
      const p = m.players[i]; MGH.drawBody(g, b, p, '', b.wave > 0 ? 'dizzy' : b.kick > 0 ? 'evil' : b.full ? 'determined' : 'happy');
      const bx = b.x + 24, by = b.y + 4; g.fillStyle = p.color; g.beginPath(); g.moveTo(bx - 10, by - 12); g.lineTo(bx + 10, by - 12); g.lineTo(bx + 7, by + 6); g.lineTo(bx - 7, by + 6); g.fill(); g.strokeStyle = '#333'; g.lineWidth = 1.5; g.beginPath(); g.arc(bx, by - 12, 10, Math.PI, 0); g.stroke();
      if (b.full) { g.fillStyle = '#c8a060'; g.beginPath(); g.ellipse(bx, by - 13, 10, 4, 0, 0, 7); g.fill(); }
      if (b.fill > 0) { g.fillStyle = 'rgba(0,0,0,0.5)'; MGH.rr(g, b.x - 26, b.y - 66, 52, 8, 4); g.fill(); g.fillStyle = '#e8c080'; MGH.rr(g, b.x - 25, b.y - 65, 50 * b.fill, 6, 3); g.fill(); }
    } }));
    ents.sort((a, b) => a.y - b.y).forEach(e => e.f());
  },
});

// ===================================================================== MAGNET MANIA (pull in bolts with your magnet, blast rivals with a pulse)
MG.def({
  id: 'magnets', name: 'Magnet Mania', type: 'Coins', controls: 'Move + A & B', dur: 50,
  rows: [['stick', 'Run'], ['a', 'Hold: magnet ON (pull bolts)'], ['b', 'Repel pulse']],
  how: 'The workshop floor is covered in bolts and gears! HOLD A to switch on your big magnet — loose parts fly to you and stick on (you move slower while it\'s on). Carry them to your coloured bin to bank them. Press B for a REPEL PULSE: it shoves rivals away and knocks the parts off them! Golden gears are worth 3.',
  wins: 'Most parts banked.',
  BINS: [[90, 230], [1190, 230], [90, 660], [1190, 660]],
  init(m, S) { S.b = [0, 1, 2, 3].map(i => Object.assign(MGH.body(this.BINS[i][0] + (i % 2 ? -110 : 110), this.BINS[i][1] + (i < 2 ? 60 : -60), 22), { carry: [], bank: 0, mag: false, cd: 0, pulse: 0, hit: 0 })); S.parts = []; for (let k = 0; k < 18; k++) this.part(S); S.sp = 0; },
  part(S, x, y) { S.parts.push({ x: x !== undefined ? x : R.range(220, 1060), y: y !== undefined ? y : R.range(260, 640), vx: 0, vy: 0, k: Math.random() < 0.1 ? 'gold' : Math.random() < 0.5 ? 'bolt' : 'nut', rot: R.range(0, 6), free: 0 }); },
  update(m, S, dt) {
    S.sp -= dt; if (S.sp <= 0 && S.parts.length < 20) { this.part(S); S.sp = 0.5; }
    S.b.forEach((b, i) => {
      b.cd -= dt; b.pulse -= dt; b.hit -= dt; b.mag = m.held(i, 'a') && b.hit <= 0;
      if (m.pressed(i, 'b') && b.cd <= 0) { b.cd = 2.5; b.pulse = 0.35; Sfx.boom(); S.b.forEach((o, j) => { if (j === i) return; const d = dist(o.x, o.y, b.x, b.y); if (d < 170) { const l = d || 1; o.vx += (o.x - b.x) / l * 700; o.vy += (o.y - b.y) / l * 700; o.hit = 0.5; o.carry.forEach(c => { const a = R.range(0, 6.28); S.parts.push({ x: o.x, y: o.y, vx: Math.cos(a) * 340, vy: Math.sin(a) * 340, k: c, rot: a, free: 0.6 }); }); if (o.carry.length) MGH.pop('Scattered!', o.x, o.y - 50, '#ff8a6a', 20); o.carry = []; } }); }
      const a = b.hit > 0 ? { x: 0, y: 0 } : m.axis(i); MGH.steer(b, a.x, a.y, dt, 2400, (b.mag ? 170 : 300) * (1 - b.carry.length * 0.02), b.hit > 0 ? 2 : 8); MGH.integrate(b, dt, 60, 200, 1220, 700);
      const [bx, by] = this.BINS[i]; if (b.carry.length && dist(bx, by, b.x, b.y) < 80) { const v = b.carry.reduce((s, c) => s + (c === 'gold' ? 3 : 1), 0); b.bank += v; MGH.pop(`+${v}`, bx, by - 50, '#ffe680', 28); b.carry = []; Sfx.coin(); }
    });
    MGH.collide(S.b, 0.6);
    S.parts.forEach(p => {
      p.free -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= Math.exp(-4 * dt); p.vy *= Math.exp(-4 * dt); p.x = clamp(p.x, 80, 1200); p.y = clamp(p.y, 220, 680);
      if (p.free > 0) return;
      const pull = S.b.filter(b => b.mag && b.carry.length < 12).map(b => ({ b, d: dist(b.x, b.y, p.x, p.y) })).filter(o => o.d < 210).sort((q, r) => q.d - r.d)[0];
      if (pull) { const k = (1 - pull.d / 210) * 1400 + 200; p.vx += (pull.b.x - p.x) / pull.d * k * dt; p.vy += (pull.b.y - p.y) / pull.d * k * dt; p.rot += dt * 8; if (pull.d < 28) { pull.b.carry.push(p.k); p.got = true; Sfx.tone(1200, 0.03, 'square', 0.02); } }
    });
    S.parts = S.parts.filter(p => !p.got);
  },
  bot(m, S, i) {
    const b = S.b[i], v = m.vin[i]; v.a = false; v.b = false; const [bx, by] = this.BINS[i];
    const rich = S.b.find((o, j) => j !== i && o.carry.length >= 4 && dist(o.x, o.y, b.x, b.y) < 150);
    if (rich && b.cd <= 0 && Math.random() < 0.3) v.b = true;
    if (b.carry.length >= (b.goal || 6)) { MGH.aim(m, i, bx, by, b, 10); return; }
    b.goal = b.goal || R.int(4, 8);
    const c = S.parts.map(p => ({ p, s: dist(p.x, p.y, b.x, b.y) - (p.k === 'gold' ? 150 : 0) - S.parts.filter(q => dist(q.x, q.y, p.x, p.y) < 120).length * 25 })).sort((p, q) => p.s - q.s)[0];
    if (!c) { MGH.aim(m, i, bx, by, b, 10); return; }
    MGH.aim(m, i, c.p.x, c.p.y, b, 30); if (dist(c.p.x, c.p.y, b.x, b.y) < 200) v.a = true;
    if (b.carry.length === 0) b.goal = R.int(4, 8);
  },
  score(m, S) { return S.b.map(b => b.bank); },
  fmt(s) { return `${s} parts`; },
  hud(m, S, i) { const b = S.b[i]; return `🔩 ${b.bank}${b.carry.length ? ' +' + b.carry.length : ''}`; },
  partDraw(g, k, x, y, rot, s = 1) {
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
    if (k === 'bolt') { g.fillStyle = '#a8b0bc'; g.fillRect(-3, -2, 16, 4); g.fillStyle = '#c8d0dc'; g.beginPath(); for (let q = 0; q < 6; q++) { const a = q * Math.PI / 3; g.lineTo(-6 + Math.cos(a) * 6, Math.sin(a) * 6); } g.fill(); g.strokeStyle = '#6a7280'; g.lineWidth = 1; g.stroke(); g.strokeStyle = 'rgba(80,90,100,0.6)'; for (let q = 0; q < 4; q++) { g.beginPath(); g.moveTo(1 + q * 3, -2); g.lineTo(3 + q * 3, 2); g.stroke(); } }
    else if (k === 'nut') { g.fillStyle = '#b8c0cc'; g.beginPath(); for (let q = 0; q < 6; q++) { const a = q * Math.PI / 3; g.lineTo(Math.cos(a) * 8, Math.sin(a) * 8); } g.fill(); g.strokeStyle = '#6a7280'; g.lineWidth = 1; g.stroke(); g.fillStyle = '#5a6270'; g.beginPath(); g.arc(0, 0, 3.5, 0, 7); g.fill(); }
    else { MGH.glow(g, 0, 0, 20, 'rgba(255,220,80,0.5)'); g.fillStyle = '#ffd34d'; g.beginPath(); for (let q = 0; q < 16; q++) { const a = q * Math.PI / 8, r = q % 2 ? 8 : 11; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.fill(); g.strokeStyle = '#b8862a'; g.lineWidth = 1; g.stroke(); g.fillStyle = '#b8862a'; g.beginPath(); g.arc(0, 0, 3.5, 0, 7); g.fill(); }
    g.restore();
  },
  draw(m, S, g) {
    // workshop: pegboard wall, tool shelves, riveted steel floor
    GX.vfill(g, 0, 0, 1280, 200, ['#5a4a3a', '#6a5a48']);
    for (let r = 0; r < 6; r++) for (let c = 0; c < 40; c++) { g.fillStyle = 'rgba(30,20,10,0.4)'; g.beginPath(); g.arc(16 + c * 32, 50 + r * 26, 2.5, 0, 7); g.fill(); }
    [[200, '🔧'], [420, '🔨'], [640, '🪛'], [860, '⚙️'], [1080, '🪚']].forEach(([x, e]) => MGH.text(g, e, x, 110, 40, '#fff'));
    g.fillStyle = '#4a3a2a'; g.fillRect(0, 186, 1280, 16);
    const fl = g.createLinearGradient(0, 200, 0, 720); fl.addColorStop(0, '#8a929e'); fl.addColorStop(1, '#5a626e'); g.fillStyle = fl; g.fillRect(0, 200, 1280, 520);
    for (let r = 0; r < 6; r++) for (let c = 0; c < 9; c++) { const x = c * 150, y = 200 + r * 90; g.strokeStyle = 'rgba(30,40,50,0.4)'; g.lineWidth = 2; g.strokeRect(x, y, 150, 90); g.fillStyle = 'rgba(255,255,255,0.15)'; [[6, 6], [144, 6], [6, 84], [144, 84]].forEach(([dx, dy]) => { g.beginPath(); g.arc(x + dx, y + dy, 2.5, 0, 7); g.fill(); }); g.strokeStyle = 'rgba(255,255,255,0.05)'; for (let q = 0; q < 5; q++) { g.beginPath(); g.moveTo(x + 20 + q * 25, y + 20); g.lineTo(x + 32 + q * 25, y + 32); g.stroke(); } }
    // bins
    this.BINS.forEach(([x, y], i) => { const p = m.players[i]; GX.shadow(g, x, y + 36, 54, 0.4); const bg = g.createLinearGradient(x - 46, 0, x + 46, 0); bg.addColorStop(0, Char.shade(p.color, -0.3)); bg.addColorStop(0.5, p.color); bg.addColorStop(1, Char.shade(p.color, -0.3)); g.fillStyle = bg; g.beginPath(); g.moveTo(x - 46, y - 26); g.lineTo(x + 46, y - 26); g.lineTo(x + 38, y + 36); g.lineTo(x - 38, y + 36); g.fill(); g.fillStyle = '#2a2a30'; g.beginPath(); g.ellipse(x, y - 26, 46, 12, 0, 0, 7); g.fill(); for (let q = 0; q < Math.min(8, S.b[i].bank); q++) this.partDraw(g, q % 3 ? 'nut' : 'bolt', x - 30 + (q % 4) * 20, y - 30 - Math.floor(q / 4) * 6, q, 0.8); MGH.text(g, `${S.b[i].bank}`, x, y + 16, 22, '#fff', 'center', 'bold'); });
    S.parts.forEach(p => { GX.shadow(g, p.x, p.y + 8, 10, 0.25); this.partDraw(g, p.k, p.x, p.y, p.rot); });
    const ents = S.b.map((b, i) => ({ y: b.y, f: () => {
      const p = m.players[i];
      if (b.mag) { g.save(); g.globalCompositeOperation = 'lighter'; for (let q = 0; q < 3; q++) { const ph = (m.t * 2 + q / 3) % 1; g.strokeStyle = `rgba(120,180,255,${0.5 * ph})`; g.lineWidth = 3; g.beginPath(); g.arc(b.x, b.y, 210 * (1 - ph) + 20, 0, 7); g.stroke(); } g.restore(); }
      if (b.pulse > 0) { const k = 1 - b.pulse / 0.35; g.strokeStyle = `rgba(255,120,80,${1 - k})`; g.lineWidth = 10 * (1 - k) + 2; g.beginPath(); g.arc(b.x, b.y, 20 + k * 160, 0, 7); g.stroke(); }
      MGH.drawBody(g, b, p, '', b.hit > 0 ? 'dizzy' : b.mag ? 'effort' : 'happy');
      // horseshoe magnet held up
      const mx = b.x + 22, my = b.y - 30 + (b.mag ? Math.sin(m.t * 40) * 1.5 : 0); g.save(); g.translate(mx, my); g.rotate(-0.4); g.lineWidth = 9; g.strokeStyle = '#e8323e'; g.beginPath(); g.arc(0, 0, 11, Math.PI, 0); g.stroke(); g.strokeStyle = '#c8ccd4'; g.beginPath(); g.moveTo(-11, 0); g.lineTo(-11, 8); g.moveTo(11, 0); g.lineTo(11, 8); g.stroke(); g.restore();
      b.carry.forEach((c, k) => { const a = k / Math.max(1, b.carry.length) * Math.PI * 2 + m.t * 2; this.partDraw(g, c, b.x + Math.cos(a) * 26, b.y - 4 + Math.sin(a) * 14, a, 0.8); });
    } }));
    ents.sort((a, b) => a.y - b.y).forEach(e => e.f());
  },
});

// ===================================================================== GLOWBUG NET (catch glowbugs in the dark meadow)
MG.def({
  id: 'glowbugs', name: 'Glowbug Net', type: 'Coins', controls: 'Move + A', dur: 45,
  rows: [['stick', 'Run'], ['a', 'Swing your net']],
  how: 'Night falls on the meadow and the glowbugs come out — but they only glow now and then! Run around and SWING your net (A) to scoop them up. Every bug in your jar makes your lantern glow brighter so you can see further. Rare blue moon-moths flutter fast and count 3. Swing your net at a rival to knock a bug out of their jar!',
  wins: 'Most glowbugs caught.',
  init(m, S) { S.b = [0, 1, 2, 3].map(i => Object.assign(MGH.body(320 + (i % 2) * 640, 320 + Math.floor(i / 2) * 240, 22), { n: 0, sw: 0, cd: 0, hit: 0 })); S.bugs = []; for (let k = 0; k < 14; k++) this.bug(S); S.sp = 0; },
  bug(S, x, y) { S.bugs.push({ x: x !== undefined ? x : R.range(100, 1180), y: y !== undefined ? y : R.range(220, 660), vx: 0, vy: 0, ph: R.range(0, 6), per: R.range(1.6, 2.6), moth: Math.random() < 0.08, flee: 0 }); },
  update(m, S, dt) {
    S.sp -= dt; if (S.sp <= 0 && S.bugs.length < 16) { this.bug(S); S.sp = 0.7; }
    S.bugs.forEach(q => { q.ph += dt; q.flee -= dt; const sp = q.moth ? 3 : 1; if (Math.random() < dt * 1.2 * sp) { const a = R.range(0, 6.28); q.vx = Math.cos(a) * 60 * sp; q.vy = Math.sin(a) * 40 * sp; } q.x = clamp(q.x + q.vx * dt, 70, 1210); q.y = clamp(q.y + q.vy * dt + Math.sin(q.ph * 3) * 10 * dt, 210, 680); });
    S.b.forEach((b, i) => {
      b.sw -= dt; b.cd -= dt; b.hit -= dt;
      if (m.pressed(i, 'a') && b.cd <= 0) { b.sw = 0.28; b.cd = 0.55; Sfx.whoosh(false);
        const f = b.face || { x: 1, y: 0 }, l = Math.hypot(f.x, f.y) || 1, nx = b.x + f.x / l * 46, ny = b.y + f.y / l * 30 - 6;
        let got = 0; S.bugs = S.bugs.filter(q => { if (dist(q.x, q.y, nx, ny) < 56) { got += q.moth ? 3 : 1; return false; } return true; });
        if (got) { b.n += got; MGH.pop(`+${got}`, b.x, b.y - 60, '#fff6a0', 24); Sfx.coin(); }
        S.b.forEach((o, j) => { if (j !== i && o.n > 0 && o.hit <= 0 && dist(o.x, o.y, nx, ny) < 50) { o.n--; o.hit = 0.8; this.bug(S, o.x, o.y - 30); S.bugs[S.bugs.length - 1].flee = 1; MGH.pop('Escaped!', o.x, o.y - 60, '#ff9a8a', 18); Sfx.bad(); } });
      }
      const a = b.hit > 0 ? { x: 0, y: 0 } : m.axis(i); MGH.steer(b, a.x, a.y, dt, 2400, 300, 8); MGH.integrate(b, dt, 60, 200, 1220, 700);
    });
    MGH.collide(S.b, 0.6);
  },
  lit(q) { return Math.sin(q.ph * Math.PI * 2 / q.per) > -0.2; },
  sight(b) { return 120 + Math.min(14, b.n) * 12; },
  bot(m, S, i) {
    const b = S.b[i], v = m.vin[i]; v.a = false;
    const see = S.bugs.filter(q => (this.lit(q) || dist(q.x, q.y, b.x, b.y) < this.sight(b)) && dist(q.x, q.y, b.x, b.y) < 420);
    const q = see.sort((p, r) => dist(p.x, p.y, b.x, b.y) - (p.moth ? 120 : 0) - dist(r.x, r.y, b.x, b.y) + (r.moth ? 120 : 0))[0];
    if (!q) { b.wp = b.wp && dist(b.wp.x, b.wp.y, b.x, b.y) > 40 ? b.wp : { x: R.range(150, 1130), y: R.range(260, 640) }; MGH.aim(m, i, b.wp.x, b.wp.y, b, 10); return; }
    MGH.aim(m, i, q.x, q.y + 6, b, 4); if (dist(q.x, q.y, b.x + (b.face ? b.face.x : 0) * 40, b.y) < 60 && b.cd <= 0 && Math.random() < 0.5) v.a = true;
  },
  score(m, S) { return S.b.map(b => b.n); },
  fmt(s) { return `${s} glowbugs`; },
  hud(m, S, i) { return `✨ ${S.b[i].n}`; },
  draw(m, S, g) {
    // night meadow
    GX.vfill(g, 0, 0, 1280, 220, ['#060a24', '#14204a', '#24305a']);
    for (let k = 0; k < 60; k++) { g.fillStyle = `rgba(255,255,255,${0.3 + 0.5 * Math.abs(Math.sin(m.t + k))})`; g.fillRect(MGH.hash(k) * 1280, MGH.hash(k + 9) * 180, 1.6, 1.6); }
    MGH.glow(g, 200, 90, 70, 'rgba(220,230,255,0.4)'); g.fillStyle = '#f0f4ff'; g.beginPath(); g.arc(200, 90, 26, 0, 7); g.fill(); g.fillStyle = '#060a24'; g.beginPath(); g.arc(212, 84, 22, 0, 7); g.fill();
    g.fillStyle = '#0a1a24'; g.beginPath(); g.moveTo(0, 220); for (let x = 0; x <= 1280; x += 40) g.lineTo(x, 190 - Math.abs(Math.sin(x * 0.007)) * 50); g.lineTo(1280, 220); g.fill();
    GX.vfill(g, 0, 200, 1280, 520, ['#1a3a2a', '#14301e', '#0e2414']);
    for (let k = 0; k < 120; k++) { const x = MGH.hash(k) * 1280, y = 210 + MGH.hash(k + 3) * 500, sw = Math.sin(m.t + k) * 2; g.strokeStyle = 'rgba(80,140,80,0.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 3 + sw, y - 12); g.moveTo(x, y); g.lineTo(x + 4 + sw, y - 10); g.stroke(); }
    // darkness mask with light around each lantern
    const dk = GX._dk || (GX._dk = document.createElement('canvas')); if (dk.width !== 640) { dk.width = 640; dk.height = 360; } const d = dk.getContext('2d');
    d.globalCompositeOperation = 'source-over'; d.clearRect(0, 0, 640, 360); d.fillStyle = 'rgba(4,8,20,0.7)'; d.fillRect(0, 0, 640, 360); d.globalCompositeOperation = 'destination-out';
    S.b.forEach(b => { const r = this.sight(b) / 2; const gr = d.createRadialGradient(b.x / 2, b.y / 2, r * 0.2, b.x / 2, b.y / 2, r); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); d.fillStyle = gr; d.beginPath(); d.arc(b.x / 2, b.y / 2, r, 0, 7); d.fill(); });
    d.globalCompositeOperation = 'source-over';
    // bugs (seen glowing even in the dark when lit)
    S.bugs.forEach(q => { const on = this.lit(q), near = S.b.some(b => dist(b.x, b.y, q.x, q.y) < this.sight(b)); if (!on && !near) return; const a = on ? 0.6 + 0.4 * Math.sin(q.ph * 8) : 0.35; if (q.moth) { MGH.glow(g, q.x, q.y, 30, `rgba(120,180,255,${a})`); g.fillStyle = `rgba(180,220,255,${a})`; const fl = Math.sin(m.t * 30 + q.ph); g.beginPath(); g.ellipse(q.x - 7, q.y, 9, 5 + fl * 3, -0.4, 0, 7); g.ellipse(q.x + 7, q.y, 9, 5 + fl * 3, 0.4, 0, 7); g.fill(); g.fillStyle = '#e8f4ff'; g.beginPath(); g.ellipse(q.x, q.y, 2.5, 6, 0, 0, 7); g.fill(); } else { MGH.glow(g, q.x, q.y, 20, `rgba(220,255,120,${a})`); g.fillStyle = `rgba(250,255,190,${Math.min(1, a + 0.2)})`; g.beginPath(); g.arc(q.x, q.y, 3.5, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,0.4)'; g.beginPath(); g.ellipse(q.x - 3, q.y - 3, 3, 1.5, -0.5, 0, 7); g.ellipse(q.x + 3, q.y - 3, 3, 1.5, 0.5, 0, 7); g.fill(); } });
    const ents = S.b.map((b, i) => ({ y: b.y, f: () => {
      const p = m.players[i], f = b.face || { x: 1, y: 0 };
      MGH.drawBody(g, b, p, '', b.hit > 0 ? 'hurt' : b.sw > 0 ? 'determined' : 'happy');
      // jar lantern on the belt
      const jx = b.x - 22, jy = b.y + 4; MGH.glow(g, jx, jy, 22 + b.n * 2.5, `rgba(230,255,140,${Math.min(0.8, 0.2 + b.n * 0.05)})`); g.fillStyle = 'rgba(220,240,255,0.35)'; MGH.rr(g, jx - 8, jy - 12, 16, 22, 4); g.fill(); g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 1.5; g.stroke(); g.fillStyle = '#8a6a3a'; g.fillRect(jx - 7, jy - 15, 14, 4); for (let q = 0; q < Math.min(6, b.n); q++) { g.fillStyle = '#f4ffb0'; g.beginPath(); g.arc(jx - 4 + (q % 3) * 4, jy + 4 - Math.floor(q / 3) * 6 + Math.sin(m.t * 6 + q) * 1.5, 1.8, 0, 7); g.fill(); }
      // butterfly net: swings in an arc when used
      const base = Math.atan2(f.y, f.x), swing = b.sw > 0 ? (1 - b.sw / 0.28) * 2.4 - 1.2 : -0.8, ang = base + swing * (f.x >= 0 ? 1 : -1);
      const hx = b.x + Math.cos(base) * 12, hy = b.y - 10, nx = hx + Math.cos(ang) * 46, ny = hy + Math.sin(ang) * 32;
      g.strokeStyle = '#a8703a'; g.lineWidth = 4; g.beginPath(); g.moveTo(hx, hy); g.lineTo(nx, ny); g.stroke();
      g.strokeStyle = '#e8e8f0'; g.lineWidth = 2.5; g.beginPath(); g.ellipse(nx + Math.cos(ang) * 12, ny + Math.sin(ang) * 8, 14, 10, ang, 0, 7); g.stroke();
      g.fillStyle = 'rgba(240,240,255,0.35)'; g.beginPath(); g.ellipse(nx + Math.cos(ang) * 16, ny + Math.sin(ang) * 10 + 6, 11, 13, ang, 0, 7); g.fill();
      if (b.sw > 0) { g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 3; g.beginPath(); g.arc(hx, hy, 50, ang - 0.8 * (f.x >= 0 ? 1 : -1), ang); g.stroke(); }
    } }));
    ents.sort((a, b) => a.y - b.y).forEach(e => e.f());
    g.drawImage(dk, 0, 0, 1280, 720);
    // glowing bugs stay visible above the dark when they light up
    g.save(); g.globalCompositeOperation = 'lighter'; S.bugs.forEach(q => { if (!this.lit(q)) return; const a = 0.6 + 0.4 * Math.sin(q.ph * 8); MGH.glow(g, q.x, q.y, q.moth ? 34 : 26, q.moth ? `rgba(120,180,255,${a})` : `rgba(220,255,120,${a})`); g.fillStyle = q.moth ? '#e0f0ff' : '#fbffd0'; g.beginPath(); g.arc(q.x, q.y, q.moth ? 4 : 3, 0, 7); g.fill(); }); S.b.forEach((b, i) => MGH.glow(g, b.x - 22, b.y + 4, 16 + b.n * 2, 'rgba(230,255,140,0.35)')); g.restore();
    m.players.forEach((p, i) => { g.fillStyle = 'rgba(0,0,0,0.45)'; MGH.rr(g, 160 + i * 320 - 70, 206, 140, 28, 14); g.fill(); MGH.text(g, `${p.name} ✨ ${S.b[i].n}`, 160 + i * 320, 226, 17, p.color, 'center', 'bold'); });
  },
});
