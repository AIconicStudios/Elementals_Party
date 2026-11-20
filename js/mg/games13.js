'use strict';
// 65 ---------------------------------------------------------------- The Traitors of Moonhold Castle
// A hidden-role game for one shared screen. The game secretly makes one player the Traitor.
//   The wave    everyone quietly presses A. A Faithful waves on A; the Traitor's A does nothing, so they
//               know who they are and press B to wave instead. Everyone sees only four waves.
//   The mission each player must pour their OWN quota of moon-water into the cauldron before time runs out
//               (only those who finish can share the prize). Once, at a random moment, the Traitor gives
//               away one tiny tell for about 0.15 s — a soft red-tinted-blue flicker, easy to miss.
//   The vote    one secret vote: press the button of the seat you suspect (Y top, B right, A bottom, X left;
//               keyboard: the arrow / direction keys). Catch the Traitor and every Faithful who filled their
//               quota wins; if the Traitor survives the vote, the Traitor wins.
(() => {
  const CAUL = { x: 640, y: 372 };
  const WELLS = [{ x: 170, y: 175 }, { x: 1110, y: 175 }, { x: 170, y: 585 }, { x: 1110, y: 585 }];
  const MISSION = 50, FILL = 0.7, QUOTA = 9, HINT_T = 1.0;
  // round table seats, laid out like a gamepad's face buttons (and the arrow keys)
  const SEATS = [{ x: 640, y: 290, btn: 'y', key: 'up', lab: 'Y', arrow: '▲', col: '#ffd34d' }, { x: 900, y: 440, btn: 'b', key: 'right', lab: 'B', arrow: '▶', col: '#ff5a5a' },
    { x: 640, y: 590, btn: 'a', key: 'down', lab: 'A', arrow: '▼', col: '#5fd85f' }, { x: 380, y: 440, btn: 'x', key: 'left', lab: 'X', arrow: '◀', col: '#4f9dff' }];
  // calm, simple animations only (no random hops, spins or fidgets that could look like a 'tell')
  const av = (g, m, i, x, y, r, mood, o = {}) => MGH.av(g, m, i, x, y, r, mood === 'nervous' ? 'neutral' : mood, Object.assign({ noIdle: true }, o));
  const MAUVE = a => `rgba(160,95,215,${Math.min(1, a * 1.25)})`; // the hint colour: blue with a tint of red
  // twenty tiny tells; exactly one happens per game
  const HINTS = ['vial', 'eye', 'smirk', 'cloak', 'shadow', 'name', 'glance', 'horns', 'smoke', 'feather',
    'aura', 'footprint', 'well', 'drop', 'glint', 'crow', 'hem', 'dagger', 'slit', 'tint'];
  const NEEDS = { vial: P => P.carry, drop: P => P.carry, well: P => P.fill > 0.1 };

  MG.def({
    id: 'traitors', name: 'The Traitors', type: 'Deduction', controls: 'Move + A & B buttons', thumbT: 10, noPadSkip: true,
    how: 'The castle has secretly chosen one TRAITOR. THE WAVE: everyone quietly presses A — if your character doesn\'t wave, YOU are the Traitor: press B instead (nobody can tell the difference). THE MISSION: fill vials at the moon-wells and pour them into the cauldron (A) — everyone must pour their own 9 before time runs out, or they can\'t share the prize. Once, at a random moment, the Traitor gives away one tiny tell for a split second… keep half an eye on everyone! THE VOTE: one secret vote — press the button shown at the seat you suspect (gamepad Y top · B right · A bottom · X left, keyboard arrows). Catch the Traitor and every Faithful who finished their mission wins; if the Traitor survives, the Traitor wins.',
    wins: 'Faithful who filled their quota, if the Traitor is voted out; otherwise the Traitor.',
    init(m, S) {
      S.traitor = R.int(0, 3);
      S.P = [0, 1, 2, 3].map(i => Object.assign(MGH.body(CAUL.x + [-90, 90, -90, 90][i], CAUL.y + [-90, -90, 110, 110][i], 22), { carry: 0, fill: 0, pours: 0, waved: false, waveT: 0, nope: 0, botWave: R.range(0.8, 3.2), idle: 0, spd: R.range(0.86, 1), goal: null, voted: false }));
      S.phase = 'wave'; S.t = 0; S.mT = 0; S.pot = 0; S.sparks = []; S.vote = {}; S.order = []; S.shown = 0;
      S.day = Math.random() < 0.5; // a day mission or a night mission
      S.hint = { kind: R.pick(HINTS), at: R.range(9, MISSION - 9), on: -1, seen: [false, false, false, false] };
    },
    // ---------------------------------------------------------------- update
    update(m, S, dt) {
      S.t += dt;
      for (const s of S.sparks) { s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 300 * dt; }
      S.sparks = S.sparks.filter(s => s.t < s.life);
      const ph = S.phase;
      if (ph === 'wave') return this.updWave(m, S, dt);
      if (ph === 'brief') { if (S.t > 4.4) { S.phase = 'mission'; S.t = 0; Sfx.whistle(); } return; }
      if (ph === 'mission') return this.updMission(m, S, dt);
      if (ph === 'outcome') { if (S.t > 4.2) { S.phase = 'vote'; S.t = 0; } return; }
      if (ph === 'vote') return this.updVote(m, S, dt);
      if (ph === 'reveal') return this.updReveal(m, S, dt);
      if (ph === 'coin') {
        const k = Math.round(this.coinAng(S) / Math.PI); if (k !== S.coinK) { S.coinK = k; Sfx.tone(1200 + (k % 2) * 200, 0.03, 'triangle', 0.03); }
        if (S.t > 4.6) { S.phase = 'banish'; S.t = 0; Sfx.drum(0); Sfx.drum(3); }
        return;
      }
      if (ph === 'banish') {
        if (S.t > 2.4 && !S.unmasked) { S.unmasked = true; if (S.banished === S.traitor) { Sfx.crowd('happy'); Sfx.star(); } else { Sfx.tone(220, 0.6, 'sine', 0.07, -80); Sfx.crowd('ooh'); } }
        if (S.t > 5.6) { S.phase = 'end'; S.t = 0; S.winner = S.banished === S.traitor ? 'faithful' : 'traitor'; if (S.winner === 'traitor') Sfx.thunder(); }
        return;
      }
      if (ph === 'end' && S.t > 7) m.finish(this.score(m, S));
    },
    // everyone presses A; only the Traitor's B works (and their A does nothing)
    updWave(m, S, dt) {
      S.P.forEach((P, i) => {
        P.nope = Math.max(0, P.nope - dt);
        if (P.waved) { P.waveT += dt; return; }
        if (m.bot(i)) { P.botWave -= dt; if (P.botWave <= 0) this.wave(S, i); return; }
        const tr = i === S.traitor;
        if (m.pressed(i, tr ? 'b' : 'a')) this.wave(S, i);
      });
      if (S.P.every(P => P.waved && P.waveT > 1.2)) { S.phase = 'brief'; S.t = 0; }
    },
    wave(S, i) { const P = S.P[i]; P.waved = true; P.waveT = 0; Sfx.tone(560 + i * 70, 0.12, 'triangle', 0.05); },
    pour(m, S, i) {
      const P = S.P[i]; P.carry = 0; P.pours++; S.pot += 2;
      for (let k = 0; k < 12; k++) S.sparks.push({ x: CAUL.x + R.range(-30, 30), y: CAUL.y - 40, vx: R.range(-120, 120), vy: R.range(-300, -110), t: 0, life: R.range(0.4, 0.8), c: R.pick(['#9fe8ff', '#ffffff', m.players[i].color]) });
      if (!m.bot(i)) { Sfx.tone(700, 0.08, 'sine', 0.05, -300); if (P.pours === QUOTA) { Sfx.star(); MGH.pop('✔ QUOTA FILLED!', P.x, P.y - 80, '#9fffa0', 26); } }
    },
    updMission(m, S, dt) {
      S.mT += dt;
      S.P.forEach((P, i) => {
        const a = m.axis(i);
        MGH.steer(P, a.x, a.y, dt, 2300, 270, 8); MGH.integrate(P, dt, 30, 70, 1250, 650);
        const dx = P.x - CAUL.x, dy = P.y - CAUL.y, d = Math.hypot(dx, dy) || 1; if (d < 74) { P.x = CAUL.x + dx / d * 74; P.y = CAUL.y + dy / d * 74; }
        const w = WELLS.find(w => Math.hypot(w.x - P.x, w.y - P.y) < 62);
        if (w && !P.carry) { P.fill += dt; if (P.fill >= FILL) { P.carry = 1; P.fill = 0; if (!m.bot(i)) Sfx.tone(880, 0.06, 'triangle', 0.05); } } else if (!w) P.fill = 0;
        if (P.carry && d < 120 && (m.pressed(i, 'a') || m.pressed(i, 'b'))) this.pour(m, S, i);
      });
      MGH.collide(S.P, 0.4);
      // the one tell: it waits (a little) until it can actually show — e.g. a vial tell needs a vial in hand
      const H = S.hint, T = S.P[S.traitor];
      if (H.on < 0 && S.mT >= H.at && (!NEEDS[H.kind] || NEEDS[H.kind](T) || S.mT > H.at + 6)) {
        H.on = S.mT; if (NEEDS[H.kind] && !NEEDS[H.kind](T)) H.kind = 'tint';
        // bots only catch it if they happen to be looking (a third of the time)
        S.P.forEach((P, i) => { if (m.bot(i) && i !== S.traitor) H.seen[i] = Math.random() < 0.34; });
      }
      if (S.mT >= MISSION) { S.phase = 'outcome'; S.t = 0; Sfx.tone(660, 0.3, 'triangle', 0.06); }
    },
    // the coin spins fast and slows down, landing face-up on the one who is ousted
    coinAng(S) { const T = 3.4, q = Math.min(1, S.t / T); return S.coin.half * Math.PI * (1 - Math.pow(1 - q, 3)); },
    hintOn(S) { return S.phase === 'mission' && S.hint.on >= 0 && S.mT - S.hint.on < HINT_T; },
    // ---------------------------------------------------------------- the vote
    updVote(m, S, dt) {
      S.P.forEach((P, i) => {
        if (P.voted) return;
        if (m.bot(i)) {
          P.think = (P.think || R.range(1.2, 3.6)) - dt;
          if (P.think <= 0) {
            const others = [0, 1, 2, 3].filter(j => j !== i);
            S.vote[i] = i !== S.traitor && S.hint.seen[i] ? S.traitor : R.pick(others); P.voted = true; Sfx.click();
          }
          return;
        }
        for (let j = 0; j < 4; j++) {
          if (j === i) continue;
          const st = SEATS[j];
          if (m.pressed(i, st.btn) || m.pressed(i, st.key)) { S.vote[i] = j; P.voted = true; Sfx.click(); break; }
        }
      });
      if (S.P.every(P => P.voted) && S.t > 1) { S.phase = 'reveal'; S.t = 0; S.order = R.shuffle([0, 1, 2, 3]); S.shown = 0; Sfx.drum(2); }
    },
    updReveal(m, S, dt) {
      const n = Math.floor(S.t / 1.6);
      if (n > S.shown && S.shown < 4) { S.shown++; Sfx.drum(1); Sfx.tone(300 + S.shown * 60, 0.2, 'triangle', 0.06); }
      if (S.t > 4 * 1.6 + 2.2) {
        const tally = [0, 0, 0, 0]; for (const v of Object.values(S.vote)) tally[v]++;
        const max = Math.max(...tally), top = [0, 1, 2, 3].filter(j => tally[j] === max);
        S.tie = top.length > 1; S.tally = tally; S.banished = R.pick(top); S.unmasked = false;
        if (S.tie) { const n = top.length, idx = top.indexOf(S.banished); S.coin = { c: top, half: 14 + ((idx - 14 % n) + n) % n }; S.phase = 'coin'; S.t = 0; Sfx.tone(900, 0.1, 'triangle', 0.05); }
        else { S.phase = 'banish'; S.t = 0; Sfx.drum(0); Sfx.drum(3); }
      }
    },
    // ---------------------------------------------------------------- bots: fill, pour, repeat (each at their own pace)
    bot(m, S, i, dt) {
      const v = m.vin[i], P = S.P[i]; v.a = v.b = false; v.ax = v.ay = 0; v.left = v.right = v.up = v.down = false;
      if (S.phase !== 'mission') return;
      if (P.idle > 0) { P.idle -= dt; return; }
      if (!P.carry) {
        if (!P.goal) { const ws = WELLS.slice().sort((a, b) => Math.hypot(a.x - P.x, a.y - P.y) - Math.hypot(b.x - P.x, b.y - P.y)); P.goal = ws[Math.random() < 0.8 ? 0 : 1]; }
        if (Math.hypot(P.goal.x - P.x, P.goal.y - P.y) > 30) this.go(v, P, P.goal);
        return;
      }
      if (P.goal) { P.goal = null; if (Math.random() < 0.15) { P.idle = R.range(0.2, 0.7); return; } }
      if (Math.hypot(CAUL.x - P.x, CAUL.y - P.y) > 105) { this.go(v, P, CAUL); return; }
      v.a = !m.prev[i].a;
    },
    go(v, P, t) { const dx = t.x - P.x, dy = t.y - P.y, d = Math.hypot(dx, dy) || 1; v.ax = dx / d * P.spd; v.ay = dy / d * P.spd; },
    // ---------------------------------------------------------------- scoring
    done(S, i) { return S.P[i].pours >= QUOTA; },
    score(m, S) {
      const winners = [0, 1, 2, 3].filter(i => i !== S.traitor && this.done(S, i));
      return [0, 1, 2, 3].map(i => {
        if (i === S.traitor) return S.winner === 'traitor' ? 1000 + S.pot : 5;
        if (S.winner === 'faithful') return this.done(S, i) ? 500 + Math.round(S.pot / Math.max(1, winners.length)) : 40;
        return this.done(S, i) ? 30 : 20;
      });
    },
    fmt(s) { return s >= 1000 ? `Traitor escaped with ${s - 1000} gold` : s >= 500 ? `Faithful winner · ${s - 500} gold` : s === 40 ? 'Faithful — mission unfinished' : s >= 20 ? 'fooled by the Traitor' : 'caught Traitor'; },
    hud(m, S, i) { const P = S.P[i]; if (S.phase === 'end') return i === S.traitor ? '🗡️ Traitor' : `${P.pours >= QUOTA ? '✔' : '✖'} ${P.pours}/${QUOTA}`; return S.phase === 'wave' || S.phase === 'brief' ? (P.waved ? '👋' : '…') : `🧪 ${Math.min(P.pours, QUOTA)}/${QUOTA}`; },
    // ---------------------------------------------------------------- drawing
    draw(m, S, g) {
      const ph = S.phase;
      if (ph === 'wave') return this.drawWave(m, S, g);
      if (ph === 'brief' || ph === 'mission' || ph === 'outcome') this.drawCourt(m, S, g); else this.drawHall(m, S, g);
      for (const s of S.sparks) { g.globalAlpha = 1 - s.t / s.life; g.fillStyle = s.c; g.beginPath(); g.arc(s.x, s.y, 4, 0, 7); g.fill(); } g.globalAlpha = 1;
      if (ph === 'brief') this.banner(g, S.day ? '☀️ THE DAY MISSION' : '🌙 THE NIGHT MISSION', `Everyone must pour ${QUOTA} vials of ${S.day ? 'sun-warmed spring water' : 'moon-water'} into the cauldron in ${MISSION} s — only those who finish can share the prize. And somewhere among you… a Traitor.`, S.t);
      if (ph === 'outcome') this.drawOutcome(m, S, g);
    },
    banner(g, title, sub, t, col = '#ffe680') {
      const k = Math.min(1, t / 0.4);
      g.save(); g.globalAlpha = k; g.fillStyle = 'rgba(8,4,24,0.84)'; MGH.rr(g, 220, 240, 840, 190, 22); g.fill(); g.strokeStyle = col; g.lineWidth = 3; g.stroke();
      g.font = 'bold 48px Georgia'; g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 8; g.strokeStyle = '#1a0f3a'; g.strokeText(title, 640, 314); g.fillStyle = col; g.fillText(title, 640, 314);
      MGH.wrap(g, sub, 640, 360, 760, 28, '#fff', 21); g.restore();
    },
    // the wave screen
    drawWave(m, S, g) {
      const t = m.t;
      g.fillStyle = MGH.grad(g, 40, 720, ['#1a0c20', '#0a0612']); g.fillRect(0, 40, 1280, 680);
      MGH.glow(g, 640, 430, 420, 'rgba(180,60,90,0.22)');
      for (const x of [90, 1190]) { MGH.flame(g, x, 146, 0.8, t, x); }
      g.font = 'bold 50px Georgia'; g.textAlign = 'center'; g.fillStyle = '#e8d8ff'; g.fillText('THE TRAITORS', 640, 108);
      MGH.text(g, 'of Moonhold Castle', 640, 140, 21, '#b8a0d8');
      MGH.text(g, '🤫 Everyone, press  A  — quietly.', 640, 196, 28, '#ffe680', 'center', 'bold');
      MGH.text(g, 'If your character does NOT wave… you are the Traitor. Press  B  instead — and keep a straight face.', 640, 230, 19, '#e8d0f0');
      S.P.forEach((P, i) => {
        const x = 220 + i * 280, y = 470, col = m.players[i].color;
        g.fillStyle = 'rgba(255,255,255,0.05)'; MGH.rr(g, x - 110, 290, 220, 330, 20); g.fill(); g.strokeStyle = col; g.lineWidth = 3; g.globalAlpha = 0.6; g.stroke(); g.globalAlpha = 1;
        MGH.shadow(g, x, y + 70, 50, 0.4);
        Char._wave = P.waved && P.waveT < 2.4;
        Char.draw(g, x, y, 54, m.players[i].el.id, col, { mood: P.waved ? 'happy' : 'neutral', t: t + i, seed: i * 1.7, look: { x: 0, y: 0.1 }, noIdle: true });
        Char._wave = false;
        MGH.text(g, m.players[i].name, x, 585, 24, col, 'center', 'bold');
        MGH.text(g, P.waved ? '👋 waved' : '…', x, 612, 18, P.waved ? '#cfe8ff' : '#8a7aa8', 'center', 'bold');
      });
      MGH.text(g, 'Everyone sees the same thing: a wave. Nobody can tell whose wave came from A and whose from B.', 640, 680, 17, '#b8a8d8');
    },
    // the moonlit castle courtyard
    drawCourt(m, S, g) {
      const t = m.t, day = S.day;
      if (day) {
        // the day mission: warm sandstone in bright sunshine, drifting pollen and sunbeams
        g.fillStyle = MGH.grad(g, 40, 720, ['#d8c8a8', '#cbb894', '#b8a07a']); g.fillRect(0, 40, 1280, 680);
        for (let y = 60; y < 700; y += 56) for (let x = (Math.floor(y / 56) % 2) * 40; x < 1280; x += 80) { g.fillStyle = (x * 7 + y * 3) % 5 ? 'rgba(255,250,235,0.28)' : 'rgba(140,110,70,0.16)'; MGH.rr(g, x + 3, y + 3, 74, 50, 6); g.fill(); }
        g.save(); g.globalAlpha = 0.16; g.fillStyle = '#fff8d8'; for (let k = 0; k < 5; k++) { const bx = 120 + k * 300 + Math.sin(t * 0.2 + k) * 20; g.beginPath(); g.moveTo(bx, 40); g.lineTo(bx + 90, 40); g.lineTo(bx - 120, 720); g.lineTo(bx - 260, 720); g.fill(); } g.restore();
        for (let k = 0; k < 24; k++) { const x = (k * 157 + t * 18) % 1280, y = 80 + (k * 97 + Math.sin(t + k) * 20) % 600; g.fillStyle = 'rgba(255,250,210,0.7)'; g.beginPath(); g.arc(x, y, 2, 0, 7); g.fill(); }
        g.fillStyle = MGH.grad(g, 40, 70, ['#a88a62', '#8a6e4a']); g.fillRect(0, 40, 1280, 28);
        for (let x = 0; x < 1280; x += 64) { g.fillStyle = '#a88a62'; g.fillRect(x, 32, 40, 14); }
        for (const tx of [90, 450, 830, 1190]) { g.fillStyle = '#5a4a3a'; g.fillRect(tx - 4, 48, 8, 18); g.fillStyle = '#3a6a3a'; g.beginPath(); g.arc(tx, 46, 12, 0, 7); g.fill(); } // potted plants
      } else {
        g.fillStyle = MGH.grad(g, 40, 720, ['#141a3a', '#1c2448', '#10142a']); g.fillRect(0, 40, 1280, 680);
        for (let y = 60; y < 700; y += 56) for (let x = (Math.floor(y / 56) % 2) * 40; x < 1280; x += 80) { g.fillStyle = (x * 7 + y * 3) % 5 ? 'rgba(90,100,150,0.18)' : 'rgba(110,120,170,0.24)'; MGH.rr(g, x + 3, y + 3, 74, 50, 6); g.fill(); }
        MGH.glow(g, 640, 380, 520, 'rgba(160,190,255,0.16)');
        for (let k = 0; k < 6; k++) { const x = ((k * 260 + t * 14) % 1600) - 160, y = 120 + k * 95; g.fillStyle = 'rgba(200,210,255,0.06)'; g.beginPath(); g.ellipse(x, y, 220, 40, 0, 0, 7); g.fill(); }
        g.fillStyle = MGH.grad(g, 40, 70, ['#2a2e4a', '#1a1e34']); g.fillRect(0, 40, 1280, 28);
        for (let x = 0; x < 1280; x += 64) { g.fillStyle = '#2a2e4a'; g.fillRect(x, 32, 40, 14); }
        for (const tx of [90, 450, 830, 1190]) { MGH.flame(g, tx, 68, 0.62, t, tx); }
      }
      const hint = this.hintOn(S) ? S.hint.kind : null, T = S.P[S.traitor];
      WELLS.forEach((w, k) => {
        MGH.glow(g, w.x, w.y, 90, 'rgba(120,200,255,0.3)');
        g.fillStyle = '#4a4e6a'; g.beginPath(); g.ellipse(w.x, w.y + 8, 56, 26, 0, 0, 7); g.fill();
        g.fillStyle = '#6a6e8a'; g.beginPath(); g.ellipse(w.x, w.y, 56, 26, 0, 0, 7); g.fill();
        const dark = hint === 'well' && Math.hypot(w.x - T.x, w.y - T.y) < 70;
        g.fillStyle = dark ? 'rgba(130,120,215,0.85)' : `rgba(120,210,255,${0.75 + 0.15 * Math.sin(t * 3 + k)})`; g.beginPath(); g.ellipse(w.x, w.y, 42, 17, 0, 0, 7); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.ellipse(w.x - 12, w.y - 4, 10 + 3 * Math.sin(t * 2 + k), 3, 0, 0, 7); g.fill();
        MGH.text(g, day ? '☀️' : '🌙', w.x, w.y - 36, 18, '#fff');
      });
      // the cauldron
      MGH.glow(g, CAUL.x, CAUL.y - 30, 170, day ? 'rgba(255,230,150,0.45)' : 'rgba(120,180,255,0.35)');
      g.fillStyle = '#2a2a34'; g.beginPath(); g.ellipse(CAUL.x, CAUL.y + 34, 92, 30, 0, 0, 7); g.fill();
      g.fillStyle = MGH.grad(g, CAUL.y - 50, CAUL.y + 50, ['#3a3a48', '#16161e']); g.beginPath(); g.moveTo(CAUL.x - 86, CAUL.y - 40); g.quadraticCurveTo(CAUL.x - 100, CAUL.y + 50, CAUL.x, CAUL.y + 56); g.quadraticCurveTo(CAUL.x + 100, CAUL.y + 50, CAUL.x + 86, CAUL.y - 40); g.closePath(); g.fill();
      g.fillStyle = '#7fd0ff'; g.beginPath(); g.ellipse(CAUL.x, CAUL.y - 40, 82, 22, 0, 0, 7); g.fill();
      for (let k = 0; k < 5; k++) { const bx = CAUL.x - 50 + ((k * 37 + t * 40) % 100), by = CAUL.y - 42 + Math.sin(t * 4 + k) * 4; g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.arc(bx, by, 4 + (k % 2) * 2, 0, 7); g.fill(); }
      g.strokeStyle = '#5a5a6a'; g.lineWidth = 6; g.beginPath(); g.ellipse(CAUL.x, CAUL.y - 40, 86, 24, 0, 0, 7); g.stroke();
      MGH.text(g, `💰 prize ${S.pot} gold`, CAUL.x, CAUL.y + 92, 17, '#ffe680', 'center', 'bold');
      // players
      [0, 1, 2, 3].sort((a, b) => S.P[a].y - S.P[b].y).forEach(i => this.drawCourtPlayer(m, S, g, i, i === S.traitor ? hint : null));
      if (S.phase === 'mission') { const left = Math.max(0, MISSION - S.mT); MGH.label(g, `⏳ ${Math.ceil(left)}s`, 1200, 100, 22, left < 10 ? '#ff8a8a' : '#fff'); }
    },
    drawCourtPlayer(m, S, g, i, h) {
      const P = S.P[i], t = m.t, col = m.players[i].color, done = P.pours >= QUOTA;
      // the shadow (the 'shadow' tell tints it)
      g.fillStyle = h === 'shadow' ? 'rgba(90,30,110,0.7)' : 'rgba(0,0,0,0.4)'; g.beginPath(); g.ellipse(P.x, P.y + 24, h === 'shadow' ? 30 : 24, h === 'shadow' ? 9 : 7, 0, 0, 7); g.fill();
      if (h === 'footprint') { g.fillStyle = MAUVE(0.75); g.beginPath(); g.ellipse(P.x - P.face.x * 34, P.y + 26 - P.face.y * 20, 6, 3, 0, 0, 7); g.fill(); }
      if (h === 'smoke') { g.fillStyle = MAUVE(0.5); g.beginPath(); g.arc(P.x - 10, P.y + 18, 12, 0, 7); g.arc(P.x + 8, P.y + 20, 9, 0, 7); g.fill(); }
      if (h === 'aura') { g.strokeStyle = MAUVE(0.65); g.lineWidth = 2; g.beginPath(); g.ellipse(P.x, P.y - 10, 34, 46, 0, 0, 7); g.stroke(); }
      this.cloak(g, P.x, P.y - 6, 1, h === 'hem' ? '#9a6ad8' : col, t + i, h === 'cloak');
      av(g, m, i, P.x, P.y, 24, h === 'smirk' ? 'smug' : done ? 'happy' : P.carry ? 'determined' : 'happy', { look: h === 'glance' ? { x: 0, y: 0 } : P.face });
      if (h === 'tint') { g.fillStyle = MAUVE(0.24); g.beginPath(); g.ellipse(P.x, P.y - 14, 26, 38, 0, 0, 7); g.fill(); }
      const ex = P.x + (P.face.x >= 0 ? 8 : -8), ey = P.y - 34;
      if (h === 'eye') { g.fillStyle = MAUVE(0.9); g.beginPath(); g.arc(ex, ey, 3.6, 0, 7); g.fill(); }
      if (h === 'slit') { g.fillStyle = 'rgba(110,50,150,0.85)'; g.fillRect(ex - 1.3, ey - 4.5, 2.6, 9); }
      if (h === 'horns') { g.fillStyle = 'rgba(110,60,150,0.75)'; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(P.x + s * 12, P.y - 74); g.lineTo(P.x + s * 19, P.y - 90); g.lineTo(P.x + s * 22, P.y - 72); g.fill(); } }
      if (h === 'feather') { g.save(); g.translate(P.x + 30, P.y - 20); g.rotate(0.6); g.fillStyle = 'rgba(80,50,110,0.85)'; g.beginPath(); g.ellipse(0, 0, 3.5, 11, 0, 0, 7); g.fill(); g.restore(); }
      if (h === 'crow') { g.strokeStyle = 'rgba(70,40,100,0.8)'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(P.x - 10, P.y - 92); g.quadraticCurveTo(P.x - 5, P.y - 98, P.x, P.y - 92); g.quadraticCurveTo(P.x + 5, P.y - 98, P.x + 10, P.y - 92); g.stroke(); }
      if (h === 'dagger') { g.save(); g.translate(P.x - 24, P.y - 4); g.rotate(-0.5); g.fillStyle = MAUVE(0.8); g.fillRect(-1.5, -10, 3, 12); g.fillRect(-4, 1, 8, 2); g.restore(); }
      if (h === 'glint') { MGH.spark(g, P.x - 14, P.y + 6, 7, MAUVE(0.95)); }
      if (P.carry) this.vial(g, P.x + 26, P.y - 46, h === 'vial', h === 'drop');
      else if (P.fill > 0) { g.strokeStyle = '#9fe8ff'; g.lineWidth = 4; g.beginPath(); g.arc(P.x, P.y - 74, 12, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * P.fill / FILL); g.stroke(); }
      // name and personal quota
      if (S.day) { g.fillStyle = 'rgba(30,20,40,0.55)'; MGH.rr(g, P.x - 32, P.y + 31, 64, 17, 8); g.fill(); }
      MGH.text(g, m.players[i].name, P.x, P.y + 44, h === 'name' ? 14 : 13, h === 'name' ? '#b48cf0' : col, 'center', 'bold');
      const q = Math.min(1, P.pours / QUOTA);
      g.fillStyle = 'rgba(0,0,0,0.5)'; MGH.rr(g, P.x - 26, P.y + 50, 52, 8, 4); g.fill(); g.fillStyle = done ? '#7cf06a' : '#9fe8ff'; MGH.rr(g, P.x - 26, P.y + 50, 52 * q, 8, 4); g.fill();
      if (done) MGH.text(g, '✔', P.x + 34, P.y + 58, 13, '#7cf06a', 'center', 'bold');
    },
    cloak(g, x, y, s, col, t, tell) {
      g.save(); g.translate(x, y); g.scale(s, s);
      g.fillStyle = tell ? MGH.grad(g, -28, 34, ['#7e3a86', '#4a1a48']) : MGH.grad(g, -28, 34, ['#5a3a7a', '#2a1a3a']);
      g.beginPath(); g.moveTo(-26, -28); g.quadraticCurveTo(-40 + Math.sin(t * 2) * 3, 10, -34, 34); g.lineTo(34, 34); g.quadraticCurveTo(40 + Math.sin(t * 2 + 1) * 3, 10, 26, -28); g.closePath(); g.fill();
      g.strokeStyle = col; g.lineWidth = col === '#9a6ad8' ? 4 : 3; g.globalAlpha = 0.8; g.beginPath(); g.moveTo(-34, 34); g.lineTo(34, 34); g.stroke(); g.globalAlpha = 1;
      g.restore();
    },
    vial(g, x, y, tell, drop) {
      MGH.glow(g, x, y, 22, tell ? 'rgba(170,130,235,0.4)' : 'rgba(140,220,255,0.6)');
      g.fillStyle = tell ? '#9a8ae6' : '#7fd0ff'; g.beginPath(); g.arc(x, y + 4, 8, 0, 7); g.fill();
      g.fillStyle = tell ? 'rgba(225,215,255,0.75)' : 'rgba(255,255,255,0.7)'; g.fillRect(x - 3, y - 12, 6, 10); g.fillStyle = '#8a5a3a'; g.fillRect(x - 4, y - 15, 8, 4);
      if (drop) { g.fillStyle = MAUVE(0.9); g.beginPath(); g.arc(x, y + 18, 3.6, 0, 7); g.fill(); }
    },
    drawOutcome(m, S, g) {
      const k = Math.min(1, S.t / 0.4);
      g.save(); g.globalAlpha = k; g.fillStyle = 'rgba(8,4,24,0.86)'; MGH.rr(g, 240, 190, 800, 330, 22); g.fill(); g.strokeStyle = '#ffe680'; g.lineWidth = 3; g.stroke();
      MGH.text(g, '⏳ TIME! Who filled their quota?', 640, 244, 34, '#ffe680', 'center', 'bold');
      S.P.forEach((P, i) => {
        const x = 340 + i * 200, ok = P.pours >= QUOTA;
        av(g, m, i, x, 360, 30, ok ? 'happy' : 'sad');
        MGH.text(g, m.players[i].name, x, 432, 20, m.players[i].color, 'center', 'bold');
        MGH.text(g, `${ok ? '✔' : '✖'} ${P.pours} / ${QUOTA}`, x, 466, 22, ok ? '#9fffa0' : '#ff9a9a', 'center', 'bold');
      });
      MGH.text(g, 'Now… did anyone notice anything strange?', 640, 506, 17, '#d8c8f0');
      g.restore();
    },
    // the Round Table
    drawHall(m, S, g) {
      const t = m.t, ph = S.phase;
      g.fillStyle = MGH.grad(g, 40, 720, ['#2a1420', '#1a0c16', '#0e0610']); g.fillRect(0, 40, 1280, 680);
      for (const [x, c] of [[130, '#7a1a2a'], [1150, '#1a3a6a']]) { g.fillStyle = c; g.fillRect(x - 60, 60, 120, 300); g.beginPath(); g.moveTo(x - 60, 360); g.lineTo(x, 400); g.lineTo(x + 60, 360); g.fill(); g.strokeStyle = '#d8b04a'; g.lineWidth = 3; g.strokeRect(x - 52, 68, 104, 284); MGH.text(g, x < 640 ? '🗡️' : '🛡️', x, 220, 40, '#fff'); }
      MGH.glow(g, 640, 440, 420, 'rgba(255,170,80,0.25)');
      g.fillStyle = '#2a160c'; g.beginPath(); g.ellipse(640, 452, 230, 96, 0, 0, 7); g.fill();
      g.fillStyle = MGH.grad(g, 350, 540, ['#8a5a32', '#5a3418']); g.beginPath(); g.ellipse(640, 440, 230, 96, 0, 0, 7); g.fill();
      g.strokeStyle = '#c89a5a'; g.lineWidth = 4; g.beginPath(); g.ellipse(640, 440, 206, 82, 0, 0, 7); g.stroke();
      for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2 + 0.3, cx = 640 + Math.cos(a) * 100, cy = 440 + Math.sin(a) * 36; g.fillStyle = '#f0e6d0'; g.fillRect(cx - 4, cy - 24, 8, 24); MGH.glow(g, cx, cy - 30, 24, 'rgba(255,190,90,0.6)'); g.fillStyle = '#ffcf5a'; g.beginPath(); g.ellipse(cx, cy - 30 + Math.sin(t * 9 + k), 4, 8, 0, 0, 7); g.fill(); }
      if (ph !== 'end' && ph !== 'coin') S.P.forEach((P, i) => {
        if (ph === 'banish' && S.banished === i) return;
        const s = SEATS[i];
        this.cloak(g, s.x, s.y - 4, 1.1, m.players[i].color, t + i);
        av(g, m, i, s.x, s.y, 28, ph === 'reveal' ? 'nervous' : 'determined', { look: { x: (640 - s.x) / 300, y: (440 - s.y) / 300 } });
        MGH.text(g, m.players[i].name, s.x, s.y + 46, 18, m.players[i].color, 'center', 'bold');
        if (ph === 'vote') this.seatButton(g, s, s.x + (s.x === 640 ? 62 : s.x < 640 ? -62 : 62), s.y - 20);
      });
      if (ph === 'vote') this.drawVote(m, S, g);
      if (ph === 'reveal') this.drawReveal(m, S, g);
      if (ph === 'banish') this.drawBanish(m, S, g);
      if (ph === 'coin') this.drawCoin(m, S, g);
      if (ph === 'end') this.drawEnd(m, S, g);
    },
    // a gamepad face button with the matching arrow key
    seatButton(g, s, x, y) {
      g.fillStyle = 'rgba(0,0,0,0.45)'; g.beginPath(); g.arc(x, y, 21, 0, 7); g.fill();
      g.fillStyle = s.col; g.beginPath(); g.arc(x, y, 17, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.arc(x - 5, y - 5, 6, 0, 7); g.fill();
      MGH.text(g, s.lab, x, y + 7, 20, '#1a1028', 'center', 'bold');
      MGH.text(g, s.arrow, x, y + 38, 14, '#d8c8f0', 'center', 'bold');
    },
    drawVote(m, S, g) {
      MGH.label(g, '🕯️ THE ROUND TABLE — one vote, one chance', 640, 92, 30, '#ffe680');
      MGH.text(g, 'Secretly press the button next to the one you think is the Traitor (keyboard: the arrow / direction keys).', 640, 130, 17, '#e0d0f0');
      MGH.text(g, 'Catch the Traitor and every Faithful who finished their mission wins. Miss, and the Traitor wins.', 640, 154, 15, '#c8b8e0');
      S.P.forEach((P, i) => { const s = SEATS[i]; MGH.label(g, P.voted ? '🔒 voted' : m.bot(i) ? '🤔 thinking…' : '🤫 choosing…', s.x, s.y + 74, 15, P.voted ? '#9fffa0' : '#fff'); });
    },
    drawReveal(m, S, g) {
      MGH.label(g, '📜 The votes are read out…', 640, 92, 30, '#ffe680');
      const tally = [0, 0, 0, 0];
      S.order.slice(0, S.shown).forEach((i, k) => {
        const j = S.vote[i]; tally[j]++;
        const s = SEATS[i], fresh = k === S.shown - 1 ? Math.min(1, (S.t - k * 1.6) / 0.3) : 1;
        const o = [{ x: 175, y: -20 }, { x: 0, y: -100 }, { x: 175, y: -20 }, { x: 0, y: -100 }][i];
        g.save(); g.translate(s.x + o.x, s.y + o.y); g.scale(fresh, fresh);
        g.fillStyle = '#f0e6d0'; MGH.rr(g, -70, -26, 140, 46, 8); g.fill(); g.strokeStyle = '#5a3418'; g.lineWidth = 3; g.stroke();
        MGH.text(g, '➜ ' + m.players[j].name, 0, 5, 20, Char.shade(m.players[j].color, -0.35), 'center', 'bold');
        g.restore();
      });
      S.P.forEach((P, j) => { if (!tally[j]) return; const s = SEATS[j]; MGH.label(g, '✖'.repeat(tally[j]), s.x, s.y + 76, 22, '#ff8a8a'); });
    },
    drawCoin(m, S, g) {
      g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(0, 40, 1280, 680);
      const c = S.coin, n = c.c.length, a = this.coinAng(S), face = c.c[Math.round(a / Math.PI) % n], sx = Math.max(0.06, Math.abs(Math.cos(a))), done = S.t > 3.4;
      MGH.label(g, `${n === 2 ? 'A two–two' : 'A'} tie! The coin decides who is ousted…`, 640, 110, 30, '#ffe680');
      const bob = done ? 0 : -Math.sin(Math.min(1, S.t / 3.4) * Math.PI) * 120;
      g.save(); g.translate(640, 400 + bob);
      MGH.glow(g, 0, 0, 200, done ? 'rgba(255,220,120,0.6)' : 'rgba(255,220,120,0.3)');
      g.scale(sx, 1);
      g.fillStyle = '#a8781a'; g.beginPath(); g.arc(0, 8, 120, 0, 7); g.fill();
      g.fillStyle = MGH.grad(g, -120, 120, ['#ffe9a0', '#f0c040', '#c8901a']); g.beginPath(); g.arc(0, 0, 120, 0, 7); g.fill();
      g.strokeStyle = '#a8781a'; g.lineWidth = 6; g.beginPath(); g.arc(0, 0, 104, 0, 7); g.stroke();
      g.restore();
      if (sx > 0.25) { g.save(); g.translate(640, 400 + bob); g.scale(sx, 1); const pp = m.players[face]; Char.draw(g, 0, 22, 62, pp.el.id, pp.color, { headOnly: true, noArms: true, noFeet: true, noShadow: true, mood: done ? 'sad' : 'nervous', seed: face }); g.restore(); }
      c.c.forEach((j, k) => { const x = 640 + (k - (n - 1) / 2) * 180; MGH.text(g, m.players[j].name, x, 610, 24, m.players[j].color, 'center', 'bold'); if (done && j === S.banished) MGH.text(g, '⬆ ousted', x, 644, 20, '#ff9a9a', 'center', 'bold'); });
    },
    drawBanish(m, S, g) {
      const i = S.banished, tr = i === S.traitor, k = S.t;
      g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(0, 40, 1280, 680);
      const sp = g.createRadialGradient(640, 420, 20, 640, 420, 260); sp.addColorStop(0, 'rgba(255,240,200,0.45)'); sp.addColorStop(1, 'rgba(255,240,200,0)'); g.fillStyle = sp; g.fillRect(0, 40, 1280, 680);
      MGH.label(g, `${S.tie ? 'The coin has spoken — ' : ''}${m.players[i].name} is banished.`, 640, 110, 30, '#fff');
      this.cloak(g, 640, 420, 1.6, m.players[i].color, m.t);
      av(g, m, i, 640, 430, 46, S.unmasked ? (tr ? 'evil' : 'sad') : 'nervous');
      if (!S.unmasked) MGH.text(g, '"I am…"' + '.'.repeat(Math.floor(k * 2) % 4), 640, 600, 34, '#e0d0f0', 'center', 'bold');
      else {
        const pop = Math.min(1, (k - 2.4) / 0.3);
        g.save(); g.translate(640, 610); g.scale(0.6 + 0.4 * pop, 0.6 + 0.4 * pop);
        MGH.glow(g, 0, -14, 200, tr ? 'rgba(255,60,90,0.6)' : 'rgba(255,210,80,0.5)');
        g.font = 'bold 66px Georgia'; g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 10; g.strokeStyle = '#1a0610'; const w = tr ? 'THE TRAITOR!' : 'FAITHFUL'; g.strokeText(w, 0, 0); g.fillStyle = tr ? '#ff4d6d' : '#ffd34d'; g.fillText(w, 0, 0);
        g.restore();
      }
    },
    drawEnd(m, S, g) {
      const tw = S.winner === 'traitor', i = S.traitor;
      g.fillStyle = tw ? 'rgba(60,0,20,0.75)' : 'rgba(40,30,0,0.6)'; g.fillRect(0, 40, 1280, 680);
      MGH.glow(g, 640, 400, 360, tw ? 'rgba(255,60,90,0.5)' : 'rgba(255,210,90,0.5)');
      const title = tw ? '🗡️ THE TRAITOR WINS 🗡️' : '🏆 THE FAITHFUL WIN 🏆';
      g.font = 'bold 56px Georgia'; g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 10; g.strokeStyle = '#120610'; g.strokeText(title, 640, 140); g.fillStyle = tw ? '#ff6b8a' : '#ffe680'; g.fillText(title, 640, 140);
      const hk = { vial: 'their vial blushed', eye: 'a glint in their eye', smirk: 'a tiny smirk', cloak: 'their cloak flushed', shadow: 'their shadow darkened', name: 'their name flickered', glance: 'a glance straight at you', horns: 'two little horns', smoke: 'a wisp of smoke', feather: 'a dark feather', aura: 'a faint aura', footprint: 'a glowing footprint', well: 'the well water darkened', drop: 'a drop fell from their vial', glint: 'a glint under their cloak', crow: 'a crow flew over', hem: 'their cloak hem changed', dagger: 'a tiny dagger', slit: 'a snake-like eye', tint: 'a violet shimmer' }[S.hint.kind];
      if (tw) {
        this.cloak(g, 640, 400, 1.8, '#ff4d6d', m.t); av(g, m, i, 640, 410, 52, 'evil');
        MGH.text(g, `${m.players[i].name} was the Traitor — and walks away with ${S.pot} gold!`, 640, 580, 26, '#fff', 'center', 'bold');
      } else {
        const w = [0, 1, 2, 3].filter(j => j !== i);
        w.forEach((j, k) => { const x = 640 + (k - 1) * 230, ok = S.P[j].pours >= QUOTA; this.cloak(g, x, 400, 1.3, m.players[j].color, m.t + j); av(g, m, j, x, 410, 40, ok ? 'happy' : 'sad'); MGH.text(g, ok ? '✔ wins a share' : '✖ mission unfinished', x, 500, 18, ok ? '#9fffa0' : '#ff9a9a', 'center', 'bold'); });
        MGH.text(g, `${m.players[i].name} the Traitor is caught!`, 640, 580, 26, '#fff', 'center', 'bold');
      }
      MGH.text(g, `The tell you could have spotted: ${hk}.`, 640, 630, 18, '#d8c8f0', 'center');
    },
  });
})();
