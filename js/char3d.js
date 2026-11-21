'use strict';
// Real-time 3D clan characters (three.js / WebGL).
// Char.draw keeps all the animation logic (moods, idle poses, walking, waving, hand/foot poses);
// this module builds a soft glossy 3D model per clan, poses it from that same data, renders it
// into a shared offscreen WebGL canvas and pastes the result into the 2D canvas.
// Everything falls back to the 2D drawing when WebGL is not available.
const Char3D = {
  ready: false, failed: false, q: 2, // quality: 2 soft shadows, 1 fast, 0 off (2D)
  SZ: 1024,         // offscreen canvas size (px); characters use the bottom-left 512 at most
  BOX: 4.0,         // rendered square, in body radii r
  CY: 0.12,         // centre of that square below the body centre (r)
  budget: 0,        // renders this frame (soft cap; beyond it Char.draw falls back to 2D)

  init() {
    if (this.ready || this.failed) return this.ready;
    try {
      if (typeof THREE === 'undefined' || Settings.flat3d) throw new Error('no three');
      if (THREE.ColorManagement) { THREE.ColorManagement.legacyMode = false; THREE.ColorManagement.enabled = true; }
      const cv = document.createElement('canvas'); cv.width = cv.height = this.SZ;
      const R = new THREE.WebGLRenderer({ canvas: cv, alpha: true, antialias: true, premultipliedAlpha: true, preserveDrawingBuffer: false, powerPreference: 'high-performance' });
      R.setPixelRatio(1); R.setSize(this.SZ, this.SZ, false); R.setClearColor(0x000000, 0);
      R.outputEncoding = THREE.sRGBEncoding; R.toneMapping = THREE.NoToneMapping; R.toneMappingExposure = 0.95;
      R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
      R.setScissorTest(true);
      this.R = R; this.cv = cv;
      // software renderers (no usable GPU) are far too slow for live 3D: keep the 2D drawings there
      try { const gl = R.getContext(), dbg = gl.getExtension('WEBGL_debug_renderer_info'); this.gpu = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : ''; } catch (e) { this.gpu = ''; }
      if (/swiftshader|llvmpipe|software|basic render/i.test(this.gpu) && !this.noAuto) { this.q = 0; console.info('3D characters off: software renderer', this.gpu); }
      this.scene = new THREE.Scene();
      this.scene.environment = this.envMap(R);
      // camera: orthographic so the model lines up exactly with the 2D layout, tipped a little to see the top of the head
      const h = this.BOX / 2, cam = new THREE.OrthographicCamera(-h, h, h - this.CY, -h - this.CY, 0.1, 40);
      const pitch = 0.14; cam.position.set(0, Math.sin(pitch) * 12, Math.cos(pitch) * 12); cam.lookAt(0, 0, 0);
      this.cam = cam;
      // lights: warm key from upper left, sky fill, cool rim from behind, warm bounce from the ground
      const hemi = new THREE.HemisphereLight(0xcfe4ff, 0xffb47a, 0.5); this.scene.add(hemi);
      const key = new THREE.DirectionalLight(0xfff0d8, 1.25); key.position.set(-3.2, 4.2, 5); key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024); const sc = key.shadow.camera; sc.left = -2.4; sc.right = 2.4; sc.top = 2.4; sc.bottom = -2.4; sc.near = 0.5; sc.far = 20;
      key.shadow.bias = -0.0015; key.shadow.normalBias = 0.02; key.shadow.radius = 4;
      this.scene.add(key); this.key = key;
      const rim = new THREE.DirectionalLight(0xcfe6ff, 0.7); rim.position.set(3.5, 2.5, -4); this.scene.add(rim);
      const rim2 = new THREE.DirectionalLight(0xffe0c0, 0.35); rim2.position.set(-4, 0.5, -3); this.scene.add(rim2);
      const fill = new THREE.DirectionalLight(0xffffff, 0.28); fill.position.set(3, 1, 4); this.scene.add(fill);
      this.models = [];
      for (let el = 0; el < 4; el++) { const m = this.build(el); m.root.visible = false; this.scene.add(m.root); this.models.push(m); }
      this.faceCache = new Map(); this.imgCache = new Map();
      this.ready = true;
      // auto quality: if frames get slow while 3D characters are on screen, drop the soft shadows and render
      // smaller; if it is still slow, hand back to the 2D drawings (Settings menu can switch 3D back on)
      let last = performance.now(), ema = 16, frames = 0;
      const tick = now => {
        const dt = Math.min(200, now - last); last = now;
        if (this.budget > 0 && !document.hidden) { ema = ema * 0.97 + dt * 0.03; frames++; } else frames = Math.max(0, frames - 1);
        if (!this.noAuto && frames > 150 && ema > 30 && this.q > 0) { this.q--; frames = 0; ema = 16; this.applyQ(); console.info('3D characters: quality', this.q); }
        this.budget = 0; requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    } catch (e) { console.warn('3D characters unavailable, using 2D', e); this.failed = true; }
    return this.ready;
  },

  applyQ() { if (!this.R) return; const sh = this.q >= 2; if (this.R.shadowMap.enabled !== sh) { this.R.shadowMap.enabled = sh; this.scene.traverse(o => { if (o.material) o.material.needsUpdate = true; }); } },
  // soft studio environment for glossy reflections: blue sky above, bright horizon, warm ground
  envMap(R) {
    const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, 128);
    gr.addColorStop(0, '#9cc8ff'); gr.addColorStop(0.42, '#eaf4ff'); gr.addColorStop(0.5, '#ffffff'); gr.addColorStop(0.56, '#f4e6cf'); gr.addColorStop(1, '#8a6a4a');
    g.fillStyle = gr; g.fillRect(0, 0, 256, 128);
    g.fillStyle = 'rgba(255,255,240,0.95)'; g.beginPath(); g.ellipse(70, 34, 26, 16, 0, 0, 7); g.fill(); // softbox "sun"
    g.fillStyle = 'rgba(255,255,255,0.6)'; g.beginPath(); g.ellipse(190, 40, 30, 12, 0, 0, 7); g.fill();
    const tex = new THREE.CanvasTexture(c); tex.mapping = THREE.EquirectangularReflectionMapping; tex.encoding = THREE.sRGBEncoding;
    const pm = new THREE.PMREMGenerator(R); const env = pm.fromEquirectangular(tex).texture; pm.dispose(); tex.dispose();
    return env;
  },

  col(hex) { return new THREE.Color(hex).convertSRGBToLinear ? new THREE.Color(hex) : new THREE.Color(hex); },
  mat(hex, o = {}) {
    return new THREE.MeshPhysicalMaterial(Object.assign({ color: new THREE.Color(hex), roughness: 0.48, metalness: 0, clearcoat: 0.35, clearcoatRoughness: 0.35, envMapIntensity: 0.3 }, o));
  },
  cloth(hex, o = {}) { return this.mat(hex, Object.assign({ roughness: 0.72, clearcoat: 0.08, sheen: 0.6, sheenRoughness: 0.6, sheenColor: new THREE.Color(0xffffff), envMapIntensity: 0.18 }, o)); },
  mesh(geo, mat, cast = true, recv = true) { const m = new THREE.Mesh(geo, mat); m.castShadow = cast; m.receiveShadow = recv; return m; },
  sphere(r, ws = 40, hs = 28) { return new THREE.SphereGeometry(r, ws, hs); },
  canvasTex(w, h, paint) { const c = document.createElement('canvas'); c.width = w; c.height = h; paint(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return t; },

  // ------------------------------------------------------------------ model
  // Units: body radius r = 1. Head radius 0.7 centred 0.32 above the body centre; torso 0.59 below; ground at -1.25.
  HEAD_Y: 0.32, TORSO_Y: -0.59, GROUND: -1.25, HR: 0.7,
  build(el) {
    const C = CLAN[el], O = Char.OUTFIT[el], HR = this.HR;
    const root = new THREE.Group();
    const body = new THREE.Group(); root.add(body);           // squash + yaw live here
    // ---- head
    const head = new THREE.Group(); head.position.y = this.HEAD_Y; body.add(head);
    const skin = this.mat('#ffbe7d', { roughness: 0.42, clearcoat: 0.42, clearcoatRoughness: 0.3, sheen: 0.5, sheenRoughness: 0.5, sheenColor: new THREE.Color('#ffd9b0'), emissive: new THREE.Color('#ff5a2a'), emissiveIntensity: 0.06 });
    const skull = this.mesh(this.sphere(HR, 64, 48), skin); head.add(skull);
    const nose = this.mesh(this.sphere(HR * 0.15, 24, 18), skin); nose.position.set(0, -HR * 0.06, HR * 0.97); nose.scale.set(1.05, 0.9, 0.85); head.add(nose);
    // painted face on a thin shell over the front of the head (planar projection from the front)
    const fg = new THREE.SphereGeometry(HR * 1.004, 64, 48, 0, Math.PI * 2, 0, Math.PI);
    const pos = fg.attributes.position, uv = fg.attributes.uv;
    for (let i = 0; i < pos.count; i++) { uv.setXY(i, pos.getX(i) / (HR * 2) + 0.5, pos.getY(i) / (HR * 2) + 0.5); }
    // keep only the front half (back vertices collapse so the face never repeats on the back)
    const idx = []; const ix = fg.index.array;
    for (let i = 0; i < ix.length; i += 3) { if (pos.getZ(ix[i]) > HR * 0.05 && pos.getZ(ix[i + 1]) > HR * 0.05 && pos.getZ(ix[i + 2]) > HR * 0.05) idx.push(ix[i], ix[i + 1], ix[i + 2]); }
    fg.setIndex(idx);
    const faceMat = this.mat('#ffffff', { transparent: true, roughness: 0.4, clearcoat: 0.45, clearcoatRoughness: 0.25, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
    const faceShell = this.mesh(fg, faceMat, false, true); faceShell.renderOrder = 2; head.add(faceShell);
    // ---- clan headwrap: a cap over the crown with a rolled hem, a knot with tails at the back and an ornament on top
    const cap = new THREE.Group(); cap.rotation.x = -0.2; head.add(cap);
    const capTex = this.canvasTex(512, 128, (g, w, h) => this.paintWrap(g, w, h, C, el));
    const capMat = this.cloth(C.wrap, { map: capTex, color: 0xffffff, roughness: 0.66 });
    const capGeo = new THREE.SphereGeometry(HR * 1.045, 64, 24, 0, Math.PI * 2, 0, Math.PI * 0.36);
    cap.add(this.mesh(capGeo, capMat));
    const hemR = HR * 1.045 * Math.sin(Math.PI * 0.36), hemY = HR * 1.045 * Math.cos(Math.PI * 0.36);
    const hem = this.mesh(new THREE.TorusGeometry(hemR, HR * 0.07, 16, 64), this.cloth(C.hem, { roughness: 0.6 })); hem.rotation.x = Math.PI / 2; hem.position.y = hemY; cap.add(hem);
    const knot = new THREE.Group(); knot.position.set(0, hemY - HR * 0.02, -hemR * 0.98); cap.add(knot);
    const knotMat = this.cloth(Char.shade(C.wrap, -0.1));
    knot.add(this.mesh(this.sphere(HR * 0.12, 20, 14), knotMat));
    const tails = [];
    for (let k = 0; k < 2; k++) {
      const tl = new THREE.Group(); const m = this.mesh(this.sphere(HR * 0.1, 20, 12), knotMat); m.scale.set(0.55, 2.6, 0.35); m.position.y = -HR * 0.24; tl.add(m);
      tl.rotation.z = k ? 0.35 : -0.35; tl.rotation.x = -0.5; knot.add(tl); tails.push(tl);
    }
    const orn = new THREE.Group(); orn.position.y = HR * 1.04; cap.add(orn);
    const anim = { tails, orn, el };
    this.ornament(el, orn, anim, HR);
    // ---- torso with the clan outfit
    const torso = new THREE.Group(); torso.position.y = this.TORSO_Y; body.add(torso);
    const outTex = this.canvasTex(512, 256, (g, w, h) => this.paintOutfit(g, w, h, el));
    const tmesh = this.mesh(this.sphere(1, 48, 32), this.cloth('#ffffff', { map: outTex })); tmesh.scale.set(0.56, 0.5, 0.5); torso.add(tmesh);
    if (el === 1) { // neckerchief under the chin
      const tie = this.mesh(new THREE.ConeGeometry(0.11, 0.24, 3), this.cloth(O.tie)); tie.position.set(0, 0.24, 0.36); tie.rotation.set(Math.PI + 0.25, 0, 0); tie.scale.set(1.4, 1, 0.45); torso.add(tie);
      const tk = this.mesh(this.sphere(0.06, 16, 12), this.cloth(O.tie)); tk.position.set(0, 0.34, 0.38); torso.add(tk);
    }
    let cape = null;
    if (el === 0) { // little sky cape
      const cg = new THREE.CylinderGeometry(0.42, 0.62, 0.62, 24, 6, true, Math.PI * 0.62, Math.PI * 0.76);
      cape = this.mesh(cg, this.cloth('#f4f9ff', { side: THREE.DoubleSide })); cape.position.set(0, -0.02, -0.04); torso.add(cape);
    }
    // ---- floating gloves and shoes
    const gloveMat = this.mat(C.glove, { roughness: 0.55, clearcoat: 0.25, sheen: 0.4, sheenColor: new THREE.Color('#ffffff') });
    const cuffMat = this.cloth(C.cuff);
    const hands = [0, 1].map(() => this.glove(gloveMat, cuffMat)); hands.forEach(hd => body.add(hd.g));
    const shoeMat = this.mat(C.shoe, { roughness: 0.4, clearcoat: 0.55, clearcoatRoughness: 0.2 }), soleMat = this.mat(C.sole, { roughness: 0.7, clearcoat: 0.1 }), laceMat = this.cloth(C.lace);
    const feet = [0, 1].map(() => this.shoe(shoeMat, soleMat, laceMat, !!C.boot)); feet.forEach(f => body.add(f));
    return { root, body, head, skull, skin, faceMat, faceShell, cap, torso, hands, feet, cape, anim, baseSkin: skin.color.clone() };
  },

  ornament(el, orn, anim, HR) {
    if (el === 0) { // pinwheel on a little stem
      const stem = this.mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.2, 8), this.mat('#8a93a3', { metalness: 0.4, roughness: 0.35 })); stem.position.y = 0.08; orn.add(stem);
      const hub = new THREE.Group(); hub.position.y = 0.2; orn.add(hub); anim.spin = hub;
      const bm = this.mat('#f6f8fc', { roughness: 0.35, clearcoat: 0.6 });
      for (let k = 0; k < 3; k++) { const b = this.mesh(this.sphere(0.1, 20, 12), bm); b.scale.set(1.25, 0.18, 0.45); b.position.x = 0.13; const p = new THREE.Group(); p.rotation.y = k * Math.PI * 2 / 3; p.add(b); hub.add(p); }
      hub.add(this.mesh(this.sphere(0.04, 12, 10), this.mat('#b9c4d4')));
    } else if (el === 1) { // glossy water drop
      const pts = []; for (let i = 0; i <= 24; i++) { const a = i / 24; const y = a * 0.42; const rr = a < 0.45 ? Math.sin(a / 0.45 * Math.PI / 2) * 0.15 : 0.15 * Math.cos((a - 0.45) / 0.55 * Math.PI / 2) ** 1.4; pts.push(new THREE.Vector2(Math.max(0.0005, rr), y)); }
      const d = this.mesh(new THREE.LatheGeometry(pts, 32), this.mat('#3d8ef0', { roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.4, emissive: new THREE.Color('#0a3a90'), emissiveIntensity: 0.15 }));
      d.position.y = -0.02; orn.add(d); anim.drop = d;
    } else if (el === 2) { // three living flames
      anim.flames = [];
      const fm = (c, e) => new THREE.MeshBasicMaterial({ color: new THREE.Color(c), transparent: true, opacity: 0.95 });
      const mk = (x, z, s, c1, c2) => {
        const pts = []; for (let i = 0; i <= 20; i++) { const a = i / 20; pts.push(new THREE.Vector2(Math.max(0.0005, Math.sin(Math.pow(a, 0.55) * Math.PI) * 0.11 * (1 - a * 0.35)), a * 0.42)); }
        const grp = new THREE.Group(); grp.position.set(x, -0.03, z); grp.scale.setScalar(s);
        const outer = new THREE.Mesh(new THREE.LatheGeometry(pts, 20), fm(c1)); grp.add(outer);
        const inner = new THREE.Mesh(new THREE.LatheGeometry(pts, 16), fm(c2)); inner.scale.set(0.55, 0.62, 0.55); inner.position.z = 0.02; grp.add(inner);
        orn.add(grp); anim.flames.push(grp);
      };
      mk(-0.13, 0, 0.85, '#ff7a2a', '#ffd34d'); mk(0.13, 0, 0.85, '#ff7a2a', '#ffd34d'); mk(0, 0.03, 1.2, '#ff9a2a', '#fff3b0');
    } else if (el === 3) { // acorn nub with a sprout
      const nub = this.mesh(this.sphere(0.09, 20, 14), this.mat('#c98a4a', { roughness: 0.6 })); orn.add(nub);
      const stem = this.mesh(new THREE.CylinderGeometry(0.018, 0.026, 0.28, 8), this.mat('#3f7a1c')); stem.position.y = 0.17; stem.rotation.z = 0.12; orn.add(stem);
      const lm = this.mat('#7ccf4a', { roughness: 0.45, clearcoat: 0.5, side: THREE.DoubleSide });
      anim.leaves = [];
      for (let k = 0; k < 2; k++) {
        const pv = new THREE.Group(); pv.position.y = 0.3; pv.rotation.z = k ? 0.9 : -0.9; orn.add(pv);
        const lf = this.mesh(this.sphere(0.1, 20, 12), lm); lf.scale.set(1.9, 0.25, 0.85); lf.position.x = (k ? -1 : 1) * 0.17; pv.add(lf); anim.leaves.push(pv);
      }
    }
  },

  glove(mat, cuffMat) {
    const g = new THREE.Group(); const hand = new THREE.Group(); g.add(hand);
    // local: fingers toward +y, palm facing +z
    const palm = this.mesh(this.sphere(0.15, 28, 20), mat); palm.scale.set(1, 1.05, 0.82); hand.add(palm);
    const fingers = this.mesh(this.sphere(0.12, 24, 16), mat); fingers.position.set(0, 0.11, 0.02); fingers.scale.set(1.05, 0.95, 0.85); hand.add(fingers);
    const thumb = this.mesh(this.sphere(0.055, 18, 12), mat); thumb.scale.set(1, 1.5, 1); thumb.position.set(0.13, 0.03, 0.05); thumb.rotation.z = -0.5; hand.add(thumb);
    const cuff = this.mesh(new THREE.TorusGeometry(0.11, 0.045, 12, 28), cuffMat); cuff.rotation.x = Math.PI / 2; cuff.position.y = -0.15; hand.add(cuff);
    const cuffIn = this.mesh(new THREE.CylinderGeometry(0.115, 0.1, 0.06, 24), cuffMat); cuffIn.position.y = -0.16; hand.add(cuffIn);
    return { g, hand, fingers, thumb };
  },
  shoe(mat, soleMat, laceMat, boot) {
    const s = new THREE.Group();
    const up = this.mesh(this.sphere(0.15, 32, 20), mat); up.scale.set(0.95, 0.78, 1.45); up.position.set(0, 0.11, 0.04); s.add(up);
    const sole = this.mesh(this.sphere(0.16, 32, 16), soleMat); sole.scale.set(0.98, 0.32, 1.5); sole.position.set(0, 0.045, 0.04); s.add(sole);
    if (boot) { const c = this.mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.16, 24), mat); c.position.set(0, 0.22, -0.03); s.add(c); const rim = this.mesh(new THREE.TorusGeometry(0.11, 0.025, 10, 24), laceMat); rim.rotation.x = Math.PI / 2; rim.position.set(0, 0.3, -0.03); s.add(rim); }
    else { for (let k = 0; k < 2; k++) { const l = this.mesh(new THREE.CapsuleGeometry(0.014, 0.1, 4, 8), laceMat); l.rotation.z = Math.PI / 2; l.position.set(0, 0.215 - k * 0.025, 0.08 + k * 0.05); l.rotation.x = 0.5; s.add(l); } }
    return s;
  },

  // ------------------------------------------------------------------ textures
  paintWrap(g, w, h, C, el) {
    g.fillStyle = C.wrap; g.fillRect(0, 0, w, h);
    g.lineCap = 'round';
    const reps = 8, band = h * 0.62;
    for (let k = 0; k < reps; k++) {
      const x = (k + 0.5) * w / reps;
      if (C.pattern === 'wave') { g.strokeStyle = C.wrap2; g.lineWidth = 7; g.beginPath(); g.arc(x, band, 16, Math.PI, Math.PI * 1.95); g.stroke(); }
      if (C.pattern === 'flame') { g.fillStyle = k % 2 ? C.wrap2 : '#ff8a2a'; g.beginPath(); g.moveTo(x - 18, h); g.quadraticCurveTo(x - 6, band - 20, x, band - 40); g.quadraticCurveTo(x + 8, band - 10, x + 18, h); g.fill(); }
      if (C.pattern === 'leaf') { g.fillStyle = C.wrap2; g.save(); g.translate(x, band + (k % 2) * 10); g.rotate(k * 0.7); g.beginPath(); g.ellipse(0, 0, 18, 8, 0, 0, 7); g.fill(); g.restore(); g.fillStyle = '#4a2c14'; g.beginPath(); g.arc(x + 30, band - 28, 4, 0, 7); g.fill(); }
      if (C.pattern === 'swirl') { g.strokeStyle = C.wrap2; g.lineWidth = 7; g.beginPath(); g.arc(x, band, 17, 0, Math.PI * 1.5); g.stroke(); g.beginPath(); g.arc(x, band, 6, 0, Math.PI * 1.5); g.stroke(); }
    }
    if (C.pattern === 'leaf') { g.strokeStyle = '#4a2c14'; g.lineWidth = 5; g.beginPath(); g.moveTo(0, band - 10); for (let x = 0; x <= w; x += 16) g.lineTo(x, band - 10 + Math.sin(x / 30) * 6); g.stroke(); }
    // knit/fabric grain
    g.globalAlpha = 0.06; g.fillStyle = '#000'; for (let y = 0; y < h; y += 4) g.fillRect(0, y, w, 1); g.globalAlpha = 1;
  },
  // outfit on the torso sphere (equirectangular: x = around, front at x = w/4; y = top to bottom)
  paintOutfit(g, w, h, el) {
    const O = Char.OUTFIT[el], F = w * 0.25, B = w * 0.75;
    const sh = (c, a) => Char.shade(c, a);
    g.fillStyle = O.top; g.fillRect(0, 0, w, h);
    const band = (y, hh, c) => { g.fillStyle = c; g.fillRect(0, y, w, hh); };
    if (el === 0) {
      band(h * 0.66, h * 0.06, '#ffffff'); band(h * 0.72, h, O.bottoms);
      g.fillStyle = '#ffffff'; g.fillRect(F - 3, h * 0.18, 6, h * 0.48);                    // zip
      g.fillStyle = '#7f8fa8'; for (let y = h * 0.2; y < h * 0.64; y += 7) g.fillRect(F - 1, y, 2, 3);
      g.fillStyle = '#ffffff'; g.beginPath(); g.arc(F - 34, h * 0.42, 16, 0, 7); g.fill();    // swirl badge
      g.strokeStyle = '#5aa9c9'; g.lineWidth = 3; g.beginPath(); g.arc(F - 34, h * 0.42, 10, 0.3, 5.3); g.stroke(); g.beginPath(); g.arc(F - 34, h * 0.42, 4, 0.3, 5.3); g.stroke();
    }
    if (el === 1) {
      band(h * 0.7, h, O.bottoms);
      g.fillStyle = O.trim; g.fillRect(B - 80, 0, 160, h * 0.34);                             // sailor collar at the back
      g.fillStyle = '#ffffff'; g.fillRect(B - 72, h * 0.27, 144, 4); g.fillRect(B - 72, 0, 4, h * 0.27); g.fillRect(B + 68, 0, 4, h * 0.27);
      g.fillStyle = O.trim; g.beginPath(); g.moveTo(F - 60, 0); g.lineTo(F, h * 0.32); g.lineTo(F + 60, 0); g.closePath(); g.fill(); // V neck
      g.fillStyle = '#ffd34d'; for (const y of [0.78, 0.88]) { g.beginPath(); g.arc(F - 22, h * y, 5, 0, 7); g.fill(); g.beginPath(); g.arc(F + 22, h * y, 5, 0, 7); g.fill(); }
    }
    if (el === 2) {
      band(h * 0.66, h, O.bottoms);
      band(h * 0.6, h * 0.07, O.trim); g.fillStyle = sh(O.trim, -0.3); for (let x = 0; x < w; x += 8) g.fillRect(x, h * 0.6, 2, h * 0.07);
      g.fillStyle = O.stripe; g.fillRect(0, h * 0.67, 8, h); g.fillRect(w * 0.5 - 4, h * 0.67, 8, h); g.fillRect(w - 8, h * 0.67, 8, h);
      g.fillStyle = '#fff1d6'; g.fillRect(F - 2, h * 0.16, 4, h * 0.44);                     // zip
      const fx = F - 40, fy = h * 0.4;                                                       // flame patch
      const fgr = g.createLinearGradient(0, fy + 20, 0, fy - 30); fgr.addColorStop(0, '#fff3b0'); fgr.addColorStop(1, '#ff9a2a'); g.fillStyle = fgr;
      g.beginPath(); g.moveTo(fx - 16, fy + 18); g.quadraticCurveTo(fx - 20, fy - 6, fx, fy - 30); g.quadraticCurveTo(fx + 3, fy - 8, fx + 10, fy - 12); g.quadraticCurveTo(fx + 22, fy + 4, fx + 16, fy + 18); g.closePath(); g.fill();
      g.strokeStyle = '#a82a10'; g.lineWidth = 2.5; g.stroke();
      g.fillStyle = '#ffc23a'; g.font = 'bold 34px Georgia, serif'; g.textAlign = 'center'; g.fillText('F', F + 40, h * 0.48);
    }
    if (el === 3) {
      const den = O.bottoms;
      g.fillStyle = den; g.fillRect(0, h * 0.56, w, h);                                      // trousers
      g.fillRect(F - 46, h * 0.3, 92, h * 0.3);                                              // bib
      g.fillRect(F - 40, 0, 12, h * 0.32); g.fillRect(F + 28, 0, 12, h * 0.32);               // straps
      g.fillRect(B - 40, 0, 12, h * 0.56); g.fillRect(B + 28, 0, 12, h * 0.56);
      g.strokeStyle = sh(den, 0.4); g.lineWidth = 2; g.setLineDash([6, 5]); g.strokeRect(F - 40, h * 0.34, 80, h * 0.24); g.setLineDash([]);
      g.fillStyle = '#ffd34d'; for (const x of [F - 34, F + 34]) { g.beginPath(); g.arc(x, h * 0.33, 6, 0, 7); g.fill(); }
      g.fillStyle = sh(den, -0.18); g.fillRect(F - 22, h * 0.4, 44, h * 0.13);              // pocket
      g.fillStyle = '#9fe06a'; g.save(); g.translate(F, h * 0.465); g.rotate(-0.5); g.beginPath(); g.ellipse(0, 0, 14, 6, 0, 0, 7); g.fill(); g.restore();
    }
    g.globalAlpha = 0.05; g.fillStyle = '#000'; for (let y = 0; y < h; y += 3) g.fillRect(0, y, w, 1); g.globalAlpha = 1;
  },

  // ------------------------------------------------------------------ face (front view, painted per mood)
  IRIS: ['#3fb0cc', '#2f7fe8', '#e08a2a', '#6f8f2c'],
  faceTex(el, mood, t, seed, ly) {
    const blinkP = (t + seed * 0.71) % 3.7, blink = blinkP < 0.13;
    const anim = Math.floor(((t * 6) % 6));
    const key = `${el}|${mood}|${blink ? 1 : 0}|${['laugh', 'cheer', 'evil', 'cry', 'dizzy', 'effort', 'starry', 'love', 'nervous', 'scared'].includes(mood) ? anim : 0}|${Math.round(ly * 3)}`;
    let tex = this.faceCache.get(key);
    if (tex) { this.faceCache.delete(key); this.faceCache.set(key, tex); return tex; }
    tex = this.canvasTex(256, 256, (g, w) => this.paintFace(g, w, el, mood, blink, anim, ly));
    this.faceCache.set(key, tex);
    if (this.faceCache.size > 120) { const k0 = this.faceCache.keys().next().value; this.faceCache.get(k0).dispose(); this.faceCache.delete(k0); }
    return tex;
  },
  // canvas = front view of the head: (0,0)-(256,256) covers x,y in [-0.7, 0.7] (y down in the canvas)
  paintFace(g, W, el, mood, blink, anim, ly) {
    const S = W / 1.4, X = x => W / 2 + x * S, Y = y => W / 2 - y * S, L = v => v * S;
    const ink = '#2a1410', iris = this.IRIS[el];
    const ex = 0.215, ey = 0.06, ew = 0.1, eh = 0.145, my = -0.235;
    const lw = L(0.028);
    g.lineCap = 'round'; g.lineJoin = 'round';
    const blush = (a = 0.55) => { for (const s of [-1, 1]) { const x = X(s * 0.36), y = Y(-0.13); const gr = g.createRadialGradient(x, y, 0, x, y, L(0.12)); gr.addColorStop(0, `rgba(255,90,110,${a})`); gr.addColorStop(1, 'rgba(255,90,110,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, L(0.13), L(0.08), 0, 0, 7); g.fill(); } };
    const eye = (s, o = {}) => {
      const cx = X(s * ex), cy = Y(ey), w = L(ew * (o.sc || 1)), h = L(eh * (o.sc || 1));
      g.save(); g.beginPath(); g.ellipse(cx, cy, w, h, 0, 0, 7); g.clip();
      const sg = g.createRadialGradient(cx, cy + h * 0.3, h * 0.1, cx, cy, h * 1.1); sg.addColorStop(0, '#ffffff'); sg.addColorStop(0.7, '#f3f1f7'); sg.addColorStop(1, '#c8c2da');
      g.fillStyle = sg; g.fillRect(cx - w * 2, cy - h * 2, w * 4, h * 4);
      const pr = o.pr || 0.78, px = cx + (o.px || 0) * w, py = cy + (o.py !== undefined ? o.py : -ly * 0.25) * h + h * 0.06, ir = w * pr;
      const ig = g.createRadialGradient(px, py + ir * 0.35, ir * 0.1, px, py, ir); ig.addColorStop(0, Char.shade(iris, 0.6)); ig.addColorStop(0.55, iris); ig.addColorStop(0.9, Char.shade(iris, -0.45)); ig.addColorStop(1, Char.shade(iris, -0.7));
      g.fillStyle = ig; g.beginPath(); g.ellipse(px, py, ir, ir * 1.25, 0, 0, 7); g.fill();
      g.fillStyle = '#120604'; g.beginPath(); g.ellipse(px, py, ir * (o.pupil || 0.5), ir * (o.pupil || 0.5) * 1.25, 0, 0, 7); g.fill();
      g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(px - ir * 0.35, py - ir * 0.5, ir * 0.36, ir * 0.42, -0.4, 0, 7); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.85)'; g.beginPath(); g.arc(px + ir * 0.38, py + ir * 0.5, ir * 0.15, 0, 7); g.fill();
      if (o.lid) { const lyy = cy - h + h * 2 * o.lid; g.fillStyle = '#ffb877'; g.fillRect(cx - w * 2, cy - h * 2, w * 4, lyy - (cy - h * 2)); g.strokeStyle = ink; g.lineWidth = lw * 1.1; g.beginPath(); g.moveTo(cx - w * 1.2, lyy + (o.tilt || 0) * s * h * 0.4); g.lineTo(cx + w * 1.2, lyy - (o.tilt || 0) * s * h * 0.4); g.stroke(); }
      if (o.lower) { const lyy = cy + h - h * 2 * o.lower; g.fillStyle = '#ffb877'; g.fillRect(cx - w * 2, lyy, w * 4, h * 2); }
      g.restore();
      g.strokeStyle = ink; g.lineWidth = lw * 0.7; g.beginPath(); g.ellipse(cx, cy, w, h, 0, 0, 7); g.stroke();
      if (!o.lid) { g.lineWidth = lw * 1.25; g.beginPath(); g.ellipse(cx, cy, w, h, 0, Math.PI * 1.08, Math.PI * 1.92); g.stroke(); // upper lash line
        g.beginPath(); g.moveTo(cx + s * w * 0.82, cy - h * 0.6); g.lineTo(cx + s * w * 1.22, cy - h * 0.86); g.stroke(); }
    };
    const closed = (s, up = true) => { const cx = X(s * ex), cy = Y(ey); g.strokeStyle = ink; g.lineWidth = lw * 1.25; g.beginPath(); if (up) g.arc(cx, cy + L(0.05), L(0.085), Math.PI * 1.15, Math.PI * 1.85); else g.arc(cx, cy - L(0.04), L(0.085), Math.PI * 0.15, Math.PI * 0.85); g.stroke(); };
    const squeeze = s => { const cx = X(s * ex), cy = Y(ey); g.strokeStyle = ink; g.lineWidth = lw * 1.25; g.beginPath(); g.moveTo(cx - s * L(0.08), cy - L(0.07)); g.lineTo(cx + s * L(0.06), cy); g.lineTo(cx - s * L(0.08), cy + L(0.07)); g.stroke(); };
    const xeye = s => { const cx = X(s * ex), cy = Y(ey), d = L(0.07); g.strokeStyle = ink; g.lineWidth = lw * 1.3; g.beginPath(); g.moveTo(cx - d, cy - d); g.lineTo(cx + d, cy + d); g.moveTo(cx + d, cy - d); g.lineTo(cx - d, cy + d); g.stroke(); };
    const spiral = s => { const cx = X(s * ex), cy = Y(ey); g.strokeStyle = ink; g.lineWidth = lw; g.beginPath(); for (let a = 0; a < 14; a += 0.2) { const rr = L(0.008 * a); const aa = a + anim * s; g.lineTo(cx + Math.cos(aa) * rr, cy + Math.sin(aa) * rr); } g.stroke(); };
    const star = (s, col = '#ffd34d') => { const cx = X(s * ex), cy = Y(ey), R = L(0.11 + (anim % 2) * 0.01); g.fillStyle = col; g.strokeStyle = '#c98a10'; g.lineWidth = lw * 0.6; g.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? R * 0.45 : R; g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#fff'; g.beginPath(); g.arc(cx - R * 0.2, cy - R * 0.25, R * 0.15, 0, 7); g.fill(); };
    const heart = s => { const cx = X(s * ex), cy = Y(ey), R = L(0.1 + (anim % 2) * 0.012); g.fillStyle = '#ff3d6e'; g.strokeStyle = '#a0103a'; g.lineWidth = lw * 0.6; g.beginPath(); g.moveTo(cx, cy + R * 0.9); g.bezierCurveTo(cx - R * 1.4, cy - R * 0.1, cx - R * 0.7, cy - R * 1.2, cx, cy - R * 0.45); g.bezierCurveTo(cx + R * 0.7, cy - R * 1.2, cx + R * 1.4, cy - R * 0.1, cx, cy + R * 0.9); g.fill(); g.stroke(); g.fillStyle = 'rgba(255,255,255,0.8)'; g.beginPath(); g.arc(cx - R * 0.45, cy - R * 0.4, R * 0.18, 0, 7); g.fill(); };
    const brow = (a, dy = 0, inner = 0) => { for (const s of [-1, 1]) { const cx = X(s * ex), cy = Y(ey + eh + 0.07 + dy); g.strokeStyle = ink; g.lineWidth = lw * 1.4; g.beginPath(); g.moveTo(cx - s * L(0.085), cy - s * 0 + L(a * 0.05) + L(inner)); g.lineTo(cx + s * L(0.085), cy - L(a * 0.05)); g.stroke(); } };
    // brow(a): a>0 = angry (inner ends down), a<0 = worried (inner ends up)
    const mouth = (type, o = {}) => {
      const cx = X(o.dx || 0), cy = Y(my), w = L(o.w || 0.12);
      g.strokeStyle = ink; g.lineWidth = lw * 1.1;
      if (type === 'smile') { g.beginPath(); g.arc(cx, cy - L(0.05), w, Math.PI * 0.2, Math.PI * 0.8); g.stroke(); }
      if (type === 'flat') { g.beginPath(); g.moveTo(cx - w * 0.6, cy); g.lineTo(cx + w * 0.6, cy); g.stroke(); }
      if (type === 'frown') { g.beginPath(); g.arc(cx, cy + L(0.07), w * 0.8, Math.PI * 1.22, Math.PI * 1.78); g.stroke(); }
      if (type === 'smirk') { g.beginPath(); g.moveTo(cx - w * 0.6, cy + L(0.005)); g.quadraticCurveTo(cx + w * 0.2, cy + L(0.03), cx + w * 0.75, cy - L(0.035)); g.stroke(); }
      if (type === 'wavy') { g.beginPath(); for (let k = 0; k <= 12; k++) { const x = cx - w * 0.75 + k * w * 1.5 / 12; g.lineTo(x, cy + Math.sin(k * 1.3 + anim) * L(0.014)); } g.stroke(); }
      if (type === 'o') { const rr = L(o.r || 0.045); g.fillStyle = '#5a1410'; g.beginPath(); g.ellipse(cx, cy, rr * 0.85, rr * 1.15, 0, 0, 7); g.fill(); g.stroke(); }
      if (type === 'open' || type === 'grin' || type === 'teeth' || type === 'wail') {
        const hh = L(o.h || 0.11) * (type === 'open' && o.bob ? 0.85 + 0.15 * Math.sin(anim) : 1);
        g.save(); g.beginPath();
        if (type === 'wail') { g.ellipse(cx, cy, w * 0.8, hh * 0.8, 0, 0, 7); }
        else if (type === 'teeth') { g.moveTo(cx - w, cy - hh * 0.25); g.quadraticCurveTo(cx, cy - hh * 0.05, cx + w, cy - hh * 0.25); g.quadraticCurveTo(cx, cy + hh * 0.9, cx - w, cy - hh * 0.25); }
        else { g.moveTo(cx - w, cy - hh * 0.35); g.quadraticCurveTo(cx, cy - hh * 0.12, cx + w, cy - hh * 0.35); g.quadraticCurveTo(cx + w * 0.9, cy + hh, cx, cy + hh); g.quadraticCurveTo(cx - w * 0.9, cy + hh, cx - w, cy - hh * 0.35); }
        g.closePath(); g.fillStyle = '#6e1a18'; g.fill(); g.clip();
        if (type === 'teeth') { g.fillStyle = '#ffffff'; g.fillRect(cx - w, cy - hh * 0.4, w * 2, hh * 0.36); g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = lw * 0.4; for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(cx + k * w * 0.3, cy - hh * 0.4); g.lineTo(cx + k * w * 0.3, cy + hh * 0.2); g.stroke(); } }
        else { g.fillStyle = '#ffffff'; g.fillRect(cx - w, cy - hh * 0.5, w * 2, hh * 0.26); g.fillStyle = '#ff6f7a'; g.beginPath(); g.ellipse(cx, cy + hh * 0.85, w * 0.6, hh * 0.45, 0, 0, 7); g.fill(); }
        g.restore(); g.strokeStyle = ink; g.lineWidth = lw; g.stroke();
      }
    };
    const tears = () => { for (const s of [-1, 1]) { const cx = X(s * (ex + 0.02)), cy = Y(ey - eh * 0.6); const gr = g.createLinearGradient(0, cy, 0, cy + L(0.4)); gr.addColorStop(0, 'rgba(120,200,255,0.95)'); gr.addColorStop(1, 'rgba(120,200,255,0.2)'); g.fillStyle = gr; g.beginPath(); g.moveTo(cx - L(0.03), cy); g.quadraticCurveTo(cx - L(0.045) + Math.sin(anim) * L(0.01), cy + L(0.2), cx - L(0.02), cy + L(0.42)); g.lineTo(cx + L(0.03), cy + L(0.42)); g.quadraticCurveTo(cx + L(0.04), cy + L(0.2), cx + L(0.03), cy); g.closePath(); g.fill(); } };
    const both = (fn, ...a) => { fn(-1, ...a); fn(1, ...a); };
    const B = blink;
    switch (mood) {
      case 'cheer': case 'laugh': both(closed, true); blush(0.7); mouth('open', { w: 0.13, h: 0.13, bob: true }); break;
      case 'starry': both(star); blush(0.6); mouth('open', { w: 0.12, h: 0.12, bob: true }); break;
      case 'love': both(heart); blush(0.8); mouth('smile', { w: 0.1 }); break;
      case 'proud': both(eye, { lid: 0.38 }); brow(-0.3, 0.02); blush(0.5); mouth('smirk', { w: 0.12 }); break;
      case 'smug': both(eye, { lid: 0.45, px: 0.2 }); brow(0.3); mouth('smirk', { w: 0.12 }); break;
      case 'stoic': both(eye, { lid: 0.32 }); brow(0.15); mouth('flat', { w: 0.1 }); break;
      case 'grim': both(eye, { lid: 0.3, pr: 0.7 }); brow(0.7); mouth('frown', { w: 0.1 }); break;
      case 'angry': both(eye, { lid: 0.35, tilt: 1, pr: 0.62 }); brow(1.1, -0.03); mouth('teeth', { w: 0.11, h: 0.09 }); break;
      case 'effort': both(squeeze); brow(0.9, -0.02); mouth('teeth', { w: 0.12, h: 0.08 }); break;
      case 'evil': both(eye, { lid: 0.42, tilt: 1, pr: 0.6 }); brow(1, -0.02); mouth('teeth', { w: 0.15, h: 0.12 }); break;
      case 'determined': if (B) both(closed, false); else both(eye, { lid: 0.2, tilt: 0.6 }); brow(0.6); mouth('smirk', { w: 0.1 }); break;
      case 'scared': case 'nervous': both(eye, { pr: 0.45, pupil: 0.55, px: (anim % 2 ? 0.1 : -0.1) }); brow(-1, 0.03); mouth('wavy', { w: 0.12 }); break;
      case 'shock': both(eye, { sc: 1.15, pr: 0.38, pupil: 0.6 }); brow(-0.8, 0.06); mouth('o', { r: 0.06 }); break;
      case 'sad': both(eye, { lid: 0.18, py: 0.25 }); brow(-1); mouth('frown', { w: 0.11 }); break;
      case 'cry': both(closed, false); brow(-1); tears(); mouth('wail', { w: 0.1, h: 0.1 }); break;
      case 'hurt': both(squeeze); brow(-0.6); mouth('wavy', { w: 0.13 }); break;
      case 'dizzy': both(spiral); mouth('wavy', { w: 0.12 }); break;
      case 'out': both(xeye); mouth('o', { r: 0.04 }); break;
      case 'sick': both(eye, { lid: 0.45, pr: 0.6 }); brow(-0.4); mouth('wavy', { w: 0.1 }); break;
      case 'sleepy': both(closed, false); mouth('o', { r: 0.03 }); break;
      case 'neutral': if (B) both(closed, false); else both(eye); mouth('flat', { w: 0.08 }); blush(0.35); break;
      default: if (B) both(closed, false); else both(eye); blush(0.5); mouth('open', { w: 0.1, h: 0.085 }); break; // happy
    }
  },

  // ------------------------------------------------------------------ pose + render
  // dir in the old side-view convention (deg: 0 back, 90 down, 180 forward, -90 up) -> 3D unit vector (front = +z)
  dirVec(d, lat) { const a = d * Math.PI / 180; return new THREE.Vector3(lat * 0.35, -Math.sin(a), -Math.cos(a)).normalize(); },
  placeHand(H, P, side, near, open) {
    // P: side-view hand position in head radii from the torso centre (x < 0 = in front); h = 0.7
    const h = this.HR, fwd = -P.x, up = -P.y;
    let lat = 0.78 - 0.5 * Math.max(0, fwd - 0.55);
    let z = Math.max(-0.75, Math.min(0.95, fwd * h * 0.8));
    if (up > 0.3) { lat = Math.max(lat, 1.02 + Math.min(0.25, (up - 0.3) * 0.2)); z = Math.min(z, 0.22); } // raised hands go out to the sides, never over the face
    if (fwd > 0.55 && up <= 0.3 && up > -0.5) lat = Math.max(0.3, lat);
    H.g.position.set(side * lat * h, this.TORSO_Y + up * h, z);
    const v = this.dirVec(P.d, side);
    H.g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v);
    H.g.scale.setScalar(near ? 1 : 0.94);
    H.fingers.scale.set(open ? 1.2 : 1.05, open ? 1.45 : 0.95, open ? 0.55 : 0.85); H.fingers.position.set(0, open ? 0.15 : 0.11, open ? 0 : 0.03);
    H.thumb.position.set(side * 0.13, open ? 0.05 : 0.02, 0.05); H.thumb.rotation.z = -side * (open ? 0.9 : 0.5);
  },

  draw(g, r0, el, A) {
    const headOnly = !!A.headOnly, r = headOnly ? r0 / this.HR : r0; // head-only icons: the head fills radius r0, centred on the origin
    if (headOnly) { g.save(); g.translate(0, this.HEAD_Y * r); const ok = this.drawBody(g, r, el, A); g.restore(); return ok; }
    return this.drawBody(g, r, el, A);
  },
  drawBody(g, r, el, A) {
    if (Settings.flat3d || this.q === 0) return false;
    if (!this.ready && !this.init()) return false;
    const m = this.models[el]; if (!m) return false;
    const tr = g.getTransform(), scale = Math.hypot(tr.a, tr.b) || 1;
    const px = Math.max(16, Math.min(512, Math.ceil(this.BOX * r * scale * (this.q >= 2 ? 1 : 0.7))));
    const { o, t, seed, walk, out, squash, face, idle, mood, faceMood } = A;
    // re-use a recent render of the same character in the same state (renders at ~30 fps, smaller ones less often)
    const hk = o.hands ? ['n', 'f'].map(k => o.hands[k] ? [o.hands[k].x, o.hands[k].y, o.hands[k].d / 30].map(v => Math.round(v * 20)).join(',') : '').join(';') : '';
    const ckey = `${A.headOnly ? 'H' : ''}${el}|${px}|${mood}|${faceMood}|${walk > 0.1 ? 1 : 0}|${face}|${seed}|${o.noFeet ? 1 : 0}|${o.noArms ? 1 : 0}|${idle.pose || ''}|${Math.round(squash * 40)}|${hk}|${o.look ? Math.round(o.look.y * 4) : 0}`;
    const half0 = this.BOX * r / 2;
    const hit = this.imgCache.get(ckey), quantum = px > 140 ? 1 / 30 : px > 70 ? 1 / 22 : 1 / 15;
    if (hit && Math.abs(t - hit.t) < quantum && !idle.pose) { g.drawImage(hit.cv, 0, 0, px, px, -half0, -half0 + this.CY * r, half0 * 2, half0 * 2); return true; }
    if (this.budget > 60) return false;
    this.budget++;
    const HR = this.HR;
    // ---- pose
    let yaw = face * 0.62;
    if (idle.pose === 'spin') yaw += idle.pp * Math.PI * 2;
    if (out) yaw = face * 0.35;
    m.body.rotation.set(0, yaw, 0);
    const lookY = o.look ? Math.max(-1, Math.min(1, o.look.y)) : 0;
    m.head.rotation.set(lookY * 0.18 + (mood === 'sad' || mood === 'cry' || mood === 'sleepy' ? 0.18 : 0), 0, (mood === 'dizzy' ? Math.sin(t * 6) * 0.12 : 0) + (mood === 'proud' ? -0.08 * face : 0));
    m.head.scale.set(1 / Math.sqrt(squash), squash, 1 / Math.sqrt(squash));
    const sq = 1 + (squash - 1) * 0.5; m.torso.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq));
    m.torso.rotation.set(walk > 0.1 ? 0.08 : 0, walk > 0.1 ? Math.sin(t * 14 + seed) * 0.12 : 0, 0);
    // skin tint for strong moods
    const tint = { angry: '#ff7a64', sick: '#c8e08a', evil: '#e0a0d0' }[mood];
    m.skin.color.copy(m.baseSkin); if (tint) m.skin.color.lerp(new THREE.Color(tint), 0.4);
    // face
    m.faceMat.map = this.faceTex(el, faceMood, t, seed, lookY); m.faceMat.needsUpdate = m.faceMat._lastMap !== m.faceMat.map; m.faceMat._lastMap = m.faceMat.map;
    // headwrap life
    const an = m.anim;
    an.tails.forEach((tl, k) => { tl.rotation.x = -0.5 + Math.sin(t * 4.5 + seed + k * 1.3) * 0.18 - (walk > 0.1 ? 0.3 : 0); });
    if (an.spin) an.spin.rotation.y = t * 9 + seed;
    if (an.drop) { const s = 1 + Math.sin(t * 5 + seed) * 0.05; an.drop.scale.set(1 / Math.sqrt(s), s, 1 / Math.sqrt(s)); }
    if (an.flames) an.flames.forEach((f, k) => { const s = 1 + 0.18 * Math.sin(t * 10 + k * 2 + seed); f.scale.y = (k === 2 ? 1.2 : 0.85) * s; f.rotation.z = Math.sin(t * 7 + k) * 0.12; });
    if (an.leaves) an.leaves.forEach((lf, k) => { lf.rotation.z = (k ? 0.9 : -0.9) + Math.sin(t * 2.5 + seed) * 0.2; });
    if (m.cape) m.cape.rotation.x = -0.08 - Math.sin(t * 3 + seed) * 0.05 - (walk > 0.1 ? 0.25 : 0);
    // hands
    const P = o.noArms ? null : (o.hands || Char.handPose(faceMood, t, seed, walk, idle));
    const sideN = face < 0 ? 1 : -1; // the hand nearer the camera
    m.hands[0].g.visible = m.hands[1].g.visible = !!P;
    if (P) {
      this.placeHand(m.hands[0], P.n, sideN, true, P.n.o);
      this.placeHand(m.hands[1], P.f, -sideN, false, P.f.o);
    }
    // feet
    const showFeet = !o.noFeet;
    m.feet[0].visible = m.feet[1].visible = showFeet;
    if (showFeet) {
      const F = o.feet || Char.footPose(t, seed, walk, out, mood);
      for (const [k, side] of [[0, sideN], [1, -sideN]]) {
        const f = m.feet[k]; f.position.set(side * 0.25, this.GROUND + F[k].lift * HR, -F[k].x * HR * 0.9 - 0.02);
        f.rotation.set(F[k].tip || 0, side * 0.12, 0);
        if (out) f.rotation.x = -0.4;
      }
    }
    m.torso.visible = !A.headOnly;
    if (A.headOnly) { m.hands[0].g.visible = m.hands[1].g.visible = m.feet[0].visible = m.feet[1].visible = false; }
    m.root.visible = true;
    // ---- render into the bottom-left px*px corner and paste it
    const R = this.R;
    R.setViewport(0, 0, px, px); R.setScissor(0, 0, px, px);
    this.key.shadow.needsUpdate = true;
    R.render(this.scene, this.cam);
    m.root.visible = false;
    const half = this.BOX * r / 2;
    // keep a copy for the next frame or two, then paste
    let ent = this.imgCache.get(ckey);
    if (!ent) { ent = { cv: document.createElement('canvas'), t }; ent.cv.width = ent.cv.height = px; this.imgCache.set(ckey, ent); if (this.imgCache.size > 64) this.imgCache.delete(this.imgCache.keys().next().value); }
    ent.t = t; const cg = ent.cv.getContext('2d'); cg.clearRect(0, 0, px, px); cg.drawImage(this.cv, 0, this.SZ - px, px, px, 0, 0, px, px);
    g.drawImage(ent.cv, 0, 0, px, px, -half, -half + this.CY * r, half * 2, half * 2);
    return true;
  },
};
