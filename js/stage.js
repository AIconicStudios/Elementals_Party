'use strict';
// Stage: the board's "show" layer. Every surprising thing that happens on the board plays a short,
// readable animation here (item cards, fortune wheels you stop yourself, punches, the pedlar's stall,
// space effects with the camera leaning in) so nobody is left wondering "what just happened?".
// Game code awaits these shows; in headless test mode they resolve at once.
const Stage = {
  shows: [], wfx: [],
  shop: null,
  now() { return performance.now() / 1000; },
  rate() { return 1 / Math.max(0.15, Settings.speed || 1); },
  off() { return Settings.test || !Render.g; },

  // ---------------------------------------------------------- core
  play(s, world) {
    if (this.off()) return Promise.resolve(s.result);
    s.t = 0; s.last = this.now(); (world ? this.wfx : this.shows).push(s);
    return new Promise(res => { s.done = res; });
  },
  step(list, g) {
    const n = this.now();
    for (const s of list) {
      const dt = Settings.paused ? 0 : Math.min(0.1, n - s.last) * this.rate(); s.last = n; s.dt = dt; s.t += dt;
      try { s.draw(g, s.t, s); } catch (e) { console.error(e); s.end = true; }
      if (s.end || (s.len !== undefined && s.t >= s.len)) { s.dead = true; if (s.done) s.done(s.result); }
    }
    return list.filter(s => !s.dead);
  },
  drawWorld(g) { this.wfx = this.step(this.wfx, g); },
  drawScreen(g) {
    if (this.shop) this.drawShop(g);
    this.shows = this.step(this.shows, g);
    const sm = this.shows.length > 0 && !Render.stopper; if (sm !== this._sm) { this._sm = sm; document.getElementById('app').classList.toggle('showmode', sm); }
  },
  busy() { return this.shows.length > 0; },
  wait(ms) { return this.off() ? Promise.resolve() : sleep(ms); },

  // camera: lean in on a board point for a moment
  async look(pt, ms = 900, s = 2.1) {
    if (this.off()) return;
    const tok = {}; Render.focus = { x: pt.x, y: pt.y, s, tok };
    await sleep(ms);
    if (Render.focus && Render.focus.tok === tok) Render.focus = null;
  },
  lookAt(pt, s = 2.1) { if (!this.off()) Render.focus = { x: pt.x, y: pt.y, s, tok: {} }; },
  lookOff() { Render.focus = null; },

  // ---------------------------------------------------------- drawing helpers
  E: {
    out: k => 1 - Math.pow(1 - clamp(k, 0, 1), 3),
    back: k => { k = clamp(k, 0, 1); const c = 1.70158; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); },
    inout: k => { k = clamp(k, 0, 1); return k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; },
  },
  fade(t, len, a = 0.25, b = 0.3) { return clamp(Math.min(t / a, (len - t) / b), 0, 1); },
  dim(g, a) { g.fillStyle = `rgba(6,4,16,${a})`; g.fillRect(0, 0, 1600, 900); },
  icon(g, ic, x, y, size) {
    g.font = `${Math.round(size)}px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif`;
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.fillText(ic, x, y); g.textBaseline = 'alphabetic';
  },
  word(g, s, x, y, size, col = '#fff', max) {
    g.font = `bold ${Math.round(size)}px Georgia, "Segoe UI Emoji", serif`; g.textAlign = 'center';
    g.lineJoin = 'round'; g.lineWidth = size * 0.18; g.strokeStyle = 'rgba(10,6,24,0.9)'; g.strokeText(s, x, y, max); g.fillStyle = col; g.fillText(s, x, y, max);
  },
  rays(g, x, y, r, col, t, n = 12) {
    g.save(); g.translate(x, y); g.rotate(t * 0.6); g.fillStyle = col;
    for (let k = 0; k < n; k++) { g.rotate(Math.PI * 2 / n); g.globalAlpha *= 1; g.beginPath(); g.moveTo(0, 0); g.lineTo(r, -r * 0.12); g.lineTo(r, r * 0.12); g.closePath(); g.fill(); }
    g.restore();
  },
  medal(g, x, y, r, col) {
    const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
    gr.addColorStop(0, Char.shade(col, 0.55)); gr.addColorStop(1, Char.shade(col, -0.25));
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    g.strokeStyle = '#fff6d0'; g.lineWidth = r * 0.07; g.stroke();
    g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = r * 0.03; g.beginPath(); g.arc(x, y, r * 0.86, 0, 7); g.stroke();
  },
  coin(g, x, y, r, spin = 0) {
    const w = Math.max(0.15, Math.abs(Math.cos(spin)));
    g.fillStyle = '#ffd34d'; g.strokeStyle = '#a8790a'; g.lineWidth = Math.max(1, r * 0.18);
    g.beginPath(); g.ellipse(x, y, r * w, r, 0, 0, 7); g.fill(); g.stroke();
    if (w > 0.5) { g.fillStyle = '#ffe98f'; g.beginPath(); g.ellipse(x - r * 0.2 * w, y - r * 0.25, r * 0.3 * w, r * 0.22, 0, 0, 7); g.fill(); }
  },
  scr(pt) { return Render.toScreen(pt.x, pt.y); },
  tokPt(p) { const d = Render.disp['T' + p.id] || Render.tokenTarget(p, 'T'); return { x: d.x, y: d.y - 27 / Render.T }; }, // middle of the standing character

  // ---------------------------------------------------------- the next minigame: a slot-machine reveal
  mgReveal(id) {
    if (this.off()) return Promise.resolve();
    const list = R.shuffle(MG.list.filter(x => x.id !== id)).slice(0, 14).concat([MG.byId[id]]);
    const len = 3.6, TY = { Arcade: '#ff6a8a', Timing: '#ffd34d', Reaction: '#ff9a3d', Rhythm: '#c58bff', Survival: '#ff4d4d', Arena: '#5fb8ff', Race: '#6fdc8c', Memory: '#5fe3d0', Bluff: '#b48aff', Luck: '#ffd34d', Skill: '#7cc0ff', Search: '#ffb36b', Strategy: '#9fe07a', Stealth: '#8a8aff' };
    let last = -1;
    Sfx.crowd('ooh');
    return this.play({ len, draw: (g, t) => {
      const a = this.fade(t, len, 0.25, 0.3);
      g.save(); g.globalAlpha = a; this.dim(g, 0.6);
      this.rays(g, 800, 450, 700, 'rgba(255,230,140,0.08)', t, 16);
      this.word(g, '🎉 MOOT TIME! 🎉', 800, 190, 56, '#ffe680');
      // reel: decelerates and lands on the chosen game
      const k = this.E.out(Math.min(1, t / 2.6)), pos = k * (list.length - 1), idx = Math.round(pos);
      if (idx !== last && t < 2.7) { last = idx; Sfx.tick(); }
      if (t > 2.6 && t - (s => s)(0) < 2.7 && !this._mgDone) { this._mgDone = true; Sfx.win(); setTimeout(() => { this._mgDone = false; }, 1500); }
      g.save(); this.rrect(g, 420, 300, 760, 300, 30); g.clip();
      for (let j = -2; j <= 2; j++) {
        const gi = Math.floor(pos) + j, game = list[gi]; if (!game) continue;
        const y = 450 + (gi - pos) * 120, sc = 1 - Math.min(0.4, Math.abs(gi - pos) * 0.25), col = TY[game.type] || '#fff';
        g.save(); g.translate(800, y); g.scale(sc, sc);
        g.fillStyle = 'rgba(20,14,48,0.95)'; this.rrect(g, -340, -48, 680, 96, 22); g.fill(); g.strokeStyle = col; g.lineWidth = 5; g.stroke();
        g.fillStyle = col; this.rrect(g, -320, -22, 150, 44, 14); g.fill(); this.word(g, game.type, -245, 9, 20, '#1a0f3a');
        this.word(g, game.name, 70, 14, 40, '#fff', 480);
        g.restore();
      }
      g.restore();
      g.strokeStyle = '#ffe680'; g.lineWidth = 6; this.rrect(g, 420, 300, 760, 300, 30); g.stroke();
      g.fillStyle = '#ff4d6d'; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(800 + s * 400, 450); g.lineTo(800 + s * 372, 432); g.lineTo(800 + s * 372, 468); g.fill(); }
      if (t > 2.6) { const z = this.E.back((t - 2.6) / 0.4); MGH.glow(g, 800, 450, 300 * z, 'rgba(255,230,120,0.35)'); this.word(g, 'Get ready!', 800, 680, 34 * z, '#fff'); }
      g.restore();
    } });
  },
  // ---------------------------------------------------------- 0. opening fly-over of the four Holds
  async intro(G) {
    if (this.off()) return;
    this.lookAt({ x: 800, y: 450 }, 0.9); await sleep(900);
    for (const p of G.players) {
      const c = Render.homeCenter(p.id); this.lookAt({ x: c.x, y: c.y - 20 }, 2.0);
      Sfx.turn(p.id); Render.react(p.id, 'cheer', R.pick(['This is my Hold!', 'Welcome to my place~', 'Hehe, hi!', 'Hmph. Mine.']));
      await sleep(450);
      this.play({ len: 1.6, draw: (g, t) => { const a = this.fade(t, 1.5, 0.2, 0.3); g.save(); g.globalAlpha = a; this.word(g, p.el.hold, 800, 760, 52, p.color); this.word(g, p.name, 800, 810, 26, '#fff'); g.restore(); } });
      await sleep(1500);
    }
    this.lookOff(); await sleep(600);
  },
  // ---------------------------------------------------------- 1. turn intro
  turn(p) {
    const len = 1.7; Sfx.turn(p.id); Sfx.turnJingle(p.id);
    return this.play({ len, draw: (g, t) => {
      const a = this.fade(t, len, 0.2, 0.25), e = this.E.back(t / 0.4);
      g.save(); g.globalAlpha = a;
      const y = 450, x = -260 + 1060 * e - Math.max(0, t - (len - 0.3)) * 1500;
      const gr = g.createLinearGradient(x - 420, 0, x + 420, 0);
      gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.25, Char.shade(p.color, -0.45)); gr.addColorStop(0.75, Char.shade(p.color, -0.45)); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.beginPath(); g.moveTo(x - 440, y - 70); g.lineTo(x + 460, y - 86); g.lineTo(x + 440, y + 70); g.lineTo(x - 460, y + 86); g.closePath(); g.fill();
      Char.draw(g, x - 150, y + 6, 56, p.id, p.color, { mood: 'determined', seed: p.id, look: { x: 0.8, y: 0 } });
      this.word(g, p.name, x + 90, y + 18, 54, p.color, 480);
      g.restore();
    } });
  },

  // ---------------------------------------------------------- 2. item played: a big card, then it flies to its target
  item(p, icon, name, target, id) {
    const fly = !!target, len = fly ? 2.25 : 1.7;
    let hit = false, sfx = false;
    return this.play({ len, draw: (g, t) => {
      const a = this.fade(t, len, 0.2, 0.3), cx = 800, cy = 400;
      g.save(); g.globalAlpha = a; this.dim(g, 0.55); g.globalAlpha = 1;
      if (!sfx && t > 0.1) { sfx = true; if (id) Sfx.item(id); else Sfx.star(); }
      const pop = this.E.back(t / 0.45);
      let ix = cx, iy = cy, isz = 118 * pop;
      if (fly && t > 1.25) {
        const k = this.E.inout((t - 1.25) / 0.6), tp = this.scr(this.tokPt(target));
        ix = lerp(cx, tp.x, k); iy = lerp(cy, tp.y - 20, k) - Math.sin(k * Math.PI) * 160; isz = lerp(118, 46, k);
        if (k >= 1 && !hit) { hit = true; const w = this.tokPt(target); Render.burstAt(w, [p.color, '#fff', '#ffe680'], 26, { speed: 240, kind: 'spark', size: 3 }); Render.addP({ x: w.x, y: w.y, kind: 'ring', color: p.color, size: 14, grow: 60, life: 0.5 }); Sfx.boom(); }
      }
      const med = fly ? clamp(1 - (t - 1.2) / 0.3, 0, 1) : 1;
      g.globalAlpha = a * med;
      this.rays(g, cx, cy, 230 * pop, `rgba(255,240,180,0.13)`, t);
      this.medal(g, cx, cy, 104 * pop, p.color);
      Char.draw(g, cx - 250, cy + 40, 62, p.id, p.color, { mood: target && target !== p ? 'smug' : 'cheer', seed: p.id, look: { x: 0.9, y: -0.2 } });
      this.word(g, name, cx, cy + 172, 42, '#fff6d0', 700);
      g.globalAlpha = a;
      if (!hit) this.icon(g, icon, ix, iy + Math.sin(t * 5) * 4, isz);
      if (fly && t > 1.25 && !hit) for (let k = 1; k < 6; k++) { g.globalAlpha = a * 0.15 * (6 - k); this.icon(g, icon, lerp(ix, cx, k * 0.04), lerp(iy, cy, k * 0.04), isz * 0.8); }
      g.restore();
    } });
  },

  // ---------------------------------------------------------- 3. fortune wheel: spins until you stop it, lands where it lands
  //  segs: [{ icon, text, color, w }]; returns the index it lands on
  async wheel(p, segs, title = '') {
    const idx = () => { const tot = sum(segs.map(s => s.w || 1)); let r = Math.random() * tot; for (let k = 0; k < segs.length; k++) { r -= segs[k].w || 1; if (r <= 0) return k; } return segs.length - 1; };
    if (this.off()) return idx();
    const n = segs.length, seg = Math.PI * 2 / n;
    const s = { A: Math.random() * 7, state: 'spin', win: -1, title };
    s.draw = (g, t) => {
      const dt = s.dt || 0;
      if (s.state === 'spin') s.A += 7.5 * dt;
      else if (s.state === 'slow') {
        const k = clamp((t - s.ts) / 2.1, 0, 1); s.A = lerp(s.a0, s.a1, this.E.out(k));
        if (k >= 1) { s.state = 'landed'; s.tl = t; Sfx.coin(); Render.burstAt(Render.toWorld(800, 260), [segs[s.win].color, '#fff', '#ffe680'], 30, { speed: 300, kind: 'spark', size: 3 }); }
      } else if (t - s.tl > 1.5) s.end = true;
      const tick = Math.floor((s.A + Math.PI / 2) / seg); if (tick !== s.tick) { s.tick = tick; if (s.state !== 'landed') Sfx.dice(); }
      const a = clamp(Math.min(t / 0.25, s.state === 'landed' ? (1.5 - (t - s.tl)) / 0.3 : 1), 0, 1);
      const cx = 800, cy = 470, R0 = 205, pop = this.E.back(t / 0.45);
      g.save(); g.globalAlpha = a; this.dim(g, 0.45); g.globalAlpha = a;
      Char.draw(g, cx - 330, cy + 70, 60, p.id, p.color, { mood: s.state === 'landed' ? 'cheer' : 'determined', seed: p.id, look: { x: 0.9, y: -0.3 } });
      if (title) this.word(g, title, cx, cy + R0 + 68, 34, '#fff6d0');
      g.translate(cx, cy); g.scale(pop, pop);
      // rim with bulbs
      g.fillStyle = '#3a2468'; g.beginPath(); g.arc(0, 0, R0 + 22, 0, 7); g.fill();
      g.strokeStyle = '#ffd34d'; g.lineWidth = 6; g.stroke();
      for (let k = 0; k < 24; k++) { const an = k / 24 * Math.PI * 2, on = (Math.floor(t * 8) + k) % 2; g.fillStyle = on ? '#fff6b0' : '#a0742a'; g.beginPath(); g.arc(Math.cos(an) * (R0 + 11), Math.sin(an) * (R0 + 11), 4.5, 0, 7); g.fill(); }
      for (let k = 0; k < n; k++) {
        const a0 = s.A + k * seg, a1 = a0 + seg, sg = segs[k];
        g.fillStyle = sg.color || ['#ff6a8a', '#5fb8ff', '#ffd34d', '#6fdc8c', '#c58bff', '#ff9a3d'][k % 6];
        g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, R0, a0, a1); g.closePath(); g.fill();
        if (s.state === 'landed' && k === s.win) { g.fillStyle = `rgba(255,255,255,${0.35 + 0.3 * Math.sin(t * 14)})`; g.fill(); }
        g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = 2.5; g.stroke();
        g.save(); g.rotate(a0 + seg / 2); g.translate(R0 * 0.66, 0); g.rotate(Math.PI / 2);
        if (sg.icon) this.icon(g, sg.icon, 0, sg.text ? -12 : 0, Math.min(46, R0 * seg * 0.42));
        if (sg.text) this.word(g, sg.text, 0, sg.icon ? 26 : 10, Math.min(26, R0 * seg * 0.24), '#fff');
        g.restore();
      }
      g.fillStyle = '#fff6d0'; g.beginPath(); g.arc(0, 0, 30, 0, 7); g.fill(); g.strokeStyle = '#a0742a'; g.lineWidth = 5; g.stroke();
      Char.draw(g, 0, 4, 17, p.id, p.color, { mood: 'happy', noFeet: true, noArms: true, simple: true, seed: p.id });
      // pointer
      const wob = s.state === 'landed' ? 0 : Math.sin(t * 40) * 0.08;
      g.save(); g.translate(0, -R0 - 18); g.rotate(wob);
      g.fillStyle = '#ff4d6d'; g.strokeStyle = '#fff'; g.lineWidth = 4; g.beginPath(); g.moveTo(-22, -26); g.lineTo(22, -26); g.lineTo(0, 22); g.closePath(); g.fill(); g.stroke();
      g.restore();
      g.restore();
      if (s.state === 'landed') {
        const w = segs[s.win], k = this.E.back((t - s.tl) / 0.4);
        g.save(); g.globalAlpha = a; g.translate(cx + 330, cy - 20); g.scale(k, k);
        this.medal(g, 0, 0, 74, w.color || '#ffd34d');
        if (w.icon) this.icon(g, w.icon, 0, w.text ? -14 : 0, 58);
        if (w.text) this.word(g, w.text, 0, w.icon ? 46 : 14, w.icon ? 30 : 44, '#fff');
        g.restore();
      } else if (s.state === 'spin' && p.human) {
        g.save(); g.globalAlpha = a * (0.65 + 0.35 * Math.sin(t * 7)); this.word(g, 'STOP!', cx - 330, cy - 60, 40, '#ffe680'); g.restore();
      }
    };
    const done = this.play(s);
    if (p.human) await UI.waitStop(p, '🎡 STOP THE WHEEL!'); else await sleep(R.range(900, 1500));
    s.win = idx();
    const target = -Math.PI / 2 - (s.win + 0.5 + R.range(-0.32, 0.32)) * seg;
    let d = ((target - s.A) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    s.a0 = s.A; s.a1 = s.A + d + Math.PI * 4; s.ts = s.t; s.state = 'slow';
    await done;
    return s.win;
  },

  // ---------------------------------------------------------- 4. punch! (landing on a rival's space)
  async punch(p, q, stole) {
    if (this.off()) return;
    const at = this.tokPt(q); this.lookAt(at, 3.2);
    this.punchFx(p, q, stole);
    await sleep(450);
    const len = 2.4; let coinFx = false, powFx = false;
    const a0 = this.tokPt(p), dir = Math.sign(at.x - a0.x) || 1;
    await this.play({ len, draw: (g, t) => {
      const A = Render.anim;
      // attacker: wind-up, lunge, gloat
      let dx = 0, dy = 0, mood = 'angry';
      if (t < 0.45) { dx = -dir * 8 * this.E.out(t / 0.45); dy = -2; }
      else if (t < 0.62) { dx = lerp(-dir * 8, dir * 16, this.E.out((t - 0.45) / 0.17)); }
      else if (t < 1.0) dx = lerp(dir * 16, 0, (t - 0.62) / 0.38);
      if (t > 1.3) mood = 'evil';
      A[p.id] = { dx, dy, mood };
      // victim: knocked back, dizzy, then cross
      let vx = 0, vy = 0, vm = 'shock', rot = 0;
      if (t > 0.6 && t < 1.25) { const k = (t - 0.6) / 0.65; vx = dir * 18 * Math.sin(k * Math.PI * 0.5); vy = -Math.sin(k * Math.PI) * 14; rot = dir * Math.sin(k * Math.PI) * 0.6; vm = 'dizzy'; }
      else if (t >= 1.25) { vx = dir * 18 * (1 - this.E.out((t - 1.25) / 0.8)); vm = t > 1.6 ? 'angry' : 'dizzy'; }
      A[q.id] = { dx: vx, dy: vy, mood: vm, rot };
      if (t > 0.45 && !A._g) { A._g = true; Sfx.voice(p.id, 'grunt'); }
      if (t > 0.6 && !powFx) { powFx = true; Sfx.punch(); setTimeout(() => Sfx.crowd('ooh'), 250); setTimeout(() => Sfx.voice(q.id, 'ouch'), 60); Render.burstAt({ x: at.x, y: at.y - 8 }, ['#fff', '#ffe680', '#ff6a3d'], 26, { speed: 260, kind: 'spark', size: 3 }); }
      if (t > 1.0 && !coinFx && stole) { coinFx = true; Sfx.coin(); }
      if (t >= len - 0.02) { delete A[p.id]; delete A[q.id]; delete A._g; }
    }, world: true }, true);
    this.lookOff();
  },
  // world-space extras for the punch (drawn by the same timeline, see drawWorldPunch)
  punchFx(p, q, stole) {
    if (this.off()) return;
    const at = this.tokPt(q), a0 = this.tokPt(p), dir = Math.sign(at.x - a0.x) || 1;
    this.play({ len: 3.0, draw: (g, t) => {
      t -= 0.45; if (t < 0) return;
      if (t > 0.5 && t < 0.95) { // fist
        const k = this.E.out((t - 0.5) / 0.15);
        g.save(); g.translate(lerp(a0.x, at.x - dir * 6, k), at.y - 10); g.scale(dir, 1);
        this.icon(g, '👊', 0, 0, 22 * (1 + (1 - k) * 0.5)); g.restore();
      }
      if (t > 0.6 && t < 1.25) { // POW burst
        const k = (t - 0.6) / 0.65, sc = this.E.back(k / 0.35) * (1 - Math.max(0, k - 0.7) / 0.3);
        g.save(); g.translate(at.x + dir * 4, at.y - 30); g.scale(sc, sc); g.rotate(-0.15);
        g.fillStyle = '#ffe14d'; g.strokeStyle = '#d2261b'; g.lineWidth = 2.5; g.beginPath();
        for (let i = 0; i < 20; i++) { const an = i / 20 * Math.PI * 2, r = i % 2 ? 13 : 24; i ? g.lineTo(Math.cos(an) * r, Math.sin(an) * r) : g.moveTo(Math.cos(an) * r, Math.sin(an) * r); }
        g.closePath(); g.fill(); g.stroke();
        g.font = 'bold 13px Georgia'; g.textAlign = 'center'; g.fillStyle = '#d2261b'; g.fillText('POW!', 0, 5);
        g.restore();
      }
      if (t > 0.75 && t < 1.7) { for (let i = 0; i < 3; i++) { const an = t * 7 + i * 2.1; this.icon(g, '⭐', at.x + Math.cos(an) * 14, at.y - 28 + Math.sin(an) * 5, 8); } }
      if (stole && t > 0.9 && t < 2.3) { g.globalAlpha = clamp((2.3 - t) / 0.3, 0, 1); this.word(g, '−1 🪙', at.x + Math.sin(t * 50) * (t < 1.3 ? 3 : 0), at.y - 74, 30, '#ff6b6b'); g.globalAlpha = 1; }
      if (stole && t > 1.0 && t < 2.4) { // a coin arcs from victim to attacker
        const k = this.E.inout(Math.min(1, (t - 1.0) / 0.7)), x = lerp(at.x, a0.x, k), y = lerp(at.y - 20, a0.y - 20, k) - Math.sin(k * Math.PI) * 40;
        this.coin(g, x, y, 6, t * 14);
        if (t > 1.6) { g.globalAlpha = clamp((2.4 - t) / 0.3, 0, 1); this.word(g, '+1 🪙', a0.x, a0.y - 70, 30, '#7cf06a'); g.globalAlpha = 1; }
      }
    } }, true);
  },

  // ---------------------------------------------------------- 5. space effects, drawn on the board where they happen
  async space(p, pos, kind, n) {
    if (this.off()) return;
    const tile = Render.trackPos(pos), tok = () => this.tokPt(p);
    this.lookAt(tile, 2.2);
    await sleep(350);
    const len = { blue: 1.4, red: 1.4, doubler: 1.6, party: 1.8, summon: 1.6, home: 1.2 }[kind] || 1.3;
    await this.play({ len, draw: (g, t) => {
      const T = tok();
      if (kind === 'blue' || kind === 'home' || kind === 'party') { // coins spring up from the tile into you
        for (let i = 0; i < Math.min(8, n || 3); i++) {
          const k = clamp((t - i * 0.08) / 0.7, 0, 1); if (k <= 0 || k >= 1) continue;
          const x = lerp(tile.x + (i - 3.5) * 5, T.x, k), y = lerp(tile.y + 10, T.y - 18, k) - Math.sin(k * Math.PI) * 46;
          this.coin(g, x, y, 5.5, t * 12 + i);
        }
      }
      if (kind === 'red') { // coins tumble out of you and into the hole
        for (let i = 0; i < Math.min(6, n || 3); i++) {
          const k = clamp((t - i * 0.1) / 0.8, 0, 1); if (k <= 0 || k >= 1) continue;
          const x = T.x + (i - 2.5) * 9 * k, y = T.y - 16 + k * k * 46 - Math.sin(k * Math.PI) * 18;
          g.globalAlpha = 1 - k * 0.6; this.coin(g, x, y, 5, t * 10 + i); g.globalAlpha = 1;
        }
        const k = clamp(t / 0.4, 0, 1);
        g.strokeStyle = 'rgba(40,0,0,0.75)'; g.lineWidth = 1.8; g.beginPath(); g.moveTo(tile.x - 14 * k, tile.y - 6); g.lineTo(tile.x - 3, tile.y + 3); g.lineTo(tile.x + 6 * k, tile.y - 2); g.lineTo(tile.x + 15 * k, tile.y + 8 * k); g.stroke();
      }
      if (kind === 'doubler') { // golden fountain
        for (let i = 0; i < 14; i++) { const ph = (t * 1.4 + i / 14) % 1, an = -Math.PI / 2 + (i % 7 - 3) * 0.16; const x = tile.x + Math.cos(an) * ph * 70, y = tile.y + Math.sin(an) * ph * 110 + ph * ph * 90; g.fillStyle = `rgba(255,${200 + (i % 3) * 20},80,${1 - ph})`; g.beginPath(); g.arc(x, y, 3 + (i % 3), 0, 7); g.fill(); }
        this.word(g, '×2', tile.x, tile.y - 70 - t * 10, 26 * this.E.back(t / 0.4), '#ffe680');
      }
      if (kind === 'party') for (let i = 0; i < 24; i++) { const ph = (t * 0.7 + i / 24) % 1; g.fillStyle = ['#ff6a8a', '#5fb8ff', '#ffd34d', '#6fdc8c'][i % 4]; g.save(); g.translate(tile.x + Math.sin(i * 7.3) * 90 * ph, tile.y - 90 + ph * 120); g.rotate(t * 6 + i); g.fillRect(-3, -1.5, 6, 3); g.restore(); }
      if (kind === 'summon') { for (let i = 0; i < 3; i++) { g.strokeStyle = `rgba(180,107,255,${0.8 - i * 0.2})`; g.lineWidth = 3; g.beginPath(); g.arc(tile.x, tile.y, 10 + ((t * 40 + i * 18) % 60), t * 4 + i, t * 4 + i + 4); g.stroke(); } }
    } }, true);
    this.lookOff();
  },
  // the Eclipse: the sky goes dark, then the camera visits each place as its shutters slam down
  async eclipse(spots) {
    if (this.off()) return;
    await this.play({ len: 1.4, draw: (g, t) => {
      const a = this.fade(t, 1.4, 0.3, 0.35), k = this.E.inout(t / 1.1);
      g.save(); g.globalAlpha = a; this.dim(g, 0.55);
      g.fillStyle = '#ffd34d'; g.shadowColor = '#ffb030'; g.shadowBlur = 60; g.beginPath(); g.arc(800, 360, 90, 0, 7); g.fill(); g.shadowBlur = 0;
      g.fillStyle = '#0b0820'; g.beginPath(); g.arc(800 - 200 + 200 * k, 360 - 10 + 10 * k, 92, 0, 7); g.fill();
      if (k > 0.95) { g.strokeStyle = 'rgba(255,230,160,0.9)'; g.lineWidth = 5; g.beginPath(); g.arc(800, 360, 94, 0, 7); g.stroke(); }
      this.icon(g, '🌑', 800, 560, 54);
      g.restore();
    } });
    for (const pos of spots) {
      Render.shut[pos] = this.now();
      Sfx.boom();
      await this.look(Render.trackPos(pos), 900, 2.4);
    }
  },
  // a new item arrives: it pops out above the token and drops into the bag
  gain(p, icon) {
    if (this.off()) return Promise.resolve();
    return this.play({ len: 1.15, draw: (g, t) => {
      const T = this.tokPt(p), k = this.E.back(t / 0.35), d = clamp((t - 0.7) / 0.4, 0, 1);
      const y = T.y - 44 - (1 - d) * 6 + d * d * 30, sz = 22 * k * (1 - d * 0.7);
      g.save(); g.globalAlpha = 1 - d * 0.6;
      g.fillStyle = 'rgba(255,240,180,0.35)'; g.beginPath(); g.arc(T.x, y, sz * 0.9, 0, 7); g.fill();
      this.icon(g, icon, T.x, y, sz); g.restore();
      if (t > 0.69 && t < 0.72) Sfx.tone(990, 0.08, 'triangle', 0.05);
    } }, true);
  },
  // coins flying between a player and somewhere (shop counter, another player)
  // coins fly from A to B; with labels, the loser gets a bold red −n and the gainer a bold green +n
  coinsTo(from, to, n = 5, lab) {
    if (this.off()) return Promise.resolve();
    if (lab && n > 0) this.lossGain(from, to, n, lab);
    return this.play({ len: 0.9 + n * 0.05, draw: (g, t) => {
      const A = typeof from === 'function' ? from() : from, B = typeof to === 'function' ? to() : to;
      for (let i = 0; i < n; i++) { const k = clamp((t - i * 0.05) / 0.75, 0, 1); if (k <= 0 || k >= 1) continue; this.coin(g, lerp(A.x, B.x, this.E.inout(k)), lerp(A.y, B.y, this.E.inout(k)) - Math.sin(k * Math.PI) * 60, 9, t * 12 + i); }
    } });
  },

  lossGain(from, to, n, lab) {
    Sfx.bad();
    const len = 2.6 + n * 0.05;
    this.play({ len, draw: (g, t) => {
      const A = typeof from === 'function' ? from() : from, B = typeof to === 'function' ? to() : to;
      const tag = (P, txt, sub, col, delay, dir) => {
        const k = t - delay; if (k < 0) return;
        const pop = k < 0.2 ? 0.4 + this.E.back(k / 0.2) * 0.6 : 1, a = clamp((len - t) / 0.4, 0, 1), shake = dir < 0 && k < 0.5 ? Math.sin(k * 60) * 4 : 0;
        g.save(); g.globalAlpha = a; g.translate(P.x + shake, P.y - 70 - Math.min(1, k) * 18 * dir); g.scale(pop, pop);
        g.fillStyle = dir < 0 ? 'rgba(90,10,20,0.85)' : 'rgba(10,60,20,0.85)'; this.rrect(g, -78, -40, 156, 66, 18); g.fill();
        g.strokeStyle = col; g.lineWidth = 4; g.stroke();
        this.word(g, txt, 0, 6, 38, col); this.word(g, sub, 0, 22, 14, '#fff');
        g.restore();
      };
      tag(A, `−${n} 🪙`, lab.lose ? `${lab.lose} loses` : 'lost', '#ff6b6b', 0, -1);
      tag(B, `+${n} 🪙`, lab.gain ? `${lab.gain} gains` : 'gained', '#7cf06a', 0.75, 1);
    } }, true);
  },

  // ---------------------------------------------------------- minigame podium: 1st +3, 2nd +2, 3rd +1
  podium(places) {
    Sfx.crowd('cheer');
    const len = 3.4, H = { 1: 170, 2: 120, 3: 80, 4: 0 }, X = { 1: 800, 2: 610, 3: 990, 4: 1180 };
    const order = places.slice().sort((a, b) => a.place - b.place);
    const used = {};
    order.forEach(r => { const k = used[r.place] || 0; used[r.place] = k + 1; r.x = (r.place === 4 ? 1220 : X[r.place]) + k * 70 - (places.filter(q => q.place === r.place).length - 1) * 35; });
    let ding = 0;
    return this.play({ len, draw: (g, t) => {
      const a = this.fade(t, len, 0.3, 0.35); g.save(); g.globalAlpha = a; this.dim(g, 0.6);
      this.word(g, 'Moot results', 800, 190, 44, '#fff6d0');
      [2, 1, 3].forEach(pl => {
        const h = H[pl] * this.E.back((t - 0.1 * pl) / 0.5), x = X[pl], y = 700;
        if (h <= 1) return;
        const gr = g.createLinearGradient(0, y - h, 0, y); gr.addColorStop(0, ['#ffe680', '#dfe6f0', '#e0a070'][pl - 1]); gr.addColorStop(1, ['#b8862a', '#8a95a8', '#8a5a32'][pl - 1]);
        g.fillStyle = gr; this.rrect(g, x - 85, y - h, 170, h, 10); g.fill();
        g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x - 85, y - 12, 170, 12);
        this.word(g, String(pl), x, y - h + 56, 46, '#fff');
      });
      order.forEach((r, k) => {
        const h = H[r.place] || 0, y = 700 - h - 50 + (r.place === 4 ? 0 : -Math.abs(Math.sin(t * 6 + k)) * (r.place === 1 ? 14 : 6));
        const mood = r.place === 1 ? 'cheer' : r.place === 4 ? 'sad' : 'happy';
        Char.draw(g, r.x, y, r.place === 1 ? 52 : 42, r.p.id, r.p.color, { mood, seed: r.p.id, look: { x: 0, y: -0.2 } });
        if (r.coins && t > 1.0 + k * 0.2) { const kk = this.E.back((t - 1.0 - k * 0.2) / 0.4); g.save(); g.translate(r.x, y - 110); g.scale(kk, kk); this.coin(g, -26, 0, 15, t * 4); this.word(g, '+' + r.coins, 18, 12, 34, '#ffe680'); g.restore(); if (ding <= k) { ding = k + 1; Sfx.coin(); } }
      });
      g.restore();
    } });
  },

  // ---------------------------------------------------------- 6. the pedlar's stall (Counting House shop)
  openShop(p, wares) { if (this.off()) return; this.shop = { p, wares, t0: this.now() }; },
  closeShop() { this.shop = null; },
  shopSlot(i, n) { return { x: 800 + (i - (n - 1) / 2) * 150, y: 600 }; },
  drawShop(g) {
    const S = this.shop, t = this.now() - S.t0, p = S.p, n = S.wares.length;
    const k = this.E.back(t / 0.45), x0 = 800 - Math.max(420, n * 80 + 150), x1 = 1600 - x0, top = 470;
    g.save(); g.translate(800, 900); g.scale(1, k); g.translate(-800, -900);
    g.fillStyle = 'rgba(6,4,16,0.35)'; g.fillRect(0, 0, 1600, 900);
    // stall: posts, awning, counter
    g.fillStyle = '#6b4325'; g.fillRect(x0 + 6, top, 16, 270); g.fillRect(x1 - 22, top, 16, 270);
    g.fillStyle = '#2b1a3e'; this.rrect(g, x0 + 18, top + 38, x1 - x0 - 36, 230, 12); g.fill();
    for (let i = 0; i < 12; i++) { const w = (x1 - x0 + 40) / 12, x = x0 - 20 + i * w; g.fillStyle = i % 2 ? '#fff4dd' : p.color; g.beginPath(); g.moveTo(x, top - 30); g.lineTo(x + w, top - 30); g.lineTo(x + w, top + 18); g.arc(x + w / 2, top + 18, w / 2, 0, Math.PI); g.closePath(); g.fill(); }
    g.fillStyle = '#8a5a32'; this.rrect(g, x0 - 10, top + 222, x1 - x0 + 20, 40, 8); g.fill(); g.fillStyle = '#a8703f'; g.fillRect(x0 - 10, top + 222, x1 - x0 + 20, 8);
    // the pedlar
    const bob = Math.sin(t * 3) * 3;
    Char.draw(g, x1 - 74, top + 160 + bob, 40, -1, '#8f6fd8', { mood: 'happy', seed: 3, look: { x: -0.7, y: 0 }, noFeet: true });
    g.fillStyle = '#5a3a8a'; g.beginPath(); g.ellipse(x1 - 74, top + 118 + bob, 42, 16, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(x1 - 104, top + 118 + bob); g.lineTo(x1 - 70, top + 52 + bob); g.lineTo(x1 - 44, top + 118 + bob); g.fill();
    // wares
    S.wares.forEach((w, i) => {
      const c = this.shopSlot(i, n), hop = w.state === 'ok' ? Math.sin(t * 3 + i) * 4 : 0;
      g.save(); g.globalAlpha = w.state === 'gone' ? 0 : w.state === 'ok' ? 1 : 0.45;
      g.fillStyle = 'rgba(255,255,255,0.08)'; this.rrect(g, c.x - 62, c.y - 112, 124, 150, 14); g.fill();
      g.strokeStyle = w.star ? '#ffd34d' : 'rgba(255,255,255,0.3)'; g.lineWidth = w.star ? 3 : 1.5; g.stroke();
      if (w.star) this.rays(g, c.x, c.y - 52 + hop, 70, 'rgba(255,230,120,0.12)', t, 10);
      this.icon(g, w.icon, c.x, c.y - 52 + hop, 58);
      this.word(g, w.name, c.x, c.y + 4, 15, '#fff', 118);
      this.coin(g, c.x - 22, c.y + 24, 9, 0); this.word(g, String(w.price), c.x + 6, c.y + 31, 20, '#ffe680');
      if (w.state === 'sold') { g.save(); g.translate(c.x, c.y - 40); g.rotate(-0.25); g.strokeStyle = '#ff4d6d'; g.lineWidth = 4; this.rrect(g, -50, -18, 100, 36, 6); g.stroke(); g.globalAlpha = 1; this.word(g, 'SOLD', 0, 10, 24, '#ff4d6d'); g.restore(); }
      g.restore();
    });
    // the shopper
    Char.draw(g, x0 + 70, top + 175, 44, p.id, p.color, { mood: 'happy', seed: p.id, look: { x: 0.8, y: 0 }, noFeet: true });
    this.coin(g, x0 + 46, top + 240, 10, t * 2); this.word(g, String(S.money !== undefined ? S.money() : p.cash), x0 + 86, top + 248, 22, '#ffe680');
    g.restore();
  },
  // a bought ware flies from the counter into the player's token
  async buy(i) {
    const S = this.shop; if (this.off() || !S) return;
    const w = S.wares[i], c = this.shopSlot(i, S.wares.length), p = S.p;
    w.state = 'gone'; Sfx.coin();
    await this.play({ len: 1.1, draw: (g, t) => {
      const k = this.E.inout(t / 1.0), T = this.scr(this.tokPt(p));
      const x = lerp(c.x, T.x, k), y = lerp(c.y - 52, T.y - 20, k) - Math.sin(k * Math.PI) * 180;
      g.save(); g.globalAlpha = 1 - Math.max(0, k - 0.85) / 0.15; this.icon(g, w.icon, x, y, lerp(70, 30, k)); g.restore();
      if (t < 0.5) { const b = this.E.back(t / 0.3); this.word(g, '−' + w.price, c.x, c.y - 120 - t * 30, 26 * b, '#ffe680'); }
    } });
    if (w.star) Sfx.star();
    w.state = w.keep ? 'ok' : 'sold';
  },
  rrect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); },
};
