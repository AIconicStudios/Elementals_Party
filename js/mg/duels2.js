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
      // stadium: starry night, light towers, tiered stands with fans, outfield wall, striped grass
      const half = (key, fn) => g.drawImage(GX.bake(key, fn), 0, 0, 1280, 1440, 0, 0, 640, 720);
      half('slugger_sky', b => {
        GX.vfill(b, 0, 40, 640, 300, ['#0a1430', '#1a2a5a', '#3a4a8a']); for (let k = 0; k < 50; k++) { b.fillStyle = `rgba(255,255,255,${0.3 + MGH.hash(k) * 0.6})`; b.fillRect(MGH.hash(k + 3) * 640, 44 + MGH.hash(k + 7) * 120, 2, 2); }
        b.fillStyle = '#f4f0d8'; b.beginPath(); b.arc(330, 90, 22, 0, 7); b.fill(); b.fillStyle = '#1a2a5a'; b.beginPath(); b.arc(340, 84, 19, 0, 7); b.fill();
        // jumbotron
        b.fillStyle = '#2a2a3a'; b.fillRect(250, 120, 140, 70); b.fillRect(316, 190, 8, 40); b.fillStyle = '#0a1a2a'; b.fillRect(256, 126, 128, 58); b.fillStyle = '#ffd34d'; b.font = 'bold 18px Georgia'; b.textAlign = 'center'; b.fillText('⚾ SLUGGERS', 320, 152); b.fillStyle = '#5ac8ff'; b.fillText('HOME RUN!', 320, 176);
        // tiered stands
        for (let r = 0; r < 4; r++) { b.fillStyle = r % 2 ? '#2a3a6a' : '#22305a'; b.fillRect(0, 200 + r * 32, 640, 32); b.fillStyle = 'rgba(255,255,255,0.06)'; b.fillRect(0, 200 + r * 32, 640, 3); }
      });
      [[60, 66], [580, 66]].forEach(([x, y]) => { g.fillStyle = '#4a4a5a'; g.fillRect(x - 3, y, 6, 150); g.fillStyle = '#3a3a48'; g.fillRect(x - 30, y - 18, 60, 28); for (let q = 0; q < 6; q++) { g.fillStyle = '#fffbe0'; g.beginPath(); g.arc(x - 22 + (q % 3) * 22, y - 10 + Math.floor(q / 3) * 12, 5, 0, 7); g.fill(); } MGH.glow(g, x, y - 4, 130, 'rgba(255,250,210,0.3)'); });
      MGH.crowd(g, t, 262, 18);
      half('slugger_field', b => {
        // outfield wall with ads and distance markers
        b.fillStyle = '#1a5a3a'; b.fillRect(0, 300, 640, 36); b.fillStyle = '#ffd34d'; b.fillRect(0, 300, 640, 4);
        [['#e8323e', 'PIE CO.'], ['#2a6ae8', 'ZAP COLA'], ['#ff8a2a', 'YUPPIES']].forEach(([c, txt], k) => { b.fillStyle = c; MGH.rr(b, 30 + k * 210, 306, 170, 26, 6); b.fill(); b.fillStyle = '#fff'; b.font = 'bold 15px Georgia'; b.textAlign = 'center'; b.fillText(txt, 115 + k * 210, 324); });
        // mowed grass with a checker of light and dark
        for (let k = 0; k < 8; k++) for (let c = 0; c < 8; c++) { b.fillStyle = (k + c) % 2 ? '#3c9c40' : '#48ac4a'; b.fillRect(c * 80, 336 + k * 48, 80, 48); }
        [110, 230, 380].forEach((d, k) => { b.fillStyle = 'rgba(255,255,255,0.75)'; b.font = 'bold 14px Georgia'; b.textAlign = 'center'; b.fillText(`${d} m`, 200 + k * 160, 296); });
        // infield dirt, base paths, mound, batter's box
        b.fillStyle = '#c8945a'; b.beginPath(); b.ellipse(170, 600, 160, 50, 0, 0, 7); b.fill(); b.fillStyle = 'rgba(0,0,0,0.08)'; b.beginPath(); b.ellipse(170, 604, 140, 40, 0, 0, 7); b.fill();
        b.fillStyle = '#c8945a'; b.beginPath(); b.ellipse(520, 590, 62, 20, 0, 0, 7); b.fill(); b.fillStyle = '#fff'; b.fillRect(512, 586, 16, 4);
        b.strokeStyle = 'rgba(255,255,255,0.8)'; b.lineWidth = 2; b.strokeRect(118, 584, 30, 40); b.strokeRect(192, 584, 30, 40);
        b.fillStyle = '#fff'; b.beginPath(); b.moveTo(150, 600); b.lineTo(170, 590); b.lineTo(190, 600); b.lineTo(190, 608); b.lineTo(150, 608); b.fill();
        b.strokeStyle = 'rgba(255,255,255,0.7)'; b.lineWidth = 3; b.beginPath(); b.moveTo(170, 600); b.lineTo(640, 360); b.stroke();
        // a dugout bench in the corner
        b.fillStyle = '#2a3a5a'; MGH.rr(b, -20, 650, 130, 70, 10); b.fill(); b.fillStyle = '#1a2440'; b.fillRect(0, 668, 100, 40); b.fillStyle = '#8a5a32'; b.fillRect(0, 694, 100, 8);
      });
      // pitching robot
      const wind = S.ph === 'wind' ? Math.min(1, S.pt / 0.9) : 0;
      g.save(); g.translate(520, 560 + Math.sin(t * 3) * 1.5);
      GX.shadow(g, 0, 8, 40, 0.35); g.fillStyle = '#3a3a48'; MGH.rr(g, -30, -8, 60, 16, 8); g.fill(); for (let q = 0; q < 4; q++) { g.fillStyle = '#6a6a7a'; g.beginPath(); g.arc(-21 + q * 14, 0, 5, 0, 7); g.fill(); }
      const rb = g.createLinearGradient(-24, 0, 24, 0); rb.addColorStop(0, '#9aa8c8'); rb.addColorStop(0.5, '#dce4f4'); rb.addColorStop(1, '#8a98b8'); g.fillStyle = rb; MGH.rr(g, -24, -72, 48, 66, 14); g.fill();
      g.fillStyle = '#2a3a5a'; MGH.rr(g, -14, -58, 28, 22, 5); g.fill(); for (let q = 0; q < 3; q++) { g.fillStyle = (Math.floor(t * 4) + q) % 3 === 0 ? '#7cf06a' : '#ffd34d'; g.beginPath(); g.arc(-7 + q * 7, -47, 3, 0, 7); g.fill(); }
      g.fillStyle = rb; MGH.rr(g, -20, -104, 40, 34, 12); g.fill(); g.fillStyle = '#1a2440'; MGH.rr(g, -15, -96, 30, 16, 8); g.fill();
      const blink = (t % 3) < 0.12; g.fillStyle = '#5ae8ff'; if (!blink) { g.beginPath(); g.arc(-6, -88, 4, 0, 7); g.arc(6, -88, 4, 0, 7); g.fill(); } else { g.fillRect(-10, -89, 8, 2); g.fillRect(2, -89, 8, 2); }
      g.fillStyle = 'rgba(255,140,170,0.6)'; g.beginPath(); g.arc(-13, -76, 3.5, 0, 7); g.arc(13, -76, 3.5, 0, 7); g.fill();
      g.strokeStyle = '#6a7290'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, -104); g.lineTo(0, -116); g.stroke(); g.fillStyle = Math.sin(t * 6) > 0 ? '#ff5a5a' : '#ff9a9a'; g.beginPath(); g.arc(0, -118, 4, 0, 7); g.fill();
      g.fillStyle = '#e8323e'; MGH.rr(g, -22, -110, 44, 8, 4); g.fill(); g.fillRect(4, -106, 22, 4);
      g.save(); g.translate(20, -56); g.rotate(-0.4 - wind * 2.2 + (S.ph === 'pitch' && S.pt < 1.1 ? 2.6 : 0)); g.fillStyle = '#7a86a8'; MGH.rr(g, -5, -5, 40, 10, 5); g.fill(); g.fillStyle = '#c8a050'; g.beginPath(); g.arc(38, 0, 8, 0, 7); g.fill(); g.restore();
      g.fillStyle = '#7a86a8'; MGH.rr(g, -32, -60, 12, 30, 6); g.fill(); g.restore();
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
// big picture cards for Quick Draw Pie (only PIE! is the real one)
const QDPIC = {
  'PIE!'(g, x, y, s) { g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = '#c8803a'; g.beginPath(); g.ellipse(0, 30, 86, 26, 0, 0, Math.PI); g.lineTo(-86, 30); g.fill(); g.fillStyle = '#e8a860'; g.fillRect(-86, 8, 172, 24); for (let q = -80; q < 86; q += 16) { g.fillStyle = '#d89050'; g.beginPath(); g.arc(q, 8, 8, Math.PI, 0); g.fill(); }
    g.strokeStyle = '#d8c8b0'; g.lineWidth = 3; g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(0, 4, 82, 22, 0, 0, 7); g.fill(); g.stroke(); for (let q = 0; q < 7; q++) { g.beginPath(); g.arc(-60 + q * 20, -8 - (q % 2) * 10, 16, 0, 7); g.fill(); g.stroke(); }
    g.beginPath(); g.moveTo(-20, -20); g.quadraticCurveTo(0, -70, 20, -20); g.fill(); g.stroke(); g.fillStyle = 'rgba(200,180,150,0.25)'; g.beginPath(); g.ellipse(10, 0, 60, 12, 0, 0, 7); g.fill(); g.fillStyle = '#e8323e'; g.beginPath(); g.arc(2, -52, 12, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,0.7)'; g.beginPath(); g.arc(-2, -56, 4, 0, 7); g.fill(); g.strokeStyle = '#3a8a2a'; g.lineWidth = 3; g.beginPath(); g.moveTo(4, -62); g.quadraticCurveTo(10, -76, 18, -74); g.stroke(); g.restore(); },
  'PIZZA!'(g, x, y, s) { g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = '#d8903a'; g.beginPath(); g.moveTo(-80, -50); g.quadraticCurveTo(0, -80, 80, -50); g.lineTo(0, 80); g.closePath(); g.fill(); g.fillStyle = '#ffd34d'; g.beginPath(); g.moveTo(-66, -38); g.quadraticCurveTo(0, -62, 66, -38); g.lineTo(0, 66); g.closePath(); g.fill();
    g.fillStyle = '#c83a2a'; for (const [px, py] of [[-28, -28], [22, -22], [0, 12], [-8, 40]]) { g.beginPath(); g.arc(px, py, 11, 0, 7); g.fill(); } g.fillStyle = '#3a8a2a'; g.beginPath(); g.ellipse(30, 6, 7, 4, 0.6, 0, 7); g.fill(); g.restore(); },
  'PINE!'(g, x, y, s) { g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = '#8a5a2a';
    for (let r = 0; r < 6; r++) for (let c = 0; c < 4; c++) { const yy = -60 + r * 24, w = 50 - Math.abs(r - 2.5) * 10, xx = -w / 2 + c * (w / 3); g.fillStyle = (r + c) % 2 ? '#8a5a2a' : '#a8703a'; g.beginPath(); g.ellipse(xx, yy, 14, 10, 0, 0, 7); g.fill(); }
    g.strokeStyle = '#3a8a2a'; g.lineWidth = 4; g.beginPath(); g.moveTo(0, -74); g.lineTo(0, -90); g.stroke(); g.restore(); },
  'PIGEON!'(g, x, y, s) { g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = '#8a8aa8'; g.beginPath(); g.ellipse(0, 10, 66, 40, 0, 0, 7); g.fill(); g.fillStyle = '#6a6a88'; g.beginPath(); g.moveTo(40, 10); g.lineTo(90, -6); g.lineTo(84, 30); g.closePath(); g.fill();
    g.fillStyle = '#a8a8c4'; g.beginPath(); g.arc(-50, -30, 30, 0, 7); g.fill(); g.fillStyle = '#5ac8a8'; g.beginPath(); g.ellipse(-36, -4, 22, 14, 0, 0, 7); g.fill(); g.fillStyle = '#ffb030'; g.beginPath(); g.moveTo(-78, -30); g.lineTo(-96, -24); g.lineTo(-78, -20); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(-56, -36, 7, 0, 7); g.fill(); g.fillStyle = '#c83a2a'; g.beginPath(); g.arc(-58, -36, 4, 0, 7); g.fill(); g.strokeStyle = '#e88a8a'; g.lineWidth = 4; g.beginPath(); g.moveTo(-10, 48); g.lineTo(-14, 70); g.moveTo(10, 48); g.lineTo(14, 70); g.stroke(); g.restore(); },
  'PICKLE!'(g, x, y, s) { g.save(); g.translate(x, y); g.scale(s, s); g.rotate(-0.4);
    const gg = g.createLinearGradient(-30, 0, 30, 0); gg.addColorStop(0, '#5aa83a'); gg.addColorStop(1, '#2a7a2a'); g.fillStyle = gg; g.beginPath(); g.ellipse(0, 0, 34, 88, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(200,255,150,0.6)'; for (let q = 0; q < 8; q++) { g.beginPath(); g.arc(-10 + (q % 2) * 18, -64 + q * 17, 4, 0, 7); g.fill(); } g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.ellipse(-14, -20, 6, 30, 0, 0, 7); g.fill(); g.restore(); },
  'PIRATE!'(g, x, y, s) { g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = '#1a1a2a'; g.beginPath(); g.moveTo(-96, 20); g.quadraticCurveTo(-60, -70, 0, -60); g.quadraticCurveTo(60, -70, 96, 20); g.quadraticCurveTo(0, 0, -96, 20); g.fill(); g.strokeStyle = '#ffd34d'; g.lineWidth = 5; g.beginPath(); g.moveTo(-90, 16); g.quadraticCurveTo(0, -4, 90, 16); g.stroke();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(0, -26, 16, 0, 7); g.fill(); g.fillStyle = '#1a1a2a'; g.beginPath(); g.arc(-6, -28, 4, 0, 7); g.arc(6, -28, 4, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(-24, -4); g.lineTo(24, 12); g.moveTo(24, -4); g.lineTo(-24, 12); g.stroke(); g.restore(); },
};

MG.def({
  id: 'qdpie', name: 'Quick Draw Pie', type: 'Duel', mode: 'duel', controls: '1 button', dur: 0,
  rows: [['a', 'Throw your pie!']],
  how: 'Sit face to face with a cream pie in hand. The host holds up a picture — when it\'s a PIE, press A first to splat your rival right in the face! But careful: a pizza, a pine cone, a pigeon… if you throw on a fake (or too early), YOU get the pie instead. First to three splats wins.',
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
    // a cosy pie parlour: striped wallpaper, pie shelves, a sunset window, bunting
    GX.blit(g, GX.bake('qdpie_bg', b => {
      GX.vfill(b, 0, 40, 1280, 460, ['#fff0dc', '#f4dcc0']); for (let x = 0; x < 1280; x += 48) { b.fillStyle = 'rgba(232,110,140,0.16)'; b.fillRect(x, 40, 22, 460); }
      b.fillStyle = '#8a5432'; b.fillRect(0, 380, 1280, 120); for (let x = 0; x < 1280; x += 80) { b.fillStyle = 'rgba(0,0,0,0.12)'; b.fillRect(x, 390, 70, 100); b.fillStyle = 'rgba(255,255,255,0.06)'; b.fillRect(x + 4, 394, 62, 4); } b.fillStyle = '#5a3418'; b.fillRect(0, 376, 1280, 8);
      // window with a sunset orchard
      b.fillStyle = '#6a3a1e'; MGH.rr(b, 500, 120, 280, 200, 12); b.fill(); GX.vfill(b, 514, 134, 252, 172, ['#ff9a7a', '#ffd89a', '#c8e8a8']); b.fillStyle = '#fff2c0'; b.beginPath(); b.arc(640, 250, 30, 0, 7); b.fill();
      b.fillStyle = '#6ab84a'; b.beginPath(); b.moveTo(514, 306); for (let x = 514; x <= 766; x += 12) b.lineTo(x, 270 - Math.sin(x * 0.03) * 12); b.lineTo(766, 306); b.fill(); for (const x of [550, 610, 700, 740]) { b.fillStyle = '#3a8a3a'; b.beginPath(); b.arc(x, 262, 16, 0, 7); b.fill(); b.fillStyle = '#e8323e'; b.beginPath(); b.arc(x - 5, 258, 3, 0, 7); b.arc(x + 6, 266, 3, 0, 7); b.fill(); }
      b.strokeStyle = '#6a3a1e'; b.lineWidth = 8; b.beginPath(); b.moveTo(640, 134); b.lineTo(640, 306); b.moveTo(514, 220); b.lineTo(766, 220); b.stroke();
      b.fillStyle = '#e86a8a'; for (const s of [-1, 1]) { b.beginPath(); b.moveTo(640 + s * 150, 110); b.quadraticCurveTo(640 + s * 120, 220, 640 + s * 158, 330); b.lineTo(640 + s * 176, 330); b.lineTo(640 + s * 176, 110); b.fill(); }
      // shelves full of pies
      const pie = (x, y, c) => { b.fillStyle = '#d89a5a'; b.beginPath(); b.ellipse(x, y, 26, 9, 0, 0, 7); b.fill(); b.fillStyle = c; b.beginPath(); b.ellipse(x, y - 3, 22, 7, 0, 0, 7); b.fill(); b.strokeStyle = '#f4c890'; b.lineWidth = 2; for (let q = -1; q <= 1; q++) { b.beginPath(); b.moveTo(x - 18, y - 3 + q * 3); b.lineTo(x + 18, y - 3 - q * 3); b.stroke(); } b.fillStyle = '#c8803a'; b.fillRect(x - 26, y, 52, 6); };
      for (const sx of [70, 960]) for (let r = 0; r < 3; r++) { b.fillStyle = '#8a5432'; b.fillRect(sx, 170 + r * 70, 250, 10); b.fillStyle = 'rgba(0,0,0,0.15)'; b.fillRect(sx, 180 + r * 70, 250, 6); for (let k = 0; k < 4; k++) pie(sx + 34 + k * 60, 164 + r * 70, ['#e8323e', '#9a4ad8', '#ffd34d', '#ff8a3a'][(k + r) % 4]); }
      // bunting
      for (let k = 0; k < 26; k++) { const x = k * 50, y = 60 + Math.sin(k * 0.6) * 8; b.fillStyle = ['#e8323e', '#ffd34d', '#5ac8ff', '#7cd85a', '#ff8ac8'][k % 5]; b.beginPath(); b.moveTo(x, y); b.lineTo(x + 40, y); b.lineTo(x + 20, y + 26); b.fill(); } b.strokeStyle = '#6a4a2a'; b.lineWidth = 2; b.beginPath(); for (let k = 0; k <= 26; k++) b.lineTo(k * 50, 60 + Math.sin(k * 0.6) * 8); b.stroke();
      // checkered floor
      for (let y = 500; y < 720; y += 44) for (let x = 0; x < 1280; x += 44) { b.fillStyle = ((x + y) / 44) % 2 ? '#f4e8d8' : '#c84a5a'; b.fillRect(x, y, 44, 44); } GX.vfill(b, 0, 500, 1280, 220, ['rgba(0,0,0,0.25)', 'rgba(0,0,0,0)']);
    }));
    [[300, 120], [980, 120]].forEach(([x, y]) => { g.strokeStyle = '#2a1a10'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, 40); g.lineTo(x, y); g.stroke(); MGH.glow(g, x, y + 16, 140, 'rgba(255,210,140,0.3)'); g.fillStyle = '#ffd890'; g.beginPath(); g.moveTo(x - 22, y + 24); g.lineTo(x + 22, y + 24); g.lineTo(x + 12, y); g.lineTo(x - 12, y); g.fill(); });
    // the table with a gingham cloth and a stack of spare pies
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(640, 680, 470, 24, 0, 0, 7); g.fill();
    g.fillStyle = '#5a3418'; g.fillRect(260, 510, 30, 160); g.fillRect(990, 510, 30, 160);
    g.fillStyle = '#fff'; MGH.rr(g, 210, 466, 860, 70, 10); g.fill(); g.save(); g.beginPath(); MGH.rr(g, 210, 466, 860, 70, 10); g.clip(); for (let x = 210; x < 1070; x += 24) { g.fillStyle = 'rgba(232,50,62,0.45)'; g.fillRect(x, 466, 12, 70); } for (let y = 466; y < 536; y += 24) { g.fillStyle = 'rgba(232,50,62,0.45)'; g.fillRect(210, y, 860, 12); } g.restore();
    for (let q = 0; q < 6; q++) { const scl = 1 - q * 0.04; g.fillStyle = '#d89a5a'; g.beginPath(); g.ellipse(640, 462 - q * 12, 40 * scl, 10, 0, 0, 7); g.fill(); g.fillStyle = '#fff6e8'; g.beginPath(); g.ellipse(640, 458 - q * 12, 34 * scl, 7, 0, 0, 7); g.fill(); }
    g.fillStyle = '#e8323e'; g.beginPath(); g.arc(640, 384, 6, 0, 7); g.fill();
    // host with the word sign
    Char.npc(g, 640, 300, 30, 'host', { mood: S.cur && !S.cur.fake ? 'shock' : 'happy', t });
    if (S.ph === 'wait' && S.cur) { const fake = S.cur.fake, k = Math.min(1, S.curT / 0.12); g.save(); g.translate(640, 230); g.scale(k, k); g.rotate(Math.sin(S.curT * 8) * 0.02 * (fake ? 1 : 0));
      g.fillStyle = 'rgba(0,0,0,0.3)'; MGH.rr(g, -186, -136, 380, 290, 26); g.fill(); const cg = g.createLinearGradient(0, -144, 0, 144); cg.addColorStop(0, '#e8f6ff'); cg.addColorStop(1, '#c8e4f8'); g.fillStyle = cg; MGH.rr(g, -190, -144, 380, 288, 24); g.fill(); g.strokeStyle = fake ? '#8a6a3a' : '#e8323e'; g.lineWidth = 10; g.stroke();
      QDPIC[S.cur.w](g, 0, 6, 1.6, m.t); g.restore(); if (!fake) MGH.glow(g, 640, 230, 260, 'rgba(255,220,100,0.35)'); }
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
    const foe = S.f[1 - A.sh], hit = this.occ(foe, A.r, A.c); S.shots[A.sh].push({ r: A.r, c: A.c, hit, at: S.clock || 0 });
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
    const sz = 92, t = m.t, shooter = 1 - j, shots = S.shots[shooter] || [], W = sz * 4;
    S.clock = t;
    // a wooden chart table with brass corners and a rope trim
    g.fillStyle = 'rgba(0,0,0,0.35)'; MGH.rr(g, ox - 50, oy - 46, W + 92, W + 92, 18); g.fill();
    GX.plank(g, ox - 56, oy - 56, W + 92, W + 92, '#a8743e', '#6a4422', j);
    g.strokeStyle = '#e8d0a0'; g.lineWidth = 4; g.setLineDash([8, 6]); MGH.rr(g, ox - 44, oy - 44, W + 68, W + 68, 12); g.stroke(); g.setLineDash([]);
    for (const [cx2, cy2] of [[ox - 44, oy - 44], [ox + W + 24, oy - 44], [ox - 44, oy + W + 24], [ox + W + 24, oy + W + 24]]) { const bg = g.createRadialGradient(cx2 - 2, cy2 - 2, 1, cx2, cy2, 9); bg.addColorStop(0, '#fff6c8'); bg.addColorStop(1, '#a8781a'); g.fillStyle = bg; g.beginPath(); g.arc(cx2, cy2, 8, 0, 7); g.fill(); }
    // living water: a deep-to-light gradient, drifting light caustics and wave crests
    const wg = g.createLinearGradient(0, oy, 0, oy + W); wg.addColorStop(0, '#4ab8f0'); wg.addColorStop(1, '#1a5aa8'); g.fillStyle = wg; g.fillRect(ox, oy, W, W);
    g.save(); g.beginPath(); g.rect(ox, oy, W, W); g.clip();
    for (let k = 0; k < 18; k++) { const x = ox + ((k * 67 + t * 14) % (W + 60)) - 30, y = oy + (k * 41) % W; g.fillStyle = 'rgba(255,255,255,0.07)'; g.beginPath(); g.ellipse(x, y, 22, 6, 0.3, 0, 7); g.fill(); }
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { const x = ox + c * sz, y = oy + r * sz; g.strokeStyle = 'rgba(255,255,255,0.28)'; g.lineWidth = 2; for (let q = 0; q < 2; q++) { const yy = y + sz * (0.38 + q * 0.3) + Math.sin(t * 2 + r + c + q) * 3; g.beginPath(); g.moveTo(x + 14, yy); g.quadraticCurveTo(x + sz / 2, yy - 7, x + sz - 14, yy); g.stroke(); } }
    g.restore();
    g.strokeStyle = 'rgba(10,30,60,0.55)'; g.lineWidth = 2; for (let k = 0; k <= 4; k++) { g.beginPath(); g.moveTo(ox + k * sz, oy); g.lineTo(ox + k * sz, oy + W); g.moveTo(ox, oy + k * sz); g.lineTo(ox + W, oy + k * sz); g.stroke(); }
    for (let k = 0; k < 4; k++) { abxyBadge(g, k, ox - 30, oy + k * sz + sz / 2, 13); abxyBadge(g, k, ox + k * sz + sz / 2, oy - 30, 13); }
    // shots: a fresh one lands with a splash plume (miss) or an explosion (hit); then a buoy or burning wreck stays
    shots.forEach(q => { const x = ox + q.c * sz + sz / 2, y = oy + q.r * sz + sz / 2, age = Math.max(0, t - (q.at || 0));
      if (q.hit) {
        g.fillStyle = '#5a3a1a'; g.save(); g.translate(x, y + 8); g.rotate(-0.3); MGH.rr(g, -30, -8, 54, 16, 6); g.fill(); g.fillStyle = '#3a2414'; g.fillRect(-4, -34, 5, 30); g.fillStyle = 'rgba(240,230,210,0.85)'; g.beginPath(); g.moveTo(1, -34); g.lineTo(18, -20); g.lineTo(1, -12); g.fill(); g.restore();
        MGH.flame(g, x - 4, y, 0.42, t, q.r * 4 + q.c);
        for (let k = 0; k < 3; k++) { const ph = (t * 0.6 + k / 3) % 1; g.fillStyle = `rgba(60,60,70,${0.5 * (1 - ph)})`; g.beginPath(); g.arc(x + 6 + ph * 14, y - 30 - ph * 40, 9 + ph * 10, 0, 7); g.fill(); }
        if (age < 0.8) { const k = age / 0.8; MGH.glow(g, x, y, 80 * (1 - k) + 20, `rgba(255,170,60,${1 - k})`); for (let q2 = 0; q2 < 10; q2++) { const a = q2 / 10 * 6.28; g.fillStyle = `rgba(255,${150 + q2 * 10},60,${1 - k})`; g.beginPath(); g.arc(x + Math.cos(a) * k * 60, y + Math.sin(a) * k * 50, 5 * (1 - k) + 1, 0, 7); g.fill(); } }
      } else {
        g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 2.5; g.beginPath(); g.ellipse(x, y + 6, 22 + Math.sin(t * 3) * 2, 8, 0, 0, 7); g.stroke();
        g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(x, y, 9, 11, 0, 0, 7); g.fill(); g.fillStyle = '#e8323e'; g.fillRect(x - 9, y - 3, 18, 5);
        if (age < 1) { const k = age; for (let q2 = 0; q2 < 9; q2++) { const a = -Math.PI / 2 + (q2 - 4) * 0.25; g.fillStyle = `rgba(230,250,255,${1 - k})`; g.beginPath(); g.arc(x + Math.cos(a) * k * 46, y + Math.sin(a) * k * 70 + k * k * 60, 6 * (1 - k) + 2, 0, 7); g.fill(); } }
      } });
    // the fleets revealed at the end: little wooden ships on their cells
    if (S.ph === 'end') S.f[j].ships.forEach(cs => { const xs = cs.map(q => q.c), ys = cs.map(q => q.r), horiz = new Set(ys).size === 1, x0 = ox + Math.min(...xs) * sz + 10, y0 = oy + Math.min(...ys) * sz + 10, w = (Math.max(...xs) - Math.min(...xs) + 1) * sz - 20, h = (Math.max(...ys) - Math.min(...ys) + 1) * sz - 20;
      g.save(); g.translate(x0 + w / 2, y0 + h / 2); if (!horiz) g.rotate(Math.PI / 2); const L = Math.max(w, h), Hh = Math.min(w, h);
      g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(4, 6, L / 2, Hh / 2.6, 0, 0, 7); g.fill();
      g.fillStyle = '#7a4a22'; g.beginPath(); g.moveTo(-L / 2, -Hh / 3); g.lineTo(L / 2 - 14, -Hh / 3); g.quadraticCurveTo(L / 2 + 6, 0, L / 2 - 14, Hh / 3); g.lineTo(-L / 2, Hh / 3); g.closePath(); g.fill();
      g.fillStyle = '#a8743e'; g.fillRect(-L / 2 + 6, -Hh / 3 + 6, L - 30, Hh * 0.66 - 12); for (let k = -L / 2 + 30; k < L / 2 - 20; k += 40) { g.fillStyle = '#3a2414'; g.beginPath(); g.arc(k, 0, 5, 0, 7); g.fill(); }
      g.restore(); });
  },
  draw(m, S, g) {
    const t = m.t;
    GX.blit(g, GX.bake('seabattle_bg', b => {
      GX.vfill(b, 0, 40, 1280, 680, ['#2a8ac8', '#1a5aa0', '#0a2a5a']);
      b.save(); b.globalAlpha = 0.08; b.fillStyle = '#fff'; for (let k = 0; k < 7; k++) { const x = 100 + k * 180; b.beginPath(); b.moveTo(x, 40); b.lineTo(x + 60, 40); b.lineTo(x - 80, 720); b.lineTo(x - 160, 720); b.fill(); } b.restore();
      // islands in the corners
      for (const [x, y, s2] of [[60, 690, 1], [1230, 680, 0.8], [640, 700, 0.6]]) { b.fillStyle = '#e8c888'; b.beginPath(); b.ellipse(x, y, 110 * s2, 34 * s2, 0, Math.PI, 0); b.fill(); b.fillStyle = '#5ab83a'; b.beginPath(); b.ellipse(x, y - 20 * s2, 80 * s2, 22 * s2, 0, Math.PI, 0); b.fill(); }
      // a compass rose
      b.save(); b.translate(640, 680); b.scale(0.6, 0.6); b.globalAlpha = 0.55; for (let k = 0; k < 8; k++) { b.rotate(Math.PI / 4); b.fillStyle = k % 2 ? '#f4e8c8' : '#d8b878'; b.beginPath(); b.moveTo(0, -(k % 2 ? 34 : 54)); b.lineTo(7, 0); b.lineTo(-7, 0); b.fill(); } b.fillStyle = '#e8323e'; b.beginPath(); b.arc(0, 0, 6, 0, 7); b.fill(); b.restore();
    }));
    for (let k = 0; k < 6; k++) { const x = (k * 260 + t * 30) % 1500 - 100, y = 80 + Math.sin(t * 0.6 + k) * 20 + (k % 3) * 20, fl = Math.sin(t * 8 + k) * 5; g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 9, y - fl); g.quadraticCurveTo(x - 4, y - 4, x, y); g.quadraticCurveTo(x + 4, y - 4, x + 9, y - fl); g.stroke(); }
    // a little galleon for each admiral, bobbing at the bottom corners
    S.d.forEach((i, j) => { const x = j ? 1180 : 100, y = 690 + Math.sin(t * 1.6 + j) * 4, c = m.players[i].color, r = Math.sin(t * 1.3 + j) * 0.04; g.save(); g.translate(x, y); g.rotate(r); g.scale(0.75, 0.75); g.fillStyle = '#6a3a1e'; g.beginPath(); g.moveTo(-60, -10); g.lineTo(60, -10); g.lineTo(44, 14); g.lineTo(-44, 14); g.closePath(); g.fill(); g.fillStyle = '#8a5432'; g.fillRect(-60, -16, 120, 8); g.strokeStyle = '#4a2a10'; g.lineWidth = 4; g.beginPath(); g.moveTo(0, -16); g.lineTo(0, -96); g.stroke(); g.fillStyle = '#fff8e8'; g.beginPath(); g.moveTo(4, -90); g.quadraticCurveTo(44, -60, 4, -26); g.fill(); g.beginPath(); g.moveTo(-4, -84); g.quadraticCurveTo(-36, -60, -4, -34); g.fill(); g.fillStyle = c; g.beginPath(); g.moveTo(0, -96); g.lineTo(26, -90); g.lineTo(0, -84); g.fill(); for (let q = -2; q <= 2; q++) { g.fillStyle = '#2a1a10'; g.beginPath(); g.arc(q * 20, 0, 3.5, 0, 7); g.fill(); } g.restore(); g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 2; g.beginPath(); g.ellipse(x, y + 12, 54, 5, 0, 0, Math.PI); g.stroke(); });
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
  rows: [['pad', 'Rotate the cannon (up/down or left/right)'], ['a', 'Hold for power, let go to fire']],
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
      const ax0 = m.axis(i), ay = Math.abs(ax0.y) > Math.abs(ax0.x) ? ax0.y : (j ? -ax0.x : ax0.x) * 1; if (Math.abs(ay) > 0.3) { if (!F.creak || F.creak <= 0) { F.creak = 0.12; if (!m.bot(i)) Sfx.tone(240 + (F.ang + 3.2) * 60, 0.04, 'square', 0.05); } F.creak -= dt; const lo = j ? -Math.PI + 0.15 : -1.45, hi = j ? -Math.PI + 1.45 : -0.15; F.ang = clamp(F.ang + (j ? -ay : ay) * 1.2 * dt, j ? -Math.PI + 0.15 : -1.45, j ? -1.69 : -0.15); }
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
      const used = S.shots[j], miss = Math.max(0.035, 0.24 - used * 0.028), side = () => (Math.random() < 0.5 ? -1 : 1) * R.range(miss * 0.4, miss); S.bplan = { ang: best.ang + side() * 0.6, pow: clamp(best.pow + side(), 0, 1) };
    }
    const da = S.bplan.ang - F.ang; if (Math.abs(da) > 0.03) { v.ay = (j ? -1 : 1) * Math.sign(da); return; }
    if (F.hold < 0 || F.pow < S.bplan.pow - 0.02 || F.hold < 0.1) { v.a = true; if (F.hold > 0 && F.pow >= S.bplan.pow - 0.02 && Math.cos(F.hold * 2.6) < 1) { v.a = false; S.bplan = null; } }
  },
  score(m, S) { return DU.scores(m, S.winner === 0 ? 1 : 0, S.winner === 1 ? 1 : 0); },
  fmt(s) { return s < 0 ? 'watching' : s ? 'WIN' : '—'; },
  hud(m, S, i) { const j = S.d.indexOf(i); return j < 0 ? '👀 watching' : `💣 ${10 - S.shots[j]} left`; },
  draw(m, S, g) {
    const t = m.t;
    GX.blit(g, GX.bake('cannons_sky', b => {
      GX.vfill(b, 0, 40, 1280, 600, ['#5aa8f0', '#a8d8f8', '#ffe8c8']); MGH.glow(b, 1080, 150, 160, 'rgba(255,240,180,0.6)'); b.fillStyle = '#fff6c8'; b.beginPath(); b.arc(1080, 150, 44, 0, 7); b.fill();
      // a distant castle on the far ridge
      b.fillStyle = '#9ab0c8'; b.fillRect(560, 330, 160, 80); for (const x of [550, 610, 670, 714]) { b.fillRect(x, 300, 22, 110); b.beginPath(); b.moveTo(x - 4, 300); b.lineTo(x + 11, 270); b.lineTo(x + 26, 300); b.fill(); }
    }));
    [[200, 120], [700, 90], [1080, 140]].forEach(([x, y], k) => MGH.cloud(g, (x + t * (S.wind * 0.15)) % 1450 - 80, y, 30));
    g.fillStyle = '#8aa8b8'; g.beginPath(); g.moveTo(0, 600); for (let x = 0; x <= 1280; x += 40) g.lineTo(x, 470 - Math.abs(Math.sin(x * 0.005)) * 90); g.lineTo(1280, 600); g.fill();
    // valley hill
    const hg = g.createLinearGradient(0, 440, 0, 720); hg.addColorStop(0, '#6ab84a'); hg.addColorStop(1, '#3a7a2a'); g.fillStyle = hg; g.beginPath(); g.moveTo(0, 720); for (let x = 0; x <= 1280; x += 10) g.lineTo(x, this.ground(x)); g.lineTo(1280, 720); g.fill();
    g.fillStyle = '#5a3a20'; g.fillRect(0, 600, 1280, 120); g.fillStyle = '#4a9a3a'; g.fillRect(0, 596, 1280, 8);
    // trees, flowers and a fence along the valley
    for (const x of [30, 220, 420, 860, 1060, 1250]) { const y = this.ground(x); g.fillStyle = '#6a4a2a'; g.fillRect(x - 4, y - 30, 8, 32); g.fillStyle = '#3a8a3a'; g.beginPath(); g.arc(x, y - 40, 22, 0, 7); g.arc(x - 14, y - 30, 14, 0, 7); g.arc(x + 14, y - 30, 14, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,0.15)'; g.beginPath(); g.arc(x - 6, y - 48, 8, 0, 7); g.fill(); }
    for (let x = 10; x < 1280; x += 37) { const y = this.ground(x) - 2; g.fillStyle = ['#ff6a8a', '#ffd34d', '#fff', '#c88aff'][(x / 37 | 0) % 4]; g.beginPath(); g.arc(x, y, 3, 0, 7); g.fill(); }
    for (let x = 0; x < 1280; x += 26) { g.fillStyle = '#7a5a3a'; g.fillRect(x, 610, 5, 22); } g.fillRect(0, 614, 1280, 4); g.fillRect(0, 624, 1280, 4);
    for (let k = 0; k < 3; k++) { const x = (k * 470 + t * 30) % 1500 - 100, y = 200 + k * 40 + Math.sin(t + k) * 10, fl = Math.sin(t * 8 + k) * 5; g.strokeStyle = 'rgba(60,60,80,0.6)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 9, y - fl); g.quadraticCurveTo(x - 4, y - 4, x, y); g.quadraticCurveTo(x + 4, y - 4, x + 9, y - fl); g.stroke(); }
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
      if (S.turn === j && S.ph === 'aim') { const v0 = 260 + Math.max(0.45, F.pow) * 560; g.fillStyle = 'rgba(255,255,255,0.75)'; for (let q = 1; q <= 9; q++) { const tt = q * 0.09; g.beginPath(); g.arc(mx + Math.cos(F.ang) * v0 * tt, my + Math.sin(F.ang) * v0 * tt + 0.5 * this.G * tt * tt, 4 - q * 0.3, 0, 7); g.fill(); } MGH.label(g, `${Math.round(Math.abs((j ? Math.PI + F.ang : -F.ang) * 180 / Math.PI))}°`, cx + (j ? -50 : 50), cy - 70, 15, '#fff'); g.setLineDash([6, 8]); g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 2; g.beginPath(); g.moveTo(mx, my); g.lineTo(mx + Math.cos(F.ang) * 90, my + Math.sin(F.ang) * 90); g.stroke(); g.setLineDash([]); if (F.hold >= 0) drawPowerBar(g, cx, cy - 70, 100, F.pow); }
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
  rows: [['a', 'Clap'], ['b', 'Spin']],
  how: 'A dance-off under the spotlight! There are two moves: A = CLAP and B = SPIN. Take turns: repeat the WHOLE dance so far, in order, then add ONE new move of your own. The dance keeps growing — first dancer to slip up loses the round. Best of three rounds.',
  wins: 'Best of 3 rounds.',
  init(m, S) { S.d = DU.pair(m); S.wins = [0, 0]; S.round = 0; this.newRound(S); },
  newRound(S) { S.round++; S.chain = []; S.turn = (S.round + 1) % 2; S.k = 0; S.ph = 'turn'; S.pt = 0; S.move = null; S.last = null; S.loser = -1; },
  update(m, S, dt) {
    S.pt += dt; if (S.move) { S.move.t += dt; if (S.move.t > 0.55) S.move = null; }
    if (S.ph === 'oops') { if (S.pt > 2.4) { if (S.wins.some(w => w >= 2)) m.finish(this.score(m, S)); else this.newRound(S); } return; }
    if (S.ph === 'added') { if (S.pt > 0.9) { S.turn = 1 - S.turn; S.k = 0; S.ph = 'turn'; S.pt = 0; } return; }
    const i = S.d[S.turn]; if (S.pt > 4) { this.oops(S); return; }
    if (S.move) return; const d = m.pressed(i, 'a') ? 2 : m.pressed(i, 'b') ? 1 : -1; if (d < 0) return;
    S.move = { d, t: 0, who: S.turn }; S.pt = 0; Sfx.tone([660, 784, 523, 880][d], 0.12, 'triangle', 0.06);
    if (S.k < S.chain.length) { if (S.chain[S.k] !== d) { this.oops(S); return; } S.k++; }
    else { S.chain.push(d); S.last = d; S.ph = 'added'; S.pt = 0; Sfx.coin(); }
  },
  oops(S) { S.loser = S.turn; S.wins[1 - S.turn]++; S.ph = 'oops'; S.pt = 0; Sfx.bad(); },
  bot(m, S, i) {
    const j = S.d.indexOf(i); m.vin[i].a = m.vin[i].b = false; if (j < 0 || S.turn !== j || S.ph !== 'turn' || S.move) return;
    S.bw = (S.bw || 0) - 1 / 60; if (S.bw > 0) return; S.bw = R.range(0.35, 0.7);
    const v = m.vin[i], tap = d => { v.a = d === 2 && !m.prev[i].a; v.b = d === 1 && !m.prev[i].b; };
    if (S.k < S.chain.length) { const slip = Math.random() < 0.012 * S.chain.length; tap(slip ? 3 - S.chain[S.k] : S.chain[S.k]); }
    else tap(R.pick([1, 2]));
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
    // red velvet curtains, a disco ball and sweeping coloured spotlights
    for (let k = 0; k < 3; k++) { const a = Math.sin(t * 0.8 + k * 2.1) * 0.5, c = ['255,90,180', '90,200,255', '255,220,90'][k]; g.save(); g.translate(320 + k * 320, 40); g.rotate(a); const sg = g.createLinearGradient(0, 0, 0, 640); sg.addColorStop(0, `rgba(${c},0.35)`); sg.addColorStop(1, `rgba(${c},0)`); g.fillStyle = sg; g.beginPath(); g.moveTo(-10, 0); g.lineTo(10, 0); g.lineTo(120, 640); g.lineTo(-120, 640); g.fill(); g.restore(); }
    for (const db of [{ x: 250, y: 120 }, { x: 1030, y: 120 }]) { g.strokeStyle = '#888'; g.lineWidth = 2; g.beginPath(); g.moveTo(db.x, 40); g.lineTo(db.x, db.y - 30); g.stroke(); const dg = g.createRadialGradient(db.x - 10, db.y - 10, 4, db.x, db.y, 30); dg.addColorStop(0, '#fff'); dg.addColorStop(1, '#8a8aa8'); g.fillStyle = dg; g.beginPath(); g.arc(db.x, db.y, 30, 0, 7); g.fill();
    g.save(); g.beginPath(); g.arc(db.x, db.y, 30, 0, 7); g.clip(); for (let y = -30; y < 30; y += 7) for (let x = -30; x < 30; x += 7) { if ((Math.floor((x + t * 30) / 7) + y / 7) % 3 === 0) { g.fillStyle = 'rgba(255,255,255,0.8)'; g.fillRect(db.x + x, db.y + y, 5, 5); } } g.restore(); }
    for (let k = 0; k < 10; k++) { const a = k / 10 * 6.28 + t * 0.7, r = 120 + (k % 3) * 120; MGH.star(g, 640 + Math.cos(a) * r * 1.8, 200 + Math.sin(a) * r * 0.5, 4, ['#ff8ac8', '#8ae0ff', '#ffe680'][k % 3], a, false); }
    for (const s2 of [-1, 1]) { const x0 = s2 < 0 ? 0 : 1280; const cg = g.createLinearGradient(x0, 0, x0 - s2 * 170, 0); cg.addColorStop(0, '#5a0a1a'); cg.addColorStop(1, '#a81a32'); g.fillStyle = cg; g.beginPath(); g.moveTo(x0, 40); g.lineTo(x0 - s2 * 170, 40); g.quadraticCurveTo(x0 - s2 * 110, 300, x0 - s2 * 150, 720); g.lineTo(x0, 720); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 3; for (let q = 1; q < 5; q++) { g.beginPath(); g.moveTo(x0 - s2 * q * 32, 40); g.quadraticCurveTo(x0 - s2 * q * 24, 300, x0 - s2 * q * 30, 720); g.stroke(); } g.fillStyle = '#ffd34d'; g.beginPath(); g.arc(x0 - s2 * 130, 360, 8, 0, 7); g.fill(); }
    g.fillStyle = '#a81a32'; g.fillRect(0, 40, 1280, 30); for (let x = 0; x < 1280; x += 40) { g.beginPath(); g.arc(x + 20, 70, 20, 0, Math.PI); g.fill(); } g.fillStyle = '#ffd34d'; g.fillRect(0, 66, 1280, 3);
    for (let k = 0; k < 14; k++) { g.fillStyle = `rgba(255,${120 + k * 8},200,${0.06 + 0.06 * Math.sin(t * 3 + k)})`; MGH.rr(g, k * 92 + 6, 60, 80, 230, 8); g.fill(); }
    g.fillStyle = '#3a1a4a'; g.fillRect(0, 520, 1280, 200); const fg = g.createLinearGradient(0, 520, 0, 720); fg.addColorStop(0, 'rgba(255,180,240,0.25)'); fg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = fg; g.fillRect(0, 520, 1280, 200);
    // a glowing LED dance floor in perspective; tiles light up under whoever is dancing
    const mvNow = S.move ? S.move : null;
    for (let r = 0; r < 4; r++) for (let c = 0; c < 16; c++) { const y0 = 520 + r * 46, x0 = c * 80 - (r * 6), on = mvNow && Math.abs((mvNow.who ? 900 : 380) - (x0 + 40)) < 160, hue = (c * 47 + r * 90 + Math.floor(t * 3) * 37) % 360;
      g.fillStyle = on ? `hsla(${hue},90%,${55 + 20 * Math.sin(t * 12 + c)}%,0.85)` : `hsla(${hue},70%,${(c + r) % 2 ? 22 : 30}%,0.9)`; g.fillRect(x0 + 2, y0 + 2, 76, 42); g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(x0 + 4, y0 + 4, 72, 6); }
    MGH.crowd(g, t, 700, 26);
    S.d.forEach((i, j) => {
      const x = j ? 900 : 380, on = S.turn === j && S.ph !== 'oops';
      if (on) { g.save(); g.globalCompositeOperation = 'lighter'; const sp = g.createLinearGradient(0, 40, 0, 600); sp.addColorStop(0, 'rgba(255,240,200,0.35)'); sp.addColorStop(1, 'rgba(255,240,200,0.05)'); g.fillStyle = sp; g.beginPath(); g.moveTo(x - 30, 40); g.lineTo(x + 30, 40); g.lineTo(x + 150, 600); g.lineTo(x - 150, 600); g.fill(); g.restore(); }
      const mv = S.move && S.move.who === j ? S.move : null, mood = S.ph === 'oops' ? (S.loser === j ? 'hurt' : 'cheer') : on ? 'determined' : 'happy';
      // a round glowing stage under each dancer
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.ellipse(x, 530, 120, 26, 0, 0, 7); g.fill(); const pg = g.createLinearGradient(0, 500, 0, 530); pg.addColorStop(0, on ? '#ffd8f0' : '#c8a8e0'); pg.addColorStop(1, on ? '#ff8ac8' : '#7a5aa8'); g.fillStyle = pg; g.beginPath(); g.ellipse(x, 518, 116, 24, 0, 0, 7); g.fill();
      for (let q = 0; q < 14; q++) { const a2 = q / 14 * Math.PI * 2 + t * (on ? 2 : 0.5); g.fillStyle = (q + Math.floor(t * 6)) % 2 ? '#fff6c8' : m.players[i].color; g.beginPath(); g.arc(x + Math.cos(a2) * 112, 518 + Math.sin(a2) * 22, 3.5, 0, 7); g.fill(); }
      if (on) for (let q = 0; q < 4; q++) { const ph = (t * 0.5 + q / 4) % 1; g.globalAlpha = 1 - ph; MGH.text(g, q % 2 ? '♪' : '♫', x - 90 + q * 60 + Math.sin(t * 2 + q) * 10, 420 - ph * 200, 26, ['#ff8ac8', '#8ae0ff', '#ffe680', '#b8ff8a'][q], 'center', 'bold'); g.globalAlpha = 1; }
      if (mv && mv.d === 1) { const k2 = Math.min(1, mv.t / 0.55); g.strokeStyle = `rgba(255,255,255,${0.7 * (1 - k2)})`; g.lineWidth = 5; for (let q = 0; q < 3; q++) { g.beginPath(); g.ellipse(x, 440 - q * 30, 70 - q * 8, 16, 0, k2 * 9 + q, k2 * 9 + q + 2.4); g.stroke(); } }
      if (mv && mv.d === 2 && mv.t > 0.2 && mv.t < 0.45) { const k2 = (mv.t - 0.2) / 0.25; g.strokeStyle = `rgba(255,240,150,${1 - k2})`; g.lineWidth = 4; g.beginPath(); g.arc(x, 400, 20 + k2 * 70, 0, 7); g.stroke(); for (let q = 0; q < 8; q++) { const a2 = q / 8 * 6.28; g.beginPath(); g.moveTo(x + Math.cos(a2) * (30 + k2 * 40), 400 + Math.sin(a2) * (30 + k2 * 40)); g.lineTo(x + Math.cos(a2) * (44 + k2 * 60), 400 + Math.sin(a2) * (44 + k2 * 60)); g.stroke(); } }
      this.dancer(g, m, i, x, 460, mv, mood, j ? -1 : 1);
      const p = m.players[i]; g.fillStyle = 'rgba(0,0,0,0.5)'; MGH.rr(g, x - 110, 560, 220, 46, 23); g.fill(); MGH.text(g, p.name, x, 584, 18, p.color, 'center', 'bold'); for (let q = 0; q < 2; q++) MGH.star(g, x - 14 + q * 28, 598, 7, q < S.wins[j] ? '#ffe680' : 'rgba(255,255,255,0.25)', 0, false);
      if (mv) MGH.label(g, MM_MOVES[mv.d].n, x, 300, 22, '#ffe680');
    });
    // the dance so far is NOT written out — just how long it is (memory!), and where you are in it
    const n = S.chain.length; for (let k = 0; k < n; k++) { const done = k < S.k; MGH.text(g, '♪', 640 - (n - 1) * 15 + k * 30, 132 - (done ? Math.abs(Math.sin(t * 6 + k)) * 6 : 0), 28, done ? '#7cf06a' : 'rgba(255,255,255,0.35)', 'center', 'bold'); }
    if (S.ph === 'added' && S.last !== null) MGH.label(g, `+ ${MM_MOVES[S.last].n} added!`, 640, 170, 22, '#9fe0ff');
    const pt = m.players[S.d[S.turn]];
    if (S.ph === 'turn') MGH.label(g, S.k < n ? `${pt.name}: repeat the dance (${S.k}/${n})` : `${pt.name}: add a NEW move!`, 640, 78, 22, pt.color);
    if (S.ph === 'oops') MGH.label(g, `${m.players[S.d[S.loser]].name} slipped! ${m.players[S.d[1 - S.loser]].name} takes the round`, 640, 78, 24, '#ffe680');
  },
});
