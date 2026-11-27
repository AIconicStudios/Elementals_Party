'use strict';
// Number Climb — an 8-bit arcade look: black night, brick girder, twin chain vines, grass islands over dark water,
// chunky pixel numbers and signs. Layout: signs × and − on the left islands, + and ÷ on the right, an empty island in
// the middle, the start island on the far right. Every vine on a side links sideways to the next (hold LEFT/RIGHT).
(() => {
  // ---------------------------------------------------------------- layout
  NC.ISL = [[90, 218], [294, 422], [499, 627], [704, 832], [909, 1037], [1114, 1242]];
  NC.SLOTS = [154, 358, 563, 768, 973, 1178];               // the island centres where signs can stand
  NC.HOME = { '×': 154, '−': 358, '+': 768, '÷': 973 };      // where each sign starts
  NC.SITES = NC.SLOTS;
  NC.GY = 622; NC.TOP = 196; NC.BOT = 520;
  NC.PLAT = [[585, 695, 330], [570, 710, 462]];
  NC.ROPES = [];
  [190, 300, 410, 520, 760, 870, 980, 1090].forEach(c => NC.ROPES.push(c - 22, c + 22));
  // numbers sit on single chains at staggered heights, so you can switch chains to dodge the ones you don't want
  NC.makeTags = () => { const T = [], H = [0.08, 0.32, 0.56, 0.8, 1.0]; NC.ROPES.forEach((rx, r) => { [r % 5, (r + 2) % 5].forEach(k => T.push({ r, x: rx, y: NC.TOP + 40 + H[k] * (NC.BOT - NC.TOP - 30), v: R.int(1, 9), t: 0, sw: R.range(0, 6) })); }); return T; };

  // ---------------------------------------------------------------- the NES palette and pixel helpers
  const P = { brick: '#c84c0c', brickHi: '#fca044', brickLo: '#7c0800', grass: '#00a800', grassHi: '#b8f818', dirt: '#a85010', dirtLo: '#503000', water: '#0000a8', waterHi: '#3cbcfc', white: '#fcfcfc', green: '#b8f818', chain: '#ac7c00', chainHi: '#fcd800' };
  const U = 6; // one "pixel"
  const cache = {};
  // chunky text: drawn small, then blown up with smoothing off
  const ptext = (g, s, x, y, h, col, align = 'center') => {
    const key = s + '|' + col + '|' + h; let c = cache[key];
    if (!c) { const fs = Math.max(10, Math.round(h / 2.2)); c = document.createElement('canvas'); const q = c.getContext('2d'); q.font = `bold ${fs}px monospace`; const w = Math.ceil(q.measureText(s).width) + 2; c.width = w; c.height = fs + 3; const q2 = c.getContext('2d'); q2.font = `bold ${fs}px monospace`; q2.textBaseline = 'top'; q2.fillStyle = col; q2.fillText(s, 1, 1); const im = q2.getImageData(0, 0, c.width, c.height); for (let k = 3; k < im.data.length; k += 4) im.data[k] = im.data[k] > 110 ? 255 : 0; q2.putImageData(im, 0, 0); cache[key] = c; }
    const sc = h / (c.height - 3), w = c.width * sc; g.save(); g.imageSmoothingEnabled = false; g.drawImage(c, align === 'center' ? x - w / 2 : align === 'right' ? x - w : x, y - c.height * sc * 0.82, w, c.height * sc); g.restore();
  };
  NCR = { ptext, P };
  const box = (g, x, y, w, h) => { g.fillStyle = '#000'; g.fillRect(x, y, w, h); g.strokeStyle = P.white; g.lineWidth = 4; g.strokeRect(x + 3, y + 3, w - 6, h - 6); };
  const bricks = (g, x0, x1, y, rows) => { for (let r = 0; r < rows; r++) for (let x = x0; x < x1; x += U * 4) { const ox = (r % 2) * U * 2, bx = x + ox, w = Math.min(U * 4, x1 - bx); if (w <= 0) continue; g.fillStyle = P.brick; g.fillRect(bx, y + r * U * 2, w, U * 2); g.fillStyle = P.brickHi; g.fillRect(bx + U, y + r * U * 2 + U * 0.5, U, U * 0.5); g.fillRect(bx + U * 2.5, y + r * U * 2 + U, U * 0.5, U * 0.5); g.fillStyle = P.brickLo; g.fillRect(bx, y + r * U * 2 + U * 2 - 2, w, 2); g.fillRect(bx, y + r * U * 2, 2, U * 2); } };
  const grassTop = (g, x0, x1, y) => { g.fillStyle = P.grass; g.fillRect(x0, y, x1 - x0, U * 2); g.fillStyle = P.grassHi; for (let x = x0; x < x1; x += U * 2) g.fillRect(x + U * 0.5, y, U, U * 0.6); for (let x = x0 + U; x < x1 - U; x += U * 3) { g.fillStyle = P.grass; g.fillRect(x, y - U, U, U); } };

  // ---------------------------------------------------------------- the backdrop (baked once)
  NCART.bg = g => {
    g.fillStyle = '#000'; g.fillRect(0, 0, 1280, 720);
    for (let k = 0; k < 70; k++) { const x = (k * 197) % 1280, y = 90 + (k * 71) % 420; g.fillStyle = k % 5 ? 'rgba(252,252,252,0.35)' : 'rgba(252,216,0,0.6)'; g.fillRect(x, y, k % 7 ? 2 : 4, k % 7 ? 2 : 4); }
    // water
    g.fillStyle = P.water; g.fillRect(0, 650, 1280, 70);
    // the brick girder along the top, raised in the middle for the host
    bricks(g, 0, 556, 176, 2); bricks(g, 724, 1280, 176, 2); bricks(g, 556, 724, 128, 6);
    // the islands: grass on top, chunky dirt below, a dark lip at the waterline
    NC.ISL.forEach(([a, b]) => { const y = NC.GY; g.fillStyle = P.dirt; g.fillRect(a + U, y + U * 2, b - a - U * 2, 44); g.fillStyle = P.dirtLo; for (let x = a + U * 2; x < b - U * 2; x += U * 3) for (let yy = y + U * 3; yy < y + 44; yy += U * 3) g.fillRect(x + ((yy / U) % 2) * U, yy, U, U); grassTop(g, a, b, y); g.fillStyle = '#000'; g.fillRect(a + U, y + 44 + U * 2 - 4, b - a - U * 2, 4); });
  };
  NCART.canopyArt = () => {};
  NCART.falls = () => {};
  NCART.water = (g, t) => {
    for (let k = 0; k < 30; k++) { const row = k % 3, x = ((k * 97 + t * (20 + row * 10)) % 1340) - 30, y = 660 + row * 18; g.fillStyle = row ? P.waterHi : P.white; g.fillRect(Math.round(x / U) * U, y, U * 3, U * 0.6); g.fillRect(Math.round(x / U) * U + U, y - U * 0.6, U, U * 0.6); }
  };
  NCART.islands = () => {};
  NCART.canopy = () => {};
  NCART.ledge = () => {};
  NCART.branch = () => {};
  // twin chains: alternating gold links, a hook at the top
  NCART.vine = (g, rx, r, t) => {
    for (const sd of [0]) { const x = rx + sd; g.fillStyle = P.brickLo; g.fillRect(x - 5, NC.TOP - 22, 10, 8);
      for (let y = NC.TOP - 14, k = 0; y < NC.BOT + 46; y += U * 1.5, k++) { g.fillStyle = k % 2 ? P.chain : P.chainHi; if (k % 2) g.fillRect(x - 2, y, 4, U * 1.5); else { g.fillRect(x - 4, y, 8, U * 1.5); g.fillStyle = '#000'; g.fillRect(x - 1, y + 2, 2, U * 1.5 - 4); } } }
  };
  // floating grass platforms with dangling roots
  NCART.plat = (g, a, b, y, t) => {
    g.fillStyle = P.dirt; g.fillRect(a + U, y + U, b - a - U * 2, U * 2); grassTop(g, a, b, y - U);
    g.fillStyle = P.grass; for (let x = a + U * 2; x < b - U * 2; x += U * 3) { const l = 2 + ((x / U) % 3); for (let q = 0; q < l; q++) g.fillRect(x + (q % 2 ? U * 0.5 : 0), y + U * 3 + q * U, U * 0.8, U); }
  };
  // a sign on its island: a black block with a white border and a big chunky symbol
  NCART.totem = (g, x, y, op, used, t) => {
    const w = 56, h = 56; g.fillStyle = '#000'; g.fillRect(x - w / 2, y - h - 4, w, h); g.strokeStyle = used ? P.green : P.white; g.lineWidth = 4; g.strokeRect(x - w / 2 + 2, y - h - 2, w - 4, h - 4);
    ptext(g, op, x, y - 16, 40, used ? P.green : P.white);
  };
  // a hanging number between the twin chains
  NCART.tag = (g, tg, t, a) => { g.globalAlpha = a; g.fillStyle = '#000'; g.fillRect(tg.x - 15, tg.y - 20, 30, 34); ptext(g, String(tg.v), tg.x, tg.y + 8, 30, P.green); g.globalAlpha = 1; };

  // ---------------------------------------------------------------- signs live on the island slots and hop to a free slot when taken
  const place = (S) => { S.ops = Object.entries(NC.HOME).map(([o, x]) => ({ o, x, t: 0, pop: 0 })); };

  ['numclimb', 'numclimb4'].forEach(id => {
    const G = MG.byId[id]; if (!G) return;
    const oi = G.init;
    G.init = function (m, S) { oi.call(this, m, S); S.tags = NC.makeTags(); };
    const nr = G.newRound;
    G.newRound = function (m, S) {
      nr.call(this, m, S); place(S);
      const starts = S.who.length === 2 ? [1178, 580] : [1150, 1205, 560, 600];
      S.who.forEach((i, k) => { const P2 = S.p[i]; P2.x = starts[k]; P2.y = NC.GY; P2.face = -1; });
    };
    G.rows = [['stick', 'Climb · LEFT/RIGHT = move across to the next chain (dodge numbers you don\'t want) · UP at a sign = take it'], ['a', 'Jump']];
    G.draw = function (m, S, g) {
      const t = m.t;
      GX.blit(g, GX.bake('numclimb_retro', b => NCART.bg(b)));
      NCART.water(g, t);
      NC.ROPES.forEach((rx, r) => NCART.vine(g, rx, r, t));
      NC.PLAT.forEach(([a, b, y]) => NCART.plat(g, a, b, y, t));
      (S.ops || []).forEach(o => { if (o.t > 0) return; const k = o.pop > 0 ? 1 - o.pop / 0.4 : 1; g.save(); g.translate(o.x, NC.GY); g.scale(k, k); NCART.totem(g, 0, 0, o.o, S.who.some(i => S.p[i].op === o.o), t); g.restore(); });
      // the host on the girder with the target board
      Char.npc(g, 600, 102, 24, 'host', { mood: S.ph === 'won' ? 'cheer' : 'happy', t, look: { x: 1, y: 0 }, hands: { n: { x: 1.3, y: -1.4, d: -60, o: true, m: true }, f: { x: -0.6, y: 0.2, d: 0, o: true, m: false } } });
      const pulse = S.ph === 'show' && Math.sin(t * 12) > 0 ? 1 : 0; box(g, 640, 46, 120, 64); ptext(g, String(S.target), 700, 96, 40, pulse ? P.chainHi : P.white);
      ptext(g, `ROUND ${S.round + 1}`, 700, 130, 18, P.white);
      S.tags.forEach(tg => { let a = 1; if (tg.t > 0) { const k = 1 - tg.t / 2.2; if (k > 0.75) a = (k - 0.75) * 4; else return; } NCART.tag(g, tg, t, a); });
      S.who.forEach(i => this.climber(g, m, S, i, S.p[i]));
      S.fx.forEach(f => { const k = f.t / 1.2; if (f.k === 'splash') { for (let q = 0; q < 8; q++) { g.fillStyle = `rgba(60,188,252,${1 - k})`; g.fillRect(f.x - 40 + q * 10, 650 - Math.sin(q / 7 * Math.PI) * k * 60, U, U); } } else if (f.k !== 'opgo') ptext(g, String(f.v), f.x, f.y - k * 60, 26, f.c); });
      // score boxes along the top: current total with sign, and wins
      S.who.forEach((i, k) => { const p = m.players[i], P2 = S.p[i], n = S.who.length, x = n === 2 ? (k ? 1010 : 30) : [10, 270, 790, 1050][k], w = n === 2 ? 240 : 220, y = 46;
        box(g, x, y, w, 80); g.fillStyle = p.color; g.fillRect(x + 10, y + 10, 14, 14);
        ptext(g, P2.tot === null ? '_' : `${P2.tot}${P2.op ? ' ' + P2.op : ''}`, x + 34, y + 44, 34, P2.tot === S.target && !P2.op ? P.green : P.white, 'left');
        ptext(g, 'WIN', x + 34, y + 70, 20, P.white, 'left'); for (let q = 0; q < S.wins[i]; q++) { g.fillStyle = P.chainHi; g.fillRect(x + 92 + q * 18, y + 56, 12, 12); }
        ptext(g, p.name.toUpperCase().slice(0, 7), x + w - 12, y + 30, 18, p.color, 'right');
        if (P2.lastT > 0) MGH.label(g, P2.last, P2.x, P2.y - 92, 15, p.color); });
      if (S.ph === 'show') { box(g, 440, 330, 400, 70); ptext(g, S.round === 4 ? `MAKE ${S.target} !` : `MAKE ${S.target}`, 640, 382, 36, P.chainHi); }
      if (S.ph === 'won' && S.winner >= 0) { box(g, 340, 330, 600, 70); ptext(g, `${m.players[S.winner].name.toUpperCase()} ${S.timeUp ? 'CLOSEST' : 'WINS'}!`, 640, 382, 34, P.green); }
    };
  });
})();
var NCR;
