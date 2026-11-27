'use strict';
// =====================================================================================================
// The Crossing, part 2: fork guardians, the new event spaces, character dice, star pricing, weather,
// the zoo, bounties, raffles, markets — layered on top of board.js.
// =====================================================================================================

// ---------------------------------------------------------------- new spaces
Object.assign(BD.SPACE, {
  pier:     { name: 'Fishing Pier', col: '#4ab8e8', dark: '#1a6a9a', icon: '🎣', desc: 'Cast as often as you dare — every catch is bigger, but the eel can snap the lot.' },
  comb:     { name: 'Honeycomb', col: '#ffc040', dark: '#b87a10', icon: '🍯', desc: 'Pick honey cells one by one. Find the Queen Bee and you lose this visit\'s honey.' },
  zoo:      { name: 'The Zoo', col: '#8a5ad8', dark: '#4a2a8a', icon: '🦖', desc: 'Pass by to feed the beast or buy snares. Land here and it bites — coins, or a STAR when it\'s big.' },
  fountain: { name: 'Wishing Fountain', col: '#7ad8f0', dark: '#2a8aa8', icon: '⛲', desc: 'Toss coins into the shared pot. Every toss raises the chance someone wins it all.' },
  balloon:  { name: 'Hot-Air Balloon', col: '#ff7a8a', dark: '#b83a4a', icon: '🎈', desc: 'Pay 8 coins to fly where you like — unless the wind turns.' },
  bounty:   { name: 'Bounty Board', col: '#c89a5a', dark: '#7a5a2a', icon: '📜', desc: 'Post a bounty on the leader. Land on the WANTED player to collect it.' },
  market:   { name: 'Market Stall', col: '#ff9a3a', dark: '#b85a10', icon: '🎃', desc: 'Buy pumpkins cheap, sell them dear. They rot after 4 rounds!' },
  bridge:   { name: 'Rope Bridge', col: '#b8905a', dark: '#6a4a2a', icon: '🌉', desc: 'A shortcut that frays a little with every crossing… until it snaps.' },
  vane:     { name: 'Weather Vane', col: '#9ab8d8', dark: '#4a6a8a', icon: '🌦️', desc: 'Choose the weather for the next round.' },
  raffle:   { name: 'Raffle Booth', col: '#e85ac8', dark: '#9a2a7a', icon: '🎟️', desc: 'Buy raffle tickets. Every 4 rounds Alin draws a winner.' },
  lantern:  { name: 'Lantern Stall', col: '#ffb84a', dark: '#a86a1a', icon: '🏮', desc: 'By day: +3 coins. At night: the Night Market with rare items.' },
});
delete BD.SPACE.event;

// ---------------------------------------------------------------- new items
Object.assign(BD.ITEMS, {
  key:    { name: 'Gate Key', icon: '🗝️', price: 6, kind: 'pass', desc: 'Opens the locked gate at its fork (used up when you go through).' },
  bundle: { name: 'Star Bundle', icon: '🌟', price: 10, kind: 'pass', desc: 'At the star bank, buy up to 2 stars at once.' },
  coupon: { name: 'Star Coupon', icon: '🎫', price: 6, kind: 'pass', desc: 'Buy a star for half now — pay the rest at the next bank or lose the star.' },
  midas:  { name: 'Midas Touch', icon: '👑', price: 30, kind: 'play', rare: true, desc: 'Roll two dice — and take a star from the first rival you pass or land on.' },
  snareC: { name: 'Coin Snare', icon: '🪤', price: 12, kind: 'snare', zoo: true, desc: 'Set it on the space you stand on: the next rival to land there pays you 10 coins.' },
  snareS: { name: 'Star Snare', icon: '🕸️', price: 40, kind: 'snare', zoo: true, desc: 'Set it on the space you stand on: the next rival to land there loses a STAR to you.' },
});

// ---------------------------------------------------------------- layout: types are shuffled every game
BD.MAINMIX = ['bounty', 'pier', 'market', 'vane', 'zoo', 'fountain', 'raffle', 'lucky', 'lucky', 'item', 'item', 'item', 'swirl',
  'red', 'red', 'red', 'red', 'red', 'red', 'blue', 'blue', 'blue', 'blue', 'blue', 'blue', 'blue', 'blue', 'blue', 'blue', 'blue', 'blue', 'blue'];
BD.BRANCHMIX = [['chest', 'comb', 'red', 'mush', 'blue'], ['bridge', 'chest', 'geyser', 'red', 'blue'], ['comb', 'chest', 'geyser', 'mush', 'red'], ['lantern', 'chest', 'lantern', 'balloon', 'lantern']];
BD.BRANCHES.forEach((B, k) => { B.types = BD.BRANCHMIX[k].slice(); });
BD.layout = () => {
  const slots = BD.spaces.filter(s => s.i < 40 && s.type !== 'gate' && s.type !== 'bank');
  const mix = R.shuffle(BD.MAINMIX.slice());
  // keep event spaces apart: retry a few shuffles until no two events sit next to each other
  const ev = t => !['blue', 'red'].includes(t);
  for (let tries = 0; tries < 40; tries++) { let ok = true; for (let k = 0; k < slots.length - 1 && ok; k++) if (ev(mix[k]) && ev(mix[k + 1]) && slots[k + 1].i === slots[k].i + 1) ok = false; if (ok) break; R.shuffle(mix).forEach((t, k) => { mix[k] = t; }); }
  slots.forEach((s, k) => { s.type = mix[k]; });
  BD.BRANCHES.forEach((B, k) => { const m2 = R.shuffle(BD.BRANCHMIX[k].slice()); B.ids.forEach((id, q) => { BD.spaces[id].type = m2[q]; }); });
  BoardArt._g = null;
};
BD.REG = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
BD.SAFE = [3, 4, 5, 6];
// one personal dice block per character: different shapes, the same overall worth
BD.CDICE = [
  { name: 'Gust', faces: [1, 1, 7, 7, 7, 8], desc: 'Sprinter: a crawl or a dash' },            // Zephi
  { name: 'Ripple', faces: [5, 6, 6, 7, '🪙+5', '🪙+5'], desc: 'Banker: fewer moves, steady coins' }, // Drip
  { name: 'Blaze', faces: [0, 0, 0, 10, 10, 10], desc: 'Gambler: nothing or ten' },                // Pyra
  { name: 'Boulder', faces: [4, 4, 5, 5, 6, 6], desc: 'Steady: always 4 to 6' },                   // Pebble
  { name: 'Willo', faces: [2, 2, 4, 4, 8, 10], desc: 'Hopper: small hops, big leaps' },            // Wisp
  { name: 'Drizzle', faces: [5, 6, 7, 8, '🪙+3', '🪙+4'], desc: 'Earner: moves or coins' },       // Mizzle
  { name: 'Spark', faces: [2, 3, 4, 5, 8, 9], desc: 'Ladder: climbs from low to high' },          // Flint
  { name: 'Bloom', faces: [3, 5, 6, 7, 8, '🎁'], desc: 'Gardener: sometimes grows an item' },      // Blossom
  { name: 'Icicle', faces: [3, 3, 6, 6, 6, 6], desc: 'Twin: threes and sixes' },                   // Frost
  { name: 'Zap', faces: [7, 7, 7, 7, 1, 1], desc: 'Lucky Seven: mostly sevens' },                  // Volt
  { name: 'Dune', faces: [2, 4, 6, 8, 10, '🪙−2'], desc: 'Wild: evens, or a coin slip' },          // Dune
  { name: 'Ember', faces: [5, 6, 7, 8, '🧲3', '🧲3'], desc: 'Thief: or pinch 3 coins from the leader' }, // Cinder
  { name: 'Halo', faces: [1, 3, 5, 5, 7, 9], desc: 'Odd: only odd numbers' },                     // Lumi
  { name: 'Shade', faces: [2, 4, 4, 6, 6, 8], desc: 'Even: only even numbers' },                   // Nyx
  { name: 'Cog', faces: [0, 1, 8, 9, 9, '🪙+3'], desc: 'Comet: all or nothing, with a coin face' }, // Rivet
];
BD.cdie = p => BD.CDICE[p.el.id % BD.CDICE.length];
BD.RULES = [
  { id: 'golden', name: 'Golden Week', icon: '🌞', desc: 'Blue spaces give 5 coins instead of 3.' },
  { id: 'thieves', name: 'Thieves\' Night', icon: '🏴‍☠️', desc: 'Raiding a Hold costs nothing.' },
  { id: 'lucky', name: 'Lucky Star', icon: '⭐', desc: 'Stars start at 15 coins instead of 20.' },
  { id: 'hungry', name: 'Hungry Zoo', icon: '🦖', desc: 'The zoo beast starts half-grown.' },
  { id: 'sale', name: 'Bargain Day', icon: '🏷️', desc: 'Every shop item costs 2 coins less.' },
  { id: 'windy', name: 'Windy Days', icon: '🌬️', desc: 'Every roll moves one space further.' },
];
BD.GUARDS = {
  collector:  { name: 'the Collector', icon: '💰', toll: { day: 3, golden: 5, night: 8 } },
  alternator: { name: 'the Alternator', icon: '🗿', toll: { day: 4, golden: 6, night: 9 } },
  competitor: { name: 'the Competitor', icon: '🎲', die: { day: 6, golden: 8, night: 10 } },
  gate:       { name: 'the Locked Gate', icon: '🔐' },
};
BD.WEATHER = { rain: { icon: '🌧️', name: 'Rain', desc: 'Blue spaces pay double.' }, wind: { icon: '🌬️', name: 'Wind', desc: 'Every roll moves 2 further.' }, fog: { icon: '🌫️', name: 'Fog', desc: 'Event spaces are hidden.' }, sun: { icon: '☀️', name: 'Sunshine', desc: 'Stars cost 3 less.' } };
BD.ZOOSTAR = 40;
BD.spaces.filter(s => s.type === 'event').forEach(s => { s.type = 'vane'; });
BD.BRANCHES.forEach((B, k) => B.ids.forEach((id, q) => { BD.spaces[id].type = B.types[q]; }));

// ---------------------------------------------------------------- game state set-up (called right after construction)
BoardGame.prototype.setup2 = function (opts) {
  BD.layout();
  this.info = !!opts.info;
  const gates = R.shuffle([0, 1, 2, 3]); this.players.forEach((p, i) => { p.pos = gates[i] * 10; p.pump = 0; p.pumpAt = 0; p.debt = 0; });
  this.rule = R.pick(BD.RULES);
  this.guard = R.shuffle(['collector', 'alternator', 'competitor', 'gate']);
  this.alt = [0, 1, 2, 3].map(() => R.pick(['main', 'branch']));
  this.zoo = { size: this.rule.id === 'hungry' ? 20 : 0, fed: [0, 0, 0, 0], anim: 0 };
  this.bounty = null; this.fountain = { pot: 5, n: 0 }; this.raffle = { t: [0, 0, 0, 0], pot: 10 };
  this.pumpPrice = R.int(4, 7); this.bridge = { wear: 0, max: R.int(5, 7), downUntil: 0 };
  this.weather = null; this.traps = {}; this.nextBank = R.pick([0, 1, 2, 3].filter(b => b !== this.starBank));
};
// keep the board's own start, but run the extra set-up before tokens are placed
Board.start = function (players, opts) {
  this.game = new BoardGame(players, opts); this.game.setup2(opts); this.ui = {}; this.fx = []; this.floats = []; this.paused = false; this.done = false; this.cam.target = null; this.camZ = 0.48; Settings.paused = false;
  this.tok = this.game.players.map(p => { const s = BD.spaces[p.pos]; return { x: s.x, y: s.y, hop: 0, fx: s.x, fy: s.y, face: 1 }; });
  this.intro = { t: 0 };
  Shell.go('board');
  this.game.run().then(() => { this.done = true; }).catch(e => { if (e && e.message !== 'board-aborted') console.error(e); this.done = true; });
};

BoardGame.prototype._useItem1 = BoardGame.prototype.useItem; // the classic item effects
Object.defineProperty(BoardGame.prototype, 'weatherNow', { get() { return this.weather && this.weather.round === this.round ? this.weather.kind : null; } });
Object.assign(BoardGame.prototype, {
  starPrice() {
    const base = this.rule && this.rule.id === 'lucky' ? 15 : 20, tod = { day: 0, golden: -5, night: 5 }[this.tod] || 0;
    return clamp(base + tod + (this.weatherNow === 'sun' ? -3 : 0), 15, 30);
  },
  price(id) { return Math.max(1, BD.ITEMS[id].price - (this.rule && this.rule.id === 'sale' ? 2 : 0)); },
  randItem(rareOK = 0.04) { const ids = Object.keys(BD.ITEMS).filter(id => !BD.ITEMS[id].zoo && (!BD.ITEMS[id].rare || Math.random() < rareOK)); return R.pick(ids); },

  // ------------------------------------------------------------------ the whole game
  async run() {
    Board.cam.z = 0.48; Board.cam.x = BD.W / 2; Board.cam.y = BD.H / 2; Board.focus = null;
    await this.flyover();
    await this.guide();
    await Board.banner('Welcome to the Crossing!', `I'm Alin, your host! ${this.rounds} rounds. Buy ⭐ stars at the bank that has one, stash treasure in your Hold — and raid your rivals'!`, 4000);
    await Board.banner(`${this.rule.icon} Today's rule: ${this.rule.name}`, this.rule.desc, 3000);
    await Board.banner('Turn order', this.order.map(i => this.P(i).name).join(' → '), 2000);
    for (this.round = 1; this.round <= this.rounds; this.round++) {
      this.chk();
      await this.roundStart();
      for (const i of this.order) { this.chk(); await this.turn(i); }
      this.chk();
      if (this.round % 4 === 0) await this.raffleDraw();
      await this.minigame();
    }
    await this.finish();
  },
  // a short how-to-play for newcomers (asked once at the start)
  async guide() {
    const who = this.players.find(p => p.human); if (!who || Settings.test) return;
    const knows = await Board.ask(who.i, '👋 New to The Crossing?', [{ label: '📖 Show me how to play', value: false, desc: 'A quick guide — about a minute.' }, { label: '✅ I know how to play', value: true }], () => true);
    if (knows) return;
    const steps = [
      ['🎲 Your turn', 'Pick a dice block — Regular (1–10), Safe (3–6) or your hero\'s own dice — and hop that many spaces.'],
      ['⭐ Stars win the game', 'One bank sells the star — it glows. Pass it with enough coins and buy it. After a sale the star flies to another bank.'],
      ['🪙 Coins', 'Blue spaces give coins, red ones take them. The minigame after each round pays the most: 10 for 1st, 5 for 2nd, 2 for 3rd.'],
      ['🔀 Forks', 'Inner paths are full of chests, honey and geysers — but each fork has a guardian: pay the Collector, slip past the Alternator, beat the Competitor\'s dice, or open the gate with a Key.'],
      ['🏰 Your Hold', 'Passing your own Gate lets you stash coins and stars in your Hold. From round 3 rivals can raid it — set traps, padlocks and decoys!'],
      ['🎪 Event spaces', 'Fishing Pier, Honeycomb, Wishing Fountain, Market, Raffle, Weather Vane, Bounty Board… and the Zoo: feed the beast when you pass, but whoever LANDS there gets bitten.'],
      ['🎒 Items', 'Shops sell items. You can use ONE item and buy ONE item per turn (buying the star doesn\'t count).'],
      ['🏆 The end', 'After the last round Alin hands out secret bonus stars. Most stars wins — coins break ties. Have fun!'],
    ];
    for (const [t, d] of steps) await Board.banner(t, d, 5200);
  },
  async flyover() {
    if (Settings.test) return;
    const stops = BD.BRANCHES.map((B, f) => ({ f, x: (BD.spaces[B.a].x + BD.spaces[B.b].x) / 2 * 0.5 + B.ctrl.x * 0.5, y: (BD.spaces[B.a].y + BD.spaces[B.b].y) / 2 * 0.5 + B.ctrl.y * 0.5 }));
    for (const s of stops) { const G = BD.GUARDS[this.guard[s.f]], B = BD.BRANCHES[s.f]; Board.cam.target = s; Board.ui.spot = s.f;
      await Board.banner(`${B.icon} ${B.name}`, `Guarded by ${G.icon} ${G.name}${this.guard[s.f] === 'gate' ? ' — bring a 🗝️ Key' : this.guard[s.f] === 'competitor' ? ' — beat his dice to pass' : this.guard[s.f] === 'collector' ? ' — he charges a toll' : ' — he blocks one road and switches every round'}.`, 2100, true); }
    const zoo = BD.spaces.find(s => s.type === 'zoo'); if (zoo) { Board.cam.target = zoo; await Board.banner('🦖 The Zoo', 'Don\'t feed the animals… or do. It bites whoever lands here!', 2100, true); }
    Board.cam.target = null; Board.ui.spot = null;
  },
  async roundStart() {
    const T = BD.TOD[this.tod];
    if (this.round === this.rounds - 4) await this.startFrenzy();
    // the Alternator stomps across to the other road
    if (this.round > 1) this.guard.forEach((k, f) => { if (k === 'alternator') { this.alt[f] = this.alt[f] === 'main' ? 'branch' : 'main'; Board.ui.altStomp = { f, t: 0 }; } });
    // pumpkin prices follow the time of day; old pumpkins rot
    this.pumpPrice = { day: R.int(4, 7), golden: R.int(7, 12), night: R.int(2, 4) }[this.tod];
    for (const p of this.players) if (p.pump && this.round - p.pumpAt > 4) { await Board.banner(`🎃 ${p.name}'s pumpkins rotted!`, `${p.pump} squishy pumpkin${p.pump > 1 ? 's' : ''} thrown away.`, 1500, true); p.pump = 0; }
    // the bounty grows and follows the leader
    if (this.bounty) { this.bounty.val += 2; const lead = this.standings()[0]; if (lead !== this.bounty.on && this.totStars(lead) + this.totCoins(lead) > 0) { this.bounty.on = lead; await Board.banner('📜 The WANTED poster moves!', `${this.P(lead).name} is the new leader — bounty ${this.bounty.val} coins.`, 1500, true); } }
    if (this.bridge.downUntil && this.round >= this.bridge.downUntil) { this.bridge = { wear: 0, max: R.int(5, 7), downUntil: 0 }; await Board.banner('🌉 The rope bridge is fixed!', 'Crystal Creek is open again.', 1300, true); }
    const W = this.weatherNow ? BD.WEATHER[this.weatherNow] : null;
    await Board.banner(`Round ${this.round} of ${this.rounds}`, `${T.icon} ${T.name} · ⭐ ${this.starPrice()} coins${W ? ` · ${W.icon} ${W.name}: ${W.desc}` : ''}`, 1900);
    // comeback help: every third round the last-place player gets a random item (very rarely the Midas Touch)
    if (this.round > 1 && this.round % 3 === 1) { const last = this.standings()[3], p = this.P(last); const id = Math.random() < 0.08 ? 'midas' : this.randItem(0); await Board.banner(`🎁 A gift for ${p.name} (last place)`, `Alin hands over: ${BD.ITEMS[id].icon} ${BD.ITEMS[id].name}!`, 1800); this.giveItem(last, id); }
  },

  // ------------------------------------------------------------------ one player's turn: one item, one purchase
  async turn(i) {
    const p = this.P(i); Board.focus = i; Board.current = i; Board.cam.z = 1.4; this.bought = false; this.turnItem = false;
    await Board.banner(`${p.name}'s turn`, '', 800, true);
    let roll = null;
    while (roll === null) {
      this.chk();
      const opts = [{ label: '🎲 Roll the dice', value: 'roll' }];
      if (!this.turnItem) for (const id of [...new Set(p.items)]) { const it = BD.ITEMS[id]; if (it.kind === 'raid' || it.kind === 'pass') continue; if (it.kind === 'snare' && (BD.spaces[p.pos].type === 'gate' || BD.spaces[p.pos].type === 'bank' || this.traps[p.pos])) continue; opts.push({ label: `${it.icon} ${it.kind === 'install' ? 'Install' : it.kind === 'snare' ? 'Set' : 'Use'} ${it.name}`, value: id, desc: it.desc }); }
      if (p.human) opts.push({ label: '🗺️ Look at the map', value: 'map', desc: 'Look around the whole board.' }, { label: '📖 Help · spaces · items', value: 'help', desc: 'What every space, item, guardian and dice does.' });
      const v = opts.length === 1 ? 'roll' : await Board.ask(i, `${p.name}'s turn${this.turnItem ? ' (item used)' : ''}`, opts, () => BoardAI.turnPick(this, i));
      if (v === 'map' || v === 'help') { await Board.openOverlay(v); continue; }
      if (v === 'roll') { roll = await this.roll(i); break; }
      const before = p.items.length; await this.useItem(i, v); if (p.items.length < before) this.turnItem = true;
    }
    if (roll > 0) await this.move(i, roll); else { await Board.banner(`${p.name} stays put.`, '', 800, true); }
    await sleep(300);
  },
  async useItem(i, id) {
    const p = this.P(i), it = BD.ITEMS[id];
    if (it.kind === 'snare') { const k = p.items.indexOf(id); if (k < 0) return; p.items.splice(k, 1); this.traps[p.pos] = { owner: i, kind: id }; Sfx.pop(); await Board.banner(`${it.icon} ${p.name} sets a ${it.name}!`, 'The next rival to land here gets caught.', 1500, true); return; }
    if (id === 'midas') { const k = p.items.indexOf(id); if (k < 0) return; p.items.splice(k, 1); p.mods.midas = true; Sfx.star(); await Board.banner('👑 MIDAS TOUCH!', `${p.name} rolls two dice — and the first rival they pass or land on gives up a star!`, 2000); return; }
    return BoardGame.prototype._useItem1.call(this, i, id);
  },
  async roll(i) {
    const p = this.P(i), m = p.mods; p.mods = {}; this.midas = !!m.midas;
    const cursed = p.curse; p.curse = false;
    let faces = BD.REG, kind = 'reg';
    if (cursed) faces = [1, 2, 3];
    else if (!m.dice2 && !m.midas) {
      const D = BD.cdie(p);
      kind = await Board.ask(i, `${p.name}: which dice block?`, [
        { label: '🎲 Regular dice  (1 – 10)', value: 'reg', desc: 'The classic: anything from 1 to 10.' },
        { label: '🛡️ Safe dice  (3 – 6)', value: 'safe', desc: 'Never too far, never too short.' },
        { label: `✨ ${D.name} dice  [ ${D.faces.join(' · ')} ]`, value: 'char', desc: `${p.name}'s own dice — ${D.desc}.` },
      ], () => BoardAI.dicePick(this, i));
      faces = kind === 'safe' ? BD.SAFE : kind === 'char' ? D.faces : BD.REG;
    }
    let v = await this.face(i, await Board.dice(i, faces));
    if (m.dice2 || m.midas) { await sleep(250); v += await this.face(i, await Board.dice(i, BD.REG, v)); }
    if (cursed) Board.float(i, '🐌 cursed!', '#c8b8ff');
    if (p.mush) { v += p.mush; Board.float(i, `🍄 +${p.mush}`, '#ffb08a'); p.mush = 0; }
    if (v > 0 && this.weatherNow === 'wind') { v += 2; Board.float(i, '🌬️ +2', '#cfe8ff'); }
    if (v > 0 && this.rule.id === 'windy') v += 1;
    Board.ui.rolled = { v, t: 0, i }; await sleep(650); Board.ui.rolled = null;
    return v;
  },
  // a character-dice face can be coins, a steal or an item instead of moves
  async face(i, f) {
    if (typeof f === 'number') return f;
    const p = this.P(i);
    if (f.startsWith('🪙+')) { this.gain(i, +f.slice(3)); await Board.banner(`${f} for ${p.name}!`, 'No moving this time.', 900, true); }
    else if (f.startsWith('🪙−')) { this.gain(i, -f.slice(3)); await Board.banner(`Oops — ${p.name} drops ${f.slice(3)} coins!`, '', 900, true); }
    else if (f.startsWith('🧲')) { const n = +f.slice(2), lead = this.players.filter(q => q.i !== i).sort((a, b) => b.coins - a.coins)[0], t = Math.min(n, lead.coins); lead.coins -= t; p.coins += t; Sfx.coin(); await Board.banner(`🧲 ${p.name} pinches ${t} coins from ${lead.name}!`, 'No moving this time.', 1100, true); }
    else if (f === '🎁') { await Board.banner(`🎁 ${p.name}'s dice grows an item!`, 'No moving this time.', 900, true); this.giveItem(i, this.randItem(0)); }
    return 0;
  },

  // ------------------------------------------------------------------ moving: forks, passing events, the Midas touch
  async move(i, steps) {
    const p = this.P(i);
    for (let s = 0; s < steps; s++) {
      this.chk();
      const left = steps - s - 1, from = p.pos, nx = BD.spaces[p.pos].nx;
      p.pos = nx.length > 1 ? await this.pickPath(i, p.pos, left + 1) : nx[0]; p.st.moved++;
      Board.ui.steps = { i, left }; await Board.hop(i); Sfx.step();
      const sp = BD.spaces[p.pos];
      if (sp.type === 'bridge') { const broke = await this.bridgeCross(i, from); if (broke) { Board.ui.steps = null; return; } }
      if (this.midas) { const q = this.players.find(q2 => q2.i !== i && q2.pos === p.pos && q2.stars > 0); if (q) { this.midas = false; q.stars--; p.stars++; q.st.bad += 2; Sfx.star(); await Board.banner(`👑 ${p.name}'s golden touch!`, `${q.name} hands over a ⭐!`, 1800); } }
      if (left === 0) break; // landing events happen in land()
      if (sp.type === 'bank') { await this.payDebt(i); if (sp.bank === this.starBank) await this.starOffer(i); }
      if (sp.type === 'gate') { if (sp.owner === i) await this.holdVisit(i); else await this.raidOffer(i, sp.owner); }
      if (sp.type === 'zoo') await this.zooPass(i);
    }
    Board.ui.steps = null; this.midas = false;
    const sp = BD.spaces[p.pos];
    if (sp.type === 'bank') { await this.payDebt(i); if (sp.bank === this.starBank) await this.starOffer(i); }
    if (sp.type === 'gate') { if (sp.owner === i) await this.holdVisit(i); else await this.raidOffer(i, sp.owner); }
    await this.land(i);
  },
  // the fork guardians
  async pickPath(i, pos, steps) {
    const sp = BD.spaces[pos], f = sp.fork, B = BD.BRANCHES[f], kind = this.guard[f], G = BD.GUARDS[kind], p = this.P(i), tod = this.tod, bankHere = f === this.starBank;
    const main = { label: `🛣️ Main road${bankHere ? ' — the ⭐ bank!' : ' (past the bank)'}`, value: 'main', desc: bankHere ? `The star is on sale at the ${BD.BANK_NAMES[f]}.` : `Passes the ${BD.BANK_NAMES[f]} shop.` };
    const br = { label: `${B.icon} ${B.name}`, value: 'branch', desc: 'Chests, honey, geysers… and a red space.' };
    let toll = 0;
    if (kind === 'collector') { toll = G.toll[tod]; br.label += ` — pay ${toll}🪙 to ${G.name}`; br.off = p.coins < toll; }
    if (kind === 'alternator') { toll = G.toll[tod]; const o = this.alt[f] === 'main' ? main : br; o.label += ` — 🗿 blocked! (pay ${toll}🪙)`; o.off = p.coins < toll; o.blocked = true; }
    if (kind === 'competitor') { br.label += ` — beat ${G.name}'s d${G.die[tod]}`; }
    if (kind === 'gate') { const has = p.items.includes('key'); br.label += has ? ' — unlock with your 🗝️' : ' — 🔐 locked (needs a Key)'; br.off = !has; }
    if (B.ids.some(id => BD.spaces[id].type === 'bridge') && this.bridge.downUntil) { br.label = `${B.icon} ${B.name} — 🌉 the bridge is out!`; br.off = true; }
    if (main.off && br.off) main.off = false; // never stuck: the main road lets you through for free
    Board.ui.fork = { pos, t: 0 };
    let v = await Board.ask(i, `${p.name}: which way? (${steps} to go)`, [main, br], () => BoardAI.pathPick(this, i, sp, main, br));
    Board.ui.fork = null;
    const o = v === 'main' ? main : br;
    if (o.off) v = 'main';
    else if (o.blocked || (v === 'branch' && kind === 'collector')) { const t = Math.min(p.coins, toll); p.coins -= t; p.st.spent += t; Sfx.coin(); Board.ui.guardHit = { f, t: 0 }; await Board.banner(`${G.icon} ${G.name} takes ${t} coins`, `…and lets ${p.name} through.`, 1100, true); }
    else if (v === 'branch' && kind === 'gate') { p.items.splice(p.items.indexOf('key'), 1); Sfx.pop(); await Board.banner('🗝️ Click! The gate swings open.', '', 1000, true); }
    else if (v === 'branch' && kind === 'competitor') {
      const die = G.die[tod]; await Board.banner(`🎲 ${G.name} rolls a d${die}…`, `Roll higher to pass, ${p.name}!`, 1100, true);
      const his = await Board.dice(i, Array.from({ length: die }, (_, k) => k + 1)); const mine = await Board.dice(i, BD.REG, null);
      if (mine > his) { Sfx.coin(); await Board.banner(`${mine} beats ${his}!`, `${G.name} steps aside.`, 1200, true); }
      else { v = 'main'; Sfx.bad(); Board.ui.guardHit = { f, t: 0 }; await Board.banner(`${mine} vs ${his} — blocked!`, `${G.name} points ${p.name} down the main road.`, 1400, true); }
    }
    return v === 'main' ? sp.nx[0] : sp.nx[1];
  },
  async payDebt(i) {
    const p = this.P(i); if (!p.debt) return;
    if (p.coins >= p.debt) { p.coins -= p.debt; await Board.banner(`🎫 ${p.name} pays off the coupon`, `${p.debt} coins — the star is theirs for good.`, 1300, true); }
    else { if (p.stars > 0) p.stars--; Sfx.bad(); await Board.banner(`🎫 ${p.name} can't pay the coupon!`, 'The bank takes the star back.', 1500, true); }
    p.debt = 0;
  },
  async bridgeCross(i, from) {
    const p = this.P(i), B = this.bridge; B.wear++; Board.ui.bridgeShake = 0.6;
    if (B.wear < B.max) { if (B.wear >= B.max - 2) Board.float(i, '🌉 creak…', '#ffd0a0'); return false; }
    B.downUntil = this.round + 3; Sfx.boom(); Board.ui.bridgeSnap = { t: 0 };
    await Board.banner('🌉 SNAP! The rope bridge breaks!', `${p.name} tumbles into the creek, loses 6 coins and washes back to the fork.`, 2200);
    this.gain(i, -6); p.st.bad++; p.pos = BD.BRANCHES.find(Bb => Bb.ids.includes(p.pos)).a; Board.snap(i); Board.ui.bridgeSnap = null; return true;
  },

  // ------------------------------------------------------------------ landing
  async land(i) {
    const p = this.P(i), sp = BD.spaces[p.pos], x2 = this.frenzy ? 2 : 1, rain = this.weatherNow === 'rain' ? 2 : 1;
    Board.pulse(p.pos);
    const t = sp.type; this.n['L' + t] = (this.n['L' + t] || 0) + 1;
    if (t === 'blue' || (t === 'lantern' && this.tod !== 'night')) { this.gain(i, (this.rule.id === 'golden' ? 5 : 3) * x2 * (t === 'blue' ? rain : 1)); p.mood = 'happy'; }
    else if (t === 'red') { this.gain(i, -3 * x2); p.st.reds++; p.st.bad++; p.mood = 'sad'; }
    else if (t === 'item') { await Board.banner(`${p.name} found an item!`, '', 900, true); this.giveItem(i, this.randItem()); }
    else if (t === 'lucky') await this.luckyWheel(i);
    else if (t === 'swirl') await this.swirl(i, R.pick([0, 1, 2, 3].filter(j => j !== i)), 'The swirl spins you around!');
    else if (t === 'bank') await this.shop(i);
    else if (t === 'chest') await this.chest(i);
    else if (t === 'mush') { p.mush = (p.mush || 0) + 3; Board.float(i, '🍄 next roll +3', '#ffb08a'); Sfx.pop(); await Board.banner(`🍄 ${p.name} eats a bouncy mushroom!`, 'Next roll gets +3.', 1100, true); }
    else if (t === 'geyser') { p.st.events++; Sfx.whoosh(); Board.ui.geyser = { pos: p.pos, t: 0 }; await Board.banner('⛲ Geyser!', `${p.name} is blasted forward 3 spaces!`, 1100, true); Board.ui.geyser = null; await this.move(i, 3); return; }
    else if (t === 'pier') await this.pier(i);
    else if (t === 'comb') await this.comb(i);
    else if (t === 'zoo') await this.zooAttack(i);
    else if (t === 'fountain') await this.fountainVisit(i);
    else if (t === 'balloon') { const moved = await this.balloon(i); if (moved) { await this.land(i); return; } }
    else if (t === 'bounty') await this.bountyPost(i);
    else if (t === 'market') await this.market(i);
    else if (t === 'vane') await this.vane(i);
    else if (t === 'raffle') await this.raffleBuy(i);
    else if (t === 'lantern') await this.nightMarket(i);
    await sleep(400);
    // a snare set by a rival
    const tr = this.traps[p.pos]; if (tr && tr.owner !== i) { delete this.traps[p.pos]; const o = this.P(tr.owner); Board.ui.trapT = 1; Sfx.boom();
      if (tr.kind === 'snareS' && p.stars > 0) { p.stars--; o.stars++; await Board.banner(`🕸️ ${p.name} is caught in ${o.name}'s Star Snare!`, `A ⭐ goes to ${o.name}.`, 2000); }
      else { const n = Math.min(10, p.coins); p.coins -= n; o.coins += n; await Board.banner(`🪤 ${p.name} steps in ${o.name}'s snare!`, `${n} coins go to ${o.name}.`, 1800); } p.st.bad++; }
    // the WANTED player is here: collect the bounty
    if (this.bounty && this.bounty.on !== i && this.P(this.bounty.on).pos === p.pos) { const v = this.bounty.val; this.bounty = null; p.coins += v; Sfx.coin(); Board.ui.bountyGet = { i, t: 0 }; await Board.banner(`📜 ${p.name} catches the WANTED player!`, `The Bounty Board pays ${v} coins.`, 1900); Board.ui.bountyGet = null; }
    const others = this.players.filter(q => q.i !== i && q.pos === p.pos && t !== 'gate');
    if (others.length) { const o = others[0].i; if (this.frenzy) await this.duel(i, o); else await this.punch(i, o); }
  },

  // ------------------------------------------------------------------ stars and shops
  async starOffer(i) {
    const p = this.P(i), price = this.starPrice(), half = Math.ceil(price / 2), bundle = p.items.includes('bundle'), coupon = p.items.includes('coupon') && !p.debt;
    this.n.offers = (this.n.offers || 0) + 1;
    const opts = [];
    if (p.coins >= price) opts.push({ label: `⭐ Buy a star — ${price}🪙`, value: 1 });
    if (bundle && p.coins >= price * 2) opts.push({ label: `🌟 Star Bundle: buy 2 stars — ${price * 2}🪙`, value: 2 });
    if (coupon && p.coins >= half && p.coins < price + 10) opts.push({ label: `🎫 Coupon: ${half}🪙 now, ${price - half}🪙 at the next bank`, value: 'c' });
    if (!opts.length) { if (p.human) await Board.banner(`The star is here, ${p.name}!`, `It costs ${price} coins — you have ${p.coins}.`, 1300, true); return; }
    opts.push({ label: 'No thanks', value: 0 });
    const k = await Board.ask(i, `⭐ The star costs ${price} coins (${BD.TOD[this.tod].name})`, opts, () => opts.find(o => o.value === 2) ? 2 : opts.find(o => o.value === 1) ? 1 : opts.find(o => o.value === 'c') ? 'c' : 0);
    if (!k) return;
    let n = 1;
    if (k === 2) { n = 2; p.items.splice(p.items.indexOf('bundle'), 1); p.coins -= price * 2; }
    else if (k === 'c') { p.items.splice(p.items.indexOf('coupon'), 1); p.coins -= half; p.debt = price - half; }
    else p.coins -= price;
    p.stars += n; p.st.spent += price * n; this.n.stars += n; Sfx.star(); Board.ui.starGet = { i, t: 0 };
    await Board.banner(`⭐ ${p.name} got ${n > 1 ? n + ' STARS' : 'a STAR'}! ⭐`, k === 'c' ? `Remember: ${p.debt} coins due at the next bank.` : '', 2200); Board.ui.starGet = null;
    this.starBank = this.nextBank; this.nextBank = R.pick([0, 1, 2, 3].filter(b => b !== this.starBank));
    Board.ui.starHop = { t: 0 }; Sfx.whoosh();
    await Board.banner('The star flies away…', `…to the ${BD.BANK_NAMES[this.starBank]}!`, 1900); Board.ui.starHop = null;
  },
  async shop(i, title = '🏦 Bank shop', pool = null) {
    const p = this.P(i); if (p.items.length >= BD.BAG) return;
    if (this.bought) { if (p.human) await Board.banner('One purchase per turn!', 'You already bought something this turn.', 1100, true); return; }
    const ids = pool || R.shuffle(Object.keys(BD.ITEMS).filter(id => !BD.ITEMS[id].zoo && (!BD.ITEMS[id].rare || Math.random() < 0.04))).slice(0, 4);
    const opts = ids.map(id => { const it = BD.ITEMS[id], pr = this.price(id); return { label: `${it.icon} ${it.name} — ${pr}🪙`, value: id, desc: it.desc, off: p.coins < pr }; }).concat([{ label: 'Leave the shop', value: null }]);
    const v = await Board.ask(i, title, opts, () => BoardAI.shopPick(this, i, ids));
    if (!v) return; const pr = this.price(v); if (p.coins < pr) return;
    p.coins -= pr; p.st.spent += pr; this.giveItem(i, v); this.bought = true;
  },
  async nightMarket(i) {
    if (this.tod !== 'night') return;
    const extra = R.shuffle(['bundle', 'coupon', 'key', 'snareC', 'dice2', 'compass']).slice(0, 3);
    await this.shop(i, '🏮 The Night Market', (Math.random() < 0.35 ? ['midas'] : []).concat(extra));
  },

  // ------------------------------------------------------------------ the new event spaces
  async pier(i) {
    const p = this.P(i), VAL = [2, 4, 6, 9, 13], EEL = [0.1, 0.2, 0.3, 0.42, 0.55]; let got = 0; p.st.events++;
    for (let k = 0; k < VAL.length; k++) {
      const go = await Board.ask(i, `🎣 Fishing Pier — ${got ? `${got} coins in the bucket` : 'cast your line?'}`, [{ label: `🎣 Cast${k ? ' again' : ''} (+${VAL[k]}, ${Math.round(EEL[k] * 100)}% eel)`, value: true }, { label: got ? `🪣 Stop and keep ${got} coins` : 'Walk away', value: false }], () => BoardAI.pushLuck(this, i, EEL[k], got));
      if (!go) break;
      Board.ui.cast = { i, t: 0 }; Sfx.whoosh(); await sleep(700);
      if (Math.random() < EEL[k]) { Board.ui.cast = { i, t: 0, eel: true }; Sfx.bad(); await Board.banner('🐍 SNAP! The eel!', got ? `It gobbles all ${got} coins of fish.` : 'It steals your bait.', 1600); Board.ui.cast = null; got = 0; p.st.bad++; break; }
      got += VAL[k]; Sfx.coin(); Board.float(i, `🐟 +${VAL[k]}`, '#9fe0ff'); Board.ui.cast = null;
    }
    if (got) this.gain(i, got);
  },
  async comb(i) {
    const p = this.P(i), cells = R.shuffle([2, 2, 3, 3, 4, 4, 5, 'queen', 'jelly']), open = new Set(); let got = 0; p.st.events++;
    Board.ui.comb = { cells, open, t: 0 };
    for (;;) {
      const opts = cells.map((c, k) => ({ label: `🍯 Cell ${k + 1}`, value: k })).filter(o => !open.has(o.value));
      opts.push({ label: got ? `✋ Stop and keep ${got} coins` : 'Walk away', value: -1 });
      const k = await Board.ask(i, `🍯 Honeycomb — ${got} coins of honey so far`, opts, () => BoardAI.combPick(this, i, open.size, got, opts));
      if (k < 0) break;
      open.add(k); const c = cells[k];
      if (c === 'queen') { Sfx.bad(); Board.ui.comb.queen = k; await Board.banner('👑🐝 The QUEEN BEE!', got ? `She chases ${p.name} off — all ${got} coins of honey are gone.` : 'She buzzes angrily. Better luck next time!', 1700); got = 0; p.st.bad++; break; }
      if (c === 'jelly') { got += 8; Sfx.star(); Board.float(i, '👑 Royal jelly +8', '#ffe680'); } else { got += c; Sfx.coin(); Board.float(i, `🍯 +${c}`, '#ffd34d'); }
      if (open.size >= 8) break;
    }
    Board.ui.comb = null; if (got) this.gain(i, got);
  },
  async zooPass(i) {
    const p = this.P(i), Z = this.zoo;
    const opts = [3, 6, 10, 15].map(n => ({ label: `🍖 Feed the beast ${n}🪙`, value: 'f' + n, off: p.coins < n, desc: `It grows. Whoever fed it most has a 50% chance it leaves them alone.` }));
    if (!this.bought) ['snareC', 'snareS'].forEach(id => opts.push({ label: `${BD.ITEMS[id].icon} Buy a ${BD.ITEMS[id].name} — ${this.price(id)}🪙`, value: id, off: p.coins < this.price(id) || p.items.length >= BD.BAG, desc: BD.ITEMS[id].desc }));
    opts.push({ label: 'Walk past', value: null });
    const v = await Board.ask(i, `🦖 The Zoo — the beast is ${this.zooMood()}${this.info ? ` (${Z.size}/${BD.ZOOSTAR})` : ''}`, opts, () => BoardAI.zooPick(this, i, opts));
    if (!v) return;
    if (v[0] === 'f') { const n = +v.slice(1); p.coins -= n; Z.size += n; Z.fed[i] += n; Z.anim = 1; Sfx.pop(); await Board.banner(`🍖 ${p.name} feeds the beast ${n} coins`, `It's ${this.zooMood()} now.`, 1200, true); }
    else { const pr = this.price(v); p.coins -= pr; this.giveItem(i, v); this.bought = true; }
  },
  zooMood() { const s = this.zoo.size; return s >= BD.ZOOSTAR ? 'HUGE — it wants a STAR' : s >= 28 ? 'big and grumpy' : s >= 14 ? 'growing' : 'small and sleepy'; },
  async zooAttack(i) {
    const p = this.P(i), Z = this.zoo, fav = Math.max(...Z.fed) > 0 ? Z.fed.indexOf(Math.max(...Z.fed)) : -1; p.st.events++;
    Board.ui.zoo = { t: 0, i }; Sfx.tone(120, 0.5, 'sawtooth', 0.06); await sleep(900);
    if (fav === i && Math.random() < 0.5) { Board.ui.zoo = null; await Board.banner('🦖 The beast sniffs… and purrs!', `It remembers ${p.name} fed it. No harm done.`, 1700); return; }
    if (Z.size >= BD.ZOOSTAR && p.stars > 0) { p.stars--; Z.size = 0; Z.fed = [0, 0, 0, 0]; Sfx.bad(); p.st.bad += 2; await Board.banner('🦖 CHOMP! It swallows a STAR!', `${p.name} loses a ⭐. The full beast shrinks back down.`, 2300); }
    else { const n = Math.min(p.coins, Z.size >= BD.ZOOSTAR ? 15 : 3 + Math.floor(Z.size / 5)); p.coins -= n; p.st.bad++; Sfx.bad(); await Board.banner(`🦖 CHOMP! The beast bites ${p.name}!`, `${n} coins gone.`, 1700); }
    Board.ui.zoo = null;
  },
  async fountainVisit(i) {
    const p = this.P(i), F = this.fountain;
    const ch = n => Math.min(0.5, 0.04 + F.n * 0.03 + n * 0.015);
    const opts = [2, 5, 10].map(n => ({ label: `🪙 Toss ${n} coins (${Math.round(ch(n) * 100)}% to win the pot)`, value: n, off: p.coins < n })).concat([{ label: 'Just make a wish (free)', value: 0 }]);
    const n = await Board.ask(i, `⛲ Wishing Fountain — the pot holds ${F.pot} coins`, opts, () => BoardAI.fountainPick(this, i, opts));
    if (!n) return;
    p.coins -= n; F.pot += n; const c = ch(n); F.n++; Board.ui.splash = { i, t: 0 }; Sfx.pop(); await sleep(800);
    if (Math.random() < c) { const v = F.pot; p.coins += v; this.fountain = { pot: 5, n: 0 }; Sfx.star(); await Board.banner(`⛲ WISH GRANTED! ${p.name} wins the pot!`, `${v} coins!`, 2200); }
    else await Board.banner('⛲ Plink… nothing.', `The pot grows to ${F.pot} coins.`, 1200, true);
    Board.ui.splash = null;
  },
  async balloon(i) {
    const p = this.P(i); if (p.coins < 8) return false;
    const sb = this.starBank * 10 + 4, opts = [{ label: `🎈 Fly next to the ⭐ bank — 8🪙`, value: sb }, { label: `🎈 Fly home to your Hold — 8🪙`, value: i * 10 }, { label: 'Stay on the ground', value: -1 }];
    const v = await Board.ask(i, '🎈 Hot-Air Balloon', opts, () => BoardAI.balloonPick(this, i, sb));
    if (v < 0) return false;
    p.coins -= 8; Sfx.whoosh(); Board.ui.balloonFly = { i, t: 0 }; let to = v;
    if (Math.random() < 0.25) { to = R.pick(BD.spaces.filter(s => s.i < 40 && s.type !== 'gate').map(s => s.i)); await Board.banner('🌬️ The wind turns!', `The balloon drifts off course…`, 1300, true); }
    p.pos = to; Board.snap(i); Board.ui.balloonFly = null; await Board.banner(`🎈 ${p.name} floats down`, `…at ${BD.SPACE[BD.spaces[to].type].name}.`, 1100, true);
    return true;
  },
  async bountyPost(i) {
    const st = this.standings(), on = st[0] === i ? st[1] : st[0], q = this.P(on);
    if (this.bounty && this.bounty.on === on) { this.bounty.val += 3; await Board.banner('📜 The bounty goes up!', `${q.name} is now worth ${this.bounty.val} coins.`, 1500, true); return; }
    this.bounty = { on, val: this.bounty ? this.bounty.val : 5 }; Sfx.drum && Sfx.drum(1);
    await Board.banner(`📜 WANTED: ${q.name}!`, `Land on ${q.name}'s space to collect ${this.bounty.val} coins. It grows every round.`, 2000);
  },
  async market(i) {
    const p = this.P(i), pr = this.pumpPrice, opts = [];
    for (let n = 1; n <= 3 - p.pump; n++) opts.push({ label: `🎃 Buy ${n} pumpkin${n > 1 ? 's' : ''} — ${n * pr}🪙`, value: n, off: p.coins < n * pr });
    if (p.pump) opts.push({ label: `💰 Sell ${p.pump} pumpkin${p.pump > 1 ? 's' : ''} — +${p.pump * pr}🪙`, value: -1 });
    opts.push({ label: 'Just looking', value: 0 });
    const v = await Board.ask(i, `🎃 Market Stall — pumpkins are ${pr} coins today (${BD.TOD[this.tod].name})`, opts, () => BoardAI.marketPick(this, i, opts));
    if (v > 0) { p.coins -= v * pr; if (!p.pump) p.pumpAt = this.round; p.pump += v; Sfx.coin(); }
    if (v < 0) { this.gain(i, p.pump * pr); p.pump = 0; }
  },
  async vane(i) {
    const p = this.P(i), opts = Object.entries(BD.WEATHER).map(([k, W]) => ({ label: `${W.icon} ${W.name}`, value: k, desc: W.desc }));
    const v = await Board.ask(i, `🌦️ ${p.name} turns the Weather Vane — next round will be…`, opts, () => BoardAI.vanePick(this, i));
    this.weather = { kind: v, round: this.round + 1 }; Sfx.breeze && Sfx.breeze(); Board.ui.gust = 1.2;
    await Board.banner(`${BD.WEATHER[v].icon} ${BD.WEATHER[v].name} next round!`, BD.WEATHER[v].desc, 1600, true);
  },
  async raffleBuy(i) {
    const p = this.P(i), Rf = this.raffle, opts = [1, 2, 3].map(n => ({ label: `🎟️ Buy ${n} ticket${n > 1 ? 's' : ''} — ${n * 2}🪙`, value: n, off: p.coins < n * 2 })).concat([{ label: 'No thanks', value: 0 }]);
    const n = await Board.ask(i, `🎟️ Raffle Booth — prize: ${Rf.pot} coins · draw every 4 rounds`, opts, () => p.coins > 12 ? R.int(1, 3) : 0);
    if (n) { p.coins -= n * 2; Rf.t[i] += n; Rf.pot += n * 2; Sfx.pop(); }
  },
  async raffleDraw() {
    const Rf = this.raffle, tot = Rf.t.reduce((a, b) => a + b, 0); if (!tot) { Rf.pot += 5; return; }
    Board.focus = null; Board.cam.z = 0.48; Board.ui.drum = 1; Sfx.drum(0); await Board.banner('🎟️ RAFFLE DRAW!', `Alin reaches into the drum… prize: ${Rf.pot} coins`, 2000); Board.ui.drum = 0;
    const blank = Math.max(2, Math.round(tot * 0.4)); let r = Math.random() * (tot + blank), w = -1; for (let k = 0; k < 4; k++) { r -= Rf.t[k]; if (r < 0) { w = k; break; } }
    if (w < 0) { Rf.pot += 5; await Board.banner('🎟️ A blank ticket!', `Nobody wins — the prize grows to ${Rf.pot} coins.`, 1800); }
    else { const p = this.P(w); p.coins += Rf.pot; Sfx.star(); await Board.banner(`🎟️ ${p.name} wins the raffle!`, `${Rf.pot} coins!`, 2000); Rf.pot = 10; }
    Rf.t = [0, 0, 0, 0];
  },
});

// ---------------------------------------------------------------- computer players for the new choices
Object.assign(BoardAI, {
  dicePick(G, i) {
    const p = G.P(i), d = this.distTo(G, i, G.starBank * 10 + 5), price = G.starPrice();
    if (p.coins >= price && d >= 3 && d <= 6) return 'safe';
    if (p.coins >= price && d > 10) return 'reg';
    return R.pick(['reg', 'char', 'char', 'safe']);
  },
  pathPick(G, i, sp, main, br) {
    const p = G.P(i), price = G.starPrice();
    if (br.off) return 'main'; if (main.off) return 'branch';
    if (sp.fork === G.starBank && p.coins >= price) return main.blocked ? (p.coins - 9 >= price ? 'main' : 'branch') : 'main';
    if (main.blocked) return R.chance(0.7) ? 'branch' : 'main';
    if (br.blocked) return p.coins > 25 && R.chance(0.3) ? 'branch' : 'main';
    if (/pay/.test(br.label)) return p.coins > 15 && R.chance(0.5) ? 'branch' : 'main';
    return R.chance(0.6) ? 'branch' : 'main';
  },
  pushLuck(G, i, risk, got) { return risk < 0.25 || (risk < 0.35 && got < 6); },
  combPick(G, i, n, got, opts) { if (got >= 9 || n >= 4) return -1; return R.pick(opts.filter(o => o.value >= 0)).value; },
  zooPick(G, i, opts) {
    const p = G.P(i), Z = G.zoo, lead = G.standings()[0];
    const buy = opts.find(o => o.value === 'snareS' && !o.off && p.coins > 60) || opts.find(o => o.value === 'snareC' && !o.off && p.coins > 30 && R.chance(0.4)); if (buy) return buy.value;
    if (lead !== i && Z.size >= 20 && Z.size < BD.ZOOSTAR && p.coins > 20 && R.chance(0.5)) { const f = opts.find(o => o.value === 'f10' && !o.off) || opts.find(o => o.value === 'f6' && !o.off); if (f) return f.value; }
    if (Z.fed[i] < Math.max(...Z.fed) && p.coins > 15 && R.chance(0.25)) { const f = opts.find(o => o.value === 'f3' && !o.off); if (f) return f.value; }
    return null;
  },
  fountainPick(G, i, opts) { const p = G.P(i); if (p.coins < 8) return 0; if (G.fountain.pot > 25) return (opts.find(o => o.value === 10 && !o.off) || opts.find(o => o.value === 5 && !o.off) || { value: 0 }).value; return R.chance(0.5) ? 2 : 0; },
  balloonPick(G, i, sb) { const p = G.P(i), price = G.starPrice(); if (p.coins >= price + 8 && this.distTo(G, i, sb) > 6) return sb; if (G.holds[i].coins + G.holds[i].stars * 10 > 20 && R.chance(0.3)) return i * 10; return -1; },
  marketPick(G, i, opts) { const p = G.P(i); if (p.pump && G.pumpPrice >= 7) return -1; if (!p.pump && G.pumpPrice <= 4 && p.coins > 14) return (opts.find(o => o.value === 2 && !o.off) || { value: 0 }).value; return 0; },
  vanePick(G, i) { const p = G.P(i); if (p.coins + 3 >= G.starPrice() && p.coins < G.starPrice()) return 'sun'; return R.pick(['rain', 'wind', 'fog', 'sun']); },
});
// turnPick: also set snares now and then (and keep the old choices)
{ const old = BoardAI.turnPick.bind(BoardAI);
  BoardAI.turnPick = function (G, i) { const p = G.P(i), sp = BD.spaces[p.pos]; if (sp.type !== 'gate' && sp.type !== 'bank' && !G.traps[p.pos]) { if (p.items.includes('snareS')) return 'snareS'; if (p.items.includes('snareC') && R.chance(0.6)) return 'snareC'; } if (p.items.includes('midas') && G.players.some(q => q.i !== i && q.stars > 0)) return 'midas'; const v = old(G, i); return v; };
}
