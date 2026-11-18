'use strict';
// Bot decisions for the board game
const AI = {
  value(g, q) { return q.vault * 22 + g.bank(q) + q.cash; },
  leader(g, p, cands) {
    cands = (cands || g.players.filter(q => q !== p && !q.gone));
    return cands.slice().sort((a, b) => AI.value(g, b) - AI.value(g, a))[0];
  },

  chooseAction(g, p, options) {
    const t = p.trav;
    const has = key => options.find(o => !o.disabled && o.value.type === key);
    const item = id => options.find(o => o.item && o.value.id === id);
    const raiders = g.raidersIn(p);
    const raiding = g.isRaiding(p);
    const onBoard = t.loc === 'board' && !p.gone;
    const r = Math.random();

    // ---- items first (each consumed, so this terminates)
    const tryItems = [
      ['antidote', () => true],
      ['jailbreak', () => true],
      ['unicorn', () => raiders.some(x => g.hotCoins(x) + g.hotStars(x) + x.cash >= 5)],
      ['smoke', () => raiding && (g.hotCoins(p) >= 6 || g.hotStars(p) > 0)],
      ['heavy', () => raiding], ['armor', () => raiding], ['camo', () => raiding], ['ghost', () => raiding],
      ['recall', () => raiders.length > 0 && !raiding],
      ['deposit', () => g.hotCoins(p) >= 8 || g.carriedStars(p) > 0 || p.cash >= 18],
      ['bag', () => g.carriedStars(p) > 0 || p.cash >= 5],
      ['gold', () => true], ['itembag', () => p.items.length <= HAND_LIMIT], ['robin', () => true],
      ['chain', () => p.cash >= 6 && onBoard],
      ['supercursed', () => g.round >= 3],
      ['cursed', () => r < 0.5], ['snail', () => r < 0.5], ['ice', () => r < 0.4], ['reverse', () => r < 0.3],
      ['double', () => onBoard && r < 0.6], ['advantage', () => r < 0.6], ['custom', () => r < 0.5],
      ['thief', () => onBoard], ['itemthief', () => onBoard], ['starthief', () => onBoard],
      ['plunder', () => true],
      ['repel', () => g.ankar !== null && onBoard && ((t.pos - g.ankar + 40) % 40) < 12],
      ['leash', () => true],
      ['bounty', () => true],
      ['swap', () => g.players.some(q => q !== p && q.cash >= p.cash + 5)],
      ['shophop', () => g.afford(p, 20) && r < 0.6],
      ['warp', () => r < 0.15],
      ['mirror', () => r < 0.2],
      ['callankar', () => r < 0.15],
    ];
    for (const [id, cond] of tryItems) {
      const o = item(id);
      if (o && cond()) return o.value;
    }

    // ---- main action
    const fortify = has('fortify'), trav = has('trav'), def = has('def');
    if (raiders.length) {
      const ult = g.fortifyOptions(p).find(f => f.ult && f.ok);
      if (ult && fortify) return fortify.value;
      if (def) {
        const d = p.def.pos;
        const close = raiders.some(x => { const k = Math.abs(x.trav.pos - d); return Math.min(k, 16 - k) <= 6; });
        if (close && (!fortify || r < 0.6)) return def.value;
      }
      if (fortify && r < 0.7) return fortify.value;
      if (def && !trav) return def.value;
    }
    if (trav) {
      const traps = Object.keys(p.traps).length;
      if (fortify && g.round <= 3 && traps < 3 && g.bank(p) >= 8 && r < 0.35) return fortify.value;
      if (fortify && g.round > 3 && traps < 2 && g.bank(p) >= 14 && r < 0.2) return fortify.value;
      return trav.value;
    }
    if (fortify && g.bank(p) >= 6) return fortify.value;
    if (def) return def.value;
    const any = options.find(o => !o.disabled);
    return any ? any.value : { type: 'pass' };
  },

  fortifyPick(g, p, list) {
    const ok = list.filter(f => f.ok).map(f => f.id);
    if (!ok.length) return null;
    const ult = list.find(f => f.ult && f.ok);
    if (ult) return ult.id;
    const raiders = g.raidersIn(p);
    const pref = raiders.length
      ? ['prison', 'dog', 'poison', 'atm', 'alarm', 'banana']
      : (g.secondHalf() && p.vault >= 2 ? ['vaultprot', 'fakestar', 'grace', 'prison', 'dog', 'lp3', 'atm', 'fakecoin']
        : ['prison', 'dog', 'lp2', 'atm', 'fakecoin', 'poison', 'mimic', 'banana', 'lp1']);
    for (const id of pref) if (ok.includes(id) && (id !== 'vaultprot' || p.vaultProt === 0)) return id;
    return R.pick(ok);
  },

  trapTile(g, p) {
    const free = g.freeTrapTiles(p);
    const raiders = g.raidersIn(p);
    if (raiders.length) {
      const pos = raiders[0].trav.pos;
      const ahead = []; for (let k = 1; k <= 6; k++) { const tl = ((pos - 1 + k) % 16) + 1; if (free.includes(tl)) ahead.push(tl); }
      if (ahead.length) return R.pick(ahead);
    }
    const early = free.filter(k => k <= 7);
    return early.length ? R.pick(early) : R.pick(free);
  },
  lootTileFor(g, p) {
    return p.piles.slice().sort((a, b) => (b.real - b.prot * 2) - (a.real - a.prot * 2))[0].tile;
  },
  hoardTile(valid, chosen) {
    const spread = [3, 6, 11, 14].filter(k => valid.includes(k));
    if (spread.length && Math.random() < 0.6) return R.pick(spread);
    return R.pick(valid);
  },

  wantDeposit(g, p) {
    if (g.hotCoins(p) + g.carriedStars(p) > 0) return true;
    const t = p.trav;
    if (t.loc === 'board' && p.cash >= 4 && p.cash <= 10) {
      for (let k = 1; k <= 6; k++) if (g.board[(t.pos + k) % 40] === 'doubler') return false;
    }
    return true;
  },
  ownGate(g, p) { return g.raidersIn(p).length ? 'enter' : 'dep'; },
  wantRaid(g, p, owner) {
    if (g.hotCoins(p) >= 10 || g.hotStars(p) > 0) return false;
    const v = g.bank(owner) + owner.vault * 12;
    return v >= 10 && Math.random() < 0.8;
  },
  prison(g, p) {
    if (g.hasItem(p, 'jailbreak')) return 'break';
    if (p.trav.bail > 0 && p.trav.bail <= 10 && g.afford(p, p.trav.bail)) return 'bail';
    return 'wait';
  },
  bail(g, owner, raider) { return g.bank(raider) + raider.cash >= 10 ? 10 : 5; },
  discard(g, p, newId) {
    let idx = -1, low = ITEM[newId].price;
    p.items.forEach((x, i) => { if (ITEM[x].price < low) { low = ITEM[x].price; idx = i; } });
    return idx;
  },
  scoreBoardSpace(g, p, pos) {
    const sp = g.board[pos];
    switch (sp) {
      case 'bank': return g.afford(p, 20) ? 8 : 3;
      case 'blue': return 3; case 'lucky': return 3; case 'item': return 2;
      case 'doubler': return p.cash >= 6 ? 5 : 1;
      case 'red': return -3; case 'summon': return -1; case 'shutdown': return 0; case 'chameleon': return 1;
      case 'gate': { const o = g.players.find(q => q.gate === pos); return o === p ? 1 : (g.round >= 4 ? 3 : 0); }
    }
    return 0;
  },
  customRoll(g, p) {
    const t = p.trav;
    let best = 6, bs = -99;
    for (let k = 1; k <= 6; k++) {
      let s;
      if (t.loc === 'board') {
        s = AI.scoreBoardSpace(g, p, (t.pos + k) % 40);
        for (let j = 1; j < k; j++) if (g.board[(t.pos + j) % 40] === 'bank') s += 2;
        if (g.ankar === (t.pos + k) % 40) s -= 8;
      } else {
        const o = g.P(t.ring);
        const tl = ((t.pos - 1 + k) % 16) + 1;
        if (t.pos + k >= 16) s = g.hotCoins(p) + g.hotStars(p) > 0 ? 4 : 0;
        else {
          const pile = g.lootTile(o, tl);
          s = pile ? Math.min(5, pile.real) : (tl === 8 ? o.vault * 3 : 0);
          if (o.traps[tl]) s -= 5;
          if (g.wardensAt(o, tl).length) s -= 10;
        }
      }
      if (s > bs) { bs = s; best = k; }
    }
    return best;
  },
  wardenDir(g, p, cw, ccw) {
    const rs = g.raidersIn(p);
    if (rs.some(r => r.trav.pos === cw)) return 1;
    if (rs.some(r => r.trav.pos === ccw)) return -1;
    if (rs.length) {
      const d = (a, b) => { const k = Math.abs(a - b); return Math.min(k, 16 - k); };
      const dc = Math.min(...rs.map(r => d(r.trav.pos, cw))), dcc = Math.min(...rs.map(r => d(r.trav.pos, ccw)));
      return dc <= dcc ? 1 : -1;
    }
    const d8 = x => Math.abs(x - 6);
    return d8(cw) <= d8(ccw) ? 1 : -1;
  },
  pickRaider(g, p, rs) {
    return rs.slice().sort((a, b) => (g.hotCoins(b) + g.hotStars(b) * 15 + b.cash) - (g.hotCoins(a) + g.hotStars(a) * 15 + a.cash))[0].id;
  },
  itemTarget(g, p, id, cands) {
    if (!cands.length) return -1;
    if (id === 'swap') return cands.slice().sort((a, b) => b.cash - a.cash)[0].id;
    if (id === 'plunder') return cands.slice().sort((a, b) => b.items.length - a.items.length)[0].id;
    if (id === 'bounty') return cands.slice().sort((a, b) => (g.hotCoins(b) + g.hotStars(b) * 10) - (g.hotCoins(a) + g.hotStars(a) * 10))[0].id;
    if (id === 'mirror') return R.pick(cands).id;
    return AI.leader(g, p, cands).id;
  },
  leash(g, p) {
    let best = 6, bs = -99;
    for (let d = -6; d <= 6; d++) {
      if (!d) continue;
      const pos = (g.ankar + d + 40) % 40;
      let s = 0;
      for (const q of g.players) if (q.trav.loc === 'board' && q.trav.pos === pos && !q.gone) s += q === p ? -20 : 10 + q.vault;
      if (p.trav.loc === 'board') { const behind = (p.trav.pos - pos + 40) % 40; if (behind < 8) s -= 3; }
      if (s > bs) { bs = s; best = d; }
    }
    return best;
  },
  shop(g, p, opts, info) {
    const en = v => opts.find(o => o.value === v && !o.disabled);
    if (en('star')) return 'star';
    const money = p.cash + g.bank(p);
    const ult = ITEM[p.el.ult];
    if (en('ult') && g.round >= 5 && money >= ult.price + 4 && (g.raidersIn(p).length || Math.random() < 0.45)) return 'ult';
    if (p.items.length >= HAND_LIMIT) return 'done';
    const good = ['heavy', 'armor', 'custom', 'double', 'camo', 'deposit', 'gold', 'advantage', 'unicorn', 'pouch', 'starsale', 'biscuit'];
    for (let i = 0; i < info.offers.length; i++) {
      const o = en('i' + i);
      if (!o) continue;
      const id = info.offers[i];
      const pr = info.half ? Math.ceil(ITEM[id].price / 2) : ITEM[id].price;
      if (money - pr >= 18 && (good.includes(id) || Math.random() < 0.35)) return 'i' + i;
    }
    return 'done';
  },
};
