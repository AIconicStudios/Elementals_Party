'use strict';
// The Fourfold - rules engine. All rule logic lives here; UI and AI are called for decisions.

// Lines the characters shout when they react on the board
const LINES = {
  evil: ['MWAHAHA!', 'Hehehe… gotcha!', 'All according to plan!', 'Too easy!', 'Muahahaha!', 'Fall into my trap!'],
  laugh: ['HAHAHA!', 'Pfft— hahaha!', 'Oh, that’s gold!', 'Hahaha, oof!', 'Can’t stop laughing!'],
  cry: ['Nooooo!', 'Waaah! My loot!', 'Why meee?!', '*sob sob*', 'Not fair!!'],
  shock: ['WHAT?!', 'Oh no!', 'Did that just happen?!', 'Whoa!', 'Yikes!', 'No way!'],
  angry: ['Grrr!', 'You’ll pay for that!', 'THIEF!', 'Hmph!', 'Unbelievable!'],
  smug: ['Don’t mind me…', 'Easy pickings.', 'Heh.', 'Too slow!'],
  starry: ['A STAR! ✨', 'So shiny!', 'Mine, all mine!', 'Yesss!'],
  sick: ['Blehh…', 'I don’t feel so good…', 'Ugh… poison…'],
  nervous: ['Uh-oh…', 'Gulp.', 'Stay calm…', 'Not good…'],
  sad: ['Aww…', 'Bad luck…', 'Ugh.', 'So close…'],
  proud: ['Nailed it!', 'Who’s the best? Me!', 'Flawless.', 'Too good!'],
};

class Game {
  constructor(cfg) {
    this.rounds = cfg.rounds || 20;
    this.players = cfg.seats.map((s, i) => this.makePlayer(i, s));
    this.board = BOARD.slice();
    this.round = 0;
    this.order = [0, 1, 2, 3];
    this.ankar = null;
    this.closedGates = {};  // board index -> rounds left
    this.closedBanks = {};
    this.mgPlayed = [];
    this.mgForce = cfg.minigame || null;
    this.turnCount = 0;
    this.current = null;
    this.phase = 'setup';
    this.dice = null;
    this.over = false;
    this.aborted = false;
    this.raidRound = 4;
  }

  makePlayer(i, seat) {
    const el = ELEMENTS[i];
    return {
      id: i, el, name: seat.name || el.name, human: !!seat.human, color: el.color,
      gate: i * 10,
      cash: 0, piles: [], vault: 0, fakeStars: 0, items: [],
      trav: this.newTrav(i * 10),
      def: { pos: DEF_START },
      traps: {}, grace: null, vaultProt: 0, hollow: false,
      ultBought: false, ultHeld: false, ultUsed: false,
      mgWins: 0, gone: false,
    };
  }
  newTrav(pos) {
    return {
      loc: 'board', pos, ring: null, hotC: [0, 0, 0, 0], hotS: [0, 0, 0, 0], sHand: 0,
      prison: 0, bail: 0, prisonBy: null, frozen: 0, poison: false,
      armor: null, armorLeft: 0, camo: false, ghost: 0, bag: null, chain: 0, repel: 0,
      thief: null, bounty: false, mods: {},
    };
  }

  // ------------------------------------------------------------ helpers
  P(id) { return this.players[id]; }
  bank(p) { return sum(p.piles.map(x => x.real)); }
  hotCoins(p) { return sum(p.trav.hotC); }
  hotStars(p) { return sum(p.trav.hotS); }
  carriedStars(p) { return p.trav.sHand + this.hotStars(p); }
  secondHalf() { return this.round > Math.floor(this.rounds / 2); }
  isRaiding(p) { return p.trav.loc === 'ring' && p.trav.ring !== p.id; }
  inRing(p, o) { return !p.gone && p.trav.loc === 'ring' && p.trav.ring === o.id; }
  raidersIn(o) { return this.players.filter(p => p.id !== o.id && this.inRing(p, o)); }
  hasItem(p, id) { return p.items.includes(id); }
  consume(p, id) { const i = p.items.indexOf(id); if (i >= 0) { p.items.splice(i, 1); return true; } return false; }
  lootTile(p, tile) { return p.piles.find(x => x.tile === tile) || null; }
  name(p) { return `<b style="color:${p.color}">${p.name}</b>`; }

  log(msg, cls) { UI.log(msg, cls); }
  // emotional reactions on the board (purely visual, never block the game)
  react(p, mood, line, delay = 0, warden = false) {
    if (!p) return;
    Render.react(p.id, mood, line === undefined ? R.pick(LINES[mood] || ['!']) : line, delay);
    if (warden && Render.reactions[p.id]) Render.reactions[p.id].warden = true;
  }
  // a spoken line: the speech bubble shows it and the character says it aloud (cute voice)
  say(p, mood, kind, delay = 0) {
    const L = Voice.LINES[kind]; if (!p || !L || !L[p.id]) return;
    this.react(p, mood, R.pick(L[p.id]), delay); if (Render.reactions[p.id]) Render.reactions[p.id].speak = true;
  }
  crowd(skip, moods, delay = 0.5) {
    this.players.filter(q => !skip.includes(q)).forEach((q, k) => this.react(q, Array.isArray(moods) ? R.pick(moods) : moods, undefined, delay + k * 0.25));
  }
  emote(p, e) { Render.emote(p, e); }
  fx(p, text, color) { Render.floatText(p, text, color); }

  bankAdd(p, n) {
    if (n <= 0 || !p.piles.length) return;
    for (let k = 0; k < n; k++) {
      let best = p.piles[0];
      for (const x of p.piles) if (x.real < best.real) best = x;
      best.real++;
    }
  }
  bankTake(p, n) {
    let taken = 0;
    for (let k = 0; k < n; k++) {
      let best = null;
      for (const x of p.piles) if (x.real > 0 && (!best || x.real > best.real)) best = x;
      if (!best) break;
      best.real--; taken++;
    }
    return taken;
  }
  afford(p, cost, bankOnly) { return (bankOnly ? 0 : p.cash) + this.bank(p) >= cost; }
  pay(p, cost, bankOnly) {
    if (!bankOnly) { const c = Math.min(p.cash, cost); p.cash -= c; cost -= c; }
    if (cost > 0) this.bankTake(p, cost);
  }
  // take coins a traveller is holding (cash first, then hot loot coins)
  takeHeld(p, n) {
    let got = Math.min(p.cash, n); p.cash -= got;
    for (let o = 0; o < 4 && got < n; o++) {
      const t = Math.min(p.trav.hotC[o], n - got); p.trav.hotC[o] -= t; got += t;
    }
    return got;
  }

  // Move hot loot off a traveller. to=null returns it to original owners.
  moveHot(p, { to = null, coins = true, coinFrac = 1, stars = true, protect = false, onlyFrom = null } = {}) {
    const t = p.trav;
    let movedC = 0, movedS = 0;
    for (let o = 0; o < 4; o++) {
      if (onlyFrom !== null && o !== onlyFrom) continue;
      const dest = to || this.P(o);
      if (coins && t.hotC[o] > 0) {
        const n = Math.ceil(t.hotC[o] * coinFrac);
        t.hotC[o] -= n; this.bankAdd(dest, n); movedC += n;
      }
    }
    if (stars) {
      let keep = null;
      const total = onlyFrom !== null ? t.hotS[onlyFrom] : this.hotStars(p);
      if (protect && total > 0 && this.consume(p, 'pouch')) {
        keep = onlyFrom !== null ? onlyFrom : t.hotS.findIndex(x => x > 0);
        this.log(`${this.name(p)}'s Star Pouch shelters a looted star.`);
      }
      for (let o = 0; o < 4; o++) {
        if (onlyFrom !== null && o !== onlyFrom) continue;
        let n = t.hotS[o] - (keep === o ? 1 : 0);
        if (n > 0) { t.hotS[o] -= n; (to || this.P(o)).vault += n; movedS += n; }
      }
    }
    return { c: movedC, s: movedS };
  }

  async deposit(p, where) {
    const t = p.trav;
    let n = p.cash + this.hotCoins(p);
    const stars = t.sHand + this.hotStars(p);
    let bonus = 0;
    if (n > 0 && this.consume(p, 'interest')) bonus = Math.max(2, Math.round(n * 0.25));
    if (t.bag && (t.bag.c || t.bag.s)) { n += t.bag.c; p.vault += t.bag.s; t.bag.c = 0; t.bag.s = 0; }
    if (n + bonus + stars <= 0) return;
    this.bankAdd(p, n + bonus);
    p.vault += stars;
    p.cash = 0; t.hotC = [0, 0, 0, 0]; t.hotS = [0, 0, 0, 0]; t.sHand = 0;
    this.log(`${this.name(p)} banks ${n + bonus} coins${bonus ? ` (incl. ${bonus} interest)` : ''}${stars ? ` and ${stars}⭐` : ''} at ${where}.`, 'good');
    if (stars) Sfx.star(); else Sfx.coin();
    this.fx(p, `+${n + bonus}🏦${stars ? ` +${stars}⭐` : ''}`, '#ffe680');
    if (stars) this.react(p, 'starry', 'Stars, safe at home!'); else if (n + bonus >= 15) this.react(p, 'proud', R.pick(['Safe and sound!', 'Ka-ching!'])); else this.emote(p, '🏦');
    UI.refresh();
    await sleep(300);
  }

  sendToGateExit(p, owner) {
    const t = p.trav;
    t.loc = 'board'; t.pos = owner.gate; t.ring = null;
    t.prison = 0; t.bail = 0; t.prisonBy = null;
  }
  killTrav(p, owner) {
    const t = p.trav;
    this.moveHot(p, { protect: true });
    if (p.cash > 0) { this.bankAdd(owner, p.cash); p.cash = 0; }
    t.loc = 'board'; t.pos = p.gate; t.ring = null; t.prison = 0; t.bail = 0; t.prisonBy = null;
    t.camo = false; t.ghost = 0;
  }

  gateOpen(idx, p) {
    if (!this.closedGates[idx]) return true;
    if (p && this.consume(p, 'masterkey')) { this.log(`${this.name(p)} uses a Master Key to pass the Eclipse.`); return true; }
    return false;
  }
  bankOpen(idx, p) {
    if (!this.closedBanks[idx]) return true;
    if (p && this.consume(p, 'masterkey')) { this.log(`${this.name(p)} uses a Master Key to pass the Eclipse.`); return true; }
    return false;
  }

  randomHandItem(commonOnly) {
    const pool = HAND_ITEMS.filter(it => commonOnly ? it.r === 'C' : (this.secondHalf() || it.r === 'C' || it.r === 'U'));
    return R.weighted(pool, it => RARITY_WEIGHT[it.r]).id;
  }

  async giveItem(p, id, fx = true) {
    if (p.items.length < HAND_LIMIT) {
      if (fx) await Stage.gain(p, ITEM[id].icon);
      p.items.push(id);
      this.log(`${this.name(p)} gets ${ITEM[id].icon} ${itemLabel(id)}.`);
      UI.refresh();
      return true;
    }
    const opts = p.items.map((x, i) => ({ label: `Discard ${ITEM[x].icon} ${itemLabel(x)}`, value: i }));
    opts.push({ label: `Decline ${ITEM[id].icon} ${itemLabel(id)}`, value: -1 });
    const v = await this.choose(p, { title: 'Hand full', text: `You can hold ${HAND_LIMIT} items. Discard one for ${itemLabel(id)}?`, options: opts },
      () => AI.discard(this, p, id));
    if (v >= 0) { p.items.splice(v, 1); p.items.push(id); this.log(`${this.name(p)} swaps an item for ${ITEM[id].icon} ${itemLabel(id)}.`); }
    UI.refresh();
    return v >= 0;
  }

  // a roulette of items: what you get is shown before it lands in your bag
  async itemWheel(p, title = '🎁') {
    const ids = []; for (let k = 0; k < 40 && ids.length < 8; k++) { const id = this.randomHandItem(); if (!ids.includes(id)) ids.push(id); }
    while (ids.length < 6) ids.push(this.randomHandItem());
    const pal = ['#c58bff', '#5fb8ff', '#ff9a3d', '#6fdc8c', '#ff6a8a', '#ffd34d', '#5fe3d0', '#9d8bff'];
    const k = await Stage.wheel(p, ids.map((id, i) => ({ icon: ITEM[id].icon, color: pal[i % pal.length] })), title);
    return ids[k];
  }
  async coinWheel(p, title = '🎡') {
    const vals = [1, 3, 5, 10, 1, 3, 5, 10], cols = { 1: '#6fa8dc', 3: '#6fdc8c', 5: '#ff9a3d', 10: '#ff4d8d' };
    const k = await Stage.wheel(p, vals.map(v => ({ icon: v === 10 ? '💰' : '🪙', text: '+' + v, color: cols[v] })), title);
    return vals[k];
  }

  async choose(p, spec, botFn) {
    if (this.aborted) throw new Error('aborted');
    if (p.human) return UI.ask(p, spec);
    await sleep(850);
    if (botFn) { const v = botFn(); if (v !== undefined) return v; }
    const o = spec.options.find(x => !x.disabled);
    return o ? o.value : null;
  }
  async pickTile(p, owner, tiles, title, botFn) {
    if (p.human) return UI.pickTile(p, owner, tiles, title);
    await sleep(450);
    const v = botFn ? botFn() : undefined;
    return v !== undefined && tiles.includes(v) ? v : R.pick(tiles);
  }

  // ------------------------------------------------------------ main loop
  // ---- time of day: the sky moves through four phases over a game, each with one small rule
  tod() { if (!this.round) return 'morning'; const p = this.round / this.rounds; return p <= 0.25 ? 'morning' : p < 0.45 ? 'day' : p < 0.8 ? 'golden' : 'dusk'; }
  todInfo(ph = this.tod()) { return TOD[ph]; }
  todBlue() { return { morning: 1, dusk: 1 }[this.tod()] || 0; }
  todRed() { return { golden: -1, dusk: 1 }[this.tod()] || 0; }
  todNote(n, base) { return n !== base ? ` (${this.todInfo().icon} ${this.todInfo().name})` : ''; }
  async run() {
    try {
      UI.refresh();
      await Stage.intro(this);
      await this.setup();
      for (let r = 1; r <= this.rounds; r++) {
        this.round = r;
        if (r === 1) await this.firstOrder();
        await UI.banner(r === this.rounds ? `Final Round ${r}` : `Round ${r} / ${this.rounds}`,
          r === this.rounds ? '🔔 The final bell rings. This is everyone’s last turn!' : (r < this.raidRound ? `The Waygates are sealed — no raiding until round ${this.raidRound}.` : (r === this.raidRound && this.simple ? 'Raiding is open! Pass a rival’s Gate to sneak in.' : (!this.simple && r === Math.floor(this.rounds / 2) + 1 ? 'Second half: Rare and Legendary wares appear!' : ''))));
        const ph = this.tod(); if (ph !== this.lastTod) { this.lastTod = ph; const T = TOD[ph]; this.log(`${T.icon} <b>${T.name}</b> — ${T.rule}`); UI.refresh(); await UI.banner(`${T.icon} ${T.name}`, T.rule); }
        for (const pid of this.order.slice()) {
          await this.takeTurn(this.P(pid));
        }
        await this.endOfRound();
        if (r < this.rounds) await this.minigamePhase();
      }
      await this.endGame();
    } catch (e) {
      if (this.aborted || (e && e.message === 'aborted')) return;
      console.error(e);
      UI.log('Error: ' + e.message, 'bad');
      throw e;
    }
  }

  async setup() {
    this.phase = 'setup';
    this.log('<b>The Fourfold begins.</b> Each Hold banks 10 coins and draws a Common item.');
    for (const p of this.players) {
      const tiles = [];
      const valid = () => { const v = []; for (let k = 1; k <= 15; k++) if (k !== RING_VAULT && !tiles.includes(k)) v.push(k); return v; };
      if (p.human) {
        const mode = await UI.ask(p, { title: `${p.name}: place your Hoards`, text: 'Choose which 4 tiles of your Hold hold your Loot (banked coins).', options: [
          { label: 'Pick the 4 tiles myself', value: 'pick' }, { label: 'Random', value: 'rand' }] });
        if (mode === 'pick') {
          for (let k = 0; k < 4; k++) tiles.push(await UI.pickTile(p, p, valid(), `Pick Hoard tile ${k + 1} of 4`));
        }
      }
      while (tiles.length < 4) tiles.push(p.human ? R.pick(valid()) : AI.hoardTile(valid(), tiles));
      p.piles = tiles.sort((a, b) => a - b).map(tile => ({ tile, real: 0, fake: 0, prot: 0, protUses: 0, mimic: false }));
      this.bankAdd(p, 10);
      p.items.push(this.randomHandItem(true));
      UI.refresh();
    }
  }

  async firstOrder() {
    const rolls = [];
    for (const p of this.players) {
      this.current = p; UI.turnStart(p);
      if (p.human && !Settings.test) UI.note(`${p.name}: roll for turn order!`);
      const v = await this.throwDie(p, [1, 2, 3, 4, 5, 6]);
      rolls.push({ id: p.id, v: v + Math.random() * 0.01 });
      this.log(`${this.name(p)} rolls ${v} for turn order.`);
      await sleep(600);
    }
    Render.die = null; this.current = null;
    rolls.sort((a, b) => b.v - a.v);
    const first = rolls[0].id;
    this.order = [0, 1, 2, 3].map(k => (first + k) % 4);
    this.log(`${this.name(this.P(first))} rolled highest and plays first, then clockwise.`);
    this.dice = null;
  }

  // ------------------------------------------------------------ turn
  async takeTurn(p) {
    if (this.aborted) throw new Error('aborted');
    this.current = p; this.turnCount++; this.phase = 'turn';
    const t = p.trav;
    UI.refresh();
    UI.turnStart(p);
    this.log(`<hr>— ${this.name(p)}'s turn —`);
    await Stage.turn(p);
    this.say(p, 'happy', 'turn');
    if (t.thief && this.round > t.thief.round) { t.thief = null; }

    // poison tick
    if (t.poison) {
      if (this.hasItem(p, 'antidote') && !p.human) { this.consume(p, 'antidote'); t.poison = false; this.log(`${this.name(p)} drinks an Antidote.`); }
      else {
        if (p.cash > 0) p.cash--; else if (this.bank(p) > 0) this.bankTake(p, 1); else if (t.sHand > 0) t.sHand--; else if (p.vault > 0) p.vault--;
        this.log(`${this.name(p)} suffers from Poison (−1).`, 'bad'); this.fx(p, '☠️ −1', '#9f6'); this.emote(p, '🤢');
      }
    }

    // prison
    if (t.prison > 0) {
      const opts = [{ label: `Wait in the Oubliette (${t.prison} turn${t.prison > 1 ? 's' : ''} left)`, value: 'wait' }];
      if (t.bail > 0) opts.push({ label: `Pay bail: ${t.bail} coins`, value: 'bail', disabled: !this.afford(p, t.bail) });
      if (this.hasItem(p, 'jailbreak')) opts.push({ label: '🗝️ Use Jail Break', value: 'break' });
      const v = await this.choose(p, { title: 'Imprisoned!', text: 'Your Wayfarer is locked in a rival Hold.', options: opts }, () => AI.prison(this, p));
      const owner = this.P(t.prisonBy);
      if (v === 'bail') { this.pay(p, t.bail); this.bankAdd(owner, t.bail); this.log(`${this.name(p)} pays ${t.bail} bail to ${this.name(owner)}.`); this.react(p, 'sad', 'Fine… take it.'); this.react(owner, 'proud', 'Pleasure doing business!', 0.3); this.sendToGateExit(p, owner); }
      else if (v === 'break') { this.consume(p, 'jailbreak'); this.log(`${this.name(p)} picks the lock and escapes!`); this.react(p, 'smug', 'See ya, sucker!'); this.react(owner, 'angry', 'They escaped?!', 0.3); this.sendToGateExit(p, owner); }
      UI.refresh();
    }

    let act;
    for (let back = 0; back < 20; back++) {
    for (let guard = 0; ; guard++) {
      act = await this.chooseAction(p);
      if (act && act.type === 'item') {
        const used = await this.playItem(p, act.id);
        if (!used && !p.human) this.consume(p, act.id); // bot couldn't target: discard to avoid loops
        UI.refresh();
        if (guard < 12) continue;
        act = { type: this.travCanMove(p) ? 'trav' : 'pass' };
      }
      break;
    }
    if (!act) act = { type: 'pass' };
    let res;
    if (act.type === 'trav') res = await this.doTravellerMove(p);
    else if (act.type === 'def') res = await this.doDefenderMove(p);
    else if (act.type === 'fortify') await this.doFortify(p);
    else this.log(`${this.name(p)} rests.`);
    if (res !== 'back') break;
    }

    // end-of-turn ticks
    if (t.prison > 0 && act.type !== 'trav') {
      t.prison--;
      if (t.prison === 0 && t.prisonBy !== null) { const o = this.P(t.prisonBy); this.log(`${this.name(p)} is released at the ${o.el.name} Waygate.`); this.sendToGateExit(p, o); }
    }
    if (t.frozen > 0) t.frozen--;
    if (p.vaultProt > 0) p.vaultProt--;
    if (t.chain > 0) t.chain--;
    if (t.repel > 0) t.repel--;
    this.fillBag(p);
    await sleep(700);
    this.dice = null; Render.die = null;
    UI.refresh();
    await sleep(300);
  }

  fillBag(p) {
    const b = p.trav.bag; if (!b) return;
    const room = 5 - b.c; const c = Math.min(room, p.cash); b.c += c; p.cash -= c;
    if (b.s < 1) {
      if (p.trav.sHand > 0) { p.trav.sHand--; b.s++; }
      else { const o = p.trav.hotS.findIndex(x => x > 0); if (o >= 0) { p.trav.hotS[o]--; b.s++; } }
    }
  }

  travCanMove(p) { const t = p.trav; return !p.gone && t.prison === 0 && t.frozen === 0; }

  fortifyOptions(p) {
    const list = [];
    const bank = this.bank(p);
    for (const d of DEFENSES) {
      if ((d.r === 'R' || d.r === 'L') && !this.secondHalf()) continue;
      let ok = bank >= d.price;
      if (d.place === 'tile' && !this.freeTrapTiles(p).length) ok = false;
      if (d.id === 'grace' && p.grace) ok = false;
      list.push({ id: d.id, ok });
    }
    if (p.ultHeld && !p.ultUsed) {
      const u = ITEM[p.el.ult];
      let ok = true;
      if (u.id !== 'hollow' && !this.raidersIn(p).length) ok = false;
      if (u.id === 'inferno' && p.vault < 1) ok = false;
      list.push({ id: u.id, ok, ult: true });
    }
    return list;
  }
  freeTrapTiles(p) {
    const v = [];
    for (let k = 1; k <= 15; k++) if (k !== RING_VAULT && !this.lootTile(p, k) && !p.traps[k]) v.push(k);
    return v;
  }

  itemPlayable(p, id) {
    const t = p.trav, it = ITEM[id];
    if (it.use !== 'play') return false;
    switch (id) {
      case 'antidote': return t.poison;
      case 'unicorn': return this.raidersIn(p).length > 0;
      case 'smoke': return this.isRaiding(p) && t.prison === 0;
      case 'jailbreak': return t.prison > 0;
      case 'recall': return !p.gone && !(t.loc === 'ring' && t.ring === p.id) && t.prison === 0;
      case 'warp': case 'shophop': return !p.gone && t.loc === 'board';
      case 'mirror': return !p.gone && t.loc === 'board' && this.players.some(q => q !== p && !q.gone && q.trav.loc === 'board');
      case 'callankar': return !p.gone && t.loc === 'board';
      case 'leash': return this.ankar !== null;
      case 'armor': case 'heavy': return !t.armor;
      case 'camo': return !t.camo;
      case 'bag': return !t.bag;
      case 'ghost': return t.ghost === 0;
      case 'deposit': return p.cash + this.hotCoins(p) + this.carriedStars(p) > 0;
      case 'swap': return this.players.some(q => q !== p);
      case 'bounty': return this.players.some(q => q !== p && !q.gone && (this.hotCoins(q) + this.hotStars(q) > 0 || this.isRaiding(q)));
      case 'custom': return !t.mods.custom;
      case 'double': return !t.mods.double;
      case 'advantage': return !t.mods.adv && !t.mods.custom;
      default: return true;
    }
  }

  async chooseAction(p) {
    const t = p.trav;
    const canT = this.travCanMove(p);
    const fort = this.fortifyOptions(p);
    const canF = fort.some(f => f.ok);
    let travLabel = t.loc === 'ring' ? (t.ring === p.id ? 'Move Wayfarer (inside your Hold)' : `Move Wayfarer (raiding ${this.P(t.ring).el.hold})`) : 'Move Wayfarer on the Crossing (+3 wage)';
    if (p.gone) travLabel = 'Wayfarer lost forever';
    else if (t.prison) travLabel = 'Wayfarer imprisoned';
    else if (t.frozen) travLabel = `Wayfarer frozen (${t.frozen})`;
    const options = [
      { label: '🚶 ' + travLabel, value: { type: 'trav' }, disabled: !canT, key: 'trav' },
      { label: '🛡️ Move Warden around your Hold', value: { type: 'def' }, disabled: !p.def, key: 'def' },
      { label: '🏰 Fortify (place a defense, paid from bank)', value: { type: 'fortify' }, disabled: !canF, key: 'fortify' },
    ];
    for (const id of [...new Set(p.items)]) {
      if (this.itemPlayable(p, id)) options.push({ label: `${ITEM[id].icon} Use ${itemLabel(id)}`, value: { type: 'item', id }, desc: ITEM[id].desc, item: true });
    }
    if (!canT && !p.def && !canF) options.push({ label: 'Pass', value: { type: 'pass' } });
    if (options.every(o => o.disabled)) options.push({ label: 'Pass', value: { type: 'pass' } });
    return this.choose(p, { title: `${p.name}'s turn`, text: 'Items are free actions. Then pick one of three moves.', options, turnMenu: true },
      () => AI.chooseAction(this, p, options));
  }

  // ------------------------------------------------------------ dice
  async throwDie(p, faces, canBack) {
    Render.startRoll(p.id, faces);
    UI.refresh();
    if (p.human && !Settings.test) { if (await UI.waitDieStop(p, canBack) === 'back') { Render.die = null; UI.refresh(); return null; } }
    else await sleep(R.range(450, 850));
    const v = R.pick(faces);
    await Render.stopRoll(v);
    return v;
  }

  async roll(p, canBack) {
    const m = p.trav.mods; p.trav.mods = {};
    let v;
    if (m.custom) {
      v = await this.choose(p, { title: 'Custom Dice', text: 'Choose your roll.', options: [1, 2, 3, 4, 5, 6].map(n => ({ label: String(n), value: n })) }, () => AI.customRoll(this, p));
      Render.die = { who: p.id, faces: [v], state: 'landed', face: v, rot: 0, hop: 1, spin: 0, note: '', total: null, t: 0, land: 0.0001 };
    } else {
      const faces = m.cursed ? [1, 2, 3] : [1, 2, 3, 4, 5, 6];
      v = await this.throwDie(p, faces, canBack);
      if (v === null) { p.trav.mods = m; return null; } // went back to the turn menu
      if (m.adv) {
        await sleep(500);
        const v2 = await this.throwDie(p, faces);
        this.log(`Advantage: rolled ${v} and ${v2}.`);
        v = Math.max(v, v2); Render.die.face = v;
      }
    }
    let note = [];
    if (m.snail) { v = Math.max(1, Math.floor(v / 2)); note.push('snail ½'); }
    if (m.double) { v *= 2; note.push('×2'); }
    if (m.unicorn) { v *= 2; note.push('🦄×2'); }
    if (p.trav.poison) { v = Math.max(1, v - 1); note.push('poison −1'); }
    if (m.cursed) note.push('cursed');
    const dir = m.reverse ? -1 : 1;
    if (m.reverse) note.push('reversed');
    this.dice = { v, who: p.id, note: note.join(', ') };
    if (Render.die) { Render.die.total = v; Render.die.note = note.join(', '); }
    this.log(`${this.name(p)} rolls <b>${v}</b>${note.length ? ` (${note.join(', ')})` : ''}.`);
    UI.refresh(); Sfx.thud();
    await sleep(800);
    return { v, dir };
  }

  // ------------------------------------------------------------ traveller movement
  async doTravellerMove(p) {
    const rr = await this.roll(p, true); if (!rr) return 'back';
    const { v, dir } = rr;
    const t = p.trav;
    if (t.loc === 'board') {
      p.cash += 3; this.fx(p, '+3 wage', '#ffe680'); Render.coinBurst(p, 3);
      await this.moveBoard(p, v, dir);
    } else {
      await this.moveRing(p, v, dir);
    }
    if (t.ghost > 0) t.ghost--;
  }

  async moveBoard(p, steps, dir) {
    const t = p.trav;
    for (let s = 1; s <= steps; s++) {
      t.pos = (t.pos + dir + 40) % 40;
      Sfx.step(); UI.refresh();
      await sleep(430);
      const last = s === steps;
      const sp = this.board[t.pos];
      Render.stepPuff(t.pos);
      // thief items steal by passing
      if (t.thief) this.thiefPass(p);
      // passing (or landing on) a rival's Waygate: may raid, discarding the rest of the roll
      if (sp === 'gate' && t.pos !== p.gate) {
        const owner = this.players.find(o => o.gate === t.pos);
        if (this.round < 4) { if (last) this.log('The Waygates are sealed until round 4.'); }
        else if (this.closedGates[t.pos] && !this.hasItem(p, 'masterkey')) { if (last) this.log('That Waygate is closed by the Eclipse.'); }
        else {
          const rest = steps - s;
          const v = await this.choose(p, { title: `${owner.el.hold} Waygate`, text: `Raid ${owner.name}'s Hold? (Bank ${this.bank(owner)}, Vault ${owner.vault}⭐)${rest ? ` Raiding discards your remaining ${rest} step${rest > 1 ? 's' : ''}.` : ''}`, options: [
            { label: `⚔️ Reave ${owner.el.hold}${rest ? ` (lose ${rest} step${rest > 1 ? 's' : ''})` : ''}`, value: true }, { label: rest ? `Keep walking (${rest} more)` : 'Pass by', value: false }] }, () => AI.wantRaid(this, p, owner));
          if (v) {
            this.gateOpen(t.pos, p);
            t.loc = 'ring'; t.ring = owner.id; t.pos = RING_GATE;
            this.log(`${this.name(p)} slips through the Waygate into ${this.name(owner)}'s ${owner.el.hold}!${rest ? ` (${rest} step${rest > 1 ? 's' : ''} discarded)` : ''}`, 'warn');
            this.react(p, 'smug', R.pick(['Sneak sneak…', 'Don’t mind me…', 'Knock knock!'])); this.react(owner, 'shock', R.pick(['INTRUDER!', 'Get out of my Hold!', 'A raider?!']), 0.3);
            Render.burstAt(Render.ringPos(owner.id, RING_GATE), owner.color, 26); Sfx.bad();
            UI.refresh();
            return;
          }
        }
      }
      if (sp === 'gate' && t.pos === p.gate && !last) {
        if (this.gateOpen(t.pos, p) && (p.cash + this.hotCoins(p) + this.carriedStars(p) > 0)) {
          const yes = await this.choose(p, { title: 'Your Waygate', text: 'Deposit everything you carry at home?', options: [{ label: 'Deposit', value: true }, { label: 'Keep walking', value: false }] }, () => AI.wantDeposit(this, p));
          if (yes) await this.deposit(p, 'home');
        }
      }
      if (sp === 'bank') {
        if (this.bankOpen(t.pos, p)) await this.shopVisit(p, last);
        else if (last) this.log('This Counting House is closed by the Eclipse.');
      }
      if (this.over) return;
    }
    await this.resolveBoardLanding(p);
  }

  thiefPass(p) {
    const t = p.trav;
    for (const q of this.players) {
      if (q === p || q.gone || q.trav.loc !== 'board' || q.trav.pos !== t.pos) continue;
      if (t.thief.type === 'thief' && q.cash > 0) { q.cash--; p.cash++; this.log(`${this.name(p)} cuts 1 coin from ${this.name(q)}.`); this.emote(p, '😏'); this.emote(q, '😠'); }
      if (t.thief.type === 'itemthief' && q.items.length) { const it = q.items.splice(R.int(0, q.items.length - 1), 1)[0]; if (p.items.length < HAND_LIMIT) p.items.push(it); this.log(`${this.name(p)}'s Magpie snatches ${itemLabel(it)} from ${this.name(q)}.`); this.react(p, 'evil', 'Yoink!'); this.react(q, 'angry', 'My item!', 0.3); }
      if (t.thief.type === 'starthief') {
        if (q.trav.sHand > 0) { q.trav.sHand--; p.trav.sHand++; this.log(`${this.name(p)} fishes a star from ${this.name(q)}!`); this.react(p, 'evil'); this.react(q, 'cry', 'My star!!', 0.3); }
        else { const o = q.trav.hotS.findIndex(x => x > 0); if (o >= 0) { q.trav.hotS[o]--; p.trav.hotS[o]++; this.log(`${this.name(p)} fishes a looted star from ${this.name(q)}!`); } }
      }
    }
  }

  async resolveBoardLanding(p) {
    const t = p.trav;
    const sp = this.board[t.pos];
    Render.landFx(t.pos);
    // other travellers on the same space: steal 1 coin; bounty
    for (const q of this.players) {
      if (q === p || q.gone || q.trav.loc !== 'board' || q.trav.pos !== t.pos) continue;
      if (q.trav.bounty && (this.hotCoins(q) + this.hotStars(q) > 0)) {
        const r = this.moveHot(q); q.trav.bounty = false;
        this.log(`${this.name(p)} claims the bounty on ${this.name(q)}: ${r.c} coins and ${r.s}⭐ return to their owners.`, 'good'); this.react(p, 'proud', 'Justice!'); this.react(q, 'cry', undefined, 0.3);
      }
      const got = q.cash > 0;
      await Stage.punch(p, q, got);
      if (got) { q.cash--; p.cash++; this.log(`${this.name(p)} lands on ${this.name(q)} and steals 1 coin.`); }
      this.react(p, 'evil', R.pick(['POW! Mine now!', 'Thanks for the coin!', 'Out of my way!'])); this.react(q, R.pick(['angry', 'cry']), R.pick(['OW!', 'Hey! That hurt!', 'My coin!']), 0.3);
      UI.refresh();
    }
    if (sp === 'gate') {
      const owner = this.players.find(o => o.gate === t.pos);
      if (owner === p) {
        if (this.gateOpen(t.pos, p)) {
          const v = await this.choose(p, { title: 'Your Waygate', text: 'You are home.', options: [
            { label: 'Deposit what I carry', value: 'dep' },
            { label: 'Enter my Hold as a second Warden (banks everything; leaving costs a lap)', value: 'enter' },
            { label: 'Stay on the Crossing', value: 'stay' }] }, () => AI.ownGate(this, p));
          if (v === 'dep' || v === 'enter') await this.deposit(p, 'home');
          if (v === 'enter') { t.loc = 'ring'; t.ring = p.id; t.pos = RING_GATE; this.log(`${this.name(p)} enters their own Hold to guard it.`); }
        }
      }
    } else if (sp !== 'bank') {
      await this.resolveSpace(p, sp);
    }
    if (t.loc === 'board') this.ankarContact(p);
    UI.refresh();
  }

  async resolveSpace(p, sp) {
    const t = p.trav;
    switch (sp) {
      case 'blue': { const n = 5 + this.todBlue(); await Stage.space(p, t.pos, 'blue', n); p.cash += n; this.fx(p, '+' + n, '#7fb0ff'); Sfx.coin(); this.emote(p, '😊'); this.log(`${this.name(p)} lands on a Boon: +${n} coins${this.todNote(n, 5)}.`); break; }
      case 'red':
        if (t.chain > 0) { this.log(`${this.name(p)}'s Chain Wallet shrugs off the Bane.`); break; }
        { const b = 3 + this.todRed(), l = Math.min(b, p.cash); await Stage.space(p, t.pos, 'red', l); p.cash -= l; this.fx(p, `−${l}`, '#ff6b6b'); Sfx.bad(); this.emote(p, '😖'); this.log(`${this.name(p)} lands on a Bane: −${l} coins${this.todNote(b, 3)}.`); }
        break;
      case 'summon': {
        this.ankar = t.pos;
        Render.ankarSpawn(t.pos);
        await Stage.space(p, t.pos, 'summon');
        if (this.board[t.pos] === 'summon') {
          const nt = 'blue';
          this.board[t.pos] = nt;
          this.log(`${this.name(p)} sets the <b>Ankar</b> loose on the Crossing! The Altar crumbles into a ${SPACE[nt].lore} space.`, 'warn'); this.react(p, 'evil', 'Rise, Tithe-Taker!'); this.crowd([p], ['nervous', 'shock']);
        } else this.log(`${this.name(p)} sets the <b>Ankar</b> loose on the Crossing!`, 'warn');
        Sfx.boom();
        await sleep(700);
        break;
      }
      case 'shutdown': {
        const gates = R.shuffle([0, 10, 20, 30]).slice(0, 2), banks = R.shuffle([5, 15, 25, 35]).slice(0, 2);
        gates.forEach(g => { this.closedGates[g] = 2; }); banks.forEach(b => { this.closedBanks[b] = 2; });
        await Stage.eclipse([...gates, ...banks]);
        this.log(`🌑 An Eclipse! Waygates ${gates.map(g => ELEMENTS[g / 10].name).join(' & ')} and two Counting Houses close for 2 rounds.`, 'warn'); this.react(p, 'shock', 'The sky went dark!'); this.crowd([p], 'nervous');
        Sfx.boom();
        break;
      }
      case 'doubler': {
        const add = Math.min(p.cash, 10);
        await Stage.space(p, t.pos, 'doubler', add); p.cash += add;
        let s = 0; if (this.carriedStars(p) > 0) { t.sHand += 1; s = 1; }
        this.fx(p, `×2 +${add}${s ? ' +1⭐' : ''}`, '#ffd34d'); Sfx.coin();
        this.log(`${this.name(p)} drinks from the Gilded Spring: +${add} coins${s ? ' and +1 carried star' : ''}.`); if (add >= 8 || s) this.react(p, 'starry', 'Double the gold!'); else this.emote(p, '🤑');
        break;
      }
      case 'lucky': {
        const v = await this.coinWheel(p, '🎡 Fortune Wheel');
        p.cash += v; this.fx(p, `+${v}`, '#5fe3b0'); Sfx.coin(); Render.coinBurst(p, Math.min(8, v));
        this.log(`${this.name(p)} spins the Fortune Wheel: +${v} coins.`); if (v === 10) this.react(p, 'starry', 'JACKPOT!'); else this.emote(p, v >= 5 ? '😄' : '🙂');
        break;
      }
      case 'item': await this.giveItem(p, await this.itemWheel(p, '🎁 Pedlar')); break;
      case 'chameleon': {
        const pal = ['#c58bff', '#5fb8ff', '#ff9a3d', '#6fdc8c', '#ff6a8a'];
        const ty = SPECIAL_TYPES[await Stage.wheel(p, SPECIAL_TYPES.map((x, i) => ({ icon: SPACE[x].icon, color: pal[i % 5] })), '❓ Mirage')];
        this.log(`The Mirage shimmers and becomes a ${SPACE[ty].lore}!`);
        await this.resolveSpace(p, ty);
        break;
      }
    }
    UI.refresh();
  }

  ankarContact(p) {
    if (this.ankar === null || p.gone || p.trav.loc !== 'board' || p.trav.pos !== this.ankar) return;
    const t = p.trav;
    if (t.repel > 0) { this.log(`The Ankar looks away from ${this.name(p)} (Repellent).`); return; }
    if (this.consume(p, 'decoy')) { this.log(`The Ankar snatches ${this.name(p)}'s Decoy Star and leaves their coins alone!`); return; }
    let n = Math.min(5, p.cash); p.cash -= n;
    if (n < 5) n += this.bankTake(p, 5 - n);
    if (!n) { this.log(`👁️ The Ankar finds nothing to take from ${this.name(p)}.`); return; }
    this.log(`👁️ The Ankar takes ${n} coins from ${this.name(p)}.`, 'bad'); this.fx(p, `👁️ −${n}`, '#c58bff'); this.react(p, R.pick(['cry', 'angry']), R.pick(['Not my coins!', 'Shoo! Go away!', 'Waaah, the Ankar!'])); this.crowd([p], ['laugh', 'nervous', 'shock']);
    Render.burstAt(Render.trackPos(t.pos), '#b46bff', 22);
    Sfx.boom(); setTimeout(() => Sfx.crowd('aww'), 300);
  }

  async moveRing(p, steps, dir) {
    const t = p.trav;
    const owner = this.P(t.ring);
    for (let s = 1; s <= steps; s++) {
      t.pos += dir;
      if (t.pos > RING_SIZE) t.pos -= RING_SIZE;
      if (t.pos < 1) t.pos += RING_SIZE;
      Sfx.step(); UI.refresh();
      await sleep(170);
      if (t.pos === RING_GATE) {
        if (this.gateOpen(owner.gate, p)) {
          this.log(`${this.name(p)} leaves ${owner.el.hold} through the Waygate.`);
          this.sendToGateExit(p, owner);
          if (owner === p) await this.deposit(p, 'home');
          UI.refresh();
          return;
        } else if (s === steps) this.log('The Waygate is closed by the Eclipse — no way out!');
      }
    }
    await this.resolveRingLanding(p, owner);
  }

  wardensAt(owner, pos) {
    // returns the catchers at this tile of owner's ring: the Warden and owner's own Wayfarer if home
    const c = [];
    if (owner.def && owner.def.pos === pos) c.push('def');
    if (!owner.gone && owner.trav.loc === 'ring' && owner.trav.ring === owner.id && owner.trav.pos === pos) c.push('trav');
    return c;
  }

  async resolveRingLanding(p, owner) {
    const t = p.trav;
    const pos = t.pos;
    if (owner === p) {
      // own Wayfarer acts as a second Warden
      for (const r of this.raidersIn(p)) if (r.trav.pos === pos) await this.catchRaider(r, p, 'catch');
      return;
    }
    if (this.wardensAt(owner, pos).length) {
      await this.catchRaider(p, owner, 'catch');
      if (!this.inRing(p, owner) || t.pos !== pos) return;
    }
    // traps
    if (owner.grace === pos) { await this.triggerTrap(p, owner, 'grace', pos); if (!this.inRing(p, owner) || t.prison) return; }
    if (owner.traps[pos]) { await this.triggerTrap(p, owner, owner.traps[pos].id, pos); if (!this.inRing(p, owner) || t.pos !== pos || t.prison) return; }
    const pile = this.lootTile(owner, pos);
    if (pile) await this.lootPile(p, owner, pile);
    else if (pos === RING_VAULT) await this.lootVault(p, owner);
    UI.refresh();
  }

  async lootPile(p, owner, pile) {
    const t = p.trav;
    if (owner.hollow) {
      const n = this.takeHeld(p, 5); this.bankAdd(owner, n);
      this.log(`⛰️ Famished Earth! ${this.name(p)} loses ${n} coins to ${this.name(owner)}.`, 'bad'); this.fx(p, `−${n}`, '#7ccf4a'); this.react(owner, 'evil', 'The earth hungers!'); this.react(p, 'angry', 'The ground ate my coins!', 0.3);
      return;
    }
    if (pile.mimic) {
      pile.mimic = false;
      const n = this.takeHeld(p, 5); this.bankAdd(owner, n);
      this.log(`🧰 A Mimic Chest bites ${this.name(p)}! −${n} coins.`, 'bad'); this.fx(p, `🧰 −${n}`, '#ff6b6b'); Sfx.bad(); this.react(p, 'shock', 'IT BIT ME!'); this.react(owner, 'laugh', undefined, 0.3);
      return;
    }
    let draws = 5;
    if (pile.protUses > 0) { draws = Math.max(0, 5 - pile.prot); pile.protUses--; if (!pile.protUses) pile.prot = 0; }
    let got = 0, fakes = 0;
    for (let k = 0; k < draws; k++) {
      const tot = pile.real + pile.fake; if (!tot) break;
      if (Math.random() < pile.real / tot) { pile.real--; got++; } else { pile.fake--; fakes++; }
    }
    t.hotC[owner.id] += got;
    this.log(`${this.name(p)} loots a Hoard of ${this.name(owner)}: +${got} hot coins${fakes ? ` (${fakes} fake!)` : ''}${draws < 5 ? ' (Hoardward)' : ''}.`, got ? 'warn' : '');
    if (got >= 4) { this.react(p, 'smug'); this.react(owner, 'angry', undefined, 0.3); } else if (fakes && !got) { this.react(p, 'angry', 'Fake coins?!'); this.react(owner, 'laugh', 'Gilded lead! Hah!', 0.3); } else if (got) this.emote(p, '💰');
    this.fx(p, `+${got}🔥`, '#ffb347'); if (got) Sfx.coin();
  }

  async lootVault(p, owner) {
    const t = p.trav;
    if (owner.hollow) {
      let lost = false;
      const o = t.hotS.findIndex(x => x > 0);
      if (o >= 0) { t.hotS[o]--; lost = true; } else if (t.sHand > 0) { t.sHand--; lost = true; } else if (p.vault > 0) { p.vault--; lost = true; }
      if (lost) owner.vault++;
      const n = this.takeHeld(p, 5); this.bankAdd(owner, n);
      this.log(`⛰️ Famished Earth swallows ${lost ? 'a star and ' : ''}${n} coins from ${this.name(p)}.`, 'bad');
      return;
    }
    if (owner.vaultProt > 0) {
      if (this.consume(p, 'skeleton')) this.log(`${this.name(p)} opens the Warding Seal with a Skeleton Key!`);
      else { this.log(`The Warding Seal protects ${this.name(owner)}'s Starvault.`); return; }
    }
    const tot = owner.vault + owner.fakeStars;
    if (!tot) { this.log(`${this.name(owner)}'s Starvault is empty.`); return; }
    if (Math.random() < owner.vault / tot) {
      owner.vault--; t.hotS[owner.id]++;
      this.log(`⭐ ${this.name(p)} steals a star from ${this.name(owner)}'s Starvault!`, 'warn'); this.fx(p, '+1⭐🔥', '#ffe680'); Sfx.star(); this.react(p, 'evil', R.pick(['A STAR! Mwahaha!', 'Your star is MINE!'])); this.react(owner, 'cry', R.pick(['My star!!', 'NOOO, my Starvault!']), 0.3); this.crowd([p, owner], ['shock', 'laugh'], 0.7);
    } else {
      owner.fakeStars--; this.log(`${this.name(p)} grabs a Paste Star — a fake!`); this.fx(p, 'fake ✴️', '#aaa'); this.react(p, 'angry', 'A FAKE?!'); this.react(owner, 'laugh', 'Glass! Hahaha!', 0.3);
    }
  }

  async triggerTrap(p, owner, id, pos) {
    const t = p.trav;
    const it = ITEM[id];
    const remove = () => { if (id === 'grace') owner.grace = null; else delete owner.traps[pos]; };
    if (t.ghost > 0) { this.log(`${this.name(p)} passes through a trap like a wraith.`); return; }
    if (id === 'poison' && this.consume(p, 'stomach')) { remove(); this.log(`${this.name(p)}'s Iron Stomach shrugs off the poison.`); return; }
    if (t.armor && id !== 'rust') {
      t.armorLeft--; remove();
      this.log(`${this.name(p)}'s ${t.armor === 'heavy' ? 'Ironplate' : 'Hide Mantle'} turns aside a ${it.lore}!`); this.react(p, 'proud', 'Ha! Armour!'); this.react(owner, 'angry', 'My trap!', 0.3);
      if (t.armorLeft <= 0) t.armor = null;
      return;
    }
    remove();
    this.log(`💥 ${this.name(p)} triggers ${it.icon} <b>${it.lore}</b> (${it.name})!`, 'bad');
    {
      const vict = { dog: ['shock', 'A HOUND?! RUN!'], prison: ['cry', 'Let me ouuut!'], poison: ['sick', 'Blehh… poison…'], atm: ['angry', 'My coins!'], stardrill: ['cry', 'My star!!'], grace: ['shock', 'A hidden ward?!'], banana: ['shock', 'Whoaaaa!'], alarm: ['nervous', 'Uh-oh, a bell…'], rust: ['sad', 'My armour…'] }[id] || ['shock'];
      this.react(owner, 'evil', R.pick(['Hehehe… my trap!', 'Gotcha!', 'Fell for it!'])); this.react(p, vict[0], vict[1], 0.25);
      this.crowd([p, owner], ['laugh', 'shock'], 0.6);
    }
    this.fx(p, it.icon, '#ff6b6b'); Sfx.bad();
    await sleep(300);
    switch (id) {
      case 'dog': {
        if (this.consume(p, 'biscuit')) { this.log(`${this.name(p)} tosses a Dog Biscuit — the Hellhound drops the chase.`); return; }
        let run = RING_SIZE - pos;
        let dropped = 0, droppedS = 0;
        for (let o = 0; o < 4 && run > 0; o++) { const n = Math.min(run, t.hotC[o]); t.hotC[o] -= n; run -= n; dropped += n; }
        if (run > 0 && this.hotStars(p) > 0) {
          let pouchKeep = this.hotStars(p) > 0 && this.consume(p, 'pouch') ? 1 : 0;
          for (let o = 0; o < 4 && run > 0; o++) {
            while (t.hotS[o] > 0 && run > 0) {
              if (pouchKeep && this.hotStars(p) === 1) break;
              t.hotS[o]--; run--; droppedS++;
            }
          }
        }
        this.bankAdd(owner, dropped); owner.vault += droppedS;
        this.log(`The Hellhound chases ${this.name(p)} out, who drops ${dropped} coins${droppedS ? ` and ${droppedS}⭐` : ''}.`);
        this.sendToGateExit(p, owner);
        break;
      }
      case 'prison': {
        const r = this.moveHot(p, { to: owner, protect: true });
        const bail = await this.choose(owner, { title: 'Oubliette', text: `${p.name} is locked in your Oubliette. Set the bail:`, options: [
          { label: '5 coins', value: 5 }, { label: '10 coins', value: 10 }, { label: 'No bail', value: 0 }] }, () => AI.bail(this, owner, p));
        t.prison = 2; t.bail = bail; t.prisonBy = owner.id;
        this.log(`${this.name(p)} is locked 2 turns; ${r.c} coins${r.s ? ` and ${r.s}⭐` : ''} seized. Bail: ${bail || 'none'}.`);
        break;
      }
      case 'poison': {
        this.moveHot(p, { onlyFrom: owner.id });
        t.poison = true;
        this.log(`${this.name(p)} hands back the loot and is poisoned until cured.`);
        break;
      }
      case 'atm': { const n = this.takeHeld(p, 5); this.bankAdd(owner, n); this.log(`The Tithe Hook snags ${n} coins.`); break; }
      case 'stardrill': if (p.vault > 0) { p.vault--; owner.vault++; this.log(`The Starsiphon draws a banked star from ${this.name(p)}!`); } else this.log('…but they have no banked star.'); break;
      case 'grace': {
        if (this.consume(p, 'charm')) {
          t.prison = 1; t.bail = 0; t.prisonBy = owner.id;
          this.log(`${this.name(p)}'s Lucky Charm softens the Saving Grace: locked 1 turn, loot kept.`);
        } else {
          this.moveHot(p, { to: owner });
          const n = this.takeHeld(p, 3) + (0); this.bankAdd(owner, n);
          t.prison = 3; t.bail = 0; t.prisonBy = owner.id;
          this.log(`😇 The Saving Grace! ${this.name(p)} loses all loot, pays ${n}, and is locked 3 turns.`);
        }
        break;
      }
      case 'banana': {
        const back = R.d6();
        t.pos = Math.max(1, t.pos - back);
        this.log(`${this.name(p)} slides back ${back} spaces on Slickmoss!`);
        UI.refresh(); await sleep(250);
        await this.resolveRingLanding(p, owner);
        break;
      }
      case 'alarm': {
        if (!owner.def) break;
        const { v } = { v: R.d6() };
        this.log(`🔔 The Warden's Bell rings — ${this.name(owner)}'s Warden makes a free move of ${v}.`);
        await this.moveWarden(owner, v, true);
        break;
      }
      case 'rust': t.armor = null; t.armorLeft = 0; this.log(`Verdigris eats away ${this.name(p)}'s armor.`); break;
    }
    UI.refresh();
  }

  async catchRaider(r, owner, mode) {
    const t = r.trav;
    if (t.camo && !(mode === 'unicorn' && this.hotStars(r) > 0)) {
      t.camo = false;
      this.log(`🫥 ${this.name(r)}'s Veilcloak — the Warden looks straight through them.`); this.react(r, 'smug', 'Can’t see me~'); this.react(owner, 'angry', 'Where did they go?!', 0.3);
      return false;
    }
    Sfx.boom();
    if (t.armor === 'heavy') {
      const ret = this.moveHot(r, { coinFrac: 0.5, protect: true });
      t.armor = null; t.armorLeft = 0;
      this.log(`🛡️ ${this.name(r)} is caught but Ironplate saves them: sent to the Gate, dropping ${ret.c} coins${ret.s ? ` and ${ret.s}⭐` : ''}.`, 'warn'); this.react(owner, 'proud', 'Out you go!', 0, true); this.react(r, 'shock', 'Phew… the armour held!', 0.3);
      this.sendToGateExit(r, owner);
    } else if (mode === 'unicorn') {
      const ret = this.moveHot(r, { to: owner, protect: true });
      const c = r.cash; this.bankAdd(owner, c); r.cash = 0;
      this.log(`🦄 The Moonmane seizes everything from ${this.name(r)}: ${ret.c + c} coins${ret.s ? ` and ${ret.s}⭐` : ''} go to ${this.name(owner)}.`, 'warn'); this.react(owner, 'evil', 'The Moonmane sees ALL!', 0, true); this.react(r, 'cry', 'A UNICORN?! Everything…', 0.3); this.crowd([r, owner], ['shock', 'laugh'], 0.7);
      this.sendToGateExit(r, owner);
    } else {
      const c = r.cash;
      this.killTrav(r, owner);
      this.log(`⚔️ ${this.name(owner)}'s Warden catches ${this.name(r)}! The raider dies; loot returns and ${c} cash goes to ${this.name(owner)}.`, 'warn'); this.react(owner, R.pick(['evil', 'laugh']), R.pick(['GOTCHA!', 'Caught you red-handed!', 'MWAHAHA! Not in MY Hold!']), 0, true); this.react(r, 'cry', R.pick(['Nooooo!', 'Busted!! Waaah!', 'So close…']), 0.3); this.crowd([r, owner], ['shock', 'laugh'], 0.7);
    }
    this.fx(owner, 'CAUGHT!', '#fff');
    UI.refresh();
    await sleep(400);
    return true;
  }

  // ------------------------------------------------------------ warden
  async doDefenderMove(p) {
    const rr = await this.roll(p, true); if (!rr) return 'back';
    const { v } = rr;
    await this.moveWarden(p, v, false);
  }
  async moveWarden(p, v, free) {
    const d = p.def;
    const cw = ((d.pos - 1 + v) % RING_SIZE) + 1;
    const ccw = ((d.pos - 1 - v + RING_SIZE * 4) % RING_SIZE) + 1;
    let dir;
    if (cw === ccw) dir = 1;
    else dir = await this.choose(p, { title: `Move Warden ${v}`, text: 'Choose a direction.', options: [
      { label: `⟳ Clockwise to tile ${cw}${this.raidersIn(p).some(r => r.trav.pos === cw) ? ' ⚔️ CATCH' : ''}`, value: 1, tile: cw },
      { label: `⟲ Counter-clockwise to tile ${ccw}${this.raidersIn(p).some(r => r.trav.pos === ccw) ? ' ⚔️ CATCH' : ''}`, value: -1, tile: ccw }], wardenOf: p.id }, () => AI.wardenDir(this, p, cw, ccw));
    for (let s = 0; s < v; s++) {
      d.pos += dir; if (d.pos > RING_SIZE) d.pos = 1; if (d.pos < 1) d.pos = RING_SIZE;
      Sfx.step(); UI.refresh(); await sleep(150);
    }
    for (const r of this.raidersIn(p)) if (r.trav.pos === d.pos) await this.catchRaider(r, p, 'catch');
  }

  // ------------------------------------------------------------ fortify
  async doFortify(p) {
    const list = this.fortifyOptions(p);
    const options = list.map(f => {
      const it = ITEM[f.id];
      return { label: `${it.icon} ${itemLabel(f.id)} — ${f.ult ? 'owned' : it.price + '🏦'}`, value: f.id, disabled: !f.ok, desc: it.desc };
    });
    options.push({ label: '↩ Cancel (rest instead)', value: null });
    const id = await this.choose(p, { title: 'Fortify', text: `Bank: ${this.bank(p)} coins. Choose a defense.`, options }, () => AI.fortifyPick(this, p, list));
    if (!id) { this.log(`${this.name(p)} rests.`); return; }
    const it = ITEM[id];
    if (it.cat === 'ultimate') { await this.useUltimate(p, id); return; }
    let tile = null;
    if (it.place === 'tile') tile = await this.pickTile(p, p, this.freeTrapTiles(p), `Place ${it.lore}`, () => AI.trapTile(this, p, id));
    else if (it.place === 'loot') tile = await this.pickTile(p, p, p.piles.map(x => x.tile), `Place ${it.lore} on a Hoard`, () => AI.lootTileFor(this, p, id));
    this.pay(p, it.price, true);
    const exp = Math.max(1, this.round) + 1; // defenses last 2 rounds
    if (it.place === 'tile') p.traps[tile] = { id, exp };
    else if (it.place === 'loot') {
      const pile = this.lootTile(p, tile);
      if (id === 'fakecoin') pile.fake += 5;
      else if (id === 'mimic') { pile.mimic = true; pile.mimicExp = exp; }
      else { pile.prot = it.lvl; pile.protUses = 2; pile.protExp = exp; }
    } else if (id === 'vaultprot') p.vaultProt = 2;
    else if (id === 'fakestar') p.fakeStars += 2;
    else if (id === 'grace') { const free = this.freeTrapTiles(p); p.grace = R.pick(free); p.graceExp = exp; }
    this.log(`${this.name(p)} fortifies with ${it.icon} ${it.lore}${tile ? ` on tile ${tile}` : ''} (−${it.price} from bank).`);
    Sfx.click();
    if (id === 'grace') Render.trapFx(p, null, '😇', 'A hidden ward is set…');
    else Render.trapFx(p, tile || (it.place === 'vault' ? RING_VAULT : null), it.icon, `${it.lore} set!`);
    Sfx.tone(180, 0.25, 'square', 0.07, -60);
    UI.refresh();
    await sleep(1300);
  }

  async pickRaider(p, title) {
    const rs = this.raidersIn(p);
    if (rs.length === 1) return rs[0];
    const id = await this.choose(p, { title, text: 'Choose a raider.', options: rs.map(r => ({ label: `${r.name} (tile ${r.trav.pos})`, value: r.id })) }, () => AI.pickRaider(this, p, rs));
    return this.P(id);
  }

  async useUltimate(p, id) {
    p.ultUsed = true; p.ultHeld = false;
    await Stage.item(p, ITEM[id].icon, ITEM[id].lore, null, id);
    Sfx.boom();
    this.react(p, 'evil', { typhoon: 'TYPHOON!!', washout: 'GREAT EBB!', inferno: 'SACRIFICE PYRE!', hollow: 'FAMISHED EARTH!' }[id]);
    if (id === 'typhoon') {
      for (const r of this.raidersIn(p)) {
        this.moveHot(r, { onlyFrom: p.id });
        this.moveHot(r);
        r.cash = 0; r.trav.sHand = 0;
        this.sendToGateExit(r, p);
        this.log(`🌪️ TYPHOON! ${this.name(r)} is swept out of ${p.el.hold}, losing everything unbanked.`, 'warn'); this.react(r, 'shock', 'WHOOOAAA!', 0.3);
      }
    } else if (id === 'hollow') {
      p.hollow = true;
      this.log(`⛰️ FAMISHED EARTH: ${this.name(p)}'s Hold now punishes every raider.`, 'warn'); this.react(p, 'evil', 'Feast, earth, feast!'); this.crowd([p], 'nervous');
    } else if (id === 'inferno') {
      const r = await this.pickRaider(p, 'Sacrifice Pyre');
      p.vault--;
      this.moveHot(r); r.cash = 0;
      if (r.def) {
        r.def = null; r.trav = Object.assign(this.newTrav(r.gate), { bag: r.trav.bag });
        this.log(`🔥 SACRIFICE PYRE! ${this.name(p)} burns a star. ${this.name(r)}'s Wayfarer dies for good — their Warden must go to work.`, 'warn'); this.react(p, 'evil', 'BURN!'); this.react(r, 'cry', 'My Wayfarer!!', 0.3); this.crowd([p, r], 'shock', 0.7);
      } else {
        r.gone = true; r.trav.loc = 'board'; r.trav.pos = r.gate;
        this.log(`🔥 SACRIFICE PYRE! ${this.name(r)} has no one left to walk the Crossing.`, 'warn');
      }
    } else if (id === 'washout') {
      const r = await this.pickRaider(p, 'Great Ebb');
      r.trav.loc = 'board'; r.trav.ring = null; r.trav.pos = R.int(0, 39);
      this.log(`🌊 GREAT EBB! ${this.name(r)} is washed out to the Crossing.`, 'warn'); this.react(p, 'evil', 'The tide takes you!'); this.react(r, 'shock', 'Blub blub!', 0.3);
      const targets = r.piles.filter(x => x.real + x.fake > 0).map(x => ({ pile: x }));
      if (r.vault + r.fakeStars > 0) targets.push({ vault: true });
      if (targets.length) {
        const tg = R.pick(targets);
        if (tg.vault) {
          if (Math.random() < r.vault / (r.vault + r.fakeStars)) { r.vault--; p.vault++; this.log(`${this.name(p)}'s Warden steals a star from ${this.name(r)}'s Starvault!`); }
          else { r.fakeStars--; this.log(`${this.name(p)}'s Warden grabs a fake star.`); }
        } else {
          let got = 0; for (let k = 0; k < 5; k++) { const pl = tg.pile, tot = pl.real + pl.fake; if (!tot) break; if (Math.random() < pl.real / tot) { pl.real--; got++; } else pl.fake--; }
          this.bankAdd(p, got); this.log(`${this.name(p)}'s Warden raids a Hoard of ${this.name(r)}: +${got} coins.`);
        }
      }
    }
    UI.refresh();
    await sleep(500);
  }

  // ------------------------------------------------------------ items
  async pickTarget(p, it, kind) {
    let cands = this.players.filter(q => q !== p && !q.gone);
    if (it.id === 'mirror') cands = cands.filter(q => q.trav.loc === 'board');
    if (it.id === 'bounty') cands = cands.filter(q => this.hotCoins(q) + this.hotStars(q) > 0 || this.isRaiding(q));
    const opts = cands.map(q => ({ label: `${q.el.glyph} ${q.name}`, value: q.id }));
    if (kind === 'selfOrEnemy') opts.unshift({ label: 'Myself', value: p.id });
    opts.push({ label: 'Cancel', value: -1 });
    const v = await this.choose(p, { title: `${it.icon} ${it.lore}`, text: 'Choose a target.', options: opts }, () => AI.itemTarget(this, p, it.id, cands));
    return v === -1 || v === null ? null : this.P(v);
  }

  async playItem(p, id) {
    const it = ITEM[id];
    const t = p.trav;
    let target = null;
    if (it.target === 'enemy' || it.target === 'selfOrEnemy') {
      target = await this.pickTarget(p, it, it.target);
      if (!target) return false;
    }
    this.consume(p, id);
    this.log(`${this.name(p)} uses ${it.icon} <b>${itemLabel(id)}</b>${target && target !== p ? ` on ${this.name(target)}` : ''}.`);
    Sfx.click();
    await Stage.item(p, it.icon, itemLabel(id), target && target !== p && !target.gone ? target : null, id);
    switch (id) {
      case 'armor': t.armor = 'normal'; t.armorLeft = 1; break;
      case 'heavy': t.armor = 'heavy'; t.armorLeft = 2; break;
      case 'camo': t.camo = true; break;
      case 'bag': t.bag = { c: 0, s: 0 }; this.fillBag(p); break;
      case 'antidote': t.poison = false; break;
      case 'ghost': t.ghost = 3; break;
      case 'smoke': { const o = this.P(t.ring); this.sendToGateExit(p, o); break; }
      case 'jailbreak': { const o = this.P(t.prisonBy); this.sendToGateExit(p, o); break; }
      case 'recall':
        if (t.prison) break;
        t.loc = 'ring'; t.ring = p.id; t.pos = RING_GATE;
        await this.deposit(p, 'home');
        break;
      case 'unicorn': {
        const r = await this.pickRaider(p, 'Unicorn');
        t.mods.unicorn = true;
        await this.catchRaider(r, p, 'unicorn');
        break;
      }
      case 'custom': t.mods.custom = true; break;
      case 'double': t.mods.double = true; break;
      case 'advantage': t.mods.adv = true; break;
      case 'reverse': target.trav.mods.reverse = true; break;
      case 'cursed': target.trav.mods.cursed = true; break;
      case 'supercursed': this.players.forEach(q => { if (q !== p) q.trav.mods.cursed = true; }); break;
      case 'snail': target.trav.mods.snail = true; break;
      case 'ice': target.trav.frozen = 2; break;
      case 'warp': t.pos = R.int(0, 39); UI.refresh(); await Stage.look(Render.trackPos(t.pos), 900); this.log(`${this.name(p)} warps to space ${t.pos}.`); break;
      case 'shophop': {
        const open = [5, 15, 25, 35].filter(b => !this.closedBanks[b]);
        t.pos = R.pick(open.length ? open : [5, 15, 25, 35]); UI.refresh(); await sleep(300);
        if (this.bankOpen(t.pos, p)) await this.shopVisit(p, true);
        break;
      }
      case 'mirror': { const a = t.pos; t.pos = target.trav.pos; target.trav.pos = a; break; }
      case 'deposit': await this.deposit(p, 'a distance (Courier Raven)'); break;
      case 'gold': {
        const segs = [5, 8, 12, 5, 8, 12, 5, 8, 12, 'star'];
        const r = segs[await Stage.wheel(p, segs.map(v => v === 'star' ? { icon: '⭐', color: '#ffd34d' } : { icon: '🪙', text: '+' + v, color: { 5: '#6fa8dc', 8: '#6fdc8c', 12: '#ff9a3d' }[v] }), '🃏 Oracle Card')];
        if (r === 'star') { t.sHand++; this.log(`Oracle Card: a star!`, 'good'); Sfx.star(); this.react(p, 'starry', 'A STAR!'); }
        else { p.cash += r; this.log(`Oracle Card: +${r} coins.`); Sfx.coin(); Render.coinBurst(p, Math.min(8, r)); }
        break;
      }
      case 'itembag': await this.giveItem(p, await this.itemWheel(p, '🎒')); break;
      case 'chain': t.chain = 3; break;
      case 'robin': {
        const rich = this.players.filter(q => q !== p).sort((a, b) => b.vault - a.vault || this.bank(b) - this.bank(a))[0];
        let n = Math.min(3, rich.cash); rich.cash -= n; if (n < 3) n += this.bankTake(rich, 3 - n);
        if (n) Stage.lossGain(() => Stage.scr(Stage.tokPt(rich)), () => Stage.scr(Stage.tokPt(p)), n, { lose: rich.name, gain: p.name });
        p.cash += n; this.log(`${this.name(p)} takes ${n} coins from ${this.name(rich)}.`); this.react(p, 'smug', 'For the poor! (me)'); this.react(rich, 'angry', undefined, 0.3);
        break;
      }
      case 'swap': { const a = p.cash; p.cash = target.cash; target.cash = a; if (target.cash < p.cash) { this.react(p, 'evil', 'Thanks for the wallet!'); this.react(target, 'shock', 'My purse!', 0.3); } break; }
      case 'thief': case 'itemthief': case 'starthief': t.thief = { type: id, round: this.round }; break;
      case 'plunder':
        if (target.items.length) { const x = target.items.splice(R.int(0, target.items.length - 1), 1)[0]; await this.giveItem(p, x); }
        else this.log(`${this.name(target)} has nothing to plunder.`);
        break;
      case 'callankar': this.ankar = (t.pos - 6 + 40) % 40; this.log('The Ankar appears six spaces behind!', 'warn'); break;
      case 'repel': t.repel = 3; break;
      case 'leash': {
        const opts = [];
        for (let d = -6; d <= 6; d++) if (d) opts.push({ label: `${d > 0 ? '+' : ''}${d} → space ${(this.ankar + d + 40) % 40}`, value: d });
        const d = await this.choose(p, { title: "Ankar's Leash", text: 'Drag the Tithe-Taker.', options: opts }, () => AI.leash(this, p));
        this.ankar = (this.ankar + d + 40) % 40;
        for (const q of this.players) if (q.trav.loc === 'board' && q.trav.pos === this.ankar) this.ankarContact(q);
        break;
      }
      case 'bounty': target.trav.bounty = true; break;
    }
    UI.refresh();
    await sleep(250);
    return true;
  }

  // ------------------------------------------------------------ shop
  async shopVisit(p, landed) {
    const t = p.trav;
    const carry = p.cash + this.hotCoins(p) + this.carriedStars(p) + (t.bag ? t.bag.c + t.bag.s : 0);
    if (carry > 0) {
      const yes = await this.choose(p, { title: '🏛️ Counting House', text: `Deposit everything you carry (${p.cash + this.hotCoins(p)} coins, ${this.carriedStars(p)}⭐)? Banked coins can’t be withdrawn as cash, but can be spent.`, options: [
        { label: 'Deposit', value: true }, { label: 'Keep it on hand', value: false }] }, () => AI.wantDeposit(this, p));
      if (yes) await this.deposit(p, 'the Counting House');
    }
    let price = 20; // a fixed, predictable star price (it used to vary 15–25 per visit, which was confusing)
    const offers = [];
    while (offers.length < 3) { const id = this.randomHandItem(); if (!offers.includes(id)) offers.push(id); }
    const ult = ITEM[p.el.ult];
    let stars = 0, itemBought = false;
    const sold = new Set();
    const wares = [{ icon: '⭐', name: 'Star', price, star: true, state: 'ok', keep: true }]
      .concat(offers.map(id => ({ icon: ITEM[id].icon, name: itemLabel(id), price: ITEM[id].price, state: 'ok', id })));
    if (!p.ultBought) wares.push({ icon: ult.icon, name: ult.lore, price: ult.price, state: 'ok', ult: true });
    Stage.openShop(p, wares); if (Stage.shop) Stage.shop.money = () => p.cash + this.bank(p);
    try {
    for (;;) {
      const sale = this.hasItem(p, 'starsale');
      const sp = sale ? Math.ceil(price / 2) : price;
      const bulk = this.hasItem(p, 'bulk');
      const half = this.hasItem(p, 'coupon');
      const opts = [{ label: `⭐ Buy a star — ${sp}${sale ? ' (Comet Sale!)' : ''}`, value: 'star', disabled: !this.afford(p, sp) || (stars >= 1 && !bulk) }];
      offers.forEach((id, i) => {
        const pr = half ? Math.ceil(ITEM[id].price / 2) : ITEM[id].price;
        opts.push({ label: `${ITEM[id].icon} ${itemLabel(id)} — ${pr}${half ? ' (Coupon)' : ''}`, value: 'i' + i, disabled: itemBought || sold.has(i) || !this.afford(p, pr), desc: ITEM[id].desc });
      });
      if (!p.ultBought) opts.push({ label: `${ult.icon} ${p.el.name} ultimate: ${ult.lore} — ${ult.price}`, value: 'ult', disabled: itemBought || !this.afford(p, ult.price), desc: ult.desc });
      opts.push({ label: 'Leave the Counting House', value: 'done' });
      wares[0].price = sp;
      wares.forEach((w, k) => { if (w.state === 'sold' || w.state === 'gone') return; const o = opts.find(x => x.value === (k === 0 ? 'star' : w.ult ? 'ult' : 'i' + (k - 1))); w.state = o && !o.disabled ? 'ok' : 'no'; if (half && w.id) w.price = Math.ceil(ITEM[w.id].price / 2); });
      let v = await this.choose(p, { title: '🏛️ Counting House', text: '', options: opts, shop: true },
        () => AI.shop(this, p, opts, { sp, offers, half, sold }));
      if (!v || v === 'done') {
        // leaving without a star you could afford? make sure
        if (p.human && stars === 0 && this.afford(p, sp) && !Settings.test) {
          const sure = await this.choose(p, { title: '⭐ Leave without a star?', text: `You can afford a star right now (${sp} coins). Are you sure you want to leave without one?`, options: [{ label: '⭐ No — buy the star!', value: 'star' }, { label: 'Yes, leave without it', value: 'leave', back: true }] }, () => 'leave');
          if (sure !== 'star') break;
          v = 'star';
        } else break;
      }
      if (v === 'star') {
        wares[0].keep = bulk; await Stage.buy(0);
        this.pay(p, sp); p.vault++; stars++;
        if (sale) this.consume(p, 'starsale');
        this.log(`⭐ ${this.name(p)} buys a star for ${sp}!`, 'good'); Sfx.star(); this.say(p, 'starry', 'star'); Sfx.crowd('cheer'); this.fx(p, '+1⭐', '#ffe680'); { const riv = this.players.filter(q => q !== p); this.react(R.pick(riv), R.pick(['sad', 'angry', 'nervous']), R.pick(['Show-off…', 'Hmph!', 'Must… catch up…']), 0.4); }
      } else if (v === 'ult') {
        await Stage.buy(wares.length - 1);
        this.pay(p, ult.price); p.ultBought = true; p.ultHeld = true; itemBought = true;
        this.log(`${this.name(p)} buys the ${p.el.name} ultimate: ${ult.icon} ${ult.lore}!`, 'good');
      } else {
        const i = +v.slice(1), id = offers[i];
        const pr = half ? Math.ceil(ITEM[id].price / 2) : ITEM[id].price;
        if (p.items.length >= HAND_LIMIT && !p.human) break;
        await Stage.buy(i + 1);
        this.pay(p, pr); if (half) this.consume(p, 'coupon');
        sold.add(i); itemBought = true;
        await this.giveItem(p, id, false);
      }
      UI.refresh();
    }
    } finally { Stage.closeShop(); }
    if (stars > 1) this.consume(p, 'bulk');
  }

  // ------------------------------------------------------------ round end
  // defenses fade after two rounds
  async expireDefenses() {
    const R0 = this.round;
    for (const p of this.players) {
      const gone = [];
      for (const k of Object.keys(p.traps || {})) if (p.traps[k].exp !== undefined && R0 >= p.traps[k].exp) { gone.push([ITEM[p.traps[k].id].icon, +k]); delete p.traps[k]; }
      for (const pile of p.piles || []) { if (pile.protExp !== undefined && R0 >= pile.protExp) { pile.prot = 0; pile.protExp = undefined; gone.push(['🛡️', pile.tile]); } if (pile.mimicExp !== undefined && R0 >= pile.mimicExp) { pile.mimic = false; pile.mimicExp = undefined; gone.push(['🧰', pile.tile]); } }
      if (p.grace && p.graceExp !== undefined && R0 >= p.graceExp) { p.grace = null; }
      if (p.guards && p.guards.length) { p.guards = p.guards.filter(gd => { if (R0 < gd.exp) return true; gone.push([ITEM[gd.id].icon, null]); return false; }); }
      if (p.guardExp) { p.guardExp = p.guardExp.filter(gd => { if (R0 < gd.exp) return true; const i = p.items.indexOf(gd.id); if (i >= 0) { p.items.splice(i, 1); gone.push([ITEM[gd.id].icon, null]); } return false; }); }
      if (gone.length) {
        this.log(`💨 ${this.name(p)}'s ${gone.map(g => g[0]).join(' ')} wore off after two rounds.`);
        gone.forEach(([ic, tile]) => { const at = tile && !this.simple ? Render.ringPos(p.id, tile) : Render.homeCenter(p.id); Render.burstAt(at, ['rgba(255,255,255,0.8)', '#ccc'], 14, { speed: 90, life: 0.7, size: 5 }); Render.addP({ x: at.x, y: at.y - 30, vy: -40, life: 1.4, kind: 'text', text: ic + ' poof!', color: '#fff', size: 16 }); });
        Sfx.noise(0.4, 1200, 0.06, 'bandpass', 0, -900);
      }
    }
  }
  async endOfRound() {
    this.phase = 'roundEnd';
    await this.expireDefenses();
    if (this.ankar !== null) {
      // the Ankar follows the nearest Wayfarer on the Crossing, up to 3 spaces
      const cands = this.players.filter(q => !q.gone && q.trav.loc === 'board' && !(q.trav.repel > 0));
      let dir = 1, maxSteps = 3;
      if (cands.length) {
        let best = null, bd = 99;
        for (const q of cands) {
          const fwd = (q.trav.pos - this.ankar + 40) % 40, back = (this.ankar - q.trav.pos + 40) % 40;
          const d = Math.min(fwd, back);
          if (d < bd) { bd = d; best = { d, dir: fwd <= back ? 1 : -1 }; }
        }
        dir = best.dir; maxSteps = Math.min(3, best.d);
      }
      for (let s = 0; s < maxSteps; s++) { this.ankar = (this.ankar + dir + 40) % 40; UI.refresh(); await sleep(220); }
      for (const q of this.players) if (q.trav.loc === 'board') this.ankarContact(q);
    }
    for (const k of Object.keys(this.closedGates)) { if (--this.closedGates[k] <= 0) delete this.closedGates[k]; }
    for (const k of Object.keys(this.closedBanks)) { if (--this.closedBanks[k] <= 0) delete this.closedBanks[k]; }
    UI.refresh();
  }

  async minigamePhase() {
    this.phase = 'minigame';
    // the last Moot of every game is the Grand Finale brawl; the halfway Moot is one of the long marathon games
    const finale = this.round === this.rounds - 1 && MG.byId.brawl && this.rounds > 2;
    const marathon = !finale && this.round === Math.floor(this.rounds / 2) && MG.list.some(g => g.long);
    const elig = g => (marathon ? g.long : !g.long) && !g.finale;
    let pool = MG.list.filter(g => elig(g) && !this.mgPlayed.includes(g.id)).map(g => g.id);
    if (!pool.length) { this.mgPlayed = this.mgPlayed.filter(x => !MG.list.some(g => g.id === x && elig(g))); pool = MG.list.filter(elig).map(g => g.id); }
    let id;
    if (this.mgForce) id = this.mgForce;
    else if (finale) {
      // one of the four brawl arenas, avoiding the one played in the last game if possible
      const arenas = MG.list.filter(g => g.finale).map(g => g.id), fresh = arenas.filter(x => x !== Settings.lastFinale);
      id = R.pick(fresh.length ? fresh : arenas); try { Settings.lastFinale = id; } catch (e) { /* ignore */ }
      await UI.banner('🔥 Grand Finale 🔥', `The last Moot is a brawl in the ${MG.byId[id].name} — clan powers, last one standing!`);
    }
    else {
      if (marathon) await UI.banner('🏟️ Marathon Moot', 'Halfway there — time for one of the big multi-event games!');
      const under = this.players.slice().sort((a, b) => a.vault - b.vault || (this.bank(a) + a.cash) - (this.bank(b) + b.cash))[0];
      const two = R.shuffle(pool).slice(0, 2);
      if (two.length < 2) id = two[0];
      else id = await this.choose(under, { title: `Catch-up draw: ${under.name} picks the Moot`, text: 'Fewest stars picks which minigame is played.', options: two.map(g => ({ label: `${MG.byId[g].name} (${MG.byId[g].type}, ${MG.byId[g].controls})`, value: g, desc: MG.byId[g].how })) },
        () => R.pick(two));
    }
    this.mgPlayed.push(id);
    await Stage.mgReveal(id);
    await UI.wipe(true, MG.byId[id].name);
    setTimeout(() => UI.wipe(false), 200);
    const res = await MG.run(id, this.players.map(p => ({ id: p.id, name: p.name, color: p.color, human: p.human, el: p.el })), this.order.slice());
    await UI.wipe(true, ''); UI.wipe(false);
    if (res.quit || !res.winners.length) { this.log(`The Moot <b>${MG.byId[id].name}</b> was abandoned — no winner, no reward.`); UI.refresh(); return; }
    const winners = this.order.filter(x => res.winners.includes(x));
    // prizes: 1st 3 coins, 2nd 2, 3rd 1 (ties share the better place)
    const sc = res.scores, prize = { 1: 3, 2: 2, 3: 1 };
    const place = q => winners.includes(q.id) ? 1 : (sc && typeof sc[q.id] === 'number' ? 1 + this.players.filter(o => sc[o.id] > sc[q.id] + 1e-9).length : 4);
    const places = this.players.map(q => ({ p: q, place: place(q) }));
    // coin minigames: everyone keeps the coins they collected (at most 20); other Moots pay 3 / 2 / 1
    const coinGame = MG.byId[id].coinGame;
    places.forEach(r => { r.coins = coinGame ? clamp(Math.round((sc && sc[r.p.id]) || 0), 0, 20) : prize[r.place] || 0; if (r.coins) this.bankAdd(r.p, r.coins); });
    winners.forEach(x => this.P(x).mgWins++);
    await Stage.podium(places);
    places.forEach((r, k) => { if (r.coins) setTimeout(() => this.fx(r.p, `+${r.coins}🪙`, '#ffe680'), k * 120); });
    if (coinGame) this.log(`🪙 Coin Moot <b>${MG.byId[id].name}</b>: ${places.map(r => `${this.name(r.p)} +${r.coins}`).join(', ')}.`, 'good');
    else this.log(`🏆 ${winners.map(x => this.name(this.P(x))).join(' & ')} ${winners.length > 1 ? 'tie and win' : 'wins'} the Moot <b>${MG.byId[id].name}</b> (+3)${places.filter(r => r.place > 1 && r.coins).map(r => `, ${this.name(r.p)} +${r.coins}`).join('')}.`, 'good');
    this.players.forEach((q, k) => { if (winners.length === 1 && q.id === winners[0]) this.say(q, 'proud', 'win', k * 0.15); else this.react(q, winners.includes(q.id) ? R.pick(['proud', 'laugh']) : R.pick(['sad', 'angry', 'cry']), winners.includes(q.id) ? R.pick(['Victory!', 'Too easy!', 'Champion!']) : undefined, k * 0.15); });
    // next round's turn order follows the Moot result: 1st, 2nd, 3rd, 4th (ties keep the old order)
    const prev = this.order.slice(), pl = id => places.find(r => r.p.id === id).place;
    this.order = prev.slice().sort((a, b) => pl(a) - pl(b) || prev.indexOf(a) - prev.indexOf(b));
    this.log(`Next round's order: ${this.order.map(x => this.name(this.P(x))).join(' → ')}`);
    UI.refresh();
  }

  // ------------------------------------------------------------ end
  standings() {
    return this.players.map(p => {
      const bagS = p.trav.bag ? p.trav.bag.s : 0, bagC = p.trav.bag ? p.trav.bag.c : 0;
      return { p, stars: p.vault + bagS, coins: this.bank(p) + bagC, wins: p.mgWins };
    }).sort((a, b) => b.stars - a.stars || b.coins - a.coins || b.wins - a.wins);
  }
  async endGame() {
    this.phase = 'end'; this.over = true;
    const st = this.standings();
    const top = st.filter(s => s.stars === st[0].stars && s.coins === st[0].coins && s.wins === st[0].wins);
    this.log(`<b>The final bell has rung.</b> ${top.map(s => this.name(s.p)).join(' & ')} ${top.length > 1 ? 'share' : 'is'} the title Keeper of the Sky!`, 'good');
    Sfx.win();
    UI.refresh();
    if (!Settings.test) await UI.showResults(st, top);
  }
}
