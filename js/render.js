'use strict';
// Full-screen board renderer (canvas 1600x900) with character tokens and an interactive die.
const Render = {
  W: 1600, H: 900,
  canvas: null, g: null, game: null,
  disp: {},
  floats: [],
  highlight: null,
  hover: null,
  stars: [],
  die: null,           // {who, faces, state:'rolling'|'stopping'|'landed', face, rot, hop, note, total}
  X0: 360, X1: 1240, Y0: 150, Y1: 750,
  HOMES: [{ x: 180, y: 190 }, { x: 1420, y: 190 }, { x: 1420, y: 710 }, { x: 180, y: 710 }],
  RING: 118,

  init(canvas) {
    this.canvas = canvas; this.g = canvas.getContext('2d');
    for (let i = 0; i < 180; i++) this.stars.push({ x: Math.random() * 1600, y: Math.random() * 900, r: Math.random() * 1.4 + 0.2, t: Math.random() * 6 });
    canvas.addEventListener('mousemove', e => { const p = this.mpos(e); this.hover = this.hitTile(p.x, p.y); });
    canvas.addEventListener('click', e => {
      const p = this.mpos(e);
      if (this.mapMode) { UI.toggleMap(false); return; }
      if (this.die && this.die.state === 'rolling' && this.die.onStop) { this.die.onStop(); return; }
      const h = this.hitTile(p.x, p.y);
      if (h && this.highlight && h.owner === this.highlight.owner && this.highlight.tiles.includes(h.tile)) this.highlight.onPick(h.tile);
    });
    const loop = () => { try { this.draw(); } catch (e) { console.error(e); } requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  },
  mpos(e) { const r = this.canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * this.W, y: (e.clientY - r.top) / r.height * this.H }; },

  trackPos(i) {
    const sx = (this.X1 - this.X0) / 10, sy = (this.Y1 - this.Y0) / 10;
    if (i < 10) return { x: this.X0 + sx * i, y: this.Y0 };
    if (i < 20) return { x: this.X1, y: this.Y0 + sy * (i - 10) };
    if (i < 30) return { x: this.X1 - sx * (i - 20), y: this.Y1 };
    return { x: this.X0, y: this.Y1 - sy * (i - 30) };
  },
  homeCenter(el) { return this.HOMES[el]; },
  ringPos(el, k) {
    const c = this.homeCenter(el);
    const gate = this.trackPos(el * 10);
    const toGate = Math.atan2(gate.y - c.y, gate.x - c.x);
    const a = toGate + (k % 16) * (Math.PI * 2 / 16);
    return { x: c.x + Math.cos(a) * this.RING, y: c.y + Math.sin(a) * this.RING };
  },
  hitTile(x, y) {
    if (!this.game) return null;
    if (this.game.simple) return null;
    for (let el = 0; el < 4; el++) for (let k = 1; k <= 16; k++) {
      const p = this.ringPos(el, k); if (dist(x, y, p.x, p.y) < 22) return { owner: this.game.players[el], tile: k };
    }
    return null;
  },

  tokenTarget(p, kind) {
    if (kind === 'T') {
      const t = p.trav;
      if (t.loc === 'board') {
        const b = this.trackPos(t.pos), off = [[-13, -10], [13, -10], [13, 10], [-13, 10]][p.id];
        return { x: b.x + off[0], y: b.y + off[1] - 4 };
      }
      const b = this.ringPos(t.ring, t.pos);
      return { x: b.x + (p.id % 2 ? 7 : -7), y: b.y - 6 };
    }
    const b = this.ringPos(p.id, p.def.pos);
    return { x: b.x, y: b.y - 4 };
  },
  floatText(p, text, color) {
    const k = 'T' + p.id; const d = this.disp[k] || this.tokenTarget(p, 'T');
    this.floats.push({ x: d.x, y: d.y - 26, text, color, t: 0 });
  },

  // ---------------------------------------------------------- particles & effects
  parts: [], trapAnims: [], mapMode: false,
  addP(o) { if (Settings.test) return; if (this.parts.length < 700) this.parts.push(Object.assign({ t: 0, vx: 0, vy: 0, grav: 0, drag: 1.5, size: 4, life: 1, kind: 'dot' }, o)); },
  burstAt(pt, color, n = 16, o = {}) {
    for (let k = 0; k < n; k++) {
      const a = Math.random() * Math.PI * 2, v = (o.speed || 180) * (0.3 + Math.random() * 0.7);
      this.addP({ x: pt.x, y: pt.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (o.up || 0), grav: o.grav || 0, life: (o.life || 0.8) * (0.6 + Math.random() * 0.5), size: o.size || R.range(2, 5), color: Array.isArray(color) ? R.pick(color) : color, kind: o.kind || 'dot' });
    }
  },
  stepPuff(pos) { const p = this.trackPos(pos); this.burstAt({ x: p.x, y: p.y + 18 }, ['rgba(255,255,255,0.7)', 'rgba(200,190,255,0.6)'], 5, { speed: 60, life: 0.45, size: 3 }); },
  landFx(pos) {
    if (!this.game) return;
    const p = this.trackPos(pos), type = this.game.board[pos];
    const col = type === 'gate' ? ELEMENTS[pos / 10].color : SPACE[type].color;
    this.burstAt(p, [col, '#ffffff'], 22, { speed: 230, life: 0.7, kind: 'spark', size: 3 });
    this.addP({ x: p.x, y: p.y, kind: 'ring', color: col, size: 20, grow: 60, life: 0.5 });
    this.flash[pos] = 1;
  },
  flash: {},
  coinBurst(pl, n) {
    const d = this.disp['T' + pl.id] || this.tokenTarget(pl, 'T');
    for (let k = 0; k < n; k++) this.addP({ x: d.x, y: d.y - 10, vx: R.range(-60, 60), vy: R.range(-260, -180), grav: 600, life: 0.9, size: 6, kind: 'coin', color: '#ffd34d' });
  },
  ankarSpawn(pos) {
    const p = this.trackPos(pos);
    this.burstAt(p, ['#b46bff', '#3a1a5c', '#ff2f5a', '#e0c3ff'], 60, { speed: 360, life: 1.2, size: 5 });
    for (let k = 0; k < 3; k++) this.addP({ x: p.x, y: p.y, kind: 'ring', color: '#b46bff', size: 10 + k * 15, grow: 120, life: 0.8 + k * 0.2 });
  },
  trapFx(owner, tile, icon, label) {
    if (Settings.test) return;
    const at = tile ? this.ringPos(owner.id, tile) : this.homeCenter(owner.id);
    this.trapAnims.push({ owner, tile, x: at.x, y: at.y, icon, label, t: 0 });
  },

  // ---------------------------------------------------------- emotional reactions
  reactions: {}, emotes: {},
  // big pop-up: the player's mascot grows in the middle of their own Hold with a speech bubble
  react(pid, mood, text, delay = 0, dur = 2.8) {
    if (Settings.test) return;
    this.reactions[pid] = { mood, text, t: -delay, dur, fx: false };
  },
  // small emoji bubble over a token on the board
  emote(pl, emoji, dur = 1.6) { if (!Settings.test) this.emotes[pl.id] = { emoji, t: 0, dur }; },
  reactionOf(pid) { const r = this.reactions[pid]; return r && r.t >= 0 && r.t < r.dur ? r : null; },
  drawReactions(g, now) {
    const G = this.game;
    for (const pl of G.players) {
      const re = this.reactions[pl.id]; if (!re) continue;
      re.t += 1 / 60; if (re.t < 0) continue;
      if (re.t > re.dur) { delete this.reactions[pl.id]; continue; }
      const c = this.homeCenter(pl.id);
      const e = Math.min(1, re.t / 0.35), pop = 1 + 2.7 * Math.pow(e - 1, 3) + 1.7 * Math.pow(e - 1, 2);
      const out = re.t > re.dur - 0.3 ? (re.dur - re.t) / 0.3 : 1;
      const r = 25 + 26 * pop * out;
      if (!re.fx) { re.fx = true; this.moodBurst(c, re.mood, pl.color); }
      if (Math.random() < 0.12 && (re.mood === 'laugh' || re.mood === 'evil')) this.addP({ x: c.x + R.range(-50, 50), y: c.y - 40, vy: -60, vx: R.range(-30, 30), life: 0.9, kind: 'text', text: re.mood === 'evil' ? R.pick(['MWA', 'HA', 'HAH']) : R.pick(['HA', 'HA!', 'hehe']), color: re.mood === 'evil' ? '#d08cff' : '#ffe680', size: 15 });
      if (Math.random() < 0.15 && re.mood === 'cry') this.addP({ x: c.x + R.range(-30, 30), y: c.y, vy: R.range(40, 90), vx: R.range(-60, 60), grav: 300, life: 0.8, kind: 'dot', color: '#8fd0ff', size: 4 });
      // glow disc behind the mascot
      g.save(); g.globalAlpha = 0.5 * out;
      const gl = g.createRadialGradient(c.x, c.y - 14, 10, c.x, c.y - 14, r * 2);
      gl.addColorStop(0, this.moodColor(re.mood)); gl.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gl; g.beginPath(); g.arc(c.x, c.y - 14, r * 2, 0, 7); g.fill(); g.restore();
      Char.draw(g, c.x, c.y - 14 - 6 * pop, r, pl.id, pl.color, { mood: re.mood, seed: pl.id * 5, look: { x: pl.id % 3 === 0 ? 0.5 : -0.5, y: 0 }, alpha: out });
      // speech bubble
      if (re.text) {
        g.save(); g.globalAlpha = out;
        g.font = 'bold 16px Georgia, "Segoe UI Emoji"'; const tw = Math.min(260, g.measureText(re.text).width + 22);
        const bx = clamp(c.x - tw / 2, 6, 1594 - tw), by = c.y - 14 - r * 1.55 - 34 - (1 - e) * 10;
        g.fillStyle = 'rgba(255,255,255,0.95)'; g.strokeStyle = pl.color; g.lineWidth = 3;
        this.rr(g, bx, by, tw, 30, 12); g.fill(); g.stroke();
        g.beginPath(); g.moveTo(c.x - 8, by + 29); g.lineTo(c.x + 4, by + 42); g.lineTo(c.x + 8, by + 29); g.closePath(); g.fill();
        g.fillStyle = '#2a1410'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(re.text, bx + tw / 2, by + 16, tw - 14); g.textBaseline = 'alphabetic';
        g.restore();
      }
    }
    // small emoji bubbles over tokens
    for (const pl of G.players) {
      const em = this.emotes[pl.id]; if (!em) continue;
      em.t += 1 / 60; if (em.t > em.dur) { delete this.emotes[pl.id]; continue; }
      const d = this.disp['T' + pl.id]; if (!d || pl.gone) continue;
      const k = Math.min(1, em.t / 0.2), a = em.t > em.dur - 0.25 ? (em.dur - em.t) / 0.25 : 1;
      g.save(); g.globalAlpha = a; g.translate(d.x + 16, d.y - 34 - k * 6); g.scale(0.6 + 0.4 * k, 0.6 + 0.4 * k);
      g.fillStyle = 'rgba(255,255,255,0.95)'; g.strokeStyle = pl.color; g.lineWidth = 2.5;
      g.beginPath(); g.arc(0, 0, 17, 0, 7); g.fill(); g.stroke(); g.beginPath(); g.moveTo(-8, 12); g.lineTo(-14, 22); g.lineTo(-2, 15); g.fill();
      g.font = '20px "Segoe UI Emoji", "Apple Color Emoji"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#000'; g.fillText(em.emoji, 0, 1);
      g.restore();
    }
  },
  moodColor(m) { return { evil: 'rgba(160,60,220,0.9)', laugh: 'rgba(255,220,90,0.9)', cry: 'rgba(90,170,255,0.9)', shock: 'rgba(255,255,255,0.9)', angry: 'rgba(255,60,40,0.9)', smug: 'rgba(200,160,255,0.8)', starry: 'rgba(255,230,120,0.95)', sick: 'rgba(120,220,80,0.8)', nervous: 'rgba(150,210,255,0.7)', sad: 'rgba(120,140,200,0.7)', proud: 'rgba(255,200,80,0.9)' }[m] || 'rgba(255,255,255,0.6)'; },
  moodBurst(c, mood, col) {
    const at = { x: c.x, y: c.y - 20 };
    if (mood === 'shock') { this.addP({ x: at.x, y: at.y, kind: 'ring', color: '#fff', size: 20, grow: 90, life: 0.5 }); this.burstAt(at, ['#fff', '#ffe680'], 16, { speed: 280, kind: 'spark', size: 3 }); }
    else if (mood === 'evil') { this.burstAt(at, ['#b46bff', '#3a1a5c', '#e0c3ff'], 26, { speed: 220 }); }
    else if (mood === 'starry') { this.burstAt(at, ['#ffe680', '#fff'], 30, { speed: 260, kind: 'spark', size: 3 }); }
    else if (mood === 'angry') { this.burstAt(at, ['#ff4d4d', '#ffb347'], 18, { speed: 240, kind: 'spark', size: 3 }); }
    else if (mood === 'cry') { this.burstAt(at, ['#8fd0ff', '#4f8dff'], 16, { speed: 200, grav: 400 }); }
    else if (mood === 'laugh' || mood === 'proud') { this.burstAt(at, ['#ffe680', col], 18, { speed: 220 }); }
  },

  // ---------------------------------------------------------- dice
  startRoll(who, faces) {
    this.die = { who, faces, state: 'rolling', face: R.pick(faces), rot: 0, hop: 0, spin: 0, note: '', total: null, t: 0 };
    Sfx.dice();
  },
  async stopRoll(final) {
    const d = this.die; if (!d) return;
    d.state = 'stopping';
    const ticks = [60, 80, 105, 140, 185, 240];
    for (let k = 0; k < ticks.length; k++) {
      let f = final;
      if (k < ticks.length - 1) { const others = d.faces.filter(x => x !== d.face); f = others.length ? R.pick(others) : final; }
      d.face = f; d.spin = 0.6 * (ticks.length - k) / ticks.length; d.hop = 1;
      Sfx.dice();
      await sleep(ticks[k]);
    }
    d.face = final; d.state = 'landed'; d.spin = 0; d.land = 0.0001;
    Sfx.tone(260, 0.12, 'triangle', 0.08);
  },

  // ---------------------------------------------------------- draw
  draw() {
    const g = this.g, G = this.game;
    const now = performance.now() / 1000;
    const bg = g.createRadialGradient(800, 450, 80, 800, 450, 950);
    bg.addColorStop(0, '#271a4a'); bg.addColorStop(1, '#07060f');
    g.fillStyle = bg; g.fillRect(0, 0, 1600, 900);
    for (let k = 0; k < 5; k++) {
      const nx = 800 + Math.sin(now * 0.05 + k * 1.3) * 600, ny = 450 + Math.cos(now * 0.04 + k * 2.1) * 330;
      const ng = g.createRadialGradient(nx, ny, 0, nx, ny, 320);
      ng.addColorStop(0, ['rgba(120,80,255,0.10)', 'rgba(60,160,255,0.08)', 'rgba(255,90,140,0.07)', 'rgba(90,255,180,0.06)', 'rgba(255,200,90,0.06)'][k]); ng.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = ng; g.fillRect(0, 0, 1600, 900);
    }
    for (const s of this.stars) { g.globalAlpha = 0.35 + 0.35 * Math.sin(now * 1.5 + s.t); g.fillStyle = '#fff'; g.beginPath(); g.arc(s.x, s.y, s.r, 0, 7); g.fill(); }
    g.globalAlpha = 1;
    if (Math.random() < 0.006) this.addP({ x: R.range(0, 1600), y: R.range(0, 300), vx: R.range(400, 700), vy: R.range(150, 300), life: 0.8, size: 2, kind: 'streak', color: '#fff', drag: 0 });
    if (!G) { this.stepParts(g); this.drawTitle(g, now); return; }
    if (this.mapMode) { this.drawMap(g, now); return; }
    this.ambient(G, now);

    // inner field
    g.fillStyle = 'rgba(255,255,255,0.035)'; this.rr(g, 392, 182, 816, 536, 26); g.fill();
    g.strokeStyle = 'rgba(180,160,255,0.12)'; g.lineWidth = 2; g.stroke();

    // centre-left: round, current player, die
    g.textAlign = 'center';
    g.font = 'bold 30px Cinzel, Georgia, serif'; g.fillStyle = '#efe6ff';
    g.fillText(G.round ? `Round ${G.round} / ${G.rounds}` : 'Setup', 552, 230);
    g.font = '15px Georgia'; g.fillStyle = G.round === G.rounds ? '#ffcf5a' : '#a99bd8';
    g.fillText(G.round === G.rounds ? '🔔 The final bell has rung' : (G.round > 0 && G.round < G.raidRound ? `Waygates sealed until round ${G.raidRound}` : (G.simple ? 'The Starter Crossing' : 'The Crossing')), 552, 254);
    if (G.current) {
      const c = G.current;
      const cre = this.reactionOf(c.id);
      const mood = cre ? cre.mood : this.die && this.die.who === c.id ? (this.die.state === 'landed' ? (this.die.face >= 4 ? 'cheer' : 'happy') : 'determined') : 'happy';
      Char.draw(g, 552, 330, 44, c.id, c.color, { mood, look: { x: 0, y: 0.6 }, seed: c.id * 2 });
      g.font = 'bold 17px Georgia'; g.fillStyle = c.color; g.fillText(`${c.name}'s turn`, 552, 405);
    }
    this.drawDie(g, now);

    // connectors
    for (let el = 0; el < 4; el++) {
      const a = this.trackPos(el * 10), c = G.simple ? this.homeCenter(el) : this.ringPos(el, 16);
      g.strokeStyle = ELEMENTS[el].color; g.lineWidth = 5; g.globalAlpha = 0.45; g.setLineDash([8, 8]); g.lineDashOffset = -now * 20;
      g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(c.x, c.y); g.stroke(); g.setLineDash([]); g.globalAlpha = 1;
    }
    // track
    for (let i = 0; i < 40; i++) {
      const p0 = this.trackPos(i), sp = SPACE[G.board[i]], type = G.board[i];
      const p = { x: p0.x, y: p0.y + Math.sin(now * 2.2 - i * 0.45) * 2.5 };
      if (type === 'gate') this.drawPortal(g, p, ELEMENTS[i / 10].color, now, G.closedGates[i]);
      let col = sp.color; if (type === 'gate') col = ELEMENTS[i / 10].color;
      const w = type === 'gate' ? 66 : 56, h = type === 'gate' ? 62 : 52;
      g.fillStyle = 'rgba(0,0,0,0.4)'; this.rr(g, p.x - w / 2 + 3, p.y - h / 2 + 4, w, h, 10); g.fill();
      const gr = g.createLinearGradient(0, p.y - h / 2, 0, p.y + h / 2);
      gr.addColorStop(0, Char.shade(col, 0.25)); gr.addColorStop(1, Char.shade(col, -0.2));
      g.fillStyle = gr; this.rr(g, p.x - w / 2, p.y - h / 2, w, h, 10); g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 1.5; g.stroke();
      // glossy shine sweeping around the track
      const sh = (now * 0.5 - i / 40) % 1; if (sh > 0 && sh < 0.06) { g.fillStyle = `rgba(255,255,255,${0.35 * (1 - Math.abs(sh - 0.03) / 0.03)})`; this.rr(g, p.x - w / 2, p.y - h / 2, w, h, 10); g.fill(); }
      if (this.flash[i] > 0) { g.fillStyle = `rgba(255,255,255,${this.flash[i] * 0.6})`; this.rr(g, p.x - w / 2 - 3, p.y - h / 2 - 3, w + 6, h + 6, 12); g.fill(); this.flash[i] -= 0.04; }
      if (type === 'bank' && !G.closedBanks[i] && Math.random() < 0.04) this.addP({ x: p.x + R.range(-24, 24), y: p.y + R.range(-20, 20), vy: -30, life: 0.8, size: 2.5, kind: 'twinkle', color: '#fff3b0' });
      const closed = (type === 'gate' && G.closedGates[i]) || (type === 'bank' && G.closedBanks[i]);
      g.textAlign = 'center'; g.textBaseline = 'middle';
      const txt = /[0-9×+−]/.test(sp.icon) && sp.icon.length <= 2;
      g.fillStyle = ['blue', 'red', 'doubler'].includes(type) ? '#fff' : '#111';
      g.font = txt ? 'bold 21px Georgia' : (type === 'gate' ? '30px' : '25px') + ' "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
      g.fillText(type === 'gate' ? ELEMENTS[i / 10].glyph : (G.simple && type === 'blue' ? '+3' : sp.icon), p.x, p.y + 2);
      if (closed) { g.fillStyle = 'rgba(0,0,0,0.65)'; this.rr(g, p.x - w / 2, p.y - h / 2, w, h, 10); g.fill(); g.font = '22px sans-serif'; g.fillStyle = '#fff'; g.fillText('🌑', p.x, p.y); }
      g.textBaseline = 'alphabetic';
    }
    for (const pl of G.players) this.drawHome(g, pl, now);

    // ankar
    if (G.ankar !== null) {
      const tp = this.trackPos(G.ankar);
      const d = this.disp.ANKAR || (this.disp.ANKAR = { x: tp.x, y: tp.y });
      d.x = lerp(d.x, tp.x, 0.15); d.y = lerp(d.y, tp.y, 0.15);
      g.save(); g.translate(d.x, d.y - 30 + Math.sin(now * 2) * 4);
      g.shadowColor = '#b46bff'; g.shadowBlur = 25;
      g.fillStyle = '#3a1a5c'; g.beginPath(); g.ellipse(0, 0, 30, 19, 0, 0, 7); g.fill();
      g.shadowBlur = 0;
      g.fillStyle = '#e0c3ff'; g.beginPath(); g.ellipse(0, 0, 15, 14 * (0.5 + 0.5 * Math.abs(Math.sin(now * 1.3))), 0, 0, 7); g.fill();
      g.fillStyle = '#ff2f5a'; g.beginPath(); g.arc(Math.sin(now) * 4, 0, 6, 0, 7); g.fill();
      g.restore();
    }

    // tokens (sorted by y so lower ones overlap)
    const toks = [];
    for (const pl of G.players) { if (pl.def) toks.push([pl, 'D']); if (!pl.gone) toks.push([pl, 'T']); }
    toks.forEach(([pl, k]) => {
      const key = k + pl.id, tg = this.tokenTarget(pl, k);
      const d = this.disp[key] || (this.disp[key] = { x: tg.x, y: tg.y, px: tg.x, tx: tg.x, ty: tg.y, fx: tg.x, fy: tg.y, k: 1, hop: 0 });
      if (Math.abs(d.tx - tg.x) > 0.5 || Math.abs(d.ty - tg.y) > 0.5) { d.fx = d.x; d.fy = d.y + d.hop; d.tx = tg.x; d.ty = tg.y; d.k = 0; }
      d.px = d.x;
      const far = Math.hypot(d.tx - d.fx, d.ty - d.fy) > 160;
      d.k = Math.min(1, d.k + (far ? 0.06 : 0.13));
      const e = d.k < 0.5 ? 2 * d.k * d.k : 1 - Math.pow(-2 * d.k + 2, 2) / 2;
      d.x = lerp(d.fx, d.tx, e); const by = lerp(d.fy, d.ty, e);
      d.hop = -Math.sin(d.k * Math.PI) * (far ? 50 : 16);
      d.y = by + d.hop;
    });
    toks.sort((a, b) => this.disp[a[1] + a[0].id].y - this.disp[b[1] + b[0].id].y);
    for (const [pl, k] of toks) this.drawToken(g, pl, k, now);

    this.stepParts(g);
    this.drawTrapAnims(g, now);
    this.drawReactions(g, now);
    if (this.highlight) {
      const o = this.highlight.owner;
      for (const k of this.highlight.tiles) {
        const p = this.ringPos(o.id, k);
        g.strokeStyle = '#fff'; g.lineWidth = 3.5; g.globalAlpha = 0.55 + 0.45 * Math.sin(now * 6);
        g.beginPath(); g.arc(p.x, p.y, 25, 0, 7); g.stroke(); g.globalAlpha = 1;
      }
    }
    if (this.hover) {
      const p = this.ringPos(this.hover.owner.id, this.hover.tile);
      g.font = '14px Georgia'; g.textAlign = 'left';
      const txt = this.tileLabel(this.hover.owner, this.hover.tile);
      const w = g.measureText(txt).width + 14;
      const x = clamp(p.x + 18, 4, 1596 - w), y = clamp(p.y - 36, 4, 870);
      g.fillStyle = 'rgba(0,0,0,0.88)'; this.rr(g, x, y, w, 24, 6); g.fill(); g.fillStyle = '#fff'; g.fillText(txt, x + 7, y + 17);
    }
    g.textAlign = 'center';
    this.floats = this.floats.filter(f => f.t < 1.6);
    for (const f of this.floats) {
      f.t += 1 / 60; g.globalAlpha = clamp(1.6 - f.t, 0, 1);
      g.font = 'bold 22px Georgia, "Segoe UI Emoji"'; g.fillStyle = '#000'; g.fillText(f.text, f.x + 2, f.y - f.t * 34 + 2);
      g.fillStyle = f.color || '#fff'; g.fillText(f.text, f.x, f.y - f.t * 34);
    }
    g.globalAlpha = 1;
  },

  drawDie(g, now) {
    const d = this.die; if (!d) return;
    const G = this.game, who = G.players[d.who];
    const cx = 552, cy = 530;
    if (d.state === 'rolling') { d.t += 1 / 60; if (Math.floor(d.t * 14) !== Math.floor((d.t - 1 / 60) * 14)) { const o = d.faces.filter(x => x !== d.face); d.face = R.pick(o.length ? o : d.faces); } d.rot += 0.35; }
    else if (d.state === 'stopping') d.rot += d.spin;
    else d.rot = lerp(d.rot, Math.round(d.rot / (Math.PI / 2)) * (Math.PI / 2), 0.25);
    d.hop = Math.max(0, d.hop - 0.08);
    let jump = d.state === 'rolling' ? Math.abs(Math.sin(now * 9)) * 22 : d.hop * 18;
    let sc = 1;
    if (d.land) { d.land += 1 / 60; sc = 1 + Math.max(0, 0.25 - d.land) * 1.4; }
    // glow & shadow
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.ellipse(cx, cy + 62, 50 - jump * 0.6, 12, 0, 0, 7); g.fill();
    if (d.state === 'landed') { g.save(); g.shadowColor = who.color; g.shadowBlur = 30; }
    g.save(); g.translate(cx, cy - jump); g.rotate(d.rot); g.scale(sc, sc);
    const s = 96;
    const gr = g.createLinearGradient(-s / 2, -s / 2, s / 2, s / 2);
    gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#d9d2ea');
    g.fillStyle = gr; this.rr(g, -s / 2, -s / 2, s, s, 18); g.fill();
    g.strokeStyle = who.color; g.lineWidth = 5; g.stroke();
    const pip = (x, y) => { g.beginPath(); g.arc(x * s * 0.27, y * s * 0.27, s * 0.085, 0, 7); g.fill(); };
    g.fillStyle = d.face === 1 ? '#d22' : '#222';
    const P = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] }[d.face] || [];
    P.forEach(([x, y]) => pip(x, y));
    g.restore();
    if (d.state === 'landed') g.restore();
    g.textAlign = 'center';
    if (d.state === 'rolling' && d.waiting) {
      g.font = 'bold 20px Georgia'; g.fillStyle = '#ffe680'; g.globalAlpha = 0.6 + 0.4 * Math.sin(now * 6);
      g.fillText('Click or press SPACE to stop!', cx, cy + 105); g.globalAlpha = 1;
    } else if (d.state === 'landed') {
      g.font = 'bold 26px Georgia'; g.fillStyle = '#fff';
      g.fillText(d.total !== null && d.total !== d.face ? `${d.face} → ${d.total}` : `${d.face}`, cx, cy + 105);
      if (d.note) { g.font = '15px Georgia'; g.fillStyle = '#c9bdf0'; g.fillText(d.note, cx, cy + 128); }
    }
  },

  tileLabel(o, k) {
    if (k === 16) return `${o.el.hold} · Tile 16: Waygate`;
    if (k === 8) return `${o.el.hold} · Tile 8: Starvault (${o.vault}⭐${o.vaultProt ? ', sealed' : ''})`;
    const pile = this.game.lootTile(o, k);
    if (pile) return `${o.el.hold} · Tile ${k}: Hoard — shows ${pile.real + pile.fake} coins${pile.prot ? `, Hoardward ${pile.prot}` : ''}`;
    if (o.traps[k]) return `${o.el.hold} · Tile ${k}: a trap is set here`;
    return `${o.el.hold} · Tile ${k}`;
  },

  drawHome(g, pl, now) {
    const c = this.homeCenter(pl.id), G = this.game;
    g.save();
    const grd = g.createRadialGradient(c.x, c.y, 10, c.x, c.y, 150);
    grd.addColorStop(0, pl.el.dark); grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd; g.beginPath(); g.arc(c.x, c.y, 150, 0, 7); g.fill();
    if (G.current === pl) { g.strokeStyle = pl.color; g.lineWidth = 4; g.globalAlpha = 0.5 + 0.5 * Math.sin(now * 4); g.beginPath(); g.arc(c.x, c.y, 146, 0, 7); g.stroke(); g.globalAlpha = 1; }
    if (G.simple) { g.fillStyle = 'rgba(255,255,255,0.06)'; g.beginPath(); g.arc(c.x, c.y, 92, 0, 7); g.fill(); g.strokeStyle = pl.color; g.lineWidth = 4; g.globalAlpha = 0.6; g.stroke(); g.globalAlpha = 1; }
    else { g.strokeStyle = 'rgba(255,255,255,0.13)'; g.lineWidth = 14; g.beginPath(); g.arc(c.x, c.y, this.RING, 0, 7); g.stroke(); }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    const raided = G.raidersIn(pl).length > 0;
    if (!this.reactionOf(pl.id)) Char.draw(g, c.x, c.y - 22, 25, pl.id, pl.color, { mood: raided ? 'scared' : (G.current === pl ? 'cheer' : 'happy'), seed: pl.id * 5, look: { x: Math.sin(now * 0.7 + pl.id), y: 0.2 } });
    g.font = 'bold 15px Georgia'; g.fillStyle = '#fff'; g.fillText(pl.el.hold, c.x, c.y + 24);
    g.font = '14px Georgia'; g.fillStyle = '#ffe680'; g.fillText(G.simple ? `⭐${pl.vault}   🪙${pl.cash}` : `⭐${pl.vault}   🏦${G.bank(pl)}`, c.x, c.y + 43);
    if (G.simple) { if (pl.items.includes('sdog')) { g.font = '22px "Segoe UI Emoji"'; g.fillText('🐕', c.x + 58, c.y + 30); } g.textBaseline = 'alphabetic'; g.restore(); return; }
    if (pl.hollow) { g.font = '12px Georgia'; g.fillStyle = '#7ccf4a'; g.fillText('Famished Earth', c.x, c.y + 60); }
    for (let k = 1; k <= 16; k++) {
      const p = this.ringPos(pl.id, k);
      let fill = 'rgba(28,26,48,0.95)', label = String(k), lc = '#9a95b8';
      const pile = G.lootTile(pl, k);
      if (k === 16) { fill = pl.color; label = '🌀'; lc = '#000'; }
      else if (k === 8) { fill = '#6b5512'; label = '⭐'; }
      else if (pile) { fill = '#8a6a12'; label = String(pile.real + pile.fake); lc = '#fff3b0'; }
      g.fillStyle = fill; g.beginPath(); g.arc(p.x, p.y, 20, 0, 7); g.fill();
      g.strokeStyle = pl.color; g.lineWidth = 2; g.stroke();
      if (pile && pile.prot) { g.strokeStyle = '#9fd8ff'; g.lineWidth = 3.5; g.beginPath(); g.arc(p.x, p.y, 20, 0, 7); g.stroke(); }
      if (k === 8 && pl.vaultProt) { g.strokeStyle = '#b4f'; g.lineWidth = 3.5; g.beginPath(); g.arc(p.x, p.y, 20, 0, 7); g.stroke(); }
      g.fillStyle = lc; g.font = (pile ? 'bold 15px' : '14px') + ' Georgia, "Segoe UI Emoji"';
      if (pile) { g.font = '11px "Segoe UI Emoji"'; g.fillText('🪙', p.x, p.y - 8); g.font = 'bold 13px Georgia'; g.fillText(label, p.x, p.y + 7); }
      else g.fillText(label, p.x, p.y + 1);
      if (pl.traps[k]) { const it = ITEM[pl.traps[k].id]; g.save(); g.translate(p.x + 15, p.y - 15); g.scale(1 + 0.08 * Math.sin(now * 4 + k), 1 + 0.08 * Math.sin(now * 4 + k)); g.fillStyle = 'rgba(120,0,0,0.85)'; g.beginPath(); g.arc(0, 0, 10, 0, 7); g.fill(); g.strokeStyle = '#ffb0b0'; g.lineWidth = 1.5; g.stroke(); g.font = '12px "Segoe UI Emoji"'; g.fillText(it.icon, 0, 1); g.restore(); }
    }
    g.textBaseline = 'alphabetic';
    g.restore();
  },

  tokenMood(pl, kind) {
    const G = this.game, t = pl.trav;
    const re = this.reactionOf(pl.id); if (re && (kind === 'T' || re.warden)) return re.mood;
    if (kind === 'D') return G.raidersIn(pl).length ? 'determined' : (G.current === pl ? 'happy' : 'neutral');
    if (t.prison) return 'hurt';
    if (t.frozen) return 'dizzy';
    if (t.poison) return 'hurt';
    if (G.isRaiding(pl)) return G.hotCoins(pl) + G.hotStars(pl) > 0 ? 'cheer' : 'determined';
    if (G.ankar !== null && t.loc === 'board' && ((t.pos - G.ankar + 40) % 40) < 6) return 'scared';
    return G.current === pl ? 'happy' : 'neutral';
  },
  drawToken(g, pl, kind, now) {
    const d = this.disp[kind + pl.id];
    const moving = d.k < 1;
    const look = { x: clamp((d.x - d.px) * 0.3, -1, 1), y: 0.2 };
    const r = kind === 'T' ? 16 : 13;
    g.fillStyle = pl.color; g.globalAlpha = 0.55; g.beginPath(); g.ellipse(d.x, d.y + r * 1.3 - d.hop, r * 1.05, r * 0.32, 0, 0, 7); g.fill();
    g.globalAlpha = 1; g.strokeStyle = pl.color; g.lineWidth = 2; g.stroke();
    if (kind === 'T' && this.game.current === pl) {
      g.fillStyle = pl.color; g.globalAlpha = 0.35 + 0.2 * Math.sin(now * 5);
      g.beginPath(); g.ellipse(d.x, d.y + r + 2, r * 1.4, r * 0.45, 0, 0, 7); g.fill(); g.globalAlpha = 1;
    }
    const t = pl.trav;
    let prop = null;
    if (kind === 'T') { if (t.prison) prop = '⛓️'; else if (t.armor) prop = '🛡️'; else if (this.game.hotCoins(pl) + this.game.hotStars(pl) > 0) prop = '💰'; }
    Char.draw(g, d.x, d.y, r, pl.id, pl.color, {
      mood: this.tokenMood(pl, kind), look, walk: moving ? 1 : 0, seed: pl.id * 3 + (kind === 'D' ? 1 : 0),
      hat: kind === 'D' ? 'helmet' : null, alpha: kind === 'T' && t.camo ? 0.55 : 1, prop,
    });
  },

  ambient(G, now) {
    if (Settings.test) return;
    for (let el = 0; el < 4; el++) {
      if (Math.random() > 0.25) continue;
      const c = this.homeCenter(el), a = Math.random() * Math.PI * 2, rr = R.range(20, 150);
      const x = c.x + Math.cos(a) * rr, y = c.y + Math.sin(a) * rr;
      if (el === 0) this.addP({ x, y, vx: R.range(20, 50), vy: R.range(-10, 10), life: 2, size: 3, kind: 'wisp', color: 'rgba(230,250,255,0.7)', drag: 0 });
      if (el === 1) this.addP({ x, y, vy: R.range(-40, -20), life: 2, size: R.range(2, 5), kind: 'bubble', color: 'rgba(180,220,255,0.8)', drag: 0 });
      if (el === 2) this.addP({ x, y, vx: R.range(-10, 10), vy: R.range(-60, -30), life: 1.4, size: R.range(1.5, 3), kind: 'ember', color: R.pick(['#ffd34d', '#ff8a3d', '#ff5a1f']), drag: 0 });
      if (el === 3) this.addP({ x, y: y - 40, vx: R.range(-15, 15), vy: R.range(15, 30), life: 2.2, size: 4, kind: 'leaf', color: R.pick(['#9be36b', '#7ccf4a', '#c8e66b']), drag: 0 });
    }
    if (G.ankar !== null && Math.random() < 0.5) { const p = this.trackPos(G.ankar); const d = this.disp.ANKAR || p; this.addP({ x: d.x + R.range(-14, 14), y: d.y - 30 + R.range(-8, 8), vy: -20, life: 0.9, size: R.range(3, 6), kind: 'dot', color: 'rgba(150,80,220,0.5)' }); }
  },
  stepParts(g) {
    const dt = 1 / 60;
    for (const p of this.parts) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.grav * dt; p.vx *= (1 - p.drag * dt); p.vy *= (1 - p.drag * dt); }
    this.parts = this.parts.filter(p => p.t < p.life);
    for (const p of this.parts) {
      const k = 1 - p.t / p.life;
      g.globalAlpha = Math.min(1, k * 1.6);
      switch (p.kind) {
        case 'text': g.font = `bold ${p.size}px Georgia`; g.textAlign = 'center'; g.fillStyle = p.color; g.fillText(p.text, p.x, p.y); break;
        case 'ring': g.strokeStyle = p.color; g.lineWidth = 3 * k + 1; g.beginPath(); g.arc(p.x, p.y, p.size + (1 - k) * p.grow, 0, 7); g.stroke(); break;
        case 'spark': g.strokeStyle = p.color; g.lineWidth = p.size * k; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - p.vx * 0.05, p.y - p.vy * 0.05); g.stroke(); break;
        case 'streak': g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - p.vx * 0.12, p.y - p.vy * 0.12); g.stroke(); break;
        case 'coin': g.fillStyle = '#ffd34d'; g.strokeStyle = '#a8790a'; g.lineWidth = 1.5; g.beginPath(); g.ellipse(p.x, p.y, p.size * Math.abs(Math.cos(p.t * 12)) + 1, p.size, 0, 0, 7); g.fill(); g.stroke(); break;
        case 'bubble': g.strokeStyle = p.color; g.lineWidth = 1.2; g.beginPath(); g.arc(p.x + Math.sin(p.t * 5) * 4, p.y, p.size, 0, 7); g.stroke(); break;
        case 'leaf': g.save(); g.translate(p.x + Math.sin(p.t * 3) * 10, p.y); g.rotate(Math.sin(p.t * 4) * 0.8); g.fillStyle = p.color; g.beginPath(); g.ellipse(0, 0, p.size, p.size * 0.45, 0, 0, 7); g.fill(); g.restore(); break;
        case 'wisp': g.strokeStyle = p.color; g.lineWidth = 1.5; g.beginPath(); g.arc(p.x, p.y, 6, p.t * 3, p.t * 3 + 2); g.stroke(); break;
        case 'twinkle': g.fillStyle = p.color; g.save(); g.translate(p.x, p.y); g.rotate(p.t * 3); g.fillRect(-p.size * 2, -0.7, p.size * 4, 1.4); g.fillRect(-0.7, -p.size * 2, 1.4, p.size * 4); g.restore(); break;
        default: g.fillStyle = p.color; g.beginPath(); g.arc(p.x, p.y, Math.max(0.5, p.size * (0.4 + 0.6 * k)), 0, 7); g.fill();
      }
    }
    g.globalAlpha = 1;
  },
  drawPortal(g, p, col, now, closed) {
    g.save(); g.translate(p.x, p.y);
    for (let k = 0; k < 3; k++) {
      g.strokeStyle = closed ? 'rgba(80,80,90,0.5)' : col; g.globalAlpha = 0.25 + 0.15 * k; g.lineWidth = 3;
      g.beginPath(); g.arc(0, 0, 40 + k * 7, now * (1.5 + k * 0.6) + k, now * (1.5 + k * 0.6) + k + 2.2); g.stroke();
    }
    g.restore(); g.globalAlpha = 1;
  },
  drawTrapAnims(g, now) {
    for (const a of this.trapAnims) {
      a.t += 1 / 60;
      const t = a.t;
      if (t < 0.5) { // falls from above, spinning
        const k = t / 0.5, y = a.y - (1 - k * k) * 160;
        g.save(); g.translate(a.x, y); g.rotate((1 - k) * 6); g.font = `${Math.round(26 + 20 * (1 - k))}px "Segoe UI Emoji"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(a.icon, 0, 0); g.restore();
      } else {
        if (!a.landed) { a.landed = true; this.burstAt({ x: a.x, y: a.y }, [a.owner.color, '#fff', '#ff6b6b'], 30, { speed: 260, kind: 'spark', size: 3 }); for (let k = 0; k < 2; k++) this.addP({ x: a.x, y: a.y, kind: 'ring', color: a.owner.color, size: 16 + k * 10, grow: 70, life: 0.7 }); }
        const k = Math.min(1, (t - 0.5) / 0.25), sc = 1 + (1 - k) * 0.6;
        g.save(); g.translate(a.x, a.y); g.scale(sc, sc); g.font = '30px "Segoe UI Emoji"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.globalAlpha = t > 1.8 ? Math.max(0, 1 - (t - 1.8) / 0.4) : 1; g.fillText(a.icon, 0, 0); g.restore();
        g.globalAlpha = t > 1.8 ? Math.max(0, 1 - (t - 1.8) / 0.4) : 1;
        g.font = 'bold 18px Georgia'; g.textAlign = 'center'; const tw = g.measureText(a.label).width + 20;
        g.fillStyle = 'rgba(0,0,0,0.8)'; this.rr(g, a.x - tw / 2, a.y - 62, tw, 28, 8); g.fill();
        g.strokeStyle = a.owner.color; g.lineWidth = 2; g.stroke(); g.fillStyle = '#fff'; g.fillText(a.label, a.x, a.y - 42);
        g.globalAlpha = 1; g.textBaseline = 'alphabetic';
      }
    }
    this.trapAnims = this.trapAnims.filter(a => a.t < 2.2);
  },

  // ---------------------------------------------------------- map view (key M / gamepad Y)
  drawMap(g, now) {
    const G = this.game;
    g.fillStyle = 'rgba(8,6,20,0.92)'; g.fillRect(0, 0, 1600, 900);
    g.textAlign = 'center'; g.font = 'bold 30px Georgia'; g.fillStyle = '#efe6ff';
    g.fillText('🗺️ Map of the Holds — traps and defenses', 800, 42);
    g.font = '15px Georgia'; g.fillStyle = '#a99bd8';
    g.fillText('Press M, gamepad Y or B, or click to close. Hidden wards (Saving Grace) never appear here.', 800, 66);
    G.players.forEach((pl, idx) => {
      const ox = (idx % 2) * 800, oy = 80 + Math.floor(idx / 2) * 410;
      g.fillStyle = 'rgba(255,255,255,0.04)'; this.rr(g, ox + 14, oy + 6, 772, 396, 18); g.fill();
      g.strokeStyle = pl.color; g.lineWidth = 2; g.stroke();
      const cx = ox + 190, cy = oy + 210, RR = 140;
      const tp = k => { const a = -Math.PI / 2 + (k % 16) * Math.PI / 8; return { x: cx + Math.cos(a) * RR, y: cy + Math.sin(a) * RR }; };
      Char.draw(g, cx, cy - 12, 30, pl.id, pl.color, { mood: G.raidersIn(pl).length ? 'scared' : 'happy', seed: pl.id });
      g.font = 'bold 16px Georgia'; g.fillStyle = pl.color; g.fillText(`${pl.el.hold} (${pl.name})`, cx, cy + 40);
      g.font = '13px Georgia'; g.fillStyle = '#ffe680'; g.fillText(`⭐${pl.vault}  🏦${G.bank(pl)}`, cx, cy + 58);
      for (let k = 1; k <= 16; k++) {
        const p = tp(k), pile = G.lootTile(pl, k), trap = pl.traps[k];
        g.fillStyle = k === 16 ? pl.color : k === 8 ? '#6b5512' : pile ? '#8a6a12' : trap ? '#5a1020' : 'rgba(40,36,64,1)';
        g.beginPath(); g.arc(p.x, p.y, 21, 0, 7); g.fill(); g.strokeStyle = pl.color; g.lineWidth = 2; g.stroke();
        g.textBaseline = 'middle'; g.font = '15px Georgia, "Segoe UI Emoji"'; g.fillStyle = '#fff';
        g.fillText(k === 16 ? '🌀' : k === 8 ? '⭐' : trap ? ITEM[trap.id].icon : pile ? String(pile.real + pile.fake) : String(k), p.x, p.y + 1);
        g.font = '10px Georgia'; g.fillStyle = '#aaa'; g.fillText(String(k), p.x + 18, p.y - 18);
        g.textBaseline = 'alphabetic';
      }
      if (pl.def) { const p = tp(pl.def.pos); Char.draw(g, p.x, p.y - 6, 11, pl.id, pl.color, { hat: 'helmet', noArms: true, mood: 'determined' }); }
      for (const r of G.raidersIn(pl)) { const p = tp(r.trav.pos); Char.draw(g, p.x + 8, p.y - 10, 10, r.id, r.color, { noArms: true, mood: 'determined' }); }
      // legend
      const lines = [];
      Object.keys(pl.traps).map(Number).sort((a, b) => a - b).forEach(k => { const it = ITEM[pl.traps[k].id]; lines.push([`Tile ${k}: ${it.icon} ${it.lore} (${it.name})`, it.desc]); });
      pl.piles.forEach(x => { const extra = []; if (x.prot) extra.push(`Hoardward ${x.prot} (${x.protUses} uses)`); if (x.mimic) extra.push('Mimic Chest'); lines.push([`Tile ${x.tile}: 🪙 Hoard showing ${x.real + x.fake} coins`, extra.join(', ') || 'A raider landing here takes up to 5 coins.']); });
      lines.push([`Tile 8: ⭐ Starvault — ${pl.vault} star${pl.vault === 1 ? '' : 's'}`, pl.vaultProt ? `🔏 Warding Seal active for ${pl.vaultProt} more turns.` : 'A raider landing here tries to steal a star.']);
      if (pl.hollow) lines.push(['⛰️ Famished Earth is active', 'Raiders lose coins and stars on Hoards and the Starvault.']);
      if (pl.ultHeld) lines.push([`${ITEM[pl.el.ult].icon} Holds the ${ITEM[pl.el.ult].lore} ultimate`, ITEM[pl.el.ult].desc]);
      g.textAlign = 'left'; let y = oy + 40;
      for (const [h, d] of lines) {
        if (y > oy + 380) break;
        g.font = 'bold 14px Georgia, "Segoe UI Emoji"'; g.fillStyle = '#fff'; g.fillText(h, ox + 370, y); y += 17;
        g.font = '12.5px Georgia'; g.fillStyle = '#b9b3d6';
        y = this.wrapText(g, d, ox + 382, y, 390, 15) + 6;
      }
      if (!Object.keys(pl.traps).length) { g.font = 'italic 13px Georgia'; g.fillStyle = '#888'; g.fillText('No traps set yet.', ox + 370, Math.min(y + 4, oy + 390)); }
      g.textAlign = 'center';
    });
  },
  wrapText(g, s, x, y, maxW, lh) {
    const words = s.split(' '); let line = '';
    for (const w of words) { const t = line ? line + ' ' + w : w; if (g.measureText(t).width > maxW && line) { g.fillText(line, x, y); y += lh; line = w; } else line = t; }
    if (line) { g.fillText(line, x, y); y += lh; }
    return y;
  },

  drawTitle(g, now) {
    g.textAlign = 'center';
    g.font = 'bold 84px Cinzel, Georgia, serif'; g.fillStyle = '#efe6ff';
    g.fillText('THE FOURFOLD', 800, 420);
    g.font = '24px Georgia'; g.fillStyle = '#b6a9e0';
    g.fillText('Four Holds. Twenty rounds. One Sky to keep.', 800, 465);
    for (let i = 0; i < 4; i++) {
      const a = now * 0.5 + i * Math.PI / 2;
      Char.draw(g, 800 + Math.cos(a) * 330, 440 + Math.sin(a) * 260, 42, i, ELEMENTS[i].color, { mood: 'cheer', seed: i, walk: 0.5 });
    }
  },
  rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); },
};
