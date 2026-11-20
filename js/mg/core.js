'use strict';
// Minigame ("Moot") framework: 4-player FFA, one control scheme each, bots fill seats.
const MG = {
  list: [], byId: {},
  W: 1280, H: 720,
  canvas: null, g: null,
  def(game) { game.n = this.list.length + 1; this.list.push(game); this.byId[game.id] = game; },

  init(canvas) {
    this.canvas = canvas; this.g = canvas.getContext('2d');
    Input.bindMouse(canvas, this.W, this.H);
    window.addEventListener('keydown', e => { if (e.code === 'Escape' && !document.getElementById('mgLayer').classList.contains('hidden')) { this._escQueued = true; e.preventDefault(); } });
  },

  makeCtx(game, players) {
    const m = {
      W: this.W, H: this.H, t: 0, dt: 0, game,
      players: players.map((p, i) => Object.assign({}, p, { i })),
      vin: players.map(() => ({ up: false, down: false, left: false, right: false, a: false, b: false })),
      cur: players.map((p, i) => ({ x: 200 + i * 290, y: 400 })),
      now: players.map(() => ({})), prev: players.map(() => ({})),
      done: false, scores: null, mouseUsed: false, lastMouseDown: false,
      bot(i) { return !this.players[i].human; },
      held(i, k) { return !!this.now[i][k]; },
      pressed(i, k) { return !!this.now[i][k] && !this.prev[i][k]; },
      released(i, k) { return !this.now[i][k] && !!this.prev[i][k]; },
      axis(i) {
        if (this.bot(i)) { const v = this.vin[i]; return { x: (v.right ? 1 : 0) - (v.left ? 1 : 0) + (v.ax || 0), y: (v.down ? 1 : 0) - (v.up ? 1 : 0) + (v.ay || 0) }; }
        const s = this.now[i]; return { x: s.ax || 0, y: s.ay || 0 };
      },
      finish(scores) { if (!this.done) { this.done = true; this.scores = scores; } },
      // bots: steer cursor to a point; returns true when there
      botCursor(i, x, y, speed = 700) {
        const c = this.cur[i]; const d = Math.hypot(x - c.x, y - c.y); const step = speed * this.dt;
        if (d <= step) { c.x = x; c.y = y; return true; }
        c.x += (x - c.x) / d * step; c.y += (y - c.y) / d * step; return false;
      },
    };
    return m;
  },

  readInputs(m) {
    for (let i = 0; i < m.players.length; i++) {
      m.prev[i] = m.now[i];
      if (m.bot(i)) { m.now[i] = Object.assign({}, m.vin[i]); continue; }
      const s = Input.state(i);
      if (m.game.cursor) {
        const c = m.cur[i];
        c.x = clamp(c.x + s.ax * 650 * m.dt, 0, m.W); c.y = clamp(c.y + s.ay * 650 * m.dt, 0, m.H);
        if (i === 0 && Input.mouse.moved) { c.x = Input.mouse.x; c.y = Input.mouse.y; Input.mouse.moved = false; m.mouseUsed = true; }
        if (i === 0 && Input.mouse.down) s.a = true;
      } else if (i === 0 && Input.mouse.down && m.game.mouseA) s.a = true;
      m.now[i] = s;
    }
    // B toggles the secret peek / how-to on and off (one press shows, the next hides)
    if (!m.peekOn) m.peekOn = m.players.map(() => false);
    for (let i = 0; i < m.players.length; i++) if (!m.bot(i) && m.now[i].b && !m.prev[i].b) m.peekOn[i] = !m.peekOn[i];
  },

  rank(scores, order) {
    // higher is better; listed in previous turn order on ties
    return scores.map((s, i) => ({ i, s })).sort((a, b) => (b.s - a.s) || (order.indexOf(a.i) - order.indexOf(b.i)));
  },
  winnersOf(ranking) { const top = ranking[0].s; return ranking.filter(r => Math.abs(r.s - top) < 1e-9).map(r => r.i); },

  // ---------------------------------------------------------- particles / shake
  fx: [], shakeAmt: 0,
  stepFx(dt) {
    for (const p of this.fx) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.grav || 0) * dt; p.vx *= (1 - (p.drag || 0) * dt); p.vy *= (1 - (p.drag || 0) * dt); }
    this.fx = this.fx.filter(p => p.t < p.life);
    if (this.fx.length > 900) this.fx.splice(0, this.fx.length - 900);
    this.shakeAmt = Math.max(0, this.shakeAmt - dt * 30);
  },
  drawFx(g) {
    for (const p of this.fx) {
      const k = 1 - p.t / p.life;
      g.globalAlpha = Math.max(0, Math.min(1, k * 1.5));
      if (p.kind === 'ring') { g.strokeStyle = p.color; g.lineWidth = 4 * k + 1; g.beginPath(); g.arc(p.x, p.y, p.size + (1 - k) * p.grow, 0, 7); g.stroke(); }
      else if (p.kind === 'text') { MGH.text(g, p.text, p.x, p.y, p.size, p.color, 'center', 'bold'); }
      else if (p.kind === 'spark') { g.strokeStyle = p.color; g.lineWidth = p.size * k; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - p.vx * 0.04, p.y - p.vy * 0.04); g.stroke(); }
      else { g.fillStyle = p.color; g.beginPath(); g.arc(p.x, p.y, Math.max(0.5, p.size * (0.4 + 0.6 * k)), 0, 7); g.fill(); }
    }
    g.globalAlpha = 1;
  },

  // ---------------------------------------------------------- run
  async run(id, players, order) {
    const game = this.byId[id];
    if (Settings.test) return this.simulate(game, players, order);
    const layer = document.getElementById('mgLayer');
    const quiet = game.type === 'Rhythm' || game.quietMusic;
    Music.play(Music.nextMini()); Music.setDuck(0.6, 0.3); // mild background music under the minigame sounds
    layer.classList.remove('hidden');
    let m = this.makeCtx(game, players);
    let S = {};
    let pm = null, pS = null; const skip = players.map(p => !p.human), skipPrev = players.map(() => false);
    this.fx = []; this.shakeAmt = 0;
    game.init(m, S);
    const g = this.g;
    let phase = 'card', phaseT = 0, last = performance.now(); this.openT = 0;
    let ranking = null, winners = null;
    const ready = m.players.map(p => !p.human);
    const demo = this.makeDemo(game, players);
    Input.mouse.moved = false;
    return new Promise(resolve => {
      const finishWith = res => { closed = true; return finishWith0(res); };
      const finishWith0 = res => { Music.setDuck(1, 0.3); Music.resume(); this.pauseUI(false); document.getElementById('mgPauseBtn').classList.add('hidden'); layer.classList.add('hidden'); resolve(res); };
      document.getElementById('mgPauseBtn').classList.remove('hidden');
      this.onPauseClick = () => { this.paused = !this.paused; this.pauseSel = 0; this.pauseUI(this.paused); };
      // restart: fresh round straight into the countdown
      this.onRestartClick = () => { m = this.makeCtx(game, players); S = {}; game.init(m, S); phase = 'count'; phaseT = 0; this.fx = []; this.shakeAmt = 0; this.paused = false; this.pauseUI(false); if (quiet) Music.setDuck(0.18, 0.5); };
      // from the pause menu during practice: everyone is ready, start the real round
      this.onSkipPractice = () => { if (phase === 'practice') skip.fill(true); this.paused = false; this.pauseUI(false); };
      this.onQuitClick = () => { this.paused = false; finishWith({ winners: [], winner: null, scores: null, quit: true }); };
      this.paused = false;
      // safety net: an error in a game's update or drawing must never freeze the Moot. The loop carries on,
      // and if the errors keep coming the Moot ends with the current scores and the board continues.
      let errN = 0, closed = false;
      const frame = nowT => {
        if (closed) return;
        try { frameBody(nowT); errN = 0; }
        catch (e) {
          console.error('minigame error', e); errN++;
          if (errN > 20) {
            closed = true;
            let sc = null; try { sc = m.scores || game.score(m, S); } catch (e2) { sc = null; }
            if (sc) { const rk = this.rank(sc, order), w = this.winnersOf(rk); finishWith({ winners: w.map(i => m.players[i].id), winner: m.players[w[0]].id, scores: sc }); }
            else finishWith({ winners: [], winner: null, scores: null, quit: true });
            return;
          }
          requestAnimationFrame(frame);
        }
      };
      const frameBody = nowT => {
        const dt = Math.min(0.05, (nowT - last) / 1000); last = nowT;
        // pause toggle: Esc, any gamepad Start, or the on-screen button
        const pin = this.pauseInput();
        document.getElementById('mgSkipPr').classList.toggle('hidden', phase !== 'practice');
        // on the intro card and in practice, Start / Select mean "I'm ready" (Esc or the ⏸ button still pause)
        const startReady = (phase === 'card' || phase === 'practice') && !this.paused && pin.start && !pin.esc;
        if (pin.toggle && phase !== 'result' && !startReady) { this.paused = !this.paused; this.pauseSel = 0; this.pauseUI(this.paused); }
        if (this.paused) {
          const btns = this.pauseBtns(), n = btns.length;
          if (pin.up || pin.down) { this.pauseSel = ((this.pauseSel || 0) + (pin.up ? n - 1 : 1)) % n; this.pauseUI(true); }
          if (pin.a) { const id = btns[this.pauseSel || 0].id; if (id === 'mgResume') { this.paused = false; this.pauseUI(false); } else if (id === 'mgSkipPr') this.onSkipPractice(); else if (id === 'mgRestart') { this.onRestartClick(); } else { this.onQuitClick(); return; } }
          if (!layer.classList.contains('hidden')) requestAnimationFrame(frame);
          return;
        }
        if (layer.classList.contains('hidden')) return;
        m.dt = dt; phaseT += dt;
        this.readInputs(phase === 'practice' ? pm : m);
        if (phase === 'card') {
          const freeR = this.freePadTap([8, 9]);
          m.players.forEach((p, i) => { if (p.human && !ready[i] && (m.pressed(i, 'a') || m.pressed(i, 'start') || m.pressed(i, 'select'))) { ready[i] = true; Sfx.tone(660 + i * 110, 0.12, 'triangle', 0.07); } });
          if (freeR) { const i = m.players.findIndex((p, j) => p.human && !ready[j]); if (i >= 0) { ready[i] = true; Sfx.tone(660 + i * 110, 0.12, 'triangle', 0.07); } }
          this.drawCard(g, game, m, phaseT, ready, demo, dt);
          if (this.openT === undefined) this.openT = 0; this.openT += dt; if (this.openT < 0.7) this.iris(g, this.openT / 0.7);
          const humans = m.players.some(p => p.human);
          if (humans && ready.every(r => r)) {
            // a short practice round so everyone gets the hang of it before it counts
            phase = 'practice'; phaseT = 0; this.fx = []; this.shakeAmt = 0;
            pm = this.makeCtx(game, players); pm.practice = true; pS = {}; game.init(pm, pS);
            if (quiet) Music.setDuck(0.18, 1.2);
            Sfx.tone(520, 0.15, 'triangle', 0.07);
          } else if (!humans && phaseT > 4) { phase = 'count'; phaseT = 0; this.fx = []; if (quiet) Music.setDuck(0.18, 1.2); }
        } else if (phase === 'practice') {
          // X / Y on a gamepad that isn't tied to a seat readies the first human still practising
          // Start / Select on a seat's own gamepad (or on a gamepad no seat owns) ends practice for that player
          const freeS = this.freePadTap([8, 9]);
          if (phaseT > 0.6) m.players.forEach((p, i) => { if (p.human && !skip[i] && (pm.pressed(i, 'start') || pm.pressed(i, 'select'))) { skip[i] = true; Sfx.tone(700 + i * 90, 0.1, 'triangle', 0.06); } });
          if (freeS && phaseT > 0.6) { const i = m.players.findIndex((p, j) => p.human && !skip[j]); if (i >= 0) { skip[i] = true; Sfx.tone(700 + i * 90, 0.1, 'triangle', 0.06); } }
          if (!game.noPadSkip) Input.pads().forEach((pd, k) => { const on = !!((pd.buttons[2] && pd.buttons[2].pressed) || (pd.buttons[3] && pd.buttons[3].pressed)); this._xyPrev = this._xyPrev || []; if (on && !this._xyPrev[k] && Input.seatForPad(k) === null) { const i = m.players.findIndex((p, j) => p.human && !skip[j]); if (i >= 0) { skip[i] = true; Sfx.tone(700 + i * 90, 0.1, 'triangle', 0.06); } } this._xyPrev[k] = on; });
          // (a game that needs X / Y itself ends practice only from the keyboard keys or Start ▸ End practice)
          m.players.forEach((p, i) => { const st = Input.state(i), k = p.human && (game.noPadSkip ? st.skip && !st.padSkip : st.skip); if (k && !skipPrev[i] && !skip[i]) { skip[i] = true; Sfx.tone(700 + i * 90, 0.1, 'triangle', 0.06); } skipPrev[i] = k; });
          for (let i = 0; i < 4; i++) if (pm.bot(i) && game.bot) game.bot(pm, pS, i, dt);
          if (!pm.done) { pm.t += dt; game.update(pm, pS, dt); if (game.dur && pm.t >= game.dur && !pm.done) pm.finish(game.score(pm, pS)); }
          this.drawGame(g, game, pm, pS, dt);
          // no timer: practise as long as you like; a finished practice game simply starts again
          if (pm.done) { pm = this.makeCtx(game, players); pm.practice = true; pS = {}; game.init(pm, pS); MGH.pop('Again!', 640, 300, '#ffe680', 40); }
          this.drawPractice(g, m, 0, skip, false);
          if (skip.every(v => v)) {
            // fresh start for the real thing
            m = this.makeCtx(game, players); S = {}; game.init(m, S);
            phase = 'count'; phaseT = 0; this.fx = []; this.shakeAmt = 0;
            Sfx.tone(880, 0.12, 'triangle', 0.07);
          }
        } else if (phase === 'count') {
          this.drawGame(g, game, m, S, dt);
          if (phaseT < 0.9) { this.bigText(g, 'READY?', '#9fe0ff', phaseT, 110); if (phaseT - dt <= 0) { Sfx.tone(660, 0.25, 'triangle', 0.06, 200); Voice.announce('Ready?'); } }
          else {
            const q = phaseT - 0.9, n = 3 - Math.floor(q / 0.6);
            this.bigText(g, n > 0 ? String(n) : 'GO!', n === 3 ? '#ff6b6b' : n === 2 ? '#ffd34d' : n === 1 ? '#7cf06a' : '#ffffff', q % 0.6, n > 0 ? 170 : 190);
            if (Math.floor(q / 0.6) !== Math.floor((q - dt) / 0.6) || q - dt <= 0) { if (n > 0) Sfx.tone(440, 0.14, 'triangle', 0.07); else { Sfx.tone(880, 0.3, 'square', 0.06); Sfx.tone(1320, 0.4, 'triangle', 0.06, 0, 0.05); Voice.announce('Go!'); } }
          }
          if (phaseT > 3.2) { phase = 'play'; phaseT = 0; this.replay = { frames: [], n: 0 }; }
        } else if (phase === 'play') {
          for (let i = 0; i < 4; i++) if (m.bot(i) && game.bot) game.bot(m, S, i, dt);
          m.t += dt;
          game.update(m, S, dt);
          if (game.dur && m.t >= game.dur && !m.done) m.finish(game.score(m, S));
          if (game.dur) { const left = game.dur - m.t; if (left > 0 && left <= 5 && Math.ceil(left) !== Math.ceil(left + dt)) Sfx.tick(); }
          this.drawGame(g, game, m, S, dt);
          this.capture(g);
          if (m.done) {
            Sfx.whistle(); setTimeout(() => Sfx.crowd('cheer'), 500);
            ranking = this.rank(m.scores, order); winners = this.winnersOf(ranking);
            phase = 'result'; phaseT = 0; Sfx.win();
            for (let k = 0; k < 6; k++) MGH.burst(R.range(200, 1080), R.range(150, 400), R.pick(['#ffe680', '#8fe0ff', '#ff6a3d', '#7ccf4a']), 24, { speed: 380, life: 1.6, grav: 300 });
          }
        } else if (phase === 'result') {
          // the last moments replay in slow motion behind FINISHED!, then the results
          const RP = this.replay && this.replay.frames.length >= 12 ? 2.8 : 1.1;
          if (phaseT < RP && RP > 2) this.drawReplay(g, phaseT / RP);
          else this.drawGame(g, game, m, S, dt, true);
          if (phaseT < RP) { this.bigText(g, 'FINISHED!', '#ffd34d', Math.min(phaseT, 1.2), 130); if (phaseT - dt <= 0) { Sfx.boom(); Voice.announce('Finish!'); } }
          if (phaseT >= RP && phaseT - dt < RP) Voice.announce(winners.length > 1 ? 'It\'s a tie!' : `${m.players[winners[0]].name} wins!`);
          else this.drawResult(g, game, m, ranking, winners, phaseT - RP);
          // any player's A, or any gamepad's A / B / Start, moves on from the results
          const anyPad = this.anyPadTap();
          if (phaseT > RP + 5.4 || (phaseT > RP + 1.5 && (anyPad || m.players.some(p => p.human && m.pressed(p.i, 'a'))))) {
            phase = 'exit'; phaseT = 0; this.exitRes = { winners: winners.map(i => m.players[i].id), winner: m.players[winners[0]].id, scores: m.scores };
          }
        } else if (phase === 'exit') {
          // iris closes on the results, then back to the board
          this.drawGame(g, game, m, S, dt, true); this.drawResult(g, game, m, ranking, winners, 9);
          this.iris(g, 1 - phaseT / 0.55);
          if (phaseT > 0.6) { finishWith(this.exitRes); return; }
        }
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });
  },

  // ring buffer of small snapshots of the last ~1.6 seconds of play, for the finish replay
  capture(g) {
    const R = this.replay; if (!R || Settings.test) return;
    R.n++; if (R.n % 2) return;
    let c = R.frames.length >= 48 ? R.frames.shift() : null;
    if (!c) { c = document.createElement('canvas'); c.width = 800; c.height = 450; }
    c.getContext('2d').drawImage(g.canvas, 0, 0, 800, 450);
    R.frames.push(c);
  },
  drawReplay(g, k) {
    const F = this.replay.frames, i = Math.min(F.length - 1, Math.floor(k * 0.999 * F.length));
    const z = 1 + k * 0.08; // a slow push-in
    g.save(); g.fillStyle = '#000'; g.fillRect(0, 0, 1280, 720);
    g.translate(640, 360); g.scale(z, z); g.translate(-640, -360);
    g.filter = 'saturate(1.25) contrast(1.05)'; g.drawImage(F[i], 0, 0, 1280, 720); g.filter = 'none';
    g.restore();
    // cinematic letterbox + replay tag
    const bar = 56 * Math.min(1, k * 6);
    g.fillStyle = '#000'; g.fillRect(0, 0, 1280, bar); g.fillRect(0, 720 - bar, 1280, bar);
    if (Math.floor(k * 14) % 2 === 0) { g.fillStyle = '#ff4d4d'; g.beginPath(); g.arc(40, 28, 7, 0, 7); g.fill(); }
    MGH.text(g, 'REPLAY  ×½', 58, 34, 18, '#fff', 'left', 'bold');
  },
  // circular iris: k = 0 closed (black), 1 fully open
  iris(g, k) {
    k = clamp(k, 0, 1); if (k >= 1) return;
    const r = 760 * (k * k * (3 - 2 * k));
    g.save(); g.fillStyle = '#07040f'; g.beginPath(); g.rect(0, 0, 1280, 720); g.arc(640, 360, Math.max(0.1, r), 0, Math.PI * 2, true); g.fill('evenodd');
    g.strokeStyle = 'rgba(255,230,128,0.8)'; g.lineWidth = 6; g.beginPath(); g.arc(640, 360, Math.max(0.1, r), 0, 7); g.stroke(); g.restore();
  },
  // a fresh press of one of these buttons on a gamepad that no seat owns
  freePadTap(btns) {
    const pads = Input.pads(), prev = this._freePrev || []; let hit = false;
    this._freePrev = pads.map((pd, k) => { const on = btns.some(n => pd.buttons[n] && pd.buttons[n].pressed); if (on && !prev[k] && Input.seatForPad(k) === null) hit = true; return on; });
    return hit;
  },
  // a fresh A / B / Start press on any connected gamepad
  anyPadTap() {
    const pads = Input.pads(), now = pads.map(p => !!((p.buttons[0] && p.buttons[0].pressed) || (p.buttons[1] && p.buttons[1].pressed) || (p.buttons[9] && p.buttons[9].pressed)));
    const prev = this._anyPrev || []; this._anyPrev = now;
    return now.some((v, k) => v && !prev[k]);
  },
  // banner shown over the practice round
  drawPractice(g, m, left, skip, over) {
    const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 260);
    g.save();
    g.fillStyle = 'rgba(10,6,30,0.78)'; MGH.rr(g, 380, 592, 520, 120, 16); g.fill();
    g.strokeStyle = `rgba(255,230,128,${0.55 + pulse * 0.45})`; g.lineWidth = 3; g.stroke();
    MGH.text(g, 'PRACTICE ROUND — no timer', 640, 652, 24, '#ffe680', 'center', 'bold');
    MGH.text(g, "Just for fun — this doesn't count", 640, 676, 15, '#d8d0f0');
    const hum = m.players.filter(p => p.human);
    MGH.text(g, 'Ready for the real thing? Press  START  or  SELECT  on your gamepad  ·  keys X, V, M, Backspace (P1–P4)', 640, 700, 13, '#ddd');
    hum.forEach((p, k) => { const x = 640 + (k - (hum.length - 1) / 2) * 120; g.fillStyle = p.color; g.globalAlpha = skip[p.i] ? 1 : 0.35; MGH.rr(g, x - 54, 600, 108, 24, 12); g.fill(); g.globalAlpha = 1; MGH.text(g, skip[p.i] ? `P${p.i + 1} ✔ ready` : `P${p.i + 1} practising`, x, 617, 13, '#fff', 'center', 'bold'); });
    g.restore();
  },

  // pause menu input from any keyboard player, any gamepad, or Esc
  pauseInput() {
    const now = { esc: false, start: false, up: false, down: false, a: false, b: false };
    const escTap = !!this._escQueued; this._escQueued = false;
    const pads = navigator.getGamepads ? [...navigator.getGamepads()].filter(p => p && p.connected) : [];
    for (const p of pads) {
      const bt = n => p.buttons[n] && p.buttons[n].pressed, ay = p.axes[1] || 0;
      if (bt(9)) now.start = true;
      if (this.paused) { if (bt(12) || ay < -0.5) now.up = true; if (bt(13) || ay > 0.5) now.down = true; if (bt(0)) now.a = true; if (bt(1)) now.b = true; }
    }
    for (let i = 0; i < 4; i++) { const st = Input.state(i); if (st.up) now.up = true; if (st.down) now.down = true; if (st.a) now.a = true; }
    const pv = this._pin || {}; this._pin = now;
    const e = k => now[k] && !pv[k];
    return { toggle: escTap || e('start') || (this.paused && e('b')), up: e('up'), down: e('down'), a: e('a'), start: e('start'), esc: escTap };
  },
  pauseBtns() { return [...document.querySelectorAll('#mgPause button')].filter(b => !b.classList.contains('hidden')); },
  pauseUI(on) {
    const el = document.getElementById('mgPause'); if (!el) return;
    el.classList.toggle('hidden', !on);
    this.pauseBtns().forEach((b, k) => b.classList.toggle('navsel', k === (this.pauseSel || 0)));
  },

  drawGame(g, game, m, S, dt, frozen) {
    this.stepFx(dt);
    g.save();
    if (this.shakeAmt > 0) g.translate(R.range(-1, 1) * this.shakeAmt, R.range(-1, 1) * this.shakeAmt);
    game.draw(m, S, g);
    this.drawFx(g);
    g.restore();
    // vignette
    const v = g.createRadialGradient(640, 380, 380, 640, 380, 820);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.45)');
    g.fillStyle = v; g.fillRect(0, 0, 1280, 720);
    if (!frozen) Render.bloom(g, 1280, 720, 0.14);
    this.hud(m, S, game, g);
  },

  // live bot-played preview of a minigame, shown on its intro card
  makeDemo(game, players) {
    if (!this.demoCanvas) { this.demoCanvas = document.createElement('canvas'); this.demoCanvas.width = 1280; this.demoCanvas.height = 720; }
    const d = { g: this.demoCanvas.getContext('2d'), game, players: players.map(p => Object.assign({}, p, { human: false })), fx: [] };
    d.reset = () => { d.m = this.makeCtx(game, d.players); d.S = {}; game.init(d.m, d.S); d.fx = []; d.end = 0; };
    d.reset();
    return d;
  },
  stepDemo(d, dt) {
    const keepFx = this.fx, keepShake = this.shakeAmt;
    this.fx = d.fx; Sfx.suppress = true;
    try {
      const { m, S, game } = d;
      m.dt = dt;
      if (!m.done && m.t < 16) {
        this.readInputs(m);
        for (let i = 0; i < 4; i++) if (game.bot) game.bot(m, S, i, dt);
        m.t += dt; game.update(m, S, dt);
        if (game.dur && m.t >= game.dur && !m.done) m.finish(game.score(m, S));
      } else { d.end += dt; if (d.end > 1.2) d.reset(); }
      this.stepFx(dt);
      game.draw(d.m, d.S, d.g); this.drawFx(d.g); this.hud(d.m, d.S, game, d.g);
    } catch (e) { console.error(e); }
    d.fx = this.fx; this.fx = keepFx; this.shakeAmt = keepShake; Sfx.suppress = false;
  },

  // a picture of a minigame for the practice grid: play it a few seconds with bots and draw one frame
  thumbs: {},
  thumb(id) {
    if (this.thumbs[id]) return this.thumbs[id];
    const game = this.byId[id], test = Settings.test;
    const c = document.createElement('canvas'); c.width = 1280; c.height = 720; const g = c.getContext('2d');
    try {
      const pl = [0, 1, 2, 3].map(i => ({ id: i, name: ['Zephi', 'Drip', 'Pyra', 'Pebble'][i], color: ELEMENTS[i].color, human: false, el: ELEMENTS[i] }));
      const m = this.makeCtx(game, pl), S = {}; game.init(m, S); m.dt = 1 / 30;
      if (S.phase === 'intro') { S.phase = 'play'; S.pt = 0; S.stageT = 0; }
      Settings.test = true;
      const secs = game.thumbT || (game.finale ? 6 : 3.2);
      for (let k = 0; k < secs * 30 && !m.done; k++) { this.readInputs(m); for (let i = 0; i < 4; i++) if (game.bot) game.bot(m, S, i, m.dt); m.t += m.dt; game.update(m, S, m.dt); }
      Settings.test = test;
      g.fillStyle = '#100a24'; g.fillRect(0, 0, 1280, 720); game.draw(m, S, g);
    } catch (e) { Settings.test = test; g.fillStyle = '#241c42'; g.fillRect(0, 0, 1280, 720); }
    this.fx = []; this.shakeAmt = 0;
    const t = document.createElement('canvas'); t.width = 320; t.height = 180; t.getContext('2d').drawImage(c, 0, 40, 1280, 680, 0, 0, 320, 180);
    return (this.thumbs[id] = t.toDataURL('image/jpeg', 0.82));
  },
  simulate(game, players, order) {
    const m = this.makeCtx(game, players.map(p => Object.assign({}, p, { human: false })));
    const S = {}; game.init(m, S);
    m.dt = 1 / 30;
    for (let k = 0; k < 30 * 400 && !m.done; k++) {
      this.readInputs(m);
      for (let i = 0; i < 4; i++) if (game.bot) game.bot(m, S, i, m.dt);
      m.t += m.dt; game.update(m, S, m.dt);
      if (game.dur && m.t >= game.dur && !m.done) m.finish(game.score(m, S));
      if (this.fx.length > 200) this.fx = [];
    }
    this.fx = [];
    if (!m.done) m.finish(game.score ? game.score(m, S) : [0, 0, 0, 0]);
    const ranking = this.rank(m.scores, order), w = this.winnersOf(ranking);
    return { winners: w.map(i => m.players[i].id), winner: m.players[w[0]].id, scores: m.scores, simTime: m.t };
  },

  // ---------------------------------------------------------- drawing
  drawCard(g, game, m, t, ready, demo, dt) {
    MGH.bg(g, '#1c1236', '#06040d');
    // title row
    MGH.text(g, game.name, 640, 64, 48, '#fff', 'center', 'bold');
    const tw = 150; g.fillStyle = 'rgba(123,92,255,0.35)'; MGH.rr(g, 40, 30, tw, 34, 17); g.fill();
    MGH.text(g, `#${game.n} · ${game.type}`, 40 + tw / 2, 53, 16, '#d8ccff', 'center', 'bold');
    // big live demo
    this.stepDemo(demo, dt);
    const dx = 250, dy = 96, dw = 780, dh = 439;
    g.save(); g.shadowColor = '#7b5cff'; g.shadowBlur = 30; g.fillStyle = '#000'; MGH.rr(g, dx - 6, dy - 6, dw + 12, dh + 12, 16); g.fill(); g.restore();
    g.save(); MGH.rr(g, dx, dy, dw, dh, 12); g.clip(); g.drawImage(this.demoCanvas, dx, dy, dw, dh); g.restore();
    g.fillStyle = 'rgba(0,0,0,0.6)'; MGH.rr(g, dx + 12, dy + 12, 96, 26, 8); g.fill();
    g.fillStyle = '#ff4d6d'; g.beginPath(); g.arc(dx + 28, dy + 25, 6 * (0.7 + 0.3 * Math.sin(t * 6)), 0, 7); g.fill();
    MGH.text(g, 'LIVE', dx + 68, dy + 31, 16, '#fff', 'center', 'bold');
    // controls as pictures (left) and the goal (right)
    this.drawControls(g, game, 140, 300, t);
    g.save(); g.translate(1150, 250); const tb = 1 + 0.06 * Math.sin(t * 3); g.scale(tb, tb);
    g.font = '64px "Segoe UI Emoji","Apple Color Emoji",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.globalAlpha = 1; g.fillStyle = '#fff'; g.fillText('🏆', 0, 0); g.textBaseline = 'alphabetic'; g.restore();
    MGH.wrap(g, game.wins, 1150, 318, 200, 22, '#8fe0ff', 18);
    // how-to lives behind B
    const peek = m.players.some((p, i) => p.human && m.peekOn && m.peekOn[i]);
    if (peek) {
      g.fillStyle = 'rgba(8,4,24,0.9)'; MGH.rr(g, dx, dy, dw, dh, 12); g.fill();
      MGH.text(g, 'How to play', 640, dy + 60, 30, '#ffe680', 'center', 'bold');
      MGH.wrap(g, game.how, 640, dy + 110, dw - 80, 30, '#fff', 22);
    } else { g.globalAlpha = 0.75; MGH.text(g, 'press  Ⓑ  for how to play', 640, 560, 15, '#b6a9e0'); g.globalAlpha = 1; }
    m.players.forEach((p, i) => {
      const x = 160 + i * 320, y0 = 585, w = 296, h = 118;
      g.fillStyle = p.color; MGH.rr(g, x - w / 2, y0, w, h, 14); g.globalAlpha = ready[i] && p.human ? 0.32 : 0.14; g.fill(); g.globalAlpha = 1;
      g.strokeStyle = p.color; g.lineWidth = ready[i] && p.human ? 4 : 2; g.stroke();
      Char.draw(g, x - 104, y0 + 50, 28, p.el.id, p.color, { mood: ready[i] && p.human ? 'cheer' : (p.human ? 'happy' : 'neutral'), seed: i * 1.7, look: { x: 0.5, y: 0 } });
      MGH.text(g, p.name, x + 20, y0 + 32, 21, p.color, 'center', 'bold');
      if (p.human) {
        if (ready[i]) MGH.text(g, '✔ READY', x + 20, y0 + 66, 24, '#7f7', 'center', 'bold');
        else { const k = 0.85 + 0.15 * Math.sin(t * 6 + i); this.btnA(g, x - 10, y0 + 60, 15 * k); MGH.text(g, 'or START', x + 52, y0 + 66, 16, '#fff', 'center', 'bold'); }
        MGH.text(g, MGH.keyHint(game, i), x + 20, y0 + 100, 12, '#aaa', 'center');
      } else MGH.text(g, '🤖 ready', x + 20, y0 + 70, 18, '#aaa', 'center', 'bold');
    });
    if (!m.players.some(p => p.human)) MGH.text(g, 'Bots only — starting…', 640, 715, 14, '#aaa');
  },
  // round "A" button picture
  btnA(g, x, y, r) {
    g.fillStyle = '#2bb24c'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.strokeStyle = '#d6ffd9'; g.lineWidth = 2; g.stroke();
    g.font = `bold ${Math.round(r * 1.2)}px Arial`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.fillText('A', x, y + 1); g.textBaseline = 'alphabetic';
  },
  key(g, x, y, s, label, on) {
    g.fillStyle = on ? '#ffe680' : '#3a3160'; MGH.rr(g, x - s / 2, y - s / 2 + 4, s, s, 8); g.fill();
    g.fillStyle = on ? '#fff6c8' : '#5a4f8a'; MGH.rr(g, x - s / 2, y - s / 2, s, s, 8); g.fill();
    g.font = `bold ${Math.round(s * 0.5)}px Arial`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = on ? '#3a2a00' : '#fff'; g.fillText(label, x, y); g.textBaseline = 'alphabetic';
  },
  drawControls(g, game, x, y, t) {
    const c = game.controls || '', ph = Math.floor(t * 1.5) % 4;
    const rows = [];
    if (/Cursor/i.test(c)) rows.push('cursor');
    if (/Left\/Right/i.test(c)) rows.push('lr');
    else if (/Move|direction|Pick|slider/i.test(c)) rows.push('pad');
    if (/button|mash|jump|dash|fire|push|pass|grab|\+ button/i.test(c) || /1 button/.test(c)) rows.push('a');
    if (/Pick/i.test(c) && !rows.includes('a')) rows.push('a');
    if (/A & B/.test(c)) { const k = rows.indexOf('a'); if (k >= 0) rows.splice(k, 1); rows.push('a', 'b'); }
    // what each control does, in words (a game can say exactly with game.ctl; otherwise it's guessed)
    const CTL = { coinshower: { a: 'Dash' }, goldclaw: { a: 'Fire claw' }, pinata: { pad: 'Run', a: 'Whack' }, coinrun: { a: 'Jump' }, trail: { a: 'Open', b: 'Bank' }, traitors: { pad: 'Walk', a: 'Pour', b: 'Pour' }, hammer: { a: 'Hold, let go' }, burrow: { lr: 'Steer', a: 'Dig (beat)' }, counterfeit: { pad: 'Hop', a: 'Pick' }, constellation: { pad: 'Hop', a: 'Link' }, swing: { a: 'Leap' }, rally: { lr: 'Ride / flip' }, whack: { lr: 'Bop' }, fireball: { pad: 'Move', a: 'Fire' } };
    const lab = Object.assign({}, CTL[game.id] || {}, game.ctl || {}), aWord = /hold/i.test(c) ? 'Hold, let go' : /jump/i.test(c) ? 'Jump' : /dash/i.test(c) ? 'Dash' : /fire/i.test(c) ? 'Fire' : /push/i.test(c) ? 'Push' : /grab/i.test(c) ? 'Grab' : /dig/i.test(c) ? 'Dig' : /pass/i.test(c) ? 'Pass' : /Pick/i.test(c) ? 'Choose' : 'Action';
    const words = { lr: lab.lr || 'Move', pad: lab.pad || 'Move', a: lab.a || (game.type === 'Brawl' ? 'Jump' : aWord), b: lab.b || (game.type === 'Brawl' ? 'Power' : 'Alt'), cursor: 'Aim' };
    const gap = 126, y0 = y - (rows.length - 1) * gap / 2;
    rows.forEach((r, k) => {
      const yy = y0 + k * gap - 8;
      g.fillStyle = 'rgba(255,255,255,0.06)'; MGH.rr(g, x - 95, yy - 52, 190, 118, 18); g.fill();
      MGH.text(g, words[r], x, yy + 60, 16, '#ffe680', 'center', 'bold');
      if (r === 'lr') { this.key(g, x - 34, yy - 4, 50, '◀', ph === 0); this.key(g, x + 34, yy - 4, 50, '▶', ph === 2); }
      if (r === 'pad') { const s = 30; this.key(g, x, yy - 32, s, '▲', ph === 0); this.key(g, x - s, yy - 2, s, '◀', ph === 3); this.key(g, x + s, yy - 2, s, '▶', ph === 1); this.key(g, x, yy + 28, s, '▼', ph === 2); }
      if (r === 'a') { const press = (t * 2) % 1 < 0.2; g.save(); g.translate(x, yy - 2 + (press ? 3 : 0)); this.btnA(g, 0, 0, press ? 26 : 28); g.restore(); }
      if (r === 'b') { const press = (t * 2 + 0.5) % 1 < 0.2; g.save(); g.translate(x, yy - 2 + (press ? 3 : 0)); g.fillStyle = '#e0404a'; g.beginPath(); g.arc(0, 0, press ? 26 : 28, 0, 7); g.fill(); g.strokeStyle = '#ffd6d9'; g.lineWidth = 2; g.stroke(); g.font = 'bold 32px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.fillText('B', 0, 1); g.textBaseline = 'alphabetic'; g.restore(); }
      if (r === 'cursor') { g.save(); g.translate(x + Math.sin(t * 2) * 30, yy - 8 + Math.cos(t * 1.6) * 14); g.fillStyle = '#fff'; g.strokeStyle = '#000'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, -18); g.lineTo(0, 14); g.lineTo(8, 6); g.lineTo(14, 18); g.lineTo(19, 15); g.lineTo(13, 4); g.lineTo(23, 3); g.closePath(); g.fill(); g.stroke(); g.restore(); }
    });
  },
  hud(m, S, game, g) {
    g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(0, 0, 1280, 40);
    m.players.forEach((p, i) => {
      const s = game.hud ? game.hud(m, S, i) : '';
      Char.draw(g, 26 + i * 250, 20, 12, p.el.id, p.color, { noFeet: true, noArms: true, simple: true, seed: i, mood: 'happy' });
      MGH.text(g, `${p.name}${s !== '' ? ': ' + s : ''}`, 46 + i * 250, 27, 17, p.color, 'left', 'bold');
    });
    if (game.dur) MGH.text(g, `⏱ ${Math.max(0, game.dur - m.t).toFixed(1)}`, 1150, 27, 20, '#fff', 'right', 'bold');
  },
  bigText(g, s, c, k = 0, size = 140) {
    const pop = k < 0.18 ? 1.6 - (k / 0.18) * 0.7 : k < 0.3 ? 0.9 + (k - 0.18) / 0.12 * 0.1 : 1, rot = Math.sin(k * 20) * 0.05 * Math.max(0, 1 - k * 3);
    // burst behind the number
    g.save(); g.translate(640, 380); g.globalAlpha = Math.max(0, 0.5 - k * 0.4);
    for (let r = 0; r < 14; r++) { g.rotate(Math.PI / 7); g.fillStyle = c; g.beginPath(); g.moveTo(0, 0); g.lineTo(-30, -420); g.lineTo(30, -420); g.fill(); }
    g.restore();
    g.save(); g.translate(640, 400); g.scale(pop, pop); g.rotate(rot);
    g.font = `bold ${size}px Georgia`; g.textAlign = 'center'; g.lineJoin = 'round';
    g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillText(s, 8, 10);
    g.lineWidth = 18; g.strokeStyle = '#1a0f3a'; g.strokeText(s, 0, 0);
    g.lineWidth = 8; g.strokeStyle = '#fff'; g.strokeText(s, 0, 0);
    const gr = g.createLinearGradient(0, -size * 0.8, 0, size * 0.1); gr.addColorStop(0, '#fff'); gr.addColorStop(0.45, c); gr.addColorStop(1, Char.shade(c, -0.35));
    g.fillStyle = gr; g.fillText(s, 0, 0); g.restore();
  },
  drawResult(g, game, m, ranking, winners, t) {
    g.fillStyle = `rgba(8,5,24,${Math.min(0.88, t * 2.5)})`; g.fillRect(0, 0, 1280, 720);
    g.save(); g.translate(640, 150); g.rotate(t * 0.25);
    for (let k = 0; k < 16; k++) { g.rotate(Math.PI / 8); g.fillStyle = k % 2 ? 'rgba(255,230,128,0.08)' : 'rgba(255,255,255,0.04)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(-70, -800); g.lineTo(70, -800); g.fill(); }
    g.restore();
    MGH.glow(g, 640, 160, 220, 'rgba(255,230,140,0.35)');
    const W = winners.map(i => m.players[i]), e = Math.min(1, t / 0.4), bounce = 1 + 2.7 * Math.pow(e - 1, 3) + 1.7 * Math.pow(e - 1, 2);
    W.forEach((w, k) => { const x = 640 + (k - (W.length - 1) / 2) * 150; g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.ellipse(x, 214, 60, 14, 0, 0, 7); g.fill(); Char.draw(g, x, 150 - Math.abs(Math.sin(t * 5 + k)) * 18, 56 * bounce, w.el.id, w.color, { mood: 'cheer', seed: k }); });
    if (Math.random() < 0.5) MGH.burst(R.range(200, 1080), -10, ['#ff6a8a', '#5fb8ff', '#ffd34d', '#6fdc8c'], 2, { speed: 60, grav: 260, life: 2.2, size: 4 });
    MGH.label(g, '🏆 ' + W.map(w => w.name).join(' & ') + (W.length > 1 ? ' tie!' : ' wins!'), 640, 268, W.length > 2 ? 36 : 46, W[0].color, 'rgba(0,0,0,0.55)');
    const medal = ['🥇', '🥈', '🥉', ''], coins = { 1: 3, 2: 2, 3: 1 };
    ranking.forEach((r, k) => {
      const p = m.players[r.i], win = winners.includes(r.i), y = 330 + k * 86, slide = Math.max(0, 1 - (t - 0.15 * k) / 0.35) * 600;
      const place = 1 + ranking.filter(o => o.s > r.s + 1e-9).length;
      g.save(); g.translate(slide, 0);
      g.fillStyle = win ? 'rgba(255,220,120,0.22)' : 'rgba(255,255,255,0.08)'; MGH.rr(g, 330, y - 34, 620, 70, 18); g.fill();
      g.strokeStyle = p.color; g.lineWidth = win ? 4 : 2; g.stroke();
      Char.draw(g, 385, y + 4, 24, p.el.id, p.color, { mood: win ? 'cheer' : place === 4 ? 'sad' : 'happy', seed: r.i * 1.7 });
      MGH.text(g, `${medal[place - 1] || place + '.'} ${p.name}`, 430, y + 10, 28, p.color, 'left', 'bold');
      MGH.text(g, game.fmt ? game.fmt(r.s) : String(Math.round(r.s * 100) / 100), 760, y + 10, 22, '#fff', 'center');
      const cn = game.coinGame ? clamp(Math.round(r.s), 0, 20) : coins[place];
      if (cn) { MGH.coin(g, 880, y + 2, 14, t * 3 + k); MGH.text(g, '+' + cn, 915, y + 11, 24, '#ffe680', 'center', 'bold'); }
      g.restore();
    });
  },

};

// ---------------------------------------------------------- helpers
const MGH = {
  rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); },
  bg(g, a, b) {
    const gr = g.createLinearGradient(0, 0, 0, 720); gr.addColorStop(0, a); gr.addColorStop(1, b); g.fillStyle = gr; g.fillRect(0, 0, 1280, 720);
    // drifting glowing motes for atmosphere
    const t = performance.now() / 1000;
    const mote = Char.shade(a.length === 7 ? a : '#ffffff', 0.6);
    for (let k = 0; k < 26; k++) {
      const x = ((k * 197.3 + t * (12 + (k % 5) * 6)) % 1340) - 30, y = (k * 113.7 + Math.sin(t * 0.7 + k) * 30) % 720;
      g.globalAlpha = 0.18 + 0.15 * Math.sin(t * 2 + k); g.fillStyle = mote;
      g.beginPath(); g.arc(x, y, 1.5 + (k % 4), 0, 7); g.fill();
    }
    g.globalAlpha = 1;
  },
  burst(x, y, color, n = 16, o = {}) {
    if (Settings.test) return;
    const sp = o.speed || 260;
    for (let k = 0; k < n; k++) {
      const a = Math.random() * Math.PI * 2, v = sp * (0.35 + Math.random() * 0.65);
      MG.fx.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (o.up || 0), t: 0, life: (o.life || 0.7) * (0.6 + Math.random() * 0.5), size: o.size || R.range(2.5, 6), color: Array.isArray(color) ? R.pick(color) : color, grav: o.grav || 0, drag: o.drag || 2, kind: o.kind || 'dot' });
    }
  },
  ring(x, y, color, size = 10, grow = 70, life = 0.5) { if (!Settings.test) MG.fx.push({ x, y, vx: 0, vy: 0, t: 0, life, size, grow, color, kind: 'ring' }); },
  pop(text, x, y, color = '#fff', size = 30) { if (!Settings.test) MG.fx.push({ x, y, vx: 0, vy: -70, t: 0, life: 0.9, size, text, color, kind: 'text' }); },
  peek(m, i) { return !m.bot(i) && !!(m.peekOn && m.peekOn[i]); },
  secretHint(g, y = 640) { MGH.text(g, '🤫 Picks are secret — press B to show / hide your own choice', 640, y, 16, '#bdb4e0'); },
  shake(a = 8) { MG.shakeAmt = Math.max(MG.shakeAmt, a); },
  text(g, s, x, y, size, color, align = 'center', weight = '') {
    g.font = `${weight} ${size}px Georgia, "Segoe UI Emoji", serif`; g.textAlign = align; g.fillStyle = color; g.fillText(s, x, y);
  },
  wrap(g, s, x, y, maxW, lh, color, size = 20) {
    g.font = `${size}px Georgia, serif`; g.fillStyle = color; g.textAlign = 'center';
    const words = s.split(' '); let line = '';
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (g.measureText(test).width > maxW && line) { g.fillText(line, x, y); y += lh; line = w; } else line = test;
    }
    if (line) g.fillText(line, x, y);
  },
  keyHint(game, i) {
    const k = [['A/D', 'W/S', 'WASD', 'Q'], ['F/H', 'T/G', 'TFGH', 'R'], ['J/L', 'I/K', 'IJKL', 'U'], ['←/→', '↑/↓', 'Arrows', 'Enter']][i];
    const c = game.controls;
    let s;
    if (/A & B/.test(c)) s = `${/Left\/Right/.test(c) ? k[0] + ' move · ' : /Move/.test(c) ? k[2] + ' move · ' : ''}${k[3]} = A · ${['E', 'Y', 'O', 'R-Shift'][i]} = B`;
    else if (/Cursor/.test(c)) s = `${k[2]} move cursor · ${k[3]} click${i === 0 ? ' (or mouse)' : ''}`;
    else if (/Move/.test(c)) s = `${k[2]} move · ${k[3]} action`;
    else if (/Left\/Right/.test(c)) s = `${k[0]} steer${/mash|\+/.test(c) ? ' · ' + k[3] + ' action' : ''}`;
    else if (/Pick/.test(c)) s = `${k[2]} choose · ${k[3]} confirm · ${['E', 'Y', 'O', 'R-Shift'][i]} peek`;
    else s = `${k[3]} = the button`;
    return s + ' (or gamepad)';
  },
  lanes(g, m, n = 4, vertical = true) {
    m.players.forEach((p, i) => {
      g.fillStyle = p.color; g.globalAlpha = 0.07;
      if (vertical) g.fillRect(i * 320, 40, 320, 680); else g.fillRect(0, 40 + i * 170, 1280, 170);
      g.globalAlpha = 1;
      // lane name badge
      if (vertical) { g.fillStyle = 'rgba(0,0,0,0.35)'; MGH.rr(g, i * 320 + 110, 704, 100, 14, 7); g.fill(); g.fillStyle = p.color; MGH.rr(g, i * 320 + 112, 706, 96, 10, 5); g.fill(); }
      if (i === 0) return;
      // carved divider with a soft shadow and a highlight
      if (vertical) { const x = i * 320; g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(x - 3, 40, 8, 680); g.fillStyle = MGH.grad(g, 40, 720, ['#c9b48a', '#8a7a5a', '#5a4a34']); g.fillRect(x - 3, 40, 6, 680); g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(x - 3, 40, 2, 680); for (let y = 80; y < 720; y += 90) { g.fillStyle = '#7a6a4a'; g.beginPath(); g.arc(x, y, 6, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,0.4)'; g.beginPath(); g.arc(x - 1.5, y - 1.5, 2, 0, 7); g.fill(); } }
      else { const y = 40 + i * 170; g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(0, y - 2, 1280, 7); g.fillStyle = '#8a7a5a'; g.fillRect(0, y - 3, 1280, 5); g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(0, y - 3, 1280, 1.5); }
    });
  },
  // pick-input: P = {idx, locked}; n options; cols for grid layout
  pick(m, i, P, n, cols = n) {
    if (P.locked) return false;
    const L = m.pressed(i, 'left'), Rt = m.pressed(i, 'right'), U = m.pressed(i, 'up'), D = m.pressed(i, 'down');
    if (L) P.idx = (P.idx - 1 + n) % n;
    if (Rt) P.idx = (P.idx + 1) % n;
    if (U) P.idx = cols < n ? (P.idx - cols + n) % n : (P.idx - 1 + n) % n;   // in a single row, up/down also step through
    if (D) P.idx = cols < n ? (P.idx + cols) % n : (P.idx + 1) % n;
    if ((L || Rt || U || D) && !m.bot(i) && MGH.peek(m, i)) Sfx.tone(620, 0.03, 'triangle', 0.03);
    if (m.pressed(i, 'a')) { P.locked = true; Sfx.click(); return true; }
    return false;
  },
  // circle body helpers for arena games
  body(x, y, r = 22) { return { x, y, vx: 0, vy: 0, r, alive: true, face: { x: 1, y: 0 } }; },
  steer(b, ax, ay, dt, accel = 1800, maxV = 320, fric = 6) {
    const l = Math.hypot(ax, ay); if (l > 1) { ax /= l; ay /= l; }
    if (l > 0.1) b.face = { x: ax / Math.max(l, 0.001), y: ay / Math.max(l, 0.001) };
    b.vx += ax * accel * dt; b.vy += ay * accel * dt;
    b.vx -= b.vx * fric * dt; b.vy -= b.vy * fric * dt;
    const v = Math.hypot(b.vx, b.vy); if (v > maxV) { b.vx *= maxV / v; b.vy *= maxV / v; }
  },
  integrate(b, dt, x0 = 0, y0 = 40, x1 = 1280, y1 = 720) {
    b.x += b.vx * dt; b.y += b.vy * dt;
    if (x0 !== null) {
      if (b.x < x0 + b.r) { b.x = x0 + b.r; b.vx = Math.abs(b.vx) * 0.5; }
      if (b.x > x1 - b.r) { b.x = x1 - b.r; b.vx = -Math.abs(b.vx) * 0.5; }
      if (b.y < y0 + b.r) { b.y = y0 + b.r; b.vy = Math.abs(b.vy) * 0.5; }
      if (b.y > y1 - b.r) { b.y = y1 - b.r; b.vy = -Math.abs(b.vy) * 0.5; }
    }
  },
  collide(bodies, bounce = 1) {
    for (let a = 0; a < bodies.length; a++) for (let b = a + 1; b < bodies.length; b++) {
      const A = bodies[a], B = bodies[b]; if (!A.alive || !B.alive) continue;
      const dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy) || 0.01, min = A.r + B.r;
      if (d < min) {
        const nx = dx / d, ny = dy / d, o = (min - d) / 2;
        A.x -= nx * o; A.y -= ny * o; B.x += nx * o; B.y += ny * o;
        const rel = (B.vx - A.vx) * nx + (B.vy - A.vy) * ny;
        if (rel < 0) { const j = -rel * bounce; A.vx -= nx * j; A.vy -= ny * j; B.vx += nx * j; B.vy += ny * j; }
      }
    }
  },
  drawBody(g, b, p, extra, mood) {
    const sp = Math.hypot(b.vx || 0, b.vy || 0);
    if (!mood) mood = b.mood || (!b.alive ? 'out' : ((b.stun > 0 || b.frozen > 0) ? 'dizzy' : sp > 160 ? 'determined' : 'happy'));
    Char.draw(g, b.x, b.y, b.r * 1.3, p.el.id, p.color, { mood: MGH.persona(mood, p.el.id), look: b.face, walk: sp > 40 ? 1 : 0, seed: (p.i || 0) * 1.7, alpha: b.alive ? 1 : 0.4 });
    if (extra) { g.save(); g.font = `${Math.round(b.r * 0.9)}px "Segoe UI Emoji", Georgia`; g.textAlign = 'center'; g.fillStyle = '#fff'; g.fillText(extra, b.x, b.y - b.r * 1.75); g.restore(); }
  },
  // draw player i's character
  // minigame characters are drawn 60% bigger, growing upward so their feet stay on the ground
  av(g, m, i, x, y, r, mood, o = {}) { const p = m.players[i], rs = r * 1.6; Char.draw(g, x, y - (rs - r) * (o.noFeet ? 0.4 : 1.2), rs, p.el.id, p.color, Object.assign({ mood: MGH.persona(mood, p.el.id), seed: i * 1.7 }, o)); },
  // each clan has its own personality: Air laughs it off, Water is emotional, Fire is fiery, Earth is steady
  persona(mood, el) {
    const P = { cheer: ['laugh', 'starry', 'evil', 'proud'], hurt: ['shock', 'cry', 'angry', 'sad'], scared: ['shock', 'nervous', 'scared', 'nervous'], determined: ['determined', 'determined', 'determined', 'determined'] }[mood];
    return P && el >= 0 ? P[el] : mood;
  },
  // seat-to-bot "near" helpers
  nearest(b, others) { let best = null, bd = 1e9; for (const o of others) { if (o === b || !o.alive) continue; const d = Math.hypot(o.x - b.x, o.y - b.y); if (d < bd) { bd = d; best = o; } } return best; },
  aim(m, i, x, y, b, deadzone = 6) {
    const v = m.vin[i]; const dx = x - b.x, dy = y - b.y; const l = Math.hypot(dx, dy);
    v.left = v.right = v.up = v.down = false; v.ax = 0; v.ay = 0;
    if (l > deadzone) { v.ax = dx / l; v.ay = dy / l; }
  },
  setLR(m, i, dir) { const v = m.vin[i]; v.left = dir < 0; v.right = dir > 0; },
};
