'use strict';
// Party batch 6: Firefly Flight, Bubble Wand, Archery Range, Ice Curling (2v2), Ten Seconds, Critter Count, Marble Maze, Ring Toss
const swingP = t => 0.5 - 0.5 * Math.cos(t * 2.4); // a power meter that swings up and down while held

// ======================================================================== FIREFLY FLIGHT (hold to rise through a cave)
MG.def({
  id: 'firefly', name: 'Firefly Flight', type: 'Survival', controls: '1 button', dur: 0,
  rows: [['a', 'Hold to rise, let go to sink'], ['lb', 'Spark shot (3 per flight)']],
  how: 'Fly your glowing firefly through the dark cave! HOLD A to flutter up, let go to drift down. Slip through the gaps between the rock pillars, dodge the floating boulders and the flapping BATS — touch anything and your light goes out. Press LB (or LT) to fire a SPARK that smashes the next obstacle in front of you — but you only have three, so save them for emergencies! The cave speeds up and the gaps get tighter. Last firefly glowing wins!',
  wins: 'Last one flying (or furthest).',
  init(m, S) {
    S.x = 0; S.sp = 220; S.cols = []; S.shots = []; let x = 700; while (x < 30000) { const gap = Math.max(140, 230 - x / 160), r = Math.random(); if (x < 1500 || r < 0.55) S.cols.push({ k: 'col', x, c: R.range(200 + gap / 2, 660 - gap / 2), gap }); else if (r < 0.78) S.cols.push({ k: 'boulder', x, c: R.range(180, 620), r: R.range(48, 70) }); else S.cols.push({ k: 'bats', x, c: R.range(230, 570), ph: R.range(0, 6), amp: R.range(70, 140) }); x += R.range(280, 360); }
    S.p = [0, 1, 2, 3].map(i => ({ y: 300 + i * 40, vy: 0, alive: true, d: 0, ammo: 3, px: 220 + i * 50, look: R.range(0.9, 1.3) }));
  },
  update(m, S, dt) {
    S.sp = Math.min(520, 220 + m.t * 7); S.x += S.sp * dt;
    S.p.forEach((P, i) => {
      if (!P.alive) return;
      P.vy += (m.held(i, 'a') ? -1500 : 900) * dt; P.vy = clamp(P.vy, -380, 420); P.y += P.vy * dt; P.d = S.x + P.px;
      if (P.ammo > 0 && (m.pressed(i, 'lb') || m.pressed(i, 'lt'))) { P.ammo--; S.shots.push({ x: S.x + P.px + 10, y: P.y, own: i }); Sfx.tone(1200, 0.12, 'triangle', 0.05, 600); }
      const wx = S.x + P.px;
      if (P.y < 80 || P.y > 690 || S.cols.some(c => !c.gone && this.hits(c, wx, P.y, m.t))) { P.alive = false; Sfx.thud(); MGH.burst(P.px, P.y, ['#ffe680', '#c8ff7a'], 16, { speed: 200 }); }
    });
    // sparks fly ahead and smash the first obstacle they reach
    S.shots.forEach(sh => { sh.x += 900 * dt; const c = S.cols.find(c => !c.gone && Math.abs(c.x - sh.x) < 36); if (c) { c.gone = true; sh.dead = true; Sfx.boom(); MGH.burst(c.x - S.x, sh.y, ['#ffe680', '#c8b8ff', '#fff'], 22, { speed: 260 }); } if (sh.x > S.x + 1400) sh.dead = true; });
    S.shots = S.shots.filter(sh => !sh.dead);
    if (S.p.filter(P => P.alive).length <= 0 || m.t > 90) m.finish(this.score(m, S));
  },
  hits(c, x, y, t) {
    if (c.k === 'col') return Math.abs(c.x - x) < 34 && Math.abs(y - c.c) > c.gap / 2 - 12;
    if (c.k === 'boulder') return dist(c.x, c.c, x, y) < c.r + 10;
    const by = c.c + Math.sin(t * 2.5 + c.ph) * c.amp; return dist(c.x, by, x, y) < 34;
  },
  bot(m, S, i) {
    const P = S.p[i], v = m.vin[i]; v.lb = false; if (!P.alive) { v.a = false; return; }
    const wx = S.x + P.px, c = S.cols.find(c => !c.gone && c.x + 40 > wx);
    let ty = 400; if (c) { if (c.k === 'col') ty = c.c; else { const oy = c.k === 'bats' ? c.c + Math.sin(m.t * 2.5 + c.ph) * c.amp : c.c, rr = c.k === 'bats' ? 90 : c.r + 60; ty = oy > 400 ? oy - rr : oy + rr; } if (c.x - wx < 160 && P.ammo > 0 && this.hits(c, c.x, P.y + P.vy * 0.25, m.t + (c.x - wx) / S.sp) && Math.random() < 0.3) v.lb = true; }
    v.a = P.y + P.vy * 0.18 * P.look > ty + 6;
    if (Math.random() < 0.01) P.look = R.range(0.5, 1.7);
  },
  score(m, S) { return S.p.map(P => Math.round(P.d / 10)); },
  fmt(s) { return `${s} m`; },
  hud(m, S, i) { return S.p[i].alive ? `${Math.round(S.x / 10)} m · ✨${S.p[i].ammo}` : `out ${Math.round(S.p[i].d / 10)} m`; },
  draw(m, S, g) {
    g.fillStyle = MGH.grad(g, 0, 720, ['#0a0a1a', '#141a30', '#0a1020']); g.fillRect(0, 0, 1280, 720);
    for (let k = 0; k < 40; k++) { const x = ((k * 137 - S.x * 0.2) % 1400 + 1400) % 1400 - 60, y = 100 + (k * 71) % 560; g.fillStyle = 'rgba(120,200,255,0.15)'; g.beginPath(); g.arc(x, y, 2 + k % 3, 0, 7); g.fill(); }
    // cave ceiling and floor
    g.fillStyle = '#2a2438'; g.beginPath(); g.moveTo(0, 0); for (let x = 0; x <= 1280; x += 40) g.lineTo(x, 70 + Math.sin((x + S.x) * 0.02) * 10); g.lineTo(1280, 0); g.fill();
    g.beginPath(); g.moveTo(0, 720); for (let x = 0; x <= 1280; x += 40) g.lineTo(x, 700 + Math.sin((x + S.x) * 0.017) * 10); g.lineTo(1280, 720); g.fill();
    S.shots.forEach(sh => { const x = sh.x - S.x; MGH.glow(g, x, sh.y, 30, 'rgba(255,230,120,0.8)'); g.fillStyle = '#fff'; g.beginPath(); g.arc(x, sh.y, 6, 0, 7); g.fill(); });
    S.cols.forEach(c => {
      const x = c.x - S.x; if (x < -80 || x > 1360 || c.gone) return;
      if (c.k === 'boulder') { MGH.rock(g, x, c.c, c.r, Math.round(c.x) % 7, '#5a4a6a', c.x * 0.01); g.strokeStyle = 'rgba(120,255,200,0.35)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, c.c - c.r); g.lineTo(x + 4, 0); g.stroke(); return; }
      if (c.k === 'bats') { const by = c.c + Math.sin(m.t * 2.5 + c.ph) * c.amp, fl = Math.sin(m.t * 18 + c.ph); g.fillStyle = '#1a1424'; g.beginPath(); g.ellipse(x, by, 14, 11, 0, 0, 7); g.fill(); for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(x + sd * 8, by - 2); g.quadraticCurveTo(x + sd * 28, by - 18 * fl - 6, x + sd * 40, by - 4 * fl); g.quadraticCurveTo(x + sd * 26, by + 4, x + sd * 8, by + 4); g.fill(); } g.fillStyle = '#ff4a4a'; g.beginPath(); g.arc(x - 5, by - 3, 2.5, 0, 7); g.arc(x + 5, by - 3, 2.5, 0, 7); g.fill(); return; }
      for (const [y0, y1] of [[0, c.c - c.gap / 2], [c.c + c.gap / 2, 720]]) {
        g.fillStyle = MGH.grad(g, y0, y1, ['#4a3a5a', '#3a2e4a']); g.beginPath(); g.moveTo(x - 34, y0); g.lineTo(x + 34, y0);
        if (y0 === 0) { g.lineTo(x + 30, y1 - 20); g.lineTo(x, y1); g.lineTo(x - 30, y1 - 20); } else { g.lineTo(x + 34, y1); g.lineTo(x - 34, y1); g.lineTo(x - 30, y0 + 20); g.lineTo(x, y0); g.lineTo(x + 30, y0 + 20); }
        g.closePath(); g.fill();
        g.fillStyle = 'rgba(120,255,200,0.5)'; for (let k = 0; k < 3; k++) { const yy = y0 === 0 ? y1 - 30 - k * 60 : y0 + 30 + k * 60; if (yy > 0 && yy < 720) { g.beginPath(); g.arc(x + (k % 2 ? 12 : -10), yy, 4, 0, 7); g.fill(); } }
      }
    });
    S.p.forEach((P, i) => {
      const p = m.players[i]; if (!P.alive && m.t - 0 > 0) { g.globalAlpha = 0.25; }
      MGH.glow(g, P.px, P.y, P.alive ? 60 : 20, 'rgba(255,240,120,0.6)');
      g.fillStyle = 'rgba(220,240,255,0.6)'; const fl = Math.sin(m.t * 40 + i) * 0.5 + 0.5; g.beginPath(); g.ellipse(P.px - 6, P.y - 14, 14, 6 + fl * 4, -0.5, 0, 7); g.ellipse(P.px + 6, P.y - 14, 14, 6 + fl * 4, 0.5, 0, 7); g.fill();
      Char.draw(g, P.px, P.y, 16, p.el.id, p.color, { mood: MGH.persona(P.alive ? (P.vy < 0 ? 'effort' : 'happy') : 'sad', p.el.id), seed: i * 1.7, look: { x: 1, y: P.vy / 600 }, noFeet: true, noShadow: true });
      g.fillStyle = '#ffe680'; g.beginPath(); g.arc(P.px - 14, P.y + 10, 6, 0, 7); g.fill();
      for (let k = 0; k < P.ammo; k++) { g.fillStyle = '#fff6a0'; g.beginPath(); g.arc(P.px - 10 + k * 10, P.y - 34, 3, 0, 7); g.fill(); }
      g.globalAlpha = 1;
    });
    MGH.text(g, `${Math.round(S.x / 10)} m`, 1200, 100, 22, '#ffe680', 'center', 'bold');
  },
});

// ======================================================================== BUBBLE WAND (blow to the target size without popping)
MG.def({
  id: 'bubbles', name: 'Bubble Wand', type: 'Timing', controls: '1 button', dur: 0,
  rows: [['a', 'Hold to blow, let go to stop']],
  how: 'Blow a bubble as close to the size of the dotted ring as you can! HOLD A to blow and let go to stop. But every bubble pops somewhere a little past the ring — and you never know exactly where. Closest bubble scores 3, then 2, then 1. Popped bubbles score nothing. Five rounds.',
  wins: 'Most points after five rounds.',
  init(m, S) { S.pts = [0, 0, 0, 0]; S.round = 0; this.next(S); },
  next(S) { S.round++; S.T = R.range(70, 130); S.ph = 'blow'; S.pt = 0; S.p = [0, 1, 2, 3].map(() => ({ r: 0, st: 'wait', pop: S.T * R.range(1.06, 1.35), sc: 0, aim: R.range(0.88, 1.08) })); },
  update(m, S, dt) {
    S.pt += dt;
    if (S.ph === 'blow') {
      S.p.forEach((P, i) => {
        if (P.st === 'wait' && m.held(i, 'a')) P.st = 'blow';
        if (P.st === 'blow') { P.r += (40 + P.r * 0.6) * dt; if (P.r >= P.pop) { P.st = 'pop'; Sfx.pop(); MGH.burst(160 + i * 320, 380, ['#bfe6ff', '#fff'], 16, { speed: 200 }); } else if (!m.held(i, 'a')) { P.st = 'done'; Sfx.tone(700, 0.05, 'sine', 0.03); } }
      });
      if (S.p.every(P => P.st === 'done' || P.st === 'pop') || S.pt > 9) {
        S.p.forEach(P => { if (P.st === 'blow' || P.st === 'wait') P.st = P.st === 'wait' ? 'pop' : 'done'; });
        const ok = S.p.map((P, i) => ({ i, d: P.st === 'done' ? Math.abs(P.r - S.T) : 1e9 })).sort((a, b) => a.d - b.d);
        ok.forEach((o, k) => { if (o.d < 1e9) { const pts = [3, 2, 1, 0][k]; S.pts[o.i] += pts; S.p[o.i].sc = pts; } });
        S.ph = 'show'; S.pt = 0; Sfx.coin();
      }
    } else if (S.pt > 2.6) { if (S.round >= 5) m.finish(S.pts.slice()); else this.next(S); }
  },
  bot(m, S, i) { const P = S.p[i], v = m.vin[i]; if (S.ph !== 'blow') { v.a = false; return; } if (P.st === 'wait') { v.a = S.pt > 0.5 + i * 0.2; return; } v.a = P.st === 'blow' && P.r < S.T * P.aim; },
  score(m, S) { return S.pts.slice(); },
  fmt(s) { return `${s} pts`; },
  hud(m, S, i) { return `${S.pts[i]} pts`; },
  draw(m, S, g) {
    MGH.scene(g, 'meadow', m.t);
    MGH.label(g, `Round ${S.round} of 5 — match the dotted ring`, 640, 90, 22, '#fff');
    for (let i = 0; i < 4; i++) {
      const P = S.p[i], p = m.players[i], x = 160 + i * 320, y = 360;
      g.setLineDash([8, 8]); g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 3; g.beginPath(); g.arc(x, y, S.T, 0, 7); g.stroke(); g.setLineDash([]);
      if (P.st !== 'pop' && P.r > 1) {
        const gr = g.createRadialGradient(x - P.r * 0.35, y - P.r * 0.35, 2, x, y, P.r); gr.addColorStop(0, 'rgba(255,255,255,0.6)'); gr.addColorStop(0.7, 'rgba(180,220,255,0.15)'); gr.addColorStop(1, `rgba(${['255,150,220', '150,220,255', '200,255,170'][i % 3]},0.5)`);
        g.fillStyle = gr; g.beginPath(); g.arc(x, y, P.r, 0, 7); g.fill(); g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 2; g.stroke();
        g.fillStyle = 'rgba(255,255,255,0.8)'; g.beginPath(); g.ellipse(x - P.r * 0.4, y - P.r * 0.45, P.r * 0.16, P.r * 0.08, -0.6, 0, 7); g.fill();
      }
      if (P.st === 'pop') MGH.text(g, 'POP!', x, y, 36, '#ff8ab8', 'center', 'bold');
      g.strokeStyle = '#c8a060'; g.lineWidth = 5; g.beginPath(); g.moveTo(x, y + Math.max(P.r, 20)); g.lineTo(x, 600); g.stroke();
      Char.draw(g, x, 640, 30, p.el.id, p.color, { mood: MGH.persona(P.st === 'pop' ? 'hurt' : P.st === 'blow' ? 'effort' : S.ph === 'show' && P.sc === 3 ? 'cheer' : 'happy', p.el.id), seed: i * 1.7, look: { x: 0, y: -1 } });
      MGH.text(g, `${p.name}  ${S.pts[i]}`, x, 706, 18, p.color, 'center', 'bold');
      if (S.ph === 'show' && P.sc) MGH.label(g, `+${P.sc}`, x, y - S.T - 30, 22, '#ffe680');
    }
  },
});

// ======================================================================== ARCHERY RANGE (steady your breath, release on the bullseye)
MG.def({
  id: 'archery', name: 'Archery Range', type: 'Skill', sport: true, controls: '1 button (hold & release)', dur: 0,
  rows: [['a', 'Hold to draw & steady, let go to shoot']],
  how: 'Your aim drifts around the target. HOLD A to draw the bow — while you hold, your breathing steadies and the drift slows down. LET GO to shoot. But hold for too long (the ring turns red) and your arms start to shake! Mind the wind arrow: it pushes your shot. Five arrows each.',
  wins: 'Highest total.',
  init(m, S) { S.p = [0, 1, 2, 3].map(() => ({ n: 0, tot: 0, hold: 0, st: 'aim', ph: R.range(0, 6), hits: [], wait: 0.6, bAt: R.range(0.8, 1.6) })); S.wind = R.range(-1, 1); },
  update(m, S, dt) {
    S.p.forEach((P, i) => {
      P.wait -= dt; if (P.n >= 5 || P.wait > 0) return;
      P.ph += dt * (P.hold > 0 ? (P.hold < 1.8 ? Math.max(0.25, 1 - P.hold * 0.5) : 2.2) : 1.2);
      if (m.held(i, 'a')) P.hold += dt;
      else if (P.hold > 0.2) {
        const [ax, ay] = this.aim(P), wx = S.wind * 22;
        const d = Math.hypot(ax + wx, ay), sc = Math.max(0, 10 - Math.floor(d / 11));
        P.hits.push({ x: ax + wx, y: ay, sc }); P.tot += sc; P.n++; P.hold = 0; P.wait = 0.8; Sfx.thud(); if (sc >= 9) Sfx.coin();
        if (S.p.every(q => q.n >= P.n)) S.wind = R.range(-1, 1);
      } else P.hold = 0;
    });
    if (S.p.every(P => P.n >= 5) && S.p.every(P => P.wait <= 0)) m.finish(this.score(m, S));
  },
  aim(P) { const k = P.hold > 1.8 ? 1 + (P.hold - 1.8) * 1.5 : 1; return [Math.sin(P.ph * 1.3) * 60 * k + Math.sin(P.ph * 3.1) * 10 * k, Math.sin(P.ph * 2.1 + 1) * 50 * k]; },
  bot(m, S, i) {
    const P = S.p[i], v = m.vin[i]; if (P.wait > 0 || P.n >= 5) { v.a = false; return; }
    if (P.hold <= 0) { v.a = true; return; }
    const [ax, ay] = this.aim(P), wx = S.wind * 22; const d = Math.hypot(ax + wx, ay);
    v.a = !(P.hold > P.bAt && d < 22 + Math.random() * 20) && P.hold < 2.4; if (!v.a) P.bAt = R.range(0.5, 1.7);
  },
  score(m, S) { return S.p.map(P => P.tot); },
  fmt(s) { return `${s} pts`; },
  hud(m, S, i) { return `${S.p[i].tot} · ${S.p[i].n}/5`; },
  draw(m, S, g) {
    MGH.scene(g, 'forest', m.t);
    g.fillStyle = 'rgba(0,0,0,0.5)'; MGH.rr(g, 560, 62, 160, 40, 12); g.fill(); MGH.text(g, 'wind', 600, 88, 16, '#fff', 'center', 'bold');
    g.strokeStyle = '#9fe0ff'; g.lineWidth = 5; g.beginPath(); g.moveTo(670, 82); g.lineTo(670 + S.wind * 36, 82); g.stroke(); g.fillStyle = '#9fe0ff'; g.beginPath(); g.moveTo(670 + S.wind * 36 + Math.sign(S.wind) * 8, 82); g.lineTo(670 + S.wind * 36, 74); g.lineTo(670 + S.wind * 36, 90); g.fill();
    for (let i = 0; i < 4; i++) {
      const P = S.p[i], p = m.players[i], cx = 160 + i * 320, cy = 300;
      g.fillStyle = '#8a5a2a'; g.fillRect(cx - 6, cy + 100, 12, 140);
      for (let k = 10; k >= 1; k--) { g.fillStyle = k > 8 ? (k % 2 ? '#ffd34d' : '#ffe680') : k > 6 ? '#e8432a' : k > 4 ? '#3f8ee8' : k > 2 ? '#222' : '#f4f4f4'; g.beginPath(); g.arc(cx, cy, (11 - k) * 11, 0, 7); g.fill(); }
      g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 1; for (let k = 1; k <= 10; k++) { g.beginPath(); g.arc(cx, cy, k * 11, 0, 7); g.stroke(); }
      P.hits.forEach(h => { g.strokeStyle = '#5a3a1a'; g.lineWidth = 3; g.beginPath(); g.moveTo(cx + h.x, cy + h.y); g.lineTo(cx + h.x + 10, cy + h.y + 8); g.stroke(); g.fillStyle = p.color; g.beginPath(); g.arc(cx + h.x, cy + h.y, 5, 0, 7); g.fill(); });
      if (P.n < 5 && P.wait <= 0) { const [ax, ay] = this.aim(P), red = P.hold > 1.8; g.strokeStyle = red ? '#ff4a4a' : P.hold > 0 ? '#7cf06a' : '#fff'; g.lineWidth = 3; g.beginPath(); g.arc(cx + ax, cy + ay, 16, 0, 7); g.moveTo(cx + ax - 24, cy + ay); g.lineTo(cx + ax + 24, cy + ay); g.moveTo(cx + ax, cy + ay - 24); g.lineTo(cx + ax, cy + ay + 24); g.stroke(); }
      Char.draw(g, cx, 610, 34, p.el.id, p.color, { mood: MGH.persona(P.hold > 1.8 ? 'nervous' : P.hold > 0 ? 'determined' : 'happy', p.el.id), seed: i * 1.7, look: { x: 0, y: -1 }, hands: P.hold > 0 ? { n: { x: -0.3, y: -1.5, d: -90, o: true, m: true }, f: { x: 0.5, y: -0.9, d: -60, o: true, m: false } } : undefined });
      MGH.text(g, `${p.name}  ${P.tot}`, cx, 690, 20, p.color, 'center', 'bold');
      for (let k = 0; k < 5; k++) { g.fillStyle = k < P.n ? 'rgba(255,255,255,0.2)' : '#c8a060'; g.fillRect(cx - 50 + k * 22, 706, 14, 6); }
      if (P.hits.length && P.wait > 0) MGH.label(g, `${P.hits[P.hits.length - 1].sc}`, cx, cy - 150, 26, '#ffe680');
    }
  },
});

// ======================================================================== ICE CURLING (2 vs 2)
MG.def({
  id: 'curling', name: 'Ice Curling', type: 'Skill', mode: '2v2', sport: true, controls: 'Move + A & B', dur: 0,
  rows: [['lr', 'Thrower: aim'], ['a', 'Thrower: hold & release'], ['b', 'Sweeper: A and B in turn']],
  how: 'Teams take turns sliding stones toward the target at the top. THROWER: point LEFT/RIGHT to aim, HOLD A to build power and let go to slide. TEAMMATE: while your stone slides, press A and B one after the other in a steady rhythm to SWEEP — it glides further and straighter. After eight stones, the team with the stone closest to the centre scores a point for each of its stones closer than the other team\'s best.',
  wins: 'Most points after the end.',
  CX: 640, TY: 160, house: 120,
  init(m, S) { S.k = 0; S.stones = []; S.order = []; const t0 = [0, 1, 2, 3].filter(i => m.teamOf(i) === 0), t1 = [0, 1, 2, 3].filter(i => m.teamOf(i) === 1); for (let r = 0; r < 2; r++) for (let k = 0; k < 2; k++) { S.order.push(t0[k]); S.order.push(t1[k]); } S.ph = 'aim'; S.aim = 0; S.hold = 0; S.pt = 0; S.sw = [0, 1, 2, 3].map(() => ({ lastKey: null })); },
  thrower(S) { return S.order[S.k]; },
  sweeper(m, S) { const t = this.thrower(S); return m.mates(t)[0]; },
  update(m, S, dt) {
    S.pt += dt;
    if (S.ph === 'aim') {
      const t = this.thrower(S), a = m.axis(t);
      S.aim = clamp(S.aim + a.x * dt * 0.8, -0.35, 0.35);
      if (m.held(t, 'a')) S.hold += dt; else if (S.hold > 0.1) {
        const pw = swingP(S.hold); S.cur = Object.assign(MGH.body(this.CX, 660, 20), { tm: m.teamOf(t), vx: Math.sin(S.aim) * (200 + pw * 260), vy: -Math.cos(S.aim) * (200 + pw * 260), curl: R.range(-30, 30) });
        S.stones.push(S.cur); S.ph = 'slide'; S.hold = 0; S.pt = 0; Sfx.whoosh(false);
      } else S.hold = 0;
      return;
    }
    if (S.ph === 'slide') {
      const sw = this.sweeper(m, S), q = MGM.cadence(m, sw, S.sw[sw], dt);
      S.stones.forEach(s => {
        const sp = Math.hypot(s.vx, s.vy); if (sp < 2) { s.vx = s.vy = 0; return; }
        const fr = s === S.cur ? 110 - q * 40 : 110; const k = Math.max(0, sp - fr * dt) / sp; s.vx *= k; s.vy *= k;
        if (s === S.cur && sp > 30) s.vx += s.curl * (1 - q * 0.8) * dt;
        s.x += s.vx * dt; s.y += s.vy * dt;
      });
      MGH.collide(S.stones, 0.9);
      S.stones.forEach(s => { if (s.x < 360 || s.x > 920 || s.y < 30) s.out = true; });
      S.stones = S.stones.filter(s => !s.out);
      if (S.stones.every(s => Math.hypot(s.vx, s.vy) < 2) || S.pt > 12) { S.k++; if (S.k >= S.order.length) { S.ph = 'end'; S.pt = 0; S.res = this.result(S); Sfx.crowd('cheer'); } else { S.ph = 'aim'; S.aim = 0; S.pt = 0; } }
      return;
    }
    if (S.ph === 'end' && S.pt > 3) m.finish(this.score(m, S));
  },
  result(S) {
    const d = s => Math.hypot(s.x - this.CX, s.y - this.TY);
    const inH = S.stones.filter(s => d(s) < this.house + 20).sort((a, b) => d(a) - d(b));
    if (!inH.length) return { tm: -1, n: 0 };
    const tm = inH[0].tm, other = inH.find(s => s.tm !== tm), lim = other ? d(other) : 1e9;
    return { tm, n: inH.filter(s => s.tm === tm && d(s) < lim).length };
  },
  bot(m, S, i, dt) {
    const v = m.vin[i]; v.a = v.b = false; v.ax = 0;
    if (S.ph === 'aim' && i === this.thrower(S)) {
      // aim at the button (or knock a rival stone out), then hold to the right power
      if (S.bAimT === undefined || S.bK !== S.k) { S.bK = S.k; const foe = S.stones.filter(s => s.tm !== m.teamOf(i)).sort((a, b) => Math.hypot(a.x - this.CX, a.y - this.TY) - Math.hypot(b.x - this.CX, b.y - this.TY))[0]; const tx = foe && Math.random() < 0.5 ? foe.x : this.CX + R.range(-30, 30); S.bAimT = clamp(Math.atan2(tx - this.CX, 660 - this.TY) + R.range(-0.03, 0.03), -0.35, 0.35); S.bPw = foe && tx === foe.x ? R.range(0.62, 0.8) : R.range(0.34, 0.5); }
      if (Math.abs(S.aim - S.bAimT) > 0.02) { v.ax = Math.sign(S.bAimT - S.aim); return; }
      v.a = !(S.hold > 0.1 && swingP(S.hold) >= S.bPw && swingP(S.hold + dt) < swingP(S.hold) + 0.05 && swingP(S.hold) - S.bPw < 0.06) && S.hold < 2.6;
      return;
    }
    if (S.ph === 'slide' && i === this.sweeper(m, S)) { const s = S.cur; if (s && s.y > this.TY + 20) MGM.botCadence(m, i, S.sw[i], dt); }
  },
  score(m, S) { const r = S.res || this.result(S); return m.players.map((p, i) => m.teamOf(i) === r.tm ? r.n : 0); },
  fmt(s) { return `${s} pts`; },
  hud(m, S, i) { return MG.TEAMN[m.teamOf(i)] + (S.ph !== 'end' && i === this.thrower(S) ? ' 🥌' : ''); },
  draw(m, S, g) {
    g.fillStyle = '#2a3a4a'; g.fillRect(0, 0, 1280, 720); MGH.crowd(g, m.t, 700, 30);
    g.fillStyle = MGH.grad(g, 0, 720, ['#e8f4ff', '#d0e8f8']); g.fillRect(360, 20, 560, 700);
    g.strokeStyle = 'rgba(120,160,200,0.4)'; g.lineWidth = 2; g.strokeRect(360, 20, 560, 700);
    for (const [r, c] of [[this.house, '#3f6ae8'], [this.house * 0.66, '#fff'], [this.house * 0.36, '#e8432a'], [this.house * 0.12, '#fff']]) { g.fillStyle = c; g.beginPath(); g.arc(this.CX, this.TY, r, 0, 7); g.fill(); }
    g.strokeStyle = 'rgba(200,40,40,0.5)'; g.beginPath(); g.moveTo(360, 560); g.lineTo(920, 560); g.stroke();
    // aim line
    if (S.ph === 'aim') { g.strokeStyle = 'rgba(40,80,160,0.5)'; g.setLineDash([10, 10]); g.lineWidth = 3; g.beginPath(); g.moveTo(this.CX, 660); g.lineTo(this.CX + Math.sin(S.aim) * 500, 660 - Math.cos(S.aim) * 500); g.stroke(); g.setLineDash([]); }
    S.stones.forEach(s => { MGH.shadow(g, s.x, s.y + 6, 20, 0.3); g.fillStyle = '#8a8a9a'; g.beginPath(); g.arc(s.x, s.y, 20, 0, 7); g.fill(); g.fillStyle = MG.TEAMC[s.tm]; g.beginPath(); g.arc(s.x, s.y, 13, 0, 7); g.fill(); g.fillStyle = '#333'; g.fillRect(s.x - 3, s.y - 11, 6, 12); });
    // thrower and sweeper
    if (S.ph !== 'end') {
      const t = this.thrower(S), sw = this.sweeper(m, S), pt = m.players[t], ps = m.players[sw];
      Char.draw(g, this.CX, 690, 30, pt.el.id, pt.color, { mood: MGH.persona('determined', pt.el.id), seed: t * 1.7, look: { x: 0, y: -1 } });
      if (S.ph === 'aim') { g.fillStyle = 'rgba(0,0,0,0.5)'; MGH.rr(g, this.CX + 50, 600, 18, 100, 6); g.fill(); g.fillStyle = '#ffb13d'; const pw = S.hold > 0 ? swingP(S.hold) : 0; g.fillRect(this.CX + 52, 698 - 96 * pw, 14, 96 * pw); }
      const s = S.cur, sx = s && S.ph === 'slide' ? s.x + 40 : 980, sy = s && S.ph === 'slide' ? s.y - 30 : 400;
      Char.draw(g, sx, sy, 24, ps.el.id, ps.color, { mood: MGH.persona(S.sw[sw].rq > 0.7 ? 'effort' : 'determined', ps.el.id), seed: sw * 1.7, look: { x: -1, y: 0 }, walk: S.ph === 'slide' ? 1 : 0, hands: { n: { x: -1.2, y: 0.6, d: 150, o: true, m: true }, f: { x: -0.9, y: 0.4, d: 150, o: true, m: false } } });
      if (S.ph === 'slide') { g.strokeStyle = '#c8a060'; g.lineWidth = 4; g.beginPath(); g.moveTo(sx - 10, sy); g.lineTo(sx - 40 + Math.sin(m.t * 30) * 8, sy + 30); g.stroke(); MGM.drawCadence(g, 1100, 380, S.sw[sw], 90); MGH.text(g, `${ps.name}: SWEEP!`, 1100, 350, 18, ps.color, 'center', 'bold'); }
      MGH.text(g, `Stone ${S.k + 1} of 8 — ${pt.name} throws`, 180, 60, 20, MG.TEAMC[m.teamOf(t)], 'center', 'bold');
    }
    // stones left per team
    [0, 1].forEach(tm => { const left = S.order.slice(S.k + (S.ph === 'aim' ? 0 : 1)).filter(i => m.teamOf(i) === tm).length; for (let k = 0; k < left; k++) { g.fillStyle = MG.TEAMC[tm]; g.beginPath(); g.arc(tm ? 1000 + k * 30 : 100 + k * 30, 640, 11, 0, 7); g.fill(); } MGH.text(g, MG.TEAMN[tm], tm ? 1060 : 160, 610, 18, MG.TEAMC[tm], 'center', 'bold'); });
    if (S.ph === 'end') MGH.label(g, S.res.tm < 0 ? 'No stones in the house!' : `${MG.TEAMN[S.res.tm]} scores ${S.res.n}!`, 640, 400, 36, S.res.tm < 0 ? '#fff' : MG.TEAMC[S.res.tm]);
  },
});

// ======================================================================== TEN SECONDS (stop your hidden clock at exactly 10.00)
MG.def({
  id: 'tensec', name: 'Ten Seconds', type: 'Timing', controls: '1 button', dur: 0,
  rows: [['a', 'Stop your clock at 10.00']],
  how: 'Everyone\'s clock starts together. Press A to stop yours at exactly 10.00 seconds! The trouble: the clocks fade away after a few seconds, so you have to count in your head. Closest scores 3, then 2, then 1. Each round the clocks vanish sooner.',
  wins: 'Most points after four rounds.',
  init(m, S) { S.pts = [0, 0, 0, 0]; S.round = 0; this.next(S); },
  next(S) { S.round++; S.ph = 'ready'; S.pt = 0; S.stop = [-1, -1, -1, -1]; S.hide = [5, 3, 2, 1][S.round - 1]; S.bErr = [0, 1, 2, 3].map(() => R.range(-0.6, 0.6) * (0.3 + S.round * 0.25)); S.sc = [0, 0, 0, 0]; },
  update(m, S, dt) {
    S.pt += dt;
    if (S.ph === 'ready') { if (S.pt > 2) { S.ph = 'run'; S.pt = 0; Sfx.whistle(); } return; }
    if (S.ph === 'run') {
      for (let i = 0; i < 4; i++) if (S.stop[i] < 0 && m.pressed(i, 'a')) { S.stop[i] = S.pt; Sfx.click(); }
      if (S.stop.every(s => s >= 0) || S.pt > 16) {
        S.stop = S.stop.map(s => s < 0 ? 99 : s);
        [0, 1, 2, 3].sort((a, b) => Math.abs(S.stop[a] - 10) - Math.abs(S.stop[b] - 10)).forEach((i, k) => { S.sc[i] = S.stop[i] < 90 ? [3, 2, 1, 0][k] : 0; S.pts[i] += S.sc[i]; });
        S.ph = 'show'; S.pt = 0; Sfx.coin();
      }
      return;
    }
    if (S.pt > 3.2) { if (S.round >= 4) m.finish(S.pts.slice()); else this.next(S); }
  },
  bot(m, S, i) { const v = m.vin[i]; v.a = S.ph === 'run' && S.stop[i] < 0 && S.pt >= 10 + S.bErr[i]; },
  score(m, S) { return S.pts.slice(); },
  fmt(s) { return `${s} pts`; },
  hud(m, S, i) { return `${S.pts[i]} pts`; },
  draw(m, S, g) {
    MGH.scene(g, 'night', m.t);
    MGH.label(g, `Round ${S.round} of 4 — the clocks vanish after ${S.hide}s`, 640, 90, 22, '#fff');
    for (let i = 0; i < 4; i++) {
      const p = m.players[i], x = 160 + i * 320, y = 330, st = S.stop[i];
      const t = S.ph === 'run' ? (st >= 0 ? st : S.pt) : S.ph === 'show' ? st : 0;
      const vis = S.ph !== 'run' || t < S.hide || st >= 0 ? 1 : Math.max(0, 1 - (t - S.hide) * 2);
      g.fillStyle = '#2a2a4a'; MGH.rr(g, x - 120, y - 70, 240, 140, 22); g.fill(); g.strokeStyle = p.color; g.lineWidth = 5; g.stroke();
      g.globalAlpha = S.ph === 'show' || st >= 0 && S.ph === 'show' ? 1 : vis;
      MGH.text(g, t > 90 ? '—' : t.toFixed(2), x, y + 22, 64, S.ph === 'show' ? (S.sc[i] === 3 ? '#ffe680' : '#fff') : '#9fe0ff', 'center', 'bold');
      g.globalAlpha = 1;
      if (vis < 1 && S.ph === 'run' && st < 0) MGH.text(g, '? ? . ? ?', x, y + 20, 44, 'rgba(255,255,255,0.25)', 'center', 'bold');
      if (st >= 0 && S.ph === 'run') MGH.text(g, '✔ stopped', x, y + 100, 18, '#7cf06a', 'center', 'bold');
      if (S.ph === 'show') MGH.label(g, st > 90 ? 'no press' : `${st >= 10 ? '+' : ''}${(st - 10).toFixed(2)}s   +${S.sc[i]}`, x, y + 110, 20, S.sc[i] === 3 ? '#ffe680' : '#fff');
      Char.draw(g, x, 600, 36, p.el.id, p.color, { mood: MGH.persona(S.ph === 'show' ? (S.sc[i] === 3 ? 'cheer' : S.sc[i] ? 'happy' : 'sad') : S.ph === 'run' && st < 0 ? 'nervous' : 'determined', p.el.id), seed: i * 1.7, look: { x: 0, y: -0.5 } });
      MGH.text(g, `${p.name}  ${S.pts[i]}`, x, 680, 20, p.color, 'center', 'bold');
    }
    if (S.ph === 'ready') MGH.label(g, 'Ready…', 640, 520, 36, '#fff');
  },
});

// ======================================================================== CRITTER COUNT (count the parade, answer secretly with A B X Y)
const CRIT = [{ n: 'bunnies', c: '#f4f4f4', e: '#ff8ab8' }, { n: 'ducks', c: '#ffe680', e: '#ff8a3d' }, { n: 'frogs', c: '#7ccf4a', e: '#3a7a2a' }];
MG.def({
  id: 'critters', name: 'Critter Count', type: 'Memory', controls: 'A B X Y', dur: 0, noPadSkip: true,
  rows: [['abxy', 'Pick your answer']],
  how: 'A parade of bunnies, ducks and frogs hops across the field. Count carefully! Then the host asks how many of ONE kind went by. Four answers appear on the buttons — Y top, B right, A bottom, X left. Press yours secretly. Right answer scores, and the quickest right answer gets a bonus. Five rounds, getting busier.',
  wins: 'Most points.',
  init(m, S) { S.pts = [0, 0, 0, 0]; S.round = 0; this.next(S); },
  next(S) {
    S.round++; S.ph = 'parade'; S.pt = 0; S.list = []; const n = 8 + S.round * 3; let t = 0.6;
    for (let k = 0; k < n; k++) { S.list.push({ k: R.int(0, 2), t, row: R.int(0, 2), sp: R.range(260, 380 + S.round * 30) }); t += R.range(0.25, 0.75 - S.round * 0.05); }
    S.dur = t + 4; S.q = R.int(0, 2); S.ans = S.list.filter(c => c.k === S.q).length;
    const opts = new Set([S.ans]); while (opts.size < 4) opts.add(Math.max(0, S.ans + R.pick([-3, -2, -1, 1, 2, 3]))); S.opts = R.shuffle([...opts]);
    S.pick = [-1, -1, -1, -1]; S.when = [0, 0, 0, 0]; S.bAt = [0, 1, 2, 3].map(() => R.range(1, 3)); S.bOk = [0, 1, 2, 3].map(() => Math.random() < 0.8 - S.round * 0.06);
  },
  update(m, S, dt) {
    S.pt += dt;
    if (S.ph === 'parade') { if (S.pt > S.dur) { S.ph = 'ask'; S.pt = 0; Sfx.tone(660, 0.15, 'triangle', 0.05); } return; }
    if (S.ph === 'ask') {
      m.players.forEach((p, i) => { if (S.pick[i] >= 0) return; const d = abxyPress(m, i); if (d >= 0) { S.pick[i] = d; S.when[i] = S.pt; Sfx.click(); } });
      if (S.pick.every(p => p >= 0) || S.pt > 8) {
        const ok = [0, 1, 2, 3].filter(i => S.pick[i] >= 0 && S.opts[S.pick[i]] === S.ans).sort((a, b) => S.when[a] - S.when[b]);
        ok.forEach((i, k) => { S.pts[i] += k === 0 ? 3 : 2; });
        S.ph = 'show'; S.pt = 0; Sfx.coin();
      }
      return;
    }
    if (S.pt > 3) { if (S.round >= 5) m.finish(S.pts.slice()); else this.next(S); }
  },
  bot(m, S, i) {
    if (S.ph !== 'ask' || S.pick[i] >= 0 || S.pt < S.bAt[i]) { abxyBot(m, i, -1); return; }
    const right = S.opts.indexOf(S.ans); abxyBot(m, i, S.bOk[i] ? right : R.pick([0, 1, 2, 3].filter(d => d !== right)));
  },
  score(m, S) { return S.pts.slice(); },
  fmt(s) { return `${s} pts`; },
  hud(m, S, i) { return `${S.pts[i]} pts` + (S.ph === 'ask' && S.pick[i] >= 0 ? ' ✔' : ''); },
  critter(g, k, x, y, s, t) {
    const C = CRIT[k], hop = Math.abs(Math.sin(t * 9)) * 14 * s;
    MGH.shadow(g, x, y + 22 * s, 20 * s, 0.25);
    g.save(); g.translate(x, y - hop); g.scale(s, s);
    if (k === 0) { g.fillStyle = C.c; g.beginPath(); g.ellipse(0, 0, 22, 18, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(-6, -26, 5, 14, -0.2, 0, 7); g.ellipse(6, -26, 5, 14, 0.2, 0, 7); g.fill(); g.fillStyle = C.e; g.beginPath(); g.ellipse(-6, -26, 2, 9, -0.2, 0, 7); g.ellipse(6, -26, 2, 9, 0.2, 0, 7); g.fill(); }
    else if (k === 1) { g.fillStyle = C.c; g.beginPath(); g.ellipse(0, 4, 22, 15, 0, 0, 7); g.fill(); g.beginPath(); g.arc(-12, -12, 12, 0, 7); g.fill(); g.fillStyle = C.e; g.beginPath(); g.moveTo(-22, -12); g.lineTo(-34, -9); g.lineTo(-22, -6); g.fill(); }
    else { g.fillStyle = C.c; g.beginPath(); g.ellipse(0, 4, 24, 16, 0, 0, 7); g.fill(); g.beginPath(); g.arc(-10, -10, 8, 0, 7); g.arc(10, -10, 8, 0, 7); g.fill(); g.fillStyle = C.e; g.beginPath(); g.ellipse(0, 6, 12, 4, 0, 0, Math.PI); g.fill(); }
    g.fillStyle = '#222'; if (k === 2) { g.beginPath(); g.arc(-10, -11, 3, 0, 7); g.arc(10, -11, 3, 0, 7); g.fill(); } else { g.beginPath(); g.arc(k ? -14 : -8, k ? -14 : -4, 2.5, 0, 7); g.fill(); }
    g.restore();
  },
  draw(m, S, g) {
    MGH.scene(g, 'meadow', m.t);
    MGH.label(g, `Round ${S.round} of 5`, 160, 76, 20, '#ffe680');
    if (S.ph === 'parade') {
      MGH.label(g, 'Count everything that goes by!', 640, 120, 28, '#fff');
      S.list.forEach(c => { const x = -60 + (S.pt - c.t) * c.sp; if (x < -60 || x > 1340) return; this.critter(g, c.k, x, 360 + c.row * 110, 1.3, m.t + c.t); });
    } else {
      Char.npc(g, 640, 240, 40, 'host', { mood: S.ph === 'show' ? 'happy' : 'shout', look: { x: 0, y: 0.3 } });
      this.critter(g, S.q, 520, 200, 1.4, 0);
      MGH.label(g, `How many ${CRIT[S.q].n}?`, 640, 110, 34, '#fff');
      ABXY_POS.forEach(([x, y], d) => { const py = y + 90; g.fillStyle = S.ph === 'show' && S.opts[d] === S.ans ? '#7cf06a' : 'rgba(0,0,0,0.5)'; g.beginPath(); g.arc(x, py, 46, 0, 7); g.fill(); MGH.text(g, String(S.opts[d]), x, py + 16, 44, '#fff', 'center', 'bold'); abxyBadge(g, d, x + 40, py - 40, 15);
        if (S.ph === 'show') { const who = [0, 1, 2, 3].filter(i => S.pick[i] === d); who.forEach((i, k) => Char.draw(g, x + (k - (who.length - 1) / 2) * 36, py + 80, 14, m.players[i].el.id, m.players[i].color, { mood: S.opts[d] === S.ans ? 'cheer' : 'sad', seed: i * 1.7 })); } });
    }
    m.players.forEach((p, i) => { const x = 110 + (i % 2) * 1060, y = 260 + Math.floor(i / 2) * 300; Char.draw(g, x, y, 34, p.el.id, p.color, { mood: S.ph === 'parade' ? 'determined' : S.ph === 'ask' ? (S.pick[i] >= 0 ? 'smug' : 'nervous') : 'happy', seed: i * 1.7, look: { x: x < 640 ? 1 : -1, y: 0 } }); MGH.text(g, `${p.name}  ${S.pts[i]}`, x, y + 70, 18, p.color, 'center', 'bold'); if (S.ph === 'ask') MGH.text(g, S.pick[i] >= 0 ? '✔' : '…', x, y - 64, 18, '#7f7', 'center', 'bold'); });
  },
});

// ======================================================================== MARBLE MAZE (tilt your board, roll to the goal)
const MAZES = [
  { walls: [[0, 100, 200, 20], [100, 200, 200, 20], [0, 300, 200, 20]], holes: [[250, 60], [40, 250], [260, 260]] },
  { walls: [[90, 0, 20, 200], [190, 100, 20, 200], [90, 260, 120, 20]], holes: [[140, 60], [40, 200], [250, 160], [150, 200]] },
  { walls: [[60, 80, 240, 20], [0, 170, 220, 20], [80, 260, 220, 20]], holes: [[150, 160], [270, 225], [150, 20], [120, 245]] },
];
MG.def({
  id: 'marble', name: 'Marble Maze', type: 'Skill', controls: 'Move', dur: 50,
  rows: [['stick', 'Tilt the board']],
  how: 'Tilt your wooden board to roll the marble from the start (bottom-left) to the golden goal (top-right). The marble keeps rolling, so tilt gently! Fall in a hole and you\'re back at the start of that maze. Every goal earns a point and brings a new maze.',
  wins: 'Most goals.',
  init(m, S) { S.p = [0, 1, 2, 3].map(() => ({ x: 30, y: 290, vx: 0, vy: 0, mz: 0, goals: 0, fall: 0, plan: null })); },
  update(m, S, dt) {
    S.p.forEach((P, i) => {
      if (P.fall > 0) { P.fall -= dt; if (P.fall <= 0) { P.x = 30; P.y = 290; P.vx = P.vy = 0; } return; }
      const a = m.axis(i); P.vx += a.x * 520 * dt; P.vy += a.y * 520 * dt; P.vx *= Math.exp(-0.9 * dt); P.vy *= Math.exp(-0.9 * dt);
      const Z = MAZES[P.mz % 3], r = 10;
      const hit = (x, y) => x < r || x > 320 - r || y < r || y > 320 - r || Z.walls.some(([wx, wy, ww, wh]) => x > wx - r && x < wx + ww + r && y > wy - r && y < wy + wh + r);
      const nx = P.x + P.vx * dt; if (hit(nx, P.y)) P.vx *= -0.35; else P.x = nx;
      const ny = P.y + P.vy * dt; if (hit(P.x, ny)) P.vy *= -0.35; else P.y = ny;
      if (Z.holes.some(([hx, hy]) => dist(hx, hy, P.x, P.y) < 13)) { P.fall = 0.8; Sfx.bad(); }
      if (dist(295, 25, P.x, P.y) < 18) { P.goals++; P.mz++; P.x = 30; P.y = 290; P.vx = P.vy = 0; P.plan = null; Sfx.coin(); MGH.burst(this.ox(i) + 295, 150 + 25, ['#ffe680', '#fff'], 16, { speed: 200 }); }
    });
  },
  ox(i) { return 10 + i * 318; },
  bot(m, S, i) {
    const P = S.p[i], v = m.vin[i]; if (P.fall > 0) { v.ax = v.ay = 0; return; }
    // simple waypoint path per maze (computed once), then gentle steering with braking
    const W = [[[30, 290], [75, 280], [75, 160], [290, 160], [295, 25]], [[30, 290], [65, 235], [176, 238], [176, 30], [295, 25]], [[30, 290], [45, 240], [60, 205], [236, 208], [236, 118], [45, 118], [45, 55], [150, 60], [295, 25]]][P.mz % 3];
    if (P.plan === null || P.plan === undefined) P.plan = 1;
    const [tx, ty] = W[Math.min(P.plan, W.length - 1)]; if (dist(tx, ty, P.x, P.y) < 18 && P.plan < W.length - 1) P.plan++;
    if (!P.bk) P.bk = R.range(0.4, 0.9); if (Math.random() < 0.01) P.bk = R.range(0.35, 1.2); const dx = tx - P.x - P.vx * 0.45, dy = ty - P.y - P.vy * 0.45, l = Math.hypot(dx, dy) || 1, k = Math.min(1, l / 60) * P.bk;
    v.ax = dx / l * k; v.ay = dy / l * k;
  },
  score(m, S) { return S.p.map(P => P.goals); },
  fmt(s) { return `${s} goals`; },
  hud(m, S, i) { return `🏁 ${S.p[i].goals}`; },
  draw(m, S, g) {
    g.fillStyle = MGH.grad(g, 0, 720, ['#5a3a2a', '#3a2418']); g.fillRect(0, 0, 1280, 720);
    for (let i = 0; i < 4; i++) {
      const P = S.p[i], p = m.players[i], ox = this.ox(i), oy = 150, Z = MAZES[P.mz % 3], a = m.axis(i);
      g.save(); g.translate(ox + 160, oy + 160); g.transform(1, a.y * 0.04, a.x * 0.04, 1, 0, 0); g.translate(-160, -160);
      g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(8, 12, 320, 320);
      g.fillStyle = MGH.grad(g, 0, 320, ['#d8b880', '#b8945a']); g.fillRect(0, 0, 320, 320); g.strokeStyle = '#7a5a2a'; g.lineWidth = 8; g.strokeRect(0, 0, 320, 320);
      for (let k = 0; k < 8; k++) { g.strokeStyle = 'rgba(120,80,40,0.15)'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 20 + k * 40); g.lineTo(320, 30 + k * 40); g.stroke(); }
      Z.holes.forEach(([hx, hy]) => { g.fillStyle = '#1a0e08'; g.beginPath(); g.arc(hx, hy, 15, 0, 7); g.fill(); g.strokeStyle = '#5a3a1a'; g.lineWidth = 2; g.stroke(); });
      Z.walls.forEach(([wx, wy, ww, wh]) => { g.fillStyle = '#8a6a3a'; g.fillRect(wx, wy, ww, wh); g.fillStyle = 'rgba(255,255,255,0.2)'; g.fillRect(wx, wy, ww, 4); });
      MGH.glow(g, 295, 25, 30, 'rgba(255,220,100,0.7)'); g.fillStyle = '#ffd34d'; g.beginPath(); g.arc(295, 25, 16, 0, 7); g.fill(); MGH.text(g, '★', 295, 32, 18, '#fff', 'center', 'bold');
      g.fillStyle = 'rgba(255,255,255,0.3)'; g.beginPath(); g.arc(30, 290, 16, 0, 7); g.fill();
      const sc = P.fall > 0 ? P.fall / 0.8 : 1;
      if (sc > 0.05) { const gr = g.createRadialGradient(P.x - 3, P.y - 3, 1, P.x, P.y, 10 * sc); gr.addColorStop(0, '#fff'); gr.addColorStop(0.4, p.color); gr.addColorStop(1, '#222'); g.fillStyle = gr; g.beginPath(); g.arc(P.x, P.y, 10 * sc, 0, 7); g.fill(); }
      g.restore();
      Char.draw(g, ox + 160, 560, 34, p.el.id, p.color, { mood: MGH.persona(P.fall > 0 ? 'hurt' : 'determined', p.el.id), seed: i * 1.7, look: { x: a.x, y: -0.5 }, hands: { n: { x: -1, y: -1.2, d: -120, o: true, m: true }, f: { x: 1, y: -1.2, d: -60, o: true, m: false } } });
      MGH.text(g, `${p.name}  🏁 ${P.goals}`, ox + 160, 650, 20, p.color, 'center', 'bold');
    }
  },
});

// ======================================================================== RING TOSS (carnival, hold & release for distance)
MG.def({
  id: 'ringtoss', name: 'Ring Toss', type: 'Timing', controls: '1 button (hold & release)', dur: 0,
  rows: [['a', 'Hold for power, let go to toss']],
  how: 'Carnival time! Three pegs stand in your lane: the near one is worth 1, the middle 2 and the far one 3. HOLD A — the power bar swings up and down — and let go to toss your ring. Land it on a peg to score! Fourteen rings each — and no markers on the power bar, so it\'s all feel!',
  wins: 'Most points.',
  PEG: [{ d: 0.3, v: 1 }, { d: 0.58, v: 2 }, { d: 0.86, v: 3 }],
  init(m, S) { S.p = [0, 1, 2, 3].map(() => ({ n: 0, pts: 0, hold: 0, fly: null, on: [], tgt: null, wait: 0 })); },
  update(m, S, dt) {
    S.p.forEach((P, i) => {
      P.wait -= dt;
      if (P.fly) { P.fly.t += dt / 0.8; if (P.fly.t >= 1) { const pg = this.PEG.find(q => Math.abs(q.d - P.fly.pw) < 0.035); if (pg) { P.pts += pg.v; P.on.push(pg.d); Sfx.coin(); } else { P.on.push(-P.fly.pw); Sfx.tone(300, 0.08, 'triangle', 0.03); } P.fly = null; P.wait = 0.3; } return; }
      if (P.n >= 14 || P.wait > 0) return;
      if (m.held(i, 'a')) P.hold += dt; else if (P.hold > 0.08) { P.fly = { pw: swingP(P.hold), t: 0 }; P.n++; P.hold = 0; Sfx.whoosh(false); } else P.hold = 0;
    });
    if (S.p.every(P => P.n >= 14 && !P.fly)) { S.endT = (S.endT || 0) + dt; if (S.endT > 1) m.finish(this.score(m, S)); }
  },
  bot(m, S, i, dt) {
    const P = S.p[i], v = m.vin[i]; v.a = false; if (P.n >= 14 || P.fly || P.wait > 0) { P.tgt = null; return; }
    if (P.tgt === null) P.tgt = R.pick(this.PEG).d + R.range(-0.05, 0.05);
    const now = swingP(P.hold), nx = swingP(P.hold + 2 * dt);
    v.a = !(P.hold > 0.1 && now <= P.tgt && nx >= P.tgt);
  },
  score(m, S) { return S.p.map(P => P.pts); },
  fmt(s) { return `${s} pts`; },
  hud(m, S, i) { return `${S.p[i].pts} · ${8 - S.p[i].n} left`; },
  draw(m, S, g) {
    g.fillStyle = MGH.grad(g, 0, 720, ['#2a0a3a', '#5a1a4a']); g.fillRect(0, 0, 1280, 720);
    for (let k = 0; k < 30; k++) { const x = k * 44 + 10; g.fillStyle = ['#ffe680', '#ff6b8a', '#5ab8ff', '#7cf06a'][k % 4]; g.globalAlpha = 0.5 + 0.5 * Math.sin(m.t * 4 + k); g.beginPath(); g.arc(x, 40 + Math.sin(k) * 6, 6, 0, 7); g.fill(); } g.globalAlpha = 1;
    const X = d => 200 + d * 1000;
    for (let i = 0; i < 4; i++) {
      const P = S.p[i], p = m.players[i], L = MGM.lane(i, 90, 155), fy = L.y1 - 26;
      g.fillStyle = i % 2 ? '#c8445a' : '#e8e0d0'; g.fillRect(0, L.y0, 1280, L.h); g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(0, L.y1 - 6, 1280, 6);
      this.PEG.forEach(q => { const x = X(q.d); g.fillStyle = '#8a5a2a'; g.fillRect(x - 5, fy - 56, 10, 56); g.fillStyle = '#ffcf4a'; g.beginPath(); g.arc(x, fy - 58, 8, 0, 7); g.fill(); MGH.text(g, `${q.v}`, x, fy + 18, 16, '#5a2a1a', 'center', 'bold'); });
      P.on.forEach(d => { if (d > 0) { const x = X(d), k = P.on.filter(e => e === d).indexOf(d); g.strokeStyle = p.color; g.lineWidth = 5; g.beginPath(); g.ellipse(x, fy - 12 - P.on.slice(0, P.on.indexOf(d)).filter(e => e === d).length * 8, 18, 6, 0, 0, 7); g.stroke(); } else { g.strokeStyle = p.color; g.globalAlpha = 0.4; g.lineWidth = 4; g.beginPath(); g.ellipse(X(-d), fy - 2, 18, 5, 0, 0, 7); g.stroke(); g.globalAlpha = 1; } });
      if (P.fly) { const x = 130 + (X(P.fly.pw) - 130) * P.fly.t, y = fy - 60 - Math.sin(Math.PI * P.fly.t) * 70 + P.fly.t * 40; g.strokeStyle = p.color; g.lineWidth = 5; g.beginPath(); g.ellipse(x, y, 18, 8, Math.sin(m.t * 20) * 0.5, 0, 7); g.stroke(); }
      Char.draw(g, 90, fy - 30, 26, p.el.id, p.color, { mood: MGH.persona(P.hold > 0 ? 'effort' : 'happy', p.el.id), seed: i * 1.7, look: { x: 1, y: 0 } });
      g.fillStyle = 'rgba(0,0,0,0.45)'; MGH.rr(g, 140, L.y0 + 12, 14, 90, 6); g.fill(); const pw = P.hold > 0 ? swingP(P.hold) : 0; g.fillStyle = '#ffb13d'; g.fillRect(142, L.y0 + 100 - 86 * pw, 10, 86 * pw);
      MGH.text(g, `${P.pts} pts · ${14 - P.n} rings`, 1180, L.y0 + 28, 16, i % 2 ? '#fff' : '#5a2a1a', 'center', 'bold');
    }
  },
});
