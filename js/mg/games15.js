'use strict';
// ---------------------------------------------------------------- Military Drill (boot-camp marathon, five events)
(() => {
  const say = (T, i, text, col = '#ffe680') => { T.msg = T.msg || []; T.msg[i] = { text, col, t: 0 }; };
  const tickMsgs = (T, dt) => (T.msg || []).forEach(q => { if (q) q.t += dt; });
  const msgAt = (g, T, i, x, y) => { const q = (T.msg || [])[i]; if (!q || q.t > 1.1) return; g.globalAlpha = 1 - q.t / 1.1; MGH.text(g, q.text, x, y - q.t * 16, 22, q.col, 'center', 'bold'); g.globalAlpha = 1; };
  const LT = 120, LH = 145, ln = i => MGM.lane(i, LT, LH);
  const hero = (g, m, i, x, y, r, mood, o = {}) => { const p = m.players[i]; Char.draw(g, x, y, r, p.el.id, p.color, Object.assign({ mood: MGH.persona(mood, p.el.id), seed: i * 1.7 }, o)); };
  const sarge = (g, x, y, r, mood, o = {}) => Char.npc(g, x, y, r, 'guard', Object.assign({ mood, hat: 'helmet' }, o));
  // stick flicks count like d-pad presses
  const dirPress = (m, i, P) => {
    const a = m.axis(i), was = P.axd || '';
    const now = a.x < -0.6 ? 'left' : a.x > 0.6 ? 'right' : a.y < -0.6 ? 'up' : a.y > 0.6 ? 'down' : '';
    P.axd = now;
    for (const k of ['left', 'right', 'up', 'down']) if (m.pressed(i, k)) return k;
    return now && now !== was ? now : null;
  };
  // boot camp backdrop: sky, hills, tents, sandbags and a flag
  const camp = (g, t, h = 120) => {
    g.fillStyle = MGH.grad(g, 40, 40 + h, ['#7ab8e8', '#c8e4f4']); g.fillRect(0, 40, 1280, h);
    g.fillStyle = '#6a8a4a'; g.beginPath(); g.moveTo(0, 40 + h); for (let x = 0; x <= 1280; x += 40) g.lineTo(x, 40 + h - 26 - Math.sin(x * 0.006) * 18 - Math.sin(x * 0.017) * 8); g.lineTo(1280, 40 + h); g.fill();
    for (let k = 0; k < 4; k++) { const x = 120 + k * 300, y = 40 + h - 4; g.fillStyle = '#5a6a3a'; g.beginPath(); g.moveTo(x - 50, y); g.lineTo(x, y - 46); g.lineTo(x + 50, y); g.fill(); g.fillStyle = '#3a4a2a'; g.beginPath(); g.moveTo(x - 8, y); g.lineTo(x, y - 30); g.lineTo(x + 8, y); g.fill(); }
    g.fillStyle = '#ccc'; g.fillRect(1230, 50, 3, h - 10); g.fillStyle = '#e8432a'; g.beginPath(); g.moveTo(1233, 54); for (let k = 0; k <= 6; k++) g.lineTo(1233 + k * 6, 56 + Math.sin(t * 5 + k) * 3); g.lineTo(1269, 76); for (let k = 6; k >= 0; k--) g.lineTo(1233 + k * 6, 74 + Math.sin(t * 5 + k) * 3); g.fill();
  };
  const colBack = (g, i, m, top = '#8a9a5a', bot = '#5a6a3a') => {
    g.fillStyle = MGH.grad(g, 160, 720, [top, bot]); g.fillRect(i * 320, 160, 320, 560);
    if (i) { g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(i * 320 - 2, 160, 4, 560); }
    g.fillStyle = m.players[i].color; MGH.rr(g, i * 320 + 10, 170, 30, 22, 6); g.fill(); MGH.text(g, String(i + 1), i * 320 + 25, 187, 16, '#fff', 'center', 'bold');
  };
  const sandbags = (g, x, y, n) => { for (let k = 0; k < n; k++) { g.fillStyle = k % 2 ? '#b8a070' : '#c8b080'; MGH.rr(g, x + k * 34, y, 36, 18, 8); g.fill(); g.strokeStyle = 'rgba(80,60,30,0.4)'; g.lineWidth = 1.5; g.stroke(); } };

  // ---- 1) drill commands: the sergeant barks, you react — fast and right
  const CMDS = [{ k: 'left', t: 'LEFT FACE!' }, { k: 'right', t: 'RIGHT FACE!' }, { k: 'down', t: 'ABOUT FACE!' }, { k: 'up', t: 'FORWARD MARCH!' }, { k: 'a', t: 'SALUTE!' }];
  const NCMD = 16;
  const drill = {
    name: 'Drill Commands', icon: '🫡', how: 'The sergeant shouts an order — obey it FAST! LEFT FACE = LEFT, RIGHT FACE = RIGHT, ABOUT FACE = DOWN, FORWARD MARCH = UP, SALUTE = A. Quickest correct soldier earns the most points; a wrong move costs one. The orders get faster!',
    init(m, S, T) {
      T.seq = []; for (let k = 0; k < NCMD; k++) { let c; do c = R.pick(CMDS); while (T.seq.length && c === T.seq[T.seq.length - 1]); T.seq.push(c); }
      T.k = -1; T.ph = 'gap'; T.tt = 1.2; T.p = [0, 1, 2, 3].map(() => ({ pts: 0, ans: null, face: 'up', pose: 0, axd: '', bR: 0 })); T.order = [];
    },
    win(T) { return Math.max(0.9, 1.8 - T.k * 0.06); },
    update(m, S, T, dt) {
      tickMsgs(T, dt);
      T.tt -= dt; T.p.forEach(P => { P.pose = Math.max(0, P.pose - dt); });
      if (T.ph === 'gap') { if (T.tt <= 0) { T.k++; if (T.k >= NCMD) { T.ph = 'end'; return; } T.ph = 'cmd'; T.tt = this.win(T); T.order = []; T.p.forEach(P => { P.ans = null; P.bR = 0; }); Sfx.tone(180, 0.18, 'sawtooth', 0.05, 120); } return; }
      if (T.ph !== 'cmd') return;
      const c = T.seq[T.k];
      T.p.forEach((P, i) => {
        if (P.ans) { dirPress(m, i, P); return; }
        const d = dirPress(m, i, P), k = m.pressed(i, 'a') ? 'a' : d;
        if (!k) return;
        if (k === c.k) { P.ans = 'ok'; T.order.push(i); const pts = [3, 2, 1, 1][T.order.length - 1]; P.pts += pts; P.face = k; P.pose = 0.9; say(T, i, T.order.length === 1 ? `FIRST! +${pts}` : `+${pts}`, '#7cf06a'); Sfx.tone(880 + 120 * (4 - T.order.length), 0.05, 'triangle', 0.04); }
        else { P.ans = 'bad'; P.pts -= 1; P.face = k; P.pose = 0.9; say(T, i, 'WRONG! −1', '#ff6b6b'); Sfx.bad(); }
      });
      if (T.tt <= 0 || T.p.every(P => P.ans)) {
        T.p.forEach((P, i) => { if (!P.ans) { P.ans = 'late'; say(T, i, 'too slow', '#ffb13d'); } });
        T.ph = 'gap'; T.tt = 0.7;
      }
    },
    bot(m, S, T, i, dt) {
      const P = T.p[i], v = m.vin[i]; v.a = false; v.ax = 0; v.ay = 0;
      if (T.ph !== 'cmd' || P.ans) return;
      if (!P.bR) P.bR = R.range(0.38, 0.95);
      P.bT = (P.bT || 0) + dt; if (T.tt > this.win(T) - 0.02) P.bT = 0;
      if (P.bT < P.bR) return;
      const k = Math.random() < 0.08 ? R.pick(CMDS).k : T.seq[T.k].k;
      if (k === 'a') v.a = true; else { v.ax = k === 'left' ? -1 : k === 'right' ? 1 : 0; v.ay = k === 'up' ? -1 : k === 'down' ? 1 : 0; }
    },
    done(m, S, T) { return T.ph === 'end'; },
    result(m, S, T) { return T.p.map(P => P.pts); },
    fmt: v => `${Math.round(v)} pts`,
    draw(m, S, T, g) {
      camp(g, m.t, 120);
      g.fillStyle = MGH.grad(g, 160, 720, ['#c8b888', '#a89868']); g.fillRect(0, 160, 1280, 560);
      for (let k = 0; k < 14; k++) { g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(0, 200 + k * 40, 1280, 2); }
      // the sergeant on a crate with a megaphone
      g.fillStyle = '#8a6a3a'; g.fillRect(590, 250, 100, 60); g.strokeStyle = '#5a4020'; g.lineWidth = 3; g.strokeRect(590, 250, 100, 60); g.beginPath(); g.moveTo(590, 250); g.lineTo(690, 310); g.moveTo(690, 250); g.lineTo(590, 310); g.stroke();
      const cmd = T.ph === 'cmd' ? T.seq[T.k] : null;
      sarge(g, 640, 200, 38, cmd ? 'shout' : 'smug', { look: { x: 0, y: 0.3 }, hands: cmd ? { n: { x: -0.9, y: -0.9, d: -150, o: true, m: true }, f: { x: 0.9, y: 0.3, d: 90, o: true, m: false } } : undefined });
      if (cmd) {
        const sh = Math.sin(m.t * 40) * (T.tt > this.win(T) - 0.2 ? 3 : 0);
        g.fillStyle = '#fff'; MGH.rr(g, 400 + sh, 72, 480, 70, 20); g.fill(); g.beginPath(); g.moveTo(620, 142); g.lineTo(640, 162); g.lineTo(660, 142); g.fill();
        MGH.text(g, cmd.t, 640 + sh, 122, 40, '#1a0f3a', 'center', 'bold');
        g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(440, 136, 400, 5); g.fillStyle = '#e8432a'; g.fillRect(440, 136, 400 * Math.max(0, T.tt / this.win(T)), 5);
      }
      MGH.text(g, `order ${Math.min(NCMD, T.k + 1)}/${NCMD}`, 640, 340, 16, '#5a4a2a', 'center', 'bold');
      for (let i = 0; i < 4; i++) {
        const P = T.p[i], x = 200 + i * 293, y = 470, f = P.pose > 0 ? P.face : 'up';
        MGH.shadow(g, x, y + 52, 34, 0.3);
        const look = f === 'left' ? { x: -1, y: 0 } : f === 'right' ? { x: 1, y: 0 } : f === 'down' ? { x: 0, y: -1 } : { x: 0, y: 0.3 };
        const hands = f === 'a' ? { n: { x: -0.55, y: -1.25, d: -60, o: true, m: true }, f: { x: 0.8, y: 0.4, d: 90, o: true, m: false } } : undefined;
        hero(g, m, i, x, y, 42, P.ans === 'bad' && P.pose > 0 ? 'dizzy' : P.ans === 'ok' && P.pose > 0 ? 'proud' : 'determined', { look, hands, walk: f === 'up' && P.pose > 0 ? 1 : 0, noIdle: true });
        g.fillStyle = 'rgba(0,0,0,0.5)'; MGH.rr(g, x - 40, 560, 80, 32, 10); g.fill(); g.fillStyle = m.players[i].color; g.beginPath(); g.arc(x - 22, 576, 9, 0, 7); g.fill(); MGH.text(g, `${P.pts}`, x + 12, 585, 22, '#fff', 'center', 'bold');
        msgAt(g, T, i, x, 380);
      }
    },
  };

  // ---- 2) barbed-wire crawl: crawl in rhythm, freeze when the flare goes up
  const CRAWL = 40;
  const crawl = {
    name: 'Barbed Crawl', icon: '🪖', how: 'Crawl under the wire by pressing A and B in turn (left arm, right arm) in a STEADY rhythm. When a FLARE shoots up, FREEZE! Any move while the field is lit and you are spotted — sent back 4 m.',
    init(m, S, T) { T.p = [0, 1, 2, 3].map(() => ({ d: 0, v: 0, fin: 0, stun: 0, lastKey: null, late: R.range(0.15, 0.45) })); T.go = 2.2; T.fl = 'dark'; T.ft = R.range(2.5, 4); },
    update(m, S, T, dt, t) {
      tickMsgs(T, dt);
      if (t < T.go) return;
      T.ft -= dt;
      if (T.ft <= 0) {
        if (T.fl === 'dark') { T.fl = 'warn'; T.ft = 0.75; Sfx.whoosh(true); }
        else if (T.fl === 'warn') { T.fl = 'lit'; T.ft = R.range(1.4, 2.2); Sfx.boom(); }
        else { T.fl = 'dark'; T.ft = R.range(2.2, 4.5); }
      }
      T.p.forEach((P, i) => {
        if (P.fin) return;
        P.stun -= dt;
        if (P.stun > 0) { P.v = 0; m.pressed(i, 'a'); return; }
        const moved = m.pressed(i, 'a') || m.pressed(i, 'b');
        if (T.fl === 'lit') {
          if (moved) { P.d = Math.max(0, P.d - 4); P.stun = 1; P.v = 0; P.rq = 0; P.beat = 0; say(T, i, 'SPOTTED! −4 m', '#ff6b6b'); Sfx.bad(); }
          P.v = 0; P.cT = 0; return;
        }
        const q = MGM.cadence(m, i, P, dt); P.v += (3.4 * q - P.v) * 3 * dt; P.d += P.v * dt;
        if (P.d >= CRAWL) { P.fin = t - T.go; say(T, i, `${P.fin.toFixed(1)}s`, '#fff'); Sfx.coin(); }
      });
    },
    bot(m, S, T, i, dt) {
      const P = T.p[i], v = m.vin[i]; v.a = v.b = false;
      if (S.stageT < T.go || P.fin || P.stun > 0) return;
      if (T.fl === 'warn') { P.wt = (P.wt || 0) + dt; if (P.wt > P.late) return; }
      else if (T.fl === 'lit') { if (Math.random() < 0.0015) v.a = true; return; }
      else { P.wt = 0; if (Math.random() < 0.01) P.late = R.range(0.15, 0.9); }
      MGM.botCadence(m, i, P, dt);
    },
    done(m, S, T, t) { return T.p.every(P => P.fin) || t > T.go + 75; },
    result(m, S, T) { return T.p.map(P => P.fin ? -P.fin : -(100 + CRAWL - P.d)); },
    fmt: v => v > -100 ? `${(-v).toFixed(1)}s` : 'DNF',
    draw(m, S, T, g) {
      const t = S.phase === 'play' ? S.stageT : 0;
      camp(g, m.t, 80);
      const X = d => 110 + d * 26.5;
      for (let i = 0; i < 4; i++) {
        const L = ln(i), P = T.p[i];
        g.fillStyle = MGH.grad(g, L.y0, L.y1, ['#7a5a3a', '#5a4028', '#4a3420']); g.fillRect(0, L.y0, 1280, L.h);
        for (let k = 0; k < 20; k++) { g.fillStyle = 'rgba(40,25,10,0.3)'; g.beginPath(); g.ellipse((k * 97 + i * 41) % 1280, L.y1 - 20 - (k * 13) % 50, 22, 6, 0, 0, 7); g.fill(); }
        g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(X(0), L.y0, 3, L.h); for (let k = 0; k < 6; k++) { g.fillStyle = k % 2 ? '#fff' : '#222'; g.fillRect(X(CRAWL), L.y0 + k * L.h / 6, 8, L.h / 6); }
        const x = X(Math.min(CRAWL, P.d)), y = L.y1 - 30;
        const sw = Math.sin((P.d || 0) * 3);
        g.save(); g.translate(x, y + 18); g.rotate(0.35); g.scale(1, 0.78);
        hero(g, m, i, 0, -30, 28, P.stun > 0 ? 'scared' : T.fl === 'lit' ? 'nervous' : 'effort', { look: { x: 1, y: 0.1 }, noShadow: true, noIdle: true, hands: { n: { x: -1.1 - sw * 0.4, y: 0.5, d: 175, o: true, m: true }, f: { x: -0.9 + sw * 0.4, y: 0.6, d: 175, o: true, m: false } }, feet: [{ x: 0.6, lift: 0.1, tip: 0.6 }, { x: 0.9, lift: 0.05, tip: 0.6 }] });
        g.restore();
        // barbed wire overhead
        for (let px = 60; px < 1240; px += 140) { g.fillStyle = '#4a3a2a'; g.fillRect(px - 3, L.y1 - 70, 6, 56); }
        g.strokeStyle = '#9aa0a8'; g.lineWidth = 2; g.beginPath(); for (let wx = 60; wx <= 1240; wx += 10) g.lineTo(wx, L.y1 - 62 + Math.sin(wx * 0.04) * 3); g.stroke();
        for (let wx = 66; wx < 1240; wx += 22) { const wy = L.y1 - 62 + Math.sin(wx * 0.04) * 3; g.beginPath(); g.moveTo(wx - 4, wy - 4); g.lineTo(wx + 4, wy + 4); g.moveTo(wx + 4, wy - 4); g.lineTo(wx - 4, wy + 4); g.stroke(); }
        g.fillStyle = m.players[i].color; MGH.rr(g, 8, L.y0 + 8, 30, 22, 6); g.fill(); MGH.text(g, String(i + 1), 23, L.y0 + 25, 16, '#fff', 'center', 'bold');
        if (!P.fin) MGM.drawCadence(g, 210, L.y0 + 22, P, 80);
      }
      // the flare
      if (T.fl === 'warn') { const k = 1 - T.ft / 0.75, fy = 600 - k * 520; g.strokeStyle = 'rgba(255,220,150,0.7)'; g.lineWidth = 4; g.beginPath(); g.moveTo(640, 640); g.lineTo(640, fy); g.stroke(); MGH.glow(g, 640, fy, 40, 'rgba(255,200,80,0.8)'); MGH.label(g, 'FLARE! FREEZE!', 640, 110, 36, '#ffcf4a'); }
      if (T.fl === 'lit') { g.fillStyle = 'rgba(255,240,180,0.22)'; g.fillRect(0, 40, 1280, 680); MGH.glow(g, 640, 70, 120, 'rgba(255,230,140,0.9)'); MGH.label(g, "DON'T MOVE!", 640, 110, 36, '#ff6b6b'); }
      drawMsgsLane(g, T, i => X(Math.min(CRAWL, T.p[i].d)));
      if (S.phase === 'play' && t < T.go + 0.6) MGH.label(g, t < T.go ? 'Ready…' : 'CRAWL!', 640, 110, 48, '#fff');
    },
  };
  const drawMsgsLane = (g, T, xs) => (T.msg || []).forEach((q, i) => { if (!q || q.t > 1.1) return; const L = ln(i); g.globalAlpha = 1 - q.t / 1.1; MGH.text(g, q.text, xs(i), L.y0 + 40 - q.t * 14, 22, q.col, 'center', 'bold'); g.globalAlpha = 1; });

  // ---- 3) paint range: shoot the pop-up targets, never the friendly cut-outs
  const RANGE_T = 32;
  const range = {
    name: 'Paint Range', icon: '🎯', how: 'Targets pop up in three spots. Point LEFT, RIGHT or nothing (middle) to aim, and press A to fire a paint shot. A quick hit scores 2, a slow one 1. Do NOT hit the blue friendly cut-outs (−2)!',
    init(m, S, T) {
      T.seq = []; let tt = 1.5; while (tt < RANGE_T - 1) { T.seq.push({ t: tt, s: R.int(0, 2), ally: Math.random() < 0.18, life: R.range(1.1, 1.6) }); tt += R.range(0.55, 1.05); }
      T.p = [0, 1, 2, 3].map(() => ({ pts: 0, aim: 1, cd: 0, k: 0, hits: [], splat: [], bR: R.range(0.3, 0.55), flash: 0 }));
    },
    update(m, S, T, dt, t) {
      tickMsgs(T, dt);
      T.p.forEach((P, i) => {
        P.cd -= dt; P.flash -= dt;
        const ax = m.axis(i).x; P.aim = m.held(i, 'left') || ax < -0.5 ? 0 : m.held(i, 'right') || ax > 0.5 ? 2 : 1;
        if (m.pressed(i, 'a') && P.cd <= 0) {
          P.cd = 0.28; P.flash = 0.12; Sfx.tone(520, 0.05, 'square', 0.03, 200);
          const tg = T.seq.findIndex((q, k) => q.s === P.aim && t >= q.t && t < q.t + q.life && !P.hits[k]);
          if (tg >= 0) {
            const q = T.seq[tg]; P.hits[tg] = true; P.splat.push({ s: P.aim, t: 0 });
            if (q.ally) { P.pts -= 2; say(T, i, 'FRIENDLY! −2', '#6bb8ff'); Sfx.bad(); }
            else { const fast = t - q.t < 0.55; P.pts += fast ? 2 : 1; say(T, i, fast ? 'BULLSEYE +2' : '+1', fast ? '#ffe680' : '#7cf06a'); Sfx.coin(); }
          }
        }
        P.splat.forEach(s => { s.t += dt; }); P.splat = P.splat.filter(s => s.t < 0.6);
      });
    },
    bot(m, S, T, i, dt) {
      const P = T.p[i], v = m.vin[i], t = S.stageT; v.a = false;
      const up = T.seq.map((q, k) => ({ q, k })).filter(o => t >= o.q.t + P.bR && t < o.q.t + o.q.life && !P.hits[o.k]);
      const tg = up.find(o => !o.q.ally || Math.random() < 0.004);
      if (!tg) { v.ax = 0; return; }
      v.ax = tg.q.s === 0 ? -1 : tg.q.s === 2 ? 1 : 0;
      if (P.aim === tg.q.s && P.cd <= 0) { v.a = true; P.bR = R.range(0.3, 0.6); }
    },
    done(m, S, T, t) { return t > RANGE_T; },
    result(m, S, T) { return T.p.map(P => P.pts); },
    fmt: v => `${Math.round(v)} pts`,
    draw(m, S, T, g) {
      const t = S.phase === 'play' ? S.stageT : 0;
      camp(g, m.t, 120);
      for (let i = 0; i < 4; i++) {
        const P = T.p[i], ox = i * 320;
        colBack(g, i, m, '#9aaa6a', '#6a7a4a');
        g.fillStyle = '#c8b080'; g.fillRect(ox + 10, 400, 300, 10); // berm
        for (let s = 0; s < 3; s++) {
          const tx = ox + 70 + s * 90, ty = 330;
          g.fillStyle = '#5a4020'; g.fillRect(tx - 3, ty, 6, 72);
          const q = T.seq.findIndex((o, k) => o.s === s && t >= o.t && t < o.t + o.life && !P.hits[k]);
          if (q >= 0) {
            const o = T.seq[q], up = Math.min(1, (t - o.t) / 0.12, (o.t + o.life - t) / 0.12);
            g.save(); g.translate(tx, ty + 70); g.scale(1, up); g.translate(0, -70);
            if (o.ally) { Char.npc(g, 0, 20, 26, 'host', { mood: 'happy', simple: true, noShadow: true, noIdle: true }); g.fillStyle = 'rgba(80,150,255,0.35)'; g.beginPath(); g.arc(0, 18, 36, 0, 7); g.fill(); MGH.text(g, 'FRIEND', 0, 66, 12, '#fff', 'center', 'bold'); }
            else { for (const [r, c] of [[34, '#fff'], [26, '#e8432a'], [18, '#fff'], [10, '#e8432a']]) { g.fillStyle = c; g.beginPath(); g.arc(0, 20, r, 0, 7); g.fill(); } }
            g.restore();
          }
          P.splat.filter(sp => sp.s === s).forEach(sp => { g.globalAlpha = 1 - sp.t / 0.6; g.fillStyle = m.players[i].color; for (let k = 0; k < 7; k++) { g.beginPath(); g.arc(tx + Math.cos(k * 0.9) * sp.t * 50, ty + 20 + Math.sin(k * 0.9) * sp.t * 50, 8 - k * 0.6, 0, 7); g.fill(); } g.globalAlpha = 1; });
        }
        // the crosshair and the player at the firing line
        const cx = ox + 70 + P.aim * 90; g.strokeStyle = m.players[i].color; g.lineWidth = 4; g.beginPath(); g.arc(cx, 350, 20, 0, 7); g.moveTo(cx - 30, 350); g.lineTo(cx + 30, 350); g.moveTo(cx, 320); g.lineTo(cx, 380); g.stroke();
        sandbags(g, ox + 40, 560, 7);
        hero(g, m, i, ox + 160 + (P.aim - 1) * 40, 520, 36, 'determined', { look: { x: (P.aim - 1) * 0.5, y: -1 }, noIdle: true, hands: { n: { x: -0.5, y: -0.6, d: -100, o: true, m: true }, f: { x: 0.5, y: -0.6, d: -80, o: true, m: false } } });
        if (P.flash > 0) MGH.glow(g, ox + 160 + (P.aim - 1) * 40, 470, 30, 'rgba(255,255,255,0.8)');
        g.fillStyle = 'rgba(0,0,0,0.5)'; MGH.rr(g, ox + 120, 660, 80, 32, 10); g.fill(); MGH.text(g, `${P.pts}`, ox + 160, 685, 22, '#fff', 'center', 'bold');
        msgAt(g, T, i, ox + 160, 300);
      }
      MGH.text(g, `⏱ ${Math.max(0, RANGE_T - t).toFixed(0)}`, 1200, 150, 22, '#fff', 'center', 'bold');
    },
  };

  // ---- 4) water-balloon toss: hold A, let go at the right power to land in the ring
  const powerAt = t => 0.5 - 0.5 * Math.cos(t * 2.6);
  const TOSSN = 3, TMAX = 32;
  const toss = {
    name: 'Balloon Toss', icon: '🎈', how: 'HOLD A — the power bar swings up and down. LET GO to lob your water balloon. Land it in the middle of the ring: the closer, the more points. The ring moves after every throw. Three throws.',
    init(m, S, T) { T.r = 0; T.D = R.range(12, 28); T.p = [0, 1, 2, 3].map(() => ({ st: 'ready', ht: 0, pw: 0, land: 0, ft: 0, pts: 0, last: null, tgt: 0 })); },
    update(m, S, T, dt) {
      tickMsgs(T, dt);
      T.p.forEach((P, i) => {
        if (P.st === 'ready' && m.held(i, 'a')) { P.st = 'hold'; P.ht = 0; }
        if (P.st === 'hold') { P.ht += dt; P.pw = powerAt(P.ht); if (!m.held(i, 'a') || P.ht > 6) { P.st = 'fly'; P.ft = 0; P.land = P.pw * TMAX; Sfx.whoosh(false); } }
        if (P.st === 'fly') { P.ft += dt; if (P.ft > 0.9) { const off = Math.abs(P.land - T.D), sc = off < 0.6 ? 10 : Math.max(0, Math.round(10 - off * 1.4)); P.pts += sc; P.last = { d: P.land, sc }; P.st = 'wait'; say(T, i, sc >= 10 ? 'SPLASH! 10' : sc ? `+${sc}` : 'miss', sc >= 8 ? '#ffe680' : sc ? '#9fe0ff' : '#ff9a6b'); Sfx.noise(0.25, 1400, 0.1, 'lowpass'); MGH.burst(140 + P.land * 34, ln(i).y1 - 24, ['#9fe0ff', '#fff', m.players[i].color], 14, { speed: 180, grav: 400 }); } }
      });
      if (T.p.every(P => P.st === 'wait')) { T.wt = (T.wt || 0) + dt; if (T.wt > 1.2) { T.wt = 0; T.r++; if (T.r < TOSSN) { T.D = R.range(10, 29); T.p.forEach(P => { P.st = 'ready'; P.last = null; }); } else T.fin = true; } }
    },
    bot(m, S, T, i, dt) {
      const P = T.p[i], v = m.vin[i];
      if (P.st === 'ready') { if (!P.tgt) P.tgt = clamp(T.D / TMAX + R.range(-0.1, 0.1), 0.05, 0.98); v.a = v.a || Math.random() < 0.05; return; }
      if (P.st === 'hold') { const next = powerAt(P.ht + 2 * dt); v.a = !(P.pw <= P.tgt && next >= P.tgt) && !(P.pw >= P.tgt && next <= P.tgt && P.ht > 1.3); if (!v.a) P.tgt = 0; return; }
      v.a = false;
    },
    done(m, S, T) { return !!T.fin; },
    result(m, S, T) { return T.p.map(P => P.pts); },
    fmt: v => `${Math.round(v)} pts`,
    draw(m, S, T, g) {
      camp(g, m.t, 80);
      const X = d => 140 + d * 34;
      for (let i = 0; i < 4; i++) {
        const L = ln(i), P = T.p[i], fy = L.y1 - 20;
        g.fillStyle = MGH.grad(g, L.y0, L.y1, ['#8aba5a', '#6a9a4a']); g.fillRect(0, L.y0, 1280, L.h); g.fillStyle = 'rgba(0,0,0,0.15)'; g.fillRect(0, L.y1 - 2, 1280, 2);
        for (let d = 5; d <= 30; d += 5) { g.fillStyle = 'rgba(255,255,255,0.4)'; g.fillRect(X(d), fy + 6, 2, 10); MGH.text(g, `${d}m`, X(d), fy + 2, 10, 'rgba(255,255,255,0.7)'); }
        // target ring (a kiddie pool!)
        const rx = X(T.D);
        g.fillStyle = '#ff6b8a'; g.beginPath(); g.ellipse(rx, fy, 50, 14, 0, 0, 7); g.fill(); g.fillStyle = '#7ad8ff'; g.beginPath(); g.ellipse(rx, fy, 40, 10, 0, 0, 7); g.fill(); g.fillStyle = '#ffe680'; g.beginPath(); g.ellipse(rx, fy, 10, 3, 0, 0, 7); g.fill();
        sandbags(g, 30, fy - 4, 2);
        const throwing = P.st === 'fly' && P.ft < 0.2;
        hero(g, m, i, 100, fy - 30, 26, P.st === 'hold' ? 'effort' : P.last && P.last.sc >= 8 ? 'cheer' : 'determined', { look: { x: 1, y: -0.2 }, noIdle: true, hands: P.st === 'hold' ? { n: { x: 0.6, y: -1.4, d: -40, o: true, m: true }, f: { x: 0.8, y: 0.3, d: 90, o: true, m: false } } : throwing ? { n: { x: -1, y: -1.2, d: -150, o: true, m: true }, f: { x: 0.8, y: 0.3, d: 90, o: true, m: false } } : undefined });
        if (P.st === 'hold' || P.st === 'ready') { g.fillStyle = '#5ac8ff'; g.beginPath(); g.arc(112, fy - 78, 9, 0, 7); g.fill(); }
        if (P.st === 'fly') { const k = Math.min(1, P.ft / 0.9), bx = 112 + (X(P.land) - 112) * k, by = fy - 78 + (78 * k) - Math.sin(Math.PI * k) * (40 + P.land * 3); g.fillStyle = '#5ac8ff'; g.beginPath(); g.arc(bx, by, 9, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,0.6)'; g.beginPath(); g.arc(bx - 3, by - 3, 3, 0, 7); g.fill(); }
        if (P.last) { g.fillStyle = 'rgba(90,200,255,0.5)'; g.beginPath(); g.ellipse(X(P.last.d), fy, 22, 6, 0, 0, 7); g.fill(); }
        // power bar
        g.fillStyle = 'rgba(0,0,0,0.5)'; MGH.rr(g, 46, L.y0 + 10, 16, 80, 6); g.fill();
        const pw = P.st === 'hold' ? P.pw : P.st === 'ready' ? 0 : P.land / TMAX; g.fillStyle = MGH.grad(g, L.y0 + 10, L.y0 + 90, ['#ff6b6b', '#ffe680', '#7cf06a']); g.fillRect(48, L.y0 + 88 - 76 * pw, 12, 76 * pw);
        g.fillStyle = '#fff'; g.fillRect(42, L.y0 + 88 - 76 * (T.D / TMAX) - 1, 24, 3);
        g.fillStyle = m.players[i].color; MGH.rr(g, 8, L.y0 + 8, 30, 22, 6); g.fill(); MGH.text(g, String(i + 1), 23, L.y0 + 25, 16, '#fff', 'center', 'bold');
        MGH.text(g, `throw ${Math.min(TOSSN, T.r + 1)}/${TOSSN} · ${P.pts} pts`, 1180, L.y0 + 26, 15, '#fff', 'center', 'bold');
        if (P.st === 'ready') MGH.text(g, 'HOLD A', 190, L.y0 + 40, 14, '#fff', 'center', 'bold');
      }
      drawMsgsLane(g, T, i => X(T.p[i].last ? T.p[i].last.d : T.D));
    },
  };

  // ---- 5) jumping jacks: one jack per beat, the sergeant counts faster and faster; three misses and you're out
  const JACK_T = 40;
  const pushups = {
    name: 'Jumping Jacks', icon: '💪', how: 'Do a jumping jack each time the marker crosses the GREEN zone: press A (or B) right on the beat. The sergeant counts faster and faster. Three off-beat presses and you flop over, exhausted! Most jacks wins.',
    init(m, S, T) { T.p = [0, 1, 2, 3].map(() => ({ n: 0, miss: 0, up: 0, out: 0, lastRp: 0 })); },
    tempo(t) { return 0.95 + Math.min(1.35, t * 0.035); },
    update(m, S, T, dt, t) {
      tickMsgs(T, dt);
      T.p.forEach((P, i) => {
        P.up = Math.max(0, P.up - dt);
        if (P.out) return;
        const r = MGM.rhythm(m, i, P, dt, this.tempo(t));
        if (r >= 1) { P.n++; P.up = 0.34; if (P.n % 5 === 0) say(T, i, `${P.n}!`, '#ffe680'); }
        else if (r > 0) { P.miss++; say(T, i, P.miss >= 3 ? 'EXHAUSTED!' : `miss ${P.miss}/3`, '#ff6b6b'); if (P.miss >= 3) { P.out = t; Sfx.thud(); } else Sfx.bad(); }
      });
    },
    bot(m, S, T, i, dt) {
      const P = T.p[i]; m.vin[i].a = false; if (P.out) return;
      if ((P.rp || 0) < P.lastRp) { const tp = this.tempo(S.stageT); if (Math.random() < 0.02 + 0.06 * (tp - 1)) P.bTgt = R.pick([0.2, 0.8]); }
      P.lastRp = P.rp || 0;
      MGM.botRhythm(m, i, P);
    },
    done(m, S, T, t) { return t > JACK_T || T.p.every(P => P.out); },
    result(m, S, T) { return T.p.map(P => P.n); },
    fmt: v => `${Math.round(v)} jacks`,
    draw(m, S, T, g) {
      const t = S.phase === 'play' ? S.stageT : 0;
      camp(g, m.t, 120);
      for (let i = 0; i < 4; i++) {
        const P = T.p[i], ox = i * 320;
        colBack(g, i, m, '#a89868', '#7a6a48');
        for (let k = 0; k < 8; k++) { g.fillStyle = 'rgba(60,45,20,0.25)'; g.beginPath(); g.ellipse(ox + 30 + (k * 71) % 270, 560 + (k * 37) % 120, 26, 7, 0, 0, 7); g.fill(); }
        const j = P.out ? 0 : P.up > 0 ? Math.sin(P.up / 0.34 * Math.PI) : 0, cx = ox + 160, fy = 560;
        MGH.shadow(g, cx, fy + 4, 46 - j * 8, 0.35);
        if (P.out) {
          g.save(); g.translate(cx, fy - 20); g.rotate(1.45);
          hero(g, m, i, 0, 0, 40, 'out', { look: { x: 0, y: 0 }, noShadow: true, noIdle: true }); g.restore();
        } else {
          // arms and legs swing out on each jack
          const hands = { n: { x: -0.9 - j * 0.5, y: 0.3 - j * 2.0, d: 90 - j * 210, o: true, m: true }, f: { x: 0.9 + j * 0.5, y: 0.3 - j * 2.0, d: 90 + j * 210, o: true, m: false } };
          const feet = [{ x: -0.35 - j * 0.35, lift: 0, tip: 0 }, { x: 0.35 + j * 0.35, lift: 0, tip: 0 }];
          hero(g, m, i, cx, fy - 50 - j * 34, 40, j > 0.2 ? 'cheer' : P.miss >= 2 ? 'nervous' : 'determined', { look: { x: 0, y: 0.2 }, hands, feet, noShadow: true, noIdle: true });
        }
        MGH.text(g, `${P.n}`, cx, 270, 64, '#fff', 'center', 'bold');
        for (let k = 0; k < 3; k++) { g.fillStyle = k < P.miss ? '#ff6b6b' : 'rgba(255,255,255,0.25)'; g.beginPath(); g.arc(cx - 24 + k * 24, 300, 7, 0, 7); g.fill(); }
        if (!P.out) MGM.drawRhythm(g, cx, 340, P, 160);
        msgAt(g, T, i, cx, 230);
      }
      sarge(g, 1220, 680, 26, 'shout', { look: { x: -1, y: 0 } });
      MGH.text(g, `⏱ ${Math.max(0, JACK_T - t).toFixed(0)}`, 60, 150, 22, '#fff', 'center', 'bold');
    },
  };

  MGM.def({ id: 'drill', name: 'Military Drill', how: 'Boot camp! The sergeant puts you through five drills, one after another.', stages: [drill, crawl, range, toss, pushups] });
})();
