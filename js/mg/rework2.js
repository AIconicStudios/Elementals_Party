'use strict';
// Rework pass 2 (same ids replace earlier versions)

// ======================================================================== SWEEPER JUMP (replaces Jump Rope: you can SEE the rope coming round)
MG.def({
  id: 'jumprope', name: 'Sweeper Jump', type: 'Timing', controls: '1 button', dur: 0,
  rows: [['a', 'Jump as the rope sweeps past']],
  how: 'A spinning post in the middle sweeps a long rope round and round along the ground, and you all stand in a ring. Watch it come round to you and press A to JUMP just as it reaches your feet! Too early or too late and it trips you — you\'re out. It speeds up and slows down, sometimes it flips direction (watch the arrows!), and later a SECOND rope joins in. Last one jumping wins!',
  wins: 'Last one jumping.',
  CX: 640, CY: 430, RX: 330, RY: 170,
  init(m, S) {
    S.arm = [0.4, 0.4 + Math.PI]; S.w = 1.6; S.target = 1.6; S.dir = 1; S.two = false; S.alive = [true, true, true, true]; S.order = []; S.j = [0, 0, 0, 0]; S.count = 0; S.go = 2.4; S.t = 0; S.paceT = 5; S.flip = 0;
    S.err = [0, 1, 2, 3].map(() => R.range(-0.05, 0.05));
  },
  ang(i) { return i * Math.PI / 2 + Math.PI / 4; },
  pos(a, r = 1) { return [this.CX + Math.cos(a) * this.RX * r, this.CY + Math.sin(a) * this.RY * r]; },
  update(m, S, dt) {
    S.t += dt; S.j = S.j.map(j => Math.max(0, j - dt));
    for (let i = 0; i < 4; i++) if (S.alive[i] && S.j[i] <= 0 && m.pressed(i, 'a')) { S.j[i] = 0.46; Sfx.tone(600, 0.04, 'triangle', 0.03); }
    if (S.t < S.go) return;
    S.paceT -= dt; if (S.paceT <= 0) { S.paceT = R.range(4, 7); S.target = clamp(1.5 + S.count * 0.02 + R.range(-0.3, 0.3), 1.3, S.two ? 2.6 : 3.4); if (S.count > 6 && Math.random() < 0.3) S.flip = 1.2; }
    if (S.flip > 0) { S.flip -= dt; if (S.flip <= 0) { S.dir *= -1; Sfx.whistle(); } }
    S.w += (S.target - S.w) * dt * 0.8;
    if (!S.two && S.t - S.go > 22) { S.two = true; S.arm[1] = S.arm[0] + Math.PI; S.target = Math.min(S.target, 2.0); Sfx.whistle(); }
    for (let r = 0; r < (S.two ? 2 : 1); r++) {
      const prev = S.arm[r]; S.arm[r] += dt * S.w * S.dir;
      for (let i = 0; i < 4; i++) { if (!S.alive[i]) continue; const a = this.ang(i), k0 = Math.floor((prev - a) / (Math.PI * 2)), k1 = Math.floor((S.arm[r] - a) / (Math.PI * 2));
        if (k0 !== k1) { const h = S.j[i] > 0 ? Math.sin(Math.PI * S.j[i] / 0.46) : 0; if (h < 0.3) { S.alive[i] = false; S.order.push(i); Sfx.thud(); MGH.burst(...this.pos(a), ['#fff', m.players[i].color], 14, { speed: 220 }); } else { S.count++; if (i === 0 || S.alive.filter(x => x).length === 1) Sfx.tone(300, 0.04, 'square', 0.02); } } }
    }
    if (!S.two) S.arm[1] = S.arm[0] + Math.PI;
    if (S.alive.filter(a => a).length <= 1 || S.count > 220) m.finish(this.score(m, S));
  },
  eta(S, i) { // seconds until a rope reaches player i
    const a = this.ang(i); let best = 9; for (let r = 0; r < (S.two ? 2 : 1); r++) { let d = (a - S.arm[r]) * S.dir; d = ((d % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2); best = Math.min(best, d / S.w); } return best;
  },
  bot(m, S, i) {
    const v = m.vin[i]; v.a = false; if (!S.alive[i] || S.t < S.go || S.j[i] > 0) return;
    const to = this.eta(S, i), want = 0.23 + S.err[i]; if (to < want && to > want - 0.06) { v.a = Math.random() < 0.95 - S.count * 0.0012; S.err[i] = R.range(-0.06, 0.06); }
  },
  score(m, S) { return [0, 1, 2, 3].map(i => S.alive[i] ? 100 : S.order.indexOf(i) + 1); },
  fmt(s) { return s >= 100 ? 'Still jumping!' : `out #${s}`; },
  hud(m, S, i) { return S.alive[i] ? `${S.count} jumps` : 'out'; },
  draw(m, S, g) {
    const { CX, CY, RX, RY } = this, t = m.t;
    MGH.scene(g, 'meadow', t);
    // sandy ring + grass
    g.fillStyle = 'rgba(60,40,20,0.25)'; g.beginPath(); g.ellipse(CX, CY + 14, RX + 120, RY + 70, 0, 0, 7); g.fill();
    const sg = g.createRadialGradient(CX, CY - 40, 40, CX, CY, RX + 120); sg.addColorStop(0, '#f4dca0'); sg.addColorStop(1, '#d8b070'); g.fillStyle = sg; g.beginPath(); g.ellipse(CX, CY, RX + 110, RY + 62, 0, 0, 7); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 3; g.setLineDash([12, 10]); g.beginPath(); g.ellipse(CX, CY, RX, RY, 0, 0, 7); g.stroke(); g.setLineDash([]);
    // direction arrows painted on the ring (flash before a flip)
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2 + 0.2, [x, y] = this.pos(a, 0.72), d = S.flip > 0 ? -S.dir : S.dir, c = S.flip > 0 ? `rgba(255,90,60,${0.5 + 0.5 * Math.sin(t * 20)})` : 'rgba(255,255,255,0.4)'; g.save(); g.translate(x, y); g.rotate(a + Math.PI / 2 * d); g.fillStyle = c; g.beginPath(); g.moveTo(10, 0); g.lineTo(-6, -7); g.lineTo(-6, 7); g.fill(); g.restore(); }
    if (S.flip > 0) MGH.label(g, '↺ Direction flip!', 640, 120, 30, '#ff9a8a');
    // ropes on the ground: motion trail, shadow, rope, weighted ball at the tip
    const ropes = S.two ? [[S.arm[0], '#e84a5a'], [S.arm[1], '#3a8ae8']] : [[S.arm[0], '#e84a5a']];
    ropes.forEach(([a, c]) => {
      for (let q = 1; q <= 6; q++) { const b = a - S.dir * q * 0.06, [x, y] = this.pos(b, 1.22); g.strokeStyle = `rgba(255,255,255,${0.22 - q * 0.03})`; g.lineWidth = 10; g.beginPath(); g.moveTo(CX, CY); g.lineTo(x, y); g.stroke(); }
      const [x, y] = this.pos(a, 1.22); g.lineCap = 'round';
      g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 12; g.beginPath(); g.moveTo(CX, CY + 6); g.lineTo(x, y + 8); g.stroke();
      g.strokeStyle = c; g.lineWidth = 9; g.beginPath(); g.moveTo(CX, CY - 6); g.lineTo(x, y); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 2; g.setLineDash([8, 9]); g.beginPath(); g.moveTo(CX, CY - 8); g.lineTo(x, y - 2); g.stroke(); g.setLineDash([]); g.lineCap = 'butt';
      const bg = g.createRadialGradient(x - 5, y - 6, 2, x, y, 16); bg.addColorStop(0, '#fff'); bg.addColorStop(0.4, c); bg.addColorStop(1, Char.shade(c, -0.5)); g.fillStyle = bg; g.beginPath(); g.arc(x, y - 4, 15, 0, 7); g.fill();
    });
    // spinning post
    GX.shadow(g, CX, CY + 10, 40, 0.35);
    const pg = g.createLinearGradient(CX - 16, 0, CX + 16, 0); pg.addColorStop(0, '#6a4020'); pg.addColorStop(0.5, '#c88a4a'); pg.addColorStop(1, '#5a3418'); g.fillStyle = pg; g.fillRect(CX - 14, CY - 70, 28, 74);
    g.fillStyle = '#ffd34d'; g.beginPath(); g.ellipse(CX, CY - 70, 18, 8, 0, 0, 7); g.fill(); g.save(); g.translate(CX, CY - 70); g.rotate(S.arm[0]); g.fillStyle = '#e84a5a'; g.fillRect(-3, -3, 20, 6); g.restore();
    // players on the ring, front ones drawn last
    const ents = [0, 1, 2, 3].map(i => { const a = this.ang(i), [x, y] = this.pos(a); return { y, f: () => {
      const p = m.players[i], h = S.j[i] > 0 ? Math.sin(Math.PI * S.j[i] / 0.46) * 70 : 0, eta = this.eta(S, i), warn = S.alive[i] && S.t > S.go && eta < 0.7;
      g.fillStyle = warn ? `rgba(255,${Math.round(120 + eta * 180)},80,${0.6 - eta * 0.6})` : 'rgba(0,0,0,0)'; g.beginPath(); g.ellipse(x, y + 4, 40, 14, 0, 0, 7); g.fill();
      GX.shadow(g, x, y + 4, 30 - h * 0.15, 0.35);
      Char.draw(g, x, y - 42 - h, 30, p.el.id, p.color, { mood: MGH.persona(!S.alive[i] ? 'sad' : h > 10 ? 'cheer' : warn ? 'determined' : 'happy', p.el.id), seed: i * 1.7, alpha: S.alive[i] ? 1 : 0.4, noShadow: true, look: { x: x < CX ? 1 : -1, y: 0 }, hands: h > 10 ? { n: { x: -1.1, y: -1.2, d: -130, o: true, m: true }, f: { x: 1.1, y: -1.2, d: -50, o: true, m: false } } : undefined });
      g.fillStyle = 'rgba(0,0,0,0.4)'; MGH.rr(g, x - 50, y + 22, 100, 24, 12); g.fill(); MGH.text(g, p.name, x, y + 40, 16, p.color, 'center', 'bold');
    } }; });
    ents.sort((a, b) => a.y - b.y).forEach(e => e.f());
    MGH.label(g, `${S.count} jumps` + (S.two ? '  ·  DOUBLE ROPE!' : ''), 640, 70, 26, '#fff');
    if (S.t < S.go) MGH.label(g, 'Watch the rope come round — jump as it reaches you!', 640, 200, 28, '#ffe680');
  },
});

// ======================================================================== BUCKET BRIGADE (angle throw on an arc gauge, big fires)
MG.def({
  id: 'buckets', name: 'Bucket Brigade', type: 'Timing', mode: '2v2', controls: '1 button', dur: 45,
  rows: [['a', 'Pumper: hold to fill · Thrower: throw at the right angle']],
  how: 'Each team has a burning cottage! The PUMPER holds A to fill the bucket — let go in the green, an overflowing bucket spills and has to be emptied. The bucket slides to the THROWER: a marker sweeps up and down the ANGLE gauge — press A when it\'s on the GREEN angle and the water arcs right onto the flames. Too low falls short, too high flies over. First team to put out its fire (or the smallest fire at the end) wins. Swap jobs at half time!',
  wins: 'Fire out first (or the smallest fire).',
  init(m, S) { S.half = false; S.t0 = [0, 1].map(tm => [0, 1, 2, 3].filter(i => m.teamOf(i) === tm)); S.tm = [0, 1].map(() => ({ fire: 1, fill: 0, st: 'pump', aim: 0, slide: 0, spill: 0, fx: '', fxT: 0, bt: R.range(0.55, 0.8), gc: 0.5, fly: 0, res: 0, steam: 0 })); },
  roles(S, tm) { const [a, b] = S.t0[tm]; return S.half ? { pump: b, toss: a } : { pump: a, toss: b }; },
  GW: 0.13,
  pos(T) { const a = T.aim % 2; return a < 1 ? a : 2 - a; },
  update(m, S, dt) {
    if (!S.half && m.t > 22.5) { S.half = true; Sfx.whistle(); }
    S.tm.forEach((T, tm) => {
      const R_ = this.roles(S, tm); T.fxT -= dt; T.steam -= dt; T.fire = Math.min(1, T.fire + dt * 0.012);
      if (T.st === 'pump') { T.spill -= dt; if (T.spill > 0) return; if (m.held(R_.pump, 'a')) { T.fill += dt * 0.65; if (T.fill > 1) { T.fill = 0; T.spill = 1; T.fx = 'overflow!'; T.fxT = 1; Sfx.bad(); } } else if (T.fill > 0.1) { T.q = T.fill >= 0.7 ? 1 : T.fill / 0.7 * 0.6; T.st = 'slide'; T.slide = 0; Sfx.tone(400, 0.05, 'triangle', 0.03); } return; }
      if (T.st === 'slide') { T.slide += dt * 2.5; if (T.slide >= 1) { T.st = 'aim'; T.aim = 0; T.gc = R.range(0.2, 0.8); T.bw = R.range(0.75, 1.1); } return; }
      if (T.st === 'aim') { T.aim += dt * 1.15 * T.bw; if (m.pressed(R_.toss, 'a') || T.aim > 6) { const p = this.pos(T), err = p - T.gc; T.res = err; T.st = 'fly'; T.fly = 0; Sfx.whoosh(false); } return; }
      if (T.st === 'fly') { T.fly += dt / 0.8; if (T.fly >= 1) { const e = Math.abs(T.res), good = e < this.GW / 2, near = e < this.GW;
        T.fire = Math.max(0, T.fire - (good ? 0.16 : near ? 0.06 : 0) * T.q); T.fx = good ? 'SPLASH!' : near ? 'glanced' : T.res < 0 ? 'too short!' : 'too far!'; T.fxT = 0.9; if (good || near) T.steam = 1.2; T.st = 'pump'; T.fill = 0; Sfx.noise(0.4, good ? 1400 : 600, 0.08, 'bandpass'); if (T.fire <= 0) { T.out = m.t; Sfx.coin(); } } }
    });
    if (S.tm.some(T => T.out)) m.finish(this.score(m, S));
  },
  bot(m, S, i) {
    const v = m.vin[i], tm = m.teamOf(i), T = S.tm[tm], R_ = this.roles(S, tm); v.a = false;
    if (i === R_.pump && T.st === 'pump' && T.spill <= 0) { v.a = T.fill < T.bt; if (!v.a) T.bt = R.range(0.6, 0.98); }
    if (i === R_.toss && T.st === 'aim') { T.bErr = T.bErr === undefined ? R.range(0, 0.1) : T.bErr; if (Math.abs(this.pos(T) - T.gc) < T.bErr + 0.01 && Math.random() < 0.35) { v.a = true; T.bErr = undefined; } }
  },
  score(m, S) { return [0, 1, 2, 3].map(i => { const T = S.tm[m.teamOf(i)]; return T.out ? 200 - T.out : Math.round((1 - T.fire) * 100); }); },
  fmt(s) { return s > 100 ? `out in ${(200 - s).toFixed(1)}s` : `${s}% doused`; },
  hud(m, S, i) { const tm = m.teamOf(i); return MG.TEAMN[tm] + (this.roles(S, tm).pump === i ? ' · pumper' : ' · thrower'); },
  draw(m, S, g) {
    const t = m.t;
    GX.vfill(g, 0, 0, 1280, 720, ['#2a1840', '#7a3a4a', '#e8804a', '#f4b060']);
    MGH.glow(g, 640, 420, 500, 'rgba(255,140,60,0.25)');
    g.fillStyle = '#3a2a3a'; g.beginPath(); g.moveTo(0, 470); for (let x = 0; x <= 1280; x += 40) g.lineTo(x, 430 - Math.abs(Math.sin(x * 0.006)) * 60); g.lineTo(1280, 470); g.fill();
    GX.vfill(g, 0, 460, 1280, 260, ['#5a7a3a', '#3a5a28']);
    for (let k = 0; k < 60; k++) { const x = MGH.hash(k) * 1280, y = 470 + MGH.hash(k + 3) * 240; g.strokeStyle = 'rgba(30,60,20,0.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 3, y - 8); g.moveTo(x, y); g.lineTo(x + 3, y - 7); g.stroke(); }
    g.fillStyle = 'rgba(255,255,255,0.15)'; g.fillRect(638, 120, 4, 600);
    S.tm.forEach((T, tm) => {
      const ox = tm ? 650 : 10, R_ = this.roles(S, tm), pp = m.players[R_.pump], tp = m.players[R_.toss], hx = ox + 470, hy = 470;
      // cottage: stone base, timber walls, thatched roof — charring as it burns
      GX.shadow(g, hx, hy + 6, 120, 0.4);
      const char = 1 - T.fire * 0.5;
      g.fillStyle = '#7a7068'; g.fillRect(hx - 80, hy - 24, 160, 26);
      const wall = g.createLinearGradient(hx - 75, 0, hx + 75, 0); wall.addColorStop(0, Char.shade('#c8a070', -0.3 * T.fire)); wall.addColorStop(1, Char.shade('#a87a48', -0.4 * T.fire)); g.fillStyle = wall; g.fillRect(hx - 75, hy - 110, 150, 88);
      g.strokeStyle = '#4a2a14'; g.lineWidth = 6; g.strokeRect(hx - 75, hy - 110, 150, 88); g.beginPath(); g.moveTo(hx - 75, hy - 66); g.lineTo(hx + 75, hy - 66); g.stroke();
      g.fillStyle = '#2a1a10'; g.fillRect(hx - 18, hy - 66, 36, 44); g.fillStyle = T.fire > 0.1 ? `rgba(255,170,60,${0.5 + 0.4 * Math.sin(t * 8)})` : '#3a4a5a'; g.fillRect(hx + 30, hy - 100, 30, 26); g.fillRect(hx - 60, hy - 100, 30, 26);
      g.fillStyle = Char.shade('#c8a050', -0.5 * T.fire); g.beginPath(); g.moveTo(hx - 98, hy - 104); g.lineTo(hx, hy - 186); g.lineTo(hx + 98, hy - 104); g.fill();
      g.strokeStyle = 'rgba(80,50,10,0.5)'; g.lineWidth = 1.5; for (let k = 0; k < 10; k++) { g.beginPath(); g.moveTo(hx - 90 + k * 19, hy - 106); g.lineTo(hx - 4 + k * 1.5, hy - 180); g.stroke(); }
      // fire: many tongues sized by the fire, smoke columns, embers
      const nF = Math.max(1, Math.round(2 + T.fire * 6));
      for (let k = 0; k < 4; k++) { const ph = (t * 0.25 + k / 4) % 1; g.fillStyle = `rgba(50,40,50,${0.35 * (1 - ph) * T.fire})`; g.beginPath(); g.arc(hx - 30 + k * 20 + Math.sin(ph * 4 + k) * 20, hy - 200 - ph * 160, 20 + ph * 50, 0, 7); g.fill(); }
      for (let k = 0; k < nF; k++) { const fx = hx - 80 + (k + 0.5) * 160 / nF, fy = hy - 100 - Math.sin((k + 0.5) / nF * Math.PI) * 70; MGH.flame(g, fx, fy, 0.35 + T.fire * 0.75, t + k * 0.7, k + tm * 5); }
      if (T.fire > 0.05) MGH.glow(g, hx, hy - 120, 200 * T.fire + 40, `rgba(255,150,60,${0.3 * T.fire})`);
      for (let k = 0; k < 8; k++) { const ph = (t * 0.6 + k * 0.13) % 1; g.fillStyle = `rgba(255,${180 + k * 8},80,${(1 - ph) * T.fire})`; g.beginPath(); g.arc(hx - 60 + MGH.hash(k + tm) * 120 + Math.sin(ph * 6 + k) * 12, hy - 140 - ph * 200, 2.2, 0, 7); g.fill(); }
      if (T.steam > 0) for (let k = 0; k < 6; k++) { const ph = 1 - T.steam / 1.2; g.fillStyle = `rgba(240,245,255,${0.5 * T.steam})`; g.beginPath(); g.arc(hx - 50 + k * 20, hy - 120 - ph * 90 - k * 6, 14 + ph * 26, 0, 7); g.fill(); }
      if (T.out) MGH.label(g, 'FIRE OUT! 🎉', hx, hy - 220, 26, '#9fe0ff');
      // pump with handle, the bucket, the thrower
      const pumpX = ox + 70; g.fillStyle = '#4a5a7a'; MGH.rr(g, pumpX - 14, 520, 28, 110, 6); g.fill(); g.fillStyle = '#6a7a9a'; g.fillRect(pumpX - 8, 530, 6, 90);
      const handle = m.held(R_.pump, 'a') && T.st === 'pump' ? Math.sin(t * 16) * 0.4 : 0; g.save(); g.translate(pumpX, 522); g.rotate(-0.4 + handle); g.strokeStyle = '#3a3a48'; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, 0); g.lineTo(-50, 0); g.stroke(); g.lineCap = 'butt'; g.restore();
      g.fillStyle = '#4a5a7a'; g.fillRect(pumpX + 10, 540, 34, 10); if (m.held(R_.pump, 'a') && T.st === 'pump' && T.spill <= 0) { g.fillStyle = 'rgba(120,200,255,0.9)'; g.fillRect(pumpX + 40, 550, 6, 40 + Math.sin(t * 30) * 2); }
      Char.draw(g, pumpX - 50, 560, 26, pp.el.id, pp.color, { mood: MGH.persona(T.spill > 0 ? 'hurt' : m.held(R_.pump, 'a') ? 'effort' : 'happy', pp.el.id), seed: R_.pump, look: { x: 1, y: 0 }, hands: { n: { x: 1.1, y: -0.9 + handle, d: 0, o: false, m: true }, f: { x: 0.9, y: -0.7 + handle, d: 0, o: false, m: false } } });
      const bucket = (bx, by, lvl, rot = 0) => { g.save(); g.translate(bx, by); g.rotate(rot); g.fillStyle = '#8a9098'; g.beginPath(); g.moveTo(-20, -26); g.lineTo(20, -26); g.lineTo(15, 8); g.lineTo(-15, 8); g.fill(); g.strokeStyle = '#5a6068'; g.lineWidth = 2; g.stroke(); g.beginPath(); g.arc(0, -26, 20, Math.PI, 0); g.stroke(); g.fillStyle = '#4ab0f0'; const h = 32 * Math.min(1, lvl); g.fillRect(-17 + (1 - lvl) * 2, 6 - h, 34 - (1 - lvl) * 4, h); g.fillStyle = 'rgba(255,255,255,0.4)'; g.fillRect(-14, 6 - h, 28, 3); g.restore(); };
      const tX = ox + 250, tY = 590;
      if (T.st === 'pump') { bucket(pumpX + 44, 618, T.fill); if (T.spill > 0) { g.fillStyle = 'rgba(120,200,255,0.6)'; g.beginPath(); g.ellipse(pumpX + 44, 630, 40, 8, 0, 0, 7); g.fill(); }
        g.fillStyle = 'rgba(0,0,0,0.55)'; MGH.rr(g, ox + 130, 500, 18, 130, 8); g.fill(); g.fillStyle = 'rgba(120,230,120,0.65)'; g.fillRect(ox + 132, 502, 14, 130 * 0.3); g.fillStyle = '#5ab8ff'; g.fillRect(ox + 132, 630 - 128 * Math.min(1, T.fill), 14, 128 * Math.min(1, T.fill)); }
      if (T.st === 'slide') bucket(pumpX + 44 + T.slide * (tX - pumpX - 24), 618, T.q || 0);
      Char.draw(g, tX, tY - 24, 28, tp.el.id, tp.color, { mood: MGH.persona(T.st === 'aim' ? 'determined' : T.fxT > 0 && T.fx === 'SPLASH!' ? 'cheer' : 'happy', tp.el.id), seed: R_.toss, look: { x: 1, y: -0.4 }, hands: T.st === 'aim' || T.st === 'fly' ? { n: { x: 0.8, y: -1.2, d: -60, o: false, m: true }, f: { x: 1.0, y: -1.0, d: -40, o: false, m: false } } : undefined });
      // angle gauge: a protractor arc beside the thrower, green = the right angle
      const gx = tX + 40, gy = tY - 50, GR = 110, a0 = -0.15, a1 = -1.45, ang = p => a0 + (a1 - a0) * p;
      if (T.st === 'aim' || T.st === 'fly') {
        g.lineCap = 'round'; g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 22; g.beginPath(); g.arc(gx, gy, GR, a1, a0); g.stroke();
        g.strokeStyle = 'rgba(255,90,70,0.85)'; g.lineWidth = 14; g.beginPath(); g.arc(gx, gy, GR, a1, a0); g.stroke();
        g.strokeStyle = '#ffd34d'; g.beginPath(); g.arc(gx, gy, GR, ang(Math.min(1, T.gc + this.GW)), ang(Math.max(0, T.gc - this.GW))); g.stroke();
        g.strokeStyle = '#5ee85a'; g.beginPath(); g.arc(gx, gy, GR, ang(Math.min(1, T.gc + this.GW / 2)), ang(Math.max(0, T.gc - this.GW / 2))); g.stroke(); g.lineCap = 'butt';
        for (let k = 0; k <= 6; k++) { const a = ang(k / 6); g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 2; g.beginPath(); g.moveTo(gx + Math.cos(a) * (GR - 12), gy + Math.sin(a) * (GR - 12)); g.lineTo(gx + Math.cos(a) * (GR + 12), gy + Math.sin(a) * (GR + 12)); g.stroke(); }
        const p = T.st === 'aim' ? this.pos(T) : clamp(T.gc + T.res, 0, 1), a = ang(p), on = Math.abs(p - T.gc) < this.GW / 2;
        g.strokeStyle = on ? '#5ee85a' : '#fff'; g.lineWidth = 4; g.beginPath(); g.moveTo(gx, gy); g.lineTo(gx + Math.cos(a) * (GR + 18), gy + Math.sin(a) * (GR + 18)); g.stroke();
        g.fillStyle = on ? '#5ee85a' : '#fff'; g.beginPath(); g.arc(gx + Math.cos(a) * GR, gy + Math.sin(a) * GR, 11, 0, 7); g.fill(); g.strokeStyle = '#2a2a2a'; g.lineWidth = 2; g.stroke();
        g.fillStyle = '#3a3a3a'; g.beginPath(); g.arc(gx, gy, 7, 0, 7); g.fill();
        if (T.st === 'aim') bucket(tX + 26, tY - 70, T.q || 0, a + Math.PI / 2 - 0.2);
      }
      // the water in flight: a real arc that lands short, long, or right on the fire
      if (T.st === 'fly') { const land = hx + T.res * 520, sx = tX + 26, sy = tY - 70, k = T.fly, x = sx + (land - sx) * k, y = sy + ((hy - 120) - sy) * k - Math.sin(k * Math.PI) * (160 + T.res * 200);
        for (let q = 0; q < 8; q++) { const kk = Math.max(0, k - q * 0.025), xx = sx + (land - sx) * kk, yy = sy + ((hy - 120) - sy) * kk - Math.sin(kk * Math.PI) * (160 + T.res * 200); g.fillStyle = `rgba(120,200,255,${0.9 - q * 0.1})`; g.beginPath(); g.arc(xx + Math.sin(q * 2 + t * 30) * 3, yy, 12 - q, 0, 7); g.fill(); }
        g.fillStyle = 'rgba(255,255,255,0.7)'; g.beginPath(); g.arc(x - 3, y - 3, 4, 0, 7); g.fill(); }
      // fire meter + team tag
      g.fillStyle = MG.TEAMC[tm]; MGH.rr(g, ox + 30, 140, 160, 36, 18); g.fill(); MGH.text(g, MG.TEAMN[tm], ox + 110, 165, 20, '#fff', 'center', 'bold');
      g.fillStyle = 'rgba(0,0,0,0.55)'; MGH.rr(g, ox + 360, 150, 220, 20, 10); g.fill(); const fg = g.createLinearGradient(ox + 362, 0, ox + 578, 0); fg.addColorStop(0, '#ffd34d'); fg.addColorStop(1, '#ff3a1a'); g.fillStyle = fg; MGH.rr(g, ox + 362, 152, 216 * T.fire, 16, 8); g.fill(); MGH.text(g, '🔥 fire', ox + 470, 144, 15, '#fff', 'center', 'bold');
      if (T.fxT > 0) MGH.label(g, T.fx, ox + 300, 250, 24, T.fx === 'SPLASH!' ? '#9fe0ff' : T.fx === 'glanced' ? '#ffe680' : '#ff9a9a');
    });
    if (S.half && m.t < 24.5) MGH.label(g, 'SWAP JOBS!', 640, 100, 34, '#ffe680');
  },
});

// ======================================================================== LOG ROLL: logs seen end-on with big, clear spin arrows
MG.byId.logroll && (MG.byId.logroll.draw = function (m, S, g) {
  const t = m.t;
  MGH.scene(g, 'forest', t);
  GX.vfill(g, 0, 470, 1280, 250, ['#4aa8e0', '#2a78b8', '#1a5090']);
  for (let k = 0; k < 20; k++) { g.strokeStyle = 'rgba(255,255,255,0.3)'; g.lineWidth = 2; const y = 490 + (k % 6) * 36, x = ((k * 97 + t * 60) % 1400) - 60; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 20, y - 4, x + 40, y); g.stroke(); }
  S.p.forEach((P, i) => {
    const p = m.players[i], x = 160 + i * 320, y = 540, R0 = 72;
    P.rot = (P.rot || 0) + P.spin * 3 * (m.dt || 1 / 60); // visual rotation follows the spin
    // water churn around the log
    for (let q = 0; q < 3; q++) { const ph = (t * 1.5 + q / 3) % 1; g.strokeStyle = `rgba(255,255,255,${0.5 * (1 - ph)})`; g.lineWidth = 2; g.beginPath(); g.ellipse(x, y + 46, R0 + ph * 40, 12 + ph * 6, 0, 0, 7); g.stroke(); }
    // the log end: bark ring, growth rings and cracks that visibly turn
    g.save(); g.translate(x, y);
    const bark = g.createRadialGradient(-20, -20, 10, 0, 0, R0); bark.addColorStop(0, '#8a5a30'); bark.addColorStop(1, '#4a2a14'); g.fillStyle = bark; g.beginPath(); g.arc(0, 0, R0, 0, 7); g.fill();
    g.rotate(-P.rot);
    for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2; g.fillStyle = '#3a200e'; g.beginPath(); g.moveTo(Math.cos(a) * R0, Math.sin(a) * R0); g.lineTo(Math.cos(a + 0.12) * (R0 + 5), Math.sin(a + 0.12) * (R0 + 5)); g.lineTo(Math.cos(a + 0.24) * R0, Math.sin(a + 0.24) * R0); g.fill(); }
    const wood = g.createRadialGradient(0, 0, 4, 0, 0, R0 - 10); wood.addColorStop(0, '#f0c890'); wood.addColorStop(1, '#c8904e'); g.fillStyle = wood; g.beginPath(); g.arc(0, 0, R0 - 10, 0, 7); g.fill();
    g.strokeStyle = 'rgba(120,70,30,0.45)'; g.lineWidth = 2; for (let r = 10; r < R0 - 12; r += 9) { g.beginPath(); g.arc(1, 1, r, 0, 7); g.stroke(); }
    g.strokeStyle = '#6a3a18'; g.lineWidth = 4; g.beginPath(); g.moveTo(0, 0); g.lineTo(R0 - 14, 0); g.moveTo(0, 0); g.lineTo(-(R0 - 20) * 0.5, (R0 - 20) * 0.86); g.stroke();
    g.fillStyle = '#e84a3a'; g.beginPath(); g.arc(R0 - 22, 0, 6, 0, 7); g.fill(); // a painted mark makes the turning obvious
    g.restore();
    // big spin arrow around the log: thicker + brighter the faster it rolls
    const sp = Math.min(1, Math.abs(P.spin) / 1.6), dir = P.spin > 0 ? 1 : -1, col = sp > 0.66 ? '255,80,60' : sp > 0.33 ? '255,190,60' : '120,230,120';
    if (Math.abs(P.spin) > 0.08) {
      const a0 = -Math.PI * 0.85, a1 = -Math.PI * 0.15, RA = R0 + 26;
      g.strokeStyle = `rgba(${col},0.9)`; g.lineWidth = 6 + sp * 8; g.lineCap = 'round'; g.beginPath(); g.arc(x, y, RA, a0, a1); g.stroke(); g.lineCap = 'butt';
      const ae = dir > 0 ? a0 : a1, tang = ae + (dir > 0 ? -Math.PI / 2 : Math.PI / 2), hx = x + Math.cos(ae) * RA, hy = y + Math.sin(ae) * RA, hs = 16 + sp * 10;
      g.fillStyle = `rgb(${col})`; g.beginPath(); g.moveTo(hx + Math.cos(tang) * hs, hy + Math.sin(tang) * hs); g.lineTo(hx + Math.cos(tang + 2.4) * hs, hy + Math.sin(tang + 2.4) * hs); g.lineTo(hx + Math.cos(tang - 2.4) * hs, hy + Math.sin(tang - 2.4) * hs); g.fill();
      for (let q = 0; q < 3; q++) { const ph = ((t * (1 + sp * 2) + q / 3) % 1), a = dir > 0 ? a1 - (a1 - a0) * ph : a0 + (a1 - a0) * ph; g.fillStyle = 'rgba(255,255,255,0.85)'; g.beginPath(); g.arc(x + Math.cos(a) * RA, y + Math.sin(a) * RA, 4, 0, 7); g.fill(); }
      // which way to run (opposite to the surface)
      if (!P.out) MGH.text(g, dir > 0 ? 'run ➜' : '⬅ run', x, y + R0 + 34, 18, `rgb(${col})`, 'center', 'bold');
    }
    if (!P.out) { const a = P.pos * 1.3, cx = x + Math.sin(a) * (R0 + 20), cy = y - Math.cos(a) * (R0 + 20) - 18;
      g.save(); g.translate(cx, cy); g.rotate(a * 0.9); Char.draw(g, 0, 0, 26, p.el.id, p.color, { mood: MGH.persona(Math.abs(P.pos) > 0.6 ? 'scared' : 'determined', p.el.id), seed: i * 1.7, look: { x: Math.sign(P.v) || 1, y: 0 }, walk: 1, t: t * (1.5 + Math.abs(P.spin)), noShadow: true, hands: { n: { x: -1.4, y: -0.4 + P.pos, d: 180, o: true, m: true }, f: { x: 1.4, y: -0.4 - P.pos, d: 0, o: true, m: false } } }); g.restore();
      g.fillStyle = 'rgba(0,0,0,0.45)'; MGH.rr(g, x - 56, 360, 112, 12, 6); g.fill(); g.fillStyle = 'rgba(120,240,120,0.35)'; g.fillRect(x - 32, 361, 64, 10);
      g.fillStyle = Math.abs(P.pos) > 0.6 ? '#ff6b6b' : '#7cf06a'; MGH.rr(g, x - 4 + P.pos * 52, 354, 8, 24, 4); g.fill(); }
    else { const bob = Math.sin(t * 3 + i) * 4; Char.draw(g, x + 90, 620 + bob, 18, p.el.id, p.color, { headOnly: true, mood: 'sad', seed: i * 1.7, noShadow: true }); g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 2; g.beginPath(); g.ellipse(x + 90, 636, 26, 6, 0, 0, 7); g.stroke(); }
    g.fillStyle = 'rgba(0,0,0,0.4)'; MGH.rr(g, x - 60, 684, 120, 28, 14); g.fill(); MGH.text(g, p.name, x, 705, 18, p.color, 'center', 'bold');
  });
});
