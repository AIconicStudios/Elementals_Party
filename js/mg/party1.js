'use strict';
// Party batch 1a: Flag Frenzy, Firework Fuses, Balloon Bonanza, Lucky Doors

// a hero who is not playing this game (for referees and hosts)
function hostHero(m) { const used = m.players.map(p => p.el.id); const free = [...Array(15).keys()].filter(c => !used.includes(c)); return free.length ? free[Math.floor(MGH.hash(m.players.length * 7 + used[0]) * free.length)] : 14; }
// a little stage with curtains, used by the show-style games
function showStage(g, t, col = '#b8203a') {
  g.fillStyle = MGH.grad(g, 0, 720, ['#2a1048', '#4a1a5a', '#1a0a2a']); g.fillRect(0, 0, 1280, 720);
  MGH.rays(g, 640, -40, t, 'rgba(255,240,200,0.06)', 6, 1.1);
  for (const s of [-1, 1]) { g.fillStyle = MGH.grad(g, 0, 720, [Char.shade(col, 0.15), col, Char.shade(col, -0.4)]); g.beginPath(); const x0 = s < 0 ? 0 : 1280; g.moveTo(x0, 0); for (let k = 0; k <= 10; k++) { const y = k * 72; g.lineTo(x0 - s * (150 - Math.sin(k * 1.3 + t * 0.8) * 14 - k * 4), y); } g.lineTo(x0, 720); g.closePath(); g.fill(); for (let k = 0; k < 4; k++) { g.strokeStyle = 'rgba(0,0,0,0.18)'; g.lineWidth = 6; g.beginPath(); g.moveTo(x0 - s * (30 + k * 30), 0); g.lineTo(x0 - s * (30 + k * 32), 720); g.stroke(); } }
  g.fillStyle = Char.shade(col, -0.1); g.beginPath(); g.moveTo(0, 0); g.lineTo(1280, 0); g.lineTo(1280, 60); for (let k = 12; k >= 0; k--) g.quadraticCurveTo(k * 106.7 + 53, 100, k * 106.7, 60); g.closePath(); g.fill();
  g.fillStyle = MGH.grad(g, 560, 720, ['#8a5a3a', '#5a3420']); g.fillRect(0, 560, 1280, 160);
  for (let k = 0; k < 16; k++) { g.strokeStyle = 'rgba(0,0,0,0.15)'; g.lineWidth = 2; g.beginPath(); g.moveTo(k * 85, 560); g.lineTo(k * 85 - 40, 720); g.stroke(); }
  MGH.glow(g, 640, 600, 500, 'rgba(255,230,160,0.15)');
}

// ======================================================================== FLAG FRENZY
// Hold LB (or LT / LEFT) to keep the RED flag up, hold RB (or RT / RIGHT) to keep the BLUE flag up. Let go to lower it.
// The referee shows a picture command; the flags you're holding when the bar runs out are judged.
// need: 1 = must be up, 0 = must be down, null = either.  order: 'R' = blue must go up before red, 'L' = red before blue
const FLAG_CMDS = [
  { id: 'red', t: 'RED', L: 1, R: 0, lvl: 0 }, { id: 'blue', t: 'BLUE', L: 0, R: 1, lvl: 0 },
  { id: 'both', t: 'BOTH', L: 1, R: 1, lvl: 1 }, { id: 'none', t: 'NONE', L: 0, R: 0, lvl: 1 },
  { id: 'notred', t: 'NOT RED', L: 0, R: null, lvl: 2, not: ['L'] }, { id: 'notblue', t: 'NOT BLUE', L: null, R: 0, lvl: 2, not: ['R'] },
  { id: 'bthenr', t: 'BLUE then RED', L: 1, R: 1, order: 'R', lvl: 3 }, { id: 'rthenb', t: 'RED then BLUE', L: 1, R: 1, order: 'L', lvl: 3 },
  { id: 'nnred', t: 'NOT NOT RED', L: 1, R: null, lvl: 4, nn: ['L'] }, { id: 'nnblue', t: 'NOT NOT BLUE', L: null, R: 1, lvl: 4, nn: ['R'] },
];
MG.def({
  id: 'flags', name: 'Flag Frenzy', type: 'Reaction', controls: 'LB / RB flags', dur: 0,
  rows: [['lb', 'HOLD: red flag up'], ['rb', 'HOLD: blue flag up']],
  how: 'HOLD LB to keep the RED flag up and HOLD RB to keep the BLUE flag up (let go to lower it). The referee shows a picture: a red flag = red up only, a blue flag = blue up only, both flags = both up, crossed-out hands = both down. A flag with a ✖ means NOT that flag (keep it down — the other one can do anything). Two ✖✖ cancel out: NOT NOT red means red UP! An arrow between flags means raise them in that order. It starts slow and gets faster. Wrong flags cost a heart — three hearts each.',
  wins: 'Last one still waving.',
  init(m, S) {
    S.p = m.players.map(() => ({ L: false, Rf: false, hearts: 3, outT: 0, flash: 0, wave: 0, upL: -1, upR: -1, ok: true, bot: {} }));
    S.n = 0; S.phase = 'wait'; S.pt = 0; S.window = 3.4; S.cmd = null; S.host = hostHero(m); S.ref = { L: false, Rf: false };
  },
  newCmd(m, S) {
    S.n++; const lvl = S.n < 4 ? 0 : S.n < 8 ? 1 : S.n < 13 ? 2 : S.n < 18 ? 3 : 4;
    const pool = FLAG_CMDS.filter(c => c.lvl <= lvl); let c; do c = R.pick(pool); while (S.cmd && c.id === S.cmd.id && pool.length > 1);
    S.cmd = c; S.window = Math.max(1.15, 3.4 - S.n * 0.09); S.phase = 'cmd'; S.pt = 0;
    S.p.forEach(p => { p.upL = p.L ? 0 : -1; p.upR = p.Rf ? 0 : -1; });
    Sfx.tone(c.not || c.nn ? 320 : 660, 0.12, 'square', 0.05);
    // bots: work out the answer after a human-like pause; the harder and faster the calls, the likelier a slip
    const slip = (c.nn ? 0.2 : c.not ? 0.14 : c.order ? 0.12 : 0.06) + S.n * 0.005;
    S.p.forEach((p, i) => { if (p.hearts <= 0 || !m.bot(i)) return; const tL = c.L === null ? Math.random() < 0.3 : !!c.L, tR = c.R === null ? Math.random() < 0.3 : !!c.R; p.bot = { tL, tR, at: R.range(0.35, Math.min(1.3, S.window * 0.6)), first: c.order || null }; if (Math.random() < slip) { if (Math.random() < 0.5) p.bot.tL = !p.bot.tL; else p.bot.tR = !p.bot.tR; } });
  },
  judge(S, p) {
    const c = S.cmd; if (c.L !== null && p.L !== !!c.L) return false; if (c.R !== null && p.Rf !== !!c.R) return false;
    if (c.order === 'R' && !(p.upR >= 0 && p.upL > p.upR)) return false; if (c.order === 'L' && !(p.upL >= 0 && p.upR > p.upL)) return false;
    return true;
  },
  update(m, S, dt) {
    S.pt += dt;
    S.p.forEach((p, i) => {
      p.flash = Math.max(0, p.flash - dt); p.wave += dt; if (p.hearts <= 0) return;
      const L = m.held(i, 'lb') || m.held(i, 'lt') || m.held(i, 'left'), Rf = m.held(i, 'rb') || m.held(i, 'rt') || m.held(i, 'right');
      if (L !== p.L || Rf !== p.Rf) { p.wave = 0; if (!m.bot(i)) Sfx.whoosh(); }
      if (S.phase === 'cmd') { if (L && !p.L && p.upL < 0) p.upL = S.pt + 0.001; if (Rf && !p.Rf && p.upR < 0) p.upR = S.pt + 0.001; if (!L) p.upL = -1; if (!Rf) p.upR = -1; }
      p.L = L; p.Rf = Rf;
    });
    if (S.phase === 'wait' && S.pt > (S.n ? 1.1 : 1.6)) this.newCmd(m, S);
    else if (S.phase === 'cmd' && S.pt > S.window) {
      const c = S.cmd; S.ref = { L: c.L === null ? false : !!c.L, Rf: c.R === null ? false : !!c.R };
      S.p.forEach((p, i) => {
        if (p.hearts <= 0) return; p.ok = this.judge(S, p);
        if (!p.ok) { p.hearts--; p.flash = 0.8; MGH.pop('✖', 200 + i * 293, 330, '#ff6a6a', 50); if (p.hearts <= 0) { p.outT = m.t; Sfx.boom(); MGH.burst(200 + i * 293, 420, ['#fff', m.players[i].color], 24, { speed: 300 }); } else Sfx.bad(); }
        else MGH.pop('✔', 200 + i * 293, 330, '#7f7', 40);
      });
      S.phase = 'wait'; S.pt = 0;
      if (S.p.filter(p => p.hearts > 0).length <= 1 || S.n >= 36) m.finish(this.score(m, S));
    }
  },
  bot(m, S, i) {
    const p = S.p[i], v = m.vin[i]; if (p.hearts <= 0) { v.lb = v.rb = false; return; }
    if (S.phase !== 'cmd') { v.lb = v.rb = false; return; }
    const B = p.bot; if (S.pt < B.at) return;
    if (B.first === 'R') { v.rb = B.tR; v.lb = B.tL && S.pt > B.at + 0.25; }
    else if (B.first === 'L') { v.lb = B.tL; v.rb = B.tR && S.pt > B.at + 0.25; }
    else { v.lb = B.tL; v.rb = B.tR; }
  },
  score(m, S) { return S.p.map(p => p.hearts > 0 ? 1000 + p.hearts : p.outT); },
  fmt(s) { return s >= 1000 ? `still waving (${Math.round(s - 1000)}♥)` : `out at ${s.toFixed(1)}s`; },
  hud(m, S, i) { return S.p[i].hearts > 0 ? '♥'.repeat(S.p[i].hearts) : 'out'; },
  // one flag icon for the command picture
  flagIcon(g, x, y, s, col, up, crosses) {
    g.save(); g.translate(x, y);
    g.strokeStyle = '#8a5a32'; g.lineWidth = 5 * s; g.lineCap = 'round'; g.beginPath(); g.moveTo(-10 * s, 30 * s); g.lineTo(-10 * s, -34 * s); g.stroke();
    g.fillStyle = col; g.beginPath(); g.moveTo(-10 * s, -34 * s); g.quadraticCurveTo(14 * s, -42 * s, 34 * s, -30 * s); g.lineTo(32 * s, -4 * s); g.quadraticCurveTo(12 * s, -12 * s, -10 * s, -6 * s); g.closePath(); g.fill();
    if (up) { g.fillStyle = '#fff'; g.beginPath(); g.moveTo(26 * s, 26 * s); g.lineTo(38 * s, 6 * s); g.lineTo(50 * s, 26 * s); g.fill(); }
    for (let k = 0; k < crosses; k++) { const ox = (k - (crosses - 1) / 2) * 30 * s; g.strokeStyle = '#ff2a2a'; g.lineWidth = 8 * s; g.beginPath(); g.moveTo(ox - 22 * s, -40 * s); g.lineTo(ox + 22 * s, 4 * s); g.moveTo(ox + 22 * s, -40 * s); g.lineTo(ox - 22 * s, 4 * s); g.stroke(); }
    g.restore();
  },
  drawCmd(g, c, t) {
    const red = '#e8323e', blue = '#2f6ae8';
    if (c.id === 'red') this.flagIcon(g, 0, 6, 1.2, red, true, 0);
    else if (c.id === 'blue') this.flagIcon(g, 0, 6, 1.2, blue, true, 0);
    else if (c.id === 'both') { this.flagIcon(g, -50, 6, 1.1, red, true, 0); this.flagIcon(g, 50, 6, 1.1, blue, true, 0); }
    else if (c.id === 'none') { MGH.emoji(g, '🙌', -40, 26, 54); g.strokeStyle = '#ff2a2a'; g.lineWidth = 8; g.beginPath(); g.moveTo(-74, -30); g.lineTo(-6, 30); g.stroke(); MGH.text(g, '⬇', 40, 26, 54, '#5a3a1a', 'center', 'bold'); }
    else if (c.id === 'notred') this.flagIcon(g, 0, 6, 1.2, red, false, 1);
    else if (c.id === 'notblue') this.flagIcon(g, 0, 6, 1.2, blue, false, 1);
    else if (c.id === 'nnred') this.flagIcon(g, 0, 6, 1.2, red, false, 2);
    else if (c.id === 'nnblue') this.flagIcon(g, 0, 6, 1.2, blue, false, 2);
    else { const first = c.order === 'R' ? blue : red, second = c.order === 'R' ? red : blue; MGH.text(g, '1', -110, -20, 26, '#5a3a1a', 'center', 'bold'); this.flagIcon(g, -80, 6, 1, first, true, 0); MGH.text(g, '➜', 0, 18, 46, '#5a3a1a', 'center', 'bold'); MGH.text(g, '2', 50, -20, 26, '#5a3a1a', 'center', 'bold'); this.flagIcon(g, 80, 6, 1, second, true, 0); }
  },
  draw(m, S, g) {
    showStage(g, m.t);
    const rx = 640, ry = 290;
    Char.npc(g, rx, ry, 52, 'ref', { mood: S.phase === 'cmd' ? (S.cmd && (S.cmd.not || S.cmd.nn) ? 'smug' : 'determined') : 'happy', t: m.t, noArms: true });
    this.flagPair(g, rx, ry - 10, 88, S.ref.L, S.ref.Rf, m.t, 1.1);
    if (S.phase === 'cmd' && S.cmd) {
      const k = Math.min(1, S.pt / 0.15);
      g.save(); g.translate(640, 128); g.scale(k, k);
      g.fillStyle = '#fff'; MGH.rr(g, -200, -78, 400, 140, 30); g.fill(); g.beginPath(); g.moveTo(-20, 60); g.lineTo(0, 86); g.lineTo(20, 60); g.fill();
      this.drawCmd(g, S.cmd, m.t);
      MGH.text(g, S.cmd.t, 0, 54, 15, 'rgba(60,40,20,0.6)', 'center', 'bold');
      g.restore();
      const left = 1 - S.pt / S.window; g.fillStyle = 'rgba(0,0,0,0.4)'; MGH.rr(g, 440, 228, 400, 14, 7); g.fill(); g.fillStyle = left > 0.35 ? '#7cf06a' : '#ff6a4a'; MGH.rr(g, 440, 228, 400 * Math.max(0, left), 14, 7); g.fill();
    } else MGH.text(g, S.n ? 'Next…' : 'Get ready — HOLD LB for red, RB for blue!', 640, 130, 30, '#ffe680', 'center', 'bold');
    S.p.forEach((p, i) => {
      const x = 200 + i * 293, y = 480, out = p.hearts <= 0;
      g.fillStyle = Char.shade(m.players[i].color, -0.3); MGH.rr(g, x - 80, y + 70, 160, 60, 10); g.fill(); g.fillStyle = m.players[i].color; MGH.rr(g, x - 80, y + 70, 160, 14, 7); g.fill();
      if (p.flash > 0) MGH.glow(g, x, y, 120, `rgba(255,60,60,${p.flash * 0.6})`);
      Char.draw(g, x, y, 42, m.players[i].el.id, m.players[i].color, { mood: out ? 'out' : p.flash > 0 ? 'hurt' : S.phase === 'cmd' ? 'determined' : 'happy', seed: i * 1.7, noArms: true, alpha: out ? 0.5 : 1 });
      if (!out) this.flagPair(g, x, y - 8, 70, p.L, p.Rf, m.t + i, Math.max(0, 1 - p.wave * 3));
      for (let h = 0; h < 3; h++) MGH.heart(g, x - 30 + h * 30, y + 112, 1.4, h < p.hearts ? '#ff4d6d' : 'rgba(255,255,255,0.25)');
    });
  },
  // two flags on poles at the hero's sides; up = held high, down = lowered
  flagPair(g, x, y, span, L, Rf, t, wave) {
    [[L, -1, '#e8323e'], [Rf, 1, '#2f6ae8']].forEach(([up, s, col]) => {
      const hx = x + s * span * 0.62, hy = y + (up ? -span * 0.45 : span * 0.25), ang = up ? s * 0.15 : s * 2.0;
      g.save(); g.translate(hx, hy); g.rotate(ang);
      g.strokeStyle = '#8a5a32'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, 10); g.lineTo(0, -span * 0.8); g.stroke();
      const fl = Math.sin(t * 9) * 6 * (0.4 + wave);
      g.fillStyle = col; g.beginPath(); g.moveTo(0, -span * 0.8); g.quadraticCurveTo(s * span * 0.3, -span * 0.85 + fl, s * span * 0.55, -span * 0.75 + fl); g.lineTo(s * span * 0.52, -span * 0.45 + fl); g.quadraticCurveTo(s * span * 0.28, -span * 0.52 - fl, 0, -span * 0.46); g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(s > 0 ? 2 : -10, -span * 0.78, 8, span * 0.3);
      g.fillStyle = '#ffe9c8'; g.beginPath(); g.arc(0, 6, 10, 0, 7); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 2; g.stroke();
      g.restore();
    });
  },
});

// ======================================================================== FIREWORK FUSES
MG.def({
  id: 'fuses', name: 'Firework Fuses', type: 'Luck', controls: 'Left/Right + button', dur: 0,
  rows: [['lr', 'Choose a fuse'], ['a', 'Pull it!'], ['b', 'Skip (once)']],
  how: 'A giant firework sits on a crate with fuses hanging down. Take turns pulling one fuse each. Most just fizzle — but ONE lights the rocket, and whoever pulls it gets blasted out! Each player may SKIP one turn per game with B (the next player has to pull instead). After every blast a fresh rocket arrives. Last hero standing wins.',
  wins: 'Last one not blasted.',
  init(m, S) {
    S.alive = [true, true, true, true]; S.outT = [0, 0, 0, 0]; S.skip = [true, true, true, true];
    S.turn = R.int(0, 3); this.rocket(S); S.phase = 'choose'; S.pt = 0; S.sel = 0; S.boom = 0; S.msg = '';
  },
  rocket(S) { const n = S.alive.filter(a => a).length + 2; S.fuses = [...Array(n)].map(() => ({ gone: false })); S.trig = R.int(0, n - 1); S.sel = 0; },
  nextTurn(S) { do { S.turn = (S.turn + 1) % 4; } while (!S.alive[S.turn]); },
  update(m, S, dt) {
    S.pt += dt; const i = S.turn, F = S.fuses, live = F.map((f, k) => f.gone ? -1 : k).filter(k => k >= 0);
    if (S.phase === 'choose') {
      if (!live.includes(S.sel)) S.sel = live[0];
      if (m.pressed(i, 'left')) { const k = live.indexOf(S.sel); S.sel = live[(k + live.length - 1) % live.length]; Sfx.tone(700, 0.03, 'triangle', 0.04); }
      if (m.pressed(i, 'right')) { const k = live.indexOf(S.sel); S.sel = live[(k + 1) % live.length]; Sfx.tone(700, 0.03, 'triangle', 0.04); }
      if (m.pressed(i, 'b') && S.skip[i] && S.alive.filter(a => a).length > 1) { S.skip[i] = false; S.msg = `${m.players[i].name} skips!`; Sfx.whoosh(); this.nextTurn(S); S.pt = 0; return; }
      if (m.pressed(i, 'a') || S.pt > 8) { S.phase = 'sizzle'; S.pt = 0; S.pulled = S.sel; S.msg = ''; Sfx.noise(1.2, 4000, 0.04, 'highpass'); }
    } else if (S.phase === 'sizzle' && S.pt > 1.3) {
      if (S.pulled === S.trig) { S.phase = 'boom'; S.pt = 0; S.alive[i] = false; S.outT[i] = m.t; Sfx.bigThunder ? Sfx.bigThunder() : Sfx.boom(); MGH.shake(18); for (let k = 0; k < 6; k++) MGH.burst(640 + R.range(-200, 200), 160 + R.range(-80, 80), ['#ff5a6e', '#ffd34d', '#5fb8ff', '#7cf06a', '#fff'], 30, { speed: 420, life: 1.4, grav: 120 }); }
      else { S.fuses[S.pulled].gone = true; S.phase = 'phew'; S.pt = 0; Sfx.tone(300, 0.2, 'sine', 0.05, -200); MGH.pop('fizzle…', 640, 420, '#cfd8ff', 30); }
    } else if (S.phase === 'phew' && S.pt > 0.9) { this.nextTurn(S); S.phase = 'choose'; S.pt = 0; }
    else if (S.phase === 'boom' && S.pt > 2.6) {
      if (S.alive.filter(a => a).length <= 1) { m.finish(this.score(m, S)); return; }
      this.rocket(S); this.nextTurn(S); S.phase = 'choose'; S.pt = 0;
    }
  },
  bot(m, S, i) {
    const v = m.vin[i]; v.a = false; v.b = false; v.left = false; v.right = false;
    if (S.phase !== 'choose' || S.turn !== i || S.pt < 0.9) return;
    const live = S.fuses.filter(f => !f.gone).length;
    if (S.skip[i] && live <= 2 && Math.random() < 0.5) { v.b = true; return; }
    if (Math.random() < 0.04) v.right = true;
    if (S.pt > 1.6 + Math.random()) v.a = true;
  },
  score(m, S) { return S.alive.map((a, i) => a ? 1000 : S.outT[i]); },
  fmt(s) { return s >= 1000 ? 'survived!' : `blasted at ${s.toFixed(0)}s`; },
  hud(m, S, i) { return S.alive[i] ? (S.skip[i] ? 'skip ready' : '') : '💥'; },
  draw(m, S, g) {
    // night sky festival
    g.fillStyle = MGH.grad(g, 0, 720, ['#0a0a2a', '#2a1a5a', '#5a2a6a']); g.fillRect(0, 0, 1280, 720);
    MGH.stars(g, m.t, 120, 500);
    for (let k = 0; k < 9; k++) { const x = 60 + k * 145, y = 70 + (k % 2) * 30; g.strokeStyle = 'rgba(255,255,255,0.25)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 72, y - 10); g.quadraticCurveTo(x, y + 20, x + 72, y - 10); g.stroke(); MGH.lantern(g, x, y + 10, 0.6, m.t + k, ['#ff6a5a', '#ffd34d', '#7cf06a'][k % 3]); }
    g.fillStyle = MGH.grad(g, 520, 720, ['#2a5a3a', '#1a3a24']); g.fillRect(0, 520, 1280, 200);
    // crate and rocket
    const cx = 640, cy = 470, shake = S.phase === 'sizzle' ? Math.sin(m.t * 60) * S.pt * 3 : 0;
    g.fillStyle = '#8a5a32'; MGH.rr(g, cx - 120, cy, 240, 90, 8); g.fill(); g.strokeStyle = '#5a3418'; g.lineWidth = 4; g.stroke(); for (const xx of [-40, 40]) { g.beginPath(); g.moveTo(cx + xx, cy); g.lineTo(cx + xx, cy + 90); g.stroke(); }
    MGH.text(g, 'DANGER! ✸', cx, cy + 56, 26, '#ffd34d', 'center', 'bold');
    if (S.phase !== 'boom') {
      g.save(); g.translate(cx + shake, cy);
      g.fillStyle = '#e8323e'; MGH.rr(g, -50, -250, 100, 250, 20); g.fill();
      for (let k = 0; k < 5; k++) { g.fillStyle = k % 2 ? '#fff' : '#ffd34d'; g.save(); g.beginPath(); MGH.rr(g, -50, -250, 100, 250, 20); g.clip(); g.translate(0, -230 + k * 50); g.rotate(-0.4); g.fillRect(-80, -8, 160, 16); g.restore(); }
      g.fillStyle = '#ffd34d'; g.beginPath(); g.moveTo(-60, -240); g.lineTo(0, -320); g.lineTo(60, -240); g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.35)'; MGH.rr(g, -38, -240, 16, 220, 8); g.fill();
      g.restore();
      // fuses
      const F = S.fuses, n = F.length;
      F.forEach((f, k) => {
        if (f.gone) return;
        const fx = cx + (k - (n - 1) / 2) * 46, sel = S.phase === 'choose' && S.sel === k, sway = Math.sin(m.t * 2 + k) * 4;
        g.strokeStyle = sel ? '#ffe680' : '#c8a060'; g.lineWidth = sel ? 7 : 5; g.beginPath(); g.moveTo(fx, cy + 90); g.quadraticCurveTo(fx + sway, cy + 140, fx + sway * 1.5, cy + 180 + (sel ? 6 : 0)); g.stroke();
        g.fillStyle = sel ? '#ffe680' : '#e0c080'; g.beginPath(); g.arc(fx + sway * 1.5, cy + 186 + (sel ? 6 : 0), 11, 0, 7); g.fill();
        MGH.text(g, String(k + 1), fx + sway * 1.5, cy + 192 + (sel ? 6 : 0), 13, '#3a2410', 'center', 'bold');
        if (S.phase === 'sizzle' && S.pulled === k) { const q = S.pt / 1.3, py = cy + 180 - q * 90; MGH.spark(g, fx, py, 10 + Math.random() * 6, '#ffe680'); MGH.burst(fx, py, ['#ffd34d', '#ff8a2a'], 2, { speed: 80, life: 0.4 }); }
      });
    } else { const q = Math.min(1, S.pt / 0.6); g.fillStyle = `rgba(255,240,200,${0.8 * (1 - q)})`; g.fillRect(0, 0, 1280, 720); MGH.text(g, 'KA-BOOM!', 640, 280, 110, '#ffd34d', 'center', 'bold'); }
    // players around the crate
    [0, 1, 2, 3].forEach(i => {
      const x = [190, 420, 860, 1090][i], y = 600, me = S.turn === i && S.phase !== 'boom';
      if (me) MGH.glow(g, x, y - 20, 110, 'rgba(255,230,120,0.4)');
      const blasted = !S.alive[i];
      Char.draw(g, x, y, 40, m.players[i].el.id, m.players[i].color, { mood: blasted ? 'dizzy' : me && S.phase === 'sizzle' ? 'scared' : me ? 'nervous' : 'happy', seed: i * 1.7, look: { x: x < 640 ? 1 : -1, y: 0 }, alpha: blasted ? 0.55 : 1 });
      if (blasted) { g.fillStyle = 'rgba(30,20,20,0.45)'; g.beginPath(); g.arc(x, y - 10, 38, 0, 7); g.fill(); }
      MGH.text(g, m.players[i].name, x, y + 78, 20, m.players[i].color, 'center', 'bold');
      if (me && S.phase === 'choose') MGH.text(g, '▼ your pull', x, y - 86, 18, '#ffe680', 'center', 'bold');
    });
    if (S.msg) MGH.label(g, S.msg, 640, 380, 26, '#fff');
    if (S.phase === 'choose') MGH.text(g, `Fuses left: ${S.fuses.filter(f => !f.gone).length} — one of them is LIVE!`, 640, 60, 22, '#ffe680', 'center', 'bold');
  },
});

// ======================================================================== BALLOON BONANZA (the one mashing game)
MG.def({
  id: 'balloon', name: 'Balloon Bonanza', type: 'Skill', controls: 'mash + B', dur: 0,
  rows: [['a', 'Pump! (tap fast)'], ['b', 'Tie it off']],
  how: 'Three rounds. Tap A as fast as you can to pump up your balloon — but every balloon has a secret bursting point! Watch it wobble and listen for the creaks… press B to tie it off and lock in its size. Pop it and you score nothing that round. When time runs out, untied balloons count as they are.',
  wins: 'Biggest total size over three rounds.',
  init(m, S) { S.round = 0; S.tot = [0, 0, 0, 0]; this.newRound(S); },
  newRound(S) { S.round++; S.b = [0, 1, 2, 3].map(() => ({ size: 10, limit: R.range(70, 100), tied: false, pop: false, wob: 0 })); S.time = 10; S.phase = 'go'; S.pt = 0; },
  update(m, S, dt) {
    S.pt += dt;
    if (S.phase === 'go') {
      S.time -= dt;
      S.b.forEach((b, i) => {
        b.wob = Math.max(0, b.wob - dt * 3);
        if (b.tied || b.pop) return;
        if (m.pressed(i, 'a')) { b.size += R.range(2.2, 3.2); b.wob = 1; if (!m.bot(i)) Sfx.tone(200 + b.size * 4, 0.04, 'sine', 0.04); if (b.size > b.limit - 10 && !m.bot(i) && Math.random() < 0.5) Sfx.tone(90, 0.08, 'sawtooth', 0.03); }
        if (m.pressed(i, 'b')) { b.tied = true; Sfx.tone(880, 0.1, 'triangle', 0.06); MGH.pop('Tied!', 200 + i * 293, 160, '#7f7', 30); }
        if (b.size >= b.limit) { b.pop = true; Sfx.boom(); MGH.burst(200 + i * 293, 330, [m.players[i].color, '#fff'], 30, { speed: 380 }); MGH.shake(6); }
      });
      if (S.time <= 0 || S.b.every(b => b.tied || b.pop)) { S.phase = 'show'; S.pt = 0; S.b.forEach((b, i) => { S.tot[i] += b.pop ? 0 : b.size; }); }
    } else if (S.phase === 'show' && S.pt > 2.4) { if (S.round >= 3) m.finish(this.score(m, S)); else this.newRound(S); }
  },
  bot(m, S, i) {
    const v = m.vin[i], b = S.b[i]; v.a = false; v.b = false;
    if (S.phase !== 'go' || b.tied || b.pop) return;
    b.botStop = b.botStop || R.range(62, 92);
    if (b.size >= b.botStop) { v.b = true; return; }
    if (Math.random() < 0.55) v.a = !m.prev[i].a;
  },
  score(m, S) { return S.tot.map(x => Math.round(x)); },
  fmt(s) { return `${s} puffs`; },
  hud(m, S, i) { const b = S.b[i]; return `${Math.round(S.tot[i])}` + (b.pop ? ' 💥' : b.tied ? ' 🎀' : ''); },
  draw(m, S, g) {
    MGH.scene(g, 'meadow', m.t);
    MGH.text(g, `Round ${S.round} of 3`, 640, 74, 28, '#fff', 'center', 'bold');
    if (S.phase === 'go') { MGH.text(g, `⏱ ${Math.max(0, S.time).toFixed(1)}`, 640, 110, 30, S.time < 3 ? '#ff6a4a' : '#fff', 'center', 'bold'); }
    S.b.forEach((b, i) => {
      const x = 200 + i * 293, base = 560, p = m.players[i], r = 20 + b.size * 1.25, w = b.wob * 6 + (b.size > b.limit - 12 && !b.tied && !b.pop ? Math.sin(m.t * 40) * 3 : 0);
      if (!b.pop) {
        const by = base - 150 - r;
        g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, by + r); g.quadraticCurveTo(x + 10, base - 120, x, base - 80); g.stroke();
        g.save(); g.translate(x, by); g.scale(1 + w * 0.01, 1 - w * 0.01);
        const gr = g.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r); gr.addColorStop(0, Char.shade(p.color, 0.6)); gr.addColorStop(0.6, p.color); gr.addColorStop(1, Char.shade(p.color, -0.35));
        g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, r * 0.92, r, 0, 0, 7); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.ellipse(-r * 0.35, -r * 0.45, r * 0.18, r * 0.28, -0.5, 0, 7); g.fill();
        g.fillStyle = Char.shade(p.color, -0.3); g.beginPath(); g.moveTo(-7, r - 2); g.lineTo(7, r - 2); g.lineTo(0, r + 10); g.fill();
        if (b.tied) MGH.emoji(g, '🎀', 0, r + 8, 22);
        g.restore();
        MGH.text(g, String(Math.round(b.size)), x, by + 8, 24, '#fff', 'center', 'bold');
      } else MGH.text(g, 'POP!', x, base - 230, 48, '#ff6a4a', 'center', 'bold');
      // pump
      g.fillStyle = '#5a6a8a'; MGH.rr(g, x - 70, base - 100, 30, 90, 6); g.fill(); g.fillStyle = '#8a9aba'; const ph = b.wob * 20; g.fillRect(x - 64, base - 120 + ph, 18, 24); g.fillRect(x - 78, base - 126 + ph, 46, 8);
      Char.draw(g, x + 20, base - 30, 34, p.el.id, p.color, { mood: b.pop ? 'shock' : b.tied ? 'proud' : b.size > b.limit - 15 ? 'nervous' : 'effort', seed: i * 1.7, look: { x: -1, y: 0 } });
      MGH.text(g, `Total ${Math.round(S.tot[i])}`, x, base + 60, 20, p.color, 'center', 'bold');
    });
  },
});

// ======================================================================== LUCKY DOORS (secret picks with the button diamond)
MG.def({
  id: 'doors', name: 'Lucky Doors', type: 'Luck', controls: 'A B X Y', dur: 0, noPadSkip: true,
  rows: [['abxy', 'Pick a door (Y up · B right · A down · X left)']],
  how: 'Four doors stand in a diamond — the TOP door is Y, RIGHT is B, BOTTOM is A and LEFT is X (on keyboards, use the arrow / stick directions). Everyone secretly picks a door. Behind them: a 💎 (5), a bag of coins (3), a banana (1) and a GHOST (−3)! If several heroes pick the same door they share the prize (each gets half, rounded down — a ghost scares all of them). One door glows before you choose: it is never the ghost. Six rounds.',
  wins: 'Most points after six rounds.',
  init(m, S) { S.pts = [0, 0, 0, 0]; S.round = 0; this.next(S); },
  next(S) { S.round++; S.prize = R.shuffle([5, 3, 1, -3]); S.safe = R.pick([0, 1, 2, 3].filter(d => S.prize[d] !== -3)); S.pick = [-1, -1, -1, -1]; S.phase = 'pick'; S.pt = 0; },
  update(m, S, dt) {
    S.pt += dt;
    if (S.phase === 'pick') {
      m.players.forEach((p, i) => {
        if (S.pick[i] >= 0) return;
        const d = m.pressed(i, 'y') || m.pressed(i, 'up') ? 0 : m.pressed(i, 'b') || m.pressed(i, 'right') ? 1 : m.pressed(i, 'a') || m.pressed(i, 'down') ? 2 : m.pressed(i, 'x') || m.pressed(i, 'left') ? 3 : -1;
        if (d >= 0) { S.pick[i] = d; Sfx.click(); }
      });
      if (S.pick.every(p => p >= 0) || S.pt > 7) { S.pick = S.pick.map(p => p >= 0 ? p : R.int(0, 3)); S.phase = 'open'; S.pt = 0; Sfx.drum(0); }
    } else if (S.phase === 'open') {
      if (S.pt > 1.0 && !S.paid) {
        S.paid = true;
        [0, 1, 2, 3].forEach(d => { const who = [0, 1, 2, 3].filter(i => S.pick[i] === d); const v = S.prize[d]; who.forEach(i => { const gain = v < 0 ? v : who.length > 1 ? Math.floor(v / 2) : v; S.pts[i] += gain; S.gain = S.gain || []; S.gain[i] = gain; }); });
        if (S.prize[S.pick.find(() => true)] !== undefined) Sfx.coin();
      }
      if (S.pt > 3.4) { S.paid = false; S.gain = []; if (S.round >= 6) m.finish(this.score(m, S)); else this.next(S); }
    }
  },
  bot(m, S, i) {
    const v = m.vin[i]; ['a', 'b', 'x', 'y'].forEach(k => { v[k] = false; });
    if (S.phase !== 'pick' || S.pick[i] >= 0 || S.pt < R.range(0.8, 3)) return;
    const d = Math.random() < 0.45 ? S.safe : R.int(0, 3); v[['y', 'b', 'a', 'x'][d]] = true;
  },
  score(m, S) { return S.pts.slice(); },
  fmt(s) { return `${s} pts`; },
  hud(m, S, i) { return `${S.pts[i]} pts` + (S.phase === 'pick' && S.pick[i] >= 0 ? ' ✔' : ''); },
  draw(m, S, g) {
    g.fillStyle = MGH.grad(g, 0, 720, ['#3a1a5a', '#6a2a7a', '#2a1040']); g.fillRect(0, 0, 1280, 720);
    MGH.motes(g, m.t, 'rgba(255,220,150,0.5)', 30, 20, 2);
    MGH.label(g, `Round ${S.round} of 6`, 160, 76, 22, '#ffe680');
    const pos = [[640, 190], [880, 370], [640, 550], [400, 370]], keys = [['Y', '#e8b82e'], ['B', '#e8453c'], ['A', '#3fc35a'], ['X', '#3f8ee8']];
    pos.forEach(([x, y], d) => {
      const open = S.phase === 'open' && S.pt > 0.4 + d * 0.12, safe = S.phase === 'pick' && S.safe === d;
      if (safe) MGH.glow(g, x, y, 120, `rgba(140,255,170,${0.35 + 0.15 * Math.sin(m.t * 4)})`);
      g.fillStyle = '#3a2410'; MGH.rr(g, x - 66, y - 92, 132, 170, 60); g.fill();
      if (open) {
        g.fillStyle = '#1a0a08'; MGH.rr(g, x - 58, y - 84, 116, 154, 54); g.fill();
        const v = S.prize[d]; MGH.emoji(g, v === 5 ? '💎' : v === 3 ? '💰' : v === 1 ? '🍌' : '👻', x, y - 6, 64, v < 0 ? Math.sin(m.t * 10) * 0.2 : 0);
        MGH.text(g, v > 0 ? '+' + v : String(v), x, y + 60, 24, v < 0 ? '#ff6a6a' : '#ffe680', 'center', 'bold');
      } else {
        g.fillStyle = MGH.grad(g, y - 84, y + 70, ['#c88a4a', '#8a5a2a']); MGH.rr(g, x - 58, y - 84, 116, 154, 54); g.fill();
        g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 3; for (const dx of [-28, 0, 28]) { g.beginPath(); g.moveTo(x + dx, y - 70); g.lineTo(x + dx, y + 68); g.stroke(); }
        g.fillStyle = '#ffd34d'; g.beginPath(); g.arc(x + 36, y, 7, 0, 7); g.fill();
      }
      g.fillStyle = keys[d][1]; g.beginPath(); g.arc(x, y - 112, 22, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 3; g.stroke(); MGH.text(g, keys[d][0], x, y - 104, 24, '#fff', 'center', 'bold');
      // who picked it (revealed)
      if (S.phase === 'open') { const who = [0, 1, 2, 3].filter(i => S.pick[i] === d); who.forEach((i, k) => { const hx = x + (k - (who.length - 1) / 2) * 50; Char.draw(g, hx, y + 120, 20, m.players[i].el.id, m.players[i].color, { mood: S.paid ? (S.gain && S.gain[i] < 0 ? 'scared' : 'cheer') : 'nervous', seed: i, noFeet: true }); }); }
    });
    // players' picked badges (hidden choice)
    m.players.forEach((p, i) => {
      const x = 110 + (i % 2) * 1060, y = 200 + Math.floor(i / 2) * 300;
      Char.draw(g, x, y, 40, p.el.id, p.color, { mood: S.phase === 'pick' ? (S.pick[i] >= 0 ? 'smug' : 'nervous') : 'determined', seed: i * 1.7, look: { x: x < 640 ? 1 : -1, y: 0 } });
      MGH.text(g, `${p.name}  ${S.pts[i]}`, x, y + 80, 20, p.color, 'center', 'bold');
      if (S.phase === 'pick') MGH.text(g, S.pick[i] >= 0 ? '✔ picked' : 'choosing…', x, y - 76, 16, S.pick[i] >= 0 ? '#7f7' : '#ddd', 'center', 'bold');
    });
    if (S.phase === 'pick') MGH.text(g, '🟢 the glowing door is never the ghost', 640, 700, 16, '#bfffd0', 'center', 'bold');
  },
});
