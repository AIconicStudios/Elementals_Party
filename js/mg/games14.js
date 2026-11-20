'use strict';
// 66-70 -------------------------------------------------------------- the coin minigames
// In these, every coin you collect is added to your coins on the board (at most 20 each).
(() => {
  const MAX = 20;
  const add = (S, i, n) => { const before = S.c[i]; S.c[i] = clamp(S.c[i] + n, 0, MAX); return S.c[i] - before; };
  const common = {
    type: 'Coins', coinGame: true,
    wins: 'Everyone keeps the coins they collect (max 20). Most coins wins the Moot.',
    score(m, S) { return S.c.slice(); },
    fmt(s) { return `${Math.round(s)} coins`; },
    hud(m, S, i) { return `🪙 ${S.c[i]}${S.c[i] >= MAX ? ' MAX' : ''}`; },
  };
  const coinTag = (g, x, y, n, col) => { MGH.coin(g, x - 16, y - 5, 10, 0); MGH.text(g, String(n), x + 2, y + 2, 18, col || '#ffe680', 'left', 'bold'); };
  const def = spec => MG.def(Object.assign({}, common, spec));

  // ---------------------------------------------------------------- 1) Coin Shower
  def({
    id: 'coinshower', name: 'Coin Shower', controls: 'Left/Right + button', dur: 35,
    how: 'Coins rain down on the treasure vault floor — catch them in your basket! Money bags are worth 3, but a bomb knocks 2 coins out of your basket. Press the button to dash and bump a rival: they spill a coin. Everyone keeps what they catch (max 20).',
    init(m, S) {
      S.c = [0, 0, 0, 0]; S.items = []; S.spawn = 0;
      S.P = [0, 1, 2, 3].map(i => ({ x: 220 + i * 280, vx: 0, face: 1, dash: 0, cd: 0, stun: 0, mood: 0 }));
    },
    update(m, S, dt) {
      S.spawn -= dt;
      if (S.spawn <= 0) {
        S.spawn = Math.max(0.42, 0.75 - m.t * 0.008);
        const r = Math.random(), kind = r < 0.2 ? 'bomb' : r < 0.28 ? 'bag' : 'coin';
        S.items.push({ x: R.range(60, 1220), y: 30, vy: R.range(170, 260) + m.t * 3, kind, rot: R.range(0, 6) });
      }
      S.P.forEach((P, i) => {
        P.cd -= dt; P.dash -= dt; P.stun -= dt; P.mood -= dt;
        const ax = P.stun > 0 ? 0 : m.axis(i).x; if (Math.abs(ax) > 0.2) P.face = Math.sign(ax);
        if (m.pressed(i, 'a') && P.cd <= 0 && P.stun <= 0) { P.dash = 0.2; P.cd = 0.9; P.vx = P.face * 1100; if (!m.bot(i)) Sfx.whoosh(); }
        if (P.dash <= 0) P.vx += (ax * 430 - P.vx) * Math.min(1, dt * 12);
        P.x = clamp(P.x + P.vx * dt, 50, 1230);
      });
      // bumps: a dashing basket knocks a coin out of a rival's
      for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) {
        if (a === b) continue; const A = S.P[a], B = S.P[b];
        if (Math.abs(A.x - B.x) < 64) {
          if (A.dash > 0 && B.stun <= 0) { B.stun = 0.6; A.dash = 0; B.vx = A.face * 500; if (add(S, b, -1)) S.items.push({ x: B.x, y: 560, vy: -380, kind: 'coin', rot: 0, spill: true }); MGH.burst(B.x, 600, ['#ffe680', '#fff'], 10, { speed: 200 }); Sfx.punch(); }
          else if (a < b) { const push = (64 - Math.abs(A.x - B.x)) / 2 * (Math.sign(B.x - A.x) || 1); A.x -= push; B.x += push; }
        }
      }
      for (const it of S.items) {
        it.vy += (it.spill ? 900 : 60) * dt; it.y += it.vy * dt; it.rot += dt * 3;
        if (it.y > 560 && it.y < 620 && !it.gone) {
          const k = S.P.findIndex(P => Math.abs(P.x - it.x) < 46);
          if (k >= 0) {
            it.gone = true;
            if (it.kind === 'bomb') { const lost = -add(S, k, -2); S.P[k].stun = 0.8; MGH.burst(it.x, 580, ['#ff8a3d', '#ffe680', '#555'], 24, { speed: 300 }); MGH.pop(lost ? `−${lost}` : 'BOOM', it.x, 520, '#ff6b6b', 30); MGH.shake(5); Sfx.boom(); }
            else { const g2 = add(S, k, it.kind === 'bag' ? 3 : 1); S.P[k].mood = 0.4; if (g2) MGH.pop(`+${g2}`, it.x, 520, '#ffe680', it.kind === 'bag' ? 34 : 24); else MGH.pop('MAX', it.x, 520, '#9fffa0', 20); if (!m.bot(k)) Sfx.coin(); }
          }
        }
      }
      S.items = S.items.filter(it => !it.gone && it.y < 760);
    },
    bot(m, S, i) {
      const P = S.P[i], v = m.vin[i]; v.left = v.right = v.a = false; v.ax = 0;
      let best = null, bs = -1e9;
      for (const it of S.items) {
        if (it.y > 600) continue;
        const tLand = (580 - it.y) / Math.max(60, it.vy), reach = Math.abs(it.x - P.x) / 430;
        if (reach > tLand + 0.15) continue;
        const val = it.kind === 'bag' ? 3 : it.kind === 'bomb' ? -4 : 1;
        const sc = val * 2 - reach - Math.abs(it.x - P.x) / 1000;
        if (val > 0 && sc > bs) { bs = sc; best = it; }
      }
      const bomb = S.items.find(it => it.kind === 'bomb' && it.y > 420 && it.y < 600 && Math.abs(it.x - P.x) < 70);
      let tx = best ? best.x : P.x;
      if (bomb) tx = P.x + (P.x < bomb.x ? -140 : 140);
      const d = tx - P.x; v.ax = Math.abs(d) < 10 ? 0 : clamp(d / 80, -1, 1);
      const near = S.P.find((Q, j) => j !== i && Math.abs(Q.x - P.x) < 150 && Math.sign(Q.x - P.x) === P.face);
      if (near && P.cd <= 0 && Math.random() < 0.02) v.a = true;
    },
    draw(m, S, g) {
      // a gold-lit treasure vault
      g.fillStyle = MGH.grad(g, 40, 720, ['#3a2410', '#5a3a18', '#2a1808']); g.fillRect(0, 40, 1280, 680);
      for (let k = 0; k < 8; k++) { const x = 80 + k * 160; g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x, 40, 30, 560); MGH.glow(g, x + 15, 120, 60, 'rgba(255,190,90,0.35)'); MGH.fireball(g, x + 15, 116, 8, m.t + k, 0, -1); }
      for (let k = 0; k < 18; k++) { const x = (k * 97) % 1280; MGH.coin(g, x, 690 + (k % 3) * 8, 12, m.t + k); }
      g.fillStyle = MGH.grad(g, 620, 720, ['#c89a4a', '#8a6a2a']); g.fillRect(0, 630, 1280, 90);
      for (const it of S.items) {
        if (it.kind === 'coin') MGH.coin(g, it.x, it.y, 13, it.rot);
        else if (it.kind === 'bag') { MGH.glow(g, it.x, it.y, 34, 'rgba(255,220,90,0.5)'); MGH.emoji(g, '💰', it.x, it.y, 34, Math.sin(it.rot) * 0.2); }
        else { MGH.glow(g, it.x, it.y, 30, 'rgba(255,90,60,0.4)'); MGH.emoji(g, '💣', it.x, it.y, 32, it.rot * 0.4); }
      }
      S.P.forEach((P, i) => {
        if (P.dash > 0) { g.globalAlpha = 0.3; MGH.av(g, m, i, P.x - P.face * 30, 630, 26, 'determined'); g.globalAlpha = 1; }
        MGH.shadow(g, P.x, 636, 30, 0.35);
        MGH.av(g, m, i, P.x, 630, 26, P.stun > 0 ? 'dizzy' : P.mood > 0 ? 'happy' : 'determined', { look: { x: 0, y: -1 } });
        // the basket held overhead
        g.fillStyle = '#a8742a'; MGH.rr(g, P.x - 40, 560, 80, 30, 8); g.fill(); g.strokeStyle = '#6a4a1a'; g.lineWidth = 2; for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(P.x - 36 + k * 18, 562); g.lineTo(P.x - 30 + k * 18, 588); g.stroke(); }
        g.fillStyle = '#c8943a'; g.fillRect(P.x - 44, 556, 88, 7);
        coinTag(g, P.x, 548, S.c[i], m.players[i].color);
      });
    },
  });

  // ---------------------------------------------------------------- 2) Gold Claw
  const LOOT = { small: { v: 1, r: 14, w: 1.4, col: '#ffd34d' }, big: { v: 3, r: 30, w: 3.6, col: '#f0b030' }, diamond: { v: 4, r: 10, w: 1, col: '#bff4ff' }, rock: { v: 0, r: 26, w: 4, col: '#7a6a5a' }, bag: { v: 0, r: 16, w: 1.6, col: '#c89a5a' } };
  def({
    id: 'goldclaw', name: 'Gold Claw', controls: '1 button', dur: 32, mouseA: true,
    how: 'Your claw swings back and forth. Press the button to fire it straight down the line it points along. Grab gold (1), a big nugget (3 — slow to reel in), a diamond (4) or a mystery bag. Rocks are worth nothing and heavy. Everyone keeps what they haul up (max 20).',
    init(m, S) {
      S.c = [0, 0, 0, 0];
      S.layout = this.makeLayout();
      S.L = [0, 1, 2, 3].map(i => ({ ang: R.range(-1, 1), dir: 1, st: 'swing', len: 0, item: null, items: S.layout.map(o => Object.assign({}, o)), flash: 0 }));
    },
    makeLayout() {
      const out = [];
      const put = (kind, n) => { for (let k = 0; k < n; k++) { for (let tries = 0; tries < 40; tries++) { const o = { kind, x: R.range(30, 290), y: R.range(260, 660) }; if (out.every(q => Math.hypot(q.x - o.x, q.y - o.y) > LOOT[q.kind].r + LOOT[kind].r + 10)) { out.push(o); break; } } } };
      put('big', 2); put('diamond', 1); put('rock', 4); put('bag', 2); put('small', 6);
      return out;
    },
    update(m, S, dt) {
      S.L.forEach((L, i) => {
        L.flash -= dt;
        const ox = i * 320 + 160, oy = 120;
        if (L.st === 'swing') {
          L.ang += L.dir * 1.25 * dt; if (Math.abs(L.ang) > 1.2) { L.ang = clamp(L.ang, -1.2, 1.2); L.dir *= -1; }
          if (m.pressed(i, 'a')) { L.st = 'out'; L.len = 30; if (!m.bot(i)) Sfx.tone(500, 0.08, 'square', 0.04); }
        } else if (L.st === 'out') {
          L.len += 460 * dt;
          const tx = 160 + Math.sin(L.ang) * L.len, ty = oy + Math.cos(L.ang) * L.len;
          const hit = L.items.find(o => Math.hypot(o.x - tx, o.y - ty) < LOOT[o.kind].r + 8);
          if (hit) { L.item = hit; L.items = L.items.filter(o => o !== hit); L.st = 'back'; if (!m.bot(i)) Sfx.thud(); }
          else if (tx < 0 || tx > 320 || ty > 700) L.st = 'back';
        } else if (L.st === 'back') {
          L.len -= 380 / (L.item ? LOOT[L.item.kind].w : 0.7) * dt;
          if (L.len <= 30) {
            if (L.item) {
              let v = LOOT[L.item.kind].v; if (L.item.kind === 'bag') v = R.pick([0, 0, 1, 2, 3, 5]);
              const got = add(S, i, v); L.flash = 0.6; L.got = v ? (got ? `+${got}` : 'MAX') : 'rock…';
              MGH.pop(L.got, ox, 90, v ? '#ffe680' : '#bbb', v >= 4 ? 34 : 26); if (v && !m.bot(i)) Sfx.coin();
              L.item = null;
            }
            L.st = 'swing'; L.len = 0;
            if (!L.items.some(o => LOOT[o.kind].v > 0 || o.kind === 'bag')) L.items = this.makeLayout();
          }
        }
      });
    },
    bot(m, S, i) {
      const L = S.L[i], v = m.vin[i]; v.a = false;
      if (L.st !== 'swing') return;
      // fire when the line points at something good
      for (const o of L.items) {
        const val = o.kind === 'bag' ? 2 : LOOT[o.kind].v; if (val <= 0) continue;
        const dx = o.x - 160, dy = o.y - 120, a = Math.atan2(dx, dy);
        if (Math.abs(a - L.ang) < 0.04 + LOOT[o.kind].r / Math.hypot(dx, dy) * 0.5) {
          // nothing in the way?
          const blocked = L.items.some(q => q !== o && Math.hypot(q.x - 160, q.y - 120) < Math.hypot(dx, dy) && Math.abs(Math.atan2(q.x - 160, q.y - 120) - a) < LOOT[q.kind].r / Math.hypot(q.x - 160, q.y - 120));
          if (!blocked && Math.random() < 0.5) { v.a = true; return; }
        }
      }
    },
    draw(m, S, g) {
      for (let i = 0; i < 4; i++) {
        const L = S.L[i], ox = i * 320;
        g.save(); g.beginPath(); g.rect(ox, 40, 320, 680); g.clip(); g.translate(ox, 0);
        g.fillStyle = MGH.grad(g, 40, 720, ['#8ab8e8', '#c8a878', '#8a6a4a', '#5a3e28']); g.fillRect(0, 40, 320, 680);
        g.fillStyle = '#6a8a3a'; g.fillRect(0, 150, 320, 14);
        for (let k = 0; k < 20; k++) { g.fillStyle = 'rgba(0,0,0,0.12)'; g.beginPath(); g.arc((k * 73) % 320, 200 + (k * 131) % 500, 4 + k % 4, 0, 7); g.fill(); }
        for (const o of L.items) this.drawLoot(g, o, m.t);
        const tx = 160 + Math.sin(L.ang) * L.len, ty = 120 + Math.cos(L.ang) * L.len;
        if (L.st === 'swing') { g.strokeStyle = 'rgba(255,255,255,0.18)'; g.setLineDash([6, 8]); g.beginPath(); g.moveTo(160, 120); g.lineTo(160 + Math.sin(L.ang) * 600, 120 + Math.cos(L.ang) * 600); g.stroke(); g.setLineDash([]); }
        g.strokeStyle = '#3a3a44'; g.lineWidth = 3; g.beginPath(); g.moveTo(160, 120); g.lineTo(L.st === 'swing' ? 160 + Math.sin(L.ang) * 40 : tx, L.st === 'swing' ? 120 + Math.cos(L.ang) * 40 : ty); g.stroke();
        const cx = L.st === 'swing' ? 160 + Math.sin(L.ang) * 40 : tx, cy = L.st === 'swing' ? 120 + Math.cos(L.ang) * 40 : ty;
        if (L.item) { this.drawLoot(g, Object.assign({}, L.item, { x: cx + Math.sin(L.ang) * 10, y: cy + Math.cos(L.ang) * 10 }), m.t); }
        g.save(); g.translate(cx, cy); g.rotate(-L.ang); g.strokeStyle = '#c8ccd8'; g.lineWidth = 4; g.beginPath(); g.arc(-8, 6, 9, -0.5, 2.2); g.stroke(); g.beginPath(); g.arc(8, 6, 9, 0.9, 3.6); g.stroke(); g.restore();
        // the miner at the winch
        g.fillStyle = '#5a3a1a'; g.fillRect(130, 100, 60, 24);
        MGH.av(g, m, i, 110, 140, 18, L.flash > 0 ? 'happy' : L.st === 'back' ? 'effort' : 'determined', { look: { x: 0.6, y: 0.4 } });
        coinTag(g, 250, 82, S.c[i], m.players[i].color);
        g.restore();
        g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(ox + 318, 40, 4, 680);
      }
    },
    drawLoot(g, o, t) {
      const L = LOOT[o.kind];
      if (o.kind === 'small' || o.kind === 'big') { g.fillStyle = MGH.grad(g, o.y - L.r, o.y + L.r, ['#fff0a0', L.col, '#a8781a']); g.beginPath(); for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2, rr = L.r * (0.8 + MGH.hash(k + o.x) * 0.3); g.lineTo(o.x + Math.cos(a) * rr, o.y + Math.sin(a) * rr * 0.85); } g.closePath(); g.fill(); }
      else if (o.kind === 'diamond') { MGH.glow(g, o.x, o.y, 26, 'rgba(190,240,255,0.6)'); MGH.gem(g, o.x, o.y, L.r, L.col, t); }
      else if (o.kind === 'rock') MGH.rock(g, o.x, o.y, L.r, o.x, L.col, 0);
      else MGH.emoji(g, '💰', o.x, o.y, 30);
    },
  });

  // ---------------------------------------------------------------- 3) Piñata Party
  def({
    id: 'pinata', name: 'Piñata Party', controls: 'Move + button', dur: 35,
    how: 'A big piñata swings over the plaza. Run up and whack it with the button — every hit spills coins across the ground. Grab them before anyone else! Whack a rival instead and they drop a coin. Every few hits the piñata bursts in a shower of coins. Everyone keeps what they grab (max 20).',
    init(m, S) {
      S.c = [0, 0, 0, 0]; S.coins = []; S.hp = 18; S.pop = 0;
      S.b = [0, 1, 2, 3].map(i => Object.assign(MGH.body(640 + [-260, 260, -260, 260][i], 380 + [-160, -160, 180, 180][i], 24), { cd: 0, swing: 0, stun: 0 }));
    },
    pin(m) { return { x: 640 + Math.sin(m.t * 0.9) * 220, y: 330 + Math.sin(m.t * 1.7) * 70 }; },
    spill(S, x, y, n, sp = 260) { for (let k = 0; k < n; k++) { const a = R.range(0, 6.28), v = R.range(sp * 0.4, sp); S.coins.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0 }); } },
    update(m, S, dt) {
      const P0 = this.pin(m); S.pop -= dt;
      S.b.forEach((b, i) => {
        b.cd -= dt; b.swing -= dt; b.stun -= dt;
        const a = b.stun > 0 ? { x: 0, y: 0 } : m.axis(i); MGH.steer(b, a.x, a.y, dt, 2600, 300, 8); MGH.integrate(b, dt, 20, 80, 1260, 700);
        if (m.pressed(i, 'a') && b.cd <= 0 && b.stun <= 0) {
          b.cd = 0.6; b.swing = 0.2; if (!m.bot(i)) Sfx.whoosh(false);
          if (Math.hypot(P0.x - b.x, P0.y - 60 - b.y) < 110) {
            S.hp--; if (Math.random() < 0.55) this.spill(S, P0.x, P0.y + 20, 1); MGH.burst(P0.x, P0.y, ['#ff6ad5', '#ffd34d', '#5fd8ff', '#7cf06a'], 12, { speed: 240 }); Sfx.punch();
            if (S.hp <= 0) { S.hp = 18; S.pop = 1.2; this.spill(S, P0.x, P0.y, 8, 420); MGH.shake(8); Sfx.boom(); Sfx.crowd('cheer'); MGH.pop('🎉 BURST!', P0.x, P0.y - 60, '#ffe680', 40); }
          } else {
            const t = S.b.find((o, j) => j !== i && Math.hypot(o.x - b.x, o.y - b.y) < 70 && o.stun <= 0);
            if (t) { const j = S.b.indexOf(t); t.stun = 0.5; t.vx += (t.x - b.x) * 8; t.vy += (t.y - b.y) * 8; if (add(S, j, -1)) this.spill(S, t.x, t.y, 1, 200); Sfx.punch(); }
          }
        }
      });
      MGH.collide(S.b, 0.6);
      for (const c of S.coins) {
        c.t += dt; c.x += c.vx * dt; c.y += c.vy * dt; c.vx *= Math.exp(-3 * dt); c.vy *= Math.exp(-3 * dt);
        c.x = clamp(c.x, 30, 1250); c.y = clamp(c.y, 100, 690);
        if (c.t > 0.35) { const k = S.b.findIndex(b => Math.hypot(b.x - c.x, b.y - c.y) < 34); if (k >= 0 && !c.got) { c.got = true; if (add(S, k, 1) && !m.bot(k)) Sfx.coin(); } }
      }
      S.coins = S.coins.filter(c => !c.got);
    },
    bot(m, S, i) {
      const b = S.b[i], v = m.vin[i]; v.a = false; v.left = v.right = v.up = v.down = false;
      const P0 = this.pin(m);
      const c = S.coins.filter(c => c.t > 0.3).sort((a, b2) => Math.hypot(a.x - b.x, a.y - b.y) - Math.hypot(b2.x - b.x, b2.y - b.y))[0];
      let tx = P0.x, ty = P0.y + 60;
      if (c && Math.hypot(c.x - b.x, c.y - b.y) < 260) { tx = c.x; ty = c.y; }
      const dx = tx - b.x, dy = ty - b.y, d = Math.hypot(dx, dy) || 1;
      v.ax = d > 12 ? dx / d : 0; v.ay = d > 12 ? dy / d : 0;
      if (Math.hypot(P0.x - b.x, P0.y - 60 - b.y) < 100 && b.cd <= 0 && Math.random() < 0.3) v.a = true;
    },
    draw(m, S, g) {
      g.fillStyle = MGH.grad(g, 40, 720, ['#ffb86a', '#ffd88a', '#e8b878']); g.fillRect(0, 40, 1280, 680);
      for (let y = 100; y < 720; y += 60) for (let x = (y / 60 % 2) * 40; x < 1280; x += 80) { g.fillStyle = 'rgba(200,120,60,0.18)'; g.fillRect(x, y, 76, 56); }
      // bunting
      for (let k = 0; k < 26; k++) { const x = k * 52, y = 60 + Math.sin(k * 0.6) * 6; g.fillStyle = ['#ff5a8a', '#5ab8ff', '#ffd34d', '#7cdc6a'][k % 4]; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 40, y); g.lineTo(x + 20, y + 26); g.fill(); }
      const P0 = this.pin(m);
      g.strokeStyle = '#6a4a2a'; g.lineWidth = 3; g.beginPath(); g.moveTo(640, 40); g.lineTo(P0.x, P0.y - 40); g.stroke();
      for (const c of S.coins) { MGH.shadow(g, c.x, c.y + 8, 10, 0.25); MGH.coin(g, c.x, c.y, 11, m.t + c.x); }
      S.b.slice().sort((a, b) => a.y - b.y).forEach(b => { const i = S.b.indexOf(b);
        MGH.shadow(g, b.x, b.y + 26, 24, 0.3);
        MGH.av(g, m, i, b.x, b.y, 24, b.stun > 0 ? 'dizzy' : b.swing > 0 ? 'angry' : 'happy', { look: b.face });
        if (b.swing > 0) { g.save(); g.translate(b.x + b.face.x * 26, b.y - 34); g.rotate(Math.atan2(b.face.y, b.face.x) - 1.2 + (0.2 - b.swing) * 10); g.fillStyle = '#c89a5a'; g.fillRect(0, -4, 54, 8); g.restore(); }
        coinTag(g, b.x, b.y - 70, S.c[i], m.players[i].color);
      });
      // the piñata: a star-shaped donkey of colour
      g.save(); g.translate(P0.x, P0.y); g.rotate(Math.sin(m.t * 2.3) * 0.15);
      const hit = S.hp < 18 ? (18 - S.hp) / 18 : 0;
      for (let k = 0; k < 5; k++) { g.fillStyle = ['#ff5a8a', '#5ab8ff', '#ffd34d', '#7cdc6a', '#c86aff'][k]; g.beginPath(); g.ellipse(0, -30 + k * 14, 46 - k * 2, 9, 0, 0, 7); g.fill(); }
      g.fillStyle = '#ff7aa8'; g.beginPath(); g.ellipse(44, -38, 18, 12, -0.3, 0, 7); g.fill();
      g.fillStyle = '#222'; g.beginPath(); g.arc(50, -42, 2.5, 0, 7); g.fill();
      for (const lx of [-28, -10, 12, 28]) { g.fillStyle = '#ffd34d'; g.fillRect(lx - 4, 32, 8, 20); }
      if (hit > 0.5) { g.strokeStyle = 'rgba(80,40,20,0.7)'; g.lineWidth = 2; g.beginPath(); g.moveTo(-20, -20); g.lineTo(-6, 0); g.lineTo(-16, 18); g.stroke(); }
      g.restore();
      g.fillStyle = 'rgba(0,0,0,0.45)'; MGH.rr(g, 540, 86, 200, 12, 6); g.fill(); g.fillStyle = '#ff5a8a'; MGH.rr(g, 540, 86, 200 * S.hp / 18, 12, 6); g.fill();
    },
  });

  // ---------------------------------------------------------------- 4) Coin Run
  const RUN_V = 330;
  def({
    id: 'coinrun', name: 'Coin Run', controls: '1 button', dur: 30, mouseA: true,
    how: 'You run on your own along a sunny trail. Press the button to JUMP (press again in the air for a double jump) to grab the coin arcs and leap the spikes — touching spikes drops 2 coins. Everyone keeps what they grab (max 20).',
    init(m, S) {
      S.c = [0, 0, 0, 0];
      // one course for everybody (fair): coin arcs, ground coins and spikes
      S.coins = []; S.spikes = [];
      for (let x = 500; x < RUN_V * 32; x += R.range(800, 1100)) {
        const r = Math.random();
        if (r < 0.3) { for (let k = 0; k < 3; k++) S.coins.push({ x: x + k * 40, h: 60 + Math.sin(k / 2 * Math.PI) * 110 }); }
        else if (r < 0.62) { S.spikes.push({ x }); S.coins.push({ x, h: 150 }); }
        else if (r < 0.75) S.coins.push({ x, h: 18 });
        else { S.spikes.push({ x }); S.spikes.push({ x: x + 46 }); S.coins.push({ x: x + 23, h: 200 }); }
      }
      S.P = [0, 1, 2, 3].map(() => ({ y: 0, vy: 0, jumps: 0, hurt: 0, got: new Set(), hit: new Set() }));
    },
    update(m, S, dt) {
      const camX = m.t * RUN_V, px = camX + 240;
      S.P.forEach((P, i) => {
        P.hurt -= dt;
        if (m.pressed(i, 'a') && P.jumps < 2) { P.vy = P.jumps ? 620 : 700; P.jumps++; if (!m.bot(i)) Sfx.tone(P.jumps > 1 ? 720 : 520, 0.06, 'triangle', 0.04, 200); }
        P.vy -= 1800 * dt; P.y += P.vy * dt; if (P.y <= 0) { P.y = 0; P.vy = 0; P.jumps = 0; }
        S.coins.forEach((c, k) => { if (!P.got.has(k) && Math.abs(c.x - px) < 26 && Math.abs(c.h - (P.y + 30)) < 40) { P.got.add(k); if (add(S, i, 1) && !m.bot(i)) Sfx.coin(); } });
        S.spikes.forEach((s, k) => { if (!P.hit.has(k) && Math.abs(s.x - px) < 22 && P.y < 26) { P.hit.add(k); P.hurt = 0.8; const l = -add(S, i, -2); MGH.pop(l ? `−${l}` : 'ouch', 240, MGM.lane(i, 76, 160).y1 - 70, '#ff6b6b', 24); if (!m.bot(i)) Sfx.bad(); } });
      });
    },
    bot(m, S, i) {
      const P = S.P[i], v = m.vin[i]; v.a = false;
      const px = m.t * RUN_V + 240;
      P.skill = P.skill || R.range(0.7, 0.95);
      const sp = S.spikes.find(s => s.x > px - 10 && s.x < px + 120);
      if (sp && P.y === 0 && sp.x - px < 70 + R.range(-15, 15) && Math.random() < P.skill) v.a = true;
      const hi = S.coins.find((c, k) => !P.got.has(k) && c.h > 60 && c.x > px + 40 && c.x < px + 110);
      if (hi && P.y === 0 && Math.random() < 0.05 * P.skill) v.a = true;
      if (hi && hi.h > 170 && P.jumps === 1 && P.vy < 150 && Math.random() < 0.2) v.a = true;
    },
    draw(m, S, g) {
      const camX = m.t * RUN_V;
      g.fillStyle = '#0c0818'; g.fillRect(0, 40, 1280, 680);
      for (let i = 0; i < 4; i++) {
        const L = MGM.lane(i, 76, 160), P = S.P[i], floor = L.y1 - 22;
        g.save(); g.beginPath(); g.rect(0, L.y0, 1280, L.h - 4); g.clip();
        g.fillStyle = MGH.grad(g, L.y0, L.y1, ['#8ad0ff', '#d8f0ff']); g.fillRect(0, L.y0, 1280, L.h);
        for (let k = 0; k < 6; k++) { const x = ((k * 260 - camX * 0.3) % 1560 + 1560) % 1560 - 140; g.fillStyle = 'rgba(110,190,110,0.8)'; g.beginPath(); g.ellipse(x, floor + 6, 130, 46, 0, Math.PI, 0); g.fill(); }
        g.fillStyle = '#7ccf4a'; g.fillRect(0, floor, 1280, 6); g.fillStyle = '#a8784a'; g.fillRect(0, floor + 6, 1280, L.y1 - floor);
        const sx = x => x - camX;
        for (const s of S.spikes) { const X = sx(s.x); if (X < -40 || X > 1320) continue; g.fillStyle = '#9aa0ad'; for (let k = -1; k <= 1; k++) { g.beginPath(); g.moveTo(X + k * 12 - 8, floor); g.lineTo(X + k * 12, floor - 22); g.lineTo(X + k * 12 + 8, floor); g.fill(); } }
        S.coins.forEach((c, k) => { if (P.got.has(k)) return; const X = sx(c.x); if (X < -30 || X > 1310) return; MGH.coin(g, X, floor - c.h * 0.7, 10, m.t + k); });
        const y = floor - P.y * 0.7;
        if (P.hurt > 0 && Math.sin(m.t * 30) > 0) g.globalAlpha = 0.5;
        MGH.av(g, m, i, 240, y, 22, P.hurt > 0 ? 'hurt' : P.y > 0 ? 'happy' : 'determined', { walk: P.y === 0 ? 1 : 0, look: { x: 1, y: 0 } });
        g.globalAlpha = 1;
        g.restore();
        g.fillStyle = m.players[i].color; g.fillRect(0, L.y0, 6, L.h - 4);
        g.fillStyle = 'rgba(0,0,0,0.45)'; MGH.rr(g, 14, L.y0 + 8, 120, 34, 10); g.fill();
        coinTag(g, 60, L.y0 + 30, S.c[i], m.players[i].color);
      }
    },
  });

  // ---------------------------------------------------------------- 5) Treasure Trail (push your luck)
  def({
    id: 'trail', name: 'Treasure Trail', controls: 'A & B buttons', dur: 30,
    how: 'Open chests one by one with A: each holds 1–3 coins (or a 💎 worth 5) — but the deeper you go, the likelier a 🐍 snake that eats everything you haven\'t banked. Press B to BANK your haul safely and start a fresh trail. Anything not banked when time runs out is lost! Everyone keeps what they bank (max 20).',
    init(m, S) {
      S.c = [0, 0, 0, 0];
      S.P = [0, 1, 2, 3].map(() => ({ pot: 0, streak: 0, open: [], cd: 0, snake: 0, bank: 0, want: R.range(4, 8) }));
    },
    update(m, S, dt) {
      S.P.forEach((P, i) => {
        P.cd -= dt; P.snake -= dt; P.bank -= dt;
        if (P.cd > 0) return;
        if (m.pressed(i, 'b') && P.pot > 0) {
          const got = add(S, i, P.pot); MGH.pop(got ? `BANKED +${got}` : 'MAX', i * 320 + 160, 200, '#9fffa0', 24); if (!m.bot(i)) Sfx.coin();
          P.pot = 0; P.streak = 0; P.open = []; P.cd = 0.8; P.bank = 0.6;
        } else if (m.pressed(i, 'a')) {
          const risk = 0.18 + P.streak * 0.12;
          let res;
          if (Math.random() < risk) { res = { k: 'snake' }; P.snake = 1.1; if (P.pot) MGH.pop(`🐍 −${P.pot}`, i * 320 + 160, 260, '#ff6b6b', 28); P.pot = 0; P.streak = 0; if (!m.bot(i)) Sfx.bad(); }
          else { const gem = Math.random() < 0.06, v = gem ? 5 : R.int(1, 3); res = { k: gem ? 'gem' : 'coin', v }; P.pot += v; P.streak++; if (!m.bot(i)) Sfx.tone(600 + P.streak * 70, 0.08, 'triangle', 0.05); }
          if (P.open.length && P.open[0].k === 'snake') P.open = []; // a fresh trail after a snake
          P.open.push(res); if (res.k === 'snake') P.open = [res];
          P.cd = 1.6;
        }
      });
    },
    bot(m, S, i) {
      const P = S.P[i], v = m.vin[i]; v.a = v.b = false;
      if (P.cd > 0) return;
      const left = this.dur - m.t;
      if (P.pot > 0 && (P.pot >= P.want || P.streak >= 3 + (P.want > 7 ? 1 : 0) || left < 2.5 || S.c[i] + P.pot >= MAX)) { v.b = true; P.want = R.range(4, 8); return; }
      if (Math.random() < 0.25) v.a = true;
    },
    draw(m, S, g) {
      g.fillStyle = MGH.grad(g, 40, 720, ['#1a3a2a', '#2a5a3a', '#1a2a1a']); g.fillRect(0, 40, 1280, 680);
      const left = this.dur - m.t;
      for (let i = 0; i < 4; i++) {
        const P = S.P[i], ox = i * 320, cx = ox + 160;
        // jungle path
        g.fillStyle = 'rgba(200,160,100,0.35)'; g.beginPath(); g.moveTo(cx - 60, 700); g.quadraticCurveTo(cx + 60, 420, cx - 20, 120); g.lineTo(cx + 20, 120); g.quadraticCurveTo(cx + 100, 420, cx + 60, 700); g.fill();
        for (let k = 0; k < 6; k++) { const leafX = ox + (k % 2 ? 30 : 290), leafY = 120 + k * 100; g.fillStyle = 'rgba(40,120,60,0.8)'; g.beginPath(); g.ellipse(leafX, leafY, 40, 18, k, 0, 7); g.fill(); }
        // the chests opened on this trail (newest at the top)
        P.open.slice(-6).forEach((o, k, arr) => {
          const y = 600 - k * 80, x = cx + Math.sin(k * 1.3) * 30;
          g.fillStyle = '#7a4a1a'; MGH.rr(g, x - 30, y - 18, 60, 36, 6); g.fill(); g.fillStyle = '#c89a3a'; g.fillRect(x - 30, y - 4, 60, 5);
          g.fillStyle = '#5a3410'; g.beginPath(); g.moveTo(x - 30, y - 18); g.lineTo(x - 24, y - 34); g.lineTo(x + 24, y - 34); g.lineTo(x + 30, y - 18); g.fill();
          if (o.k === 'snake') MGH.emoji(g, '🐍', x, y - 30, 34); else if (o.k === 'gem') { MGH.glow(g, x, y - 34, 30, 'rgba(190,240,255,0.6)'); MGH.emoji(g, '💎', x, y - 34, 26); } else { MGH.coin(g, x - 6, y - 32, 10, m.t); MGH.text(g, '+' + o.v, x + 14, y - 26, 16, '#ffe680', 'center', 'bold'); }
        });
        // the next closed chest waiting at the top of the trail
        const ny = 600 - Math.min(6, P.open.length) * 80; if (ny > 120) { g.globalAlpha = 0.85; g.fillStyle = '#6a3a14'; MGH.rr(g, cx - 32, ny - 18, 64, 38, 6); g.fill(); MGH.text(g, '?', cx, ny + 8, 22, '#ffe680', 'center', 'bold'); g.globalAlpha = 1; }
        MGH.av(g, m, i, cx - 70, 670, 22, P.snake > 0 ? 'scared' : P.bank > 0 ? 'happy' : P.streak >= 3 ? 'nervous' : 'determined', { look: { x: 0.6, y: -0.6 } });
        // pot and bank
        g.fillStyle = 'rgba(0,0,0,0.5)'; MGH.rr(g, ox + 14, 54, 292, 52, 12); g.fill();
        MGH.text(g, `unbanked: ${P.pot}`, ox + 24, 76, 15, P.pot ? '#ffe680' : '#aaa', 'left', 'bold');
        MGH.text(g, `risk ${Math.round((0.18 + P.streak * 0.12) * 100)}%`, ox + 24, 97, 13, P.streak >= 3 ? '#ff9a9a' : '#cfe8cf', 'left');
        coinTag(g, ox + 250, 82, S.c[i], m.players[i].color);
        if (P.snake > 0) MGH.label(g, '🐍 SNAKE! Haul lost', cx, 330, 20, '#ff9a9a');
        g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(ox + 318, 40, 4, 680);
      }
      if (left < 6 && left > 0) MGH.label(g, `⚠ BANK NOW! ${Math.ceil(left)}s`, 640, 150, 28, '#ffb0b0');
    },
  });
})();
