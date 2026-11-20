'use strict';
// 63 ---------------------------------------------------------------- Titan Trials (arena gladiator events)
(() => {
  const TITAN = ['#c0563a', '#3a6ac0', '#8a4ab0', '#c08a2a'];
  const titan = (g, x, y, r, k, mood, o = {}) => Char.draw(g, x, y, r, -1, TITAN[k % 4], Object.assign({ hat: 'helmet', mood, seed: k + 9 }, o));
  const say = (T, i, text, col = '#ffe680') => { T.msg = T.msg || []; T.msg[i] = { text, col, t: 0 }; };
  const tickMsgs = (T, dt) => (T.msg || []).forEach(q => { if (q) q.t += dt; });
  const msgAt = (g, T, i, x, y) => { const q = (T.msg || [])[i]; if (!q || q.t > 1.1) return; g.globalAlpha = 1 - q.t / 1.1; MGH.text(g, q.text, x, y - q.t * 16, 24, q.col, 'center', 'bold'); g.globalAlpha = 1; };
  const arenaBack = (g, t) => {
    g.fillStyle = MGH.grad(g, 40, 720, ['#140a2a', '#2a1648', '#1a0e30']); g.fillRect(0, 40, 1280, 680);
    MGH.crowd(g, t, 150, 40, ['#4a2a6a', '#2a3a6a', '#6a2a4a', '#2a5a5a']);
    for (let k = 0; k < 5; k++) { const x = 128 + k * 256; g.save(); g.globalAlpha = 0.12 + 0.05 * Math.sin(t * 2 + k); const gr = g.createLinearGradient(x, 40, x, 700); gr.addColorStop(0, '#fff6c8'); gr.addColorStop(1, 'rgba(255,246,200,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(x - 20, 40); g.lineTo(x + 20, 40); g.lineTo(x + 140, 700); g.lineTo(x - 140, 700); g.fill(); g.restore(); }
  };
  const colLane = (g, i, m) => { if (i) { g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(i * 320 - 1, 40, 2, 680); } g.fillStyle = m.players[i].color; g.fillRect(i * 320 + 120, 704, 80, 8); };
  const stick = (g, x, y, ang, col) => { g.save(); g.translate(x, y); g.rotate(ang); g.strokeStyle = '#6a4a2a'; g.lineWidth = 6; g.beginPath(); g.moveTo(-40, 0); g.lineTo(40, 0); g.stroke(); g.fillStyle = col; for (const e of [-1, 1]) { g.beginPath(); MGH.rr(g, e * 40 - 14, -11, 28, 22, 9); g.fill(); } g.restore(); };

  // ---- 1) pedestal duel
  const duel = {
    name: 'Pedestal Duel', icon: '🥊', how: 'Your Titan winds up HIGH or LOW. Hold UP to guard high or DOWN to guard low. Block it and the Titan is open — press A to strike! Four strikes topple the Titan. Three hits and you fall.',
    init(m, S, T) { T.p = [0, 1, 2, 3].map(() => ({ bal: 3, tb: 4, st: 'idle', tt: R.range(0.6, 1.2), side: 'high', done: false, won: false, fell: false, time: 0, cool: 0, wob: 0, hitT: 0, react: R.range(0.18, 0.34) })); },
    update(m, S, T, dt, t) {
      tickMsgs(T, dt);
      T.p.forEach((P, i) => {
        if (P.done) return;
        P.cool -= dt; P.wob = Math.max(0, P.wob - dt); P.hitT = Math.max(0, P.hitT - dt);
        const ay = m.axis(i).y, guard = ay < -0.5 ? 'high' : ay > 0.5 ? 'low' : null;
        P.tt -= dt;
        if (P.st === 'idle' && P.tt <= 0) { P.st = 'wind'; P.side = R.pick(['high', 'low']); P.tt = Math.max(0.42, 0.66 - (4 - P.tb) * 0.06); }
        else if (P.st === 'wind' && P.tt <= 0) {
          if (guard === P.side) { P.st = 'rec'; P.tt = 0.75; say(T, i, 'BLOCK!', '#9fe0ff'); Sfx.tone(300, 0.08, 'square', 0.05); }
          else { P.bal--; P.hitT = 0.4; P.st = 'idle'; P.tt = R.range(0.5, 1.0); say(T, i, 'OOF!', '#ff6b6b'); Sfx.punch(); if (P.bal <= 0) { P.done = true; P.fell = true; P.time = t; Sfx.crowd('aww'); } }
        }
        else if (P.st === 'rec' && P.tt <= 0) { P.st = 'idle'; P.tt = R.range(0.5, 1.0); }
        if (m.pressed(i, 'a') && P.cool <= 0) {
          P.cool = 0.35;
          if (P.st === 'rec') { P.tb--; P.wob = 0.5; P.st = 'idle'; P.tt = R.range(0.6, 1.0); say(T, i, 'STRIKE!', '#7cf06a'); Sfx.punch(); if (P.tb <= 0) { P.done = true; P.won = true; P.time = t; Sfx.crowd('cheer'); MGH.burst(i * 320 + 230, 470, ['#ffe680', '#fff'], 24, { speed: 260 }); } }
          else say(T, i, 'blocked', '#cccccc');
        }
      });
    },
    bot(m, S, T, i, dt) {
      const P = T.p[i], v = m.vin[i]; v.a = false; v.ay = 0; if (P.done) return;
      P.think = (P.think || 0) + dt;
      if (P.st === 'wind') { const elapsed = Math.max(0.42, 0.66 - (4 - P.tb) * 0.06) - P.tt; if (elapsed > P.react) { if (P.pick === undefined) P.pick = Math.random() < 0.78 ? P.side : (P.side === 'high' ? 'low' : 'high'); v.ay = P.pick === 'high' ? -1 : 1; } }
      else P.pick = undefined;
      if (P.st === 'rec' && 0.75 - P.tt > P.react * 0.7 && !m.prev[i].a) v.a = true;
    },
    done(m, S, T, t) { return T.p.every(P => P.done) || t > 40; },
    result(m, S, T) { return T.p.map(P => P.won ? 100 + (40 - P.time) : (4 - P.tb) * 10 + P.bal); },
    fmt: v => v >= 100 ? `toppled in ${(140 - v).toFixed(1)}s` : `${Math.floor(v / 10)} strikes`,
    draw(m, S, T, g) {
      arenaBack(g, m.t);
      for (let i = 0; i < 4; i++) {
        const P = T.p[i], ox = i * 320;
        colLane(g, i, m);
        // foam pit and pedestals
        for (let k = 0; k < 7; k++) { g.fillStyle = ['#ff6b8a', '#5fb8ff', '#ffd34d', '#7ccf4a'][k % 4]; MGH.rr(g, ox + 10 + k * 44, 600 + (k % 2) * 8, 40, 40, 8); g.fill(); }
        for (const px of [ox + 90, ox + 230]) { g.fillStyle = MGH.grad(g, 470, 600, ['#d8dee8', '#8a94a8']); g.fillRect(px - 26, 480, 52, 130); g.fillStyle = '#e8eef4'; g.beginPath(); g.ellipse(px, 480, 34, 10, 0, 0, 7); g.fill(); }
        const p = m.players[i];
        const pFall = P.fell ? Math.min(1, (S.stageT - P.time) * 2) : 0, tFall = P.won ? Math.min(1, (S.stageT - P.time) * 2) : 0;
        // player
        g.save(); g.translate(ox + 90 - pFall * 30, 438 + pFall * 160 - (P.hitT > 0 ? 0 : 0)); g.rotate(-pFall * 1.4 + (P.hitT > 0 ? -0.2 : 0));
        const guard = m.axis(i).y < -0.5 ? 'high' : m.axis(i).y > 0.5 ? 'low' : null;
        Char.draw(g, 0, 0, 30, p.el.id, p.color, { mood: P.won ? 'cheer' : P.fell ? 'hurt' : P.hitT > 0 ? 'hurt' : 'determined', seed: i, look: { x: 1, y: 0 }, noShadow: true, hands: { n: { x: -1.0, y: guard === 'high' ? -1.1 : guard === 'low' ? 0.4 : -0.3, d: 180, o: false, m: false }, f: { x: 0.6, y: guard === 'high' ? -1.0 : guard === 'low' ? 0.5 : -0.2, d: 170, o: false, m: false } } });
        stick(g, 32, guard === 'high' ? -44 : guard === 'low' ? 14 : -10, guard === 'high' ? -1.3 : guard === 'low' ? -1.2 : 0.3, p.color);
        g.restore();
        // titan
        const wind = P.st === 'wind', hi = P.side === 'high';
        g.save(); g.translate(ox + 230 + tFall * 30 + (P.wob > 0 ? Math.sin(P.wob * 40) * 5 : 0), 430 + tFall * 170); g.rotate(tFall * 1.4);
        titan(g, 0, 0, 38, i, P.won ? 'dizzy' : P.st === 'rec' ? 'nervous' : wind ? 'angry' : 'determined', { look: { x: -1, y: 0 }, noShadow: true });
        stick(g, -38, wind ? (hi ? -60 : 20) : -14, wind ? (hi ? 0.9 : -0.6) : -0.2, TITAN[i]);
        g.restore();
        if (wind && !P.done) { MGH.label(g, hi ? '⬆ HIGH' : '⬇ LOW', ox + 230, 360, 20, hi ? '#ff9a6b' : '#9fe0ff'); }
        if (P.st === 'rec' && !P.done) MGH.label(g, 'STRIKE NOW! (A)', ox + 160, 360, 18, '#7cf06a');
        // balance pips
        for (let k = 0; k < 3; k++) { g.fillStyle = k < P.bal ? p.color : 'rgba(255,255,255,0.15)'; g.beginPath(); g.arc(ox + 60 + k * 22, 250, 8, 0, 7); g.fill(); }
        for (let k = 0; k < 4; k++) { g.fillStyle = k < P.tb ? TITAN[i] : 'rgba(255,255,255,0.15)'; g.beginPath(); g.arc(ox + 200 + k * 22, 250, 8, 0, 7); g.fill(); }
        MGH.text(g, 'you', ox + 82, 232, 13, '#fff'); MGH.text(g, 'TITAN', ox + 233, 232, 13, '#fff');
        msgAt(g, T, i, ox + 160, 320);
      }
    },
  };

  // ---- 2) the climb
  const ROWS = 36;
  const climb = {
    name: 'The Climb', icon: '🧗', how: 'Press A and B ALTERNATELY to climb hand over hand. LEFT/RIGHT moves across the wall. Cracked holds crumble — keep moving! A Titan climbs after you: if it catches you, it pulls you down.',
    init(m, S, T) {
      T.crack = new Set(); for (let r = 4; r < ROWS - 1; r++) for (let c = 0; c < 3; c++) if (Math.random() < 0.16) T.crack.add(r * 3 + c);
      T.p = [0, 1, 2, 3].map(() => ({ row: 0, col: 1, lastKey: null, slip: 0, fin: 0, stand: 0, tr: -5, tc: 1, tpause: 0, stun: 0, shift: 0, falls: 0, rate: R.range(4.6, 6.2), bt: 0 }));
    },
    update(m, S, T, dt, t) {
      tickMsgs(T, dt);
      T.p.forEach((P, i) => {
        if (P.fin) return;
        P.stun -= dt; P.shift -= dt; P.tpause -= dt;
        if (P.stun <= 0) {
          const ax = m.axis(i).x;
          if (P.shift <= 0 && Math.abs(ax) > 0.5) { const nc = clamp(P.col + Math.sign(ax), 0, 2); if (nc !== P.col) { P.col = nc; P.shift = 0.18; P.stand = 0; } }
          const a = m.pressed(i, 'a'), b = m.pressed(i, 'b');
          if (a || b) { const k = a ? 'a' : 'b'; if (P.lastKey !== k) { P.row++; P.stand = 0; Sfx.tone(500 + P.row * 8, 0.03, 'triangle', 0.03); } P.lastKey = k; }
        }
        P.stand += dt;
        if (T.crack.has(P.row * 3 + P.col) && P.stand > 0.6) { T.crack.delete(P.row * 3 + P.col); P.row = Math.max(0, P.row - 3); P.stun = 0.5; P.falls++; say(T, i, 'CRUMBLE!', '#ff9a6b'); Sfx.thud(); }
        // the titan gives chase after three seconds
        if (t > 3 && P.tpause <= 0) {
          const sp = 2.0 + Math.min(1.6, t * 0.05);
          P.tr += sp * dt; if (P.tc !== P.col && Math.random() < dt * 1.6) P.tc += Math.sign(P.col - P.tc);
          if (P.tr >= P.row - 0.3 && P.tc === P.col && P.stun <= 0) { P.row = Math.max(0, P.row - 4); P.stun = 0.7; P.tpause = 1.2; P.tr = P.row - 3; P.falls++; say(T, i, 'GRABBED!', '#ff6b6b'); Sfx.punch(); }
          if (P.tr > P.row + 2) P.tr = P.row - 2;
        }
        if (P.row >= ROWS) { P.fin = t; say(T, i, `${t.toFixed(1)}s`, '#fff'); Sfx.coin(); MGH.burst(i * 320 + 160, 120, ['#ffe680', '#fff'], 20, { speed: 200 }); }
      });
    },
    bot(m, S, T, i, dt) {
      const P = T.p[i], v = m.vin[i]; v.a = v.b = false; v.ax = 0; if (P.fin || P.stun > 0) return;
      // dodge the titan or a cracked hold ahead
      const danger = (P.tc === P.col && P.tr > P.row - 1.6) || T.crack.has((P.row + 1) * 3 + P.col);
      if (danger && P.shift <= 0) { const opts = [P.col - 1, P.col + 1].filter(c => c >= 0 && c <= 2 && !T.crack.has((P.row + 1) * 3 + c)); if (opts.length) v.ax = Math.sign(R.pick(opts) - P.col); }
      MGM.botStride(m, i, P, P.rate, dt);
    },
    done(m, S, T, t) { return T.p.every(P => P.fin) || t > 45; },
    result(m, S, T) { return T.p.map(P => P.fin ? 100 + (45 - P.fin) : P.row); },
    fmt: v => v >= 100 ? `top in ${(145 - v).toFixed(1)}s` : `${Math.round(v)}/${ROWS} holds`,
    draw(m, S, T, g) {
      g.fillStyle = MGH.grad(g, 40, 720, ['#2a1648', '#140a2a']); g.fillRect(0, 40, 1280, 680);
      for (let i = 0; i < 4; i++) {
        const P = T.p[i], ox = i * 320, camR = clamp(P.row - 3, 0, ROWS - 9), RH = 72, by = 690;
        const Y = r => by - (r - camR) * RH, X = c => ox + 70 + c * 90;
        g.save(); g.beginPath(); g.rect(ox, 40, 320, 680); g.clip();
        g.fillStyle = MGH.grad(g, 40, 720, ['#6a5a7a', '#4a3a5a']); g.fillRect(ox, 40, 320, 680);
        for (let r = Math.floor(camR) - 1; r < camR + 11; r++) for (let c = 0; c < 3; c++) {
          if (r < 0) continue;
          const x = X(c) + ((r * 37 + c * 13) % 11) - 5, y = Y(r), cr = T.crack.has(r * 3 + c);
          g.fillStyle = r >= ROWS ? '#ffd34d' : cr ? '#a07a5a' : ['#ff6b8a', '#5fb8ff', '#ffd34d', '#7ccf4a'][(r + c) % 4];
          g.beginPath(); g.ellipse(x, y, 16, 11, (r + c) * 0.7, 0, 7); g.fill();
          if (cr) { g.strokeStyle = '#3a2a1a'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 8, y - 6); g.lineTo(x, y + 2); g.lineTo(x + 7, y - 5); g.stroke(); }
        }
        if (Y(ROWS) > 40) { g.fillStyle = '#ffd34d'; g.fillRect(ox, Y(ROWS) - 20, 320, 8); MGH.text(g, '🔔 TOP', ox + 160, Y(ROWS) - 30, 18, '#ffe680', 'center', 'bold'); }
        // titan chaser
        if (S.stageT > 3) titan(g, X(P.tc), Y(P.tr) + 10, 30, i, 'angry', { look: { x: 0, y: -1 }, noShadow: true, hands: { n: { x: -0.9, y: -1.5, d: -95, o: true, m: true }, f: { x: 0.9, y: -1.3, d: -85, o: true, m: false } } });
        const p = m.players[i], up = P.lastKey === 'a';
        Char.draw(g, X(P.col), Y(Math.min(P.row, ROWS)) + 8, 28, p.el.id, p.color, { mood: P.fin ? 'cheer' : P.stun > 0 ? 'scared' : 'effort', seed: i, look: { x: 0.3, y: -1 }, noShadow: true, hands: { n: { x: -0.85, y: up ? -1.6 : -0.9, d: -95, o: true, m: true }, f: { x: 0.85, y: up ? -0.9 : -1.6, d: -85, o: true, m: false } }, feet: [{ x: -0.3, lift: up ? 0.3 : 0, tip: 0.3 }, { x: 0.3, lift: up ? 0 : 0.3, tip: 0.3 }] });
        g.restore();
        colLane(g, i, m);
        g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(ox + 300, 60, 10, 620); g.fillStyle = p.color; g.fillRect(ox + 300, 680 - 620 * Math.min(1, P.row / ROWS), 10, 620 * Math.min(1, P.row / ROWS));
        msgAt(g, T, i, ox + 160, 300);
      }
    },
  };

  // ---- 3) hoop rush
  const HOOPS = [{ x: 70, y: 380, v: 2 }, { x: 1210, y: 380, v: 2 }, { x: 250, y: 100, v: 1 }, { x: 1030, y: 100, v: 1 }, { x: 250, y: 660, v: 1 }, { x: 1030, y: 660, v: 1 }];
  const hoops = {
    name: 'Hoop Rush', icon: '🏀', how: 'Run to the centre to grab a ball, carry it to a hoop and press A to DUNK. Side hoops score 2, corner hoops 1. Titans hunt ball carriers — get tackled and you drop it! B is a quick dodge dash.',
    init(m, S, T) {
      T.b = [0, 1, 2, 3].map(i => Object.assign(MGH.body(540 + (i % 2) * 200, 300 + Math.floor(i / 2) * 160, 22), { carry: false, pts: 0, stun: 0, dash: 0, dcd: 0 }));
      T.t = [0, 1].map(k => Object.assign(MGH.body(k ? 1000 : 280, 380, 34), { pause: 0, k }));
    },
    update(m, S, T, dt, t) {
      tickMsgs(T, dt);
      T.b.forEach((b, i) => {
        b.stun -= dt; b.dash -= dt; b.dcd -= dt;
        const a = m.axis(i);
        if (b.stun > 0) { b.vx *= 0.9; b.vy *= 0.9; }
        else MGH.steer(b, a.x, a.y, dt, b.dash > 0 ? 5200 : 2000, b.dash > 0 ? 640 : (b.carry ? 300 : 330), 6);
        if (m.pressed(i, 'b') && b.dcd <= 0 && b.stun <= 0) { b.dash = 0.22; b.dcd = 1.5; Sfx.whoosh(false); }
        MGH.integrate(b, dt, 20, 60, 1260, 710);
        b.grace = (b.grace || 0) - dt;
        if (!b.carry && b.stun <= 0 && Math.hypot(b.x - 640, b.y - 380) < 70) { b.carry = true; b.grace = 0.8; Sfx.pop(); }
        if (b.carry && m.pressed(i, 'a')) { const h = HOOPS.find(h => Math.hypot(h.x - b.x, h.y - b.y) < 80); if (h) { b.carry = false; b.pts += h.v; say(T, i, `DUNK +${h.v}!`, '#7cf06a'); MGH.burst(h.x, h.y, ['#ffe680', m.players[i].color, '#fff'], 18, { speed: 220 }); Sfx.coin(); } }
      });
      MGH.collide(T.b, 0.8);
      T.t.forEach(ti => {
        ti.pause -= dt;
        const carriers = T.b.filter(b => b.carry && b.stun <= 0 && b.grace <= 0 && Math.hypot(b.x - 640, b.y - 380) > 110);
        const pa = t * 0.5 + ti.k * Math.PI; // otherwise patrol a loop between the bin and the hoops
        let goal = carriers.length ? carriers.reduce((a, b) => Math.hypot(b.x - ti.x, b.y - ti.y) < Math.hypot(a.x - ti.x, a.y - ti.y) ? b : a) : { x: 640 + Math.cos(pa) * 380, y: 380 + Math.sin(pa) * 200 };
        const dx = goal.x - ti.x, dy = goal.y - ti.y, l = Math.hypot(dx, dy) || 1;
        if (ti.pause <= 0) MGH.steer(ti, dx / l, dy / l, dt, 1500, 250 + Math.min(60, t * 1.5), 5); else { ti.vx *= 0.9; ti.vy *= 0.9; }
        MGH.integrate(ti, dt, 20, 60, 1260, 710);
        for (const b of T.b) if (b.carry && b.stun <= 0 && b.grace <= 0 && ti.pause <= 0 && Math.hypot(b.x - ti.x, b.y - ti.y) < b.r + ti.r) { b.carry = false; b.stun = 0.9; ti.pause = 0.7; b.vx = (b.x - ti.x) * 8; b.vy = (b.y - ti.y) * 8; say(T, T.b.indexOf(b), 'TACKLED!', '#ff6b6b'); Sfx.punch(); MGH.shake(5); }
      });
    },
    bot(m, S, T, i, dt) {
      const b = T.b[i], v = m.vin[i]; v.a = v.b = false;
      let gx = 640, gy = 380;
      if (b.carry) {
        let best = null, bs = -1e9;
        for (const h of HOOPS) { const d = Math.hypot(h.x - b.x, h.y - b.y), threat = Math.min(...T.t.map(ti => Math.hypot(h.x - ti.x, h.y - ti.y))); const sc = h.v * 300 - d - (threat < 220 ? 400 : 0); if (sc > bs) { bs = sc; best = h; } }
        gx = best.x; gy = best.y;
        if (Math.hypot(gx - b.x, gy - b.y) < 70) v.a = !m.prev[i].a;
        const near = T.t.some(ti => Math.hypot(ti.x - b.x, ti.y - b.y) < 130);
        if (near && b.dcd <= 0) v.b = true;
      }
      MGH.aim(m, i, gx, gy, b, 10);
    },
    done(m, S, T, t) { return t > 45; },
    result(m, S, T) { return T.b.map(b => b.pts); },
    fmt: v => `${Math.round(v)} pts`,
    draw(m, S, T, g) {
      g.fillStyle = MGH.grad(g, 40, 720, ['#e8c890', '#c9a368']); g.fillRect(0, 40, 1280, 680);
      g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 4; g.strokeRect(30, 60, 1220, 640); g.beginPath(); g.arc(640, 380, 90, 0, 7); g.stroke();
      // ball bin
      MGH.glow(g, 640, 380, 110, 'rgba(255,170,60,0.4)'); g.fillStyle = '#6a4a2a'; g.beginPath(); g.arc(640, 380, 60, 0, 7); g.fill();
      for (let k = 0; k < 7; k++) { const a = k * 0.9 + m.t * 0.3; g.fillStyle = '#ff7a2a'; g.beginPath(); g.arc(640 + Math.cos(a) * 30, 380 + Math.sin(a) * 26, 14, 0, 7); g.fill(); g.strokeStyle = '#7a3a10'; g.lineWidth = 2; g.stroke(); }
      for (const h of HOOPS) {
        MGH.shadow(g, h.x, h.y + 26, 40, 0.3);
        g.fillStyle = '#9aa0ad'; g.fillRect(h.x - 4, h.y - 10, 8, 40);
        g.strokeStyle = '#ff4d2a'; g.lineWidth = 6; g.beginPath(); g.ellipse(h.x, h.y - 14, 34, 12, 0, 0, 7); g.stroke();
        g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 2; for (let k = -3; k <= 3; k++) { g.beginPath(); g.moveTo(h.x + k * 9, h.y - 8); g.lineTo(h.x + k * 6, h.y + 18); g.stroke(); }
        MGH.label(g, `+${h.v}`, h.x, h.y - 40, 16, h.v > 1 ? '#ffe680' : '#fff');
      }
      const all = T.b.map((b, i) => ({ y: b.y, f: () => { MGH.shadow(g, b.x, b.y + 30, 22, 0.3); MGH.drawBody(g, b, m.players[i], '', b.stun > 0 ? 'dizzy' : b.carry ? 'determined' : 'happy'); if (b.carry) { g.fillStyle = '#ff7a2a'; g.beginPath(); g.arc(b.x, b.y - 58, 13, 0, 7); g.fill(); g.strokeStyle = '#7a3a10'; g.lineWidth = 2; g.stroke(); } msgAt(g, T, i, b.x, b.y - 80); } }))
        .concat(T.t.map(ti => ({ y: ti.y, f: () => { MGH.shadow(g, ti.x, ti.y + 44, 34, 0.35); titan(g, ti.x, ti.y, 40, ti.k, ti.pause > 0 ? 'smug' : 'angry', { look: { x: ti.vx > 0 ? 1 : -1, y: 0 }, walk: 1 }); } })));
      all.sort((a, b) => a.y - b.y).forEach(o => o.f());
      T.b.forEach((b, i) => MGH.text(g, `${b.pts}`, 70 + i * 60, 700, 22, m.players[i].color, 'center', 'bold'));
      MGH.text(g, `⏱ ${Math.max(0, 45 - (S.phase === 'play' ? S.stageT : 0)).toFixed(0)}`, 1200, 700, 22, '#fff', 'center', 'bold');
    },
  };

  // ---- 4) eliminator obstacle course (leader starts first)
  const SEC = [{ to: 20, k: 'sprint', name: 'Sprint' }, { to: 34, k: 'beam', name: 'Balance beam' }, { to: 48, k: 'net', name: 'Cargo net' }, { to: 66, k: 'zip', name: 'Zipline' }, { to: 82, k: 'tires', name: 'Tire hop' }, { to: 100, k: 'tread', name: 'Treadmill' }];
  const TIRES = [69, 72.5, 76, 79.5];
  const elim = {
    name: 'The Eliminator', icon: '🏁', how: 'The final obstacle course — the points leader starts first! SPRINT (A/B alternately) · BALANCE (LEFT/RIGHT to stay centred) · NET (mash A) · ZIPLINE (hold A, don’t let go) · TIRES (B to hop) · TREADMILL (A/B alternately, fast!). First across the line wins.',
    init(m, S, T) {
      const lead = Math.max(...S.pts);
      T.p = [0, 1, 2, 3].map(i => ({ x: 0, v: 0, delay: (lead - S.pts[i]) * 0.5, bal: 0, bv: 0, fall: 0, hop: 0, fin: 0, lastKey: null, rate: R.range(6.5, 8.2), msgK: '' }));
    },
    sec(P) { return SEC.find(s => P.x < s.to) || SEC[SEC.length - 1]; },
    update(m, S, T, dt, t) {
      tickMsgs(T, dt);
      T.p.forEach((P, i) => {
        if (P.fin || t < P.delay) return;
        if (P.fall > 0) { P.fall -= dt; return; }
        const s = this.sec(P);
        if (s.k !== P.msgK) { P.msgK = s.k; say(T, i, s.name.toUpperCase(), '#9fe0ff'); }
        const st = MGM.stride(m, i, P);
        if (s.k === 'sprint') { if (st) P.v = Math.min(9, P.v + st * 1.1); P.v *= Math.exp(-0.9 * dt); P.x += P.v * dt * 0.9; }
        if (s.k === 'beam') {
          P.bv += (R.range(-1, 1) * 5 + P.bal * 3.2) * dt; P.bv -= m.axis(i).x * 7 * dt; P.bal += P.bv * dt; P.bv *= Math.exp(-1.5 * dt);
          P.x += 2.4 * dt;
          if (Math.abs(P.bal) > 1) { P.fall = 1.0; P.x = 20; P.bal = 0; P.bv = 0; say(T, i, 'SPLASH! back to start', '#ff6b6b'); Sfx.noise(0.4, 800, 0.1, 'lowpass'); }
        }
        if (s.k === 'net') { if (m.pressed(i, 'a')) P.x += 0.62; }
        if (s.k === 'zip') {
          if (m.held(i, 'a')) { P.v = Math.min(11, Math.max(P.v, 3) + 6 * dt); P.x += P.v * dt; }
          else if (P.x > 49) { P.fall = 0.9; P.x = 48; P.v = 0; say(T, i, 'LET GO! back up', '#ff6b6b'); Sfx.thud(); }
          else P.x += 0.5 * dt;
        }
        if (s.k === 'tires') {
          P.v = 4.2; const px = P.x; P.hop -= dt;
          if (m.pressed(i, 'b') && P.hop <= 0) P.hop = 0.5;
          P.x += P.v * dt;
          for (const tx of TIRES) if (px < tx && P.x >= tx && P.hop <= 0) { P.fall = 0.5; P.x = tx - 0.6; say(T, i, 'TRIP!', '#ff9a6b'); Sfx.thud(); }
        }
        if (s.k === 'tread') { if (st) P.v = Math.min(9, P.v + st * 1.0); P.v *= Math.exp(-1.1 * dt); P.x += (P.v - 3.0) * dt; P.x = Math.max(82, P.x); }
        if (P.x >= 100) { P.fin = t; say(T, i, `FINISH ${t.toFixed(1)}s`, '#ffe680'); Sfx.coin(); MGH.burst(1200, MGM.lane(i, 110, 150).mid, ['#ffe680', m.players[i].color, '#fff'], 24, { speed: 240 }); }
      });
    },
    bot(m, S, T, i, dt) {
      const P = T.p[i], v = m.vin[i]; v.a = v.b = false; v.ax = 0; if (P.fin || S.stageT < P.delay || P.fall > 0) return;
      const s = this.sec(P);
      if (s.k === 'sprint' || s.k === 'tread') MGM.botStride(m, i, P, P.rate, dt);
      if (s.k === 'beam') v.ax = clamp((P.bal * 1.6 + P.bv * 0.5) + R.range(-0.25, 0.25), -1, 1);
      if (s.k === 'net') { P.bt = (P.bt || 0) + dt; if (P.bt > 1 / P.rate) { P.bt = 0; v.a = true; } }
      if (s.k === 'zip') v.a = Math.random() > 0.004;
      if (s.k === 'tires') { const nx = TIRES.find(tx => tx > P.x); if (nx !== undefined && nx - P.x < 1.1 + R.range(-0.2, 0.3) && P.hop <= 0) v.b = true; }
    },
    done(m, S, T, t) { return T.p.every(P => P.fin) || t > 70; },
    result(m, S, T) { return T.p.map(P => P.fin ? -P.fin : -(200 - P.x)); },
    fmt: v => v > -100 ? `${(-v).toFixed(1)}s` : 'DNF',
    draw(m, S, T, g) {
      arenaBack(g, m.t);
      const X = x => 60 + x * 11.6;
      for (let i = 0; i < 4; i++) {
        const L = MGM.lane(i, 110, 150), P = T.p[i], p = m.players[i], floor = L.y1 - 18;
        g.fillStyle = i % 2 ? '#22143e' : '#1c1036'; g.fillRect(0, L.y0, 1280, L.h); g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(0, L.y1 - 2, 1280, 2);
        // course pieces
        g.fillStyle = '#5a4a6a'; g.fillRect(X(0), floor, X(20) - X(0), 8);
        g.fillStyle = '#4fa8e8'; g.fillRect(X(20), floor - 4, X(34) - X(20), 22); g.fillStyle = '#c9a368'; g.fillRect(X(20), floor - 30, X(34) - X(20), 6);
        g.strokeStyle = '#d8c090'; g.lineWidth = 2; for (let k = 0; k <= 8; k++) { const x = X(34) + k * (X(48) - X(34)) / 8; g.beginPath(); g.moveTo(x, floor); g.lineTo(x, L.y0 + 20); g.stroke(); } for (let k = 0; k < 6; k++) { const y = L.y0 + 20 + k * (floor - L.y0 - 20) / 5; g.beginPath(); g.moveTo(X(34), y); g.lineTo(X(48), y); g.stroke(); }
        g.strokeStyle = '#cfd6e0'; g.lineWidth = 3; g.beginPath(); g.moveTo(X(48), L.y0 + 16); g.lineTo(X(66), floor - 40); g.stroke();
        g.fillStyle = '#5a4a6a'; g.fillRect(X(66), floor, X(82) - X(66), 8);
        for (const tx of TIRES) { g.fillStyle = '#222'; g.beginPath(); g.ellipse(X(tx), floor - 4, 16, 8, 0, 0, 7); g.fill(); g.fillStyle = '#5a4a6a'; g.beginPath(); g.ellipse(X(tx), floor - 5, 7, 3, 0, 0, 7); g.fill(); }
        g.fillStyle = '#3a3a4a'; g.fillRect(X(82), floor - 6, X(100) - X(82), 14); g.strokeStyle = 'rgba(255,255,255,0.3)'; for (let k = 0; k < 12; k++) { const x = X(82) + ((k * 18 - m.t * 60) % (X(100) - X(82)) + (X(100) - X(82))) % (X(100) - X(82)); g.beginPath(); g.moveTo(x, floor - 6); g.lineTo(x, floor + 8); g.stroke(); }
        for (let k = 0; k < 8; k++) { g.fillStyle = k % 2 ? '#fff' : '#222'; g.fillRect(X(100), L.y0 + 10 + k * 15, 8, 15); }
        g.fillStyle = p.color; MGH.rr(g, 8, L.y0 + 8, 30, 22, 6); g.fill(); MGH.text(g, String(i + 1), 23, L.y0 + 25, 16, '#fff', 'center', 'bold');
        if (P.delay > 0) MGH.text(g, S.phase === 'play' && S.stageT < P.delay ? `starts in ${(P.delay - S.stageT).toFixed(1)}s` : `+${P.delay.toFixed(1)}s`, 110, L.y0 + 24, 13, '#ffe680', 'left');
        // the runner
        const s = this.sec(P), x = X(Math.min(100, P.x));
        let y = floor, mood = 'determined', walk = 0, hands, rot = 0;
        if (s.k === 'beam') { y = floor - 30; rot = P.bal * 0.5; hands = { n: { x: -1.4, y: -0.3 + P.bal * 0.4, d: 180, o: true, m: true }, f: { x: 1.3, y: -0.3 - P.bal * 0.4, d: 0, o: true, m: false } }; mood = Math.abs(P.bal) > 0.6 ? 'scared' : 'nervous'; }
        else if (s.k === 'net') { y = floor - (P.x - 34) / 14 * (floor - L.y0 - 40); hands = { n: { x: -0.9, y: -1.5, d: -95, o: true, m: true }, f: { x: 0.9, y: -1.3, d: -85, o: true, m: false } }; mood = 'effort'; }
        else if (s.k === 'zip') { const k = (P.x - 48) / 18; y = L.y0 + 16 + k * (floor - 40 - L.y0 - 16) + 74; hands = { n: { x: -0.3, y: -2.3, d: -90, o: false, m: false }, f: { x: 0.3, y: -2.3, d: -90, o: false, m: false } }; mood = 'cheer'; }
        else if (s.k === 'tires') { y = floor - (P.hop > 0 ? Math.sin(Math.PI * (1 - P.hop / 0.5)) * 30 : 0); walk = P.hop > 0 ? 0 : 1; }
        else { walk = P.v > 1 ? 1 : 0; mood = s.k === 'tread' ? 'effort' : 'determined'; }
        if (P.fin) { mood = 'cheer'; walk = 0; }
        if (P.fall > 0) { mood = 'hurt'; }
        g.save(); g.translate(x, y - 30 * 1.25); g.rotate(rot);
        Char.draw(g, 0, 0, 28, p.el.id, p.color, { mood: MGH.persona(mood, p.el.id), seed: i, look: { x: 1, y: 0 }, walk, hands, noShadow: true, t: m.t * (walk ? 0.6 + P.v * 0.06 : 1) });
        g.restore();
        if (s.k === 'beam' && !P.fin && P.fall <= 0 && S.phase === 'play' && S.stageT > P.delay) { g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(x - 40, L.y0 + 12, 80, 8); g.fillStyle = Math.abs(P.bal) > 0.7 ? '#ff6b6b' : '#7cf06a'; g.fillRect(x - 3 + P.bal * 37, L.y0 + 9, 6, 14); }
        msgAt(g, T, i, Math.min(1100, x + 60), L.y0 + 40);
      }
    },
  };

  MGM.def({ id: 'gladiators', name: 'Titan Trials', how: 'Arena events against the mighty Titans, one after another. The overall leader even gets a head start in the final Eliminator!', stages: [duel, climb, hoops, elim] });
})();
