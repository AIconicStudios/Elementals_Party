'use strict';
// Board renderer (canvas 900x900)
const Render = {
  W: 900, H: 900,
  canvas: null, g: null, game: null,
  disp: {},          // token display positions
  floats: [],
  highlight: null,   // {owner, tiles:[], onPick}
  hover: null,
  stars: [],
  init(canvas) {
    this.canvas = canvas; this.g = canvas.getContext('2d');
    for (let i = 0; i < 120; i++) this.stars.push({ x: Math.random() * 900, y: Math.random() * 900, r: Math.random() * 1.4 + 0.2, t: Math.random() * 6 });
    canvas.addEventListener('mousemove', e => { const p = this.mpos(e); this.hover = this.hitTile(p.x, p.y); });
    canvas.addEventListener('click', e => {
      const p = this.mpos(e); const h = this.hitTile(p.x, p.y);
      if (h && this.highlight && h.owner === this.highlight.owner && this.highlight.tiles.includes(h.tile)) this.highlight.onPick(h.tile);
    });
    const loop = () => { this.draw(); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  },
  mpos(e) { const r = this.canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * this.W, y: (e.clientY - r.top) / r.height * this.H }; },

  trackPos(i) {
    const a = 230, b = 670, s = 44;
    if (i < 10) return { x: a + s * i, y: a };
    if (i < 20) return { x: b, y: a + s * (i - 10) };
    if (i < 30) return { x: b - s * (i - 20), y: b };
    return { x: a, y: b - s * (i - 30) };
  },
  homeCenter(el) { return [{ x: 112, y: 112 }, { x: 788, y: 112 }, { x: 788, y: 788 }, { x: 112, y: 788 }][el]; },
  ringPos(el, k) {
    const c = this.homeCenter(el);
    const toCenter = Math.atan2(450 - c.y, 450 - c.x);
    const a = toCenter + (k % 16) * (Math.PI * 2 / 16);
    return { x: c.x + Math.cos(a) * 84, y: c.y + Math.sin(a) * 84 };
  },
  hitTile(x, y) {
    if (!this.game) return null;
    for (let el = 0; el < 4; el++) for (let k = 1; k <= 16; k++) {
      const p = this.ringPos(el, k); if (dist(x, y, p.x, p.y) < 16) return { owner: this.game.players[el], tile: k };
    }
    return null;
  },

  tokenTarget(p, kind) {
    if (kind === 'T') {
      const t = p.trav;
      const base = t.loc === 'board' ? this.trackPos(t.pos) : this.ringPos(t.ring, t.pos);
      const off = [[-9, -9], [9, -9], [9, 9], [-9, 9]][p.id];
      return { x: base.x + off[0] * (t.loc === 'board' ? 1 : 0.6), y: base.y + off[1] * (t.loc === 'board' ? 1 : 0.6) };
    }
    const b = this.ringPos(p.id, p.def.pos);
    return { x: b.x, y: b.y };
  },
  floatText(p, text, color) {
    const k = 'T' + p.id; const d = this.disp[k] || this.tokenTarget(p, 'T');
    this.floats.push({ x: d.x, y: d.y - 20, text, color, t: 0 });
  },

  draw() {
    const g = this.g, G = this.game;
    const now = performance.now() / 1000;
    // background
    const bg = g.createRadialGradient(450, 450, 50, 450, 450, 700);
    bg.addColorStop(0, '#22163f'); bg.addColorStop(1, '#07060f');
    g.fillStyle = bg; g.fillRect(0, 0, 900, 900);
    for (const s of this.stars) { g.globalAlpha = 0.4 + 0.4 * Math.sin(now * 1.5 + s.t); g.fillStyle = '#fff'; g.beginPath(); g.arc(s.x, s.y, s.r, 0, 7); g.fill(); }
    g.globalAlpha = 1;
    if (!G) { this.drawTitle(g, now); return; }

    // center plaque
    g.save();
    g.fillStyle = 'rgba(255,255,255,0.04)'; this.rr(g, 270, 270, 360, 360, 30); g.fill();
    g.textAlign = 'center'; g.fillStyle = '#e9e2ff';
    g.font = 'bold 34px Cinzel, Georgia, serif'; g.fillText('THE FOURFOLD', 450, 330);
    g.font = '15px Georgia, serif'; g.fillStyle = '#b6a9e0'; g.fillText('The Crossing', 450, 354);
    g.font = 'bold 20px Georgia, serif'; g.fillStyle = '#fff';
    g.fillText(G.round ? `Round ${G.round} / ${G.rounds}` : 'Setup', 450, 392);
    if (G.round === G.rounds) { g.fillStyle = '#ffcf5a'; g.fillText('🔔 Final bell', 450, 418); }
    if (G.round > 0 && G.round <= 3) { g.font = '14px Georgia'; g.fillStyle = '#9fb3ff'; g.fillText('Waygates sealed until round 4', 450, 418); }
    // dice
    if (G.dice) {
      const who = G.players[G.dice.who];
      g.fillStyle = who.color; this.rr(g, 410, 450, 80, 80, 14); g.fill();
      g.fillStyle = '#111'; g.font = 'bold 48px Georgia'; g.fillText(String(G.dice.v), 450, 507);
      if (G.dice.note) { g.font = '13px Georgia'; g.fillStyle = '#ddd'; g.fillText(G.dice.note, 450, 552); }
    }
    if (G.current) {
      g.font = '15px Georgia'; g.fillStyle = G.current.color;
      g.fillText(`${G.current.el.glyph} ${G.current.name}'s turn`, 450, 600);
    }
    g.restore();

    // track connectors to homes
    for (let el = 0; el < 4; el++) {
      const a = this.trackPos(el * 10), c = this.ringPos(el, 16);
      g.strokeStyle = ELEMENTS[el].color; g.lineWidth = 4; g.globalAlpha = 0.5; g.setLineDash([6, 6]);
      g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(c.x, c.y); g.stroke(); g.setLineDash([]); g.globalAlpha = 1;
    }
    // track
    for (let i = 0; i < 40; i++) {
      const p = this.trackPos(i), sp = SPACE[G.board[i]];
      let col = sp.color;
      if (G.board[i] === 'gate') col = ELEMENTS[i / 10].color;
      g.fillStyle = col; this.rr(g, p.x - 20, p.y - 20, 40, 40, 8); g.fill();
      g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 2; g.stroke();
      const closed = (G.board[i] === 'gate' && G.closedGates[i]) || (G.board[i] === 'bank' && G.closedBanks[i]);
      g.fillStyle = ['blue', 'red', 'doubler'].includes(G.board[i]) ? '#fff' : '#111';
      g.font = sp.icon.length <= 2 && /[0-9×+−]/.test(sp.icon) ? 'bold 15px Georgia' : '18px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(G.board[i] === 'gate' ? ELEMENTS[i / 10].glyph : sp.icon, p.x, p.y + 1);
      if (closed) { g.fillStyle = 'rgba(0,0,0,0.65)'; this.rr(g, p.x - 20, p.y - 20, 40, 40, 8); g.fill(); g.fillStyle = '#fff'; g.font = '16px sans-serif'; g.fillText('🌑', p.x, p.y); }
      g.textBaseline = 'alphabetic';
    }
    // homes
    for (const pl of G.players) this.drawHome(g, pl, now);

    // ankar
    if (G.ankar !== null) {
      const tp = this.trackPos(G.ankar);
      const d = this.disp.ANKAR || (this.disp.ANKAR = { x: tp.x, y: tp.y });
      d.x = lerp(d.x, tp.x, 0.2); d.y = lerp(d.y, tp.y, 0.2);
      g.save(); g.translate(d.x, d.y);
      g.shadowColor = '#b46bff'; g.shadowBlur = 20;
      g.fillStyle = '#3a1a5c'; g.beginPath(); g.ellipse(0, 0, 22, 14, 0, 0, 7); g.fill();
      g.fillStyle = '#e0c3ff'; g.beginPath(); g.ellipse(0, 0, 10, 10 * (0.6 + 0.4 * Math.abs(Math.sin(now * 2))), 0, 0, 7); g.fill();
      g.fillStyle = '#12051f'; g.beginPath(); g.arc(0, 0, 4, 0, 7); g.fill();
      g.restore();
    }

    // tokens
    for (const pl of G.players) {
      if (pl.def) this.drawToken(g, pl, 'D', now);
      if (!pl.gone) this.drawToken(g, pl, 'T', now);
    }

    // highlight tiles
    if (this.highlight) {
      const o = this.highlight.owner;
      for (const k of this.highlight.tiles) {
        const p = this.ringPos(o.id, k);
        g.strokeStyle = '#fff'; g.lineWidth = 3; g.globalAlpha = 0.6 + 0.4 * Math.sin(now * 6);
        g.beginPath(); g.arc(p.x, p.y, 17, 0, 7); g.stroke(); g.globalAlpha = 1;
      }
    }
    if (this.hover) {
      const p = this.ringPos(this.hover.owner.id, this.hover.tile);
      g.fillStyle = 'rgba(0,0,0,0.85)'; g.font = '12px Georgia'; g.textAlign = 'left';
      const txt = this.tileLabel(this.hover.owner, this.hover.tile);
      const w = g.measureText(txt).width + 12;
      const x = clamp(p.x + 14, 4, 896 - w), y = clamp(p.y - 30, 4, 880);
      this.rr(g, x, y, w, 20, 5); g.fill(); g.fillStyle = '#fff'; g.fillText(txt, x + 6, y + 14);
    }

    // floats
    g.textAlign = 'center';
    this.floats = this.floats.filter(f => f.t < 1.6);
    for (const f of this.floats) {
      f.t += 1 / 60; g.globalAlpha = clamp(1.6 - f.t, 0, 1);
      g.font = 'bold 18px Georgia, "Segoe UI Emoji"'; g.fillStyle = '#000'; g.fillText(f.text, f.x + 1, f.y - f.t * 30 + 1);
      g.fillStyle = f.color || '#fff'; g.fillText(f.text, f.x, f.y - f.t * 30);
    }
    g.globalAlpha = 1;
  },

  tileLabel(o, k) {
    if (k === 16) return `Tile 16: Waygate`;
    if (k === 8) return `Tile 8: Starvault (${o.vault}⭐${o.vaultProt ? ', sealed' : ''})`;
    const pile = this.game.lootTile(o, k);
    if (pile) return `Tile ${k}: Hoard — shows ${pile.real + pile.fake} coins${pile.prot ? `, Hoardward ${pile.prot}` : ''}`;
    if (o.traps[k]) return `Tile ${k}: a trap is set here`;
    return `Tile ${k}`;
  },

  drawHome(g, pl, now) {
    const c = this.homeCenter(pl.id), G = this.game;
    g.save();
    const grd = g.createRadialGradient(c.x, c.y, 10, c.x, c.y, 105);
    grd.addColorStop(0, pl.el.dark); grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd; g.beginPath(); g.arc(c.x, c.y, 108, 0, 7); g.fill();
    if (G.current === pl) { g.strokeStyle = pl.color; g.lineWidth = 3; g.globalAlpha = 0.5 + 0.5 * Math.sin(now * 4); g.beginPath(); g.arc(c.x, c.y, 106, 0, 7); g.stroke(); g.globalAlpha = 1; }
    g.strokeStyle = 'rgba(255,255,255,0.15)'; g.lineWidth = 10; g.beginPath(); g.arc(c.x, c.y, 84, 0, 7); g.stroke();
    // center
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '30px "Segoe UI Emoji", sans-serif'; g.fillText(pl.el.glyph, c.x, c.y - 16);
    g.font = 'bold 13px Georgia'; g.fillStyle = '#fff'; g.fillText(pl.el.hold, c.x, c.y + 12);
    g.font = '12px Georgia'; g.fillStyle = '#ffe680'; g.fillText(`⭐${pl.vault}  🏦${G.bank(pl)}`, c.x, c.y + 28);
    if (pl.hollow) { g.fillStyle = '#7ccf4a'; g.fillText('Famished Earth', c.x, c.y + 43); }
    for (let k = 1; k <= 16; k++) {
      const p = this.ringPos(pl.id, k);
      let fill = 'rgba(30,30,50,0.9)', label = String(k), lc = '#aaa';
      const pile = G.lootTile(pl, k);
      if (k === 16) { fill = pl.color; label = '🌀'; lc = '#000'; }
      else if (k === 8) { fill = '#5b4a12'; label = '⭐'; }
      else if (pile) { fill = '#7a5d10'; label = String(pile.real + pile.fake); lc = '#ffe680'; }
      g.fillStyle = fill; g.beginPath(); g.arc(p.x, p.y, 15, 0, 7); g.fill();
      g.strokeStyle = pl.color; g.lineWidth = 1.5; g.stroke();
      if (pile && pile.prot) { g.strokeStyle = '#9fd8ff'; g.lineWidth = 3; g.beginPath(); g.arc(p.x, p.y, 15, 0, 7); g.stroke(); }
      if (k === 8 && pl.vaultProt) { g.strokeStyle = '#b4f'; g.lineWidth = 3; g.beginPath(); g.arc(p.x, p.y, 15, 0, 7); g.stroke(); }
      g.fillStyle = lc; g.font = (label.length > 2 ? '12px' : 'bold 12px') + ' Georgia, "Segoe UI Emoji"';
      g.fillText(label, p.x, p.y + 1);
      if (pl.traps[k]) { g.font = '12px "Segoe UI Emoji"'; g.fillText('⚠️', p.x + 11, p.y - 11); }
    }
    g.textBaseline = 'alphabetic';
    g.restore();
  },

  drawToken(g, pl, kind, now) {
    const key = kind + pl.id;
    const tg = this.tokenTarget(pl, kind);
    const d = this.disp[key] || (this.disp[key] = { x: tg.x, y: tg.y });
    d.x = lerp(d.x, tg.x, 0.25); d.y = lerp(d.y, tg.y, 0.25);
    const bob = this.game.current === pl && kind === 'T' ? Math.sin(now * 6) * 2 : 0;
    g.save(); g.translate(d.x, d.y + bob);
    g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 6;
    if (kind === 'T') {
      g.fillStyle = pl.color; g.strokeStyle = '#fff'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(-8, 9); g.lineTo(8, 9); g.lineTo(4, -2); g.lineTo(-4, -2); g.closePath(); g.fill(); g.stroke();
      g.beginPath(); g.arc(0, -6, 6, 0, 7); g.fill(); g.stroke();
      const t = pl.trav;
      if (t.armor || t.camo) { g.shadowBlur = 0; g.font = '10px "Segoe UI Emoji"'; g.textAlign = 'center'; g.fillText(t.camo ? '🫥' : '🛡️', 10, -10); }
      if (this.game.hotCoins(pl) + this.game.hotStars(pl) > 0) { g.shadowBlur = 0; g.font = '10px "Segoe UI Emoji"'; g.textAlign = 'center'; g.fillText('🔥', -11, -10); }
      if (t.prison) { g.shadowBlur = 0; g.font = '12px "Segoe UI Emoji"'; g.textAlign = 'center'; g.fillText('⛓️', 0, 2); }
    } else {
      g.fillStyle = pl.el.dark; g.strokeStyle = pl.color; g.lineWidth = 2.5;
      g.beginPath(); g.moveTo(0, -11); g.lineTo(9, -6); g.lineTo(7, 6); g.lineTo(0, 11); g.lineTo(-7, 6); g.lineTo(-9, -6); g.closePath(); g.fill(); g.stroke();
    }
    g.restore();
  },

  drawTitle(g, now) {
    g.textAlign = 'center';
    g.font = 'bold 64px Cinzel, Georgia, serif'; g.fillStyle = '#efe6ff';
    g.fillText('THE FOURFOLD', 450, 380);
    g.font = '20px Georgia'; g.fillStyle = '#b6a9e0';
    g.fillText('Four Holds. Twenty rounds. One Sky to keep.', 450, 420);
    for (let i = 0; i < 4; i++) {
      const a = now * 0.5 + i * Math.PI / 2;
      g.font = '40px "Segoe UI Emoji"'; g.fillText(ELEMENTS[i].glyph, 450 + Math.cos(a) * 220, 400 + Math.sin(a) * 220);
    }
  },
  rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); },
};
