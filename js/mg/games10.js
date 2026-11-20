'use strict';
// 64 ---------------------------------------------------------------- Turbo Stunt Rally (a three-race motocross cup)
(() => {
  const SC = 0.42, GA = 720, STEP = 10; // GA: floaty air gravity so jumps hang long enough for big stunts
  const THEMES = {
    canyon: { sky: ['#ff9a5a', '#ffd08a'], far: '#c86a3a', mid: '#a8502a', ground: ['#d88a4a', '#a8602a', '#6a3a1a'], top: '#f0b070', pit: null, feats: { flat: 2, hill: 3, bumps: 2, kicker: 4, mud: 1, water: 1, boost: 1, drop: 1, climb: 1, spring: 2, table: 2 } },
    volcano: { sky: ['#2a0a14', '#7a1a1a'], far: '#3a1010', mid: '#2a0c0c', ground: ['#4a3a3a', '#2a2020', '#120a0a'], top: '#6a5050', pit: 'lava', feats: { flat: 2, hill: 2, bumps: 2, kicker: 5, boost: 1, drop: 1, climb: 2, spring: 2, table: 1 } },
    sky: { sky: ['#5fb0ff', '#dff0ff'], far: '#ffffff', mid: '#cfe4ff', ground: ['#7fd06a', '#5a9a48', '#3a6a30'], top: '#a6f08a', pit: 'void', feats: { flat: 2, hill: 2, kicker: 6, boost: 2, drop: 2, climb: 2, bumps: 1, spring: 3, table: 1 } },
  };
  function makeTrack(theme, len) {
    const th = THEMES[theme], Y = [], K = [], rings = []; let base = 0;
    const seg = (l, f, k = '') => { const n = Math.max(1, Math.round(l / STEP)); for (let j = 0; j < n; j++) { Y.push(f(j / n)); K.push(k); } };
    const pick = () => { const e = Object.entries(th.feats), tot = e.reduce((a, [, w]) => a + w, 0); let r = Math.random() * tot; for (const [k, w] of e) { r -= w; if (r <= 0) return k; } return 'flat'; };
    const here = () => Y.length * STEP;
    seg(900, () => base);
    let last = '';
    while (Y.length * STEP < len - 1000) {
      let t = pick(); if (t === last && t !== 'flat') t = 'flat'; last = t;
      if (t === 'flat') seg(R.range(300, 600), () => base);
      if (t === 'hill') { const h = R.range(60, 150), l = R.range(500, 850); seg(l, q => base - Math.sin(q * Math.PI) * h); }
      if (t === 'bumps') seg(R.range(380, 620), q => base - Math.abs(Math.sin(q * Math.PI * 6)) * 24, 'bumps');
      if (t === 'kicker') {
        const mega = Math.random() < 0.35, big = (theme === 'sky' ? 1.3 : 1) * (mega ? 1.55 : 1), h = R.range(150, 220) * big, l = R.range(260, 330) * big;
        seg(l, q => base - Math.pow(q, 1.7) * h, 'ramp');
        const lip = here();
        const gapL = th.pit ? R.range(240, 420) * big : 0;
        if (gapL) seg(gapL, () => base + 700, th.pit);
        else seg(R.range(140, 200), q => base + Math.sin(q * Math.PI) * 18, 'dip');
        // gold stunt rings hang in the flight path: fly through for a speed reward
        rings.push({ x: lip + R.range(260, 420) * big, y: base - h - R.range(110, 230) * big, r: 48 });
        seg(R.range(700, 900) * big, q => base - h * 0.55 * (1 - q), 'land');
        seg(320, () => base);
      }
      if (t === 'table') {
        // tabletop: up, a long flat top, and down — clear the whole thing for big air
        const h = R.range(120, 170);
        seg(240, q => base - Math.pow(q, 1.6) * h, 'ramp'); seg(R.range(320, 420), () => base - h, 'top'); seg(420, q => base - h * (1 - q * q * (3 - 2 * q)), 'land'); seg(260, () => base);
      }
      if (t === 'spring') {
        // a bounce pad: hit it and you're launched straight up for a long hang time
        seg(160, () => base); seg(70, () => base, 'spring');
        rings.push({ x: here() + R.range(200, 320), y: base - R.range(300, 420), r: 50 });
        seg(R.range(650, 800), () => base, 'land'); seg(200, () => base);
      }
      if (t === 'mud') seg(R.range(300, 480), () => base, 'mud');
      if (t === 'water') seg(R.range(240, 380), () => base + 12, 'water');
      if (t === 'boost') { seg(170, () => base, 'boost'); seg(200, () => base); }
      if (t === 'drop') { const d = R.range(60, 140); seg(320, q => base + d * (q * q * (3 - 2 * q))); base += d; }
      if (t === 'climb') { const d = R.range(60, 130); seg(420, q => base - d * (q * q * (3 - 2 * q))); base -= d; }
    }
    seg(1100, () => base, 'finish');
    return { Y, K, rings, len: (Y.length - 110) * STEP, theme };
  }
  const G = (tr, x) => { const f = clamp(x / STEP, 0, tr.Y.length - 1.001), i = Math.floor(f), q = f - i; return tr.Y[i] * (1 - q) + tr.Y[i + 1] * q; };
  const K = (tr, x) => tr.K[clamp(Math.floor(x / STEP), 0, tr.K.length - 1)];
  const slope = (tr, x, w = 6) => Math.atan2(G(tr, x + w) - G(tr, x - w), w * 2);
  const wrap = a => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };
  const say = (T, i, text, col = '#ffe680') => { T.msg = T.msg || []; T.msg[i] = { text, col, t: 0 }; };
  const pit = k => k === 'lava' || k === 'void';

  function race(name, icon, theme, len) {
    return {
      name, icon,
      how: 'Hold RIGHT (or A) to ride, LEFT to brake. In the air, LEFT/RIGHT spins the bike — chain 2 or 3 flips off the big ramps and bounce pads! Land a flip, a clean landing you lined up yourself, or fly through a gold ring and your bike gets an automatic STUNT BOOST. Let go in the air and the bike levels itself. Come up short over a pit and an updraft saves you, but you lose speed.',
      init(m, S, T) {
        T.tr = makeTrack(theme, len);
        T.p = [0, 1, 2, 3].map(i => ({ x: 120, y: 0, v: 0, vx: 0, vy: 0, ang: 0, air: false, rot: 0, sb: 0, crash: 0, fin: 0, camY: 0, flips: 0, stunts: 0, bpad: 0, skill: R.range(0.6, 1), flipGo: false, rings: new Set() }));
        T.parts = [];
      },
      idle(m, S, T, dt) { this.stepParts(T, dt); },
      stepParts(T, dt) { for (const p of T.parts) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.grav || 0) * dt; } T.parts = T.parts.filter(p => p.t < p.life); if (T.parts.length > 700) T.parts.splice(0, T.parts.length - 700); (T.msg || []).forEach(q => { if (q) q.t += dt; }); },
      puff(T, x, y, n, col, o = {}) { if (Settings.test) return; for (let k = 0; k < n; k++) T.parts.push({ lane: o.lane, x, y, vx: R.range(-1, 1) * (o.v || 80) - (o.back || 0), vy: -R.range(0.2, 1) * (o.v || 80), t: 0, life: R.range(0.3, 0.7), size: R.range(4, 9), col: Array.isArray(col) ? R.pick(col) : col, grav: o.grav || 200 }); },
      reward(T, P, i, secs, text, col) { P.sb = Math.min(3.2, Math.max(P.sb, 0) + secs); say(T, i, text, col); },
      takeoff(P, sp, a) { P.air = true; P.steered = false; P.rescued = false; P.vx = sp * Math.cos(a); P.vy = sp * Math.sin(a); P.rot = 0; P.flipGo = false; },
      update(m, S, T, dt, t) {
        this.stepParts(T, dt);
        const tr = T.tr;
        T.p.forEach((P, i) => {
          if (P.fin) { P.v *= Math.exp(-1.5 * dt); P.x += P.v * dt; P.y = G(tr, P.x); P.ang = slope(tr, P.x, 22); return; }
          const ax = m.axis(i).x;
          if (P.crash > 0) {
            P.crash -= dt;
            if (P.crash <= 0) { let x = P.x; while (pit(K(tr, x)) || ['dip', 'ramp', 'spring'].includes(K(tr, x))) x += STEP; P.x = x + 20; P.y = G(tr, P.x); P.air = false; P.v = 200; P.ang = slope(tr, P.x, 22); P.rot = 0; }
            return;
          }
          P.sb -= dt; P.bpad = Math.max(0, P.bpad - dt);
          const boosting = P.sb > 0 || P.bpad > 0;
          if (!P.air) {
            const a = slope(tr, P.x), kind = K(tr, P.x);
            const gas = m.held(i, 'a') || ax > 0.3, brake = ax < -0.3 && !gas;
            const vmax = (boosting ? 1300 : 880) * (kind === 'mud' ? 0.4 : 1);
            if (boosting) P.v += 1500 * Math.max(0, 1 - P.v / vmax) * dt; // the stunt boost drives the bike on its own
            else if (gas) P.v += 760 * Math.max(0, 1 - P.v / vmax) * dt;
            else P.v -= 240 * dt;
            if (brake) P.v -= 900 * dt;
            if (P.v > vmax) P.v -= (P.v - vmax) * 3 * dt;
            P.v += 900 * Math.sin(a) * dt;
            if (kind === 'water') { P.v *= Math.exp(-0.9 * dt); if (Math.random() < 0.5) this.puff(T, P.x, P.y, 2, ['#bfe6ff', '#ffffff'], { lane: i, v: 160, grav: 600 }); }
            if (kind === 'mud' && Math.random() < 0.4) this.puff(T, P.x - 20, P.y, 1, ['#6a4a2a', '#8a6a3a'], { lane: i, v: 90, grav: 500 });
            if (kind === 'boost' && P.bpad <= 0) { P.bpad = 0.7; P.v = Math.max(P.v, 1150); say(T, i, 'BOOST!', '#7cf0ff'); Sfx.whoosh(true); }
            P.v = gas || boosting ? Math.max(140, P.v) : Math.max(0, P.v);
            if (kind === 'spring' && P.v > 60) {
              // bounce pad: straight up for a long hang time
              const sp = Math.max(P.v, 520); P.x += 10; this.takeoff(P, 1, 0); P.vx = sp * 0.85; P.vy = -1080; P.y -= 4;
              say(T, i, 'BOING!', '#ff9af0'); Sfx.tone(260, 0.3, 'sine', 0.07, 900); this.puff(T, P.x, P.y, 10, ['#ff9af0', '#ffffff'], { lane: i, v: 180, grav: 400 });
            } else {
              const nx = P.x + P.v * Math.cos(a) * dt, ny = G(tr, nx);
              const fall = ny - P.y, ball = P.v * Math.sin(a) * dt + 0.5 * GA * dt * dt;
              if (fall > ball + 3 && P.v > 120) {
                // leaving the ground: off a ramp lip the launch follows the ramp's own angle (not the cliff after it)
                let la = a, sp = P.v;
                if (kind === 'ramp') { la = Math.min(a, Math.atan2(G(tr, P.x) - G(tr, P.x - 14), 14)); sp = this.launchSpeed(tr, P.x, P.y, la, P.v); }
                this.takeoff(P, sp, la); P.x = nx;
              } else { P.x = nx; P.y = ny; }
            }
            // the bike sits on both wheels: its angle follows the ground under the wheelbase, smoothly
            if (!P.air) { const ga = slope(tr, P.x, 22); P.ang += wrap(ga - P.ang) * Math.min(1, dt * 16); }
            if (P.v > 300 && Math.random() < 0.35) this.puff(T, P.x - 30, P.y, 1, kind === 'water' ? '#bfe6ff' : 'rgba(230,210,170,0.8)', { lane: i, v: 50, back: P.v * 0.2, grav: -20 });
          } else {
            P.vy += GA * dt; P.x += P.vx * dt; P.y += P.vy * dt;
            // spin with LEFT/RIGHT; let go and the bike lines itself up with the ground it's about to land on
            if (Math.abs(ax) > 0.2) P.steered = true;
            let da = ax * 5.2 * dt;
            if (Math.abs(ax) < 0.2) {
              const tgt = slope(tr, P.x + P.vx * 0.3, 22); let rem = wrap(tgt - P.ang);
              if (Math.abs(P.rot) > Math.PI) { const d = Math.sign(P.rot); if (Math.sign(rem) !== d && Math.abs(rem) > 0.05) rem += d * Math.PI * 2; da = Math.sign(rem) * Math.min(Math.abs(rem), 6 * dt); } // finish the flip you started
              else da = Math.sign(rem) * Math.min(Math.abs(rem), 3.4 * dt);
            }
            P.ang += da; P.rot += da;
            // gold rings
            for (const [k, r] of tr.rings.entries()) if (!P.rings.has(k) && Math.hypot(P.x - r.x, P.y - 40 - r.y) < r.r + 10) { P.rings.add(k); P.stunts++; this.reward(T, P, i, 0.8, 'RING! BOOST', '#ffd34d'); Sfx.coin(); this.puff(T, r.x, r.y, 14, ['#ffe680', '#ffffff'], { lane: i, v: 220, grav: 200 }); }
            const gy = G(tr, P.x), kind = K(tr, P.x);
            if (pit(kind) && P.y > gy - 640 && P.vy > 0) {
              // rescue updraft: bounced across the pit instead of a crash — but it costs your speed
              const a2 = -0.75, sp = this.launchSpeed(tr, P.x, P.y, a2, 600);
              P.vx = sp * Math.cos(a2); P.vy = sp * Math.sin(a2); P.rot = 0; P.rescued = true; P.sb = 0;
              say(T, i, kind === 'lava' ? 'HOT! RESCUE BOUNCE!' : 'UPDRAFT SAVE!', '#ff9a6b'); Sfx.tone(300, 0.25, 'sine', 0.07, 600);
              this.puff(T, P.x, P.y, 14, kind === 'lava' ? ['#ffb03a', '#ff5a1f'] : ['#ffffff', '#dff0ff'], { lane: i, v: 200, grav: 300 });
            }
            if (P.y >= gy) {
              const a = slope(tr, P.x, 22), diff = Math.abs(wrap(P.ang - a));
              if (diff < 1.0) {
                P.air = false; P.y = gy; P.v = Math.max(150, P.vx * Math.cos(a) + P.vy * Math.sin(a)); P.ang = a;
                if (P.rescued) { P.v = Math.min(P.v, 300); P.rescued = false; }
                const flips = Math.floor(Math.abs(P.rot) / (Math.PI * 2) + 0.18);
                if (flips > 0) { P.flips += flips; P.stunts += flips; this.reward(T, P, i, 0.7 * flips, `${flips > 1 ? flips + 'x ' : ''}${P.rot < 0 ? 'BACKFLIP' : 'FRONTFLIP'}! BOOST`, '#ffe680'); Sfx.star(); }
                if (diff < 0.3 && P.steered) { this.reward(T, P, i, 0.45, flips ? `${flips > 1 ? flips + 'x ' : ''}FLIP + PERFECT!` : 'PERFECT LANDING', '#7cf06a'); }
                if (P.sb > 0) Sfx.whoosh(true);
                this.puff(T, P.x, P.y, 8, ['#e8dcc4', '#ffffff'], { lane: i, v: 160, grav: 400 });
                Sfx.thud();
              } else this.crashP(T, P, i, 'WIPEOUT!');
            }
          }
          if (P.x >= tr.len) { P.fin = t; say(T, i, `FINISH ${t.toFixed(1)}s`, '#ffffff'); Sfx.coin(); Sfx.crowd('cheer'); }
          // camera follows each rider's height
          P.camY += (P.y - 40 - P.camY) * Math.min(1, dt * 4); P.camY = clamp(P.camY, P.y - 75, P.y + 110); // keep the rider inside the lane on big drops
        });
      },
      // ramps always give enough speed to clear the gap after them (stunts stay the fun part)
      launchSpeed(tr, x, y, a, v) {
        for (let sp = Math.max(v, 500); sp < 2200; sp += 60) {
          let px = x, py = y, vx = sp * Math.cos(a), vy = sp * Math.sin(a), ok = false;
          for (let k = 0; k < 400; k++) { vy += GA / 60; px += vx / 60; py += vy / 60; const gy = G(tr, px); if (py >= gy) { ok = !pit(K(tr, px)) && !pit(K(tr, px + 40)); break; } if (pit(K(tr, px)) && py > gy - 640) break; }
          if (ok) return sp + 40;
        }
        return v;
      },
      crashP(T, P, i, text) { P.crash = 1.3; P.air = false; P.v = 0; P.vx = P.vy = 0; P.sb = 0; say(T, i, text, '#ff6b6b'); Sfx.boom(); this.puff(T, P.x, P.y - 20, 18, ['#ffe680', '#ff8a3d', '#5a5a5a'], { lane: i, v: 220, grav: 500 }); },
      bot(m, S, T, i, dt) {
        const P = T.p[i], v = m.vin[i], tr = T.tr; v.a = true; v.b = false; v.ax = 0;
        if (P.crash > 0 || P.fin) return;
        if (P.air) {
          // predict where we land and line the wheels up with that slope; do flips when there's time
          let x = P.x, y = P.y, vy = P.vy, tt = 0; while (tt < 4 && y < G(tr, x)) { vy += GA / 60; x += P.vx / 60; y += vy / 60; tt += 1 / 60; }
          const target = slope(tr, x, 22);
          if (P.flipGo === false && Math.abs(P.rot) < 0.2) { const n = Math.min(3, Math.floor((tt - 0.45) / 1.3 * (0.75 + P.skill * 0.3))); P.flipN = Math.random() < 0.85 * P.skill ? n : Math.min(n, 1); P.flipGo = P.flipN > 0 ? (Math.random() < 0.6 ? -1 : 1) : 0; }
          if (P.flipGo && Math.abs(P.rot) < Math.PI * 2 * P.flipN - 0.5 && tt > 0.42) v.ax = P.flipGo;
          else { const err = wrap(target - P.ang); v.ax = clamp(err * 3.2, -1, 1); }
        }
      },
      done(m, S, T, t) { return T.p.every(P => P.fin) || t > 80; },
      result(m, S, T) { return T.p.map(P => P.fin ? -P.fin : -(200 + (T.tr.len - P.x) / 100)); },
      fmt: v => v > -200 ? `${(-v).toFixed(1)}s` : 'DNF',
      draw(m, S, T, g) {
        const th = THEMES[theme], tr = T.tr;
        g.fillStyle = '#0c0818'; g.fillRect(0, 40, 1280, 680);
        // mini-map of the whole course
        g.fillStyle = 'rgba(255,255,255,0.12)'; MGH.rr(g, 160, 50, 960, 16, 8); g.fill();
        T.p.forEach((P, i) => { const x = 160 + 960 * clamp(P.x / tr.len, 0, 1); g.fillStyle = m.players[i].color; g.beginPath(); g.arc(x, 58, 9, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke(); });
        MGH.text(g, '🏁', 1135, 64, 18, '#fff');
        for (let i = 0; i < 4; i++) this.drawLane(g, m, S, T, i, th, tr);
      },
      drawLane(g, m, S, T, i, th, tr) {
        const L = MGM.lane(i, 76, 160), P = T.p[i];
        const camX = P.x - 260 / SC, sx = x => (x - camX) * SC, sy = y => L.y0 + 100 + (y - P.camY) * SC;
        g.save(); g.beginPath(); g.rect(0, L.y0, 1280, L.h - 4); g.clip();
        const sk = g.createLinearGradient(0, L.y0, 0, L.y1); sk.addColorStop(0, th.sky[0]); sk.addColorStop(1, th.sky[1]); g.fillStyle = sk; g.fillRect(0, L.y0, 1280, L.h);
        if (theme === 'volcano') { MGH.glow(g, 1000 - (camX * 0.02) % 400, L.y0 + 60, 120, 'rgba(255,90,30,0.5)'); }
        if (theme === 'sky') for (let k = 0; k < 4; k++) MGH.cloud(g, ((k * 360 - camX * 0.1) % 1500 + 1500) % 1500 - 100, L.y0 + 30 + (k % 2) * 30, 0.6, 'rgba(255,255,255,0.8)');
        // parallax ridges
        for (const [col, par, amp, off] of [[th.far, 0.15, 30, 50], [th.mid, 0.35, 22, 80]]) { g.fillStyle = col; g.beginPath(); g.moveTo(0, L.y1); for (let x = 0; x <= 1280; x += 40) g.lineTo(x, L.y0 + off + Math.sin((x + camX * par) * 0.01) * amp + Math.sin((x + camX * par) * 0.023) * amp * 0.5); g.lineTo(1280, L.y1); g.fill(); }
        // terrain
        const x0 = camX - 40, x1 = camX + 1280 / SC + 40;
        g.beginPath(); g.moveTo(sx(x0), L.y1);
        for (let x = x0; x <= x1; x += STEP) g.lineTo(sx(x), sy(G(tr, x)));
        g.lineTo(sx(x1), L.y1); g.closePath();
        g.fillStyle = MGH.grad(g, L.y0 + 60, L.y1, th.ground); g.fill();
        g.strokeStyle = th.top; g.lineWidth = 4; g.beginPath(); let first = true;
        for (let x = x0; x <= x1; x += STEP) { const k = K(tr, x); if (k === 'lava' || k === 'void') { first = true; continue; } const X = sx(x), Y = sy(G(tr, x)); if (first) { g.moveTo(X, Y); first = false; } else g.lineTo(X, Y); }
        g.stroke();
        // features
        for (let x = Math.floor(x0 / STEP) * STEP; x <= x1; x += STEP) {
          const k = K(tr, x), X = sx(x), Y = sy(G(tr, x));
          if (k === 'lava') { g.fillStyle = (Math.floor(x / 20) + Math.floor(m.t * 4)) % 2 ? '#ff5a1f' : '#ffb03a'; g.fillRect(X, L.y1 - 18, STEP * SC + 1, 18); MGH.glow(g, X, L.y1 - 10, 30, 'rgba(255,120,40,0.25)'); }
          if (k === 'void' && Math.floor(x / 60) % 3 === 0) MGH.cloud(g, X, L.y1 - 6, 0.35, 'rgba(255,255,255,0.7)');
          if (k === 'mud') { g.fillStyle = '#5a3a1a'; g.fillRect(X, Y - 3, STEP * SC + 1, 6); }
          if (k === 'water') { g.fillStyle = 'rgba(80,170,255,0.75)'; g.fillRect(X, Y - 6, STEP * SC + 1, 9); }
          if (k === 'boost' && Math.floor(x / 40) % 2 === 0) { g.fillStyle = `rgba(110,240,255,${0.6 + 0.4 * Math.sin(m.t * 10 + x)})`; g.beginPath(); g.moveTo(X, Y - 2); g.lineTo(X + 10, Y - 7); g.lineTo(X, Y - 12); g.fill(); }
          if (k === 'finish' && Math.floor(x / STEP) === Math.floor(tr.len / STEP)) { for (let q = 0; q < 6; q++) { g.fillStyle = q % 2 ? '#fff' : '#222'; g.fillRect(X - 4, Y - 70 + q * 11, 8, 11); } MGH.label(g, 'FINISH', X, Y - 82, 14, '#fff'); }
        }
        // bounce pads and gold rings
        for (let x = Math.floor(x0 / STEP) * STEP; x <= x1; x += STEP) if (K(tr, x) === 'spring' && K(tr, x - STEP) !== 'spring') { const X = sx(x), Y = sy(G(tr, x)), sq = 1 + 0.15 * Math.sin(m.t * 8); g.fillStyle = '#5a5a6a'; g.fillRect(X, Y - 6, 70 * SC, 6); g.fillStyle = '#ff6ad5'; MGH.rr(g, X - 2, Y - 6 - 12 * sq, 70 * SC + 4, 8, 4); g.fill(); g.strokeStyle = '#ddd'; g.lineWidth = 2; g.beginPath(); for (let z = 0; z < 4; z++) { g.lineTo(X + 4 + (z % 2) * 18, Y - 6 - z * 3 * sq); } g.stroke(); }
        for (const [k, r] of tr.rings.entries()) { const X = sx(r.x), Y = sy(r.y); if (X < -80 || X > 1360) continue; const got = P.rings.has(k); g.save(); g.globalAlpha = got ? 0.25 : 1; MGH.glow(g, X, Y, r.r * SC * 1.8, 'rgba(255,210,80,0.45)'); g.strokeStyle = '#ffd34d'; g.lineWidth = 5; g.beginPath(); g.ellipse(X, Y, r.r * SC * 0.45, r.r * SC, 0, 0, 7); g.stroke(); g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 2; g.beginPath(); g.ellipse(X - 1, Y - 1, r.r * SC * 0.38, r.r * SC * 0.9, 0, 0, 7); g.stroke(); g.restore(); }
        // distance flags every 2000
        for (let d = 2000; d < tr.len; d += 2000) { const X = sx(d); if (X < -20 || X > 1300) continue; const Y = sy(G(tr, d)); g.strokeStyle = '#eee'; g.lineWidth = 2; g.beginPath(); g.moveTo(X, Y); g.lineTo(X, Y - 40); g.stroke(); g.fillStyle = '#ff4d4d'; g.beginPath(); g.moveTo(X, Y - 40); g.lineTo(X + 16, Y - 34); g.lineTo(X, Y - 28); g.fill(); MGH.text(g, `${Math.round(d / tr.len * 100)}%`, X + 18, Y - 30, 10, '#fff', 'left'); }
        // ghosts of the other riders
        T.p.forEach((Q, j) => { if (j === i || Q.crash > 0) return; const X = sx(Q.x); if (X < -50 || X > 1330) return; g.globalAlpha = 0.35; this.bike(g, m, j, X, sy(Q.y), Q, 0.8); g.globalAlpha = 1; });
        // particles in this lane
        for (const p of T.parts) { if (p.lane !== i) continue; const k = 1 - p.t / p.life; g.globalAlpha = k; g.fillStyle = p.col; g.beginPath(); g.arc(sx(p.x), sy(p.y), p.size * SC * 1.6 * (0.5 + k * 0.5), 0, 7); g.fill(); }
        g.globalAlpha = 1;
        if (P.crash > 0) { const X = sx(P.x), Y = sy(P.y); g.save(); g.translate(X, Y - 18); g.rotate(m.t * 12); g.globalAlpha = 0.85; this.bike(g, m, i, 0, 18, P, 1, true); g.restore(); }
        else this.bike(g, m, i, sx(P.x), sy(P.y), P, 1);
        // way up high: a little marker shows where the ground is below you
        if (P.air) { const gY = sy(G(tr, P.x)); if (gY > L.y1 - 8) { const hgt = Math.round((G(tr, P.x) - P.y) / 10); MGH.text(g, `▼ ${hgt} m`, sx(P.x), L.y1 - 10, 14, '#ffffff', 'center', 'bold'); } }
        g.restore();
        // lane frame + hud
        g.fillStyle = m.players[i].color; g.fillRect(0, L.y0, 6, L.h - 4);
        g.fillStyle = 'rgba(0,0,0,0.45)'; MGH.rr(g, 14, L.y0 + 8, 170, 46, 10); g.fill();
        MGH.text(g, m.players[i].name, 24, L.y0 + 26, 15, m.players[i].color, 'left', 'bold');
        MGH.text(g, `${Math.round(P.v * 0.12)} km/h`, 24, L.y0 + 46, 13, '#fff', 'left');
        if (P.sb > 0) { g.fillStyle = 'rgba(255,255,255,0.15)'; g.fillRect(100, L.y0 + 38, 76, 9); g.fillStyle = '#ffb03a'; g.fillRect(100, L.y0 + 38, 76 * Math.min(1, P.sb / 2), 9); MGH.text(g, '🔥 STUNT BOOST', 138, L.y0 + 34, 10, '#ffd34d'); }
        if (P.fin) MGH.label(g, `🏁 ${P.fin.toFixed(1)}s`, 1150, L.y0 + 30, 16, '#ffe680');
        const q = (T.msg || [])[i]; if (q && q.t < 1.2) { g.globalAlpha = 1 - q.t / 1.2; MGH.text(g, q.text, 330, L.y0 + 40 - q.t * 10, 22, q.col, 'center', 'bold'); g.globalAlpha = 1; }
      },
      // the dirt bike with its rider
      bike(g, m, i, X, Y, P, sc, tumble) {
        const p = m.players[i], col = p.color, s = SC * sc * 1.45;
        g.save(); g.translate(X, Y); g.rotate(tumble ? 0 : P.ang); g.scale(s, s);
        const wr = 26, spin = P.x * 0.08;
        for (const wx of [-44, 44]) {
          g.fillStyle = '#1a1a22'; g.beginPath(); g.arc(wx, -wr, wr, 0, 7); g.fill();
          g.fillStyle = '#5a5a6a'; g.beginPath(); g.arc(wx, -wr, wr * 0.6, 0, 7); g.fill();
          g.strokeStyle = '#cfd6e0'; g.lineWidth = 3; for (let k = 0; k < 4; k++) { const a = spin + k * Math.PI / 4; g.beginPath(); g.moveTo(wx - Math.cos(a) * wr * 0.55, -wr - Math.sin(a) * wr * 0.55); g.lineTo(wx + Math.cos(a) * wr * 0.55, -wr + Math.sin(a) * wr * 0.55); g.stroke(); }
        }
        g.strokeStyle = '#9aa0ad'; g.lineWidth = 6; g.beginPath(); g.moveTo(-44, -wr); g.lineTo(-6, -46); g.moveTo(44, -wr); g.lineTo(30, -70); g.stroke();
        g.fillStyle = col; g.beginPath(); g.moveTo(-40, -50); g.lineTo(26, -62); g.lineTo(40, -48); g.lineTo(10, -36); g.lineTo(-30, -38); g.closePath(); g.fill();
        g.strokeStyle = Char.shade(col, -0.5); g.lineWidth = 3; g.stroke();
        g.fillStyle = '#2a2a34'; g.fillRect(-36, -60, 34, 9);
        g.strokeStyle = '#3a3a44'; g.lineWidth = 5; g.beginPath(); g.moveTo(28, -70); g.lineTo(36, -84); g.stroke();
        if ((P.sb > 0 || P.bpad > 0) && !tumble) { MGH.fireball(g, -60, -40, 14 + Math.min(8, P.sb * 3), m.t, -1, 0); }
        g.restore();
        // rider
        const lean = tumble ? 0 : P.ang;
        g.save(); g.translate(X, Y); g.rotate(lean);
        Char.draw(g, -6 * s, -100 * s, 46 * s, p.el.id, col, { mood: tumble ? 'dizzy' : P.air ? (Math.abs(P.rot) > 1 ? 'cheer' : 'determined') : P.sb > 0 ? 'cheer' : 'determined', seed: i, look: { x: 1, y: 0 }, noFeet: true, noShadow: true, hands: { n: { x: -1.2, y: 0.1, d: 175, o: false, m: false }, f: { x: -1.0, y: 0.0, d: 170, o: false, m: false } } });
        g.restore();
      },
    };
  }
  MGM.def({ id: 'rally', name: 'Turbo Stunt Rally', controls: 'Right (or A) ride, Left/Right flip', how: 'A three-race motocross cup with ramps, bounce pads, gold rings, pits and flips — stunts give you an automatic speed boost.', stages: [race('Canyon Run', '🏜️', 'canyon', 22000), race('Volcano Leap', '🌋', 'volcano', 24000), race('Sky Circuit', '☁️', 'sky', 26000)] });
})();
