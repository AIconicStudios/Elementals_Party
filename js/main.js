'use strict';
// Entry point: input, the minigame engine and the menu shell
window.addEventListener('load', () => {
  const q = id => document.getElementById(id);
  const fit = () => { const s = Math.min(window.innerWidth / 1600, window.innerHeight / 900); q('app').style.transform = `translate(-50%,-50%) scale(${s})`; };
  window.addEventListener('resize', fit); fit();
  Input.init();
  MG.init(q('mg'));
  q('mgRestart').onclick = () => MG.onRestartClick && MG.onRestartClick();
  q('mgPauseBtn').onclick = () => MG.onPauseClick && MG.onPauseClick();
  q('mgResume').onclick = () => { MG.paused = false; MG.pauseUI(false); };
  q('mgSkipPr').onclick = () => MG.onSkipPractice && MG.onSkipPractice();
  q('mgQuit').onclick = () => MG.onQuitClick && MG.onQuitClick();
  // browsers only start audio after a click or key press
  const unlock = () => { Sfx.init(); if (Sfx.ctx && Sfx.ctx.state === 'suspended') Sfx.ctx.resume(); Music.refresh(); };
  window.addEventListener('pointerdown', unlock); window.addEventListener('keydown', unlock);
  Shell.init(q('shell'));
});
