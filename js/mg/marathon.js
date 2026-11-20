'use strict';
// Marathon Moots: several events played back to back inside one minigame.
// Each event awards medal points (4 / 3 / 2 / 1, ties share); the most points after the last event wins.
const MGM = {
  PTS: [4, 3, 2, 1],
  rankPts(vals) { return vals.map(v => this.PTS[vals.filter(o => o > v + 1e-9).length] || 0); },
  // horizontal lanes for side-on events
  lane(i, top = 110, h = 148) { return { y0: top + i * h, y1: top + (i + 1) * h, h, mid: top + i * h + h / 2 }; },
  clearIn(m) { m.vin.forEach(v => { v.up = v.down = v.left = v.right = v.a = v.b = false; v.ax = 0; v.ay = 0; }); },
  // alternating A/B mashing: a fresh alternate press counts as a good stride
  stride(m, i, P) {
    const a = m.pressed(i, 'a'), b = m.pressed(i, 'b');
    if (!a && !b) return 0;
    const k = a ? 'a' : 'b', good = P.lastKey !== k; P.lastKey = k;
    return good ? 1 : 0.25;
  },
  // bots: press alternately at a given rate (presses per second)
  botStride(m, i, P, rate, dt) {
    P.bt = (P.bt || 0) + dt; const v = m.vin[i]; v.a = v.b = false;
    if (P.bt >= 1 / rate) { P.bt = Math.min(P.bt - 1 / rate, 0.5 / rate); P.bk = P.bk === 'a' ? 'b' : 'a'; v[P.bk] = true; }
  },
  // the rhythm stride (instead of button mashing): a marker sweeps across a small bar; press A (or B) as
  // it crosses the green zone. Perfect = 1.35, good = 1, off-beat = 0.2. One press per sweep counts.
  rhythm(m, i, P, dt, tempo) {
    P.rp = (P.rp || 0) + dt * tempo; P.rpFx = Math.max(0, (P.rpFx || 0) - dt);
    if (P.rp >= 1) { P.rp -= 1; P.rpUsed = false; }
    if (!(m.pressed(i, 'a') || m.pressed(i, 'b')) || P.rpUsed) return 0;
    const off = Math.abs(P.rp - 0.5); P.rpUsed = true; P.rpFx = 0.35;
    const r = off < 0.05 ? 1.35 : off < 0.13 ? 1 : 0.2; P.rpRes = r;
    if (!m.bot(i)) Sfx.tone(r > 1 ? 1180 : r >= 1 ? 880 : 300, 0.05, 'triangle', 0.04);
    return r;
  },
  botRhythm(m, i, P) {
    const v = m.vin[i];
    // aim for a point near the zone's centre (a bit off, like a person) and press on the first frame past it
    // (a bot's press lands one frame later, so it aims a touch early)
    const lead = 0.07, aim = () => 0.5 - lead + R.range(-0.08, 0.08) * (Math.random() < 0.15 ? 1.8 : 1);
    if (P.bTgt === undefined) P.bTgt = aim();
    const rp = P.rp || 0;
    if (!P.rpUsed && rp >= P.bTgt && rp < P.bTgt + 0.3) { v.a = !m.prev[i].a; if (v.a) P.bTgt = aim(); }
  },
  drawRhythm(g, x, y, P, w = 96) {
    g.fillStyle = 'rgba(0,0,0,0.55)'; MGH.rr(g, x - w / 2 - 4, y - 9, w + 8, 18, 9); g.fill();
    g.fillStyle = 'rgba(120,230,120,0.75)'; g.fillRect(x - w * 0.13, y - 6, w * 0.26, 12);
    g.fillStyle = '#ffe680'; g.fillRect(x - w * 0.05, y - 6, w * 0.1, 12);
    const mx = x - w / 2 + (P.rp || 0) * w;
    g.fillStyle = P.rpUsed ? 'rgba(255,255,255,0.4)' : '#fff'; g.fillRect(mx - 2.5, y - 10, 5, 20);
    if (P.rpFx > 0) { g.globalAlpha = P.rpFx / 0.35; MGH.text(g, P.rpRes > 1 ? 'PERFECT' : P.rpRes >= 1 ? 'good' : 'off-beat', x, y - 14, 12, P.rpRes > 1 ? '#ffe680' : P.rpRes >= 1 ? '#9fffa0' : '#ff9a9a', 'center', 'bold'); g.globalAlpha = 1; }
  },
  def(spec) {
    const stages = spec.stages;
    MG.def({
      id: spec.id, name: spec.name, type: 'Marathon', long: true, stages, controls: spec.controls || 'Move + A & B buttons',
      how: spec.how + ' Events: ' + stages.map((s, k) => `${k + 1}) ${s.name}`).join('  ') + '.', wins: 'Most medal points after every event (4 / 3 / 2 / 1 per event).',
      quietMusic: false,
      init(m, S) {
        S.si = 0; S.pts = [0, 0, 0, 0]; S.hist = []; S.phase = 'intro'; S.pt = 0; S.T = {}; S.stageT = 0;
        stages[0].init(m, S, S.T);
      },
      update(m, S, dt) {
        S.pt += dt;
        const st = stages[Math.min(S.si, stages.length - 1)];
        // the intro waits for a human to press A (so there's time to read it); bots-only games move on by themselves
        const humans = m.players.some((p, i) => !m.bot(i)), tap = m.players.some((p, i) => !m.bot(i) && (m.pressed(i, 'a') || m.pressed(i, 'start')));
        if (S.phase === 'intro') { if (st.idle) st.idle(m, S, S.T, dt); if (humans ? (S.pt > 1.5 && tap) || S.pt > 30 : S.pt > 5.5) { S.phase = 'play'; S.pt = 0; S.stageT = 0; Sfx.whistle(); } return; }
        if (S.phase === 'play') {
          S.stageT += dt;
          st.update(m, S, S.T, dt, S.stageT);
          if (st.done(m, S, S.T, S.stageT)) {
            const raw = st.result(m, S, S.T), pts = MGM.rankPts(raw);
            S.hist.push({ name: st.name, icon: st.icon, raw, pts, fmt: st.fmt, dur: S.stageT });
            pts.forEach((p, i) => { S.pts[i] += p; });
            S.phase = 'results'; S.pt = 0; Sfx.crowd('cheer');
          }
          return;
        }
        if (S.phase === 'results') {
          if (st.idle) st.idle(m, S, S.T, dt);
          if (humans ? (S.pt > 1.2 && tap) || S.pt > 20 : S.pt > 4.2) {
            // the last event: finish on the final results screen (never step past the last stage)
            if (S.si + 1 >= stages.length) { S.phase = 'over'; m.finish(this.score(m, S)); return; }
            S.si++;
            S.T = {}; MGM.clearIn(m); stages[S.si].init(m, S, S.T); S.phase = 'intro'; S.pt = 0;
          }
        }
      },
      bot(m, S, i, dt) {
        const st = stages[Math.min(S.si, stages.length - 1)];
        if (S.phase === 'play') st.bot(m, S, S.T, i, dt); else { const v = m.vin[i]; v.a = v.b = v.up = v.down = v.left = v.right = false; v.ax = v.ay = 0; }
      },
      // tie-break on the last event's points, then total raw placings
      score(m, S) { return S.pts.map((p, i) => p + S.hist.reduce((a, h, k) => a + h.pts[i] * 0.001 * (k + 1), 0)); },
      fmt(s) { return `${Math.floor(s + 1e-6)} pts`; },
      hud(m, S, i) { return `${S.pts[i]} pts`; },
      draw(m, S, g) {
        const st = stages[Math.min(S.si, stages.length - 1)];
        st.draw(m, S, S.T, g);
        // event progress pips (top right)
        stages.forEach((s, k) => { const x = 1270 - (stages.length - k) * 34, y = 58; g.fillStyle = k < S.si ? '#ffd34d' : k === S.si ? '#ffffff' : 'rgba(255,255,255,0.25)'; g.beginPath(); g.arc(x, y, 12, 0, 7); g.fill(); MGH.text(g, s.icon, x, y + 6, 15, '#000', 'center'); });
        if (S.phase === 'intro') MGM.drawIntro(g, m, S, st, S.pt);
        // the event's controls stay on screen early on (and all through the practice round)
        if (S.phase === 'play' && (m.practice || S.stageT < 9)) MGM.drawHow(g, st, m.practice ? 1 : clamp((9 - S.stageT) / 1.2, 0, 1), m.practice ? 46 : 640);
        if (S.phase === 'results') MGM.drawResults(g, m, S, S.pt);
      },
    });
  },
  drawIntro(g, m, S, st, t) {
    const k = Math.min(1, t / 0.35), out = 0;
    g.save(); g.globalAlpha = 1 - out;
    g.fillStyle = 'rgba(8,4,24,0.72)'; g.fillRect(0, 40, 1280, 680);
    g.translate(640, 330); g.scale(0.6 + 0.4 * k, 0.6 + 0.4 * k);
    MGH.text(g, `EVENT ${S.si + 1}`, 0, -96, 26, '#ffd34d', 'center', 'bold');
    g.font = '86px "Segoe UI Emoji","Apple Color Emoji",sans-serif'; g.textAlign = 'center'; g.fillText(st.icon, 0, -10);
    g.restore();
    g.save(); g.globalAlpha = 1 - out;
    g.font = 'bold 54px Georgia'; g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 10; g.strokeStyle = '#1a0f3a'; g.strokeText(st.name, 640, 400); g.fillStyle = '#fff'; g.fillText(st.name, 640, 400);
    MGH.wrap(g, st.how, 640, 446, 860, 28, '#e8e0ff', 21);
    if (t > 1.5 && m.players.some((p, i) => !m.bot(i))) { g.globalAlpha = 0.6 + 0.4 * Math.sin(t * 5); MGH.text(g, 'Press  A  when you\'re ready', 640, 600, 22, '#ffe680', 'center', 'bold'); }
    g.restore();
  },
  drawHow(g, st, a, y0 = 640) {
    if (a <= 0) return;
    g.save(); g.globalAlpha = a;
    g.fillStyle = 'rgba(8,4,24,0.82)'; MGH.rr(g, 130, y0, 1000, 72, 16); g.fill(); g.strokeStyle = 'rgba(255,230,128,0.7)'; g.lineWidth = 2; g.stroke();
    MGH.text(g, `${st.icon} ${st.name}`, 215, y0 + 42, 18, '#ffe680', 'center', 'bold');
    MGH.wrap(g, st.how, 700, y0 + 24, 820, 20, '#fff', 15);
    g.restore();
  },
  drawResults(g, m, S, t) {
    const h = S.hist[S.hist.length - 1]; if (!h) return;
    const k = Math.min(1, t / 0.3);
    g.save(); g.globalAlpha = k;
    g.fillStyle = 'rgba(8,4,24,0.82)'; MGH.rr(g, 290, 110, 700, 520, 24); g.fill(); g.strokeStyle = '#ffd34d'; g.lineWidth = 3; g.stroke();
    MGH.text(g, `${h.icon} ${h.name} — results`, 640, 160, 30, '#ffe680', 'center', 'bold');
    if (t > 1.2 && m.players.some((p, i) => !m.bot(i))) MGH.text(g, 'Press  A  to continue', 640, 618, 17, '#ffe680', 'center', 'bold');
    const order = [0, 1, 2, 3].sort((a, b) => S.pts[b] - S.pts[a]);
    MGH.text(g, 'event', 700, 200, 15, '#bbb'); MGH.text(g, 'medal', 820, 200, 15, '#bbb'); MGH.text(g, 'total', 925, 200, 15, '#bbb');
    order.forEach((i, r) => {
      const p = m.players[i], y = 250 + r * 92, place = 1 + h.raw.filter(o => o > h.raw[i] + 1e-9).length;
      g.fillStyle = 'rgba(255,255,255,0.07)'; MGH.rr(g, 320, y - 40, 640, 80, 16); g.fill();
      Char.draw(g, 370, y - 4, 24, p.el.id, p.color, { mood: place === 1 ? 'cheer' : place === 4 ? 'sad' : 'happy', seed: i });
      MGH.text(g, p.name, 410, y + 8, 24, p.color, 'left', 'bold');
      MGH.text(g, h.fmt ? h.fmt(h.raw[i]) : String(Math.round(h.raw[i])), 700, y + 8, 19, '#fff');
      MGH.text(g, ['🥇', '🥈', '🥉', '4th'][place - 1] + ` +${h.pts[i]}`, 820, y + 8, 22, '#ffe680', 'center', 'bold');
      MGH.text(g, String(S.pts[i]), 925, y + 10, 30, '#fff', 'center', 'bold');
    });
    g.restore();
  },
  // shared scenery: a stadium with stands and a cheering crowd
  stadium(g, t, tint = '#4a8ad8') {
    const sky = g.createLinearGradient(0, 40, 0, 300); sky.addColorStop(0, '#5fb0ff'); sky.addColorStop(1, '#cfe9ff');
    g.fillStyle = sky; g.fillRect(0, 40, 1280, 260);
    MGH.cloud(g, (t * 12) % 1500 - 150, 70, 0.8); MGH.cloud(g, (t * 8 + 700) % 1500 - 150, 90, 0.6);
    g.fillStyle = MGH.grad(g, 60, 110, ['#3a3f5a', '#2a2e44']); g.fillRect(0, 60, 1280, 50);
    MGH.crowd(g, t, 104, 34);
    for (let k = 0; k < 6; k++) { const x = 100 + k * 216; g.fillStyle = '#d8dee8'; g.fillRect(x, 42, 6, 22); MGH.glow(g, x + 3, 44, 30, 'rgba(255,255,220,0.5)'); }
    g.fillStyle = tint; g.fillRect(0, 106, 1280, 6);
  },
};
