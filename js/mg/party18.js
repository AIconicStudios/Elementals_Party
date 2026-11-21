'use strict';
// Party batch 13: Pillow Fight, Dragon Boat (2v2), Cliff Dive, Beach Sweep, Higher or Lower, Bucket Brigade (2v2), Heavy Hunch

// ======================================================================== PILLOW FIGHT (swing, block, knock the feathers out)
MG.def({
  id: 'pillow', name: 'Pillow Fight', type: 'Arena', controls: 'Move + A & B', dur: 50,
  rows: [['stick', 'Move'], ['a', 'Swing your pillow (hold for a big one)'], ['b', 'Hold to block']],
  how: 'Sleepover showdown! Tap A for a quick bop, or HOLD A to wind up a big WHUMP that knocks rivals flying. Hold B to block with your pillow (blocked bops bounce off — a big WHUMP breaks the block though!). Every hit knocks feathers out of the target\'s pillow and scores for you.',
  wins: 'Most hits.',
  init(m, S) { S.b = [0, 1, 2, 3].map(i => Object.assign(MGH.body(320 + (i % 2) * 640, 280 + Math.floor(i / 2) * 260, 26), { hold: 0, swing: 0, big: false, blk: false, stun: 0, hits: 0, cd: 0, feathers: 0 })); S.fx = []; },
  update(m, S, dt) {
    S.b.forEach((b, i) => {
      b.stun -= dt; b.swing -= dt; b.cd -= dt;
      const a = m.axis(i); b.blk = m.held(i, 'b') && b.stun <= 0 && b.hold <= 0;
      if (b.stun > 0) { b.vx *= 0.9; b.vy *= 0.9; } else MGH.steer(b, a.x, a.y, dt, 2000, b.blk ? 120 : b.hold > 0.2 ? 180 : 300, 7);
      MGH.integrate(b, dt, 120, 140, 1160, 690);
      if (b.stun <= 0 && !b.blk && b.cd <= 0) { if (m.held(i, 'a')) b.hold += dt; else if (b.hold > 0) { b.big = b.hold > 0.45; b.swing = 0.22; b.hold = 0; b.cd = b.big ? 0.8 : 0.35; this.hit(m, S, i); Sfx.whoosh(b.big); } }
    });
    MGH.collide(S.b, 0.6);
    S.fx.forEach(f => { f.t += dt; f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 60 * dt; f.vx *= 0.98; }); S.fx = S.fx.filter(f => f.t < 2.5);
  },
  hit(m, S, i) {
    const b = S.b[i];
    S.b.forEach((o, j) => {
      if (j === i || o.stun > 0.3) return; const dx = o.x - b.x, dy = o.y - b.y, d = Math.hypot(dx, dy); if (d > (b.big ? 110 : 85)) return;
      if ((dx * b.face.x + dy * b.face.y) / d < 0.2) return;
      if (o.blk && !b.big) { b.stun = 0.4; Sfx.tone(300, 0.08, 'triangle', 0.03); return; }
      o.stun = b.big ? 1 : 0.4; o.vx = dx / d * (b.big ? 700 : 300); o.vy = dy / d * (b.big ? 700 : 300); b.hits += b.big ? 2 : 1; Sfx.thud();
      for (let k = 0; k < (b.big ? 14 : 6); k++) S.fx.push({ x: o.x, y: o.y - 20, vx: R.range(-120, 120), vy: R.range(-160, 20), t: 0, r: R.range(0, 6) });
    });
  },
  bot(m, S, i, dt) {
    const b = S.b[i], v = m.vin[i]; v.a = v.b = false; if (b.stun > 0) return;
    const t = S.b.filter((o, j) => j !== i).sort((p, q) => dist(p.x, p.y, b.x, b.y) - dist(q.x, q.y, b.x, b.y))[0], d = dist(t.x, t.y, b.x, b.y);
    if (t.hold > 0.3 && d < 120 && Math.random() < 0.5) { v.b = true; return; }
    if (!b.plan) { b.plan = Math.random() < 0.35 ? 'big' : 'tap'; b.wait = R.range(0, 0.6); }
    b.wait -= dt; if (Math.random() < 0.004) b.roam = { x: R.range(200, 1080), y: R.range(200, 640), t: R.range(0.5, 1.5) };
    if (b.roam && (b.roam.t -= dt) > 0) { MGH.aim(m, i, b.roam.x, b.roam.y, b, 20); return; }
    MGH.aim(m, i, t.x, t.y, b, 40);
    if (d < 100 && b.cd <= 0 && b.wait <= 0) { if (b.plan === 'big') { v.a = b.hold < 0.55; if (!v.a) b.plan = null; } else { v.a = b.hold <= 0; if (b.hold > 0) b.plan = null; } }
  },
  score(m, S) { return S.b.map(b => b.hits); },
  fmt(s) { return `${s} hits`; },
  hud(m, S, i) { return `🪶 ${S.b[i].hits}`; },
  draw(m, S, g) {
    g.fillStyle = MGH.grad(g, 0, 720, ['#2a2050', '#4a3070']); g.fillRect(0, 0, 1280, 720);
    g.fillStyle = '#ffe8b0'; g.beginPath(); g.arc(1150, 100, 40, 0, 7); g.fill(); MGH.stars(g, m.t, 30, 140);
    g.fillStyle = MGH.grad(g, 140, 700, ['#ff9ac8', '#e87aa8']); MGH.rr(g, 100, 130, 1080, 570, 40); g.fill();
    for (let x = 140; x < 1160; x += 60) for (let y = 170; y < 680; y += 60) { g.fillStyle = 'rgba(255,255,255,0.12)'; g.beginPath(); g.arc(x, y, 8, 0, 7); g.fill(); }
    S.fx.forEach(f => { g.save(); g.translate(f.x, f.y); g.rotate(f.r + f.t * 3); g.globalAlpha = 1 - f.t / 2.5; g.fillStyle = '#fff'; g.beginPath(); g.ellipse(0, 0, 8, 3, 0, 0, 7); g.fill(); g.restore(); });
    const ents = S.b.map((b, i) => ({ y: b.y, f: () => {
      MGH.drawBody(g, b, m.players[i], '', b.stun > 0 ? 'dizzy' : b.hold > 0 ? 'effort' : b.blk ? 'determined' : 'happy');
      const d = b.face, ang = Math.atan2(d.y, d.x) + (b.swing > 0 ? (b.swing / 0.22 - 0.5) * 2.4 : b.hold > 0 ? -1.2 : b.blk ? 0 : 0.6);
      const px = b.x + Math.cos(ang) * (b.blk ? 30 : 40), py = b.y - 10 + Math.sin(ang) * (b.blk ? 30 : 40);
      g.save(); g.translate(px, py); g.rotate(ang + Math.PI / 2); g.fillStyle = b.blk ? '#fff6d8' : '#fff'; MGH.rr(g, -22, -14, 44, 28, 12); g.fill(); g.strokeStyle = m.players[i].color; g.lineWidth = 3; g.stroke(); g.restore();
      if (b.hold > 0.45) MGH.glow(g, b.x, b.y, 50, 'rgba(255,230,120,0.5)');
    } }));
    ents.sort((a, b) => a.y - b.y).forEach(e => e.f());
    m.players.forEach((p, i) => MGH.text(g, `${p.name} ${S.b[i].hits}`, 200 + i * 290, 110, 18, p.color, 'center', 'bold'));
  },
});

// ======================================================================== DRAGON BOAT (2 vs 2: alternate strokes on the drum beat)
MG.def({
  id: 'dragonboat', name: 'Dragon Boat', type: 'Race', mode: '2v2', sport: true, controls: '1 button', dur: 0,
  rows: [['a', 'Paddle on YOUR drum beat']],
  how: 'Team boat race! The drummer beats a steady rhythm: BOOM (big drum) is the FRONT paddler\'s stroke, tak (small drum) is the BACK paddler\'s. Press A right on your own beat. Strokes in time push the boat forward; off-beat strokes splash and slow you down. The drummer speeds up as you go!',
  wins: 'First boat to the finish.',
  LEN: 100,
  init(m, S) { S.t = 0; S.go = 2.4; S.tm = [0, 1].map(tm => ({ mem: [0, 1, 2, 3].filter(i => m.teamOf(i) === tm), d: 0, v: 0, fin: 0, fx: [] })); S.beat = 0.6; S.ph = 0; S.err = [0, 1, 2, 3].map(() => R.range(0.02, 0.07)); S.used = [0, 0, 0, 0]; },
  update(m, S, dt) {
    S.t += dt; if (S.t < S.go) return;
    const prev = S.ph; S.ph += dt / S.beat; S.beat = Math.max(0.36, 0.6 - (S.t - S.go) * 0.008);
    if (Math.floor(prev) !== Math.floor(S.ph)) Sfx.drum(Math.floor(S.ph) % 2);
    S.tm.forEach((T, tm) => {
      if (T.fin) return;
      T.mem.forEach((i, k) => {
        if (!m.pressed(i, 'a')) return;
        // beats alternate: even beats belong to the front paddler (k=0), odd beats to the back (k=1)
        const near = Math.round(S.ph), off = Math.abs(S.ph - near) * S.beat, mine = ((near % 2) + 2) % 2 === k;
        if (mine && off < 0.11 && S.used[i] !== near) { S.used[i] = near; T.v += off < 0.05 ? 2.6 : 1.7; T.fx.push({ k, ok: true, t: 0 }); }
        else { T.v *= 0.75; T.fx.push({ k, ok: false, t: 0 }); }
      });
      T.v *= Math.exp(-0.5 * dt); T.d += T.v * dt;
      T.fx.forEach(f => { f.t += dt; }); T.fx = T.fx.filter(f => f.t < 0.4);
      if (T.d >= this.LEN) { T.fin = S.t - S.go; Sfx.coin(); }
    });
    if (S.tm.every(T => T.fin) || S.t > 70) m.finish(this.score(m, S));
  },
  bot(m, S, i) {
    const v = m.vin[i]; v.a = false; if (S.t < S.go) return; const tm = m.teamOf(i), T = S.tm[tm], k = T.mem.indexOf(i);
    const next = Math.ceil(S.ph - 0.02), mine = ((next % 2) + 2) % 2 === k, to = (next - S.ph) * S.beat;
    if (mine && S.used[i] !== next && to < S.err[i] && !m.prev[i].a) { v.a = Math.random() < 0.9; S.used[i] = v.a ? S.used[i] : next; S.err[i] = R.range(0.0, 0.1); }
  },
  score(m, S) { return [0, 1, 2, 3].map(i => { const T = S.tm[m.teamOf(i)]; return T.fin ? 200 - T.fin : T.d; }); },
  fmt(s) { return s > 100 ? `${(200 - s).toFixed(1)}s` : `${Math.round(s)} m`; },
  hud(m, S, i) { return MG.TEAMN[m.teamOf(i)]; },
  draw(m, S, g) {
    MGH.scene(g, 'ocean', m.t); const X = d => 100 + d * 10.6;
    const beatK = 1 - (S.ph % 1), big = Math.floor(S.ph) % 2 === 0;
    S.tm.forEach((T, tm) => {
      const y = tm ? 520 : 300;
      g.fillStyle = 'rgba(30,110,180,0.4)'; g.fillRect(0, y - 70, 1280, 140); g.fillStyle = '#fff'; g.fillRect(X(this.LEN), y - 70, 8, 140);
      const x = X(Math.min(this.LEN, T.d));
      g.save(); g.translate(x, y);
      g.fillStyle = MG.TEAMC[tm]; g.beginPath(); g.moveTo(-120, 0); g.lineTo(110, 0); g.quadraticCurveTo(130, -10, 140, -40); g.lineTo(120, 20); g.lineTo(-110, 20); g.closePath(); g.fill();
      g.fillStyle = '#ffd34d'; g.beginPath(); g.arc(138, -44, 14, 0, 7); g.fill(); g.fillStyle = '#c82a2a'; g.beginPath(); g.moveTo(150, -44); g.lineTo(166, -40); g.lineTo(150, -36); g.fill();
      for (let k = -100; k < 110; k += 20) { g.fillStyle = 'rgba(255,255,255,0.3)'; g.fillRect(k, 4, 10, 3); }
      g.restore();
      Char.npc(g, x - 90, y - 30, 18, 'sensei', { mood: 'shout', look: { x: 1, y: 0 } }); g.fillStyle = '#a83a2a'; g.beginPath(); g.ellipse(x - 62, y - 20, 12, 8, 0, 0, 7); g.fill();
      T.mem.forEach((i, k) => { const p = m.players[i], px = x - 20 + k * -0 + (k ? -40 : 40), f = T.fx.find(f => f.k === k); Char.draw(g, px, y - 32, 18, p.el.id, p.color, { mood: MGH.persona(f ? (f.ok ? 'effort' : 'hurt') : 'determined', p.el.id), seed: i * 1.7, look: { x: 1, y: 0 }, noFeet: true }); g.strokeStyle = '#8a5a2a'; g.lineWidth = 4; const sw = f && f.ok ? -0.6 : 0.4; g.beginPath(); g.moveTo(px, y - 26); g.lineTo(px - 30 * Math.cos(sw), y + 20 + 10 * Math.sin(sw)); g.stroke(); if (f && !f.ok) MGH.text(g, 'splash!', px, y - 70, 14, '#ff8a8a', 'center', 'bold'); MGH.text(g, k ? 'tak' : 'BOOM', px, y + 46, 12, '#fff', 'center', 'bold'); });
      MGH.text(g, MG.TEAMN[tm] + (T.fin ? `  ${T.fin.toFixed(1)}s` : ''), 1180, y - 50, 18, MG.TEAMC[tm], 'center', 'bold');
    });
    // the drum
    MGH.glow(g, 640, 110, 40 + beatK * 30, big ? 'rgba(255,120,80,0.6)' : 'rgba(255,230,120,0.5)'); g.fillStyle = '#a83a2a'; g.beginPath(); g.ellipse(640, 110, 50 + (big ? beatK * 8 : 0), 30, 0, 0, 7); g.fill(); g.fillStyle = '#f4e0c0'; g.beginPath(); g.ellipse(640, 100, 44, 22, 0, 0, 7); g.fill();
    MGH.text(g, big ? 'BOOM' : 'tak', 640, 170, 24, big ? '#ff8a5a' : '#ffe680', 'center', 'bold');
    if (S.t < S.go) MGH.label(g, 'Get ready — paddle on YOUR beat!', 640, 230, 30, '#fff');
  },
});

// ======================================================================== CLIFF DIVE (jump, spin, enter the water straight)
MG.def({
  id: 'cliffdive', name: 'Cliff Dive', type: 'Skill', controls: 'Move + button', dur: 0,
  rows: [['a', 'Hold to bounce, let go to jump'], ['lr', 'Spin in the air'], ['pad', 'DOWN to straighten for entry']],
  how: 'Dive off the sea cliff! HOLD A to bounce on the board and let go at the top of the bounce for a big jump. In the air, hold LEFT or RIGHT to spin flips (each full flip scores). Before you hit the water, press DOWN to straighten out: a clean, straight-down entry earns a big bonus — a belly flop scores nothing! Three dives each.',
  wins: 'Best total score from the judges.',
  init(m, S) { S.r = 0; S.p = [0, 1, 2, 3].map(() => ({ tot: 0, last: 0, n: 0 })); this.next(S); },
  next(S) { S.r++; S.d = [0, 1, 2, 3].map(() => ({ st: 'board', hold: 0, h: 0, vy: 0, y: 0, rot: 0, flips: 0, straight: false, sc: 0, plan: R.range(0.75, 0.98), spinT: R.range(0.3, 0.7) })); S.ph = 'go'; S.pt = 0; },
  update(m, S, dt) {
    S.pt += dt;
    S.d.forEach((D, i) => {
      if (D.st === 'board') { if (m.held(i, 'a')) D.hold += dt; else if (D.hold > 0.1) { const pw = swingP(D.hold); D.vy = -(300 + pw * 500); D.st = 'air'; Sfx.whoosh(true); } return; }
      if (D.st === 'air') {
        D.vy += 900 * dt; D.y += D.vy * dt; const ax = m.axis(i);
        if (!D.straight) { D.rot += ax.x * 8 * dt; if (ax.y > 0.6 || m.pressed(i, 'down')) { D.straight = true; } }
        else D.rot += (Math.round(D.rot / (Math.PI * 2)) * Math.PI * 2 - D.rot) * 10 * dt;
        if (D.y > 520) { D.st = 'done'; D.flips = Math.floor(Math.abs(D.rot) / (Math.PI * 2) + 0.15); const off = Math.abs(((D.rot % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2) - Math.PI); const clean = D.straight && off < 0.4; D.sc = clean ? 4 + D.flips * 2 + (off < 0.15 ? 2 : 0) : off > 1.2 ? 0 : D.flips; S.p[i].tot += D.sc; S.p[i].last = D.sc; Sfx.noise(0.4, clean ? 2500 : 600, 0.08, clean ? 'highpass' : 'lowpass'); MGH.burst(160 + i * 320, 650, ['#bfe6ff', '#fff'], clean ? 8 : 24, { speed: clean ? 120 : 280 }); }
      }
    });
    if (S.d.every(D => D.st === 'done')) { S.endT = (S.endT || 0) + dt; if (S.endT > 2.2) { S.endT = 0; if (S.r >= 3) m.finish(this.score(m, S)); else this.next(S); } }
  },
  bot(m, S, i, dt) {
    const D = S.d[i], v = m.vin[i]; v.a = false; v.ax = v.ay = 0;
    if (D.st === 'board') { v.a = !(D.hold > 0.2 && swingP(D.hold) >= D.plan && swingP(D.hold + dt) < swingP(D.hold)) && D.hold < 2.6; return; }
    if (D.st !== 'air' || D.straight) return;
    const tLeft = (-D.vy + Math.sqrt(D.vy * D.vy + 1800 * (520 - D.y))) / 900;
    if (tLeft < D.spinT) v.ay = 1; else v.ax = 1;
  },
  score(m, S) { return S.p.map(P => P.tot); },
  fmt(s) { return `${s} pts`; },
  hud(m, S, i) { return `${S.p[i].tot} pts`; },
  draw(m, S, g) {
    MGH.scene(g, 'ocean', m.t);
    g.fillStyle = MGH.grad(g, 620, 720, ['#3a9ad8', '#1a6ab8']); g.fillRect(0, 620, 1280, 100);
    for (let i = 0; i < 4; i++) {
      const D = S.d[i], p = m.players[i], x = 160 + i * 320, top = 150;
      g.fillStyle = '#8a7a6a'; g.beginPath(); g.moveTo(x - 140, top + 20); g.lineTo(x - 40, top + 20); g.lineTo(x - 70, 620); g.lineTo(x - 150, 620); g.fill();
      const bnc = D.st === 'board' ? Math.sin(swingP(D.hold) * Math.PI) * 0 + swingP(D.hold) * 14 : 0;
      g.strokeStyle = '#c8904a'; g.lineWidth = 8; g.beginPath(); g.moveTo(x - 50, top + 20); g.lineTo(x + 10, top + 20 + bnc); g.stroke();
      if (D.st === 'board') { Char.draw(g, x, top - 14 + bnc, 22, p.el.id, p.color, { mood: MGH.persona('determined', p.el.id), seed: i * 1.7, look: { x: 1, y: 0 } }); g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(x + 30, top - 40, 8, 50); g.fillStyle = '#ffb13d'; g.fillRect(x + 30, top + 10 - 50 * swingP(D.hold), 8, 50 * swingP(D.hold)); }
      else if (D.st === 'air') { g.save(); g.translate(x + 40, top - 14 + D.y); g.rotate(D.rot); Char.draw(g, 0, 0, 22, p.el.id, p.color, { mood: MGH.persona(D.straight ? 'determined' : 'cheer', p.el.id), seed: i * 1.7, hands: D.straight ? { n: { x: -0.2, y: -2, d: -90, o: false, m: true }, f: { x: 0.2, y: -2, d: -90, o: false, m: false } } : undefined }); g.restore(); if (!D.straight) MGH.text(g, `${Math.floor(Math.abs(D.rot) / (Math.PI * 2))} flips`, x + 40, top - 60 + D.y, 14, '#fff', 'center', 'bold'); }
      else { const sc = D.sc; MGH.label(g, sc >= 8 ? `${sc} — PERFECT!` : sc >= 4 ? `${sc} — clean!` : sc ? `${sc}` : 'BELLY FLOP!', x + 40, 560, 18, sc >= 4 ? '#ffe680' : sc ? '#fff' : '#ff8a8a'); }
      MGH.text(g, `${p.name}  ${S.p[i].tot}`, x, 700, 18, p.color, 'center', 'bold');
    }
    MGH.label(g, `Dive ${S.r} of 3`, 640, 80, 22, '#fff');
  },
});

// ======================================================================== BEACH SWEEP (collect litter, dodge the crabs and waves)
MG.def({
  id: 'beach', name: 'Beach Sweep', type: 'Coins', controls: 'Move + button', dur: 45,
  rows: [['stick', 'Walk the beach'], ['a', 'Drop your bag in your bin']],
  how: 'Tidy the beach! Walk over litter to pick it up (you can carry six pieces), then bring it to YOUR bin and it counts. Grumpy crabs scuttle sideways — touch one and you drop everything. Waves wash up now and then and push you back up the sand. Cleanest helper wins!',
  wins: 'Most litter binned.',
  BIN: [[120, 200], [1160, 200], [120, 560], [1160, 560]],
  init(m, S) { S.b = [0, 1, 2, 3].map(i => Object.assign(MGH.body(this.BIN[i][0] + (i % 2 ? -80 : 80), this.BIN[i][1], 20), { carry: 0, bank: 0, stun: 0 })); S.lit = []; for (let k = 0; k < 14; k++) S.lit.push(this.litter()); S.crabs = [0, 1, 2].map(() => ({ x: R.range(300, 980), y: R.range(220, 620), vx: R.pick([-1, 1]) * R.range(90, 150), t: 0 })); S.wave = { t: R.range(5, 8), on: 0 }; },
  litter() { return { x: R.range(230, 1050), y: R.range(170, 660), k: R.int(0, 3) }; },
  update(m, S, dt) {
    S.wave.t -= dt; if (S.wave.t <= 0) { S.wave.on = 1.6; S.wave.t = R.range(6, 9); Sfx.noise(1, 500, 0.08, 'lowpass'); } S.wave.on -= dt;
    S.crabs.forEach(c => { c.t += dt; c.x += c.vx * dt; if (c.x < 220 || c.x > 1060) c.vx *= -1; c.y += Math.sin(c.t * 2) * 20 * dt; });
    S.b.forEach((b, i) => {
      b.stun -= dt; const a = m.axis(i);
      if (b.stun > 0) { b.vx *= 0.9; b.vy *= 0.9; } else MGH.steer(b, a.x, a.y, dt, 1800, 280 - b.carry * 12, 7);
      if (S.wave.on > 0 && b.y > 360) b.vy -= 900 * dt;
      MGH.integrate(b, dt, 40, 150, 1240, 700);
      S.lit.forEach(l => { if (!l.got && b.carry < 6 && dist(l.x, l.y, b.x, b.y) < 30) { l.got = true; b.carry++; Sfx.pop(); } });
      S.crabs.forEach(c => { if (b.stun <= 0 && dist(c.x, c.y, b.x, b.y) < 34) { b.stun = 0.9; for (let k = 0; k < b.carry; k++) S.lit.push({ x: b.x + R.range(-50, 50), y: b.y + R.range(-50, 50), k: R.int(0, 3) }); b.carry = 0; Sfx.bad(); } });
      const [bx, by] = this.BIN[i]; if (b.carry && dist(bx, by, b.x, b.y) < 60) { b.bank += b.carry; b.carry = 0; Sfx.coin(); }
    });
    S.lit = S.lit.filter(l => !l.got); while (S.lit.length < 12) S.lit.push(this.litter());
    MGH.collide(S.b, 0.6);
  },
  bot(m, S, i) {
    const b = S.b[i], v = m.vin[i], [bx, by] = this.BIN[i]; v.a = false;
    let g; if (b.carry >= 6 || (b.carry >= 3 && dist(bx, by, b.x, b.y) < 260)) g = { x: bx, y: by }; else g = S.lit.slice().sort((p, q) => dist(p.x, p.y, b.x, b.y) - dist(q.x, q.y, b.x, b.y))[0];
    let dx = g.x - b.x, dy = g.y - b.y; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
    S.crabs.forEach(c => { const d = dist(c.x, c.y, b.x, b.y); if (d < 90) { dx += (b.x - c.x) / d * 1.2; dy += (b.y - c.y) / d * 1.2; } });
    const n = Math.hypot(dx, dy) || 1; v.ax = dx / n; v.ay = dy / n;
  },
  score(m, S) { return S.b.map(b => b.bank); },
  fmt(s) { return `${s} pieces`; },
  hud(m, S, i) { return `🗑️ ${S.b[i].bank}` + (S.b[i].carry ? ` (+${S.b[i].carry})` : ''); },
  draw(m, S, g) {
    g.fillStyle = MGH.grad(g, 0, 720, ['#f4e0a8', '#e8c880']); g.fillRect(0, 0, 1280, 720);
    g.fillStyle = MGH.grad(g, 0, 150, ['#5ab8f0', '#8ad0f8']); g.fillRect(0, 40, 1280, 110);
    const wv = S.wave.on > 0 ? Math.sin((1 - S.wave.on / 1.6) * Math.PI) : 0; g.fillStyle = 'rgba(120,200,255,0.55)'; g.beginPath(); g.moveTo(0, 720); for (let x = 0; x <= 1280; x += 40) g.lineTo(x, 720 - wv * 360 + Math.sin(x * 0.03 + m.t * 3) * 10); g.lineTo(1280, 720); g.fill();
    this.BIN.forEach(([x, y], i) => { g.fillStyle = m.players[i].color; MGH.rr(g, x - 26, y - 36, 52, 66, 8); g.fill(); g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(x - 26, y - 36, 52, 10); MGH.text(g, `${S.b[i].bank}`, x, y + 12, 20, '#fff', 'center', 'bold'); });
    S.lit.forEach(l => { if (l.k === 0) { g.fillStyle = '#7ab8e8'; MGH.rr(g, l.x - 6, l.y - 14, 12, 26, 4); g.fill(); } else if (l.k === 1) { g.fillStyle = '#c8c8d0'; g.beginPath(); g.ellipse(l.x, l.y, 10, 7, 0.4, 0, 7); g.fill(); } else if (l.k === 2) { g.fillStyle = '#e84a4a'; g.fillRect(l.x - 10, l.y - 6, 20, 12); } else { g.fillStyle = '#fff'; g.beginPath(); g.moveTo(l.x - 10, l.y + 8); g.lineTo(l.x, l.y - 10); g.lineTo(l.x + 10, l.y + 8); g.fill(); } });
    S.crabs.forEach(c => { const cl = Math.sin(m.t * 10) * 3; g.fillStyle = '#e8503a'; g.beginPath(); g.ellipse(c.x, c.y, 22, 14, 0, 0, 7); g.fill(); g.beginPath(); g.arc(c.x - 26, c.y - 8 + cl, 8, 0, 7); g.arc(c.x + 26, c.y - 8 - cl, 8, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(c.x - 6, c.y - 14, 4, 0, 7); g.arc(c.x + 6, c.y - 14, 4, 0, 7); g.fill(); g.fillStyle = '#222'; g.beginPath(); g.arc(c.x - 6, c.y - 14, 2, 0, 7); g.arc(c.x + 6, c.y - 14, 2, 0, 7); g.fill(); });
    S.b.forEach((b, i) => { MGH.drawBody(g, b, m.players[i], '', b.stun > 0 ? 'hurt' : b.carry >= 6 ? 'effort' : 'happy'); if (b.carry) { g.fillStyle = '#5a8a3a'; g.beginPath(); g.arc(b.x + 22, b.y + 6, 6 + b.carry * 1.5, 0, 7); g.fill(); } });
  },
});

// ======================================================================== HIGHER OR LOWER (secret calls on the next card)
MG.def({
  id: 'highlow', name: 'Higher or Lower', type: 'Luck', controls: 'Move', dur: 0, noPadSkip: true,
  rows: [['pad', 'UP = higher · DOWN = lower']],
  how: 'A card is face-up. Will the next card be HIGHER or LOWER? Everyone secretly presses UP (higher) or DOWN (lower). Right calls add one to your streak; a wrong call loses your whole streak — unless you BANK it first by pressing LEFT or RIGHT instead (banking skips the call and saves your streak as points). Ten cards!',
  wins: 'Most banked points.',
  init(m, S) { S.cards = []; for (let k = 0; k < 11; k++) S.cards.push(R.int(1, 13)); for (let k = 1; k < 11; k++) while (S.cards[k] === S.cards[k - 1]) S.cards[k] = R.int(1, 13); S.k = 0; S.p = [0, 1, 2, 3].map(() => ({ streak: 0, bank: 0, call: null })); this.next(S); },
  next(S) { S.ph = 'call'; S.pt = 0; S.p.forEach(P => { P.call = null; }); S.bAt = [0, 1, 2, 3].map(() => R.range(0.6, 2)); },
  update(m, S, dt) {
    S.pt += dt;
    if (S.ph === 'call') {
      S.p.forEach((P, i) => { if (P.call) return; const a = m.axis(i); const c = m.pressed(i, 'up') || a.y < -0.6 ? 'hi' : m.pressed(i, 'down') || a.y > 0.6 ? 'lo' : m.pressed(i, 'left') || m.pressed(i, 'right') || Math.abs(a.x) > 0.6 ? 'bank' : null; if (c) { P.call = c; Sfx.click(); } });
      if (S.p.every(P => P.call) || S.pt > 6) { const a = S.cards[S.k], b = S.cards[S.k + 1], res = b > a ? 'hi' : 'lo'; S.p.forEach(P => { if (!P.call) P.call = 'bank'; if (P.call === 'bank') { P.bank += P.streak; P.gain = P.streak; P.streak = 0; } else if (P.call === res) { P.streak++; P.gain = 0; } else { P.gain = -P.streak; P.streak = 0; } }); S.ph = 'flip'; S.pt = 0; Sfx.drum(0); }
      return;
    }
    if (S.pt > 2.4) { S.k++; if (S.k >= 10) { S.p.forEach(P => { P.bank += P.streak; P.streak = 0; }); m.finish(this.score(m, S)); } else this.next(S); }
  },
  bot(m, S, i) {
    const P = S.p[i], v = m.vin[i]; v.ax = v.ay = 0; v.up = v.down = false; if (S.ph !== 'call' || P.call || S.pt < S.bAt[i]) return;
    const a = S.cards[S.k], pHi = (13 - a) / 12; if (P.streak >= 2 + R.int(0, 2) && Math.max(pHi, 1 - pHi) < 0.75) { v.ax = 1; return; }
    v.ay = Math.random() < (pHi > 0.5 ? 0.85 : 0.15) ? -1 : 1;
  },
  score(m, S) { return S.p.map(P => P.bank); },
  fmt(s) { return `${s} pts`; },
  hud(m, S, i) { const P = S.p[i]; return `${P.bank} banked · streak ${P.streak}` + (S.ph === 'call' && P.call ? ' ✔' : ''); },
  card(g, x, y, v, face) {
    g.fillStyle = 'rgba(0,0,0,0.3)'; MGH.rr(g, x - 66, y - 92, 140, 196, 14); g.fill();
    g.fillStyle = face ? '#fffaf0' : '#3a5ac8'; MGH.rr(g, x - 70, y - 98, 140, 196, 14); g.fill(); g.strokeStyle = face ? '#c8a060' : '#fff'; g.lineWidth = 4; g.stroke();
    if (face) { const n = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'][v]; MGH.text(g, n, x, y + 24, 72, v > 10 ? '#c82a2a' : '#2a2a3a', 'center', 'bold'); MGH.text(g, '★', x - 44, y - 60, 22, '#c8a060', 'center'); } else { for (let k = 0; k < 4; k++) MGH.star(g, x, y - 50 + k * 34, 10, 'rgba(255,255,255,0.4)', k, false); }
  },
  draw(m, S, g) {
    g.fillStyle = MGH.grad(g, 0, 720, ['#0a4a2a', '#06301a']); g.fillRect(0, 0, 1280, 720);
    g.fillStyle = '#0e5a34'; g.beginPath(); g.ellipse(640, 330, 520, 220, 0, 0, 7); g.fill(); g.strokeStyle = '#c8a060'; g.lineWidth = 8; g.stroke();
    MGH.label(g, `Card ${S.k + 1} of 10`, 640, 60, 22, '#ffe680');
    this.card(g, 540, 320, S.cards[S.k], true); this.card(g, 740, 320, S.cards[S.k + 1], S.ph === 'flip');
    MGH.text(g, '▲ higher   ▼ lower   ◀▶ bank', 640, 470, 18, '#cfe8d8', 'center', 'bold');
    m.players.forEach((p, i) => {
      const P = S.p[i], x = 160 + i * 320, y = 590;
      Char.draw(g, x, y, 34, p.el.id, p.color, { mood: MGH.persona(S.ph === 'flip' ? (P.gain > 0 ? 'cheer' : P.gain < 0 ? 'cry' : P.call === 'bank' ? 'happy' : 'cheer') : P.call ? 'smug' : 'nervous', p.el.id), seed: i * 1.7, look: { x: 0, y: -1 } });
      MGH.text(g, `${p.name}  🏦 ${P.bank}`, x, y + 66, 18, p.color, 'center', 'bold');
      for (let k = 0; k < P.streak; k++) { g.fillStyle = '#ffe680'; g.beginPath(); g.arc(x - 40 + k * 16, y - 58, 6, 0, 7); g.fill(); }
      if (S.ph === 'flip') MGH.label(g, P.call === 'bank' ? `banked ${P.gain}` : P.gain < 0 ? `lost ${-P.gain}!` : P.call === 'hi' ? '▲ ✔' : '▼ ✔', x, y - 86, 16, P.gain < 0 ? '#ff8a8a' : '#ffe680');
      else MGH.text(g, P.call ? '✔' : '…', x, y - 82, 18, '#7f7', 'center', 'bold');
    });
  },
});

// ======================================================================== BUCKET BRIGADE (2 vs 2: pump, pass, throw)
MG.def({
  id: 'buckets', name: 'Bucket Brigade', type: 'Timing', mode: '2v2', controls: '1 button', dur: 45,
  rows: [['a', 'Pumper: hold to fill · Thrower: throw on the target']],
  how: 'Each team has a fire to put out! The PUMPER holds A to fill the bucket — stop in the green, an overflowing bucket spills and has to be emptied. The bucket then slides to the THROWER, who presses A while the swinging aim is on the flames. Good throws shrink your fire. First team to put out its fire (or the smallest fire at the end) wins. Swap jobs at half time!',
  wins: 'Fire out first (or the smallest fire).',
  init(m, S) { S.half = false; S.t0 = [0, 1].map(tm => [0, 1, 2, 3].filter(i => m.teamOf(i) === tm)); S.tm = [0, 1].map(() => ({ fire: 1, fill: 0, st: 'pump', aim: 0, slide: 0, spill: 0, fx: '', fxT: 0, bt: R.range(0.55, 0.8) })); },
  roles(S, tm) { const [a, b] = S.t0[tm]; return S.half ? { pump: b, toss: a } : { pump: a, toss: b }; },
  update(m, S, dt) {
    if (!S.half && m.t > 22.5) { S.half = true; Sfx.whistle(); }
    S.tm.forEach((T, tm) => {
      const R_ = this.roles(S, tm); T.fxT -= dt; T.fire = Math.min(1, T.fire + dt * 0.012);
      if (T.st === 'pump') { T.spill -= dt; if (T.spill > 0) return; if (m.held(R_.pump, 'a')) { T.fill += dt * 0.65; if (T.fill > 1) { T.fill = 0; T.spill = 1; T.fx = 'overflow!'; T.fxT = 1; Sfx.bad(); } } else if (T.fill > 0.1) { T.q = T.fill >= 0.7 ? 1 : T.fill / 0.7 * 0.6; T.st = 'slide'; T.slide = 0; Sfx.tone(400, 0.05, 'triangle', 0.03); } return; }
      if (T.st === 'slide') { T.slide += dt * 2.5; if (T.slide >= 1) { T.st = 'aim'; T.aim = 0; } return; }
      if (T.st === 'aim') { T.aim += dt * 2.6; if (m.pressed(R_.toss, 'a') || T.aim > 6) { const off = Math.abs(Math.sin(T.aim)); const good = off < 0.25; T.fire = Math.max(0, T.fire - (good ? 0.16 : off < 0.5 ? 0.06 : 0) * T.q); T.fx = good ? 'SPLASH!' : off < 0.5 ? 'glanced' : 'missed!'; T.fxT = 0.8; T.st = 'pump'; T.fill = 0; Sfx.noise(0.4, 1400, 0.08, 'bandpass'); if (T.fire <= 0) { T.out = m.t; Sfx.coin(); } } }
    });
    if (S.tm.some(T => T.out)) m.finish(this.score(m, S));
  },
  bot(m, S, i) {
    const v = m.vin[i], tm = m.teamOf(i), T = S.tm[tm], R_ = this.roles(S, tm); v.a = false;
    if (i === R_.pump && T.st === 'pump' && T.spill <= 0) { v.a = T.fill < T.bt; if (!v.a) T.bt = R.range(0.6, 0.98); }
    if (i === R_.toss && T.st === 'aim' && Math.abs(Math.sin(T.aim)) < R.range(0.05, 0.3) && Math.random() < 0.3) v.a = true;
  },
  score(m, S) { return [0, 1, 2, 3].map(i => { const T = S.tm[m.teamOf(i)]; return T.out ? 200 - T.out : Math.round((1 - T.fire) * 100); }); },
  fmt(s) { return s > 100 ? `out in ${(200 - s).toFixed(1)}s` : `${s}% doused`; },
  hud(m, S, i) { const tm = m.teamOf(i); return MG.TEAMN[tm] + (this.roles(S, tm).pump === i ? ' · pumper' : ' · thrower'); },
  draw(m, S, g) {
    MGH.scene(g, 'sunset', m.t);
    S.tm.forEach((T, tm) => {
      const ox = tm ? 660 : 20, R_ = this.roles(S, tm), pp = m.players[R_.pump], tp = m.players[R_.toss];
      g.fillStyle = 'rgba(0,0,0,0.25)'; MGH.rr(g, ox, 140, 600, 540, 20); g.fill();
      // the burning hut
      const hx = ox + 470, hy = 420; g.fillStyle = '#8a5a3a'; g.fillRect(hx - 70, hy - 60, 140, 120); g.fillStyle = '#6a3a1a'; g.beginPath(); g.moveTo(hx - 90, hy - 60); g.lineTo(hx, hy - 140); g.lineTo(hx + 90, hy - 60); g.fill();
      for (let k = 0; k < 5; k++) MGH.flame(g, hx - 60 + k * 30, hy - 40 + (k % 2) * 30, 0.4 + T.fire * 0.9, m.t + k, k + tm);
      // pump, bucket, aim
      g.fillStyle = '#5a6a8a'; g.fillRect(ox + 60, 470, 30, 150); g.fillRect(ox + 40, 470, 70, 16);
      const bx = T.st === 'slide' ? ox + 110 + T.slide * 140 : T.st === 'aim' ? ox + 250 : ox + 110, by = 600;
      g.fillStyle = '#9aa0ad'; g.beginPath(); g.moveTo(bx - 22, by - 30); g.lineTo(bx + 22, by - 30); g.lineTo(bx + 16, by + 10); g.lineTo(bx - 16, by + 10); g.fill(); g.fillStyle = '#5ab8ff'; const lvl = T.st === 'pump' ? T.fill : T.q || 0; g.fillRect(bx - 20, by + 8 - 36 * Math.min(1, lvl), 40, 36 * Math.min(1, lvl));
      if (T.st === 'pump') { g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(ox + 150, 470, 14, 120); g.fillStyle = 'rgba(120,230,120,0.6)'; g.fillRect(ox + 150, 470 + 120 * 0, 14, 120 * 0.3); g.fillStyle = '#5ab8ff'; g.fillRect(ox + 150, 590 - 120 * Math.min(1, T.fill), 14, 120 * Math.min(1, T.fill)); }
      if (T.st === 'aim') { const ax = hx + Math.sin(T.aim) * 160; g.strokeStyle = Math.abs(Math.sin(T.aim)) < 0.25 ? '#7cf06a' : '#fff'; g.lineWidth = 4; g.beginPath(); g.arc(ax, hy - 20, 30, 0, 7); g.stroke(); }
      Char.draw(g, ox + 75, 430, 26, pp.el.id, pp.color, { mood: MGH.persona(T.spill > 0 ? 'hurt' : 'effort', pp.el.id), seed: R_.pump, look: { x: 1, y: 0 } });
      Char.draw(g, ox + 260, 540, 26, tp.el.id, tp.color, { mood: MGH.persona(T.st === 'aim' ? 'determined' : 'happy', tp.el.id), seed: R_.toss, look: { x: 1, y: -0.3 } });
      g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(ox + 380, 170, 180, 14); g.fillStyle = '#ff6a3a'; g.fillRect(ox + 380, 170, 180 * T.fire, 14); MGH.text(g, 'fire', ox + 470, 164, 14, '#fff', 'center', 'bold');
      MGH.text(g, MG.TEAMN[tm], ox + 120, 180, 22, MG.TEAMC[tm], 'center', 'bold');
      if (T.fxT > 0) MGH.label(g, T.fx, ox + 300, 260, 22, T.fx === 'SPLASH!' ? '#9fe0ff' : '#ff9a9a');
    });
    if (S.half && m.t < 24.5) MGH.label(g, 'SWAP JOBS!', 640, 100, 34, '#ffe680');
  },
});

// ======================================================================== HEAVY HUNCH (deduce the heaviest sack from the scales)
MG.def({
  id: 'heavy', name: 'Heavy Hunch', type: 'Deduction', controls: 'A B X Y', dur: 0, noPadSkip: true,
  rows: [['abxy', 'Pick the heaviest sack']],
  how: 'Four sacks of gold, labelled with the buttons: Y, B, A and X. One is the HEAVIEST. Watch the balance scales weigh pairs of sacks one after another, then secretly press the button of the sack you think is heaviest. Right = 2 points (3 if you were the quickest right answer)! The weigh-ins get trickier each round.',
  wins: 'Most points after six rounds.',
  init(m, S) { S.pts = [0, 0, 0, 0]; S.round = 0; this.next(S); },
  next(S) {
    S.round++; S.w = R.shuffle([4, 3, 2, 1]); S.heavy = S.w.indexOf(4);
    // weigh-ins: enough to pin down the heaviest, fewer clues in later rounds (then guesswork helps)
    const pairs = R.shuffle([[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]]), need = []; const beat = [0, 0, 0, 0];
    for (const pr of pairs) { need.push(pr); const [a, b] = pr; if (S.w[a] > S.w[b]) beat[a]++; else beat[b]++; if (beat[S.heavy] >= 3 - (S.round > 4 ? 1 : 0) && need.length >= 3) break; }
    S.pairs = need; S.ph = 'weigh'; S.pt = 0; S.pick = [-1, -1, -1, -1]; S.when = [0, 0, 0, 0]; S.bAt = [0, 1, 2, 3].map(() => R.range(0.8, 3)); S.bOk = [0, 1, 2, 3].map(() => Math.random() < 0.75);
  },
  update(m, S, dt) {
    S.pt += dt;
    if (S.ph === 'weigh') { if (S.pt > S.pairs.length * 1.5 + 0.5) { S.ph = 'pick'; S.pt = 0; Sfx.tone(700, 0.1, 'triangle', 0.04); } return; }
    if (S.ph === 'pick') {
      m.players.forEach((p, i) => { if (S.pick[i] >= 0) return; const d = abxyPress(m, i); if (d >= 0) { S.pick[i] = d; S.when[i] = S.pt; Sfx.click(); } });
      if (S.pick.every(p => p >= 0) || S.pt > 8) { const ok = [0, 1, 2, 3].filter(i => S.pick[i] === S.heavy).sort((a, b) => S.when[a] - S.when[b]); ok.forEach((i, k) => { S.pts[i] += k === 0 ? 3 : 2; }); S.ph = 'show'; S.pt = 0; Sfx.coin(); }
      return;
    }
    if (S.pt > 2.6) { if (S.round >= 6) m.finish(S.pts.slice()); else this.next(S); }
  },
  bot(m, S, i) {
    if (S.ph !== 'pick' || S.pick[i] >= 0 || S.pt < S.bAt[i]) { abxyBot(m, i, -1); return; }
    // count wins from the weigh-ins (a bot may miss one)
    const win = [0, 0, 0, 0], lose = [0, 0, 0, 0]; S.pairs.forEach(([a, b]) => { if (!S.bOk[i] && Math.random() < 0.3) return; if (S.w[a] > S.w[b]) { win[a]++; lose[b]++; } else { win[b]++; lose[a]++; } });
    const cand = [0, 1, 2, 3].filter(k => lose[k] === 0); abxyBot(m, i, cand.length ? R.pick(cand) : R.int(0, 3));
  },
  score(m, S) { return S.pts.slice(); },
  fmt(s) { return `${s} pts`; },
  hud(m, S, i) { return `${S.pts[i]} pts` + (S.ph === 'pick' && S.pick[i] >= 0 ? ' ✔' : ''); },
  sack(g, x, y, d, s = 1) { g.fillStyle = '#c8a060'; g.beginPath(); g.ellipse(x, y, 30 * s, 34 * s, 0, 0, 7); g.fill(); g.fillStyle = '#a8803a'; g.fillRect(x - 8 * s, y - 40 * s, 16 * s, 10 * s); MGH.text(g, '$', x, y + 10 * s, 28 * s, '#7a5a1a', 'center', 'bold'); abxyBadge(g, d, x + 26 * s, y - 30 * s, 13 * s); },
  draw(m, S, g) {
    g.fillStyle = MGH.grad(g, 0, 720, ['#4a3020', '#2a1a10']); g.fillRect(0, 0, 1280, 720);
    MGH.label(g, `Round ${S.round} of 6 — which sack is heaviest?`, 640, 64, 22, '#ffe680');
    // the scale shows the current pair (or the record of all weigh-ins)
    const k = S.ph === 'weigh' ? Math.min(S.pairs.length - 1, Math.floor(S.pt / 1.5)) : -1;
    if (k >= 0) { const [a, b] = S.pairs[k], tilt = (S.w[a] > S.w[b] ? -1 : 1) * Math.min(1, (S.pt - k * 1.5) / 0.5) * 0.25; g.fillStyle = '#8a6a3a'; g.fillRect(632, 200, 16, 230); g.save(); g.translate(640, 200); g.rotate(tilt); g.fillStyle = '#c8a060'; g.fillRect(-240, -6, 480, 12); g.restore(); const ly = 200 - Math.sin(tilt) * 240, ry = 200 + Math.sin(tilt) * 240; g.strokeStyle = '#c8a060'; g.lineWidth = 3; g.beginPath(); g.moveTo(400, ly); g.lineTo(400, ly + 90); g.moveTo(880, ry); g.lineTo(880, ry + 90); g.stroke(); g.fillStyle = '#8a6a3a'; g.fillRect(340, ly + 90, 120, 8); g.fillRect(820, ry + 90, 120, 8); this.sack(g, 400, ly + 56, a); this.sack(g, 880, ry + 56, b); }
    // weigh-in record so far
    const shown = S.ph === 'weigh' ? k : S.pairs.length - 1;
    S.pairs.slice(0, shown + 1).forEach(([a, b], j) => { const y = 480 + j * 34, hv = S.w[a] > S.w[b] ? a : b, lt = hv === a ? b : a; abxyBadge(g, hv, 600, y, 13); MGH.text(g, 'heavier than', 660, y + 5, 15, '#fff', 'center'); abxyBadge(g, lt, 720, y, 13); });
    if (S.ph === 'show') { const [x, y] = ABXY_POS[S.heavy]; MGH.label(g, 'Heaviest:', 560, 300, 26, '#ffe680'); this.sack(g, 700, 300, S.heavy, 1.4); }
    m.players.forEach((p, i) => { const x = 110 + (i % 2) * 1060, y = 230 + Math.floor(i / 2) * 300; Char.draw(g, x, y, 34, p.el.id, p.color, { mood: S.ph === 'show' ? (S.pick[i] === S.heavy ? 'cheer' : 'sad') : S.ph === 'pick' ? (S.pick[i] >= 0 ? 'smug' : 'nervous') : 'determined', seed: i * 1.7, look: { x: x < 640 ? 1 : -1, y: 0 } }); MGH.text(g, `${p.name}  ${S.pts[i]}`, x, y + 70, 18, p.color, 'center', 'bold'); if (S.ph === 'pick') MGH.text(g, S.pick[i] >= 0 ? '✔' : '…', x, y - 66, 18, '#7f7', 'center', 'bold'); });
  },
});
