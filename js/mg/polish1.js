'use strict';
// Graphics pass 1: shared drawing helpers and redrawn scenes for games that asked for a visual upgrade.
// Each block replaces only a game's draw (and sometimes hud) so gameplay stays exactly as tuned.
const GX = {
  // draw a static scene once (at high resolution) and reuse it every frame — same look, a fraction of the cost
  bake(key, fn) { GX._bk = GX._bk || {}; let c = GX._bk[key]; if (!c) { c = document.createElement('canvas'); c.width = 2560; c.height = 1440; const b = c.getContext('2d'); b.scale(2, 2); fn(b); GX._bk[key] = c; } return c; },
  blit(g, c) { g.drawImage(c, 0, 0, 1280, 720); },
  // a hero swimming: body tilts toward the stroke, limbs flutter, bubbles trail behind
  swimmer(g, m, i, b, mood, o = {}) {
    const p = m.players[i], sp = Math.hypot(b.vx || 0, b.vy || 0), s = Math.min(1, sp / 110);
    if (Math.abs(b.vx || 0) > 12) b.fc = b.vx > 0 ? 1 : -1; const f = b.fc || 1;
    const want = f * (1.25 + clamp((b.vy || 0) / 260, -0.75, 0.75)) * s + f * 0.12 * (1 - s);
    b.ang = b.ang === undefined ? want : b.ang + (want - b.ang) * 0.18;
    const r = (o.r || b.r) * 1.3;
    g.save(); g.translate(b.x, b.y); g.rotate(b.ang + Math.sin(m.t * 9 + i) * 0.06 * s);
    Char.draw(g, 0, 0, r, p.el.id, p.color, { mood: MGH.persona(mood, p.el.id), look: { x: f, y: 0 }, walk: 0.4 + s * 0.6, t: m.t * (1 + s * 0.6), seed: i * 1.7, noShadow: true, alpha: o.alpha });
    g.restore();
    // bubble trail from the mouth/feet
    for (let k = 0; k < 4; k++) {
      const ph = (m.t * 1.3 + k * 0.25 + i * 0.13) % 1, bx = b.x - f * (r * 0.9) * (1 - ph) + Math.sin(ph * 9 + k) * 5, by = b.y - ph * 60 - r * 0.3;
      g.strokeStyle = `rgba(230,250,255,${0.7 * (1 - ph)})`; g.lineWidth = 1.5; g.beginPath(); g.arc(bx, by, 2 + k % 3 + ph * 3, 0, 7); g.stroke();
    }
  },
  // soft ellipse shadow
  shadow(g, x, y, rx, a = 0.3) { g.save(); g.translate(x, y); g.scale(1, 0.32); const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx); gr.addColorStop(0, `rgba(10,10,30,${a})`); gr.addColorStop(1, 'rgba(10,10,30,0)'); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, rx, 0, 7); g.fill(); g.restore(); },
  // vertical gradient fill of a rect
  vfill(g, x, y, w, h, stops) { const gr = g.createLinearGradient(0, y, 0, y + h); stops.forEach((c, k) => gr.addColorStop(k / (stops.length - 1), c)); g.fillStyle = gr; g.fillRect(x, y, w, h); },
  // pretty wooden plank with grain and nails
  plank(g, x, y, w, h, base = '#b07a44', dark = '#7a4e26', seed = 0) {
    const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, Char.shade(base, 0.18)); gr.addColorStop(1, Char.shade(base, -0.12));
    g.fillStyle = gr; MGH.rr(g, x, y, w, h, Math.min(5, h / 3)); g.fill();
    g.strokeStyle = dark; g.lineWidth = 1.5; g.stroke();
    g.save(); g.globalAlpha = 0.35; g.strokeStyle = dark; g.lineWidth = 1;
    for (let k = 1; k < 3; k++) { const yy = y + h * k / 3 + Math.sin(seed + k) * 2; g.beginPath(); g.moveTo(x + 4, yy); g.bezierCurveTo(x + w * 0.3, yy - 3, x + w * 0.6, yy + 3, x + w - 4, yy); g.stroke(); }
    g.restore();
    g.fillStyle = '#4a3a2a'; [x + 6, x + w - 6].forEach(nx => { g.beginPath(); g.arc(nx, y + h / 2, 2, 0, 7); g.fill(); });
  },
  // shiny pearl
  pearl(g, x, y, r) { const gr = g.createRadialGradient(x - r * 0.35, y - r * 0.4, 0, x, y, r); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.6, '#f2ecff'); gr.addColorStop(1, '#c8b8e0'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); MGH.glow(g, x, y, r * 2.2, 'rgba(255,240,255,0.5)'); },
};

// ===================================================================== Pearl Dive: real swimming
MG.byId.pearls && (MG.byId.pearls.draw = function (m, S, g) {
  // sky + sea
  GX.vfill(g, 0, 0, 1280, 150, ['#7cc8f8', '#bfe8ff', '#e6f7ff']);
  MGH.cloud && [[180, 50, 1], [960, 36, 0.8]].forEach(([x, y, s]) => MGH.cloud(g, x + Math.sin(m.t * 0.1) * 20, y, 34 * s));
  GX.vfill(g, 0, 140, 1280, 580, ['#3ec0f0', '#1f84cc', '#0f4a96', '#082a60']);
  MGH.surface(g, 140, m.t);
  // god rays
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 7; k++) { const x = 120 + k * 180 + Math.sin(m.t * 0.4 + k) * 40; const gr = g.createLinearGradient(0, 140, 0, 700); gr.addColorStop(0, 'rgba(180,240,255,0.16)'); gr.addColorStop(1, 'rgba(180,240,255,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(x - 25, 140); g.lineTo(x + 25, 140); g.lineTo(x + 90, 700); g.lineTo(x - 10, 700); g.fill(); }
  g.restore();
  // caustic shimmer on the sea floor
  g.fillStyle = MGH.grad(g, 640, 720, ['#e8cf96', '#c8a86a', '#a08250']); g.beginPath(); g.moveTo(0, 720); for (let x = 0; x <= 1280; x += 20) g.lineTo(x, 662 + Math.sin(x * 0.018) * 16 + Math.sin(x * 0.05) * 4); g.lineTo(1280, 720); g.fill();
  g.save(); g.globalAlpha = 0.18; g.strokeStyle = '#fff'; g.lineWidth = 2;
  for (let k = 0; k < 16; k++) { const x = (k * 97 + m.t * 20) % 1300 - 10, y = 680 + (k % 3) * 12; g.beginPath(); g.ellipse(x, y, 22 + Math.sin(m.t * 2 + k) * 6, 5, 0, 0, 7); g.stroke(); }
  g.restore();
  // rocks + coral + kelp
  [[90, 676, 36, '#6a6a80'], [430, 684, 28, '#5a6078'], [1010, 678, 40, '#6a6a80'], [1200, 686, 26, '#58607a']].forEach(([x, y, r, c]) => { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, r * 1.3, r * 0.8, 0, Math.PI, 0); g.fill(); g.fillStyle = 'rgba(255,255,255,0.12)'; g.beginPath(); g.ellipse(x - r * 0.3, y - r * 0.45, r * 0.5, r * 0.18, -0.2, 0, 7); g.fill(); });
  [[250, '#ff7a8a'], [700, '#ffb04a'], [1120, '#c87aff']].forEach(([x, c]) => { g.strokeStyle = c; g.lineCap = 'round'; for (let b = -2; b <= 2; b++) { g.lineWidth = 7 - Math.abs(b); g.beginPath(); g.moveTo(x, 690); g.quadraticCurveTo(x + b * 14, 660, x + b * 22 + Math.sin(m.t + b) * 3, 636 + Math.abs(b) * 8); g.stroke(); } });
  for (let k = 0; k < 11; k++) { const x = 40 + k * 122; const h = 5 + (k % 3); g.strokeStyle = k % 2 ? '#2f9a52' : '#23804a'; g.lineCap = 'round'; g.lineWidth = 9; g.beginPath(); g.moveTo(x, 692); for (let s = 1; s <= h; s++) g.lineTo(x + Math.sin(m.t * 1.4 + s * 0.7 + k) * (4 + s * 2.5), 692 - s * 22); g.stroke(); }
  // fish school
  for (let k = 0; k < 7; k++) { const x = ((m.t * 40 + k * 31) % 1500) - 110, y = 300 + Math.sin(m.t + k) * 10 + (k % 3) * 16; g.fillStyle = 'rgba(255,200,80,0.8)'; g.beginPath(); g.ellipse(x, y, 10, 5, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(x - 9, y); g.lineTo(x - 16, y - 5); g.lineTo(x - 16, y + 5); g.fill(); }
  // boat with hull planks, rope ladder and flag
  const by = 112 + Math.sin(m.t * 1.6) * 3;
  g.save(); g.translate(0, by - 112);
  g.fillStyle = 'rgba(0,30,60,0.3)'; g.beginPath(); g.ellipse(640, 150, 190, 10, 0, 0, 7); g.fill();
  const hull = g.createLinearGradient(0, 108, 0, 152); hull.addColorStop(0, '#a8683a'); hull.addColorStop(1, '#5e3418'); g.fillStyle = hull;
  g.beginPath(); g.moveTo(462, 108); g.lineTo(818, 108); g.quadraticCurveTo(800, 150, 760, 154); g.lineTo(520, 154); g.quadraticCurveTo(480, 150, 462, 108); g.fill();
  g.strokeStyle = 'rgba(40,20,10,0.5)'; g.lineWidth = 2; [122, 136].forEach(y => { g.beginPath(); g.moveTo(474, y); g.lineTo(806, y); g.stroke(); });
  g.fillStyle = '#e0a868'; MGH.rr(g, 456, 100, 368, 12, 5); g.fill(); g.fillStyle = '#f6f2e8'; g.fillRect(470, 113, 340, 4);
  g.strokeStyle = '#5a3a20'; g.lineWidth = 7; g.beginPath(); g.moveTo(640, 102); g.lineTo(640, 14); g.stroke();
  g.fillStyle = '#fffaf0'; g.beginPath(); g.moveTo(646, 20); g.quadraticCurveTo(700 + Math.sin(m.t * 2) * 6, 50, 730, 74); g.lineTo(646, 94); g.fill(); g.strokeStyle = '#d8ccb0'; g.lineWidth = 2; g.stroke();
  g.fillStyle = '#ff5a5a'; g.beginPath(); g.moveTo(640, 14); g.lineTo(670 + Math.sin(m.t * 6) * 3, 20); g.lineTo(640, 27); g.fill();
  g.strokeStyle = '#c8a060'; g.lineWidth = 3; [790, 806].forEach(x => { g.beginPath(); g.moveTo(x, 110); g.lineTo(x - 4, 190); g.stroke(); }); for (let y = 122; y < 190; y += 14) { g.beginPath(); g.moveTo(790 - (y - 110) * 0.05, y); g.lineTo(806 - (y - 110) * 0.05, y); g.stroke(); }
  // banked pearl basket
  g.fillStyle = '#c89a5a'; MGH.rr(g, 560, 86, 50, 18, 6); g.fill(); g.strokeStyle = '#7a5530'; g.lineWidth = 2; g.stroke();
  const tot = S.d.reduce((a, d) => a + d.bank, 0); for (let k = 0; k < Math.min(7, tot); k++) GX.pearl(g, 568 + k * 6, 86 - (k % 2) * 4, 5);
  Char.npc(g, 520, 80, 18, 'guard', { mood: 'happy', t: m.t });
  g.restore();
  // giant clams with ridged shells
  S.clams.forEach(c => {
    const o = Math.max(0, Math.sin(c.ph)) * 0.85, closing = Math.sin(c.ph) > 0 && Math.cos(c.ph) < -0.6;
    g.save(); g.translate(c.x, c.y);
    GX.shadow(g, 0, 16, 52, 0.35);
    const shellC = (top) => { const gr = g.createLinearGradient(0, top ? -30 : 0, 0, top ? 0 : 22); gr.addColorStop(0, '#ffd8ec'); gr.addColorStop(1, '#d58ab8'); return gr; };
    g.fillStyle = shellC(false); g.beginPath(); g.moveTo(-46, 0); g.quadraticCurveTo(0, 34, 46, 0); g.closePath(); g.fill(); g.strokeStyle = '#a85a8a'; g.lineWidth = 2; g.stroke();
    g.fillStyle = '#7a2a5a'; g.beginPath(); g.ellipse(0, 0, 40, 7, 0, 0, 7); g.fill(); // inside
    if (c.pearl) GX.pearl(g, 0, -6, 10);
    g.translate(42, 0); g.rotate(-o); g.translate(-42, 0);
    g.fillStyle = shellC(true); g.beginPath(); g.moveTo(-46, 0); for (let k = 0; k <= 8; k++) { const a = Math.PI + k / 8 * Math.PI; g.lineTo(Math.cos(a) * 46, Math.sin(a) * 30 - (k % 2 ? 3 : 0)); } g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = 'rgba(160,70,120,0.55)'; g.lineWidth = 1.5; for (let k = 1; k < 8; k++) { const a = Math.PI + k / 8 * Math.PI; g.beginPath(); g.moveTo(0, -2); g.lineTo(Math.cos(a) * 42, Math.sin(a) * 27); g.stroke(); }
    g.restore();
    if (closing && c.pearl) { g.fillStyle = 'rgba(255,90,90,0.9)'; g.font = 'bold 18px Georgia'; g.textAlign = 'center'; g.fillText('!', c.x, c.y - 44); }
  });
  // rising bubbles
  for (let k = 0; k < 22; k++) { const ph = (m.t * 0.25 + MGH.hash(k)) % 1; g.strokeStyle = `rgba(255,255,255,${0.5 * (1 - ph)})`; g.lineWidth = 1.5; g.beginPath(); g.arc(MGH.hash(k + 4) * 1280 + Math.sin(ph * 12 + k) * 6, 700 - ph * 560, 2 + k % 4, 0, 7); g.stroke(); }
  // divers
  S.d.forEach((d, i) => {
    const mood = d.stuck > 0 ? 'hurt' : d.air < 0.3 ? 'scared' : 'determined';
    if (d.y < 150) { // treading water at the surface
      const p = m.players[i]; Char.draw(g, d.x, d.y + Math.sin(m.t * 3 + i) * 3, d.r * 1.3, p.el.id, p.color, { mood: MGH.persona(d.carry ? 'cheer' : 'happy', p.el.id), walk: 0.5, seed: i * 1.7, noShadow: true, look: { x: d.vx > 0 ? 1 : -1, y: 0 } });
      g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 2; g.beginPath(); g.ellipse(d.x, d.y + 22, 28 + Math.sin(m.t * 4) * 3, 6, 0, 0, 7); g.stroke();
    } else GX.swimmer(g, m, i, d, mood);
    // carried pearls in a net bag
    for (let k = 0; k < d.carry; k++) GX.pearl(g, d.x - 12 + k * 12, d.y - 40, 6);
    if (d.y > 150) { g.fillStyle = 'rgba(0,20,50,0.5)'; MGH.rr(g, d.x - 28, d.y + 36, 56, 9, 4); g.fill(); g.fillStyle = d.air < 0.3 ? '#ff4a3a' : '#8fe8ff'; MGH.rr(g, d.x - 27, d.y + 37, 54 * d.air, 7, 3); g.fill(); g.font = '12px "Segoe UI Emoji"'; g.textAlign = 'right'; g.fillText('🫧', d.x - 30, d.y + 45); }
  });
});

// a proper fish (or boot): body gradient, tail, fins, eye
GX.fish = function (g, x, y, len, col, ang = 0, t = 0, boot = false) {
  g.save(); g.translate(x, y); g.rotate(ang);
  if (boot) {
    g.fillStyle = '#6a4a2a'; g.beginPath(); g.moveTo(-len * 0.3, -len * 0.5); g.lineTo(len * 0.15, -len * 0.5); g.lineTo(len * 0.15, 0); g.quadraticCurveTo(len * 0.6, 0, len * 0.6, len * 0.22); g.lineTo(-len * 0.3, len * 0.22); g.closePath(); g.fill();
    g.fillStyle = '#3a2614'; g.fillRect(-len * 0.32, len * 0.18, len * 0.94, len * 0.08); g.strokeStyle = '#c8a878'; g.lineWidth = 1.5; for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(-len * 0.05, -len * 0.4 + k * len * 0.12); g.lineTo(len * 0.12, -len * 0.4 + k * len * 0.12); g.stroke(); }
    g.restore(); return;
  }
  const w = len * 0.42, wag = Math.sin(t * 10) * 0.25;
  g.fillStyle = Char.shade(col, -0.2);
  g.save(); g.translate(len * 0.45, 0); g.rotate(wag); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(len * 0.25, -w * 0.9, len * 0.32, -w * 0.8); g.quadraticCurveTo(len * 0.2, 0, len * 0.32, w * 0.8); g.quadraticCurveTo(len * 0.25, w * 0.9, 0, 0); g.fill(); g.restore();
  g.beginPath(); g.moveTo(-len * 0.05, -w * 0.45); g.quadraticCurveTo(len * 0.12, -w * 1.15, len * 0.28, -w * 0.4); g.fill();
  const gr = g.createLinearGradient(0, -w / 2, 0, w / 2); gr.addColorStop(0, Char.shade(col, -0.15)); gr.addColorStop(0.55, col); gr.addColorStop(1, Char.shade(col, 0.45));
  g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, len * 0.5, w / 2, 0, 0, 7); g.fill();
  g.strokeStyle = 'rgba(0,0,0,0.18)'; g.lineWidth = 1.2; g.beginPath(); g.arc(-len * 0.28, 0, w * 0.42, -1.1, 1.1); g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.ellipse(-len * 0.05, -w * 0.18, len * 0.28, w * 0.1, 0, 0, 7); g.fill();
  g.fillStyle = '#fff'; g.beginPath(); g.arc(-len * 0.34, -w * 0.1, w * 0.17, 0, 7); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.arc(-len * 0.36, -w * 0.1, w * 0.09, 0, 7); g.fill();
  g.restore();
};

// ===================================================================== Fishing Frenzy: lakeside at golden hour
MG.byId.fishing && (MG.byId.fishing.draw = function (m, S, g) {
  GX.vfill(g, 0, 0, 1280, 300, ['#6fb8f0', '#b8dcf4', '#ffe0b0']);
  MGH.glow(g, 1040, 230, 160, 'rgba(255,230,150,0.55)'); g.fillStyle = '#fff4cc'; g.beginPath(); g.arc(1040, 230, 34, 0, 7); g.fill();
  [[220, 70], [700, 50], [1100, 90]].forEach(([x, y], k) => MGH.cloud(g, (x + m.t * (4 + k)) % 1400 - 60, y, 28 + k * 4));
  // layered hills with pine trees
  const hill = (y0, amp, col, seed, trees) => { g.fillStyle = col; g.beginPath(); g.moveTo(0, 300); for (let x = 0; x <= 1280; x += 20) g.lineTo(x, y0 - Math.abs(Math.sin(x * 0.004 + seed)) * amp - Math.sin(x * 0.013 + seed) * amp * 0.2); g.lineTo(1280, 300); g.fill();
    if (trees) for (let k = 0; k < 40; k++) { const x = MGH.hash(k + seed * 10) * 1280, b = y0 - Math.abs(Math.sin(x * 0.004 + seed)) * amp - Math.sin(x * 0.013 + seed) * amp * 0.2 + 4, h = 18 + MGH.hash(k + 3) * 16; g.fillStyle = Char.shade(col, -0.25); g.beginPath(); g.moveTo(x, b - h); g.lineTo(x - h * 0.35, b); g.lineTo(x + h * 0.35, b); g.fill(); } };
  hill(250, 70, '#8ab8a8', 1.2, false); hill(286, 50, '#4f8a5a', 3.1, true);
  // water with reflections and sparkles
  GX.vfill(g, 0, 298, 1280, 422, ['#5fa8d0', '#2f7ab8', '#1a4a88']);
  g.save(); g.globalAlpha = 0.25; g.fillStyle = '#ffe8a0'; for (let k = 0; k < 14; k++) { const y = 310 + k * 14, w = 60 - k * 3 + Math.sin(m.t * 2 + k) * 8; g.fillRect(1040 - w / 2 + Math.sin(m.t + k) * 6, y, w, 3); } g.restore();
  for (let k = 0; k < 30; k++) { const x = (k * 97 + m.t * 10) % 1320 - 20, y = 320 + (k * 53) % 380, a = 0.15 + 0.15 * Math.sin(m.t * 2 + k); g.strokeStyle = `rgba(255,255,255,${a})`; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 10, y); g.quadraticCurveTo(x, y - 4, x + 10, y); g.stroke(); }
  // lily pads + reeds
  [[60, 360], [1230, 420], [640, 340]].forEach(([x, y]) => { g.fillStyle = '#4a9a4a'; g.beginPath(); g.ellipse(x, y, 26, 9, 0, 0.3, 6.0); g.lineTo(x, y); g.fill(); });
  for (let k = 0; k < 9; k++) { const x = (k < 5 ? 10 + k * 9 : 1240 + (k - 5) * 9); g.strokeStyle = '#5a7a3a'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, 720); g.quadraticCurveTo(x + Math.sin(m.t + k) * 6, 600, x + Math.sin(m.t * 1.3 + k) * 8, 520 + k * 6); g.stroke(); g.fillStyle = '#7a4a2a'; MGH.rr(g, x - 3 + Math.sin(m.t * 1.3 + k) * 8, 520 + k * 6, 7, 22, 3); g.fill(); }
  // fish shadows gliding under the surface
  for (let k = 0; k < 6; k++) { const dir = k % 2 ? 1 : -1, x = dir > 0 ? (m.t * 30 + k * 220) % 1400 - 60 : 1340 - (m.t * 25 + k * 210) % 1400, y = 470 + (k * 37) % 180; g.save(); g.globalAlpha = 0.18; g.fillStyle = '#0a2040'; g.translate(x, y); g.scale(-dir, 1); g.beginPath(); g.ellipse(0, 0, 22, 8, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(18, 0); g.lineTo(32, -7); g.lineTo(32, 7); g.fill(); g.restore(); }
  S.p.forEach((p, i) => {
    const x = 160 + i * 320, dockY = 560, pl = m.players[i];
    // pier: posts into the water with ripples, plank deck
    for (const dx of [-58, 58]) { g.fillStyle = '#5a3a1e'; g.fillRect(x + dx - 7, dockY + 10, 14, 120); g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 2; g.beginPath(); g.ellipse(x + dx, dockY + 128 > 715 ? 700 : dockY + 100, 14 + Math.sin(m.t * 2 + dx) * 2, 4, 0, 0, 7); g.stroke(); }
    for (let k = 0; k < 4; k++) GX.plank(g, x - 78 + k * 39, dockY - 2, 38, 26, '#b8844c', '#6a4422', k + i);
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x - 78, dockY + 24, 156, 6);
    // bucket with the catch
    const bx = x - 62; g.fillStyle = '#8a9aa8'; g.beginPath(); g.moveTo(bx - 14, dockY - 26); g.lineTo(bx + 14, dockY - 26); g.lineTo(bx + 11, dockY); g.lineTo(bx - 11, dockY); g.fill(); g.strokeStyle = '#5a6a78'; g.lineWidth = 2; g.stroke(); g.beginPath(); g.arc(bx, dockY - 26, 14, Math.PI, 0); g.stroke();
    p.haul.slice(-3).forEach((f, k) => GX.fish(g, bx - 6 + k * 6, dockY - 30 - k * 3, 18, f.col, -1.3 + k * 0.4, m.t + k, !f.v));
    // angler sitting on the pier edge
    const reel = p.st === 'reel', ten = reel ? p.ten : 0;
    Char.draw(g, x - 10, dockY - 40 + (reel ? Math.sin(m.t * 20) * ten * 2 : 0), 30, pl.el.id, pl.color, { mood: reel ? (p.ten > 0.8 ? 'scared' : 'determined') : p.st === 'bite' ? 'shock' : p.msgT > 0 && p.msg.includes('+') ? 'cheer' : 'happy', seed: i, look: { x: 1, y: -0.3 }, hands: { n: { x: -1.1, y: -0.6, d: -140, o: false, m: false }, f: { x: -0.6, y: -0.2, d: 170, o: false, m: false } } });
    // bending rod: the more tension, the more it curves
    const hx = x + 18, hy = dockY - 48, bend = reel ? 30 + ten * 50 : p.st === 'bite' ? 30 : 6;
    const tip = { x: x + 78 - bend * 0.3, y: dockY - 140 + bend * 0.9 };
    g.strokeStyle = '#3a2412'; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(hx, hy); g.quadraticCurveTo(x + 60, dockY - 120 + bend * 0.2, tip.x, tip.y); g.stroke();
    g.strokeStyle = '#c8a060'; g.lineWidth = 2.5; g.stroke();
    g.fillStyle = '#9aa0a8'; g.beginPath(); g.arc(hx + 6, hy + 4, 6, 0, 7); g.fill(); g.strokeStyle = '#5a6068'; g.lineWidth = 2; g.beginPath(); g.moveTo(hx + 6, hy + 4); g.lineTo(hx + 6 + Math.cos(m.t * (reel && m.held && m.held(i, 'a') ? 20 : 0)) * 6, hy + 4 + Math.sin(m.t * (reel ? 20 : 0)) * 6); g.stroke();
    if (p.st !== 'idle') {
      const fx = x + 40 + (p.bx || 0) * 0.5 + (reel ? p.dist * 40 : 40), dip = p.st === 'bite' ? 14 : p.st === 'wait' && (p.t % p.nib) < 0.15 ? 5 : 0, fy = 420 + dip + Math.sin(m.t * 3 + i) * 2;
      g.strokeStyle = reel && p.ten > 0.8 ? 'rgba(255,140,140,0.95)' : 'rgba(255,255,255,0.85)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(tip.x, tip.y); g.quadraticCurveTo((tip.x + fx) / 2, reel ? (tip.y + fy) / 2 : fy - 60, fx, fy); g.stroke();
      if (reel) {
        const fs = 40 * p.fish.s, fyy = fy + 26 + p.dist * 70, ang = Math.sin(m.t * 8 + i) * 0.4;
        g.strokeStyle = 'rgba(255,255,255,0.6)'; g.beginPath(); g.moveTo(fx, fy); g.lineTo(fx, fyy - 8); g.stroke();
        GX.fish(g, fx + Math.sin(m.t * 6) * 8, fyy, fs, p.fish.col, -1.2 + ang, m.t * 1.5, !p.fish.v);
        for (let k = 0; k < 4; k++) { const a = m.t * 9 + k * 1.6; g.fillStyle = 'rgba(255,255,255,0.7)'; g.beginPath(); g.arc(fx + Math.cos(a) * 20, fy - 2 - Math.abs(Math.sin(a)) * 12, 2.5, 0, 7); g.fill(); }
      }
      g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 1.5; g.beginPath(); g.ellipse(fx, fy + 3, 12 + (m.t * 20 % 10), 3.5, 0, 0, 7); g.stroke();
      g.fillStyle = '#e8323e'; g.beginPath(); g.arc(fx, fy - 4, 8, Math.PI, 0); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(fx, fy - 4, 8, 0, Math.PI); g.fill(); g.fillStyle = '#333'; g.fillRect(fx - 1, fy - 18, 2, 8);
      if (p.st === 'bite') { MGH.glow(g, fx, fy - 34, 36, 'rgba(255,80,60,0.5)'); MGH.text(g, '!', fx, fy - 30, 48, '#ff4a3a', 'center', 'bold'); g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 3; g.beginPath(); g.ellipse(fx, fy + 4, 26, 7, 0, 0, 7); g.stroke(); }
      if (p.st === 'wait' && dip) { g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 2; g.beginPath(); g.ellipse(fx, fy + 4, 18, 5, 0, 0, 7); g.stroke(); }
    }
    if (reel) { g.fillStyle = 'rgba(0,0,0,0.55)'; MGH.rr(g, x - 72, 296, 144, 20, 10); g.fill(); g.fillStyle = 'rgba(255,74,58,0.35)'; g.fillRect(x - 66 + 132 * 0.8, 300, 132 * 0.2, 12); const tg = g.createLinearGradient(x - 66, 0, x + 66, 0); tg.addColorStop(0, '#7cf06a'); tg.addColorStop(0.6, '#ffe680'); tg.addColorStop(1, '#ff4a3a'); g.fillStyle = tg; MGH.rr(g, x - 66, 300, 132 * Math.min(1, p.ten), 12, 6); g.fill(); MGH.text(g, '🎣 tension', x, 290, 14, '#fff', 'center', 'bold'); }
    if (p.msgT > 0) MGH.text(g, p.msg, x, 268, 18, p.msg.includes('+') ? '#ffe680' : '#fff', 'center', 'bold');
    g.fillStyle = 'rgba(0,0,0,0.35)'; MGH.rr(g, x - 70, 684, 140, 30, 15); g.fill();
    MGH.text(g, `${pl.name} ${p.pts}`, x, 706, 18, pl.color, 'center', 'bold');
  });
});

// ===================================================================== Laser Limbo: neon stage with real laser bars and a proper crouch
MG.byId.limbo && (MG.byId.limbo.draw = function (m, S, g) {
  GX.vfill(g, 0, 0, 1280, 720, ['#0c0620', '#22104a', '#3a145a']);
  // back wall: LED panel grid pulsing to the beat
  for (let r = 0; r < 7; r++) for (let c = 0; c < 26; c++) { const v = 0.5 + 0.5 * Math.sin(m.t * 3 + c * 0.5 + r * 0.8); g.fillStyle = `rgba(${c % 3 ? 120 : 255},${60 + r * 10},${200 + (c % 2) * 50},${0.05 + v * 0.1})`; MGH.rr(g, 8 + c * 49, 30 + r * 42, 44, 36, 5); g.fill(); }
  // sweeping spotlights
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 6; k++) { const a = Math.sin(m.t * 0.7 + k * 1.3) * 0.5, sx = 120 + k * 208, col = ['255,60,160', '60,160,255', '255,220,80'][k % 3]; const gr = g.createLinearGradient(sx, 0, sx, 640); gr.addColorStop(0, `rgba(${col},0.35)`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.beginPath(); g.moveTo(sx - 8, 0); g.lineTo(sx + 8, 0); g.lineTo(sx + Math.sin(a) * 600 + 70, 640); g.lineTo(sx + Math.sin(a) * 600 - 70, 640); g.fill(); }
  g.restore();
  // host on a podium
  g.fillStyle = '#2a2050'; MGH.rr(g, 590, 150, 100, 40, 8); g.fill(); g.fillStyle = '#ff3aa0'; g.fillRect(590, 150, 100, 4);
  Char.npc(g, 640, 118, 28, 'host', { mood: 'cheer', t: m.t });
  // crowd silhouettes at the front
  // stage floor: glossy perspective grid
  GX.vfill(g, 0, 630, 1280, 90, ['#2a1a50', '#140a2a']);
  g.save(); g.strokeStyle = 'rgba(255,60,200,0.35)'; g.lineWidth = 1.5;
  for (let k = -10; k <= 10; k++) { g.beginPath(); g.moveTo(640 + k * 60, 630); g.lineTo(640 + k * 170, 720); g.stroke(); }
  for (let k = 0; k < 4; k++) { const y = 630 + k * k * 7 + k * 6; g.beginPath(); g.moveTo(0, y); g.lineTo(1280, y); g.stroke(); }
  g.restore();
  g.fillStyle = '#ff3aa0'; g.fillRect(0, 628, 1280, 3); MGH.glow(g, 640, 630, 600, 'rgba(255,60,180,0.08)');
  // laser bars: emitter pods with a crackling beam between them
  S.beams.forEach(b => {
    const y = b.low ? 606 : 474, col = b.low ? '255,50,60' : '60,150,255', L = 110, x0 = b.x - L / 2, x1 = b.x + L / 2;
    g.save(); g.globalCompositeOperation = 'lighter';
    const gl = g.createLinearGradient(0, y - 18, 0, y + 18); gl.addColorStop(0, `rgba(${col},0)`); gl.addColorStop(0.5, `rgba(${col},0.55)`); gl.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gl; g.fillRect(x0, y - 18, L, 36);
    g.strokeStyle = `rgb(${col})`; g.lineWidth = 6; g.beginPath(); g.moveTo(x0, y); for (let s = 1; s <= 10; s++) g.lineTo(x0 + L * s / 10, y + (s < 10 ? Math.sin(m.t * 60 + s * 2.1) * 1.5 : 0)); g.stroke();
    g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke();
    // motion trail
    const tr = g.createLinearGradient(b.x - b.dir * 140, 0, b.x, 0); tr.addColorStop(0, `rgba(${col},0)`); tr.addColorStop(1, `rgba(${col},0.25)`); g.fillStyle = tr; g.fillRect(Math.min(b.x - b.dir * 140, b.x), y - 4, 140, 8);
    g.restore();
    [x0, x1].forEach(px => { const pg = g.createRadialGradient(px - 3, y - 4, 1, px, y, 13); pg.addColorStop(0, '#e8e8f8'); pg.addColorStop(1, '#4a4a68'); g.fillStyle = pg; g.beginPath(); g.arc(px, y, 12, 0, 7); g.fill(); g.fillStyle = `rgb(${col})`; g.beginPath(); g.arc(px, y, 4, 0, 7); g.fill(); g.strokeStyle = 'rgba(255,255,255,0.4)'; g.lineWidth = 1; g.beginPath(); g.arc(px, y - 14, 6, 0.4, 2.7); g.stroke(); });
    // little hover thrusters
    MGH.glow(g, b.x, y + 16, 20, `rgba(${col},0.35)`);
  });
  S.p.forEach((p, i) => {
    const x = 200 + i * 290, pl = m.players[i], out = p.hearts <= 0;
    // floor spot
    g.save(); g.globalCompositeOperation = 'lighter'; MGH.glow(g, x, 632, 70, `rgba(255,255,255,${out ? 0.03 : 0.1})`); g.restore();
    GX.shadow(g, x, 632, 34 - Math.min(20, p.y * 0.08), 0.45);
    if (p.duck && !out) {
      // real crouch: drop low and lean forward, gloves over the head
      g.save(); g.translate(x, 600); g.rotate(-0.28);
      Char.draw(g, 0, 0, 30, pl.el.id, pl.color, { mood: 'scared', seed: i, noShadow: true, hands: { n: { x: -0.4, y: -1.25, d: 0, o: true, m: false }, f: { x: 0.35, y: -1.2, d: 0, o: true, m: false } } });
      g.restore();
    } else {
      const air = p.y > 0, tuck = air ? Math.min(1, p.vy > 0 ? 0.6 : 1) : 0;
      g.save(); g.translate(x, 560 - p.y); if (air) g.rotate(Math.sin(Math.min(1, p.y / 120) * Math.PI) * 0.25 * (i % 2 ? 1 : -1));
      Char.draw(g, 0, 0, 32, pl.el.id, pl.color, { mood: out ? 'out' : p.hit > 0 ? 'hurt' : air ? 'cheer' : 'determined', seed: i, alpha: out ? 0.4 : 1, noShadow: true, walk: air ? 0.3 * tuck : 0 });
      g.restore();
    }
    if (p.hit > 0) { g.save(); g.globalCompositeOperation = 'lighter'; MGH.glow(g, x, 560, 60 * p.hit, 'rgba(255,80,80,0.6)'); g.restore(); }
    g.fillStyle = 'rgba(0,0,0,0.4)'; MGH.rr(g, x - 50, 658, 100, 26, 13); g.fill();
    for (let h = 0; h < 3; h++) MGH.heart(g, x - 24 + h * 24, 671, 1.1, h < p.hearts ? '#ff4d6d' : 'rgba(255,255,255,0.2)');
    MGH.text(g, pl.name, x, 708, 16, pl.color, 'center', 'bold');
  });
});

// classic patched football with spin
GX.ball = function (g, x, y, r, rot = 0) {
  g.save(); g.translate(x, y);
  const gr = g.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.7, '#eeeeee'); gr.addColorStop(1, '#a8a8b0');
  g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill();
  g.save(); g.beginPath(); g.arc(0, 0, r, 0, 7); g.clip(); g.rotate(rot); g.fillStyle = '#222';
  const pent = (cx, cy, s) => { g.beginPath(); for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2 - Math.PI / 2; g.lineTo(cx + Math.cos(a) * s, cy + Math.sin(a) * s); } g.closePath(); g.fill(); };
  pent(0, 0, r * 0.32); for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2 + Math.PI / 2; pent(Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9, r * 0.26); }
  g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 1; for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2 + Math.PI / 2; g.beginPath(); g.moveTo(Math.cos(a) * r * 0.3, Math.sin(a) * r * 0.3); g.lineTo(Math.cos(a) * r * 0.7, Math.sin(a) * r * 0.7); g.stroke(); }
  g.restore(); g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 1; g.beginPath(); g.arc(0, 0, r, 0, 7); g.stroke();
  g.restore();
};

// ===================================================================== Penalty Kicks: floodlit stadium, run-up and dive
MG.byId.penalty && (MG.byId.penalty.draw = function (m, S, g) {
  GX.vfill(g, 0, 0, 1280, 210, ['#070c24', '#14204a', '#24386a']);
  for (let k = 0; k < 40; k++) { g.fillStyle = `rgba(255,255,255,${0.3 + 0.3 * Math.sin(m.t * 2 + k)})`; g.fillRect(MGH.hash(k) * 1280, MGH.hash(k + 9) * 70, 2, 2); }
  // stands + crowd + ad boards
  GX.vfill(g, 0, 70, 1280, 140, ['#1a1a30', '#2a2a48']);
  MGH.crowd(g, m.t, 180, 40);
  [[0, '#e8323e'], [320, '#2a6ae8'], [640, '#ffb000'], [960, '#2aa84a']].forEach(([x, c], k) => { g.fillStyle = c; g.fillRect(x, 186, 320, 22); g.fillStyle = 'rgba(255,255,255,0.9)'; g.font = 'bold 15px Georgia'; g.textAlign = 'center'; g.fillText(['FOURFOLD CUP', 'ELEMENTAL FC', 'GOAL!', 'PARTY LEAGUE'][k], x + 160 + Math.sin(m.t + k) * 0, 202); });
  // floodlight towers
  [[70, 30], [1210, 30]].forEach(([x, y]) => { g.fillStyle = '#3a3a50'; g.fillRect(x - 3, y, 6, 160); g.fillStyle = '#5a5a70'; MGH.rr(g, x - 34, y - 14, 68, 28, 4); g.fill(); for (let k = 0; k < 4; k++) { g.fillStyle = '#fffbe0'; g.beginPath(); g.arc(x - 24 + k * 16, y, 6, 0, 7); g.fill(); } MGH.glow(g, x, y, 140, 'rgba(255,250,210,0.3)'); });
  // pitch with mowed stripes and gentle vignette
  for (let k = 0; k < 9; k++) { g.fillStyle = k % 2 ? '#3c9c40' : '#45aa48'; g.fillRect(0, 208 + k * 58, 1280, 58); }
  const vg = g.createRadialGradient(640, 450, 200, 640, 450, 900); vg.addColorStop(0, 'rgba(255,255,220,0.08)'); vg.addColorStop(1, 'rgba(0,0,0,0.3)'); g.fillStyle = vg; g.fillRect(0, 208, 1280, 512);
  // box lines
  g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 4; g.beginPath(); g.moveTo(0, 420); g.lineTo(1280, 420); g.stroke();
  g.beginPath(); g.moveTo(250, 420); g.lineTo(200, 700); g.lineTo(1080, 700); g.lineTo(1030, 420); g.stroke();
  g.beginPath(); g.moveTo(400, 420); g.lineTo(385, 500); g.lineTo(895, 500); g.lineTo(880, 420); g.stroke();
  g.beginPath(); g.ellipse(640, 700, 120, 30, 0, Math.PI, 0); g.stroke();
  g.fillStyle = '#fff'; g.beginPath(); g.ellipse(640, 600, 7, 3, 0, 0, 7); g.fill();
  // goal: back net in perspective, side nets, shaded posts
  const L = 380, Rt = 900, T = 210, B = 420, bk = 30;
  g.fillStyle = 'rgba(255,255,255,0.08)'; g.beginPath(); g.moveTo(L + bk, T + bk * 0.6); g.lineTo(Rt - bk, T + bk * 0.6); g.lineTo(Rt - bk * 0.4, B - 6); g.lineTo(L + bk * 0.4, B - 6); g.fill();
  const bulge = S.ph === 'kick' && !S.saved && S.pt > 0.6 ? Math.max(0, 1 - (S.pt - 0.6) * 1.5) : 0, [bx0, by0] = this.spot(S.ps >= 0 ? S.ps : 0);
  g.strokeStyle = 'rgba(255,255,255,0.4)'; g.lineWidth = 1.2;
  for (let x = L + bk; x <= Rt - bk; x += 18) { g.beginPath(); for (let y = T + bk * 0.6; y <= B; y += 10) { const d = Math.hypot(x - bx0, y - by0), o = bulge * Math.max(0, 1 - d / 120) * 18; g.lineTo(x + (x - 640) * 0.0 , y - o); } g.stroke(); }
  for (let y = T + bk * 0.6; y <= B; y += 16) { g.beginPath(); for (let x = L + bk; x <= Rt - bk; x += 12) { const d = Math.hypot(x - bx0, y - by0), o = bulge * Math.max(0, 1 - d / 120) * 18; g.lineTo(x, y - o); } g.stroke(); }
  [[L, L + bk], [Rt, Rt - bk]].forEach(([a, b]) => { for (let k = 0; k <= 6; k++) { const y = T + k * (B - T) / 6; g.beginPath(); g.moveTo(a, y); g.lineTo(b, T + bk * 0.6 + k * (B - T - bk * 0.6) / 6); g.stroke(); } });
  g.lineCap = 'round'; g.strokeStyle = '#c8ccd8'; g.lineWidth = 12; g.beginPath(); g.moveTo(L, B); g.lineTo(L, T); g.lineTo(Rt, T); g.lineTo(Rt, B); g.stroke();
  g.strokeStyle = '#ffffff'; g.lineWidth = 6; g.beginPath(); g.moveTo(L - 2, B); g.lineTo(L - 2, T - 2); g.lineTo(Rt - 2, T - 2); g.lineTo(Rt - 2, B); g.stroke(); g.lineCap = 'butt';
  GX.shadow(g, 640, B + 4, 280, 0.25);
  if (S.ph === 'pick') [0, 1, 3].forEach(d => { const [x, y] = this.spot(d), pu = 1 + Math.sin(m.t * 4 + d) * 0.06; g.fillStyle = 'rgba(255,255,255,0.14)'; g.beginPath(); g.arc(x, y, 36 * pu, 0, 7); g.fill(); g.strokeStyle = 'rgba(255,255,255,0.4)'; g.lineWidth = 2; g.setLineDash([6, 6]); g.stroke(); g.setLineDash([]); abxyBadge(g, d, x, y, 16); });
  // keeper: crouched sway while waiting, full-stretch dive with after-images
  const kp = m.players[S.keep], kk = S.ph === 'kick' ? Math.min(1, S.pt / 0.4) : 0, [dx, dy] = S.ph === 'kick' ? this.spot(S.pk) : [640, 360];
  const ease = 1 - (1 - kk) * (1 - kk), sway = S.ph === 'pick' ? Math.sin(m.t * 3) * 18 : 0;
  const kx = 640 + sway + (dx - 640) * ease, ky = 350 + (dy - 350) * ease - Math.sin(Math.PI * kk) * (S.pk === 0 ? 40 : 20), rot = S.ph === 'kick' ? (S.pk === 1 ? 1 : S.pk === 3 ? -1 : 0) * ease * 1.25 : 0;
  GX.shadow(g, kx, B - 10, 40, 0.3);
  const keeper = (x, y, a, al) => { g.save(); g.translate(x, y); g.rotate(a); Char.draw(g, 0, 0, 36, kp.el.id, kp.color, { mood: MGH.persona(S.ph === 'kick' && S.pt > 0.6 ? (S.saved ? 'cheer' : 'hurt') : 'determined', kp.el.id), seed: S.keep * 1.7, look: { x: 0, y: 1 }, alpha: al, noShadow: true, walk: S.ph === 'pick' ? 0.3 : 0, hands: { n: { x: -1.3, y: -1.2, d: -130, o: true, m: true }, f: { x: 1.3, y: -1.2, d: -50, o: true, m: false } } }); g.restore(); };
  if (S.ph === 'kick' && kk < 1) for (let k = 3; k >= 1; k--) { const e2 = Math.max(0, ease - k * 0.12); keeper(640 + (dx - 640) * e2, 350 + (dy - 350) * e2, rot * e2 / Math.max(0.01, ease), 0.15); }
  keeper(kx, ky, rot, 1);
  // shooter: run-up then strike
  const sp = m.players[S.sh], run = S.ph === 'kick' ? Math.min(1, S.pt / 0.15) : 0;
  const shX = S.ph === 'pick' ? 540 + Math.sin(m.t * 2) * 3 : 540 + run * 62, shY = S.ph === 'pick' ? 616 : 616 - run * 14;
  GX.shadow(g, shX, shY + 44, 40, 0.4);
  const k = S.ph === 'kick' ? Math.min(1, S.pt / 0.6) : 0, [tx, ty] = this.spot(S.ps >= 0 ? S.ps : 0);
  let ball = [640, 600], sc = 1;
  if (S.ph === 'kick') { if (S.saved && S.pt > 0.6) ball = [tx + (S.pt - 0.6) * 300 * (tx > 640 ? 1 : -1), ty + (S.pt - 0.6) * 200 - Math.sin(Math.min(1, (S.pt - 0.6) * 2) * Math.PI) * 60]; else { const kk2 = Math.min(1, k); ball = [640 + (tx - 640) * kk2, 600 + (ty - 600) * kk2 - Math.sin(Math.PI * kk2) * 40]; if (!S.saved && S.pt > 0.6) ball = [tx + Math.sin(S.pt * 20) * 2 * Math.max(0, 1 - S.pt), ty + Math.min(40, (S.pt - 0.6) * 80)]; } sc = 1 - Math.min(1, k) * 0.45; }
  GX.shadow(g, ball[0], S.ph === 'kick' ? 600 + (Math.min(B + 6, ty + 60) - 600) * Math.min(1, k) : 606, 16 * sc, 0.4);
  Char.draw(g, shX, shY, 36, sp.el.id, sp.color, { mood: MGH.persona(S.ph === 'kick' && S.pt > 0.6 ? (S.saved ? 'hurt' : 'cheer') : 'determined', sp.el.id), seed: S.sh * 1.7, look: { x: 0.4, y: -1 }, walk: S.ph === 'kick' && run < 1 ? 1 : 0, noShadow: true });
  if (S.ph === 'kick' && S.pt < 0.6) { g.save(); g.globalAlpha = 0.5 * (1 - k); g.strokeStyle = '#fff'; g.lineWidth = 3; for (let s = 1; s <= 3; s++) { const kb = Math.max(0, k - s * 0.06); g.beginPath(); g.arc(640 + (tx - 640) * kb, 600 + (ty - 600) * kb - Math.sin(Math.PI * kb) * 40, 14 * (1 - kb * 0.45), 0, 7); g.stroke(); } g.restore(); }
  GX.ball(g, ball[0], ball[1], 15 * sc, S.ph === 'kick' ? S.pt * 18 : 0);
  if (S.ph === 'kick' && S.pt > 0.6) MGH.label(g, S.saved ? (S.tip ? 'FINGERTIP SAVE!' : 'SAVED!') : 'GOAL!', 640, 140, 48, S.saved ? '#9fe0ff' : '#ffe680');
  // scoreboard
  g.fillStyle = 'rgba(10,14,30,0.75)'; MGH.rr(g, 1030, 440, 200, 190, 16); g.fill(); g.strokeStyle = 'rgba(255,255,255,0.2)'; g.lineWidth = 2; g.stroke();
  for (let q = 0; q < 9; q++) { const r = S.log[q], cx = 1090 + (q % 3) * 40, cy = 540 + Math.floor(q / 3) * 34; if (r === 1) GX.ball(g, cx, cy, 12, q); else { g.fillStyle = r === 0 ? '#5ab8ff' : 'rgba(255,255,255,0.15)'; g.beginPath(); g.arc(cx, cy, 12, 0, 7); g.fill(); if (r === 0) MGH.text(g, '🧤', cx, cy + 5, 13, '#fff'); } }
  MGH.text(g, `Goals ${S.goals}/6`, 1130, 474, 20, '#ffe680', 'center', 'bold'); MGH.text(g, `Saves ${S.saves}/4`, 1130, 500, 20, '#9fe0ff', 'center', 'bold');
  if (S.ph === 'pick') { MGH.label(g, `${sp.name} shoots${S.ps >= 0 ? ' ✔' : '…'}`, 170, 560, 20, sp.color); MGH.label(g, `${kp.name} keeps${S.pk >= 0 ? ' ✔' : '…'}`, 1130, 410, 20, kp.color); }
});

// ===================================================================== Tag-Team Sumo: a real dohyo and lively wrestlers
MG.byId.tagsumo && (MG.byId.tagsumo.draw = function (m, S, g) {
  const CX = this.CX, CY = this.CY, RR = this.RR;
  GX.vfill(g, 0, 0, 1280, 720, ['#2a1a12', '#4a2e1a', '#2a1a10']);
  // arena lanterns + crowd
  for (let k = 0; k < 10; k++) { const x = 64 + k * 128, y = 66 + Math.sin(m.t + k) * 2; MGH.glow(g, x, y, 50, 'rgba(255,170,80,0.35)'); g.fillStyle = '#e8483a'; MGH.rr(g, x - 12, y - 16, 24, 32, 10); g.fill(); g.fillStyle = '#2a1a10'; g.fillRect(x - 8, y - 19, 16, 4); g.fillRect(x - 8, y + 15, 16, 4); }
  MGH.crowd(g, m.t, 150, 34, ['#6a3a2a', '#3a4a6a', '#5a5a2a', '#4a2a4a']);
  // raised clay platform (square, seen from above at an angle)
  g.fillStyle = '#7a5434'; g.beginPath(); g.moveTo(CX - RR - 90, CY - RR - 30); g.lineTo(CX + RR + 90, CY - RR - 30); g.lineTo(CX + RR + 130, CY + RR + 80); g.lineTo(CX - RR - 130, CY + RR + 80); g.fill();
  g.fillStyle = '#5a3a22'; g.beginPath(); g.moveTo(CX - RR - 130, CY + RR + 80); g.lineTo(CX + RR + 130, CY + RR + 80); g.lineTo(CX + RR + 130, CY + RR + 110); g.lineTo(CX - RR - 130, CY + RR + 110); g.fill();
  const clay = g.createRadialGradient(CX, CY, 40, CX, CY, RR + 80); clay.addColorStop(0, '#e8cf98'); clay.addColorStop(1, '#c8a46a'); g.fillStyle = clay;
  g.beginPath(); g.moveTo(CX - RR - 70, CY - RR - 18); g.lineTo(CX + RR + 70, CY - RR - 18); g.lineTo(CX + RR + 104, CY + RR + 70); g.lineTo(CX - RR - 104, CY + RR + 70); g.fill();
  // swept sand ring inside
  const sand = g.createRadialGradient(CX - 60, CY - 60, 20, CX, CY, RR); sand.addColorStop(0, '#f6e6bc'); sand.addColorStop(1, '#e2c88e'); g.fillStyle = sand; g.beginPath(); g.arc(CX, CY, RR, 0, 7); g.fill();
  g.save(); g.globalAlpha = 0.08; g.strokeStyle = '#7a5a2a'; g.lineWidth = 2; for (let k = 1; k < 8; k++) { g.beginPath(); g.arc(CX, CY, k * RR / 8, 0, 7); g.stroke(); } g.restore();
  // straw bales around the edge
  for (let k = 0; k < 28; k++) { const a = k / 28 * Math.PI * 2, x = CX + Math.cos(a) * (RR + 8), y = CY + Math.sin(a) * (RR + 8); g.save(); g.translate(x, y); g.rotate(a + Math.PI / 2); const bg = g.createLinearGradient(0, -8, 0, 8); bg.addColorStop(0, '#e8d08a'); bg.addColorStop(1, '#a8884a'); g.fillStyle = bg; MGH.rr(g, -30, -9, 58, 18, 8); g.fill(); g.strokeStyle = 'rgba(90,60,20,0.6)'; g.lineWidth = 1.5; for (let s = -18; s <= 18; s += 12) { g.beginPath(); g.moveTo(s, -8); g.lineTo(s, 8); g.stroke(); } g.restore(); }
  // starting lines
  g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 5; g.lineCap = 'round'; [[-40], [40]].forEach(([dx]) => { g.beginPath(); g.moveTo(CX + dx, CY - 22); g.lineTo(CX + dx, CY + 22); g.stroke(); }); g.lineCap = 'butt';
  // hanging roof tassels in the corners
  [['#3a7ae8', CX - RR - 70, CY - RR - 18], ['#e84a3a', CX + RR + 70, CY - RR - 18]].forEach(([c, x, y], k) => { const sw = Math.sin(m.t * 1.5 + k) * 4; g.strokeStyle = c; g.lineWidth = 4; g.beginPath(); g.moveTo(x, y - 90); g.lineTo(x + sw, y - 20); g.stroke(); g.fillStyle = c; g.beginPath(); g.moveTo(x + sw - 12, y - 20); g.lineTo(x + sw + 12, y - 20); g.lineTo(x + sw + 6, y + 14); g.lineTo(x + sw - 6, y + 14); g.fill(); g.fillStyle = 'rgba(255,255,255,0.2)'; g.fillRect(x + sw - 10, y - 20, 4, 30); });
  // scoreboard banners
  [[0, 440], [1, 840]].forEach(([tm, x]) => { g.fillStyle = MG.TEAMC[tm]; g.beginPath(); g.moveTo(x - 56, 44); g.lineTo(x + 56, 44); g.lineTo(x + 56, 110); g.lineTo(x, 124); g.lineTo(x - 56, 110); g.fill(); g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 3; g.stroke(); MGH.text(g, `${S.ko[tm]}`, x, 104, 48, '#fff', 'center', 'bold'); MGH.text(g, MG.TEAMN[tm], x, 62, 16, '#fff', 'center', 'bold'); });
  const ents = S.b.map((b, i) => ({ y: b.y, f: () => {
    const p = m.players[i], r = b.r * 1.3;
    if (b.out > 0) { // launched out of the ring: arc up, spin, shrink into the crowd
      if (b.fall > 1.3) return; const k = b.fall / 1.3, ox = b.vx * 0.15 * k, oy = -Math.sin(k * Math.PI) * 140 + k * 60;
      g.save(); g.globalAlpha = 1 - k * 0.8; g.translate(b.x + ox, b.y + oy); g.rotate(b.fall * 9); g.scale(1 - k * 0.5, 1 - k * 0.5);
      Char.draw(g, 0, 0, r, p.el.id, p.color, { mood: MGH.persona('hurt', p.el.id), seed: i * 1.7, noShadow: true }); g.restore();
      if (k < 0.3) MGH.star && MGH.star(g, b.x, b.y, 30 * (1 - k * 3), '#ffe680'); return;
    }
    const sp = Math.hypot(b.vx, b.vy), dc = dist(b.x, b.y, CX, CY), teeter = dc > RR - 34 && b.dash <= 0;
    GX.shadow(g, b.x, b.y + r * 1.25, 34, 0.35);
    g.fillStyle = MG.TEAMC[b.tm]; g.globalAlpha = 0.55; g.beginPath(); g.ellipse(b.x, b.y + r * 1.25, 30, 9, 0, 0, 7); g.fill(); g.globalAlpha = 1;
    // charge: crouch back, tremble, dust stomps, filling ring
    let lean = 0, tx = 0, mood = 'happy';
    if (b.ch > 0) { const a = Math.atan2(b.face ? b.face.y : 0, b.face ? b.face.x : 1); lean = -Math.cos(a) * 0.25 * b.ch; tx = Math.sin(m.t * 60) * 2 * b.ch; mood = 'effort';
      g.strokeStyle = `rgba(255,200,80,${0.5 + b.ch * 0.5})`; g.lineWidth = 5; g.beginPath(); g.arc(b.x, b.y + r * 1.25, 34, -Math.PI / 2, -Math.PI / 2 + b.ch * Math.PI * 2); g.stroke();
      for (let k = 0; k < 3; k++) { const ph = (m.t * 2 + k / 3) % 1; g.fillStyle = `rgba(200,170,120,${0.5 * (1 - ph)})`; g.beginPath(); g.arc(b.x + (k - 1) * 22 + ph * (k - 1) * 14, b.y + r * 1.2 - ph * 14, 5 + ph * 8, 0, 7); g.fill(); } }
    else if (b.dash > 0) { lean = clamp(b.vx / 700, -0.5, 0.5); mood = 'determined';
      for (let k = 1; k <= 3; k++) { g.save(); g.globalAlpha = 0.18; Char.draw(g, b.x - b.vx * 0.025 * k, b.y - b.vy * 0.025 * k, r, p.el.id, p.color, { mood: 'determined', seed: i * 1.7, noShadow: true, look: { x: b.vx > 0 ? 1 : -1, y: 0 } }); g.restore(); }
      g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 3; const n = Math.hypot(b.vx, b.vy) || 1; for (let k = -1; k <= 1; k++) { const px = -b.vy / n * k * 18, py = b.vx / n * k * 18; g.beginPath(); g.moveTo(b.x + px - b.vx / n * 40, b.y + py - b.vy / n * 40); g.lineTo(b.x + px - b.vx / n * 90, b.y + py - b.vy / n * 90); g.stroke(); } }
    else if (teeter) { lean = Math.sin(m.t * 14 + i) * 0.22; mood = 'scared'; }
    else if (sp > 60) { lean = clamp(b.vx / 900, -0.2, 0.2); mood = 'determined'; }
    if (b.inv > 0 && Math.floor(m.t * 12) % 2) g.globalAlpha = 0.55;
    g.save(); g.translate(b.x + tx, b.y + r * 1.25); g.rotate(lean);
    const look = b.ch > 0 || b.dash > 0 ? { x: (b.face && b.face.x) || (b.vx > 0 ? 1 : -1), y: 0 } : b.face;
    Char.draw(g, 0, -r * 1.25, r, p.el.id, p.color, { mood: MGH.persona(mood, p.el.id), seed: i * 1.7, noShadow: true, look, walk: sp > 40 ? 1 : 0, hands: teeter ? { n: { x: -1.4, y: -1.0 + Math.sin(m.t * 18) * 0.4, d: -90, o: true, m: false }, f: { x: 1.3, y: -1.0 + Math.cos(m.t * 18) * 0.4, d: -90, o: true, m: false } } : undefined });
    g.restore(); g.globalAlpha = 1;
    if (teeter) MGH.text(g, '!', b.x, b.y - r * 1.6, 28, '#ff6a4a', 'center', 'bold');
  } }));
  ents.sort((a, b) => a.y - b.y).forEach(e => e.f());
});

// ===================================================================== Critter Count: proper bunnies, ducks and frogs (all face left, the way the parade moves)
MG.byId.critters && (MG.byId.critters.critter = function (g, k, x, y, s, t) {
  const ph = (t * 1.5) % 1;
  g.save();
  if (k === 0) { // bunny: crouch, leap with stretched body, land
    const hop = Math.sin(ph * Math.PI), stretch = hop * 0.25;
    GX.shadow(g, x, y + 24 * s, 22 * s * (1 - hop * 0.3), 0.3);
    g.translate(x, y - hop * 26 * s); g.scale(s, s); g.rotate(-0.25 * Math.cos(ph * Math.PI));
    const fur = g.createRadialGradient(-6, -6, 2, 0, 0, 26); fur.addColorStop(0, '#ffffff'); fur.addColorStop(1, '#d8d4e0');
    g.fillStyle = '#e8e4ee'; g.beginPath(); g.ellipse(14 + stretch * 10, 16, 9, 5 + stretch * 4, 0.4, 0, 7); g.fill(); // hind foot
    g.fillStyle = fur; g.beginPath(); g.ellipse(4, 2, 22 * (1 + stretch), 17 * (1 - stretch * 0.4), 0, 0, 7); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(25 + stretch * 6, -2, 7, 0, 7); g.fill(); // cotton tail
    g.fillStyle = '#e8e4ee'; g.beginPath(); g.ellipse(-16 - stretch * 8, 14, 7, 4, -0.3, 0, 7); g.fill(); // front paw
    g.fillStyle = fur; g.beginPath(); g.arc(-16, -10, 13, 0, 7); g.fill(); // head
    [[-14, 0.15], [-8, 0.45]].forEach(([ex, a], q) => { g.save(); g.translate(ex, -20); g.rotate(a + Math.sin(t * 6 + q) * 0.08 + hop * 0.3); g.fillStyle = q ? '#e0dce8' : '#fff'; g.beginPath(); g.ellipse(0, -14, 5.5, 15, 0, 0, 7); g.fill(); g.fillStyle = '#ffb0c8'; g.beginPath(); g.ellipse(0, -13, 2.5, 10, 0, 0, 7); g.fill(); g.restore(); });
    g.fillStyle = '#2a1a2a'; g.beginPath(); g.arc(-21, -13, 2.8, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(-22, -14, 1, 0, 7); g.fill();
    g.fillStyle = '#ff8ab8'; g.beginPath(); g.arc(-28.5, -8, 2.2, 0, 7); g.fill(); g.fillStyle = 'rgba(255,140,170,0.4)'; g.beginPath(); g.arc(-18, -5, 3.5, 0, 7); g.fill();
    g.strokeStyle = 'rgba(120,100,120,0.5)'; g.lineWidth = 0.8; for (let w = -1; w <= 1; w++) { g.beginPath(); g.moveTo(-27, -7); g.lineTo(-36, -7 + w * 3); g.stroke(); }
  } else if (k === 1) { // duck: waddle side to side with paddling feet
    const wad = Math.sin(t * 10);
    GX.shadow(g, x, y + 24 * s, 22 * s, 0.3);
    g.translate(x, y); g.scale(s, s); g.rotate(wad * 0.1);
    g.fillStyle = '#ff9a2a'; [[-6, wad], [6, -wad]].forEach(([fx, w]) => { g.beginPath(); g.moveTo(fx, 14); g.lineTo(fx - 7 + w * 3, 22 - Math.max(0, w) * 4); g.lineTo(fx + 5 + w * 3, 22 - Math.max(0, w) * 4); g.fill(); });
    const bd = g.createRadialGradient(-4, -2, 2, 0, 4, 26); bd.addColorStop(0, '#fff3a8'); bd.addColorStop(1, '#f0c838'); g.fillStyle = bd;
    g.beginPath(); g.moveTo(-18, 2); g.quadraticCurveTo(-20, 18, 2, 18); g.quadraticCurveTo(22, 18, 26, -2); g.lineTo(30, -8); g.quadraticCurveTo(20, -4, 10, -6); g.quadraticCurveTo(-4, -8, -18, 2); g.fill();
    g.fillStyle = '#f0c030'; g.beginPath(); g.ellipse(6, 4, 12, 7, -0.2 + Math.sin(t * 20) * 0.05, 0, 7); g.fill(); g.strokeStyle = 'rgba(180,130,20,0.6)'; g.lineWidth = 1; g.beginPath(); g.arc(8, 4, 7, 0.2, 2.2); g.stroke();
    g.fillStyle = bd; g.beginPath(); g.arc(-14, -14, 11, 0, 7); g.fill();
    g.fillStyle = '#ff8a2a'; g.beginPath(); g.moveTo(-23, -15); g.quadraticCurveTo(-34, -16, -35, -11); g.quadraticCurveTo(-30, -8, -22, -10); g.fill(); g.strokeStyle = '#c85a10'; g.lineWidth = 1; g.beginPath(); g.moveTo(-34, -12); g.lineTo(-24, -12); g.stroke();
    g.fillStyle = '#2a1a10'; g.beginPath(); g.arc(-17, -17, 2.6, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(-18, -18, 0.9, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,130,80,0.35)'; g.beginPath(); g.arc(-12, -10, 3, 0, 7); g.fill();
    g.fillStyle = '#ffe680'; g.beginPath(); g.moveTo(-12, -25); g.quadraticCurveTo(-9, -32, -6, -26); g.fill();
  } else { // frog: crouch, big leap with legs kicked out
    const hop = Math.sin(ph * Math.PI), air = hop > 0.15;
    GX.shadow(g, x, y + 22 * s, 22 * s * (1 - hop * 0.4), 0.3);
    g.translate(x, y - hop * 30 * s); g.scale(s, s); g.rotate(air ? -0.15 : 0);
    g.fillStyle = '#4a9a2a';
    if (air) { g.beginPath(); g.ellipse(24, 10, 16, 4, 0.3, 0, 7); g.fill(); g.beginPath(); g.ellipse(-22, 12, 9, 3, -0.6, 0, 7); g.fill(); }
    else { g.beginPath(); g.ellipse(14, 12, 12, 8, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(-12, 14, 6, 4, 0, 0, 7); g.fill(); }
    const fb = g.createRadialGradient(-4, -6, 2, 0, 2, 26); fb.addColorStop(0, '#a8ea6a'); fb.addColorStop(1, '#4fa82e'); g.fillStyle = fb;
    g.beginPath(); g.ellipse(0, 4, 24, 15 + (air ? -2 : 1), 0, 0, 7); g.fill();
    g.fillStyle = '#f4f0c0'; g.beginPath(); g.ellipse(-4, 12, 16, 6, 0, 0, Math.PI); g.fill();
    g.fillStyle = 'rgba(40,110,30,0.6)'; [[6, -2, 4], [14, 4, 3], [-2, -6, 2.5]].forEach(([sx, sy, sr]) => { g.beginPath(); g.arc(sx, sy, sr, 0, 7); g.fill(); });
    g.fillStyle = fb; [[-14, -10], [-2, -12]].forEach(([ex, ey]) => { g.beginPath(); g.arc(ex, ey, 8, 0, 7); g.fill(); });
    [[-14, -11], [-2, -13]].forEach(([ex, ey]) => { g.fillStyle = '#fff'; g.beginPath(); g.arc(ex, ey, 5.5, 0, 7); g.fill(); g.fillStyle = '#1a1a1a'; g.beginPath(); g.ellipse(ex - 1, ey, 2.5, 3.5, 0, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(ex - 2, ey - 1.5, 1, 0, 7); g.fill(); });
    g.strokeStyle = '#2a6a1a'; g.lineWidth = 1.6; g.beginPath(); g.arc(-12, 0, 9, 0.3, 1.9); g.stroke();
    g.fillStyle = 'rgba(255,120,120,0.35)'; g.beginPath(); g.arc(-18, 1, 3, 0, 7); g.fill();
  }
  g.restore();
});

// ===================================================================== Marble Maze: smooth, weighty tilt with depth, raised walls and moving shadows
MG.byId.marble && (MG.byId.marble.draw = function (m, S, g) {
  GX.vfill(g, 0, 0, 1280, 720, ['#4a2e20', '#5a3a28', '#2e1c12']);
  // table top with planks
  for (let k = 0; k < 6; k++) GX.plank(g, -10, 480 + k * 42, 1300, 40, '#6a4428', '#3a2414', k);
  MGH.glow(g, 640, 300, 700, 'rgba(255,220,160,0.12)');
  const MZ = typeof MAZES !== 'undefined' ? MAZES : [];
  for (let i = 0; i < 4; i++) {
    const P = S.p[i], p = m.players[i], ox = this.ox(i), Z = MZ[P.mz % 3], a = m.axis(i);
    P.sx = (P.sx || 0) + (a.x - (P.sx || 0)) * Math.min(1, m.dt * 7 || 0.12); P.sy = (P.sy || 0) + (a.y - (P.sy || 0)) * Math.min(1, m.dt * 7 || 0.12);
    const sx = P.sx, sy = P.sy, cx = ox + 160, cy = 310, fx = 0.94 * (1 - Math.abs(sx) * 0.12), fy = 0.94 * (1 - Math.abs(sy) * 0.16), kx = sx * 0.13, ky = sy * 0.13;
    const T = (u, v) => [cx + fx * ((u - 160) + kx * (v - 160)), cy + fy * (ky * (u - 160) + (v - 160))];
    // gimbal frame + knobs
    g.fillStyle = '#3a2414'; MGH.rr(g, cx - 168, cy - 168, 336, 336 + 24, 10); g.fill();
    g.fillStyle = 'rgba(0,0,0,0.45)'; g.beginPath(); const sh = [T(0, 0), T(320, 0), T(320, 320), T(0, 320)].map(([x, y]) => [x + 10 + sx * 8, y + 14 + sy * 8]); sh.forEach(([x, y], k) => k ? g.lineTo(x, y) : g.moveTo(x, y)); g.fill();
    // board thickness (front + one side, depending on tilt)
    const D = 14 + sy * 8, [blx, bly] = T(0, 320), [brx, bry] = T(320, 320), [trx, try_] = T(320, 0), [tlx, tly] = T(0, 0);
    g.fillStyle = '#8a6434'; g.beginPath(); g.moveTo(blx, bly); g.lineTo(brx, bry); g.lineTo(brx, bry + D); g.lineTo(blx, bly + D); g.fill();
    if (sx > 0.05) { g.fillStyle = '#6a4a24'; g.beginPath(); g.moveTo(tlx, tly); g.lineTo(blx, bly); g.lineTo(blx - sx * 10, bly + D); g.lineTo(tlx - sx * 10, tly + D * 0.6); g.fill(); }
    if (sx < -0.05) { g.fillStyle = '#6a4a24'; g.beginPath(); g.moveTo(trx, try_); g.lineTo(brx, bry); g.lineTo(brx - sx * 10, bry + D); g.lineTo(trx - sx * 10, try_ + D * 0.6); g.fill(); }
    g.save(); g.translate(cx, cy); g.scale(fx, fy); g.transform(1, ky, kx, 1, 0, 0); g.translate(-160, -160);
    // top surface: wood with a light sheen that slides with the tilt
    g.fillStyle = MGH.grad(g, 0, 320, ['#e2c48c', '#c8a466']); g.fillRect(0, 0, 320, 320);
    for (let k = 0; k < 10; k++) { g.strokeStyle = 'rgba(120,80,40,0.13)'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 16 + k * 32); g.bezierCurveTo(100, 10 + k * 32, 200, 24 + k * 32, 320, 18 + k * 32); g.stroke(); }
    const sheen = g.createRadialGradient(160 - sx * 120, 160 - sy * 120, 10, 160 - sx * 120, 160 - sy * 120, 220); sheen.addColorStop(0, 'rgba(255,250,230,0.35)'); sheen.addColorStop(1, 'rgba(255,250,230,0)'); g.fillStyle = sheen; g.fillRect(0, 0, 320, 320);
    const dark = g.createLinearGradient(160 + sx * 160, 160 + sy * 160, 160 - sx * 160, 160 - sy * 160); dark.addColorStop(0, `rgba(40,20,0,${0.18 * Math.hypot(sx, sy)})`); dark.addColorStop(1, 'rgba(40,20,0,0)'); g.fillStyle = dark; g.fillRect(0, 0, 320, 320);
    g.strokeStyle = '#6a4a24'; g.lineWidth = 9; g.strokeRect(0, 0, 320, 320); g.strokeStyle = 'rgba(255,255,255,0.25)'; g.lineWidth = 2; g.strokeRect(5, 5, 310, 310);
    if (Z) {
      Z.holes.forEach(([hx, hy]) => { const hg = g.createRadialGradient(hx + 3, hy + 3, 2, hx, hy, 16); hg.addColorStop(0, '#000'); hg.addColorStop(0.8, '#1a0e08'); hg.addColorStop(1, '#6a4a2a'); g.fillStyle = hg; g.beginPath(); g.arc(hx, hy, 15, 0, 7); g.fill(); g.strokeStyle = '#8a6a3a'; g.lineWidth = 2; g.stroke(); });
      const ex = -sx * 3 - 2, ey = -sy * 3 - 5; // raised walls: shadow, side, top
      Z.walls.forEach(([wx, wy, ww, wh]) => { g.fillStyle = 'rgba(40,20,0,0.35)'; g.fillRect(wx + 4 + sx * 4, wy + 5 + sy * 4, ww, wh); });
      Z.walls.forEach(([wx, wy, ww, wh]) => { g.fillStyle = '#6a4a22'; g.fillRect(wx, wy, ww, wh); g.fillStyle = MGH.grad(g, wy + ey, wy + ey + wh, ['#b08a54', '#94703e']); g.fillRect(wx + ex, wy + ey, ww, wh); g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(wx + ex, wy + ey, ww, 3); });
    }
    MGH.glow(g, 295, 25, 34 + Math.sin(m.t * 4) * 4, 'rgba(255,220,100,0.7)'); MGH.star(g, 295, 25, 15, '#ffd34d', m.t);
    g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 2; g.setLineDash([4, 4]); g.beginPath(); g.arc(30, 290, 16, 0, 7); g.stroke(); g.setLineDash([]);
    // marble: contact shadow that shifts with tilt, glossy body, rolling stripe
    const sc = P.fall > 0 ? P.fall / 0.8 : 1;
    if (sc > 0.05) {
      g.fillStyle = 'rgba(30,15,0,0.35)'; g.beginPath(); g.ellipse(P.x + 4 + sx * 3, P.y + 5 + sy * 3, 10 * sc, 7 * sc, 0, 0, 7); g.fill();
      const gr = g.createRadialGradient(P.x - 3 - sx * 2, P.y - 4 - sy * 2, 1, P.x, P.y, 11 * sc); gr.addColorStop(0, '#fff'); gr.addColorStop(0.35, p.color); gr.addColorStop(1, Char.shade(p.color, -0.6)); g.fillStyle = gr; g.beginPath(); g.arc(P.x, P.y, 11 * sc, 0, 7); g.fill();
      g.save(); g.beginPath(); g.arc(P.x, P.y, 11 * sc, 0, 7); g.clip(); g.strokeStyle = 'rgba(255,255,255,0.45)'; g.lineWidth = 2.5; const roll = (P.x + P.y) * 0.15; g.beginPath(); g.ellipse(P.x, P.y, 11 * sc * Math.abs(Math.cos(roll)), 11 * sc, Math.atan2(P.vy, P.vx), 0, 7); g.stroke(); g.restore();
    }
    g.restore();
    // knobs on the frame turn with the tilt
    [[cx - 120, sx], [cx + 120, sy]].forEach(([kx2, v]) => { const ky2 = cy + 176; g.fillStyle = '#c8a060'; g.beginPath(); g.arc(kx2, ky2, 14, 0, 7); g.fill(); g.strokeStyle = '#5a3a1a'; g.lineWidth = 3; g.beginPath(); g.moveTo(kx2, ky2); g.lineTo(kx2 + Math.sin(v * 1.4) * 12, ky2 - Math.cos(v * 1.4) * 12); g.stroke(); });
    // the player leans into the tilt
    g.save(); g.translate(ox + 160, 610); g.rotate(sx * 0.16);
    Char.draw(g, 0, -50, 34, p.el.id, p.color, { mood: MGH.persona(P.fall > 0 ? 'hurt' : Math.hypot(P.vx, P.vy) > 150 ? 'scared' : 'determined', p.el.id), seed: i * 1.7, look: { x: a.x, y: -0.5 }, hands: { n: { x: -1.1 + sx * 0.2, y: -1.2 - sx * 0.2, d: -120, o: false, m: true }, f: { x: 1.1 + sx * 0.2, y: -1.2 + sx * 0.2, d: -60, o: false, m: false } } });
    g.restore();
    g.fillStyle = 'rgba(0,0,0,0.4)'; MGH.rr(g, ox + 85, 670, 150, 32, 16); g.fill();
    MGH.text(g, `${p.name}  🏁 ${P.goals}`, ox + 160, 693, 19, p.color, 'center', 'bold');
  }
});

// shiny apple
GX.apple = function (g, x, y, r, rot = 0) { g.save(); g.translate(x, y); g.rotate(rot); const gr = g.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r * 1.1); gr.addColorStop(0, '#ff9a8a'); gr.addColorStop(0.5, '#e8322a'); gr.addColorStop(1, '#8a1410'); g.fillStyle = gr; g.beginPath(); g.moveTo(0, -r * 0.7); g.bezierCurveTo(r * 0.9, -r * 1.2, r * 1.3, r * 0.4, 0, r); g.bezierCurveTo(-r * 1.3, r * 0.4, -r * 0.9, -r * 1.2, 0, -r * 0.7); g.fill(); g.strokeStyle = '#5a3a1a'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, -r * 0.6); g.lineTo(r * 0.15, -r * 1.15); g.stroke(); g.fillStyle = '#4ab83a'; g.beginPath(); g.ellipse(r * 0.4, -r * 1.0, r * 0.35, r * 0.15, -0.5, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,0.55)'; g.beginPath(); g.ellipse(-r * 0.4, -r * 0.25, r * 0.18, r * 0.3, 0.4, 0, 7); g.fill(); g.restore(); };
// beehive with buzzing bees
GX.hive = function (g, x, y, s, t) { g.save(); g.translate(x, y); g.scale(s, s); for (let k = 0; k < 5; k++) { const w = [9, 14, 16, 15, 11][k]; const gr = g.createLinearGradient(-w, 0, w, 0); gr.addColorStop(0, '#b8862a'); gr.addColorStop(0.4, '#f4c84a'); gr.addColorStop(1, '#a87420'); g.fillStyle = gr; MGH.rr(g, -w, -18 + k * 7.5, w * 2, 8, 4); g.fill(); } g.fillStyle = '#3a2410'; g.beginPath(); g.ellipse(0, 12, 4, 3, 0, 0, 7); g.fill(); for (let k = 0; k < 3; k++) { const a = t * 6 + k * 2.1, bx = Math.cos(a) * 22, by = Math.sin(a * 1.3) * 14 - 4; g.fillStyle = '#ffd030'; g.beginPath(); g.ellipse(bx, by, 4, 3, 0, 0, 7); g.fill(); g.fillStyle = '#222'; g.fillRect(bx - 1, by - 3, 2, 6); g.fillStyle = 'rgba(255,255,255,0.7)'; g.beginPath(); g.ellipse(bx, by - 4, 3, 2, Math.sin(t * 40) * 0.5, 0, 7); g.fill(); } g.restore(); };
// leafy canopy cluster
GX.canopy = function (g, x, y, r, base, seed, t) {
  const pts = [[0, 0, 1], [-0.55, 0.15, 0.7], [0.55, 0.15, 0.7], [-0.3, -0.45, 0.65], [0.32, -0.42, 0.65], [0, 0.4, 0.7]];
  g.fillStyle = Char.shade(base, -0.3); pts.forEach(([dx, dy, s]) => { g.beginPath(); g.arc(x + dx * r, y + dy * r + 6, r * s * 0.62, 0, 7); g.fill(); });
  pts.forEach(([dx, dy, s], k) => { const cx = x + dx * r + Math.sin(t * 1.2 + k + seed) * 1.5, cy = y + dy * r; const gr = g.createRadialGradient(cx - r * 0.2, cy - r * 0.25, 2, cx, cy, r * s * 0.62); gr.addColorStop(0, Char.shade(base, 0.3)); gr.addColorStop(1, base); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, r * s * 0.58, 0, 7); g.fill(); });
  g.fillStyle = 'rgba(255,255,255,0.12)'; for (let k = 0; k < 10; k++) { const a = MGH.hash(k + seed) * 6.28, d = MGH.hash(k + seed + 3) * r * 0.8; g.beginPath(); g.ellipse(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.8, 6, 3, a, 0, 7); g.fill(); }
};

// ===================================================================== Fruit Tree: orchard with real trees, apples, hives and a wicker basket
MG.byId.fruittree && (MG.byId.fruittree.draw = function (m, S, g) {
  GX.vfill(g, 0, 0, 1280, 470, ['#68b8f0', '#a8dcf8', '#e8f6ff']);
  MGH.glow(g, 640, 70, 200, 'rgba(255,250,200,0.5)');
  [[150, 80], [640, 60], [1100, 100]].forEach(([x, y], k) => MGH.cloud(g, (x + m.t * (5 + k * 2)) % 1400 - 60, y, 30 + k * 3));
  g.fillStyle = '#9ccf7a'; g.beginPath(); g.moveTo(0, 480); for (let x = 0; x <= 1280; x += 40) g.lineTo(x, 430 - Math.sin(x * 0.006) * 40 - Math.sin(x * 0.017) * 10); g.lineTo(1280, 480); g.fill();
  GX.vfill(g, 0, 460, 1280, 260, ['#6abf4a', '#4ea23a', '#3a8a2e']);
  for (let k = 0; k < 70; k++) { const x = MGH.hash(k) * 1280, y = 480 + MGH.hash(k + 7) * 230; g.strokeStyle = 'rgba(30,90,20,0.45)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 3, y - 9); g.moveTo(x, y); g.lineTo(x + 3, y - 8); g.stroke(); if (k % 5 === 0) { g.fillStyle = ['#fff', '#ffe060', '#ff9ad0'][k % 3]; g.beginPath(); g.arc(x, y - 9, 3, 0, 7); g.fill(); } }
  // picket fence in the back
  for (let x = 0; x < 1280; x += 34) { g.fillStyle = '#f4ecdc'; g.beginPath(); g.moveTo(x, 470); g.lineTo(x, 432); g.lineTo(x + 9, 424); g.lineTo(x + 18, 432); g.lineTo(x + 18, 470); g.fill(); } g.fillStyle = '#e0d4bc'; g.fillRect(0, 440, 1280, 6); g.fillRect(0, 458, 1280, 6);
  S.tm.forEach((T, tm) => {
    const cx = tm ? 960 : 320, R_ = this.roles(S, tm), sh = T.shook ? Math.sin(m.t * 60) * 7 : 0;
    GX.shadow(g, cx, 645, 220, 0.3);
    // trunk with bark
    const tr = g.createLinearGradient(cx - 26, 0, cx + 26, 0); tr.addColorStop(0, '#4a2e18'); tr.addColorStop(0.45, '#8a5a32'); tr.addColorStop(1, '#3a2010'); g.fillStyle = tr;
    g.beginPath(); g.moveTo(cx - 30, 645); g.quadraticCurveTo(cx - 18, 500, cx - 20, 330); g.lineTo(cx + 20, 330); g.quadraticCurveTo(cx + 18, 500, cx + 30, 645); g.fill();
    g.strokeStyle = 'rgba(30,15,5,0.4)'; g.lineWidth = 2; for (let k = 0; k < 7; k++) { g.beginPath(); g.moveTo(cx - 12 + k * 4, 360 + k * 30); g.quadraticCurveTo(cx - 8 + k * 3, 400 + k * 30, cx - 10 + k * 4, 430 + k * 30); g.stroke(); }
    g.fillStyle = '#2a1608'; g.beginPath(); g.ellipse(cx + 4, 470, 6, 9, 0, 0, 7); g.fill();
    this.BR.forEach((bx, k) => {
      const s = T.shook && T.shook.br === k ? sh : 0, glow = k === T.glow;
      g.strokeStyle = '#6a4224'; g.lineWidth = 16; g.lineCap = 'round'; g.beginPath(); g.moveTo(cx, 350); g.quadraticCurveTo(cx + bx * 0.5, 300, cx + bx + s, 230); g.stroke(); g.strokeStyle = 'rgba(255,220,180,0.15)'; g.lineWidth = 4; g.stroke(); g.lineCap = 'butt';
      if (glow) MGH.glow(g, cx + bx, 190, 110, 'rgba(255,240,120,0.55)');
      GX.canopy(g, cx + bx + s, 185, 88, glow ? '#4cb83a' : '#3f9a34', k + tm * 3, m.t);
      if (glow) { for (let q = 0; q < 5; q++) GX.apple(g, cx + bx + s + Math.cos(q * 1.3 + 0.4) * 44, 196 + Math.sin(q * 1.3 + 0.4) * 30, 11, Math.sin(m.t * 2 + q) * 0.1); for (let q = 0; q < 4; q++) { const a = m.t * 2 + q * 1.6; MGH.star(g, cx + bx + Math.cos(a) * 70, 185 + Math.sin(a) * 50, 5, '#fff8c0', a); } }
      if (T.shook && T.shook.br === k) for (let q = 0; q < 6; q++) { const ph = (0.3 - T.shook.t) / 0.3, lx = cx + bx + (q - 2.5) * 25, ly = 230 + ph * 80 + q * 6; g.fillStyle = '#5ab83a'; g.beginPath(); g.ellipse(lx + Math.sin(ph * 10 + q) * 10, ly, 6, 3, ph * 6 + q, 0, 7); g.fill(); }
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.arc(cx + bx, 84, 15, 0, 7); g.fill(); MGH.text(g, ['◀', '▲', '▶'][k], cx + bx, 91, 18, glow ? '#ffe680' : '#fff', 'center', 'bold');
    });
    T.drops.forEach(f => { if (f.bad) { GX.hive(g, f.x, f.y, 1.1, m.t); } else { GX.shadow(g, f.x, 645, 10 + (f.y / 640) * 8, 0.25 * f.y / 640); GX.apple(g, f.x, f.y, 13, f.y * 0.02); } });
    // wicker basket held overhead by the catcher
    const bx = cx + T.bx, cp = m.players[R_.catch], spl = m.players[R_.shake];
    GX.shadow(g, bx, 690, 50, 0.3);
    Char.draw(g, bx, 662, 22, cp.el.id, cp.color, { mood: MGH.persona('determined', cp.el.id), seed: R_.catch * 1.7, look: { x: 0, y: -1 }, walk: Math.abs(m.axis(R_.catch).x) > 0.3 ? 1 : 0, noShadow: true, hands: { n: { x: -1.2, y: -0.8, d: -100, o: true, m: true }, f: { x: 1.2, y: -0.8, d: -80, o: true, m: false } } });
    const wk = g.createLinearGradient(0, 600, 0, 640); wk.addColorStop(0, '#e8b46a'); wk.addColorStop(1, '#a8743a'); g.fillStyle = wk; g.beginPath(); g.moveTo(bx - 60, 602); g.lineTo(bx + 60, 602); g.quadraticCurveTo(bx + 52, 640, bx + 40, 642); g.lineTo(bx - 40, 642); g.quadraticCurveTo(bx - 52, 640, bx - 60, 602); g.fill();
    g.strokeStyle = 'rgba(110,70,30,0.6)'; g.lineWidth = 1.5; for (let y = 610; y < 642; y += 8) { g.beginPath(); g.moveTo(bx - 56, y); g.lineTo(bx + 56, y); g.stroke(); } for (let x = -50; x <= 50; x += 10) { g.beginPath(); g.moveTo(bx + x, 604); g.lineTo(bx + x * 0.8, 640); g.stroke(); }
    g.fillStyle = '#c88a48'; MGH.rr(g, bx - 64, 596, 128, 9, 4); g.fill();
    for (let q = 0; q < Math.min(6, T.pts); q++) GX.apple(g, bx - 40 + q * 16, 596 - (q % 2) * 5, 9);
    // shaker perched on the fork, gripping the trunk
    Char.draw(g, cx + 44, 330 + (T.shook ? Math.sin(m.t * 50) * 2 : 0), 24, spl.el.id, spl.color, { mood: MGH.persona(T.shook ? 'effort' : 'happy', spl.el.id), seed: R_.shake * 1.7, look: { x: -0.5, y: -0.6 }, noShadow: true, hands: { n: { x: -1, y: -1, d: -130, o: true, m: true }, f: { x: 0.4, y: -0.6, d: -60, o: true, m: false } } });
    g.fillStyle = MG.TEAMC[tm]; MGH.rr(g, cx - 90, 44, 180, 36, 18); g.fill(); g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 2; g.stroke();
    MGH.text(g, `${MG.TEAMN[tm]}  🍎 ${T.pts}`, cx, 70, 22, '#fff', 'center', 'bold');
  });
  if (S.half && m.t < 24.5) MGH.label(g, 'SWAP JOBS!', 640, 360, 40, '#ffe680');
});

// ===================================================================== Plank Bridge: canyon lanes, rock pillars, a crane that swings the plank, and placed planks that stay
MG.byId.plank && (MG.byId.plank.draw = function (m, S, g) {
  GX.vfill(g, 0, 0, 1280, 720, ['#8ccaf4', '#cfeaff']);
  for (let i = 0; i < 4; i++) {
    const P = S.p[i], p = m.players[i], L = MGM.lane(i, 110, 150), gy = L.y1 - 30;
    g.save(); g.beginPath(); g.rect(0, L.y0, 1280, L.h); g.clip();
    // sky, far mesas
    GX.vfill(g, 0, L.y0, 1280, L.h, i % 2 ? ['#9fd4f8', '#e4f4ff'] : ['#acdcfa', '#eaf6ff']);
    g.fillStyle = 'rgba(200,140,100,0.35)'; g.beginPath(); g.moveTo(0, gy); for (let x = 0; x <= 1280; x += 64) g.lineTo(x, gy - 40 - Math.abs(Math.sin(x * 0.01 + i)) * 40); g.lineTo(1280, gy); g.fill();
    MGH.cloud(g, (200 + i * 310 + m.t * 10) % 1400 - 60, L.y0 + 26, 14);
    // river far below with flowing glints
    GX.vfill(g, 0, gy + 4, 1280, L.y1 - gy, ['#3aa0e0', '#1a68b0']);
    g.strokeStyle = 'rgba(255,255,255,0.45)'; g.lineWidth = 2; for (let k = 0; k < 14; k++) { const x = (k * 97 + m.t * 60) % 1320 - 20, y = gy + 14 + (k % 3) * 5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 14, y); g.stroke(); }
    // rock pillars with grassy tops
    for (let k = 0; k <= 6; k++) { const x = 60 + k * 190;
      const rg = g.createLinearGradient(x, 0, x + 70, 0); rg.addColorStop(0, '#8a5a3a'); rg.addColorStop(0.5, '#b07a4a'); rg.addColorStop(1, '#6a4028'); g.fillStyle = rg;
      g.beginPath(); g.moveTo(x - 4, gy - 4); g.lineTo(x + 74, gy - 4); g.lineTo(x + 66, L.y1); g.lineTo(x + 4, L.y1); g.fill();
      g.strokeStyle = 'rgba(60,30,10,0.4)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x + 10, gy + 4); g.lineTo(x + 20, gy + 16); g.moveTo(x + 50, gy + 2); g.lineTo(x + 44, gy + 20); g.stroke();
      g.fillStyle = '#5ab83a'; MGH.rr(g, x - 6, gy - 10, 82, 10, 5); g.fill(); g.fillStyle = '#7ad84a'; g.fillRect(x - 2, gy - 10, 74, 3);
      for (let q = 0; q < 4; q++) { g.strokeStyle = '#4a9a2a'; g.lineWidth = 2; g.beginPath(); g.moveTo(x + 6 + q * 20, gy - 9); g.lineTo(x + 4 + q * 20, gy - 16); g.stroke(); }
    }
    // finish flag
    const fxp = 60 + 6 * 190 + 55; g.strokeStyle = '#5a3a1a'; g.lineWidth = 3; g.beginPath(); g.moveTo(fxp, gy - 10); g.lineTo(fxp, gy - 64); g.stroke();
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { g.fillStyle = (r + c) % 2 ? '#222' : '#fff'; g.fillRect(fxp + c * 8 + Math.sin(m.t * 5 + c) * 1.5, gy - 64 + r * 8, 8, 8); }
    // placed planks (they STAY; the one being walked on is included)
    const placed = P.gap + (P.st === 'walk' ? 1 : 0);
    for (let k = 0; k < Math.min(6, placed); k++) { const x = 126 + k * 190; GX.plank(g, x, gy - 14, 128, 14, '#c8904a', '#7a4e26', k + i); g.strokeStyle = '#d8c090'; g.lineWidth = 2; [x + 6, x + 122].forEach(rx => { g.beginPath(); g.moveTo(rx, gy - 14); g.lineTo(rx, gy); g.stroke(); }); }
    if (!P.fin && P.gap < 6) {
      const gx = 190 + P.gap * 190, py = L.y0 + 14;
      // crane arm over the gap
      g.strokeStyle = '#6a6a70'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, L.y0 + 4); g.lineTo(1280, L.y0 + 4); g.stroke(); g.fillStyle = '#c8a060'; MGH.rr(g, gx - 14, L.y0, 28, 12, 4); g.fill(); g.strokeStyle = '#d8c8a0'; g.lineWidth = 2; g.beginPath(); g.moveTo(gx, L.y0 + 10); g.lineTo(gx, py); g.stroke(); g.fillStyle = '#5a6068'; g.beginPath(); g.arc(gx, py, 5, 0, 7); g.fill();
      if (P.st === 'swing' || (P.st === 'drop' && P.fall < 0.4) || P.st === 'miss') {
        const k = P.st === 'drop' ? Math.min(1, P.fall / 0.4) : P.st === 'miss' ? 1 : 0, ang = P.ang, ropeL = 34, y = py + ropeL + k * k * (gy - 22 - py - ropeL);
        const sx = gx + (P.st === 'swing' ? Math.sin(ang) * 18 : 0);
        if (P.st === 'swing') { g.strokeStyle = '#d8c8a0'; g.lineWidth = 2; g.beginPath(); g.moveTo(gx, py); g.lineTo(sx - Math.cos(ang) * 40, py + ropeL + Math.sin(ang) * -40); g.moveTo(gx, py); g.lineTo(sx + Math.cos(ang) * 40, py + ropeL + Math.sin(ang) * 40); g.stroke(); }
        if (P.st === 'miss') { // tumble down into the river with a splash
          const f = P.fall, my = Math.min(gy + 20, gy - 10 + f * f * 200), rot = ang + f * 4;
          g.save(); g.translate(gx + f * 20, my); g.rotate(rot); g.globalAlpha = Math.max(0, 1 - f * 0.8); GX.plank(g, -64, -7, 128, 14, '#c8904a', '#7a4e26', i); g.restore();
          if (f > 0.3) { const sp = (f - 0.3) / 0.7; g.strokeStyle = `rgba(255,255,255,${1 - sp})`; g.lineWidth = 2; g.beginPath(); g.ellipse(gx + 10, gy + 16, 20 + sp * 40, 4 + sp * 4, 0, 0, 7); g.stroke(); for (let q = 0; q < 5; q++) { g.fillStyle = `rgba(220,240,255,${1 - sp})`; g.beginPath(); g.arc(gx + 10 + (q - 2) * 10 * (1 + sp), gy + 12 - Math.sin(sp * Math.PI) * (20 + q * 4), 3, 0, 7); g.fill(); } }
        } else { g.save(); g.translate(sx, y); g.rotate(ang); GX.plank(g, -64, -7, 128, 14, '#c8904a', '#7a4e26', i); g.restore(); }
        if (P.st === 'swing') { const good = Math.abs(ang) < 0.16; g.strokeStyle = good ? 'rgba(90,240,90,0.9)' : 'rgba(255,255,255,0.35)'; g.lineWidth = 2; g.setLineDash([4, 4]); g.beginPath(); g.moveTo(gx - 64, gy - 16); g.lineTo(gx + 64, gy - 16); g.stroke(); g.setLineDash([]); if (good) MGH.glow(g, gx, gy - 16, 50, 'rgba(120,255,120,0.3)'); }
      }
    }
    // the hero: walks across the plank with a bouncy step
    const walking = P.st === 'walk', wk = walking ? Math.min(1, P.fall / 0.7) : 0;
    const x = P.fin ? 60 + 6 * 190 + 25 : 60 + P.gap * 190 + 35 + wk * 190;
    const yb = walking ? -Math.abs(Math.sin(wk * Math.PI * 4)) * 4 : 0;
    Char.draw(g, x, gy - 40 + yb, 22, p.el.id, p.color, { mood: MGH.persona(P.fin ? 'cheer' : P.st === 'miss' ? 'hurt' : P.st === 'drop' ? 'scared' : 'determined', p.el.id), seed: i * 1.7, look: { x: 1, y: 0 }, walk: walking ? 1 : 0 });
    g.restore();
    g.fillStyle = p.color; MGH.rr(g, 8, L.y0 + 8, 30, 22, 6); g.fill(); MGH.text(g, String(i + 1), 23, L.y0 + 25, 16, '#fff', 'center', 'bold');
    g.fillStyle = 'rgba(0,0,0,0.35)'; MGH.rr(g, 1180, L.y0 + 8, 84, 26, 13); g.fill(); MGH.text(g, P.fin ? `${P.fin.toFixed(1)}s` : `${P.gap}/6`, 1222, L.y0 + 27, 16, '#fff', 'center', 'bold');
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, L.y1 - 2, 1280, 2);
  }
});

// hot-air balloon with striped envelope and wicker basket
GX.balloon = function (g, x, y, col, t, seed, burn) {
  const sw = Math.sin(t * 1.3 + seed) * 0.04;
  g.save(); g.translate(x, y); g.rotate(sw); g.scale(0.74, 0.74);
  const R = 46, top = -110;
  const shape = () => { g.beginPath(); g.moveTo(-16, -22); g.bezierCurveTo(-R * 1.25, -50, -R * 1.1, top - 10, 0, top - 14); g.bezierCurveTo(R * 1.1, top - 10, R * 1.25, -50, 16, -22); g.closePath(); };
  g.save(); shape(); g.clip();
  const gr = g.createRadialGradient(-18, top + 20, 8, 0, -60, 80); gr.addColorStop(0, Char.shade(col, 0.45)); gr.addColorStop(0.6, col); gr.addColorStop(1, Char.shade(col, -0.35)); g.fillStyle = gr; g.fillRect(-70, top - 20, 140, 110);
  g.fillStyle = 'rgba(255,255,255,0.75)'; for (let k = -2; k <= 2; k += 2) { g.beginPath(); g.moveTo(k * 10 - 3, -22); g.bezierCurveTo(k * 26 - 6, -60, k * 22 - 6, top, k * 6 - 4, top - 14); g.lineTo(k * 6 + 4, top - 14); g.bezierCurveTo(k * 22 + 6, top, k * 26 + 6, -60, k * 10 + 3, -22); g.fill(); }
  g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(-70, -48, 140, 6); g.fillStyle = 'rgba(255,255,255,0.15)'; g.beginPath(); g.ellipse(-20, top + 26, 10, 22, -0.3, 0, 7); g.fill();
  g.restore();
  shape(); g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 1.5; g.stroke();
  g.fillStyle = Char.shade(col, -0.3); MGH.rr(g, -16, -26, 32, 8, 3); g.fill();
  g.strokeStyle = '#6a4a2a'; g.lineWidth = 1.5; [[-15, -12], [-5, -6], [5, 6], [15, 12]].forEach(([a, b]) => { g.beginPath(); g.moveTo(a, -20); g.lineTo(b, 4); g.stroke(); });
  if (burn) { MGH.glow(g, 0, -20, 40, 'rgba(255,170,60,0.6)'); MGH.flame(g, 0, -8, 0.35, t, seed); }
  g.fillStyle = '#5a6068'; MGH.rr(g, -8, -10, 16, 8, 2); g.fill();
  g.restore();
};

// ===================================================================== Balloon Ride: countryside, bold animated wind streams per layer, pretty balloons
MG.byId.balloonride && (MG.byId.balloonride.draw = function (m, S, g) {
  GX.vfill(g, 0, 0, 1280, 720, ['#3f86e0', '#7cc0f4', '#c8e8ff', '#ffe6c4']);
  MGH.glow(g, 1120, 130, 160, 'rgba(255,240,190,0.5)');
  // distant mountains and countryside
  g.fillStyle = '#a8c4e0'; g.beginPath(); g.moveTo(0, 640); for (let x = 0; x <= 1280; x += 40) g.lineTo(x, 560 - Math.abs(Math.sin(x * 0.005)) * 90 - Math.sin(x * 0.02) * 10); g.lineTo(1280, 640); g.fill();
  g.fillStyle = '#8cc46a'; g.beginPath(); g.moveTo(0, 720); for (let x = 0; x <= 1280; x += 40) g.lineTo(x, 640 - Math.sin(x * 0.008 + 1) * 22); g.lineTo(1280, 720); g.fill();
  ['#7ab85a', '#a8d06a', '#6aa84a', '#c8d88a'].forEach((c, k) => { g.fillStyle = c; g.beginPath(); g.moveTo(k * 330 - 20, 720); g.lineTo(k * 330 + 60, 664); g.lineTo(k * 330 + 330, 668); g.lineTo(k * 330 + 300, 720); g.fill(); });
  for (let k = 0; k < 14; k++) { const x = MGH.hash(k) * 1280, y = 650 + MGH.hash(k + 4) * 20; g.fillStyle = '#4a7a3a'; g.beginPath(); g.arc(x, y - 10, 9, 0, 7); g.fill(); g.fillStyle = '#5a3a1a'; g.fillRect(x - 1.5, y - 2, 3, 8); }
  // wind layers: tinted bands, flowing dashed streams, moving chevrons, and a big side badge
  S.L.forEach((l, k) => {
    const dir = Math.sign(l.w) || 1, str = Math.abs(l.w), col = k === 3 ? '120,220,140' : dir > 0 ? '255,170,80' : '90,200,255', mid = (l.y0 + l.y1) / 2, h = l.y1 - l.y0;
    g.fillStyle = `rgba(${col},0.08)`; g.fillRect(0, l.y0, 1280, h);
    g.strokeStyle = `rgba(${col},0.35)`; g.lineWidth = 1; g.setLineDash([2, 6]); g.beginPath(); g.moveTo(0, l.y1); g.lineTo(1280, l.y1); g.stroke(); g.setLineDash([]);
    for (let q = 0; q < 2; q++) {
      const yy = l.y0 + h * (0.3 + q * 0.4), amp = 6 + q * 2;
      g.save(); g.strokeStyle = `rgba(${col},0.75)`; g.lineWidth = 3; g.lineCap = 'round'; g.setLineDash([46, 30]); g.lineDashOffset = -m.t * 80 * str * dir - q * 20;
      g.beginPath(); for (let x = 0; x <= 1280; x += 16) { const y2 = yy + Math.sin(x * 0.012 + q * 2 + k) * amp; x ? g.lineTo(x, y2) : g.moveTo(x, y2); } g.stroke(); g.restore();
      g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 1.5; g.save(); g.setLineDash([12, 64]); g.lineDashOffset = -m.t * 80 * str * dir - q * 20 - 20; g.beginPath(); for (let x = 0; x <= 1280; x += 16) { const y2 = yy - 2 + Math.sin(x * 0.012 + q * 2 + k) * amp; x ? g.lineTo(x, y2) : g.moveTo(x, y2); } g.stroke(); g.restore();
    }
    for (let q = 0; q < 5; q++) { const x = (((q * 290 + m.t * 70 * str * dir) % 1450) + 1450) % 1450 - 80, yy = mid + Math.sin(x * 0.012 + k) * 6; g.fillStyle = `rgba(${col},0.9)`; g.beginPath(); g.moveTo(x + dir * 14, yy); g.lineTo(x - dir * 6, yy - 10); g.lineTo(x - dir * 1, yy); g.lineTo(x - dir * 6, yy + 10); g.fill(); }
    g.fillStyle = 'rgba(10,30,60,0.55)'; MGH.rr(g, 8, mid - 20, 84, 40, 20); g.fill(); g.strokeStyle = `rgb(${col})`; g.lineWidth = 2.5; g.stroke();
    MGH.text(g, (dir > 0 ? '➜' : '⬅') + (str > 0.8 ? (dir > 0 ? '➜' : '⬅') : ''), 50, mid + 8, 22, `rgb(${col})`, 'center', 'bold');
  });
  // landing pad: bullseye, flag, little crowd marker
  GX.shadow(g, S.tx, 686, 70, 0.3);
  [[60, '#ff5a5a'], [42, '#fff'], [24, '#ff5a5a'], [8, '#fff']].forEach(([r, c]) => { g.fillStyle = c; g.beginPath(); g.ellipse(S.tx, 684, r, r * 0.22, 0, 0, 7); g.fill(); });
  g.strokeStyle = '#5a5a60'; g.lineWidth = 3; g.beginPath(); g.moveTo(S.tx + 70, 684); g.lineTo(S.tx + 70, 590); g.stroke();
  g.fillStyle = '#ffcf4a'; g.beginPath(); g.moveTo(S.tx + 72, 592); g.quadraticCurveTo(S.tx + 92, 596 + Math.sin(m.t * 5) * 4, S.tx + 112, 604); g.lineTo(S.tx + 72, 618); g.fill();
  MGH.glow(g, S.tx, 680, 90, 'rgba(255,240,140,0.25)');
  S.p.forEach((P, i) => {
    const p = m.players[i], x = P.x, y = P.y - 30, burn = m.held(i, 'a') && !P.done;
    if (P.y > 600) GX.shadow(g, x, 686, 30 * (P.y - 560) / 100, 0.25);
    GX.balloon(g, x, y - 4, p.color, m.t, i, burn);
    // basket with the hero inside
    Char.draw(g, x, y + 8, 13, p.el.id, p.color, { mood: MGH.persona(P.done ? 'cheer' : P.vy < -40 ? 'happy' : 'determined', p.el.id), seed: i * 1.7, noShadow: true, noFeet: true, look: { x: S.tx > x ? 1 : -1, y: -0.2 } });
    const bg = g.createLinearGradient(0, y + 10, 0, y + 34); bg.addColorStop(0, '#c8904a'); bg.addColorStop(1, '#8a5a2a'); g.fillStyle = bg; MGH.rr(g, x - 17, y + 12, 34, 22, 5); g.fill();
    g.strokeStyle = 'rgba(90,50,20,0.6)'; g.lineWidth = 1; for (let q = 0; q < 3; q++) { g.beginPath(); g.moveTo(x - 16, y + 18 + q * 6); g.lineTo(x + 16, y + 18 + q * 6); g.stroke(); }
    g.fillStyle = '#e0b070'; MGH.rr(g, x - 19, y + 10, 38, 5, 2); g.fill();
    g.fillStyle = '#c8b080'; g.beginPath(); g.arc(x + 19, y + 24, 4, 0, 7); g.fill();
    // heat gauge
    g.fillStyle = 'rgba(0,0,0,0.45)'; MGH.rr(g, x + 26, y - 30, 7, 48, 3); g.fill(); const hg = g.createLinearGradient(0, y + 18, 0, y - 30); hg.addColorStop(0, '#ffd34d'); hg.addColorStop(1, '#ff4a2a'); g.fillStyle = hg; MGH.rr(g, x + 27, y + 17 - 46 * P.heat, 5, 46 * P.heat, 2); g.fill();
    if (P.done) MGH.text(g, '🎯', x, y - 140, 24, '#fff');
  });
});

// realistic haystack sprites (cached: hundreds of straw strands each)
GX.haySprite = function (v) {
  GX._hay = GX._hay || [];
  if (GX._hay[v]) return GX._hay[v];
  const c = document.createElement('canvas'); c.width = 260; c.height = 240; const g = c.getContext('2d'); g.scale(2, 2);
  const rnd = (k) => MGH.hash(k * 7.13 + v * 31.7);
  const cx = 65, base = 104, W = 56, H = 92;
  const shape = () => { g.beginPath(); g.moveTo(cx - W, base); g.bezierCurveTo(cx - W - 4, base - H * 0.65, cx - W * 0.55, base - H, cx, base - H); g.bezierCurveTo(cx + W * 0.55, base - H, cx + W + 4, base - H * 0.65, cx + W, base); g.closePath(); };
  const body = g.createLinearGradient(cx - W, 0, cx + W, 0); body.addColorStop(0, '#f2d27a'); body.addColorStop(0.45, '#d8ac4a'); body.addColorStop(1, '#8a6420');
  g.fillStyle = body; shape(); g.fill();
  g.save(); shape(); g.clip();
  const pal = ['#f8e08c', '#e8c060', '#d0a040', '#b08030', '#fff0b0', '#c89838'];
  for (let k = 0; k < 520; k++) {
    const u = rnd(k) * 2 - 1, y0 = base - rnd(k + 1) * H * 1.05, len = 8 + rnd(k + 2) * 20, a = Math.PI / 2 + u * 0.9 + (rnd(k + 3) - 0.5) * 0.6;
    const x0 = cx + u * W * Math.sqrt(Math.max(0, 1 - Math.pow((base - y0) / H, 2))) * 1.05;
    g.strokeStyle = pal[Math.floor(rnd(k + 4) * pal.length)]; g.globalAlpha = 0.55 + rnd(k + 5) * 0.45; g.lineWidth = 0.6 + rnd(k + 6) * 1.1;
    g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(x0 + Math.cos(a) * len * 0.5 + 2, y0 + Math.sin(a) * len * 0.5, x0 + Math.cos(a) * len, y0 + Math.sin(a) * len); g.stroke();
  }
  g.globalAlpha = 1;
  const shade = g.createRadialGradient(cx - 22, base - H * 0.7, 6, cx, base - H * 0.4, W * 1.3); shade.addColorStop(0, 'rgba(255,250,210,0.35)'); shade.addColorStop(0.6, 'rgba(0,0,0,0)'); shade.addColorStop(1, 'rgba(60,30,0,0.4)'); g.fillStyle = shade; g.fillRect(0, 0, 130, 120);
  g.fillStyle = 'rgba(60,35,0,0.25)'; g.fillRect(0, base - 10, 130, 10);
  g.restore();
  // stray straws poking out + loose straw at the base
  for (let k = 0; k < 40; k++) { const t = rnd(k + 50), side = t < 0.5 ? -1 : 1, yy = base - rnd(k + 51) * H * 0.9, xx = cx + side * W * Math.sqrt(Math.max(0, 1 - Math.pow((base - yy) / H, 2))) * 0.98; const a = (side < 0 ? Math.PI : 0) + (rnd(k + 52) - 0.5) * 1.4; g.strokeStyle = pal[k % pal.length]; g.lineWidth = 0.9; g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx + Math.cos(a) * (6 + rnd(k + 53) * 9), yy + Math.sin(a) * (6 + rnd(k + 53) * 9)); g.stroke(); }
  for (let k = 0; k < 60; k++) { const xx = cx + (rnd(k + 90) * 2 - 1) * (W + 14), yy = base - 2 + rnd(k + 91) * 9, a = (rnd(k + 92) - 0.5) * 0.8; g.strokeStyle = pal[k % pal.length]; g.lineWidth = 0.9; g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx + Math.cos(a) * 10, yy + Math.sin(a) * 3); g.stroke(); }
  GX._hay[v] = c; return c;
};

// ===================================================================== Haystack Hunt: a real harvest field
MG.byId.haystack && (MG.byId.haystack.draw = function (m, S, g) {
  GX.blit(g, GX.bake('haystack', g => {
  GX.vfill(g, 0, 0, 1280, 130, ['#78b4e8', '#bcdcf4', '#f4ead0']);
  MGH.glow(g, 1080, 70, 120, 'rgba(255,240,190,0.6)');
  g.fillStyle = '#8aa8a0'; g.beginPath(); g.moveTo(0, 130); for (let x = 0; x <= 1280; x += 40) g.lineTo(x, 104 - Math.abs(Math.sin(x * 0.006)) * 30); g.lineTo(1280, 130); g.fill();
  // barn and silo on the horizon
  g.fillStyle = '#a83a2a'; g.fillRect(90, 84, 70, 46); g.fillStyle = '#7a2418'; g.beginPath(); g.moveTo(84, 86); g.lineTo(125, 62); g.lineTo(166, 86); g.fill(); g.strokeStyle = '#f4ecdc'; g.lineWidth = 2; g.strokeRect(112, 100, 26, 30); g.beginPath(); g.moveTo(112, 100); g.lineTo(138, 130); g.moveTo(138, 100); g.lineTo(112, 130); g.stroke();
  g.fillStyle = '#c8ccd4'; g.fillRect(170, 74, 22, 56); g.beginPath(); g.arc(181, 74, 11, Math.PI, 0); g.fill();
  for (let k = 0; k < 9; k++) { const x = 300 + k * 110; g.fillStyle = '#4a7a3a'; g.beginPath(); g.arc(x, 112, 14 + (k % 3) * 3, 0, 7); g.fill(); }
  // harvested field: stubble rows with soil between, perspective lines
  GX.vfill(g, 0, 125, 1280, 595, ['#c8a058', '#b88c48', '#a07838']);
  for (let r = 0; r < 26; r++) { const y = 130 + r * r * 0.85 + r * 2; if (y > 720) break; g.fillStyle = r % 2 ? 'rgba(90,60,20,0.18)' : 'rgba(255,230,160,0.12)'; g.fillRect(0, y, 1280, 3 + r * 0.6); }
  for (let k = 0; k < 340; k++) { const x = MGH.hash(k) * 1280, y = 130 + MGH.hash(k + 9) * 590, s = 0.5 + (y - 130) / 590; g.strokeStyle = MGH.hash(k + 3) < 0.5 ? 'rgba(240,210,120,0.75)' : 'rgba(150,110,40,0.6)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (MGH.hash(k + 5) - 0.5) * 4 * s, y - 6 * s); g.stroke(); }
  for (let k = 0; k < 18; k++) { const x = MGH.hash(k + 40) * 1280, y = 140 + MGH.hash(k + 41) * 570; g.fillStyle = 'rgba(80,60,40,0.4)'; g.beginPath(); g.ellipse(x, y, 4, 2, 0, 0, 7); g.fill(); }
  // fence along the top of the field
  for (let x = 0; x < 1280; x += 60) { g.fillStyle = '#7a5530'; g.fillRect(x, 120, 5, 22); } g.fillStyle = '#8a6438'; g.fillRect(0, 124, 1280, 4); g.fillRect(0, 134, 1280, 4);
  }));
  const ents = S.st.map((s, k) => ({ y: s.y + 30, f: () => {
    const near = S.b.some(b => dist(b.x, b.y, S.st[S.n].x, S.st[S.n].y) < 220) && dist(s.x, s.y, S.st[S.n].x, S.st[S.n].y) < 200 && s.flat <= 0;
    const dg = S.b.find(b => b.at === k), wob = near ? Math.sin(m.t * 20 + k) * 0.03 : 0, shake = dg ? Math.sin(m.t * 40) * 0.025 : 0;
    GX.shadow(g, s.x + 8, s.y + 40, 62, 0.4);
    if (s.flat > 0) { // scattered straw where a stack was searched
      for (let q = 0; q < 50; q++) { const a = MGH.hash(q + k * 9) * 6.28, d = MGH.hash(q + k * 9 + 1) * 56; g.strokeStyle = q % 3 ? '#e8c060' : '#b08030'; g.lineWidth = 1.5; const x = s.x + Math.cos(a) * d, y = s.y + 34 + Math.sin(a) * d * 0.3; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a + q) * 10, y + Math.sin(a + q) * 3); g.stroke(); }
      g.fillStyle = 'rgba(232,192,96,0.7)'; g.beginPath(); g.ellipse(s.x, s.y + 34, 40, 10, 0, 0, 7); g.fill(); return;
    }
    const spr = GX.haySprite(k % 4);
    g.save(); g.translate(s.x, s.y + 40); g.rotate(wob * Math.sin(m.t * 3) + shake); g.scale(1 + shake * 2, 1 - Math.abs(shake) * 2); g.drawImage(spr, -65, -104, 130, 120); g.restore();
    if (k === S.n && Math.sin(m.t * 3 + k) > 0.7) { const sx = s.x + Math.sin(m.t * 7) * 30, sy = s.y - 10 + Math.cos(m.t * 5) * 20; MGH.glow(g, sx, sy, 14, 'rgba(255,246,160,0.8)'); MGH.star(g, sx, sy, 4, '#fff6a0', m.t * 3, false); }
    if (near) for (let q = 0; q < 2; q++) { const ph = (m.t * 1.5 + q * 0.5 + k * 0.3) % 1; g.strokeStyle = `rgba(240,210,120,${1 - ph})`; g.lineWidth = 1.5; const x = s.x + (q ? 30 : -30) + ph * (q ? 20 : -20), y = s.y - 40 - ph * 20; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 8, y + 3); g.stroke(); }
    if (dg) { for (let q = 0; q < 6; q++) { const ph = (m.t * 3 + q / 6) % 1, a = -Math.PI / 2 + (q - 2.5) * 0.4; g.strokeStyle = `rgba(240,200,100,${1 - ph})`; g.lineWidth = 2; const x = s.x + Math.cos(a) * ph * 70, y = s.y - 20 + Math.sin(a) * ph * 60 + ph * ph * 40; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(q + m.t * 9) * 9, y + Math.sin(q + m.t * 9) * 9); g.stroke(); }
      g.fillStyle = 'rgba(0,0,0,0.55)'; MGH.rr(g, s.x - 32, s.y - 82, 64, 10, 5); g.fill(); g.fillStyle = '#ffe680'; MGH.rr(g, s.x - 31, s.y - 81, 62 * Math.min(1, dg.dig), 8, 4); g.fill(); }
  } })).concat(S.b.map((b, i) => ({ y: b.y, f: () => { const p = m.players[i]; if (b.at >= 0) { g.save(); g.translate(b.x, b.y + b.r * 1.3); g.rotate(Math.sin(m.t * 20) * 0.12); Char.draw(g, 0, -b.r * 1.3, b.r * 1.3, p.el.id, p.color, { mood: MGH.persona('effort', p.el.id), seed: i * 1.7, look: b.face, hands: { n: { x: -0.9, y: -0.2 + Math.sin(m.t * 25) * 0.4, d: -20, o: true, m: false }, f: { x: -0.6, y: 0.1 + Math.cos(m.t * 25) * 0.4, d: 20, o: true, m: false } } }); g.restore(); } else MGH.drawBody(g, b, p, '', 'determined'); } })));
  ents.sort((a, b) => a.y - b.y).forEach(e => e.f());
});

// ===================================================================== Ship Battle: proper pirate ships on a living sea
MG.byId.ships && (MG.byId.ships.draw = function (m, S, g) {
  GX.vfill(g, 0, 0, 1280, 150, ['#5aa8e8', '#a8d8f8', '#e8f4fa']);
  MGH.glow(g, 640, 120, 220, 'rgba(255,245,200,0.6)'); g.fillStyle = '#fff8d8'; g.beginPath(); g.arc(640, 110, 30, 0, 7); g.fill();
  [[200, 70], [980, 60]].forEach(([x, y], k) => MGH.cloud(g, (x + m.t * 6) % 1400 - 60, y, 26));
  // islands on the horizon
  [[330, 1], [900, 0.7]].forEach(([x, s]) => { g.fillStyle = '#5a8a6a'; g.beginPath(); g.ellipse(x, 150, 90 * s, 22 * s, 0, Math.PI, 0); g.fill(); g.strokeStyle = '#6a4a2a'; g.lineWidth = 3; g.beginPath(); g.moveTo(x + 10, 140); g.quadraticCurveTo(x + 18, 118, x + 12, 104 * 1); g.stroke(); g.fillStyle = '#3a8a3a'; for (let q = 0; q < 4; q++) { g.beginPath(); g.ellipse(x + 12 + Math.cos(q * 1.6) * 12, 104 + Math.sin(q * 1.6) * 4, 14, 4, q * 1.6, 0, 7); g.fill(); } });
  for (let k = 0; k < 5; k++) { const x = (k * 260 + m.t * 30) % 1400 - 60, y = 60 + (k % 3) * 18; g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 8, y); g.quadraticCurveTo(x - 4, y - 5 - Math.sin(m.t * 6 + k) * 3, x, y); g.quadraticCurveTo(x + 4, y - 5 - Math.sin(m.t * 6 + k) * 3, x + 8, y); g.stroke(); }
  // sea: depth gradient, sun glitter, rolling wave bands with foam
  GX.vfill(g, 0, 148, 1280, 572, ['#3a9ad8', '#1f6ab0', '#0f3a78']);
  g.save(); g.globalAlpha = 0.5; for (let k = 0; k < 18; k++) { const y = 156 + k * 8, w = 70 - k * 3 + Math.sin(m.t * 3 + k) * 10; g.fillStyle = '#fff8d0'; g.fillRect(640 - w / 2 + Math.sin(m.t + k) * 8, y, w, 2); } g.restore();
  for (let k = 0; k < 13; k++) { const y = 175 + k * 42, a = 0.1 + k * 0.012;
    g.fillStyle = `rgba(10,40,90,${a})`; g.beginPath(); g.moveTo(0, y + 20); for (let x = 0; x <= 1280; x += 20) g.lineTo(x, y + Math.sin(x * 0.015 + m.t * 1.6 + k * 1.3) * 6); g.lineTo(1280, y + 20); g.fill();
    g.strokeStyle = `rgba(255,255,255,${0.18 + k * 0.012})`; g.lineWidth = 2; g.beginPath(); for (let x = 0; x <= 1280; x += 20) { const yy = y + Math.sin(x * 0.015 + m.t * 1.6 + k * 1.3) * 6; x ? g.lineTo(x, yy) : g.moveTo(x, yy); } g.stroke(); }
  // cannonballs with smoke trails
  S.balls.forEach(b => { for (let q = 1; q <= 5; q++) { g.fillStyle = `rgba(230,230,230,${0.35 - q * 0.06})`; g.beginPath(); g.arc(b.x - Math.sign(b.vx) * q * 14, b.y + Math.sin(q + m.t * 10) * 2, 5 + q * 2, 0, 7); g.fill(); } const bg = g.createRadialGradient(b.x - 3, b.y - 3, 1, b.x, b.y, 10); bg.addColorStop(0, '#888'); bg.addColorStop(1, '#111'); g.fillStyle = bg; g.beginPath(); g.arc(b.x, b.y, 9, 0, 7); g.fill(); });
  S.sh.forEach((s, tm) => {
    const x = this.X[tm], d = tm ? -1 : 1, R_ = this.roles(S, tm), bob = Math.sin(m.t * 2 + tm) * 3, y = s.y + bob, tilt = Math.sin(m.t * 1.6 + tm) * 0.03 + clamp(s.v / 2000, -0.06, 0.06) * d;
    const fired = s.cd > 0.6, rec = fired ? (s.cd - 0.6) / 0.3 : 0;
    // wake and bow wave when moving
    if (Math.abs(s.v) > 30) for (let q = 0; q < 4; q++) { const ph = (m.t * 2 + q / 4) % 1; g.strokeStyle = `rgba(255,255,255,${0.5 * (1 - ph)})`; g.lineWidth = 2; g.beginPath(); g.ellipse(x, y + 30 - Math.sign(s.v) * ph * 50, 60 + ph * 30, 8, 0, 0, 7); g.stroke(); }
    g.fillStyle = 'rgba(0,20,50,0.35)'; g.beginPath(); g.ellipse(x, y + 36, 92, 12, 0, 0, 7); g.fill();
    g.save(); g.translate(x, y); g.rotate(tilt); if (s.hit > 0) g.rotate(Math.sin(m.t * 40) * 0.08); g.scale(d, 1);
    // mast, sails, crow's nest, flag
    g.fillStyle = '#5a3a1a'; g.fillRect(-14, -150, 7, 150);
    g.fillStyle = '#4a2e14'; MGH.rr(g, -22, -130, 24, 10, 3); g.fill();
    const billow = 10 + Math.sin(m.t * 2 + tm) * 3;
    const sail = (y0, y1, w) => { const sg = g.createLinearGradient(-10, 0, w, 0); sg.addColorStop(0, '#f4ecd8'); sg.addColorStop(1, '#d8ccb0'); g.fillStyle = sg; g.beginPath(); g.moveTo(-6, y0); g.quadraticCurveTo(w * 0.5 + billow, (y0 + y1) / 2 - 4, w, y0 + 4); g.lineTo(w + 2, y1 - 2); g.quadraticCurveTo(w * 0.5 + billow, y1 + 8, -6, y1); g.fill(); g.strokeStyle = 'rgba(120,100,70,0.5)'; g.lineWidth = 1; g.stroke(); };
    sail(-118, -76, 46); sail(-70, -22, 58);
    g.fillStyle = MG.TEAMC[tm]; g.beginPath(); g.arc(24 + billow * 0.3, -46, 13, 0, 7); g.fill(); g.fillStyle = '#fff'; g.font = 'bold 14px Georgia'; g.textAlign = 'center'; g.fillText('☠', 24 + billow * 0.3, -41);
    g.fillStyle = MG.TEAMC[tm]; g.beginPath(); g.moveTo(-10, -150); for (let q = 0; q <= 4; q++) g.lineTo(-10 - q * 8, -150 + 3 + Math.sin(m.t * 8 - q) * 3); g.lineTo(-42, -136 + Math.sin(m.t * 8 - 4) * 3); for (let q = 4; q >= 0; q--) g.lineTo(-10 - q * 8, -138 + Math.sin(m.t * 8 - q) * 3); g.fill();
    g.strokeStyle = '#8a7a5a'; g.lineWidth = 1; g.beginPath(); g.moveTo(-10, -146); g.lineTo(78, -4); g.moveTo(-10, -146); g.lineTo(-78, -4); g.stroke();
    // hull with planks, gunports and stern castle
    const hg = g.createLinearGradient(0, -6, 0, 38); hg.addColorStop(0, '#9a6232'); hg.addColorStop(1, '#4a2810'); g.fillStyle = hg;
    g.beginPath(); g.moveTo(-82, -22); g.lineTo(-56, -22); g.lineTo(-56, -6); g.lineTo(84, -6); g.quadraticCurveTo(80, 24, 56, 36); g.lineTo(-52, 36); g.quadraticCurveTo(-76, 26, -82, -22); g.fill();
    g.strokeStyle = 'rgba(30,15,5,0.45)'; g.lineWidth = 1.5; [4, 14, 24].forEach(yy => { g.beginPath(); g.moveTo(-78, yy); g.lineTo(80, yy); g.stroke(); });
    g.fillStyle = '#c8a050'; g.fillRect(-82, -24, 26, 3); g.fillRect(-56, -8, 140, 3);
    [-30, 10, 50].forEach(px => { g.fillStyle = '#2a1608'; MGH.rr(g, px - 6, 6, 12, 9, 2); g.fill(); g.strokeStyle = '#c8a050'; g.lineWidth = 1.5; g.stroke(); });
    g.strokeStyle = '#6a4a24'; g.lineWidth = 4; g.beginPath(); g.moveTo(80, -6); g.lineTo(118, -26); g.stroke(); // bowsprit
    g.fillStyle = '#f4ecd8'; g.beginPath(); g.moveTo(-74, -22); g.lineTo(-74, -32); g.lineTo(-60, -32); g.lineTo(-60, -22); g.fill();
    // ship's wheel
    g.save(); g.translate(-40, -22); g.rotate(s.v * 0.01); g.strokeStyle = '#7a4a1a'; g.lineWidth = 2.5; g.beginPath(); g.arc(0, 0, 9, 0, 7); g.stroke(); for (let q = 0; q < 6; q++) { const a = q * Math.PI / 3; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * 13, Math.sin(a) * 13); g.stroke(); } g.restore();
    // cannon on wheels with recoil
    g.save(); g.translate(52 - rec * 10, -14); const cg = g.createLinearGradient(0, -7, 0, 7); cg.addColorStop(0, '#6a6a72'); cg.addColorStop(1, '#1a1a20'); g.fillStyle = cg; MGH.rr(g, -10, -7, 40, 14, 6); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.arc(30, 0, 5, 0, 7); g.fill(); g.fillStyle = '#5a3a1a'; g.beginPath(); g.arc(-2, 8, 6, 0, 7); g.arc(16, 8, 6, 0, 7); g.fill(); g.restore();
    if (fired) { g.globalAlpha = rec; MGH.glow(g, 100, -14, 40, 'rgba(255,190,80,0.9)'); for (let q = 0; q < 4; q++) { g.fillStyle = `rgba(220,220,220,${0.6 * rec})`; g.beginPath(); g.arc(96 + (1 - rec) * 30 + q * 10, -14 - q * 4 - (1 - rec) * 20, 8 + (1 - rec) * 14, 0, 7); g.fill(); } g.globalAlpha = 1; }
    if (s.hit > 0) { for (let q = 0; q < 5; q++) { g.fillStyle = `rgba(80,80,80,${0.5 * s.hit / 0.6})`; g.beginPath(); g.arc(-10 + q * 14, -30 - (0.6 - s.hit) * 80 - q * 6, 10 + (0.6 - s.hit) * 30, 0, 7); g.fill(); } MGH.flame(g, 0, -10, 0.5, m.t, tm); }
    g.restore();
    const cp = m.players[R_.cap], gp = m.players[R_.gun];
    Char.draw(g, x - d * 54, y - 46, 18, cp.el.id, cp.color, { mood: MGH.persona(s.hit > 0 ? 'hurt' : 'determined', cp.el.id), seed: R_.cap, look: { x: d, y: 0 }, noShadow: true, hands: { n: { x: 0.9, y: 0.1 + Math.sin(m.t * 3) * 0.2, d: 0, o: true, m: false }, f: { x: 1.1, y: -0.2, d: 0, o: true, m: false } } });
    Char.draw(g, x + d * 30, y - 44, 18, gp.el.id, gp.color, { mood: MGH.persona(fired ? 'cheer' : 'determined', gp.el.id), seed: R_.gun, look: { x: d, y: 0 }, noShadow: true });
    if (s.cd > 0) { g.fillStyle = 'rgba(0,0,0,0.45)'; MGH.rr(g, x - 32, y + 50, 64, 8, 4); g.fill(); g.fillStyle = '#ffb13d'; MGH.rr(g, x - 31, y + 51, 62 * (1 - s.cd / 0.9), 6, 3); g.fill(); }
    g.fillStyle = MG.TEAMC[tm]; MGH.rr(g, (tm ? 1100 : 180) - 80, 62, 160, 40, 20); g.fill(); g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 2; g.stroke();
    MGH.text(g, `${MG.TEAMN[tm]}  💥 ${S.hits[tm]}`, tm ? 1100 : 180, 90, 22, '#fff', 'center', 'bold');
  });
  if (S.half && m.t < 32) MGH.label(g, 'SWAP JOBS!', 640, 380, 40, '#ffe680');
});

// ===================================================================== Masquerade: a grand moonlit ballroom with ornate masks and gowns
MG.byId.masquerade && (MG.byId.masquerade.draw = function (m, S, g) {
  GX.blit(g, GX.bake('masquerade', g => {
  // back wall with arched windows, pillars and curtains
  GX.vfill(g, 0, 0, 1280, 160, ['#1a0a24', '#3a1840']);
  for (let k = 0; k < 6; k++) { const x = 110 + k * 212;
    g.fillStyle = '#0a0a2a'; g.beginPath(); g.moveTo(x - 46, 160); g.lineTo(x - 46, 70); g.arc(x, 70, 46, Math.PI, 0); g.lineTo(x + 46, 160); g.fill();
    const mg = g.createLinearGradient(0, 30, 0, 160); mg.addColorStop(0, '#2a3a7a'); mg.addColorStop(1, '#0a1030'); g.fillStyle = mg; g.beginPath(); g.moveTo(x - 40, 160); g.lineTo(x - 40, 72); g.arc(x, 72, 40, Math.PI, 0); g.lineTo(x + 40, 160); g.fill();
    if (k === 2) { MGH.glow(g, x + 10, 70, 40, 'rgba(220,230,255,0.6)'); g.fillStyle = '#f0f4ff'; g.beginPath(); g.arc(x + 10, 70, 14, 0, 7); g.fill(); }
    for (let q = 0; q < 5; q++) { g.fillStyle = 'rgba(255,255,255,0.8)'; g.fillRect(x - 30 + MGH.hash(q + k * 5) * 60, 50 + MGH.hash(q + k * 5 + 1) * 90, 1.5, 1.5); }
    g.strokeStyle = '#c8a050'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, 32); g.lineTo(x, 160); g.moveTo(x - 40, 110); g.lineTo(x + 40, 110); g.stroke();
    // curtains
    [[-1], [1]].forEach(([sd]) => { const cg = g.createLinearGradient(x + sd * 50, 0, x + sd * 30, 0); cg.addColorStop(0, '#5a0a1a'); cg.addColorStop(1, '#a8203a'); g.fillStyle = cg; g.beginPath(); g.moveTo(x + sd * 56, 20); g.quadraticCurveTo(x + sd * 30, 90, x + sd * 46, 162); g.lineTo(x + sd * 60, 162); g.lineTo(x + sd * 60, 20); g.fill(); });
  }
  for (let k = 0; k < 7; k++) { const x = k * 212 + 4; const pg = g.createLinearGradient(x - 14, 0, x + 14, 0); pg.addColorStop(0, '#8a6a2a'); pg.addColorStop(0.5, '#f4d888'); pg.addColorStop(1, '#8a6a2a'); g.fillStyle = pg; g.fillRect(x - 12, 0, 24, 162); g.fillStyle = '#c8a050'; g.fillRect(x - 16, 150, 32, 12); }
  g.fillStyle = '#c8a050'; g.fillRect(0, 18, 1280, 6); g.fillRect(0, 156, 1280, 6);
  // marble floor: diamond pattern with a sheen
  GX.vfill(g, 0, 160, 1280, 560, ['#3a1a3a', '#2a1030']);
  g.save(); g.beginPath(); g.rect(0, 162, 1280, 558); g.clip();
  for (let y = 120; y < 760; y += 60) for (let x = -60; x < 1340; x += 120) { const ox = ((y / 60) % 2) * 60; g.fillStyle = ((y / 60) % 2) ? 'rgba(240,226,210,0.22)' : 'rgba(30,10,30,0.25)'; g.beginPath(); g.moveTo(x + ox, y); g.lineTo(x + ox + 60, y + 30); g.lineTo(x + ox, y + 60); g.lineTo(x + ox - 60, y + 30); g.fill(); }
  const sheen = g.createLinearGradient(0, 160, 0, 720); sheen.addColorStop(0, 'rgba(255,220,160,0.12)'); sheen.addColorStop(1, 'rgba(0,0,0,0.25)'); g.fillStyle = sheen; g.fillRect(0, 160, 1280, 560);
  g.restore();
  }));
  // chandeliers (their light pools on the floor)
  for (let k = 0; k < 3; k++) { const x = 320 + k * 320, sw = Math.sin(m.t * 0.8 + k) * 4; MGH.glow(g, x, 420, 260, 'rgba(255,210,140,0.12)');
    g.strokeStyle = '#c8a050'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + sw, 50); g.stroke();
    g.fillStyle = '#d8b060'; g.beginPath(); g.ellipse(x + sw, 56, 44, 10, 0, 0, 7); g.fill(); g.fillStyle = '#a88030'; g.beginPath(); g.ellipse(x + sw, 60, 30, 6, 0, 0, Math.PI); g.fill();
    for (let q = -3; q <= 3; q++) { const cx = x + sw + q * 13; g.fillStyle = '#fff4dc'; g.fillRect(cx - 2, 40, 4, 12); MGH.glow(g, cx, 38, 12, 'rgba(255,220,120,0.8)'); g.fillStyle = '#ffd34d'; g.beginPath(); g.ellipse(cx, 37 + Math.sin(m.t * 12 + q) * 0.6, 2, 4, 0, 0, 7); g.fill(); }
    for (let q = 0; q < 8; q++) { g.fillStyle = 'rgba(220,240,255,0.8)'; g.beginPath(); g.arc(x + sw - 40 + q * 11.5, 70 + Math.abs(Math.sin(q)) * 6, 2.5, 0, 7); g.fill(); }
  }
  // confetti drifting
  for (let k = 0; k < 30; k++) { const x = (MGH.hash(k) * 1280 + Math.sin(m.t + k) * 20), y = (MGH.hash(k + 5) * 600 + m.t * 30) % 560 + 160; g.fillStyle = ['#ffd34d', '#ff6aa0', '#6ad0ff', '#a0ff7a'][k % 4]; g.save(); g.translate(x, y); g.rotate(m.t * 3 + k); g.fillRect(-3, -1.5, 6, 3); g.restore(); }
  const ents = S.all.map(b => ({ y: b.y, f: () => {
    const mv = Math.min(1, Math.hypot(b.vx, b.vy) / 100), ph = m.t * 2.2 + b.x * 0.013 + b.y * 0.007, bob = Math.abs(Math.sin(ph)) * 3, sw = Math.sin(m.t * 6 + b.x * 0.1) * mv * 3 + Math.sin(ph) * 1.5;
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.ellipse(b.x, b.y + 30, 26, 7, 0, 0, 7); g.fill();
    g.save(); g.globalAlpha = 0.15; g.scale(1, -1); g.fillStyle = '#7a3a8a'; g.beginPath(); g.moveTo(b.x - 24, -(b.y + 32)); g.quadraticCurveTo(b.x, -(b.y + 60), b.x + 24, -(b.y + 32)); g.fill(); g.restore();
    if (b.glow > 0) MGH.glow(g, b.x, b.y, 56, b.npc ? 'rgba(255,255,255,0.45)' : (m.players[b.i] ? m.players[b.i].color + 'aa' : '#fff'));
    const y = b.y - bob;
    // flowing gown / cloak with gold trim, swaying hem
    const gg = g.createLinearGradient(b.x - 24, 0, b.x + 24, 0); gg.addColorStop(0, '#3a1050'); gg.addColorStop(0.5, '#7a2a9a'); gg.addColorStop(1, '#2a0a3a'); g.fillStyle = gg;
    g.beginPath(); g.moveTo(b.x - 9 + sw * 0.3, y - 6); g.quadraticCurveTo(b.x - 20, y + 10, b.x - 26 - sw, y + 30); for (let q = 0; q <= 6; q++) g.lineTo(b.x - 26 + q * 52 / 6 - sw * (1 - q / 3), y + 30 + Math.sin(ph * 2 + q) * 2); g.quadraticCurveTo(b.x + 20, y + 10, b.x + 9 + sw * 0.3, y - 6); g.fill();
    g.strokeStyle = '#e8c060'; g.lineWidth = 2; g.beginPath(); g.moveTo(b.x - 26 - sw, y + 30); for (let q = 0; q <= 6; q++) g.lineTo(b.x - 26 + q * 52 / 6 - sw * (1 - q / 3), y + 30 + Math.sin(ph * 2 + q) * 2); g.stroke();
    g.beginPath(); g.moveTo(b.x, y - 4); g.lineTo(b.x, y + 26); g.stroke();
    g.fillStyle = '#e8c060'; g.beginPath(); g.arc(b.x, y + 2, 3, 0, 7); g.fill();
    // white gloves, one raised as if dancing
    g.fillStyle = '#fff'; g.beginPath(); g.arc(b.x - 17 - sw * 0.5, y + 8 + Math.sin(ph) * 3, 4.5, 0, 7); g.arc(b.x + 17, y - 2 - Math.abs(Math.sin(ph)) * 6, 4.5, 0, 7); g.fill();
    // head + venetian mask with feather plume
    const hx = b.x + sw * 0.6;
    const fr = b.face && b.face.x > 0.25 ? 1 : 0, spr = GX._mask && GX._mask[fr] || (GX._mask = GX._mask || [])[fr] || (GX._mask[fr] = (() => { const c = document.createElement('canvas'); c.width = 160; c.height = 160; const q = c.getContext('2d'); q.scale(2, 2); const hx = 40, y = 58;
      Char.npc(q, hx, y - 18, 15, 'host', { mood: 'happy', headOnly: true, look: { x: fr ? 1 : -1, y: 0 }, seed: 3, t: 0, noShadow: true });
      const g = q;
      const mk = g.createLinearGradient(hx - 16, 0, hx + 16, 0); mk.addColorStop(0, '#b8862a'); mk.addColorStop(0.5, '#fff0a8'); mk.addColorStop(1, '#b8862a'); g.fillStyle = mk;
      g.beginPath(); g.moveTo(hx - 17, y - 22); g.quadraticCurveTo(hx - 9, y - 28, hx, y - 21); g.quadraticCurveTo(hx + 9, y - 28, hx + 17, y - 22); g.quadraticCurveTo(hx + 14, y - 11, hx + 5, y - 13); g.quadraticCurveTo(hx, y - 16, hx - 5, y - 13); g.quadraticCurveTo(hx - 14, y - 11, hx - 17, y - 22); g.fill();
      g.fillStyle = '#1a0a20'; g.beginPath(); g.ellipse(hx - 7, y - 19, 4, 2.6, 0.15, 0, 7); g.ellipse(hx + 7, y - 19, 4, 2.6, -0.15, 0, 7); g.fill();
      g.fillStyle = '#e8323e'; g.beginPath(); g.arc(hx, y - 22, 2, 0, 7); g.fill();
        return c; })());
    g.drawImage(spr, hx - 40, y - 58, 80, 80);
    const fw = Math.sin(m.t * 3 + b.x) * 0.15;
    [['#8a3ac8', -0.25], ['#ff5a9a', 0], ['#3ac8c0', 0.25]].forEach(([c, a]) => { g.save(); g.translate(hx + 12, y - 26); g.rotate(a + fw + 0.4); g.fillStyle = c; g.beginPath(); g.ellipse(0, -14, 4, 15, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -27); g.stroke(); g.restore(); });
    if (!b.npc && b.cool > 0) MGH.label(g, m.players[b.i].name, b.x, b.y - 62, 14, m.players[b.i].color);
  } }));
  ents.sort((a, b) => a.y - b.y).forEach(e => e.f());
  m.players.forEach((p, i) => { g.fillStyle = 'rgba(20,0,30,0.6)'; MGH.rr(g, 160 + i * 320 - 70, 168, 140, 28, 14); g.fill(); MGH.text(g, `${p.name} 🎭 ${S.p[i].pts}`, 160 + i * 320, 188, 17, p.color, 'center', 'bold'); });
});

// ===================================================================== Frog Catch: heroes ride big pond frogs that do the licking
MG.byId.frogcatch && (MG.byId.frogcatch.draw = function (m, S, g) {
  // dusk-lit forest pond
  GX.vfill(g, 0, 0, 1280, 480, ['#ffb88a', '#ffd8a8', '#c8e8c0']);
  MGH.glow(g, 640, 420, 300, 'rgba(255,220,150,0.5)');
  const tree = (x, h, c) => { g.fillStyle = c; for (let q = 0; q < 4; q++) { g.beginPath(); g.moveTo(x, 480 - h + q * h * 0.18); g.lineTo(x - h * 0.22 - q * 6, 480 - h * 0.45 + q * h * 0.14); g.lineTo(x + h * 0.22 + q * 6, 480 - h * 0.45 + q * h * 0.14); g.fill(); } g.fillRect(x - 3, 470, 6, 12); };
  for (let k = 0; k < 22; k++) tree(MGH.hash(k) * 1300 - 10, 160 + MGH.hash(k + 3) * 80, '#6a9a7a');
  for (let k = 0; k < 16; k++) tree(MGH.hash(k + 30) * 1300 - 10, 120 + MGH.hash(k + 33) * 90, '#3a6a4a');
  // fireflies
  for (let k = 0; k < 14; k++) { const x = (MGH.hash(k + 60) * 1280 + Math.sin(m.t * 0.7 + k) * 40), y = 200 + MGH.hash(k + 61) * 260 + Math.cos(m.t + k) * 20, a = 0.5 + 0.5 * Math.sin(m.t * 3 + k * 2); MGH.glow(g, x, y, 10, `rgba(255,250,150,${a * 0.8})`); }
  // pond with reflections
  GX.vfill(g, 0, 478, 1280, 242, ['#5a9ab8', '#2f6a98', '#1a4a78']);
  g.save(); g.globalAlpha = 0.18; g.scale(1, -0.35); g.translate(0, -480 / 0.35 * 2 + 0); g.restore();
  for (let k = 0; k < 18; k++) { const x = (k * 113 + m.t * 8) % 1320 - 20, y = 500 + (k * 37) % 200; g.strokeStyle = 'rgba(255,240,220,0.3)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 14, y); g.quadraticCurveTo(x, y - 3, x + 14, y); g.stroke(); }
  // reeds and cattails at the banks
  for (let k = 0; k < 16; k++) { const x = k < 8 ? 10 + k * 14 : 1150 + (k - 8) * 16, sw = Math.sin(m.t * 1.4 + k) * 5; g.strokeStyle = '#4a7a2a'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, 560); g.quadraticCurveTo(x + sw * 0.5, 500, x + sw, 420 + (k % 4) * 14); g.stroke(); if (k % 2) { g.fillStyle = '#6a3a1a'; MGH.rr(g, x + sw - 4, 420 + (k % 4) * 14, 8, 26, 4); g.fill(); } }
  // floating lily flowers
  [[140, 650], [400, 690], [880, 690], [1150, 640]].forEach(([x, y], k) => { g.fillStyle = '#3f8a3a'; g.beginPath(); g.ellipse(x, y, 22, 8, 0, 0.3, 6.0); g.lineTo(x, y); g.fill(); for (let q = 0; q < 6; q++) { const a = q * 1.05 + m.t * 0.2; g.fillStyle = q % 2 ? '#ffd0e0' : '#fff0f4'; g.beginPath(); g.ellipse(x + Math.cos(a) * 6, y - 4 + Math.sin(a) * 2.5, 7, 3, a, 0, 7); g.fill(); } g.fillStyle = '#ffe060'; g.beginPath(); g.arc(x, y - 5, 3, 0, 7); g.fill(); });
  // bugs
  S.bugs.forEach(b => {
    if (b.got && !S.f.some(F => F.hit === b)) return; const fl = Math.sin(m.t * 60 + b.ph) * 0.5 + 0.5;
    g.save(); g.translate(b.x, b.y); if (b.vx < 0) g.scale(-1, 1);
    if (b.kind === 'dragon') { g.fillStyle = 'rgba(200,230,255,0.6)'; [[-4, -1], [4, -1]].forEach(([wx, s]) => { g.beginPath(); g.ellipse(wx, -6, 3, 10 * (0.4 + fl * 0.6), 0.2 * s, 0, 7); g.fill(); g.beginPath(); g.ellipse(wx, 6, 3, 10 * (0.4 + fl * 0.6), -0.2 * s, 0, 7); g.fill(); }); const dg = g.createLinearGradient(-22, 0, 10, 0); dg.addColorStop(0, '#3a6aff'); dg.addColorStop(1, '#3ad8c8'); g.fillStyle = dg; MGH.rr(g, -24, -2, 30, 4, 2); g.fill(); g.beginPath(); g.arc(10, 0, 5, 0, 7); g.fill(); g.fillStyle = '#1a2a6a'; g.beginPath(); g.arc(12, -1, 2, 0, 7); g.fill(); }
    else {
      g.fillStyle = 'rgba(230,245,255,0.7)'; g.beginPath(); g.ellipse(-4, -7, 7, 3 + fl * 3, -0.5, 0, 7); g.ellipse(4, -7, 7, 3 + fl * 3, 0.5, 0, 7); g.fill();
      if (b.kind === 'fly') { g.fillStyle = '#2a2a38'; g.beginPath(); g.ellipse(0, 0, 8, 6, 0, 0, 7); g.fill(); g.fillStyle = '#c8302a'; g.beginPath(); g.arc(6, -2, 2.5, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,0.3)'; g.beginPath(); g.ellipse(-2, -2, 3, 1.5, 0, 0, 7); g.fill(); }
      if (b.kind === 'beetle') { MGH.glow(g, 0, 0, 22, 'rgba(120,255,180,0.5)'); const bg = g.createLinearGradient(-10, -8, 10, 8); bg.addColorStop(0, '#3af0a8'); bg.addColorStop(0.5, '#2a8ad8'); bg.addColorStop(1, '#8a3ae8'); g.fillStyle = bg; g.beginPath(); g.ellipse(0, 0, 11, 8, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(0,30,40,0.6)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-6, 0); g.lineTo(11, 0); g.stroke(); g.fillStyle = '#1a2a30'; g.beginPath(); g.arc(11, 0, 4, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,0.6)'; g.beginPath(); g.ellipse(-2, -4, 4, 1.5, 0, 0, 7); g.fill(); }
      if (b.kind === 'wasp') { g.fillStyle = '#ffd34d'; g.beginPath(); g.ellipse(-2, 0, 11, 6.5, 0, 0, 7); g.fill(); g.fillStyle = '#1a1a1a'; [-6, -1, 4].forEach(sx => g.fillRect(sx, -6, 2.5, 12)); g.beginPath(); g.moveTo(-13, 0); g.lineTo(-19, 1); g.lineTo(-13, 2); g.fill(); g.fillStyle = '#ffd34d'; g.beginPath(); g.arc(10, -1, 4.5, 0, 7); g.fill(); g.fillStyle = '#1a1a1a'; g.beginPath(); g.arc(12, -2, 1.8, 0, 7); g.fill(); g.strokeStyle = '#1a1a1a'; g.lineWidth = 1; g.beginPath(); g.moveTo(12, -5); g.lineTo(15, -10); g.stroke(); }
    }
    g.restore();
  });
  S.f.forEach((F, i) => {
    const [px, py] = this.PADS[i], p = m.players[i], dir = Math.cos(F.ang) >= 0 ? 1 : -1, out = F.t >= 0, breathe = Math.sin(m.t * 3 + i) * 0.04;
    // lily pad
    g.fillStyle = 'rgba(0,20,40,0.3)'; g.beginPath(); g.ellipse(px + 4, py + 20, 76, 22, 0, 0, 7); g.fill();
    const lp = g.createRadialGradient(px - 20, py + 4, 5, px, py + 12, 76); lp.addColorStop(0, '#7ad85a'); lp.addColorStop(1, '#2f8a2e'); g.fillStyle = lp;
    g.beginPath(); g.ellipse(px, py + 14, 74, 22, 0, 0.25, Math.PI * 2 - 0.25); g.lineTo(px, py + 14); g.fill();
    g.strokeStyle = 'rgba(30,90,20,0.5)'; g.lineWidth = 1.5; for (let q = 0; q < 9; q++) { const a = 0.5 + q * 0.62; g.beginPath(); g.moveTo(px, py + 14); g.lineTo(px + Math.cos(a) * 68, py + 14 + Math.sin(a) * 20); g.stroke(); }
    // frog (side view, head toward the aim)
    g.save(); g.translate(px, py); g.scale(dir, 1);
    const fg = g.createRadialGradient(-6, -22, 4, 0, -8, 46); fg.addColorStop(0, '#9ae85a'); fg.addColorStop(1, '#3a9a2a');
    g.fillStyle = '#3a8a2a'; g.beginPath(); g.ellipse(-26, 4, 18, 11, -0.2, 0, 7); g.fill(); // back leg
    g.fillStyle = fg; g.beginPath(); g.ellipse(-4, -10, 40 * (1 + breathe), 24 * (1 - breathe), -0.15, 0, 7); g.fill();
    g.fillStyle = '#f4f0c0'; g.beginPath(); g.ellipse(8, -2, 26, 12, -0.1, 0, Math.PI); g.fill(); // belly
    g.fillStyle = '#ffe8a0'; g.beginPath(); g.ellipse(22, -12, 10 + (out ? 4 : Math.max(0, Math.sin(m.t * 5 + i)) * 3), 8 + (out ? 3 : 0), 0, 0, 7); g.fill(); // throat sac
    g.fillStyle = '#3a8a2a'; g.beginPath(); g.ellipse(18, 10, 9, 5, 0.3, 0, 7); g.fill(); // front foot
    g.fillStyle = fg; g.beginPath(); g.ellipse(20, -24, 22, 16, 0, 0, 7); g.fill(); // head
    g.fillStyle = 'rgba(30,100,20,0.6)'; [[-18, -18, 5], [-4, -28, 4], [-26, -6, 3.5]].forEach(([sx, sy, sr]) => { g.beginPath(); g.arc(sx, sy, sr, 0, 7); g.fill(); });
    // big eye (blinks)
    const blink = Math.sin(m.t * 0.9 + i * 2) > 0.97;
    g.fillStyle = fg; g.beginPath(); g.arc(20, -40, 11, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(22, -41, 8, 0, 7); g.fill();
    if (blink) { g.fillStyle = '#4ab83a'; g.beginPath(); g.arc(22, -41, 8.5, 0, 7); g.fill(); } else { g.fillStyle = '#1a1a1a'; g.beginPath(); g.ellipse(24, -41, 4, 5, 0, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(22.5, -43, 1.6, 0, 7); g.fill(); }
    g.strokeStyle = '#1a5a1a'; g.lineWidth = 2; g.beginPath(); if (out) { g.moveTo(10, -26); g.quadraticCurveTo(28, -18, 40, -27); } else { g.moveTo(10, -22); g.quadraticCurveTo(26, -16, 40, -24); } g.stroke();
    g.fillStyle = 'rgba(255,120,120,0.4)'; g.beginPath(); g.arc(30, -20, 4, 0, 7); g.fill();
    // saddle in the rider's colour
    g.fillStyle = p.color; MGH.rr(g, -26, -38, 30, 10, 5); g.fill(); g.fillStyle = 'rgba(255,255,255,0.4)'; g.fillRect(-24, -37, 26, 2);
    g.restore();
    // the rider, sitting on the frog's back and pointing where to lick
    Char.draw(g, px - dir * 12, py - 62 + Math.sin(m.t * 3 + i) * 1.5, 21, p.el.id, p.color, { mood: MGH.persona(F.fxT > 0 && F.fx.startsWith('-') ? 'hurt' : F.fxT > 0 ? 'cheer' : out ? 'determined' : 'happy', p.el.id), seed: i * 1.7, noShadow: true, noFeet: true, look: { x: Math.cos(F.ang), y: Math.sin(F.ang) }, hands: { n: { x: Math.cos(F.ang) * 1.3 * dir * dir, y: Math.sin(F.ang) * 1.3, d: F.ang * 57, o: false, m: false }, f: { x: -0.6, y: 0.4, d: 0, o: true, m: false } } });
    // tongue from the frog's mouth
    const mx = px + dir * 38, my = py - 26;
    if (out && F.tx !== undefined) { g.strokeStyle = '#c83a5a'; g.lineWidth = 8; g.lineCap = 'round'; g.beginPath(); g.moveTo(mx, my); g.quadraticCurveTo((mx + F.tx) / 2, (my + F.ty) / 2 + 10, F.tx, F.ty); g.stroke(); g.strokeStyle = '#ff7a9a'; g.lineWidth = 4; g.stroke(); g.lineCap = 'butt'; g.fillStyle = '#ff4a7a'; g.beginPath(); g.arc(F.tx, F.ty, 8, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.arc(F.tx - 2, F.ty - 3, 2.5, 0, 7); g.fill(); }
    else { g.strokeStyle = 'rgba(255,255,255,0.4)'; g.setLineDash([4, 8]); g.lineWidth = 2; g.beginPath(); g.moveTo(px, py - 30); g.lineTo(px + Math.cos(F.ang) * 130, py - 30 + Math.sin(F.ang) * 130); g.stroke(); g.setLineDash([]); g.fillStyle = 'rgba(255,255,255,0.6)'; g.beginPath(); g.arc(px + Math.cos(F.ang) * 136, py - 30 + Math.sin(F.ang) * 136, 4, 0, 7); g.fill(); }
    g.fillStyle = 'rgba(0,20,40,0.45)'; MGH.rr(g, px - 64, py + 44, 128, 28, 14); g.fill();
    MGH.text(g, `${p.name}  ${F.pts}`, px, py + 64, 18, p.color, 'center', 'bold');
    if (F.fxT > 0) MGH.text(g, F.fx, px, py - 100 - (0.8 - F.fxT) * 30, 24, F.fx.startsWith('-') ? '#ff6b6b' : '#ffe680', 'center', 'bold');
  });
});
