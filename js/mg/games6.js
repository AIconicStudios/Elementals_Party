'use strict';
// Moot minigames 51-60: Left/Right + one button

// 51 ---------------------------------------------------------------- Three-Way Parry
MG.def({
  id: 'parry', name: 'Three-Way Parry', type: 'Reaction', controls: 'Left/Right + button',
  how: 'Arrows fly at you from the left, the right and from above. Press LEFT, RIGHT, or UP / the button for arrows from above, to raise your shield on that side just as the arrow arrives. You can raise it a little early and still block. Three hearts.',
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
      for (const k of ['left', 'right', 'a', 'up']) if (m.pressed(i, k) && p.cd <= 0) { p.shield = k === 'up' ? 'a' : k; p.sh = 0.42; p.cd = 0.28; p.pt = m.t; }
      S.arrows.forEach((a, k) => {
        if (p.res.has(k) || m.t < a.t) return;
        const ok = p.shield === a.side && p.pt !== undefined && p.pt >= a.t - 0.45 && p.pt <= a.t + 0.08;
        if (!ok && m.t < a.t + 0.08) return; // a short grace for slightly late presses
        p.res.set(k, 1);
        if (ok) { MGH.burst(i * 320 + 160 + (a.side === 'left' ? -40 : a.side === 'right' ? 40 : 0), a.side === 'a' ? 520 : 560, ['#ffe680', '#fff'], 10, { speed: 220, kind: 'spark', size: 2 }); Sfx.tone(900, 0.04, 'square', 0.03); }
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
    MGH.scene(g, 'dojo', m.t);
    S.p.forEach((p, i) => {
      const cx = i * 320 + 160, cy = 560;
      MGH.shadow(g, cx, 604, 50, 0.4);
      S.arrows.forEach((a, k) => {
        if (p.res.has(k) || p.hp <= 0) return;
        const k2 = (a.t - m.t) / S.fly; if (k2 > 1 || k2 < -0.1) return;
        let x = cx, y = cy, ang = 0;
        if (a.side === 'left') { x = cx - 30 - k2 * 130; ang = 0; }
        if (a.side === 'right') { x = cx + 30 + k2 * 130; ang = Math.PI; }
        if (a.side === 'a') { y = cy - 30 - k2 * 470; ang = Math.PI / 2; }
        if (k2 < 0.35) MGH.glow(g, x, y, 30, 'rgba(255,80,80,0.5)');
        g.save(); g.translate(x, y); g.rotate(ang); g.strokeStyle = '#c9a36b'; g.lineWidth = 4; g.beginPath(); g.moveTo(-30, 0); g.lineTo(6, 0); g.stroke();
        g.fillStyle = '#ddd'; g.beginPath(); g.moveTo(12, 0); g.lineTo(0, -6); g.lineTo(0, 6); g.fill(); g.fillStyle = '#e33'; g.beginPath(); g.moveTo(-30, 0); g.lineTo(-38, -7); g.lineTo(-34, 0); g.lineTo(-38, 7); g.fill(); g.restore();
      });
      MGH.av(g, m, i, cx, cy, 28, p.hp <= 0 ? 'out' : p.flash > 0 ? 'hurt' : p.sh > 0 ? 'angry' : 'nervous');
      if (p.sh > 0 && p.hp > 0) {
        const sx = p.shield === 'left' ? cx - 46 : p.shield === 'right' ? cx + 46 : cx, sy = p.shield === 'a' ? cy - 56 : cy;
        MGH.glow(g, sx, sy, 50, 'rgba(160,210,255,0.6)');
        g.fillStyle = 'rgba(170,215,255,0.9)'; g.strokeStyle = '#fff'; g.lineWidth = 3;
        if (p.shield === 'a') MGH.rr(g, sx - 38, sy - 9, 76, 16, 7); else MGH.rr(g, sx - 8, sy - 38, 16, 76, 7);
        g.fill(); g.stroke();
      }
      MGH.text(g, '❤️'.repeat(Math.max(0, p.hp)), cx, 660, 20, '#fff', 'center');
      MGH.text(g, '◀  ▲  ▶', cx, 700, 16, m.players[i].color, 'center', 'bold');
    });
  },
});

// 52 ---------------------------------------------------------------- Whack-a-Wisp
MG.def({
  id: 'whack', name: 'Whack-a-Wisp', type: 'Reaction', controls: 'Left/Right', dur: 32,
  how: 'Wisps pop out of two burrows. Bop the left one with LEFT and the right one with RIGHT before they hide: +1 each, +3 for golden wisps. Never bop the Ankar\'s eye — that costs 3.',
  wins: 'Most points.',
  init(m, S) {
    S.pops = []; let t = 0.8;
    while (t < 31) { const r = Math.random(); S.pops.push({ t, hole: R.int(0, 1), kind: r < 0.14 ? 'eye' : r < 0.24 ? 'gold' : 'wisp', up: R.range(0.55, 0.95) - Math.min(0.3, t * 0.008) }); t += R.range(0.34, 0.66); }
    S.pts = [0, 0, 0, 0]; S.res = [new Set(), new Set(), new Set(), new Set()]; S.bonk = [[0, 0], [0, 0], [0, 0], [0, 0]];
  },
  keys: ['left', 'right'],
  update(m, S, dt) {
    for (let i = 0; i < 4; i++) {
      S.bonk[i] = S.bonk[i].map(x => x - dt);
      for (let h = 0; h < 2; h++) {
        if (!m.pressed(i, this.keys[h])) continue;
        S.bonk[i][h] = 0.15;
        const k = S.pops.findIndex((p, k) => p.hole === h && !S.res[i].has(k) && m.t >= p.t && m.t <= p.t + p.up);
        const x = i * 320 + 85 + h * 150, y = 520;
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
    const v = m.vin[i]; v.left = v.right = false;
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
    MGH.scene(g, 'meadow', m.t); MGH.lanes(g, m);
    for (let i = 0; i < 4; i++) {
      for (let h = 0; h < 2; h++) {
        const x = i * 320 + 85 + h * 150, y = 540;
        g.fillStyle = '#6a4a2a'; g.beginPath(); g.ellipse(x, y + 4, 52, 22, 0, 0, 7); g.fill(); g.fillStyle = '#1a0e06'; g.beginPath(); g.ellipse(x, y, 42, 16, 0, 0, 7); g.fill();
        S.pops.forEach((p, k) => {
          if (p.hole !== h || m.t < p.t || m.t > p.t + p.up + 0.1) return;
          const hit = S.res[i].has(k);
          const life = (m.t - p.t) / p.up, rise = hit ? Math.max(0, 1 - (m.t - p.t) * 4) : Math.min(1, life * 6, (1 - life) * 6 + 0.2);
          g.save(); g.beginPath(); g.rect(x - 50, y - 120, 100, 120); g.clip();
          const yy = y + 30 - rise * 70;
          if (p.kind === 'eye') { MGH.glow(g, x, yy, 40, 'rgba(255,40,90,0.5)'); g.fillStyle = '#3a1a5c'; g.beginPath(); g.ellipse(x, yy, 30, 22, 0, 0, 7); g.fill(); g.fillStyle = '#f3e0ff'; g.beginPath(); g.ellipse(x, yy, 15, 12, 0, 0, 7); g.fill(); g.fillStyle = '#ff2f5a'; g.beginPath(); g.arc(x, yy, 7, 0, 7); g.fill(); }
          else { MGH.glow(g, x, yy, 44, p.kind === 'gold' ? 'rgba(255,220,90,0.6)' : 'rgba(150,220,255,0.5)'); Char.draw(g, x, yy, 24, -1, p.kind === 'gold' ? '#ffd34d' : '#bfe9ff', { mood: hit ? 'dizzy' : 'happy', noFeet: true, seed: k }); }
          g.restore();
        });
        g.fillStyle = '#4a3020'; g.beginPath(); g.ellipse(x, y + 4, 44, 12, 0, 0, Math.PI); g.fill();
        if (S.bonk[i][h] > 0) { MGH.hammer(g, x + 20, y - 46, 1, -1.2 + (1 - S.bonk[i][h] / 0.25) * 1.2); MGH.spark(g, x, y - 10, 18); }
        MGH.text(g, ['◀', '▶'][h], x, y + 50, 20, m.players[i].color, 'center', 'bold');
      }
      MGH.av(g, m, i, i * 320 + 160, 660, 22, 'determined', { look: { x: 0, y: -1 } });
    }
  },
});

// 53 ---------------------------------------------------------------- Gale Hammer Throw
MG.def({
  id: 'hammer', name: 'Gale Hammer Throw', type: 'Skill', controls: '1 button (hold & release)', mouseA: true,
  how: 'HOLD the button to spin the hammer faster and faster — but stay at full speed too long and you get dizzy! LET GO to throw: it flies off the way it is pointing, so release while it points up the field — the ring around you glows GREEN at the right moment. Two throws, best counts.',
  wins: 'Longest throw.',
  init(m, S) { S.best = [0, 0, 0, 0]; S.att = 1; this.reset(S); },
  reset(S) { S.p = [0, 1, 2, 3].map(() => ({ a: Math.PI / 2, w: 1, last: null, st: 'spin', tm: 0, hx: 0, hy: 0, vx: 0, vy: 0, dist: 0, foul: false, bt: 0 })); S.wait = 0; },
  update(m, S, dt) {
    S.p.forEach((p, i) => {
      if (p.st === 'spin') {
        p.tm += dt;
        p.dizzy = Math.max(0, (p.dizzy || 0) - dt);
        const hold = m.held(i, 'a') && p.dizzy <= 0;
        if (hold) { p.held = true; p.w = Math.min(15, p.w + 5.2 * dt); if (p.w >= 15) { p.over = (p.over || 0) + dt; if (p.over > 1.9) { p.dizzy = 1.2; p.w = 4; p.over = 0; p.held = false; MGH.pop('DIZZY!', i * 320 + 160, 520, '#ff9a9a', 26); if (!m.bot(i)) Sfx.bad(); } } }
        else { p.over = 0; if (!p.held) p.w = Math.max(1, p.w - 2 * dt); }
        p.a += p.w * dt;
        if ((p.held && !hold && p.dizzy <= 0) || p.tm > 14) {
          const dir = -Math.sin(p.a + Math.PI / 2) < 0 ? 0 : 0;
          const ang = ((p.a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
          // tangent direction of release (counter-clockwise spin): angle + 90°
          const tx = -Math.sin(ang), ty = Math.cos(ang);
          const upDev = Math.abs(Math.atan2(tx, ty));
          p.st = 'fly'; p.hx = 0; p.hy = 0; const sp = p.w * 1.6; p.vx = tx * sp; p.vy = -ty * sp; p.foul = upDev > 0.85; p.dir = dir;
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
    if (p.dizzy > 0) return;
    if (p.goalW === undefined) p.goalW = R.range(11.5, 15);
    v.a = true; // keep holding…
    if (p.w < p.goalW) return;
    // …and let go when the hammer is about to point up the field
    const ang = (((p.a + p.w * 2 * dt) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const tx = -Math.sin(ang), ty = Math.cos(ang), dev = Math.atan2(tx, ty);
    if (Math.abs(dev - R.range(-0.3, 0.3)) < 0.2 && ty > 0) v.a = false;
  },
  score(m, S) { return S.best.slice(); },
  fmt(s) { return s.toFixed(1) + ' m'; },
  hud(m, S, i) { return `${S.best[i].toFixed(1)}m (throw ${S.att}/2)`; },
  draw(m, S, g) {
    MGH.scene(g, 'meadow', m.t); MGH.crowd(g, m.t, 64, 34, ['#6a8ac8', '#8a6ab8', '#c87a6a', '#6ab88a']); MGH.lanes(g, m);
    S.p.forEach((p, i) => {
      const cx = i * 320 + 160, cy = 640;
      g.save(); g.beginPath(); g.rect(i * 320, 40, 320, 680); g.clip();
      // a mown throwing sector with distance arcs, a concrete circle and a safety cage behind the thrower
      const SEC = 0.85; g.fillStyle = 'rgba(120,200,90,0.35)'; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, 760, -Math.PI / 2 - SEC, -Math.PI / 2 + SEC); g.closePath(); g.fill();
      for (let k = 0; k < 14; k++) { g.fillStyle = k % 2 ? 'rgba(255,255,255,0.05)' : 'rgba(0,60,0,0.05)'; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, 760, -Math.PI / 2 - SEC + k * SEC / 7, -Math.PI / 2 - SEC + (k + 1) * SEC / 7); g.closePath(); g.fill(); }
      g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 3; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx - Math.sin(SEC) * 760, cy - Math.cos(SEC) * 760); g.moveTo(cx, cy); g.lineTo(cx + Math.sin(SEC) * 760, cy - Math.cos(SEC) * 760); g.stroke();
      for (let d = 10; d <= 70; d += 10) { const r = d * 8 * 0.95, y = cy - r; if (y < 50) break; g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 1.5; g.beginPath(); g.arc(cx, cy, r, -Math.PI / 2 - SEC, -Math.PI / 2 + SEC); g.stroke(); g.fillStyle = 'rgba(20,40,20,0.5)'; MGH.rr(g, cx + 96, y - 9, 34, 18, 6); g.fill(); MGH.text(g, d + 'm', cx + 113, y + 5, 12, '#fff'); }
      if (S.best[i] > 0) { const r = S.best[i] * 8 * 0.95; g.strokeStyle = m.players[i].color; g.lineWidth = 4; g.beginPath(); g.arc(cx, cy, r, -Math.PI / 2 - 0.3, -Math.PI / 2 + 0.3); g.stroke(); MGH.text(g, '🚩', cx, cy - r - 4, 18, '#fff'); }
      g.strokeStyle = 'rgba(80,80,90,0.55)'; g.lineWidth = 2; for (let k = 0; k <= 10; k++) { const a = Math.PI * 0.1 + k * Math.PI * 0.08; g.beginPath(); g.moveTo(cx + Math.cos(a) * 70, cy + Math.sin(a) * 40 - 60); g.lineTo(cx + Math.cos(a) * 70, cy + Math.sin(a) * 40); g.stroke(); } g.beginPath(); g.ellipse(cx, cy - 60, 70, 40, 0, Math.PI * 0.1, Math.PI * 0.9); g.stroke();
      g.fillStyle = 'rgba(0,0,0,0.2)'; g.beginPath(); g.ellipse(cx + 4, cy + 4, 46, 22, 0, 0, 7); g.fill(); g.fillStyle = '#c8c4bc'; g.beginPath(); g.ellipse(cx, cy, 44, 20, 0, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 3; g.stroke();
      let hx, hy;
      if (p.st === 'spin') {
        // the release window: when the hammer points up the field the ring glows green
        const ang = ((p.a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2), tx = -Math.sin(ang), ty = Math.cos(ang), ok = ty > 0 && Math.abs(Math.atan2(tx, ty)) < SEC * 0.8;
        if (ok && p.w > 4) { g.strokeStyle = 'rgba(120,255,120,0.9)'; g.lineWidth = 5; g.beginPath(); g.ellipse(cx, cy, 58, 30, 0, 0, 7); g.stroke(); MGH.text(g, 'LET GO!', cx, cy - 92, 16, '#9fff9a', 'center', 'bold'); }
        hx = cx + Math.cos(p.a) * 58; hy = cy - Math.sin(p.a) * 30;
        for (let q = 1; q <= 4; q++) { const a2 = p.a - q * 0.12 * Math.min(1, p.w / 8); g.fillStyle = `rgba(200,200,220,${0.18 - q * 0.035})`; g.beginPath(); g.arc(cx + Math.cos(a2) * 58, cy - Math.sin(a2) * 30, 9, 0, 7); g.fill(); }
        g.strokeStyle = '#8a8a96'; g.lineWidth = 2; g.setLineDash([4, 3]); g.beginPath(); g.moveTo(cx, cy - 18); g.lineTo(hx, hy); g.stroke(); g.setLineDash([]);
      } else { hx = cx + clamp(p.hx * 0.3, -150, 150); hy = cy + p.hy * 0.95; if (p.st === 'fly') { g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(hx + 6, hy + 30, 10, 4, 0, 0, 7); g.fill(); } else { g.fillStyle = 'rgba(90,60,30,0.5)'; g.beginPath(); g.ellipse(hx, hy + 6, 16, 6, 0, 0, 7); g.fill(); } }
      MGH.av(g, m, i, cx, cy - 10, 22, p.st === 'done' ? (p.foul ? 'hurt' : p.dist > 40 ? 'cheer' : 'happy') : p.dizzy > 0 ? 'dizzy' : p.w > 10 ? 'effort' : 'determined', { look: { x: Math.cos(p.a), y: 0 }, hands: p.st === 'spin' ? { n: { x: Math.cos(p.a) * 1.2, y: -Math.sin(p.a) * 0.6 - 0.3, d: 0, o: false, m: true }, f: { x: Math.cos(p.a) * 1.0, y: -Math.sin(p.a) * 0.5 - 0.2, d: 0, o: false, m: false } } : undefined });
      const hg = g.createRadialGradient(hx - 4, hy - 4, 2, hx, hy, 12); hg.addColorStop(0, '#d8d8e8'); hg.addColorStop(1, '#3a3a48'); g.fillStyle = hg; g.beginPath(); g.arc(hx, hy, 11, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,0.6)'; g.beginPath(); g.arc(hx - 4, hy - 4, 3, 0, 7); g.fill();
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
    MGH.scene(g, 'space', m.t);
    for (const st of S.stars) MGH.star(g, st.x, st.y, 13, '#ffd34d', m.t);
    for (const r of S.rocks) { g.save(); g.translate(r.x, r.y); g.rotate(r.rot); g.fillStyle = '#6b6378'; g.beginPath(); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, rr = r.r * (0.8 + 0.2 * Math.sin(k * 3)); k ? g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : g.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); g.fill(); g.fillStyle = '#4a4458'; g.beginPath(); g.arc(r.r * 0.3, -r.r * 0.2, r.r * 0.2, 0, 7); g.fill(); g.restore(); }
    S.s.forEach((s, i) => {
      g.save(); g.translate(s.x, s.y); g.rotate(s.a);
      if (m.held(i, 'a') && s.stun <= 0) { MGH.fireball(g, -22, 0, 9, m.t, -1, 0, ['#fff', '#ffd34d', '#ff5a1f']); }
      const col = m.players[i].color; g.fillStyle = MGH.grad(g, -18, 18, [Char.shade(col, 0.4), Char.shade(col, -0.3)]); g.beginPath(); g.moveTo(30, 0); g.quadraticCurveTo(10, -14, -14, -20); g.lineTo(-8, 0); g.lineTo(-14, 20); g.quadraticCurveTo(10, 14, 30, 0); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke();
      g.fillStyle = 'rgba(160,220,255,0.85)'; g.beginPath(); g.ellipse(8, 0, 9, 6, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,0.7)'; g.beginPath(); g.ellipse(10, -2, 3, 2, 0, 0, 7); g.fill();
      g.restore();
      MGH.av(g, m, i, s.x, s.y - 4, 10, s.stun > 0 ? 'dizzy' : 'determined', { noFeet: true, noArms: true, simple: true, look: { x: Math.cos(s.a), y: Math.sin(s.a) } });
    });
  },
});

// 55 ---------------------------------------------------------------- Glacier Slalom
MG.def({
  id: 'slalom', name: 'Glacier Slalom', type: 'Race', controls: 'Left/Right + button',
  how: 'Ski down the glacier through the flag gates. LEFT/RIGHT steer; hold the button to tuck for speed. Hit an ice ramp to fly — tap the button in the air to spin a trick (each one takes 0.4 s off your time) but land before the spin ends or you wipe out! Missing a gate costs 1.5 s; pine trees make you tumble.',
  wins: 'Fastest time.',
  init(m, S) {
    S.len = 9000; S.gates = []; let x = 160;
    for (let d = 500; d < S.len - 200; d += R.range(330, 420)) { x = clamp(x + R.range(-110, 110), 70, 250); S.gates.push({ d, x }); }
    S.trees = []; for (let d = 700; d < S.len; d += R.range(140, 260)) { const x = R.range(30, 290); if (!S.gates.some(g => Math.abs(g.d - d) < 90 && Math.abs(g.x - x) < 80)) S.trees.push({ d, x }); }
    S.ramps = []; for (let k = 0; k < S.gates.length - 1; k += 2) { const a = S.gates[k], b = S.gates[k + 1]; S.ramps.push({ d: (a.d + b.d) / 2, x: clamp((a.x + b.x) / 2 + R.range(-30, 30), 50, 270) }); }
    S.p = [0, 1, 2, 3].map(() => ({ x: 160, d: 0, v: 250, pen: 0, fall: 0, fin: 0, done: new Set(), hitT: new Set(), msg: '', mt: 0, air: 0, spin: 0, tricks: 0, rampsUsed: new Set(), rot: 0 }));
  },
  update(m, S, dt) {
    S.p.forEach((p, i) => {
      if (p.fin) return;
      p.mt -= dt;
      if (p.fall > 0) { p.fall -= dt; p.v = 120; return; }
      if (p.air > 0) {
        p.air -= dt; p.spin -= dt; if (p.spin > 0) p.rot += dt * Math.PI * 2 / 0.4;
        if (m.pressed(i, 'a') && p.spin <= 0 && p.tricks < 3) { p.spin = 0.4; p.tricks++; if (!m.bot(i)) Sfx.whoosh(true); }
        p.x = clamp(p.x + m.axis(i).x * 120 * dt, 20, 300); p.d += p.v * dt;
        if (p.air <= 0) {
          if (p.spin > 0.05) { p.fall = 1.1; p.msg = 'WIPEOUT!'; p.mt = 1; p.tricks = 0; MGH.burst(i * 320 + p.x, 560, ['#fff', '#cfefff'], 26, { speed: 260 }); if (!m.bot(i)) Sfx.bad(); }
          else if (p.tricks) { p.pen -= 0.4 * p.tricks; p.msg = `TRICK ×${p.tricks}  −${(0.4 * p.tricks).toFixed(1)}s`; p.mt = 1; MGH.burst(i * 320 + p.x, 560, ['#ffe680', '#fff'], 20, { speed: 220, kind: 'spark', size: 2 }); if (!m.bot(i)) Sfx.star(); }
          p.tricks = 0; p.rot = 0; p.spin = 0;
        }
      } else {
      const tuck = m.held(i, 'a');
      p.x = clamp(p.x + m.axis(i).x * (tuck ? 150 : 270) * dt, 20, 300);
      p.v = lerp(p.v, tuck ? 520 : 380, dt * 0.8);
      p.d += p.v * dt;
      S.ramps.forEach((r, k) => { if (!p.rampsUsed.has(k) && Math.abs(r.d - p.d) < 14 && Math.abs(r.x - p.x) < 34) { p.rampsUsed.add(k); p.air = 0.95; p.spin = 0; p.tricks = 0; Sfx.tone(400, 0.3, 'triangle', 0.04, 500); } });
      }
      S.gates.forEach((gt, k) => { if (!p.done.has(k) && p.d >= gt.d) { p.done.add(k); if (Math.abs(p.x - gt.x) > 48) { p.pen += 1.5; p.msg = 'missed gate +1.5s'; p.mt = 0.8; } else { MGH.burst(i * 320 + p.x, 560, ['#fff', '#cfefff'], 6, { speed: 120 }); } } });
      S.trees.forEach((t, k) => { if (p.air <= 0 && !p.hitT.has(k) && Math.abs(t.d - p.d) < 16 && Math.abs(t.x - p.x) < 24) { p.hitT.add(k); p.fall = 1; MGH.burst(i * 320 + p.x, 560, ['#fff', '#2d6b3a'], 20, { speed: 240 }); if (!m.bot(i)) Sfx.bad(); } });
      if (p.d >= S.len) { p.fin = m.t + p.pen; MGH.pop('FINISH', i * 320 + 160, 300, m.players[i].color, 32); }
    });
    if (S.p.every(p => p.fin) || m.t > 70) m.finish(this.score(m, S));
  },
  bot(m, S, i) {
    const p = S.p[i], v = m.vin[i]; v.left = v.right = v.a = false; if (p.fall > 0 || p.fin) return;
    if (p.air > 0) { if (p.air > 0.6 && p.spin <= 0 && p.tricks < (i % 2 ? 2 : 1) && Math.random() < 0.3) v.a = !m.prev[i].a; return; }
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
  hud(m, S, i) { const p = S.p[i]; return p.fin ? `✔ ${p.fin.toFixed(1)}s` : `${Math.round(p.d / S.len * 100)}% (${p.pen >= 0 ? "+" : ""}${p.pen.toFixed(1)}s)`; },
  draw(m, S, g) {
    MGH.scene(g, 'ice', m.t); MGH.lanes(g, m);
    S.p.forEach((p, i) => {
      const ox = i * 320, yC = 560;
      g.save(); g.beginPath(); g.rect(ox, 40, 320, 680); g.clip();
      g.fillStyle = 'rgba(255,255,255,0.75)'; g.fillRect(ox, 40, 320, 680);
      for (let k = 0; k < 12; k++) { const y = ((k * 70 + p.d) % 840) - 60; g.strokeStyle = 'rgba(150,190,230,0.35)'; g.lineWidth = 2; g.beginPath(); g.moveTo(ox + 30 + (k * 47) % 260, y); g.quadraticCurveTo(ox + 60 + (k * 47) % 260, y + 20, ox + 30 + (k * 47) % 260, y + 40); g.stroke(); }
      S.ramps.forEach((r, k) => { const y = yC - (r.d - p.d); if (y < 20 || y > 760) return; g.fillStyle = MGH.grad(g, y - 26, y + 6, ['#bfe8ff', '#5fa8e0']); g.beginPath(); g.moveTo(ox + r.x - 34, y + 6); g.lineTo(ox + r.x + 34, y + 6); g.lineTo(ox + r.x + 26, y - 26); g.lineTo(ox + r.x - 26, y - 26); g.closePath(); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke(); MGH.text(g, '▲', ox + r.x, y - 4, 16, '#fff', 'center', 'bold'); });
      S.gates.forEach((gt, k) => { const y = yC - (gt.d - p.d); if (y < 20 || y > 740) return; const ok = p.done.has(k), c = k % 2 ? '#e33' : '#36f'; g.globalAlpha = ok ? 0.35 : 1; for (const s of [-1, 1]) { const fx = ox + gt.x + s * 48; g.fillStyle = '#333'; g.fillRect(fx - 2, y - 34, 4, 36); g.fillStyle = c; g.beginPath(); g.moveTo(fx + 2, y - 34); g.lineTo(fx + 2 + s * 18 + Math.sin(m.t * 6 + k) * 3, y - 27); g.lineTo(fx + 2, y - 20); g.fill(); } g.globalAlpha = 1; });
      S.trees.forEach((t, k) => { const y = yC - (t.d - p.d); if (y < 20 || y > 760) return; MGH.shadow(g, ox + t.x + 6, y + 2, 16, 0.2); for (let l = 0; l < 3; l++) { g.fillStyle = ['#2d6b3a', '#3a8048', '#4a9a58'][l]; g.beginPath(); g.moveTo(ox + t.x, y - 48 + l * 12); g.lineTo(ox + t.x - 22 + l * 3, y - 10 + l * 2); g.lineTo(ox + t.x + 22 - l * 3, y - 10 + l * 2); g.fill(); } g.fillStyle = '#fff'; g.beginPath(); g.moveTo(ox + t.x, y - 48); g.lineTo(ox + t.x - 7, y - 38); g.lineTo(ox + t.x + 7, y - 38); g.fill(); g.fillStyle = '#5a3d22'; g.fillRect(ox + t.x - 3, y - 10, 6, 10); });
      if (p.d > S.len - 600) { const y = yC - (S.len - p.d); for (let x = 0; x < 320; x += 20) { g.fillStyle = (x / 20) % 2 ? '#222' : '#fff'; g.fillRect(ox + x, y, 20, 10); } }
      g.restore();
      const tuck = m.held(i, 'a') && p.air <= 0, air = p.air > 0 ? Math.sin((0.95 - p.air) / 0.95 * Math.PI) : 0;
      MGH.shadow(g, ox + p.x + air * 20, yC + 40, 18 - air * 6, 0.25);
      g.save(); g.translate(ox + p.x, yC - air * 40); g.rotate(p.rot); g.scale(1 + air * 0.3, 1 + air * 0.3);
      g.strokeStyle = '#333'; g.lineWidth = 3; g.beginPath(); g.moveTo(-10, 18); g.lineTo(-10, 42); g.moveTo(10, 18); g.lineTo(10, 42); g.stroke();
      MGH.av(g, m, i, 0, 0, tuck ? 16 : 19, p.fall > 0 ? 'dizzy' : p.fin ? 'cheer' : p.spin > 0 ? 'cheer' : tuck ? 'determined' : 'happy', { noFeet: true, look: { x: m.axis(i).x, y: 1 } });
      g.restore();
      if (p.air <= 0 && Math.random() < 0.5) MGH.burst(ox + p.x, yC + 42, ['#fff', '#dff4ff'], 1, { speed: 60, life: 0.4, size: 2 });
      if (p.mt > 0) MGH.label(g, p.msg, ox + 160, 470, 16, p.msg.startsWith('TRICK') ? '#ffb000' : '#c33', 'rgba(255,255,255,0.85)');
    });
  },
});

// 56 ---------------------------------------------------------------- Painterman (claim the floor)
MG.def({
  id: 'paint', name: 'Painterman', type: 'Arena', controls: 'Move', dur: 40,
  how: 'Every tile you walk over gets painted your colour — and rivals can paint right over it! Grab power-ups: 🍄 GIANT (paint a 3×3 area as you walk), 💥 SPLASH (instantly paints a big blob around you), ⚡ SPEED. Most tiles at the end wins.',
  wins: 'Most tiles painted.',
  init(m, S) {
    S.cols = 16; S.rows = 8; S.ts = 80; S.y0 = 80; S.grid = new Int8Array(S.cols * S.rows).fill(-1); S.fresh = new Float32Array(S.cols * S.rows);
    S.b = [0, 1, 2, 3].map(i => Object.assign(MGH.body([120, 1160, 120, 1160][i], [140, 140, 660, 660][i], 24), { big: 0, fast: 0 }));
    S.pu = []; S.puT = 3;
  },
  cell(S, x, y) { const c = Math.floor(x / S.ts), r = Math.floor((y - S.y0) / S.ts); return c >= 0 && c < S.cols && r >= 0 && r < S.rows ? [c, r] : null; },
  paint(S, c, r, i, t) { if (c < 0 || r < 0 || c >= S.cols || r >= S.rows) return; const k = r * S.cols + c; if (S.grid[k] !== i) { S.grid[k] = i; S.fresh[k] = t; } },
  update(m, S, dt) {
    S.puT -= dt;
    if (S.puT <= 0 && S.pu.length < 2) { S.puT = R.range(4, 6); S.pu.push({ k: R.pick(['big', 'splash', 'fast']), x: R.range(100, 1180), y: R.range(130, 680), t: 0 }); }
    S.pu.forEach(u => { u.t += dt; });
    S.b.forEach((b, i) => {
      b.big -= dt; b.fast -= dt;
      const a = m.axis(i); MGH.steer(b, a.x, a.y, dt, 2600, b.fast > 0 ? 470 : 300, 8); MGH.integrate(b, dt, 0, S.y0, 1280, S.y0 + S.rows * S.ts);
      const c = this.cell(S, b.x, b.y);
      if (c) { const rad = b.big > 0 ? 1 : 0; for (let dr = -rad; dr <= rad; dr++) for (let dc = -rad; dc <= rad; dc++) this.paint(S, c[0] + dc, c[1] + dr, i, m.t); }
      for (const u of S.pu) if (!u.got && dist(u.x, u.y, b.x, b.y) < b.r + 24) {
        u.got = true; Sfx.star(); MGH.burst(u.x, u.y, [m.players[i].color, '#fff'], 30, { speed: 300 });
        if (u.k === 'big') { b.big = 6; MGH.pop('GIANT!', b.x, b.y - 50, m.players[i].color, 28); }
        if (u.k === 'fast') { b.fast = 5; MGH.pop('SPEED!', b.x, b.y - 50, m.players[i].color, 28); }
        if (u.k === 'splash' && c) { for (let dr = -3; dr <= 3; dr++) for (let dc = -3; dc <= 3; dc++) if (dr * dr + dc * dc <= 10) this.paint(S, c[0] + dc, c[1] + dr, i, m.t); MGH.ring(b.x, b.y, m.players[i].color, 20, 260, 0.6); MGH.shake(8); Sfx.boom(); MGH.pop('SPLASH!', b.x, b.y - 50, m.players[i].color, 30); }
      }
    });
    S.pu = S.pu.filter(u => !u.got && u.t < 10);
    MGH.collide(S.b, 0.7);
  },
  bot(m, S, i) {
    const b = S.b[i];
    if (!S.bt) S.bt = [null, null, null, null];
    const pu = S.pu.find(u => !u.got && dist(u.x, u.y, b.x, b.y) < 320);
    if (pu) { MGH.aim(m, i, pu.x, pu.y, b, 8); return; }
    let t = S.bt[i];
    if (!t || S.grid[t[1] * S.cols + t[0]] === i || Math.random() < 0.01) {
      let best = null, bs = -1e9;
      for (let k = 0; k < 24; k++) { const c = R.int(0, S.cols - 1), r = R.int(0, S.rows - 1), o = S.grid[r * S.cols + c]; if (o === i) continue; const x = (c + 0.5) * S.ts, y = S.y0 + (r + 0.5) * S.ts; const sc = (o >= 0 ? 60 : 40) - dist(x, y, b.x, b.y) * 0.15; if (sc > bs) { bs = sc; best = [c, r]; } }
      S.bt[i] = t = best;
    }
    if (t) MGH.aim(m, i, (t[0] + 0.5) * S.ts, S.y0 + (t[1] + 0.5) * S.ts, b, 10);
  },
  score(m, S) { const n = [0, 0, 0, 0]; S.grid.forEach(o => { if (o >= 0) n[o]++; }); return n; },
  fmt(s) { return `${s} tiles`; },
  hud(m, S, i) { return this.score(m, S)[i] + ' tiles'; },
  draw(m, S, g) {
    MGH.scene(g, 'stage', m.t);
    for (let r = 0; r < S.rows; r++) for (let c = 0; c < S.cols; c++) {
      const k = r * S.cols + c, x = c * S.ts, y = S.y0 + r * S.ts, o = S.grid[k];
      g.fillStyle = (r + c) % 2 ? '#d8d0c4' : '#cfc6b8'; g.fillRect(x + 1, y + 1, S.ts - 2, S.ts - 2);
      if (o >= 0) {
        const col = m.players[o].color, age = m.t - S.fresh[k], pop = age < 0.25 ? 1 + (0.25 - age) * 1.2 : 1;
        g.save(); g.translate(x + S.ts / 2, y + S.ts / 2); g.scale(pop, pop);
        g.fillStyle = col; g.beginPath(); for (let a = 0; a < 12; a++) { const an = a / 12 * Math.PI * 2, rr = S.ts * (0.44 + MGH.hash(k * 12 + a) * 0.1); g.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); } g.closePath(); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.22)'; g.beginPath(); g.ellipse(-S.ts * 0.12, -S.ts * 0.14, S.ts * 0.16, S.ts * 0.08, -0.4, 0, 7); g.fill();
        g.restore();
      }
    }
    for (const u of S.pu) { const k = Math.min(1, u.t * 3); MGH.glow(g, u.x, u.y, 50, 'rgba(255,255,255,0.6)'); g.globalAlpha = u.t > 8.5 && Math.sin(u.t * 20) > 0 ? 0.4 : 1; MGH.emoji(g, { big: '🍄', splash: '💥', fast: '⚡' }[u.k], u.x, u.y + Math.sin(u.t * 4) * 5, 40 * k); g.globalAlpha = 1; }
    S.b.forEach((b, i) => {
      const sc = b.big > 0 ? 1.6 : 1; MGH.shadow(g, b.x, b.y + b.r * 1.25 * sc, b.r * sc, 0.35);
      if (b.fast > 0) for (let s = 1; s < 4; s++) { g.globalAlpha = 0.15; g.fillStyle = m.players[i].color; g.beginPath(); g.arc(b.x - b.vx * 0.03 * s, b.y - b.vy * 0.03 * s, b.r, 0, 7); g.fill(); g.globalAlpha = 1; }
      g.save(); g.translate(b.x, b.y); g.scale(sc, sc); g.translate(-b.x, -b.y); MGH.drawBody(g, b, m.players[i], '🖌️', b.big > 0 ? 'evil' : 'cheer'); g.restore();
    });
    // live tile race
    const n = this.score(m, S), tot = S.cols * S.rows; let x = 340;
    g.fillStyle = 'rgba(0,0,0,0.5)'; MGH.rr(g, 336, 48, 608, 22, 11); g.fill();
    n.forEach((v, i) => { const w = 600 * v / tot; g.fillStyle = m.players[i].color; g.fillRect(x, 52, w, 14); x += w; });
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
    MGH.scene(g, 'lava', m.t); MGH.lanes(g, m);
    S.p.forEach((p, i) => {
      const ox = i * 320;
      g.fillStyle = '#3a2a1c'; g.fillRect(ox, 680, 320, 40);
      for (const b of p.balls) {
        MGH.fireball(g, ox + b.x, b.y, 15, m.t, b.vx, b.vy || 1);
        if (b.vy > 0) { g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(ox + b.x, 682, 16 - (680 - b.y) / 60, 4, 0, 0, 7); g.fill(); }
      }
      const danger = p.balls.some(b => b.vy > 0 && b.y > 560 && Math.abs(b.x - p.x) > 60);
      MGH.av(g, m, i, ox + p.x, 640, 26, p.bump > 0 ? 'cheer' : danger ? 'scared' : 'determined', { walk: Math.abs(m.axis(i).x), look: { x: (p.fc = Math.abs(m.axis(i).x) > 0.2 ? Math.sign(m.axis(i).x) : (p.fc || 1)) * 0.5, y: -1 } });
    });
  },
});

// 59 ---------------------------------------------------------------- Bridge Collapse
MG.def({
  id: 'bridge', name: 'Bridge Collapse', type: 'Survival', controls: 'Left/Right + A & B', dur: 50,
  how: 'Everyone is on one old rope bridge over the abyss. Planks shake, then fall — faster and faster. Run LEFT/RIGHT and press the button to jump over gaps. Press B to SHOVE a rival next to you toward the gaps. Fall and you are out.',
  wins: 'Last one on the bridge.',
  init(m, S) {
    S.n = 18; S.pw = 1280 / S.n; S.st = new Array(S.n).fill(0).map(() => ({ s: 'ok', t: 0 }));
    S.p = [0, 1, 2, 3].map(i => ({ x: 280 + i * 240, y: 0, vy: 0, vx: 0, ground: true, alive: true, outT: 0, kx: 0, cd: 0, shove: 0, hurt: 0, face: i < 2 ? 1 : -1 }));
    S.fx = [];
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
      const ax = m.axis(i).x; if (ax) p.face = Math.sign(ax);
      p.vx = lerp(p.vx, ax * 260, dt * 10) + p.kx; p.kx *= Math.pow(0.03, dt); p.cd -= dt; p.shove -= dt; p.hurt -= dt;
      if (m.pressed(i, 'a') && p.ground) { p.vy = 520; p.ground = false; }
      if (m.pressed(i, 'b') && p.cd <= 0) {
        p.cd = 1.2; p.shove = 0.3;
        S.p.forEach((q, j) => { if (j === i || !q.alive || Math.abs(q.y - p.y) > 40) return; const dx = q.x - p.x; if (Math.abs(dx) < 70 && Math.sign(dx) === p.face) { q.kx += p.face * 360; q.vy = Math.max(q.vy, 150); q.ground = false; q.hurt = 0.7; S.fx.push({ x: (p.x + q.x) / 2, y: 480 - 30 - p.y, t: 0 }); MGH.shake(9); Sfx.punch(); Sfx.voice(m.players[j].el.id, 'ouch'); MGH.burst((p.x + q.x) / 2, 450 - p.y, ['#fff', '#ffd34d', m.players[i].color], 18, { speed: 280, kind: 'spark', size: 3 }); } });
        if (!m.bot(i)) Sfx.whoosh(true);
      }
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
    S.fx.forEach(f => { f.t += dt; }); S.fx = S.fx.filter(f => f.t < 0.6);
    if (S.p.filter(p => p.alive).length <= 1) m.finish(this.score(m, S));
  },
  bot(m, S, i) {
    const p = S.p[i], v = m.vin[i]; v.left = v.right = v.a = v.b = false; if (!p.alive) return;
    if (p.cd <= 0 && Math.random() < 0.08 && S.p.some((q, j) => j !== i && q.alive && Math.abs(q.x - p.x) < 60 && Math.sign(q.x - p.x) === p.face)) v.b = true;
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
    MGH.scene(g, 'night', m.t);
    g.fillStyle = MGH.grad(g, 500, 720, ['rgba(20,10,40,0)', '#05020a']); g.fillRect(0, 500, 1280, 220);
    for (let k = 0; k < 6; k++) MGH.glow(g, 200 + k * 180, 700, 80, 'rgba(120,60,200,0.25)');
    g.fillStyle = '#4a3a5a'; g.beginPath(); g.moveTo(0, 520); g.lineTo(80, 470); g.lineTo(140, 720); g.lineTo(0, 720); g.fill(); g.beginPath(); g.moveTo(1280, 520); g.lineTo(1200, 470); g.lineTo(1140, 720); g.lineTo(1280, 720); g.fill();
    g.strokeStyle = '#c9a36b'; g.lineWidth = 4; g.beginPath(); g.moveTo(0, 430); g.quadraticCurveTo(640, 470, 1280, 430); g.stroke();
    S.st.forEach((s, k) => {
      if (s.s === 'gone') return;
      const sx = s.s === 'shake' ? Math.sin(m.t * 50 + k) * 3 : 0, x = k * S.pw + sx;
      g.fillStyle = MGH.grad(g, 480, 498, s.s === 'shake' ? ['#a0603a', '#5a2e14'] : ['#c09a6a', '#7a5a34']); MGH.rr(g, x + 2, 480, S.pw - 4, 18, 4); g.fill();
      g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x + 6, 489); g.lineTo(x + S.pw - 6, 489); g.stroke();
      if (s.s === 'shake') { g.strokeStyle = '#2a1408'; g.lineWidth = 2; g.beginPath(); g.moveTo(x + S.pw * 0.4, 480); g.lineTo(x + S.pw * 0.5, 490); g.lineTo(x + S.pw * 0.45, 498); g.stroke(); }
      g.strokeStyle = '#c9a36b'; g.lineWidth = 2; g.beginPath(); g.moveTo(x + S.pw / 2, 488); g.lineTo(x + S.pw / 2, 445); g.stroke();
    });
    S.p.forEach((p, i) => {
      if (!p.alive && p.y < -500) return;
      const mood = !p.alive ? 'scared' : p.shove > 0 ? 'evil' : p.hurt > 0 ? 'dizzy' : S.st[this.plankAt(S, p.x)].s === 'shake' ? 'scared' : p.ground ? 'determined' : 'cheer';
      g.save(); g.translate(p.x, 480 - 22 - p.y); if (p.hurt > 0) g.rotate(Math.sin(m.t * 30) * 0.25); if (p.shove > 0) g.translate(p.face * 10 * (p.shove / 0.3), 0);
      MGH.av(g, m, i, 0, 0, 20, mood, { walk: Math.abs(p.vx) > 30 ? 1 : 0, look: { x: p.face, y: 0.3 } });
      g.restore();
      if (p.shove > 0) { g.globalAlpha = p.shove / 0.3; for (let s = 0; s < 3; s++) { g.strokeStyle = m.players[i].color; g.lineWidth = 3; g.beginPath(); g.arc(p.x + p.face * (36 + s * 10), 450 - p.y, 14 + s * 6, p.face > 0 ? -1 : 2.1, p.face > 0 ? 1 : 4.2); g.stroke(); } g.globalAlpha = 1; }
    });
    for (const f of S.fx) { const k = f.t / 0.6, sc = (1 - k) * 1.3 + 0.4; g.save(); g.translate(f.x, f.y - k * 30); g.scale(sc, sc); g.rotate(-0.2); g.fillStyle = '#ffe14d'; g.strokeStyle = '#d2261b'; g.lineWidth = 3; g.beginPath(); for (let a = 0; a < 18; a++) { const an = a / 18 * Math.PI * 2, r = a % 2 ? 16 : 30; a ? g.lineTo(Math.cos(an) * r, Math.sin(an) * r) : g.moveTo(Math.cos(an) * r, Math.sin(an) * r); } g.closePath(); g.fill(); g.stroke(); g.font = 'bold 14px Georgia'; g.textAlign = 'center'; g.fillStyle = '#d2261b'; g.fillText('SHOVE!', 0, 5); g.restore(); }
  },
});

// 60 ---------------------------------------------------------------- Spirit Keeper
MG.def({
  id: 'keeper', name: 'Spirit Keeper', type: 'Reaction', controls: 'Left/Right + button',
  how: 'You guard a goal against a ghostly striker. Watch the run-up — the striker glances where it means to shoot (but sometimes bluffs!). Shuffle with LEFT/RIGHT and press the button to dive in the direction you are moving. Ten shots.',
  wins: 'Most saves.',
  init(m, S) {
    S.shots = []; for (let k = 0; k < 10; k++) { const tgt = Math.random() < 0.14 ? 0 : R.pick([-1, 1]); S.shots.push({ tgt, x: tgt ? tgt * R.range(80, 118) + R.range(-12, 12) : R.pick([-1, 1]) * R.range(34, 52), look: Math.random() < 0.72 ? tgt : R.pick([-1, 0, 1]), sp: R.range(0.45, 0.7) - k * 0.015 }); }
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
        const reach = p.dive > 0 ? 58 : 24; // standing still in the middle no longer saves anything
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
    MGH.scene(g, 'meadow', m.t); MGH.crowd(g, m.t, 60, 34, ['#6a8ac8', '#8a6ab8', '#c87a6a', '#6ab88a']); MGH.lanes(g, m);
    for (let i = 0; i < 4; i++) { g.fillStyle = 'rgba(70,150,60,0.6)'; g.fillRect(i * 320 + 4, 120, 312, 600); for (let y = 120; y < 720; y += 60) { g.fillStyle = 'rgba(255,255,255,0.05)'; g.fillRect(i * 320 + 4, y, 312, 30); } }
    const sh = S.shots[Math.min(S.k, 9)];
    S.p.forEach((p, i) => {
      const cx = i * 320 + 160;
      g.fillStyle = 'rgba(255,255,255,0.12)'; g.beginPath(); g.moveTo(cx - 130, 540); g.lineTo(cx + 130, 540); g.lineTo(cx + 110, 520); g.lineTo(cx - 110, 520); g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 1; for (let x = -130; x <= 130; x += 13) { g.beginPath(); g.moveTo(cx + x, 540); g.lineTo(cx + x * 0.85, 520); g.stroke(); } for (let y = 540; y <= 650; y += 13) { g.beginPath(); g.moveTo(cx - 130, y); g.lineTo(cx + 130, y); g.stroke(); }
      g.strokeStyle = '#fff'; g.lineWidth = 7; g.beginPath(); g.moveTo(cx - 130, 650); g.lineTo(cx - 130, 540); g.lineTo(cx + 130, 540); g.lineTo(cx + 130, 650); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,0.15)'; g.lineWidth = 1; for (let x = -120; x <= 120; x += 20) { g.beginPath(); g.moveTo(cx + x, 540); g.lineTo(cx + x, 650); g.stroke(); }
      // striker
      const run = S.ph === 'wind' ? S.t / 1.4 : 1;
      const sy = 160 + run * 120;
      Char.draw(g, cx + (S.ph === 'wind' ? sh.look * 8 * Math.min(1, S.t * 2) : 0), sy, 24, -1, '#cfd6ff', { mood: 'determined', seed: S.k, alpha: 0.85, look: { x: S.ph === 'wind' && S.t > 0.5 ? sh.look : 0, y: 1 } });
      let bx = cx, by = sy + 30;
      if (S.ph === 'shot') { const k = Math.min(1, S.t / sh.sp); bx = cx + sh.x * k; by = sy + 30 + (600 - sy - 30) * k; }
      if (S.ph === 'reset') { bx = cx + sh.x; by = p.res === 'SAVE!' ? 560 : 625; }
      MGH.glow(g, bx, by, 26, 'rgba(180,220,255,0.6)'); g.fillStyle = '#fff'; g.beginPath(); g.arc(bx, by, 11, 0, 7); g.fill(); g.strokeStyle = '#333'; g.lineWidth = 1.5; g.stroke(); g.fillStyle = '#333'; g.beginPath(); g.arc(bx, by, 4, 0, 7); g.fill();
      const tilt = p.dive > 0 ? Math.sign(p.dv) * 1.1 : 0;
      g.save(); g.translate(cx + p.x, 610); g.rotate(tilt); g.translate(-(cx + p.x), -610);
      MGH.av(g, m, i, cx + p.x, 610, 22, p.res === 'SAVE!' ? 'cheer' : p.res === 'goal' ? 'hurt' : S.ph === 'shot' ? 'scared' : 'determined', { look: { x: (bx - cx - p.x) / 200, y: -1 }, walk: Math.abs(m.axis(i).x) });
      g.restore();
      if (p.res) MGH.text(g, p.res, cx, 500, 26, p.res === 'SAVE!' ? '#ffe680' : '#ff6b6b', 'center', 'bold');
    });
  },
});
