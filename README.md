# Fourfold Minigame Party (PC)

A four-player minigame party for PC. Pick from **15 heroes**, then play a growing collection of
four-player minigames: free-for-all, **2 vs 2**, **1 vs 3**, sports, brawls and multi-event
marathons. Play any game in **Free Play**, or take on the **Challenge**: every game comes up
once in random order, with stars for 1st, 2nd and 3rd, until a champion is crowned.

The game is HTML5 canvas and JavaScript with no dependencies. An Electron shell turns it into a
desktop app for Windows, macOS and Linux.

## Play it

**Quickest way:** open `index.html` in Chrome, Edge or Firefox.

**As a desktop app (Electron):**

```bash
npm install
```

```bash
npm start
```

**Build a Windows `.exe`:**

```bash
npm run dist:win
```

In the desktop app, F11 toggles fullscreen.

## How a session goes

1. **Title screen:** press A (or Space / Enter, or click).
2. **Hero select:** each player presses A on their own gamepad, or their keyboard keys, to join.
   Move the cursor, press A to pick and B to change your mind. Two players can never take the
   same hero. Empty seats become CPU players with random heroes. Press START or A when everyone
   is ready.
3. **Main menu:**
   - 🏆 **Challenge:** start new or continue. A saved challenge survives closing the game.
   - 🎮 **Free Play:** a browser with live thumbnails and category tabs (All, Free-for-all,
     2 vs 2, 1 vs 3, Sports, Brawl, Marathon, Skill, Wits & luck, Action). X / Y or LB / RB
     switch tabs.
   - 📜 **Records:** most wins per hero, challenge champions and favourite games.
   - ⚙️ **Settings:** sound, music, voices, practice rounds and **custom controls**.
4. **Team games:** pick **Random teams** (Y) or arrange them yourselves (up/down to choose a
   hero, left/right to move them across). In the Challenge, teams are drawn at random.
5. **After each game:** play again, a random game, or back to the list. In the Challenge, go
   to the next game or replay this one (the new result replaces the old).

## The heroes

| Hero | Element | Hero | Element | Hero | Element |
|---|---|---|---|---|---|
| Zephi | Air | Wisp | Smoke | Volt | Lightning |
| Drip | Water | Mizzle | Rain | Dune | Sand |
| Pyra | Fire | Flint | Rock | Cinder | Magma |
| Pebble | Earth | Blossom | Plant | Lumi | Light |
| | | Frost | Ice | Nyx | Night |
| | | | | Rivet | Metal |

Every hero has their own headwrap pattern, an animated ornament, an outfit, eye colour,
resting face, idle animation and voice.

## Controls

Up to four people can share one keyboard, and gamepads join on the hero select screen.
Every seat has a stick or D-pad, A, B, X, Y, LB, RB, LT, RT, Start and Select. Any of them
can be changed per player in **Settings ▸ Controls**.

| Player | Move | A | B | X | Y | LB / RB | Select |
|---|---|---|---|---|---|---|---|
| 1 | W A S D | Q / Space | E | Z | C | 1 / 2 | X |
| 2 | T F G H | R | Y | B | N | 5 / 6 | V |
| 3 | I J K L | U | O | , | . | 9 / 0 | M |
| 4 | Arrow keys | Enter | Right Shift | Num 1 | Num 2 | Num 4 / Num 5 | Backspace |

- Before each minigame an intro card plays a live demo, with pictures of the controls. Press A
  or START when ready.
- A practice round follows: no timer, and it doesn't count. START or SELECT ends it. Practice
  can be switched off in Settings.
- Pause any minigame with Esc, gamepad Start or the ⏸ button.
- Secret-choice games use the button diamond: **Y = up, B = right, A = down, X = left**. On
  the keyboard, the stick or arrow directions also work.

## Project layout

```
index.html          page shell
css/style.css       styles
js/util.js          settings, random, sound effects, voices
js/music.js         generated background music
js/data.js          the 15 heroes (elements, colours)
js/input.js         keyboard / gamepad / mouse for 4 players, custom controls
js/chars.js         the heroes' drawings, moods and animations
js/shell.js         title, hero select, menus, Challenge, Free Play, teams, records, settings
js/mg/core.js       minigame framework (intro cards, practice, countdown, teams, results, bots)
js/mg/art.js        shared drawing helpers (scenes, props, effects)
js/mg/games*.js     the minigames
js/mg/party*.js     the party collection (sports, team games, show games)
js/mg/marathon.js   the marathon framework (events back to back, medal points)
electron/main.js    desktop window
```
