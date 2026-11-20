# The Fourfold (PC)

A four-player board game for PC, built from *The Fourfold Rulebook, Draft 1*. Four elemental Holds (Air, Water, Fire, Earth) walk the Crossing, bank coins, buy stars and raid each other's Holds over 20 rounds. After every round there is a Moot, picked from **53 four-player minigames**: 48 quick Moots, four multi-event Marathons (played at the halfway Moot) and the Grand Finale brawl, Fourfold Clash (always the last Moot).

The game is HTML5 canvas and JavaScript with no dependencies. An Electron shell turns it into a desktop app for Windows, macOS and Linux.

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

This writes a portable `.exe` and an installer to `dist/`. You can also run the **Build Windows game** GitHub Action (Actions tab → *Run workflow*). It builds the `.exe` on a Windows runner and attaches it as a downloadable artifact.

In the desktop app, F11 toggles fullscreen.

## Controls

**Rolling:** when it's your roll, the die tumbles until you stop it. Click the die or the big button, or press Space.


**Board turns** work with the mouse (click an option or press `1`–`9`), the keyboard (arrows + Enter, Space stops the die) or any gamepad (D-pad/stick to move, A to select or stop the die, B to go back). Press **M** or gamepad **Y** for the map of every Hold's traps, and **H** or gamepad **X** for Help (all board spaces, Hold tiles, items, rules and controls). In hot-seat play, every human seat takes its turn at the same screen.

**Minigames:** up to four people share one keyboard, and gamepads 1–4 map to players 1–4.

| Player | Move | Action | Alt |
|---|---|---|---|
| 1 (Air) | W A S D | Q / Space (or mouse in cursor games) | E |
| 2 (Water) | T F G H | R | Y |
| 3 (Fire) | I J K L | U | O |
| 4 (Earth) | Arrow keys | Enter | Right Shift |

Seats set to *Bot* are played by the AI. Pause any minigame with Esc, gamepad Start or the ⏸ button; from there you can resume or quit (quitting a Moot gives no reward). Before each minigame an intro card plays a live demo; it starts when every human presses their action button. In secret-pick games nobody's cursor is shown — press your alt button (B) to show or hide your own choice — it's a toggle. The menu's **Moot practice** mode lets you play any of the 53 minigames directly.

## Music and views

- **Music:** original background tunes are generated live: a bouncy theme for the board and menu, and a faster one for minigames. Rhythm minigames (Moot Drums, Fourfold Tug) fade the music out so you can hear the beat. Toggle it with 🎵 Music on the board or the Music box on the menu.
- **Close-up view:** press **V**, gamepad **LB** or **LT**, or the 🔍 button to switch between the whole board and a zoomed camera that follows the current player. In close-up, players who react pop in as portraits along the left edge, and a bar across the top shows everyone's stars and coins.

## Two boards

Pick the board on the main menu:

- **🌱 Starter Crossing (for beginners)** keeps the same heart (walk the Crossing, collect coins, buy stars, raid rivals, the Moot minigames and the character reactions) but is much simpler. There is one wallet and one action per turn: use an item if you like, then roll. Stars cost 15 at a Counting House, plus one item per visit.
  - **Spaces:** 🔵 +3, 🔴 −3, 🎡 Lucky Wheel, 🎁 free item, 🌪️ Whirlwind (swap places with a random player), 🎉 Party (everyone +3, you +6) and 🏠 your own Gate (+3 when you pass).
  - **Raiding:** from round 3, passing a rival's Gate lets you sneak in with one dice roll: 1–2 you're caught and pay 3, 3–5 you grab 5 coins, 6 you grab a star.
  - **Seven items:** Double Dice, Magic Die, Guard Dog, Coin Magnet, Snail, Shop Wind and Lucky Star Box.
  - Default length is 12 rounds. The Help screen has a Starter tab explaining everything.
- **⚔️ The Crossing (full game)** is everything below.

## What is implemented

- **Setup:** 10 coins banked over 4 player-chosen Hoard tiles, plus a random Common item. Travellers start on their Gate and Defenders on tile 9. Gates are sealed for rounds 1–3, and round 1 order is set by a die roll.
- **Turn:** play any items as free actions, then choose one: move the Traveller (+3 wage), move the Defender either way around the ring, or Fortify.
- **Main board:** a one-way loop of 40 spaces with the exact mix from the rulebook (4 Gates, 4 Banks, 10 Blue, 10 Red, and 2 each of Summon Ankar, Shutdown, Money Doubler, Lucky, Item and Chameleon). Each pair of specials sits 20 spaces apart.
- **Banks/shops:**
  - Deposit when you land on or pass a Bank.
  - Buy 1 star at a price rolled as 15, 20 or 25.
  - Buy one item per visit, from 3 random offers or your element's ultimate.
  - Coins on hand are spent first, then the bank.
- **Home rings:** 16 tiles, with the Vault on tile 8 and the Gate on tile 16. Loot piles stay balanced, fake coins and fake stars work, and Loot Protection levels 1–5 are included.
- **Raiding:** from round 4, passing or landing on a rival's Gate lets you raid; the rest of your roll is discarded and you walk their ring from tile 16 next turn. Looting, hot loot, leaving and banking follow the rulebook. Catches use exact landing by either piece. The armor/catch table is implemented, along with the Unicorn, Camouflage, Star Pouch, Locked Bag and Dog Biscuit.
- **Items:** all 18 home defenses, 4 element ultimates, 15 raider items, 11 dice items, 11 money items and 9 chaos items, at the rulebook's prices and rarities. Rare and Legendary items only appear in the second half of the game.
- **Ankar:** an Ankar's Altar becomes a Blue or Red space once the Ankar is summoned there. Each round the Ankar follows the nearest Traveller up to 3 spaces and takes 5 coins on contact (never stars).
- **Shutdown, Chameleon:** behave as written in the rulebook.
- **Moot:**
  - The minigames never repeat until every quick Moot has been played.
  - The player with the fewest stars picks between two games.
  - Every player tied for first banks +2 coins; the winners move to the front of the turn order.
- **End of game:** banked stars plus Locked Bag stars are counted. Ties are broken by banked coins, then by minigame wins. You can play 20, 15 or 10 rounds.
- **Lore names:** used throughout the game (Wayfarer, Warden, Waygate, Counting House, Hoard, Starvault, Hellhound, and so on).

## Rule interpretations

The draft left some points open, so these defaults were chosen:

- **"Landing exactly next to another Traveller" steals 1 coin:** this applies when you land on the *same* space as another Traveller.
- **Element ultimates:** you buy them at a shop. A Fortify turn unleashes them immediately.
  - Typhoon, Great Ebb and Sacrifice Pyre need a raider inside your ring.
  - Famished Earth is permanent once placed.
- **Cash on hand when a raider is killed:** it goes to the Hold that caught them.
- **Heavy Armor:** it is used up when it saves you from a catch.
- **Passive items:** the Dog Biscuit, Star Pouch, Iron Stomach, Lucky Charm, Skeleton Key, Decoy Star, Coupon, Interest Note, Master Key, Star Sale and Bulk Buy all work automatically while they are in your hand.
- **Armor, Camouflage, Ghost Walk and Locked Bag:** you equip them by playing them.
- **Locked Bag:** it fills automatically, up to 1 star and 5 coins, at the end of each of your turns. A bank visit empties it into your bank.
- **Hollow Ground:** raiders pay up to 5 coins per Loot or Vault landing. A Vault landing also costs them a star.
- **Tower of Tokens:** uses overhang trimming instead of full physics.
- **Play mode:** this is a local shared-screen game for 1–4 humans, with bots filling the other seats. Online play is not implemented.

## Project layout

```
index.html          page shell
css/style.css       UI styles
js/data.js          board layout, elements, the full item catalogue
js/game.js          rules engine (turns, movement, raiding, items, shop, scoring)
js/ai.js            bot decisions for the board game
js/render.js        canvas board renderer
js/ui.js            side panel, prompts, menus
js/input.js         keyboard / gamepad / mouse for 4 players
js/mg/core.js       minigame framework (cards, countdown, results, bots, simulation)
js/mg/games1-6.js   the quick Moots
js/mg/games7.js     Fourfold Clash, the Grand Finale brawl
js/mg/marathon.js   the marathon framework (events back to back, medal points)
js/mg/games8-11.js  The Elemental Games, Titan Trials, Turbo Stunt Rally, Tower of Trials
electron/main.js    desktop window
```
