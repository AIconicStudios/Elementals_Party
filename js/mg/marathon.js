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
  def(spec) {
    const stages = spec.stages;
    MG.def({
      id: spec.id, name: spec.name, type: 'Marathon', long: true, controls: spec.controls || 'Move + A & B buttons',
      how: spec.how + ' Events: ' + stages.map((s, k) => `${k + 1}) ${s.name}`).join('  ') + '.', wins: 'Most medal points after every event (4 / 3 / 2 / 1 per event).',
      quietMusic: false,
      init(m, S) {
        S.si = 0; S.pts = [0, 0, 0, 0]; S.hist = []; S.phase = 'intro'; S.pt = 0; S.T = {}; S.stageT = 0;
        stages[0].init(m, S, S.T);
      },
      update(m, S, dt) {
        S.pt += dt;
        const st = stages[S.si];
        if (S.phase === 'intro') { if (st.idle) st.idle(m, S, S.T, dt); if (S.pt > 2.8) { S.phase = 'play'; S.pt = 0; S.stageT = 0; Sfx.whistle(); } return; }
        if (S.phase === 'play') {
          S.stageT += dt;
          st.update(m, S, S.T, dt, S.stageT);
          if (st.done(m, S, S.T, S.stageT)) {
            const raw = st.result(m, S, S.T), pts = MGM.rankPts(raw);
            S.hist.push({ name: st.name, icon: st.icon, raw, pts, fmt: st.fmt });
            pts.forEach((p, i) => { S.pts[i] += p; });
            S.phase = 'results'; S.pt = 0; Sfx.crowd('cheer');
          }
          return;
        }
        if (S.phase === 'results') {
          if (st.idle) st.idle(m, S, S.T, dt);
          if (S.pt > 4.2) {
            S.si++;
            if (S.si >= stages.length) { m.finish(this.score(m, S)); return; }
            S.T = {}; MGM.clearIn(m); stages[S.si].init(m, S, S.T); S.phase = 'intro'; S.pt = 0;
          }
        }
      },
      bot(m, S, i, dt) {
        const st = stages[S.si];
        if (S.phase === 'play') st.bot(m, S, S.T, i, dt); else { const v = m.vin[i]; v.a = v.b = v.up = v.down = v.left = v.right = false; v.ax = v.ay = 0; }
      },
      // tie-break on the last event's points, then total raw placings
      score(m, S) { return S.pts.map((p, i) => p + S.hist.reduce((a, h, k) => a + h.pts[i] * 0.001 * (k + 1), 0)); },
      fmt(s) { return `${Math.floor(s + 1e-6)} pts`; },
      hud(m, S, i) { return `${S.pts[i]} pts`; },
      draw(m, S, g) {
        const st = stages[S.si];
        st.draw(m, S, S.T, g);
        // event progress pips (top right)
        stages.forEach((s, k) => { const x = 1270 - (stages.length - k) * 34, y = 58; g.fillStyle = k < S.si ? '#ffd34d' : k === S.si ? '#ffffff' : 'rgba(255,255,255,0.25)'; g.beginPath(); g.arc(x, y, 12, 0, 7); g.fill(); MGH.text(g, s.icon, x, y + 6, 15, '#000', 'center'); });
        if (S.phase === 'intro') MGM.drawIntro(g, m, S, st, S.pt);
        if (S.phase === 'results') MGM.drawResults(g, m, S, S.pt);
      },
    });
  },
  drawIntro(g, m, S, st, t) {
    const k = Math.min(1, t / 0.35), out = t > 2.4 ? (t - 2.4) / 0.4 : 0;
    g.save(); g.globalAlpha = 1 - out;
    g.fillStyle = 'rgba(8,4,24,0.72)'; g.fillRect(0, 40, 1280, 680);
    g.translate(640, 330); g.scale(0.6 + 0.4 * k, 0.6 + 0.4 * k);
    MGH.text(g, `EVENT ${S.si + 1}`, 0, -96, 26, '#ffd34d', 'center', 'bold');
    g.font = '86px "Segoe UI Emoji","Apple Color Emoji",sans-serif'; g.textAlign = 'center'; g.fillText(st.icon, 0, -10);
    g.restore();
    g.save(); g.globalAlpha = 1 - out;
    g.font = 'bold 54px Georgia'; g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 10; g.strokeStyle = '#1a0f3a'; g.strokeText(st.name, 640, 400); g.fillStyle = '#fff'; g.fillText(st.name, 640, 400);
    MGH.wrap(g, st.how, 640, 446, 860, 28, '#e8e0ff', 21);
    g.restore();
  },
  drawResults(g, m, S, t) {
    const h = S.hist[S.hist.length - 1]; if (!h) return;
    const k = Math.min(1, t / 0.3);
    g.save(); g.globalAlpha = k;
    g.fillStyle = 'rgba(8,4,24,0.82)'; MGH.rr(g, 290, 110, 700, 520, 24); g.fill(); g.strokeStyle = '#ffd34d'; g.lineWidth = 3; g.stroke();
    MGH.text(g, `${h.icon} ${h.name} — results`, 640, 160, 30, '#ffe680', 'center', 'bold');
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
