'use strict';
// =====================================================================================================
// Two arena brawlers: BOOMERANG BASH and STORM CHASERS.
// =====================================================================================================

// ===================================================================== BOOMERANG BASH
// Throw your boomerang (A): it curves out and comes home — catch it to throw again. Raise your shield (B):
// a well-timed block STEALS the rival's boomerang, a late one just knocks it away. Stone pillars bounce them.
const BMRG22 = {
  X0: 150, X1: 1130, Y0: 190, Y1: 680,
  PIL: [{ x: 450, y: 340 }, { x: 830, y: 340 }, { x: 450, y: 540 }, { x: 830, y: 540 }],
  COR: [{ x: 230, y: 260 }, { x: 1050, y: 260 }, { x: 230, y: 610 }, { x: 1050, y: 610 }],
};
MG.def({
  id: 'boomerang', name: 'Boomerang Bash', type: 'Arena', controls: 'Move + A & B', dur: 60,
  rows: [['stick', 'Run (you throw the way you face)'], ['a', 'Throw boomerang'], ['b', 'Shield — block just in time to STEAL it']],
  how: 'A throws your boomerang — it curves out and flies home, so catch it to throw again. B raises your shield: block just as one arrives to STEAL it. Each hit scores.',
  wins: 'Most hits.',
  init(m, S) {
    S.b = BMRG22.COR.map((c, i) => Object.assign(MGH.body(c.x, c.y, 22), { pts: 0, held: 1, stun: 0, inv: 0, sh: 0, shT: 0, cd: 0, gold: false, rack: 0, face: { x: i % 2 ? -1 : 1, y: 0 } }));
    S.r = []; S.fx = []; S.gold = null; S.goldT = 12;
  },
  throwRang(m, S, i) {
    const b = S.b[i], f = b.face, l = Math.hypot(f.x, f.y) || 1, dx = f.x / l, dy = f.y / l, side = (i % 2 ? -1 : 1);
    S.r.push({ o: i, x: b.x + dx * 30, y: b.y + dy * 30 - 10, vx: dx * 700, vy: dy * 700, st: 'out', t: 0, spin: 0, w: 1.0 * side, gold: b.gold, trail: [] });
    b.held--; b.gold = false; if (!m.bot(i)) Sfx.whoosh(); else Sfx.tone(700, 0.04, 'triangle', 0.02);
  },
  update(m, S, dt) {
    // the golden boomerang power-up drops into the middle now and then
    S.goldT -= dt; if (!S.gold && S.goldT <= 0) { S.gold = { x: 640, y: 440, t: 0 }; S.goldT = 14; }
    if (S.gold) { S.gold.t += dt; const w = S.b.findIndex(b => dist(b.x, b.y, S.gold.x, S.gold.y) < 40 && b.stun <= 0); if (w >= 0) { S.b[w].gold = true; MGH.pop('GOLD!', S.gold.x, S.gold.y - 40, '#ffe680', 26); Sfx.coin(); S.gold = null; } }
    S.b.forEach((b, i) => {
      b.stun -= dt; b.inv -= dt; b.cd -= dt; b.sh = Math.max(0, b.sh - dt); b.shT += dt;
      if (b.held < 1 && !S.r.some(r => r.o === i)) { b.rack += dt; if (b.rack > 3) { b.held = 1; b.rack = 0; MGH.pop('new boomerang', b.x, b.y - 60, '#fff', 15); } } else b.rack = 0;
      const a = b.stun > 0 ? { x: 0, y: 0 } : m.axis(i);
      MGH.steer(b, a.x, a.y, dt, 2300, b.sh > 0 ? 150 : 300, 8);
      MGH.integrate(b, dt, BMRG22.X0, BMRG22.Y0 - 40, BMRG22.X1, BMRG22.Y1);
      BMRG22.PIL.forEach(P => { const d = dist(b.x, b.y, P.x, P.y), min = 34 + b.r; if (d < min) { const nx = (b.x - P.x) / (d || 1), ny = (b.y - P.y) / (d || 1); b.x = P.x + nx * min; b.y = P.y + ny * min; } });
      if (b.stun > 0) return;
      if (m.pressed(i, 'a') && b.held > 0 && b.sh <= 0) this.throwRang(m, S, i);
      if (m.pressed(i, 'b') && b.cd <= 0) { b.sh = 0.45; b.shT = 0; b.cd = 1.2; if (!m.bot(i)) Sfx.tone(520, 0.06, 'square', 0.03, 200); }
    });
    MGH.collide(S.b, 0.5);
    S.r.forEach(r => {
      r.t += dt; r.spin += dt * 22; r.trail.push({ x: r.x, y: r.y }); if (r.trail.length > 10) r.trail.shift();
      const O = S.b[r.o];
      if (r.st === 'out') { const c = Math.cos(r.w * dt), s2 = Math.sin(r.w * dt), vx = r.vx * c - r.vy * s2, vy = r.vx * s2 + r.vy * c; r.vx = vx * (1 - 0.4 * dt); r.vy = vy * (1 - 0.4 * dt); if (r.t > 0.7) r.st = 'back'; }
      else if (r.st === 'back') { const dx = O.x - r.x, dy = O.y - 10 - r.y, d = Math.hypot(dx, dy) || 1; r.vx += (dx / d * 680 - r.vx) * 3.2 * dt; r.vy += (dy / d * 680 - r.vy) * 3.2 * dt; if (d < 34 && O.stun <= 0) { r.dead = true; O.held = Math.min(2, O.held + 1); if (r.gold) O.gold = true; if (!m.bot(r.o)) Sfx.tone(880, 0.05, 'triangle', 0.04); } if (r.t > 4.5) { r.st = 'drop'; r.vx = r.vy = 0; } }
      else if (r.st === 'drop') { if (dist(O.x, O.y, r.x, r.y) < 36) { r.dead = true; O.held = Math.min(2, O.held + 1); } return; }
      r.x += r.vx * dt; r.y += r.vy * dt;
      // walls and pillars bounce it
      if (r.x < BMRG22.X0 + 10 || r.x > BMRG22.X1 - 10) { r.vx *= -1; r.x = clamp(r.x, BMRG22.X0 + 10, BMRG22.X1 - 10); S.fx.push({ k: 'spark', x: r.x, y: r.y, t: 0 }); }
      if (r.y < BMRG22.Y0 - 30 || r.y > BMRG22.Y1 - 6) { r.vy *= -1; r.y = clamp(r.y, BMRG22.Y0 - 30, BMRG22.Y1 - 6); S.fx.push({ k: 'spark', x: r.x, y: r.y, t: 0 }); }
      BMRG22.PIL.forEach(P => { const dx = r.x - P.x, dy = r.y + 10 - P.y, d = Math.hypot(dx, dy); if (d < 44) { const nx = dx / d, ny = dy / d, dot = r.vx * nx + r.vy * ny; if (dot < 0) { r.vx -= 2 * dot * nx; r.vy -= 2 * dot * ny; S.fx.push({ k: 'spark', x: r.x, y: r.y, t: 0 }); Sfx.tone(300, 0.03, 'square', 0.02); } } });
      // hitting a rival — or their shield
      S.b.forEach((b, j) => {
        if (j === r.o || r.dead || b.inv > 0 || dist(b.x, b.y - 10, r.x, r.y) > b.r + 18) return;
        const sp = Math.hypot(r.vx, r.vy) || 1, fx = b.face.x, fy = b.face.y, front = (r.vx / sp) * fx + (r.vy / sp) * fy < -0.25;
        if (b.sh > 0 && front) {
          if (b.shT < 0.16) { // a perfect block steals it
            r.o = j; r.st = 'out'; r.t = 0.3; r.vx = -r.vx * 1.05; r.vy = -r.vy * 1.05; MGH.pop('STEAL!', b.x, b.y - 70, '#9fffa0', 26); S.fx.push({ k: 'ring', x: b.x + fx * 30, y: b.y - 10 + fy * 30, t: 0, c: '#9fffa0' }); Sfx.coin();
          } else { r.vx = -r.vx * 0.8; r.vy = -r.vy * 0.8; r.st = 'back'; MGH.pop('block', b.x, b.y - 70, '#cfe8ff', 18); S.fx.push({ k: 'ring', x: b.x + fx * 30, y: b.y - 10 + fy * 30, t: 0, c: '#cfe8ff' }); Sfx.tone(420, 0.05, 'square', 0.03); }
          return;
        }
        const v = r.gold ? 2 : 1; S.b[r.o].pts += v; b.stun = 1.1; b.inv = 1.6; b.vx += r.vx * 0.4; b.vy += r.vy * 0.4; r.st = 'back'; r.gold = false;
        MGH.pop(`+${v}`, S.b[r.o].x, S.b[r.o].y - 70, m.players[r.o].color, 26); MGH.burst(b.x, b.y - 20, ['#fff', '#ffe680', m.players[r.o].color], 16, { speed: 260 }); MGH.shake(4); Sfx.thud();
      });
    });
    S.r = S.r.filter(r => !r.dead);
    S.fx.forEach(f => { f.t += dt; }); S.fx = S.fx.filter(f => f.t < 0.5);
  },
  bot(m, S, i) {
    const b = S.b[i], v = m.vin[i]; v.a = false; v.b = false; v.ax = v.ay = 0; if (b.stun > 0) return;
    const tap = k => { if (!m.prev[i][k]) v[k] = true; };
    // block an incoming boomerang
    const inc = S.r.find(r => r.o !== i && r.st !== 'drop' && dist(r.x, r.y, b.x, b.y) < 130 && ((b.x - r.x) * r.vx + (b.y - r.y) * r.vy) > 0);
    if (inc && b.cd <= 0) { const d = dist(r => 0, 0, 0, 0); b.face = { x: (inc.x - b.x), y: (inc.y - b.y) }; const l = Math.hypot(b.face.x, b.face.y) || 1; b.face.x /= l; b.face.y /= l; if (Math.random() < 0.3) tap('b'); return; }
    // pick up a dropped boomerang or the gold one
    const mine = S.r.find(r => r.o === i && r.st === 'drop'); if (mine) { MGH.aim(m, i, mine.x, mine.y, b, 10); return; }
    if (S.gold && dist(S.gold.x, S.gold.y, b.x, b.y) < 320) { MGH.aim(m, i, S.gold.x, S.gold.y, b, 8); return; }
    const tgt = S.b.map((o, j) => ({ o, j })).filter(q => q.j !== i && q.o.inv <= 0).sort((p, q) => dist(p.o.x, p.o.y, b.x, b.y) - dist(q.o.x, q.o.y, b.x, b.y))[0];
    if (!tgt) return; const T = tgt.o, d = dist(T.x, T.y, b.x, b.y);
    if (b.held > 0) { if (d > 300) MGH.aim(m, i, T.x, T.y, b, 20); else { const dx = T.x - b.x, dy = T.y - b.y; v.ax = dx / d * 0.25; v.ay = dy / d * 0.25; const fd = (b.face.x * dx + b.face.y * dy) / d; if (fd > 0.9 && Math.random() < 0.2) tap('a'); } }
    else { const away = { x: b.x - (T.x - b.x) * 0.5, y: b.y - (T.y - b.y) * 0.5 }; MGH.aim(m, i, clamp(away.x, 220, 1060), clamp(away.y, 240, 640), b, 30); }
  },
  score(m, S) { return S.b.map(b => b.pts); },
  fmt(s) { return `${s} hit${s === 1 ? '' : 's'}`; },
  hud(m, S, i) { const b = S.b[i]; return `🪃×${b.held}${b.gold ? '✨' : ''} · ${b.pts}`; },
  // a classic V-shaped boomerang: two rounded wooden arms, an ink outline, painted bands and a shine
  rang(g, x, y, a, col, gold, s = 1, alpha = 1) {
    g.save(); g.translate(x, y); g.rotate(a); g.scale(s, s); g.globalAlpha *= alpha;
    if (gold) MGH.glow(g, 0, 0, 32, 'rgba(255,220,80,0.55)');
    const E = { x: 0, y: 9 }, A = { x: -19, y: -8 }, B = { x: 19, y: -8 };
    const arms = () => { g.beginPath(); g.moveTo(A.x, A.y); g.lineTo(E.x, E.y); g.lineTo(B.x, B.y); };
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.strokeStyle = gold ? '#7a5008' : '#4a2a10'; g.lineWidth = 13; arms(); g.stroke();
    const wg = g.createLinearGradient(0, -12, 0, 12); wg.addColorStop(0, gold ? '#fff4b0' : '#f0c890'); wg.addColorStop(0.5, gold ? '#ffd34d' : '#d8a060'); wg.addColorStop(1, gold ? '#c88a10' : '#a8703a'); g.strokeStyle = wg; g.lineWidth = 9; arms(); g.stroke();
    // painted bands near each tip in the owner's colour
    g.strokeStyle = col; g.lineWidth = 9; g.lineCap = 'butt';
    for (const T of [A, B]) { g.beginPath(); g.moveTo(E.x + (T.x - E.x) * 0.55, E.y + (T.y - E.y) * 0.55); g.lineTo(E.x + (T.x - E.x) * 0.72, E.y + (T.y - E.y) * 0.72); g.stroke(); }
    g.lineCap = 'round';
    // wood grain and a shine along the top edge
    g.strokeStyle = 'rgba(90,50,20,0.35)'; g.lineWidth = 1; arms(); g.stroke();
    g.strokeStyle = 'rgba(255,250,230,0.75)'; g.lineWidth = 2; g.beginPath(); g.moveTo(A.x + 2, A.y - 2.5); g.lineTo(E.x, E.y - 3.5); g.lineTo(B.x - 2, B.y - 2.5); g.stroke();
    g.restore();
  },
  draw(m, S, g) {
    const t = m.t;
    GX.blit(g, GX.bake('boomerang_arena', b => {
      GX.vfill(b, 0, 0, 1280, 720, ['#ffb070', '#ff8a5a', '#7a3a5a']);
      for (const [y, c, amp] of [[180, '#c8605a', 50], [200, '#a8485a', 35]]) { b.fillStyle = c; b.beginPath(); b.moveTo(0, 230); for (let x = 0; x <= 1280; x += 20) b.lineTo(x, y - Math.abs(Math.sin(x * 0.008 + y)) * amp); b.lineTo(1280, 230); b.fill(); }
      const sg = b.createLinearGradient(0, 160, 0, 720); sg.addColorStop(0, '#e8c890'); sg.addColorStop(1, '#c89a60'); b.fillStyle = sg; b.fillRect(0, 160, 1280, 560);
      for (let y = 170; y < 720; y += 40) for (let x = ((y / 40) % 2) * 40 - 40; x < 1280; x += 80) { b.fillStyle = `rgba(${MGH.hash(x + y) > 0.5 ? '255,255,255' : '120,70,30'},0.06)`; b.fillRect(x + 2, y + 2, 76, 36); b.fillStyle = 'rgba(110,70,30,0.15)'; b.fillRect(x, y, 80, 2); b.fillRect(x, y, 2, 40); }
      b.strokeStyle = 'rgba(140,60,40,0.5)'; b.lineWidth = 6; b.beginPath(); b.ellipse(640, 440, 300, 180, 0, 0, 7); b.stroke(); b.lineWidth = 3; b.beginPath(); b.ellipse(640, 440, 120, 72, 0, 0, 7); b.stroke();
      b.fillStyle = 'rgba(140,60,40,0.3)'; MGH.star(b, 640, 440, 40, 'rgba(160,70,40,0.35)', 0, false);
      b.strokeStyle = '#7a4a2a'; b.lineWidth = 10; b.strokeRect(BMRG22.X0 - 6, BMRG22.Y0 - 46, BMRG22.X1 - BMRG22.X0 + 12, BMRG22.Y1 - BMRG22.Y0 + 52);
      for (let x = BMRG22.X0; x <= BMRG22.X1; x += 70) { b.fillStyle = ['#e8323e', '#ffd34d', '#2a8ae8', '#3ac85a'][(x / 70 | 0) % 4]; b.beginPath(); b.moveTo(x, 150); b.lineTo(x + 30, 150); b.lineTo(x + 15, 172); b.fill(); }
      b.strokeStyle = '#5a3a1a'; b.lineWidth = 2; b.beginPath(); b.moveTo(BMRG22.X0 - 10, 150); b.lineTo(BMRG22.X1 + 10, 150); b.stroke();
    }));
    // player corners: a little rack in your colour
    BMRG22.COR.forEach((c, i) => { g.fillStyle = m.players[i].color + '44'; g.beginPath(); g.ellipse(c.x, c.y + 26, 50, 18, 0, 0, 7); g.fill(); });
    if (S.gold) { const bob = Math.sin(t * 4) * 6; MGH.glow(g, S.gold.x, S.gold.y - 30 + bob, 46, 'rgba(255,220,80,0.6)'); this.rang(g, S.gold.x, S.gold.y - 30 + bob, t * 3, '#fff', true, 1.4); }
    // trails under everything
    S.r.forEach(r => { if (r.st === 'drop') return; r.trail.forEach((p, k) => { if (k % 3) return; this.rang(g, p.x, p.y, r.spin - (r.trail.length - k) * 0.35, m.players[r.o].color, r.gold, 1.1, 0.06 + k * 0.025); }); });
    const ents = [];
    BMRG22.PIL.forEach(P => ents.push({ y: P.y, f: () => { GX.shadow(g, P.x + 8, P.y + 6, 44, 0.35); const pg = g.createLinearGradient(P.x - 34, 0, P.x + 34, 0); pg.addColorStop(0, '#8a7a6a'); pg.addColorStop(0.45, '#d8c8b0'); pg.addColorStop(1, '#6a5a4a'); g.fillStyle = pg; g.fillRect(P.x - 30, P.y - 90, 60, 90); g.fillStyle = '#e8dcc8'; g.beginPath(); g.ellipse(P.x, P.y - 90, 34, 12, 0, 0, 7); g.fill(); g.fillStyle = '#b8a890'; g.beginPath(); g.ellipse(P.x, P.y, 32, 10, 0, 0, Math.PI); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.15)'; g.lineWidth = 2; for (let q = -18; q <= 18; q += 12) { g.beginPath(); g.moveTo(P.x + q, P.y - 84); g.lineTo(P.x + q, P.y - 4); g.stroke(); } g.fillStyle = '#5ab83a'; g.beginPath(); g.ellipse(P.x - 10, P.y - 92, 14, 5, -0.2, 0, 7); g.fill(); } }));
    S.b.forEach((b, i) => ents.push({ y: b.y, f: () => {
      if (b.inv > 0 && b.stun <= 0 && Math.floor(t * 12) % 2) g.globalAlpha = 0.5;
      MGH.drawBody(g, b, m.players[i], '', b.stun > 0 ? 'dizzy' : b.sh > 0 ? 'determined' : undefined); g.globalAlpha = 1;
      if (b.stun > 0) for (let q = 0; q < 3; q++) { const a = t * 6 + q * 2.1; MGH.star(g, b.x + Math.cos(a) * 22, b.y - 72 + Math.sin(a) * 6, 6, '#ffe680', a, false); }
      // boomerangs in hand
      { const sd = b.face.x < -0.25 ? -1 : 1; for (let k = 0; k < b.held; k++) this.rang(g, b.x + sd * (26 - k * 40), b.y - 18 - k * 14, sd * (0.9 + k * 0.6) + Math.sin(t * 3 + k) * 0.08, m.players[i].color, b.gold && k === 0, 0.75 - k * 0.1); }
      if (b.rack > 0) { g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 3; g.beginPath(); g.arc(b.x, b.y - 80, 9, -Math.PI / 2, -Math.PI / 2 + b.rack / 3 * Math.PI * 2); g.stroke(); }
      // shield: a glowing round shield held out front
      if (b.sh > 0) { const fx = b.face.x, fy = b.face.y, sx = b.x + fx * 30, sy = b.y - 20 + fy * 16, perfect = b.shT < 0.16, col = m.players[i].color, sq = 0.55 + 0.45 * Math.abs(fy);
        MGH.glow(g, sx, sy, 44, perfect ? 'rgba(160,255,160,0.55)' : 'rgba(190,220,255,0.35)');
        g.save(); g.translate(sx, sy); g.scale(sq, 1);
        g.fillStyle = '#6a4a2a'; g.beginPath(); g.arc(0, 0, 24, 0, 7); g.fill();
        const sg = g.createRadialGradient(-7, -8, 2, 0, 0, 22); sg.addColorStop(0, '#ffffff'); sg.addColorStop(0.35, col); sg.addColorStop(1, Char.shade(col, -0.45)); g.fillStyle = sg; g.beginPath(); g.arc(0, 0, 20, 0, 7); g.fill();
        g.strokeStyle = '#ffd34d'; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, 20, 0, 7); g.stroke();
        const bg = g.createRadialGradient(-2, -2, 1, 0, 0, 7); bg.addColorStop(0, '#fff6c0'); bg.addColorStop(1, '#c8901a'); g.fillStyle = bg; g.beginPath(); g.arc(0, 0, 6, 0, 7); g.fill();
        for (let q = 0; q < 6; q++) { const a2 = q / 6 * 6.28; g.fillStyle = '#e8d0a0'; g.beginPath(); g.arc(Math.cos(a2) * 14, Math.sin(a2) * 14, 1.6, 0, 7); g.fill(); }
        g.restore(); }
    } }));
    S.r.forEach(r => ents.push({ y: r.y + 30, f: () => { if (r.st === 'drop') { GX.shadow(g, r.x, r.y + 18, 18, 0.3); this.rang(g, r.x, r.y + 10, 0.4, m.players[r.o].color, r.gold, 1); MGH.text(g, '!', r.x, r.y - 14 + Math.sin(t * 6) * 3, 16, m.players[r.o].color, 'center', 'bold'); return; } g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(r.x, r.y + 34, 14, 5, 0, 0, 7); g.fill(); this.rang(g, r.x, r.y, r.spin, m.players[r.o].color, r.gold, 1.15); } }));
    ents.sort((a, b) => a.y - b.y).forEach(e => e.f());
    S.fx.forEach(f => { const k = f.t / 0.5; if (f.k === 'spark') for (let q = 0; q < 6; q++) { const a = q / 6 * 6.28; g.fillStyle = `rgba(255,230,150,${1 - k})`; g.beginPath(); g.arc(f.x + Math.cos(a) * k * 26, f.y + Math.sin(a) * k * 26, 3, 0, 7); g.fill(); } else { g.strokeStyle = f.c; g.globalAlpha = 1 - k; g.lineWidth = 4; g.beginPath(); g.arc(f.x, f.y, 10 + k * 40, 0, 7); g.stroke(); g.globalAlpha = 1; } });
    S.b.forEach((b, i) => MGH.text(g, `${m.players[i].name} ${b.pts}`, BMRG22.COR[i].x, BMRG22.COR[i].y + 56, 15, m.players[i].color, 'center', 'bold'));
  },
});

// ===================================================================== STORM CHASERS
// Storm clouds drift over the farm and charge up. Plant your lightning rod (A) under one: when it strikes,
// the rod nearest the middle of the storm takes the bolt and scores. Anyone caught under a storm with no
// rod in it gets zapped. B is a shoulder-barge: knock rivals about — or knock their rods flat.
const STRM22 = { X0: 110, X1: 1170, Y0: 300, Y1: 690 };
MG.def({
  id: 'storm', name: 'Storm Chasers', type: 'Arena', controls: 'Move + A & B', dur: 70,
  rows: [['stick', 'Run'], ['a', 'Plant / pick up your lightning rod'], ['b', 'Barge (knocks rivals and their rods over)']],
  how: 'Plant your lightning rod (A) under a charging storm — the rod closest to its middle takes the bolt and scores 3 (gold storms 5). Get caught under a storm with no rod and you are zapped. B barges rivals and knocks their rods flat.',
  wins: 'Most lightning caught.',
  init(m, S) {
    S.b = [0, 1, 2, 3].map(i => Object.assign(MGH.body(260 + i * 250, 520, 22), { pts: 0, stun: 0, inv: 0, dash: 0, cd: 0, rod: { up: false, down: false, x: 0, y: 0, glow: 0 } }));
    S.c = []; S.spawn = 0.5; S.bolts = []; S.scorch = []; S.flash = 0; S.n = 0;
  },
  cloud(S) { S.n++; const r = R.range(95, 130), gold = S.n % 5 === 0; S.c.push({ x: R.range(STRM22.X0 + r * 0.6, STRM22.X1 - r * 0.6), y: R.range(STRM22.Y0 + 40, STRM22.Y1 - 40), r, vx: R.range(-28, 28), vy: R.range(-12, 12), t: 0, T: R.range(4.2, 6), gold }); },
  update(m, S, dt) {
    S.flash = Math.max(0, S.flash - dt * 3);
    S.spawn -= dt; if (S.spawn <= 0 && S.c.length < 3) { this.cloud(S); S.spawn = R.range(2.0, 3.2); }
    S.b.forEach((b, i) => {
      b.stun -= dt; b.inv -= dt; b.cd -= dt; b.dash = Math.max(0, b.dash - dt); b.rod.glow = Math.max(0, b.rod.glow - dt);
      const a = b.stun > 0 ? { x: 0, y: 0 } : m.axis(i);
      if (b.dash > 0) { b.vx = b.face.x * 620; b.vy = b.face.y * 620; } else MGH.steer(b, a.x, a.y, dt, 2300, 300, 8);
      MGH.integrate(b, dt, STRM22.X0, STRM22.Y0 - 30, STRM22.X1, STRM22.Y1);
      if (b.stun > 0) return;
      if (m.pressed(i, 'a')) {
        if (!b.rod.up) { b.rod = { up: true, down: false, x: b.x + b.face.x * 18, y: b.y + 22, glow: 0 }; if (!m.bot(i)) Sfx.thud(); }
        else if (dist(b.x, b.y + 22, b.rod.x, b.rod.y) < 56) { b.rod.up = false; b.rod.down = false; if (!m.bot(i)) Sfx.pop(); }
        else if (!m.bot(i)) { MGH.pop('too far from your rod', b.x, b.y - 70, '#fff', 14); }
      }
      if (m.pressed(i, 'b') && b.cd <= 0) { b.dash = 0.18; b.cd = 1.1; if (!m.bot(i)) Sfx.whoosh(); }
      if (b.dash > 0) {
        S.b.forEach((o, j) => { if (j !== i && o.inv <= 0 && dist(o.x, o.y, b.x, b.y) < 48) { o.vx += b.face.x * 520; o.vy += b.face.y * 520; o.stun = 0.6; o.inv = 0.9; b.dash = 0; MGH.burst(o.x, o.y - 20, ['#fff', '#ffe680'], 10, { speed: 200 }); Sfx.thud(); } });
        S.b.forEach((o, j) => { if (j !== i && o.rod.up && !o.rod.down && dist(o.rod.x, o.rod.y, b.x, b.y + 22) < 40) { o.rod.down = true; MGH.pop('rod knocked!', o.rod.x, o.rod.y - 60, '#ff9a8a', 16); Sfx.tone(260, 0.1, 'square', 0.04, -100); } });
      }
    });
    MGH.collide(S.b, 0.6);
    // storms drift, charge, then strike
    S.c.forEach(c => {
      c.t += dt; c.x += c.vx * dt; c.y += c.vy * dt;
      if (c.x < STRM22.X0 + c.r * 0.5 || c.x > STRM22.X1 - c.r * 0.5) c.vx *= -1; if (c.y < STRM22.Y0 + 20 || c.y > STRM22.Y1 - 20) c.vy *= -1;
      if (c.t < c.T) { if (c.T - c.t < 1 && !c.rumble) { c.rumble = true; Sfx.tone(90, 0.6, 'sawtooth', 0.04, -20); } return; }
      c.done = true; S.flash = 1; Sfx.thunder ? Sfx.thunder() : Sfx.boom();
      const rods = S.b.map((b, i) => ({ b, i })).filter(q => q.b.rod.up && !q.b.rod.down && dist(q.b.rod.x, q.b.rod.y, c.x, c.y) < c.r).sort((p, q) => dist(p.b.rod.x, p.b.rod.y, c.x, c.y) - dist(q.b.rod.x, q.b.rod.y, c.x, c.y));
      if (rods.length) { const w = rods[0], v = c.gold ? 5 : 3; w.b.pts += v; w.b.rod.glow = 1.2; S.bolts.push({ x: w.b.rod.x, y: w.b.rod.y - 70, t: 0, col: c.gold ? '#ffe680' : '#cfe8ff', seed: Math.random() * 100 }); MGH.pop(`+${v} ⚡`, w.b.rod.x, w.b.rod.y - 110, m.players[w.i].color, 30); MGH.burst(w.b.rod.x, w.b.rod.y - 70, ['#fff', '#cfe8ff', '#ffe680'], 18, { speed: 280 }); }
      else { S.bolts.push({ x: c.x, y: c.y, t: 0, col: '#cfe8ff', seed: Math.random() * 100 }); S.scorch.push({ x: c.x, y: c.y, t: 0 });
        S.b.forEach((b, i) => { if (b.inv <= 0 && dist(b.x, b.y + 22, c.x, c.y) < c.r) { b.pts = Math.max(0, b.pts - 1); b.stun = 1.2; b.inv = 1.5; MGH.pop('ZAP! −1', b.x, b.y - 80, '#ff8a8a', 24); MGH.burst(b.x, b.y - 20, ['#cfe8ff', '#fff'], 14, { speed: 240 }); } }); }
      MGH.shake(6);
    });
    S.c = S.c.filter(c => !c.done);
    S.bolts.forEach(b => { b.t += dt; }); S.bolts = S.bolts.filter(b => b.t < 0.45);
    S.scorch.forEach(s => { s.t += dt; }); S.scorch = S.scorch.filter(s => s.t < 6);
  },
  bot(m, S, i) {
    const b = S.b[i], v = m.vin[i]; v.a = false; v.b = false; v.ax = v.ay = 0; if (b.stun > 0) return;
    const tap = k => { if (!m.prev[i][k]) v[k] = true; };
    // the most promising storm: charging, and not already won by a rod nearer its middle
    const score = c => { const left = c.T - c.t, px = c.x + c.vx * left, py = c.y + c.vy * left, best = Math.min(...S.b.filter((o, j) => j !== i && o.rod.up && !o.rod.down).map(o => dist(o.rod.x, o.rod.y, px, py)), 999); return { c, px, py, left, s: (c.gold ? 2 : 1) * (best > 50 ? 1 : 0.3) - dist(px, py, b.x, b.y) / 900 - (left < 1 ? 1 : 0) }; };
    const pick = S.c.map(score).sort((p, q) => q.s - p.s)[0];
    // a planted rod already in a good spot: wait nearby but out of the storm
    if (b.rod.up && !b.rod.down) {
      const cover = S.c.find(c => dist(c.x + c.vx * (c.T - c.t), c.y + c.vy * (c.T - c.t), b.rod.x, b.rod.y) < c.r * 0.6);
      if (cover) { const out = { x: b.rod.x + (b.rod.x < 640 ? -1 : 1) * 40, y: b.rod.y - 10 }; const danger = S.c.some(c => c !== cover && c.T - c.t < 1.2 && dist(c.x, c.y, b.x, b.y + 22) < c.r); if (danger) MGH.aim(m, i, out.x, out.y + 120, b, 10); else MGH.aim(m, i, out.x, out.y - 22, b, 12);
        // barge a rival rod that is stealing our storm
        const thief = S.b.findIndex((o, j) => j !== i && o.rod.up && !o.rod.down && dist(o.rod.x, o.rod.y, cover.x, cover.y) < dist(b.rod.x, b.rod.y, cover.x, cover.y) && dist(o.rod.x, o.rod.y, b.x, b.y + 22) < 160);
        if (thief >= 0) { const R2 = S.b[thief].rod; MGH.aim(m, i, R2.x, R2.y - 22, b, 4); if (dist(R2.x, R2.y, b.x, b.y + 22) < 90 && b.cd <= 0) tap('b'); }
        return; }
      // no storm over it: go and pick it up
      MGH.aim(m, i, b.rod.x, b.rod.y - 22, b, 8); if (dist(b.rod.x, b.rod.y, b.x, b.y + 22) < 50) tap('a'); return;
    }
    if (b.rod.up && b.rod.down) { MGH.aim(m, i, b.rod.x, b.rod.y - 22, b, 8); if (dist(b.rod.x, b.rod.y, b.x, b.y + 22) < 50) tap('a'); return; }
    if (!pick) { MGH.aim(m, i, 640, 480, b, 40); return; }
    MGH.aim(m, i, pick.px, pick.py - 22, b, 10);
    if (dist(pick.px, pick.py, b.x, b.y + 22) < 40 + Math.random() * 20) tap('a');
  },
  score(m, S) { return S.b.map(b => b.pts); },
  fmt(s) { return `${s} ⚡`; },
  hud(m, S, i) { const r = S.b[i].rod; return `⚡ ${S.b[i].pts}${r.up ? (r.down ? ' · rod down!' : ' · rod planted') : ''}`; },
  rodArt(g, x, y, col, down, glow, t) {
    g.save(); g.translate(x, y); if (down) g.rotate(1.35);
    g.fillStyle = 'rgba(0,0,0,0.25)'; if (!down) { g.beginPath(); g.ellipse(6, 2, 14, 4, 0, 0, 7); g.fill(); }
    const pg = g.createLinearGradient(-3, 0, 3, 0); pg.addColorStop(0, '#9aa0b0'); pg.addColorStop(0.5, '#e8ecf4'); pg.addColorStop(1, '#6a7080'); g.fillStyle = pg; g.fillRect(-3, -72, 6, 72);
    g.fillStyle = '#d8843a'; g.beginPath(); g.moveTo(-5, -72); g.lineTo(0, -92); g.lineTo(5, -72); g.fill();
    g.fillStyle = col; g.beginPath(); g.moveTo(3, -66); g.lineTo(26 + Math.sin(t * 6) * 3, -60); g.lineTo(3, -52); g.fill();
    g.fillStyle = '#5a5a6a'; g.fillRect(-9, -4, 18, 6);
    if (glow > 0) { MGH.glow(g, 0, -60, 50 * glow, `rgba(200,230,255,${0.7 * glow})`); for (let q = 0; q < 4; q++) { const a = t * 20 + q * 1.6; g.strokeStyle = `rgba(220,240,255,${glow})`; g.lineWidth = 2; g.beginPath(); g.moveTo(0, -80); g.lineTo(Math.cos(a) * 18, -80 + Math.sin(a) * 18); g.stroke(); } }
    g.restore();
  },
  draw(m, S, g) {
    const t = m.t;
    GX.blit(g, GX.bake('storm_farm', b => {
      GX.vfill(b, 0, 0, 1280, 300, ['#2a3048', '#4a5068', '#6a7088']);
      for (const [y, c] of [[250, '#3a5a3a'], [272, '#4a6a3a']]) { b.fillStyle = c; b.beginPath(); b.moveTo(0, 300); for (let x = 0; x <= 1280; x += 20) b.lineTo(x, y - Math.abs(Math.sin(x * 0.006 + y)) * 40); b.lineTo(1280, 300); b.fill(); }
      b.fillStyle = '#8a3a2a'; b.fillRect(1040, 200, 90, 70); b.fillStyle = '#5a2418'; b.beginPath(); b.moveTo(1030, 202); b.lineTo(1085, 160); b.lineTo(1140, 202); b.fill(); b.fillStyle = '#f4e8d0'; b.fillRect(1070, 230, 30, 40);
      b.fillStyle = '#9a9aa8'; b.fillRect(150, 190, 34, 80); b.fillStyle = '#7a7a88'; b.beginPath(); b.ellipse(167, 190, 17, 8, 0, 0, 7); b.fill();
      const gg = b.createLinearGradient(0, 280, 0, 720); gg.addColorStop(0, '#5a7a3a'); gg.addColorStop(1, '#3a5a2a'); b.fillStyle = gg; b.fillRect(0, 280, 1280, 440);
      for (let r = 0; r < 12; r++) { b.fillStyle = r % 2 ? 'rgba(255,240,180,0.05)' : 'rgba(0,0,0,0.05)'; b.fillRect(0, 300 + r * 36, 1280, 36); }
      for (let k = 0; k < 360; k++) { const x = MGH.hash(k * 3.1) * 1280, y = 300 + MGH.hash(k * 7.3) * 420; b.strokeStyle = MGH.hash(k) > 0.5 ? 'rgba(40,70,30,0.6)' : 'rgba(140,170,90,0.5)'; b.lineWidth = 2; b.beginPath(); b.moveTo(x, y); b.lineTo(x + (MGH.hash(k + 1) - 0.5) * 6, y - 8); b.stroke(); }
      b.strokeStyle = '#7a5a3a'; b.lineWidth = 5; b.beginPath(); b.moveTo(STRM22.X0 - 20, 300); b.lineTo(STRM22.X1 + 20, 300); b.stroke(); for (let x = STRM22.X0 - 20; x <= STRM22.X1 + 20; x += 70) { b.fillStyle = '#6a4a2a'; b.fillRect(x - 4, 284, 8, 24); }
      for (let k = 0; k < 8; k++) { const x = 60 + MGH.hash(k + 40) * 1160, y = 330 + MGH.hash(k + 41) * 350; b.fillStyle = '#e8c040'; for (let q = 0; q < 5; q++) { b.beginPath(); b.arc(x + Math.cos(q) * 8, y + Math.sin(q) * 5, 3, 0, 7); b.fill(); } }
    }));
    S.scorch.forEach(s => { const a = Math.max(0, 1 - s.t / 6); g.fillStyle = `rgba(30,20,10,${0.5 * a})`; g.beginPath(); g.ellipse(s.x, s.y, 40, 16, 0, 0, 7); g.fill(); });
    // storm shadows on the ground: darker and tighter as they charge
    S.c.forEach(c => { const k = c.t / c.T, warn = c.T - c.t < 1; g.fillStyle = `rgba(10,10,40,${0.18 + k * 0.32})`; g.beginPath(); g.ellipse(c.x, c.y, c.r, c.r * 0.45, 0, 0, 7); g.fill();
      g.strokeStyle = warn && Math.floor(t * 10) % 2 ? (c.gold ? '#ffe680' : '#ffffff') : c.gold ? 'rgba(255,220,100,0.6)' : 'rgba(200,220,255,0.45)'; g.lineWidth = 3; g.setLineDash([10, 8]); g.beginPath(); g.ellipse(c.x, c.y, c.r, c.r * 0.45, 0, 0, 7); g.stroke(); g.setLineDash([]);
      g.fillStyle = 'rgba(255,255,255,0.25)'; g.beginPath(); g.arc(c.x, c.y, 4, 0, 7); g.fill(); });
    const ents = [];
    S.b.forEach((b, i) => { if (b.rod.up) ents.push({ y: b.rod.y, f: () => this.rodArt(g, b.rod.x, b.rod.y, m.players[i].color, b.rod.down, b.rod.glow, t) }); });
    S.b.forEach((b, i) => ents.push({ y: b.y + 22, f: () => { if (b.inv > 0 && b.stun <= 0 && Math.floor(t * 12) % 2) g.globalAlpha = 0.55; MGH.drawBody(g, b, m.players[i], '', b.stun > 0 ? 'dizzy' : undefined); g.globalAlpha = 1;
      if (!b.rod.up) { g.save(); g.translate(b.x + (b.face.x < 0 ? -26 : 26), b.y + 6); g.scale(0.6, 0.6); this.rodArt(g, 0, 0, m.players[i].color, false, 0, t); g.restore(); }
      if (b.stun > 0) for (let q = 0; q < 3; q++) { const a = t * 6 + q * 2.1; MGH.star(g, b.x + Math.cos(a) * 22, b.y - 72 + Math.sin(a) * 6, 6, '#cfe8ff', a, false); }
      if (b.dash > 0) for (let q = 1; q < 4; q++) { g.fillStyle = `rgba(255,255,255,${0.3 - q * 0.08})`; g.beginPath(); g.arc(b.x - b.face.x * q * 18, b.y - b.face.y * q * 18, 20, 0, 7); g.fill(); } } }));
    ents.sort((a, b) => a.y - b.y).forEach(e => e.f());
    // the clouds themselves, floating above their shadows
    S.c.forEach(c => { const k = c.t / c.T, cy = c.y - 190, dark = 0.35 + k * 0.4;
      for (let q = 0; q < 7; q++) { const a = q / 7 * 6.28, x = c.x + Math.cos(a) * c.r * 0.55, y = cy + Math.sin(a) * c.r * 0.18; const cg = g.createRadialGradient(x - 10, y - 14, 4, x, y, c.r * 0.5); cg.addColorStop(0, c.gold ? `rgba(255,240,180,${0.95})` : `rgba(${200 - dark * 120},${205 - dark * 120},${225 - dark * 110},0.95)`); cg.addColorStop(1, c.gold ? 'rgba(200,150,40,0.85)' : `rgba(${70 - dark * 40},${74 - dark * 40},${100 - dark * 40},0.9)`); g.fillStyle = cg; g.beginPath(); g.arc(x, y, c.r * 0.45, 0, 7); g.fill(); }
      if (c.T - c.t < 1.2) for (let q = 0; q < 3; q++) if (Math.sin(t * 30 + q * 2) > 0.5) { g.strokeStyle = c.gold ? '#fff2a0' : '#e8f4ff'; g.lineWidth = 2; g.beginPath(); let x = c.x + (q - 1) * 30, y = cy + 10; g.moveTo(x, y); for (let s = 0; s < 3; s++) { x += R.range(-10, 10); y += 10; g.lineTo(x, y); } g.stroke(); }
      if (k > 0.25 && !c.gold) { g.strokeStyle = `rgba(190,210,240,${0.25 + k * 0.3})`; g.lineWidth = 1.5; g.beginPath(); for (let q = 0; q < 26; q++) { const rx = c.x + (MGH.hash(q + c.r) - 0.5) * c.r * 1.6, ph = (t * 1.6 + MGH.hash(q * 3 + c.r)) % 1, top = cy + 20, bot = c.y + (MGH.hash(q + 7) - 0.5) * c.r * 0.6, y1 = top + (bot - top) * ph; g.moveTo(rx, y1); g.lineTo(rx - 3, y1 + 16); } g.stroke(); }
      const left = Math.max(0, c.T - c.t); g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.arc(c.x, cy - c.r * 0.35, 14, 0, 7); g.fill(); g.strokeStyle = c.gold ? '#ffe680' : '#ffffff'; g.lineWidth = 3; g.beginPath(); g.arc(c.x, cy - c.r * 0.35, 12, -Math.PI / 2, -Math.PI / 2 + (1 - left / c.T) * Math.PI * 2); g.stroke(); });
    // bolts
    S.bolts.forEach(bo => { const a = 1 - bo.t / 0.45; g.save(); g.globalAlpha = a; g.strokeStyle = bo.col; g.lineWidth = 8; g.shadowColor = bo.col; g.shadowBlur = 20; g.beginPath(); let x = bo.x, y = bo.y - 260; g.moveTo(x, y); let s = bo.seed; for (let q = 0; q < 8; q++) { s = (s * 9301 + 49297) % 233280; x = bo.x + (s / 233280 - 0.5) * 50 * (1 - q / 8); y += 260 / 8; g.lineTo(x, y); } g.stroke(); g.strokeStyle = '#fff'; g.lineWidth = 3; g.stroke(); g.restore(); });
    if (S.flash > 0) { g.fillStyle = `rgba(230,240,255,${S.flash * 0.35})`; g.fillRect(0, 0, 1280, 720); }
  },
});
