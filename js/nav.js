'use strict';
// Gamepad (any pad) and keyboard navigation for menus, help, map and board prompts.
// D-pad / stick / arrows move a highlight; A / Enter selects; B / Esc goes back;
// Y toggles the map; X toggles help; A also stops a tumbling die.
const Nav = {
  sel: null, active: false, prev: {}, rep: {},
  // the seat that owns the current board decision, or null when anyone may act (menus, help, map)
  ownerOnly() {
    if (UI.helpOpen() || Render.mapMode) return null;
    const ov = document.getElementById('overlay');
    if (ov.innerHTML.trim() && !ov.classList.contains('hidden')) return null;
    if (Render.stopper) return Render.stopper.who;
    if (Render.die && Render.die.onStop) return Render.die.who;
    return UI.askPlayer !== undefined && UI.askPlayer !== null ? UI.askPlayer : null;
  },
  init() {
    window.addEventListener('keydown', e => {
      if (!this.boardContext()) return;
      const t = document.activeElement && document.activeElement.tagName;
      if (t === 'INPUT') return;
      const map = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', Enter: 'a' };
      const k = map[e.code]; if (!k) return;
      e.preventDefault();
      this.handle(k);
    });
    window.addEventListener('mousemove', () => { if (this.active) { this.active = false; this.paint(); } });
    const loop = () => { try { this.poll(); } catch (err) { console.error(err); } requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  },
  // true when no minigame is on screen
  boardContext() { return document.getElementById('mgLayer').classList.contains('hidden'); },
  container() {
    if (UI.helpOpen()) return document.getElementById('helpOv');
    const ov = document.getElementById('overlay');
    if (ov.innerHTML.trim() && !ov.classList.contains('hidden')) return ov;
    if (Render.mapMode) return null;
    return document.getElementById('actOpts');
  },
  items() {
    const c = this.container(); if (!c) return [];
    return [...c.querySelectorAll('button:not([disabled]), select')].filter(el => el.offsetParent !== null);
  },
  poll() {
    if (!this.boardContext()) return;
    const pads = Input.pads();
    // on a board decision only the deciding player's own gamepad may act (help/map work from any pad)
    const owner = this.ownerOnly();
    pads.forEach((p, idx) => {
      const b = n => p.buttons[n] && p.buttons[n].pressed;
      const ax = p.axes[0] || 0, ay = p.axes[1] || 0;
      const now = {};
      if (b(12) || ay < -0.5) now.up = true; if (b(13) || ay > 0.5) now.down = true;
      if (b(14) || ax < -0.5) now.left = true; if (b(15) || ax > 0.5) now.right = true;
      if (b(0)) now.a = true; if (b(1)) now.b = true; if (b(2)) now.x = true; if (b(3)) now.y = true; if (b(4) || b(6)) now.v = true;
      const prev = this.prev[idx] || {};
      const mine = owner === null || Input.seatForPad(idx) === owner;
      for (const k of ['up', 'down', 'left', 'right', 'a', 'b', 'x', 'y', 'v']) {
        if (!mine && k !== 'x' && k !== 'y' && k !== 'v') continue;
        if (now[k] && !prev[k]) { this.handle(k); this.rep[idx] = 0.4; }
        else if (now[k] && ['up', 'down', 'left', 'right'].includes(k)) { this.rep[idx] = (this.rep[idx] || 0) - 1 / 60; if (this.rep[idx] <= 0) { this.handle(k); this.rep[idx] = 0.12; } }
      }
      this.prev[idx] = now;
    });
    if (this.sel && !document.body.contains(this.sel)) this.sel = null;
    if (this.active && !this.sel) { const l = this.items(); this.sel = l.find(x => x.classList.contains('rollBtn')) || l[0] || null; }
    if (this.active) this.paint();
  },
  handle(k) {
    if (k === 'v') { if (UI.game) Render.toggleZoom(); return; }
    if (k === 'y') { if (UI.game) UI.toggleMap(); return; }
    if (k === 'x') { UI.toggleHelp(); return; }
    if (k === 'b') {
      if (UI.helpOpen()) return UI.toggleHelp(false);
      if (Render.mapMode) return UI.toggleMap(false);
      const back = this.items().find(el => el.dataset.back);
      if (back) back.click();
      return;
    }
    if (k === 'a' && Render.stopper) { Render.stopper.onStop(); return; }
    if (k === 'a' && Render.die && Render.die.onStop) { Render.die.onStop(); return; }
    if (Render.mapMode) { if (k === 'a') UI.toggleMap(false); return; }
    const list = this.items(); if (!list.length) return;
    this.active = true;
    if (!this.sel || !list.includes(this.sel)) { this.sel = list[0]; if (k !== 'a') { this.paint(); return; } }
    if (k === 'a') {
      const el = this.sel;
      if (el.tagName === 'SELECT') { el.selectedIndex = (el.selectedIndex + 1) % el.options.length; el.dispatchEvent(new Event('change')); }
      else { Sfx.click(); el.click(); }
      this.sel = null;
      setTimeout(() => { if (this.active) { const l = this.items(); this.sel = l.find(x => x.classList.contains('on')) || l[0] || null; this.paint(); } }, 30);
      return;
    }
    // spatial move
    const r0 = this.sel.getBoundingClientRect(), cx = r0.left + r0.width / 2, cy = r0.top + r0.height / 2;
    const dir = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[k];
    let best = null, bs = 1e9;
    for (const el of list) {
      if (el === this.sel) continue;
      const r = el.getBoundingClientRect(), dx = r.left + r.width / 2 - cx, dy = r.top + r.height / 2 - cy;
      const along = dx * dir[0] + dy * dir[1]; if (along <= 2) continue;
      const across = Math.abs(dx * dir[1] - dy * dir[0]);
      const score = along + across * 2.5;
      if (score < bs) { bs = score; best = el; }
    }
    if (!best) { const i = list.indexOf(this.sel); best = list[(i + (k === 'up' || k === 'left' ? -1 : 1) + list.length) % list.length]; }
    this.sel = best; Sfx.tone(520, 0.03, 'triangle', 0.03); this.paint();
  },
  focusFirst(q) { const el = q && document.querySelector(q); this.sel = el || null; this.paint(); },
  paint() {
    document.querySelectorAll('.navsel').forEach(el => { if (el !== this.sel || !this.active) el.classList.remove('navsel'); });
    if (this.active && this.sel) { this.sel.classList.add('navsel'); this.sel.scrollIntoView({ block: 'nearest' }); }
  },
};
