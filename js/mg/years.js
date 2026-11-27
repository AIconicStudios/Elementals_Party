'use strict';
// YEARS PASSED — a long, straight motorbike race through four seasons.
//   Ride (hold →) and your tank drains. Roadside fuel stations refill a tank in the same 3 s however
//   empty it is — and you can't refill a full tank — so: stop now, or gamble on the next one?
//   Run dry and you must push the bike at a crawl… or hop off (B), jog to a station for a can of fuel and
//   jog back. Shuffling about on foot attracts ZOMBIES (the more you walk, the more of them); bonk one with
//   your can (A at the right moment) — but every bonk dents the can and it holds a little less.
(() => {
  const L = 34000, RIDE = 300, PUSH = 75, FOOT = 100, TANK = 10, BURN = 2.0, REFILL = 3, CANFILL = 1.0, CLEAR = 2.0, LANE = 170;
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
    const sh = Math.sin(t * 5 + k), sw = sh * 0.1; g.save(); g.translate(x, y); if (hit) g.rotate(hit * 3); g.scale(0.7, 0.7);
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(0, 2, 18, 5, 0, 0, 7); g.fill();
    // shuffling legs and torn trousers
    g.fillStyle = '#4a4a6a'; g.save(); g.translate(-5, -18); g.rotate(sh * 0.25); MGH.rr(g, -4, 0, 9, 18, 3); g.fill(); g.restore(); g.save(); g.translate(5, -18); g.rotate(-sh * 0.25); MGH.rr(g, -4, 0, 9, 18, 3); g.fill(); g.restore();
    g.fillStyle = '#7ab86a'; g.fillRect(-9, -2, 7, 3); g.fillRect(3, -2, 7, 3);
    g.rotate(sw);
    // ragged shirt with patches
    const sg = g.createLinearGradient(-14, -48, 14, -16); sg.addColorStop(0, '#8a7ab8'); sg.addColorStop(1, '#5a4a8a'); g.fillStyle = sg; MGH.rr(g, -14, -48, 28, 32, 8); g.fill();
    g.fillStyle = '#5a4a8a'; g.beginPath(); g.moveTo(-14, -20); for (let q = 0; q < 6; q++) g.lineTo(-14 + q * 5.6, -16 + (q % 2) * 5); g.lineTo(14, -20); g.fill(); g.fillStyle = '#c8a878'; g.fillRect(4, -40, 7, 7); g.strokeStyle = 'rgba(0,0,0,0.4)'; g.lineWidth = 1; g.strokeRect(4, -40, 7, 7);
    // arms reaching forward
    g.strokeStyle = '#7ab86a'; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(-6, -40); g.lineTo(-26, -40 + Math.sin(t * 4) * 3); g.moveTo(6, -40); g.lineTo(-22, -32 + Math.sin(t * 4 + 1) * 3); g.stroke();
    g.fillStyle = '#8ac87a'; g.beginPath(); g.arc(-27, -40 + Math.sin(t * 4) * 3, 5, 0, 7); g.arc(-23, -32 + Math.sin(t * 4 + 1) * 3, 5, 0, 7); g.fill();
    // head: green, lopsided, stitches, messy hair, glowing eyes
    const hg = g.createRadialGradient(-5, -66, 2, 0, -60, 17); hg.addColorStop(0, '#b8f0a0'); hg.addColorStop(1, '#6aa85a'); g.fillStyle = hg; g.beginPath(); g.ellipse(0, -60, 16, 15, 0.1, 0, 7); g.fill();
    // scruffy hair cap hugging the top of the head, with a few tufts
    g.fillStyle = '#3a4a2a'; g.beginPath(); g.ellipse(0, -66, 16.5, 10, 0.1, Math.PI * 1.02, Math.PI * 1.98); g.quadraticCurveTo(10, -66, 0, -68); g.quadraticCurveTo(-10, -66, -16, -64); g.fill();
    for (const [hx, a2, l] of [[-10, -0.5, 6], [-4, -0.15, 7], [3, 0.2, 6], [9, 0.55, 5]]) { const by = -60 - Math.sqrt(Math.max(0, 1 - (hx / 16.5) ** 2)) * 15 + 2; g.beginPath(); g.moveTo(hx - 3, by); g.lineTo(hx + Math.sin(a2) * l, by - Math.cos(a2) * l); g.lineTo(hx + 3, by); g.fill(); }
    g.fillStyle = '#2a1a2a'; g.beginPath(); g.ellipse(-7, -62, 5, 4.5, 0, 0, 7); g.ellipse(5, -61, 4, 3.5, 0, 0, 7); g.fill();
    MGH.glow(g, -7, -62, 8, 'rgba(255,230,80,0.6)'); g.fillStyle = '#ffe050'; g.beginPath(); g.arc(-7, -62, 2, 0, 7); g.arc(5, -61, 1.6, 0, 7); g.fill();
    g.strokeStyle = '#2a3a1a'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(-8, -52); g.lineTo(-4, -54); g.lineTo(0, -52); g.lineTo(4, -54); g.lineTo(8, -52); g.stroke();
    g.beginPath(); g.moveTo(9, -70); g.lineTo(12, -62); for (let q = 0; q < 3; q++) { g.moveTo(9 + q, -68 + q * 3); g.lineTo(13 + q, -69 + q * 3); } g.stroke();
    g.restore();
  }
  function can(g, x, y, full, cap) {
    g.fillStyle = full ? '#e8323e' : '#8a5a5a'; MGH.rr(g, x - 7, y - 10, 14, 18, 3); g.fill(); g.fillStyle = '#222'; g.fillRect(x - 3, y - 14, 6, 4); g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x - 4, y - 6); g.lineTo(x + 4, y + 4); g.stroke();
    if (cap < 10) { g.strokeStyle = 'rgba(0,0,0,0.5)'; g.beginPath(); g.moveTo(x + 7, y - 4); g.lineTo(x + 3, y); g.stroke(); }
  }

  MG.def({
    id: 'yearspassed', name: 'Years Passed', type: 'Race', controls: 'Move + A & B buttons', dur: 240,
    rows: [['lr', 'Ride (← to roll back)'], ['a', 'Refuel at a station · HOLD to clear a roadblock · bonk zombies'], ['b', 'Hop off to clear a roadblock']],
    how: 'Ride with →; riding burns fuel and stations refill your tank (A). Out of fuel? Push the bike — slowly. ROADBLOCKS: smash through at speed (fast, but your tank shrinks by 1 for good) or hop off (B) and HOLD A to clear it — slower, and a zombie may jump you (A as it lunges).',
    wins: 'First to the finish line (or furthest when time runs out).',
    init(m, S) {
      S.st = []; for (let x = 2600; x < L - 1500; x += R.range(2000, 3600)) S.st.push(x);
      // 3 to 5 roadblocks, never right next to a fuel station
      S.rb = []; const n = R.int(3, 5); for (let k = 0; k < n; k++) { for (let tr = 0; tr < 30; tr++) { const x = R.range(3000, L - 2500); if (S.st.every(s => Math.abs(s - x) > 500) && S.rb.every(r => Math.abs(r - x) > 2500)) { S.rb.push(x); break; } } } S.rb.sort((a, b) => a - b);
      S.P = [0, 1, 2, 3].map(i => ({ x: 120, v: 0, fuel: TANK, tank: TANK, mode: 'ride', busy: 0, busyK: '', z: null, fin: 0, greed: R.range(0.35, 1.2), wob: 0, msg: '', msgT: 0, done: new Set(), clr: 0, rbX: 0, bashes: 0, smash: [] }));
      S.ph = 'go'; S.cd = 2.6; S.order = [];
    },
    stAt(S, x, r = 70) { return S.st.find(s => Math.abs(s - x) < r); },
    rbAhead(S, P, r = 170) { return S.rb.find(x => !P.done.has(x) && x - P.x > -10 && x - P.x < r); },
    say(P, s) { P.msg = s; P.msgT = 1.4; },
    update(m, S, dt) {
      if (S.cd > 0) { S.cd -= dt; return; }
      S.P.forEach((P, i) => {
        P.msgT -= dt; if (P.fin) return;
        const a = m.axis(i), me = !m.bot(i);
        if (P.busy > 0) { P.busy -= dt; P.v = 0; if (P.busy <= 0 && P.busyK === 'refill') { P.fuel = P.tank; P.mode = 'ride'; if (me) Sfx.coin(); } return; }
        // clearing a roadblock on foot: hold A; a zombie may jump out of the bushes
        if (P.mode === 'clear') {
          if (P.z) { const Z = P.z; Z.t += dt;
            if (!Z.res && Z.t > 1.0 && Z.t < 1.55 && m.pressed(i, 'a')) { Z.res = 'bonk'; Z.rt = 0; this.say(P, 'BONK!'); Sfx.thud(); MGH.shake(3); }
            if (!Z.res && Z.t >= 1.55) { Z.res = 'grab'; Z.rt = 0; this.say(P, 'Grabbed! Shake it off…'); if (me) Sfx.tone(160, 0.3, 'sawtooth', 0.04); }
            if (Z.res) { Z.rt += dt; if ((Z.res === 'bonk' && Z.rt > 0.6) || (Z.res === 'grab' && Z.rt > 2.2)) P.z = null; }
            return; }
          if (m.held(i, 'a')) { P.clr += dt; P.wob += dt * 6; if (P.zNext !== undefined && P.clr > P.zNext) { P.zNext = undefined; P.z = { t: 0, k: R.range(0, 9) }; this.say(P, '🧟 Zombie!'); if (me) Sfx.tone(120, 0.4, 'sawtooth', 0.04); } }
          if (P.clr >= CLEAR) { P.done.add(P.rbX); P.mode = P.fuel > 0 ? 'ride' : 'push'; this.say(P, 'Road clear!'); if (me) Sfx.tone(700, 0.1, 'triangle', 0.05); }
          if (m.pressed(i, 'b') && P.clr < 0.2) { P.mode = P.fuel > 0 ? 'ride' : 'push'; }
          return;
        }
        const atSt = this.stAt(S, P.x), rb = this.rbAhead(S, P, 200);
        const want = a.x > 0 ? a.x : a.x * 0.55, top = P.mode === 'ride' ? RIDE : PUSH;
        P.v += (want * top - P.v) * Math.min(1, dt * (P.mode === 'ride' ? 1.8 : 6));
        let nx = Math.max(60, P.x + P.v * dt); if (Math.abs(P.v) > 8) P.dir = Math.sign(P.v);
        // reaching a roadblock: smash through at speed, or come to a stop against it
        const hit = S.rb.find(x => !P.done.has(x) && P.x <= x - 34 && nx > x - 34);
        if (hit !== undefined) {
          if (P.mode === 'ride' && P.v > 150) { P.done.add(hit); P.tank = Math.max(3, P.tank - 1); P.fuel = Math.min(P.fuel, P.tank); P.v *= 0.6; P.bashes++; P.smash.push(hit); this.say(P, `💥 SMASH! tank now ${P.tank}`); Sfx.boom(); MGH.shake(4); MGH.burst(640, 40 + i * LANE + 130, ['#c8945a', '#ffd34d', '#fff'], 18, { speed: 280 }); }
          else { nx = hit - 34; P.v = 0; if (!P.blkMsg) { this.say(P, 'Blocked! B to clear it, or back up and smash it'); P.blkMsg = true; } }
        }
        P.x = nx;
        if (P.mode === 'ride') { P.fuel -= (Math.abs(P.v) / RIDE) * dt / BURN; if (P.fuel <= 0) { P.fuel = 0; P.mode = 'push'; P.v = Math.min(P.v, PUSH); this.say(P, '⛽ Out of fuel — push to a station!'); if (me) Sfx.tone(200, 0.4, 'square', 0.03, -60); } }
        if (m.pressed(i, 'a') && atSt) { if (P.fuel >= P.tank - 0.05) { this.say(P, 'Tank is full!'); if (me) Sfx.tone(240, 0.08, 'square', 0.03); } else { P.busy = REFILL; P.busyK = 'refill'; P.v = 0; } }
        if (m.pressed(i, 'b')) { if (rb !== undefined) { P.mode = 'clear'; P.rbX = rb; P.x = Math.min(P.x, rb - 120); P.v = 0; P.clr = 0; P.blkMsg = false; P.zNext = Math.random() < 0.45 ? R.range(0.3, CLEAR - 0.4) : undefined; } else this.say(P, 'No roadblock here'); }
        if (P.x >= L) { P.fin = m.t; S.order.push(i); this.say(P, S.order.length === 1 ? '🏁 WINNER!' : '🏁 Finished!'); Sfx.star(); MGH.burst(640, LANE * i + 120, ['#ffe680', '#fff', m.players[i].color], 24, { speed: 260 }); }
      });
      if (S.order.length && S.endT === undefined) S.endT = 30; if (S.order.length >= 4 && S.endT > 2) S.endT = 2;
      if (S.endT !== undefined && (S.endT -= dt) <= 0) m.finish(this.score(m, S));
    },
    bot(m, S, i, dt) {
      const v = m.vin[i], P = S.P[i]; v.a = v.b = false; v.ax = 0; if (P.fin || S.cd > 0 || P.busy > 0) return;
      const tap = k => { if (!m.prev[i][k]) v[k] = true; };
      if (P.mode === 'clear') { if (P.z) { if (!P.z.res && P.z.t > (P.z.bt || (P.z.bt = Math.random() < 0.72 ? R.range(1.05, 1.45) : 9))) tap('a'); return; } v.a = true; return; }
      const atSt = this.stAt(S, P.x), rb = this.rbAhead(S, P, 260);
      // a roadblock ahead: smash it (if the tank can spare it) or stop and clear it
      if (rb !== undefined) { if (P.plan === undefined || P.planX !== rb) { P.planX = rb; P.plan = P.mode === 'ride' && P.tank > 7 && Math.random() < 0.55 ? 'smash' : 'clear'; }
        if (P.plan === 'clear' || P.mode === 'push') { if (rb - P.x < 190) { tap('b'); return; } v.ax = 0.6; return; }
        if (P.v < 160 && rb - P.x < 60) { v.ax = -1; P.plan = 'clear'; return; } v.ax = 1; return; }
      if (P.mode === 'ride') {
        if (atSt && P.fuel < P.tank - 0.05) { const after = S.st.find(s => s > atSt + 70) || L, need = (after - P.x) / (RIDE * BURN) * TANK / P.tank * P.tank / TANK; if (P.fuel < need * P.greed + 0.4) { if (Math.abs(atSt - P.x) < 40) { tap('a'); return; } v.ax = atSt > P.x ? 0.4 : 0; return; } }
        v.ax = 1; return; }
      // pushing: on to the next station
      if (atSt && Math.abs(atSt - P.x) < 40) { tap('a'); return; }
      v.ax = 1;
    },
    score(m, S) { return S.P.map(P => P.fin ? Math.round(10000 - P.fin * 10) : Math.round(P.x / L * 1000)); },
    fmt(s) { return s >= 5000 ? `finished in ${((10000 - s) / 10).toFixed(1)} s` : `${Math.round(s / 10)}% of the road`; },
    hud(m, S, i) { const P = S.P[i]; return P.fin ? `🏁 #${S.order.indexOf(i) + 1}` : `⛽ ${Math.ceil(P.fuel)}/${P.tank}`; },
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
      const P = S.P[i], p = m.players[i], cx = P.x - 360, road = y0 + 132, h = LANE;
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
      // seasonal roadside props (tulips & bunnies, sunflowers & ice-cream carts, pumpkins & hay, snowmen & gift-lit pines)
      for (let k = Math.floor(cx / 330) - 1; k < Math.floor(cx / 330) + 6; k++) { if (k < 0) continue; const wx = k * 330 + MGH.hash(k) * 120, x = wx - cx, sk = season(wx).k, v = Math.floor(MGH.hash(k + 7) * 3), y = road - 6; if (x < -80 || x > 1300) continue; this.prop(g, x, y, sk, v, t, k); }
      // a big arch where each new year (season) begins
      for (let q = 1; q < 4; q++) { const x = q * L / 4 - cx; if (x < -120 || x > 1330) continue; g.fillStyle = '#7a5a3a'; g.fillRect(x - 70, road - 96, 10, 96); g.fillRect(x + 60, road - 96, 10, 96); GX.plank(g, x - 80, road - 118, 160, 30, '#b07a44'); MGH.text(g, `${SEASON[q].n} · YEAR ${q + 1}`, x, road - 98, 14, '#fff8e8', 'center', 'bold'); for (let f = 0; f < 6; f++) { g.fillStyle = ['#e8323e', '#ffd34d', '#5ac8ff'][f % 3]; g.beginPath(); g.moveTo(x - 60 + f * 22, road - 88); g.lineTo(x - 44 + f * 22, road - 88); g.lineTo(x - 52 + f * 22, road - 76); g.fill(); } }
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
      // roadblocks: a striped barricade with cones and a fallen log; smashed ones leave splinters by the road
      S.rb.forEach(rx0 => { const x = rx0 - cx; if (x < -140 || x > 1340) return;
        if (P.smash.includes(rx0)) { for (let q = 0; q < 6; q++) { g.save(); g.translate(x + 30 + q * 18, road + 4 + (q % 2) * 6); g.rotate(q * 0.9); g.fillStyle = q % 2 ? '#e8e0d0' : '#e8323e'; g.fillRect(-10, -2, 20, 4); g.restore(); } return; }
        if (P.done.has(rx0)) { g.fillStyle = '#7a5530'; g.save(); g.translate(x + 40, road - 30); g.rotate(-0.3); MGH.rr(g, -30, -8, 60, 16, 7); g.fill(); g.restore(); return; }
        g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(x, road + 4, 60, 8, 0, 0, 7); g.fill();
        g.fillStyle = '#6a4424'; MGH.rr(g, x - 46, road - 14, 92, 16, 8); g.fill(); g.fillStyle = '#8a5a30'; g.beginPath(); g.ellipse(x + 46, road - 6, 6, 8, 0, 0, 7); g.fill(); g.strokeStyle = '#5a3a1a'; g.lineWidth = 1.5; g.beginPath(); g.arc(x + 46, road - 6, 3, 0, 7); g.stroke();
        for (const sd of [-1, 1]) { g.fillStyle = '#5a5a6a'; g.fillRect(x + sd * 34 - 2, road - 46, 4, 34); }
        for (let q = 0; q < 2; q++) { const yy = road - 44 + q * 14; g.save(); g.beginPath(); g.rect(x - 40, yy, 80, 10); g.clip(); g.fillStyle = '#fff'; g.fillRect(x - 40, yy, 80, 10); g.fillStyle = '#e8323e'; for (let k = -3; k < 6; k++) { g.beginPath(); g.moveTo(x - 40 + k * 18, yy + 10); g.lineTo(x - 30 + k * 18, yy); g.lineTo(x - 22 + k * 18, yy); g.lineTo(x - 32 + k * 18, yy + 10); g.fill(); } g.restore(); g.strokeStyle = '#3a2a2a'; g.lineWidth = 1.5; g.strokeRect(x - 40, yy, 80, 10); }
        for (const sd of [-1, 1]) { const cx2 = x + sd * 56; g.fillStyle = '#ff7a20'; g.beginPath(); g.moveTo(cx2 - 8, road); g.lineTo(cx2, road - 22); g.lineTo(cx2 + 8, road); g.fill(); g.fillStyle = '#fff'; g.fillRect(cx2 - 4, road - 13, 8, 4); }
        if (Math.sin(t * 6) > 0) { g.fillStyle = '#ffcc1a'; g.beginPath(); g.arc(x - 34, road - 50, 4, 0, 7); g.arc(x + 34, road - 50, 4, 0, 7); g.fill(); MGH.glow(g, x - 34, road - 50, 14, 'rgba(255,200,40,0.5)'); }
        if (P.mode === 'clear' && P.rbX === rx0) { const q = Math.min(1, P.clr / CLEAR); g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 6; g.beginPath(); g.arc(x, road - 74, 13, 0, 7); g.stroke(); g.strokeStyle = '#7cf06a'; g.beginPath(); g.arc(x, road - 74, 13, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * q); g.stroke(); MGH.text(g, 'HOLD A', x, road - 94, 12, '#fff', 'center', 'bold'); }
        else if (rx0 - P.x > 0 && rx0 - P.x < 260 && !P.fin) MGH.text(g, '⚠ B: clear · or SMASH at speed', x, road - 64, 12, '#ffe680', 'center', 'bold'); });
      // the bike (and the rider, on it or beside it)
      const bx = P.x - cx, on = P.mode === 'ride' && !(P.busy > 0 && P.busyK === 'pour'), spin = P.x * 0.08;
      this.bike(g, bx, road + 6, p.color, spin, P.mode === 'ride' && P.v > 30 ? Math.sin(t * 30) * 0.6 : 0);
      if (P.busy > 0 && P.busyK === 'refill') { g.strokeStyle = '#222'; g.lineWidth = 2; g.beginPath(); g.moveTo(this.stAt(S, P.x) - cx + 14, road - 26); g.quadraticCurveTo(bx + 30, road - 60, bx + 4, road - 30); g.stroke(); }
      const walking = P.mode === 'push' && P.v > 5;
      if (on) Char.draw(g, bx - 4, road - 40, 17, p.el.id, p.color, { mood: MGH.persona(P.z ? 'shock' : P.busy > 0 ? 'happy' : P.fuel < 2 ? 'nervous' : 'determined', p.el.id), seed: i * 1.7, look: { x: 1, y: 0 }, noFeet: true, hands: { n: { x: 1.3, y: 0.55, d: 0, o: false, m: true }, f: { x: 1.1, y: 0.7, d: 0, o: false, m: false } } });
      else { const clearing = P.mode === 'clear', rx = clearing ? P.rbX - cx - 58 : bx - 34, face = 1, tug = clearing && m.held(i, 'a') ? Math.sin(t * 12) * 0.3 : 0;
        Char.draw(g, rx, road - 22, 17, p.el.id, p.color, { mood: MGH.persona(P.z ? (P.z.res === 'grab' ? 'hurt' : 'shock') : P.mode === 'push' ? 'tired' : 'effort', p.el.id), seed: i * 1.7, look: { x: face, y: 0 }, walk: walking ? 1 : 0, t, hands: P.mode === 'push' ? { n: { x: 1.5, y: 0.1, d: 0, o: false, m: true }, f: { x: 1.3, y: 0.2, d: 0, o: false, m: false } } : { n: { x: 1.4 + tug, y: -0.1, d: 0, o: false, m: true }, f: { x: 1.2 - tug, y: 0.1, d: 0, o: false, m: false } } }); }
      if (P.z) { const Z = P.z, px = (P.mode === 'clear' ? P.rbX - 58 : P.x - 34) - cx, zx = px + 30 + Math.max(0, 1 - Z.t) * 140 - (Z.t > 1 && !Z.res ? 10 : 0) + (Z.res === 'bonk' ? Z.rt * 400 : 0);
        zombie(g, zx, road + 2, t, Z.k, Z.res === 'bonk' ? Z.rt : 0);
        if (!Z.res && Z.t > 0.6) { const ready = Z.t > 1.0; MGH.glow(g, px, road - 70, 26, ready ? 'rgba(120,255,120,0.7)' : 'rgba(255,255,255,0.3)'); g.fillStyle = ready ? '#5fd85f' : '#888'; g.beginPath(); g.arc(px, road - 70, 15, 0, 7); g.fill(); MGH.text(g, 'A', px, road - 64, 17, '#fff', 'center', 'bold'); } }
      if (P.busy > 0) { const tot = REFILL, px = bx; g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 6; g.beginPath(); g.arc(px, road - 76, 13, 0, 7); g.stroke(); g.strokeStyle = '#ffe680'; g.beginPath(); g.arc(px, road - 76, 13, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - P.busy / tot)); g.stroke(); }
      // lane panel: name, fuel gauge, can, season
      g.fillStyle = 'rgba(0,0,0,0.45)'; MGH.rr(g, 10, y0 + 8, 250, 46, 10); g.fill(); g.strokeStyle = p.color; g.lineWidth = 2.5; g.stroke();
      MGH.text(g, p.name, 20, y0 + 26, 15, p.color, 'left', 'bold'); MGH.text(g, `${se.S.n} · Year ${se.k + 1}`, 250, y0 + 26, 13, '#fff', 'right');
      g.fillStyle = 'rgba(255,255,255,0.15)'; MGH.rr(g, 20, y0 + 34, 160 * P.tank / TANK, 12, 6); g.fill(); if (P.tank < TANK) { g.fillStyle = 'rgba(160,30,30,0.6)'; MGH.rr(g, 20 + 160 * P.tank / TANK, y0 + 34, 160 * (1 - P.tank / TANK), 12, 6); g.fill(); } const fq = P.fuel / TANK; g.fillStyle = P.fuel / P.tank < 0.25 ? '#ff4a3a' : P.fuel / P.tank < 0.5 ? '#ffc34a' : '#5ae85a'; MGH.rr(g, 20, y0 + 34, 160 * fq, 12, 6); g.fill(); MGH.text(g, `⛽ ${Math.ceil(P.fuel)}/${P.tank}`, 188, y0 + 45, 12, '#fff', 'left');
      if (P.fin) MGH.label(g, `🏁 #${S.order.indexOf(i) + 1}`, 640, y0 + 70, 28, '#ffe680'); else if (S.endT !== undefined && S.endT > 2) MGH.label(g, `⏱ ${Math.ceil(S.endT)}`, 640, y0 + 70, 20, '#ff9a9a');
      if (P.msgT > 0) MGH.label(g, P.msg, Math.min(1000, bx + 120), y0 + 40, 17, '#fff');
      g.restore();
      g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(0, y0 + h - 2, 1230, 3);
    },
    prop(g, x, y, sk, v, t, k) {
      if (sk === 0) { if (v === 0) { for (let q = 0; q < 5; q++) { const fx = x + q * 9 - 18; g.strokeStyle = '#3a9a3a'; g.lineWidth = 2; g.beginPath(); g.moveTo(fx, y); g.lineTo(fx, y - 16); g.stroke(); g.fillStyle = ['#ff5a7a', '#ffd34d', '#c88aff', '#ff8a3a', '#fff'][q]; g.beginPath(); g.moveTo(fx - 5, y - 16); g.lineTo(fx - 5, y - 24); g.lineTo(fx, y - 20); g.lineTo(fx + 5, y - 24); g.lineTo(fx + 5, y - 16); g.quadraticCurveTo(fx, y - 12, fx - 5, y - 16); g.fill(); } }
        else if (v === 1) { const hop = Math.abs(Math.sin(t * 4 + k)) * 6; g.fillStyle = '#f4f0f0'; g.beginPath(); g.ellipse(x, y - 8 - hop, 10, 7, 0, 0, 7); g.arc(x + 8, y - 14 - hop, 6, 0, 7); g.fill(); g.beginPath(); g.ellipse(x + 7, y - 24 - hop, 2, 6, -0.2, 0, 7); g.ellipse(x + 11, y - 24 - hop, 2, 6, 0.2, 0, 7); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.arc(x + 10, y - 15 - hop, 1.2, 0, 7); g.fill(); }
        else { g.fillStyle = '#c84a3a'; MGH.rr(g, x - 6, y - 26, 12, 26, 2); g.fill(); g.fillStyle = '#3a3a48'; MGH.rr(g, x - 12, y - 40, 24, 16, 6); g.fill(); g.fillStyle = '#e8323e'; g.fillRect(x + 12, y - 40, 3, 10); } }
      if (sk === 1) { if (v === 0) { for (const dx of [-12, 10]) { g.strokeStyle = '#4a9a3a'; g.lineWidth = 3; g.beginPath(); g.moveTo(x + dx, y); g.lineTo(x + dx, y - 36); g.stroke(); for (let p = 0; p < 10; p++) { const a = p / 10 * 6.28; g.fillStyle = '#ffd34d'; g.beginPath(); g.ellipse(x + dx + Math.cos(a) * 7, y - 40 + Math.sin(a) * 7, 4, 2, a, 0, 7); g.fill(); } g.fillStyle = '#6a3a1a'; g.beginPath(); g.arc(x + dx, y - 40, 5, 0, 7); g.fill(); } }
        else if (v === 1) { g.fillStyle = '#fff'; MGH.rr(g, x - 20, y - 26, 40, 22, 4); g.fill(); g.fillStyle = '#ff8ac8'; g.fillRect(x - 20, y - 26, 40, 6); g.fillStyle = '#3a3a48'; g.beginPath(); g.arc(x - 12, y - 2, 4, 0, 7); g.arc(x + 12, y - 2, 4, 0, 7); g.fill(); for (let q = 0; q < 4; q++) { g.fillStyle = q % 2 ? '#ff8ac8' : '#fff'; g.beginPath(); g.moveTo(x, y - 52); g.arc(x, y - 50, 24, Math.PI + q * Math.PI / 4, Math.PI + (q + 1) * Math.PI / 4); g.fill(); } g.fillStyle = '#ccc'; g.fillRect(x - 1, y - 50, 2, 24); }
        else { g.fillStyle = '#e8c078'; g.beginPath(); g.ellipse(x, y - 2, 26, 6, 0, 0, 7); g.fill(); g.fillStyle = ['#e8323e', '#2a6ae8'][k % 2]; g.beginPath(); g.arc(x + 4, y - 10, 8, 0, 7); g.fill(); g.fillStyle = '#fff'; g.fillRect(x - 4, y - 11, 16, 2); } }
      if (sk === 2) { if (v === 0) { for (const [dx, r] of [[-10, 9], [8, 11]]) { g.fillStyle = '#ff8a2a'; g.beginPath(); g.ellipse(x + dx, y - r, r * 1.2, r, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(160,70,10,0.5)'; g.lineWidth = 1.5; g.beginPath(); g.ellipse(x + dx, y - r, r * 0.4, r, 0, 0, 7); g.stroke(); g.fillStyle = '#3a6a2a'; g.fillRect(x + dx - 1.5, y - r * 2 - 4, 3, 5); } }
        else if (v === 1) { g.fillStyle = '#e8c060'; MGH.rr(g, x - 22, y - 30, 44, 30, 6); g.fill(); g.strokeStyle = 'rgba(160,110,30,0.6)'; g.lineWidth = 1.5; for (let q = 0; q < 4; q++) { g.beginPath(); g.moveTo(x - 20, y - 24 + q * 7); g.lineTo(x + 20, y - 24 + q * 7); g.stroke(); } }
        else { g.strokeStyle = '#7a5a3a'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 40); g.moveTo(x - 18, y - 30); g.lineTo(x + 18, y - 30); g.stroke(); g.fillStyle = '#a8703a'; g.fillRect(x - 8, y - 30, 16, 16); g.fillStyle = '#f4d090'; g.beginPath(); g.arc(x, y - 44, 7, 0, 7); g.fill(); g.fillStyle = '#5a3a1a'; g.beginPath(); g.moveTo(x - 12, y - 48); g.lineTo(x + 12, y - 48); g.lineTo(x, y - 60); g.fill(); } }
      if (sk === 3) { if (v === 0) { g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y - 10, 11, 0, 7); g.arc(x, y - 26, 8, 0, 7); g.fill(); g.fillStyle = '#ff8a2a'; g.beginPath(); g.moveTo(x + 6, y - 27); g.lineTo(x + 14, y - 25); g.lineTo(x + 6, y - 24); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.arc(x + 2, y - 29, 1.4, 0, 7); g.fill(); g.fillStyle = '#e8323e'; g.fillRect(x - 8, y - 20, 16, 3); g.fillStyle = '#2a2a3a'; g.fillRect(x - 6, y - 40, 12, 8); g.fillRect(x - 9, y - 33, 18, 2); }
        else if (v === 1) { g.fillStyle = '#2a5a3a'; for (let q = 0; q < 3; q++) { g.beginPath(); g.moveTo(x - 18 + q * 4, y - 6 - q * 14); g.lineTo(x, y - 30 - q * 14); g.lineTo(x + 18 - q * 4, y - 6 - q * 14); g.fill(); } g.fillStyle = '#fff'; for (let q = 0; q < 3; q++) g.fillRect(x - 14 + q * 4, y - 8 - q * 14, 28 - q * 8, 2); for (let q = 0; q < 6; q++) { g.fillStyle = ['#ff5a5a', '#ffd34d', '#5ac8ff'][(q + Math.floor(t * 3)) % 3]; g.beginPath(); g.arc(x - 10 + (q * 7) % 20, y - 12 - q * 6, 2, 0, 7); g.fill(); } MGH.star(g, x, y - 72, 5, '#ffd34d', 0, false); }
        else { for (const [dx, c] of [[-10, '#e8323e'], [8, '#2a8ae8']]) { g.fillStyle = c; g.fillRect(x + dx - 8, y - 14, 16, 14); g.fillStyle = '#ffd34d'; g.fillRect(x + dx - 1.5, y - 14, 3, 14); g.fillRect(x + dx - 8, y - 9, 16, 3); } } }
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
