'use strict';
// 65 ---------------------------------------------------------------- Tower of Trials (a four-floor adventure race)
(() => {
  const say = (T, i, text, col = '#ffe680') => { T.msg = T.msg || []; T.msg[i] = { text, col, t: 0 }; };
  const tickMsgs = (T, dt) => (T.msg || []).forEach(q => { if (q) q.t += dt; });
  const msgAt = (g, T, i, x, y) => { const q = (T.msg || [])[i]; if (!q || q.t > 1.1) return; g.globalAlpha = 1 - q.t / 1.1; MGH.text(g, q.text, x, y - q.t * 16, 22, q.col, 'center', 'bold'); g.globalAlpha = 1; };
  const hero = (g, m, i, x, feetY, r, mood, o = {}) => { const p = m.players[i]; Char.draw(g, x, feetY - r * 1.25, r, p.el.id, p.color, Object.assign({ mood: MGH.persona(mood, p.el.id), seed: i * 1.7, noShadow: true }, o)); };

  // ---- floor 1: sky climb (each player climbs their own copy of the tower)
  const TOP = -2300;
  const skyclimb = {
    name: 'Sky Climb', icon: '🗼', how: 'Race to the top of the tower! LEFT/RIGHT to move, A to jump. Gold platforms slide, cracked ones crumble, and red springs launch you sky-high. Fall off and you drop back to the last ledge you stood on.',
    init(m, S, T) {
      T.lay = []; let px = 160;
      for (let y = -95; y > TOP + 40; y -= 95) {
        const n = Math.random() < 0.35 ? 2 : 1;
        for (let k = 0; k < n; k++) {
          const x = k === 0 ? clamp(px + R.range(-150, 150), 10, 230) : R.range(10, 230), r = Math.random();
          const kind = r < 0.16 ? 'move' : r < 0.32 ? 'crumble' : r < 0.4 ? 'spring' : 'n';
          T.lay.push({ x, y, w: kind === 'spring' ? 60 : R.range(70, 95), k: kind, ph: Math.random() * 6 });
          if (k === 0) px = x + 40;
        }
      }
      T.lay.push({ x: 60, y: TOP, w: 200, k: 'top', ph: 0 });
      T.p = [0, 1, 2, 3].map(() => ({ x: 160, y: 0, vx: 0, vy: 0, on: 'floor', last: null, cam: -560, fin: 0, best: 0, dead: 0, gone: new Map(), stood: 0, goal: null, jt: 0 }));
    },
    px(T, p, t) { return p.k === 'move' ? p.x + Math.sin(t * 1.3 + p.ph) * 55 : p.x; },
    update(m, S, T, dt, t) {
      tickMsgs(T, dt);
      T.p.forEach((P, i) => {
        if (P.fin) return;
        for (const [k, v] of P.gone) { if (v - dt <= 0) P.gone.delete(k); else P.gone.set(k, v - dt); }
        if (P.dead > 0) { P.dead -= dt; if (P.dead <= 0) { const L = P.last; P.x = L ? this.px(T, L, t) + L.w / 2 : 160; P.y = L ? L.y : 0; P.vy = 0; P.on = L || 'floor'; P.cam = P.y - 420; } return; }
        const ax = m.axis(i).x;
        P.vx = ax * 300;
        if (m.pressed(i, 'a') && P.on) { P.vy = -800; P.on = null; Sfx.tone(420, 0.05, 'triangle', 0.04, 260); }
        // carried by a moving platform
        if (P.on && P.on !== 'floor' && P.on.k === 'move') P.x += this.px(T, P.on, t) - this.px(T, P.on, t - dt);
        const py = P.y;
        P.x = clamp(P.x + P.vx * dt, 14, 306);
        if (!P.on) { P.vy += 1900 * dt; P.y += P.vy * dt; }
        else if (P.on !== 'floor') { const pl = P.on, x0 = this.px(T, pl, t); if (P.x < x0 - 6 || P.x > x0 + pl.w + 6 || P.gone.has(pl)) P.on = null; else { P.stood += dt; if (pl.k === 'crumble' && P.stood > 0.5) { P.gone.set(pl, 3); P.on = null; MGH.burst(i * 320 + x0 + pl.w / 2, 300, ['#a88a6a', '#7a5a3a'], 8, { speed: 120, grav: 600 }); } } }
        if (!P.on && P.vy >= 0) {
          if (P.y >= 0 && py <= 0) { P.y = 0; P.vy = 0; P.on = 'floor'; P.stood = 0; }
          else for (const pl of T.lay) {
            if (P.gone.has(pl)) continue; const x0 = this.px(T, pl, t);
            if (py <= pl.y + 1 && P.y >= pl.y && P.x >= x0 - 6 && P.x <= x0 + pl.w + 6) {
              P.y = pl.y; P.vy = 0; P.on = pl; P.stood = 0;
              if (pl.k === 'spring') { P.vy = -1280; P.on = null; say(T, i, 'BOING!', '#ff8a8a'); Sfx.tone(300, 0.2, 'sine', 0.06, 700); }
              else if (pl.k !== 'crumble') P.last = pl;
              if (pl.k === 'top') { P.fin = t; say(T, i, `TOP! ${t.toFixed(1)}s`, '#ffe680'); Sfx.coin(); }
              break;
            }
          }
        }
        P.best = Math.max(P.best, -P.y);
        P.cam = Math.min(P.cam, P.y - 420); // camera only moves up
        if (P.y > P.cam + 700) { P.dead = 0.6; say(T, i, 'oops!', '#ff9a6b'); Sfx.bad(); }
      });
    },
    bot(m, S, T, i, dt) {
      const P = T.p[i], v = m.vin[i]; v.a = false; v.ax = 0; if (P.fin || P.dead > 0) return;
      const t = S.stageT;
      if (P.on && (!P.goal || P.goal.y >= P.y - 5 || P.gone.has(P.goal))) {
        let best = null, bs = -1e9;
        for (const pl of T.lay) { if (P.gone.has(pl) || pl.y >= P.y - 20 || pl.y < P.y - 160) continue; const dx = Math.abs(this.px(T, pl, t) + pl.w / 2 - P.x); if (dx > 420) continue; const sc = (P.y - pl.y) * 0.6 - dx * 0.8 + (pl.k === 'spring' ? 60 : 0) - (pl.k === 'crumble' ? 25 : 0) + R.range(0, 15); if (sc > bs) { bs = sc; best = pl; } }
        P.goal = best;
      }
      if (!P.goal) { v.ax = P.x < 160 ? 1 : -1; if (P.on) v.a = Math.random() < 0.05; return; }
      const gx = this.px(T, P.goal, t) + P.goal.w / 2, dx = gx - P.x;
      v.ax = Math.abs(dx) < 8 ? 0 : Math.sign(dx);
      // jump when lined up, or at the edge of our ledge before we walk off it
      let edge = false; if (P.on && P.on !== 'floor') { const x0 = this.px(T, P.on, t); edge = (dx > 0 && P.x > x0 + P.on.w - 14) || (dx < 0 && P.x < x0 + 14); }
      P.jt += dt; if (P.wait === undefined) P.wait = R.range(0, 0.35);
      if (P.on && (Math.abs(dx) < P.goal.w / 2 + 70 || edge) && (P.jt > P.wait || edge)) { v.a = !m.prev[i].a; if (v.a) { P.jt = 0; P.wait = R.range(0, 0.4); } }
      if (P.on === P.goal) P.goal = null;
    },
    done(m, S, T, t) { return T.p.every(P => P.fin) || t > 50; },
    result(m, S, T) { return T.p.map(P => P.fin ? 10000 - P.fin : P.best); },
    fmt: v => v > 9000 ? `top in ${(10000 - v).toFixed(1)}s` : `${Math.round(v / 10)} m up`,
    draw(m, S, T, g) {
      const t = S.stageT;
      for (let i = 0; i < 4; i++) {
        const P = T.p[i], ox = i * 320, Y = y => 40 + (y - P.cam);
        g.save(); g.beginPath(); g.rect(ox, 40, 320, 680); g.clip();
        const h = clamp(-P.cam / 2300, 0, 1);
        const sk = g.createLinearGradient(0, 40, 0, 720); sk.addColorStop(0, h > 0.6 ? '#1a1048' : '#4a8ad8'); sk.addColorStop(1, h > 0.6 ? '#6a4a9a' : '#bfe0ff'); g.fillStyle = sk; g.fillRect(ox, 40, 320, 680);
        if (h > 0.5) MGH.stars(g, m.t, 20, 720, h - 0.4);
        // tower wall with windows
        g.fillStyle = 'rgba(90,80,110,0.55)'; g.fillRect(ox + 20, 40, 280, 680);
        for (let wy = Math.floor(P.cam / 160) * 160; wy < P.cam + 700; wy += 160) { const yy = Y(wy); g.fillStyle = 'rgba(255,220,140,0.35)'; MGH.rr(g, ox + 70, yy, 30, 46, 14); g.fill(); MGH.rr(g, ox + 220, yy + 80, 30, 46, 14); g.fill(); }
        g.fillStyle = '#5a4a3a'; g.fillRect(ox, Y(0), 320, 30);
        for (const pl of T.lay) {
          const yy = Y(pl.y); if (yy < 20 || yy > 740 || P.gone.has(pl)) continue;
          const x = ox + this.px(T, pl, t);
          if (pl.k === 'top') { MGH.plat(g, x, yy, pl.w, 18, 'stone', m.t); g.fillStyle = '#7a4a2a'; MGH.rr(g, x + pl.w / 2 - 26, yy - 80, 52, 80, 24); g.fill(); g.fillStyle = '#ffd34d'; g.beginPath(); g.arc(x + pl.w / 2 + 14, yy - 40, 5, 0, 7); g.fill(); MGH.glow(g, x + pl.w / 2, yy - 40, 70, 'rgba(255,220,120,0.4)'); continue; }
          if (pl.k === 'spring') { g.fillStyle = '#ff4d4d'; MGH.rr(g, x, yy - 8, pl.w, 12, 6); g.fill(); g.strokeStyle = '#ddd'; g.lineWidth = 3; g.beginPath(); for (let k = 0; k < 4; k++) { g.moveTo(x + 10, yy + 4 + k * 5); g.lineTo(x + pl.w - 10, yy + 7 + k * 5); } g.stroke(); continue; }
          MGH.plat(g, x, yy, pl.w, 14, pl.k === 'crumble' ? 'stone' : pl.k === 'move' ? 'gold' : 'grass', m.t);
          if (pl.k === 'crumble') { g.strokeStyle = '#2a1a0a'; g.lineWidth = 2; g.beginPath(); g.moveTo(x + pl.w * 0.4, yy); g.lineTo(x + pl.w * 0.5, yy + 12); g.stroke(); }
        }
        if (P.dead <= 0) hero(g, m, i, ox + P.x, Y(P.y), 22, P.fin ? 'cheer' : P.on ? 'determined' : 'cheer', { look: { x: P.vx >= 0 ? 0.6 : -0.6, y: -0.5 }, walk: P.on && Math.abs(P.vx) > 10 ? 1 : 0 });
        g.restore();
        if (i) { g.fillStyle = 'rgba(255,255,255,0.15)'; g.fillRect(ox - 1, 40, 2, 680); }
        g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(ox + 304, 60, 8, 620); g.fillStyle = m.players[i].color; const k = clamp(P.best / -TOP, 0, 1); g.fillRect(ox + 304, 680 - 620 * k, 8, 620 * k);
        msgAt(g, T, i, ox + 160, 160);
      }
    },
  };

  // ---- floor 2: key hunt in the maze
  const TS = 35, MW = 33, MH = 19, MX = 62, MY = 50;
  const keyhunt = {
    name: 'Key Hunt', icon: '🗝️', how: 'Grab TWO keys in the maze, then run to the glowing portal in the middle to escape. Ghosts patrol the halls — if one touches you, you drop a key! B is a quick dash. First out wins.',
    init(m, S, T) {
      const G = []; for (let y = 0; y < MH; y++) { G.push([]); for (let x = 0; x < MW; x++) G[y].push(1); }
      const st = [[1, 1]]; G[1][1] = 0;
      while (st.length) { const [cx, cy] = st[st.length - 1]; const nb = [[2, 0], [-2, 0], [0, 2], [0, -2]].map(([dx, dy]) => [cx + dx, cy + dy, dx, dy]).filter(([x, y]) => x > 0 && y > 0 && x < MW - 1 && y < MH - 1 && G[y][x]); if (!nb.length) { st.pop(); continue; } const [nx, ny, dx, dy] = R.pick(nb); G[cy + dy / 2][cx + dx / 2] = 0; G[ny][nx] = 0; st.push([nx, ny]); }
      for (let k = 0; k < 70; k++) { const x = R.int(1, MW - 2), y = R.int(1, MH - 2); if (G[y][x] && ((x % 2 === 1 && y % 2 === 0) || (x % 2 === 0 && y % 2 === 1))) G[y][x] = 0; } // loops
      for (let y = 8; y <= 10; y++) for (let x = 15; x <= 17; x++) G[y][x] = 0;
      T.G = G; T.exit = { x: 16, y: 9 };
      const open = []; for (let y = 1; y < MH - 1; y++) for (let x = 1; x < MW - 1; x++) if (!G[y][x] && (Math.abs(x - 16) + Math.abs(y - 9) > 5)) open.push({ x, y });
      T.open = open; T.keys = R.shuffle(open).slice(0, 10).map(c => ({ x: c.x, y: c.y }));
      const starts = [[1, 1], [MW - 2, 1], [1, MH - 2], [MW - 2, MH - 2]];
      T.p = [0, 1, 2, 3].map(i => ({ x: MX + (starts[i][0] + 0.5) * TS, y: MY + (starts[i][1] + 0.5) * TS, keys: 0, out: 0, stun: 0, inv: 0, dash: 0, dcd: 0, face: { x: 1, y: 0 }, path: null, pt: 0 }));
      T.gh = [0, 1, 2].map(k => { const c = R.pick(open); return { x: MX + (c.x + 0.5) * TS, y: MY + (c.y + 0.5) * TS, tx: c.x, ty: c.y, px: -1, py: -1 }; });
    },
    solid(T, px, py) { const x = Math.floor((px - MX) / TS), y = Math.floor((py - MY) / TS); return x < 0 || y < 0 || x >= MW || y >= MH || T.G[y][x] === 1; },
    free(T, px, py, r) { return !this.solid(T, px - r, py - r) && !this.solid(T, px + r, py - r) && !this.solid(T, px - r, py + r) && !this.solid(T, px + r, py + r); },
    tile(px, py) { return { x: Math.floor((px - MX) / TS), y: Math.floor((py - MY) / TS) }; },
    bfs(T, from, goalFn, maxD = 400) {
      const key = (x, y) => y * MW + x, prev = new Map([[key(from.x, from.y), -1]]), q = [from];
      while (q.length) { const c = q.shift(); if (goalFn(c.x, c.y)) { const path = []; let k = key(c.x, c.y); while (k !== -1) { path.push({ x: k % MW, y: Math.floor(k / MW) }); k = prev.get(k); } return path.reverse(); } if (prev.size > maxD) break; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = c.x + dx, ny = c.y + dy; if (T.G[ny] && T.G[ny][nx] === 0 && !prev.has(key(nx, ny))) { prev.set(key(nx, ny), key(c.x, c.y)); q.push({ x: nx, y: ny }); } } }
      return null;
    },
    update(m, S, T, dt, t) {
      tickMsgs(T, dt);
      T.p.forEach((P, i) => {
        if (P.out) return;
        P.stun -= dt; P.inv -= dt; P.dash -= dt; P.dcd -= dt;
        if (P.stun > 0) return;
        const a = m.axis(i); let ax = a.x, ay = a.y; const l = Math.hypot(ax, ay); if (l > 1) { ax /= l; ay /= l; }
        if (l > 0.1) P.face = { x: ax, y: ay };
        if (m.pressed(i, 'b') && P.dcd <= 0) { P.dash = 0.22; P.dcd = 1.8; Sfx.whoosh(false); }
        const sp = (P.dash > 0 ? 430 : 190) * dt;
        if (this.free(T, P.x + ax * sp, P.y, 11)) P.x += ax * sp;
        if (this.free(T, P.x, P.y + ay * sp, 11)) P.y += ay * sp;
        for (let k = T.keys.length - 1; k >= 0; k--) { const c = T.keys[k]; if (P.keys < 2 && Math.hypot(MX + (c.x + 0.5) * TS - P.x, MY + (c.y + 0.5) * TS - P.y) < 20) { T.keys.splice(k, 1); P.keys++; say(T, i, `key ${P.keys}/2`, '#ffe680'); Sfx.coin(); } }
        if (P.keys >= 2 && Math.hypot(MX + (T.exit.x + 0.5) * TS - P.x, MY + (T.exit.y + 0.5) * TS - P.y) < 26) { P.out = t; say(T, i, `ESCAPED ${t.toFixed(1)}s`, '#7cf06a'); Sfx.star(); }
      });
      // ghosts: chase anyone close, otherwise wander
      for (const gh of T.gh) {
        const cx = MX + (gh.tx + 0.5) * TS, cy = MY + (gh.ty + 0.5) * TS, d = Math.hypot(cx - gh.x, cy - gh.y), sp = (135 + t * 0.8) * dt;
        if (d <= sp) {
          gh.x = cx; gh.y = cy; const here = { x: gh.tx, y: gh.ty };
          const tgt = T.p.filter(P => !P.out && P.inv <= 0).map(P => ({ P, c: this.tile(P.x, P.y) })).filter(o => Math.abs(o.c.x - here.x) + Math.abs(o.c.y - here.y) < 8);
          let next = null;
          if (tgt.length) { const path = this.bfs(T, here, (x, y) => tgt.some(o => o.c.x === x && o.c.y === y), 300); if (path && path.length > 1) next = path[1]; }
          if (!next) { const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => ({ x: here.x + dx, y: here.y + dy })).filter(c => T.G[c.y][c.x] === 0); const fw = nb.filter(c => c.x !== gh.px || c.y !== gh.py); next = R.pick(fw.length ? fw : nb); }
          gh.px = here.x; gh.py = here.y; gh.tx = next.x; gh.ty = next.y;
        } else { gh.x += (cx - gh.x) / d * sp; gh.y += (cy - gh.y) / d * sp; }
        T.p.forEach((P, i) => {
          if (P.out || P.inv > 0 || Math.hypot(P.x - gh.x, P.y - gh.y) > 22) return;
          P.stun = 0.9; P.inv = 2.2; say(T, i, P.keys ? 'KEY STOLEN!' : 'BOO!', '#ff6b6b'); Sfx.bad();
          if (P.keys) { P.keys--; const c = R.pick(T.open.filter(c => Math.abs(c.x - this.tile(P.x, P.y).x) + Math.abs(c.y - this.tile(P.x, P.y).y) > 6)); T.keys.push({ x: c.x, y: c.y }); }
        });
      }
    },
    bot(m, S, T, i, dt) {
      const P = T.p[i], v = m.vin[i]; v.b = false; v.ax = v.ay = 0; if (P.out || P.stun > 0) return;
      P.pt -= dt;
      const here = this.tile(P.x, P.y);
      if (P.pt <= 0 || !P.path || !P.path.length) {
        P.pt = 0.45;
        const goal = P.keys >= 2 ? (x, y) => x === T.exit.x && y === T.exit.y : (x, y) => T.keys.some(k => k.x === x && k.y === y);
        P.path = this.bfs(T, here, goal, 700) || [];
      }
      while (P.path.length && P.path[0].x === here.x && P.path[0].y === here.y) P.path.shift();
      const n = P.path[0]; if (!n) return;
      const tx = MX + (n.x + 0.5) * TS, ty = MY + (n.y + 0.5) * TS, dx = tx - P.x, dy = ty - P.y, l = Math.hypot(dx, dy) || 1;
      v.ax = dx / l; v.ay = dy / l;
      if (T.gh.some(gh => Math.hypot(gh.x - P.x, gh.y - P.y) < 70) && P.dcd <= 0) v.b = true;
    },
    done(m, S, T, t) { return T.p.every(P => P.out) || t > 60; },
    result(m, S, T) { return T.p.map(P => P.out ? 100 + (60 - P.out) : P.keys * 10); },
    fmt: v => v >= 100 ? `out in ${(160 - v).toFixed(1)}s` : `${Math.round(v / 10)} key${v === 10 ? '' : 's'}`,
    draw(m, S, T, g) {
      g.fillStyle = '#120c1c'; g.fillRect(0, 40, 1280, 680);
      for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
        const X = MX + x * TS, Y = MY + y * TS;
        if (T.G[y][x]) { g.fillStyle = (x + y) % 2 ? '#3a2e4a' : '#342a44'; g.fillRect(X, Y, TS, TS); g.fillStyle = '#5a4a6a'; g.fillRect(X, Y, TS, 6); }
        else { g.fillStyle = (x + y) % 2 ? '#1e1828' : '#221a2e'; g.fillRect(X, Y, TS, TS); }
      }
      for (let k = 0; k < 8; k++) { const X = MX + (k * 4 + 2) * TS, Y = MY + 2; MGH.glow(g, X, Y + 10, 40, 'rgba(255,170,70,0.35)'); MGH.fireball(g, X, Y + 6, 6, m.t + k, 0, -1); }
      const ex = MX + (T.exit.x + 0.5) * TS, ey = MY + (T.exit.y + 0.5) * TS;
      MGH.glow(g, ex, ey, 90, 'rgba(140,90,255,0.55)');
      for (let k = 0; k < 4; k++) { g.strokeStyle = `rgba(200,170,255,${0.8 - k * 0.15})`; g.lineWidth = 4; g.beginPath(); g.arc(ex, ey, 14 + k * 9, m.t * 3 + k, m.t * 3 + k + 4); g.stroke(); }
      for (const c of T.keys) { const X = MX + (c.x + 0.5) * TS, Y = MY + (c.y + 0.5) * TS + Math.sin(m.t * 3 + c.x) * 3; MGH.glow(g, X, Y, 26, 'rgba(255,220,90,0.5)'); MGH.text(g, '🗝️', X, Y + 7, 20, '#fff'); }
      for (const gh of T.gh) { g.save(); g.globalAlpha = 0.85; g.fillStyle = '#e8eef8'; g.beginPath(); g.arc(gh.x, gh.y - 4, 15, Math.PI, 0); g.lineTo(gh.x + 15, gh.y + 12); for (let k = 0; k < 4; k++) g.lineTo(gh.x + 15 - (k + 0.5) * 7.5, gh.y + 12 - (k % 2 ? 0 : 6) + Math.sin(m.t * 10 + k) * 2); g.lineTo(gh.x - 15, gh.y + 12); g.closePath(); g.fill(); g.fillStyle = '#2a2040'; g.beginPath(); g.arc(gh.x - 5, gh.y - 5, 3.5, 0, 7); g.arc(gh.x + 5, gh.y - 5, 3.5, 0, 7); g.fill(); g.restore(); }
      T.p.forEach((P, i) => { if (P.out) return; g.globalAlpha = P.inv > 0 && Math.floor(m.t * 12) % 2 ? 0.45 : 1; hero(g, m, i, P.x, P.y + 10, 13, P.stun > 0 ? 'scared' : P.keys >= 2 ? 'cheer' : 'determined', { look: { x: P.face.x, y: P.face.y }, walk: 1 }); g.globalAlpha = 1; for (let k = 0; k < P.keys; k++) MGH.text(g, '🗝️', P.x - 8 + k * 16, P.y - 34, 12, '#fff'); msgAt(g, T, i, P.x, P.y - 44); });
      T.p.forEach((P, i) => { MGH.text(g, `${m.players[i].name}: ${P.out ? '✔ out' : '🗝️'.repeat(P.keys) + '·'.repeat(2 - P.keys)}`, 160 + i * 320, 712, 15, m.players[i].color, 'center', 'bold'); });
    },
  };

  // ---- floor 3: the golem
  const FLOOR = 640, PLATS = [{ x0: 130, x1: 340, y: 470 }, { x0: 940, x1: 1150, y: 470 }];
  const golem = {
    name: 'The Golem', icon: '🗿', how: 'A stone Golem guards the top floor! Run (LEFT/RIGHT) and jump (A) over its shockwaves and eye beam, dodge falling rocks, and when a hand slams down, punch the glowing crystal with B. Every crystal hit scores — getting hit costs a point.',
    init(m, S, T) {
      T.p = [0, 1, 2, 3].map(i => ({ x: 260 + i * 250, y: FLOOR, vy: 0, on: true, face: 1, stun: 0, pts: 0, cd: 0, punch: 0, inv: 0 }));
      T.hands = [{ s: 'idle', x: 400, y: 520, home: 400, tt: 1, tx: 400 }, { s: 'idle', x: 880, y: 520, home: 880, tt: 2.2, tx: 880 }];
      T.hp = 36; T.max = 36; T.next = 2.2; T.waves = []; T.rocks = []; T.beam = null; T.dead = 0; T.flash = 0;
    },
    hurt(m, S, T, P, i, from) { if (P.stun > 0 || P.inv > 0) return; P.stun = 1.1; P.inv = 1.8; P.pts = Math.max(0, P.pts - 1); P.vy = -420; P.on = false; P.kx = Math.sign(P.x - from) * 260; say(T, i, 'OUCH -1', '#ff6b6b'); Sfx.punch(); MGH.shake(5); },
    update(m, S, T, dt, t) {
      tickMsgs(T, dt); T.flash = Math.max(0, T.flash - dt);
      if (T.hp <= 0) { T.dead += dt; return; }
      // attack pattern
      T.next -= dt;
      if (T.next <= 0) {
        const r = Math.random();
        if (r < 0.55) { const h = T.hands.find(h => h.s === 'idle'); if (h) { const live = T.p.filter(P => P.stun <= 0); const tg = live.length ? R.pick(live) : T.p[0]; h.s = 'raise'; h.tt = 0.95; h.tx = clamp(tg.x, 120, 1160); } }
        else if (r < 0.8) { for (let k = 0; k < 7; k++) T.rocks.push({ x: R.range(100, 1180), y: -60 - k * 90, warn: 0.9 + k * 0.18, t: 0 }); Sfx.thunder(); }
        else T.beam = { t: 0, warn: 1.0, life: 0.55, hit: new Set() };
        T.next = R.range(1.6, 2.6);
      }
      for (const h of T.hands) {
        h.tt -= dt;
        if (h.s === 'raise') { h.x += (h.tx - h.x) * Math.min(1, dt * 6); h.y += (300 - h.y) * Math.min(1, dt * 6); if (h.tt <= 0) { h.s = 'slam'; h.tt = 0.12; } }
        else if (h.s === 'slam') { h.y += (FLOOR - 40 - h.y) * Math.min(1, dt * 30); if (h.tt <= 0) { h.y = FLOOR - 40; h.s = 'down'; h.tt = 1.9; h.flash = 0; T.waves.push({ x: h.x, d: -1, t: 0 }, { x: h.x, d: 1, t: 0 }); MGH.shake(9); Sfx.boom(); MGH.burst(h.x, FLOOR, ['#a88a6a', '#7a5a3a'], 18, { speed: 260, grav: 700, up: 100 }); T.p.forEach((P, i) => { if (Math.abs(P.x - h.x) < 70 && P.y > FLOOR - 110) this.hurt(m, S, T, P, i, h.x); }); } }
        else if (h.s === 'down') { if (h.tt <= 0) { h.s = 'back'; h.tt = 0.6; } }
        else if (h.s === 'back') { h.x += (h.home - h.x) * Math.min(1, dt * 5); h.y += (520 - h.y) * Math.min(1, dt * 5); if (h.tt <= 0) h.s = 'idle'; }
        h.flash = Math.max(0, (h.flash || 0) - dt);
      }
      for (const w of T.waves) { w.t += dt; w.x += w.d * 520 * dt; T.p.forEach((P, i) => { if (Math.abs(P.x - w.x) < 26 && P.y > FLOOR - 30 && w.t > 0.05) this.hurt(m, S, T, P, i, w.x - w.d * 40); }); }
      T.waves = T.waves.filter(w => w.x > 40 && w.x < 1240);
      for (const r of T.rocks) { r.t += dt; if (r.t >= r.warn && !r.hit) { r.hit = true; T.p.forEach((P, i) => { if (Math.abs(P.x - r.x) < 44 && P.y > FLOOR - 140) this.hurt(m, S, T, P, i, r.x); }); MGH.burst(r.x, FLOOR - 10, ['#9a8466', '#6a5a46'], 10, { speed: 200, grav: 700 }); Sfx.thud(); } }
      T.rocks = T.rocks.filter(r => r.t < r.warn + 0.3);
      if (T.beam) { const b = T.beam; b.t += dt; if (b.t > b.warn && b.t < b.warn + b.life) T.p.forEach((P, i) => { if (!b.hit.has(i) && P.y > FLOOR - 50) { b.hit.add(i); this.hurt(m, S, T, P, i, 640); } }); if (b.t > b.warn + b.life) T.beam = null; else if (b.t > b.warn && b.t - dt <= b.warn) { Sfx.noise(0.6, 2000, 0.1, 'bandpass', 0, 800); MGH.shake(4); } }
      // players
      T.p.forEach((P, i) => {
        P.stun -= dt; P.inv -= dt; P.cd -= dt; P.punch -= dt;
        const ax = P.stun > 0 ? 0 : m.axis(i).x; if (ax) P.face = Math.sign(ax);
        P.x = clamp(P.x + (ax * 330 + (P.kx || 0)) * dt, 70, 1210); P.kx = (P.kx || 0) * Math.pow(0.02, dt);
        if (P.stun <= 0 && m.pressed(i, 'a') && P.on) { P.vy = -820; P.on = false; }
        const py = P.y;
        if (!P.on) { P.vy += 2000 * dt; P.y += P.vy * dt; if (P.vy > 0) { if (P.y >= FLOOR) { P.y = FLOOR; P.vy = 0; P.on = true; } else for (const pl of PLATS) if (py <= pl.y && P.y >= pl.y && P.x > pl.x0 && P.x < pl.x1) { P.y = pl.y; P.vy = 0; P.on = pl; } } }
        else if (P.on !== true && (P.x < P.on.x0 || P.x > P.on.x1)) P.on = false;
        if (P.stun <= 0 && m.pressed(i, 'b') && P.cd <= 0) {
          P.cd = 0.28; P.punch = 0.14; Sfx.whoosh(false);
          const hx = P.x + P.face * 50, hy = P.y - 40;
          for (const h of T.hands) if (h.s === 'down' && Math.abs(hx - h.x) < 84 && Math.abs(hy - (h.y - 30)) < 80) {
            T.hp--; P.pts++; h.flash = 0.15; T.flash = 0.1; say(T, i, '+1', '#7cf06a'); Sfx.tone(1200, 0.06, 'triangle', 0.06); MGH.burst(h.x, h.y - 30, ['#9ff8ff', '#ffffff', '#5fd8ff'], 10, { speed: 220, kind: 'spark', size: 2 });
            if (T.hp <= 0) { P.pts += 3; say(T, i, 'FINAL BLOW +3!', '#ffe680'); Sfx.boom(); Sfx.crowd('cheer'); MGH.shake(14); }
            break;
          }
        }
      });
    },
    bot(m, S, T, i, dt) {
      const P = T.p[i], v = m.vin[i]; v.a = v.b = false; v.ax = 0; if (P.stun > 0) return;
      // dodge first
      const wave = T.waves.find(w => Math.sign(P.x - w.x) === w.d && Math.abs(P.x - w.x) < 120);
      if (wave && P.on === true) v.a = !m.prev[i].a;
      if (T.beam && T.beam.t > T.beam.warn - 0.25 && P.on && P.y > FLOOR - 50) v.a = !m.prev[i].a;
      const rock = T.rocks.find(r => !r.hit && Math.abs(r.x - P.x) < 60 && r.warn - r.t < 0.7);
      const raised = T.hands.find(h => h.s === 'raise' && Math.abs(h.tx - P.x) < 90);
      if (rock || raised) { const from = rock ? rock.x : raised.tx; v.ax = P.x < from ? -1 : 1; if (P.x < 120) v.ax = 1; if (P.x > 1160) v.ax = -1; return; }
      const h = T.hands.find(h => h.s === 'down');
      if (h) { const spot = h.x + [-62, 62, -34, 34][i], dx = spot - P.x; if (Math.abs(dx) > 14) v.ax = Math.sign(dx); else { v.ax = Math.sign(h.x - P.x) * 0.2; if (P.cd <= 0 && Math.random() < 0.5) v.b = true; } }
      else v.ax = Math.abs(640 - P.x) > 300 ? Math.sign(640 - P.x) : 0;
    },
    done(m, S, T, t) { return (T.hp <= 0 && T.dead > 1.6) || t > 50; },
    result(m, S, T) { return T.p.map(P => P.pts); },
    fmt: v => `${Math.round(v)} crystal hits`,
    draw(m, S, T, g) {
      g.fillStyle = MGH.grad(g, 40, 720, ['#1a1030', '#3a2050', '#1a1028']); g.fillRect(0, 40, 1280, 680);
      for (let k = 0; k < 6; k++) { const x = 120 + k * 210; g.fillStyle = 'rgba(80,60,110,0.6)'; g.fillRect(x - 24, 80, 48, 560); MGH.glow(g, x, 140, 50, 'rgba(255,170,80,0.3)'); MGH.fireball(g, x, 136, 9, m.t + k, 0, -1); }
      // the golem (sinks and crumbles when beaten)
      const sink = T.hp <= 0 ? Math.min(1, T.dead / 1.6) : 0;
      g.save(); g.translate(0, sink * 260); g.globalAlpha = 1 - sink * 0.6;
      const bx = 640, by = 330 + Math.sin(m.t * 1.5) * 4;
      g.fillStyle = MGH.grad(g, by - 160, by + 300, ['#9a8a7a', '#6a5a4a', '#3a2e24']);
      g.beginPath(); g.moveTo(bx - 170, FLOOR); g.lineTo(bx - 200, by + 40); g.quadraticCurveTo(bx - 190, by - 120, bx, by - 150); g.quadraticCurveTo(bx + 190, by - 120, bx + 200, by + 40); g.lineTo(bx + 170, FLOOR); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(40,30,20,0.5)'; g.lineWidth = 4; for (const [a, b, c, d] of [[-120, -40, -60, 40], [40, -90, 110, -20], [-30, 80, 60, 140], [-150, 120, -90, 200]]) { g.beginPath(); g.moveTo(bx + a, by + b); g.lineTo(bx + c, by + d); g.stroke(); }
      g.fillStyle = '#6fcf55'; for (let k = 0; k < 5; k++) { g.beginPath(); g.ellipse(bx - 140 + k * 70, by - 110 + Math.abs(k - 2) * 18, 26, 10, 0, 0, 7); g.fill(); }
      const eye = T.beam && T.beam.t < T.beam.warn + T.beam.life ? 1 : 0.5 + 0.2 * Math.sin(m.t * 3);
      MGH.glow(g, bx, by - 50, 70 * eye, 'rgba(255,90,60,0.8)'); g.fillStyle = '#ffd34d'; g.beginPath(); g.ellipse(bx, by - 50, 34, 14 + eye * 6, 0, 0, 7); g.fill(); g.fillStyle = '#ff3d1f'; g.beginPath(); g.arc(bx, by - 50, 9, 0, 7); g.fill();
      // hp bar
      g.restore();
      if (T.hp > 0) { g.fillStyle = 'rgba(0,0,0,0.5)'; MGH.rr(g, 440, 56, 400, 18, 9); g.fill(); g.fillStyle = '#ff6b4d'; MGH.rr(g, 440, 56, 400 * T.hp / T.max, 18, 9); g.fill(); MGH.text(g, 'GOLEM', 640, 70, 13, '#fff', 'center', 'bold'); }
      // floor and platforms
      g.fillStyle = MGH.grad(g, FLOOR, 720, ['#6a5a6a', '#3a2e3a']); g.fillRect(0, FLOOR, 1280, 80); g.fillStyle = '#8a7a8a'; g.fillRect(0, FLOOR, 1280, 5);
      for (const pl of PLATS) MGH.plat(g, pl.x0, pl.y, pl.x1 - pl.x0, 16, 'stone', m.t);
      // beam warning / beam
      if (T.beam) { const b = T.beam; if (b.t < b.warn) { g.fillStyle = `rgba(255,80,60,${0.15 + 0.25 * Math.abs(Math.sin(b.t * 18))})`; g.fillRect(0, FLOOR - 50, 1280, 44); MGH.label(g, '⚠ JUMP!', 640, FLOOR - 70, 20, '#ff9a6b'); } else { const gr = g.createLinearGradient(0, FLOOR - 52, 0, FLOOR - 6); gr.addColorStop(0, 'rgba(255,220,120,0)'); gr.addColorStop(0.5, 'rgba(255,240,200,0.95)'); gr.addColorStop(1, 'rgba(255,90,40,0)'); g.fillStyle = gr; g.fillRect(0, FLOOR - 52, 1280, 46); } }
      // rocks
      for (const r of T.rocks) { const k = Math.min(1, r.t / r.warn); if (!r.hit) { g.strokeStyle = `rgba(255,120,80,${0.4 + 0.5 * k})`; g.lineWidth = 3; g.beginPath(); g.ellipse(r.x, FLOOR, 44 * (1.3 - k * 0.3), 10, 0, 0, 7); g.stroke(); MGH.rock(g, r.x, 40 + (FLOOR - 70) * k * k, 24, r.x, '#8a7a66', r.t * 4); } }
      // shockwaves
      for (const w of T.waves) { g.fillStyle = 'rgba(200,170,120,0.85)'; g.beginPath(); g.moveTo(w.x - 26, FLOOR); g.quadraticCurveTo(w.x, FLOOR - 46, w.x + 26, FLOOR); g.fill(); MGH.rock(g, w.x, FLOOR - 16, 10, w.x, '#a88a6a', w.t * 8); }
      // hands
      for (const h of T.hands) {
        if (h.s === 'raise') { g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.ellipse(h.tx, FLOOR, 70, 14, 0, 0, 7); g.fill(); }
        g.save(); g.translate(h.x, h.y + sink * 260);
        g.fillStyle = MGH.grad(g, -60, 40, ['#a89a8a', '#6a5a4a']); g.beginPath(); g.moveTo(-60, 30); g.quadraticCurveTo(-70, -40, -20, -60); g.lineTo(30, -60); g.quadraticCurveTo(72, -40, 60, 30); g.closePath(); g.fill();
        g.strokeStyle = 'rgba(40,30,20,0.6)'; g.lineWidth = 4; for (let k = -1; k <= 1; k++) { g.beginPath(); g.moveTo(k * 26, 30); g.lineTo(k * 26, 0); g.stroke(); }
        if (h.s === 'down') { MGH.glow(g, 0, -30, 50, h.flash > 0 ? 'rgba(255,255,255,0.9)' : 'rgba(110,230,255,0.75)'); MGH.gem(g, 0, -30, 18, '#7ff0ff', m.t); }
        g.restore();
      }
      // heroes
      T.p.forEach((P, i) => {
        g.globalAlpha = P.inv > 0 && Math.floor(m.t * 12) % 2 ? 0.45 : 1;
        const hands = P.punch > 0 ? { n: { x: -1.7, y: -0.3, d: 180, o: false, m: false }, f: { x: 0.7, y: 0, d: 160, o: false, m: false } } : undefined;
        hero(g, m, i, P.x, P.y, 24, P.stun > 0 ? 'hurt' : P.punch > 0 ? 'angry' : 'determined', { look: { x: P.face, y: 0 }, walk: P.on && Math.abs(m.axis(i).x) > 0.2 && P.stun <= 0 ? 1 : 0, hands });
        g.globalAlpha = 1; msgAt(g, T, i, P.x, P.y - 90);
      });
      T.p.forEach((P, i) => MGH.text(g, `${m.players[i].name} ${P.pts}`, 160 + i * 320, 706, 18, m.players[i].color, 'center', 'bold'));
      if (T.hp <= 0) MGH.label(g, '🗿 THE GOLEM CRUMBLES!', 640, 200, 36, '#ffe680');
      if (T.flash > 0) { g.fillStyle = `rgba(255,255,255,${T.flash * 2})`; g.fillRect(0, 40, 1280, 680); }
    },
  };

  // ---- floor 4: escape the collapsing tower
  const ESC_LEN = 19000;
  function escCourse() {
    const ob = []; let x = 900;
    while (x < ESC_LEN - 800) {
      const r = Math.random();
      if (r < 0.42) { ob.push({ k: 'gap', x, w: R.range(90, 150) }); x += R.range(420, 640); }
      else if (r < 0.72) { ob.push({ k: 'beam', x }); x += R.range(380, 560); }
      else { ob.push({ k: 'gems', x, h: R.pick([40, 90, 130]) }); x += R.range(260, 400); }
    }
    return ob;
  }
  const escape = {
    name: 'Tower Escape', icon: '🏃‍♂️', how: 'The tower is collapsing — RUN! You run on your own: press A to JUMP the gaps and hold DOWN to SLIDE under falling beams. Grab gems for bonus points. Bump a beam and the rubble gains on you; fall in a gap or get caught and you’re out!',
    init(m, S, T) { T.ob = escCourse(); T.p = [0, 1, 2, 3].map(() => ({ x: 0, y: 0, vy: 0, slide: false, lead: 420, out: 0, gems: 0, got: new Set(), fall: 0, stum: 0 })); },
    speed(t) { return 360 + t * 7; },
    update(m, S, T, dt, t) {
      tickMsgs(T, dt);
      const sp = this.speed(t);
      T.p.forEach((P, i) => {
        if (P.out) return;
        if (P.fall > 0) { P.fall += dt; P.y += 600 * dt; if (P.fall > 0.9) { P.out = t; } return; }
        if (P.x >= ESC_LEN) return;
        P.stum -= dt;
        const s = sp * (P.stum > 0 ? 0.6 : 1);
        P.x += s * dt; P.lead += (s - sp + 14) * dt - (P.stum > 0 ? 0 : 0);
        if (m.pressed(i, 'a') && P.y >= 0 && !P.slide) { P.vy = -760; Sfx.tone(420, 0.05, 'triangle', 0.04, 260); }
        P.slide = P.y >= 0 && (m.axis(i).y > 0.5);
        if (P.y < 0 || P.vy < 0) { P.vy += 2000 * dt; P.y += P.vy * dt; if (P.y >= 0) { P.y = 0; P.vy = 0; } }
        for (const o of T.ob) {
          if (o.k === 'gap' && P.x > o.x + 10 && P.x < o.x + o.w - 10 && P.y >= 0) { P.fall = 0.01; say(T, i, 'AAAH!', '#ff6b6b'); Sfx.bad(); return; }
          if (o.k === 'beam' && !o.hit && Math.abs(P.x - o.x) < 14 && !P.slide && P.y > -30 && !(P['b' + o.x])) { P['b' + o.x] = 1; P.stum = 0.5; P.lead -= 140; say(T, i, 'BONK!', '#ff9a6b'); Sfx.thud(); MGH.shake(4); }
          if (o.k === 'gems' && !P.got.has(o.x) && Math.abs(P.x - o.x) < 26 && Math.abs(-P.y - o.h) < 46) { P.got.add(o.x); P.gems++; Sfx.coin(); }
        }
        if (P.lead <= 0) { P.out = t; say(T, i, 'CAUGHT!', '#ff6b6b'); Sfx.boom(); }
        if (P.x >= ESC_LEN) { say(T, i, 'ESCAPED!', '#7cf06a'); Sfx.star(); }
      });
    },
    bot(m, S, T, i, dt) {
      const P = T.p[i], v = m.vin[i]; v.a = false; v.ay = 0; if (P.out || P.fall) return;
      const sp = this.speed(S.stageT), ahead = o => o.x - P.x;
      for (const o of T.ob) {
        const d = ahead(o);
        if (o.k === 'gap' && d > 0 && d < sp * 0.16 + R.range(-6, 10) && P.y >= 0) v.a = !m.prev[i].a;
        if (o.k === 'beam' && d > -10 && d < sp * 0.22 && Math.random() < 0.93) v.ay = 1;
        if (o.k === 'gems' && o.h > 60 && d > 0 && d < sp * 0.22 && P.y >= 0 && Math.random() < 0.08) v.a = !m.prev[i].a;
      }
    },
    done(m, S, T, t) { return T.p.every(P => P.out || P.x >= ESC_LEN); },
    result(m, S, T) { return T.p.map(P => (P.x >= ESC_LEN ? 1000 + P.lead / 10 : P.x / 100) + P.gems * 8); },
    fmt: v => v >= 1000 ? `escaped (+gems)` : `${Math.round(v)} pts`,
    draw(m, S, T, g) {
      g.fillStyle = '#0e0818'; g.fillRect(0, 40, 1280, 680);
      for (let i = 0; i < 4; i++) {
        const L = MGM.lane(i, 80, 158), P = T.p[i], camX = P.x - 320, floor = L.y1 - 26, X = x => x - camX;
        g.save(); g.beginPath(); g.rect(0, L.y0, 1280, L.h - 4); g.clip();
        g.fillStyle = MGH.grad(g, L.y0, L.y1, ['#3a2050', '#24143a']); g.fillRect(0, L.y0, 1280, L.h);
        for (let k = 0; k < 8; k++) { const wx = ((k * 220 - camX * 0.5) % 1760 + 1760) % 1760 - 100; g.fillStyle = 'rgba(255,200,120,0.18)'; MGH.rr(g, wx, L.y0 + 20, 40, 60, 18); g.fill(); }
        for (let k = 0; k < 6; k++) { const fx = ((k * 310 - camX * 0.8 + m.t * 40) % 1600 + 1600) % 1600 - 100; MGH.rock(g, fx, L.y0 + ((m.t * 160 + k * 70) % L.h), 6, k, '#5a4a5a', m.t * 3); }
        // floor with gaps
        let fx = Math.max(0, camX - 50);
        const gaps = T.ob.filter(o => o.k === 'gap' && o.x + o.w > camX - 50 && o.x < camX + 1400);
        g.fillStyle = '#6a5a6a';
        for (const o of gaps) { if (o.x > fx) g.fillRect(X(fx), floor, o.x - fx, 30); g.fillStyle = 'rgba(255,90,40,0.3)'; g.fillRect(X(o.x), floor + 20, o.w, 10); g.fillStyle = '#6a5a6a'; fx = o.x + o.w; }
        g.fillRect(X(fx), floor, camX + 1400 - fx, 30); g.fillStyle = '#8a7a8a'; g.fillRect(0, floor, 1280, 3);
        for (const o of gaps) { g.fillStyle = '#0e0818'; g.fillRect(X(o.x), floor - 1, o.w, 34); }
        for (const o of T.ob) {
          const x = X(o.x); if (x < -60 || x > 1340) continue;
          if (o.k === 'beam') { g.fillStyle = MGH.grad(g, floor - 90, floor - 50, ['#9a7a5a', '#6a4a2a']); g.fillRect(x - 40, floor - 88, 80, 26); g.strokeStyle = '#3a2a1a'; g.lineWidth = 2; g.strokeRect(x - 40, floor - 88, 80, 26); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x - 6, L.y0, 12, floor - 88 - L.y0); }
          if (o.k === 'gems' && !P.got.has(o.x)) MGH.gem(g, x, floor - o.h, 11, ['#ff6b8a', '#5fd8ff', '#ffe680'][Math.floor(o.x) % 3], m.t);
        }
        if (ESC_LEN - camX < 1300) { const x = X(ESC_LEN); g.fillStyle = '#7a4a2a'; MGH.rr(g, x, floor - 110, 70, 110, 30); g.fill(); MGH.glow(g, x + 35, floor - 60, 90, 'rgba(255,230,140,0.6)'); }
        // rubble wall chasing from the left
        const wx = X(P.x - P.lead); if (wx > -200) { g.fillStyle = MGH.grad(g, L.y0, L.y1, ['#4a3a3a', '#2a2020']); g.beginPath(); g.moveTo(-10, L.y0); g.lineTo(wx, L.y0); for (let y = L.y0; y <= L.y1; y += 20) g.lineTo(wx + Math.sin(y * 0.3 + m.t * 8) * 14, y); g.lineTo(-10, L.y1); g.fill(); for (let k = 0; k < 4; k++) MGH.rock(g, wx - 10 + Math.sin(m.t * 6 + k) * 8, L.y0 + 20 + k * 34, 12, k, '#7a6a5a', m.t * 4 + k); }
        if (!P.out || P.fall) { const mood = P.out ? 'scared' : P.stum > 0 ? 'dizzy' : P.lead < 160 ? 'scared' : P.x >= ESC_LEN ? 'cheer' : 'determined'; g.save(); if (P.slide) { g.translate(320, floor); g.rotate(-0.9); g.translate(-320, -floor); } hero(g, m, i, 320, floor + P.y, 24, mood, { look: { x: 1, y: 0 }, walk: P.y >= 0 && !P.slide && P.x < ESC_LEN ? 1 : 0, t: m.t * 1.3 }); g.restore(); }
        g.restore();
        g.fillStyle = m.players[i].color; g.fillRect(0, L.y0, 6, L.h - 4);
        MGH.text(g, `${m.players[i].name}  💎${P.gems}  ${P.out && !P.fall ? 'OUT' : P.x >= ESC_LEN ? 'ESCAPED' : Math.round(P.x / ESC_LEN * 100) + '%'}`, 20, L.y0 + 22, 15, m.players[i].color, 'left', 'bold');
        msgAt(g, T, i, 420, L.y0 + 50);
      }
    },
  };

  MGM.def({ id: 'tower', name: 'Tower of Trials', how: 'An adventure race up a magic tower — every floor is a different challenge.', stages: [skyclimb, keyhunt, golem, escape] });
})();
