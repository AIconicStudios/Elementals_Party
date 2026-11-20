'use strict';
// Four-player input: shared keyboard + up to 4 gamepads + mouse (player 1 cursor)
const Input = {
  keys: new Set(),
  maps: [
    { up: ['KeyW'], down: ['KeyS'], left: ['KeyA'], right: ['KeyD'], a: ['KeyQ', 'Space'], b: ['KeyE'], skip: ['KeyX'] },
    { up: ['KeyT'], down: ['KeyG'], left: ['KeyF'], right: ['KeyH'], a: ['KeyR'], b: ['KeyY'], skip: ['KeyV'] },
    { up: ['KeyI'], down: ['KeyK'], left: ['KeyJ'], right: ['KeyL'], a: ['KeyU'], b: ['KeyO'], skip: ['KeyM'] },
    { up: ['ArrowUp'], down: ['ArrowDown'], left: ['ArrowLeft'], right: ['ArrowRight'], a: ['Enter', 'Numpad0'], b: ['ShiftRight', 'NumpadDecimal'], skip: ['Backspace'] },
  ],
  keyNames: [
    'W A S D  ·  action Q / Space  ·  alt E  ·  skip practice X',
    'T F G H  ·  action R  ·  alt Y  ·  skip practice V',
    'I J K L  ·  action U  ·  alt O  ·  skip practice M',
    'Arrows  ·  action Enter  ·  alt Right Shift  ·  skip practice Backspace',
  ],
  mouse: { x: 0, y: 0, down: false, moved: false, canvas: null },
  init() {
    window.addEventListener('keydown', e => {
      this.keys.add(e.code);
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code) && document.activeElement && document.activeElement.tagName !== 'INPUT') e.preventDefault();
    });
    window.addEventListener('keyup', e => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());
  },
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
  // Each connected gamepad belongs to exactly one human seat, assigned in seat order:
  // 1st gamepad -> 1st human seat, 2nd gamepad -> 2nd human seat, ...
  // A seat's gamepad can be chosen in the menu (gamepad 1..4) or left on Auto, in which case
  // human seats take the remaining gamepads in order. One gamepad never drives two seats.
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
  state(i) {
    const m = this.maps[i];
    const k = arr => arr.some(c => this.keys.has(c));
    const s = { up: k(m.up), down: k(m.down), left: k(m.left), right: k(m.right), a: k(m.a), b: k(m.b), skip: k(m.skip || []), x: false, y: false, ax: 0, ay: 0 };
    const p = this.pad(i);
    if (p) {
      const ax = p.axes[0] || 0, ay = p.axes[1] || 0, b = n => p.buttons[n] && p.buttons[n].pressed;
      if (ax < -0.4 || b(14)) s.left = true;
      if (ax > 0.4 || b(15)) s.right = true;
      if (ay < -0.4 || b(12)) s.up = true;
      if (ay > 0.4 || b(13)) s.down = true;
      if (b(0)) s.a = true;   // A = primary action
      if (b(1)) s.b = true;   // B = alt / peek
      if (b(2) || b(3)) { s.padSkip = true; s.skip = true; } // X / Y = skip practice
      if (b(2)) s.x = true; if (b(3)) s.y = true;     // X and Y on their own (The Traitors' vote)
      if (b(9)) s.start = true; if (b(8)) s.select = true; // Start / Select (begin and end practice rounds)
      if (Math.abs(ax) > 0.2) s.ax = ax;
      if (Math.abs(ay) > 0.2) s.ay = ay;
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
