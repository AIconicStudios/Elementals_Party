'use strict';
// PIPE PANIC — a 4-player platform brawl in the spirit of the classic arcade pipe games (original characters and art):
// critters pour out of the top pipes and walk down the ledges; bump the ledge under one to flip it, then kick it away.

const PP = {
  // ledges: [x0, x1, top y]; the screen wraps left/right so the side ledges join up
  PL: [[0, 1280, 660, 'ground'], [0, 470, 510, 'A'], [810, 1280, 510, 'B'], [0, 110, 360, 'D'], [260, 1020, 360, 'C'], [1170, 1280, 360, 'E'], [0, 520, 210, 'F'], [760, 1280, 210, 'G']],
  TH: 18, POW: { x: 640, y: 548, w: 56, h: 40 },
  // bot climbing spots: from ledge, stand at x, jump and drift in dir to land on the ledge above
  CLIMB: [{ f: 'ground', t: 'A', x: 520, d: -1 }, { f: 'ground', t: 'B', x: 760, d: 1 }, { f: 'A', t: 'C', x: 190, d: 1 }, { f: 'B', t: 'C', x: 1090, d: -1 }, { f: 'C', t: 'F', x: 600, d: -1 }, { f: 'C', t: 'G', x: 680, d: 1 }],
  // real drop-off edges of each ledge (where it does NOT continue across the screen wrap) and which way is 'off'
  EDGE: { A: [[470, 1]], B: [[810, -1]], C: [[260, -1], [1020, 1]], D: [[110, 1]], E: [[1170, -1]], F: [[520, 1]], G: [[760, -1]] },
  KIND: { bug: { sp: 70, hits: 1, col: '#3ab86a' }, crab: { sp: 62, hits: 2, col: '#e8503a' }, fly: { sp: 60, hits: 1, col: '#8a6ae8' } },
};
const ppW = x => ((x % 1280) + 1280) % 1280;
const ppDX = (a, b) => { let d = b - a; if (d > 640) d -= 1280; if (d < -640) d += 1280; return d; };

MG.def({
  id: 'pipepanic', name: 'Pipe Panic', type: 'Arena', controls: 'Move + A', dur: 90,
  rows: [['lr', 'Run'], ['a', 'Jump (hit a ledge from below to BUMP it)']],
  how: 'Critters pour out of the pipes at the top and wander down the ledges! Jump up and BUMP the ledge right under a critter to flip it on its back — then touch it to KICK it away for 2 points. Do it fast: a flipped critter gets back up angrier and quicker. Crabs need two bumps, and flies can only be flipped while they\'re touching a ledge. Touch a critter that\'s on its feet and you\'re knocked out for a moment. Hit the POW block to flip everything on the ground at once (three uses), bump rivals from below to send them flying, and grab the coins that roll out of the pipes!',
  wins: 'Most points (2 per kicked critter, 1 per coin).',
  init(m, S) {
    S.b = [0, 1, 2, 3].map(i => ({ x: 240 + i * 270, y: 660, vx: 0, vy: 0, ground: 'ground', face: i < 2 ? 1 : -1, pts: 0, stun: 0, out: 0, inv: 1, jumpT: 0, kicks: 0 }));
    S.e = []; S.coins = []; S.bumps = []; S.spawn = 1.5; S.pow = 3; S.powT = 0; S.n = 0; S.popups = [];
  },
  plat(id) { return PP.PL.find(p => p[3] === id); },
  // which ledge supports a point (feet at y) — handles wrap by checking x and x±1280
  under(x, y, tol = 2) { x = ppW(x); return PP.PL.find(p => Math.abs(y - p[2]) <= tol && x >= p[0] && x <= p[1]); },
  spawnCritter(S) {
    S.n++; const side = S.n % 2 ? -1 : 1, r = Math.random(), kind = r < 0.58 ? 'bug' : r < 0.82 ? 'crab' : 'fly';
    const speedUp = 1 + Math.min(0.6, S.n * 0.02);
    S.e.push({ kind, x: side < 0 ? 60 : 1220, y: 210, vx: 0, vy: 0, dir: side < 0 ? 1 : -1, sp: PP.KIND[kind].sp * speedUp, hits: PP.KIND[kind].hits, flip: 0, angry: 0, ground: true, hop: R.range(0.5, 1.2), emerge: 0.8, gone: 0, ph: R.range(0, 6) });
    Sfx.tone(300, 0.15, 'square', 0.03, 600);
  },
  bumpAt(m, S, pl, x, by) {
    S.bumps.push({ pl, x, t: 0 }); Sfx.thud();
    S.e.forEach(e => {
      if (e.gone || e.emerge > 0) return; const on = Math.abs(e.y - pl[2]) < 3 && e.ground;
      if (!on || Math.abs(ppDX(x, e.x)) > 50) return;
      if (e.flip > 0) { e.flip = 0; e.vy = -260; e.ground = false; return; } // bump again: it flips back up
      if (e.kind === 'crab' && e.hits > 1) { e.hits--; e.angry = 1; e.sp *= 1.35; e.vy = -200; e.ground = false; MGH.pop('grr!', e.x, e.y - 40, '#ff8a6a', 18); return; }
      e.flip = 5; e.vy = -300; e.ground = false; e.vx = 0; e.by = by; MGH.pop('FLIP!', e.x, e.y - 40, '#ffe680', 20);
    });
    S.b.forEach((o, j) => { if (j === by || o.out > 0) return; if (o.ground === pl[3] && Math.abs(ppDX(x, o.x)) < 46) { o.vy = -520; o.ground = null; o.stun = 0.7; MGH.pop('BUMP!', o.x, o.y - 70, '#9fe0ff', 18); } });
    S.coins.forEach(c => { if (Math.abs(c.y - pl[2]) < 3 && Math.abs(ppDX(x, c.x)) < 46 && !c.got) { c.got = true; S.b[by].pts++; MGH.pop('+1', c.x, c.y - 30, '#ffe680', 22); Sfx.coin(); } });
  },
  powHit(m, S, by) {
    if (S.pow <= 0) return; S.pow--; S.powT = 0.5; MGH.shake(10); Sfx.boom();
    S.e.forEach(e => { if (e.gone || e.emerge > 0 || !e.ground) return; if (e.flip > 0) { e.flip = 0; e.vy = -260; e.ground = false; return; } e.hits = 1; e.flip = 5; e.vy = -300; e.ground = false; e.by = by; });
    S.b.forEach((o, j) => { if (j !== by && o.out <= 0 && o.ground) { o.vy = -420; o.ground = null; o.stun = 0.6; } });
  },
  update(m, S, dt) {
    S.powT -= dt;
    S.spawn -= dt; const alive = S.e.filter(e => !e.gone).length;
    if (S.spawn <= 0 && alive < 3 + Math.floor(m.t / 25)) { this.spawnCritter(S); S.spawn = Math.max(1.6, 3.4 - m.t * 0.02); if (Math.random() < 0.3) { const side = R.pick([-1, 1]); S.coins.push({ x: side < 0 ? 60 : 1220, y: 210, vy: 0, dir: side < 0 ? 1 : -1, ground: true, emerge: 0.6, t: 0 }); } }
    // ---- players
    S.b.forEach((b, i) => {
      b.inv -= dt; b.stun -= dt;
      if (b.out > 0) { b.out -= dt; if (b.out <= 0) { b.x = 640; b.y = 360; b.vx = b.vy = 0; b.ground = 'C'; b.inv = 2; } return; }
      const a = b.stun > 0 ? 0 : m.axis(i).x, ax = Math.abs(a) > 0.25 ? Math.sign(a) : 0;
      b.vx += (ax * 300 - b.vx) * Math.min(1, dt * (b.ground ? 12 : 5)); if (ax) b.face = ax;
      if (b.ground && b.stun <= 0 && m.pressed(i, 'a')) { b.vy = -830; b.ground = null; b.jumpT = 0.15; if (!m.bot(i)) Sfx.tone(520, 0.06, 'triangle', 0.04, 300); }
      b.vy += 1800 * dt; if (b.vy > 900) b.vy = 900;
      b.x = ppW(b.x + b.vx * dt);
      const py = b.y; b.y += b.vy * dt; if (b.y < 110) { b.y = 110; if (b.vy < 0) b.vy = 0; } // ceiling
      if (b.vy > 0) { // land on a ledge
        const p = PP.PL.find(p => py <= p[2] + 1 && b.y >= p[2] && ppW(b.x) >= p[0] - 6 && ppW(b.x) <= p[1] + 6);
        if (p) { b.y = p[2]; b.vy = 0; b.ground = p[3]; } else b.ground = null;
      } else if (b.vy < 0) { // head hits the underside of a ledge → BUMP
        const head = b.y - 52, ph = py - 52, p = PP.PL.find(p => p[3] !== 'ground' && ph >= p[2] + PP.TH && head <= p[2] + PP.TH && ppW(b.x) >= p[0] + 4 && ppW(b.x) <= p[1] - 4);
        if (p) { b.y = p[2] + PP.TH + 52; b.vy = 60; this.bumpAt(m, S, p, ppW(b.x), i); }
        const P = PP.POW; if (S.pow > 0 && ph >= P.y + P.h / 2 && head <= P.y + P.h / 2 && Math.abs(b.x - P.x) < P.w / 2 + 6) { b.vy = 60; b.y = P.y + P.h / 2 + 52; this.powHit(m, S, i); }
      }
      if (b.ground && !this.under(b.x, b.y)) b.ground = null;
      // coins
      S.coins.forEach(c => { if (!c.got && c.emerge <= 0 && Math.abs(ppDX(b.x, c.x)) < 26 && Math.abs(b.y - 24 - c.y) < 36) { c.got = true; b.pts++; MGH.pop('+1', c.x, c.y - 30, '#ffe680', 22); Sfx.coin(); } });
      // critters
      S.e.forEach(e => {
        if (e.gone || e.emerge > 0 || b.out > 0) return; if (Math.abs(ppDX(b.x, e.x)) > 32 || Math.abs((b.y - 26) - (e.y - 14)) > 38) return;
        if (e.flip > 0) { e.gone = 1; e.kvx = (ppDX(b.x, e.x) >= 0 ? 1 : -1) * 520; e.vy = -420; b.pts += 2; b.kicks++; MGH.pop('+2 KICK!', e.x, e.y - 40, '#ffe680', 24); Sfx.coin(); MGH.burst(e.x, e.y - 10, ['#fff', '#ffe680'], 14, { speed: 220 }); }
        else if (b.inv <= 0) { b.out = 1.8; b.vy = -500; b.pts = Math.max(0, b.pts - 1); Sfx.bad(); MGH.pop('OUCH −1', b.x, b.y - 70, '#ff8a8a', 22); b.koY = b.y; b.koX = b.x; b.koT = 0; }
      });
    });
    // player-vs-player: stomp heads, gentle side push
    for (let x = 0; x < 4; x++) for (let y = x + 1; y < 4; y++) { const A = S.b[x], B = S.b[y]; if (A.out > 0 || B.out > 0) continue; const dx = ppDX(A.x, B.x); if (Math.abs(dx) > 32) continue; const dy = B.y - A.y;
      if (Math.abs(dy) < 20) { const o = (32 - Math.abs(dx)) / 2 * Math.sign(dx || 1); A.x = ppW(A.x - o); B.x = ppW(B.x + o); }
      else if (dy > 30 && dy < 60 && A.vy > 0) { A.vy = -560; B.stun = 0.6; Sfx.tone(700, 0.05, 'square', 0.03); } else if (-dy > 30 && -dy < 60 && B.vy > 0) { B.vy = -560; A.stun = 0.6; Sfx.tone(700, 0.05, 'square', 0.03); } }
    // ---- critters
    S.e.forEach(e => {
      e.ph += dt;
      if (e.gone) { e.x = ppW(e.x + e.kvx * dt); e.vy += 1400 * dt; e.y += e.vy * dt; if (e.y > 900) e.dead = true; return; }
      if (e.emerge > 0) { e.emerge -= dt; return; }
      if (e.flip > 0) { e.flip -= dt; if (e.flip <= 0) { e.angry = 1; e.sp *= 1.3; e.hits = PP.KIND[e.kind].hits; e.vy = -200; e.ground = false; MGH.pop('!!', e.x, e.y - 40, '#ff6a4a', 22); } }
      const walking = e.flip <= 0;
      if (walking) { e.vx = e.dir * e.sp; if (e.kind === 'fly' && e.ground) { e.hop -= dt; if (e.hop <= 0) { e.vy = -380; e.ground = false; e.hop = R.range(0.7, 1.3); } } }
      else e.vx = 0;
      e.x = ppW(e.x + e.vx * dt);
      const py = e.y; e.vy += 1500 * dt; e.y += e.vy * dt;
      const p = e.vy >= 0 && PP.PL.find(p => py <= p[2] + 1 && e.y >= p[2] && ppW(e.x) >= p[0] && ppW(e.x) <= p[1]);
      if (p) { e.y = p[2]; e.vy = 0; e.ground = true; } else e.ground = false;
      // reaching the bottom pipes: back to the top, a little faster
      if (e.ground && e.y === 660 && (e.x < 50 || e.x > 1230)) { const side = e.x < 640 ? -1 : 1; e.x = side < 0 ? 1220 : 60; e.y = 210; e.dir = side < 0 ? -1 : 1; e.emerge = 0.8; e.sp *= 1.08; }
    });
    S.e = S.e.filter(e => !e.dead);
    // ---- coins roll along like critters
    S.coins.forEach(c => { c.t += dt; if (c.emerge > 0) { c.emerge -= dt; return; } c.x = ppW(c.x + c.dir * 90 * dt); const py = c.y; c.vy += 1500 * dt; c.y += c.vy * dt; const p = c.vy >= 0 && PP.PL.find(p => py <= p[2] + 1 && c.y >= p[2] && ppW(c.x) >= p[0] && ppW(c.x) <= p[1]); if (p) { c.y = p[2]; c.vy = 0; } if (c.y === 660 && (c.x < 50 || c.x > 1230)) c.got = true; });
    S.coins = S.coins.filter(c => !c.got);
    S.bumps.forEach(k => { k.t += dt; }); S.bumps = S.bumps.filter(k => k.t < 0.3);
  },
  // ---------------------------------------------------------------- bots: kick flipped critters, bump critters from below, dodge, climb
  bot(m, S, i) {
    const b = S.b[i], v = m.vin[i]; v.a = false; v.ax = 0; if (b.out > 0 || b.stun > 0) return;
    b.think = (b.think || 0) - 1 / 60;
    const myP = b.ground ? this.plat(b.ground) : null;
    // pick a goal
    if (b.think <= 0 || !b.goal) {
      b.think = R.range(0.25, 0.5);
      const fl = S.e.filter(e => !e.gone && e.flip > 0.6 && e.ground).sort((p, q) => Math.abs(ppDX(b.x, p.x)) + Math.abs(b.y - p.y) - Math.abs(ppDX(b.x, q.x)) - Math.abs(b.y - q.y))[0];
      if (fl) b.goal = { x: fl.x, plat: this.under(fl.x, fl.y, 3), kick: true };
      else {
        const tg = S.e.filter(e => !e.gone && e.flip <= 0 && e.ground && e.emerge <= 0 && e.y < 660).sort((p, q) => Math.abs(ppDX(b.x, p.x)) - Math.abs(ppDX(b.x, q.x)) + (p.y - q.y) * 0.3)[0];
        if (tg) { const above = this.under(tg.x, tg.y, 3), below = PP.PL.filter(p => p[2] > above[2] && ppW(tg.x) >= p[0] && ppW(tg.x) <= p[1]).sort((p, q) => p[2] - q[2])[0]; b.goal = below ? { x: tg.x + tg.dir * 40, plat: below, bump: tg, above } : { x: 640, plat: this.plat('ground') }; }
        else if (S.coins.length) { const c = S.coins[0]; b.goal = { x: c.x, plat: this.under(c.x, c.y, 3) || this.plat('ground') }; }
        else b.goal = { x: 640, plat: this.plat('ground') };
      }
    }
    const G = b.goal; if (!G || !G.plat) return;
    // danger: an upright critter ahead on my ledge → jump over it or back off
    const near = S.e.find(e => !e.gone && e.flip <= 0 && e.emerge <= 0 && Math.abs(e.y - b.y) < 30 && Math.abs(ppDX(b.x, e.x)) < 95 && ppDX(e.x, b.x) * e.dir > 0);
    if (near && b.ground) { if (Math.random() < 0.55) { v.a = true; v.ax = Math.sign(ppDX(b.x, near.x)) || 1; } else v.ax = -Math.sign(ppDX(b.x, near.x)) || 1; return; }
    if (!myP) { v.ax = Math.sign(ppDX(b.x, G.x)) * 0.8; if (b.climbDir) v.ax = b.climbDir; return; }
    b.climbDir = 0;
    if (myP === G.plat) {
      const d = ppDX(b.x, G.x);
      if (G.bump) { const e = G.bump; if (e.gone || e.flip > 0) { b.goal = null; return; } const de = ppDX(b.x, e.x); if (Math.abs(de) < 34 && Math.abs(e.y - G.above[2]) < 3) { v.a = true; return; } v.ax = Math.abs(de) > 10 ? Math.sign(de) * 0.8 : 0; return; }
      v.ax = Math.abs(d) > 8 ? Math.sign(d) : 0; return;
    }
    if (G.plat[2] > myP[2]) { // go down: walk off the ledge edge that leads toward the goal
      const ed = (PP.EDGE[myP[3]] || []).map(([ex, o]) => ({ x: ex + o * 34, c: Math.abs(ppDX(b.x, ex)) + Math.abs(ppDX(ex, G.x)) })).sort((p, q) => p.c - q.c)[0];
      v.ax = ed ? (Math.sign(ppDX(b.x, ed.x)) || 1) : (Math.sign(ppDX(b.x, G.x)) || 1); return;
    }
    // go up: use a climbing spot
    const cl = PP.CLIMB.filter(c => c.f === myP[3]).sort((p, q) => Math.abs(ppDX(p.x, G.x)) - Math.abs(ppDX(q.x, G.x)))[0];
    if (!cl) { v.ax = Math.sign(ppDX(b.x, G.x)) || 1; return; }
    const dc = ppDX(b.x, cl.x); if (Math.abs(dc) > 14) { v.ax = Math.sign(dc); return; }
    v.a = true; v.ax = cl.d; b.climbDir = cl.d;
  },
  score(m, S) { return S.b.map(b => b.pts); },
  fmt(s) { return `${s} pts`; },
  hud(m, S, i) { return `⭐ ${S.b[i].pts}`; },
  // ---------------------------------------------------------------- art
  critter(g, e, t) {
    const k = PP.KIND[e.kind], flip = e.flip > 0, shake = flip && e.flip < 1.5 ? Math.sin(t * 50) * 2 : 0, col = e.angry ? '#ff5a3a' : k.col;
    g.save(); g.translate(e.x + shake, e.y); if (e.gone) g.rotate(t * 14); if (flip) { g.translate(0, -27); g.scale(1, -1); }
    const walk = !flip && e.ground ? Math.sin(t * 16 + e.ph) : 0;
    if (e.kind === 'bug') {
      g.fillStyle = '#2a2a2a'; [-14, -2, 10].forEach((lx, q) => { g.fillRect(lx + walk * (q % 2 ? 3 : -3), -6, 3, 8 + (flip ? Math.sin(t * 30 + q) * 3 : 0)); });
      const sh = g.createRadialGradient(-6, -22, 2, 0, -14, 22); sh.addColorStop(0, Char.shade(col, 0.45)); sh.addColorStop(1, Char.shade(col, -0.35)); g.fillStyle = sh; g.beginPath(); g.ellipse(-2, -14, 20, 14, 0, Math.PI, 0); g.lineTo(18, -6); g.lineTo(-22, -6); g.fill();
      g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 2; g.beginPath(); g.moveTo(-2, -28); g.lineTo(-2, -6); g.stroke(); g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.ellipse(-10, -20, 5, 3, -0.5, 0, 7); g.fill();
      g.fillStyle = '#ffd890'; g.beginPath(); g.arc(e.dir * 18, -10, 8, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(e.dir * 21, -12, 3.5, 0, 7); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.arc(e.dir * 22, -12, 2, 0, 7); g.fill();
      if (e.angry) { g.strokeStyle = '#111'; g.lineWidth = 2; g.beginPath(); g.moveTo(e.dir * 17, -17); g.lineTo(e.dir * 25, -15); g.stroke(); }
    } else if (e.kind === 'crab') {
      g.fillStyle = Char.shade(col, -0.3); [-1, 1].forEach(sd => { for (let q = 0; q < 3; q++) { g.save(); g.translate(sd * (8 + q * 5), -6); g.rotate(sd * (0.6 + walk * 0.3)); g.fillRect(-1.5, 0, 3, 10); g.restore(); } });
      const sh = g.createRadialGradient(-4, -18, 2, 0, -12, 22); sh.addColorStop(0, Char.shade(col, 0.4)); sh.addColorStop(1, Char.shade(col, -0.3)); g.fillStyle = sh; g.beginPath(); g.ellipse(0, -12, 20, 11, 0, 0, 7); g.fill();
      [-1, 1].forEach(sd => { g.save(); g.translate(sd * 22, -16 + Math.sin(t * 6 + sd) * 2); g.fillStyle = col; g.beginPath(); g.ellipse(0, 0, 8, 6, sd * 0.4, 0, 7); g.fill(); g.fillStyle = '#fff4e0'; g.beginPath(); g.moveTo(sd * 2, -2); g.lineTo(sd * 10, -6); g.lineTo(sd * 6, 0); g.fill(); g.restore(); });
      [-5, 5].forEach(ex => { g.strokeStyle = Char.shade(col, -0.3); g.lineWidth = 2; g.beginPath(); g.moveTo(ex, -20); g.lineTo(ex, -28); g.stroke(); g.fillStyle = '#fff'; g.beginPath(); g.arc(ex, -29, 4, 0, 7); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.arc(ex + e.dir, -29, 2, 0, 7); g.fill(); });
      if (e.hits < PP.KIND.crab.hits || e.angry) { g.fillStyle = '#ffe680'; g.font = 'bold 14px Georgia'; g.textAlign = 'center'; g.fillText('💢', 0, -36); }
    } else {
      const fl = Math.sin(t * 40); g.fillStyle = 'rgba(220,235,255,0.75)'; g.beginPath(); g.ellipse(-8, -26, 10, 5 + fl * 3, -0.5, 0, 7); g.ellipse(8, -26, 10, 5 + fl * 3, 0.5, 0, 7); g.fill();
      const sh = g.createRadialGradient(-4, -18, 2, 0, -14, 16); sh.addColorStop(0, Char.shade(col, 0.5)); sh.addColorStop(1, Char.shade(col, -0.3)); g.fillStyle = sh; g.beginPath(); g.arc(0, -14, 13, 0, 7); g.fill();
      g.fillStyle = '#ffe060'; g.fillRect(-12, -14, 24, 4); g.fillStyle = '#fff'; g.beginPath(); g.arc(e.dir * 6, -18, 5, 0, 7); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.arc(e.dir * 7, -18, 2.5, 0, 7); g.fill();
      g.strokeStyle = '#2a2a2a'; g.lineWidth = 2; [-5, 5].forEach(lx => { g.beginPath(); g.moveTo(lx, -2); g.lineTo(lx + walk * 3, 4); g.stroke(); });
    }
    g.restore();
    if (flip) { const k2 = e.flip / 5; g.fillStyle = 'rgba(0,0,0,0.45)'; MGH.rr(g, e.x - 20, e.y + 4, 40, 6, 3); g.fill(); g.fillStyle = e.flip < 1.5 ? '#ff6a4a' : '#ffe680'; MGH.rr(g, e.x - 20, e.y + 4, 40 * k2, 6, 3); g.fill(); MGH.star(g, e.x + Math.cos(t * 6) * 16, e.y - 30 + Math.sin(t * 6) * 4, 5, '#ffe680', t * 4, false); }
  },
  pipe(g, x, y, w, h, dir, t) {
    const pg = g.createLinearGradient(0, y, 0, y + h); pg.addColorStop(0, '#7ae86a'); pg.addColorStop(0.5, '#3aa83a'); pg.addColorStop(1, '#1f7a2a');
    g.fillStyle = pg; g.fillRect(x, y, w, h); g.fillStyle = 'rgba(255,255,255,0.3)'; g.fillRect(x, y + 6, w, 5);
    const mx = dir > 0 ? x + w - 14 : x - 4; g.fillStyle = pg; g.fillRect(mx, y - 8, 18, h + 16); g.strokeStyle = '#155a1a'; g.lineWidth = 3; g.strokeRect(mx, y - 8, 18, h + 16); g.strokeRect(x, y, w, h);
    g.fillStyle = '#0a2a0a'; g.beginPath(); g.ellipse(dir > 0 ? mx + 18 : mx, y + h / 2, 5, h / 2 + 4, 0, 0, 7); g.fill();
  },
  draw(m, S, g) {
    const t = m.t;
    // night rooftop scene behind the ledges
    GX.vfill(g, 0, 0, 1280, 720, ['#141a3a', '#2a2a5a', '#3a3060']);
    for (let k = 0; k < 50; k++) { g.fillStyle = `rgba(255,255,255,${0.3 + 0.4 * Math.abs(Math.sin(t + k))})`; g.fillRect(MGH.hash(k) * 1280, MGH.hash(k + 4) * 300, 1.8, 1.8); }
    MGH.glow(g, 1060, 110, 90, 'rgba(230,240,255,0.35)'); g.fillStyle = '#f4f6ff'; g.beginPath(); g.arc(1060, 110, 28, 0, 7); g.fill();
    for (let k = 0; k < 14; k++) { const x = k * 96 - 20, h = 140 + MGH.hash(k * 3) * 200; g.fillStyle = '#1a1838'; g.fillRect(x, 720 - h, 86, h); for (let r = 0; r < h / 30 - 1; r++) for (let c = 0; c < 3; c++) if (MGH.hash(k * 31 + r * 7 + c) < 0.45) { g.fillStyle = 'rgba(255,210,120,0.5)'; g.fillRect(x + 12 + c * 24, 720 - h + 14 + r * 30, 12, 14); } }
    // ledges: chunky bricks with a bevel, bumped tiles pop up
    PP.PL.forEach(p => {
      const [x0, x1, y] = p, ground = p[3] === 'ground';
      for (let x = x0; x < x1; x += 32) {
        const w = Math.min(32, x1 - x), bump = S.bumps.filter(k => k.pl === p).reduce((a, k) => Math.max(a, Math.max(0, 1 - Math.abs(ppDX(k.x, x + 16)) / 50) * Math.sin(k.t / 0.3 * Math.PI) * 14), 0);
        const yy = y - bump, h = ground ? 60 : PP.TH;
        const bg = g.createLinearGradient(0, yy, 0, yy + h); bg.addColorStop(0, ground ? '#8a6a4a' : '#5a8ae8'); bg.addColorStop(1, ground ? '#5a3a20' : '#2a4aa8'); g.fillStyle = bg; g.fillRect(x, yy, w, h);
        g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(x, yy, w, 3); g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 1.5; g.strokeRect(x + 0.5, yy + 0.5, w - 1, h - 1);
        if (ground) { g.strokeStyle = 'rgba(0,0,0,0.2)'; g.beginPath(); g.moveTo(x, yy + 30); g.lineTo(x + w, yy + 30); g.stroke(); }
      }
    });
    // pipes: top pipes spit critters, bottom pipes swallow them
    this.pipe(g, 0, 150, 70, 48, 1, t); this.pipe(g, 1210, 150, 70, 48, -1, t);
    this.pipe(g, 0, 604, 46, 48, 1, t); this.pipe(g, 1234, 604, 46, 48, -1, t);
    // POW block
    if (S.pow > 0) { const P = PP.POW, sq = S.powT > 0 ? Math.sin(S.powT / 0.5 * Math.PI) * 6 : 0, hgt = P.h * (0.5 + S.pow / 6); g.save(); g.translate(P.x, P.y + P.h / 2 - sq); const pg = g.createLinearGradient(0, -hgt, 0, 0); pg.addColorStop(0, '#ffe680'); pg.addColorStop(1, '#e8a020'); g.fillStyle = pg; MGH.rr(g, -P.w / 2, -hgt, P.w, hgt, 6); g.fill(); g.strokeStyle = '#8a5a10'; g.lineWidth = 3; g.stroke(); MGH.text(g, 'POW', 0, -hgt / 2 + 7, 18, '#8a3a10', 'center', 'bold'); g.restore(); }
    if (S.powT > 0) { g.fillStyle = `rgba(255,240,180,${S.powT * 0.3})`; g.fillRect(0, 0, 1280, 720); }
    // coins
    S.coins.forEach(c => { if (c.emerge > 0) return; const sx = Math.abs(Math.cos(c.t * 6)); MGH.glow(g, c.x, c.y - 16, 22, 'rgba(255,220,80,0.4)'); g.fillStyle = '#ffd34d'; g.beginPath(); g.ellipse(c.x, c.y - 16, 12 * sx + 2, 13, 0, 0, 7); g.fill(); g.strokeStyle = '#b8862a'; g.lineWidth = 2; g.stroke(); });
    // critters (also drawn across the wrap edge)
    S.e.forEach(e => { if (e.emerge > 0) return; this.critter(g, e, t); if (e.x < 40) this.critter(g, Object.assign({}, e, { x: e.x + 1280 }), t); if (e.x > 1240) this.critter(g, Object.assign({}, e, { x: e.x - 1280 }), t); });
    // heroes
    S.b.forEach((b, i) => {
      const p = m.players[i];
      if (b.out > 0) { const k = 1 - b.out / 1.8; g.save(); g.globalAlpha = Math.max(0, 1 - k); g.translate(b.koX, b.koY - 28 - Math.sin(Math.min(1, k * 2) * Math.PI) * 80 + k * k * 300); g.rotate(k * 8); Char.draw(g, 0, 0, 22, p.el.id, p.color, { mood: 'dizzy', seed: i * 1.7, noShadow: true }); g.restore(); return; }
      const draw1 = x => { if (b.inv > 0 && Math.floor(t * 12) % 2) return; const air = !b.ground, sq = b.ground && Math.abs(b.vy) < 1 ? 0 : 0;
        Char.draw(g, x, b.y - 28, 22, p.el.id, p.color, { mood: MGH.persona(b.stun > 0 ? 'dizzy' : air ? 'cheer' : 'determined', p.el.id), seed: i * 1.7, look: { x: b.face, y: 0 }, walk: b.ground && Math.abs(b.vx) > 30 ? 1 : 0, hands: air ? { n: { x: -0.3, y: -1.5, d: -90, o: false, m: true }, f: { x: 0.9, y: -0.2, d: 0, o: true, m: false } } : undefined });
        g.fillStyle = p.color; g.beginPath(); g.moveTo(x - 7, b.y - 76); g.lineTo(x, b.y - 66); g.lineTo(x + 7, b.y - 76); g.fill(); };
      draw1(b.x); if (b.x < 30) draw1(b.x + 1280); if (b.x > 1250) draw1(b.x - 1280);
    });
    // scoreboard plaques
    m.players.forEach((p, i) => { const x = 160 + i * 320; g.fillStyle = 'rgba(0,0,0,0.5)'; MGH.rr(g, x - 70, 690 - 4, 140, 30, 15); g.fill(); MGH.text(g, `${p.name} ⭐ ${S.b[i].pts}`, x, 707, 17, p.color, 'center', 'bold'); });
  },
});
