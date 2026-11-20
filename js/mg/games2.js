'use strict';
// Moot minigames 11-20

// 12 ---------------------------------------------------------------- Ankar's Chase
MG.def({
  id: 'chase', name: "Ankar's Chase", type: 'Survival', controls: 'Move', dur: 40,
  how: 'The Ankar hunts each of you in turn — it picks a victim, stalks them, then crouches and POUNCES. A touched player is frozen for 3 seconds. Watch who it is staring at!',
  wins: 'Fewest freezes (tie: most time free).',
  init(m, S) {
    S.b = [0, 1, 2, 3].map(i => Object.assign(MGH.body(160 + (i % 2) * 960, 160 + Math.floor(i / 2) * 420, 25), { frozen: 0, imm: 0, fr: 0, free: 0 }));
    S.a = Object.assign(MGH.body(640, 380, 30), { tgt: -1, tt: 0, chased: [0, 0, 0, 0], wind: 0, dash: 0, pcd: 2, ang: 0 });
  },
  update(m, S, dt) {
    S.b.forEach((b, i) => {
      if (b.frozen > 0) { b.frozen -= dt; b.vx = b.vy = 0; if (b.frozen <= 0) b.imm = 1.2; return; }
      b.free += dt; b.imm -= dt;
      const a = m.axis(i); MGH.steer(b, a.x, a.y, dt, 2400, 300, 8); MGH.integrate(b, dt);
    });
    MGH.collide(S.b, 0.5);
    // the hunter: picks the player it has chased least, stalks them for a while, then pounces
    const A = S.a, ok = j => S.b[j].frozen <= 0 && S.b[j].imm <= 0;
    A.tt -= dt; A.pcd -= dt;
    if (A.tgt < 0 || A.tt <= 0 || !ok(A.tgt)) {
      const c = [0, 1, 2, 3].filter(ok).sort((p, q) => A.chased[p] - A.chased[q] + R.range(-0.6, 0.6));
      if (c.length) { if (c[0] !== A.tgt) Sfx.tone(140, 0.25, 'sawtooth', 0.04, -40); A.tgt = c[0]; A.tt = R.range(3, 4.5); } else A.tgt = -1;
    }
    const sp = 190 + m.t * 3;
    if (A.tgt >= 0) {
      const t = S.b[A.tgt]; A.chased[A.tgt] += dt;
      const dx = t.x - A.x, dy = t.y - A.y, d = Math.hypot(dx, dy) || 1;
      A.ang = Math.atan2(dy, dx);
      if (A.dash > 0) { A.dash -= dt; }
      else if (A.wind > 0) { A.wind -= dt; A.vx *= 0.85; A.vy *= 0.85; if (A.wind <= 0) { A.dash = 0.38; A.vx = dx / d * sp * 2.6; A.vy = dy / d * sp * 2.6; Sfx.tone(90, 0.35, 'sawtooth', 0.07, 60); MGH.burst(A.x, A.y, ['#b46bff', '#3a1a5c'], 14, { speed: 200 }); } }
      else {
        // stalking: weave a little instead of flying straight like a missile
        const wv = Math.sin(m.t * 3.1) * 0.55, ux = dx / d, uy = dy / d, sx = ux - uy * wv, sy = uy + ux * wv;
        A.vx += (sx * sp - A.vx) * Math.min(1, dt * 2.6); A.vy += (sy * sp - A.vy) * Math.min(1, dt * 2.6);
        if (d < 250 && A.pcd <= 0) { A.wind = 0.55; A.pcd = R.range(2.6, 3.6); }
      }
    } else { A.vx *= 0.95; A.vy *= 0.95; }
    A.x = clamp(A.x + A.vx * dt, 40, 1240); A.y = clamp(A.y + A.vy * dt, 80, 690);
    S.b.forEach((b, i) => {
      if (b.frozen <= 0 && b.imm <= 0 && dist(b.x, b.y, S.a.x, S.a.y) < b.r + S.a.r) { b.frozen = 3; b.fr++; MGH.burst(b.x, b.y, ['#bfe9ff', '#ffffff', '#7fc8ff'], 24, { speed: 260, kind: 'spark', size: 3 }); MGH.shake(5); if (!m.bot(i)) Sfx.bad(); }
    });
  },
  bot(m, S, i) {
    const b = S.b[i]; if (b.frozen > 0) return;
    let ax = b.x - S.a.x, ay = b.y - S.a.y; const d = Math.hypot(ax, ay) || 1; ax /= d; ay /= d;
    const wall = 120;
    if (b.x < wall) ax += 1.4; if (b.x > 1280 - wall) ax -= 1.4; if (b.y < 40 + wall) ay += 1.4; if (b.y > 720 - wall) ay -= 1.4;
    ax += -ay * 0.6; ay += ax * 0.3;
    const v = m.vin[i]; v.left = v.right = v.up = v.down = false; v.ax = clamp(ax, -1, 1); v.ay = clamp(ay, -1, 1);
    if (d > 400 && Math.random() < 0.5) { v.ax *= 0.3; v.ay *= 0.3; }
  },
  score(m, S) { return S.b.map(b => -b.fr * 100 + b.free); },
  fmt(s) { const fr = Math.ceil(-s / 100 - 0.0001); return `${Math.max(0, fr)} freezes`; },
  hud(m, S, i) { return `❄${S.b[i].fr}`; },
  draw(m, S, g) {
    MGH.scene(g, 'night', m.t);
    g.fillStyle = 'rgba(40,20,70,0.35)'; g.fillRect(0, 40, 1280, 680);
    const A = S.a, T = A.tgt >= 0 ? S.b[A.tgt] : null;
    if (T) { g.save(); g.setLineDash([6, 10]); g.lineDashOffset = -m.t * 40; g.strokeStyle = `rgba(255,60,100,${A.wind > 0 ? 0.8 : 0.35})`; g.lineWidth = A.wind > 0 ? 4 : 2; g.beginPath(); g.moveTo(A.x, A.y); g.lineTo(T.x, T.y); g.stroke(); g.restore(); MGH.emoji(g, '🎯', T.x, T.y - 62 + Math.sin(m.t * 8) * 3, 22); }
    S.b.forEach((b, i) => { MGH.shadow(g, b.x, b.y + b.r * 1.25, b.r, 0.3); if (b.frozen > 0) { g.fillStyle = 'rgba(180,230,255,0.55)'; g.beginPath(); g.moveTo(b.x - 34, b.y + 30); g.lineTo(b.x - 28, b.y - 40); g.lineTo(b.x, b.y - 52); g.lineTo(b.x + 30, b.y - 38); g.lineTo(b.x + 34, b.y + 30); g.closePath(); g.fill(); } MGH.drawBody(g, b, m.players[i], b.imm > 0 ? '✨' : '', b.frozen > 0 ? 'dizzy' : (i === A.tgt ? 'scared' : dist(b.x, b.y, A.x, A.y) < 220 ? 'nervous' : null)); });
    // the Ankar: wobbling shadow-beast with tentacles and one eye
    g.save(); g.translate(A.x, A.y);
    const crouch = A.wind > 0 ? 1 - A.wind / 0.55 : 0, st = 1 + (A.dash > 0 ? 0.25 : 0) - crouch * 0.15;
    MGH.glow(g, 0, 0, 90 + crouch * 40, A.wind > 0 || A.dash > 0 ? 'rgba(255,40,90,0.55)' : 'rgba(150,80,220,0.45)');
    for (let k = 0; k < 6; k++) { const a = A.ang + Math.PI + (k - 2.5) * 0.35, l = 34 + Math.sin(m.t * 8 + k) * 8; g.strokeStyle = '#2a0f45'; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(Math.cos(a) * 18, Math.sin(a) * 18); g.quadraticCurveTo(Math.cos(a + 0.4) * l, Math.sin(a + 0.4) * l, Math.cos(a) * (l + 16), Math.sin(a) * (l + 16)); g.stroke(); }
    g.lineCap = 'butt'; g.scale(st, 1 / st);
    g.fillStyle = '#3a1a5c'; g.beginPath(); for (let k = 0; k <= 20; k++) { const a = k / 20 * Math.PI * 2, r = 36 + Math.sin(a * 4 + m.t * 6) * 4; g.lineTo(Math.cos(a) * r, Math.sin(a) * r * 0.75); } g.closePath(); g.fill();
    g.fillStyle = '#f3e0ff'; g.beginPath(); g.ellipse(0, -2, 18, 14, 0, 0, 7); g.fill();
    g.fillStyle = A.wind > 0 || A.dash > 0 ? '#ff2a5a' : '#8a3ad0'; g.beginPath(); g.arc(Math.cos(A.ang) * 6, -2 + Math.sin(A.ang) * 5, 8, 0, 7); g.fill();
    g.fillStyle = '#12051f'; g.beginPath(); g.arc(Math.cos(A.ang) * 7, -2 + Math.sin(A.ang) * 6, 3.5, 0, 7); g.fill();
    g.restore();
    if (A.wind > 0) MGH.label(g, '!', A.x, A.y - 50, 30, '#ff6d8d');
  },
});

// 13 ---------------------------------------------------------------- Hot Coal
MG.def({
  id: 'coal', name: 'Hot Coal', type: 'Arena', controls: 'Move + pass',
  how: 'One player holds a burning coal. Touch someone and press to pass it on. After a hidden fuse of 10 to 20 seconds the holder is out. Three rounds.',
  wins: 'Last one in.',
  init(m, S) {
    S.b = [0, 1, 2, 3].map(i => Object.assign(MGH.body(260 + i * 250, 380, 28), { outT: 0 }));
    S.place = 0; this.newRound(m, S);
  },
  newRound(m, S) {
    const alive = S.b.map((b, i) => i).filter(i => S.b[i].alive);
    S.holder = R.pick(alive); S.fuse = R.range(10, 20); S.cool = 0; S.prev = -1; S.pause = 0;
  },
  update(m, S, dt) {
    if (S.pause > 0) { S.pause -= dt; if (S.pause <= 0) this.newRound(m, S); return; }
    S.fuse -= dt; S.cool -= dt;
    S.b.forEach((b, i) => {
      if (!b.alive) return;
      const a = m.axis(i); MGH.steer(b, a.x, a.y, dt, 2400, i === S.holder ? 330 : 300, 8); MGH.integrate(b, dt);
    });
    MGH.collide(S.b, 0.8);
    const h = S.b[S.holder];
    if (m.pressed(S.holder, 'a') && S.cool <= 0) {
      for (let j = 0; j < 4; j++) {
        const o = S.b[j];
        if (j === S.holder || !o.alive || (j === S.prev && S.cool > -0.8)) continue;
        if (dist(h.x, h.y, o.x, o.y) < h.r + o.r + 14) { S.prev = S.holder; S.holder = j; S.cool = 0.4; MGH.burst((h.x + o.x) / 2, (h.y + o.y) / 2, ['#ff9a3d', '#ffd34d'], 12, { speed: 200 }); Sfx.tone(600, 0.08, 'square', 0.05); break; }
      }
    }
    if (S.fuse <= 0) {
      h.alive = false; h.outT = ++S.place; Sfx.boom(); MGH.burst(h.x, h.y, ['#ff5a1f', '#ffd34d', '#ff9a3d', '#333'], 60, { speed: 520 }); MGH.ring(h.x, h.y, '#ffd34d', 20, 200, 0.6); MGH.shake(18);
      if (S.b.filter(b => b.alive).length <= 1) m.finish(this.score(m, S));
      else S.pause = 1.5;
    }
  },
  bot(m, S, i) {
    const b = S.b[i]; if (!b.alive) return;
    const v = m.vin[i]; v.a = false;
    if (i === S.holder) {
      const t = MGH.nearest(b, S.b.filter((o, j) => j !== S.prev || S.cool < -0.8));
      if (t) { MGH.aim(m, i, t.x, t.y, b); if (dist(b.x, b.y, t.x, t.y) < 60) v.a = !m.prev[i].a; }
    } else {
      const h = S.b[S.holder];
      let ax = b.x - h.x, ay = b.y - h.y; const d = Math.hypot(ax, ay) || 1; ax /= d; ay /= d;
      if (b.x < 120) ax += 1.5; if (b.x > 1160) ax -= 1.5; if (b.y < 160) ay += 1.5; if (b.y > 600) ay -= 1.5;
      v.ax = clamp(ax + -ay * 0.5, -1, 1); v.ay = clamp(ay + ax * 0.5, -1, 1);
      if (d > 350) { v.ax *= 0.2; v.ay *= 0.2; }
    }
  },
  score(m, S) { return S.b.map(b => b.alive ? 10 : b.outT); },
  fmt(s) { return s >= 10 ? 'Last one in' : `out #${s}`; },
  hud(m, S, i) { return !S.b[i].alive ? 'out' : (i === S.holder ? '🔥' : ''); },
  draw(m, S, g) {
    MGH.scene(g, 'cave', m.t);
    g.fillStyle = 'rgba(60,30,14,0.6)'; g.beginPath(); g.ellipse(640, 400, 610, 300, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(255,140,60,0.35)'; g.lineWidth = 4; g.stroke();
    const h = S.b[S.holder], fuse = clamp(S.fuse / 15, 0, 1);
    S.b.forEach((b, i) => { if (!b.alive) return; MGH.shadow(g, b.x, b.y + b.r * 1.25, b.r, 0.35); MGH.drawBody(g, b, m.players[i], '', i === S.holder ? 'scared' : (dist(b.x, b.y, h.x, h.y) < 160 ? 'nervous' : 'happy')); });
    if (h && h.alive && S.pause <= 0) {
      const cx = h.x, cy = h.y - 58 + Math.sin(m.t * 10) * 3, shake = (1 - fuse) * 4;
      MGH.glow(g, cx, cy, 70 + (1 - fuse) * 50, `rgba(255,${120 - (1 - fuse) * 80},30,0.6)`);
      MGH.rock(g, cx + Math.sin(m.t * 50) * shake, cy, 16, 3, '#3a2a22', m.t);
      g.strokeStyle = `rgba(255,${200 - (1 - fuse) * 150},60,0.95)`; g.lineWidth = 2; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(cx - 10 + k * 6, cy - 8); g.lineTo(cx - 6 + k * 6, cy + 4); g.stroke(); }
      if (Math.random() < 0.4) MGH.burst(cx, cy, ['#ffd34d', '#ff8a3d'], 1, { speed: 80, up: 60, life: 0.5, size: 2 });
    }
    if (S.pause > 0) MGH.label(g, '💥 BOOM!', 640, 380, 70, '#ffb347');
  },
});

// 14 ---------------------------------------------------------------- Hill of Stars
MG.def({
  id: 'hill', name: 'Hill of Stars', type: 'Arena', controls: 'Move + push', dur: 45,
  how: 'A glowing zone drifts around the arena. Standing in it alone scores. If two stand in it, scoring pauses. Press the button for a mighty shove that blasts rivals away.',
  wins: 'Most seconds held.',
  init(m, S) { S.b = [0, 1, 2, 3].map(i => Object.assign(MGH.body(160 + i * 320, 650, 28), { cd: 0, held: 0, push: 0 })); S.z = { x: 640, y: 380, r: 95 }; S.ph = R.range(0, 6); },
  update(m, S, dt) {
    S.z.x = 640 + Math.sin(m.t * 0.37 + S.ph) * 430; S.z.y = 380 + Math.sin(m.t * 0.53 + S.ph * 2) * 220;
    S.b.forEach((b, i) => {
      const a = m.axis(i); b.stun = (b.stun || 0) - dt; if (b.stun <= 0) MGH.steer(b, a.x, a.y, dt, 2200, 290, 6); else { b.vx *= 0.97; b.vy *= 0.97; } b.cd -= dt; b.push -= dt;
      if (m.pressed(i, 'a') && b.cd <= 0) {
        b.cd = 1; b.push = 0.3; MGH.ring(b.x, b.y, m.players[i].color, 24, 130, 0.4); Sfx.whoosh(true);
        S.b.forEach((o, j) => { if (o === b) return; const d = dist(o.x, o.y, b.x, b.y) || 1; if (d < 135) { o.vx += (o.x - b.x) / d * 1500; o.vy += (o.y - b.y) / d * 1500; o.stun = 0.45; MGH.burst(o.x, o.y, ['#fff', m.players[j].color], 12, { speed: 260, kind: 'spark', size: 3 }); Sfx.punch(); MGH.shake(5); } });
      }
      MGH.integrate(b, dt);
    });
    MGH.collide(S.b, 0.8);
    const inside = S.b.filter(b => dist(b.x, b.y, S.z.x, S.z.y) < S.z.r);
    if (inside.length === 1) inside[0].held += dt;
    S.contested = inside.length > 1;
  },
  bot(m, S, i) {
    const b = S.b[i]; const v = m.vin[i]; v.a = false;
    MGH.aim(m, i, S.z.x + Math.sin(m.t * 0.37 + S.ph + 0.3) * 40, S.z.y, b, 10);
    const n = MGH.nearest(b, S.b); if (n && dist(n.x, n.y, b.x, b.y) < 70 && b.cd <= 0 && Math.random() < 0.1) v.a = true;
  },
  score(m, S) { return S.b.map(b => b.held); },
  fmt(s) { return s.toFixed(1) + ' s'; },
  hud(m, S, i) { return S.b[i].held.toFixed(1) + 's'; },
  draw(m, S, g) {
    MGH.scene(g, 'meadow', m.t);
    g.fillStyle = 'rgba(60,120,40,0.35)'; g.fillRect(0, 40, 1280, 680);
    const z = S.z, c = S.contested;
    MGH.glow(g, z.x, z.y, z.r * 1.8, c ? 'rgba(255,90,90,0.45)' : 'rgba(255,230,120,0.55)');
    g.fillStyle = c ? 'rgba(255,120,120,0.35)' : 'rgba(255,230,128,0.4)'; g.beginPath(); g.arc(z.x, z.y, z.r, 0, 7); g.fill();
    g.save(); g.setLineDash([14, 10]); g.lineDashOffset = -m.t * 30; g.strokeStyle = c ? '#ff8a8a' : '#ffe680'; g.lineWidth = 5; g.beginPath(); g.arc(z.x, z.y, z.r, 0, 7); g.stroke(); g.restore();
    for (let k = 0; k < 6; k++) { const a = m.t + k * 1.05; MGH.star(g, z.x + Math.cos(a) * z.r * 0.7, z.y + Math.sin(a) * z.r * 0.7, 7, '#ffe680', a, false); }
    MGH.star(g, z.x, z.y, 26 + Math.sin(m.t * 4) * 3, '#ffd34d', m.t);
    S.b.forEach((b, i) => {
      if (b.push > 0) { const k = 1 - b.push / 0.3; g.strokeStyle = m.players[i].color; g.lineWidth = 8 * (1 - k); g.beginPath(); g.arc(b.x, b.y, 30 + k * 110, 0, 7); g.stroke(); MGH.emoji(g, '💥', b.x, b.y - 4, 30 * (1 - k)); }
      const inZ = dist(b.x, b.y, z.x, z.y) < z.r;
      MGH.shadow(g, b.x, b.y + b.r * 1.25, b.r, 0.3);
      MGH.drawBody(g, b, m.players[i], '', b.stun > 0 ? 'dizzy' : inZ ? (c ? 'angry' : 'cheer') : null);
    });
  },
});

// 15 ---------------------------------------------------------------- Fireball Dodge
MG.def({
  id: 'fireball', name: 'Fireball Dodge', type: 'Arena', controls: 'Move + fire', dur: 45,
  how: 'Three hearts each. Fire a ball in the direction you face. It bounces once. A hit costs a heart. Grab power-ups that appear: 🛡️ shield (blocks hits for a while), ❤️ extra heart, ⏳ slow-time (everyone and every fireball but yours slows down).',
  wins: 'Last one alive.',
  init(m, S) {
    S.b = [0, 1, 2, 3].map(i => Object.assign(MGH.body(160 + (i % 2) * 960, 180 + Math.floor(i / 2) * 400, 25), { hp: 3, cd: 0, inv: 0, outT: 0 }));
    S.balls = []; S.pu = []; S.puT = 3; S.slow = null;
  },
  slowF(S, i) { return S.slow && S.slow.by !== i ? 0.4 : 1; },
  update(m, S, dt) {
    // power-ups pop up around the arena
    S.puT -= dt;
    if (S.puT <= 0 && S.pu.length < 2) { S.puT = R.range(4.5, 7); S.pu.push({ k: R.pick(['shield', 'life', 'slow']), x: R.range(120, 1160), y: R.range(140, 640), t: 0 }); }
    S.pu.forEach(u => { u.t += dt; });
    if (S.slow) { S.slow.t -= dt; if (S.slow.t <= 0) S.slow = null; }
    S.b.forEach((b, i) => {
      if (!b.alive) return;
      const f = this.slowF(S, i), a = m.axis(i); MGH.steer(b, a.x, a.y, dt * f, 2400, 280, 8); MGH.integrate(b, dt * f);
      b.cd -= dt * f; b.inv -= dt; b.shield = Math.max(0, (b.shield || 0) - dt);
      for (const u of S.pu) if (!u.got && dist(u.x, u.y, b.x, b.y) < b.r + 22) {
        u.got = true; Sfx.star(); MGH.burst(u.x, u.y, ['#fff', '#ffe680', m.players[i].color], 22, { speed: 240, kind: 'spark', size: 3 });
        if (u.k === 'shield') { b.shield = 6; MGH.pop('🛡️ SHIELD', b.x, b.y - 50, '#9fe0ff'); }
        if (u.k === 'life') { b.hp = Math.min(5, b.hp + 1); MGH.pop('+♥', b.x, b.y - 50, '#ff8aa8'); }
        if (u.k === 'slow') { S.slow = { by: i, t: 5 }; MGH.pop('⏳ SLOW-TIME', b.x, b.y - 50, '#c8a8ff'); Sfx.tone(600, 0.8, 'sine', 0.06, -450); }
      }
      if (m.pressed(i, 'a') && b.cd <= 0) { b.cd = 0.8; S.balls.push({ x: b.x + b.face.x * 30, y: b.y + b.face.y * 30, vx: b.face.x * 520, vy: b.face.y * 520, o: i, bounce: 1 }); Sfx.tone(420, 0.06, 'square', 0.04); }
    });
    MGH.collide(S.b, 0.5);
    for (const f of S.balls) {
      const sf = this.slowF(S, f.o); f.x += f.vx * dt * sf; f.y += f.vy * dt * sf;
      let hitWall = false;
      if (f.x < 10 || f.x > 1270) { f.vx *= -1; hitWall = true; f.x = clamp(f.x, 10, 1270); }
      if (f.y < 50 || f.y > 710) { f.vy *= -1; hitWall = true; f.y = clamp(f.y, 50, 710); }
      if (hitWall) { if (f.bounce > 0) f.bounce--; else f.dead = true; }
      S.b.forEach((b, i) => {
        if (f.dead || !b.alive || b.inv > 0 || (i === f.o && f.bounce > 0)) return;
        if (b.shield > 0 && dist(f.x, f.y, b.x, b.y) < b.r + 22) { f.dead = true; MGH.ring(b.x, b.y, '#9fe0ff', 30, 40, 0.3); Sfx.tone(1400, 0.08, 'triangle', 0.05); return; }
        if (dist(f.x, f.y, b.x, b.y) < b.r + 10) { f.dead = true; b.hp--; b.inv = 0.8; Sfx.bad(); MGH.burst(f.x, f.y, ['#ff7a3d', '#ffd34d', m.players[f.o].color], 22, { speed: 300 }); MGH.shake(6); MGH.pop('-♥', b.x, b.y - 30, '#ff6b6b'); if (b.hp <= 0) { b.alive = false; b.outT = m.t; } }
      });
    }
    S.balls = S.balls.filter(f => !f.dead);
    S.pu = S.pu.filter(u => !u.got && u.t < 9);
    if (S.b.filter(b => b.alive).length <= 1) m.finish(this.score(m, S));
  },
  bot(m, S, i) {
    const b = S.b[i]; if (!b.alive) return;
    const v = m.vin[i]; v.a = false;
    const t = MGH.nearest(b, S.b);
    let ax = 0, ay = 0;
    const pu = S.pu.find(u => !u.got && dist(u.x, u.y, b.x, b.y) < 380); if (pu) { const d = dist(pu.x, pu.y, b.x, b.y) || 1; ax += (pu.x - b.x) / d * 1.2; ay += (pu.y - b.y) / d * 1.2; }
    for (const f of S.balls) {
      if (f.o === i && f.bounce > 0) continue;
      const dx = b.x - f.x, dy = b.y - f.y, d = Math.hypot(dx, dy);
      if (d < 220 && (dx * f.vx + dy * f.vy) > 0) { const l = Math.hypot(f.vx, f.vy); ax += -f.vy / l * 1.5; ay += f.vx / l * 1.5; }
    }
    if (t) {
      const dx = t.x - b.x, dy = t.y - b.y, d = Math.hypot(dx, dy) || 1;
      if (d > 300) { ax += dx / d; ay += dy / d; } else if (d < 180) { ax -= dx / d; ay -= dy / d; }
      if (Math.abs(ax) + Math.abs(ay) < 0.3) { b.face = { x: dx / d, y: dy / d }; if (b.cd <= 0 && Math.random() < 0.15) v.a = true; }
      else if (b.cd <= 0 && Math.random() < 0.05) { b.face = { x: dx / d, y: dy / d }; v.a = true; }
    }
    if (b.x < 100) ax += 1; if (b.x > 1180) ax -= 1; if (b.y < 140) ay += 1; if (b.y > 620) ay -= 1;
    v.left = v.right = v.up = v.down = false; v.ax = clamp(ax, -1, 1); v.ay = clamp(ay, -1, 1);
    if (v.a && t) { const dx = t.x - b.x, dy = t.y - b.y, d = Math.hypot(dx, dy) || 1; v.ax = dx / d * 0.15; v.ay = dy / d * 0.15; }
  },
  score(m, S) { return S.b.map(b => b.alive ? 100 + b.hp : b.outT); },
  fmt(s) { return s >= 100 ? `alive, ${Math.round(s - 100)}♥` : `out at ${s.toFixed(1)}s`; },
  hud(m, S, i) { return S.b[i].alive ? '♥'.repeat(S.b[i].hp) : 'out'; },
  draw(m, S, g) {
    MGH.scene(g, 'lava', m.t);
    g.fillStyle = 'rgba(30,10,6,0.55)'; g.fillRect(20, 60, 1240, 640); g.strokeStyle = 'rgba(255,120,40,0.5)'; g.lineWidth = 4; g.strokeRect(20, 60, 1240, 640);
    for (let k = 0; k < 9; k++) { g.strokeStyle = 'rgba(255,90,30,0.18)'; g.lineWidth = 2; g.beginPath(); g.moveTo(40 + k * 140, 60); g.lineTo(80 + k * 140, 380); g.lineTo(30 + k * 140, 700); g.stroke(); }
    if (S.slow) { g.fillStyle = 'rgba(150,110,255,0.12)'; g.fillRect(0, 40, 1280, 680); MGH.label(g, `⏳ ${m.players[S.slow.by].name} slowed time!`, 640, 90, 24, '#d8c8ff'); }
    for (const u of S.pu) { const bob = Math.sin(u.t * 4) * 5, k = Math.min(1, u.t * 3); MGH.glow(g, u.x, u.y, 50, { shield: 'rgba(120,200,255,0.6)', life: 'rgba(255,100,140,0.6)', slow: 'rgba(170,130,255,0.6)' }[u.k]); g.globalAlpha = u.t > 7.5 && Math.sin(u.t * 20) > 0 ? 0.4 : 1; MGH.emoji(g, { shield: '🛡️', life: '❤️', slow: '⏳' }[u.k], u.x, u.y + bob, 36 * k); g.globalAlpha = 1; }
    S.b.forEach((b, i) => {
      if (!b.alive || (b.inv > 0 && Math.sin(m.t * 40) > 0)) return;
      MGH.shadow(g, b.x, b.y + b.r * 1.25, b.r, 0.35);
      if (b.shield > 0) { g.globalAlpha = b.shield < 1.5 && Math.sin(m.t * 20) > 0 ? 0.3 : 0.7; g.strokeStyle = '#9fe0ff'; g.lineWidth = 4; g.beginPath(); g.arc(b.x, b.y, b.r + 22, 0, 7); g.stroke(); g.fillStyle = 'rgba(120,200,255,0.15)'; g.fill(); g.globalAlpha = 1; }
      MGH.drawBody(g, b, m.players[i], '❤️'.repeat(b.hp), b.inv > 0 ? 'hurt' : (b.cd > 0.6 ? 'angry' : 'determined'));
    });
    for (const f of S.balls) MGH.fireball(g, f.x, f.y, 11, m.t, f.vx, f.vy, ['#fff2b0', m.players[f.o].color, '#ff3d1f']);
  },
});

// 16 ---------------------------------------------------------------- Cloud Hop
MG.def({
  id: 'cloud', name: 'Cloud Hop', type: 'Race', controls: '1 button', mouseA: true,
  how: 'Auto-run across floating platforms. Press to jump. A fall sends you back to your last platform.',
  wins: 'First to the finish.',
  init(m, S) {
    S.plats = []; let x = 0;
    S.plats.push({ x: 0, w: 400, y: 0 });
    x = 400;
    while (x < 5200) { const gap = R.range(70, 150), w = R.range(110, 280); x += gap; S.plats.push({ x, w, y: R.int(-1, 1) * 25 }); x += w; }
    S.end = x;
    S.p = [0, 1, 2, 3].map(() => ({ x: 40, y: 0, vy: 0, ground: true, last: 0, fin: 0, resp: 0 }));
  },
  platAt(S, x, y) { return S.plats.find(p => x >= p.x && x <= p.x + p.w); },
  update(m, S, dt) {
    for (let i = 0; i < 4; i++) {
      const p = S.p[i]; if (p.fin) continue;
      if (p.resp > 0) { p.resp -= dt; continue; }
      p.x += 270 * dt;
      if (m.pressed(i, 'a') && p.ground) { p.vy = -560; p.ground = false; MGH.burst(250, 40 + i * 170 + 115 + p.y, '#ffffff', 6, { speed: 90, life: 0.4 }); if (!m.bot(i)) Sfx.tone(500, 0.08, 'triangle', 0.05); }
      const py = p.y; p.vy += 1500 * dt; p.y += p.vy * dt;
      const pl = this.platAt(S, p.x);
      p.ground = false;
      if (pl && p.vy >= 0 && py <= pl.y + 1 && p.y >= pl.y) { p.y = pl.y; p.vy = 0; p.ground = true; p.last = S.plats.indexOf(pl); }
      if (p.y > 120) { const lp = S.plats[p.last]; p.x = lp.x + 10; p.y = lp.y; p.vy = 0; p.resp = 0.5; }
      if (p.x >= S.end) p.fin = m.t;
    }
    if (S.p.some(p => p.fin)) m.finish(this.score(m, S));
  },
  bot(m, S, i) {
    const p = S.p[i], v = m.vin[i]; v.a = false;
    if (!p.ground) return;
    const pl = this.platAt(S, p.x); if (!pl) return;
    const toEdge = pl.x + pl.w - p.x;
    if (toEdge < R.range(8, 40) || (Math.random() < 0.002)) v.a = true;
  },
  score(m, S) { return S.p.map(p => p.fin ? 1e5 - p.fin : p.x); },
  fmt(s) { return s >= 1e4 ? 'Finished!' : Math.round(s) + ' m'; },
  hud(m, S, i) { return Math.round(S.p[i].x / S.end * 100) + '%'; },
  draw(m, S, g) {
    for (let i = 0; i < 4; i++) {
      const top = 40 + i * 170, base = top + 115, p = S.p[i], cam = p.x - 250;
      g.save(); g.beginPath(); g.rect(0, top, 1280, 170); g.clip();
      g.fillStyle = MGH.grad(g, top, top + 170, [['#5fb8ff', '#9fd8ff'], ['#7fa8ff', '#c8d8ff'], ['#ff9a7a', '#ffd0a0'], ['#8fd3ff', '#e0f4ff']][i % 4].concat(['#ffffff'])); g.fillRect(0, top, 1280, 170);
      for (let k = 0; k < 6; k++) MGH.cloud(g, ((k * 260 - cam * 0.3) % 1560 + 1560) % 1560 - 140, top + 40 + (k % 2) * 30, 16, 'rgba(255,255,255,0.55)');
      for (const pl of S.plats) { const x = pl.x - cam; if (x > 1280 || x + pl.w < 0) continue; MGH.plat(g, x, base + pl.y, pl.w, 16, 'cloud'); for (let k = 0; k < pl.w; k += 26) MGH.cloud(g, x + 13 + k, base + pl.y + 4, 9); }
      const fx = S.end - cam; if (fx < 1280) { for (let y = top; y < top + 170; y += 20) { g.fillStyle = (Math.floor(y / 20) % 2) ? '#fff' : '#222'; g.fillRect(fx, y, 10, 20); } }
      g.globalAlpha = p.resp > 0 ? 0.4 : 1;
      MGH.av(g, m, i, 250, base + p.y - 16, 16, p.fin ? 'cheer' : p.resp > 0 ? 'dizzy' : (p.ground ? 'determined' : 'cheer'), { walk: p.ground ? 1 : 0, look: { x: 1, y: 0.2 } });
      g.globalAlpha = 1;
      MGH.label(g, m.players[i].name, 70, top + 30, 16, m.players[i].color);
      g.restore();
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(0, top + 168, 1280, 3);
    }
  },
});

// 18 ---------------------------------------------------------------- Burrow Dash
MG.def({
  id: 'burrow', name: 'Burrow Dash', type: 'Race', controls: 'Left/Right + mash',
  how: 'Tunnel down by tapping to dig. Steer around boulders, which stop you for a second.',
  wins: 'First to the bottom.',
  init(m, S) {
    S.goal = 2600;
    S.rocks = []; for (let d = 250; d < S.goal - 50; d += R.range(90, 170)) S.rocks.push({ d, x: R.range(40, 280) });
    S.p = [0, 1, 2, 3].map(() => ({ x: 160, d: 0, v: 0, stun: 0, fin: 0, hit: new Set(), tap: 0 }));
  },
  update(m, S, dt) {
    for (let i = 0; i < 4; i++) {
      const p = S.p[i]; if (p.fin) continue;
      p.x = clamp(p.x + m.axis(i).x * 260 * dt, 20, 300);
      if (p.stun > 0) { p.stun -= dt; p.v = 0; continue; }
      if (m.pressed(i, 'a')) { p.v = Math.min(420, p.v + 55); if (Math.random() < 0.5) MGH.burst(i * 320 + p.x, 214, ['#7a5230', '#5a3d22', '#a07040'], 3, { speed: 140, grav: 400, life: 0.5 }); }
      p.v = Math.max(0, p.v - 240 * dt);
      p.d += p.v * dt;
      S.rocks.forEach((r, k) => { if (!p.hit.has(k) && Math.abs(r.d - p.d) < 20 && Math.abs(r.x - p.x) < 40) { p.hit.add(k); p.stun = 1; MGH.burst(i * 320 + p.x, 210, ['#aaa', '#777'], 18, { speed: 260 }); if (!m.bot(i)) Sfx.bad(); } });
      if (p.d >= S.goal) p.fin = m.t;
    }
    if (S.p.some(p => p.fin) || m.t > 60) m.finish(this.score(m, S));
  },
  bot(m, S, i, dt) {
    const p = S.p[i], v = m.vin[i];
    p.tap -= dt; v.a = false;
    if (p.tap <= 0) { v.a = true; p.tap = R.range(0.11, 0.17); }
    const r = S.rocks.find((r, k) => !p.hit.has(k) && r.d > p.d && r.d < p.d + 140);
    let tx = p.x;
    if (r && Math.abs(r.x - p.x) < 60) tx = r.x > 160 ? r.x - 80 : r.x + 80;
    const d = tx - p.x; MGH.setLR(m, i, Math.abs(d) < 6 ? 0 : Math.sign(d));
  },
  score(m, S) { return S.p.map(p => p.fin ? 1e5 - p.fin : p.d); },
  fmt(s) { return s >= 1e4 ? 'Reached the bottom!' : Math.round(s / 26) + '%'; },
  hud(m, S, i) { return Math.min(100, Math.round(S.p[i].d / S.goal * 100)) + '%'; },
  draw(m, S, g) {
    for (let i = 0; i < 4; i++) {
      const p = S.p[i], ox = i * 320;
      g.save(); g.beginPath(); g.rect(ox, 40, 320, 680); g.clip();
      g.fillStyle = MGH.grad(g, 40, 720, ['#7a5230', '#4a2e18', '#2a180a']); g.fillRect(ox, 40, 320, 680);
      for (let k = 0; k < 30; k++) { const y = ((k * 40 - p.d) % 700 + 700) % 700 + 40, x = ox + MGH.hash(k + i * 7) * 320; g.fillStyle = 'rgba(0,0,0,0.18)'; g.beginPath(); g.arc(x, y, 3 + MGH.hash(k) * 5, 0, 7); g.fill(); if (k % 7 === 0) MGH.gem(g, x, y, 6, ['#5fd8ff', '#ff6ad5', '#7cf06a'][k % 3], m.t); }
      // the tunnel behind
      g.fillStyle = 'rgba(20,10,4,0.75)'; g.fillRect(ox + p.x - 22, 40, 44, 160);
      const by = 200 + (S.goal - p.d); if (by < 720) { g.fillStyle = MGH.grad(g, by, by + 30, ['#ffe680', '#ffb347']); g.fillRect(ox + 4, by, 312, 14); MGH.label(g, '🏁', ox + 160, by + 40, 22); }
      S.rocks.forEach((r, k) => { const y = 200 + (r.d - p.d); if (y < 20 || y > 740) return; MGH.rock(g, ox + r.x, y, 26, k + i, p.hit.has(k) ? '#555' : '#8a8a8a'); });
      if (p.v > 60 && Math.random() < 0.4) MGH.burst(ox + p.x, 214, ['#8a5a30', '#c9a36b'], 2, { speed: 120, life: 0.4, grav: 300 });
      MGH.av(g, m, i, ox + p.x, 196, 19, p.fin ? 'cheer' : p.stun > 0 ? 'dizzy' : 'determined', { look: { x: 0, y: 1 }, walk: p.v > 60 ? 1 : 0, prop: '⛏️' });
      g.restore();
      g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(ox + 318, 40, 4, 680);
    }
  },
});

// 20 ---------------------------------------------------------------- Rune Echo
MG.def({
  id: 'rune', name: 'Rune Echo', type: 'Memory', controls: 'Pick (4 directions)',
  how: 'Four elemental runes light up in a sequence. Repeat it. Everyone plays the same sequence at once and it grows each round. A mistake is out.',
  wins: 'Longest sequence survived.',
  init(m, S) { S.seq = [R.int(0, 3), R.int(0, 3)]; S.alive = [true, true, true, true]; S.best = [0, 0, 0, 0]; this.show(S); },
  show(S) { S.seq.push(R.int(0, 3)); S.phase = 'ready'; S.t = 0; S.prog = [0, 0, 0, 0]; S.done = [false, false, false, false]; S.flash = [-1, -1, -1, -1]; S.botT = [0, 0, 0, 0]; },
  dirs: ['up', 'right', 'down', 'left'],
  update(m, S, dt) {
    S.t += dt;
    if (S.phase === 'ready') { if (S.t > 1.1) { S.phase = 'show'; S.t = 0; S.lastK = -1; } return; }
    if (S.phase === 'show') {
      const k = Math.floor(S.t / 0.85);
      if (k >= S.seq.length) { S.phase = 'go'; S.t = 0; Sfx.tone(880, 0.12, 'square', 0.05); Sfx.tone(1320, 0.25, 'square', 0.05, 0, 0.12); }
      else if (k !== S.lastK) { S.lastK = k; Sfx.tone([523, 659, 784, 392][S.seq[k]], 0.45, 'triangle', 0.08); }
      return;
    }
    if (S.phase === 'go') { if (S.t > 0.8) { S.phase = 'input'; S.t = 0; } return; }
    if (S.phase === 'input') {
      for (let i = 0; i < 4; i++) {
        if (!S.alive[i] || S.done[i]) continue;
        for (let d = 0; d < 4; d++) if (m.pressed(i, this.dirs[d])) {
          S.flash[i] = d; S.ft = S.ft || [0, 0, 0, 0]; S.ft[i] = m.t; if (!m.bot(i)) Sfx.tone([523, 659, 784, 392][d], 0.15, 'triangle', 0.05);
          if (S.seq[S.prog[i]] === d) { S.prog[i]++; if (S.prog[i] >= S.seq.length) { S.done[i] = true; S.best[i] = S.seq.length; } }
          else { S.alive[i] = false; MGH.burst(160 + i * 320, 650, ['#ff4d6d', '#fff'], 20, { speed: 260 }); if (!m.bot(i)) Sfx.bad(); }
          break;
        }
      }
      const timeUp = S.t > 3 + S.seq.length * 1.0;
      if (timeUp) for (let i = 0; i < 4; i++) if (S.alive[i] && !S.done[i]) S.alive[i] = false;
      if (S.alive.every((a, i) => !a || S.done[i])) {
        const alive = S.alive.filter(a => a).length;
        if (alive <= 1) m.finish(this.score(m, S));
        else { S.phase = 'gap'; S.t = 0; }
      }
      return;
    }
    if (S.phase === 'gap' && S.t > 0.8) this.show(S);
  },
  bot(m, S, i, dt) {
    const v = m.vin[i]; v.up = v.down = v.left = v.right = false;
    if (S.phase !== 'input' || !S.alive[i] || S.done[i]) return;
    S.botT[i] -= dt; if (S.botT[i] > 0) return;
    S.botT[i] = R.range(0.25, 0.45);
    let d = S.seq[S.prog[i]];
    if (Math.random() < 0.015 + S.seq.length * 0.012) d = (d + R.int(1, 3)) % 4;
    v[this.dirs[d]] = true;
  },
  score(m, S) { return S.best.map((b, i) => b + (S.alive[i] ? 0.5 : 0)); },
  fmt(s) { return `sequence ${Math.floor(s)}`; },
  hud(m, S, i) { return S.alive[i] ? `${S.prog[i]}/${S.seq.length}` : `out (${S.best[i]})`; },
  draw(m, S, g) {
    MGH.scene(g, 'temple', m.t);
    const runes = [['🌪️', '#8fe0ff', 'UP'], ['🔥', '#ff6a3d', 'RIGHT'], ['⛰️', '#7ccf4a', 'DOWN'], ['🌊', '#4f8dff', 'LEFT']];
    const pos = [[640, 200], [800, 340], [640, 480], [480, 340]];
    const k = S.phase === 'show' ? Math.floor(S.t / 0.85) : -1;
    const lit = k >= 0 && k < S.seq.length && (S.t % 0.85) < 0.62 ? S.seq[k] : -1;
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.arc(640, 340, 230, 0, 7); g.fill();
    for (let d = 0; d < 4; d++) {
      const on = lit === d, [x, y] = pos[d];
      if (on) MGH.glow(g, x, y, 170, runes[d][1]);
      g.fillStyle = on ? runes[d][1] : 'rgba(255,255,255,0.08)'; g.beginPath(); g.arc(x, y, on ? 82 : 70, 0, 7); g.fill();
      g.strokeStyle = runes[d][1]; g.lineWidth = on ? 8 : 4; g.stroke();
      MGH.emoji(g, runes[d][0], x, y - 4, on ? 70 : 56);
      MGH.text(g, runes[d][2], x, y + 98, 14, runes[d][1], 'center', 'bold');
    }
    // sequence dots: how long, and which one is showing
    for (let s = 0; s < S.seq.length; s++) { const x = 640 + (s - (S.seq.length - 1) / 2) * 26; g.fillStyle = S.phase === 'show' && s === k ? runes[S.seq[s]][1] : S.phase === 'show' && s < k ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)'; g.beginPath(); g.arc(x, 592, 8, 0, 7); g.fill(); }
    if (S.phase === 'ready' || S.phase === 'show') MGH.phase(g, true, m.t, `Sequence of ${S.seq.length} — remember it!`);
    else if (S.phase === 'go') { const z = 1 + Math.max(0, 0.4 - S.t); g.save(); g.translate(640, 340); g.scale(z, z); MGH.label(g, 'GO! YOUR TURN', 0, 14, 54, '#ffe680', 'rgba(120,70,0,0.85)'); g.restore(); }
    else if (S.phase === 'input') { MGH.phase(g, false, m.t, 'Repeat the sequence with your arrows / stick'); const lim = 3 + S.seq.length; g.fillStyle = 'rgba(0,0,0,0.5)'; MGH.rr(g, 440, 612, 400, 12, 6); g.fill(); g.fillStyle = '#ffe680'; MGH.rr(g, 440, 612, 400 * Math.max(0, 1 - S.t / lim), 12, 6); g.fill(); }
    else MGH.label(g, '✔ Well done!', 640, 120, 30, '#8fffa0');
    for (let i = 0; i < 4; i++) {
      const x = 160 + i * 320, p = m.players[i];
      const fl = S.ft && m.t - S.ft[i] < 0.25 && S.flash[i] >= 0 ? S.flash[i] : -1;
      MGH.av(g, m, i, x - 100, 660, 20, !S.alive[i] ? 'out' : S.done[i] ? 'cheer' : (S.phase === 'input' ? 'determined' : 'neutral'), { look: { x: 0.5, y: -1 } });
      MGH.text(g, p.name, x + 20, 662, 19, p.color, 'center', 'bold');
      if (fl >= 0) MGH.emoji(g, runes[fl][0], x + 100, 650, 28);
      for (let s = 0; s < S.seq.length; s++) { g.fillStyle = !S.alive[i] ? '#633' : s < S.prog[i] ? p.color : 'rgba(255,255,255,0.18)'; g.beginPath(); g.arc(x + 20 + (s - (S.seq.length - 1) / 2) * 12, 690, 4.5, 0, 7); g.fill(); }
      if (!S.alive[i]) MGH.text(g, '✖ out', x + 20, 712, 15, '#f88', 'center', 'bold');
    }
  },
});
