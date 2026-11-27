'use strict';
// Party batch 3a: Ninja Wheel, Fishing Frenzy, Trampoline Tricks, Chicken Crossing, Laser Limbo

// ======================================================================== NINJA WHEEL
const NW_SECT = ['x1', 'x2', 'x1', 'skull', 'x1', 'x2', 'x1', 'x1', 'x2', 'x1', 'skull', 'x1'];
MG.def({
  id: 'ninjawheel', name: 'Ninja Wheel', type: 'Skill', controls: '1 button (hold & release)', dur: 0,
  rows: [['a', 'Hold to charge, let go to throw']],
  how: 'The sensei spins the great training wheel! Hold A to charge your throwing star and let go to throw it at the wheel. More power flies it deeper into the wheel: the outer ring is 10, then 25, 50 and the bullseye 100. GOLD sectors double your points; the black SKULL sectors cost 30! Stars stay stuck in the wheel — hit one and yours bounces off for nothing. Six stars each; halfway through the wheel spins faster and the other way.',
  wins: 'Most points after six stars.',
  CX: 640, CY: 300, RR: 220,
  init(m, S) { S.ang = 0; S.spd = 1.1; S.stuck = []; S.fly = []; S.p = [0, 1, 2, 3].map(i => ({ left: 6, hold: -1, cd: 0, pts: 0, msg: '', msgT: 0 })); S.phase = 1; },
  thrower(i) { return { x: [210, 500, 780, 1070][i], y: 650 }; },
  impactAng(i) { const T = this.thrower(i); return Math.atan2(T.y - this.CY, T.x - this.CX); },
  update(m, S, dt) {
    const thrown = S.p.reduce((a, p) => a + (6 - p.left), 0);
    if (S.phase === 1 && thrown >= 12) { S.phase = 2; MGH.pop('FASTER!', 640, 560, '#ffe680', 40); Sfx.tone(300, 0.3, 'sawtooth', 0.05, 300); }
    const target = S.phase === 1 ? 1.1 + Math.sin(m.t * 0.7) * 0.35 : -(1.9 + Math.sin(m.t * 1.1) * 0.5);
    S.spd += (target - S.spd) * dt * 1.5; S.ang += S.spd * dt;
    S.p.forEach((p, i) => {
      p.cd -= dt; p.msgT -= dt;
      if (p.left <= 0 || p.cd > 0) return;
      if (m.held(i, 'a')) { if (p.hold < 0) p.hold = 0; p.hold += dt; }
      else if (p.hold > 0) { const pw = 0.5 - 0.5 * Math.cos(p.hold * 2.4); S.fly.push({ i, pw, t: 0 }); p.left--; p.hold = -1; p.cd = 0.55; if (!m.bot(i)) Sfx.whoosh(); }
    });
    S.fly.forEach(f => {
      f.t += dt; if (f.t < 0.3 || f.done) return; f.done = true;
      const p = S.p[f.i], a = this.impactAng(f.i), rad = this.RR * (0.97 - f.pw * 0.95), local = ((a - S.ang) % (Math.PI * 2) + Math.PI * 4) % (Math.PI * 2);
      const px = Math.cos(a) * rad, py = Math.sin(a) * rad;
      if (S.stuck.some(s => { const sa = s.la + S.ang; return Math.hypot(Math.cos(sa) * s.r - px, Math.sin(sa) * s.r - py) < 18; })) { p.msg = 'CLANK! 0'; p.msgT = 1; Sfx.tone(1800, 0.06, 'square', 0.05); MGH.burst(this.CX + px, this.CY + py, ['#ddd', '#fff'], 8, { speed: 200 }); return; }
      const sect = NW_SECT[Math.floor(local / (Math.PI * 2 / NW_SECT.length))], ring = rad < this.RR * 0.13 ? 100 : rad < this.RR * 0.4 ? 50 : rad < this.RR * 0.7 ? 25 : 10;
      const pts = sect === 'skull' ? -30 : ring * (sect === 'x2' ? 2 : 1);
      p.pts += pts; p.msg = pts < 0 ? 'SKULL −30' : (ring === 100 ? 'BULLSEYE! ' : '') + '+' + pts + (sect === 'x2' ? ' (×2)' : ''); p.msgT = 1.2;
      S.stuck.push({ la: local, r: rad, i: f.i });
      if (pts < 0) Sfx.bad(); else { Sfx.thud(); if (ring >= 50) Sfx.coin(); }
      MGH.burst(this.CX + px, this.CY + py, pts < 0 ? ['#333', '#a020c0'] : ['#ffd34d', '#fff', m.players[f.i].color], 12, { speed: 180 });
    });
    S.fly = S.fly.filter(f => !f.done);
    if (S.p.every(p => p.left <= 0) && !S.fly.length) { S.endT = (S.endT || 0) + dt; if (S.endT > 1.2) m.finish(this.score(m, S)); }
  },
  bot(m, S, i) {
    const p = S.p[i], v = m.vin[i];
    if (p.left <= 0 || p.cd > 0) { v.a = false; return; }
    p.want = p.want || R.range(0.55, 0.97);
    const pw = p.hold > 0 ? 0.5 - 0.5 * Math.cos(p.hold * 2.4) : 0;
    if (p.hold > 0 && pw >= p.want) {
      const a = this.impactAng(i), la = ((a - (S.ang + S.spd * 0.3)) % (Math.PI * 2) + Math.PI * 4) % (Math.PI * 2), sect = NW_SECT[Math.floor(la / (Math.PI * 2 / NW_SECT.length))];
      if (sect !== 'skull' || p.hold > 2.6 || Math.random() < 0.15) { v.a = false; p.want = null; return; }
    }
    v.a = true;
  },
  score(m, S) { return S.p.map(p => p.pts); },
  fmt(s) { return `${s} pts`; },
  hud(m, S, i) { return `${S.p[i].pts} pts · ${'✦'.repeat(S.p[i].left)}`; },
  star(g, x, y, s, col, rot) { g.save(); g.translate(x, y); g.rotate(rot); g.fillStyle = '#c8ccd6'; g.strokeStyle = '#5a606a'; g.lineWidth = 1.5; g.beginPath(); for (let k = 0; k < 8; k++) { const rr = k % 2 ? s * 0.32 : s, a = k * Math.PI / 4; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); g.fill(); g.stroke(); g.fillStyle = col; g.beginPath(); g.arc(0, 0, s * 0.25, 0, 7); g.fill(); g.restore(); },
  draw(m, S, g) {
    // dojo
    g.fillStyle = MGH.grad(g, 0, 720, ['#3a2418', '#5a3a26', '#2a1810']); g.fillRect(0, 0, 1280, 720);
    for (let k = 0; k < 8; k++) { g.fillStyle = k % 2 ? 'rgba(255,240,210,0.08)' : 'rgba(255,240,210,0.14)'; g.fillRect(k * 160, 40, 160, 520); g.strokeStyle = '#2a1a10'; g.lineWidth = 6; g.strokeRect(k * 160, 40, 160, 520); }
    for (const x of [80, 1200]) { g.fillStyle = '#c8302a'; g.fillRect(x - 40, 60, 80, 220); g.fillStyle = '#ffd34d'; g.font = 'bold 40px serif'; g.textAlign = 'center'; for (let q = 0; q < 3; q++) g.fillText(['技', '心', '力'][q], x, 115 + q * 70); }
    g.fillStyle = MGH.grad(g, 560, 720, ['#c89a5a', '#a87a3a']); g.fillRect(0, 560, 1280, 160); for (let k = 0; k < 14; k++) { g.strokeStyle = 'rgba(0,0,0,0.15)'; g.beginPath(); g.moveTo(k * 100, 560); g.lineTo(k * 100, 720); g.stroke(); }
    // stand and wheel
    const cx = this.CX, cy = this.CY, R0 = this.RR, n = NW_SECT.length;
    g.fillStyle = '#5a3a20'; g.fillRect(cx - 16, cy, 32, 280); g.fillRect(cx - 90, 560, 180, 20);
    g.save(); g.translate(cx, cy); g.rotate(S.ang);
    g.fillStyle = '#3a2410'; g.beginPath(); g.arc(0, 0, R0 + 14, 0, 7); g.fill();
    NW_SECT.forEach((t, k) => { const a0 = k * Math.PI * 2 / n, a1 = a0 + Math.PI * 2 / n; g.fillStyle = t === 'skull' ? '#1a1a22' : t === 'x2' ? '#ffcc33' : k % 2 ? '#c8302a' : '#f4ecd8'; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, R0, a0, a1); g.closePath(); g.fill(); g.save(); g.rotate((a0 + a1) / 2); MGH.text(g, t === 'skull' ? '💀' : t === 'x2' ? '×2' : '', R0 * 0.82, 8, 26, t === 'x2' ? '#7a3a00' : '#fff', 'center', 'bold'); g.restore(); });
    for (const [f, c] of [[0.7, 'rgba(0,0,0,0.25)'], [0.4, 'rgba(0,0,0,0.25)'], [0.13, 'rgba(0,0,0,0.25)']]) { g.strokeStyle = c; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, R0 * f, 0, 7); g.stroke(); }
    g.fillStyle = '#ffd34d'; g.beginPath(); g.arc(0, 0, R0 * 0.13, 0, 7); g.fill(); g.fillStyle = '#c8302a'; g.beginPath(); g.arc(0, 0, R0 * 0.06, 0, 7); g.fill();
    for (const [lbl, f] of [['10', 0.85], ['25', 0.55], ['50', 0.27]]) { g.save(); g.rotate(-S.ang); MGH.text(g, '', 0, 0, 10, '#fff'); g.restore(); }
    S.stuck.forEach(s => this.star(g, Math.cos(s.la) * s.r, Math.sin(s.la) * s.r, 13, m.players[s.i].color, s.la * 3));
    g.restore();
    MGH.text(g, '10 · 25 · 50 · 100', cx, cy - R0 - 24, 18, '#ffe680', 'center', 'bold');
    // sensei
    Char.npc(g, 1000, 470, 40, 'sensei', { mood: 'stoic', t: m.t, look: { x: -1, y: -0.3 } });
    // throwers and flying stars
    m.players.forEach((pl, i) => {
      const T = this.thrower(i), p = S.p[i];
      Char.draw(g, T.x, T.y - 30, 30, pl.el.id, pl.color, { mood: p.msgT > 0 ? (p.msg.includes('−') || p.msg.includes('CLANK') ? 'shock' : 'cheer') : p.hold > 0 ? 'determined' : 'happy', seed: i, look: { x: (cx - T.x) / 500, y: -1 } });
      if (p.hold > 0) { const pw = 0.5 - 0.5 * Math.cos(p.hold * 2.4); g.fillStyle = 'rgba(0,0,0,0.5)'; MGH.rr(g, T.x + 40, T.y - 110, 14, 90, 6); g.fill(); g.fillStyle = pw > 0.87 ? '#ffd34d' : '#7cf06a'; g.fillRect(T.x + 43, T.y - 23 - pw * 84, 8, pw * 84); }
      if (p.msgT > 0) MGH.text(g, p.msg, T.x, T.y - 120, 20, p.msg.includes('−') ? '#ff8a8a' : '#ffe680', 'center', 'bold');
      MGH.text(g, `${pl.name} ${p.pts}`, T.x, 708, 18, pl.color, 'center', 'bold');
      const a = this.impactAng(i); g.strokeStyle = `rgba(255,255,255,${p.hold > 0 ? 0.35 : 0.12})`; g.setLineDash([6, 8]); g.lineWidth = 2; g.beginPath(); g.moveTo(T.x, T.y - 60); g.lineTo(cx + Math.cos(a) * 30, cy + Math.sin(a) * 30); g.stroke(); g.setLineDash([]);
    });
    S.fly.forEach(f => { const T = this.thrower(f.i), a = this.impactAng(f.i), rad = this.RR * (0.97 - f.pw * 0.95), q = Math.min(1, f.t / 0.3), tx = cx + Math.cos(a) * rad, ty = cy + Math.sin(a) * rad; this.star(g, T.x + (tx - T.x) * q, T.y - 60 + (ty - T.y + 60) * q, 13, m.players[f.i].color, f.t * 30); });
  },
});

// ======================================================================== FISHING FRENZY
const FISH = [{ n: 'minnow', v: 1, w: 8, col: '#9ac8e8', s: 0.7 }, { n: 'trout', v: 2, w: 6, col: '#e8a868', s: 1 }, { n: 'big bass', v: 4, w: 3, col: '#6a9a4a', s: 1.4 }, { n: 'GOLDEN KOI', v: 6, w: 1, col: '#ffcc33', s: 1.3 }, { n: 'old boot', v: 0, w: 2, col: '#6a4a2a', s: 1 }];
MG.def({
  id: 'fishing', name: 'Fishing Frenzy', type: 'Timing', controls: '1 button', dur: 60,
  rows: [['a', 'Cast · hook · reel (hold)']],
  how: 'Press A to cast. Watch the float: little NIBBLES are fish teasing you — wait! When the float plunges under with a big "!", press A to hook. Then reel: HOLD A to wind in, but watch the line tension — let go when it gets into the red or the line snaps. Minnows 1, trout 2, big bass 4, the rare golden koi 6 (watch out for old boots).',
  wins: 'Most points of fish landed.',
  init(m, S) { S.p = [0, 1, 2, 3].map(() => ({ st: 'idle', t: 0, wait: 0, nib: 0, fish: null, dist: 0, ten: 0, pts: 0, msg: '', msgT: 0, haul: [] })); },
  update(m, S, dt) {
    S.p.forEach((p, i) => {
      p.t += dt; p.msgT -= dt;
      const A = m.pressed(i, 'a');
      if (p.st === 'idle') { if (A) { p.st = 'wait'; p.t = 0; p.wait = R.range(2, 5); p.nib = R.range(0.6, 1.4); p.bx = R.range(-60, 60); if (!m.bot(i)) Sfx.whoosh(); } }
      else if (p.st === 'wait') {
        if (p.t > p.wait) { p.st = 'bite'; p.t = 0; if (!m.bot(i)) Sfx.tone(900, 0.1, 'square', 0.05); }
        else if (A) { p.st = 'idle'; p.msg = 'Too soon — it swam off!'; p.msgT = 1.2; }
      } else if (p.st === 'bite') {
        if (A) { const f = R.weighted ? R.weighted(FISH, x => x.w) : FISH[0]; p.fish = f; p.st = 'reel'; p.dist = 1; p.ten = 0.3; p.t = 0; }
        else if (p.t > 0.7) { p.st = 'idle'; p.msg = 'It got away…'; p.msgT = 1.2; }
      } else if (p.st === 'reel') {
        const pull = 0.25 + p.fish.s * 0.25 + Math.max(0, Math.sin(p.t * 2.3 + i)) * 0.35 * p.fish.s;
        if (m.held(i, 'a')) { p.ten += (0.55 + pull * 0.6) * dt; p.dist -= 0.22 * dt / p.fish.s; } else { p.ten -= 0.7 * dt; p.dist += 0.05 * dt * p.fish.s; }
        p.ten = Math.max(0, p.ten); p.dist = Math.min(1, p.dist);
        if (p.ten >= 1) { p.st = 'idle'; p.msg = 'SNAP! The line broke'; p.msgT = 1.4; if (!m.bot(i)) Sfx.bad(); }
        else if (p.dist <= 0) { p.st = 'idle'; p.pts += p.fish.v; p.haul.push(p.fish); p.msg = `${p.fish.n}! +${p.fish.v}`; p.msgT = 1.6; if (p.fish.v) Sfx.coin(); else Sfx.tone(200, 0.2, 'sine', 0.05); }
      }
    });
  },
  bot(m, S, i) {
    const p = S.p[i], v = m.vin[i]; v.a = false;
    if (p.st === 'idle') { if (Math.random() < 0.03) v.a = true; }
    else if (p.st === 'bite') { p.r = p.r || R.range(0.18, 0.55); if (p.t > p.r) { v.a = true; p.r = null; } }
    else if (p.st === 'reel') { p.holding = p.ten < 0.55 ? true : p.ten > 0.8 ? false : p.holding; v.a = !!p.holding; }
  },
  score(m, S) { return S.p.map(p => p.pts); },
  fmt(s) { return `${s} pts`; },
  hud(m, S, i) { return `${S.p[i].pts} pts`; },
  draw(m, S, g) {
    g.fillStyle = MGH.grad(g, 0, 300, ['#8fd0ff', '#d8f0ff']); g.fillRect(0, 0, 1280, 300);
    MGH.ridge(g, 270, 60, '#7ab86a', 4); g.fillStyle = MGH.grad(g, 260, 720, ['#4aa8d8', '#2a78b8', '#1a4a88']); g.fillRect(0, 260, 1280, 460);
    for (let k = 0; k < 24; k++) { g.strokeStyle = 'rgba(255,255,255,0.3)'; g.lineWidth = 2; g.beginPath(); g.arc((k * 97 + m.t * 12) % 1300, 300 + (k * 41) % 400, 10, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }
    S.p.forEach((p, i) => {
      const x = 160 + i * 320, dockY = 560, pl = m.players[i];
      g.fillStyle = '#8a5a32'; g.fillRect(x - 70, dockY, 140, 22); for (const dx of [-60, 60]) g.fillRect(x + dx - 5, dockY, 10, 110);
      const rodTip = { x: x + 70, y: dockY - 130 };
      Char.draw(g, x - 20, dockY - 40, 30, pl.el.id, pl.color, { mood: p.st === 'reel' ? (p.ten > 0.8 ? 'scared' : 'effort') : p.st === 'bite' ? 'shock' : p.msgT > 0 && p.msg.includes('+') ? 'cheer' : 'happy', seed: i, look: { x: 1, y: -0.3 }, hands: { n: { x: -1.1, y: -0.6, d: -140, o: false, m: false }, f: { x: -0.6, y: -0.2, d: 170, o: false, m: false } } });
      g.strokeStyle = '#5a3a20'; g.lineWidth = 4; g.beginPath(); g.moveTo(x + 10, dockY - 50); g.lineTo(rodTip.x, rodTip.y + (p.st === 'reel' ? 20 : 0)); g.stroke();
      if (p.st !== 'idle') {
        const fx = x + 40 + (p.bx || 0) * 0.5 + (p.st === 'reel' ? p.dist * 40 : 40), dip = p.st === 'bite' ? 14 : p.st === 'wait' && (p.t % p.nib) < 0.15 ? 5 : 0, fy = 420 + dip + Math.sin(m.t * 3 + i) * 2;
        g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(rodTip.x, rodTip.y); g.quadraticCurveTo((rodTip.x + fx) / 2, fy - 60, fx, fy); g.stroke();
        if (p.st === 'reel') { const fs = 18 * p.fish.s, fyy = fy + 30 + p.dist * 70; g.fillStyle = p.fish.col; g.beginPath(); g.ellipse(fx, fyy, fs, fs * 0.5, Math.sin(m.t * 8) * 0.3, 0, 7); g.fill(); g.beginPath(); g.moveTo(fx + fs * 0.8, fyy); g.lineTo(fx + fs * 1.4, fyy - fs * 0.4); g.lineTo(fx + fs * 1.4, fyy + fs * 0.4); g.fill(); }
        g.fillStyle = '#e8323e'; g.beginPath(); g.arc(fx, fy - 4, 7, Math.PI, 0); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(fx, fy - 4, 7, 0, Math.PI); g.fill();
        if (p.st === 'bite') MGH.text(g, '!', fx, fy - 30, 44, '#ff4a3a', 'center', 'bold');
        if (p.st === 'wait' && dip) { g.strokeStyle = 'rgba(255,255,255,0.6)'; g.beginPath(); g.ellipse(fx, fy + 4, 16, 5, 0, 0, 7); g.stroke(); }
      }
      if (p.st === 'reel') { g.fillStyle = 'rgba(0,0,0,0.55)'; MGH.rr(g, x - 70, 300, 140, 16, 8); g.fill(); g.fillStyle = 'rgba(124,240,106,0.35)'; g.fillRect(x - 66, 303, 136 * 0.8, 10); g.fillStyle = p.ten > 0.8 ? '#ff4a3a' : '#ffe680'; g.fillRect(x - 66, 303, 136 * p.ten, 10); MGH.text(g, 'tension', x, 296, 13, '#fff', 'center', 'bold'); }
      if (p.msgT > 0) MGH.text(g, p.msg, x, 270, 17, p.msg.includes('+') ? '#ffe680' : '#fff', 'center', 'bold');
      p.haul.slice(-6).forEach((f, k) => MGH.text(g, f.v ? '🐟' : '🥾', x - 55 + k * 22, dockY + 50, 18, '#fff'));
      MGH.text(g, `${pl.name} ${p.pts}`, x, 700, 18, pl.color, 'center', 'bold');
    });
  },
});

// ======================================================================== TRAMPOLINE TRICKS
MG.def({
  id: 'trampoline', name: 'Trampoline Tricks', type: 'Timing', controls: 'Move + button', dur: 45,
  rows: [['a', 'Press as you land to bounce higher'], ['lr', 'Spin in the air (land upright!)']],
  how: 'Bounce on your trampoline! Press A right as you touch down to bounce HIGHER (too early or late and you bounce lower). In the air, hold LEFT or RIGHT to spin — every full turn scores points, more the higher you are. But you must land UPRIGHT: land mid-spin and you crash flat, losing your height.',
  wins: 'Most trick points.',
  init(m, S) { S.p = [0, 1, 2, 3].map(() => ({ h: 0, vy: 260, rot: 0, spun: 0, pts: 0, crash: 0, msg: '', msgT: 0, pressT: -9 })); },
  update(m, S, dt) {
    S.p.forEach((p, i) => {
      p.msgT -= dt; p.crash -= dt;
      if (m.pressed(i, 'a')) p.pressT = m.t;
      const ax = m.axis(i).x;
      if (p.h > 30 && p.crash <= 0) { p.rot += ax * 7.5 * dt; }
      p.vy -= 900 * dt; p.h += p.vy * dt;
      const turns = Math.floor(Math.abs(p.rot) / (Math.PI * 2)); if (turns > p.spun) { p.spun = turns; const v = Math.round(10 + p.h / 20); p.pts += v; p.msg = `+${v}`; p.msgT = 0.6; if (!m.bot(i)) Sfx.tone(700 + turns * 100, 0.06, 'triangle', 0.05); }
      if (p.h <= 0) {
        p.h = 0; const off = Math.abs(Math.atan2(Math.sin(p.rot), Math.cos(p.rot)));
        if (off > 0.68) { p.crash = 0.8; p.vy = 160; p.msg = 'CRASH!'; p.msgT = 0.9; if (!m.bot(i)) Sfx.thud(); }
        else { const dtp = Math.abs(m.t - p.pressT); const good = dtp < 0.17; p.vy = Math.min(1150, Math.max(260, Math.abs(p.vy) * (good ? 1.12 : 0.85) + (good ? 40 : 0))); if (good) { p.msg = 'BOING!'; p.msgT = 0.5; if (!m.bot(i)) Sfx.tone(420, 0.1, 'sine', 0.06, 300); } }
        p.rot = 0; p.spun = 0;
      }
    });
  },
  bot(m, S, i) {
    const p = S.p[i], v = m.vin[i]; v.a = false; v.left = v.right = false;
    if (p.h < 26 && p.vy < 0 && Math.random() < 0.6) v.a = true;
    const tUp = (p.vy + Math.sqrt(Math.max(0, p.vy * p.vy + 1800 * p.h))) / 900, need = Math.PI * 2 - (Math.abs(p.rot) % (Math.PI * 2));
    if (p.h > 30 && (tUp > need / 7.5 + 0.12 || Math.abs(p.rot) % (Math.PI * 2) > 0.3)) v.right = true;
  },
  score(m, S) { return S.p.map(p => p.pts); },
  fmt(s) { return `${s} pts`; },
  hud(m, S, i) { return `${S.p[i].pts} pts`; },
  draw(m, S, g) {
    g.fillStyle = MGH.grad(g, 0, 720, ['#6ab8ff', '#bfe4ff', '#e8f8ff']); g.fillRect(0, 0, 1280, 720);
    for (let k = 0; k < 5; k++) MGH.cloud(g, ((k * 300 + m.t * 10) % 1500) - 110, 70 + (k % 2) * 60, 26);
    g.fillStyle = '#6ac84a'; g.fillRect(0, 640, 1280, 80);
    for (let k = 0; k < 12; k++) MGH.text(g, k % 2 ? '🎈' : '🎉', 60 + k * 110, 60 + (k % 3) * 20, 26, '#fff');
    S.p.forEach((p, i) => {
      const x = 160 + i * 320, base = 600, pl = m.players[i];
      g.strokeStyle = '#2a2a3a'; g.lineWidth = 6; for (const dx of [-90, 90]) { g.beginPath(); g.moveTo(x + dx, base); g.lineTo(x + dx * 1.1, 640); g.stroke(); }
      const sag = p.h < 10 ? 18 : 0; g.fillStyle = '#2a2a3a'; g.beginPath(); g.moveTo(x - 100, base); g.quadraticCurveTo(x, base + sag * 2, x + 100, base); g.lineTo(x + 100, base + 8); g.quadraticCurveTo(x, base + sag * 2 + 8, x - 100, base + 8); g.fill();
      g.fillStyle = pl.color; g.fillRect(x - 104, base - 6, 18, 12); g.fillRect(x + 86, base - 6, 18, 12);
      const y = base - 40 - p.h * 0.42 + sag;
      g.save(); g.translate(x, y); g.rotate(p.rot); Char.draw(g, 0, 0, 30, pl.el.id, pl.color, { mood: p.crash > 0 ? 'dizzy' : p.h > 300 ? 'starry' : 'cheer', seed: i, noIdle: true }); g.restore();
      if (p.msgT > 0) MGH.text(g, p.msg, x, Math.min(y - 70, 560), 22, p.msg === 'CRASH!' ? '#ff6a6a' : '#ffe680', 'center', 'bold');
      MGH.text(g, `${pl.name} ${p.pts}`, x, 690, 18, pl.color, 'center', 'bold');
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(x + 120, 120, 8, 460); g.fillStyle = pl.color; g.fillRect(x + 118, 580 - Math.min(460, p.h * 0.42), 12, 4);
    });
  },
});

// ======================================================================== CHICKEN CROSSING
MG.def({
  id: 'crossing', name: 'Chicken Crossing', type: 'Race', controls: 'Move', dur: 50,
  rows: [['pad', 'Hop (one step per push)']],
  how: 'Hop your way across! Each push of the stick is one hop. Dodge the carts on the road, then cross the river by hopping onto the drifting logs — the water is too cold to swim! Reach the flowers at the top to score a crossing, then start again from the bottom. Get hit or fall in and you go back to the start.',
  wins: 'Most crossings.',
  ROWS: 12, CS: 52,
  init(m, S) {
    const lanes = []; for (let r = 0; r < this.ROWS; r++) { const kind = r === 0 || r === 6 || r === 11 ? 'grass' : r < 6 ? 'road' : 'river', dir = r % 2 ? 1 : -1, sp = (kind === 'road' ? R.range(110, 210) : R.range(60, 110)) * dir; const objs = []; const n = kind === 'road' ? R.int(2, 3) : 3; for (let k = 0; k < n; k++) objs.push({ x: k * (1280 / n) + R.range(0, 120), w: kind === 'road' ? R.range(70, 110) : R.range(140, 220) }); lanes.push({ kind, sp, objs }); }
    S.lanes = lanes; S.p = [0, 1, 2, 3].map(i => ({ c: 4 + i * 4, r: 0, x: (4 + i * 4) * 52 + 26, pts: 0, dead: 0, hop: 0 }));
  },
  rowY(r) { return 660 - r * this.CS; },
  update(m, S, dt) {
    S.lanes.forEach(L => { if (L.kind === 'grass') return; L.objs.forEach(o => { o.x += L.sp * dt; if (L.sp > 0 && o.x > 1290) o.x = -o.w - 10; if (L.sp < 0 && o.x + o.w < -10) o.x = 1290; }); });
    S.p.forEach((p, i) => {
      p.hop -= dt; if (p.dead > 0) { p.dead -= dt; if (p.dead <= 0) { p.r = 0; p.x = (4 + i * 4) * 52 + 26; } return; }
      const L = S.lanes[p.r];
      if (m.pressed(i, 'up') && p.r < this.ROWS - 1) { p.r++; p.hop = 0.12; if (!m.bot(i)) Sfx.tone(600, 0.03, 'triangle', 0.04); }
      else if (m.pressed(i, 'down') && p.r > 0) { p.r--; p.hop = 0.12; }
      else if (m.pressed(i, 'left')) { p.x -= this.CS; p.hop = 0.12; } else if (m.pressed(i, 'right')) { p.x += this.CS; p.hop = 0.12; }
      const L2 = S.lanes[p.r];
      if (L2.kind === 'river') { const on = L2.objs.find(o => p.x > o.x && p.x < o.x + o.w); if (on) p.x += L2.sp * dt; else { p.dead = 1; MGH.burst(p.x, this.rowY(p.r), ['#8fd8ff', '#fff'], 14, { speed: 150 }); if (!m.bot(i)) Sfx.tone(300, 0.2, 'sine', 0.05, -150); } }
      if (L2.kind === 'road' && L2.objs.some(o => p.x > o.x - 14 && p.x < o.x + o.w + 14)) { p.dead = 1; MGH.burst(p.x, this.rowY(p.r), ['#fff', m.players[i].color], 14, { speed: 200 }); if (!m.bot(i)) Sfx.thud(); }
      if (p.x < 10 || p.x > 1270) { p.dead = 1; }
      if (p.r === this.ROWS - 1 && p.dead <= 0) { p.pts++; MGH.pop('+1', p.x, this.rowY(p.r) - 30, '#ffe680', 30); Sfx.coin(); p.r = 0; p.x = (4 + i * 4) * 52 + 26; }
    });
  },
  bot(m, S, i) {
    const p = S.p[i], v = m.vin[i]; v.up = v.down = v.left = v.right = false;
    if (p.dead > 0 || p.hop > 0) return;
    p.think = (p.think || 0) - 1 / 60; if (p.think > 0) return; p.think = R.range(0.12, 0.3);
    const safe = (r, x, look) => { const L = S.lanes[r]; if (!L) return false; if (L.kind === 'grass') return true; if (L.kind === 'road') return !L.objs.some(o => { for (const tt of [0, look * 0.5, look]) { const ox = o.x + L.sp * tt; if (x > ox - 36 && x < ox + o.w + 36) return true; } return false; }); return L.objs.some(o => { for (const tt of [0, 0.15]) { const ox = o.x + L.sp * tt; if (!(x > ox + 20 && x < ox + o.w - 20)) return false; } return true; }); };
    if (safe(p.r + 1, p.x, 0.45)) { v.up = true; return; }
    if (!safe(p.r, p.x, 0.45)) { if (safe(p.r, p.x - 52, 0.3)) v.left = true; else if (safe(p.r, p.x + 52, 0.3)) v.right = true; else if (safe(p.r - 1, p.x, 0.3)) v.down = true; }
  },
  score(m, S) { return S.p.map(p => p.pts); },
  fmt(s) { return `${s} crossing${s === 1 ? '' : 's'}`; },
  hud(m, S, i) { return `${S.p[i].pts} 🐔`; },
  draw(m, S, g) {
    S.lanes.forEach((L, r) => {
      const y = this.rowY(r) - this.CS / 2;
      g.fillStyle = L.kind === 'grass' ? (r === 11 ? '#8ad86a' : '#6ac84a') : L.kind === 'road' ? '#4a4a54' : '#3a98d8'; g.fillRect(0, y, 1280, this.CS);
      if (L.kind === 'road') { g.strokeStyle = 'rgba(255,255,255,0.5)'; g.setLineDash([24, 20]); g.lineWidth = 3; g.beginPath(); g.moveTo(0, y + this.CS); g.lineTo(1280, y + this.CS); g.stroke(); g.setLineDash([]); }
      if (L.kind === 'river') for (let k = 0; k < 10; k++) { g.strokeStyle = 'rgba(255,255,255,0.3)'; g.lineWidth = 2; g.beginPath(); g.arc((k * 140 + m.t * L.sp * 0.5 + 2000) % 1300, y + 26, 8, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }
      if (r === 11) for (let k = 0; k < 20; k++) MGH.text(g, ['🌼', '🌷', '🌸'][k % 3], 30 + k * 64, y + 36, 20, '#fff');
      L.objs.forEach(o => {
        if (L.kind === 'road') { const dir = Math.sign(L.sp); g.fillStyle = ['#e8323e', '#ffcc33', '#4a8ae8', '#7cd04a'][(r + Math.floor(o.w)) % 4]; MGH.rr(g, o.x, y + 8, o.w, this.CS - 16, 10); g.fill(); g.fillStyle = 'rgba(200,230,255,0.8)'; g.fillRect(o.x + (dir > 0 ? o.w - 26 : 8), y + 13, 18, this.CS - 26); g.fillStyle = '#222'; for (const wx of [o.x + 14, o.x + o.w - 14]) { g.beginPath(); g.arc(wx, y + this.CS - 8, 7, 0, 7); g.fill(); } }
        else if (L.kind === 'river') { g.fillStyle = '#8a5a32'; MGH.rr(g, o.x, y + 8, o.w, this.CS - 16, 14); g.fill(); g.strokeStyle = '#5a3a20'; g.lineWidth = 2; for (let q = 20; q < o.w; q += 30) { g.beginPath(); g.moveTo(o.x + q, y + 12); g.lineTo(o.x + q + 10, y + this.CS - 12); g.stroke(); } }
      });
    });
    S.p.forEach((p, i) => { if (p.dead > 0 && S.lanes[p.r] && S.lanes[p.r].kind === 'river') return; const y = this.rowY(p.r) - (p.hop > 0 ? 10 : 0); Char.draw(g, p.x, y - 6, 18, m.players[i].el.id, m.players[i].color, { mood: p.dead > 0 ? 'dizzy' : 'determined', seed: i, alpha: p.dead > 0 ? 0.5 : 1, look: { x: 0, y: -1 } }); });
  },
});

// ======================================================================== LASER LIMBO
MG.def({
  id: 'limbo', name: 'Laser Limbo', type: 'Reaction', controls: 'Jump + duck', dur: 0,
  rows: [['a', 'Jump over LOW beams'], ['pad', 'Hold DOWN to duck HIGH beams']],
  how: 'Laser beams sweep across the stage! JUMP (A) over the low red beams and DUCK (hold DOWN) under the high blue ones. Some come in pairs. Each zap costs a heart — three hearts and you are out. The beams keep getting faster.',
  wins: 'Last one standing (or the most hearts left).',
  init(m, S) { S.p = [0, 1, 2, 3].map(() => ({ y: 0, vy: 0, duck: false, hearts: 3, hit: 0, outT: 0 })); S.beams = []; S.next = 1.5; S.n = 0; },
  update(m, S, dt) {
    S.next -= dt;
    if (S.next <= 0 && S.pendDir === undefined) S.pendDir = Math.random() < 0.5 ? 1 : -1;
    if (S.next <= 0 && S.beams.some(b => b.dir !== S.pendDir && b.x > 0 && b.x < 1280)) S.next = 0.15; // never fire into a beam still crossing the other way
    if (S.next <= 0) { S.n++; const sp = 300 + S.n * 14, low = Math.random() < 0.5, dir = S.pendDir; S.pendDir = undefined; S.beams.push({ x: dir > 0 ? -60 : 1340, dir, sp, low, hit: [], t0: m.t }); if (S.n > 8 && Math.random() < 0.35) S.beams.push({ x: dir > 0 ? -60 - 170 : 1340 + 170, dir, sp, low: !low, hit: [], t0: m.t + 0.01 }); S.next = Math.max(0.85, 2.2 - S.n * 0.05); Sfx.tone(low ? 300 : 900, 0.12, 'sawtooth', 0.03); }
    S.beams.forEach(b => { b.x += b.dir * b.sp * dt; });
    S.beams = S.beams.filter(b => b.x > -400 && b.x < 1700);
    S.p.forEach((p, i) => {
      p.hit -= dt; if (p.hearts <= 0) return;
      p.duck = m.held(i, 'down') && p.y <= 0;
      if (m.pressed(i, 'a') && p.y <= 0) { p.vy = 640; if (!m.bot(i)) Sfx.tone(500, 0.05, 'triangle', 0.05, 300); }
      p.vy -= 2500 * dt; p.y = Math.max(0, p.y + p.vy * dt); if (p.y <= 0) p.vy = 0;
      const x = 200 + i * 290;
      S.beams.forEach(b => { if (b.hit.includes(i) || Math.abs(b.x - x) > 14) return; const hitIt = b.low ? p.y < 40 : !p.duck; if (hitIt) { b.hit.push(i); p.hearts--; p.hit = 0.7; Sfx.bad(); MGH.burst(x, b.low ? 600 : 470, [b.low ? '#ff4a3a' : '#4a8aff', '#fff'], 14, { speed: 200 }); if (p.hearts <= 0) p.outT = b.t0 || m.t; } else b.hit.push(i); }); // knocked out by the same beam = the same time
    });
    if ((S.p.filter(p => p.hearts > 0).length <= 1 && !S.beams.some(b => b.x > -20 && b.x < 1300)) || S.n > 46) m.finish(this.score(m, S));
  },
  bot(m, S, i) {
    const p = S.p[i], v = m.vin[i], x = 200 + i * 290; v.a = false; v.down = false; if (p.hearts <= 0) return;
    const b = S.beams.find(b => !b.hit.includes(i) && (b.x - x) * b.dir < 0 && Math.abs(b.x - x) < b.sp * 0.42);
    if (!b) return; p.err = p.err === undefined ? Math.random() < 0.1 : p.err;
    const want = p.err ? !b.low : b.low;
    if (want) { if (Math.abs(b.x - x) < b.sp * 0.2) v.a = true; } else v.down = true;
    if (Math.abs(b.x - x) < 10) p.err = undefined;
  },
  score(m, S) { return S.p.map(p => p.hearts > 0 ? 1000 + p.hearts : p.outT); },
  fmt(s) { return s >= 1000 ? `${Math.round(s - 1000)}♥ left` : `out at ${s.toFixed(0)}s`; },
  hud(m, S, i) { return S.p[i].hearts > 0 ? '♥'.repeat(S.p[i].hearts) : 'out'; },
  draw(m, S, g) {
    g.fillStyle = MGH.grad(g, 0, 720, ['#120a2a', '#2a1050', '#0a0418']); g.fillRect(0, 0, 1280, 720);
    for (let k = 0; k < 16; k++) { const a = m.t * 0.4 + k; g.fillStyle = `rgba(${k % 2 ? '255,60,120' : '60,140,255'},0.06)`; g.beginPath(); g.moveTo(640, -20); g.lineTo(640 + Math.cos(a) * 1400, 720); g.lineTo(640 + Math.cos(a + 0.08) * 1400, 720); g.fill(); }
    g.fillStyle = '#2a2440'; g.fillRect(0, 630, 1280, 90); for (let k = 0; k < 16; k++) { g.fillStyle = k % 2 ? '#3a3460' : '#4a4080'; g.fillRect(k * 80, 630, 80, 12); }
    Char.npc(g, 640, 120, 30, 'host', { mood: 'cheer', t: m.t });
    S.beams.forEach(b => { const y = b.low ? 600 : 470, col = b.low ? '#ff3a3a' : '#3a8aff'; g.save(); g.shadowColor = col; g.shadowBlur = 20; g.strokeStyle = col; g.lineWidth = 8; g.beginPath(); g.moveTo(b.x, y - 60); g.lineTo(b.x, y + 20); g.stroke(); g.strokeStyle = '#fff'; g.lineWidth = 3; g.stroke(); g.restore(); g.fillStyle = '#5a5a6a'; g.fillRect(b.x - 10, y - 70, 20, 12); g.fillRect(b.x - 10, y + 18, 20, 12); });
    S.p.forEach((p, i) => {
      const x = 200 + i * 290, pl = m.players[i], out = p.hearts <= 0;
      if (p.duck) { Char.draw(g, x, 600 - p.y, 26, pl.el.id, pl.color, { mood: 'scared', seed: i, noFeet: false, alpha: out ? 0.4 : 1 }); }
      else Char.draw(g, x, 560 - p.y, 32, pl.el.id, pl.color, { mood: out ? 'out' : p.hit > 0 ? 'hurt' : p.y > 0 ? 'cheer' : 'determined', seed: i, alpha: out ? 0.4 : 1 });
      for (let h = 0; h < 3; h++) MGH.heart(g, x - 24 + h * 24, 670, 1.2, h < p.hearts ? '#ff4d6d' : 'rgba(255,255,255,0.2)');
      MGH.text(g, pl.name, x, 708, 16, pl.color, 'center', 'bold');
    });
  },
});
