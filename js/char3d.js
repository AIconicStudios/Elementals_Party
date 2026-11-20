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
  // dark cartoon outline (inverted hull), like the original line art
  outline(mesh, col, k) { const o = new THREE.Mesh(mesh.geometry, new THREE.MeshBasicMaterial({ color: new THREE.Color(col), side: THREE.BackSide })); o.scale.setScalar(k); o.userData.outline = true; mesh.add(o); return o; },
  // UVs projected along x (from the side): canvas x = front-to-back (front on the left), canvas y = up/down
  sideUV(geo, spanZ, spanY) { const p = geo.attributes.position, uv = geo.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, 0.5 - p.getZ(i) / spanZ, 0.5 + p.getY(i) / spanY); uv.needsUpdate = true; return geo; },
  OUT_R: 342, // px size of the head radius the outfit is painted at (outfit width 0.68 of it spans the canvas)
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
    // ---- head: the original side-profile face and headwrap are painted onto the 3D head
    // (projected from the side, so in profile it reads exactly like the 2D drawing, now round and lit)
    const head = new THREE.Group(); head.position.y = this.HEAD_Y; body.add(head);
    const skin = this.mat('#ffc88e', { roughness: 0.45, clearcoat: 0.35, clearcoatRoughness: 0.35, sheen: 0.4, sheenRoughness: 0.5, sheenColor: new THREE.Color('#ffd9b0'), emissive: new THREE.Color('#ff5a2a'), emissiveIntensity: 0.05 });
    const skull = this.mesh(this.sphere(HR, 64, 48), skin); head.add(skull); this.outline(skull, SKIN.line, 1.035);
    const nose = this.mesh(this.sphere(HR * 0.17, 24, 18), skin); nose.position.set(0, -HR * 0.02, HR * 0.95); head.add(nose); this.outline(nose, SKIN.line, 1.13);
    const fg = this.sideUV(new THREE.SphereGeometry(HR * 1.004, 64, 48), HR * 2.16, HR * 2.16);
    const faceMat = this.mat('#ffffff', { transparent: true, roughness: 0.5, clearcoat: 0.35, clearcoatRoughness: 0.3, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
    const faceShell = this.mesh(fg, faceMat, false, true); faceShell.renderOrder = 2; head.add(faceShell);
    // rolled hem of the wrap: a ring hugging the head along the painted edge (front higher than the back)
    const cap = new THREE.Group(); head.add(cap);
    const hemG = new THREE.Group(); hemG.position.set(0, 0.414 * HR, -0.05 * HR); hemG.rotation.x = -0.1194; cap.add(hemG);
    const hem = this.mesh(new THREE.TorusGeometry(HR * 0.925, HR * 0.055, 14, 72), this.cloth(C.hem, { roughness: 0.6 })); hem.rotation.x = Math.PI / 2; hemG.add(hem); this.outline(hem, Char.shade(C.hem, -0.45), 1.012);
    // knot and tails at the back
    const knot = new THREE.Group(); knot.position.set(0, HR * 0.37, -HR * 0.9); cap.add(knot);
    const knotMat = this.cloth(Char.shade(C.wrap, -0.1));
    const kb = this.mesh(this.sphere(HR * 0.11, 20, 14), knotMat); kb.scale.set(0.8, 1, 1.2); knot.add(kb); this.outline(kb, Char.shade(C.wrap, -0.45), 1.12);
    const tails = [];
    for (let k = 0; k < 2; k++) {
      const tl = new THREE.Group(); const m = this.mesh(this.sphere(HR * 0.1, 20, 12), knotMat); m.scale.set(0.35, 0.55, k ? 2.0 : 2.4); m.position.z = -HR * (k ? 0.19 : 0.23); tl.add(m); this.outline(m, Char.shade(C.wrap, -0.45), 1.1);
      tl.rotation.x = 0.35 + k * 0.55; knot.add(tl); tails.push(tl);
    }
    const orn = new THREE.Group(); orn.position.set(0, HR * 0.9, -HR * 0.42); orn.rotation.x = -0.35; cap.add(orn);
    const anim = { tails, orn, el };
    this.ornament(el, orn, anim, HR);
    // ---- torso: the original outfit painted on, seen from the side
    const torso = new THREE.Group(); torso.position.y = this.TORSO_Y; body.add(torso);
    const outTex = this.canvasTex(512, 512, g => { g.fillStyle = O.top; g.fillRect(0, 0, 512, 512); g.translate(256, 256); g.scale(1.12, 1.12); Char.outfit(g, this.OUT_R, el); }); // painted a bit larger so its outline stroke falls outside the body
    const tmesh = this.mesh(this.sideUV(this.sphere(1, 48, 32), 512 / (this.OUT_R * 0.68), 512 / (this.OUT_R * 0.6)), this.cloth('#ffffff', { map: outTex }));
    tmesh.scale.set(0.42, 0.42, 0.476); torso.add(tmesh); this.outline(tmesh, Char.shade(O.top, -0.6), 1.05);
    if (el === 1) { // neckerchief under the chin
      const tie = this.mesh(new THREE.ConeGeometry(0.09, 0.2, 3), this.cloth(O.tie)); tie.position.set(0, 0.2, 0.34); tie.rotation.set(Math.PI + 0.35, 0, 0); tie.scale.set(1.3, 1, 0.45); torso.add(tie); this.outline(tie, '#2a6fb0', 1.1);
      const tk = this.mesh(this.sphere(0.05, 16, 12), this.cloth(O.tie)); tk.position.set(0, 0.29, 0.36); torso.add(tk);
    }
    let cape = null;
    if (el === 0) { // the little sky cape at the back
      const cg = new THREE.CylinderGeometry(0.36, 0.56, 0.56, 24, 6, true, Math.PI * 0.64, Math.PI * 0.72);
      cape = this.mesh(cg, this.cloth('#f4f9ff', { side: THREE.DoubleSide })); cape.position.set(0, 0.0, -0.05); torso.add(cape); this.outline(cape, '#8fa6bf', 1.03);
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
    const palm = this.mesh(this.sphere(0.15, 28, 20), mat); palm.scale.set(1, 1.05, 0.82); hand.add(palm); this.outline(palm, Char.shade('#' + mat.color.getHexString(), -0.65), 1.12);
    const fingers = this.mesh(this.sphere(0.12, 24, 16), mat); fingers.position.set(0, 0.11, 0.02); fingers.scale.set(1.05, 0.95, 0.85); hand.add(fingers); this.outline(fingers, Char.shade('#' + mat.color.getHexString(), -0.65), 1.12);
    const thumb = this.mesh(this.sphere(0.055, 18, 12), mat); thumb.scale.set(1, 1.5, 1); thumb.position.set(0.13, 0.03, 0.05); thumb.rotation.z = -0.5; hand.add(thumb);
    const cuff = this.mesh(new THREE.TorusGeometry(0.11, 0.045, 12, 28), cuffMat); cuff.rotation.x = Math.PI / 2; cuff.position.y = -0.15; hand.add(cuff);
    const cuffIn = this.mesh(new THREE.CylinderGeometry(0.115, 0.1, 0.06, 24), cuffMat); cuffIn.position.y = -0.16; hand.add(cuffIn);
    return { g, hand, fingers, thumb };
  },
  shoe(mat, soleMat, laceMat, boot) {
    const s = new THREE.Group();
    const up = this.mesh(this.sphere(0.15, 32, 20), mat); up.scale.set(0.95, 0.78, 1.45); up.position.set(0, 0.11, 0.04); s.add(up); this.outline(up, Char.shade('#' + mat.color.getHexString(), -0.6), 1.08);
    const sole = this.mesh(this.sphere(0.16, 32, 16), soleMat); sole.scale.set(0.98, 0.32, 1.5); sole.position.set(0, 0.045, 0.04); s.add(sole); this.outline(sole, Char.shade('#' + soleMat.color.getHexString(), -0.5), 1.08);
    if (boot) { const c = this.mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.16, 24), mat); c.position.set(0, 0.22, -0.03); s.add(c); const rim = this.mesh(new THREE.TorusGeometry(0.11, 0.025, 10, 24), laceMat); rim.rotation.x = Math.PI / 2; rim.position.set(0, 0.3, -0.03); s.add(rim); }
    else { for (let k = 0; k < 2; k++) { const l = this.mesh(new THREE.CapsuleGeometry(0.014, 0.1, 4, 8), laceMat); l.rotation.z = Math.PI / 2; l.position.set(0, 0.215 - k * 0.025, 0.08 + k * 0.05); l.rotation.x = 0.5; s.add(l); } }
    return s;
  },

  // ------------------------------------------------------------------ head texture: original headwrap + original face
  CALM: { happy: 1, neutral: 1, determined: 1, sleepy: 1, stoic: 1, grim: 1, smug: 1, proud: 1, sad: 1 },
  faceTex(el, mood, t, seed, ly) {
    const calm = this.CALM[mood], blink = ((t + seed * 1.7) % 3.6) < 0.12;
    const frame = calm ? 0 : Math.floor(t * 10) % 72;
    const key = `${el}|${mood}|${calm ? (blink ? 'b' : 'o') : frame}|${Math.round(ly * 3)}`;
    let tex = this.faceCache.get(key);
    if (tex) { this.faceCache.delete(key); this.faceCache.set(key, tex); return tex; }
    const tp = calm ? 36 - seed * 1.7 + (blink ? 0.05 : 1.5) : frame / 10; // a time that reproduces this blink / frame
    tex = this.canvasTex(512, 512, g => this.paintHead(g, el, mood, tp, seed, Math.round(ly * 3) / 3));
    this.faceCache.set(key, tex);
    if (this.faceCache.size > 140) { const k0 = this.faceCache.keys().next().value; this.faceCache.get(k0).dispose(); this.faceCache.delete(k0); }
    return tex;
  },
  // canvas = side view of the head, centre = head centre, head radius = 512 / 2.16 px; facing left like the 2D art
  paintHead(g, el, mood, t, seed, ly) {
    const r = 512 / 2.16, C = CLAN[el];
    g.save(); g.translate(256, 256);
    g.lineCap = 'round'; g.lineJoin = 'round';
    // ---- headwrap fabric above the hem line (same patterns as the 2D wrap)
    if (C.pattern !== 'none') {
      const edge = x => -r * 0.42 + x * 0.12;
      const wrapPath = () => { g.beginPath(); g.moveTo(-r * 1.1, edge(-r * 1.1)); g.lineTo(r * 1.1, edge(r * 1.1)); g.lineTo(r * 1.1, -r * 1.2); g.lineTo(-r * 1.1, -r * 1.2); g.closePath(); };
      g.save();
      g.strokeStyle = 'rgba(120,40,10,0.22)'; g.lineWidth = r * 0.14; g.beginPath(); g.moveTo(-r * 1.1, edge(-r * 1.1) + r * 0.08); g.lineTo(r * 1.1, edge(r * 1.1) + r * 0.08); g.stroke(); // its soft shadow on the forehead
      g.fillStyle = C.wrap; wrapPath(); g.fill(); wrapPath(); g.clip();
      g.lineWidth = r * 0.06;
      if (C.pattern === 'wave') { g.strokeStyle = C.wrap2; for (let k = -5; k <= 5; k++) { g.beginPath(); g.arc(k * r * 0.28, -r * 0.62, r * 0.12, Math.PI, Math.PI * 1.9); g.stroke(); } }
      else if (C.pattern === 'flame') { for (let k = -4; k <= 4; k++) { const fx = k * r * 0.26, h = r * (0.22 + 0.06 * ((k * 7) % 3)); g.fillStyle = k % 2 ? C.wrap2 : '#ff8a2a'; g.beginPath(); g.moveTo(fx - r * 0.11, edge(fx) + r * 0.02); g.quadraticCurveTo(fx, edge(fx) - h * 1.7, fx + r * 0.11, edge(fx) + r * 0.02); g.fill(); } }
      else if (C.pattern === 'leaf') {
        g.strokeStyle = '#4a2c14'; g.beginPath(); g.moveTo(-r, -r * 0.66); g.quadraticCurveTo(0, -r * 0.78, r, -r * 0.6); g.stroke();
        g.fillStyle = C.wrap2; for (let k = -3; k <= 3; k++) { g.save(); g.translate(k * r * 0.3, -r * 0.7 + (k % 2) * r * 0.08); g.rotate(k * 0.7); g.beginPath(); g.ellipse(0, 0, r * 0.1, r * 0.05, 0, 0, 7); g.fill(); g.restore(); }
        g.fillStyle = '#4a2c14'; for (let k = -3; k <= 3; k++) { g.beginPath(); g.arc(k * r * 0.33 + r * 0.12, -r * 0.86, r * 0.03, 0, 7); g.fill(); }
      } else if (C.pattern === 'swirl') { g.strokeStyle = C.wrap2; for (let k = -2; k <= 2; k++) { g.beginPath(); g.arc(k * r * 0.45, -r * 0.7, r * 0.13, 0, Math.PI * 1.5); g.stroke(); } }
      g.restore();
    }
    // ---- the face itself, drawn by the original 2D face code (every mood, blink and expression)
    Char._el = el;
    Char.face(g, r, mood, ly, t, seed, SKIN);
    g.restore();
  },

  // ------------------------------------------------------------------ pose + render
  // dir in the old side-view convention (deg: 0 back, 90 down, 180 forward, -90 up) -> 3D unit vector (front = +z)
  dirVec(d, lat) { const a = d * Math.PI / 180; return new THREE.Vector3(lat * 0.35, -Math.sin(a), -Math.cos(a)).normalize(); },
  placeHand(H, P, side, near, open) {
    // P: side-view hand position in head radii from the torso centre (x < 0 = in front), exactly as in the 2D poses
    const h = this.HR, raised = P.y < -0.6;
    H.g.position.set(side * (raised ? 0.56 : 0.5), this.TORSO_Y - P.y * h, Math.max(-1.15, Math.min(1.15, -P.x * h)));
    const v = this.dirVec(P.d, side * 0.5);
    H.g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v);
    H.g.scale.setScalar(near ? 1 : 0.9);
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
    let yaw = face * 1.2; // near profile, like the original art, turned a touch toward the camera
    if (idle.pose === 'spin') yaw += idle.pp * Math.PI * 2;
    if (out) yaw = face * 1.0;
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
        const f = m.feet[k]; f.position.set(side * 0.2, this.GROUND + F[k].lift * HR, -F[k].x * HR);
        f.rotation.set(F[k].tip || 0, 0, 0);
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
