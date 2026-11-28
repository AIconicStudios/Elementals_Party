'use strict';
// =====================================================================================================
// The Crossing: in-game Help (spaces, items, forks & guardians, dice, rules) and a free-look Map.
// Open them from the turn menu, the pause menu, or F1 (help) / F2 (map). B or Esc closes.
// =====================================================================================================
(() => {
  const held = k => { for (let i = 0; i < 4; i++) { const st = Input.state(i); if (st && st[k]) return true; } return false; };
  const TABS = [['spaces', '🎲 Spaces'], ['items', '🎒 Items'], ['forks', '🔀 Forks & guardians'], ['dice', '🎲 Dice'], ['rules', '📖 Rules']];

  Board.openOverlay = function (kind) {
    return new Promise(res => {
      if (kind === 'map') this.mapView = { x: this.cam.x, y: this.cam.y, z: Math.min(this.camZ, 0.6), res, t: 0, saved: { x: this.cam.x, y: this.cam.y, z: this.camZ } };
      else this.help = { tab: this.helpTab || 0, scroll: 0, res, t: 0 };
    });
  };
  const closeOverlay = B => {
    if (B.help) { const r = B.help.res; B.helpTab = B.help.tab; B.help = null; r && r(); }
    if (B.mapView) { const r = B.mapView.res, s = B.mapView.saved; B.cam.x = s.x; B.cam.y = s.y; B.camZ = s.z; B.mapView = null; r && r(); }
    Sfx.tone(600, 0.05, 'triangle', 0.04);
  };

  // choosing a road at a fork: arrows on the board itself (left/right or up/down to switch, A to go)
  Board.forkPick = function (i, pos, opts, botFn, steps) {
    const p = this.game.P(i);
    return new Promise(res => {
      const first = opts.findIndex(o => !o.off), pick = k => { this.ui.fork = null; res(opts[k].value); };
      if (Settings.test) { const v = botFn(); res(v); return; }
      this.ui.fork = { pos, t: 0, opts, sel: Math.max(0, first), i, steps, human: p.human, botT: 1.1 * this.sp(), botV: p.human ? null : botFn(), pick };
    });
  };
  const forkUpdate = (B, dt) => { const F = B.ui.fork; if (!F || B.ui.banner || B.paused) return false; F.t += dt;
    if (!F.human) { if (F.t > F.botT * 0.45) F.sel = Math.max(0, F.opts.findIndex(o => o.value === F.botV)); if (F.t > F.botT) F.pick(F.sel); return true; }
    const ev = B.devOf(F.i), mv = d => { for (let q = 0; q < F.opts.length; q++) { F.sel = (F.sel + d + F.opts.length) % F.opts.length; if (!F.opts[F.sel].off) break; } Sfx.tone(880, 0.03, 'triangle', 0.03); };
    if (ev.left || ev.up) mv(-1); if (ev.right || ev.down) mv(1);
    if (ev.a && F.t > 0.25 && !F.opts[F.sel].off) { Sfx.tone(700, 0.08, 'triangle', 0.07); F.pick(F.sel); }
    return false; };
  // while Help or the Map is open the game simply waits
  const oldUpdate = Board.update.bind(Board);
  Board.update = function (dt) {
    if (this.help) { const H = this.help; H.t += dt;
      if (Shell.any('left') || Shell.any('lb')) { H.tab = (H.tab + TABS.length - 1) % TABS.length; H.scroll = 0; Sfx.tone(880, 0.03, 'triangle', 0.03); }
      if (Shell.any('right') || Shell.any('rb')) { H.tab = (H.tab + 1) % TABS.length; H.scroll = 0; Sfx.tone(880, 0.03, 'triangle', 0.03); }
      if (held('down')) H.scroll += dt * 520; if (held('up')) H.scroll = Math.max(0, H.scroll - dt * 520);
      if (H.t > 0.25 && (Shell.any('b') || (Shell.ev.esc && Shell.ev.esc.b) || Shell.any('start'))) closeOverlay(this);
      this.t += dt; return; }
    if (this.mapView) { const M = this.mapView; M.t += dt; const sp = 700 / M.z;
      if (held('left')) M.x -= sp * dt; if (held('right')) M.x += sp * dt; if (held('up')) M.y -= sp * dt; if (held('down')) M.y += sp * dt;
      if (Shell.any('a')) M.z = M.z < 0.7 ? 1.0 : 0.36;
      M.x = clamp(M.x, 0, BD.W); M.y = clamp(M.y, 0, BD.H);
      this.cam.x += (M.x - this.cam.x) * Math.min(1, dt * 8); this.cam.y += (M.y - this.cam.y) * Math.min(1, dt * 8); this.camZ += (M.z - this.camZ) * Math.min(1, dt * 6);
      if (M.t > 0.25 && (Shell.any('b') || (Shell.ev.esc && Shell.ev.esc.b) || Shell.any('start'))) closeOverlay(this);
      this.t += dt; return; }
    forkUpdate(this, dt);
    oldUpdate(dt);
  };
  const oldDraw = Board.draw.bind(Board);
  Board.draw = function (g, dt) {
    if (this.mapView) { const keep = { ui: this.ui }; this.ui = {}; oldDraw(g, dt); this.ui = keep.ui; this.drawMapUI(g); return; }
    oldDraw(g, dt);
    const F = this.ui.fork; if (F && !this.ui.banner) { const p = this.game.P(F.i); g.fillStyle = 'rgba(24,12,52,0.9)'; Shell.rr(g, 390, 640, 500, 56, 20); g.fill(); g.strokeStyle = p.color; g.lineWidth = 3; g.stroke(); Shell.text(g, F.human ? `${p.name}: pick a road with ◀ ▶ and press Ⓐ (${F.steps} to go)` : `${p.name} is choosing a road…`, 640, 675, 17, '#fff'); }
    if (this.help) this.drawHelp(g);
  };
  // F1 = help, F2 = map, any time on the board
  window.addEventListener('keydown', e => { if (Shell.screen !== 'board' || !Board.game || Board.paused) return;
    if (e.key === 'F1') { e.preventDefault(); if (Board.help) closeOverlay(Board); else if (!Board.mapView) Board.openOverlay('help'); }
    if (e.key === 'F2') { e.preventDefault(); if (Board.mapView) closeOverlay(Board); else if (!Board.help) Board.openOverlay('map'); } });

  // pause menu: resume, help, map, quit
  Board.drawPause = function (g) {
    g.fillStyle = 'rgba(10,6,30,0.7)'; g.fillRect(0, 0, 1280, 720);
    Shell.text(g, 'Paused', 640, 200, 44, '#ffe680');
    const opts = ['▶ Resume', '📖 Help', '🗺️ Look at the map', '🏠 Quit to menu'], n = opts.length; this.pauseSel = (this.pauseSel || 0) % n;
    opts.forEach((o, k) => { Shell.button(g, 470, 240 + k * 84, 340, 64, o, this.pauseSel === k, k === 3 ? '#ff9a9a' : k ? '#9fd8ff' : '#7cf06a'); Shell.hit(470, 240 + k * 84, 340, 64, () => this.pauseDo(k), () => { this.pauseSel = k; }); });
    if (Shell.any('up')) this.pauseSel = (this.pauseSel + n - 1) % n; if (Shell.any('down')) this.pauseSel = (this.pauseSel + 1) % n;
    if (Shell.any('a') && performance.now() - this.pauseWall > 250) this.pauseDo(this.pauseSel);
    if (Shell.any('b') && performance.now() - this.pauseWall > 400) this.pauseDo(0);
  };
  Board.pauseDo = function (k) { this.paused = false; Settings.paused = false; if (k === 1) this.openOverlay('help'); if (k === 2) this.openOverlay('map'); if (k === 3) this.quit(); };

  // ----------------------------------------------------------------- the map's own UI
  Board.drawMapUI = function (g) {
    const G = this.game;
    g.fillStyle = 'rgba(20,12,44,0.82)'; Shell.rr(g, 340, 8, 600, 44, 22); g.fill(); g.strokeStyle = '#9fd8ff'; g.lineWidth = 2; g.stroke();
    Shell.text(g, '🗺️ Map — move to look around · Ⓐ zoom · Ⓑ back', 640, 38, 18, '#fff');
    // where everyone is
    G.players.forEach((p, i) => { const T = this.tok[i], s = this.toScreen(T.x, T.y - 120 * this.camZ); g.fillStyle = 'rgba(20,12,44,0.85)'; Shell.rr(g, s.x - 44, s.y - 14, 88, 22, 11); g.fill(); g.strokeStyle = p.color; g.lineWidth = 2; g.stroke(); Shell.text(g, p.name, s.x, s.y + 3, 13, p.color); });
    const sb = BD.spaces[G.starBank * 10 + 5], s = this.toScreen(sb.x, sb.y); MGH.star(g, s.x, s.y - 50 * this.camZ - 20, 14, '#ffe680', this.t * 2, false);
    // a legend of the space types, bottom-left
    const types = Object.keys(BD.SPACE), cols = 3, w = 210, rows = Math.ceil(types.length / cols), x0 = 20, y0 = 720 - rows * 26 - 30;
    g.fillStyle = 'rgba(20,12,44,0.8)'; Shell.rr(g, x0 - 10, y0 - 26, cols * w + 20, rows * 26 + 40, 14); g.fill();
    Shell.text(g, 'Spaces', x0, y0 - 6, 14, '#ffe680', 'left');
    types.forEach((k, n) => { const T = BD.SPACE[k], x = x0 + (n % cols) * w, y = y0 + 14 + Math.floor(n / cols) * 26; g.fillStyle = T.col; g.beginPath(); g.arc(x + 10, y - 4, 10, 0, 7); g.fill(); g.strokeStyle = T.dark; g.lineWidth = 2; g.stroke(); Shell.text(g, T.icon, x + 10, y + 1, 11, '#fff'); Shell.text(g, T.name, x + 26, y + 1, 13, '#fff', 'left'); });
  };

  // ----------------------------------------------------------------- the help book
  Board.drawHelp = function (g) {
    const H = this.help, G = this.game, tab = TABS[H.tab][0];
    g.fillStyle = 'rgba(8,4,24,0.88)'; g.fillRect(0, 0, 1280, 720);
    g.fillStyle = 'rgba(40,26,80,0.95)'; Shell.rr(g, 60, 30, 1160, 660, 24); g.fill(); g.strokeStyle = '#ffe680'; g.lineWidth = 3; g.stroke();
    // tabs
    TABS.forEach(([k, label], n) => { const x = 90 + n * 222, on = n === H.tab; g.fillStyle = on ? '#ffe680' : 'rgba(255,255,255,0.1)'; Shell.rr(g, x, 46, 212, 40, 14); g.fill(); Shell.text(g, label, x + 106, 72, 16, on ? '#2a1a4a' : '#fff'); Shell.hit(x, 46, 212, 40, () => { H.tab = n; H.scroll = 0; }); });
    Shell.text(g, '◀ ▶ / LB RB: change page · ▲▼: scroll · Ⓑ: back to the game', 640, 676, 14, '#b6a9e0');
    g.save(); g.beginPath(); g.rect(80, 100, 1120, 560); g.clip(); g.translate(0, -H.scroll);
    let y = 130; const line = (icon, col, dark, title, sub, desc) => {
      g.fillStyle = 'rgba(255,255,255,0.05)'; Shell.rr(g, 96, y - 24, 1088, 58, 14); g.fill();
      g.fillStyle = col; g.beginPath(); g.arc(130, y + 5, 22, 0, 7); g.fill(); if (dark) { g.strokeStyle = dark; g.lineWidth = 3; g.stroke(); }
      Shell.text(g, icon, 130, y + 12, 20, '#fff');
      Shell.text(g, title, 166, y, 18, '#ffe680', 'left'); if (sub) Shell.text(g, sub, 1170, y, 14, '#9fd8ff', 'right');
      Shell.text(g, desc, 166, y + 22, 14, '#fff', 'left'); y += 66; };
    const head = t => { Shell.text(g, t, 100, y, 20, '#9fd8ff', 'left'); y += 38; };
    if (tab === 'spaces') Object.entries(BD.SPACE).forEach(([k, T]) => line(T.icon, T.col, T.dark, T.name, '', T.desc));
    if (tab === 'items') { head('Buy these at banks (one purchase per turn). Use one item per turn.');
      Object.entries(BD.ITEMS).forEach(([k, it]) => line(it.icon, '#5a3a8a', '#ffe680', it.name, `${G.price ? G.price(k) : it.price} coins · ${({ play: 'use on your turn', target: 'use on a rival', raid: 'used when you raid', install: 'install at your Hold', pass: 'used automatically', snare: 'set on your space' })[it.kind] || ''}${it.zoo ? ' · sold at the Zoo' : it.rare ? ' · rare' : ''}`, it.desc)); }
    if (tab === 'forks') { const tod = G.tod;
      head('Each inner path has a guardian at its fork (prices change with the time of day):');
      G.guard.forEach((kind, f) => { const Gd = BD.GUARDS[kind], B = BD.BRANCHES[f];
        const d = kind === 'collector' ? `Pay ${Gd.toll[tod]} coins to take ${B.name} (day ${Gd.toll.day} · golden ${Gd.toll.golden} · night ${Gd.toll.night}).` : kind === 'alternator' ? `Blocks one road and switches every round. Slipping past costs ${Gd.toll[tod]} coins. Right now he blocks the ${G.alt[f] === 'main' ? 'main road' : B.name}.` : kind === 'competitor' ? `Roll higher than his d${Gd.die[tod]} to enter ${B.name}, or you go down the main road.` : `Locked: you need a 🗝️ Gate Key to enter ${B.name}.`;
        line(Gd.icon, '#3a5a8a', '#9fd8ff', `${B.icon} ${B.name} — ${Gd.name}`, '', d); });
      y += 10; head(`Today's rule: ${G.rule.icon} ${G.rule.name} — ${G.rule.desc}`);
      head('Weather (chosen at the Weather Vane, lasts one round):'); Object.values(BD.WEATHER).forEach(W => line(W.icon, '#4a6a8a', null, W.name, '', W.desc)); }
    if (tab === 'dice') { head('Each turn pick a dice block:');
      line('🎲', '#6b5bd6', null, 'Regular dice', '1 – 10', 'Anything from 1 to 10.');
      line('🛡️', '#3a8a5a', null, 'Safe dice', '3 – 6', 'Never too far, never too short.');
      G.players.forEach(p => { const D = BD.cdie(p); line('✨', p.color, null, `${p.name}'s ${D.name} dice`, D.faces.join(' · '), D.desc + '. 🪙 faces give coins, 🧲 pinches coins, 🎁 grows an item — no moving on those.'); }); }
    if (tab === 'rules') { const R2 = [
        ['⭐', 'Stars win', `Buy the star at the glowing bank (${G.starPrice ? G.starPrice() : BD.STAR} coins now: cheaper at golden hour, dearer at night). It then flies to another bank.`],
        ['🔁', 'A turn', 'Use one item if you like, pick a dice block, move. Passing a bank lets you buy the star; passing the Zoo lets you feed the beast.'],
        ['🤝', 'Meeting a rival', 'Land on a rival and choose: punch (take 3 coins), duel for a star, or duel for coins. Rivals only risk what they carry — you may stake your banked coins or stars.'],
        ['👁️', 'The Ankar', 'Roams 3 spaces after every turn and snatches 1–15 coins from anyone it passes. It gets angrier every round; once RED it swallows a carried star, then calms down. It only takes what you carry — bank it!'],
        ['🐦', 'Golden-hour thieves', 'Magpies peck 5 coins from anyone carrying 20+, and Bandit Camps rob harder at golden hour (and may take a star at night).'],
        ['😄', 'Emotes & dodges', 'Press Ⓨ any time to pop an emote over your character. When a thief lunges, press Ⓐ just as the closing ring meets the circle to dodge and keep half.'],
        ['🛒', 'Shopping', 'One item purchase per turn. Buying the star does not count as an item.'],
        ['🏰', 'Holds', 'Pass your own Gate to stash coins and stars. From round 3 rivals can raid Holds — not while the owner is within 5 spaces of home.'],
        ['🎮', 'Minigames', 'After every round: 1st gets 10 coins, 2nd 5, 3rd 2. Last place picks which game.'],
        ['📜', 'Bounty', 'The Bounty Board puts a price on the leader. Land on the WANTED player to collect it.'],
        ['🔥', 'Final Frenzy', 'The last 5 rounds: blue and red spaces count double.'],
        ['🎁', 'Comebacks', 'Every third round the player in last place gets a random item.'],
        ['🏆', 'The end', 'Secret bonus stars are handed out, then most stars wins — coins break ties.'],
      ]; R2.forEach(([i, t, d]) => line(i, '#6b5bd6', null, t, '', d)); }
    H.maxScroll = Math.max(0, y - 640); H.scroll = Math.min(H.scroll, H.maxScroll);
    g.restore();
  };
})();
