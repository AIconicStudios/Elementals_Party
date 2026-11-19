'use strict';
// Entry point
let currentGame = null;

function startGame(cfg) {
  if (currentGame) currentGame.aborted = true;
  Input.setHumans(cfg.seats);
  const g = cfg.simple ? new SimpleGame(cfg) : new Game(cfg);
  document.getElementById('viewBtn').classList.remove('hidden');
  Music.play('board');
  currentGame = g;
  UI.game = g; Render.game = g; Render.disp = {}; Render.floats = [];
  document.getElementById('log').innerHTML = '';
  g.run().catch(e => { if (!g.aborted) console.error(e); });
  return g;
}

window.addEventListener('load', () => {
  Input.init();
  UI.init();
  Render.init(document.getElementById('board'));
  MG.init(document.getElementById('mg'));
  const q = id => document.getElementById(id);
  q('muteBtn').onclick = () => { Settings.sound = !Settings.sound; q('muteBtn').textContent = Settings.sound ? '🔊 Sound' : '🔇 Muted'; };
  const speeds = [1, 0.5, 0.15];
  q('speedBtn').onclick = () => { const k = (speeds.indexOf(Settings.speed) + 1) % speeds.length; Settings.speed = speeds[k]; q('speedBtn').textContent = ['⏩ Speed', '⏩⏩ Fast', '⏩⏩⏩ Faster'][k]; };
  q('quitBtn').onclick = () => {
    if (!currentGame || confirm('Quit this game and return to the menu?')) {
      if (currentGame) { currentGame.aborted = true; if (UI.pending) UI.pending(null); }
      currentGame = null; UI.game = null; UI.toggleMap(false); Render.mapMode = false; document.getElementById('app').classList.remove('mapmode');
      [0, 1, 2, 3].forEach(i => { document.getElementById('pc' + i).innerHTML = ''; }); Render.die = null;
      document.getElementById('viewBtn').classList.add('hidden'); Render.toggleZoom(false);
      UI.showMenu();
    }
  };
  q('mapBtn').onclick = () => UI.toggleMap();
  q('logBtn').onclick = () => { document.getElementById('app').classList.toggle('showlog'); Sfx.click(); };
  q('viewBtn').onclick = () => Render.toggleZoom();
  q('mgPauseBtn').onclick = () => MG.onPauseClick && MG.onPauseClick();
  q('mgResume').onclick = () => { MG.paused = false; MG.pauseUI(false); };
  q('mgQuit').onclick = () => MG.onQuitClick && MG.onQuitClick();
  q('helpBtn').onclick = () => UI.toggleHelp();
  Nav.init();
  q('musicBtn').onclick = () => { Settings.music = !Settings.music; q('musicBtn').textContent = Settings.music ? '🎵 Music' : '🔇 Music'; Music.refresh(); };
  // browsers only start audio after a click or key press
  const unlock = () => { Sfx.init(); if (Sfx.ctx && Sfx.ctx.state === 'suspended') Sfx.ctx.resume(); Music.refresh(); };
  window.addEventListener('pointerdown', unlock); window.addEventListener('keydown', unlock);
  Music.play('board');
  UI.showMenu();
});
