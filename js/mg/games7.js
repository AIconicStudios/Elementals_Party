'use strict';
// 61 ---------------------------------------------------------------- Fourfold Clash: the ultimate brawl
// A platform fighter on a floating sky arena. Move, A = jump (tap for a short hop, double jump in the air),
// B = your clan power: tap for a strike, hold and release for a charged shot, up+B to recover, down+B for a slam.
// Six lives each. Damage % makes you fly further; leave the arena and you lose a life.
(() => {
  // Fourfold Clash's own arena; other arenas (games12.js) pass their own layout to defArena
  const CLASH = {
    id: 'brawl', name: 'Fourfold Clash',
    stage: { x0: 300, x1: 1300, y: 640, th: 130 },
    soft: [{ x0: 420, x1: 680, y: 470 }, { x0: 920, x1: 1180, y: 470 }, { x0: 670, x1: 930, y: 315 }],
    blast: { x0: -280, x1: 1880, y0: -560, y1: 1260 },
    spawn: [{ x: 470, y: 470 }, { x: 1130, y: 470 }, { x: 600, y: 640 }, { x: 1000, y: 640 }],
  };
  const GRAV = 2500, R0 = 34; // R0 = character draw radius
  // movement and weight per clan (lighter = flies further, faster; heavier = sturdier, slower)
  const CLS = [
    { run: 455, air: 410, jump: 960, dj: 870, jumps: 3, w: 0.9, fall: 1050 }, // Zephi: light, three jumps
    { run: 410, air: 365, jump: 985, dj: 905, jumps: 2, w: 1.0, fall: 1150 },  // Drip: all-rounder
    { run: 425, air: 375, jump: 995, dj: 905, jumps: 2, w: 0.97, fall: 1180 }, // Pyra: aggressive
    { run: 372, air: 345, jump: 955, dj: 880, jumps: 2, w: 1.22, fall: 1230 }, // Pebble: heavy hitter
  ];
  const H = (dmg, base, grow, ang) => ({ dmg, base, grow, ang });
  // the strike (tap B) of each clan: hitbox in front (fx forward, fy up from the feet), timings and lunge
  const JAB = [
    { st: 0.04, act: 0.1, end: 0.14, fx: 52, fy: 46, w: 86, h: 52, hit: H(8.5, 290, 9.6, 42), lunge: 210, name: 'Gust Palm' },
    { st: 0.07, act: 0.1, end: 0.18, fx: 54, fy: 46, w: 92, h: 50, hit: H(8, 285, 9.6, 40), lunge: 70, name: 'Splash Jab' },
    { st: 0.1, act: 0.12, end: 0.24, fx: 52, fy: 46, w: 86, h: 52, hit: H(9.2, 300, 10.4, 36), lunge: 300, name: 'Blaze Punch' },
    { st: 0.14, act: 0.12, end: 0.28, fx: 56, fy: 46, w: 98, h: 58, hit: H(12.5, 320, 12.2, 35), lunge: 90, name: 'Rock Fist', armor: true },
  ];
  const REACH = JAB.map(j => j.fx + j.w / 2 + 16);
  const NAMES = [['Gust Palm', 'Cyclone', 'Updraft', 'Downburst'], ['Splash Jab', 'Tidal Wave', 'Geyser', 'Bubble Guard'], ['Blaze Punch', 'Fireball', 'Rocket Jump', 'Flame Pillar'], ['Rock Fist', 'Boulder Toss', 'Stone Pillar', 'Quake Slam']];
  const PCOL = ['#dff4ff', '#5fb8ff', '#ff8a2a', '#b08a5a'];
  // every newer hero has a signature B shot of their own (the four originals keep their clan shots)
  // item drops (arenas with items: true): crates fall from the sky, touch one to grab its buff
  const ITEMS = [{ k: 'heal', icon: '❤️', label: 'HEAL!', col: '#ff6b8a' }, { k: 'power', icon: '💪', label: 'POWER UP!', col: '#ff8a3d' }, { k: 'speed', icon: '👟', label: 'SPEED UP!', col: '#7cf06a' }, { k: 'shield', icon: '🛡️', label: 'BUBBLE!', col: '#9fe0ff' }, { k: 'star', icon: '⭐', label: 'INVINCIBLE!', col: '#ffe680' }];
  const SIGN = { 4: 'Smoke Bomb', 5: 'Rain Cloud', 6: 'Shard Spread', 7: 'Vine Lash', 8: 'Icicle Lance', 9: 'Chain Bolt', 10: 'Sand Twister', 11: 'Lava Lob', 12: 'Seeker Star', 13: 'Moon Boomerang', 14: 'Saw Cog' };
  const SIGC = { 4: ['#cfd3dc', '#8a8e98'], 5: ['#9fd0ff', '#ffffff'], 6: ['#c8bca4', '#7a705c'], 7: ['#7ccf4a', '#ff8ab8'], 8: ['#e8f8ff', '#8fd8ff'], 9: ['#fff6a0', '#b07aff'], 10: ['#e8d09a', '#b0905a'], 11: ['#ffb13d', '#ff4a1a'], 12: ['#fff6c8', '#ffd34d'], 13: ['#cfc4ff', '#6a5ae8'], 14: ['#d8dee8', '#6a7686'] };
  const HAZ_ALL = ['meteor', 'lightning', 'gale', 'crystal'];
  const HAZNAME = { meteor: '☄️ METEOR SHOWER', lightning: '⚡ LIGHTNING STORM', gale: '🌪️ SKY GALE', crystal: '💎 CRYSTAL RAIN' };
  const S_ = (x, y, d, op, mi) => ({ x, y, d, o: !!op, m: !!mi });

  function defArena(A) {
  const W = A.w || 1600, STAGE = A.stage, SOFT = A.soft, BLAST = A.blast, SPAWN = A.spawn, HAZ = A.haz || HAZ_ALL;
  const game = {
    id: A.id, name: A.name, type: 'Brawl', controls: 'Move + A & B buttons', dur: 210, finale: true, A,
    how: A.how || 'The ultimate brawl! Move, A = jump (tap for a short hop, jump again in the air). B = your clan power: TAP for a strike, HOLD and release for a charged shot, UP+B to fly back to the arena, DOWN+B for a slam. Hold DOWN on the main stage to brace. Damage % makes you fly further — get knocked out of the arena and you lose one of your 6 lives. Watch out for meteors, lightning, gales and crystal rain!',
    wins: 'Last fighter standing (or most lives when time runs out).',
    init(m, S) {
      S.f = m.players.map((p, i) => this.spawn({ i, el: EL_BASE[p.el.id], hero: p.el.id, lives: A.lives || 6, pct: 0, place: 0, kos: 0 }, i, true));
      SOFT.forEach(p => { p.offT = 0; }); S.sw = (A.switches || []).map(w => Object.assign({ cd: 2, glow: 0, pull: 0 }, w)); S.traps = [];
      S.proj = []; S.areas = []; S.pillars = []; S.parts = []; S.warn = []; S.texts = [];
      S.cam = { x: 800, y: 470, z: 0.95 }; S.shake = 0; S.flash = 0; S.slow = 0; S.endT = -1;
      S.haz = null; S.hazNext = 16; S.hazLast = ''; S.banner = null; S.elimOrder = 0; S.wind = 0; S.hitstopG = 0;
    },
    spawn(f, i, first) {
      const sp = first ? SPAWN[i] : { x: (A.mid || 800) + (i - 1.5) * 95, y: A.respawnY || 190 };
      Object.assign(f, {
        x: sp.x, y: sp.y, vx: 0, vy: 0, face: sp.x < 800 ? 1 : -1, ground: first ? 'stage' : 'respawn', jumps: CLS[f.el].jumps, upUsed: false, helpless: false,
        state: 'idle', st: 0, mv: null, mvT: 0, hits: new Set(), charge: 0, bHeld: false, inv: first ? 0 : 2.2, hs: 0, hitstun: 0, kb: 0,
        shield: 0, cdProj: 0, cdDown: 0, brace: 0, braceCd: 0, drop: 0, pct: first ? 0 : 0, moodT: 0, mood: null, hurtFlash: 0, lastBy: -1, lastByT: 0,
        respawnPlat: first ? 0 : 3, shortHop: 0, dead: 0, spin: 0, trail: 0,
      });
      return f;
    },
    // ------------------------------------------------------------ helpers
    alive(S) { return S.f.filter(f => f.lives > 0); },
    plats(S) { return SOFT.filter(p => !(p.offT > 0)).concat(S.pillars.filter(p => p.solid)); },
    pushPart(S, x, y, n, o) {
      if (Settings.test) return;
      for (let k = 0; k < n; k++) {
        const a = o.a !== undefined ? o.a + R.range(-o.spread || 0, o.spread || 0) : Math.random() * Math.PI * 2, v = (o.v || 200) * R.range(0.35, 1);
        S.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (o.up || 0), t: 0, life: (o.life || 0.6) * R.range(0.6, 1.1), size: o.size || R.range(3, 7), col: Array.isArray(o.col) ? R.pick(o.col) : o.col, kind: o.kind || 'dot', grav: o.grav || 0, drag: o.drag || 2 });
      }
      if (S.parts.length > 1400) S.parts.splice(0, S.parts.length - 1400);
    },
    say(S, text, x, y, col, size = 34) { if (!Settings.test) S.texts.push({ text, x, y, col, size, t: 0 }); },
    hurtbox(f) { return { x0: f.x - 26, x1: f.x + 26, y0: f.y - 80, y1: f.y }; },
    overlap(a, b) { return a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0; },
    rect(cx, cy, w, h) { return { x0: cx - w / 2, x1: cx + w / 2, y0: cy - h / 2, y1: cy + h / 2 }; },

    // ------------------------------------------------------------ hits
    applyHit(m, S, ai, ti, hit, dir, scale = 1, opts = {}) {
      const a = ai >= 0 ? S.f[ai] : null, t = S.f[ti];
      if (t.lives <= 0 || t.state === 'dead' || t.inv > 0) return false;
      if (t.shield > 0 && !opts.hazard) { // Drip's bubble: bounce it right back
        if (a && !opts.proj) this.applyHit(m, S, ti, ai, H(hit.dmg * 1.15 + 2, 380, 10.5, 45), Math.sign(a.x - t.x) || 1, 1, { counter: true });
        this.pushPart(S, t.x, t.y - 40, 18, { col: ['#bfe6ff', '#ffffff', '#5fb8ff'], v: 320, life: 0.5 });
        this.say(S, 'COUNTER!', t.x, t.y - 110, '#9fe0ff', 30); Sfx.tone(1200, 0.12, 'sine', 0.08, 600); t.shield = 0.12;
        return 'shield';
      }
      let dmg = hit.dmg * scale, kbScale = scale;
      if (a && a.buff === 'power' && a.buffT > 0) { dmg *= 1.4; kbScale *= 1.15; }
      const braced = t.state === 'brace';
      if (braced) { dmg *= 0.5; kbScale *= 0.45; }
      if (A.taken) dmg *= A.taken[t.el]; // per-arena clan balance (HP arenas)
      t.pct = Math.min(999, t.pct + dmg);
      const kb = (hit.base + t.pct * hit.grow * 1.36) * kbScale / CLS[t.el].w;
      // Pebble's armour: a light hit during his wind-up does damage but doesn't stop him
      const armored = t.state === 'atk' && t.mv && t.mv.armor && t.mvT < t.mv.st && dmg <= 9;
      const hs = Math.min(0.2, 0.045 + dmg * 0.0065 + (kb > 1300 ? 0.05 : 0));
      if (a) { a.hs = hs; }
      t.hs = hs; t.hurtFlash = 0.25; t.lastBy = ai; t.lastByT = 4;
      if (!armored) {
        let ang = hit.ang * Math.PI / 180;
        if (t.ground && hit.ang > 0 && hit.ang < 18) ang = 18 * Math.PI / 180;
        if (hit.ang < 0 && t.ground) ang = 40 * Math.PI / 180; // a spike on the ground just pops them up
        t.vx = Math.cos(ang) * kb * dir; t.vy = -Math.sin(ang) * kb;
        t.state = 'hit'; t.hitstun = 0.1 + kb * 0.00042; t.kb = kb; t.ground = null; t.mv = null; t.charge = 0; t.bHeld = false;
        t.upUsed = false; t.helpless = false; t.jumps = Math.max(t.jumps, 1); t.spin = kb > 1100 ? 1 : 0; t.trail = kb > 900 ? t.hitstun : 0;
      } else { this.say(S, 'ARMOR', t.x, t.y - 100, '#e8c890', 22); }
      t.mood = 'hurt'; t.moodT = 0.6;
      if (a) { a.mood = kb > 1300 ? 'cheer' : 'determined'; a.moodT = 0.5; }
      // feel: sparks, shake, flash, sounds
      const hx = t.x - dir * 8, hy = t.y - 42, col = a ? PCOL[a.el] : '#ffe680';
      this.pushPart(S, hx, hy, 8 + Math.min(18, kb / 90), { col: ['#ffffff', '#fff1a8', col], v: 260 + kb * 0.35, life: 0.35, kind: 'spark', size: 3, a: dir > 0 ? 0 : Math.PI, spread: 1.4 });
      this.pushPart(S, hx, hy, 1, { col: '#ffffff', v: 0, life: 0.16, kind: 'flash', size: 26 + Math.min(60, kb / 30) });
      S.shake = Math.max(S.shake, Math.min(22, kb / 130));
      if (kb > 1350) { S.flash = 0.12; S.punch = { x: t.x, y: t.y - 40, t: 0.35 }; this.say(S, 'SMASH!', t.x, t.y - 120, '#ffe680', 40); Sfx.boom(); Sfx.crowd('ooh'); }
      else if (dmg >= 9) Sfx.punch(); else { Sfx.punch(); }
      this.say(S, A.stamina ? '-' + Math.round(dmg) : Math.round(dmg) + '%', t.x + R.range(-12, 12), t.y - 90, '#fff', 20);
      return true;
    },
    // a hitbox owned by fighter ai hitting everyone in it once (tracked by the set)
    hitRect(m, S, ai, box, hit, set, dirFn, scale = 1, opts = {}) {
      let any = false;
      for (const t of S.f) {
        if (t.i === ai || set.has(t.i) || t.lives <= 0 || t.state === 'dead') continue;
        if (!this.overlap(box, this.hurtbox(t))) continue;
        set.add(t.i);
        const dir = dirFn ? dirFn(t) : (Math.sign(t.x - (box.x0 + box.x1) / 2) || 1);
        if (this.applyHit(m, S, ai, t.i, hit, dir, scale, opts)) any = true;
      }
      if (ai >= 0 && !opts.hazard && !opts.trap) this.hitSwitch(m, S, ai, box);
      return any;
    },

    // ------------------------------------------------------------ powers
    startMove(m, S, f, kind, charge = 0) {
      const el = f.el;
      f.state = 'atk'; f.mvT = 0; f.hits = new Set(); f.mvKind = kind; f.charge = 0;
      if (kind === 'jab') { f.mv = JAB[el]; Sfx.whoosh(false); return; }
      if (kind === 'proj') {
        f.mv = { st: 0.1, act: 0.04, end: 0.24, proj: true }; f.cdProj = 0.55; f.pCharge = charge;
        return;
      }
      if (kind === 'up') {
        f.upUsed = true;
        f.mv = [{ st: 0.06, act: 0.32, end: 0.18 }, { st: 0.08, act: 0.36, end: 0.18 }, { st: 0.08, act: 0.26, end: 0.18 }, { st: 0.1, act: 0.36, end: 0.2 }][el];
        return;
      }
      if (kind === 'down') {
        f.cdDown = el === 1 ? 2.2 : 0.75;
        const air = !f.ground;
        f.mvAir = air;
        f.mv = [
          air ? { st: 0.08, act: 0.7, end: 0.14, dive: 1550 } : { st: 0.12, act: 0.1, end: 0.22 },
          { st: 0.03, act: 0.55, end: 0.25, shield: true },
          air ? { st: 0.1, act: 0.7, end: 0.16, dive: 1650 } : { st: 0.16, act: 0.18, end: 0.24 },
          air ? { st: 0.1, act: 0.7, end: 0.2, dive: 1750 } : { st: 0.2, act: 0.14, end: 0.3 },
        ][el];
      }
    },
    // runs every frame while a move is in progress
    tickMove(m, S, f, dt) {
      const mv = f.mv, el = f.el, k = f.mvKind;
      const prevT = f.mvT; f.mvT += dt;
      const enter = prevT < mv.st && f.mvT >= mv.st, active = f.mvT >= mv.st && f.mvT < mv.st + mv.act;
      const cls = CLS[el];
      if (k === 'jab') {
        if (active) {
          if (f.ground) f.vx = f.face * mv.lunge * (1 - (f.mvT - mv.st) / mv.act);
          const box = this.rect(f.x + f.face * mv.fx, f.y - mv.fy, mv.w, mv.h);
          if (this.hitRect(m, S, f.i, box, mv.hit, f.hits, () => f.face)) { /* connected */ }
          if (enter) {
            const col = PCOL[el];
            this.pushPart(S, f.x + f.face * (mv.fx + 10), f.y - mv.fy, 10, { col: el === 2 ? ['#ffe680', '#ff8a3d', '#ff3d1f'] : el === 1 ? ['#bfe6ff', '#5fb8ff', '#ffffff'] : el === 0 ? ['#ffffff', '#dff4ff'] : ['#c9a36b', '#8a6a4a'], v: 300, life: 0.3, a: f.face > 0 ? 0 : Math.PI, spread: 0.6 });
            if (el === 3) Sfx.thud(); else if (el === 2) Sfx.noise(0.2, 1400, 0.07, 'bandpass', 0, -600);
          }
        } else if (f.ground) f.vx *= Math.pow(0.0005, dt);
      }
      if (k === 'proj' && enter) this.fireProj(m, S, f, f.pCharge || 0);
      if (k === 'up') {
        if (enter) {
          if (el === 0) { f.vy = -1380; f.vx = m.axis(f.i).x * 260; Sfx.whoosh(true); }
          if (el === 1) { f.vy = -1300; f.vx = m.axis(f.i).x * 230; S.areas.push({ own: f.i, kind: 'geyser', x: f.x, y: f.y - 110, w: 74, h: 230, t: 0, life: 0.45, hit: H(7, 320, 9, 88), set: new Set(), vy: -120 }); Sfx.noise(0.5, 700, 0.1, 'lowpass', 0, 900); }
          if (el === 2) { f.vy = -1250; f.vx = f.face * 380 + m.axis(f.i).x * 150; S.areas.push({ own: f.i, kind: 'blast', x: f.x, y: f.y - 20, w: 140, h: 90, t: 0, life: 0.16, hit: H(8, 330, 10, 80), set: new Set() }); Sfx.boom(); S.shake = Math.max(S.shake, 6); }
          if (el === 3) {
            const top = f.y, x = f.x;
            S.pillars.push({ x0: x - 46, x1: x + 46, base: top + 30, y: top + 30, target: top - 310, t: 0, life: 2.0, own: f.i, solid: true, set: new Set(), rising: true });
            f.vy = 0; Sfx.thud(); S.shake = Math.max(S.shake, 5);
          }
          f.ground = null;
        }
        if (active) {
          if (el === 0) { const box = this.rect(f.x, f.y - 46, 96, 110); this.hitRect(m, S, f.i, box, H(5, 300, 8, 88), f.hits, t => Math.sign(t.x - f.x) || 1); if (Math.random() < 0.6) this.pushPart(S, f.x + R.range(-30, 30), f.y - R.range(0, 80), 1, { col: '#ffffff', v: 120, life: 0.4, a: -Math.PI / 2, spread: 0.6 }); }
          if (el === 2 && Math.random() < 0.8) this.pushPart(S, f.x, f.y, 2, { col: ['#ffe680', '#ff8a3d', '#ff3d1f'], v: 180, life: 0.4, a: Math.PI / 2, spread: 0.5 });
        }
        if (f.mvT >= mv.st + mv.act + mv.end) { f.state = 'idle'; f.mv = null; if (!f.ground) f.helpless = true; return; }
        return;
      }
      if (k === 'down') {
        if (mv.shield) { if (enter) { f.shield = mv.act; Sfx.tone(700, 0.2, 'sine', 0.07, 400); } if (f.ground) f.vx *= Math.pow(0.001, dt); }
        else if (mv.dive) {
          if (enter) { f.vy = mv.dive; f.vx *= 0.3; Sfx.whoosh(false); }
          if (active) {
            f.vy = Math.max(f.vy, mv.dive * 0.8);
            const box = this.rect(f.x, f.y - 10, 76, 56);
            this.hitRect(m, S, f.i, box, el === 2 ? H(9, 300, 9, -70) : el === 0 ? H(7, 280, 8, -60) : H(10, 310, 9, -65), f.hits, t => Math.sign(t.x - f.x) || 1);
            if (Math.random() < 0.7) this.pushPart(S, f.x, f.y - 40, 2, { col: el === 2 ? ['#ffe680', '#ff8a3d'] : el === 0 ? ['#ffffff', '#dff4ff'] : ['#c9a36b', '#8a6a4a'], v: 160, life: 0.35, a: -Math.PI / 2, spread: 0.4 });
            if (f.ground) { this.groundSlam(m, S, f); f.mvT = mv.st + mv.act; }
          }
        } else if (enter) this.groundSlam(m, S, f);
        else if (f.ground) f.vx *= Math.pow(0.001, dt);
      }
      if (f.mvT >= mv.st + mv.act + mv.end) { f.state = 'idle'; f.mv = null; }
    },
    groundSlam(m, S, f) {
      const el = f.el, gy = f.y;
      if (el === 0) { S.areas.push({ own: f.i, kind: 'windring', x: f.x, y: gy - 30, w: 270, h: 90, t: 0, life: 0.18, hit: H(5, 360, 8.6, 30), set: new Set() }); Sfx.whoosh(true); }
      if (el === 2) { S.areas.push({ own: f.i, kind: 'pillar', x: f.x, y: gy - 85, w: 200, h: 175, t: 0, life: 0.22, hit: H(9, 350, 10.4, 78), set: new Set() }); Sfx.boom(); S.shake = Math.max(S.shake, 7); }
      if (el === 3) {
        S.areas.push({ own: f.i, kind: 'quakeC', x: f.x, y: gy - 25, w: 130, h: 60, t: 0, life: 0.14, hit: H(10, 340, 10, 82), set: new Set() });
        for (const d of [-1, 1]) S.areas.push({ own: f.i, kind: 'quake', x: f.x + d * 40, y: gy - 22, w: 60, h: 48, vx: d * 460, t: 0, life: 0.5, hit: H(9, 330, 9.6, 80), set: new Set(), groundY: gy });
        Sfx.thud(); Sfx.boom(); S.shake = Math.max(S.shake, 10);
      }
      if (el === 1) return;
      this.pushPart(S, f.x, gy, 16, { col: ['#d9c7a8', '#a88a6a', '#ffffff'], v: 260, life: 0.5, a: -Math.PI / 2, spread: 1.4, grav: 600 });
    },
    fireProj(m, S, f, c) {
      const el = f.el, cs = 1 + 0.6 * c, x = f.x + f.face * 40, y = f.y - 44;
      if (f.hero >= 4 && SIGN[f.hero]) { this.fireSig(m, S, f, c, cs, x, y); return; }
      if (el === 0) { S.proj.push({ own: f.i, kind: 'cyclone', x, y: f.y - 46, vx: f.face * (500 + 120 * c), vy: 0, r: 34 + 10 * c, life: 1.1 + 0.3 * c, t: 0, multi: 0.12, tick: {}, count: {}, cs }); Sfx.whoosh(true); }
      if (el === 1) {
        if (f.ground && f.ground !== 'respawn') { const pl = f.ground; S.proj.push({ own: f.i, kind: 'wave', x, y: f.y, vx: f.face * (540 + 100 * c), vy: 0, r: 34 + 10 * c, life: 1.0 + 0.4 * c, t: 0, set: new Set(), cs, plat: pl }); }
        else S.proj.push({ own: f.i, kind: 'orb', x, y, vx: f.face * 620, vy: -120, grav: 900, r: 16 + 6 * c, life: 1.4, t: 0, set: new Set(), cs });
        Sfx.noise(0.4, 900, 0.1, 'lowpass', 0, 800);
      }
      if (el === 2) { S.proj.push({ own: f.i, kind: 'fire', x, y, vx: f.face * (700 + 120 * c), vy: 0, grav: 0, r: 15 + 9 * c, life: 1.1, t: 0, set: new Set(), cs }); Sfx.noise(0.3, 1500, 0.08, 'bandpass', 0, -900); }
      if (el === 3) { S.proj.push({ own: f.i, kind: 'boulder', x, y: f.y - 60, vx: f.face * (420 + 170 * c), vy: -540, grav: 1500, r: 22 + 6 * c, life: 2.2, t: 0, set: new Set(), cs, rot: 0 }); Sfx.thud(); }
    },
    fireSig(m, S, f, c, cs, x, y) {
      const h = f.hero, d = f.face, base = { own: f.i, kind: 'sig', s: h, x, y, vx: 0, vy: 0, t: 0, set: new Set(), cs, tick: {}, life: 1.2 };
      const P = o => S.proj.push(Object.assign({}, base, { set: new Set(), tick: {} }, o));
      if (h === 4) { P({ vx: d * (420 + 80 * c), r: 26 + 10 * c, drag: 2.2, grow: 30, pierce: true, every: 0.35, life: 1.8, hit: H(3 * cs, 160, 3, 50), stun: 0.15 }); Sfx.noise(0.4, 500, 0.08, 'lowpass'); }
      if (h === 5) { P({ vx: d * 260, vy: -380, r: 30 + 6 * c, drag: 2.6, hover: true, rain: 0.12, life: 1.5 + 0.4 * c, pierce: true, every: 99, hit: H(0, 0, 0, 0), harmless: true }); Sfx.noise(0.6, 900, 0.06, 'lowpass', 0, 400); }
      if (h === 6) { for (const a of [-0.22, 0, 0.22]) P({ vx: d * Math.cos(a) * (820 + 100 * c), vy: Math.sin(a) * 820, r: 10 + 3 * c, life: 0.6, hit: H(4 * cs, 250, 6 * cs, 35), spin: 0 }); Sfx.tone(1400, 0.05, 'square', 0.04, 600); }
      if (h === 7) { if (f.ground && f.ground !== 'respawn') P({ x: f.x + d * 30, y: f.y, vx: d * (560 + 120 * c), r: 22 + 6 * c, life: 0.7, ground: true, hit: H(6 * cs, 220, 6, 70), stun: 0.45 }); else P({ vx: d * 700, r: 16, life: 0.5, hit: H(6 * cs, 220, 6, 50), stun: 0.3 }); Sfx.whoosh(false); }
      if (h === 8) { P({ vx: d * (900 + 160 * c), r: 14 + 5 * c, life: 1, hit: H(7 * cs, 260, 8 * cs, 30), stun: 0.35 + 0.25 * c, freeze: true }); Sfx.tone(1800, 0.12, 'sine', 0.05, 2400); }
      if (h === 9) { P({ vx: d * 1500, r: 14 + 4 * c, life: 0.5, pierce: true, every: 99, hit: H(6.5 * cs, 270, 8 * cs, 40), stun: 0.15 }); Sfx.thunder ? Sfx.thunder() : Sfx.boom(); }
      if (h === 10) { S.proj.push({ own: f.i, kind: 'cyclone', sand: true, x, y: f.y - 46, vx: d * (420 + 100 * c), vy: 0, r: 30 + 10 * c, life: 1.3 + 0.3 * c, t: 0, multi: 0.14, tick: {}, count: {}, cs }); Sfx.noise(0.4, 1200, 0.07, 'bandpass'); }
      if (h === 11) { P({ y: f.y - 60, vx: d * (380 + 140 * c), vy: -620, grav: 1500, r: 16 + 5 * c, life: 2, hit: H(8 * cs, 290, 9 * cs, 50), lob: true }); Sfx.noise(0.3, 400, 0.08, 'lowpass'); }
      if (h === 12) { P({ vx: d * 520, r: 14 + 4 * c, life: 1.6 + 0.3 * c, home: true, hit: H(6 * cs, 260, 7.5 * cs, 45) }); Sfx.star(); }
      if (h === 13) { P({ vx: d * (980 + 120 * c), r: 22 + 5 * c, life: 1.4, boom: d, pierce: true, every: 0.5, hit: H(6 * cs, 260, 7.5 * cs, 40) }); Sfx.whoosh(true); }
      if (h === 14) { P({ vx: d * (520 + 140 * c), vy: -200, grav: 1600, r: 18 + 5 * c, life: 2.2, bounce: 3, spin: 0, hit: H(7 * cs, 280, 8 * cs, 45) }); Sfx.tone(300, 0.1, 'sawtooth', 0.04, 600); }
    },
    // per-frame behaviour of signature shots (moved by the shared projectile loop)
    sigTick(m, S, p, dt) {
      if (p.drag) { p.vx *= Math.exp(-p.drag * dt); if (p.vy && !p.grav) p.vy *= Math.exp(-p.drag * dt); }
      if (p.grow) p.r += p.grow * dt;
      if (p.spin !== undefined) p.spin += dt * 18 * Math.sign(p.vx || 1);
      if (p.hover && p.rain) { p.rt = (p.rt || 0) - dt; if (p.rt <= 0 && p.t > 0.25) { p.rt = p.rain; S.proj.push({ own: p.own, kind: 'sig', s: 'drop', x: p.x + R.range(-p.r, p.r), y: p.y + 12, vx: 0, vy: 700, r: 6, life: 0.8, t: 0, set: new Set(), tick: {}, cs: p.cs, hit: H(1.6 * p.cs, 120, 2, -60) }); } }
      if (p.home) { const tg = S.f.filter(o => o.i !== p.own && o.lives > 0 && o.state !== 'dead').sort((a, b) => dist(a.x, a.y - 40, p.x, p.y) - dist(b.x, b.y - 40, p.x, p.y))[0]; if (tg && p.t > 0.15) { const a = Math.atan2(tg.y - 44 - p.y, tg.x - p.x), sp = Math.hypot(p.vx, p.vy) + 260 * dt; let cur = Math.atan2(p.vy, p.vx), dA = ((a - cur + Math.PI * 3) % (Math.PI * 2)) - Math.PI; cur += clamp(dA, -3.2 * dt, 3.2 * dt); p.vx = Math.cos(cur) * Math.min(760, sp); p.vy = Math.sin(cur) * Math.min(760, sp); } }
      if (p.boom) { p.vx -= p.boom * 2300 * dt; const o = S.f[p.own]; if (p.t > 0.4 && o && Math.abs(o.x - p.x) < 40 && Math.abs(o.y - 44 - p.y) < 60) p.dead = true; if (p.t > 0.3) p.y += ((o ? o.y - 44 : p.y) - p.y) * Math.min(1, dt * 3); }
      if (p.ground && p.t > 0.02) { const gy = this.groundBelow(S, p.x, p.y - 4); if (gy - p.y > 30) p.t = p.life; else p.y = gy; if (Math.random() < 0.5) this.pushPart(S, p.x, p.y - 10, 1, { col: SIGC[7], v: 120, life: 0.35, a: -Math.PI / 2, spread: 0.8 }); }
      if ((p.grav || p.s === 'drop') && p.vy >= 0) {
        const gy = this.groundBelow(S, p.x, p.y - p.vy * dt - 1);
        if (p.y + p.r * 0.6 >= gy) {
          if (p.bounce) { p.bounce--; p.y = gy - p.r * 0.6; p.vy = -520; Sfx.tone(500, 0.04, 'square', 0.03); if (p.bounce <= 0) p.dead = true; }
          else if (p.lob) { p.dead = true; S.proj.push({ own: p.own, kind: 'sig', s: 'lava', x: p.x, y: gy - 8, vx: 0, vy: 0, r: 46, life: 1.6, t: 0, set: new Set(), tick: {}, cs: 1, pierce: true, every: 0.4, hit: H(3, 200, 3, 80) }); Sfx.noise(0.3, 600, 0.08, 'lowpass'); }
          else p.dead = true;
        }
      }
      if (p.s !== 'drop' && p.s !== 'lava' && Math.random() < 0.6) this.pushPart(S, p.x - (p.vx || 0) * 0.02, p.y, 1, { col: SIGC[p.s] || ['#fff'], v: 60, life: 0.35, spread: 3 });
    },
    drawSig(g, p, t) {
      const C = SIGC[p.s] || ['#9fd0ff', '#ffffff'];
      g.save(); g.translate(p.x, p.y);
      switch (p.s) {
        case 4: for (let k = 0; k < 6; k++) { g.fillStyle = `rgba(${k % 2 ? '200,205,215' : '150,155,165'},${0.55 * (1 - p.t / p.life)})`; g.beginPath(); g.arc(Math.cos(k * 1.7 + t * 2) * p.r * 0.5, Math.sin(k * 2.3 + t * 2) * p.r * 0.4, p.r * 0.6, 0, 7); g.fill(); } break;
        case 5: for (let k = 0; k < 4; k++) { g.fillStyle = k % 2 ? '#8a9ab0' : '#a8b8cc'; g.beginPath(); g.arc((k - 1.5) * p.r * 0.5, Math.sin(k * 2) * 6, p.r * 0.55, 0, 7); g.fill(); } break;
        case 'drop': g.fillStyle = '#7ac0ff'; g.beginPath(); g.ellipse(0, 0, 3, 8, 0, 0, 7); g.fill(); break;
        case 6: g.rotate(p.spin || 0); g.fillStyle = C[0]; g.beginPath(); g.moveTo(p.r * 1.4, 0); g.lineTo(-p.r * 0.6, -p.r * 0.7); g.lineTo(-p.r * 0.9, p.r * 0.5); g.closePath(); g.fill(); g.strokeStyle = C[1]; g.lineWidth = 2; g.stroke(); break;
        case 7: g.strokeStyle = '#3a8a2a'; g.lineWidth = 6; g.beginPath(); for (let k = 0; k <= 8; k++) { const xx = -Math.sign(p.vx) * k * 8; g.lineTo(xx, -10 - Math.sin(k + t * 12) * 6 - k); } g.stroke(); g.fillStyle = '#ff8ab8'; g.beginPath(); g.arc(0, -14, 8, 0, 7); g.fill(); g.fillStyle = '#ffe680'; g.beginPath(); g.arc(0, -14, 3, 0, 7); g.fill(); break;
        case 8: MGH.glow(g, 0, 0, p.r * 2.5, 'rgba(180,230,255,0.6)'); g.scale(Math.sign(p.vx) || 1, 1); g.fillStyle = '#e8f8ff'; g.beginPath(); g.moveTo(p.r * 2.4, 0); g.lineTo(-p.r, -p.r * 0.6); g.lineTo(-p.r * 0.6, 0); g.lineTo(-p.r, p.r * 0.6); g.closePath(); g.fill(); g.strokeStyle = '#8fd8ff'; g.lineWidth = 2; g.stroke(); break;
        case 9: MGH.glow(g, 0, 0, p.r * 3, 'rgba(255,240,140,0.7)'); g.strokeStyle = '#fff6a0'; g.lineWidth = 4; g.beginPath(); for (let k = 0; k < 7; k++) g.lineTo(-Math.sign(p.vx) * k * 14, (k % 2 ? -1 : 1) * R.range(4, 12)); g.stroke(); g.strokeStyle = '#b07aff'; g.lineWidth = 1.5; g.stroke(); break;
        case 11: case 'lava':
          if (p.s === 'lava') { const k = 1 - p.t / p.life; g.fillStyle = `rgba(255,90,20,${0.8 * k})`; g.beginPath(); g.ellipse(0, 4, p.r, 10, 0, 0, 7); g.fill(); g.fillStyle = `rgba(255,200,60,${0.8 * k})`; g.beginPath(); g.ellipse(0, 2, p.r * 0.6, 5, 0, 0, 7); g.fill(); if (Math.random() < 0.3) MGH.spark(g, R.range(-p.r, p.r), -R.range(4, 20), 2, '#ffb13d'); }
          else { MGH.glow(g, 0, 0, p.r * 2.6, 'rgba(255,120,40,0.6)'); g.fillStyle = '#5a2a1a'; g.beginPath(); g.arc(0, 0, p.r, 0, 7); g.fill(); g.fillStyle = '#ff7a2a'; for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(Math.cos(k * 2 + t * 3) * p.r * 0.4, Math.sin(k * 2 + t * 3) * p.r * 0.4, p.r * 0.32, 0, 7); g.fill(); } }
          break;
        case 12: MGH.glow(g, 0, 0, p.r * 3, 'rgba(255,240,170,0.8)'); MGH.star(g, 0, 0, p.r * 1.2, '#fff6c8', t * 6, false); break;
        case 13: MGH.glow(g, 0, 0, p.r * 2, 'rgba(150,130,255,0.5)'); g.rotate(t * 16); g.fillStyle = '#e8e2ff'; g.beginPath(); g.arc(0, 0, p.r, 0, 7); g.fill(); g.fillStyle = 'rgba(40,30,90,1)'; g.beginPath(); g.arc(p.r * 0.45, -p.r * 0.1, p.r * 0.85, 0, 7); g.fill(); break;
        case 14: g.rotate(p.spin || 0); g.fillStyle = '#9aa6b4'; for (let k = 0; k < 8; k++) { g.save(); g.rotate(k * Math.PI / 4); g.fillRect(-4, -p.r - 5, 8, 8); g.restore(); } g.beginPath(); g.arc(0, 0, p.r, 0, 7); g.fill(); g.fillStyle = '#4a5666'; g.beginPath(); g.arc(0, 0, p.r * 0.35, 0, 7); g.fill(); break;
      }
      g.restore();
    },
    projHit(p) {
      const cs = p.cs || 1;
      if (p.kind === 'sig') return p.hit;
      return { cyclone: H(5.5 * cs, 370, 11 * cs, 66), wave: H(8 * cs, 330, 10 * cs, 55), orb: H(7 * cs, 300, 9 * cs, 45), fire: H(7.5 * cs, 295, 9.2 * cs, 40), boulder: H(10.5 * cs, 350, 10.5 * cs, 45) }[p.kind];
    },

    // ------------------------------------------------------------ hazards
    startHazard(m, S) {
      if (!HAZ.length) { S.hazNext = 1e9; return; }
      let kind = R.pick(HAZ.filter(k => k !== S.hazLast)); S.hazLast = kind;
      S.haz = { kind, t: 0, dur: kind === 'gale' ? 5.5 : kind === 'lightning' ? 5 : 4.5, next: 0.6, dir: R.pick([-1, 1]) };
      S.banner = { text: HAZNAME[kind] + (kind === 'gale' ? (S.haz.dir > 0 ? ' →' : ' ←') : ''), t: 0 };
      if (kind === 'lightning') Sfx.thunder(); else Sfx.tone(300, 0.4, 'sawtooth', 0.04, -100);
    },
    tickHazard(m, S, dt) {
      const h = S.haz; h.t += dt; h.next -= dt;
      if (h.kind === 'gale') { S.wind = h.dir * Math.min(1, h.t, h.dur - h.t) * 1; if (Math.random() < 0.5) this.pushPart(S, h.dir > 0 ? S.cam.x - 800 : S.cam.x + 800, R.range(100, 900), 1, { col: 'rgba(255,255,255,0.6)', v: 900, a: h.dir > 0 ? 0 : Math.PI, spread: 0.05, life: 1.6, kind: 'streak', drag: 0 }); }
      if (h.next <= 0 && h.t < h.dur - 0.6) {
        if (h.kind === 'meteor') { h.next = 0.34; const x = R.range(STAGE.x0 - 80, STAGE.x1 + 80); S.warn.push({ kind: 'meteor', x, y: this.groundBelow(S, x, 0), t: 0, warn: 0.95 }); }
        if (h.kind === 'crystal') { h.next = 0.16; const x = R.range(STAGE.x0 - 100, STAGE.x1 + 100); S.warn.push({ kind: 'crystal', x, y: this.groundBelow(S, x, 0), t: 0, warn: 0.6 }); }
        if (h.kind === 'lightning') { h.next = 0.9; const alive = S.f.filter(f => f.lives > 0 && f.state !== 'dead'); const x = alive.length && Math.random() < 0.7 ? R.pick(alive).x + R.range(-60, 60) : R.range(STAGE.x0, STAGE.x1); S.warn.push({ kind: 'bolt', x, y: 0, t: 0, warn: 1.0 }); }
      }
      if (h.t >= h.dur) { S.haz = null; S.wind = 0; S.hazNext = R.range(12, 17); }
    },
    groundBelow(S, x, y) {
      let best = 1300;
      for (const p of this.plats(S)) if (x >= p.x0 && x <= p.x1 && p.y > y && p.y < best) best = p.y;
      if (x >= STAGE.x0 && x <= STAGE.x1 && STAGE.y > y && STAGE.y < best) best = STAGE.y;
      return best;
    },
    tickWarn(m, S, dt) {
      for (const w of S.warn) {
        w.t += dt;
        if (!w.fired && w.t >= w.warn) {
          w.fired = true;
          if (w.kind === 'meteor') { S.areas.push({ own: -1, kind: 'boom', x: w.x, y: w.y - 40, w: 150, h: 110, t: 0, life: 0.16, hit: H(11, 360, 9, 70), set: new Set(), hazard: true }); this.pushPart(S, w.x, w.y - 10, 26, { col: ['#ffe680', '#ff8a3d', '#ff3d1f', '#5a3a2a'], v: 420, life: 0.7, up: 120, grav: 900 }); S.shake = Math.max(S.shake, 8); Sfx.boom(); }
          if (w.kind === 'crystal') { S.areas.push({ own: -1, kind: 'shard', x: w.x, y: w.y - 30, w: 60, h: 70, t: 0, life: 0.1, hit: H(6, 260, 6.5, 80), set: new Set(), hazard: true }); this.pushPart(S, w.x, w.y - 8, 10, { col: ['#bff4ff', '#8fd8ff', '#ffffff'], v: 260, life: 0.5, up: 100, grav: 900, kind: 'spark', size: 2.5 }); Sfx.tone(1800 + Math.random() * 800, 0.08, 'triangle', 0.04); }
          if (w.kind === 'bolt') { S.areas.push({ own: -1, kind: 'bolt', x: w.x, y: 500, w: 80, h: 1400, t: 0, life: 0.18, hit: H(13, 400, 9.5, 90), set: new Set(), hazard: true }); S.flash = 0.15; S.shake = Math.max(S.shake, 12); Sfx.thunder(); }
        }
      }
      S.warn = S.warn.filter(w => w.t < w.warn + 0.35);
    },

    // ------------------------------------------------------------ main loop
    update(m, S, dt) {
      // slow motion for the final blow
      if (S.endT >= 0) { S.endT += dt; dt *= 0.3; if (S.endT > 1.6) { m.finish(this.score(m, S)); return; } }
      S.hitstopG = Math.max(0, S.hitstopG - dt);
      S.shake = Math.max(0, S.shake - dt * 40); S.flash = Math.max(0, S.flash - dt);
      if (S.banner) { S.banner.t += dt; if (S.banner.t > 2.4) S.banner = null; }
      if (!S.haz) { S.hazNext -= dt; if (S.hazNext <= 0 && m.t > 10) this.startHazard(m, S); } else this.tickHazard(m, S, dt);
      this.tickWarn(m, S, dt);
      this.tickTraps(m, S, dt);
      for (const f of S.f) this.tickFighter(m, S, f, dt);
      // pillars (Pebble's up+B) rise, carry, crumble
      for (const p of S.pillars) {
        p.t += dt;
        if (p.rising) {
          const ny = Math.max(p.target, p.y - 1100 * dt), dy = ny - p.y; p.y = ny;
          for (const f of S.f) if (f.ground === p || (f.i === p.own && f.state !== 'hit' && Math.abs(f.x - (p.x0 + p.x1) / 2) < 50 && f.y >= p.y - 4 && f.y <= p.base + 20)) { f.y = p.y; f.vy = 0; f.ground = p; }
          const box = { x0: p.x0, x1: p.x1, y0: p.y - 10, y1: p.y + 60 }; this.hitRectPillar(m, S, p, box);
          if (ny <= p.target || dy === 0) p.rising = false;
        }
        if (p.t > p.life - 0.3) p.solid = p.t < p.life;
      }
      for (const p of S.pillars) if (p.t >= p.life) { this.pushPart(S, (p.x0 + p.x1) / 2, p.y + 40, 14, { col: ['#a88a6a', '#7a5a3a'], v: 200, life: 0.6, grav: 900 }); for (const f of S.f) if (f.ground === p) f.ground = null; }
      S.pillars = S.pillars.filter(p => p.t < p.life);
      // areas
      for (const a of S.areas) {
        a.t += dt; if (a.vx) a.x += a.vx * dt; if (a.vy) a.y += a.vy * dt;
        if (a.groundY !== undefined && (a.x < STAGE.x0 - 10 || a.x > STAGE.x1 + 10)) a.t = a.life; // quakes only travel along the ground
        const box = this.rect(a.x, a.y, a.w, a.h);
        this.hitRect(m, S, a.own, box, a.hit, a.set, t => a.kind === 'bolt' ? (Math.sign(t.x - a.x) || 1) : a.vx ? Math.sign(a.vx) : (Math.sign(t.x - a.x) || 1), 1, { hazard: a.hazard });
        if (a.kind === 'quake' && Math.random() < 0.6) this.pushPart(S, a.x, a.groundY, 2, { col: ['#a88a6a', '#7a5a3a'], v: 150, life: 0.4, a: -Math.PI / 2, spread: 0.6, grav: 800 });
      }
      S.areas = S.areas.filter(a => a.t < a.life);
      // projectiles
      for (const p of S.proj) {
        p.t += dt;
        if (p.grav) p.vy += p.grav * dt;
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.kind === 'boulder') p.rot += p.vx * dt * 0.02;
        if (p.kind === 'sig') { this.sigTick(m, S, p, dt); if (p.harmless) continue; }
        if (p.kind === 'wave') { // rides along its platform and falls off the end
          const pl = p.plat, x0 = pl === 'stage' ? STAGE.x0 : pl.x0, x1 = pl === 'stage' ? STAGE.x1 : pl.x1;
          if (p.x < x0 - 10 || p.x > x1 + 10) p.t = p.life;
          if (Math.random() < 0.7) this.pushPart(S, p.x, p.y - 20, 1, { col: ['#bfe6ff', '#ffffff'], v: 140, life: 0.4, a: -Math.PI / 2, spread: 0.8, grav: 600 });
        }
        const box = p.kind === 'wave' ? this.rect(p.x, p.y - 30, p.r * 1.6, 64) : this.rect(p.x, p.y, p.r * 1.7, p.r * 1.7);
        if (p.own >= 0) this.hitSwitch(m, S, p.own, box);
        for (const t of S.f) {
          if (t.i === p.own || t.lives <= 0 || t.state === 'dead' || p.dead) continue;
          if (!this.overlap(box, this.hurtbox(t))) continue;
          if (p.kind === 'cyclone') {
            // multi-hit: draws the target in, then the last gust launches
            if ((p.tick[t.i] || 0) > 0) continue;
            p.count[t.i] = (p.count[t.i] || 0) + 1; p.tick[t.i] = p.multi;
            if (p.count[t.i] < 4) { if (t.inv <= 0 && t.shield <= 0) { t.pct = Math.min(999, t.pct + 2.2 * p.cs); t.vx = p.vx * 0.9; t.vy = -140; t.state = 'hit'; t.hitstun = 0.16; t.ground = null; t.hurtFlash = 0.15; this.pushPart(S, t.x, t.y - 40, 4, { col: '#ffffff', v: 150, life: 0.3, kind: 'spark', size: 2 }); Sfx.tone(900, 0.04, 'triangle', 0.03); } else if (t.shield > 0) { p.own = t.i; p.vx = -p.vx; } }
            else { this.applyHit(m, S, p.own, t.i, this.projHit(p), Math.sign(p.vx) || 1, 1, { proj: true }); p.dead = true; }
            continue;
          }
          if (p.pierce) { if ((p.tick[t.i] || 0) > 0) continue; p.tick[t.i] = p.every; }
          else { if (p.set.has(t.i)) continue; p.set.add(t.i); }
          const r = this.applyHit(m, S, p.own, t.i, this.projHit(p), Math.sign(p.vx) || 1, 1, { proj: true });
          if (r && r !== 'shield' && p.stun) { t.hitstun += p.stun; if (p.freeze) { t.frozen = p.stun + 0.2; this.say(S, 'FROZEN!', t.x, t.y - 110, '#bfe8ff', 22); } }
          if (r === 'shield' && p.pierce) { p.own = t.i; p.vx = -p.vx; continue; }
          if (r === 'shield') { p.own = t.i; p.vx = -p.vx * 1.1; p.set = new Set([t.i]); continue; }
          if (p.kind !== 'wave' && !p.pierce) p.dead = true;
        }
        if (p.tick) for (const k in p.tick) p.tick[k] -= dt;
        // fireballs and boulders hit the ground
        if ((p.kind === 'boulder' || p.kind === 'orb' || p.kind === 'fire') && p.vy >= 0) {
          const gy = this.groundBelow(S, p.x, p.y - p.vy * dt - 1);
          if (p.y + (p.kind === 'fire' ? 0 : p.r * 0.6) >= gy) {
            p.dead = true;
            if (p.kind === 'boulder') { S.areas.push({ own: p.own, kind: 'quakeC', x: p.x, y: gy - 25, w: 110, h: 50, t: 0, life: 0.1, hit: H(6, 280, 7, 75), set: new Set(p.set) }); Sfx.thud(); S.shake = Math.max(S.shake, 5); }
          }
        }
        if (p.dead) this.pushPart(S, p.x, p.y, 14, { col: p.kind === 'fire' ? ['#ffe680', '#ff8a3d', '#ff3d1f'] : p.kind === 'boulder' ? ['#a88a6a', '#7a5a3a', '#c9a36b'] : ['#bfe6ff', '#5fb8ff', '#ffffff'], v: 280, life: 0.5, grav: 700 });
      }
      S.proj = S.proj.filter(p => !p.dead && p.t < p.life && p.x > BLAST.x0 && p.x < BLAST.x1 && p.y < BLAST.y1);
      // particles and floating text
      for (const p of S.parts) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.grav || 0) * dt; p.vx *= 1 - Math.min(1, (p.drag || 0) * dt); p.vy *= 1 - Math.min(1, (p.drag || 0) * dt * 0.5); }
      S.parts = S.parts.filter(p => p.t < p.life);
      for (const t of S.texts) t.t += dt;
      S.texts = S.texts.filter(t => t.t < 0.9);
      this.camera(S, dt);
      // the end: one fighter left
      const alive = this.alive(S);
      if (alive.length <= 1 && S.endT < 0) { S.endT = 0; S.banner = { text: alive.length ? `🏆 ${m.players[alive[0].i].name} WINS!` : 'DRAW!', t: 0 }; Sfx.crowd('cheer'); }
    },
    hitRectPillar(m, S, p, box) { this.hitRect(m, S, p.own, box, H(9, 320, 9, 88), p.set, t => Math.sign(t.x - (p.x0 + p.x1) / 2) || 1); },

    tickFighter(m, S, f, dt) {
      if (f.lives <= 0) return;
      const cls = CLS[f.el], i = f.i;
      if (f.state === 'dead') {
        f.dead -= dt;
        if (f.dead <= 0) { this.spawn(f, i, false); f.mood = 'determined'; f.moodT = 1; }
        return;
      }
      f.inv = Math.max(0, f.inv - dt); f.hurtFlash = Math.max(0, f.hurtFlash - dt); f.frozen = Math.max(0, (f.frozen || 0) - dt); if (f.buffT > 0) { f.buffT -= dt; if (f.buffT <= 0) f.buff = null; } f.moodT -= dt; f.lastByT -= dt;
      f.cdProj -= dt; f.cdDown -= dt; f.shield = Math.max(0, f.shield - dt); f.braceCd -= dt; f.drop -= dt; f.trail -= dt;
      if (f.hs > 0) { f.hs -= dt; return; } // hitstop: frozen for a beat on impact
      const ax = m.axis(i).x, ay = m.axis(i).y;
      const canAct = f.state === 'idle' || f.state === 'brace';
      // ---- B: tap = strike, hold = charged shot, up = recover, down = slam
      if (f.state !== 'hit') {
        if (m.pressed(i, 'b') && canAct && !f.helpless) {
          if (ay < -0.5 && !f.upUsed) { f.state = 'idle'; this.startMove(m, S, f, 'up'); }
          else if (ay > 0.5 && f.cdDown <= 0) { f.state = 'idle'; this.startMove(m, S, f, 'down'); }
          else if (ay <= 0.5 && ay >= -0.5) { f.bHeld = true; f.charge = 0; f.state = 'idle'; }
        }
        if (f.bHeld) {
          if (m.held(i, 'b')) { f.charge += dt; if (f.charge > 0.2 && Math.random() < 0.5) this.pushPart(S, f.x - f.face * 18 + R.range(-14, 14), f.y - 46 + R.range(-14, 14), 1, { col: PCOL[f.el], v: 60, life: 0.4, a: -Math.PI / 2, spread: 1 }); }
          else {
            f.bHeld = false;
            if (f.state === 'idle') {
              if (f.charge < 0.2) this.startMove(m, S, f, 'jab');
              else if (f.cdProj <= 0) this.startMove(m, S, f, 'proj', clamp((f.charge - 0.2) / 0.8, 0, 1));
            }
            f.charge = 0;
          }
        }
      }
      // ---- state
      if (f.state === 'hit') {
        f.hitstun -= dt;
        f.vx *= Math.exp(-1.25 * dt); f.vx += ax * 220 * dt; // a little drift
        if (f.trail > 0 && Math.random() < 0.8) this.pushPart(S, f.x, f.y - 40, 1, { col: f.kb > 1500 ? '#ffe680' : 'rgba(230,230,240,0.8)', v: 20, life: 0.6, size: R.range(6, 12), kind: 'smoke' });
        if (f.hitstun <= 0) { f.state = 'idle'; f.spin = 0; }
      } else if (f.state === 'atk') this.tickMove(m, S, f, dt);
      // brace: hold down on the main stage
      if (f.state === 'idle' && f.ground === 'stage' && ay > 0.6 && !f.bHeld && f.braceCd <= 0 && Math.abs(ax) < 0.3) { f.state = 'brace'; f.brace = 0; }
      if (f.state === 'brace') { f.brace += dt; f.vx *= Math.pow(0.0001, dt); if (ay <= 0.6 || f.brace > 1.6 || f.ground !== 'stage') { f.state = 'idle'; f.braceCd = 0.9; } }
      // ---- movement
      const moving = f.state === 'idle';
      const chargeSlow = f.bHeld && f.charge > 0.2 ? 0.45 : 1;
      if (moving) {
        if (ax) f.face = ax > 0 ? 1 : -1;
        if (f.ground) {
          const tv = ax * cls.run * chargeSlow * (f.buff === 'speed' && f.buffT > 0 ? 1.35 : 1);
          const acc = ax ? 3600 : 3000;
          f.vx += clamp(tv - f.vx, -acc * dt, acc * dt);
        } else {
          f.vx += ax * 1900 * dt * chargeSlow;
          const cap = cls.air * (f.helpless ? 0.7 : 1);
          if (Math.abs(f.vx) > cap) f.vx -= Math.sign(f.vx) * Math.min(Math.abs(f.vx) - cap, 2400 * dt);
          if (!ax) f.vx *= Math.pow(0.35, dt);
        }
        // jump
        if (m.pressed(i, 'a') && !f.helpless && !f.bHeld) {
          if (f.ground) { f.vy = -cls.jump; f.ground = null; f.jumps = cls.jumps - 1; f.shortHop = 0.13; this.pushPart(S, f.x, f.y, 8, { col: ['#e8dcc4', '#c9b48a'], v: 140, life: 0.4, a: -Math.PI / 2, spread: 1.4 }); Sfx.tone(380, 0.06, 'triangle', 0.04, 260); }
          else if (f.jumps > 0) { f.vy = -cls.dj; f.jumps--; f.spinJ = 0.35; this.pushPart(S, f.x, f.y - 10, 10, { col: PCOL[f.el], v: 160, life: 0.4, a: Math.PI / 2, spread: 1.2 }); Sfx.tone(520, 0.07, 'triangle', 0.04, 300); }
        }
        // short hop: let go of A early
        if (f.shortHop > 0) { f.shortHop -= dt; if (!m.held(i, 'a') && f.vy < -400) { f.vy *= 0.55; f.shortHop = 0; } }
        // drop through a floating platform
        if (f.ground && f.ground !== 'stage' && f.ground !== 'respawn' && ay > 0.6 && (f.pay || 0) <= 0.6) { f.dropFrom = f.ground; f.drop = 0.28; f.ground = null; f.vy = 120; }
      }
      f.pay = ay;
      // gale pushes everyone
      if (S.wind) f.vx += S.wind * (f.ground ? 520 : 760) * dt;
      // respawn platform: stand on it until you move or it fades
      if (f.ground === 'respawn') { f.respawnPlat -= dt; f.vy = 0; if (Math.abs(ax) > 0.2 || m.pressed(i, 'a') || f.respawnPlat <= 0 || f.state === 'atk') { f.ground = null; f.respawnPlat = 0; } }
      // gravity
      if (!f.ground) {
        const fast = moving && ay > 0.6 && f.vy > 0 ? 1.45 : 1;
        if (!(f.state === 'atk' && f.mvKind === 'up' && f.mvT < f.mv.st + f.mv.act && f.el !== 3)) f.vy += GRAV * dt;
        if (f.state === 'atk' && f.mvKind === 'up' && f.el === 3 && f.mvT < f.mv.st) f.vy = Math.min(f.vy, 0);
        const cap = f.state === 'hit' ? 2600 : cls.fall * fast;
        if (f.vy > cap) f.vy = f.state === 'hit' ? f.vy : cap;
        if (fast > 1 && f.vy < cap) f.vy = Math.max(f.vy, cls.fall * 0.9);
      }
      this.collide(m, S, f, dt);
      if (A.cage) {
        // a closed arena: walls and ceiling bounce you back in; you're out when your HP runs out
        const c = A.cage, hard = f.state === 'hit';
        if (f.x < c.x0 + 26) { f.x = c.x0 + 26; if (f.vx < 0) { if (hard && f.vx < -500) this.wallHit(S, f, 'x'); f.vx = hard ? -f.vx * 0.45 : 0; } }
        if (f.x > c.x1 - 26) { f.x = c.x1 - 26; if (f.vx > 0) { if (hard && f.vx > 500) this.wallHit(S, f, 'x'); f.vx = hard ? -f.vx * 0.45 : 0; } }
        if (f.y - 84 < c.y0) { f.y = c.y0 + 84; if (f.vy < 0) { if (hard && f.vy < -500) this.wallHit(S, f, 'y'); f.vy = hard ? -f.vy * 0.4 : 0; } }
        if (f.pct >= A.stamina && f.hs <= 0) this.ko(m, S, f);
      } else if (f.x < BLAST.x0 || f.x > BLAST.x1 || f.y > BLAST.y1 || f.y < (BLAST.y0 > -1000 ? -380 : BLAST.y0)) this.ko(m, S, f); // KO: out of the arena — flying (or powering) off the top of the sky counts too
    },
    collide(m, S, f, dt) {
      const px = f.x, py = f.y;
      f.x += f.vx * dt; f.y += f.vy * dt;
      if (f.ground === 'respawn') { f.x = px; f.y = py; return; }
      const wasGround = f.ground;
      // still standing?
      if (f.ground) {
        const g = f.ground === 'stage' ? STAGE : f.ground;
        if (f.x < g.x0 - 4 || f.x > g.x1 + 4 || (g !== STAGE && !S.pillars.includes(g) && !SOFT.includes(g)) || (g.solid === false) || g.offT > 0) f.ground = null;
        else { f.y = g.y; f.vy = 0; }
      }
      if (!f.ground && f.vy >= 0) {
        // land on the main stage
        if (py <= STAGE.y + 1 && f.y >= STAGE.y && f.x >= STAGE.x0 - 4 && f.x <= STAGE.x1 + 4) this.land(m, S, f, 'stage', STAGE.y);
        else for (const p of this.plats(S)) {
          if (f.drop > 0 && f.dropFrom === p) continue;
          if (py <= p.y + 1 && f.y >= p.y && f.x >= p.x0 - 4 && f.x <= p.x1 + 4) { this.land(m, S, f, p, p.y); break; }
        }
      }
      // the main stage is a solid block: sides and underside push you out
      if (f.ground !== 'stage' && f.y > STAGE.y + 2 && f.y - 70 < STAGE.y + STAGE.th && f.x > STAGE.x0 - 22 && f.x < STAGE.x1 + 22) {
        if (py - 70 >= STAGE.y + STAGE.th - 2 && f.vy < 0) { f.y = STAGE.y + STAGE.th + 70; f.vy = 0; } // bonk the underside
        else if (px <= STAGE.x0 - 20) { f.x = STAGE.x0 - 22; f.vx = Math.min(0, f.vx) * (f.state === 'hit' ? -0.4 : 1); }
        else if (px >= STAGE.x1 + 20) { f.x = STAGE.x1 + 22; f.vx = Math.max(0, f.vx) * (f.state === 'hit' ? -0.4 : 1); }
      }
      // ledge snap: just below the lip and heading for the stage? climb up
      if (!f.ground && f.state !== 'hit' && f.vy > -300 && f.y > STAGE.y && f.y < STAGE.y + 80) {
        const ax = m.axis(f.i).x;
        if (f.x < STAGE.x0 && f.x > STAGE.x0 - 60 && ax >= 0) { f.x = STAGE.x0 + 12; this.land(m, S, f, 'stage', STAGE.y); f.inv = Math.max(f.inv, 0.25); }
        else if (f.x > STAGE.x1 && f.x < STAGE.x1 + 60 && ax <= 0) { f.x = STAGE.x1 - 12; this.land(m, S, f, 'stage', STAGE.y); f.inv = Math.max(f.inv, 0.25); }
      }
      if (!wasGround && f.ground && f.state === 'atk' && f.mvKind === 'jab') { /* keep going */ }
    },
    land(m, S, f, g, y) {
      const hard = f.vy > 900;
      f.ground = g; f.y = y; f.vy = 0; f.jumps = CLS[f.el].jumps; f.upUsed = false; f.helpless = false;
      if (f.state === 'hit') { if (f.kb > 1000 && f.hitstun > 0.15) { f.vy = -f.kb * 0.25; f.ground = null; f.hitstun *= 0.6; f.kb *= 0.5; this.pushPart(S, f.x, y, 12, { col: ['#e8dcc4', '#ffffff'], v: 240, life: 0.4, a: -Math.PI / 2, spread: 1.4 }); return; } f.state = 'idle'; f.spin = 0; }
      f.landT = 0.12;
      if (hard) { this.pushPart(S, f.x, y, 10, { col: ['#e8dcc4', '#c9b48a'], v: 200, life: 0.45, a: -Math.PI / 2, spread: 1.5 }); Sfx.thud(); }
    },
    // ------------------------------------------------------------ arena switches and traps
    wallHit(S, f, ax) { S.shake = Math.max(S.shake, 6); Sfx.thud(); this.pushPart(S, f.x, f.y - 40, 10, { col: ['#e8dcc4', '#ffffff', '#a8a0b8'], v: 220, life: 0.4 }); f.pct = Math.min(999, f.pct + 2); },
    hitSwitch(m, S, i, box) {
      for (const w of S.sw) {
        if (w.cd > 0) continue;
        if (!this.overlap(box, { x0: w.x - 30, x1: w.x + 30, y0: w.y - 80, y1: w.y })) continue;
        w.cd = w.cdMax || 9; w.pull = 0.5; w.by = i;
        this.say(S, w.label || 'TRAP!', w.x, w.y - 110, m.players[i].color, 26); Sfx.tone(700, 0.08, 'square', 0.05); Sfx.tone(1050, 0.12, 'square', 0.05, 0, 0.08);
        A.fire(this, m, S, w, i);
      }
    },
    trap(S, o) { S.traps.push(Object.assign({ t: 0, warn: 0.7, life: 0.5, set: new Set(), own: -1 }, o)); },
    tickItems(m, S, dt) {
      S.items = S.items || []; S.itemT = (S.itemT === undefined ? 7 : S.itemT) - dt;
      if (S.itemT <= 0 && S.items.length < 2) {
        S.itemT = R.range(8, 12);
        const spots = [{ x0: STAGE.x0 + 60, x1: STAGE.x1 - 60 }].concat(SOFT.map(p => ({ x0: p.x0 + 30, x1: p.x1 - 30 })));
        const sp = R.pick(spots); S.items.push({ it: R.pick(ITEMS), x: R.range(sp.x0, sp.x1), y: (A.cage ? A.cage.y0 : STAGE.y - 700) + 20, vy: 0, t: 0, land: false });
      }
      for (const it of S.items) {
        it.t += dt;
        if (!it.land) { it.vy += 1100 * dt; const gy = this.groundBelow(S, it.x, it.y - 2); it.y += it.vy * dt; if (it.y >= gy - 20) { it.y = gy - 20; it.land = true; Sfx.thud(); } }
        for (const f of S.f) {
          if (it.dead || f.lives <= 0 || f.state === 'dead' || Math.abs(f.x - it.x) > 46 || Math.abs(f.y - 36 - it.y) > 60) continue;
          it.dead = true; const k = it.it.k;
          if (k === 'heal') f.pct = Math.max(0, f.pct - 30);
          else if (k === 'shield') f.shield = 2.5;
          else if (k === 'star') f.inv = Math.max(f.inv, 5);
          else { f.buff = k; f.buffT = 8; }
          this.say(S, it.it.label, f.x, f.y - 120, it.it.col, 26); Sfx.coin(); this.pushPart(S, it.x, it.y, 16, { col: [it.it.col, '#ffffff'], v: 260, life: 0.5 });
        }
      }
      S.items = S.items.filter(it => !it.dead && it.t < 14);
    },
    drawItems(g, S, t) {
      for (const it of S.items || []) {
        if (it.t > 12 && Math.floor(t * 10) % 2) continue;
        const bob = it.land ? Math.sin(t * 4 + it.x) * 4 : 0;
        if (!it.land) { g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(it.x - 16, it.y - 18); g.lineTo(it.x, it.y - 60); g.lineTo(it.x + 16, it.y - 18); g.stroke(); g.fillStyle = '#ff6b8a'; g.beginPath(); g.arc(it.x, it.y - 70, 26, Math.PI, 0); g.fill(); }
        MGH.glow(g, it.x, it.y + bob, 50, it.it.col + '88');
        g.fillStyle = '#c88a4a'; MGH.rr(g, it.x - 20, it.y - 20 + bob, 40, 40, 8); g.fill(); g.strokeStyle = '#7a4a1a'; g.lineWidth = 3; g.stroke();
        g.fillStyle = 'rgba(255,255,255,0.85)'; MGH.rr(g, it.x - 15, it.y - 15 + bob, 30, 30, 6); g.fill();
        MGH.emoji(g, it.it.icon, it.x, it.y + 8 + bob, 22);
      }
    },
    trapBox(q, t) { const x = q.vx ? q.x + q.vx * Math.max(0, t - q.warn) : q.x; return this.rect(x, q.y, q.w, q.h); },
    tickTraps(m, S, dt) {
      if (A.items) this.tickItems(m, S, dt);
      for (const p of SOFT) if (p.offT > 0) p.offT -= dt;
      for (const w of S.sw) { w.cd -= dt; w.pull = Math.max(0, w.pull - dt); }
      for (const q of S.traps) {
        q.t += dt;
        if (q.t >= q.warn && q.t - dt < q.warn) { if (q.kind === 'flame' || q.kind === 'geyser') Sfx.noise(0.5, 900, 0.08, 'bandpass', 0, 600); else if (q.kind === 'shock') Sfx.tone(120, 0.5, 'sawtooth', 0.06, 40); else if (q.kind === 'spikes') { Sfx.tone(900, 0.06, 'square', 0.05); S.shake = Math.max(S.shake, 4); } else Sfx.boom(); }
        if (q.t >= q.warn && q.t < q.warn + q.life) {
          const box = this.trapBox(q, q.t);
          this.hitRect(m, S, q.own, box, q.hit, q.set, t => q.vx ? Math.sign(q.vx) : q.dir || (Math.sign(t.x - (box.x0 + box.x1) / 2) || 1), 1, { hazard: q.own < 0, trap: true, proj: true });
          if (q.kind === 'ball' || q.kind === 'cannon') if (Math.random() < 0.6) this.pushPart(S, (box.x0 + box.x1) / 2, (box.y0 + box.y1) / 2, 1, { col: q.kind === 'cannon' ? 'rgba(80,80,90,0.7)' : '#ffe680', v: 40, life: 0.5, size: 10, kind: 'smoke' });
        }
      }
      S.traps = S.traps.filter(q => q.t < q.warn + q.life + 0.2);
    },
    drawSwitches(g, m, S, t) {
      for (const w of S.sw) {
        const ready = w.cd <= 0, x = w.x, y = w.y;
        if (ready) MGH.glow(g, x, y - 40, 70, 'rgba(255,220,90,0.45)');
        g.fillStyle = '#3a3040'; MGH.rr(g, x - 22, y - 14, 44, 14, 4); g.fill();
        if (w.look === 'gong') { g.strokeStyle = '#6a4a2a'; g.lineWidth = 6; g.beginPath(); g.moveTo(x - 30, y - 14); g.lineTo(x - 30, y - 96); g.lineTo(x + 30, y - 96); g.lineTo(x + 30, y - 14); g.stroke(); g.fillStyle = ready ? '#ffcf4d' : '#a08a4a'; g.beginPath(); g.arc(x + (w.pull > 0 ? Math.sin(t * 50) * 3 : 0), y - 56, 24, 0, 7); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 2; g.beginPath(); g.arc(x, y - 56, 14, 0, 7); g.stroke(); }
        else if (w.look === 'button') { g.fillStyle = '#5a5a6a'; g.fillRect(x - 8, y - 50, 16, 40); g.fillStyle = ready ? '#ff4d4d' : '#7a3a3a'; g.beginPath(); g.ellipse(x, y - 52 + (w.pull > 0 ? 6 : 0), 20, 9, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,0.4)'; g.beginPath(); g.ellipse(x - 5, y - 55, 7, 3, 0, 0, 7); g.fill(); }
        else { const a = w.pull > 0 ? 0.7 : -0.7; g.strokeStyle = '#8a8a96'; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y - 14); g.lineTo(x + Math.sin(a) * 56, y - 14 - Math.cos(a) * 56); g.stroke(); g.fillStyle = ready ? '#ff6a3d' : '#7a5a4a'; g.beginPath(); g.arc(x + Math.sin(a) * 56, y - 14 - Math.cos(a) * 56, 11, 0, 7); g.fill(); }
        if (!ready) { g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 4; g.beginPath(); g.arc(x, y - 120, 13, -Math.PI / 2, -Math.PI / 2 + (1 - w.cd / (w.cdMax || 9)) * Math.PI * 2); g.stroke(); }
        else this.outlined(g, w.icon || '⚙️', x, y - 112 + Math.sin(t * 4) * 4, 22, '#ffe680');
      }
    },
    drawTraps(g, S, t) {
      for (const q of S.traps) {
        const pre = q.t < q.warn, k = pre ? q.t / q.warn : (q.t - q.warn) / q.life, b = this.trapBox(q, q.t);
        const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
        g.save();
        if (pre) {
          // warning: a pulsing outline where it will strike (in the colour of whoever set it off)
          const col = q.col || 'rgba(255,90,60,1)';
          g.globalAlpha = 0.12 + 0.2 * Math.abs(Math.sin(q.t * 14)); g.fillStyle = col; const wb = q.vx ? this.rect(q.x + q.vx * 0.0, q.y, q.w, q.h) : b;
          if (q.vx) { g.fillRect(Math.min(q.x, q.x + q.vx * q.life) - q.w / 2, q.y - q.h / 2, Math.abs(q.vx * q.life) + q.w, q.h); } else g.fillRect(wb.x0, wb.y0, wb.x1 - wb.x0, wb.y1 - wb.y0);
          g.restore(); continue;
        }
        if (q.kind === 'spikes') { g.fillStyle = '#d8dce8'; g.strokeStyle = '#6a6a7a'; g.lineWidth = 2; const up = Math.min(1, k * 6) * (k > 0.85 ? (1 - k) / 0.15 : 1); for (let x = b.x0; x < b.x1; x += 26) { g.beginPath(); g.moveTo(x, b.y1); g.lineTo(x + 13, b.y1 - 60 * up); g.lineTo(x + 26, b.y1); g.closePath(); g.fill(); g.stroke(); } }
        else if (q.kind === 'flame') { const hh = (b.y1 - b.y0) * Math.min(1, k * 5) * (k > 0.85 ? (1 - k) / 0.15 : 1); for (let n = -1; n <= 1; n++) MGH.flame(g, cx + n * 18, b.y1, hh / 52 * (n ? 0.75 : 1), t * 1.6, n * 3 + cx); }
        else if (q.kind === 'geyser') { const sand = q.kind === 'geyser', gr = g.createLinearGradient(0, b.y1, 0, b.y0); gr.addColorStop(0, sand ? 'rgba(200,160,90,0.95)' : 'rgba(255,90,30,0.95)'); gr.addColorStop(0.6, sand ? 'rgba(240,210,150,0.8)' : 'rgba(255,190,70,0.85)'); gr.addColorStop(1, 'rgba(255,240,200,0)'); g.fillStyle = gr; const hh = (b.y1 - b.y0) * Math.min(1, k * 5); for (let s = -1; s <= 1; s++) { g.beginPath(); g.moveTo(cx + s * 16 - 22, b.y1); g.quadraticCurveTo(cx + s * 12 + Math.sin(t * 24 + s) * 10, b.y1 - hh - 20, cx + s * 16 + 22, b.y1); g.fill(); } }
        else if (q.kind === 'shock') { g.strokeStyle = '#9ff0ff'; g.lineWidth = 3; g.shadowColor = '#5fd8ff'; g.shadowBlur = 14; for (let n = 0; n < 4; n++) { g.beginPath(); let x = b.x0, y = b.y1 - 8; g.moveTo(x, y); while (x < b.x1) { x += 30; y = b.y1 - 8 - R.range(0, b.y1 - b.y0 - 10); g.lineTo(x, y); } g.stroke(); } g.shadowBlur = 0; g.fillStyle = 'rgba(120,230,255,0.18)'; g.fillRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0); }
        else if (q.kind === 'ball') { g.strokeStyle = '#6a6a7a'; g.lineWidth = 6; g.beginPath(); g.moveTo(cx, q.anchor || 80); g.lineTo(cx, cy); g.stroke(); MGH.rock(g, cx, cy, 44, 7, '#4a4a58', t * 6 * Math.sign(q.vx)); g.fillStyle = '#c8ccd8'; for (let s = 0; s < 8; s++) { const a = s * Math.PI / 4 + t * 6 * Math.sign(q.vx); g.beginPath(); g.moveTo(cx + Math.cos(a) * 40, cy + Math.sin(a) * 40); g.lineTo(cx + Math.cos(a + 0.12) * 60, cy + Math.sin(a + 0.12) * 60); g.lineTo(cx + Math.cos(a + 0.24) * 40, cy + Math.sin(a + 0.24) * 40); g.fill(); } }
        else if (q.kind === 'cannon') { MGH.glow(g, cx, cy, 50, 'rgba(255,140,60,0.4)'); g.fillStyle = '#2a2a34'; g.beginPath(); g.arc(cx, cy, 26, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.arc(cx - 8, cy - 8, 8, 0, 7); g.fill(); }
        g.restore();
      }
    },
    ko(m, S, f) {
      f.lives--; f.state = 'dead'; f.dead = 1.6; f.mv = null; f.bHeld = false;
      const by = f.lastByT > 0 && f.lastBy >= 0 ? f.lastBy : -1;
      if (by >= 0) { S.f[by].kos++; S.f[by].mood = 'cheer'; S.f[by].moodT = 1.2; }
      // a blast of colour from the edge of the screen where they flew out
      const ex = clamp(f.x, S.cam.x - 640 / S.cam.z + 40, S.cam.x + 640 / S.cam.z - 40), ey = clamp(f.y, S.cam.y - 340 / S.cam.z + 40, S.cam.y + 340 / S.cam.z - 40);
      const ang = Math.atan2(S.cam.y - ey, S.cam.x - ex);
      S.areas.push({ own: -1, kind: 'kofx', x: ex, y: ey, w: 1, h: 1, t: 0, life: 0.9, hit: H(0, 0, 0, 0), set: new Set(S.f.map(o => o.i)), col: m.players[f.i].color, ang });
      this.pushPart(S, ex, ey, 40, { col: [m.players[f.i].color, '#ffe680'], v: 600, life: 0.8, a: ang, spread: 0.9, kind: 'spark', size: 4 });
      S.shake = 14; S.flash = 0.14; Sfx.boom(); Sfx.boom(); Sfx.crowd(f.lives > 0 ? 'ooh' : 'cheer');
      if (f.lives <= 0) { f.place = 4 - S.elimOrder; S.elimOrder++; f.elimT = m.t; S.banner = { text: `${m.players[f.i].name} is OUT!`, t: 0 }; }
      else S.banner = { text: f.lives === 1 ? `⚠ ${m.players[f.i].name}: LAST LIFE!` : by >= 0 ? `${m.players[by].name} KOs ${m.players[f.i].name}!` : `${m.players[f.i].name} fell!`, t: 0 };
    },
    camera(S, dt) {
      const pts = S.f.filter(f => f.lives > 0 && f.state !== 'dead');
      let x0 = STAGE.x0 + 120, x1 = STAGE.x1 - 120, y0 = 300, y1 = STAGE.y + 60;
      for (const f of pts) { x0 = Math.min(x0, f.x - 200); x1 = Math.max(x1, f.x + 200); y0 = Math.min(y0, f.y - 260); y1 = Math.max(y1, f.y + 140); }
      const z = clamp(Math.min(1280 / (x1 - x0), 560 / (y1 - y0)), 0.5, 1.15);
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2 + 20;
      const k = 1 - Math.exp(-4 * dt);
      S.cam.x += (cx - S.cam.x) * k; S.cam.y += (cy - S.cam.y) * k; S.cam.z += (z - S.cam.z) * k;
      if (A.cage) { const c = A.cage, hw = 640 / S.cam.z, hh = 345 / S.cam.z; S.cam.z = Math.max(S.cam.z, Math.min(1280 / (c.x1 - c.x0 + 120), 1)); S.cam.x = clamp(S.cam.x, c.x0 - 60 + hw, Math.max(c.x0 - 60 + hw, c.x1 + 60 - hw)); S.cam.y = clamp(S.cam.y, c.y0 - 40 + hh, Math.max(c.y0 - 40 + hh, STAGE.y + 140 - hh)); }
      // a quick zoom toward a smash
      if (S.punch && S.punch.t > 0) { S.punch.t -= dt; const q = Math.sin(S.punch.t / 0.35 * Math.PI) * 0.12; S.cam.x += (S.punch.x - S.cam.x) * q * 0.5; S.cam.y += (S.punch.y - S.cam.y) * q * 0.5; S.cam.z *= 1 + q * 0.5; }
    },
    score(m, S) {
      return S.f.map(f => f.lives > 0 ? 100000 + f.lives * 1000 + (999 - Math.min(999, Math.round(f.pct))) : (f.elimT || 0));
    },
    fmt(s) { if (s >= 100000) { const l = Math.floor((s - 100000) / 1000), p = 999 - (s - 100000) % 1000; return A.stamina ? `${l} ${l === 1 ? 'life' : 'lives'} left · ${Math.max(0, A.stamina - (999 - p))} HP` : `${l} ${l === 1 ? 'life' : 'lives'} left · ${p}%`; } return `out at ${Math.round(s)}s`; },
    hud(m, S, i) { const f = S.f[i]; return f.lives > 0 ? `${'♥'.repeat(f.lives)}` : 'OUT'; },

    // ------------------------------------------------------------ bots
    dangerAt(S, x, y) {
      for (const q of S.traps) { if (q.t > q.warn + q.life) continue; const bx = this.trapBox(q, q.t < q.warn ? q.warn : q.t); if (x > bx.x0 - 50 && x < bx.x1 + 50 && y > bx.y0 - 20 && y < bx.y1 + 90) return Math.sign(x - (bx.x0 + bx.x1) / 2) || 1; }
      for (const w of S.warn) { if (w.fired) continue; const r = w.kind === 'bolt' ? 80 : w.kind === 'meteor' ? 110 : 60; if (Math.abs(w.x - x) < r && (w.kind === 'bolt' || Math.abs(w.y - y) < 140)) return Math.sign(x - w.x) || 1; }
      return 0;
    },
    bot(m, S, i, dt) {
      const f = S.f[i], v = m.vin[i];
      const B = f.ai || (f.ai = { hold: 0, cd: 0, jcd: 0, think: 0, react: R.range(0.1, 0.24), wait: 0, edge: 0 });
      v.left = v.right = v.up = v.down = false; v.ax = 0; v.ay = 0; v.a = false;
      const press = k => { v[k] = !m.prev[i][k]; };
      if (f.lives <= 0 || f.state === 'dead') { v.b = false; B.hold = 0; return; }
      B.cd -= dt; B.jcd -= dt; B.wait -= dt;
      if (B.hold > 0) { B.hold -= dt; v.b = B.hold > 0; if (f.state === 'hit') { B.hold = 0; v.b = false; } v.ax = B.face || 0; return; }
      v.b = false;
      if (f.ground === 'respawn') { v.ax = R.pick([-1, 1]); return; }
      const Cx = (STAGE.x0 + STAGE.x1) / 2;
      // 1) get back to the arena
      const offX = f.x < STAGE.x0 - 4 || f.x > STAGE.x1 + 4, low = f.y > STAGE.y + 4;
      if (!f.ground && (offX || low)) {
        const dir = Math.sign(Cx - f.x); v.ax = dir;
        if (f.state !== 'hit' && !f.helpless && f.state !== 'atk') {
          if (f.vy > -200 && f.jumps > 0 && B.jcd <= 0 && f.y > STAGE.y - 170) { press('a'); B.jcd = 0.28; }
          else if (f.jumps === 0 && !f.upUsed && f.vy > -50 && (f.y > STAGE.y - 80 || Math.abs(f.x - Cx) > 620)) { v.ay = -1; press('b'); }
        }
        return;
      }
      // 2) dodge hazards
      const dz = this.dangerAt(S, f.x, f.y);
      if (dz) { v.ax = dz; if (f.ground === 'stage' && (f.x + dz * 80 < STAGE.x0 + 30 || f.x + dz * 80 > STAGE.x1 - 30)) v.ax = -dz; if (B.jcd <= 0 && Math.random() < 0.05) { press('a'); B.jcd = 0.5; } return; }
      if (S.wind && f.ground === 'stage') { const edgeD = S.wind > 0 ? STAGE.x1 - f.x : f.x - STAGE.x0; if (edgeD < 260) { v.ax = -Math.sign(S.wind); } }
      // 2b) a switch within reach that would catch a rival: hit it
      for (const w of S.sw) if (w.cd <= 0 && Math.abs(w.x - f.x) < 70 && Math.abs(w.y - f.y) < 60 && A.useful && A.useful(this, S, w, f) && Math.random() < 0.2) { v.ax = (Math.sign(w.x - f.x) || f.face) * 0.3; press('b'); return; }
      if (A.botGoal) { const goal = A.botGoal(this, S, f); if (goal && Math.random() < 0.6) { v.ax = Math.sign(goal.x - f.x); if (goal.y < f.y - 90 && f.ground && B.jcd <= 0) { press('a'); B.jcd = 0.45; } return; } }
      // 2c) a crate close by: go and grab it
      const crate = (S.items || []).find(it => it.land && Math.abs(it.x - f.x) < 320 && Math.abs(it.y - f.y) < 140);
      if (crate && Math.random() < 0.7) { v.ax = Math.sign(crate.x - f.x); if (crate.y < f.y - 80 && f.ground && B.jcd <= 0) { press('a'); B.jcd = 0.45; } return; }
      // 3) pick a target: close and hurt is juicy
      let t = null, best = 1e9;
      for (const o of S.f) { if (o === f || o.lives <= 0 || o.state === 'dead' || o.inv > 0.5) continue; const d = Math.hypot(o.x - f.x, (o.y - f.y) * 1.4) - o.pct * 1.2; if (d < best) { best = d; t = o; } }
      if (!t) return;
      const dx = t.x - f.x, dy = t.y - f.y, adx = Math.abs(dx), reach = REACH[f.el];
      const faceT = Math.sign(dx) || f.face;
      // brace when someone is winding up right next to us
      if (f.ground === 'stage' && f.braceCd <= 0 && t.state === 'atk' && t.mvT < (t.mv ? t.mv.st : 0) + 0.02 && adx < 130 && Math.abs(dy) < 60 && Math.random() < 0.35) { v.ay = 1; return; }
      // edge-guard: they're off stage and we're near the lip -> shoot
      const tOff = t.x < STAGE.x0 - 20 || t.x > STAGE.x1 + 20;
      if (f.ground && tOff && B.cd <= 0 && f.cdProj <= 0 && Math.abs(dy) < 260) { B.face = faceT; v.ax = faceT * 0.01; B.hold = 0.25 + Math.random() * 0.5; v.b = true; B.cd = 0.8; return; }
      if (B.cd <= 0 && adx < reach && Math.abs(dy) < 62) {
        if (B.wait <= 0) { B.wait = B.react; }
        if (B.wait <= 0.02) {
          v.ax = faceT * 0.3; // face them
          const near2 = S.f.filter(o => o !== f && o.lives > 0 && o.state !== 'dead' && Math.abs(o.x - f.x) < 150 && Math.abs(o.y - f.y) < 70).length;
          if ((near2 >= 2 || Math.random() < 0.15) && f.cdDown <= 0 && f.ground) { v.ay = 1; press('b'); }
          else if (dy < -40 && !f.upUsed && Math.random() < 0.25) { v.ay = -1; press('b'); }
          else press('b');
          B.cd = 0.3 + Math.random() * 0.3 + (f.el === 3 ? 0.1 : 0); B.wait = 0;
        }
        return;
      }
      // ranged poke from mid range
      if (B.cd <= 0 && f.cdProj <= 0 && adx > 260 && adx < 760 && Math.abs(dy) < 80 && Math.random() < 0.025) { B.face = faceT; B.hold = 0.24 + Math.random() * 0.7; v.b = true; B.cd = 0.9; return; }
      // move in
      let mv = adx > reach * 0.7 ? faceT : 0;
      // don't run off the stage
      if (f.ground === 'stage' && ((mv < 0 && f.x < STAGE.x0 + 40) || (mv > 0 && f.x > STAGE.x1 - 40))) mv = 0;
      v.ax = mv;
      // follow them up and down between platforms
      if (dy < -90 && adx < 260 && f.ground && B.jcd <= 0) { press('a'); B.jcd = 0.45; }
      else if (dy > 90 && f.ground && f.ground !== 'stage' && adx < 240) { v.ay = 1; v.down = true; }
      else if (!f.ground && dy < -60 && f.jumps > 0 && f.vy > 0 && B.jcd <= 0 && adx < 200) { press('a'); B.jcd = 0.4; }
    },

    // ------------------------------------------------------------ drawing
    draw(m, S, g) {
      const cam = S.cam, z = cam.z, t = m.t;
      (A.drawBack || this.drawBack).call(this, g, S, t);
      g.save();
      const sh = S.shake;
      g.translate(640 + (sh ? R.range(-sh, sh) : 0), 345 + (sh ? R.range(-sh, sh) : 0)); g.scale(z, z); g.translate(-cam.x, -cam.y);
      (A.drawStage || this.drawStage).call(this, g, S, t);
      this.drawSwitches(g, m, S, t); this.drawTraps(g, S, t); this.drawItems(g, S, t);
      // hazard warnings
      for (const w of S.warn) {
        const k = w.t / w.warn;
        if (w.kind === 'bolt') {
          if (!w.fired) { g.fillStyle = `rgba(255,255,160,${0.08 + 0.18 * (Math.sin(w.t * 30) * 0.5 + 0.5) * k})`; g.fillRect(w.x - 40, -400, 80, 1700); g.strokeStyle = 'rgba(255,255,200,0.6)'; g.setLineDash([12, 10]); g.lineWidth = 3; g.strokeRect(w.x - 40, -400, 80, 1700); g.setLineDash([]); }
          else { const q = (w.t - w.warn) / 0.35; g.save(); g.globalAlpha = 1 - q; g.strokeStyle = '#fffbe0'; g.lineWidth = 10; g.shadowColor = '#ffe680'; g.shadowBlur = 30; g.beginPath(); let x = w.x, y = -400; g.moveTo(x, y); while (y < 1100) { y += 60; x = w.x + R.range(-26, 26); g.lineTo(x, y); } g.stroke(); g.lineWidth = 4; g.strokeStyle = '#ffffff'; g.stroke(); g.restore(); }
        } else {
          if (!w.fired) {
            g.strokeStyle = w.kind === 'meteor' ? `rgba(255,90,40,${0.4 + 0.5 * k})` : `rgba(160,230,255,${0.4 + 0.5 * k})`; g.lineWidth = 3;
            const rr = (w.kind === 'meteor' ? 60 : 28) * (1.4 - k * 0.4);
            g.beginPath(); g.ellipse(w.x, w.y, rr, rr * 0.3, 0, 0, 7); g.stroke(); g.beginPath(); g.ellipse(w.x, w.y, rr * 0.5, rr * 0.15, 0, 0, 7); g.stroke();
            // the falling thing itself
            const fy = w.y - (1 - k) * 900;
            if (w.kind === 'meteor') { MGH.glow(g, w.x, fy, 70, 'rgba(255,120,40,0.5)'); g.strokeStyle = 'rgba(255,160,60,0.5)'; g.lineWidth = 16; g.beginPath(); g.moveTo(w.x + 60, fy - 160); g.lineTo(w.x, fy); g.stroke(); MGH.rock(g, w.x, fy, 26, w.x, '#5a3a2a', t * 4); MGH.fireball(g, w.x, fy, 30, t, -0.3, 1); }
            else { g.save(); g.translate(w.x, fy); g.fillStyle = '#bff4ff'; g.strokeStyle = '#5fb8ff'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 22); g.lineTo(-9, -6); g.lineTo(0, -26); g.lineTo(9, -6); g.closePath(); g.fill(); g.stroke(); g.restore(); }
          }
        }
      }
      // pillars
      for (const p of S.pillars) {
        const cx = (p.x0 + p.x1) / 2, w = p.x1 - p.x0, hgt = p.base + 140 - p.y, fade = p.t > p.life - 0.4 ? (p.life - p.t) / 0.4 : 1;
        g.save(); g.globalAlpha = fade;
        g.fillStyle = MGH.grad(g, p.y, p.y + hgt, ['#b8a080', '#7a6248', '#4a3a2a']); g.fillRect(p.x0, p.y, w, hgt);
        g.fillStyle = '#c9b48a'; g.fillRect(p.x0 - 6, p.y - 4, w + 12, 16); g.fillStyle = 'rgba(0,0,0,0.25)'; for (let y = p.y + 30; y < p.y + hgt; y += 34) g.fillRect(p.x0, y, w, 3);
        g.strokeStyle = 'rgba(124,207,74,0.7)'; g.lineWidth = 3; g.beginPath(); g.moveTo(cx - 10, p.y + 24); g.lineTo(cx, p.y + 44); g.lineTo(cx + 10, p.y + 24); g.stroke();
        g.restore();
      }
      // areas (attack effects)
      for (const a of S.areas) this.drawArea(g, S, a, t);
      // fighters
      S.f.forEach(f => this.drawFighter(g, m, S, f, t));
      // projectiles
      for (const p of S.proj) this.drawProj(g, p, t, m);
      // particles
      for (const p of S.parts) {
        const k = 1 - p.t / p.life; g.globalAlpha = Math.max(0, Math.min(1, k * 1.6));
        if (p.kind === 'spark') { g.strokeStyle = p.col; g.lineWidth = p.size * k + 0.5; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - p.vx * 0.05, p.y - p.vy * 0.05); g.stroke(); }
        else if (p.kind === 'flash') { const gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * (1.5 - k * 0.5)); gr.addColorStop(0, 'rgba(255,246,214,0.6)'); gr.addColorStop(0.4, 'rgba(255,220,150,0.35)'); gr.addColorStop(1, 'rgba(255,240,170,0)'); g.fillStyle = gr; g.beginPath(); g.arc(p.x, p.y, p.size * 1.5, 0, 7); g.fill(); }
        else if (p.kind === 'smoke') { g.fillStyle = p.col; g.globalAlpha *= 0.6; g.beginPath(); g.arc(p.x, p.y, p.size * (1.6 - k * 0.6), 0, 7); g.fill(); }
        else if (p.kind === 'streak') { g.strokeStyle = p.col; g.lineWidth = 2; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - p.vx * 0.08, p.y); g.stroke(); }
        else { g.fillStyle = p.col; g.beginPath(); g.arc(p.x, p.y, Math.max(0.5, p.size * (0.4 + 0.6 * k)), 0, 7); g.fill(); }
      }
      g.globalAlpha = 1;
      for (const tx of S.texts) { const k = tx.t / 0.9; g.globalAlpha = 1 - k * k; this.outlined(g, tx.text, tx.x, tx.y - k * 40, tx.size * (k < 0.15 ? 1 + (0.15 - k) * 3 : 1), tx.col); }
      g.globalAlpha = 1;
      g.restore();
      // screen flash & gale tint
      if (S.flash > 0) MGH.softFlash(g, S.flash * 5, S.flashCol || '255,200,110');
      this.drawHud(g, m, S, t);
    },
    outlined(g, s, x, y, size, col) {
      g.font = `bold ${Math.round(size)}px Georgia`; g.textAlign = 'center'; g.lineJoin = 'round';
      g.lineWidth = Math.max(3, size * 0.18); g.strokeStyle = 'rgba(20,10,40,0.85)'; g.strokeText(s, x, y); g.fillStyle = col; g.fillText(s, x, y);
    },
    drawBack(g, S, t) {
      const cam = S.cam;
      const sky = g.createLinearGradient(0, 0, 0, 720); sky.addColorStop(0, '#2a1a5a'); sky.addColorStop(0.45, '#8a4a8a'); sky.addColorStop(0.75, '#ff9a5a'); sky.addColorStop(1, '#ffd08a');
      g.fillStyle = sky; g.fillRect(0, 0, 1280, 720);
      MGH.stars(g, t, 70, 300, 0.6);
      // a huge setting sun and drifting cloud bands
      const px = (k) => -(cam.x - 800) * k, py = (k) => -(cam.y - 470) * k;
      MGH.glow(g, 900 + px(0.04), 470 + py(0.04), 380, 'rgba(255,200,120,0.55)');
      g.fillStyle = '#ffe2a8'; g.beginPath(); g.arc(900 + px(0.04), 470 + py(0.04), 90, 0, 7); g.fill();
      for (let k = 0; k < 6; k++) MGH.cloud(g, ((k * 260 + t * (8 + k * 2)) % 1700) - 200 + px(0.08), 120 + k * 46 + py(0.08), 0.9 + (k % 3) * 0.3, 'rgba(255,220,230,0.35)');
      // far mountains, then floating isles with waterfalls
      g.save(); g.translate(px(0.12), py(0.12));
      MGH.ridge(g, 560, 80, 'rgba(80,40,90,0.75)', 3, 0, 0, 60);
      MGH.ridge(g, 610, 60, 'rgba(60,30,70,0.85)', 7, 0, 0, 50);
      g.restore();
      g.save(); g.translate(px(0.3), py(0.3));
      for (const [x, y, s] of [[120, 330, 1], [1130, 260, 0.8], [640, 170, 0.55]]) {
        g.fillStyle = 'rgba(70,50,90,0.9)'; g.beginPath(); g.moveTo(x - 110 * s, y); g.quadraticCurveTo(x, y - 34 * s, x + 110 * s, y); g.lineTo(x + 40 * s, y + 90 * s); g.lineTo(x, y + 150 * s); g.lineTo(x - 50 * s, y + 80 * s); g.closePath(); g.fill();
        g.fillStyle = 'rgba(90,150,90,0.9)'; g.beginPath(); g.ellipse(x, y, 110 * s, 16 * s, 0, Math.PI, 0); g.fill();
        g.fillStyle = 'rgba(200,230,255,0.35)'; g.fillRect(x + 30 * s, y, 8 * s, 200 * s);
        for (let k = 0; k < 3; k++) { g.fillStyle = 'rgba(40,80,50,0.9)'; g.beginPath(); g.arc(x - 60 * s + k * 50 * s, y - 18 * s, 18 * s, 0, 7); g.fill(); }
      }
      g.restore();
      // abyss glow far below
      const ab = g.createLinearGradient(0, 520, 0, 720); ab.addColorStop(0, 'rgba(255,140,80,0)'); ab.addColorStop(1, 'rgba(255,110,60,0.35)'); g.fillStyle = ab; g.fillRect(0, 520, 1280, 200);
      // gale tint
      if (S.wind) { g.fillStyle = `rgba(220,240,255,${Math.abs(S.wind) * 0.12})`; g.fillRect(0, 0, 1280, 720); }
      if (S.haz && S.haz.kind === 'lightning') { g.fillStyle = 'rgba(20,10,50,0.35)'; g.fillRect(0, 0, 1280, 720); }
    },
    drawStage(g, S, t) {
      const { x0, x1, y, th } = STAGE, w = x1 - x0;
      // the floating island's rocky underside
      g.fillStyle = MGH.grad(g, y, y + 420, ['#6a5a6a', '#3a2a40', '#1a1020']);
      g.beginPath(); g.moveTo(x0 - 10, y); g.lineTo(x1 + 10, y); g.lineTo(x1 - 40, y + th); g.quadraticCurveTo(x1 - 120, y + 260, x0 + w * 0.62, y + 420); g.lineTo(x0 + w * 0.5, y + 470); g.lineTo(x0 + w * 0.4, y + 400); g.quadraticCurveTo(x0 + 110, y + 260, x0 + 40, y + th); g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.06)'; for (let k = 0; k < 7; k++) g.fillRect(x0 + 60 + k * 130, y + 30 + (k % 3) * 40, 70, 6);
      // glowing clan runes along the cliff face
      ['#8fe0ff', '#4f8dff', '#ff6a3d', '#7ccf4a'].forEach((c, k) => { const rx = x0 + 160 + k * 230, ry = y + 70; MGH.glow(g, rx, ry, 46, c.replace(')', ',0.5)').replace('#', '#'), 0.6); g.save(); g.globalAlpha = 0.7 + 0.3 * Math.sin(t * 2 + k); g.strokeStyle = c; g.lineWidth = 4; g.beginPath(); g.arc(rx, ry, 18, 0, 7); g.stroke(); g.beginPath(); g.moveTo(rx, ry - 26); g.lineTo(rx, ry + 26); g.moveTo(rx - 22, ry); g.lineTo(rx + 22, ry); g.stroke(); g.restore(); });
      // hanging vines and crystals
      for (let k = 0; k < 9; k++) { const vx = x0 + 40 + k * 115; g.strokeStyle = '#3f7a2c'; g.lineWidth = 4; g.beginPath(); g.moveTo(vx, y + 10); g.quadraticCurveTo(vx + Math.sin(t + k) * 8, y + 50, vx + 4, y + 70 + (k % 3) * 24); g.stroke(); }
      // top surface: grass over carved stone
      g.fillStyle = MGH.grad(g, y - 6, y + 40, ['#c9b48a', '#9a8460', '#6a5a40']); g.fillRect(x0 - 10, y, w + 20, 40);
      g.fillStyle = '#5fbf4a'; g.beginPath(); g.moveTo(x0 - 14, y + 8); for (let x = x0 - 14; x <= x1 + 14; x += 18) g.lineTo(x, y - 6 + (x % 36 ? 0 : 3)); g.lineTo(x1 + 14, y + 8); g.closePath(); g.fill();
      g.fillStyle = '#8fe06a'; g.fillRect(x0 - 10, y - 4, w + 20, 4);
      // broken pillars and torches at both ends
      for (const [px, s] of [[x0 + 50, 1], [x1 - 50, -1]]) {
        g.fillStyle = MGH.grad(g, y - 170, y, ['#e8dcc4', '#b8a888']); g.fillRect(px - 22, y - 150, 44, 150);
        g.fillStyle = 'rgba(0,0,0,0.18)'; for (let k = 0; k < 4; k++) g.fillRect(px - 16 + k * 10, y - 150, 3, 150);
        g.fillStyle = '#d8ccb0'; g.beginPath(); g.moveTo(px - 30, y - 150); g.lineTo(px + 30, y - 150); g.lineTo(px + 22 * s, y - 175); g.lineTo(px - 18 * s, y - 165); g.closePath(); g.fill();
        g.fillStyle = '#5a4030'; g.fillRect(px - 9, y - 186, 18, 12); MGH.flame(g, px, y - 186, 0.9, t, px);
      }
      // floating platforms: stone slabs with crystals beneath
      for (const p of SOFT) {
        const pw = p.x1 - p.x0;
        MGH.glow(g, (p.x0 + p.x1) / 2, p.y + 30, pw * 0.5, 'rgba(160,220,255,0.25)');
        g.fillStyle = MGH.grad(g, p.y, p.y + 28, ['#d8ccb0', '#9a8a70']); MGH.rr(g, p.x0, p.y, pw, 20, 8); g.fill();
        g.fillStyle = '#6fcf55'; g.fillRect(p.x0 + 4, p.y - 3, pw - 8, 5);
        g.fillStyle = '#7a6a54'; g.beginPath(); g.moveTo(p.x0 + 20, p.y + 18); g.lineTo(p.x1 - 20, p.y + 18); g.lineTo((p.x0 + p.x1) / 2, p.y + 60); g.closePath(); g.fill();
        for (let k = 0; k < 3; k++) { const cx = p.x0 + pw * (0.3 + k * 0.2), cy = p.y + 30 + (k === 1 ? 14 : 0); g.fillStyle = 'rgba(170,235,255,0.85)'; g.beginPath(); g.moveTo(cx, cy + 18); g.lineTo(cx - 7, cy); g.lineTo(cx, cy - 10); g.lineTo(cx + 7, cy); g.closePath(); g.fill(); }
      }
      // respawn platforms
      for (const f of S.f) if (f.ground === 'respawn' && f.state !== 'dead') {
        const k = Math.min(1, f.respawnPlat / 0.6);
        g.globalAlpha = k; MGH.glow(g, f.x, f.y + 6, 60, `${PCOL[f.el]}`); g.fillStyle = 'rgba(255,255,255,0.8)'; g.beginPath(); g.ellipse(f.x, f.y + 4, 50, 10, 0, 0, 7); g.fill(); g.globalAlpha = 1;
      }
    },
    drawArea(g, S, a, t) {
      const k = a.t / a.life;
      g.save(); g.globalAlpha = 1 - k * 0.8;
      if (a.kind === 'geyser') { const gr = g.createLinearGradient(0, a.y - a.h / 2, 0, a.y + a.h / 2); gr.addColorStop(0, 'rgba(220,245,255,0.95)'); gr.addColorStop(1, 'rgba(60,150,255,0.8)'); g.fillStyle = gr; g.beginPath(); g.moveTo(a.x - a.w * 0.3, a.y - a.h / 2); g.quadraticCurveTo(a.x, a.y - a.h / 2 - 30, a.x + a.w * 0.3, a.y - a.h / 2); g.lineTo(a.x + a.w / 2, a.y + a.h / 2); g.lineTo(a.x - a.w / 2, a.y + a.h / 2); g.closePath(); g.fill(); }
      if (a.kind === 'blast' || a.kind === 'boom') { const r = (a.kind === 'boom' ? 90 : 70) * (0.6 + k); MGH.glow(g, a.x, a.y, r * 1.6, 'rgba(255,150,60,0.8)'); g.fillStyle = 'rgba(255,214,150,0.55)'; g.beginPath(); g.arc(a.x, a.y, r * 0.6, 0, 7); g.fill(); }
      if (a.kind === 'windring') { g.strokeStyle = 'rgba(240,250,255,0.9)'; g.lineWidth = 6; for (let s = 0; s < 3; s++) { g.beginPath(); g.ellipse(a.x, a.y + 10, 40 + k * 120 + s * 20, 14 + k * 20, 0, 0, 7); g.stroke(); } }
      if (a.kind === 'pillar') { for (let n = -2; n <= 2; n++) MGH.flame(g, a.x + n * 30, a.y + a.h / 2, a.h / 52 * (1 - Math.abs(n) * 0.18) * Math.min(1, 0.4 + k * 3), t * 1.5, n + a.x); }
      if (a.kind === 'pillarOld') { const gr = g.createLinearGradient(0, a.y + a.h / 2, 0, a.y - a.h / 2); gr.addColorStop(0, 'rgba(255,90,30,0.95)'); gr.addColorStop(0.5, 'rgba(255,170,60,0.9)'); gr.addColorStop(1, 'rgba(255,240,170,0)'); g.fillStyle = gr; for (let s = -2; s <= 2; s++) { g.beginPath(); g.moveTo(a.x + s * 36 - 26, a.y + a.h / 2); g.quadraticCurveTo(a.x + s * 30 + Math.sin(t * 20 + s) * 10, a.y - a.h / 2 - 20 * (1 - Math.abs(s) * 0.3), a.x + s * 36 + 26, a.y + a.h / 2); g.fill(); } }
      if (a.kind === 'quake' || a.kind === 'quakeC') { for (let s = 0; s < 3; s++) MGH.rock(g, a.x + (s - 1) * 22, a.y + 10 - Math.sin(k * Math.PI) * 30 - s * 6, 12 - s * 2, s + a.x, '#8a7a66', s); }
      if (a.kind === 'shard') { g.fillStyle = 'rgba(200,245,255,0.8)'; g.beginPath(); g.arc(a.x, a.y + 20, 30 * (0.5 + k), 0, 7); g.fill(); }
      if (a.kind === 'kofx') {
        // a soft streak in the faller's colour (no bright white burst)
        g.globalAlpha = (1 - k) * 0.45; g.translate(a.x, a.y); g.rotate(a.ang);
        const gr = g.createLinearGradient(0, 0, 700, 0); gr.addColorStop(0, a.col); gr.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = gr; g.beginPath(); g.moveTo(0, 0); g.lineTo(700, -110 * (1 - k * 0.5)); g.lineTo(700, 110 * (1 - k * 0.5)); g.closePath(); g.fill();
        g.fillStyle = a.col; g.beginPath(); g.arc(0, 0, 50 * (1 - k), 0, 7); g.fill();
      }
      g.restore();
    },
    drawProj(g, p, t, m) {
      if (p.kind === 'sig') { this.drawSig(g, p, t); return; }
      if (p.kind === 'cyclone' && p.sand) {
        g.save(); g.translate(p.x, p.y);
        for (let s = 0; s < 5; s++) { g.strokeStyle = `rgba(232,208,154,${0.9 - s * 0.14})`; g.lineWidth = 6 - s * 0.6; g.beginPath(); g.ellipse(Math.sin(t * 14 + s) * 6, -p.r + s * p.r * 0.45, p.r * (0.35 + s * 0.15), p.r * 0.14, 0, t * 12 + s, t * 12 + s + 4.5); g.stroke(); }
        g.restore(); return;
      }
      if (p.kind === 'cyclone') {
        g.save(); g.translate(p.x, p.y);
        for (let s = 0; s < 5; s++) { g.strokeStyle = `rgba(240,250,255,${0.9 - s * 0.14})`; g.lineWidth = 5 - s * 0.6; g.beginPath(); g.ellipse(Math.sin(t * 14 + s) * 6, -p.r + s * p.r * 0.45, p.r * (0.35 + s * 0.15), p.r * 0.14, 0, t * 12 + s, t * 12 + s + 4.5); g.stroke(); }
        g.restore(); return;
      }
      if (p.kind === 'wave') {
        g.save(); const gr = g.createLinearGradient(0, p.y - 70, 0, p.y); gr.addColorStop(0, 'rgba(230,248,255,0.95)'); gr.addColorStop(1, 'rgba(40,130,240,0.9)'); g.fillStyle = gr;
        const d = Math.sign(p.vx), w = p.r * 1.6;
        g.beginPath(); g.moveTo(p.x - d * w, p.y); g.quadraticCurveTo(p.x - d * w * 0.3, p.y - 66, p.x + d * w * 0.5, p.y - 50); g.quadraticCurveTo(p.x + d * w * 0.2, p.y - 36, p.x + d * w * 0.4, p.y - 22); g.lineTo(p.x + d * w * 0.6, p.y); g.closePath(); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.9)'; g.beginPath(); g.arc(p.x + d * w * 0.45, p.y - 50, 6, 0, 7); g.fill(); g.restore(); return;
      }
      if (p.kind === 'orb') { MGH.glow(g, p.x, p.y, p.r * 2.4, 'rgba(90,180,255,0.6)'); const gr = g.createRadialGradient(p.x - p.r * 0.3, p.y - p.r * 0.3, 1, p.x, p.y, p.r); gr.addColorStop(0, '#f0fbff'); gr.addColorStop(1, '#3f8fe8'); g.fillStyle = gr; g.beginPath(); g.arc(p.x, p.y, p.r, 0, 7); g.fill(); return; }
      if (p.kind === 'fire') { MGH.glow(g, p.x, p.y, p.r * 3, 'rgba(255,130,50,0.6)'); MGH.fireball(g, p.x, p.y, p.r, t, p.vx, 0); return; }
      if (p.kind === 'boulder') { MGH.shadow(g, p.x, p.y + p.r + 8, p.r * 0.8, 0.2); MGH.rock(g, p.x, p.y, p.r, 7, '#9a8466', p.rot); }
    },
    // poses for the floating hands and feet (head radii around the body; see Char.handPose)
    pose(f, t) {
      const mv = f.mv, k = f.mvKind;
      const air = !f.ground;
      const airFeet = [{ x: -0.18, lift: 0.18, tip: 0.5 }, { x: 0.24, lift: 0.32, tip: 0.7 }];
      if (f.state === 'hit') return { hands: { n: S_(-1.3, -0.95, -120, 1, 1), f: S_(1.1, -1.05, -60, 1, 1) }, feet: [{ x: -0.3, lift: 0.1, tip: 0.6 }, { x: 0.3, lift: 0.25, tip: -0.4 }], mood: 'hurt' };
      if (f.state === 'brace') return { hands: { n: S_(-0.82, -0.38, -112, 1, 1), f: S_(-0.66, -0.3, -104, 1, 1) }, mood: 'effort' };
      if (f.state === 'atk' && mv) {
        const ph = f.mvT < mv.st ? 'st' : f.mvT < mv.st + mv.act ? 'act' : 'end';
        if (k === 'jab') return ph === 'st' ? { hands: { n: S_(0.2, -0.2, 175), f: S_(-0.9, -0.15, 180) }, mood: 'effort' } : ph === 'act' ? { hands: { n: S_(-1.75, -0.28, 180), f: S_(0.7, 0.0, 160) }, mood: 'angry' } : { hands: { n: S_(-1.25, -0.2, 176), f: S_(0.72, 0.05, 160) }, mood: 'determined' };
        if (k === 'proj') return { hands: { n: S_(-1.55, -0.42, 180, 1, 1), f: S_(0.65, -0.1, 165) }, mood: 'determined' };
        if (k === 'up') return { hands: { n: S_(-0.85, -1.55, -95), f: S_(0.75, -1.72, -82) }, feet: airFeet, mood: 'cheer' };
        if (k === 'down') { if (mv.shield) return { hands: { n: S_(-0.8, -0.6, -110, 1, 1), f: S_(0.7, -0.62, -70, 1, 1) }, mood: 'smug' }; return { hands: { n: S_(-0.75, 0.55, 90), f: S_(0.68, 0.55, 90) }, feet: air ? airFeet : null, mood: 'angry' }; }
      }
      if (f.bHeld && f.charge > 0.2) return { hands: { n: S_(0.55, -0.35, 160), f: S_(-0.9, -0.12, 180) }, mood: 'effort', glow: true };
      if (air) return { hands: { n: S_(-1.12, -0.5, -140, 1, 1), f: S_(0.98, -0.42, -40, 1, 1) }, feet: airFeet, mood: f.vy < 0 ? 'cheer' : 'determined' };
      return null;
    },
    drawFighter(g, m, S, f, t) {
      if (f.lives <= 0 || f.state === 'dead') return;
      const p = m.players[f.i];
      // ground shadow on whatever is below
      const gy = this.groundBelow(S, f.x, f.y - 2);
      if (gy < 1300) { const d = gy - f.y; MGH.shadow(g, f.x, gy + 2, 26 * Math.max(0.35, 1 - d / 500), 0.32 * Math.max(0.2, 1 - d / 600)); }
      const P = this.pose(f, t) || {};
      const run = f.ground && Math.abs(f.vx) > 40 && f.state === 'idle';
      let mood = P.mood || (f.moodT > 0 && f.mood ? f.mood : (f.pct > 120 ? 'nervous' : 'determined'));
      g.save();
      g.translate(f.x, f.y - R0 * 1.25);
      if (f.spin) g.rotate(t * 16 * Math.sign(f.vx || 1));
      else if (f.spinJ > 0) { f.spinJ -= m.dt; g.rotate((0.35 - f.spinJ) / 0.35 * Math.PI * 2 * f.face); }
      // smooth motion: an eased squash on landing, a lean into the run, a stretch through jumps and falls
      // landing: a small dip (no squashing — heads keep their shape)
      if (f.landT > 0) { f.landT -= m.dt; const q = Math.sin(Math.max(0, f.landT) / 0.12 * Math.PI / 2) * 0.12; g.translate(0, R0 * q * 0.6); }
      if (!f.spin && f.state !== 'hit') { f.lean = (f.lean || 0) + (clamp(f.vx / 6000, -0.08, 0.08) - (f.lean || 0)) * Math.min(1, m.dt * 6); g.rotate(f.lean); }
      if (f.state === 'brace') g.translate(0, R0 * 0.18);
      const blink = f.inv > 0 && Math.floor(t * 16) % 2 === 0;
      if (P.glow || f.charge > 0.2) MGH.glow(g, -f.face * 10, -6, 40 + Math.min(1, f.charge) * 30, PCOL[f.el], 0.8);
      if (f.shield > 0) { g.save(); const gr = g.createRadialGradient(-6, -14, 4, 0, 0, 60); gr.addColorStop(0, 'rgba(255,255,255,0.15)'); gr.addColorStop(0.8, 'rgba(120,200,255,0.35)'); gr.addColorStop(1, 'rgba(200,240,255,0.85)'); g.fillStyle = gr; g.beginPath(); g.arc(0, 4, 58, 0, 7); g.fill(); g.restore(); }
      Char.draw(g, 0, 0, R0, p.el.id, p.color, { mood: MGH.persona(mood, p.el.id), seed: f.i * 1.7, look: { x: f.face * 0.8, y: 0 }, walk: run ? 1 : 0, alpha: blink ? 0.4 : 1, hands: P.hands, feet: P.feet, noShadow: true, noIdle: true, t });
      if (f.hurtFlash > 0) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = f.hurtFlash * 2; g.fillStyle = '#ff6040'; g.beginPath(); g.arc(0, 0, R0 * 1.1, 0, 7); g.fill(); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; }
      if (f.buffT > 0) { const B = ITEMS.find(q => q.k === f.buff); if (B) { MGH.glow(g, 0, 0, R0 * 1.8, B.col + '55'); MGH.emoji(g, B.icon, 0, -R0 * 2.3 + Math.sin(t * 5) * 3, 18); } }
      if (f.frozen > 0) { g.save(); g.globalAlpha = Math.min(0.75, f.frozen * 1.5); g.fillStyle = 'rgba(190,235,255,0.8)'; g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2, rr = R0 * (k % 2 ? 1.05 : 1.3); g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr - 6); } g.closePath(); g.fill(); g.stroke(); g.restore(); }
      if (f.state === 'brace') { g.strokeStyle = 'rgba(255,240,200,0.8)'; g.lineWidth = 4; g.beginPath(); g.arc(0, 4, 50, Math.PI * 0.9, Math.PI * 2.1); g.stroke(); }
      g.restore();
      // name tag arrow over each fighter
      g.fillStyle = p.color; g.beginPath(); g.moveTo(f.x - 8, f.y - 102); g.lineTo(f.x + 8, f.y - 102); g.lineTo(f.x, f.y - 92); g.closePath(); g.fill();
      this.outlined(g, `P${f.i + 1}`, f.x, f.y - 108, 16, p.color);
    },
    drawHud(g, m, S, t) {
      // off-screen bubbles for fighters out of view
      S.f.forEach(f => {
        if (f.lives <= 0 || f.state === 'dead') return;
        const sx = (f.x - S.cam.x) * S.cam.z + 640, sy = (f.y - 40 - S.cam.y) * S.cam.z + 345;
        if (sx > 20 && sx < 1260 && sy > 50 && sy < 620) return;
        const bx = clamp(sx, 50, 1230), by = clamp(sy, 90, 570), p = m.players[f.i];
        g.fillStyle = 'rgba(0,0,0,0.5)'; g.beginPath(); g.arc(bx, by, 32, 0, 7); g.fill(); g.strokeStyle = p.color; g.lineWidth = 3; g.stroke();
        Char.draw(g, bx, by + 4, 20, p.el.id, p.color, { headOnly: true, noArms: true, noFeet: true, mood: 'scared', seed: f.i, noShadow: true });
        const a = Math.atan2(sy - by, sx - bx); g.fillStyle = p.color; g.beginPath(); g.moveTo(bx + Math.cos(a) * 44, by + Math.sin(a) * 44); g.lineTo(bx + Math.cos(a + 0.4) * 32, by + Math.sin(a + 0.4) * 32); g.lineTo(bx + Math.cos(a - 0.4) * 32, by + Math.sin(a - 0.4) * 32); g.closePath(); g.fill();
      });
      // bottom panels: portrait, damage %, lives
      const vis = S.f.filter(o => !o.watch);
      S.f.forEach((f, i) => {
        if (f.watch) return;
        const p = m.players[i], x = vis.length === 2 ? 320 + vis.indexOf(f) * 640 : 160 + i * 320, y = 668;
        const out = f.lives <= 0;
        g.save(); g.globalAlpha = out ? 0.5 : 1;
        g.fillStyle = 'rgba(12,8,30,0.72)'; MGH.rr(g, x - 140, y - 38, 280, 76, 18); g.fill();
        g.strokeStyle = p.color; g.lineWidth = 3; g.stroke();
        Char.draw(g, x - 104, y + 2, 26, p.el.id, p.color, { headOnly: true, noArms: true, noFeet: true, mood: out ? 'out' : f.state === 'hit' ? 'hurt' : f.pct > 120 ? 'nervous' : 'determined', seed: i, noShadow: true, look: { x: 0.6, y: 0 } });
        MGH.text(g, p.name, x - 66, y - 14, 15, p.color, 'left', 'bold');
        // damage %: white -> yellow -> red, shaking when freshly hit
        const pc = Math.round(f.pct), heat = clamp(f.pct / 160, 0, 1);
        const col = heat < 0.5 ? `rgb(255,${255},${Math.round(255 - heat * 2 * 200)})` : `rgb(255,${Math.round(255 - (heat - 0.5) * 2 * 210)},${Math.round(55 - (heat - 0.5) * 2 * 40)})`;
        const jig = f.hurtFlash > 0 ? R.range(-4, 4) : 0;
        if (A.stamina && !out) { const hp = Math.max(0, Math.ceil(A.stamina - f.pct)), q = hp / A.stamina; g.fillStyle = 'rgba(255,255,255,0.15)'; MGH.rr(g, x - 66, y + 8, 150, 14, 7); g.fill(); g.fillStyle = q > 0.5 ? '#7cf06a' : q > 0.25 ? '#ffd34d' : '#ff6b6b'; MGH.rr(g, x - 66, y + 8, 150 * q, 14, 7); g.fill(); this.outlined(g, `${hp}`, x + 110 + jig, y + 26 + jig, 26, '#fff'); }
        else this.outlined(g, out ? 'OUT' : `${pc}%`, x + 20 + jig, y + 26 + jig, 38, out ? '#999' : col);
        // lives
        for (let k = 0; k < (A.lives || 6); k++) { const lx = x - 60 + k * 15, ly = y - 2; g.fillStyle = k < f.lives ? p.color : 'rgba(255,255,255,0.15)'; g.beginPath(); g.arc(lx, ly, 5.5, 0, 7); g.fill(); if (k < f.lives) { g.fillStyle = 'rgba(255,255,255,0.6)'; g.beginPath(); g.arc(lx - 1.5, ly - 1.5, 1.8, 0, 7); g.fill(); } }
        // power name + cooldown ring
        MGH.text(g, SIGN[f.hero] || NAMES[f.el][f.bHeld && f.charge > 0.2 ? 1 : 0], x + 120, y - 14, 11, '#cfc6ee', 'right');
        if (f.cdProj > 0) { g.strokeStyle = PCOL[f.el]; g.lineWidth = 3; g.beginPath(); g.arc(x + 112, y + 12, 8, -Math.PI / 2, -Math.PI / 2 + (1 - f.cdProj / 0.55) * Math.PI * 2); g.stroke(); }
        if (f.kos) MGH.text(g, `KO×${f.kos}`, x + 120, y + 30, 12, '#ffe680', 'right', 'bold');
        g.restore();
      });
      // banner
      if (S.banner) {
        const b = S.banner, k = b.t, pop = k < 0.15 ? 1.4 - k / 0.15 * 0.4 : 1, a = k > 2 ? 1 - (k - 2) / 0.4 : 1;
        g.save(); g.globalAlpha = Math.max(0, a); g.translate(640, 110); g.scale(pop, pop);
        g.fillStyle = 'rgba(10,6,30,0.7)'; MGH.rr(g, -300, -34, 600, 54, 16); g.fill();
        this.outlined(g, b.text, 0, 6, 30, '#ffe680'); g.restore();
      }
      if (S.endT >= 0) { const k = S.endT; g.save(); g.globalAlpha = Math.min(1, k * 3); g.translate(640, 330); const sc = k < 0.25 ? 2.2 - k / 0.25 * 1.2 : 1; g.scale(sc, sc); this.outlined(g, 'GAME!', 0, 0, 110, '#ffe680'); g.restore(); }
      // the clock gets dramatic at the end
      if (m.game.dur) { const left = m.game.dur - m.t; if (left < 30 && left > 0) this.outlined(g, `${Math.ceil(left)}`, 640, 168, 40 + (left < 10 ? 10 * (1 - (left % 1)) : 0), left < 10 ? '#ff6b6b' : '#ffe680'); }
    },
  };
  if (A.over) Object.assign(game, A.over);
  MG.def(game);
  }
  defArena(CLASH);
  window.BrawlArena = defArena; // the other arenas live in games12.js
})();
