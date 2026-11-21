'use strict';
// Tumble Tower — the table-top block tower: pick a block, ease it out, stack it on top. Don't be the one who topples it!

MG.def({
  id: 'tumble', name: 'Tumble Tower', type: 'Strategy', controls: 'Move + button', dur: 0,
  rows: [['pad', 'Pick a block'], ['a', 'Hold to ease it out (let go to rest)']],
  how: 'Take turns pulling one block out of the tower and stacking it on top. On your turn, move with the stick or d-pad to pick a block (not from the top two layers), then HOLD A to ease it out. Watch the friction needle: if it hits the red the block SCRAPES and the whole tower shudders — let go of A to let it settle, then keep pulling. Think before you pull: a layer with only one block left, or only a side block, makes the tower lean dangerously. Whoever topples the tower loses — everyone else scores for every clean pull!',
  wins: 'Don\'t topple it! Survivors rank by clean pulls.',
  BW: 70, BH: 24, BASE: 640, CX: 640,
  init(m, S) {
    S.L = []; for (let k = 0; k < 15; k++) S.L.push([1, 1, 1]); S.top = [0, 0, 0];
    S.turn = R.int(0, 3); S.pulls = [0, 0, 0, 0]; S.shake = 0; S.ph = 'pick'; S.pt = 0; S.fall = null; S.loser = -1;
    S.sel = { r: 5, c: 1 }; S.prog = 0; S.needle = 0; S.msg = ''; S.msgT = 0; S.ax = '';
    this.risk(S); this.botPlan(S);
  },
  layerRisk(l) { const n = l[0] + l[1] + l[2]; if (n === 3) return 0; if (n === 2) return l[1] ? 0.13 : 0.04; return l[1] ? 0.32 : 0.95; },
  risk(S) { let R_ = 0; const n = S.L.length; S.L.forEach((l, k) => { R_ += this.layerRisk(l) * (0.6 + (n - k) / n); }); S.R = R_; return R_; },
  canPull(S, r, c) { return r < S.L.length - 1 && S.L[r][c] === 1 && S.L[r].reduce((a, b) => a + b, 0) > 1; },
  tight(S, r) { return 0.55 + (S.L.length - r) / S.L.length * 0.9; },
  update(m, S, dt) {
    S.pt += dt; S.msgT -= dt; S.shake = Math.max(0, S.shake - dt * 0.12);
    if (S.ph === 'fall') { S.fall.forEach(b => { b.vy += 1400 * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.a += b.va * dt; if (b.y > 700) { b.y = 700; b.vy *= -0.3; b.vx *= 0.7; b.va *= 0.6; } }); if (S.pt > 3) m.finish(this.score(m, S)); return; }
    const i = S.turn;
    if (S.ph === 'pick') {
      const a = m.axis(i), now = a.x < -0.6 ? 'left' : a.x > 0.6 ? 'right' : a.y < -0.6 ? 'up' : a.y > 0.6 ? 'down' : '';
      const d = (m.bot(i) ? null : ['left', 'right', 'up', 'down'].find(k => m.pressed(i, k))) || (now && now !== S.ax ? now : null); S.ax = now;
      if (d === 'up') S.sel.r = Math.min(S.L.length - 2, S.sel.r + 1); if (d === 'down') S.sel.r = Math.max(0, S.sel.r - 1);
      if (d === 'left') S.sel.c = Math.max(0, S.sel.c - 1); if (d === 'right') S.sel.c = Math.min(2, S.sel.c + 1);
      if (d) Sfx.tone(700, 0.03, 'triangle', 0.02);
      if (m.held(i, 'a') && this.canPull(S, S.sel.r, S.sel.c)) { S.ph = 'pull'; S.prog = 0; S.needle = 0; }
      else if (m.pressed(i, 'a')) { S.msg = 'can\'t pull that one!'; S.msgT = 1; Sfx.bad(); }
      if (S.pt > 12) { const ok = this.options(S); if (ok.length) { const o = R.pick(ok); S.sel = { r: o.r, c: o.c }; S.ph = 'pull'; S.prog = 0; S.needle = 0.6; S.msg = 'too slow — yank!'; S.msgT = 1; } }
      return;
    }
    if (S.ph === 'pull') {
      const tt = this.tight(S, S.sel.r) * (S.sel.c === 1 ? 1.15 : 0.9);
      if (m.held(i, 'a')) { S.prog += dt * 0.42; S.needle += dt * tt * (0.8 + Math.sin(m.t * 9) * 0.35); if (Math.random() < dt * 4) Sfx.noise(0.05, 2500, 0.012, 'highpass'); }
      else S.needle = Math.max(0, S.needle - dt * 1.3);
      if (S.needle >= 1) { S.needle = 0.45; S.shake += 0.28; S.msg = 'SCRAPE!'; S.msgT = 0.8; Sfx.thud(); MGH.shake(5); }
      if (S.pt > 20) { S.prog = 1; S.shake += 0.3; }
      if (this.risk(S) + S.shake > 1.15 + S.L.length * 0.002) { this.topple(m, S); return; }
      if (S.prog >= 1) {
        S.L[S.sel.r][S.sel.c] = 0;
        const k = S.top.indexOf(0); S.top[k] = 1; if (S.top.every(b => b)) { S.L.push([1, 1, 1]); S.top = [0, 0, 0]; }
        S.pulls[i]++; Sfx.tone(900, 0.08, 'triangle', 0.04); Sfx.thud();
        const R_ = this.risk(S);
        if (R_ + S.shake > 1.0 + Math.random() * 0.25) { this.topple(m, S); return; }
        S.msg = R_ > 0.7 ? 'it\'s swaying…' : 'clean pull!'; S.msgT = 1;
        S.turn = (S.turn + 1) % 4; S.ph = 'pick'; S.pt = 0; S.sel = { r: Math.min(S.sel.r, S.L.length - 2), c: 1 }; this.botPlan(S);
      }
    }
  },
  topple(m, S) {
    S.ph = 'fall'; S.pt = 0; S.loser = S.turn; Sfx.boom(); MGH.shake(16); Sfx.crowd && Sfx.crowd('cheer');
    S.fall = []; const lean = Math.random() < 0.5 ? -1 : 1;
    S.L.forEach((l, r) => l.forEach((b, c) => { if (b) { const p = this.blockPos(S, r, c); S.fall.push({ x: p.x, y: p.y, vx: lean * R.range(60, 360) * (r / S.L.length + 0.3), vy: R.range(-300, 0), a: 0, va: R.range(-6, 6), lay: r % 2 }); } }));
  },
  options(S) { const o = []; S.L.forEach((l, r) => l.forEach((b, c) => { if (this.canPull(S, r, c)) { const save = l[c]; l[c] = 0; const R_ = this.risk(S); l[c] = save; o.push({ r, c, R: R_ }); } })); return o; },
  botPlan(S) { S.plan = null; S.bThr = R.range(0.55, 0.9); S.bRest = false; },
  bot(m, S, i) {
    const v = m.vin[i]; v.a = false; v.ax = v.ay = 0; if (S.turn !== i || S.ph === 'fall') return;
    if (S.ph === 'pick') {
      if (!S.plan) { const o = this.options(S).map(q => Object.assign(q, { sc: q.R + this.tight(S, q.r) * 0.05 + R.range(0, 0.12) })).sort((a, b) => a.sc - b.sc); S.plan = o[0]; S.thinkT = R.range(0.6, 1.6); }
      if (!S.plan) return;
      S.thinkT -= 1 / 60; if (S.thinkT > 0) return;
      if (S.sel.r !== S.plan.r) { if (!S.bStep || S.bStep-- <= 0) { v.ay = S.sel.r < S.plan.r ? -1 : 1; S.bStep = 4; } return; }
      if (S.sel.c !== S.plan.c) { if (!S.bStep || S.bStep-- <= 0) { v.ax = S.sel.c < S.plan.c ? 1 : -1; S.bStep = 4; } return; }
      v.a = true; return;
    }
    if (S.ph === 'pull') { if (S.bRest) { if (S.needle < 0.15) S.bRest = false; return; } if (S.needle > S.bThr) { S.bRest = true; S.bThr = R.range(0.55, 0.95); return; } v.a = true; }
  },
  score(m, S) { return [0, 1, 2, 3].map(i => i === S.loser ? -1 : S.pulls[i]); },
  fmt(s) { return s < 0 ? 'TOPPLED IT!' : `${s} clean pulls`; },
  hud(m, S, i) { return S.loser === i ? '💥 toppled' : `${S.pulls[i]} pulls` + (S.turn === i && S.ph !== 'fall' ? ' 👉' : ''); },
  blockPos(S, r, c) { const y = this.BASE - (r + 0.5) * this.BH, x = this.CX + (c - 1) * this.BW; return { x, y }; },
  drawBlock(g, x, y, w, h, lay, hl, col) {
    g.fillStyle = MGH.grad(g, y - h / 2, y + h / 2, lay ? ['#f4c890', '#d8a060'] : ['#e8b878', '#c88a48']); MGH.rr(g, x - w / 2 + 1, y - h / 2 + 1, w - 2, h - 2, 4); g.fill();
    g.strokeStyle = 'rgba(90,50,20,0.35)'; g.lineWidth = 1.5; g.stroke();
    if (lay) { g.strokeStyle = 'rgba(150,100,50,0.35)'; g.beginPath(); g.arc(x, y, h * 0.3, 0, 7); g.stroke(); } else { g.strokeStyle = 'rgba(150,100,50,0.25)'; for (const dy of [-4, 3]) { g.beginPath(); g.moveTo(x - w / 2 + 6, y + dy); g.lineTo(x + w / 2 - 6, y + dy + 1); g.stroke(); } }
    if (hl) { g.strokeStyle = col; g.lineWidth = 4; MGH.rr(g, x - w / 2 - 1, y - h / 2 - 1, w + 2, h + 2, 5); g.stroke(); }
  },
  draw(m, S, g) {
    // a cosy games room with a wooden table
    g.fillStyle = MGH.grad(g, 0, 720, ['#3a2a4a', '#5a3a4a', '#4a2a2a']); g.fillRect(0, 0, 1280, 720);
    for (let k = 0; k < 6; k++) { g.fillStyle = 'rgba(255,220,150,0.05)'; g.fillRect(k * 230 + 40, 0, 120, 720); }
    MGH.glow(g, 640, 120, 380, 'rgba(255,210,140,0.25)');
    g.fillStyle = '#2a1a10'; g.fillRect(620, 0, 40, 40); g.fillStyle = '#ffe8b0'; g.beginPath(); g.arc(640, 50, 18, 0, 7); g.fill();
    g.fillStyle = MGH.grad(g, 640, 720, ['#8a5a30', '#5a3a1a']); g.fillRect(0, 640, 1280, 80); g.fillStyle = '#a8703a'; g.fillRect(0, 640, 1280, 8);
    const pl = S.turn, col = m.players[pl].color;
    if (S.ph === 'fall') {
      S.fall.forEach(b => { g.save(); g.translate(b.x, b.y); g.rotate(b.a); this.drawBlock(g, 0, 0, this.BW, this.BH, b.lay, false); g.restore(); });
    } else {
      const sway = Math.sin(m.t * 2.2) * S.R * 0.012 + Math.sin(m.t * 23) * S.shake * 0.02;
      g.save(); g.translate(this.CX, this.BASE); g.rotate(sway); g.translate(-this.CX, -this.BASE);
      MGH.shadow(g, this.CX, this.BASE + 4, this.BW * 1.8, 0.4);
      S.L.forEach((l, r) => l.forEach((b, c) => {
        const p = this.blockPos(S, r, c), sel = (S.ph === 'pick' || S.ph === 'pull') && S.sel.r === r && S.sel.c === c;
        if (!b) { g.fillStyle = 'rgba(20,10,5,0.55)'; g.fillRect(p.x - this.BW / 2 + 4, p.y - this.BH / 2 + 4, this.BW - 8, this.BH - 8); if (sel) { g.strokeStyle = col; g.lineWidth = 3; g.setLineDash([4, 4]); g.strokeRect(p.x - this.BW / 2, p.y - this.BH / 2, this.BW, this.BH); g.setLineDash([]); } return; }
        if (sel && S.ph === 'pull') { const k = S.prog; g.save(); g.translate(p.x, p.y + k * 30); g.scale(1 + k * 0.4, 1 + k * 0.4); g.globalAlpha = 1 - k * 0.3; this.drawBlock(g, 0, 0, this.BW, this.BH, r % 2, true, col); g.restore(); return; }
        const bad = sel && !this.canPull(S, r, c);
        this.drawBlock(g, p.x, p.y, this.BW, this.BH, r % 2, sel, bad ? '#ff4a4a' : col);
      }));
      S.top.forEach((b, c) => { if (b) { const p = this.blockPos(S, S.L.length, c); this.drawBlock(g, p.x, p.y, this.BW, this.BH, S.L.length % 2, false); } });
      // lean warning: a layer with a lonely side block glows red
      S.L.forEach((l, r) => { const rk = this.layerRisk(l); if (rk > 0.3) { const p = this.blockPos(S, r, 1); g.fillStyle = `rgba(255,60,40,${0.15 + 0.1 * Math.sin(m.t * 6)})`; g.fillRect(p.x - this.BW * 1.5, p.y - this.BH / 2, this.BW * 3, this.BH); } });
      g.restore();
    }
    // stability meter
    const st = Math.min(1, (S.R || 0) + S.shake);
    g.fillStyle = 'rgba(0,0,0,0.45)'; MGH.rr(g, 1010, 150, 44, 320, 14); g.fill();
    g.fillStyle = st > 0.75 ? '#ff4a4a' : st > 0.45 ? '#ffb13d' : '#7cf06a'; g.fillRect(1016, 464 - 308 * st, 32, 308 * st);
    MGH.text(g, 'wobble', 1032, 140, 16, '#ffe8c8', 'center', 'bold');
    // the friction needle while pulling
    if (S.ph === 'pull') {
      const x0 = 160, y0 = 210, w = 260;
      g.fillStyle = 'rgba(0,0,0,0.5)'; MGH.rr(g, x0 - 10, y0 - 40, w + 20, 110, 14); g.fill();
      g.fillStyle = '#7cf06a'; g.fillRect(x0, y0, w * 0.6, 16); g.fillStyle = '#ffb13d'; g.fillRect(x0 + w * 0.6, y0, w * 0.25, 16); g.fillStyle = '#ff4a4a'; g.fillRect(x0 + w * 0.85, y0, w * 0.15, 16);
      g.fillStyle = '#fff'; g.fillRect(x0 + w * Math.min(1, S.needle) - 3, y0 - 6, 6, 28);
      MGH.text(g, 'friction', x0 + w / 2, y0 - 14, 16, '#fff', 'center', 'bold');
      g.fillStyle = 'rgba(255,255,255,0.2)'; g.fillRect(x0, y0 + 34, w, 10); g.fillStyle = col; g.fillRect(x0, y0 + 34, w * S.prog, 10);
      MGH.text(g, m.held(pl, 'a') ? 'easing it out…' : 'resting', x0 + w / 2, y0 + 62, 14, '#ffe8c8', 'center');
    }
    // players around the table
    const seats = [[180, 560], [360, 600], [920, 600], [1100, 560]];
    m.players.forEach((p, i) => {
      const [x, y] = seats[i], my = S.turn === i && S.ph !== 'fall';
      if (my) MGH.glow(g, x, y - 20, 70, p.color + '66');
      const mood = S.ph === 'fall' ? (i === S.loser ? 'cry' : 'laugh') : my ? (S.ph === 'pull' ? (S.needle > 0.7 ? 'scared' : 'effort') : 'nervous') : (S.R + S.shake > 0.7 ? 'scared' : 'happy');
      Char.draw(g, x, y, 40, p.el.id, p.color, { mood: MGH.persona(mood, p.el.id), seed: i * 1.7, look: { x: x < 640 ? 1 : -1, y: -0.3 }, hands: my && S.ph === 'pull' ? { n: { x: x < 640 ? 1.2 : -1.2, y: -0.6, d: x < 640 ? 0 : 180, o: true, m: true }, f: { x: 0.6, y: 0.3, d: 90, o: true, m: false } } : undefined });
      MGH.text(g, `${p.name}  ${S.pulls[i]}`, x, y + 76, 18, p.color, 'center', 'bold');
      if (my) MGH.text(g, '▼ your turn', x, y - 76, 16, '#ffe680', 'center', 'bold');
    });
    if (S.ph === 'pick') MGH.label(g, `${m.players[pl].name}: pick a block (stick), then HOLD A   ${Math.max(0, 12 - S.pt).toFixed(0)}s`, 640, 690, 20, col);
    if (S.msgT > 0) MGH.label(g, S.msg, 640, 100, 26, S.msg === 'SCRAPE!' || S.msg.includes('yank') ? '#ff8a8a' : '#ffe680');
    if (S.ph === 'fall') MGH.label(g, `CRASH! ${m.players[S.loser].name} toppled the tower!`, 640, 120, 36, '#ff8a3d');
  },
});
