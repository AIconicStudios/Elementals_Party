'use strict';
// The Fourfold clan characters: round peach heroes in side profile, with an element
// headwrap, floating gloves and shoes, moods, blinking, bobbing and walking.
// Char.draw(g, x, y, r, el, color, opts)
//   x,y = centre of the body; r = body radius; el = 0 Air, 1 Water, 2 Fire, 3 Earth (-1 = generic)
//   opts: mood ('happy'|'neutral'|'determined'|'scared'|'hurt'|'dizzy'|'out'|'cheer'|'sleepy'),
//         look {x,y}, walk (0..1), t, seed, alpha, hat ('helmet'), noFeet, noArms, simple, prop
const CLAN = [
  { wrap: '#e4e9f0', wrap2: '#9fb0c8', hem: '#9fb0c8', pattern: 'swirl', glove: '#f4f6fa', cuff: '#b9c4d4', shoe: '#e8ebf0', sole: '#8a93a3', lace: '#9aa6b8' },             // Air
  { wrap: '#3f7fd8', wrap2: '#ffffff', hem: '#2a5fa8', pattern: 'wave', glove: '#4a8fe0', cuff: '#ffffff', shoe: '#4a8fe0', sole: '#2a5fa8', lace: '#9fd0ff', boot: true },  // Water
  { wrap: '#e8432a', wrap2: '#ffc23a', hem: '#ffc23a', pattern: 'flame', glove: '#e8432a', cuff: '#ffc23a', shoe: '#e0442b', sole: '#ffffff', lace: '#ffd34d' },           // Fire
  { wrap: '#7a4f2a', wrap2: '#6fae3c', hem: '#5a3a1a', pattern: 'leaf', glove: '#4f8a2c', cuff: '#7a4f2a', shoe: '#7a4a24', sole: '#4a2c14', lace: '#c9a36b', boot: true }, // Earth
  { wrap: '#6a6e78', wrap2: '#d0d4dc', hem: '#4a4e58', pattern: 'smoke', orn: 'chimney', glove: '#a0a6b0', cuff: '#4a4e58', shoe: '#5a5e68', sole: '#2a2c32', lace: '#c8ccd6' },              // Wisp (Smoke)
  { wrap: '#4a6a8f', wrap2: '#bfe4ff', hem: '#ffd23a', pattern: 'rain', orn: 'raincloud', glove: '#ffd23a', cuff: '#4a6a8f', shoe: '#ffd23a', sole: '#3f5a7a', lace: '#ffffff', boot: true }, // Mizzle (Rain)
  { wrap: '#8a8478', wrap2: '#4a443a', hem: '#5a5448', pattern: 'crack', orn: 'crystal', glove: '#a89a82', cuff: '#5a4a3a', shoe: '#6a5a48', sole: '#2e2820', lace: '#ffcc40', boot: true },   // Flint (Rock)
  { wrap: '#ff8ab8', wrap2: '#ffffff', hem: '#5fae4a', pattern: 'petal', orn: 'tulip', glove: '#ffd0e2', cuff: '#5fae4a', shoe: '#ff8ab8', sole: '#5fae4a', lace: '#ffffff' },                  // Blossom (Plant)
  { wrap: '#dff4ff', wrap2: '#6ac8f0', hem: '#ffffff', pattern: 'snow', orn: 'icecrystal', glove: '#9fd8ff', cuff: '#ffffff', shoe: '#bfe8ff', sole: '#5f7fa8', lace: '#ffffff', boot: true }, // Frost (Ice)
  { wrap: '#ffd93a', wrap2: '#7a3cc8', hem: '#7a3cc8', pattern: 'zigzag', orn: 'bolt', glove: '#ffe03a', cuff: '#7a3cc8', shoe: '#7a3cc8', sole: '#ffe03a', lace: '#ffffff' },                   // Volt (Lightning)
  { wrap: '#e0c48a', wrap2: '#b08a4a', hem: '#c8a060', pattern: 'dune', orn: 'cactus', glove: '#c8a060', cuff: '#8a6a3a', shoe: '#a07a48', sole: '#5a4024', lace: '#fff1c8', boot: true },    // Dune (Sand)
  { wrap: '#3a2e2c', wrap2: '#ff7a2a', hem: '#ff7a2a', pattern: 'lava', orn: 'lavadrop', glove: '#3a2e2c', cuff: '#ff7a2a', shoe: '#2b2426', sole: '#ff7a2a', lace: '#ffb03a' },              // Cinder (Magma)
  { wrap: '#fffaf0', wrap2: '#ffcf3a', hem: '#ffcf3a', pattern: 'star', orn: 'star', glove: '#ffffff', cuff: '#ffcf3a', shoe: '#fffaf0', sole: '#e0b23a', lace: '#ffcf3a' },                   // Lumi (Light)
  { wrap: '#2a2f6a', wrap2: '#fff3b0', hem: '#c8b8ff', pattern: 'moon', orn: 'moon', glove: '#3a3f80', cuff: '#c8b8ff', shoe: '#1a1d40', sole: '#c8b8ff', lace: '#fff3b0' },                   // Nyx (Night)
  { wrap: '#9aa6b4', wrap2: '#5a6676', hem: '#5a6676', pattern: 'rivet', orn: 'gear', glove: '#ffb03a', cuff: '#5a6676', shoe: '#5a6676', sole: '#2a2e36', lace: '#ffb03a', boot: true },      // Rivet (Metal)
];
// resting / game-face personality per hero: 0 curious, 1 sweet, 2 confident, 3 calm
const PERSONA = [0, 1, 2, 3, 3, 1, 2, 1, 0, 0, 3, 2, 1, 3, 0];
const STOIC = { 3: true, 6: true }; // Pebble and Flint never go bubbly
// personality: how each newer hero shows a feeling
const MOODMAP = {
  4: { cheer: 'smug', laugh: 'evil', starry: 'smug', scared: 'nervous', cry: 'grim' },                 // Wisp: sly and unbothered
  5: { proud: 'cheer', stoic: 'happy', grim: 'sad' },                                                     // Mizzle: bubbly, wears her heart outside
  7: { cheer: 'love', smug: 'proud', angry: 'smug' },                                                     // Blossom: the diva
  8: { cheer: 'proud', laugh: 'smug', scared: 'smug', nervous: 'stoic', shock: 'smug' },                 // Frost: too cool to panic
  9: { cheer: 'starry', proud: 'starry', laugh: 'starry', sad: 'shock' },                                // Volt: hyper
  10: { scared: 'shock', cheer: 'laugh', nervous: 'shock' },                                             // Dune: the jumpy nerd
  11: { cheer: 'evil', laugh: 'evil', scared: 'angry', cry: 'angry', sad: 'grim', love: 'smug' },        // Cinder: badass
  12: { cheer: 'proud', laugh: 'proud', angry: 'stoic' },                                                // Lumi: the wise old wizard
  13: { cheer: 'evil', laugh: 'evil', happy: 'smug', starry: 'evil' },                                   // Nyx: mysterious, mischievous
  14: { cheer: 'laugh', proud: 'laugh' },                                                                 // Rivet: the cheerful tinkerer
};
// what makes each face its own (drawn on the head, facing left; see Char.faceAcc)
const FACEACC = { 4: 'goatee', 5: 'freckles', 6: 'scar', 7: 'diva', 8: 'shades', 9: 'boltpaint', 10: 'glasses', 11: 'skull', 12: 'beard', 13: 'goth', 14: 'goggles' };
const GENERIC = { wrap: '#9aa0ad', wrap2: '#cfd3dc', hem: '#cfd3dc', pattern: 'none', glove: '#cfd3dc', cuff: '#9aa0ad', shoe: '#8a8f99', sole: '#5a5f69', lace: '#cfd3dc' };
const SKIN = { light: '#fff0d6', mid: '#ffc07a', dark: '#f39a4e', rim: '#e07f3a', line: '#8c4520', blush: 'rgba(255,96,110,0.5)', sss: 'rgba(255,90,70,0.2)' };

// Pebble's emotional range: stoic, grim, angry, feisty - never bubbly
const PEBBLE_MOOD = { cheer: 'stoic', laugh: 'stoic', starry: 'stoic', love: 'stoic', proud: 'stoic', evil: 'smug', cry: 'grim', sad: 'grim', scared: 'grim', nervous: 'grim', shock: 'angry' };
const Char = {
  T() { return performance.now() / 1000; },

  draw(g, x, y, r, el, color, o = {}) {
    if (!(r > 0.5)) r = 0.5; // never let an animation shrink a character to zero or below (canvas gradients throw on negative sizes)
    const t = o.t !== undefined ? o.t : this.T();
    const seed = o.seed || 0;
    let mood = o.mood || 'happy';
    // Pebble (Earth) never goes bubbly: wins are a stoic nod, losses turn into a scowl or feisty anger
    if (STOIC[el] && PEBBLE_MOOD[mood]) mood = PEBBLE_MOOD[mood];
    else if (MOODMAP[el] && MOODMAP[el][mood]) mood = MOODMAP[el][mood]; // each hero reacts in character
    const walk = o.walk || 0;
    const out = mood === 'out';
    const C = CLAN[el] || GENERIC;
    const skin = el >= 0 ? SKIN : { light: this.shade(color, 0.5), mid: color, dark: this.shade(color, -0.25), line: this.shade(color, -0.6), blush: 'rgba(255,150,160,0.35)' };
    const face = o.look && o.look.x > 0.25 ? 1 : -1; // -1 faces left (default), 1 faces right
    g.save();
    g.globalAlpha *= o.alpha !== undefined ? o.alpha : 1;
    const bob = out ? 0 : (walk > 0.1 ? Math.abs(Math.sin(t * 14 + seed)) * r * 0.14 : Math.sin(t * 3 + seed) * r * 0.05);
    let squash = out ? 1 : 1 + Math.sin(t * 3 + seed) * 0.025 + (mood === 'cheer' ? Math.sin(t * 12) * 0.06 : 0);
    // ---- clan idle life: each clan stands still differently and strikes a signature pose every few seconds
    const idle = this.idle(r, el, mood, walk, out, t, seed, o);
    squash += idle.sq;
    this._pose = idle.pose; this._pp = idle.pp;
    const faceMood = idle.face || mood;
    this._el = el;
    g.translate(x, y - bob);
    if (out) g.rotate(0.4 * face);
    if (mood === 'hurt') g.translate(Math.sin(t * 50) * r * 0.06, 0);
    if (mood === 'evil' || mood === 'laugh') g.translate(Math.sin(t * 32) * r * 0.035, -Math.abs(Math.sin(t * 11)) * r * 0.1);
    if (mood === 'angry') g.translate(Math.sin(t * 55) * r * 0.045, 0);
    if (mood === 'shock') g.translate(Math.sin(t * 60) * r * 0.02, -r * 0.08);
    if (mood === 'starry') g.translate(0, -Math.abs(Math.sin(t * 6)) * r * 0.12);
    if (mood === 'cry') g.translate(Math.sin(t * 20) * r * 0.015, 0);
    if (mood === 'stoic') { const nk = (t + seed) % 2.6; if (nk < 0.5) g.translate(0, Math.sin(nk / 0.5 * Math.PI) * r * 0.07); }
    const shrink = 1 - Math.min(0.5, idle.lift / (r * 1.6));
    if (!o.noShadow) {
    g.save(); g.translate(0, r * 1.3 + bob); g.scale(1, 0.2);
    const shg = g.createRadialGradient(0, 0, 0, 0, 0, r * 0.95 * shrink);
    shg.addColorStop(0, 'rgba(20,10,30,0.38)'); shg.addColorStop(0.55, 'rgba(20,10,30,0.2)'); shg.addColorStop(1, 'rgba(20,10,30,0)');
    g.fillStyle = shg; g.beginPath(); g.arc(0, 0, r * 0.95 * shrink, 0, 7); g.fill(); g.restore();
    }
    if (idle.pose) this.poseFx(g, r, el, idle.pose, idle.pp, t, true);
    g.translate(0, -idle.lift);
    g.scale(-face * idle.flip, 1); // everything below is drawn facing left
    // full character: head, clan outfit, floating hands and feet (icons and generic folk keep the round head-only look)
    if (el >= 0 && !o.headOnly && !this.headOnly && !(o.simple && o.noArms && o.noFeet)) {
      this.fullBody(g, r, el, C, skin, mood, faceMood, o, t, seed, walk, out, squash, face, idle, color);
      this._pose = null; g.restore();
      if (o.prop) { g.save(); g.font = `${Math.round(r * 0.8)}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(o.prop, x + face * r * 1.15, y - bob + r * 0.55); g.restore(); }
      return;
    }
    if (!o.noFeet) this.shoes(g, r, C, t, seed, walk, out);
    if (!o.noArms) this.glove(g, r, C, faceMood, t, seed, walk, false);
    g.save(); g.scale(1 / Math.sqrt(squash), squash);
    this.body(g, r, skin);
    if (mood === 'angry' || mood === 'sick' || mood === 'evil') { g.save(); g.beginPath(); g.arc(0, 0, r, 0, 7); g.clip(); const tg = g.createLinearGradient(0, -r, 0, r); const c = mood === 'angry' ? '255,40,30' : mood === 'sick' ? '90,200,60' : '120,40,160'; tg.addColorStop(0, `rgba(${c},${mood === 'evil' ? 0.25 : 0.45})`); tg.addColorStop(1, `rgba(${c},0)`); g.fillStyle = tg; g.fillRect(-r, -r, r * 2, r * 2); g.restore(); }
    if (o.hat !== 'helmet') this.wrap(g, r, C, el, t, seed);
    this.face(g, r, faceMood, o.look ? clamp(o.look.y, -1, 1) : 0, t, seed, skin);
    this.faceAcc(g, r, el, faceMood, t, seed);
    if (o.hat === 'helmet') this.helmet(g, r, color);
    if (!o.flat) this.lightPass(g, r, -face * idle.flip);
    g.restore();
    if (!o.noArms) this.glove(g, r, C, faceMood, t, seed, walk, true);
    if (!o.simple) this.flair(g, r, el, t, seed);
    this.moodFx(g, r, faceMood, t, seed);
    if (!o.simple) this.flourish(g, r, el, faceMood, t, seed);
    if (idle.pose) this.poseFx(g, r, el, idle.pose, idle.pp, t, false);
    this._pose = null;
    g.restore();
    if (o.prop) { g.save(); g.font = `${Math.round(r * 0.9)}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(o.prop, x + face * r * 1.2, y - bob + r * 0.1); g.restore(); }
  },

  // ---------------------------------------------------------------- full character (head + outfit + floating limbs)
  // Same footprint as the old round hero: head top at about -r, floating feet on the ground at +1.25r.
  OUTFIT: [
    { top: '#a9dcf4', trim: '#ffffff', bottoms: '#7f8fa8' },                    // Zephi: Sky Scout jacket with a little cape
    { top: '#f6f9ff', trim: '#24468f', bottoms: '#24468f', tie: '#5fb8ff' },   // Drip: sailor suit
    { top: '#d8362a', trim: '#ffc23a', bottoms: '#2b2b38', stripe: '#ffc23a' }, // Pyra: varsity jacket
    { top: '#6cb83c', trim: '#4f8a2c', bottoms: '#7a5230' },                    // Pebble: gardener overalls
    { style: 4, top: '#8a8f9a', trim: '#d0d4dc', bottoms: '#4a4e58' },          // Wisp: smoky hoodie
    { style: 5, top: '#ffd23a', trim: '#e0a800', bottoms: '#3f5a7a' },          // Mizzle: yellow raincoat
    { style: 8, top: '#c8bca8', trim: '#6a5a48', bottoms: '#5a4a3a', stripe: '#ffcc40' }, // Flint: miner's vest
    { style: 9, top: '#ffb3d1', trim: '#ffffff', bottoms: '#5fae4a', dots: '#ffffff' }, // Blossom: flowery smock
    { style: 6, top: '#bfe8ff', trim: '#ffffff', bottoms: '#5f7fa8' },          // Frost: puffy parka
    { style: 2, top: '#7a3cc8', trim: '#ffe03a', bottoms: '#2b2b38', stripe: '#ffe03a', patch: 'bolt' }, // Volt: purple varsity
    { style: 0, top: '#d8b878', trim: '#fff1c8', bottoms: '#8a6a3a', badge: '#c8902a' }, // Dune: explorer khakis
    { style: 4, top: '#2b2426', trim: '#ff7a2a', bottoms: '#3a3036' },          // Cinder: lava hoodie
    { style: 1, top: '#fffaf0', trim: '#e0b23a', bottoms: '#e0b23a', tie: '#ffd34d' }, // Lumi: white-and-gold sailor
    { style: 7, top: '#2a2f6a', trim: '#c8b8ff', bottoms: '#1a1d40' },          // Nyx: starry cloak
    { style: 3, top: '#ff8a3a', trim: '#4f6a8a', bottoms: '#4f6a8a', patch: 'gear' }, // Rivet: mechanic overalls
  ],
  fullBody(g, r, el, C, skin, mood, faceMood, o, t, seed, walk, out, squash, face, idle, color) {
    const h = r * 0.7, hy = -r * 0.32, tx = r * 0.01, ty = hy + h * 1.3, ground = r * 1.25;
    const P = o.noArms ? null : (o.hands || this.handPose(faceMood, t, seed, walk, idle));
    // far hand, then the feet, then the cape (all behind the torso)
    if (P) this.floatHand(g, h, C, tx + P.f.x * h, ty + P.f.y * h, P.f, false, faceMood);
    if (!o.noFeet) {
      const F = o.feet || this.footPose(t, seed, walk, out, mood);
      for (const [k, near] of [[1, false], [0, true]]) {
        const sr = h * 0.82;
        g.save(); g.translate(F[k].x * h, ground - F[k].lift * h - sr * 0.05);
        if (F[k].tip) { g.translate(-sr * 0.06, 0); g.rotate(-F[k].tip); }
        if (out) g.rotate(near ? -0.3 : 0.3);
        this.shoe(g, sr, C, !near); g.restore();
      }
    }
    if (el === 0 || el === 13) this.cape(g, h, tx, ty, t, seed, el === 13 ? ['#3a3f80', '#1a1d40', '#c8b8ff'] : null);
    // torso with the clan outfit (breathes a little)
    const sq = 1 + (squash - 1) * 0.5;
    g.save(); g.translate(tx, ty); g.scale(1 / Math.sqrt(sq), sq); this.outfit(g, h, el); g.restore();
    // head
    g.save(); g.translate(0, hy); g.scale(1 / Math.sqrt(squash), squash);
    this.body(g, h, skin);
    if (mood === 'angry' || mood === 'sick' || mood === 'evil') { g.save(); g.beginPath(); g.arc(0, 0, h, 0, 7); g.clip(); const tg = g.createLinearGradient(0, -h, 0, h); const c = mood === 'angry' ? '255,40,30' : mood === 'sick' ? '90,200,60' : '120,40,160'; tg.addColorStop(0, `rgba(${c},${mood === 'evil' ? 0.25 : 0.45})`); tg.addColorStop(1, `rgba(${c},0)`); g.fillStyle = tg; g.fillRect(-h, -h, h * 2, h * 2); g.restore(); }
    if (o.hat !== 'helmet') this.wrap(g, h, C, el, t, seed);
    this.face(g, h, faceMood, o.look ? clamp(o.look.y, -1, 1) : 0, t, seed, skin);
    this.faceAcc(g, h, el, faceMood, t, seed);
    if (o.hat === 'helmet') this.helmet(g, h, color);
    if (!o.flat) this.lightPass(g, h, -face * idle.flip);
    g.restore();
    // Drip's neckerchief hangs just under the chin, in front of the body
    if (this.OUTFIT[el] && this.OUTFIT[el].tie) { const O = this.OUTFIT[el], rx = h * 0.68, ry = h * 0.6; g.fillStyle = O.tie; g.strokeStyle = '#2a6fb0'; g.lineWidth = Math.max(0.8, h * 0.02); g.beginPath(); g.moveTo(tx - rx * 0.42, ty - ry * 0.62); g.lineTo(tx - rx * 0.62, ty - ry * 0.05); g.lineTo(tx - rx * 0.32, ty - ry * 0.2); g.closePath(); g.fill(); g.stroke(); g.beginPath(); g.ellipse(tx - rx * 0.44, ty - ry * 0.6, h * 0.07, h * 0.055, 0, 0, 7); g.fill(); g.stroke(); }
    if (P) {
      if (P.wave && h > 9) { g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = h * 0.035; g.lineCap = 'round'; for (const k of [0, 1]) { g.beginPath(); g.arc(tx + P.n.x * h, ty + P.n.y * h, h * (0.34 + k * 0.1), -Math.PI * 0.95, -Math.PI * 0.62); g.stroke(); } }
      this.floatHand(g, h, C, tx + P.n.x * h, ty + P.n.y * h, P.n, true, faceMood);
    }
    // effects that belong to the head ride along with it
    g.save(); g.translate(0, hy); if (!o.simple) this.flair(g, h, el, t, seed); this.moodFx(g, h, faceMood, t, seed); g.restore();
    if (!o.simple) this.flourish(g, r, el, faceMood, t, seed);
    if (idle.pose) this.poseFx(g, r, el, idle.pose, idle.pp, t, false);
  },
  // a floating glove placed by the rules of an imaginary arm: cuff toward the body, thumb toward the face on raised open hands,
  // far hand a little smaller (further away)
  floatHand(g, h, C, X, Y, H, near, mood) {
    const d = H.d * Math.PI / 180;
    this.mitt(g, h * (near ? 0.9 : 0.8), C, X, Y, Math.atan2(-Math.sin(d), -Math.cos(d)), near, mood, H.m, H.o);
  },
  // hand positions (head radii from the torso centre) and finger directions (deg: 0 back, 90 down, 180 forward, -90 up)
  handPose(mood, t, seed, walk, idle) {
    const S = (x, y, d, op, mi) => ({ x, y, d, o: !!op, m: !!mi });
    const bn = Math.sin(t * 3.1 + seed) * 0.045, bf = Math.sin(t * 3.1 + seed + 1.9) * 0.045, shake = Math.sin(t * 40) * 0.05;
    const stand = () => ({ n: S(-0.96, 0.24 + bn, 106), f: S(0.84, 0.12 + bf, 74) });
    switch (idle.pose) {
      case 'spin': return { n: S(-1.38, -0.28, 178, 1, 1), f: S(1.32, -0.28, 2, 1, 0) };                                  // arms out, twirling
      case 'splash': return { n: S(-1.42, -1.4, -104, 1, 1), f: S(1.02, -1.78, -68, 1, 1) };                               // hands up for the splash
      case 'pump': { const up = Math.abs(Math.sin(idle.pp * Math.PI * 3)); return { n: S(-0.9, -1.35 - up * 0.32, -98), f: S(0.84, 0.14, 74) }; } // fist pump
      case 'stomp': return { n: S(-0.98, 0.3, 100), f: S(0.88, 0.3, 80) };
      case 'flex': return { n: S(-1.14, -0.78 + shake * 0.4, -78), f: S(1.04, -0.78 - shake * 0.4, -102) };              // fists up: flexing
    }
    switch (mood) {
      case 'cheer': { const b = Math.sin(t * 14) * 0.08; return { n: S(-1.5, -1.42 + b, -104, 1, 1), f: S(1.05, -1.8 - b, -66, 1, 1) }; }
      case 'starry': { const b = Math.sin(t * 9) * 0.08; return { n: S(-1.36, -1.52 + b, -100, 1, 1), f: S(1.0, -1.88 - b, -70, 1, 1) }; }
      case 'laugh': { const b = Math.abs(Math.sin(t * 11)) * 0.06; return { n: S(-0.62, 0.16 + b, 150), f: S(0.74, 0.2 + b, 76) }; }     // holding the belly
      case 'shock': return { n: S(-1.42, -0.95 + shake, -125, 1, 1), f: S(1.12, -1.15 + shake, -55, 1, 1) };             // hands thrown up
      case 'scared': return { n: S(-1.14, -0.55 + shake * 0.5, -112, 1, 1), f: S(-0.98, -0.42, -106, 1, 1) };            // hands up to fend off
      case 'love': return { n: S(-0.88, -0.24, 200), f: S(-0.74, -0.3, 205) };                                           // clasped at the chest
      case 'evil': { const q = Math.sin(t * 18) * 0.07; return { n: S(-0.88 + q, 0.02 + Math.cos(t * 18) * 0.04, 150), f: S(-0.74 - q, -0.02, 155) }; } // rubbing hands
      case 'angry': return { n: S(-1.12, -0.05 + shake, 172), f: S(0.86, -shake, 162) };                                 // shaking fists
      case 'effort': return { n: S(-1.05, 0.05 + Math.sin(t * 18) * 0.03, 175), f: S(-0.88, -0.02, 172) };              // straining, both fists forward
      case 'stoic': return { n: S(-1.02, -0.3, 176), f: S(0.82, 0.26, 80) };                                             // one firm fist, steady
      case 'grim': return { n: S(-0.42, 0.02, 175), f: S(-0.2, -0.05, 175) };                                            // arms folded
      case 'smug': case 'proud': return { n: S(0.06, 0.3, 100), f: S(0.72, 0.28, 80) };                                  // hands on hips
      case 'sick': return { n: S(-0.56, 0.18, 145), f: S(0.76, 0.25, 80) };
      case 'nervous': return { n: S(-0.78 + Math.sin(t * 12) * 0.05, 0.08, 140), f: S(-0.62, 0.05, 145) };              // fidgeting
      case 'hurt': case 'dizzy': case 'out': case 'sad': case 'cry': case 'sleepy': return { n: S(-0.78, 0.42, 96), f: S(0.76, 0.4, 84) }; // limp
    }
    const waving = (this._wave && mood !== 'scared') || (mood === 'happy' && walk < 0.1 && ((t + seed) % 7) < 1.3);
    if (waving) { const w = Math.sin(t * 10); return { n: S(-1.3, -0.82 + w * 0.03, -102 + 22 * w, 1, 1), f: S(0.84, 0.12 + bf, 74), wave: true }; }
    if (walk > 0.1) { const s = Math.sin(t * 14 + seed); return { n: S(-0.12 - 0.82 * s, 0.22 - 0.06 * Math.abs(s), 90 + 32 * s), f: S(0.12 + 0.82 * s, 0.2 - 0.06 * Math.abs(s), 90 - 32 * s) }; } // opposite swing
    if (mood === 'determined') return { n: S(-1.02, -0.12 + bn, 172), f: S(0.8, -0.02 + bf, 162) };                    // fists up, ready
    return stand();
  },
  // floating feet: x and lift in head radii; tip = toe-down tilt of a lifted foot
  footPose(t, seed, walk, out, mood) {
    if (walk > 0.1 && !out) {
      const ph = t * 14 + seed, s = Math.sin(ph), c = Math.cos(ph);
      const ln = Math.max(0, -c) * 0.16, lf = Math.max(0, c) * 0.16; // the foot swinging forward is in the air
      return [{ x: -0.04 + 0.34 * s, lift: ln, tip: ln * 2.6 }, { x: -0.04 - 0.34 * s, lift: lf, tip: lf * 2.6 }];
    }
    if (mood === 'cheer') { const hop = Math.max(0, Math.sin(t * 7)) * 0.12; return [{ x: -0.2, lift: hop, tip: hop * 2.5 }, { x: 0.24, lift: hop * 1.3, tip: hop * 3 }]; }
    return [{ x: -0.22, lift: 0, tip: 0 }, { x: 0.26, lift: 0, tip: 0 }];
  },
  cape(g, h, tx, ty, t, seed, cc) {
    const rx = h * 0.68, ry = h * 0.6, w = Math.sin(t * 3 + seed) * h * 0.06;
    const cg = g.createLinearGradient(tx, ty - ry, tx + rx * 1.6, ty + ry); cg.addColorStop(0, cc ? cc[0] : '#ffffff'); cg.addColorStop(1, cc ? cc[1] : '#cfe3f2');
    g.fillStyle = cg; g.strokeStyle = cc ? cc[2] : '#8fa6bf'; g.lineWidth = Math.max(0.8, h * 0.03);
    g.beginPath(); g.moveTo(tx + rx * 0.2, ty - ry * 0.95); g.quadraticCurveTo(tx + rx * 1.15, ty - ry * 0.9 + w, tx + rx * 1.45, ty + ry * 0.2 + w);
    g.quadraticCurveTo(tx + rx * 1.25, ty + ry * 0.35, tx + rx * 1.12, ty + ry * 0.55); g.quadraticCurveTo(tx + rx * 0.95, ty + ry * 0.3, tx + rx * 0.75, ty + ry * 0.45);
    g.quadraticCurveTo(tx + rx * 0.6, ty - ry * 0.3, tx + rx * 0.2, ty - ry * 0.95); g.closePath(); g.fill(); g.stroke();
  },
  // torso and outfit, centred on the origin; r = head radius. Seen from the side like the head: hems curve round the body.
  outfit(g, r, el) {
    const O = this.OUTFIT[el], st = O.style !== undefined ? O.style : el, sh = (c, a) => this.shade(c, a), rx = r * 0.68, ry = r * 0.6, hi = r > 9;
    const body = () => { g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, 7); };
    g.save(); body(); g.clip();
    const cloth = (col, path) => { if (hi) { const cg = g.createLinearGradient(-rx, -ry, rx, ry); cg.addColorStop(0, sh(col, 0.3)); cg.addColorStop(0.55, col); cg.addColorStop(1, sh(col, -0.3)); g.fillStyle = cg; } else g.fillStyle = col; path(); g.fill(); };
    const full = () => { g.beginPath(); g.rect(-rx * 1.2, -ry * 1.2, rx * 2.4, ry * 2.4); };
    const sag = ry * 0.16, yc = (xx, yy) => yy + sag * (1 - Math.pow(xx / (rx * 1.2), 2));
    const below = yy => () => { g.beginPath(); g.moveTo(-rx * 1.2, yy); g.quadraticCurveTo(0, yy + sag * 2, rx * 1.2, yy); g.lineTo(rx * 1.2, ry * 1.5); g.lineTo(-rx * 1.2, ry * 1.5); g.closePath(); };
    const band = (yy, hh, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(-rx * 1.2, yy); g.quadraticCurveTo(0, yy + sag * 2, rx * 1.2, yy); g.lineTo(rx * 1.2, yy + hh); g.quadraticCurveTo(0, yy + hh + sag * 2, -rx * 1.2, yy + hh); g.closePath(); g.fill(); };
    cloth(O.top, full);
    if (st === 0) { // sky scout: zip down the front, white trim, swirl badge, shorts
      g.strokeStyle = '#ffffff'; g.lineWidth = r * 0.06; g.beginPath(); g.ellipse(0, 0, rx * 0.93, ry * 0.93, 0, Math.PI * 0.62, Math.PI * 1.3); g.stroke();
      if (hi) { g.strokeStyle = '#7f8fa8'; g.lineWidth = Math.max(0.6, r * 0.02); g.setLineDash([r * 0.02, r * 0.02]); g.beginPath(); g.ellipse(0, 0, rx * 0.93, ry * 0.93, 0, Math.PI * 0.64, Math.PI * 1.28); g.stroke(); g.setLineDash([]); }
      g.fillStyle = '#ffffff'; g.beginPath(); g.arc(-rx * 0.15, -ry * 0.1, r * 0.13, 0, 7); g.fill();
      if (hi) { g.strokeStyle = '#5aa9c9'; g.lineWidth = r * 0.03; g.beginPath(); g.arc(-rx * 0.15, -ry * 0.1, r * 0.08, 0.3, 5.3); g.stroke(); g.beginPath(); g.arc(-rx * 0.15, -ry * 0.1, r * 0.03, 0.3, 5.3); g.stroke(); }
      band(ry * 0.4, r * 0.08, '#ffffff');
      cloth(O.bottoms, below(ry * 0.4 + r * 0.075));
    }
    if (st === 1) { // sailor: navy shorts with gold buttons, collar flap at the back
      cloth(O.bottoms, below(ry * 0.42));
      g.fillStyle = '#ffd34d'; for (const k of [0, 1]) { g.beginPath(); g.arc(-rx * 0.62, ry * (0.62 + k * 0.2), r * 0.035, 0, 7); g.fill(); }
      g.fillStyle = O.trim; g.beginPath(); g.moveTo(rx * 0.05, -ry * 1.05); g.lineTo(rx * 1.2, -ry * 1.05); g.lineTo(rx * 1.2, -ry * 0.2); g.lineTo(rx * 0.45, -ry * 0.2); g.closePath(); g.fill();
      g.strokeStyle = '#ffffff'; g.lineWidth = r * 0.025; g.beginPath(); g.moveTo(rx * 0.2, -ry * 0.95); g.lineTo(rx * 0.52, -ry * 0.3); g.lineTo(rx * 1.2, -ry * 0.3); g.stroke();
    }
    if (st === 2) { // varsity: yellow ribbed hem, flame patch on the side, zip at the front, shorts with a side stripe
      const hy = ry * 0.34;
      cloth(O.bottoms, below(hy + r * 0.09));
      g.save(); below(hy)(); g.clip(); g.strokeStyle = O.stripe; g.lineWidth = r * 0.05; g.beginPath(); g.ellipse(0, 0, rx * 0.84, ry * 0.98, 0, 0.1, 1.0); g.stroke(); g.restore();
      band(hy, r * 0.1, O.trim);
      if (hi) { g.strokeStyle = sh(O.trim, -0.3); g.lineWidth = Math.max(0.6, r * 0.012); for (let k = 0; k < 14; k++) { const xx = -rx + k * rx * 0.15; g.beginPath(); g.moveTo(xx, yc(xx, hy)); g.lineTo(xx, yc(xx, hy) + r * 0.1); g.stroke(); } }
      g.strokeStyle = '#fff1d6'; g.lineWidth = r * 0.03; g.beginPath(); g.ellipse(0, 0, rx * 0.9, ry * 0.9, 0, Math.PI * 0.66, Math.PI * 1.28); g.stroke();
      g.save(); g.translate(rx * 0.5, -ry * 0.12); g.transform(0.68, 0.08, 0, 1, 0, 0);
      if (hi) { const fg = g.createLinearGradient(0, r * 0.15, 0, -r * 0.25); fg.addColorStop(0, '#fff3b0'); fg.addColorStop(1, '#ff9a2a'); g.fillStyle = fg; } else g.fillStyle = '#ffb03a';
      g.strokeStyle = '#a82a10'; g.lineWidth = Math.max(0.6, r * 0.02);
      g.beginPath(); g.moveTo(-r * 0.14, r * 0.14); g.quadraticCurveTo(-r * 0.17, -r * 0.06, 0, -r * 0.26); g.quadraticCurveTo(r * 0.02, -r * 0.06, r * 0.08, -r * 0.1); g.quadraticCurveTo(r * 0.2, r * 0.02, r * 0.14, r * 0.14); g.closePath(); g.fill(); if (hi) g.stroke(); g.restore();
    }
    if (st === 3) { // overalls over a green tee: bib, strap with a button, leaf patch pocket
      const den = O.bottoms;
      cloth(den, () => { g.beginPath(); g.moveTo(-rx * 0.95, -ry * 0.3); g.lineTo(rx * 0.3, -ry * 0.3); g.lineTo(rx * 0.42, ry * 0.25); g.lineTo(rx * 1.2, ry * 0.25); g.lineTo(rx * 1.2, ry * 1.2); g.lineTo(-rx * 1.2, ry * 1.2); g.closePath(); });
      if (hi) { g.strokeStyle = sh(den, 0.4); g.lineWidth = Math.max(0.6, r * 0.015); g.setLineDash([r * 0.03, r * 0.025]); g.beginPath(); g.moveTo(-rx * 0.9, -ry * 0.22); g.lineTo(rx * 0.25, -ry * 0.22); g.lineTo(rx * 0.36, ry * 0.3); g.stroke(); g.setLineDash([]); }
      g.strokeStyle = den; g.lineWidth = r * 0.1; g.lineCap = 'butt'; g.beginPath(); g.moveTo(rx * 0.2, -ry * 0.3); g.lineTo(rx * 0.35, -ry * 1.1); g.stroke();
      g.fillStyle = '#ffd34d'; g.beginPath(); g.arc(rx * 0.2, -ry * 0.2, r * 0.04, 0, 7); g.fill();
      g.fillStyle = sh(den, -0.18); g.beginPath(); rrPath(g, -rx * 0.62, -ry * 0.12, rx * 0.5, ry * 0.36, r * 0.04); g.fill();
      if (!O.patch) { g.save(); g.translate(-rx * 0.37, ry * 0.06); g.rotate(-0.5); g.fillStyle = '#9fe06a'; g.beginPath(); g.moveTo(-r * 0.1, 0); g.quadraticCurveTo(0, -r * 0.08, r * 0.1, 0); g.quadraticCurveTo(0, r * 0.08, -r * 0.1, 0); g.fill(); g.restore(); }
    }
    if (st === 4) { // hoodie: kangaroo pocket, drawstrings, ribbed hem
      cloth(O.bottoms, below(ry * 0.46));
      band(ry * 0.36, r * 0.1, O.trim);
      g.fillStyle = sh(O.top, -0.15); g.beginPath(); rrPath(g, -rx * 0.7, ry * 0.0, rx * 0.75, ry * 0.32, r * 0.06); g.fill();
      g.strokeStyle = O.trim; g.lineWidth = r * 0.03; for (const dx of [-0.48, -0.32]) { g.beginPath(); g.moveTo(rx * dx, -ry * 0.7); g.lineTo(rx * dx - r * 0.02, -ry * 0.2); g.stroke(); g.fillStyle = O.trim; g.beginPath(); g.arc(rx * dx - r * 0.02, -ry * 0.16, r * 0.03, 0, 7); g.fill(); }
    }
    if (st === 5) { // raincoat: toggles down the front, glossy sheen, long hem
      cloth(O.bottoms, below(ry * 0.62));
      g.strokeStyle = O.trim; g.lineWidth = r * 0.035; g.beginPath(); g.moveTo(-rx * 0.78, -ry * 0.75); g.lineTo(-rx * 0.86, ry * 0.6); g.stroke();
      g.fillStyle = '#7a5a20'; for (const y of [-0.4, 0, 0.36]) { g.beginPath(); g.ellipse(-rx * 0.72, ry * y, r * 0.06, r * 0.025, 0.2, 0, 7); g.fill(); }
      if (hi) { g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.ellipse(-rx * 0.2, -ry * 0.35, rx * 0.35, ry * 0.12, -0.4, 0, 7); g.fill(); }
    }
    if (st === 6) { // puffy parka: quilted bands, fur trim hem, zip
      cloth(O.bottoms, below(ry * 0.5));
      g.strokeStyle = sh(O.top, -0.2); g.lineWidth = Math.max(0.8, r * 0.02); for (const y of [-0.35, 0.05]) { g.beginPath(); g.moveTo(-rx * 1.2, ry * y); g.quadraticCurveTo(0, ry * y + sag * 2, rx * 1.2, ry * y); g.stroke(); }
      g.fillStyle = O.trim; for (let k = 0; k < 12; k++) { const xx = -rx + k * rx * 0.18; g.beginPath(); g.arc(xx, yc(xx, ry * 0.46), r * 0.07, 0, 7); g.fill(); }
      g.strokeStyle = sh(O.top, -0.35); g.lineWidth = r * 0.025; g.beginPath(); g.moveTo(-rx * 0.88, -ry * 0.7); g.lineTo(-rx * 0.94, ry * 0.4); g.stroke();
    }
    if (st === 7) { // cloak: a deep collar drape with a clasp and tiny stars
      cloth(O.bottoms, below(ry * 0.5));
      g.fillStyle = sh(O.top, 0.15); g.beginPath(); g.moveTo(-rx * 1.2, -ry * 0.6); g.quadraticCurveTo(0, -ry * 0.05, rx * 1.2, -ry * 0.6); g.lineTo(rx * 1.2, -ry * 1.2); g.lineTo(-rx * 1.2, -ry * 1.2); g.closePath(); g.fill();
      g.fillStyle = O.trim; g.beginPath(); g.arc(-rx * 0.62, -ry * 0.42, r * 0.06, 0, 7); g.fill();
      g.fillStyle = '#fff3b0'; for (const [x, y] of [[0.1, 0.1], [0.45, -0.1], [-0.25, 0.25], [0.6, 0.3]]) { g.beginPath(); g.arc(rx * x, ry * y, r * 0.022, 0, 7); g.fill(); }
    }
    if (st === 8) { // vest over a tee: open front, hi-vis stripes, pocket
      cloth(O.bottoms, below(ry * 0.46));
      cloth(O.trim, () => { g.beginPath(); g.moveTo(-rx * 0.45, -ry * 1.2); g.lineTo(rx * 1.2, -ry * 1.2); g.lineTo(rx * 1.2, ry * 0.5); g.lineTo(-rx * 0.55, ry * 0.5); g.closePath(); });
      g.fillStyle = O.stripe; g.fillRect(-rx * 0.5, ry * 0.05, rx * 1.7, r * 0.07);
      g.fillStyle = sh(O.trim, -0.2); g.fillRect(-rx * 0.2, -ry * 0.3, rx * 0.35, ry * 0.25);
    }
    if (st === 9) { // flowery smock: polka flowers, frilly hem
      cloth(O.bottoms, below(ry * 0.52));
      g.fillStyle = O.dots; for (const [x, y] of [[-0.6, -0.4], [-0.1, -0.2], [0.4, -0.45], [-0.4, 0.15], [0.25, 0.2], [0.7, 0.0]]) { for (let k = 0; k < 5; k++) { const a = k * 1.256; g.beginPath(); g.arc(rx * x + Math.cos(a) * r * 0.04, ry * y + Math.sin(a) * r * 0.04, r * 0.03, 0, 7); g.fill(); } }
      g.fillStyle = O.trim; for (let k = 0; k < 10; k++) { const xx = -rx + k * rx * 0.22; g.beginPath(); g.arc(xx, yc(xx, ry * 0.5), r * 0.06, 0, Math.PI); g.fill(); }
    }
    if (O.patch === 'bolt') { g.fillStyle = '#ffe03a'; g.beginPath(); g.moveTo(rx * 0.5, -ry * 0.45); g.lineTo(rx * 0.32, -ry * 0.05); g.lineTo(rx * 0.46, -ry * 0.05); g.lineTo(rx * 0.36, ry * 0.3); g.lineTo(rx * 0.62, -ry * 0.15); g.lineTo(rx * 0.48, -ry * 0.15); g.closePath(); g.fill(); }
    if (O.patch === 'gear') { g.fillStyle = '#c8d0da'; g.beginPath(); g.arc(-rx * 0.37, ry * 0.06, r * 0.07, 0, 7); g.fill(); g.fillStyle = O.bottoms; g.beginPath(); g.arc(-rx * 0.37, ry * 0.06, r * 0.03, 0, 7); g.fill(); }
    // the big head shades the top of the body; a soft rim of sky light on the back
    const sd = g.createLinearGradient(0, -ry, 0, -ry * 0.35); sd.addColorStop(0, 'rgba(60,20,20,0.35)'); sd.addColorStop(1, 'rgba(60,20,20,0)'); g.fillStyle = sd; g.fillRect(-rx, -ry, rx * 2, ry * 0.7);
    if (hi) { g.strokeStyle = 'rgba(255,250,230,0.25)'; g.lineWidth = r * 0.05; g.beginPath(); g.ellipse(0, 0, rx * 0.95, ry * 0.95, 0, -0.5, 0.6); g.stroke(); }
    g.restore();
    g.strokeStyle = sh(O.top, -0.6); g.lineWidth = Math.max(0.8, r * 0.04); body(); g.stroke();
  },

  body(g, r, skin) {
    // subsurface-lit skin: warm core, deeper rim, soft bounce light from the ground
    const gr = g.createRadialGradient(-r * 0.3, -r * 0.42, r * 0.04, -r * 0.08, -r * 0.08, r * 1.08);
    gr.addColorStop(0, skin.light); gr.addColorStop(0.42, skin.mid); gr.addColorStop(0.86, skin.dark); gr.addColorStop(1, skin.rim || skin.dark);
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill();
    if (r > 9) {
      g.save(); g.beginPath(); g.arc(0, 0, r, 0, 7); g.clip();
      const ss = g.createRadialGradient(0, 0, r * 0.72, 0, 0, r * 1.02); ss.addColorStop(0, 'rgba(255,110,70,0)'); ss.addColorStop(1, skin.sss || 'rgba(255,90,60,0.2)');
      g.fillStyle = ss; g.fillRect(-r, -r, r * 2, r * 2);
      const tg = g.createRadialGradient(-r * 0.1, r * 0.5, 0, -r * 0.1, r * 0.5, r * 0.55); tg.addColorStop(0, 'rgba(255,244,222,0.42)'); tg.addColorStop(1, 'rgba(255,244,222,0)');
      g.fillStyle = tg; g.fillRect(-r, -r * 0.1, r * 2, r * 1.1);
      const bb = g.createLinearGradient(0, r * 0.5, 0, r); bb.addColorStop(0, 'rgba(255,236,196,0)'); bb.addColorStop(1, 'rgba(255,236,196,0.38)');
      g.fillStyle = bb; g.fillRect(-r, r * 0.5, r * 2, r * 0.5);
      g.restore();
    }
    g.lineWidth = Math.max(1, r * 0.045); g.strokeStyle = skin.line;
    g.beginPath(); g.arc(0, 0, r, 0, 7); g.stroke();
    // nose: a little shaded sphere on the facing side, outlined only where it leaves the head
    const nx = -r * 0.97, ny = -r * 0.02, nr = r * 0.17;
    const ng = g.createRadialGradient(nx - nr * 0.35, ny - nr * 0.45, nr * 0.05, nx, ny, nr * 1.05);
    ng.addColorStop(0, skin.light); ng.addColorStop(0.55, skin.mid); ng.addColorStop(1, skin.dark);
    g.fillStyle = ng; g.beginPath(); g.arc(nx, ny, nr, 0, 7); g.fill();
    g.beginPath(); g.arc(nx, ny, nr, 1.66, 4.62); g.stroke();
    g.fillStyle = 'rgba(150,55,20,0.07)'; g.beginPath(); g.ellipse(nx + nr * 0.9, ny + nr * 0.95, nr * 0.75, nr * 0.32, -0.2, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.75)'; g.beginPath(); g.ellipse(nx - nr * 0.35, ny - nr * 0.45, nr * 0.28, nr * 0.2, -0.5, 0, 7); g.fill();
  },

  IRIS: ['#4fb3c8', '#2f7fe8', '#e08a2a', '#6f8f2c', '#8a6ad8', '#3fb0a8', '#b07a30', '#e0508a', '#5ac8f0', '#d8a800', '#c8902a', '#ff5020', '#e8b020', '#9a7aff', '#5a7a9a'],
  // modern cartoon eye: shaded sclera, gradient iris with limbal ring, pupil, lid shadow and twin highlights
  eyeball(g, ex, ey, ew, eh, pr, lid, pdx, pdy, skin, r) {
    const ink = '#2a1410';
    g.save(); g.beginPath(); g.ellipse(ex, ey, ew, eh, 0, 0, 7); g.clip();
    const sg = g.createRadialGradient(ex + ew * 0.1, ey + eh * 0.3, eh * 0.05, ex, ey, eh * 1.1);
    sg.addColorStop(0, '#ffffff'); sg.addColorStop(0.65, '#f4f2f7'); sg.addColorStop(1, '#c9c3dc');
    g.fillStyle = sg; g.fillRect(ex - ew * 2, ey - eh * 2, ew * 4, eh * 4);
    const px = ex + ew * pdx, py = ey + eh * pdy, ir = ew * pr * 1.04;
    const ic = this.IRIS[this._el] || '#6a4a34';
    if (r > 7) {
      const ig = g.createRadialGradient(px - ir * 0.1, py + ir * 0.3, ir * 0.08, px, py, ir);
      ig.addColorStop(0, this.shade(ic, 0.55)); ig.addColorStop(0.5, ic); ig.addColorStop(0.86, this.shade(ic, -0.4)); ig.addColorStop(1, this.shade(ic, -0.7));
      g.fillStyle = ig;
    } else g.fillStyle = this.shade(ic, -0.3);
    g.beginPath(); g.arc(px, py, ir, 0, 7); g.fill();
    g.fillStyle = '#100604'; g.beginPath(); g.arc(px, py, ir * 0.5, 0, 7); g.fill();
    const lg = g.createLinearGradient(0, ey - eh, 0, ey - eh * 0.15); lg.addColorStop(0, 'rgba(70,30,40,0.5)'); lg.addColorStop(1, 'rgba(70,30,40,0)');
    g.fillStyle = lg; g.fillRect(ex - ew * 2, ey - eh, ew * 4, eh * 0.85);
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(px - ir * 0.36, py - ir * 0.4, ir * 0.36, ir * 0.3, -0.5, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.85)'; g.beginPath(); g.arc(px + ir * 0.4, py + ir * 0.38, ir * 0.14, 0, 7); g.fill();
    if (lid > 0) {
      const ly = ey - eh + eh * lid * 2;
      const lgr = g.createLinearGradient(0, ey - eh, 0, ly); lgr.addColorStop(0, skin.light); lgr.addColorStop(1, skin.mid);
      g.fillStyle = lgr; g.fillRect(ex - ew * 2, ey - eh * 2, ew * 4, ly - (ey - eh * 2));
      g.fillStyle = 'rgba(70,30,40,0.28)'; g.fillRect(ex - ew * 2, ly, ew * 4, eh * 0.18);
      g.strokeStyle = ink; g.lineWidth = Math.max(1.1, r * 0.055); g.beginPath(); g.moveTo(ex - ew * 1.2, ly); g.lineTo(ex + ew * 1.2, ly); g.stroke();
    }
    g.restore();
    g.strokeStyle = ink; g.lineWidth = Math.max(0.7, r * 0.026); g.beginPath(); g.ellipse(ex, ey, ew, eh, 0, 0, 7); g.stroke();
    if (lid <= 0) { g.lineWidth = Math.max(1.1, r * 0.058); g.beginPath(); g.ellipse(ex, ey, ew, eh, 0, Math.PI * 1.1, Math.PI * 1.92); g.stroke(); }
  },

  // element headwrap over the top of the head with a knot ornament
  wrap(g, r, C, el, t, seed) {
    if (C.pattern === 'none') return;
    const edge = x => -r * 0.42 + x * 0.12;
    g.save();
    g.beginPath(); g.arc(0, 0, r * 1.01, 0, 7); g.clip();
    const wrapPath = () => { g.beginPath(); g.moveTo(-r * 1.1, edge(-r * 1.1)); g.quadraticCurveTo(0, -r * 0.5, r * 1.1, edge(r * 1.1)); g.lineTo(r * 1.1, -r * 1.2); g.lineTo(-r * 1.1, -r * 1.2); g.closePath(); };
    const hi = r > 10;
    // the wrap casts a soft shadow onto the forehead
    if (hi) { g.strokeStyle = 'rgba(120,40,10,0.22)'; g.lineWidth = r * 0.16; g.beginPath(); g.moveTo(-r * 1.1, edge(-r * 1.1) + r * 0.07); g.quadraticCurveTo(0, -r * 0.43, r * 1.1, edge(r * 1.1) + r * 0.07); g.stroke(); }
    g.fillStyle = C.wrap; wrapPath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.18)'; g.beginPath(); g.ellipse(-r * 0.1, -r * 0.82, r * 0.5, r * 0.1, -0.1, 0, 7); g.fill();
    this._wrapPath = wrapPath;
    g.lineWidth = Math.max(1, r * 0.06); g.lineCap = 'round';
    if (C.pattern === 'wave') {
      g.strokeStyle = C.wrap2;
      const off = (t * r * 0.12) % (r * 0.28);
      for (let k = -5; k <= 5; k++) { const cx = k * r * 0.28 + off; g.beginPath(); g.arc(cx, -r * 0.58, r * 0.12, Math.PI, Math.PI * 1.9); g.stroke(); }
    } else if (C.pattern === 'flame') {
      for (let k = -4; k <= 4; k++) {
        const fx = k * r * 0.26, h = r * (0.22 + 0.08 * Math.sin(t * 8 + k));
        g.fillStyle = k % 2 ? C.wrap2 : '#ff8a2a';
        g.beginPath(); g.moveTo(fx - r * 0.11, -r * 0.46); g.quadraticCurveTo(fx, -r * 0.46 - h * 1.7, fx + r * 0.11, -r * 0.46); g.fill();
      }
    } else if (C.pattern === 'leaf') {
      g.strokeStyle = '#4a2c14'; g.beginPath(); g.moveTo(-r, -r * 0.62); g.quadraticCurveTo(0, -r * 0.74, r, -r * 0.6); g.stroke();
      g.fillStyle = C.wrap2;
      for (let k = -3; k <= 3; k++) { g.save(); g.translate(k * r * 0.3, -r * 0.66 + (k % 2) * r * 0.08); g.rotate(k * 0.7); g.beginPath(); g.ellipse(0, 0, r * 0.1, r * 0.05, 0, 0, 7); g.fill(); g.restore(); }
      g.fillStyle = '#4a2c14'; for (let k = -3; k <= 3; k++) { g.beginPath(); g.arc(k * r * 0.33 + r * 0.12, -r * 0.84, r * 0.03, 0, 7); g.fill(); }
    } else if (C.pattern === 'swirl') {
      g.strokeStyle = C.wrap2;
      for (let k = -2; k <= 2; k++) { g.beginPath(); g.arc(k * r * 0.45, -r * 0.68, r * 0.13, 0, Math.PI * 1.5); g.stroke(); }
    } else if (C.pattern === 'smoke') {
      g.strokeStyle = C.wrap2; g.globalAlpha *= 0.85;
      for (let k = -3; k <= 3; k++) { const x = k * r * 0.32 + Math.sin(t + k) * r * 0.03; g.beginPath(); g.moveTo(x - r * 0.1, -r * 0.55); g.bezierCurveTo(x - r * 0.15, -r * 0.7, x + r * 0.12, -r * 0.68, x + r * 0.04, -r * 0.82); g.stroke(); }
      g.globalAlpha /= 0.85;
    } else if (C.pattern === 'rain') {
      g.fillStyle = C.wrap2; for (let k = -5; k <= 5; k++) for (let j = 0; j < 2; j++) { const x = k * r * 0.22 + j * r * 0.11, y = -r * (0.6 + j * 0.2) + ((t * 0.4 + k * 0.13) % 0.1) * r; g.beginPath(); g.ellipse(x, y, r * 0.03, r * 0.05, 0.3, 0, 7); g.fill(); }
    } else if (C.pattern === 'crack') {
      g.strokeStyle = C.wrap2; g.lineWidth = Math.max(1, r * 0.035);
      for (let k = -2; k <= 2; k++) { const x = k * r * 0.42; g.beginPath(); g.moveTo(x, -r * 0.5); g.lineTo(x + r * 0.08, -r * 0.62); g.lineTo(x - r * 0.04, -r * 0.72); g.lineTo(x + r * 0.06, -r * 0.88); g.stroke(); }
      g.fillStyle = 'rgba(255,255,255,0.15)'; for (let k = -3; k <= 3; k++) { g.beginPath(); g.arc(k * r * 0.3 + r * 0.12, -r * 0.62, r * 0.05, 0, 7); g.fill(); }
    } else if (C.pattern === 'petal') {
      for (let k = -3; k <= 3; k++) { const x = k * r * 0.32, y = -r * (0.62 + (k % 2) * 0.14); g.fillStyle = C.wrap2; for (let p = 0; p < 5; p++) { const a = p * 1.256 + t * 0.3; g.beginPath(); g.ellipse(x + Math.cos(a) * r * 0.06, y + Math.sin(a) * r * 0.06, r * 0.05, r * 0.035, a, 0, 7); g.fill(); } g.fillStyle = '#ffd34d'; g.beginPath(); g.arc(x, y, r * 0.035, 0, 7); g.fill(); }
    } else if (C.pattern === 'snow') {
      g.strokeStyle = C.wrap2; g.lineWidth = Math.max(1, r * 0.025);
      for (let k = -3; k <= 3; k++) { const x = k * r * 0.32, y = -r * (0.62 + (k % 2) * 0.14); for (let a = 0; a < 3; a++) { const an = a * Math.PI / 3; g.beginPath(); g.moveTo(x - Math.cos(an) * r * 0.07, y - Math.sin(an) * r * 0.07); g.lineTo(x + Math.cos(an) * r * 0.07, y + Math.sin(an) * r * 0.07); g.stroke(); } }
    } else if (C.pattern === 'zigzag') {
      g.strokeStyle = C.wrap2; g.lineWidth = Math.max(1.5, r * 0.07); g.lineJoin = 'miter';
      g.beginPath(); for (let k = 0; k <= 12; k++) { const x = -r * 1.1 + k * r * 0.19; g.lineTo(x, -r * (k % 2 ? 0.58 : 0.72)); } g.stroke(); g.lineJoin = 'round';
    } else if (C.pattern === 'dune') {
      g.strokeStyle = C.wrap2; g.lineWidth = Math.max(1, r * 0.04);
      for (const y of [-0.58, -0.76]) { g.beginPath(); for (let k = 0; k <= 22; k++) { const x = -r * 1.1 + k * r * 0.1; g.lineTo(x, r * y + Math.sin(k * 0.8 + y * 9) * r * 0.035); } g.stroke(); }
      g.fillStyle = C.wrap2; for (let k = -4; k <= 4; k++) { g.beginPath(); g.arc(k * r * 0.25, -r * 0.9, r * 0.018, 0, 7); g.fill(); }
    } else if (C.pattern === 'lava') {
      const glow = 0.7 + 0.3 * Math.sin(t * 3 + seed); g.strokeStyle = `rgba(255,${120 + glow * 60},40,${glow})`; g.lineWidth = Math.max(1, r * 0.045);
      for (let k = -2; k <= 2; k++) { const x = k * r * 0.42; g.beginPath(); g.moveTo(x - r * 0.12, -r * 0.52); g.lineTo(x, -r * 0.66); g.lineTo(x - r * 0.05, -r * 0.8); g.moveTo(x, -r * 0.66); g.lineTo(x + r * 0.14, -r * 0.7); g.stroke(); }
    } else if (C.pattern === 'star') {
      g.fillStyle = C.wrap2;
      for (let k = -3; k <= 3; k++) { const x = k * r * 0.32, y = -r * (0.62 + (k % 2) * 0.15), q = r * (0.06 + 0.015 * Math.sin(t * 3 + k)); g.beginPath(); for (let a = 0; a < 8; a++) { const rr = a % 2 ? q * 0.35 : q, an = a * Math.PI / 4; g.lineTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr); } g.closePath(); g.fill(); }
    } else if (C.pattern === 'moon') {
      for (let k = -3; k <= 3; k++) { const x = k * r * 0.32, y = -r * (0.62 + (k % 2) * 0.15); if (k % 2) { g.fillStyle = C.wrap2; g.beginPath(); g.arc(x, y, r * 0.06, 0, 7); g.fill(); g.fillStyle = C.wrap; g.beginPath(); g.arc(x + r * 0.03, y - r * 0.02, r * 0.05, 0, 7); g.fill(); } else { g.fillStyle = C.wrap2; g.beginPath(); g.arc(x, y, r * 0.018, 0, 7); g.fill(); } }
    } else if (C.pattern === 'rivet') {
      g.strokeStyle = C.wrap2; g.lineWidth = Math.max(1, r * 0.03); g.beginPath(); g.moveTo(-r * 1.1, -r * 0.7); g.quadraticCurveTo(0, -r * 0.8, r * 1.1, -r * 0.66); g.stroke();
      for (let k = -4; k <= 4; k++) { const x = k * r * 0.25; g.fillStyle = C.wrap2; g.beginPath(); g.arc(x, -r * 0.6, r * 0.035, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,0.6)'; g.beginPath(); g.arc(x - r * 0.01, -r * 0.61, r * 0.012, 0, 7); g.fill(); }
    }
    if (hi) {
      // fabric volume: lit crown, shaded underside, sphere falloff, a few soft folds toward the knot
      const vg = g.createLinearGradient(0, -r, 0, -r * 0.35); vg.addColorStop(0, 'rgba(255,255,255,0.2)'); vg.addColorStop(0.45, 'rgba(255,255,255,0)'); vg.addColorStop(1, 'rgba(30,10,20,0.22)');
      g.fillStyle = vg; wrapPath(); g.fill();
      const rg = g.createRadialGradient(-r * 0.25, -r * 0.75, r * 0.1, 0, -r * 0.3, r * 1.1); rg.addColorStop(0, 'rgba(0,0,0,0)'); rg.addColorStop(0.7, 'rgba(0,0,0,0.05)'); rg.addColorStop(1, 'rgba(20,10,30,0.3)');
      g.fillStyle = rg; wrapPath(); g.fill();
    }
    g.restore();
    // rolled hem band with a highlight and running stitches
    g.lineCap = 'round';
    const hemPath = (dy = 0) => { g.beginPath(); g.moveTo(-r * 0.93, edge(-r * 0.93) + r * 0.02 + dy); g.quadraticCurveTo(0, -r * 0.5 + dy, r * 0.96, edge(r * 0.96) + dy); };
    g.strokeStyle = this.shade(C.hem, -0.35); g.lineWidth = Math.max(2, r * 0.13); hemPath(r * 0.01); g.stroke();
    g.strokeStyle = C.hem; g.lineWidth = Math.max(1.5, r * 0.1); hemPath(); g.stroke();
    if (hi) {
      g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = r * 0.03; hemPath(-r * 0.025); g.stroke();
      g.setLineDash([r * 0.06, r * 0.05]); g.strokeStyle = this.shade(C.hem, 0.45); g.lineWidth = Math.max(0.6, r * 0.018); hemPath(r * 0.005); g.stroke(); g.setLineDash([]);
    }
    // tails of the knot hanging at the back
    g.strokeStyle = this.shade(C.wrap, -0.45); g.lineWidth = Math.max(0.8, r * 0.035); g.lineJoin = 'round';
    for (let k = 0; k < 2; k++) {
      const sw = Math.sin(t * 4.5 + seed + k * 1.3) * 0.18, len = r * (k ? 0.36 : 0.44), w = r * 0.1;
      g.save(); g.translate(r * 0.88, -r * 0.44); g.rotate(0.35 + k * 0.55 + sw);
      const tip = Math.sin(t * 6 + k + seed) * r * 0.04;
      if (r > 10) { const tg = g.createLinearGradient(0, -w, 0, w); tg.addColorStop(0, this.shade(C.wrap, 0.25)); tg.addColorStop(1, this.shade(C.wrap, -0.25)); g.fillStyle = tg; } else g.fillStyle = C.wrap;
      g.beginPath(); g.moveTo(0, -w * 0.5); g.quadraticCurveTo(len * 0.5, -w * 0.9 + tip, len, -w * 0.6 + tip); g.lineTo(len * 0.86, tip); g.lineTo(len, w * 0.6 + tip); g.quadraticCurveTo(len * 0.5, w * 0.9 + tip, 0, w * 0.5); g.closePath(); g.fill(); g.stroke();
      g.restore();
    }
    // the knot itself
    g.fillStyle = this.shade(C.wrap, -0.1); g.beginPath(); g.ellipse(r * 0.88, -r * 0.44, r * 0.1, r * 0.08, 0.4, 0, 7); g.fill(); g.stroke();
    // ornament on top
    g.save(); g.translate(r * 0.42, -r * 0.92);
    if (el === 1) {
      const og = g.createRadialGradient(-r * 0.06, -r * 0.16, r * 0.02, 0, -r * 0.08, r * 0.22);
      og.addColorStop(0, '#e6f6ff'); og.addColorStop(0.35, '#8cc8ff'); og.addColorStop(0.85, '#2f7fe0'); og.addColorStop(1, '#1d56a8');
      g.fillStyle = og; g.strokeStyle = '#1d4f98'; g.lineWidth = Math.max(1, r * 0.04);
      g.beginPath(); g.arc(0, -r * 0.08, r * 0.2, 0, 7); g.fill(); g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.9)'; g.beginPath(); g.ellipse(-r * 0.07, -r * 0.17, r * 0.07, r * 0.045, -0.6, 0, 7); g.fill();
      g.fillStyle = 'rgba(200,240,255,0.6)'; g.beginPath(); g.arc(r * 0.08, r * 0.02, r * 0.035, 0, 7); g.fill();
      const d = (t * 0.8 + seed * 0.3) % 1; g.fillStyle = `rgba(120,190,255,${1 - d})`; g.beginPath(); g.ellipse(r * 0.28, r * 0.05 + d * r * 0.5, r * 0.06, r * 0.09, 0, 0, 7); g.fill();
    } else if (el === 2) {
      if (r > 10) { const gl = g.createRadialGradient(0, -r * 0.2, 0, 0, -r * 0.2, r * 0.6); gl.addColorStop(0, 'rgba(255,190,70,0.45)'); gl.addColorStop(1, 'rgba(255,120,40,0)'); g.fillStyle = gl; g.beginPath(); g.arc(0, -r * 0.2, r * 0.6, 0, 7); g.fill(); }
      for (let k = 0; k < 3; k++) {
        const h = r * (0.45 + 0.15 * Math.sin(t * 10 + k * 2 + seed)) * (k === 1 ? 1.25 : 0.85);
        if (r > 10) { const fg = g.createLinearGradient(0, 0, 0, -h); fg.addColorStop(0, k === 1 ? '#fff3b0' : '#ffb03a'); fg.addColorStop(0.5, k === 1 ? '#ffd34d' : '#ff7a2a'); fg.addColorStop(1, k === 1 ? '#ff9a2a' : '#e8432a'); g.fillStyle = fg; }
        else g.fillStyle = k === 1 ? '#ffd34d' : '#ff7a2a';
        g.beginPath(); g.moveTo((k - 1) * r * 0.16 - r * 0.12, 0); g.quadraticCurveTo((k - 1) * r * 0.2 + Math.sin(t * 7 + k) * r * 0.06, -h, (k - 1) * r * 0.16 + r * 0.12, 0); g.fill();
      }
    } else if (el === 3) {
      g.fillStyle = '#c98a4a'; g.strokeStyle = '#5a3a1a'; g.lineWidth = Math.max(1, r * 0.05);
      g.beginPath(); g.arc(0, 0, r * 0.13, 0, 7); g.fill(); g.stroke();
      g.strokeStyle = '#3f7a1c'; g.lineWidth = Math.max(1, r * 0.06);
      g.beginPath(); g.moveTo(0, -r * 0.1); g.quadraticCurveTo(r * 0.04, -r * 0.3, -r * 0.02, -r * 0.42); g.stroke();
      const s2 = Math.sin(t * 2.5 + seed) * 0.25;
      const leaf = (y, rot, L, W) => {
        g.save(); g.translate(0, y); g.rotate(rot);
        if (r > 10) { const lg = g.createLinearGradient(0, -W, 0, W); lg.addColorStop(0, '#a6e86a'); lg.addColorStop(0.6, '#6cbf3c'); lg.addColorStop(1, '#3f8a22'); g.fillStyle = lg; } else g.fillStyle = '#7ccf4a';
        g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(L * 0.5, -W * 1.3, L, 0); g.quadraticCurveTo(L * 0.5, W * 1.3, 0, 0); g.fill();
        if (r > 10) { g.strokeStyle = 'rgba(40,90,20,0.6)'; g.lineWidth = Math.max(0.5, r * 0.015); g.beginPath(); g.moveTo(L * 0.05, 0); g.quadraticCurveTo(L * 0.5, -W * 0.15, L * 0.92, 0); g.stroke(); }
        g.restore();
      };
      leaf(-r * 0.38, -0.5 + s2, r * 0.36, r * 0.08);
      leaf(-r * 0.32, 3.5 + s2, r * 0.3, r * 0.07);
    } else if (el === 0) {
      g.strokeStyle = '#8a93a3'; g.lineWidth = Math.max(1, r * 0.05);
      g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -r * 0.25); g.stroke();
      g.translate(0, -r * 0.27); g.rotate(t * 9 + seed);
      g.fillStyle = '#f4f6fa';
      for (let k = 0; k < 3; k++) { g.rotate(Math.PI * 2 / 3); g.beginPath(); g.ellipse(r * 0.17, 0, r * 0.17, r * 0.06, 0, 0, 7); g.fill(); g.stroke(); }
      g.fillStyle = '#b9c4d4'; g.beginPath(); g.arc(0, 0, r * 0.05, 0, 7); g.fill();
    } else if (C.orn) this.ornament(g, r, C.orn, t, seed);
    g.restore();
  },

  // the little things that make each newer hero's face their own. Head radius r, facing left:
  // eye at (-0.42r, -0.11r), mouth at (-0.8r, 0.3r), nose at (-0.97r, 0).
  faceAcc(g, r, el, mood, t, seed) {
    const k = FACEACC[el]; if (!k || r < 5) return;
    const ex = -r * 0.42, ey = -r * 0.11, mx = -r * 0.8, my = r * 0.3, lw = Math.max(0.8, r * 0.035);
    const closedMouth = !['cheer', 'laugh', 'shock', 'scared', 'cry', 'evil', 'starry', 'hurt', 'dizzy', 'out', 'angry', 'effort'].includes(mood);
    g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
    if (k === 'freckles') { g.fillStyle = 'rgba(170,80,40,0.55)'; for (const [x, y] of [[-0.34, 0.14], [-0.24, 0.18], [-0.3, 0.24], [-0.18, 0.12], [-0.2, 0.27]]) { g.beginPath(); g.arc(r * x, r * y, r * 0.022, 0, 7); g.fill(); } g.strokeStyle = '#2a1410'; g.lineWidth = lw * 0.8; for (let q = 0; q < 2; q++) { g.beginPath(); g.moveTo(ex - r * 0.1 + q * r * 0.08, ey - r * 0.22); g.lineTo(ex - r * 0.16 + q * r * 0.08, ey - r * 0.32); g.stroke(); } }
    if (k === 'goatee') { g.fillStyle = '#3a3a44'; g.beginPath(); g.moveTo(mx + r * 0.08, my + r * 0.12); g.quadraticCurveTo(mx - r * 0.02, my + r * 0.36, mx + r * 0.14, my + r * 0.3); g.quadraticCurveTo(mx + r * 0.2, my + r * 0.18, mx + r * 0.08, my + r * 0.12); g.fill(); g.strokeStyle = '#3a3a44'; g.lineWidth = lw * 1.1; g.beginPath(); g.moveTo(mx - r * 0.06, my - r * 0.08); g.quadraticCurveTo(mx + r * 0.08, my - r * 0.13, mx + r * 0.18, my - r * 0.06); g.stroke(); }
    if (k === 'scar') { g.strokeStyle = 'rgba(190,80,70,0.85)'; g.lineWidth = lw * 1.3; g.beginPath(); g.moveTo(ex - r * 0.06, ey - r * 0.42); g.lineTo(ex + r * 0.12, ey + r * 0.2); g.stroke(); g.lineWidth = lw * 0.7; for (let q = 0; q < 3; q++) { const u = 0.2 + q * 0.3, x = ex - r * 0.06 + r * 0.18 * u, y = ey - r * 0.42 + r * 0.62 * u; g.beginPath(); g.moveTo(x - r * 0.05, y + r * 0.01); g.lineTo(x + r * 0.05, y - r * 0.01); g.stroke(); } g.fillStyle = 'rgba(60,40,30,0.35)'; for (let q = 0; q < 14; q++) { g.beginPath(); g.arc(mx + r * (0.05 + MGHash(q) * 0.45), my + r * (0.12 + MGHash(q + 9) * 0.25), r * 0.012, 0, 7); g.fill(); } }
    if (k === 'diva') {
      g.strokeStyle = '#2a1410'; g.lineWidth = lw; for (let q = 0; q < 3; q++) { const a = -Math.PI / 2 - 0.15 + q * 0.32; g.beginPath(); g.moveTo(ex + Math.cos(a) * r * 0.17, ey + Math.sin(a) * r * 0.23); g.quadraticCurveTo(ex + Math.cos(a) * r * 0.3, ey + Math.sin(a) * r * 0.36, ex + Math.cos(a) * r * 0.26 - r * 0.06, ey + Math.sin(a) * r * 0.42); g.stroke(); }
      if (closedMouth) { g.fillStyle = '#e02a5a'; g.beginPath(); g.ellipse(mx + r * 0.01, my, r * 0.1, r * 0.06, 0.1, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,0.6)'; g.beginPath(); g.ellipse(mx - r * 0.02, my - r * 0.02, r * 0.03, r * 0.012, 0, 0, 7); g.fill(); }
      g.fillStyle = '#3a1a10'; g.beginPath(); g.arc(mx + r * 0.2, my + r * 0.1, r * 0.022, 0, 7); g.fill();
    }
    if (k === 'shades') { // sunglasses pushed up on the forehead
      g.fillStyle = '#1a2a3a'; g.beginPath(); g.ellipse(-r * 0.55, -r * 0.5, r * 0.18, r * 0.11, -0.25, 0, 7); g.fill(); g.beginPath(); g.ellipse(-r * 0.2, -r * 0.6, r * 0.16, r * 0.1, -0.15, 0, 7); g.fill();
      g.strokeStyle = '#1a2a3a'; g.lineWidth = lw; g.beginPath(); g.moveTo(-r * 0.37, -r * 0.56); g.lineTo(-r * 0.32, -r * 0.58); g.moveTo(-r * 0.04, -r * 0.62); g.lineTo(r * 0.5, -r * 0.55); g.stroke();
      g.fillStyle = 'rgba(160,220,255,0.55)'; g.beginPath(); g.ellipse(-r * 0.6, -r * 0.54, r * 0.06, r * 0.03, -0.3, 0, 7); g.fill();
    }
    if (k === 'boltpaint') { g.fillStyle = 'rgba(255,214,40,0.9)'; g.beginPath(); g.moveTo(-r * 0.3, r * 0.06); g.lineTo(-r * 0.4, r * 0.2); g.lineTo(-r * 0.33, r * 0.2); g.lineTo(-r * 0.4, r * 0.34); g.lineTo(-r * 0.24, r * 0.16); g.lineTo(-r * 0.31, r * 0.16); g.closePath(); g.fill(); if (((t * 1.3 + seed) % 2) < 0.15) { g.strokeStyle = '#fff36a'; g.lineWidth = lw; g.beginPath(); g.moveTo(r * 0.7, -r * 0.7); g.lineTo(r * 0.85, -r * 0.85); g.lineTo(r * 0.78, -r * 0.88); g.lineTo(r * 0.95, -r * 1.05); g.stroke(); } }
    if (k === 'glasses') {
      g.strokeStyle = '#3a2410'; g.lineWidth = lw * 1.4; g.beginPath(); g.arc(ex, ey, r * 0.27, 0, 7); g.stroke();
      g.fillStyle = 'rgba(200,230,255,0.18)'; g.fill(); g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.ellipse(ex - r * 0.1, ey - r * 0.12, r * 0.07, r * 0.03, -0.6, 0, 7); g.fill();
      g.beginPath(); g.moveTo(ex - r * 0.27, ey - r * 0.02); g.lineTo(-r * 0.94, ey - r * 0.06); g.moveTo(ex + r * 0.27, ey - r * 0.04); g.lineTo(r * 0.2, ey - r * 0.12); g.stroke();
      if (closedMouth) { g.fillStyle = '#fff'; g.strokeStyle = '#2a1410'; g.lineWidth = lw * 0.6; for (const dx of [-0.05, 0.02]) { g.beginPath(); g.rect(mx + r * dx, my + r * 0.01, r * 0.065, r * 0.09); g.fill(); g.stroke(); } }
    }
    if (k === 'skull') { // half-face skull tattoo
      const ink = 'rgba(40,24,40,0.62)';
      g.strokeStyle = ink; g.lineWidth = lw * 1.3; g.beginPath(); g.ellipse(ex - r * 0.02, ey + r * 0.02, r * 0.27, r * 0.33, 0, 0, 7); g.stroke();
      g.fillStyle = 'rgba(40,24,40,0.18)'; g.fill();
      g.fillStyle = ink; g.beginPath(); g.moveTo(-r * 0.84, r * 0.1); g.lineTo(-r * 0.76, r * 0.02); g.lineTo(-r * 0.72, r * 0.12); g.closePath(); g.fill();
      g.lineWidth = lw * 0.9; g.beginPath(); g.moveTo(-r * 0.92, r * 0.43); g.quadraticCurveTo(-r * 0.7, r * 0.5, -r * 0.48, r * 0.42); g.stroke();
      for (let q = 0; q < 5; q++) { const x = -r * 0.88 + q * r * 0.09; g.beginPath(); g.moveTo(x, r * 0.4); g.lineTo(x, r * 0.5); g.stroke(); }
      g.beginPath(); g.moveTo(-r * 0.2, r * 0.2); g.lineTo(-r * 0.1, r * 0.3); g.lineTo(-r * 0.16, r * 0.36); g.stroke();
    }
    if (k === 'beard') { // a long wizard beard and a curly moustache
      const sw = Math.sin(t * 2 + seed) * r * 0.05;
      const bg = g.createLinearGradient(0, r * 0.35, 0, r * 1.5); bg.addColorStop(0, '#ffffff'); bg.addColorStop(1, '#d8dce8');
      g.fillStyle = bg; g.strokeStyle = '#a8aec0'; g.lineWidth = lw;
      g.beginPath(); g.moveTo(-r * 0.98, r * 0.38); g.quadraticCurveTo(-r * 0.96, r * 0.9, -r * 0.62 + sw, r * 1.55); g.quadraticCurveTo(-r * 0.45 + sw, r * 1.1, -r * 0.12, r * 0.7); g.quadraticCurveTo(-r * 0.2, r * 0.45, -r * 0.4, r * 0.4); g.quadraticCurveTo(-r * 0.7, r * 0.48, -r * 0.98, r * 0.38); g.fill(); g.stroke();
      g.strokeStyle = 'rgba(160,170,190,0.6)'; for (let q = 0; q < 3; q++) { g.beginPath(); g.moveTo(-r * (0.8 - q * 0.15), r * 0.55); g.quadraticCurveTo(-r * (0.78 - q * 0.12) + sw, r * 0.95, -r * (0.66 - q * 0.04) + sw, r * 1.3); g.stroke(); }
      g.fillStyle = '#fff'; g.strokeStyle = '#a8aec0'; g.beginPath(); g.moveTo(-r * 0.98, r * 0.2); g.quadraticCurveTo(-r * 0.86, r * 0.12, -r * 0.62, r * 0.22); g.quadraticCurveTo(-r * 0.5, r * 0.3, -r * 0.54, r * 0.38); g.quadraticCurveTo(-r * 0.7, r * 0.28, -r * 0.98, r * 0.32); g.closePath(); g.fill(); g.stroke();
    }
    if (k === 'goth') { // smoky eye, winged liner, plum lips
      g.fillStyle = 'rgba(110,60,170,0.35)'; g.beginPath(); g.ellipse(ex, ey - r * 0.2, r * 0.24, r * 0.12, 0, Math.PI, Math.PI * 2); g.fill();
      g.strokeStyle = '#1a0a2a'; g.lineWidth = lw * 1.3; g.beginPath(); g.moveTo(ex - r * 0.17, ey - r * 0.12); g.lineTo(ex - r * 0.3, ey - r * 0.22); g.stroke();
      if (closedMouth) { g.fillStyle = '#6a2a8a'; g.beginPath(); g.ellipse(mx + r * 0.01, my, r * 0.09, r * 0.05, 0.1, 0, 7); g.fill(); }
      g.fillStyle = '#fff3b0'; g.beginPath(); g.arc(-r * 0.25, r * 0.12, r * 0.025, 0, 7); g.fill();
    }
    if (k === 'goggles') { // brass goggles up on the forehead, a smudge of oil
      g.strokeStyle = '#5a4020'; g.lineWidth = lw * 2.2; g.beginPath(); g.moveTo(-r * 0.95, -r * 0.42); g.quadraticCurveTo(0, -r * 0.62, r * 0.95, -r * 0.42); g.stroke();
      for (const [x, y] of [[-0.6, -0.5], [-0.25, -0.6]]) { g.fillStyle = '#c89a3a'; g.beginPath(); g.arc(r * x, r * y, r * 0.14, 0, 7); g.fill(); g.fillStyle = '#8fd8ff'; g.beginPath(); g.arc(r * x, r * y, r * 0.09, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,0.7)'; g.beginPath(); g.arc(r * x - r * 0.03, r * y - r * 0.03, r * 0.025, 0, 7); g.fill(); }
      g.fillStyle = 'rgba(60,50,40,0.35)'; g.beginPath(); g.ellipse(-r * 0.3, r * 0.2, r * 0.07, r * 0.04, 0.4, 0, 7); g.fill();
      g.fillStyle = 'rgba(170,80,40,0.5)'; for (const [x, y] of [[-0.36, 0.12], [-0.22, 0.16]]) { g.beginPath(); g.arc(r * x, r * y, r * 0.02, 0, 7); g.fill(); }
    }
    g.restore();
  },

  // headwrap ornaments of the newer heroes (drawn at the top-back of the head, local origin)
  ornament(g, r, kind, t, seed) {
    const lw = Math.max(1, r * 0.04); g.lineWidth = lw; g.lineJoin = 'round'; g.lineCap = 'round';
    if (kind === 'chimney') { // a little smokestack puffing rings
      g.fillStyle = '#5a5e68'; g.strokeStyle = '#2a2c32'; g.beginPath(); rrPath(g, -r * 0.09, -r * 0.3, r * 0.18, r * 0.3, r * 0.03); g.fill(); g.stroke();
      g.fillStyle = '#7a7e88'; g.fillRect(-r * 0.12, -r * 0.34, r * 0.24, r * 0.07);
      for (let k = 0; k < 3; k++) { const ph = (t * 0.7 + k / 3 + seed * 0.1) % 1; g.fillStyle = `rgba(220,224,232,${0.85 * (1 - ph)})`; g.beginPath(); g.arc(Math.sin(ph * 5 + k) * r * 0.08 + ph * r * 0.15, -r * 0.4 - ph * r * 0.5, r * (0.07 + ph * 0.1), 0, 7); g.fill(); }
    } else if (kind === 'raincloud') {
      for (let k = 0; k < 3; k++) { const ph = (t * 1.4 + k / 3) % 1; g.fillStyle = `rgba(120,190,255,${1 - ph})`; g.beginPath(); g.ellipse((k - 1) * r * 0.1, -r * 0.12 + ph * r * 0.35, r * 0.025, r * 0.045, 0, 0, 7); g.fill(); }
      g.fillStyle = '#eef3fa'; g.strokeStyle = '#8a9ab0'; g.beginPath(); g.arc(-r * 0.1, -r * 0.22, r * 0.1, 0, 7); g.arc(r * 0.04, -r * 0.28, r * 0.13, 0, 7); g.arc(r * 0.16, -r * 0.2, r * 0.09, 0, 7); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.8)'; g.beginPath(); g.arc(0, -r * 0.33, r * 0.05, 0, 7); g.fill();
    } else if (kind === 'crystal') {
      const gl = 0.6 + 0.4 * Math.sin(t * 2 + seed); g.fillStyle = '#b48aff'; g.strokeStyle = '#5a3a9a';
      g.beginPath(); g.moveTo(0, 0); g.lineTo(-r * 0.1, -r * 0.18); g.lineTo(-r * 0.02, -r * 0.42); g.lineTo(r * 0.09, -r * 0.2); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = `rgba(255,255,255,${0.5 * gl})`; g.beginPath(); g.moveTo(-r * 0.05, -r * 0.18); g.lineTo(-r * 0.02, -r * 0.36); g.lineTo(r * 0.02, -r * 0.2); g.closePath(); g.fill();
      g.fillStyle = '#8a7aa8'; g.beginPath(); g.moveTo(r * 0.04, 0); g.lineTo(r * 0.12, -r * 0.2); g.lineTo(r * 0.16, -r * 0.02); g.closePath(); g.fill();
    } else if (kind === 'tulip') {
      const sw = Math.sin(t * 2.2 + seed) * 0.15; g.save(); g.rotate(sw);
      g.strokeStyle = '#4f9a2a'; g.lineWidth = Math.max(1, r * 0.05); g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -r * 0.3); g.stroke();
      g.fillStyle = '#6cc040'; g.beginPath(); g.ellipse(r * 0.08, -r * 0.12, r * 0.1, r * 0.04, -0.6, 0, 7); g.fill();
      g.fillStyle = '#ff5a9a'; g.strokeStyle = '#a82a5a'; g.lineWidth = lw; g.beginPath(); g.moveTo(-r * 0.12, -r * 0.32); g.quadraticCurveTo(-r * 0.13, -r * 0.52, -r * 0.06, -r * 0.5); g.lineTo(0, -r * 0.42); g.lineTo(r * 0.06, -r * 0.5); g.quadraticCurveTo(r * 0.13, -r * 0.52, r * 0.12, -r * 0.32); g.quadraticCurveTo(0, -r * 0.22, -r * 0.12, -r * 0.32); g.fill(); g.stroke();
      g.restore();
    } else if (kind === 'icecrystal') {
      g.save(); g.translate(0, -r * 0.22); g.rotate(Math.sin(t * 1.5 + seed) * 0.2);
      g.strokeStyle = '#3f9fd8'; g.lineWidth = Math.max(1.5, r * 0.06);
      for (let a = 0; a < 3; a++) { g.save(); g.rotate(a * Math.PI / 3); g.beginPath(); g.moveTo(0, -r * 0.2); g.lineTo(0, r * 0.2); for (const s2 of [-1, 1]) { g.moveTo(0, s2 * r * 0.12); g.lineTo(r * 0.06, s2 * r * 0.18); g.moveTo(0, s2 * r * 0.12); g.lineTo(-r * 0.06, s2 * r * 0.18); } g.stroke(); g.restore(); }
      g.strokeStyle = '#e8f8ff'; g.lineWidth = Math.max(0.8, r * 0.025); for (let a = 0; a < 3; a++) { g.save(); g.rotate(a * Math.PI / 3); g.beginPath(); g.moveTo(0, -r * 0.19); g.lineTo(0, r * 0.19); g.stroke(); g.restore(); }
      g.restore();
    } else if (kind === 'bolt') {
      const fl = ((t * 2 + seed) % 2.2) < 0.12;
      if (fl) { g.fillStyle = 'rgba(255,255,180,0.6)'; g.beginPath(); g.arc(0, -r * 0.22, r * 0.3, 0, 7); g.fill(); }
      g.fillStyle = '#ffe03a'; g.strokeStyle = '#a87800'; g.beginPath(); g.moveTo(r * 0.06, 0); g.lineTo(-r * 0.1, -r * 0.2); g.lineTo(0, -r * 0.2); g.lineTo(-r * 0.06, -r * 0.44); g.lineTo(r * 0.12, -r * 0.18); g.lineTo(r * 0.02, -r * 0.18); g.closePath(); g.fill(); g.stroke();
    } else if (kind === 'cactus') {
      g.fillStyle = '#c86a3a'; g.beginPath(); g.ellipse(0, -r * 0.02, r * 0.13, r * 0.06, 0, 0, 7); g.fill();
      g.fillStyle = '#5fae4a'; g.strokeStyle = '#2f6a22'; g.beginPath(); rrPath(g, -r * 0.06, -r * 0.4, r * 0.12, r * 0.38, r * 0.06); g.fill(); g.stroke();
      g.beginPath(); rrPath(g, r * 0.06, -r * 0.3, r * 0.1, r * 0.06, r * 0.03); g.fill(); g.beginPath(); rrPath(g, r * 0.1, -r * 0.38, r * 0.06, r * 0.12, r * 0.03); g.fill();
      g.fillStyle = '#ff6a9a'; g.beginPath(); g.arc(0, -r * 0.42, r * 0.04, 0, 7); g.fill();
    } else if (kind === 'lavadrop') {
      g.fillStyle = '#2b2426'; g.beginPath(); g.ellipse(0, -r * 0.06, r * 0.14, r * 0.1, 0, 0, 7); g.fill();
      const b = Math.sin(t * 4 + seed) * 0.5 + 0.5, gr = g.createRadialGradient(0, -r * 0.18, 0, 0, -r * 0.18, r * 0.16); gr.addColorStop(0, '#fff3b0'); gr.addColorStop(0.5, '#ff9a2a'); gr.addColorStop(1, '#e8432a');
      g.fillStyle = gr; g.beginPath(); g.arc(0, -r * (0.16 + b * 0.04), r * (0.09 + b * 0.02), 0, 7); g.fill();
      const ph = (t * 0.8 + seed) % 1; g.fillStyle = `rgba(255,140,40,${1 - ph})`; g.beginPath(); g.arc(r * 0.05, -r * 0.3 - ph * r * 0.3, r * 0.035 * (1 - ph * 0.5), 0, 7); g.fill();
    } else if (kind === 'star') {
      const k = 1 + 0.08 * Math.sin(t * 3 + seed); g.save(); g.translate(0, -r * 0.24); g.rotate(Math.sin(t + seed) * 0.25); g.scale(k, k);
      const gl = g.createRadialGradient(0, 0, 0, 0, 0, r * 0.35); gl.addColorStop(0, 'rgba(255,240,160,0.6)'); gl.addColorStop(1, 'rgba(255,240,160,0)'); g.fillStyle = gl; g.beginPath(); g.arc(0, 0, r * 0.35, 0, 7); g.fill();
      g.fillStyle = '#ffd34d'; g.strokeStyle = '#b08a20'; g.beginPath(); for (let a = 0; a < 10; a++) { const rr = a % 2 ? r * 0.08 : r * 0.19, an = -Math.PI / 2 + a * Math.PI / 5; g.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); } g.closePath(); g.fill(); g.stroke();
      g.restore();
    } else if (kind === 'moon') {
      g.save(); g.translate(0, -r * 0.24); g.rotate(-0.4 + Math.sin(t * 1.2 + seed) * 0.1);
      g.fillStyle = '#fff3b0'; g.strokeStyle = '#b8a040'; g.beginPath(); g.arc(0, 0, r * 0.17, 0.6, Math.PI * 2 - 0.6); g.arc(r * 0.1, -r * 0.03, r * 0.13, Math.PI * 2 - 0.9, 0.9, true); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = '#ffffff'; const tw = 0.5 + 0.5 * Math.sin(t * 5 + seed); g.globalAlpha *= tw; g.beginPath(); g.arc(r * 0.2, -r * 0.16, r * 0.03, 0, 7); g.fill(); g.globalAlpha /= Math.max(0.01, tw);
      g.restore();
    } else if (kind === 'gear') {
      g.save(); g.translate(0, -r * 0.22); g.rotate(t * 1.5 + seed);
      g.fillStyle = '#b8c2ce'; g.strokeStyle = '#4a5666';
      g.beginPath(); for (let a = 0; a < 16; a++) { const rr = a % 2 ? r * 0.13 : r * 0.18, an = a * Math.PI / 8; g.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); } g.closePath(); g.fill(); g.stroke();
      g.fillStyle = '#4a5666'; g.beginPath(); g.arc(0, 0, r * 0.05, 0, 7); g.fill();
      g.restore();
    }
  },

  // Idle behaviour per clan. Returns body lift, squash, paper-flip (for Air's twirl), pose and face override.
  //   Air (Zephi): floats on the breeze, twirls around.
  //   Water (Drip): jiggles like jelly, does a splash-hop.
  //   Fire (Pyra): bounces on its toes like a boxer, fist-pumps.
  //   Earth (Pebble): slow sturdy breathing, stomps the ground then flexes.
  idle(r, el, mood, walk, out, t, seed, o) {
    if (el >= 4) el = EL_BASE[el];
    const res = { lift: 0, sq: 0, flip: 1, pose: null, pp: -1, face: null };
    const calm = !out && walk < 0.1 && !o.noIdle && !o.noFeet && el >= 0 && (mood === 'happy' || mood === 'neutral' || mood === 'determined' || mood === 'sleepy');
    if (!calm) return res;
    const per = 6.5 + el * 0.4, k = ((t + seed * 1.37) % per) / per;
    const pp = k > 0.8 ? (k - 0.8) / 0.2 : -1;
    const posing = pp >= 0 && mood !== 'determined';
    if (el === 0) {
      res.lift = r * (0.12 + 0.08 * Math.sin(t * 2.2 + seed));
      if (posing) { res.flip = Math.cos(pp * Math.PI * 2); res.lift += Math.sin(pp * Math.PI) * r * 0.3; res.pose = 'spin'; }
    } else if (el === 1) {
      res.sq = Math.sin(t * 5 + seed) * 0.05;
      if (posing) {
        const h = Math.sin(Math.min(1, pp / 0.75) * Math.PI);
        res.lift = pp < 0.75 ? h * r * 0.6 : 0;
        res.sq = pp < 0.08 ? -0.14 : pp > 0.75 ? 0.2 * (1 - (pp - 0.75) / 0.25) : 0.08;
        res.pose = 'splash';
      }
    } else if (el === 2) {
      res.lift = Math.abs(Math.sin(t * 8 + seed)) * r * 0.07;
      if (posing) { res.lift += Math.sin(pp * Math.PI) * r * 0.18; res.pose = 'pump'; }
    } else if (el === 3) {
      res.sq = Math.sin(t * 1.6 + seed) * 0.035;
      if (posing) {
        if (pp < 0.35) { res.lift = Math.sin(pp / 0.35 * Math.PI / 2) * r * 0.35; res.pose = 'stomp'; }
        else if (pp < 0.42) { res.lift = r * 0.35 * (1 - (pp - 0.35) / 0.07); res.pose = 'stomp'; }
        else { res.sq = pp < 0.55 ? 0.14 * (1 - (pp - 0.42) / 0.13) : 0; res.pose = 'flex'; }
      }
    }
    res.pp = pp;
    return res;
  },
  // effects that go with the signature poses (back = drawn behind the body)
  poseFx(g, r, el, pose, pp, t, back) {
    g.save();
    if (pose === 'spin' && !back) {
      g.strokeStyle = 'rgba(220,240,255,0.85)'; g.lineWidth = Math.max(1.5, r * 0.07); g.lineCap = 'round';
      for (let k = 0; k < 3; k++) { const a = pp * 14 + k * 2.1, rr = r * (1.25 + k * 0.18); g.beginPath(); g.ellipse(0, r * 0.2 - k * r * 0.35, rr, rr * 0.3, 0, a, a + 2.2); g.stroke(); }
    }
    if (pose === 'splash' && !back && pp > 0.72) {
      const q = (pp - 0.72) / 0.28;
      for (let k = 0; k < 8; k++) { const a = Math.PI + (k / 7) * Math.PI, d = r * (0.6 + q * 1.1); g.fillStyle = `rgba(120,190,255,${1 - q})`; g.beginPath(); g.ellipse(Math.cos(a) * d, r * 1.15 + Math.sin(a) * d * 0.6 - q * r * 0.2, r * 0.07, r * 0.11, 0, 0, 7); g.fill(); }
      g.strokeStyle = `rgba(160,215,255,${1 - q})`; g.lineWidth = r * 0.05; g.beginPath(); g.ellipse(0, r * 1.3, r * (0.6 + q), r * (0.12 + q * 0.15), 0, 0, 7); g.stroke();
    }
    if (pose === 'pump' && back) {
      for (let k = 0; k < 7; k++) { const a = -Math.PI / 2 + (k - 3) * 0.35, h = r * (0.5 + 0.35 * Math.sin(t * 12 + k)) * Math.sin(pp * Math.PI); g.fillStyle = k % 2 ? 'rgba(255,200,60,0.85)' : 'rgba(255,110,40,0.8)'; g.beginPath(); g.moveTo(Math.cos(a - 0.15) * r, Math.sin(a - 0.15) * r); g.quadraticCurveTo(Math.cos(a) * (r + h * 1.8), Math.sin(a) * (r + h * 1.8), Math.cos(a + 0.15) * r, Math.sin(a + 0.15) * r); g.fill(); }
    }
    if ((pose === 'flex' || pose === 'stomp') && back && pp > 0.4 && pp < 0.75) {
      const q = (pp - 0.4) / 0.35;
      for (let s = -1; s <= 1; s += 2) for (let k = 0; k < 3; k++) { g.fillStyle = `rgba(190,160,110,${0.7 * (1 - q)})`; g.beginPath(); g.arc(s * r * (0.5 + q * 0.9 + k * 0.2), r * 1.25 - q * r * 0.3 - k * r * 0.12, r * (0.14 + q * 0.12), 0, 7); g.fill(); }
      g.fillStyle = `rgba(120,90,60,${1 - q})`; for (let k = 0; k < 4; k++) { g.beginPath(); g.arc((k - 1.5) * r * 0.5, r * 1.2 - Math.sin(q * Math.PI) * r * (0.4 + k % 2 * 0.3), r * 0.06, 0, 7); g.fill(); }
    }
    g.restore();
  },
  // celebration flourish for strong happy emotions, unique per clan
  flourish(g, r, el, mood, t, seed) {
    if (el >= 4) el = EL_BASE[el];
    if (!['cheer', 'laugh', 'starry', 'proud', 'love'].includes(mood) || el < 0) return;
    g.save();
    if (el === 0) { g.strokeStyle = 'rgba(225,240,255,0.75)'; g.lineWidth = Math.max(1.5, r * 0.06); g.lineCap = 'round'; for (let k = 0; k < 3; k++) { const a = t * 5 + k * 2.1; g.beginPath(); g.ellipse(0, -r * 0.1, r * 1.45, r * 0.5, -0.2, a, a + 1.6); g.stroke(); } }
    if (el === 1) for (let k = 0; k < 6; k++) { const ph = (t * 1.2 + k / 6) % 1, side = k % 2 ? 1 : -1; const x = side * ph * r * 1.2, y = -r * 1.1 - Math.sin(ph * Math.PI) * r * 0.9 + ph * r * 0.5; g.fillStyle = `rgba(110,185,255,${1 - ph * 0.7})`; g.beginPath(); g.ellipse(x, y, r * 0.06, r * 0.09, 0, 0, 7); g.fill(); }
    if (el === 2) for (let k = 0; k < 5; k++) { const ph = (t * 1.6 + k / 5) % 1; const x = (k - 2) * r * 0.45, y = r * 0.9 - ph * r * 2.4; g.fillStyle = `rgba(255,${130 + k * 25},40,${(1 - ph) * 0.9})`; g.beginPath(); g.moveTo(x - r * 0.08, y); g.quadraticCurveTo(x, y - r * 0.3, x + r * 0.08, y); g.quadraticCurveTo(x, y + r * 0.08, x - r * 0.08, y); g.fill(); }
    if (el === 3) for (let k = 0; k < 4; k++) { const a = t * 2.5 + k * Math.PI / 2; const x = Math.cos(a) * r * 1.45, y = Math.sin(a) * r * 0.45 - r * 0.1; if (k % 2) { g.fillStyle = '#8a7a66'; g.beginPath(); g.arc(x, y, r * 0.1, 0, 7); g.fill(); } else { g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = '#7ccf4a'; g.beginPath(); g.ellipse(0, 0, r * 0.13, r * 0.06, 0, 0, 7); g.fill(); g.restore(); } }
    g.restore();
  },

  // light the round body like a soft toy under the sun (upper right in screen space)
  lightPass(g, r, lx) {
    g.save(); g.beginPath(); g.arc(0, 0, r * 1.01, 0, 7); g.clip();
    // form shadow on the side away from the sun
    const sh = g.createRadialGradient(-lx * r * 0.62, r * 0.7, r * 0.05, -lx * r * 0.32, r * 0.35, r * 1.45);
    sh.addColorStop(0, 'rgba(150,45,30,0.26)'); sh.addColorStop(0.6, 'rgba(150,45,30,0.08)'); sh.addColorStop(1, 'rgba(110,30,20,0)');
    g.fillStyle = sh; g.fillRect(-r * 1.2, -r * 1.2, r * 2.4, r * 2.4);
    // cool sky fill along the top edge
    const sky = g.createLinearGradient(0, -r, 0, -r * 0.45); sky.addColorStop(0, 'rgba(190,225,255,0.22)'); sky.addColorStop(1, 'rgba(190,225,255,0)');
    g.fillStyle = sky; g.fillRect(-r, -r, r * 2, r * 0.6);
    // sun rim: soft wide glow plus a crisp edge
    g.lineCap = 'round';
    const a0 = lx > 0 ? -0.65 : Math.PI - 0.25, a1 = lx > 0 ? 0.25 : Math.PI + 0.65;
        g.strokeStyle = 'rgba(255,250,230,0.2)'; g.lineWidth = r * 0.03; g.beginPath(); g.arc(0, 0, r * 0.97, a0, a1); g.stroke();
    // satin specular with a tiny sharp glint
    const sx = lx * r * 0.36, sy = -r * 0.56;
    const sp = g.createRadialGradient(sx, sy, 0, sx, sy, r * 0.34);
    sp.addColorStop(0, 'rgba(255,255,255,0.38)'); sp.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = sp; g.fillRect(-r, -r, r * 2, r * 2);
    g.fillStyle = 'rgba(255,255,255,0.8)'; g.beginPath(); g.ellipse(sx + lx * r * 0.04, sy - r * 0.03, r * 0.07, r * 0.04, lx * 0.6, 0, 7); g.fill();
    g.restore();
  },
  blushAt(g, r, skin, a = 1) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= Math.min(1, a); g.translate(-r * 0.3, r * 0.2); g.scale(1, 0.6);
    const bg = g.createRadialGradient(0, 0, 0, 0, 0, r * 0.2 * (a > 1 ? Math.min(1.3, a) : 1));
    bg.addColorStop(0, skin.blush); bg.addColorStop(1, 'rgba(255,96,110,0)');
    g.fillStyle = bg; g.beginPath(); g.arc(0, 0, r * 0.22 * (a > 1 ? 1.3 : 1), 0, 7); g.fill(); g.restore();
  },
  // the extended emotions: returns true when it drew the whole face
  faceEx(g, r, mood, t, seed, skin) {
    const ink = '#2a1410';
    const ex = -r * 0.42, ey = -r * 0.11, ew = r * 0.185, eh = r * 0.245, mx = -r * 0.8, my = r * 0.3;
    const lw = Math.max(1, r * 0.05);
    const eye = (sc = 1, pr = 0.68, lid = 0, pdx = -0.25, pdy = 0.08) => this.eyeball(g, ex, ey, ew * sc, eh * sc, pr, lid, pdx, pdy, skin, r);
    const brow = (x1, y1, x2, y2, w = 1) => { g.strokeStyle = ink; g.lineWidth = lw * w; g.beginPath(); g.moveTo(ex + x1 * ew, ey + y1 * eh); g.lineTo(ex + x2 * ew, ey + y2 * eh); g.stroke(); };
    const blush = (a = 1) => this.blushAt(g, r, skin, a);
    g.lineCap = 'round'; g.lineJoin = 'round';
    // ---- resting faces: open eyes, closed mouth, a different personality per clan
    if ((mood === 'happy' || mood === 'neutral') && this._el >= 0) {
      const blink = ((t + seed * 1.7) % 3.6) < 0.12;
      const shut = () => { g.strokeStyle = ink; g.lineWidth = Math.max(1.2, r * 0.06); g.beginPath(); g.moveTo(ex - ew, ey + eh * 0.15); g.quadraticCurveTo(ex, ey + eh * 0.45, ex + ew, ey + eh * 0.15); g.stroke(); };
      const lashes = (n, sc = 1) => { g.strokeStyle = ink; g.lineWidth = Math.max(0.8, r * 0.035); for (let k = 0; k < n; k++) { const a = -Math.PI / 2 + 0.25 + k * 0.32; g.beginPath(); g.moveTo(ex + Math.cos(a) * ew * sc, ey + Math.sin(a) * eh * sc); g.lineTo(ex + Math.cos(a) * ew * sc * 1.45 + r * 0.02, ey + Math.sin(a) * eh * sc * 1.3); g.stroke(); } };
      const lineMouth = (pts) => { g.strokeStyle = ink; g.lineWidth = lw; g.beginPath(); g.moveTo(mx + pts[0] * r, my + pts[1] * r); g.quadraticCurveTo(mx + pts[2] * r, my + pts[3] * r, mx + pts[4] * r, my + pts[5] * r); g.stroke(); };
      const look = Math.sin(t * 0.7 + seed * 2.3) * 0.12; // eyes drift around a little
      switch (PERSONA[this._el]) {
        case 0: // Zephi (Air): curious and cute - big round eye, lifted brow, pursed "o" lips
          blush(0.8);
          if (blink) shut(); else { eye(1.12, 0.6, 0, -0.3 + look, -0.05); lashes(2, 1.12); }
          g.strokeStyle = ink; g.lineWidth = lw; g.beginPath(); g.moveTo(ex - ew * 1.1, ey - eh * 1.45); g.quadraticCurveTo(ex, ey - eh * 1.85, ex + ew * 1.0, ey - eh * 1.5); g.stroke();
          g.fillStyle = '#e0606e'; g.strokeStyle = ink; g.lineWidth = lw; g.beginPath(); g.ellipse(mx - r * 0.02, my, r * 0.065, r * 0.07, 0, 0, 7); g.fill(); g.stroke();
          g.fillStyle = '#7a2030'; g.beginPath(); g.ellipse(mx - r * 0.035, my, r * 0.022, r * 0.03, 0, 0, 7); g.fill();
          return true;
        case 1: { // Drip (Water): sweet and gentle - sparkly eye, long lashes, rosy cheeks, tiny closed smile
          blush(1.25);
          g.fillStyle = 'rgba(255,255,255,0.55)'; g.beginPath(); g.arc(-r * 0.24, r * 0.16, r * 0.035, 0, 7); g.fill();
          if (blink) shut(); else {
            eye(1.06, 0.74, 0, -0.22 + look, 0.1);
            g.fillStyle = '#fff'; g.beginPath(); g.arc(ex - ew * 0.02, ey + eh * 0.38, ew * 0.16, 0, 7); g.fill();
            const tw = 0.5 + 0.5 * Math.sin(t * 4 + seed); g.fillStyle = `rgba(255,255,255,${0.6 + tw * 0.4})`; g.save(); g.translate(ex - ew * 0.55, ey - eh * 0.25); g.rotate(t); const q = ew * 0.12 * (0.7 + tw * 0.5); g.fillRect(-q * 2, -q * 0.35, q * 4, q * 0.7); g.fillRect(-q * 0.35, -q * 2, q * 0.7, q * 4); g.restore();
            lashes(3, 1.06);
          }
          g.strokeStyle = ink; g.lineWidth = lw * 0.8; g.beginPath(); g.moveTo(ex - ew * 0.9, ey - eh * 1.42); g.quadraticCurveTo(ex, ey - eh * 1.62, ex + ew * 0.8, ey - eh * 1.35); g.stroke();
          lineMouth([-0.09, -0.01, 0.0, 0.07, 0.08, -0.01]);
          return true;
        }
        case 2: // Pyra (Fire): confident - sharp brow, focused eye, closed half-smirk
          blush(0.55);
          if (blink) shut(); else eye(1, 0.62, 0.14, -0.38 + look * 0.5, 0.12);
          brow(-1.35, -1.05, 1.15, -1.35, 1.5);
          g.strokeStyle = ink; g.lineWidth = lw; g.beginPath(); g.moveTo(mx - r * 0.1, my + r * 0.01); g.lineTo(mx + r * 0.06, my + r * 0.02); g.quadraticCurveTo(mx + r * 0.14, my + r * 0.015, mx + r * 0.17, my - r * 0.06); g.stroke();
          g.lineWidth = lw * 0.7; g.beginPath(); g.moveTo(mx + r * 0.15, my - r * 0.1); g.lineTo(mx + r * 0.2, my - r * 0.03); g.stroke();
          return true;
        case 3: // Pebble (Earth): calm and smug - relaxed half-lidded eye, quiet knowing smirk
          blush(0.65);
          if (blink) shut(); else eye(1, 0.62, 0.38, -0.3 + look * 0.4, 0.3);
          brow(-1.2, -1.35, 1.1, -1.4, 1.2);
          lineMouth([-0.11, -0.04, -0.02, 0.04, 0.1, 0.01]);
          g.strokeStyle = ink; g.lineWidth = lw * 0.7; g.beginPath(); g.moveTo(mx - r * 0.14, my - r * 0.07); g.quadraticCurveTo(mx - r * 0.125, my - r * 0.02, mx - r * 0.1, my - r * 0.03); g.stroke();
          return true;
      }
    }
    // ---- game-face (focused, ready to play): also different per clan
    if (mood === 'determined' && this._el >= 0) {
      const blink = ((t + seed * 1.7) % 3.6) < 0.12;
      const shut = () => { g.strokeStyle = ink; g.lineWidth = Math.max(1.2, r * 0.06); g.beginPath(); g.moveTo(ex - ew, ey + eh * 0.2); g.lineTo(ex + ew, ey + eh * 0.2); g.stroke(); };
      switch (PERSONA[this._el]) {
        case 0: { // Zephi: happy-go-lucky - bright smiling eye, carefree arched brow, big joyful open smile
          blush(1.2);
          if (blink) shut(); else {
            eye(1.1, 0.62, 0, -0.3, -0.08);
            g.fillStyle = skin.mid; g.beginPath(); g.ellipse(ex, ey + eh * 1.35, ew * 1.4, eh * 0.6, 0, 0, 7); g.fill(); // cheek pushes up: smiling eye
          }
          g.strokeStyle = ink; g.lineWidth = lw; g.beginPath(); g.moveTo(ex - ew * 1.1, ey - eh * 1.4); g.quadraticCurveTo(ex, ey - eh * 2.0, ex + ew * 1.0, ey - eh * 1.55); g.stroke();
          g.fillStyle = '#c23a4a'; g.lineWidth = lw; g.beginPath(); g.moveTo(mx - r * 0.15, my - r * 0.05); g.quadraticCurveTo(mx + r * 0.04, my + r * 0.28, mx + r * 0.22, my - r * 0.05); g.closePath(); g.fill(); g.stroke();
          g.fillStyle = '#ff8a9a'; g.beginPath(); g.ellipse(mx + r * 0.04, my + r * 0.08, r * 0.07, r * 0.04, 0, 0, 7); g.fill();
          const ph = (t * 0.9 + seed) % 1, nx = r * (0.5 + ph * 0.5), ny = -r * (1.15 + ph * 0.6) + Math.sin(ph * 9) * r * 0.06; // happy little tune
          g.fillStyle = `rgba(80,110,170,${1 - ph})`; g.font = `bold ${Math.round(r * 0.32)}px Georgia`; g.textAlign = 'center'; g.save(); g.scale(-1, 1); g.fillText(ph < 0.5 ? '\u266A' : '\u266B', -nx, ny); g.restore();
          return true;
        }
        case 1: // Drip: concentrating hard - big glossy eye, worried brow, biting the lip
          blush(1.1);
          if (blink) shut(); else { eye(1.05, 0.72, 0, -0.35, 0.05); g.fillStyle = '#fff'; g.beginPath(); g.arc(ex - ew * 0.05, ey + eh * 0.4, ew * 0.15, 0, 7); g.fill(); }
          brow(-1.2, -1.25, 1.0, -1.6, 1);
          g.strokeStyle = ink; g.lineWidth = lw; g.beginPath(); g.moveTo(mx - r * 0.1, my); g.lineTo(mx + r * 0.08, my); g.stroke();
          g.fillStyle = '#fff'; g.fillRect(mx - r * 0.04, my, r * 0.05, r * 0.035); g.strokeStyle = ink; g.lineWidth = lw * 0.5; g.strokeRect(mx - r * 0.04, my, r * 0.05, r * 0.035);
          return true;
        case 2: // Pyra: smug - lazy half-lid eye, one cocky raised brow, closed smirk curling up
          blush(0.6);
          if (blink) shut(); else eye(1, 0.6, 0.36, -0.45, 0.28);
          g.strokeStyle = ink; g.lineWidth = lw * 1.4; g.beginPath(); g.moveTo(ex - ew * 1.25, ey - eh * 1.1); g.quadraticCurveTo(ex, ey - eh * 1.75, ex + ew * 1.15, ey - eh * 1.55); g.stroke();
          g.lineWidth = lw * 1.1; g.beginPath(); g.moveTo(mx - r * 0.09, my + r * 0.03); g.quadraticCurveTo(mx + r * 0.08, my + r * 0.07, mx + r * 0.22, my - r * 0.08); g.stroke();
          g.lineWidth = lw * 0.7; g.beginPath(); g.moveTo(mx + r * 0.19, my - r * 0.12); g.quadraticCurveTo(mx + r * 0.25, my - r * 0.08, mx + r * 0.24, my - r * 0.03); g.stroke();
          return true;
        case 3: // Pebble: locked in - heavy half-lid, low flat brow, mouth set in a hard line
          blush(0.35);
          if (blink) shut(); else eye(1, 0.58, 0.5, -0.45, 0.32);
          brow(-1.35, -1.0, 1.15, -1.1, 1.9);
          g.strokeStyle = ink; g.lineWidth = lw * 1.2; g.beginPath(); g.moveTo(mx - r * 0.12, my + r * 0.01); g.lineTo(mx + r * 0.1, my + r * 0.01); g.stroke();
          return true;
      }
    }
    switch (mood) {
      case 'evil': {
        blush(0.6);
        eye(1, 0.45, 0.42, -0.45, 0.25);
        brow(-1.3, -0.55, 1.2, -1.35, 1.6);
        // huge sinister grin with teeth
        g.fillStyle = '#5a1020'; g.strokeStyle = ink; g.lineWidth = lw;
        g.beginPath(); g.moveTo(mx - r * 0.12, my - r * 0.12); g.quadraticCurveTo(mx + r * 0.2, my + r * 0.32, mx + r * 0.5, my - r * 0.18); g.quadraticCurveTo(mx + r * 0.2, my + r * 0.02, mx - r * 0.12, my - r * 0.12); g.fill(); g.stroke();
        g.fillStyle = '#fff'; g.beginPath(); g.moveTo(mx - r * 0.08, my - r * 0.09); g.quadraticCurveTo(mx + r * 0.2, my + r * 0.05, mx + r * 0.45, my - r * 0.15); g.lineTo(mx + r * 0.4, my - r * 0.08); g.quadraticCurveTo(mx + r * 0.2, my + r * 0.1, mx - r * 0.04, my - r * 0.04); g.fill();
        return true;
      }
      case 'laugh': {
        blush(1.3);
        g.strokeStyle = ink; g.lineWidth = lw * 1.5; g.beginPath(); g.moveTo(ex - ew, ey - eh * 0.4); g.lineTo(ex + ew * 0.2, ey + eh * 0.1); g.lineTo(ex - ew * 0.9, ey + eh * 0.55); g.stroke();
        for (let k = 0; k < 2; k++) { const ph = (t * 2 + k * 0.5) % 1; g.fillStyle = `rgba(140,210,255,${1 - ph})`; g.beginPath(); g.ellipse(ex - ew * 1.3 - ph * r * 0.4, ey - ph * r * 0.2 + ph * ph * r * 0.5, r * 0.05, r * 0.07, 0, 0, 7); g.fill(); }
        const open = 0.18 + Math.abs(Math.sin(t * 14)) * 0.08;
        g.fillStyle = '#5a1020'; g.strokeStyle = ink; g.lineWidth = lw;
        g.beginPath(); g.moveTo(mx - r * 0.12, my - r * 0.06); g.lineTo(mx + r * 0.3, my - r * 0.1); g.quadraticCurveTo(mx + r * 0.15, my + r * open * 2.2, mx - r * 0.12, my - r * 0.06); g.fill(); g.stroke();
        g.fillStyle = '#ff7a8a'; g.beginPath(); g.ellipse(mx + r * 0.08, my + r * open * 0.9, r * 0.08, r * 0.05, 0, 0, 7); g.fill();
        return true;
      }
      case 'cry': {
        blush(1.2);
        brow(-1.2, -1.5, 1.1, -0.95, 1.2);
        g.strokeStyle = ink; g.lineWidth = lw * 1.4; g.beginPath(); g.arc(ex, ey + eh * 0.1, ew * 0.95, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
        // tear rivers
        g.fillStyle = 'rgba(140,210,255,0.55)'; g.beginPath(); rrPath(g, ex - ew * 0.5, ey, ew * 0.5, r * 0.9, ew * 0.25); g.fill();
        for (let k = 0; k < 4; k++) { const ph = (t * 1.8 + k / 4) % 1; g.fillStyle = `rgba(100,190,255,${1 - ph * 0.6})`; g.beginPath(); g.ellipse(ex - ew * 0.25 + Math.sin(k) * 2, ey + ph * r * 1.0, r * 0.05, r * 0.08, 0, 0, 7); g.fill(); }
        // wobbly bawling mouth
        g.fillStyle = '#5a1020'; g.strokeStyle = ink; g.lineWidth = lw;
        const wob = Math.sin(t * 25) * r * 0.02;
        g.beginPath(); g.ellipse(mx + r * 0.05, my + r * 0.04 + wob, r * 0.14, r * 0.1 + wob, 0, 0, 7); g.fill(); g.stroke();
        return true;
      }
      case 'shock': {
        blush(0.5);
        brow(-1.1, -1.9, 1.1, -2.1, 1.2);
        eye(1.45, 0.25, 0, -0.2, 0);
        g.fillStyle = '#5a1020'; g.strokeStyle = ink; g.lineWidth = lw;
        g.beginPath(); g.ellipse(mx + r * 0.02, my + r * 0.12, r * 0.1, r * 0.22, 0, 0, 7); g.fill(); g.stroke();
        return true;
      }
      case 'angry': {
        brow(-1.3, -0.5, 1.2, -1.4, 2);
        eye(1, 0.55, 0.35, -0.3, 0.2);
        g.fillStyle = '#fff'; g.strokeStyle = ink; g.lineWidth = lw;
        g.beginPath(); rrPath(g, mx - r * 0.12, my - r * 0.05, r * 0.32, r * 0.13, r * 0.04); g.fill(); g.stroke();
        g.beginPath(); for (let k = 1; k < 4; k++) { g.moveTo(mx - r * 0.12 + k * r * 0.08, my - r * 0.05); g.lineTo(mx - r * 0.12 + k * r * 0.08, my + r * 0.08); } g.moveTo(mx - r * 0.12, my + r * 0.015); g.lineTo(mx + r * 0.2, my + r * 0.015); g.stroke();
        return true;
      }
      case 'smug': {
        blush(0.8);
        brow(-1.1, -1.3, 1.1, -1.55, 1);
        eye(1, 0.6, 0.5, -0.55, 0.3);
        g.strokeStyle = ink; g.lineWidth = lw * 1.2; g.beginPath(); g.moveTo(mx - r * 0.08, my + r * 0.02); g.quadraticCurveTo(mx + r * 0.15, my + r * 0.06, mx + r * 0.28, my - r * 0.1); g.stroke();
        return true;
      }
      case 'starry': {
        blush(1.3);
        g.save(); g.translate(ex, ey); g.rotate(Math.sin(t * 3) * 0.3); const sc = 1 + Math.sin(t * 10) * 0.1;
        g.fillStyle = '#ffd34d'; g.strokeStyle = '#a8790a'; g.lineWidth = lw * 0.8; g.beginPath();
        for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = (k % 2 ? ew * 0.55 : ew * 1.35) * sc; k ? g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : g.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
        g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#fff'; g.beginPath(); g.arc(-ew * 0.3, -ew * 0.3, ew * 0.25, 0, 7); g.fill(); g.restore();
        g.fillStyle = '#5a1020'; g.strokeStyle = ink; g.lineWidth = lw;
        g.beginPath(); g.moveTo(mx - r * 0.14, my - r * 0.05); g.quadraticCurveTo(mx + r * 0.06, my + r * 0.3, mx + r * 0.26, my - r * 0.06); g.closePath(); g.fill(); g.stroke();
        return true;
      }
      case 'sick': {
        eye(0.9, 0.5, 0.45, -0.1, 0.3);
        g.fillStyle = 'rgba(80,60,120,0.35)'; g.beginPath(); g.ellipse(ex, ey + eh * 1.05, ew * 0.9, eh * 0.25, 0, 0, 7); g.fill();
        g.strokeStyle = ink; g.lineWidth = lw; g.beginPath(); g.moveTo(mx - r * 0.12, my); for (let k = 0; k <= 5; k++) g.lineTo(mx - r * 0.12 + k * r * 0.06, my + (k % 2 ? -1 : 1) * r * 0.04 + Math.sin(t * 6) * r * 0.01); g.stroke();
        return true;
      }
      case 'nervous': {
        blush(0.6);
        brow(-1.1, -1.4, 1.1, -1.1, 1);
        eye(1.05, 0.5, 0, -0.25 + Math.sin(t * 9) * 0.5, 0.05);
        g.strokeStyle = ink; g.lineWidth = lw; g.beginPath(); g.moveTo(mx - r * 0.1, my); for (let k = 0; k <= 4; k++) g.lineTo(mx - r * 0.1 + k * r * 0.07, my + (k % 2 ? -1 : 1) * r * 0.035); g.stroke();
        return true;
      }
      case 'sad': {
        blush(0.5);
        brow(-1.2, -1.55, 1.1, -1.05, 1.1);
        eye(1, 0.62, 0.3, -0.25, 0.35);
        g.strokeStyle = ink; g.lineWidth = lw * 1.1; g.beginPath(); g.arc(mx + r * 0.05, my + r * 0.12, r * 0.12, Math.PI * 1.15, Math.PI * 1.85); g.stroke();
        return true;
      }
      case 'effort': {
        blush(1.4);
        brow(-1.3, -0.6, 1.2, -1.25, 1.6);
        g.strokeStyle = ink; g.lineWidth = lw * 1.5; g.beginPath(); g.moveTo(ex - ew * 1.0, ey - eh * 0.45); g.lineTo(ex + ew * 0.5, ey); g.lineTo(ex - ew * 1.0, ey + eh * 0.45); g.stroke();
        g.fillStyle = '#fff'; g.strokeStyle = ink; g.lineWidth = lw; g.beginPath(); rrPath(g, mx - r * 0.12, my - r * 0.06, r * 0.34, r * 0.14, r * 0.05); g.fill(); g.stroke();
        g.beginPath(); g.moveTo(mx - r * 0.12, my + r * 0.01); g.lineTo(mx + r * 0.22, my + r * 0.01); g.stroke();
        return true;
      }
      case 'love': {
        blush(1.6);
        g.save(); g.translate(ex, ey); const hs = ew * (1.25 + Math.sin(t * 9) * 0.12);
        g.fillStyle = '#ff4d7a'; g.strokeStyle = '#a8123a'; g.lineWidth = lw * 0.7; g.beginPath(); g.moveTo(0, hs * 0.9); g.bezierCurveTo(-hs * 1.4, -hs * 0.1, -hs * 0.6, -hs * 1.1, 0, -hs * 0.35); g.bezierCurveTo(hs * 0.6, -hs * 1.1, hs * 1.4, -hs * 0.1, 0, hs * 0.9); g.fill(); g.stroke();
        g.fillStyle = 'rgba(255,255,255,0.7)'; g.beginPath(); g.arc(-hs * 0.35, -hs * 0.3, hs * 0.2, 0, 7); g.fill(); g.restore();
        g.strokeStyle = ink; g.lineWidth = lw * 1.2; g.beginPath(); g.arc(mx + r * 0.04, my - r * 0.06, r * 0.13, Math.PI * 0.15, Math.PI * 0.95); g.stroke();
        return true;
      }
      case 'stoic': { // Pebble's victory: same calm half-lidded eye, firm flat brow, a tight knowing smirk
        blush(0.45);
        const bl = ((t + seed * 1.7) % 3.6) < 0.12;
        if (bl) { g.strokeStyle = ink; g.lineWidth = Math.max(1.2, r * 0.06); g.beginPath(); g.moveTo(ex - ew, ey + eh * 0.2); g.lineTo(ex + ew, ey + eh * 0.2); g.stroke(); }
        else eye(1, 0.6, 0.47, -0.34, 0.32);
        brow(-1.3, -1.12, 1.15, -1.18, 1.7);
        g.strokeStyle = ink; g.lineWidth = lw * 1.1; g.beginPath(); g.moveTo(mx - r * 0.13, my - r * 0.06); g.quadraticCurveTo(mx - r * 0.03, my + r * 0.03, mx + r * 0.1, my + r * 0.015); g.stroke();
        g.lineWidth = lw * 0.7; g.beginPath(); g.moveTo(mx - r * 0.16, my - r * 0.1); g.quadraticCurveTo(mx - r * 0.15, my - r * 0.04, mx - r * 0.12, my - r * 0.04); g.stroke();
        return true;
      }
      case 'grim': { // Pebble when things go wrong: narrowed glare, brow pushed down, flat frown - no tears
        blush(0.3);
        eye(1, 0.55, 0.4, -0.36, 0.3);
        brow(-1.35, -0.85, 1.15, -1.35, 1.8);
        g.strokeStyle = ink; g.lineWidth = lw * 1.1; g.beginPath(); g.moveTo(mx - r * 0.11, my + r * 0.04); g.quadraticCurveTo(mx, my - r * 0.02, mx + r * 0.11, my + r * 0.045); g.stroke();
        return true;
      }
      case 'proud': {
        blush(1);
        brow(-1.1, -1.5, 1.1, -1.6, 1);
        g.strokeStyle = ink; g.lineWidth = lw * 1.3; g.beginPath(); g.arc(ex, ey + eh * 0.35, ew * 0.9, Math.PI * 1.15, Math.PI * 1.85); g.stroke();
        g.beginPath(); g.arc(mx + r * 0.05, my - r * 0.08, r * 0.14, Math.PI * 0.15, Math.PI * 0.9); g.stroke();
        return true;
      }
    }
    return false;
  },

  // extra effects around the character for strong emotions
  moodFx(g, r, mood, t, seed) {
    if (mood === 'effort') for (let k = 0; k < 3; k++) { const ph = (t * 2 + k / 3) % 1; g.fillStyle = `rgba(150,210,255,${1 - ph})`; g.beginPath(); g.ellipse(r * (0.3 + k * 0.3) + ph * r * 0.4, -r * 0.7 + ph * r * 0.3, r * 0.05, r * 0.09, 0.5, 0, 7); g.fill(); }
    if (mood === 'love') for (let k = 0; k < 3; k++) { const ph = (t * 0.8 + k / 3) % 1; const x = (k - 1) * r * 0.6 + Math.sin(ph * 8 + k) * r * 0.15, y = -r * 1.1 - ph * r * 1.1, hs = r * 0.13 * (1 - ph * 0.4); g.fillStyle = `rgba(255,80,130,${1 - ph})`; g.beginPath(); g.moveTo(x, y + hs); g.bezierCurveTo(x - hs * 1.4, y, x - hs * 0.6, y - hs, x, y - hs * 0.35); g.bezierCurveTo(x + hs * 0.6, y - hs, x + hs * 1.4, y, x, y + hs); g.fill(); }
    if (mood === 'angry') for (let k = 0; k < 3; k++) { const ph = (t * 1.3 + k / 3) % 1; g.fillStyle = `rgba(255,255,255,${0.8 * (1 - ph)})`; g.beginPath(); g.arc((k - 1) * r * 0.45 + Math.sin(ph * 6) * r * 0.08, -r * 1.15 - ph * r * 0.8, r * (0.1 + ph * 0.18), 0, 7); g.fill(); }
    if (mood === 'nervous' || mood === 'sick') for (let k = 0; k < 2; k++) { const ph = (t * 0.9 + k * 0.5) % 1; g.fillStyle = `rgba(150,210,255,${1 - ph})`; g.beginPath(); g.ellipse(r * (0.2 + k * 0.45), -r * 0.6 + ph * r * 0.7, r * 0.06, r * 0.1, 0, 0, 7); g.fill(); }
    if (mood === 'starry') for (let k = 0; k < 5; k++) { const a = t * 2 + k * 1.26; const x = Math.cos(a) * r * 1.45, y = Math.sin(a) * r * 1.2 - r * 0.2; g.fillStyle = '#ffe680'; g.save(); g.translate(x, y); g.rotate(a * 2); const q = r * 0.09 * (1 + Math.sin(t * 8 + k) * 0.4); g.fillRect(-q * 2, -q * 0.4, q * 4, q * 0.8); g.fillRect(-q * 0.4, -q * 2, q * 0.8, q * 4); g.restore(); }
    if (mood === 'shock') { g.fillStyle = '#ff4d4d'; g.font = `bold ${Math.round(r * 0.5)}px Georgia`; g.textAlign = 'center'; g.save(); g.scale(-1, 1); g.fillText('!', r * 0.25, -r * 1.25 - Math.abs(Math.sin(t * 10)) * r * 0.15); g.fillText('!', -r * 0.2, -r * 1.35 - Math.abs(Math.sin(t * 10 + 1)) * r * 0.15); g.restore(); }
    if (mood === 'stoic' || mood === 'grim') { const ph = ((t + seed) % 2.6) / 2.6; if (ph > 0.15 && ph < 0.55) { const q = (ph - 0.15) / 0.4; for (let k = 0; k < 2; k++) { g.fillStyle = `rgba(235,225,205,${0.75 * (1 - q)})`; g.beginPath(); g.arc(-r * (1.05 + q * 0.55), r * (0.08 + k * 0.1) + q * r * 0.05 * (k ? 1 : -1), r * (0.07 + q * 0.09), 0, 7); g.fill(); } } }
    if (mood === 'evil') { g.strokeStyle = 'rgba(150,60,200,0.35)'; g.lineWidth = r * 0.06; for (let k = 0; k < 2; k++) { const rr = r * (1.15 + ((t * 0.8 + k * 0.5) % 1) * 0.5); g.globalAlpha *= 1; g.beginPath(); g.arc(0, 0, rr, 0, 7); g.stroke(); } }
  },

  face(g, r, mood, ly, t, seed, skin) {
    if (this.faceEx(g, r, mood, t, seed, skin)) return;
    const ink = '#2a1410';
    const ex = -r * 0.42, ey = -r * 0.11, ew = r * 0.185, eh = r * 0.245;
    const blink = ((t + seed * 1.7) % 3.6) < 0.12;
    g.lineCap = 'round'; g.lineJoin = 'round';
    this.blushAt(g, r, skin, 1);
    g.strokeStyle = ink; g.lineWidth = Math.max(1, r * 0.05);
    if (mood === 'determined' || mood === 'hurt') { g.beginPath(); g.moveTo(ex - ew * 1.1, ey - eh - r * 0.02); g.lineTo(ex + ew * 1.1, ey - eh + r * 0.08); g.stroke(); }
    else if (mood === 'scared') { g.beginPath(); g.moveTo(ex - ew, ey - eh - r * 0.1); g.lineTo(ex + ew, ey - eh - r * 0.16); g.stroke(); }
    if (mood === 'out') {
      g.lineWidth = Math.max(1.2, r * 0.07);
      g.beginPath(); g.moveTo(ex - ew, ey - ew); g.lineTo(ex + ew, ey + ew); g.moveTo(ex + ew, ey - ew); g.lineTo(ex - ew, ey + ew); g.stroke();
    } else if (mood === 'dizzy') {
      g.lineWidth = Math.max(1, r * 0.05); g.beginPath();
      for (let a = 0; a < 12; a += 0.3) { const rr = a / 12 * ew * 1.1; const px = ex + Math.cos(a + t * 8) * rr, py = ey + Math.sin(a + t * 8) * rr; a ? g.lineTo(px, py) : g.moveTo(px, py); }
      g.stroke();
    } else if (mood === 'cheer' || mood === 'sleepy' || (blink && mood !== 'scared')) {
      g.lineWidth = Math.max(1.2, r * 0.07); g.beginPath();
      if (mood === 'cheer') g.arc(ex, ey + eh * 0.35, ew * 0.9, Math.PI * 1.15, Math.PI * 1.85);
      else { g.moveTo(ex - ew, ey + eh * 0.2); g.quadraticCurveTo(ex, ey + eh * 0.5, ex + ew, ey + eh * 0.2); }
      g.stroke();
    } else if (mood === 'hurt') {
      g.lineWidth = Math.max(1.2, r * 0.07); g.beginPath(); g.moveTo(ex + ew, ey - eh * 0.6); g.lineTo(ex - ew * 0.6, ey); g.lineTo(ex + ew, ey + eh * 0.6); g.stroke();
    } else {
      const big = mood === 'scared' ? 1.2 : 1;
      this.eyeball(g, ex, ey, ew * big, eh * big, mood === 'scared' ? 0.42 : 0.68, 0, -0.25, ly * 0.3 + 0.08, skin, r);
      g.strokeStyle = ink; g.lineWidth = Math.max(0.8, r * 0.035);
      for (let k = 0; k < 3; k++) { const a = -Math.PI / 2 + 0.25 + k * 0.32; g.beginPath(); g.moveTo(ex + Math.cos(a) * ew * big, ey + Math.sin(a) * eh * big); g.lineTo(ex + Math.cos(a) * ew * big * 1.45 + r * 0.02, ey + Math.sin(a) * eh * big * 1.3); g.stroke(); }
    }
    const mx = -r * 0.8, my = r * 0.3;
    g.strokeStyle = ink; g.fillStyle = '#c23a4a'; g.lineWidth = Math.max(1, r * 0.05);
    g.beginPath();
    switch (mood) {
      case 'cheer': g.moveTo(mx - r * 0.14, my - r * 0.04); g.quadraticCurveTo(mx + r * 0.05, my + r * 0.26, mx + r * 0.22, my - r * 0.04); g.closePath(); g.fill(); g.stroke(); break;
      case 'scared': g.ellipse(mx, my, r * 0.08, r * 0.12, 0, 0, 7); g.fill(); g.stroke();
        g.fillStyle = '#9fd8ff'; g.beginPath(); g.ellipse(r * 0.15, -r * 0.38 + ((t * 0.8) % 0.4) * r, r * 0.06, r * 0.1, 0, 0, 7); g.fill(); break;
      case 'hurt': case 'dizzy': g.moveTo(mx - r * 0.1, my); for (let k = 0; k <= 4; k++) g.lineTo(mx - r * 0.1 + k * r * 0.07, my + (k % 2 ? -1 : 1) * r * 0.04); g.stroke(); break;
      case 'out': g.moveTo(mx - r * 0.1, my); g.lineTo(mx + r * 0.12, my); g.stroke(); g.fillStyle = '#ff7a8a'; g.beginPath(); g.ellipse(mx, my + r * 0.07, r * 0.05, r * 0.08, 0, 0, 7); g.fill(); break;
      case 'determined': g.moveTo(mx - r * 0.1, my); g.lineTo(mx + r * 0.12, my - r * 0.02); g.stroke(); break;
      case 'happy': g.arc(mx + r * 0.02, my - r * 0.06, r * 0.12, Math.PI * 0.2, Math.PI * 0.95); g.stroke(); break;
      default: // the signature pursed "o" lips
        g.fillStyle = '#e0606e'; g.ellipse(mx - r * 0.03, my, r * 0.09, r * 0.085, 0, 0, 7); g.fill(); g.stroke();
        g.fillStyle = '#7a2030'; g.beginPath(); g.ellipse(mx - r * 0.05, my, r * 0.03, r * 0.04, 0, 0, 7); g.fill();
    }
  },

  // floating mitten; front = the one in front of the body
  glove(g, r, C, mood, t, seed, walk, front) {
    const w = Math.sin(t * 10 + seed);
    const waving = (this._wave && mood !== 'scared') || (mood === 'happy' && ((t + seed) % 5) < 1.6);
    // Poses are chosen so the front hand never covers the eye (-0.42r,-0.12r), the nose or the mouth.
    let hx, hy, rot;
    const sw = walk ? Math.sin(t * 14 + (front ? 0 : Math.PI)) * r * 0.15 : 0;
    const limp = mood === 'hurt' || mood === 'dizzy' || mood === 'out' || mood === 'sad' || mood === 'cry';
    const ex = this.glovePose(r, mood, t, front);
    if (ex) { [hx, hy, rot] = ex; }
    else if (front) {
      if (mood === 'cheer') { hx = -r * 0.75; hy = -r * 1.25 + Math.sin(t * 14) * r * 0.1; rot = -2.5; }
      else if (mood === 'scared') { hx = -r * 1.32; hy = r * 0.38 + Math.sin(t * 40) * r * 0.03; rot = -1.9; }
      else if (waving) { hx = -r * 1.3; hy = -r * 0.5 + w * r * 0.12; rot = -2.3 + w * 0.3; }
      else if (mood === 'determined') { hx = -r * 1.2 + sw; hy = r * 0.62; rot = -1.4; }
      else if (limp) { hx = -r * 0.35; hy = r * 0.98; rot = 0.4; }
      else { hx = -r * 0.2 + sw; hy = r * 0.62; rot = -0.5; }
    } else {
      if (mood === 'cheer') { hx = r * 0.7; hy = -r * 1.22 + Math.sin(t * 14 + 1) * r * 0.1; rot = 2.5; }
      else if (mood === 'scared') { hx = r * 1.0; hy = -r * 0.3; rot = 2.0; }
      else if (limp) { hx = r * 0.75; hy = r * 0.98; rot = 0.3; }
      else { hx = r * 0.92 + sw; hy = r * 0.55; rot = 0.5; }
    }
    this.mitt(g, r, C, hx, hy, rot, front, mood);
  },

  // chubby cartoon fist: puffy palm, three knuckle bumps, a hugging thumb and a flared rolled cuff.
  // Local space: knuckles point to -x, cuff (wrist) to +x, thumb on the -y side.
  mitt(g, r, C, hx, hy, rot, front, mood, flip = false, openHand) {
    const s = r * 0.27, hi = r > 10, lw = Math.max(0.8, r * 0.034);
    const L = this.shade(C.glove, front ? 0.5 : 0.22), M = front ? this.shade(C.glove, 0) : this.shade(C.glove, -0.16), D = this.shade(C.glove, front ? -0.38 : -0.5);
    const ink = this.shade(C.glove, -0.65);
    const open = openHand !== undefined ? openHand : (mood === 'cheer' || mood === 'shock' || mood === 'starry' || this._wave); // open, waving hand
    g.save(); g.translate(hx, hy); g.rotate(rot); if (flip) g.scale(1, -1); // flip puts the thumb on the other side
    if (hi && front) { g.fillStyle = 'rgba(40,15,10,0.16)'; g.beginPath(); g.ellipse(s * 0.2, s * 0.3, s * 1.05, s * 0.85, 0, 0, 7); g.fill(); }
    const parts = open ? [
      ['e', 0, 0, s * 0.88, s * 0.8, 0],
      ['e', -s * 0.85, -s * 0.36, s * 0.42, s * 0.2, -0.12], ['e', -s * 0.95, 0.02 * s, s * 0.46, s * 0.21, 0], ['e', -s * 0.85, s * 0.4, s * 0.4, s * 0.19, 0.14],
      ['e', -s * 0.2, -s * 0.86, s * 0.38, s * 0.2, -0.9],
    ] : [
      ['e', 0, 0, s * 0.9, s * 0.84, 0],
      ['c', -s * 0.62, -s * 0.42, s * 0.34], ['c', -s * 0.72, 0, s * 0.36], ['c', -s * 0.62, s * 0.42, s * 0.34],
      ['e', -s * 0.32, -s * 0.76, s * 0.4, s * 0.25, -0.3],
    ];
    const path = q => { g.beginPath(); if (q[0] === 'c') g.arc(q[1], q[2], q[3], 0, 7); else g.ellipse(q[1], q[2], q[3], q[4], q[5], 0, 7); };
    // union outline: stroke every part thick, then fill on top
    g.strokeStyle = ink; g.lineWidth = lw * 2; g.lineJoin = 'round';
    parts.forEach(q => { path(q); g.stroke(); });
    let fill = M;
    if (hi) { const gg = g.createRadialGradient(-s * 0.4, -s * 0.5, s * 0.05, -s * 0.1, 0, s * 1.5); gg.addColorStop(0, L); gg.addColorStop(0.5, M); gg.addColorStop(1, D); fill = gg; }
    g.fillStyle = fill; parts.forEach(q => { path(q); g.fill(); });
    if (hi) {
      g.strokeStyle = ink; g.globalAlpha *= 0.4; g.lineWidth = lw * 0.8; g.lineCap = 'round';
      if (open) { for (const y of [-0.18, 0.21]) { g.beginPath(); g.moveTo(-s * 1.25, s * y); g.quadraticCurveTo(-s * 0.85, s * (y - 0.02), -s * 0.5, s * y * 0.8); g.stroke(); } }
      else { for (const y of [-0.22, 0.22]) { g.beginPath(); g.moveTo(-s * 1.06, s * y); g.quadraticCurveTo(-s * 0.8, s * y * 1.1, -s * 0.52, s * y * 0.8); g.stroke(); } }
      g.beginPath(); g.arc(-s * 0.32, -s * 0.76, s * 0.3, open ? 0.6 : 0.3, open ? 2.0 : 1.7); g.stroke(); // thumb seam
      g.globalAlpha /= 0.4;
      // soft sheen and knuckle glints
      g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.ellipse(-s * 0.15, -s * 0.38, s * 0.38, s * 0.15, -0.2, 0, 7); g.fill();
    }
    if (C.pattern === 'flame') { g.fillStyle = '#ffd34d'; g.beginPath(); g.moveTo(-s * 0.25, s * 0.3); g.quadraticCurveTo(-s * 0.05, -s * 0.6, s * 0.25, s * 0.3); g.quadraticCurveTo(0, s * 0.12, -s * 0.25, s * 0.3); g.fill(); g.fillStyle = 'rgba(255,250,210,0.85)'; g.beginPath(); g.moveTo(-s * 0.1, s * 0.28); g.quadraticCurveTo(0, -s * 0.15, s * 0.1, s * 0.28); g.fill(); }
    if (C.pattern === 'wave') { g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = Math.max(0.8, r * 0.03); g.lineCap = 'round'; g.beginPath(); g.moveTo(-s * 0.35, s * 0.12); g.quadraticCurveTo(-s * 0.1, -s * 0.05, s * 0.15, s * 0.12); g.quadraticCurveTo(s * 0.35, s * 0.28, s * 0.5, s * 0.1); g.stroke(); }
    if (C.pattern === 'leaf') { g.fillStyle = '#a6e86a'; g.save(); g.translate(0, s * 0.15); g.rotate(-0.4); g.beginPath(); g.ellipse(0, 0, s * 0.28, s * 0.12, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(40,90,20,0.6)'; g.lineWidth = Math.max(0.5, r * 0.014); g.beginPath(); g.moveTo(-s * 0.24, 0); g.lineTo(s * 0.24, 0); g.stroke(); g.restore(); }
    if (C.pattern === 'swirl') { g.strokeStyle = 'rgba(150,170,200,0.9)'; g.lineWidth = Math.max(0.7, r * 0.025); g.beginPath(); g.arc(0, s * 0.1, s * 0.2, 0.5, 5.2); g.stroke(); }
    // flared, rolled cuff
    const cuff = () => { g.beginPath(); g.moveTo(s * 0.62, -s * 0.5); g.lineTo(s * 1.12, -s * 0.66); g.quadraticCurveTo(s * 1.34, 0, s * 1.12, s * 0.66); g.lineTo(s * 0.62, s * 0.5); g.quadraticCurveTo(s * 0.72, 0, s * 0.62, -s * 0.5); g.closePath(); };
    if (hi) { const cg = g.createLinearGradient(0, -s * 0.66, 0, s * 0.66); cg.addColorStop(0, this.shade(C.cuff, 0.35)); cg.addColorStop(0.45, front ? C.cuff : this.shade(C.cuff, -0.12)); cg.addColorStop(1, this.shade(C.cuff, -0.35)); g.fillStyle = cg; } else g.fillStyle = C.cuff;
    g.strokeStyle = ink; g.lineWidth = lw; cuff(); g.fill(); g.stroke();
    if (hi) {
      g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = Math.max(0.7, r * 0.025); g.beginPath(); g.moveTo(s * 1.1, -s * 0.55); g.quadraticCurveTo(s * 1.28, 0, s * 1.1, s * 0.55); g.stroke();
      g.strokeStyle = 'rgba(0,0,0,0.14)'; g.lineWidth = Math.max(0.5, r * 0.016); g.beginPath(); g.moveTo(s * 0.86, -s * 0.54); g.quadraticCurveTo(s * 0.96, 0, s * 0.86, s * 0.54); g.stroke();
    }
    g.restore();
  },

  glovePose(r, mood, t, front) {
    const q = Math.sin(t * 18), shake = Math.sin(t * 40) * r * 0.05;
    const pose = this._pose, pp = this._pp;
    if (pose === 'spin') return front ? [-r * 1.3, -r * 0.15, -1.8] : [r * 1.25, -r * 0.15, 1.8];
    if (pose === 'splash') return front ? [-r * 0.85, -r * 1.2, -2.5] : [r * 0.8, -r * 1.2, 2.5];
    if (pose === 'pump') { const up = Math.abs(Math.sin(pp * Math.PI * 3)); return front ? [-r * 0.65, -r * (0.9 + up * 0.45), -2.6] : [r * 0.95, r * 0.6, 0.3]; }
    if (pose === 'stomp') return front ? [-r * 0.7, r * 0.75, -0.3] : [r * 0.8, r * 0.75, 0.3];
    if (pose === 'flex') return front ? [-r * 1.18, -r * 0.6 + shake * 0.4, -2.0] : [r * 1.12, -r * 0.6 - shake * 0.4, 2.0];
    if (mood === 'effort') return front ? [-r * 1.0, r * 0.5 + q * r * 0.06, -1.3] : [r * 0.98, r * 0.5 - q * r * 0.06, 1.2];
    if (mood === 'love') return front ? [-r * 0.55, r * 0.62, -0.9] : [r * 0.4, r * 0.66, 0.9];
    switch (mood) {
      case 'evil': return front ? [-r * 0.45 + q * r * 0.12, r * 0.58 + Math.cos(t * 18) * r * 0.06, -0.6] : [r * 0.9, r * 0.5, 0.5];      // rubbing hands
      case 'laugh': return front ? [-r * 0.15, r * 0.7 + Math.abs(Math.sin(t * 11)) * r * 0.1, -0.2] : [r * 0.95, r * 0.6, 0.4];          // holding the belly
      case 'shock': return front ? [-r * 1.18, -r * 0.65 + shake, -2.5] : [r * 0.95, -r * 0.8 + shake, 2.5];                          // hands thrown up
      case 'angry': return front ? [-r * 1.22, r * 0.45 + shake, -1.4] : [r * 1.0, r * 0.4 - shake, 1.2];                            // shaking fists
      case 'stoic': return front ? [-r * 1.12, -r * 0.42, -1.9] : [r * 0.95, r * 0.65, 0.3];                                         // one firm fist, other hand on hip
      case 'grim': return front ? [-r * 0.15, r * 0.85, -0.3] : [r * 0.92, r * 0.55, 0.4];                                            // arms folded
      case 'smug': case 'proud': return front ? [-r * 0.62, r * 0.85, -0.2] : [r * 0.95, r * 0.65, 0.3];                             // hands on hips
      case 'starry': return front ? [-r * 0.8, -r * 1.2 + Math.sin(t * 9) * r * 0.1, -2.5] : [r * 0.75, -r * 1.2 + Math.sin(t * 9 + 1) * r * 0.1, 2.5];
      case 'sick': return front ? [-r * 0.1, r * 0.55, -0.3] : [r * 0.9, r * 0.6, 0.4];
      case 'nervous': return front ? [-r * 0.3 + Math.sin(t * 12) * r * 0.08, r * 0.62, -0.5] : [r * 0.9, r * 0.55, 0.5];
    }
    return null;
  },

  shoes(g, r, C, t, seed, walk, out) {
    const ph = t * 14 + seed;
    for (const s of [-1, 1]) {
      const p2 = ph + (s > 0 ? Math.PI : 0);
      const swing = walk > 0.1 ? Math.sin(p2) * r * 0.25 : 0, lift = walk > 0.1 ? Math.max(0, Math.cos(p2)) * r * 0.1 : 0;
      g.save(); g.translate(s * r * 0.36 + swing, r * 1.2 - lift); if (out) g.rotate(0.3 * s);
      this.shoe(g, r, C, s < 0);
      g.restore();
    }
  },
  // one shoe at the origin: sole bottom at y≈0.05r, toe toward -x, ankle at about (0.03r, -0.2r)
  shoe(g, r, C, back) {
    {
      const s = back ? -1 : 1;
      const hi = r > 10, lw = Math.max(0.8, r * 0.034), ink = this.shade(C.shoe, -0.62);
      let sf = C.shoe;
      if (hi) { const sg = g.createLinearGradient(0, -r * (C.boot ? 0.4 : 0.3), 0, 0); sg.addColorStop(0, this.shade(C.shoe, back ? 0.12 : 0.4)); sg.addColorStop(0.55, back ? this.shade(C.shoe, -0.12) : C.shoe); sg.addColorStop(1, this.shade(C.shoe, -0.38)); sf = sg; }
      // upper: a round puffy toe joined to the heel (stroke the union, then fill)
      const up = [() => { g.beginPath(); g.ellipse(-r * 0.15, -r * 0.12, r * 0.22, r * 0.14, 0, 0, 7); },
        () => { g.beginPath(); rrPath(g, -r * 0.12, -r * (C.boot ? 0.34 : 0.26), r * 0.3, r * (C.boot ? 0.32 : 0.24), r * (C.boot ? 0.13 : 0.09)); }];
      g.strokeStyle = ink; g.lineWidth = lw * 2; up.forEach(f => { f(); g.stroke(); });
      g.fillStyle = sf; up.forEach(f => { f(); g.fill(); });
      if (C.boot) {
        g.fillStyle = this.shade(C.shoe, 0.2); g.strokeStyle = ink; g.lineWidth = lw; g.beginPath(); rrPath(g, -r * 0.15, -r * 0.37, r * 0.36, r * 0.09, r * 0.045); g.fill(); g.stroke(); // folded boot top
      }
      // chunky rubber sole with a toe cap
      g.fillStyle = C.sole; g.strokeStyle = this.shade(C.sole, -0.5); g.lineWidth = lw;
      g.beginPath(); g.moveTo(-r * 0.36, -r * 0.06); g.quadraticCurveTo(-r * 0.42, r * 0.05, -r * 0.3, r * 0.05); g.lineTo(r * 0.17, r * 0.05); g.quadraticCurveTo(r * 0.23, r * 0.05, r * 0.21, -r * 0.05); g.closePath(); g.fill(); g.stroke();
      if (!C.boot) { g.fillStyle = C.sole; g.beginPath(); g.ellipse(-r * 0.3, -r * 0.06, r * 0.085, r * 0.07, -0.3, Math.PI * 0.5, Math.PI * 1.5); g.fill(); }
      if (hi) {
        g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(-r * 0.33, -r * 0.05, r * 0.5, r * 0.02);
        g.strokeStyle = 'rgba(0,0,0,0.18)'; g.lineWidth = Math.max(0.5, r * 0.014); for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(-r * 0.26 + k * r * 0.1, r * 0.01); g.lineTo(-r * 0.24 + k * r * 0.1, r * 0.05); g.stroke(); }
        g.fillStyle = 'rgba(255,255,255,0.65)'; g.beginPath(); g.ellipse(-r * 0.2, -r * 0.18, r * 0.08, r * 0.035, -0.25, 0, 7); g.fill();
      }
      if (!C.boot) { // laces and a little side stripe
        g.strokeStyle = C.lace; g.lineWidth = Math.max(0.8, r * 0.032); g.lineCap = 'round';
        g.beginPath(); g.moveTo(-r * 0.06, -r * 0.23); g.lineTo(r * 0.05, -r * 0.19); g.moveTo(-r * 0.1, -r * 0.18); g.lineTo(r * 0.01, -r * 0.14); g.stroke();
        if (hi) { g.strokeStyle = C.sole; g.lineWidth = Math.max(0.8, r * 0.03); g.beginPath(); g.moveTo(r * 0.02, -r * 0.08); g.quadraticCurveTo(r * 0.1, -r * 0.14, r * 0.16, -r * 0.08); g.stroke(); }
      } else if (hi) { g.fillStyle = C.lace; g.beginPath(); g.arc(r * 0.08, -r * 0.22, r * 0.03, 0, 7); g.fill(); }
    }
  },

  helmet(g, r, color) {
    g.fillStyle = '#c9ced6'; g.strokeStyle = '#5b6170'; g.lineWidth = Math.max(1, r * 0.06);
    g.beginPath(); g.arc(0, -r * 0.18, r * 0.98, Math.PI * 1.03, Math.PI * 1.97); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.ellipse(r * 0.25, -r * 0.75, r * 0.2, r * 0.07, 0.3, 0, 7); g.fill();
    g.fillStyle = color; g.beginPath(); g.moveTo(-r * 0.12, -r * 1.12); g.quadraticCurveTo(r * 0.3, -r * 1.55, r * 0.55, -r * 1.05); g.closePath(); g.fill();
  },

  flair(g, r, el, t, seed) {
    if (el >= 4) el = EL_BASE[el];
    for (let k = 0; k < 3; k++) {
      const ph = ((t * 0.55 + k / 3 + seed * 0.17) % 1), a = k * 2.1 + seed;
      const x = Math.cos(a) * r * 1.35, y = -r * 0.3 - ph * r * 0.9 + Math.sin(a) * r * 0.3;
      const al = Math.sin(ph * Math.PI) * 0.9;
      if (el === 1) { g.fillStyle = `rgba(120,190,255,${al})`; g.beginPath(); g.ellipse(x, y, r * 0.05, r * 0.08, 0, 0, 7); g.fill(); }
      if (el === 2) { g.fillStyle = `rgba(255,${150 + k * 30},50,${al})`; g.beginPath(); g.arc(x, y, r * 0.06, 0, 7); g.fill(); }
      if (el === 3) { g.save(); g.translate(x, y + ph * r * 1.6); g.rotate(ph * 6); g.fillStyle = `rgba(110,175,60,${al})`; g.beginPath(); g.ellipse(0, 0, r * 0.08, r * 0.04, 0, 0, 7); g.fill(); g.restore(); }
      if (el === 0) { g.strokeStyle = `rgba(200,215,235,${al})`; g.lineWidth = Math.max(1, r * 0.04); g.beginPath(); g.arc(x, y, r * 0.12, ph * 4, ph * 4 + 3.5); g.stroke(); }
    }
  },

  shade(hex, amt) {
    if (hex[0] !== '#') return hex;
    const n = parseInt(hex.slice(1), 16);
    const r = n >> 16, gg = (n >> 8) & 255, b = n & 255;
    const f = v => Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt);
    return `rgb(${f(r)},${f(gg)},${f(b)})`;
  },
};
function MGHash(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
function rrPath(g, x, y, w, h, r) { g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
