'use strict';
// 63 ---------------------------------------------------------------- Titan Trials (arena gladiator events)
(() => {
  const TITAN = ['#c0563a', '#3a6ac0', '#8a4ab0', '#c08a2a'];
  const titan = (g, x, y, r, k, mood, o = {}) => Char.npc(g, x, y, r, 'guard', Object.assign({ hat: 'helmet', mood, seed: k + 9 }, o));
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

  // ---- 2) power spheres: roll a giant ball onto the lit pods while Titan spheres try to bump you off
  const PODS = [{ x: 220, y: 200 }, { x: 640, y: 170 }, { x: 1060, y: 200 }, { x: 340, y: 560 }, { x: 940, y: 560 }, { x: 640, y: 400 }, { x: 160, y: 420 }, { x: 1120, y: 420 }];
  const spheres = {
    name: 'Power Spheres', icon: '🔮', how: 'You are inside a giant rolling sphere — it keeps rolling, so steer early! Roll onto a GLOWING pod and stay on it until the ring fills to score. B is a short burst to shove rivals off. Watch out for the heavy Titan spheres!',
    init(m, S, T) {
      T.b = [0, 1, 2, 3].map(i => Object.assign(MGH.body(440 + (i % 2) * 400, 300 + Math.floor(i / 2) * 180, 38), { pts: 0, cd: 0, burst: 0, roll: 0, stun: 0 }));
      T.t = [0, 1].map(k => Object.assign(MGH.body(k ? 1180 : 100, k ? 640 : 120, 50), { k, roll: 0, pause: 0 }));
      T.pod = PODS.map(() => ({ on: false, fill: 0, who: -1, t: 0 })); T.lit = 0;
      R.shuffle([...PODS.keys()]).slice(0, 3).forEach(k => { T.pod[k].on = true; });
    },
    light(T, not) { const off = T.pod.map((p, k) => k).filter(k => !T.pod[k].on && k !== not); const k = R.pick(off); T.pod[k].on = true; T.pod[k].fill = 0; T.pod[k].t = 0; },
    update(m, S, T, dt, t) {
      tickMsgs(T, dt);
      T.b.forEach((b, i) => {
        b.cd -= dt; b.burst -= dt; b.stun -= dt;
        const a = m.axis(i);
        if (b.stun > 0) MGH.steer(b, 0, 0, dt, 0, 520, 1.6);
        else MGH.steer(b, a.x, a.y, dt, b.burst > 0 ? 2600 : 560, b.burst > 0 ? 560 : 330, 1.3);
        if (m.pressed(i, 'b') && b.cd <= 0 && b.stun <= 0) { b.burst = 0.2; b.cd = 1.8; Sfx.whoosh(false); }
        MGH.integrate(b, dt, 30, 70, 1250, 700); b.roll += Math.hypot(b.vx, b.vy) * dt / b.r;
      });
      T.t.forEach(ti => {
        ti.pause -= dt;
        // titans roll toward whoever is standing on a lit pod (or the nearest sphere)
        const onPod = T.b.filter(b => T.pod.some((p, k) => p.on && Math.hypot(PODS[k].x - b.x, PODS[k].y - b.y) < 60));
        const pool = onPod.length ? onPod : T.b, tg = pool.reduce((a, b) => Math.hypot(b.x - ti.x, b.y - ti.y) < Math.hypot(a.x - ti.x, a.y - ti.y) ? b : a);
        const dx = tg.x - ti.x, dy = tg.y - ti.y, l = Math.hypot(dx, dy) || 1;
        if (ti.pause > 0) MGH.steer(ti, 0, 0, dt, 0, 300, 2); else MGH.steer(ti, dx / l, dy / l, dt, 240 + Math.min(100, t * 2), 190 + Math.min(60, t * 1.4), 1.1);
        MGH.integrate(ti, dt, 30, 70, 1250, 700); ti.roll += Math.hypot(ti.vx, ti.vy) * dt / ti.r;
      });
      // bumps: titans are heavy and send you flying
      for (const ti of T.t) for (const b of T.b) {
        const dx = b.x - ti.x, dy = b.y - ti.y, d = Math.hypot(dx, dy) || 1;
        if (d < b.r + ti.r) { const nx = dx / d, ny = dy / d; b.x = ti.x + nx * (b.r + ti.r); b.y = ti.y + ny * (b.r + ti.r); if (ti.pause <= 0) { b.vx = nx * 620; b.vy = ny * 620; b.stun = 0.5; ti.pause = 1.1; ti.vx *= 0.2; ti.vy *= 0.2; Sfx.punch(); MGH.shakeAmt = Math.max(MGH.shakeAmt, 4); } }
      }
      { const all = T.b; for (let x = 0; x < 4; x++) for (let y = x + 1; y < 4; y++) { const A = all[x], B = all[y], dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy) || 1, mn = A.r + B.r; if (d < mn) { const nx = dx / d, ny = dy / d, o = (mn - d) / 2; A.x -= nx * o; A.y -= ny * o; B.x += nx * o; B.y += ny * o; const rel = (B.vx - A.vx) * nx + (B.vy - A.vy) * ny; if (rel < 0) { const kA = A.burst > 0 ? 0.4 : 1, kB = B.burst > 0 ? 0.4 : 1, j = -rel * 1.1; A.vx -= nx * j * kA; A.vy -= ny * j * kA; B.vx += nx * j * kB; B.vy += ny * j * kB; if (-rel > 220) Sfx.thud(); } } } }
      // pods: stand alone on a lit pod to fill its ring
      T.pod.forEach((p, k) => {
        if (!p.on) return; p.t += dt;
        const on = T.b.map((b, i) => Math.hypot(PODS[k].x - b.x, PODS[k].y - b.y) < 58 ? i : -1).filter(i => i >= 0);
        if (on.length === 1) { if (p.who !== on[0]) { p.who = on[0]; p.fill = Math.max(0, p.fill - 0.4); } p.fill += dt / 0.9; }
        else if (on.length > 1) p.fill = Math.max(0, p.fill - dt * 0.5);
        else p.fill = Math.max(0, p.fill - dt * 0.35);
        if (p.fill >= 1) {
          const i = p.who, b = T.b[i]; b.pts++; p.on = false; p.fill = 0; p.who = -1;
          say(T, i, '+1 POD!', '#7cf06a'); Sfx.coin(); MGH.burst(PODS[k].x, PODS[k].y, ['#ffe680', m.players[i].color, '#fff'], 20, { speed: 240 });
          this.light(T, k);
        }
      });
    },
    bot(m, S, T, i, dt) {
      const b = T.b[i], v = m.vin[i]; v.a = v.b = false;
      let best = null, bs = 1e9;
      T.pod.forEach((p, k) => { if (!p.on) return; const d = Math.hypot(PODS[k].x - b.x, PODS[k].y - b.y), crowd = T.b.filter((o, j) => j !== i && Math.hypot(PODS[k].x - o.x, PODS[k].y - o.y) < 90).length, th = Math.min(...T.t.map(ti => Math.hypot(PODS[k].x - ti.x, PODS[k].y - ti.y))); const sc = d + crowd * 220 - (p.who === i ? p.fill * 300 : 0) + (th < 140 ? 200 : 0); if (sc < bs) { bs = sc; best = PODS[k]; } });
      if (!best) return;
      // steer with momentum: aim at the pod minus a share of the current velocity
      const lead = 0.55, gx = best.x - b.vx * lead, gy = best.y - b.vy * lead;
      MGH.aim(m, i, gx, gy, b, 4);
      if (Math.hypot(best.x - b.x, best.y - b.y) < 30 && Math.hypot(b.vx, b.vy) < 60) { v.ax *= 0.3; v.ay *= 0.3; }
      const rival = T.b.find((o, j) => j !== i && Math.hypot(o.x - b.x, o.y - b.y) < 110 && Math.hypot(best.x - o.x, best.y - o.y) < 70);
      if (rival && b.cd <= 0 && Math.random() < 0.08) { MGH.aim(m, i, rival.x, rival.y, b, 1); v.b = true; }
    },
    done(m, S, T, t) { return t > 45; },
    result(m, S, T) { return T.b.map(b => b.pts); },
    fmt: v => `${Math.round(v)} pods`,
    draw(m, S, T, g) {
      // arena floor: polished tiles under spotlights
      g.fillStyle = MGH.grad(g, 40, 720, ['#2a1a4a', '#3a2460', '#241640']); g.fillRect(0, 40, 1280, 680);
      for (let y = 70; y < 700; y += 70) for (let x = 30; x < 1250; x += 70) { g.fillStyle = Math.floor((x + y) / 70) % 2 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.06)'; g.fillRect(x, y, 70, 70); }
      g.strokeStyle = '#ffcf4a'; g.lineWidth = 6; MGH.rr(g, 30, 70, 1220, 630, 30); g.stroke();
      g.strokeStyle = 'rgba(255,207,74,0.3)'; g.lineWidth = 14; MGH.rr(g, 22, 62, 1236, 646, 36); g.stroke();
      T.pod.forEach((p, k) => {
        const P = PODS[k];
        g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.ellipse(P.x, P.y + 6, 58, 24, 0, 0, 7); g.fill();
        g.fillStyle = p.on ? '#3a3a5a' : '#2a2a3a'; g.beginPath(); g.ellipse(P.x, P.y, 56, 22, 0, 0, 7); g.fill();
        if (p.on) {
          const pul = 0.6 + 0.4 * Math.sin(m.t * 6 + k);
          MGH.glow(g, P.x, P.y, 90, `rgba(120,255,180,${0.25 * pul})`);
          g.fillStyle = `rgba(120,255,180,${0.45 + 0.3 * pul})`; g.beginPath(); g.ellipse(P.x, P.y, 48, 18, 0, 0, 7); g.fill();
          const gr = g.createLinearGradient(P.x, P.y - 160, P.x, P.y); gr.addColorStop(0, 'rgba(120,255,180,0)'); gr.addColorStop(1, `rgba(120,255,180,${0.22 * pul})`); g.fillStyle = gr; g.fillRect(P.x - 40, P.y - 160, 80, 160);
          if (p.fill > 0) { g.strokeStyle = p.who >= 0 ? m.players[p.who].color : '#fff'; g.lineWidth = 7; g.beginPath(); g.ellipse(P.x, P.y, 60, 26, 0, -Math.PI / 2, -Math.PI / 2 + p.fill * Math.PI * 2); g.stroke(); }
        } else { g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = 2; g.beginPath(); g.ellipse(P.x, P.y, 48, 18, 0, 0, 7); g.stroke(); }
      });
      const ball = (b, col, inner) => {
        MGH.shadow(g, b.x, b.y + b.r * 0.95, b.r * 0.9, 0.35);
        inner();
        // the cage: rotating meridians over a glassy shell
        g.save(); g.beginPath(); g.arc(b.x, b.y, b.r, 0, 7); g.clip();
        g.fillStyle = 'rgba(200,230,255,0.13)'; g.fillRect(b.x - b.r, b.y - b.r, b.r * 2, b.r * 2);
        g.strokeStyle = col; g.lineWidth = 3; g.globalAlpha = 0.85;
        const dir = Math.atan2(b.vy || 0, b.vx || 1);
        for (let k = 0; k < 4; k++) { const ph = ((b.roll * 0.6 + k / 4) % 1) * Math.PI; const w = Math.cos(ph) * b.r; g.save(); g.translate(b.x, b.y); g.rotate(dir + Math.PI / 2); g.beginPath(); g.ellipse(0, 0, Math.abs(w), b.r, 0, 0, 7); g.stroke(); g.restore(); }
        g.beginPath(); g.ellipse(b.x, b.y, b.r, b.r * 0.3, dir, 0, 7); g.stroke(); g.globalAlpha = 1; g.restore();
        g.strokeStyle = col; g.lineWidth = 4; g.beginPath(); g.arc(b.x, b.y, b.r, 0, 7); g.stroke();
        g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.ellipse(b.x - b.r * 0.4, b.y - b.r * 0.5, b.r * 0.22, b.r * 0.12, -0.6, 0, 7); g.fill();
      };
      const all = T.b.map((b, i) => ({ y: b.y, f: () => { ball(b, m.players[i].color, () => { const p = m.players[i]; Char.draw(g, b.x, b.y - 2, b.r * 0.6, p.el.id, p.color, { mood: MGH.persona(b.stun > 0 ? 'dizzy' : b.burst > 0 ? 'determined' : 'happy', p.el.id), look: { x: b.vx / 300, y: b.vy / 300 }, walk: Math.hypot(b.vx, b.vy) > 40 ? 1 : 0, seed: i * 1.7, noShadow: true, t: m.t * 1.6 }); }); if (b.cd > 0) { g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 3; g.beginPath(); g.arc(b.x, b.y, b.r + 6, -Math.PI / 2, -Math.PI / 2 + (1 - b.cd / 1.8) * Math.PI * 2); g.stroke(); } msgAt(g, T, i, b.x, b.y - 60); } }))
        .concat(T.t.map(ti => ({ y: ti.y, f: () => ball(ti, '#c0c8d8', () => { titan(g, ti.x, ti.y - 2, ti.r * 0.62, ti.k, ti.pause > 0 ? 'smug' : 'angry', { look: { x: ti.vx / 300, y: ti.vy / 300 }, walk: 1, noShadow: true }); }) })));
      all.sort((a, b) => a.y - b.y).forEach(o => o.f());
      T.b.forEach((b, i) => { g.fillStyle = 'rgba(0,0,0,0.5)'; MGH.rr(g, 40 + i * 90, 668, 80, 28, 10); g.fill(); g.fillStyle = m.players[i].color; g.beginPath(); g.arc(58 + i * 90, 682, 9, 0, 7); g.fill(); MGH.text(g, `${b.pts}`, 92 + i * 90, 690, 20, '#fff', 'center', 'bold'); });
      MGH.text(g, `⏱ ${Math.max(0, 45 - (S.phase === 'play' ? S.stageT : 0)).toFixed(0)}`, 1200, 692, 22, '#fff', 'center', 'bold');
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
        if (near && b.dcd <= 0 && Math.random() < 0.3) v.b = true;
      }
      if (!b.jt || Math.random() < dt * 0.8) b.jt = { x: R.range(-60, 60), y: R.range(-60, 60) };
      if (Math.hypot(gx - b.x, gy - b.y) > 140) { gx += b.jt.x; gy += b.jt.y; }
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
  // short sprint (hold A) · long balance beam over water · reaction cargo net · zipline with swinging pads · tire hop · rhythm treadmill
  const SEC = [{ to: 10, k: 'sprint', name: 'Sprint' }, { to: 34, k: 'beam', name: 'Balance beam' }, { to: 46, k: 'net', name: 'Cargo net' }, { to: 62, k: 'zip', name: 'Zipline' }, { to: 78, k: 'tires', name: 'Tire hop' }, { to: 100, k: 'tread', name: 'Treadmill' }];
  const TIRES = [65.5, 69, 72.5, 76], PADS = [52, 57.5], DIRS = ['left', 'up', 'right'], DIRC = { left: '◀', up: '▲', right: '▶' };
  const elim = {
    name: 'The Eliminator', icon: '🏁', how: 'The final obstacle course — the points leader starts first! SPRINT: hold A. BALANCE BEAM: tilt LEFT/RIGHT to stay centred while gusts push you. CARGO NET: press the arrow shown, fast — a wrong one slips you down. ZIPLINE: hold A and press B to tuck your legs over the swinging pads. TIRES: B to hop. TREADMILL: A and B in a steady rhythm. First across the line wins!',
    init(m, S, T) {
      const lead = Math.max(...S.pts);
      T.p = [0, 1, 2, 3].map(i => ({ x: 0, v: 0, delay: (lead - S.pts[i]) * 0.5, bal: 0, bv: 0, gust: 0, gT: R.range(1.2, 2.4), fall: 0, hop: 0, tuck: 0, fin: 0, lastKey: null, msgK: '', need: null, slip: 0, react: 0, zipHit: new Set() }));
    },
    sec(P) { return SEC.find(s => P.x < s.to) || SEC[SEC.length - 1]; },
    update(m, S, T, dt, t) {
      tickMsgs(T, dt);
      T.p.forEach((P, i) => {
        if (P.fin || t < P.delay) return;
        if (P.fall > 0) { P.fall -= dt; return; }
        const s = this.sec(P);
        if (s.k !== P.msgK) { P.msgK = s.k; say(T, i, s.name.toUpperCase(), '#9fe0ff'); P.need = null; }
        if (s.k === 'sprint') { if (m.held(i, 'a')) P.v = Math.min(8.5, P.v + 9 * dt); else P.v *= Math.exp(-3 * dt); P.x += P.v * dt; }
        if (s.k === 'beam') {
          // gusts are announced by flags a moment before they push
          P.gT -= dt; if (P.gT <= 0) { P.gust = R.pick([-1, 1]) * R.range(2.2, 3.6); P.gT = R.range(1.4, 2.6); P.gw = 0.5; }
          P.gw = Math.max(0, (P.gw || 0) - dt);
          const push = P.gw > 0 ? 0 : P.gust; P.gust *= Math.exp(-1.6 * dt);
          P.bv += (R.range(-1, 1) * 2.4 + P.bal * 2.6 + push) * dt; P.bv += m.axis(i).x * 6.5 * dt; P.bal += P.bv * dt; P.bv *= Math.exp(-1.8 * dt);
          const steady = 1 - Math.min(1, Math.abs(P.bal)); P.x += (1.4 + 1.6 * steady) * dt;
          if (Math.abs(P.bal) > 1) { P.fall = 1.2; P.x = Math.max(10, P.x - 5); P.bal = 0; P.bv = 0; P.gust = 0; say(T, i, 'SPLASH! back 5 m', '#ff6b6b'); Sfx.noise(0.4, 800, 0.1, 'lowpass'); MGH.burst(60 + P.x * 11.6, MGM.lane(i, 110, 150).y1 - 20, ['#9fe0ff', '#fff'], 16, { speed: 200, grav: 500 }); }
        }
        if (s.k === 'net') {
          P.slip -= dt; P.react += dt;
          if (!P.need) { P.need = R.pick(DIRS.filter(d => d !== P.lastNeed)); P.react = 0; }
          if (P.slip <= 0) {
            const ax = m.axis(i), got = m.pressed(i, 'left') || (ax.x < -0.6 && !P.axHeld) ? 'left' : m.pressed(i, 'right') || (ax.x > 0.6 && !P.axHeld) ? 'right' : m.pressed(i, 'up') || (ax.y < -0.6 && !P.axHeld) ? 'up' : null;
            P.axHeld = Math.abs(ax.x) > 0.6 || ax.y < -0.6;
            if (got) {
              if (got === P.need) { const q = P.react < 0.45 ? 1.5 : P.react < 0.8 ? 1.15 : 0.9; P.x += q; if (q > 1.2) say(T, i, 'QUICK!', '#7cf06a'); Sfx.tone(700 + q * 200, 0.04, 'triangle', 0.03); }
              else { P.slip = 0.45; P.x = Math.max(34, P.x - 0.8); say(T, i, 'slip!', '#ff9a6b'); Sfx.bad(); }
              P.lastNeed = P.need; P.need = null;
            }
          } else P.axHeld = true;
        }
        if (s.k === 'zip') {
          P.tuck -= dt;
          if (m.pressed(i, 'b') && P.tuck <= -0.25) P.tuck = 0.5;
          if (m.held(i, 'a')) { P.v = Math.min(10, Math.max(P.v, 3) + 5 * dt); P.x += P.v * dt; }
          else if (P.x > 47) { P.fall = 0.9; P.x = 46; P.v = 0; say(T, i, 'LET GO! back up', '#ff6b6b'); Sfx.thud(); }
          else P.x += 0.5 * dt;
          for (const pd of PADS) {
            const sw = Math.sin(m.t * 2.2 + pd) * 0.8; // pads swing; low ones must be tucked over
            if (!P.zipHit.has(pd) && Math.abs(P.x - pd) < 0.5) { P.zipHit.add(pd); if (P.tuck > 0) { say(T, i, 'TUCK!', '#7cf06a'); P.v += 1; } else { P.v = 2; say(T, i, 'BONK!', '#ff9a6b'); Sfx.thud(); } }
          }
        }
        if (s.k === 'tires') {
          P.v = 4.4; const px = P.x; P.hop -= dt;
          if (m.pressed(i, 'b') && P.hop <= 0) P.hop = 0.5;
          P.x += P.v * dt;
          for (const tx of TIRES) if (px < tx && P.x >= tx && P.hop <= 0) { P.fall = 0.5; P.x = tx - 0.6; say(T, i, 'TRIP!', '#ff9a6b'); Sfx.thud(); }
        }
        if (s.k === 'tread') { const q = MGM.cadence(m, i, P, dt); P.v += (9.2 * q - P.v) * 2 * dt; P.x += (P.v - 2.8) * dt; P.x = Math.max(78, P.x); }
        if (P.x >= 100) { P.fin = t; say(T, i, `FINISH ${t.toFixed(1)}s`, '#ffe680'); Sfx.coin(); MGH.burst(1200, MGM.lane(i, 110, 150).mid, ['#ffe680', m.players[i].color, '#fff'], 24, { speed: 240 }); }
      });
    },
    bot(m, S, T, i, dt) {
      const P = T.p[i], v = m.vin[i]; v.a = v.b = false; v.ax = 0; v.left = v.right = v.up = false; if (P.fin || S.stageT < P.delay || P.fall > 0) return;
      const s = this.sec(P);
      if (s.k === 'sprint') v.a = true;
      if (s.k === 'tread') MGM.botCadence(m, i, P, dt);
      if (s.k === 'beam') { const pre = P.gw > 0 ? P.gust * 0.12 : 0; v.ax = -clamp((P.bal * 1.5 + P.bv * 0.55 + pre) + R.range(-0.3, 0.3), -1, 1); }
      if (s.k === 'net' && P.need && P.slip <= 0) { P.bR = P.bR || R.range(0.3, 0.6); if (P.react > P.bR && !P.bPrev) { v[Math.random() < 0.07 ? R.pick(DIRS) : P.need] = true; P.bR = 0; } }
      P.bPrev = v.left || v.right || v.up;
      if (s.k === 'zip') { v.a = Math.random() > 0.003; const nx = PADS.find(pd => pd > P.x && !P.zipHit.has(pd)); if (nx !== undefined && nx - P.x < P.v * 0.22 + R.range(-0.4, 0.6) && P.tuck <= -0.25) v.b = true; }
      if (s.k === 'tires') { const nx = TIRES.find(tx => tx > P.x); if (nx !== undefined && nx - P.x < 1.1 + R.range(-0.2, 0.3) && P.hop <= 0) v.b = true; }
    },
    done(m, S, T, t) { return T.p.every(P => P.fin) || t > 150; },
    result(m, S, T) { return T.p.map(P => P.fin ? -P.fin : -(200 - P.x)); },
    fmt: v => v > -100 ? `${(-v).toFixed(1)}s` : 'DNF',
    draw(m, S, T, g) {
      arenaBack(g, m.t);
      const X = x => 60 + x * 11.6;
      for (let i = 0; i < 4; i++) {
        const L = MGM.lane(i, 110, 150), P = T.p[i], p = m.players[i], floor = L.y1 - 18;
        g.fillStyle = MGH.grad(g, L.y0, L.y1, i % 2 ? ['#2a1a4a', '#1c1036'] : ['#24163f', '#160c2c']); g.fillRect(0, L.y0, 1280, L.h); g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(0, L.y1 - 2, 1280, 2);
        // sprint track
        g.fillStyle = '#b8503a'; g.fillRect(X(0), floor, X(10) - X(0), 10); g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(X(0), floor, X(10) - X(0), 2);
        // water pool with a wooden beam
        g.fillStyle = MGH.grad(g, floor - 6, L.y1, ['#3fb0ee', '#1a6ab8']); g.fillRect(X(10), floor - 6, X(34) - X(10), L.y1 - floor + 4);
        g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 2; g.beginPath(); for (let x = X(10); x <= X(34); x += 8) g.lineTo(x, floor - 2 + Math.sin(x * 0.08 + m.t * 3) * 2); g.stroke();
        g.fillStyle = '#8a5a2a'; g.fillRect(X(10), floor - 34, X(34) - X(10), 8); g.fillStyle = '#b07a40'; g.fillRect(X(10), floor - 34, X(34) - X(10), 3);
        for (let k = 0; k < 4; k++) { const px = X(10) + 12 + k * (X(34) - X(10) - 24) / 3; g.fillStyle = '#6a4220'; g.fillRect(px - 3, floor - 26, 6, 24); }
        // gust flags along the beam
        if (this.sec(P).k === 'beam') { const fl = P.gw > 0 ? Math.sign(P.gust) : 0, fx = X(Math.min(33, P.x + 3)); g.fillStyle = '#ddd'; g.fillRect(fx, L.y0 + 12, 2, 30); g.fillStyle = P.gw > 0 ? '#ffcf4a' : 'rgba(255,255,255,0.4)'; g.beginPath(); g.moveTo(fx + 2, L.y0 + 12); g.lineTo(fx + 2 + (fl || 0.4) * 22, L.y0 + 18 + Math.sin(m.t * 12) * 2); g.lineTo(fx + 2, L.y0 + 24); g.fill(); if (P.gw > 0) MGH.text(g, fl < 0 ? '◀ GUST' : 'GUST ▶', fx, L.y0 + 54, 13, '#ffcf4a', 'center', 'bold'); }
        // cargo net between two posts, with knots
        g.fillStyle = '#5a3a1a'; g.fillRect(X(34) - 4, L.y0 + 14, 6, floor - L.y0 - 14); g.fillRect(X(46) - 2, L.y0 + 14, 6, floor - L.y0 - 14);
        g.strokeStyle = '#e0c890'; g.lineWidth = 2;
        for (let k = 0; k <= 7; k++) { const x = X(34) + k * (X(46) - X(34)) / 7; g.beginPath(); g.moveTo(x, floor); for (let y = floor; y >= L.y0 + 18; y -= 10) g.lineTo(x + Math.sin(y * 0.1 + k) * 2, y); g.stroke(); }
        for (let k = 0; k < 6; k++) { const y = L.y0 + 20 + k * (floor - L.y0 - 20) / 5; g.beginPath(); g.moveTo(X(34), y); g.quadraticCurveTo((X(34) + X(46)) / 2, y + 6, X(46), y); g.stroke(); }
        // zipline: tower, cable, swinging pads
        g.fillStyle = '#4a4a5a'; g.fillRect(X(46), L.y0 + 10, 10, floor - L.y0 - 10); g.strokeStyle = '#cfd6e0'; g.lineWidth = 3; g.beginPath(); g.moveTo(X(46), L.y0 + 14); g.lineTo(X(62), floor - 40); g.stroke();
        for (const pd of PADS) { const sw = Math.sin(m.t * 2.2 + pd) * 0.35, ax = X(pd), ay = L.y0 + 6; g.save(); g.translate(ax, ay); g.rotate(sw); g.strokeStyle = '#999'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 70); g.stroke(); g.fillStyle = '#e8432a'; MGH.rr(g, -12, 66, 24, 30, 8); g.fill(); g.fillStyle = '#fff'; g.fillRect(-12, 76, 24, 6); g.restore(); }
        // tires and the treadmill
        g.fillStyle = '#5a4a6a'; g.fillRect(X(62), floor, X(78) - X(62), 8);
        for (const tx of TIRES) { g.fillStyle = '#1a1a1a'; g.beginPath(); g.ellipse(X(tx), floor - 4, 18, 9, 0, 0, 7); g.fill(); g.strokeStyle = '#444'; g.lineWidth = 2; g.stroke(); g.fillStyle = '#5a4a6a'; g.beginPath(); g.ellipse(X(tx), floor - 5, 8, 3.5, 0, 0, 7); g.fill(); }
        g.fillStyle = '#2a2a3a'; MGH.rr(g, X(78), floor - 8, X(100) - X(78), 18, 9); g.fill(); g.strokeStyle = 'rgba(255,255,255,0.3)'; g.lineWidth = 2; for (let k = 0; k < 14; k++) { const W = X(100) - X(78) - 16, x = X(78) + 8 + ((k * 22 - m.t * 90) % W + W) % W; g.beginPath(); g.moveTo(x, floor - 6); g.lineTo(x, floor + 8); g.stroke(); }
        for (let k = 0; k < 8; k++) { g.fillStyle = k % 2 ? '#fff' : '#222'; g.fillRect(X(100), L.y0 + 10 + k * 15, 8, 15); }
        g.fillStyle = p.color; MGH.rr(g, 8, L.y0 + 8, 30, 22, 6); g.fill(); MGH.text(g, String(i + 1), 23, L.y0 + 25, 16, '#fff', 'center', 'bold');
        if (P.delay > 0) MGH.text(g, S.phase === 'play' && S.stageT < P.delay ? `starts in ${(P.delay - S.stageT).toFixed(1)}s` : `+${P.delay.toFixed(1)}s`, 110, L.y0 + 24, 13, '#ffe680', 'left');
        // the runner
        const s = this.sec(P), x = X(Math.min(100, P.x));
        let y = floor, mood = 'determined', walk = 0, hands, rot = 0, fp;
        if (s.k === 'beam') { y = floor - 34; rot = P.bal * 0.5; hands = { n: { x: -1.4, y: -0.3 + P.bal * 0.4, d: 180, o: true, m: true }, f: { x: 1.3, y: -0.3 - P.bal * 0.4, d: 0, o: true, m: false } }; mood = Math.abs(P.bal) > 0.6 ? 'scared' : 'nervous'; walk = 1; }
        else if (s.k === 'net') { y = floor - (P.x - 34) / 12 * (floor - L.y0 - 40); const up = (P.lastNeed || 'up') === 'left'; hands = { n: { x: -0.9, y: up ? -1.7 : -1.2, d: -95, o: true, m: true }, f: { x: 0.9, y: up ? -1.2 : -1.7, d: -85, o: true, m: false } }; mood = P.slip > 0 ? 'scared' : 'effort'; }
        else if (s.k === 'zip') { const k = (P.x - 46) / 16; y = L.y0 + 14 + k * (floor - 40 - L.y0 - 14) + 74; hands = { n: { x: -0.3, y: -2.3, d: -90, o: false, m: false }, f: { x: 0.3, y: -2.3, d: -90, o: false, m: false } }; mood = 'cheer'; if (P.tuck > 0) { y -= 14; fp = [{ x: -0.3, lift: 0.6, tip: 0.6 }, { x: 0.3, lift: 0.6, tip: 0.6 }]; } }
        else if (s.k === 'tires') { y = floor - (P.hop > 0 ? Math.sin(Math.PI * (1 - P.hop / 0.5)) * 30 : 0); walk = P.hop > 0 ? 0 : 1; }
        else { walk = P.v > 1 ? 1 : 0; mood = s.k === 'tread' ? 'effort' : 'determined'; }
        if (P.fin) { mood = 'cheer'; walk = 0; }
        if (P.fall > 0) { mood = 'hurt'; }
        g.save(); g.translate(x, y - 30 * 1.25); g.rotate(rot);
        Char.draw(g, 0, 0, 28, p.el.id, p.color, { mood: MGH.persona(mood, p.el.id), seed: i, look: { x: 1, y: 0 }, walk, hands, feet: fp, noShadow: true, t: m.t * (walk ? 0.6 + P.v * 0.06 : 1) });
        g.restore();
        const live = !P.fin && P.fall <= 0 && S.phase === 'play' && S.stageT > P.delay;
        if (s.k === 'beam' && live) { g.fillStyle = 'rgba(0,0,0,0.5)'; MGH.rr(g, x - 44, L.y0 + 10, 88, 10, 5); g.fill(); g.fillStyle = 'rgba(120,230,120,0.5)'; g.fillRect(x - 16, L.y0 + 10, 32, 10); g.fillStyle = Math.abs(P.bal) > 0.7 ? '#ff6b6b' : '#fff'; g.fillRect(x - 3 + clamp(P.bal, -1, 1) * 40, L.y0 + 6, 6, 18); }
        if (s.k === 'net' && live && P.need && P.slip <= 0) { g.fillStyle = 'rgba(0,0,0,0.6)'; g.beginPath(); g.arc(x + 46, y - 50, 20, 0, 7); g.fill(); MGH.text(g, DIRC[P.need], x + 46, y - 42, 22, '#ffe680', 'center', 'bold'); }
        if (s.k === 'zip' && live) { const nx = PADS.find(pd => pd > P.x && !P.zipHit.has(pd)); if (nx !== undefined && nx - P.x < 3.5) MGH.text(g, 'B = tuck!', x + 50, y - 60, 14, '#ffe680', 'center', 'bold'); }
        if (s.k === 'sprint' && live && S.stageT < P.delay + 3) MGH.text(g, 'hold A', x + 50, y - 70, 14, '#fff', 'center', 'bold');
        if (s.k === 'tread' && live) MGM.drawCadence(g, 1150, L.y0 + 26, P, 90);
        msgAt(g, T, i, Math.min(1100, x + 60), L.y0 + 40);
      }
    },
  };

  MGM.def({ id: 'gladiators', name: 'Titan Trials', how: 'Arena events against the mighty Titans, one after another. The overall leader even gets a head start in the final Eliminator!', stages: [duel, spheres, hoops, elim] });
})();
