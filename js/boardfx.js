'use strict';
// Board juice: flying coins and stars, landing bursts, dust puffs, rolling HUD counters, emotes,
// timing "dodge" moments against thieves, a bandit and magpies you can see, and picture-first banners.
(() => {
  const FX = [];            // world-space particles
  const EMO = ['😄', '😂', '😠', '😱', '👏', '😎', '😭', '🔥'];
  const lerp = (a, b, q) => a + (b - a) * q;
  const tokPos = i => { const T = Board.tok[i]; return { x: T.x, y: T.y - 70 }; };
  const live = () => !Settings.test && Board.game;

  // ------------------------------------------------------------------ spawners
  Board.flyCoins = function (from, to, n, o = {}) { if (!live()) return; n = Math.min(n, 15);
    for (let k = 0; k < n; k++) FX.push({ k: 'coin', a: { ...from }, b: { ...to }, t: -k * 0.06, d: o.d || 0.7, h: o.h || R.range(80, 150), s: R.range(-1, 1), ding: o.ding !== false }); };
  Board.flyStar = function (from, to, o = {}) { if (!live()) return; FX.push({ k: 'star', a: { ...from }, b: { ...to }, t: 0, d: o.d || 1.0, h: 220 }); };
  Board.burst = function (x, y, col = '#ffe680', n = 14, sp = 260) { if (!live()) return; for (let k = 0; k < n; k++) { const a = Math.random() * 6.28, v = R.range(0.4, 1) * sp; FX.push({ k: 'spark', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.7 - sp * 0.4, t: 0, d: R.range(0.5, 0.9), col, r: R.range(3, 6) }); } };
  Board.ring = function (x, y, col = '#fff') { if (live()) FX.push({ k: 'ring', x, y, t: 0, d: 0.6, col }); };
  Board.dust = function (x, y) { if (!live()) return; for (let k = 0; k < 5; k++) FX.push({ k: 'dust', x: x + R.range(-14, 14), y: y + 4, vx: R.range(-50, 50), vy: R.range(-30, -10), t: 0, d: R.range(0.4, 0.7), r: R.range(5, 9) }); };
  Board.confetti = function (x, y, n = 40) { if (!live()) return; const C = ['#ff4f7a', '#ffd34d', '#6ae0ff', '#8aff7a', '#c88aff']; for (let k = 0; k < n; k++) { const a = -Math.PI / 2 + R.range(-1.1, 1.1), v = R.range(250, 520); FX.push({ k: 'conf', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, d: R.range(1.2, 1.8), col: R.pick(C), rot: Math.random() * 6, vr: R.range(-12, 12) }); } };
  Board.emote = function (i, e) { if (!live()) return; Board.emo = Board.emo || {}; Board.emo[i] = { e: e || R.pick(EMO), t: 0 }; Sfx.tone(600 + i * 120, 0.06, 'triangle', 0.03); };
  // the visible thieves
  Board.bandit = function (i, n) { if (!live()) return; const T = Board.tok[i]; FX.push({ k: 'bandit', x: T.x, y: T.y, t: 0, d: 1.9, n, i }); };
  Board.magpie = function (i) { if (!live()) return; const T = Board.tok[i]; FX.push({ k: 'bird', x: T.x, y: T.y - 80, t: 0, d: 1.6, dir: Math.random() < 0.5 ? -1 : 1 }); };

  // a timing moment: a ring shrinks onto the token; press Ⓐ when it lines up. Resolves true on a good press.
  Board.qte = function (i, label = 'DODGE!') {
    const p = Board.game.P(i);
    return new Promise(res => {
      if (Settings.test) { res(Math.random() < 0.35); return; }
      Board.ui.qte = { i, t: 0, d: 1.25, label, human: p.human, botHit: Math.random() < 0.35 ? R.range(0.95, 1.1) : R.range(0.4, 0.7), res, done: null };
    });
  };

  // ------------------------------------------------------------------ hooks into the game
  const P2 = BoardGame.prototype, gain0 = P2.gain;
  P2.gain = function (i, n, why) {
    const T = Board.tok && Board.tok[i];
    if (T && n > 0) { Board.flyCoins({ x: T.x + R.range(-30, 30), y: T.y - 220 }, tokPos(i), n, { d: 0.55, h: 40 }); Board.burst(T.x, T.y - 70, '#ffe680', 8, 160); }
    if (T && n < 0) { const k = Math.min(this.P(i).coins, -n); for (let q = 0; q < Math.min(k, 12); q++) FX.push({ k: 'drop', x: T.x, y: T.y - 70, vx: R.range(-160, 160), vy: R.range(-260, -120), t: -q * 0.03, d: 0.9 }); if (k) Board.react(i, 'bad'); }
    return gain0.call(this, i, n, why);
  };
  // rivals react to someone's luck with an emote now and then
  Board.react = function (i, kind) { if (!live() || Math.random() < 0.45) return; const G = Board.game, o = R.pick(G.players.filter(q => q.i !== i && !q.human)); if (o) setTimeout(() => Board.emote(o.i, kind === 'bad' ? R.pick(['😂', '😎', '👏']) : R.pick(['😠', '😱', '😭'])), 250); };
  const pulse0 = Board.pulse.bind(Board);
  Board.pulse = function (pos) { pulse0(pos); const s = BD.spaces[pos]; if (!s || !live()) return; const T = BD.SPACE[s.type] || BD.SPACE.blue; Board.ring(s.x, s.y, T.col); Board.burst(s.x, s.y - 6, T.col, 12, 200); Board.dust(s.x, s.y); Board.spaceBump = { pos, t: 0 }; };
  // dust where every hop lands, little idle jigs for tokens that wait
  const upd0 = Board.update;
  Board.update = function (dt) {
    const was = this.tok ? this.tok.map(T => !!T.to) : [];
    upd0.call(this, dt);
    if (!this.game || this.paused) return;
    this.tok.forEach((T, i) => { if (was[i] && !T.to) Board.dust(T.x, T.y);
      if (!T.to) { if (T.jig === undefined || (T.jig <= 0 && Math.random() < dt * 0.12 && this.current !== i)) T.jig = T.jig === undefined ? 0 : 1; if (T.jig > 0) { T.jig = Math.max(0, T.jig - dt * 2.6); T.hop = Math.sin((1 - T.jig) * Math.PI) * 10; } } });
    // particles
    for (const f of FX) { f.t += dt; if (f.t < 0) continue;
      if (f.k === 'spark' || f.k === 'dust' || f.k === 'drop' || f.k === 'conf') { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += (f.k === 'dust' ? -20 : f.k === 'conf' ? 380 : 700) * dt; if (f.k === 'conf') { f.vx *= 0.985; f.rot += f.vr * dt; } }
      if ((f.k === 'coin') && f.ding && f.t >= f.d && !f.dinged) { f.dinged = true; Sfx.tone(1400 + Math.random() * 300, 0.04, 'triangle', 0.025); } }
    for (let k = FX.length - 1; k >= 0; k--) if (FX[k].t > FX[k].d + 0.05) FX.splice(k, 1);
    if (this.spaceBump) { this.spaceBump.t += dt; if (this.spaceBump.t > 0.5) this.spaceBump = null; }
    if (this.emo) for (const k in this.emo) { this.emo[k].t += dt; if (this.emo[k].t > 1.8) delete this.emo[k]; }
    if (this.ui.bandit) this.ui.bandit.t = (this.ui.bandit.t || 0) + dt;
    // emotes: any human may press Y (or the Y-button) while it is not a menu moment
    this.game.players.forEach(p => { if (!p.human) return; const E = this.devOf(p.i); if (E.y) Board.emote(p.i, EMO[((this.emo && this.emo[p.i] ? EMO.indexOf(this.emo[p.i].e) : -1) + 1) % EMO.length]); });
    // the timing ring
    const Q = this.ui.qte; if (Q) { Q.t += dt; const q = Q.t / Q.d;
      if (!Q.done) { const press = Q.human ? this.devOf(Q.i).a : q >= Q.botHit;
        if (press) { Q.done = Math.abs(q - 1) < 0.14 ? 'good' : 'miss'; Q.at = Q.t; if (Q.done === 'good') { Sfx.tone(1100, 0.12, 'triangle', 0.07); const T = this.tok[Q.i]; Board.burst(T.x, T.y - 70, '#9fffa0', 16, 260); } else Sfx.tone(200, 0.15, 'sawtooth', 0.05); }
        else if (q > 1.25) { Q.done = 'miss'; Q.at = Q.t; Sfx.tone(200, 0.15, 'sawtooth', 0.05); } }
      else if (Q.t - Q.at > 0.55) { this.ui.qte = null; Q.res(Q.done === 'good'); } }
    // rolling HUD numbers
    this.shown = this.shown || []; this.game.players.forEach((p, i) => { const S = this.shown[i] = this.shown[i] || { c: p.coins, s: p.stars, bc: 0, bs: 0 };
      if (S.c !== p.coins) { S.acc = (S.acc || 0) + dt; if (S.acc > 0.045) { S.acc = 0; S.c += Math.sign(p.coins - S.c) * Math.max(1, Math.floor(Math.abs(p.coins - S.c) / 8)); S.bc = 1; S.up = p.coins > S.c; } }
      if (S.s !== p.stars) { S.up2 = p.stars > S.s; S.s = p.stars; S.bs = 1; }
      S.bc = Math.max(0, S.bc - dt * 3); S.bs = Math.max(0, S.bs - dt * 1.5); });
  };

  // ------------------------------------------------------------------ drawing in the world
  const coinG = (g, x, y, r, spin) => { const w = Math.abs(Math.cos(spin)) * r + 1.5; g.fillStyle = '#b8860b'; g.beginPath(); g.ellipse(x + 1, y + 1, w, r, 0, 0, 7); g.fill(); g.fillStyle = '#ffd34d'; g.beginPath(); g.ellipse(x, y, w, r, 0, 0, 7); g.fill(); g.fillStyle = '#fff6b0'; g.beginPath(); g.ellipse(x - w * 0.3, y - r * 0.3, w * 0.3, r * 0.3, 0, 0, 7); g.fill(); };
  Board.coinG = coinG;
  const banditG = (g, x, y, t, run, dir) => { // a sneaky masked raccoon with a loot sack
    g.save(); g.translate(x, y); g.scale(dir * 1.45, 1.45); const b = run ? Math.abs(Math.sin(t * 18)) * 6 : 0;
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(0, 4, 26, 8, 0, 0, 7); g.fill();
    g.translate(0, -b);
    g.fillStyle = '#6a6a7a'; for (let k = 0; k < 4; k++) { g.beginPath(); g.ellipse(-30 - k * 7, -30 + k * 4, 7, 6, 0, 0, 7); g.fill(); g.fillStyle = k % 2 ? '#6a6a7a' : '#2a2a3a'; }
    g.fillStyle = '#7a7a8a'; g.beginPath(); g.ellipse(0, -28, 22, 24, 0, 0, 7); g.fill(); g.strokeStyle = '#2a1a3a'; g.lineWidth = 2.5; g.stroke();
    g.fillStyle = '#d8d8e0'; g.beginPath(); g.ellipse(4, -22, 12, 12, 0, 0, 7); g.fill();
    g.fillStyle = '#7a7a8a'; g.beginPath(); g.arc(2, -58, 20, 0, 7); g.fill(); g.stroke();
    for (const s of [-1, 1]) { g.fillStyle = '#5a5a6a'; g.beginPath(); g.moveTo(2 + s * 10, -72); g.lineTo(2 + s * 18, -86); g.lineTo(2 + s * 20, -68); g.fill(); }
    g.fillStyle = '#1a1a2a'; MGH.rr(g, -16, -66, 38, 12, 6); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(-4, -60, 3.5, 0, 7); g.arc(12, -60, 3.5, 0, 7); g.fill(); g.fillStyle = '#1a1a2a'; g.beginPath(); g.arc(-3, -60, 1.8, 0, 7); g.arc(13, -60, 1.8, 0, 7); g.fill();
    g.fillStyle = '#2a1a2a'; g.beginPath(); g.arc(20, -52, 3, 0, 7); g.fill(); g.strokeStyle = '#2a1a3a'; g.lineWidth = 2; g.beginPath(); g.arc(10, -48, 5, 0.2, 2.6); g.stroke();
    // sack over the shoulder
    g.fillStyle = '#c8a060'; g.beginPath(); g.ellipse(-20, -52, 16, 14, 0.3, 0, 7); g.fill(); g.strokeStyle = '#6a4a2a'; g.lineWidth = 2; g.stroke(); MGH.text(g, '$', -20, -46, 14, '#6a4a2a', 'center', 'bold');
    for (const s of [-1, 1]) { g.fillStyle = '#4a4a5a'; g.beginPath(); g.ellipse(s * 9 + (run ? Math.sin(t * 18 + s) * 6 : 0), -4, 7, 5, 0, 0, 7); g.fill(); }
    g.restore(); };
  const birdG = (g, x, y, t, dir) => { g.save(); g.translate(x, y); g.scale(dir, 1); const w = Math.sin(t * 22) * 0.9;
    g.fillStyle = '#1a1a2a'; g.beginPath(); g.ellipse(0, 0, 18, 10, 0, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.ellipse(2, 3, 10, 5, 0, 0, 7); g.fill();
    g.fillStyle = '#2a2a4a'; g.beginPath(); g.moveTo(-4, -2); g.lineTo(-14, -2 - 22 * w); g.lineTo(8, -4); g.fill(); g.beginPath(); g.moveTo(-16, 0); g.lineTo(-32, -6); g.lineTo(-30, 6); g.fill();
    g.fillStyle = '#1a1a2a'; g.beginPath(); g.arc(16, -6, 8, 0, 7); g.fill(); g.fillStyle = '#ffd34d'; g.beginPath(); g.moveTo(22, -7); g.lineTo(32, -4); g.lineTo(22, -2); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(18, -8, 2.5, 0, 7); g.fill();
    g.restore(); };
  Board.worldFx = function (g, t) {
    for (const f of FX) { if (f.t < 0) continue; const q = Math.min(1, f.t / f.d);
      if (f.k === 'coin') { const x = lerp(f.a.x, f.b.x, q) + Math.sin(q * Math.PI) * f.s * 40, y = lerp(f.a.y, f.b.y, q) - Math.sin(q * Math.PI) * f.h; coinG(g, x, y, 10, t * 12 + f.s * 3); }
      else if (f.k === 'star') { const x = lerp(f.a.x, f.b.x, q), y = lerp(f.a.y, f.b.y, q) - Math.sin(q * Math.PI) * f.h; MGH.glow(g, x, y, 50, 'rgba(255,230,120,0.6)'); MGH.star(g, x, y, 24 + Math.sin(q * Math.PI) * 10, '#ffe680', t * 6, false); if (Math.random() < 0.6) FX.push({ k: 'spark', x, y, vx: R.range(-40, 40), vy: R.range(-40, 40), t: 0, d: 0.5, col: '#fff6b0', r: 3 }); }
      else if (f.k === 'spark') { g.globalAlpha = 1 - q; g.fillStyle = f.col; g.beginPath(); g.arc(f.x, f.y, f.r * (1 - q * 0.5), 0, 7); g.fill(); g.globalAlpha = 1; }
      else if (f.k === 'dust') { g.globalAlpha = 0.55 * (1 - q); g.fillStyle = '#f0e6d0'; g.beginPath(); g.arc(f.x, f.y, f.r * (1 + q), 0, 7); g.fill(); g.globalAlpha = 1; }
      else if (f.k === 'ring') { g.globalAlpha = 1 - q; g.strokeStyle = f.col; g.lineWidth = 6 * (1 - q) + 1; g.beginPath(); g.ellipse(f.x, f.y + 4, 30 + q * 60, 18 + q * 36, 0, 0, 7); g.stroke(); g.globalAlpha = 1; }
      else if (f.k === 'drop') { g.globalAlpha = 1 - q * q; coinG(g, f.x, f.y, 9, t * 14 + f.vx); g.globalAlpha = 1; }
      else if (f.k === 'conf') { g.globalAlpha = Math.min(1, 2 * (1 - q)); g.save(); g.translate(f.x, f.y); g.rotate(f.rot); g.fillStyle = f.col; g.fillRect(-5, -3, 10, 6); g.restore(); g.globalAlpha = 1; }
      else if (f.k === 'bandit') { // runs in, grabs, runs off
        const inn = Math.min(1, f.t / 0.5), out = Math.max(0, (f.t - 1.1) / 0.8), x = f.x - 260 * (1 - inn) + 300 * out * out, run = f.t < 0.5 || f.t > 1.1;
        g.globalAlpha = 1 - Math.max(0, out * 1.4 - 0.4); banditG(g, x + 50, f.y, t, run, out > 0 ? 1 : 1); g.globalAlpha = 1;
        if (f.t > 0.5 && f.t < 1.1) { MGH.text(g, '😈', x + 50, f.y - 110, 26, '#fff'); } }
      else if (f.k === 'bird') { const sw = Math.sin(q * Math.PI), x = f.x - f.dir * 400 * (1 - q * 2), y = f.y - 260 + sw * 240; birdG(g, x, y, t, f.dir); if (q > 0.5) coinG(g, x + f.dir * 30, y + 4, 7, t * 10); }
    }
    // emote bubbles over tokens
    if (Board.emo) for (const k in Board.emo) { const E = Board.emo[k], T = Board.tok[k]; if (!T) continue; const s = Math.min(1, E.t / 0.15) * (1 + 0.25 * Math.max(0, 1 - E.t / 0.3)), a = Math.min(1, (1.8 - E.t) / 0.3), x = T.x + 40, y = T.y - 160 - T.hop - E.t * 10;
      g.save(); g.globalAlpha = a; g.translate(x, y); g.scale(s, s); g.fillStyle = '#fff'; g.beginPath(); g.ellipse(0, 0, 30, 26, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(-14, 18); g.lineTo(-24, 34); g.lineTo(-2, 22); g.fill(); g.strokeStyle = Board.game.P(+k).color; g.lineWidth = 3; g.beginPath(); g.ellipse(0, 0, 30, 26, 0, 0, 7); g.stroke(); MGH.text(g, E.e, 0, 11, 30, '#000'); g.restore(); }
    // the timing ring
    const Q = Board.ui.qte; if (Q) { const T = Board.tok[Q.i], q = Math.min(1.3, Q.t / Q.d), x = T.x, y = T.y - 70;
      g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 5; g.beginPath(); g.arc(x, y, 46, 0, 7); g.stroke();
      if (!Q.done) { g.strokeStyle = Math.abs(q - 1) < 0.14 ? '#7cff6a' : '#ffd34d'; g.lineWidth = 6; g.beginPath(); g.arc(x, y, 46 + Math.max(0, 1 - q) * 130, 0, 7); g.stroke(); }
      MGH.text(g, Q.done ? (Q.done === 'good' ? '✔ DODGED!' : '✘ TOO LATE') : `Ⓐ ${Q.label}`, x, y - 70, 26, Q.done === 'good' ? '#9fffa0' : Q.done ? '#ff8a8a' : '#fff', 'center', 'bold'); }
  };
  // bouncy number pops instead of plain floating text
  Board.drawFloat = function (g, f) { const q = f.t / 1.4, s = q < 0.12 ? q / 0.12 * 1.3 : 1.3 - Math.min(0.3, (q - 0.12) * 2); g.save(); g.globalAlpha = Math.min(1, (1 - q) * 3); g.translate(f.x, f.y - f.t * 40); g.scale(s, s);
    g.font = 'bold 28px Georgia'; const w = g.measureText(f.text).width + 26; g.fillStyle = 'rgba(30,16,60,0.78)'; MGH.rr(g, -w / 2, -22, w, 38, 19); g.fill(); g.strokeStyle = f.col; g.lineWidth = 3; g.stroke(); MGH.text(g, f.text, 0, 8, 26, f.col, 'center', 'bold'); g.restore(); };

  // ------------------------------------------------------------------ HUD: rolling counters with a bump
  const hud0 = Board.drawHUD;
  Board.drawHUD = function (g, t) {
    const G = this.game, S = this.shown || [], real = G.players.map(p => [p.coins, p.stars]);
    G.players.forEach((p, i) => { if (S[i]) { p.coins = S[i].c; } });
    try { hud0.call(this, g, t); } finally { G.players.forEach((p, i) => { p.coins = real[i][0]; p.stars = real[i][1]; }); }
    const pos = [[12, 8], [1012, 8], [12, 612], [1012, 612]];
    G.players.forEach((p, i) => { const s = S[i]; if (!s) return; const [x, y] = pos[i];
      if (s.bc > 0) { g.save(); g.globalAlpha = s.bc; MGH.glow(g, x + 170, y + 50, 34, s.up ? 'rgba(255,230,120,0.8)' : 'rgba(255,90,90,0.8)'); g.restore(); }
      if (s.bs > 0) { g.save(); g.globalAlpha = Math.min(1, s.bs); MGH.glow(g, x + 100, y + 50, 40 + (1 - s.bs) * 30, s.up2 ? 'rgba(255,240,140,0.9)' : 'rgba(255,60,60,0.9)'); MGH.star(g, x + 100, y + 48 - (1 - s.bs) * 20, 14, s.up2 ? '#ffe680' : '#ff6a6a', t * 6, false); g.restore(); } });
  };

  // ------------------------------------------------------------------ picture-first banners
  const seen = new Set();
  const banner0 = Board.banner.bind(Board);
  Board.banner = function (title, sub, ms = 2000, small = false) {
    const m = /^\s*(\p{Extended_Pictographic}️?(?:‍\p{Extended_Pictographic}️?)*)/u.exec(title || ''), icon = m ? m[1] : null, key = icon || (title || '').split(' ')[0];
    // once an event has been explained, its repeat shows the picture and a short title only
    if (sub && ms < 4000 && seen.has(key) && !/bank|next|due|Remember/i.test(sub)) { sub = ''; ms = Math.max(900, ms * 0.6); }
    // keep subtitles short: a long one keeps just its first clause (the tutorial cards are left whole)
    if (sub && ms < 4000 && sub.length > 60 && !/due|Remember/i.test(sub)) { const cut = sub.split(/(?<=[.!?])\s+|\s+—\s+|;\s+/)[0]; if (cut.length >= 8) sub = cut; }
    seen.add(key);
    const pr = banner0(icon ? title.replace(m[0], '').trim() : title, sub, ms, small);
    if (this.ui.banner) this.ui.banner.icon = icon;
    return pr;
  };
  Board.resetSeen = () => seen.clear();
  const drawB0 = Board.drawBanner;
  Board.drawBanner = function (g, B, t) {
    if (!B.icon) return drawB0.call(this, g, B, t);
    const k = Math.min(1, B.t / 0.25), y = B.small ? 150 : 250, w = B.small ? 520 : 760, h = B.sub ? (B.small ? 78 : 120) : 78;
    g.save(); g.globalAlpha = k; g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 20; g.fillStyle = 'rgba(28,14,60,0.88)'; Shell.rr(g, 640 - w / 2, y - h / 2, w, h, 26); g.fill(); g.shadowBlur = 0;
    g.strokeStyle = '#ff4fb0'; g.lineWidth = 3; Shell.rr(g, 640 - w / 2, y - h / 2, w, h, 26); g.stroke();
    // the icon medallion with turning rays, popping in
    const bx = 640 - w / 2 + 6, by = y, pop = B.t < 0.3 ? 0.4 + B.t / 0.3 * 0.8 : 1.2 - Math.min(0.2, (B.t - 0.3) * 0.8), R0 = 52;
    g.save(); g.translate(bx, by); g.scale(pop, pop); g.rotate(t * 0.8); for (let q = 0; q < 12; q++) { g.rotate(Math.PI / 6); g.fillStyle = q % 2 ? 'rgba(255,230,120,0.5)' : 'rgba(255,120,200,0.45)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(R0 * 1.5, -10); g.lineTo(R0 * 1.5, 10); g.fill(); } g.restore();
    g.save(); g.translate(bx, by); g.scale(pop, pop); const gr = g.createRadialGradient(-12, -14, 4, 0, 0, R0); gr.addColorStop(0, '#fff6d0'); gr.addColorStop(1, '#ffb84a'); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, R0, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 4; g.stroke();
    g.rotate(Math.sin(t * 5) * 0.12); MGH.text(g, B.icon, 0, 20, 54, '#000'); g.restore();
    const tx = 640 + 30, tw = w - 150;
    Shell.text(g, B.title, tx, y + (B.sub ? (B.small ? -8 : -16) : 10), B.small ? 22 : 28, '#ffe680');
    if (B.sub) Shell.wrap(g, B.sub, tx, y + 20, tw, 24, B.small ? 15 : 18, '#fff', 'center');
    g.restore();
  };
})();

// ------------------------------------------------------------------ clarity layer: rings under tokens, reachable spaces, see-through HUD, living water
(() => {
  const tok0 = Board.drawToken;
  Board.drawToken = function (g, p, x, y, hop, t, face) {
    // every player stands on a disc of their own colour, so tokens read even from far away
    g.save(); g.globalAlpha = 0.85; g.fillStyle = p.color; g.beginPath(); g.ellipse(x, y + 3, 30, 11, 0, 0, 7); g.fill(); g.globalAlpha = 1; g.strokeStyle = '#fff'; g.lineWidth = 2.5; g.stroke(); g.restore();
    tok0.call(this, g, p, x, y, hop, t, face);
    if (this.camZ < 0.6) { // a big name pin at overview zoom
      const R0 = 20 / this.camZ, py = y - 120 - R0 * 1.6 - hop; g.save(); g.fillStyle = p.color; g.strokeStyle = '#fff'; g.lineWidth = R0 * 0.16; g.beginPath(); g.moveTo(x - R0 * 0.45, py + R0 * 0.8); g.lineTo(x, py + R0 * 1.55); g.lineTo(x + R0 * 0.45, py + R0 * 0.8); g.closePath(); g.fill(); g.stroke(); g.beginPath(); g.arc(x, py, R0, 0, 7); g.fill(); g.stroke();
      Char.draw(g, x, py + R0 * 0.2, R0 * 0.72, p.el.id, p.color, { headOnly: true, noArms: true, noFeet: true, noShadow: true, mood: MGH.persona(p.mood || 'happy', p.el.id), seed: p.i * 1.7 }); g.restore(); }
  };
  // which spaces can be reached in exactly n more steps (both ways at a fork)
  const reach = (pos, n) => { let cur = new Set([pos]); for (let k = 0; k < n; k++) { const nx = new Set(); cur.forEach(c => BD.spaces[c].nx.forEach(z => nx.add(z))); cur = nx; } return [...cur]; };
  Board.reachFx = function (g, t) {
    const U = this.ui, st = U.steps; if (!st || st.left <= 0) return; const p = this.game.P(st.i);
    reach(p.pos, st.left).forEach(id => { const s = BD.spaces[id], k = 0.5 + 0.5 * Math.sin(t * 6);
      MGH.glow(g, s.x, s.y, 70, p.color + '88'); g.strokeStyle = '#fff'; g.lineWidth = 4 + k * 3; g.beginPath(); g.ellipse(s.x, s.y, 44 + k * 8, 30 + k * 5, 0, 0, 7); g.stroke();
      g.save(); g.translate(s.x, s.y - 70 - k * 10); g.fillStyle = p.color; g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.moveTo(-16, -18); g.lineTo(16, -18); g.lineTo(0, 4); g.closePath(); g.fill(); g.stroke(); g.restore(); });
  };
  // the creek and pond glitter
  Board.waterFx = function (g, t) {
    const C = [{ x: 2039, y: 432 }, { x: 2012, y: 776 }, { x: 1724, y: 949 }], bz = f => { const u = 1 - f; return { x: u * u * C[0].x + 2 * u * f * C[1].x + f * f * C[2].x, y: u * u * C[0].y + 2 * u * f * C[1].y + f * f * C[2].y }; };
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 26; k++) { const f = ((k / 26) + t * 0.05) % 1, p = bz(f), a = 0.35 * Math.max(0, Math.sin(t * 3 + k * 1.7)); g.fillStyle = `rgba(200,240,255,${a})`; g.beginPath(); g.ellipse(p.x + Math.sin(k * 3.3) * 10, p.y, 9, 2.5, 0.6, 0, 7); g.fill(); }
    for (let k = 0; k < 10; k++) { const a = 0.35 * Math.max(0, Math.sin(t * 2 + k * 2.1)), x = 1706 + Math.sin(k * 5.1) * 60, y = 957 + Math.cos(k * 3.7) * 26; g.fillStyle = `rgba(220,250,255,${a})`; g.beginPath(); g.ellipse(x, y, 12, 3, 0, 0, 7); g.fill(); }
    const rq = (t * 0.5) % 1; g.strokeStyle = `rgba(255,255,255,${0.4 * (1 - rq)})`; g.lineWidth = 2; g.beginPath(); g.ellipse(1690, 950, 10 + rq * 50, 4 + rq * 20, 0, 0, 7); g.stroke();
    g.restore();
  };
  // the banks are the key landmarks: draw them a size larger
  const bank0 = BoardArt.bank;
  BoardArt.bank = function (g, x, y, ...a) { g.save(); g.translate(x, y); g.scale(1.3, 1.3); g.translate(-x, -y); bank0.call(this, g, x, y, ...a); g.restore(); };
  // a soft depth haze at the top and bottom of the screen when zoomed in
  const sun0 = BoardArt.sunlight;
  BoardArt.sunlight = function (g, tod, t) { sun0.call(this, g, tod, t); const z = Board.camZ || 0.4; if (z < 0.8) return; const a = Math.min(1, (z - 0.8) / 0.4) * (tod === 'night' ? 0.25 : 0.18), col = tod === 'night' ? '20,30,70' : tod === 'golden' ? '255,200,140' : '235,245,255';
    let gr = g.createLinearGradient(0, 0, 0, 160); gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.fillRect(0, 0, 1280, 160);
    gr = g.createLinearGradient(0, 720, 0, 580); gr.addColorStop(0, `rgba(${col},${a * 0.8})`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.fillRect(0, 560, 1280, 160); };
  const wfx0 = Board.worldFx;
  Board.worldFx = function (g, t) { this.waterFx(g, t); this.reachFx(g, t); wfx0.call(this, g, t); };
  // corner cards turn see-through when a player, hold or the Ankar is behind them
  const hud1 = Board.drawHUD;
  Board.drawHUD = function (g, t) {
    const rects = [[12, 8], [1012, 8], [12, 612], [1012, 612]], pts = [];
    this.tok.forEach(T => pts.push(this.toScreen(T.x, T.y - 60))); const A = this.game.ankar; if (A && A.vx) pts.push(this.toScreen(A.vx, A.vy - 50));
    this._hudFade = this._hudFade || [1, 1, 1, 1];
    rects.forEach(([x, y], k) => { const hit = pts.some(q => q.x > x - 20 && q.x < x + 276 && q.y > y - 20 && q.y < y + 120); this._hudFade[k] += ((hit ? 0.45 : 1) - this._hudFade[k]) * 0.15; });
    if (this._hudFade.every(f => f > 0.97)) return hud1.call(this, g, t);
    // fade only the cards that cover something: draw the HUD clipped per card, the rest solid
    g.save(); g.beginPath(); g.rect(0, 0, 1280, 720); rects.forEach(([x, y]) => g.rect(x + 256 + 10, y - 6, -(256 + 20), 112)); g.clip('evenodd'); hud1.call(this, g, t); g.restore();
    rects.forEach(([x, y], k) => { g.save(); g.beginPath(); g.rect(x - 10, y - 6, 276, 112); g.clip(); g.globalAlpha = this._hudFade[k]; hud1.call(this, g, t); g.restore(); });
  };
})();
