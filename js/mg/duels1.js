'use strict';
// DUELS (part 1): two-player face-offs (they also run in free play; the other two players watch)
// + Number Climb, which also has a 4-player version

const DU = {
  pair(m) { return m.duel || [0, 1]; },
  // full score array: the two duelists get their scores, watchers get -1 (never win)
  scores(m, a, b) { const [x, y] = this.pair(m), s = [-1, -1, -1, -1]; s[x] = a; s[y] = b; return s; },
  on(m, i) { return this.pair(m).includes(i); },
  hud(m, i, txt) { return this.on(m, i) ? txt : '👀 watching'; },
};

// ===================================================================== NUMBER CLIMB (2-player duel + 4-player race)
// Climb the vines and grab hanging numbers 1–9; touch the + − × ÷ stones by the water to change what a number does.
// Hit the host's target EXACTLY to win the round. Five rounds: easy sums → times → mixed → big → negative.
const NC = {
  ISL: [[60, 300], [400, 600], [700, 880], [980, 1220]],       // islands [x0, x1] (top at y 600)
  ROPES: [140, 240, 450, 550, 750, 830, 1050, 1150],           // vine x positions (from y 150 to 545)
  OPS: [{ x: 270, o: '+' }, { x: 500, o: '−' }, { x: 790, o: '×' }, { x: 1100, o: '÷' }],
  TOP: 150, BOT: 545, GY: 600,
  target(round) {
    if (round === 0) return R.int(9, 18);
    if (round === 1) return R.pick([24, 27, 28, 32, 35, 36, 42, 45, 48]);
    if (round === 2) return R.int(31, 58);
    if (round === 3) return R.int(64, 99);
    return -R.int(6, 21);
  },
  apply(tot, op, v) { if (op === '+') return tot + v; if (op === '−') return tot - v; if (op === '×') return tot * v; if (op === '÷') return tot % v === 0 ? tot / v : null; return tot; },
  islandAt(x) { return this.ISL.find(([a, b]) => x >= a && x <= b); },
};
const ncDef = (spec) => MG.def(Object.assign({
  type: 'Duel', controls: 'Move + A', dur: 0,
  rows: [['stick', 'Walk · climb vines · UP at a stone = take its sign'], ['a', 'Jump (from vines too)']],
  wins: 'Most rounds won (5 rounds).',
  init(m, S) {
    S.who = this.who(m); S.round = 0; S.wins = [0, 0, 0, 0]; S.fx = [];
    S.tags = []; NC.ROPES.forEach((rx, r) => { [0.25, 0.55, 0.85].forEach((f, k) => { if (k === 2 && r % 2) return; S.tags.push({ r, x: rx, y: NC.TOP + 40 + f * (NC.BOT - NC.TOP - 60), v: R.int(1, 9), t: 0, sw: R.range(0, 6) }); }); });
    this.newRound(m, S);
  },
  newRound(m, S) {
    S.target = NC.target(S.round); S.ph = 'show'; S.pt = 0; S.winner = -1;
    S.p = [0, 1, 2, 3].map(i => { const k = S.who.indexOf(i), x = k < 0 ? -999 : [180, 1100, 500, 790][k]; return { x, y: NC.GY, vx: 0, vy: 0, st: 'ground', rope: -1, tot: 0, op: '+', fall: 0, face: x < 640 ? 1 : -1, clim: 0, bump: 0, last: '', lastT: 0, nope: 0 }; });
    S.tags.forEach(t => { t.v = R.int(1, 9); t.t = 0; });
  },
  update(m, S, dt) {
    S.pt += dt;
    S.tags.forEach(t => { if (t.t > 0) { t.t -= dt; if (t.t <= 0) t.v = R.int(1, 9); } t.sw += dt; });
    if (S.ph === 'show') { if (S.pt > 2.2) { S.ph = 'go'; S.pt = 0; } return; }
    if (S.ph === 'won') { if (S.pt > 2.6) { S.round++; if (S.round >= 5) { m.finish(this.score(m, S)); return; } this.newRound(m, S); } return; }
    if (S.pt > 55) { // a long round ends: closest total takes it
      const best = S.who.slice().sort((a, b) => Math.abs(S.p[a].tot - S.target) - Math.abs(S.p[b].tot - S.target))[0]; this.roundWin(m, S, best, true); return; }
    S.who.forEach(i => {
      const P = S.p[i], a = m.axis(i); P.lastT -= dt; P.nope -= dt; P.bump -= dt;
      if (P.fall > 0) { P.fall -= dt; if (P.fall <= 0) { const I = NC.ISL.slice().sort((p, q) => Math.abs((p[0] + p[1]) / 2 - P.x) - Math.abs((q[0] + q[1]) / 2 - P.x))[0]; P.x = clamp(P.x, I[0] + 20, I[1] - 20); P.y = NC.GY; P.vx = P.vy = 0; P.st = 'ground'; } return; }
      if (Math.abs(a.x) > 0.3) P.face = Math.sign(a.x);
      if (P.st === 'rope') {
        const rx = NC.ROPES[P.rope]; P.x = rx; const cy = a.y < -0.4 ? -1 : a.y > 0.4 ? 1 : 0; P.y = clamp(P.y + cy * 190 * dt, NC.TOP + 40, NC.BOT + 40); if (cy) P.clim += dt * 7;
        if (m.pressed(i, 'a')) { P.st = 'air'; P.vy = -380; P.vx = (Math.abs(a.x) > 0.3 ? Math.sign(a.x) : P.face) * 250; P.rope = -1; if (!m.bot(i)) Sfx.tone(520, 0.05, 'triangle', 0.04, 300); }
        else if (cy > 0 && P.y >= NC.BOT + 36) { P.st = 'air'; P.vy = 0; P.vx = 0; P.rope = -1; }
      } else {
        if (P.st === 'ground') { P.vx += (a.x * 240 - P.vx) * Math.min(1, dt * 12); if (m.pressed(i, 'a')) { P.st = 'air'; P.vy = -560; if (!m.bot(i)) Sfx.tone(520, 0.05, 'triangle', 0.04, 300); } }
        else P.vx += (a.x * 230 - P.vx) * Math.min(1, dt * 3);
        if (P.st === 'air') { P.vy += 1500 * dt; }
        P.x = clamp(P.x + P.vx * dt, 30, 1250); const py = P.y; P.y += (P.st === 'air' ? P.vy : 0) * dt;
        if (P.st === 'ground' && !NC.islandAt(P.x)) { P.st = 'air'; P.vy = 0; }
        if (P.st === 'air') {
          const I = NC.islandAt(P.x); if (I && P.vy > 0 && py <= NC.GY && P.y >= NC.GY) { P.y = NC.GY; P.vy = 0; P.st = 'ground'; }
          // grab a vine when you touch it while holding up (or while jumping up through it)
          const r = NC.ROPES.findIndex(rx => Math.abs(rx - P.x) < 20); if (r >= 0 && P.bump <= 0 && P.y - 40 > NC.TOP && P.y - 40 < NC.BOT + 10 && (a.y < -0.3 || P.vy < 0)) { P.st = 'rope'; P.rope = r; P.vx = P.vy = 0; }
          if (P.y > 660) { P.fall = 1.3; S.fx.push({ k: 'splash', x: P.x, t: 0 }); if (!m.bot(i)) Sfx.noise(0.3, 900, 0.08, 'lowpass'); }
        }
        if (P.st === 'ground') { const r = NC.ROPES.findIndex(rx => Math.abs(rx - P.x) < 18); if (r >= 0 && a.y < -0.5) { P.st = 'rope'; P.rope = r; P.y = Math.min(P.y, NC.BOT + 40); } }
      }
      // grab numbers (reach from the vine or mid-jump)
      if (P.st !== 'ground') S.tags.forEach(t => { if (t.t > 0 || Math.abs(t.x - P.x) > 30 || Math.abs(t.y - (P.y - 46)) > 34) return; const res = NC.apply(P.tot, P.op, t.v);
        if (res === null) { if (P.nope <= 0) { P.nope = 0.6; P.last = `${P.tot} ÷ ${t.v} ✖`; P.lastT = 1.2; if (!m.bot(i)) Sfx.bad(); } return; }
        P.last = `${P.tot} ${P.op} ${t.v} = ${res}`; P.lastT = 1.6; P.tot = clamp(res, -199, 199); t.t = 2.2; if (!m.bot(i)) Sfx.coin(); S.fx.push({ k: 'pop', x: t.x, y: t.y, v: t.v, c: m.players[i].color, t: 0 });
        if (P.tot === S.target) this.roundWin(m, S, i, false); });
      // operator stones by the water
      if (P.st === 'ground' && a.y < -0.5) NC.OPS.forEach(o => { if (Math.abs(o.x - P.x) < 26 && P.op !== o.o) { P.op = o.o; if (!m.bot(i)) Sfx.tone(820, 0.06, 'triangle', 0.04); } });
    });
    // climbers bump on a shared vine / crowd each other on islands (4-player)
    for (let x = 0; x < S.who.length; x++) for (let y = x + 1; y < S.who.length; y++) { const A = S.p[S.who[x]], B = S.p[S.who[y]]; if (A.fall > 0 || B.fall > 0) continue; if (Math.abs(A.x - B.x) < 26 && Math.abs(A.y - B.y) < 40) { if (A.st === 'rope' && B.st === 'rope' && A.rope === B.rope) { const lo = A.y > B.y ? A : B; lo.st = 'air'; lo.vy = 60; lo.vx = (lo.face || 1) * -60; lo.rope = -1; lo.bump = 0.6; MGH.pop('bonk!', lo.x, lo.y - 70, '#fff', 18); } else if (A.st === 'ground' && B.st === 'ground') { const d = Math.sign(B.x - A.x) || 1; A.x -= d * 3; B.x += d * 3; } } }
    S.fx.forEach(f => { f.t += dt; }); S.fx = S.fx.filter(f => f.t < 1.2);
  },
  roundWin(m, S, i, timeUp) { S.wins[i]++; S.winner = i; S.ph = 'won'; S.pt = 0; S.timeUp = timeUp; Sfx.coin(); Sfx.crowd && Sfx.crowd('cheer'); MGH.burst(640, 120, ['#ffe680', '#fff', m.players[i].color], 30, { speed: 300 }); },
  // ---------------------------------------------------------------- bots: pick the number (or operator) that gets closest, then go get it
  bot(m, S, i) {
    const v = m.vin[i]; v.a = false; v.ax = v.ay = 0; if (!S.who.includes(i) || S.ph !== 'go') return; const P = S.p[i]; if (P.fall > 0) return;
    P.think = (P.think || 0) - 1 / 60;
    if (P.think <= 0 || !P.goal || (P.goal.tag && P.goal.tag.t > 0) || (!P.goal.tag && P.goal.op === P.op)) {
      P.think = R.range(2.5, 4); const d0 = Math.abs(P.tot - S.target); let best = null;
      const consider = (op, extra) => S.tags.forEach(t => { if (t.t > 0) return; const r = NC.apply(P.tot, op, t.v); if (r === null) return; const d = Math.abs(r - S.target), cost = Math.abs(t.x - P.x) / 300 + Math.abs(t.y - P.y) / 300 + extra; const sc = (d0 - d) * 3 - cost + (r === S.target ? 50 : 0); if (!best || sc > best.sc) best = { sc, tag: t, op }; });
      consider(P.op, 0); NC.OPS.forEach(o => { if (o.o !== P.op) consider(o.o, 1.5 + Math.abs(o.x - P.x) / 300); });
      if (!best || best.sc < -1) { const o = NC.OPS[S.target < P.tot ? 1 : 0]; best = { op: o.o, tag: null, sc: 0 }; }
      P.goal = best; P.err = Math.random() < 0.12;
    }
    const G = P.goal;
    if (G.op !== P.op) { const o = NC.OPS.find(q => q.o === G.op); this.botGo(m, S, i, o.x, NC.GY, true); return; }
    if (!G.tag) return; this.botGo(m, S, i, G.tag.x, G.tag.y + 46, false);
  },
  botGo(m, S, i, tx, ty, ground) {
    const v = m.vin[i], P = S.p[i]; this.botGo2(m, S, i, tx, ty, ground); if (v.a && m.prev[i].a) v.a = false; // a tap, not a hold
  },
  botGo2(m, S, i, tx, ty, ground) {
    const v = m.vin[i], P = S.p[i];
    if (P.st === 'rope') { const dx = tx - P.x; if (ground || Math.abs(dx) > 30) { // leave the vine toward the target
        if (ground) { v.ay = 1; if (P.y > NC.BOT) { v.a = true; v.ax = Math.sign(dx) || 1; } return; }
        const nb = NC.ROPES.findIndex((rx, r) => r !== P.rope && Math.sign(rx - P.x) === Math.sign(dx) && Math.abs(rx - P.x) < 130); if (nb >= 0 && Math.abs(P.y - ty) < 100) { v.a = true; v.ax = Math.sign(dx); } else { v.ay = 1; if (P.y > NC.BOT) { v.a = true; v.ax = Math.sign(dx); } } return; }
      v.ay = ty < P.y - 6 ? -1 : ty > P.y + 6 ? 1 : 0; return; }
    if (P.st === 'air') { v.ax = Math.sign(tx - P.x) * 0.8; v.ay = ground ? 0 : -1; return; }
    // on the ground: walk to the right island, jump gaps, then climb
    const dx = tx - P.x, myI = NC.islandAt(P.x), tI = NC.islandAt(clamp(tx, 30, 1250)) || NC.ISL.slice().sort((p, q) => Math.abs((p[0] + p[1]) / 2 - tx) - Math.abs((q[0] + q[1]) / 2 - tx))[0];
    if (!myI) { v.ax = Math.sign(dx); return; }
    if (myI !== tI) { const dir = Math.sign(dx), edge = dir > 0 ? myI[1] : myI[0], toEdge = (edge - P.x) * dir; // run up, then leap the gap at full speed
      if (toEdge < 70 && P.vx * dir < 170) { v.ax = toEdge < 30 ? -dir : dir; if (toEdge < 30) return; } else v.ax = dir;
      if (toEdge < 34 && P.vx * dir > 170) v.a = true; return; }
    if (ground) { v.ax = Math.abs(dx) > 8 ? Math.sign(dx) : 0; if (Math.abs(dx) < 16) v.ay = -1; return; }
    const r = NC.ROPES.slice().sort((a, b) => Math.abs(a - tx) - Math.abs(b - tx))[0]; const rd = r - P.x;
    if (Math.abs(rd) > 12) { v.ax = Math.sign(rd); return; }
    v.ay = -1;
  },
  score(m, S) { return [0, 1, 2, 3].map(i => S.who.includes(i) ? S.wins[i] : -1); },
  fmt(s) { return s < 0 ? 'watching' : `${s} round${s === 1 ? '' : 's'}`; },
  hud(m, S, i) { return S.who.includes(i) ? `⭐${S.wins[i]} · ${S.p[i].tot} ${S.p[i].op}` : '👀 watching'; },
  // ---------------------------------------------------------------- art
  climber(g, m, S, i, P) {
    const p = m.players[i], t = m.t, r = 22;
    if (P.fall > 0) { // flail into the water, then a head bobbing as they swim back
      const k = 1 - P.fall / 1.3; if (k < 0.35) { g.save(); g.translate(P.x, Math.min(650, P.y - 28 + k * 200)); g.rotate(Math.sin(t * 30) * 0.4); Char.draw(g, 0, 0, r, p.el.id, p.color, { mood: 'shock', seed: i * 1.7, noShadow: true, hands: { n: { x: -1.2, y: -1.3 + Math.sin(t * 30) * 0.3, d: -120, o: true, m: false }, f: { x: 1.2, y: -1.3 - Math.sin(t * 30) * 0.3, d: -60, o: true, m: false } } }); g.restore(); }
      else { Char.draw(g, P.x + (k - 0.35) * 60 * (P.face || 1), 652 + Math.sin(t * 6) * 3, 16, p.el.id, p.color, { headOnly: true, mood: 'sad', seed: i * 1.7, noShadow: true }); g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 2; g.beginPath(); g.ellipse(P.x + (k - 0.35) * 60 * (P.face || 1), 664, 22, 5, 0, 0, 7); g.stroke(); }
      return; }
    if (P.st === 'rope') { // hand over hand: arms take turns reaching up, feet hug the vine
      const ph = Math.sin(P.clim), ph2 = Math.cos(P.clim);
      Char.draw(g, P.x - 4, P.y - 30, r, p.el.id, p.color, { mood: MGH.persona('determined', p.el.id), seed: i * 1.7, noShadow: true, look: { x: P.face, y: -0.4 }, hands: { n: { x: 0.25, y: -1.45 + ph * 0.3, d: -90, o: false, m: true }, f: { x: 0.3, y: -0.95 - ph * 0.3, d: -90, o: false, m: false } }, feet: [{ x: 0.15, lift: 0.15 + ph2 * 0.1, tip: 0.4 }, { x: 0.3, lift: 0.3 - ph2 * 0.1, tip: 0.4 }] });
      return; }
    const air = P.st === 'air';
    Char.draw(g, P.x, P.y - 28, r, p.el.id, p.color, { mood: MGH.persona(air ? 'cheer' : 'happy', p.el.id), seed: i * 1.7, look: { x: P.face, y: 0 }, walk: !air && Math.abs(P.vx) > 30 ? 1 : 0, hands: air ? { n: { x: -0.4, y: -1.5, d: -90, o: true, m: true }, f: { x: 1.0, y: -0.9, d: -40, o: true, m: false } } : undefined });
  },
  draw(m, S, g) {
    const t = m.t;
    // sunset lagoon
    GX.vfill(g, 0, 0, 1280, 620, ['#ff9a6a', '#ffc88a', '#a8d8f0']);
    MGH.glow(g, 640, 560, 380, 'rgba(255,220,150,0.45)'); g.fillStyle = '#fff2c0'; g.beginPath(); g.arc(640, 560, 60, Math.PI, 0); g.fill();
    for (let k = 0; k < 7; k++) { const x = (k * 230 + t * 6) % 1500 - 100; MGH.cloud(g, x, 200 + (k % 3) * 40, 24, 'rgba(255,240,230,0.6)'); }
    // jungle canopy frame at the top (vines hang from it)
    for (let k = 0; k < 18; k++) GX.canopy(g, k * 76, 92 + (k % 2) * 16, 66, k % 3 ? '#2f7a3a' : '#3f8a3a', k, t);
    g.fillStyle = '#5a3a1e'; MGH.rr(g, 520, 112, 240, 22, 10); g.fill(); g.fillStyle = 'rgba(255,255,255,0.15)'; g.fillRect(524, 114, 232, 4);
    // the host on the branch with the target sign
    Char.npc(g, 600, 86, 24, 'host', { mood: S.ph === 'won' ? 'cheer' : 'happy', t, look: { x: 1, y: 0 } });
    const pulse = S.ph === 'show' ? 1 + Math.sin(t * 10) * 0.05 : 1;
    g.save(); g.translate(690, 72); g.scale(pulse, pulse); g.strokeStyle = '#5a3a1e'; g.lineWidth = 4; g.beginPath(); g.moveTo(-34, 30); g.lineTo(-20, 0); g.stroke();
    g.fillStyle = '#fffaf0'; MGH.rr(g, -10, -30, 100, 60, 10); g.fill(); g.strokeStyle = '#c8a060'; g.lineWidth = 4; g.stroke(); MGH.text(g, String(S.target), 40, 14, 38, S.target < 0 ? '#e8323e' : '#2a1a10', 'center', 'bold'); g.restore();
    MGH.label(g, `Round ${S.round + 1} / 5`, 640, 152, 16, '#fff');
    // water with waves and reflections
    GX.vfill(g, 0, 610, 1280, 110, ['#3a9ad8', '#1a5aa0']);
    for (let k = 0; k < 18; k++) { const x = (k * 97 + t * 30) % 1320 - 20; g.strokeStyle = 'rgba(255,255,255,0.4)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, 624 + (k % 3) * 14); g.quadraticCurveTo(x + 12, 618 + (k % 3) * 14, x + 24, 624 + (k % 3) * 14); g.stroke(); }
    // islands
    NC.ISL.forEach(([a, b]) => { const sg = g.createLinearGradient(0, NC.GY, 0, NC.GY + 50); sg.addColorStop(0, '#e8c888'); sg.addColorStop(1, '#a8804a'); g.fillStyle = sg; g.beginPath(); g.moveTo(a - 10, NC.GY + 40); g.quadraticCurveTo(a, NC.GY - 2, a + 20, NC.GY); g.lineTo(b - 20, NC.GY); g.quadraticCurveTo(b, NC.GY - 2, b + 10, NC.GY + 40); g.fill(); g.fillStyle = '#5ab83a'; MGH.rr(g, a + 4, NC.GY - 8, b - a - 8, 12, 6); g.fill(); for (let x = a + 12; x < b - 12; x += 18) { g.strokeStyle = '#3a8a2a'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, NC.GY - 6); g.lineTo(x - 2, NC.GY - 14); g.stroke(); } });
    // operator stones
    NC.OPS.forEach(o => { const used = S.who.some(i => S.p[i].op === o.o); g.fillStyle = '#7a7a88'; MGH.rr(g, o.x - 24, NC.GY - 46, 48, 46, 10); g.fill(); g.fillStyle = '#9a9aa8'; MGH.rr(g, o.x - 24, NC.GY - 46, 48, 10, 6); g.fill(); MGH.glow(g, o.x, NC.GY - 24, 34, used ? 'rgba(120,230,255,0.5)' : 'rgba(255,230,120,0.25)'); MGH.text(g, o.o, o.x, NC.GY - 12, 34, '#fff', 'center', 'bold'); });
    // vines with leaves, gently swaying
    NC.ROPES.forEach((rx, r) => { const sw = Math.sin(t * 1.3 + r) * 4; g.strokeStyle = '#3a7a2a'; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(rx, NC.TOP - 30); g.quadraticCurveTo(rx + sw, (NC.TOP + NC.BOT) / 2, rx + sw * 0.5, NC.BOT + 40); g.stroke(); g.strokeStyle = '#5aa83a'; g.lineWidth = 2; g.stroke(); g.lineCap = 'butt'; for (let y = NC.TOP; y < NC.BOT + 30; y += 34) { g.fillStyle = '#4a9a3a'; g.beginPath(); g.ellipse(rx + sw * (y - NC.TOP) / 400 + ((y / 34) % 2 ? 7 : -7), y, 7, 3.5, (y / 34) % 2 ? 0.5 : -0.5, 0, 7); g.fill(); } });
    // hanging number tags (wooden discs on a string)
    S.tags.forEach(tg => { if (tg.t > 0) { const k = 1 - tg.t / 2.2; if (k > 0.75) { g.globalAlpha = (k - 0.75) * 4; } else return; } const sw = Math.sin(tg.sw * 2) * 3, x = tg.x + 18 + sw, y = tg.y; g.strokeStyle = '#c8a878'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(tg.x + 2, y - 22); g.lineTo(x, y - 14); g.stroke(); const wg = g.createRadialGradient(x - 4, y - 4, 2, x, y, 16); wg.addColorStop(0, '#f4d498'); wg.addColorStop(1, '#b8844a'); g.fillStyle = wg; g.beginPath(); g.arc(x, y, 15, 0, 7); g.fill(); g.strokeStyle = '#7a4e26'; g.lineWidth = 2; g.stroke(); MGH.text(g, String(tg.v), x, y + 7, 20, '#3a2010', 'center', 'bold'); g.globalAlpha = 1; });
    // climbers
    S.who.forEach(i => this.climber(g, m, S, i, S.p[i]));
    S.fx.forEach(f => { if (f.k === 'splash') { const k = f.t / 1.2; for (let q = 0; q < 8; q++) { const a = -Math.PI / 2 + (q - 3.5) * 0.3; g.fillStyle = `rgba(220,245,255,${1 - k})`; g.beginPath(); g.arc(f.x + Math.cos(a) * k * 60, 640 + Math.sin(a) * k * 50 + k * k * 60, 4, 0, 7); g.fill(); } g.strokeStyle = `rgba(255,255,255,${1 - k})`; g.lineWidth = 3; g.beginPath(); g.ellipse(f.x, 646, 10 + k * 50, 3 + k * 8, 0, 0, 7); g.stroke(); }
      else { const k = f.t / 1.2; MGH.text(g, String(f.v), f.x + 18, f.y - k * 60, 26, f.c, 'center', 'bold'); } });
    // personal chalkboards: total and current operation
    S.who.forEach((i, k) => { const p = m.players[i], P = S.p[i], n = S.who.length, x = n === 2 ? (k ? 1080 : 200) : [140, 340, 940, 1140][k], y = 84;
      g.fillStyle = '#2a3a2a'; MGH.rr(g, x - 92, y - 34, 184, 66, 10); g.fill(); g.strokeStyle = '#8a6a3a'; g.lineWidth = 5; g.stroke();
      MGH.text(g, p.name, x, y - 14, 15, p.color, 'center', 'bold'); MGH.text(g, `${P.tot}`, x - 20, y + 22, 30, P.tot === S.target ? '#9fffa0' : '#f4f4e8', 'center', 'bold'); MGH.text(g, P.op, x + 52, y + 22, 26, '#ffe680', 'center', 'bold');
      for (let q = 0; q < S.wins[i]; q++) MGH.star(g, x - 80 + q * 16, y - 26, 6, '#ffe680', 0, false);
      if (P.lastT > 0) MGH.label(g, P.last, P.x, P.y - 92, 15, m.players[i].color); });
    if (S.ph === 'show') MGH.label(g, S.round === 4 ? `Negative round! Make ${S.target}` : `Make ${S.target}!`, 640, 360, 36, '#ffe680');
    if (S.ph === 'won' && S.winner >= 0) MGH.label(g, `${m.players[S.winner].name} ${S.timeUp ? 'was closest' : `made ${S.target}`}! ⭐`, 640, 360, 34, m.players[S.winner].color);
  },
}, spec));

ncDef({ id: 'numclimb', name: 'Number Climb', mode: 'duel',
  how: 'A maths duel in the jungle! The host holds up a TARGET number. Climb the vines and grab the hanging numbers 1–9 — each one is applied to your total using your current sign. Change your sign at the + − × ÷ stones down by the water (stand at one and press UP) (÷ only works when it divides evenly). Hit the target EXACTLY to win the round! Grabbed numbers grow back as new ones. Five rounds: easy sums, times, mixed, big numbers — and finally a NEGATIVE target. Fall in the water and you swim back.',
  who(m) { return DU.pair(m); } });
ncDef({ id: 'numclimb4', name: 'Number Climb Party', type: 'Wits',
  how: 'Everyone climbs at once! The host holds up a TARGET number. Climb the vines and grab hanging numbers 1–9 — each is applied to your total with your current sign. Stand at a + − × ÷ stone by the water and press UP to change sign (÷ only when it divides evenly). First to hit the target EXACTLY wins the round. Five rounds getting harder, ending with a NEGATIVE target. Bump rivals off your vine and mind the water!',
  who() { return [0, 1, 2, 3]; } });
