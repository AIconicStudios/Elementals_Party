'use strict';
// RING RUMBLE — pro-wrestling mode. Fatal 4-Way (every wrestler for themself) or Tag Team (2 vs 2, all four in the ring).
// Controls: move + A (strike) + B (grab / pick up / pin / climb). Win by pinfall: the last wrestler (or team) standing wins.
(() => {
  const RW = 330, RD = 140, OX = 480, OZF = 215;            // ring half-width/depth, outside floor limits
  const CORN = [[-RW, -RD], [RW, -RD], [RW, RD], [-RW, RD]];
  const ITEMS = {
    chair:   { name: 'Steel Chair', dmg: 14, uses: 4, reach: 95 },
    kendo:   { name: 'Kendo Stick', dmg: 9, uses: 7, reach: 105, fast: true },
    can:     { name: 'Trash Can', dmg: 12, uses: 4, reach: 85 },
    guitar:  { name: 'Guitar', dmg: 24, uses: 1, reach: 95 },
    ext:     { name: 'Extinguisher', dmg: 3, uses: 3, reach: 170, spray: true },
    chicken: { name: 'Rubber Chicken', dmg: 3, uses: 8, reach: 90, silly: true },
    soda:    { name: 'Power Soda', pick: true },
    star:    { name: 'Hype Star', pick: true },
    gloves:  { name: 'Golden Gloves', pick: true },
  };
  const WEAPONS = ['chair', 'kendo', 'can', 'guitar', 'ext', 'chicken'], PICKS = ['soda', 'star', 'gloves'];
  const FIN = { 15: ['press', 'Mountain Drop'], 16: ['spring', 'Sky Rayo'], 17: ['spin', 'Royal Spin'], 18: ['ddt', 'Fang Drop'], 19: ['lariat', 'Freight Train'] };
  const FINB = [['spring', 'Tornado Spring'], ['lariat', 'Tidal Lariat'], ['spin', 'Blaze Spin'], ['press', 'Quake Press']];
  const finOf = el => FIN[el] || FINB[EL_BASE[el] ?? 0];
  const THEMES = [
    { name: 'Grand Arena', mat: '#e8e4f0', apron: '#2a1a5a', apronTxt: '#ffd34d', rope: ['#e8323e', '#ffffff', '#3a7aff'], post: '#c8c8d0', pad: '#e8323e', bg0: '#0a0618', bg1: '#2a1050', light: 'rgba(255,220,140,', floor: '#1a1428' },
    { name: 'Rooftop Rumble', mat: '#dfe8f0', apron: '#101820', apronTxt: '#5affd8', rope: ['#5affd8', '#ff5ad8', '#5affd8'], post: '#3a4250', pad: '#ff5ad8', bg0: '#020414', bg1: '#141a40', light: 'rgba(120,255,230,', floor: '#20262e', city: true },
    { name: 'Jungle Pit', mat: '#e8d8b0', apron: '#4a2a10', apronTxt: '#ffb03a', rope: ['#c88a3a', '#e8c070', '#c88a3a'], post: '#6a4020', pad: '#3a8a3a', bg0: '#08140a', bg1: '#1a3a18', light: 'rgba(255,170,80,', floor: '#3a2a18', jungle: true },
  ];
  const P = (x, z, h = 0) => { const k = 1 + z * 0.0011; return { x: 640 + x * k, y: 440 + z * 0.92 - h * k, k }; };
  const inRing = W => Math.abs(W.x) <= RW + 2 && W.z <= RD + 2 && W.z >= -RD - 2;
  const dist = (a, b) => Math.hypot(a.x - b.x, (a.z - b.z) * 1.6);

  const ring = {
    id: 'ring4', name: 'Ring Rumble: Fatal 4-Way', type: 'Brawl', controls: 'Move + A & B', dur: 0, mode: 'ffa', noBoard: true, long: true,
    rows: [['pad', 'Move · keep going to sprint · walk through ropes to leave'], ['a', 'Strike · stomp downed foes · swing weapon · dive from corner'], ['b', 'Grab (then A knee, B move, ←→ + B whip) · pick up · pin · climb corner']],
    how: 'A wrestling match! Strike with A — keep pressing for a combo, or sprint and press A for a running lariat. Press B next to a foe to GRAB: then A for knees, B for a slam or suplex, or hold a direction and press B to whip them into the ropes (catch them on the rebound with A or B). Fill your HYPE meter to hit your FINISHER from a grab. Pick up chairs, guitars and more with B, swing them with A or throw them with B. Climb a corner with B and dive with A. Pin a downed foe with B — the referee counts to three. Kick out by pressing A when the marker is in the green. Last wrestler standing wins!',
    wins: 'Last wrestler (or team) not pinned.',
    init(m, S) {
      S.th = R.pick(THEMES); S.t = 0; S.elim = []; S.items = []; S.fx = []; S.banner = null; S.slow = 0; S.spawnT = 6; S.ropes = [0, 0, 0, 0]; S.flash = [];
      S.ref = { x: 0, z: -RD + 30, tx: 0, tz: -RD + 30, slap: 0, face: 1 };
      const start = [[-200, -70], [200, -70], [-200, 80], [200, 80]];
      S.w = m.players.map((p, i) => ({ i, x: start[i][0], z: start[i][1], h: 0, vh: 0, vx: 0, vz: 0, face: start[i][0] < 0 ? 1 : -1, hp: 100, mom: 0, st: 'idle', t: 0, cd: 0, combo: 0, comboT: 0, item: null, gloves: 0, runT: 0, run: 0, lastDir: 0, rebounds: 0, ropeT: 0, team: m.teams ? m.teams[i] : i, elim: false, hurtFin: 0, mood: 'determined', pose: null, kick: null, ai: { t: 0, plan: null } }));
      // a couple of weapons on the floor outside, one in a corner
      for (let k = 0; k < 2; k++) this.dropItem(S, R.pick(WEAPONS), R.pick([-1, 1]) * R.range(360, 440), R.range(-60, 180));
      this.dropItem(S, R.pick(WEAPONS), R.pick([-1, 1]) * (RW - 50), R.range(-90, 90));
      S.bannerQ = { text: m.teams ? 'TAG TEAM RUMBLE!' : 'FATAL 4-WAY!', sub: S.th.name, t: 0, life: 2.2, col: '#ffd34d' };
      S.banner = S.bannerQ;
    },
    dropItem(S, k, x, z, fly) { const it = { k, x, z, h: fly ? 260 : 0, vx: fly ? -x * 0.9 * 0 : 0, vz: 0, vh: 0, holder: -1, uses: ITEMS[k].uses || 1, rot: R.range(-0.5, 0.5), spin: 0 }; if (fly) { it.x = fly.x; it.z = fly.z; it.h = 300; it.tx = x; it.tz = z; it.fly = 0; } S.items.push(it); return it; },
    alive(S) { return S.w.filter(w => !w.elim); },
    foes(m, S, W) { return S.w.filter(o => o !== W && !o.elim && (!m.teams || o.team !== W.team)); },
    say(S, text, col = '#fff', sub = '', life = 1.3) { S.banner = { text, sub, col, t: 0, life }; },
    // ------------------------------------------------------------------ damage + states
    hit(m, S, A, V, dmg, kind = 'hurt', o = {}) {
      if (V.elim || V.st === 'move' || V.st === 'moved') return false;
      if (A && A.gloves > 0 && !o.weapon && !o.move) dmg *= 1.6;
      dmg *= o.move && dmg >= 30 ? 0.75 : 0.42; // a long, back-and-forth match
      V.hp = Math.max(0, V.hp - dmg); if (A) { A.mom = Math.min(100, A.mom + dmg * 0.9); } V.mom = Math.min(100, V.mom + dmg * 0.3);
      if (V.st === 'perch') kind = 'down';
      if (V.st === 'pin' || V.st === 'grab' || V.st === 'perch' || V.st === 'climb') this.release(S, V);
      if (V.item && Math.random() < 0.35) this.dropHeld(S, V);
      const p = P(V.x, V.z, 60); MGH.burst(p.x, p.y, ['#fff', '#ffe680', o.col || '#ff6a4a'], kind === 'down' ? 18 : 9, { speed: kind === 'down' ? 300 : 180 });
      if (kind === 'down') { this.down(V, o.push || (A ? A.face : 1) * 140); MGH.shake(o.big ? 12 : 5); Sfx.boom(); } else { V.st = 'hurt'; V.t = 0; V.stunT = o.stun || 0.38; V.vx = (o.push || (A ? A.face : 1) * 90); Sfx.thud(); }
      V.mood = 'hurt'; return true;
    },
    down(V, push = 0, dur) { V.st = 'down'; V.t = 0; V.downFor = dur !== undefined ? dur : 1.1 + (1 - V.hp / 100) * 1.9 + (V.hurtFin > 0 ? 0.8 : 0) + Math.random() * 0.4; V.vx = push; V.vz = 0; V.h = Math.max(0, V.h); V.item && Math.random() < 0.6 && (V.dropMe = true); },
    release(S, W) { // ends any grab / pin W was doing
      if (W.st === 'grab' && W.held !== undefined) { const V = S.w[W.held]; if (V.st === 'held') { V.st = 'idle'; V.t = 0; } }
      if (W.st === 'pin' && W.pinOn !== undefined) { const V = S.w[W.pinOn]; if (V.st === 'pinned') { V.st = 'down'; V.t = 0; V.downFor = 0.6; } S.count = null; }
      if (W.st === 'perch') { W.h = 0; }
      W.held = undefined; W.pinOn = undefined; W.st = 'idle'; W.t = 0;
    },
    dropHeld(S, W) { const it = W.item; if (!it) return; it.holder = -1; it.x = W.x + W.face * 20; it.z = W.z; it.h = 40; it.vh = 120; it.vx = W.face * 60; W.item = null; },
    // ------------------------------------------------------------------ scripted moves (both wrestlers locked into an animation)
    startMove(m, S, A, V, kind, o = {}) {
      const mv = { kind, a: A.i, v: V.i, t: 0, dur: { suplex: 1.0, slam: 0.9, flip: 0.75, dive: 0.8, press: 1.4, spring: 1.25, spin: 1.3, ddt: 1.0, lariat: 1.4, double: 1.1 }[kind] || 1, x0: A.x, z0: A.z, vx0: V.x, vz0: V.z, face: A.face, fin: !!o.fin, mate: o.mate, h0: A.h };
      if (A.st === 'grab') A.held = undefined; A.st = 'move'; A.t = 0; V.st = 'moved'; V.t = 0; V.mood = 'shock'; A.mood = 'effort'; S.mv = S.mv || []; S.mv.push(mv);
      if (o.mate !== undefined) { const M = S.w[o.mate]; M.st = 'move'; M.t = 0; }
      if (o.fin) { const [, nm] = finOf(m.players[A.i].el.id); this.say(S, nm.toUpperCase() + '!', m.players[A.i].color, 'FINISHER', 1.6); A.mom = 0; S.flashT = 1.2; Sfx.tone(220, 0.5, 'sawtooth', 0.06, 200); }
      else this.say(S, { suplex: 'SUPLEX!', slam: 'BODY SLAM!', flip: 'BACK BODY DROP!', dive: 'FROM THE TOP!', double: 'DOUBLE TEAM!' }[kind] || '', '#fff', '', 0.9);
    },
    // where each wrestler is drawn during a move: returns {a:{x,z,h,rot}, v:{x,z,h,rot}} at progress q
    movePose(mv, q, S) {
      const f = mv.face, ax = mv.x0, az = mv.z0, A = { x: ax, z: az, h: 0, rot: 0 }, V = { x: mv.vx0, z: mv.vz0, h: 0, rot: 0 }, e = x => x * x * (3 - 2 * x);
      switch (mv.kind) {
        case 'suplex': { const k = Math.min(1, q / 0.85); A.rot = -f * 1.2 * Math.max(0, (q - 0.55) / 0.45); A.h = 0; const a = Math.PI * e(k); V.x = ax + f * Math.cos(a) * 40; V.h = Math.sin(a) * 90 + 10 * (1 - k); V.rot = -f * a; V.z = az; break; }
        case 'slam': { const k = Math.min(1, q / 0.55), d = Math.max(0, (q - 0.55) / 0.35); V.x = ax + f * (20 + 30 * d); V.h = 60 * e(k) * (1 - d * d) + 20 * (1 - d); V.rot = -f * Math.PI / 2 * e(k); break; }
        case 'flip': { const a = Math.PI * e(Math.min(1, q / 0.8)); V.x = ax - f * 50 * Math.cos(a) * -1; V.x = ax + f * (40 - 80 * e(q)); V.h = Math.sin(a) * 140; V.rot = f * a * 1.1; A.rot = f * 0.4 * Math.sin(q * Math.PI); break; }
        case 'dive': { A.x = mv.x0 + (mv.tx - mv.x0) * q; A.z = mv.z0 + (mv.tz - mv.z0) * q; A.h = mv.h0 * (1 - q) + Math.sin(q * Math.PI) * 120; A.rot = -f * Math.PI * 0.5 * q; V.x = mv.vx0; V.z = mv.vz0; V.rot = mv.vDown ? -f * Math.PI / 2 : 0; break; }
        case 'press': { const up = Math.min(1, q / 0.35), hold = q < 0.7, d = Math.max(0, (q - 0.7) / 0.3); V.x = ax + f * 10 + f * 60 * d; V.h = 110 * e(up) * (1 - d * d) + Math.sin(q * 40) * 3 * (hold ? up : 0); V.rot = -f * Math.PI / 2 * e(up); A.h = hold ? 0 : 0; break; }
        case 'spring': { if (q < 0.4) { const k = q / 0.4; A.x = ax - f * 120 * e(k); A.h = Math.sin(k * Math.PI) * 50; } else { const k = (q - 0.4) / 0.6; A.x = ax - f * 120 + f * 140 * e(k); A.h = 90 + Math.sin(k * Math.PI) * 130 - 90 * k; A.rot = f * Math.PI * 2 * e(k); } V.x = mv.vx0; V.rot = q > 0.85 ? -f * Math.PI / 2 : 0; break; }
        case 'spin': { A.rot = 0; A.spin = q < 0.75 ? q * 30 : 0; A.x = ax + f * 30 * Math.max(0, (q - 0.6) / 0.15) ; V.x = q > 0.75 ? mv.vx0 + f * 160 * e((q - 0.75) / 0.25) : mv.vx0; V.h = q > 0.75 ? Math.sin((q - 0.75) / 0.25 * Math.PI) * 80 : 0; V.rot = q > 0.75 ? f * Math.PI * 1.5 * (q - 0.75) / 0.25 : 0; break; }
        case 'ddt': { const k = Math.min(1, q / 0.6), d = Math.max(0, (q - 0.6) / 0.4); A.h = Math.sin(k * Math.PI) * 70; A.x = ax - f * 30 * k; A.rot = f * 1.3 * d; V.x = ax + f * 20 - f * 20 * k; V.h = Math.sin(k * Math.PI) * 60; V.rot = -f * Math.PI * 0.9 * e(k); break; }
        case 'lariat': { if (q < 0.55) { const k = q / 0.55; A.x = ax - f * 200 * Math.sin(k * Math.PI); } else { const k = (q - 0.55) / 0.45; V.rot = f * Math.PI * 2 * e(k); V.h = Math.sin(k * Math.PI) * 90; V.x = mv.vx0 + f * 60 * k; } break; }
        case 'double': { const k = Math.min(1, q / 0.6), d = Math.max(0, (q - 0.6) / 0.4); V.h = 130 * e(k) * (1 - d * d); V.rot = -f * Math.PI * e(k); V.x = ax + f * 30; break; }
      }
      return { A, V };
    },
    endMove(m, S, mv) {
      const A = S.w[mv.a], V = S.w[mv.v], pose = this.movePose(mv, 1, S);
      A.x = pose.A.x; A.z = pose.A.z; A.h = 0; A.st = 'idle'; A.t = 0; A.mood = 'determined'; V.x = pose.V.x; V.z = pose.V.z; V.h = 0;
      if (mv.mate !== undefined) { const M = S.w[mv.mate]; M.st = 'idle'; M.t = 0; }
      const dmg = mv.fin ? 32 : { suplex: 14, slam: 12, flip: 12, dive: 18, double: 22 }[mv.kind] || 10;
      if (mv.kind === 'dive' && !mv.hits) { A.hp = Math.max(0, A.hp - 6); this.down(A, 0, 1.2); this.say(S, 'CRASH AND BURN!', '#ff8a8a', '', 1); Sfx.boom(); MGH.shake(6); V.st = V.st === 'moved' ? 'idle' : V.st; return; }
      V.st = 'idle'; this.hit(m, S, A, V, dmg, 'down', { push: mv.face * (mv.fin ? 220 : 120), big: mv.fin, move: true });
      if (mv.fin) { V.hurtFin = 6; S.slow = 0.45; for (let k = 0; k < 24; k++) S.flash.push({ x: R.range(0, 1280), y: R.range(60, 300), t: R.range(0, 0.4) }); Sfx.tone(80, 0.6, 'sawtooth', 0.08, -40); }
      if (mv.kind === 'suplex') this.down(A, 0, 0.45);
      A.mom = Math.min(100, A.mom + (mv.fin ? 0 : 14));
      // near the ropes with a battered foe: over the top they go!
      if (!mv.fin && Math.abs(V.x) > RW - 45 && V.hp < 45 && Math.random() < 0.5) this.overTop(S, V, Math.sign(V.x));
    },
    overTop(S, V, sx) { V.x = sx * (RW + 70); V.z = clamp(V.z, -RD + 10, RD); V.h = 0; this.down(V, sx * 60); this.say(S, 'OVER THE TOP ROPE!', '#ffb03a', '', 1.1); S.ropes[sx > 0 ? 1 : 3] = 1; Sfx.boom(); MGH.shake(8); },
    // ------------------------------------------------------------------ per-frame
    update(m, S, dt0) {
      const dt = dt0 * (S.slow > 0 ? 0.35 : 1); S.slow = Math.max(0, S.slow - dt0); S.t += dt0;
      if (S.banner) { S.banner.t += dt0; if (S.banner.t > S.banner.life) S.banner = null; }
      S.ropes = S.ropes.map(r => Math.max(0, r - dt * 3)); S.flashT = Math.max(0, (S.flashT || 0) - dt0);
      S.flash.forEach(f => f.t += dt0); S.flash = S.flash.filter(f => f.t < 0.5);
      // scripted moves
      (S.mv || []).forEach(mv => { mv.t += dt; if (mv.kind === 'dive' && !mv.checked && mv.t / mv.dur > 0.85) { mv.checked = true; const V = S.w[mv.v]; mv.hits = !V.elim && Math.hypot(V.x - mv.tx, (V.z - mv.tz) * 1.5) < 60 && V.st !== 'move'; if (mv.hits) { V.st = 'moved'; } } if (mv.t >= mv.dur) { mv.done = true; this.endMove(m, S, mv); } });
      S.mv = (S.mv || []).filter(mv => !mv.done);
      S.w.forEach(W => this.wrestler(m, S, W, dt));
      const free = W => !W.elim && ['idle', 'walk', 'run', 'hurt', 'strike', 'getup'].includes(W.st) && W.h < 5;
      for (let a = 0; a < 4; a++) for (let b = a + 1; b < 4; b++) { const A = S.w[a], B = S.w[b]; if (!free(A) || !free(B) || inRing(A) !== inRing(B)) continue; const dx = B.x - A.x, dz = (B.z - A.z) * 1.6, d = Math.hypot(dx, dz); if (d < 40 && d > 0.01) { const push = (40 - d) / 2; A.x -= dx / d * push; B.x += dx / d * push; A.z -= dz / d * push / 1.6; B.z += dz / d * push / 1.6; } }
      this.pinCount(m, S, dt);
      this.itemsUpdate(m, S, dt);
      this.refUpdate(S, dt);
      // the crowd tosses in a new toy now and then
      S.spawnT -= dt; if (S.spawnT <= 0) { S.spawnT = R.range(8, 13); if (S.items.filter(it => it.holder < 0).length < 5) { const k = Math.random() < 0.3 ? R.pick(PICKS) : R.pick(WEAPONS); this.dropItem(S, k, R.range(-RW + 60, RW - 60), R.range(-RD + 30, RD - 30), { x: R.range(-300, 300), z: 260 }); this.say(S, `${ITEMS[k].name} thrown in!`, '#8fe0ff', '', 1); } }
      // end: one wrestler or one team left, or the 4-minute bell
      const left = this.alive(S), teamsLeft = new Set(left.map(w => w.team));
      if (!S.over && (teamsLeft.size <= 1 || S.t > 240)) { S.over = 0.01; this.say(S, S.t > 240 ? 'TIME LIMIT!' : 'WINNER!', '#ffd34d', left.map(w => m.players[w.i].name).join(' & '), 3); Sfx.tone(523, 0.3, 'triangle', 0.08); Sfx.tone(784, 0.5, 'triangle', 0.08, 0, 0.2); }
      if (S.over) { S.over += dt0; if (S.over > 2.4) m.finish(this.score(m, S)); }
    },
    score(m, S) {
      if (m.teams) { const tHp = [0, 1].map(t => S.w.filter(w => w.team === t && !w.elim).reduce((a, w) => a + 1 + w.hp, 0)); return S.w.map(w => tHp[w.team]); }
      return S.w.map(w => w.elim ? S.elim.indexOf(w.i) : 10 + w.hp / 100);
    },
    wrestler(m, S, W, dt) {
      W.t += dt; W.cd = Math.max(0, W.cd - dt); W.gloves = Math.max(0, W.gloves - dt); W.hurtFin = Math.max(0, W.hurtFin - dt); W.comboT = Math.max(0, W.comboT - dt); if (W.comboT <= 0) W.combo = 0;
      if (W.dropMe) { W.dropMe = false; this.dropHeld(S, W); }
      if (W.elim) { // walks to the ringside seats
        const tx = -420 + W.i * 280 * 0 + (S.elim.indexOf(W.i)) * 60 - 60, tz = 200; W.x += (tx - W.x) * Math.min(1, dt * 2); W.z += (tz - W.z) * Math.min(1, dt * 2); W.h = 0; W.mood = 'sad'; return; }
      // physics for knockback / falls
      if (W.st !== 'move' && W.st !== 'moved' && W.st !== 'held' && W.st !== 'perch' && W.st !== 'whipped' && W.st !== 'climb') {
        W.x += W.vx * dt; W.z += W.vz * dt; W.vx *= Math.pow(0.02, dt); W.vz *= Math.pow(0.02, dt);
        if (W.h > 0 || W.vh) { W.vh -= 1400 * dt; W.h += W.vh * dt; if (W.h <= 0) { W.h = 0; W.vh = 0; } }
      }
      const inside = inRing(W);
      // keep to the ring or the floor
      if (W.st !== 'move' && W.st !== 'moved' && W.st !== 'held') {
        if (inside && !W.leaving) { if (Math.abs(W.x) > RW - 18) { const s = Math.sign(W.x); W.x = s * (RW - 18); if (W.st === 'run' || W.st === 'whipped') this.rebound(S, W, s); } if (W.z > RD - 10) { W.z = RD - 10; if (W.st === 'whipped') W.vz = -Math.abs(W.vz); } if (W.z < -RD + 12) { W.z = -RD + 12; if (W.st === 'whipped') W.vz = Math.abs(W.vz); } }
        else if (!inside) { W.x = clamp(W.x, -OX, OX); W.z = clamp(W.z, -RD + 4, OZF); if (Math.abs(W.x) < RW + 26 && W.z < RD + 26 && !W.entering) { // bump against the apron from outside
            if (Math.abs(W.x) >= RW + 26 - 30 && W.z < RD) W.x = Math.sign(W.x) * (RW + 26); else W.z = RD + 26; } }
      }
      W.leaving = false; W.entering = false;
      const ax = m.axis(W.i), A = m.pressed(W.i, 'a'), B = m.pressed(W.i, 'b'), mag = Math.hypot(ax.x, ax.y);
      switch (W.st) {
        case 'down': W.mood = 'dizzy'; if (W.t > (W.downFor || 1.5)) { W.st = 'getup'; W.t = 0; } return;
        case 'getup': if (W.t > 0.35) { W.st = 'idle'; W.t = 0; W.mood = 'determined'; } return;
        case 'hurt': if (W.t > (W.stunT || 0.38)) { W.st = 'idle'; W.t = 0; W.mood = 'determined'; } return;
        case 'held': return; case 'move': case 'moved': return; case 'pinned': return;
        case 'whipped': { W.x += W.vx * dt; W.z += W.vz * dt; W.mood = 'shock'; if (W.t > 2.2 || (W.rebounds > 0 && W.t > W.rbT + 0.75)) { W.st = 'idle'; W.t = 0; W.vx *= 0.2; } return; }
        case 'strike': if (W.t > (W.strikeDur || 0.28)) { W.st = 'idle'; W.t = 0; } if (!W.struck && W.t > 0.1) { W.struck = true; this.resolveStrike(m, S, W); } return;
        case 'grab': { const V = S.w[W.held]; if (!V || V.st !== 'held') { this.release(S, W); return; } V.x = W.x + W.face * 46; V.z = W.z; V.face = -W.face;
          if (W.t > 1.8) { this.release(S, W); V.vx = W.face * 160; W.vx = -W.face * 60; return; }
          if (A && W.cd <= 0) { W.cd = 0.3; W.knees = (W.knees || 0) + 1; V.hp = Math.max(0, V.hp - 2.5); W.mom = Math.min(100, W.mom + 5); W.kneeT = 0.18; Sfx.thud(); const p = P(V.x, V.z, 50); MGH.burst(p.x, p.y, ['#fff', '#ffe680'], 6, { speed: 140 }); if (W.knees >= 3) { this.release(S, W); V.st = 'hurt'; V.t = 0; V.stunT = 0.6; V.vx = W.face * 120; } }
          if (B && W.t > 0.15) this.grabMove(m, S, W, V, ax, mag); return; }
        case 'pin': { const V = S.w[W.pinOn]; if (!V || V.st !== 'pinned') this.release(S, W); return; }
        case 'perch': { W.mood = 'cheer'; if (A) this.dive(m, S, W); else if (B) { W.st = 'idle'; W.h = 0; W.x -= Math.sign(W.x) * 20; W.z -= Math.sign(W.z) * 14; } return; }
        case 'climb': { const c = CORN[W.corner], q = Math.min(1, W.t / 0.45); W.x = W.cx0 + (c[0] * 0.93 - W.cx0) * q; W.z = W.cz0 + (c[1] * 0.9 - W.cz0) * q; W.h = 75 * q; if (q >= 1) { W.st = 'perch'; W.t = 0; S.ropes[[0, 1, 2, 3][W.corner]] = 0.6; } return; }
      }
      // ---- free control: idle / walk / run
      if (W.item && W.item.k === 'ext' && W.spray > 0) W.spray -= dt;
      const sp = W.st === 'run' ? 400 : 210;
      if (W.st === 'run') { // running keeps going until the opposite direction, a strike or a third rope
        W.x += W.face * sp * dt; W.z += ax.y * 120 * dt; if (ax.x * W.face < -0.5) { W.st = 'idle'; W.run = 0; }
        if (A) { this.startStrike(m, S, W, 'lariat'); return; }
        W.runT += dt; if (W.runT > 4) { W.st = 'idle'; }
        if (!inside) { W.st = 'idle'; }
        return; }
      if (mag > 0.2) { const nx = ax.x / Math.max(1, mag), nz = ax.y / Math.max(1, mag); W.x += nx * sp * dt; W.z += nz * sp * 0.6 * dt; if (Math.abs(nx) > 0.3) { const f = Math.sign(nx); if (f !== W.face) { W.face = f; W.holdT = 0; } }
        W.st = 'walk'; W.holdT = (W.holdT || 0) + (Math.abs(nx) > 0.7 ? dt : -dt); if (W.holdT > 0.6 && inside && !W.item) { W.st = 'run'; W.runT = 0; W.rebounds = 0; W.holdT = 0; }
        // walking through the ropes (out) or back in
        if (inside && (Math.abs(W.x) >= RW - 19 && nx * Math.sign(W.x) > 0.6 || W.z >= RD - 11 && nz > 0.6)) { W.ropeT += dt; if (W.ropeT > 0.45) { W.ropeT = 0; if (Math.abs(W.x) >= RW - 19) W.x = Math.sign(W.x) * (RW + 40); else W.z = RD + 40; W.leaving = true; S.ropes[Math.abs(W.x) > RW ? (W.x > 0 ? 1 : 3) : 2] = 0.6; Sfx.tone(260, 0.06, 'triangle', 0.04); } }
        else if (!inside && ((Math.abs(W.x) <= RW + 30 && Math.abs(W.x) > RW - 30 && nx * Math.sign(W.x) < -0.6 && W.z < RD) || (W.z <= RD + 30 && nz < -0.6 && Math.abs(W.x) < RW))) { W.ropeT += dt; if (W.ropeT > 0.5) { W.ropeT = 0; if (Math.abs(W.x) > RW - 30 && W.z < RD) W.x = Math.sign(W.x) * (RW - 30); else W.z = RD - 24; W.entering = true; } }
        else W.ropeT = 0;
      } else { W.st = 'idle'; W.holdT = 0; W.ropeT = 0; }
      if (A) {
        if (W.item && ITEMS[W.item.k].spray) this.spray(m, S, W);
        else if (W.item) this.startStrike(m, S, W, 'weapon');
        else { const corner = this.cornerNear(W); if (corner >= 0 && !this.foes(m, S, W).some(o => dist(o, W) < 90)) this.climb(W, corner); else this.startStrike(m, S, W, 'strike'); }
      } else if (B) this.bAction(m, S, W, ax, mag);
    },
    rebound(S, W, s) { W.face = -s; W.rebounds = (W.rebounds || 0) + 1; W.rbT = W.t; if (W.st === 'whipped') W.vx = -s * 420; S.ropes[s > 0 ? 1 : 3] = 1; Sfx.tone(180, 0.12, 'triangle', 0.06, 60); if (W.st === 'run' && W.rebounds > 2) W.st = 'idle'; },
    cornerNear(W) { for (let c = 0; c < 4; c++) if (Math.hypot(W.x - CORN[c][0] * 0.93, (W.z - CORN[c][1] * 0.9) * 1.3) < 60) return c; return -1; },
    climb(W, c) { W.st = 'climb'; W.t = 0; W.corner = c; W.cx0 = W.x; W.cz0 = W.z; W.face = CORN[c][0] > 0 ? -1 : 1; Sfx.tone(500, 0.08, 'triangle', 0.04); },
    dive(m, S, W) {
      const foes = this.foes(m, S, W).filter(o => inRing(o) && o.st !== 'move' && o.st !== 'moved'); const V = foes.sort((a, b) => dist(a, W) - dist(b, W))[0];
      W.st = 'move'; const mv = { kind: 'dive', a: W.i, v: V ? V.i : W.i, t: 0, dur: 0.85, x0: W.x, z0: W.z, h0: W.h, face: V ? Math.sign(V.x - W.x) || W.face : W.face, tx: V ? V.x : W.x - Math.sign(W.x) * 150, tz: V ? V.z : W.z * 0.5, vx0: V ? V.x : 0, vz0: V ? V.z : 0, vDown: V && V.st === 'down' };
      W.face = mv.face; S.mv = S.mv || []; S.mv.push(mv); this.say(S, 'FROM THE TOP!', '#8fe0ff', '', 0.9); Sfx.tone(700, 0.3, 'triangle', 0.05, 400);
    },
    startStrike(m, S, W, kind) {
      if (W.cd > 0) return; W.st = 'strike'; W.t = 0; W.struck = false; W.skind = kind;
      if (kind === 'strike') { const down = this.foes(m, S, W).find(o => o.st === 'down' && Math.abs(o.x - W.x) < 70 && Math.abs(o.z - W.z) < 34); W.skind = down ? 'stomp' : 'strike'; W.combo = W.comboT > 0 ? (W.combo + 1) % 3 : 0; W.comboT = 0.7; W.cd = W.combo === 2 ? 0.42 : 0.24; W.strikeDur = 0.26; }
      else if (kind === 'weapon') { W.cd = ITEMS[W.item.k].fast ? 0.32 : 0.5; W.strikeDur = 0.36; }
      else if (kind === 'lariat') { W.cd = 0.5; W.strikeDur = 0.35; }
      Sfx.tone(300 + Math.random() * 80, 0.05, 'triangle', 0.04);
    },
    resolveStrike(m, S, W) {
      const k = W.skind, it = W.item, reach = k === 'weapon' ? ITEMS[it.k].reach : k === 'lariat' ? 80 : 72;
      const tg = this.foes(m, S, W).filter(o => (o.x - W.x) * W.face > -10 && Math.abs(o.x - W.x) < reach && Math.abs(o.z - W.z) < (k === 'stomp' ? 34 : 30) && !['move', 'moved', 'elim'].includes(o.st) && (k === 'stomp' ? o.st === 'down' || o.st === 'pinned' : o.st !== 'down'));
      if (!tg.length) return;
      if (k === 'stomp') { const V = tg[0]; V.hp = Math.max(0, V.hp - 3); W.mom = Math.min(100, W.mom + 5); const p = P(V.x, V.z, 10); MGH.burst(p.x, p.y, ['#fff'], 8, { speed: 160 }); Sfx.thud(); if (V.st === 'down') V.t = Math.max(0, V.t - 0.3); return; }
      tg.forEach(V => {
        if (k === 'lariat') { this.hit(m, S, W, V, 11, 'down', { push: W.face * 200 }); this.say(S, 'LARIAT!', '#ffb03a', '', 0.8); if (Math.abs(V.x) > RW - 60 && V.hp < 50 && Math.random() < 0.45) this.overTop(S, V, Math.sign(V.x)); W.st = 'idle'; }
        else if (k === 'weapon') { const I = ITEMS[it.k]; this.hit(m, S, W, V, I.dmg, I.dmg >= 14 || I.silly ? 'down' : 'hurt', { weapon: true, push: W.face * (I.silly ? 420 : 160), col: '#8fe0ff', big: I.dmg >= 20 });
          if (I.silly) { Sfx.tone(1400, 0.12, 'square', 0.05, -800); this.say(S, 'SQUEAK!', '#ffe680', '', 0.6); } else { Sfx.tone(140, 0.1, 'square', 0.06); }
        }
        else if (V.st === 'whipped') { this.hit(m, S, W, V, 12, 'down', { push: W.face * 160 }); this.say(S, 'CLOTHESLINE!', '#ffb03a', '', 0.8); }
        else { const fin = W.combo === 2; this.hit(m, S, W, V, fin ? 7 : 4, fin && V.hp < 70 && Math.random() < 0.4 ? 'down' : 'hurt', { push: W.face * (fin ? 170 : 70), stun: fin ? 0.55 : 0.3 }); }
      });
      if (k === 'weapon' && W.item === it) { it.uses--; if (it.uses <= 0) this.breakItem(S, W); else it.dent = (it.dent || 0) + 1; }
    },
    breakItem(S, W) { if (!W.item) return; const it = W.item, p = P(W.x + W.face * 40, W.z, 60); MGH.burst(p.x, p.y, it.k === 'guitar' ? ['#c86a2a', '#ffe680', '#fff'] : ['#c8c8d0', '#fff'], 20, { speed: 280 }); if (it.k === 'guitar') this.say(S, 'SMASH!', '#ffb03a', '', 0.9); S.items.splice(S.items.indexOf(it), 1); W.item = null; Sfx.boom(); },
    spray(m, S, W) { if (W.cd > 0) return; W.cd = 0.8; W.spray = 0.45; Sfx.tone(120, 0.4, 'sawtooth', 0.02, 2000); const it = W.item;
      this.foes(m, S, W).filter(o => (o.x - W.x) * W.face > 0 && Math.abs(o.x - W.x) < 170 && Math.abs(o.z - W.z) < 50 && !['move', 'moved', 'down'].includes(o.st)).forEach(V => { this.hit(m, S, W, V, 3, 'hurt', { push: W.face * 60, stun: 1.4 }); V.mood = 'dizzy'; });
      for (let k = 0; k < 14; k++) S.fx.push({ k: 'cloud', x: W.x + W.face * (30 + k * 10), z: W.z + R.range(-20, 20), h: 55 + R.range(-10, 10), t: k * 0.02, life: 0.9, r: 14 + k * 1.6 });
      it.uses--; if (it.uses <= 0) this.breakItem(S, W); },
    bAction(m, S, W, ax, mag) {
      // 1) holding a weapon: throw it
      if (W.item) { const it = W.item; it.holder = -1; it.x = W.x + W.face * 30; it.z = W.z; it.h = 60; it.vx = W.face * 620; it.vh = 120; it.thrown = W.i; it.vz = 0; W.item = null; Sfx.tone(500, 0.1, 'triangle', 0.05, -200); W.st = 'strike'; W.t = 0; W.struck = true; W.strikeDur = 0.25; W.skind = 'throw'; return; }
      const foes = this.foes(m, S, W);
      // 2) pin a downed foe
      const dn = foes.find(o => o.st === 'down' && Math.abs(o.x - W.x) < 75 && Math.abs(o.z - W.z) < 40 && inRing(o) === inRing(W));
      if (dn && !S.count) { W.st = 'pin'; W.pinOn = dn.i; W.t = 0; dn.st = 'pinned'; dn.t = 0; W.x = dn.x - W.face * 10; W.z = dn.z; S.count = { a: W.i, v: dn.i, t: 0, n: 0, kick: { pos: Math.random(), dir: 1, tries: 2, zone: Math.min(0.45, (0.06 + 0.55 * dn.hp / 100) * (dn.hurtFin > 0 ? 0.45 : 1) + dn.mom / 100 * 0.06) * Math.max(0.5, 1 - S.t / 300), res: null } }; this.say(S, 'COVER!', '#fff', '', 0.7); return; }
      // 3) grab a standing foe
      const st = foes.filter(o => ['idle', 'walk', 'hurt', 'getup', 'strike', 'whipped'].includes(o.st) && Math.abs(o.x - W.x) < 72 && Math.abs(o.z - W.z) < 30).sort((a, b) => Math.abs(a.x - W.x) - Math.abs(b.x - W.x))[0];
      if (st) { W.st = 'grab'; W.held = st.i; W.t = 0; W.knees = 0; st.st = 'held'; st.t = 0; if (st.item && Math.random() < 0.5) this.dropHeld(S, st); W.face = Math.sign(st.x - W.x) || W.face; Sfx.tone(240, 0.08, 'triangle', 0.05); st.mood = 'shock'; return; }
      // 4) pick up an item underfoot
      const it = S.items.filter(it => it.holder < 0 && it.h < 20 && !it.fly && Math.hypot(it.x - W.x, (it.z - W.z) * 1.4) < 55).sort((a, b) => Math.hypot(a.x - W.x, a.z - W.z) - Math.hypot(b.x - W.x, b.z - W.z))[0];
      if (it) { if (ITEMS[it.k].pick) this.usePick(m, S, W, it); else { it.holder = W.i; W.item = it; Sfx.tone(660, 0.08, 'triangle', 0.05); } return; }
      // 5) climb a corner
      const c = this.cornerNear(W); if (c >= 0 && inRing(W)) this.climb(W, c);
    },
    usePick(m, S, W, it) {
      S.items.splice(S.items.indexOf(it), 1); const p = P(W.x, W.z, 80);
      if (it.k === 'soda') { W.hp = Math.min(100, W.hp + 30); MGH.pop('+30 ❤', p.x, p.y, '#7cff6a', 30); }
      if (it.k === 'star') { W.mom = 100; MGH.pop('HYPE MAX!', p.x, p.y, '#ffd34d', 30); }
      if (it.k === 'gloves') { W.gloves = 12; MGH.pop('GOLDEN GLOVES!', p.x, p.y, '#ffd34d', 28); }
      MGH.burst(p.x, p.y, ['#ffd34d', '#fff'], 18, { speed: 220 }); Sfx.coin();
    },
    grabMove(m, S, W, V, ax, mag) {
      const el = m.players[W.i].el.id;
      if (W.mom >= 100) { const [kind] = finOf(el); this.startMove(m, S, W, V, kind, { fin: true }); return; }
      if (mag > 0.4) { // whip toward the direction pressed
        const dx = Math.abs(ax.x) > 0.3 ? Math.sign(ax.x) : W.face; this.release(S, W); V.st = 'whipped'; V.t = 0; V.rebounds = 0; V.vx = dx * 430; V.vz = ax.y * 80; V.face = dx; W.face = dx; W.cd = 0.2;
        // whipped hard toward a nearby rope with little health left: over the top
        this.say(S, 'IRISH WHIP!', '#fff', '', 0.7); Sfx.tone(320, 0.12, 'triangle', 0.05, 200); return; }
      // a mate close by: double team!
      const mate = m.teams ? S.w.find(o => o !== W && !o.elim && o.team === W.team && ['idle', 'walk'].includes(o.st) && dist(o, W) < 120) : null;
      if (mate) { mate.x = W.x; mate.z = W.z + 22; this.startMove(m, S, W, V, 'double', { mate: mate.i }); return; }
      this.startMove(m, S, W, V, R.pick(EL_BASE[el] % 2 ? ['slam', 'suplex', 'slam'] : ['suplex', 'suplex', 'slam']));
    },
    pinCount(m, S, dt) {
      const C = S.count; if (!C) return; const A = S.w[C.a], V = S.w[C.v];
      if (A.st !== 'pin' || V.st !== 'pinned') { S.count = null; return; }
      C.t += dt; const K = C.kick;
      // kick-out timing: a marker sweeps a bar; press A while it is in the green
      K.pos += K.dir * dt * 1.6; if (K.pos > 1) { K.pos = 1; K.dir = -1; } if (K.pos < 0) { K.pos = 0; K.dir = 1; }
      const inZone = Math.abs(K.pos - 0.5) < K.zone;
      if (m.players[V.i].human) { if (m.pressed(V.i, 'a') && K.tries > 0 && C.t > 0.25) { if (inZone) K.res = 'kick'; else { K.tries--; K.zone *= 0.7; Sfx.bad(); } } }
      else if (!K.decided && C.t > 0.75 + C.v * 0.05) { K.decided = true; const p = Math.min(0.99, (0.12 + 1.7 * V.hp / 100) * (V.hurtFin > 0 ? 0.45 : 1) + V.mom / 100 * 0.1) * Math.max(0.5, 1 - S.t / 300); K.botWill = Math.random() < p; K.botAt = R.range(0.9, 2.2); }
      if (K.decided && K.botWill && C.t > K.botAt) K.res = 'kick';
      const n = Math.floor(C.t / 0.8); if (n > C.n && n <= 3) { C.n = n; S.ref.slap = 0.25; Sfx.tone(n === 3 ? 900 : 200, 0.1, 'square', 0.07); this.say(S, n === 3 ? '3!' : `${n}…`, n === 3 ? '#ffd34d' : '#fff', '', 0.7); }
      if (K.res === 'kick' && C.n < 3) { this.say(S, 'KICK OUT!', '#7cff6a', `at ${C.n === 2 ? '2.9!' : C.n + '!'}`, 1); A.pinOn = undefined; this.down(A, -A.face * 120, 0.5); V.st = 'down'; V.t = 0; V.downFor = 0.5; V.mom = Math.min(100, V.mom + 20); S.count = null; Sfx.tone(600, 0.15, 'triangle', 0.07, 300); MGH.shake(4); return; }
      if (C.n >= 3 && C.t > 2.5) { // pinned!
        V.elim = true; V.st = 'elim'; S.elim.push(V.i); A.st = 'idle'; A.pinOn = undefined; A.mood = 'cheer'; S.count = null; if (V.item) this.dropHeld(S, V);
        this.say(S, `${m.players[V.i].name} is eliminated!`, m.players[V.i].color, `pinned by ${m.players[A.i].name}`, 1.8); MGH.shake(8); Sfx.boom(); }
    },
    itemsUpdate(m, S, dt) {
      S.items.forEach(it => {
        if (it.holder >= 0) { const W = S.w[it.holder]; if (!W || W.elim || W.item !== it) { it.holder = -1; return; } it.x = W.x; it.z = W.z; return; }
        if (it.fly !== undefined) { it.fly += dt / 1.1; const q = Math.min(1, it.fly); it.x = it.x + (it.tx - it.x) * Math.min(1, dt * 4); it.z = it.z + (it.tz - it.z) * Math.min(1, dt * 4); it.h = 300 * (1 - q) + Math.sin(q * Math.PI) * 60; it.rot += dt * 8; if (q >= 1) { delete it.fly; it.h = 0; Sfx.thud(); } return; }
        it.x += (it.vx || 0) * dt; it.z += (it.vz || 0) * dt; if (it.h > 0 || it.vh) { it.vh = (it.vh || 0) - 1400 * dt; it.h += it.vh * dt; it.rot += (it.vx || 0) * dt * 0.02; if (it.h <= 0) { it.h = 0; it.vh = 0; it.vx = (it.vx || 0) * 0.3; if (Math.abs(it.vx) < 30) { it.vx = 0; it.thrown = undefined; } } }
        it.vx = (it.vx || 0) * Math.pow(0.4, dt); it.x = clamp(it.x, -OX, OX); it.z = clamp(it.z, -RD + 8, OZF);
        if (it.thrown !== undefined && Math.abs(it.vx) > 200) { const T = S.w[it.thrown]; const V = this.foes(m, S, T).find(o => Math.abs(o.x - it.x) < 40 && Math.abs(o.z - it.z) < 30 && !['down', 'move', 'moved'].includes(o.st)); if (V) { const I = ITEMS[it.k]; this.hit(m, S, T, V, Math.round((I.dmg || 6) * 0.9), 'down', { push: Math.sign(it.vx) * 120, weapon: true }); it.vx *= -0.2; it.vh = 200; it.thrown = undefined; it.uses--; if (it.uses <= 0) { const p = P(it.x, it.z, 30); MGH.burst(p.x, p.y, ['#c8c8d0', '#fff'], 16, { speed: 240 }); S.items.splice(S.items.indexOf(it), 1); } } }
      });
      S.fx.forEach(f => f.t += dt); S.fx = S.fx.filter(f => f.t < f.life);
    },
    refUpdate(S, dt) { const R0 = S.ref; if (S.count) { const V = S.w[S.count.v]; R0.tx = V.x + 60; R0.tz = V.z + 8; } else { const mx = S.w.filter(w => !w.elim).reduce((a, w) => a + w.x, 0) / Math.max(1, S.w.filter(w => !w.elim).length); R0.tx = mx > 0 ? -RW + 70 : RW - 70; R0.tz = -RD + 40; }
      R0.x += (R0.tx - R0.x) * Math.min(1, dt * 3); R0.z += (R0.tz - R0.z) * Math.min(1, dt * 3); R0.slap = Math.max(0, R0.slap - dt); R0.face = S.count ? -1 : (R0.x < 0 ? 1 : -1); },

    // ------------------------------------------------------------------ the bots
    bot(m, S, i) {
      const v = m.vin[i], W = S.w[i]; v.a = false; v.b = false; v.ax = 0; v.ay = 0; v.left = v.right = v.up = v.down = false;
      const tap = k => { if (!m.prev[i][k]) v[k] = true; };
      if (W.elim || S.over) return;
      // kicking out of a pin is handled in pinCount for bots
      const AI = W.ai; AI.t -= m.dt || 1 / 60;
      const foes = this.foes(m, S, W).filter(o => !o.elim); if (!foes.length) return;
      const go = (tx, tz, run) => { const dx = tx - W.x, dz = tz - W.z; v.ax = Math.abs(dx) > 14 ? Math.sign(dx) : 0; v.ay = Math.abs(dz) > 10 ? Math.sign(dz) * 0.9 : 0; if (!run && Math.abs(dx) < 60) v.ax *= 0.6; };
      if (W.st === 'grab') { if (AI.t <= 0) { AI.t = R.range(0.25, 0.5); const V = S.w[W.held]; if (W.mom >= 100 || W.knees >= R.int(1, 2) || Math.random() < 0.35) { if (Math.random() < 0.3 && W.mom < 100) { v.ax = R.pick([-1, 1]); } tap('b'); } else tap('a'); } return; }
      if (W.st === 'perch') { const t = foes.find(o => inRing(o)); if (t && AI.t <= 0) { AI.t = 0.3; tap('a'); } return; }
      if (!['idle', 'walk', 'run'].includes(W.st)) return;
      // pick a target: the nearest foe (a little sticky)
      let T = AI.tg !== undefined && !S.w[AI.tg].elim && foes.includes(S.w[AI.tg]) ? S.w[AI.tg] : null; if (!T || Math.random() < 0.005) { T = foes.slice().sort((a, b) => dist(a, W) - dist(b, W))[0]; AI.tg = T.i; }
      // a whipped foe coming back: meet them
      const wh = foes.find(o => o.st === 'whipped' && o.rebounds > 0 && Math.abs(o.z - W.z) < 30 && (o.x - W.x) * o.vx < 0 && Math.abs(o.x - W.x) < 110); if (wh) { W.face = Math.sign(wh.x - W.x) || W.face; if (Math.abs(wh.x - W.x) < 80) tap(Math.random() < 0.6 ? 'a' : 'b'); return; }
      if (W.st === 'run') { if (Math.abs(T.z - W.z) < 30 && (T.x - W.x) * W.face > 0 && Math.abs(T.x - W.x) < 90 && T.st !== 'down') tap('a'); go(T.x, T.z, true); return; }
      // grab a weapon or power-up lying near
      if (!W.item && !AI.noItem) { const it = S.items.filter(it => it.holder < 0 && !it.fly && it.h < 20 && Math.hypot(it.x - W.x, it.z - W.z) < 240).sort((a, b) => Math.hypot(a.x - W.x, a.z - W.z) - Math.hypot(b.x - W.x, b.z - W.z))[0];
        if (it && (ITEMS[it.k].pick || Math.random() < 0.6 || dist(T, W) > 200)) { if (Math.hypot(it.x - W.x, (it.z - W.z) * 1.4) < 40) { tap('b'); AI.noItem = Math.random() < 0.2; } else go(it.x, it.z); return; } }
      const d = dist(T, W), dx = T.x - W.x, dz = T.z - W.z, lined = Math.abs(dz) < 26;
      if (T.st === 'down' || T.st === 'pinned') {
        if (T.st === 'pinned') { go(T.x + 50, T.z); if (Math.abs(dx) < 70 && lined && AI.t <= 0) { AI.t = 0.3; tap('a'); } return; }
        const c = this.cornerNear(W); if (c >= 0 && T.hp < 80 && Math.random() < 0.6 && inRing(T)) { tap('b'); return; }
        if (Math.abs(dx) < 70 && lined && AI.t <= 0) { AI.t = R.range(0.2, 0.45); if (T.hp < 55 && inRing(T) === inRing(W) && !S.count) tap('b'); else tap('a'); return; }
        go(T.x - Math.sign(dx || 1) * 40, T.z); return; }
      if (W.item && !ITEMS[W.item.k].pick) { if (lined && Math.abs(dx) > 180 && Math.abs(dx) < 420 && Math.random() < 0.02) { W.face = Math.sign(dx); tap('b'); return; } if (lined && Math.abs(dx) < ITEMS[W.item.k].reach - 10 && AI.t <= 0) { AI.t = R.range(0.25, 0.5); W.face = Math.sign(dx) || W.face; tap('a'); return; } go(T.x - Math.sign(dx || 1) * 60, T.z); return; }
      if (lined && Math.abs(dx) < 70) { if (AI.t <= 0) { AI.t = R.range(0.35, 0.8) + (m.players[i].skill === undefined ? 0 : 0); W.face = Math.sign(dx) || W.face; if (Math.random() < 0.38 && T.st !== 'strike') tap('b'); else tap('a'); } return; }
      if (d > 360 && inRing(W) && inRing(T) && lined) { v.ax = Math.sign(dx); return; } // sprint at them
      go(T.x - Math.sign(dx || 1) * 50, T.z);
    },
    hud(m, S, i) { const W = S.w[i]; return W.elim ? 'OUT' : `${Math.round(W.hp)}❤`; },

    // ------------------------------------------------------------------ drawing
    draw(m, S, g) {
      const th = S.th, t = m.t;
      this.drawArena(g, S, th, t);
      this.drawRingBack(g, S, th, t);
      // everything upright, sorted by depth
      const list = [];
      S.w.forEach(W => list.push({ z: W.z + (W.st === 'perch' ? -20 : 0), f: () => this.drawW(m, S, g, W, t) }));
      S.items.forEach(it => { if (it.holder < 0) list.push({ z: it.z - 1, f: () => this.drawItem(g, it, P(it.x, it.z, it.h), t) }); });
      list.push({ z: S.ref.z, f: () => { const p = P(S.ref.x, S.ref.z), r = 28 * p.k; if (S.count) { g.save(); g.translate(p.x, p.y); Char.npc(g, 0, -r * 1.0 + (S.ref.slap > 0 ? 6 : 0), r, 'ref', { t, mood: 'determined', noIdle: true, look: { x: -1, y: 0.4 }, hands: S.ref.slap > 0 ? { n: { x: -1.2, y: 0.9, d: 90, o: true, m: true }, f: { x: 0.8, y: 0.2, d: 0, o: true, m: false } } : undefined }); g.restore(); } else Char.npc(g, p.x, p.y - r * 1.25, r, 'ref', { t, mood: 'neutral', look: { x: S.ref.face, y: 0 } }); } });
      S.fx.forEach(f => list.push({ z: f.z + 1, f: () => { if (f.t < 0) return; const q = f.t / f.life, p = P(f.x, f.z, f.h); g.globalAlpha = 0.7 * (1 - q); g.fillStyle = '#f4f8ff'; g.beginPath(); g.arc(p.x, p.y, f.r * (1 + q), 0, 7); g.fill(); g.globalAlpha = 1; } }));
      (S.mv || []).forEach(mv => { if (mv.kind === 'press' || mv.kind === 'spin' || mv.fin) {} });
      list.sort((a, b) => a.z - b.z).forEach(o => o.f());
      this.drawRingFront(g, S, th, t);
      // front barricade + crowd heads
      g.fillStyle = '#14101e'; g.fillRect(0, 690, 1280, 30); for (let k = 0; k < 40; k++) { const x = k * 33 + 10, b = Math.abs(Math.sin(t * 6 + k * 1.7)) * (S.flashT > 0 ? 10 : 4); g.fillStyle = ['#3a2a4a', '#4a3a2a', '#2a3a4a'][k % 3]; g.beginPath(); g.arc(x, 712 - b, 15, 0, 7); g.fill(); }
      g.fillStyle = th.post; g.fillRect(0, 684, 1280, 8);
      // camera flashes on a finisher
      S.flash.forEach(f => { if (f.t < 0) return; const a = 1 - f.t / 0.5; MGH.glow(g, f.x, f.y, 26, `rgba(255,255,255,${a})`); });
      if (S.flashT > 0.9) { g.fillStyle = `rgba(255,255,255,${(S.flashT - 0.9) * 1.5})`; g.fillRect(0, 0, 1280, 720); }
      this.drawHUD(m, S, g, t);
    },
    drawArena(g, S, th, t) {
      const gr = g.createLinearGradient(0, 40, 0, 400); gr.addColorStop(0, th.bg0); gr.addColorStop(1, th.bg1); g.fillStyle = gr; g.fillRect(0, 0, 1280, 720);
      if (th.city) { for (let k = 0; k < 18; k++) { const x = k * 76 - 10, h = 80 + (k * 53 % 120); g.fillStyle = '#0a0e22'; g.fillRect(x, 300 - h, 70, h); g.fillStyle = 'rgba(255,230,140,0.5)'; for (let w = 0; w < 12; w++) if ((k * 7 + w * 3) % 5 < 2) g.fillRect(x + 8 + (w % 4) * 15, 300 - h + 10 + Math.floor(w / 4) * 18, 6, 8); } for (let k = 0; k < 40; k++) { g.fillStyle = `rgba(255,255,255,${0.3 + 0.5 * Math.abs(Math.sin(t + k))})`; g.fillRect((k * 131) % 1280, 50 + (k * 47) % 120, 2, 2); } }
      if (th.jungle) { for (let k = 0; k < 14; k++) { const x = k * 100 - 20; g.fillStyle = '#0e2a10'; g.beginPath(); g.ellipse(x, 170 + (k % 3) * 30, 90, 120, 0, 0, 7); g.fill(); } for (const x of [120, 1160]) { g.fillStyle = '#5a3a1a'; g.fillRect(x - 6, 200, 12, 140); MGH.flame && MGH.flame(g, x, 196, 1.2, t, x); } }
      // bleachers full of fans
      for (let row = 0; row < 6; row++) { const y = 150 + row * 30, n = 34; g.fillStyle = `rgba(255,255,255,${0.03 + row * 0.01})`; g.fillRect(0, y + 14, 1280, 4);
        for (let k = 0; k < n; k++) { const x = (k + (row % 2) * 0.5) * (1280 / n), jump = Math.abs(Math.sin(t * (3 + (k % 3)) + k * 2.1 + row)) * (S.flashT > 0 || S.banner ? 7 : 2.5); g.fillStyle = ['#4a3a6a', '#6a3a4a', '#3a5a6a', '#6a5a3a', '#3a3a4a'][(k + row) % 5]; g.beginPath(); g.arc(x, y - jump, 10, 0, 7); g.fill(); g.fillRect(x - 10, y - jump, 20, 14);
          if ((k * 7 + row * 3) % 11 === 0) { g.fillStyle = ['#ffd34d', '#ff5a8a', '#5ab8ff'][(k + row) % 3]; g.fillRect(x - 12, y - 30 - jump, 24, 12); } } }
      // the big screen
      g.fillStyle = '#0a0a14'; MGH.rr(g, 470, 46, 340, 92, 10); g.fill(); g.strokeStyle = th.pad; g.lineWidth = 3; g.stroke();
      const sg = g.createLinearGradient(0, 52, 0, 132); sg.addColorStop(0, th.bg1); sg.addColorStop(1, '#000'); g.fillStyle = sg; MGH.rr(g, 478, 52, 324, 80, 6); g.fill();
      MGH.text(g, 'RING RUMBLE', 640, 92, 30, th.apronTxt, 'center', 'bold'); MGH.text(g, S.w.some(w => w.team !== w.i) ? 'TAG TEAM' : 'FATAL 4-WAY', 640, 120, 15, '#fff', 'center', 'bold');
      // sweeping spotlights
      g.save(); g.globalCompositeOperation = 'lighter'; for (let k = 0; k < 3; k++) { const a = Math.sin(t * 0.6 + k * 2) * 0.5, x0 = 200 + k * 440; g.fillStyle = th.light + '0.07)'; g.beginPath(); g.moveTo(x0, 40); g.lineTo(x0 + Math.sin(a) * 600 - 90, 720); g.lineTo(x0 + Math.sin(a) * 600 + 90, 720); g.closePath(); g.fill(); } g.restore();
      // arena floor
      g.fillStyle = th.floor; g.beginPath(); const a = P(-OX - 40, -RD - 30), b = P(OX + 40, -RD - 30), c = P(OX + 60, OZF + 40), d = P(-OX - 60, OZF + 40); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.lineTo(c.x, c.y); g.lineTo(d.x, d.y); g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.05)'; g.lineWidth = 2; for (let k = -8; k <= 8; k++) { const p0 = P(k * 60, -RD - 30), p1 = P(k * 60, OZF + 40); g.beginPath(); g.moveTo(p0.x, p0.y); g.lineTo(p1.x, p1.y); g.stroke(); }
    },
    quad(g, pts, fill) { g.fillStyle = fill; g.beginPath(); pts.forEach((p, k) => k ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)); g.closePath(); g.fill(); },
    drawRingBack(g, S, th, t) {
      const c = CORN.map(([x, z]) => P(x, z)), ah = 34;
      // apron skirt (front + sides visible)
      this.quad(g, [P(-RW, RD), P(RW, RD), P(RW, RD, -ah), P(-RW, RD, -ah)], th.apron);
      this.quad(g, [P(RW, -RD), P(RW, RD), P(RW, RD, -ah), P(RW, -RD, -ah)], Char.shade(th.apron, -0.25));
      this.quad(g, [P(-RW, -RD), P(-RW, RD), P(-RW, RD, -ah), P(-RW, -RD, -ah)], Char.shade(th.apron, -0.25));
      const fp = P(0, RD, -ah / 2); MGH.text(g, 'RING RUMBLE', fp.x, fp.y + 8, 26, th.apronTxt, 'center', 'bold');
      // mat
      const mg = g.createLinearGradient(0, c[0].y, 0, c[2].y); mg.addColorStop(0, Char.shade(th.mat, -0.12)); mg.addColorStop(1, th.mat); this.quad(g, c, mg);
      g.strokeStyle = 'rgba(0,0,0,0.12)'; g.lineWidth = 3; g.beginPath(); c.forEach((p, k) => k ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)); g.closePath(); g.stroke();
      const cl = P(0, 0); g.fillStyle = 'rgba(0,0,0,0.06)'; g.beginPath(); g.ellipse(cl.x, cl.y, 120, 50, 0, 0, 7); g.fill(); MGH.text(g, '★', cl.x, cl.y + 14, 50, 'rgba(0,0,0,0.08)', 'center', 'bold');
      // back posts + back/side ropes (behind wrestlers)
      [0, 1].forEach(k => this.post(g, CORN[k], th));
      this.ropeLine(g, S, CORN[0], CORN[1], 0, th, t); this.ropeLine(g, S, CORN[1], CORN[2], 1, th, t, true); this.ropeLine(g, S, CORN[3], CORN[0], 3, th, t, true);
    },
    drawRingFront(g, S, th, t) { [2, 3].forEach(k => this.post(g, CORN[k], th)); this.ropeLine(g, S, CORN[2], CORN[3], 2, th, t); },
    post(g, [x, z], th) { const a = P(x, z), b = P(x, z, 110); g.strokeStyle = th.post; g.lineWidth = 9 * a.k; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); for (const h of [32, 60, 88]) { const p = P(x, z, h); g.fillStyle = th.pad; MGH.rr(g, p.x - 9 * a.k, p.y - 9 * a.k, 18 * a.k, 18 * a.k, 4); g.fill(); } },
    ropeLine(g, S, A, B, side, th, t, sideRope) {
      const amt = S.ropes[side];
      [32, 60, 88].forEach((h, k) => { g.strokeStyle = th.rope[k]; g.lineWidth = 4.5 * P(A[0], A[1]).k; g.beginPath();
        for (let q = 0; q <= 16; q++) { const f = q / 16, x = A[0] + (B[0] - A[0]) * f, z = A[1] + (B[1] - A[1]) * f, bend = Math.sin(f * Math.PI) * amt * 26 * Math.sin(t * 30) * (side === 0 ? -1 : 1); const p = P(x + (sideRope ? bend * (side === 1 ? 1 : -1) : 0), z + (sideRope ? 0 : bend), h); q ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y); }
        g.stroke(); });
    },
    drawItem(g, it, p, t, held) {
      const s = p.k * (held ? 1.05 : 1.3); g.save(); g.translate(p.x, p.y); g.scale(s, s); g.rotate(it.rot || 0);
      if (!held) { g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(0, it.h ? it.h : 2, 22, 6, 0, 0, 7); g.fill(); }
      const k = it.k;
      if (ITEMS[k].pick) { const b = Math.sin(t * 4 + it.x) * 4; MGH.glow(g, 0, -20 + b, 34, k === 'soda' ? 'rgba(120,255,140,0.5)' : 'rgba(255,220,90,0.55)'); }
      if (k === 'chair') { g.strokeStyle = '#6a7280'; g.lineWidth = 4; g.beginPath(); g.moveTo(-14, 0); g.lineTo(-10, -26); g.moveTo(14, 0); g.lineTo(10, -26); g.stroke(); g.fillStyle = '#b8c0cc'; MGH.rr(g, -16, -30, 32, 8, 3); g.fill(); MGH.rr(g, -14, -60, 28, 30, 4); g.fill(); g.strokeStyle = '#5a6270'; g.lineWidth = 2; g.stroke(); if (it.dent) { g.strokeStyle = '#7a8290'; g.beginPath(); g.moveTo(-6, -50); g.lineTo(2, -44); g.lineTo(-4, -38); g.stroke(); } }
      else if (k === 'kendo') { g.fillStyle = '#d8c08a'; g.save(); g.rotate(-0.6); MGH.rr(g, -4, -70, 8, 70, 3); g.fill(); g.fillStyle = '#3a2a1a'; g.fillRect(-5, -16, 10, 16); g.restore(); }
      else if (k === 'can') { g.fillStyle = '#9aa2b0'; MGH.rr(g, -16, -40, 32, 40, 4); g.fill(); g.strokeStyle = '#6a7280'; g.lineWidth = 2; for (let q = 0; q < 4; q++) { g.beginPath(); g.moveTo(-12 + q * 8, -36); g.lineTo(-12 + q * 8, -4); g.stroke(); } g.fillStyle = '#b8c0cc'; g.beginPath(); g.ellipse(0, -42, 19, 5, 0, 0, 7); g.fill(); }
      else if (k === 'guitar') { g.save(); g.rotate(-0.5); g.fillStyle = '#c84a2a'; g.beginPath(); g.ellipse(0, -14, 15, 14, 0, 0, 7); g.ellipse(0, -34, 11, 10, 0, 0, 7); g.fill(); g.fillStyle = '#1a1a1a'; g.beginPath(); g.arc(0, -22, 4, 0, 7); g.fill(); g.fillStyle = '#6a4020'; g.fillRect(-2.5, -78, 5, 46); g.fillStyle = '#2a1a10'; g.fillRect(-4, -84, 8, 10); g.restore(); }
      else if (k === 'ext') { g.fillStyle = '#e8323e'; MGH.rr(g, -9, -46, 18, 46, 6); g.fill(); g.fillStyle = '#1a1a1a'; g.fillRect(-6, -54, 12, 8); g.strokeStyle = '#1a1a1a'; g.lineWidth = 3; g.beginPath(); g.moveTo(4, -50); g.quadraticCurveTo(18, -52, 16, -36); g.stroke(); g.fillStyle = '#fff'; g.fillRect(-7, -32, 14, 10); }
      else if (k === 'chicken') { g.fillStyle = '#ffe14a'; g.beginPath(); g.ellipse(0, -20, 8, 22, 0.2, 0, 7); g.fill(); g.fillStyle = '#e8323e'; g.beginPath(); g.arc(2, -44, 4, 0, 7); g.fill(); g.fillStyle = '#ff9a2a'; g.beginPath(); g.moveTo(6, -38); g.lineTo(14, -36); g.lineTo(6, -33); g.fill(); g.fillStyle = '#000'; g.beginPath(); g.arc(3, -38, 1.5, 0, 7); g.fill(); }
      else if (k === 'soda') { g.translate(0, Math.sin(t * 4 + it.x) * 4); g.fillStyle = '#3ad06a'; MGH.rr(g, -9, -40, 18, 32, 4); g.fill(); g.fillStyle = '#fff'; g.fillRect(-9, -30, 18, 8); g.fillStyle = '#c8c8d0'; g.fillRect(-8, -43, 16, 4); }
      else if (k === 'star') { MGH.star(g, 0, -26 + Math.sin(t * 4 + it.x) * 4, 16, '#ffd34d', t * 2, false); }
      else if (k === 'gloves') { g.translate(0, Math.sin(t * 4 + it.x) * 4); g.fillStyle = '#ffc83a'; g.beginPath(); g.arc(-8, -24, 11, 0, 7); g.arc(8, -24, 11, 0, 7); g.fill(); g.fillStyle = '#fff6c8'; g.beginPath(); g.arc(-11, -28, 3, 0, 7); g.arc(5, -28, 3, 0, 7); g.fill(); }
      g.restore();
    },
    drawW(m, S, g, W, t) {
      const pl = m.players[W.i], el = pl.el.id;
      let x = W.x, z = W.z, h = W.h, rot = 0, spin = 0, lying = W.st === 'down' || W.st === 'pinned' || (W.st === 'elim' && false);
      // inside a scripted move
      const mv = (S.mv || []).find(mv => mv.a === W.i || mv.v === W.i || mv.mate === W.i);
      if (mv) { const q = Math.min(1, mv.t / mv.dur), ps = this.movePose(mv, q, S), o = mv.v === W.i ? ps.V : ps.A; x = o.x; z = mv.mate === W.i ? o.z + 22 : o.z; h = o.h; rot = o.rot; spin = o.spin || 0; lying = false; }
      if (W.st === 'getup') { rot = -W.face * Math.PI / 2 * (1 - W.t / 0.35); }
      if (lying) rot = -W.face * Math.PI / 2;
      if (W.st === 'pin') { rot = -W.face * Math.PI * 0.42; h = -6; }
      const p = P(x, z, 0), r = 40 * p.k, gy = p.y;
      // shadow
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(p.x, gy + 2, (lying ? 60 : 34) * p.k * Math.max(0.5, 1 - h / 300), 8 * p.k, 0, 0, 7); g.fill();
      if (W.elim) { g.save(); g.globalAlpha = 0.85; Char.draw(g, p.x, gy - r * 1.25, r * 0.9, el, pl.color, { mood: 'sad', t: t + W.i, look: { x: 0, y: -0.3 }, seed: W.i * 1.7 }); g.restore(); return; }
      // team / player marker ring
      g.strokeStyle = m.teams ? MG.TEAMC[W.team] : pl.color; g.lineWidth = 3; g.beginPath(); g.ellipse(p.x, gy + 2, 38 * p.k, 11 * p.k, 0, 0, 7); g.stroke();
      const stance = W.st === 'strike' ? Math.sin(Math.min(1, W.t / (W.strikeDur || 0.28)) * Math.PI) : 0;
      const mood = W.st === 'grab' ? 'effort' : W.st === 'strike' ? 'angry' : W.st === 'perch' ? 'cheer' : W.st === 'hurt' ? 'hurt' : W.st === 'run' ? 'determined' : W.st === 'whipped' ? 'shock' : W.mood;
      g.save(); g.translate(p.x, gy - h * p.k);
      if (rot) { g.translate(0, -r * 0.6); g.rotate(rot); g.translate(0, r * 0.6); }
      if (spin) g.scale(Math.cos(spin), 1);
      const lean = W.st === 'run' ? W.face * 0.25 : W.st === 'strike' ? W.face * 0.18 * stance : W.st === 'hurt' ? -W.face * 0.25 : 0; if (lean) g.rotate(lean);
      const hands = W.st === 'strike' || W.st === 'grab' || (mv && mv.a === W.i) ? { n: { x: -1.35 - stance * 0.4, y: W.st === 'grab' || mv ? -0.9 : -0.2, d: -20, o: false, m: true }, f: { x: 0.5, y: W.st === 'grab' || mv ? -0.9 : 0.1, d: 40, o: false, m: false } } : W.st === 'perch' ? { n: { x: -1.2, y: -1.3, d: -80, o: true, m: true }, f: { x: 1.1, y: -1.3, d: -100, o: true, m: true } } : undefined;
      Char.draw(g, 0, -r * 1.25, r, el, pl.color, { mood: MGH.persona(mood, el), t: t + W.i, look: { x: -W.face, y: 0 }, seed: W.i * 1.7, walk: W.st === 'walk' || W.st === 'run' || W.st === 'whipped' ? 1 : 0, noShadow: true, noIdle: W.st !== 'idle', hands });
      if (W.item) this.drawItem(g, W.item, { x: W.face * r * 0.9, y: -r * 0.9, k: 1 }, t, true);
      g.restore();
      if (W.gloves > 0) MGH.glow(g, p.x + W.face * r, gy - r * 1.5 - h, r, 'rgba(255,220,90,0.5)');
      if (W.st === 'grab') MGH.text(g, W.mom >= 100 ? 'Ⓑ FINISHER!' : 'Ⓐ knee  Ⓑ move  ←→Ⓑ whip', p.x, gy - r * 3.4, 13, W.mom >= 100 ? '#ffd34d' : '#fff', 'center', 'bold');
      if (W.mom >= 100 && W.st !== 'grab') { const a = 0.5 + 0.5 * Math.sin(t * 8); MGH.glow(g, p.x, gy - r * 1.4 - h, r * 2.2, `rgba(255,210,80,${0.35 * a})`); }
      // the kick-out meter over a pinned wrestler
      if (W.st === 'pinned' && S.count && S.count.v === W.i) { const K = S.count.kick, bx = p.x - 70, by = gy - 120; g.fillStyle = 'rgba(0,0,0,0.6)'; MGH.rr(g, bx - 6, by - 10, 152, 34, 10); g.fill(); g.fillStyle = '#3a3a4a'; g.fillRect(bx, by, 140, 14); g.fillStyle = '#5adf4a'; g.fillRect(bx + 140 * (0.5 - K.zone), by, 140 * K.zone * 2, 14); g.fillStyle = '#fff'; g.fillRect(bx + 140 * K.pos - 2, by - 4, 4, 22); if (pl.human) MGH.text(g, 'Ⓐ KICK OUT!', p.x, by - 16, 16, '#fff', 'center', 'bold'); }
    },
    drawHUD(m, S, g, t) {
      // wrestler plates: health and hype
      S.w.forEach((W, i) => { const pl = m.players[i], x = 16 + i * 316, y = 652;
        g.fillStyle = 'rgba(10,6,24,0.8)'; MGH.rr(g, x, y, 300, 56, 12); g.fill(); g.strokeStyle = m.teams ? MG.TEAMC[W.team] : pl.color; g.lineWidth = 3; g.stroke();
        Char.draw(g, x + 28, y + 28, 15, pl.el.id, pl.color, { headOnly: true, noArms: true, noFeet: true, noShadow: true, mood: W.elim ? 'sad' : 'determined', seed: i });
        MGH.text(g, pl.name + (W.item ? ' ' + ({ chair: '🪑', kendo: '🎋', can: '🗑️', guitar: '🎸', ext: '🧯', chicken: '🐔' }[W.item.k] || '') : ''), x + 52, y + 20, 15, pl.color, 'left', 'bold');
        if (W.elim) { MGH.text(g, 'ELIMINATED', x + 180, y + 40, 18, '#ff8a8a', 'center', 'bold'); return; }
        g.fillStyle = '#3a1a1a'; MGH.rr(g, x + 52, y + 27, 236, 10, 5); g.fill(); g.fillStyle = W.hp > 50 ? '#5adf4a' : W.hp > 25 ? '#ffc83a' : '#ff4a4a'; MGH.rr(g, x + 52, y + 27, 236 * W.hp / 100, 10, 5); g.fill();
        const full = W.mom >= 100; g.fillStyle = '#1a1a3a'; MGH.rr(g, x + 52, y + 41, 236, 8, 4); g.fill(); g.fillStyle = full ? `hsl(${(t * 300) % 360},90%,60%)` : '#c88aff'; MGH.rr(g, x + 52, y + 41, 236 * W.mom / 100, 8, 4); g.fill();
        if (full) MGH.text(g, 'HYPE!', x + 268, y + 20, 13, '#ffd34d', 'right', 'bold'); });
      const left = Math.max(0, 240 - S.t); MGH.text(g, `${Math.floor(left / 60)}:${String(Math.floor(left % 60)).padStart(2, '0')}`, 1240, 70, 18, '#fff', 'right', 'bold');
      const B = S.banner; if (B) { const q = B.t / B.life, s = q < 0.12 ? 0.6 + q / 0.12 * 0.5 : 1.1 - Math.min(0.1, q); g.save(); g.translate(640, 230); g.scale(s, s); g.globalAlpha = Math.min(1, (1 - q) * 4);
        g.font = 'bold 54px Georgia'; const w = Math.min(1100, g.measureText(B.text).width + 60); g.fillStyle = 'rgba(0,0,0,0.55)'; MGH.rr(g, -w / 2, -46, w, B.sub ? 92 : 70, 18); g.fill();
        MGH.text(g, B.text, 0, 6, 50, B.col, 'center', 'bold'); if (B.sub) MGH.text(g, B.sub, 0, 36, 20, '#fff', 'center', 'bold'); g.restore(); }
    },
  };
  MG.def(ring);
  MG.def(Object.assign({}, ring, { id: 'ringtag', name: 'Ring Rumble: Tag Team', mode: '2v2', wins: 'The team that still has a wrestler standing.', how: ring.how.replace('Last wrestler standing wins!', 'Two teams of two, all four in the ring — you can\'t hurt your partner. Grab a foe with your partner close by for a DOUBLE TEAM move! Pin both rivals to win.') }));
})();
