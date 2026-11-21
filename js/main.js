'use strict';
// Entry point: input, the minigame engine and the menu shell
window.addEventListener('load', () => {
  const q = id => document.getElementById(id);
  const fit = () => { const s = Math.min(window.innerWidth / 1600, window.innerHeight / 900); q('app').style.transform = `translate(-50%,-50%) scale(${s})`; };
  window.addEventListener('resize', fit); fit();
  Input.init();
  // crisp rendering: draw the 1280x720 logical space onto a high-resolution backing store
  const HiDPI = cv => {
    const S = Math.max(1.5, Math.min(2, 1.25 * (window.devicePixelRatio || 1)));
    cv.width = Math.round(1280 * S); cv.height = Math.round(720 * S);
    const g = cv.getContext('2d'), st = g.setTransform.bind(g);
    g.setTransform = (a, b, c, d, e, f) => (typeof a === 'object' ? st(a) : st(a * S, b * S, c * S, d * S, e * S, f * S));
    g.resetTransform = () => st(S, 0, 0, S, 0, 0);
    g.resetTransform(); g.imageSmoothingQuality = 'high';
    return cv;
  };
  HiDPI(q('mg')); HiDPI(q('shell'));
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
