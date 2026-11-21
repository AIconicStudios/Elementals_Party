'use strict';
// Party batch 9: Snowball Fight (2v2), Sushi Train, Space Lander, Duck Gallery, Spot It, Pinball Duel (2v2)

// ======================================================================== SNOWBALL FIGHT (2 vs 2, lob over the forts)
MG.def({
  id: 'snowfight', name: 'Snowball Fight', type: 'Arena', mode: '2v2', sport: true, controls: 'Move + A & B', dur: 60,
  rows: [['lr', 'Move'], ['a', 'Hold for power, let go to throw'], ['b', 'Hold to duck behind the wall']],
  how: 'Two snow forts face each other. HOLD A to pack a snowball — the power bar swings — and let go to lob it over the walls: more power flies further. Hold B to duck behind your wall (you can\'t throw while ducking). Every hit scores for your team and leaves the target dizzy for a moment.',
  wins: 'Team with the most hits.',
  WALL: [430, 850], GY: 620,
  init(m, S) {
    S.hits = [0, 0]; const k = [0, 0];
    S.p = m.players.map((p, i) => { const tm = m.teamOf(i), j = k[tm]++; return { tm, x: tm ? 960 + j * 170 : 150 + j * 170, hold: 0, cd: 0, stun: 0, duck: false, tgt: 0.5 }; });
    S.balls = [];
  },
  zone(tm) { return tm ? [900, 1240] : [40, 380]; },
  update(m, S, dt) {
    S.p.forEach((P, i) => {
      P.cd -= dt; P.stun -= dt;
      if (P.stun > 0) { P.hold = 0; P.duck = false; return; }
      P.duck = m.held(i, 'b');
      const z = this.zone(P.tm); if (!P.duck) P.x = clamp(P.x + m.axis(i).x * 260 * dt, z[0], z[1]);
      if (!P.duck && P.cd <= 0 && m.held(i, 'a')) P.hold += dt;
      else if (P.hold > 0.08 && !P.duck) { const pw = swingP(P.hold), d = P.tm ? -1 : 1; S.balls.push({ x: P.x + d * 20, y: this.GY - 70, vx: d * (360 + pw * 720), vy: -520, own: i, tm: P.tm }); P.hold = 0; P.cd = 0.7; Sfx.whoosh(false); }
      else P.hold = 0;
    });
    S.balls.forEach(b => {
      b.vy += 1100 * dt; b.x += b.vx * dt; b.y += b.vy * dt;
      for (const wx of this.WALL) if (Math.abs(b.x - wx) < 34 && b.y > this.GY - 90) { b.dead = true; MGH.burst(b.x, b.y, ['#fff', '#dff4ff'], 10, { speed: 140 }); Sfx.thud(); }
      S.p.forEach((P, j) => { if (b.dead || P.tm === b.tm || P.stun > 0) return; const top = this.GY - (P.duck ? 50 : 100); if (Math.abs(b.x - P.x) < 28 && b.y > top && b.y < this.GY) { b.dead = true; P.stun = 1.2; S.hits[b.tm]++; Sfx.punch(); MGH.burst(b.x, b.y, ['#fff', '#bfe6ff'], 18, { speed: 220 }); } });
      if (b.y > this.GY) { b.dead = true; MGH.burst(b.x, this.GY, ['#fff'], 6, { speed: 100 }); }
    });
    S.balls = S.balls.filter(b => !b.dead && b.x > -50 && b.x < 1330);
  },
  bot(m, S, i, dt) {
    const P = S.p[i], v = m.vin[i]; v.a = v.b = false; v.ax = 0; if (P.stun > 0) return;
    const inc = S.balls.find(b => b.tm !== P.tm && Math.abs(b.x - P.x) < 220 && b.vy > -200);
    if (inc && Math.random() < 0.6) { v.b = true; return; }
    if (!P.wander || Math.random() < 0.01) P.wander = R.range(...this.zone(P.tm)); v.ax = Math.abs(P.wander - P.x) > 20 ? Math.sign(P.wander - P.x) : 0;
    if (P.cd > 0) return;
    const foe = S.p.filter(o => o.tm !== P.tm && o.stun <= 0).sort((a, b) => Math.abs(a.x - P.x) - Math.abs(b.x - P.x))[0]; if (!foe) return;
    // range on flat ground: vx * 2 * 520 / 1100, aim a little off like a person
    if (!P.hold) P.tgt = clamp((Math.abs(foe.x - P.x) / (2 * 520 / 1100) - 360) / 720 + R.range(-0.07, 0.07), 0.02, 0.98);
    const now = swingP(P.hold), nx = swingP(P.hold + 2 * dt);
    v.a = !(P.hold > 0.1 && now <= P.tgt && nx >= P.tgt);
  },
  score(m, S) { return m.players.map((p, i) => S.hits[m.teamOf(i)]); },
  fmt(s) { return `${s} hits`; },
  hud(m, S, i) { return MG.TEAMN[m.teamOf(i)]; },
  draw(m, S, g) {
    MGH.scene(g, 'ice', m.t);
    g.fillStyle = MGH.grad(g, this.GY - 10, 720, ['#f4faff', '#d8ecf8']); g.fillRect(0, this.GY - 10, 1280, 140);
    MGH.text(g, `${S.hits[0]}`, 560, 80, 44, MG.TEAMC[0], 'center', 'bold'); MGH.text(g, `${S.hits[1]}`, 720, 80, 44, MG.TEAMC[1], 'center', 'bold');
    for (const wx of this.WALL) { for (let k = 0; k < 4; k++) for (let q = 0; q < 2; q++) { g.fillStyle = '#f4faff'; g.beginPath(); g.ellipse(wx - 18 + q * 36, this.GY - 12 - k * 22, 22, 13, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(150,190,220,0.6)'; g.lineWidth = 2; g.stroke(); } }
    g.fillStyle = MG.TEAMC[0]; g.fillRect(380, this.GY - 120, 4, 40); g.fillStyle = MG.TEAMC[1]; g.fillRect(896, this.GY - 120, 4, 40);
    S.p.forEach((P, i) => {
      const p = m.players[i], d = P.tm ? -1 : 1;
      MGH.shadow(g, P.x, this.GY + 4, 26, 0.25);
      g.save(); if (P.duck) { g.translate(P.x, this.GY); g.scale(1, 0.62); g.translate(-P.x, -this.GY); }
      Char.draw(g, P.x, this.GY - 44, 30, p.el.id, p.color, { mood: MGH.persona(P.stun > 0 ? 'dizzy' : P.hold > 0 ? 'determined' : P.duck ? 'scared' : 'happy', p.el.id), seed: i * 1.7, look: { x: d, y: 0 }, hands: P.hold > 0 ? { n: { x: -0.6 * d, y: -1.6, d: d > 0 ? -150 : -30, o: true, m: true }, f: { x: 0.8 * d, y: 0.2, d: 90, o: true, m: false } } : undefined });
      g.restore();
      if (P.hold > 0) { g.fillStyle = '#fff'; g.beginPath(); g.arc(P.x - d * 12, this.GY - 112, 9, 0, 7); g.fill(); g.fillStyle = 'rgba(0,0,0,0.5)'; MGH.rr(g, P.x - 30, this.GY - 150, 60, 10, 5); g.fill(); g.fillStyle = '#5ab8ff'; MGH.rr(g, P.x - 30, this.GY - 150, 60 * swingP(P.hold), 10, 5); g.fill(); }
      g.fillStyle = MG.TEAMC[P.tm]; g.fillRect(P.x - 14, this.GY + 14, 28, 5);
    });
    S.balls.forEach(b => { g.fillStyle = '#fff'; g.beginPath(); g.arc(b.x, b.y, 9, 0, 7); g.fill(); g.strokeStyle = '#bfd8e8'; g.lineWidth = 1.5; g.stroke(); });
  },
});

// ======================================================================== SUSHI TRAIN (grab the dishes on your order card)
const SUSHI = [{ n: 'salmon', c: '#ff8a5a' }, { n: 'tuna', c: '#e84a5a' }, { n: 'egg', c: '#ffd34d' }, { n: 'cucumber', c: '#7ccf4a' }, { n: 'shrimp', c: '#ffb8a0' }];
MG.def({
  id: 'sushi', name: 'Sushi Train', type: 'Reaction', controls: '1 button', dur: 45,
  rows: [['a', 'Grab the plate in front of you']],
  how: 'Plates of sushi glide along the conveyor belt past your seat. Your order card shows three dishes — press A to grab a plate while it is in front of you (inside your glowing zone). The right dish ticks off your card; a wrong one makes you wait. Finish a card for 3 points and get a new order! The belt changes direction now and then.',
  wins: 'Most points.',
  SEATS: [200, 480, 800, 1080],
  init(m, S) { S.dir = 1; S.flip = 15; S.plates = []; S.spawn = 0; S.p = [0, 1, 2, 3].map(() => ({ card: this.card(), got: [false, false, false], pts: 0, stun: 0, fx: '', fxT: 0, react: R.range(0.1, 0.35) })); },
  card() { return [R.int(0, 4), R.int(0, 4), R.int(0, 4)]; },
  update(m, S, dt) {
    S.flip -= dt; if (S.flip <= 0) { S.flip = R.range(12, 18); S.dir *= -1; Sfx.tone(400, 0.2, 'triangle', 0.04, -200); }
    S.spawn -= dt; if (S.spawn <= 0) { S.spawn = R.range(0.35, 0.6); S.plates.push({ x: S.dir > 0 ? -40 : 1320, k: R.int(0, 4) }); }
    S.plates.forEach(pl => { pl.x += S.dir * 190 * dt; }); S.plates = S.plates.filter(pl => !pl.gone && pl.x > -60 && pl.x < 1340);
    S.p.forEach((P, i) => {
      P.stun -= dt; P.fxT -= dt;
      if (P.stun > 0 || !m.pressed(i, 'a')) return;
      const sx = this.SEATS[i], pl = S.plates.filter(q => Math.abs(q.x - sx) < 60).sort((a, b) => Math.abs(a.x - sx) - Math.abs(b.x - sx))[0];
      if (!pl) return;
      pl.gone = true; const need = P.card.findIndex((k, j) => k === pl.k && !P.got[j]);
      if (need >= 0) { P.got[need] = true; Sfx.pop(); if (P.got.every(x => x)) { P.pts += 3; P.fx = 'ORDER UP! +3'; P.fxT = 1.2; P.card = this.card(); P.got = [false, false, false]; Sfx.coin(); } }
      else { P.stun = 1; P.fx = 'not on my card!'; P.fxT = 1; Sfx.bad(); }
    });
  },
  bot(m, S, i) {
    const P = S.p[i], v = m.vin[i]; v.a = false; if (P.stun > 0) return;
    const sx = this.SEATS[i], pl = S.plates.find(q => Math.abs(q.x - sx) < 45 && P.card.some((k, j) => k === q.k && !P.got[j]));
    if (pl) { P.w = (P.w || 0) + 1 / 60; if (P.w > P.react) { v.a = true; P.w = 0; P.react = R.range(0.08, 0.4); } } else P.w = 0;
  },
  score(m, S) { return S.p.map(P => P.pts + P.got.filter(x => x).length * 0.5); },
  fmt(s) { return `${s} pts`; },
  hud(m, S, i) { return `${S.p[i].pts} pts`; },
  plate(g, x, y, k, s = 1) {
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(x, y + 8 * s, 32 * s, 10 * s, 0, 0, 7); g.fill(); g.strokeStyle = '#c84a4a'; g.lineWidth = 2; g.stroke();
    for (const dx of [-11, 11]) { g.fillStyle = '#f4f4f4'; MGH.rr(g, x + dx * s - 10 * s, y - 6 * s, 20 * s, 12 * s, 4 * s); g.fill(); g.fillStyle = SUSHI[k].c; MGH.rr(g, x + dx * s - 10 * s, y - 10 * s, 20 * s, 7 * s, 3 * s); g.fill(); }
  },
  draw(m, S, g) {
    g.fillStyle = MGH.grad(g, 0, 720, ['#f4e0c0', '#e8c890']); g.fillRect(0, 0, 1280, 720);
    for (let x = 0; x < 1280; x += 160) { g.fillStyle = '#c84a3a'; g.fillRect(x + 20, 30, 120, 60); g.fillStyle = '#ffe680'; g.beginPath(); g.arc(x + 80, 60, 16, 0, 7); g.fill(); }
    g.fillStyle = '#5a5a6a'; g.fillRect(0, 300, 1280, 90); g.fillStyle = '#8a8a9a'; g.fillRect(0, 300, 1280, 8); g.fillRect(0, 382, 1280, 8);
    for (let x = ((m.t * 190 * S.dir) % 40 + 40) % 40; x < 1280; x += 40) { g.fillStyle = 'rgba(0,0,0,0.15)'; g.fillRect(x, 310, 3, 72); }
    MGH.text(g, S.dir > 0 ? '▶ ▶ ▶' : '◀ ◀ ◀', 640, 290, 18, '#8a3a2a', 'center', 'bold');
    this.SEATS.forEach((sx, i) => { g.fillStyle = m.players[i].color + '33'; g.fillRect(sx - 60, 300, 120, 90); g.strokeStyle = m.players[i].color; g.lineWidth = 3; g.strokeRect(sx - 60, 300, 120, 90); });
    S.plates.forEach(pl => this.plate(g, pl.x, 345, pl.k));
    g.fillStyle = '#a8703a'; g.fillRect(0, 470, 1280, 40);
    S.p.forEach((P, i) => {
      const p = m.players[i], sx = this.SEATS[i];
      Char.draw(g, sx, 450, 40, p.el.id, p.color, { mood: MGH.persona(P.stun > 0 ? 'hurt' : P.fxT > 0 ? 'cheer' : 'determined', p.el.id), seed: i * 1.7, look: { x: 0, y: -1 } });
      g.fillStyle = '#fffaf0'; MGH.rr(g, sx - 100, 530, 200, 100, 12); g.fill(); g.strokeStyle = p.color; g.lineWidth = 3; g.stroke();
      P.card.forEach((k, j) => { this.plate(g, sx - 62 + j * 62, 570, k, 0.75); if (P.got[j]) MGH.text(g, '✔', sx - 62 + j * 62, 580, 34, '#3a9a3a', 'center', 'bold'); });
      MGH.text(g, `${p.name}  ${P.pts}`, sx, 660, 20, p.color, 'center', 'bold');
      if (P.fxT > 0) MGH.label(g, P.fx, sx, 230, 18, P.fx.includes('+3') ? '#ffe680' : '#ff9a9a');
    });
  },
});

// ======================================================================== SPACE LANDER (thrust and tilt onto the pad)
MG.def({
  id: 'lander', name: 'Space Lander', type: 'Skill', controls: 'Move + button', dur: 0,
  rows: [['a', 'Hold to fire the thruster'], ['lr', 'Tilt']],
  how: 'Bring your little lander down onto the glowing pad! HOLD A to fire the thruster (it pushes the way your ship points) and tilt with LEFT/RIGHT. Touch down gently and level — come in too fast or crooked and you crash. First to land each round scores 3, then 2, then 1. Three rounds.',
  wins: 'Most points after three rounds.',
  init(m, S) { S.pts = [0, 0, 0, 0]; S.round = 0; this.next(S); },
  next(S) { S.round++; S.pad = R.range(70, 250); S.ph = 'fly'; S.pt = 0; S.order = []; S.p = [0, 1, 2, 3].map(() => ({ x: R.range(40, 280), y: 150, vx: R.range(-40, 40), vy: 0, a: 0, fuel: 1, st: 'fly', sc: 0, k: R.range(0.8, 1.3) })); },
  update(m, S, dt) {
    S.pt += dt;
    if (S.ph === 'fly') {
      S.p.forEach((P, i) => {
        if (P.st !== 'fly') return;
        P.a = clamp(P.a + m.axis(i).x * 2.4 * dt, -1.1, 1.1);
        const th = m.held(i, 'a') && P.fuel > 0; if (th) { P.vx += Math.sin(P.a) * 260 * dt; P.vy -= Math.cos(P.a) * 260 * dt; P.fuel = Math.max(0, P.fuel - dt * 0.09); }
        P.vy += 110 * dt; P.x += P.vx * dt; P.y += P.vy * dt; P.x = clamp(P.x, 18, 302); if (P.y < 70) { P.y = 70; P.vy = Math.max(0, P.vy); }
        P.th = th;
        if (P.y >= 640) {
          P.y = 640; const onPad = Math.abs(P.x - S.pad) < 40, soft = P.vy < 70 && Math.abs(P.vx) < 50 && Math.abs(P.a) < 0.3;
          if (onPad && soft) { P.st = 'land'; S.order.push(i); P.sc = [3, 2, 1, 0][S.order.length - 1]; S.pts[i] += P.sc; Sfx.coin(); }
          else { P.st = 'crash'; Sfx.boom(); MGH.burst(i * 320 + P.x, 640, ['#ffb13d', '#ff5a3a', '#888'], 24, { speed: 260 }); }
        }
      });
      if (S.p.every(P => P.st !== 'fly') || S.pt > 30) { S.ph = 'show'; S.pt = 0; }
      return;
    }
    if (S.pt > 2.5) { if (S.round >= 3) m.finish(S.pts.slice()); else this.next(S); }
  },
  bot(m, S, i) {
    const P = S.p[i], v = m.vin[i]; v.a = false; v.ax = 0; if (P.st !== 'fly') return;
    const dx = S.pad - P.x, h = 640 - P.y;
    const wantVx = clamp(dx * 0.6, -70, 70) * (h > 60 ? 1 : 0.3), wantA = clamp((wantVx - P.vx) * 0.012 * P.k, -0.5, 0.5) * (h < 40 ? 0 : 1);
    v.ax = clamp((wantA - P.a) * 4, -1, 1);
    const wantVy = h > 200 ? 140 : h > 60 ? 70 : 35; v.a = P.vy > wantVy * P.k || Math.abs(wantVx - P.vx) > 30 && h > 120 && Math.abs(P.a) > 0.15;
  },
  score(m, S) { return S.pts.slice(); },
  fmt(s) { return `${s} pts`; },
  hud(m, S, i) { const P = S.p[i]; return `${S.pts[i]} pts` + (P.st === 'land' ? ' ✔' : P.st === 'crash' ? ' 💥' : ''); },
  draw(m, S, g) {
    g.fillStyle = MGH.grad(g, 0, 720, ['#05051a', '#14143a']); g.fillRect(0, 0, 1280, 720);
    MGH.stars(g, m.t, 120, 640);
    for (let i = 0; i < 4; i++) {
      const P = S.p[i], p = m.players[i], ox = i * 320;
      g.save(); g.beginPath(); g.rect(ox, 40, 320, 680); g.clip();
      g.fillStyle = '#5a5a6a'; g.beginPath(); g.moveTo(ox, 720); for (let x = 0; x <= 320; x += 20) g.lineTo(ox + x, 640 + (Math.abs(x - S.pad) < 50 ? 0 : 10 + Math.sin(x * 0.07 + i) * 8)); g.lineTo(ox + 320, 720); g.fill();
      g.fillStyle = '#9a9aaa'; for (let k = 0; k < 5; k++) { g.beginPath(); g.ellipse(ox + 30 + k * 64, 690, 14, 5, 0, 0, 7); g.fill(); }
      MGH.glow(g, ox + S.pad, 640, 50, 'rgba(120,255,160,0.5)'); g.fillStyle = '#7cf06a'; g.fillRect(ox + S.pad - 40, 636, 80, 6);
      g.save(); g.translate(ox + P.x, P.y); if (P.st === 'crash') g.rotate(1.2); else g.rotate(P.a);
      if (P.st === 'crash') { g.globalAlpha = 0.6; }
      if (P.th && P.st === 'fly') MGH.flame(g, 0, 22, 0.35, m.t, i);
      g.strokeStyle = '#ccc'; g.lineWidth = 3; g.beginPath(); g.moveTo(-14, 8); g.lineTo(-20, 20); g.moveTo(14, 8); g.lineTo(20, 20); g.stroke();
      g.fillStyle = '#e8eef4'; MGH.rr(g, -16, -12, 32, 24, 8); g.fill(); g.fillStyle = p.color; g.fillRect(-16, 4, 32, 6);
      g.fillStyle = '#9fd8ff'; g.beginPath(); g.arc(0, -10, 12, 0, 7); g.fill();
      g.save(); g.beginPath(); g.arc(0, -10, 11, 0, 7); g.clip(); Char.draw(g, 0, -6, 9, p.el.id, p.color, { mood: MGH.persona(P.st === 'crash' ? 'dizzy' : P.st === 'land' ? 'cheer' : 'determined', p.el.id), seed: i * 1.7, headOnly: true }); g.restore();
      g.restore();
      g.restore();
      g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(ox + 10, 60, 10, 80); g.fillStyle = P.fuel > 0.25 ? '#ffb13d' : '#ff4a4a'; g.fillRect(ox + 10, 140 - 80 * P.fuel, 10, 80 * P.fuel);
      const spd = Math.hypot(P.vx, P.vy); MGH.text(g, P.st === 'land' ? `LANDED +${P.sc}` : P.st === 'crash' ? 'CRASH!' : `speed ${Math.round(spd)}`, ox + 160, 70, 16, P.st === 'land' ? '#7cf06a' : P.st === 'crash' ? '#ff6b6b' : spd > 80 ? '#ffb13d' : '#fff', 'center', 'bold');
      MGH.text(g, `${p.name}  ${S.pts[i]}`, ox + 160, 712, 16, p.color, 'center', 'bold');
      if (i) { g.fillStyle = 'rgba(255,255,255,0.15)'; g.fillRect(ox - 1, 40, 2, 680); }
    }
    MGH.label(g, `Round ${S.round} of 3`, 640, 100, 18, '#fff');
  },
});

// ======================================================================== DUCK GALLERY (carnival shooting gallery with crosshairs)
MG.def({
  id: 'ducks', name: 'Duck Gallery', type: 'Arcade', controls: 'Move + button', dur: 40,
  rows: [['stick', 'Move your crosshair'], ['a', 'Pop!']],
  how: 'Tin ducks paddle across the carnival gallery. Move your crosshair with the stick and press A to pop them with your cork gun! Plain ducks are 1 point, GOLDEN ducks 5 — but don\'t hit the grumpy black ducks (−3). Everyone shoots at the same ducks, so be quick!',
  wins: 'Most points.',
  ROWS: [230, 380, 530],
  init(m, S) { S.d = []; S.sp = [0, 0, 0]; S.c = [0, 1, 2, 3].map(i => ({ x: 250 + i * 260, y: 600, cd: 0, pts: 0, fx: 0, tg: null })); },
  update(m, S, dt) {
    this.ROWS.forEach((y, r) => { S.sp[r] -= dt; if (S.sp[r] <= 0) { S.sp[r] = R.range(0.7, 1.4); const k = Math.random(); S.d.push({ x: r % 2 ? 1330 : -50, y, r, v: (r % 2 ? -1 : 1) * R.range(160, 240 + m.t * 3), kind: k < 0.12 ? 'gold' : k < 0.3 ? 'black' : 'plain', hit: 0 }); } });
    S.d.forEach(d => { if (d.hit) d.hit += dt; else d.x += d.v * dt; }); S.d = S.d.filter(d => d.x > -80 && d.x < 1360 && d.hit < 0.6);
    S.c.forEach((c, i) => {
      c.cd -= dt; c.fx -= dt; const a = m.axis(i); c.x = clamp(c.x + a.x * 620 * dt, 30, 1250); c.y = clamp(c.y + a.y * 620 * dt, 120, 660);
      if (m.pressed(i, 'a') && c.cd <= 0) {
        c.cd = 0.3; c.fx = 0.12; Sfx.pop();
        const d = S.d.find(d => !d.hit && Math.abs(d.x - c.x) < 32 && Math.abs(d.y - 10 - c.y) < 36);
        if (d) { d.hit = 0.01; d.by = i; const v = d.kind === 'gold' ? 5 : d.kind === 'black' ? -3 : 1; c.pts += v; d.v = v; if (v > 0) Sfx.coin(); else Sfx.bad(); }
      }
    });
  },
  bot(m, S, i) {
    const c = S.c[i], v = m.vin[i]; v.a = false;
    if (!c.tg || c.tg.hit || c.tg.x < 0 || c.tg.x > 1280 || Math.random() < 0.01) c.tg = S.d.filter(d => !d.hit && d.kind !== 'black' && d.x > 40 && d.x < 1240).sort((a, b) => (dist(a.x, a.y, c.x, c.y) - (a.kind === 'gold' ? 400 : 0)) - (dist(b.x, b.y, c.x, c.y) - (b.kind === 'gold' ? 400 : 0)))[0] || null;
    if (!c.tg) { v.ax = v.ay = 0; return; }
    const tx = c.tg.x + c.tg.v * 0.12, ty = c.tg.y - 10, dx = tx - c.x, dy = ty - c.y, l = Math.hypot(dx, dy);
    v.ax = l > 8 ? dx / l * Math.min(1, l / 60) : 0; v.ay = l > 8 ? dy / l * Math.min(1, l / 60) : 0;
    if (l < 22 && c.cd <= 0 && Math.random() < 0.3) v.a = true;
  },
  score(m, S) { return S.c.map(c => c.pts); },
  fmt(s) { return `${s} pts`; },
  hud(m, S, i) { return `${S.c[i].pts}`; },
  draw(m, S, g) {
    g.fillStyle = '#3a1a2a'; g.fillRect(0, 0, 1280, 720);
    for (let x = 0; x < 1280; x += 80) { g.fillStyle = (x / 80) % 2 ? '#c8445a' : '#f4e8d8'; g.beginPath(); g.moveTo(x, 40); g.lineTo(x + 80, 40); g.lineTo(x + 80, 100); g.quadraticCurveTo(x + 40, 130, x, 100); g.fill(); }
    for (let k = 0; k < 20; k++) { g.fillStyle = ['#ffe680', '#ff6b8a', '#5ab8ff'][k % 3]; g.globalAlpha = 0.5 + 0.5 * Math.sin(m.t * 5 + k); g.beginPath(); g.arc(30 + k * 64, 112, 5, 0, 7); g.fill(); } g.globalAlpha = 1;
    this.ROWS.forEach((y, r) => { g.fillStyle = MGH.grad(g, y + 10, y + 70, ['#3a8ad8', '#2a6ab8']); g.fillRect(0, y + 14, 1280, 50); for (let x = (m.t * (r % 2 ? -60 : 60)) % 60 - 60; x < 1340; x += 60) { g.fillStyle = '#5ab8ff'; g.beginPath(); g.arc(x, y + 16, 30, Math.PI, 0); g.fill(); } g.fillStyle = '#8a5a2a'; g.fillRect(0, y + 60, 1280, 10); });
    S.d.forEach(d => {
      const dir = Math.sign(d.v) || 1, fall = d.hit ? d.hit / 0.6 : 0;
      g.save(); g.translate(d.x, d.y + fall * 30); if (d.hit) g.rotate(fall * 1.4 * dir); g.globalAlpha = 1 - fall;
      const col = d.kind === 'gold' ? '#ffd34d' : d.kind === 'black' ? '#3a3a4a' : '#f4f4f4';
      g.fillStyle = col; g.beginPath(); g.ellipse(0, 0, 28, 18, 0, 0, 7); g.fill(); g.beginPath(); g.arc(dir * 18, -20, 13, 0, 7); g.fill();
      g.fillStyle = '#ff8a3d'; g.beginPath(); g.moveTo(dir * 28, -22); g.lineTo(dir * 40, -18); g.lineTo(dir * 28, -14); g.fill();
      g.fillStyle = d.kind === 'black' ? '#ff4a4a' : '#222'; g.beginPath(); g.arc(dir * 22, -23, 2.5, 0, 7); g.fill();
      if (d.kind === 'black') { g.strokeStyle = '#ff4a4a'; g.lineWidth = 2; g.beginPath(); g.moveTo(dir * 16, -30); g.lineTo(dir * 26, -27); g.stroke(); }
      if (d.kind === 'gold') MGH.spark(g, -10, -8, 4, '#fff');
      g.restore();
      if (d.hit && d.hit < 0.5) MGH.text(g, d.v > 0 ? `+${d.v}` : `${d.v}`, d.x, d.y - 50 - d.hit * 40, 20, d.v > 0 ? '#ffe680' : '#ff6b6b', 'center', 'bold');
    });
    S.c.forEach((c, i) => { const col = m.players[i].color; g.strokeStyle = col; g.lineWidth = 3; g.beginPath(); g.arc(c.x, c.y, 18, 0, 7); g.moveTo(c.x - 26, c.y); g.lineTo(c.x - 8, c.y); g.moveTo(c.x + 8, c.y); g.lineTo(c.x + 26, c.y); g.moveTo(c.x, c.y - 26); g.lineTo(c.x, c.y - 8); g.moveTo(c.x, c.y + 8); g.lineTo(c.x, c.y + 26); g.stroke(); if (c.fx > 0) MGH.glow(g, c.x, c.y, 24, 'rgba(255,255,255,0.8)'); MGH.text(g, String(i + 1), c.x + 22, c.y - 18, 13, col, 'center', 'bold'); });
    m.players.forEach((p, i) => { const x = 160 + i * 320; Char.draw(g, x, 670, 22, p.el.id, p.color, { mood: MGH.persona('determined', p.el.id), seed: i * 1.7, look: { x: 0, y: -1 }, headOnly: true }); MGH.text(g, `${S.c[i].pts}`, x + 50, 680, 24, p.color, 'center', 'bold'); });
  },
});

// ======================================================================== SPOT IT (find the symbol first)
const SPOT = ['🍄', '🐸', '🌵', '🎈', '🍉', '⭐', '🐙', '🍩', '🌻', '🦋', '🍒', '🐢', '🎲', '🔔', '🍋', '🐳', '🌙', '🧁', '🐝', '🍀', '🎸', '🦀', '🍇', '🐧'];
MG.def({
  id: 'spotit', name: 'Spot It!', type: 'Search', controls: 'Move + button', dur: 0,
  rows: [['stick', 'Move your magnifier'], ['a', 'Point it out']],
  how: 'The board is covered in little pictures. The one at the top is hidden somewhere among them — exactly once! Race your magnifier over it and press A. First to find it scores; pointing at the wrong picture freezes you for a moment. Eight rounds, busier every time.',
  wins: 'Most finds.',
  init(m, S) { S.pts = [0, 0, 0, 0]; S.round = 0; S.c = [0, 1, 2, 3].map(i => ({ x: 300 + i * 230, y: 420, frz: 0 })); this.next(S); },
  next(S) {
    S.round++; S.ph = 'find'; S.pt = 0; S.win = -1; const n = 22 + S.round * 4; S.target = R.int(0, SPOT.length - 1);
    S.items = []; let tries = 0; while (S.items.length < n && tries++ < 3000) { const x = R.range(80, 1200), y = R.range(170, 660); if (S.items.every(o => dist(o.x, o.y, x, y) > 62)) S.items.push({ x, y, k: S.items.length === 0 ? S.target : R.pick([...SPOT.keys()].filter(k => k !== S.target)), rot: R.range(-0.5, 0.5), s: R.range(34, 48) }); }
    S.items = R.shuffle(S.items); S.c.forEach(c => { c.found = R.range(1.5, 4.5) + S.round * 0.25; });
  },
  update(m, S, dt) {
    S.pt += dt;
    if (S.ph === 'find') {
      S.c.forEach((c, i) => {
        c.frz -= dt; if (c.frz > 0) return; const a = m.axis(i); c.x = clamp(c.x + a.x * 560 * dt, 40, 1240); c.y = clamp(c.y + a.y * 560 * dt, 140, 690);
        if (m.pressed(i, 'a')) { const it = S.items.find(o => dist(o.x, o.y, c.x, c.y) < 30); if (it && it.k === S.target) { S.win = i; S.pts[i]++; S.ph = 'show'; S.pt = 0; S.at = it; Sfx.coin(); } else { c.frz = 1; Sfx.bad(); } }
      });
      if (S.pt > 20 && S.ph === 'find') { S.ph = 'show'; S.pt = 0; S.at = S.items.find(o => o.k === S.target); }
      return;
    }
    if (S.pt > 2) { if (S.round >= 8) m.finish(S.pts.slice()); else this.next(S); }
  },
  bot(m, S, i) {
    const c = S.c[i], v = m.vin[i]; v.a = false; if (S.ph !== 'find' || c.frz > 0) { v.ax = v.ay = 0; return; }
    let tx, ty; if (S.pt < c.found) { if (!c.wp || dist(c.wp.x, c.wp.y, c.x, c.y) < 30) c.wp = { x: R.range(100, 1180), y: R.range(180, 650) }; tx = c.wp.x; ty = c.wp.y; } else { const it = S.items.find(o => o.k === S.target); tx = it.x; ty = it.y; }
    const dx = tx - c.x, dy = ty - c.y, l = Math.hypot(dx, dy); v.ax = l > 6 ? dx / l * Math.min(1, l / 50) : 0; v.ay = l > 6 ? dy / l * Math.min(1, l / 50) : 0;
    if (S.pt >= c.found && l < 14) v.a = true;
  },
  score(m, S) { return S.pts.slice(); },
  fmt(s) { return `${s} finds`; },
  hud(m, S, i) { return `${S.pts[i]} 🔍`; },
  draw(m, S, g) {
    g.fillStyle = MGH.grad(g, 0, 720, ['#fff6e0', '#f4e0b8']); g.fillRect(0, 0, 1280, 720);
    g.fillStyle = 'rgba(0,0,0,0.05)'; MGH.rr(g, 40, 130, 1200, 580, 20); g.fill();
    g.fillStyle = '#fff'; MGH.rr(g, 520, 46, 240, 76, 18); g.fill(); g.strokeStyle = '#e8a060'; g.lineWidth = 4; g.stroke();
    MGH.text(g, 'FIND:', 580, 94, 20, '#a8503a', 'center', 'bold'); MGH.emoji(g, SPOT[S.target], 680, 98, 46);
    MGH.text(g, `Round ${S.round} of 8`, 160, 90, 20, '#a8503a', 'center', 'bold');
    S.items.forEach(o => { const hl = S.ph === 'show' && o === S.at; if (hl) MGH.glow(g, o.x, o.y, 60, 'rgba(255,220,80,0.8)'); MGH.emoji(g, SPOT[o.k], o.x, o.y + o.s * 0.35, hl ? o.s * 1.4 : o.s, o.rot); });
    S.c.forEach((c, i) => { const col = m.players[i].color; g.strokeStyle = c.frz > 0 ? 'rgba(150,150,150,0.8)' : col; g.lineWidth = 5; g.beginPath(); g.arc(c.x, c.y, 28, 0, 7); g.stroke(); g.lineWidth = 7; g.beginPath(); g.moveTo(c.x + 20, c.y + 20); g.lineTo(c.x + 38, c.y + 38); g.stroke(); if (c.frz > 0) MGH.text(g, '❄', c.x, c.y - 36, 18, '#5ab8ff', 'center', 'bold'); });
    m.players.forEach((p, i) => { const x = 1060 + (i % 2) * 110, y = 64 + Math.floor(i / 2) * 44; MGH.text(g, `${p.name} ${S.pts[i]}`, x, y, 16, p.color, 'center', 'bold'); });
    if (S.ph === 'show') MGH.label(g, S.win >= 0 ? `${m.players[S.win].name} found it!` : 'Time up!', 640, 400, 34, S.win >= 0 ? m.players[S.win].color : '#a8503a');
  },
});

// ======================================================================== PINBALL DUEL (2 vs 2, each player works one flipper)
MG.def({
  id: 'pinball', name: 'Pinball Duel', type: 'Arena', mode: '2v2', controls: '1 button', dur: 75,
  rows: [['a', 'Flip your flipper']],
  how: 'One pinball table, two teams: your team guards one end and each of you works ONE flipper (left or right) with A. Bat the ball back up the table past the bumpers — if it slips through the gap at the other team\'s end, your team scores! First to five goals, or the most when time runs out.',
  wins: 'First to 5 goals (or the most at the end).',
  X0: 380, X1: 900, Y0: 60, Y1: 700,
  init(m, S) {
    S.goals = [0, 0]; S.fl = []; [0, 1].forEach(tm => { const mem = [0, 1, 2, 3].filter(i => m.teamOf(i) === tm); mem.forEach((i, k) => S.fl.push({ i, tm, side: k ? 1 : -1, ang: 0, w: 0 })); });
    S.bump = [{ x: 560, y: 300, r: 30 }, { x: 720, y: 300, r: 30 }, { x: 640, y: 380, r: 34 }, { x: 560, y: 460, r: 30 }, { x: 720, y: 460, r: 30 }];
    this.serve(S, R.int(0, 1));
  },
  serve(S, tm) { S.b = { x: 640, y: 380 + (tm ? -60 : 60), vx: R.range(-150, 150), vy: tm ? -260 : 260, r: 13 }; S.wait = 0.8; },
  flip(S, f) { const tm = f.tm, py = tm ? this.Y0 + 70 : this.Y1 - 70, px = 640 + f.side * 150, dir = -f.side, len = 110; const rest = 0.45, up = -0.45, a = rest + (up - rest) * f.ang; const ang = tm ? -a : a; return { px, py, ex: px + dir * Math.cos(ang) * len, ey: py + Math.sin(ang) * len }; },
  update(m, S, dt) {
    S.fl.forEach(f => { const prev = f.ang; f.ang = clamp(f.ang + (m.held(f.i, 'a') ? 14 : -7) * dt, 0, 1); f.w = (f.ang - prev) / dt; if (f.ang > prev && prev === 0) Sfx.tone(300, 0.04, 'square', 0.03); });
    if (S.wait > 0) { S.wait -= dt; return; }
    const b = S.b, steps = 4;
    for (let s = 0; s < steps; s++) {
      const h = dt / steps; b.x += b.vx * h; b.y += b.vy * h;
      if (b.x < this.X0 + b.r) { b.x = this.X0 + b.r; b.vx = Math.abs(b.vx); } if (b.x > this.X1 - b.r) { b.x = this.X1 - b.r; b.vx = -Math.abs(b.vx); }
      // slanted guides funnel the ball toward the flippers at each end
      for (const [x1, y1, x2, y2] of [[this.X0, this.Y1 - 170, 490, this.Y1 - 70], [this.X1, this.Y1 - 170, 790, this.Y1 - 70], [this.X0, this.Y0 + 170, 490, this.Y0 + 70], [this.X1, this.Y0 + 170, 790, this.Y0 + 70]]) bounceSeg(b, x1, y1, x2, y2, b.r, 0.6);
      S.bump.forEach(q => { const d = dist(q.x, q.y, b.x, b.y); if (d < q.r + b.r) { const nx = (b.x - q.x) / d, ny = (b.y - q.y) / d; b.x = q.x + nx * (q.r + b.r); b.y = q.y + ny * (q.r + b.r); const vn = b.vx * nx + b.vy * ny; b.vx -= 2 * vn * nx; b.vy -= 2 * vn * ny; b.vx += nx * 120; b.vy += ny * 120; q.hit = 0.2; Sfx.tone(800 + Math.random() * 300, 0.04, 'triangle', 0.03); } });
      S.fl.forEach(f => { const F = this.flip(S, f); if (bounceSeg(b, F.px, F.py, F.ex, F.ey, b.r + 6, 0.5) && f.w > 1) { const dirUp = f.tm ? 1 : -1; b.vy = dirUp * (420 + f.w * 26) * (0.8 + Math.random() * 0.3); b.vx += f.side * -R.range(40, 200); Sfx.thud(); } });
    }
    const sp = Math.hypot(b.vx, b.vy), mx = 760, mn = 220; if (sp > mx) { b.vx *= mx / sp; b.vy *= mx / sp; } if (sp < mn) { b.vx *= mn / sp; b.vy *= mn / sp; }
    S.bump.forEach(q => { q.hit = Math.max(0, (q.hit || 0) - dt); });
    if (b.y > this.Y1 + 20) { S.goals[1]++; Sfx.crowd && Sfx.crowd('cheer'); MGH.burst(640, this.Y1, [MG.TEAMC[1], '#fff'], 24, { speed: 260 }); this.serve(S, 0); }
    if (b.y < this.Y0 - 20) { S.goals[0]++; Sfx.crowd && Sfx.crowd('cheer'); MGH.burst(640, this.Y0, [MG.TEAMC[0], '#fff'], 24, { speed: 260 }); this.serve(S, 1); }
    if (S.goals[0] >= 5 || S.goals[1] >= 5) m.finish(this.score(m, S));
  },
  bot(m, S, i) {
    const f = S.fl.find(q => q.i === i), v = m.vin[i], b = S.b; v.a = false; if (!f || S.wait > 0) return;
    const F = this.flip(S, f), comingToMe = f.tm ? b.vy < 0 : b.vy > 0, mid = (F.px + F.ex) / 2;
    const near = Math.abs(b.y - F.py) < 70 && Math.abs(b.x - mid) < 75;
    if (!f.react) f.react = R.range(0, 1); v.a = comingToMe && near && f.react < 0.85; if (!near) f.react = Math.random();
  },
  score(m, S) { return m.players.map((p, i) => S.goals[m.teamOf(i)]); },
  fmt(s) { return `${s} goals`; },
  hud(m, S, i) { return MG.TEAMN[m.teamOf(i)]; },
  draw(m, S, g) {
    g.fillStyle = '#1a1030'; g.fillRect(0, 0, 1280, 720);
    for (let k = 0; k < 30; k++) { g.fillStyle = `hsla(${k * 37},90%,60%,${0.2 + 0.2 * Math.sin(m.t * 3 + k)})`; g.beginPath(); g.arc(k % 2 ? 300 - (k % 5) * 30 : 980 + (k % 5) * 30, 80 + k * 21, 6, 0, 7); g.fill(); }
    g.fillStyle = MGH.grad(g, this.Y0, this.Y1, ['#2a3a8a', '#3a2a7a', '#2a3a8a']); g.fillRect(this.X0, this.Y0, this.X1 - this.X0, this.Y1 - this.Y0);
    g.fillStyle = MG.TEAMC[1] + '44'; g.fillRect(this.X0, this.Y0, this.X1 - this.X0, 60); g.fillStyle = MG.TEAMC[0] + '44'; g.fillRect(this.X0, this.Y1 - 60, this.X1 - this.X0, 60);
    g.strokeStyle = '#c8c8e8'; g.lineWidth = 8; g.strokeRect(this.X0, this.Y0, this.X1 - this.X0, this.Y1 - this.Y0);
    g.strokeStyle = '#e8e8f8'; g.lineWidth = 6; for (const [x1, y1, x2, y2] of [[this.X0, this.Y1 - 170, 490, this.Y1 - 70], [this.X1, this.Y1 - 170, 790, this.Y1 - 70], [this.X0, this.Y0 + 170, 490, this.Y0 + 70], [this.X1, this.Y0 + 170, 790, this.Y0 + 70]]) { g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); }
    S.bump.forEach(q => { MGH.glow(g, q.x, q.y, q.r * 2, q.hit > 0 ? 'rgba(255,230,120,0.8)' : 'rgba(255,100,200,0.35)'); g.fillStyle = q.hit > 0 ? '#ffe680' : '#ff6bc8'; g.beginPath(); g.arc(q.x, q.y, q.r, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(q.x, q.y, q.r * 0.45, 0, 7); g.fill(); });
    S.fl.forEach(f => { const F = this.flip(S, f), col = m.players[f.i].color; g.strokeStyle = col; g.lineWidth = 18; g.lineCap = 'round'; g.beginPath(); g.moveTo(F.px, F.py); g.lineTo(F.ex, F.ey); g.stroke(); g.fillStyle = '#fff'; g.beginPath(); g.arc(F.px, F.py, 8, 0, 7); g.fill(); const p = m.players[f.i]; Char.draw(g, F.px + f.side * 120, F.py + (f.tm ? -6 : 6), 26, p.el.id, p.color, { mood: MGH.persona(m.held(f.i, 'a') ? 'effort' : 'determined', p.el.id), seed: f.i * 1.7, look: { x: -f.side, y: f.tm ? 1 : -1 } }); });
    const b = S.b; const gr = g.createRadialGradient(b.x - 4, b.y - 4, 1, b.x, b.y, b.r); gr.addColorStop(0, '#fff'); gr.addColorStop(1, '#8a9aaa'); g.fillStyle = gr; g.beginPath(); g.arc(b.x, b.y, b.r, 0, 7); g.fill();
    MGH.text(g, `${S.goals[1]}`, 1060, 200, 64, MG.TEAMC[1], 'center', 'bold'); MGH.text(g, MG.TEAMN[1], 1060, 240, 20, MG.TEAMC[1], 'center', 'bold');
    MGH.text(g, `${S.goals[0]}`, 220, 560, 64, MG.TEAMC[0], 'center', 'bold'); MGH.text(g, MG.TEAMN[0], 220, 600, 20, MG.TEAMC[0], 'center', 'bold');
  },
});
