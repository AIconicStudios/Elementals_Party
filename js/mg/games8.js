'use strict';
// 62 ---------------------------------------------------------------- The Elemental Games (mini Olympics, five events)
(() => {
  const LT = 120, LH = 145; // lanes
  const ln = i => MGM.lane(i, LT, LH);
  const feet = (r) => r * 1.25; // Char.draw: feet sit 1.25r below the given y
  const say = (T, i, text, col = '#ffe680') => { T.msg = T.msg || []; T.msg[i] = { text, col, t: 0 }; };
  const drawMsgs = (g, T, xs) => { (T.msg || []).forEach((q, i) => { if (!q || q.t > 1.1) return; const L = ln(i); g.globalAlpha = 1 - q.t / 1.1; MGH.text(g, q.text, xs ? xs(i) : 640, L.y0 + 34 - q.t * 14, 24, q.col, 'center', 'bold'); g.globalAlpha = 1; }); };
  const tickMsgs = (T, dt) => (T.msg || []).forEach(q => { if (q) q.t += dt; });
  const trackLane = (g, i, m, col = '#c4553a') => {
    const L = ln(i);
    g.fillStyle = MGH.grad(g, L.y0, L.y1, [Char.shade(col, 0.12), col, Char.shade(col, -0.18)]); g.fillRect(0, L.y0, 1280, L.h);
    g.fillStyle = 'rgba(255,255,255,0.85)'; g.fillRect(0, L.y1 - 3, 1280, 3);
    g.fillStyle = m.players[i].color; g.globalAlpha = 0.85; MGH.rr(g, 8, L.y0 + 8, 30, 22, 6); g.fill(); g.globalAlpha = 1;
    MGH.text(g, String(i + 1), 23, L.y0 + 25, 16, '#fff', 'center', 'bold');
  };
  const runner = (g, m, i, x, floorY, r, mood, walk, o = {}) => { const p = m.players[i]; Char.draw(g, x, floorY - feet(r), r, p.el.id, p.color, Object.assign({ mood: MGH.persona(mood, p.el.id), seed: i * 1.7, look: { x: 1, y: 0 }, walk }, o)); };
  const countdown = (g, t, go) => {
    if (t > go + 0.7) return;
    const s = t < go * 0.45 ? 'On your marks…' : t < go ? 'Set…' : 'GO!';
    g.save(); g.globalAlpha = t > go ? 1 - (t - go) / 0.7 : 1; g.font = `bold ${s === 'GO!' ? 96 : 54}px Georgia`; g.textAlign = 'center'; g.lineWidth = 10; g.lineJoin = 'round'; g.strokeStyle = '#1a0f3a'; g.strokeText(s, 640, 96); g.fillStyle = s === 'GO!' ? '#7cf06a' : '#ffe680'; g.fillText(s, 640, 96); g.restore();
  };
  const dnf = v => v > -1e8;

  // ---- 1) 100m dash
  const dash = {
    name: '100m Dash', icon: '🏃', how: 'Wait for GO — a false start freezes you! Then press A and B ALTERNATELY as fast as you can. Pressing the same button twice barely helps.',
    init(m, S, T) { T.p = [0, 1, 2, 3].map(() => ({ d: 0, v: 0, fin: 0, pen: 0, lastKey: null, fs: false })); T.go = 2.4; T.rate = [0, 1, 2, 3].map(() => R.range(6.8, 8.6)); },
    update(m, S, T, dt, t) {
      tickMsgs(T, dt);
      T.p.forEach((P, i) => {
        if (P.fin) return;
        if (t < T.go) { if ((m.pressed(i, 'a') || m.pressed(i, 'b')) && !P.fs) { P.fs = true; P.pen = 1.1; say(T, i, 'FALSE START!', '#ff6b6b'); Sfx.bad(); } return; }
        if (P.pen > 0 && t > T.go) { P.pen -= dt; return; }
        const s = MGM.stride(m, i, P); if (s) P.v = Math.min(12.4, P.v + s * Math.max(0.1, 1.28 - P.v * 0.056));
        P.v *= Math.exp(-0.9 * dt); P.d += P.v * dt;
        if (P.d >= 100) { P.fin = t - T.go; say(T, i, `${P.fin.toFixed(2)}s`, '#ffffff'); MGH.burst(1190, ln(i).mid, ['#ffe680', m.players[i].color, '#fff'], 18, { speed: 220 }); Sfx.coin(); }
      });
    },
    bot(m, S, T, i, dt) { const t = S.stageT, v = m.vin[i]; v.a = v.b = false; if (t < T.go) { if (t > T.go - 0.05 && Math.random() < 0.004) v.a = true; return; } MGM.botStride(m, i, T.p[i], T.rate[i], dt); },
    done(m, S, T, t) { return T.p.every(P => P.fin) || t > T.go + 24; },
    result(m, S, T) { return T.p.map(P => P.fin ? -P.fin : -(60 + (100 - P.d))); },
    fmt: v => v > -60 ? `${(-v).toFixed(2)}s` : 'DNF',
    draw(m, S, T, g) {
      const t = S.phase === 'play' ? S.stageT : 0;
      MGM.stadium(g, m.t);
      for (let i = 0; i < 4; i++) {
        trackLane(g, i, m); const L = ln(i);
        g.fillStyle = 'rgba(255,255,255,0.5)'; for (let d = 10; d < 100; d += 10) { const x = 110 + d * 10.8; g.fillRect(x, L.y1 - 10, 2, 8); if (i === 3) MGH.text(g, `${d}`, x, 714, 11, '#fff'); }
        g.fillStyle = '#fff'; g.fillRect(108, L.y0, 4, L.h);
        for (let k = 0; k < 8; k++) { g.fillStyle = k % 2 ? '#fff' : '#222'; g.fillRect(1188, L.y0 + k * L.h / 8, 8, L.h / 8); }
        const P = T.p[i], x = 110 + Math.min(100, P.d) * 10.8;
        MGH.shadow(g, x, L.y1 - 6, 22, 0.25);
        runner(g, m, i, x, L.y1 - 8, 34, P.fin ? 'cheer' : P.pen > 0 && P.fs ? 'hurt' : P.v > 9 ? 'effort' : 'determined', P.v > 1 && !P.fin ? 1 : 0, { t: m.t * (0.5 + P.v * 0.08) });
        if (P.v > 6 && !P.fin) for (let k = 1; k < 4; k++) { g.fillStyle = `rgba(255,255,255,${0.2 - k * 0.05})`; g.fillRect(x - 30 - k * 18, L.y1 - 60 + k * 8, 14, 3); }
        MGH.text(g, `${P.v.toFixed(1)} m/s`, 80, L.y1 - 14, 13, '#fff', 'center');
      }
      drawMsgs(g, T, i => 110 + Math.min(100, T.p[i].d) * 10.8);
      if (S.phase === 'play') { countdown(g, t, T.go); if (t > T.go && t < T.go + 4) MGH.label(g, 'A  B  A  B  A  B !', 640, 150, 22, '#fff'); }
    },
  };

  // ---- 2) 60m hurdles
  const HURD = [10, 18, 26, 34, 42, 50];
  const hurdles = {
    name: '60m Hurdles', icon: '🚧', how: 'You run on your own — press A to JUMP each hurdle. Jump too early or too late and you crash through it. A perfect jump gives a burst of speed. Press B right at the line to DIP for a faster time.',
    init(m, S, T) { T.p = [0, 1, 2, 3].map(() => ({ d: 0, v: 0, air: 0, fin: 0, stum: 0, down: new Set(), dip: false, err: R.range(-0.25, 0.25) })); T.go = 2.4; },
    update(m, S, T, dt, t) {
      tickMsgs(T, dt);
      T.p.forEach((P, i) => {
        if (P.fin || t < T.go) return;
        P.stum -= dt;
        P.v += ((P.stum > 0 ? 3 : 9.6) - P.v) * (P.stum > 0 ? 5 : 1.6) * dt;
        if (m.pressed(i, 'a') && P.air <= 0) { P.air = 0.55; Sfx.tone(420, 0.06, 'triangle', 0.04, 240); }
        const pd = P.d; P.d += P.v * dt;
        const h = P.air > 0 ? Math.sin(Math.PI * (1 - P.air / 0.55)) : 0;
        if (P.air > 0) P.air -= dt;
        for (const hd of HURD) if (pd < hd && P.d >= hd && !P.down.has(hd)) {
          if (h > 0.45) { if (h > 0.86) { P.v += 0.9; say(T, i, 'PERFECT!', '#7cf06a'); } }
          else { P.down.add(hd); P.v *= 0.35; P.stum = 0.45; say(T, i, 'CRASH!', '#ff6b6b'); Sfx.thud(); MGH.burst(140 + hd * 17.5, ln(i).y1 - 20, ['#fff', '#ff6b6b'], 10, { speed: 160, grav: 500 }); }
        }
        if (m.pressed(i, 'b') && !P.dip && P.d > 56.5) { P.dip = true; say(T, i, 'DIP!', '#9fe0ff'); }
        if (P.d >= 60) { P.fin = t - T.go - (P.dip && P.d - P.v * dt > 56.5 ? 0.09 : 0); say(T, i, `${P.fin.toFixed(2)}s`, '#fff'); Sfx.coin(); }
      });
    },
    bot(m, S, T, i, dt) {
      const P = T.p[i], v = m.vin[i]; v.a = false; v.b = false; if (S.stageT < T.go || P.fin) return;
      const next = HURD.find(h => h > P.d + 0.05); const ideal = P.v * 0.275 + P.err;
      if (next !== undefined && P.air <= 0 && next - P.d <= ideal && next - P.d > ideal - 0.6) { v.a = true; P.err = R.range(-0.3, 0.3); }
      if (P.d > 57.2 && !P.dip && Math.random() < 0.3) v.b = true;
    },
    done(m, S, T, t) { return T.p.every(P => P.fin) || t > T.go + 20; },
    result(m, S, T) { return T.p.map(P => P.fin ? -P.fin : -(60 + (60 - P.d))); },
    fmt: v => v > -60 ? `${(-v).toFixed(2)}s` : 'DNF',
    draw(m, S, T, g) {
      const t = S.phase === 'play' ? S.stageT : 0;
      MGM.stadium(g, m.t, '#ff8a3d');
      const X = d => 140 + d * 17.5;
      for (let i = 0; i < 4; i++) {
        trackLane(g, i, m, '#3a7ad8'); const L = ln(i), P = T.p[i];
        g.fillStyle = '#fff'; g.fillRect(X(0) - 2, L.y0, 4, L.h);
        for (let k = 0; k < 8; k++) { g.fillStyle = k % 2 ? '#fff' : '#222'; g.fillRect(X(60) - 4, L.y0 + k * L.h / 8, 8, L.h / 8); }
        for (const hd of HURD) {
          const x = X(hd), y = L.y1 - 8, dn = P.down.has(hd);
          g.save(); g.translate(x, y); if (dn) g.rotate(1.2);
          g.fillStyle = '#ddd'; g.fillRect(-14, -2, 4, -44 + 2); g.fillRect(10, -2, 4, -42); g.fillStyle = '#fff'; g.fillRect(-16, -48, 32, 10); g.fillStyle = '#e8432a'; g.fillRect(-16, -48, 10, 10); g.fillRect(6, -48, 10, 10);
          g.restore();
        }
        const h = P.air > 0 ? Math.sin(Math.PI * (1 - P.air / 0.55)) : 0, x = X(Math.min(60, P.d));
        MGH.shadow(g, x, L.y1 - 6, 22 * (1 - h * 0.4), 0.25);
        runner(g, m, i, x, L.y1 - 8 - h * 64, 32, P.fin ? 'cheer' : P.stum > 0 ? 'dizzy' : h > 0 ? 'cheer' : 'determined', P.air <= 0 && P.v > 1 && !P.fin ? 1 : 0, { t: m.t * (0.5 + P.v * 0.08), feet: h > 0 ? [{ x: -0.35, lift: 0.2, tip: 0.2 }, { x: 0.4, lift: 0.35, tip: -0.3 }] : undefined });
      }
      drawMsgs(g, T, i => X(Math.min(60, T.p[i].d)));
      if (S.phase === 'play') countdown(g, t, T.go);
    },
  };

  // ---- 3) long jump (two attempts)
  const RUNW = 30, BX = 640, RPX = (BX - 70) / RUNW, PPX = 62; // runway & pit scale
  const longjump = {
    name: 'Long Jump', icon: '🦘', how: 'Press A and B ALTERNATELY to sprint down the runway. Hold UP to swing the angle meter and let go to jump — before the white board, or it’s a foul! About 40° is ideal. Two attempts, best one counts.',
    init(m, S, T) { T.p = [0, 1, 2, 3].map(() => ({ att: 0, st: 'ready', tt: 0, d: 0, v: 0, ang: 10, ad: 1, best: 0, marks: [], lastKey: null, jx: 0, dist: 0, foul: false, aimAt: R.range(27.5, 29.4), angT: R.range(34, 44), rate: R.range(7, 8.6) })); },
    update(m, S, T, dt, t) {
      tickMsgs(T, dt);
      T.p.forEach((P, i) => {
        P.tt += dt;
        if (P.st === 'ready') { if (P.tt > 0.9) { P.st = 'run'; P.tt = 0; P.d = 0; P.v = 0; } return; }
        if (P.st === 'run' || P.st === 'aim') {
          const s = MGM.stride(m, i, P); if (s && P.st === 'run') P.v = Math.min(11.6, P.v + s * Math.max(0.1, 1.3 - P.v * 0.06));
          P.v *= Math.exp(-0.75 * dt); P.d += P.v * dt;
          const up = m.axis(i).y < -0.5 || m.held(i, 'up');
          if (P.st === 'run' && up && P.d > 4) { P.st = 'aim'; P.tt = 0; P.ang = 10; P.ad = 1; }
          if (P.st === 'aim') { P.ang += P.ad * 105 * dt; if (P.ang > 70) { P.ang = 70; P.ad = -1; } if (P.ang < 10) { P.ang = 10; P.ad = 1; } if (!up || P.tt > 1.1) this.takeoff(m, T, P, i); }
          if (P.st === 'run' && P.d > RUNW + 1.5) { P.foul = true; P.dist = 0; P.st = 'land'; P.tt = 0; say(T, i, 'FOUL — ran past!', '#ff6b6b'); Sfx.bad(); }
          return;
        }
        if (P.st === 'air') { if (P.tt > 0.95) { P.st = 'land'; P.tt = 0; if (!P.foul) { P.best = Math.max(P.best, P.dist); P.marks.push(P.dist); say(T, i, `${P.dist.toFixed(2)} m`, '#fff'); MGH.burst(BX + 20 + P.dist * PPX, ln(i).y1 - 14, ['#e8d4a0', '#c9b48a'], 14, { speed: 140, grav: 500 }); Sfx.thud(); } } return; }
        if (P.st === 'land') { if (P.tt > 1.4) { P.att++; if (P.att < 2) { P.st = 'ready'; P.tt = 0; P.foul = false; } else P.st = 'done'; } }
      });
    },
    takeoff(m, T, P, i) {
      P.st = 'air'; P.tt = 0; P.jx = P.d; const th = P.ang * Math.PI / 180;
      P.foul = P.d > RUNW;
      P.dist = P.foul ? 0 : Math.max(0.5, (P.v * P.v * Math.sin(2 * th) / 9.81) * 0.95 - (RUNW - P.d));
      if (P.foul) { say(T, i, 'FOUL!', '#ff6b6b'); Sfx.bad(); } else Sfx.whoosh(true);
    },
    bot(m, S, T, i, dt) {
      const P = T.p[i], v = m.vin[i]; v.a = v.b = false;
      if (P.st === 'run' || P.st === 'aim') {
        MGM.botStride(m, i, P, P.rate, dt);
        const hold = P.st === 'aim' ? !(P.ang >= P.angT - 3 && P.ad > 0) : P.d >= P.aimAt - P.v * 0.3;
        v.ay = hold ? -1 : 0;
        if (P.st === 'aim' && !hold) { P.aimAt = R.range(27.6, 29.5); P.angT = R.range(33, 46); }
      } else v.ay = 0;
    },
    done(m, S, T, t) { return T.p.every(P => P.st === 'done') || t > 60; },
    result(m, S, T) { return T.p.map(P => P.best); },
    fmt: v => v > 0 ? `${v.toFixed(2)} m` : 'no mark',
    draw(m, S, T, g) {
      MGM.stadium(g, m.t, '#7ccf4a');
      for (let i = 0; i < 4; i++) {
        const L = ln(i), P = T.p[i];
        trackLane(g, i, m, '#c4553a');
        // sand pit with distance marks
        g.fillStyle = MGH.grad(g, L.y0 + 30, L.y1, ['#f4e2b0', '#d8c088']); g.fillRect(BX + 20, L.y0 + 40, 1280 - BX - 20, L.h - 46);
        for (let d = 1; d <= 9; d++) { const x = BX + 20 + d * PPX; g.fillStyle = 'rgba(120,90,40,0.5)'; g.fillRect(x, L.y1 - 14, 2, 8); MGH.text(g, `${d}m`, x, L.y1 - 18, 11, '#7a5a2a'); }
        g.fillStyle = '#fff'; g.fillRect(BX, L.y0 + 20, 16, L.h - 26); g.fillStyle = '#e8432a'; g.fillRect(BX + 16, L.y0 + 20, 4, L.h - 26);
        P.marks.forEach((d, k) => { const x = BX + 20 + d * PPX; g.fillStyle = m.players[i].color; g.fillRect(x - 1, L.y1 - 52, 3, 44); g.beginPath(); g.moveTo(x + 2, L.y1 - 52); g.lineTo(x + 18, L.y1 - 46); g.lineTo(x + 2, L.y1 - 40); g.fill(); });
        let x, y = L.y1 - 8, mood = 'determined', walk = 0, fp;
        if (P.st === 'air') { const k = Math.min(1, P.tt / 0.95); x = BX + (P.foul ? 0 : 20) + (P.foul ? 40 : P.dist * PPX) * k + (P.jx - RUNW) * RPX; y -= Math.sin(Math.PI * k) * (P.foul ? 20 : 30 + P.dist * 7); mood = 'cheer'; fp = [{ x: -0.5, lift: 0.1, tip: 0.3 }, { x: -0.3, lift: 0.25, tip: 0.2 }]; }
        else if (P.st === 'land' || P.st === 'done') { x = P.foul ? BX + 40 : BX + 20 + (P.marks[P.marks.length - 1] || 0) * PPX; mood = P.foul ? 'hurt' : 'cheer'; }
        else { x = 70 + Math.min(RUNW + 1.5, P.d) * RPX; walk = P.v > 1 ? 1 : 0; mood = P.st === 'aim' ? 'effort' : 'determined'; }
        if (P.st !== 'done' || P.att >= 2) { MGH.shadow(g, x, L.y1 - 6, 20, 0.25); runner(g, m, i, x, y, 30, mood, walk, { t: m.t * (0.5 + P.v * 0.08), feet: fp }); }
        // angle meter
        if (P.st === 'aim') { const cx = x + 40, cy = L.y1 - 70; g.strokeStyle = 'rgba(255,255,255,0.4)'; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, 40, -Math.PI / 2, 0); g.stroke(); g.strokeStyle = '#7cf06a'; g.lineWidth = 6; g.beginPath(); g.arc(cx, cy, 40, -45 * Math.PI / 180, -35 * Math.PI / 180); g.stroke(); const a = -P.ang * Math.PI / 180; g.strokeStyle = '#ffe680'; g.lineWidth = 4; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * 46, cy + Math.sin(a) * 46); g.stroke(); MGH.text(g, `${Math.round(P.ang)}°`, cx + 58, cy - 8, 15, '#fff'); }
        MGH.text(g, `attempt ${Math.min(2, P.att + 1)}/2 · best ${P.best ? P.best.toFixed(2) + ' m' : '—'}`, 260, L.y0 + 24, 14, '#fff');
      }
      drawMsgs(g, T, i => 900);
    },
  };

  // ---- 4) javelin (two throws, wind)
  const javelin = {
    name: 'Javelin', icon: '🎯', how: 'HOLD A to build power and let go at the top of the meter. Then press A again to lock the throwing angle. Read the wind: a tailwind wants a higher throw, a headwind a flatter one. Two throws, best counts.',
    init(m, S, T) { T.p = [0, 1, 2, 3].map(() => this.newThrow({ att: 0, best: 0, marks: [] })); },
    newThrow(P) { return Object.assign(P, { st: 'ready', tt: 0, pw: 0, pd: 1, ang: 10, ad: 1, wind: Math.round(R.range(-3, 3) * 10) / 10, dist: 0, holdT: R.range(0.78, 0.98), angT: 0 }); },
    update(m, S, T, dt, t) {
      tickMsgs(T, dt);
      T.p.forEach((P, i) => {
        P.tt += dt;
        if (P.st === 'ready') { if (P.tt > 1.1) { P.st = 'wait'; P.tt = 0; } return; }
        if (P.st === 'wait') { if (m.pressed(i, 'a') || m.held(i, 'a')) { P.st = 'charge'; P.tt = 0; P.pw = 0; P.pd = 1; } if (P.tt > 4) { P.st = 'charge'; P.tt = 0; } return; }
        if (P.st === 'charge') { P.pw += P.pd * dt / 0.9; if (P.pw > 1) { P.pw = 1; P.pd = -1; } if (P.pw < 0) { P.pw = 0; P.pd = 1; } if (!m.held(i, 'a') || P.tt > 3) { P.st = 'angle'; P.tt = 0; P.ang = 10; P.ad = 1; } return; }
        if (P.st === 'angle') {
          P.ang += P.ad * 80 * dt; if (P.ang > 70) { P.ang = 70; P.ad = -1; } if (P.ang < 10) { P.ang = 10; P.ad = 1; }
          if (m.pressed(i, 'a') || P.tt > 3.5) {
            const v = 14 + 16 * P.pw, th = P.ang * Math.PI / 180, best = 42 + P.wind * 2.2;
            P.dist = Math.max(4, (v * v * Math.sin(2 * th) / 9.81) * (1 + P.wind * 0.012) * (1 - Math.abs(P.ang - best) * 0.004));
            P.st = 'fly'; P.tt = 0; Sfx.whoosh(true);
          }
          return;
        }
        if (P.st === 'fly') { if (P.tt > 1.4) { P.st = 'land'; P.tt = 0; P.best = Math.max(P.best, P.dist); P.marks.push(P.dist); say(T, i, `${P.dist.toFixed(1)} m`, '#fff'); Sfx.thud(); } return; }
        if (P.st === 'land' && P.tt > 1.3) { P.att++; if (P.att < 2) this.newThrow(P); else P.st = 'done'; }
      });
    },
    bot(m, S, T, i, dt) {
      const P = T.p[i], v = m.vin[i]; v.a = false;
      if (P.st === 'wait') v.a = true;
      if (P.st === 'charge') v.a = P.tt < P.holdT;
      if (P.st === 'angle') { if (!P.angT) P.angT = 42 + P.wind * 2.2 + R.range(-7, 7); v.a = Math.abs(P.ang - P.angT) < 2.5 && !m.prev[i].a; }
    },
    done(m, S, T, t) { return T.p.every(P => P.st === 'done') || t > 60; },
    result(m, S, T) { return T.p.map(P => P.best); },
    fmt: v => `${v.toFixed(1)} m`,
    draw(m, S, T, g) {
      MGM.stadium(g, m.t, '#ffd34d');
      const X = d => 150 + d * 10.6;
      for (let i = 0; i < 4; i++) {
        const L = ln(i), P = T.p[i];
        g.fillStyle = MGH.grad(g, L.y0, L.y1, ['#7fd06a', '#5fb04a', '#4a9038']); g.fillRect(0, L.y0, 1280, L.h);
        for (let k = 0; k < 12; k++) { g.fillStyle = k % 2 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'; g.fillRect(k * 110, L.y0, 110, L.h); }
        g.fillStyle = 'rgba(255,255,255,0.85)'; g.fillRect(0, L.y1 - 3, 1280, 3); g.fillRect(X(0) - 2, L.y0, 4, L.h);
        for (let d = 10; d <= 100; d += 10) { g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(X(d), L.y1 - 12, 2, 10); MGH.text(g, `${d}`, X(d), L.y1 - 16, 11, '#fff'); }
        g.fillStyle = m.players[i].color; MGH.rr(g, 8, L.y0 + 8, 30, 22, 6); g.fill(); MGH.text(g, String(i + 1), 23, L.y0 + 25, 16, '#fff', 'center', 'bold');
        // wind sock
        const wx = 1220, wy = L.y0 + 30; g.strokeStyle = '#ddd'; g.lineWidth = 3; g.beginPath(); g.moveTo(wx, wy); g.lineTo(wx, wy + 40); g.stroke();
        const wl = 10 + Math.abs(P.wind) * 9, wd = Math.sign(P.wind) || 1; g.fillStyle = '#ff7a3a'; g.beginPath(); g.moveTo(wx, wy); g.lineTo(wx + wd * wl, wy + 4 + Math.sin(m.t * 6) * 2); g.lineTo(wx + wd * wl, wy + 12); g.lineTo(wx, wy + 16); g.fill();
        MGH.text(g, `${P.wind > 0 ? 'tail' : P.wind < 0 ? 'head' : 'no'} wind ${Math.abs(P.wind).toFixed(1)}`, wx - 10, wy + 58, 12, '#fff', 'right');
        P.marks.forEach(d => { const x = X(d); g.fillStyle = m.players[i].color; g.fillRect(x - 1, L.y1 - 46, 3, 40); g.beginPath(); g.moveTo(x + 2, L.y1 - 46); g.lineTo(x + 16, L.y1 - 40); g.lineTo(x + 2, L.y1 - 34); g.fill(); });
        const throwing = P.st === 'charge' || P.st === 'angle', ox = X(0) - 30;
        runner(g, m, i, ox, L.y1 - 8, 30, throwing ? 'effort' : P.st === 'land' ? 'cheer' : 'determined', P.st === 'ready' ? 1 : 0, { hands: throwing ? { n: { x: 0.5, y: -0.9, d: -80, o: false, m: false }, f: { x: -0.9, y: -0.2, d: 180, o: true, m: true } } : undefined });
        // the javelin
        let jx, jy, ja;
        if (P.st === 'fly' || P.st === 'land') { const k = P.st === 'land' ? 1 : Math.min(1, P.tt / 1.4); jx = ox + 20 + (X(P.dist) - ox - 20) * k; jy = L.y1 - 50 - Math.sin(Math.PI * k) * Math.min(L.h - 70, P.dist * 0.9) + k * 40; ja = (-P.ang * (1 - 2 * k)) * Math.PI / 180; }
        else if (throwing) { jx = ox + 10; jy = L.y1 - 74; ja = -(P.st === 'angle' ? P.ang : 20) * Math.PI / 180; }
        if (jx !== undefined && P.st !== 'done' || P.st === 'land') { g.save(); g.translate(jx, jy); g.rotate(ja); g.strokeStyle = '#e8e0d0'; g.lineWidth = 4; g.beginPath(); g.moveTo(-40, 0); g.lineTo(40, 0); g.stroke(); g.fillStyle = '#9aa0ad'; g.beginPath(); g.moveTo(40, -3); g.lineTo(52, 0); g.lineTo(40, 3); g.fill(); g.fillStyle = m.players[i].color; g.fillRect(-8, -3, 14, 6); g.restore(); }
        // meters
        if (P.st === 'charge') { const bx = ox + 46, by = L.y0 + 22; g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(bx, by, 16, 90); const pg = g.createLinearGradient(0, by + 90, 0, by); pg.addColorStop(0, '#7cf06a'); pg.addColorStop(0.7, '#ffe680'); pg.addColorStop(1, '#ff4d4d'); g.fillStyle = pg; g.fillRect(bx, by + 90 * (1 - P.pw), 16, 90 * P.pw); MGH.text(g, 'POWER', bx + 8, by + 106, 11, '#fff'); }
        if (P.st === 'angle') { const cx = ox + 60, cy = L.y1 - 40; g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, 44, -Math.PI / 2, 0); g.stroke(); const a = -P.ang * Math.PI / 180; g.strokeStyle = '#ffe680'; g.lineWidth = 4; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * 50, cy + Math.sin(a) * 50); g.stroke(); MGH.text(g, `${Math.round(P.ang)}°`, cx + 62, cy - 10, 15, '#fff'); }
        if (P.st === 'wait') MGH.text(g, 'hold A!', ox + 70, L.y0 + 40, 16, '#ffe680', 'left', 'bold');
        MGH.text(g, `throw ${Math.min(2, P.att + 1)}/2 · best ${P.best ? P.best.toFixed(1) + ' m' : '—'}`, 640, L.y0 + 22, 14, '#fff');
      }
      drawMsgs(g, T, i => 900);
    },
  };

  // ---- 5) 50m swim
  const BEAT = 0.5;
  const swim = {
    name: '50m Swim', icon: '🏊', how: 'Stroke on the beat: press A and B ALTERNATELY when the shrinking ring meets the circle. Perfect timing = big speed, off-beat = a splash. Watch your air — press UP to take a breath before it runs out!',
    init(m, S, T) { T.p = [0, 1, 2, 3].map(() => ({ d: 0, v: 0, ph: 0, lastKey: null, air: 1, breathe: 0, fin: 0, combo: 0, stroke: 0, err: R.range(0.03, 0.1) })); T.go = 2.4; },
    update(m, S, T, dt, t) {
      tickMsgs(T, dt);
      T.p.forEach((P, i) => {
        if (P.fin || t < T.go) return;
        P.ph = (P.ph + dt / BEAT) % 1; P.stroke = Math.max(0, P.stroke - dt);
        if (P.breathe > 0) { P.breathe -= dt; P.v *= Math.exp(-0.8 * dt); }
        else {
          if (m.pressed(i, 'up') || (m.axis(i).y < -0.6 && !(P.upPrev))) { P.breathe = 0.45; P.air = 1; say(T, i, 'breath', '#9fe0ff'); }
          const a = m.pressed(i, 'a'), b = m.pressed(i, 'b');
          if (a || b) {
            const k = a ? 'a' : 'b', alt = P.lastKey !== k; P.lastKey = k; P.stroke = 0.3;
            const off = Math.min(P.ph, 1 - P.ph) * BEAT;
            if (off < 0.07) { P.v += alt ? 0.75 : 0.3; P.combo++; if (P.combo % 4 === 0) say(T, i, `PERFECT x${P.combo}`, '#7cf06a'); }
            else if (off < 0.14) { P.v += alt ? 0.45 : 0.2; P.combo = 0; }
            else { P.v *= 0.65; P.combo = 0; say(T, i, 'splash!', '#ff9a6b'); }
          }
        }
        P.upPrev = m.axis(i).y < -0.6;
        P.air = Math.max(0, P.air - dt / 7);
        P.v = Math.min(4.6, P.v) * Math.exp(-(P.air <= 0 ? 2.2 : 0.55) * dt);
        P.d += P.v * dt;
        if (P.d >= 50) { P.fin = t - T.go; say(T, i, `${P.fin.toFixed(2)}s`, '#fff'); Sfx.coin(); MGH.burst(1200, ln(i).mid, ['#bfe6ff', '#fff'], 18, { speed: 200 }); }
      });
    },
    bot(m, S, T, i, dt) {
      const P = T.p[i], v = m.vin[i]; v.a = v.b = false; v.ay = 0;
      if (S.stageT < T.go || P.fin || P.breathe > 0) return;
      if (P.air < 0.22 && !m.prev[i].up) { v.ay = -1; return; }
      const off = Math.min(P.ph, 1 - P.ph) * BEAT;
      if (off < P.err && P.stroke <= 0 && P.ph > 0.9 - P.err) { const k = P.lastKey === 'a' ? 'b' : 'a'; v[k] = !m.prev[i][k]; P.err = R.range(0.03, 0.11); }
    },
    done(m, S, T, t) { return T.p.every(P => P.fin) || t > T.go + 30; },
    result(m, S, T) { return T.p.map(P => P.fin ? -P.fin : -(60 + (50 - P.d))); },
    fmt: v => v > -60 ? `${(-v).toFixed(2)}s` : 'DNF',
    draw(m, S, T, g) {
      const t = S.phase === 'play' ? S.stageT : 0;
      // indoor aquatic hall
      g.fillStyle = MGH.grad(g, 40, 120, ['#2a3a5a', '#3a5a7a']); g.fillRect(0, 40, 1280, 80); MGH.crowd(g, m.t, 112, 34);
      for (let k = 0; k < 8; k++) { g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(60 + k * 160, 44, 80, 10); }
      const X = d => 110 + d * 21.6;
      for (let i = 0; i < 4; i++) {
        const L = ln(i), P = T.p[i];
        g.fillStyle = MGH.grad(g, L.y0, L.y1, ['#4fc0f0', '#2a90d8', '#1a6ab8']); g.fillRect(0, L.y0, 1280, L.h);
        for (let k = 0; k < 10; k++) { g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 2; g.beginPath(); const yy = L.y0 + 20 + k * 13; for (let x = 0; x <= 1280; x += 40) g.lineTo(x, yy + Math.sin(x * 0.03 + m.t * 2 + k) * 3); g.stroke(); }
        g.fillStyle = '#1a4a8a'; g.fillRect(0, L.y0 + L.h * 0.5 - 1, 1280, 2);
        // lane rope
        for (let x = 0; x < 1280; x += 16) { g.fillStyle = (x / 16) % 2 ? '#ff4d4d' : '#ffffff'; g.beginPath(); g.arc(x + 8, L.y1 - 2, 5, 0, 7); g.fill(); }
        g.fillStyle = '#e8eef4'; g.fillRect(96, L.y0, 14, L.h); g.fillRect(1190, L.y0, 14, L.h);
        g.fillStyle = m.players[i].color; MGH.rr(g, 8, L.y0 + 8, 30, 22, 6); g.fill(); MGH.text(g, String(i + 1), 23, L.y0 + 25, 16, '#fff', 'center', 'bold');
        const x = X(Math.min(50, P.d)), y = L.mid + 8;
        // swimmer: head and stroking gloves above the water, body below
        const sw = P.stroke > 0 ? Math.sin((0.3 - P.stroke) / 0.3 * Math.PI) : 0, nearUp = P.lastKey === 'a';
        const hands = { n: { x: -1.1 - sw * 0.4, y: nearUp ? -0.9 * sw - 0.1 : 0.4, d: nearUp ? -150 : 160, o: true, m: true }, f: { x: 0.9, y: !nearUp ? -0.9 * sw : 0.4, d: -30, o: true, m: false } };
        g.save(); g.translate(x, y); g.rotate(0.15);
        Char.draw(g, 0, -10, 26, m.players[i].el.id, m.players[i].color, { mood: P.air <= 0 ? 'scared' : P.breathe > 0 ? 'happy' : P.fin ? 'cheer' : 'effort', seed: i, look: { x: 1, y: 0 }, noFeet: true, hands, noShadow: true });
        g.restore();
        g.fillStyle = 'rgba(40,140,230,0.55)'; g.fillRect(x - 50, y + 4, 100, 30);
        if (P.v > 1) for (let k = 0; k < 3; k++) { g.fillStyle = `rgba(255,255,255,${0.5 - k * 0.15})`; g.beginPath(); g.ellipse(x - 40 - k * 22, y + 6, 10 - k * 2, 4, 0, 0, 7); g.fill(); }
        // beat ring and air meter
        const rx = 60, ry = L.mid; g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 3; g.beginPath(); g.arc(rx, ry + 10, 14, 0, 7); g.stroke();
        if (S.phase === 'play' && t > T.go && !P.fin) { g.strokeStyle = m.players[i].color; g.lineWidth = 4; g.beginPath(); g.arc(rx, ry + 10, 14 + (1 - P.ph) * 30, 0, 7); g.stroke(); }
        g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(rx - 24, L.y1 - 18, 48, 8); g.fillStyle = P.air < 0.25 ? '#ff6b6b' : '#9fe0ff'; g.fillRect(rx - 24, L.y1 - 18, 48 * P.air, 8); MGH.text(g, 'air', rx, L.y1 - 22, 10, '#fff');
      }
      drawMsgs(g, T, i => X(Math.min(50, T.p[i].d)));
      if (S.phase === 'play') countdown(g, t, T.go);
    },
  };

  MGM.def({ id: 'olympics', name: 'The Elemental Games', how: 'A mini Olympics in five events, one after another — each event awards medal points.', stages: [dash, hurdles, longjump, javelin, swim] });
})();
