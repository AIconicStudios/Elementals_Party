'use strict';
// Party batch 10: Timber Chop, Comet Dash, Penguin Slide, Jump Rope, Splash Race, Haystack Hunt

// ======================================================================== TIMBER CHOP (chop from the side without a branch)
MG.def({
  id: 'timber', name: 'Timber Chop', type: 'Reaction', controls: 'Move', dur: 0,
  rows: [['lr', 'Chop from the left or right']],
  how: 'Chop down your tree log by log! Press LEFT or RIGHT to stand on that side and swing your axe. Every chop drops the trunk by one log — so if a BRANCH is coming down on the side you\'re standing, move to the other side first or it bonks you. Your energy bar drains, and every chop fills it a little. A bonk or an empty bar ends your run. Most logs wins!',
  wins: 'Most logs chopped.',
  init(m, S) { S.p = [0, 1, 2, 3].map(() => { const P = { side: -1, br: [], logs: 0, en: 1, out: false, sw: 0, ax: 0, bt: R.range(0.14, 0.3) }; for (let k = 0; k < 8; k++) P.br.push(k < 2 ? 0 : this.rb(P.br)); return P; }); },
  rb(br) { const last = br[br.length - 1] || 0; if (Math.random() < 0.35) return 0; const v = last && Math.random() < 0.6 ? last : R.pick([-1, 1]); return last && v === -last ? 0 : v; }, // never two opposite branches in a row
  update(m, S, dt) {
    S.p.forEach((P, i) => {
      if (P.out) return;
      P.sw = Math.max(0, P.sw - dt); P.en -= dt * (0.12 + Math.min(0.25, P.logs * 0.002));
      if (P.en <= 0) { P.out = 'tired'; Sfx.bad(); return; }
      const a = m.axis(i).x, now = a < -0.6 ? -1 : a > 0.6 ? 1 : 0;
      const d = m.bot(i) ? (now && now !== P.ax ? now : 0) : (m.pressed(i, 'left') ? -1 : m.pressed(i, 'right') ? 1 : (now && now !== P.ax ? now : 0)); P.ax = now;
      if (!d) return;
      P.side = d; P.sw = 0.12;
      if (P.br[0] === P.side) { P.out = 'bonk'; Sfx.thud(); return; } // the branch at the cut level hits you
      P.br.shift(); P.br.push(this.rb(P.br)); P.logs++; P.en = Math.min(1, P.en + 0.07); Sfx.tone(300 + (P.logs % 5) * 40, 0.04, 'square', 0.03);
      if (P.br[0] === P.side) { P.out = 'bonk'; Sfx.thud(); }
    });
    if (S.p.every(P => P.out) || m.t > 60) m.finish(this.score(m, S));
  },
  bot(m, S, i, dt) {
    const P = S.p[i], v = m.vin[i]; v.ax = 0; v.left = v.right = false; if (P.out) return;
    P.bt -= dt; if (P.bt > 0) return; P.bt = R.range(0.13, 0.28) * (Math.random() < 0.08 ? 3 : 1);
    // stand on the side free of a branch at the next level (and the one after), sometimes misjudging
    const nxt = P.br[1] || P.br[0]; let side = nxt === -1 ? 1 : nxt === 1 ? -1 : P.side; if (Math.random() < 0.03) side = -side;
    v.ax = side;
  },
  score(m, S) { return S.p.map(P => P.logs); },
  fmt(s) { return `${s} logs`; },
  hud(m, S, i) { const P = S.p[i]; return P.out ? `${P.logs} · ${P.out === 'bonk' ? 'bonked!' : 'worn out'}` : `${P.logs} logs`; },
  draw(m, S, g) {
    MGH.scene(g, 'forest', m.t);
    for (let i = 0; i < 4; i++) {
      const P = S.p[i], p = m.players[i], x = 160 + i * 320, base = 620;
      g.fillStyle = '#6a4a2a'; g.beginPath(); g.ellipse(x, base + 8, 60, 14, 0, 0, 7); g.fill();
      for (let k = 0; k < 7; k++) {
        const y = base - k * 70; g.fillStyle = k % 2 ? '#8a5a30' : '#7a4a24'; g.fillRect(x - 34, y - 70, 68, 70); g.strokeStyle = 'rgba(0,0,0,0.2)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 34, y); g.lineTo(x + 34, y); g.stroke();
        const b = P.br[k]; if (b) { g.fillStyle = '#6a4220'; g.save(); g.translate(x + b * 34, y - 40); g.fillRect(b > 0 ? 0 : -90, -8, 90, 16); g.fillStyle = '#4a9a3a'; g.beginPath(); g.arc(b * 80, -10, 22, 0, 7); g.fill(); g.restore(); }
      }
      const cx = x + P.side * 70, bonk = P.out === 'bonk';
      Char.draw(g, cx, base - 30, 28, p.el.id, p.color, { mood: MGH.persona(bonk ? 'dizzy' : P.out ? 'sleepy' : 'effort', p.el.id), seed: i * 1.7, look: { x: -P.side, y: 0 }, hands: { n: { x: -P.side * (P.sw > 0 ? 1.2 : 0.4), y: P.sw > 0 ? -0.2 : -1.4, d: P.side > 0 ? 180 : 0, o: true, m: true }, f: { x: 0.5, y: 0.3, d: 90, o: true, m: false } } });
      g.save(); g.translate(cx - P.side * 30, base - 52); g.rotate(P.sw > 0 ? -P.side * 1.4 : -P.side * 0.3); g.fillStyle = '#8a5a2a'; g.fillRect(-3, -30, 6, 34); g.fillStyle = '#c8d0d8'; g.beginPath(); g.moveTo(0, -30); g.lineTo(-P.side * 18, -40); g.lineTo(-P.side * 18, -18); g.closePath(); g.fill(); g.restore();
      if (bonk) MGH.text(g, 'BONK!', cx, base - 110, 24, '#ff6b6b', 'center', 'bold');
      g.fillStyle = 'rgba(0,0,0,0.5)'; MGH.rr(g, x - 60, 660, 120, 12, 6); g.fill(); g.fillStyle = P.en > 0.3 ? '#7cf06a' : '#ff6b6b'; MGH.rr(g, x - 60, 660, 120 * Math.max(0, P.en), 12, 6); g.fill();
      MGH.text(g, `${p.name}  ${P.logs}`, x, 700, 18, p.color, 'center', 'bold');
    }
  },
});

// ======================================================================== COMET DASH (lane racer through an asteroid field)
MG.def({
  id: 'cometdash', name: 'Comet Dash', type: 'Race', controls: 'Move + button', dur: 0,
  rows: [['pad', 'Steer up and down'], ['a', 'Boost (when charged)']],
  how: 'Race your little comet through the asteroid belt! Steer UP and DOWN in your lane to dodge the rocks and scoop up blue stardust — it fills your boost bar. Press A to BOOST when it\'s full. Hitting a rock slows you right down. First to the space station wins!',
  wins: 'First to the finish.',
  LEN: 9000,
  init(m, S) { S.rocks = []; for (let x = 800; x < this.LEN; x += R.range(110, 200)) S.rocks.push({ x, y: R.range(0.08, 0.92), r: R.range(0.07, 0.12), dust: Math.random() < 0.35 }); S.p = [0, 1, 2, 3].map(() => ({ x: 0, y: 0.5, v: 420, boost: 0, bt: 0, hit: 0, fin: 0, got: new Set() })); },
  update(m, S, dt) {
    S.p.forEach((P, i) => {
      if (P.fin) return;
      P.hit -= dt; P.bt -= dt;
      const ay = m.axis(i).y; P.y = clamp(P.y + ay * 1.3 * dt, 0.06, 0.94);
      if (m.pressed(i, 'a') && P.boost >= 1) { P.boost = 0; P.bt = 1.6; Sfx.whoosh(true); }
      const target = P.hit > 0 ? 160 : P.bt > 0 ? 820 : 460; P.v += (target - P.v) * 2.5 * dt; P.x += P.v * dt;
      S.rocks.forEach((r, k) => { if (Math.abs(r.x - P.x) > 30) return; if (Math.abs(r.y - P.y) < r.r * 0.8) { if (r.dust) { if (!P.got.has(k)) { P.got.add(k); P.boost = Math.min(1, P.boost + 0.34); Sfx.tone(1200, 0.04, 'sine', 0.03); } } else if (P.hit <= 0 && P.bt <= 0) { P.hit = 0.8; Sfx.thud(); } } });
      if (P.x >= this.LEN) { P.fin = m.t; Sfx.coin(); }
    });
    if (S.p.every(P => P.fin) || m.t > 45) m.finish(this.score(m, S));
  },
  bot(m, S, i) {
    const P = S.p[i], v = m.vin[i]; v.a = false;
    P.dt = (P.dt || 0) - 1 / 60; if (P.dt > 0) return; P.dt = R.range(0.08, 0.25); v.ay = 0;
    const ahead = S.rocks.filter(r => r.x > P.x + 10 && r.x < P.x + P.v * 0.6);
    const danger = ahead.find(r => !r.dust && Math.abs(r.y - P.y) < r.r + 0.05), dust = ahead.find(r => r.dust);
    if (!P.look) P.look = R.range(0.6, 1);
    if (danger && Math.random() < P.look) v.ay = (danger.y > P.y ? -1 : 1) * (danger.y < 0.15 ? -1 : danger.y > 0.85 ? -1 : 1) * (Math.abs(danger.y - 0.5) > 0.35 ? -1 : 1); else if (dust && Math.abs(dust.y - P.y) > 0.03) v.ay = Math.sign(dust.y - P.y) * 0.8;
    if (P.boost >= 1 && !danger && Math.random() < 0.05) v.a = true; if (Math.random() < 0.01) P.look = R.range(0.5, 1);
  },
  score(m, S) { return S.p.map(P => P.fin ? 1000 - P.fin : P.x / this.LEN * 100); },
  fmt(s) { return s > 500 ? `${(1000 - s).toFixed(1)}s` : `${Math.round(s)}%`; },
  hud(m, S, i) { const P = S.p[i]; return P.fin ? '🏁' : `${Math.round(P.x / this.LEN * 100)}%`; },
  draw(m, S, g) {
    g.fillStyle = '#06061a'; g.fillRect(0, 0, 1280, 720);
    for (let i = 0; i < 4; i++) {
      const P = S.p[i], p = m.players[i], L = MGM.lane(i, 110, 150), cam = P.x - 200, Y = y => L.y0 + y * L.h;
      g.save(); g.beginPath(); g.rect(0, L.y0, 1280, L.h); g.clip();
      g.fillStyle = MGH.grad(g, L.y0, L.y1, ['#10103a', '#1a1450']); g.fillRect(0, L.y0, 1280, L.h);
      for (let k = 0; k < 30; k++) { const x = ((k * 173 - cam * (0.2 + (k % 3) * 0.15)) % 1300 + 1300) % 1300; g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(x, L.y0 + (k * 37) % L.h, 2, 2); }
      const fx = this.LEN - cam; if (fx < 1400) { g.fillStyle = '#9aa6b4'; MGH.rr(g, fx, L.y0 + 20, 60, L.h - 40, 10); g.fill(); g.fillStyle = '#ffe680'; for (let k = 0; k < 4; k++) g.fillRect(fx + 10, L.y0 + 30 + k * 25, 40, 8); }
      S.rocks.forEach((r, k) => { const x = r.x - cam; if (x < -60 || x > 1340) return; const rr = r.r * L.h; if (r.dust) { if (!P.got.has(k)) { MGH.glow(g, x, Y(r.y), rr * 1.6, 'rgba(120,200,255,0.6)'); MGH.star(g, x, Y(r.y), rr * 0.7, '#9fe0ff', m.t, false); } } else MGH.rock(g, x, Y(r.y), rr, k, '#8a7a6a', m.t * 0.5 + k); });
      const x = 200; if (P.bt > 0) MGH.glow(g, x, Y(P.y), 60, 'rgba(255,180,80,0.6)');
      for (let k = 1; k < 8; k++) { g.fillStyle = `rgba(${P.bt > 0 ? '255,180,80' : '150,220,255'},${0.4 - k * 0.05})`; g.beginPath(); g.arc(x - k * 12, Y(P.y), 14 - k, 0, 7); g.fill(); }
      Char.draw(g, x, Y(P.y), 16, p.el.id, p.color, { headOnly: true, mood: MGH.persona(P.hit > 0 ? 'dizzy' : P.bt > 0 ? 'cheer' : 'determined', p.el.id), seed: i * 1.7 });
      g.restore();
      g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(50, L.y0 + 10, 80, 8); g.fillStyle = P.boost >= 1 ? '#ffb13d' : '#5ab8ff'; g.fillRect(50, L.y0 + 10, 80 * P.boost, 8); if (P.boost >= 1) MGH.text(g, 'A = BOOST', 90, L.y0 + 32, 12, '#ffb13d', 'center', 'bold');
      g.fillStyle = 'rgba(255,255,255,0.2)'; g.fillRect(300, L.y1 - 6, 900, 3); g.fillStyle = p.color; g.beginPath(); g.arc(300 + 900 * Math.min(1, P.x / this.LEN), L.y1 - 5, 5, 0, 7); g.fill();
      g.fillStyle = p.color; MGH.rr(g, 8, L.y0 + 8, 30, 22, 6); g.fill(); MGH.text(g, String(i + 1), 23, L.y0 + 25, 16, '#fff', 'center', 'bold');
    }
  },
});

// ======================================================================== PENGUIN SLIDE (belly-slide down the ice, collect fish, hop the cracks)
MG.def({
  id: 'penguin', name: 'Penguin Slide', type: 'Race', controls: 'Move + button', dur: 0,
  rows: [['lr', 'Lean left / right'], ['a', 'Hop over cracks']],
  how: 'Belly-slide down the glacier! Lean LEFT and RIGHT to scoop up fish (each one gives you a burst of speed) and steer round the snowmen. Press A to hop over the dark cracks in the ice — fall in one and you lose a lot of speed. Fastest to the bottom wins!',
  wins: 'First to the bottom.',
  LEN: 7000,
  init(m, S) {
    S.items = []; for (let y = 600; y < this.LEN; y += R.range(130, 210)) { const r = Math.random(); S.items.push({ y, x: R.range(0.1, 0.9), k: r < 0.45 ? 'fish' : r < 0.72 ? 'snowman' : 'crack' }); }
    S.p = [0, 1, 2, 3].map(() => ({ y: 0, x: 0.5, v: 300, hop: 0, slow: 0, fin: 0, got: new Set(), hit: new Set() }));
  },
  update(m, S, dt) {
    S.p.forEach((P, i) => {
      if (P.fin) return;
      P.hop -= dt; P.slow -= dt; P.x = clamp(P.x + m.axis(i).x * 0.9 * dt, 0.06, 0.94);
      if (m.pressed(i, 'a') && P.hop <= -0.1) { P.hop = 0.45; Sfx.whoosh(false); }
      P.v += ((P.slow > 0 ? 140 : 420) - P.v) * 1.2 * dt; P.y += P.v * dt;
      S.items.forEach((it, k) => {
        if (Math.abs(it.y - P.y) > 18 || P.hit.has(k)) return;
        const dx = Math.abs(it.x - P.x);
        if (it.k === 'fish' && dx < 0.08) { P.hit.add(k); P.v += 160; Sfx.tone(1100, 0.04, 'sine', 0.03); }
        if (it.k === 'snowman' && dx < 0.07) { P.hit.add(k); P.slow = 0.7; Sfx.thud(); }
        if (it.k === 'crack' && dx < 0.14 && P.hop <= 0) { P.hit.add(k); P.slow = 1.1; Sfx.noise(0.3, 600, 0.08, 'lowpass'); }
      });
      if (P.y >= this.LEN) { P.fin = m.t; Sfx.coin(); }
    });
    if (S.p.every(P => P.fin) || m.t > 45) m.finish(this.score(m, S));
  },
  bot(m, S, i) {
    const P = S.p[i], v = m.vin[i]; v.a = false;
    P.dt = (P.dt || 0) - 1 / 60; if (P.dt > 0) return; P.dt = R.range(0.06, 0.22); v.ax = 0; if (!P.sk) P.sk = R.range(0.55, 0.95);
    const ahead = S.items.filter((it, k) => it.y > P.y && it.y < P.y + 260 && !P.hit.has(k));
    const crack = ahead.find(it => it.k === 'crack' && Math.abs(it.x - P.x) < 0.16 && it.y - P.y < P.v * 0.3 + 10);
    if (crack && P.hop <= -0.1 && Math.random() < P.sk) v.a = true;
    const sm = ahead.find(it => it.k === 'snowman' && Math.abs(it.x - P.x) < 0.1), fish = ahead.find(it => it.k === 'fish');
    if (sm && Math.random() < P.sk) v.ax = sm.x > P.x ? -1 : 1; else if (fish && Math.random() < P.sk) v.ax = Math.abs(fish.x - P.x) > 0.02 ? Math.sign(fish.x - P.x) * 0.8 : 0;
  },
  score(m, S) { return S.p.map(P => P.fin ? 1000 - P.fin : P.y / this.LEN * 100); },
  fmt(s) { return s > 500 ? `${(1000 - s).toFixed(1)}s` : `${Math.round(s)}%`; },
  hud(m, S, i) { const P = S.p[i]; return P.fin ? '🏁' : `${Math.round(P.y / this.LEN * 100)}%`; },
  draw(m, S, g) {
    g.fillStyle = '#cfe8f8'; g.fillRect(0, 0, 1280, 720);
    for (let i = 0; i < 4; i++) {
      const P = S.p[i], p = m.players[i], ox = i * 320 + 10, w = 300, cam = P.y - 160, X = x => ox + x * w;
      g.save(); g.beginPath(); g.rect(ox, 40, w, 680); g.clip();
      g.fillStyle = MGH.grad(g, 40, 720, ['#f4faff', '#d8ecf8']); g.fillRect(ox, 40, w, 680);
      for (let k = 0; k < 14; k++) { const y = ((k * 90 - cam) % 1260 + 1260) % 1260 - 60; g.strokeStyle = 'rgba(150,190,220,0.35)'; g.lineWidth = 2; g.beginPath(); g.moveTo(ox + 20 + (k * 37) % 260, y); g.lineTo(ox + 50 + (k * 37) % 260, y + 30); g.stroke(); }
      const fy = this.LEN - cam + 40; if (fy < 760) { for (let k = 0; k < 10; k++) { g.fillStyle = k % 2 ? '#222' : '#fff'; g.fillRect(ox + k * 30, fy, 30, 14); } }
      S.items.forEach((it, k) => {
        const y = it.y - cam + 40; if (y < 0 || y > 760) return; const x = X(it.x);
        if (it.k === 'fish') { if (P.hit.has(k)) return; g.fillStyle = '#5a8ad8'; g.beginPath(); g.ellipse(x, y, 16, 8, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(x + 14, y); g.lineTo(x + 24, y - 8); g.lineTo(x + 24, y + 8); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(x - 8, y - 2, 2, 0, 7); g.fill(); }
        else if (it.k === 'snowman') { g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, 18, 0, 7); g.arc(x, y - 24, 12, 0, 7); g.fill(); g.strokeStyle = '#bcd'; g.lineWidth = 2; g.stroke(); g.fillStyle = '#ff8a3d'; g.beginPath(); g.moveTo(x, y - 24); g.lineTo(x + 10, y - 22); g.lineTo(x, y - 20); g.fill(); }
        else { g.fillStyle = '#2a4a6a'; g.beginPath(); g.moveTo(x - 46, y); for (let q = 0; q <= 8; q++) g.lineTo(x - 46 + q * 11.5, y + (q % 2 ? -7 : 5)); for (let q = 8; q >= 0; q--) g.lineTo(x - 46 + q * 11.5, y + 10 + (q % 2 ? 3 : -2)); g.fill(); }
      });
      const px = X(P.x), py = 200, h = P.hop > 0 ? Math.sin(Math.PI * P.hop / 0.45) * 30 : 0;
      MGH.shadow(g, px, py + 18, 22, 0.25);
      g.save(); g.translate(px, py - h); g.rotate(Math.PI / 2 * 0.9 * (P.hop > 0 ? 0.6 : 1));
      g.fillStyle = '#2a2a3a'; g.beginPath(); g.ellipse(0, 0, 26, 16, 0, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.ellipse(2, 4, 18, 10, 0, 0, 7); g.fill(); g.restore();
      Char.draw(g, px, py + 18 - h, 15, p.el.id, p.color, { headOnly: true, mood: MGH.persona(P.slow > 0 ? 'dizzy' : P.v > 500 ? 'cheer' : 'happy', p.el.id), seed: i * 1.7 });
      if (P.v > 480) for (let k = 0; k < 3; k++) { g.strokeStyle = 'rgba(150,200,255,0.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(px - 16 + k * 16, py - 30); g.lineTo(px - 16 + k * 16, py - 60); g.stroke(); }
      g.restore();
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(ox + w - 10, 60, 6, 640); g.fillStyle = p.color; g.fillRect(ox + w - 10, 60 + 640 * Math.min(1, P.y / this.LEN) - 4, 6, 8);
      MGH.text(g, p.name + (P.fin ? ` ${P.fin.toFixed(1)}s` : ''), ox + w / 2, 70, 16, p.color, 'center', 'bold');
    }
  },
});

// ======================================================================== JUMP ROPE (jump the swinging rope together; miss and you're out)
MG.def({
  id: 'jumprope', name: 'Jump Rope', type: 'Timing', controls: '1 button', dur: 0,
  rows: [['a', 'Jump']],
  how: 'Two friendly hosts swing a long rope and all four of you stand in the middle. Press A to JUMP just before the rope sweeps under your feet! Jump too early or too late and it catches you — you\'re out. The rope keeps speeding up, and sometimes it does a sneaky double-swing. Last one skipping wins!',
  wins: 'Last one jumping.',
  init(m, S) { S.ph = 0; S.sp = 0.75; S.alive = [true, true, true, true]; S.order = []; S.j = [0, 0, 0, 0]; S.count = 0; S.err = [0, 1, 2, 3].map(() => R.range(-0.06, 0.06)); S.go = 2; S.t = 0; },
  update(m, S, dt) {
    S.t += dt; if (S.t < S.go) return;
    const prev = S.ph; S.ph += dt * S.sp; S.sp = Math.min(2.1, 0.75 + S.count * 0.04);
    S.j = S.j.map(j => Math.max(0, j - dt));
    for (let i = 0; i < 4; i++) if (S.alive[i] && S.j[i] <= 0 && m.pressed(i, 'a')) { S.j[i] = 0.42; Sfx.tone(600, 0.04, 'triangle', 0.03); }
    // the rope passes under the feet at phase .5 (mod 1)
    if (Math.floor(prev + 0.5) !== Math.floor(S.ph + 0.5)) {
      S.count++; Sfx.tone(200, 0.05, 'square', 0.03);
      for (let i = 0; i < 4; i++) if (S.alive[i]) { const h = S.j[i] > 0 ? Math.sin(Math.PI * S.j[i] / 0.42) : 0; if (h < 0.35) { S.alive[i] = false; S.order.push(i); Sfx.thud(); MGH.burst(310 + i * 220, 560, ['#fff', m.players[i].color], 12, { speed: 200 }); } }
      if (S.count % 7 === 0) S.sp *= 1.0;
    }
    if (S.alive.filter(a => a).length <= 1 || S.count > 80) m.finish(this.score(m, S));
  },
  bot(m, S, i) {
    const v = m.vin[i]; v.a = false; if (!S.alive[i] || S.t < S.go || S.j[i] > 0) return;
    // time to the next pass, minus the time to reach jump height
    const toPass = ((0.5 - (S.ph % 1)) + 1) % 1 / S.sp, want = 0.21 + S.err[i];
    if (toPass < want && toPass > want - 0.05) { v.a = Math.random() < 0.93 + 0.0 - S.count * 0.0015; S.err[i] = R.range(-0.07, 0.07); }
  },
  score(m, S) { return [0, 1, 2, 3].map(i => S.alive[i] ? 100 : S.order.indexOf(i) + 1); },
  fmt(s) { return s >= 100 ? 'Still skipping!' : `out #${s}`; },
  hud(m, S, i) { return S.alive[i] ? `${S.count} skips` : 'out'; },
  draw(m, S, g) {
    MGH.scene(g, 'meadow', m.t);
    g.fillStyle = 'rgba(200,170,120,0.5)'; g.beginPath(); g.ellipse(640, 600, 560, 60, 0, 0, 7); g.fill();
    Char.npc(g, 110, 520, 40, 'host', { mood: 'happy', look: { x: 1, y: 0 }, hands: { n: { x: 1.2, y: -0.4 + Math.sin(S.ph * Math.PI * 2) * 0.6, d: 0, o: true, m: true }, f: { x: 0.6, y: 0.3, d: 90, o: true, m: false } } });
    Char.npc(g, 1170, 520, 40, 'chef', { mood: 'happy', look: { x: -1, y: 0 }, hands: { n: { x: -1.2, y: -0.4 + Math.sin(S.ph * Math.PI * 2) * 0.6, d: 180, o: true, m: true }, f: { x: -0.6, y: 0.3, d: 90, o: true, m: false } } });
    // the rope: a sagging curve whose middle swings round (front half drawn after the players)
    const a = S.ph * Math.PI * 2, mid = 600 - 30 - Math.cos(a) * 250, front = Math.sin(a) > 0;
    const rope = () => { g.strokeStyle = '#e84a5a'; g.lineWidth = 6; g.beginPath(); g.moveTo(160, 520); g.quadraticCurveTo(640, mid * 2 - 520 + 0, 1120, 520); g.stroke(); };
    if (!front) rope();
    for (let i = 0; i < 4; i++) {
      const p = m.players[i], x = 310 + i * 220, h = S.j[i] > 0 ? Math.sin(Math.PI * S.j[i] / 0.42) * 70 : 0;
      MGH.shadow(g, x, 600, 30 - h * 0.15, 0.3);
      Char.draw(g, x, 552 - h, 36, p.el.id, p.color, { mood: MGH.persona(!S.alive[i] ? 'sad' : h > 10 ? 'cheer' : 'determined', p.el.id), seed: i * 1.7, alpha: S.alive[i] ? 1 : 0.4, feet: h > 10 ? [{ x: -0.3, lift: 0.4, tip: 0.3 }, { x: 0.3, lift: 0.4, tip: 0.3 }] : undefined });
      MGH.text(g, p.name, x, 640, 18, p.color, 'center', 'bold');
    }
    if (front) rope();
    MGH.label(g, `${S.count} skips`, 640, 90, 28, '#fff');
    if (S.t < S.go) MGH.label(g, 'Get ready to jump!', 640, 200, 34, '#ffe680');
  },
});

// ======================================================================== SPLASH RACE (keep the water jet on the moving target)
MG.def({
  id: 'splash', name: 'Splash Race', type: 'Skill', controls: 'Move + button', dur: 0,
  rows: [['stick', 'Aim the water gun'], ['a', 'Hold to spray']],
  how: 'Carnival water race! Hold A to spray your water gun and keep the stream on your moving target with the stick — every moment on target fills your balloon. The target zig-zags faster as your balloon fills. First balloon to POP wins!',
  wins: 'First to pop the balloon.',
  init(m, S) { S.p = [0, 1, 2, 3].map(i => ({ ax: 160 + i * 320, ay: 360, tx: 160 + i * 320, ty: 340, ph: R.range(0, 6), fill: 0, fin: 0, sp: R.range(0.8, 1.0) })); },
  update(m, S, dt) {
    S.p.forEach((P, i) => {
      if (P.fin) return;
      const ox = 160 + i * 320; P.ph += dt * (1 + P.fill * 1.6);
      P.tx = ox + Math.sin(P.ph * 1.3) * 100; P.ty = 300 + Math.sin(P.ph * 2.1) * 80;
      const a = m.axis(i); P.ax = clamp(P.ax + a.x * 320 * dt, ox - 140, ox + 140); P.ay = clamp(P.ay + a.y * 320 * dt, 180, 440);
      P.on = m.held(i, 'a') && dist(P.ax, P.ay, P.tx, P.ty) < 30;
      if (P.on) { P.fill += dt / 7; if (Math.random() < dt * 8) Sfx.tone(300 + P.fill * 600, 0.03, 'sine', 0.015); }
      if (P.fill >= 1) { P.fin = m.t; Sfx.pop(); Sfx.coin(); MGH.burst(ox, 560 - 70, [m.players[i].color, '#fff'], 30, { speed: 300 }); }
    });
    if (S.p.some(P => P.fin) && m.t - Math.min(...S.p.filter(P => P.fin).map(P => P.fin)) > 2) m.finish(this.score(m, S));
    if (m.t > 50) m.finish(this.score(m, S));
  },
  bot(m, S, i, dt) {
    const P = S.p[i], v = m.vin[i]; v.a = !P.fin; if (P.fin) { v.ax = v.ay = 0; return; }
    const dx = P.tx - P.ax, dy = P.ty - P.ay, l = Math.hypot(dx, dy); v.ax = clamp(dx / 30, -1, 1) * P.sp; v.ay = clamp(dy / 30, -1, 1) * P.sp; if (Math.random() < 0.01) P.sp = R.range(0.6, 1.0);
  },
  score(m, S) { return S.p.map(P => P.fin ? 1000 - P.fin : P.fill * 100); },
  fmt(s) { return s > 500 ? `popped at ${(1000 - s).toFixed(1)}s` : `${Math.round(s)}% full`; },
  hud(m, S, i) { return `${Math.round(S.p[i].fill * 100)}%`; },
  draw(m, S, g) {
    g.fillStyle = MGH.grad(g, 0, 720, ['#3a1a4a', '#6a2a5a']); g.fillRect(0, 0, 1280, 720);
    for (let x = 0; x < 1280; x += 64) { g.fillStyle = (x / 64) % 2 ? '#ffe680' : '#e84a5a'; g.beginPath(); g.moveTo(x, 40); g.lineTo(x + 64, 40); g.lineTo(x + 32, 100); g.fill(); }
    S.p.forEach((P, i) => {
      const p = m.players[i], ox = 160 + i * 320;
      g.fillStyle = '#2a1a3a'; MGH.rr(g, ox - 150, 160, 300, 300, 12); g.fill();
      // clown-face target
      g.fillStyle = '#fff'; g.beginPath(); g.arc(P.tx, P.ty, 30, 0, 7); g.fill(); g.fillStyle = '#e84a5a'; g.beginPath(); g.arc(P.tx, P.ty, 20, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(P.tx, P.ty, 9, 0, 7); g.fill();
      // the balloon above the booth
      const r = 14 + P.fill * 46; if (!P.fin) { g.fillStyle = p.color; g.beginPath(); g.ellipse(ox, 560 - 40 - r, r * 0.85, r, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.ellipse(ox - r * 0.3, 560 - 40 - r * 1.4, r * 0.18, r * 0.28, -0.4, 0, 7); g.fill(); } else MGH.text(g, 'POP!', ox, 500, 36, p.color, 'center', 'bold');
      g.strokeStyle = '#ccc'; g.lineWidth = 2; g.beginPath(); g.moveTo(ox, 540); g.lineTo(ox, 520); g.stroke();
      // water stream
      const gx = ox, gy = 640;
      if (m.held(i, 'a') && !P.fin) { g.strokeStyle = 'rgba(120,200,255,0.8)'; g.lineWidth = 6; g.beginPath(); g.moveTo(gx, gy - 30); g.quadraticCurveTo((gx + P.ax) / 2, (gy + P.ay) / 2 - 60, P.ax, P.ay); g.stroke(); for (let k = 0; k < 3; k++) { g.fillStyle = 'rgba(200,240,255,0.8)'; g.beginPath(); g.arc(P.ax + R.range(-12, 12), P.ay + R.range(-12, 12), 3, 0, 7); g.fill(); } }
      g.strokeStyle = P.on ? '#7cf06a' : 'rgba(255,255,255,0.5)'; g.lineWidth = 2; g.beginPath(); g.arc(P.ax, P.ay, 12, 0, 7); g.stroke();
      Char.draw(g, ox, 660, 28, p.el.id, p.color, { mood: MGH.persona(P.fin ? 'cheer' : P.on ? 'determined' : 'nervous', p.el.id), seed: i * 1.7, look: { x: 0, y: -1 }, headOnly: true });
      g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(ox - 60, 700, 120, 8); g.fillStyle = p.color; g.fillRect(ox - 60, 700, 120 * P.fill, 8);
    });
  },
});

// ======================================================================== HAYSTACK HUNT (search the stacks for the golden needle)
MG.def({
  id: 'haystack', name: 'Haystack Hunt', type: 'Search', controls: 'Move + button', dur: 50,
  rows: [['stick', 'Run'], ['a', 'Hold to search a haystack']],
  how: 'A golden needle is hidden in one of the haystacks on the farm! Run to a stack and HOLD A to dig through it. Listen and look: the stack with the needle gives off a faint sparkle, and stacks near it rustle when you get close. Find it for a point — then a new needle is hidden. Searched stacks go flat for a while.',
  wins: 'Most needles found.',
  init(m, S) {
    S.st = []; for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) S.st.push({ x: 200 + c * 176 + (r % 2) * 40, y: 200 + r * 130, flat: 0 });
    S.b = [0, 1, 2, 3].map(i => Object.assign(MGH.body(140 + i * 330, 660, 22), { dig: 0, at: -1, pts: 0 })); this.hide(S);
  },
  hide(S) { const ok = S.st.map((s, k) => k).filter(k => S.st[k].flat <= 0); S.n = R.pick(ok); },
  update(m, S, dt) {
    S.st.forEach(s => { s.flat -= dt; });
    S.b.forEach((b, i) => {
      const a = m.axis(i); if (b.dig > 0 && m.held(i, 'a')) { b.vx *= 0.8; b.vy *= 0.8; } else MGH.steer(b, a.x, a.y, dt, 2000, 290, 7);
      MGH.integrate(b, dt, 40, 120, 1240, 700);
      const k = S.st.findIndex(s => s.flat <= 0 && dist(s.x, s.y + 20, b.x, b.y) < 60);
      if (k >= 0 && m.held(i, 'a')) { if (b.at !== k) { b.at = k; b.dig = 0; } b.dig += dt; if (Math.random() < dt * 6) Sfx.noise(0.08, 1800, 0.02, 'highpass'); if (b.dig >= 1) { b.dig = 0; b.at = -1; if (k === S.n) { b.pts++; Sfx.coin(); MGH.burst(S.st[k].x, S.st[k].y, ['#ffe680', '#fff'], 24, { speed: 260 }); S.st[k].flat = 6; this.hide(S); } else { S.st[k].flat = 5; Sfx.tone(300, 0.08, 'triangle', 0.03); } } }
      else { b.dig = 0; b.at = -1; }
    });
    MGH.collide(S.b, 0.6);
  },
  bot(m, S, i) {
    const b = S.b[i], v = m.vin[i]; v.a = false;
    // bots notice the sparkle only sometimes; otherwise they search stacks near the rustling
    if (!b.goal || S.st[b.goal].flat > 0 || Math.random() < 0.004) { const n = S.st[S.n]; const cand = S.st.map((s, k) => ({ k, s })).filter(o => o.s.flat <= 0); b.goal = (Math.random() < 0.25 ? cand.find(o => o.k === S.n) : cand.sort((p, q) => dist(p.s.x, p.s.y, n.x, n.y) * R.range(0.5, 1.5) + dist(p.s.x, p.s.y, b.x, b.y) * 0.5 - dist(q.s.x, q.s.y, n.x, n.y) * R.range(0.5, 1.5) - dist(q.s.x, q.s.y, b.x, b.y) * 0.5)[0] || cand[0]).k; }
    const s = S.st[b.goal]; MGH.aim(m, i, s.x, s.y + 20, b, 20); if (dist(s.x, s.y + 20, b.x, b.y) < 55) { v.a = true; v.ax = v.ay = 0; if (b.at === b.goal && b.dig > 0.95) b.goal = null; }
  },
  score(m, S) { return S.b.map(b => b.pts); },
  fmt(s) { return `${s} needles`; },
  hud(m, S, i) { return `🪡 ${S.b[i].pts}`; },
  draw(m, S, g) {
    MGH.scene(g, 'meadow', m.t);
    g.fillStyle = 'rgba(200,170,90,0.35)'; g.fillRect(0, 120, 1280, 600);
    const ents = S.st.map((s, k) => ({ y: s.y + 30, f: () => {
      const near = S.b.some(b => dist(b.x, b.y, S.st[S.n].x, S.st[S.n].y) < 220) && dist(s.x, s.y, S.st[S.n].x, S.st[S.n].y) < 200 && s.flat <= 0;
      const wob = near ? Math.sin(m.t * 20 + k) * 2 : 0;
      MGH.shadow(g, s.x, s.y + 40, 50, 0.3);
      if (s.flat > 0) { g.fillStyle = '#c8a050'; g.beginPath(); g.ellipse(s.x, s.y + 34, 52, 14, 0, 0, 7); g.fill(); return; }
      g.fillStyle = MGH.grad(g, s.y - 40, s.y + 40, ['#f4d070', '#c8a040']); g.beginPath(); g.moveTo(s.x - 50 + wob, s.y + 40); g.quadraticCurveTo(s.x - 46, s.y - 50, s.x + wob, s.y - 54); g.quadraticCurveTo(s.x + 46, s.y - 50, s.x + 50 + wob, s.y + 40); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(140,100,30,0.5)'; g.lineWidth = 1.5; for (let q = -3; q <= 3; q++) { g.beginPath(); g.moveTo(s.x + q * 12, s.y + 36); g.lineTo(s.x + q * 9 + wob, s.y - 30); g.stroke(); }
      if (k === S.n && Math.sin(m.t * 3 + k) > 0.7) MGH.spark(g, s.x + R.range(-30, 30), s.y + R.range(-30, 20), 3, '#fff6a0');
      const dg = S.b.find(b => b.at === k); if (dg) { g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(s.x - 30, s.y - 70, 60, 8); g.fillStyle = '#ffe680'; g.fillRect(s.x - 30, s.y - 70, 60 * dg.dig, 8); }
    } })).concat(S.b.map((b, i) => ({ y: b.y, f: () => MGH.drawBody(g, b, m.players[i], '', b.at >= 0 ? 'effort' : 'determined') })));
    ents.sort((a, b) => a.y - b.y).forEach(e => e.f());
  },
});
