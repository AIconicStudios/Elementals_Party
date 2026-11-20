'use strict';
// DOM side panel, prompts, menus
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const UI = {
  game: null,
  pending: null,
  init() {
    window.addEventListener('keydown', e => {
      if (!$('#mgLayer').classList.contains('hidden')) return;
      if ((e.code === 'Space' || e.code === 'Enter') && Render.stopper) { e.preventDefault(); Render.stopper.onStop(); return; }
      if ((e.code === 'Space' || e.code === 'Enter') && Render.die && Render.die.onStop) { e.preventDefault(); Render.die.onStop(); return; }
      if (e.code === 'KeyM' && this.game && document.activeElement.tagName !== 'INPUT') { this.toggleMap(); return; }
      if (e.code === 'KeyH' && document.activeElement.tagName !== 'INPUT') { this.toggleHelp(); return; }
      if (e.code === 'KeyV' && this.game && document.activeElement.tagName !== 'INPUT') { Render.toggleZoom(); return; }
      if (e.code === 'Escape') { if (this.helpOpen()) this.toggleHelp(false); else if (Render.mapMode) this.toggleMap(false); else if (this.game) this.togglePause(); return; }
      if (this.pauseOpen()) return;
      if (!this.pending || this.helpOpen()) return;
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= 9) {
        const btns = [...document.querySelectorAll('#actOpts button:not([disabled])')];
        if (btns[n - 1]) btns[n - 1].click();
      }
    });
    const fit = () => {
      const s = Math.min(window.innerWidth / 1600, window.innerHeight / 900);
      $('#app').style.transform = `translate(-50%,-50%) scale(${s})`;
    };
    window.addEventListener('resize', fit); fit();
  },

  log(msg, cls) {
    if (Settings.test) return;
    const el = $('#log');
    const d = document.createElement('div');
    d.className = 'ln ' + (cls || '');
    d.innerHTML = msg;
    el.appendChild(d);
    while (el.children.length > 220) el.removeChild(el.firstChild);
    el.scrollTop = el.scrollHeight;
  },

  refresh() {
    const G = this.game; if (!G || Settings.test) return;
    const ranks = G.standings().map(x => x.p);
    const rp = document.getElementById('roundPill'); if (rp) { const T = G.round && G.tod ? TOD[G.tod()] : null; rp.textContent = G.round ? `Round ${G.round} / ${G.rounds}${T ? ` · ${T.icon} ${T.name}` : ''}` : 'Setup'; rp.title = T ? `${T.name}: ${T.rule}` : ''; }
    G.players.forEach(p => {
      const t = p.trav;
      const st = [];
      if (t.armor) st.push(t.armor === 'heavy' ? `🛡️Ironplate(${t.armorLeft})` : '🥋Mantle');
      if (t.camo) st.push('🫥Veil'); if (t.poison) st.push('☠️Poison'); if (t.prison) st.push(`⛓️Prison ${t.prison}`);
      if (t.frozen) st.push(`🧊${t.frozen}`); if (t.ghost) st.push(`👻${t.ghost}`); if (t.chain) st.push(`⛓Chain ${t.chain}`);
      if (t.repel) st.push(`🧿${t.repel}`); if (t.thief) st.push('🦹Thief'); if (t.bounty) st.push('📃Bounty');
      if (t.bag) st.push(`👜${t.bag.c}c/${t.bag.s}⭐`); if (p.ultHeld) st.push(`${ITEM[p.el.ult].icon}${ITEM[p.el.ult].lore}`);
      if (p.vaultProt) st.push(`🔏${p.vaultProt}`); if (p.fakeStars) st.push(`✴️×${p.fakeStars}`);
      if (p.gone) st.push('💀No Wayfarer'); else if (!p.def && !G.simple) st.push('No Warden');
      const loc = p.gone ? '—' : t.loc === 'board' ? `On the Crossing: ${SPACE[G.board[t.pos]].lore}` : (t.ring === p.id ? `Guarding own Hold, tile ${t.pos}` : `⚔️ Raiding ${G.P(t.ring).el.hold}, tile ${t.pos}`);
      const guardsOn = G.simple ? (p.shade ? '<span class="it" title="Shade: guards and items are hidden">🌫️</span><span class="dim">hidden</span>' : (p.guards || []).map(gd => `<span class="it inst" title="Installed: ${esc(ITEM[gd.id].name)}">🛠️${ITEM[gd.id].icon}</span>`).join('')) : '';
      const items = p.shade && G.simple ? guardsOn : guardsOn + p.items.map(id => `<span class="it" title="${esc(itemLabel(id) + ': ' + ITEM[id].desc)}">${ITEM[id].icon}</span>`).join('') || '<span class="dim">no items</span>';
      const el = $('#pc' + p.id);
      el.className = 'pc' + (G.current === p ? ' cur' : '');
      el.style.setProperty('--c', p.color);
      const rank = ranks.indexOf(p) + 1, ord = ['1st', '2nd', '3rd', '4th'][rank - 1];
      const sig = `${p.vault}|${p.cash}|${G.simple ? 0 : G.bank(p)}`, bump = el.dataset.sig !== undefined && el.dataset.sig !== sig; el.dataset.sig = sig;
      el.innerHTML = `<canvas class="pport" width="84" height="84" data-pid="${p.id}"></canvas><div class="pch"><span class="gl">${p.el.glyph}</span><b>${esc(p.name)}</b><span class="tag">${p.human ? 'Human' : 'Bot'}</span><span class="torder" title="Turn order: plays #${G.order.indexOf(p.id) + 1} this round">🎲#${G.order.indexOf(p.id) + 1}</span><span class="rank" title="Overall standing">🏅${ord}</span></div>
        <div class="pcs">${G.simple ? `<span title="Stars">⭐ <b>${p.vault}</b></span><span title="Coins">🪙 <b>${p.cash}</b></span>` : `<span title="Banked stars">⭐ <b>${p.vault}</b></span><span title="Banked coins">🏦 <b>${G.bank(p)}</b></span><span title="Coins on hand">💰 <b>${p.cash}</b></span>${G.hotCoins(p) + G.hotStars(p) ? `<span title="Hot loot">🔥 ${G.hotCoins(p)}c ${G.hotStars(p)}⭐</span>` : ''}`}<span title="Moot wins">🏆 ${p.mgWins}</span></div>
        <div class="pcb"><span class="pci">${items}</span>${st.length ? `<span class="pct">${st.join(' · ')}</span>` : ''}</div>`;
      if (bump) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
    });
  },

  note(text) { if (!Settings.test) $('#actText').textContent = text; },

  waitDieStop(p, canBack) {
    this.askPlayer = p.id;
    return new Promise(resolve => {
      const box = $('#action'); box.style.setProperty('--c', p.color);
      $('#actTitle').innerHTML = `${p.el.glyph} ${esc(p.name)} — roll!`;
      $('#actText').textContent = '';
      const opts = $('#actOpts'); opts.innerHTML = '';
      const b = document.createElement('button'); b.className = 'rollBtn'; b.innerHTML = '🎲 STOP THE DIE!';
      opts.appendChild(b);
      const done = () => { this.askPlayer = null; if (!Render.die) return resolve(); Render.die.onStop = null; Render.die.waiting = false; this.pending = null; opts.innerHTML = ''; $('#actTitle').innerHTML = `${p.el.glyph} ${esc(p.name)}`; $('#actText').textContent = ''; resolve(); };
      b.onclick = done;
      // changed your mind? go back to the turn menu before the die is stopped
      if (canBack) {
        const bk = document.createElement('button'); bk.innerHTML = '← Back (choose again)'; bk.dataset.back = '1'; opts.appendChild(bk);
        bk.onclick = () => { this.askPlayer = null; if (Render.die) { Render.die.onStop = null; Render.die.waiting = false; } this.pending = null; opts.innerHTML = ''; resolve('back'); };
      }
      Render.die.onStop = done; Render.die.waiting = true;
      this.pending = done;
    });
  },

  // a circular wipe between the board and the minigames
  wipe(cover, title = '') {
    if (Settings.test) return Promise.resolve();
    const w = $('#wipe'); w.querySelector('.wt').textContent = title;
    w.classList.toggle('on', cover);
    if (cover) Sfx.whoosh(true);
    return new Promise(r => setTimeout(r, cover ? 650 : 50));
  },
  // generic "stop it!" prompt (fortune wheels): click, Space/Enter or the player's gamepad A
  waitStop(p, label) {
    this.askPlayer = p.id;
    return new Promise(resolve => {
      $('#action').style.setProperty('--c', p.color);
      $('#actTitle').innerHTML = `${p.el.glyph} ${esc(p.name)}`; $('#actText').textContent = '';
      const opts = $('#actOpts'); opts.innerHTML = '';
      const b = document.createElement('button'); b.className = 'rollBtn'; b.innerHTML = esc(label); opts.appendChild(b);
      const done = () => { this.askPlayer = null; Render.stopper = null; this.pending = null; opts.innerHTML = ''; Sfx.click(); resolve(); };
      b.onclick = done; Render.stopper = { who: p.id, onStop: done }; this.pending = done;
    });
  },

  turnStart(p) {
    if (Settings.test) return;
    $('#action').style.setProperty('--c', p.color);
    $('#actTitle').textContent = `${p.el.glyph} ${p.name}'s turn${p.human ? '' : ' (bot)'}`;
    $('#actText').textContent = '';
    $('#actOpts').innerHTML = '';
  },

  ask(p, spec) {
    this.askPlayer = p.id;
    return new Promise(resolve => {
      const box = $('#action');
      box.style.setProperty('--c', p.color);
      $('#actTitle').innerHTML = `${p.el.glyph} ${esc(spec.title)}`;
      $('#actText').innerHTML = spec.text ? esc(spec.text) : '';
      const opts = $('#actOpts'); opts.innerHTML = '';
      let n = 0;
      const tiles = [];
      const done = v => {
        this.askPlayer = null;
        this.pending = null; Render.highlight = null;
        opts.innerHTML = ''; Sfx.click(); resolve(v);
      };
      spec.options.forEach(o => {
        const b = document.createElement('button');
        if (!o.disabled) n++;
        b.innerHTML = `${o.disabled ? '' : `<span class="k">${n <= 9 ? n : ''}</span>`}${esc(o.label)}`; if (o.desc) b.title = o.desc;
        b.disabled = !!o.disabled;
        if (o.item) b.classList.add('itemBtn');
        if (o.back || /^(←\s*)?(Cancel|Back)\b/.test(o.label)) b.dataset.back = '1'; // the gamepad's B picks this
        b.onclick = () => done(o.value);
        opts.appendChild(b);
        if (o.tile) tiles.push(o.tile);
      });
      if (spec.wardenOf !== undefined && tiles.length) {
        Render.highlight = { owner: this.game.P(spec.wardenOf), tiles, onPick: tl => { const o = spec.options.find(x => x.tile === tl); if (o) done(o.value); } };
      }
      this.pending = done;
    });
  },

  pickTile(p, owner, tiles, title) {
    this.askPlayer = p.id;
    return new Promise(resolve => {
      const done = v => { this.askPlayer = null; this.pending = null; Render.highlight = null; $('#actOpts').innerHTML = ''; Sfx.click(); resolve(v); };
      Render.highlight = { owner, tiles, onPick: done };
      $('#actTitle').innerHTML = `${p.el.glyph} ${esc(title)}`;
      $('#actText').innerHTML = '';
      const opts = $('#actOpts'); opts.innerHTML = '';
      const row = document.createElement('div'); row.className = 'tileRow';
      tiles.forEach(k => { const b = document.createElement('button'); b.textContent = k; b.onclick = () => done(k); row.appendChild(b); });
      opts.appendChild(row);
      this.pending = done;
    });
  },

  banner(text, sub) {
    if (Settings.test) return Promise.resolve();
    const b = $('#banner');
    b.innerHTML = `<div>${esc(text)}</div>${sub ? `<small>${esc(sub)}</small>` : ''}`;
    b.classList.remove('show'); void b.offsetWidth; b.classList.add('show');
    return sleep(1300);
  },

  // ---------------------------------------------------------- map & help
  toggleMap(on) {
    if (!this.game) return;
    if (this.game.simple && on !== false) { this.log('The map shows traps — the Starter board has none. Try the full board later!'); return; }
    Render.mapMode = on === undefined ? !Render.mapMode : on;
    $('#app').classList.toggle('mapmode', Render.mapMode);
    Sfx.click();
  },
  // board pause menu (any gamepad's Start, or Esc): resume, help, or quit to the main menu
  pauseOpen() { return !$('#boardPause').classList.contains('hidden'); },
  togglePause(on) {
    const open = on === undefined ? !this.pauseOpen() : on;
    if (open && !this.game) return;
    $('#boardPause').classList.toggle('hidden', !open);
    Settings.paused = open;
    if (open) { Nav.active = true; Nav.sel = $('#bpResume'); Nav.paint(); }
    Sfx.click();
  },
  helpOpen() { return !$('#helpOv').classList.contains('hidden'); },
  toggleHelp(on, tab) {
    const open = on === undefined ? !this.helpOpen() : on;
    $('#helpOv').classList.toggle('hidden', !open);
    if (open) this.renderHelp(tab || this.helpTab || 'spaces');
    Sfx.click();
  },
  renderHelp(tab) {
    this.helpTab = tab;
    const tabs = [['starter', '🌱 Starter board'], ['spaces', '🎲 Board spaces'], ['hold', '🏰 Your Hold'], ['items', '🎒 Items'], ['rules', '📖 Rules'], ['controls', '🎮 Controls']];
    const row = (sw, title, meta, text, col) => `<div class="hrow" style="--c:${col || '#6b5bd6'}">${sw}<div><b>${title}</b>${meta ? `<span class="meta">${meta}</span>` : ''}<p>${text}</p></div></div>`;
    const swatch = (bg, txt, fg = '#111') => `<div class="hsw" style="background:${bg};color:${fg}">${txt}</div>`;
    let body = '', one = false;
    if (tab === 'starter') {
      const sw2 = (k, fg = '#111') => swatch(SPACE[k].color, SPACE[k].icon, fg);
      body = `<div class="hsec">The Starter Crossing — the easy board for new players</div>`
        + row(swatch('#ffd34d', '⭐'), 'Goal', '', 'Have the most stars at the end. Buy stars for 15 coins at a Counting House 🏛️. If stars are tied, most coins wins.', '#ffd34d')
        + row(swatch('#6b5bd6', '🎲', '#fff'), 'Your turn', '', 'Use an item if you like, then press Roll! Your piece walks forward. That’s it!', '#6b5bd6')
        + row(swatch(SPACE.blue.color, '+3', '#fff'), 'Blue space', '', '+3 coins.', SPACE.blue.color)
        + row(sw2('red', '#fff'), 'Red space', '', '−3 coins.', SPACE.red.color)
        + row(sw2('bank'), 'Counting House', '', 'Pass or land here to buy a star (15 coins) and one item.', SPACE.bank.color)
        + row(sw2('lucky'), 'Lucky Wheel', '', 'Win 1, 3, 5 or 10 coins.', SPACE.lucky.color)
        + row(sw2('item'), 'Gift', '', 'Get a free item.', SPACE.item.color)
        + row(sw2('swirl'), 'Whirlwind', '', 'Swap places with a random player!', SPACE.swirl.color)
        + row(sw2('summon'), "Ankar's Altar", '', 'Sets the Ankar loose! The altar turns blue, and each round the Ankar creeps toward the nearest player — whoever it meets loses 5 coins.', SPACE.summon.color)
        + row(sw2('party'), 'Party', '', 'Everyone gets 3 coins — you get 6!', SPACE.party.color)
        + row(swatch('#8fe0ff', '🏠'), 'Your Gate', '', 'Passing your own Gate gives +3 coins.', '#8fe0ff')
        + row(swatch('#ff9a3d', '🦹'), 'Sneaking in', '', 'From round 3, passing a rival’s Gate lets you sneak into their Hold. Spin the raid wheel: caught = you pay 5 · or grab 3, 4 or 5 coins · or grab a STAR! Guard Dog, Banana Peel and Star Lock protect a Hold.', '#ff9a3d')
        + `<div class="hsec">Starter items</div>`
        + SIMPLE_ITEMS.map(it => row(swatch('#2a2150', it.icon, '#fff'), it.name, `${it.price} coins · ${it.use === 'play' ? 'use on your turn' : 'works by itself'}`, it.desc, '#6b5bd6')).join('')
        + `<div class="hsec">After every round</div>` + row(swatch('#5a3fd0', '🎮', '#fff'), 'The Moot', '', 'Everyone plays a quick minigame. Winners get coins and go first next round.', '#5a3fd0');
    } else if (tab === 'spaces') {
      body = Object.keys(SPACE).map(k => {
        const sp = SPACE[k];
        const fg = ['blue', 'red', 'doubler', 'shutdown', 'summon'].includes(k) ? '#fff' : '#111';
        return row(swatch(sp.color, sp.icon, fg), `${sp.lore}`, `(${sp.name})`, sp.desc, sp.color);
      }).join('') + row(swatch('#3a1a5c', '👁️', '#fff'), 'The Ankar', '(the Tithe-Taker)', 'Once summoned it follows the nearest Wayfarer up to 3 spaces at the end of each round. If it lands on you, or you land on it, it takes 5 coins (cash first, then bank). Ankar Repellent and the Decoy Star protect you.', '#b46bff')
        + row(swatch('#555', '🌑', '#fff'), 'Closed space', '(Eclipse)', 'A darkened Waygate or Counting House cannot be used until it reopens. A Master Key lets you through once.', '#888');
    } else if (tab === 'hold') {
      body = [
        row(swatch('#8fe0ff', '🌀'), 'Waygate (tile 16)', '', 'The way in and out. A raider enters here and leaves by passing it again, coming out on this Hold’s Waygate on the Crossing.', '#8fe0ff'),
        row(swatch('#6b5512', '⭐', '#fff'), 'Starvault (tile 8)', '', 'Your banked stars live here. A raider landing on it tries to steal one. A Warding Seal blocks this; Paste Stars make the raider draw a fake.', '#ffd34d'),
        row(swatch('#8a6a12', '🪙', '#fff'), 'Hoards (4 tiles you choose)', '', 'Your banked coins are spread over these. A raider landing on one takes up to 5 coins (less with Hoardwards). The number shown includes fake coins.', '#e8b923'),
        row(swatch('#5a1020', '⚠️', '#fff'), 'Trap tiles', '', 'The other tiles can hold one trap each, placed with a Fortify turn. Traps trigger only when a raider lands exactly on them, then vanish. Press M (or gamepad Y) to see every Hold’s traps.', '#ff6b6b'),
        row(`<div class="hsw" style="background:#c9ced6">🛡️</div>`, 'Warden', '(Defender)', 'Guards your Hold. If the Warden and a raider end on the same tile — whoever moved — the raider is caught: loot goes back and the raider is sent home.', '#c9ced6'),
        row(swatch('#ff9a3d', '🔥', '#fff'), 'Hot loot', '', 'Anything a raider takes is hot until banked at a Counting House or their own Waygate. It is lost if they are caught.', '#ff9a3d'),
      ].join('');
    } else if (tab === 'items') {
      const cats = [['defense', 'Home defenses — placed with a Fortify turn, paid from your bank'], ['ultimate', 'Element ultimates — buy once at a Counting House, unleash with Fortify'], ['raider', 'Raider & worker items'], ['dice', 'Dice & movement'], ['money', 'Money & shop'], ['chaos', 'Chaos & social']];
      body = cats.map(([c, title]) => `<div class="hsec">${title}</div>` + ITEMS.filter(it => it.cat === c).map(it => {
        const meta = `${it.price}🪙 · ${RARITY[it.r]}${it.r === 'R' || it.r === 'L' ? ' (2nd half)' : ''}${it.use ? ' · ' + (it.use === 'play' ? 'play on your turn' : 'works automatically') : ''}${it.el !== undefined ? ' · ' + ELEMENTS[it.el].name + ' only' : ''}`;
        return row(swatch('#2a2150', it.icon, '#fff'), `${it.lore}${it.lore !== it.name ? ` <span style="color:#a99bd8;font-weight:normal">(${it.name})</span>` : ''}`, meta, it.desc, '#6b5bd6');
      }).join('')).join('');
    } else if (tab === 'rules') {
      one = true;
      body = `<div class="rtext">
      <p><b>Goal:</b> hold the most banked stars after the final round. Ties: banked coins, then Moot wins.</p>
      <p><b>Your turn:</b> play any items (free), then choose one: move your Wayfarer (+3 coin wage), move your Warden either way around your Hold, or Fortify (buy and place a defense from your bank).</p>
      <p><b>Rolling:</b> the die tumbles until you stop it — click it, press Space, or press A on a gamepad.</p>
      <p><b>Counting Houses:</b> passing or landing lets you deposit what you carry, buy one star and one item per visit.</p>
      <p><b>Raiding (from round 4):</b> when you pass or land on a rival’s Waygate you may raid. The rest of your roll is discarded; next turn you start walking their Hold from tile 16. Hoards give up to 5 coins, the Starvault a star. Leave by passing tile 16 again.</p>
      <p><b>The Ankar:</b> summoned on an Ankar’s Altar (which then becomes a Boon or Bane). It follows the nearest Wayfarer and takes 5 coins on contact.</p>
      <p><b>Time of day:</b> the sky moves from morning to night over a game, with one small rule each: ${Object.values(TOD).map(T => `${T.icon} <b>${T.name}</b> — ${T.rule}`).join(' ')}</p>
      <p><b>The Moot:</b> after each round but the last, a minigame. The halfway Moot is always a <b>Marathon</b> (several events back to back: The Elemental Games, Titan Trials, Turbo Stunt Rally or Tower of Trials), and the last Moot of every game is the <b>Grand Finale brawl</b> in one of four arenas — Fourfold Clash, Temple of Traps, Ledge Cage or Sand Colosseum — where A jumps and B is your clan power (hit an arena's switches to spring traps on your rivals). 1st place wins 3 coins, 2nd 2 coins, 3rd 1 coin (ties share the better place) — in the 🪙 coin Moots you keep every coin you collect instead (max 20). Next round's turn order follows the result: 1st plays first, then 2nd, 3rd and 4th (the 🎲# badge on each card shows it). The player with the fewest stars picks between two games.</p>
      </div>`;
    } else {
      one = true;
      body = `<div class="rtext">
      <p><b>Board (mouse):</b> click the options in the middle panel, click highlighted tiles to place things, or press 1–9.</p>
      <p><b>Board (keyboard):</b> arrow keys move the highlight, Enter selects, Space stops the die, M opens the map, H opens help, V switches between the whole board and the close-up view, Esc goes back.</p>
      <p><b>Board (gamepad):</b> d-pad / stick to move, A to select or stop the die, B to go back or close, Y for the map, X for help, LB or LT to switch between the whole board and the close-up view. Only the player whose turn or decision it is can answer with their own gamepad.</p>
      <p><b>Minigames:</b><br>${Input.keyNames.map((k, i) => `Player ${i + 1} (${ELEMENTS[i].name}): ${k}`).join('<br>')}<br><b>Gamepads:</b> each connected gamepad belongs to exactly one human player, in seat order (1st gamepad → 1st human seat, 2nd → 2nd human, …). A = action / select, B = back and secret-pick peek, X = help, Y = map, right stick = scroll help, map and long menus, Start = pause in minigames. Every minigame starts with a practice round that doesn't count and has no timer — everyone presses Start or Select on their gamepad when they're ready (keyboard: X, V, M or Backspace), and the real game begins. Start or Select also gets you past the intro card — no gameplay buttons needed. On the board, only the player whose decision it is can answer with their gamepad. Player 1 can also use the mouse in cursor games.</p>
      <p><b>Secret picks:</b> in bluffing games nobody’s cursor is shown. Hold your alt button (B) to peek at your own choice.</p>
      </div>`;
    }
    $('#helpOv').innerHTML = `<h2>❓ Help <small class="hpad">🎮 ◀ ▶ change page · ▲ ▼ scroll · Ⓑ close</small></h2><button class="hclose" data-back="1">✖ Close (B / Esc)</button>
      <div class="htabs">${tabs.map(([k, l]) => `<button data-tab="${k}" class="${k === tab ? 'on' : ''}">${l}</button>`).join('')}</div>
      <div class="hbody ${one ? 'one' : ''}">${body}</div>`;
    $('#helpOv').querySelectorAll('[data-tab]').forEach(b => { b.onclick = () => { this.renderHelp(b.dataset.tab); Nav.focusFirst('[data-tab="' + b.dataset.tab + '"]'); }; });
    $('#helpOv .hclose').onclick = () => this.toggleHelp(false);
  },

  // ---------------------------------------------------------- screens
  // the menu backdrop: four elemental auroras drifting around, light rays and each clan's particles
  menuBgParts: null,
  drawMenuBg(c, t) {
    const W = c.clientWidth, Hh = c.clientHeight; if (c.width !== W || c.height !== Hh) { c.width = W; c.height = Hh; }
    const g = c.getContext('2d');
    g.fillStyle = '#0d0820'; g.fillRect(0, 0, W, Hh);
    const blobs = [['143,224,255', 0.22, 0.25], ['79,141,255', 0.8, 0.22], ['255,106,61', 0.2, 0.8], ['124,207,74', 0.8, 0.8]];
    g.globalCompositeOperation = 'lighter';
    blobs.forEach(([rgb, bx, by], k) => {
      const x = W * (bx + 0.06 * Math.sin(t * 0.3 + k * 1.7)), y = Hh * (by + 0.06 * Math.cos(t * 0.25 + k)), r = Math.max(W, Hh) * (0.42 + 0.04 * Math.sin(t * 0.5 + k));
      const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${rgb},0.55)`); gr.addColorStop(0.5, `rgba(${rgb},0.2)`); gr.addColorStop(1, `rgba(${rgb},0)`);
      g.fillStyle = gr; g.fillRect(0, 0, W, Hh);
    });
    // slow light rays from the top
    g.save(); g.translate(W / 2, -Hh * 0.15); g.rotate(Math.sin(t * 0.1) * 0.1);
    for (let k = 0; k < 9; k++) { const a = -0.9 + k * 0.225; g.save(); g.rotate(a); const gr = g.createLinearGradient(0, 0, 0, Hh * 1.3); gr.addColorStop(0, `rgba(255,240,200,${0.07 + 0.04 * Math.sin(t + k)})`); gr.addColorStop(1, 'rgba(255,240,200,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(-14, 0); g.lineTo(14, 0); g.lineTo(90, Hh * 1.3); g.lineTo(-90, Hh * 1.3); g.fill(); g.restore(); }
    g.restore();
    g.globalCompositeOperation = 'source-over';
    // particles: air wisps, water bubbles, fire embers, earth leaves
    if (!this.menuBgParts) this.menuBgParts = Array.from({ length: 70 }, (_, k) => ({ k: k % 4, x: Math.random(), y: Math.random(), s: R.range(0.5, 1.4), p: Math.random() * 7 }));
    for (const q of this.menuBgParts) {
      const sp = 0.012 * q.s;
      if (q.k === 0) { q.x += sp * 0.03; q.y += Math.sin(t + q.p) * 0.0004; }
      else if (q.k === 1 || q.k === 2) q.y -= sp * (q.k === 2 ? 0.05 : 0.035);
      else { q.y += sp * 0.03; q.x += Math.sin(t * 1.3 + q.p) * 0.0006; }
      if (q.x > 1.05) q.x = -0.05; if (q.y < -0.05) q.y = 1.05; if (q.y > 1.05) q.y = -0.05;
      const x = q.x * W, y = q.y * Hh, r = 3 * q.s;
      if (q.k === 0) { g.strokeStyle = 'rgba(220,245,255,0.35)'; g.lineWidth = 2; g.beginPath(); g.arc(x, y, 14 * q.s, 0.2 + t % 6, 2.2 + t % 6); g.stroke(); }
      else if (q.k === 1) { g.strokeStyle = 'rgba(150,210,255,0.5)'; g.lineWidth = 1.5; g.beginPath(); g.arc(x, y, r * 1.6, 0, 7); g.stroke(); g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.arc(x - r * 0.5, y - r * 0.5, r * 0.4, 0, 7); g.fill(); }
      else if (q.k === 2) { const a = 0.5 + 0.5 * Math.sin(t * 6 + q.p); g.fillStyle = `rgba(255,${150 + a * 80},70,${0.4 + a * 0.4})`; g.beginPath(); g.arc(x, y, r * 0.8, 0, 7); g.fill(); }
      else { g.save(); g.translate(x, y); g.rotate(t + q.p); g.fillStyle = 'rgba(140,210,90,0.55)'; g.beginPath(); g.ellipse(0, 0, r * 2, r, 0, 0, 7); g.fill(); g.restore(); }
    }
    for (let k = 0; k < 40; k++) { const x = (k * 197.3) % W, y = (k * 113.7) % Hh, a = 0.5 + 0.5 * Math.sin(t * 2 + k); g.fillStyle = `rgba(255,255,255,${0.15 + a * 0.35})`; g.fillRect(x, y, 2, 2); }
    const v = g.createRadialGradient(W / 2, Hh / 2, Hh * 0.3, W / 2, Hh / 2, Math.max(W, Hh) * 0.75); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.55)'); g.fillStyle = v; g.fillRect(0, 0, W, Hh);
  },
  // live, idling clan portraits on the menu seat cards
  menuPortraits() {
    const tick = () => {
      const cv = [0, 1, 2, 3].map(i => document.getElementById('mport' + i)), bg = document.getElementById('menuBg');
      if ((!cv[0] && !bg) || $('#overlay').classList.contains('hidden')) { this.menuRaf = null; return; }
      const t = performance.now() / 1000;
      if (bg) this.drawMenuBg(bg, t);
      if (cv[0]) cv.forEach((c, i) => {
        const g = c.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height); g.setTransform(1.4, 0, 0, 1.4, 0, 0);
        const hov = c.closest('.seat') && c.closest('.seat').matches(':hover');
        Char._wave = hov;
        Char.draw(g, 60, 52, 37, i, ELEMENTS[i].color, { mood: hov ? 'determined' : 'happy', t: t + i * 1.7, seed: i * 2.3, look: { x: -0.4, y: 0 } });
        Char._wave = false;
      });
      this.menuRaf = requestAnimationFrame(tick);
    };
    if (!this.menuRaf) this.menuRaf = requestAnimationFrame(tick);
  },
  showMenu() {
    Render.game = null;
    $('#overlay').classList.remove('hidden');
    const seats = JSON.parse(localStorageGet('ff_seats') || 'null') || [
      { name: 'Player 1', human: true }, { name: 'Bot Tide', human: false }, { name: 'Bot Ember', human: false }, { name: 'Bot Root', human: false }];
    $('#overlay').innerHTML = `<canvas id="menuBg"></canvas><div class="panel menu">
      <div class="crest">${['💨', '💧', '🔥', '🪨'].map((e, k) => `<span style="--c:${ELEMENTS[k].color};--d:${k * 0.4}s">${e}</span>`).join('')}</div>
      <h1>THE FOURFOLD</h1><p class="sub">Four Holds race to hold the most stars after the final bell — raiding each other along the way.</p>
      <div class="seats">${ELEMENTS.map((el, i) => `<div class="seat" style="--c:${el.color}">
        <canvas class="mport" id="mport${i}" width="168" height="168"></canvas><div><b class="mname">${el.mascot}</b><br><small>${el.hold} · ${el.name}</small></div>
        <input id="sn${i}" value="${esc(seats[i].name)}" maxlength="14">
        <select id="sh${i}"><option value="1" ${seats[i].human ? 'selected' : ''}>Human</option><option value="0" ${!seats[i].human ? 'selected' : ''}>Bot</option></select>
        <select id="sp${i}" title="Which gamepad plays this character">${[['auto', '🎮 Auto'], ['0', '🎮 Gamepad 1'], ['1', '🎮 Gamepad 2'], ['2', '🎮 Gamepad 3'], ['3', '🎮 Gamepad 4'], ['-1', '⌨️ Keyboard only']].map(([v, l]) => `<option value="${v}" ${String(seats[i].pad ?? 'auto') === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
        <small class="keys">Moot keys: ${Input.keyNames[i]} · <span id="kh${i}"></span></small></div>`).join('')}</div>
      <div class="row"><label>Board <select id="boardSel"><option value="simple">🌱 Starter Crossing — for beginners</option><option value="full">⚔️ The Crossing — full game</option></select></label>
      <label>Game length <select id="rounds"><option value="20">20 rounds</option><option value="15">15 rounds</option><option value="12">12 rounds</option><option value="10">10 rounds (quick)</option></select></label>
      <label>Animation <select id="speed"><option value="1">Normal</option><option value="0.5">Fast</option><option value="0.15">Very fast</option></select></label>
      <label><input type="checkbox" id="snd" ${Settings.sound ? 'checked' : ''}> Sound</label>
      <label><input type="checkbox" id="mus" ${Settings.music ? 'checked' : ''}> Music</label>
      <label><input type="checkbox" id="vox" ${Settings.voice !== false ? 'checked' : ''}> Voices</label></div>
      <div class="row btns"><button id="startBtn" class="big">▶ Start game</button><button id="practiceBtn">🎮 Moot practice (${MG.list.length} minigames)</button><button id="rulesBtn">❓ Help & how to play</button></div>
      <p class="hint">Board turns: mouse, keyboard (arrows + Enter) or any gamepad (A select · B back · X help · Y map · right stick scrolls · Start pauses). Minigames use the keys above or gamepads 1–4. Empty seats are bots.</p>
    </div>`;
    const readSeats = () => ELEMENTS.map((el, i) => ({ name: $('#sn' + i).value.trim() || el.name, human: $('#sh' + i).value === '1', pad: $('#sp' + i).value }));
    const padLabels = () => { const S = readSeats(); Input.setHumans(S); ELEMENTS.forEach((el, i) => { const n = Input.padNumberForSeat(i); $('#sp' + i).disabled = !S[i].human; $('#kh' + i).textContent = !S[i].human ? 'bot' : n ? `🎮 gamepad ${n}` : 'keyboard only'; }); };
    ELEMENTS.forEach((el, i) => { $('#sh' + i).addEventListener('change', padLabels); $('#sp' + i).addEventListener('change', () => { const v = $('#sp' + i).value; if (v !== 'auto' && v !== '-1') ELEMENTS.forEach((e2, j) => { if (j !== i && $('#sp' + j).value === v) $('#sp' + j).value = 'auto'; }); padLabels(); }); });
    padLabels();
    this.menuPortraits();
    const board0 = localStorageGet('ff_board') || 'full';
    $('#boardSel').value = board0; $('#rounds').value = board0 === 'simple' ? '12' : '20';
    $('#boardSel').onchange = () => { $('#rounds').value = $('#boardSel').value === 'simple' ? '12' : '20'; };
    $('#startBtn').onclick = () => {
      const s = readSeats(); localStorageSet('ff_seats', JSON.stringify(s)); localStorageSet('ff_board', $('#boardSel').value);
      Settings.speed = +$('#speed').value; Settings.sound = $('#snd').checked; Settings.music = $('#mus').checked;
      Sfx.init();
      $('#overlay').classList.add('hidden');
      startGame({ seats: s, rounds: +$('#rounds').value, simple: $('#boardSel').value === 'simple' });
    };
    $('#practiceBtn').onclick = () => { const s = readSeats(); localStorageSet('ff_seats', JSON.stringify(s)); Settings.sound = $('#snd').checked; Settings.music = $('#mus').checked; Sfx.init(); Music.refresh(); this.showPractice(s); };
    $('#mus').onchange = () => { Settings.music = $('#mus').checked; Music.refresh(); };
    $('#vox').onchange = () => { Settings.voice = $('#vox').checked; localStorageSet('ff_voice', Settings.voice ? '1' : '0'); if (Settings.voice) Voice.line(0, 'turn'); };
    { const sv = localStorageGet('ff_voice'); if (sv !== null && sv !== undefined) { Settings.voice = sv === '1'; $('#vox').checked = Settings.voice; } }
    $('#rulesBtn').onclick = () => this.toggleHelp(true, 'rules');
  },

  showPractice(seats) {
    $('#overlay').innerHTML = `<canvas id="menuBg"></canvas><div class="panel practice"><h2>Moot practice</h2><p class="sub">Play any of the ${MG.list.length} minigames — including the Grand Finale brawl and the four marathons. Seats set to Human use their keys; the rest are bots.</p>
      <div class="mglist grid">${MG.list.map((g, i) => `<button data-id="${g.id}" class="${g.finale ? 'finale' : g.long ? 'marathon' : ''}"><span class="thumb"><img alt="" data-thumb="${g.id}"${MG.thumbs[g.id] ? ` src="${MG.thumbs[g.id]}"` : ''}><i>${i + 1}</i>${g.finale ? '<span class="tag">FINALE</span>' : g.long ? '<span class="tag">MARATHON</span>' : ''}</span><b>${esc(g.name)}</b><small>${esc(g.type)} · ${esc(g.controls)}</small></button>`).join('')}</div>
      <div class="row btns"><button id="backBtn" data-back="1">← Back</button></div></div>`;
    $('#backBtn').onclick = () => this.showMenu();
    this.menuPortraits();
    // fill in the pictures a few at a time so the menu opens instantly
    const imgs = [...document.querySelectorAll('img[data-thumb]')].filter(im => !im.src);
    const step = () => { const t0 = performance.now(); while (imgs.length && performance.now() - t0 < 24) { const im = imgs.shift(); if (document.body.contains(im)) im.src = MG.thumb(im.dataset.thumb); } if (imgs.length) requestAnimationFrame(step); };
    requestAnimationFrame(step);
    document.querySelectorAll('.mglist button').forEach(b => b.onclick = async () => {
      $('#overlay').classList.add('hidden');
      Input.setHumans(seats);
      const pl = seats.map((s, i) => ({ id: i, name: s.name, color: ELEMENTS[i].color, human: s.human, el: ELEMENTS[i] }));
      await MG.run(b.dataset.id, pl, [0, 1, 2, 3]);
      $('#overlay').classList.remove('hidden');
      this.showPractice(seats);
    });
  },

  showResults(st, top) {
    return new Promise(resolve => {
      $('#overlay').classList.remove('hidden');
      $('#overlay').innerHTML = `<div class="panel results"><h1>Keeper of the Sky</h1>
        <p class="sub">${top.map(s => esc(s.p.name)).join(' & ')} ${top.length > 1 ? 'share the win' : 'wins'}!</p>
        <table><tr><th>#</th><th>Hold</th><th>Stars</th><th>Banked coins</th><th>Moot wins</th></tr>
        ${st.map((s, i) => `<tr style="color:${s.p.color}"><td>${i + 1}</td><td>${s.p.el.glyph} ${esc(s.p.name)}</td><td>⭐ ${s.stars}</td><td>${s.coins}</td><td>${s.wins}</td></tr>`).join('')}</table>
        <div class="row btns"><button id="menuBtn" class="big">Back to menu</button></div></div>`;
      $('#menuBtn').onclick = () => { resolve(); this.showMenu(); };
    });
  },
};

function localStorageGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function localStorageSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } }
