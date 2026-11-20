'use strict';
// 65 ---------------------------------------------------------------- The Traitors of Moonhold Castle
// A hidden-role game for one shared screen. One player is secretly the Traitor.
//   Envelopes  each human, in turn, privately holds A to read their role (everyone else looks away).
//   Mission    everyone fills vials at the four moon-wells and pours them into the cauldron (A or B).
//              The Traitor's B pours POISON — it looks exactly like a normal pour, but the cauldron
//              hisses 1.5–3.5 s later. The timeline at the bottom shows who poured when: logic does the rest.
//              Fill the cauldron and the Seer's mirror clears one Faithful. A shield protects at the Round Table.
//   Round Table everyone secretly votes (B shows / hides your own choice); votes are revealed one by one,
//              the banished player reveals their role. Catch the Traitor and the Faithful share the pot;
//              if the Traitor reaches the last two, they steal it all.
(() => {
  const CAUL = { x: 640, y: 372 };
  const WELLS = [{ x: 170, y: 175 }, { x: 1110, y: 175 }, { x: 170, y: 585 }, { x: 1110, y: 585 }];
  const MISSION = 45, DMIN = 1.5, DMAX = 3.5, FILL = 0.7;
  const TL = { x0: 120, x1: 1160, y: 676 }; // the mission timeline strip
  const tlx = t => TL.x0 + (TL.x1 - TL.x0) * clamp(t / MISSION, 0, 1);
  const SEATS = [{ x: 400, y: 330 }, { x: 880, y: 330 }, { x: 400, y: 545 }, { x: 880, y: 545 }];
  const ROLE_COL = { traitor: '#ff4d6d', faithful: '#ffd34d' };

  MG.def({
    id: 'traitors', name: 'The Traitors', type: 'Deduction', controls: 'Move + A & B buttons', thumbT: 9,
    how: 'One of you is secretly the TRAITOR. First, each human holds A alone to read their secret role (everyone else looks away!). MISSION: fill vials at the moon-wells and pour them into the cauldron with A or B. The Traitor\'s B pours POISON (2 doses per mission) — it looks just like a normal pour, but the cauldron hisses 1.5–3.5 seconds later. Watch the timeline at the bottom to work out who poured just before each hiss! Fill the cauldron and the Seer clears one Faithful; grab the shield to be safe from banishment. ROUND TABLE: pick who to banish (B shows/hides your own vote) and lock it with A. Catch the Traitor and the Faithful share the gold — if the Traitor survives to the final two, they steal it all.',
    wins: 'The Faithful if they banish the Traitor; the Traitor if they reach the final two.',
    init(m, S) {
      S.traitor = R.int(0, 3);
      S.P = [0, 1, 2, 3].map(i => Object.assign(MGH.body(CAUL.x + [-90, 90, -90, 90][i], CAUL.y + [-80, -80, 100, 100][i], 22), { alive: true, out: false, carry: 0, fill: 0, pours: 0, shield: false, clear: false, wait: 0, goal: null, think: 0, thinkT: 0 }));
      S.round = 0; S.pot = 0; S.purse = 0; S.log = []; S.rx = []; S.pending = []; S.res = null; S.order = [];
      S.sus = [0, 1, 2, 3].map(() => [0, 0, 0, 0]);
      S.humans = m.players.map((p, i) => i).filter(i => !m.bot(i));
      S.env = 0; S.envT = 0; S.envSeen = 0;
      S.phase = S.humans.length ? 'roles' : 'brief'; S.t = 0;
      if (S.phase === 'brief') this.startRound(m, S);
    },
    alive(S) { return S.P.map((P, i) => i).filter(i => !S.P[i].out); },
    startRound(m, S) {
      S.round++; S.phase = 'brief'; S.t = 0;
      const n = this.alive(S).length;
      S.meas = 0; S.target = n >= 4 ? 24 : 17; S.doses = 2; S.log = []; S.rx = []; S.pending = []; S.mT = 0;
      S.shieldAt = R.range(14, 22); S.shieldItem = null; S.sparks = [];
      this.alive(S).forEach((i, k) => { const P = S.P[i]; P.x = CAUL.x + [-90, 90, -90, 90][k]; P.y = CAUL.y + [-90, -90, 110, 110][k]; P.vx = P.vy = 0; P.carry = 0; P.fill = 0; P.shield = false; P.wait = 0; P.goal = null; });
    },
    // ---------------------------------------------------------------- update
    update(m, S, dt) {
      S.t += dt;
      for (const s of S.sparks || []) { s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 300 * dt; }
      if (S.sparks) S.sparks = S.sparks.filter(s => s.t < s.life);
      const ph = S.phase;
      if (ph === 'roles') return this.updRoles(m, S, dt);
      if (ph === 'brief') { if (S.t > 4.2) { S.phase = 'mission'; S.t = 0; Sfx.whistle(); } return; }
      if (ph === 'mission') return this.updMission(m, S, dt);
      if (ph === 'outcome') { if (S.t > 4.5) this.startVote(m, S); return; }
      if (ph === 'vote') return this.updVote(m, S, dt);
      if (ph === 'reveal') return this.updReveal(m, S, dt);
      if (ph === 'banish') {
        if (S.t > 2.4 && !S.unmasked) { S.unmasked = true; const tr = S.banished === S.traitor; if (tr) { Sfx.crowd('cheer'); Sfx.star(); } else { Sfx.tone(220, 0.6, 'sine', 0.07, -80); Sfx.crowd('ooh'); } }
        if (S.t > 6) {
          const al = this.alive(S);
          if (S.banished === S.traitor) this.endGame(m, S, 'faithful');
          else if (al.length <= 2) this.endGame(m, S, 'traitor');
          else this.startRound(m, S);
        }
        return;
      }
      if (ph === 'end') { if (S.t > 7) m.finish(this.score(m, S)); }
    },
    // envelopes: each human, one at a time, holds A to read their role
    updRoles(m, S, dt) {
      const i = S.humans[S.env];
      if (i === undefined) { this.startRound(m, S); return; }
      S.envT += dt;
      if (m.held(i, 'a') && S.envT > 0.6) { S.envSeen += dt; if (S.envSeen - dt <= 0) Sfx.tone(S.traitor === i ? 180 : 520, 0.4, 'sine', 0.06, S.traitor === i ? -60 : 120); }
      else if (S.envSeen > 0.8) { S.env++; S.envT = 0; S.envSeen = 0; Sfx.click(); }
      if (S.envT > 40 && S.envSeen === 0) { S.env++; S.envT = 0; } // nobody came: carry on
    },
    pour(m, S, i, poison) {
      const P = S.P[i]; P.carry = 0; P.pours++;
      S.log.push({ t: S.mT, i });
      if (poison) { S.meas = Math.max(0, S.meas - 2); S.purse += 3; S.pending.push({ at: S.mT + R.range(DMIN, DMAX) }); }
      else { S.meas++; S.pot += 2; }
      // identical splash either way
      for (let k = 0; k < 14; k++) S.sparks.push({ x: CAUL.x + R.range(-30, 30), y: CAUL.y - 40, vx: R.range(-120, 120), vy: R.range(-320, -120), t: 0, life: R.range(0.4, 0.8), c: R.pick(['#9fe8ff', '#ffffff', m.players[i].color]) });
      Sfx.tone(700, 0.08, 'sine', 0.05, -300); Sfx.noise(0.18, 1600, 0.04, 'bandpass', 0, -900);
    },
    updMission(m, S, dt) {
      S.mT += dt;
      const al = this.alive(S);
      al.forEach(i => {
        const P = S.P[i], a = m.axis(i);
        MGH.steer(P, a.x, a.y, dt, 2300, 270, 8); MGH.integrate(P, dt, 30, 70, 1250, 640);
        // keep out of the cauldron
        const dx = P.x - CAUL.x, dy = P.y - CAUL.y, d = Math.hypot(dx, dy) || 1; if (d < 74) { P.x = CAUL.x + dx / d * 74; P.y = CAUL.y + dy / d * 74; }
        // fill at a well
        const w = WELLS.find(w => Math.hypot(w.x - P.x, w.y - P.y) < 62);
        if (w && !P.carry) { P.fill += dt; if (P.fill >= FILL) { P.carry = 1; P.fill = 0; if (!m.bot(i)) Sfx.tone(880, 0.06, 'triangle', 0.05); } } else if (!w) P.fill = 0;
        // pour at the cauldron (A = pour; B = pour too — only the Traitor's B is poison)
        if (P.carry && d < 120) {
          if (m.pressed(i, 'a')) this.pour(m, S, i, false);
          else if (m.pressed(i, 'b')) { const pz = i === S.traitor && S.doses > 0; if (pz) S.doses--; this.pour(m, S, i, pz); }
        }
        // the shield
        if (S.shieldItem && Math.hypot(S.shieldItem.x - P.x, S.shieldItem.y - P.y) < 46) { P.shield = true; S.shieldItem = null; MGH.pop('🛡️ SHIELD', P.x, P.y - 70, '#9fe0ff', 30); Sfx.star(); }
      });
      MGH.collide(al.map(i => S.P[i]), 0.4);
      if (!S.shieldItem && S.shieldAt > 0 && S.mT >= S.shieldAt) { S.shieldAt = -1; S.shieldItem = R.pick([{ x: 640, y: 150 }, { x: 640, y: 600 }, { x: 330, y: 380 }, { x: 950, y: 380 }]); Sfx.tone(1200, 0.3, 'sine', 0.05, 400); }
      // poison reactions
      for (const p of S.pending) if (!p.done && S.mT >= p.at) {
        p.done = true; S.rx.push({ t: p.at }); S.hiss = 1.2;
        Sfx.noise(0.6, 900, 0.09, 'bandpass', 0, -500); Sfx.tone(140, 0.5, 'sawtooth', 0.04, -60); MGH.shake(5);
        // every bot reasons about who poured inside the window
        const cand = S.log.filter(e => e.t >= p.at - DMAX - 0.02 && e.t <= p.at - DMIN + 0.02).map(e => e.i);
        al.forEach(b => { if (!m.bot(b) || b === S.traitor) return; const c = [...new Set(cand)].filter(j => j !== b && !S.P[j].clear); if (c.length && Math.random() < 0.7) c.forEach(j => { S.sus[b][j] += 1 / c.length; }); });
      }
      S.hiss = Math.max(0, (S.hiss || 0) - dt);
      if (S.meas >= S.target || S.mT >= MISSION) this.endMission(m, S);
    },
    endMission(m, S) {
      S.phase = 'outcome'; S.t = 0;
      const ok = S.meas >= S.target; S.res = { ok, seer: -1 };
      // late poison still hisses (so the evidence is complete)
      for (const p of S.pending) if (!p.done) { p.done = true; S.rx.push({ t: p.at }); }
      if (ok) {
        const pool = this.alive(S).filter(i => i !== S.traitor && !S.P[i].clear);
        if (pool.length) { const s = R.pick(pool); S.P[s].clear = true; S.res.seer = s; this.alive(S).forEach(b => { S.sus[b][s] = -99; }); }
        S.pot += 10; Sfx.star(); Sfx.crowd('cheer');
      } else { Sfx.tone(200, 0.6, 'sine', 0.06, -100); }
    },
    // ---------------------------------------------------------------- round table
    cands(S, i) { return this.alive(S).filter(j => j !== i && !S.P[j].shield); },
    startVote(m, S) {
      S.phase = 'vote'; S.t = 0; S.vote = {}; S.pick = {};
      if (m.peekOn) m.peekOn = m.peekOn.map(() => false);
      this.alive(S).forEach(i => { const c = this.cands(S, i); S.pick[i] = { idx: 0, locked: false, c }; if (c.length <= 1) { S.pick[i].locked = true; S.vote[i] = c[0]; } S.P[i].thinkT = R.range(1.6, 4.2); });
    },
    botVote(m, S, i) {
      const c = S.pick[i].c; if (!c.length) return undefined;
      if (i === S.traitor) {
        // frame the Faithful who looks guiltiest from the public evidence (never a cleared one)
        const pub = this.publicSus(S, i);
        const opts = c.filter(j => !S.P[j].clear); const pool = opts.length ? opts : c;
        return pool.slice().sort((a, b) => pub[b] - pub[a] + R.range(-0.3, 0.3))[0];
      }
      if (Math.random() < 0.2) return R.pick(c);
      return c.slice().sort((a, b) => S.sus[i][b] - S.sus[i][a] + R.range(-0.15, 0.15))[0];
    },
    publicSus(S, me) {
      const s = [0, 0, 0, 0];
      for (const r of S.rx) { const c = [...new Set(S.log.filter(e => e.t >= r.t - DMAX - 0.02 && e.t <= r.t - DMIN + 0.02).map(e => e.i))].filter(j => j !== me); c.forEach(j => { s[j] += 1 / c.length; }); }
      return s;
    },
    updVote(m, S, dt) {
      const al = this.alive(S);
      al.forEach(i => {
        const pk = S.pick[i]; if (pk.locked) return;
        if (m.bot(i)) { S.P[i].thinkT -= dt; if (S.P[i].thinkT <= 0) { S.vote[i] = this.botVote(m, S, i); pk.locked = true; Sfx.click(); } return; }
        if (MGH.pick(m, i, pk, pk.c.length)) S.vote[i] = pk.c[pk.idx];
        if (S.t > 60 && !pk.locked) { pk.locked = true; S.vote[i] = pk.c[pk.idx]; }
      });
      if (al.every(i => S.pick[i].locked) && S.t > 1) {
        S.phase = 'reveal'; S.t = 0; S.order = R.shuffle(al.slice()); S.shown = 0;
        Sfx.drum(2);
      }
    },
    updReveal(m, S, dt) {
      const n = Math.floor(S.t / 1.7);
      if (n > S.shown && S.shown < S.order.length) { S.shown++; Sfx.drum(1); Sfx.tone(300 + S.shown * 60, 0.2, 'triangle', 0.06); }
      if (S.t > S.order.length * 1.7 + 2.2) {
        // count; ties are broken by the Ankar (at random)
        const tally = [0, 0, 0, 0]; for (const v of Object.values(S.vote)) if (v !== undefined) tally[v]++;
        const max = Math.max(...tally), top = [0, 1, 2, 3].filter(j => tally[j] === max && !S.P[j].out);
        S.tie = top.length > 1; S.tally = tally;
        S.banished = R.pick(top); S.P[S.banished].out = true; S.unmasked = false;
        S.phase = 'banish'; S.t = 0; Sfx.drum(0); Sfx.drum(3);
      }
    },
    endGame(m, S, who) {
      S.phase = 'end'; S.t = 0; S.winner = who;
      if (who === 'faithful') { Sfx.crowd('cheer'); Sfx.star(); } else { Sfx.thunder(); Sfx.crowd('ooh'); }
    },
    // ---------------------------------------------------------------- bots
    bot(m, S, i, dt) {
      const v = m.vin[i], P = S.P[i]; v.a = v.b = false; v.ax = v.ay = 0; v.left = v.right = v.up = v.down = false;
      if (S.phase !== 'mission' || P.out) return;
      const tr = i === S.traitor;
      // every bot has its own pace and little pauses, so pours don't all line up
      if (P.spd === undefined || S.mT < 0.05) { P.spd = R.range(0.72, 1); P.idle = R.range(0, 1.6); }
      if (P.idle > 0) { P.idle -= dt; return; }
      // grab a nearby shield
      if (S.shieldItem && Math.hypot(S.shieldItem.x - P.x, S.shieldItem.y - P.y) < 300) { this.go(v, P, S.shieldItem); return; }
      if (!P.carry) {
        if (!P.goal || P.goal.kind !== 'well') { const free = WELLS.slice().sort((a, b) => Math.hypot(a.x - P.x, a.y - P.y) - Math.hypot(b.x - P.x, b.y - P.y)); P.goal = { kind: 'well', w: free[Math.random() < 0.8 ? 0 : 1] }; }
        if (Math.hypot(P.goal.w.x - P.x, P.goal.w.y - P.y) > 30) this.go(v, P, P.goal.w);
        return;
      }
      if (P.goal && P.goal.kind === 'well') { P.goal = null; if (Math.random() < 0.45) { P.idle = R.range(0.2, 1.3); return; } }
      P.goal = null;
      const d = Math.hypot(CAUL.x - P.x, CAUL.y - P.y);
      if (d > 105) { this.go(v, P, CAUL); return; }
      P.wait += dt;
      if (!tr) { if (P.wait > R.range(0.05, 0.4)) { v.a = !m.prev[i].a; P.wait = 0; } return; }
      // the Traitor: poison when the mission is on track to succeed, ideally right after someone else pours (cover)
      // the measured pace of the others tells it whether the mission will succeed without a little poison
      const left = MISSION - S.mT, others = S.log.filter(e => e.i !== i).length, rate = S.mT > 6 ? others / S.mT : 0.55 * (this.alive(S).length - 1) / 3 * 3 / 3.4;
      const onTrack = S.meas + rate * left >= S.target - 0.5;
      const cover = S.log.some(e => e.i !== i && S.mT - e.t < 1.0) || this.alive(S).some(j => j !== i && S.P[j].carry && Math.hypot(S.P[j].x - CAUL.x, S.P[j].y - CAUL.y) < 140);
      if (onTrack && S.doses > 0 && (cover || P.wait > 6)) { v.b = !m.prev[i].b; P.wait = 0; }
      else if ((!onTrack || S.doses <= 0) && P.wait > 0.3) { v.a = !m.prev[i].a; P.wait = 0; }
    },
    go(v, P, t) { const dx = t.x - P.x, dy = t.y - P.y, d = Math.hypot(dx, dy) || 1, k = P.spd || 1; v.ax = dx / d * k; v.ay = dy / d * k; },
    // ---------------------------------------------------------------- scoring
    score(m, S) {
      const sv = this.alive(S).filter(i => i !== S.traitor).length || 1;
      return [0, 1, 2, 3].map(i => {
        const tr = i === S.traitor, out = S.P[i].out;
        if (S.winner === 'traitor') return tr ? 1000 + S.pot + S.purse : out ? 20 : 30;
        if (S.winner === 'faithful') return tr ? 5 : out ? 300 : 500 + Math.round(S.pot / sv);
        return 0;
      });
    },
    fmt(s) { return s >= 1000 ? `Traitor escaped with ${s - 1000} gold` : s >= 500 ? `Faithful survivor · ${s - 500} gold` : s >= 300 ? 'Faithful (banished)' : s >= 20 ? 'fooled by the Traitor' : 'caught Traitor'; },
    hud(m, S, i) { const P = S.P[i]; return P.out ? (S.phase === 'end' || S.banished === i ? (i === S.traitor ? '🗡️ Traitor' : '☠ banished') : '☠ banished') : P.clear ? '✨ cleared' : P.shield ? '🛡️ shield' : (S.phase === 'end' && i === S.traitor ? '🗡️ Traitor' : '🕯️'); },
    // ---------------------------------------------------------------- drawing
    draw(m, S, g) {
      const ph = S.phase;
      if (ph === 'roles') return this.drawRoles(m, S, g);
      if (ph === 'brief' || ph === 'mission' || ph === 'outcome') this.drawCourt(m, S, g);
      else this.drawHall(m, S, g);
      for (const s of S.sparks || []) { g.globalAlpha = 1 - s.t / s.life; g.fillStyle = s.c; g.beginPath(); g.arc(s.x, s.y, 4, 0, 7); g.fill(); } g.globalAlpha = 1;
      if (ph === 'brief') this.banner(g, `MISSION ${S.round}`, `Fill the Moon Cauldron: ${S.target} measures in ${MISSION}s. The Traitor hides 2 doses of poison…`, S.t);
      if (ph === 'outcome') this.banner(g, S.res.ok ? '✨ THE CAULDRON IS FULL ✨' : '☠ THE MISSION FAILED', S.res.ok ? (S.res.seer >= 0 ? `The Seer's mirror shows: ${m.players[S.res.seer].name} is FAITHFUL` : 'The pot grows by 10 gold') : 'The cauldron was spoiled — the Seer sees nothing tonight', S.t, S.res.ok ? '#ffe680' : '#ff8aa0');
    },
    banner(g, title, sub, t, col = '#ffe680') {
      const k = Math.min(1, t / 0.4);
      g.save(); g.globalAlpha = k; g.fillStyle = 'rgba(8,4,24,0.82)'; MGH.rr(g, 240, 250, 800, 170, 22); g.fill(); g.strokeStyle = col; g.lineWidth = 3; g.stroke();
      g.font = 'bold 50px Georgia'; g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 8; g.strokeStyle = '#1a0f3a'; g.strokeText(title, 640, 326); g.fillStyle = col; g.fillText(title, 640, 326);
      MGH.wrap(g, sub, 640, 376, 720, 28, '#fff', 22); g.restore();
    },
    // the moonlit castle courtyard
    drawCourt(m, S, g) {
      const t = m.t;
      g.fillStyle = MGH.grad(g, 40, 720, ['#141a3a', '#1c2448', '#10142a']); g.fillRect(0, 40, 1280, 680);
      // flagstones
      for (let y = 60; y < 660; y += 56) for (let x = (Math.floor(y / 56) % 2) * 40; x < 1280; x += 80) { g.fillStyle = (x * 7 + y * 3) % 5 ? 'rgba(90,100,150,0.18)' : 'rgba(110,120,170,0.24)'; MGH.rr(g, x + 3, y + 3, 74, 50, 6); g.fill(); }
      // moonlight pool and drifting fog
      MGH.glow(g, 640, 380, 520, 'rgba(160,190,255,0.16)');
      for (let k = 0; k < 6; k++) { const x = ((k * 260 + t * 14) % 1600) - 160, y = 120 + k * 95; g.fillStyle = 'rgba(200,210,255,0.06)'; g.beginPath(); g.ellipse(x, y, 220, 40, 0, 0, 7); g.fill(); }
      // castle walls with torches
      g.fillStyle = MGH.grad(g, 40, 70, ['#2a2e4a', '#1a1e34']); g.fillRect(0, 40, 1280, 28);
      for (let x = 0; x < 1280; x += 64) { g.fillStyle = '#2a2e4a'; g.fillRect(x, 32, 40, 14); }
      for (const tx of [90, 450, 830, 1190]) { MGH.glow(g, tx, 60, 70, 'rgba(255,170,70,0.45)'); MGH.fireball(g, tx, 56, 9, t + tx, 0, -1); }
      // the wells
      WELLS.forEach((w, k) => {
        MGH.glow(g, w.x, w.y, 90, 'rgba(120,200,255,0.3)');
        g.fillStyle = '#4a4e6a'; g.beginPath(); g.ellipse(w.x, w.y + 8, 56, 26, 0, 0, 7); g.fill();
        g.fillStyle = '#6a6e8a'; g.beginPath(); g.ellipse(w.x, w.y, 56, 26, 0, 0, 7); g.fill();
        g.fillStyle = `rgba(120,210,255,${0.75 + 0.15 * Math.sin(t * 3 + k)})`; g.beginPath(); g.ellipse(w.x, w.y, 42, 17, 0, 0, 7); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.ellipse(w.x - 12, w.y - 4, 10 + 3 * Math.sin(t * 2 + k), 3, 0, 0, 7); g.fill();
        MGH.text(g, '🌙', w.x, w.y - 36, 18, '#fff');
      });
      // the cauldron
      const pois = S.hiss > 0 ? S.hiss / 1.2 : 0;
      MGH.glow(g, CAUL.x, CAUL.y - 30, 170, pois ? `rgba(80,255,90,${0.45 * pois + 0.2})` : 'rgba(120,180,255,0.35)');
      g.fillStyle = '#2a2a34'; g.beginPath(); g.ellipse(CAUL.x, CAUL.y + 34, 92, 30, 0, 0, 7); g.fill();
      g.fillStyle = MGH.grad(g, CAUL.y - 50, CAUL.y + 50, ['#3a3a48', '#16161e']); g.beginPath(); g.moveTo(CAUL.x - 86, CAUL.y - 40); g.quadraticCurveTo(CAUL.x - 100, CAUL.y + 50, CAUL.x, CAUL.y + 56); g.quadraticCurveTo(CAUL.x + 100, CAUL.y + 50, CAUL.x + 86, CAUL.y - 40); g.closePath(); g.fill();
      const lq = pois ? `rgb(${Math.round(90 + 60 * (1 - pois))},${Math.round(200 + 40 * pois)},${Math.round(255 - 180 * pois)})` : '#7fd0ff';
      g.fillStyle = lq; g.beginPath(); g.ellipse(CAUL.x, CAUL.y - 40, 82, 22, 0, 0, 7); g.fill();
      for (let k = 0; k < 5; k++) { const bx = CAUL.x - 50 + ((k * 37 + t * 40) % 100), by = CAUL.y - 42 + Math.sin(t * 4 + k) * 4; g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.arc(bx, by, 4 + (k % 2) * 2, 0, 7); g.fill(); }
      g.strokeStyle = '#5a5a6a'; g.lineWidth = 6; g.beginPath(); g.ellipse(CAUL.x, CAUL.y - 40, 86, 24, 0, 0, 7); g.stroke();
      if (pois) { g.globalAlpha = pois; for (let k = 0; k < 4; k++) MGH.text(g, '☠', CAUL.x - 60 + k * 40, CAUL.y - 70 - (1 - pois) * 60 - k % 2 * 14, 26, '#7cff6a'); g.globalAlpha = 1; MGH.label(g, '☠ HISSSS! Poison was poured 1.5–3.5 s ago', CAUL.x, CAUL.y - 140, 22, '#9cff8a', 'rgba(10,40,10,0.8)'); }
      // measure bar
      const bw = 260, q = clamp(S.meas / S.target, 0, 1);
      g.fillStyle = 'rgba(0,0,0,0.55)'; MGH.rr(g, CAUL.x - bw / 2, CAUL.y + 74, bw, 22, 11); g.fill();
      g.fillStyle = MGH.grad(g, CAUL.y + 74, CAUL.y + 96, ['#bff0ff', '#4fa8ff']); MGH.rr(g, CAUL.x - bw / 2, CAUL.y + 74, Math.max(22, bw * q), 22, 11); g.fill();
      MGH.text(g, `${S.meas} / ${S.target} measures`, CAUL.x, CAUL.y + 91, 15, '#fff', 'center', 'bold');
      MGH.text(g, `💰 pot ${S.pot} gold`, CAUL.x, CAUL.y + 120, 16, '#ffe680', 'center', 'bold');
      // shield
      if (S.shieldItem) { const b = Math.sin(t * 4) * 5; MGH.glow(g, S.shieldItem.x, S.shieldItem.y, 60, 'rgba(140,220,255,0.6)'); MGH.emoji(g, '🛡️', S.shieldItem.x, S.shieldItem.y + b, 40); }
      // players
      this.alive(S).sort((a, b) => S.P[a].y - S.P[b].y).forEach(i => {
        const P = S.P[i];
        MGH.shadow(g, P.x, P.y + 24, 22, 0.4);
        this.cloak(g, P.x, P.y - 6, 1, m.players[i].color, t + i);
        MGH.av(g, m, i, P.x, P.y, 24, S.hiss > 0 ? 'nervous' : P.carry ? 'determined' : 'happy', { look: P.face });
        MGH.text(g, m.players[i].name, P.x, P.y + 44, 13, m.players[i].color, 'center', 'bold');
        if (P.carry) { this.vial(g, P.x + 26, P.y - 46, t); }
        else if (P.fill > 0) { g.strokeStyle = '#9fe8ff'; g.lineWidth = 4; g.beginPath(); g.arc(P.x, P.y - 70, 12, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * P.fill / FILL); g.stroke(); }
        if (P.shield) MGH.text(g, '🛡️', P.x - 30, P.y - 50, 20, '#fff');
        if (P.clear) { g.strokeStyle = 'rgba(255,220,100,0.9)'; g.lineWidth = 3; g.beginPath(); g.ellipse(P.x, P.y - 80, 18, 6, 0, 0, 7); g.stroke(); }
      });
      // ghosts of the banished watch from the wall
      S.P.forEach((P, i) => { if (!P.out) return; g.globalAlpha = 0.35; MGH.av(g, m, i, 60 + i * 50, 110, 16, 'sad', { headOnly: true }); g.globalAlpha = 1; });
      // timer
      if (S.phase === 'mission') { const left = Math.max(0, MISSION - S.mT); MGH.label(g, `⏳ ${Math.ceil(left)}s`, 1200, 100, 22, left < 10 ? '#ff8a8a' : '#fff'); }
      this.drawTimeline(m, S, g);
    },
    cloak(g, x, y, s, col, t) {
      g.save(); g.translate(x, y); g.scale(s, s);
      g.fillStyle = MGH.grad(g, -28, 34, ['#5a3a7a', '#2a1a3a']); g.beginPath(); g.moveTo(-26, -28); g.quadraticCurveTo(-40 + Math.sin(t * 2) * 3, 10, -34, 34); g.lineTo(34, 34); g.quadraticCurveTo(40 + Math.sin(t * 2 + 1) * 3, 10, 26, -28); g.closePath(); g.fill();
      g.strokeStyle = col; g.lineWidth = 3; g.globalAlpha = 0.8; g.beginPath(); g.moveTo(-34, 34); g.lineTo(34, 34); g.stroke(); g.globalAlpha = 1;
      g.restore();
    },
    vial(g, x, y, t) {
      MGH.glow(g, x, y, 22, 'rgba(140,220,255,0.6)');
      g.fillStyle = '#7fd0ff'; g.beginPath(); g.arc(x, y + 4, 8, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,0.7)'; g.fillRect(x - 3, y - 12, 6, 10); g.fillStyle = '#8a5a3a'; g.fillRect(x - 4, y - 15, 8, 4);
    },
    // who poured when, and the windows in which each poison must have gone in
    drawTimeline(m, S, g) {
      const y = TL.y;
      g.fillStyle = 'rgba(8,6,24,0.85)'; MGH.rr(g, TL.x0 - 110, y - 26, TL.x1 - TL.x0 + 130, 52, 12); g.fill();
      MGH.text(g, '🕰️', TL.x0 - 88, y + 7, 20, '#cfc6ee', 'center', 'bold');
      for (const r of S.rx) { const a = tlx(r.t - DMAX), b = tlx(r.t - DMIN); g.fillStyle = 'rgba(120,255,110,0.25)'; g.fillRect(a, y - 22, b - a, 44); g.strokeStyle = '#7cff6a'; g.lineWidth = 2; g.strokeRect(a, y - 22, b - a, 44); MGH.text(g, '☠', tlx(r.t), y - 8, 14, '#9cff8a'); g.strokeStyle = 'rgba(160,255,140,0.6)'; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(tlx(r.t), y - 22); g.lineTo(tlx(r.t), y + 22); g.stroke(); g.setLineDash([]); }
      g.strokeStyle = 'rgba(255,255,255,0.25)'; g.lineWidth = 2; g.beginPath(); g.moveTo(TL.x0, y); g.lineTo(TL.x1, y); g.stroke();
      for (let s = 0; s <= MISSION; s += 5) { g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(tlx(s) - 1, y - 5, 2, 10); }
      for (const e of S.log) { const x = tlx(e.t), ly = y - 17 + e.i * 11.3; g.fillStyle = m.players[e.i].color; g.beginPath(); g.arc(x, ly, 6, 0, 7); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 1; g.stroke(); }
      // lane labels
      m.players.forEach((p, i) => { g.fillStyle = p.color; g.font = 'bold 10px Georgia'; g.textAlign = 'right'; g.fillText(p.name, TL.x0 - 6, y - 13.5 + i * 11.3); });
      if (S.phase === 'mission') { const x = tlx(S.mT); g.fillStyle = '#fff'; g.fillRect(x - 1, y - 24, 2, 48); }
    },
    // the Round Table hall
    drawHall(m, S, g) {
      const t = m.t;
      g.fillStyle = MGH.grad(g, 40, 720, ['#2a1420', '#1a0c16', '#0e0610']); g.fillRect(0, 40, 1280, 680);
      // tapestries and stained glass
      for (const [x, c] of [[160, '#7a1a2a'], [1120, '#1a3a6a']]) { g.fillStyle = c; g.fillRect(x - 60, 60, 120, 300); g.beginPath(); g.moveTo(x - 60, 360); g.lineTo(x, 400); g.lineTo(x + 60, 360); g.fill(); g.strokeStyle = '#d8b04a'; g.lineWidth = 3; g.strokeRect(x - 52, 68, 104, 284); MGH.text(g, x < 640 ? '🗡️' : '🛡️', x, 220, 40, '#fff'); }
      g.fillStyle = 'rgba(180,140,255,0.12)'; g.beginPath(); g.arc(640, 150, 90, Math.PI, 0); g.fillRect(550, 150, 180, 60); g.fill();
      for (let k = 0; k < 4; k++) { g.fillStyle = ['rgba(255,80,100,0.35)', 'rgba(80,160,255,0.35)', 'rgba(255,200,80,0.35)', 'rgba(120,220,120,0.35)'][k]; g.beginPath(); g.moveTo(640, 150); g.arc(640, 150, 86, Math.PI + k * Math.PI / 4, Math.PI + (k + 1) * Math.PI / 4); g.fill(); }
      // the round table with candles
      MGH.glow(g, 640, 440, 420, 'rgba(255,170,80,0.25)');
      g.fillStyle = '#2a160c'; g.beginPath(); g.ellipse(640, 460, 330, 120, 0, 0, 7); g.fill();
      g.fillStyle = MGH.grad(g, 330, 560, ['#8a5a32', '#5a3418']); g.beginPath(); g.ellipse(640, 440, 330, 120, 0, 0, 7); g.fill();
      g.strokeStyle = '#c89a5a'; g.lineWidth = 4; g.beginPath(); g.ellipse(640, 440, 300, 104, 0, 0, 7); g.stroke();
      for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2, cx = 640 + Math.cos(a) * 150, cy = 440 + Math.sin(a) * 50; g.fillStyle = '#f0e6d0'; g.fillRect(cx - 4, cy - 26, 8, 26); MGH.glow(g, cx, cy - 32, 26, 'rgba(255,190,90,0.6)'); g.fillStyle = '#ffcf5a'; g.beginPath(); g.ellipse(cx, cy - 32 + Math.sin(t * 9 + k), 4, 8, 0, 0, 7); g.fill(); }
      const ph = S.phase;
      // seats
      if (ph !== 'end') S.P.forEach((P, i) => {
        const s = SEATS[i], out = P.out && !(ph === 'banish' && S.banished === i);
        g.fillStyle = '#3a2214'; MGH.rr(g, s.x - 40, s.y - 70, 80, 90, 14); g.fill();
        if (out) { g.globalAlpha = 0.3; MGH.av(g, m, i, s.x, s.y, 26, 'sad'); g.globalAlpha = 1; MGH.text(g, '☠', s.x, s.y - 40, 30, '#aaa'); return; }
        if (ph === 'banish' && S.banished === i) return; // standing in the spotlight instead
        const mood = ph === 'reveal' ? 'nervous' : 'determined';
        this.cloak(g, s.x, s.y - 4, 1.1, m.players[i].color, t + i);
        MGH.av(g, m, i, s.x, s.y, 28, mood, { look: { x: (640 - s.x) / 300, y: 0.2 } });
        if (P.clear) { g.strokeStyle = 'rgba(255,220,100,0.9)'; g.lineWidth = 3; g.beginPath(); g.ellipse(s.x, s.y - 92, 20, 7, 0, 0, 7); g.stroke(); }
        if (P.shield) MGH.text(g, '🛡️', s.x + 44, s.y - 50, 24, '#fff');
        MGH.text(g, m.players[i].name, s.x, s.y + 48, 18, m.players[i].color, 'center', 'bold');
      });
      if (ph === 'vote') this.drawVote(m, S, g);
      if (ph === 'reveal') this.drawReveal(m, S, g);
      if (ph === 'banish') this.drawBanish(m, S, g);
      if (ph === 'end') this.drawEnd(m, S, g);
    },
    drawVote(m, S, g) {
      MGH.label(g, '🕯️ THE ROUND TABLE — who is the Traitor?', 640, 90, 30, '#ffe680');
      MGH.text(g, 'Choose with ◀ ▶, lock with A. Your vote is secret — press B to show / hide it (others look away!)', 640, 128, 16, '#e0d0f0');
      this.alive(S).forEach(i => {
        const s = SEATS[i], pk = S.pick[i];
        let txt = pk.locked ? '🔒 vote locked' : m.bot(i) ? '🤔 thinking…' : '🤫 choosing…';
        if (!m.bot(i) && MGH.peek(m, i) && pk.c.length) {
          const j = pk.c[pk.idx]; txt = `${pk.locked ? '🔒' : '◀'} ${m.players[j].name} ${pk.locked ? '' : '▶'}`;
          const sj = SEATS[j]; g.strokeStyle = m.players[i].color; g.lineWidth = 4; g.setLineDash([10, 8]); g.beginPath(); g.moveTo(s.x, s.y - 30); g.quadraticCurveTo(640, 430, sj.x, sj.y - 30); g.stroke(); g.setLineDash([]);
        }
        MGH.label(g, txt, s.x, s.y + 76, 16, pk.locked ? '#9fffa0' : '#fff');
      });
      if (S.t > 45) MGH.text(g, `Votes lock automatically in ${Math.ceil(60 - S.t)}s`, 640, 700, 15, '#ffb0b0');
    },
    drawReveal(m, S, g) {
      MGH.label(g, '📜 The votes are read out…', 640, 90, 30, '#ffe680');
      const tally = [0, 0, 0, 0];
      S.order.slice(0, S.shown).forEach((i, k) => {
        const j = S.vote[i]; if (j === undefined) return; tally[j]++;
        const s = SEATS[i], fresh = k === S.shown - 1 ? Math.min(1, (S.t - k * 1.7) / 0.3) : 1;
        g.save(); g.translate(s.x, s.y - 110); g.scale(fresh, fresh);
        g.fillStyle = '#f0e6d0'; MGH.rr(g, -70, -30, 140, 50, 8); g.fill(); g.strokeStyle = '#5a3418'; g.lineWidth = 3; g.stroke();
        MGH.text(g, m.players[j].name, 0, 4, 22, Char.shade(m.players[j].color, -0.35), 'center', 'bold');
        g.restore();
      });
      // running tally beside each seat
      S.P.forEach((P, j) => { if (P.out || !tally[j]) return; const s = SEATS[j]; MGH.label(g, '✖'.repeat(tally[j]), s.x + 70, s.y, 22, '#ff8a8a'); });
    },
    drawBanish(m, S, g) {
      const i = S.banished, tr = i === S.traitor, k = S.t;
      g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(0, 40, 1280, 680);
      const sp = g.createRadialGradient(640, 420, 20, 640, 420, 260); sp.addColorStop(0, 'rgba(255,240,200,0.45)'); sp.addColorStop(1, 'rgba(255,240,200,0)'); g.fillStyle = sp; g.fillRect(0, 40, 1280, 680);
      MGH.label(g, `${S.tie ? 'A tie — the Ankar decides! ' : ''}${m.players[i].name} is banished.`, 640, 110, 30, '#fff');
      this.cloak(g, 640, 420, 1.6, m.players[i].color, m.t);
      MGH.av(g, m, i, 640, 430, 46, S.unmasked ? (tr ? 'evil' : 'sad') : 'nervous');
      if (!S.unmasked) MGH.text(g, '"I am…"' + '.'.repeat(Math.floor(k * 2) % 4), 640, 600, 34, '#e0d0f0', 'center', 'bold');
      else {
        const pop = Math.min(1, (k - 2.4) / 0.3);
        g.save(); g.translate(640, 610); g.scale(0.6 + 0.4 * pop, 0.6 + 0.4 * pop);
        MGH.glow(g, 0, -14, 200, tr ? 'rgba(255,60,90,0.6)' : 'rgba(255,210,80,0.5)');
        g.font = 'bold 66px Georgia'; g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 10; g.strokeStyle = '#1a0610'; const w = tr ? 'A TRAITOR!' : 'FAITHFUL'; g.strokeText(w, 0, 0); g.fillStyle = tr ? ROLE_COL.traitor : ROLE_COL.faithful; g.fillText(w, 0, 0);
        g.restore();
        if (!tr) MGH.text(g, 'The Traitor is still among you…', 640, 680, 20, '#ffb0c0');
      }
    },
    drawEnd(m, S, g) {
      const tw = S.winner === 'traitor', i = S.traitor;
      g.fillStyle = tw ? 'rgba(60,0,20,0.7)' : 'rgba(40,30,0,0.55)'; g.fillRect(0, 40, 1280, 680);
      MGH.glow(g, 640, 400, 360, tw ? 'rgba(255,60,90,0.5)' : 'rgba(255,210,90,0.5)');
      const title = tw ? '🗡️ THE TRAITOR WINS 🗡️' : '🏆 THE FAITHFUL WIN 🏆';
      g.font = 'bold 58px Georgia'; g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 10; g.strokeStyle = '#120610'; g.strokeText(title, 640, 150); g.fillStyle = tw ? '#ff6b8a' : '#ffe680'; g.fillText(title, 640, 150);
      if (tw) {
        this.cloak(g, 640, 410, 1.8, '#ff4d6d', m.t); MGH.av(g, m, i, 640, 420, 52, 'evil');
        MGH.text(g, `${m.players[i].name} was the Traitor all along — and steals ${S.pot + S.purse} gold!`, 640, 600, 26, '#fff', 'center', 'bold');
      } else {
        const sv = this.alive(S);
        sv.forEach((j, k) => { const x = 640 + (k - (sv.length - 1) / 2) * 200; this.cloak(g, x, 410, 1.3, m.players[j].color, m.t + j); MGH.av(g, m, j, x, 420, 40, 'cheer'); });
        MGH.text(g, `${m.players[i].name} the Traitor is caught! The survivors share ${S.pot} gold.`, 640, 600, 26, '#fff', 'center', 'bold');
      }
    },
    // the private envelope screen
    drawRoles(m, S, g) {
      const t = m.t, i = S.humans[S.env];
      g.fillStyle = MGH.grad(g, 40, 720, ['#1a0c20', '#0a0612']); g.fillRect(0, 40, 1280, 680);
      MGH.glow(g, 640, 380, 380, 'rgba(180,60,90,0.25)');
      g.font = 'bold 54px Georgia'; g.textAlign = 'center'; g.fillStyle = '#e8d8ff'; g.fillText('THE TRAITORS', 640, 130);
      MGH.text(g, 'of Moonhold Castle', 640, 166, 22, '#b8a0d8');
      if (i === undefined) return;
      const p = m.players[i], open = m.held(i, 'a') && S.envT > 0.6;
      MGH.text(g, `🔒 ${p.name}'s envelope — EVERYONE ELSE, LOOK AWAY!`, 640, 232, 26, p.color, 'center', 'bold');
      // the envelope / card
      g.save(); g.translate(640, 440);
      if (!open) {
        g.fillStyle = '#e8dcc0'; MGH.rr(g, -200, -120, 400, 240, 14); g.fill(); g.strokeStyle = '#8a6a3a'; g.lineWidth = 4; g.stroke();
        g.fillStyle = '#d8c8a8'; g.beginPath(); g.moveTo(-200, -120); g.lineTo(0, 20); g.lineTo(200, -120); g.closePath(); g.fill(); g.stroke();
        g.fillStyle = '#a8202a'; g.beginPath(); g.arc(0, 14, 30, 0, 7); g.fill(); MGH.text(g, '⚜', 0, 26, 32, '#ffd0a0');
        g.restore();
        MGH.text(g, S.envSeen > 0.8 ? 'Let go of A when you are done' : `${p.name}: HOLD  A  to open your envelope`, 640, 640, 24, '#fff', 'center', 'bold');
        return;
      }
      const tr = S.traitor === i;
      g.fillStyle = tr ? '#2a0610' : '#f6ecd0'; MGH.rr(g, -300, -150, 600, 300, 18); g.fill(); g.strokeStyle = tr ? '#ff4d6d' : '#c89a3a'; g.lineWidth = 6; g.stroke();
      MGH.glow(g, 0, -60, 140, tr ? 'rgba(255,40,80,0.4)' : 'rgba(255,210,90,0.35)');
      g.font = 'bold 56px Georgia'; g.textAlign = 'center'; g.fillStyle = tr ? '#ff4d6d' : '#8a5a1a'; g.fillText(tr ? 'TRAITOR' : 'FAITHFUL', 0, -60);
      MGH.wrap(g, tr ? 'Spoil the missions without getting caught. At the cauldron, B pours POISON (it looks like a normal pour) — you have 2 doses per mission. It hisses 1.5–3.5 s later — pour it right after someone else does!' : 'Find the Traitor! Fill the cauldron, and watch the timeline: when the cauldron hisses, the Traitor poured 1.5–3.5 s earlier. (Your B is just a normal pour.)', 0, -10, 520, 28, tr ? '#ffd0d8' : '#3a2a10', 20);
      g.restore();
      MGH.text(g, 'Let go of A to seal it again', 640, 640, 22, '#fff', 'center', 'bold');
    },
  });
})();
