'use strict';
// Party batch 4a: Wheel Drive, Rocket Fuel (the one mash game), Hot Potato, Shell Shuffle, Bobsled Run (2v2)

// ======================================================================== WHEEL DRIVE (bumper karts on a spinning, shrinking wheel)
MG.def({
  id: 'wheeldrive', name: 'Wheel Drive', type: 'Arena', controls: 'Move + button', dur: 0,
  rows: [['stick', 'Drive'], ['a', 'Turbo ram']],
  how: 'Bumper karts on a giant spinning wheel! The spin slowly drags you outward, and the outer rings drop away one by one. Drive with the stick and press A for a turbo ram to knock rivals off the edge. Last kart on the wheel wins.',
  wins: 'Last kart standing.',
  CX: 640, CY: 400,
  init(m, S) {
    S.R = 300; S.ang = 0; S.w = 0.5; S.next = 9; S.warn = 0; S.order = []; S.t = 0;
    S.k = [0, 1, 2, 3].map(i => { const a = i * Math.PI / 2 + Math.PI / 4; return Object.assign(MGH.body(this.CX + Math.cos(a) * 150, this.CY + Math.sin(a) * 150, 24), { h: a + Math.PI, cd: 0, boost: 0, fall: 0, out: 0, place: 0 }); });
  },
  update(m, S, dt) {
    S.t += dt; S.ang += S.w * dt; S.w = 0.5 + Math.min(0.6, S.t * 0.012);
    S.next -= dt;
    if (S.next < 2 && S.R > 130) S.warn = 1;
    if (S.next <= 0) { if (S.R > 130) { S.R -= 40; Sfx.boom(); MGH.shake(6); } S.next = 8; S.warn = 0; }
    S.k.forEach((k, i) => {
      k.cd -= dt; k.boost -= dt;
      if (!k.alive) { k.fall += dt; return; }
      const a = m.axis(i), l = Math.hypot(a.x, a.y);
      if (l > 0.3) { const want = Math.atan2(a.y, a.x); let d = ((want - k.h + Math.PI * 3) % (Math.PI * 2)) - Math.PI; k.h += clamp(d, -5 * dt, 5 * dt); }
      const acc = k.boost > 0 ? 1500 : l > 0.3 ? 520 * Math.min(1, l) : 0;
      k.vx += Math.cos(k.h) * acc * dt; k.vy += Math.sin(k.h) * acc * dt;
      if (m.pressed(i, 'a') && k.cd <= 0) { k.boost = 0.22; k.cd = 1.6; Sfx.whoosh(false); }
      // the wheel's spin carries you round (and slightly outward)
      const rx = k.x - this.CX, ry = k.y - this.CY, rr = Math.hypot(rx, ry) || 1;
      k.vx += (-ry * S.w * 1.6 + rx / rr * 40) * dt; k.vy += (rx * S.w * 1.6 + ry / rr * 40) * dt;
      const fr = k.boost > 0 ? 1 : 2.4; k.vx -= k.vx * fr * dt; k.vy -= k.vy * fr * dt;
      const sp = Math.hypot(k.vx, k.vy), mx = k.boost > 0 ? 620 : 320; if (sp > mx) { k.vx *= mx / sp; k.vy *= mx / sp; }
      k.x += k.vx * dt; k.y += k.vy * dt;
      if (Math.hypot(k.x - this.CX, k.y - this.CY) > S.R + 6) { k.alive = false; k.fall = 0; S.order.push(i); k.place = S.order.length; Sfx.bad(); MGH.burst(k.x, k.y, ['#fff', m.players[i].color], 14, { speed: 200 }); }
    });
    // bumps: the faster (or turbo) kart wins the shove
    for (let a = 0; a < 4; a++) for (let b = a + 1; b < 4; b++) {
      const A = S.k[a], B = S.k[b]; if (!A.alive || !B.alive) continue;
      const dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy) || 1, mn = A.r + B.r; if (d >= mn) continue;
      const nx = dx / d, ny = dy / d, o = (mn - d) / 2; A.x -= nx * o; A.y -= ny * o; B.x += nx * o; B.y += ny * o;
      const rel = (B.vx - A.vx) * nx + (B.vy - A.vy) * ny; if (rel >= 0) continue;
      const kA = B.boost > 0 ? 1.9 : 1, kB = A.boost > 0 ? 1.9 : 1, j = -rel * 1.15;
      A.vx -= nx * j * kA; A.vy -= ny * j * kA; B.vx += nx * j * kB; B.vy += ny * j * kB; if (-rel > 200) { Sfx.thud(); MGH.burst((A.x + B.x) / 2, (A.y + B.y) / 2, ['#ffe680', '#fff'], 6, { speed: 160 }); }
    }
    const alive = S.k.filter(k => k.alive);
    if (alive.length <= 1 || S.t > 90) m.finish(this.score(m, S));
  },
  bot(m, S, i) {
    const k = S.k[i], v = m.vin[i]; v.a = false; if (!k.alive) return;
    const rx = k.x - this.CX, ry = k.y - this.CY, rr = Math.hypot(rx, ry);
    let gx = this.CX - rx * 0.2, gy = this.CY - ry * 0.2;
    const prey = S.k.filter((o, j) => j !== i && o.alive).sort((a, b) => dist(a.x, a.y, k.x, k.y) - dist(b.x, b.y, k.x, k.y))[0];
    if (prey && rr < S.R * 0.6) { const pr = Math.hypot(prey.x - this.CX, prey.y - this.CY); if (pr > rr) { gx = prey.x; gy = prey.y; } }
    if (rr > S.R - 70) { gx = this.CX; gy = this.CY; }
    // lead against the spin a little
    gx += ry * 0.25 * S.w; gy -= rx * 0.25 * S.w;
    MGH.aim(m, i, gx, gy, k, 8);
    if (prey && k.cd <= 0 && dist(prey.x, prey.y, k.x, k.y) < 120 && rr < S.R - 60) { const hx = Math.cos(k.h), hy = Math.sin(k.h), dx = prey.x - k.x, dy = prey.y - k.y, l = Math.hypot(dx, dy); if ((hx * dx + hy * dy) / l > 0.8 && Math.random() < 0.2) v.a = true; }
  },
  score(m, S) { return S.k.map(k => k.alive ? 10 : k.place); },
  fmt(s) { return s >= 10 ? 'Survived!' : `out #${s}`; },
  hud(m, S, i) { return S.k[i].alive ? 'driving' : 'out'; },
  draw(m, S, g) {
    MGH.scene(g, 'sunset', m.t);
    g.fillStyle = 'rgba(20,10,40,0.35)'; g.fillRect(0, 0, 1280, 720);
    const { CX, CY } = this;
    MGH.shadow(g, CX, CY + 30, S.R + 10, 0.35);
    // dropped rings below
    g.fillStyle = 'rgba(40,20,60,0.5)'; g.beginPath(); g.arc(CX, CY + 16, S.R + 8, 0, 7); g.fill();
    // the wheel: alternating wedges, a rim and spokes, spinning
    const n = 16;
    for (let s = 0; s < n; s++) { g.fillStyle = s % 2 ? '#3a8ad8' : '#f4f4f4'; g.beginPath(); g.moveTo(CX, CY); g.arc(CX, CY, S.R, S.ang + s * Math.PI * 2 / n, S.ang + (s + 1) * Math.PI * 2 / n); g.closePath(); g.fill(); }
    for (let r = 80; r < S.R; r += 40) { g.strokeStyle = 'rgba(0,0,0,0.12)'; g.lineWidth = 2; g.beginPath(); g.arc(CX, CY, r, 0, 7); g.stroke(); }
    if (S.warn && S.R > 130) { g.strokeStyle = `rgba(255,70,70,${0.5 + 0.5 * Math.sin(m.t * 20)})`; g.lineWidth = 40; g.beginPath(); g.arc(CX, CY, S.R - 20, 0, 7); g.stroke(); }
    g.strokeStyle = '#ffcf4a'; g.lineWidth = 8; g.beginPath(); g.arc(CX, CY, S.R, 0, 7); g.stroke();
    g.fillStyle = '#ffcf4a'; g.beginPath(); g.arc(CX, CY, 34, 0, 7); g.fill(); MGH.star(g, CX, CY, 20, '#fff', S.ang, false);
    const karts = S.k.map((k, i) => ({ k, i })).sort((a, b) => a.k.y - b.k.y);
    karts.forEach(({ k, i }) => {
      const p = m.players[i]; let sc = 1, al = 1;
      if (!k.alive) { sc = Math.max(0, 1 - k.fall * 1.2); al = sc; if (sc <= 0) return; }
      g.save(); g.globalAlpha = al; g.translate(k.x, k.y + (k.alive ? 0 : k.fall * 60)); g.scale(sc, sc);
      MGH.shadow(g, 0, 14, 30, 0.3);
      g.save(); g.rotate(k.h);
      g.fillStyle = '#222'; for (const [wx, wy] of [[-16, -20], [14, -20], [-16, 20], [14, 20]]) { MGH.rr(g, wx - 7, wy - 5, 14, 10, 3); g.fill(); }
      g.fillStyle = p.color; MGH.rr(g, -26, -18, 52, 36, 12); g.fill(); g.fillStyle = 'rgba(255,255,255,0.35)'; MGH.rr(g, -20, -14, 18, 28, 6); g.fill();
      g.fillStyle = '#ddd'; g.fillRect(22, -14, 6, 28);
      if (k.boost > 0) { g.fillStyle = '#ffb13d'; g.beginPath(); g.moveTo(-26, -8); g.lineTo(-48 - Math.random() * 10, 0); g.lineTo(-26, 8); g.fill(); }
      g.restore();
      Char.draw(g, 0, -8, 17, p.el.id, p.color, { mood: MGH.persona(!k.alive ? 'scared' : k.boost > 0 ? 'determined' : 'happy', p.el.id), seed: i * 1.7, look: { x: Math.cos(k.h), y: Math.sin(k.h) }, noFeet: true, noShadow: true, headOnly: false });
      if (k.cd > 0 && k.alive) { g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, 34, -Math.PI / 2, -Math.PI / 2 + (1 - k.cd / 1.6) * Math.PI * 2); g.stroke(); }
      g.restore();
    });
    if (S.warn && S.R > 130) MGH.label(g, 'The outer ring is about to drop!', 640, 70, 24, '#ff8a8a');
  },
});

// ======================================================================== ROCKET FUEL (the one and only button-mash game)
MG.def({
  id: 'rocket', name: 'Rocket Fuel', type: 'Mash', controls: '1 button (mash)', dur: 0,
  rows: [['a', 'MASH to pump fuel']],
  how: 'The ONE mash game! For ten seconds, mash A as fast as you can to pump fuel into your rocket. Then — lift-off! The rocket with the most fuel flies highest.',
  wins: 'Highest rocket.',
  init(m, S) { S.ph = 'ready'; S.t = 0; S.f = [0, 0, 0, 0]; S.rate = [0, 1, 2, 3].map(() => R.range(6.5, 9.5)); S.bt = [0, 0, 0, 0]; S.pulse = [0, 0, 0, 0]; },
  update(m, S, dt) {
    S.t += dt; S.pulse = S.pulse.map(p => Math.max(0, p - dt));
    if (S.ph === 'ready' && S.t > 2) { S.ph = 'pump'; S.t = 0; Sfx.whistle(); }
    else if (S.ph === 'pump') {
      for (let i = 0; i < 4; i++) if (m.pressed(i, 'a')) { S.f[i]++; S.pulse[i] = 0.1; if (!m.bot(i)) Sfx.tone(300 + Math.min(600, S.f[i] * 6), 0.03, 'square', 0.02); }
      if (S.t >= 10) { S.ph = 'launch'; S.t = 0; Sfx.boom(); MGH.shake(8); }
    } else if (S.ph === 'launch' && S.t > 6.5) m.finish(S.f.slice());
  },
  bot(m, S, i, dt) {
    const v = m.vin[i]; v.a = false; if (S.ph !== 'pump') return;
    S.bt[i] += dt; if (S.bt[i] >= 1 / S.rate[i]) { S.bt[i] = 0; v.a = !m.prev[i].a; }
  },
  score(m, S) { return S.f.slice(); },
  fmt(s) { return `${s} pumps`; },
  hud(m, S, i) { return `${S.f[i]}`; },
  draw(m, S, g) {
    const maxF = Math.max(1, ...S.f), lt = S.ph === 'launch' ? S.t : 0;
    // the sky scrolls down as the rockets climb
    const cam = Math.min(1, lt / 5) * 1;
    g.fillStyle = MGH.grad(g, 0, 720, cam > 0.5 ? ['#0a0a2a', '#1a2a5a', '#3a6aaa'] : ['#3a7ad8', '#8ac8f4', '#e8f4ff']); g.fillRect(0, 0, 1280, 720);
    if (cam > 0.3) MGH.stars(g, m.t, 80, 720, Math.min(1, (cam - 0.3) * 2));
    for (let k = 0; k < 6; k++) MGH.cloud(g, (k * 260 + 80) % 1400 - 60, ((120 + k * 97 + lt * 260) % 900) - 100, 1 + (k % 3) * 0.3);
    const ground = 640 + lt * 140;
    if (ground < 760) { g.fillStyle = '#6aaa4a'; g.fillRect(0, ground, 1280, 720 - ground + 20); g.fillStyle = '#8a8a9a'; g.fillRect(0, ground - 10, 1280, 12); }
    for (let i = 0; i < 4; i++) {
      const p = m.players[i], x = 190 + i * 300, fill = S.f[i] / Math.max(60, maxF);
      const h = S.ph === 'launch' ? Math.min(1, lt / 5) * (S.f[i] / maxF) * 460 + Math.max(0, lt - 5) * 40 * S.f[i] / maxF : 0;
      const y = 560 - h + (S.ph === 'pump' ? Math.sin(m.t * 60) * S.pulse[i] * 20 : 0);
      // rocket
      g.save(); g.translate(x, y);
      if (S.ph === 'launch') { for (let k = 0; k < 5; k++) MGH.fireball(g, R.range(-6, 6), 70 + k * 18, 16 - k * 2, m.t + k, 0, 1); }
      g.fillStyle = '#e8eef4'; g.beginPath(); g.moveTo(0, -90); g.quadraticCurveTo(38, -40, 30, 50); g.lineTo(-30, 50); g.quadraticCurveTo(-38, -40, 0, -90); g.fill();
      g.fillStyle = p.color; g.beginPath(); g.moveTo(0, -90); g.quadraticCurveTo(22, -70, 26, -50); g.lineTo(-26, -50); g.quadraticCurveTo(-22, -70, 0, -90); g.fill();
      g.beginPath(); g.moveTo(-30, 30); g.lineTo(-50, 64); g.lineTo(-26, 50); g.fill(); g.beginPath(); g.moveTo(30, 30); g.lineTo(50, 64); g.lineTo(26, 50); g.fill();
      g.fillStyle = '#9fd8ff'; g.beginPath(); g.arc(0, -16, 22, 0, 7); g.fill(); g.strokeStyle = '#8a9aaa'; g.lineWidth = 4; g.stroke();
      g.save(); g.beginPath(); g.arc(0, -16, 20, 0, 7); g.clip(); Char.draw(g, 0, -10, 15, p.el.id, p.color, { mood: MGH.persona(S.ph === 'launch' ? 'cheer' : 'effort', p.el.id), seed: i * 1.7, noShadow: true }); g.restore();
      g.restore();
      // fuel gauge
      if (S.ph !== 'launch') { g.fillStyle = 'rgba(0,0,0,0.45)'; MGH.rr(g, x + 60, 470, 22, 160, 8); g.fill(); g.fillStyle = MGH.grad(g, 470, 630, ['#ff5a3a', '#ffcf4a', '#7cf06a']); g.fillRect(x + 63, 627 - 154 * Math.min(1, fill), 16, 154 * Math.min(1, fill)); }
      MGH.text(g, `${S.f[i]}`, x, S.ph === 'launch' ? Math.max(60, y - 120) : 690, 28, p.color, 'center', 'bold');
    }
    if (S.ph === 'ready') MGH.label(g, 'Get ready to MASH A!', 640, 200, 40, '#fff');
    if (S.ph === 'pump') { MGH.label(g, `MASH A!  ${Math.max(0, 10 - S.t).toFixed(1)}`, 640, 120, 40, '#ffe680'); }
    if (S.ph === 'launch' && lt < 1.2) MGH.label(g, 'LIFT-OFF!', 640, 200, 56, '#ff8a3d');
  },
});

// ======================================================================== HOT POTATO (toss the fizzing bomb before it pops)
MG.def({
  id: 'hotpotato', name: 'Hot Potato', type: 'Reaction', controls: 'Move + button', dur: 0,
  rows: [['stick', 'Point at a friend'], ['a', 'Toss the bomb']],
  how: 'A fizzing bomb is passed around the circle. If you are holding it, POINT at another player and press A to toss it. Nobody knows when it will pop — the fuse just fizzes faster. Whoever is holding it (or it is flying to) when it pops is out. Last one left wins!',
  wins: 'Last one standing.',
  SPOT: [[640, 200], [1000, 400], [640, 600], [280, 400]],
  init(m, S) { S.alive = [true, true, true, true]; S.order = []; this.round(S); },
  round(S) { const al = [0, 1, 2, 3].filter(i => S.alive[i]); S.hold = R.pick(al); S.fly = null; S.fuse = R.range(7, 13); S.ft = 0; S.ph = 'play'; S.pt = 0; S.catchT = 0.6; S.bR = R.range(0.4, 1.3); S.aim = [0, 1, 2, 3].map(() => -1); },
  target(m, S, i) {
    const a = m.axis(i); if (Math.hypot(a.x, a.y) < 0.5) return -1;
    const [x, y] = this.SPOT[i]; let best = -1, bd = -2;
    for (let j = 0; j < 4; j++) { if (j === i || !S.alive[j]) continue; const dx = this.SPOT[j][0] - x, dy = this.SPOT[j][1] - y, l = Math.hypot(dx, dy), dot = (dx * a.x + dy * a.y) / l / Math.hypot(a.x, a.y); if (dot > bd) { bd = dot; best = j; } }
    return bd > 0.3 ? best : -1;
  },
  update(m, S, dt) {
    S.pt += dt;
    if (S.ph === 'boom') { if (S.pt > 2.2) { if (S.alive.filter(a => a).length <= 1) m.finish(this.score(m, S)); else this.round(S); } return; }
    S.ft += dt; S.catchT -= dt;
    for (let i = 0; i < 4; i++) S.aim[i] = S.alive[i] ? this.target(m, S, i) : -1;
    if (S.fly) { S.fly.t += dt / 0.45; if (S.fly.t >= 1) { S.hold = S.fly.to; S.fly = null; S.catchT = 0.35; S.bR = R.range(0.35, 1.2); Sfx.pop(); } }
    else if (S.catchT <= 0 && m.pressed(S.hold, 'a') && S.aim[S.hold] >= 0) { S.fly = { from: S.hold, to: S.aim[S.hold], t: 0 }; Sfx.whoosh(false); }
    if (S.ft >= S.fuse) {
      const v = S.fly ? S.fly.to : S.hold; S.alive[v] = false; S.order.push(v); S.ph = 'boom'; S.pt = 0; S.fly = null; S.boomAt = this.SPOT[v];
      Sfx.boom(); MGH.shake(14); MGH.burst(this.SPOT[v][0], this.SPOT[v][1], ['#ff5a3a', '#ffe680', '#444'], 40, { speed: 400 });
    }
  },
  bot(m, S, i) {
    const v = m.vin[i]; v.a = false; v.ax = v.ay = 0;
    if (S.ph !== 'play' || S.hold !== i || S.fly) return;
    if (!S.bTo || !S.alive[S.bTo] || S.bTo === i) S.bTo = R.pick([0, 1, 2, 3].filter(j => j !== i && S.alive[j]));
    const [x, y] = this.SPOT[i], [tx, ty] = this.SPOT[S.bTo], l = Math.hypot(tx - x, ty - y); v.ax = (tx - x) / l; v.ay = (ty - y) / l;
    // bots get jumpier as the fuse fizzes faster
    const hurry = S.ft / S.fuse; if (S.catchT < -S.bR * (1 - hurry * 0.6) && S.aim[i] === S.bTo) { v.a = true; S.bTo = 0; }
  },
  score(m, S) { return [0, 1, 2, 3].map(i => S.alive[i] ? 10 : S.order.indexOf(i) + 1); },
  fmt(s) { return s >= 10 ? 'Survived!' : `out #${s}`; },
  hud(m, S, i) { return S.alive[i] ? (S.hold === i && S.ph === 'play' ? '💣 HOLDING' : '') : 'out'; },
  draw(m, S, g) {
    MGH.scene(g, 'meadow', m.t);
    g.fillStyle = 'rgba(120,80,40,0.25)'; g.beginPath(); g.ellipse(640, 400, 460, 260, 0, 0, 7); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.35)'; g.setLineDash([12, 10]); g.lineWidth = 3; g.beginPath(); g.ellipse(640, 400, 360, 200, 0, 0, 7); g.stroke(); g.setLineDash([]);
    const fizz = S.ft / S.fuse;
    for (let i = 0; i < 4; i++) {
      const [x, y] = this.SPOT[i], p = m.players[i], hold = S.ph === 'play' && S.hold === i && !S.fly;
      MGH.shadow(g, x, y + 46, 40, 0.3);
      g.fillStyle = 'rgba(255,255,255,0.25)'; g.beginPath(); g.ellipse(x, y + 46, 52, 16, 0, 0, 7); g.fill();
      Char.draw(g, x, y, 38, p.el.id, p.color, { mood: MGH.persona(!S.alive[i] ? 'out' : hold ? (fizz > 0.6 ? 'scared' : 'nervous') : 'happy', p.el.id), seed: i * 1.7, look: { x: (640 - x) / 400, y: (400 - y) / 300 }, alpha: S.alive[i] ? 1 : 0.35, hands: hold ? { n: { x: -0.4, y: -1.6, d: -90, o: true, m: true }, f: { x: 0.4, y: -1.6, d: -90, o: true, m: false } } : undefined });
      if (S.aim[i] >= 0 && hold) { const [tx, ty] = this.SPOT[S.aim[i]]; g.strokeStyle = 'rgba(255,230,120,0.7)'; g.lineWidth = 5; g.setLineDash([10, 10]); g.beginPath(); g.moveTo(x, y); g.lineTo(x + (tx - x) * 0.4, y + (ty - y) * 0.4); g.stroke(); g.setLineDash([]); }
      MGH.text(g, p.name, x, y + 80, 18, p.color, 'center', 'bold');
    }
    // the bomb
    let bx, by;
    if (S.ph === 'play') {
      if (S.fly) { const [x0, y0] = this.SPOT[S.fly.from], [x1, y1] = this.SPOT[S.fly.to], k = S.fly.t; bx = x0 + (x1 - x0) * k; by = y0 - 70 + (y1 - y0) * k - Math.sin(Math.PI * k) * 120; }
      else { [bx, by] = this.SPOT[S.hold]; by -= 76; }
      const sh = fizz > 0.7 ? Math.sin(m.t * 60) * 3 : 0;
      g.fillStyle = '#2a2a3a'; g.beginPath(); g.arc(bx + sh, by, 24, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,0.3)'; g.beginPath(); g.arc(bx - 8 + sh, by - 8, 7, 0, 7); g.fill();
      g.fillStyle = '#6a6a7a'; g.fillRect(bx - 6 + sh, by - 32, 12, 10);
      g.strokeStyle = '#c8a060'; g.lineWidth = 3; g.beginPath(); g.moveTo(bx + sh, by - 32); g.quadraticCurveTo(bx + 10 + sh, by - 46, bx + 16 + sh, by - 44); g.stroke();
      const sp = 6 + fizz * 14; MGH.glow(g, bx + 16 + sh, by - 44, sp * 2, 'rgba(255,200,80,0.9)'); for (let k = 0; k < 4; k++) MGH.spark(g, bx + 16 + sh + R.range(-sp, sp), by - 44 + R.range(-sp, sp), 3);
      if (Math.random() < fizz * 0.3) Sfx.tone(R.range(2000, 3000), 0.02, 'square', 0.006);
    } else if (S.boomAt) { MGH.glow(g, S.boomAt[0], S.boomAt[1], 160 * Math.max(0, 1 - S.pt), 'rgba(255,150,60,0.9)'); MGH.label(g, 'BOOM!', 640, 90, 48, '#ff8a3d'); }
  },
});

// ======================================================================== SHELL SHUFFLE (watch the cups, then pick secretly with A B X Y)
MG.def({
  id: 'shells', name: 'Shell Shuffle', type: 'Wits', controls: 'A B X Y', dur: 0, noPadSkip: true,
  rows: [['abxy', 'Pick a cup (Y top · B right · A bottom · X left)']],
  how: 'Watch the gem go under a cup, then follow it while the cups shuffle around the diamond. When they stop, secretly press the button of the cup you think hides the gem: TOP = Y, RIGHT = B, BOTTOM = A, LEFT = X. The shuffles get faster every round!',
  wins: 'Most gems found in six rounds.',
  init(m, S) { S.pts = [0, 0, 0, 0]; S.round = 0; this.next(S); },
  next(S) {
    S.round++; S.gem = R.int(0, 3); S.cup = [0, 1, 2, 3]; // S.cup[slot] = cup id; gem sits under a cup id
    S.swaps = []; const n = 4 + S.round * 2; for (let k = 0; k < n; k++) { const a = R.int(0, 3); let b; do b = R.int(0, 3); while (b === a); S.swaps.push([a, b]); }
    S.ph = 'show'; S.pt = 0; S.k = 0; S.st = 0; S.pick = [-1, -1, -1, -1]; S.sp = Math.max(0.2, 0.55 - S.round * 0.06); S.track = S.cup.indexOf(S.gem);
    S.bAt = [0, 1, 2, 3].map(() => R.range(0.6, 2.2)); S.bOk = [0, 1, 2, 3].map(() => Math.random() < Math.max(0.35, 0.95 - S.round * 0.1));
  },
  update(m, S, dt) {
    S.pt += dt;
    if (S.ph === 'show') { if (S.pt > 1.8) { S.ph = 'shuffle'; S.pt = 0; } return; }
    if (S.ph === 'shuffle') {
      S.st += dt / S.sp;
      if (S.st >= 1) { const [a, b] = S.swaps[S.k]; [S.cup[a], S.cup[b]] = [S.cup[b], S.cup[a]]; S.k++; S.st = 0; Sfx.tone(500 + S.k * 20, 0.03, 'triangle', 0.02); if (S.k >= S.swaps.length) { S.ph = 'pick'; S.pt = 0; S.track = S.cup.indexOf(S.gem); } }
      return;
    }
    if (S.ph === 'pick') {
      m.players.forEach((p, i) => { if (S.pick[i] >= 0) return; const d = abxyPress(m, i); if (d >= 0) { S.pick[i] = d; Sfx.click(); } });
      if (S.pick.every(p => p >= 0) || S.pt > 7) { S.pick = S.pick.map(p => p >= 0 ? p : R.int(0, 3)); S.ph = 'reveal'; S.pt = 0; const at = S.cup.indexOf(S.gem); S.pick.forEach((d, i) => { if (d === at) S.pts[i]++; }); Sfx.coin(); }
      return;
    }
    if (S.ph === 'reveal' && S.pt > 2.8) { if (S.round >= 6) m.finish(S.pts.slice()); else this.next(S); }
  },
  bot(m, S, i) {
    if (S.ph !== 'pick' || S.pick[i] >= 0 || S.pt < S.bAt[i]) { abxyBot(m, i, -1); return; }
    const at = S.cup.indexOf(S.gem); abxyBot(m, i, S.bOk[i] ? at : R.pick([0, 1, 2, 3].filter(d => d !== at)));
  },
  score(m, S) { return S.pts.slice(); },
  fmt(s) { return `${s} gems`; },
  hud(m, S, i) { return `${S.pts[i]} 💎` + (S.ph === 'pick' && S.pick[i] >= 0 ? ' ✔' : ''); },
  draw(m, S, g) {
    g.fillStyle = MGH.grad(g, 0, 720, ['#4a1a2a', '#7a2a3a', '#3a1020']); g.fillRect(0, 0, 1280, 720);
    // a velvet table
    g.fillStyle = '#1a6a3a'; g.beginPath(); g.ellipse(640, 400, 420, 260, 0, 0, 7); g.fill(); g.strokeStyle = '#c8a060'; g.lineWidth = 10; g.stroke();
    Char.npc(g, 640, 120, 30, 'host', { mood: S.ph === 'shuffle' ? 'smug' : 'happy', look: { x: 0, y: 0.5 } });
    MGH.label(g, `Round ${S.round} of 6`, 160, 70, 20, '#ffe680');
    const pos = ABXY_POS.map(([x, y]) => [x, y + 30]);
    // where each cup is drawn: during a swap the two cups glide along arcs
    const cupXY = slot => pos[slot];
    const drawn = [];
    for (let slot = 0; slot < 4; slot++) {
      let [x, y] = cupXY(slot);
      if (S.ph === 'shuffle' && S.k < S.swaps.length) {
        const [a, b] = S.swaps[S.k], k = 0.5 - 0.5 * Math.cos(S.st * Math.PI);
        if (slot === a || slot === b) { const o = slot === a ? b : a, [ox, oy] = cupXY(o), sgn = slot === a ? 1 : -1; x += (ox - x) * k; y += (oy - y) * k + Math.sin(k * Math.PI) * 50 * sgn; }
      }
      drawn.push({ slot, x, y, id: S.cup[slot] });
    }
    drawn.sort((a, b) => a.y - b.y).forEach(c => {
      const lift = (S.ph === 'show' && S.pt > 0.3 && S.pt < 1.5) || S.ph === 'reveal' ? (S.ph === 'show' ? Math.sin(Math.min(1, (S.pt - 0.3) / 1.2) * Math.PI) : Math.min(1, S.pt * 2)) * 60 : 0;
      MGH.shadow(g, c.x, c.y + 40, 52, 0.35);
      if (c.id === S.gem && lift > 5) MGH.gem(g, c.x, c.y + 20, 22, '#5fd8ff', m.t);
      g.save(); g.translate(c.x, c.y - lift);
      g.fillStyle = MGH.grad(g, -60, 40, ['#e86a4a', '#a83a2a']); g.beginPath(); g.moveTo(-50, 40); g.lineTo(-34, -50); g.quadraticCurveTo(0, -64, 34, -50); g.lineTo(50, 40); g.quadraticCurveTo(0, 54, -50, 40); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(-26, -40, 8, 70); g.fillStyle = '#ffcf4a'; g.fillRect(-46, 18, 92, 6);
      g.restore();
      if (S.ph === 'pick' || S.ph === 'reveal') abxyBadge(g, c.slot, c.x + 56, c.y - 56, 18);
    });
    if (S.ph === 'reveal') { const at = S.cup.indexOf(S.gem); pos.forEach(([x, y], d) => { const who = [0, 1, 2, 3].filter(i => S.pick[i] === d); who.forEach((i, k) => Char.draw(g, x + (k - (who.length - 1) / 2) * 40, y + 96, 16, m.players[i].el.id, m.players[i].color, { mood: d === at ? 'cheer' : 'sad', seed: i * 1.7 })); }); }
    m.players.forEach((p, i) => {
      const x = 110 + (i % 2) * 1060, y = 240 + Math.floor(i / 2) * 300;
      Char.draw(g, x, y, 36, p.el.id, p.color, { mood: S.ph === 'shuffle' ? 'determined' : S.ph === 'pick' ? (S.pick[i] >= 0 ? 'smug' : 'nervous') : 'happy', seed: i * 1.7, look: { x: x < 640 ? 1 : -1, y: 0 } });
      MGH.text(g, `${p.name}  ${S.pts[i]}`, x, y + 74, 20, p.color, 'center', 'bold');
      if (S.ph === 'pick') MGH.text(g, S.pick[i] >= 0 ? '✔ picked' : 'choosing…', x, y - 70, 16, S.pick[i] >= 0 ? '#7f7' : '#ddd', 'center', 'bold');
    });
    if (S.ph === 'pick') MGH.text(g, `Where is the gem?  ${Math.max(0, 7 - S.pt).toFixed(0)}s`, 640, 700, 22, '#fff', 'center', 'bold');
  },
});

// ======================================================================== BOBSLED RUN (2 vs 2)
// both teammates push in a steady rhythm at the start, then each leans into the curves when the sign reaches the marker
MG.def({
  id: 'bobsled', name: 'Bobsled Run', type: 'Race', mode: '2v2', sport: true, controls: 'Move + A & B', dur: 0,
  rows: [['a', 'Push: A and B in turn, steady'], ['lr', 'Lean into curves']],
  how: 'Team race down the ice! At the start BOTH teammates push: press A and B one after the other in a steady rhythm. Then jump in and lean: when a curve arrow reaches your marker, press that direction (LEFT or RIGHT). Each teammate leans for themselves — two good leans keep the sled flying, a miss scrapes the wall.',
  wins: 'First sled to the finish.',
  LEN: 100,
  init(m, S) {
    S.go = 2; S.t = 0;
    S.s = [0, 1].map(() => ({ d: 0, v: 0, fin: 0, scrape: 0 }));
    S.p = [0, 1, 2, 3].map(() => ({ lastKey: null, lean: {}, err: R.range(0.04, 0.14) }));
    S.curves = []; let d = 24; while (d < this.LEN - 6) { S.curves.push({ d, dir: R.pick([-1, 1]) }); d += R.range(6, 10); }
  },
  update(m, S, dt) {
    S.t += dt; if (S.t < S.go) return;
    [0, 1].forEach(tm => {
      const sl = S.s[tm]; if (sl.fin) return;
      const mem = [0, 1, 2, 3].filter(i => m.teamOf(i) === tm);
      sl.scrape -= dt;
      if (sl.d < 18) { // push phase
        const q = mem.reduce((a, i) => a + MGM.cadence(m, i, S.p[i], dt), 0) / mem.length;
        sl.v += (8 * q - sl.v) * 1.6 * dt;
      } else { sl.v += ((sl.scrape > 0 ? 9 : 16) - sl.v) * 0.5 * dt; }
      sl.d += sl.v * dt;
      // leaning: each curve is judged when the sled reaches it
      for (const c of S.curves) {
        if (sl.d >= c.d - 2.6 && sl.d < c.d) mem.forEach(i => { if (S.p[i].lean[c.d] === undefined) { const l = m.pressed(i, 'left') || (m.axis(i).x < -0.6 && !S.p[i].ax) ? -1 : m.pressed(i, 'right') || (m.axis(i).x > 0.6 && !S.p[i].ax) ? 1 : 0; if (l) S.p[i].lean[c.d] = l === c.dir ? 1 + (sl.d > c.d - 1.3 ? 1 : 0) : -1; } });
        if (sl.d >= c.d && !c['done' + tm]) {
          c['done' + tm] = true;
          const res = mem.map(i => S.p[i].lean[c.d] || -1), ok = res.filter(r => r > 0).length, perfect = res.filter(r => r > 1).length;
          if (ok === 2) { sl.v += 0.8 + perfect * 0.5; if (perfect === 2) MGH.burst(600, tm ? 520 : 240, ['#9fe0ff', '#fff'], 10, { speed: 160 }); }
          else { sl.v *= ok ? 0.8 : 0.6; sl.scrape = 0.8; Sfx.thud(); }
          sl.last = { ok, perfect, t: S.t };
        }
      }
      mem.forEach(i => { S.p[i].ax = Math.abs(m.axis(i).x) > 0.6; });
      if (sl.d >= this.LEN) { sl.fin = S.t - S.go; Sfx.coin(); }
    });
    if (S.s.every(s => s.fin) || S.t > S.go + 50) m.finish(this.score(m, S));
  },
  bot(m, S, i, dt) {
    const v = m.vin[i]; v.a = v.b = false; v.ax = 0; v.left = v.right = false;
    const sl = S.s[m.teamOf(i)]; if (S.t < S.go || sl.fin) return;
    if (sl.d < 18) { MGM.botCadence(m, i, S.p[i], dt); return; }
    const c = S.curves.find(c => c.d > sl.d); if (!c || S.p[i].lean[c.d] !== undefined) return;
    const when = 1.2 - S.p[i].err * 6;
    if (c.d - sl.d < when) { const wrong = Math.random() < 0.08; v[(wrong ? -c.dir : c.dir) < 0 ? 'left' : 'right'] = true; S.p[i].err = R.range(0.02, 0.16); }
  },
  score(m, S) { return [0, 1, 2, 3].map(i => { const s = S.s[m.teamOf(i)]; return s.fin ? 100 - s.fin : s.d / this.LEN * 40; }); },
  fmt(s) { return s > 50 ? `${(100 - s).toFixed(2)}s` : 'DNF'; },
  hud(m, S, i) { return MG.TEAMN[m.teamOf(i)]; },
  draw(m, S, g) {
    MGH.scene(g, 'ice', m.t);
    const X = d => 80 + d * 11.2;
    [0, 1].forEach(tm => {
      const y0 = tm ? 420 : 160, sl = S.s[tm], mem = [0, 1, 2, 3].filter(i => m.teamOf(i) === tm);
      // ice track with walls
      g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(0, y0 + 6, 1280, 180);
      g.fillStyle = MGH.grad(g, y0, y0 + 170, ['#e8f6ff', '#bfe2f8', '#e8f6ff']); g.fillRect(0, y0, 1280, 170);
      g.fillStyle = MG.TEAMC[tm]; g.fillRect(0, y0, 1280, 8); g.fillRect(0, y0 + 162, 1280, 8);
      for (let k = 0; k < 30; k++) { g.strokeStyle = 'rgba(120,170,210,0.3)'; g.lineWidth = 2; g.beginPath(); const xx = (k * 53 - sl.d * 8) % 1400; g.moveTo(xx, y0 + 40 + (k % 5) * 24); g.lineTo(xx + 40, y0 + 40 + (k % 5) * 24); g.stroke(); }
      g.fillStyle = 'rgba(80,120,200,0.25)'; g.fillRect(X(0), y0, X(18) - X(0), 170); MGH.text(g, 'PUSH ZONE', (X(0) + X(18)) / 2, y0 + 28, 14, '#3a5a8a', 'center', 'bold');
      for (let k = 0; k < 6; k++) { g.fillStyle = k % 2 ? '#fff' : '#222'; g.fillRect(X(this.LEN), y0 + 8 + k * 25.7, 10, 25.7); }
      // curve signs ahead
      S.curves.forEach(c => { const x = X(c.d); g.fillStyle = c['done' + tm] ? 'rgba(255,255,255,0.3)' : '#ffcf4a'; MGH.rr(g, x - 18, y0 + 12, 36, 28, 8); g.fill(); MGH.text(g, c.dir < 0 ? '◀' : '▶', x, y0 + 34, 20, c['done' + tm] ? '#888' : '#5a3a10', 'center', 'bold'); g.strokeStyle = 'rgba(255,200,60,0.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y0 + 40); g.lineTo(x, y0 + 162); g.stroke(); });
      // the sled with both riders
      const sx = X(Math.min(this.LEN, sl.d)), sy = y0 + 110, nc = S.curves.find(c => c.d > sl.d), lean = sl.scrape > 0 ? Math.sin(m.t * 40) * 0.08 : 0;
      g.save(); g.translate(sx, sy); g.rotate(lean);
      MGH.shadow(g, 0, 34, 70, 0.3);
      const pushing = sl.d < 18;
      if (!pushing) { mem.forEach((i, k) => { const p = m.players[i]; Char.draw(g, -10 - k * 44, -16, 22, p.el.id, p.color, { mood: MGH.persona(sl.scrape > 0 ? 'scared' : 'cheer', p.el.id), seed: i * 1.7, look: { x: 1, y: 0 }, noFeet: true, noShadow: true }); }); }
      g.fillStyle = MG.TEAMC[tm]; g.beginPath(); g.moveTo(-90, -4); g.lineTo(40, -4); g.quadraticCurveTo(80, 0, 70, 24); g.lineTo(-90, 24); g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(-84, 2, 110, 5); g.fillStyle = '#888'; g.fillRect(-90, 26, 150, 4);
      if (pushing) mem.forEach((i, k) => { const p = m.players[i]; Char.draw(g, -110 - k * 40, -10, 22, p.el.id, p.color, { mood: MGH.persona('effort', p.el.id), seed: i * 1.7, look: { x: 1, y: 0 }, walk: sl.v > 1 ? 1 : 0, t: m.t * (0.6 + sl.v * 0.1), noShadow: true, hands: { n: { x: -1.2, y: 0.1, d: 180, o: true, m: true }, f: { x: -1.2, y: 0.3, d: 180, o: true, m: false } } }); });
      g.restore();
      if (sl.scrape > 0) MGH.burst(sx + R.range(-60, 40), y0 + 160, ['#fff', '#cfe8ff'], 1, { speed: 80 });
      // the lean marker: a ring just ahead of the sled
      if (!pushing && nc && !sl.fin) { const mx = sx + 2.6 * 11.2; g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 3; g.strokeRect(mx - 14.5, y0 + 46, 29, 108); }
      mem.forEach((i, k) => { const r = nc && S.p[i].lean[nc.d]; if (r !== undefined && r !== false && nc) MGH.text(g, r > 1 ? 'PERFECT' : r > 0 ? 'lean!' : 'wrong', sx + 40, y0 + 64 + k * 22, 14, r > 1 ? '#ffe680' : r > 0 ? '#3a9a3a' : '#e84a4a', 'center', 'bold'); });
      if (pushing && S.t > S.go) mem.forEach((i, k) => MGM.drawCadence(g, 200 + k * 220, y0 - 18, S.p[i], 70));
      MGH.text(g, MG.TEAMN[tm] + (sl.fin ? `  ${sl.fin.toFixed(2)}s` : ''), 1180, y0 + 30, 18, MG.TEAMC[tm], 'center', 'bold');
    });
    if (S.t < S.go + 0.6) MGH.label(g, S.t < S.go ? 'Ready…' : 'PUSH!', 640, 110, 44, '#fff');
  },
});
