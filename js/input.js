'use strict';
// Four-player input: shared keyboard + up to 4 gamepads + mouse (player 1 cursor).
// Every seat has: stick/d-pad, A, B, X, Y, LB, RB, LT, RT, Start, Select.
// Controls can be re-assigned per seat in Settings ▸ Controls (saved in this browser).
const Input = {
  keys: new Set(),
  ACTIONS: ['up', 'down', 'left', 'right', 'a', 'b', 'x', 'y', 'lb', 'rb', 'lt', 'rt', 'start', 'select'],
  DEF_KEYS: [
    { up: ['KeyW'], down: ['KeyS'], left: ['KeyA'], right: ['KeyD'], a: ['KeyQ', 'Space'], b: ['KeyE'], x: ['KeyZ'], y: ['KeyC'], lb: ['Digit1'], rb: ['Digit2'], lt: ['Digit3'], rt: ['Digit4'], start: ['Tab'], select: ['KeyX'] },
    { up: ['KeyT'], down: ['KeyG'], left: ['KeyF'], right: ['KeyH'], a: ['KeyR'], b: ['KeyY'], x: ['KeyB'], y: ['KeyN'], lb: ['Digit5'], rb: ['Digit6'], lt: ['Digit7'], rt: ['Digit8'], start: ['KeyV'], select: ['KeyV'] },
    { up: ['KeyI'], down: ['KeyK'], left: ['KeyJ'], right: ['KeyL'], a: ['KeyU'], b: ['KeyO'], x: ['Comma'], y: ['Period'], lb: ['Digit9'], rb: ['Digit0'], lt: ['Minus'], rt: ['Equal'], start: ['KeyM'], select: ['KeyM'] },
    { up: ['ArrowUp'], down: ['ArrowDown'], left: ['ArrowLeft'], right: ['ArrowRight'], a: ['Enter', 'Numpad0'], b: ['ShiftRight', 'NumpadDecimal'], x: ['Numpad1'], y: ['Numpad2'], lb: ['Numpad4'], rb: ['Numpad5'], lt: ['Numpad7'], rt: ['Numpad8'], start: ['Backspace'], select: ['Backspace'] },
  ],
  DEF_PAD: { a: 0, b: 1, x: 2, y: 3, lb: 4, rb: 5, lt: 6, rt: 7, select: 8, start: 9 },
  maps: null, padMaps: null,
  keyNames: [
    'W A S D · A = Q / Space · B = E · X = Z · Y = C · LB/RB = 1/2',
    'T F G H · A = R · B = Y · X = B · Y = N · LB/RB = 5/6',
    'I J K L · A = U · B = O · X = , · Y = . · LB/RB = 9/0',
    'Arrows · A = Enter · B = Right Shift · X/Y = Num1/Num2',
  ],
  mouse: { x: 0, y: 0, down: false, moved: false, canvas: null },
  init() {
    this.loadControls();
    window.addEventListener('keydown', e => {
      this.keys.add(e.code); if (!e.repeat) this.lastKey = e.code;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab'].includes(e.code) && document.activeElement && document.activeElement.tagName !== 'INPUT') e.preventDefault();
    });
    window.addEventListener('keyup', e => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());
  },
  // ---- custom controls
  loadControls() {
    this.maps = this.DEF_KEYS.map(m => JSON.parse(JSON.stringify(m)));
    this.padMaps = [0, 1, 2, 3].map(() => Object.assign({}, this.DEF_PAD));
    try {
      const c = JSON.parse(localStorage.getItem('ff_controls') || 'null');
      if (c && c.keys) c.keys.forEach((m, i) => { if (m) Object.assign(this.maps[i], m); });
      if (c && c.pads) c.pads.forEach((m, i) => { if (m) Object.assign(this.padMaps[i], m); });
    } catch (e) { /* defaults */ }
    this.maps.forEach(m => { m.skip = [...(m.select || []), ...(m.start || [])]; });
  },
  saveControls() {
    try { localStorage.setItem('ff_controls', JSON.stringify({ keys: this.maps.map(m => { const o = {}; this.ACTIONS.forEach(k => { o[k] = m[k]; }); return o; }), pads: this.padMaps })); } catch (e) { /* private mode */ }
    this.maps.forEach(m => { m.skip = [...(m.select || []), ...(m.start || [])]; });
  },
  resetControls(i) { this.maps[i] = JSON.parse(JSON.stringify(this.DEF_KEYS[i])); this.padMaps[i] = Object.assign({}, this.DEF_PAD); this.saveControls(); },
  keyLabel(code) { return String(code || '—').replace(/^Key/, '').replace(/^Digit/, '').replace(/^Arrow/, '').replace(/^Numpad/, 'Num ').replace('ShiftRight', 'R-Shift').replace('Space', 'Space'); },
  PADNAMES: ['A', 'B', 'X', 'Y', 'LB', 'RB', 'LT', 'RT', 'Select', 'Start', 'L-Stick', 'R-Stick', 'D-Up', 'D-Down', 'D-Left', 'D-Right', 'Home'],

  bindMouse(canvas, w, h) {
    this.mouse.canvas = canvas;
    const upd = e => {
      const r = canvas.getBoundingClientRect();
      this.mouse.x = (e.clientX - r.left) / r.width * w;
      this.mouse.y = (e.clientY - r.top) / r.height * h;
      this.mouse.moved = true;
    };
    canvas.addEventListener('mousemove', upd);
    canvas.addEventListener('mousedown', e => { upd(e); this.mouse.down = true; });
    window.addEventListener('mouseup', () => { this.mouse.down = false; });
  },
  // Each seat is played with its own keyboard keys and/or one gamepad (chosen on the character select screen).
  humanSeats: [0, 1, 2, 3], padOf: [null, null, null, null],
  setHumans(seats) {
    this.humanSeats = seats.map((s, i) => s.human ? i : -1).filter(i => i >= 0);
    const chosen = seats.map((s, i) => s.human && s.pad !== undefined && s.pad !== null && s.pad !== 'auto' ? +s.pad : null);
    const used = new Set(chosen.filter(x => x !== null && x >= 0));
    let next = 0;
    this.padOf = seats.map((s, i) => {
      if (!s.human) return null;
      if (chosen[i] !== null) return chosen[i] >= 0 && !(chosen.indexOf(chosen[i]) < i) ? chosen[i] : null; // -1 = keyboard only
      while (used.has(next)) next++;
      used.add(next); return next++;
    });
  },
  pads() { const list = []; const all = navigator.getGamepads ? navigator.getGamepads() : []; for (const p of all) if (p && p.connected) list.push(p); return list; },
  seatForPad(k) { const i = this.padOf.indexOf(k); return i >= 0 ? i : null; },
  padNumberForSeat(i) { const k = this.padOf[i]; return k !== null && k !== undefined ? k + 1 : null; },
  pad(i) { const k = this.padOf[i]; return k !== null && k !== undefined ? (this.pads()[k] || null) : null; },
  // raw reading of one gamepad with a seat's button map (used by menus before seats are assigned too)
  padState(p, pm = this.DEF_PAD) {
    const s = { up: false, down: false, left: false, right: false, a: false, b: false, x: false, y: false, lb: false, rb: false, lt: false, rt: false, start: false, select: false, ax: 0, ay: 0, rx: 0, ry: 0 };
    if (!p) return s;
    const ax = p.axes[0] || 0, ay = p.axes[1] || 0, b = n => !!(p.buttons[n] && (p.buttons[n].pressed || p.buttons[n].value > 0.5));
    s.left = ax < -0.4 || b(14); s.right = ax > 0.4 || b(15); s.up = ay < -0.4 || b(12); s.down = ay > 0.4 || b(13);
    for (const k of ['a', 'b', 'x', 'y', 'lb', 'rb', 'lt', 'rt', 'start', 'select']) s[k] = b(pm[k]);
    if (Math.abs(ax) > 0.2) s.ax = ax; if (Math.abs(ay) > 0.2) s.ay = ay;
    s.rx = Math.abs(p.axes[2] || 0) > 0.25 ? p.axes[2] : 0; s.ry = Math.abs(p.axes[3] || 0) > 0.25 ? p.axes[3] : 0;
    return s;
  },
  keyState(i) {
    const m = this.maps[i], k = arr => !!arr && arr.some(c => this.keys.has(c)), s = {};
    for (const a of this.ACTIONS) s[a] = k(m[a]);
    return s;
  },
  state(i) {
    const s = this.keyState(i);
    s.ax = 0; s.ay = 0; s.skip = s.start || s.select;
    const p = this.pad(i);
    if (p) {
      const ps = this.padState(p, this.padMaps[i]);
      for (const a of this.ACTIONS) s[a] = s[a] || ps[a];
      if (ps.x || ps.y) { s.padSkip = true; s.skip = true; } // X / Y can also end a practice round
      if (ps.start || ps.select) s.skip = true;
      s.ax = ps.ax; s.ay = ps.ay; s.rx = ps.rx; s.ry = ps.ry;
    }
    if (!s.ax) s.ax = (s.right ? 1 : 0) - (s.left ? 1 : 0);
    if (!s.ay) s.ay = (s.down ? 1 : 0) - (s.up ? 1 : 0);
    return s;
  },
  anyAction() {
    for (let i = 0; i < 4; i++) { const s = this.state(i); if (s.a) return true; }
    return false;
  },
};
