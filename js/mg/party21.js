'use strict';
// Batch 15a: five new movement games — Grumble's Gauntlet, Conga Line, Cheese Thieves, Puddle Splash, Lamp Lighters

// shared: a player body that can hop (z height) — A to jump
const HOP = {
  tick(m, i, b, dt, power = 430) { b.z = b.z || 0; b.vz = b.vz || 0; b.jcd = (b.jcd || 0) - dt; if (b.z <= 0 && b.jcd <= 0 && m.pressed(i, 'a') && !(b.stun > 0)) { b.vz = power; b.jcd = 0.15; if (!m.bot(i)) Sfx.tone(520, 0.05, 'triangle', 0.04, 300); } if (b.z > 0 || b.vz > 0) { b.vz -= 1500 * dt; b.z = Math.max(0, b.z + b.vz * dt); if (b.z <= 0) { b.vz = 0; b.landT = 0.12; } } b.landT = (b.landT || 0) - dt; },
  draw(g, m, i, b, mood) { const z = b.z || 0; if (z > 0) GX.shadow(g, b.x, b.y + b.r * 1.6, 26 - Math.min(14, z * 0.08), 0.35); const y0 = b.y; b.y -= z; MGH.drawBody(g, b, m.players[i], '', mood); b.y = y0; },
};

// ===================================================================== GRUMBLE'S GAUNTLET (survive the stone imp's rounds of hazards)
const GG_ROUNDS = [
  { k: ['shock'], n: 'Shockwave!', tip: 'JUMP over the rings' },
  { k: ['rocks'], n: 'Boulder Drop!', tip: 'Run from the shadows' },
  { k: ['rams'], n: 'Ram Stampede!', tip: 'Dodge or JUMP the rams' },
  { k: ['boar'], n: 'Thornboar Charge!', tip: 'Sidestep the charge' },
  { k: ['shock', 'rocks'], n: 'Quake & Boulders!', tip: 'Jump and run!' },
  { k: ['rams', 'boar'], n: 'Stampede!', tip: 'Keep moving!' },
  { k: ['shock', 'rocks', 'rams', 'boar'], n: 'GRAND FINALE', tip: 'Everything at once — worth 2!' },
];
MG.def({
  id: 'gauntlet', name: "Grumble's Gauntlet", type: 'Survival', controls: 'Move + A', dur: 0,
  rows: [['stick', 'Run'], ['a', 'Jump']],
  how: 'Grumble the stone imp runs a gauntlet of seven rounds! Each round brings hazards: SHOCKWAVE rings you must JUMP over (A), BOULDERS that drop where their shadow grows, RAMS that charge in from the edges (dodge or jump them), and the big THORNBOAR that charges where it glares. Get through a round without being hit to score a point. The grand finale throws everything at once — and is worth 2!',
  wins: 'Most rounds survived.',
  X0: 230, X1: 1050, Y0: 270, Y1: 650, view: [190, 130, 1090, 665],
  init(m, S) {
    S.b = [0, 1, 2, 3].map(i => Object.assign(MGH.body(460 + i * 120, 470, 22), { z: 0, vz: 0, stun: 0, fail: false, pts: 0, inv: 0 }));
    S.round = -1; S.ph = 'intro'; S.pt = 0; S.hz = []; S.boar = null; S.slam = 0; this.next(m, S);
  },
  next(m, S) { S.round++; S.ph = 'intro'; S.pt = 0; S.hz = []; S.boar = null; S.b.forEach(b => { b.fail = false; }); S.spawn = 0; S.charges = 0; Sfx.whistle(); },
  rnd(S) { return GG_ROUNDS[S.round]; },
  hit(m, S, b, i, fx, fy) {
    if (b.stun > 0 || b.inv > 0) return; b.stun = 1.1; b.inv = 1.6; b.fail = true; const l = Math.hypot(fx, fy) || 1; b.vx = fx / l * 420; b.vy = fy / l * 420; b.z = 0; b.vz = 0;
    Sfx.thud(); MGH.burst(b.x, b.y, ['#fff', '#c8b8a0'], 12, { speed: 200 }); MGH.shake(4);
  },
  update(m, S, dt) {
    S.pt += dt; S.slam -= dt; const R0 = this.rnd(S), dur = S.round === 6 ? 11.5 : 6.5;
    // players
    S.b.forEach((b, i) => {
      b.stun -= dt; b.inv -= dt; HOP.tick(m, i, b, dt);
      const a = b.stun > 0 ? { x: 0, y: 0 } : m.axis(i); MGH.steer(b, a.x, a.y, dt, 2600, b.z > 0 ? 300 : 310, b.stun > 0 ? 3 : 9);
      MGH.integrate(b, dt, this.X0, this.Y0, this.X1, this.Y1);
    });
    MGH.collide(S.b, 0.4);
    if (S.ph === 'intro') { if (S.pt > 1.8) { S.ph = 'go'; S.pt = 0; } return; }
    if (S.ph === 'done') { if (S.pt > 2.2) { if (S.round >= GG_ROUNDS.length - 1) m.finish(S.b.map(b => b.pts)); else this.next(m, S); } return; }
    // ---- hazards spawn
    S.spawn -= dt; const fin = S.round === 6;
    if (S.pt < dur - 1.6 && S.spawn <= 0) {
      const kinds = R0.k, k = R.pick(kinds);
      if (k === 'shock') { S.slam = 0.5; const cx = Math.random() < 0.5 ? 640 : R.range(330, 950), cy = Math.random() < 0.5 ? 460 : R.range(320, 600); S.hz.push({ k: 'shock', x: cx, y: cy, r: 0, sp: 240 + S.round * 12, life: 3.2, warn: 0.5 }); Sfx.boom(); MGH.shake(3); S.spawn = fin ? 2.2 : (S.round >= 4 ? 1.6 : 1.9); }
      else if (k === 'rocks') { const n = fin ? 3 : S.round >= 4 ? 3 : 4; for (let q = 0; q < n; q++) { const t = Math.random() < 0.6 ? R.pick(S.b) : null; S.hz.push({ k: 'rock', x: clamp((t ? t.x + t.vx * 0.5 : R.range(260, 1020)) + R.range(-40, 40), 250, 1030), y: clamp((t ? t.y + t.vy * 0.5 : R.range(300, 620)) + R.range(-30, 30), 290, 630), t: 0, T: R.range(1.0, 1.35), r: 50 }); } S.spawn = fin ? 1.8 : 1.25; }
      else if (k === 'rams') { const horiz = Math.random() < 0.6, n = fin ? 2 : S.round >= 5 ? 2 : 3, used = []; for (let q = 0; q < n; q++) { let lane; do lane = horiz ? R.range(300, 620) : R.range(270, 1010); while (used.some(u => Math.abs(u - lane) < 90)); used.push(lane); const dir = R.pick([-1, 1]); S.hz.push({ k: 'ram', horiz, lane, dir, pos: horiz ? (dir > 0 ? 150 : 1130) : (dir > 0 ? 200 : 700), warn: 0.85, sp: 560 + S.round * 15 }); } S.spawn = fin ? 2 : 1.5; }
      else if (k === 'boar' && !S.boar) { S.boar = { x: R.pick([260, 1020]), y: 300, st: 'aim', t: 0, tx: 640, ty: 450, vx: 0, vy: 0 }; S.spawn = 0.6; }
      else S.spawn = 0.4;
    }
    // ---- hazards update + collisions
    S.hz.forEach(h => {
      if (h.k === 'shock') { if (h.warn > 0) { h.warn -= dt; return; } h.r += h.sp * dt; h.life -= dt; S.b.forEach((b, i) => { const d = dist(b.x, b.y + 20, h.x, h.y); if (b.z < 18 && Math.abs(d - h.r) < 16) this.hit(m, S, b, i, b.x - h.x, b.y - h.y); }); if (h.r > 900) h.dead = true; }
      else if (h.k === 'rock') { h.t += dt; if (h.t >= h.T && !h.landed) { h.landed = true; MGH.shake(5); Sfx.thud(); MGH.burst(h.x, h.y, ['#a89880', '#6a5a48'], 14, { speed: 260 }); S.b.forEach((b, i) => { if (dist(b.x, b.y + 18, h.x, h.y) < h.r) this.hit(m, S, b, i, b.x - h.x, b.y - h.y); }); } if (h.t > h.T + 0.9) h.dead = true; }
      else if (h.k === 'ram') { if (h.warn > 0) { h.warn -= dt; return; } h.pos += h.dir * h.sp * dt; const rx = h.horiz ? h.pos : h.lane, ry = h.horiz ? h.lane : h.pos; h.x = rx; h.y = ry; S.b.forEach((b, i) => { if (b.z < 26 && Math.abs(b.x - rx) < 40 && Math.abs(b.y + 16 - ry) < 32) this.hit(m, S, b, i, h.horiz ? h.dir : (b.x - rx), h.horiz ? (b.y - ry) : h.dir); }); if (h.pos < -120 || h.pos > 1400 || (!h.horiz && (h.pos > 760 || h.pos < 120))) h.dead = true; }
    });
    S.hz = S.hz.filter(h => !h.dead);
    // ---- thornboar: glare at a hero, then charge in a straight line
    const B = S.boar;
    if (B) {
      B.t += dt;
      if (B.st === 'aim') { const tg = S.b.filter(b => b.stun <= 0).sort((p, q) => dist(p.x, p.y, B.x, B.y) - dist(q.x, q.y, B.x, B.y))[Math.floor(S.charges) % 2] || S.b[0]; B.tx = tg.x; B.ty = tg.y + 10; if (B.t > 0.95) { B.st = 'charge'; B.t = 0; const dx = B.tx - B.x, dy = B.ty - B.y, l = Math.hypot(dx, dy) || 1; B.vx = dx / l * 720; B.vy = dy / l * 720; Sfx.whoosh(true); } }
      else if (B.st === 'charge') { B.x += B.vx * dt; B.y += B.vy * dt; S.b.forEach((b, i) => { if (dist(b.x, b.y + 14, B.x, B.y) < 58) this.hit(m, S, b, i, b.x - B.x, b.y - B.y); }); if (B.x < this.X0 - 10 || B.x > this.X1 + 10 || B.y < this.Y0 + 20 || B.y > this.Y1 + 10) { B.x = clamp(B.x, this.X0 - 10, this.X1 + 10); B.y = clamp(B.y, this.Y0 + 20, this.Y1 + 10); B.st = 'daze'; B.t = 0; MGH.shake(6); Sfx.thud(); } }
      else if (B.st === 'daze') { if (B.t > 0.7) { S.charges++; if (S.pt > dur - 1.8 || S.charges >= (fin ? 4 : 4)) { B.st = 'leave'; B.t = 0; } else { B.st = 'aim'; B.t = 0; } } }
      else if (B.st === 'leave') { B.y -= 300 * dt; if (B.y < 180) S.boar = null; }
    }
    // ---- round over: award survivors
    if (S.pt > dur && !S.hz.length && (!S.boar || S.boar.st === 'leave')) {
      S.ph = 'done'; S.pt = 0; S.boar = null; const v = S.round === 6 ? 2 : 1;
      S.b.forEach((b, i) => { if (!b.fail) { b.pts += v; MGH.pop(`+${v}`, b.x, b.y - 60, '#ffe680', 30); } });
      Sfx.coin();
    }
  },
  bot(m, S, i) {
    const b = S.b[i], v = m.vin[i]; v.a = false; v.ax = 0; v.ay = 0; if (b.stun > 0) return;
    let fx = (640 - b.x) * 0.002, fy = (460 - b.y) * 0.002, jump = false;
    b.react = b.react === undefined ? R.range(0.75, 1) : b.react; if (Math.random() < 0.01) b.react = R.range(0.7, 1);
    S.hz.forEach(h => {
      if (h.k === 'shock' && h.warn <= 0) { const d = dist(b.x, b.y + 20, h.x, h.y); if (d - h.r > 0 && d - h.r < 34 * b.react) jump = true; }
      if (h.k === 'rock' && !h.landed) { const d = dist(b.x, b.y + 18, h.x, h.y); if (d < h.r + 40) { const l = d || 1; fx += (b.x - h.x) / l * 3 * b.react; fy += (b.y + 18 - h.y) / l * 3 * b.react; } }
      if (h.k === 'ram') { const rx = h.horiz ? h.pos : h.lane, ry = h.horiz ? h.lane : h.pos, ahead = h.horiz ? (b.x - rx) * h.dir : (b.y - ry) * h.dir, side = h.horiz ? b.y + 16 - ry : b.x - rx;
        if (ahead > -30 && Math.abs(side) < 60) { if (h.warn <= 0 && ahead < 70 * b.react && ahead > 0) jump = true; else if (h.warn > 0 || ahead > 160) { if (h.horiz) fy += Math.sign(side || 1) * 2; else fx += Math.sign(side || 1) * 2; } } }
    });
    const B = S.boar; if (B && B.st !== 'leave') { const lx = B.st === 'charge' ? B.vx : B.tx - B.x, ly = B.st === 'charge' ? B.vy : B.ty - B.y, l = Math.hypot(lx, ly) || 1, px = -ly / l, py = lx / l, side = (b.x - B.x) * px + (b.y - B.y) * py; if (Math.abs(side) < 90) { const s = Math.sign(side || (i % 2 ? 1 : -1)); fx += px * s * 3 * b.react; fy += py * s * 3 * b.react; } }
    const l = Math.hypot(fx, fy); if (l > 0.15) { v.ax = fx / l; v.ay = fy / l; }
    if (jump && b.z <= 0 && Math.random() < 0.85) v.a = true;
  },
  score(m, S) { return S.b.map(b => b.pts); },
  fmt(s) { return `${s} pts`; },
  hud(m, S, i) { return `⭐ ${S.b[i].pts}`; },
  imp(g, x, y, t, slam) {
    // Grumble: a chubby little sandstone imp — big shiny eyes, rosy cheeks, one cheeky tooth, a tiny crown
    const hop = slam > 0 ? Math.sin((0.5 - slam) / 0.5 * Math.PI) * 22 : Math.abs(Math.sin(t * 2.2)) * 3, sq = slam > 0 && slam < 0.12 ? 0.12 : 0, blink = (t % 3.4) < 0.12;
    GX.shadow(g, x, y + 46, 46 - hop * 0.4, 0.4);
    g.save(); g.translate(x, y - hop); g.scale(1 + sq, 1 - sq);
    const stone = (r) => { const gr = g.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r * 1.05); gr.addColorStop(0, '#fff0d0'); gr.addColorStop(0.55, '#e8c890'); gr.addColorStop(1, '#b88a58'); return gr; };
    // feet + tail
    g.fillStyle = '#b88a58'; [[-18], [18]].forEach(([fx]) => { g.beginPath(); g.ellipse(fx, 40, 15, 9, 0, 0, 7); g.fill(); });
    g.strokeStyle = '#b88a58'; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(26, 30); g.quadraticCurveTo(52, 30 + Math.sin(t * 4) * 6, 50, 10); g.stroke(); g.fillStyle = '#e86a4a'; g.beginPath(); g.moveTo(50, 2); g.lineTo(58, 12); g.lineTo(44, 14); g.fill();
    // round body
    g.fillStyle = stone(42); g.beginPath(); g.ellipse(0, 14, 40, 34, 0, 0, 7); g.fill();
    g.fillStyle = '#fff4dc'; g.beginPath(); g.ellipse(0, 22, 24, 20, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(160,110,60,0.35)'; [[-26, 6, 4], [28, 24, 3], [-14, 38, 3]].forEach(([cx, cy, r]) => { g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill(); });
    // arms: waving normally, both up for a stomp
    const wave = Math.sin(t * 5);
    [[-1, slam > 0 ? -2.3 : -0.4 + wave * 0.1], [1, slam > 0 ? -2.3 : -1.6 + wave * 0.5]].forEach(([sd, a]) => { g.save(); g.translate(sd * 34, 6); g.rotate(sd * a * -1); g.fillStyle = stone(14); g.beginPath(); g.ellipse(0, 12, 9, 15, 0, 0, 7); g.fill(); g.fillStyle = '#e8c890'; g.beginPath(); g.arc(0, 26, 9, 0, 7); g.fill(); g.restore(); });
    // big round head
    g.fillStyle = stone(36); g.beginPath(); g.arc(0, -30, 34, 0, 7); g.fill();
    // curled horns
    [[-1], [1]].forEach(([sd]) => { g.strokeStyle = '#8a5a3a'; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(sd * 20, -56); g.quadraticCurveTo(sd * 34, -78, sd * 22, -80); g.stroke(); g.strokeStyle = '#c8905a'; g.lineWidth = 3; g.stroke(); });
    g.lineCap = 'butt';
    // tiny tilted crown
    g.save(); g.translate(6, -64); g.rotate(0.18); g.fillStyle = '#ffd34d'; g.beginPath(); g.moveTo(-13, 4); g.lineTo(-13, -8); g.lineTo(-6, -2); g.lineTo(0, -12); g.lineTo(6, -2); g.lineTo(13, -8); g.lineTo(13, 4); g.closePath(); g.fill(); g.strokeStyle = '#c8962a'; g.lineWidth = 1.5; g.stroke(); g.fillStyle = '#e8323e'; g.beginPath(); g.arc(0, -1, 2.5, 0, 7); g.fill(); g.restore();
    // eyes: big, glossy, cheeky brows
    [[-13], [13]].forEach(([ex]) => {
      if (blink) { g.strokeStyle = '#3a2414'; g.lineWidth = 3; g.beginPath(); g.arc(ex, -30, 8, 0.2, Math.PI - 0.2); g.stroke(); return; }
      g.fillStyle = '#fff'; g.beginPath(); g.ellipse(ex, -31, 10, 12, 0, 0, 7); g.fill();
      g.fillStyle = '#4a2a5a'; g.beginPath(); g.ellipse(ex + 1.5, -29, 6.5, 8, 0, 0, 7); g.fill();
      g.fillStyle = '#1a0a1a'; g.beginPath(); g.arc(ex + 2, -28, 3.5, 0, 7); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(ex - 1, -33, 2.8, 0, 7); g.arc(ex + 4, -25, 1.3, 0, 7); g.fill();
    });
    g.strokeStyle = '#6a4024'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(-22, -46 + (slam > 0 ? 3 : 0)); g.lineTo(-8, -43); g.moveTo(22, -46 + (slam > 0 ? 3 : 0)); g.lineTo(8, -43); g.stroke(); g.lineCap = 'butt';
    // rosy cheeks + cheeky grin with one tooth
    g.fillStyle = 'rgba(255,120,120,0.45)'; g.beginPath(); g.ellipse(-22, -18, 7, 4.5, 0, 0, 7); g.ellipse(22, -18, 7, 4.5, 0, 0, 7); g.fill();
    g.fillStyle = '#5a2414'; g.beginPath(); if (slam > 0) g.ellipse(0, -14, 9, 8, 0, 0, 7); else { g.moveTo(-11, -17); g.quadraticCurveTo(0, -4, 11, -17); g.closePath(); } g.fill();
    g.fillStyle = '#fff'; g.fillRect(-4, -17, 5, 5);
    g.restore();
    if (slam > 0) MGH.text(g, 'STOMP!', x, y - 92, 20, '#ffe680', 'center', 'bold');
  },
  ram(g, x, y, dir, horiz, t) {
    g.save(); g.translate(x, y); if (!horiz) g.rotate(dir > 0 ? Math.PI / 2 : -Math.PI / 2); else if (dir < 0) g.scale(-1, 1);
    const run = Math.sin(t * 30);
    GX.shadow(g, 0, 24, 40, 0.35);
    g.fillStyle = '#5a4a3a'; [[-18, run], [-6, -run], [10, run], [20, -run]].forEach(([lx, s]) => { g.fillRect(lx + s * 4, 10, 6, 14); });
    const wool = g.createRadialGradient(-6, -10, 4, 0, 0, 34); wool.addColorStop(0, '#fffaf0'); wool.addColorStop(1, '#c8c0b0'); g.fillStyle = wool;
    for (let q = 0; q < 7; q++) { g.beginPath(); g.arc(-22 + q * 7, -6 + (q % 2) * 6, 13, 0, 7); g.fill(); }
    g.fillStyle = '#4a3a30'; g.beginPath(); g.ellipse(28, -4, 13, 11, 0.2, 0, 7); g.fill();
    g.strokeStyle = '#c8a060'; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.arc(22, -10, 10, -2.6, 0.6); g.stroke(); g.lineCap = 'butt';
    g.fillStyle = '#ff5a3a'; g.beginPath(); g.arc(32, -7, 2.5, 0, 7); g.fill();
    for (let q = 0; q < 3; q++) { g.fillStyle = `rgba(200,180,150,${0.5 - q * 0.15})`; g.beginPath(); g.arc(-34 - q * 14, 18 - q * 3, 7 + q * 3, 0, 7); g.fill(); }
    g.restore();
  },
  boar(g, B, t) {
    const dx = B.st === 'charge' ? B.vx : B.tx - B.x, f = dx >= 0 ? 1 : -1, shake = B.st === 'aim' ? Math.sin(t * 50) * 2 : 0;
    g.save(); g.translate(B.x + shake, B.y); g.scale(f, 1);
    GX.shadow(g, 0, 40, 64, 0.4);
    const run = B.st === 'charge' ? Math.sin(t * 34) : 0;
    g.fillStyle = '#3a2418'; [[-30, run], [-12, -run], [16, run], [32, -run]].forEach(([lx, s]) => { MGH.rr(g, lx + s * 5 - 6, 14, 12, 26, 4); g.fill(); });
    const bd = g.createRadialGradient(-6, -16, 6, 0, 0, 64); bd.addColorStop(0, '#9a5a3a'); bd.addColorStop(1, '#4a2414'); g.fillStyle = bd; g.beginPath(); g.ellipse(0, 0, 56, 36, 0, 0, 7); g.fill();
    g.fillStyle = '#2a1a10'; for (let q = 0; q < 8; q++) { g.beginPath(); g.moveTo(-40 + q * 10, -28 + Math.abs(q - 4) * 2); g.lineTo(-36 + q * 10, -46 + Math.abs(q - 4) * 3); g.lineTo(-32 + q * 10, -28 + Math.abs(q - 4) * 2); g.fill(); }
    g.fillStyle = '#7a4430'; g.beginPath(); g.ellipse(48, 4, 24, 20, 0, 0, 7); g.fill();
    g.fillStyle = '#c88a78'; g.beginPath(); g.ellipse(68, 8, 10, 9, 0, 0, 7); g.fill(); g.fillStyle = '#4a2a20'; g.beginPath(); g.arc(66, 6, 2.2, 0, 7); g.arc(71, 9, 2.2, 0, 7); g.fill();
    g.fillStyle = '#fffaf0'; g.beginPath(); g.moveTo(58, 18); g.quadraticCurveTo(66, 26, 62, 38); g.quadraticCurveTo(58, 28, 54, 20); g.fill();
    const glare = B.st === 'aim'; g.fillStyle = glare ? '#ff3a2a' : '#ffd34d'; if (glare) MGH.glow(g, 52, -6, 16, 'rgba(255,60,40,0.9)'); g.beginPath(); g.ellipse(52, -6, 5, 3.5, -0.3, 0, 7); g.fill();
    g.fillStyle = '#5a3020'; g.beginPath(); g.moveTo(40, -14); g.lineTo(36, -34); g.lineTo(48, -18); g.fill();
    if (B.st === 'daze') for (let q = 0; q < 3; q++) { const a = t * 6 + q * 2.1; MGH.star(g, 40 + Math.cos(a) * 20, -40 + Math.sin(a) * 6, 6, '#ffe680', a, false); }
    g.restore();
    if (B.st === 'charge') for (let q = 1; q <= 4; q++) { g.fillStyle = `rgba(200,170,130,${0.45 - q * 0.1})`; g.beginPath(); g.arc(B.x - B.vx * 0.03 * q, B.y + 26, 10 + q * 5, 0, 7); g.fill(); }
  },
  draw(m, S, g) {
    // stone courtyard ringed by battlements under a stormy sky
    GX.vfill(g, 0, 0, 1280, 720, ['#2a2440', '#4a3a5a', '#6a5060']);
    for (let k = 0; k < 6; k++) MGH.cloud(g, (k * 260 + m.t * 8) % 1500 - 100, 60 + (k % 2) * 30, 30, 'rgba(90,80,110,0.8)');
    g.fillStyle = '#4a4458'; g.fillRect(0, 150, 1280, 70); for (let x = 0; x < 1280; x += 64) { g.fillStyle = '#5a546a'; g.fillRect(x, 132, 40, 26); }
    for (let k = 0; k < 6; k++) { const x = 100 + k * 216; MGH.glow(g, x, 182, 40, 'rgba(255,150,60,0.5)'); MGH.flame(g, x, 186, 0.35, m.t, k); g.fillStyle = '#3a3448'; g.fillRect(x - 4, 188, 8, 18); }
    const fl = g.createLinearGradient(0, 210, 0, 720); fl.addColorStop(0, '#8a8278'); fl.addColorStop(1, '#5a5248'); g.fillStyle = fl; g.fillRect(0, 205, 1280, 515);
    for (let r = 0; r < 10; r++) for (let c = 0; c < 18; c++) { const x = c * 76 + (r % 2) * 38 - 30, y = 210 + r * 52; g.strokeStyle = 'rgba(40,34,30,0.35)'; g.lineWidth = 2; g.strokeRect(x, y, 76, 52); if (MGH.hash(r * 31 + c) < 0.15) { g.fillStyle = 'rgba(90,120,60,0.25)'; g.beginPath(); g.ellipse(x + 30, y + 40, 14, 5, 0, 0, 7); g.fill(); } }
    g.strokeStyle = 'rgba(255,220,150,0.18)'; g.lineWidth = 3; g.beginPath(); g.ellipse(640, 450, 300, 150, 0, 0, 7); g.stroke();
    this.imp(g, 640, 200, m.t, S.slam);
    // hazard telegraphs + hazards
    S.hz.forEach(h => {
      if (h.k === 'shock') { if (h.warn > 0) { g.strokeStyle = `rgba(255,120,60,${0.5 + 0.5 * Math.sin(m.t * 30)})`; g.lineWidth = 4; g.beginPath(); g.arc(h.x, h.y, 30, 0, 7); g.stroke(); return; } const a = Math.max(0, Math.min(1, h.life)); g.save(); g.globalAlpha = a; g.strokeStyle = 'rgba(255,170,80,0.35)'; g.lineWidth = 30; g.beginPath(); g.arc(h.x, h.y, h.r, 0, 7); g.stroke(); g.strokeStyle = '#ffd08a'; g.lineWidth = 8; g.stroke(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke(); for (let q = 0; q < 14; q++) { const an = q / 14 * Math.PI * 2 + h.r * 0.01; g.fillStyle = '#a89880'; g.beginPath(); g.arc(h.x + Math.cos(an) * h.r, h.y + Math.sin(an) * h.r - 6, 4, 0, 7); g.fill(); } g.restore(); }
      else if (h.k === 'rock') { const k = Math.min(1, h.t / h.T); if (!h.landed) { g.fillStyle = `rgba(20,10,10,${0.15 + k * 0.4})`; g.beginPath(); g.ellipse(h.x, h.y, h.r * (0.4 + k * 0.6), h.r * (0.4 + k * 0.6) * 0.5, 0, 0, 7); g.fill(); g.strokeStyle = `rgba(255,80,60,${0.4 + 0.4 * Math.sin(m.t * 20)})`; g.lineWidth = 2; g.beginPath(); g.ellipse(h.x, h.y, h.r, h.r * 0.5, 0, 0, 7); g.stroke(); if (k > 0.45) { const yy = h.y - (1 - k) * 700 - 30; MGH.rock(g, h.x, yy, 40, 3); } } else { const a = 1 - (h.t - h.T) / 0.9; g.globalAlpha = Math.max(0, a); MGH.rock(g, h.x, h.y - 26, 40, 3); g.strokeStyle = 'rgba(40,30,20,0.6)'; g.lineWidth = 2; for (let q = 0; q < 6; q++) { const an = q * 1.05; g.beginPath(); g.moveTo(h.x, h.y); g.lineTo(h.x + Math.cos(an) * 50, h.y + Math.sin(an) * 22); g.stroke(); } g.globalAlpha = 1; } }
      else if (h.k === 'ram') { if (h.warn > 0) { const p = 0.5 + 0.5 * Math.sin(m.t * 24); g.fillStyle = `rgba(255,90,60,${0.15 + 0.15 * p})`; if (h.horiz) g.fillRect(0, h.lane - 30, 1280, 60); else g.fillRect(h.lane - 34, 200, 68, 520); const ax = h.horiz ? (h.dir > 0 ? 220 : 1060) : h.lane, ay = h.horiz ? h.lane : (h.dir > 0 ? 285 : 640); g.save(); g.translate(ax, ay); g.rotate(h.horiz ? (h.dir > 0 ? 0 : Math.PI) : (h.dir > 0 ? Math.PI / 2 : -Math.PI / 2)); g.fillStyle = `rgba(255,220,120,${0.6 + 0.4 * p})`; g.beginPath(); g.moveTo(26, 0); g.lineTo(-10, -20); g.lineTo(-10, 20); g.fill(); g.restore(); } }
    });
    const ents = S.b.map((b, i) => ({ y: b.y, f: () => { if (b.inv > 0 && b.stun <= 0 && Math.floor(m.t * 14) % 2) return; HOP.draw(g, m, i, b, b.stun > 0 ? 'dizzy' : b.z > 0 ? 'cheer' : 'determined'); if (S.ph === 'done' && !b.fail) MGH.star(g, b.x, b.y - 74, 10, '#ffe680', m.t * 3); } }));
    S.hz.forEach(h => { if (h.k === 'ram' && h.warn <= 0) ents.push({ y: h.y, f: () => this.ram(g, h.x, h.y, h.dir, h.horiz, m.t) }); });
    if (S.boar) ents.push({ y: S.boar.y, f: () => { if (S.boar.st === 'aim') { g.strokeStyle = `rgba(255,60,40,${0.4 + 0.4 * Math.sin(m.t * 25)})`; g.lineWidth = 3; g.setLineDash([10, 8]); g.beginPath(); g.moveTo(S.boar.x, S.boar.y + 20); g.lineTo(S.boar.x + (S.boar.tx - S.boar.x) * 3, S.boar.y + 20 + (S.boar.ty - S.boar.y) * 3); g.stroke(); g.setLineDash([]); } this.boar(g, S.boar, m.t); } });
    ents.sort((a, b) => a.y - b.y).forEach(e => e.f());
    // round banner + pips
    const R0 = this.rnd(S); if (R0) {
      if (S.ph === 'intro') { const k = Math.min(1, S.pt / 0.3); g.save(); g.translate(640, 360); g.scale(k, k); MGH.label(g, `Round ${S.round + 1}: ${R0.n}`, 0, -20, 40, '#ffe680'); MGH.label(g, R0.tip, 0, 34, 22, '#fff'); g.restore(); }
      if (S.ph === 'done') MGH.label(g, `${S.b.filter(b => !b.fail).length ? 'Survivors score!' : 'Nobody made it!'}`, 640, 330, 34, '#9fe0ff');
    }
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = 'rgba(0,0,0,0.45)'; MGH.rr(g, 1012, 52, 222, 32, 16); g.fill();
    for (let k = 0; k < 7; k++) { g.fillStyle = k < S.round || (k === S.round && S.ph === 'done') ? '#ffd34d' : k === S.round ? '#fff' : 'rgba(255,255,255,0.25)'; g.beginPath(); g.arc(1035 + k * 28, 68, k === 6 ? 11 : 8, 0, 7); g.fill(); }
    g.restore();
  },
});

// ===================================================================== CONGA LINE (gather party guests into your dancing line)
MG.def({
  id: 'conga', name: 'Conga Line', type: 'Arena', controls: 'Move + A', dur: 60,
  rows: [['stick', 'Lead your line'], ['a', 'Shimmy dash']],
  how: 'Party time! Dance into the guests waiting around the floor and they join the back of your conga line. SHIMMY-DASH (A) into ANOTHER player\'s line to cut it — everyone behind the cut scatters back onto the floor. A longer line is a little slower, so protect your tail! Golden guests count double.',
  wins: 'Longest conga line at the end.',
  GAP: 30,
  init(m, S) {
    S.b = [0, 1, 2, 3].map(i => Object.assign(MGH.body(320 + (i % 2) * 640, 300 + Math.floor(i / 2) * 240, 22), { path: [], line: [], dash: 0, dcd: 0, stun: 0 }));
    S.g = []; for (let k = 0; k < 14; k++) this.spawn(S);
    S.sp = 0;
  },
  spawn(S, x, y) { S.g.push({ x: x !== undefined ? x : R.range(120, 1160), y: y !== undefined ? y : R.range(200, 660), gold: Math.random() < 0.1, col: R.pick(['#ff8a8a', '#8ad0ff', '#ffd36a', '#b88aff', '#8aff9a', '#ffb0e0']), ph: R.range(0, 6), free: 0, el: R.int(0, 14) }); },
  update(m, S, dt) {
    S.sp -= dt; if (S.sp <= 0 && S.g.length < 12) { this.spawn(S); S.sp = 1.4; }
    S.g.forEach(q => { q.free -= dt; q.ph += dt; });
    S.b.forEach((b, i) => {
      b.dash -= dt; b.dcd -= dt; b.stun -= dt;
      if (m.pressed(i, 'a') && b.dcd <= 0 && b.stun <= 0) { b.dash = 0.28; b.dcd = 1.6; Sfx.whoosh(false); }
      const a = b.stun > 0 ? { x: 0, y: 0 } : m.axis(i), sp = (b.dash > 0 ? 560 : 300) / (1 + b.line.length * 0.025);
      MGH.steer(b, a.x, a.y, dt, b.dash > 0 ? 5000 : 2200, sp, 6); MGH.integrate(b, dt, 60, 160, 1220, 690);
      const last = b.path[0]; if (!last || dist(last.x, last.y, b.x, b.y) > 6) { b.path.unshift({ x: b.x, y: b.y }); if (b.path.length > 400) b.path.length = 400; }
      // followers
      b.line.forEach((q, k) => { const idx = Math.min(b.path.length - 1, Math.round((k + 1) * this.GAP / 6)); const p = b.path[idx] || b; q.x += (p.x - q.x) * 0.5; q.y += (p.y - q.y) * 0.5; });
      // collect guests
      S.g = S.g.filter(q => { if (q.free > 0 || dist(q.x, q.y, b.x, b.y) > 36) return true; b.line.push(q); if (q.gold) b.line.push(Object.assign({}, q, { ghost: true })); Sfx.pop(); return false; });
    });
    // cut lines: a head touching another line's follower
    S.b.forEach((b, i) => S.b.forEach((o, j) => { if (i === j || b.stun > 0 || b.dash <= 0) return; const k = o.line.findIndex(q => !q.ghost && dist(q.x, q.y, b.x, b.y) < 26); if (k < 0) return;
      const lost = o.line.splice(k); lost.filter(q => !q.ghost).forEach(q => { q.free = 1.2; q.x += R.range(-50, 50); q.y += R.range(-40, 40); q.x = clamp(q.x, 100, 1180); q.y = clamp(q.y, 190, 670); S.g.push(q); });
      MGH.pop('SNIP!', b.x, b.y - 50, '#ffe680', 24); Sfx.bad(); MGH.burst(b.x, b.y, ['#fff', m.players[j].color], 12, { speed: 200 }); }));
    MGH.collide(S.b, 0.8);
  },
  bot(m, S, i) {
    const b = S.b[i], v = m.vin[i]; v.a = false;
    b.mode = b.mode && Math.random() > 0.004 ? b.mode : (Math.random() < 0.25 ? 'hunt' : 'collect');
    let tx, ty;
    const rival = S.b.filter(o => o !== b && o.line.length > 2).map(o => ({ o, q: o.line[Math.max(0, o.line.length - 3)] })).sort((p, q) => dist(p.q.x, p.q.y, b.x, b.y) - dist(q.q.x, q.q.y, b.x, b.y))[0];
    if (b.mode === 'hunt' && rival) { tx = rival.q.x; ty = rival.q.y; if (dist(tx, ty, b.x, b.y) < 110 && b.dcd <= 0 && Math.random() < 0.12) v.a = true; }
    else { const q = S.g.filter(q => q.free <= 0).sort((p, q2) => dist(p.x, p.y, b.x, b.y) - (p.gold ? 120 : 0) - dist(q2.x, q2.y, b.x, b.y) + (q2.gold ? 120 : 0))[0]; if (q) { tx = q.x; ty = q.y; } else { tx = 640; ty = 420; } }
    // dodge enemy heads near our tail
    const thr = S.b.find(o => o !== b && b.line.some(q => dist(q.x, q.y, o.x, o.y) < 90)); if (thr && thr.dash > 0 && Math.random() < 0.5) { tx = b.x + (b.x - thr.x); ty = b.y + (b.y - thr.y); }
    MGH.aim(m, i, tx, ty, b, 6);
  },
  score(m, S) { return S.b.map(b => b.line.length); },
  fmt(s) { return `${s} dancers`; },
  hud(m, S, i) { return `💃 ${S.b[i].line.length}`; },
  guest(g, q, t, col, lead) {
    const bob = Math.abs(Math.sin(t * 8 + q.ph)) * 5, sway = Math.sin(t * 4 + q.ph) * 0.18;
    GX.shadow(g, q.x, q.y + 20, 15, 0.3);
    g.save(); g.translate(q.x, q.y + 18); g.rotate(sway);
    Char.draw(g, 0, -18 - bob, 14, -1, q.gold ? '#ffd34d' : q.col, { mood: q.free > 0 ? 'dizzy' : 'cheer', seed: q.ph, noShadow: true, t });
    if (q.gold) { MGH.glow(g, 0, -20, 26, 'rgba(255,220,80,0.5)'); }
    if (lead) { g.fillStyle = col; g.beginPath(); g.moveTo(-8, -34 - bob); g.lineTo(0, -48 - bob); g.lineTo(8, -34 - bob); g.fill(); }
    g.restore();
  },
  draw(m, S, g) {
    // disco floor: lit tiles pulsing to the beat, mirror ball spots
    GX.vfill(g, 0, 0, 1280, 720, ['#140a28', '#24104a']);
    const beat = Math.floor(m.t * 2.2);
    for (let r = 0; r < 9; r++) for (let c = 0; c < 20; c++) { const x = c * 64, y = 150 + r * 64, h = MGH.hash(r * 20 + c + beat * 7); const col = ['#ff3a8a', '#3ac8ff', '#ffd34d', '#8a5aff', '#3aff9a'][Math.floor(h * 5)]; g.fillStyle = col; g.globalAlpha = 0.12 + (h > 0.7 ? 0.35 : 0); g.fillRect(x + 2, y + 2, 60, 60); }
    g.globalAlpha = 1;
    g.fillStyle = '#1a0a30'; g.fillRect(0, 40, 1280, 112);
    for (let k = 0; k < 12; k++) { const x = 60 + k * 106; g.fillStyle = ['#ff3a8a', '#3ac8ff', '#ffd34d'][k % 3]; g.beginPath(); g.arc(x, 64 + Math.sin(m.t * 3 + k) * 3, 8, 0, 7); g.fill(); MGH.glow(g, x, 64, 22, 'rgba(255,255,255,0.25)'); }
    g.strokeStyle = '#888'; g.lineWidth = 2; g.beginPath(); g.moveTo(640, 40); g.lineTo(640, 92); g.stroke();
    const mb = g.createRadialGradient(634, 100, 2, 640, 106, 22); mb.addColorStop(0, '#fff'); mb.addColorStop(1, '#8a8aa8'); g.fillStyle = mb; g.beginPath(); g.arc(640, 106, 20, 0, 7); g.fill();
    g.save(); g.beginPath(); g.arc(640, 106, 20, 0, 7); g.clip(); g.strokeStyle = 'rgba(60,60,80,0.5)'; g.lineWidth = 1; for (let k = -20; k <= 20; k += 6) { g.beginPath(); g.moveTo(620, 106 + k); g.lineTo(660, 106 + k); g.stroke(); g.beginPath(); g.moveTo(640 + k + Math.sin(m.t) * 3, 86); g.lineTo(640 + k + Math.sin(m.t) * 3, 126); g.stroke(); } g.restore();
    g.save(); g.globalCompositeOperation = 'lighter'; for (let k = 0; k < 16; k++) { const a = m.t * 0.6 + k * 0.39, x = 640 + Math.cos(a) * (200 + (k % 4) * 130), y = 420 + Math.sin(a * 1.3) * 200; MGH.glow(g, x, y, 22, 'rgba(255,255,255,0.18)'); } g.restore();
    const ents = [];
    S.g.forEach(q => ents.push({ y: q.y, f: () => this.guest(g, q, m.t, '#fff', false) }));
    S.b.forEach((b, i) => {
      const p = m.players[i];
      b.line.forEach((q, k) => { if (q.ghost) return; ents.push({ y: q.y, f: () => { g.strokeStyle = p.color; g.globalAlpha = 0.5; g.lineWidth = 3; const prev = k ? b.line[k - 1] : b; g.beginPath(); g.moveTo(prev.x, prev.y + 6); g.lineTo(q.x, q.y + 6); g.stroke(); g.globalAlpha = 1; this.guest(g, Object.assign({}, q, { free: 0 }), m.t, p.color, false); g.fillStyle = p.color; g.beginPath(); g.arc(q.x, q.y - 34, 4, 0, 7); g.fill(); } }); });
      ents.push({ y: b.y, f: () => { if (b.dash > 0) for (let q = 1; q <= 3; q++) { g.globalAlpha = 0.2; Char.draw(g, b.x - b.vx * 0.02 * q, b.y - b.vy * 0.02 * q, b.r * 1.3, p.el.id, p.color, { seed: i, noShadow: true, look: b.face }); g.globalAlpha = 1; } MGH.drawBody(g, b, p, '', b.dash > 0 ? 'cheer' : 'happy'); g.fillStyle = p.color; g.beginPath(); g.moveTo(b.x - 9, b.y - 52); g.lineTo(b.x, b.y - 64); g.lineTo(b.x + 9, b.y - 52); g.fill(); } });
    });
    ents.sort((a, b) => a.y - b.y).forEach(e => e.f());
    m.players.forEach((p, i) => { g.fillStyle = 'rgba(0,0,0,0.4)'; MGH.rr(g, 160 + i * 320 - 70, 110, 140, 30, 15); g.fill(); MGH.text(g, `${p.name} 💃 ${S.b[i].line.length}`, 160 + i * 320, 131, 17, p.color, 'center', 'bold'); });
  },
});

// ===================================================================== CHEESE THIEVES (sneak cheese home while the cat prowls)
MG.def({
  id: 'mice', name: 'Cheese Thieves', type: 'Coins', controls: 'Move + A', dur: 50,
  rows: [['stick', 'Scurry'], ['a', 'Quick dash']],
  how: 'You\'ve shrunk to mouse size in a giant kitchen! Grab cheese crumbs off the floor (carry up to 3) and run them back to YOUR mousehole in your corner to bank them. Whiskers the cat naps, wakes, and stalks whoever carries the most cheese — when she crouches, she\'s about to POUNCE! Get caught and you drop everything you carry. A = quick dash.',
  wins: 'Most cheese banked.',
  HOLES: [[120, 230], [1160, 230], [120, 650], [1160, 650]],
  init(m, S) {
    S.b = [0, 1, 2, 3].map(i => Object.assign(MGH.body(this.HOLES[i][0] + (i % 2 ? -60 : 60), this.HOLES[i][1] + (i < 2 ? 40 : -40), 18), { carry: 0, bank: 0, dash: 0, dcd: 0, stun: 0 }));
    S.ch = []; for (let k = 0; k < 8; k++) this.crumb(S); S.sp = 0;
    S.cat = { x: 640, y: 420, st: 'nap', t: 0, T: 3, tx: 640, ty: 420, vx: 0, vy: 0, face: 1 };
  },
  crumb(S, x, y) { S.ch.push({ x: x !== undefined ? x : R.range(260, 1020), y: y !== undefined ? y : R.range(260, 620), big: Math.random() < 0.15, r: R.range(0, 6) }); },
  update(m, S, dt) {
    S.sp -= dt; if (S.sp <= 0 && S.ch.length < 9) { this.crumb(S); S.sp = 0.9; }
    S.b.forEach((b, i) => {
      b.dash -= dt; b.dcd -= dt; b.stun -= dt;
      if (m.pressed(i, 'a') && b.dcd <= 0 && b.stun <= 0) { b.dash = 0.25; b.dcd = 1.4; Sfx.whoosh(false); }
      const a = b.stun > 0 ? { x: 0, y: 0 } : m.axis(i), sp = (b.dash > 0 ? 600 : 330) * (1 - b.carry * 0.09);
      MGH.steer(b, a.x, a.y, dt, b.dash > 0 ? 5000 : 2600, sp, 8); MGH.integrate(b, dt, 60, 180, 1220, 690);
      S.ch = S.ch.filter(c => { if (b.carry >= 3 || b.stun > 0 || dist(c.x, c.y, b.x, b.y + 10) > 30) return true; b.carry = Math.min(3, b.carry + (c.big ? 2 : 1)); Sfx.pop(); return false; });
      const [hx, hy] = this.HOLES[i]; if (b.carry && dist(hx, hy, b.x, b.y) < 60) { b.bank += b.carry; MGH.pop(`+${b.carry}`, hx, hy - 40, '#ffe680', 28); b.carry = 0; Sfx.coin(); }
    });
    MGH.collide(S.b, 0.7);
    // Whiskers
    const C = S.cat; C.t += dt;
    const prey = () => S.b.filter(b => b.stun <= 0).sort((p, q) => (q.carry - p.carry) * 400 + dist(p.x, p.y, C.x, C.y) - dist(q.x, q.y, C.x, C.y))[0];
    if (C.st === 'nap') { if (C.t > C.T) { C.st = 'stalk'; C.t = 0; Sfx.tone(300, 0.2, 'sine', 0.04, 500); } }
    else if (C.st === 'stalk') { const p = prey(); if (p) { const dx = p.x - C.x, dy = p.y - C.y, l = Math.hypot(dx, dy) || 1; C.vx = dx / l * 120; C.vy = dy / l * 120; C.x += C.vx * dt; C.y += C.vy * dt; C.face = dx > 0 ? 1 : -1; if (l < 230 && C.t > 1) { C.st = 'crouch'; C.t = 0; C.tx = p.x + p.vx * 0.35; C.ty = p.y + p.vy * 0.35; } } if (C.t > 7) { C.st = 'nap'; C.t = 0; C.T = R.range(2, 3.5); } }
    else if (C.st === 'crouch') { if (C.t > 0.65) { C.st = 'pounce'; C.t = 0; C.sx = C.x; C.sy = C.y; Sfx.whoosh(true); } }
    else if (C.st === 'pounce') { const k = Math.min(1, C.t / 0.42); C.x = C.sx + (C.tx - C.sx) * k; C.y = C.sy + (C.ty - C.sy) * k; if (k >= 1) { C.st = 'land'; C.t = 0; MGH.shake(3); S.b.forEach((b, i) => { if (b.stun <= 0 && dist(b.x, b.y, C.x, C.y) < 70) { b.stun = 1.2; if (b.carry) { for (let q = 0; q < b.carry; q++) this.crumb(S, clamp(b.x + R.range(-60, 60), 120, 1160), clamp(b.y + R.range(-50, 50), 220, 660)); MGH.pop('Dropped it!', b.x, b.y - 40, '#ff8a8a', 22); } b.carry = 0; const l = dist(b.x, b.y, C.x, C.y) || 1; b.vx = (b.x - C.x) / l * 400; b.vy = (b.y - C.y) / l * 400; Sfx.bad(); } }); } }
    else if (C.st === 'land') { if (C.t > 0.9) { C.st = Math.random() < 0.35 ? 'nap' : 'stalk'; C.t = 0; C.T = R.range(1.5, 3); } }
    C.x = clamp(C.x, 160, 1120); C.y = clamp(C.y, 240, 640);
  },
  bot(m, S, i) {
    const b = S.b[i], v = m.vin[i], C = S.cat; v.a = false;
    const [hx, hy] = this.HOLES[i]; let tx, ty;
    if (b.carry >= 3 || (b.carry > 0 && C.st !== 'nap' && dist(C.x, C.y, b.x, b.y) < 300)) { tx = hx; ty = hy; }
    else { const c = S.ch.slice().sort((p, q) => dist(p.x, p.y, b.x, b.y) + dist(p.x, p.y, C.x, C.y) * (C.st === 'nap' ? 0 : -0.4) - (dist(q.x, q.y, b.x, b.y) + dist(q.x, q.y, C.x, C.y) * (C.st === 'nap' ? 0 : -0.4)))[0]; if (c) { tx = c.x; ty = c.y - 10; } else { tx = hx; ty = hy; } }
    const danger = (C.st === 'crouch' || C.st === 'pounce') && dist(C.tx, C.ty, b.x, b.y) < 110;
    if (danger) { tx = b.x + (b.x - C.tx) * 2; ty = b.y + (b.y - C.ty) * 2; if (b.dcd <= 0 && Math.random() < 0.3) v.a = true; }
    MGH.aim(m, i, tx, ty, b, 6);
  },
  score(m, S) { return S.b.map(b => b.bank); },
  fmt(s) { return `${s} cheese`; },
  hud(m, S, i) { const b = S.b[i]; return `🧀 ${b.bank}${b.carry ? ' +' + b.carry : ''}`; },
  cheese(g, x, y, s, r) { g.save(); g.translate(x, y); g.rotate(r * 0.3); g.scale(s, s); g.fillStyle = '#e8b830'; g.beginPath(); g.moveTo(-12, 6); g.lineTo(12, 6); g.lineTo(12, -2); g.lineTo(-12, -8); g.closePath(); g.fill(); g.fillStyle = '#ffd860'; g.beginPath(); g.moveTo(-12, -8); g.lineTo(12, -2); g.lineTo(6, -10); g.lineTo(-14, -14); g.closePath(); g.fill(); g.fillStyle = '#c89820'; [[-4, 1, 2.5], [5, 3, 2], [0, -8, 2]].forEach(([hx, hy, hr]) => { g.beginPath(); g.arc(hx, hy, hr, 0, 7); g.fill(); }); g.restore(); },
  catDraw(g, C, t) {
    const crouch = C.st === 'crouch', nap = C.st === 'nap', pounce = C.st === 'pounce', lift = pounce ? Math.sin(Math.min(1, C.t / 0.42) * Math.PI) * 80 : 0;
    GX.shadow(g, C.x, C.y + 50, pounce ? 70 - lift * 0.3 : 80, 0.4);
    g.save(); g.translate(C.x, C.y - lift + (crouch ? 10 + Math.sin(t * 40) * 2 : 0)); g.scale(C.face, 1);
    const fur = g.createRadialGradient(-10, -20, 6, 0, 0, 90); fur.addColorStop(0, '#ffb870'); fur.addColorStop(1, '#c86a2a'); g.fillStyle = fur;
    // tail
    g.strokeStyle = '#d87a3a'; g.lineWidth = 16; g.lineCap = 'round'; g.beginPath(); g.moveTo(-60, 10); g.quadraticCurveTo(-110, -10 + Math.sin(t * 3) * 20, -96, -60 + Math.sin(t * 2) * 14); g.stroke(); g.lineCap = 'butt';
    g.beginPath(); g.ellipse(-6, 10, 72, nap ? 34 : crouch ? 32 : 40, 0, 0, 7); g.fill();
    g.strokeStyle = 'rgba(150,70,20,0.5)'; g.lineWidth = 5; for (let q = 0; q < 4; q++) { g.beginPath(); g.arc(-30 + q * 18, -16, 14, 0.5, 2.4); g.stroke(); }
    g.fillStyle = '#fff4e8'; g.beginPath(); g.ellipse(20, 28, 34, 16, 0, 0, Math.PI); g.fill();
    if (!nap) { g.fillStyle = '#e88a4a'; [[-40], [-14], [24], [48]].forEach(([lx]) => { g.beginPath(); g.ellipse(lx, 44 + (pounce ? -10 : 0), 11, 8, 0, 0, 7); g.fill(); }); }
    // head
    const hx = nap ? 52 : 62, hy = nap ? 14 : crouch ? -4 : -18;
    g.fillStyle = fur; g.beginPath(); g.arc(hx, hy, 34, 0, 7); g.fill();
    g.beginPath(); g.moveTo(hx - 26, hy - 18); g.lineTo(hx - 22, hy - 50); g.lineTo(hx - 4, hy - 30); g.fill(); g.beginPath(); g.moveTo(hx + 4, hy - 30); g.lineTo(hx + 22, hy - 50); g.lineTo(hx + 28, hy - 16); g.fill();
    g.fillStyle = '#ffb0b8'; g.beginPath(); g.moveTo(hx - 21, hy - 24); g.lineTo(hx - 20, hy - 42); g.lineTo(hx - 10, hy - 30); g.fill(); g.beginPath(); g.moveTo(hx + 10, hy - 30); g.lineTo(hx + 20, hy - 42); g.lineTo(hx + 22, hy - 24); g.fill();
    if (nap) { g.strokeStyle = '#4a2a10'; g.lineWidth = 3; g.beginPath(); g.arc(hx - 12, hy - 2, 6, 0.2, 2.9); g.arc(hx + 12, hy - 2, 6, 0.2, 2.9); g.stroke(); }
    else { g.fillStyle = '#c8f04a'; g.beginPath(); g.ellipse(hx - 12, hy - 4, 8, crouch ? 4 : 7, 0, 0, 7); g.ellipse(hx + 12, hy - 4, 8, crouch ? 4 : 7, 0, 0, 7); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.ellipse(hx - 10, hy - 4, 2, crouch ? 3 : 6, 0, 0, 7); g.ellipse(hx + 14, hy - 4, 2, crouch ? 3 : 6, 0, 0, 7); g.fill(); }
    g.fillStyle = '#ff7a8a'; g.beginPath(); g.moveTo(hx + 18, hy + 6); g.lineTo(hx + 26, hy + 6); g.lineTo(hx + 22, hy + 11); g.fill();
    g.strokeStyle = '#fff'; g.lineWidth = 1.5; for (let q = -1; q <= 1; q++) { g.beginPath(); g.moveTo(hx + 18, hy + 10); g.lineTo(hx + 46, hy + 6 + q * 6); g.stroke(); }
    g.restore();
    if (nap) for (let q = 0; q < 3; q++) { const ph = (t * 0.6 + q / 3) % 1; MGH.text(g, 'z', C.x + 60 + ph * 30, C.y - 30 - ph * 50, 14 + q * 4, `rgba(255,255,255,${1 - ph})`, 'center', 'bold'); }
    if (crouch) MGH.text(g, '!', C.x, C.y - 80, 36, '#ff4a3a', 'center', 'bold');
  },
  draw(m, S, g) {
    // giant kitchen: tiled floor, cupboard base, table legs, a fallen spoon
    GX.vfill(g, 0, 0, 1280, 190, ['#e8d0b0', '#c8a880']);
    for (let k = 0; k < 6; k++) { g.fillStyle = '#a87a4a'; g.fillRect(k * 220, 40, 210, 150); g.strokeStyle = '#7a5530'; g.lineWidth = 4; g.strokeRect(k * 220 + 10, 50, 190, 130); g.fillStyle = '#d8b060'; g.beginPath(); g.arc(k * 220 + 105, 115, 6, 0, 7); g.fill(); }
    g.fillStyle = '#5a3a20'; g.fillRect(0, 180, 1280, 14);
    for (let r = 0; r < 9; r++) for (let c = 0; c < 16; c++) { g.fillStyle = (r + c) % 2 ? '#f4f0e8' : '#d8c8b8'; g.fillRect(c * 80, 194 + r * 64, 80, 64); }
    g.fillStyle = 'rgba(0,0,0,0.06)'; g.fillRect(0, 194, 1280, 526);
    [[380, 300], [900, 300]].forEach(([x, y]) => { const lg = g.createLinearGradient(x - 22, 0, x + 22, 0); lg.addColorStop(0, '#5a3a20'); lg.addColorStop(0.5, '#9a6a3a'); lg.addColorStop(1, '#4a2a14'); g.fillStyle = lg; g.fillRect(x - 20, 190, 40, y - 100); GX.shadow(g, x + 20, y + 94, 40, 0.3); });
    g.save(); g.translate(700, 600); g.rotate(-0.3); g.fillStyle = '#c8ccd4'; MGH.rr(g, -140, -8, 200, 16, 8); g.fill(); g.beginPath(); g.ellipse(80, 0, 40, 26, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(-130, -6, 180, 4); g.restore();
    // mouseholes in each corner
    this.HOLES.forEach(([x, y], i) => { const p = m.players[i]; g.fillStyle = '#2a1a10'; g.beginPath(); g.moveTo(x - 40, y + 26); g.lineTo(x - 40, y); g.arc(x, y, 40, Math.PI, 0); g.lineTo(x + 40, y + 26); g.fill(); g.strokeStyle = p.color; g.lineWidth = 5; g.beginPath(); g.moveTo(x - 44, y + 26); g.lineTo(x - 44, y); g.arc(x, y, 44, Math.PI, 0); g.lineTo(x + 44, y + 26); g.stroke(); const n = S.b[i].bank; for (let q = 0; q < Math.min(6, n); q++) this.cheese(g, x - 24 + (q % 3) * 22, y + 14 - Math.floor(q / 3) * 12, 0.7, q); g.fillStyle = 'rgba(0,0,0,0.5)'; MGH.rr(g, x - 34, y - 70, 68, 22, 11); g.fill(); MGH.text(g, `🧀 ${n}`, x, y - 53, 15, p.color, 'center', 'bold'); });
    S.ch.forEach(c => { GX.shadow(g, c.x, c.y + 8, 14, 0.25); this.cheese(g, c.x, c.y, c.big ? 1.3 : 0.9, c.r); });
    const ents = S.b.map((b, i) => ({ y: b.y, f: () => { if (b.dash > 0) { g.globalAlpha = 0.25; Char.draw(g, b.x - b.vx * 0.03, b.y - b.vy * 0.03, b.r * 1.3, m.players[i].el.id, m.players[i].color, { seed: i, noShadow: true, look: b.face }); g.globalAlpha = 1; } MGH.drawBody(g, b, m.players[i], '', b.stun > 0 ? 'dizzy' : S.cat.st === 'crouch' && dist(S.cat.tx, S.cat.ty, b.x, b.y) < 120 ? 'scared' : b.carry ? 'determined' : 'happy'); for (let q = 0; q < b.carry; q++) this.cheese(g, b.x - 12 + q * 12, b.y - 50 - q * 2, 0.6, q); } }));
    ents.push({ y: S.cat.y + 30, f: () => this.catDraw(g, S.cat, m.t) });
    ents.sort((a, b) => a.y - b.y).forEach(e => e.f());
    if (S.cat.st === 'crouch') { g.strokeStyle = `rgba(255,60,40,${0.5 + 0.5 * Math.sin(m.t * 30)})`; g.lineWidth = 3; g.setLineDash([8, 6]); g.beginPath(); g.arc(S.cat.tx, S.cat.ty, 70, 0, 7); g.stroke(); g.setLineDash([]); }
  },
});

// ===================================================================== PUDDLE SPLASH (stomp puddles to soak your rivals, umbrella to block)
MG.def({
  id: 'puddles', name: 'Puddle Splash', type: 'Arena', controls: 'Move + A & B', dur: 50,
  rows: [['stick', 'Walk'], ['a', 'Jump (land in a puddle to SPLASH)'], ['b', 'Hold: umbrella shield']],
  how: 'It\'s pouring in the town square and puddles keep growing! JUMP (A) and land in a puddle to make a big SPLASH — every rival caught in the splash is soaked and you score a point for each. HOLD B to pop open your umbrella: it blocks splashes, but you walk slowly and can\'t jump. Bigger puddles make bigger splashes!',
  wins: 'Most rivals soaked.',
  init(m, S) { S.b = [0, 1, 2, 3].map(i => Object.assign(MGH.body(320 + (i % 2) * 640, 320 + Math.floor(i / 2) * 220, 22), { z: 0, vz: 0, pts: 0, wet: 0, umb: false, inAir: false })); S.pd = []; for (let k = 0; k < 4; k++) this.puddle(S); S.sp = 0; S.rings = []; S.drops = []; },
  puddle(S) { for (let t = 0; t < 20; t++) { const x = R.range(170, 1110), y = R.range(260, 640); if (S.pd.every(p => dist(p.x, p.y, x, y) > 160)) { S.pd.push({ x, y, s: 0.35, grow: R.range(0.05, 0.09) }); return; } } },
  update(m, S, dt) {
    S.sp -= dt; if (S.sp <= 0 && S.pd.length < 7) { this.puddle(S); S.sp = 2.2; }
    S.pd.forEach(p => { p.s = Math.min(1.2, p.s + p.grow * dt); });
    S.b.forEach((b, i) => {
      b.wet -= dt; b.umb = m.held(i, 'b') && b.z <= 0;
      if (!b.umb) HOP.tick(m, i, b, dt, 470);
      const wasAir = b.inAir; b.inAir = b.z > 0;
      const a = m.axis(i); MGH.steer(b, a.x, a.y, dt, 2400, b.umb ? 130 : 290, 8); MGH.integrate(b, dt, 80, 220, 1200, 680);
      if (wasAir && !b.inAir) { const p = S.pd.find(p => dist(p.x, p.y, b.x, b.y + 24) < 70 * p.s); if (p) { const R2 = 90 + 110 * p.s; S.rings.push({ x: p.x, y: p.y, r: 20, R: R2, i }); let n = 0; S.b.forEach((o, j) => { if (j === i || o.umb || o.wet > 0) return; if (dist(o.x, o.y + 24, p.x, p.y) < R2) { o.wet = 1.2; n++; const l = dist(o.x, o.y, p.x, p.y) || 1; o.vx += (o.x - p.x) / l * 200; o.vy += (o.y - p.y) / l * 200; } }); S.b.forEach((o, j) => { if (j !== i && o.umb && dist(o.x, o.y + 24, p.x, p.y) < R2) MGH.pop('Blocked!', o.x, o.y - 60, '#9fe0ff', 18); }); if (n) { b.pts += n; MGH.pop(`SPLASH +${n}`, b.x, b.y - 70, '#9fe0ff', 26); Sfx.coin(); } else Sfx.noise(0.25, 1200, 0.05, 'lowpass'); for (let q = 0; q < 16; q++) { const an = q / 16 * Math.PI * 2; S.drops.push({ x: p.x, y: p.y, vx: Math.cos(an) * R.range(150, 280) * p.s, vy: Math.sin(an) * R.range(60, 120) * p.s, vz: R.range(200, 360), z: 0 }); } p.s = Math.max(0.3, p.s - 0.45); MGH.shake(2); } }
    });
    MGH.collide(S.b, 0.6);
    S.rings.forEach(r => { r.r += 520 * dt; }); S.rings = S.rings.filter(r => r.r < r.R);
    S.drops.forEach(d => { d.x += d.vx * dt; d.y += d.vy * dt; d.vz -= 900 * dt; d.z += d.vz * dt; }); S.drops = S.drops.filter(d => d.z > -2);
  },
  bot(m, S, i) {
    const b = S.b[i], v = m.vin[i]; v.a = false; v.b = false;
    const threat = S.b.find((o, j) => j !== i && o.z > 20 && o.vz < 0 && S.pd.some(p => dist(p.x, p.y, o.x, o.y + 24) < 70 * p.s && dist(p.x, p.y, b.x, b.y + 24) < 100 + 110 * p.s));
    if (threat && Math.random() < 0.75) { v.b = true; v.ax = v.ay = 0; return; }
    const score = p => S.b.filter((o, j) => j !== i && dist(o.x, o.y + 24, p.x, p.y) < 90 + 110 * p.s).length * 300 - dist(p.x, p.y, b.x, b.y + 24);
    const p = S.pd.slice().sort((p, q) => score(q) - score(p))[0];
    if (!p) { MGH.aim(m, i, 640, 440, b, 30); return; }
    MGH.aim(m, i, p.x, p.y - 24, b, 10);
    const d = dist(p.x, p.y, b.x, b.y + 24), near = S.b.some((o, j) => j !== i && !o.umb && dist(o.x, o.y + 24, p.x, p.y) < 90 + 110 * p.s);
    if (d < 120 && b.z <= 0 && near && Math.random() < 0.15) v.a = true;
  },
  score(m, S) { return S.b.map(b => b.pts); },
  fmt(s) { return `${s} soaks`; },
  hud(m, S, i) { return `💦 ${S.b[i].pts}`; },
  draw(m, S, g) {
    // rainy town square: cobbles, shop fronts, lamp glow, rain streaks
    GX.vfill(g, 0, 0, 1280, 220, ['#5a6a80', '#7a8a9a']);
    const shops = [['#c85a4a', 'BAKERY'], ['#4a8ac8', 'BOOKS'], ['#5aa86a', 'FLOWERS'], ['#c8a04a', 'CAFÉ'], ['#8a5ac8', 'TOYS']];
    shops.forEach(([c, n], k) => { const x = k * 256; g.fillStyle = c; g.fillRect(x + 8, 60, 240, 160); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x + 8, 60, 240, 12); for (let s = 0; s < 6; s++) { g.fillStyle = s % 2 ? '#fff' : c; g.beginPath(); g.moveTo(x + 8 + s * 40, 100); g.lineTo(x + 48 + s * 40, 100); g.lineTo(x + 48 + s * 40, 120); g.quadraticCurveTo(x + 28 + s * 40, 132, x + 8 + s * 40, 120); g.fill(); } g.fillStyle = '#ffe8a8'; g.fillRect(x + 30, 140, 80, 60); g.fillRect(x + 150, 140, 70, 80); MGH.glow(g, x + 70, 170, 60, 'rgba(255,220,140,0.3)'); MGH.text(g, n, x + 128, 92, 16, '#fff', 'center', 'bold'); });
    GX.vfill(g, 0, 218, 1280, 502, ['#6a6a72', '#4a4a54']);
    for (let r = 0; r < 16; r++) for (let c = 0; c < 26; c++) { const x = c * 50 + (r % 2) * 25 - 20, y = 222 + r * 32; g.fillStyle = `rgba(${MGH.hash(r * 26 + c) < 0.5 ? '255,255,255' : '0,0,0'},0.06)`; MGH.rr(g, x, y, 46, 28, 8); g.fill(); }
    g.fillStyle = 'rgba(255,255,255,0.04)'; g.fillRect(0, 218, 1280, 502);
    // puddles reflect the sky
    S.pd.forEach(p => { const rx = 70 * p.s, ry = 30 * p.s; const pg = g.createRadialGradient(p.x - rx * 0.3, p.y - ry * 0.3, 2, p.x, p.y, rx); pg.addColorStop(0, '#9ab8d8'); pg.addColorStop(1, '#4a6a8a'); g.fillStyle = pg; g.beginPath(); g.ellipse(p.x, p.y, rx, ry, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 2; g.stroke(); for (let q = 0; q < 3; q++) { const ph = (m.t * 1.4 + q * 0.33 + p.x * 0.01) % 1; g.strokeStyle = `rgba(255,255,255,${0.5 * (1 - ph)})`; g.lineWidth = 1; g.beginPath(); g.ellipse(p.x + Math.sin(q * 3 + p.y) * rx * 0.5, p.y + Math.cos(q * 2 + p.x) * ry * 0.4, ph * 14, ph * 5, 0, 0, 7); g.stroke(); } });
    S.rings.forEach(r => { const a = 1 - r.r / r.R; g.strokeStyle = `rgba(200,235,255,${a})`; g.lineWidth = 6 * a + 2; g.beginPath(); g.ellipse(r.x, r.y, r.r, r.r * 0.45, 0, 0, 7); g.stroke(); });
    const ents = S.b.map((b, i) => ({ y: b.y, f: () => {
      const p = m.players[i];
      HOP.draw(g, m, i, b, b.wet > 0 ? 'shock' : b.z > 0 ? 'cheer' : 'happy');
      if (b.umb) { const ux = b.x, uy = b.y - 72; g.strokeStyle = '#3a3a3a'; g.lineWidth = 3; g.beginPath(); g.moveTo(ux, uy); g.lineTo(ux, uy + 50); g.stroke(); g.fillStyle = p.color; g.beginPath(); g.moveTo(ux - 46, uy + 8); g.quadraticCurveTo(ux, uy - 40, ux + 46, uy + 8); for (let q = 3; q >= 0; q--) g.quadraticCurveTo(ux - 46 + (q + 0.5) * 23, uy + 1, ux - 46 + q * 23, uy + 8); g.fill(); g.fillStyle = 'rgba(255,255,255,0.3)'; g.beginPath(); g.moveTo(ux - 30, uy); g.quadraticCurveTo(ux - 10, uy - 28, ux, uy - 28); g.lineTo(ux - 6, uy - 2); g.fill(); }
      if (b.wet > 0) for (let q = 0; q < 6; q++) { const ph = (m.t * 2 + q / 6) % 1; g.fillStyle = `rgba(150,210,255,${1 - ph})`; g.beginPath(); g.ellipse(b.x - 20 + q * 8, b.y - 40 + ph * 50, 2, 4, 0, 0, 7); g.fill(); }
    } }));
    ents.sort((a, b) => a.y - b.y).forEach(e => e.f());
    S.drops.forEach(d => { g.fillStyle = 'rgba(200,235,255,0.85)'; g.beginPath(); g.ellipse(d.x, d.y - d.z, 3, 5, 0, 0, 7); g.fill(); });
    // rain over everything
    g.strokeStyle = 'rgba(200,220,255,0.35)'; g.lineWidth = 1.5; for (let k = 0; k < 120; k++) { const x = (MGH.hash(k) * 1400 + m.t * 120) % 1400 - 60, y = (MGH.hash(k + 7) * 720 + m.t * 900) % 760 - 20; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 5, y + 16); g.stroke(); }
  },
});

// ===================================================================== LAMP LIGHTERS (light the plaza lamps in your colour)
MG.def({
  id: 'lamps', name: 'Lamp Lighters', type: 'Arena', controls: 'Move + A', dur: 50,
  rows: [['stick', 'Run'], ['a', 'Hold at a lamp to light it']],
  how: 'Dusk falls on the village and the lamps need lighting! Run to a lamp post and HOLD A to light it with your colour (relighting a rival\'s lamp takes a little longer). Every lamp you own earns glow points each second. Watch out — gusts of wind sweep through and blow lamps out!',
  wins: 'Most glow points.',
  init(m, S) {
    S.L = []; for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) S.L.push({ x: 230 + c * 270 + (r % 2 ? 60 : -20), y: 270 + r * 160, own: -1, prog: 0, by: -1, out: 0 });
    S.b = [0, 1, 2, 3].map(i => Object.assign(MGH.body(200 + i * 290, 680, 22), { pts: 0, at: -1 }));
    S.gust = { t: 6, warn: 0, side: 1, y: 0 };
  },
  update(m, S, dt) {
    S.L.forEach(L => { L.out -= dt; if (L.own >= 0) S.b[L.own].pts += dt; });
    S.b.forEach((b, i) => {
      const k = S.L.findIndex(L => dist(L.x, L.y + 40, b.x, b.y) < 52);
      const hold = m.held(i, 'a') && k >= 0 && S.L[k].own !== i;
      const a = hold ? { x: 0, y: 0 } : m.axis(i); MGH.steer(b, a.x, a.y, dt, 2400, 300, 8); MGH.integrate(b, dt, 60, 210, 1220, 700);
      if (hold) { const L = S.L[k]; if (L.by !== i) { L.by = i; L.prog = 0; } L.prog += dt / (L.own >= 0 ? 1.2 : 0.7); b.at = k; if (L.prog >= 1) { L.own = i; L.prog = 0; L.by = -1; Sfx.tone(880, 0.12, 'triangle', 0.05); MGH.burst(L.x, L.y - 60, [m.players[i].color, '#fff'], 12, { speed: 140 }); } }
      else { if (b.at >= 0 && S.L[b.at].by === i) { S.L[b.at].by = -1; S.L[b.at].prog = 0; } b.at = -1; }
    });
    MGH.collide(S.b, 0.6);
    const G = S.gust; G.t -= dt;
    if (G.t <= 0 && G.warn <= 0) { G.warn = 1.3; G.side = R.pick([-1, 1]); G.row = R.int(0, 2); Sfx.noise(1.2, 400, 0.05, 'lowpass'); }
    if (G.warn > 0) { G.warn -= dt; if (G.warn <= 0) { S.L.filter((L, k) => Math.floor(k / 4) === G.row && L.own >= 0).forEach(L => { L.own = -1; L.out = 1; }); G.t = R.range(6, 9); G.blow = 0.8; } }
    G.blow = (G.blow || 0) - dt;
  },
  bot(m, S, i) {
    const b = S.b[i], v = m.vin[i]; v.a = false;
    if (b.at >= 0 && S.L[b.at].by === i) { v.a = true; v.ax = v.ay = 0; return; }
    const G = S.gust;
    if (b.tgt === undefined || S.L[b.tgt].own === i || (G.warn > 0 && Math.floor(b.tgt / 4) === G.row) || Math.random() < 0.003) {
      const c0 = S.L.map((L, k) => ({ L, k, s: dist(L.x, L.y + 40, b.x, b.y) + (L.own >= 0 ? 160 : 0) + (G.warn > 0 && Math.floor(k / 4) === G.row ? 400 : 0) + (S.b.some((o, j) => j !== i && (o.at === k || o.tgt === k)) ? 220 : 0) + R.range(0, 80) })).filter(o => o.L.own !== i).sort((p, q) => p.s - q.s)[0];
      b.tgt = c0 ? c0.k : undefined;
    }
    const c = b.tgt !== undefined ? { L: S.L[b.tgt] } : null;
    if (!c) { MGH.aim(m, i, 640, 450, b, 30); return; }
    MGH.aim(m, i, c.L.x, c.L.y + 40, b, 8); if (dist(c.L.x, c.L.y + 40, b.x, b.y) < 46) v.a = true;
  },
  score(m, S) { return S.b.map(b => Math.round(b.pts)); },
  fmt(s) { return `${s} glow`; },
  hud(m, S, i) { return `💡 ${Math.round(S.b[i].pts)} · ${S.L.filter(L => L.own === i).length} lamps`; },
  draw(m, S, g) {
    // dusk village plaza
    GX.vfill(g, 0, 0, 1280, 220, ['#2a2a5a', '#6a4a7a', '#e88a6a']);
    for (let k = 0; k < 30; k++) { g.fillStyle = `rgba(255,255,255,${0.4 + 0.4 * Math.sin(m.t * 2 + k)})`; g.fillRect(MGH.hash(k) * 1280, MGH.hash(k + 3) * 90, 2, 2); }
    for (let k = 0; k < 9; k++) { const x = k * 150 - 20, h = 80 + MGH.hash(k) * 50; g.fillStyle = '#2a2038'; g.fillRect(x, 220 - h, 130, h); g.beginPath(); g.moveTo(x - 8, 220 - h); g.lineTo(x + 65, 220 - h - 40); g.lineTo(x + 138, 220 - h); g.fill(); for (let w = 0; w < 3; w++) { const lit = MGH.hash(k * 3 + w + Math.floor(m.t / 4)) < 0.6; g.fillStyle = lit ? '#ffd88a' : '#3a3050'; g.fillRect(x + 16 + w * 38, 220 - h + 24, 18, 22); } }
    const dark = S.L.filter(L => L.own >= 0).length / S.L.length;
    GX.vfill(g, 0, 218, 1280, 502, ['#3a3448', '#24202e']);
    for (let r = 0; r < 14; r++) for (let c = 0; c < 22; c++) { const x = c * 60 + (r % 2) * 30 - 20, y = 222 + r * 36; g.fillStyle = 'rgba(255,255,255,0.04)'; MGH.rr(g, x, y, 56, 32, 8); g.fill(); }
    // warm pools of light from lit lamps
    g.save(); g.globalCompositeOperation = 'lighter'; S.L.forEach(L => { if (L.own >= 0) { const c = m.players[L.own].color; MGH.glow(g, L.x, L.y + 50, 150, c + '55'); MGH.glow(g, L.x, L.y + 50, 90, 'rgba(255,230,170,0.25)'); } }); g.restore();
    // gust: leaves streaming across the row
    const G = S.gust; if (G.warn > 0 || G.blow > 0) { const y = 270 + G.row * 160, a = G.warn > 0 ? 0.5 + 0.5 * Math.sin(m.t * 20) : G.blow; g.fillStyle = `rgba(200,220,255,${0.08 * a})`; g.fillRect(0, y - 90, 1280, 160); for (let q = 0; q < 24; q++) { const x = ((q * 61 + m.t * 600 * G.side) % 1400 + 1400) % 1400 - 60, yy = y - 60 + (q * 37) % 120 + Math.sin(m.t * 6 + q) * 8; g.fillStyle = ['#d8a040', '#c86a2a', '#a8b040'][q % 3]; g.save(); g.translate(x, yy); g.rotate(m.t * 8 + q); g.beginPath(); g.ellipse(0, 0, 6, 3, 0, 0, 7); g.fill(); g.restore(); g.strokeStyle = `rgba(255,255,255,${0.3 * a})`; g.lineWidth = 2; g.beginPath(); g.moveTo(x - G.side * 40, yy); g.lineTo(x - G.side * 80, yy); g.stroke(); } if (G.warn > 0) MGH.text(g, G.side > 0 ? '💨 ➜' : '⬅ 💨', G.side > 0 ? 60 : 1220, y - 70, 26, '#fff', 'center', 'bold'); }
    const ents = S.L.map(L => ({ y: L.y + 40, f: () => {
      GX.shadow(g, L.x, L.y + 44, 22, 0.4);
      const pg = g.createLinearGradient(L.x - 5, 0, L.x + 5, 0); pg.addColorStop(0, '#1a1a24'); pg.addColorStop(0.5, '#5a5a6a'); pg.addColorStop(1, '#1a1a24'); g.fillStyle = pg; g.fillRect(L.x - 4, L.y - 60, 8, 104); g.fillStyle = '#2a2a34'; MGH.rr(g, L.x - 12, L.y + 32, 24, 12, 4); g.fill();
      g.strokeStyle = '#2a2a34'; g.lineWidth = 3; g.beginPath(); g.moveTo(L.x, L.y - 60); g.quadraticCurveTo(L.x + 12, L.y - 72, L.x, L.y - 84); g.stroke();
      const lit = L.own >= 0, c = lit ? m.players[L.own].color : '#3a3a48';
      if (lit) { MGH.glow(g, L.x, L.y - 76, 46, c + 'aa'); MGH.glow(g, L.x, L.y - 76, 22, 'rgba(255,250,220,0.9)'); }
      g.fillStyle = lit ? '#fff8d8' : '#4a4a5a'; g.beginPath(); g.moveTo(L.x - 13, L.y - 64); g.lineTo(L.x + 13, L.y - 64); g.lineTo(L.x + 16, L.y - 88); g.lineTo(L.x - 16, L.y - 88); g.fill();
      g.strokeStyle = c; g.lineWidth = 3; g.stroke(); g.fillStyle = '#2a2a34'; g.beginPath(); g.moveTo(L.x - 20, L.y - 88); g.lineTo(L.x, L.y - 100); g.lineTo(L.x + 20, L.y - 88); g.fill();
      if (lit) MGH.flame(g, L.x, L.y - 70, 0.18, m.t, L.x);
      if (L.out > 0) for (let q = 0; q < 3; q++) { g.fillStyle = `rgba(200,200,210,${0.5 * L.out})`; g.beginPath(); g.arc(L.x + q * 8, L.y - 96 - (1 - L.out) * 30 - q * 6, 6 + q * 2, 0, 7); g.fill(); }
      if (L.by >= 0) { g.fillStyle = 'rgba(0,0,0,0.55)'; MGH.rr(g, L.x - 26, L.y - 120, 52, 9, 4); g.fill(); g.fillStyle = m.players[L.by].color; MGH.rr(g, L.x - 25, L.y - 119, 50 * Math.min(1, L.prog), 7, 3); g.fill(); }
    } }));
    S.b.forEach((b, i) => ents.push({ y: b.y, f: () => { MGH.drawBody(g, b, m.players[i], '', b.at >= 0 ? 'effort' : 'happy'); if (b.at >= 0) { const L = S.L[b.at]; g.strokeStyle = '#c8a060'; g.lineWidth = 3; g.beginPath(); g.moveTo(b.x + 10, b.y - 10); g.lineTo(L.x + 6, L.y - 66); g.stroke(); MGH.flame(g, L.x + 6, L.y - 68, 0.12, m.t, i); } } }));
    ents.sort((a, b) => a.y - b.y).forEach(e => e.f());
    g.fillStyle = `rgba(10,5,30,${0.25 * (1 - dark)})`; g.fillRect(0, 0, 1280, 720);
  },
});
