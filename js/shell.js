'use strict';
// The game shell: title screen, hero select, main menu, Challenge mode, Free Play browser,
// team setup, results, records, settings and custom controls. Everything is drawn on one canvas
// and driven by any keyboard player, any gamepad or the mouse.
const SEATC = ['#ff5a5a', '#4f8dff', '#4fd46a', '#ffcc33'];
const BIO = [
  'Curious little breeze who never sits still.', 'Sweet and gentle, but makes a big splash.', 'Fiery, cocky and always ready to win.', 'Calm, sturdy, quietly unbeatable.',
  'A sly puff of smoke. Now you see Wisp…', 'Sunny smile, rainy hat, never gloomy.', 'Tough as stone, twice as stubborn.', 'Blooms brighter with every win.',
  'Cool head, fast feet, frosty style.', 'Crackling with energy — zap!', 'Patient as the desert, quick as a sandstorm.', 'Hot-headed, molten-hearted.',
  'Shines brightest when the lights go out.', 'Quiet as midnight, sharp as starlight.', 'Builds, tinkers and never rusts.',
  'A mountain in boots. Nobody moves Brick.', 'Masked, fearless, and always off the top rope!', 'The crowd is his — and he knows it.', 'Strikes when you least expect it.', 'Loud, proud and swinging from the bell.',
];
const CATS = [
  { k: 'all', n: 'All', f: () => true },
  { k: 'ffa', n: 'Free-for-all', f: g => (g.mode || 'ffa') === 'ffa' && !Shell.isBrawl(g) && g.type !== 'Marathon' },
  { k: '2v2', n: '2 vs 2', f: g => g.mode === '2v2' },
  { k: '1v3', n: '1 vs 3', f: g => g.mode === '1v3' },
  { k: 'duel', n: 'Duels', f: g => g.mode === 'duel' },
  { k: 'sport', n: 'Sports', f: g => !!g.sport },
  { k: 'brawl', n: 'Brawl', f: g => Shell.isBrawl(g) && g.mode !== 'duel' },
  { k: 'mara', n: 'Marathon', f: g => g.type === 'Marathon' },
  { k: 'skill', n: 'Skill', f: g => ['Skill', 'Timing', 'Reaction', 'Rhythm', 'Arcade', 'Balance', 'Mash'].includes(g.type) },
  { k: 'wits', n: 'Wits & luck', f: g => ['Luck', 'Bluff', 'Memory', 'Deduction', 'Strategy', 'Search', 'Stealth', 'Wits'].includes(g.type) },
  { k: 'action', n: 'Action', f: g => ['Arena', 'Race', 'Survival', 'Coins'].includes(g.type) },
];

const Shell = {
  W: 1280, H: 720, screen: 'title', st: 0, t: 0, busy: false,
  seats: [0, 1, 2, 3].map(() => ({ dev: null, char: null, cur: 0, picked: false })),
  prevDev: {}, held: {}, hits: [], mouse: { x: 0, y: 0, click: false },
  isBrawl(g) { return g.type === 'Brawl' || /^brawl/.test(g.id); },

  init(canvas) {
    this.cv = canvas; this.g = canvas.getContext('2d');
    canvas.addEventListener('mousemove', e => { const r = canvas.getBoundingClientRect(); this.mouse.x = (e.clientX - r.left) / r.width * this.W; this.mouse.y = (e.clientY - r.top) / r.height * this.H; this.mouse.moved = true; });
    canvas.addEventListener('mousedown', e => { const r = canvas.getBoundingClientRect(); this.mouse.x = (e.clientX - r.left) / r.width * this.W; this.mouse.y = (e.clientY - r.top) / r.height * this.H; this.mouse.click = true; });
    window.addEventListener('keydown', e => { if (e.code === 'Escape') this.escQ = true; });
    this.load();
    let last = performance.now();
    const loop = now => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (!this.busy) { try { this.frame(dt); } catch (err) { console.error(err); } }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    this.go('title');
  },

  // ------------------------------------------------------------------ saved data
  load() {
    const rd = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k) || 'null'); return v || d; } catch (e) { return d; } };
    this.rec = rd('ff_records', { plays: 0, wins: {}, games: {}, champs: [] });
    this.ch = rd('ff_challenge', null);
    const set = rd('ff_settings', {});
    if (set.music === false) Settings.music = false; if (set.sound === false) Settings.sound = false; if (set.voice === false) Settings.voice = false; if (set.practice === false) Settings.practice = false;
  },
  save(k) {
    try {
      if (k === 'rec') localStorage.setItem('ff_records', JSON.stringify(this.rec));
      if (k === 'ch') localStorage.setItem('ff_challenge', JSON.stringify(this.ch));
      if (k === 'set') localStorage.setItem('ff_settings', JSON.stringify({ music: Settings.music, sound: Settings.sound, voice: Settings.voice !== false, practice: Settings.practice !== false }));
    } catch (e) { /* private window: nothing persists */ }
  },

  // ------------------------------------------------------------------ input
  readDevs(dt) {
    const devs = [];
    for (let k = 0; k < 4; k++) devs.push({ id: 'k' + k, s: Input.keyState(k) });
    Input.pads().forEach((p, k) => devs.push({ id: 'p' + k, s: Input.padState(p) }));
    const ev = {};
    for (const d of devs) {
      const pv = this.prevDev[d.id] || {}, e = {};
      for (const a of Input.ACTIONS) e[a] = !!d.s[a] && !pv[a];
      // held directions repeat in menus
      for (const a of ['up', 'down', 'left', 'right']) {
        const key = d.id + a;
        if (d.s[a]) { this.held[key] = (this.held[key] || 0) + dt; if (this.held[key] > 0.38) { this.held[key] -= 0.11; e[a] = true; } } else this.held[key] = 0;
      }
      ev[d.id] = e; this.prevDev[d.id] = d.s;
    }
    if (this.escQ) { ev.esc = { b: true }; this.escQ = false; }
    this.ev = ev;
  },
  any(a) { for (const k in this.ev) if (this.ev[k][a]) return true; return false; },
  // A from any device or a click on nothing in particular
  anyA() { return this.any('a') || this.any('start'); },

  // ------------------------------------------------------------------ frame
  go(screen, st = 0) {
    this.screen = screen; this.st = 0; this.sel = 0; this.confirm = false; this.msg = '';
    if (screen === 'title') { Music.back = 'title'; Music.play('title'); this.titleCast = R.shuffle([...Array(ELEMENTS.length).keys()]); }
    else if (Music.cur !== 'board') { Music.back = 'board'; Music.play('board'); }
    if (screen === 'select') Voice.announce('Select your avatar!');
  },
  frame(dt) {
    this.t += dt; this.st += dt;
    this.readDevs(dt);
    if (this.mute > 0) { this.mute--; this.ev = {}; this.mouse.click = false; } // ignore buttons still held from the minigame
    this.hits = [];
    const g = this.g;
    g.setTransform(1, 0, 0, 1, 0, 0);
    this.bg(g);
    const fn = this['scr_' + this.screen]; if (fn) fn.call(this, g, dt);
    // mouse: hover moves the selection, a click activates
    if (this.mouse.click) {
      this.mouse.click = false;
      for (let i = this.hits.length - 1; i >= 0; i--) { const h = this.hits[i]; if (this.mouse.x >= h.x && this.mouse.x <= h.x + h.w && this.mouse.y >= h.y && this.mouse.y <= h.y + h.h) { Sfx.click(); h.fn(); break; } }
    }
    this.mouse.moved = false;
  },
  hit(x, y, w, h, fn, hover) { this.hits.push({ x, y, w, h, fn }); if (hover && this.mouse.moved && this.mouse.x >= x && this.mouse.x <= x + w && this.mouse.y >= y && this.mouse.y <= y + h) hover(); },

  // ------------------------------------------------------------------ drawing helpers
  rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); },
  text(g, s, x, y, size, col = '#fff', align = 'center', weight = 'bold', outline = 'rgba(30,10,60,0.85)') {
    g.font = `${weight} ${size}px Georgia, "Segoe UI Emoji", serif`; g.textAlign = align; g.textBaseline = 'alphabetic';
    if (outline) { g.lineJoin = 'round'; g.lineWidth = Math.max(3, size * 0.16); g.strokeStyle = outline; g.strokeText(s, x, y); }
    g.fillStyle = col; g.fillText(s, x, y);
  },
  wrap(g, s, x, y, maxW, lh, size, col = '#fff', align = 'left') {
    g.font = `${size}px Georgia, serif`; g.textAlign = align; g.fillStyle = col;
    const words = String(s || '').split(' '); let line = '', yy = y;
    for (const w of words) { const tst = line ? line + ' ' + w : w; if (g.measureText(tst).width > maxW && line) { g.fillText(line, x, yy); line = w; yy += lh; } else line = tst; }
    if (line) g.fillText(line, x, yy); return yy;
  },
  bg(g) {
    // bright party backdrop: soft gradient, drifting diagonal stripes and floating bubbles
    const gr = g.createLinearGradient(0, 0, 0, this.H); gr.addColorStop(0, '#5b3cc4'); gr.addColorStop(0.55, '#3a2390'); gr.addColorStop(1, '#1d0f52');
    g.fillStyle = gr; g.fillRect(0, 0, this.W, this.H);
    g.save(); g.globalAlpha = 0.07; g.fillStyle = '#ffffff'; const off = (this.t * 30) % 120;
    for (let x = -400; x < this.W + 400; x += 120) { g.beginPath(); g.moveTo(x + off, 0); g.lineTo(x + off + 60, 0); g.lineTo(x + off - 300, this.H); g.lineTo(x + off - 360, this.H); g.fill(); }
    g.restore();
    for (let k = 0; k < 14; k++) { const x = (k * 137 + this.t * (12 + k % 5 * 6)) % (this.W + 100) - 50, y = this.H - ((k * 91 + this.t * (20 + k % 4 * 9)) % (this.H + 120)) + 60; g.fillStyle = `rgba(${['255,210,90', '120,200,255', '255,120,160', '140,240,150'][k % 4]},0.14)`; g.beginPath(); g.arc(x, y, 18 + (k % 4) * 10, 0, 7); g.fill(); }
  },
  panel(g, x, y, w, h, col = 'rgba(20,10,50,0.72)', edge = 'rgba(255,255,255,0.18)') { g.save(); g.shadowColor = 'rgba(0,0,0,0.45)'; g.shadowBlur = 18; g.shadowOffsetY = 6; g.fillStyle = col; this.rr(g, x, y, w, h, 22); g.fill(); g.restore(); g.strokeStyle = edge; g.lineWidth = 2; this.rr(g, x, y, w, h, 22); g.stroke(); },
  button(g, x, y, w, h, label, on, col = '#ffcc33', sub) {
    const k = on ? 1 + 0.03 * Math.sin(this.t * 8) : 1;
    g.save(); g.translate(x + w / 2, y + h / 2); g.scale(k, k); g.translate(-w / 2, -h / 2);
    g.save(); g.shadowColor = 'rgba(0,0,0,0.4)'; g.shadowBlur = on ? 22 : 10; g.shadowOffsetY = 5;
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, on ? Char.shade(col, 0.35) : '#4a3a8a'); gr.addColorStop(1, on ? col : '#2d2166');
    g.fillStyle = gr; this.rr(g, 0, 0, w, h, h / 2.4); g.fill(); g.restore();
    g.strokeStyle = on ? '#fff' : 'rgba(255,255,255,0.25)'; g.lineWidth = on ? 4 : 2; this.rr(g, 0, 0, w, h, h / 2.4); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.25)'; this.rr(g, 8, 5, w - 16, h * 0.38, h / 4); g.fill();
    this.text(g, label, w / 2, h / 2 + (sub ? 2 : 10), Math.min(30, h * 0.48), on ? '#2a1450' : '#fff', 'center', 'bold', on ? null : 'rgba(0,0,0,0.5)');
    if (sub) this.text(g, sub, w / 2, h - 10, 14, on ? '#3a2470' : '#c8bdf0', 'center', '', null);
    g.restore();
  },
  // a round controller-button picture with its letter
  btn(g, x, y, letter, r = 16) {
    const col = { A: '#3fc35a', B: '#e8453c', X: '#3f8ee8', Y: '#f2c12e', START: '#777', LB: '#666', RB: '#666' }[letter] || '#777';
    g.fillStyle = col; g.beginPath(); if (letter.length > 1) this.rr(g, x - r * 1.5, y - r * 0.75, r * 3, r * 1.5, r * 0.6); else g.arc(x, y, r, 0, 7); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 2; g.stroke();
    this.text(g, letter, x, y + r * 0.38, letter.length > 1 ? r * 0.75 : r * 1.1, '#fff', 'center', 'bold', null);
  },
  hints(g, list, y = 700) {
    let w = 0; g.font = 'bold 18px Georgia'; list.forEach(([b, s]) => { w += 44 + g.measureText(s).width + 26; });
    let x = this.W / 2 - w / 2;
    g.fillStyle = 'rgba(10,5,30,0.55)'; this.rr(g, x - 14, y - 26, w + 28, 40, 20); g.fill();
    list.forEach(([b, s]) => { this.btn(g, x + 18, y - 6, b, 13); this.text(g, s, x + 40, y + 1, 18, '#fff', 'left', 'bold', null); g.font = 'bold 18px Georgia'; x += 44 + g.measureText(s).width + 26; });
  },
  hero(g, x, y, r, c, o = {}) { Char.draw(g, x, y, r, c, ELEMENTS[c].color, Object.assign({ mood: 'happy', seed: c * 1.3, look: { x: 0.5, y: 0 } }, o)); },
  logo(g, x, y, s = 1) {
    g.save(); g.translate(x, y); g.scale(s, s);
    const word = 'YUPPIES', size = 118; g.font = `900 ${size}px "Arial Black", Impact, Georgia, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    const total = g.measureText(word).width; let cx = -total / 2;
    for (let k = 0; k < word.length; k++) {
      const ch = word[k], w = g.measureText(ch).width, yy = Math.sin(this.t * 3 + k * 0.7) * 6;
      g.save(); g.translate(cx + w / 2, yy); g.rotate(Math.sin(this.t * 2 + k) * 0.03);
      g.lineJoin = 'round'; g.lineWidth = 22; g.strokeStyle = '#2a1060'; g.strokeText(ch, 0, 6);
      g.lineWidth = 12; g.strokeStyle = '#fff'; g.strokeText(ch, 0, 0);
      const gr = g.createLinearGradient(0, -size / 2, 0, size / 2); const c = [['#ffe14d', '#ff8a1f'], ['#8fe0ff', '#2f7fe8'], ['#ff8a6a', '#e8302a'], ['#9fe06a', '#3f9a22']][k % 4];
      gr.addColorStop(0, c[0]); gr.addColorStop(1, c[1]); g.fillStyle = gr; g.fillText(ch, 0, 0);
      g.fillStyle = 'rgba(255,255,255,0.45)'; g.save(); g.beginPath(); g.rect(-w / 2, -size / 2, w, size * 0.32); g.clip(); g.fillText(ch, 0, 0); g.restore();
      g.restore(); cx += w;
    }
    // ribbon
    g.translate(0, 92); const rw = 420;
    g.fillStyle = '#b81f3a'; g.beginPath(); g.moveTo(-rw / 2 - 40, 8); g.lineTo(-rw / 2, -2); g.lineTo(-rw / 2, 40); g.lineTo(-rw / 2 - 40, 48); g.lineTo(-rw / 2 - 26, 28); g.fill();
    g.beginPath(); g.moveTo(rw / 2 + 40, 8); g.lineTo(rw / 2, -2); g.lineTo(rw / 2, 40); g.lineTo(rw / 2 + 40, 48); g.lineTo(rw / 2 + 26, 28); g.fill();
    const rg = g.createLinearGradient(0, -20, 0, 30); rg.addColorStop(0, '#ff5a6e'); rg.addColorStop(1, '#d42848'); g.fillStyle = rg; this.rr(g, -rw / 2, -22, rw, 52, 10); g.fill();
    g.strokeStyle = '#fff'; g.lineWidth = 3; this.rr(g, -rw / 2, -22, rw, 52, 10); g.stroke();
    this.text(g, 'MINIGAME PARTY', 0, 16, 34, '#fff', 'center', 'bold', '#7a0f24');
    g.restore();
  },

  // ------------------------------------------------------------------ TITLE
  scr_title(g) {
    const t = this.t, c = this.titleCast || [0, 1, 2, 3, 4, 5, 6, 7];
    // stage floor with spotlights
    g.fillStyle = 'rgba(255,240,200,0.06)'; for (let k = 0; k < 3; k++) { const x = 260 + k * 380 + Math.sin(t * 0.6 + k * 2) * 60; g.beginPath(); g.moveTo(x - 30, 0); g.lineTo(x + 30, 0); g.lineTo(x + 220, 720); g.lineTo(x - 220, 720); g.fill(); }
    const fl = g.createLinearGradient(0, 520, 0, 720); fl.addColorStop(0, '#6fc84a'); fl.addColorStop(1, '#3f8a2a'); g.fillStyle = fl; g.beginPath(); g.ellipse(640, 760, 900, 260, 0, 0, 7); g.fill();
    // --- brawl vignette (left): two heroes trading blows
    const bx = 250, by = 520, hit = Math.sin(t * 5) > 0.6;
    this.hero(g, bx - 70 + (hit ? 6 : 0), by, 42, c[0], { mood: hit ? 'effort' : 'angry', look: { x: 1, y: 0 }, t });
    this.hero(g, bx + 70 - (hit ? 0 : 6), by, 42, c[1], { mood: hit ? 'hurt' : 'determined', look: { x: -1, y: 0 }, t: t + 1 });
    if (hit) { g.save(); g.translate(bx, by - 30); g.rotate(t * 3); g.fillStyle = '#fff36a'; g.beginPath(); for (let k = 0; k < 16; k++) { const r = k % 2 ? 14 : 34, a = k * Math.PI / 8; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.fill(); g.restore(); this.text(g, 'POW!', bx, by - 90, 34, '#ff4d6d', 'center', 'bold', '#fff'); }
    // --- cooking vignette (centre): a bubbling pot
    const px = 640, py = 560;
    for (let k = 0; k < 4; k++) { const ph = (t * 0.6 + k / 4) % 1; g.fillStyle = `rgba(255,255,255,${0.35 * (1 - ph)})`; g.beginPath(); g.arc(px + Math.sin(ph * 6 + k) * 30, py - 70 - ph * 120, 18 + ph * 26, 0, 7); g.fill(); }
    this.hero(g, px - 110, py - 10, 40, c[2], { mood: 'happy', look: { x: 1, y: 0 }, t, hands: { n: { x: -1.2, y: -0.4 + Math.sin(t * 4) * 0.15, d: 160, o: false, m: false }, f: { x: 0.8, y: 0.2, d: 80, o: false, m: false } } });
    g.fillStyle = '#3a3040'; g.beginPath(); g.ellipse(px, py + 20, 90, 30, 0, 0, 7); g.fill();
    g.fillStyle = '#4a4252'; g.beginPath(); g.moveTo(px - 90, py - 30); g.lineTo(px + 90, py - 30); g.quadraticCurveTo(px + 96, py + 40, px, py + 46); g.quadraticCurveTo(px - 96, py + 40, px - 90, py - 30); g.fill();
    g.fillStyle = '#ff9a3a'; g.beginPath(); g.ellipse(px, py - 30, 88, 20, 0, 0, 7); g.fill();
    for (let k = 0; k < 5; k++) { const ph = (t * 1.3 + k * 0.37) % 1; g.fillStyle = `rgba(255,200,120,${1 - ph})`; g.beginPath(); g.arc(px - 60 + k * 30, py - 32 - ph * 10, 6 * (1 - ph) + 2, 0, 7); g.fill(); }
    g.strokeStyle = '#8a5a32'; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(px - 30 + Math.sin(t * 4) * 20, py - 36); g.lineTo(px - 70 + Math.sin(t * 4) * 20, py - 110); g.stroke();
    this.hero(g, px + 120, py - 10, 40, c[3], { mood: 'love', look: { x: -1, y: 0 }, t });
    // --- racing vignette (right): karts zooming round
    for (let k = 0; k < 2; k++) {
      const kx = 980 + Math.sin(t * 1.4 + k * 2.4) * 160, ky = 530 + k * 50, dir = Math.cos(t * 1.4 + k * 2.4) > 0 ? 1 : -1;
      g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(kx, ky + 34, 70, 12, 0, 0, 7); g.fill();
      this.hero(g, kx, ky - 22, 34, c[4 + k], { mood: 'cheer', look: { x: dir, y: 0 }, t: t + k, noFeet: true });
      g.fillStyle = ['#e8432a', '#2f7fe8'][k]; this.rr(g, kx - 62, ky - 4, 124, 34, 14); g.fill(); g.fillStyle = 'rgba(255,255,255,0.35)'; this.rr(g, kx - 54, ky, 108, 10, 5); g.fill();
      for (const wx of [-40, 40]) { g.fillStyle = '#222'; g.beginPath(); g.arc(kx + wx, ky + 30, 13, 0, 7); g.fill(); g.fillStyle = '#999'; g.beginPath(); g.arc(kx + wx, ky + 30, 5, 0, 7); g.fill(); }
      for (let q = 0; q < 3; q++) { g.fillStyle = 'rgba(255,255,255,0.4)'; g.beginPath(); g.arc(kx - dir * (80 + q * 18), ky + 20 - q * 4, 8 - q * 2, 0, 7); g.fill(); }
    }
    // confetti
    for (let k = 0; k < 40; k++) { const x = (k * 97 + t * 40 * (1 + k % 3)) % 1300, y = (k * 53 + t * 70 * (1 + k % 2)) % 760 - 20; g.save(); g.translate(x, y); g.rotate(t * 3 + k); g.fillStyle = ['#ff5a6e', '#ffd34d', '#5fb8ff', '#7cf06a', '#c88aff'][k % 5]; g.fillRect(-5, -3, 10, 6); g.restore(); }
    this.logo(g, 640, 170, 1);
    const k = 0.5 + 0.5 * Math.sin(t * 4);
    g.globalAlpha = 0.55 + 0.45 * k; this.btn(g, 448, 345, 'A', 22); this.text(g, 'Press A to start', 660, 356, 38, '#fff', 'center', 'bold'); g.globalAlpha = 1;
    this.text(g, '4 players · one big party', 640, 712, 16, '#cdbff5', 'center', '', null);
    this.hit(0, 0, this.W, this.H, () => this.toSelect());
    if (this.st > 0.4 && this.anyA()) this.toSelect();
  },
  toSelect() { Sfx.tone(660, 0.15, 'triangle', 0.08); Sfx.tone(990, 0.2, 'triangle', 0.07, 0, 0.08); this.go('select'); },

  // ------------------------------------------------------------------ HERO SELECT
  gridPos(c) { const col = c % 5, row = Math.floor(c / 5); return { x: 255 + col * 154, y: 78 + row * 94, w: 140, h: 88 }; },
  takenBy(c, except) { return this.seats.findIndex((s, i) => i !== except && s.picked && s.char === c); },
  scr_select(g) {
    this.text(g, 'Select your avatar!', 640, 60, 42, '#ffe680');
    // join / move / pick per device
    for (const id in this.ev) {
      if (id === 'esc') continue;
      const e = this.ev[id]; let si = this.seats.findIndex(s => s.dev === id);
      if (si < 0) {
        if (e.a || e.start) {
          // keyboard set k always plays seat k (its keys are that seat's keys); gamepads take the first free seat
          const want = id[0] === 'k' ? +id[1] : this.seats.findIndex(s => !s.dev);
          if (want >= 0 && !this.seats[want].dev) { const s = this.seats[want]; s.dev = id; s.picked = false; s.cur = this.seats[want].char !== null ? this.seats[want].char : [0, 1, 2, 3][want]; while (this.takenBy(s.cur, want) >= 0) s.cur = (s.cur + 1) % ELEMENTS.length; Sfx.tone(520 + want * 90, 0.12, 'triangle', 0.08); }
        }
        continue;
      }
      const s = this.seats[si];
      if (!s.picked) {
        const NC = ELEMENTS.length; if (e.left) s.cur = (s.cur + NC - 1) % NC; if (e.right) s.cur = (s.cur + 1) % NC;
        if (e.up) s.cur = (s.cur + NC - 5) % NC; if (e.down) s.cur = (s.cur + 5) % NC;
        if (e.left || e.right || e.up || e.down) Sfx.tone(880, 0.03, 'triangle', 0.03);
        if (e.a) { if (this.takenBy(s.cur, si) >= 0) Sfx.bad(); else { s.char = s.cur; s.picked = true; Sfx.select(s.char); } }
        if (e.b) { s.dev = null; s.char = null; Sfx.tone(300, 0.1, 'triangle', 0.06); }
      } else {
        if (e.b) { s.picked = false; Sfx.tone(380, 0.1, 'triangle', 0.06); }
        if ((e.start || e.a) && this.allReady()) { this.finishSelect(); return; }
      }
    }
    if (this.ev.esc && this.ev.esc.b && !this.seats.some(s => s.dev)) { this.go('title'); return; }
    // grid
    for (let c = 0; c < ELEMENTS.length; c++) {
      const p = this.gridPos(c), tk = this.takenBy(c, -1);
      const gr = g.createLinearGradient(0, p.y, 0, p.y + p.h); gr.addColorStop(0, Char.shade(ELEMENTS[c].color, 0.35)); gr.addColorStop(1, Char.shade(ELEMENTS[c].color, -0.35));
      g.save(); g.shadowColor = 'rgba(0,0,0,0.35)'; g.shadowBlur = 10; g.shadowOffsetY = 4; g.fillStyle = gr; this.rr(g, p.x, p.y, p.w, p.h, 16); g.fill(); g.restore();
      g.save(); this.rr(g, p.x, p.y, p.w, p.h, 16); g.clip();
      g.fillStyle = 'rgba(255,255,255,0.18)'; g.beginPath(); g.arc(p.x + p.w / 2, p.y + 34, 44, 0, 7); g.fill();
      this.hero(g, p.x + p.w / 2, p.y + 42, 25, c, { mood: tk >= 0 ? 'cheer' : 'happy', t: this.t + c, noShadow: true });
      g.restore();
      this.text(g, ELEMENTS[c].mascot, p.x + p.w / 2, p.y + p.h - 8, 17, '#fff', 'center', 'bold');
      if (tk >= 0) { g.fillStyle = 'rgba(0,0,0,0.35)'; this.rr(g, p.x, p.y, p.w, p.h, 16); g.fill(); g.fillStyle = SEATC[tk]; this.rr(g, p.x + p.w - 46, p.y + 6, 40, 24, 10); g.fill(); this.text(g, 'P' + (tk + 1), p.x + p.w - 26, p.y + 24, 16, '#fff', 'center', 'bold', null); }
      this.hit(p.x, p.y, p.w, p.h, () => this.mousePick(c));
    }
    // cursors
    this.seats.forEach((s, i) => {
      if (!s.dev || s.picked) return;
      const p = this.gridPos(s.cur), o = i * 4, pul = 2 + Math.sin(this.t * 8) * 1.5;
      g.strokeStyle = SEATC[i]; g.lineWidth = 5 + pul; this.rr(g, p.x - 4 - o, p.y - 4 - o, p.w + 8 + o * 2, p.h + 8 + o * 2, 18); g.stroke();
      g.fillStyle = SEATC[i]; this.rr(g, p.x - 8 + i * 34 - o, p.y - 20 - o, 34, 22, 8); g.fill(); this.text(g, 'P' + (i + 1), p.x + 9 + i * 34 - o, p.y - 4 - o, 15, '#fff', 'center', 'bold', null);
    });
    // seat panels
    this.seats.forEach((s, i) => {
      const x = 22 + i * 314, y = 516, w = 296, h = 170;
      this.panel(g, x, y, w, h, s.dev ? 'rgba(30,15,70,0.85)' : 'rgba(20,10,50,0.55)', SEATC[i]);
      g.fillStyle = SEATC[i]; this.rr(g, x + 12, y - 16, 64, 30, 12); g.fill(); this.text(g, 'P' + (i + 1), x + 44, y + 6, 20, '#fff', 'center', 'bold', null);
      if (!s.dev) {
        this.text(g, 'CPU', x + w / 2, y + 74, 30, 'rgba(255,255,255,0.5)');
        this.btn(g, x + 70, y + 125, 'A', 15); this.text(g, 'to join', x + w / 2 + 20, y + 132, 20, '#fff', 'center', 'bold', null);
        this.text(g, i === 0 ? 'Keyboard: Space / Q' : i === 3 ? 'Keyboard: Enter' : i === 1 ? 'Keyboard: R' : 'Keyboard: U', x + w / 2, y + 162, 13, '#b8aee0', 'center', '', null);
        return;
      }
      const c = s.picked ? s.char : s.cur;
      if (s.picked) { s.pickT = s.pickT || this.t; Char.win(g, x + 66, y + 96, 40, c, this.t - s.pickT); } else { s.pickT = 0; this.hero(g, x + 70, y + 102, 44, c, { mood: 'happy', t: this.t + i, look: { x: 0.6, y: 0 } }); }
      this.text(g, ELEMENTS[c].mascot, x + 190, y + 50, 28, ELEMENTS[c].color, 'center', 'bold');
      this.text(g, ELEMENTS[c].glyph + ' ' + ELEMENTS[c].name, x + 190, y + 78, 17, '#fff', 'center', '', null);
      this.wrap(g, BIO[c], x + 190, y + 102, 170, 18, 14, '#d8ccff', 'center');
      if (s.picked) this.text(g, '✔ READY', x + 190, y + h - 14, 22, '#7f7', 'center', 'bold');
      else this.text(g, this.takenBy(c, i) >= 0 ? 'Taken!' : 'Ⓐ pick  Ⓑ leave', x + 190, y + h - 14, 16, this.takenBy(c, i) >= 0 ? '#ff8a8a' : '#fff', 'center', 'bold', null);
    });
    if (this.allReady()) { const k = 1 + 0.05 * Math.sin(this.t * 6); g.save(); g.translate(640, 467); g.scale(k, k); g.fillStyle = '#ffcc33'; this.rr(g, -230, -24, 460, 44, 22); g.fill(); this.text(g, 'Press START or A — let’s go!', 0, 7, 24, '#2a1450', 'center', 'bold', null); g.restore(); this.hit(410, 443, 460, 44, () => this.finishSelect()); }
    else if (!this.seats.some(s => s.dev)) this.text(g, 'Each player presses A on their own gamepad (or keys) to join', 640, 478, 18, '#ffe680', 'center', 'bold');
  },
  mousePick(c) {
    // mouse plays as P1 on the keyboard
    const s = this.seats[0]; if (!s.dev) { s.dev = 'k0'; }
    if (this.takenBy(c, 0) >= 0) { Sfx.bad(); return; }
    s.cur = c; s.char = c; s.picked = true; Sfx.select(c);
  },
  allReady() { const j = this.seats.filter(s => s.dev); return j.length > 0 && j.every(s => s.picked); },
  finishSelect() {
    // CPUs take random heroes nobody picked
    const free = R.shuffle([...Array(ELEMENTS.length).keys()].filter(c => this.takenBy(c, -1) < 0));
    this.seats.forEach(s => { if (!s.dev) { s.char = free.pop(); s.picked = false; } });
    Input.setHumans(this.seats.map(s => ({ human: !!s.dev, pad: s.dev ? (s.dev[0] === 'p' ? +s.dev.slice(1) : -1) : null })));
    Sfx.star && Sfx.star(); Voice.announce("Let's party!");
    this.go('menu');
  },
  players() { return this.seats.map((s, i) => ({ id: i, name: ELEMENTS[s.char].mascot, color: ELEMENTS[s.char].color, human: !!s.dev, el: ELEMENTS[s.char], seat: i })); },
  lineup(g, x0, y0, sp = 120, r = 40) {
    this.seats.forEach((s, i) => {
      if (s.char === null) return; const x = x0 + i * sp;
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(x, y0 + r * 1.3, r * 1.1, r * 0.3, 0, 0, 7); g.fill();
      this.hero(g, x, y0, r, s.char, { mood: 'happy', t: this.t + i * 1.3, look: { x: -0.4, y: 0 } });
      g.fillStyle = SEATC[i]; this.rr(g, x - 30, y0 + r * 1.6, 60, 24, 10); g.fill(); this.text(g, s.dev ? 'P' + (i + 1) : 'CPU', x, y0 + r * 1.6 + 18, 15, '#fff', 'center', 'bold', null);
    });
  },

  // ------------------------------------------------------------------ MAIN MENU
  menuList(g, items, x, y, w, h, gap) {
    const n = items.length;
    if (this.any('up')) { this.sel = (this.sel + n - 1) % n; Sfx.tone(880, 0.03, 'triangle', 0.03); }
    if (this.any('down')) { this.sel = (this.sel + 1) % n; Sfx.tone(880, 0.03, 'triangle', 0.03); }
    items.forEach((it, k) => {
      const yy = y + k * gap; this.button(g, x, yy, w, h, it.label, k === this.sel, it.col || '#ffcc33', it.sub);
      this.hit(x, yy, w, h, () => { this.sel = k; it.fn(); }, () => { this.sel = k; });
    });
    if (this.any('a') && items[this.sel]) { Sfx.tone(700, 0.08, 'triangle', 0.07); items[this.sel].fn(); }
  },
  scr_menu(g) {
    this.logo(g, 640, 92, 0.62);
    const items = [
      { label: '🏆 Challenge', sub: this.ch ? `Game ${Math.min(this.ch.idx + 1, this.ch.order.length)} of ${this.ch.order.length}` : 'Every game once — who’s the champ?', fn: () => this.go('challenge'), col: '#ffcc33' },
      { label: '🎲 Board', sub: 'The Crossing — stars, raids & duels', fn: () => this.go('boardsetup'), col: '#ff9a4a' },
      { label: '🤼 Ring Rumble', sub: 'Wrestling: Fatal 4-Way or Tag Team', fn: () => { this.rsel = 0; this.go('ringmenu'); }, col: '#ff5a5a' },
      { label: '🎮 Free Play', sub: `${MG.list.length} minigames`, fn: () => { this.tab = this.tab || 0; this.go('browse'); }, col: '#7cf06a' },
      { label: '📜 Records', sub: 'Wins, champions, favourites', fn: () => this.go('records'), col: '#8fd8ff' },
      { label: '🙂 Change avatars', sub: 'Back to avatar select', fn: () => { this.seats.forEach(s => { s.picked = false; }); this.go('select'); }, col: '#ff9ad0' },
      { label: '⚙️ Settings', sub: 'Sound, music, controls', fn: () => this.go('settings'), col: '#c8b8ff' },
    ];
    this.menuList(g, items, 90, 168, 470, 62, 72);
    this.panel(g, 620, 210, 600, 380);
    this.text(g, 'Today’s party', 920, 254, 26, '#ffe680');
    this.lineup(g, 700, 380, 146, 50);
    this.hints(g, [['A', 'Choose'], ['B', 'Avatar select']]);
    if (this.any('b')) { this.seats.forEach(s => { s.picked = false; }); this.go('select'); }
  },

  // ------------------------------------------------------------------ CHALLENGE
  newChallenge() {
    this.ch = { order: R.shuffle(MG.list.map(g => g.id)), idx: 0, pts: [0, 0, 0, 0], wins: [0, 0, 0, 0], chars: this.seats.map(s => s.char), log: [], started: Date.now() };
    this.save('ch');
  },
  syncChallenge() { // games added since the challenge began join the end of the queue
    if (!this.ch) return; const have = new Set(this.ch.order);
    const add = R.shuffle(MG.list.map(g => g.id).filter(id => !have.has(id))); if (add.length) { this.ch.order.push(...add); this.save('ch'); }
    this.ch.order = this.ch.order.filter(id => MG.byId[id]);
  },
  scr_challenge(g) {
    this.syncChallenge();
    const ch = this.ch, total = ch ? ch.order.length : MG.list.length, done = ch ? ch.idx : 0;
    this.text(g, '🏆 Challenge', 640, 64, 44, '#ffe680');
    this.text(g, 'Every minigame comes up once, in random order. 1st = ★★★, 2nd = ★★, 3rd = ★', 640, 98, 18, '#d8ccff', 'center', '', null);
    // progress bar
    this.panel(g, 140, 120, 1000, 54); g.fillStyle = 'rgba(255,255,255,0.12)'; this.rr(g, 160, 135, 960, 24, 12); g.fill();
    g.fillStyle = '#ffcc33'; this.rr(g, 160, 135, Math.max(24, 960 * done / total), 24, 12); g.fill();
    this.text(g, `${done} / ${total} games played`, 640, 154, 18, '#2a1450', 'center', 'bold', '#fff');
    // standings
    this.panel(g, 620, 196, 600, 420);
    this.text(g, 'Standings', 920, 236, 26, '#ffe680');
    const pts = ch ? ch.pts : [0, 0, 0, 0], order = [0, 1, 2, 3].sort((a, b) => pts[b] - pts[a] || a - b);
    order.forEach((i, k) => {
      const s = this.seats[i], y = 270 + k * 82;
      g.fillStyle = k === 0 && pts[i] > 0 ? 'rgba(255,220,120,0.22)' : 'rgba(255,255,255,0.07)'; this.rr(g, 640, y, 560, 70, 16); g.fill();
      this.hero(g, 700, y + 40, 26, s.char, { mood: k === 0 && pts[i] > 0 ? 'cheer' : 'happy', t: this.t + i });
      this.text(g, `${['🥇', '🥈', '🥉', '4.'][k]} ${ELEMENTS[s.char].mascot}`, 750, y + 44, 26, ELEMENTS[s.char].color, 'left', 'bold');
      g.fillStyle = SEATC[i]; this.rr(g, 980, y + 22, 48, 24, 10); g.fill(); this.text(g, 'P' + (i + 1), 1004, y + 40, 15, '#fff', 'center', 'bold', null);
      this.text(g, `★ ${pts[i]}`, 1120, y + 46, 30, '#ffd34d', 'center', 'bold');
    });
    const items = [];
    if (ch && ch.idx < ch.order.length) items.push({ label: '▶ Next game', sub: ch.idx ? 'Carry on the challenge' : 'Let the challenge begin!', fn: () => this.challengeNext(), col: '#7cf06a' });
    if (ch && ch.idx >= ch.order.length) items.push({ label: '👑 See the champion', fn: () => this.go('champion'), col: '#ffcc33' });
    items.push({ label: this.confirm ? 'Press again to confirm' : '✨ New challenge', sub: ch ? 'Starts over from game 1' : 'Shuffle all the games', col: '#ffcc33', fn: () => { if (ch && !this.confirm) { this.confirm = true; return; } this.newChallenge(); this.confirm = false; Voice.announce('A new challenge begins!'); } });
    items.push({ label: '◀ Back', fn: () => this.go('menu'), col: '#c8b8ff' });
    if (this.sel >= items.length) this.sel = 0;
    this.menuList(g, items, 90, 230, 460, 78, 96);
    this.hints(g, [['A', 'Choose'], ['B', 'Back']]);
    if (this.any('b')) this.go('menu');
  },
  challengeNext() {
    if (!this.ch) this.newChallenge();
    const id = this.ch.order[this.ch.idx]; if (!id) { this.go('champion'); return; }
    this.reveal = { id, t: 0, names: R.shuffle(MG.list.map(g => g.name)).slice(0, 14) };
    this.go('reveal');
  },
  scr_reveal(g) {
    const rv = this.reveal, game = MG.byId[rv.id]; rv.t += 1 / 60;
    this.text(g, `Challenge · game ${this.ch.idx + 1} of ${this.ch.order.length}`, 640, 90, 26, '#d8ccff', 'center', 'bold');
    const spin = Math.min(1, this.st / 2.2), slow = 1 - Math.pow(1 - spin, 3);
    const idx = Math.floor(slow * 40), name = spin >= 1 ? game.name : rv.names[idx % rv.names.length];
    this.panel(g, 240, 240, 800, 180, 'rgba(255,204,51,0.92)', '#fff');
    this.text(g, name, 640, 352, spin >= 1 ? 60 : 50, '#2a1450', 'center', 'bold', '#fff');
    if (spin < 1 && Math.floor(this.st * 20) !== Math.floor((this.st - 1 / 60) * 20)) Sfx.tone(600 + (idx % 5) * 80, 0.03, 'square', 0.03);
    if (spin >= 1) {
      if (!rv.said) { rv.said = true; Sfx.star && Sfx.star(); Voice.announce(game.name + '!'); rv.teams = this.randomTeams(game.mode || 'ffa'); }
      this.text(g, `${game.type}${game.mode && game.mode !== 'ffa' ? ' · ' + ({ '2v2': '2 vs 2', '1v3': '1 vs 3', duel: '⚔️ Duel' }[game.mode] || game.mode) : ''}`, 640, 400, 22, '#5a3a9a', 'center', 'bold', null);
      if (rv.teams) this.drawTeams(g, game.mode, rv.teams, 470);
      if (this.st > 3.6 || (this.st > 2.6 && this.anyA())) { this.play(rv.id, { mode: game.mode || 'ffa', teams: rv.teams, challenge: true }); }
    }
  },
  // teams rotate so everyone partners everyone: P1 with P2, then P3, then P4 … and the 1v3 solo seat takes turns
  randomTeams(mode) {
    const st = this.ch || (this._rot = this._rot || {}); st.pairK = st.pairK === undefined ? R.int(0, 2) : st.pairK; st.soloK = st.soloK === undefined ? R.int(0, 3) : st.soloK;
    if (mode === '2v2') { const mate = 1 + (st.pairK % 3); st.pairK++; const t = [0, 1, 2, 3].map(i => (i === 0 || i === mate) ? 0 : 1); if (Math.random() < 0.5) return t.map(x => 1 - x); return t; }
    if (mode === '1v3') { const solo = st.soloK % 4; st.soloK++; return [0, 1, 2, 3].map(i => i === solo ? 0 : 1); }
    if (mode === 'duel') { const P = [[0, 1], [2, 3], [0, 2], [1, 3], [0, 3], [1, 2]]; st.duelK = st.duelK === undefined ? R.int(0, 5) : st.duelK; const [a, b] = P[st.duelK % 6]; st.duelK++; return [0, 1, 2, 3].map(i => i === a ? 0 : i === b ? 1 : -1); }
    return null;
  },
  drawTeams(g, mode, teams, y) {
    [0, 1].forEach(tm => {
      const mem = [0, 1, 2, 3].filter(i => teams[i] === tm), x0 = tm ? 900 : 380;
      g.fillStyle = MG.TEAMC[tm]; this.rr(g, x0 - 170, y - 24, 340, 34, 16); g.fill();
      this.text(g, mode === '1v3' ? (mem.length === 1 ? 'SOLO' : 'TEAM OF 3') : 'TEAM ' + MG.TEAMN[tm].toUpperCase(), x0, y + 2, 20, '#fff', 'center', 'bold', null);
      mem.forEach((i, k) => { const x = x0 + (k - (mem.length - 1) / 2) * 110; this.hero(g, x, y + 90, 34, this.seats[i].char, { mood: 'determined', t: this.t + i, look: { x: tm ? -1 : 1, y: 0 } }); this.text(g, ELEMENTS[this.seats[i].char].mascot, x, y + 160, 16, '#fff'); });
    });
    this.text(g, 'VS', 640, y + 100, 54, '#ffe680');
  },
  scr_champion(g) {
    const ch = this.ch; if (!ch) { this.go('menu'); return; }
    const order = [0, 1, 2, 3].sort((a, b) => ch.pts[b] - ch.pts[a] || a - b), top = ch.pts[order[0]], champs = order.filter(i => ch.pts[i] === top);
    if (!this.saidChamp) { this.saidChamp = true; Voice.announce(`${champs.map(i => ELEMENTS[this.seats[i].char].mascot).join(' and ')} ${champs.length > 1 ? 'are' : 'is'} the champion!`); setTimeout(() => Voice.line(this.seats[champs[0]].char, 'win'), 2200); if (!ch.recorded) { ch.recorded = true; this.rec.champs.unshift({ who: champs.map(i => this.seats[i].char), pts: top, games: ch.order.length, date: Date.now() }); this.rec.champs = this.rec.champs.slice(0, 20); this.save('rec'); this.save('ch'); } }
    g.save(); g.translate(640, 230); g.rotate(this.t * 0.3); for (let k = 0; k < 16; k++) { g.rotate(Math.PI / 8); g.fillStyle = k % 2 ? 'rgba(255,230,128,0.1)' : 'rgba(255,255,255,0.05)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(-80, -900); g.lineTo(80, -900); g.fill(); } g.restore();
    this.text(g, '👑 CHALLENGE CHAMPION 👑', 640, 80, 46, '#ffe680');
    champs.forEach((i, k) => Char.win(g, 620 + (k - (champs.length - 1) / 2) * 260, 230, 76, this.seats[i].char, this.t + k));
    this.text(g, champs.map(i => ELEMENTS[this.seats[i].char].mascot).join(' & ') + ` — ★ ${top}`, 640, 400, 40, '#fff');
    order.forEach((i, k) => this.text(g, `${k + 1}. ${ELEMENTS[this.seats[i].char].mascot}  ★ ${ch.pts[i]}`, 640, 460 + k * 40, 26, ELEMENTS[this.seats[i].char].color));
    for (let k = 0; k < 2; k++) if (Math.random() < 0.5) { /* confetti drift */ }
    this.hints(g, [['A', 'New challenge'], ['B', 'Menu']]);
    if (this.any('a')) { this.saidChamp = false; this.newChallenge(); this.go('challenge'); }
    if (this.any('b')) { this.saidChamp = false; this.go('menu'); }
  },

  // ------------------------------------------------------------------ FREE PLAY BROWSER
  listFor(tab) { return MG.list.filter(CATS[tab].f); },
  thumbImg(id) {
    this.thumbs = this.thumbs || {};
    if (this.thumbs[id]) return this.thumbs[id];
    if (this.thumbBudget-- <= 0) return null;
    const im = new Image(); im.src = MG.thumb(id); this.thumbs[id] = im; return im;
  },
  scr_browse(g) {
    this.thumbBudget = 1;
    this.tab = this.tab || 0; this.bsel = this.bsel || 0;
    if (this.any('lb') || this.any('x')) { this.tab = (this.tab + CATS.length - 1) % CATS.length; this.bsel = 0; Sfx.tone(700, 0.04, 'triangle', 0.04); }
    if (this.any('rb') || this.any('y')) { this.tab = (this.tab + 1) % CATS.length; this.bsel = 0; Sfx.tone(700, 0.04, 'triangle', 0.04); }
    const list = this.listFor(this.tab), cols = 4;
    if (this.any('left')) this.bsel = Math.max(0, this.bsel - 1);
    if (this.any('right')) this.bsel = Math.min(list.length - 1, this.bsel + 1);
    if (this.any('up')) this.bsel = Math.max(0, this.bsel - cols);
    if (this.any('down')) this.bsel = Math.min(list.length - 1, this.bsel + cols);
    if (this.bsel >= list.length) this.bsel = Math.max(0, list.length - 1);
    // tabs
    let tx = 22; g.font = 'bold 15px Georgia';
    CATS.forEach((c, k) => {
      const n = this.listFor(k).length, label = `${c.n} ${n}`; g.font = 'bold 15px Georgia'; const w = g.measureText(label).width + 22;
      g.fillStyle = k === this.tab ? '#ffcc33' : 'rgba(255,255,255,0.12)'; this.rr(g, tx, 16, w, 34, 17); g.fill();
      this.text(g, label, tx + w / 2, 39, 15, k === this.tab ? '#2a1450' : '#fff', 'center', 'bold', null);
      this.hit(tx, 16, w, 34, () => { this.tab = k; this.bsel = 0; }); tx += w + 6;
    });
    // grid with thumbnails
    const top = 70, cw = 232, chh = 168, rows = 3, scroll = Math.max(0, Math.floor(this.bsel / cols) - 1) * cols;
    if (!list.length) this.text(g, 'No games here yet — coming in the next update!', 500, 320, 24, '#ffe680');
    list.slice(scroll, scroll + cols * rows).forEach((gm, k) => {
      const idx = scroll + k, x = 30 + (k % cols) * (cw + 12), y = top + Math.floor(k / cols) * (chh + 14), on = idx === this.bsel;
      g.save(); g.shadowColor = on ? '#ffcc33' : 'rgba(0,0,0,0.4)'; g.shadowBlur = on ? 24 : 8; g.fillStyle = '#140a34'; this.rr(g, x, y, cw, chh, 14); g.fill(); g.restore();
      const im = this.thumbImg(gm.id);
      g.save(); this.rr(g, x + 6, y + 6, cw - 12, 124, 10); g.clip(); if (im && im.complete && im.naturalWidth) g.drawImage(im, x + 6, y + 6, cw - 12, 124); else { g.fillStyle = '#2d1f66'; g.fillRect(x, y, cw, 130); this.text(g, '…', x + cw / 2, y + 74, 30, '#887', 'center', 'bold', null); } g.restore();
      if (gm.mode && gm.mode !== 'ffa') { g.fillStyle = '#ff5a5a'; this.rr(g, x + 10, y + 10, 64, 22, 10); g.fill(); this.text(g, ({ '2v2': '2 vs 2', '1v3': '1 vs 3', duel: 'Duel' }[gm.mode] || gm.mode), x + 42, y + 26, 13, '#fff', 'center', 'bold', null); }
      this.text(g, gm.name, x + cw / 2, y + chh - 14, gm.name.length > 20 ? 15 : 18, on ? '#ffe680' : '#fff', 'center', 'bold');
      g.strokeStyle = on ? '#ffcc33' : 'rgba(255,255,255,0.15)'; g.lineWidth = on ? 4 : 2; this.rr(g, x, y, cw, chh, 14); g.stroke();
      this.hit(x, y, cw, chh, () => { if (this.bsel === idx) this.startFree(gm); else this.bsel = idx; });
    });
    if (list.length > cols * rows) { const pages = Math.ceil(list.length / cols); this.text(g, `▲▼ row ${Math.floor(this.bsel / cols) + 1} of ${pages}`, 520, 640, 16, '#cdbff5', 'center', 'bold', null); }
    // details
    const gm = list[this.bsel];
    this.panel(g, 1010, 70, 250, 590);
    if (gm) {
      this.wrap(g, gm.name, 1135, 112, 230, 30, 26, '#ffe680', 'center');
      this.text(g, gm.type + (gm.mode && gm.mode !== 'ffa' ? ' · ' + ({ '2v2': '2 vs 2', '1v3': '1 vs 3', duel: '⚔️ Duel' }[gm.mode] || gm.mode) : ' · Free-for-all'), 1135, 176, 15, '#8fe0ff', 'center', 'bold', null);
      this.text(g, '🎮 ' + (gm.controls || ''), 1135, 202, 14, '#fff', 'center', '', null);
      g.fillStyle = 'rgba(255,255,255,0.15)'; g.fillRect(1030, 216, 210, 2);
      const yy = this.wrap(g, gm.how, 1028, 244, 214, 20, 15, '#f0ecff');
      this.text(g, '🏆 Goal', 1135, yy + 34, 16, '#ffe680', 'center', 'bold', null);
      this.wrap(g, gm.wins, 1135, yy + 56, 214, 19, 14, '#d8ccff', 'center');
      const r = this.rec.games[gm.id]; if (r && r.plays) this.text(g, `Played ${r.plays}×`, 1135, 650, 14, '#b8aee0', 'center', '', null);
    }
    this.hints(g, [['A', 'Play'], ['X', '◀ tab'], ['Y', 'tab ▶'], ['B', 'Back']]);
    if (this.any('a') && gm) this.startFree(gm);
    if (this.any('b')) this.go('menu');
  },
  startFree(gm) {
    const mode = gm.mode || 'ffa';
    if (mode === 'ffa') this.play(gm.id, { mode });
    else { this.teamSet = { id: gm.id, mode, teams: this.randomTeams(mode), row: 0 }; this.go('teams'); }
  },

  // ------------------------------------------------------------------ TEAM SETUP (2 vs 2, 1 vs 3)
  scr_teams(g) {
    const T = this.teamSet, gm = MG.byId[T.id], mode = T.mode;
    if (mode === 'duel') return this.scr_duelpick(g);
    this.text(g, gm.name, 640, 60, 40, '#ffe680');
    this.text(g, mode === '2v2' ? 'Two teams of two — arrange them or shuffle!' : 'One hero against three — who goes solo?', 640, 96, 20, '#d8ccff', 'center', '', null);
    if (this.any('up')) T.row = (T.row + 3) % 4; if (this.any('down')) T.row = (T.row + 1) % 4;
    const move = (i, to) => {
      if (mode === '2v2') { if (T.teams[i] === to) return; const swap = [0, 1, 2, 3].find(j => j !== i && T.teams[j] === to && j !== T.row) ?? [0, 1, 2, 3].find(j => j !== i && T.teams[j] === to); T.teams[i] = to; if (swap !== undefined) T.teams[swap] = 1 - to; }
      else { if (to === 0) T.teams = [0, 1, 2, 3].map(j => j === i ? 0 : 1); else if (T.teams[i] === 0) { T.teams[i] = 1; T.teams[(i + 1) % 4] = 0; } }
      Sfx.tone(760, 0.05, 'triangle', 0.05);
    };
    if (this.any('left')) move(T.row, 0); if (this.any('right')) move(T.row, 1);
    if (this.any('y')) { T.teams = this.randomTeams(mode); Sfx.tone(900, 0.08, 'triangle', 0.06); }
    // two columns
    [0, 1].forEach(tm => { const x = tm ? 700 : 120; this.panel(g, x, 130, 460, 430, 'rgba(20,10,50,0.7)', MG.TEAMC[tm]); g.fillStyle = MG.TEAMC[tm]; this.rr(g, x + 130, 112, 200, 36, 16); g.fill(); this.text(g, mode === '1v3' ? (tm ? 'TEAM OF 3' : 'SOLO') : 'TEAM ' + MG.TEAMN[tm].toUpperCase(), x + 230, 138, 20, '#fff', 'center', 'bold', null); });
    [0, 1, 2, 3].forEach(i => {
      const tm = T.teams[i], col = [0, 1, 2, 3].filter(j => T.teams[j] === tm), k = col.indexOf(i), x = (tm ? 700 : 120) + 230, y = 200 + k * (mode === '1v3' && tm === 0 ? 0 : 118) + (mode === '1v3' && tm === 0 ? 110 : 0);
      if (T.row === i) { g.strokeStyle = '#ffcc33'; g.lineWidth = 4; this.rr(g, x - 200, y - 46, 400, 100, 18); g.stroke(); this.text(g, '◀  ▶', x + 150, y + 10, 22, '#ffcc33', 'center', 'bold', null); }
      this.hero(g, x - 120, y, 36, this.seats[i].char, { mood: 'determined', t: this.t + i, look: { x: tm ? -1 : 1, y: 0 } });
      this.text(g, ELEMENTS[this.seats[i].char].mascot, x + 10, y + 4, 26, ELEMENTS[this.seats[i].char].color, 'center', 'bold');
      this.text(g, this.seats[i].dev ? 'P' + (i + 1) : 'CPU', x + 10, y + 30, 15, SEATC[i], 'center', 'bold', null);
      this.hit(x - 200, y - 46, 400, 100, () => { T.row = i; move(i, 1 - tm); });
    });
    this.button(g, 490, 590, 300, 64, '▶ Start!', true, '#7cf06a'); this.hit(490, 590, 300, 64, () => this.play(T.id, { mode, teams: T.teams.slice() }));
    this.hints(g, [['A', 'Start'], ['Y', 'Random teams'], ['B', 'Back']]);
    if (this.any('a') || this.any('start')) this.play(T.id, { mode, teams: T.teams.slice() });
    if (this.any('b')) this.go(T.back || 'browse');
  },

  // ------------------------------------------------------------------ RING RUMBLE: pick the match type
  scr_ringmenu(g) {
    this.text(g, '🤼 RING RUMBLE', 640, 70, 52, '#ff5a5a'); this.text(g, 'Strikes, grapples, high-flying dives, weapons and finishers — last one standing wins!', 640, 108, 19, '#ffe0e0', 'center', '', null);
    const items = [
      { label: '💥 Fatal 4-Way', sub: 'Every wrestler for themself', fn: () => this.play('ring4', { mode: 'ffa' }), col: '#ffcc33' },
      { label: '🤝 Tag Team (2 vs 2)', sub: 'Pick the teams, then double-team!', fn: () => { this.teamSet = { id: 'ringtag', mode: '2v2', teams: this.randomTeams('2v2'), row: 0, back: 'ringmenu' }; this.go('teams'); }, col: '#7cf06a' },
      { label: '◀ Back', fn: () => this.go('menu'), col: '#c8b8ff' },
    ];
    this.menuList(g, items, 90, 190, 470, 70, 86);
    this.panel(g, 620, 170, 600, 440); this.text(g, 'The Ring Legends', 920, 214, 26, '#ffe680');
    [15, 16, 17, 18, 19].forEach((c, k) => { const x = 690 + k * 115; this.hero(g, x, 330, 34, c, { mood: 'determined', t: this.t + k, look: { x: -0.5, y: 0 } }); this.text(g, ELEMENTS[c].mascot, x, 400, 17, ELEMENTS[c].color, 'center', 'bold'); this.text(g, ELEMENTS[c].name, x, 420, 12, '#d8ccff', 'center', '', null); });
    this.wrap(g, 'Move · Ⓐ strike · Ⓑ grab, pick up, pin, climb. In a grab: Ⓐ knee, Ⓑ slam, direction + Ⓑ whip into the ropes. Full HYPE = finisher!', 920, 470, 540, 24, 17, '#f0ecff', 'center');
    this.hints(g, [['A', 'Choose'], ['B', 'Back']]);
    if (this.any('b')) this.go('menu');
  },

  // ------------------------------------------------------------------ DUEL SETUP: pick the two duelists
  scr_duelpick(g) {
    const T = this.teamSet, gm = MG.byId[T.id];
    this.text(g, gm.name, 640, 60, 40, '#ffe680'); this.text(g, 'A one-on-one duel — pick the two challengers!', 640, 96, 20, '#d8ccff', 'center', '', null);
    if (this.any('left')) T.row = (T.row + 3) % 4; if (this.any('right')) T.row = (T.row + 1) % 4;
    const pick = i => { const inD = T.teams[i] >= 0; if (inD) { T.teams[i] = -1; } else { const used = [0, 1].filter(t => T.teams.includes(t)); const free = [0, 1].find(t => !used.includes(t)); if (free === undefined) { const drop = T.teams.indexOf(1); T.teams[drop] = -1; T.teams[i] = 1; } else T.teams[i] = free; } Sfx.select(this.seats[i].char); };
    if (this.any('x')) pick(T.row);
    if (this.any('y')) { T.teams = this.randomTeams('duel'); Sfx.tone(900, 0.08, 'triangle', 0.06); }
    [0, 1, 2, 3].forEach(i => { const x = 200 + i * 293, y = 330, on = T.teams[i] >= 0, sel = T.row === i;
      this.panel(g, x - 125, y - 150, 250, 300, on ? 'rgba(60,30,90,0.85)' : 'rgba(20,10,50,0.6)', on ? MG.TEAMC[T.teams[i]] : '#5a4a8a');
      if (sel) { g.strokeStyle = '#ffcc33'; g.lineWidth = 5; this.rr(g, x - 130, y - 155, 260, 310, 22); g.stroke(); }
      this.hero(g, x, y - 10, on ? 54 : 44, this.seats[i].char, { mood: on ? 'determined' : 'happy', t: this.t + i, alpha: on ? 1 : 0.55 });
      this.text(g, ELEMENTS[this.seats[i].char].mascot, x, y + 105, 24, ELEMENTS[this.seats[i].char].color, 'center', 'bold');
      this.text(g, on ? '⚔️ DUELIST' : 'watching', x, y + 132, 16, on ? '#ffe680' : '#b6a9e0', 'center', 'bold', null);
      this.hit(x - 125, y - 150, 250, 300, () => { T.row = i; pick(i); }); });
    const ready = T.teams.filter(t => t >= 0).length === 2;
    this.text(g, 'VS', 640, 520, 46, ready ? '#ff6a4a' : 'rgba(255,255,255,0.3)', 'center', 'bold');
    this.button(g, 490, 590, 300, 64, '▶ Duel!', ready, '#7cf06a'); this.hit(490, 590, 300, 64, () => { if (ready) this.play(T.id, { mode: 'duel', teams: T.teams.slice() }); });
    this.hints(g, [['A', 'Start'], ['X', 'Pick / unpick'], ['Y', 'Random pair'], ['B', 'Back']]);
    if (ready && (this.any('a') || this.any('start'))) this.play(T.id, { mode: 'duel', teams: T.teams.slice() });
    if (this.any('b')) this.go('browse');
  },

  // ------------------------------------------------------------------ PLAY + RESULTS
  async play(id, opts) {
    const game = MG.byId[id]; if (!game) return;
    this.busy = true; this.cv.style.visibility = 'hidden';
    let res = null;
    try { res = await MG.run(id, this.players(), [0, 1, 2, 3], opts); } catch (e) { console.error(e); }
    this.cv.style.visibility = 'visible'; this.busy = false; this.mute = 12; this.escQ = false;
    this.last = { id, opts, res };
    if (res && !res.quit && res.scores) this.record(id, opts, res);
    // quitting a challenge game skips it (no stars) so “Next game” really moves on
    else if (opts.challenge && this.ch && this.ch.order[this.ch.idx] === id) { this.ch.log.push({ id, stars: [0, 0, 0, 0], skipped: true }); this.ch.idx++; this.save('ch'); }
    Music.back = 'board'; Music.play('board');
    this.go('post');
    const W = res && res.winners && res.winners.length ? res.winners : [];
    if (W.length) setTimeout(() => Voice.line(this.seats[W[0]].char, 'win'), 900);
  },
  placesOf(scores) { const rk = MG.rank(scores, [0, 1, 2, 3]); const place = [0, 0, 0, 0]; rk.forEach(r => { place[r.i] = 1 + rk.filter(o => o.s > r.s + 1e-9).length; }); return place; },
  record(id, opts, res) {
    const place = this.placesOf(res.scores);
    this.rec.plays++; const gr = this.rec.games[id] = this.rec.games[id] || { plays: 0 }; gr.plays++;
    place.forEach((p, i) => { if (p === 1) { const c = this.seats[i].char; this.rec.wins[c] = (this.rec.wins[c] || 0) + 1; } });
    this.save('rec');
    if (opts.challenge && this.ch) {
      const stars = place.map(p => [3, 2, 1, 0][p - 1] || 0);
      const prev = this.ch.log.find(l => l.id === id); // replaying a challenge game replaces its old result
      if (prev) prev.stars.forEach((s, i) => { this.ch.pts[i] -= s; });
      stars.forEach((s, i) => { this.ch.pts[i] += s; });
      if (prev) prev.stars = stars; else { this.ch.log.push({ id, stars }); this.ch.idx++; }
      this.last.stars = stars; this.save('ch');
    }
  },
  scr_post(g) {
    const L = this.last || {}, game = MG.byId[L.id], res = L.res, ch = L.opts && L.opts.challenge;
    if (!game) { this.go('menu'); return; }
    this.text(g, game.name, 640, 62, 40, '#ffe680');
    if (!res || res.quit || !res.scores) this.text(g, 'Game quit — no result recorded', 640, 140, 26, '#ff9a9a');
    else {
      const place = this.placesOf(res.scores), order = [0, 1, 2, 3].sort((a, b) => place[a] - place[b] || a - b);
      order.forEach((i, k) => {
        const y = 110 + k * 86, s = this.seats[i], win = place[i] === 1;
        g.fillStyle = win ? 'rgba(255,220,120,0.25)' : 'rgba(255,255,255,0.08)'; this.rr(g, 180, y, 600, 74, 18); g.fill();
        g.strokeStyle = L.opts.teams ? MG.TEAMC[L.opts.teams[i]] : ELEMENTS[s.char].color; g.lineWidth = win ? 4 : 2; this.rr(g, 180, y, 600, 74, 18); g.stroke();
        this.hero(g, 240, y + 42, 28, s.char, { mood: win ? 'cheer' : place[i] === 4 ? 'sad' : 'happy', t: this.t + i });
        this.text(g, `${['🥇', '🥈', '🥉', '4th'][place[i] - 1]} ${ELEMENTS[s.char].mascot}`, 290, y + 47, 28, ELEMENTS[s.char].color, 'left', 'bold');
        this.text(g, game.fmt ? game.fmt(res.scores[i]) : String(Math.round(res.scores[i] * 100) / 100), 600, y + 46, 22, '#fff', 'center', '', null);
        if (ch && L.stars) this.text(g, L.stars[i] ? '+' + '★'.repeat(L.stars[i]) : '', 720, y + 48, 26, '#ffd34d', 'center', 'bold');
      });
      if (!ch) { const w = order[0]; this.panel(g, 820, 110, 420, 330); Char.win(g, 1010, 250, 70, this.seats[w].char, this.t); this.text(g, `${ELEMENTS[this.seats[w].char].mascot} wins!`, 1030, 420, 26, ELEMENTS[this.seats[w].char].color); }
      if (ch && this.ch) {
        this.panel(g, 820, 110, 420, 330); this.text(g, 'Challenge standings', 1030, 150, 22, '#ffe680');
        const pts = this.ch.pts; [0, 1, 2, 3].sort((a, b) => pts[b] - pts[a] || a - b).forEach((i, k) => { this.hero(g, 870, 200 + k * 62, 20, this.seats[i].char, { t: this.t + i }); this.text(g, ELEMENTS[this.seats[i].char].mascot, 910, 208 + k * 62, 22, ELEMENTS[this.seats[i].char].color, 'left', 'bold'); this.text(g, '★ ' + pts[i], 1180, 208 + k * 62, 24, '#ffd34d', 'center', 'bold'); });
        this.text(g, `${this.ch.idx} / ${this.ch.order.length} played`, 1030, 430, 16, '#d8ccff', 'center', '', null);
      }
    }
    const items = ch ? [
      { label: this.ch && this.ch.idx >= this.ch.order.length ? '👑 Crown the champion' : '▶ Next game', fn: () => (this.ch.idx >= this.ch.order.length ? this.go('champion') : this.challengeNext()), col: '#7cf06a' },
      { label: '↻ Replay this game', sub: 'The new result replaces the old one', fn: () => this.play(L.id, L.opts), col: '#ffcc33' },
      { label: '◀ Challenge menu', fn: () => this.go('challenge'), col: '#c8b8ff' },
    ] : [
      { label: '↻ Play again', fn: () => this.play(L.id, L.opts.mode === 'ffa' ? L.opts : Object.assign({}, L.opts)), col: '#7cf06a' },
      { label: '🎲 Random game', sub: 'From this list', fn: () => { const list = this.listFor(this.tab || 0).filter(x => x.id !== L.id); const pick = R.pick(list.length ? list : MG.list); this.bsel = this.listFor(this.tab || 0).indexOf(pick); this.startFree(pick); }, col: '#ffcc33' },
      { label: '◀ Back to the games', fn: () => this.go('browse'), col: '#c8b8ff' },
    ];
    this.menuList(g, items, 440, 470, 400, 62, 74);
    if (this.any('b')) (ch ? this.go('challenge') : this.go('browse'));
  },

  // ------------------------------------------------------------------ RECORDS
  scr_records(g) {
    this.text(g, '📜 Records', 640, 64, 44, '#ffe680');
    this.panel(g, 60, 100, 560, 540); this.text(g, 'Most minigame wins', 340, 140, 24, '#ffe680');
    const wins = [...Array(ELEMENTS.length).keys()].map(c => ({ c, n: this.rec.wins[c] || 0 })).sort((a, b) => b.n - a.n).slice(0, 8), mx = Math.max(1, ...wins.map(w => w.n));
    wins.forEach((w, k) => { const y = 176 + k * 56; this.hero(g, 110, y + 18, 18, w.c, { t: this.t + k, noShadow: true }); this.text(g, ELEMENTS[w.c].mascot, 145, y + 26, 20, ELEMENTS[w.c].color, 'left', 'bold'); g.fillStyle = ELEMENTS[w.c].color; this.rr(g, 270, y + 8, 290 * w.n / mx + 4, 24, 12); g.fill(); this.text(g, String(w.n), 580, y + 27, 18, '#fff', 'right', 'bold', null); });
    this.panel(g, 660, 100, 560, 300); this.text(g, 'Challenge champions', 940, 140, 24, '#ffe680');
    if (!this.rec.champs.length) this.text(g, 'No champion yet — finish a Challenge!', 940, 250, 18, '#d8ccff', 'center', '', null);
    this.rec.champs.slice(0, 4).forEach((c, k) => { const y = 180 + k * 52; c.who.forEach((w, j) => this.hero(g, 700 + j * 40, y + 10, 16, w, { mood: 'cheer', t: this.t + k })); this.text(g, `${c.who.map(w => ELEMENTS[w].mascot).join(' & ')} · ★${c.pts} / ${c.games} games`, 760 + (c.who.length - 1) * 40, y + 18, 18, '#fff', 'left', '', null); });
    this.panel(g, 660, 420, 560, 220); this.text(g, 'Party stats', 940, 460, 24, '#ffe680');
    const fav = Object.entries(this.rec.games).sort((a, b) => b[1].plays - a[1].plays)[0];
    this.text(g, `Minigames played: ${this.rec.plays}`, 940, 510, 20, '#fff', 'center', '', null);
    this.text(g, `Different games tried: ${Object.keys(this.rec.games).length} / ${MG.list.length}`, 940, 550, 20, '#fff', 'center', '', null);
    if (fav && MG.byId[fav[0]]) this.text(g, `Favourite: ${MG.byId[fav[0]].name} (${fav[1].plays}×)`, 940, 590, 20, '#8fe0ff', 'center', '', null);
    this.hints(g, [['B', 'Back']]);
    if (this.any('b') || this.any('a')) this.go('menu');
  },

  // ------------------------------------------------------------------ SETTINGS + CONTROLS
  scr_settings(g) {
    this.text(g, '⚙️ Settings', 640, 64, 44, '#ffe680');
    const on = v => (v ? 'ON' : 'OFF');
    const items = [
      { label: `🔊 Sound: ${on(Settings.sound)}`, fn: () => { Settings.sound = !Settings.sound; this.save('set'); } },
      { label: `🎵 Music: ${on(Settings.music)}`, fn: () => { Settings.music = !Settings.music; Music.refresh(); this.save('set'); } },
      { label: `🏃 Practice before games: ${on(Settings.practice !== false)}`, sub: 'START / SELECT ends practice', fn: () => { Settings.practice = Settings.practice === false; this.save('set'); } },
      { label: '🎮 Controls…', sub: 'Change any player’s buttons', fn: () => { this.ctl = { seat: 0, row: 0, listen: null }; this.go('controls'); } },
      { label: '◀ Back', fn: () => this.go('menu'), col: '#c8b8ff' },
    ];
    this.menuList(g, items, 340, 120, 600, 70, 86);
    this.hints(g, [['A', 'Change'], ['B', 'Back']]);
    if (this.any('b')) this.go('menu');
  },
  scr_controls(g) {
    const C = this.ctl, i = C.seat, acts = Input.ACTIONS, rows = acts.length + 1;
    this.text(g, `🎮 Controls · Player ${i + 1}`, 640, 56, 38, '#ffe680');
    this.text(g, '◀ ▶ change player · A on a row, then press the new key or gamepad button · Esc cancels', 640, 88, 16, '#d8ccff', 'center', '', null);
    if (C.listen !== null) {
      // waiting for a key or a gamepad button
      const act = acts[C.listen];
      if (Input.lastKey && Input.lastKey !== C.startKey) { if (Input.lastKey === 'Escape') C.listen = null; else { Input.maps[i][act] = [Input.lastKey]; Input.saveControls(); Sfx.tone(880, 0.1, 'triangle', 0.07); C.listen = null; } Input.lastKey = null; }
      else { Input.pads().some(p => { const k = p.buttons.findIndex((b, n) => b.pressed && !(C.padPrev || []).includes(n)); if (k >= 0 && !['up', 'down', 'left', 'right'].includes(act)) { Input.padMaps[i][act] = k; Input.saveControls(); Sfx.tone(880, 0.1, 'triangle', 0.07); C.listen = null; return true; } return false; }); }
      if (C.listen !== null) C.padPrev = Input.pads().flatMap(p => p.buttons.map((b, n) => b.pressed ? n : -1)).filter(n => n >= 0);
    } else {
      if (this.any('left')) C.seat = (C.seat + 3) % 4; if (this.any('right')) C.seat = (C.seat + 1) % 4;
      if (this.any('up')) C.row = (C.row + rows - 1) % rows; if (this.any('down')) C.row = (C.row + 1) % rows;
      if (this.any('a')) { if (C.row === acts.length) { Input.resetControls(i); Sfx.tone(600, 0.1, 'triangle', 0.06); } else { C.listen = C.row; Input.lastKey = null; C.startKey = null; C.padPrev = Input.pads().flatMap(p => p.buttons.map((b, n) => b.pressed ? n : -1)).filter(n => n >= 0); } }
      if (this.any('b')) { this.go('settings'); return; }
    }
    this.panel(g, 240, 104, 800, 580);
    this.text(g, 'Action', 330, 140, 18, '#ffe680', 'left'); this.text(g, 'Keyboard', 620, 140, 18, '#ffe680'); this.text(g, 'Gamepad', 880, 140, 18, '#ffe680');
    acts.forEach((a, k) => {
      const y = 152 + k * 34, on = C.row === k;
      if (on) { g.fillStyle = C.listen === k ? 'rgba(255,90,90,0.4)' : 'rgba(255,204,51,0.3)'; this.rr(g, 270, y, 740, 30, 10); g.fill(); }
      this.text(g, a.toUpperCase(), 330, y + 22, 17, '#fff', 'left', 'bold', null);
      this.text(g, C.listen === k ? 'press a key / button…' : (Input.maps[i][a] || []).map(c => Input.keyLabel(c)).join(' / '), 620, y + 22, 17, '#fff', 'center', '', null);
      this.text(g, ['up', 'down', 'left', 'right'].includes(a) ? 'stick / d-pad' : (Input.PADNAMES[Input.padMaps[i][a]] || '#' + Input.padMaps[i][a]), 880, y + 22, 17, '#8fe0ff', 'center', '', null);
      this.hit(270, y, 740, 30, () => { C.row = k; C.listen = k; Input.lastKey = null; C.padPrev = []; });
    });
    const y = 152 + acts.length * 34; if (C.row === acts.length) { g.fillStyle = 'rgba(255,204,51,0.3)'; this.rr(g, 270, y, 740, 30, 10); g.fill(); }
    this.text(g, '↺ Reset this player to the defaults', 640, y + 22, 17, '#ffe680', 'center', 'bold', null);
  },
};
