# The Fourfold (PC)

A four-player board game for PC, built from *The Fourfold Rulebook, Draft 1*. Four elemental Holds (Air, Water, Fire, Earth) walk the Crossing, bank coins, buy stars and raid each other's Holds over 20 rounds. After every round there is a Moot, picked from **40 four-player minigames**.

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

**Board turns** use the mouse. Click an option or press `1`–`9`. In hot-seat play, every human seat takes its turn at the same screen.

**Minigames:** up to four people share one keyboard, and gamepads 1–4 map to players 1–4.

| Player | Move | Action | Alt |
|---|---|---|---|
| 1 (Air) | W A S D | Q / Space (or mouse in cursor games) | E |
| 2 (Water) | T F G H | R | Y |
| 3 (Fire) | I J K L | U | O |
| 4 (Earth) | Arrow keys | Enter | Right Shift |

Seats set to *Bot* are played by the AI. The menu's **Moot practice** mode lets you play any of the 40 minigames directly.

## What is implemented

- **Setup:** 10 coins banked over 4 player-chosen Hoard tiles, plus a random Common item. Travellers start on their Gate and Defenders on tile 9. Gates are sealed for rounds 1–3, and round 1 order is set by a die roll.
- **Turn:** play any items as free actions, then choose one: move the Traveller (+4 wage), move the Defender either way around the ring, or Fortify.
- **Main board:** a one-way loop of 40 spaces with the exact mix from the rulebook (4 Gates, 4 Banks, 10 Blue, 10 Red, and 2 each of Summon Ankar, Shutdown, Money Doubler, Lucky, Item and Chameleon). Each pair of specials sits 20 spaces apart.
- **Banks/shops:**
  - Deposit when you land on or pass a Bank.
  - Buy 1 star at a price rolled as 15, 20 or 25.
  - Buy from 3 random item offers and your element's ultimate.
  - Coins on hand are spent first, then the bank.
- **Home rings:** 16 tiles, with the Vault on tile 8 and the Gate on tile 16. Loot piles stay balanced, fake coins and fake stars work, and Loot Protection levels 1–5 are included.
- **Raiding:** follows the rulebook's rules for entering, looting, hot loot, leaving and banking. Catches use exact landing by either piece. The armor/catch table is implemented, along with the Unicorn, Camouflage, Star Pouch, Locked Bag and Dog Biscuit.
- **Items:** all 18 home defenses, 4 element ultimates, 15 raider items, 11 dice items, 11 money items and 9 chaos items, at the rulebook's prices and rarities. Rare and Legendary items only appear in the second half of the game.
- **Ankar, Shutdown, Chameleon:** behave as written in the rulebook.
- **Moot:**
  - The minigames never repeat until all 40 have been played.
  - The player with the fewest stars picks between two games.
  - The winner banks +2 coins and moves to the front of the turn order.
  - Ties go to whoever was earlier in the previous order.
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
- **Flick Off:** this minigame uses hold-and-release power instead of cursor dragging, so it works on every input.
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
js/mg/games1-4.js   the 40 minigames
electron/main.js    desktop window
```
