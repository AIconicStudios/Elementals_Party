'use strict';
// Entry point
let currentGame = null;

function startGame(cfg) {
  if (currentGame) currentGame.aborted = true;
  const g = new Game(cfg);
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
  q('muteBtn').onclick = () => { Settings.sound = !Settings.sound; q('muteBtn').textContent = Settings.sound ? '🔊' : '🔇'; };
  const speeds = [1, 0.5, 0.15];
  q('speedBtn').onclick = () => { const k = (speeds.indexOf(Settings.speed) + 1) % speeds.length; Settings.speed = speeds[k]; q('speedBtn').textContent = ['⏩', '⏩⏩', '⏩⏩⏩'][k]; };
  q('quitBtn').onclick = () => {
    if (!currentGame || confirm('Quit this game and return to the menu?')) {
      if (currentGame) { currentGame.aborted = true; if (UI.pending) UI.pending(null); }
      currentGame = null; UI.game = null;
      document.getElementById('players').innerHTML = '';
      UI.showMenu();
    }
  };
  UI.showMenu();
});
