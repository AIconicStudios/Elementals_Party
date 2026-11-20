'use strict';
// Gamepad (any pad) and keyboard navigation for menus, help, map and board prompts.
// D-pad / stick / arrows move a highlight; A / Enter selects; B / Esc goes back;
// Y toggles the map; X toggles help; A also stops a tumbling die.
const Nav = {
  sel: null, active: false, prev: {}, rep: {},
  // the seat that owns the current board decision, or null when anyone may act (menus, help, map)
  ownerOnly() {
    if (UI.pauseOpen()) return 'any';
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
  // the pad that drives menus: the first human seat's own gamepad if it is connected, otherwise the first pad
  menuPad(n) {
    const first = Input.humanSeats && Input.humanSeats.length ? Input.padOf[Input.humanSeats[0]] : null;
    return first !== null && first !== undefined && first >= 0 && first < n ? first : 0;
  },
  // true when no minigame is on screen
  boardContext() { return document.getElementById('mgLayer').classList.contains('hidden'); },
  container() {
    if (UI.pauseOpen()) return document.getElementById('boardPause');
    if (UI.helpOpen()) return document.getElementById('helpOv');
    const ov = document.getElementById('overlay');
    if (ov.innerHTML.trim() && !ov.classList.contains('hidden')) return ov;
    if (Render.mapMode) return null;
    return document.getElementById('actOpts');
  },
  items() {
    const c = this.container(); if (!c) return [];
    return [...c.querySelectorAll('button:not([disabled]), select:not([disabled]), input[type=checkbox]')].filter(el => el.offsetParent !== null);
  },
  poll() {
    if (!this.boardContext()) return;
    const pads = Input.pads();
    // on a board decision only the deciding player's own gamepad may act (help/map work from any pad)
    const owner = this.ownerOnly();
    pads.forEach((p, idx) => {
      // right analog stick scrolls help, the map and any long menu page
      const ry = p.axes[3] || 0; if (Math.abs(ry) > 0.25) this.stickScroll(Math.sign(ry) * (Math.abs(ry) - 0.2) * 22);
      const b = n => p.buttons[n] && p.buttons[n].pressed;
      const ax = p.axes[0] || 0, ay = p.axes[1] || 0;
      const now = {};
      if (b(12) || ay < -0.5) now.up = true; if (b(13) || ay > 0.5) now.down = true;
      if (b(14) || ax < -0.5) now.left = true; if (b(15) || ax > 0.5) now.right = true;
      if (b(0)) now.a = true; if (b(1)) now.b = true; if (b(2)) now.x = true; if (b(3)) now.y = true; if (b(4) || b(6)) now.v = true; if (b(9)) now.start = true;
      const prev = this.prev[idx] || {};
      // menus, help and map belong to gamepad 1 (and the keyboard); a board decision belongs to its player's own pad;
      // the pause menu answers to any pad, and any pad's Start can pause
      const menuPad = this.menuPad(pads.length);
      const ownerPad = owner !== null && owner !== 'any' ? Input.padOf[owner] : null;
      const ownerHasPad = ownerPad !== null && ownerPad !== undefined && ownerPad < pads.length;
      const mine = owner === 'any' || (owner === null ? idx === menuPad : ownerHasPad ? Input.seatForPad(idx) === owner : idx === menuPad);
      const lead = idx === menuPad || owner === 'any' || (owner !== null && Input.seatForPad(idx) === owner);
      for (const k of ['up', 'down', 'left', 'right', 'a', 'b', 'x', 'y', 'v', 'start']) {
        if (k === 'start') { if (now.start && !prev.start) this.handle('start'); continue; }
        if (['x', 'y', 'v'].includes(k) ? !lead : !mine) continue;
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
    if (k === 'start') { if (UI.game && !UI.helpOpen() && !Render.mapMode) UI.togglePause(); return; }
    if (UI.pauseOpen()) { if (k === 'b') return UI.togglePause(false); if (!['up', 'down', 'left', 'right', 'a'].includes(k)) return; }
    if (k === 'v') { if (UI.game) Render.toggleZoom(); return; }
    if (k === 'y') { if (UI.game) UI.toggleMap(); return; }
    if (k === 'x') { UI.toggleHelp(); return; }
    // help: LEFT / RIGHT flip between the tabs, UP / DOWN scroll the page, A or B closes
    if (UI.helpOpen() && k !== 'b') {
      if (k === 'left' || k === 'right') {
        const tabs = [...document.querySelectorAll('#helpOv [data-tab]')], cur = tabs.findIndex(t => t.classList.contains('on'));
        const nx = tabs[(Math.max(0, cur) + (k === 'left' ? tabs.length - 1 : 1)) % tabs.length]; if (nx) { nx.click(); Sfx.tone(520, 0.03, 'triangle', 0.03); }
        this.active = true; this.sel = document.querySelector('#helpOv [data-tab].on'); this.paint();
      } else if (k === 'up' || k === 'down') this.stickScroll(k === 'up' ? -90 : 90);
      else if (k === 'a') UI.toggleHelp(false);
      return;
    }
    if (k === 'b') {
      if (UI.helpOpen()) return UI.toggleHelp(false);
      if (Render.mapMode) return UI.toggleMap(false);
      const back = this.items().find(el => el.dataset.back);
      if (back) back.click();
      return;
    }
    if (k === 'a' && Render.stopper) { Render.stopper.onStop(); return; }
    if (k === 'a' && Render.die && Render.die.onStop) { Render.die.onStop(); return; }
    if (Render.mapMode) {
      if (k === 'a') UI.toggleMap(false);
      else if (k === 'up' || k === 'down') Render.mapScroll(k === 'up' ? -60 : 60);
      else if (k === 'left' || k === 'right') { Render.mapSel = ((Render.mapSel || 0) + (k === 'left' ? 3 : 1)) % 4; Sfx.tone(520, 0.03, 'triangle', 0.03); }
      return;
    }
    const list = this.items(); if (!list.length) return;
    this.active = true;
    if (!this.sel || !list.includes(this.sel)) { this.sel = list[0]; if (k !== 'a') { this.paint(); return; } }
    if (k === 'a') {
      const el = this.sel;
      if (el.tagName === 'INPUT') { el.checked = !el.checked; el.dispatchEvent(new Event('change')); Sfx.click(); }
      else if (el.tagName === 'SELECT') { el.selectedIndex = (el.selectedIndex + 1) % el.options.length; el.dispatchEvent(new Event('change')); }
      else { Sfx.click(); el.click(); }
      this.sel = null;
      setTimeout(() => { if (this.active) { const l = this.items(); this.sel = l.find(x => x.classList.contains('on')) || l[0] || null; this.paint(); } }, 30);
      return;
    }
    // in a plain vertical list (turn menu, shop, item picks) UP / DOWN simply step to the previous / next entry
    if ((k === 'up' || k === 'down') && this.sel.parentElement && this.sel.parentElement.id === 'actOpts') {
      const i = list.indexOf(this.sel), j = i + (k === 'up' ? -1 : 1);
      if (j >= 0 && j < list.length) { this.sel = list[j]; Sfx.tone(520, 0.03, 'triangle', 0.03); this.paint(); return; }
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
  stickScroll(dy) {
    if (Render.mapMode) { Render.mapScroll(dy); return; }
    const c = UI.helpOpen() ? document.getElementById('helpOv') : this.container(); if (!c) return;
    const all = [c, ...c.querySelectorAll('*')].filter(el => el.scrollHeight > el.clientHeight + 4 && /(auto|scroll)/.test(getComputedStyle(el).overflowY));
    if (all[0]) all[0].scrollTop += dy;
  },
  focusFirst(q) { const el = q && document.querySelector(q); this.sel = el || null; this.paint(); },
  paint() {
    document.querySelectorAll('.navsel').forEach(el => { if (el !== this.sel || !this.active) el.classList.remove('navsel'); });
    if (this.active && this.sel) { this.sel.classList.add('navsel'); this.sel.scrollIntoView({ block: 'nearest' }); }
  },
};
