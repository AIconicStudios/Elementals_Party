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
      if ((e.code === 'Space' || e.code === 'Enter') && Render.die && Render.die.onStop) { e.preventDefault(); Render.die.onStop(); return; }
      if (e.code === 'KeyM' && this.game && document.activeElement.tagName !== 'INPUT') { this.toggleMap(); return; }
      if (e.code === 'KeyH' && document.activeElement.tagName !== 'INPUT') { this.toggleHelp(); return; }
      if (e.code === 'Escape') { if (this.helpOpen()) this.toggleHelp(false); else if (Render.mapMode) this.toggleMap(false); return; }
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
    G.players.forEach(p => {
      const t = p.trav;
      const st = [];
      if (t.armor) st.push(t.armor === 'heavy' ? `🛡️Ironplate(${t.armorLeft})` : '🥋Mantle');
      if (t.camo) st.push('🫥Veil'); if (t.poison) st.push('☠️Poison'); if (t.prison) st.push(`⛓️Prison ${t.prison}`);
      if (t.frozen) st.push(`🧊${t.frozen}`); if (t.ghost) st.push(`👻${t.ghost}`); if (t.chain) st.push(`⛓Chain ${t.chain}`);
      if (t.repel) st.push(`🧿${t.repel}`); if (t.thief) st.push('🦹Thief'); if (t.bounty) st.push('📃Bounty');
      if (t.bag) st.push(`👜${t.bag.c}c/${t.bag.s}⭐`); if (p.ultHeld) st.push(`${ITEM[p.el.ult].icon}${ITEM[p.el.ult].lore}`);
      if (p.vaultProt) st.push(`🔏${p.vaultProt}`); if (p.fakeStars) st.push(`✴️×${p.fakeStars}`);
      if (p.gone) st.push('💀No Wayfarer'); else if (!p.def) st.push('No Warden');
      const loc = p.gone ? '—' : t.loc === 'board' ? `On the Crossing: ${SPACE[G.board[t.pos]].lore}` : (t.ring === p.id ? `Guarding own Hold, tile ${t.pos}` : `⚔️ Raiding ${G.P(t.ring).el.hold}, tile ${t.pos}`);
      const items = p.items.map(id => `<span class="it" title="${esc(itemLabel(id) + ': ' + ITEM[id].desc)}">${ITEM[id].icon}</span>`).join('') || '<span class="dim">no items</span>';
      const el = $('#pc' + p.id);
      el.className = 'pc' + (G.current === p ? ' cur' : '');
      el.style.setProperty('--c', p.color);
      el.innerHTML = `<div class="pch"><span class="gl">${p.el.glyph}</span><b>${esc(p.name)}</b><span class="tag">${p.human ? 'Human' : 'Bot'}</span><span class="ord">turn order #${G.order.indexOf(p.id) + 1}</span></div>
        <div class="pcs"><span title="Banked stars (Starvault)">⭐ <b>${p.vault}</b></span><span title="Banked coins">🏦 ${G.bank(p)}</span><span title="Coins on hand">💰 ${p.cash}</span>
        <span title="Hot loot (unbanked)">🔥 ${G.hotCoins(p)}c ${G.hotStars(p)}⭐</span>${t.sHand ? `<span title="Carried stars">✨${t.sHand}</span>` : ''}<span title="Moot wins">🏆 ${p.mgWins}</span></div>
        <div class="pcl">${esc(loc)}</div>
        <div class="pcb"><span class="pci">${items}</span>${st.length ? `<span class="pct">${st.join(' · ')}</span>` : ''}</div>`;
    });
  },

  note(text) { if (!Settings.test) $('#actText').textContent = text; },

  waitDieStop(p) {
    return new Promise(resolve => {
      const box = $('#action'); box.style.setProperty('--c', p.color);
      $('#actTitle').innerHTML = `${p.el.glyph} ${esc(p.name)} — roll!`;
      $('#actText').textContent = 'The die is tumbling. Stop it when you feel lucky.';
      const opts = $('#actOpts'); opts.innerHTML = '';
      const b = document.createElement('button'); b.className = 'rollBtn'; b.innerHTML = '🎲 STOP THE DIE!<small>click here, click the die, or press SPACE</small>';
      opts.appendChild(b);
      const done = () => { if (!Render.die) return resolve(); Render.die.onStop = null; Render.die.waiting = false; this.pending = null; opts.innerHTML = ''; $('#actTitle').innerHTML = `${p.el.glyph} ${esc(p.name)}`; $('#actText').textContent = 'The die is landing…'; resolve(); };
      b.onclick = done;
      Render.die.onStop = done; Render.die.waiting = true;
      this.pending = done;
    });
  },

  turnStart(p) {
    if (Settings.test) return;
    $('#action').style.setProperty('--c', p.color);
    $('#actTitle').textContent = `${p.el.glyph} ${p.name}'s turn${p.human ? '' : ' (bot)'}`;
    $('#actText').textContent = p.human ? '' : 'Thinking…';
    $('#actOpts').innerHTML = '';
  },

  ask(p, spec) {
    return new Promise(resolve => {
      const box = $('#action');
      box.style.setProperty('--c', p.color);
      $('#actTitle').innerHTML = `${p.el.glyph} ${esc(spec.title)}`;
      $('#actText').innerHTML = `<span style="color:${p.color}">${esc(p.name)}</span> — ${esc(spec.text || '')}`;
      const opts = $('#actOpts'); opts.innerHTML = '';
      let n = 0;
      const tiles = [];
      const done = v => {
        this.pending = null; Render.highlight = null;
        opts.innerHTML = ''; Sfx.click(); resolve(v);
      };
      spec.options.forEach(o => {
        const b = document.createElement('button');
        if (!o.disabled) n++;
        b.innerHTML = `${o.disabled ? '' : `<span class="k">${n <= 9 ? n : ''}</span>`}${esc(o.label)}${o.desc ? `<small>${esc(o.desc)}</small>` : ''}`;
        b.disabled = !!o.disabled;
        if (o.item) b.classList.add('itemBtn');
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
    return new Promise(resolve => {
      const done = v => { this.pending = null; Render.highlight = null; $('#actOpts').innerHTML = ''; Sfx.click(); resolve(v); };
      Render.highlight = { owner, tiles, onPick: done };
      $('#actTitle').innerHTML = `${p.el.glyph} ${esc(title)}`;
      $('#actText').innerHTML = 'Click a highlighted tile on your Hold, or pick below.';
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
    Render.mapMode = on === undefined ? !Render.mapMode : on;
    $('#app').classList.toggle('mapmode', Render.mapMode);
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
    const tabs = [['spaces', '🎲 Board spaces'], ['hold', '🏰 Your Hold'], ['items', '🎒 Items'], ['rules', '📖 Rules'], ['controls', '🎮 Controls']];
    const row = (sw, title, meta, text, col) => `<div class="hrow" style="--c:${col || '#6b5bd6'}">${sw}<div><b>${title}</b>${meta ? `<span class="meta">${meta}</span>` : ''}<p>${text}</p></div></div>`;
    const swatch = (bg, txt, fg = '#111') => `<div class="hsw" style="background:${bg};color:${fg}">${txt}</div>`;
    let body = '', one = false;
    if (tab === 'spaces') {
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
      <p><b>The Moot:</b> after each round but the last, a minigame. Everyone who ties for first banks +2 and plays first next round. The player with the fewest stars picks between two games.</p>
      </div>`;
    } else {
      one = true;
      body = `<div class="rtext">
      <p><b>Board (mouse):</b> click the options in the middle panel, click highlighted tiles to place things, or press 1–9.</p>
      <p><b>Board (keyboard):</b> arrow keys move the highlight, Enter selects, Space stops the die, M opens the map, H opens help, Esc goes back.</p>
      <p><b>Board (gamepad, any pad):</b> d-pad / stick to move, A to select or stop the die, B to go back or close, Y for the map, X for help.</p>
      <p><b>Minigames:</b><br>${Input.keyNames.map((k, i) => `Player ${i + 1} (${ELEMENTS[i].name}): ${k}`).join('<br>')}<br>Gamepads 1–4 control players 1–4 (stick/d-pad, A = action, B = alt). Player 1 can also use the mouse in cursor games.</p>
      <p><b>Secret picks:</b> in bluffing games nobody’s cursor is shown. Hold your alt button (B) to peek at your own choice.</p>
      </div>`;
    }
    $('#helpOv').innerHTML = `<h2>❓ Help</h2><button class="hclose" data-back="1">✖ Close (B / Esc)</button>
      <div class="htabs">${tabs.map(([k, l]) => `<button data-tab="${k}" class="${k === tab ? 'on' : ''}">${l}</button>`).join('')}</div>
      <div class="hbody ${one ? 'one' : ''}">${body}</div>`;
    $('#helpOv').querySelectorAll('[data-tab]').forEach(b => { b.onclick = () => { this.renderHelp(b.dataset.tab); Nav.focusFirst('[data-tab="' + b.dataset.tab + '"]'); }; });
    $('#helpOv .hclose').onclick = () => this.toggleHelp(false);
  },

  // ---------------------------------------------------------- screens
  showMenu() {
    Render.game = null;
    $('#overlay').classList.remove('hidden');
    const seats = JSON.parse(localStorageGet('ff_seats') || 'null') || [
      { name: 'Player 1', human: true }, { name: 'Bot Tide', human: false }, { name: 'Bot Ember', human: false }, { name: 'Bot Root', human: false }];
    $('#overlay').innerHTML = `<div class="panel menu">
      <h1>THE FOURFOLD</h1><p class="sub">Four Holds race to hold the most stars after the final bell — raiding each other along the way.</p>
      <div class="seats">${ELEMENTS.map((el, i) => `<div class="seat" style="--c:${el.color}">
        <div class="sg">${el.glyph}</div><div><b>${el.hold}</b><br><small>${el.name} · ${el.people}</small></div>
        <input id="sn${i}" value="${esc(seats[i].name)}" maxlength="14">
        <select id="sh${i}"><option value="1" ${seats[i].human ? 'selected' : ''}>Human</option><option value="0" ${!seats[i].human ? 'selected' : ''}>Bot</option></select>
        <small class="keys">Moot keys: ${Input.keyNames[i]} · or gamepad ${i + 1}</small></div>`).join('')}</div>
      <div class="row"><label>Game length <select id="rounds"><option value="20">20 rounds (full)</option><option value="15">15 rounds</option><option value="10">10 rounds (quick)</option></select></label>
      <label>Animation <select id="speed"><option value="1">Normal</option><option value="0.5">Fast</option><option value="0.15">Very fast</option></select></label>
      <label><input type="checkbox" id="snd" ${Settings.sound ? 'checked' : ''}> Sound</label></div>
      <div class="row btns"><button id="startBtn" class="big">▶ Start game</button><button id="practiceBtn">🎮 Moot practice (60 minigames)</button><button id="rulesBtn">❓ Help & how to play</button></div>
      <p class="hint">Board turns: mouse, keyboard (arrows + Enter) or any gamepad (A select · B back · X help · Y map). Minigames use the keys above or gamepads 1–4. Empty seats are bots.</p>
    </div>`;
    const readSeats = () => ELEMENTS.map((el, i) => ({ name: $('#sn' + i).value.trim() || el.name, human: $('#sh' + i).value === '1' }));
    $('#startBtn').onclick = () => {
      const s = readSeats(); localStorageSet('ff_seats', JSON.stringify(s));
      Settings.speed = +$('#speed').value; Settings.sound = $('#snd').checked;
      Sfx.init();
      $('#overlay').classList.add('hidden');
      startGame({ seats: s, rounds: +$('#rounds').value });
    };
    $('#practiceBtn').onclick = () => { const s = readSeats(); localStorageSet('ff_seats', JSON.stringify(s)); Settings.sound = $('#snd').checked; Sfx.init(); this.showPractice(s); };
    $('#rulesBtn').onclick = () => this.toggleHelp(true, 'rules');
  },

  showPractice(seats) {
    $('#overlay').innerHTML = `<div class="panel practice"><h2>Moot practice</h2><p class="sub">Play any of the 60 minigames. Seats set to Human use their keys; the rest are bots.</p>
      <div class="mglist">${MG.list.map((g, i) => `<button data-id="${g.id}"><b>${i + 1}. ${esc(g.name)}</b><small>${esc(g.type)} · ${esc(g.controls)}</small></button>`).join('')}</div>
      <div class="row btns"><button id="backBtn" data-back="1">← Back</button></div></div>`;
    $('#backBtn').onclick = () => this.showMenu();
    document.querySelectorAll('.mglist button').forEach(b => b.onclick = async () => {
      $('#overlay').classList.add('hidden');
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
