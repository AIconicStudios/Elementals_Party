'use strict';
// Replacement games: Night Fright, Ice Cream Cone, Splash Zone

// ======================================================================== NIGHT FRIGHT (turn around at the last moment)
MG.def({
  id: 'nightfright', name: 'Night Fright', type: 'Timing', controls: '1 button', dur: 0,
  rows: [['a', 'Spin round with your lantern!']],
  how: 'Walking home through the dark wood… something is creeping up behind you! Press A to spin round and shine your lantern on it. The CLOSER it is when you turn, the braver you are — closest scores 3, then 2, then 1. But wait too long and it GRABS you (no points)! It usually creeps slowly… but sometimes it stops, sometimes it backs off, and now and then it suddenly dashes. Five frights!',
  wins: 'Most bravery points after five rounds.',
  init(m, S) { S.pts = [0, 0, 0, 0]; S.round = 0; this.next(S); },
  next(S) {
    S.round++; S.ph = 'wait'; S.pt = 0; S.d = 100; S.seg = 0; S.segT = 0;
    // the same sneaky pattern for everyone, so it's fair: creep, pause, back off, dash…
    S.plan = []; let left = 100; while (left > -40) { const r = Math.random(); let s; if (r < 0.5) s = { k: 'creep', v: R.range(9, 17), t: R.range(0.8, 2) }; else if (r < 0.7) s = { k: 'pause', v: 0, t: R.range(0.4, 1.4) }; else if (r < 0.82 && left < 80) s = { k: 'back', v: -R.range(8, 16), t: R.range(0.4, 0.8) }; else s = { k: 'dash', v: R.range(45, 70) * (S.round > 2 ? 1.2 : 1), t: R.range(0.15, 0.3) }; S.plan.push(s); left -= s.v * s.t; }
    S.p = [0, 1, 2, 3].map(() => ({ turned: -1, caught: false, sc: 0, react: R.range(10, 26), w: 0 }));
  },
  update(m, S, dt) {
    S.pt += dt;
    if (S.ph === 'wait') { if (S.pt > 1.6) { S.ph = 'creep'; S.pt = 0; } return; }
    if (S.ph === 'creep') {
      const s = S.plan[Math.min(S.seg, S.plan.length - 1)]; S.d = Math.max(-1, S.d - s.v * dt); S.segT += dt; if (S.segT > s.t) { S.segT = 0; S.seg++; }
      if (Math.random() < dt * 3) Sfx.tone(R.range(80, 120), 0.08, 'sine', 0.02);
      S.p.forEach((P, i) => { if (P.turned >= 0 || P.caught) return; if (m.pressed(i, 'a')) { P.turned = Math.max(0, S.d); Sfx.tone(900, 0.08, 'triangle', 0.04); } else if (S.d <= 0) { P.caught = true; Sfx.boom(); } });
      if (S.p.every(P => P.turned >= 0 || P.caught)) {
        const ok = [0, 1, 2, 3].filter(i => !S.p[i].caught).sort((a, b) => S.p[a].turned - S.p[b].turned);
        ok.forEach((i, k) => { S.p[i].sc = [3, 2, 1, 0][k]; S.pts[i] += S.p[i].sc; });
        S.ph = 'show'; S.pt = 0;
      }
      return;
    }
    if (S.pt > 3) { if (S.round >= 5) m.finish(S.pts.slice()); else this.next(S); }
  },
  bot(m, S, i) {
    const P = S.p[i], v = m.vin[i]; v.a = false; if (S.ph !== 'creep' || P.turned >= 0 || P.caught) return;
    const s = S.plan[Math.min(S.seg, S.plan.length - 1)], danger = s.k === 'dash' ? 35 : 0;
    if (S.d < P.react + danger) { v.a = true; P.react = R.range(6, 26); }
  },
  score(m, S) { return S.pts.slice(); },
  fmt(s) { return `${s} pts`; },
  hud(m, S, i) { return `${S.pts[i]} pts`; },
  draw(m, S, g) {
    g.fillStyle = MGH.grad(g, 0, 720, ['#050814', '#0e1428', '#141a2a']); g.fillRect(0, 0, 1280, 720); MGH.stars(g, m.t, 60, 300);
    g.fillStyle = '#e8e4c8'; g.beginPath(); g.arc(1120, 110, 34, 0, 7); g.fill(); g.fillStyle = '#050814'; g.beginPath(); g.arc(1106, 100, 30, 0, 7); g.fill();
    for (let k = 0; k < 12; k++) { const x = k * 115 - 20, h = 260 + (k % 3) * 60; g.fillStyle = '#080c18'; g.fillRect(x + 40, 620 - h, 18, h); g.beginPath(); g.moveTo(x, 620 - h + 120); g.lineTo(x + 49, 620 - h - 40); g.lineTo(x + 98, 620 - h + 120); g.fill(); g.beginPath(); g.moveTo(x + 6, 620 - h + 190); g.lineTo(x + 49, 620 - h + 40); g.lineTo(x + 92, 620 - h + 190); g.fill(); }
    g.fillStyle = '#1a2018'; g.fillRect(0, 600, 1280, 120);
    for (let k = 0; k < 20; k++) { const x = (k * 71 + m.t * 8) % 1300, y = 200 + (k * 47) % 360; g.fillStyle = `rgba(200,255,150,${0.3 + 0.3 * Math.sin(m.t * 3 + k)})`; g.beginPath(); g.arc(x, y, 2, 0, 7); g.fill(); }
    for (let i = 0; i < 4; i++) {
      const P = S.p[i], p = m.players[i], x = 220 + i * 280, y = 560, turned = P.turned >= 0;
      const d = turned ? P.turned : Math.max(0, S.d), sx = x - 30 - d * 1.9, glow = turned;
      // the creeping shadow thing: a wobbly dark blob with glowing eyes
      if (S.ph !== 'wait') { const grab = P.caught; g.save(); g.translate(grab ? x - 20 : sx, y - 10); const wob = Math.sin(m.t * 6 + i) * 3; g.fillStyle = glow ? '#3a2a5a' : 'rgba(10,8,20,0.95)'; g.beginPath(); g.moveTo(-34, 30); g.quadraticCurveTo(-40, -50 + wob, 0, -64 + wob); g.quadraticCurveTo(40, -50 - wob, 34, 30); for (let k = 0; k < 4; k++) g.quadraticCurveTo(26 - k * 17, 20, 17 - k * 17, 30); g.fill(); g.fillStyle = glow ? '#fff' : '#ffe040'; g.beginPath(); g.ellipse(-10, -30 + wob, 6, glow ? 8 : 4, 0, 0, 7); g.ellipse(12, -30 + wob, 6, glow ? 8 : 4, 0, 0, 7); g.fill(); if (glow) { g.fillStyle = '#222'; g.beginPath(); g.arc(-10, -28, 3, 0, 7); g.arc(12, -28, 3, 0, 7); g.fill(); MGH.text(g, 'eek!', 0, -76, 16, '#fff', 'center', 'bold'); } else { g.strokeStyle = 'rgba(10,8,20,0.9)'; g.lineWidth = 6; g.beginPath(); g.moveTo(26, -10); g.quadraticCurveTo(50, -20 + wob, 58, -4); g.stroke(); } g.restore(); }
      if (glow) { const gr = g.createRadialGradient(x - 10, y - 30, 10, x - 10, y - 30, 200); gr.addColorStop(0, 'rgba(255,230,150,0.45)'); gr.addColorStop(1, 'rgba(255,230,150,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(x - 10, y - 30); g.arc(x - 10, y - 30, 200, Math.PI - 0.45, Math.PI + 0.45); g.closePath(); g.fill(); }
      MGH.glow(g, x + (turned ? -26 : 26), y - 34, 40, 'rgba(255,210,120,0.5)');
      Char.draw(g, x, y - 40, 32, p.el.id, p.color, { mood: MGH.persona(P.caught ? 'scared' : turned ? (P.sc === 3 ? 'proud' : 'determined') : S.d < 30 ? 'nervous' : 'happy', p.el.id), seed: i * 1.7, look: { x: turned ? -1 : 1, y: 0 }, walk: S.ph === 'creep' && !turned && !P.caught ? 1 : 0, hands: { n: { x: turned ? -1.1 : 1.1, y: -0.3, d: turned ? 180 : 0, o: true, m: true }, f: { x: 0.5, y: 0.3, d: 90, o: true, m: false } } });
      g.fillStyle = '#c8a040'; g.fillRect(x + (turned ? -42 : 30), y - 46, 12, 16);
      MGH.text(g, `${p.name}  ${S.pts[i]}`, x, 680, 18, p.color, 'center', 'bold');
      if (S.ph === 'show') MGH.label(g, P.caught ? 'GRABBED!' : `${Math.round(P.turned)} paces · +${P.sc}`, x, 400, 18, P.caught ? '#ff8a8a' : P.sc === 3 ? '#ffe680' : '#fff');
    }
    MGH.label(g, `Fright ${S.round} of 5` + (S.ph === 'wait' ? ' — something\'s coming…' : ''), 640, 70, 22, '#c8d0ff');
  },
});

// ======================================================================== ICE CREAM CONE (catch the scoops where their shadows fall)
MG.def({
  id: 'icecone', name: 'Ice Cream Cone', type: 'Coins', controls: 'Move', dur: 45, view: [190, 195, 1090, 673],
  rows: [['stick', 'Run with your cone']],
  how: 'Ice-cream scoops are raining down in the parlour! Watch the floor: a SHADOW shows where each scoop will land, and it grows as the scoop gets close. Get your cone under it to catch it — first cone there gets it! The taller your stack, the slower you run. Golden scoops count triple; green YUCK scoops knock two off your stack.',
  wins: 'Tallest ice cream.',
  init(m, S) { S.b = [0, 1, 2, 3].map(i => Object.assign(MGH.body(420 + (i % 2) * 440, 340 + Math.floor(i / 2) * 200, 24), { stack: [], fx: '', fxT: 0 })); S.drops = []; S.sp = 0; },
  update(m, S, dt) {
    S.sp -= dt; if (S.sp <= 0) { S.sp = Math.max(0.28, 0.75 - m.t * 0.008); const r = Math.random(); S.drops.push({ x: R.range(240, 1040), y: R.range(265, 630), t: 0, T: R.range(1.2, 1.7), k: r < 0.1 ? 'gold' : r < 0.22 ? 'yuck' : 'n', col: R.pick(['#ffd0e0', '#fff4c8', '#a86a3a', '#c8f0ff', '#ffb8d8', '#c8ffb0']) }); }
    S.b.forEach((b, i) => { b.fxT -= dt; const a = m.axis(i), sp = 320 / (1 + b.stack.length * 0.07); MGH.steer(b, a.x, a.y, dt, 2200, sp, 8); MGH.integrate(b, dt, 215, 240, 1065, 650); });
    MGH.collide(S.b, 0.6);
    S.drops.forEach(d => {
      d.t += dt; if (d.t < d.T || d.done) return; d.done = true;
      const who = S.b.map((b, i) => ({ i, d: dist(b.x, b.y - 10, d.x, d.y) })).filter(o => o.d < 40).sort((a, b) => a.d - b.d)[0];
      if (!who) { MGH.burst(d.x, d.y, [d.k === 'yuck' ? '#7ab84a' : d.col, '#fff'], 8, { speed: 120 }); Sfx.tone(200, 0.05, 'sine', 0.02); return; }
      const b = S.b[who.i];
      if (d.k === 'yuck') { b.stack = b.stack.slice(0, Math.max(0, b.stack.length - 2)); b.fx = 'YUCK! −2'; b.fxT = 1; Sfx.bad(); }
      else { const n = d.k === 'gold' ? 3 : 1; for (let k = 0; k < n; k++) b.stack.push(d.k === 'gold' ? '#ffd34d' : d.col); b.fx = d.k === 'gold' ? 'GOLDEN +3!' : '+1'; b.fxT = 0.7; Sfx.pop(); }
    });
    S.drops = S.drops.filter(d => !d.done);
  },
  bot(m, S, i) {
    const b = S.b[i];
    const tg = S.drops.filter(d => d.k !== 'yuck' && !d.done).map(d => ({ d, eta: d.T - d.t, need: dist(d.x, d.y, b.x, b.y) / (300 / (1 + b.stack.length * 0.07)) })).filter(o => o.need < o.eta + 0.2).sort((p, q) => (p.d.k === 'gold' ? -1 : 0) - (q.d.k === 'gold' ? -1 : 0) || p.eta - q.eta)[0];
    const yuck = S.drops.find(d => d.k === 'yuck' && d.T - d.t < 0.6 && dist(d.x, d.y, b.x, b.y) < 60);
    if (yuck) { MGH.aim(m, i, b.x + (b.x - yuck.x) * 3, b.y + (b.y - yuck.y) * 3, b, 4); return; }
    if (tg) MGH.aim(m, i, tg.d.x, tg.d.y + 10, b, 6); else MGH.aim(m, i, 640, 420, b, 60);
  },
  score(m, S) { return S.b.map(b => b.stack.length); },
  fmt(s) { return `${s} scoops`; },
  hud(m, S, i) { return `🍦 ${S.b[i].stack.length}`; },
  draw(m, S, g) {
    g.fillStyle = '#f4d8e0'; g.fillRect(0, 0, 1280, 720);
    for (let x = 0; x < 1280; x += 60) for (let y = 150; y < 720; y += 60) { g.fillStyle = (Math.round(x / 60) + Math.round((y - 150) / 60)) % 2 ? '#fff4f8' : '#ffb8d4'; g.fillRect(x, y, 60, 60); g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(x + 4, y + 4, 52, 6); }
    g.strokeStyle = '#e86a98'; g.lineWidth = 8; g.strokeRect(205, 230, 870, 430);
    g.fillStyle = MGH.grad(g, 40, 150, ['#ff8ab8', '#e86a98']); g.fillRect(0, 40, 1280, 110); for (let x = 0; x < 1280; x += 80) { g.fillStyle = (x / 80) % 2 ? '#fff' : '#ff8ab8'; g.beginPath(); g.moveTo(x, 150); g.lineTo(x + 80, 150); g.lineTo(x + 40, 180); g.fill(); }
    MGH.text(g, '🍨 Scoop Parlour 🍨', 640, 110, 34, '#fff', 'center', 'bold');
    S.drops.forEach(d => { const k = d.t / d.T; g.fillStyle = `rgba(80,30,60,${0.15 + 0.35 * k})`; g.beginPath(); g.ellipse(d.x, d.y, 10 + 22 * k, 5 + 9 * k, 0, 0, 7); g.fill(); if (k > 0.55) { const yy = d.y - (1 - k) * 600 - 20; g.fillStyle = d.k === 'yuck' ? '#7ab84a' : d.k === 'gold' ? '#ffd34d' : d.col; g.beginPath(); g.arc(d.x, yy, 16, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.arc(d.x - 5, yy - 5, 4, 0, 7); g.fill(); if (d.k === 'gold') MGH.spark(g, d.x + 8, yy - 8, 3, '#fff'); if (d.k === 'yuck') { g.fillStyle = '#4a7a2a'; g.beginPath(); g.arc(d.x - 4, yy + 2, 3, 0, 7); g.fill(); } } });
    const ents = S.b.map((b, i) => ({ y: b.y, f: () => {
      const p = m.players[i], n = b.stack.length; MGH.shadow(g, b.x, b.y + 28, 22, 0.25);
      Char.draw(g, b.x, b.y - 8, 26, p.el.id, p.color, { mood: MGH.persona(b.fxT > 0 && b.fx.startsWith('YUCK') ? 'hurt' : n > 8 ? 'effort' : 'happy', p.el.id), seed: i * 1.7, look: b.face, walk: Math.hypot(b.vx, b.vy) > 30 ? 1 : 0, hands: { n: { x: 0.2, y: -1.8, d: -90, o: true, m: true }, f: { x: -0.2, y: -1.8, d: -90, o: true, m: false } } });
      const cx = b.x, cy = b.y - 64; g.fillStyle = '#d8a060'; g.beginPath(); g.moveTo(cx - 13, cy); g.lineTo(cx + 13, cy); g.lineTo(cx, cy + 26); g.fill(); g.strokeStyle = 'rgba(120,70,20,0.4)'; g.lineWidth = 1; g.beginPath(); g.moveTo(cx - 8, cy); g.lineTo(cx + 2, cy + 18); g.moveTo(cx + 8, cy); g.lineTo(cx - 2, cy + 18); g.stroke();
      const sway = Math.sin(m.t * 3 + i) * Math.min(6, n * 0.4);
      b.stack.forEach((c, k) => { const sx = cx + sway * k / Math.max(1, n), sy = cy - 8 - k * 15; g.fillStyle = c; g.beginPath(); g.arc(sx, sy, 13, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,0.4)'; g.beginPath(); g.arc(sx - 4, sy - 4, 3.5, 0, 7); g.fill(); });
      if (n) { g.fillStyle = '#e8323e'; g.beginPath(); g.arc(cx + sway, cy - 16 - (n - 1) * 15, 5, 0, 7); g.fill(); }
      if (b.fxT > 0) MGH.text(g, b.fx, b.x, cy - 30 - n * 15, 16, b.fx.startsWith('YUCK') ? '#4a8a2a' : '#e8508a', 'center', 'bold');
    } }));
    ents.sort((a, b) => a.y - b.y).forEach(e => e.f());
  },
});

// ======================================================================== SPLASH ZONE (water-pistol showdown on a sky fountain)
MG.def({
  id: 'splashzone', name: 'Splash Zone', type: 'Arena', controls: 'Move + A & B', dur: 60,
  rows: [['stick', 'Move'], ['a', 'Squirt (hold for a power blast)'], ['b', 'Hold to refill at the fountain']],
  how: 'A round fountain floating high in the sky! Everyone has a water pistol. TAP A to squirt (it pushes rivals back a little and uses a drop of water); HOLD A and let go for a POWER BLAST that uses all your water but shoves much harder. Keep pushing someone and they\'ll slide right off the edge! Your tank empties fast — hold B near the middle fountain to refill. Three lives each.',
  wins: 'Last one on the fountain (or most lives left).',
  CX: 640, CY: 400, RR: 230, view: [310, 110, 970, 700],
  init(m, S) { S.b = [0, 1, 2, 3].map(i => { const a = i * Math.PI / 2 + Math.PI / 4; return Object.assign(MGH.body(this.CX + Math.cos(a) * 130, this.CY + Math.sin(a) * 110, 22), { water: 10, hold: 0, cd: 0, lives: 3, fall: 0, inv: 1, last: -1, aim: { x: -Math.cos(a), y: -Math.sin(a) }, fill: 0 }); }); S.jets = []; S.order = []; },
  update(m, S, dt) {
    S.b.forEach((b, i) => {
      if (b.lives <= 0) return; b.cd -= dt; b.inv -= dt;
      if (b.fall > 0) { b.fall -= dt; if (b.fall <= 0) { if (b.lives > 0) { b.x = this.CX + R.range(-60, 60); b.y = this.CY + R.range(-40, 40); b.vx = b.vy = 0; b.kx = b.ky = 0; b.inv = 1.5; b.water = 10; } } return; }
      const a = m.axis(i); if (Math.hypot(a.x, a.y) > 0.3) b.aim = { x: a.x / Math.hypot(a.x, a.y), y: a.y / Math.hypot(a.x, a.y) };
      b.fill = m.held(i, 'b') && dist(b.x, b.y, this.CX, this.CY) < 90 ? b.fill + dt : 0; if (b.fill > 0.25 && b.water < 10) { b.water = Math.min(10, b.water + dt * 6); if (Math.random() < dt * 6) Sfx.tone(500 + b.water * 30, 0.03, 'sine', 0.015); }
      MGH.steer(b, b.fill > 0 ? 0 : a.x, b.fill > 0 ? 0 : a.y, dt, 1600, 230, 2.4);
      if (m.held(i, 'a') && b.water > 0) b.hold += dt;
      else if (b.hold > 0) { const power = b.hold > 0.45 && b.water >= 3; const use = power ? b.water : 1; if (b.water >= 1) { b.water -= use; S.jets.push({ x: b.x + b.aim.x * 26, y: b.y - 14 + b.aim.y * 26, vx: b.aim.x * 640, vy: b.aim.y * 640, t: 0, own: i, push: power ? 140 + use * 70 : 170, big: power }); Sfx.noise(power ? 0.4 : 0.12, 2200, power ? 0.1 : 0.04, 'bandpass'); b.kx = (b.kx || 0) - b.aim.x * (power ? 160 : 20); b.ky = (b.ky || 0) - b.aim.y * (power ? 160 : 20); } b.hold = 0; b.cd = 0.15; }
      MGH.integrate(b, dt, null); // no walls: the edge is a drop!
      b.x += (b.kx || 0) * dt; b.y += (b.ky || 0) * dt; b.kx = (b.kx || 0) * Math.exp(-2.4 * dt); b.ky = (b.ky || 0) * Math.exp(-2.4 * dt);
      if (dist(b.x, b.y, this.CX, this.CY) > this.RR + 6) { b.lives--; b.fall = 1.6; Sfx.noise(0.6, 600, 0.08, 'lowpass'); if (b.last >= 0) S.b[b.last].ko = (S.b[b.last].ko || 0) + 1; if (b.lives <= 0) S.order.push(i); }
    });
    S.jets.forEach(j => { j.t += dt; j.x += j.vx * dt; j.y += j.vy * dt; S.b.forEach((o, k) => { if (k === j.own || j.dead || o.lives <= 0 || o.fall > 0 || o.inv > 0) return; if (dist(o.x, o.y - 14, j.x, j.y) < (j.big ? 34 : 26)) { j.dead = true; const l = Math.hypot(j.vx, j.vy); o.kx = (o.kx || 0) + j.vx / l * j.push * 2.1; o.ky = (o.ky || 0) + j.vy / l * j.push * 2.1; o.last = j.own; Sfx.tone(300, 0.06, 'sine', 0.03); MGH.burst(j.x, j.y, ['#9fe0ff', '#fff'], j.big ? 18 : 6, { speed: 180 }); } }); });
    S.jets = S.jets.filter(j => !j.dead && j.t < (j.big ? 0.55 : 0.4));
    for (let x = 0; x < 4; x++) for (let y = x + 1; y < 4; y++) { const A = S.b[x], B = S.b[y]; if (A.lives <= 0 || B.lives <= 0 || A.fall > 0 || B.fall > 0) continue; const dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy) || 1, mn = A.r + B.r; if (d < mn) { const o = (mn - d) / 2; A.x -= dx / d * o; A.y -= dy / d * o; B.x += dx / d * o; B.y += dy / d * o; } }
    if (S.b.filter(b => b.lives > 0).length <= 1) m.finish(this.score(m, S));
  },
  bot(m, S, i) {
    const b = S.b[i], v = m.vin[i]; v.a = v.b = false; if (b.lives <= 0 || b.fall > 0) return;
    if (!b.pers) b.pers = { agg: R.range(0.3, 1), side: R.pick([-1, 1]) };
    const dc = dist(b.x, b.y, this.CX, this.CY);
    if (b.water < 1.5 || (b.water < 5 && dc < 100 && Math.random() < 0.02)) { if (dc > 70) MGH.aim(m, i, this.CX, this.CY, b, 6); else { v.ax = v.ay = 0; v.b = true; } return; }
    if (b.tg === undefined || S.b[b.tg].lives <= 0 || S.b[b.tg].fall > 0 || Math.random() < 0.004) { const o = [0, 1, 2, 3].filter(k => k !== i && S.b[k].lives > 0 && S.b[k].fall <= 0); if (!o.length) return; b.tg = R.pick(o); }
    const t = S.b[b.tg], d = dist(t.x, t.y, b.x, b.y), td = dist(t.x, t.y, this.CX, this.CY);
    // circle to the middle side of the target so the shots push it outward
    const ux = (t.x - this.CX) / (td || 1), uy = (t.y - this.CY) / (td || 1), gx = t.x - ux * 135 - uy * 50 * b.pers.side, gy = t.y - uy * 105 + ux * 50 * b.pers.side;
    if (dc > this.RR - 60) MGH.aim(m, i, this.CX, this.CY, b, 10); else MGH.aim(m, i, gx, gy, b, 14);
    if (d < 280) { const ax = (t.x - b.x) / d, ay = (t.y - b.y) / d; if (b.hold <= 0) { if (b.cd <= 0 && Math.random() < 0.15 * b.pers.agg) { v.ax = ax; v.ay = ay; v.a = true; } } else { v.ax = ax; v.ay = ay; v.a = td > this.RR * 0.55 && b.water >= 4 ? b.hold < 0.55 : false; } }
  },
  score(m, S) { return S.b.map((b, i) => b.lives > 0 ? 10 + b.lives : S.order.indexOf(i) + 1); },
  fmt(s) { return s >= 10 ? `${s - 10} lives left` : `out #${s}`; },
  hud(m, S, i) { const b = S.b[i]; return b.lives > 0 ? '💧'.repeat(b.lives) : 'out'; },
  draw(m, S, g) {
    g.fillStyle = MGH.grad(g, 0, 720, ['#5ab0f0', '#a8dcff', '#e8f6ff']); g.fillRect(0, 0, 1280, 720);
    for (let k = 0; k < 8; k++) MGH.cloud(g, ((k * 230 + m.t * 12) % 1500) - 110, 600 + (k % 3) * 40, 1.6);
    const { CX, CY, RR } = this;
    g.fillStyle = 'rgba(40,80,140,0.25)'; g.beginPath(); g.ellipse(CX, CY + 40, RR + 20, (RR + 20) * 0.78, 0, 0, 7); g.fill();
    g.fillStyle = MGH.grad(g, CY, CY + 120, ['#d8dce8', '#8a90a8']); g.beginPath(); g.ellipse(CX, CY + 24, RR + 6, (RR + 6) * 0.72, 0, 0, 7); g.fill();
    g.fillStyle = MGH.grad(g, CY - RR * 0.7, CY + RR * 0.7, ['#9fe0ff', '#4aa8e8']); g.beginPath(); g.ellipse(CX, CY, RR, RR * 0.72, 0, 0, 7); g.fill();
    g.strokeStyle = '#f4f6fa'; g.lineWidth = 10; g.stroke();
    for (let k = 0; k < 6; k++) { g.strokeStyle = 'rgba(255,255,255,0.3)'; g.lineWidth = 2; g.beginPath(); g.ellipse(CX, CY, RR * (0.3 + k * 0.12) + Math.sin(m.t * 2 + k) * 4, (RR * (0.3 + k * 0.12)) * 0.72, 0, 0, 7); g.stroke(); }
    g.fillStyle = '#e8ecf4'; g.beginPath(); g.ellipse(CX, CY, 70, 50, 0, 0, 7); g.fill(); g.fillStyle = '#5ab8f0'; g.beginPath(); g.ellipse(CX, CY - 4, 54, 36, 0, 0, 7); g.fill();
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2 + m.t, h = 50 + Math.sin(m.t * 4 + k) * 10; g.strokeStyle = 'rgba(200,240,255,0.8)'; g.lineWidth = 4; g.beginPath(); g.moveTo(CX, CY - 10); g.quadraticCurveTo(CX + Math.cos(a) * 30, CY - 10 - h, CX + Math.cos(a) * 46, CY - 4 + Math.sin(a) * 20); g.stroke(); }
    MGH.text(g, 'refill', CX, CY + 66, 14, 'rgba(40,80,140,0.7)', 'center', 'bold');
    S.jets.forEach(j => { g.fillStyle = 'rgba(180,230,255,0.85)'; g.beginPath(); g.arc(j.x, j.y, j.big ? 16 : 8, 0, 7); g.fill(); g.strokeStyle = 'rgba(180,230,255,0.5)'; g.lineWidth = j.big ? 12 : 5; g.beginPath(); g.moveTo(j.x, j.y); g.lineTo(j.x - j.vx * 0.05, j.y - j.vy * 0.05); g.stroke(); });
    const ents = S.b.map((b, i) => ({ y: b.y, f: () => {
      if (b.lives <= 0) return; const p = m.players[i];
      if (b.fall > 0) { const k = 1 - b.fall / 1.6; g.globalAlpha = 1 - k; Char.draw(g, b.x, b.y - 30 + k * 400, 22, p.el.id, p.color, { mood: 'scared', seed: i }); g.globalAlpha = 1; return; }
      if (b.inv > 0 && Math.floor(m.t * 12) % 2) return;
      MGH.shadow(g, b.x, b.y + 26, 20, 0.25);
      Char.draw(g, b.x, b.y - 6, 24, p.el.id, p.color, { mood: MGH.persona(b.hold > 0.45 ? 'effort' : b.fill > 0 ? 'happy' : 'determined', p.el.id), seed: i * 1.7, look: b.aim, walk: Math.hypot(b.vx, b.vy) > 40 ? 1 : 0 });
      g.save(); g.translate(b.x + b.aim.x * 18, b.y - 14 + b.aim.y * 14); g.rotate(Math.atan2(b.aim.y, b.aim.x)); g.fillStyle = p.color; MGH.rr(g, -4, -7, 26, 12, 4); g.fill(); g.fillStyle = '#ffd34d'; g.fillRect(18, -4, 8, 6); g.restore();
      g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(b.x - 20, b.y + 34, 40, 6); g.fillStyle = '#5ab8ff'; g.fillRect(b.x - 20, b.y + 34, 40 * b.water / 10, 6);
      if (b.hold > 0.45 && b.water >= 3) MGH.glow(g, b.x, b.y - 10, 40, 'rgba(120,200,255,0.6)');
    } }));
    ents.sort((a, b) => a.y - b.y).forEach(e => e.f());
    m.players.forEach((p, i) => MGH.text(g, `${p.name} ${'💧'.repeat(Math.max(0, S.b[i].lives))}`, 160 + i * 320, 70, 18, p.color, 'center', 'bold'));
  },
});
