'use strict';
// CLOCKWORK DUEL — a one-on-one brawl inside a giant clock tower.
//   Two gondolas ride round on the tips of the clock hands (stand on them and they carry you).
//   Every 18 s the great bell tolls and the tower does something new:
//     🔔 PENDULUM   the huge brass pendulum swings low across the stage — get caught and you're launched;
//     ⚙️ GEAR FLOOR the cog-floor spins, sliding everyone toward an edge (it reverses each time);
//     ⏩ CLOCK RUSH the hands race round three times faster — the gondolas become a wild ride.
(() => {
  const CX = 800, CY = 300, RAD = 210, GW = 170, PIV = { x: 800, y: 20 }, PLEN = 540;
  const EVENTS = ['pendulum', 'gears', 'rush'];
  const EVN = { pendulum: '🔔 THE PENDULUM SWINGS!', gears: '⚙️ THE GEAR FLOOR SPINS!', rush: '⏩ CLOCK RUSH!' };
  const gear = (g, x, y, r, teeth, a, col, hole) => {
    g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = col; g.beginPath();
    for (let k = 0; k < teeth * 2; k++) { const ang = k / (teeth * 2) * Math.PI * 2, rr = k % 2 ? r : r * 0.84; g.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr); }
    g.closePath(); g.fill(); g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.arc(0, 0, r * 0.62, 0, 7); g.fill(); g.fillStyle = col; g.beginPath(); g.arc(0, 0, r * 0.5, 0, 7); g.fill();
    for (let k = 0; k < 5; k++) { const ang = k / 5 * Math.PI * 2; g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.arc(Math.cos(ang) * r * 0.32, Math.sin(ang) * r * 0.32, r * 0.09, 0, 7); g.fill(); }
    g.fillStyle = hole || '#2a1a10'; g.beginPath(); g.arc(0, 0, r * 0.12, 0, 7); g.fill(); g.restore();
  };

  BrawlArena({
    id: 'clockduel', name: 'Clockwork Duel',
    how: 'A ONE-ON-ONE brawl inside a giant clock tower! Move, A = jump (again in the air), B = your power: TAP to strike, HOLD and release for a charged shot, UP+B to recover, DOWN+B to slam. Two gondolas ride round on the clock hands — hop on and they carry you. Every time the great bell tolls, the tower changes: the PENDULUM swings low across the stage, the GEAR FLOOR slides you toward the edge, or a CLOCK RUSH spins the gondolas wildly. Knock your rival out of the tower 3 times to win!',
    lives: 3, haz: [], switches: [],
    stage: { x0: 330, x1: 1270, y: 640, th: 130 },
    soft: [{ x0: CX - RAD - GW / 2, x1: CX - RAD + GW / 2, y: CY }, { x0: CX + RAD - GW / 2, x1: CX + RAD + GW / 2, y: CY }, { x0: 420, x1: 600, y: 480 }, { x0: 1000, x1: 1180, y: 480 }],
    blast: { x0: -260, x1: 1860, y0: -560, y1: 1240 },
    spawn: [{ x: 500, y: 640 }, { x: 1100, y: 640 }, { x: 700, y: 640 }, { x: 900, y: 640 }],
    respawnY: 170,
    drawBack(g, S, t) {
      const C = S.clock || { a: 0, gearA: 0 };
      g.fillStyle = MGH.grad(g, 0, 720, ['#1a1028', '#2a1a2a', '#3a2418']); g.fillRect(0, 0, 1280, 720);
      // tall arched windows with moonlight
      for (const x of [140, 1140]) { g.fillStyle = '#20345a'; g.beginPath(); g.moveTo(x - 60, 520); g.lineTo(x - 60, 160); g.arc(x, 160, 60, Math.PI, 0); g.lineTo(x + 60, 520); g.fill(); g.strokeStyle = '#6a4a2a'; g.lineWidth = 6; g.stroke(); g.beginPath(); g.moveTo(x, 100); g.lineTo(x, 520); g.moveTo(x - 60, 300); g.lineTo(x + 60, 300); g.stroke(); MGH.glow(g, x, 240, 120, 'rgba(160,190,255,0.18)'); }
      // background gears turning
      gear(g, 240, 640, 150, 18, C.gearA * 0.5, '#5a3e22'); gear(g, 1060, 120, 120, 14, -C.gearA * 0.7, '#5a3e22'); gear(g, 1180, 560, 90, 12, C.gearA, '#6a4a28'); gear(g, 90, 200, 70, 10, -C.gearA * 1.3, '#6a4a28');
    },
    drawStage(g, S, t) {
      const C = S.clock || { a: 0, gearA: 0, pend: 0, ev: null, conv: 0 }, A = this.A;
      // the giant clock face behind the gondolas (world space)
      const fx = CX, fy = CY;
      MGH.glow(g, fx, fy, 340, 'rgba(255,220,150,0.18)');
      g.fillStyle = '#7a5a2a'; g.beginPath(); g.arc(fx, fy, 300, 0, 7); g.fill();
      const fg = g.createRadialGradient(fx - 60, fy - 60, 20, fx, fy, 280); fg.addColorStop(0, '#fff8e0'); fg.addColorStop(1, '#e8d4a0'); g.fillStyle = fg; g.beginPath(); g.arc(fx, fy, 280, 0, 7); g.fill();
      g.strokeStyle = '#b8903a'; g.lineWidth = 6; g.beginPath(); g.arc(fx, fy, 268, 0, 7); g.stroke();
      const ROM = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
      for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2 - Math.PI / 2; MGH.text(g, ROM[k], fx + Math.cos(a) * 236, fy + Math.sin(a) * 236 + 9, 26, '#4a3418', 'center', 'bold'); }
      for (let k = 0; k < 60; k++) { const a = k / 60 * Math.PI * 2; g.fillStyle = '#6a4a28'; g.beginPath(); g.arc(fx + Math.cos(a) * 258, fy + Math.sin(a) * 258, k % 5 ? 2 : 4, 0, 7); g.fill(); }
      // the hands point at the two gondolas
      [0, 1].forEach(k => { const a = C.a + k * Math.PI; g.strokeStyle = '#2a1a10'; g.lineWidth = k ? 14 : 10; g.lineCap = 'round'; g.beginPath(); g.moveTo(fx, fy); g.lineTo(fx + Math.cos(a) * (RAD - 10), fy + Math.sin(a) * (RAD - 10)); g.stroke(); });
      gear(g, fx, fy, 34, 10, C.gearA * 2, '#c8a04a', '#7a5a2a');
      // the pendulum (rests high to the side between swings)
      const pa = C.pend, bx = PIV.x + Math.sin(pa) * PLEN, by = PIV.y + Math.cos(pa) * PLEN, live = C.ev === 'pendulum';
      g.strokeStyle = '#8a6a3a'; g.lineWidth = 10; g.beginPath(); g.moveTo(PIV.x, PIV.y); g.lineTo(bx, by); g.stroke(); g.strokeStyle = '#c8a04a'; g.lineWidth = 3; g.beginPath(); g.moveTo(PIV.x, PIV.y); g.lineTo(bx, by); g.stroke();
      if (live) MGH.glow(g, bx, by, 90, 'rgba(255,200,90,0.45)');
      const bg = g.createRadialGradient(bx - 14, by - 14, 6, bx, by, 52); bg.addColorStop(0, '#fff0a0'); bg.addColorStop(1, '#a8781a'); g.fillStyle = bg; g.beginPath(); g.arc(bx, by, 48, 0, 7); g.fill(); g.strokeStyle = '#6a4a10'; g.lineWidth = 4; g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.4)'; g.beginPath(); g.arc(bx - 15, by - 15, 10, 0, 7); g.fill();
      // the gondolas: brass cages hanging from the hand tips
      A.soft.slice(0, 2).forEach((p, k) => { const mx = (p.x0 + p.x1) / 2; g.strokeStyle = '#8a6a3a'; g.lineWidth = 3; g.beginPath(); g.moveTo(mx, p.y - 46); g.lineTo(p.x0 + 12, p.y); g.moveTo(mx, p.y - 46); g.lineTo(p.x1 - 12, p.y); g.stroke(); g.fillStyle = '#c8a04a'; g.beginPath(); g.arc(mx, p.y - 46, 7, 0, 7); g.fill();
        g.fillStyle = MGH.grad(g, p.y, p.y + 26, ['#d8b058', '#8a6a2a']); MGH.rr(g, p.x0, p.y, p.x1 - p.x0, 22, 8); g.fill(); g.fillStyle = '#fff0a0'; g.fillRect(p.x0 + 8, p.y - 2, p.x1 - p.x0 - 16, 4);
        for (let x = p.x0 + 20; x < p.x1 - 10; x += 26) { g.fillStyle = '#6a4a1a'; g.beginPath(); g.arc(x, p.y + 12, 3, 0, 7); g.fill(); } });
      // side ledges: brass brackets
      A.soft.slice(2).forEach(p => { g.fillStyle = MGH.grad(g, p.y, p.y + 24, ['#9a7a4a', '#5a3e22']); MGH.rr(g, p.x0, p.y, p.x1 - p.x0, 22, 6); g.fill(); g.fillStyle = '#c8a04a'; g.fillRect(p.x0 + 6, p.y - 3, p.x1 - p.x0 - 12, 5); g.strokeStyle = '#5a3e22'; g.lineWidth = 6; g.beginPath(); g.moveTo(p.x0 + 20, p.y + 20); g.lineTo(p.x0 + 50, p.y + 70); g.moveTo(p.x1 - 20, p.y + 20); g.lineTo(p.x1 - 50, p.y + 70); g.stroke(); });
      // the stage: a giant cog floor (its teeth roll when the gears spin)
      const st = A.stage, w = st.x1 - st.x0;
      g.fillStyle = '#3a2614'; g.fillRect(st.x0, st.y, w, st.th); g.fillStyle = MGH.grad(g, st.y, st.y + 34, ['#c8a04a', '#7a5a2a']); g.fillRect(st.x0, st.y, w, 30);
      const off = ((C.convX || 0) % 60 + 60) % 60; g.save(); g.beginPath(); g.rect(st.x0, st.y - 10, w, 50); g.clip();
      for (let x = st.x0 - 60 + off; x < st.x1 + 60; x += 60) { g.fillStyle = '#e8c870'; g.fillRect(x, st.y + 4, 30, 6); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x + 30, st.y + 4, 30, 6); }
      g.restore();
      if (C.ev === 'gears') { const d = C.conv; for (let k = 0; k < 6; k++) { const x = st.x0 + 80 + k * 160 + ((t * 120 * d) % 160 + 160) % 160 - 80; MGH.text(g, d > 0 ? '▶' : '◀', x, st.y + 26, 18, 'rgba(255,240,180,0.8)', 'center', 'bold'); } }
      for (let k = 0; k < 5; k++) gear(g, st.x0 + 90 + k * 190, st.y + 86, 42, 10, (C.convX || 0) / 40 * (k % 2 ? -1 : 1), '#5a3e22');
      g.fillStyle = '#c8a04a'; g.fillRect(st.x0 - 8, st.y - 4, 16, st.th); g.fillRect(st.x1 - 8, st.y - 4, 16, st.th);
      for (const f of S.f) if (f.ground === 'respawn' && f.state !== 'dead') { g.globalAlpha = Math.min(1, f.respawnPlat / 0.6); g.fillStyle = 'rgba(255,230,160,0.8)'; g.beginPath(); g.ellipse(f.x, f.y + 4, 50, 10, 0, 0, 7); g.fill(); g.globalAlpha = 1; }
    },
  });

  const G = MG.byId.clockduel, base = { init: G.init, update: G.update, score: G.score, hud: G.hud, draw: G.draw, bot: G.bot };
  Object.assign(G, {
    mode: 'duel', finale: false,
    init(m, S) {
      base.init.call(this, m, S);
      const d = DU.pair(m); S.duel = d;
      S.f.forEach((f, i) => { if (!d.includes(i)) { f.watch = true; f.lives = 0; f.state = 'dead'; f.dead = 1e9; f.x = -9999; } });
      S.clock = { a: Math.PI, gearA: 0, pend: -1.15, pv: 0, ev: null, evT: 0, next: 12, k: R.int(0, 2), conv: 1, convX: 0, spd: 1, hitCd: [0, 0, 0, 0], bell: 0 };
      this.placeGondolas(S, 0);
    },
    placeGondolas(S, dt) {
      const C = S.clock, soft = this.A.soft;
      [0, 1].forEach(k => { const p = soft[k], a = C.a + k * Math.PI, nx = CX + Math.cos(a) * RAD - GW / 2, ny = CY + Math.sin(a) * RAD + 40, dx = nx - p.x0;
        p.x0 = nx; p.x1 = nx + GW; p.y = ny; if (dt) for (const f of S.f) if (f.ground === p) f.x += dx; });
    },
    update(m, S, dt) {
      const C = S.clock;
      if (S.endT < 0) {
        C.evT -= dt; C.next -= dt; C.bell -= dt;
        if (C.next <= 0) { C.ev = EVENTS[C.k % 3]; C.k++; C.evT = C.ev === 'pendulum' ? 9 : 7; C.next = 18; C.bell = 1.2; if (C.ev === 'gears') C.conv = -C.conv; S.banner = { text: EVN[C.ev], t: 0 }; Sfx.tone(392, 1.0, 'sine', 0.09); Sfx.tone(523, 1.2, 'sine', 0.06); S.shake = Math.max(S.shake, 6); }
        if (C.evT <= 0) C.ev = null;
        // clock hands (and gondolas)
        C.spd += ((C.ev === 'rush' ? 3.2 : 1) - C.spd) * Math.min(1, dt * 2);
        C.a += dt * 0.32 * C.spd; C.gearA += dt * C.spd * 0.8; this.placeGondolas(S, dt);
        // the pendulum: a real swing while live, otherwise it eases back up to its resting hook
        if (C.ev === 'pendulum') { if (C.pv === 0 && Math.abs(C.pend) > 1.0) C.pv = 0.01; C.pv += -9.81 / (PLEN / 100) * Math.sin(C.pend) * dt * 0.62; C.pend += C.pv * dt; }
        else { C.pv = 0; C.pend += ((C.pend >= 0 ? 1.15 : -1.15) - C.pend) * Math.min(1, dt * 1.5); }
        if (C.ev === 'pendulum') { const bx = PIV.x + Math.sin(C.pend) * PLEN, by = PIV.y + Math.cos(C.pend) * PLEN;
          S.f.forEach(f => { if (f.lives <= 0 || f.state === 'dead' || C.hitCd[f.i] > 0) return; if (Math.abs(f.x - bx) < 66 && f.y > by - 40 && f.y - 80 < by + 46) { C.hitCd[f.i] = 1.0; this.applyHit(m, S, -1, f.i, { dmg: 13, base: 470, grow: 8.2, ang: 52 }, Math.sign(C.pv) || 1, 1, { hazard: true }); } }); }
        C.hitCd = C.hitCd.map(v => v - dt);
        // the gear floor slides everyone standing on the stage
        if (C.ev === 'gears') { C.convX += C.conv * 150 * dt; S.f.forEach(f => { if (f.ground === 'stage' && f.lives > 0) f.x += C.conv * 150 * dt; }); }
      }
      base.update.call(this, m, S, dt);
    },
    bot(m, S, i, dt) {
      base.bot.call(this, m, S, i, dt); const f = S.f[i], C = S.clock, v = m.vin[i]; if (f.lives <= 0 || f.watch) return;
      // lean against the gear floor, and duck away from the swinging pendulum
      if (C.ev === 'gears' && f.ground === 'stage' && Math.random() < 0.7) v.ax = (v.ax || 0) - C.conv * 0.6;
      if (C.ev === 'pendulum' && f.ground === 'stage') { const bx = PIV.x + Math.sin(C.pend) * PLEN; if (Math.abs(bx - f.x) < 220 && Math.sign(C.pv) === Math.sign(f.x - bx) && Math.random() < 0.25 && !m.prev[i].a) v.a = true; }
    },
    score(m, S) { const sc = base.score.call(this, m, S); return sc.map((s, i) => S.f[i].watch ? -1 : s); },
    fmt(s) { if (s < 0) return 'watching'; if (s >= 100000) { const l = Math.floor((s - 100000) / 1000); return `won with ${l} ${l === 1 ? 'life' : 'lives'} left`; } return `knocked out at ${Math.round(s)}s`; },
    hud(m, S, i) { return S.f[i].watch ? '👀 watching' : base.hud.call(this, m, S, i); },
    draw(m, S, g) {
      base.draw.call(this, m, S, g);
      const C = S.clock; if (C && C.bell > 0) { g.save(); g.globalAlpha = C.bell / 1.2 * 0.5; g.strokeStyle = '#ffe680'; g.lineWidth = 8; const r = (1.2 - C.bell) * 700; g.beginPath(); g.arc(640, 120, r, 0, 7); g.stroke(); g.restore(); }
      if (C && C.next < 3 && C.next > 0 && S.endT < 0) MGH.label(g, `🔔 ${Math.ceil(C.next)}`, 640, 120, 22, '#ffe680');
    },
  });
})();
