'use strict';
// DUELS (part 2): Slugger Showdown, Quick Draw Pie, Sea Battle, Cannon Duel, Mirror Mirror

// a bat held in a gloved hand: pivot at the hand, angle in radians
function duBat(g, x, y, ang, len = 62, gloveCol = '#fff') {
  g.save(); g.translate(x, y); g.rotate(ang);
  const bg = g.createLinearGradient(0, -6, 0, 6); bg.addColorStop(0, '#f0c890'); bg.addColorStop(1, '#a8743a');
  g.fillStyle = bg; g.beginPath(); g.moveTo(-6, -3); g.lineTo(len * 0.55, -5); g.quadraticCurveTo(len, -8, len, 0); g.quadraticCurveTo(len, 8, len * 0.55, 5); g.lineTo(-6, 3); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(90,50,20,0.6)'; g.lineWidth = 1.2; g.stroke(); g.fillStyle = '#3a2a2a'; g.fillRect(-8, -3.5, 10, 7);
  g.fillStyle = gloveCol; g.beginPath(); g.arc(0, 0, 8, 0, 7); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 1.5; g.stroke();
  g.restore();
}

// ===================================================================== SLUGGER SHOWDOWN (same pitches to both — longest total wins)
MG.def({
  id: 'slugger', name: 'Slugger Showdown', type: 'Duel', mode: 'duel', controls: '1 button', dur: 0, sport: true,
  rows: [['a', 'Swing!']],
  how: 'Batter up! The pitching robot throws the SAME ten pitches to both of you. Press A to swing just as the ball reaches the plate — perfect timing sends it flying for a HOME RUN. Fast balls fly further, slow curve balls trick you, and watch out for the black BOMB balls: let those go past or they blow up in your face (minus distance)! Longest total distance wins.',
  wins: 'Longest total distance after 10 pitches.',
  init(m, S) {
    S.d = DU.pair(m); S.k = -1; S.pt = 0; S.dist = [0, 0]; S.side = [0, 1].map(() => ({ sw: -1, res: null, ball: null, fly: null, boom: 0, last: '' }));
    S.list = []; for (let k = 0; k < 10; k++) { const r = Math.random(); S.list.push(r < 0.18 && k > 1 ? { kind: 'bomb', T: R.range(0.7, 0.9) } : r < 0.45 ? { kind: 'fast', T: R.range(0.45, 0.55) } : r < 0.7 ? { kind: 'curve', T: R.range(0.8, 1.0) } : { kind: 'normal', T: R.range(0.6, 0.72) }); }
    this.next(S);
  },
  next(S) { S.k++; S.pt = 0; S.ph = 'wind'; S.side.forEach(sd => { sd.sw = -1; sd.res = null; sd.fly = null; }); },
  update(m, S, dt) {
    S.pt += dt; const P = S.list[S.k];
    S.side.forEach((sd, j) => { const i = S.d[j]; if (sd.sw >= 0) sd.sw += dt; sd.boom -= dt; if (sd.fly) { sd.fly.t += dt; }
      if ((S.ph === 'wind' || S.ph === 'pitch') && sd.sw < 0 && !sd.res && m.pressed(i, 'a')) { sd.sw = 0; if (!m.bot(i)) Sfx.whoosh(false);
        const arrive = 0.9 + P.T, e = S.pt - arrive;
        if (S.ph === 'pitch' && Math.abs(e) < 0.13) { if (P.kind === 'bomb') { sd.res = 'boom'; sd.boom = 1; S.dist[j] = Math.max(0, S.dist[j] - 30); sd.last = 'BOOM! −30 m'; Sfx.boom(); }
          else { const q = 1 - Math.abs(e) / 0.13, d = Math.round(18 + q * 100 + (P.kind === 'fast' ? 18 : 0)); sd.res = 'hit'; sd.fly = { d, t: 0, up: 0.5 + q * 0.6, dir: e < 0 ? -0.2 : 0.2 }; S.dist[j] += d; sd.last = d >= 110 ? `HOME RUN! ${d} m` : `${d} m`; Sfx.coin(); } }
        else { sd.res = 'miss'; sd.last = 'swing and a miss!'; } } });
    if (S.ph === 'wind' && S.pt > 0.9) { S.ph = 'pitch'; Sfx.tone(300, 0.08, 'square', 0.03, -100); }
    if (S.ph === 'pitch' && S.pt > 0.9 + P.T + 0.2) { S.side.forEach(sd => { if (!sd.res) { sd.res = 'pass'; sd.last = P.kind === 'bomb' ? 'good eye — bomb dodged!' : 'strike!'; } }); S.ph = 'after'; S.pt2 = 0; }
    if (S.ph === 'after') { S.pt2 += dt; if (S.pt2 > 1.6) { if (S.k >= 9) m.finish(this.score(m, S)); else this.next(S); } }
  },
  bot(m, S, i) {
    const v = m.vin[i]; v.a = false; const j = S.d.indexOf(i); if (j < 0 || !S.list[S.k]) return; const sd = S.side[j], P = S.list[S.k]; if (sd.sw >= 0 || sd.res) return;
    if (P.kind === 'bomb' && Math.random() < 0.85) return; sd.aim = sd.aim === undefined ? 0.9 + P.T + R.range(-0.08, 0.08) : sd.aim; if (S.pt >= sd.aim) { v.a = true; sd.aim = undefined; }
  },
  score(m, S) { return DU.scores(m, S.dist[0], S.dist[1]); },
  fmt(s) { return s < 0 ? 'watching' : `${s} m`; },
  hud(m, S, i) { const j = S.d.indexOf(i); return j < 0 ? '👀 watching' : `⚾ ${S.dist[j]} m`; },
  draw(m, S, g) {
    const t = m.t, P = S.list[Math.max(0, S.k)];
    S.d.forEach((i, j) => {
      const ox = j * 640, p = m.players[i], sd = S.side[j];
      g.save(); g.beginPath(); g.rect(ox, 40, 640, 680); g.clip(); g.translate(ox, 0);
      // stadium: night sky, lights, stands, grass and dirt
      GX.vfill(g, 0, 40, 640, 300, ['#1a2a5a', '#3a5a9a']); MGH.crowd(g, t, 250, 18);
      [[80, 70], [560, 70]].forEach(([x, y]) => { g.fillStyle = '#4a4a5a'; g.fillRect(x - 3, y, 6, 150); MGH.glow(g, x, y, 110, 'rgba(255,250,210,0.35)'); g.fillStyle = '#fffbe0'; MGH.rr(g, x - 22, y - 8, 44, 16, 4); g.fill(); });
      for (let k = 0; k < 8; k++) { g.fillStyle = k % 2 ? '#3c9c40' : '#45aa48'; g.fillRect(0, 330 + k * 50, 640, 50); }
      g.fillStyle = '#c8945a'; g.beginPath(); g.ellipse(170, 600, 150, 46, 0, 0, 7); g.fill(); g.fillStyle = '#c8945a'; g.beginPath(); g.ellipse(520, 590, 60, 20, 0, 0, 7); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.moveTo(150, 600); g.lineTo(170, 590); g.lineTo(190, 600); g.lineTo(190, 608); g.lineTo(150, 608); g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 3; g.beginPath(); g.moveTo(170, 600); g.lineTo(640, 360); g.stroke();
      // pitching robot
      const wind = S.ph === 'wind' ? Math.min(1, S.pt / 0.9) : 0;
      g.save(); g.translate(520, 560); g.fillStyle = '#8a92a8'; MGH.rr(g, -24, -70, 48, 70, 10); g.fill(); g.fillStyle = '#5a6278'; g.fillRect(-28, -6, 56, 10); g.fillStyle = '#b8c0d8'; MGH.rr(g, -18, -98, 36, 30, 8); g.fill(); g.fillStyle = '#ff5a5a'; g.beginPath(); g.arc(-7, -84, 4, 0, 7); g.arc(7, -84, 4, 0, 7); g.fill();
      g.save(); g.translate(18, -56); g.rotate(-0.4 - wind * 2.2 + (S.ph === 'pitch' && S.pt < 1.1 ? 2.6 : 0)); g.fillStyle = '#6a7290'; MGH.rr(g, -5, -4, 40, 9, 4); g.fill(); g.restore(); g.restore();
      // the ball (shared pitch timing, same for both sides)
      if (S.ph === 'pitch' && !(sd.res === 'hit' || sd.res === 'boom')) { const k = clamp((S.pt - 0.9) / P.T, 0, 1.3), bx = 520 - (520 - 180) * k, by = 500 + (P.kind === 'curve' ? Math.sin(k * Math.PI) * 30 : -Math.sin(k * Math.PI) * 18) + k * 30;
        if (P.kind === 'bomb') { g.fillStyle = '#1a1a1a'; g.beginPath(); g.arc(bx, by, 11, 0, 7); g.fill(); g.strokeStyle = '#c8a060'; g.lineWidth = 2; g.beginPath(); g.moveTo(bx + 6, by - 8); g.lineTo(bx + 10, by - 16); g.stroke(); MGH.glow(g, bx + 10, by - 17, 10, 'rgba(255,170,60,0.9)'); }
        else { for (let q = 1; q <= 3; q++) { g.fillStyle = `rgba(255,255,255,${0.25 - q * 0.06})`; g.beginPath(); g.arc(bx + q * 12, by, 9, 0, 7); g.fill(); } g.fillStyle = '#fffaf0'; g.beginPath(); g.arc(bx, by, 9, 0, 7); g.fill(); g.strokeStyle = '#e8323e'; g.lineWidth = 1.5; g.beginPath(); g.arc(bx - 4, by, 6, -1, 1); g.arc(bx + 4, by, 6, 2.1, 4.2); g.stroke(); } }
      // a hit ball soaring out
      if (sd.fly) { const f = sd.fly, k = Math.min(1, f.t / 1.4), x = 190 + k * 520, y = 520 - Math.sin(k * Math.PI) * 300 * f.up - k * 120; g.fillStyle = '#fffaf0'; g.beginPath(); g.arc(x, y, 9 - k * 4, 0, 7); g.fill(); for (let q = 1; q <= 5; q++) { g.fillStyle = `rgba(255,255,255,${0.3 - q * 0.05})`; g.beginPath(); g.arc(x - q * 14, y + q * 6 * (1 - 2 * k), 6, 0, 7); g.fill(); } if (f.d >= 110 && f.t > 1.2) for (let q = 0; q < 8; q++) { const a = q / 8 * 6.28; MGH.star(g, 520 + Math.cos(a) * (f.t - 1.2) * 120, 160 + Math.sin(a) * (f.t - 1.2) * 90, 6, ['#ffe680', '#ff8ac8', '#8ae0ff'][q % 3], a, false); } }
      if (sd.boom > 0) { MGH.glow(g, 190, 510, 90 * sd.boom, 'rgba(255,140,40,0.8)'); for (let q = 0; q < 6; q++) { g.fillStyle = `rgba(80,80,80,${sd.boom * 0.6})`; g.beginPath(); g.arc(190 + Math.cos(q) * 40 * (1 - sd.boom), 500 - q * 8 * (1 - sd.boom), 20, 0, 7); g.fill(); } }
      // the batter, bat gripped in the gloves: ready wiggle, then a full swing
      const sw = sd.sw >= 0 ? Math.min(1, sd.sw / 0.22) : 0, ready = Math.sin(t * 4 + j) * 0.08, batA = -2.4 + ready + sw * 2.85, hx = 0.35 + sw * 0.55, hy = 0.42 - sw * 0.08;
      Char.draw(g, 150, 530, 34, p.el.id, p.color, { mood: MGH.persona(sd.res === 'boom' ? 'hurt' : sd.res === 'hit' ? 'cheer' : sd.res === 'miss' ? 'sad' : 'determined', p.el.id), seed: i * 1.7, look: { x: 1, y: 0 }, hands: { n: { x: hx, y: hy, d: 0, o: false, m: true }, f: { x: hx - 0.08, y: hy + 0.1, d: 0, o: false, m: false } } });
      const C = CLAN[p.el.id] || {}; duBat(g, 150 + hx * 44, 530 + hy * 44, batA, 64, C.glove || '#fff');
      // scoreboard
      g.fillStyle = 'rgba(10,14,30,0.75)'; MGH.rr(g, 20, 52, 240, 64, 12); g.fill(); g.strokeStyle = p.color; g.lineWidth = 3; g.stroke(); MGH.text(g, p.name, 140, 76, 18, p.color, 'center', 'bold'); MGH.text(g, `${S.dist[j]} m`, 140, 104, 24, '#ffe680', 'center', 'bold');
      if (sd.res && sd.last) MGH.label(g, sd.last, 320, 200, 24, sd.res === 'hit' ? '#ffe680' : sd.res === 'boom' ? '#ff8a6a' : '#fff');
      g.restore();
    });
    g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(638, 40, 4, 680);
    MGH.label(g, `Pitch ${Math.min(10, S.k + 1)} / 10${P && P.kind !== 'normal' && S.ph !== 'wind' ? '' : ''}`, 640, 70, 18, '#fff');
  },
});

// ===================================================================== QUICK DRAW PIE (wait for "PIE!", ignore the fakes)
MG.def({
  id: 'qdpie', name: 'Quick Draw Pie', type: 'Duel', mode: 'duel', controls: '1 button', dur: 0,
  rows: [['a', 'Throw your pie!']],
  how: 'Sit face to face with a cream pie in hand. The host will shout a word — when it\'s PIE!, press A first to splat your rival right in the face! But careful: PIZZA!, PINE!, PIGEON!… if you throw on a fake (or too early), YOU get the pie instead. First to three splats wins.',
  wins: 'First to 3 splats.',
  init(m, S) { S.d = DU.pair(m); S.pts = [0, 0]; S.round = 0; this.next(S); },
  next(S) { S.round++; S.ph = 'wait'; S.pt = 0; S.at = R.range(1.6, 3.6); S.words = []; let t = S.at; const n = Math.random() < 0.6 ? R.int(1, 2) : 0; for (let k = 0; k < n; k++) { S.words.push({ t, w: R.pick(['PIZZA!', 'PINE!', 'PIGEON!', 'PICKLE!', 'PIRATE!']), fake: true }); t += R.range(1.1, 1.9); } S.words.push({ t, w: 'PIE!', fake: false }); S.cur = null; S.win = -1; S.splat = -1; S.fly = 0; S.bt = [R.range(0.2, 0.42), R.range(0.2, 0.42)]; S.bfake = [Math.random() < 0.08, Math.random() < 0.08]; },
  update(m, S, dt) {
    S.pt += dt;
    if (S.ph === 'wait') {
      const w = S.words.filter(w => S.pt >= w.t).pop(); if (w !== S.cur && w) { S.cur = w; S.curT = 0; Sfx.tone(w.fake ? 400 : 880, 0.15, 'square', 0.05); } if (S.cur) S.curT += dt; if (S.cur && S.cur.fake && S.curT > 0.9) S.cur = null;
      S.d.forEach((i, j) => { if (S.ph !== 'wait' || !m.pressed(i, 'a')) return; if (S.cur && !S.cur.fake) { S.win = j; S.splat = 1 - j; } else { S.win = 1 - j; S.splat = j; S.early = true; } S.ph = 'throw'; S.pt = 0; Sfx.whoosh(false); });
      if (S.ph === 'wait' && S.cur && !S.cur.fake && S.curT > 3) { S.ph = 'throw'; S.pt = 0; S.win = -1; }
      return;
    }
    if (S.ph === 'throw') { S.fly = Math.min(1, S.pt / 0.35); if (S.pt > 0.35 && !S.hitDone) { S.hitDone = true; if (S.win >= 0) { S.pts[S.win]++; Sfx.thud(); MGH.burst(S.splat ? 940 : 340, 380, ['#fffaf0', '#ffe0f0'], 24, { speed: 260 }); } } if (S.pt > 2.4) { S.hitDone = false; S.early = false; if (S.pts.some(p => p >= 3)) m.finish(this.score(m, S)); else this.next(S); } }
  },
  bot(m, S, i) {
    const v = m.vin[i], j = S.d.indexOf(i); v.a = false; if (j < 0 || S.ph !== 'wait' || !S.cur) return;
    if (S.cur.fake) { if (S.bfake[j] && S.curT > 0.3) { v.a = true; S.bfake[j] = false; } return; }
    if (S.curT > S.bt[j]) v.a = true;
  },
  score(m, S) { return DU.scores(m, S.pts[0], S.pts[1]); },
  fmt(s) { return s < 0 ? 'watching' : `${s} splat${s === 1 ? '' : 's'}`; },
  hud(m, S, i) { const j = S.d.indexOf(i); return j < 0 ? '👀 watching' : `🥧 ${S.pts[j]}`; },
  pie(g, x, y, s) { g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = '#c8904a'; g.beginPath(); g.ellipse(0, 6, 30, 10, 0, 0, 7); g.fill(); g.fillStyle = '#fffaf2'; g.beginPath(); g.ellipse(0, 0, 28, 10, 0, 0, 7); g.fill(); for (let k = -2; k <= 2; k++) { g.beginPath(); g.arc(k * 10, -4, 7, Math.PI, 0); g.fill(); } g.fillStyle = '#e8323e'; g.beginPath(); g.arc(0, -10, 5, 0, 7); g.fill(); g.restore(); },
  draw(m, S, g) {
    const t = m.t;
    // cosy saloon: wooden walls, lamps, the table between the duelists
    GX.vfill(g, 0, 40, 1280, 680, ['#5a3a24', '#3a2414']);
    for (let x = 0; x < 1280; x += 64) { g.fillStyle = (x / 64) % 2 ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.03)'; g.fillRect(x, 40, 64, 460); }
    [[300, 120], [980, 120]].forEach(([x, y]) => { g.strokeStyle = '#2a1a10'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, 40); g.lineTo(x, y); g.stroke(); MGH.glow(g, x, y + 16, 140, 'rgba(255,200,120,0.35)'); g.fillStyle = '#ffd890'; g.beginPath(); g.moveTo(x - 22, y + 24); g.lineTo(x + 22, y + 24); g.lineTo(x + 12, y); g.lineTo(x - 12, y); g.fill(); });
    g.fillStyle = '#2a1a10'; g.fillRect(0, 500, 1280, 220);
    const tg = g.createLinearGradient(0, 470, 0, 520); tg.addColorStop(0, '#a8703a'); tg.addColorStop(1, '#6a4020'); g.fillStyle = tg; MGH.rr(g, 220, 470, 840, 40, 10); g.fill(); g.fillStyle = '#5a3418'; g.fillRect(260, 510, 30, 160); g.fillRect(990, 510, 30, 160);
    // host with the word sign
    Char.npc(g, 640, 300, 30, 'host', { mood: S.cur && !S.cur.fake ? 'shock' : 'happy', t });
    if (S.ph === 'wait' && S.cur) { const fake = S.cur.fake, k = Math.min(1, S.curT / 0.12); g.save(); g.translate(640, 190); g.scale(k, k); g.fillStyle = fake ? '#fffaf0' : '#ffe680'; MGH.rr(g, -150, -46, 300, 92, 18); g.fill(); g.strokeStyle = fake ? '#8a6a3a' : '#e8323e'; g.lineWidth = 6; g.stroke(); MGH.text(g, S.cur.w, 0, 18, 52, fake ? '#5a3a20' : '#e8323e', 'center', 'bold'); g.restore(); if (!fake) MGH.glow(g, 640, 190, 200, 'rgba(255,220,100,0.3)'); }
    else if (S.ph === 'wait') MGH.text(g, '…', 640, 200, 60, '#ffe0b0', 'center', 'bold');
    // the two duelists, pies raised
    S.d.forEach((i, j) => {
      const p = m.players[i], x = j ? 960 : 320, f = j ? -1 : 1, thrower = S.ph === 'throw' && ((S.win === j && !S.early) || (S.early && S.win === j));
      const tense = S.ph === 'wait' ? Math.sin(t * 9 + j) * 1.5 : 0, splatted = S.ph === 'throw' && S.splat === j && S.pt > 0.35;
      Char.draw(g, x + tense, 400, 46, p.el.id, p.color, { mood: MGH.persona(splatted ? 'shock' : thrower ? 'cheer' : 'determined', p.el.id), seed: i * 1.7, look: { x: f, y: 0 }, hands: { n: { x: thrower ? 1.3 : 0.9, y: thrower ? -0.6 : -0.9, d: 0, o: true, m: true }, f: { x: 0.4, y: 0.4, d: 0, o: true, m: false } } });
      if (!(thrower && S.fly > 0)) this.pie(g, x + f * 50, 360, 0.9);
      if (splatted) { g.save(); g.globalAlpha = 0.95; g.fillStyle = '#fffaf2'; g.beginPath(); g.ellipse(x + f * 6, 370, 44, 36, 0, 0, 7); g.fill(); for (let q = 0; q < 6; q++) { g.beginPath(); g.ellipse(x + f * 6 + Math.cos(q) * 38, 370 + Math.sin(q) * 30 + (S.pt - 0.35) * 30, 9, 14, 0, 0, 7); g.fill(); } g.fillStyle = '#e8323e'; g.beginPath(); g.arc(x + f * 10, 352, 6, 0, 7); g.fill(); g.restore(); }
      g.fillStyle = 'rgba(0,0,0,0.45)'; MGH.rr(g, x - 110, 600, 220, 50, 25); g.fill(); MGH.text(g, p.name, x, 622, 18, p.color, 'center', 'bold'); for (let q = 0; q < 3; q++) this.pie(g, x - 40 + q * 40, 640, q < S.pts[j] ? 0.45 : 0.3);
    });
    if (S.ph === 'throw' && S.fly > 0 && S.fly < 1 && S.win >= 0) { const from = S.splat ? 370 : 910, to = S.splat ? 966 : 326, x = from + (to - from) * S.fly, y = 360 - Math.sin(S.fly * Math.PI) * 120; g.save(); g.translate(x, y); g.rotate(S.fly * 8); this.pie(g, 0, 0, 0.9); g.restore(); }
    if (S.ph === 'throw' && S.pt > 0.4) MGH.label(g, S.win < 0 ? 'Nobody threw!' : S.early ? `${m.players[S.d[S.splat]].name} jumped the gun!` : `${m.players[S.d[S.win]].name} — SPLAT!`, 640, 110, 28, '#ffe680');
  },
});

// ===================================================================== SEA BATTLE (4×4 grids, secret ABXY placement)
const SB_KEYS = ['Y', 'B', 'A', 'X']; // the number each button stands for: Y=1, B=2, A=3, X=4
MG.def({
  id: 'seabattle', name: 'Sea Battle', type: 'Duel', mode: 'duel', controls: 'A B X Y', dur: 0, noPadSkip: true,
  rows: [['abxy', 'Y=1 · B=2 · A=3 · X=4 — row, then column']],
  how: 'Hide your fleet, then sink theirs! Each of you has a secret 4×4 sea with three ships (3, 2 and 1 long). PLACING (both at once, nothing shows on screen): press a button for the ROW, a button for the COLUMN (Y=1, B=2, A=3, X=4), then B = sideways or A = downwards. FIRING: take turns picking a square the same way — row, then column. Hits explode, misses splash. First to sink all three enemy ships wins!',
  wins: 'Sink the whole enemy fleet.',
  SHIPS: [3, 2, 1],
  init(m, S) { S.d = DU.pair(m); S.ph = 'place'; S.pt = 0; S.f = [0, 1].map(() => ({ cells: [], ship: 0, step: 0, r: -1, c: -1, buzz: 0, done: false, ships: [] })); S.shots = [[], []]; S.turn = R.int(0, 1); S.sel = { r: -1 }; S.anim = null; S.msg = ''; S.msgT = 0; },
  occ(F, r, c) { return F.cells.some(q => q.r === r && q.c === c); },
  tryPlace(F, len, r, c, down) { const cs = []; for (let k = 0; k < len; k++) { const rr = r + (down ? k : 0), cc = c + (down ? 0 : k); if (rr > 3 || cc > 3 || this.occ(F, rr, cc)) return false; cs.push({ r: rr, c: cc }); } F.ships.push(cs); cs.forEach(q => F.cells.push(q)); return true; },
  update(m, S, dt) {
    S.pt += dt; S.msgT -= dt;
    if (S.ph === 'place') {
      S.d.forEach((i, j) => { const F = S.f[j]; F.buzz -= dt; if (F.done) return; const d = abxyPress(m, i); if (d < 0) return; const len = this.SHIPS[F.ship];
        if (F.step === 0) { F.r = d; F.step = 1; } else if (F.step === 1) { F.c = d; if (len === 1) { if (this.tryPlace(F, 1, F.r, F.c, false)) this.shipDone(F); else this.buzz(F); } else F.step = 2; }
        else { if (d !== 1 && d !== 2) return; if (this.tryPlace(F, len, F.r, F.c, d === 2)) this.shipDone(F); else this.buzz(F); }
        if (!m.bot(i)) Sfx.click(); });
      if (S.f.every(F => F.done)) { S.ph = 'fire'; S.pt = 0; Sfx.whistle(); }
      return;
    }
    if (S.ph === 'fire') {
      if (S.anim) { S.anim.t += dt; if (S.anim.t > 1.1) { const A = S.anim; S.anim = null; this.resolve(m, S, A); } return; }
      const sh = S.turn, i = S.d[sh], d = abxyPress(m, i);
      if (S.pt > 14) { const free = []; for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (!S.shots[sh].some(q => q.r === r && q.c === c)) free.push({ r, c }); const q = R.pick(free); S.anim = { sh, r: q.r, c: q.c, t: 0 }; S.sel.r = -1; return; }
      if (d < 0) return; if (!m.bot(i)) Sfx.click();
      if (S.sel.r < 0) S.sel.r = d; else { const r = S.sel.r, c = d; S.sel.r = -1; if (S.shots[sh].some(q => q.r === r && q.c === c)) { S.msg = 'Already shot there!'; S.msgT = 1; return; } S.anim = { sh, r, c, t: 0 }; Sfx.boom(); }
      return;
    }
    if (S.ph === 'end' && S.pt > 3.5) m.finish(this.score(m, S));
  },
  buzz(F) { F.buzz = 0.6; F.step = 0; Sfx.bad(); },
  shipDone(F) { F.ship++; F.step = 0; if (F.ship >= this.SHIPS.length) F.done = true; Sfx.tone(700, 0.08, 'triangle', 0.05); },
  resolve(m, S, A) {
    const foe = S.f[1 - A.sh], hit = this.occ(foe, A.r, A.c); S.shots[A.sh].push({ r: A.r, c: A.c, hit });
    if (hit) { const ship = foe.ships.find(cs => cs.some(q => q.r === A.r && q.c === A.c)), sunk = ship.every(q => S.shots[A.sh].some(s => s.r === q.r && s.c === q.c)); S.msg = sunk ? 'SUNK! 🔥' : 'HIT!'; S.msgT = 1.4; Sfx.thud(); MGH.shake(5);
      if (foe.cells.every(q => S.shots[A.sh].some(s => s.r === q.r && s.c === q.c))) { S.winner = A.sh; S.ph = 'end'; S.pt = 0; Sfx.coin(); return; } }
    else { S.msg = 'Splash — miss'; S.msgT = 1.2; Sfx.noise(0.3, 900, 0.06, 'lowpass'); }
    S.turn = 1 - S.turn; S.pt = 0;
  },
  bot(m, S, i) {
    const j = S.d.indexOf(i); if (j < 0) { abxyBot(m, i, -1); return; } S.bw = S.bw || [0, 0]; S.bw[j] -= 1 / 60; if (S.bw[j] > 0) { abxyBot(m, i, -1); return; } S.bw[j] = R.range(0.35, 0.8);
    if (S.ph === 'place') { const F = S.f[j]; if (F.done) return abxyBot(m, i, -1); if (F.step === 0) F.plan = { r: R.int(0, 3), c: R.int(0, 3), down: Math.random() < 0.5 }; if (F.step === 0) return abxyBot(m, i, F.plan.r); if (F.step === 1) return abxyBot(m, i, F.plan.c); return abxyBot(m, i, F.plan.down ? 2 : 1); }
    if (S.ph !== 'fire' || S.turn !== j || S.anim) return abxyBot(m, i, -1);
    if (S.sel.r < 0 || !S.bplan) { const shots = S.shots[j], tried = (r, c) => shots.some(q => q.r === r && q.c === c), hits = shots.filter(q => q.hit), cand = [];
      hits.forEach(h => [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dr, dc]) => { const r = h.r + dr, c = h.c + dc; if (r >= 0 && r < 4 && c >= 0 && c < 4 && !tried(r, c)) cand.push({ r, c }); }));
      if (!cand.length) for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (!tried(r, c) && (r + c) % 2 === 0) cand.push({ r, c });
      if (!cand.length) for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (!tried(r, c)) cand.push({ r, c });
      if (S.sel.r < 0) { S.bplan = R.pick(cand); return abxyBot(m, i, S.bplan.r); } }
    abxyBot(m, i, S.bplan.c); S.bplan = null;
  },
  score(m, S) { return DU.scores(m, S.winner === 0 ? 1 : 0, S.winner === 1 ? 1 : 0); },
  fmt(s) { return s < 0 ? 'watching' : s ? 'WIN' : '—'; },
  hud(m, S, i) { const j = S.d.indexOf(i); if (j < 0) return '👀 watching'; const hits = S.shots[j].filter(q => q.hit).length; return `💥 ${hits}/6`; },
  grid(g, m, S, j, ox, oy) {
    const sz = 92, t = m.t, shooter = 1 - j, shots = S.shots[shooter] || [];
    g.fillStyle = 'rgba(10,30,60,0.5)'; MGH.rr(g, ox - 54, oy - 54, sz * 4 + 80, sz * 4 + 80, 16); g.fill();
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { const x = ox + c * sz, y = oy + r * sz, wg = g.createLinearGradient(0, y, 0, y + sz); wg.addColorStop(0, '#3aa0e0'); wg.addColorStop(1, '#2070b8'); g.fillStyle = wg; g.fillRect(x + 2, y + 2, sz - 4, sz - 4); g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x + 12, y + sz / 2 + Math.sin(t * 2 + r + c) * 3); g.quadraticCurveTo(x + sz / 2, y + sz / 2 - 6, x + sz - 12, y + sz / 2 + Math.sin(t * 2 + r + c) * 3); g.stroke(); }
    for (let k = 0; k < 4; k++) { abxyBadge(g, k, ox - 30, oy + k * sz + sz / 2, 13); abxyBadge(g, k, ox + k * sz + sz / 2, oy - 30, 13); }
    shots.forEach(q => { const x = ox + q.c * sz + sz / 2, y = oy + q.r * sz + sz / 2; if (q.hit) { g.fillStyle = '#5a5a60'; MGH.rr(g, x - 30, y - 12, 60, 24, 8); g.fill(); MGH.flame(g, x, y - 4, 0.3, t, q.r * 4 + q.c); g.fillStyle = 'rgba(60,60,60,0.5)'; g.beginPath(); g.arc(x + 8, y - 34 - Math.sin(t * 2) * 4, 10, 0, 7); g.fill(); } else { g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 3; g.beginPath(); g.arc(x, y, 14, 0, 7); g.stroke(); g.beginPath(); g.arc(x, y, 26 + Math.sin(t * 3) * 3, 0, 7); g.globalAlpha = 0.4; g.stroke(); g.globalAlpha = 1; } });
    if (S.ph === 'end') S.f[j].ships.forEach(cs => { const xs = cs.map(q => q.c), ys = cs.map(q => q.r), x0 = ox + Math.min(...xs) * sz + 10, y0 = oy + Math.min(...ys) * sz + 10, w = (Math.max(...xs) - Math.min(...xs) + 1) * sz - 20, h = (Math.max(...ys) - Math.min(...ys) + 1) * sz - 20; g.fillStyle = 'rgba(200,200,210,0.55)'; MGH.rr(g, x0, y0, w, h, 20); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke(); });
  },
  draw(m, S, g) {
    const t = m.t;
    GX.vfill(g, 0, 40, 1280, 680, ['#0f3a6a', '#1a5a9a', '#0a2a5a']);
    for (let k = 0; k < 30; k++) { g.strokeStyle = 'rgba(255,255,255,0.08)'; g.lineWidth = 2; const y = 60 + (k * 37) % 660, x = (k * 131 + t * 20) % 1400 - 60; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 30, y - 6, x + 60, y); g.stroke(); }
    S.d.forEach((i, j) => { const p = m.players[i], ox = j ? 760 : 130, oy = 230; this.grid(g, m, S, j, ox, oy);
      g.fillStyle = p.color; MGH.rr(g, ox + 40, 110, 290, 44, 22); g.fill(); MGH.text(g, `${p.name}'s sea`, ox + 185, 140, 22, '#fff', 'center', 'bold');
      Char.draw(g, ox + (j ? 410 : -40), 200, 26, p.el.id, p.color, { mood: MGH.persona(S.ph === 'end' ? (S.winner === j ? 'cheer' : 'sad') : S.turn === j && S.ph === 'fire' ? 'determined' : 'happy', p.el.id), seed: i * 1.7, look: { x: j ? -1 : 1, y: 0 } });
      if (S.ph === 'place') { const F = S.f[j]; MGH.label(g, F.done ? '✔ fleet hidden' : `placing ship ${F.ship + 1}/3 · ${['row?', 'column?', 'B sideways · A down'][F.step]}`, ox + 185, 640, 18, F.buzz > 0 ? '#ff8a8a' : '#fff'); } });
    if (S.ph === 'place') MGH.label(g, 'Hide your fleet secretly — Y=1  B=2  A=3  X=4', 640, 80, 22, '#ffe680');
    if (S.ph === 'fire' && !S.anim) { const sh = S.turn, p = m.players[S.d[sh]]; MGH.label(g, `${p.name} fires! ${S.sel.r < 0 ? 'Pick a ROW' : `Row ${S.sel.r + 1} — now a COLUMN`}  ·  ${Math.max(0, 14 - S.pt).toFixed(0)}s`, 640, 80, 22, p.color); }
    if (S.anim) { const A = S.anim, ox = A.sh ? 130 : 760, x = ox + A.c * 92 + 46, y = 230 + A.r * 92 + 46, sx = A.sh ? 1150 : 130, k = Math.min(1, A.t / 0.8), bx = sx + (x - sx) * k, by = 200 + (y - 200) * k - Math.sin(k * Math.PI) * 220; g.fillStyle = '#1a1a1a'; g.beginPath(); g.arc(bx, by, 10, 0, 7); g.fill(); if (k >= 1) MGH.glow(g, x, y, 60 * (1.1 - A.t), 'rgba(255,170,60,0.8)'); }
    if (S.msgT > 0) MGH.label(g, S.msg, 640, 690, 26, S.msg.startsWith('S') && S.msg.includes('SUNK') ? '#ff8a4a' : '#fff');
    if (S.ph === 'end') MGH.label(g, `${m.players[S.d[S.winner]].name} rules the waves!`, 640, 690, 30, '#ffe680');
  },
});

// ===================================================================== CANNON DUEL (aim, power, wind — topple the enemy flag)
MG.def({
  id: 'cannons', name: 'Cannon Duel', type: 'Duel', mode: 'duel', controls: 'Move + hold A', dur: 0,
  rows: [['pad', 'UP/DOWN: aim the barrel'], ['a', 'Hold for power, let go to fire']],
  how: 'Two forts face each other across a valley. Take turns: aim your cannon with UP/DOWN, HOLD A to build power and let go to fire. Watch the WIND flag — it bends every shot! Cannonballs smash the stone blocks of the fort. Hit the enemy FLAG to win. Ten shots each — if nobody hits the flag, the fort with the most stone left wins.',
  wins: 'Hit the enemy flag (or have the most fort left).',
  G: 520,
  init(m, S) {
    S.d = DU.pair(m); S.turn = R.int(0, 1); S.ph = 'aim'; S.pt = 0; S.ball = null; S.shots = [0, 0]; S.winner = -1; S.debris = [];
    S.fort = [0, 1].map(j => { const bx = j ? 1040 : 120, cells = []; for (let c = 0; c < 5; c++) for (let r = 0; r < 6 - Math.abs(c - 2); r++) cells.push({ c, r, hp: 1 }); return { bx, cells, ang: j ? -2.4 : -0.75, pow: 0, hold: -1 }; });
    this.newWind(S);
  },
  newWind(S) { S.wind = R.range(-90, 90); },
  ground(x) { return 600 - Math.max(0, 1 - Math.abs(x - 640) / 300) * 160 * (0.5 + 0.5 * Math.cos((x - 640) / 300 * Math.PI)) ; },
  blockXY(F, b) { return [F.bx + b.c * 26, 600 - 26 - b.r * 26]; },
  flagXY(F) { const top = F.cells.filter(b => b.c === 2 && b.hp > 0).length; return [F.bx + 2 * 26 + 13, 600 - top * 26 - 40]; },
  muzzle(j, F) { const cx = j ? F.bx - 30 : F.bx + 5 * 26 + 30, cy = 588; return [cx + Math.cos(F.ang) * 34, cy + Math.sin(F.ang) * 34, cx, cy]; },
  update(m, S, dt) {
    S.pt += dt; S.debris.forEach(d => { d.vy += 900 * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.r += dt * 6; }); S.debris = S.debris.filter(d => d.y < 760);
    if (S.ph === 'end') { if (S.pt > 3) m.finish(this.score(m, S)); return; }
    const j = S.turn, i = S.d[j], F = S.fort[j];
    if (S.ph === 'aim') {
      const ay = m.axis(i).y; if (Math.abs(ay) > 0.3) { const lo = j ? -Math.PI + 0.15 : -1.45, hi = j ? -Math.PI + 1.45 : -0.15; F.ang = clamp(F.ang + (j ? -ay : ay) * 1.2 * dt, j ? -Math.PI + 0.15 : -1.45, j ? -1.69 : -0.15); }
      if (m.held(i, 'a')) { if (F.hold < 0) F.hold = 0; F.hold += dt; F.pow = 0.5 - 0.5 * Math.cos(F.hold * 2.6); }
      else if (F.hold > 0) { const [mx, my] = this.muzzle(j, F), v = 260 + F.pow * 560; S.ball = { x: mx, y: my, vx: Math.cos(F.ang) * v, vy: Math.sin(F.ang) * v, own: j, t: 0 }; F.hold = -1; S.ph = 'fly'; S.shots[j]++; Sfx.boom(); MGH.shake(4); }
      if (S.pt > 15 && F.hold < 0) { F.hold = 0.6; }
      return;
    }
    if (S.ph === 'fly') {
      const B = S.ball; B.t += dt; B.vx += S.wind * dt; B.vy += this.G * dt; B.x += B.vx * dt; B.y += B.vy * dt;
      const foe = S.fort[1 - B.own], [fx, fy] = this.flagXY(foe);
      let hit = null;
      if (Math.abs(B.x - fx) < 14 && Math.abs(B.y - fy) < 20) hit = 'flag';
      else if (S.fort.some(Fo => Fo.cells.some(b => { if (b.hp <= 0) return false; const [x, y] = this.blockXY(Fo, b); return B.x > x - 4 && B.x < x + 30 && B.y > y - 4 && B.y < y + 30; }))) hit = 'fort';
      else if (B.y > this.ground(B.x) || B.x < -60 || B.x > 1340 || B.y > 740) hit = 'ground';
      if (hit) {
        if (hit === 'flag') { S.winner = B.own; S.ph = 'end'; S.pt = 0; Sfx.coin(); MGH.burst(fx, fy, ['#ffe680', '#fff', '#ff8a4a'], 40, { speed: 320 }); return; }
        S.fort.forEach(Fo => Fo.cells.forEach(b => { if (b.hp <= 0) return; const [x, y] = this.blockXY(Fo, b); if (Math.hypot(x + 13 - B.x, y + 13 - B.y) < 40) { b.hp = 0; for (let q = 0; q < 3; q++) S.debris.push({ x: x + 13, y: y + 13, vx: R.range(-200, 200), vy: R.range(-300, -100), r: 0 }); } }));
        // blocks above a gap settle down
        S.fort.forEach(Fo => { for (let c = 0; c < 5; c++) { const col = Fo.cells.filter(b => b.c === c && b.hp > 0).sort((a, b) => a.r - b.r); col.forEach((b, k) => { b.r = k; }); } });
        MGH.burst(B.x, B.y, ['#ffb13d', '#8a7a6a', '#fff'], 18, { speed: 240 }); Sfx.thud(); MGH.shake(6); S.ball = null;
        if (S.shots[0] >= 10 && S.shots[1] >= 10) { const left = S.fort.map(Fo => Fo.cells.filter(b => b.hp > 0).length); S.winner = left[0] === left[1] ? R.int(0, 1) : left[0] > left[1] ? 0 : 1; S.ph = 'end'; S.pt = 0; return; }
        S.turn = 1 - S.turn; S.ph = 'aim'; S.pt = 0; this.newWind(S);
      }
    }
  },
  bot(m, S, i) {
    const v = m.vin[i], j = S.d.indexOf(i); v.a = false; v.ay = 0; if (j < 0 || S.turn !== j || S.ph !== 'aim') return; const F = S.fort[j];
    if (!S.bplan) { // search angle/power by simulating shots against the flag
      const foe = S.fort[1 - j], [fx, fy] = this.flagXY(foe); let best = null;
      for (let a = 0; a < 24; a++) for (let p = 0; p < 20; p++) { const ang = j ? -Math.PI + 0.2 + a * 0.055 : -0.2 - a * 0.055, pow = p / 19, [mx, my] = this.muzzle(j, Object.assign({}, F, { ang })), vv = 260 + pow * 560; let x = mx, y = my, vx = Math.cos(ang) * vv, vy = Math.sin(ang) * vv, dmin = 1e9;
        for (let k = 0; k < 400; k++) { vx += S.wind / 60; vy += this.G / 60; x += vx / 60; y += vy / 60; const d = Math.hypot(x - fx, y - fy); if (d < dmin) dmin = d; if (y > this.ground(x) || x < -60 || x > 1340) break; }
        if (!best || dmin < best.d) best = { d: dmin, ang, pow }; }
      const miss = Math.max(0.03, 0.14 - S.shots[j] * 0.012); S.bplan = { ang: best.ang + R.range(-miss, miss), pow: clamp(best.pow + R.range(-miss, miss), 0, 1) };
    }
    const da = S.bplan.ang - F.ang; if (Math.abs(da) > 0.03) { v.ay = (j ? -1 : 1) * Math.sign(da); return; }
    if (F.hold < 0 || F.pow < S.bplan.pow - 0.02 || F.hold < 0.1) { v.a = true; if (F.hold > 0 && F.pow >= S.bplan.pow - 0.02 && Math.cos(F.hold * 2.6) < 1) { v.a = false; S.bplan = null; } }
  },
  score(m, S) { return DU.scores(m, S.winner === 0 ? 1 : 0, S.winner === 1 ? 1 : 0); },
  fmt(s) { return s < 0 ? 'watching' : s ? 'WIN' : '—'; },
  hud(m, S, i) { const j = S.d.indexOf(i); return j < 0 ? '👀 watching' : `💣 ${10 - S.shots[j]} left`; },
  draw(m, S, g) {
    const t = m.t;
    GX.vfill(g, 0, 40, 1280, 600, ['#7ab8f0', '#c8e4f8', '#f4e8c8']);
    [[200, 120], [700, 90], [1080, 140]].forEach(([x, y], k) => MGH.cloud(g, (x + t * (S.wind * 0.15)) % 1450 - 80, y, 30));
    g.fillStyle = '#8aa8b8'; g.beginPath(); g.moveTo(0, 600); for (let x = 0; x <= 1280; x += 40) g.lineTo(x, 470 - Math.abs(Math.sin(x * 0.005)) * 90); g.lineTo(1280, 600); g.fill();
    // valley hill
    const hg = g.createLinearGradient(0, 440, 0, 720); hg.addColorStop(0, '#6ab84a'); hg.addColorStop(1, '#3a7a2a'); g.fillStyle = hg; g.beginPath(); g.moveTo(0, 720); for (let x = 0; x <= 1280; x += 10) g.lineTo(x, this.ground(x)); g.lineTo(1280, 720); g.fill();
    g.fillStyle = '#5a3a20'; g.fillRect(0, 600, 1280, 120); g.fillStyle = '#4a9a3a'; g.fillRect(0, 596, 1280, 8);
    // wind flag at the top centre
    const wl = S.wind / 90; g.strokeStyle = '#5a5a60'; g.lineWidth = 3; g.beginPath(); g.moveTo(640, 70); g.lineTo(640, 130); g.stroke(); g.fillStyle = '#e8323e'; g.beginPath(); g.moveTo(640, 72); for (let q = 0; q <= 4; q++) g.lineTo(640 + wl * q * 14, 74 + Math.sin(t * 8 - q) * 3 * Math.abs(wl)); g.lineTo(640 + wl * 56, 92); g.lineTo(640, 94); g.fill(); MGH.label(g, `wind ${S.wind > 0 ? '→' : '←'} ${Math.abs(Math.round(S.wind))}`, 640, 150, 15, '#fff');
    // forts, flags, cannons
    S.fort.forEach((F, j) => {
      const p = m.players[S.d[j]];
      F.cells.forEach(b => { if (b.hp <= 0) return; const [x, y] = this.blockXY(F, b); const sg = g.createLinearGradient(x, y, x, y + 26); sg.addColorStop(0, '#c8c0b0'); sg.addColorStop(1, '#8a8274'); g.fillStyle = sg; g.fillRect(x, y, 25, 25); g.strokeStyle = 'rgba(60,50,40,0.5)'; g.lineWidth = 1.5; g.strokeRect(x + 0.5, y + 0.5, 24, 24); });
      const [fx, fy] = this.flagXY(F); g.strokeStyle = '#4a3a2a'; g.lineWidth = 3; g.beginPath(); g.moveTo(fx, fy + 26); g.lineTo(fx, fy - 26); g.stroke(); g.fillStyle = p.color; g.beginPath(); g.moveTo(fx, fy - 26); g.lineTo(fx + (j ? -1 : 1) * 30, fy - 18 + Math.sin(t * 6) * 2); g.lineTo(fx, fy - 8); g.fill();
      if (S.ph === 'end' && S.winner !== j) { MGH.flame(g, fx, fy, 0.4, t, j); }
      const [mx, my, cx, cy] = this.muzzle(j, F); g.fillStyle = '#5a3a1a'; g.beginPath(); g.arc(cx, cy + 8, 12, 0, 7); g.fill(); g.save(); g.translate(cx, cy); g.rotate(F.ang); const cg = g.createLinearGradient(0, -9, 0, 9); cg.addColorStop(0, '#6a6a78'); cg.addColorStop(1, '#2a2a30'); g.fillStyle = cg; MGH.rr(g, -6, -9, 44, 18, 8); g.fill(); g.restore();
      Char.draw(g, cx + (j ? 34 : -34), cy - 10, 22, p.el.id, p.color, { mood: MGH.persona(S.ph === 'end' ? (S.winner === j ? 'cheer' : 'sad') : S.turn === j ? 'determined' : 'happy', p.el.id), seed: S.d[j] * 1.7, look: { x: j ? -1 : 1, y: 0 } });
      if (S.turn === j && S.ph === 'aim') { g.setLineDash([6, 8]); g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 2; g.beginPath(); g.moveTo(mx, my); g.lineTo(mx + Math.cos(F.ang) * 90, my + Math.sin(F.ang) * 90); g.stroke(); g.setLineDash([]); if (F.hold >= 0) drawPowerBar(g, cx, cy - 70, 100, F.pow); }
      g.fillStyle = 'rgba(0,0,0,0.45)'; MGH.rr(g, (j ? 1060 : 60), 660, 160, 32, 16); g.fill(); MGH.text(g, `${p.name} · ${10 - S.shots[j]} shots`, (j ? 1140 : 140), 682, 15, p.color, 'center', 'bold');
    });
    if (S.ball) { const B = S.ball; g.fillStyle = 'rgba(80,80,80,0.3)'; for (let q = 1; q <= 4; q++) { g.beginPath(); g.arc(B.x - B.vx * 0.02 * q, B.y - B.vy * 0.02 * q, 10 - q * 2, 0, 7); g.fill(); } const bg = g.createRadialGradient(B.x - 3, B.y - 3, 1, B.x, B.y, 10); bg.addColorStop(0, '#8a8a90'); bg.addColorStop(1, '#111'); g.fillStyle = bg; g.beginPath(); g.arc(B.x, B.y, 9, 0, 7); g.fill(); }
    S.debris.forEach(d => { g.save(); g.translate(d.x, d.y); g.rotate(d.r); g.fillStyle = '#9a9284'; g.fillRect(-5, -5, 10, 10); g.restore(); });
    if (S.ph === 'aim') MGH.label(g, `${m.players[S.d[S.turn]].name}'s shot`, 640, 200, 22, m.players[S.d[S.turn]].color);
    if (S.ph === 'end') MGH.label(g, `${m.players[S.d[S.winner]].name} wins the siege!`, 640, 260, 32, '#ffe680');
  },
});

// ===================================================================== MIRROR MIRROR (dance chain: repeat it all, then add a move)
const MM_MOVES = [{ k: 'Y', n: 'Star jump' }, { k: 'B', n: 'Spin' }, { k: 'A', n: 'Clap!' }, { k: 'X', n: 'Pose' }];
MG.def({
  id: 'mirror', name: 'Mirror Mirror', type: 'Duel', mode: 'duel', controls: 'A B X Y', dur: 0, noPadSkip: true,
  rows: [['abxy', 'Y star jump · B spin · A clap · X pose']],
  how: 'A dance-off under the spotlight! Each button is a dance move: Y = star jump, B = spin, A = clap, X = pose. Take turns: repeat the WHOLE dance so far, in order, then add ONE new move of your own. The dance keeps growing — first dancer to slip up loses the round. Best of three rounds.',
  wins: 'Best of 3 rounds.',
  init(m, S) { S.d = DU.pair(m); S.wins = [0, 0]; S.round = 0; this.newRound(S); },
  newRound(S) { S.round++; S.chain = []; S.turn = (S.round + 1) % 2; S.k = 0; S.ph = 'turn'; S.pt = 0; S.move = null; S.last = null; S.loser = -1; },
  update(m, S, dt) {
    S.pt += dt; if (S.move) { S.move.t += dt; if (S.move.t > 0.55) S.move = null; }
    if (S.ph === 'oops') { if (S.pt > 2.4) { if (S.wins.some(w => w >= 2)) m.finish(this.score(m, S)); else this.newRound(S); } return; }
    if (S.ph === 'added') { if (S.pt > 0.9) { S.turn = 1 - S.turn; S.k = 0; S.ph = 'turn'; S.pt = 0; } return; }
    const i = S.d[S.turn]; if (S.pt > 4) { this.oops(S); return; }
    if (S.move) return; const d = abxyPress(m, i); if (d < 0) return;
    S.move = { d, t: 0, who: S.turn }; S.pt = 0; Sfx.tone([660, 784, 523, 880][d], 0.12, 'triangle', 0.06);
    if (S.k < S.chain.length) { if (S.chain[S.k] !== d) { this.oops(S); return; } S.k++; }
    else { S.chain.push(d); S.last = d; S.ph = 'added'; S.pt = 0; Sfx.coin(); }
  },
  oops(S) { S.loser = S.turn; S.wins[1 - S.turn]++; S.ph = 'oops'; S.pt = 0; Sfx.bad(); },
  bot(m, S, i) {
    const j = S.d.indexOf(i); if (j < 0 || S.turn !== j || S.ph !== 'turn' || S.move) { abxyBot(m, i, -1); return; }
    S.bw = (S.bw || 0) - 1 / 60; if (S.bw > 0) { abxyBot(m, i, -1); return; } S.bw = R.range(0.35, 0.7);
    if (S.k < S.chain.length) { const slip = Math.random() < 0.012 * S.chain.length; abxyBot(m, i, slip ? (S.chain[S.k] + R.int(1, 3)) % 4 : S.chain[S.k]); }
    else abxyBot(m, i, R.int(0, 3));
  },
  score(m, S) { return DU.scores(m, S.wins[0], S.wins[1]); },
  fmt(s) { return s < 0 ? 'watching' : `${s} round${s === 1 ? '' : 's'}`; },
  hud(m, S, i) { const j = S.d.indexOf(i); return j < 0 ? '👀 watching' : `💃 ${S.wins[j]}`; },
  dancer(g, m, i, x, y, mv, mood, f) {
    const p = m.players[i], k = mv ? Math.min(1, mv.t / 0.55) : 0, d = mv ? mv.d : -1, s = Math.sin(k * Math.PI);
    let dy = 0, rot = 0, sx = 1, hands;
    if (d === 0) { dy = -s * 70; hands = { n: { x: -1.3, y: -1.5, d: -130, o: true, m: true }, f: { x: 1.3, y: -1.5, d: -50, o: true, m: false } }; }
    else if (d === 1) { sx = Math.cos(k * Math.PI * 2); hands = { n: { x: -1.4, y: -0.4, d: 180, o: true, m: true }, f: { x: 1.4, y: -0.4, d: 0, o: true, m: false } }; }
    else if (d === 2) { dy = s * 18; const c = s; hands = { n: { x: 0.2 - (1 - c) * 0.9, y: -0.6, d: 0, o: true, m: true }, f: { x: 0.25 + (1 - c) * 0.9, y: -0.6, d: 0, o: true, m: false } }; }
    else if (d === 3) { rot = -0.15 * s; hands = { n: { x: -0.5, y: -1.8, d: -100, o: false, m: true }, f: { x: 1.0, y: 0.2, d: 30, o: true, m: false } }; }
    else { dy = Math.abs(Math.sin(m.t * 3 + i)) * -4; }
    g.save(); g.translate(x, y + dy); g.rotate(rot); g.scale(sx, 1);
    Char.draw(g, 0, 0, 48, p.el.id, p.color, { mood: MGH.persona(mood, p.el.id), seed: i * 1.7, look: { x: f, y: 0 }, hands, noShadow: true });
    g.restore(); GX.shadow(g, x, y + 62, 50 - Math.min(30, -dy * 0.3), 0.35);
    if (d === 2 && s > 0.8) for (let q = 0; q < 5; q++) MGH.star(g, x + Math.cos(q * 1.3) * 50, y - 20 + Math.sin(q * 1.3) * 30, 5, '#ffe680', m.t * 4, false);
  },
  draw(m, S, g) {
    const t = m.t;
    GX.vfill(g, 0, 40, 1280, 680, ['#2a1048', '#4a1a6a', '#1a0a30']);
    for (let k = 0; k < 14; k++) { g.fillStyle = `rgba(255,${120 + k * 8},200,${0.06 + 0.06 * Math.sin(t * 3 + k)})`; MGH.rr(g, k * 92 + 6, 60, 80, 230, 8); g.fill(); }
    g.fillStyle = '#3a1a4a'; g.fillRect(0, 520, 1280, 200); const fg = g.createLinearGradient(0, 520, 0, 720); fg.addColorStop(0, 'rgba(255,180,240,0.25)'); fg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = fg; g.fillRect(0, 520, 1280, 200);
    for (let k = 0; k < 16; k++) { g.fillStyle = k % 2 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.1)'; g.fillRect(k * 80, 520, 80, 200); }
    MGH.crowd(g, t, 700, 26);
    S.d.forEach((i, j) => {
      const x = j ? 900 : 380, on = S.turn === j && S.ph !== 'oops';
      if (on) { g.save(); g.globalCompositeOperation = 'lighter'; const sp = g.createLinearGradient(0, 40, 0, 600); sp.addColorStop(0, 'rgba(255,240,200,0.35)'); sp.addColorStop(1, 'rgba(255,240,200,0.05)'); g.fillStyle = sp; g.beginPath(); g.moveTo(x - 30, 40); g.lineTo(x + 30, 40); g.lineTo(x + 150, 600); g.lineTo(x - 150, 600); g.fill(); g.restore(); }
      const mv = S.move && S.move.who === j ? S.move : null, mood = S.ph === 'oops' ? (S.loser === j ? 'hurt' : 'cheer') : on ? 'determined' : 'happy';
      this.dancer(g, m, i, x, 460, mv, mood, j ? -1 : 1);
      const p = m.players[i]; g.fillStyle = 'rgba(0,0,0,0.5)'; MGH.rr(g, x - 110, 560, 220, 46, 23); g.fill(); MGH.text(g, p.name, x, 584, 18, p.color, 'center', 'bold'); for (let q = 0; q < 2; q++) MGH.star(g, x - 14 + q * 28, 598, 7, q < S.wins[j] ? '#ffe680' : 'rgba(255,255,255,0.25)', 0, false);
      if (mv) MGH.label(g, MM_MOVES[mv.d].n, x, 300, 22, '#ffe680');
    });
    // the dance so far is NOT written out — just how long it is (memory!), and where you are in it
    const n = S.chain.length; for (let k = 0; k < n; k++) { const done = S.turn === S.turn && k < S.k; g.fillStyle = done ? '#7cf06a' : 'rgba(255,255,255,0.3)'; g.beginPath(); g.arc(640 - (n - 1) * 14 + k * 28, 120, 9, 0, 7); g.fill(); }
    if (S.ph === 'added' && S.last !== null) MGH.label(g, `+ ${MM_MOVES[S.last].n} added!`, 640, 170, 22, '#9fe0ff');
    const pt = m.players[S.d[S.turn]];
    if (S.ph === 'turn') MGH.label(g, S.k < n ? `${pt.name}: repeat the dance (${S.k}/${n})` : `${pt.name}: add a NEW move!`, 640, 78, 22, pt.color);
    if (S.ph === 'oops') MGH.label(g, `${m.players[S.d[S.loser]].name} slipped! ${m.players[S.d[1 - S.loser]].name} takes the round`, 640, 78, 24, '#ffe680');
  },
});
