'use strict';
// Party batch 2b: Hoops Shootout, Sky Dive, Ski Jump, Kart Dash, Pearl Dive

// ======================================================================== HOOPS SHOOTOUT
MG.def({
  id: 'hoops', name: 'Hoops Shootout', type: 'Skill', controls: '1 button (hold & release)', dur: 40, sport: true,
  rows: [['a', 'Hold for power, let go to shoot']],
  how: 'Shoot as many baskets as you can! Hold A — the power bar fills — and let go. Too little and you fall short, too much and you bounce off the backboard. A clean SWISH (perfect power) is worth 3 points, any other basket 2. After 15 seconds the hoops start sliding — time your shots!',
  wins: 'Most points.',
  init(m, S) { S.p = [0, 1, 2, 3].map(() => ({ hold: -1, ball: null, pts: 0, flash: 0, txt: '' })); },
  hoopX(m, i) { const base = 160 + i * 320 + 95; return m.t > 15 ? base + Math.sin(m.t * 1.3 + i) * 40 : base; },
  sx(i) { return 160 + i * 320 - 120; },
  update(m, S, dt) {
    S.p.forEach((p, i) => {
      p.flash -= dt;
      if (!p.ball) {
        if (m.held(i, 'a')) { if (p.hold < 0) p.hold = 0; p.hold += dt; }
        else if (p.hold > 0) { const pw = 0.5 - 0.5 * Math.cos(p.hold * 2.2); p.ball = { x: this.sx(i), y: 540, vx: 60 + pw * 260, vy: -820, pw, scored: false, t: 0 }; p.hold = -1; if (!m.bot(i)) Sfx.whoosh(); }
        return;
      }
      const b = p.ball; b.t += dt; b.vy += 980 * dt; b.x += b.vx * dt; b.y += b.vy * dt;
      const hx = this.hoopX(m, i), hy = 320;
      if (!b.scored && b.vy > 0 && Math.abs(b.y - hy) < 12 && Math.abs(b.x - hx) < 26) { b.scored = true; const sw = Math.abs(b.x - hx) < 10; p.pts += sw ? 3 : 2; p.txt = sw ? 'SWISH! +3' : '+2'; p.flash = 0.9; Sfx.coin(); MGH.burst(hx, hy, ['#ffd34d', '#fff'], 14, { speed: 160 }); }
      if (!b.scored && b.x > hx + 44 && b.y < hy) { b.vx = -Math.abs(b.vx) * 0.5; Sfx.thud(); } // backboard
      if (!b.scored && Math.abs(b.x - (hx - 28)) < 8 && Math.abs(b.y - hy) < 10) { b.vy = -Math.abs(b.vy) * 0.5; b.vx *= -0.6; Sfx.tone(300, 0.04, 'square', 0.04); } // rim
      if (b.y > 620 || b.t > 3) p.ball = null;
    });
  },
  bot(m, S, i) {
    const p = S.p[i], v = m.vin[i]; if (p.ball) { v.a = false; return; }
    const hx = this.hoopX(m, i) + (m.t > 15 ? Math.cos(m.t * 1.3 + i) * 40 * 1.3 * 1.34 : 0), sx = this.sx(i), need = clamp(((hx - sx) / 1.338 - 60) / 260, 0.05, 1);
    p.target = p.target || clamp(need + R.range(-0.08, 0.08), 0.03, 1);
    v.a = !(p.hold > 0 && 0.5 - 0.5 * Math.cos(p.hold * 2.2) >= p.target);
    if (!v.a) p.target = null;
  },
  score(m, S) { return S.p.map(p => p.pts); },
  fmt(s) { return `${s} pts`; },
  hud(m, S, i) { return `${S.p[i].pts} pts`; },
  draw(m, S, g) {
    g.fillStyle = MGH.grad(g, 0, 720, ['#2a3a6a', '#3a4a8a', '#1a2448']); g.fillRect(0, 0, 1280, 720);
    MGH.crowd(g, m.t, 200, 30, ['#c84a5a', '#4a6ac8', '#8a8a9a', '#c8a84a']);
    g.fillStyle = MGH.grad(g, 560, 720, ['#d89a5a', '#b87a3a']); g.fillRect(0, 580, 1280, 140); for (let k = 0; k < 20; k++) { g.strokeStyle = 'rgba(0,0,0,0.12)'; g.lineWidth = 2; g.beginPath(); g.moveTo(k * 70, 580); g.lineTo(k * 70 - 30, 720); g.stroke(); }
    Char.npc(g, 640, 640, 22, 'ref', { mood: 'happy', t: m.t });
    S.p.forEach((p, i) => {
      const hx = this.hoopX(m, i), hy = 320, sx = this.sx(i), pl = m.players[i];
      g.fillStyle = '#888'; g.fillRect(hx + 42, hy - 10, 8, 310); g.fillStyle = '#fff'; MGH.rr(g, hx + 30, hy - 80, 16, 100, 4); g.fill(); g.strokeStyle = pl.color; g.lineWidth = 3; g.strokeRect(hx + 30, hy - 60, 16, 40);
      g.strokeStyle = '#e8501a'; g.lineWidth = 5; g.beginPath(); g.ellipse(hx, hy, 30, 8, 0, 0, 7); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 1.5; for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(hx + k * 12, hy + 4); g.lineTo(hx + k * 7, hy + 42); g.stroke(); }
      Char.draw(g, sx - 6, 560, 32, pl.el.id, pl.color, { mood: p.flash > 0 ? 'cheer' : p.hold > 0 ? 'effort' : 'determined', seed: i, look: { x: 1, y: -0.8 }, hands: p.hold > 0 || !p.ball ? { n: { x: -0.6, y: -1.3, d: -100, o: true, m: false }, f: { x: 0.2, y: -1.4, d: -80, o: true, m: false } } : undefined });
      if (!p.ball) { const by = 470 - (p.hold > 0 ? 10 : 0); g.fillStyle = '#e8701a'; g.beginPath(); g.arc(sx + 6, by, 15, 0, 7); g.fill(); }
      if (p.hold > 0) { const pw = 0.5 - 0.5 * Math.cos(p.hold * 2.2); g.fillStyle = 'rgba(0,0,0,0.5)'; MGH.rr(g, sx - 34, 380, 16, 120, 6); g.fill(); g.fillStyle = '#7cf06a'; g.fillRect(sx - 31, 497 - pw * 114, 10, pw * 114); }
      if (p.ball) { const b = p.ball; MGH.shadow(g, b.x, 600, 14, 0.2); g.save(); g.translate(b.x, b.y); g.rotate(b.t * 8); g.fillStyle = '#e8701a'; g.beginPath(); g.arc(0, 0, 15, 0, 7); g.fill(); g.strokeStyle = '#6a2a0a'; g.lineWidth = 2; g.beginPath(); g.moveTo(-15, 0); g.lineTo(15, 0); g.moveTo(0, -15); g.lineTo(0, 15); g.stroke(); g.restore(); }
      if (p.flash > 0) MGH.text(g, p.txt, hx, hy - 110, 30, '#ffe680', 'center', 'bold');
      MGH.text(g, `${pl.name} ${p.pts}`, 160 + i * 320, 700, 20, pl.color, 'center', 'bold');
    });
    if (m.t > 15 && m.t < 17) MGH.text(g, 'The hoops are moving!', 640, 160, 34, '#ffe680', 'center', 'bold');
  },
});

// ======================================================================== SKY DIVE
MG.def({
  id: 'skydive', name: 'Sky Dive', type: 'Skill', controls: 'Left/Right + button', dur: 0,
  rows: [['lr', 'Steer through the rings'], ['a', 'Open the parachute']],
  how: 'Jump from the balloon and fall through the sky! Steer LEFT/RIGHT through the glowing rings (+1 each) and dodge the geese. Watch your altimeter: press A to open your parachute, then steer onto the target. Land close to the bullseye for up to 5 more points — but open too late and you go SPLAT for nothing!',
  wins: 'Most points from rings and landing.',
  H: 5200,
  init(m, S) {
    S.p = [0, 1, 2, 3].map(i => ({ x: 160 + i * 320, alt: this.H, vx: 0, chute: false, pts: 0, landed: false, splat: false, stun: 0, msg: '', msgT: 0 }));
    S.rings = []; for (let a = this.H - 500; a > 900; a -= R.range(280, 420)) S.rings.push({ alt: a, dx: R.range(-110, 110) });
    S.birds = []; for (let a = this.H - 800; a > 1200; a -= R.range(500, 800)) S.birds.push({ alt: a, ph: R.range(0, 6) });
    S.done = 0;
  },
  update(m, S, dt) {
    S.p.forEach((p, i) => {
      if (p.landed) return;
      p.stun -= dt; p.msgT -= dt;
      const ax = p.stun > 0 ? 0 : m.axis(i).x; p.vx += (ax * 900 - p.vx * 4) * dt; p.x = clamp(p.x + p.vx * dt, 40 + i * 320, 280 + i * 320);
      const fall = p.chute ? 110 : 560; p.alt -= fall * dt;
      if (!p.chute && m.pressed(i, 'a') && p.alt < 1800) { p.chute = true; Sfx.whoosh(false); }
      const lx = p.x - (160 + i * 320);
      S.rings.forEach(r => { if (!r['g' + i] && Math.abs(r.alt - p.alt) < 30) { r['g' + i] = 1; if (Math.abs(lx - r.dx) < 44) { p.pts++; p.msg = '+1'; p.msgT = 0.6; if (!m.bot(i)) Sfx.coin(); } } });
      S.birds.forEach(b => { const bx = Math.sin(m.t * 1.2 + b.ph + i) * 100; if (!b['g' + i] && Math.abs(b.alt - p.alt) < 30 && Math.abs(lx - bx) < 40) { b['g' + i] = 1; p.stun = 0.8; p.msg = 'HONK!'; p.msgT = 0.8; if (!m.bot(i)) Sfx.bad(); } });
      if (p.alt <= 0) {
        p.landed = true; p.alt = 0; S.done++;
        if (!p.chute) { p.splat = true; p.msg = 'SPLAT!'; p.msgT = 3; Sfx.boom(); }
        else { const d = Math.abs(lx); const bonus = d < 14 ? 5 : d < 34 ? 3 : d < 60 ? 1 : 0; p.pts += bonus; p.msg = bonus === 5 ? 'BULLSEYE! +5' : bonus ? `+${bonus}` : 'Missed the target'; p.msgT = 3; Sfx.thud(); if (bonus) Sfx.coin(); }
      }
    });
    if (S.p.every(p => p.landed)) { S.end = (S.end || 0) + dt; if (S.end > 1.5) m.finish(this.score(m, S)); }
  },
  bot(m, S, i) {
    const p = S.p[i], v = m.vin[i]; v.a = false; v.left = v.right = false; if (p.landed) return;
    const lx = p.x - (160 + i * 320); let tx = 0;
    const r = S.rings.find(r => !r['g' + i] && r.alt < p.alt && r.alt > p.alt - 700); if (r && !p.chute) tx = r.dx;
    if (lx < tx - 8) v.right = true; else if (lx > tx + 8) v.left = true;
    p.openAt = p.openAt || R.range(380, 1100); if (!p.chute && p.alt < p.openAt) v.a = true;
  },
  score(m, S) { return S.p.map(p => p.pts); },
  fmt(s) { return `${s} pts`; },
  hud(m, S, i) { const p = S.p[i]; return `${p.pts} · ${Math.round(p.alt)}m` + (p.chute ? ' 🪂' : ''); },
  draw(m, S, g) {
    for (let i = 0; i < 4; i++) {
      const p = S.p[i], ox = i * 320, cam = p.alt, pl = m.players[i];
      g.save(); g.beginPath(); g.rect(ox, 40, 320, 680); g.clip();
      const k = 1 - cam / this.H; g.fillStyle = MGH.grad(g, 40, 720, [k < 0.7 ? '#4a8ae8' : '#6ab8f0', '#9fd8ff', k > 0.8 ? '#c8f0c0' : '#d8f0ff']); g.fillRect(ox, 40, 320, 680);
      for (let c = 0; c < 4; c++) { const yy = 720 - (((c * 230 + (this.H - cam) * 0.5) % 900)); MGH.cloud(g, ox + 60 + (c % 2) * 180, yy, 22 + c * 3); }
      const sy = a => 300 + (cam - a) * 0.5;
      S.rings.forEach(r => { const y = sy(r.alt); if (y < 20 || y > 760) return; g.strokeStyle = r['g' + i] ? 'rgba(255,255,255,0.3)' : '#ffd34d'; g.lineWidth = 7; g.beginPath(); g.ellipse(ox + 160 + r.dx, y, 44, 16, 0, 0, 7); g.stroke(); });
      S.birds.forEach(b => { const y = sy(b.alt); if (y < 20 || y > 760) return; const bx = ox + 160 + Math.sin(m.t * 1.2 + b.ph + i) * 100; MGH.text(g, '🪿', bx, y + 10, 34, '#fff'); });
      // ground and the target
      const gy = sy(0); if (gy < 760) { g.fillStyle = '#5ab84a'; g.fillRect(ox, gy, 320, 760 - gy); for (const [rr, c] of [[70, '#fff'], [52, '#e8323e'], [34, '#fff'], [16, '#e8323e']]) { g.fillStyle = c; g.beginPath(); g.ellipse(ox + 160, gy + 6, rr, rr * 0.3, 0, 0, 7); g.fill(); } }
      // the diver
      const y = p.landed ? gy - 30 : 300;
      if (p.chute && !p.splat) { g.fillStyle = pl.color; g.beginPath(); g.arc(p.x, y - 90, 60, Math.PI, 0); g.fill(); g.fillStyle = 'rgba(255,255,255,0.4)'; for (let q = 0; q < 3; q++) { g.beginPath(); g.arc(p.x - 40 + q * 40, y - 90, 20, Math.PI, 0); g.fill(); } g.strokeStyle = '#555'; g.lineWidth = 1.5; for (const dx of [-58, -20, 20, 58]) { g.beginPath(); g.moveTo(p.x + dx, y - 90); g.lineTo(p.x, y - 20); g.stroke(); } }
      if (p.splat) { g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(p.x, gy + 4, 50, 10, 0, 0, 7); g.fill(); Char.draw(g, p.x, gy - 4, 24, pl.el.id, pl.color, { mood: 'dizzy', seed: i, noFeet: true }); }
      else Char.draw(g, p.x, y, 26, pl.el.id, pl.color, { mood: p.stun > 0 ? 'dizzy' : p.landed ? 'cheer' : p.chute ? 'happy' : 'starry', seed: i, look: { x: p.vx / 300, y: 1 }, hands: p.chute || p.landed ? undefined : { n: { x: -1.3, y: -0.9, d: -150, o: true, m: false }, f: { x: 1.3, y: -0.9, d: -30, o: true, m: false } } });
      if (p.msgT > 0) MGH.text(g, p.msg, ox + 160, 200, 26, p.msg === 'SPLAT!' || p.msg === 'HONK!' ? '#ff6a6a' : '#ffe680', 'center', 'bold');
      // altimeter
      g.fillStyle = 'rgba(0,0,0,0.5)'; MGH.rr(g, ox + 280, 80, 24, 300, 8); g.fill(); g.fillStyle = p.alt < 1800 && !p.chute ? '#ff6a4a' : '#7cf06a'; g.fillRect(ox + 284, 376 - 292 * (p.alt / this.H), 16, 4); g.fillStyle = 'rgba(255,90,60,0.4)'; g.fillRect(ox + 284, 376 - 292 * (1800 / this.H), 16, 292 * (1800 / this.H));
      if (!p.chute && !p.landed && p.alt < 1800) MGH.text(g, 'A = parachute!', ox + 160, 150, 20, '#fff', 'center', 'bold');
      MGH.text(g, `${pl.name} ${p.pts}`, ox + 160, 700, 18, pl.color, 'center', 'bold');
      g.restore();
      g.fillStyle = '#1a1a2a'; g.fillRect(ox + 318, 40, 4, 680);
    }
  },
});

// ======================================================================== SKI JUMP
MG.def({
  id: 'skijump', name: 'Ski Jump', type: 'Timing', controls: '1 button (hold & release)', dur: 0, sport: true,
  rows: [['a', 'Hold to crouch, let go to JUMP'], ['pad', 'Balance in the air (UP / DOWN)']],
  how: 'Two jumps each. HOLD A to crouch as you race down the in-run, then LET GO right at the lip for a big take-off — the closer to the red line, the further you fly. In the air, keep the wobbling balance needle in the middle with UP/DOWN. Press A again just before you touch down for a clean telemark landing (+5 m). Fall over and the jump scores half.',
  wins: 'Longest total distance over two jumps.',
  init(m, S) { S.jump = 0; S.tot = [0, 0, 0, 0]; this.start(S); },
  start(S) { S.jump++; S.p = [0, 1, 2, 3].map(() => ({ ph: 'run', s: 0, hold: false, take: 0, air: 0, bal: 0, balV: R.range(-0.4, 0.4), dist: 0, fell: false, tele: false, vy: 0, h: 0, msg: '' })); S.pt = 0; },
  update(m, S, dt) {
    S.pt += dt;
    S.p.forEach((p, i) => {
      if (p.ph === 'run') {
        p.hold = m.held(i, 'a'); p.s += (p.hold ? 0.36 : 0.26) * dt;
        if (p.s >= 1) { p.take = 0; this.launch(p); }
        else if (p.hold === false && m.released(i, 'a') && p.s > 0.6) { p.take = 1 - p.s; this.launch(p); }
      } else if (p.ph === 'air') {
        p.air += dt; p.balV += R.range(-2.2, 2.2) * dt; const a = m.axis(i).y; p.balV += a * 3.2 * dt; p.bal += p.balV * dt; p.balV *= Math.pow(0.6, dt);
        if (Math.abs(p.bal) > 1) { p.fell = true; p.bal = Math.sign(p.bal); }
        p.vy += 300 * dt; p.h -= p.vy * dt; p.dist += p.spd * dt * (1 - Math.abs(p.bal) * 0.35);
        if (m.pressed(i, 'a') && p.h < 40 && p.h > 0) p.tele = true;
        if (p.h <= 0) { p.ph = 'land'; if (p.tele && !p.fell) p.dist += 5; if (p.fell) p.dist *= 0.5; p.msg = p.fell ? 'Wipe-out!' : p.tele ? 'Telemark! +5 m' : 'Landed'; if (!m.bot(i)) (p.fell ? Sfx.bad() : Sfx.thud()); S.tot[i] += p.dist; }
      }
    });
    if (S.p.every(p => p.ph === 'land')) { S.wait = (S.wait || 0) + dt; if (S.wait > 2.4) { S.wait = 0; if (S.jump >= 2) m.finish(this.score(m, S)); else this.start(S); } }
  },
  launch(p) { const q = Math.max(0, 1 - p.take / 0.12); p.ph = 'air'; p.spd = 34 + q * 26; p.vy = -90 - q * 70; p.h = 30; p.msg = q > 0.85 ? 'Perfect take-off!' : q > 0.4 ? 'Good take-off' : 'Early…'; },
  bot(m, S, i) {
    const p = S.p[i], v = m.vin[i]; v.up = v.down = false;
    if (p.ph === 'run') { p.rel = p.rel || R.range(0.9, 0.995); v.a = p.s < p.rel; }
    else if (p.ph === 'air') { if (p.bal > 0.15) v.up = true; else if (p.bal < -0.15) v.down = true; v.a = p.h < 30 && Math.random() < 0.3; }
    else v.a = false;
  },
  score(m, S) { return S.tot.map(t => Math.round(t * 10) / 10); },
  fmt(s) { return `${s.toFixed(1)} m`; },
  hud(m, S, i) { const p = S.p[i]; return `${(S.tot[i] + (p.ph === 'land' ? 0 : p.dist)).toFixed(0)} m`; },
  draw(m, S, g) {
    g.fillStyle = MGH.grad(g, 0, 720, ['#8ac8f0', '#d8eeff', '#ffffff']); g.fillRect(0, 0, 1280, 720);
    MGH.ridge(g, 300, 120, '#b8cce0', 3); MGH.ridge(g, 360, 90, '#9ab0c8', 5);
    S.p.forEach((p, i) => {
      const y0 = 110 + i * 150, pl = m.players[i];
      g.save(); g.beginPath(); g.rect(0, y0 - 60, 1280, 148); g.clip();
      // in-run ramp, lip and landing hill
      g.fillStyle = '#f4faff'; g.beginPath(); g.moveTo(0, y0 - 50); g.lineTo(300, y0 + 30); g.lineTo(330, y0 + 26); g.lineTo(330, y0 + 90); g.lineTo(0, y0 + 90); g.fill();
      g.fillStyle = '#e8f4ff'; g.beginPath(); g.moveTo(330, y0 + 40); g.quadraticCurveTo(700, y0 + 60, 1280, y0 + 86); g.lineTo(1280, y0 + 90); g.lineTo(330, y0 + 90); g.fill();
      g.strokeStyle = '#e8323e'; g.lineWidth = 3; g.beginPath(); g.moveTo(326, y0 + 12); g.lineTo(326, y0 + 36); g.stroke();
      for (let d = 20; d <= 120; d += 20) { const x = 330 + d * 7.5; g.strokeStyle = 'rgba(40,80,160,0.3)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y0 + 50 + d * 0.3); g.lineTo(x, y0 + 86); g.stroke(); MGH.text(g, d + 'm', x, y0 + 82, 11, '#4a6a9a', 'center', ''); }
      let x, y;
      if (p.ph === 'run') { x = p.s * 320; y = y0 - 50 + p.s * 76; }
      else { x = 330 + p.dist * 7.5; const hillY = y0 + 40 + (x - 330) * 0.06; y = hillY - Math.max(0, p.h) * 1.4; }
      Char.draw(g, x, y - 26, 20, pl.el.id, pl.color, { mood: p.ph === 'land' ? (p.fell ? 'dizzy' : 'cheer') : p.ph === 'air' ? 'starry' : p.hold ? 'effort' : 'determined', seed: i, look: { x: 1, y: 0.3 }, noIdle: true });
      g.strokeStyle = '#3a3a4a'; g.lineWidth = 3; g.beginPath(); g.moveTo(x - 22, y + 2); g.lineTo(x + 26, y - 2 + (p.ph === 'air' ? p.bal * 10 : 0)); g.stroke();
      if (p.ph === 'air') { g.fillStyle = 'rgba(0,0,0,0.5)'; MGH.rr(g, 1150, y0 - 40, 100, 16, 8); g.fill(); g.fillStyle = 'rgba(124,240,106,0.6)'; g.fillRect(1185, y0 - 37, 30, 10); g.fillStyle = Math.abs(p.bal) > 0.7 ? '#ff4a3a' : '#fff'; g.fillRect(1199 + p.bal * 48, y0 - 42, 4, 20); }
      if (p.msg && p.ph !== 'run') MGH.text(g, p.msg, 760, y0 - 30, 18, '#2a4a8a', 'center', 'bold');
      MGH.text(g, `${pl.name} · ${(S.tot[i] + (p.ph === 'land' ? 0 : p.dist)).toFixed(1)} m`, 120, y0 + 76, 16, pl.color, 'center', 'bold');
      g.restore();
    });
    MGH.label(g, `Jump ${S.jump} of 2`, 640, 60, 20, '#fff', 'rgba(40,60,120,0.7)');
  },
});

// ======================================================================== KART DASH
MG.def({
  id: 'kart', name: 'Kart Dash', type: 'Race', controls: 'Left/Right + button', dur: 0, sport: true,
  rows: [['lr', 'Steer'], ['a', 'Accelerate (hold)']],
  how: 'Three laps round the island track! HOLD A to drive and steer with LEFT/RIGHT. Stay on the tarmac — the grass slows you right down. Zoom over the yellow arrow pads for a speed boost. Bump rivals out of the way!',
  wins: 'First to finish three laps.',
  PTS: [[260, 180], [640, 140], [1020, 180], [1130, 360], [1020, 560], [760, 600], [640, 460], [520, 600], [260, 560], [150, 360]],
  init(m, S) {
    const P = this.PTS; S.k = [0, 1, 2, 3].map(i => { const k = { x: P[0][0] - 30 - (i % 2) * 40, y: P[0][1] + (i < 2 ? -18 : 18) + (i % 2) * 12, a: 0.05, v: 0, seg: 0, lap: -1, done: 0, prog: 0, boost: 0 }; k.prog = this.segDist(k.x, k.y).prog; return k; });
    S.pads = [[640, 140], [1130, 360], [640, 460]];
  },
  segDist(x, y) { // distance to the track centre line and progress along it
    const P = this.PTS; let best = { d: 1e9, prog: 0 };
    for (let k = 0; k < P.length; k++) { const a = P[k], b = P[(k + 1) % P.length], dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy, t = clamp(((x - a[0]) * dx + (y - a[1]) * dy) / L2, 0, 1), d = Math.hypot(x - a[0] - dx * t, y - a[1] - dy * t); if (d < best.d) best = { d, prog: k + t }; }
    return best;
  },
  update(m, S, dt) {
    S.k.forEach((k, i) => {
      if (k.done) { k.v *= 0.95; k.x += Math.cos(k.a) * k.v * dt; k.y += Math.sin(k.a) * k.v * dt; return; }
      const ax = m.axis(i).x, gas = m.held(i, 'a');
      k.a += ax * 2.6 * dt * clamp(k.v / 200, 0.3, 1);
      const sd = this.segDist(k.x, k.y), off = sd.d > 46, top = (off ? 150 : 340) + (k.boost > 0 ? 160 : 0);
      k.v += ((gas ? top : 0) - k.v) * (gas ? 1.6 : 1.2) * dt; k.boost -= dt;
      k.x += Math.cos(k.a) * k.v * dt; k.y += Math.sin(k.a) * k.v * dt; k.x = clamp(k.x, 20, 1260); k.y = clamp(k.y, 60, 700);
      S.pads.forEach(p => { if (dist(k.x, k.y, p[0], p[1]) < 30 && k.boost < 0.5) { k.boost = 1; if (!m.bot(i)) Sfx.whoosh(); } });
      const N = this.PTS.length; let pr = sd.prog; if (pr < 1 && k.prog > N - 1.5) { k.lap++; if (k.lap >= 3) { k.done = m.t; Sfx.crowd('cheer'); } } else if (pr > N - 1.5 && k.prog < 1 && k.lap > 0) k.lap--;
      k.prog = pr;
    });
    for (let a = 0; a < 4; a++) for (let b = a + 1; b < 4; b++) { if (S.k[a].done || S.k[b].done) continue; const p = S.k[a], q = S.k[b], d = dist(p.x, p.y, q.x, q.y); if (d < 34 && d > 0) { const nx = (q.x - p.x) / d, ny = (q.y - p.y) / d; p.x -= nx * (34 - d) / 2; p.y -= ny * (34 - d) / 2; q.x += nx * (34 - d) / 2; q.y += ny * (34 - d) / 2; p.v *= 0.995; q.v *= 0.995; } }
    if (S.k.filter(k => k.done).length >= 3 || (S.k.some(k => k.done) && m.t > Math.min(...S.k.filter(k => k.done).map(k => k.done)) + 12)) m.finish(this.score(m, S));
  },
  bot(m, S, i) {
    const k = S.k[i], v = m.vin[i], P = this.PTS, N = P.length; v.a = true; v.left = v.right = false;
    const nxt = P[(Math.floor(k.prog) + 1) % N], nn = P[(Math.floor(k.prog) + 2) % N], f = k.prog % 1;
    const tx = nxt[0] * (1 - f * 0.6) + nn[0] * f * 0.6, ty = nxt[1] * (1 - f * 0.6) + nn[1] * f * 0.6;
    const want = Math.atan2(ty - k.y, tx - k.x), d = Math.atan2(Math.sin(want - k.a), Math.cos(want - k.a)) + (k.wob = (k.wob || 0) * 0.95 + R.range(-0.04, 0.04));
    if (d > 0.08) v.right = true; else if (d < -0.08) v.left = true;
  },
  score(m, S) { return S.k.map(k => k.done ? 10000 - k.done * 10 : Math.max(0, k.lap) * 100 + k.prog * 9); },
  fmt(s) { return s > 5000 ? `${((10000 - s) / 10).toFixed(1)}s` : `lap ${Math.min(3, Math.floor(s / 100) + 1)}`; },
  hud(m, S, i) { const k = S.k[i]; return k.done ? '🏁' : `lap ${clamp(k.lap + 1, 1, 3)}/3`; },
  draw(m, S, g) {
    g.fillStyle = '#3ab8e8'; g.fillRect(0, 0, 1280, 720);
    for (let k = 0; k < 30; k++) { g.strokeStyle = 'rgba(255,255,255,0.3)'; g.lineWidth = 2; g.beginPath(); g.arc((k * 97 + m.t * 15) % 1300, 50 + (k * 53) % 680, 8, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }
    g.fillStyle = '#f0dca0'; g.beginPath(); g.ellipse(640, 370, 600, 330, 0, 0, 7); g.fill();
    g.fillStyle = '#5ac84a'; g.beginPath(); g.ellipse(640, 370, 570, 300, 0, 0, 7); g.fill();
    const P = this.PTS, path = () => { g.beginPath(); P.forEach((p, k) => { const q = P[(k + 1) % P.length], mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2; if (!k) g.moveTo(mx, my); else g.quadraticCurveTo(p[0], p[1], mx, my); }); const p0 = P[0], q0 = P[1]; g.quadraticCurveTo(p0[0], p0[1], (p0[0] + q0[0]) / 2, (p0[1] + q0[1]) / 2); g.closePath(); };
    g.lineJoin = 'round'; g.strokeStyle = '#e8323e'; g.lineWidth = 104; path(); g.stroke(); g.strokeStyle = '#fff'; g.setLineDash([22, 22]); g.stroke(); g.setLineDash([]);
    g.strokeStyle = '#4a4a54'; g.lineWidth = 92; path(); g.stroke(); g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 2; g.setLineDash([18, 18]); path(); g.stroke(); g.setLineDash([]);
    // start line
    g.save(); g.translate(P[0][0], P[0][1]); for (let r = 0; r < 2; r++) for (let c = 0; c < 9; c++) { g.fillStyle = (r + c) % 2 ? '#fff' : '#111'; g.fillRect(-6 + r * 6, -46 + c * 10.2, 6, 10.2); } g.restore();
    S.pads.forEach(p => { g.fillStyle = '#ffd34d'; MGH.rr(g, p[0] - 24, p[1] - 18, 48, 36, 8); g.fill(); MGH.text(g, '»', p[0], p[1] + 10, 30, '#e8701a', 'center', 'bold'); });
    for (let k = 0; k < 6; k++) { const a = k * 1.05, x = 640 + Math.cos(a) * 250, y = 370 + Math.sin(a) * 90; g.fillStyle = '#3a8a32'; g.beginPath(); g.arc(x, y, 18, 0, 7); g.fill(); }
    Char.npc(g, 640, 330, 22, 'ref', { mood: 'happy', t: m.t });
    S.k.forEach((k, i) => {
      const pl = m.players[i];
      g.save(); g.translate(k.x, k.y); g.rotate(k.a);
      g.fillStyle = 'rgba(0,0,0,0.3)'; MGH.rr(g, -22, -14, 48, 32, 8); g.fill();
      g.fillStyle = pl.color; MGH.rr(g, -24, -16, 48, 32, 10); g.fill(); g.fillStyle = '#222'; for (const [x, y] of [[-14, -18], [14, -18], [-14, 14], [14, 14]]) g.fillRect(x - 6, y, 12, 4);
      if (k.boost > 0) { g.fillStyle = 'rgba(255,180,40,0.8)'; g.beginPath(); g.moveTo(-24, -8); g.lineTo(-44 - Math.random() * 10, 0); g.lineTo(-24, 8); g.fill(); }
      g.restore();
      Char.draw(g, k.x, k.y - 8, 15, pl.el.id, pl.color, { headOnly: true, mood: k.done ? 'cheer' : k.boost > 0 ? 'starry' : 'determined', seed: i, look: { x: Math.cos(k.a), y: 0 } });
    });
    const order = [0, 1, 2, 3].sort((a, b) => this.score(m, S)[b] - this.score(m, S)[a]);
    order.forEach((i, k) => MGH.text(g, `${k + 1}. ${m.players[i].name}`, 1180, 90 + k * 26, 18, m.players[i].color, 'right', 'bold'));
  },
});

// ======================================================================== PEARL DIVE
MG.def({
  id: 'pearls', name: 'Pearl Dive', type: 'Arena', controls: 'Move', dur: 50,
  rows: [['pad', 'Swim']],
  how: 'Dive for pearls! Swim down to the giant clams — they open and close slowly. Touch an OPEN clam to grab its pearl (a closing clam pinches you for a moment!). Carry up to three pearls, then swim back up to the boat to bank them. Your air runs out underwater — get back to the surface before it does, or you drop everything you carry.',
  wins: 'Most pearls banked in the boat.',
  init(m, S) {
    S.d = [0, 1, 2, 3].map(i => Object.assign(MGH.body(380 + i * 170, 120, 22), { air: 1, carry: 0, bank: 0, stuck: 0 }));
    S.clams = [...Array(8)].map((_, k) => ({ x: 120 + k * 148 + R.range(-30, 30), y: R.range(480, 640), ph: R.range(0, 6), pearl: true, regrow: 0 }));
  },
  update(m, S, dt) {
    S.clams.forEach(c => { c.ph += dt * 0.9; c.regrow -= dt; if (!c.pearl && c.regrow <= 0) c.pearl = true; });
    S.d.forEach((d, i) => {
      d.stuck -= dt;
      const a = d.stuck > 0 ? { x: 0, y: 0 } : m.axis(i); MGH.steer(d, a.x, a.y, dt, 900, d.carry ? 190 : 230, 2.5);
      d.vy += (d.y > 140 ? 30 : 0) * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.x = clamp(d.x, 30, 1250); d.y = clamp(d.y, 110, 680);
      if (d.y < 150) { d.air = Math.min(1, d.air + dt * 0.8); if (d.carry && Math.abs(d.x - 640) < 170) { d.bank += d.carry; MGH.pop(`+${d.carry}`, d.x, d.y - 40, '#fff', 28); d.carry = 0; Sfx.coin(); } }
      else { d.air -= dt / 11; if (d.air <= 0) { d.air = 0; if (d.carry) { MGH.pop('Out of air!', d.x, d.y - 40, '#ff8a8a', 24); d.carry = 0; } d.vy = -300; if (!m.bot(i)) Sfx.bad(); d.air = 0.25; } }
      S.clams.forEach(c => { const open = Math.sin(c.ph) > 0.2, closing = Math.sin(c.ph) > 0 && Math.cos(c.ph) < -0.6; if (dist(d.x, d.y, c.x, c.y - 10) < 40 && c.pearl && d.carry < 3 && d.stuck <= 0) { if (open && !closing) { c.pearl = false; c.regrow = 5; d.carry++; if (!m.bot(i)) Sfx.tone(1200, 0.08, 'triangle', 0.05); } else if (closing) { d.stuck = 1; MGH.pop('PINCH!', d.x, d.y - 40, '#ff8a8a', 22); if (!m.bot(i)) Sfx.thud(); } } });
    });
    MGH.collide(S.d, 1);
  },
  bot(m, S, i) {
    const d = S.d[i];
    if (d.carry >= 3 || (d.carry > 0 && d.air < 0.45) || d.air < 0.3) { MGH.aim(m, i, 640 + (i - 1.5) * 60, 120, d); return; }
    const ready = S.clams.filter(c => c.pearl && Math.sin(c.ph + 0.8) > 0.25);
    const c = (ready.length ? ready : S.clams.filter(c => c.pearl)).reduce((best, c) => (!best || dist(d.x, d.y, c.x, c.y) < dist(d.x, d.y, best.x, best.y) ? c : best), null);
    if (!c) { MGH.aim(m, i, 640, 300, d); return; }
    const closing = Math.sin(c.ph) > 0 && Math.cos(c.ph) < -0.4;
    MGH.aim(m, i, c.x, closing && dist(d.x, d.y, c.x, c.y) < 110 ? c.y - 120 : c.y - 10, d);
  },
  score(m, S) { return S.d.map(d => d.bank); },
  fmt(s) { return `${s} pearl${s === 1 ? '' : 's'}`; },
  hud(m, S, i) { const d = S.d[i]; return `${d.bank} 🫧${d.carry ? ' +' + d.carry : ''}`; },
  draw(m, S, g) {
    g.fillStyle = MGH.grad(g, 0, 150, ['#8fd8ff', '#c8f0ff']); g.fillRect(0, 0, 1280, 150);
    g.fillStyle = MGH.grad(g, 140, 720, ['#3ab0e8', '#1a6ab8', '#0a2a6a']); g.fillRect(0, 140, 1280, 580);
    MGH.surface(g, 140, m.t);
    for (let k = 0; k < 6; k++) { g.fillStyle = 'rgba(255,255,255,0.05)'; g.beginPath(); g.moveTo(200 + k * 200 + Math.sin(m.t + k) * 30, 140); g.lineTo(150 + k * 200, 720); g.lineTo(230 + k * 200, 720); g.fill(); }
    g.fillStyle = '#c8a86a'; g.beginPath(); g.moveTo(0, 720); for (let x = 0; x <= 1280; x += 40) g.lineTo(x, 660 + Math.sin(x * 0.02) * 18); g.lineTo(1280, 720); g.fill();
    for (let k = 0; k < 10; k++) { const x = 60 + k * 130; g.strokeStyle = '#2a8a4a'; g.lineWidth = 6; g.beginPath(); g.moveTo(x, 680); for (let s = 1; s < 6; s++) g.lineTo(x + Math.sin(m.t * 1.5 + s + k) * 10, 680 - s * 22); g.stroke(); }
    // boat
    g.fillStyle = '#8a5a32'; g.beginPath(); g.moveTo(470, 110); g.lineTo(810, 110); g.lineTo(770, 150); g.lineTo(510, 150); g.closePath(); g.fill(); g.fillStyle = '#c88a4a'; g.fillRect(470, 104, 340, 10);
    g.strokeStyle = '#5a3a20'; g.lineWidth = 6; g.beginPath(); g.moveTo(640, 104); g.lineTo(640, 20); g.stroke(); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(644, 24); g.lineTo(720, 70); g.lineTo(644, 96); g.fill();
    Char.npc(g, 540, 80, 18, 'guard', { mood: 'happy', t: m.t });
    S.clams.forEach(c => { const o = Math.max(0, Math.sin(c.ph)) * 0.8; g.save(); g.translate(c.x, c.y); g.fillStyle = '#e8b8d8'; g.beginPath(); g.ellipse(0, 0, 42, 18, 0, 0, Math.PI); g.fill(); if (c.pearl) { g.fillStyle = '#fff'; g.beginPath(); g.arc(0, -6, 10, 0, 7); g.fill(); g.fillStyle = 'rgba(255,220,255,0.8)'; g.beginPath(); g.arc(-3, -9, 3, 0, 7); g.fill(); } g.rotate(-o); g.fillStyle = '#f0c8e0'; g.beginPath(); g.ellipse(36, 0, 42, 18, 0, Math.PI, 0); g.translate(36, 0); g.restore(); g.save(); g.translate(c.x - 42, c.y); g.rotate(-o); g.fillStyle = '#f4d0e8'; g.beginPath(); g.ellipse(42, 0, 42, 18, 0, Math.PI, 0); g.fill(); g.strokeStyle = 'rgba(160,80,120,0.4)'; g.lineWidth = 2; for (let q = -2; q <= 2; q++) { g.beginPath(); g.moveTo(42, 0); g.lineTo(42 + q * 14, -16); g.stroke(); } g.restore(); });
    for (let k = 0; k < 20; k++) { const ph = (m.t * 0.3 + MGH.hash(k)) % 1; g.strokeStyle = 'rgba(255,255,255,0.4)'; g.lineWidth = 1.5; g.beginPath(); g.arc(MGH.hash(k + 4) * 1280, 700 - ph * 560, 3 + k % 4, 0, 7); g.stroke(); }
    S.d.forEach((d, i) => {
      const pl = m.players[i];
      MGH.drawBody(g, d, pl, d.carry ? '⚪'.repeat(d.carry) : null, d.stuck > 0 ? 'hurt' : d.air < 0.3 ? 'scared' : 'determined');
      if (d.y > 150) { g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(d.x - 26, d.y + 40, 52, 6); g.fillStyle = d.air < 0.3 ? '#ff4a3a' : '#8fe0ff'; g.fillRect(d.x - 26, d.y + 40, 52 * d.air, 6); }
    });
  },
});
