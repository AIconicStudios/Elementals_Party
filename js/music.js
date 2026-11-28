'use strict';
// The Fourfold original soundtrack, synthesised live with WebAudio (no audio files).
//
// A small production engine: arranged songs (intro / verse / hook / bridge) on a 16th grid,
// a mix bus with plate reverb, tempo-synced delay, kick-driven sidechain pump, glue compression,
// soft clipping and a limiter. Instruments: layered kick, saturated sliding 808, snare, clap,
// metallic hats, rim, shaker, congas, crash, risers, FM e-piano with auto-pan, wide pads,
// whistle lead, supersaw, plucks, FM bells, steel pan, marimba, brass and formant vocal chops.
//
// Songs: 'title' (menu anthem), 'board' (laid-back bounce), 'mini' / 'mini2' (hype minigame themes).
const Music = (() => {
  // ---------- notation helpers
  const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const nm = s => { const m = /^([A-G])([#b]?)(-?\d)$/.exec(s); if (!m) return null; return 12 * (+m[3] + 1) + NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0); };
  // melody: 16 tokens per bar, bars split by '|'. 'C5' note, '-' hold, '.' rest, 'C5~' glide into the next note
  const mel = str => str.split('|').map(b => { const out = {}; let last = -1; b.trim().split(/\s+/).forEach((x, i) => { if (x === '-') { if (last >= 0) out[last][1]++; } else if (x === '.') last = -1; else { const gl = x.endsWith('~'); out[i] = [nm(gl ? x.slice(0, -1) : x), 1, gl]; last = i; } }); return out; });
  // drum lanes: 'x' hit, 'o' soft hit, 'r' 32nd pair, 't' triplet, 'R' 64th roll, '.' rest
  const drum = str => str.split('|').map(b => b.trim());
  const words = str => str.split('|').map(b => b.trim().split(/\s+/));
  const QUAL = { '': [0, 4, 7], m: [0, 3, 7], m7: [0, 3, 7, 10], m9: [0, 3, 7, 10, 14], maj7: [0, 4, 7, 11], maj9: [0, 4, 7, 11, 14], 7: [0, 4, 7, 10], 9: [0, 4, 7, 10, 14], sus: [0, 5, 7], sus2: [0, 2, 7], add9: [0, 4, 7, 14], madd9: [0, 3, 7, 14], 6: [0, 4, 7, 9], m6: [0, 3, 7, 9], '7sus': [0, 5, 7, 10] };
  const chordCache = {};
  const chord = name => {
    if (chordCache[name]) return chordCache[name];
    const m = /^([A-G][#b]?)(.*)$/.exec(name), root = nm(m[1] + '3');
    const notes = [...new Set(QUAL[m[2]].map(i => { let n = root + i; while (n < 53) n += 12; while (n > 74) n -= 12; return n; }))].sort((a, b) => a - b);
    return (chordCache[name] = { root, notes });
  };
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);

  // ---------- the songs
  const HOOK = mel(
    'G5 - . G5 Bb5 - G5 . F5 - Eb5 . F5 - - .|Eb5 - . Eb5 G5 - Eb5 . C5 - - - . . Bb4 C5|' +
    'Ab5 - . Ab5 G5 - F5 . Eb5 - F5 . G5 - - .|G5 - - - F5 - D5 . B4 - - - D5 - F5 -|' +
    'G5 - . G5 Bb5 - G5 . F5 - Eb5 . F5 - - .|Eb5 - . Eb5 G5 - Eb5 . C5 - - - . . Bb4 C5|' +
    'Ab5 - . Ab5 G5 - F5 . Eb5 - D5 . Eb5 - F5 .|G5 - - - - - . . F5 - Eb5 . D5 - B4 .');
  const C4 = ['Cm9', 'Abmaj7', 'Fm9', 'G7'], C8 = C4.concat(C4);
  const BOARD_BASS = mel('C2 - - - - - . C2 - - G1 - - - Bb1~ -|Ab1 - - - - - . Ab1 - - Eb2 - - - C2 -|F1 - - - - - . F1 - - C2 - - - Ab1 -|G1 - - - - - . G1 - - D2 - G1 - B1~ -');
  const BELL_V = mel('C6 . . G5 . . Eb5 . . . . . . . . .|. . . . . . . . Ab5 . G5 . Eb5 . C5 .|C6 . . Ab5 . . F5 . . . . . . . . .|. . . . . . . . B5 . G5 . D5 . F5 .');

  const songs = {
    // ---- menu anthem: the Fourfold hook, big and proud (C minor, 84 bpm)
    title: {
      bpm: 84, swing: 0.1, pump: 0.3, chopNote: 'G4',
      mix: { kick: 1, snare: 0.55, clap: 0.42, hat: 0.11, ohat: 0.09, perc: 0.12, bass: 0.6, keys: 0.07, pad: 0.032, choir: 0.05, brass: 0.05, bell: 0.07, whistle: 0.12, pluck: 0.05, chop: 0.12, crash: 0.18, riser: 0.07, impact: 0.5 },
      p: {
        K: drum('x.........x.....|x......x..x.....|x.........x.....|x......x..x.x...'),
        S: drum('....x.......x...|....x.......x...|....x.......x...|....x.......x.xx'),
        H: drum('x.x.x.x.x.x.x.x.|x.x.x.x.x.x.x.xr|x.x.x.x.x.x.x.x.|x.x.x.x.x.x.RRRR'),
        O: drum('..............x.|................'),
        B: BOARD_BASS, BB: mel('C2 - - - - - - - - - - - - - - -|Ab1 - - - - - - - - - - - - - - -|F1 - - - - - - - - - - - - - - -|G1 - - - - - - - - - - - - - - -'),
        HK: HOOK, V: BELL_V,
        KY: drum('x.......x.......'),
        CH: words('. . . . . . . . . . . . . . . .|. . . . . . . . . . . . . . . .|. . . . . . . . . . . . . . . .|. . . . . . . . . . . . ho . hey .'),
      },
      arr: [
        { n: 4, ch: C4, pad: 1, choir: 1, bell: 'HK', bellI: 'bell', filt: [500, 7000], riser: 1 },
        { n: 8, ch: C8, kick: 'K', snare: 'S', clap: 'S', hat: 'H', ohat: 'O', bass: 'B', pad: 1, choir: 1, lead: 'HK', leadI: 'brass', leadOct: -12, lead2: 'HK', lead2I: 'bell', crash: 1, impact: 1, fill: 1 },
        { n: 4, ch: C4, keys: 'KY', choir: 1, bass: 'BB', bell: 'V', bellI: 'bell', hat: 'O', riser: 1 },
        { n: 8, ch: C8, kick: 'K', snare: 'S', clap: 'S', hat: 'H', ohat: 'O', bass: 'B', pad: 1, keys: 'KY', lead: 'HK', leadI: 'whistle', lead2: 'HK', lead2I: 'brass', lead2Oct: -12, chop: 'CH', crash: 1, impact: 1, fill: 1 },
      ],
      loop: 1,
    },

    // ---- board theme "Fourfold Bounce": laid-back hip-hop with a whistle hook (C minor, 94 bpm)
    board: {
      bpm: 94, swing: 0.16, pump: 0.32, chopNote: 'G4',
      mix: { kick: 0.95, snare: 0.55, clap: 0.36, hat: 0.12, ohat: 0.09, perc: 0.15, shaker: 0.05, bass: 0.58, keys: 0.075, pad: 0.026, whistle: 0.14, bell: 0.065, pluck: 0.05, chop: 0.12, crash: 0.15, riser: 0.07, impact: 0.45 },
      p: {
        K: drum('x......x..x...o.|x......x..x.....|x......x..x...o.|x......x..x.x.x.'),
        S: drum('....x.......x...|....x.......x..o|....x.......x...|....x..o....x...'),
        H: drum('x.x.x.xox.x.x.xo|x.x.x.x.x.xox.x.|x.x.x.xox.x.x.xo|x.x.x.x.xrx.RRRR'),
        Hs: drum('..o...o...o...o.'),
        O: drum('..............x.|................'),
        P: drum('...x......x.....|.......x.....x..'),
        SH: drum('oxoxoxoxoxoxoxox'),
        KY: drum('x.....x...x.....|x.....x...x.....|x.....x...x.....|x.....x..x..x...'),
        B: BOARD_BASS,
        BB: mel('Ab1 - - - - - - - - - - - - - - -|Bb1 - - - - - - - - - - - - - - -|G1 - - - - - - - - - - - - - - -|G1 - - - - - - - . . . . . . . .'),
        V: BELL_V,
        V2: mel('Eb6 . . C6 . . G5 . . . . . . . . .|. . . . . . . . C6 . Bb5 . G5 . Eb5 .|F6 . . C6 . . Ab5 . . . . . . . . .|. . . . . . . . D6 . B5 . G5 . F5 .'),
        HK: HOOK,
        A: drum('x.x.x.x.x.x.x.x.'),
        KB: drum('x...............'), SB: drum('........x.......'),
        CH: words('. . . . . . . . . . . . . . . .|. . . . . . . . . . . . . . hey .|. . . . . . . . . . . . . . . .|. . . . . . . . . . . . oh . hey .'),
      },
      arr: [
        { n: 4, ch: C4, keys: 'KY', bell: 'V', hat: 'Hs', filt: [450, 5000], riser: 1, fill: 1 },
        { n: 8, ch: C4, kick: 'K', snare: 'S', hat: 'H', perc: 'P', bass: 'B', keys: 'KY', bell: 'V', crash: 1 },
        { n: 8, ch: C8, kick: 'K', snare: 'S', clap: 'S', hat: 'H', ohat: 'O', bass: 'B', keys: 'KY', pad: 1, lead: 'HK', leadI: 'whistle', chop: 'CH', crash: 1, fill: 1 },
        { n: 8, ch: C4, kick: 'K', snare: 'S', hat: 'H', shaker: 'SH', bass: 'B', keys: 'KY', arp: 'A', arpI: 'pluck', bell: 'V2', crash: 1 },
        { n: 4, ch: ['Abmaj7', 'Bb6', 'Gm7', 'G7'], kick: 'KB', snare: 'SB', bass: 'BB', keys: 'KY', pad: 1, arp: 'A', arpI: 'pluck', filt: [900, 9000], riser: 1, fill: 1 },
        { n: 8, ch: C8, kick: 'K', snare: 'S', clap: 'S', hat: 'H', ohat: 'O', perc: 'P', bass: 'B', keys: 'KY', pad: 1, lead: 'HK', leadI: 'whistle', lead2: 'HK', lead2I: 'pluck', lead2Oct: -12, chop: 'CH', crash: 1, impact: 1, fill: 1 },
      ],
      loop: 1,
    },

    // ---- minigame theme "Game On!": hype trap with a bouncing supersaw hook (E minor, 140 bpm)
    mini: {
      bpm: 140, swing: 0, pump: 0.28, chopNote: 'B4',
      mix: { kick: 1, snare: 0.5, clap: 0.42, hat: 0.11, ohat: 0.08, bass: 0.62, saw: 0.03, pluck: 0.055, brass: 0.045, pad: 0.024, bell: 0.06, chop: 0.13, crash: 0.16, riser: 0.08, impact: 0.5 },
      p: {
        K: drum('x.........x.....|x.........x..x..|x.........x.....|x.........x.x.x.'),
        S: drum('........x.......|........x.......|........x.......|........x.....xx'),
        H: drum('x.x.x.x.x.x.x.x.|x.x.x.x.x.x.xrxr|x.x.x.x.x.x.x.x.|x.x.x.xtx.x.RRRR'),
        O: drum('......x.......x.'),
        B: mel('E1 - - - - - - - . . E1 - - - - -|C2 - - - - - - - . . C2 - - - G1~ -|G1 - - - - - - - . . G1 - - - - -|D2 - - - - - - - . . D2 - D2 - E2~ -'),
        HK: mel(
          'B5 . B5 . G5 . B5 . E6 - D6 . B5 . G5 .|A5 . A5 . E5 . A5 . C6 - B5 . A5 . E5 .|G5 . G5 . D5 . G5 . B5 - A5 . G5 . D5 .|F#5 . F#5 . A5 . D6 . F#6 - E6 . D6 . A5 .|' +
          'B5 . B5 . G5 . B5 . E6 - D6 . B5 . G5 .|A5 . A5 . E5 . A5 . C6 - B5 . A5 . E5 .|G5 . G5 . D5 . G5 . B5 - A5 . G5 . D5 .|F#5 - A5 - D6 - E6 - F#6 - - - - - - -'),
        VS: mel('E5 . G5 . B5 . . . A5 . G5 . E5 . . .|C5 . E5 . G5 . . . F#5 . E5 . C5 . . .|D5 . G5 . B5 . . . A5 . G5 . D5 . . .|D5 . F#5 . A5 . . . C6 . B5 . A5 . F#5 .'),
        A: drum('xxxxxxxxxxxxxxxx'),
        ST: drum('x..x............'),
        SB: drum('x...x...x...x...|x.x.x.x.xxxxRRRR'),
        CH: words('. . . . . . . . . . . . . . . .|. . . . . . . . . . . . . . . .|. . . . . . . . . . . . . . . .|. . . . . . . . . . . . hey . hey .'),
      },
      arr: [
        { n: 2, ch: ['Em', 'D'], arp: 'A', arpI: 'pluck', filt: [300, 6000], riser: 1 },
        { n: 8, ch: ['Em', 'C', 'G', 'D', 'Em', 'C', 'G', 'D'], kick: 'K', snare: 'S', clap: 'S', hat: 'H', ohat: 'O', bass: 'B', lead: 'HK', leadI: 'saw', stab: 'ST', pad: 1, chop: 'CH', crash: 1, impact: 1 },
        { n: 8, ch: ['Em', 'Cmaj7', 'G', 'D'], kick: 'K', snare: 'S', hat: 'H', bass: 'B', arp: 'A', arpI: 'pluck', bell: 'VS', bellI: 'bell', crash: 1 },
        { n: 2, ch: ['C', 'D'], snare: 'SB', build: 1, arp: 'A', arpI: 'pluck', pad: 1, filt: [600, 12000], riser: 1 },
      ],
      loop: 1,
    },

    // ---- second minigame theme "Party Bounce": island party groove with a steel-pan hook (A minor, 104 bpm)
    mini2: {
      bpm: 104, swing: 0.1, pump: 0.3, chopNote: 'A4',
      mix: { kick: 0.95, snare: 0.32, clap: 0.38, hat: 0.1, shaker: 0.06, conga: 0.2, bass: 0.6, keys: 0.07, pan: 0.11, marimba: 0.08, whistle: 0.12, chop: 0.13, crash: 0.15, riser: 0.07, impact: 0.45 },
      p: {
        K: drum('x...x...x...x...'),
        S: drum('...x..x....x..x.|...x..x....x..xo'),
        CL: drum('....x.......x...'),
        H: drum('..x...x...x...x.'),
        SH: drum('oxooxoxooxoxoxoo'),
        CG: drum('..o.x..o..o.x.o.|..o.x..o..o.x.xx'),
        B: mel('A1 - - A1 - - A1 - A1 - - A1 - - A1 -|F1 - - F1 - - F1 - F1 - - F1 - - F1 -|C2 - - C2 - - C2 - C2 - - C2 - - C2 -|G1 - - G1 - - G1 - G1 - - B1 - - D2 -'),
        BB: mel('F1 - - - - - - - F1 - - - - - - -|G1 - - - - - - - G1 - - - - - - -|A1 - - - - - - - A1 - - - - - - -|A1 - - - - - - - E1 - - - G1 - - -'),
        PK: mel(
          'A5 . . A5 . . C6 . B5 . A5 . G5 . E5 .|F5 . . F5 . . A5 . G5 . F5 . E5 . C5 .|E5 . . E5 . . G5 . A5 . G5 . E5 . C5 .|D5 . . D5 . . G5 . B5 . D6 . B5 . G5 .|' +
          'A5 . . A5 . . C6 . B5 . A5 . G5 . E5 .|F5 . . F5 . . A5 . G5 . F5 . E5 . C5 .|E5 . . E5 . . G5 . A5 . G5 . E5 . C5 .|B4 . . D5 . . G5 . B5 - - - D6 - - -'),
        VS: mel('. . . . E5 - - - D5 - C5 - A4 - - -|. . . . F5 - - - E5 - C5 - A4 - - -|. . . . G5 - - - E5 - D5 - C5 - - -|. . . . D5 - E5 - G5 - - - - - - -'),
        MR: drum('x.x.x.x.x.x.x.x.'),
        KY: drum('..x...x...x...x.'),
        CH: words('. . . . . . . . . . . . hey . hey .|. . . . . . . . . . . . . . . .|. . . . . . . . oh . . . oh . . .|. . . . . . . . . . . . hey . hey .'),
        CH2: words('hey . . . . . . . . . . . . . . .|ho . . . . . . . . . . . . . . .|hey . . . . . . . . . . . . . . .|ho . . . hey . . . ho . . . hey . hey .'),
      },
      arr: [
        { n: 2, ch: ['Am', 'F'], lead: 'PK', leadI: 'pan', conga: 'CG', shaker: 'SH', filt: [500, 6000], riser: 1 },
        { n: 8, ch: ['Am', 'F', 'C', 'G', 'Am', 'F', 'C', 'G'], kick: 'K', snare: 'S', clap: 'CL', hat: 'H', shaker: 'SH', conga: 'CG', bass: 'B', lead: 'PK', leadI: 'pan', keys: 'KY', chop: 'CH', crash: 1, impact: 1 },
        { n: 8, ch: ['Am', 'F', 'C', 'G'], kick: 'K', snare: 'S', hat: 'H', shaker: 'SH', conga: 'CG', bass: 'B', arp: 'MR', arpI: 'marimba', keys: 'KY', bell: 'VS', bellI: 'whistle', crash: 1 },
        { n: 4, ch: ['F', 'G', 'Am', 'Am'], conga: 'CG', shaker: 'SH', bass: 'BB', keys: 'KY', chop: 'CH2', riser: 1, fill: 1 },
        { n: 8, ch: ['Am', 'F', 'C', 'G', 'Am', 'F', 'C', 'G'], kick: 'K', snare: 'S', clap: 'CL', hat: 'H', shaker: 'SH', conga: 'CG', bass: 'B', lead: 'PK', leadI: 'pan', lead2: 'PK', lead2I: 'whistle', lead2Oct: -12, keys: 'KY', chop: 'CH', crash: 1, impact: 1 },
      ],
      loop: 2,
    },
  };

  const VOWEL = { a: [800, 1150, 2800], e: [550, 1770, 2490], i: [300, 2300, 3000], o: [450, 800, 2830], u: [325, 700, 2530] };
  const WORD = { hey: ['e', 'i', 1, 0.26], ho: ['o', 'u', 1, 0.3], oh: ['o', 'u', 0, 0.34], yeah: ['i', 'a', 0, 0.32], ay: ['a', 'i', 0, 0.3], ah: ['a', 'a', 0, 0.4] };

  return {
    songs, cur: null, back: null, song: null, out: null, timer: null, step: 0, nextT: 0, duck: 1, c: null, miniTurn: 0,

    ctx() { Sfx.init(); return Sfx.ctx; },

    // ---------- mix bus
    setup(c) {
      if (this.out && this.c === c) return;
      this.c = c;
      const G = v => { const n = c.createGain(); n.gain.value = v; return n; };
      const curve = (drive) => { const cv = new Float32Array(2048); for (let k = 0; k < 2048; k++) { const x = k / 1024 - 1; cv[k] = Math.tanh(x * drive) / Math.tanh(drive); } return cv; };
      this.out = G(0.0001);
      const lim = c.createDynamicsCompressor(); lim.threshold.value = -4; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.002; lim.release.value = 0.09;
      this.out.connect(lim); lim.connect(c.destination);
      const glue = c.createDynamicsCompressor(); glue.threshold.value = -18; glue.knee.value = 8; glue.ratio.value = 3; glue.attack.value = 0.015; glue.release.value = 0.2;
      const clip = c.createWaveShaper(); clip.curve = curve(1.3); clip.oversample = '2x';
      const master = G(0.3); glue.connect(clip); clip.connect(master); this.dk = G(1); master.connect(this.dk); this.dk.connect(this.out);
      this.bus = G(1);
      // master tone: a touch of air on top, tidy low end
      const air = c.createBiquadFilter(); air.type = 'highshelf'; air.frequency.value = 5000; air.gain.value = 5;
      const pres = c.createBiquadFilter(); pres.type = 'peaking'; pres.frequency.value = 2200; pres.Q.value = 0.8; pres.gain.value = 3;
      const low = c.createBiquadFilter(); low.type = 'lowshelf'; low.frequency.value = 90; low.gain.value = -2;
      this.bus.connect(low); low.connect(pres); pres.connect(air); air.connect(glue);
      // melodic group: filter sweeps + sidechain pump from the kick
      this.pump = G(1); this.mfilter = c.createBiquadFilter(); this.mfilter.type = 'lowpass'; this.mfilter.frequency.value = 20000; this.mfilter.Q.value = 0.8;
      this.mus = G(2.2); this.mus.connect(this.mfilter); this.mfilter.connect(this.pump); this.pump.connect(this.bus);
      // plate reverb (generated impulse)
      const len = Math.floor(c.sampleRate * 2.4), ir = c.createBuffer(2, len, c.sampleRate);
      for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); let lp = 0; for (let k = 0; k < len; k++) { const p = k / len, w = Math.random() * 2 - 1; lp += (w - lp) * (0.9 - p * 0.75); d[k] = lp * Math.pow(1 - p, 2.6) * (k < c.sampleRate * 0.012 ? k / (c.sampleRate * 0.012) : 1); } }
      this.rev = c.createConvolver(); this.rev.buffer = ir; const revOut = G(0.55); this.rev.connect(revOut); revOut.connect(this.mus);
      // tempo delay with filtered feedback
      this.dly = c.createDelay(2); const fb = G(0.34), dlp = c.createBiquadFilter(); dlp.type = 'lowpass'; dlp.frequency.value = 2600;
      this.dly.connect(dlp); dlp.connect(fb); fb.connect(this.dly); const dOut = G(0.5); dlp.connect(dOut); dOut.connect(this.mus);
      // 808 chain: drive -> tone -> bus (not pumped)
      const sat = c.createWaveShaper(); sat.curve = curve(2.6); sat.oversample = '2x';
      const btone = c.createBiquadFilter(); btone.type = 'lowpass'; btone.frequency.value = 1500;
      const bgain = G(0.4); sat.connect(btone); btone.connect(bgain); bgain.connect(this.bus); this.bassIn = sat;
      this.drums = G(1); this.drums.connect(this.bus);
      // channel strips: [destination, pan, reverb send, delay send]
      const strip = (dest, pan, rv, dl, trim = 1) => {
        const inp = G(trim); let node = inp;
        if (c.createStereoPanner && pan) { const p = c.createStereoPanner(); p.pan.value = pan; inp.connect(p); node = p; }
        node.connect(dest);
        if (rv) { const s = G(rv); inp.connect(s); s.connect(this.rev); }
        if (dl) { const s = G(dl); inp.connect(s); s.connect(this.dly); }
        return inp;
      };
      this.S = {
        kick: strip(this.drums, 0, 0, 0, 0.75), snare: strip(this.drums, 0, 0.22, 0, 2.6), clap: strip(this.drums, 0.05, 0.3, 0, 2.4),
        hat: strip(this.drums, 0.22, 0.04, 0, 4.5), hat2: strip(this.drums, -0.28, 0.06, 0, 4.5), perc: strip(this.drums, -0.35, 0.18, 0.1, 1.6),
        shaker: strip(this.drums, 0.4, 0.08, 0, 2.2), conga: strip(this.drums, -0.25, 0.15, 0, 1.3), fx: strip(this.mus, 0, 0.5, 0, 1.4),
        keysL: strip(this.mus, -0.45, 0.28, 0), keysR: strip(this.mus, 0.45, 0.28, 0),
        padL: strip(this.mus, -0.7, 0.45, 0), padR: strip(this.mus, 0.7, 0.45, 0),
        lead: strip(this.mus, 0.04, 0.22, 0.2), lead2: strip(this.mus, -0.12, 0.25, 0.15),
        bell: strip(this.mus, 0.25, 0.32, 0.28), arp: strip(this.mus, -0.2, 0.2, 0.28),
        chop: strip(this.mus, 0, 0.3, 0.12), stab: strip(this.mus, 0, 0.25, 0.08), choir: strip(this.mus, 0, 0.55, 0),
      };
      // e-piano auto-pan tremolo (one LFO for the whole strip pair)
      const lfo = c.createOscillator(), lg = G(0.18), lgi = G(-0.18); lfo.frequency.value = 4.2;
      lfo.connect(lg); lg.connect(this.S.keysL.gain); lfo.connect(lgi); lgi.connect(this.S.keysR.gain); lfo.start();
      // noise + metallic buffers
      const nl = c.sampleRate, nb = c.createBuffer(1, nl, c.sampleRate), nd = nb.getChannelData(0);
      for (let k = 0; k < nl; k++) nd[k] = Math.random() * 2 - 1;
      this.noiseBuf = nb;
      const ml = Math.floor(c.sampleRate * 1.2), mb = c.createBuffer(1, ml, c.sampleRate), md = mb.getChannelData(0), fr = [205.3, 304.4, 369.6, 522.7, 540, 800].map(f => f * 1.9);
      for (let k = 0; k < ml; k++) { let s = 0; for (const f of fr) s += Math.sin(2 * Math.PI * f * k / c.sampleRate) > 0 ? 1 : -1; md[k] = s / 6 * 0.75 + (Math.random() * 2 - 1) * 0.25; }
      this.metalBuf = mb;
    },

    level() { return (Settings.music ? 0.5 : 0) * this.duck; },
    // a quick dip under each sound effect so the effects always cut through the music
    dip() { const c = this.c; if (!c || !this.dk) return; const now = c.currentTime; if (this._dipT && now - this._dipT < 0.05) return; this._dipT = now; const g = this.dk.gain; g.cancelScheduledValues(now); g.setValueAtTime(Math.max(0.3, g.value), now); g.linearRampToValueAtTime(0.5, now + 0.02); g.linearRampToValueAtTime(1, now + 0.45); },
    isMini(n) { return n === 'mini' || n === 'mini2'; },
    // minigames take turns between the two minigame themes
    nextMini() { this.miniTurn++; return this.miniTurn % 2 ? 'mini' : 'mini2'; },
    play(name) {
      if (Settings.test) return;
      if (this.cur === name && this.timer) return;
      if (this.isMini(name) && this.cur && !this.isMini(this.cur)) this.back = this.cur;
      this.stop();
      this.cur = name;
      if (!name) return;
      const c = this.ctx(); if (!c) return;
      this.setup(c);
      if (c.state === 'suspended') c.resume();
      this.start(this.songs[name], c.currentTime + 0.12);
      this.fade(this.level(), 1.0);
      this.timer = setInterval(() => this.tick(), 25);
    },
    // return from a minigame to whatever was playing before it
    resume() { this.play(this.back || 'board'); },
    start(S, t0) {
      this.song = S; this.step = 0; this.nextT = t0; this.legato = {}; this.arpIdx = 0;
      if (!S._tl) { S._tl = []; S.arr.forEach((sec, k) => { if (k === S.loop) S._loopBar = S._tl.length; for (let b = 0; b < sec.n; b++) S._tl.push({ s: sec, b }); }); }
      this.dly.delayTime.setValueAtTime(0.75 * 60 / S.bpm, t0);
      this.mfilter.frequency.cancelScheduledValues(t0); this.mfilter.frequency.setValueAtTime(20000, t0);
      this.pump.gain.cancelScheduledValues(t0); this.pump.gain.setValueAtTime(1, t0);
    },
    stop() { if (this.timer) clearInterval(this.timer); this.timer = null; if (this.out) this.fade(0, 0.3); },
    fade(v, secs) { const c = this.c; if (!c || !this.out) return; const g = this.out.gain; g.cancelScheduledValues(c.currentTime); g.setValueAtTime(Math.max(0.0001, g.value), c.currentTime); g.linearRampToValueAtTime(Math.max(0.0001, v), c.currentTime + secs); },
    setDuck(d, secs = 0.6) { this.duck = d; this.fade(this.level(), secs); },
    refresh() { if (!Settings.music) this.fade(0, 0.3); else if (this.cur && !this.timer) { const n = this.cur; this.cur = null; this.play(n); } else this.fade(this.level(), 0.4); },

    tick() {
      const c = this.c; if (!c || !this.song) return;
      const e = 60 / this.song.bpm / 4;
      if (this.nextT < c.currentTime - 0.05) { const skip = Math.ceil((c.currentTime - this.nextT) / e); this.step += skip; this.nextT += skip * e; } // tab was asleep: jump ahead, never burst
      while (this.nextT < c.currentTime + 0.2) { this.schedule(this.step, this.nextT, e); this.nextT += e; this.step++; }
    },

    // ---------- sequencer
    schedule(step, t, e) {
      const S = this.song, tl = S._tl, M = S.mix, P = S.p;
      let bar = Math.floor(step / 16); const i = step % 16;
      if (bar >= tl.length) bar = S._loopBar + (bar - tl.length) % (tl.length - S._loopBar);
      const { s: sec, b } = tl[bar];
      const tt = t + (i % 2 ? (S.swing || 0) * e : 0);
      const ch = chord(sec.ch[b % sec.ch.length]);
      if (i === 0) this.barEvents(sec, b, t, e);
      const lane = key => { const name = sec[key]; if (!name) return null; const pat = P[name]; return pat[b % pat.length]; };
      const hits = (key, fn) => { const l = lane(key); if (!l) return; const c = l[i]; if (!c || c === '.') return; const n = c === 'r' ? 2 : c === 't' ? 3 : c === 'R' ? 4 : 1; for (let k = 0; k < n; k++) fn(tt + k * e / n, (c === 'o' ? 0.55 : 1) * (n > 1 ? 0.55 + 0.45 * k / (n - 1) : 1)); };
      const last = b === sec.n - 1;
      hits('kick', (x, v) => this.kick(x, M.kick * v));
      if (sec.fill && last && i >= 12) { for (let k = 0; k < 2; k++) this.snare(tt + k * e / 2, M.snare * (0.35 + (i - 12 + k / 2) * 0.17)); }
      else hits('snare', (x, v) => this.snare(x, M.snare * v * (sec.build ? 0.3 + 0.7 * (b * 16 + i) / (sec.n * 16) : 1)));
      hits('clap', (x, v) => this.clap(x, M.clap * v));
      hits('hat', (x, v) => this.hat(x, M.hat * v, 0, i % 4 === 2));
      hits('ohat', (x, v) => this.hat(x, (M.ohat || M.hat) * v, 0.3, true));
      hits('perc', (x, v) => this.rim(x, M.perc * v));
      hits('shaker', (x, v) => this.shaker(x, M.shaker * v));
      if (sec.conga) { const l = lane('conga'), c = l[i]; if (c && c !== '.') this.conga(tt, M.conga, c === 'x'); }
      // 808
      const bl = lane('bass');
      if (bl && bl[i]) {
        const [m, len, gl] = bl[i]; let to = 0;
        if (gl) { const nx = Object.keys(bl).map(Number).find(k => k > i); if (nx !== undefined) to = bl[nx][0]; else { const pat = P[sec.bass], nb = pat[(b + 1) % pat.length], f = nb[Object.keys(nb).map(Number).sort((a, c) => a - c)[0]]; if (f) to = f[0]; } }
        this.sub808(m, tt, Math.min(len * e, 1.3), M.bass, to);
      }
      // e-piano comping
      const kl = lane('keys');
      if (kl && kl[i] !== '.' && kl[i]) { let n = 1; while (i + n < 16 && kl[i + n] === '.') n++; const v = M.keys * (kl[i] === 'o' ? 0.6 : 1); ch.notes.forEach((m, j) => this.rhodes(m, tt + j * 0.006, n * e, v, j % 2)); }
      if (sec.pad && i === 0) { ch.notes.forEach((m, j) => this.pad(m, t, e * 16, M.pad, j % 2)); this.pad(ch.root + 12 * (ch.root < 48 ? 1 : 0), t, e * 16, M.pad * 0.8, 0); }
      if (sec.choir && i === 0) ch.notes.slice(0, 3).forEach(m => this.choir(m, t, e * 16, M.choir));
      // arpeggio
      const al = lane('arp');
      if (i === 0) this.arpIdx = 0;
      if (al && al[i] && al[i] !== '.') { const tones = ch.notes.concat(ch.notes.map(n => n + 12)); const m = tones[this.arpIdx++ % tones.length]; this.inst(sec.arpI || 'pluck', m + (sec.arpI === 'marimba' ? 12 : 0), tt, e * 1.5, M[sec.arpI || 'pluck'], 'arp'); }
      const sl = lane('stab'); if (sl && sl[i] === 'x') ch.notes.forEach(m => this.brass(m + 12, tt, e * 1.3, M.brass, 'stab'));
      // melodies
      for (const [slot, ik, ok] of [['lead', 'leadI', 'leadOct'], ['lead2', 'lead2I', 'lead2Oct'], ['bell', 'bellI', 'bellOct']]) {
        const ml = lane(slot); if (!ml || !ml[i]) continue;
        const [m, len] = ml[i], name = sec[ik] || 'bell', mm = m + (sec[ok] || 0);
        this.inst(name, mm, tt, len * e, M[name], slot);
      }
      const wl = lane('chop'); if (wl && wl[i] && wl[i] !== '.') this.chop(tt, wl[i], nm(S.chopNote || 'A4'), M.chop);
    },
    barEvents(sec, b, t, e) {
      const S = this.song, M = S.mix, barLen = e * 16;
      if (b === 0) {
        const f = this.mfilter.frequency; f.cancelScheduledValues(t);
        if (sec.filt) { f.setValueAtTime(sec.filt[0], t); f.exponentialRampToValueAtTime(sec.filt[1], t + barLen * sec.n); f.setValueAtTime(20000, t + barLen * sec.n); }
        else f.setValueAtTime(20000, t);
        if (sec.crash) this.crash(t, M.crash);
        if (sec.impact) this.impact(t, M.impact);
      }
      if (sec.riser && b === sec.n - 1) this.riser(t, barLen, M.riser);
    },
    inst(name, m, t, dur, v, slot) {
      const S = this.S[slot] || this.S.lead;
      const L = this.legato[slot], from = L && Math.abs(L.end - t) < 0.03 ? L.m : 0;
      this.legato[slot] = { m, end: t + dur };
      switch (name) {
        case 'whistle': return this.whistle(m, t, dur, v, from, S);
        case 'saw': return this.saw(m, t, dur, v, from, S);
        case 'brass': return this.brass(m, t, dur, v, slot);
        case 'pluck': return this.pluck(m, t, dur, v, S);
        case 'pan': return this.steelpan(m, t, v, S);
        case 'marimba': return this.marimba(m, t, v, S);
        default: return this.bell(m, t, Math.max(0.6, dur * 1.5), v, S);
      }
    },

    // ---------- instruments
    osc(type, f, t) { const o = this.c.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); return o; },
    gain(v = 0.0001) { const g = this.c.createGain(); g.gain.value = v; return g; },
    filt(type, f, q = 0.7) { const b = this.c.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b; },
    adsr(g, t, a, peak, dur, rel, sus = 1) { const p = g.gain; p.setValueAtTime(0.0001, t); p.linearRampToValueAtTime(peak, t + a); p.setValueAtTime(peak * sus, t + Math.max(a, dur)); p.exponentialRampToValueAtTime(0.0001, t + Math.max(a, dur) + rel); },
    play1(src, t, end) { src.start(t); src.stop(end); },
    nz(t, dur, v, type, f, q, dest, buf) {
      const s = this.c.createBufferSource(), b = this.filt(type, f, q), g = this.gain();
      s.buffer = buf || this.noiseBuf; g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(b); b.connect(g); g.connect(dest); s.start(t, Math.random() * 0.4); s.stop(t + dur + 0.02); return b;
    },
    duckAt(t) { const d = this.song.pump || 0; if (!d) return; const p = this.pump.gain; p.setValueAtTime(1 - d, t + 0.005); p.linearRampToValueAtTime(1, t + 0.24); },
    kick(t, v) {
      const o = this.osc('sine', 200, t), g = this.gain();
      o.frequency.exponentialRampToValueAtTime(55, t + 0.055); o.frequency.exponentialRampToValueAtTime(43, t + 0.3);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.002); g.gain.exponentialRampToValueAtTime(v * 0.4, t + 0.09); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      o.connect(g); g.connect(this.S.kick); this.play1(o, t, t + 0.4);
      const o2 = this.osc('triangle', 420, t), g2 = this.gain(); o2.frequency.exponentialRampToValueAtTime(90, t + 0.03);
      g2.gain.setValueAtTime(v * 0.45, t); g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.04); o2.connect(g2); g2.connect(this.S.kick); this.play1(o2, t, t + 0.05);
      this.nz(t, 0.012, v * 0.35, 'highpass', 3800, 0.7, this.S.kick);
      this.duckAt(t);
    },
    sub808(m, t, dur, v, to) {
      const f = hz(m), o = this.osc('sine', f * 2.4, t), g = this.gain();
      o.frequency.exponentialRampToValueAtTime(f, t + 0.035);
      if (to) { o.frequency.setValueAtTime(f, t + dur * 0.5); o.frequency.exponentialRampToValueAtTime(hz(to), t + dur * 0.92); }
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.006); g.gain.setValueAtTime(v, t + dur * 0.55); g.gain.linearRampToValueAtTime(v * 0.75, t + dur * 0.85); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.06);
      o.connect(g); g.connect(this.bassIn); this.play1(o, t, t + dur + 0.08);
      // upper harmonic so the bass line reads on small speakers
      const o2 = this.osc('triangle', f * 2, t), g2 = this.gain(), lp = this.filt('lowpass', 700);
      if (to) { o2.frequency.setValueAtTime(f * 2, t + dur * 0.5); o2.frequency.exponentialRampToValueAtTime(hz(to) * 2, t + dur * 0.92); }
      g2.gain.setValueAtTime(0.0001, t); g2.gain.linearRampToValueAtTime(v * 0.18, t + 0.01); g2.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.04);
      o2.connect(lp); lp.connect(g2); g2.connect(this.bassIn); this.play1(o2, t, t + dur + 0.06);
    },
    snare(t, v) {
      const o = this.osc('triangle', 250, t), g = this.gain(); o.frequency.exponentialRampToValueAtTime(175, t + 0.06);
      g.gain.setValueAtTime(v * 0.75, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12); o.connect(g); g.connect(this.S.snare); this.play1(o, t, t + 0.14);
      this.nz(t, 0.2, v, 'highpass', 1400, 0.7, this.S.snare);
      this.nz(t, 0.09, v * 0.6, 'bandpass', 3800, 1.2, this.S.snare);
    },
    clap(t, v) {
      for (let k = 0; k < 3; k++) this.nz(t + k * 0.0105, 0.018, v * 0.85, 'bandpass', 1450, 1.6, this.S.clap);
      this.nz(t + 0.031, 0.22, v, 'bandpass', 1250, 1.1, this.S.clap);
    },
    hat(t, v, open = 0, alt = false) { this.nz(t, open || 0.045, v, 'highpass', open ? 6500 : 7800, 0.8, alt ? this.S.hat2 : this.S.hat, this.metalBuf); },
    rim(t, v) {
      const o = this.osc('triangle', 820, t), g = this.gain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
      o.connect(g); g.connect(this.S.perc); this.play1(o, t, t + 0.06); this.nz(t, 0.03, v * 0.6, 'bandpass', 2400, 2, this.S.perc);
    },
    shaker(t, v) { const s = this.c.createBufferSource(), b = this.filt('bandpass', 6500, 1.4), g = this.gain(); s.buffer = this.noiseBuf; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07); s.connect(b); b.connect(g); g.connect(this.S.shaker); s.start(t, Math.random() * 0.5); s.stop(t + 0.09); },
    conga(t, v, hi) {
      const f = hi ? 340 : 230, o = this.osc('sine', f * 1.15, t), g = this.gain(); o.frequency.exponentialRampToValueAtTime(f, t + 0.04);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + (hi ? 0.18 : 0.26));
      o.connect(g); g.connect(this.S.conga); this.play1(o, t, t + 0.3); this.nz(t, 0.02, v * 0.4, 'bandpass', 1800, 1.5, this.S.conga);
    },
    crash(t, v) { this.nz(t, 2.2, v, 'highpass', 4200, 0.6, this.S.fx, this.metalBuf); this.nz(t, 1.4, v * 0.6, 'highpass', 6000, 0.6, this.S.fx); },
    riser(t, dur, v) {
      const s = this.c.createBufferSource(), b = this.filt('bandpass', 300, 2.5), g = this.gain();
      s.buffer = this.noiseBuf; s.loop = true; b.frequency.setValueAtTime(300, t); b.frequency.exponentialRampToValueAtTime(7000, t + dur);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + dur * 0.97); g.gain.linearRampToValueAtTime(0.0001, t + dur);
      s.connect(b); b.connect(g); g.connect(this.S.fx); s.start(t); s.stop(t + dur + 0.02);
      const o = this.osc('sawtooth', 110, t), og = this.gain(), lp = this.filt('lowpass', 1200); o.frequency.exponentialRampToValueAtTime(880, t + dur);
      og.gain.setValueAtTime(0.0001, t); og.gain.linearRampToValueAtTime(v * 0.25, t + dur * 0.97); og.gain.linearRampToValueAtTime(0.0001, t + dur);
      o.connect(lp); lp.connect(og); og.connect(this.S.fx); this.play1(o, t, t + dur + 0.02);
    },
    impact(t, v) {
      const o = this.osc('sine', 95, t), g = this.gain(); o.frequency.exponentialRampToValueAtTime(34, t + 0.9);
      g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.3); o.connect(g); g.connect(this.drums); this.play1(o, t, t + 1.35);
      this.nz(t, 0.6, v * 0.25, 'lowpass', 400, 0.7, this.S.fx);
    },
    rhodes(m, t, dur, v, side) {
      const f = hz(m), car = this.osc('sine', f, t), mod = this.osc('sine', f, t), mg = this.gain(), g = this.gain();
      mg.gain.setValueAtTime(f * 2.2, t); mg.gain.exponentialRampToValueAtTime(f * 0.3, t + 0.45);
      mod.connect(mg); mg.connect(car.frequency);
      const end = Math.min(dur, 1.4);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.004); g.gain.exponentialRampToValueAtTime(v * 0.4, t + Math.max(0.05, end)); g.gain.exponentialRampToValueAtTime(0.0001, t + end + 0.3);
      car.connect(g); g.connect(side ? this.S.keysR : this.S.keysL);
      const tine = this.osc('sine', f * 4.01, t), tg = this.gain(); tg.gain.setValueAtTime(v * 0.12, t); tg.gain.exponentialRampToValueAtTime(0.0001, t + 0.12); tine.connect(tg); tg.connect(side ? this.S.keysR : this.S.keysL);
      this.play1(car, t, t + end + 0.32); this.play1(mod, t, t + end + 0.32); this.play1(tine, t, t + 0.14);
    },
    pad(m, t, dur, v, side) {
      const lp = this.filt('lowpass', 700, 0.9), g = this.gain();
      lp.frequency.setValueAtTime(600, t); lp.frequency.linearRampToValueAtTime(1700, t + dur * 0.5); lp.frequency.linearRampToValueAtTime(900, t + dur);
      [-11, 11].forEach(dt => { const o = this.osc('sawtooth', hz(m), t); o.detune.value = dt; o.connect(lp); this.play1(o, t, t + dur + 0.7); });
      this.adsr(g, t, 0.45, v, dur, 0.6, 0.85); lp.connect(g); g.connect(side ? this.S.padR : this.S.padL);
    },
    choir(m, t, dur, v) {
      const f = hz(m), o = this.osc('sawtooth', f, t), vib = this.osc('sine', 5.2, t), vg = this.gain(f * 0.008), g = this.gain();
      vib.connect(vg); vg.connect(o.frequency);
      VOWEL.a.forEach((ff, k) => { const b = this.filt('bandpass', ff, 7), bg = this.gain([1, 0.5, 0.25][k]); o.connect(b); b.connect(bg); bg.connect(g); });
      this.adsr(g, t, 0.4, v, dur, 0.7, 0.9); g.connect(this.S.choir);
      this.play1(o, t, t + dur + 0.8); this.play1(vib, t, t + dur + 0.8);
    },
    whistle(m, t, dur, v, from, dest) {
      const f = hz(m), o = this.osc('sine', from ? hz(from) : f * 0.96, t), g = this.gain();
      o.frequency.exponentialRampToValueAtTime(f, t + (from ? 0.06 : 0.03));
      if (dur > 0.22) { const vib = this.osc('sine', 5.6, t), vg = this.gain(0); vg.gain.setValueAtTime(0, t + 0.12); vg.gain.linearRampToValueAtTime(f * 0.014, t + Math.min(dur, 0.45)); vib.connect(vg); vg.connect(o.frequency); this.play1(vib, t, t + dur + 0.1); }
      const o2 = this.osc('triangle', f * 2, t), g2 = this.gain(v * 0.07); o2.frequency.exponentialRampToValueAtTime(f * 2, t + 0.04); o2.connect(g2); g2.connect(g);
      g.gain.setValueAtTime(from ? v * 0.7 : 0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.025); g.gain.setValueAtTime(v, t + Math.max(0.03, dur - 0.02)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.07);
      o.connect(g); g.connect(dest); this.play1(o, t, t + dur + 0.09); this.play1(o2, t, t + dur + 0.09);
      if (!from) this.nz(t, 0.06, v * 0.12, 'bandpass', f * 2, 3, dest);
    },
    saw(m, t, dur, v, from, dest) {
      const f = hz(m), lp = this.filt('lowpass', 5200, 2.2), g = this.gain();
      lp.frequency.setValueAtTime(6000, t); lp.frequency.exponentialRampToValueAtTime(2000, t + Math.min(0.25, dur + 0.05));
      [-24, -9, 0, 9, 24].forEach(dt => { const o = this.osc('sawtooth', from ? hz(from) : f, t); o.detune.value = dt; if (from) o.frequency.exponentialRampToValueAtTime(f, t + 0.05); o.connect(lp); this.play1(o, t, t + dur + 0.12); });
      const sq = this.osc('square', f / 2, t), sg = this.gain(v * 0.6); sq.connect(sg); sg.connect(lp); this.play1(sq, t, t + dur + 0.12);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.005); g.gain.setValueAtTime(v, t + Math.max(0.01, dur - 0.02)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.1);
      lp.connect(g); g.connect(dest);
    },
    pluck(m, t, dur, v, dest) {
      const f = hz(m), lp = this.filt('lowpass', 4000, 3.5), g = this.gain();
      lp.frequency.setValueAtTime(4200, t); lp.frequency.exponentialRampToValueAtTime(320, t + 0.24);
      const o = this.osc('sawtooth', f, t), o2 = this.osc('square', f * 1.003, t), g2 = this.gain(0.5); o.connect(lp); o2.connect(g2); g2.connect(lp);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.3, Math.min(dur, 0.6)));
      lp.connect(g); g.connect(dest); this.play1(o, t, t + 0.65); this.play1(o2, t, t + 0.65);
    },
    bell(m, t, dur, v, dest) {
      const f = hz(m), car = this.osc('sine', f, t), mod = this.osc('sine', f * 3.5, t), mg = this.gain(), g = this.gain();
      mg.gain.setValueAtTime(f * 1.6, t); mg.gain.exponentialRampToValueAtTime(f * 0.05, t + dur * 0.8);
      mod.connect(mg); mg.connect(car.frequency);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      car.connect(g); g.connect(dest); this.play1(car, t, t + dur + 0.02); this.play1(mod, t, t + dur + 0.02);
    },
    steelpan(m, t, v, dest) {
      const f = hz(m), car = this.osc('sine', f, t), mod = this.osc('sine', f * 2, t), mg = this.gain(), g = this.gain();
      mg.gain.setValueAtTime(f * 0.9, t); mg.gain.exponentialRampToValueAtTime(f * 0.02, t + 0.18); mod.connect(mg); mg.connect(car.frequency);
      const p2 = this.osc('sine', f * 2.005, t), pg = this.gain(); pg.gain.setValueAtTime(v * 0.3, t); pg.gain.exponentialRampToValueAtTime(0.0001, t + 0.35); p2.connect(pg); pg.connect(dest);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.006); g.gain.exponentialRampToValueAtTime(v * 0.35, t + 0.15); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
      car.connect(g); g.connect(dest); this.play1(car, t, t + 0.72); this.play1(mod, t, t + 0.72); this.play1(p2, t, t + 0.4);
    },
    marimba(m, t, v, dest) {
      const f = hz(m), o = this.osc('sine', f, t), g = this.gain(), o2 = this.osc('sine', f * 4, t), g2 = this.gain();
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
      g2.gain.setValueAtTime(v * 0.35, t); g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
      o.connect(g); o2.connect(g2); g.connect(dest); g2.connect(dest); this.play1(o, t, t + 0.42); this.play1(o2, t, t + 0.06);
    },
    brass(m, t, dur, v, slot) {
      const f = hz(m), lp = this.filt('lowpass', 400, 1.5), g = this.gain(), dest = this.S[slot] || this.S.stab;
      lp.frequency.setValueAtTime(350, t); lp.frequency.exponentialRampToValueAtTime(3200, t + 0.05); lp.frequency.exponentialRampToValueAtTime(1400, t + 0.3);
      [-8, 0, 8].forEach(dt => { const o = this.osc('sawtooth', f, t); o.detune.value = dt; o.connect(lp); this.play1(o, t, t + dur + 0.15); });
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.018); g.gain.setValueAtTime(v * 0.85, t + Math.max(0.03, dur - 0.02)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.12);
      lp.connect(g); g.connect(dest);
    },
    chop(t, word, m, v) {
      const W = WORD[word]; if (!W) return;
      const [v1, v2, h, dur] = W, f = hz(m), o = this.osc('sawtooth', f * 1.04, t), g = this.gain();
      o.frequency.exponentialRampToValueAtTime(f, t + 0.05); o.frequency.exponentialRampToValueAtTime(f * 0.9, t + dur);
      VOWEL[v1].forEach((ff, k) => { const b = this.filt('bandpass', ff, 8), bg = this.gain([1.2, 0.7, 0.35][k]); b.frequency.setValueAtTime(ff, t + 0.03); b.frequency.linearRampToValueAtTime(VOWEL[v2][k], t + dur * 0.75); o.connect(b); b.connect(bg); bg.connect(g); });
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + (h ? 0.03 : 0.015)); g.gain.setValueAtTime(v, t + dur * 0.55); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      g.connect(this.S.chop); this.play1(o, t, t + dur + 0.02);
      if (h) this.nz(t, 0.05, v * 0.5, 'bandpass', 1800, 1, this.S.chop);
    },
  };
})();
