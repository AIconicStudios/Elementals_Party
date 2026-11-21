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
    name: '100m Dash', icon: '🏃', how: 'Wait for GO — a false start freezes you! Then run by pressing A and B one after the other, like left and right feet. A STEADY rhythm is what makes you fast — slow and even beats frantic mashing. Pressing the same button twice makes you stumble.',
    init(m, S, T) { T.p = [0, 1, 2, 3].map(() => ({ d: 0, v: 0, fin: 0, pen: 0, lastKey: null, fs: false })); T.go = 2.4; T.rate = [0, 1, 2, 3].map(() => R.range(6.8, 8.6)); },
    update(m, S, T, dt, t) {
      tickMsgs(T, dt);
      T.p.forEach((P, i) => {
        if (P.fin) return;
        if (t < T.go) { if ((m.pressed(i, 'a') || m.pressed(i, 'b')) && !P.fs) { P.fs = true; P.pen = 1.1; say(T, i, 'FALSE START!', '#ff6b6b'); Sfx.bad(); } return; }
        if (P.pen > 0 && t > T.go) { P.pen -= dt; return; }
        const q = MGM.cadence(m, i, P, dt); P.v += (12 * q - P.v) * (q * 12 > P.v ? 1.6 : 2.4) * dt; P.d += P.v * dt;
        if (P.d >= 100) { P.fin = t - T.go; say(T, i, `${P.fin.toFixed(2)}s`, '#ffffff'); MGH.burst(1190, ln(i).mid, ['#ffe680', m.players[i].color, '#fff'], 18, { speed: 220 }); Sfx.coin(); }
      });
    },
    bot(m, S, T, i, dt) { const t = S.stageT, v = m.vin[i]; v.a = v.b = false; if (t < T.go) { if (t > T.go - 0.05 && Math.random() < 0.004) v.a = true; return; } if (!T.p[i].fin) MGM.botCadence(m, i, T.p[i], dt); },
    done(m, S, T, t) { return T.p.every(P => P.fin) || t > T.go + 60; },
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
        MGH.text(g, `${P.v.toFixed(1)} m/s`, 56, L.y1 - 14, 13, '#fff', 'center'); if (!P.fin) MGM.drawCadence(g, 210, L.y0 + 30, P, 92);
      }
      drawMsgs(g, T, i => 110 + Math.min(100, T.p[i].d) * 10.8);
      if (S.phase === 'play') { countdown(g, t, T.go); if (t > T.go && t < T.go + 4) MGH.label(g, 'A, B, A, B… keep it STEADY — rhythm beats speed!', 640, 150, 22, '#fff'); }
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
          if (h > 0.55) { P.v += 1.8 * (h - 0.55) / 0.45; if (h > 0.9) say(T, i, 'PERFECT!', '#7cf06a'); }
          else { P.down.add(hd); P.v *= 0.35; P.stum = 0.45; say(T, i, 'CRASH!', '#ff6b6b'); Sfx.thud(); MGH.burst(140 + hd * 17.5, ln(i).y1 - 20, ['#fff', '#ff6b6b'], 10, { speed: 160, grav: 500 }); }
        }
        if (m.pressed(i, 'b') && !P.dip && P.d > 56.5) { P.dip = true; say(T, i, 'DIP!', '#9fe0ff'); }
        if (P.d >= 60) { P.fin = t - T.go - (P.dip && P.d - P.v * dt > 56.5 ? 0.09 : 0); say(T, i, `${P.fin.toFixed(2)}s`, '#fff'); Sfx.coin(); }
      });
    },
    bot(m, S, T, i, dt) {
      const P = T.p[i], v = m.vin[i]; v.a = false; v.b = false; if (S.stageT < T.go || P.fin) return;
      const next = HURD.find(h => h > P.d + 0.05); const ideal = P.v * 0.275 + P.err;
      if (next !== undefined && P.air <= 0 && next - P.d <= ideal && next - P.d > ideal - 0.6) { v.a = true; P.err = R.range(-0.35, 0.35) * (Math.random() < 0.2 ? 2.6 : 1); }
      if (P.d > 57.2 && !P.dip && Math.random() < 0.3) v.b = true;
    },
    done(m, S, T, t) { return T.p.every(P => P.fin) || t > T.go + 60; },
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
  // ---- 3) triple jump (two attempts): hold A to sprint, let go to take off, then three slow-motion angle presses
  const RUNW = 30, BX = 430, RPX = (BX - 70) / RUNW, PPX = 50, PIT = 6; // runway, board, metres → px, pit starts 6 m past the board
  const PH = ['HOP', 'STEP', 'JUMP'], PHM = [4.6, 3.8, 5.6], AIDEAL = 42;
  const angQ = a => Math.max(0, 1 - Math.abs(a - AIDEAL) / 26);
  const longjump = {
    name: 'Triple Jump', icon: '🦘', how: 'HOLD A to sprint down the runway and LET GO to take off — as close to the white board as you dare (past it is a foul!). Time slows down: an arrow swings up and down — press A when it is in the GREEN for each of your three bounds: hop, step, jump. Two attempts, best counts.',
    init(m, S, T) { T.p = [0, 1, 2, 3].map(() => ({ att: 0, st: 'ready', tt: 0, d: 0, v: 0, ang: 10, ad: 1, ph: 0, q: [], best: 0, marks: [], jx: 0, dist: 0, foul: false, held: false, aimAt: R.range(28.2, 29.8), err: R.range(3, 11) })); },
    update(m, S, T, dt, t) {
      tickMsgs(T, dt);
      T.p.forEach((P, i) => {
        P.tt += dt;
        if (P.st === 'ready') { P.d = 0; P.v = 0; if (P.tt > 0.9 && m.held(i, 'a')) { P.st = 'run'; P.tt = 0; P.held = true; } else if (P.tt > 6) { P.st = 'run'; P.tt = 0; } return; }
        if (P.st === 'run') {
          const h = m.held(i, 'a');
          if (h) P.v = Math.min(10.5, P.v + (6.2 - P.v * 0.32) * dt); else P.v *= Math.exp(-2 * dt);
          P.d += P.v * dt;
          if (!h && P.d > 6 && P.v > 3) { this.takeoff(m, T, P, i); return; }
          if (P.d > RUNW + 2.5) { P.foul = true; P.dist = 0; P.st = 'land'; P.tt = 0; say(T, i, 'FOUL — ran past!', '#ff6b6b'); Sfx.bad(); }
          return;
        }
        if (P.st === 'bound') {
          // slow motion: the arrow sweeps at a gentle pace
          P.ang += P.ad * 62 * dt; if (P.ang > 72) { P.ang = 72; P.ad = -1; } if (P.ang < 8) { P.ang = 8; P.ad = 1; }
          if (m.pressed(i, 'a') || P.tt > 3) {
            const q = angQ(P.ang); P.q.push(q);
            say(T, i, `${PH[P.ph]} ${q > 0.85 ? 'PERFECT' : q > 0.6 ? 'good' : 'weak'}`, q > 0.85 ? '#ffe680' : q > 0.6 ? '#9fffa0' : '#ff9a6b');
            Sfx.tone(q > 0.85 ? 1180 : q > 0.6 ? 880 : 360, 0.06, 'triangle', 0.04);
            P.ph++; P.tt = 0; P.ang = R.range(8, 20); P.ad = 1;
            if (P.ph >= 3) this.finish(m, T, P, i);
          }
          return;
        }
        if (P.st === 'air') { if (P.tt > 1.1) { P.st = 'land'; P.tt = 0; if (!P.foul) { P.best = Math.max(P.best, P.dist); P.marks.push(P.dist); say(T, i, `${P.dist.toFixed(2)} m`, '#fff'); MGH.burst(BX + P.dist * PPX, ln(i).y1 - 14, ['#f4e2b0', '#d8c088'], 14, { speed: 160, grav: 400 }); Sfx.thud(); } } return; }
        if (P.st === 'land') { if (P.tt > 1.4) { P.att++; if (P.att < 2) { P.st = 'ready'; P.tt = 0; P.foul = false; P.ph = 0; P.q = []; } else P.st = 'done'; } }
      });
    },
    takeoff(m, T, P, i) {
      P.jx = P.d; P.foul = P.d > RUNW;
      if (P.foul) { P.st = 'land'; P.tt = 0; P.dist = 0; say(T, i, 'FOUL — over the board!', '#ff6b6b'); Sfx.bad(); return; }
      P.st = 'bound'; P.tt = 0; P.ph = 0; P.q = []; P.ang = R.range(8, 20); P.ad = 1; Sfx.whoosh(true);
    },
    finish(m, T, P, i) {
      const sp = P.v / 10.5, lost = RUNW - P.jx;
      P.dist = Math.max(0.5, PHM.reduce((s, d, k) => s + d * sp * (0.45 + 0.55 * P.q[k]), 0) - lost);
      P.st = 'air'; P.tt = 0;
    },
    bot(m, S, T, i, dt) {
      const P = T.p[i], v = m.vin[i]; v.a = false;
      if (P.st === 'ready') { v.a = P.tt > R.range(0.95, 1.6); return; }
      if (P.st === 'run') { v.a = P.d < P.aimAt - P.v * 0.05; if (!v.a) P.aimAt = R.range(28.2, 30.05); return; }
      if (P.st === 'bound') { if (Math.abs(P.ang - AIDEAL) < P.err && P.tt > 0.4 && !m.prev[i].a) { v.a = true; P.err = R.range(2, 14); } }
    },
    done(m, S, T, t) { return T.p.every(P => P.st === 'done') || t > 180; },
    result(m, S, T) { return T.p.map(P => P.best); },
    fmt: v => v > 0 ? `${v.toFixed(2)} m` : 'no mark',
    draw(m, S, T, g) {
      MGM.stadium(g, m.t, '#7ccf4a');
      const slow = T.p.some(P => P.st === 'bound');
      for (let i = 0; i < 4; i++) {
        const L = ln(i), P = T.p[i];
        trackLane(g, i, m, '#c4553a');
        const px0 = BX + PIT * PPX;
        g.fillStyle = MGH.grad(g, L.y0 + 30, L.y1, ['#f4e2b0', '#d8c088']); g.fillRect(px0, L.y0 + 40, 1280 - px0, L.h - 46);
        for (let d = PIT; d <= 17; d++) { const x = BX + d * PPX; g.fillStyle = 'rgba(120,90,40,0.5)'; g.fillRect(x, L.y1 - 14, 2, 8); MGH.text(g, `${d}m`, x, L.y1 - 18, 11, '#7a5a2a'); }
        g.fillStyle = '#fff'; g.fillRect(BX - 16, L.y0 + 20, 16, L.h - 26); g.fillStyle = '#e8432a'; g.fillRect(BX, L.y0 + 20, 4, L.h - 26);
        P.marks.forEach(d => { const x = BX + d * PPX; g.fillStyle = m.players[i].color; g.fillRect(x - 1, L.y1 - 52, 3, 44); g.beginPath(); g.moveTo(x + 2, L.y1 - 52); g.lineTo(x + 18, L.y1 - 46); g.lineTo(x + 2, L.y1 - 40); g.fill(); });
        // bound landing spots so far (hop, step)
        const sp = P.v / 10.5, segs = P.q.map((q, k) => PHM[k] * sp * (0.45 + 0.55 * q));
        let x, y = L.y1 - 8, mood = 'determined', walk = 0, fp;
        const bx = BX - (RUNW - P.jx) * RPX;
        if (P.st === 'bound') {
          // hang in the air above the latest bound, bobbing in slow motion
          const sofar = segs.reduce((a, b) => a + b, 0), k = Math.min(1, P.tt / 0.6);
          x = bx + (sofar + PHM[P.ph] * sp * 0.4 * k) * PPX; y -= 30 + Math.sin(Math.min(1, P.tt / 0.6) * Math.PI / 2) * 26 + Math.sin(m.t * 3) * 3; mood = 'effort';
          fp = [{ x: -0.4, lift: 0.3, tip: 0.3 }, { x: 0.45, lift: 0.1, tip: -0.2 }];
        } else if (P.st === 'air') {
          const k = Math.min(1, P.tt / 1.1), x0 = bx + segs.slice(0, 2).reduce((a, b) => a + b, 0) * PPX, x1 = BX + P.dist * PPX;
          x = x0 + (x1 - x0) * k; y -= Math.sin(Math.PI * k) * (40 + segs[2] * 6); mood = 'cheer'; fp = [{ x: -0.4, lift: 0.3, tip: 0.3 }, { x: 0.5, lift: 0.25, tip: 0.3 }];
        } else if (P.st === 'land' || P.st === 'done') { x = P.foul ? BX + 30 : BX + (P.marks[P.marks.length - 1] || 0) * PPX; mood = P.foul ? 'hurt' : 'cheer'; }
        else { x = 70 + Math.min(RUNW + 2.5, P.d) * RPX; walk = P.v > 1 ? 1 : 0; mood = P.v > 8 ? 'effort' : 'determined'; }
        // footprints of the bounds
        segs.forEach((d, k) => { const fx = bx + segs.slice(0, k + 1).reduce((a, b) => a + b, 0) * PPX; g.fillStyle = 'rgba(60,30,10,0.35)'; g.beginPath(); g.ellipse(fx, L.y1 - 9, 7, 3, 0, 0, 7); g.fill(); });
        if (P.st !== 'done' || P.att >= 2) { MGH.shadow(g, x, L.y1 - 6, 20, 0.25); runner(g, m, i, x, y, 30, mood, walk, { t: m.t * (0.5 + P.v * 0.08), feet: fp }); }
        // the slow-motion angle arrow
        if (P.st === 'bound') {
          const cx = x + 34, cy = y - 50, R0 = 46, rad = d => -d * Math.PI / 180;
          g.fillStyle = 'rgba(0,0,0,0.45)'; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, R0 + 6, rad(80), rad(0)); g.closePath(); g.fill();
          g.fillStyle = 'rgba(120,230,120,0.8)'; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, R0, rad(AIDEAL + 10), rad(AIDEAL - 10)); g.closePath(); g.fill();
          g.fillStyle = '#ffe680'; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, R0, rad(AIDEAL + 4), rad(AIDEAL - 4)); g.closePath(); g.fill();
          const th = rad(P.ang); g.strokeStyle = '#fff'; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(th) * (R0 + 8), cy + Math.sin(th) * (R0 + 8)); g.stroke();
          MGH.text(g, `${PH[P.ph]}!  press A`, cx + 20, cy - R0 - 10, 15, '#fff', 'center', 'bold');
          [0, 1, 2].forEach(k => { g.fillStyle = k < P.ph ? (P.q[k] > 0.85 ? '#ffe680' : P.q[k] > 0.6 ? '#7cf06a' : '#ff9a6b') : k === P.ph ? '#fff' : 'rgba(255,255,255,0.25)'; g.beginPath(); g.arc(cx - 10 + k * 16, cy + 16, 5, 0, 7); g.fill(); });
        }
        if (P.st === 'ready' && P.tt > 0.9) MGH.text(g, 'HOLD A to run', 70 + 90, L.y1 - 70, 15, '#fff', 'center', 'bold');
        if (P.st === 'run') { g.fillStyle = 'rgba(0,0,0,0.5)'; MGH.rr(g, 56, L.y0 + 28, 100, 10, 5); g.fill(); g.fillStyle = '#ffb13d'; MGH.rr(g, 56, L.y0 + 28, 100 * P.v / 10.5, 10, 5); g.fill(); MGH.text(g, 'let go at the board!', 106, L.y0 + 56, 12, '#fff', 'center'); }
        MGH.text(g, `attempt ${Math.min(2, P.att + 1)}/2 · best ${P.best ? P.best.toFixed(2) + ' m' : '—'}`, 300, L.y0 + 24, 14, '#fff');
      }
      if (slow) { g.fillStyle = 'rgba(40,60,120,0.12)'; g.fillRect(0, 0, 1280, 720); MGH.text(g, 'slow motion', 1200, 104, 14, 'rgba(255,255,255,0.7)', 'center', 'bold'); }
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
    done(m, S, T, t) { return T.p.every(P => P.st === 'done') || t > 180; },
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
  // ---- 5) 50m swim: stroke & glide, two lengths with a tumble turn
  const SZ0 = 0.52, SZ1 = 0.72, SG0 = 0.58, SG1 = 0.66; // stroke when your glide has slowed into this band (fraction of peak speed)
  const swim = {
    name: '50m Swim', icon: '🏊', how: 'Press A to take a stroke, then GLIDE. Watch your glide bar drain and stroke again when it reaches the GREEN band — too early wastes energy, too late you slow right down. Two lengths: press B just before the wall for a fast tumble turn!',
    init(m, S, T) { T.p = [0, 1, 2, 3].map(() => ({ d: 0, v: 0, peak: 0, en: 1, fin: 0, sk: 0, turned: false, turnQ: -1, wall: 0, stroke: 0, res: -1, fx: 0, err: R.range(0.02, 0.07), tw: R.range(0.3, 1.0) })); T.go = 2.4; },
    update(m, S, T, dt, t) {
      tickMsgs(T, dt);
      T.p.forEach((P, i) => {
        if (P.fin || t < T.go) return;
        P.stroke = Math.max(0, P.stroke - dt); P.fx = Math.max(0, P.fx - dt); P.en = Math.min(1, P.en + dt * 0.08);
        if (P.wall > 0) { P.wall -= dt; if (P.wall <= 0) { P.v = P.turnQ > 0.8 ? 3.6 : P.turnQ > 0.4 ? 2.8 : 1.4; P.peak = P.v; } return; }
        if (m.pressed(i, 'a') && P.stroke <= 0) {
          const ratio = P.peak > 0 ? P.v / P.peak : 0; let eff;
          if (P.peak <= 0 || P.v < 0.4) { eff = 0.8; P.res = -1; }
          else if (ratio > SZ1) { eff = 0.45; P.en -= 0.09; P.res = 0; }
          else if (ratio >= SG0 && ratio <= SG1) { eff = 1.08; P.res = 2; }
          else if (ratio >= SZ0) { eff = 0.96; P.res = 1; }
          else { eff = 0.9; P.res = 3; }
          if (P.en < 0.15) eff *= 0.5;
          P.v = Math.min(4.2, P.v + 1.25 * eff); P.peak = P.v; P.stroke = 0.18; P.fx = 0.4; P.en = Math.max(0, P.en - 0.03);
          if (!m.bot(i)) Sfx.tone(P.res === 2 ? 1100 : P.res === 1 ? 840 : 380, 0.05, 'triangle', 0.035);
        }
        P.v *= Math.exp(-1.35 * dt);
        // tumble turn at the 25 m wall: B in the last 1.6 m
        const tp = P.turned ? 99 : 25;
        if (!P.turned && m.pressed(i, 'b') && 25 - P.d < 1.6 && P.d < 25) { P.turnQ = 25 - P.d < 0.7 ? 1 : 0.6; P.turned = true; P.d = 25; P.wall = 0.45; P.v = 0; say(T, i, P.turnQ > 0.8 ? 'PERFECT TURN!' : 'turn', P.turnQ > 0.8 ? '#ffe680' : '#9fffa0'); Sfx.whoosh(true); return; }
        P.d += P.v * dt;
        if (!P.turned && P.d >= tp) { P.turned = true; P.d = 25; P.turnQ = 0; P.wall = 0.7; P.v = 0; say(T, i, 'bump! slow turn', '#ff9a6b'); Sfx.thud(); }
        if (P.d >= 50) { P.fin = t - T.go; say(T, i, `${P.fin.toFixed(2)}s`, '#fff'); Sfx.coin(); MGH.burst(105, ln(i).mid, ['#bfe6ff', '#fff'], 18, { speed: 200 }); }
      });
    },
    bot(m, S, T, i, dt) {
      const P = T.p[i], v = m.vin[i]; v.a = v.b = false;
      if (S.stageT < T.go || P.fin || P.wall > 0) return;
      if (!P.turned && P.d > 25 - P.tw && !m.prev[i].b) { v.b = true; P.tw = R.range(0.3, 1.0); return; }
      const ratio = P.peak > 0 ? P.v / P.peak : 0, tgt = (SG0 + SG1) / 2 + P.err;
      if (P.stroke <= 0 && (P.peak <= 0 || ratio <= tgt) && !m.prev[i].a) { v.a = true; P.err = R.range(-0.09, 0.1); }
    },
    done(m, S, T, t) { return T.p.every(P => P.fin) || t > T.go + 60; },
    result(m, S, T) { return T.p.map(P => P.fin ? -P.fin : -(60 + (50 - P.d))); },
    fmt: v => v > -60 ? `${(-v).toFixed(2)}s` : 'DNF',
    draw(m, S, T, g) {
      const t = S.phase === 'play' ? S.stageT : 0;
      // indoor aquatic hall
      g.fillStyle = MGH.grad(g, 40, 120, ['#2a3a5a', '#3a5a7a']); g.fillRect(0, 40, 1280, 80); MGH.crowd(g, m.t, 112, 34);
      for (let k = 0; k < 8; k++) { g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(60 + k * 160, 44, 80, 10); }
      const X = d => d <= 25 ? 130 + d * 42 : 130 + (50 - d) * 42; // there and back
      for (let i = 0; i < 4; i++) {
        const L = ln(i), P = T.p[i];
        g.fillStyle = MGH.grad(g, L.y0, L.y1, ['#4fc0f0', '#2a90d8', '#1a6ab8']); g.fillRect(0, L.y0, 1280, L.h);
        for (let k = 0; k < 10; k++) { g.strokeStyle = 'rgba(255,255,255,0.16)'; g.lineWidth = 2; g.beginPath(); const yy = L.y0 + 20 + k * 13; for (let x = 0; x <= 1280; x += 40) g.lineTo(x, yy + Math.sin(x * 0.03 + m.t * 2 + k) * 3); g.stroke(); }
        g.fillStyle = '#1a4a8a'; g.fillRect(130, L.y0 + L.h * 0.5 + 18, 1050, 4); g.fillRect(1160, L.y0 + L.h * 0.5 + 4, 4, 32); g.fillRect(146, L.y0 + L.h * 0.5 + 4, 4, 32);
        for (let x = 0; x < 1280; x += 16) { g.fillStyle = (x / 16) % 2 ? '#ff4d4d' : '#ffffff'; g.beginPath(); g.arc(x + 8, L.y1 - 2, 5, 0, 7); g.fill(); }
        g.fillStyle = '#e8eef4'; g.fillRect(116, L.y0, 14, L.h); g.fillRect(1180, L.y0, 14, L.h);
        // flags 5 m from the turning wall
        g.fillStyle = 'rgba(255,230,120,0.6)'; g.fillRect(130 + 23.4 * 42, L.y0 + 4, 3, 12);
        g.fillStyle = m.players[i].color; MGH.rr(g, 8, L.y0 + 8, 30, 22, 6); g.fill(); MGH.text(g, String(i + 1), 23, L.y0 + 25, 16, '#fff', 'center', 'bold');
        const back = P.turned && P.wall <= 0, x = X(Math.min(50, P.d)), y = L.mid + 8, dir = back ? -1 : 1;
        const sw = P.stroke > 0 ? Math.sin(P.stroke / 0.18 * Math.PI) : 0;
        if (P.wall > 0) { // tumble
          g.save(); g.translate(x - 20, y); g.rotate((1 - P.wall / 0.6) * Math.PI * 2);
          Char.draw(g, 0, 0, 24, m.players[i].el.id, m.players[i].color, { mood: P.turnQ > 0.8 ? 'cheer' : 'dizzy', seed: i, noFeet: true, noShadow: true }); g.restore();
        } else {
          const hands = { n: { x: -1.1 - sw * 0.5, y: -0.9 * sw + 0.3, d: sw > 0.2 ? -150 : 170, o: true, m: true }, f: { x: 0.9, y: 0.4, d: -30, o: true, m: false } };
          g.save(); g.translate(x, y); g.rotate(0.15 * dir);
          Char.draw(g, 0, -10, 26, m.players[i].el.id, m.players[i].color, { mood: P.fin ? 'cheer' : P.en < 0.15 ? 'sleepy' : P.res === 0 && P.fx > 0 ? 'hurt' : 'effort', seed: i, look: { x: dir, y: 0 }, noFeet: true, hands, noShadow: true });
          g.restore();
        }
        g.fillStyle = 'rgba(40,140,230,0.55)'; g.fillRect(x - 50, y + 4, 100, 30);
        if (P.v > 1.2) for (let k = 0; k < 3; k++) { g.fillStyle = `rgba(255,255,255,${0.5 - k * 0.15})`; g.beginPath(); g.ellipse(x - dir * (40 + k * 22), y + 6, 10 - k * 2, 4, 0, 0, 7); g.fill(); }
        // glide bar: fill = speed / peak; green band = stroke now
        const gx = 470, gy = L.y0 + 14, gw = 200;
        g.fillStyle = 'rgba(0,0,0,0.45)'; MGH.rr(g, gx - 4, gy - 4, gw + 8, 18, 8); g.fill();
        g.fillStyle = 'rgba(120,230,120,0.55)'; g.fillRect(gx + gw * SZ0, gy, gw * (SZ1 - SZ0), 10); g.fillStyle = 'rgba(255,230,120,0.8)'; g.fillRect(gx + gw * SG0, gy, gw * (SG1 - SG0), 10);
        const ratio = P.peak > 0 ? Math.min(1, P.v / P.peak) : 0; g.fillStyle = '#fff'; g.fillRect(gx + gw * ratio - 2, gy - 3, 4, 16);
        MGH.text(g, 'glide', gx - 26, gy + 9, 11, '#fff', 'center');
        g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(gx + gw + 30, gy, 60, 10); g.fillStyle = P.en < 0.25 ? '#ff6b6b' : '#9fe0ff'; g.fillRect(gx + gw + 30, gy, 60 * P.en, 10); MGH.text(g, 'energy', gx + gw + 60, gy - 2, 10, '#fff', 'center');
        if (P.fx > 0) { g.globalAlpha = P.fx / 0.4; const r = P.res; MGH.text(g, r === 2 ? 'PERFECT' : r === 1 ? 'good' : r === 0 ? 'too early!' : r === 3 ? 'late' : 'go!', gx + gw / 2, gy + 30, 13, r === 2 ? '#ffe680' : r === 1 ? '#9fffa0' : '#ff9a6b', 'center', 'bold'); g.globalAlpha = 1; }
        if (!P.turned && P.d > 21 && P.d < 25) MGH.text(g, 'B = turn!', 1120, L.y0 + 30, 16, '#ffe680', 'center', 'bold');
      }
      drawMsgs(g, T, i => X(Math.min(50, T.p[i].d)));
      if (S.phase === 'play') countdown(g, t, T.go);
    },
  };

  MGM.def({ id: 'olympics', name: 'The Elemental Games', how: 'A mini Olympics in five events, one after another — each event awards medal points.', stages: [dash, hurdles, longjump, javelin, swim] });
})();
