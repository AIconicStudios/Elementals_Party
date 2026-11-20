'use strict';
// Board 2 — "Starter Crossing": a beginner version of The Fourfold.
// Same heart (walk the Crossing, collect coins, buy stars, raid rivals, Moot minigames,
// emotional reactions) with one wallet, one turn action, seven easy items and a few shenanigans.

const SIMPLE_HALF = ['gate', 'blue', 'lucky', 'blue', 'red', 'bank', 'blue', 'item', 'red', 'blue',
                     'gate', 'blue', 'swirl', 'red', 'blue', 'bank', 'party', 'blue', 'red', 'item'];
// one Ankar's Altar on the first half; it turns blue once the Ankar is set loose
const SIMPLE_BOARD = SIMPLE_HALF.map((x, i) => i === 6 ? 'summon' : x).concat(SIMPLE_HALF);
const SIMPLE_STAR_PRICE = 15;

class SimpleGame extends Game {
  constructor(cfg) {
    super(cfg);
    this.simple = true;
    this.raidRound = 3;
    this.board = SIMPLE_BOARD.slice();
    this.players.forEach(p => { p.def = null; p.piles = []; });
  }

  // ---- one wallet: banked coins and coins on hand are the same thing
  bank(p) { return 0; }
  bankAdd(p, n) { if (n > 0) p.cash += n; }
  bankTake(p, n) { const t = Math.min(n, p.cash); p.cash -= t; return t; }
  afford(p, cost) { return p.cash >= cost; }
  pay(p, cost) { p.cash = Math.max(0, p.cash - cost); }
  randomHandItem() { return R.pick(SIMPLE_ITEMS.filter(it => it.id !== 'sshade')).id; }
  standings() {
    return this.players.map(p => ({ p, stars: p.vault, coins: p.cash, wins: p.mgWins }))
      .sort((a, b) => b.stars - a.stars || b.coins - a.coins || b.wins - a.wins);
  }

  async setup() {
    this.phase = 'setup';
    this.log('<b>Welcome to the Starter Crossing!</b> Collect coins, buy stars for 15 at a Counting House 🏛️, and sneak into rival Holds from round 3. Most stars wins!');
    for (const p of this.players) { p.cash = 10; p.items.push(this.randomHandItem()); }
    UI.refresh();
  }

  // ---- a turn: use items if you like, then roll and move
  async takeTurn(p) {
    if (this.aborted) throw new Error('aborted');
    this.current = p; this.turnCount++; this.phase = 'turn';
    UI.refresh(); UI.turnStart(p);
    this.log(`<hr>— ${this.name(p)}'s turn —`);
    await Stage.turn(p);
    for (let guard = 0; guard < 8; guard++) {
      const options = [{ label: '🎲 Roll the dice!', value: 'roll', key: 'roll' }];
      for (const id of [...new Set(p.items)]) {
        const it = ITEM[id];
        if (it.use === 'play') options.push({ label: `${it.icon} Use ${it.name}`, value: id, desc: it.desc, item: true });
        else if (it.guard || it.use === 'install') options.push({ label: `🛠️ Install ${it.icon} ${it.name}`, value: 'install:' + id, desc: it.desc, item: true });
      }
      const v = await this.choose(p, { title: `${p.name}'s turn`, text: '', options }, () => this.botPick(p));
      if (v === 'roll' || !v) break;
      if (typeof v === 'string' && v.startsWith('install:')) { await this.install(p, v.slice(8)); UI.refresh(); continue; }
      await this.useSimpleItem(p, v);
      UI.refresh();
    }
    if (p.trav.sfrozen) {
      p.trav.sfrozen = false;
      this.log(`🧊 ${this.name(p)} is frozen solid and can't move this turn!`);
      this.react(p, 'angry', R.pick(['Brrr! Let me out!', 'So... cold...', 'Not cool. Literally.']));
      Render.burstAt(Stage.tokPt(p), ['#bfe9ff', '#fff'], 24, { speed: 200, kind: 'spark', size: 3 }); Sfx.item('ice');
      await sleep(1400);
      this.dice = null; Render.die = null; UI.refresh(); return;
    }
    const { v, dir } = await this.roll(p);
    await this.moveSimple(p, v, dir);
    await sleep(700);
    this.dice = null; Render.die = null;
    UI.refresh();
    await sleep(200);
  }

  // ---- guards are kept in hand and installed on your Hold when you choose; Shade is permanent
  guardOn(p, id) { return (p.guards || []).some(gd => gd.id === id); }
  trip(p, id) { const i = (p.guards || []).findIndex(gd => gd.id === id); if (i < 0) return false; p.guards.splice(i, 1); return true; }
  async install(p, id) {
    const it = ITEM[id]; if (!this.consume(p, id)) return;
    if (id === 'sshade') { p.shade = true; this.log(`🌫️ ${this.name(p)} drapes a permanent Shade over their ${p.el.hold}. What's inside is now a secret!`); }
    else { (p.guards = p.guards || []).push({ id, exp: Math.max(1, this.round) + 2 }); this.log(p.shade ? `🌫️ ${this.name(p)} installs something under their Shade…` : `🛠️ ${this.name(p)} installs ${it.icon} <b>${it.name}</b> at their Hold (2 rounds).`); }
    Render.burstAt(Render.homeCenter(p.id), id === 'sshade' ? ['#5a4a7a', '#8a7aaa', '#2a2040'] : ['#ffe680', '#fff'], 26, { speed: 200 }); Sfx.item(id === 'sshade' ? 'smirror' : id);
    this.react(p, 'smug', id === 'sshade' ? 'Now you see me… now you don’t.' : p.shade ? 'Hehe, guess what I set up~' : R.pick(['Try me now!', 'All set!', 'Come and get it!']));
    await sleep(700);
  }
  botPick(p) {
    const has = id => p.items.includes(id);
    if (has('sshade')) return 'install:sshade';
    for (const gid of ['sdog', 'sbell', 'speel', 'slock', 'sshield']) if (has(gid) && !this.guardOn(p, gid)) return 'install:' + gid;
    const richest = this.players.filter(q => q !== p).sort((a, b) => b.cash - a.cash)[0];
    if (has('smagnet') && richest.cash >= 3) return 'smagnet';
    if (has('sthief') && richest.cash >= 3) return 'sthief';
    if (has('sice') && Math.random() < 0.6) return 'sice';
    if (has('sreverse') && Math.random() < 0.5) return 'sreverse';
    if (has('smirror') && Math.random() < 0.35) return 'smirror';
    if (has('swarp') && Math.random() < 0.3) return 'swarp';
    if (has('sbox')) return 'sbox';
    if (has('swind') && p.cash >= SIMPLE_STAR_PRICE) return 'swind';
    if (has('ssnail') && Math.random() < 0.5) return 'ssnail';
    if (has('sdouble') && Math.random() < 0.5) return 'sdouble';
    if (has('smagic') && Math.random() < 0.5) return 'smagic';
    return 'roll';
  }

  async useSimpleItem(p, id) {
    const it = ITEM[id], t = p.trav;
    let target = null;
    if (it.target === 'enemy') {
      const cands = this.players.filter(q => q !== p);
      const tid = await this.choose(p, { title: `${it.icon} ${it.name}`, text: 'Pick a player.', options: cands.map(q => ({ label: `${q.el.glyph} ${q.name}`, value: q.id })).concat([{ label: 'Cancel', value: -1 }]) },
        () => cands.sort((a, b) => b.vault - a.vault || b.cash - a.cash)[0].id);
      if (tid === -1 || tid === null) return;
      target = this.P(tid);
    }
    this.consume(p, id);
    this.log(`${this.name(p)} uses ${it.icon} <b>${it.name}</b>${target ? ` on ${this.name(target)}` : ''}.`);
    Sfx.click();
    await Stage.item(p, it.icon, it.name, target, id);
    switch (id) {
      case 'sdouble': t.mods.double = true; this.emote(p, '🎲'); break;
      case 'smagic': t.mods.custom = true; this.emote(p, '🎯'); break;
      case 'ssnail': target.trav.mods.snail = true; this.react(p, 'smug', 'Slow down there!'); this.react(target, 'angry', 'A snail?!', 0.3); break;
      case 'smagnet': {
        const rich = this.players.filter(q => q !== p).sort((a, b) => b.cash - a.cash)[0];
        const n = Math.min(5, rich.cash);
        await Stage.coinsTo(() => Stage.scr(Stage.tokPt(rich)), () => Stage.scr(Stage.tokPt(p)), Math.max(1, n), { lose: rich.name, gain: p.name });
        rich.cash -= n; p.cash += n;
        this.log(`🧲 ${this.name(p)} pulls ${n} coins from ${this.name(rich)}!`);
        Render.coinBurst(p, Math.max(1, n));
        this.react(p, 'evil', 'Come to me, coins!'); this.react(rich, 'shock', 'Hey! My coins!', 0.3);
        break;
      }
      case 'sice': target.trav.sfrozen = true; this.react(target, 'shock', 'Hey! I’m an ice cube!', 0.2); this.react(p, 'smug', 'Chill out~'); break;
      case 'sreverse': target.trav.mods.reverse = true; this.react(target, 'angry', 'Backwards?! Rude!', 0.2); this.react(p, 'evil', 'Moonwalk time!'); break;
      case 'sthief': {
        const n = Math.min(3, target.cash);
        await Stage.coinsTo(() => Stage.scr(Stage.tokPt(target)), () => Stage.scr(Stage.tokPt(p)), Math.max(1, n), { lose: target.name, gain: p.name });
        target.cash -= n; p.cash += n; this.log(`🦹 ${this.name(p)} pickpockets ${n} coins from ${this.name(target)}!`);
        this.react(p, 'evil', R.pick(['Mine now~', 'Finders keepers!'])); this.react(target, 'angry', 'My pocket!!', 0.3);
        break;
      }
      case 'smirror': {
        const a = t.pos; t.pos = target.trav.pos; target.trav.pos = a; UI.refresh(); Sfx.whoosh(true);
        this.log(`🪞 ${this.name(p)} swaps places with ${this.name(target)}!`); this.react(target, 'shock', 'Whoa, where am I?!', 0.4);
        await sleep(900);
        break;
      }
      case 'swarp': {
        t.pos = R.int(0, 39); UI.refresh(); await Stage.look(Render.trackPos(t.pos), 900);
        this.log(`🌀 ${this.name(p)} warps across the Crossing!`); await this.landSimple(p);
        break;
      }
      case 'sbox':
        if (await Stage.wheel(p, [{ icon: '⭐', color: '#ffd34d' }, { icon: '🪙', text: '+3', color: '#6fdc8c' }, { icon: '🪙', text: '+3', color: '#5fb8ff' }, { icon: '⭐', color: '#ffd34d' }, { icon: '🪙', text: '+3', color: '#6fdc8c' }, { icon: '🪙', text: '+3', color: '#5fb8ff' }], '🎁 Lucky Star Box') % 3 === 0) { p.vault++; this.log(`🎁 ${this.name(p)} opens the box… a STAR!`, 'good'); Sfx.star(); this.react(p, 'starry', 'A FREE STAR!!'); this.crowd([p], ['shock', 'angry'], 0.4); }
        else { p.cash += 3; this.log(`🎁 ${this.name(p)} opens the box… 3 coins.`); this.emote(p, '🙂'); }
        break;
      case 'swind': {
        let k = t.pos; do { k = (k + 1) % 40; } while (this.board[k] !== 'bank');
        t.pos = k; UI.refresh(); await Stage.look(Render.trackPos(k), 900);
        this.log(`💨 ${this.name(p)} flies to a Counting House.`);
        await this.shopSimple(p);
        break;
      }
    }
    await sleep(250);
  }

  // ---- movement on the Crossing
  async moveSimple(p, steps, dir) {
    const t = p.trav;
    for (let s = 1; s <= steps; s++) {
      t.pos = (t.pos + dir + 40) % 40;
      Sfx.step(); Render.stepPuff(t.pos); UI.refresh();
      await sleep(430);
      const last = s === steps, sp = this.board[t.pos];
      if (sp === 'bank') await this.shopSimple(p);
      if (sp === 'gate') {
        const owner = this.players.find(o => o.gate === t.pos);
        if (owner === p) { p.cash += 3; this.fx(p, '🏠 +3', '#ffe680'); this.emote(p, '🏠'); this.log(`${this.name(p)} passes home: +3 coins.`); }
        else if (this.round >= this.raidRound) {
          const rest = steps - s;
          const yes = await this.choose(p, { title: `${owner.el.hold}`, text: '', options: [
            { label: `🦹 Sneak in!`, value: true }, { label: rest ? `Keep walking (${rest} more)` : 'No thanks', value: false }] },
            () => (owner.vault > 0 || owner.cash >= 5) && Math.random() < (!owner.shade && (owner.guards || []).length ? 0.2 : 0.75));
          if (yes) { await this.raidSimple(p, owner); UI.refresh(); return; }
        }
      }
    }
    await this.landSimple(p);
  }

  async raidSimple(p, owner) {
    this.log(`${this.name(p)} sneaks into ${this.name(owner)}'s ${owner.el.hold}…`, 'warn');
    this.react(p, 'smug', R.pick(['Sneak sneak…', 'Shhh…', 'Knock knock!'])); this.react(owner, 'nervous', 'Is someone there?!', 0.3);
    await sleep(700);
    if (this.trip(owner, 'sdog')) {
      await Stage.item(owner, '🐕', 'Guard Dog', p, 'sdog');
      const n = Math.min(5, p.cash); if (n) Stage.lossGain(() => Stage.scr(Stage.tokPt(p)), () => Stage.scr(Render.homeCenter(owner.id)), n, { lose: p.name, gain: owner.name }); p.cash -= n; owner.cash += n;
      this.log(`🐕 ${this.name(owner)}'s Guard Dog chases ${this.name(p)} away! ${this.name(p)} pays ${n} coins.`, 'bad');
      Render.burstAt(Render.homeCenter(owner.id), ['#c98a4a', '#fff'], 30, { speed: 280 }); Sfx.bad();
      this.react(owner, 'evil', 'Sic \'em, boy!'); this.react(p, 'shock', 'A DOG?! RUN!', 0.25); this.crowd([p, owner], 'laugh', 0.6);
      return;
    }
    if (this.trip(owner, 'sbell')) {
      await Stage.item(owner, '🔔', 'Alarm Bell', p, 'sbell');
      const n = Math.min(5, p.cash); if (n) Stage.lossGain(() => Stage.scr(Stage.tokPt(p)), () => Stage.scr(Render.homeCenter(owner.id)), n, { lose: p.name, gain: owner.name }); p.cash -= n; owner.cash += n;
      this.log(`🔔 ${this.name(owner)}'s Alarm Bell rings! ${this.name(p)} is caught and pays ${n} coins.`, 'bad');
      this.react(owner, 'laugh', 'DING DING! Caught ya!'); this.react(p, 'cry', 'Noooo, the bell!', 0.25);
      return;
    }
    if (this.trip(owner, 'speel')) {
      await Stage.item(owner, '🍌', 'Banana Peel', p, 'speel');
      const t = p.trav; for (let k = 0; k < 5; k++) { t.pos = (t.pos + 39) % 40; UI.refresh(); await sleep(120); }
      this.log(`🍌 ${this.name(p)} slips on ${this.name(owner)}'s Banana Peel and slides back 5 spaces!`, 'bad'); Sfx.whoosh(false);
      this.react(p, 'dizzy', 'WHOOOA—'); this.react(owner, 'laugh', 'Watch your step!', 0.3); this.crowd([p, owner], 'laugh', 0.6);
      return;
    }
    const star = owner.vault > 0, lock = this.guardOn(owner, 'slock') && !owner.shade;
    const segs = [{ icon: '🚨', text: '−5', color: '#ff4d6d' }, { icon: '💰', text: '+3', color: '#6fdc8c' }, { icon: '💰', text: '+4', color: '#5fb8ff' },
      { icon: '🚨', text: '−5', color: '#ff4d6d' }, { icon: '💰', text: '+5', color: '#ff9a3d' }, star ? { icon: lock ? '🔒' : '⭐', color: '#ffd34d' } : { icon: '💰', text: '+10', color: '#ffd34d' }];
    const d = [1, 3, 4, 2, 5, 6][await Stage.wheel(p, segs, `🦹 ${owner.el.hold}`)];
    if (d <= 2) {
      const n = Math.min(5, p.cash);
      await Stage.coinsTo(() => Stage.scr(Stage.tokPt(p)), () => Stage.scr(Render.homeCenter(owner.id)), Math.max(1, n), { lose: p.name, gain: owner.name });
      p.cash -= n; owner.cash += n;
      this.log(`🚨 Caught! ${this.name(p)} pays ${n} coins to ${this.name(owner)}.`, 'bad'); Sfx.bad();
      this.react(owner, 'laugh', 'Caught you!'); this.react(p, 'cry', 'Busted!!', 0.25); this.crowd([p, owner], ['laugh', 'shock'], 0.6);
    } else if (d <= 5) {
      const n = Math.min(d, owner.cash);
      await Stage.coinsTo(() => Stage.scr(Render.homeCenter(owner.id)), () => Stage.scr(Stage.tokPt(p)), Math.max(1, n), { lose: owner.name, gain: p.name });
      owner.cash -= n; p.cash += n;
      this.log(`💰 ${this.name(p)} grabs ${n} coins from ${this.name(owner)}!`, 'warn'); Render.coinBurst(p, Math.max(1, n)); Sfx.coin();
      this.react(p, 'evil', R.pick(['Hehehe, coins!', 'Easy pickings!'])); this.react(owner, 'angry', 'THIEF!', 0.25);
    } else if (owner.vault > 0 && this.trip(owner, 'slock')) {
      await Stage.item(owner, '🔒', 'Star Lock', p, 'slock');
      this.log(`🔒 ${this.name(owner)}'s Star Lock snaps shut — ${this.name(p)} leaves empty-handed!`, 'bad');
      this.react(owner, 'smug', 'Locked tight!'); this.react(p, 'angry', 'No fair!', 0.3);
    } else if (owner.vault > 0) {
      owner.vault--; p.vault++;
      this.log(`⭐ ${this.name(p)} steals a STAR from ${this.name(owner)}!`, 'warn'); Sfx.star();
      this.react(p, 'evil', 'A STAR! MWAHAHA!'); this.react(owner, 'cry', 'My star!!', 0.25); this.crowd([p, owner], 'shock', 0.6);
    } else {
      const n = Math.min(10, owner.cash); if (n) Stage.lossGain(() => Stage.scr(Render.homeCenter(owner.id)), () => Stage.scr(Stage.tokPt(p)), n, { lose: owner.name, gain: p.name }); owner.cash -= n; p.cash += n;
      this.log(`💰 No stars to take — ${this.name(p)} grabs ${n} coins instead!`, 'warn'); Render.coinBurst(p, Math.max(1, n)); Sfx.coin();
      this.react(p, 'evil'); this.react(owner, 'angry', undefined, 0.25);
    }
    await sleep(500);
  }

  async landSimple(p) {
    const t = p.trav, sp = this.board[t.pos];
    Render.landFx(t.pos);
    // landing on someone: POW! and grab one of their coins
    for (const q of this.players) {
      if (q === p || q.gone || q.trav.pos !== t.pos) continue;
      if (this.guardOn(q, 'sshield')) { await Stage.item(q, '🫧', 'Bubble Shield', null, 'sshield'); this.react(q, 'smug', 'Bounce! Nice try~'); this.react(p, 'angry', 'Pop that bubble!', 0.3); continue; }
      const got = q.cash > 0;
      await Stage.punch(p, q, got);
      if (got) { q.cash--; p.cash++; this.log(`👊 ${this.name(p)} bops ${this.name(q)} and grabs 1 coin!`); }
      this.react(p, 'evil', R.pick(['POW! Mine now!', 'Thanks for the coin!', 'Out of my way!'])); this.react(q, R.pick(['angry', 'cry']), R.pick(['OW!', 'Hey! That hurt!', 'My coin!']), 0.3);
      UI.refresh();
    }
    switch (sp) {
      case 'blue': await Stage.space(p, t.pos, 'blue', 3); p.cash += 3; this.fx(p, '+3', '#7fb0ff'); Sfx.coin(); this.emote(p, '😊'); this.log(`${this.name(p)} lands on blue: +3 coins.`); break;
      case 'red': if (this.guardOn(p, 'sshield')) { this.log(`🫧 ${this.name(p)}'s Bubble Shield laughs off the red space.`); this.react(p, 'smug', 'Bubble power~'); Sfx.item('sshield'); break; } { const l = Math.min(3, p.cash); await Stage.space(p, t.pos, 'red', l); p.cash -= l; this.fx(p, `−${l}`, '#ff6b6b'); Sfx.bad(); this.emote(p, '😖'); this.log(`${this.name(p)} lands on red: −${l} coins.`); break; }
      case 'lucky': {
        const v = await this.coinWheel(p, '🎡 Lucky Wheel');
        p.cash += v; this.fx(p, `+${v}`, '#5fe3b0'); Sfx.coin(); Render.coinBurst(p, Math.min(8, v));
        this.log(`${this.name(p)} spins the Lucky Wheel: +${v} coins.`);
        if (v === 10) this.react(p, 'starry', 'JACKPOT!'); else this.emote(p, v >= 5 ? '😄' : '🙂');
        break;
      }
      case 'item': await this.giveItem(p, await this.itemWheel(p, '🎁 Gift')); this.emote(p, '🎁'); break;
      case 'summon': await this.resolveSpace(p, 'summon'); break;
      case 'swirl': {
        const others = this.players.filter(o => o !== p && !o.gone);
        const q = others[await Stage.wheel(p, others.map(o => ({ icon: o.el.glyph, text: o.name.slice(0, 8), color: o.color })), '🌪️ Whirlwind')];
        const a = t.pos; t.pos = q.trav.pos; q.trav.pos = a;
        this.log(`🌪️ Whirlwind! ${this.name(p)} swaps places with ${this.name(q)}.`, 'warn');
        Render.burstAt(Render.trackPos(a), ['#5fc8e8', '#fff'], 24, { speed: 260 }); Sfx.boom();
        this.react(p, 'shock', 'Wheeee!'); this.react(q, 'shock', 'Whoa, where am I?!', 0.3); this.crowd([p, q], 'laugh', 0.6);
        break;
      }
      case 'party':
        await Stage.space(p, t.pos, 'party', 6);
        this.players.forEach(q => { q.cash += q === p ? 6 : 3; Render.coinBurst(q, 3); });
        this.log(`🎉 Party! Everyone gets 3 coins — ${this.name(p)} gets 6!`, 'good'); Sfx.win();
        this.players.forEach((q, k) => this.react(q, q === p ? 'starry' : 'laugh', q === p ? 'PARTY TIME!' : R.pick(['Woohoo!', 'Yay!', 'Party!']), k * 0.15));
        break;
      case 'gate': {
        const owner = this.players.find(o => o.gate === t.pos);
        if (owner === p) { await Stage.space(p, t.pos, 'home', 3); p.cash += 3; this.fx(p, '🏠 +3', '#ffe680'); this.emote(p, '🏠'); this.log(`${this.name(p)} lands at home: +3 coins.`); }
        break;
      }
    }
    this.ankarContact(p); // the Ankar takes 5 coins from anyone who lands on it
    UI.refresh();
  }

  // ---- shop: one star (20) and one item per visit
  async shopSimple(p) {
    const offers = R.shuffle(SIMPLE_ITEMS.filter(it => !(it.id === 'sshade' && (p.shade || p.items.includes('sshade'))))).slice(0, 2);
    const wares = [{ icon: '⭐', name: 'Star', price: SIMPLE_STAR_PRICE, star: true, state: p.cash >= SIMPLE_STAR_PRICE ? 'ok' : 'no' }]
      .concat(offers.map(it => ({ icon: it.icon, name: it.name, price: it.price, state: p.cash >= it.price ? 'ok' : 'no' })));
    Stage.openShop(p, wares);
    try { await this.shopSimpleInner(p, offers, wares); } finally { Stage.closeShop(); }
  }
  async shopSimpleInner(p, offers, wares) {
    await Stage.wait(500);
    if (p.cash >= SIMPLE_STAR_PRICE) {
      const yes = await this.choose(p, { title: '🏛️ Counting House', text: '', options: [
        { label: `⭐ Yes! Buy a star (${SIMPLE_STAR_PRICE})`, value: true }, { label: 'Not now', value: false }] }, () => true);
      if (yes) {
        await Stage.buy(0);
        p.cash -= SIMPLE_STAR_PRICE; p.vault++;
        this.log(`⭐ ${this.name(p)} buys a star!`, 'good'); Sfx.star(); Sfx.crowd('cheer'); this.fx(p, '+1⭐', '#ffe680');
        this.react(p, 'starry'); this.react(R.pick(this.players.filter(q => q !== p)), R.pick(['sad', 'angry']), R.pick(['Show-off…', 'Hmph!']), 0.4);
        UI.refresh();
      }
    }
    wares.forEach(w => { if (w.state !== 'sold' && w.state !== 'gone') w.state = p.cash >= w.price ? 'ok' : 'no'; });
    if (p.items.length >= HAND_LIMIT || !offers.some(it => p.cash >= it.price)) { await Stage.wait(400); return; }
    const opts = offers.map(it => ({ label: `${it.icon} ${it.name} — ${it.price} coins`, value: it.id, disabled: p.cash < it.price, desc: it.desc }));
    opts.push({ label: 'No thanks', value: null });
    const v = await this.choose(p, { title: '🏛️ Counting House', text: '', options: opts },
      () => { const ok = offers.filter(it => p.cash - it.price >= SIMPLE_STAR_PRICE * 0.6); return ok.length && Math.random() < 0.6 ? R.pick(ok).id : null; });
    if (v) { await Stage.buy(1 + offers.findIndex(it => it.id === v)); p.cash -= ITEM[v].price; await this.giveItem(p, v, false); }
    else await Stage.wait(300);
  }
}
