'use strict';
// Party batch 5: Pancake Flip, Paper Planes, Sheep Herd, Dance Floor, Ghost Hunt (1v3), Tag-Team Sumo (2v2)

// ======================================================================== PANCAKE FLIP (timing)
MG.def({
  id: 'pancake', name: 'Pancake Flip', type: 'Timing', controls: '1 button', dur: 45,
  rows: [['a', 'Flip, then serve']],
  how: 'The marker on the colour bar shows how cooked the pancake is — and the stove flickers, so the marker speeds up, slows down and swings back and forth! Press A to FLIP when the marker is in the golden zone, then press A again to SERVE when the second side is golden. Perfect golden = 3 points, a bit early or late = 1, burnt = 0. Stack up as many as you can!',
  wins: 'Most points.',
  init(m, S) { S.p = [0, 1, 2, 3].map(() => this.fresh({ pts: 0, stack: 0, fx: null, fxT: 0, err: R.range(-0.06, 0.06) })); },
  fresh(P) { return Object.assign(P, { side: 0, c: 0, sp: R.range(0.4, 0.7), dir: 1, chg: R.range(0.5, 1.2), age: 0, flip: 0, q: [] }); },
  grade(c) { return c >= 0.56 && c <= 0.7 ? 3 : c >= 0.45 && c <= 0.8 ? 1 : 0; },
  update(m, S, dt) {
    S.p.forEach((P, i) => {
      P.fxT -= dt; P.flip = Math.max(0, P.flip - dt);
      if (P.flip > 0) return;
      // the heat flickers: the marker speeds up, slows down and even swings back the other way
      P.age += dt; P.chg -= dt; if (P.chg <= 0) { P.chg = R.range(0.4, 1.1); P.sp = R.range(0.3, 1.0); if (Math.random() < 0.45) P.dir *= -1; }
      P.c += P.dir * P.sp * dt; if (P.c > 1.1) { P.c = 1.1; P.dir = -1; } if (P.c < 0) { P.c = 0; P.dir = 1; }
      if (m.pressed(i, 'a') || P.age > 7) {
        const g = this.grade(P.c); P.q.push(g);
        if (P.side === 0) { P.side = 1; P.c = 0; P.dir = 1; P.age = 0; P.flip = 0.45; Sfx.whoosh(false); }
        else { const sc = Math.min(P.q[0], P.q[1]) === 3 ? 3 : P.q[0] + P.q[1] >= 2 ? 1 : 0; P.pts += sc; if (sc) P.stack++; P.fx = sc === 3 ? 'PERFECT +3' : sc ? '+1' : 'burnt…'; P.fxT = 1; if (sc) Sfx.coin(); else Sfx.bad(); this.fresh(P); P.flip = 0.3; }
      }
    });
  },
  bot(m, S, i) { const P = S.p[i], v = m.vin[i]; v.a = false; if (P.flip > 0) return; if (Math.abs(P.c - 0.63) < 0.05 + Math.abs(P.err) * 0.5 && Math.random() < 0.25) { v.a = !m.prev[i].a; P.err = R.range(-0.12, 0.1); } },
  score(m, S) { return S.p.map(P => P.pts); },
  fmt(s) { return `${s} pts`; },
  hud(m, S, i) { return `${S.p[i].pts}`; },
  draw(m, S, g) {
    g.fillStyle = MGH.grad(g, 0, 720, ['#ffe8c8', '#f4c890', '#d8a060']); g.fillRect(0, 0, 1280, 720);
    for (let x = 0; x < 1280; x += 64) { g.fillStyle = (x / 64) % 2 ? 'rgba(255,255,255,0.2)' : 'rgba(255,200,150,0.15)'; g.fillRect(x, 0, 64, 300); }
    for (let i = 0; i < 4; i++) {
      const P = S.p[i], p = m.players[i], x = 160 + i * 320;
      // stove and pan
      g.fillStyle = '#5a5a6a'; MGH.rr(g, x - 120, 470, 240, 200, 14); g.fill(); g.fillStyle = '#3a3a4a'; g.beginPath(); g.ellipse(x, 480, 90, 22, 0, 0, 7); g.fill();
      for (let k = 0; k < 8; k++) { g.fillStyle = `rgba(80,160,255,${0.5 + 0.3 * Math.sin(m.t * 10 + k)})`; g.beginPath(); g.ellipse(x + Math.cos(k * 0.8) * 50, 486 + Math.sin(k * 0.8) * 8, 7, 3, 0, 0, 7); g.fill(); }
      g.fillStyle = '#2a2a2a'; g.beginPath(); g.ellipse(x, 462, 96, 26, 0, 0, 7); g.fill(); g.fillRect(x + 90, 456, 90, 12);
      // the pancake: colour from pale to golden to burnt
      const c = Math.min(1.15, P.c), col = c < 0.56 ? `rgb(${248 - c * 40},${232 - c * 70},${180 - c * 120})` : c < 0.8 ? `rgb(${226 - (c - 0.56) * 100},${170 - (c - 0.56) * 160},${90 - (c - 0.56) * 160})` : `rgb(${200 - (c - 0.8) * 400},${130 - (c - 0.8) * 300},${50 - (c - 0.8) * 120})`;
      const fl = P.flip > 0 ? Math.sin((1 - P.flip / 0.45) * Math.PI) : 0;
      g.save(); g.translate(x, 452 - fl * 130); g.scale(1, Math.cos(fl * Math.PI) * 0.9 + 0.1);
      g.fillStyle = col; g.beginPath(); g.ellipse(0, 0, 70, 20, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,0.18)'; g.beginPath(); g.ellipse(-16, -5, 26, 6, 0, 0, 7); g.fill(); g.restore();
      if (c > 0.85) for (let k = 0; k < 3; k++) { g.fillStyle = `rgba(80,80,80,${0.4 - k * 0.1})`; g.beginPath(); g.arc(x - 20 + k * 20, 420 - ((m.t * 40 + k * 20) % 60), 10 + k * 3, 0, 7); g.fill(); }
      // colour bar with the golden zone
      g.fillStyle = 'rgba(0,0,0,0.5)'; MGH.rr(g, x - 104, 380, 208, 18, 9); g.fill();
      g.fillStyle = '#f8e8b4'; g.fillRect(x - 100, 384, 200 * 0.45, 10); g.fillStyle = '#e8a850'; g.fillRect(x - 100 + 200 * 0.45, 384, 200 * 0.35, 10); g.fillStyle = '#5a3a1a'; g.fillRect(x - 100 + 200 * 0.8, 384, 200 * 0.2, 10);
      g.fillStyle = '#ffe680'; g.fillRect(x - 100 + 200 * 0.56, 381, 200 * 0.14, 16);
      g.fillStyle = '#fff'; g.fillRect(x - 100 + 200 * Math.min(1, c) - 2, 376, 4, 26);
      MGH.text(g, P.side ? 'side 2 → SERVE' : 'side 1 → FLIP', x, 370, 14, '#5a3a1a', 'center', 'bold');
      // the chef and the stack
      Char.draw(g, x - 70, 300, 34, p.el.id, p.color, { mood: MGH.persona(P.fxT > 0 ? (P.fx === 'burnt…' ? 'hurt' : 'cheer') : 'determined', p.el.id), seed: i * 1.7, look: { x: 0.5, y: 0.5 } });
      for (let k = 0; k < Math.min(12, P.stack); k++) { g.fillStyle = k % 2 ? '#e8a850' : '#d89840'; g.beginPath(); g.ellipse(x + 60, 330 - k * 8, 36, 9, 0, 0, 7); g.fill(); }
      if (P.stack) { g.fillStyle = '#ffe680'; g.fillRect(x + 54, 316 - Math.min(12, P.stack) * 8, 12, 8); }
      MGH.text(g, `${P.pts}`, x, 650, 30, p.color, 'center', 'bold');
      if (P.fxT > 0) { g.globalAlpha = Math.min(1, P.fxT * 2); MGH.text(g, P.fx, x, 220 - (1 - P.fxT) * 30, 24, P.fx === 'burnt…' ? '#a83a2a' : '#ff8a3d', 'center', 'bold'); g.globalAlpha = 1; }
    }
  },
});

// ======================================================================== PAPER PLANES (hold to climb, release to dive, fly through rings)
MG.def({
  id: 'planes', name: 'Paper Planes', type: 'Skill', controls: '1 button', dur: 0,
  rows: [['a', 'Hold to climb · let go to dive']],
  how: 'Your paper plane glides on its own. HOLD A to tilt up and climb (you lose speed), LET GO to dip down (you gain speed). Fly through the golden rings for a speed boost and points, and catch the warm updrafts. Touch the ground and your flight is over! Furthest flight plus ring bonuses wins.',
  wins: 'Furthest distance (rings add 20 m each).',
  init(m, S) {
    S.rings = []; let x = 300; while (x < 6000) { S.rings.push({ x, y: R.range(150, 520) }); x += R.range(260, 420); }
    S.up = []; x = 600; while (x < 6000) { S.up.push({ x, w: 120 }); x += R.range(700, 1100); }
    S.p = [0, 1, 2, 3].map(i => ({ x: 0, y: 240 + i * 30, a: 0, v: 300, alive: true, rings: 0, got: new Set(), plan: R.range(0.9, 1.1) }));
  },
  update(m, S, dt) {
    S.p.forEach((P, i) => {
      if (!P.alive) return;
      const up = m.held(i, 'a');
      P.a += ((up ? -0.55 : 0.32) - P.a) * 3 * dt;
      P.v += (Math.sin(P.a) * 420 - 14) * dt; P.v = clamp(P.v, 120, 620);
      const lift = S.up.some(u => Math.abs(P.x - u.x) < u.w / 2) ? -180 : 0;
      P.x += Math.cos(P.a) * P.v * dt; P.y += (Math.sin(P.a) * P.v + 40 + lift) * dt; P.y = Math.max(70, P.y);
      S.rings.forEach((r, k) => { if (!P.got.has(k) && Math.abs(P.x - r.x) < 16 && Math.abs(P.y - r.y) < 46) { P.got.add(k); P.rings++; P.v = Math.min(620, P.v + 90); Sfx.coin(); } });
      if (P.y > 650) { P.alive = false; P.y = 650; Sfx.thud(); }
    });
    if (S.p.every(P => !P.alive) || m.t > 60) m.finish(this.score(m, S));
  },
  bot(m, S, i) {
    const P = S.p[i], v = m.vin[i]; if (!P.alive) { v.a = false; return; }
    const r = S.rings.find((r, k) => r.x > P.x + 60 && !P.got.has(k)); let ty = r ? r.y : 300;
    if (P.y > 520) ty = 200; if (P.v < 180) ty = P.y + 200;
    v.a = P.y > ty * P.plan + 10;
  },
  score(m, S) { return S.p.map(P => Math.round(P.x / 10 + P.rings * 20)); },
  fmt(s) { return `${s} m`; },
  hud(m, S, i) { const P = S.p[i]; return `${Math.round(P.x / 10)} m · 💍${P.rings}`; },
  draw(m, S, g) {
    const lead = Math.max(...S.p.map(P => P.x)), cam = Math.max(0, lead - 700);
    g.fillStyle = MGH.grad(g, 0, 720, ['#5ab0f0', '#a8dcff', '#ffe8c8']); g.fillRect(0, 0, 1280, 720);
    for (let k = 0; k < 8; k++) MGH.cloud(g, ((k * 260 - cam * 0.3) % 1600 + 1600) % 1600 - 160, 100 + (k % 4) * 70, 1 + (k % 3) * 0.3);
    g.fillStyle = '#7ac85a'; g.beginPath(); g.moveTo(0, 720); for (let x = 0; x <= 1280; x += 40) g.lineTo(x, 650 + Math.sin((x + cam * 0.6) * 0.01) * 14); g.lineTo(1280, 720); g.fill();
    g.fillStyle = '#5aa84a'; for (let k = 0; k < 20; k++) { const x = ((k * 140 - cam) % 2800 + 2800) % 2800 - 100; g.beginPath(); g.arc(x, 652, 26, Math.PI, 0); g.fill(); }
    for (let d = 0; d < 7000; d += 500) { const x = d - cam; if (x < -40 || x > 1320) continue; g.fillStyle = 'rgba(255,255,255,0.7)'; g.fillRect(x, 640, 3, 20); MGH.text(g, `${d / 10} m`, x, 690, 14, '#2a5a2a', 'center', 'bold'); }
    S.up.forEach(u => { const x = u.x - cam; if (x < -100 || x > 1380) return; const gr = g.createLinearGradient(0, 650, 0, 150); gr.addColorStop(0, 'rgba(255,200,120,0.35)'); gr.addColorStop(1, 'rgba(255,200,120,0)'); g.fillStyle = gr; g.fillRect(x - u.w / 2, 150, u.w, 500); for (let k = 0; k < 4; k++) { const yy = 650 - ((m.t * 120 + k * 120) % 480); g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 10, yy); g.lineTo(x, yy - 14); g.lineTo(x + 10, yy); g.stroke(); } });
    S.rings.forEach((r, k) => { const x = r.x - cam; if (x < -60 || x > 1340) return; const all = S.p.every(P => P.got.has(k)); g.strokeStyle = all ? 'rgba(255,230,120,0.3)' : '#ffcf4a'; g.lineWidth = 7; g.beginPath(); g.ellipse(x, r.y, 14, 46, 0, 0, 7); g.stroke(); g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 2; g.beginPath(); g.ellipse(x - 2, r.y, 10, 40, 0, 0, 7); g.stroke(); });
    S.p.forEach((P, i) => {
      const p = m.players[i], x = P.x - cam;
      g.save(); g.translate(x, P.y); g.rotate(P.a);
      g.fillStyle = '#fff'; g.beginPath(); g.moveTo(40, 0); g.lineTo(-30, -22); g.lineTo(-18, 0); g.lineTo(-30, 18); g.closePath(); g.fill(); g.strokeStyle = p.color; g.lineWidth = 3; g.stroke();
      g.fillStyle = p.color; g.beginPath(); g.moveTo(40, 0); g.lineTo(-18, 0); g.lineTo(-30, 10); g.closePath(); g.fill();
      g.restore();
      Char.draw(g, x - 4, P.y - 22, 14, p.el.id, p.color, { mood: MGH.persona(!P.alive ? 'sad' : P.a < -0.2 ? 'effort' : 'cheer', p.el.id), seed: i * 1.7, look: { x: 1, y: 0 }, noFeet: true, noShadow: true });
      if (!P.alive) MGH.text(g, `${Math.round(P.x / 10)} m`, x, P.y - 50, 16, p.color, 'center', 'bold');
    });
  },
});

// ======================================================================== SHEEP HERD (push sheep into your pen)
MG.def({
  id: 'sheep', name: 'Sheep Herd', type: 'Arena', controls: 'Move + button', dur: 50,
  rows: [['stick', 'Run (sheep flee from you)'], ['a', 'Whistle: scare nearby sheep']],
  how: 'Fluffy sheep wander the meadow and run AWAY from whoever comes close. Get behind them and steer them into YOUR pen in your corner. Press A to whistle and send every sheep near you scattering. A sheep in your pen at the end scores — but rivals can scare them back out!',
  wins: 'Most sheep in your pen at the whistle.',
  PEN: [[130, 160], [1150, 160], [130, 620], [1150, 620]],
  init(m, S) {
    S.b = [0, 1, 2, 3].map(i => Object.assign(MGH.body(this.PEN[i][0] + (i % 2 ? -140 : 140), this.PEN[i][1] + (i < 2 ? 100 : -100), 22), { cd: 0, wh: 0 }));
    S.sh = []; for (let k = 0; k < 14; k++) S.sh.push(Object.assign(MGH.body(R.range(450, 830), R.range(240, 540), 18), { wob: R.range(0, 6), dir: R.range(0, 6), baa: 0 }));
  },
  // solid pen walls (top, bottom, back); the gate side facing the middle is the only way in or out
  penWalls(b) { this.PEN.forEach(([x, y], i) => { const open = i % 2 ? -1 : 1, bx = x - open * 100; bounceSeg(b, x - 100, y - 80, x + 100, y - 80, b.r, 0.3); bounceSeg(b, x - 100, y + 80, x + 100, y + 80, b.r, 0.3); bounceSeg(b, bx, y - 80, bx, y + 80, b.r, 0.3); }); },
  penOf(x, y) { return this.PEN.findIndex(([px, py]) => Math.abs(x - px) < 100 && Math.abs(y - py) < 80); },
  update(m, S, dt) {
    S.b.forEach((b, i) => { b.cd -= dt; b.wh -= dt; const a = m.axis(i); MGH.steer(b, a.x, a.y, dt, 2000, 300, 7); MGH.integrate(b, dt, 20, 70, 1260, 710); this.penWalls(b); if (m.pressed(i, 'a') && b.cd <= 0) { b.cd = 2.5; b.wh = 0.5; Sfx.tone(1600, 0.2, 'sine', 0.05, 2200); S.sh.forEach(s => { const d = dist(s.x, s.y, b.x, b.y); if (d < 200) { s.vx += (s.x - b.x) / d * 420; s.vy += (s.y - b.y) / d * 420; s.baa = 0.6; } }); } });
    MGH.collide(S.b, 0.6);
    S.sh.forEach(s => {
      s.dir += R.range(-1, 1) * dt * 2; let ax = Math.cos(s.dir) * 0.25, ay = Math.sin(s.dir) * 0.25;
      S.b.forEach(b => { const d = dist(s.x, s.y, b.x, b.y); if (d < 150) { ax += (s.x - b.x) / d * (150 - d) / 60; ay += (s.y - b.y) / d * (150 - d) / 60; } });
      const inPen = this.penOf(s.x, s.y) >= 0; MGH.steer(s, ax, ay, dt, 900, inPen ? 120 : 230, 3);
      MGH.integrate(s, dt, 20, 70, 1260, 710); this.penWalls(s); s.wob += dt * 8 * Math.min(1, Math.hypot(s.vx, s.vy) / 100); s.baa -= dt;
      if (Math.random() < 0.002) s.baa = 0.6;
    });
    MGH.collide(S.sh, 0.4);
  },
  bot(m, S, i) {
    const b = S.b[i], [px, py] = this.PEN[i], v = m.vin[i]; v.a = false;
    // pick the sheep nearest our pen that isn't in it, and get behind it
    const free = S.sh.filter(s => this.penOf(s.x, s.y) !== i).sort((p, q) => dist(p.x, p.y, px, py) - dist(q.x, q.y, px, py));
    const s = free[b.pick || 0] || free[0]; if (!s) return; if (Math.random() < 0.005) b.pick = R.int(0, 2);
    const dx = s.x - px, dy = s.y - py, l = Math.hypot(dx, dy) || 1, gx = s.x + dx / l * 70, gy = s.y + dy / l * 70;
    MGH.aim(m, i, gx, gy, b, 8);
    // whistle near a rival's pen to scatter their flock
    const near = this.PEN.findIndex(([x, y], j) => j !== i && dist(x, y, b.x, b.y) < 140);
    if (near >= 0 && b.cd <= 0 && Math.random() < 0.05) v.a = true;
  },
  score(m, S) { const c = [0, 0, 0, 0]; S.sh.forEach(s => { const k = this.penOf(s.x, s.y); if (k >= 0) c[k]++; }); return c; },
  fmt(s) { return `${s} sheep`; },
  hud(m, S, i) { return `🐑 ${this.score(m, S)[i]}`; },
  draw(m, S, g) {
    MGH.scene(g, 'meadow', m.t);
    g.fillStyle = 'rgba(120,200,90,0.35)'; g.fillRect(0, 60, 1280, 660);
    const sc = this.score(m, S);
    this.PEN.forEach(([x, y], i) => {
      const p = m.players[i];
      g.fillStyle = p.color; g.globalAlpha = 0.18; g.fillRect(x - 100, y - 80, 200, 160); g.globalAlpha = 1;
      g.strokeStyle = '#8a5a2a'; g.lineWidth = 6; g.beginPath(); const open = i % 2 ? -1 : 1; // the gate faces the middle
      g.moveTo(x + open * 100, y - 80); g.lineTo(x - open * 100, y - 80); g.lineTo(x - open * 100, y + 80); g.lineTo(x + open * 100, y + 80); g.stroke();
      for (let k = 0; k <= 4; k++) { g.fillStyle = '#6a4220'; g.fillRect(x - open * 100 - 4 + 0, y - 84 + k * 40, 8, 10); }
      MGH.text(g, `${sc[i]}`, x, y + 8, 40, p.color, 'center', 'bold');
    });
    const ents = S.sh.map(s => ({ y: s.y, f: () => {
      MGH.shadow(g, s.x, s.y + 16, 20, 0.25);
      const bob = Math.sin(s.wob) * 2, d = s.vx < 0 ? -1 : 1;
      g.fillStyle = '#fff'; for (let k = 0; k < 6; k++) { g.beginPath(); g.arc(s.x + Math.cos(k) * 12, s.y - 4 + Math.sin(k) * 7 + bob, 11, 0, 7); g.fill(); }
      g.fillStyle = '#3a3a4a'; g.beginPath(); g.ellipse(s.x + d * 18, s.y - 6 + bob, 9, 8, 0, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(s.x + d * 21, s.y - 8 + bob, 2, 0, 7); g.fill();
      g.fillStyle = '#3a3a4a'; g.fillRect(s.x - 10, s.y + 6, 4, 9 + Math.sin(s.wob) * 2); g.fillRect(s.x + 6, s.y + 6, 4, 9 - Math.sin(s.wob) * 2);
      if (s.baa > 0) MGH.text(g, 'baa!', s.x + d * 16, s.y - 26, 12, '#fff', 'center', 'bold');
    } })).concat(S.b.map((b, i) => ({ y: b.y, f: () => { MGH.drawBody(g, b, m.players[i], ''); if (b.wh > 0) { g.strokeStyle = `rgba(255,255,255,${b.wh * 1.6})`; g.lineWidth = 3; g.beginPath(); g.arc(b.x, b.y, 200 * (1 - b.wh / 0.5), 0, 7); g.stroke(); } } })));
    ents.sort((a, b) => a.y - b.y).forEach(e => e.f());
  },
});

// ======================================================================== DANCE FLOOR (arrow rhythm)
MG.def({
  id: 'dance', name: 'Dance Floor', type: 'Rhythm', controls: 'Move + A & B', dur: 0,
  rows: [['lr', 'Left and right lanes'], ['a', 'Green lane'], ['b', 'Red lane']],
  how: 'Notes scroll up your four lanes in time with the music: ◀ LEFT, A, B and RIGHT ▶. When a note reaches the glowing target at the top, press it — LEFT or RIGHT on the stick / d-pad, or the A or B button! PERFECT, GOOD or MISS — keep a combo going for bonus points. The song speeds up near the end.',
  wins: 'Highest score.',
  DIRS: ['left', 'a', 'b', 'right'], GLY: ['◀', 'A', 'B', '▶'], COL: ['#c87aff', '#3fc35a', '#e8453c', '#5ab8ff'],
  init(m, S) {
    S.notes = []; let t = 2, beat = 0.5;
    while (t < 38) { const n = Math.random() < 0.2 ? 2 : 1; const used = new Set(); for (let k = 0; k < n; k++) { let d; do d = R.int(0, 3); while (used.has(d)); used.add(d); S.notes.push({ t, d }); } t += beat * R.pick([1, 1, 1, 0.5, 2]); if (t > 26) beat = 0.4; }
    S.end = t + 2; S.p = [0, 1, 2, 3].map(() => ({ pts: 0, combo: 0, hit: new Set(), fx: '', fxT: 0, ax: '', err: R.range(0.02, 0.07), flash: [0, 0, 0, 0] }));
    S.beat = 0;
  },
  SPD: 300, TY: 170,
  update(m, S, dt) {
    const t = m.t; S.beat += dt;
    if (Math.floor(t * 2) !== Math.floor((t - dt) * 2) && t > 1.5 && t < S.end - 1) Sfx.drum(Math.floor(t * 2) % 2);
    S.p.forEach((P, i) => {
      P.fxT -= dt; P.flash = P.flash.map(f => Math.max(0, f - dt));
      const a = m.axis(i), now = a.x < -0.6 ? 'left' : a.x > 0.6 ? 'right' : '';
      const presses = (m.bot(i) ? ['a', 'b'] : this.DIRS).filter(k => m.pressed(i, k)); if (now && now !== P.ax && !presses.includes(now)) presses.push(now); P.ax = now;
      presses.forEach(k => {
        const d = this.DIRS.indexOf(k); P.flash[d] = 0.15;
        const n = S.notes.findIndex((q, j) => q.d === d && !P.hit.has(j) && Math.abs(q.t - t) < 0.18);
        if (n < 0) { P.combo = 0; return; }
        P.hit.add(n); const off = Math.abs(S.notes[n].t - t), perfect = off < 0.07; P.combo++;
        P.pts += (perfect ? 3 : 1) + Math.floor(P.combo / 10); P.fx = perfect ? 'PERFECT' : 'GOOD'; P.fxT = 0.5;
      });
      S.notes.forEach((q, j) => { if (!P.hit.has(j) && t - q.t > 0.18 && !q['m' + i]) { q['m' + i] = true; P.combo = 0; P.fx = 'MISS'; P.fxT = 0.5; } });
    });
    if (t > S.end) m.finish(this.score(m, S));
  },
  bot(m, S, i) {
    const P = S.p[i], v = m.vin[i], t = m.t; v.left = v.right = v.up = v.down = v.a = v.b = false;
    S.notes.forEach((q, j) => { if (!P.hit.has(j) && !q['b' + i] && t >= q.t - P.err) { q['b' + i] = true; if (Math.random() < 0.9) v[this.DIRS[q.d]] = true; P.err = R.range(-0.02, 0.1); } });
  },
  score(m, S) { return S.p.map(P => P.pts); },
  fmt(s) { return `${s} pts`; },
  hud(m, S, i) { return `${S.p[i].pts}` + (S.p[i].combo > 4 ? ` · ${S.p[i].combo}x` : ''); },
  draw(m, S, g) {
    const t = m.t;
    g.fillStyle = '#140a2a'; g.fillRect(0, 0, 1280, 720);
    // disco floor tiles pulsing on the beat
    const pulse = 1 - (t * 2 % 1);
    for (let x = 0; x < 1280; x += 80) for (let y = 440; y < 720; y += 70) { const k = ((x / 80 | 0) + (y / 70 | 0) + Math.floor(t * 2)) % 4; g.fillStyle = ['#ff6b8a', '#5ab8ff', '#ffe680', '#7cf06a'][k]; g.globalAlpha = 0.2 + 0.25 * pulse * (k === 0 ? 1 : 0.4); g.fillRect(x + 2, y + 2, 76, 66); } g.globalAlpha = 1;
    MGH.glow(g, 640, 80, 120, `rgba(255,255,255,${0.15 + 0.15 * pulse})`); g.fillStyle = '#ccc'; g.beginPath(); g.arc(640, 70, 34, 0, 7); g.fill();
    for (let k = 0; k < 4; k++) { const a = t * 0.8 + k * 1.57; g.fillStyle = `rgba(${['255,100,140', '90,180,255', '255,230,120', '120,240,110'][k]},0.08)`; g.beginPath(); g.moveTo(640, 70); g.lineTo(640 + Math.cos(a) * 900 - 80, 720); g.lineTo(640 + Math.cos(a) * 900 + 80, 720); g.fill(); }
    for (let i = 0; i < 4; i++) {
      const P = S.p[i], p = m.players[i], ox = 40 + i * 310, lw = 56;
      g.fillStyle = 'rgba(0,0,0,0.45)'; MGH.rr(g, ox - 6, 120, lw * 4 + 12, 300, 12); g.fill();
      for (let d = 0; d < 4; d++) { const x = ox + d * lw + lw / 2; g.strokeStyle = this.COL[d]; g.globalAlpha = 0.5 + P.flash[d] * 3; g.lineWidth = 3; g.beginPath(); g.arc(x, this.TY, 22, 0, 7); g.stroke(); g.globalAlpha = 1; MGH.text(g, this.GLY[d], x, this.TY + 8, 20, 'rgba(255,255,255,0.4)', 'center', 'bold'); }
      S.notes.forEach((q, j) => { if (P.hit.has(j)) return; const y = this.TY + (q.t - t) * this.SPD; if (y < 110 || y > 430) return; const x = ox + q.d * lw + lw / 2; g.fillStyle = this.COL[q.d]; g.beginPath(); g.arc(x, y, 20, 0, 7); g.fill(); MGH.text(g, this.GLY[q.d], x, y + 8, 20, '#fff', 'center', 'bold'); });
      if (P.fxT > 0) MGH.text(g, P.fx, ox + lw * 2, 140, 18, P.fx === 'MISS' ? '#ff6b6b' : P.fx === 'PERFECT' ? '#ffe680' : '#9fffa0', 'center', 'bold');
      const dancing = P.fxT > 0 && P.fx !== 'MISS', mv = Math.sin(t * Math.PI * 2);
      Char.draw(g, ox + lw * 2, 560 - (dancing ? Math.abs(mv) * 16 : 0), 40, p.el.id, p.color, { mood: MGH.persona(P.fx === 'MISS' && P.fxT > 0 ? 'hurt' : P.combo > 9 ? 'cheer' : 'happy', p.el.id), seed: i * 1.7, look: { x: mv * 0.4, y: 0.2 }, walk: dancing ? 1 : 0, hands: dancing ? { n: { x: -1, y: -1.4 - mv * 0.3, d: -120, o: true, m: true }, f: { x: 1, y: -1.4 + mv * 0.3, d: -60, o: true, m: false } } : undefined });
      MGH.text(g, `${P.pts}`, ox + lw * 2, 680, 28, p.color, 'center', 'bold'); if (P.combo > 4) MGH.text(g, `${P.combo} combo`, ox + lw * 2, 706, 14, '#ffe680', 'center', 'bold');
    }
  },
});

// ======================================================================== GHOST HUNT (1 vs 3)
MG.def({
  id: 'ghosthunt', name: 'Ghost Hunt', type: 'Stealth', mode: '1v3', controls: 'Move + button', dur: 0,
  rows: [['stick', 'Move'], ['a', 'Hunters: zap · Ghost: BOO!'], ['b', 'Ghost: vanish (when the meter is full)']],
  how: 'One player is an invisible GHOST haunting a dark mansion; three hunters carry torches. HUNTERS: the ghost only shows up inside your torch beam — keep it in YOUR beam until the lock-on ring closes, then press A to zap (4 zaps wins). If ALL THREE hunters catch the ghost in their beams at the same time, that\'s an instant TEAM ZAP! GHOST: you can only be seen in the beams — and your VANISH meter fills up over time: when it\'s full, press B to disappear completely for 2 seconds, even inside a beam! Sneak up behind a hunter and press A to BOO! them — six scares and the ghost wins. Creaking floorboards give a running ghost away!',
  wins: 'Hunters: 4 zaps. Ghost: 6 scares. At the 60-second bell, whoever is further along their own goal wins (a tie goes to sudden death).',
  init(m, S) {
    S.ghost = m.players.findIndex((p, i) => m.teamOf(i) === 0);
    S.b = [0, 1, 2, 3].map(i => Object.assign(MGH.body(i === S.ghost ? 640 : 300 + i * 200, i === S.ghost ? 170 : 620, 22), { cd: 0, stun: 0, fx: 0 }));
    S.zaps = 0; S.scares = 0; S.win = -1; S.creak = [];
  },
  lit(S, i) { const g = S.b[S.ghost]; return [0, 1, 2, 3].some(j => { if (j === S.ghost || S.b[j].stun > 0) return false; const h = S.b[j], dx = g.x - h.x, dy = g.y - h.y, d = Math.hypot(dx, dy); if (d > 255 || (g.hide || 0) > 0) return false; const f = h.face, dot = (dx * f.x + dy * f.y) / (d || 1); return dot > 0.86 || d < 50; }); },
  update(m, S, dt) {
    const G = S.b[S.ghost];
    S.b.forEach((b, i) => {
      b.cd -= dt; b.stun -= dt; b.fx -= dt; b.inv = (b.inv || 0) - dt;
      if (b.tx && b.stun <= 0) { b.x = b.tx[0]; b.y = b.tx[1]; b.vx = b.vy = 0; b.tx = null; }
      const a = m.axis(i), sp = i === S.ghost ? 290 : 230;
      if (b.stun > 0) { MGH.steer(b, b.face.x, b.face.y, dt, 2600, 360, 4); }
      else MGH.steer(b, a.x, a.y, dt, 2000, sp, 7);
      MGH.integrate(b, dt, 60, 110, 1220, 690);
      if (i === S.ghost) {
        b.cloak = Math.min(1, (b.cloak || 0) + dt / 12); b.hide = (b.hide || 0) - dt;
        if (m.pressed(i, 'b') && b.cloak >= 1) { b.cloak = 0; b.hide = 2.2; Sfx.tone(300, 0.5, 'sine', 0.05, -200); }
        if (Math.hypot(b.vx, b.vy) > 200 && Math.random() < dt * 1.3) S.creak.push({ x: b.x + R.range(-30, 30), y: b.y + R.range(-30, 30), t: 0 });
        if (m.pressed(i, 'a') && b.cd <= 0) { b.cd = 1; const h = [0, 1, 2, 3].filter(j => j !== i && S.b[j].stun <= 0 && dist(S.b[j].x, S.b[j].y, b.x, b.y) < 70)[0]; if (h !== undefined) { const H = S.b[h]; H.stun = 1.6; H.face = { x: Math.sign(H.x - b.x) || 1, y: 0 }; S.scares++; b.fx = 0.6; Sfx.tone(180, 0.4, 'sawtooth', 0.06, -100); MGH.burst(H.x, H.y, ['#c8b8ff', '#fff'], 14, { speed: 200 }); } }
      } else {
        { const dx = G.x - b.x, dy = G.y - b.y, d = Math.hypot(dx, dy) || 1; b.lock = d < 240 && (G.hide || 0) <= 0 && (dx * b.face.x + dy * b.face.y) / d > 0.86 && b.stun <= 0 && (G.inv || 0) <= 0 ? (b.lock || 0) + dt : Math.max(0, (b.lock || 0) - dt * 2); }
        if (!(m.pressed(i, 'a') && b.cd <= 0 && b.stun <= 0)) return;
        b.cd = 0.8; b.fx = 0.2; Sfx.tone(900, 0.06, 'square', 0.03);
        const dx = G.x - b.x, dy = G.y - b.y, d = Math.hypot(dx, dy);
        if (b.lock >= 0.7 && d < 240 && (G.hide || 0) <= 0 && (dx * b.face.x + dy * b.face.y) / (d || 1) > 0.9 && G.stun <= 0 && (G.inv || 0) <= 0) { S.zaps++; G.stun = 0.8; G.inv = 3; MGH.burst(G.x, G.y, ['#9fe0ff', '#fff'], 20, { speed: 260 }); Sfx.boom(); const far = [[140, 160], [1140, 160], [140, 640], [1140, 640]].sort((p, q) => Math.min(...[0, 1, 2, 3].filter(j => j !== S.ghost).map(j => dist(S.b[j].x, S.b[j].y, q[0], q[1]))) - Math.min(...[0, 1, 2, 3].filter(j => j !== S.ghost).map(j => dist(S.b[j].x, S.b[j].y, p[0], p[1]))))[0]; G.tx = far; }
      }
    });
    // TEAM ZAP: when all three hunters have their torch beams on the ghost at once, it counts as a zap (no button needed)
    { const H = [0, 1, 2, 3].filter(j => j !== S.ghost), on = H.every(j => { const h = S.b[j]; if (h.stun > 0) return false; const dx = G.x - h.x, dy = G.y - h.y, d = Math.hypot(dx, dy) || 1; return d < 255 && (dx * h.face.x + dy * h.face.y) / d > 0.86; });
      S.team = on && G.stun <= 0 && (G.inv || 0) <= 0 && (G.hide || 0) <= 0 && m.t > 2 ? (S.team || 0) + dt : 0;
      if (S.team >= 0.5) { S.team = 0; S.zaps++; G.stun = 0.8; G.inv = 3; MGH.burst(G.x, G.y, ['#ffe680', '#9fe0ff', '#fff'], 28, { speed: 300 }); Sfx.boom(); MGH.pop('TEAM ZAP!', G.x, G.y - 60, '#ffe680', 30); const far = [[140, 160], [1140, 160], [140, 640], [1140, 640]].sort((p, q) => Math.min(...H.map(j => dist(S.b[j].x, S.b[j].y, q[0], q[1]))) - Math.min(...H.map(j => dist(S.b[j].x, S.b[j].y, p[0], p[1]))))[0]; G.tx = far; } }
    S.creak.forEach(c => { c.t += dt; }); S.creak = S.creak.filter(c => c.t < 1);
    if (S.zaps >= 4) { S.win = 1; m.finish(this.score(m, S)); }
    else if (S.scares >= 6) { S.win = 0; m.finish(this.score(m, S)); }
    else if (m.t >= 60) { // the bell: compare progress toward each side's own goal (zaps out of 4 vs scares out of 6)
      const h = S.zaps / 4, gh = S.scares / 6;
      if (Math.abs(h - gh) > 1e-6) { S.win = h > gh ? 1 : 0; m.finish(this.score(m, S)); }
      else { if (!S.sudden) { S.sudden = true; Sfx.whistle(); } if (m.t > 85) { S.win = Math.random() < 0.5 ? 1 : 0; m.finish(this.score(m, S)); } }
    }
  },
  bot(m, S, i) {
    const b = S.b[i], v = m.vin[i], G = S.b[S.ghost]; v.a = v.b = false;
    if (i === S.ghost && (b.cloak || 0) >= 1 && [0, 1, 2, 3].some(j => j !== i && (S.b[j].lock || 0) > 0.25)) { v.b = true; }
    if (i === S.ghost) {
      // sneak toward the hunter whose back is turned
      const prey = [0, 1, 2, 3].filter(j => j !== i && S.b[j].stun <= 0).map(j => S.b[j]).sort((p, q) => dist(p.x, p.y, b.x, b.y) - dist(q.x, q.y, b.x, b.y))[0];
      if (!prey) { MGH.aim(m, i, 640, 380, b); return; }
      const bx = prey.x - prey.face.x * 50, by = prey.y - prey.face.y * 50;
      const hj = [0, 1, 2, 3].filter(j => j !== i).sort((p, q) => (S.b[q].lock || 0) - (S.b[p].lock || 0))[0], H = S.b[hj];
      if ((H.lock || 0) > 0.12) { if (!b.dodge) b.dodge = R.pick([-1, 1]); const nx = b.x - H.face.y * b.dodge * 200, ny = b.y + H.face.x * b.dodge * 200; if (nx < 90 || nx > 1190 || ny < 130 || ny > 670) b.dodge = -b.dodge; MGH.aim(m, i, b.x - H.face.y * b.dodge * 200, b.y + H.face.x * b.dodge * 200, b); return; } else b.dodge = 0;
      MGH.aim(m, i, bx, by, b, 6); if (dist(prey.x, prey.y, b.x, b.y) < 60 && b.cd <= 0) v.a = true;
      return;
    }
    if (b.stun > 0) return;
    // hunters wander, sweep their torches, turn toward creaks, and zap what they see
    const ck = S.creak.filter(c => dist(c.x, c.y, b.x, b.y) < 380).pop();
    if (!b.wp || dist(b.wp.x, b.wp.y, b.x, b.y) < 40 || Math.random() < 0.004) b.wp = { x: R.range(120, 1160), y: R.range(150, 650) };
    if (ck && Math.random() < 0.02) b.wp = { x: ck.x, y: ck.y }; const t = b.wp; MGH.aim(m, i, t.x, t.y, b, 10);
    if (this.lit(S) && G.stun <= 0) { const dx = G.x - b.x, dy = G.y - b.y, d = Math.hypot(dx, dy); MGH.aim(m, i, G.x, G.y, b, 4); if (d < 230 && (dx * b.face.x + dy * b.face.y) / d > 0.9 && b.cd <= 0 && (G.inv || 0) <= 0 && b.lock >= 0.7 && Math.random() < 0.08) v.a = true; }
  },
  score(m, S) { const hW = S.win === 1 || (S.win < 0 && S.zaps / 4 > S.scares / 6); return m.players.map((p, i) => (i === S.ghost) !== hW ? 1 : 0); },
  fmt(s) { return s ? 'WIN' : '—'; },
  hud(m, S, i) { return i === S.ghost ? `👻 scares ${S.scares}/6` : `🔦 zaps ${S.zaps}/4`; },
  draw(m, S, g) {
    // mansion floor
    g.fillStyle = '#1a1424'; g.fillRect(0, 0, 1280, 720);
    for (let x = 60; x < 1220; x += 80) for (let y = 110; y < 690; y += 40) { g.fillStyle = ((x / 80 | 0) + (y / 40 | 0)) % 2 ? '#2a2030' : '#241c2a'; g.fillRect(x, y, 80, 40); }
    g.strokeStyle = '#4a3a5a'; g.lineWidth = 8; g.strokeRect(56, 106, 1168, 588);
    for (const [x, y] of [[200, 250], [1080, 250], [640, 540], [400, 560], [880, 200]]) { g.fillStyle = '#3a2a3a'; MGH.rr(g, x - 50, y - 24, 100, 48, 8); g.fill(); g.fillStyle = '#5a3a4a'; MGH.rr(g, x - 44, y - 30, 88, 18, 6); g.fill(); }
    // darkness with torch beams cut out (drawn as light cones on top)
    const G = S.b[S.ghost];
    S.b.forEach((b, i) => {
      if (i === S.ghost) return;
      const a = Math.atan2(b.face.y, b.face.x);
      const gr = g.createRadialGradient(b.x, b.y, 10, b.x, b.y, 255); gr.addColorStop(0, b.stun > 0 ? 'rgba(255,240,180,0.05)' : 'rgba(255,240,180,0.35)'); gr.addColorStop(1, 'rgba(255,240,180,0)');
      g.fillStyle = gr; g.beginPath(); g.moveTo(b.x, b.y); g.arc(b.x, b.y, 255, a - 0.6, a + 0.6); g.closePath(); g.fill();
      MGH.glow(g, b.x, b.y, 50, 'rgba(255,240,180,0.15)');
    });
    S.creak.forEach(c => { g.globalAlpha = 1 - c.t; MGH.text(g, 'creak', c.x, c.y, 13, '#c8b8ff', 'center', 'bold'); g.globalAlpha = 1; });
    const lit = this.lit(S), ghostView = !m.bot(S.ghost);
    S.b.forEach((b, i) => {
      if (i === S.ghost) {
        const al = (G.hide > 0 ? (ghostView ? 0.12 : 0) : (lit || G.stun > 0 ? 0.95 : G.fx > 0 ? 0.8 : 0.07)) * (G.inv > 0 && G.stun <= 0 ? 0.5 : 1);
        g.save(); g.globalAlpha = al; const fl = Math.sin(m.t * 3) * 4;
        g.fillStyle = '#e8e2ff'; g.beginPath(); g.arc(b.x, b.y - 12 + fl, 26, Math.PI, 0); g.lineTo(b.x + 26, b.y + 18 + fl); for (let k = 0; k < 4; k++) g.quadraticCurveTo(b.x + 26 - k * 13 - 6, b.y + 26 + fl, b.x + 26 - (k + 1) * 13, b.y + 18 + fl); g.closePath(); g.fill();
        g.fillStyle = '#2a1a4a'; g.beginPath(); g.ellipse(b.x - 9, b.y - 14 + fl, 4, 6, 0, 0, 7); g.ellipse(b.x + 9, b.y - 14 + fl, 4, 6, 0, 0, 7); g.fill();
        if (b.fx > 0) { g.beginPath(); g.ellipse(b.x, b.y + fl, 8, 10, 0, 0, 7); g.fill(); MGH.text(g, 'BOO!', b.x, b.y - 50, 26, '#c8b8ff', 'center', 'bold'); }
        g.restore();
        const lk = Math.max(0, ...[0, 1, 2, 3].filter(j => j !== S.ghost).map(j => S.b[j].lock || 0)); if (lk > 0 && al > 0.5) { g.strokeStyle = lk >= 0.7 ? '#ff6b6b' : '#9fe0ff'; g.lineWidth = 4; g.beginPath(); g.arc(b.x, b.y, 40, -Math.PI / 2, -Math.PI / 2 + Math.min(1, lk / 0.7) * Math.PI * 2); g.stroke(); }
        Char.draw(g, b.x, b.y - 62, 12, m.players[i].el.id, m.players[i].color, { headOnly: true, mood: 'evil', seed: i, alpha: al * 0.9 });
      } else {
        MGH.drawBody(g, b, m.players[i], '', b.stun > 0 ? 'scared' : 'determined');
        if (b.fx > 0) MGH.glow(g, b.x + b.face.x * 40, b.y + b.face.y * 40, 40, 'rgba(160,230,255,0.9)');
      }
    });
    g.fillStyle = 'rgba(0,0,0,0.5)'; MGH.rr(g, 440, 60, 400, 34, 12); g.fill();
    { // fair tug-of-war: each side's share of its own goal
      const h = S.zaps / 4, gh = S.scares / 6, x0 = 440, w = 320, y = 70;
      g.fillStyle = 'rgba(0,0,0,0.55)'; MGH.rr(g, x0 - 100, y - 22, w + 200, 60, 18); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.12)'; MGH.rr(g, x0, y - 8, w, 18, 9); g.fill();
      g.fillStyle = '#ffd34d'; MGH.rr(g, x0, y - 8, w / 2 * h, 18, 9); g.fill();
      g.fillStyle = '#b88aff'; MGH.rr(g, x0 + w - w / 2 * gh, y - 8, w / 2 * gh, 18, 9); g.fill();
      g.fillStyle = '#fff'; g.fillRect(x0 + w / 2 - 1.5, y - 14, 3, 30);
      MGH.text(g, `🔦 ${S.zaps}/4`, x0 - 50, y + 7, 20, '#ffd34d', 'center', 'bold'); MGH.text(g, `👻 ${S.scares}/6`, x0 + w + 50, y + 7, 20, '#d8c0ff', 'center', 'bold');
      MGH.text(g, S.sudden ? '⚡ SUDDEN DEATH — next point wins!' : `⏱ ${Math.max(0, 60 - m.t).toFixed(0)}s`, x0 + w / 2, y + 30, 15, S.sudden ? '#ff9a8a' : '#fff', 'center', 'bold');
    }
    { const c = G.cloak || 0; g.fillStyle = 'rgba(0,0,0,0.5)'; MGH.rr(g, 880, 64, 180, 26, 10); g.fill(); g.fillStyle = c >= 1 ? '#c8b8ff' : '#7a6aaa'; MGH.rr(g, 884, 68, 172 * c, 18, 8); g.fill(); MGH.text(g, G.hide > 0 ? 'VANISHED!' : c >= 1 ? 'B = VANISH' : 'vanish', 970, 83, 13, '#fff', 'center', 'bold'); }
  },
});

// ======================================================================== TAG-TEAM SUMO (2 vs 2)
MG.def({
  id: 'tagsumo', name: 'Tag-Team Sumo', type: 'Arena', mode: '2v2', controls: 'Move + button', dur: 60,
  rows: [['stick', 'Shove around'], ['a', 'Charge (hold, let go to slam)']],
  how: 'Two teams on a round straw ring. Push the other team out! Hold A to plant your feet and charge a slam, let go to rocket forward. A knocked-out wrestler comes back after a few seconds — every knock-out scores a point for the other team.',
  wins: 'Team with the most knock-outs.',
  CX: 640, CY: 400, RR: 270,
  init(m, S) { S.ko = [0, 0]; const k = [0, 0]; S.b = m.players.map((p, i) => { const tm = m.teamOf(i), j = k[tm]++; return Object.assign(MGH.body(this.CX + (tm ? 120 : -120), this.CY + (j ? 80 : -80), 30), { tm, ch: 0, dash: 0, out: 0, fall: 0 }); }); },
  update(m, S, dt) {
    S.b.forEach((b, i) => {
      if (b.out > 0) { b.out -= dt; b.fall += dt; if (b.out <= 0) { b.x = this.CX + (b.tm ? 120 : -120); b.y = this.CY + R.range(-80, 80); b.vx = b.vy = 0; b.fall = 0; b.inv = 1; } return; }
      b.dash -= dt; b.inv = (b.inv || 0) - dt;
      const a = m.axis(i);
      if (m.held(i, 'a')) { b.ch = Math.min(1, b.ch + dt / 0.8); MGH.steer(b, a.x * 0.2, a.y * 0.2, dt, 1000, 80, 8); }
      else { if (b.ch > 0.15) { b.dash = 0.25; const l = Math.hypot(a.x, a.y) > 0.3 ? a : b.face; const n = Math.hypot(l.x, l.y) || 1; b.vx = l.x / n * (480 + 600 * b.ch); b.vy = l.y / n * (480 + 600 * b.ch); Sfx.whoosh(true); } b.ch = 0; if (b.dash <= 0) MGH.steer(b, a.x, a.y, dt, 1500, 250, 4); }
      b.x += b.vx * dt; b.y += b.vy * dt; if (b.dash <= 0) { b.vx *= Math.exp(-2 * dt); b.vy *= Math.exp(-2 * dt); }
      if (dist(b.x, b.y, this.CX, this.CY) > this.RR + 10) { b.out = 2.5; S.ko[1 - b.tm]++; Sfx.thud(); MGH.burst(b.x, b.y, ['#e8d090', '#fff'], 16, { speed: 220 }); }
    });
    for (let x = 0; x < 4; x++) for (let y = x + 1; y < 4; y++) {
      const A = S.b[x], B = S.b[y]; if (A.out > 0 || B.out > 0) continue;
      const dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy) || 1, mn = A.r + B.r; if (d >= mn) continue;
      const nx = dx / d, ny = dy / d, o = (mn - d) / 2; A.x -= nx * o; A.y -= ny * o; B.x += nx * o; B.y += ny * o;
      const rel = (B.vx - A.vx) * nx + (B.vy - A.vy) * ny; if (rel >= 0) continue;
      const mA = (A.ch > 0 ? 1.3 : 1) * (A.dash > 0 ? 2.2 : 1) * (A.inv > 0 ? 3 : 1), mB = (B.ch > 0 ? 1.3 : 1) * (B.dash > 0 ? 2.2 : 1) * (B.inv > 0 ? 3 : 1), j = -rel * 1.9;
      A.vx -= nx * j * mB / (mA + mB) * 2; A.vy -= ny * j * mB / (mA + mB) * 2; B.vx += nx * j * mA / (mA + mB) * 2; B.vy += ny * j * mA / (mA + mB) * 2;
      if (-rel > 300) { Sfx.thud(); MGH.burst((A.x + B.x) / 2, (A.y + B.y) / 2, ['#fff', '#ffe680'], 6, { speed: 150 }); }
    }
  },
  bot(m, S, i) {
    const b = S.b[i], v = m.vin[i]; if (b.out > 0) { v.a = false; return; }
    const foes = S.b.filter(o => o.tm !== b.tm && o.out <= 0); const f = foes.sort((p, q) => dist(p.x, p.y, b.x, b.y) - dist(q.x, q.y, b.x, b.y))[0];
    const dc = dist(b.x, b.y, this.CX, this.CY);
    if (!f || dc > this.RR - 60) { MGH.aim(m, i, this.CX, this.CY, b); v.a = false; return; }
    // line up so the foe is between us and the edge, then charge
    if (!b.side || Math.random() < 0.01) b.side = R.pick([-1, 1]); const fx = f.x - this.CX, fy = f.y - this.CY, fl = Math.hypot(fx, fy) || 1, gx = f.x - fx / fl * 70 - fy / fl * 50 * b.side, gy = f.y - fy / fl * 70 + fx / fl * 50 * b.side;
    const lined = dist(b.x, b.y, gx, gy) < 90;
    if (lined && !b.bc && Math.random() < 0.05) b.bc = R.range(0.25, 0.7);
    if (b.bc) { b.bc -= 1 / 60; MGH.aim(m, i, f.x, f.y, b); v.a = b.bc > 0; if (b.bc <= 0) b.bc = 0; }
    else { MGH.aim(m, i, gx, gy, b); v.a = false; }
  },
  score(m, S) { return m.players.map((p, i) => S.ko[m.teamOf(i)]); },
  fmt(s) { return `${s} KOs`; },
  hud(m, S, i) { return MG.TEAMN[m.teamOf(i)]; },
  draw(m, S, g) {
    g.fillStyle = MGH.grad(g, 0, 720, ['#3a2a1a', '#5a3a20']); g.fillRect(0, 0, 1280, 720);
    MGH.crowd(g, m.t, 120, 30, ['#6a3a2a', '#3a4a6a', '#5a5a2a', '#4a2a4a']);
    g.fillStyle = '#c8a868'; g.beginPath(); g.ellipse(this.CX, this.CY + 30, this.RR + 60, (this.RR + 60) * 0.9, 0, 0, 7); g.fill();
    g.fillStyle = '#e8d098'; g.beginPath(); g.arc(this.CX, this.CY, this.RR + 20, 0, 7); g.fill();
    g.strokeStyle = '#a8884a'; g.lineWidth = 14; g.beginPath(); g.arc(this.CX, this.CY, this.RR, 0, 7); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 4; g.beginPath(); g.moveTo(this.CX - 40, this.CY - 20); g.lineTo(this.CX - 40, this.CY + 20); g.moveTo(this.CX + 40, this.CY - 20); g.lineTo(this.CX + 40, this.CY + 20); g.stroke();
    MGH.text(g, `${S.ko[0]}`, 520, 90, 44, MG.TEAMC[0], 'center', 'bold'); MGH.text(g, `${S.ko[1]}`, 760, 90, 44, MG.TEAMC[1], 'center', 'bold'); MGH.text(g, '—', 640, 90, 36, '#fff', 'center', 'bold');
    const ents = S.b.map((b, i) => ({ y: b.y, f: () => {
      if (b.out > 0) { if (b.fall > 1) return; g.save(); g.globalAlpha = 1 - b.fall; g.translate(b.x, b.y + b.fall * 120); g.rotate(b.fall * 6); MGH.drawBody(g, Object.assign({}, b, { x: 0, y: 0 }), m.players[i], '', 'scared'); g.restore(); return; }
      g.fillStyle = MG.TEAMC[b.tm]; g.globalAlpha = 0.5; g.beginPath(); g.ellipse(b.x, b.y + 34, 34, 10, 0, 0, 7); g.fill(); g.globalAlpha = 1;
      if (b.ch > 0) MGH.glow(g, b.x, b.y, 40 + b.ch * 30, 'rgba(255,200,80,0.6)');
      MGH.drawBody(g, b, m.players[i], '', b.ch > 0 ? 'effort' : b.dash > 0 ? 'determined' : 'happy');
    } }));
    ents.sort((a, b) => a.y - b.y).forEach(e => e.f());
  },
});
