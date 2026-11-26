'use strict';
// THE TRAITORS — reworked: Alin's gem hunt, the shield, the rune pillars, poison gems and the dagger.
//   Wave       (unchanged) everyone presses A; the Traitor's A does nothing, so they press B to wave instead.
//   Mission    gems spill across the courtyard (sometimes a handful, sometimes a shower). A grabs one,
//              A beside Alin hands it in — one at a time. Each corner has a rune pillar in a player's colour:
//              16 slabs, four of each rune. Once, the lights go out for a second… and afterwards the
//              Traitor's pillar has two slabs swapped. Sharp eyes can spot it.
//   The Traitor may use ONE of two secret tricks (never both):
//              B  drops a poison gem under them that looks exactly like the rest — whoever else picks it up is
//                 secretly poisoned (the Traitor can carry it harmlessly);
//              Y  hides a dagger somewhere on the field — only the Traitor can pick it up, and it makes their
//                 vote count twice at the Round Table.
//   Shield     the top gem collector gets Alin's shield and secretly protects themselves or someone else.
//   Outcome    no gem counts, no word on the shield — only who was poisoned (if anyone) and who collected most.
//   Vote       survivors vote; catch the Traitor and every Faithful wins (even with zero gems).
(() => {
  const OLD = MG.byId.traitors;
  const ALIN = { x: 640, y: 372 }, MISSION = 62, POISONS = 1;
  const PIL = [{ x: 118, y: 236 }, { x: 1162, y: 236 }, { x: 118, y: 618 }, { x: 1162, y: 618 }];
  const SEATS = [{ x: 640, y: 290, btn: 'y', key: 'up', lab: 'Y', arrow: '▲', col: '#ffd34d' }, { x: 900, y: 440, btn: 'b', key: 'right', lab: 'B', arrow: '▶', col: '#ff5a5a' },
    { x: 640, y: 590, btn: 'a', key: 'down', lab: 'A', arrow: '▼', col: '#5fd85f' }, { x: 380, y: 440, btn: 'x', key: 'left', lab: 'X', arrow: '◀', col: '#4f9dff' }];
  const av = (g, m, i, x, y, r, mood, o = {}) => MGH.av(g, m, i, x, y, r, mood, Object.assign({ noIdle: true }, o));
  const RUNE_C = ['#ffcf3a', '#a8c8ff', '#ff6a4a', '#4fe0c8'];
  const GEM_C = [['#ff5ab4', '#ffc0e4'], ['#5ac8ff', '#c8f0ff'], ['#7cf06a', '#d8ffcc'], ['#ffd34d', '#fff2b8'], ['#b88aff', '#e8d8ff']];

  // a cut gem; looks identical whether or not it is poisoned
  function gem(g, x, y, hue, t, s = 1) {
    const [c1, c2] = GEM_C[hue % GEM_C.length]; g.save(); g.translate(x, y + Math.sin(t * 3 + hue) * 2); g.scale(s, s);
    MGH.glow(g, 0, 0, 22, 'rgba(255,255,255,0.35)');
    g.fillStyle = c1; g.beginPath(); g.moveTo(-11, -4); g.lineTo(-6, -11); g.lineTo(6, -11); g.lineTo(11, -4); g.lineTo(0, 12); g.closePath(); g.fill();
    g.fillStyle = c2; g.beginPath(); g.moveTo(-6, -11); g.lineTo(6, -11); g.lineTo(3, -4); g.lineTo(-3, -4); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-11, -4); g.lineTo(11, -4); g.moveTo(-3, -4); g.lineTo(0, 12); g.lineTo(3, -4); g.stroke();
    if ((t * 1.3 + hue * 0.37) % 2 < 0.12) MGH.star(g, 5, -9, 4, '#fff', 0, false);
    g.restore();
  }
  // the four runes: sun, moon, flame, wave
  function rune(g, x, y, k, s) {
    g.save(); g.translate(x, y); g.fillStyle = RUNE_C[k]; g.strokeStyle = RUNE_C[k]; g.lineWidth = 2.2; const r = s * 0.32;
    if (k === 0) { g.beginPath(); g.arc(0, 0, r * 0.6, 0, 7); g.fill(); for (let q = 0; q < 8; q++) { const a = q / 8 * 6.28; g.beginPath(); g.moveTo(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8); g.lineTo(Math.cos(a) * r * 1.15, Math.sin(a) * r * 1.15); g.stroke(); } }
    if (k === 1) { g.beginPath(); g.arc(0, 0, r, 0.5, 5.8); g.arc(r * 0.45, -r * 0.1, r * 0.75, 5.5, 0.8, true); g.fill(); }
    if (k === 2) { g.beginPath(); g.moveTo(0, -r * 1.1); g.quadraticCurveTo(r * 1.1, r * 0.2, 0, r); g.quadraticCurveTo(-r * 1.1, r * 0.2, 0, -r * 1.1); g.fill(); }
    if (k === 3) { g.beginPath(); for (let q = 0; q < 2; q++) { const yy = (q - 0.5) * r * 0.9; g.moveTo(-r, yy); g.quadraticCurveTo(-r / 2, yy - r * 0.5, 0, yy); g.quadraticCurveTo(r / 2, yy + r * 0.5, r, yy); } g.stroke(); }
    g.restore();
  }
  // Alin, the host: fluffy white hair, sparkly magenta tailcoat, gold lapels, big bow tie, microphone
  function alin(g, x0, y0, t, mood = 'happy', wave = 0, sc = 1.4) {
    g.save(); g.translate(x0, y0); g.scale(sc, sc); const x = 0, y = 0;
    const bob = Math.sin(t * 2.4) * 2;
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(x, y + 46, 34, 9, 0, 0, 7); g.fill();
    g.fillStyle = '#2a1a3a'; MGH.rr(g, x - 13, y + 18, 10, 26, 4); g.fill(); MGH.rr(g, x + 3, y + 18, 10, 26, 4); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(x - 9, y + 45, 9, 5, 0, 0, 7); g.ellipse(x + 9, y + 45, 9, 5, 0, 0, 7); g.fill();
    g.save(); g.translate(x, y + bob);
    // tailcoat with tails and sequins
    const cg = g.createLinearGradient(0, -20, 0, 30); cg.addColorStop(0, '#ff4fb0'); cg.addColorStop(1, '#a8187a'); g.fillStyle = cg;
    g.beginPath(); g.moveTo(-22, -16); g.quadraticCurveTo(-30, 10, -26, 34); g.lineTo(-8, 22); g.lineTo(8, 22); g.lineTo(26, 34); g.quadraticCurveTo(30, 10, 22, -16); g.closePath(); g.fill();
    for (let q = 0; q < 14; q++) { const sx = MGH.hash(q) * 40 - 20, sy = MGH.hash(q + 9) * 40 - 14; g.fillStyle = (t * 2 + q) % 3 < 0.4 ? '#fff' : 'rgba(255,220,250,0.6)'; g.beginPath(); g.arc(sx, sy, 1.4, 0, 7); g.fill(); }
    g.fillStyle = '#ffd34d'; g.beginPath(); g.moveTo(-8, -16); g.lineTo(-2, 8); g.lineTo(-12, -6); g.closePath(); g.fill(); g.beginPath(); g.moveTo(8, -16); g.lineTo(2, 8); g.lineTo(12, -6); g.closePath(); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.moveTo(-6, -16); g.lineTo(6, -16); g.lineTo(0, 8); g.closePath(); g.fill();
    g.fillStyle = '#2ad0ff'; g.beginPath(); g.moveTo(0, -14); g.lineTo(-10, -20); g.lineTo(-10, -8); g.closePath(); g.moveTo(0, -14); g.lineTo(10, -20); g.lineTo(10, -8); g.closePath(); g.fill(); g.beginPath(); g.arc(0, -14, 3, 0, 7); g.fill();
    // arms: one holds the mic, the other waves / presents
    g.strokeStyle = '#d8208e'; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(-18, -10); g.lineTo(-28, 4); g.stroke();
    const wa = wave > 0 ? -1.2 + Math.sin(t * 14) * 0.4 : -0.2; g.beginPath(); g.moveTo(18, -10); g.lineTo(18 + Math.cos(wa) * 16, -10 + Math.sin(wa) * 16); g.stroke();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(-28, 4, 5, 0, 7); g.arc(18 + Math.cos(wa) * 18, -10 + Math.sin(wa) * 18, 5, 0, 7); g.fill();
    g.fillStyle = '#333'; g.fillRect(-31, -12, 5, 16); g.fillStyle = '#888'; g.beginPath(); g.arc(-28.5, -14, 6, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,0.4)'; g.beginPath(); g.arc(-30, -16, 2, 0, 7); g.fill();
    // head: peach face, huge sparkly eyes, rosy cheeks, cloud of white hair with a little star clip
    g.fillStyle = '#ffd8c0'; g.beginPath(); g.arc(0, -36, 18, 0, 7); g.fill();
    g.fillStyle = '#f4f4ff'; for (const [hx, hy, hr] of [[-16, -44, 9], [-8, -52, 10], [4, -54, 10], [15, -47, 9], [19, -36, 7], [-19, -33, 7], [-2, -58, 7]]) { g.beginPath(); g.arc(hx, hy, hr, 0, 7); g.fill(); }
    g.fillStyle = 'rgba(200,200,230,0.6)'; g.beginPath(); g.arc(10, -50, 4, 0, 7); g.fill();
    MGH.star(g, 16, -52, 5, '#ffd34d', 0.3, false);
    if (mood === 'shock') { g.fillStyle = '#3a2050'; g.beginPath(); g.arc(-6, -35, 3.4, 0, 7); g.arc(6, -35, 3.4, 0, 7); g.fill(); g.beginPath(); g.arc(0, -25, 3.5, 0, 7); g.fill(); }
    else { g.fillStyle = '#3a2050'; g.beginPath(); g.ellipse(-6, -36, 3.2, 4.2, 0, 0, 7); g.ellipse(6, -36, 3.2, 4.2, 0, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(-5, -38, 1.4, 0, 7); g.arc(7, -38, 1.4, 0, 7); g.fill();
      g.strokeStyle = '#a83a5a'; g.lineWidth = 2; g.beginPath(); g.arc(0, -29, 5, 0.2, Math.PI - 0.2); g.stroke(); }
    g.fillStyle = 'rgba(255,120,150,0.45)'; g.beginPath(); g.ellipse(-11, -30, 4, 2.5, 0, 0, 7); g.ellipse(11, -30, 4, 2.5, 0, 0, 7); g.fill();
    g.restore(); g.restore();
  }

  // the castle garden, baked once per day / night
  function garden(g, day) {
    const L = day ? { lawn: ['#9ad870', '#7cc45a'], stripe: 'rgba(255,255,255,0.08)', stone: ['#e8dcc4', '#c8b898'], grout: 'rgba(120,100,70,0.35)', hedge: ['#4aa84a', '#2a7a32'], wall: ['#d8c8a8', '#b8a480'], sky: ['#9ad4ff', '#d8f0ff'] }
      : { lawn: ['#2a5a48', '#1e4a3c'], stripe: 'rgba(255,255,255,0.04)', stone: ['#6a7090', '#4a5070'], grout: 'rgba(10,10,30,0.4)', hedge: ['#24604a', '#163e32'], wall: ['#4a4e6a', '#34384e'], sky: ['#141a3a', '#2a3060'] };
    // lawn with mowing stripes
    GX.vfill(g, 0, 40, 1280, 680, L.lawn); for (let x = 0; x < 1280; x += 80) { g.fillStyle = L.stripe; g.fillRect(x, 40, 40, 680); }
    // castle wall along the top with crenellations, windows and colour banners
    GX.vfill(g, 0, 40, 1280, 58, L.wall); for (let x = 0; x < 1280; x += 46) { g.fillStyle = L.wall[1]; g.fillRect(x, 40, 30, 8); }
    for (let x = 20; x < 1280; x += 60) for (let r = 0; r < 2; r++) { g.strokeStyle = L.grout; g.lineWidth = 1; g.strokeRect(x - (r * 30), 52 + r * 20, 60, 20); }
    for (const x of [300, 640, 980]) { g.fillStyle = day ? '#5a7aa8' : '#ffd890'; g.beginPath(); g.moveTo(x - 14, 92); g.lineTo(x - 14, 64); g.arc(x, 64, 14, Math.PI, 0); g.lineTo(x + 14, 92); g.fill(); if (!day) MGH.glow(g, x, 74, 40, 'rgba(255,210,120,0.35)'); }
    ['#e8323e', '#2a6ae8', '#3ac85a', '#ffd34d', '#c86ae8', '#ff8a2a'].forEach((c, k) => { const x = 140 + k * 200; g.fillStyle = c; g.beginPath(); g.moveTo(x - 16, 46); g.lineTo(x + 16, 46); g.lineTo(x + 16, 92); g.lineTo(x, 82); g.lineTo(x - 16, 92); g.fill(); g.fillStyle = 'rgba(255,255,255,0.7)'; MGH.star(g, x, 64, 6, '#fff', 0, false); });
    g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(0, 98, 1280, 8);
    // stone plaza around Alin's stage, and paths out to the four pillars
    const flag = (cx, cy, r) => { g.fillStyle = L.stone[0]; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill(); g.strokeStyle = L.grout; g.lineWidth = 2; for (let rr = 40; rr < r; rr += 42) { g.beginPath(); g.arc(cx, cy, rr, 0, 7); g.stroke(); } for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; g.beginPath(); g.moveTo(cx + Math.cos(a) * 40, cy + Math.sin(a) * 40); g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); g.stroke(); } };
    PIL.forEach(p => { const steps = 9; for (let s = 1; s < steps; s++) { const x = ALIN.x + (p.x - ALIN.x) * s / steps, y = ALIN.y + 30 + (p.y + 10 - ALIN.y - 30) * s / steps; g.fillStyle = L.stone[s % 2]; g.beginPath(); g.ellipse(x, y, 30, 18, 0, 0, 7); g.fill(); g.strokeStyle = L.grout; g.lineWidth = 1.5; g.stroke(); } g.fillStyle = L.stone[1]; g.beginPath(); g.ellipse(p.x, p.y + 20, 86, 34, 0, 0, 7); g.fill(); });
    flag(ALIN.x, ALIN.y + 30, 190);
    g.strokeStyle = day ? '#b8a070' : '#3a3e5a'; g.lineWidth = 6; g.beginPath(); g.arc(ALIN.x, ALIN.y + 30, 190, 0, 7); g.stroke();
    // flower beds and hedges
    const hedge = (x, y, w, h) => { g.fillStyle = 'rgba(0,0,0,0.2)'; MGH.rr(g, x + 4, y + 8, w, h, 14); g.fill(); const hg = g.createLinearGradient(0, y, 0, y + h); hg.addColorStop(0, L.hedge[0]); hg.addColorStop(1, L.hedge[1]); g.fillStyle = hg; MGH.rr(g, x, y, w, h, 14); g.fill(); for (let k = 0; k < w / 16; k++) { g.fillStyle = 'rgba(255,255,255,0.08)'; g.beginPath(); g.arc(x + 10 + k * 16, y + 8 + (k % 2) * 4, 7, 0, 7); g.fill(); } };
    const bed = (x, y, w, h, seed) => { g.fillStyle = day ? '#8a5a3a' : '#3a2a28'; MGH.rr(g, x, y, w, h, 10); g.fill(); for (let k = 0; k < (w * h) / 260; k++) { const fx = x + 8 + MGH.hash(k + seed) * (w - 16), fy = y + 8 + MGH.hash(k + seed + 50) * (h - 16), c = ['#ff5a7a', '#ffd34d', '#ffffff', '#c88aff', '#ff8a3a'][k % 5]; g.fillStyle = L.hedge[0]; g.beginPath(); g.arc(fx, fy + 3, 4, 0, 7); g.fill(); g.fillStyle = c; for (let p = 0; p < 5; p++) { const a = p / 5 * 6.28; g.beginPath(); g.arc(fx + Math.cos(a) * 3, fy + Math.sin(a) * 3, 2.4, 0, 7); g.fill(); } } };
    hedge(250, 112, 280, 26); hedge(750, 112, 280, 26); hedge(250, 682, 280, 26); hedge(750, 682, 280, 26);
    hedge(14, 330, 26, 140); hedge(1240, 330, 26, 140);
    bed(330, 160, 150, 50, 1); bed(800, 160, 150, 50, 7); bed(330, 600, 150, 50, 13); bed(800, 600, 150, 50, 19);
    // topiary in planters
    for (const [x, y] of [[250, 400], [1030, 400], [520, 170], [760, 640]]) { g.fillStyle = 'rgba(0,0,0,0.22)'; g.beginPath(); g.ellipse(x + 4, y + 26, 26, 8, 0, 0, 7); g.fill(); g.fillStyle = day ? '#c87a4a' : '#5a3a3a'; g.beginPath(); g.moveTo(x - 18, y + 4); g.lineTo(x + 18, y + 4); g.lineTo(x + 13, y + 26); g.lineTo(x - 13, y + 26); g.fill(); const tg = g.createRadialGradient(x - 8, y - 22, 4, x, y - 14, 26); tg.addColorStop(0, day ? '#7ad86a' : '#3a7a5a'); tg.addColorStop(1, L.hedge[1]); g.fillStyle = tg; g.beginPath(); g.arc(x, y - 14, 22, 0, 7); g.fill(); }
    // little lamp posts at the plaza edge
    for (let k = 0; k < 4; k++) { const a = k / 4 * Math.PI * 2 + Math.PI / 4, x = ALIN.x + Math.cos(a) * 200, y = ALIN.y + 30 + Math.sin(a) * 200; g.fillStyle = '#3a3a48'; g.fillRect(x - 3, y - 50, 6, 50); g.fillStyle = day ? '#f4f0d8' : '#ffe08a'; g.beginPath(); g.arc(x, y - 56, 9, 0, 7); g.fill(); if (!day) MGH.glow(g, x, y - 56, 60, 'rgba(255,210,120,0.35)'); g.fillStyle = '#3a3a48'; g.fillRect(x - 10, y - 68, 20, 5); }
  }

  MG.def(Object.assign({}, OLD, {
    id: 'traitors', name: 'The Traitors', type: 'Deduction', controls: 'Move + A & B buttons', thumbT: 14, noPadSkip: true,
    cloak() {},
    rows: [['stick', 'Walk'], ['a', 'Grab a gem · hand it to Alin'], ['b', 'Traitor only: drop a poison gem'], ['y', 'Traitor only: hide a dagger']],
    how: 'The castle has secretly chosen one TRAITOR. THE WAVE: everyone quietly presses A — if your character doesn\'t wave, YOU are the Traitor: press B instead. THE MISSION: gems pour into the courtyard — press A to grab one and A again beside the host ALIN to hand it in (one at a time). Whoever hands in the most wins Alin\'s SHIELD and secretly protects one player (or themselves). Watch the four RUNE PILLARS: when the lights go out for a second, the Traitor\'s own pillar gets two slabs swapped! THE TRAITOR may use ONE trick: B drops a POISON gem that looks just like the rest (anyone else who grabs it is secretly poisoned), or Y hides a DAGGER only they can pick up — it makes their vote count twice. THE ROUND TABLE: survivors vote. Catch the Traitor and every Faithful wins — even with zero gems.',
    wins: 'Every Faithful if the Traitor is voted out; otherwise the Traitor.',
    init(m, S) {
      S.traitor = R.int(0, 3);
      S.P = [0, 1, 2, 3].map(i => Object.assign(MGH.body(ALIN.x + [-110, 110, -110, 110][i], ALIN.y + [-90, -90, 120, 120][i], 22), { carry: null, gems: 0, waved: false, waveT: 0, nope: 0, botWave: R.range(0.8, 3.2), spd: R.range(0.82, 1), goal: null, voted: false, poisoned: false, dead: false, dagger: false, sus: [0, 0, 0, 0], idle: 0 }));
      S.phase = 'wave'; S.t = 0; S.mT = 0; S.sparks = []; S.vote = {}; S.order = []; S.shown = 0; S.day = Math.random() < 0.5;
      S.gems = []; S.gT = 1.2; S.hue = 0; S.power = null; S.poisonLeft = POISONS; S.pcd = 0; S.dag = null; S.alinWave = 0;
      S.pil = [0, 1, 2, 3].map(() => R.shuffle([0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3]));
      S.bo = { at: R.range(18, MISSION - 16), done: false, swap: null };
      S.botPlan = R.pick(['b', 'b', 'y', 'y', 'none']);
    },
    update(m, S, dt) {
      S.t += dt; S.alinWave -= dt;
      for (const s of S.sparks) { s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 300 * dt; }
      S.sparks = S.sparks.filter(s => s.t < s.life);
      const ph = S.phase;
      if (ph === 'wave') return this.updWave(m, S, dt);
      if (ph === 'brief') { if (S.t > 6.5) { S.phase = 'mission'; S.t = 0; Sfx.whistle(); } return; }
      if (ph === 'mission') return this.updMission(m, S, dt);
      if (ph === 'shield') return this.updShield(m, S, dt);
      if (ph === 'outcome') { if (S.t > 6) { if (this.alive(S).filter(i => i !== S.traitor).length === 0) { S.phase = 'end'; S.t = 0; S.winner = 'traitor'; S.allDead = true; Sfx.thunder(); } else { S.phase = 'vote'; S.t = 0; } } return; }
      if (ph === 'vote') return this.updVote(m, S, dt);
      if (ph === 'reveal') return this.updReveal(m, S, dt);
      return OLD.update.call(this, m, S, dt); // coin, banish and end work as before
    },
    alive(S) { return [0, 1, 2, 3].filter(i => !S.P[i].dead); },
    spawnGems(S) {
      const n = R.pick([1, 1, 2, 2, 3, 4, 5, 7]);
      for (let k = 0; k < n && S.gems.length < 14; k++) {
        let x, y, ok = false; for (let tries = 0; tries < 20 && !ok; tries++) { x = R.range(170, 1110); y = R.range(110, 640); ok = Math.hypot(x - ALIN.x, y - ALIN.y) > 130 && PIL.every(p => Math.hypot(x - p.x, y - p.y) > 100); }
        if (ok) S.gems.push({ x, y, poison: false, hue: S.hue++, t: 0 });
      }
    },
    updMission(m, S, dt) {
      S.mT += dt; S.pcd -= dt;
      if ((S.gT -= dt) <= 0) { this.spawnGems(S); S.gT = R.range(3.5, 7.5); }
      S.gems.forEach(G => G.t += dt);
      const T = S.traitor;
      S.P.forEach((P, i) => {
        const a = m.axis(i);
        MGH.steer(P, a.x, a.y, dt, 2300, 265, 8); MGH.integrate(P, dt, 40, 80, 1240, 660);
        const dx = P.x - ALIN.x, dy = P.y - ALIN.y, d = Math.hypot(dx, dy) || 1; if (d < 62) { P.x = ALIN.x + dx / d * 62; P.y = ALIN.y + dy / d * 62; }
        PIL.forEach(pp => { const ex = P.x - pp.x, ey = P.y - pp.y, e = Math.hypot(ex, ey) || 1; if (e < 64) { P.x = pp.x + ex / e * 64; P.y = pp.y + ey / e * 64; } });
        if (m.pressed(i, 'a')) {
          if (P.carry && d < 125) { P.gems++; P.carry = null; S.alinWave = 0.8; Sfx.tone(820, 0.07, 'triangle', 0.05); for (let k = 0; k < 10; k++) S.sparks.push({ x: ALIN.x + R.range(-20, 20), y: ALIN.y - 30, vx: R.range(-130, 130), vy: R.range(-280, -100), t: 0, life: R.range(0.4, 0.8), c: R.pick(['#ffc0e4', '#fff', '#ffe680']) }); }
          else if (!P.carry) { const G = S.gems.find(G => Math.hypot(G.x - P.x, G.y - P.y) < 48);
            if (G) { S.gems.splice(S.gems.indexOf(G), 1); P.carry = { hue: G.hue }; if (G.poison && i !== T) P.poisoned = true; Sfx.tone(1100, 0.05, 'triangle', 0.04); }
            else if (i === T && S.dag && Math.hypot(S.dag.x - P.x, S.dag.y - P.y) < 50) { P.dagger = true; this.witness(m, S, P, 320, 0.7); S.dag = null; Sfx.tone(300, 0.08, 'sawtooth', 0.03); } }
        }
        if (i === T) {
          if (m.pressed(i, 'b') && S.power !== 'y' && S.poisonLeft > 0 && S.pcd <= 0) { S.power = 'b'; S.poisonLeft--; S.pcd = 5; S.gems.push({ x: P.x + R.range(-6, 6), y: P.y + 16, poison: true, hue: S.hue++, t: 0 }); this.witness(m, S, P, 260, 0.65); }
          if (m.pressed(i, 'y') && S.power !== 'b' && !S.power) { S.power = 'y'; let x, y; do { x = R.range(180, 1100); y = R.range(120, 630); } while (Math.hypot(x - ALIN.x, y - ALIN.y) < 140); S.dag = { x, y }; }
        }
      });
      MGH.collide(S.P, 0.4);
      // the blackout: one second of total darkness; the Traitor's pillar gets two different slabs swapped
      const B = S.bo; if (!B.done && S.mT >= B.at + 0.5) { B.done = true; const pl = S.pil[T]; let a, b; do { a = R.int(0, 15); b = R.int(0, 15); } while (pl[a] === pl[b]); [pl[a], pl[b]] = [pl[b], pl[a]]; B.swap = [a, b];
        S.P.forEach((P, i) => { if (m.bot(i) && i !== T && Math.random() < 0.38) P.sus[T] += 3; }); }
      if (S.mT >= MISSION) {
        S.P.forEach(P => P.carry = null);
        const best = Math.max(...S.P.map(P => P.gems)), top = [0, 1, 2, 3].filter(i => S.P[i].gems === best);
        S.shieldBy = R.pick(top); S.shieldOn = -1; S.phase = 'shield'; S.t = 0; Sfx.tone(660, 0.3, 'triangle', 0.06);
      }
    },
    // bots nearby may notice the Traitor's trick
    witness(m, S, P, r, pr) { S.P.forEach((Q, j) => { if (j !== S.traitor && m.bot(j) && Math.hypot(Q.x - P.x, Q.y - P.y) < r && Math.random() < pr) Q.sus[S.traitor] += 2; }); },
    updShield(m, S, dt) {
      const i = S.shieldBy;
      if (S.shieldOn < 0 && S.t > 1.2) {
        if (m.bot(i)) { if (S.t > 3) { S.shieldOn = i === S.traitor || Math.random() < 0.6 ? i : R.pick([0, 1, 2, 3].filter(j => j !== i && j !== S.traitor)); Sfx.click(); } }
        else for (let j = 0; j < 4; j++) { const st = SEATS[j]; if (m.pressed(i, st.btn) || m.pressed(i, st.key)) { S.shieldOn = j; Sfx.click(); break; } }
        if (S.shieldOn >= 0) { S.shT = S.t; S.killed = [0, 1, 2, 3].filter(j => S.P[j].poisoned && j !== S.shieldOn); S.killed.forEach(j => S.P[j].dead = true); }
      }
      if (S.shieldOn >= 0 && S.t > S.shT + 1) { S.phase = 'outcome'; S.t = 0; if (S.killed.length) { Sfx.tone(180, 0.7, 'sine', 0.07, -60); Sfx.crowd('ooh'); } else Sfx.crowd('happy'); }
    },
    updVote(m, S, dt) {
      const al = this.alive(S);
      al.forEach(i => {
        const P = S.P[i]; if (P.voted) return;
        const others = al.filter(j => j !== i);
        if (m.bot(i)) {
          P.think = (P.think || R.range(1.2, 3.6)) - dt;
          if (P.think <= 0) { let pick = R.pick(others); if (i !== S.traitor) { const best = Math.max(...others.map(j => P.sus[j])); if (best > 0) pick = others.find(j => P.sus[j] === best); } S.vote[i] = pick; P.voted = true; Sfx.click(); }
          return;
        }
        for (const j of others) { const st = SEATS[j]; if (m.pressed(i, st.btn) || m.pressed(i, st.key)) { S.vote[i] = j; P.voted = true; Sfx.click(); break; } }
      });
      if (al.every(i => S.P[i].voted) && S.t > 1) { S.phase = 'reveal'; S.t = 0; S.order = R.shuffle(al.slice()); S.shown = 0; Sfx.drum(2); }
    },
    weight(S, i) { return S.P[i].dagger ? 2 : 1; },
    updReveal(m, S, dt) {
      const n = Math.floor(S.t / 1.6), N = S.order.length;
      if (n > S.shown && S.shown < N) { S.shown++; Sfx.drum(1); Sfx.tone(300 + S.shown * 60, 0.2, 'triangle', 0.06); }
      if (S.t > N * 1.6 + 2.2) {
        const tally = [0, 0, 0, 0]; for (const [i, v] of Object.entries(S.vote)) tally[v] += this.weight(S, +i);
        const max = Math.max(...tally), top = [0, 1, 2, 3].filter(j => tally[j] === max);
        S.tie = top.length > 1; S.tally = tally; S.banished = R.pick(top); S.unmasked = false;
        if (S.tie) { const k = top.length, idx = top.indexOf(S.banished); S.coin = { c: top, half: 14 + ((idx - 14 % k) + k) % k }; S.phase = 'coin'; S.t = 0; Sfx.tone(900, 0.1, 'triangle', 0.05); }
        else { S.phase = 'banish'; S.t = 0; Sfx.drum(0); Sfx.drum(3); }
      }
    },
    // ---------------------------------------------------------------- bots
    bot(m, S, i, dt) {
      const v = m.vin[i], P = S.P[i]; v.a = v.b = v.y = false; v.ax = v.ay = 0; v.left = v.right = v.up = v.down = false;
      if (S.phase !== 'mission') return;
      if (P.idle > 0) { P.idle -= dt; return; }
      const tap = k => { if (!m.prev[i][k]) v[k] = true; };
      if (i === S.traitor) {
        const near = S.P.some((Q, j) => j !== i && Math.hypot(Q.x - P.x, Q.y - P.y) < 280);
        if (S.botPlan === 'b' && S.mT > 8 && S.poisonLeft > 0 && S.pcd <= 0 && !near && Math.random() < 0.05) tap('b');
        if (S.botPlan === 'y' && S.mT > 10 && !S.power) tap('y');
        if (S.dag) { if (Math.hypot(S.dag.x - P.x, S.dag.y - P.y) > 40) this.go(v, P, S.dag); else tap('a'); return; }
      }
      if (P.carry) { if (Math.hypot(ALIN.x - P.x, ALIN.y - P.y) > 110) this.go(v, P, ALIN); else tap('a'); return; }
      const mine = S.gems.filter(G => !(i === S.traitor && G.poison && Math.random() < 0.02)).sort((a, b) => Math.hypot(a.x - P.x, a.y - P.y) - Math.hypot(b.x - P.x, b.y - P.y))[P.pickN || 0] || S.gems[0];
      if (mine) { if (Math.hypot(mine.x - P.x, mine.y - P.y) > 34) this.go(v, P, mine); else tap('a'); if (Math.random() < 0.004) P.pickN = R.int(0, 1); return; }
      if (!P.goal || Math.hypot(P.goal.x - P.x, P.goal.y - P.y) < 30) P.goal = { x: R.range(200, 1080), y: R.range(140, 620) };
      this.go(v, P, P.goal);
    },
    // ---------------------------------------------------------------- scoring
    score(m, S) {
      return [0, 1, 2, 3].map(i => {
        if (i === S.traitor) return S.winner === 'traitor' ? 1000 : 5;
        if (S.winner === 'faithful') return S.P[i].dead ? 300 : 500;
        return S.P[i].dead ? 10 : 20;
      });
    },
    fmt(s) { return s >= 1000 ? 'The Traitor got away!' : s >= 500 ? 'Faithful — winner' : s >= 300 ? 'Faithful — poisoned (out)' : s >= 20 ? 'fooled by the Traitor' : s >= 10 ? 'poisoned by the Traitor' : 'Traitor — caught'; },
    hud(m, S, i) { const P = S.P[i]; if (S.phase === 'end') return i === S.traitor ? '🗡️ Traitor' : P.dead ? '💀 Faithful' : '🛡️ Faithful'; if (S.phase === 'wave' || S.phase === 'brief') return P.waved ? '👋' : '…'; if (P.dead) return '💀 poisoned'; return S.phase === 'mission' ? (P.carry ? '💎 carrying' : '🔍 searching') : '🕯️'; },
    // ---------------------------------------------------------------- drawing
    draw(m, S, g) {
      const ph = S.phase;
      if (ph === 'wave') return this.drawWave(m, S, g);
      if (ph === 'brief' || ph === 'mission' || ph === 'shield' || ph === 'outcome') this.drawCourt(m, S, g); else this.drawHall(m, S, g);
      for (const s of S.sparks) { g.globalAlpha = 1 - s.t / s.life; g.fillStyle = s.c; g.beginPath(); g.arc(s.x, s.y, 4, 0, 7); g.fill(); } g.globalAlpha = 1;
      if (ph === 'brief') this.drawBrief(m, S, g);
      if (ph === 'shield') this.drawShield(m, S, g);
      if (ph === 'outcome') this.drawOutcome(m, S, g);
      if (ph === 'mission' && S.mT >= S.bo.at && S.mT < S.bo.at + 1) { g.fillStyle = '#000'; g.fillRect(0, 0, 1280, 720); }
    },
    drawBrief(m, S, g) {
      const k = Math.min(1, S.t / 0.4); g.save(); g.globalAlpha = k;
      g.fillStyle = 'rgba(8,4,24,0.86)'; MGH.rr(g, 170, 170, 940, 380, 24); g.fill(); g.strokeStyle = '#ff4fb0'; g.lineWidth = 3; g.stroke();
      alin(g, 300, 400, m.t, 'happy', 1);
      g.font = 'bold 40px Georgia'; g.textAlign = 'left'; g.fillStyle = '#ffe680'; g.fillText(S.day ? '☀️ THE GEM HUNT' : '🌙 THE MIDNIGHT GEM HUNT', 400, 236);
      const lines = ['"Darlings! Gems are falling into my courtyard!', 'Grab them with A and bring them to ME — one at a time.', 'Whoever brings the most wins my SHIELD…', 'Keep an eye on the rune pillars — and on each other.', 'Because one of you… is a TRAITOR!"'];
      lines.forEach((l, q) => MGH.text(g, l, 400, 290 + q * 40, 21, q === 4 ? '#ff8ac8' : '#fff', 'left'));
      MGH.text(g, '— Alin, your host', 400, 510, 17, '#d8b8f0', 'left'); g.restore();
    },
    drawPillar(m, S, g, k) {
      const p = PIL[k], col = m.players[k].color, t = m.t, x0 = p.x - 44, y0 = p.y - 150;
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.ellipse(p.x, p.y + 26, 62, 16, 0, 0, 7); g.fill();
      const sg = g.createLinearGradient(p.x - 56, 0, p.x + 56, 0); sg.addColorStop(0, S.day ? '#a89880' : '#4a4e66'); sg.addColorStop(0.5, S.day ? '#d8c8a8' : '#7a7e98'); sg.addColorStop(1, S.day ? '#9a8a70' : '#3a3e56');
      g.fillStyle = sg; g.fillRect(p.x - 56, y0 - 10, 112, 186); g.fillStyle = col; g.fillRect(p.x - 62, y0 - 24, 124, 18); g.fillRect(p.x - 62, p.y + 14, 124, 14);
      g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(p.x - 62, y0 - 24, 124, 4);
      g.fillStyle = 'rgba(10,8,20,0.55)'; MGH.rr(g, x0 - 4, y0 + 6, 96, 96, 6); g.fill();
      S.pil[k].forEach((r, n) => { const cx = x0 + (n % 4) * 22 + 11 + 2, cy = y0 + 10 + Math.floor(n / 4) * 22 + 11; g.fillStyle = 'rgba(255,255,255,0.08)'; MGH.rr(g, cx - 10, cy - 10, 20, 20, 3); g.fill(); rune(g, cx, cy, r, 22); });
      MGH.text(g, m.players[k].name, p.x, y0 + 128, 15, col, 'center', 'bold');
      MGH.glow(g, p.x, y0 - 16, 30, 'rgba(255,255,255,0.12)');
    },
    drawCourt(m, S, g) {
      const t = m.t, day = S.day;
      GX.blit(g, GX.bake(day ? 'traitors_day' : 'traitors_night', b => garden(b, day)));
      // butterflies by day, fireflies by night
      for (let k = 0; k < 8; k++) { const x = (k * 167 + Math.sin(t * 0.5 + k) * 90 + 1280) % 1280, y = 140 + (k * 73) % 520 + Math.sin(t * 0.9 + k * 2) * 30;
        if (day) { const fl = Math.abs(Math.sin(t * 12 + k)); g.fillStyle = ['#ff8ac8', '#ffd34d', '#8ae0ff', '#fff'][k % 4]; g.beginPath(); g.ellipse(x - 4 * fl, y, 5 * fl + 1, 3.5, -0.5, 0, 7); g.ellipse(x + 4 * fl, y, 5 * fl + 1, 3.5, 0.5, 0, 7); g.fill(); }
        else { const a = 0.5 + 0.5 * Math.sin(t * 3 + k * 1.7); MGH.glow(g, x, y, 14, `rgba(220,255,120,${0.5 * a})`); g.fillStyle = `rgba(240,255,170,${a})`; g.beginPath(); g.arc(x, y, 2.2, 0, 7); g.fill(); } }
      // Alin's stage: a round glittering podium with a spotlight
      MGH.glow(g, ALIN.x, ALIN.y, 190, day ? 'rgba(255,170,220,0.35)' : 'rgba(255,120,200,0.3)');
      g.fillStyle = '#5a1a4a'; g.beginPath(); g.ellipse(ALIN.x, ALIN.y + 50, 96, 30, 0, 0, 7); g.fill(); g.fillStyle = '#ff4fb0'; g.beginPath(); g.ellipse(ALIN.x, ALIN.y + 42, 96, 30, 0, 0, 7); g.fill();
      for (let q = 0; q < 16; q++) { const a = q / 16 * 6.28 + t * 0.6; g.fillStyle = q % 2 ? '#ffe680' : '#fff'; g.beginPath(); g.arc(ALIN.x + Math.cos(a) * 88, ALIN.y + 42 + Math.sin(a) * 26, 2.5, 0, 7); g.fill(); }
      // her treasure chest (no counts shown — just a glow that grows)
      const tot = S.P.reduce((a, P) => a + P.gems, 0); g.fillStyle = '#7a4a1a'; MGH.rr(g, ALIN.x + 34, ALIN.y + 14, 40, 26, 4); g.fill(); g.fillStyle = '#ffd34d'; g.fillRect(ALIN.x + 34, ALIN.y + 22, 40, 4); MGH.glow(g, ALIN.x + 54, ALIN.y + 14, 20 + Math.min(30, tot), 'rgba(255,200,240,0.5)');
      alin(g, ALIN.x - 12, ALIN.y - 22, t, 'happy', S.alinWave);
      for (let k = 0; k < 4; k++) this.drawPillar(m, S, g, k);
      S.gems.forEach(G => { const pop = Math.min(1, G.t / 0.35); g.fillStyle = 'rgba(0,0,0,0.22)'; g.beginPath(); g.ellipse(G.x, G.y + 18, 14 * pop, 4 * pop, 0, 0, 7); g.fill(); MGH.glow(g, G.x, G.y + 4, 30, 'rgba(255,255,255,0.35)'); gem(g, G.x, G.y - (1 - pop) * 30, G.hue, t, 1.4 * pop); });
      if (S.dag) { g.save(); g.translate(S.dag.x, S.dag.y); g.rotate(0.6); MGH.glow(g, 0, 0, 20, 'rgba(255,60,90,0.35)'); g.fillStyle = '#d8d8e8'; g.beginPath(); g.moveTo(0, -18); g.lineTo(4, 4); g.lineTo(-4, 4); g.closePath(); g.fill(); g.fillStyle = '#6a2a3a'; g.fillRect(-8, 4, 16, 3); g.fillRect(-2, 7, 4, 9); g.restore(); }
      [0, 1, 2, 3].filter(i => !S.P[i].dead || S.phase === 'mission').sort((a, b) => S.P[a].y - S.P[b].y).forEach(i => {
        const P = S.P[i], col = m.players[i].color;
        g.fillStyle = 'rgba(0,0,0,0.4)'; g.beginPath(); g.ellipse(P.x, P.y + 24, 24, 7, 0, 0, 7); g.fill();
        this.cloak(g, P.x, P.y - 6, 1, col, t + i);
        av(g, m, i, P.x, P.y, 24, P.carry ? 'determined' : 'happy', { look: P.face, hands: P.carry ? { n: { x: 0.9, y: 0.1, d: 0, o: true, m: true }, f: { x: 0.6, y: 0.2, d: 0, o: true, m: false } } : undefined });
        if (P.carry) gem(g, P.x + 24 * (P.face.x >= 0 ? 1 : -1), P.y - 6, P.carry.hue, t, 0.8);
        if (day) { g.fillStyle = 'rgba(30,20,40,0.55)'; MGH.rr(g, P.x - 32, P.y + 31, 64, 17, 8); g.fill(); }
        MGH.text(g, m.players[i].name, P.x, P.y + 44, 13, col, 'center', 'bold');
      });
      if (S.phase === 'mission') { const left = Math.max(0, MISSION - S.mT); MGH.label(g, `⏳ ${Math.ceil(left)}s`, 1200, 74, 20, left < 10 ? '#ff8a8a' : '#fff'); }
    },
    drawShield(m, S, g) {
      const i = S.shieldBy, k = Math.min(1, S.t / 0.4); g.save(); g.globalAlpha = k;
      g.fillStyle = 'rgba(8,4,24,0.9)'; g.fillRect(0, 40, 1280, 680);
      alin(g, 250, 420, m.t, 'happy', 1);
      MGH.text(g, '🛡️ ALIN\'S SHIELD', 680, 140, 44, '#ffe680', 'center', 'bold');
      MGH.text(g, `"${m.players[i].name}, you brought me the most gems, darling!"`, 680, 192, 22, '#fff');
      if (S.shieldOn < 0) MGH.text(g, m.bot(i) ? `${m.players[i].name} is choosing…` : `${m.players[i].name}: secretly press the button of who to protect (yourself too!)`, 680, 228, 18, '#ffc0e4');
      else MGH.text(g, S.shieldOn === i ? `🛡️ ${m.players[i].name} kept the shield for themselves!` : `🛡️ ${m.players[i].name} gave the shield to ${m.players[S.shieldOn].name}!`, 680, 228, 20, '#9fffa0', 'center', 'bold');
      // the seats as a button diamond
      SEATS.forEach((st, j) => { const x = 680 + (st.x - 640) * 0.9, y = 430 + (st.y - 440) * 0.9; av(g, m, j, x, y, 22, 'neutral', { look: { x: 0, y: 0 } }); MGH.text(g, m.players[j].name, x, y + 40, 15, m.players[j].color, 'center', 'bold');
        if (S.shieldOn < 0 && !m.bot(i)) { const bx = x + 48, by = y - 18; g.fillStyle = st.col; g.beginPath(); g.arc(bx, by, 15, 0, 7); g.fill(); MGH.text(g, st.lab, bx, by + 6, 17, '#1a1028', 'center', 'bold'); } });
      g.restore();
    },
    drawOutcome(m, S, g) {
      const k = Math.min(1, S.t / 0.4); g.save(); g.globalAlpha = k;
      g.fillStyle = 'rgba(8,4,24,0.9)'; MGH.rr(g, 180, 150, 920, 430, 24); g.fill(); g.strokeStyle = '#ffe680'; g.lineWidth = 3; g.stroke();
      alin(g, 300, 400, m.t, S.killed.length ? 'shock' : 'happy', S.killed.length ? 0 : 1);
      MGH.text(g, '⏳ The mission is over!', 690, 210, 34, '#ffe680', 'center', 'bold');
      if (!S.killed.length) MGH.text(g, '"Wonderful! Everyone made it to the Round Table!"', 690, 270, 22, '#9fffa0');
      else { MGH.text(g, '"Oh no… someone grabbed a POISONED gem…"', 690, 262, 21, '#ff9a9a'); S.killed.forEach((j, q) => { const x = 690 + (q - (S.killed.length - 1) / 2) * 170; g.globalAlpha = k * 0.6; av(g, m, j, x, 360, 30, 'sad'); g.globalAlpha = k; MGH.text(g, `💀 ${m.players[j].name}`, x, 430, 20, m.players[j].color, 'center', 'bold'); }); MGH.text(g, S.killed.length > 1 ? 'They won\'t make it to the Round Table.' : 'They won\'t make it to the Round Table.', 690, 466, 18, '#e0d0f0'); }
      const sy = S.killed.length ? 508 : 330, sh = S.shieldOn === S.shieldBy ? `${m.players[S.shieldBy].name} kept it` : `given to ${m.players[S.shieldOn].name}`;
      MGH.text(g, `💎 Top gem collector: ${m.players[S.shieldBy].name}  ·  🛡️ Shield ${sh}`, 690, sy, 20, m.players[S.shieldBy].color, 'center', 'bold');
      MGH.text(g, 'Did the shield save anyone? Alin isn\'t telling…', 690, sy + 28, 15, '#c8b8e0');
      if (!S.killed.length) MGH.text(g, 'Now… who is the Traitor?', 690, 400, 19, '#d8c8f0');
      g.restore();
    },
    drawHall(m, S, g) {
      const t = m.t, ph = S.phase;
      GX.blit(g, GX.bake('traitors_hall', b => {
        GX.vfill(b, 0, 40, 1280, 680, ['#3a2030', '#2a1420', '#1a0c12']);
        // stone block walls
        for (let y = 40; y < 470; y += 34) for (let x = ((y / 34) % 2) * 40 - 40; x < 1280; x += 80) { b.fillStyle = (x * 3 + y) % 7 ? 'rgba(255,220,200,0.04)' : 'rgba(0,0,0,0.12)'; b.fillRect(x + 2, y + 2, 76, 30); }
        // a tall stained-glass window
        b.save(); b.beginPath(); b.moveTo(560, 400); b.lineTo(560, 140); b.arc(640, 140, 80, Math.PI, 0); b.lineTo(720, 400); b.closePath(); b.clip();
        const SG = ['#e8323e', '#2a6ae8', '#3ac85a', '#ffd34d', '#c86ae8', '#ff8a3a']; for (let k = 0; k < 60; k++) { b.fillStyle = SG[k % 6]; b.globalAlpha = 0.55; b.fillRect(560 + (k % 6) * 27, 60 + Math.floor(k / 6) * 34, 26, 33); } b.globalAlpha = 1; b.restore();
        b.strokeStyle = '#2a1a18'; b.lineWidth = 8; b.beginPath(); b.moveTo(560, 400); b.lineTo(560, 140); b.arc(640, 140, 80, Math.PI, 0); b.lineTo(720, 400); b.closePath(); b.stroke(); b.lineWidth = 4; b.beginPath(); b.moveTo(640, 60); b.lineTo(640, 400); b.moveTo(560, 250); b.lineTo(720, 250); b.stroke();
        MGH.glow(b, 640, 240, 220, 'rgba(255,200,230,0.18)');
        // tapestries in the four player colours… and a dark one
        [[180, '#e8323e'], [330, '#2a6ae8'], [950, '#3ac85a'], [1100, '#ffd34d']].forEach(([x, c]) => { b.fillStyle = '#5a3a1a'; b.fillRect(x - 54, 96, 108, 8); b.fillStyle = c; b.beginPath(); b.moveTo(x - 46, 104); b.lineTo(x + 46, 104); b.lineTo(x + 46, 300); b.lineTo(x, 330); b.lineTo(x - 46, 300); b.fill(); b.fillStyle = 'rgba(0,0,0,0.2)'; b.fillRect(x - 46, 104, 8, 196); b.strokeStyle = '#ffd34d'; b.lineWidth = 3; b.beginPath(); b.moveTo(x - 38, 112); b.lineTo(x + 38, 112); b.lineTo(x + 38, 294); b.lineTo(x, 320); b.lineTo(x - 38, 294); b.closePath(); b.stroke(); MGH.star(b, x, 200, 18, 'rgba(255,240,200,0.85)', 0, false); });
        // floor: a chequered flagstone hall with a red carpet to the table
        GX.vfill(b, 0, 470, 1280, 250, ['#4a3030', '#2a1a1a']); for (let y = 470; y < 720; y += 40) for (let x = 0; x < 1280; x += 80) { b.fillStyle = ((x / 80 + y / 40) % 2) ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.12)'; b.fillRect(x, y, 80, 40); }
        b.fillStyle = '#8a1a2a'; b.beginPath(); b.moveTo(580, 470); b.lineTo(700, 470); b.lineTo(760, 720); b.lineTo(520, 720); b.fill(); b.strokeStyle = '#ffd34d'; b.lineWidth = 3; b.beginPath(); b.moveTo(588, 470); b.lineTo(530, 720); b.moveTo(692, 470); b.lineTo(750, 720); b.stroke();
        b.fillStyle = 'rgba(0,0,0,0.3)'; b.fillRect(0, 466, 1280, 6);
      }));
      // wall torches and a candle chandelier
      for (const x of [60, 470, 810, 1220]) { g.fillStyle = '#3a2a20'; g.fillRect(x - 5, 250, 10, 40); MGH.flame(g, x, 248, 0.5, t, x); MGH.glow(g, x, 236, 70, 'rgba(255,170,80,0.3)'); }
      g.strokeStyle = '#2a1a10'; g.lineWidth = 3; g.beginPath(); g.moveTo(640, 40); g.lineTo(640, 70); g.stroke(); g.strokeStyle = '#8a6a3a'; g.lineWidth = 5; g.beginPath(); g.ellipse(640, 80, 90, 14, 0, 0, 7); g.stroke();
      for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2, cx = 640 + Math.cos(a) * 90, cy = 80 + Math.sin(a) * 14; g.fillStyle = '#f0e6d0'; g.fillRect(cx - 3, cy - 14, 6, 14); g.fillStyle = '#ffcf5a'; g.beginPath(); g.ellipse(cx, cy - 18 + Math.sin(t * 9 + k), 3, 5, 0, 0, 7); g.fill(); }
      MGH.glow(g, 640, 80, 160, 'rgba(255,190,90,0.22)');
      MGH.glow(g, 640, 440, 420, 'rgba(255,170,80,0.25)');
      g.fillStyle = '#2a160c'; g.beginPath(); g.ellipse(640, 452, 230, 96, 0, 0, 7); g.fill();
      g.fillStyle = MGH.grad(g, 350, 540, ['#8a5a32', '#5a3418']); g.beginPath(); g.ellipse(640, 440, 230, 96, 0, 0, 7); g.fill();
      g.strokeStyle = '#c89a5a'; g.lineWidth = 4; g.beginPath(); g.ellipse(640, 440, 206, 82, 0, 0, 7); g.stroke();
      for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2 + 0.3, cx = 640 + Math.cos(a) * 100, cy = 440 + Math.sin(a) * 36; g.fillStyle = '#f0e6d0'; g.fillRect(cx - 4, cy - 24, 8, 24); MGH.glow(g, cx, cy - 30, 24, 'rgba(255,190,90,0.6)'); g.fillStyle = '#ffcf5a'; g.beginPath(); g.ellipse(cx, cy - 30 + Math.sin(t * 9 + k), 4, 7, 0, 0, 7); g.fill(); }
      alin(g, 1130, 470, t, ph === 'banish' ? 'shock' : 'happy', 0);
      if (ph !== 'end' && ph !== 'coin') S.P.forEach((P, i) => {
        if (ph === 'banish' && S.banished === i) return;
        const s = SEATS[i];
        if (P.dead) { g.globalAlpha = 0.35; av(g, m, i, s.x, s.y, 28, 'sad'); g.globalAlpha = 1; MGH.text(g, `💀 ${m.players[i].name}`, s.x, s.y + 46, 17, '#9a8aa8', 'center', 'bold'); return; }
        this.cloak(g, s.x, s.y - 4, 1.1, m.players[i].color, t + i);
        av(g, m, i, s.x, s.y, 28, ph === 'reveal' ? 'neutral' : 'determined', { look: { x: (640 - s.x) / 300, y: (440 - s.y) / 300 } });
        MGH.text(g, m.players[i].name, s.x, s.y + 46, 18, m.players[i].color, 'center', 'bold');
        if (ph === 'vote') { this.seatButton(g, s, s.x + (s.x < 640 ? -62 : 62), s.y - 20); MGH.label(g, P.voted ? '🔒 voted' : m.bot(i) ? '🤔 thinking…' : '🤫 choosing…', s.x, s.y + 74, 15, P.voted ? '#9fffa0' : '#fff'); }
      });
      if (ph === 'vote') { MGH.label(g, '🕯️ THE ROUND TABLE — one vote, one chance', 640, 92, 30, '#ffe680'); MGH.text(g, 'Secretly press the button next to the one you think is the Traitor (keyboard: arrow keys).', 640, 130, 17, '#e0d0f0'); }
      if (ph === 'reveal') this.drawReveal(m, S, g);
      if (ph === 'banish') this.drawBanish(m, S, g);
      if (ph === 'coin') this.drawCoin(m, S, g);
      if (ph === 'end') this.drawEnd(m, S, g);
    },
    drawReveal(m, S, g) {
      MGH.label(g, '📜 The votes are read out…', 640, 92, 30, '#ffe680');
      const tally = [0, 0, 0, 0];
      S.order.slice(0, S.shown).forEach((i, k) => {
        const j = S.vote[i]; tally[j] += 1;
        const s = SEATS[i], fresh = k === S.shown - 1 ? Math.min(1, (S.t - k * 1.6) / 0.3) : 1, o = [{ x: 175, y: -20 }, { x: 0, y: -100 }, { x: 175, y: -20 }, { x: 0, y: -100 }][i];
        g.save(); g.translate(s.x + o.x, s.y + o.y); g.scale(fresh, fresh);
        g.fillStyle = '#f0e6d0'; MGH.rr(g, -76, -26, 152, 46, 8); g.fill(); g.strokeStyle = '#5a3418'; g.lineWidth = 3; g.stroke();
        MGH.text(g, '➜ ' + m.players[j].name, 0, 5, 19, Char.shade(m.players[j].color, -0.35), 'center', 'bold');
        g.restore();
      });
      S.P.forEach((P, j) => { if (!tally[j]) return; const s = SEATS[j]; MGH.label(g, '✖'.repeat(tally[j]), s.x, s.y + 76, 22, '#ff8a8a'); });
    },
    drawEnd(m, S, g) {
      const tw = S.winner === 'traitor', i = S.traitor;
      g.fillStyle = tw ? 'rgba(60,0,20,0.75)' : 'rgba(40,30,0,0.6)'; g.fillRect(0, 40, 1280, 680);
      MGH.glow(g, 640, 400, 360, tw ? 'rgba(255,60,90,0.5)' : 'rgba(255,210,90,0.5)');
      const title = tw ? '🗡️ THE TRAITOR WINS 🗡️' : '🏆 THE FAITHFUL WIN 🏆';
      g.font = 'bold 56px Georgia'; g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 10; g.strokeStyle = '#120610'; g.strokeText(title, 640, 140); g.fillStyle = tw ? '#ff6b8a' : '#ffe680'; g.fillText(title, 640, 140);
      if (tw) { this.cloak(g, 640, 400, 1.8, '#ff4d6d', m.t); av(g, m, i, 640, 410, 52, 'evil'); MGH.text(g, S.allDead ? `${m.players[i].name} poisoned everyone — nobody was left to vote!` : `${m.players[i].name} was the Traitor — and got away with it!`, 640, 580, 26, '#fff', 'center', 'bold'); }
      else { const w = [0, 1, 2, 3].filter(j => j !== i); w.forEach((j, k) => { const x = 640 + (k - 1) * 230; this.cloak(g, x, 400, 1.3, m.players[j].color, m.t + j); const dead = S.P[j].dead, hop = dead ? 0 : Math.abs(Math.sin(m.t * 6 + k)) * 22; g.globalAlpha = dead ? 0.35 : 1; av(g, m, j, x, 410 - hop + (dead ? Math.sin(m.t * 2 + k) * 6 : 0), 40, dead ? 'sad' : 'cheer', dead ? {} : { hands: { n: { x: 0.8, y: -1.5, d: -90, o: true, m: true }, f: { x: -0.8, y: -1.5, d: -90, o: true, m: false } } }); g.globalAlpha = 1; MGH.text(g, dead ? '💀 poisoned — out' : '🎉 wins!', x, 500, 18, dead ? '#b8a8c8' : '#9fffa0', 'center', 'bold'); });
        for (let q = 0; q < 30; q++) { const cx = (q * 97 + m.t * 60 * (1 + q % 3)) % 1280, cy = (q * 53 + m.t * (90 + (q % 4) * 30)) % 680 + 40; g.fillStyle = ['#ffd34d', '#ff6b8a', '#5ac8ff', '#7cf06a'][q % 4]; g.save(); g.translate(cx, cy); g.rotate(m.t * 4 + q); g.fillRect(-4, -2, 8, 4); g.restore(); } MGH.text(g, `${m.players[i].name} the Traitor is caught!`, 640, 580, 26, '#fff', 'center', 'bold'); }
      const P = S.P[i], vic = [0, 1, 2, 3].filter(j => S.P[j].poisoned), saved = vic.filter(j => !S.P[j].dead);
      const plan = S.power === 'b' ? `🧪 The Traitor's plan: a POISON gem${vic.length ? ` — picked up by ${vic.map(j => m.players[j].name).join(' & ')}${saved.length ? ' (but the shield saved them!)' : ''}` : ' — but nobody picked it up'}.`
        : S.power === 'y' ? (P.dagger ? '🗡️ The Traitor\'s plan: a hidden DAGGER — they grabbed it and their vote counted twice!' : '🗡️ The Traitor\'s plan: a hidden DAGGER — but they never picked it up.') : '🤫 The Traitor\'s plan: no tricks at all — they just played it cool.';
      MGH.text(g, plan, 640, 624, 18, '#ffe0f0', 'center', 'bold');
      MGH.text(g, `The blackout swapped two slabs on ${m.players[i].name}'s pillar — did you spot it?`, 640, 652, 15, '#d8c8f0', 'center');
    },
  }));
})();
