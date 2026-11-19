'use strict';
// Moot minigames 51-60: Left/Right + one button

// 51 ---------------------------------------------------------------- Three-Way Parry
MG.def({
  id: 'parry', name: 'Three-Way Parry', type: 'Reaction', controls: 'Left/Right + button',
  how: 'Arrows fly at you from the left, the right and from above. Press LEFT, RIGHT, or UP / the button for arrows from above, to raise your shield on that side just as the arrow arrives. Raising it at the wrong time leaves you open for a moment. Three hearts.',
  wins: 'Last one standing (else most hearts).',
  init(m, S) {
    S.arrows = []; let t = 1.4;
    while (t < 55) { S.arrows.push({ t, side: R.pick(['left', 'right', 'a']) }); t += Math.max(0.42, 1.25 - t * 0.022) * R.range(0.8, 1.2); }
    S.p = [0, 1, 2, 3].map(() => ({ hp: 3, shield: null, sh: 0, cd: 0, res: new Map(), outT: 0, flash: 0 }));
    S.fly = 0.9;
  },
  update(m, S, dt) {
    S.p.forEach((p, i) => {
      if (p.hp <= 0) return;
      p.sh -= dt; p.cd -= dt; p.flash -= dt;
      for (const k of ['left', 'right', 'a', 'up']) if (m.pressed(i, k) && p.cd <= 0) { p.shield = k === 'up' ? 'a' : k; p.sh = 0.22; p.cd = 0.32; }
      S.arrows.forEach((a, k) => {
        if (p.res.has(k) || m.t < a.t) return;
        p.res.set(k, 1);
        if (p.sh > 0 && p.shield === a.side) { MGH.burst(i * 320 + 160 + (a.side === 'left' ? -40 : a.side === 'right' ? 40 : 0), a.side === 'a' ? 520 : 560, ['#ffe680', '#fff'], 10, { speed: 220, kind: 'spark', size: 2 }); Sfx.tone(900, 0.04, 'square', 0.03); }
        else { p.hp--; p.flash = 0.4; p.res.set(k, 2); MGH.burst(i * 320 + 160, 560, ['#ff4d6d', '#fff'], 14, { speed: 220 }); MGH.shake(3); if (p.hp <= 0) p.outT = m.t; if (!m.bot(i)) Sfx.bad(); }
      });
    });
    if (S.p.filter(p => p.hp > 0).length <= 1 || m.t > 56) m.finish(this.score(m, S));
  },
  bot(m, S, i) {
    const p = S.p[i], v = m.vin[i]; v.left = v.right = v.a = false; if (p.hp <= 0) return;
    if (!S.br) S.br = [0, 1, 2, 3].map(() => new Map());
    S.arrows.forEach((a, k) => {
      if (p.res.has(k)) return;
      if (!S.br[i].has(k)) S.br[i].set(k, Math.random() < 0.05 + m.t * 0.0025 ? -0.3 : R.range(0.01, 0.17));
      if (Math.abs(a.t - m.t - S.br[i].get(k)) < 0.017) v[a.side] = true;
    });
  },
  score(m, S) { return S.p.map(p => p.hp > 0 ? 100 + p.hp : p.outT); },
  fmt(s) { return s >= 100 ? `standing, ${Math.round(s - 100)} ♥` : `fell at ${s.toFixed(1)}s`; },
  hud(m, S, i) { return S.p[i].hp > 0 ? '♥'.repeat(S.p[i].hp) : 'out'; },
  draw(m, S, g) {
    MGH.bg(g, '#2a2030', '#0e0a12'); MGH.lanes(g, m);
    S.p.forEach((p, i) => {
      const cx = i * 320 + 160, cy = 560;
      g.fillStyle = '#3a2f44'; g.fillRect(i * 320 + 20, 600, 280, 12);
      S.arrows.forEach((a, k) => {
        if (p.res.has(k) || p.hp <= 0) return;
        const k2 = (a.t - m.t) / S.fly; if (k2 > 1 || k2 < 0) return;
        let x = cx, y = cy, ang = 0;
        if (a.side === 'left') { x = cx - 30 - k2 * 130; ang = 0; }
        if (a.side === 'right') { x = cx + 30 + k2 * 130; ang = Math.PI; }
        if (a.side === 'a') { y = cy - 30 - k2 * 470; ang = Math.PI / 2; }
        g.save(); g.translate(x, y); g.rotate(ang); g.strokeStyle = '#e8d5a8'; g.lineWidth = 3; g.beginPath(); g.moveTo(-26, 0); g.lineTo(6, 0); g.stroke();
        g.fillStyle = '#ccc'; g.beginPath(); g.moveTo(10, 0); g.lineTo(0, -5); g.lineTo(0, 5); g.fill(); g.fillStyle = '#c33'; g.fillRect(-28, -4, 6, 8); g.restore();
      });
      MGH.av(g, m, i, cx, cy, 28, p.hp <= 0 ? 'out' : p.flash > 0 ? 'hurt' : p.sh > 0 ? 'determined' : 'scared');
      if (p.sh > 0 && p.hp > 0) {
        const sx = p.shield === 'left' ? cx - 42 : p.shield === 'right' ? cx + 42 : cx, sy = p.shield === 'a' ? cy - 46 : cy;
        g.fillStyle = 'rgba(160,200,255,0.85)'; g.strokeStyle = '#fff'; g.lineWidth = 3;
        if (p.shield === 'a') MGH.rr(g, sx - 34, sy - 8, 68, 14, 6); else MGH.rr(g, sx - 7, sy - 34, 14, 68, 6);
        g.fill(); g.stroke();
      }
      MGH.text(g, '♥'.repeat(Math.max(0, p.hp)), cx, 650, 22, '#ff6b6b', 'center', 'bold');
    });
  },
});

// 52 ---------------------------------------------------------------- Whack-a-Wisp
MG.def({
  id: 'whack', name: 'Whack-a-Wisp', type: 'Reaction', controls: 'Left/Right + button', dur: 32,
  how: 'Wisps pop out of three burrows. Bop them with LEFT, the button (middle) or RIGHT before they hide: +1 each, +3 for golden wisps. Never bop the Ankar\'s eye — that costs 3.',
  wins: 'Most points.',
  init(m, S) {
    S.pops = []; let t = 0.8;
    while (t < 31) { const r = Math.random(); S.pops.push({ t, hole: R.int(0, 2), kind: r < 0.14 ? 'eye' : r < 0.24 ? 'gold' : 'wisp', up: R.range(0.55, 0.95) - Math.min(0.3, t * 0.008) }); t += R.range(0.28, 0.6); }
    S.pts = [0, 0, 0, 0]; S.res = [new Set(), new Set(), new Set(), new Set()]; S.bonk = [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]];
  },
  keys: ['left', 'a', 'right'],
  update(m, S, dt) {
    for (let i = 0; i < 4; i++) {
      S.bonk[i] = S.bonk[i].map(x => x - dt);
      for (let h = 0; h < 3; h++) {
        if (!m.pressed(i, this.keys[h])) continue;
        S.bonk[i][h] = 0.15;
        const k = S.pops.findIndex((p, k) => p.hole === h && !S.res[i].has(k) && m.t >= p.t && m.t <= p.t + p.up);
        const x = i * 320 + 60 + h * 100, y = 520;
        if (k >= 0) {
          S.res[i].add(k); const pp = S.pops[k];
          const v = pp.kind === 'eye' ? -3 : pp.kind === 'gold' ? 3 : 1; S.pts[i] += v;
          MGH.burst(x, y, pp.kind === 'eye' ? ['#b46bff', '#3a1a5c'] : pp.kind === 'gold' ? ['#ffe680', '#fff'] : ['#9fe8ff', '#fff'], 14, { speed: 220 });
          MGH.pop(v > 0 ? '+' + v : String(v), x, y - 60, v > 0 ? '#ffe680' : '#ff6b6b', 26);
          if (v < 0) MGH.shake(5);
        }
      }
    }
  },
  bot(m, S, i) {
    const v = m.vin[i]; v.left = v.right = v.a = false;
    if (!S.bd) S.bd = [0, 1, 2, 3].map(() => new Map());
    S.pops.forEach((p, k) => {
      if (S.res[i].has(k) || m.t < p.t) return;
      if (!S.bd[i].has(k)) S.bd[i].set(k, R.range(0.22, 0.45) + (p.kind === 'eye' && Math.random() < 0.12 ? -0.1 : 0));
      if (p.kind === 'eye' && S.bd[i].get(k) > 0.2) return;
      if (m.t > p.t + S.bd[i].get(k) && m.t < p.t + p.up) v[this.keys[p.hole]] = !m.prev[i][this.keys[p.hole]];
    });
  },
  score(m, S) { return S.pts.slice(); },
  hud(m, S, i) { return S.pts[i]; },
  draw(m, S, g) {
    MGH.bg(g, '#3a5a2a', '#1a2a10'); MGH.lanes(g, m);
    for (let i = 0; i < 4; i++) {
      for (let h = 0; h < 3; h++) {
        const x = i * 320 + 60 + h * 100, y = 540;
        g.fillStyle = '#2a1a0a'; g.beginPath(); g.ellipse(x, y, 42, 16, 0, 0, 7); g.fill();
        S.pops.forEach((p, k) => {
          if (p.hole !== h || m.t < p.t || m.t > p.t + p.up + 0.1) return;
          const hit = S.res[i].has(k);
          const life = (m.t - p.t) / p.up, rise = hit ? Math.max(0, 1 - (m.t - p.t) * 4) : Math.min(1, life * 6, (1 - life) * 6 + 0.2);
          g.save(); g.beginPath(); g.rect(x - 50, y - 120, 100, 120); g.clip();
          const yy = y + 30 - rise * 70;
          if (p.kind === 'eye') { g.fillStyle = '#3a1a5c'; g.beginPath(); g.ellipse(x, yy, 30, 22, 0, 0, 7); g.fill(); g.fillStyle = '#ff2f5a'; g.beginPath(); g.arc(x, yy, 9, 0, 7); g.fill(); }
          else Char.draw(g, x, yy, 24, -1, p.kind === 'gold' ? '#ffd34d' : '#bfe9ff', { mood: hit ? 'dizzy' : 'happy', noFeet: true, seed: k });
          g.restore();
        });
        g.fillStyle = '#4a3020'; g.beginPath(); g.ellipse(x, y + 4, 44, 12, 0, 0, Math.PI); g.fill();
        if (S.bonk[i][h] > 0) MGH.text(g, '🔨', x + 10, y - 50, 40, '#fff');
        MGH.text(g, ['◀', '●', '▶'][h], x, y + 50, 20, m.players[i].color, 'center', 'bold');
      }
      MGH.av(g, m, i, i * 320 + 160, 660, 22, 'determined', { look: { x: 0, y: -1 } });
    }
  },
});

// 53 ---------------------------------------------------------------- Gale Hammer Throw
MG.def({
  id: 'hammer', name: 'Gale Hammer Throw', type: 'Skill', controls: 'Left/Right + button',
  how: 'Spin up the hammer by pressing LEFT and RIGHT alternately in rhythm. Press the button to let go — it flies off in the direction it is pointing, so release while it points up the field (inside the white lines). Two throws, best counts.',
  wins: 'Longest throw.',
  init(m, S) { S.best = [0, 0, 0, 0]; S.att = 1; this.reset(S); },
  reset(S) { S.p = [0, 1, 2, 3].map(() => ({ a: Math.PI / 2, w: 1, last: null, st: 'spin', tm: 0, hx: 0, hy: 0, vx: 0, vy: 0, dist: 0, foul: false, bt: 0 })); S.wait = 0; },
  update(m, S, dt) {
    S.p.forEach((p, i) => {
      if (p.st === 'spin') {
        p.tm += dt;
        for (const k of ['left', 'right']) if (m.pressed(i, k)) { if (p.last !== k) p.w = Math.min(15, p.w + 0.9); else p.w *= 0.8; p.last = k; }
        p.w = Math.max(1, p.w - 1.1 * dt);
        p.a += p.w * dt;
        if (m.pressed(i, 'a') || p.tm > 12) {
          const dir = -Math.sin(p.a + Math.PI / 2) < 0 ? 0 : 0;
          const ang = ((p.a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
          // tangent direction of release (counter-clockwise spin): angle + 90°
          const tx = -Math.sin(ang), ty = Math.cos(ang);
          const upDev = Math.abs(Math.atan2(tx, ty));
          p.st = 'fly'; p.hx = 0; p.hy = 0; const sp = p.w * 1.6; p.vx = tx * sp; p.vy = -ty * sp; p.foul = upDev > 0.6; p.dir = dir;
          MGH.burst(i * 320 + 160, 640, ['#fff', '#ccd'], 8, { speed: 120 });
        }
      } else if (p.st === 'fly') {
        p.hx += p.vx * dt * 10; p.hy += p.vy * dt * 10;
        if (Math.hypot(p.hx, p.hy) > Math.max(30, Math.hypot(p.vx, p.vy) * 22)) {
          p.st = 'done'; p.dist = p.foul ? 0 : Math.max(0, -p.hy / 8);
          S.best[i] = Math.max(S.best[i], p.dist);
          MGH.burst(i * 320 + 160 + clamp(p.hx * 0.3, -150, 150), 640 + p.hy * 0.95, p.foul ? ['#ff6b6b'] : ['#c9a36b', '#fff'], 18, { speed: 200 });
          MGH.pop(p.foul ? 'FOUL' : p.dist.toFixed(1) + ' m', i * 320 + 160, 300, p.foul ? '#ff6b6b' : m.players[i].color, 28);
        }
      }
    });
    if (S.p.every(p => p.st === 'done')) { S.wait += dt; if (S.wait > 1.5) { if (S.att >= 2) m.finish(S.best.slice()); else { S.att++; this.reset(S); } } }
  },
  bot(m, S, i, dt) {
    const p = S.p[i], v = m.vin[i]; v.left = v.right = v.a = false; if (p.st !== 'spin') return;
    p.bt -= dt;
    if (p.w < 12 + i * 0.5) { if (p.bt <= 0) { v[p.last === 'left' ? 'right' : 'left'] = true; p.bt = R.range(0.09, 0.15); } return; }
    const ang = (((p.a + p.w * 2.2 * dt) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const tx = -Math.sin(ang), ty = Math.cos(ang), dev = Math.atan2(tx, ty);
    if (Math.abs(dev - R.range(-0.3, 0.3)) < 0.18 && ty > 0) v.a = true;
    else if (p.bt <= 0) { v[p.last === 'left' ? 'right' : 'left'] = true; p.bt = R.range(0.12, 0.18); }
  },
  score(m, S) { return S.best.slice(); },
  fmt(s) { return s.toFixed(1) + ' m'; },
  hud(m, S, i) { return `${S.best[i].toFixed(1)}m (throw ${S.att}/2)`; },
  draw(m, S, g) {
    MGH.bg(g, '#3a6a3a', '#1a3a1a'); MGH.lanes(g, m);
    S.p.forEach((p, i) => {
      const cx = i * 320 + 160, cy = 640;
      g.save(); g.beginPath(); g.rect(i * 320, 40, 320, 680); g.clip();
      g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx - Math.sin(0.6) * 700, cy - Math.cos(0.6) * 700); g.moveTo(cx, cy); g.lineTo(cx + Math.sin(0.6) * 700, cy - Math.cos(0.6) * 700); g.stroke();
      for (let d = 10; d <= 70; d += 10) { const y = cy - d * 8 * 0.95; if (y < 50) break; MGH.text(g, d + 'm', cx + 120, y, 12, 'rgba(255,255,255,0.6)'); g.fillStyle = 'rgba(255,255,255,0.2)'; g.fillRect(cx - 100, y, 200, 1); }
      if (S.best[i] > 0) { g.fillStyle = m.players[i].color; g.fillRect(cx - 30, cy - S.best[i] * 8 * 0.95, 60, 4); }
      g.fillStyle = '#ccc'; g.beginPath(); g.arc(cx, cy, 40, 0, 7); g.globalAlpha = 0.3; g.fill(); g.globalAlpha = 1;
      let hx, hy;
      if (p.st === 'spin') { hx = cx + Math.cos(p.a) * 55; hy = cy - Math.sin(p.a) * 30; g.strokeStyle = '#aaa'; g.lineWidth = 2; g.beginPath(); g.moveTo(cx, cy - 10); g.lineTo(hx, hy); g.stroke(); }
      else { hx = cx + clamp(p.hx * 0.3, -150, 150); hy = cy + p.hy * 0.95; }
      MGH.av(g, m, i, cx, cy - 10, 22, p.st === 'done' ? (p.foul ? 'hurt' : p.dist > 40 ? 'cheer' : 'happy') : p.w > 10 ? 'dizzy' : 'determined', { look: { x: Math.cos(p.a), y: 0 } });
      g.fillStyle = '#555'; g.beginPath(); g.arc(hx, hy, 9, 0, 7); g.fill();
      g.fillStyle = '#222'; g.fillRect(cx - 60, 700, 120, 8); g.fillStyle = m.players[i].color; g.fillRect(cx - 60, 700, 120 * Math.min(1, p.w / 15), 8);
      g.restore();
    });
  },
});

// 54 ---------------------------------------------------------------- Star Drifter
MG.def({
  id: 'drifter', name: 'Star Drifter', type: 'Arena', controls: 'Left/Right + button', dur: 40,
  how: 'Pilot a drifting star-skiff. LEFT/RIGHT rotate, hold the button to thrust — there are no brakes in space! Collect falling stars. Crash into a space-rock and you spin out and drop two stars.',
  wins: 'Most stars.',
  init(m, S) {
    S.s = [0, 1, 2, 3].map(i => ({ x: 340 + (i % 2) * 600, y: 200 + Math.floor(i / 2) * 320, vx: 0, vy: 0, a: -Math.PI / 2, n: 0, stun: 0 }));
    S.stars = []; for (let k = 0; k < 6; k++) S.stars.push(this.newStar());
    S.rocks = []; for (let k = 0; k < 5; k++) S.rocks.push({ x: R.range(0, 1280), y: R.range(60, 720), vx: R.range(-60, 60), vy: R.range(-60, 60), r: R.range(22, 38), rot: 0 });
  },
  newStar() { return { x: R.range(60, 1220), y: R.range(90, 690), t: 0 }; },
  wrap(o) { if (o.x < 0) o.x += 1280; if (o.x > 1280) o.x -= 1280; if (o.y < 40) o.y += 680; if (o.y > 720) o.y -= 680; },
  update(m, S, dt) {
    for (const r of S.rocks) { r.x += r.vx * dt; r.y += r.vy * dt; r.rot += dt; this.wrap(r); }
    S.s.forEach((s, i) => {
      if (s.stun > 0) { s.stun -= dt; s.a += 12 * dt; }
      else {
        s.a += m.axis(i).x * 4.2 * dt;
        if (m.held(i, 'a')) { s.vx += Math.cos(s.a) * 420 * dt; s.vy += Math.sin(s.a) * 420 * dt; if (Math.random() < 0.5) MGH.burst(s.x - Math.cos(s.a) * 18, s.y - Math.sin(s.a) * 18, ['#ffd34d', '#ff8a3d'], 1, { speed: 60, life: 0.4 }); }
      }
      const v = Math.hypot(s.vx, s.vy); if (v > 340) { s.vx *= 340 / v; s.vy *= 340 / v; }
      s.vx *= 1 - 0.25 * dt; s.vy *= 1 - 0.25 * dt;
      s.x += s.vx * dt; s.y += s.vy * dt; this.wrap(s);
      S.stars.forEach((st, k) => { if (dist(st.x, st.y, s.x, s.y) < 30) { s.n++; MGH.burst(st.x, st.y, ['#ffe680', '#fff'], 16, { speed: 200, kind: 'spark', size: 2 }); S.stars[k] = this.newStar(); if (!m.bot(i)) Sfx.coin(); } });
      if (s.stun <= 0) for (const r of S.rocks) if (dist(r.x, r.y, s.x, s.y) < r.r + 14) {
        s.stun = 1.2; const drop = Math.min(2, s.n); s.n -= drop; for (let k = 0; k < drop; k++) S.stars.push({ x: s.x + R.range(-60, 60), y: s.y + R.range(-60, 60), t: 0 });
        s.vx = (s.x - r.x) * 4; s.vy = (s.y - r.y) * 4; MGH.burst(s.x, s.y, [m.players[i].color, '#aaa'], 22, { speed: 260 }); MGH.shake(5); if (!m.bot(i)) Sfx.bad();
      }
    });
    if (S.stars.length > 10) S.stars.length = 10;
  },
  bot(m, S, i) {
    const s = S.s[i], v = m.vin[i]; v.left = v.right = v.a = false; if (s.stun > 0) return;
    let best = null, bd = 1e9; for (const st of S.stars) { const d = dist(st.x, st.y, s.x, s.y); if (d < bd) { bd = d; best = st; } }
    if (!best) return;
    // aim at the target corrected for current drift
    const tx = best.x - s.vx * 0.6, ty = best.y - s.vy * 0.6;
    let want = Math.atan2(ty - s.y, tx - s.x);
    for (const r of S.rocks) if (dist(r.x, r.y, s.x, s.y) < r.r + 90) want = Math.atan2(s.y - r.y, s.x - r.x);
    let d = want - s.a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
    if (Math.abs(d) > 0.15) v[d > 0 ? 'right' : 'left'] = true;
    if (Math.abs(d) < 0.5) v.a = true;
  },
  score(m, S) { return S.s.map(s => s.n); },
  fmt(s) { return `${s} ⭐`; },
  hud(m, S, i) { return `⭐${S.s[i].n}`; },
  draw(m, S, g) {
    MGH.bg(g, '#05031a', '#0a0628');
    for (const st of S.stars) { g.save(); g.translate(st.x, st.y); g.rotate(m.t); MGH.text(g, '⭐', 0, 9, 26, '#fff'); g.restore(); }
    for (const r of S.rocks) { g.save(); g.translate(r.x, r.y); g.rotate(r.rot); g.fillStyle = '#6b6378'; g.beginPath(); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, rr = r.r * (0.8 + 0.2 * Math.sin(k * 3)); k ? g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : g.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); g.fill(); g.fillStyle = '#4a4458'; g.beginPath(); g.arc(r.r * 0.3, -r.r * 0.2, r.r * 0.2, 0, 7); g.fill(); g.restore(); }
    S.s.forEach((s, i) => {
      g.save(); g.translate(s.x, s.y); g.rotate(s.a);
      g.fillStyle = m.players[i].color; g.beginPath(); g.moveTo(26, 0); g.lineTo(-16, -16); g.lineTo(-8, 0); g.lineTo(-16, 16); g.closePath(); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke();
      if (m.held(i, 'a') && s.stun <= 0) { g.fillStyle = '#ffd34d'; g.beginPath(); g.moveTo(-10, -6); g.lineTo(-26 - Math.random() * 10, 0); g.lineTo(-10, 6); g.fill(); }
      g.restore();
      MGH.av(g, m, i, s.x, s.y - 4, 10, s.stun > 0 ? 'dizzy' : 'determined', { noFeet: true, noArms: true, simple: true, look: { x: Math.cos(s.a), y: Math.sin(s.a) } });
    });
  },
});

// 55 ---------------------------------------------------------------- Glacier Slalom
MG.def({
  id: 'slalom', name: 'Glacier Slalom', type: 'Race', controls: 'Left/Right + button',
  how: 'Ski down the glacier through the flag gates. LEFT/RIGHT steer; hold the button to tuck for more speed (but you steer worse). Missing a gate costs a 1.5 s penalty; hitting a pine tree makes you tumble.',
  wins: 'Fastest time.',
  init(m, S) {
    S.len = 9000; S.gates = []; let x = 160;
    for (let d = 500; d < S.len - 200; d += R.range(330, 420)) { x = clamp(x + R.range(-110, 110), 70, 250); S.gates.push({ d, x }); }
    S.trees = []; for (let d = 700; d < S.len; d += R.range(140, 260)) { const x = R.range(30, 290); if (!S.gates.some(g => Math.abs(g.d - d) < 90 && Math.abs(g.x - x) < 80)) S.trees.push({ d, x }); }
    S.p = [0, 1, 2, 3].map(() => ({ x: 160, d: 0, v: 250, pen: 0, fall: 0, fin: 0, done: new Set(), hitT: new Set(), msg: '', mt: 0 }));
  },
  update(m, S, dt) {
    S.p.forEach((p, i) => {
      if (p.fin) return;
      p.mt -= dt;
      if (p.fall > 0) { p.fall -= dt; p.v = 120; return; }
      const tuck = m.held(i, 'a');
      p.x = clamp(p.x + m.axis(i).x * (tuck ? 150 : 270) * dt, 20, 300);
      p.v = lerp(p.v, tuck ? 520 : 380, dt * 0.8);
      p.d += p.v * dt;
      S.gates.forEach((gt, k) => { if (!p.done.has(k) && p.d >= gt.d) { p.done.add(k); if (Math.abs(p.x - gt.x) > 48) { p.pen += 1.5; p.msg = 'missed gate +1.5s'; p.mt = 0.8; } else { MGH.burst(i * 320 + p.x, 560, ['#fff', '#cfefff'], 6, { speed: 120 }); } } });
      S.trees.forEach((t, k) => { if (!p.hitT.has(k) && Math.abs(t.d - p.d) < 16 && Math.abs(t.x - p.x) < 24) { p.hitT.add(k); p.fall = 1; MGH.burst(i * 320 + p.x, 560, ['#fff', '#2d6b3a'], 20, { speed: 240 }); if (!m.bot(i)) Sfx.bad(); } });
      if (p.d >= S.len) { p.fin = m.t + p.pen; MGH.pop('FINISH', i * 320 + 160, 300, m.players[i].color, 32); }
    });
    if (S.p.every(p => p.fin) || m.t > 70) m.finish(this.score(m, S));
  },
  bot(m, S, i) {
    const p = S.p[i], v = m.vin[i]; v.left = v.right = v.a = false; if (p.fall > 0 || p.fin) return;
    const gt = S.gates.find((g, k) => !p.done.has(k));
    let tx = gt ? gt.x : 160;
    for (const t of S.trees) if (t.d > p.d && t.d - p.d < 160 && Math.abs(t.x - tx) < 30) tx += t.x > 160 ? -50 : 50;
    if (!S.bn) S.bn = [0, 0, 0, 0]; if (Math.random() < 0.03) S.bn[i] = R.range(-18, 18);
    const d = tx + S.bn[i] - p.x;
    if (Math.abs(d) > 6) v[d > 0 ? 'right' : 'left'] = true;
    v.a = Math.abs(d) < 35 && (!gt || gt.d - p.d > 150);
  },
  score(m, S) { return S.p.map(p => p.fin ? 1000 - p.fin : p.d / 100); },
  fmt(s) { return s > 100 ? `${(1000 - s).toFixed(2)} s` : 'did not finish'; },
  hud(m, S, i) { const p = S.p[i]; return p.fin ? `✔ ${p.fin.toFixed(1)}s` : `${Math.round(p.d / S.len * 100)}% (+${p.pen}s)`; },
  draw(m, S, g) {
    MGH.bg(g, '#e8f4ff', '#c4def5'); MGH.lanes(g, m);
    S.p.forEach((p, i) => {
      const ox = i * 320, yC = 560;
      g.save(); g.beginPath(); g.rect(ox, 40, 320, 680); g.clip();
      S.gates.forEach((gt, k) => { const y = yC - (gt.d - p.d); if (y < 20 || y > 740) return; const ok = p.done.has(k); g.fillStyle = k % 2 ? '#e33' : '#36f'; g.globalAlpha = ok ? 0.4 : 1; g.fillRect(ox + gt.x - 50, y - 30, 4, 30); g.fillRect(ox + gt.x + 46, y - 30, 4, 30); g.fillRect(ox + gt.x - 50, y - 30, 16, 10); g.fillRect(ox + gt.x + 34, y - 30, 16, 10); g.globalAlpha = 1; });
      S.trees.forEach(t => { const y = yC - (t.d - p.d); if (y < 20 || y > 760) return; g.fillStyle = '#2d6b3a'; g.beginPath(); g.moveTo(ox + t.x, y - 40); g.lineTo(ox + t.x - 18, y); g.lineTo(ox + t.x + 18, y); g.fill(); g.fillStyle = '#5a3d22'; g.fillRect(ox + t.x - 3, y, 6, 8); });
      if (p.d > S.len - 600) { const y = yC - (S.len - p.d); g.fillStyle = '#222'; for (let x = 0; x < 320; x += 20) g.fillRect(ox + x, y, 10, 10); }
      g.restore();
      const tuck = m.held(i, 'a');
      MGH.av(g, m, i, ox + p.x, yC, tuck ? 16 : 19, p.fall > 0 ? 'dizzy' : p.fin ? 'cheer' : tuck ? 'determined' : 'happy', { noFeet: true, look: { x: m.axis(i).x, y: 1 } });
      g.strokeStyle = '#333'; g.lineWidth = 3; g.beginPath(); g.moveTo(ox + p.x - 10, yC + 18); g.lineTo(ox + p.x - 10, yC + 40); g.moveTo(ox + p.x + 10, yC + 18); g.lineTo(ox + p.x + 10, yC + 40); g.stroke();
      if (p.mt > 0) MGH.text(g, p.msg, ox + 160, 480, 16, '#c33', 'center', 'bold');
    });
  },
});

// 56 ---------------------------------------------------------------- Cliff Dive
MG.def({
  id: 'dive', name: 'Cliff Dive', type: 'Skill', controls: 'Left/Right + button',
  how: 'Leap from the sea cliff. Gusts tilt you — use LEFT/RIGHT to stay straight. Tap the button to tuck and flip (+2 each), but you must be untucked and upright before the waterline or you belly-flop for nothing. Two dives.',
  wins: 'Highest total score.',
  init(m, S) { S.tot = [0, 0, 0, 0]; S.n = 1; this.reset(S); },
  reset(S) { S.p = [0, 1, 2, 3].map(() => ({ y: 0, v: 0, tilt: 0, tw: 0, flip: 0, flips: 0, tuck: 0, st: 'fall', last: 0, botPlan: R.int(1, 3) })); S.wait = 0; S.gust = 0; S.gt = 0; },
  water: 600,
  update(m, S, dt) {
    S.gt -= dt; if (S.gt <= 0) { S.gust = R.range(-1, 1) * 2.2; S.gt = R.range(0.5, 1.1); }
    S.p.forEach((p, i) => {
      if (p.st !== 'fall') return;
      p.v += 260 * dt; p.y += p.v * dt;
      p.tw += (S.gust + m.axis(i).x * -3.2 + p.tilt * 1.2) * dt; p.tw *= 1 - 1.5 * dt; p.tilt += p.tw * dt;
      if (m.pressed(i, 'a')) p.tuck = 0.45;
      p.tuck -= dt;
      if (p.tuck > 0) { p.flip += 10 * dt; if (p.flip >= Math.PI * 2) { p.flip -= Math.PI * 2; p.flips++; MGH.pop('FLIP!', i * 320 + 160, 40 + p.y * 0.95, m.players[i].color, 22); } }
      else if (p.flip > 0.01) { p.flip = Math.min(Math.PI * 2, p.flip + 6 * dt); if (p.flip >= Math.PI * 2 - 0.01) { p.flip = 0; p.flips++; MGH.pop('FLIP!', i * 320 + 160, 40 + p.y * 0.95, m.players[i].color, 22); } }
      if (p.y >= this.water) {
        p.st = 'done';
        const clean = p.tuck <= 0 && p.flip < 0.3 && Math.abs(p.tilt) < 0.35;
        const sc = clean ? p.flips * 2 + Math.max(0, Math.round(5 - Math.abs(p.tilt) * 14)) : 0;
        p.last = sc; S.tot[i] += sc;
        MGH.burst(i * 320 + 160, 40 + this.water * 0.95, ['#9fd8ff', '#ffffff', '#4f8dff'], clean ? 20 : 40, { speed: clean ? 220 : 380, up: 200, grav: 800 });
        MGH.pop(clean ? `+${sc}` : 'BELLY FLOP', i * 320 + 160, 520, clean ? '#ffe680' : '#ff6b6b', 26);
        if (!clean) MGH.shake(4);
      }
    });
    if (S.p.every(p => p.st === 'done')) { S.wait += dt; if (S.wait > 1.6) { if (S.n >= 2) m.finish(S.tot.slice()); else { S.n++; this.reset(S); } } }
  },
  bot(m, S, i) {
    const p = S.p[i], v = m.vin[i]; v.left = v.right = v.a = false; if (p.st !== 'fall') return;
    const pred = p.tilt + p.tw * 0.3;
    if (Math.abs(pred) > 0.05) v[pred > 0 ? 'right' : 'left'] = Math.random() < 0.85;
    const remaining = this.water - p.y, tLeft = remaining / (p.v + 1);
    if (p.flips < p.botPlan && tLeft > 0.9 + Math.random() * 0.2) v.a = !m.prev[i].a;
  },
  score(m, S) { return S.tot.slice(); },
  hud(m, S, i) { return `${S.tot[i]} (dive ${S.n}/2)`; },
  draw(m, S, g) {
    MGH.bg(g, '#ffb880', '#7ec8ff'); MGH.lanes(g, m);
    g.fillStyle = '#2a6fb5'; g.fillRect(0, 40 + this.water * 0.95, 1280, 720);
    S.p.forEach((p, i) => {
      const cx = i * 320 + 160;
      g.fillStyle = '#6b5233'; g.fillRect(i * 320 + 10, 40, 60, 140);
      const y = 40 + Math.min(p.y, this.water) * 0.95 + 20;
      if (p.st === 'fall' || p.y < this.water + 1) {
        g.save(); g.translate(cx, y); g.rotate(p.tilt + p.flip); g.translate(-cx, -y);
        MGH.av(g, m, i, cx, y, p.tuck > 0 ? 15 : 19, p.tuck > 0 ? 'determined' : Math.abs(p.tilt) > 0.4 ? 'scared' : 'happy', { noFeet: p.tuck > 0, look: { x: 0, y: 1 } });
        g.restore();
      }
      if (p.st === 'done') MGH.text(g, `dive: ${p.last}`, cx, 700, 18, '#fff', 'center', 'bold');
      if (p.st === 'fall' && Math.abs(S.gust) > 1) MGH.text(g, S.gust > 0 ? '💨→' : '←💨', cx, 120, 22, '#fff');
    });
  },
});

// 57 ---------------------------------------------------------------- Ice Stones (curling)
MG.def({
  id: 'curling', name: 'Ice Stones', type: 'Skill', controls: 'Left/Right + button',
  how: 'Press the button to stop the swinging power meter and launch your stone up the ice. While it slides, hold LEFT/RIGHT to curl it and tap the button to sweep (it slides further). Three stones — your closest to the centre counts.',
  wins: 'Closest stone to the centre.',
  init(m, S) {
    S.cx = 160; S.cy = 160;
    S.p = [0, 1, 2, 3].map(() => ({ n: 0, best: 1e9, st: 'power', ph: R.range(0, 6), stone: null, stones: [], bt: 0, want: R.range(0.3, 0.42) }));
  },
  update(m, S, dt) {
    S.p.forEach((p, i) => {
      if (p.st === 'done') return;
      if (p.st === 'power') {
        p.ph += dt * 2.6;
        if (m.pressed(i, 'a')) { const pw = (1 - Math.cos(p.ph)) / 2; p.stone = { x: 160, y: 640, v: 220 + pw * 360, cx: 0 }; p.st = 'slide'; }
      } else if (p.st === 'slide') {
        const s = p.stone;
        s.cx += m.axis(i).x * 40 * dt;
        let fr = 140; if (m.pressed(i, 'a')) { s.sweep = 0.25; MGH.burst(i * 320 + s.x, s.y - 30, 'rgba(255,255,255,0.8)', 4, { speed: 80, life: 0.3 }); }
        s.sweep = (s.sweep || 0) - dt; if (s.sweep > 0) fr = 70;
        s.v = Math.max(0, s.v - fr * dt); s.y -= s.v * dt; s.x = clamp(s.x + s.cx * dt * (s.v / 100), 40, 280);
        if (s.y < 40 || s.v <= 0) {
          const d = s.y < 40 ? 999 : dist(s.x, s.y, S.cx, S.cy);
          p.stones.push({ x: s.x, y: Math.max(40, s.y) }); p.best = Math.min(p.best, d); p.n++;
          if (d < 25) MGH.burst(i * 320 + s.x, s.y, ['#ffe680', '#fff'], 18, { speed: 180, kind: 'spark', size: 2 });
          p.stone = null; p.st = p.n >= 3 ? 'done' : 'power';
        }
      }
    });
    if (S.p.every(p => p.st === 'done')) { S.w = (S.w || 0) + dt; if (S.w > 1.2) m.finish(this.score(m, S)); }
  },
  bot(m, S, i, dt) {
    const p = S.p[i], v = m.vin[i]; v.left = v.right = v.a = false;
    if (p.st === 'power') { const pw = (1 - Math.cos(p.ph)) / 2; if (Math.abs(pw - p.want) < 0.03 && Math.sin(p.ph) > 0) { v.a = true; p.want = R.range(0.3, 0.44); } }
    else if (p.st === 'slide') {
      const s = p.stone; if (s.x < S.cx - 8) v.right = true; else if (s.x > S.cx + 8) v.left = true;
      const stopAt = s.y - s.v * s.v / (2 * 140);
      p.bt -= dt; if (stopAt > S.cy + 15 && p.bt <= 0) { v.a = true; p.bt = 0.25; }
    }
  },
  score(m, S) { return S.p.map(p => -p.best); },
  fmt(s) { return -s >= 900 ? 'no stone in play' : `${Math.round(-s)} cm from centre`; },
  hud(m, S, i) { const b = S.p[i].best; return `${S.p[i].n}/3 · ${b > 900 ? '-' : Math.round(b) + 'cm'}`; },
  draw(m, S, g) {
    MGH.bg(g, '#dff1ff', '#b8daf2'); MGH.lanes(g, m);
    S.p.forEach((p, i) => {
      const ox = i * 320;
      [[90, '#3b6fd8'], [64, '#ffffff'], [40, '#d83b3b'], [14, '#ffffff']].forEach(([r, c]) => { g.fillStyle = c; g.beginPath(); g.arc(ox + S.cx, S.cy, r, 0, 7); g.fill(); });
      const stone = (x, y, a = 1) => { g.globalAlpha = a; g.fillStyle = '#777'; g.beginPath(); g.arc(ox + x, y, 15, 0, 7); g.fill(); g.fillStyle = m.players[i].color; g.beginPath(); g.arc(ox + x, y, 9, 0, 7); g.fill(); g.globalAlpha = 1; };
      p.stones.forEach(s => stone(s.x, s.y, 0.8));
      if (p.stone) stone(p.stone.x, p.stone.y);
      if (p.st === 'power') { const pw = (1 - Math.cos(p.ph)) / 2; g.fillStyle = '#234'; g.fillRect(ox + 290, 360, 14, 260); g.fillStyle = m.players[i].color; g.fillRect(ox + 290, 620 - pw * 260, 14, pw * 260); stone(160, 640); }
      MGH.av(g, m, i, ox + (p.stone ? p.stone.x : 160), (p.stone ? p.stone.y : 640) + 44, 18, p.st === 'done' ? (p.best < 30 ? 'cheer' : p.best < 90 ? 'happy' : 'hurt') : p.stone && p.stone.sweep > 0 ? 'determined' : 'happy', { look: { x: 0, y: -1 }, walk: p.stone ? 1 : 0, prop: p.stone ? '🧹' : null });
    });
  },
});

// 58 ---------------------------------------------------------------- Meteor Juggle
MG.def({
  id: 'juggle', name: 'Meteor Juggle', type: 'Arcade', controls: 'Left/Right + button', dur: 40,
  how: 'Keep the falling meteors in the air! Run LEFT/RIGHT under them and press the button to bump one when it is right above your head (+1). A meteor that hits the ground costs 2. Another meteor joins every 10 seconds.',
  wins: 'Most points.',
  init(m, S) {
    S.p = [0, 1, 2, 3].map(() => ({ x: 160, pts: 0, bump: 0, balls: [this.ball(0)] }));
  },
  ball(k) { return { x: R.range(80, 240), y: 120, vx: R.range(-60, 60), vy: 0, k }; },
  update(m, S, dt) {
    const want = 1 + Math.floor(m.t / 10);
    S.p.forEach((p, i) => {
      while (p.balls.length < want) p.balls.push(this.ball(p.balls.length));
      p.x = clamp(p.x + m.axis(i).x * 330 * dt, 30, 290); p.bump -= dt;
      if (m.pressed(i, 'a')) p.bump = 0.18;
      for (const b of p.balls) {
        b.vy += 460 * dt; b.x += b.vx * dt; b.y += b.vy * dt;
        if (b.x < 20 || b.x > 300) { b.vx *= -1; b.x = clamp(b.x, 20, 300); }
        if (p.bump > 0 && b.vy > 0 && Math.abs(b.x - p.x) < 50 && b.y > 500 && b.y < 650) {
          b.vy = -R.range(560, 640); b.vx = (b.x - p.x) * 5 + R.range(-40, 40); p.pts++; p.bump = 0;
          MGH.burst(i * 320 + b.x, b.y, ['#ff8a3d', '#ffd34d'], 10, { speed: 180 }); Sfx.tone(600, 0.05, 'triangle', 0.04);
        }
        if (b.y > 680) { p.pts -= 2; MGH.burst(i * 320 + b.x, 680, ['#ff5a1f', '#555', '#ffd34d'], 22, { speed: 260, up: 100 }); MGH.pop('−2', i * 320 + b.x, 640, '#ff6b6b', 26); MGH.shake(3); Object.assign(b, this.ball(b.k)); }
      }
    });
  },
  bot(m, S, i) {
    const p = S.p[i], v = m.vin[i]; v.left = v.right = v.a = false;
    let target = null, bt = 1e9;
    for (const b of p.balls) { if (b.vy < -100 && b.y < 400) continue; const t = (600 - b.y) / Math.max(60, b.vy); if (t < bt) { bt = t; target = b; } }
    if (!target) return;
    const tx = target.x + target.vx * Math.max(0, bt) * 0.8;
    if (Math.abs(tx - p.x) > 10) v[tx > p.x ? 'right' : 'left'] = true;
    if (target.vy > 0 && target.y > 540 && target.y < 620 && Math.abs(target.x - p.x) < 40 && Math.random() < 0.6) v.a = true;
  },
  score(m, S) { return S.p.map(p => p.pts); },
  hud(m, S, i) { return `${S.p[i].pts} (${S.p[i].balls.length}☄)`; },
  draw(m, S, g) {
    MGH.bg(g, '#1a0e2a', '#3a1a0a'); MGH.lanes(g, m);
    S.p.forEach((p, i) => {
      const ox = i * 320;
      g.fillStyle = '#3a2a1c'; g.fillRect(ox, 680, 320, 40);
      for (const b of p.balls) {
        g.fillStyle = 'rgba(255,140,40,0.25)'; for (let k = 1; k <= 3; k++) { g.beginPath(); g.arc(ox + b.x - b.vx * 0.02 * k, b.y - b.vy * 0.02 * k, 14 - k * 2, 0, 7); g.fill(); }
        g.fillStyle = '#ff8a3d'; g.beginPath(); g.arc(ox + b.x, b.y, 15, 0, 7); g.fill(); g.fillStyle = '#ffd34d'; g.beginPath(); g.arc(ox + b.x - 4, b.y - 4, 6, 0, 7); g.fill();
        if (b.vy > 0) { g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(ox + b.x, 682, 16 - (680 - b.y) / 60, 4, 0, 0, 7); g.fill(); }
      }
      const danger = p.balls.some(b => b.vy > 0 && b.y > 560 && Math.abs(b.x - p.x) > 60);
      MGH.av(g, m, i, ox + p.x, 640, 26, p.bump > 0 ? 'cheer' : danger ? 'scared' : 'determined', { walk: Math.abs(m.axis(i).x), look: { x: 0, y: -1 } });
    });
  },
});

// 59 ---------------------------------------------------------------- Bridge Collapse
MG.def({
  id: 'bridge', name: 'Bridge Collapse', type: 'Survival', controls: 'Left/Right + button', dur: 50,
  how: 'Everyone is on one old rope bridge over the abyss. Planks shake, then fall — faster and faster. Run LEFT/RIGHT and press the button to jump over gaps. You can bump rivals off balance. Fall and you are out.',
  wins: 'Last one on the bridge.',
  init(m, S) {
    S.n = 18; S.pw = 1280 / S.n; S.st = new Array(S.n).fill(0).map(() => ({ s: 'ok', t: 0 }));
    S.p = [0, 1, 2, 3].map(i => ({ x: 280 + i * 240, y: 0, vy: 0, vx: 0, ground: true, alive: true, outT: 0 }));
    S.next = 2.5;
  },
  plankAt(S, x) { return clamp(Math.floor(x / S.pw), 0, S.n - 1); },
  update(m, S, dt) {
    S.next -= dt;
    if (S.next <= 0) {
      const ok = S.st.map((s, k) => s.s === 'ok' ? k : -1).filter(k => k >= 0);
      if (ok.length > 2) { const k = R.pick(ok); S.st[k] = { s: 'shake', t: Math.max(0.6, 1.3 - m.t * 0.015) }; }
      S.next = Math.max(0.45, 1.6 - m.t * 0.025);
    }
    S.st.forEach((s, k) => { if (s.s === 'shake') { s.t -= dt; if (s.t <= 0) { s.s = 'gone'; s.t = 0; MGH.burst((k + 0.5) * S.pw, 480, ['#8a6a3a', '#5a3d22'], 14, { speed: 160, grav: 700 }); } } });
    S.p.forEach((p, i) => {
      if (!p.alive) return;
      p.vx = lerp(p.vx, m.axis(i).x * 260, dt * 10);
      if (m.pressed(i, 'a') && p.ground) { p.vy = 520; p.ground = false; }
      p.vy -= 1500 * dt; p.y += p.vy * dt; p.x = clamp(p.x + p.vx * dt, 16, 1264);
      const k = this.plankAt(S, p.x), solid = S.st[k].s !== 'gone';
      if (p.y <= 0 && solid && p.y > -20) { p.y = 0; p.vy = 0; p.ground = true; }
      else if (p.y < 0 && !solid) p.ground = false;
      if (p.y < -260) { p.alive = false; p.outT = m.t; MGH.pop('Fell!', p.x, 600, '#fff', 26); if (!m.bot(i)) Sfx.bad(); }
    });
    // bumps
    for (let a = 0; a < 4; a++) for (let b = a + 1; b < 4; b++) {
      const A = S.p[a], B = S.p[b]; if (!A.alive || !B.alive) continue;
      if (Math.abs(A.x - B.x) < 34 && Math.abs(A.y - B.y) < 30) { const d = Math.sign(B.x - A.x) || 1; A.x -= d * 4; B.x += d * 4; const rel = A.vx - B.vx; A.vx -= rel * 0.6; B.vx += rel * 0.6; }
    }
    if (S.p.filter(p => p.alive).length <= 1) m.finish(this.score(m, S));
  },
  bot(m, S, i) {
    const p = S.p[i], v = m.vin[i]; v.left = v.right = v.a = false; if (!p.alive) return;
    const k = this.plankAt(S, p.x);
    const safe = j => j >= 0 && j < S.n && S.st[j].s === 'ok';
    if (!S.bg) S.bg = [null, null, null, null];
    if (S.bg[i] === null || !safe(S.bg[i]) || (safe(k) && Math.random() < 0.01)) {
      let best = null, bd = 99; for (let j = 0; j < S.n; j++) if (safe(j)) { const d = Math.abs(j - k) + (S.p.some((q, qi) => qi !== i && q.alive && this.plankAt(S, q.x) === j) ? 2 : 0) + Math.random(); if (d < bd) { bd = d; best = j; } }
      S.bg[i] = best;
    }
    if (S.bg[i] === null) return;
    const tx = (S.bg[i] + 0.5) * S.pw, dx = tx - p.x;
    if (Math.abs(dx) > 8) v[dx > 0 ? 'right' : 'left'] = true;
    const ahead = this.plankAt(S, p.x + Math.sign(dx) * 30);
    if (p.ground && (S.st[ahead].s === 'gone' || S.st[k].s === 'shake' && Math.abs(dx) > S.pw * 0.6) && Math.random() < 0.7) v.a = true;
  },
  score(m, S) { return S.p.map(p => p.alive ? 1000 : p.outT); },
  fmt(s) { return s >= 1000 ? 'Still standing' : `fell at ${s.toFixed(1)}s`; },
  hud(m, S, i) { return S.p[i].alive ? 'on the bridge' : 'fell'; },
  draw(m, S, g) {
    MGH.bg(g, '#3a2a4a', '#05020a');
    g.fillStyle = '#4a3a5a'; g.beginPath(); g.moveTo(0, 520); g.lineTo(80, 470); g.lineTo(140, 720); g.lineTo(0, 720); g.fill(); g.beginPath(); g.moveTo(1280, 520); g.lineTo(1200, 470); g.lineTo(1140, 720); g.lineTo(1280, 720); g.fill();
    g.strokeStyle = '#a8865a'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 430); g.quadraticCurveTo(640, 470, 1280, 430); g.stroke();
    S.st.forEach((s, k) => {
      if (s.s === 'gone') return;
      const sx = s.s === 'shake' ? Math.sin(m.t * 50 + k) * 3 : 0, x = k * S.pw + sx;
      g.fillStyle = s.s === 'shake' ? '#7a4a2a' : '#9b7b55'; g.fillRect(x + 2, 480, S.pw - 4, 16);
      g.strokeStyle = '#5a3d22'; g.lineWidth = 1; g.strokeRect(x + 2, 480, S.pw - 4, 16);
      g.strokeStyle = '#a8865a'; g.beginPath(); g.moveTo(x + S.pw / 2, 488); g.lineTo(x + S.pw / 2, 445); g.stroke();
    });
    S.p.forEach((p, i) => {
      if (!p.alive && p.y < -500) return;
      MGH.av(g, m, i, p.x, 480 - 22 - p.y, 20, !p.alive ? 'scared' : S.st[this.plankAt(S, p.x)].s === 'shake' ? 'scared' : p.ground ? 'determined' : 'cheer', { walk: Math.abs(p.vx) > 30 ? 1 : 0, look: { x: Math.sign(p.vx), y: 0.3 } });
    });
  },
});

// 60 ---------------------------------------------------------------- Spirit Keeper
MG.def({
  id: 'keeper', name: 'Spirit Keeper', type: 'Reaction', controls: 'Left/Right + button',
  how: 'You guard a goal against a ghostly striker. Watch the run-up — the striker glances where it means to shoot (but sometimes bluffs!). Shuffle with LEFT/RIGHT and press the button to dive in the direction you are moving. Ten shots.',
  wins: 'Most saves.',
  init(m, S) {
    S.shots = []; for (let k = 0; k < 10; k++) { const tgt = R.pick([-1, 0, 1]); S.shots.push({ tgt, x: tgt * R.range(80, 118) + R.range(-12, 12), look: Math.random() < 0.72 ? tgt : R.pick([-1, 0, 1]), sp: R.range(0.45, 0.7) - k * 0.015 }); }
    S.k = 0; S.ph = 'wind'; S.t = 0;
    S.p = [0, 1, 2, 3].map(() => ({ x: 0, dive: 0, dv: 0, saves: 0, res: '', guess: null }));
  },
  update(m, S, dt) {
    S.t += dt; const sh = S.shots[S.k];
    S.p.forEach((p, i) => {
      const ax = m.axis(i).x;
      if (p.dive > 0) { p.dive -= dt; p.x = clamp(p.x + p.dv * dt, -120, 120); }
      else { p.x = clamp(p.x + ax * 95 * dt, -120, 120); if (m.pressed(i, 'a') && S.ph !== 'reset') { p.dive = 0.4; p.dv = (ax || 0) * 400; } }
    });
    if (S.ph === 'wind' && S.t > 1.4) { S.ph = 'shot'; S.t = 0; Sfx.tone(200, 0.1, 'square', 0.05); }
    else if (S.ph === 'shot' && S.t > sh.sp) {
      S.p.forEach((p, i) => {
        const reach = p.dive > 0 ? 58 : 30;
        if (Math.abs(p.x - sh.x) < reach) { p.saves++; p.res = 'SAVE!'; MGH.burst(i * 320 + 160 + sh.x, 600, ['#fff', m.players[i].color], 16, { speed: 220 }); }
        else { p.res = 'goal'; MGH.burst(i * 320 + 160 + sh.x, 640, ['#ff6b6b'], 8, { speed: 140 }); }
      });
      S.ph = 'reset'; S.t = 0;
    } else if (S.ph === 'reset' && S.t > 1.2) {
      S.k++; if (S.k >= S.shots.length) { m.finish(S.p.map(p => p.saves)); return; }
      S.ph = 'wind'; S.t = 0; S.p.forEach(p => { p.x = 0; p.dive = 0; p.res = ''; p.guess = null; p.react = undefined; p.readOK = undefined; });
    }
  },
  bot(m, S, i) {
    const p = S.p[i], v = m.vin[i]; v.left = v.right = v.a = false;
    const sh = S.shots[S.k]; if (!sh || S.ph === 'reset') return;
    if (p.guess === null && S.ph === 'wind' && S.t > R.range(0.6, 1.2)) p.guess = Math.random() < 0.6 ? sh.look : R.pick([-1, 0, 1]);
    if (p.guess === null) return;
    const tx = p.guess * 90;
    if (S.ph === 'wind') { if (Math.abs(tx - p.x) > 10) v[tx > p.x ? 'right' : 'left'] = true; }
    else if (S.ph === 'shot') {
      if (p.react === undefined) p.react = R.range(0.22, 0.42);
      const real = S.t > p.react && p.readOK !== false ? sh.x : tx;
      if (p.readOK === undefined) p.readOK = Math.random() < 0.7;
      if (Math.abs(real - p.x) > 20) v[real > p.x ? 'right' : 'left'] = true;
      if (S.t > sh.sp - 0.3 && p.dive <= 0 && Math.abs(real - p.x) > 25 && Math.random() < 0.5) v.a = true;
    }
  },
  score(m, S) { return S.p.map(p => p.saves); },
  fmt(s) { return `${s} saves`; },
  hud(m, S, i) { return `🧤${S.p[i].saves} (shot ${Math.min(S.k + 1, 10)}/10)`; },
  draw(m, S, g) {
    MGH.bg(g, '#1a3a2a', '#0a1a10'); MGH.lanes(g, m);
    const sh = S.shots[Math.min(S.k, 9)];
    S.p.forEach((p, i) => {
      const cx = i * 320 + 160;
      g.strokeStyle = '#fff'; g.lineWidth = 5; g.beginPath(); g.moveTo(cx - 130, 650); g.lineTo(cx - 130, 540); g.lineTo(cx + 130, 540); g.lineTo(cx + 130, 650); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,0.15)'; g.lineWidth = 1; for (let x = -120; x <= 120; x += 20) { g.beginPath(); g.moveTo(cx + x, 540); g.lineTo(cx + x, 650); g.stroke(); }
      // striker
      const run = S.ph === 'wind' ? S.t / 1.4 : 1;
      const sy = 160 + run * 120;
      Char.draw(g, cx + (S.ph === 'wind' ? sh.look * 8 * Math.min(1, S.t * 2) : 0), sy, 24, -1, '#cfd6ff', { mood: 'determined', seed: S.k, alpha: 0.85, look: { x: S.ph === 'wind' && S.t > 0.5 ? sh.look : 0, y: 1 } });
      let bx = cx, by = sy + 30;
      if (S.ph === 'shot') { const k = Math.min(1, S.t / sh.sp); bx = cx + sh.x * k; by = sy + 30 + (600 - sy - 30) * k; }
      if (S.ph === 'reset') { bx = cx + sh.x; by = p.res === 'SAVE!' ? 560 : 625; }
      g.fillStyle = '#fff'; g.beginPath(); g.arc(bx, by, 10, 0, 7); g.fill(); g.strokeStyle = '#333'; g.lineWidth = 1.5; g.stroke();
      const tilt = p.dive > 0 ? Math.sign(p.dv) * 1.1 : 0;
      g.save(); g.translate(cx + p.x, 610); g.rotate(tilt); g.translate(-(cx + p.x), -610);
      MGH.av(g, m, i, cx + p.x, 610, 22, p.res === 'SAVE!' ? 'cheer' : p.res === 'goal' ? 'hurt' : S.ph === 'shot' ? 'scared' : 'determined', { look: { x: (bx - cx - p.x) / 200, y: -1 }, walk: Math.abs(m.axis(i).x) });
      g.restore();
      if (p.res) MGH.text(g, p.res, cx, 500, 26, p.res === 'SAVE!' ? '#ffe680' : '#ff6b6b', 'center', 'bold');
    });
  },
});
