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
  X0: 360, X1: 1240, Y0: 60, Y1: 840,
  HOMES: [{ x: 180, y: 110 }, { x: 1420, y: 110 }, { x: 1420, y: 830 }, { x: 180, y: 830 }],
  RING: 118,

  init(canvas) {
    this.canvas = canvas; this.g = canvas.getContext('2d');
    for (let i = 0; i < 180; i++) this.stars.push({ x: Math.random() * 1600, y: Math.random() * 900, r: Math.random() * 1.4 + 0.2, t: Math.random() * 6 });
    canvas.addEventListener('mousemove', e => { const m = this.mpos(e), p = this.toWorld(m.x, m.y); this.hover = this.hitTile(p.x, p.y); });
    canvas.addEventListener('wheel', e => { if (!this.mapMode) return; const m = this.mpos(e); this.mapSel = (m.x >= 800 ? 1 : 0) + (m.y >= 490 ? 2 : 0); this.mapScroll(e.deltaY > 0 ? 50 : -50); e.preventDefault(); }, { passive: false });
    canvas.addEventListener('click', e => {
      const m0 = this.mpos(e), p = this.toWorld(m0.x, m0.y);
      if (this.mapMode) { UI.toggleMap(false); return; }
      if (this.stopper) { this.stopper.onStop(); return; }
      if (this.die && this.die.state === 'rolling' && this.die.onStop) { this.die.onStop(); return; }
      const h = this.hitTile(p.x, p.y);
      if (h && this.highlight && h.owner === this.highlight.owner && this.highlight.tiles.includes(h.tile)) this.highlight.onPick(h.tile);
    });
    const loop = () => { try { this.portraits(); } catch (e) { /* cards may be mid-refresh */ } try { this.draw(); } catch (e) { console.error(e); try { this.g.setTransform(1, 0, 0, 1, 0, 0); Stage.drawWorld(this.g); Stage.drawScreen(this.g); } catch (e2) { /* keep shows ticking */ } } requestAnimationFrame(loop); };
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
        const b = this.trackPos(t.pos), here = this.game.players.filter(q => !q.gone && q.trav.loc === 'board' && q.trav.pos === t.pos), n = here.length, k = here.indexOf(p);
        if (n <= 1) return { x: b.x, y: b.y };
        const off = [[-26, -10], [26, -10], [26, 12], [-26, 12]][k] || [0, 0];
        return { x: b.x + off[0], y: b.y + off[1] };
      }
      const b = this.ringPos(t.ring, t.pos);
      return { x: b.x + (p.id % 2 ? 14 : -14), y: b.y };
    }
    const b = this.ringPos(p.id, p.def.pos);
    return { x: b.x, y: b.y };
  },
  floatText(p, text, color) {
    const k = 'T' + p.id; const d = this.disp[k] || this.tokenTarget(p, 'T');
    this.floats.push({ x: d.x, y: d.y - 1, text, color, t: 0, lift: 70 });
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
    Sfx.land(type); this.attention = { x: p.x, y: p.y, t: performance.now() / 1000 };
    const col = type === 'gate' ? ELEMENTS[pos / 10].color : SPACE[type].color;
    this.burstAt(p, [col, '#ffffff'], 22, { speed: 230, life: 0.7, kind: 'spark', size: 3 });
    this.addP({ x: p.x, y: p.y, kind: 'ring', color: col, size: 20, grow: 60, life: 0.5 });
    this.flash[pos] = 1;
  },
  flash: {},
  coinBurst(pl, n) {
    const d = this.disp['T' + pl.id] || this.tokenTarget(pl, 'T');
    for (let k = 0; k < n; k++) this.addP({ x: d.x, y: d.y - 60, vx: R.range(-60, 60), vy: R.range(-300, -220), grav: 700, life: 0.9, size: 6, kind: 'coin', color: '#ffd34d' });
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
    if (pid === 3 && PEBBLE_MOOD[mood]) { // Pebble keeps it stoic and to the point
      const was = mood; mood = PEBBLE_MOOD[mood];
      if (mood === 'stoic' && text) text = R.pick(['Hmph. As expected.', 'Next.', 'Told you.', 'Moving on.', 'Of course.', 'Solid.']);
      else if (mood === 'grim' && text) text = R.pick(['...Noted.', 'Hmph.', "This isn't over.", 'Fine.']);
      else if (was === 'shock' && text) text = R.pick(['Oh, you did NOT.', 'Really?!', 'You want trouble?']);
    }
    this.reactions[pid] = { mood, text, t: -delay, dur, fx: false };
  },
  // small emoji bubble over a token on the board
  emote(pl, emoji, dur = 1.6) {
    if (pl.id === 3) { if (['😊', '🤑', '😄', '😂', '🥳', '😍', '🤩', '😁', '😆', '🙌'].includes(emoji)) emoji = '🗿'; else if (['😖', '😢', '😭', '😱', '😨', '😰'].includes(emoji)) emoji = '😤'; }
    if (!Settings.test) this.emotes[pl.id] = { emoji, t: 0, dur };
  },
  reactionOf(pid) { const r = this.reactions[pid]; return r && r.t >= 0 && r.t < r.dur ? r : null; },
  drawReactions(g, now) {
    const G = this.game;
    for (const pl of G.players) {
      const re = this.reactions[pl.id]; if (!re) continue;
      re.t += 1 / 60; if (re.t < 0) continue;
      if (re.t > re.dur) { delete this.reactions[pl.id]; continue; }
      if (!re.voiced) { re.voiced = true; if (re.text) Sfx.babble(pl.id, re.text, re.mood); else Sfx.moodVoice(pl.id, re.mood); }
      if (this.zoom) continue;
      const c0 = this.homeCenter(pl.id), c = { x: c0.x, y: c0.y - 20 };
      g.save(); this.up(g, c0.x, c0.y);
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
      g.restore();
    }
    // small emoji bubbles over tokens
    for (const pl of G.players) {
      const em = this.emotes[pl.id]; if (!em) continue;
      em.t += 1 / 60; if (em.t > em.dur) { delete this.emotes[pl.id]; continue; }
      const d = this.disp['T' + pl.id]; if (!d || pl.gone) continue;
      const k = Math.min(1, em.t / 0.2), a = em.t > em.dur - 0.25 ? (em.dur - em.t) / 0.25 : 1;
      g.save(); this.up(g, d.x, d.y); g.globalAlpha = a; g.translate(d.x + 22, d.y - 82 - k * 6); g.scale(0.6 + 0.4 * k, 0.6 + 0.4 * k);
      g.fillStyle = 'rgba(255,255,255,0.95)'; g.strokeStyle = pl.color; g.lineWidth = 2.5;
      g.beginPath(); g.arc(0, 0, 17, 0, 7); g.fill(); g.stroke(); g.beginPath(); g.moveTo(-8, 12); g.lineTo(-14, 22); g.lineTo(-2, 15); g.fill();
      g.font = '20px "Segoe UI Emoji", "Apple Color Emoji"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#000'; g.fillText(em.emoji, 0, 1);
      g.restore();
    }
  },
  moodColor(m) { return { evil: 'rgba(160,60,220,0.9)', laugh: 'rgba(255,220,90,0.9)', cry: 'rgba(90,170,255,0.9)', shock: 'rgba(255,255,255,0.9)', angry: 'rgba(255,60,40,0.9)', smug: 'rgba(200,160,255,0.8)', starry: 'rgba(255,230,120,0.95)', sick: 'rgba(120,220,80,0.8)', nervous: 'rgba(150,210,255,0.7)', sad: 'rgba(120,140,200,0.7)', proud: 'rgba(255,200,80,0.9)', stoic: 'rgba(190,160,110,0.85)', grim: 'rgba(120,100,80,0.8)' }[m] || 'rgba(255,255,255,0.6)'; },
  moodBurst(c, mood, col) {
    const at = { x: c.x, y: c.y - 20 };
    if (mood === 'shock') { this.addP({ x: at.x, y: at.y, kind: 'ring', color: '#fff', size: 20, grow: 90, life: 0.5 }); this.burstAt(at, ['#fff', '#ffe680'], 16, { speed: 280, kind: 'spark', size: 3 }); }
    else if (mood === 'evil') { this.burstAt(at, ['#b46bff', '#3a1a5c', '#e0c3ff'], 26, { speed: 220 }); }
    else if (mood === 'starry') { this.burstAt(at, ['#ffe680', '#fff'], 30, { speed: 260, kind: 'spark', size: 3 }); }
    else if (mood === 'angry') { this.burstAt(at, ['#ff4d4d', '#ffb347'], 18, { speed: 240, kind: 'spark', size: 3 }); }
    else if (mood === 'cry') { this.burstAt(at, ['#8fd0ff', '#4f8dff'], 16, { speed: 200, grav: 400 }); }
    else if (mood === 'stoic') { this.addP({ x: at.x, y: at.y + 40, kind: 'ring', color: '#b89a6a', size: 16, grow: 70, life: 0.6 }); this.burstAt({ x: at.x, y: at.y + 40 }, ['#8a7a66', '#b89a6a'], 12, { speed: 160, grav: 500 }); }
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
    if (G && !this.mapMode) return this.drawBoard(g, G, now);
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
  },
  outlined(g, s, x, y, font, col, lw = 4) { g.font = font; g.lineJoin = 'round'; g.lineWidth = lw; g.strokeStyle = 'rgba(20,30,20,0.75)'; g.strokeText(s, x, y); g.fillStyle = col; g.fillText(s, x, y); },
  T: 0.64, // how much the camera squashes the ground (2.5D tilt)
  // stand something upright at world point (x, y) while the ground is squashed
  up(g, x, y) { g.translate(x, y); g.scale(1, 1 / this.T); g.translate(-x, -y); },
  drawBoard(g, G, now) {
    g.fillStyle = '#6cc043'; g.fillRect(0, 0, 1600, 900);
    this.ambient(G, now);
    this.beginCam(g, G);
    World.ground(g, G);
    // spaces (flat discs in the path) and the Holds' floors
    for (let i = 0; i < 40; i++) this.drawSpace(g, G, i, this.trackPos(i), G.board[i], SPACE[G.board[i]], now);
    for (const pl of G.players) this.drawHome(g, pl, now);
    if (this.highlight) for (const k of this.highlight.tiles) { const p = this.ringPos(this.highlight.owner.id, k); g.strokeStyle = '#fff'; g.lineWidth = 4; g.globalAlpha = 0.55 + 0.45 * Math.sin(now * 6); g.beginPath(); g.arc(p.x, p.y, 27, 0, 7); g.stroke(); g.globalAlpha = 1; }
    // token movement
    const toks = [];
    for (const pl of G.players) { if (pl.def) toks.push([pl, 'D']); if (!pl.gone) toks.push([pl, 'T']); }
    toks.forEach(([pl, k]) => {
      const key = k + pl.id, tg = this.tokenTarget(pl, k);
      const d = this.disp[key] || (this.disp[key] = { x: tg.x, y: tg.y, px: tg.x, tx: tg.x, ty: tg.y, fx: tg.x, fy: tg.y, k: 1, hop: 0 });
      if (Math.abs(d.tx - tg.x) > 0.5 || Math.abs(d.ty - tg.y) > 0.5) { d.fx = d.x; d.fy = d.y - d.hop; d.tx = tg.x; d.ty = tg.y; d.k = 0; }
      d.px = d.x;
      const far = Math.hypot(d.tx - d.fx, d.ty - d.fy) > 160;
      d.k = Math.min(1, d.k + (far ? 0.045 : 0.085));
      const e = d.k < 0.5 ? 2 * d.k * d.k : 1 - Math.pow(-2 * d.k + 2, 2) / 2;
      d.x = lerp(d.fx, d.tx, e); d.y = lerp(d.fy, d.ty, e);
      d.hop = -Math.sin(d.k * Math.PI) * (far ? 60 : 24);
    });
    // everything that stands up, back to front
    const items = [];
    for (const d of World.decor) items.push({ x: d.x, y: d.y, f: () => World.drawDecor(g, d, now) });
    for (let el = 0; el < 4; el++) { const p = this.trackPos(el * 10); items.push({ x: p.x, y: p.y - 34, f: () => World.gate(g, p.x, p.y - 34, el, now, !!G.closedGates[el * 10]) }); }
    for (const pl of G.players) { const c = this.homeCenter(pl.id); items.push({ x: c.x, y: c.y, f: () => this.drawHomeUp(g, pl, now) }); }
    if (G.ankar !== null) {
      const tp = this.trackPos(G.ankar), d = this.disp.ANKAR || (this.disp.ANKAR = { x: tp.x, y: tp.y });
      d.x = lerp(d.x, tp.x, 0.15); d.y = lerp(d.y, tp.y, 0.15);
      g.fillStyle = 'rgba(60,0,80,0.35)'; g.beginPath(); g.ellipse(d.x, d.y, 34, 34, 0, 0, 7); g.fill();
      items.push({ x: d.x, y: d.y + 1, f: () => this.drawAnkar(g, d.x, d.y, now) });
    }
    for (const [pl, k] of toks) { const d = this.disp[k + pl.id]; this.drawTokenShadow(g, pl, k, d, now); items.push({ x: d.x, y: d.y, f: () => this.drawToken(g, pl, k, now) }); }
    // butterflies flutter among everything else
    for (let k = 0; k < 7; k++) { const bx = 800 + Math.sin(now * 0.31 + k * 1.9) * 640, by = 450 + Math.cos(now * 0.23 + k * 1.3) * 360; items.push({ x: bx, y: by, f: () => World.butterfly(g, bx, by - 50 - Math.sin(now * 2 + k) * 14, now, k) }); }
    items.sort((a, b) => a.y - b.y);
    for (const it of items) { g.save(); this.up(g, it.x, it.y); it.f(); g.restore(); }
    World.cloudShadows(g, now);

    this.stepParts(g);
    Stage.drawWorld(g);
    this.drawTrapAnims(g, now);
    this.drawReactions(g, now);
    if (this.hover) {
      const p = this.ringPos(this.hover.owner.id, this.hover.tile);
      g.save(); this.up(g, p.x, p.y);
      g.font = '14px Georgia'; g.textAlign = 'left';
      const txt = this.tileLabel(this.hover.owner, this.hover.tile), w = g.measureText(txt).width + 14, x = p.x + 18, y = p.y - 50;
      g.fillStyle = 'rgba(0,0,0,0.88)'; this.rr(g, x, y, w, 24, 6); g.fill(); g.fillStyle = '#fff'; g.fillText(txt, x + 7, y + 17);
      g.restore();
    }
    g.textAlign = 'center';
    this.floats = this.floats.filter(f => f.t < 1.6);
    for (const f of this.floats) {
      f.t += 1 / 60; g.save(); this.up(g, f.x, f.y); g.globalAlpha = clamp(1.6 - f.t, 0, 1);
      this.outlined(g, f.text, f.x, f.y - (f.lift || 0) - f.t * 40, 'bold 24px Georgia, "Segoe UI Emoji"', f.color || '#fff', 5);
      g.restore();
    }
    g.globalAlpha = 1;
    g.restore();
    World.light(g, now);
    this.bloom(g, 1600, 900, 0.14);
    // the die floats above whoever is rolling
    if (this.die) {
      const who = G.players[this.die.who], d = who && this.disp['T' + who.id];
      const sp = d ? this.toScreen(d.x, d.y) : { x: 800, y: 450 }, sc = clamp(0.55 * this.cam.s + 0.25, 0.75, 1.4);
      this.drawDie(g, now, clamp(sp.x, 120, 1480), clamp(sp.y - 150 * sc, 130, 760), sc);
    }
    if (this.zoom) this.drawZoomHud(g, now);
    Stage.drawScreen(g);
  },
  // tiny live portraits on the player cards
  portraits() {
    if (!this.game || Settings.test) return;
    this._pf = (this._pf || 0) + 1; if (this._pf % 2) return;
    const now = performance.now() / 1000;
    document.querySelectorAll('canvas.pport').forEach(cv => {
      const p = this.game.players[+cv.dataset.pid]; if (!p) return;
      const c = cv.getContext('2d'); c.clearRect(0, 0, 84, 84);
      const gr = c.createRadialGradient(42, 40, 4, 42, 42, 42); gr.addColorStop(0, Char.shade(p.color, 0.6)); gr.addColorStop(1, p.color); c.fillStyle = gr; c.beginPath(); c.arc(42, 42, 40, 0, 7); c.fill();
      c.save(); c.beginPath(); c.arc(42, 42, 38, 0, 7); c.clip();
      const re = this.reactionOf(p.id);
      Char.draw(c, 44, 46, 25, p.id, p.color, { mood: re ? re.mood : this.game.current === p ? 'cheer' : 'happy', seed: p.id * 3, noFeet: true, look: { x: 0.4 * Math.sin(now * 0.6 + p.id), y: 0.1 }, t: now });
      c.restore(); c.strokeStyle = '#fff'; c.lineWidth = 4; c.beginPath(); c.arc(42, 42, 39, 0, 7); c.stroke();
    });
  },
  bloom(g, W, H, amt) {
    if (Settings.test || Settings.fx === false) return;
    const b = this._bloom || (this._bloom = document.createElement('canvas')); b.width = W / 4; b.height = H / 4;
    const c = b.getContext('2d'); c.filter = 'brightness(1.05) contrast(2.6) saturate(1.3) blur(3px)'; c.drawImage(g.canvas, 0, 0, W / 4, H / 4); c.filter = 'none';
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'screen'; g.globalAlpha = amt; g.imageSmoothingEnabled = true; g.drawImage(b, 0, 0, W, H); g.restore();
  },
  drawAnkar(g, x, y, now) {
    g.save(); g.translate(x, y - 46 + Math.sin(now * 2) * 5);
    g.shadowColor = '#b46bff'; g.shadowBlur = 25;
    g.fillStyle = '#3a1a5c'; g.beginPath(); for (let k = 0; k <= 20; k++) { const a = k / 20 * Math.PI * 2, r = 30 + Math.sin(a * 5 + now * 4) * 3; g.lineTo(Math.cos(a) * r, Math.sin(a) * r * 0.75); } g.closePath(); g.fill();
    g.shadowBlur = 0;
    for (let k = 0; k < 5; k++) { g.strokeStyle = '#3a1a5c'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(-20 + k * 10, 14); g.quadraticCurveTo(-24 + k * 10 + Math.sin(now * 3 + k) * 8, 32, -18 + k * 10, 44); g.stroke(); }
    g.fillStyle = '#e0c3ff'; g.beginPath(); g.ellipse(0, 0, 15, 14 * (0.5 + 0.5 * Math.abs(Math.sin(now * 1.3))), 0, 0, 7); g.fill();
    g.fillStyle = '#ff2f5a'; g.beginPath(); g.arc(Math.sin(now) * 4, 0, 6, 0, 7); g.fill();
    g.restore();
  },
  // a Crossing space: a round disc set into the sandy path, with a living painted icon
  drawSpace(g, G, i, p, type, sp, now) {
    let col = sp.color; if (type === 'gate') col = ELEMENTS[i / 10].color;
    const r = type === 'gate' ? 36 : 30, x = p.x, y = p.y;
    const closed = (type === 'gate' && G.closedGates[i]) || (type === 'bank' && G.closedBanks[i]);
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.arc(x + 2, y + 9, r + 3, 0, 7); g.fill();
    g.fillStyle = Char.shade(col, -0.4); g.beginPath(); g.arc(x, y + 6, r, 0, 7); g.fill();
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.35, 2, x, y, r);
    gr.addColorStop(0, Char.shade(col, 0.45)); gr.addColorStop(0.7, col); gr.addColorStop(1, Char.shade(col, -0.15));
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r - 4, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.3)'; g.beginPath(); g.ellipse(x - r * 0.25, y - r * 0.35, r * 0.45, r * 0.22, -0.3, 0, 7); g.fill();
    if (this.flash[i] > 0) { g.fillStyle = `rgba(255,255,255,${this.flash[i] * 0.7})`; g.beginPath(); g.arc(x, y, r + 4, 0, 7); g.fill(); this.flash[i] -= 0.04; }
    if (type === 'bank' && !closed && Math.random() < 0.04) this.addP({ x: x + R.range(-24, 24), y: y + R.range(-20, 10), vy: -30, life: 0.8, size: 2.5, kind: 'twinkle', color: '#fff3b0' });
    const ph = now + i * 0.7;
    g.save(); g.translate(x, y);
    const emo = (ic, sz) => { g.font = `${sz}px "Segoe UI Emoji","Apple Color Emoji",sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.fillText(ic, 0, 1); };
    const num = (t) => { g.font = 'bold 24px Georgia'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 4; g.strokeStyle = 'rgba(0,0,0,0.35)'; g.strokeText(t, 0, 2); g.fillStyle = '#fff'; g.fillText(t, 0, 2); };
    if (type === 'gate') { const k = 1 + 0.08 * Math.sin(now * 3 + i); g.scale(k, k); emo(ELEMENTS[i / 10].glyph, 30); }
    else if (type === 'blue') num(G.simple ? '+3' : '+5');
    else if (type === 'red') num('−3');
    else if (type === 'lucky') { g.rotate(now * 1.2 + i); emo(sp.icon, 30); }
    else if (type === 'item') { const k = 1 + Math.max(0, Math.sin(ph * 2.4)) * 0.15; g.scale(k, k); emo(sp.icon, 30); }
    else if (type === 'summon') { const bl = ((ph * 0.6) % 3) < 0.15 ? 0.2 : 1; g.scale(1, bl); emo(sp.icon, 30); }
    else if (type === 'shutdown') { g.rotate(now * 0.4); emo(sp.icon, 28); }
    else if (type === 'doubler') { const k = 1 + 0.1 * Math.sin(ph * 4); g.scale(k, k); num('×2'); }
    else if (type === 'chameleon') { g.rotate(Math.sin(ph * 3) * 0.25); g.filter = `hue-rotate(${(now * 90) % 360}deg)`; emo(sp.icon, 30); g.filter = 'none'; }
    else if (type === 'swirl') { g.rotate(now * 2); emo(sp.icon, 30); }
    else if (type === 'party') { const k = 1 + 0.12 * Math.abs(Math.sin(ph * 3)); g.scale(k, k); emo(sp.icon, 30); }
    else emo(sp.icon, 30);
    g.restore(); g.textBaseline = 'alphabetic';
    if (closed || this.shut[i]) {
      const st = this.shut[i], k = st ? clamp((now - st) / 0.5, 0, 1) : 1;
      if (!closed && st && now - st > 1.2) delete this.shut[i];
      else { g.fillStyle = `rgba(10,8,24,${0.75 * this.easeBounce(k)})`; g.beginPath(); g.arc(x, y, r + 2, 0, 7); g.fill(); if (k >= 1) { g.font = '24px "Segoe UI Emoji"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('🌑', x, y); g.textBaseline = 'alphabetic'; } }
    }
  },

  easeBounce(k) { if (k < 0.7) return (k / 0.7) * (k / 0.7); const q = (k - 0.7) / 0.3; return 1 - Math.sin(q * Math.PI) * 0.12; },

  // ---------------------------------------------------------- close-up camera (V / gamepad LB or LT)
  zoom: false, cam: null, focus: null, anim: {}, shut: {},
  beginCam(g, G) {
    const c = this.cam || (this.cam = { x: 800, y: 470, s: 1 }), T = this.T;
    let tx = 800, ty = 470, ts = 1;
    if (this.focus) { ts = this.focus.s; tx = this.focus.x; ty = this.focus.y; }
    else if (this.zoom) {
      ts = 2.0;
      if (this.highlight) { const h = this.homeCenter(this.highlight.owner.id); tx = h.x; ty = h.y; }
      else { const p = G.current, d = p && !p.gone && this.disp['T' + p.id]; if (d) { tx = d.x; ty = d.y - 30; } }
    }
    const hw = 800 / ts, hh = 450 / (ts * T);
    tx = clamp(tx, World.OX + hw, World.OX + World.GW - hw); ty = clamp(ty, World.OY + hh, World.OY + World.GH - hh);
    const cl = this.focus ? 0.12 : 0.09; c.x = lerp(c.x, tx, cl); c.y = lerp(c.y, ty, cl); c.s = lerp(c.s, ts, 0.12);
    const fm = !!this.focus; if (fm !== this._fm) { this._fm = fm; document.getElementById('app').classList.toggle('focusmode', fm); }
    g.save(); g.translate(800, 450); g.scale(c.s, c.s * T); g.translate(-c.x, -c.y);
    return true;
  },
  toScreen(x, y) { const c = this.cam; if (!c || !this.game) return { x, y }; return { x: (x - c.x) * c.s + 800, y: (y - c.y) * c.s * this.T + 450 }; },
  toWorld(x, y) { const c = this.cam; if (!c || !this.game) return { x, y }; return { x: (x - 800) / c.s + c.x, y: (y - 450) / (c.s * this.T) + c.y }; },
  toggleZoom(on) { this.zoom = on === undefined ? !this.zoom : on; document.getElementById('app').classList.toggle('zoommode', this.zoom); const b = document.getElementById('viewBtn'); if (b) b.innerHTML = this.zoom ? '🗺️ Whole board <small>V · LB</small>' : '🔍 Close-up <small>V · LB</small>'; Sfx.click(); },
  drawZoomHud(g, now) {
    const G = this.game;
    if (false) {
    G.players.forEach((p, i) => {
      const x = 16 + i * 330, cur = G.current === p, re = this.reactionOf(p.id);
      if (cur) { g.fillStyle = 'rgba(255,255,255,0.08)'; this.rr(g, x - 6, 6, 316, 50, 12); g.fill(); g.strokeStyle = p.color; g.lineWidth = 2; g.stroke(); }
      Char.draw(g, x + 24, 30, 17, p.id, p.color, { mood: re ? re.mood : cur ? 'happy' : 'neutral', noFeet: true, simple: true, seed: p.id, look: { x: 0.5, y: 0 } });
      g.textAlign = 'left'; g.font = 'bold 18px Georgia'; g.fillStyle = p.color; g.fillText(p.name, x + 54, 27);
      g.font = '16px Georgia, "Segoe UI Emoji"'; g.fillStyle = '#ffe680';
      g.fillText(G.simple ? `⭐ ${p.vault}   🪙 ${p.cash}` : `⭐ ${p.vault}   🏦 ${G.bank(p)}   💰 ${p.cash}`, x + 54, 49);
    });
    g.textAlign = 'right'; g.font = 'bold 18px Georgia'; g.fillStyle = '#efe6ff';
    g.fillText(G.round ? `Round ${G.round}/${G.rounds}` : 'Setup', 1400, 38);
    }
    // reaction portraits slide in from the left edge
    let k = 0;
    for (const pl of G.players) {
      const re = this.reactionOf(pl.id); if (!re) continue;
      const e = Math.min(1, re.t / 0.35), pop = 1 + 2.7 * Math.pow(e - 1, 3) + 1.7 * Math.pow(e - 1, 2);
      const out = re.t > re.dur - 0.3 ? (re.dur - re.t) / 0.3 : 1;
      const x = -120 + 230 * pop * (0.5 + 0.5 * out), y = 150 + k * 165; k++;
      g.save(); g.globalAlpha = out;
      const gl = g.createRadialGradient(x, y, 10, x, y, 85); gl.addColorStop(0, this.moodColor(re.mood)); gl.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gl; g.beginPath(); g.arc(x, y, 85, 0, 7); g.fill();
      g.fillStyle = 'rgba(12,8,28,0.85)'; g.beginPath(); g.arc(x, y, 62, 0, 7); g.fill(); g.strokeStyle = pl.color; g.lineWidth = 4; g.stroke();
      g.save(); g.beginPath(); g.arc(x, y, 62, 0, 7); g.clip();
      Char.draw(g, x, y + 4, 40, pl.id, pl.color, { mood: re.mood, seed: pl.id * 5, look: { x: 0.6, y: 0 } });
      g.restore();
      if (re.text) {
        g.font = 'bold 18px Georgia, "Segoe UI Emoji"'; const tw = Math.min(300, g.measureText(re.text).width + 24);
        const bx = x + 74, by = y - 40;
        g.fillStyle = 'rgba(255,255,255,0.96)'; g.strokeStyle = pl.color; g.lineWidth = 3; this.rr(g, bx, by, tw, 34, 12); g.fill(); g.stroke();
        g.beginPath(); g.moveTo(bx + 1, by + 12); g.lineTo(bx - 12, by + 22); g.lineTo(bx + 1, by + 24); g.fill();
        g.fillStyle = '#2a1410'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(re.text, bx + tw / 2, by + 18, tw - 14); g.textBaseline = 'alphabetic';
        g.font = 'bold 14px Georgia'; g.fillStyle = pl.color; g.textAlign = 'left'; g.fillText(pl.name, bx + 4, by + 52);
      }
      g.restore();
    }
  },

  drawDie(g, now, cx = 552, cy = 530, dsc = 1) {
    const d = this.die; if (!d) return;
    const G = this.game, who = G.players[d.who];
    g.save(); g.translate(cx, cy); g.scale(dsc, dsc); g.translate(-cx, -cy);
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
    g.restore();
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
    if (G.current === pl) { g.strokeStyle = pl.color; g.lineWidth = 4; g.globalAlpha = 0.5 + 0.5 * Math.sin(now * 4); g.beginPath(); g.arc(c.x, c.y, 146, 0, 7); g.stroke(); g.globalAlpha = 1; }
    if (G.simple) { g.fillStyle = 'rgba(255,255,255,0.22)'; g.beginPath(); g.arc(c.x, c.y, 92, 0, 7); g.fill(); g.strokeStyle = pl.color; g.lineWidth = 4; g.globalAlpha = 0.6; g.stroke(); g.globalAlpha = 1; }
    else { g.strokeStyle = 'rgba(80,60,40,0.35)'; g.lineWidth = 16; g.beginPath(); g.arc(c.x, c.y, this.RING, 0, 7); g.stroke(); }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    const raided = G.raidersIn(pl).length > 0;
    g.fillStyle = 'rgba(0,0,0,0.22)'; g.beginPath(); g.arc(c.x, c.y + 4, 34, 0, 7); g.fill();
    if (G.simple) { g.textBaseline = 'alphabetic'; g.restore(); return; }
    for (let k = 1; k <= 16; k++) {
      const p = this.ringPos(pl.id, k);
      let fill = 'rgba(28,26,48,0.95)', label = String(k), lc = '#9a95b8';
      const pile = G.lootTile(pl, k);
      if (k === 16) { fill = pl.color; label = '🌀'; lc = '#000'; }
      else if (k === 8) { fill = '#6b5512'; label = '⭐'; }
      else if (pile) { fill = '#8a6a12'; label = String(pile.real + pile.fake); lc = '#fff3b0'; }
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.arc(p.x, p.y + 5, 21, 0, 7); g.fill();
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

  // the upright part of a Hold: its mascot, name, and any guard items
  drawHomeUp(g, pl, now) {
    const c = this.homeCenter(pl.id), G = this.game, raided = G.raidersIn(pl).length > 0;
    if (!this.reactionOf(pl.id)) { const lf = this.life('H' + pl.id, now, false, false); g.save(); if (lf.rot) { g.translate(c.x, c.y); g.rotate(lf.rot); g.translate(-c.x, -c.y); } Char.draw(g, c.x, c.y - 34 + (lf.dy || 0), 28, pl.id, pl.color, { mood: raided ? 'scared' : (lf.mood || (G.current === pl ? 'cheer' : 'happy')), seed: pl.id * 5, look: { x: lf.lookX !== undefined ? lf.lookX : Math.sin(now * 0.7 + pl.id), y: 0.2 } }); g.restore(); }
    g.textAlign = 'center';
    this.outlined(g, pl.el.hold, c.x, c.y + 22, 'bold 17px Georgia', '#fff', 5);
    if (G.simple && pl.shade) { g.save(); g.globalAlpha = 0.55 + 0.1 * Math.sin(now * 1.5); const sg = g.createRadialGradient(c.x, c.y - 40, 10, c.x, c.y - 40, 110); sg.addColorStop(0, 'rgba(60,40,90,0.75)'); sg.addColorStop(1, 'rgba(30,20,50,0)'); g.fillStyle = sg; g.beginPath(); g.arc(c.x, c.y - 40, 110, 0, 7); g.fill(); g.restore(); g.font = '26px "Segoe UI Emoji"'; g.textBaseline = 'middle'; g.fillText('🌫️', c.x, c.y - 100 + Math.sin(now * 2) * 3); g.textBaseline = 'alphabetic'; }
    if (G.simple && !pl.shade) { const guards = (pl.guards || []).map(gd => gd.id); guards.forEach((x, k) => { g.font = '24px "Segoe UI Emoji"'; g.textBaseline = 'middle'; g.fillText(ITEM[x].icon, c.x - 40 + k * 40, c.y - 96 + Math.sin(now * 3 + k) * 3); g.textBaseline = 'alphabetic'; }); }
    if (pl.hollow) this.outlined(g, 'Famished Earth', c.x, c.y + 42, '12px Georgia', '#9fe07a', 4);
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
  // one soft contact shadow on the ground under each piece: flat (the board is seen from above at an angle),
  // nudged away from the sun (top-left), and smaller and fainter the higher the piece hops
  drawTokenShadow(g, pl, kind, d, now) {
    const r = this.tokenR(pl, kind), lf = this.lifeState[kind + pl.id], up = Math.max(0, -d.hop) + Math.max(0, -((lf && lf.lastDy) || 0));
    const k = clamp(1 - up / (r * 3), 0.45, 1), sx = d.x + r * 0.12, w = r * 1.02 * k, h = r * 0.34 * k;
    if (kind === 'T' && this.game.current === pl) {
      // the current player's glowing ground ring
      g.save(); g.globalAlpha = 0.5 + 0.3 * Math.sin(now * 5); g.strokeStyle = pl.color; g.lineWidth = 4; g.beginPath(); g.ellipse(d.x, d.y, r * 1.2, r * 0.46, 0, 0, 7); g.stroke();
      g.globalAlpha *= 0.35; g.lineWidth = 10; g.stroke(); g.restore();
    }
    const gr = g.createRadialGradient(sx, d.y, 0, sx, d.y, w);
    gr.addColorStop(0, `rgba(25,15,35,${0.5 * k})`); gr.addColorStop(0.5, `rgba(25,15,35,${0.3 * k})`); gr.addColorStop(1, 'rgba(25,15,35,0)');
    g.save(); g.translate(sx, d.y); g.scale(1, h / w); g.translate(-sx, -d.y); g.fillStyle = gr; g.beginPath(); g.arc(sx, d.y, w, 0, 7); g.fill(); g.restore();
  },
  // board pieces are big and readable; a little smaller inside the Holds' rings, where tiles sit closer
  tokenR(pl, kind) { if (kind !== 'T') return 28; return pl.trav.loc === 'board' ? 42 : 32; },
  // little idle "life" for characters standing around: waves, hops, dances, yawns, stretches, spins
  lifeState: {}, attention: null,
  life(key, now, busy, isCur) {
    const L = this.lifeState[key] || (this.lifeState[key] = { next: now + R.range(1.5, 5), act: null, t0: 0 });
    if (busy) { L.act = null; L.next = now + R.range(2, 5); return {}; }
    if (now > L.next) { L.act = R.pick(isCur ? ['hop', 'wave', 'dance', 'look'] : ['wave', 'hop', 'dance', 'look', 'yawn', 'stretch', 'spin', 'look']); L.t0 = now; L.next = now + R.range(3.5, 8); }
    const k = now - L.t0, D = { wave: 1.6, hop: 0.9, dance: 2.2, look: 1.6, yawn: 1.5, stretch: 1.1, spin: 0.7 }[L.act] || 0;
    if (!L.act || k > D) return {};
    switch (L.act) {
      case 'wave': return { mood: 'happy', wave: true, lookX: 0, dy: -Math.abs(Math.sin(k * 6)) * 3 };
      case 'hop': return { dy: -Math.abs(Math.sin(k / 0.45 * Math.PI)) * 16, sq: Math.max(0, 1 - k / 0.15) * 0.15 };
      case 'dance': return { mood: 'cheer', dy: -Math.abs(Math.sin(k * 7)) * 9, rot: Math.sin(k * 7) * 0.22 };
      case 'look': return { lookX: Math.sin(k * 3) > 0 ? 1 : -1, lookY: -0.5 };
      case 'yawn': return { mood: 'sleepy', sq: -Math.sin(k / D * Math.PI) * 0.08 };
      case 'stretch': return { sq: -Math.sin(k / D * Math.PI) * 0.18 };
      case 'spin': return { flip: Math.cos(k / D * Math.PI * 2) };
    }
    return {};
  },
  drawToken(g, pl, kind, now) {
    const d = this.disp[kind + pl.id];
    const moving = d.k < 1;
    const look = { x: clamp((d.x - d.px) * 0.3, -1, 1), y: 0.2 };
    // when standing still, watch whoever is playing (or whatever just happened)
    if (!moving) { const cur = this.game.current, cd = cur && this.disp['T' + cur.id]; const tgt = this.attention && now - this.attention.t < 1.8 ? this.attention : cd && cur !== pl ? cd : null; if (tgt) look.x = clamp((tgt.x - d.x) / 80, -1, 1); }
    const lf = kind === 'T' ? this.life(kind + pl.id, now, moving || !!this.anim[pl.id] || !!this.reactionOf(pl.id) || (this.die && this.die.who === pl.id), this.game.current === pl) : {};
    if (lf.lookX !== undefined) look.x = lf.lookX; if (lf.lookY !== undefined) look.y = lf.lookY;
    const r = this.tokenR(pl, kind), cy = d.y + d.hop - r * 1.28 + (lf.dy || 0);
    if (this.lifeState[kind + pl.id]) this.lifeState[kind + pl.id].lastDy = lf.dy || 0;
    const t = pl.trav;
    let prop = null;
    if (kind === 'T') { if (t.prison) prop = '⛓️'; else if (t.armor) prop = '🛡️'; else if (this.game.hotCoins(pl) + this.game.hotStars(pl) > 0) prop = '💰'; }
    const an = kind === 'T' ? this.anim[pl.id] : null;
    g.save();
    if (an) { g.translate(d.x + (an.dx || 0), cy + (an.dy || 0)); if (an.rot) g.rotate(an.rot); g.translate(-d.x, -cy); if (an.dx) look.x = clamp(-Math.sign(an.dx), -1, 1); }
    if (lf.rot) { g.translate(d.x, cy + r); g.rotate(lf.rot); g.translate(-d.x, -cy - r); }
    if (lf.sq) { g.translate(d.x, cy + r * 1.3); g.scale(1 + lf.sq, 1 - lf.sq); g.translate(-d.x, -cy - r * 1.3); }
    if (lf.flip !== undefined) { g.translate(d.x, 0); g.scale(Math.abs(lf.flip) < 0.15 ? 0.15 * Math.sign(lf.flip || 1) : lf.flip, 1); g.translate(-d.x, 0); }
    Char._wave = !!lf.wave;
    Char.draw(g, d.x, cy, r, pl.id, pl.color, {
      mood: an && an.mood ? an.mood : lf.mood && this.tokenMood(pl, kind) !== 'scared' ? lf.mood : this.tokenMood(pl, kind), look, walk: moving ? 1 : 0, seed: pl.id * 3 + (kind === 'D' ? 1 : 0),
      hat: kind === 'D' ? 'helmet' : null, alpha: kind === 'T' && t.camo ? 0.55 : 1, prop, noShadow: true, // the ground shadow is drawn separately (it stays put when they hop)
    });
    Char._wave = false;
    g.restore();
  },

  ambient(G, now) {
    if (Settings.test) return;
    if (Math.random() < 0.0035) Sfx.bird(); if (Math.random() < 0.0008) Sfx.breeze();
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
      g.save(); this.up(g, a.x, a.y);
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
      g.restore();
    }
    this.trapAnims = this.trapAnims.filter(a => a.t < 2.2);
  },

  // ---------------------------------------------------------- map view (key M / gamepad Y)
  mapScroll(d) { const k = this.mapSel || 0; this.mapOff = this.mapOff || [0, 0, 0, 0]; const mx = (this.mapMax || [0, 0, 0, 0])[k]; this.mapOff[k] = clamp(this.mapOff[k] + d, 0, mx); },
  drawMap(g, now) {
    const G = this.game;
    g.fillStyle = 'rgba(8,6,20,0.92)'; g.fillRect(0, 0, 1600, 900);
    g.textAlign = 'center'; g.font = 'bold 30px Georgia'; g.fillStyle = '#efe6ff';
    g.fillText('🗺️ Map of the Holds — traps and defenses', 800, 42);
    g.font = '15px Georgia'; g.fillStyle = '#a99bd8';
    g.fillText('Up/Down (or mouse wheel) scrolls a Hold\'s list · Left/Right picks a Hold · M, gamepad Y or B, or click closes. Hidden wards never appear here.', 800, 66);
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
      // legend (scrollable)
      const lines = [];
      Object.keys(pl.traps).map(Number).sort((a, b) => a - b).forEach(k => { const it = ITEM[pl.traps[k].id]; lines.push([`Tile ${k}: ${it.icon} ${it.lore} (${it.name})`, it.desc]); });
      pl.piles.forEach(x => { const extra = []; if (x.prot) extra.push(`Hoardward ${x.prot} (${x.protUses} uses)`); if (x.mimic) extra.push('Mimic Chest'); lines.push([`Tile ${x.tile}: 🪙 Hoard showing ${x.real + x.fake} coins`, extra.join(', ') || 'A raider landing here takes up to 5 coins.']); });
      lines.push([`Tile 8: ⭐ Starvault — ${pl.vault} star${pl.vault === 1 ? '' : 's'}`, pl.vaultProt ? `🔏 Warding Seal active for ${pl.vaultProt} more turns.` : 'A raider landing here tries to steal a star.']);
      if (pl.hollow) lines.push(['⛰️ Famished Earth is active', 'Raiders lose coins and stars on Hoards and the Starvault.']);
      if (pl.ultHeld) lines.push([`${ITEM[pl.el.ult].icon} Holds the ${ITEM[pl.el.ult].lore} ultimate`, ITEM[pl.el.ult].desc]);
      g.textAlign = 'left'; const sc = (this.mapOff = this.mapOff || [0, 0, 0, 0])[idx]; let y = oy + 40 - sc;
      g.save(); g.beginPath(); g.rect(ox + 360, oy + 18, 420, 378); g.clip();
      for (const [h, d] of lines) {
        g.font = 'bold 14px Georgia, "Segoe UI Emoji"'; g.fillStyle = '#fff'; g.fillText(h, ox + 370, y); y += 17;
        g.font = '12.5px Georgia'; g.fillStyle = '#b9b3d6';
        y = this.wrapText(g, d, ox + 382, y, 390, 15) + 6;
      }
      g.restore();
      // how far this legend can scroll; a scroll bar when it doesn't fit
      const total = y + sc - (oy + 40), view = 340; (this.mapMax = this.mapMax || [0, 0, 0, 0])[idx] = Math.max(0, total - view);
      if (total > view) { const bh = view * view / total, by = oy + 26 + (view - bh) * (sc / Math.max(1, total - view)); g.fillStyle = 'rgba(255,255,255,0.12)'; this.rr(g, ox + 772, oy + 26, 6, view, 3); g.fill(); g.fillStyle = pl.color; this.rr(g, ox + 772, by, 6, bh, 3); g.fill(); }
      if ((this.mapSel || 0) === idx) { g.strokeStyle = '#ffe680'; g.lineWidth = 4; this.rr(g, ox + 10, oy + 2, 780, 404, 20); g.stroke(); if (total > view) { g.font = '12px Georgia'; g.fillStyle = '#ffe680'; g.textAlign = 'right'; g.fillText('▲▼ scroll', ox + 766, oy + 396); } }
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
