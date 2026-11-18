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
    // higher is better; ties broken by earlier position in previous order
    return scores.map((s, i) => ({ i, s })).sort((a, b) => (b.s - a.s) || (order.indexOf(a.i) - order.indexOf(b.i)));
  },

  async run(id, players, order) {
    const game = this.byId[id];
    if (Settings.test) return this.simulate(game, players, order);
    const layer = document.getElementById('mgLayer');
    layer.classList.remove('hidden');
    const m = this.makeCtx(game, players);
    const S = {};
    game.init(m, S);
    const g = this.g;
    let phase = 'card', phaseT = 0, last = performance.now(), resultT = 0;
    let ranking = null;
    Input.mouse.moved = false;
    return new Promise(resolve => {
      const frame = nowT => {
        const dt = Math.min(0.05, (nowT - last) / 1000); last = nowT;
        m.dt = dt; phaseT += dt;
        this.readInputs(m);
        if (phase === 'card') {
          this.drawCard(g, game, m, phaseT);
          const humans = m.players.filter(p => p.human);
          if (phaseT > 6 || (phaseT > 1.2 && humans.some(p => m.pressed(p.i, 'a'))) || (!humans.length && phaseT > 2.5)) { phase = 'count'; phaseT = 0; }
        } else if (phase === 'count') {
          game.draw(m, S, g); this.hud(m, S, game, g);
          const n = 3 - Math.floor(phaseT / 0.7);
          this.bigText(g, n > 0 ? String(n) : 'GO!', '#fff');
          if (phaseT > 2.6) { phase = 'play'; phaseT = 0; Sfx.tone(880, 0.2, 'triangle', 0.08); }
          else if (Math.floor(phaseT / 0.7) !== Math.floor((phaseT - dt) / 0.7)) Sfx.tone(440, 0.12, 'triangle', 0.06);
        } else if (phase === 'play') {
          for (let i = 0; i < 4; i++) if (m.bot(i) && game.bot) game.bot(m, S, i, dt);
          m.t += dt;
          game.update(m, S, dt);
          if (game.dur && m.t >= game.dur && !m.done) m.finish(game.score(m, S));
          game.draw(m, S, g); this.hud(m, S, game, g);
          if (m.done) {
            ranking = this.rank(m.scores, order);
            phase = 'result'; phaseT = 0; Sfx.win();
          }
        } else if (phase === 'result') {
          game.draw(m, S, g);
          this.drawResult(g, game, m, ranking);
          resultT += dt;
          if (phaseT > 4.5 || (phaseT > 1.5 && m.players.some(p => p.human && m.pressed(p.i, 'a')))) {
            layer.classList.add('hidden');
            resolve({ winner: m.players[ranking[0].i].id, scores: m.scores });
            return;
          }
        }
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });
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
    }
    if (!m.done) m.finish(game.score ? game.score(m, S) : [0, 0, 0, 0]);
    const ranking = this.rank(m.scores, order);
    return { winner: m.players[ranking[0].i].id, scores: m.scores, simTime: m.t };
  },

  // ---------------------------------------------------------- drawing
  drawCard(g, game, m, t) {
    MGH.bg(g, '#1c1236', '#06040d');
    g.textAlign = 'center';
    MGH.text(g, `THE MOOT · #${game.n}`, 640, 120, 22, '#b6a9e0');
    MGH.text(g, game.name, 640, 190, 64, '#fff', 'center', 'bold');
    MGH.text(g, `${game.type} · Controls: ${game.controls}`, 640, 240, 22, '#ffd34d');
    MGH.wrap(g, game.how, 640, 300, 900, 26, '#e8e0ff');
    MGH.text(g, `Wins: ${game.wins}`, 640, 430, 24, '#8fe0ff');
    m.players.forEach((p, i) => {
      const x = 190 + i * 300;
      g.fillStyle = p.color; MGH.rr(g, x - 130, 480, 260, 150, 16); g.globalAlpha = 0.18; g.fill(); g.globalAlpha = 1;
      g.strokeStyle = p.color; g.lineWidth = 2; g.stroke();
      MGH.text(g, `${p.el.glyph} ${p.name}`, x, 520, 22, p.color, 'center', 'bold');
      MGH.text(g, p.human ? 'Human' : 'Bot', x, 548, 16, '#ccc');
      if (p.human) MGH.wrap(g, MGH.keyHint(game, i), x, 576, 240, 18, '#fff', 14);
    });
    const hum = m.players.some(p => p.human);
    MGH.text(g, hum ? `Press action to start · ${Math.max(0, Math.ceil(6 - t))}` : 'Bots only — starting…', 640, 680, 18, '#aaa');
  },
  hud(m, S, game, g) {
    g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(0, 0, 1280, 40);
    g.textAlign = 'left';
    m.players.forEach((p, i) => {
      const s = game.hud ? game.hud(m, S, i) : '';
      MGH.text(g, `${p.name}${s !== '' ? ': ' + s : ''}`, 16 + i * 250, 27, 18, p.color, 'left', 'bold');
    });
    if (game.dur) MGH.text(g, `⏱ ${Math.max(0, game.dur - m.t).toFixed(1)}`, 1264, 27, 20, '#fff', 'right', 'bold');
  },
  bigText(g, s, c) {
    g.save(); g.font = 'bold 140px Georgia'; g.textAlign = 'center'; g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillText(s, 646, 426); g.fillStyle = c; g.fillText(s, 640, 420); g.restore();
  },
  drawResult(g, game, m, ranking) {
    g.fillStyle = 'rgba(5,3,15,0.82)'; g.fillRect(0, 0, 1280, 720);
    const w = m.players[ranking[0].i];
    MGH.text(g, '🏆 ' + w.name + ' wins!', 640, 220, 60, w.color, 'center', 'bold');
    MGH.text(g, '+2 banked coins and leads the next round', 640, 270, 22, '#ddd');
    ranking.forEach((r, k) => {
      const p = m.players[r.i];
      const s = game.fmt ? game.fmt(r.s) : String(Math.round(r.s * 100) / 100);
      MGH.text(g, `${k + 1}. ${p.name} — ${s}`, 640, 350 + k * 48, 28, p.color, 'center', k === 0 ? 'bold' : '');
    });
  },
};

// ---------------------------------------------------------- helpers
const MGH = {
  rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); },
  bg(g, a, b) { const gr = g.createLinearGradient(0, 0, 0, 720); gr.addColorStop(0, a); gr.addColorStop(1, b); g.fillStyle = gr; g.fillRect(0, 0, 1280, 720); },
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
    else if (/Pick/.test(c)) s = `${k[2]} choose · ${k[3]} confirm`;
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
  drawBody(g, b, p, extra) {
    g.save(); g.translate(b.x, b.y);
    g.globalAlpha = b.alive ? 1 : 0.25;
    g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 8;
    g.fillStyle = p.color; g.beginPath(); g.arc(0, 0, b.r, 0, 7); g.fill();
    g.shadowBlur = 0; g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke();
    g.fillStyle = '#111'; g.beginPath(); g.arc(b.face.x * b.r * 0.45, b.face.y * b.r * 0.45, b.r * 0.22, 0, 7); g.fill();
    g.font = `${Math.round(b.r * 0.8)}px "Segoe UI Emoji"`; g.textAlign = 'center'; g.textBaseline = 'middle';
    if (extra) g.fillText(extra, 0, -b.r - 10);
    g.textBaseline = 'alphabetic';
    g.restore();
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
