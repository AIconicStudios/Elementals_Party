'use strict';
// 3D board pieces. Each prop is modelled in three.js, lit like the characters and rendered once
// (from the board camera's angle) into a cached sprite; the board then draws those sprites.
// Units: 1 = one board pixel. Elevation of the view matches the board tilt (Render.T).
const Board3D = {
  PPU: 2, cache: new Map(),
  ok() { return !Settings.flat3d && typeof Char3D !== 'undefined' && (Char3D.ready || Char3D.init()) && Char3D.q > 0; },

  // render a model into a sprite. w = half width, up/down = extent above/below the origin on screen (px)
  sprite(key, w, up, down, build) {
    if (this.cache.has(key)) return this.cache.get(key);
    if (!this.ok()) return null;
    let out = null;
    try {
      const C3 = Char3D, R = C3.R, P = this.PPU;
      const W = Math.ceil(w * 2 * P), H = Math.ceil((up + down) * P);
      if (W > C3.SZ || H > C3.SZ) throw new Error('sprite too big ' + key);
      const scene = new THREE.Scene(); scene.environment = C3.scene.environment;
      const e = Math.asin(Render.T);
      const cam = new THREE.OrthographicCamera(-w, w, up, -down, 1, 6000);
      cam.position.set(0, Math.sin(e) * 2000, Math.cos(e) * 2000); cam.lookAt(0, 0, 0);
      scene.add(new THREE.HemisphereLight(0xd6ebff, 0x9ac070, 0.62));
      const sun = new THREE.DirectionalLight(0xfff0d6, 1.25); sun.position.set(-700, 1100, 650); sun.castShadow = true;
      const ext = Math.max(w, up, down) * 1.5; Object.assign(sun.shadow.camera, { left: -ext, right: ext, top: ext, bottom: -ext, near: 10, far: 4000 }); sun.shadow.camera.updateProjectionMatrix();
      sun.shadow.mapSize.set(1024, 1024); sun.shadow.bias = -0.0008; sun.shadow.radius = 5; scene.add(sun);
      const rim = new THREE.DirectionalLight(0xdcefff, 0.45); rim.position.set(600, 400, -800); scene.add(rim);
      const grp = new THREE.Group(); scene.add(grp);
      const disp = [];
      const opts = build(grp, disp) || {};
      grp.traverse(o => { if (o.isMesh) { o.castShadow = o.castShadow !== false && !o.userData.noCast; o.receiveShadow = true; } });
      if (opts.catcher !== false) { // soft shadow on the ground under the prop
        const pl = new THREE.Mesh(new THREE.PlaneGeometry(ext * 4, ext * 4), new THREE.ShadowMaterial({ opacity: opts.shadow || 0.28 }));
        pl.rotation.x = -Math.PI / 2; pl.position.y = opts.groundY || 0; pl.receiveShadow = true; scene.add(pl);
      }
      const wasShadow = R.shadowMap.enabled; R.shadowMap.enabled = true;
      R.setViewport(0, 0, W, H); R.setScissor(0, 0, W, H); R.setClearColor(0, 0); R.clear();
      R.render(scene, cam);
      R.shadowMap.enabled = wasShadow;
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      cv.getContext('2d').drawImage(R.domElement, 0, C3.SZ - H, W, H, 0, 0, W, H);
      out = { cv, w, up, down };
      scene.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material && o.material !== Char3D.scene) { (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { if (m.map) m.map.dispose(); m.dispose(); }); } });
      sun.shadow.map && sun.shadow.map.dispose();
    } catch (err) { console.warn('board sprite failed', key, err); }
    this.cache.set(key, out);
    return out;
  },
  // draw a sprite so that its model origin lands on (x, y) in upright (unsquashed) space
  put(g, sp, x, y, s = 1) { g.drawImage(sp.cv, x - sp.w * s, y - sp.up * s, sp.w * 2 * s, (sp.up + sp.down) * s); },
  // same, but into ground (squashed) space: undo the squash around the anchor first
  putGround(g, sp, x, y, s = 1) { g.save(); g.translate(x, y); g.scale(1, 1 / Render.T); this.put(g, sp, 0, 0, s); g.restore(); },

  // ------------------------------------------------------------------ helpers
  M(hex, o = {}) { return Char3D.mat(hex, Object.assign({ envMapIntensity: 0.25 }, o)); },
  ball(r, hex, x, y, z, o, sx = 1, sy = 1, sz = 1) { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 28, 20), typeof hex === 'string' ? this.M(hex, o) : hex); m.position.set(x, y, z); m.scale.set(sx, sy, sz); return m; },
  hash(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); },
  lumpy(geo, amt, seed) { const p = geo.attributes.position, v = new THREE.Vector3(); for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const n = v.clone().normalize(); const k = 1 + (this.hash(Math.round(n.x * 7) * 13 + Math.round(n.y * 7) * 7 + Math.round(n.z * 7) + seed) - 0.5) * amt; v.multiplyScalar(k); p.setXYZ(i, v.x, v.y, v.z); } geo.computeVertexNormals(); return geo; },

  // ------------------------------------------------------------------ props
  foliage(grp, blobs, seed, base) {
    blobs.forEach(([x, y, z, r], k) => {
      const geo = this.lumpy(new THREE.SphereGeometry(r, 40, 28), 0.05, seed * 10 + k);
      const c = new THREE.Color(base).offsetHSL((this.hash(seed + k) - 0.5) * 0.03, 0.02, (this.hash(seed * 3 + k) - 0.45) * 0.1);
      const m = new THREE.Mesh(geo, this.M('#ffffff', { color: c, roughness: 0.62, clearcoat: 0.25, clearcoatRoughness: 0.5, sheen: 0.5, sheenColor: new THREE.Color('#d8ffb0') }));
      m.position.set(x, y, z); grp.add(m);
    });
  },
  tree(v) {
    return this.sprite('tree' + (v % 4), 75, 140, 26, grp => {
      const tr = new THREE.Mesh(new THREE.CylinderGeometry(5, 9, 64, 16), this.M('#7a5230', { roughness: 0.85, clearcoat: 0 })); tr.position.y = 32; grp.add(tr);
      for (const a of [-0.9, 0.7]) { const br = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 4, 26, 10), this.M('#7a5230', { roughness: 0.85 })); br.position.set(Math.sin(a) * 9, 52, 0); br.rotation.z = -a; grp.add(br); }
      this.foliage(grp, [[-24, 68, 2, 27], [24, 66, -4, 27], [0, 96, -6, 33], [-12, 78, 18, 23], [14, 84, 16, 22], [6, 112, 4, 18], [-26, 92, -10, 20], [28, 92, -8, 18]], v, '#4aa83a');
      if (v % 2) for (let k = 0; k < 5; k++) grp.add(this.ball(4.2, '#ff5a4a', -28 + k * 14, 62 + (k % 3) * 14, 26 - (k % 2) * 10, { roughness: 0.25, clearcoat: 1 }));
    });
  },
  bush(v) {
    return this.sprite('bush' + (v % 4), 48, 62, 20, grp => {
      this.foliage(grp, [[-18, 14, 0, 18], [17, 14, -2, 18], [0, 26, -4, 22], [-6, 15, 14, 15], [10, 30, 8, 12], [22, 10, 12, 11]], v + 20, '#45a336');
      if (v % 3 === 0) for (const [x, y, z] of [[-12, 22, 15], [8, 34, 14], [19, 18, 16], [-22, 12, 12]]) grp.add(this.ball(3.2, '#ff4d5a', x, y, z, { roughness: 0.2, clearcoat: 1 }));
    });
  },
  rock(v) {
    return this.sprite('rock' + (v % 3), 34, 34, 16, grp => {
      const geo = this.lumpy(new THREE.IcosahedronGeometry(16, 3), 0.35, v * 7 + 3);
      const m = new THREE.Mesh(geo, this.M('#9a9488', { roughness: 0.85, clearcoat: 0.1 })); m.scale.set(1.25, 0.78, 1); m.position.y = 9; grp.add(m);
      const s = new THREE.Mesh(this.lumpy(new THREE.IcosahedronGeometry(7, 2), 0.3, v + 11), this.M('#aaa498', { roughness: 0.8 })); s.position.set(16, 4, 8); grp.add(s);
    });
  },
  flowers(v) {
    return this.sprite('flowers' + (v % 5), 34, 36, 12, grp => {
      const cols = ['#ff8ad0', '#ffd34d', '#ffffff', '#b48aff', '#ff6a5a'];
      for (let k = 0; k < 6; k++) {
        const x = (k - 2.5) * 8, z = (k % 2) * 8 - 4, h = 13 + (k % 3) * 5;
        const st = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, h, 6), this.M('#3a8a2e')); st.position.set(x, h / 2, z); grp.add(st);
        const col = cols[(k + v) % 5];
        for (let p = 0; p < 5; p++) { const a = p * Math.PI * 2 / 5; grp.add(this.ball(2.6, col, x + Math.cos(a) * 3, h + 0.5, z + Math.sin(a) * 3, { roughness: 0.4, clearcoat: 0.6 }, 1, 0.55, 1)); }
        grp.add(this.ball(1.8, '#ffb020', x, h + 1.4, z, { roughness: 0.4 }));
        const lf = this.ball(3, '#4fae3c', x + 3, 4, z, {}, 1.6, 0.35, 0.7); lf.rotation.z = 0.5; grp.add(lf);
      }
    });
  },
  sign(v) {
    return this.sprite('sign' + (v % 2), 52, 76, 16, grp => {
      const wood = this.M('#8a5a32', { roughness: 0.8, clearcoat: 0.05 });
      const post = new THREE.Mesh(new THREE.CylinderGeometry(4, 5, 62, 12), wood); post.position.y = 31; grp.add(post);
      const board = (y, dir) => {
        const s = new THREE.Shape(); s.moveTo(-30, -9); s.lineTo(22, -9); s.lineTo(32, 0); s.lineTo(22, 9); s.lineTo(-30, 9); s.closePath();
        const m = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 5, bevelEnabled: true, bevelThickness: 1.2, bevelSize: 1.2, bevelSegments: 2 }), this.M('#c98a4a', { roughness: 0.7, clearcoat: 0.15 }));
        m.position.set(0, y, 3); m.scale.x = dir; grp.add(m);
      };
      board(50, v ? -1 : 1); board(30, v ? 1 : -1);
      grp.add(this.ball(5, '#6a3e18', 0, 63, 0, { roughness: 0.6 }));
    });
  },
  windmill() {
    return this.sprite('windmill', 44, 108, 18, grp => {
      const pts = []; for (let i = 0; i <= 12; i++) { const a = i / 12; pts.push(new THREE.Vector2(16 - a * 6, a * 80)); }
      const tw = new THREE.Mesh(new THREE.LatheGeometry(pts, 32), this.M('#eef3fa', { roughness: 0.5, clearcoat: 0.3 })); grp.add(tw);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(14, 22, 32), this.M('#6aa6e0', { roughness: 0.35, clearcoat: 0.6 })); roof.position.y = 90; grp.add(roof);
      const door = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 3, 16, 1, false, 0, Math.PI), this.M('#8a5a32')); door.rotation.x = Math.PI / 2; door.position.set(0, 10, 15); grp.add(door);
      const band = new THREE.Mesh(new THREE.TorusGeometry(13.5, 1.6, 10, 32), this.M('#9ab0c8')); band.rotation.x = Math.PI / 2; band.position.y = 40; grp.add(band);
    });
  },
  blades(frame) {
    return this.sprite('blades' + frame, 36, 36, 36, grp => {
      const rot = new THREE.Group(); rot.rotation.z = frame / 8 * Math.PI / 2; grp.add(rot);
      const bm = this.M('#ffffff', { roughness: 0.45, clearcoat: 0.4 }), fm = this.M('#9ab0c8');
      for (let k = 0; k < 4; k++) {
        const arm = new THREE.Group(); arm.rotation.z = k * Math.PI / 2; rot.add(arm);
        const sail = new THREE.Mesh(new THREE.BoxGeometry(9, 26, 1.6), bm); sail.position.set(3, 18, 0); arm.add(sail);
        const spar = new THREE.Mesh(new THREE.BoxGeometry(2, 32, 2.4), fm); spar.position.set(0, 16, 1); arm.add(spar);
      }
      rot.add(this.ball(4, '#9ab0c8', 0, 0, 2));
      return { catcher: false };
    });
  },
  shell() {
    return this.sprite('shell', 48, 58, 16, grp => {
      const geo = new THREE.SphereGeometry(30, 48, 24, 0, Math.PI, 0, Math.PI / 2);
      const p = geo.attributes.position, v = new THREE.Vector3();
      for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const a = Math.atan2(v.z, v.x); const rib = 1 + 0.06 * Math.abs(Math.sin(a * 6)); p.setXYZ(i, v.x * rib, v.y * rib * 1.1, v.z * rib * 0.55); }
      geo.computeVertexNormals();
      const m = new THREE.Mesh(geo, this.M('#ffd2c0', { roughness: 0.3, clearcoat: 0.9, sheen: 0.6, sheenColor: new THREE.Color('#ffffff'), side: THREE.DoubleSide })); m.rotation.y = Math.PI; m.position.z = 4; grp.add(m);
      grp.add(this.ball(7, '#f6f4ff', 0, 7, 16, { roughness: 0.08, clearcoat: 1, envMapIntensity: 1.2, sheen: 1, sheenColor: new THREE.Color('#ffd0f0') }));
    });
  },
  volcano() {
    return this.sprite('volcano', 60, 82, 18, grp => {
      const pts = [new THREE.Vector2(0, 54), new THREE.Vector2(12, 54), new THREE.Vector2(15, 62), new THREE.Vector2(22, 48), new THREE.Vector2(36, 20), new THREE.Vector2(48, 4), new THREE.Vector2(50, 0)];
      const cone = new THREE.Mesh(this.lumpy(new THREE.LatheGeometry(pts, 48), 0.06, 5), this.M('#4a2a20', { roughness: 0.9, clearcoat: 0.05 })); grp.add(cone);
      const lava = new THREE.Mesh(new THREE.CircleGeometry(13, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff7a1f') })); lava.rotation.x = -Math.PI / 2; lava.position.y = 56; lava.userData.noCast = true; grp.add(lava);
      for (const a of [0.3, 1.1, -0.6]) { const d = new THREE.Mesh(new THREE.CapsuleGeometry(2.6, 22, 4, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff6a1f') })); d.position.set(Math.sin(a) * 26, 38, Math.cos(a) * 26); d.lookAt(Math.sin(a) * 60, -10, Math.cos(a) * 60); d.rotateX(Math.PI / 2); grp.add(d); }
      const glow = new THREE.PointLight(0xff7a2a, 1.2, 160); glow.position.set(0, 70, 0); grp.add(glow);
    });
  },
  stones() {
    return this.sprite('stones', 50, 92, 18, grp => {
      const sm = this.M('#8a8478', { roughness: 0.9, clearcoat: 0.05 });
      for (const [x, h] of [[-26, 54], [0, 70], [26, 48]]) { const m = new THREE.Mesh(this.lumpy(new THREE.BoxGeometry(18, h, 14, 3, 6, 3), 0.05, x + h), sm); m.position.set(x, h / 2, 0); grp.add(m); }
      const top = new THREE.Mesh(this.lumpy(new THREE.BoxGeometry(76, 10, 16, 6, 2, 2), 0.04, 9), this.M('#7a7466', { roughness: 0.9 })); top.position.set(0, 76, 0); grp.add(top);
      for (const [x, z] of [[-14, 12], [16, 14]]) grp.add(this.ball(5, '#5aa83a', x, 2, z, { roughness: 0.6 }, 1.4, 0.5, 1));
    });
  },

  // draw a decor item in 3D; returns false to fall back to the 2D drawing
  drawDecor(g, d, now) {
    const kinds = { bush: () => this.bush(d.v), tree: () => this.tree(d.v), sign: () => this.sign(d.v), rock: () => this.rock(d.v), flowers: () => this.flowers(d.v), windmill: () => this.windmill(), shell: () => this.shell(), volcano: () => this.volcano(), stones: () => this.stones() };
    if (!kinds[d.kind]) return false;
    const sp = kinds[d.kind](); if (!sp) return false;
    g.save(); g.translate(d.x, d.y); g.scale(d.s, d.s);
    if (d.kind === 'tree' || d.kind === 'bush') { const sw = Math.sin(now * (d.kind === 'tree' ? 0.9 : 1.3) + d.v) * 0.025; g.transform(1, 0, -sw, 1, 0, 0); }
    this.put(g, sp, 0, 0);
    if (d.kind === 'windmill') { const fr = Math.floor(((now * 1.4) % (Math.PI / 2)) / (Math.PI / 2) * 8) % 8, bl = this.blades(fr); if (bl) this.put(g, bl, 0, -82); }
    if (d.kind === 'shell') for (let k = 0; k < 6; k++) { const ph = (now * 0.8 + k / 6) % 1; g.fillStyle = `rgba(200,240,255,${1 - ph})`; g.beginPath(); g.arc(Math.sin(k * 2) * 10, -40 - ph * 40, 3, 0, 7); g.fill(); }
    if (d.kind === 'volcano') for (let k = 0; k < 6; k++) { const ph = (now * 0.9 + k / 6) % 1; g.fillStyle = `rgba(${120 + ph * 80},${100 + ph * 60},100,${0.5 * (1 - ph)})`; g.beginPath(); g.arc(Math.sin(k + now) * 8 + ph * 10, -62 - ph * 60, 8 + ph * 12, 0, 7); g.fill(); }
    g.restore();
    return true;
  },

  // ------------------------------------------------------------------ board spaces: chunky glossy discs
  // origin = the disc's top face, so icons and tokens drawn at the space's point sit right on it
  disc(col, r, opt = {}) {
    const key = `disc|${col}|${r}|${opt.rim || ''}|${opt.dark ? 1 : 0}`;
    return this.sprite(key, r + 8, r * 0.8 + 6, r * 0.8 + 18, grp => {
      const th = opt.th || 9;
      const side = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.96, th, 64), this.M(Char.shade(col, -0.35), { roughness: 0.45, clearcoat: 0.5 })); side.position.y = -th / 2; grp.add(side);
      const rimC = opt.rim || '#ffffff';
      const rim = new THREE.Mesh(new THREE.TorusGeometry(r - 2.6, 2.8, 16, 64), this.M(rimC, { roughness: 0.3, clearcoat: 0.8 })); rim.rotation.x = Math.PI / 2; rim.position.y = 0.4; grp.add(rim);
      const topGeo = new THREE.CylinderGeometry(r - 4.5, r - 4.5, 2, 64);
      const top = new THREE.Mesh(topGeo, this.M(col, { roughness: opt.dark ? 0.5 : 0.28, clearcoat: 1, clearcoatRoughness: 0.12, envMapIntensity: 0.5 })); top.position.y = -0.6; grp.add(top);
      return { groundY: -th, shadow: 0.35 };
    });
  },
  // the raised platform of a Hold (origin = its top surface)
  hold(el, simple) {
    const T = [
      { rim: '#b9d6ee', a: '#ffffff', b: '#cfe6fa', side: '#9fb8d0' },
      { rim: '#f1dca0', a: '#7fd8ff', b: '#2f8ad8', side: '#c9b48a' },
      { rim: '#6a3424', a: '#5a3a30', b: '#2a1810', side: '#4a2418' },
      { rim: '#7a6a44', a: '#5aa83a', b: '#3f7a2a', side: '#5a4a2c' },
    ][el];
    const r0 = 178;
    return this.sprite(`hold|${el}|${simple ? 1 : 0}`, r0 + 14, r0 * 0.7 + 10, r0 * 0.7 + 40, grp => {
      const th = 16;
      const side = new THREE.Mesh(this.lumpy(new THREE.CylinderGeometry(r0, r0 + 6, th, 96, 2), 0.01, el), this.M(T.side, { roughness: 0.85, clearcoat: 0.05 })); side.position.y = -th / 2 - 1; grp.add(side);
      const tex = Char3D.canvasTex(512, 512, (g) => {
        const c = 256, s = 256 / r0;
        g.fillStyle = T.rim; g.fillRect(0, 0, 512, 512);
        const gr = g.createRadialGradient(c - 40 * s, c - 40 * s, 10, c, c, 168 * s); gr.addColorStop(0, T.a); gr.addColorStop(1, T.b); g.fillStyle = gr; g.beginPath(); g.arc(c, c, 168 * s, 0, 7); g.fill();
        if (el === 0) { g.strokeStyle = 'rgba(160,190,220,0.6)'; g.lineWidth = 3; for (let k = 1; k < 5; k++) { g.beginPath(); g.arc(c, c, k * 34 * s, 0, 7); g.stroke(); } }
        if (el === 1) { g.strokeStyle = 'rgba(255,255,255,0.45)'; g.lineWidth = 4; for (let k = 0; k < 7; k++) { g.beginPath(); g.ellipse(c, c, (40 + k * 18) * s, (30 + k * 17) * s, 0, k, k + 1.4); g.stroke(); } }
        if (el === 2) { g.strokeStyle = 'rgba(255,120,40,0.85)'; g.lineWidth = 5; g.lineCap = 'round'; for (let k = 0; k < 9; k++) { const a = k * 0.7; g.beginPath(); g.moveTo(c + Math.cos(a) * 40 * s, c + Math.sin(a) * 40 * s); g.lineTo(c + Math.cos(a + 0.25) * 100 * s, c + Math.sin(a + 0.25) * 100 * s); g.lineTo(c + Math.cos(a) * 160 * s, c + Math.sin(a) * 160 * s); g.stroke(); } }
        if (el === 3) for (let k = 0; k < 40; k++) { const a = this.hash(k + el * 50) * 7, d = Math.sqrt(this.hash(k + 99)) * 150 * s; g.fillStyle = 'rgba(30,70,20,0.35)'; g.beginPath(); g.arc(c + Math.cos(a) * d, c + Math.sin(a) * d, (6 + this.hash(k) * 8) * s, 0, 7); g.fill(); }
        if (simple) { g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.arc(c, c, 92 * s, 0, 7); g.fill(); }
        else { g.strokeStyle = 'rgba(120,90,50,0.35)'; g.lineWidth = 50 * s; g.beginPath(); g.arc(c, c, Render.RING * s, 0, 7); g.stroke(); }
      });
      const top = new THREE.Mesh(new THREE.CircleGeometry(r0, 96), this.M('#ffffff', { map: tex, roughness: el === 1 ? 0.25 : 0.6, clearcoat: el === 1 ? 0.8 : 0.2 })); top.rotation.x = -Math.PI / 2; grp.add(top);
      const lip = new THREE.Mesh(new THREE.TorusGeometry(r0 - 2, 5, 14, 96), this.M(T.rim, { roughness: 0.6, clearcoat: 0.3 })); lip.rotation.x = Math.PI / 2; lip.position.y = 0.5; grp.add(lip);
      // a ring of little boulders round the edge
      for (let k = 0; k < 28; k++) { const a = k / 28 * Math.PI * 2 + 0.05; const b = new THREE.Mesh(this.lumpy(new THREE.IcosahedronGeometry(6 + this.hash(k + el * 9) * 4, 2), 0.3, k + el * 30), this.M(Char.shade(T.side, 0.15), { roughness: 0.85 })); b.position.set(Math.cos(a) * (r0 + 4), -4, Math.sin(a) * (r0 + 4)); grp.add(b); }
      return { groundY: -th - 1, shadow: 0.32 };
    });
  },
  pond() {
    return this.sprite('pond', 150, 70, 70, grp => {
      const rx = 122, rz = 64;
      const water = new THREE.Mesh(new THREE.CircleGeometry(1, 64), this.M('#2f8ad8', { roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.4, transparent: true, opacity: 0.94 })); water.scale.set(rx, rz, 1); water.rotation.x = -Math.PI / 2; water.position.y = -3; grp.add(water);
      const deep = new THREE.Mesh(new THREE.CircleGeometry(1, 64), new THREE.MeshBasicMaterial({ color: new THREE.Color('#14508a') })); deep.scale.set(rx * 0.7, rz * 0.6, 1); deep.rotation.x = -Math.PI / 2; deep.position.y = -6; grp.add(deep);
      const bank = new THREE.Mesh(new THREE.RingGeometry(0.92, 1.08, 64), this.M('#c9b48a', { roughness: 0.9 })); bank.scale.set(rx, rz, 1); bank.rotation.x = -Math.PI / 2; bank.position.y = -1; grp.add(bank);
      for (let k = 0; k < 34; k++) { const a = k / 34 * Math.PI * 2; const b = new THREE.Mesh(this.lumpy(new THREE.IcosahedronGeometry(5 + this.hash(k) * 4, 2), 0.3, k + 70), this.M(k % 3 ? '#a8a294' : '#8a8478', { roughness: 0.8, clearcoat: 0.1 })); b.position.set(Math.cos(a) * rx * 1.04, 0, Math.sin(a) * rz * 1.04); b.scale.y = 0.7; grp.add(b); }
      for (const [x, z, r] of [[-50, -10, 11], [50, 12, 11], [0, 30, 10], [-20, 40, 7]]) { const pad = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1.2, 24, 1, false, 0.4, Math.PI * 2 - 0.5), this.M('#4fa83a', { roughness: 0.4, clearcoat: 0.6 })); pad.position.set(x, -1.8, z); grp.add(pad); }
      grp.add(this.ball(3.6, '#ff8ad0', -46, 0, -8, { roughness: 0.4, clearcoat: 0.5 }, 1, 0.7, 1));
      return { groundY: -2, shadow: 0.2 };
    });
  },
};
