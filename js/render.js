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
    for (const s of this.stars) { g.globalAlpha = 0.35 + 0.35 * Math.sin(now * 1.5 + s.t); g.fillStyle = '#fff'; g.beginPath(); g.arc(s.x, s.y, s.r, 0, 7); g.fill(); }
    g.globalAlpha = 1;
    if (!G) { this.drawTitle(g, now); return; }

    // inner field
    g.fillStyle = 'rgba(255,255,255,0.035)'; this.rr(g, 392, 182, 816, 536, 26); g.fill();
    g.strokeStyle = 'rgba(180,160,255,0.12)'; g.lineWidth = 2; g.stroke();

    // centre-left: round, current player, die
    g.textAlign = 'center';
    g.font = 'bold 30px Cinzel, Georgia, serif'; g.fillStyle = '#efe6ff';
    g.fillText(G.round ? `Round ${G.round} / ${G.rounds}` : 'Setup', 552, 230);
    g.font = '15px Georgia'; g.fillStyle = G.round === G.rounds ? '#ffcf5a' : '#a99bd8';
    g.fillText(G.round === G.rounds ? '🔔 The final bell has rung' : (G.round > 0 && G.round <= 3 ? 'Waygates sealed until round 4' : 'The Crossing'), 552, 254);
    if (G.current) {
      const c = G.current;
      const mood = this.die && this.die.who === c.id ? (this.die.state === 'landed' ? (this.die.face >= 4 ? 'cheer' : 'happy') : 'determined') : 'happy';
      Char.draw(g, 552, 330, 44, c.id, c.color, { mood, look: { x: 0, y: 0.6 }, seed: c.id * 2 });
      g.font = 'bold 17px Georgia'; g.fillStyle = c.color; g.fillText(`${c.name}'s turn`, 552, 405);
    }
    this.drawDie(g, now);

    // connectors
    for (let el = 0; el < 4; el++) {
      const a = this.trackPos(el * 10), c = this.ringPos(el, 16);
      g.strokeStyle = ELEMENTS[el].color; g.lineWidth = 5; g.globalAlpha = 0.45; g.setLineDash([8, 8]); g.lineDashOffset = -now * 20;
      g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(c.x, c.y); g.stroke(); g.setLineDash([]); g.globalAlpha = 1;
    }
    // track
    for (let i = 0; i < 40; i++) {
      const p = this.trackPos(i), sp = SPACE[G.board[i]], type = G.board[i];
      let col = sp.color; if (type === 'gate') col = ELEMENTS[i / 10].color;
      const w = type === 'gate' ? 66 : 56, h = type === 'gate' ? 62 : 52;
      g.fillStyle = 'rgba(0,0,0,0.4)'; this.rr(g, p.x - w / 2 + 3, p.y - h / 2 + 4, w, h, 10); g.fill();
      const gr = g.createLinearGradient(0, p.y - h / 2, 0, p.y + h / 2);
      gr.addColorStop(0, Char.shade(col, 0.25)); gr.addColorStop(1, Char.shade(col, -0.2));
      g.fillStyle = gr; this.rr(g, p.x - w / 2, p.y - h / 2, w, h, 10); g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 1.5; g.stroke();
      const closed = (type === 'gate' && G.closedGates[i]) || (type === 'bank' && G.closedBanks[i]);
      g.textAlign = 'center'; g.textBaseline = 'middle';
      const txt = /[0-9×+−]/.test(sp.icon) && sp.icon.length <= 2;
      g.fillStyle = ['blue', 'red', 'doubler'].includes(type) ? '#fff' : '#111';
      g.font = txt ? 'bold 21px Georgia' : (type === 'gate' ? '30px' : '25px') + ' "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
      g.fillText(type === 'gate' ? ELEMENTS[i / 10].glyph : sp.icon, p.x, p.y + 2);
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
    toks.forEach(([pl, k]) => { const key = k + pl.id, tg = this.tokenTarget(pl, k); const d = this.disp[key] || (this.disp[key] = { x: tg.x, y: tg.y, px: tg.x }); d.px = d.x; d.x = lerp(d.x, tg.x, 0.22); d.y = lerp(d.y, tg.y, 0.22); });
    toks.sort((a, b) => this.disp[a[1] + a[0].id].y - this.disp[b[1] + b[0].id].y);
    for (const [pl, k] of toks) this.drawToken(g, pl, k, now);

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
    g.strokeStyle = 'rgba(255,255,255,0.13)'; g.lineWidth = 14; g.beginPath(); g.arc(c.x, c.y, this.RING, 0, 7); g.stroke();
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '40px "Segoe UI Emoji", sans-serif'; g.fillText(pl.el.glyph, c.x, c.y - 26);
    g.font = 'bold 17px Georgia'; g.fillStyle = '#fff'; g.fillText(pl.el.hold, c.x, c.y + 12);
    g.font = '15px Georgia'; g.fillStyle = '#ffe680'; g.fillText(`⭐${pl.vault}   🏦${G.bank(pl)}`, c.x, c.y + 34);
    if (pl.hollow) { g.font = '12px Georgia'; g.fillStyle = '#7ccf4a'; g.fillText('Famished Earth', c.x, c.y + 54); }
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
      if (pl.traps[k]) { g.font = '14px "Segoe UI Emoji"'; g.fillText('⚠️', p.x + 15, p.y - 15); }
    }
    g.textBaseline = 'alphabetic';
    g.restore();
  },

  tokenMood(pl, kind) {
    const G = this.game, t = pl.trav;
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
    const moving = Math.abs(d.x - d.px) > 0.4;
    const look = { x: clamp((d.x - d.px) * 0.3, -1, 1), y: 0.2 };
    const r = kind === 'T' ? 16 : 13;
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
