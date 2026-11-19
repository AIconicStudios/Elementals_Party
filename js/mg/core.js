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
    Music.play('mini'); Music.setDuck(1, 0.3);
    layer.classList.remove('hidden');
    const m = this.makeCtx(game, players);
    const S = {};
    this.fx = []; this.shakeAmt = 0;
    game.init(m, S);
    const g = this.g;
    let phase = 'card', phaseT = 0, last = performance.now();
    let ranking = null, winners = null;
    const ready = m.players.map(p => !p.human);
    const demo = this.makeDemo(game, players);
    Input.mouse.moved = false;
    return new Promise(resolve => {
      const finishWith = res => { Music.setDuck(1, 0.3); Music.play('board'); this.pauseUI(false); document.getElementById('mgPauseBtn').classList.add('hidden'); layer.classList.add('hidden'); resolve(res); };
      document.getElementById('mgPauseBtn').classList.remove('hidden');
      this.onPauseClick = () => { this.paused = !this.paused; this.pauseSel = 0; this.pauseUI(this.paused); };
      this.onQuitClick = () => { this.paused = false; finishWith({ winners: [], winner: null, scores: null, quit: true }); };
      this.paused = false;
      const frame = nowT => {
        const dt = Math.min(0.05, (nowT - last) / 1000); last = nowT;
        // pause toggle: Esc, any gamepad Start, or the on-screen button
        const pin = this.pauseInput();
        if (pin.toggle && phase !== 'result') { this.paused = !this.paused; this.pauseSel = 0; this.pauseUI(this.paused); }
        if (this.paused) {
          if (pin.up || pin.down) { this.pauseSel = 1 - this.pauseSel; this.pauseUI(true); }
          if (pin.a) { if (this.pauseSel === 0) { this.paused = false; this.pauseUI(false); } else { this.onQuitClick(); return; } }
          if (!layer.classList.contains('hidden')) requestAnimationFrame(frame);
          return;
        }
        if (layer.classList.contains('hidden')) return;
        m.dt = dt; phaseT += dt;
        this.readInputs(m);
        if (phase === 'card') {
          m.players.forEach((p, i) => { if (p.human && !ready[i] && m.pressed(i, 'a')) { ready[i] = true; Sfx.tone(660 + i * 110, 0.12, 'triangle', 0.07); } });
          this.drawCard(g, game, m, phaseT, ready, demo, dt);
          const humans = m.players.some(p => p.human);
          if ((humans && ready.every(r => r)) || (!humans && phaseT > 4)) { phase = 'count'; phaseT = 0; this.fx = []; if (quiet) Music.setDuck(0, 1.2); }
        } else if (phase === 'count') {
          this.drawGame(g, game, m, S, dt);
          const n = 3 - Math.floor(phaseT / 0.7);
          this.bigText(g, n > 0 ? String(n) : 'GO!', '#fff', phaseT % 0.7);
          if (phaseT > 2.6) { phase = 'play'; phaseT = 0; Sfx.tone(880, 0.2, 'triangle', 0.08); }
          else if (Math.floor(phaseT / 0.7) !== Math.floor((phaseT - dt) / 0.7)) Sfx.tone(440, 0.12, 'triangle', 0.06);
        } else if (phase === 'play') {
          for (let i = 0; i < 4; i++) if (m.bot(i) && game.bot) game.bot(m, S, i, dt);
          m.t += dt;
          game.update(m, S, dt);
          if (game.dur && m.t >= game.dur && !m.done) m.finish(game.score(m, S));
          this.drawGame(g, game, m, S, dt);
          if (m.done) {
            ranking = this.rank(m.scores, order); winners = this.winnersOf(ranking);
            phase = 'result'; phaseT = 0; Sfx.win();
            for (let k = 0; k < 6; k++) MGH.burst(R.range(200, 1080), R.range(150, 400), R.pick(['#ffe680', '#8fe0ff', '#ff6a3d', '#7ccf4a']), 24, { speed: 380, life: 1.6, grav: 300 });
          }
        } else if (phase === 'result') {
          this.drawGame(g, game, m, S, dt, true);
          this.drawResult(g, game, m, ranking, winners, phaseT);
          if (phaseT > 5 || (phaseT > 1.5 && m.players.some(p => p.human && m.pressed(p.i, 'a')))) {
            finishWith({ winners: winners.map(i => m.players[i].id), winner: m.players[winners[0]].id, scores: m.scores });
            return;
          }
        }
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });
  },

  // pause menu input from any keyboard player, any gamepad, or Esc
  pauseInput() {
    const now = { esc: false, start: false, up: false, down: false, a: false };
    const escTap = !!this._escQueued; this._escQueued = false;
    const pads = navigator.getGamepads ? [...navigator.getGamepads()].filter(p => p && p.connected) : [];
    for (const p of pads) if (p.buttons[9] && p.buttons[9].pressed) now.start = true;
    for (let i = 0; i < 4; i++) { const st = Input.state(i); if (st.up) now.up = true; if (st.down) now.down = true; if (st.a) now.a = true; }
    const pv = this._pin || {}; this._pin = now;
    const e = k => now[k] && !pv[k];
    return { toggle: escTap || e('start'), up: e('up'), down: e('down'), a: e('a') };
  },
  pauseUI(on) {
    const el = document.getElementById('mgPause'); if (!el) return;
    el.classList.toggle('hidden', !on);
    el.querySelectorAll('button').forEach((b, k) => b.classList.toggle('navsel', k === (this.pauseSel || 0)));
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
    MGH.text(g, `THE MOOT · #${game.n} · ${game.type}`, 640, 50, 20, '#b6a9e0');
    MGH.text(g, game.name, 640, 108, 56, '#fff', 'center', 'bold');
    MGH.text(g, `Controls: ${game.controls}`, 640, 142, 20, '#ffd34d');
    MGH.wrap(g, game.how, 640, 176, 1080, 24, '#e8e0ff', 19);
    // demo
    this.stepDemo(demo, dt);
    const dx = 360, dy = 228, dw = 560, dh = 315;
    g.save(); g.shadowColor = '#7b5cff'; g.shadowBlur = 24; g.fillStyle = '#000'; MGH.rr(g, dx - 6, dy - 6, dw + 12, dh + 12, 14); g.fill(); g.restore();
    g.save(); MGH.rr(g, dx, dy, dw, dh, 10); g.clip(); g.drawImage(this.demoCanvas, dx, dy, dw, dh); g.restore();
    g.fillStyle = 'rgba(0,0,0,0.6)'; MGH.rr(g, dx + 10, dy + 10, 110, 26, 8); g.fill();
    g.fillStyle = '#ff4d6d'; g.beginPath(); g.arc(dx + 26, dy + 23, 6 * (0.7 + 0.3 * Math.sin(t * 6)), 0, 7); g.fill();
    MGH.text(g, 'DEMO', dx + 72, dy + 29, 16, '#fff', 'center', 'bold');
    MGH.text(g, `🏆 Wins: ${game.wins}`, 640, 570, 21, '#8fe0ff');
    m.players.forEach((p, i) => {
      const x = 160 + i * 320, y0 = 590, w = 296, h = 118;
      g.fillStyle = p.color; MGH.rr(g, x - w / 2, y0, w, h, 14); g.globalAlpha = ready[i] && p.human ? 0.32 : 0.14; g.fill(); g.globalAlpha = 1;
      g.strokeStyle = p.color; g.lineWidth = ready[i] && p.human ? 4 : 2; g.stroke();
      Char.draw(g, x - 104, y0 + 50, 28, p.el.id, p.color, { mood: ready[i] && p.human ? 'cheer' : (p.human ? 'happy' : 'neutral'), seed: i * 1.7, look: { x: 0.5, y: 0 } });
      MGH.text(g, p.name, x + 20, y0 + 30, 21, p.color, 'center', 'bold');
      if (p.human) {
        MGH.text(g, ready[i] ? '✔ READY' : 'Press action when ready', x + 20, y0 + 56, ready[i] ? 20 : 15, ready[i] ? '#7f7' : '#fff', 'center', 'bold');
        MGH.wrap(g, MGH.keyHint(game, i), x + 20, y0 + 80, 220, 16, '#ccc', 13);
      } else MGH.text(g, 'Bot — ready', x + 20, y0 + 58, 16, '#aaa');
    });
    if (!m.players.some(p => p.human)) MGH.text(g, 'Bots only — starting…', 640, 715, 14, '#aaa');
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
  bigText(g, s, c, k = 0) {
    const sc = 1 + Math.max(0, 0.3 - k) * 1.5;
    g.save(); g.translate(640, 400); g.scale(sc, sc);
    g.font = 'bold 140px Georgia'; g.textAlign = 'center'; g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillText(s, 6, 6);
    g.lineWidth = 8; g.strokeStyle = '#3a1a7a'; g.strokeText(s, 0, 0); g.fillStyle = c; g.fillText(s, 0, 0); g.restore();
  },
  drawResult(g, game, m, ranking, winners, t) {
    g.fillStyle = `rgba(5,3,15,${Math.min(0.85, t * 2)})`; g.fillRect(0, 0, 1280, 720);
    // light rays
    g.save(); g.translate(640, 130); g.rotate(t * 0.3);
    for (let k = 0; k < 12; k++) { g.rotate(Math.PI / 6); g.fillStyle = 'rgba(255,230,128,0.07)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(-60, -700); g.lineTo(60, -700); g.fill(); }
    g.restore();
    const W = winners.map(i => m.players[i]);
    W.forEach((w, k) => Char.draw(g, 640 + (k - (W.length - 1) / 2) * 140, 120 + Math.sin(t * 6 + k) * 6, 50, w.el.id, w.color, { mood: 'cheer', seed: k }));
    MGH.text(g, '🏆 ' + W.map(w => w.name).join(' & ') + (W.length > 1 ? ' tie!' : ' wins!'), 640, 232, W.length > 2 ? 40 : 52, W[0].color, 'center', 'bold');
    MGH.text(g, W.length > 1 ? 'Each winner banks +2 coins and they lead the next round' : '+2 banked coins and leads the next round', 640, 270, 21, '#ddd');
    ranking.forEach((r, k) => {
      const p = m.players[r.i], win = winners.includes(r.i);
      const s = game.fmt ? game.fmt(r.s) : String(Math.round(r.s * 100) / 100);
      Char.draw(g, 380, 340 + k * 52, 19, p.el.id, p.color, { mood: win ? 'cheer' : k === 3 ? 'hurt' : 'neutral', seed: r.i * 1.7 });
      MGH.text(g, `${win ? '🏆' : k + 1 + '.'} ${p.name} — ${s}`, 640, 350 + k * 52, 28, p.color, 'center', win ? 'bold' : '');
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
  peek(m, i) { return !m.bot(i) && m.held(i, 'b'); },
  secretHint(g, y = 640) { MGH.text(g, '🤫 Picks are secret — hold your ALT button (B) to peek at your own choice', 640, y, 16, '#bdb4e0'); },
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
    if (/Cursor/.test(c)) s = `${k[2]} move cursor · ${k[3]} click${i === 0 ? ' (or mouse)' : ''}`;
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
      g.globalAlpha = 0.35; g.fillRect(vertical ? i * 320 : 0, vertical ? 40 : 40 + i * 170, vertical ? 2 : 1280, vertical ? 680 : 2);
      g.globalAlpha = 1;
    });
  },
  // pick-input: P = {idx, locked}; n options; cols for grid layout
  pick(m, i, P, n, cols = n) {
    if (P.locked) return false;
    const L = m.pressed(i, 'left'), Rt = m.pressed(i, 'right'), U = m.pressed(i, 'up'), D = m.pressed(i, 'down');
    if (L) P.idx = (P.idx - 1 + n) % n;
    if (Rt) P.idx = (P.idx + 1) % n;
    if (U && cols < n) P.idx = (P.idx - cols + n) % n;
    if (D && cols < n) P.idx = (P.idx + cols) % n;
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
    const P = { cheer: ['laugh', 'starry', 'evil', 'proud'], hurt: ['shock', 'cry', 'angry', 'sad'], scared: ['shock', 'nervous', 'scared', 'nervous'], determined: ['determined', 'effort', 'effort', 'determined'] }[mood];
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
