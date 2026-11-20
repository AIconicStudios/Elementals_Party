// The Fourfold - static game data (board layout, elements, items)
'use strict';

const ELEMENTS = [
  { id: 0, key: 'air', mascot: 'Zephi',    name: 'Air',   hold: 'Skyhold',   people: 'Stormborn', color: '#8fe0ff', dark: '#2a7fa8', glyph: '🌪️', ult: 'typhoon' },
  { id: 1, key: 'water', mascot: 'Drip',  name: 'Water', hold: 'Tidehold',  people: 'Tideborn',  color: '#4f8dff', dark: '#1f3f9a', glyph: '🌊', ult: 'washout' },
  { id: 2, key: 'fire', mascot: 'Pyra',   name: 'Fire',  hold: 'Emberhold', people: 'Emberkin',  color: '#ff6a3d', dark: '#a82a10', glyph: '🔥', ult: 'inferno' },
  { id: 3, key: 'earth', mascot: 'Pebble',  name: 'Earth', hold: 'Stonehold', people: 'Rootbound', color: '#7ccf4a', dark: '#3f7a1c', glyph: '⛰️', ult: 'hollow' },
];

// Space types on the Crossing (main board)
const SPACE = {
  gate:     { name: 'Gate',            lore: 'Waygate',        color: '#d9c27a', icon: '🌀' , desc: "One per Hold, every 10 spaces. Passing or landing on your own lets you bank what you carry; landing exactly lets you step inside as a second Warden. Passing or landing on a rival's Waygate (from round 4) lets you raid their Hold — the rest of your roll is discarded." },
  bank:     { name: 'Bank / Shop',     lore: 'Counting House', color: '#f2d36b', icon: '🏛️' , desc: 'Landing on or passing it lets you deposit everything you carry, buy 1 star (price rolled 15, 20 or 25) and buy one item per visit.' },
  blue:     { name: 'Blue',            lore: 'Boon',           color: '#3d7bff', icon: '+5' , desc: '+5 coins on hand.' },
  red:      { name: 'Red',             lore: 'Bane',           color: '#e0443a', icon: '−3' , desc: '−3 coins on hand (never below 0).' },
  summon:   { name: 'Summon the Ankar',lore: "Ankar's Altar",  color: '#6b3fa0', icon: '👁️' , desc: 'Sets the Ankar loose here. The Altar then turns into a Boon (blue) space. The Ankar follows the nearest Wayfarer up to 3 spaces each round and takes 5 coins from anyone it meets.' },
  shutdown: { name: 'Shutdown',        lore: 'Eclipse',        color: '#2b2b3a', icon: '🌑' , desc: 'Closes 2 random Waygates and 2 Counting Houses for 2 rounds.' },
  doubler:  { name: 'Money Doubler',   lore: 'Gilded Spring',  color: '#e8b923', icon: '×2' , desc: 'Doubles your coins on hand (max +10) and gives +1 carried star if you carry any.' },
  lucky:    { name: 'Lucky',           lore: 'Fortune Wheel',  color: '#2fbf8f', icon: '🎡' , desc: 'Spin the wheel: win 1, 3, 5 or 10 coins.' },
  item:     { name: 'Item',            lore: "Pedlar's Stall", color: '#c46bd6', icon: '🎁' , desc: 'Get a random item.' },
  chameleon:{ name: 'Chameleon',       lore: 'Mirage',         color: '#8a8f99', icon: '❓' , desc: 'Turns into another special space (picked by a die roll) when you land on it.' },
  swirl:    { name: 'Whirlwind',       lore: 'Whirlwind',      color: '#5fc8e8', icon: '🌪️', desc: 'Starter board: swap places with a random other player.' },
  party:    { name: 'Party',           lore: 'Party',          color: '#ff8ad8', icon: '🎉', desc: 'Starter board: everyone gets 3 coins — and you get 6!' },
};
const SPECIAL_TYPES = ['summon', 'shutdown', 'doubler', 'lucky', 'item'];

// 20-space half, mirrored to the second half (specials 20 apart, max 2 same colour in a row)
const HALF = ['gate', 'blue', 'lucky', 'red', 'blue', 'bank', 'summon', 'red', 'blue', 'item',
              'gate', 'red', 'doubler', 'blue', 'red', 'bank', 'shutdown', 'blue', 'red', 'chameleon'];
// just one Ankar's Altar on the whole Crossing: its twin on the far side is a plain Boon space
const BOARD = HALF.concat(HALF.map(x => x === 'summon' ? 'blue' : x));

const RING_SIZE = 16;
const RING_GATE = 16;
const RING_VAULT = 8;
const DEF_START = 9;

const RARITY = { C: 'Common', U: 'Uncommon', R: 'Rare', L: 'Legendary', E: 'Elemental' };
const RARITY_WEIGHT = { C: 60, U: 30, R: 8, L: 2 };

// cat: defense | ultimate | raider | dice | money | chaos
// use (hand items): play | passive
// place (defenses): tile | loot | vault | hidden
// target: enemy | any | selfOrEnemy | raider (raider in my ring)
const ITEMS = [
  // ---- Home defenses ----
  { id: 'dog', name: 'Dog', lore: 'Hellhound', price: 8, r: 'U', cat: 'defense', place: 'tile', icon: '🐕', desc: 'Chases the raider to the Gate and out; one looted coin drops per space run (stars last) and returns to you.' },
  { id: 'prison', name: 'Prison', lore: 'Oubliette', price: 8, r: 'U', cat: 'defense', place: 'tile', icon: '⛓️', desc: 'Locks the raider 2 turns and takes their loot. You set bail at 5, 10 or none.' },
  { id: 'poison', name: 'Poison Elixir', lore: "Widow's Draught", price: 8, r: 'U', cat: 'defense', place: 'tile', icon: '☠️', desc: 'Raider hands back loot, then each turn their roll is −1 and they lose 1 coin until cured by an Antidote.' },
  { id: 'atm', name: 'ATM Drill', lore: 'Tithe Hook', price: 4, r: 'C', cat: 'defense', place: 'tile', icon: '🪝', desc: 'The raider pays you 5 coins, or whatever they have.' },
  { id: 'stardrill', name: 'Star Drill', lore: 'Starsiphon', price: 14, r: 'R', cat: 'defense', place: 'tile', icon: '🌠', desc: 'The raider loses 1 banked star to you, if they have one.' },
  { id: 'vaultprot', name: 'Vault Protector', lore: 'Warding Seal', price: 14, r: 'R', cat: 'defense', place: 'vault', icon: '🔏', desc: 'On the Vault. Protects your stars for 2 turns.' },
  { id: 'fakecoin', name: 'Fake Coin', lore: 'Gilded Lead', price: 3, r: 'C', cat: 'defense', place: 'loot', icon: '🪙', desc: 'Adds 5 fake coins to a Loot space. Raiders draw fakes as +0.' },
  { id: 'fakestar', name: 'Fake Star (pack of 2)', lore: 'Paste Stars', price: 12, r: 'R', cat: 'defense', place: 'vault', icon: '✴️', desc: 'Adds 2 fake stars to your Vault. A raider draws randomly from real and fake.' },
  { id: 'grace', name: 'Saving Grace', lore: 'Saving Grace', price: 16, r: 'L', cat: 'defense', place: 'hidden', icon: '😇', desc: 'Hidden mine placed on a random tile (even you don’t know where). Raider loses loot, is locked 3 turns, pays 3, sent to the Gate.' },
  { id: 'lp1', name: 'Loot Protection L1', lore: 'Hoardward I', price: 2, r: 'C', cat: 'defense', place: 'loot', lvl: 1, icon: '🛡️', desc: 'Protects 1 of the 5 coins taken, for the next 2 loot events.' },
  { id: 'lp2', name: 'Loot Protection L2', lore: 'Hoardward II', price: 4, r: 'C', cat: 'defense', place: 'loot', lvl: 2, icon: '🛡️', desc: 'Protects 2 coins per loot event, for 2 events.' },
  { id: 'lp3', name: 'Loot Protection L3', lore: 'Hoardward III', price: 6, r: 'U', cat: 'defense', place: 'loot', lvl: 3, icon: '🛡️', desc: 'Protects 3 coins per loot event, for 2 events.' },
  { id: 'lp4', name: 'Loot Protection L4', lore: 'Hoardward IV', price: 9, r: 'U', cat: 'defense', place: 'loot', lvl: 4, icon: '🛡️', desc: 'Protects 4 coins per loot event, for 2 events.' },
  { id: 'lp5', name: 'Loot Protection L5', lore: 'Hoardward V', price: 12, r: 'R', cat: 'defense', place: 'loot', lvl: 5, icon: '🛡️', desc: 'Protects all 5 coins per loot event, for 2 events.' },
  { id: 'mimic', name: 'Mimic Chest', lore: 'Mimic Chest', price: 4, r: 'C', cat: 'defense', place: 'loot', icon: '🧰', desc: 'On a Loot space. The first raider to loot it loses 5 coins instead of gaining them.' },
  { id: 'banana', name: 'Banana Peel', lore: 'Slickmoss', price: 2, r: 'C', cat: 'defense', place: 'tile', icon: '🍌', desc: 'The raider slides back 1 to 6 spaces.' },
  { id: 'alarm', name: 'Alarm Bell', lore: "Warden's Bell", price: 3, r: 'C', cat: 'defense', place: 'tile', icon: '🔔', desc: 'Your Defender gets a free move, without spending a turn.' },
  { id: 'rust', name: 'Rust', lore: 'Verdigris Curse', price: 4, r: 'U', cat: 'defense', place: 'tile', icon: '🧪', desc: 'Strips all the raider’s armor.' },

  // ---- Element ultimates ----
  { id: 'typhoon', name: 'Typhoon', lore: 'Typhoon', el: 0, price: 25, r: 'E', cat: 'ultimate', icon: '🌪️', desc: 'Throws every raider out of your ring. You keep what they looted; they lose all unbanked resources.' },
  { id: 'washout', name: 'Washout', lore: 'Great Ebb', el: 1, price: 20, r: 'E', cat: 'ultimate', icon: '🌊', desc: 'Washes a raider to a random Crossing space with its loot; your Warden raids a random Hoard or Vault of theirs.' },
  { id: 'inferno', name: 'Inferno', lore: 'Sacrifice Pyre', el: 2, price: 20, r: 'E', cat: 'ultimate', icon: '🔥', desc: 'Burn 1 of your stars: a raider’s Traveller dies for good and their Defender must go to work.' },
  { id: 'hollow', name: 'Hollow Ground', lore: 'Famished Earth', el: 3, price: 20, r: 'E', cat: 'ultimate', icon: '⛰️', desc: 'From now on, raiders landing on your Loot or Vault lose coins and stars to you instead of gaining them.' },

  // ---- Raider and worker items ----
  { id: 'armor', name: 'Normal Armor', lore: 'Hide Mantle', price: 5, r: 'C', cat: 'raider', use: 'play', icon: '🥋', desc: 'Equip: ignores 1 trap. No use against a catch or the Unicorn.' },
  { id: 'heavy', name: 'Heavy Armor', lore: 'Ironplate', price: 10, r: 'U', cat: 'raider', use: 'play', icon: '🛡️', desc: 'Equip: ignores 2 traps. Against a catch or Unicorn: sent to the Gate with half the looted coins, looted stars lost.' },
  { id: 'camo', name: 'Camouflage', lore: 'Veilcloak', price: 6, r: 'U', cat: 'raider', use: 'play', icon: '🫥', desc: 'Equip: the Defender misses you once. Also stops the Unicorn unless you carry a looted star.' },
  { id: 'bag', name: 'Locked Bag', lore: 'Sealed Satchel', price: 10, r: 'U', cat: 'raider', use: 'play', icon: '👜', desc: 'Equip: holds 1 star and 5 coins safe from theft. Contents are banked at the end of the game.' },
  { id: 'antidote', name: 'Antidote', lore: 'Wormwood Tonic', price: 5, r: 'C', cat: 'raider', use: 'play', icon: '🧴', desc: 'Cures Poison.' },
  { id: 'biscuit', name: 'Dog Biscuit', lore: "Hound's Bone", price: 3, r: 'C', cat: 'raider', use: 'passive', icon: '🦴', desc: 'Automatic: when a Dog fires on you, you drop the biscuit and lose no loot.' },
  { id: 'pouch', name: 'Star Pouch', lore: 'Starsilk Pouch', price: 6, r: 'R', cat: 'raider', use: 'passive', icon: '👝', desc: 'Automatic: one looted star can’t be taken by a catch, the Unicorn, a Dog or Prison.' },
  { id: 'unicorn', name: 'Unicorn', lore: 'Moonmane', price: 22, r: 'L', cat: 'raider', use: 'play', target: 'raider', icon: '🦄', desc: 'Doubles your roll. Your Defender takes everything a raider holds without sharing a space and sends them to the Gate.' },
  { id: 'charm', name: 'Lucky Charm', lore: "Saint's Charm", price: 6, r: 'L', cat: 'raider', use: 'passive', icon: '🍀', desc: 'Automatic: if you hit the hidden mine, you’re locked only 1 turn and keep your loot.' },
  { id: 'smoke', name: 'Smoke Bomb', lore: 'Ashcloud Vial', price: 8, r: 'U', cat: 'raider', use: 'play', icon: '💨', desc: 'Teleports your raider to the Gate of its current home with all its loot.' },
  { id: 'jailbreak', name: 'Jail Break', lore: 'Oubliette Pick', price: 3, r: 'C', cat: 'raider', use: 'play', icon: '🗝️', desc: 'Escape Prison at once, with no bail.' },
  { id: 'stomach', name: 'Iron Stomach', lore: 'Ironbelly Charm', price: 4, r: 'C', cat: 'raider', use: 'passive', icon: '💪', desc: 'Automatic: immune to the next Poison tile you land on.' },
  { id: 'ghost', name: 'Ghost Walk', lore: 'Wraithstep', price: 10, r: 'R', cat: 'raider', use: 'play', icon: '👻', desc: 'Ignore every trap for 3 moves.' },
  { id: 'skeleton', name: 'Skeleton Key', lore: 'Skeleton Key', price: 4, r: 'R', cat: 'raider', use: 'passive', icon: '🔑', desc: 'Automatic: opens a Vault guarded by a Vault Protector.' },
  { id: 'recall', name: 'Recall Horn', lore: 'Homecoming Horn', price: 6, r: 'U', cat: 'raider', use: 'play', icon: '📯', desc: 'Your Traveller appears inside your own ring, even mid-raid, and acts as a second defender.' },

  // ---- Dice and movement ----
  { id: 'custom', name: 'Custom Dice', lore: 'Fate Die', price: 8, r: 'U', cat: 'dice', use: 'play', icon: '🎯', desc: 'You choose your roll, 1 to 6.' },
  { id: 'double', name: 'Double Dice', lore: 'Twin Fates', price: 3, r: 'C', cat: 'dice', use: 'play', icon: '🎲', desc: 'Your roll counts double.' },
  { id: 'reverse', name: 'Reverse Dice', lore: 'Backwind Die', price: 3, r: 'C', cat: 'dice', use: 'play', target: 'selfOrEnemy', icon: '🔄', desc: 'On you or an enemy: the next roll moves the token backwards.' },
  { id: 'cursed', name: 'Cursed Dice', lore: 'Hexed Die', price: 3, r: 'C', cat: 'dice', use: 'play', target: 'selfOrEnemy', icon: '🧿', desc: 'On you or an enemy: the next roll can only be 1, 2 or 3.' },
  { id: 'supercursed', name: 'Super Cursed Dice', lore: 'Plague of Hexes', price: 6, r: 'R', cat: 'dice', use: 'play', icon: '🕸️', desc: 'Every enemy: their next roll can only be 1, 2 or 3.' },
  { id: 'warp', name: 'Warp Pipe', lore: 'Waystone', price: 3, r: 'C', cat: 'dice', use: 'play', icon: '🪨', desc: 'Takes your Traveller to a random main-board space.' },
  { id: 'shophop', name: 'Shop Hop', lore: 'Market Wind', price: 4, r: 'C', cat: 'dice', use: 'play', icon: '🍃', desc: 'Teleports your Traveller to a random Bank/Shop.' },
  { id: 'mirror', name: 'Mirror', lore: 'Looking-Glass', price: 5, r: 'U', cat: 'dice', use: 'play', target: 'enemy', icon: '🪞', desc: 'Swap places with any Traveller on the main board.' },
  { id: 'advantage', name: 'Advantage Dice', lore: "Seer's Die", price: 4, r: 'C', cat: 'dice', use: 'play', icon: '🔮', desc: 'Roll twice and keep the better roll.' },
  { id: 'snail', name: 'Snail', lore: 'Leaden Boots', price: 3, r: 'C', cat: 'dice', use: 'play', target: 'enemy', icon: '🐌', desc: 'The target’s next roll is halved, never below 1.' },
  { id: 'ice', name: 'Ice Block', lore: 'Frost Shackle', price: 5, r: 'U', cat: 'dice', use: 'play', target: 'enemy', icon: '🧊', desc: 'The target Traveller can’t move for 2 of its owner’s turns.' },

  // ---- Money and shop ----
  { id: 'deposit', name: 'Bank Deposit', lore: 'Courier Raven', price: 5, r: 'C', cat: 'money', use: 'play', icon: '🐦‍⬛', desc: 'Deposits everything you hold on hand, wherever you are.' },
  { id: 'gold', name: 'Gold Card', lore: 'Oracle Card', price: 8, r: 'U', cat: 'money', use: 'play', icon: '🃏', desc: 'd10: 1-3 gives 5 coins, 4-6 gives 8, 7-9 gives 12, 10 gives a star.' },
  { id: 'starsale', name: 'Star Sale', lore: 'Comet Sale', price: 8, r: 'R', cat: 'money', use: 'passive', icon: '☄️', desc: 'Automatic: halves the star price for one purchase.' },
  { id: 'bulk', name: 'Bulk Buy', lore: "Merchant's Writ", price: 10, r: 'R', cat: 'money', use: 'passive', icon: '📜', desc: 'Automatic: buy several stars in one shop visit.' },
  { id: 'itembag', name: 'Item Bag', lore: "Pedlar's Pack", price: 5, r: 'R', cat: 'money', use: 'play', icon: '🎒', desc: 'Gives you a random item, most likely a common one.' },
  { id: 'coupon', name: 'Coupon', lore: 'Guild Voucher', price: 2, r: 'C', cat: 'money', use: 'passive', icon: '🎟️', desc: 'Automatic: your next item purchase is half price.' },
  { id: 'interest', name: 'Interest Note', lore: "Usurer's Note", price: 3, r: 'C', cat: 'money', use: 'passive', icon: '📈', desc: 'Automatic: your next deposit earns 25% extra, at least 2 coins.' },
  { id: 'masterkey', name: 'Master Key', lore: 'Eclipse Pass', price: 3, r: 'C', cat: 'money', use: 'passive', icon: '🗝', desc: 'Automatic: ignore a Shutdown once.' },
  { id: 'chain', name: 'Chain Wallet', lore: 'Ironclasp Purse', price: 3, r: 'C', cat: 'money', use: 'play', icon: '⛓', desc: 'Your on-hand coins are safe from Red spaces for 3 turns.' },
  { id: 'robin', name: 'Robin Hood', lore: "Outlaw's Share", price: 4, r: 'U', cat: 'money', use: 'play', icon: '🏹', desc: 'Take 3 coins from the player with the most stars.' },
  { id: 'swap', name: 'Swap Wallets', lore: "Trickster's Switch", price: 6, r: 'R', cat: 'money', use: 'play', target: 'enemy', icon: '🔀', desc: 'Swap your on-hand coins with any Traveller.' },

  // ---- Chaos and social ----
  { id: 'thief', name: 'Thief', lore: 'Cutpurse', price: 2, r: 'C', cat: 'chaos', use: 'play', icon: '🦹', desc: 'For one round: steal 1 coin from every Traveller you pass.' },
  { id: 'itemthief', name: 'Item Thief', lore: 'Magpie', price: 3, r: 'C', cat: 'chaos', use: 'play', icon: '🐦', desc: 'For one round: steal 1 random item from every Traveller you pass.' },
  { id: 'starthief', name: 'Star Thief', lore: 'Skyfisher', price: 6, r: 'R', cat: 'chaos', use: 'play', icon: '🎣', desc: 'For one round: steal 1 carried star from every Traveller you pass.' },
  { id: 'plunder', name: 'Plunder Chest', lore: 'Plunder Chest', price: 5, r: 'U', cat: 'chaos', use: 'play', target: 'enemy', icon: '💼', desc: 'Steal a random item from an opponent you choose.' },
  { id: 'callankar', name: 'Call Ankar', lore: "Ankar's Summons", price: 5, r: 'U', cat: 'chaos', use: 'play', icon: '📣', desc: 'Calls the Ankar to the space 6 behind you.' },
  { id: 'repel', name: 'Ankar Repellent', lore: 'Ankar Sigil', price: 3, r: 'C', cat: 'chaos', use: 'play', icon: '🧿', desc: 'The Ankar ignores you for 3 turns.' },
  { id: 'leash', name: 'Ankar Leash', lore: "Ankar's Leash", price: 6, r: 'U', cat: 'chaos', use: 'play', icon: '🪢', desc: 'Move the Ankar up to 6 spaces either way.' },
  { id: 'decoy', name: 'Decoy Star', lore: 'Lure Star', price: 5, r: 'U', cat: 'chaos', use: 'passive', icon: '⭐', desc: 'Automatic: if the Ankar would take your coins, it takes this instead.' },
  { id: 'bounty', name: 'Bounty Poster', lore: 'Bounty Poster', price: 5, r: 'U', cat: 'chaos', use: 'play', target: 'enemy', icon: '📃', desc: 'Marks a thief. Any Traveller who lands on that raider takes its loot back to its owners.' },
];
// ---- Starter board (beginner) items: few, simple, self-explanatory ----
const SIMPLE_ITEMS = [
  { id: 'sdouble', name: 'Double Dice', lore: 'Double Dice', price: 5, cat: 'simple', simple: true, use: 'play', icon: '🎲', desc: 'Your roll this turn counts double!' },
  { id: 'smagic', name: 'Magic Die', lore: 'Magic Die', price: 6, cat: 'simple', simple: true, use: 'play', icon: '🎯', desc: 'Choose your roll this turn (1 to 6).' },
  { id: 'sdog', name: 'Guard Dog', lore: 'Guard Dog', price: 5, cat: 'simple', simple: true, use: 'passive', guard: true, icon: '🐕', desc: 'Keep it, then INSTALL it when you like — guards your Hold for 2 rounds after installing: the next player who sneaks in gets chased off and pays you 5 coins.' },
  { id: 'smagnet', name: 'Coin Magnet', lore: 'Coin Magnet', price: 5, cat: 'simple', simple: true, use: 'play', icon: '🧲', desc: 'Pull 5 coins from the richest other player.' },
  { id: 'ssnail', name: 'Snail', lore: 'Snail', price: 4, cat: 'simple', simple: true, use: 'play', target: 'enemy', icon: '🐌', desc: 'Pick a player: their next roll is cut in half.' },
  { id: 'swind', name: 'Shop Wind', lore: 'Shop Wind', price: 4, cat: 'simple', simple: true, use: 'play', icon: '💨', desc: 'Whoosh! Fly straight to the next Counting House and shop there.' },
  { id: 'speel', name: 'Banana Peel', lore: 'Banana Peel', price: 4, cat: 'simple', simple: true, use: 'passive', guard: true, icon: '🍌', desc: 'Keep it, then INSTALL it when you like — guards your Hold for 2 rounds after installing: the next player who sneaks in slips and slides back 5 spaces with nothing.' },
  { id: 'slock', name: 'Star Lock', lore: 'Star Lock', price: 6, cat: 'simple', simple: true, use: 'passive', guard: true, icon: '🔒', desc: 'Keep it, then INSTALL it when you like — guards your Hold for 2 rounds after installing: the next raider who would steal one of your stars gets nothing at all.' },
  { id: 'sbell', name: 'Alarm Bell', lore: 'Alarm Bell', price: 5, cat: 'simple', simple: true, use: 'passive', guard: true, icon: '🔔', desc: 'Keep it, then INSTALL it when you like — guards your Hold for 2 rounds after installing: the next sneak is caught red-handed — no wheel spin — and pays you 5 coins.' },
  { id: 'sshield', name: 'Bubble Shield', lore: 'Bubble Shield', price: 5, cat: 'simple', simple: true, use: 'passive', guard: true, icon: '🫧', desc: 'Keep it, then INSTALL it when you like — for 2 rounds after installing: nobody can punch your coins away and red spaces cannot hurt you.' },
  { id: 'sice', name: 'Ice Block', lore: 'Ice Block', price: 5, cat: 'simple', simple: true, use: 'play', target: 'enemy', icon: '🧊', desc: 'Freeze a player: they skip their next move.' },
  { id: 'smirror', name: 'Mirror Swap', lore: 'Mirror Swap', price: 4, cat: 'simple', simple: true, use: 'play', target: 'enemy', icon: '🪞', desc: 'Swap places with any player on the Crossing.' },
  { id: 'swarp', name: 'Warp Stone', lore: 'Warp Stone', price: 3, cat: 'simple', simple: true, use: 'play', icon: '🌀', desc: 'Whoosh to a random space and land there.' },
  { id: 'sreverse', name: 'Reverse Dice', lore: 'Reverse Dice', price: 3, cat: 'simple', simple: true, use: 'play', target: 'selfOrEnemy', icon: '🔄', desc: "Pick a player — or yourself: that next roll walks backwards (handy to get back to a shop)." },
  { id: 'sthief', name: 'Pickpocket', lore: 'Pickpocket', price: 4, cat: 'simple', simple: true, use: 'play', target: 'enemy', icon: '🦹', desc: 'Sneak up to 5 coins out of a player\'s pocket.' },
  { id: 'sshade', name: 'Shade', lore: 'Shade', price: 14, cat: 'simple', simple: true, use: 'install', icon: '🌫️', desc: 'Install it on your Hold whenever you like: a permanent shadowy veil. Rivals can no longer see which guards (dog, alarm, peel…) or items you have — they sneak in blind!' },
  { id: 'sbox', name: 'Lucky Star Box', lore: 'Lucky Star Box', price: 6, cat: 'simple', simple: true, use: 'play', icon: '🎁', desc: 'Open it: 1 in 3 chance of a free star, otherwise 3 coins.' },
];
ITEMS.push(...SIMPLE_ITEMS);
const ITEM = {};
ITEMS.forEach(it => { ITEM[it.id] = it; });

const HAND_ITEMS = ITEMS.filter(i => i.use && !i.simple);
const DEFENSES = ITEMS.filter(i => i.cat === 'defense');
const HAND_LIMIT = 4;

function itemLabel(id) {
  const it = ITEM[id];
  return it.lore !== it.name ? `${it.lore} (${it.name})` : it.name;
}

// time of day over a game (see Game.tod): each phase has one small rule on the blue and red spaces
const TOD = {
  morning: { icon: '🌅', name: 'Morning', rule: 'Early bird — blue spaces pay +1 coin.' },
  day: { icon: '☀️', name: 'Midday', rule: 'A calm, sunny day — no special rule.' },
  golden: { icon: '🌇', name: 'Golden Hour', rule: 'Warm and mellow — red spaces take 1 coin less.' },
  dusk: { icon: '🌙', name: 'Nightfall', rule: 'A wild night — blue spaces pay +1, but red spaces take +1.' },
};
