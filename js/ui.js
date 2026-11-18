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
      if (!this.pending) return;
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
      <div class="row btns"><button id="startBtn" class="big">▶ Start game</button><button id="practiceBtn">🎮 Moot practice (40 minigames)</button><button id="rulesBtn">📖 How to play</button></div>
      <p class="hint">Board turns are played with the mouse (or number keys 1-9). Minigames use the keys above — up to four players on one keyboard, plus gamepads. Empty seats are bots.</p>
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
    $('#rulesBtn').onclick = () => this.showRules();
  },

  showPractice(seats) {
    $('#overlay').innerHTML = `<div class="panel practice"><h2>Moot practice</h2><p class="sub">Play any of the 40 minigames. Seats set to Human use their keys; the rest are bots.</p>
      <div class="mglist">${MG.list.map((g, i) => `<button data-id="${g.id}"><b>${i + 1}. ${esc(g.name)}</b><small>${esc(g.type)} · ${esc(g.controls)}</small></button>`).join('')}</div>
      <div class="row btns"><button id="backBtn">← Back</button></div></div>`;
    $('#backBtn').onclick = () => this.showMenu();
    document.querySelectorAll('.mglist button').forEach(b => b.onclick = async () => {
      $('#overlay').classList.add('hidden');
      const pl = seats.map((s, i) => ({ id: i, name: s.name, color: ELEMENTS[i].color, human: s.human, el: ELEMENTS[i] }));
      await MG.run(b.dataset.id, pl, [0, 1, 2, 3]);
      $('#overlay').classList.remove('hidden');
      this.showPractice(seats);
    });
  },

  showRules() {
    $('#overlay').innerHTML = `<div class="panel rules"><h2>How to play</h2><div class="rtext">
      <p><b>Goal:</b> hold the most banked stars (Starvault) after the final round. Tiebreak: banked coins, then minigame wins.</p>
      <p><b>Your pieces:</b> a <b>Wayfarer</b> (Traveller) who walks the one-way Crossing earning coins, and a <b>Warden</b> (Defender) who guards your 16-tile Hold.</p>
      <p><b>Your turn:</b> play any items (free), then choose one: move the Wayfarer (+4 wage), move the Warden either way around your Hold, or <b>Fortify</b> (buy and place a defense from your bank).</p>
      <p><b>Counting Houses</b> (🏛️): landing or passing lets you deposit everything you carry and buy one star (15/20/25 coins) and items. Coins on hand are spent first, then the bank.</p>
      <p><b>Spaces:</b> Boon +5, Bane −3, Ankar's Altar (summons the Ankar, who moves 3 per round and takes a star or 10 coins on contact), Eclipse (closes 2 Waygates and 2 Counting Houses for 2 rounds), Gilded Spring (doubles coins on hand, max +10), Fortune Wheel (1/3/5/10), Pedlar's Stall (item), Mirage (becomes another special).</p>
      <p><b>Raiding</b> (from round 4): land exactly on a rival's Waygate to enter their Hold at tile 16. Each move goes clockwise; landing on a Hoard takes up to 5 coins, on the Starvault (tile 8) tries to steal a star. Everything taken is <b>hot loot</b> until you bank it at a Counting House or your own Waygate. Passing tile 16 again leaves the Hold.</p>
      <p><b>Catches:</b> if a Warden and a raider end on the same tile, the raider dies (loot returns, cash goes to the defender). Armor, Veilcloak and other items change this. Traps trigger only on exact landing.</p>
      <p><b>Ultimates:</b> each element can buy one ultimate per game at a Counting House and unleash it with a Fortify turn: Typhoon (Air), Great Ebb (Water), Sacrifice Pyre (Fire), Famished Earth (Earth).</p>
      <p><b>The Moot:</b> after every round except the last, a random 4-player minigame. The winner banks +2 and plays first next round. The player with the fewest stars picks between two games.</p>
      <p><b>Moot keys:</b><br>${Input.keyNames.map((k, i) => `P${i + 1} (${ELEMENTS[i].name}): ${k}`).join('<br>')}<br>Gamepads 1-4 map to players 1-4 (stick/d-pad, A = action, B = alt). Player 1 can also use the mouse in cursor games.</p>
      </div><div class="row btns"><button id="backBtn">← Back</button></div></div>`;
    $('#backBtn').onclick = () => this.showMenu();
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
