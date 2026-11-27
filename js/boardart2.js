'use strict';
// =====================================================================================================
// The Crossing — the big art pass: four regions, raised spaces, landmarks for every event, the fork
// guardians, the zoo beast, living wildlife and a time-of-day light that sweeps shadows round the board.
// =====================================================================================================
(() => {
  const H = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const W = () => BD.W, Hh = () => BD.H;
  const bez = (A, C, E, f) => { const u = 1 - f; return { x: u * u * A.x + 2 * u * f * C.x + f * f * E.x, y: u * u * A.y + 2 * u * f * C.y + f * f * E.y }; };
  // the creek runs from the right-hand lens, under Crystal Creek's boardwalk, into the pond
  const CREEK = [{ x: 2039, y: 432 }, { x: 2012, y: 776 }, { x: 1724, y: 949 }];
  // the rope bridge always sits in the middle of Crystal Creek, where the creek passes underneath
  BD.BRANCHMIX[1] = ['chest', 'geyser', 'bridge', 'red', 'blue'];
  const oldLayout = BD.layout;
  BD.layout = () => { oldLayout(); const B = BD.BRANCHES[1], m = R.shuffle(['chest', 'geyser', 'red', 'blue']); B.ids.forEach((id, q) => { BD.spaces[id].type = q === 2 ? 'bridge' : m[q > 2 ? q - 1 : q]; }); BoardArt._g = null; BoardArt._props = null; BoardArt._d = null; };
  BD.layout();

  // ----------------------------------------------------------------- light: day → golden hour → night, blended smoothly
  const LIGHT = { day: { ang: 0.55, len: 0.45, a: 0.26 }, golden: { ang: 0.12, len: 1.35, a: 0.3 }, night: { ang: 1.2, len: 0.12, a: 0.12 } };
  const mix = { day: 1, golden: 0, night: 0 };
  BoardArt.light = { ang: 0.55, len: 0.45, a: 0.26, night: 0, golden: 0 };
  BoardArt.stepLight = (tod, dt) => { const k = 1 - Math.exp(-dt / 1.1); for (const key of ['day', 'golden', 'night']) mix[key] += ((key === tod ? 1 : 0) - mix[key]) * k;
    const L = BoardArt.light; L.ang = mix.day * LIGHT.day.ang + mix.golden * LIGHT.golden.ang + mix.night * LIGHT.night.ang; L.len = mix.day * LIGHT.day.len + mix.golden * LIGHT.golden.len + mix.night * LIGHT.night.len; L.a = mix.day * LIGHT.day.a + mix.golden * LIGHT.golden.a + mix.night * LIGHT.night.a; L.night = mix.night; L.golden = mix.golden; };
  // a soft shadow cast away from the sun: longer at golden hour, almost gone at night
  BoardArt.sunShadow = (g, x, y, w, h, alpha = 1) => {
    const L = BoardArt.light, len = h * L.len, a = L.ang, cx = x + Math.cos(a) * len * 0.5, cy = y + Math.sin(a) * len * 0.22;
    g.save(); g.translate(cx, cy); g.rotate(a * 0.35); const rx = w * 0.55 + len * 0.5, ry = w * 0.22 + 2;
    const gr = g.createRadialGradient(0, 0, 1, 0, 0, rx); gr.addColorStop(0, `rgba(20,25,45,${L.a * alpha})`); gr.addColorStop(0.7, `rgba(20,25,45,${L.a * alpha * 0.6})`); gr.addColorStop(1, 'rgba(20,25,45,0)');
    g.fillStyle = gr; g.scale(1, ry / rx); g.beginPath(); g.arc(0, 0, rx, 0, 7); g.fill(); g.restore();
  };

  // ----------------------------------------------------------------- landmarks beside the event spaces (outside the loop)
  BoardArt.props = () => {
    if (BoardArt._props) return BoardArt._props;
    const P = [];
    BD.spaces.forEach(s => {
      const k = s.i % 10, side = s.side; if (s.i >= 40) { // branch spaces: their landmark sits on the inner side of the path
        const B = BD.BRANCHES[s.branch], C = B.ctrl, dx = C.x - s.x, dy = C.y - s.y, l = Math.hypot(dx, dy) || 1, off = 62;
        if (['comb', 'mush', 'lantern', 'balloon', 'geyser'].includes(s.type)) P.push({ kind: s.type, x: s.x + dx / l * off, y: s.y + dy / l * off * 0.8 + 18, s });
        return; }
      if (['gate', 'bank', 'blue', 'red', 'swirl'].includes(s.type)) return;
      const out = [[0, -1], [1, 0], [0, 1], [-1, 0]][side], along = k === 4 ? -1 : k === 6 ? 1 : 0, alongV = [[1, 0], [0, 1], [-1, 0], [0, -1]][side];
      const off = side === 0 ? 70 : side === 2 ? 88 : 86;
      P.push({ kind: s.type, x: s.x + out[0] * off + alongV[0] * along * 34, y: s.y + out[1] * off + alongV[1] * along * 34 + (side === 0 ? 10 : 0), s });
    });
    // small landmarks give way to big ones when they would overlap
    const big = ['zoo', 'market', 'raffle', 'bounty', 'pier', 'fountain', 'vane'];
    const keep = P.filter(q => big.includes(q.kind)), small = P.filter(q => !big.includes(q.kind));
    small.forEach(q => { if (!keep.some(k => Math.hypot(k.x - q.x, k.y - q.y) < 95)) keep.push(q); });
    return (BoardArt._props = keep);
  };

  // ----------------------------------------------------------------- the ground (baked once per game)
  BoardArt.ground = function () {
    if (this._g) return this._g;
    const c = document.createElement('canvas'), S = 1.0; c.width = (W() + 400) * S; c.height = (Hh() + 400) * S;
    const g = c.getContext('2d'); g.scale(S, S); g.translate(200, 200);
    const X0 = -200, Y0 = -200, WW = W() + 400, HH = Hh() + 400;
    // meadow: rich greens with warm and cool patches, then a finer painted grain
    const gg = g.createLinearGradient(0, Y0, 0, Y0 + HH); gg.addColorStop(0, '#7cc850'); gg.addColorStop(0.5, '#6abb44'); gg.addColorStop(1, '#4f9e36'); g.fillStyle = gg; g.fillRect(X0, Y0, WW, HH);
    for (let k = 0; k < 600; k++) { const x = X0 + H(k) * WW, y = Y0 + H(k + 300) * HH, r = 50 + H(k + 600) * 190, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, k % 3 ? 'rgba(255,248,170,0.14)' : 'rgba(20,80,40,0.16)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
    // region tints: forest (top), crystal (right), mossy hollow (bottom), lantern lane (left)
    const tint = (x, y, rx, ry, col) => { g.save(); g.translate(x, y); g.scale(1, ry / rx); const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, rx, 0, 7); g.fill(); g.restore(); };
    tint(1400, 198, 980, 360, 'rgba(20,70,40,0.32)'); tint(2275, 825, 450, 620, 'rgba(60,170,200,0.2)'); tint(1400, 1452, 980, 360, 'rgba(70,120,40,0.28)'); tint(525, 825, 450, 620, 'rgba(200,140,60,0.18)');
    for (let k = 0; k < 38000; k++) { const x = X0 + H(k * 3.1) * WW, y = Y0 + H(k * 7.7) * HH; g.fillStyle = H(k) > 0.5 ? 'rgba(25,85,30,0.08)' : 'rgba(225,255,170,0.08)'; g.fillRect(x, y, 3, 2); }
    const tuft = (x, y, sc, seed, c1 = 'rgba(40,110,40,0.75)', c2 = 'rgba(170,230,110,0.8)') => { const n = 5 + Math.floor(H(seed) * 4); for (let b = 0; b < n; b++) { const a = (b / (n - 1) - 0.5) * 1.3 + (H(seed + b) - 0.5) * 0.3, len = (9 + H(seed + b * 3) * 9) * sc, tx = x + Math.sin(a) * len, ty = y - Math.cos(a) * len; const gr = g.createLinearGradient(x, y, tx, ty); gr.addColorStop(0, c1); gr.addColorStop(1, c2); g.strokeStyle = gr; g.lineWidth = 2.2 * sc; g.lineCap = 'round'; g.beginPath(); g.moveTo(x + (b - n / 2) * 1.2 * sc, y); g.quadraticCurveTo(x + Math.sin(a) * len * 0.4, y - len * 0.6, tx, ty); g.stroke(); } };
    for (let k = 0; k < 2500; k++) { const x = X0 + H(k * 4.3 + 1) * WW, y = Y0 + H(k * 6.1 + 2) * HH; g.fillStyle = 'rgba(20,60,20,0.13)'; g.beginPath(); g.ellipse(x + 3, y + 1, 9, 3, 0, 0, 7); g.fill(); tuft(x, y, 0.8 + H(k) * 0.6, k * 7); }
    for (let k = 0; k < 380; k++) { const cx = X0 + H(k * 9.1 + 3) * WW, cy = Y0 + H(k * 5.7 + 8) * HH; for (let q = 0; q < 6; q++) { const x = cx + (H(k + q) - 0.5) * 30, y = cy + (H(k + q + 9) - 0.5) * 18; g.fillStyle = q % 2 ? '#5cb848' : '#4aa83c'; for (let l = 0; l < 3; l++) { const a = l / 3 * Math.PI * 2 - Math.PI / 2; g.beginPath(); g.arc(x + Math.cos(a) * 3.2, y + Math.sin(a) * 3.2, 3.2, 0, 7); g.fill(); } } }
    for (let k = 0; k < 420; k++) { const cx = X0 + H(k * 5.3 + 9) * WW, cy = Y0 + H(k * 2.9 + 4) * HH, col = ['#ff8ad0', '#ffffff', '#ffd34d', '#c8a0ff', '#ff6a5a'][k % 5]; for (let f = 0; f < 4; f++) { const x = cx + (H(k + f) - 0.5) * 26, y = cy + (H(k + f + 4) - 0.5) * 14; g.strokeStyle = '#3a8a32'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x, y + 7); g.lineTo(x, y); g.stroke(); g.fillStyle = col; for (let q = 0; q < 5; q++) { const a = q / 5 * 6.28; g.beginPath(); g.arc(x + Math.cos(a) * 2.6, y + Math.sin(a) * 2.6, 2.2, 0, 7); g.fill(); } g.fillStyle = '#ffb030'; g.beginPath(); g.arc(x, y, 1.5, 0, 7); g.fill(); } }
    // forest floor in the north: pine needles and cones
    for (let k = 0; k < 500; k++) { const x = 665 + H(k * 2.3) * 1470, y = -231 + H(k * 4.1) * 693; if (y > 429) continue; g.strokeStyle = H(k) > 0.5 ? 'rgba(120,80,40,0.35)' : 'rgba(60,90,40,0.35)'; g.lineWidth = 1.2; const a = H(k + 9) * 6.28; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 7, y + Math.sin(a) * 7); g.stroke(); }
    // moss in the south hollow
    for (let k = 0; k < 160; k++) { const x = 700 + H(k * 3.7) * 1400, y = 1072 + H(k * 1.9) * 693; g.fillStyle = `rgba(${90 + H(k) * 40},${150 + H(k + 1) * 40},60,0.25)`; g.beginPath(); g.ellipse(x, y, 14 + H(k + 2) * 20, 6 + H(k + 3) * 8, 0, 0, 7); g.fill(); }
    // the creek and the pond
    const creek = (w, col) => { g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(CREEK[0].x, CREEK[0].y); g.quadraticCurveTo(CREEK[1].x, CREEK[1].y, CREEK[2].x, CREEK[2].y); g.stroke(); };
    creek(64, 'rgba(60,80,40,0.35)'); creek(56, '#b89a6a'); creek(44, '#2a7ab8'); creek(30, '#3a9ae0'); creek(12, 'rgba(160,230,255,0.5)');
    for (const [dx, dy, r] of [[-26, -8, 16], [22, -12, 14], [0, -22, 18], [-14, 10, 10]]) { g.fillStyle = '#8a8a96'; g.beginPath(); g.ellipse(CREEK[0].x + dx, CREEK[0].y + dy, r, r * 0.7, 0, 0, 7); g.fill(); g.fillStyle = '#b8b8c4'; g.beginPath(); g.ellipse(CREEK[0].x + dx - 3, CREEK[0].y + dy - 4, r * 0.5, r * 0.3, 0, 0, 7); g.fill(); }
    for (let k = 0; k < 18; k++) { const f = k / 18, p = bez(CREEK[0], CREEK[1], CREEK[2], f); g.fillStyle = '#8a8a96'; g.beginPath(); g.ellipse(p.x + (k % 2 ? 30 : -30), p.y + 4, 7, 4, 0, 0, 7); g.fill(); }
    const px = 1706, py = 957;
    g.fillStyle = 'rgba(0,0,0,0.16)'; g.beginPath(); g.ellipse(px + 6, py + 8, 100, 56, 0, 0, 7); g.fill();
    g.fillStyle = '#b89a6a'; g.beginPath(); g.ellipse(px, py, 98, 54, 0, 0, 7); g.fill();
    const pg = g.createRadialGradient(px - 22, py - 16, 6, px, py, 92); pg.addColorStop(0, '#9ae8ff'); pg.addColorStop(0.6, '#3a9ae0'); pg.addColorStop(1, '#1f5aa8'); g.fillStyle = pg; g.beginPath(); g.ellipse(px, py, 88, 46, 0, 0, 7); g.fill();
    for (const [x, y] of [[px - 52, py + 14], [px + 46, py - 18], [px + 26, py + 24]]) { g.fillStyle = '#3a9a3a'; g.beginPath(); g.ellipse(x, y, 15, 8, 0, 0.4, Math.PI * 2 - 0.2); g.lineTo(x, y); g.fill(); g.fillStyle = '#ff9ac8'; g.beginPath(); g.arc(x + 4, y - 3, 3.5, 0, 7); g.fill(); }
    // the main loop: a sandy road with worn verges, grain and tufts
    const C = BD.CORNERS, loop = () => { g.beginPath(); g.moveTo(C[0].x + 40, C[0].y); for (let k = 1; k <= 4; k++) { const a = C[k % 4], b = C[(k + 1) % 4]; g.arcTo(a.x, a.y, b.x, b.y, 40); } g.closePath(); };
    g.lineCap = 'round'; g.lineJoin = 'round';
    for (const [lw, col] of [[104, 'rgba(50,80,25,0.32)'], [92, '#a8824e'], [82, '#d8b878'], [60, '#ecd49a'], [20, 'rgba(255,245,210,0.35)']]) { g.strokeStyle = col; g.lineWidth = lw; loop(); g.stroke(); }
    for (let k = 0; k < 2800; k++) { const f = H(k + 11), side = Math.floor(H(k + 33) * 4), a = C[side], b = C[(side + 1) % 4], off = (H(k + 55) - 0.5) * 70; const x = a.x + (b.x - a.x) * f + (side % 2 ? off : 0), y = a.y + (b.y - a.y) * f + (side % 2 ? 0 : off); g.fillStyle = H(k) > 0.5 ? 'rgba(140,100,55,0.35)' : 'rgba(255,248,215,0.5)'; g.beginPath(); g.arc(x, y, 1.4 + H(k + 7) * 1.8, 0, 7); g.fill(); }
    for (let side = 0; side < 4; side++) { const a = C[side], b = C[(side + 1) % 4]; for (let k = 0; k < 90; k++) { const f = (k + H(k + side * 50)) / 90, off = (k % 2 ? 1 : -1) * (44 + H(k + side) * 8), x = a.x + (b.x - a.x) * f + (side % 2 ? off : 0), y = a.y + (b.y - a.y) * f + (side % 2 ? 0 : off); tuft(x, y + 4, 0.7 + H(k) * 0.4, k * 13 + side); } }
    // the four inner paths, each in its region's style
    BD.BRANCHES.forEach((B, bi) => { const A = BD.spaces[B.a], E = BD.spaces[B.b], cv = () => { g.beginPath(); g.moveTo(A.x, A.y); g.quadraticCurveTo(B.ctrl.x, B.ctrl.y, E.x, E.y); };
      const pal = [['#6a4a2a', '#8a6038', '#a87a48'], ['#5a3a1a', '#8a6034', '#b8884e'], ['#4a5a3a', '#6a7a4a', '#8a9a62'], ['#6a5a50', '#9a8a7a', '#c8b8a0']][bi];
      for (const [lw, col] of [[90, 'rgba(40,60,20,0.32)'], [78, pal[0]], [68, pal[1]], [48, pal[2]]]) { g.strokeStyle = col; g.lineWidth = lw; cv(); g.stroke(); }
      for (let k = 0; k <= 60; k++) { const f = k / 60, p = bez(A, B.ctrl, E, f), q = bez(A, B.ctrl, E, Math.min(1, f + 0.01)), dx = q.x - p.x, dy = q.y - p.y, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
        if (bi === 1) { g.strokeStyle = 'rgba(40,24,10,0.55)'; g.lineWidth = 2; g.beginPath(); g.moveTo(p.x + nx * 30, p.y + ny * 30); g.lineTo(p.x - nx * 30, p.y - ny * 30); g.stroke(); }                       // boardwalk planks
        else if (bi === 3) { for (let q2 = -2; q2 <= 2; q2++) { g.fillStyle = H(k * 7 + q2) > 0.5 ? 'rgba(220,210,190,0.55)' : 'rgba(140,125,110,0.5)'; g.beginPath(); g.ellipse(p.x + nx * q2 * 12 + (k % 2) * 5, p.y + ny * q2 * 12, 6, 4.5, 0, 0, 7); g.fill(); } } // cobbles
        else if (bi === 2) { if (k % 2) { g.fillStyle = 'rgba(110,170,70,0.5)'; g.beginPath(); g.ellipse(p.x + nx * (H(k) - 0.5) * 40, p.y + ny * (H(k + 2) - 0.5) * 40, 9, 5, 0, 0, 7); g.fill(); } }        // moss on stones
        else { g.strokeStyle = 'rgba(70,45,20,0.4)'; g.lineWidth = 1.2; const a = H(k) * 6.28; g.beginPath(); g.moveTo(p.x + nx * (H(k + 5) - 0.5) * 50, p.y + ny * (H(k + 5) - 0.5) * 50); g.lineTo(p.x + nx * (H(k + 5) - 0.5) * 50 + Math.cos(a) * 8, p.y + ny * (H(k + 5) - 0.5) * 50 + Math.sin(a) * 8); g.stroke(); } // needles
        if (k % 3 === 0) tuft(p.x + nx * 42 * (k % 2 ? 1 : -1), p.y + ny * 42 * (k % 2 ? 1 : -1) + 4, 0.7, k * 19 + bi);
      } });
    // the creek shows through between the boardwalk's planks at the bridge
    // paths out to the holds
    BD.HOLDS.forEach((Hd, k) => { const a = C[k]; for (const [lw, col] of [[74, 'rgba(50,80,25,0.32)'], [62, '#a8824e'], [52, '#d8b878']]) { g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(Hd.x, Hd.y); g.stroke(); } });
    // flower beds
    for (const [x, y] of [[796, 470], [2004, 1180], [1146, 776]]) { g.fillStyle = 'rgba(0,0,0,0.15)'; g.beginPath(); g.ellipse(x + 4, y + 6, 72, 32, 0, 0, 7); g.fill(); g.fillStyle = '#7a4a2a'; g.beginPath(); g.ellipse(x, y, 70, 30, 0, 0, 7); g.fill(); g.strokeStyle = '#a8a8b0'; g.lineWidth = 5; g.beginPath(); g.ellipse(x, y, 70, 30, 0, 0, 7); g.stroke(); for (let k = 0; k < 40; k++) { const a = H(k + x) * 6.28, d = Math.sqrt(H(k + y)) * 58; g.fillStyle = '#3a8a32'; g.beginPath(); g.arc(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.4 + 2, 3, 0, 7); g.fill(); g.fillStyle = ['#ff5a7a', '#ffd34d', '#fff', '#c88aff', '#ff8a3a'][k % 5]; g.beginPath(); g.arc(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.4, 3.6, 0, 7); g.fill(); } }
    // hold platforms
    BD.HOLDS.forEach(Hd => { const r = 110; g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(Hd.x + 10, Hd.y + 16, r + 6, (r + 6) * 0.62, 0, 0, 7); g.fill(); g.fillStyle = '#7a7060'; g.beginPath(); g.ellipse(Hd.x, Hd.y + 10, r, r * 0.62, 0, 0, 7); g.fill(); const sg = g.createRadialGradient(Hd.x - 40, Hd.y - 30, 10, Hd.x, Hd.y, r); sg.addColorStop(0, '#f4ecdc'); sg.addColorStop(1, '#b0a490'); g.fillStyle = sg; g.beginPath(); g.ellipse(Hd.x, Hd.y, r, r * 0.62, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(90,80,60,0.35)'; g.lineWidth = 2; for (let q = 0; q < 12; q++) { const a = q / 12 * 6.28; g.beginPath(); g.moveTo(Hd.x + Math.cos(a) * 40, Hd.y + Math.sin(a) * 25); g.lineTo(Hd.x + Math.cos(a) * r, Hd.y + Math.sin(a) * r * 0.62); g.stroke(); } g.beginPath(); g.ellipse(Hd.x, Hd.y, 40, 25, 0, 0, 7); g.stroke(); });
    // baked warm light from the top-left
    const sun = g.createRadialGradient(150, 50, 50, 300, 200, 1600); sun.addColorStop(0, 'rgba(255,240,180,0.24)'); sun.addColorStop(0.5, 'rgba(255,230,160,0.05)'); sun.addColorStop(1, 'rgba(20,40,80,0.2)'); g.fillStyle = sun; g.fillRect(X0, Y0, WW, HH);
    // the spaces go on top
    BD.spaces.forEach(s => this.space(g, s));
    this._g = c; return c;
  };

  // raised spaces: a little stone drum with a coloured glossy top, carved rim and icon
  BoardArt.space = function (g, s) {
    const T = BD.SPACE[s.type] || BD.SPACE.blue, big = s.type === 'gate' || s.type === 'bank', ev = !['blue', 'red', 'gate', 'bank'].includes(s.type), r = big ? 32 : ev ? 28 : 25, h = 9;
    g.fillStyle = 'rgba(20,20,40,0.32)'; g.beginPath(); g.ellipse(s.x + 6, s.y + h + 6, r + 4, (r + 4) * 0.66, 0, 0, 7); g.fill();
    // stone side wall
    const wg = g.createLinearGradient(s.x - r, 0, s.x + r, 0); wg.addColorStop(0, '#8a8478'); wg.addColorStop(0.45, '#c8c0b0'); wg.addColorStop(1, '#6a6458'); g.fillStyle = wg;
    g.beginPath(); g.ellipse(s.x, s.y + h, r + 3, (r + 3) * 0.68, 0, 0, Math.PI); g.lineTo(s.x - r - 3, s.y); g.ellipse(s.x, s.y, r + 3, (r + 3) * 0.68, 0, Math.PI, 0, true); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(60,50,40,0.35)'; g.lineWidth = 1; for (let q = -2; q <= 2; q++) { g.beginPath(); g.moveTo(s.x + q * r * 0.4, s.y + (r + 3) * 0.68 * Math.sqrt(1 - (q * 0.4) ** 2) * 0.98); g.lineTo(s.x + q * r * 0.4, s.y + h + (r + 3) * 0.68 * Math.sqrt(1 - (q * 0.4) ** 2)); g.stroke(); }
    // rim
    g.fillStyle = '#e8e0d0'; g.beginPath(); g.ellipse(s.x, s.y, r + 3, (r + 3) * 0.68, 0, 0, 7); g.fill();
    // coloured top
    g.fillStyle = T.dark; g.beginPath(); g.ellipse(s.x, s.y + 1.5, r - 1, (r - 1) * 0.68, 0, 0, 7); g.fill();
    const gr = g.createRadialGradient(s.x - r * 0.35, s.y - r * 0.4, 1, s.x, s.y, r); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.22, T.col); gr.addColorStop(1, T.dark); g.fillStyle = gr; g.beginPath(); g.ellipse(s.x, s.y, r - 2, (r - 2) * 0.68, 0, 0, 7); g.fill();
    if (ev) { g.strokeStyle = 'rgba(255,240,180,0.75)'; g.lineWidth = 2; g.setLineDash([4, 3]); g.beginPath(); g.ellipse(s.x, s.y, r - 6, (r - 6) * 0.68, 0, 0, 7); g.stroke(); g.setLineDash([]); }
    g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 2; g.beginPath(); g.ellipse(s.x, s.y, r - 5, (r - 5) * 0.68, 0, Math.PI * 1.05, Math.PI * 1.75); g.stroke();
    g.font = `bold ${Math.round(r * 0.74)}px Georgia, "Segoe UI Emoji", sans-serif`; g.textAlign = 'center'; g.lineJoin = 'round';
    if (/^[+−]/.test(T.icon)) { g.lineWidth = 4; g.strokeStyle = 'rgba(0,0,0,0.45)'; g.strokeText(T.icon, s.x, s.y + r * 0.26); g.fillStyle = '#fff'; g.fillText(T.icon, s.x, s.y + r * 0.26); }
    else { g.fillStyle = '#fff'; g.fillText(T.icon, s.x, s.y + r * 0.24); }
  };

  // ----------------------------------------------------------------- scenery list: region trees and plants
  BoardArt.decor = function () {
    if (this._d) return this._d;
    const D = [], h = n => { const x = Math.sin(n * 91.7 + 12.3) * 43758.5453; return x - Math.floor(x); };
    // a ring of trees outside the loop: pines up north, crystal trees east, mushroom trees south, maples west
    for (let k = 0; k < 100; k++) { const t = k / 100 * Math.PI * 2, x = 1400 + Math.cos(t) * 1348 + (h(k) - 0.5) * 90, y = 825 + Math.sin(t) * 792 + (h(k + 5) - 0.5) * 70; if (BD.HOLDS.some(Hd => Math.hypot(Hd.x - x, (Hd.y - y) * 1.4) < 190)) continue;
      const reg = y < 363 ? 'pine' : x > 2328 ? 'crystree' : y > 1304 ? 'shroom' : x < 472 ? 'maple' : 'tree'; D.push({ x, y, kind: h(k + 9) > 0.3 ? reg : 'bush', s: 0.8 + h(k + 2) * 0.5, v: k }); }
    // inner lenses: each region's own plants
    for (let k = 0; k < 24; k++) { const x = 980 + h(k + 70) * 840, y = 355 + h(k + 71) * 148; D.push({ x, y, kind: 'pine', s: 0.55 + h(k) * 0.3, v: k + 200 }); }
    for (let k = 0; k < 14; k++) { const x = 2012 + h(k + 80) * 158, y = 544 + h(k + 81) * 544; D.push({ x, y, kind: 'crystal', s: 0.6 + h(k) * 0.5, v: k + 300 }); }
    for (let k = 0; k < 20; k++) { const x = 980 + h(k + 90) * 840, y = 1155 + h(k + 91) * 132; D.push({ x, y, kind: 'shroom', s: 0.5 + h(k) * 0.35, v: k + 400 }); }
    for (let k = 0; k < 10; k++) { const x = 665 + h(k + 95) * 158, y = 578 + h(k + 96) * 495; D.push({ x, y, kind: 'lamp', s: 1, v: k + 500 }); }
    [[822, 198], [1978, 1452]].forEach(([x, y], k) => D.push({ x, y, kind: 'sign', s: 1, v: k }));
    BD.BRANCHES.forEach((B, k) => { const A = BD.spaces[B.a], p = bez(A, B.ctrl, BD.spaces[B.b], 0.5), inw = [[0, 1], [-1, 0], [0, -1], [1, 0]][k]; D.push(k % 2 ? { x: p.x + inw[0] * 95, y: p.y + 40, kind: 'bsign', s: 1, v: k, keep: true } : { x: 1400, y: k ? 1254 : 455, kind: 'bsign', flat: true, s: 1, v: k, keep: true }); });
    this.windmillAt = true;
    const props = this.props(), creekNear = (x, y) => { for (let f = 0; f <= 1; f += 0.05) { const p = bez(CREEK[0], CREEK[1], CREEK[2], f); if (Math.hypot(p.x - x, p.y - y) < 46) return true; } return false; };
    this._d = D.filter(d => d.keep || (!BD.spaces.some(s => Math.hypot(s.x - d.x, (s.y - d.y) * 1.3) < 72 || (['tree', 'pine', 'maple', 'shroom', 'crystree'].includes(d.kind) && s.y < d.y && d.y - s.y < 130 * d.s && Math.abs(s.x - d.x) < 60 * d.s))
      && !props.some(p => Math.hypot(p.x - d.x, (p.y - d.y) * 1.2) < 80) && Math.hypot(d.x - 1400, d.y - 858) > 120 && Math.hypot((d.x - 1706) / 120, (d.y - 957) / 70) > 1 && !creekNear(d.x, d.y)
      && !BD.HOLDS.some(Hd => Math.hypot(Hd.x - d.x, (Hd.y - d.y) * 1.4) < 170) && !BD.spaces.filter(s => s.type === 'bank').some(s => Math.hypot(s.x - d.x, s.y - d.y) < 140)));
    return this._d;
  };
  const oldDecor = BoardArt.drawDecor.bind(BoardArt);
  BoardArt.drawDecor = function (g, d, t) {
    const { x, y, s } = d, N = BoardArt.light.night;
    if (d.kind === 'pine') { BoardArt.sunShadow(g, x, y, 40 * s, 120 * s); const sw = Math.sin(t * 0.8 + d.v) * 1.5 * s;
      g.fillStyle = '#6a4424'; g.fillRect(x - 5 * s, y - 24 * s, 10 * s, 26 * s);
      for (let q = 0; q < 4; q++) { const yy = y - 20 * s - q * 26 * s, w = (46 - q * 9) * s, gr = g.createLinearGradient(x - w, 0, x + w, 0); gr.addColorStop(0, '#2f7a3a'); gr.addColorStop(0.5, '#1f5a2e'); gr.addColorStop(1, '#14401f'); g.fillStyle = gr; g.beginPath(); g.moveTo(x - w + sw * q * 0.4, yy); g.lineTo(x + sw * q, yy - 44 * s); g.lineTo(x + w + sw * q * 0.4, yy); g.quadraticCurveTo(x, yy + 8 * s, x - w + sw * q * 0.4, yy); g.fill(); g.fillStyle = 'rgba(200,255,170,0.18)'; g.beginPath(); g.moveTo(x - w * 0.8 + sw * q * 0.4, yy - 2); g.lineTo(x + sw * q, yy - 40 * s); g.lineTo(x - w * 0.1, yy - 4); g.fill(); }
      if (d.v % 4 === 0) { g.fillStyle = 'rgba(255,255,255,0.75)'; g.beginPath(); g.moveTo(x - 12 * s, y - 120 * s); g.lineTo(x + sw * 3, y - 142 * s); g.lineTo(x + 12 * s, y - 120 * s); g.fill(); }
      return; }
    if (d.kind === 'maple') { BoardArt.sunShadow(g, x, y, 60 * s, 100 * s); const sw = Math.sin(t * 0.9 + d.v) * 2 * s;
      g.fillStyle = '#6a4424'; g.fillRect(x - 6 * s, y - 34 * s, 12 * s, 36 * s);
      const lg = g.createRadialGradient(x - 16 * s + sw, y - 80 * s, 6, x + sw, y - 60 * s, 52 * s); lg.addColorStop(0, '#ffd070'); lg.addColorStop(0.5, '#f08a3a'); lg.addColorStop(1, '#b8442a'); g.fillStyle = lg;
      g.beginPath(); g.arc(x + sw, y - 66 * s, 38 * s, 0, 7); g.arc(x - 26 * s + sw, y - 46 * s, 24 * s, 0, 7); g.arc(x + 26 * s + sw, y - 46 * s, 24 * s, 0, 7); g.fill(); g.fillStyle = 'rgba(120,30,20,0.25)'; g.beginPath(); g.arc(x + 12 * s + sw, y - 50 * s, 26 * s, 0, 7); g.fill(); return; }
    if (d.kind === 'crystree') { BoardArt.sunShadow(g, x, y, 50 * s, 100 * s); const sw = Math.sin(t * 0.9 + d.v) * 2 * s;
      g.fillStyle = '#e8e0f0'; g.fillRect(x - 5 * s, y - 34 * s, 10 * s, 36 * s);
      const lg = g.createRadialGradient(x - 16 * s + sw, y - 80 * s, 6, x + sw, y - 60 * s, 52 * s); lg.addColorStop(0, '#d8f8ff'); lg.addColorStop(0.5, '#7ad0e8'); lg.addColorStop(1, '#3a8ab8'); g.fillStyle = lg;
      g.beginPath(); g.arc(x + sw, y - 66 * s, 36 * s, 0, 7); g.arc(x - 24 * s + sw, y - 46 * s, 22 * s, 0, 7); g.arc(x + 24 * s + sw, y - 46 * s, 22 * s, 0, 7); g.fill(); if (N > 0.05) MGH.glow(g, x + sw, y - 60 * s, 60 * s, `rgba(120,220,255,${0.35 * N})`); return; }
    if (d.kind === 'crystal') { BoardArt.sunShadow(g, x, y, 30 * s, 40 * s); const pulse = 0.6 + 0.4 * Math.sin(t * 2 + d.v);
      if (N > 0.05) MGH.glow(g, x, y - 20 * s, 50 * s, `rgba(110,210,255,${0.5 * N * pulse})`);
      for (const [dx, hh, w, a] of [[-12, 34, 9, -0.3], [0, 48, 11, 0], [12, 30, 8, 0.35], [-4, 22, 7, -0.6]]) { g.save(); g.translate(x + dx * s, y); g.rotate(a); const cg = g.createLinearGradient(-w * s, 0, w * s, 0); cg.addColorStop(0, '#e8faff'); cg.addColorStop(0.5, '#6ac8f0'); cg.addColorStop(1, '#2a6ab8'); g.fillStyle = cg; g.beginPath(); g.moveTo(-w * s, 0); g.lineTo(-w * s * 0.7, -hh * s); g.lineTo(0, -(hh + 10) * s); g.lineTo(w * s * 0.7, -hh * s); g.lineTo(w * s, 0); g.fill(); g.restore(); }
      if (Math.sin(t * 3 + d.v * 2) > 0.92) MGH.star(g, x + 6 * s, y - 44 * s, 5, '#fff', t, false); return; }
    if (d.kind === 'shroom') { BoardArt.sunShadow(g, x, y, 40 * s, 70 * s); const glow = N;
      g.fillStyle = '#f4ead8'; MGH.rr(g, x - 8 * s, y - 40 * s, 16 * s, 42 * s, 6 * s); g.fill();
      const col = ['#e8443a', '#9a5ae8', '#ff8a3a'][d.v % 3]; if (glow > 0.05) MGH.glow(g, x, y - 44 * s, 70 * s, `rgba(${d.v % 3 === 1 ? '180,120,255' : '255,140,90'},${0.45 * glow})`);
      const cg = g.createRadialGradient(x - 12 * s, y - 60 * s, 2, x, y - 44 * s, 40 * s); cg.addColorStop(0, '#ffffff'); cg.addColorStop(0.25, col); cg.addColorStop(1, Char.shade(col, -0.4)); g.fillStyle = cg; g.beginPath(); g.ellipse(x, y - 42 * s, 36 * s, 24 * s, 0, Math.PI, 0); g.quadraticCurveTo(x, y - 30 * s, x - 36 * s, y - 42 * s); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.9)'; for (const [dx, dy, r] of [[-16, -50, 5], [4, -58, 6], [18, -46, 4], [-4, -46, 3]]) { g.beginPath(); g.arc(x + dx * s, y + dy * s, r * s, 0, 7); g.fill(); } return; }
    if (d.kind === 'lamp') { const on = Math.max(BoardArt.light.night, BoardArt.light.golden * 0.6); g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(x + 4, y + 2, 12, 4, 0, 0, 7); g.fill(); g.fillStyle = '#2a2a34'; g.fillRect(x - 2.5, y - 70, 5, 70); g.fillRect(x - 12, y - 72, 24, 4);
      if (on > 0.05) MGH.glow(g, x, y - 60, 60, `rgba(255,190,90,${0.55 * on})`); g.fillStyle = on > 0.3 ? '#ffe08a' : '#c8b088'; MGH.rr(g, x - 7, y - 66, 14, 16, 4); g.fill(); g.strokeStyle = '#2a2a34'; g.lineWidth = 2; g.strokeRect(x - 7, y - 66, 14, 16); return; }
    if (d.kind === 'tree' || d.kind === 'bush' || d.kind === 'rock') { BoardArt.sunShadow(g, x, y, (d.kind === 'tree' ? 60 : 40) * s, (d.kind === 'tree' ? 100 : 36) * s); }
    // the old artist draws its own little shadow too; skip it by drawing straight onto the shapes
    g.save(); const oldEll = g.ellipse; let first = true; g.ellipse = function (...a) { if (first) { first = false; return; } return oldEll.apply(this, a); }; oldDecor(g, d, t); g.ellipse = oldEll; g.restore();
  };

  // ----------------------------------------------------------------- landmarks
  BoardArt.prop = function (g, P, t, G) {
    const { x, y } = P, N = this.light.night;
    if (P.kind === 'zoo') return this.zooPen(g, x, y, t, G);
    if (P.kind === 'pier') { this.sunShadow(g, x, y, 90, 30);
      g.fillStyle = '#2a6aa8'; g.beginPath(); g.ellipse(x, y + 6, 62, 26, 0, 0, 7); g.fill(); const wg = g.createRadialGradient(x - 10, y, 4, x, y + 6, 60); wg.addColorStop(0, '#8ad8ff'); wg.addColorStop(1, '#2a7ac8'); g.fillStyle = wg; g.beginPath(); g.ellipse(x, y + 6, 56, 22, 0, 0, 7); g.fill();
      for (let k = 0; k < 3; k++) { const q = (t * 0.6 + k / 3) % 1; g.strokeStyle = `rgba(255,255,255,${0.5 * (1 - q)})`; g.lineWidth = 1.5; g.beginPath(); g.ellipse(x + 20, y + 8, 6 + q * 22, 2 + q * 8, 0, 0, 7); g.stroke(); }
      g.fillStyle = '#7a5530'; g.fillRect(x - 40, y - 4, 44, 12); g.fillStyle = '#9a7040'; for (let k = 0; k < 5; k++) g.fillRect(x - 40 + k * 9, y - 6, 7, 12); g.fillStyle = '#5a3a1a'; g.fillRect(x - 38, y + 6, 4, 14); g.fillRect(x - 2, y + 6, 4, 14);
      g.strokeStyle = '#3a2a1a'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 10, y - 4); g.lineTo(x + 18, y - 40); g.stroke(); g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x + 18, y - 40); g.lineTo(x + 22, y + 6 + Math.sin(t * 2) * 2); g.stroke(); g.fillStyle = '#e8323e'; g.beginPath(); g.arc(x + 22, y + 6 + Math.sin(t * 2) * 2, 3, 0, 7); g.fill();
      const ph = (t + P.s.i) % 5; if (ph < 0.8) GX.fish(g, x - 10 + ph * 40, y + 4 - Math.sin(ph / 0.8 * Math.PI) * 26, 8, '#ffb04a', -Math.cos(ph / 0.8 * Math.PI)); return; }
    if (P.kind === 'fountain') { this.sunShadow(g, x, y, 80, 50); const F = G.fountain;
      g.fillStyle = '#9a9aa8'; g.beginPath(); g.ellipse(x, y, 46, 18, 0, 0, 7); g.fill(); g.fillStyle = '#c8c8d4'; g.beginPath(); g.ellipse(x, y - 6, 46, 18, 0, 0, 7); g.fill(); g.fillStyle = '#4ab0e8'; g.beginPath(); g.ellipse(x, y - 7, 38, 13, 0, 0, 7); g.fill();
      for (let k = 0; k < Math.min(14, F.pot / 3); k++) { g.fillStyle = '#ffd34d'; g.beginPath(); g.ellipse(x - 28 + H(k) * 56, y - 8 + (H(k + 3) - 0.5) * 14, 3.5, 2, 0, 0, 7); g.fill(); }
      g.fillStyle = '#b8b8c4'; g.fillRect(x - 5, y - 40, 10, 34); g.fillStyle = '#d8d8e4'; g.beginPath(); g.ellipse(x, y - 40, 18, 7, 0, 0, 7); g.fill();
      for (let k = 0; k < 12; k++) { const q = (t * 1.4 + k / 12) % 1, a = k / 12 * 6.28; g.fillStyle = `rgba(200,240,255,${0.8 * (1 - q)})`; g.beginPath(); g.arc(x + Math.cos(a) * q * 26, y - 44 - Math.sin(q * Math.PI) * 18 + q * 30, 2.4, 0, 7); g.fill(); }
      MGH.text(g, `${F.pot}🪙`, x, y + 30, 13, '#ffe680', 'center', 'bold'); return; }
    if (P.kind === 'market') { this.sunShadow(g, x, y, 90, 70); g.fillStyle = '#8a5a2a'; g.fillRect(x - 40, y - 26, 80, 26); g.fillStyle = '#6a4220'; g.fillRect(x - 38, y - 64, 5, 40); g.fillRect(x + 33, y - 64, 5, 40);
      for (let k = 0; k < 6; k++) { g.fillStyle = k % 2 ? '#fff6e0' : '#e8443a'; g.beginPath(); g.moveTo(x - 46 + k * 15.3, y - 64); g.lineTo(x - 46 + (k + 1) * 15.3, y - 64); g.lineTo(x - 46 + (k + 1) * 15.3, y - 54); g.quadraticCurveTo(x - 46 + (k + 0.5) * 15.3, y - 48, x - 46 + k * 15.3, y - 54); g.fill(); }
      for (let k = 0; k < 4; k++) { const px2 = x - 28 + k * 18, py2 = y - 30; g.fillStyle = '#ff8a2a'; g.beginPath(); g.ellipse(px2, py2, 9, 7, 0, 0, 7); g.fill(); g.strokeStyle = '#c85a10'; g.lineWidth = 1; g.beginPath(); g.moveTo(px2, py2 - 7); g.lineTo(px2, py2 + 7); g.stroke(); g.fillStyle = '#3a8a2a'; g.fillRect(px2 - 1, py2 - 10, 2, 4); }
      GX.plank(g, x - 22, y - 92, 44, 22, '#f4e0b0'); MGH.text(g, `🎃${G.pumpPrice}`, x, y - 76, 12, '#5a2a0a', 'center', 'bold'); return; }
    if (P.kind === 'raffle') { this.sunShadow(g, x, y, 70, 70); g.fillStyle = '#7a3a8a'; g.fillRect(x - 32, y - 40, 64, 40); g.fillStyle = '#e85ac8'; g.beginPath(); g.moveTo(x - 40, y - 40); g.lineTo(x, y - 62); g.lineTo(x + 40, y - 40); g.fill();
      g.save(); g.translate(x, y - 20); g.rotate(t * (Board.ui.drum ? 6 : 0.6)); g.strokeStyle = '#ffd34d'; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, 14, 0, 7); g.stroke(); for (let k = 0; k < 6; k++) { g.rotate(1.047); g.beginPath(); g.moveTo(0, 0); g.lineTo(14, 0); g.stroke(); } g.restore();
      MGH.text(g, `🎟️ ${G.raffle.pot}`, x, y + 16, 13, '#ffe0f8', 'center', 'bold'); return; }
    if (P.kind === 'bounty') { this.sunShadow(g, x, y, 60, 80); g.fillStyle = '#5a3a1a'; g.fillRect(x - 30, y - 64, 6, 64); g.fillRect(x + 24, y - 64, 6, 64); GX.plank(g, x - 40, y - 84, 80, 52, '#a87a48');
      g.fillStyle = '#f4e8c8'; g.save(); g.translate(x, y - 58); g.rotate(-0.05); g.fillRect(-22, -20, 44, 40); MGH.text(g, 'WANTED', 0, -10, 8, '#5a2a0a', 'center', 'bold');
      if (G.bounty) { const q = G.P(G.bounty.on); Char.draw(g, 0, 4, 9, q.el.id, q.color, { headOnly: true, noShadow: true, mood: 'smug', seed: q.i * 1.7 }); MGH.text(g, `${G.bounty.val}🪙`, 0, 18, 8, '#8a1a0a', 'center', 'bold'); } else MGH.text(g, '?', 0, 10, 16, '#8a6a4a', 'center', 'bold');
      g.restore(); return; }
    if (P.kind === 'vane') { this.sunShadow(g, x, y, 20, 120); g.fillStyle = '#4a4a5a'; g.fillRect(x - 3, y - 100, 6, 100); g.fillStyle = '#6a6a7a'; g.beginPath(); g.ellipse(x, y, 14, 5, 0, 0, 7); g.fill();
      const a = t * (Board.ui.gust ? 5 : 0.4) + P.s.i; g.save(); g.translate(x, y - 100); g.scale(1, 0.5); g.rotate(a); g.fillStyle = '#c84a3a'; g.beginPath(); g.moveTo(26, 0); g.lineTo(14, -6); g.lineTo(14, 6); g.fill(); g.fillStyle = '#3a3a4a'; g.fillRect(-20, -2, 36, 4); g.fillStyle = '#c8c8d8'; g.beginPath(); g.moveTo(-20, 0); g.lineTo(-28, -8); g.lineTo(-28, 8); g.fill(); g.restore();
      g.fillStyle = '#ffd34d'; g.beginPath(); g.arc(x, y - 112, 5, 0, 7); g.fill(); if (G.weather) MGH.text(g, BD.WEATHER[G.weather.kind].icon, x + 20, y - 120, 18, '#fff'); return; }
    if (P.kind === 'lucky') { this.sunShadow(g, x, y, 50, 60); g.fillStyle = '#6a4a2a'; g.fillRect(x - 3, y - 40, 6, 40); g.save(); g.translate(x, y - 50); g.rotate(t * 0.8); for (let k = 0; k < 6; k++) { g.fillStyle = ['#ffd34d', '#7cf06a', '#ff6a6a', '#8ae0ff', '#d08aff', '#ffb030'][k]; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 20, k * 1.047, (k + 1) * 1.047); g.fill(); } g.restore(); g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y - 50, 4, 0, 7); g.fill(); g.fillStyle = '#e8323e'; g.beginPath(); g.moveTo(x - 5, y - 74); g.lineTo(x + 5, y - 74); g.lineTo(x, y - 66); g.fill(); return; }
    if (P.kind === 'item') { this.sunShadow(g, x, y, 40, 30); const b = Math.abs(Math.sin(t * 2 + P.s.i)) * 3; g.fillStyle = '#3ac85a'; MGH.rr(g, x - 16, y - 28 - b, 32, 26, 4); g.fill(); g.fillStyle = '#ffd34d'; g.fillRect(x - 3, y - 28 - b, 6, 26); g.fillRect(x - 16, y - 18 - b, 32, 5); g.beginPath(); g.ellipse(x - 6, y - 32 - b, 7, 4, -0.5, 0, 7); g.ellipse(x + 6, y - 32 - b, 7, 4, 0.5, 0, 7); g.fill(); return; }
    if (P.kind === 'comb') { this.sunShadow(g, x, y, 40, 60); g.strokeStyle = '#5a3a1a'; g.lineWidth = 4; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 30); g.stroke(); GX.hive ? GX.hive(g, x, y - 46, 1.1, t) : null; for (let k = 0; k < 3; k++) { const a = t * 3 + k * 2.1; g.fillStyle = '#ffd34d'; g.beginPath(); g.arc(x + Math.cos(a) * 26, y - 50 + Math.sin(a * 1.3) * 12, 3, 0, 7); g.fill(); g.fillStyle = '#222'; g.fillRect(x + Math.cos(a) * 26 - 1, y - 52 + Math.sin(a * 1.3) * 12, 2, 4); } return; }
    if (P.kind === 'mush') { this.drawDecor(g, { x, y, s: 0.75, kind: 'shroom', v: P.s.i }, t); return; }
    if (P.kind === 'lantern') { const on = Math.max(N, this.light.golden * 0.5); this.sunShadow(g, x, y, 60, 60); g.fillStyle = '#7a4a2a'; g.fillRect(x - 30, y - 30, 60, 30); g.fillStyle = '#c8303a'; g.beginPath(); g.moveTo(x - 38, y - 30); g.lineTo(x, y - 52); g.lineTo(x + 38, y - 30); g.fill();
      for (let k = 0; k < 3; k++) { const lx = x - 22 + k * 22, ly = y - 18; if (on > 0.05) MGH.glow(g, lx, ly, 26, `rgba(255,170,60,${0.6 * on})`); g.fillStyle = on > 0.3 ? '#ffb040' : '#c87830'; g.beginPath(); g.ellipse(lx, ly, 7, 9, 0, 0, 7); g.fill(); }
      if (N > 0.5) MGH.text(g, 'NIGHT MARKET', x, y + 14, 9, '#ffe0a0', 'center', 'bold'); return; }
    if (P.kind === 'balloon') { const bob = Math.sin(t * 1.2) * 6, flying = Board.ui.balloonFly ? Math.min(1, Board.ui.balloonFly.t || 0) : 0; this.sunShadow(g, x, y, 50, 40, 0.8);
      g.strokeStyle = '#5a3a1a'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 20); g.stroke(); const by = y - 70 + bob;
      const bg2 = g.createRadialGradient(x - 10, by - 14, 4, x, by, 30); bg2.addColorStop(0, '#fff0f0'); bg2.addColorStop(0.3, '#ff6a7a'); bg2.addColorStop(1, '#b83a4a'); g.fillStyle = bg2; g.beginPath(); g.ellipse(x, by, 24, 30, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 2; g.beginPath(); g.ellipse(x, by, 10, 29, 0, 0, 7); g.stroke();
      g.strokeStyle = '#5a3a1a'; g.lineWidth = 1; g.beginPath(); g.moveTo(x - 14, by + 22); g.lineTo(x - 8, by + 40); g.moveTo(x + 14, by + 22); g.lineTo(x + 8, by + 40); g.stroke(); g.fillStyle = '#8a5a2a'; g.fillRect(x - 9, by + 40, 18, 12); return; }
    if (P.kind === 'geyser') { const q = (t * 0.5 + P.s.i * 0.3) % 3; g.fillStyle = '#7a7068'; g.beginPath(); g.ellipse(x, y, 16, 7, 0, 0, 7); g.fill(); g.fillStyle = '#3a3a3a'; g.beginPath(); g.ellipse(x, y - 1, 8, 3, 0, 0, 7); g.fill();
      if (q < 0.8) for (let k = 0; k < 10; k++) { const z = (q / 0.8 + k / 10) % 1; g.fillStyle = `rgba(220,245,255,${0.7 * (1 - z)})`; g.beginPath(); g.arc(x + Math.sin(k * 2 + t * 5) * 6 * z, y - z * 80, 4 + z * 8, 0, 7); g.fill(); }
      else for (let k = 0; k < 3; k++) { const z = (t * 0.5 + k / 3) % 1; g.fillStyle = `rgba(255,255,255,${0.3 * (1 - z)})`; g.beginPath(); g.arc(x + Math.sin(t + k) * 4, y - z * 30, 5 + z * 6, 0, 7); g.fill(); }
      return; }
  };
  // the zoo: a fenced pen, a hungry beast that grows as it is fed
  BoardArt.zooPen = function (g, x, y, t, G) {
    this.sunShadow(g, x, y, 130, 60);
    g.fillStyle = '#c8a878'; g.beginPath(); g.ellipse(x, y, 62, 30, 0, 0, 7); g.fill(); g.fillStyle = '#b89868'; g.beginPath(); g.ellipse(x, y + 2, 54, 24, 0, 0, 7); g.fill();
    const Z = G.zoo, k = Math.min(1, Z.size / BD.ZOOSTAR), sc = 0.55 + k * 0.75, lunge = Board.ui.zoo ? Math.sin(Math.min(1, (Board.ui.zoo.t || 0) / 0.5) * Math.PI) : 0, munch = Z.anim > 0 ? Math.sin(t * 20) * 0.08 : 0;
    // the beast (behind the front fence)
    g.save(); g.translate(x, y - 4 - lunge * 20); g.scale(sc * (1 + lunge * 0.25), sc * (1 + lunge * 0.25) + munch);
    const bg2 = g.createRadialGradient(-10, -40, 4, 0, -26, 40); bg2.addColorStop(0, '#c8a0ff'); bg2.addColorStop(0.6, '#8a5ad8'); bg2.addColorStop(1, '#4a2a8a'); g.fillStyle = bg2;
    g.beginPath(); g.ellipse(0, -26, 34, 28, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(26, -16); g.quadraticCurveTo(54, -6, 46, 10); g.quadraticCurveTo(36, -4, 22, -4); g.fill();
    g.fillStyle = '#ffd34d'; for (let q = 0; q < 5; q++) { g.beginPath(); g.moveTo(-22 + q * 10, -48 + Math.abs(q - 2) * 3); g.lineTo(-17 + q * 10, -62 + Math.abs(q - 2) * 4); g.lineTo(-12 + q * 10, -48 + Math.abs(q - 2) * 3); g.fill(); }
    g.fillStyle = '#e8d8ff'; g.beginPath(); g.ellipse(-6, -14, 20, 12, 0, 0, 7); g.fill();
    const open = 0.3 + lunge * 0.7 + (Z.anim > 0 ? Math.abs(Math.sin(t * 14)) * 0.4 : 0); g.fillStyle = '#3a0a2a'; g.beginPath(); g.ellipse(-14, -20, 14, 4 + open * 10, 0, 0, 7); g.fill(); g.fillStyle = '#fff'; for (let q = 0; q < 4; q++) { g.beginPath(); g.moveTo(-24 + q * 7, -22 - open * 6); g.lineTo(-21 + q * 7, -16 - open * 4); g.lineTo(-18 + q * 7, -22 - open * 6); g.fill(); }
    g.fillStyle = '#fff'; g.beginPath(); g.arc(-16, -38, 7, 0, 7); g.arc(2, -38, 7, 0, 7); g.fill(); g.fillStyle = k > 0.7 ? '#e8323e' : '#2a1a3a'; g.beginPath(); g.arc(-17, -37, 3.5, 0, 7); g.arc(1, -37, 3.5, 0, 7); g.fill();
    if (k > 0.7) { g.strokeStyle = '#2a1a3a'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(-24, -47); g.lineTo(-10, -43); g.moveTo(8, -47); g.lineTo(-4, -43); g.stroke(); }
    g.restore();
    if (Z.size < 6 && !Board.ui.zoo) MGH.text(g, 'z', x + 28 + Math.sin(t * 2) * 3, y - 50 - (t % 2) * 8, 14, '#fff', 'center', 'bold');
    // fence posts and rails in front
    g.strokeStyle = '#7a5a32'; g.lineWidth = 4; g.beginPath(); g.ellipse(x, y + 2, 62, 28, 0, 0.05, Math.PI - 0.05); g.stroke(); g.beginPath(); g.ellipse(x, y - 10, 62, 28, 0, 0.05, Math.PI - 0.05); g.stroke();
    for (let q = 0; q <= 8; q++) { const a = q / 8 * Math.PI, px = x + Math.cos(a) * 62, py = y + Math.sin(a) * 28; g.fillStyle = '#8a6a3a'; g.fillRect(px - 3, py - 26, 6, 28); g.fillStyle = '#a8804a'; g.beginPath(); g.arc(px, py - 26, 3, 0, 7); g.fill(); }
    GX.plank(g, x - 44, y + 24, 88, 22, '#e8d0a0'); MGH.text(g, '🚫🍖 DON\'T FEED', x, y + 40, 10, '#6a1a0a', 'center', 'bold');
    // hunger bar (only with board info on)
    if (G.info) { g.fillStyle = 'rgba(0,0,0,0.5)'; MGH.rr(g, x - 40, y - 96, 80, 10, 5); g.fill(); g.fillStyle = k > 0.99 ? '#ff4a4a' : '#ffb04a'; MGH.rr(g, x - 40, y - 96, 80 * k, 10, 5); g.fill(); }
  };

  // ----------------------------------------------------------------- the fork guardians
  BoardArt.guardian = function (g, f, t, G) {
    const kind = G.guard[f], B = BD.BRANCHES[f], A = BD.spaces[B.a], first = BD.spaces[B.ids[0]], hit = Board.ui.guardHit && Board.ui.guardHit.f === f ? Math.max(0, 1 - (Board.ui.guardHit.t || 0) / 0.8) : 0;
    const ent = bez(A, B.ctrl, BD.spaces[B.b], 0.08), side = { x: first.y - A.y, y: -(first.x - A.x) }, l = Math.hypot(side.x, side.y) || 1;
    if (kind === 'gate') { const gx = ent.x, gy = ent.y + 10, ang = Math.atan2(first.y - A.y, first.x - A.x) + Math.PI / 2, ca = Math.cos(ang), sa = Math.sin(ang);
      this.sunShadow(g, gx, gy, 90, 70);
      for (const sd of [-1, 1]) { const px = gx + ca * 44 * sd, py = gy + sa * 18 * sd; g.fillStyle = '#6a6a78'; g.fillRect(px - 6, py - 66, 12, 66); g.fillStyle = '#8a8a98'; g.beginPath(); g.arc(px, py - 68, 8, 0, 7); g.fill(); }
      g.strokeStyle = '#3a3a48'; g.lineWidth = 3; for (let q = -4; q <= 4; q++) { const px = gx + ca * q * 10, py = gy + sa * q * 4; g.beginPath(); g.moveTo(px, py); g.lineTo(px, py - 56 - Math.cos(q / 4 * 1.5) * 8); g.stroke(); }
      g.beginPath(); g.moveTo(gx - ca * 44, gy - sa * 18 - 20); g.lineTo(gx + ca * 44, gy + sa * 18 - 20); g.stroke(); g.beginPath(); g.moveTo(gx - ca * 44, gy - sa * 18 - 48); g.quadraticCurveTo(gx, gy - 66, gx + ca * 44, gy + sa * 18 - 48); g.stroke();
      MGH.glow(g, gx, gy - 30, 18, 'rgba(255,210,80,0.5)'); g.fillStyle = '#ffd34d'; MGH.rr(g, gx - 9, gy - 34, 18, 15, 3); g.fill(); g.strokeStyle = '#ffd34d'; g.lineWidth = 3; g.beginPath(); g.arc(gx, gy - 34, 6, Math.PI, 0); g.stroke(); g.fillStyle = '#3a2a10'; g.fillRect(gx - 1.5, gy - 30, 3, 6);
      return; }
    // the creature stands beside the entrance (the Alternator stands ON the road it blocks)
    let x = ent.x + side.x / l * 52, y = ent.y + side.y / l * 52 + 6;
    if (kind === 'alternator') { const onMain = G.alt[f] === 'main', S3 = BD.spaces[B.a + 1], st = Board.ui.altStomp && Board.ui.altStomp.f === f ? Math.min(1, (Board.ui.altStomp.t || 0) / 0.8) : 1;
      const tx = onMain ? (A.x + S3.x) / 2 : ent.x, ty = onMain ? (A.y + S3.y) / 2 + 4 : ent.y + 4, fx = onMain ? ent.x : (A.x + S3.x) / 2, fy = onMain ? ent.y + 4 : (A.y + S3.y) / 2 + 4;
      x = fx + (tx - fx) * st; y = fy + (ty - fy) * st - Math.sin(st * Math.PI) * 40; }
    this.sunShadow(g, x, y, 60, 70);
    const bob = Math.sin(t * 2 + f) * 2, shake = hit * Math.sin(t * 40) * 3;
    g.save(); g.translate(x + shake, y + bob);
    if (kind === 'collector') { // a round raccoon-ish merchant with a monocle and a jingling coin sack
      g.fillStyle = '#6a5a7a'; g.beginPath(); g.ellipse(0, -26, 24, 26, 0, 0, 7); g.fill(); g.fillStyle = '#d8c8e0'; g.beginPath(); g.ellipse(0, -18, 15, 16, 0, 0, 7); g.fill();
      g.fillStyle = '#6a5a7a'; g.beginPath(); g.arc(0, -56, 18, 0, 7); g.fill(); g.beginPath(); g.moveTo(-16, -64); g.lineTo(-12, -80); g.lineTo(-4, -70); g.fill(); g.beginPath(); g.moveTo(16, -64); g.lineTo(12, -80); g.lineTo(4, -70); g.fill();
      g.fillStyle = '#2a2030'; g.beginPath(); g.ellipse(0, -56, 16, 7, 0, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(-6, -57, 3.5, 0, 7); g.arc(6, -57, 3.5, 0, 7); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.arc(-6, -57, 1.8, 0, 7); g.arc(6, -57, 1.8, 0, 7); g.fill();
      g.strokeStyle = '#ffd34d'; g.lineWidth = 1.5; g.beginPath(); g.arc(6, -57, 5.5, 0, 7); g.stroke(); g.beginPath(); g.moveTo(11, -55); g.quadraticCurveTo(14, -46, 10, -40); g.stroke();
      g.fillStyle = '#2a2030'; g.beginPath(); g.arc(0, -50, 2.5, 0, 7); g.fill(); g.strokeStyle = '#2a2030'; g.lineWidth = 1.5; g.beginPath(); g.arc(0, -47, 4, 0.2, Math.PI - 0.2); g.stroke();
      g.fillStyle = '#2a2a3a'; g.fillRect(-12, -84, 24, 6); g.fillRect(-8, -100, 16, 16);
      const jig = Math.sin(t * 6) * 3; g.fillStyle = '#a8804a'; g.beginPath(); g.ellipse(24, -14 + jig, 12, 14, 0, 0, 7); g.fill(); g.fillStyle = '#ffd34d'; MGH.text(g, '🪙', 24, -10 + jig, 12, '#fff');
      if (Math.sin(t * 6) > 0.9) MGH.star(g, 34, -30, 4, '#ffe680', t, false);
      const toll = BD.GUARDS.collector.toll[G.tod]; g.fillStyle = 'rgba(30,20,10,0.75)'; MGH.rr(g, -26, 6, 52, 18, 9); g.fill(); MGH.text(g, `${toll}🪙`, 0, 20, 13, '#ffe680', 'center', 'bold');
    } else if (kind === 'alternator') { // a mossy stone block with a carved scowl
      const sg = g.createLinearGradient(-30, 0, 30, 0); sg.addColorStop(0, '#9a98a8'); sg.addColorStop(0.5, '#c8c6d4'); sg.addColorStop(1, '#6a6878'); g.fillStyle = sg; MGH.rr(g, -30, -76, 60, 74, 10); g.fill();
      g.strokeStyle = 'rgba(40,40,60,0.35)'; g.lineWidth = 2; g.beginPath(); g.moveTo(-30, -40); g.lineTo(30, -38); g.moveTo(-6, -76); g.lineTo(-10, -40); g.stroke();
      g.fillStyle = '#5ab83a'; g.beginPath(); g.ellipse(-10, -76, 18, 6, -0.1, 0, 7); g.fill(); g.beginPath(); g.ellipse(14, -77, 10, 4, 0.2, 0, 7); g.fill();
      for (const sd of [-1, 1]) { g.fillStyle = '#2a2838'; g.beginPath(); g.moveTo(sd * 18, -58); g.lineTo(sd * 6, -52); g.lineTo(sd * 18, -48); g.fill(); g.fillStyle = '#ff4a3a'; g.beginPath(); g.arc(sd * 13, -52, 2.5, 0, 7); g.fill(); }
      g.fillStyle = '#2a2838'; MGH.rr(g, -14, -34, 28, 8, 3); g.fill(); g.fillStyle = '#e8e8f0'; for (let q = 0; q < 4; q++) g.fillRect(-12 + q * 7, -34, 5, 4);
      const toll = BD.GUARDS.alternator.toll[G.tod]; g.fillStyle = 'rgba(30,20,10,0.75)'; MGH.rr(g, -30, 6, 60, 18, 9); g.fill(); MGH.text(g, `🚫 ${toll}🪙`, 0, 20, 12, '#ffe680', 'center', 'bold');
    } else { // the Competitor: a fox-faced gambler juggling a big die
      g.fillStyle = '#e8803a'; g.beginPath(); g.ellipse(0, -26, 22, 26, 0, 0, 7); g.fill(); g.fillStyle = '#fff0e0'; g.beginPath(); g.ellipse(0, -18, 13, 16, 0, 0, 7); g.fill();
      g.fillStyle = '#e8803a'; g.beginPath(); g.arc(0, -56, 18, 0, 7); g.fill(); g.beginPath(); g.moveTo(-16, -62); g.lineTo(-18, -84); g.lineTo(-4, -70); g.fill(); g.beginPath(); g.moveTo(16, -62); g.lineTo(18, -84); g.lineTo(4, -70); g.fill();
      g.fillStyle = '#fff0e0'; g.beginPath(); g.moveTo(-12, -52); g.quadraticCurveTo(0, -40, 12, -52); g.quadraticCurveTo(0, -46, -12, -52); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.arc(0, -47, 2.5, 0, 7); g.fill();
      g.fillStyle = '#2a8a5a'; g.beginPath(); g.ellipse(0, -70, 22, 6, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(40,160,100,0.6)'; g.beginPath(); g.ellipse(0, -66, 20, 7, 0, 0, Math.PI); g.fill();
      g.fillStyle = '#111'; g.beginPath(); g.arc(-6, -57, 2.4, 0, 7); g.arc(6, -57, 2.4, 0, 7); g.fill();
      const dz = Math.abs(Math.sin(t * 3)) * 18; g.save(); g.translate(26, -40 - dz); g.rotate(t * 4); g.fillStyle = '#fff'; MGH.rr(g, -8, -8, 16, 16, 4); g.fill(); g.strokeStyle = '#2a1a4a'; g.lineWidth = 1.5; g.stroke(); g.fillStyle = '#2a1a4a'; g.beginPath(); g.arc(-3, -3, 1.6, 0, 7); g.arc(3, 3, 1.6, 0, 7); g.arc(0, 0, 1.6, 0, 7); g.fill(); g.restore();
      const die = BD.GUARDS.competitor.die[G.tod]; g.fillStyle = 'rgba(30,20,10,0.75)'; MGH.rr(g, -26, 6, 52, 18, 9); g.fill(); MGH.text(g, `🎲 d${die}`, 0, 20, 12, '#ffe680', 'center', 'bold');
    }
    g.restore();
  };

  // ----------------------------------------------------------------- the rope bridge over the creek
  BoardArt.bridge = function (g, G, t) {
    const s = BD.spaces.find(q => q.type === 'bridge'); if (!s) return;
    const B = BD.BRANCHES[s.branch], i = B.ids.indexOf(s.i), pa = i > 0 ? BD.spaces[B.ids[i - 1]] : BD.spaces[B.a], pb = i < 4 ? BD.spaces[B.ids[i + 1]] : BD.spaces[B.b];
    const dx = pb.x - pa.x, dy = pb.y - pa.y, l = Math.hypot(dx, dy), ux = dx / l, uy = dy / l, nx = -uy, ny = ux, down = G.bridge.downUntil, shake = Board.ui.bridgeShake ? Math.sin(t * 40) * 2 : 0;
    // water under the bridge, then planks (missing ones as it wears), ropes and posts
    g.save(); g.translate(s.x, s.y + shake); g.rotate(Math.atan2(uy, ux));
    const wg = g.createLinearGradient(0, -40, 0, 40); wg.addColorStop(0, '#2a7ab8'); wg.addColorStop(0.5, '#5ab8f0'); wg.addColorStop(1, '#2a7ab8'); g.fillStyle = wg; g.fillRect(-46, -40, 92, 80);
    for (let k = 0; k < 4; k++) { const q = (t * 0.8 + k / 4) % 1; g.strokeStyle = `rgba(255,255,255,${0.5 * (1 - q)})`; g.lineWidth = 2; g.beginPath(); g.moveTo(-40 + q * 80, -30 + k * 18); g.lineTo(-30 + q * 80, -30 + k * 18); g.stroke(); }
    const wear = G.bridge.wear, max = G.bridge.max;
    for (let k = -4; k <= 4; k++) { const gone = down ? Math.abs(k) < 3 : H(k + 7) < (wear / max) * 0.5; if (gone) continue; g.fillStyle = k % 2 ? '#a87a48' : '#8a6034'; g.fillRect(k * 10 - 4, -26 + Math.abs(k) * 0.6, 8, 52); }
    g.strokeStyle = '#d8c090'; g.lineWidth = 3; for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(-46, sd * 28); g.quadraticCurveTo(0, sd * 28 + 10, 46, sd * 28); g.stroke(); }
    for (const sx of [-46, 46]) for (const sd of [-1, 1]) { g.fillStyle = '#5a3a1a'; g.fillRect(sx - 4, sd * 28 - 18, 8, 22); }
    g.restore();
    BoardArt.space(g, s);
    if (down) MGH.text(g, '🚧', s.x, s.y - 30, 26, '#fff');
  };

  // ----------------------------------------------------------------- living things: butterflies, birds, falling leaves, fireflies, fish
  BoardArt.life = function (g, t) {
    const N = this.light.night;
    if (N < 0.6) for (let k = 0; k < 10; k++) { const x = 525 + ((k * 211 + t * (18 + k * 2)) % 1925), y = 264 + (k * 97) % 1155 + Math.sin(t * 1.3 + k) * 30, fl = Math.abs(Math.sin(t * 14 + k)); g.globalAlpha = 1 - N; g.fillStyle = ['#ff8ac8', '#ffd34d', '#8ae0ff', '#ffffff', '#c8a0ff'][k % 5]; g.beginPath(); g.ellipse(x - 4 * fl, y, 5 * fl + 1, 3.5, -0.5, 0, 7); g.ellipse(x + 4 * fl, y, 5 * fl + 1, 3.5, 0.5, 0, 7); g.fill(); g.fillStyle = '#3a2a2a'; g.fillRect(x - 0.8, y - 3, 1.6, 6); g.globalAlpha = 1; }
    for (let k = 0; k < 14; k++) { const ph = (t * 0.12 + k / 14) % 1, x = 665 + (k * 137) % 1470 + Math.sin(t * 1.5 + k) * 20, y = -66 + ph * 544; g.save(); g.translate(x, y); g.rotate(t * 2 + k); g.fillStyle = k % 3 ? 'rgba(120,80,40,0.6)' : 'rgba(60,110,50,0.6)'; g.fillRect(-4, -0.8, 8, 1.6); g.restore(); }
    for (let k = 0; k < 8; k++) { const ph = (t * 0.08 + k / 8) % 1, x = 980 + (k * 61) % 840 + Math.sin(t + k) * 30, y = 1056 + (k * 37) % 231 - ph * 120; g.fillStyle = `rgba(200,255,180,${0.5 * Math.sin(ph * Math.PI) * (0.4 + N)})`; g.beginPath(); g.arc(x, y, 2.4, 0, 7); g.fill(); } // spores in the hollow
    if (N > 0.1) for (let k = 0; k < 40; k++) { const x = (k * 151 + Math.sin(t * 0.4 + k) * 60 + 4000) % 3000 - 100, y = (k * 89 + Math.cos(t * 0.5 + k * 2) * 40) % 1800 - 50, a = (0.5 + 0.5 * Math.sin(t * 3 + k)) * N; g.fillStyle = `rgba(220,255,140,${0.75 * a})`; MGH.glow(g, x, y, 8, `rgba(220,255,140,${0.35 * a})`); g.beginPath(); g.arc(x, y, 2.2, 0, 7); g.fill(); }
    // a bird crosses now and then (day)
    const bp = (t % 14) / 6; if (bp < 1 && N < 0.5) for (let q = 0; q < 3; q++) { const x = -100 + bp * 1900 + q * 34, y = 140 + q * 16 + Math.sin(bp * 8) * 10, fl = Math.sin(t * 10 + q) * 6; g.strokeStyle = 'rgba(40,30,40,0.7)'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(x - 10, y - fl); g.quadraticCurveTo(x - 4, y - 5, x, y); g.quadraticCurveTo(x + 4, y - 5, x + 10, y - fl); g.stroke(); }
    // creek flow and pond ripples
    for (let k = 0; k < 16; k++) { const f = (t * 0.07 + k / 16) % 1, p = bez(CREEK[0], CREEK[1], CREEK[2], f); g.strokeStyle = `rgba(255,255,255,${0.55 * Math.sin(f * Math.PI)})`; g.lineWidth = 2; g.beginPath(); g.moveTo(p.x - 6 + (k % 3 - 1) * 8, p.y); g.lineTo(p.x + 6 + (k % 3 - 1) * 8, p.y + 3); g.stroke(); }
    for (let k = 0; k < 3; k++) { const q = (t * 0.4 + k / 3) % 1; g.strokeStyle = `rgba(255,255,255,${0.45 * (1 - q)})`; g.lineWidth = 2; g.beginPath(); g.ellipse(1706 + (k - 1) * 22, 957 + (k % 2) * 10, 8 + q * 40, 3 + q * 14, 0, 0, 7); g.stroke(); }
    const fp = (t % 9) / 0.9; if (fp < 1) GX.fish(g, 1671 + fp * 60, 961 - Math.sin(fp * Math.PI) * 34, 9, '#ffb04a', -Math.cos(fp * Math.PI));
    // the sky reflected in the pond follows the time of day
    if (this.light.golden > 0.05) { g.fillStyle = `rgba(255,150,90,${0.3 * this.light.golden})`; g.beginPath(); g.ellipse(1706, 957, 86, 44, 0, 0, 7); g.fill(); }
  };

  // ----------------------------------------------------------------- weather overlays
  BoardArt.weatherFx = function (g, G, t, B) {
    const w = G.weatherNow;
    if (w === 'rain') { g.fillStyle = 'rgba(30,50,90,0.18)'; g.fillRect(0, 0, 1280, 720); g.strokeStyle = 'rgba(200,220,255,0.5)'; g.lineWidth = 1.5; g.beginPath(); for (let k = 0; k < 140; k++) { const x = (k * 97 + t * 220) % 1400 - 60, y = (k * 53 + t * 900) % 760 - 20; g.moveTo(x, y); g.lineTo(x - 6, y + 18); } g.stroke(); }
    if (w === 'fog') { for (let k = 0; k < 9; k++) { const x = (k * 260 + t * 14) % 1700 - 200, y = 80 + (k * 113) % 600; const gr = g.createRadialGradient(x, y, 20, x, y, 260); gr.addColorStop(0, 'rgba(235,240,250,0.42)'); gr.addColorStop(1, 'rgba(235,240,250,0)'); g.fillStyle = gr; g.fillRect(x - 260, y - 260, 520, 520); } }
    if (w === 'wind') for (let k = 0; k < 10; k++) { const q = (t * 0.8 + k / 10) % 1; g.strokeStyle = `rgba(255,255,255,${0.45 * Math.sin(q * Math.PI)})`; g.lineWidth = 2.5; const x = q * 1400 - 60, y = 80 + (k * 71) % 600; g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + 40, y - 14, x + 80, y + 14, x + 140, y); g.stroke(); }
  };
  // fog hides event spaces: cover them with a grey "?" plate
  BoardArt.fogPlates = function (g, G) {
    if (G.weatherNow !== 'fog') return;
    BD.spaces.forEach(s => { if (['blue', 'red', 'gate', 'bank'].includes(s.type)) return; g.fillStyle = '#9aa0b0'; g.beginPath(); g.ellipse(s.x, s.y, 27, 18, 0, 0, 7); g.fill(); MGH.text(g, '?', s.x, s.y + 7, 20, '#fff', 'center', 'bold'); });
  };

  // ----------------------------------------------------------------- time of day: tint, then light pools at night
  BoardArt.todOverlay = function (g, tod, t, B) {
    const L = this.light, G = B.game;
    if (L.golden > 0.01) { g.save(); g.globalCompositeOperation = 'soft-light'; g.fillStyle = `rgba(255,120,30,${0.75 * L.golden})`; g.fillRect(0, 0, 1280, 720); g.globalCompositeOperation = 'multiply'; const gr = g.createLinearGradient(0, 0, 1280, 720); gr.addColorStop(0, `rgba(255,230,170,${0.35 * L.golden})`); gr.addColorStop(1, `rgba(230,120,120,${0.45 * L.golden})`); g.fillStyle = gr; g.fillRect(0, 0, 1280, 720); g.restore();
      g.save(); g.globalCompositeOperation = 'lighter'; MGH.glow(g, 60, 40, 520, `rgba(255,170,80,${0.22 * L.golden})`); g.restore(); }
    if (L.night > 0.01) {
      g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = `rgba(${Math.round(255 - 125 * L.night)},${Math.round(255 - 105 * L.night)},${Math.round(255 - 40 * L.night)},1)`; g.fillRect(0, 0, 1280, 720); g.restore();
      g.save(); g.globalCompositeOperation = 'lighter';
      const pools = BD.HOLDS.map(h => ({ x: h.x, y: h.y - 40, r: 130, c: '255,190,100' })).concat(BD.spaces.filter(s => s.type === 'bank').map(s => ({ x: s.x + (s.side === 1 ? 92 : s.side === 3 ? -92 : 0), y: s.y + (s.side === 0 ? -80 : s.side === 2 ? 70 : 0), r: 120, c: '255,200,120' })))
        .concat(B.tok.map(T => ({ x: T.x, y: T.y - 30, r: 90, c: '255,220,170' })))
        .concat(this.decor().filter(d => d.kind === 'lamp').map(d => ({ x: d.x, y: d.y - 60, r: 110, c: '255,180,80' })))
        .concat(this.decor().filter(d => d.kind === 'crystal' || d.kind === 'crystree').map(d => ({ x: d.x, y: d.y - 30, r: 70, c: '110,200,255' })))
        .concat(this.decor().filter(d => d.kind === 'shroom').map(d => ({ x: d.x, y: d.y - 40, r: 60, c: d.v % 3 === 1 ? '180,120,255' : '255,140,100' })))
        .concat(this.props().filter(p => p.kind === 'lantern' || p.kind === 'fountain').map(p => ({ x: p.x, y: p.y - 20, r: 110, c: p.kind === 'lantern' ? '255,170,70' : '140,210,255' })));
      pools.forEach(Pl => { const s = B.toScreen(Pl.x, Pl.y); if (s.x < -200 || s.x > 1480 || s.y < -200 || s.y > 920) return; MGH.glow(g, s.x, s.y, Pl.r * 1.3 * B.camZ, `rgba(${Pl.c},${0.4 * L.night})`); });
      // moonlight from the top right
      MGH.glow(g, 1180, 40, 420, `rgba(140,170,255,${0.14 * L.night})`);
      g.restore();
    }
  };

  // ----------------------------------------------------------------- the whole board frame
  Board.draw = function (g, dt) {
    const G = this.game, t = this.t;
    BoardArt.stepLight(G.tod, dt || 1 / 60);
    for (const k of ['guardHit', 'altStomp', 'zoo', 'balloonFly', 'cast', 'splash', 'bountyGet', 'bridgeSnap']) if (this.ui[k]) this.ui[k].t = (this.ui[k].t || 0) + (dt || 1 / 60);
    if (this.ui.bridgeShake) this.ui.bridgeShake = Math.max(0, this.ui.bridgeShake - (dt || 1 / 60));
    if (G.zoo && G.zoo.anim > 0) G.zoo.anim = Math.max(0, G.zoo.anim - (dt || 1 / 60));
    g.fillStyle = '#4a8a3a'; g.fillRect(0, 0, 1280, 720);
    g.save(); g.translate(640, 360); g.scale(this.camZ, this.camZ); g.translate(-this.cam.x, -this.cam.y);
    g.drawImage(BoardArt.ground(), -200, -200, BD.W + 400, BD.H + 400);
    BoardArt.bridge(g, G, t);
    BoardArt.fogPlates(g, G);
    // the star bank glows; owners' gates are ringed in their colour; snares show as little traps
    const sb = BD.spaces[G.starBank * 10 + 5];
    MGH.glow(g, sb.x, sb.y, 80 + Math.sin(t * 4) * 8, 'rgba(255,220,90,0.55)');
    BD.spaces.filter(s => s.type === 'gate').forEach(s => { g.strokeStyle = G.P(s.owner).color; g.lineWidth = 5; g.beginPath(); g.ellipse(s.x, s.y + 2, 38, 26, 0, 0, 7); g.stroke(); });
    Object.entries(G.traps || {}).forEach(([pos, tr]) => { const s = BD.spaces[pos]; MGH.text(g, BD.ITEMS[tr.kind].icon, s.x + 20, s.y - 10, 18, '#fff'); g.strokeStyle = G.P(tr.owner).color; g.lineWidth = 2; g.beginPath(); g.arc(s.x + 20, s.y - 16, 12, 0, 7); g.stroke(); });
    if (this.pulseT > 0 && this.pulseAt >= 0) { const s = BD.spaces[this.pulseAt]; g.strokeStyle = `rgba(255,255,255,${this.pulseT})`; g.lineWidth = 5; g.beginPath(); g.ellipse(s.x, s.y + 4, 30 + (1 - this.pulseT) * 34, 20 + (1 - this.pulseT) * 22, 0, 0, 7); g.stroke(); }
    // everything upright, sorted by depth
    const items = BoardArt.decor().map(d => ({ y: d.y, f: () => BoardArt.drawDecor(g, d, t) }));
    BoardArt.props().forEach(P => items.push({ y: P.y, f: () => BoardArt.prop(g, P, t, G) }));
    BD.spaces.filter(s => s.type === 'bank').forEach(s => { const bx = s.x + (s.side === 1 ? 92 : s.side === 3 ? -92 : 0), by = s.y + (s.side === 0 ? -62 : s.side === 2 ? 96 : 30); items.push({ y: by, f: () => { BoardArt.sunShadow(g, bx, by, 110, 100); BoardArt.bank(g, bx, by, s.bank === G.starBank, t, s.bank); if (BoardArt.light.night > 0.1) { g.save(); g.globalAlpha = BoardArt.light.night; g.fillStyle = '#ffd880'; for (let q = 0; q < 3; q++) g.fillRect(bx - 34 + q * 24, by - 46, 10, 12); g.restore(); } } }); });
    BD.HOLDS.forEach((h, k) => items.push({ y: h.y + 40, f: () => { BoardArt.sunShadow(g, h.x, h.y, 100, 120); BoardArt.hold(g, h.x, h.y, G.P(k), G.holds[k], t, this.ui.dog && this.cam.target === h, this.ui.dog && this.ui.dog.chase); if (BoardArt.light.night > 0.1) { g.save(); g.globalAlpha = BoardArt.light.night; g.fillStyle = '#ffd880'; g.fillRect(h.x - 22, h.y - 60, 9, 12); g.fillRect(h.x + 13, h.y - 60, 9, 12); g.restore(); } } }));
    items.push({ y: 858, f: () => { BoardArt.sunShadow(g, 1400, 858, 90, 170); BoardArt.windmill(g, 1400, 858, t, this.ui.gust); } });
    if (G.ankar && BoardArt.ankar) { const A = G.ankar, S = BD.spaces[A.pos]; if (A.vx === undefined) { A.vx = S.x; A.vy = S.y; } A.vx += (S.x - A.vx) * 0.18; A.vy += (S.y - A.vy) * 0.18; const ox = G.players.some(q => q.pos === A.pos) ? 46 : 0; items.push({ y: A.vy + 2, f: () => BoardArt.ankar(g, A.vx + ox, A.vy, t, A) }); }
    if (G.guard) [0, 1, 2, 3].forEach(f => { const B = BD.BRANCHES[f], A = BD.spaces[B.a]; items.push({ y: A.y + (f === 2 ? -30 : 40), f: () => BoardArt.guardian(g, f, t, G) }); });
    G.players.forEach((p, i) => { const T = this.tok[i]; const same = G.players.filter(q => q.pos === p.pos), k = same.indexOf(p), n = same.length; const ox = n > 1 ? (k - (n - 1) / 2) * 34 : 0, oy = n > 1 ? (k % 2) * 10 : 0; items.push({ y: T.y + oy + 1, f: () => { BoardArt.sunShadow(g, T.x + ox, T.y + oy + 4, 44, 80, 0.8); this.drawToken(g, p, T.x + (T.to ? 0 : ox), T.y + (T.to ? 0 : oy), T.hop, t, T.face || 1);
      if (G.bounty && G.bounty.on === i) { const bx = T.x + ox + 34, by = T.y + oy - 120 - T.hop; g.save(); g.translate(bx, by); g.rotate(Math.sin(t * 2) * 0.08); g.fillStyle = '#f4e8c8'; g.fillRect(-18, -22, 36, 42); g.strokeStyle = '#8a5a2a'; g.lineWidth = 2; g.strokeRect(-18, -22, 36, 42); MGH.text(g, 'WANTED', 0, -12, 7, '#7a1a0a', 'center', 'bold'); MGH.text(g, `${G.bounty.val}🪙`, 0, 14, 11, '#7a1a0a', 'center', 'bold'); g.fillStyle = '#5a2a0a'; g.beginPath(); g.arc(0, -2, 6, 0, 7); g.fill(); g.restore(); } } }); });
    items.sort((a, b) => a.y - b.y).forEach(it => it.f());
    BoardArt.life(g, t);
    // event animations in the world
    const U = this.ui;
    if (U.fork) { const F = BD.spaces[U.fork.pos], FK = U.fork; F.nx.forEach((n, k) => { const s2 = BD.spaces[n], a = Math.atan2(s2.y - F.y, s2.x - F.x), on = FK.sel === k, o = FK.opts && FK.opts[k], off = o && o.off, b = on ? (Math.sin(t * 7) + 1) * 8 : 0, sc = on ? 1.5 : 1.05, ax = F.x + Math.cos(a) * (56 + b), ay = F.y + Math.sin(a) * (40 + b) - 8;
      if (on) MGH.glow(g, ax, ay, 46, 'rgba(255,240,140,0.55)');
      g.save(); g.translate(ax, ay); g.rotate(a); g.scale(sc, sc); g.globalAlpha = off ? 0.45 : on ? 1 : 0.7; g.fillStyle = off ? '#8a8a9a' : on ? (k ? '#7cf06a' : '#ffe680') : (k ? '#5aa84a' : '#c8b060'); g.strokeStyle = '#2a1a10'; g.lineWidth = 3; g.beginPath(); g.moveTo(22, 0); g.lineTo(-4, -16); g.lineTo(-4, -7); g.lineTo(-20, -7); g.lineTo(-20, 7); g.lineTo(-4, 7); g.lineTo(-4, 16); g.closePath(); g.fill(); g.stroke(); g.restore();
      if (o) { const lx = F.x + Math.cos(a) * 150, ly = F.y + Math.sin(a) * 100 - 40, txt = o.label; g.font = 'bold 17px Georgia'; const w = Math.min(420, g.measureText(txt).width + 28); g.fillStyle = on ? 'rgba(40,24,80,0.92)' : 'rgba(20,12,44,0.7)'; MGH.rr(g, lx - w / 2, ly - 18, w, 32, 14); g.fill(); g.strokeStyle = on ? '#ffe680' : 'rgba(255,255,255,0.25)'; g.lineWidth = on ? 3 : 1.5; g.stroke(); MGH.text(g, txt, lx, ly + 5, 16, off ? '#a8a8b8' : on ? '#fff' : '#d8d0f0', 'center', 'bold'); } }); }
    if (U.geyser) { const s2 = BD.spaces[U.geyser.pos]; for (let k = 0; k < 18; k++) { const q = (t * 2.4 + k / 18) % 1; g.fillStyle = `rgba(200,240,255,${0.85 * (1 - q)})`; g.beginPath(); g.arc(s2.x + Math.sin(k * 2.1 + t * 6) * 16 * q, s2.y - q * 220, 10 + q * 14, 0, 7); g.fill(); } }
    if (U.cast) { const T = this.tok[U.cast.i], P = BoardArt.props().find(p => p.kind === 'pier') || { x: T.x + 60, y: T.y }, q = Math.min(1, U.cast.t / 0.5); g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(T.x + 20, T.y - 70); g.quadraticCurveTo((T.x + P.x) / 2, Math.min(T.y, P.y) - 120, T.x + (P.x + 20 - T.x) * q, T.y + (P.y + 6 - T.y) * q); g.stroke();
      if (U.cast.eel) { const e = Math.min(1, U.cast.t / 0.3); g.save(); g.translate(P.x + 20, P.y - e * 50); g.fillStyle = '#3a6a3a'; g.beginPath(); g.ellipse(0, 0, 10, 26, 0.2, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(-3, -16, 3, 0, 7); g.fill(); g.fillStyle = '#c8303a'; g.beginPath(); g.ellipse(2, -24, 6, 3 + Math.abs(Math.sin(t * 20)) * 4, 0, 0, 7); g.fill(); g.restore(); } }
    if (U.splash) { const T = this.tok[U.splash.i], P = BoardArt.props().find(p => p.kind === 'fountain') || T, q = Math.min(1, U.splash.t / 0.6); MGH.coin ? MGH.coin(g, T.x + (P.x - T.x) * q, T.y - 70 + (P.y - 20 - T.y + 70) * q - Math.sin(q * Math.PI) * 80, 8, t * 10) : null; }
    if (U.balloonFly) { const T = this.tok[U.balloonFly.i], q = Math.min(1, U.balloonFly.t / 1.2); const by = T.y - 120 - q * 160; g.fillStyle = '#ff6a7a'; g.beginPath(); g.ellipse(T.x, by, 30, 38, 0, 0, 7); g.fill(); g.strokeStyle = '#5a3a1a'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(T.x - 18, by + 28); g.lineTo(T.x - 10, by + 70); g.moveTo(T.x + 18, by + 28); g.lineTo(T.x + 10, by + 70); g.stroke(); }
    if (this.ui.starHop) { const q = Math.min(1, this.ui.starHop.t / 1.4); MGH.star(g, sb.x, sb.y - 90 - (1 - q) * 300, 26, '#ffe680', t * 4, false); }
    this.floats.forEach(f => { g.globalAlpha = 1 - f.t / 1.4; MGH.text(g, f.text, f.x, f.y - f.t * 50, 26, f.col, 'center', 'bold'); g.globalAlpha = 1; });
    BoardArt.clouds(g, t, G.tod);
    g.restore();
    BoardArt.todOverlay(g, G.tod, t, this);
    BoardArt.weatherFx(g, G, t, this);
    BoardArt.sunlight(g, G.tod, t);
    if (U.comb) this.drawComb(g, U.comb, t);
    this.drawHUD(g, t);
    this.drawUI(g, t);
    if (this.paused) this.drawPause(g);
  };
  // the honeycomb: nine hexagon cells, opened ones show what was inside
  Board.drawComb = function (g, C, t) {
    const cx = 640, cy = 300, r = 44;
    g.fillStyle = 'rgba(40,20,0,0.55)'; MGH.rr(g, cx - 190, cy - 170, 380, 330, 26); g.fill(); g.strokeStyle = '#ffc040'; g.lineWidth = 3; g.stroke();
    C.cells.forEach((c, k) => { const row = Math.floor(k / 3), col = k % 3, x = cx + (col - 1) * r * 1.8 + (row % 2 ? r * 0.9 : 0) - r * 0.45, y = cy - 100 + row * r * 1.6, open = C.open.has(k);
      g.beginPath(); for (let q = 0; q < 6; q++) { const a = q / 6 * Math.PI * 2 + Math.PI / 6; g.lineTo(x + Math.cos(a) * r * 0.95, y + Math.sin(a) * r * 0.95); } g.closePath();
      const hg = g.createRadialGradient(x - 10, y - 12, 2, x, y, r); hg.addColorStop(0, open ? (c === 'queen' ? '#ff9a9a' : '#fff4c0') : '#ffd860'); hg.addColorStop(1, open ? (c === 'queen' ? '#a82a2a' : '#e8a020') : '#b87a10'); g.fillStyle = hg; g.fill(); g.strokeStyle = '#7a4a08'; g.lineWidth = 3; g.stroke();
      MGH.text(g, open ? (c === 'queen' ? '👑🐝' : c === 'jelly' ? '👑+8' : `+${c}`) : String(k + 1), x, y + 8, open ? 18 : 22, open ? '#3a1a00' : '#fff6d0', 'center', 'bold'); });
  };
})();
