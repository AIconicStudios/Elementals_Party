'use strict';
// YEARS PASSED — a long, straight motorbike race through four seasons.
//   Ride (hold →) and your tank drains. Roadside fuel stations refill a tank in the same 3 s however
//   empty it is — and you can't refill a full tank — so: stop now, or gamble on the next one?
//   Run dry and you must push the bike at a crawl… or hop off (B), jog to a station for a can of fuel and
//   jog back. Shuffling about on foot attracts ZOMBIES (the more you walk, the more of them); bonk one with
//   your can (A at the right moment) — but every bonk dents the can and it holds a little less.
(() => {
  const L = 34000, RIDE = 300, PUSH = 75, FOOT = 100, TANK = 10, BURN = 2.0, REFILL = 3, CANFILL = 1.0, LANE = 170;
  const SEASON = [
    { n: '🌸 Spring', sky: ['#9ad8ff', '#e8f6ff'], hill: '#7cc86a', hill2: '#5aa850', tree: '#ffb8d8', trunk: '#7a5a3a', ground: '#8ad070' },
    { n: '☀️ Summer', sky: ['#4ab0f0', '#c8ecff'], hill: '#5ab84a', hill2: '#3a9a3a', tree: '#3aa040', trunk: '#6a4a2a', ground: '#6ac050' },
    { n: '🍂 Autumn', sky: ['#f0a870', '#ffe0b8'], hill: '#c8903a', hill2: '#a8702a', tree: '#e86a2a', trunk: '#5a3a1a', ground: '#c8a050' },
    { n: '❄️ Winter', sky: ['#2a3a6a', '#8aa0c8'], hill: '#e8f0ff', hill2: '#c8d4ea', tree: '#f4f8ff', trunk: '#4a3a3a', ground: '#e8eef8' },
  ];
  const lerpC = (a, b, k) => { const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16), ch = s => [(s >> 16) & 255, (s >> 8) & 255, s & 255], A = ch(pa), B = ch(pb); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(',')})`; };
  const season = x => { const f = clamp(x / L, 0, 0.9999) * 4, k = Math.floor(f), q = f - k; return { k, q, S: SEASON[k], N: SEASON[Math.min(3, k + 1)] }; };
  const col = (x, key) => { const s = season(x), q = s.q > 0.8 ? (s.q - 0.8) / 0.2 : 0; return lerpC(s.S[key], s.N[key], q); };
  const colSky = (x, j) => { const s = season(x), q = s.q > 0.8 ? (s.q - 0.8) / 0.2 : 0; return lerpC(s.S.sky[j], s.N.sky[j], q); };

  function zombie(g, x, y, t, k, hit) {
    const sw = Math.sin(t * 5 + k) * 0.12; g.save(); g.translate(x, y); if (hit) g.rotate(hit * 3);
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(0, 2, 16, 4, 0, 0, 7); g.fill();
    g.fillStyle = '#3a4a3a'; MGH.rr(g, -9, -18, 7, 18, 3); g.fill(); MGH.rr(g, 2, -18, 7, 18, 3); g.fill();
    g.rotate(sw); g.fillStyle = '#7a6a9a'; MGH.rr(g, -12, -44, 24, 28, 6); g.fill(); g.fillStyle = '#5a4a7a'; g.beginPath(); g.moveTo(-12, -20); g.lineTo(-6, -16); g.lineTo(0, -21); g.lineTo(6, -16); g.lineTo(12, -20); g.lineTo(12, -16); g.lineTo(-12, -16); g.fill();
    g.strokeStyle = '#8ac87a'; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(-6, -38); g.lineTo(-24, -36 + Math.sin(t * 4) * 3); g.moveTo(6, -38); g.lineTo(-20, -30 + Math.sin(t * 4 + 1) * 3); g.stroke();
    g.fillStyle = '#9ad88a'; g.beginPath(); g.arc(0, -56, 14, 0, 7); g.fill(); g.fillStyle = '#6a9a5a'; g.beginPath(); g.arc(6, -64, 4, 0, 7); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(-6, -58, 4, 0, 7); g.arc(4, -57, 3, 0, 7); g.fill(); g.fillStyle = '#c83a3a'; g.beginPath(); g.arc(-7, -58, 1.6, 0, 7); g.arc(4, -57, 1.4, 0, 7); g.fill();
    g.strokeStyle = '#3a5a2a'; g.lineWidth = 2; g.beginPath(); g.moveTo(-8, -49); g.lineTo(-4, -51); g.lineTo(0, -49); g.lineTo(4, -51); g.stroke();
    g.restore();
  }
  function can(g, x, y, full, cap) {
    g.fillStyle = full ? '#e8323e' : '#8a5a5a'; MGH.rr(g, x - 7, y - 10, 14, 18, 3); g.fill(); g.fillStyle = '#222'; g.fillRect(x - 3, y - 14, 6, 4); g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x - 4, y - 6); g.lineTo(x + 4, y + 4); g.stroke();
    if (cap < 10) { g.strokeStyle = 'rgba(0,0,0,0.5)'; g.beginPath(); g.moveTo(x + 7, y - 4); g.lineTo(x + 3, y); g.stroke(); }
  }

  MG.def({
    id: 'yearspassed', name: 'Years Passed', type: 'Race', controls: 'Move + A & B buttons', dur: 240,
    rows: [['lr', 'Ride / walk'], ['a', 'Refuel · fill the can · pour · bonk zombies'], ['b', 'Hop off / back on the bike']],
    how: 'A long straight race through spring, summer, autumn and winter! Hold → to ride — riding burns fuel. Roadside stations refill your tank (press A there) and it always takes the same 3 seconds, however empty you are — you can\'t refill a full tank. Run dry and you must push the bike, very slowly… or press B to hop off, jog to a station, fill your can (A), jog back and pour it in (A). Wandering on foot draws ZOMBIES — the longer you walk, the more come. Press A as one lunges to bonk it with your can… but each bonk dents the can and it holds a bit less. First across the line wins!',
    wins: 'First to the finish line (or furthest when time runs out).',
    init(m, S) {
      S.st = []; for (let x = 2600; x < L - 1500; x += R.range(2000, 3600)) S.st.push(x);
      S.P = [0, 1, 2, 3].map(i => ({ x: 120, v: 0, fuel: TANK, mode: 'ride', fx: 0, cap: 10, canFull: true, busy: 0, busyK: '', walkT: 0, z: null, stun: 0, fin: 0, greed: R.range(0.35, 1.2), plan: null, wob: 0, msg: '', msgT: 0, zc: R.range(4, 9) }));
      S.ph = 'go'; S.cd = 2.6; S.order = [];
    },
    stAt(S, x, r = 70) { return S.st.find(s => Math.abs(s - x) < r); },
    say(P, s) { P.msg = s; P.msgT = 1.4; },
    update(m, S, dt) {
      if (S.cd > 0) { S.cd -= dt; return; }
      S.P.forEach((P, i) => {
        P.msgT -= dt; if (P.fin) return;
        const a = m.axis(i), me = !m.bot(i);
        if (P.busy > 0) { P.busy -= dt; P.v = 0; if (P.busy <= 0) { if (P.busyK === 'refill') { P.fuel = TANK; P.mode = 'ride'; P.walkT = 0; if (me) Sfx.coin(); } if (P.busyK === 'can') { P.canFull = true; if (me) Sfx.tone(700, 0.08, 'triangle', 0.04); } if (P.busyK === 'pour') { P.fuel = Math.min(TANK, P.fuel + P.cap); P.canFull = false; P.mode = 'ride'; P.walkT = 0; if (me) Sfx.coin(); } } return; }
        // a zombie encounter: it shambles up, lunges — bonk it at the right moment
        if (P.z) { const Z = P.z; Z.t += dt;
          if (!Z.res && Z.t > 1.0 && Z.t < 1.55 && m.pressed(i, 'a')) { Z.res = 'bonk'; Z.rt = 0; P.cap = Math.max(3, P.cap - 1); this.say(P, `BONK! can now holds ${P.cap}`); Sfx.thud(); MGH.shake(3); }
          else if (!Z.res && m.pressed(i, 'a') && Z.t <= 1.0) { Z.early = (Z.early || 0) + 1; }
          if (!Z.res && Z.t >= 1.55) { Z.res = 'grab'; Z.rt = 0; this.say(P, 'Grabbed! Shake it off…'); if (me) Sfx.tone(160, 0.3, 'sawtooth', 0.04); }
          if (Z.res) { Z.rt += dt; if ((Z.res === 'bonk' && Z.rt > 0.7) || (Z.res === 'grab' && Z.rt > 2.4)) P.z = null; }
          return; }
        const atSt = this.stAt(S, P.mode === 'foot' ? P.fx : P.x);
        if (P.mode === 'ride' || P.mode === 'push') {
          const want = Math.max(0, a.x), top = P.mode === 'ride' ? RIDE : PUSH;
          P.v += (want * top - P.v) * Math.min(1, dt * (P.mode === 'ride' ? 1.8 : 6));
          P.x += P.v * dt;
          if (P.mode === 'ride') { P.fuel -= (P.v / RIDE) * dt / BURN; if (P.fuel <= 0) { P.fuel = 0; P.mode = 'push'; P.v = Math.min(P.v, PUSH); this.say(P, '⛽ Out of fuel!'); if (me) Sfx.tone(200, 0.4, 'square', 0.03, -60); } }
          else this.walk(m, S, P, i, dt, P.v);
          if (m.pressed(i, 'a') && atSt) { if (P.fuel >= TANK - 0.05) { this.say(P, 'Tank is full!'); if (me) Sfx.tone(240, 0.08, 'square', 0.03); } else { P.busy = REFILL; P.busyK = 'refill'; P.v = 0; } }
          if (m.pressed(i, 'b')) { P.mode = 'foot'; P.fx = P.x; P.v = 0; }
        } else { // on foot
          const sp = a.x * FOOT; P.fx = clamp(P.fx + sp * dt, 0, L); P.wob += Math.abs(sp) * dt;
          this.walk(m, S, P, i, dt, Math.abs(sp));
          const nearBike = Math.abs(P.fx - P.x) < 46;
          if (m.pressed(i, 'a')) {
            if (nearBike && P.canFull) { P.busy = 1.0; P.busyK = 'pour'; }
            else if (atSt && !P.canFull) { P.busy = CANFILL; P.busyK = 'can'; }
            else if (atSt && P.canFull) this.say(P, 'Can is already full');
          }
          if (m.pressed(i, 'b') && nearBike) { P.mode = P.fuel > 0 ? 'ride' : 'push'; }
        }
        if (P.x >= L) { P.fin = m.t; S.order.push(i); this.say(P, S.order.length === 1 ? '🏁 WINNER!' : '🏁 Finished!'); Sfx.star(); MGH.burst(640, LANE * i + 120, ['#ffe680', '#fff', m.players[i].color], 24, { speed: 260 }); }
      });
      if (S.order.length && S.endT === undefined) S.endT = 30; if (S.order.length >= 4 && S.endT > 2) S.endT = 2;
      if (S.endT !== undefined && (S.endT -= dt) <= 0) m.finish(this.score(m, S));
    },
    // every metre on foot makes the next zombie more likely
    walk(m, S, P, i, dt, sp) {
      if (sp < 5) return; P.walkT += dt; P.zc -= dt * (1 + P.walkT * 0.25);
      if (P.zc <= 0) { P.zc = R.range(5, 11); P.z = { t: 0, k: R.range(0, 9) }; this.say(P, '🧟 Zombie!'); if (!m.bot(i)) Sfx.tone(120, 0.4, 'sawtooth', 0.04); }
    },
    bot(m, S, i, dt) {
      const v = m.vin[i], P = S.P[i]; v.a = v.b = false; v.ax = 0; if (P.fin || S.cd > 0 || P.busy > 0) return;
      const tap = k => { if (!m.prev[i][k]) v[k] = true; };
      if (P.z) { if (!P.z.res && P.z.t > (P.z.bt || (P.z.bt = Math.random() < 0.72 ? R.range(1.05, 1.45) : 9))) tap('a'); return; }
      const next = S.st.find(s => s > P.x + 70), prev = [...S.st].reverse().find(s => s < P.x - 70), atSt = this.stAt(S, P.mode === 'foot' ? P.fx : P.x);
      if (P.mode === 'ride') {
        if (atSt && P.fuel < TANK - 0.05) { const after = S.st.find(s => s > atSt + 70) || L, need = (after - P.x) / (RIDE * BURN) * TANK / TANK; if (P.fuel < need * P.greed + 0.4) { if (Math.abs(atSt - P.x) < 40) { tap('a'); return; } v.ax = atSt > P.x ? 0.4 : 0; return; } }
        v.ax = 1; return;
      }
      if (P.mode === 'push') {
        if (atSt && Math.abs(atSt - P.x) < 40) { tap('a'); return; }
        const dAhead = next ? next - P.x : 1e9, dBack = prev ? P.x - prev : 1e9;
        if (!P.plan) P.plan = (dAhead > 900 && dBack * 2 < dAhead * 0.75 * 1.33) || dAhead > 1800 ? 'jog' : 'push';
        if (P.plan === 'jog') { tap('b'); return; }
        v.ax = 1; return;
      }
      // on foot: fetch a can from the nearest station, then come back and pour
      if (!P.canFull) { const tgt = [prev, next].filter(s => s !== undefined).sort((a, b) => Math.abs(a - P.fx) - Math.abs(b - P.fx))[0]; if (Math.abs(tgt - P.fx) < 40) tap('a'); else v.ax = Math.sign(tgt - P.fx); }
      else { if (Math.abs(P.x - P.fx) < 30) { tap('a'); P.plan = null; } else v.ax = Math.sign(P.x - P.fx); }
    },
    score(m, S) { return S.P.map(P => P.fin ? Math.round(10000 - P.fin * 10) : Math.round(P.x / L * 1000)); },
    fmt(s) { return s >= 5000 ? `finished in ${((10000 - s) / 10).toFixed(1)} s` : `${Math.round(s / 10)}% of the road`; },
    hud(m, S, i) { const P = S.P[i]; return P.fin ? `🏁 #${S.order.indexOf(i) + 1}` : `⛽ ${Math.ceil(P.fuel)}/10 · 🥫${P.cap}`; },
    // ---------------------------------------------------------------- drawing: four stacked lanes, each with its own camera
    draw(m, S, g) {
      const t = m.t;
      S.P.forEach((P, i) => this.drawLane(m, S, g, i, 40 + i * LANE, t));
      // a progress strip on the right with everyone's position
      g.fillStyle = 'rgba(0,0,0,0.5)'; MGH.rr(g, 1236, 50, 34, 660, 14); g.fill();
      for (let k = 0; k < 4; k++) { g.fillStyle = SEASON[k].tree; g.globalAlpha = 0.5; g.fillRect(1246, 690 - (k + 1) * 160, 14, 160); } g.globalAlpha = 1;
      S.st.forEach(s => { g.fillStyle = '#e8323e'; g.fillRect(1244, 690 - s / L * 640 - 1, 18, 2); });
      S.P.forEach((P, i) => { const y = 690 - Math.min(1, P.x / L) * 640; g.fillStyle = m.players[i].color; g.beginPath(); g.arc(1253, y, 8, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke(); });
      MGH.text(g, '🏁', 1253, 66, 16, '#fff');
      if (S.cd > 0) MGH.label(g, S.cd > 0.6 ? String(Math.ceil(S.cd - 0.6)) : 'GO!', 640, 380, 60, '#ffe680');
    },
    drawLane(m, S, g, i, y0, t) {
      const P = S.P[i], p = m.players[i], cx = (P.mode === 'foot' ? (P.fx + P.x) / 2 : P.x) - 360, road = y0 + 132, h = LANE;
      const se = season(P.x), night = se.k === 3;
      g.save(); g.beginPath(); g.rect(0, y0, 1230, h); g.clip();
      // sky with a sun / moon that moves through the year
      const sk = g.createLinearGradient(0, y0, 0, road); sk.addColorStop(0, colSky(P.x, 0)); sk.addColorStop(1, colSky(P.x, 1)); g.fillStyle = sk; g.fillRect(0, y0, 1230, h);
      const sunX = 200 + (P.x / L) * 800; if (night) { g.fillStyle = '#f4f0d8'; g.beginPath(); g.arc(sunX, y0 + 30, 14, 0, 7); g.fill(); g.fillStyle = colSky(P.x, 0); g.beginPath(); g.arc(sunX + 6, y0 + 26, 12, 0, 7); g.fill(); for (let k = 0; k < 14; k++) { g.fillStyle = 'rgba(255,255,255,0.7)'; g.fillRect(MGH.hash(k + i * 20) * 1230, y0 + MGH.hash(k + 50) * 70, 2, 2); } }
      else { MGH.glow(g, sunX, y0 + 30, 40, 'rgba(255,240,180,0.6)'); g.fillStyle = '#fff4b8'; g.beginPath(); g.arc(sunX, y0 + 30, 14, 0, 7); g.fill(); }
      // far mountains, near hills with trees (parallax)
      g.fillStyle = col(P.x, 'hill2'); g.beginPath(); g.moveTo(0, road); for (let x = 0; x <= 1240; x += 40) { const wx = x + cx * 0.2; g.lineTo(x, road - 50 - Math.sin(wx * 0.006) * 22 - Math.sin(wx * 0.017) * 10); } g.lineTo(1240, road); g.fill();
      g.fillStyle = col(P.x, 'hill'); g.beginPath(); g.moveTo(0, road); for (let x = 0; x <= 1240; x += 30) { const wx = x + cx * 0.5; g.lineTo(x, road - 24 - Math.sin(wx * 0.011) * 10); } g.lineTo(1240, road); g.fill();
      const tc = col(P.x, 'tree'), tr = col(P.x, 'trunk'); for (let k = Math.floor(cx * 0.5 / 140) - 1; k < Math.floor(cx * 0.5 / 140) + 11; k++) { const x = k * 140 - cx * 0.5 + MGH.hash(k) * 60, ty = road - 22; g.fillStyle = tr; g.fillRect(x - 3, ty - 16, 6, 18); g.fillStyle = tc; g.beginPath(); g.arc(x, ty - 24, 15 + MGH.hash(k + 3) * 6, 0, 7); g.arc(x - 10, ty - 16, 10, 0, 7); g.arc(x + 10, ty - 16, 10, 0, 7); g.fill(); }
      // the road
      g.fillStyle = col(P.x, 'ground'); g.fillRect(0, road - 4, 1230, 8); g.fillStyle = '#4a4a54'; g.fillRect(0, road + 2, 1230, h - (road - y0) - 2);
      g.fillStyle = '#f4f0d8'; for (let x = -((cx) % 80); x < 1230; x += 80) g.fillRect(x, road + 16, 40, 3);
      for (let x = -((cx) % 120); x < 1230; x += 120) { g.fillStyle = '#e8e0d0'; g.fillRect(x, road - 16, 4, 14); g.fillStyle = '#e8323e'; g.fillRect(x, road - 16, 4, 3); }
      // falling blossoms / leaves / snow
      if (se.k !== 1) for (let k = 0; k < 14; k++) { const fx = (MGH.hash(k + i * 7) * 1230 + t * (se.k === 3 ? 20 : 50) + k * 30) % 1230, fy = y0 + ((MGH.hash(k + 11) * h + t * (se.k === 3 ? 40 : 30)) % h); g.fillStyle = se.k === 0 ? '#ffc8e0' : se.k === 2 ? '#e8782a' : '#fff'; g.beginPath(); g.ellipse(fx, fy, 3, se.k === 3 ? 3 : 2, t + k, 0, 7); g.fill(); }
      // fuel stations
      S.st.forEach(s => { const x = s - cx; if (x < -120 || x > 1300) return; g.fillStyle = '#d8d0c0'; g.fillRect(x - 60, road - 70, 120, 8); g.fillStyle = '#e8323e'; g.fillRect(x - 62, road - 76, 124, 8); g.fillStyle = '#9a9aa8'; g.fillRect(x - 52, road - 62, 5, 62); g.fillRect(x + 47, road - 62, 5, 62);
        g.fillStyle = '#e8323e'; MGH.rr(g, x - 14, road - 44, 28, 44, 5); g.fill(); g.fillStyle = '#fff'; g.fillRect(x - 9, road - 38, 18, 10); g.fillStyle = '#222'; g.fillRect(x - 6, road - 36, 12, 6); g.strokeStyle = '#222'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(x + 14, road - 30); g.quadraticCurveTo(x + 24, road - 10, x + 18, road - 4); g.stroke();
        MGH.text(g, '⛽ FUEL', x, road - 82, 13, '#fff', 'center', 'bold'); });
      // finish line
      const fl = L - cx; if (fl > -40 && fl < 1300) { for (let r = 0; r < 6; r++) for (let c = 0; c < 2; c++) { g.fillStyle = (r + c) % 2 ? '#fff' : '#111'; g.fillRect(fl + c * 8, road - 2 + r * 6, 8, 6); } g.fillStyle = '#9a9aa8'; g.fillRect(fl - 4, road - 90, 4, 90); g.fillRect(fl + 16, road - 90, 4, 90); g.fillStyle = '#e8323e'; g.fillRect(fl - 4, road - 96, 24, 10); MGH.text(g, 'FINISH', fl + 8, road - 100, 12, '#fff', 'center', 'bold'); }
      // the bike (and the rider, on it or beside it)
      const bx = P.x - cx, on = P.mode === 'ride' && !(P.busy > 0 && P.busyK === 'pour'), spin = P.x * 0.08;
      this.bike(g, bx, road + 6, p.color, spin, P.mode === 'ride' && P.v > 30 ? Math.sin(t * 30) * 0.6 : 0);
      if (P.busy > 0 && P.busyK === 'refill') { g.strokeStyle = '#222'; g.lineWidth = 2; g.beginPath(); g.moveTo(this.stAt(S, P.x) - cx + 14, road - 26); g.quadraticCurveTo(bx + 30, road - 60, bx + 4, road - 30); g.stroke(); }
      const walking = (P.mode === 'push' && P.v > 5) || (P.mode === 'foot' && Math.abs(m.axis(i).x) > 0.2 && !P.busy && !P.z);
      if (on) Char.draw(g, bx - 4, road - 40, 17, p.el.id, p.color, { mood: MGH.persona(P.z ? 'shock' : P.busy > 0 ? 'happy' : P.fuel < 2 ? 'nervous' : 'determined', p.el.id), seed: i * 1.7, look: { x: 1, y: 0 }, noFeet: true, hands: { n: { x: 1.3, y: 0.55, d: 0, o: false, m: true }, f: { x: 1.1, y: 0.7, d: 0, o: false, m: false } } });
      else { const rx = P.mode === 'foot' ? P.fx - cx : bx - 34, face = P.mode === 'foot' ? (m.axis(i).x < -0.2 ? -1 : 1) : 1;
        Char.draw(g, rx, road - 22, 17, p.el.id, p.color, { mood: MGH.persona(P.z ? (P.z.res === 'grab' ? 'hurt' : 'shock') : P.mode === 'push' ? 'tired' : 'determined', p.el.id), seed: i * 1.7, look: { x: face, y: 0 }, walk: walking ? 1 : 0, t, hands: P.mode === 'push' ? { n: { x: 1.5, y: 0.1, d: 0, o: false, m: true }, f: { x: 1.3, y: 0.2, d: 0, o: false, m: false } } : { n: { x: 0.9 * face, y: 0.5, d: 0, o: false, m: true }, f: { x: -0.6 * face, y: 0.6, d: 0, o: false, m: false } } });
        if (P.mode === 'foot') can(g, rx + 16 * face, road - 6, P.canFull, P.cap);
        if (P.mode === 'foot' && Math.abs(P.fx - P.x) > 200) { const ax = clamp(bx, 30, 1200); MGH.text(g, bx < 30 ? '◀ bike' : bx > 1200 ? 'bike ▶' : '', ax, road - 60, 13, '#fff', 'center', 'bold'); } }
      if (P.z) { const Z = P.z, px = (P.mode === 'foot' ? P.fx : P.x - 34) - cx, zx = px + 30 + Math.max(0, 1 - Z.t) * 140 - (Z.t > 1 && !Z.res ? 10 : 0) + (Z.res === 'bonk' ? Z.rt * 400 : 0);
        zombie(g, zx, road + 2, t, Z.k, Z.res === 'bonk' ? Z.rt : 0);
        if (!Z.res && Z.t > 0.6) { const ready = Z.t > 1.0; MGH.glow(g, px, road - 70, 26, ready ? 'rgba(120,255,120,0.7)' : 'rgba(255,255,255,0.3)'); g.fillStyle = ready ? '#5fd85f' : '#888'; g.beginPath(); g.arc(px, road - 70, 15, 0, 7); g.fill(); MGH.text(g, 'A', px, road - 64, 17, '#fff', 'center', 'bold'); } }
      if (P.busy > 0) { const tot = P.busyK === 'refill' ? REFILL : P.busyK === 'can' ? CANFILL : 1, px = P.mode === 'foot' ? P.fx - cx : bx; g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 6; g.beginPath(); g.arc(px, road - 76, 13, 0, 7); g.stroke(); g.strokeStyle = '#ffe680'; g.beginPath(); g.arc(px, road - 76, 13, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - P.busy / tot)); g.stroke(); }
      // lane panel: name, fuel gauge, can, season
      g.fillStyle = 'rgba(0,0,0,0.45)'; MGH.rr(g, 10, y0 + 8, 250, 46, 10); g.fill(); g.strokeStyle = p.color; g.lineWidth = 2.5; g.stroke();
      MGH.text(g, p.name, 20, y0 + 26, 15, p.color, 'left', 'bold'); MGH.text(g, `${se.S.n} · Year ${se.k + 1}`, 250, y0 + 26, 13, '#fff', 'right');
      g.fillStyle = 'rgba(255,255,255,0.15)'; MGH.rr(g, 20, y0 + 34, 160, 12, 6); g.fill(); const fq = P.fuel / TANK; g.fillStyle = fq < 0.25 ? '#ff4a3a' : fq < 0.5 ? '#ffc34a' : '#5ae85a'; MGH.rr(g, 20, y0 + 34, 160 * fq, 12, 6); g.fill(); MGH.text(g, '⛽', 188, y0 + 45, 12, '#fff', 'left');
      can(g, 222, y0 + 42, P.canFull, P.cap); MGH.text(g, String(P.cap), 244, y0 + 47, 13, '#fff', 'center', 'bold');
      if (P.fin) MGH.label(g, `🏁 #${S.order.indexOf(i) + 1}`, 640, y0 + 70, 28, '#ffe680'); else if (S.endT !== undefined && S.endT > 2) MGH.label(g, `⏱ ${Math.ceil(S.endT)}`, 640, y0 + 70, 20, '#ff9a9a');
      if (P.msgT > 0) MGH.label(g, P.msg, Math.min(1000, bx + 120), y0 + 40, 17, '#fff');
      g.restore();
      g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(0, y0 + h - 2, 1230, 3);
    },
    bike(g, x, y, c, spin, wob) {
      [x - 24, x + 24].forEach(wx => { g.fillStyle = '#1a1a22'; g.beginPath(); g.arc(wx, y - 14, 14, 0, 7); g.fill(); g.fillStyle = '#9a9aa8'; g.beginPath(); g.arc(wx, y - 14, 7, 0, 7); g.fill(); g.strokeStyle = '#d8d8e0'; g.lineWidth = 1.5; for (let q = 0; q < 3; q++) { const a = spin + q * 2.09; g.beginPath(); g.moveTo(wx, y - 14); g.lineTo(wx + Math.cos(a) * 12, y - 14 + Math.sin(a) * 12); g.stroke(); } });
      g.save(); g.translate(0, wob);
      g.fillStyle = c; g.beginPath(); g.moveTo(x - 24, y - 16); g.lineTo(x - 4, y - 34); g.lineTo(x + 18, y - 34); g.lineTo(x + 24, y - 16); g.lineTo(x + 6, y - 18); g.closePath(); g.fill();
      g.fillStyle = Char.shade(c, -0.3); MGH.rr(g, x - 6, y - 30, 22, 12, 4); g.fill(); g.fillStyle = '#2a2a30'; MGH.rr(g, x - 16, y - 38, 18, 6, 3); g.fill();
      g.strokeStyle = '#3a3a44'; g.lineWidth = 3; g.beginPath(); g.moveTo(x + 18, y - 34); g.lineTo(x + 24, y - 16); g.moveTo(x + 18, y - 34); g.lineTo(x + 14, y - 44); g.lineTo(x + 22, y - 46); g.stroke();
      g.fillStyle = '#fff4b8'; g.beginPath(); g.arc(x + 26, y - 30, 3.5, 0, 7); g.fill(); g.fillStyle = '#5a5a64'; g.fillRect(x - 30, y - 22, 12, 4);
      g.restore();
    },
  });
})();
