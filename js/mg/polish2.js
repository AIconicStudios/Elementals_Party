'use strict';
// Graphics pass 2: Splash Zone — a floating marble fountain high above a sea of clouds

MG.byId.splashzone && (MG.byId.splashzone.draw = function (m, S, g) {
  const { CX, CY, RR } = this, t = m.t;
  S._fx = S._fx || []; S._ws = S._ws || {};
  // ---- sky: warm high-altitude gradient, sun, rainbow, distant islands
  GX.vfill(g, 0, 0, 1280, 720, ['#3a7ad8', '#7ab8f0', '#c8e4fa', '#ffe8c8']);
  MGH.glow(g, 1080, 110, 260, 'rgba(255,240,190,0.55)'); g.fillStyle = '#fffbe0'; g.beginPath(); g.arc(1080, 110, 40, 0, 7); g.fill();
  g.save(); g.globalAlpha = 0.22; ['#ff5a5a', '#ffa83a', '#ffe83a', '#5ad85a', '#3ab0ff', '#8a5aff'].forEach((c, k) => { g.strokeStyle = c; g.lineWidth = 9; g.beginPath(); g.arc(200, 760, 560 - k * 9, Math.PI * 1.12, Math.PI * 1.6); g.stroke(); }); g.restore();
  const isle = (x, y, s, k) => { g.save(); g.translate(x + Math.sin(t * 0.5 + k) * 4, y + Math.sin(t * 0.7 + k) * 5); g.scale(s, s);
    g.fillStyle = '#8a7a6a'; g.beginPath(); g.moveTo(-60, 0); g.lineTo(60, 0); g.lineTo(18, 70); g.lineTo(-6, 90); g.lineTo(-30, 50); g.closePath(); g.fill();
    g.fillStyle = '#6ab84a'; g.beginPath(); g.ellipse(0, 0, 62, 14, 0, 0, 7); g.fill(); g.fillStyle = '#4a9a3a'; g.beginPath(); g.arc(-20, -16, 16, 0, 7); g.arc(4, -22, 20, 0, 7); g.arc(26, -12, 14, 0, 7); g.fill();
    g.strokeStyle = 'rgba(230,245,255,0.7)'; g.lineWidth = 4; g.beginPath(); g.moveTo(40, 2); g.quadraticCurveTo(48, 40, 46, 120); g.stroke(); g.restore(); };
  isle(140, 190, 0.7, 0); isle(1170, 300, 0.55, 2); isle(260, 560, 0.45, 4);
  for (let k = 0; k < 5; k++) { const x = (k * 280 + t * 40) % 1500 - 100, y = 90 + (k % 3) * 40 + Math.sin(t * 2 + k) * 4; g.strokeStyle = 'rgba(40,50,80,0.6)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 8, y); g.quadraticCurveTo(x - 4, y - 5 - Math.sin(t * 8 + k) * 3, x, y); g.quadraticCurveTo(x + 4, y - 5 - Math.sin(t * 8 + k) * 3, x + 8, y); g.stroke(); }
  // ---- sea of clouds far below, drifting in layers
  for (let l = 0; l < 3; l++) for (let k = 0; k < 9; k++) { const x = ((k * 190 + t * (8 + l * 10)) % 1700) - 200, y = 600 + l * 45 + Math.sin(k * 1.7 + l) * 12; MGH.cloud(g, x, y, 38 + l * 10, `rgba(255,255,255,${0.55 + l * 0.15})`); }
  // ---- the floating island under the fountain: rock cone with crystals and roots
  g.save(); g.translate(0, Math.sin(t * 0.8) * 3);
  const rg = g.createLinearGradient(CX - RR, 0, CX + RR, 0); rg.addColorStop(0, '#5a4a40'); rg.addColorStop(0.45, '#9a8470'); rg.addColorStop(1, '#4a3a30');
  g.fillStyle = rg; g.beginPath(); g.moveTo(CX - RR * 0.98, CY + 40); for (let k = 0; k <= 12; k++) { const a = k / 12, x = CX - RR * 0.98 + a * RR * 1.96, yy = CY + 60 + Math.sin(a * Math.PI) * (220 + Math.sin(k * 2.3) * 40) + (k % 2) * 30; g.lineTo(x, yy); } g.lineTo(CX + RR * 0.98, CY + 40); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(40,30,20,0.4)'; g.lineWidth = 2; for (let k = 0; k < 8; k++) { const x = CX - 200 + k * 58; g.beginPath(); g.moveTo(x, CY + 80); g.lineTo(x + 10, CY + 120 + (k % 3) * 40); g.stroke(); }
  [[-120, 210, '#7ae0ff'], [60, 250, '#b88aff'], [170, 180, '#7ae0ff']].forEach(([dx, dy, c]) => { MGH.glow(g, CX + dx, CY + dy, 30, c + '88'); g.fillStyle = c; g.beginPath(); g.moveTo(CX + dx, CY + dy - 22); g.lineTo(CX + dx + 9, CY + dy); g.lineTo(CX + dx, CY + dy + 14); g.lineTo(CX + dx - 9, CY + dy); g.fill(); g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.moveTo(CX + dx, CY + dy - 20); g.lineTo(CX + dx + 4, CY + dy - 2); g.lineTo(CX + dx, CY + dy); g.fill(); });
  g.strokeStyle = '#4a6a2a'; g.lineWidth = 3; [[-200, 60], [-40, 90], [140, 70], [230, 40]].forEach(([dx, len], k) => { g.beginPath(); g.moveTo(CX + dx, CY + 70); g.quadraticCurveTo(CX + dx + Math.sin(t + k) * 10, CY + 70 + len * 0.6, CX + dx + 8, CY + 70 + len); g.stroke(); });
  // waterfalls spilling off the rim into the clouds
  [-0.75, -0.25, 0.3, 0.8].forEach((u, k) => { const x = CX + u * RR * 0.95, y0 = CY + Math.sqrt(1 - u * u) * RR - 8, w = 22 - Math.abs(u) * 8;
    const wf = g.createLinearGradient(0, y0, 0, 720); wf.addColorStop(0, 'rgba(190,235,255,0.95)'); wf.addColorStop(1, 'rgba(190,235,255,0)'); g.fillStyle = wf;
    g.beginPath(); g.moveTo(x - w / 2, y0); g.quadraticCurveTo(x - w / 2 + u * 20, y0 + 120, x - w * 0.8 + u * 40, 720); g.lineTo(x + w * 0.8 + u * 40, 720); g.quadraticCurveTo(x + w / 2 + u * 20, y0 + 120, x + w / 2, y0); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 2; g.setLineDash([14, 18]); g.lineDashOffset = -t * 160 - k * 9; g.beginPath(); g.moveTo(x, y0); g.quadraticCurveTo(x + u * 20, y0 + 120, x + u * 40, 720); g.stroke(); g.setLineDash([]); });
  g.restore();
  // ---- marble rim + pool (true circle: the edge you see is the edge you fall from)
  GX.shadow(g, CX, CY + RR * 0.2, RR * 1.05, 0.25);
  const lip = g.createLinearGradient(0, CY + RR - 40, 0, CY + RR + 30); lip.addColorStop(0, '#f4f2ee'); lip.addColorStop(1, '#a8a09a');
  g.fillStyle = lip; g.beginPath(); g.arc(CX, CY + 14, RR + 16, 0, 7); g.fill();
  g.fillStyle = '#f6f4f0'; g.beginPath(); g.arc(CX, CY, RR + 16, 0, 7); g.fill();
  for (let k = 0; k < 36; k++) { const a = k / 36 * Math.PI * 2; g.strokeStyle = 'rgba(140,130,120,0.35)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(CX + Math.cos(a) * RR, CY + Math.sin(a) * RR); g.lineTo(CX + Math.cos(a) * (RR + 16), CY + Math.sin(a) * (RR + 16)); g.stroke(); }
  for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2 + 0.13; g.fillStyle = k % 2 ? '#3ab0d8' : '#e8b83a'; g.beginPath(); g.arc(CX + Math.cos(a) * (RR + 8), CY + Math.sin(a) * (RR + 8), 3.5, 0, 7); g.fill(); }
  g.save(); g.beginPath(); g.arc(CX, CY, RR, 0, 7); g.clip();
  const pool = g.createRadialGradient(CX - 60, CY - 80, 30, CX, CY, RR); pool.addColorStop(0, '#8ee4ff'); pool.addColorStop(0.6, '#3cb0e8'); pool.addColorStop(1, '#1f78c0'); g.fillStyle = pool; g.fillRect(CX - RR, CY - RR, RR * 2, RR * 2);
  // mosaic floor under the water + rings toward the edge (danger zone tinted)
  for (let r = 0; r < 4; r++) for (let k = 0; k < 16 + r * 8; k++) { const a = k / (16 + r * 8) * Math.PI * 2 + r * 0.2, rr = 140 + r * 38; g.fillStyle = (k + r) % 2 ? 'rgba(255,255,255,0.08)' : 'rgba(10,60,120,0.12)'; g.beginPath(); g.arc(CX + Math.cos(a) * rr, CY + Math.sin(a) * rr, 9, 0, 7); g.fill(); }
  const edge = g.createRadialGradient(CX, CY, RR * 0.72, CX, CY, RR); edge.addColorStop(0, 'rgba(255,80,60,0)'); edge.addColorStop(1, `rgba(255,90,70,${0.22 + 0.06 * Math.sin(t * 4)})`); g.fillStyle = edge; g.fillRect(CX - RR, CY - RR, RR * 2, RR * 2);
  // caustics shimmer
  g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(200,245,255,0.16)'; g.lineWidth = 2.5;
  for (let k = 0; k < 22; k++) { const a = MGH.hash(k) * 6.28, d = MGH.hash(k + 3) * RR * 0.95, x = CX + Math.cos(a) * d + Math.sin(t + k) * 8, y = CY + Math.sin(a) * d + Math.cos(t * 1.3 + k) * 6; g.beginPath(); g.ellipse(x, y, 18 + Math.sin(t * 2 + k) * 6, 9, a, 0, 5); g.stroke(); }
  g.restore();
  for (let k = 0; k < 4; k++) { const ph = (t * 0.35 + k / 4) % 1; g.strokeStyle = `rgba(255,255,255,${0.3 * (1 - ph)})`; g.lineWidth = 2; g.beginPath(); g.arc(CX, CY, 70 + ph * (RR - 70), 0, 7); g.stroke(); }
  g.restore();
  g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 3; g.beginPath(); g.arc(CX, CY, RR, 0, 7); g.stroke();
  // ---- central tiered fountain (the refill spot)
  const refilling = S.b.some(b => b.fill > 0.25 && b.lives > 0 && b.fall <= 0);
  MGH.glow(g, CX, CY, 130, refilling ? 'rgba(160,230,255,0.55)' : 'rgba(160,230,255,0.25)');
  g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 2; g.setLineDash([6, 8]); g.lineDashOffset = -t * 20; g.beginPath(); g.arc(CX, CY, 110, 0, 7); g.stroke(); g.setLineDash([]);
  const basin = (r, y, c1, c2) => { const bg = g.createLinearGradient(CX - r, 0, CX + r, 0); bg.addColorStop(0, c2); bg.addColorStop(0.45, c1); bg.addColorStop(1, c2); g.fillStyle = bg; g.beginPath(); g.ellipse(CX, y + 8, r, r * 0.42, 0, 0, Math.PI); g.lineTo(CX - r, y); g.fill(); g.fillStyle = '#f4f2ee'; g.beginPath(); g.ellipse(CX, y, r, r * 0.42, 0, 0, 7); g.fill(); g.fillStyle = '#5ac4f0'; g.beginPath(); g.ellipse(CX, y + 1, r * 0.82, r * 0.32, 0, 0, 7); g.fill(); };
  basin(64, CY + 8, '#f0ece6', '#a8a098');
  g.fillStyle = '#d8d4ce'; g.fillRect(CX - 9, CY - 46, 18, 52);
  basin(36, CY - 46, '#f0ece6', '#a8a098');
  g.fillStyle = '#d8d4ce'; g.fillRect(CX - 5, CY - 78, 10, 32); g.fillStyle = '#e8c060'; g.beginPath(); g.arc(CX, CY - 82, 8, 0, 7); g.fill();
  // arcing jets from the top into the lower basin + the pool
  for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2 + t * 0.4, h = 46 + Math.sin(t * 4 + k) * 8, ex = CX + Math.cos(a) * 58, ey = CY + 8 + Math.sin(a) * 22;
    g.strokeStyle = 'rgba(210,245,255,0.9)'; g.lineWidth = 3.5; g.beginPath(); g.moveTo(CX, CY - 86); g.quadraticCurveTo(CX + Math.cos(a) * 34, CY - 86 - h, ex, ey); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 1.2; g.stroke();
    const ph = (t * 2 + k / 8) % 1; g.fillStyle = `rgba(230,250,255,${1 - ph})`; g.beginPath(); g.arc(ex + Math.cos(a) * ph * 10, ey - Math.sin(ph * Math.PI) * 8, 2.5, 0, 7); g.fill(); }
  for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2 - t * 0.6, ph = (t * 1.4 + k * 0.1) % 1; g.fillStyle = `rgba(230,250,255,${0.8 * (1 - ph)})`; g.beginPath(); g.arc(CX + Math.cos(a) * (64 + ph * 30), CY + 10 + Math.sin(a) * (26 + ph * 14) - Math.sin(ph * Math.PI) * 26, 2.5, 0, 7); g.fill(); }
  if (refilling) MGH.label(g, '💧 refilling', CX, CY + 92, 14, '#cfefff');
  // ---- water shots: tapered streams with foam heads and trailing droplets
  S.jets.forEach(j => {
    const l = Math.hypot(j.vx, j.vy) || 1, ux = j.vx / l, uy = j.vy / l, len = j.big ? 90 : 46, w = j.big ? 16 : 7, tx = j.x - ux * len, ty = j.y - uy * len, px = -uy, py = ux;
    const sg = g.createLinearGradient(tx, ty, j.x, j.y); sg.addColorStop(0, 'rgba(170,225,255,0)'); sg.addColorStop(1, j.big ? 'rgba(200,240,255,0.95)' : 'rgba(190,235,255,0.9)');
    g.fillStyle = sg; g.beginPath(); g.moveTo(tx, ty); g.lineTo(j.x + px * w, j.y + py * w); g.arc(j.x, j.y, w, Math.atan2(py, px), Math.atan2(py, px) + Math.PI, true); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = j.big ? 3 : 1.5; g.beginPath(); g.moveTo(tx + px * w * 0.3, ty + py * w * 0.3); g.lineTo(j.x + px * w * 0.4, j.y + py * w * 0.4); g.stroke();
    if (j.big) { g.fillStyle = 'rgba(255,255,255,0.9)'; for (let q = 0; q < 5; q++) { g.beginPath(); g.arc(j.x + px * (q - 2) * 5 + Math.sin(t * 40 + q) * 2, j.y + py * (q - 2) * 5, 5, 0, 7); g.fill(); } }
    for (let q = 1; q <= 4; q++) { g.fillStyle = `rgba(200,240,255,${0.7 - q * 0.15})`; g.beginPath(); g.arc(tx - ux * q * 8 + px * Math.sin(q * 3 + t * 30) * 6, ty - uy * q * 8 + py * Math.sin(q * 3 + t * 30) * 6, 2.5, 0, 7); g.fill(); }
    if (!j._fx) { j._fx = true; S._fx.push({ k: 'muzzle', x: j.x, y: j.y, t: 0, big: j.big }); }
  });
  // remember hits (jets vanish on impact) to show splashes where they landed
  S.b.forEach((b, i) => { const w = S._ws[i] || {}; const kick = Math.hypot(b.kx || 0, b.ky || 0); if (kick > 120 && (w.k || 0) < 120 && b.fall <= 0) S._fx.push({ k: 'hit', x: b.x, y: b.y - 14, t: 0, big: kick > 400 }); if (b.fall > 1.5 && !(w.f > 1.5)) S._fx.push({ k: 'fall', x: b.x, y: b.y, t: 0 }); S._ws[i] = { k: kick, f: b.fall }; });
  S._fx.forEach(f => { f.t += m.dt || 1 / 60; });
  S._fx = S._fx.filter(f => f.t < (f.k === 'fall' ? 1.2 : 0.5));
  S._fx.forEach(f => {
    if (f.k === 'muzzle') { const a = 1 - f.t / 0.5; MGH.glow(g, f.x, f.y, f.big ? 40 : 18, `rgba(210,245,255,${0.7 * a})`); }
    if (f.k === 'hit') { const k = f.t / 0.5; for (let q = 0; q < (f.big ? 12 : 7); q++) { const an = q / (f.big ? 12 : 7) * Math.PI * 2; g.fillStyle = `rgba(210,245,255,${1 - k})`; g.beginPath(); g.ellipse(f.x + Math.cos(an) * k * (f.big ? 60 : 34), f.y + Math.sin(an) * k * (f.big ? 40 : 24) - Math.sin(k * Math.PI) * 14, 3, 5, an, 0, 7); g.fill(); } g.strokeStyle = `rgba(255,255,255,${0.8 * (1 - k)})`; g.lineWidth = 2; g.beginPath(); g.arc(f.x, f.y + 20, 10 + k * 40, 0, 7); g.stroke(); }
  });
  // ---- heroes wading in the pool with soakers
  const ents = S.b.map((b, i) => ({ y: b.y, f: () => {
    if (b.lives <= 0) return; const p = m.players[i];
    if (b.fall > 0) { const k = 1 - b.fall / 1.6, out = Math.hypot(b.x - CX, b.y - CY) || 1, ox = (b.x - CX) / out, oy = (b.y - CY) / out;
      g.save(); g.globalAlpha = Math.max(0, 1 - k * 1.1); g.translate(b.x + ox * k * 80, b.y + oy * k * 40 + k * k * 420 - Math.sin(Math.min(1, k * 3) * Math.PI) * 30); g.rotate(k * 10 * (ox >= 0 ? 1 : -1)); g.scale(1 - k * 0.5, 1 - k * 0.5);
      Char.draw(g, 0, 0, 24, p.el.id, p.color, { mood: MGH.persona('scared', p.el.id), seed: i * 1.7, noShadow: true }); g.restore();
      if (k > 0.6) { const c = (k - 0.6) / 0.4; MGH.cloud(g, b.x + ox * 80, 640 + Math.sin(i) * 20, 30 * (0.5 + c), `rgba(255,255,255,${0.9 * (1 - c)})`); }
      return; }
    if (b.inv > 0 && Math.floor(t * 12) % 2) g.globalAlpha = 0.45;
    const sp = Math.hypot(b.vx, b.vy) + Math.hypot(b.kx || 0, b.ky || 0);
    // wading ripples + wake
    for (let q = 0; q < 2; q++) { const ph = (t * 1.6 + q * 0.5 + i * 0.2) % 1; g.strokeStyle = `rgba(255,255,255,${0.55 * (1 - ph)})`; g.lineWidth = 2; g.beginPath(); g.ellipse(b.x, b.y + 22, 20 + ph * 22, 7 + ph * 7, 0, 0, 7); g.stroke(); }
    if (sp > 80) for (let q = 1; q <= 3; q++) { const vx = (b.vx + (b.kx || 0)) / sp, vy = (b.vy + (b.ky || 0)) / sp; g.fillStyle = `rgba(230,250,255,${0.5 - q * 0.12})`; g.beginPath(); g.arc(b.x - vx * q * 14 + Math.sin(t * 20 + q) * 4, b.y + 18 - vy * q * 8 - q * 2, 4 - q * 0.6, 0, 7); g.fill(); }
    const charging = b.hold > 0.45 && b.water >= 3;
    if (charging) { MGH.glow(g, b.x, b.y - 10, 46 + Math.sin(t * 30) * 4, 'rgba(120,200,255,0.65)'); for (let q = 0; q < 6; q++) { const an = t * 6 + q; g.fillStyle = 'rgba(200,240,255,0.9)'; g.beginPath(); g.arc(b.x + Math.cos(an) * (30 - (t * 40 + q * 5) % 24), b.y - 10 + Math.sin(an) * (22 - (t * 40 + q * 5) % 18), 2.5, 0, 7); g.fill(); } }
    const lean = clamp((b.vx + (b.kx || 0)) / 900, -0.25, 0.25) + (charging ? Math.sin(t * 50) * 0.02 : 0);
    g.save(); g.translate(b.x, b.y + 22); g.rotate(lean);
    Char.draw(g, 0, -28, 24, p.el.id, p.color, { mood: MGH.persona(Math.hypot(b.kx || 0, b.ky || 0) > 200 ? 'hurt' : charging ? 'effort' : b.fill > 0 ? 'happy' : 'determined', p.el.id), seed: i * 1.7, look: b.aim, walk: sp > 40 ? 1 : 0, noShadow: true });
    g.restore();
    // water line hides the feet a little
    g.fillStyle = 'rgba(80,180,240,0.55)'; g.beginPath(); g.ellipse(b.x, b.y + 22, 22, 7, 0, 0, 7); g.fill();
    // super-soaker: tank shows the water level, recoils on firing
    const rec = b.cd > 0 ? b.cd / 0.15 * 6 : 0, ang = Math.atan2(b.aim.y, b.aim.x);
    g.save(); g.translate(b.x + b.aim.x * (18 - rec), b.y - 14 + b.aim.y * 14); g.rotate(ang); if (Math.abs(ang) > Math.PI / 2) g.scale(1, -1);
    const gb = g.createLinearGradient(0, -8, 0, 8); gb.addColorStop(0, Char.shade(p.color, 0.3)); gb.addColorStop(1, Char.shade(p.color, -0.25)); g.fillStyle = gb; MGH.rr(g, -6, -7, 32, 12, 5); g.fill();
    g.fillStyle = '#ffd34d'; MGH.rr(g, 24, -4, 10, 6, 2); g.fill(); g.fillStyle = '#333'; g.fillRect(2, 4, 6, 9);
    g.fillStyle = 'rgba(255,255,255,0.35)'; MGH.rr(g, 2, -17, 20, 11, 5); g.fill(); g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 1.2; g.stroke();
    g.fillStyle = '#5ac8ff'; const wl = 18 * clamp(b.water / 10, 0, 1); MGH.rr(g, 3, -16, Math.max(1, wl), 9, 4); g.fill();
    g.restore();
    g.globalAlpha = 1;
    if (b.water < 1 && b.fill <= 0) MGH.text(g, 'empty! hold B at the fountain', b.x, b.y - 66, 12, '#ffe0e0', 'center', 'bold');
  } }));
  ents.sort((a, b) => a.y - b.y).forEach(e => e.f());
  // ---- player cards: lives as droplets + water tank
  m.players.forEach((p, i) => { const b = S.b[i], x = 160 + i * 320, y = 66; g.fillStyle = 'rgba(10,40,80,0.55)'; MGH.rr(g, x - 110, y - 20, 220, 44, 22); g.fill(); g.strokeStyle = b.lives > 0 ? p.color : 'rgba(255,255,255,0.2)'; g.lineWidth = 2.5; g.stroke();
    MGH.text(g, p.name, x - 54, y + 7, 17, b.lives > 0 ? p.color : 'rgba(255,255,255,0.4)', 'center', 'bold');
    for (let k = 0; k < 3; k++) { const on = k < b.lives, dx = x + 6 + k * 22, dy = y - 2; g.fillStyle = on ? '#5ac8ff' : 'rgba(255,255,255,0.15)'; g.beginPath(); g.moveTo(dx, dy - 10); g.quadraticCurveTo(dx + 8, dy + 2, dx, dy + 8); g.quadraticCurveTo(dx - 8, dy + 2, dx, dy - 10); g.fill(); }
    if (b.lives > 0) { g.fillStyle = 'rgba(255,255,255,0.15)'; MGH.rr(g, x + 72, y - 10, 28, 20, 4); g.fill(); g.fillStyle = '#5ac8ff'; const h = 18 * clamp(b.water / 10, 0, 1); g.fillRect(x + 73, y + 9 - h, 26, h); } else MGH.text(g, 'OUT', x + 86, y + 6, 14, '#ff9a8a', 'center', 'bold'); });
});
