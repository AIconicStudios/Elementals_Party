'use strict';
// =====================================================================================================
// THE CROSSING — the party board.
//   A loop of 40 spaces around a meadow. Each player owns a Hold (a platform off one corner of the loop,
//   reached from its Gate space) where they can stash coins, stars and items. Rivals can RAID a Hold:
//   it costs coins, the guard dog may chase them off, and a roulette made from what's stashed decides the
//   loot — the odds change with the time of day (day: mostly nothing, night: rich pickings, golden hour:
//   the best chance at a star). The STAR is sold at one of four banks at a time and hops to another bank
//   whenever someone buys it. The last 5 rounds are the FINAL FRENZY: spaces pay double and landing on
//   a rival starts a DUEL with a coin-or-star roulette. Optional hidden BONUS STARS at the end.
// =====================================================================================================

const BD = {
  W: 1600, H: 1000,
  CORNERS: [{ x: 340, y: 190 }, { x: 1260, y: 190 }, { x: 1260, y: 810 }, { x: 340, y: 810 }],
  HOLDS: [{ x: 168, y: 96 }, { x: 1432, y: 96 }, { x: 1432, y: 904 }, { x: 168, y: 904 }],
  // one quarter of the loop: every quarter starts with a Gate (corner) and has a Bank in the middle
  QUARTERS: [
    ['gate', 'blue', 'lucky', 'blue', 'red', 'bank', 'blue', 'item', 'red', 'event'],
    ['gate', 'blue', 'item', 'red', 'blue', 'bank', 'blue', 'lucky', 'swirl', 'blue'],
    ['gate', 'blue', 'lucky', 'blue', 'red', 'bank', 'blue', 'item', 'red', 'event'],
    ['gate', 'red', 'item', 'blue', 'blue', 'bank', 'lucky', 'blue', 'swirl', 'blue'],
  ],
  SPACE: {
    blue:  { name: 'Blue space', col: '#3d7bff', dark: '#1f4ab8', icon: '+3', desc: 'Gain 3 coins (6 in the Final Frenzy).' },
    red:   { name: 'Red space', col: '#e8443a', dark: '#a82418', icon: '−3', desc: 'Lose 3 coins (6 in the Final Frenzy).' },
    item:  { name: 'Item space', col: '#3ac85a', dark: '#1f8a3a', icon: '🎁', desc: 'Get a free item.' },
    lucky: { name: 'Lucky space', col: '#ffc83a', dark: '#c8901a', icon: '🍀', desc: 'Spin Alin\'s lucky wheel.' },
    event: { name: 'Windmill space', col: '#9a5ae8', dark: '#5a2aa8', icon: '🌬️', desc: 'The windmill stirs up trouble for everyone.' },
    swirl: { name: 'Swirl space', col: '#2ac8c8', dark: '#1a8a8a', icon: '🌀', desc: 'Swap places with a random rival.' },
    gate:  { name: 'Gate', col: '#d8c08a', dark: '#8a7040', icon: '🏰', desc: 'Your own: visit your Hold. A rival\'s: raid their Hold (from round 3).' },
    chest: { name: 'Treasure Chest', col: '#d8903a', dark: '#8a5218', icon: '🧰', desc: 'Pick one of three chests: a fortune, a trinket… or a snapping mimic.' },
    geyser:{ name: 'Geyser', col: '#5ad8ff', dark: '#1a7ab8', icon: '⛲', desc: 'Whoosh! Launched forward 3 more spaces.' },
    mush:  { name: 'Mushroom', col: '#ff7a5a', dark: '#b83a2a', icon: '🍄', desc: 'Your next roll gets +3.' },
    bank:  { name: 'Bank', col: '#f4d36a', dark: '#b8902a', icon: '🏦', desc: 'Buy the ⭐ here when it\'s on sale. Land here to shop.' },
  },
  STAR: 20, RAID: 5, RAIDCAP: 10, NEAR: 5, PUNCH: 3, BAG: 3,
  BANK_NAMES: ['North Bank', 'East Bank', 'South Bank', 'West Bank'],
  TOD: { day: { name: 'Day', icon: '☀️', col: '#ffe680' }, golden: { name: 'Golden hour', icon: '🌇', col: '#ffb04a' }, night: { name: 'Night', icon: '🌙', col: '#9fb8ff' } },
  ITEMS: {
    dice2:   { name: 'Double Dice', icon: '🎲', price: 5, kind: 'play', desc: 'Roll two dice this turn.' },
    curse:   { name: 'Snail Curse', icon: '🐌', price: 5, kind: 'target', desc: 'A rival\'s next roll is only 1–3.' },
    swap:    { name: 'Swap Swirl', icon: '🔄', price: 8, kind: 'target', desc: 'Swap places with a rival of your choice.' },
    magnet:  { name: 'Coin Magnet', icon: '🧲', price: 6, kind: 'target', desc: 'Pull 5 coins from a rival\'s pocket.' },
    compass: { name: 'Star Compass', icon: '🧭', price: 12, kind: 'play', desc: 'Warp right next to the bank selling the star.' },
    whistle: { name: 'Dog Whistle', icon: '🦴', price: 3, kind: 'raid', desc: 'Your next raid: the guard dog lets you through.' },
    lantern: { name: 'Night Lantern', icon: '🏮', price: 4, kind: 'raid', desc: 'Your next raid counts as night, whatever the time.' },
    charm:   { name: 'Lucky Charm', icon: '🍀', price: 5, kind: 'raid', desc: 'Your next raid spins twice and keeps the better result.' },
    padlock: { name: 'Padlock', icon: '🔒', price: 4, kind: 'install', desc: 'Install at your Hold: the next 2 raids lose their 2 best slots.' },
    decoy:   { name: 'Decoy Chest', icon: '📦', price: 3, kind: 'install', desc: 'Install at your Hold: adds 4 empty slots to the next 2 raids.' },
    trap:    { name: 'Spring Trap', icon: '🪤', price: 6, kind: 'install', desc: 'Install at your Hold: the next raider is caught, gets nothing and pays you 8 coins.' },
  },
  // inner paths: each leaves its side at space 2 and rejoins at space 8, skipping that side's bank
  BRANCHES: [
    { name: 'Pinecone Path', icon: '🌲', types: ['chest', 'red', 'geyser', 'mush', 'chest'] },
    { name: 'Crystal Creek', icon: '💎', types: ['mush', 'chest', 'red', 'chest', 'geyser'] },
    { name: 'Mossy Hollow', icon: '🍄', types: ['chest', 'geyser', 'red', 'mush', 'blue'] },
    { name: 'Lantern Lane', icon: '🏮', types: ['geyser', 'chest', 'mush', 'red', 'chest'] },
  ],
  // the loop: 10 spaces per side, gates on the corners, clockwise from top-left; then the inner paths
  build() {
    const S = []; const C = this.CORNERS;
    for (let side = 0; side < 4; side++) {
      const a = C[side], b = C[(side + 1) % 4];
      for (let k = 0; k < 10; k++) { const f = k / 10; S.push({ i: side * 10 + k, x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, type: this.QUARTERS[side][k], side, m: side * 10 + k }); }
    }
    S.forEach(s => { s.nx = [(s.i + 1) % 40]; if (s.type === 'gate') s.owner = s.i / 10; if (s.type === 'bank') s.bank = (s.i - 5) / 10; });
    this.BRANCHES.forEach((B, side) => {
      const A = S[side * 10 + 2], E = S[side * 10 + 8], dep = side % 2 ? 165 : 150, inw = [[0, 1], [-1, 0], [0, -1], [1, 0]][side];
      const cx = (A.x + E.x) / 2 + inw[0] * dep * 2, cy = (A.y + E.y) / 2 + inw[1] * dep * 2; B.ctrl = { x: cx, y: cy }; B.a = A.i; B.b = E.i; B.ids = [];
      B.types.forEach((type, k) => { const f = (k + 1) / 6, u = 1 - f, id = S.length; B.ids.push(id);
        S.push({ i: id, x: u * u * A.x + 2 * u * f * cx + f * f * E.x, y: u * u * A.y + 2 * u * f * cy + f * f * E.y, type, side, branch: side, m: side * 10 + 2 + k + 1, nx: [k < 4 ? id + 1 : E.i] }); });
      A.nx.push(B.ids[0]); A.fork = side;
    });
    return S;
  },
  // fewest steps from a to b along the arrows
  dist(a, b) { if (a === b) return 0; const seen = { [a]: 0 }, q = [a]; while (q.length) { const c = q.shift(); for (const n of this.spaces[c].nx) if (seen[n] === undefined) { seen[n] = seen[c] + 1; if (n === b) return seen[n]; q.push(n); } } return 99; },
};
BD.spaces = BD.build();
BD.todOf = (round, rounds) => ['day', 'day', 'golden', 'night', 'night'][(round - 1) % 5];

// =====================================================================================================
class BoardGame {
  constructor(players, opts) {
    this.rounds = opts.rounds || 12; this.bonus = opts.bonus !== false;
    this.round = 0; this.aborted = false; this.log = [];
    this.players = players.map((p, i) => Object.assign({}, p, { i, pos: i * 10 + 1, coins: 10, stars: 0, items: [], curse: false, mods: {},
      st: { mgWins: 0, reds: 0, robbed: 0, stolen: 0, moved: 0, spent: 0, events: 0, duelWins: 0, bad: 0, punched: 0 } }));
    this.holds = this.players.map(() => ({ coins: 0, stars: 0, items: [], padlock: 0, decoy: 0, trap: 0 }));
    this.starBank = R.int(0, 3); this.order = R.shuffle([0, 1, 2, 3]); this.brawlUsed = false; this.played = [];
    this.n = { stars: 0, raids: 0, raidStar: 0, raidCoins: 0, raidNothing: 0, dog: 0, trap: 0, duels: 0, punches: 0, stash: 0, items: 0, frenzy: 0 };
  }
  get tod() { return BD.todOf(Math.max(1, this.round), this.rounds); }
  get frenzy() { return this.round > this.rounds - 5; }
  P(i) { return this.players[i]; }
  totStars(i) { return this.players[i].stars + this.holds[i].stars; }
  totCoins(i) { return this.players[i].coins + this.holds[i].coins; }
  standings() { return [0, 1, 2, 3].slice().sort((a, b) => this.totStars(b) - this.totStars(a) || this.totCoins(b) - this.totCoins(a)); }
  rankOf(i) { const s = this.standings(); return 1 + s.filter(j => this.totStars(j) > this.totStars(i) || (this.totStars(j) === this.totStars(i) && this.totCoins(j) > this.totCoins(i))).length; }
  chk() { if (this.aborted) throw new Error('board-aborted'); }
  gain(i, n, why) { const p = this.P(i); if (n > 0) { p.coins += n; Board.float(i, `+${n}🪙`, '#ffe680'); Sfx.coin(); } else if (n < 0) { const t = Math.min(p.coins, -n); p.coins -= t; if (t) Board.float(i, `−${t}🪙`, '#ff8a8a'); Sfx.bad(); return t; } return n; }
  giveItem(i, id) { const p = this.P(i); if (p.items.length >= BD.BAG) { this.gain(i, 3); return false; } p.items.push(id); Board.float(i, `+${BD.ITEMS[id].icon}`, '#9fffa0'); Sfx.pop(); return true; }
  randItem() { return R.pick(Object.keys(BD.ITEMS)); }

  // ------------------------------------------------------------------ the whole game
  async run() {
    Board.cam.z = 0.66; Board.cam.x = 800; Board.cam.y = 500; Board.focus = null;
    await Board.banner('Welcome to the Crossing!', `I'm Alin, your host! ${this.rounds} rounds. Buy ⭐ stars at the bank that has one, stash treasure in your Hold — and raid your rivals'!`, 4200);
    await Board.banner('Turn order', this.order.map(i => this.P(i).name).join(' → '), 2200);
    for (this.round = 1; this.round <= this.rounds; this.round++) {
      this.chk();
      const T = BD.TOD[this.tod];
      if (this.round === this.rounds - 4) await this.startFrenzy();
      await Board.banner(`Round ${this.round} of ${this.rounds}`, `${T.icon} ${T.name}${this.tod === 'night' ? ' — raids are rich pickings!' : this.tod === 'golden' ? ' — the best time to raid for a star!' : this.round < 3 ? '' : ' — raids mostly come up empty.'}`, 1900);
      for (const i of this.order) { this.chk(); await this.turn(i); }
      this.chk();
      await this.minigame();
    }
    await this.finish();
  }
  async startFrenzy() {
    await Board.banner('🔥 FINAL FRENZY! 🔥', 'Last 5 rounds: every blue and red space counts DOUBLE, and landing on a rival starts a DUEL!', 3600);
    const last = this.standings()[3], p = this.P(last);
    await Board.banner(`${p.name} is in last place…`, 'Alin gives them 10 coins and a free item to catch up!', 2600);
    this.gain(last, 10); this.giveItem(last, this.randItem());
  }

  // ------------------------------------------------------------------ one player's turn
  async turn(i) {
    const p = this.P(i); Board.focus = i; Board.current = i; Board.cam.z = 1.12;
    await Board.banner(`${p.name}'s turn`, '', 900, true);
    let roll = null;
    while (!roll) {
      this.chk();
      const opts = [{ label: '🎲 Roll the dice', value: 'roll' }];
      for (const id of [...new Set(p.items)]) { const it = BD.ITEMS[id]; if (it.kind === 'raid') continue; opts.push({ label: `${it.icon} ${it.kind === 'install' ? 'Install' : 'Use'} ${it.name}`, value: id, desc: it.desc }); }
      const v = opts.length === 1 ? 'roll' : await Board.ask(i, `${p.name}'s turn`, opts, () => BoardAI.turnPick(this, i));
      if (v === 'roll') { roll = await this.roll(i); break; }
      await this.useItem(i, v);
    }
    await this.move(i, roll);
    await sleep(350);
  }
  async roll(i) {
    const p = this.P(i), m = p.mods; p.mods = {};
    const faces = p.curse ? [1, 2, 3] : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; const cursed = p.curse; p.curse = false;
    let v = await Board.dice(i, faces);
    if (m.dice2) { await sleep(250); const v2 = await Board.dice(i, faces, v); v += v2; }
    if (cursed) Board.float(i, '🐌 cursed!', '#c8b8ff');
    if (p.mush) { v += p.mush; Board.float(i, `🍄 +${p.mush}`, '#ffb08a'); p.mush = 0; }
    Board.ui.rolled = { v, t: 0, i }; await sleep(700); Board.ui.rolled = null;
    return v;
  }
  async move(i, steps) {
    const p = this.P(i);
    for (let s = 0; s < steps; s++) {
      this.chk();
      const left = steps - s - 1;
      const nx = BD.spaces[p.pos].nx; p.pos = nx.length > 1 ? await this.pickPath(i, p.pos, left + 1) : nx[0]; p.st.moved++;
      Board.ui.steps = { i, left: left }; await Board.hop(i); Sfx.step();
      const sp = BD.spaces[p.pos];
      // passing events (also happen when landing)
      if (sp.type === 'bank' && sp.bank === this.starBank) await this.starOffer(i);
      if (sp.type === 'gate') { if (sp.owner === i) await this.holdVisit(i); else await this.raidOffer(i, sp.owner); }
    }
    Board.ui.steps = null;
    await this.land(i);
  }
  async pickPath(i, pos, steps) {
    const sp = BD.spaces[pos], B = BD.BRANCHES[sp.fork], bankHere = sp.fork === this.starBank, p = this.P(i);
    Board.ui.fork = { pos, t: 0 };
    const v = await Board.ask(i, `${p.name}: which way? (${steps} to go)`, [
      { label: `🛣️ Main road${bankHere ? ' — the ⭐ bank!' : ' (past the bank)'}`, value: sp.nx[0], desc: bankHere ? `The star is on sale at the ${BD.BANK_NAMES[sp.fork]}.` : `Passes the ${BD.BANK_NAMES[sp.fork]} shop.` },
      { label: `${B.icon} ${B.name}`, value: sp.nx[1], desc: 'Chests, geysers and mushrooms… and a red space.' },
    ], () => BoardAI.pathPick(this, i, sp));
    Board.ui.fork = null; return v;
  }
  // ------------------------------------------------------------------ landing
  async land(i) {
    const p = this.P(i), sp = BD.spaces[p.pos], x2 = this.frenzy ? 2 : 1;
    Board.pulse(p.pos);
    if (sp.type === 'blue') { this.gain(i, 3 * x2); p.mood = 'happy'; }
    else if (sp.type === 'red') { this.gain(i, -3 * x2); p.st.reds++; p.st.bad++; p.mood = 'sad'; }
    else if (sp.type === 'item') { await Board.banner(`${p.name} found an item!`, '', 900, true); this.giveItem(i, this.randItem()); }
    else if (sp.type === 'lucky') await this.luckyWheel(i);
    else if (sp.type === 'event') await this.windmill(i);
    else if (sp.type === 'swirl') await this.swirl(i, R.pick([0, 1, 2, 3].filter(j => j !== i)), 'The swirl spins you around!');
    else if (sp.type === 'bank') await this.shop(i);
    else if (sp.type === 'chest') await this.chest(i);
    else if (sp.type === 'mush') { p.mush = (p.mush || 0) + 3; Board.float(i, '🍄 next roll +3', '#ffb08a'); Sfx.pop(); await Board.banner(`🍄 ${p.name} eats a bouncy mushroom!`, 'Next roll gets +3.', 1100, true); }
    else if (sp.type === 'geyser') { p.st.events++; Sfx.whoosh(); Board.ui.geyser = { pos: p.pos, t: 0 }; await Board.banner('⛲ Geyser!', `${p.name} is blasted forward 3 spaces!`, 1100, true); Board.ui.geyser = null; await this.move(i, 3); return; }
    await sleep(500);
    // somebody already standing here?
    const others = this.players.filter(q => q.i !== i && q.pos === p.pos && sp.type !== 'gate');
    if (others.length) { const o = others[0].i; if (this.frenzy) await this.duel(i, o); else await this.punch(i, o); }
  }
  async chest(i) {
    const p = this.P(i), x2 = this.frenzy ? 2 : 1; p.st.events++;
    const prizes = R.shuffle(['big', 'small', 'mimic']);
    const k = await Board.ask(i, '🧰 Three chests… pick one!', [0, 1, 2].map(n => ({ label: ['🟫 Left chest', '🟨 Middle chest', '🟥 Right chest'][n], value: n })), () => R.int(0, 2));
    const r = prizes[k];
    if (r === 'big') { await Board.banner('💰 A fortune!', `${p.name} finds ${8 * x2} coins!`, 1200, true); this.gain(i, 8 * x2); p.mood = 'happy'; }
    else if (r === 'small') { await Board.banner('🎁 A trinket!', `${p.name} finds an item.`, 1100, true); this.giveItem(i, this.randItem()); }
    else { await Board.banner('😱 A MIMIC!', `It snaps at ${p.name} and gobbles ${4 * x2} coins!`, 1300, true); this.gain(i, -4 * x2); p.st.bad++; p.mood = 'sad'; }
  }
  async punch(i, o) {
    const p = this.P(i), q = this.P(o);
    this.n.punches++; Board.ui.punch = { a: i, b: o, t: 0 }; Sfx.punch(); await sleep(650); Board.ui.punch = null;
    const t = Math.min(q.coins, BD.PUNCH); q.coins -= t; p.coins += t; q.st.punched++; q.st.bad++;
    await Board.banner(`${p.name} bumps ${q.name}!`, t ? `${p.name} snatches ${t} coin${t > 1 ? 's' : ''}!` : `${q.name}'s pockets are empty…`, 1600);
  }
  async swirl(i, j, why) {
    const a = this.P(i), b = this.P(j); Sfx.whoosh();
    await Board.banner('🌀 Swirl!', `${why} ${a.name} and ${b.name} swap places!`, 1500);
    [a.pos, b.pos] = [b.pos, a.pos]; Board.snap(i); Board.snap(j); Sfx.whoosh(false); await sleep(400);
  }
  async luckyWheel(i) {
    const p = this.P(i);
    const slots = [{ label: '+5 🪙', col: '#ffd34d', v: 'c5' }, { label: '+10 🪙', col: '#ffb030', v: 'c10' }, { label: '🎁 Item', col: '#7cf06a', v: 'item' }, { label: '−5 🪙', col: '#ff6a6a', v: 'm5' }, { label: '➜ +3 spaces', col: '#8ae0ff', v: 'go3' }, { label: '🧲 Steal 3', col: '#d08aff', v: 'steal' }];
    const r = await Board.wheel(i, '🍀 Alin\'s Lucky Wheel', slots); p.st.events++;
    if (r.v === 'c5') this.gain(i, 5); if (r.v === 'c10') this.gain(i, 10); if (r.v === 'item') this.giveItem(i, this.randItem());
    if (r.v === 'm5') { this.gain(i, -5); p.st.bad++; }
    if (r.v === 'steal') { const v = this.players.filter(q => q.i !== i).sort((a, b) => b.coins - a.coins)[0]; const t = Math.min(3, v.coins); v.coins -= t; p.coins += t; await Board.banner(`${p.name} pinches ${t} coins from ${v.name}!`, '', 1400); }
    if (r.v === 'go3') { for (let k = 0; k < 3; k++) { p.pos = BD.spaces[p.pos].nx[0]; await Board.hop(i); const sp = BD.spaces[p.pos]; if (sp.type === 'bank' && sp.bank === this.starBank) await this.starOffer(i); } }
  }
  async windmill(i) {
    this.P(i).st.events++;
    if (R.chance(0.5)) {
      await Board.banner('🌬️ The windmill spins up a gust!', 'Everyone is blown forward 1–3 spaces!', 1800);
      Board.ui.gust = 1.6; Sfx.breeze();
      for (const q of this.players) { const n = R.int(1, 3); for (let k = 0; k < n; k++) { q.pos = BD.spaces[q.pos].nx[0]; Board.snap(q.i); await sleep(120); } }
      await sleep(600);
    } else {
      const [a, b] = R.shuffle([0, 1, 2, 3]).slice(0, 2);
      await this.swirl(a, b, '💦 The pond splashes over the board!');
    }
  }
  // ------------------------------------------------------------------ the star (one bank at a time, it moves after a purchase)
  async starOffer(i) {
    const p = this.P(i); this.n.offers = (this.n.offers || 0) + 1; this.n.offerCoins = (this.n.offerCoins || []).concat(p.coins); if (p.coins < BD.STAR) { if (p.human) await Board.banner(`The star is here, ${p.name}!`, `It costs ${BD.STAR} coins — you have ${p.coins}.`, 1300, true); return; }
    const max = Math.min(3, Math.floor(p.coins / BD.STAR));
    const opts = []; for (let k = 1; k <= max; k++) opts.push({ label: `⭐ Buy ${k} star${k > 1 ? 's' : ''} (${p.coins} → ${p.coins - k * BD.STAR} coins)`, value: k });
    opts.push({ label: 'No thanks', value: 0 });
    const k = await Board.ask(i, `⭐ Stars cost ${BD.STAR} coins each`, opts, () => max);
    if (!k) return;
    p.coins -= BD.STAR * k; p.stars += k; p.st.spent += BD.STAR * k; this.n.stars += k; Sfx.star(); Board.ui.starGet = { i, t: 0 };
    await Board.banner(`⭐ ${p.name} got ${k > 1 ? k + ' STARS' : 'a STAR'}! ⭐`, '', 2200); Board.ui.starGet = null;
    const nb = R.pick([0, 1, 2, 3].filter(b => b !== this.starBank)); this.starBank = nb;
    Board.ui.starHop = { t: 0 }; Sfx.whoosh();
    await Board.banner('The star flies away…', `…to the ${BD.BANK_NAMES[nb]}!`, 2000); Board.ui.starHop = null;
  }
  async shop(i) {
    const p = this.P(i); if (p.items.length >= BD.BAG) return;
    const ids = R.shuffle(Object.keys(BD.ITEMS)).slice(0, 4);
    const opts = ids.map(id => { const it = BD.ITEMS[id]; return { label: `${it.icon} ${it.name} — ${it.price}🪙`, value: id, desc: it.desc, off: p.coins < it.price }; }).concat([{ label: 'Leave the shop', value: null }]);
    const v = await Board.ask(i, '🏦 Bank shop', opts, () => BoardAI.shopPick(this, i, ids));
    if (!v) return; const it = BD.ITEMS[v]; if (p.coins < it.price) return;
    p.coins -= it.price; p.st.spent += it.price; this.giveItem(i, v);
  }
  // ------------------------------------------------------------------ holds: stash and raid
  async holdVisit(i) {
    const p = this.P(i), H = this.holds[i];
    for (let guard = 0; guard < 4; guard++) {
      const opts = [];
      if (p.coins > 0) opts.push({ label: `🪙 Stash all ${p.coins} coins`, value: 'coins' });
      if (p.coins > 1) opts.push({ label: `🪙 Stash half (${Math.floor(p.coins / 2)})`, value: 'half' });
      if (p.stars > 0) opts.push({ label: `⭐ Stash ${p.stars} star${p.stars > 1 ? 's' : ''}`, value: 'stars' });
      if (H.coins + H.stars > 0) opts.push({ label: `🎒 Take everything out (${H.coins}🪙 ${H.stars}⭐)`, value: 'take' });
      for (const id of [...new Set(p.items)]) if (BD.ITEMS[id].kind === 'install') opts.push({ label: `${BD.ITEMS[id].icon} Install ${BD.ITEMS[id].name}`, value: 'i:' + id, desc: BD.ITEMS[id].desc });
      if (!opts.length) return;
      opts.push({ label: 'Keep walking', value: null });
      const v = await Board.ask(i, `🏰 ${p.name}'s Hold`, opts, () => BoardAI.holdPick(this, i));
      if (!v) return;
      this.n.stash++; if (v === 'coins') { H.coins += p.coins; p.coins = 0; }
      if (v === 'half') { const n = Math.floor(p.coins / 2); H.coins += n; p.coins -= n; }
      if (v === 'stars') { H.stars += p.stars; p.stars = 0; }
      if (v === 'take') { p.coins += H.coins; p.stars += H.stars; H.coins = 0; H.stars = 0; }
      if (typeof v === 'string' && v.startsWith('i:')) this.install(i, v.slice(2));
      Sfx.coin();
    }
  }
  install(i, id) { const p = this.P(i), H = this.holds[i], k = p.items.indexOf(id); if (k < 0) return; p.items.splice(k, 1); H[id] += id === 'trap' ? 1 : 2; Board.float(i, `${BD.ITEMS[id].icon} installed`, '#9fe0ff'); Sfx.pop(); }
  raidSlots(o, tod, H) {
    const slots = [];
    const star = tod === 'golden' ? 2 : 1;
    for (let k = 0; k < H.stars; k++) for (let q = 0; q < star; q++) slots.push({ label: '⭐ Star', col: '#ffd34d', v: 'star', val: 30 });
    if (H.coins > 0) { const cut = f => Math.min(H.coins, Math.max(1, Math.min(BD.RAIDCAP, Math.ceil(H.coins * f)))); [[0.15, '#ffe680'], [0.25, '#ffc83a']].concat(tod === 'night' ? [[0.4, '#ff9a2a']] : []).forEach(([f, col]) => { const n = cut(f); slots.push({ label: `🪙 ${n}`, col, v: 'c', n, val: n }); }); }
    H.items.forEach(id => slots.push({ label: `${BD.ITEMS[id].icon} ${BD.ITEMS[id].name}`, col: '#7cf06a', v: 'item', id, val: 4 }));
    const nothing = { day: 5, golden: 3, night: 2 }[tod];
    for (let k = 0; k < nothing; k++) slots.push({ label: '💨 Nothing', col: '#8a8aa8', v: 'none', val: 0 });
    slots.push({ label: '🐕 Dog bite −3', col: '#ff6a6a', v: 'bite', val: -3 });
    if (H.decoy) for (let k = 0; k < 4; k++) slots.push({ label: '📦 Empty decoy', col: '#a8906a', v: 'none', val: 0 });
    if (H.padlock) for (let q = 0; q < 2; q++) { const best = slots.reduce((b, s, k) => s.val > slots[b].val ? k : b, 0); if (slots[best].val > 0) slots.splice(best, 1); }
    return R.shuffle(slots);
  }
  async raidOffer(i, o) {
    const p = this.P(i), H = this.holds[o], q = this.P(o);
    if (this.round < 3 || p.coins < BD.RAID) return;
    const hasTreasure = H.coins + H.stars + H.items.length > 0;
    if (!hasTreasure) return;
    const d = Math.abs(BD.spaces[q.pos].m - o * 10), near = Math.min(d, 40 - d) <= BD.NEAR;
    if (near) { this.n.near = (this.n.near || 0) + 1; if (p.human) await Board.banner(`🏰 ${q.name} is close to home!`, `You can't raid a Hold while its owner is within ${BD.NEAR} spaces of it.`, 1600, true); return; }
    const T = BD.TOD[this.tod];
    const yes = await Board.ask(i, `🏴‍☠️ Raid ${q.name}'s Hold for ${BD.RAID} coins?`, [{ label: `🏴‍☠️ Raid! (${T.icon} ${T.name})`, value: true, desc: `Inside: ${H.coins}🪙 ${H.stars}⭐ ${H.items.length}🎁${H.trap ? '' : ''}` }, { label: 'Walk past', value: false }], () => BoardAI.wantRaid(this, i, o));
    if (!yes) return;
    p.coins -= BD.RAID; p.st.spent += BD.RAID; this.n.raids++;
    Board.cam.target = BD.HOLDS[o];
    await Board.banner(`🏴‍☠️ ${p.name} raids ${q.name}'s Hold!`, '', 1500);
    let tod = this.tod;
    if (p.items.includes('lantern')) { p.items.splice(p.items.indexOf('lantern'), 1); tod = 'night'; await Board.banner('🏮 Night Lantern!', 'This raid counts as NIGHT.', 1300); }
    // the spring trap
    if (H.trap) { H.trap--; this.n.trap++; const t = Math.min(8, p.coins); p.coins -= t; q.coins += t; p.st.bad++; Sfx.boom(); Board.ui.trapT = 1;
      await Board.banner('🪤 SNAP! A spring trap!', `${p.name} loses ${t} coins to ${q.name} and runs off empty-handed.`, 2400); Board.cam.target = null; return; }
    // the guard dog
    if (p.items.includes('whistle')) { p.items.splice(p.items.indexOf('whistle'), 1); await Board.banner('🦴 Dog Whistle!', 'The guard dog sits nicely and lets you in.', 1500); }
    else { const chase = { day: 0.55, golden: 0.45, night: 0.35 }[tod]; Board.ui.dog = { t: 0 }; Sfx.tone(300, 0.15, 'square', 0.05); await sleep(700);
      if (R.chance(chase)) { this.n.dog++; Board.ui.dog = { t: 0, chase: true }; p.st.bad++; await Board.banner('🐕 WOOF! The guard dog chases you off!', `${p.name} flees with nothing — the ${BD.RAID} coins are gone.`, 2400); Board.ui.dog = null; Board.cam.target = null; return; }
      Board.ui.dog = null; await Board.banner('🐕 The guard dog is napping…', 'Sneak in!', 1200); }
    const slots = this.raidSlots(o, tod, H);
    if (H.padlock) H.padlock--; if (H.decoy) H.decoy--;
    let r = await Board.wheel(i, `🏴‍☠️ Raid roulette — ${BD.TOD[tod].icon} ${BD.TOD[tod].name}`, slots);
    if (p.items.includes('charm')) { p.items.splice(p.items.indexOf('charm'), 1); await Board.banner('🍀 Lucky Charm — spin again!', 'Keep the better result.', 1300); const r2 = await Board.wheel(i, '🍀 Second spin', slots); if (r2.val > r.val) r = r2; }
    q.st.robbed++;
    if (r.v === 'star' && H.stars > 0) { this.n.raidStar++; H.stars--; p.stars++; p.st.stolen += 30; q.st.bad += 2; Sfx.star(); await Board.banner(`⭐ ${p.name} STEALS A STAR from ${q.name}!`, '', 2400); }
    else if (r.v === 'c') { this.n.raidCoins++; const n = Math.min(H.coins, r.n); H.coins -= n; p.coins += n; p.st.stolen += n; q.st.bad++; Sfx.coin(); await Board.banner(`🪙 ${p.name} grabs ${n} coins!`, '', 1800); }
    else if (r.v === 'item') { const k = H.items.indexOf(r.id); if (k >= 0) H.items.splice(k, 1); this.giveItem(i, r.id); p.st.stolen += 4; await Board.banner(`🎁 ${p.name} swipes a ${BD.ITEMS[r.id].name}!`, '', 1700); }
    else if (r.v === 'bite') { this.gain(i, -3); p.st.bad++; q.st.robbed--; await Board.banner('🐕 CHOMP! The dog woke up!', `${p.name} loses 3 coins.`, 1800); }
    else { this.n.raidNothing++; q.st.robbed--; await Board.banner('💨 Nothing!', `${p.name} comes away empty-handed.`, 1600); }
    Board.cam.target = null;
  }
  // ------------------------------------------------------------------ items
  async useItem(i, id) {
    const p = this.P(i), it = BD.ITEMS[id], k = p.items.indexOf(id); if (k < 0) return;
    if (it.kind === 'install') { this.install(i, id); await Board.banner(`${it.icon} ${it.name} set at ${p.name}'s Hold`, it.desc, 1500); return; }
    let target = null;
    if (it.kind === 'target') {
      const opts = this.players.filter(q => q.i !== i).map(q => ({ label: `${q.name} (${this.totStars(q.i)}⭐ ${q.coins}🪙)`, value: q.i })).concat([{ label: '← Back', value: -1 }]);
      target = await Board.ask(i, `${it.icon} ${it.name} — on whom?`, opts, () => BoardAI.targetPick(this, i, id));
      if (target < 0 || target === null) return;
    }
    p.items.splice(k, 1); this.n.items++; Sfx.item ? Sfx.item(id) : Sfx.pop();
    if (id === 'dice2') { p.mods.dice2 = true; await Board.banner('🎲 Double Dice!', `${p.name} rolls two dice this turn.`, 1200); }
    if (id === 'curse') { this.P(target).curse = true; this.P(target).st.bad++; await Board.banner('🐌 Snail Curse!', `${this.P(target).name}'s next roll is only 1–3.`, 1500); }
    if (id === 'swap') await this.swirl(i, target, `${p.name} uses a Swap Swirl!`);
    if (id === 'magnet') { const q = this.P(target), t = Math.min(5, q.coins); q.coins -= t; p.coins += t; q.st.bad++; Sfx.coin(); await Board.banner('🧲 Coin Magnet!', `${p.name} pulls ${t} coins from ${q.name}.`, 1500); }
    if (id === 'compass') { const pos = this.starBank * 10 + 4; p.pos = pos; Board.snap(i); Sfx.whoosh(); await Board.banner('🧭 Star Compass!', `${p.name} warps next to the ${BD.BANK_NAMES[this.starBank]}!`, 1500); }
  }
  // ------------------------------------------------------------------ same-space duel (Final Frenzy)
  async duel(i, o) {
    const a = this.P(i), b = this.P(o); this.n.duels++;
    await Board.banner('⚔️ DUEL! ⚔️', `${a.name} challenges ${b.name}!`, 1800);
    const canStar = a.stars > 0 && b.stars > 0, canCoins = a.coins > 0 && b.coins > 0;
    if (!canStar && !canCoins) { await Board.banner('…but neither has anything to bet!', 'They shake hands instead.', 1600); return; }
    let prize = canStar && canCoins ? null : canStar ? 'star' : 'coins';
    if (!prize) { const r = await Board.wheel(i, '⚔️ What\'s at stake?', [{ label: '⭐ A STAR', col: '#ffd34d', v: 'star' }, { label: '🪙 Coins', col: '#ffe680', v: 'coins' }, { label: '⭐ A STAR', col: '#ffc83a', v: 'star' }, { label: '🪙 Coins', col: '#ffb030', v: 'coins' }]); prize = r.v; }
    let amt = 1;
    if (prize === 'coins') {
      const cap = Math.min(a.coins, b.coins), opts = [5, 10, 20].filter(n => n < cap).map(n => ({ label: `🪙 ${n} coins`, value: n })).concat([{ label: `🪙 ${cap} coins (all they can bet)`, value: cap }]);
      amt = await Board.ask(i, `${a.name}: how many coins are at stake?`, opts, () => BoardAI.duelBet(this, i, o, cap));
    }
    await Board.banner(`Stakes: ${prize === 'star' ? '⭐ 1 star' : `🪙 ${amt} coins`}`, 'Winner takes it!', 1800);
    const pool = MG.list.filter(g => g.mode === 'duel' && !Shell.isBrawl(g)).map(g => g.id);
    const id = R.pick(pool), teams = [-1, -1, -1, -1]; teams[i] = 0; teams[o] = 1;
    const res = await Board.runMG(id, { mode: 'duel', teams });
    let w = -1;
    if (res && res.scores) { const sa = res.scores[i], sb = res.scores[o]; w = sa > sb ? i : sb > sa ? o : -1; }
    if (w < 0) { await Board.banner('A draw!', 'Nobody loses anything.', 1800); return; }
    const L = w === i ? o : i, W = this.P(w), Lp = this.P(L); W.st.duelWins++;
    if (prize === 'star') { const n = Math.min(1, Lp.stars); Lp.stars -= n; W.stars += n; Sfx.star(); }
    else { const n = Math.min(amt, Lp.coins); Lp.coins -= n; W.coins += n; Sfx.coin(); }
    Lp.st.bad++;
    await Board.banner(`🏆 ${W.name} wins the duel!`, prize === 'star' ? `${W.name} takes a ⭐ from ${Lp.name}!` : `${W.name} takes ${amt} coins from ${Lp.name}!`, 2400);
  }
  // ------------------------------------------------------------------ end-of-round minigame
  async minigame() {
    Board.focus = null; Board.cam.z = 0.66; Board.current = -1;
    const finale = this.round === this.rounds && !this.brawlUsed;
    let id;
    if (finale) {
      const arenas = MG.list.filter(g => Shell.isBrawl(g) && g.mode !== 'duel').map(g => g.id);
      id = R.pick(arenas); this.brawlUsed = true;
      await Board.banner('🔥 Grand Finale! 🔥', `The last minigame is a brawl: ${MG.byId[id].name}!`, 2600);
    } else {
      const elig = g => g.mode !== 'duel' && !Shell.isBrawl(g) && !g.long && g.type !== 'Marathon' && !g.noBoard;
      let pool = MG.list.filter(g => elig(g) && !this.played.includes(g.id)).map(g => g.id);
      if (pool.length < 2) pool = MG.list.filter(elig).map(g => g.id);
      const last = this.standings()[3], two = R.shuffle(pool).slice(0, 2);
      id = await Board.ask(last, `🎮 ${this.P(last).name} (last place) picks the minigame`, two.map(g => ({ label: `${MG.byId[g].name}`, value: g, desc: `${MG.byId[g].type} · ${MG.byId[g].controls || ''}` })), () => R.pick(two));
    }
    this.played.push(id);
    const res = await Board.runMG(id, {});
    if (!res || res.quit || !res.scores) { await Board.banner('Minigame skipped', 'No prizes this round.', 1500); return; }
    const sc = res.scores, game = MG.byId[id];
    const place = this.players.map(p => 1 + this.players.filter(q => sc[q.i] > sc[p.i] + 1e-9).length);
    const prize = { 1: 10, 2: 5, 3: 2 };
    const coinGame = game.coinGame || (game.bonusCoins && res.coins);
    const lines = [];
    this.players.forEach(p => {
      let n = coinGame ? clamp(Math.round((res.coins ? res.coins[p.i] : sc[p.i]) || 0), 0, 20) : prize[place[p.i]] || 0;
      if (game.bonusCoins && res.coins && !game.coinGame) n = clamp(Math.round(res.coins[p.i] || 0), 0, 20) + (prize[place[p.i]] || 0);
      if (place[p.i] === 1) p.st.mgWins++;
      if (n) p.coins += n; lines.push(`${p.name} +${n}`);
    });
    Sfx.coin();
    await Board.banner(`🏆 ${this.players.filter(p => place[p.i] === 1).map(p => p.name).join(' & ')} won ${game.name}!`, lines.join('   ·   '), 2800);
    const prev = this.order.slice(); this.order = prev.slice().sort((a, b) => place[a] - place[b] || prev.indexOf(a) - prev.indexOf(b));
  }
  // ------------------------------------------------------------------ end: bonus stars and the winner
  async finish() {
    Board.focus = null; Board.cam.z = 0.66; Board.current = -1;
    await Board.banner('That\'s the last round!', 'Time to count the stars…', 2400);
    if (this.bonus) {
      const n = this.rounds <= 12 ? R.int(1, 2) : R.int(1, 3);
      await Board.banner('✨ BONUS STARS! ✨', 'How many will I give out? That\'s a secret…', 3000);
      const C = BoardBonus.criteria(this), picks = R.shuffle(C.filter(c => c.ok)).slice(0, n);
      for (const c of picks) {
        Board.ui.drum = 1; Sfx.drum(0); Sfx.drum(2); await sleep(900);
        const best = Math.max(...this.players.map(p => c.score(p))), win = this.players.filter(p => c.score(p) === best && best > 0);
        Board.ui.drum = 0;
        if (!win.length) continue;
        win.forEach(p => { p.stars++; Board.float(p.i, '+1⭐', '#ffe680'); }); Sfx.star();
        await Board.banner(`${c.icon} ${c.name}`, `${c.desc} — ${win.map(p => p.name).join(' & ')} get${win.length > 1 ? '' : 's'} a ⭐!`, 3200);
      }
      await Board.banner('That\'s all the bonus stars!', `There ${picks.length === 1 ? 'was 1' : `were ${picks.length}`} this time.`, 2200);
    }
    const st = this.standings();
    Board.ui.final = { order: st, t: 0 };
    const top = st.filter(i => this.totStars(i) === this.totStars(st[0]) && this.totCoins(i) === this.totCoins(st[0]));
    Sfx.win();
    await Board.banner(`🏆 ${top.map(i => this.P(i).name).join(' & ')} ${top.length > 1 ? 'are' : 'is'} the SUPERSTAR!`, `${this.totStars(st[0])} stars and ${this.totCoins(st[0])} coins.`, 5000);
    this.result = { winners: top, order: st };
  }
}

// =====================================================================================================
// bonus star categories (a random hidden number of them is awarded at the end)
const BoardBonus = {
  criteria(G) {
    const P = G.players;
    return [
      { name: 'Coin Baron', icon: '🪙', desc: 'Most coins at the end', score: p => G.totCoins(p.i), ok: true },
      { name: 'Minigame Star', icon: '🎮', desc: 'Most minigames won', score: p => p.st.mgWins, ok: true },
      { name: 'Least Fortunate', icon: '🍂', desc: 'Landed on the most red spaces', score: p => p.st.reds, ok: true },
      { name: 'Master Thief', icon: '🏴‍☠️', desc: 'Stole the most in raids', score: p => p.st.stolen, ok: P.some(p => p.st.stolen > 0) },
      { name: 'Most Bad Luck', icon: '🌧️', desc: 'Suffered the most misfortune', score: p => p.st.bad, ok: true },
      { name: 'Most Deserving', icon: '💖', desc: 'Played great but kept getting knocked down', score: p => G.rankOf(p.i) > 1 ? p.st.mgWins * 2 + p.st.robbed + p.st.punched : 0, ok: true },
      { name: 'Wanderer', icon: '🚶', desc: 'Walked the furthest', score: p => p.st.moved, ok: true },
      { name: 'Big Spender', icon: '🛍️', desc: 'Spent the most coins', score: p => p.st.spent, ok: true },
      { name: 'Event Magnet', icon: '🌀', desc: 'Hit the most lucky and windmill spaces', score: p => p.st.events, ok: true },
      { name: 'Duel Champion', icon: '⚔️', desc: 'Won the most duels', score: p => p.st.duelWins, ok: P.some(p => p.st.duelWins > 0) },
    ];
  },
};

// =====================================================================================================
// computer players' decisions
const BoardAI = {
  distTo(G, i, pos) { return BD.dist(G.P(i).pos, pos); },
  pathPick(G, i, sp) {
    const p = G.P(i);
    if (sp.fork === G.starBank && p.coins >= BD.STAR) return sp.nx[0];
    if (sp.fork === G.starBank && p.coins + 6 >= BD.STAR) return R.chance(0.3) ? sp.nx[1] : sp.nx[0];
    return R.chance(0.65) ? sp.nx[1] : sp.nx[0];
  },
  turnPick(G, i) {
    const p = G.P(i), has = id => p.items.includes(id), leader = G.standings().find(j => j !== i);
    for (const id of ['trap', 'padlock', 'decoy']) if (has(id) && G.holds[i].coins + G.holds[i].stars * 15 >= 10) return id;
    const d = this.distTo(G, i, G.starBank * 10 + 5);
    if (has('compass') && p.coins >= BD.STAR && d > 8) return 'compass';
    if (has('dice2') && p.coins >= BD.STAR && d > 6 && d <= 16) return 'dice2';
    if (has('magnet') && G.players.some(q => q.i !== i && q.coins >= 5)) return 'magnet';
    if (has('curse') && Math.random() < 0.7) return 'curse';
    if (has('swap') && G.P(leader).coins >= BD.STAR && this.distTo(G, leader, G.starBank * 10 + 5) < d) return 'swap';
    return 'roll';
  },
  targetPick(G, i, id) {
    const rivals = G.players.filter(q => q.i !== i);
    if (id === 'magnet') return rivals.sort((a, b) => b.coins - a.coins)[0].i;
    if (id === 'swap') { const sb = G.starBank * 10 + 5; return rivals.sort((a, b) => this.distTo(G, a.i, sb) - this.distTo(G, b.i, sb))[0].i; }
    return rivals.sort((a, b) => G.totStars(b.i) - G.totStars(a.i) || G.totCoins(b.i) - G.totCoins(a.i))[0].i;
  },
  shopPick(G, i, ids) {
    const p = G.P(i), budget = p.coins - (p.coins >= BD.STAR ? BD.STAR : 0);
    const want = ['compass', 'whistle', 'charm', 'trap', 'dice2', 'magnet', 'lantern', 'padlock', 'curse', 'swap', 'decoy'].filter(id => ids.includes(id) && BD.ITEMS[id].price <= budget);
    return want.length && Math.random() < 0.6 ? want[0] : null;
  },
  holdPick(G, i) {
    const p = G.P(i), H = G.holds[i];
    for (const id of ['trap', 'padlock', 'decoy']) if (p.items.includes(id) && H.coins + H.stars > 0) return 'i:' + id;
    if ((G.frenzy || G.round > G.rounds / 2) && p.stars > 0) return 'stars';
    if (p.coins > BD.STAR + 8) return 'half';
    if (p.coins >= 12 && p.coins < BD.STAR && Math.random() < 0.5) return 'half';
    if (p.coins < BD.STAR && H.coins + p.coins >= BD.STAR && Math.random() < 0.7) return 'take';
    return null;
  },
  wantRaid(G, i, o) {
    const p = G.P(i), H = G.holds[o], tod = G.tod, value = H.coins + H.stars * 25 + H.items.length * 3;
    const keep = p.coins - BD.RAID;
    if (value < 6) return false;
    const want = { day: 0.25, golden: H.stars ? 0.85 : 0.45, night: 0.8 }[tod] + (p.items.includes('whistle') ? 0.2 : 0);
    return Math.random() < want && (keep >= 3 || value > 20);
  },
  duelBet(G, i, o, cap) { return Math.min(cap, R.pick([5, 10, 10, 20])); },
};

// =====================================================================================================
// THE BOARD SCREEN: camera, drawing, prompts, dice, wheels and banners
const Board = {
  game: null, cam: { x: 800, y: 500, z: 0.66, target: null }, focus: null, current: -1,
  tok: [], fx: [], floats: [], ui: {}, t: 0, pulseAt: -1, pulseT: 0,
  start(players, opts) {
    this.game = new BoardGame(players, opts); this.ui = {}; this.fx = []; this.floats = []; this.paused = false; this.done = false; this.cam.target = null; this.camZ = 0.66; Settings.paused = false;
    this.tok = this.game.players.map(p => { const s = BD.spaces[p.pos]; return { x: s.x, y: s.y, hop: 0, fx: s.x, fy: s.y }; });
    Shell.go('board');
    this.game.run().then(() => { this.done = true; }).catch(e => { if (e && e.message !== 'board-aborted') console.error(e); this.done = true; });
  },
  // ----------------------------------------------------------------- awaitables
  wait(ms) { return sleep(Settings.test ? 0 : ms); },
  sp() { return Math.max(0.05, Math.min(1, Settings.speed)); },
  banner(title, sub, ms = 2000, small = false) {
    return new Promise(res => { this.ui.banner = { title, sub, t: 0, ms: Settings.test ? 0 : ms, small, res }; if (Settings.test) { this.ui.banner = null; res(); } });
  },
  ask(i, title, options, botFn) {
    const p = this.game.P(i);
    return new Promise(res => {
      if (!p.human || Settings.test) { const v = botFn ? botFn() : options[0].value; if (Settings.test) { res(v); return; } this.ui.prompt = { i, title, options, sel: Math.max(0, options.findIndex(o => o.value === v)), bot: v, botT: 0.9 * this.sp(), res }; return; }
      this.ui.prompt = { i, title, options, sel: options.findIndex(o => !o.off), res };
    });
  },
  dice(i, faces, prev = null) {
    const p = this.game.P(i);
    return new Promise(res => {
      const v = R.pick(faces);
      if (Settings.test) { res(v); return; }
      this.ui.die = { i, faces, face: R.pick(faces), t: 0, state: 'spin', v, res, human: p.human, botT: R.range(0.6, 1.0) * this.sp(), prev };
    });
  },
  wheel(i, title, slots) {
    const p = this.game.P(i);
    return new Promise(res => {
      const k = R.int(0, slots.length - 1);
      if (Settings.test) { res(slots[k]); return; }
      this.ui.wheel = { i, title, slots, k, ang: Math.random() * Math.PI * 2, vel: 9, state: 'spin', human: p.human, botT: R.range(1.0, 1.6) * this.sp(), res, t: 0 };
    });
  },
  hop(i) {
    const s = BD.spaces[this.game.P(i).pos], T = this.tok[i];
    return new Promise(res => { if (Settings.test) { T.x = s.x; T.y = s.y; res(); return; } T.from = { x: T.x, y: T.y }; T.to = { x: s.x, y: s.y }; if (Math.abs(s.x - T.x) > 1) T.face = Math.sign(s.x - T.x); T.hopT = 0; T.res = res; });
  },
  snap(i) { const s = BD.spaces[this.game.P(i).pos], T = this.tok[i]; T.x = s.x; T.y = s.y; },
  float(i, text, col) { if (Settings.test) return; const T = this.tok[i]; this.floats.push({ x: T.x, y: T.y - 70, text, col, t: 0 }); },
  pulse(pos) { this.pulseAt = pos; this.pulseT = 1; },
  async runMG(id, opts) {
    if (Settings.test) return MG.run(id, this.game.players.map(p => ({ id: p.i, name: p.name, color: p.color, human: p.human, el: p.el })), [0, 1, 2, 3], opts);
    Shell.busy = true; Shell.cv.style.visibility = 'hidden';
    let res = null;
    try { res = await MG.run(id, this.game.players.map(p => ({ id: p.i, name: p.name, color: p.color, human: p.human, el: p.el })), [0, 1, 2, 3], opts); } catch (e) { console.error(e); }
    Shell.cv.style.visibility = 'visible'; Shell.busy = false; Shell.mute = 12; Music.back = 'board'; Music.play('board');
    return res;
  },
  // ----------------------------------------------------------------- per-frame update + input
  devOf(i) { const s = Shell.seats[i]; return s && s.dev ? Shell.ev[s.dev] || {} : {}; },
  update(dt) {
    this.t += dt; const U = this.ui, G = this.game;
    if (this.paused) return;
    // camera
    let fx = 800, fy = 500;
    if (this.cam.target) { fx = this.cam.target.x; fy = this.cam.target.y; }
    else if (this.focus !== null && this.focus >= 0) { fx = this.tok[this.focus].x; fy = this.tok[this.focus].y; }
    const z = this.cam.target ? 1.0 : this.cam.z, k = 1 - Math.exp(-3 * dt);
    this.cam.x += (fx - this.cam.x) * k; this.cam.y += (fy - this.cam.y) * k; this.camZ = (this.camZ || 0.66) + (z - (this.camZ || 0.66)) * k;
    const hw = 640 / this.camZ, hh = 360 / this.camZ; this.cam.x = clamp(this.cam.x, Math.min(800, hw - 40), Math.max(800, BD.W - hw + 40)); this.cam.y = clamp(this.cam.y, Math.min(500, hh - 60), Math.max(500, BD.H - hh + 60));
    // tokens
    this.tok.forEach((T, i) => {
      if (T.to) { T.hopT += dt / (0.24 * this.sp()); const q = Math.min(1, T.hopT); T.x = T.from.x + (T.to.x - T.from.x) * q; T.y = T.from.y + (T.to.y - T.from.y) * q; T.hop = Math.sin(q * Math.PI) * 26; if (q >= 1) { T.to = null; T.hop = 0; const r = T.res; T.res = null; r && r(); } }
    });
    this.floats.forEach(f => f.t += dt); this.floats = this.floats.filter(f => f.t < 1.4);
    this.pulseT = Math.max(0, this.pulseT - dt * 1.5);
    if (U.gust) U.gust = Math.max(0, U.gust - dt);
    if (U.dog) U.dog.t += dt; if (U.starGet) U.starGet.t += dt; if (U.starHop) U.starHop.t += dt; if (U.trapT) U.trapT = Math.max(0, U.trapT - dt);
    if (U.final) U.final.t += dt;
    // banner
    if (U.banner) { const B = U.banner; B.t += dt; const skip = G.players.some(p => p.human && (this.devOf(p.i).a)) && B.t > 0.35; if (B.t * 1000 >= B.ms || skip) { U.banner = null; B.res(); } }
    // prompt
    if (U.prompt && !U.banner) {
      const P = U.prompt, n = P.options.length;
      if (P.bot !== undefined) { P.botT -= dt; if (P.botT <= 0) { U.prompt = null; P.res(P.bot); } }
      else {
        const ev = this.devOf(P.i);
        const step = d => { for (let q = 0; q < n; q++) { P.sel = (P.sel + d + n) % n; if (!P.options[P.sel].off) break; } Sfx.tone(880, 0.03, 'triangle', 0.03); };
        if (ev.up) step(-1); if (ev.down) step(1);
        if (ev.a && !P.options[P.sel].off) { U.prompt = null; Sfx.tone(700, 0.08, 'triangle', 0.07); P.res(P.options[P.sel].value); }
        else if (ev.b) { const back = P.options.findIndex(o => o.value === null || o.value === false || o.value === -1); if (back >= 0) { U.prompt = null; P.res(P.options[back].value); } }
      }
    }
    // dice
    if (U.die) {
      const D = U.die; D.t += dt;
      if (D.state === 'spin') { D.tick = (D.tick || 0) + dt; if (D.tick > 0.06) { D.tick = 0; D.face = R.pick(D.faces); Sfx.dice(); }
        const go = D.human ? this.devOf(D.i).a && D.t > 0.2 : D.t > D.botT; if (go) { D.state = 'tumble'; D.t = 0; } }
      else if (D.state === 'tumble') { D.tick = (D.tick || 0) + dt; if (D.tick > 0.05 + D.t * 0.2) { D.tick = 0; D.face = D.t > 0.45 ? D.v : R.pick(D.faces); Sfx.dice(); } if (D.t > 0.55) { D.face = D.v; D.state = 'land'; D.t = 0; Sfx.thud(); } }
      else if (D.state === 'land' && D.t > 0.55 * this.sp()) { U.die = null; D.res(D.v); }
    }
    // wheel
    if (U.wheel) {
      const W = U.wheel, n = W.slots.length, seg = Math.PI * 2 / n; W.t += dt;
      if (W.state === 'spin') { W.ang += W.vel * dt; const go = W.human ? this.devOf(W.i).a && W.t > 0.3 : W.t > W.botT; if (go) { W.state = 'slow'; const cur = W.ang % (Math.PI * 2), want = -Math.PI / 2 - (W.k + 0.5) * seg; let d = ((want - cur) % (Math.PI * 2) + Math.PI * 4) % (Math.PI * 2); d += Math.PI * 4; W.from = W.ang; W.dist = d; W.st = 0; W.dur = 2.2 * this.sp(); } }
      else if (W.state === 'slow') { W.st += dt; const q = Math.min(1, W.st / W.dur); W.ang = W.from + W.dist * (1 - Math.pow(1 - q, 3)); const tickA = Math.floor(W.ang / seg); if (tickA !== W.lastTick) { W.lastTick = tickA; Sfx.tick(); } if (q >= 1) { W.state = 'done'; W.t = 0; Sfx.pop(); } }
      else if (W.state === 'done' && W.t > 0.9 * this.sp()) { U.wheel = null; W.res(W.slots[W.k]); }
    }
    // pause / quit
    const esc = Shell.ev.esc || {}; if (esc.b || Object.values(Shell.ev).some(e => e.start && !U.prompt && !U.die && !U.wheel)) { this.paused = true; this.pauseSel = 0; this.pauseWall = performance.now(); Settings.paused = true; }
  },

  // ----------------------------------------------------------------- drawing
  toScreen(x, y) { return { x: (x - this.cam.x) * this.camZ + 640, y: (y - this.cam.y) * this.camZ + 360 }; },
  draw(g, dt) {
    const G = this.game, t = this.t, tod = G.tod;
    g.fillStyle = '#4a8a3a'; g.fillRect(0, 0, 1280, 720);
    g.save(); g.translate(640, 360); g.scale(this.camZ, this.camZ); g.translate(-this.cam.x, -this.cam.y);
    g.drawImage(BoardArt.ground(), -200, -200, BD.W + 400, BD.H + 400);
    // the star bank glows; the pulse marks the space just landed on
    const sb = BD.spaces[G.starBank * 10 + 5];
    MGH.glow(g, sb.x, sb.y, 70 + Math.sin(t * 4) * 8, 'rgba(255,220,90,0.55)');
    BD.spaces.filter(s => s.type === 'gate').forEach(s => { g.strokeStyle = G.P(s.owner).color; g.lineWidth = 5; g.beginPath(); g.ellipse(s.x, s.y, 34, 24, 0, 0, 7); g.stroke(); });
    if (this.pulseT > 0 && this.pulseAt >= 0) { const s = BD.spaces[this.pulseAt]; g.strokeStyle = `rgba(255,255,255,${this.pulseT})`; g.lineWidth = 5; g.beginPath(); g.ellipse(s.x, s.y + 4, 30 + (1 - this.pulseT) * 30, 18 + (1 - this.pulseT) * 18, 0, 0, 7); g.stroke(); }
    // upright things sorted by depth: decor, banks, holds, players
    const items = BoardArt.decor().map(d => ({ y: d.y, f: () => BoardArt.drawDecor(g, d, t) }));
    BD.spaces.filter(s => s.type === 'bank').forEach(s => { const bx = s.x + (s.side === 1 ? 92 : s.side === 3 ? -92 : 0), by = s.y + (s.side === 0 ? -62 : s.side === 2 ? 96 : 30); items.push({ y: by, f: () => BoardArt.bank(g, bx, by, s.bank === G.starBank, t, s.bank) }); });
    BD.HOLDS.forEach((h, k) => items.push({ y: h.y + 40, f: () => BoardArt.hold(g, h.x, h.y, G.P(k), G.holds[k], t, this.ui.dog && this.cam.target === h, this.ui.dog && this.ui.dog.chase) }));
    BoardArt.windmillAt && items.push({ y: 520, f: () => BoardArt.windmill(g, 800, 520, t, this.ui.gust) });
    G.players.forEach((p, i) => { const T = this.tok[i]; const same = G.players.filter(q => q.pos === p.pos), k = same.indexOf(p), n = same.length; const ox = n > 1 ? (k - (n - 1) / 2) * 34 : 0, oy = n > 1 ? (k % 2) * 10 : 0; items.push({ y: T.y + oy + 1, f: () => this.drawToken(g, p, T.x + (T.to ? 0 : ox), T.y + (T.to ? 0 : oy), T.hop, t, T.face || 1) }); });
    items.sort((a, b) => a.y - b.y).forEach(it => it.f());
    if (this.ui.fork) { const F = BD.spaces[this.ui.fork.pos]; F.nx.forEach((n, k) => { const s2 = BD.spaces[n], a = Math.atan2(s2.y - F.y, s2.x - F.x), b = (Math.sin(t * 6) + 1) * 6, ax = F.x + Math.cos(a) * (44 + b), ay = F.y + Math.sin(a) * (30 + b) - 6; g.save(); g.translate(ax, ay); g.rotate(a); g.fillStyle = k ? '#7cf06a' : '#ffe680'; g.strokeStyle = '#2a1a10'; g.lineWidth = 3; g.beginPath(); g.moveTo(20, 0); g.lineTo(-4, -14); g.lineTo(-4, -6); g.lineTo(-18, -6); g.lineTo(-18, 6); g.lineTo(-4, 6); g.lineTo(-4, 14); g.closePath(); g.fill(); g.stroke(); g.restore(); }); }
    if (this.ui.geyser) { const s2 = BD.spaces[this.ui.geyser.pos]; for (let k = 0; k < 14; k++) { const q = (t * 2.4 + k / 14) % 1; g.fillStyle = `rgba(200,240,255,${0.8 * (1 - q)})`; g.beginPath(); g.arc(s2.x + Math.sin(k * 2.1 + t * 6) * 14 * q, s2.y - q * 190, 10 + q * 10, 0, 7); g.fill(); } }
    BoardArt.clouds(g, t, tod);
    // the star hopping to a new bank
    if (this.ui.starHop) { const q = Math.min(1, this.ui.starHop.t / 1.4), s = sb; MGH.star(g, s.x, s.y - 90 - (1 - q) * 300, 26, '#ffe680', t * 4, false); }
    this.floats.forEach(f => { g.globalAlpha = 1 - f.t / 1.4; MGH.text(g, f.text, f.x, f.y - f.t * 50, 26, f.col, 'center', 'bold'); g.globalAlpha = 1; });
    g.restore();
    BoardArt.sunlight(g, tod, t);
    BoardArt.todOverlay(g, tod, t, this);
    this.drawHUD(g, t);
    this.drawUI(g, t);
    if (this.paused) this.drawPause(g);
  },
  drawToken(g, p, x, y, hop, t, face = 1) {
    const cur = this.current === p.i, s = 66;
    const sh = g.createRadialGradient(x + 8, y + 6, 2, x + 8, y + 6, 32 - hop * 0.2); sh.addColorStop(0, 'rgba(0,0,0,0.42)'); sh.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = sh; g.beginPath(); g.ellipse(x + 8, y + 6, 32 - hop * 0.2, 11, 0, 0, 7); g.fill();
    if (cur) { MGH.glow(g, x, y + 2, 44, p.color + '55'); g.strokeStyle = p.color; g.lineWidth = 4; g.beginPath(); g.ellipse(x, y + 2, 38 + Math.sin(t * 6) * 3, 15, 0, 0, 7); g.stroke(); }
    Char.draw(g, x, y - 62 - hop + Math.sin(t * 2.4 + p.i) * 1.5, s * 0.62, p.el.id, p.color, { mood: MGH.persona(p.mood || (cur ? 'happy' : 'neutral'), p.el.id), seed: p.i * 1.7, look: { x: face * 0.6, y: 0.2 }, t: t + p.i, walk: hop > 0 ? 1 : 0, noShadow: true });
    if (cur) { const ay = y - 150 - hop + Math.sin(t * 5) * 4; g.fillStyle = p.color; g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 12, ay); g.lineTo(x + 12, ay); g.lineTo(x, ay + 14); g.closePath(); g.fill(); g.stroke(); }
  },
  drawHUD(g, t) {
    const G = this.game, tod = BD.TOD[G.tod];
    // top bar
    g.save(); g.fillStyle = 'rgba(20,12,44,0.62)'; Shell.rr(g, 440, 8, 400, 46, 23); g.fill(); g.strokeStyle = 'rgba(255,255,255,0.25)'; g.lineWidth = 2; g.stroke(); g.restore();
    Shell.text(g, `Round ${Math.max(1, G.round)}/${G.rounds}`, 540, 39, 20, '#fff');
    Shell.text(g, `${tod.icon} ${tod.name}`, 690, 39, 18, tod.col);
    Shell.text(g, `⭐ ${BD.BANK_NAMES[G.starBank].split(' ')[0]}`, 790, 39, 16, '#ffe680');
    if (G.frenzy) { g.save(); g.globalAlpha = 0.85 + Math.sin(t * 5) * 0.15; Shell.text(g, '🔥 FINAL FRENZY 🔥', 640, 76, 18, '#ff8a4a'); g.restore(); }
    // player cards in the corners
    const pos = [[12, 8], [1012, 8], [12, 612], [1012, 612]];
    G.players.forEach((p, i) => {
      const [x, y] = pos[i], H = G.holds[i], cur = this.current === i;
      g.save(); g.shadowColor = 'rgba(0,0,0,0.4)'; g.shadowBlur = 12; g.fillStyle = cur ? 'rgba(40,24,80,0.85)' : 'rgba(20,12,44,0.68)'; Shell.rr(g, x, y, 256, 100, 18); g.fill(); g.restore();
      g.strokeStyle = cur ? p.color : 'rgba(255,255,255,0.2)'; g.lineWidth = cur ? 3 : 2; Shell.rr(g, x, y, 256, 100, 18); g.stroke();
      Char.draw(g, x + 42, y + 52, 26, p.el.id, p.color, { headOnly: true, noArms: true, noFeet: true, noShadow: true, mood: MGH.persona(p.mood || 'happy', p.el.id), seed: p.i * 1.7 });
      Shell.text(g, p.name, x + 80, y + 28, 17, p.color, 'left');
      Shell.text(g, `#${G.rankOf(i)}`, x + 236, y + 28, 15, '#ffe680', 'right');
      Shell.text(g, `⭐ ${p.stars}`, x + 80, y + 56, 20, '#ffe680', 'left'); Shell.text(g, `🪙 ${p.coins}`, x + 150, y + 56, 20, '#fff', 'left');
      Shell.text(g, `🏰 ${H.stars}⭐ ${H.coins}🪙${H.trap ? ' 🪤' : ''}${H.padlock ? ` 🔒${H.padlock}` : ''}${H.decoy ? ` 📦${H.decoy}` : ''}`, x + 80, y + 82, 13, '#c8d8ff', 'left');
      p.items.forEach((id, k) => { Shell.text(g, BD.ITEMS[id].icon, x + 196 + k * 20, y + 84, 15, '#fff', 'center', 'normal', null); });
      if (p.curse) Shell.text(g, '🐌', x + 236, y + 56, 16, '#fff');
    });
  },
  drawUI(g, t) {
    const U = this.ui, G = this.game;
    if (U.rolled) Shell.text(g, `${U.rolled.v}`, 640, 300, 90, '#ffe680');
    if (U.steps && U.steps.left > 0) { const T = this.toScreen(this.tok[U.steps.i].x, this.tok[U.steps.i].y); g.fillStyle = 'rgba(20,12,44,0.75)'; g.beginPath(); g.arc(T.x, T.y - 110 * this.camZ, 22, 0, 7); g.fill(); Shell.text(g, String(U.steps.left), T.x, T.y - 110 * this.camZ + 9, 24, '#fff'); }
    if (U.punch) { const T = this.toScreen(this.tok[U.punch.b].x, this.tok[U.punch.b].y); MGH.star(g, T.x, T.y - 60, 30, '#ffe680', t * 8, false); Shell.text(g, 'POW!', T.x, T.y - 90, 34, '#ff6a4a'); }
    if (U.drum) { Shell.text(g, '🥁 . . .', 640, 360, 50, '#ffe680'); }
    if (U.final) this.drawFinal(g, t);
    if (U.die) this.drawDie(g, U.die, t);
    if (U.wheel) this.drawWheel(g, U.wheel, t);
    if (U.banner) this.drawBanner(g, U.banner, t);
    else if (U.prompt) this.drawPrompt(g, U.prompt, t);
  },
  drawBanner(g, B, t) {
    const k = Math.min(1, B.t / 0.25), y = B.small ? 150 : 250;
    g.save(); g.globalAlpha = k;
    const w = B.small ? 520 : 820, h = B.sub ? (B.small ? 70 : 120) : 64;
    g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 20; g.fillStyle = 'rgba(28,14,60,0.86)'; Shell.rr(g, 640 - w / 2, y - h / 2, w, h, 22); g.fill(); g.shadowBlur = 0;
    g.strokeStyle = '#ff4fb0'; g.lineWidth = 3; Shell.rr(g, 640 - w / 2, y - h / 2, w, h, 22); g.stroke();
    if (!B.small) { g.save(); g.translate(640 - w / 2 + 50, y + 14); g.scale(0.62, 0.62); BoardArt.alinMini(g, 0, 0, t); g.restore(); }
    const tx = B.small ? 640 : 680;
    Shell.text(g, B.title, tx, y + (B.sub ? (B.small ? -6 : -14) : 10), B.small ? 22 : 30, '#ffe680');
    if (B.sub) Shell.wrap(g, B.sub, tx, y + (B.small ? 22 : 22), w - 140, 26, B.small ? 15 : 19, '#fff', 'center');
    g.restore();
  },
  drawPrompt(g, P, t) {
    const p = this.game.P(P.i), n = P.options.length, w = 560, rowH = 40, h = 64 + n * rowH + 30, x = 640 - w / 2, y = 700 - h;
    g.save(); g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 18; g.fillStyle = 'rgba(24,12,52,0.9)'; Shell.rr(g, x, y, w, h, 20); g.fill(); g.restore();
    g.strokeStyle = p.color; g.lineWidth = 3; Shell.rr(g, x, y, w, h, 20); g.stroke();
    Shell.text(g, P.title, 640, y + 38, 21, '#ffe680');
    P.options.forEach((o, k) => {
      const yy = y + 58 + k * rowH, on = k === P.sel;
      if (on) { g.fillStyle = 'rgba(255,255,255,0.14)'; Shell.rr(g, x + 16, yy, w - 32, rowH - 4, 12); g.fill(); g.strokeStyle = p.color; g.lineWidth = 2; Shell.rr(g, x + 16, yy, w - 32, rowH - 4, 12); g.stroke(); }
      Shell.text(g, (on ? '▶ ' : '') + o.label, x + 32, yy + 26, 18, o.off ? 'rgba(255,255,255,0.35)' : on ? '#fff' : '#d8d0f0', 'left');
      if (p.human && P.bot === undefined) Shell.hit(x + 16, yy, w - 32, rowH - 4, () => { if (!o.off && this.ui.prompt === P) { this.ui.prompt = null; P.res(o.value); } }, () => { P.sel = k; });
    });
    const d = P.options[P.sel] && P.options[P.sel].desc; if (d) Shell.text(g, d, 640, y + h - 12, 14, '#c8b8ff');
    if (P.bot !== undefined) Shell.text(g, `${p.name} is thinking…`, 640, y - 10, 15, '#fff');
  },
  drawDie(g, D, t) {
    const p = this.game.P(D.i), T = this.toScreen(this.tok[D.i].x, this.tok[D.i].y), x = T.x, y = Math.max(140, T.y - 170 * this.camZ) - (D.state === 'land' ? Math.sin(Math.min(1, D.t / 0.3) * Math.PI) * 20 : D.state === 'tumble' ? Math.sin(D.t * 14) * 10 : Math.sin(t * 8) * 6);
    const rot = D.state === 'spin' ? Math.sin(t * 20) * 0.15 : D.state === 'tumble' ? D.t * 18 : 0;
    g.save(); g.translate(x, y); g.rotate(rot);
    g.fillStyle = 'rgba(0,0,0,0.3)'; Shell.rr(g, -40, -34, 84, 84, 18); g.fill();
    const dg = g.createLinearGradient(-42, -42, 42, 42); dg.addColorStop(0, '#ffffff'); dg.addColorStop(1, '#d8d0f0'); g.fillStyle = dg; Shell.rr(g, -42, -42, 84, 84, 18); g.fill();
    g.strokeStyle = p.color; g.lineWidth = 5; Shell.rr(g, -42, -42, 84, 84, 18); g.stroke();
    Shell.text(g, String(D.face), 0, 18, 52, '#2a1a4a', 'center', 'bold', null);
    g.restore();
    if (D.prev) Shell.text(g, `${D.prev} +`, x - 80, y + 14, 30, '#fff');
    if (D.state === 'spin') Shell.text(g, p.human ? 'Press Ⓐ to hit the dice block!' : `${p.name} rolls…`, x, y + 76, 17, '#fff');
  },
  drawWheel(g, W, t) {
    const n = W.slots.length, seg = Math.PI * 2 / n, cx = 640, cy = 380, r = 210;
    g.fillStyle = 'rgba(10,6,30,0.55)'; g.fillRect(0, 0, 1280, 720);
    Shell.text(g, W.title, 640, 120, 30, '#ffe680');
    g.save(); g.translate(cx, cy);
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.arc(8, 10, r + 14, 0, 7); g.fill();
    g.fillStyle = '#5a3a1a'; g.beginPath(); g.arc(0, 0, r + 14, 0, 7); g.fill();
    for (let k = 0; k < n; k++) { const a0 = W.ang + k * seg; g.fillStyle = W.slots[k].col; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, r, a0, a0 + seg); g.closePath(); g.fill(); g.strokeStyle = 'rgba(40,20,10,0.5)'; g.lineWidth = 2; g.stroke();
      g.save(); g.rotate(a0 + seg / 2); g.translate(r * 0.62, 0); g.rotate(Math.PI / 2); Shell.text(g, W.slots[k].label, 0, 6, n > 10 ? 13 : 16, '#2a1408', 'center', 'bold', null); g.restore(); }
    const hl = g.createRadialGradient(-60, -80, 10, 0, 0, r); hl.addColorStop(0, 'rgba(255,255,255,0.25)'); hl.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = hl; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill();
    g.fillStyle = '#ffe680'; g.beginPath(); g.arc(0, 0, 26, 0, 7); g.fill(); g.strokeStyle = '#8a5a10'; g.lineWidth = 4; g.stroke();
    for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2; g.fillStyle = (k + Math.floor(t * 6)) % 2 ? '#fff6c8' : '#ffb030'; g.beginPath(); g.arc(Math.cos(a) * (r + 7), Math.sin(a) * (r + 7), 4, 0, 7); g.fill(); }
    g.restore();
    g.fillStyle = '#e8323e'; g.beginPath(); g.moveTo(cx - 18, cy - r - 30); g.lineTo(cx + 18, cy - r - 30); g.lineTo(cx, cy - r + 8); g.closePath(); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 3; g.stroke();
    if (W.state === 'spin') Shell.text(g, W.human ? 'Press Ⓐ to stop the wheel!' : 'Spinning…', 640, 680, 20, '#fff');
    if (W.state === 'done') { const s = W.slots[W.k]; Shell.text(g, s.label, 640, 670, 34, '#ffe680'); }
  },
  drawFinal(g, t) {
    const G = this.game, F = this.ui.final; g.fillStyle = 'rgba(10,6,30,0.6)'; g.fillRect(0, 0, 1280, 720);
    F.order.forEach((i, k) => {
      const p = G.P(i), x = [640, 400, 880, 1080][k], y = [430, 470, 490, 520][k], show = F.t > (3 - k) * 0.5;
      if (!show) return;
      const h = [180, 120, 80, 40][k];
      g.fillStyle = ['#ffd34d', '#c8d0e0', '#d8905a', '#8a7aa8'][k]; Shell.rr(g, x - 80, y + 40, 160, h, 10); g.fill(); Shell.text(g, `${k + 1}`, x, y + 40 + Math.min(h, 60) * 0.7, 36, '#2a1a4a', 'center', 'bold', null);
      Char.draw(g, x, y - 10 - (k === 0 ? Math.abs(Math.sin(t * 5)) * 14 : 0), 44, p.el.id, p.color, { mood: MGH.persona(k === 0 ? 'cheer' : k === 3 ? 'sad' : 'happy', p.el.id), seed: i * 1.7, noShadow: true });
      Shell.text(g, `${p.name}  ⭐${G.totStars(i)} 🪙${G.totCoins(i)}`, x, y + 30 + h + 40, 17, p.color);
    });
  },
  drawPause(g) {
    g.fillStyle = 'rgba(10,6,30,0.7)'; g.fillRect(0, 0, 1280, 720);
    Shell.text(g, 'Paused', 640, 250, 44, '#ffe680');
    const opts = ['▶ Resume', '🏠 Quit to menu'];
    opts.forEach((o, k) => { Shell.button(g, 490, 300 + k * 90, 300, 66, o, this.pauseSel === k, k ? '#ff9a9a' : '#7cf06a'); Shell.hit(490, 300 + k * 90, 300, 66, () => this.pauseDo(k), () => { this.pauseSel = k; }); });
    if (Shell.any('up') || Shell.any('down')) this.pauseSel ^= 1;
    if (Shell.any('a') && performance.now() - this.pauseWall > 250) this.pauseDo(this.pauseSel);
    if (Shell.any('b') && performance.now() - this.pauseWall > 400) this.pauseDo(0);
  },
  pauseDo(k) { this.paused = false; Settings.paused = false; if (k === 1) this.quit(); },
  quit() { if (this.game) this.game.aborted = true; const U = this.ui; ['prompt', 'die', 'wheel', 'banner'].forEach(n => { const o = U[n]; U[n] = null; if (o && o.res) try { o.res(o.k !== undefined ? o.slots[o.k] : o.v); } catch (e) { /* */ } }); this.tok.forEach(T => { if (T.res) { const r = T.res; T.res = null; T.to = null; r(); } }); Shell.go('menu'); },
};

// =====================================================================================================
// THE ART: a toy-like, softly shaded board lit from the top-left
const BoardArt = {
  _g: null, _d: null,
  ground() {
    if (this._g) return this._g;
    const c = document.createElement('canvas'), S = 1.4; c.width = (BD.W + 400) * S; c.height = (BD.H + 400) * S;
    const g = c.getContext('2d'); g.scale(S, S); g.translate(200, 200);
    const h = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
    // meadow with warm sunlit and cool shady patches
    const gg = g.createLinearGradient(0, -200, 0, BD.H + 200); gg.addColorStop(0, '#86d45a'); gg.addColorStop(1, '#5fae3c'); g.fillStyle = gg; g.fillRect(-200, -200, BD.W + 400, BD.H + 400);
    for (let k = 0; k < 160; k++) { const x = h(k) * (BD.W + 400) - 200, y = h(k + 300) * (BD.H + 400) - 200, r = 60 + h(k + 600) * 170, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, k % 3 ? 'rgba(255,250,170,0.16)' : 'rgba(30,90,40,0.16)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
    // fine painterly texture (soft, not scratchy)
    for (let k = 0; k < 9000; k++) { const x = h(k * 3.1) * (BD.W + 400) - 200, y = h(k * 7.7) * (BD.H + 400) - 200; g.fillStyle = h(k) > 0.5 ? 'rgba(30,90,30,0.07)' : 'rgba(220,255,160,0.08)'; g.fillRect(x, y, 3, 2); }
    // grass tufts: little clumps of curved blades, darker at the root, lighter at the tips
    const tuft = (x, y, sc, seed) => { const n = 5 + Math.floor(h(seed) * 4); for (let b = 0; b < n; b++) { const a = (b / (n - 1) - 0.5) * 1.3 + (h(seed + b) - 0.5) * 0.3, len = (9 + h(seed + b * 3) * 8) * sc, tx = x + Math.sin(a) * len, ty = y - Math.cos(a) * len; const gr = g.createLinearGradient(x, y, tx, ty); gr.addColorStop(0, 'rgba(40,110,40,0.7)'); gr.addColorStop(1, 'rgba(170,230,110,0.75)'); g.strokeStyle = gr; g.lineWidth = 2.2 * sc; g.lineCap = 'round'; g.beginPath(); g.moveTo(x + (b - n / 2) * 1.2 * sc, y); g.quadraticCurveTo(x + Math.sin(a) * len * 0.4, y - len * 0.6, tx, ty); g.stroke(); } };
    for (let k = 0; k < 600; k++) { const x = h(k * 4.3 + 1) * (BD.W + 400) - 200, y = h(k * 6.1 + 2) * (BD.H + 400) - 200; g.fillStyle = 'rgba(20,60,20,0.12)'; g.beginPath(); g.ellipse(x + 3, y + 1, 9, 3, 0, 0, 7); g.fill(); tuft(x, y, 0.8 + h(k) * 0.6, k * 7); }
    // clover patches
    for (let k = 0; k < 120; k++) { const cx = h(k * 9.1 + 3) * (BD.W + 400) - 200, cy = h(k * 5.7 + 8) * (BD.H + 400) - 200; for (let c = 0; c < 6; c++) { const x = cx + (h(k + c) - 0.5) * 30, y = cy + (h(k + c + 9) - 0.5) * 18; g.fillStyle = c % 2 ? '#5cb848' : '#4aa83c'; for (let l = 0; l < 3; l++) { const a = l / 3 * Math.PI * 2 - Math.PI / 2; g.beginPath(); g.arc(x + Math.cos(a) * 3.2, y + Math.sin(a) * 3.2, 3.2, 0, 7); g.fill(); } } }
    // little flower clusters with stems
    for (let k = 0; k < 110; k++) { const cx = h(k * 5.3 + 9) * (BD.W + 400) - 200, cy = h(k * 2.9 + 4) * (BD.H + 400) - 200, col = ['#ff8ad0', '#ffffff', '#ffd34d', '#c8a0ff', '#ff6a5a'][k % 5]; for (let f = 0; f < 4; f++) { const x = cx + (h(k + f) - 0.5) * 26, y = cy + (h(k + f + 4) - 0.5) * 14; g.strokeStyle = '#3a8a32'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x, y + 7); g.lineTo(x, y); g.stroke(); g.fillStyle = col; for (let q = 0; q < 5; q++) { const a = q / 5 * 6.28; g.beginPath(); g.arc(x + Math.cos(a) * 2.6, y + Math.sin(a) * 2.6, 2.2, 0, 7); g.fill(); } g.fillStyle = '#ffb030'; g.beginPath(); g.arc(x, y, 1.5, 0, 7); g.fill(); } }
    // the loop path: sandy, with worn edges and grain
    const C = BD.CORNERS, loop = () => { g.beginPath(); g.moveTo(C[0].x + 40, C[0].y); for (let k = 1; k <= 4; k++) { const a = C[k % 4], b = C[(k + 1) % 4]; g.arcTo(a.x, a.y, b.x, b.y, 40); } g.closePath(); };
    g.lineCap = 'round'; g.lineJoin = 'round';
    for (const [lw, col] of [[96, 'rgba(60,90,30,0.35)'], [86, '#b8925a'], [76, '#e3c788'], [52, '#efd9a0']]) { g.strokeStyle = col; g.lineWidth = lw; loop(); g.stroke(); }
    for (let k = 0; k < 900; k++) { const f = h(k + 11), side = Math.floor(h(k + 33) * 4), a = C[side], b = C[(side + 1) % 4], off = (h(k + 55) - 0.5) * 60; const x = a.x + (b.x - a.x) * f + (side % 2 ? off : 0), y = a.y + (b.y - a.y) * f + (side % 2 ? 0 : off); g.fillStyle = h(k) > 0.5 ? 'rgba(150,110,60,0.35)' : 'rgba(255,245,210,0.5)'; g.beginPath(); g.arc(x, y, 1.6 + h(k + 7) * 1.6, 0, 7); g.fill(); }
    for (let side = 0; side < 4; side++) { const a = C[side], b = C[(side + 1) % 4]; for (let k = 0; k < 46; k++) { const f = (k + h(k + side * 50)) / 46, off = (k % 2 ? 1 : -1) * (40 + h(k + side) * 8), x = a.x + (b.x - a.x) * f + (side % 2 ? off : 0), y = a.y + (b.y - a.y) * f + (side % 2 ? 0 : off); tuft(x, y + 4, 0.7 + h(k) * 0.4, k * 13 + side); } }
    // the inner paths: same sandy road, curving through the meadow
    BD.BRANCHES.forEach(B => { const A = BD.spaces[B.a], E = BD.spaces[B.b], cv = () => { g.beginPath(); g.moveTo(A.x, A.y); g.quadraticCurveTo(B.ctrl.x, B.ctrl.y, E.x, E.y); };
      for (const [lw, col] of [[84, 'rgba(60,90,30,0.35)'], [74, '#a88452'], [64, '#dcc084'], [42, '#ead39a']]) { g.strokeStyle = col; g.lineWidth = lw; cv(); g.stroke(); }
      for (let k = 0; k < 160; k++) { const f = h(k + B.a * 7), u = 1 - f, off = (h(k + 3 + B.a) - 0.5) * 50, x = u * u * A.x + 2 * u * f * B.ctrl.x + f * f * E.x + off * 0.6, y = u * u * A.y + 2 * u * f * B.ctrl.y + f * f * E.y + off * 0.5; g.fillStyle = h(k + 9) > 0.5 ? 'rgba(150,110,60,0.35)' : 'rgba(255,245,210,0.5)'; g.beginPath(); g.arc(x, y, 1.5 + h(k) * 1.5, 0, 7); g.fill(); }
      for (let k = 0; k < 30; k++) { const f = (k + 0.5) / 30, u = 1 - f, x = u * u * A.x + 2 * u * f * B.ctrl.x + f * f * E.x, y = u * u * A.y + 2 * u * f * B.ctrl.y + f * f * E.y, dx = 2 * u * (B.ctrl.x - A.x) + 2 * f * (E.x - B.ctrl.x), dy = 2 * u * (B.ctrl.y - A.y) + 2 * f * (E.y - B.ctrl.y), l = Math.hypot(dx, dy) || 1, sd = k % 2 ? 1 : -1; tuft(x - dy / l * 38 * sd, y + dx / l * 38 * sd + 4, 0.7 + h(k) * 0.3, k * 17 + B.a); } });
    // paths out to the holds
    BD.HOLDS.forEach((H, k) => { const a = C[k]; for (const [lw, col] of [[70, 'rgba(60,90,30,0.35)'], [60, '#b8925a'], [50, '#e3c788']]) { g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(H.x, H.y); g.stroke(); } });
    // the pond: dark shore, ripples, lily pads, stones beneath
    const px = 975, py = 580;
    g.fillStyle = 'rgba(0,0,0,0.15)'; g.beginPath(); g.ellipse(px + 6, py + 8, 92, 50, 0, 0, 7); g.fill();
    g.fillStyle = '#b89a6a'; g.beginPath(); g.ellipse(px, py, 92, 50, 0, 0, 7); g.fill();
    const pg = g.createRadialGradient(px - 20, py - 14, 6, px, py, 86); pg.addColorStop(0, '#9ae8ff'); pg.addColorStop(0.6, '#3a9ae0'); pg.addColorStop(1, '#1f5aa8'); g.fillStyle = pg; g.beginPath(); g.ellipse(px, py, 82, 42, 0, 0, 7); g.fill();
    for (let k = 0; k < 4; k++) { g.fillStyle = 'rgba(20,60,100,0.35)'; g.beginPath(); g.ellipse(px - 40 + h(k) * 80, py - 12 + h(k + 4) * 24, 10, 6, 0, 0, 7); g.fill(); }
    g.strokeStyle = 'rgba(255,255,255,0.45)'; g.lineWidth = 2.5; for (let k = 0; k < 3; k++) { g.beginPath(); g.ellipse(px - 12 + k * 12, py - 4 + k * 5, 32 - k * 8, 9 - k * 2, 0, 3.4, 5.8); g.stroke(); }
    for (const [x, y] of [[px - 50, py + 12], [px + 44, py - 16], [px + 24, py + 22]]) { g.fillStyle = '#3a9a3a'; g.beginPath(); g.ellipse(x, y, 16, 9, 0, 0.4, Math.PI * 2 - 0.2); g.lineTo(x, y); g.fill(); g.fillStyle = '#ff9ac8'; g.beginPath(); g.arc(x + 4, y - 3, 3.5, 0, 7); g.fill(); }
    // flower beds in the meadow
    for (const [x, y] of [[455, 285], [1145, 715], [655, 470]]) { g.fillStyle = '#8a5a3a'; g.beginPath(); g.ellipse(x, y, 70, 30, 0, 0, 7); g.fill(); for (let k = 0; k < 30; k++) { const a = h(k + x) * 6.28, d = Math.sqrt(h(k + y)) * 56; g.fillStyle = ['#ff5a7a', '#ffd34d', '#fff', '#c88aff', '#ff8a3a'][k % 5]; g.beginPath(); g.arc(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.4, 3.6, 0, 7); g.fill(); } }
    // hold platforms: carved stone rings in each player's colour
    BD.HOLDS.forEach((H, k) => { const r = 110; g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(H.x + 10, H.y + 16, r + 6, (r + 6) * 0.62, 0, 0, 7); g.fill(); g.fillStyle = '#8a8070'; g.beginPath(); g.ellipse(H.x, H.y + 8, r, r * 0.62, 0, 0, 7); g.fill(); const sg = g.createRadialGradient(H.x - 40, H.y - 30, 10, H.x, H.y, r); sg.addColorStop(0, '#f0e8d8'); sg.addColorStop(1, '#b8ac98'); g.fillStyle = sg; g.beginPath(); g.ellipse(H.x, H.y, r, r * 0.62, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(90,80,60,0.35)'; g.lineWidth = 2; for (let q = 0; q < 12; q++) { const a = q / 12 * 6.28; g.beginPath(); g.moveTo(H.x + Math.cos(a) * 40, H.y + Math.sin(a) * 25); g.lineTo(H.x + Math.cos(a) * r, H.y + Math.sin(a) * r * 0.62); g.stroke(); } g.beginPath(); g.ellipse(H.x, H.y, 40, 25, 0, 0, 7); g.stroke(); });
    // the spaces: chunky glossy tokens with a bevel and a shine
    BD.spaces.forEach(s => this.space(g, s));
    // baked sunlight: warm from the top-left, cooler and shadier toward the bottom-right
    const sun = g.createRadialGradient(150, 50, 50, 300, 200, 1500); sun.addColorStop(0, 'rgba(255,240,180,0.28)'); sun.addColorStop(0.5, 'rgba(255,230,160,0.06)'); sun.addColorStop(1, 'rgba(20,40,80,0.22)'); g.fillStyle = sun; g.fillRect(-200, -200, BD.W + 400, BD.H + 400);
    this._g = c; return c;
  },
  space(g, s) {
    const T = BD.SPACE[s.type], r = s.type === 'gate' || s.type === 'bank' ? 30 : 25;
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(s.x + 5, s.y + 8, r + 2, (r + 2) * 0.7, 0, 0, 7); g.fill();
    g.fillStyle = T.dark; g.beginPath(); g.ellipse(s.x, s.y + 5, r, r * 0.7, 0, 0, 7); g.fill();
    const gr = g.createRadialGradient(s.x - r * 0.4, s.y - r * 0.5, 2, s.x, s.y, r); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.25, T.col); gr.addColorStop(1, T.dark); g.fillStyle = gr; g.beginPath(); g.ellipse(s.x, s.y, r, r * 0.7, 0, 0, 7); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 2; g.beginPath(); g.ellipse(s.x, s.y, r - 4, (r - 4) * 0.7, 0, Math.PI * 1.05, Math.PI * 1.75); g.stroke();
    g.font = `bold ${r * 0.72}px Georgia`; g.textAlign = 'center'; g.lineJoin = 'round';
    if (/^[+−]/.test(T.icon)) { g.lineWidth = 4; g.strokeStyle = 'rgba(0,0,0,0.4)'; g.strokeText(T.icon, s.x, s.y + r * 0.26); g.fillStyle = '#fff'; g.fillText(T.icon, s.x, s.y + r * 0.26); }
    else { g.fillStyle = '#fff'; g.fillText(T.icon, s.x, s.y + r * 0.26); }
  },
  decor() {
    if (this._d) return this._d;
    const D = [], h = n => { const x = Math.sin(n * 91.7 + 12.3) * 43758.5453; return x - Math.floor(x); };
    for (let k = 0; k < 44; k++) { const t = k / 44 * Math.PI * 2, x = 800 + Math.cos(t) * 760 + (h(k) - 0.5) * 80, y = 500 + Math.sin(t) * 470 + (h(k + 5) - 0.5) * 60; if (BD.HOLDS.some(H => Math.hypot(H.x - x, (H.y - y) * 1.4) < 190)) continue; D.push({ x, y, kind: h(k + 9) > 0.45 ? 'tree' : 'bush', s: 0.8 + h(k + 2) * 0.5, v: k }); }
    [[520, 470], [1080, 450], [700, 320], [920, 700], [560, 740], [1180, 640]].forEach(([x, y], k) => D.push({ x, y, kind: k % 2 ? 'bush' : 'tree', s: 0.9 + h(k) * 0.3, v: k + 100 }));
    [[470, 120], [1130, 880]].forEach(([x, y], k) => D.push({ x, y, kind: 'sign', s: 1, v: k }));
    BD.BRANCHES.forEach((B, k) => { const A = BD.spaces[B.a], f = 0.5, u = 0.5, x = u * u * A.x + 2 * u * f * B.ctrl.x + f * f * BD.spaces[B.b].x, y = u * u * A.y + 2 * u * f * B.ctrl.y + f * f * BD.spaces[B.b].y, inw = [[0, 1], [-1, 0], [0, -1], [1, 0]][k]; D.push(k % 2 ? { x: x + inw[0] * 95, y: y + 40, kind: 'bsign', s: 1, v: k, keep: true } : { x: 800, y: k ? 742 : 288, kind: 'bsign', flat: true, s: 1, v: k, keep: true }); });
    for (let k = 0; k < 10; k++) D.push({ x: 440 + h(k + 40) * 720, y: 280 + h(k + 60) * 440, kind: 'rock', s: 0.6 + h(k) * 0.6, v: k });
    this.windmillAt = true;
    this._d = D.filter(d => d.keep || (!BD.spaces.some(s => Math.hypot(s.x - d.x, (s.y - d.y) * 1.3) < 70 || (d.kind === 'tree' && s.y < d.y && d.y - s.y < 130 * d.s && Math.abs(s.x - d.x) < 60 * d.s)) && Math.hypot(d.x - 800, d.y - 520) > 110 && Math.hypot((d.x - 975) / 110, (d.y - 580) / 65) > 1));
    return this._d;
  },
  drawDecor(g, d, t) {
    const { x, y, s } = d;
    g.fillStyle = 'rgba(0,0,0,0.22)'; g.beginPath(); g.ellipse(x + 14 * s, y + 6, 30 * s, 10 * s, 0, 0, 7); g.fill();
    if (d.kind === 'tree') {
      const sw = Math.sin(t * 0.9 + d.v) * 2 * s;
      g.fillStyle = '#7a5532'; g.fillRect(x - 6 * s, y - 34 * s, 12 * s, 36 * s); g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(x + 1 * s, y - 34 * s, 5 * s, 36 * s);
      const lg = g.createRadialGradient(x - 16 * s + sw, y - 80 * s, 6, x + sw, y - 60 * s, 52 * s); lg.addColorStop(0, '#9ae46a'); lg.addColorStop(0.6, '#4aa83a'); lg.addColorStop(1, '#2a7a2a'); g.fillStyle = lg;
      g.beginPath(); g.arc(x + sw, y - 66 * s, 38 * s, 0, 7); g.arc(x - 26 * s + sw, y - 46 * s, 24 * s, 0, 7); g.arc(x + 26 * s + sw, y - 46 * s, 24 * s, 0, 7); g.fill();
      g.fillStyle = 'rgba(20,70,20,0.28)'; g.beginPath(); g.arc(x + 12 * s + sw, y - 50 * s, 26 * s, 0, 7); g.fill();
      g.fillStyle = 'rgba(220,255,170,0.35)'; g.beginPath(); g.arc(x - 12 * s + sw, y - 80 * s, 14 * s, 0, 7); g.arc(x - 30 * s + sw, y - 54 * s, 8 * s, 0, 7); g.fill();
      for (let q = 0; q < 6; q++) { const a = q * 1.1 + d.v, lx = x + sw + Math.cos(a) * 30 * s, ly = y - 62 * s + Math.sin(a) * 22 * s; g.fillStyle = q % 2 ? 'rgba(40,120,40,0.5)' : 'rgba(150,220,100,0.5)'; g.beginPath(); g.ellipse(lx, ly, 6 * s, 3.5 * s, a, 0, 7); g.fill(); }
      if (d.v % 3 === 0) { g.fillStyle = '#e8323e'; for (let k = 0; k < 4; k++) { g.beginPath(); g.arc(x - 18 * s + k * 12 * s + sw, y - 56 * s + (k % 2) * 14 * s, 4 * s, 0, 7); g.fill(); } }
    } else if (d.kind === 'bush') {
      const lg = g.createRadialGradient(x - 10 * s, y - 26 * s, 4, x, y - 14 * s, 34 * s); lg.addColorStop(0, '#8ad860'); lg.addColorStop(1, '#2f7f30'); g.fillStyle = lg;
      g.beginPath(); g.arc(x, y - 16 * s, 22 * s, 0, 7); g.arc(x - 18 * s, y - 8 * s, 15 * s, 0, 7); g.arc(x + 18 * s, y - 8 * s, 15 * s, 0, 7); g.fill();
      g.fillStyle = 'rgba(20,70,20,0.25)'; g.beginPath(); g.arc(x + 10 * s, y - 6 * s, 14 * s, 0, 7); g.fill(); g.fillStyle = 'rgba(220,255,170,0.32)'; g.beginPath(); g.arc(x - 8 * s, y - 26 * s, 8 * s, 0, 7); g.fill();
      if (d.v % 2) { g.fillStyle = '#ffffff'; for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(x - 12 * s + k * 12 * s, y - 20 * s + (k % 2) * 8 * s, 3 * s, 0, 7); g.fill(); } }
    } else if (d.kind === 'rock') {
      g.fillStyle = '#8a8a96'; g.beginPath(); g.ellipse(x, y - 6 * s, 16 * s, 11 * s, 0, 0, 7); g.fill(); g.fillStyle = '#b8b8c4'; g.beginPath(); g.ellipse(x - 4 * s, y - 10 * s, 8 * s, 5 * s, 0, 0, 7); g.fill();
    } else if (d.kind === 'bsign') {
      const B = BD.BRANCHES[d.v]; if (d.flat) { g.fillStyle = 'rgba(0,0,0,0.22)'; Shell.rr(g, x - 64, y - 12, 136, 28, 8); g.fill(); GX.plank(g, x - 68, y - 16, 136, 28, '#d8a868'); MGH.text(g, `${B.icon} ${B.name}`, x, y + 4, 14, '#3a2010', 'center', 'bold'); return; }
      g.fillStyle = '#6a4a2a'; g.fillRect(x - 3, y - 50, 6, 50); g.fillStyle = 'rgba(0,0,0,0.25)'; Shell.rr(g, x - 66, y - 74, 136, 30, 8); g.fill(); GX.plank(g, x - 68, y - 78, 136, 30, '#d8a868'); MGH.text(g, `${B.icon} ${B.name}`, x, y - 57, 14, '#3a2010', 'center', 'bold');
    } else if (d.kind === 'sign') {
      g.fillStyle = '#7a5532'; g.fillRect(x - 4, y - 60, 8, 60); GX.plank(g, x - 50, y - 84, 100, 30, '#c8945a'); MGH.text(g, d.v ? '⭐ ➜' : '🏰 Holds', x, y - 63, 14, '#3a2010', 'center', 'bold');
    }
  },
  windmill(g, x, y, t, gust) {
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(x + 24, y + 8, 60, 16, 0, 0, 7); g.fill();
    const bg = g.createLinearGradient(x - 40, 0, x + 40, 0); bg.addColorStop(0, '#fff2dc'); bg.addColorStop(1, '#c8b090'); g.fillStyle = bg;
    g.beginPath(); g.moveTo(x - 40, y); g.lineTo(x - 26, y - 130); g.lineTo(x + 26, y - 130); g.lineTo(x + 40, y); g.closePath(); g.fill();
    g.fillStyle = '#c84a3a'; g.beginPath(); g.moveTo(x - 34, y - 126); g.lineTo(x, y - 168); g.lineTo(x + 34, y - 126); g.fill();
    g.fillStyle = '#6a4a2a'; Shell.rr(g, x - 12, y - 40, 24, 40, 10); g.fill(); g.fillStyle = '#7ab8e0'; g.beginPath(); g.arc(x, y - 90, 10, 0, 7); g.fill();
    const a = t * (gust ? 6 : 0.8); g.save(); g.translate(x, y - 128);
    for (let k = 0; k < 4; k++) { g.save(); g.rotate(a + k * Math.PI / 2); g.fillStyle = '#8a6a3a'; g.fillRect(-3, 0, 6, 90); g.fillStyle = '#fff8e8'; g.fillRect(4, 18, 24, 68); g.strokeStyle = 'rgba(120,90,60,0.5)'; g.lineWidth = 1; for (let q = 0; q < 4; q++) { g.beginPath(); g.moveTo(4, 26 + q * 16); g.lineTo(28, 26 + q * 16); g.stroke(); } g.restore(); }
    g.fillStyle = '#5a3a1a'; g.beginPath(); g.arc(0, 0, 8, 0, 7); g.fill(); g.restore();
    if (gust) for (let k = 0; k < 8; k++) { const q = (t * 2 + k / 8) % 1; g.strokeStyle = `rgba(255,255,255,${0.7 * (1 - q)})`; g.lineWidth = 3; g.beginPath(); g.arc(x + 60 + q * 300, y - 80 + Math.sin(k) * 40, 30, -0.6, 0.6); g.stroke(); }
  },
  bank(g, x, y, star, t, k) {
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(x + 18, y + 6, 58, 16, 0, 0, 7); g.fill();
    const wg = g.createLinearGradient(x - 50, 0, x + 50, 0); wg.addColorStop(0, '#fff6e0'); wg.addColorStop(1, '#d8c8a0'); g.fillStyle = wg; g.fillRect(x - 46, y - 64, 92, 64);
    g.fillStyle = '#c8a050'; g.beginPath(); g.moveTo(x - 56, y - 62); g.lineTo(x, y - 96); g.lineTo(x + 56, y - 62); g.fill();
    for (let q = 0; q < 4; q++) { g.fillStyle = '#f4ecd8'; g.fillRect(x - 38 + q * 24, y - 58, 8, 52); g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(x - 32 + q * 24, y - 58, 2, 52); }
    g.fillStyle = '#5a3a1a'; Shell.rr(g, x - 10, y - 30, 20, 30, 6); g.fill(); g.fillStyle = '#ffd34d'; g.beginPath(); g.arc(x, y - 78, 7, 0, 7); g.fill();
    if (star) { const b = Math.sin(t * 3) * 6; MGH.glow(g, x, y - 128 + b, 50, 'rgba(255,230,120,0.7)'); MGH.star(g, x, y - 128 + b, 22, '#ffe680', t * 1.5, false); for (let q = 0; q < 5; q++) { const a = t * 2 + q * 1.26; MGH.star(g, x + Math.cos(a) * 40, y - 128 + Math.sin(a) * 16 + b, 4, '#fff', a, false); } }
  },
  hold(g, x, y, p, H, t, dogOn, chase) {
    // a little keep in the player's colour with a treasure chest and a guard dog
    const col = p.color;
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(x + 24, y + 4, 60, 16, 0, 0, 7); g.fill();
    const wg = g.createLinearGradient(x - 40, 0, x + 40, 0); wg.addColorStop(0, '#e8e0d0'); wg.addColorStop(1, '#a89a88'); g.fillStyle = wg; g.fillRect(x - 36, y - 76, 72, 76);
    for (let q = 0; q < 4; q++) g.fillRect(x - 36 + q * 20, y - 88, 12, 12);
    g.strokeStyle = 'rgba(80,70,60,0.3)'; g.lineWidth = 1; for (let r = 0; r < 5; r++) { g.beginPath(); g.moveTo(x - 36, y - 64 + r * 14); g.lineTo(x + 36, y - 64 + r * 14); g.stroke(); }
    g.fillStyle = '#4a3020'; Shell.rr(g, x - 12, y - 36, 24, 36, 10); g.fill();
    g.fillStyle = '#5a5a5a'; g.fillRect(x - 1, y - 120, 3, 34); g.fillStyle = col; g.beginPath(); g.moveTo(x + 2, y - 120); g.lineTo(x + 30 + Math.sin(t * 4) * 3, y - 112); g.lineTo(x + 2, y - 104); g.fill();
    // the chest grows with the stash
    const v = H.coins + H.stars * 15 + H.items.length * 3, cs = 0.8 + Math.min(0.6, v / 60);
    g.save(); g.translate(x + 54, y - 4); g.scale(cs, cs); g.fillStyle = '#8a5a2a'; Shell.rr(g, -16, -16, 32, 18, 3); g.fill(); g.fillStyle = '#a86a32'; g.beginPath(); g.ellipse(0, -16, 16, 8, 0, Math.PI, 0); g.fill(); g.fillStyle = '#ffd34d'; g.fillRect(-16, -12, 32, 3); g.fillRect(-3, -18, 6, 8);
    if (v > 0) { MGH.glow(g, 0, -20, 20, 'rgba(255,220,100,0.5)'); if (H.stars) MGH.star(g, 0, -30, 6, '#ffe680', t * 2, false); }
    g.restore();
    // guard dog by the kennel
    const dx = x - 62 + (chase ? Math.min(60, (t % 3) * 80) : 0), dy = y - 4, wag = Math.sin(t * (dogOn ? 14 : 4)) * 0.4, sleep = !dogOn;
    g.fillStyle = '#a86a3a'; g.beginPath(); g.moveTo(dx - 20, dy - 8); g.lineTo(dx - 26, dy - 34); g.lineTo(dx - 2, dy - 30); g.lineTo(dx + 4, dy - 8); g.fill(); g.fillStyle = '#e8323e'; g.fillRect(dx - 26, dy - 36, 30, 5);
    g.save(); g.translate(dx + 18, dy - 4);
    g.fillStyle = '#c8945a'; g.beginPath(); g.ellipse(0, -8, 14, 9, 0, 0, 7); g.fill(); g.beginPath(); g.arc(12, -16, 8, 0, 7); g.fill(); g.fillStyle = '#8a5a2a'; g.beginPath(); g.ellipse(10, -22, 3, 6, -0.4, 0, 7); g.fill();
    g.save(); g.translate(-13, -10); g.rotate(-0.8 + wag); g.fillStyle = '#c8945a'; g.fillRect(0, -2, 10, 4); g.restore();
    g.fillStyle = '#2a1a10'; if (sleep) { g.fillRect(12, -18, 4, 1.5); } else { g.beginPath(); g.arc(14, -18, 1.6, 0, 7); g.fill(); } g.beginPath(); g.arc(20, -15, 2, 0, 7); g.fill();
    if (sleep) MGH.text(g, 'z', 22 + Math.sin(t * 2) * 3, -30 - (t % 2) * 6, 12, '#fff', 'center', 'bold');
    if (dogOn && !sleep) MGH.text(g, chase ? 'WOOF!' : '?', 20, -34, 16, chase ? '#ff6a4a' : '#fff', 'center', 'bold');
    g.restore();
    // owner banner
    g.fillStyle = 'rgba(20,12,44,0.7)'; Shell.rr(g, x - 56, y + 14, 112, 22, 11); g.fill(); MGH.text(g, `${p.name}'s Hold`, x, y + 30, 13, col, 'center', 'bold');
  },
  alinMini(g, x, y, t) {
    // a small Alin for banners (the full one lives in the Traitors game)
    g.save(); g.translate(x, y);
    g.fillStyle = '#ff4fb0'; g.beginPath(); g.moveTo(-22, -16); g.quadraticCurveTo(-30, 14, -24, 34); g.lineTo(24, 34); g.quadraticCurveTo(30, 14, 22, -16); g.closePath(); g.fill();
    g.fillStyle = '#ffd34d'; g.beginPath(); g.moveTo(-8, -16); g.lineTo(-2, 8); g.lineTo(-12, -6); g.closePath(); g.fill(); g.beginPath(); g.moveTo(8, -16); g.lineTo(2, 8); g.lineTo(12, -6); g.closePath(); g.fill();
    g.fillStyle = '#2ad0ff'; g.beginPath(); g.moveTo(0, -14); g.lineTo(-10, -20); g.lineTo(-10, -8); g.closePath(); g.moveTo(0, -14); g.lineTo(10, -20); g.lineTo(10, -8); g.closePath(); g.fill();
    g.fillStyle = '#ffd8c0'; g.beginPath(); g.arc(0, -36, 18, 0, 7); g.fill();
    g.fillStyle = '#f4f4ff'; for (const [hx, hy, hr] of [[-16, -44, 9], [-8, -52, 10], [4, -54, 10], [15, -47, 9], [19, -36, 7], [-19, -33, 7], [-2, -58, 7]]) { g.beginPath(); g.arc(hx, hy, hr, 0, 7); g.fill(); }
    g.fillStyle = '#3a2050'; g.beginPath(); g.ellipse(-6, -36, 3.2, 4.2, 0, 0, 7); g.ellipse(6, -36, 3.2, 4.2, 0, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(-5, -38, 1.4, 0, 7); g.arc(7, -38, 1.4, 0, 7); g.fill();
    g.strokeStyle = '#a83a5a'; g.lineWidth = 2; g.beginPath(); g.arc(0, -29, 5, 0.2, Math.PI - 0.2); g.stroke();
    g.fillStyle = 'rgba(255,120,150,0.45)'; g.beginPath(); g.ellipse(-11, -30, 4, 2.5, 0, 0, 7); g.ellipse(11, -30, 4, 2.5, 0, 0, 7); g.fill();
    MGH.star(g, 16, -52, 5, '#ffd34d', 0.3, false);
    g.restore();
  },
  // drifting cloud shadows across the whole board
  clouds(g, t, tod) {
    if (tod === 'night') return;
    for (let k = 0; k < 5; k++) { const x = ((k * 520 + t * (14 + k * 3)) % (BD.W + 900)) - 450, y = 120 + ((k * 337) % 800), r = 210 + (k % 3) * 60; const gr = g.createRadialGradient(x, y, r * 0.2, x, y, r); gr.addColorStop(0, 'rgba(10,30,50,0.13)'); gr.addColorStop(1, 'rgba(10,30,50,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, r * 1.4, r * 0.8, 0, 0, 7); g.fill(); }
  },
  // screen-space light: soft sun rays from the top-left and a gentle vignette
  sunlight(g, tod, t) {
    if (tod !== 'night') { g.save(); g.globalCompositeOperation = 'lighter'; for (let k = 0; k < 4; k++) { const a = 0.55 + k * 0.12 + Math.sin(t * 0.3 + k) * 0.02, w = 40 + k * 18; g.fillStyle = tod === 'golden' ? 'rgba(255,170,80,0.05)' : 'rgba(255,250,210,0.05)'; g.beginPath(); g.moveTo(-60, -60); g.lineTo(-60 + Math.cos(a - 0.04) * 1700, -60 + Math.sin(a - 0.04) * 1700); g.lineTo(-60 + Math.cos(a + 0.04) * 1700 + w, -60 + Math.sin(a + 0.04) * 1700); g.closePath(); g.fill(); } g.restore(); }
    if (!this._vig) { const c = document.createElement('canvas'); c.width = 1280; c.height = 720; const q = c.getContext('2d'), gr = q.createRadialGradient(640, 330, 380, 640, 360, 820); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(10,10,30,0.42)'); q.fillStyle = gr; q.fillRect(0, 0, 1280, 720); this._vig = c; }
    g.drawImage(this._vig, 0, 0);
  },
  // time of day: warm golden light, or a blue night with lantern glows and fireflies
  todOverlay(g, tod, t, B) {
    if (tod === 'golden') { g.fillStyle = 'rgba(255,150,60,0.18)'; g.fillRect(0, 0, 1280, 720); const gr = g.createLinearGradient(0, 0, 1280, 720); gr.addColorStop(0, 'rgba(255,210,120,0.22)'); gr.addColorStop(1, 'rgba(200,80,40,0.12)'); g.fillStyle = gr; g.fillRect(0, 0, 1280, 720); }
    if (tod === 'night') {
      g.fillStyle = 'rgba(14,20,60,0.5)'; g.fillRect(0, 0, 1280, 720);
      g.save(); g.globalCompositeOperation = 'lighter';
      const lamps = BD.HOLDS.map(h => ({ x: h.x, y: h.y - 40 })).concat(BD.spaces.filter(s => s.type === 'bank').map(s => ({ x: s.x, y: s.y }))).concat(B.tok.map(T => ({ x: T.x, y: T.y - 30 })));
      lamps.forEach(L => { const s = B.toScreen(L.x, L.y); MGH.glow(g, s.x, s.y, 110 * B.camZ, 'rgba(255,190,100,0.22)'); });
      for (let k = 0; k < 30; k++) { const x = (k * 151 + Math.sin(t * 0.4 + k) * 60 + 1280) % 1280, y = (k * 89 + Math.cos(t * 0.5 + k * 2) * 40) % 720, a = 0.5 + 0.5 * Math.sin(t * 3 + k); g.fillStyle = `rgba(220,255,140,${0.6 * a})`; g.beginPath(); g.arc(x, y, 2.4, 0, 7); g.fill(); }
      g.restore();
    }
  },
};

// =====================================================================================================
// the shell screens: board setup and the board itself
Object.assign(Shell, {
  boardOpts: { rounds: 12, bonus: true },
  scr_boardsetup(g) {
    this.logo(g, 640, 70, 0.42);
    this.text(g, '🎲 The Crossing', 640, 196, 36, '#ffe680');
    const O = this.boardOpts, R_ = [10, 12, 15, 20];
    const items = [
      { label: `Rounds: ◀ ${O.rounds} ▶`, sub: 'Left / Right to change', lr: d => { O.rounds = R_[(R_.indexOf(O.rounds) + d + R_.length) % R_.length]; }, col: '#8fd8ff' },
      { label: `Bonus stars: ◀ ${O.bonus ? 'ON' : 'OFF'} ▶`, sub: O.bonus ? `A secret 1–${O.rounds <= 12 ? 2 : 3} extra stars at the end` : 'No bonus stars', lr: () => { O.bonus = !O.bonus; }, col: '#ffcc33' },
      { label: '▶ Start the party!', sub: `${O.rounds} rounds · Final Frenzy in the last 5`, fn: () => Board.start(this.players(), Object.assign({}, O)), col: '#7cf06a' },
    ];
    if (this.any('left') && items[this.sel] && items[this.sel].lr) { items[this.sel].lr(-1); Sfx.click(); }
    if (this.any('right') && items[this.sel] && items[this.sel].lr) { items[this.sel].lr(1); Sfx.click(); }
    items.forEach(it => { if (!it.fn) it.fn = () => it.lr(1); });
    this.menuList(g, items, 90, 250, 470, 78, 92);
    this.panel(g, 620, 236, 600, 400);
    const lines = ['⭐ Buy stars at the bank where the star is — it moves after every sale.', '🏰 Stash coins and stars in your Hold (your Gate space) to keep them safe…', '🏴‍☠️ …but rivals can RAID it! Day: mostly nothing. Night: rich pickings. Golden hour: best for stars.', '🐕 Guard dogs, traps and padlocks protect Holds.', '🔥 The last 5 rounds: double spaces and DUELS when you land on a rival.', '🏡 A Hold can\'t be raided while its owner is within 5 spaces of home.'];
    lines.forEach((l, k) => this.wrap(g, l, 650, 276 + k * 60, 540, 22, 16, '#fff'));
    this.hints(g, [['A', 'Choose'], ['B', 'Back']]);
    if (this.any('b')) this.go('menu');
  },
  scr_board(g, dt) {
    if (!Board.game) { this.go('menu'); return; }
    Board.update(dt); Board.draw(g, dt);
    if (Board.done) { Board.done = false; const G = Board.game; if (G.result && !G.aborted) { G.result.winners.forEach(i => { const c = this.seats[i].char; this.rec.wins[c] = (this.rec.wins[c] || 0) + 1; }); this.save('rec'); } this.boardEnd = G; this.go('boardend'); }
  },
  scr_boardend(g) {
    const G = this.boardEnd; if (!G || !G.result) { this.go('menu'); return; }
    this.text(g, '🏆 The Crossing — final results', 640, 80, 36, '#ffe680');
    G.result.order.forEach((i, k) => { const p = G.P(i), y = 170 + k * 110; this.panel(g, 300, y, 680, 94); this.text(g, `${k + 1}`, 350, y + 60, 40, ['#ffd34d', '#d8e0f0', '#e8a060', '#a898c8'][k]); this.hero(g, 440, y + 52, 34, this.seats[i].char, { mood: k === 0 ? 'cheer' : 'happy' }); this.text(g, p.name, 520, y + 56, 26, p.color, 'left'); this.text(g, `⭐ ${G.totStars(i)}   🪙 ${G.totCoins(i)}`, 940, y + 56, 24, '#fff', 'right'); });
    this.button(g, 490, 640, 300, 60, '◀ Main menu', true, '#7cf06a'); this.hit(490, 640, 300, 60, () => this.go('menu'));
    if (this.anyA() || this.any('b')) this.go('menu');
  },
});
