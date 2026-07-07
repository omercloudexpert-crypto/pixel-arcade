// Game Registry - Massive collection of browser games and apps
import { GameConfig } from '../types';

export const gameRegistry: GameConfig[] = [
  // ===== ARCADE CLASSICS =====
  { id: 'snake', title: 'Snake', description: 'Eat food to grow longer without hitting walls or yourself.', category: 'arcade', icon: '🐍', color: 'from-green-500 to-emerald-700', instructions: 'Guide the snake to eat food. Each food makes you longer!', controls: { keyboard: ['Arrow keys or WASD to move'], touch: ['Swipe to turn'] } },
  { id: 'pacman', title: 'Pac-Man', description: 'Eat all dots while avoiding ghosts in this maze classic!', category: 'arcade', icon: '👻', color: 'from-yellow-400 to-amber-600', instructions: 'Eat dots, grab power pellets to eat ghosts!', controls: { keyboard: ['Arrow keys to move'], touch: ['Swipe to turn'] } },
  { id: 'breakout', title: 'Brick Breaker', description: 'Smash bricks with a bouncing ball. Clear all bricks!', category: 'arcade', icon: '🧱', color: 'from-red-500 to-orange-600', instructions: 'Move the paddle to bounce the ball and break bricks.', controls: { keyboard: ['← → to move paddle', 'Space to launch'], touch: ['Drag to move', 'Tap to launch'] } },
  { id: 'pong', title: 'Pong', description: 'The original video game. Play against the computer!', category: 'arcade', icon: '🏓', color: 'from-gray-500 to-gray-700', instructions: 'Move your paddle to hit the ball past the opponent.', controls: { keyboard: ['↑ ↓ or W/S to move'], touch: ['Drag to move paddle'] } },
  { id: 'asteroids', title: 'Asteroids', description: 'Navigate through an asteroid field. Shoot rocks and survive!', category: 'arcade', icon: '☄️', color: 'from-gray-600 to-slate-800', instructions: 'Thrust, rotate, and shoot asteroids.', controls: { keyboard: ['← → rotate', '↑ thrust', 'Space shoot'], touch: ['Buttons on screen'] } },
  { id: 'flappy', title: 'Flappy Wings', description: 'Tap to fly through gaps between pipes. Addictive!', category: 'arcade', icon: '🐦', color: 'from-yellow-400 to-green-500', instructions: 'Tap to flap. Navigate through pipe gaps!', controls: { keyboard: ['Space or ↑ to flap'], touch: ['Tap anywhere'] } },
  { id: 'doodlejump', title: 'Platform Jump', description: 'Jump from platform to platform and reach the sky!', category: 'arcade', icon: '⬆️', color: 'from-lime-500 to-green-600', instructions: 'Tilt or arrows to land on platforms.', controls: { keyboard: ['← → to move'], touch: ['Tap sides or tilt'] } },
  { id: 'runner', title: 'Endless Runner', description: 'Run, jump, and dodge obstacles endlessly!', category: 'arcade', icon: '🏃', color: 'from-orange-500 to-red-600', instructions: 'Jump over obstacles. How far can you run?', controls: { keyboard: ['Space/↑ to jump', '↓ to duck'], touch: ['Tap to jump'] } },
  { id: 'helicopter', title: 'Helicopter', description: 'Navigate through a cave without crashing!', category: 'arcade', icon: '🚁', color: 'from-sky-500 to-blue-700', instructions: 'Hold to fly up, release to descend. Avoid walls!', controls: { keyboard: ['Hold Space to ascend'], touch: ['Hold screen to ascend'] } },
  { id: 'ninjarunner', title: 'Ninja Runner', description: 'Run as a ninja, throw shurikens, avoid spikes!', category: 'arcade', icon: '🥷', color: 'from-slate-700 to-red-900', instructions: 'Jump and throw shurikens to destroy obstacles.', controls: { keyboard: ['Space jump', 'Z to throw'], touch: ['Tap to jump'] } },
  { id: 'penguinslide', title: 'Penguin Slide', description: 'Slide through icy lanes, dodge rocks, collect fish!', category: 'arcade', icon: '🐧', color: 'from-cyan-300 to-blue-500', instructions: 'Switch lanes to avoid rocks and collect fish.', controls: { keyboard: ['↑ ↓ to switch lanes'], touch: ['Swipe up/down'] } },
  { id: 'pinball', title: 'Pinball', description: 'Classic pinball action! Hit bumpers, score big!', category: 'arcade', icon: '🎱', color: 'from-purple-600 to-indigo-800', instructions: 'Use flippers to keep the ball in play and hit targets.', controls: { keyboard: ['← Left flipper', '→ Right flipper'], touch: ['Tap sides for flippers'] } },

  // ===== ACTION =====
  { id: 'spaceshooter', title: 'Space Shooter', description: 'Defend Earth from waves of alien invaders!', category: 'action', icon: '🚀', color: 'from-blue-600 to-purple-800', instructions: 'Shoot enemies, dodge bullets, survive!', controls: { keyboard: ['← → move', 'Space shoot'], touch: ['Drag to move, auto-shoot'] } },
  { id: 'alieninvaders', title: 'Alien Invaders', description: 'Classic space invaders! Shoot the alien fleet!', category: 'action', icon: '👾', color: 'from-green-600 to-emerald-900', instructions: 'Move and shoot to destroy the alien formation.', controls: { keyboard: ['← → move', 'Space shoot'], touch: ['Drag + auto-shoot'] } },
  { id: 'tankbattle', title: 'Tank Battle', description: 'Command a tank and destroy enemy forces!', category: 'action', icon: '🔫', color: 'from-amber-700 to-stone-800', instructions: 'Drive your tank, aim, and fire at enemies.', controls: { keyboard: ['WASD move', 'Space shoot'], touch: ['Joystick controls'] } },
  { id: 'cannonshooter', title: 'Cannon Shooter', description: 'Aim your cannon and hit all targets!', category: 'action', icon: '💥', color: 'from-orange-600 to-red-800', instructions: 'Aim angle and shoot to hit targets.', controls: { keyboard: ['↑↓ aim', 'Space fire'], touch: ['Touch to aim + fire'] } },

  // ===== PUZZLE =====
  { id: 'tetris', title: 'Block Puzzle', description: 'Stack falling blocks to clear lines. Timeless!', category: 'puzzle', icon: '🧱', color: 'from-purple-500 to-indigo-700', instructions: 'Rotate and place blocks to clear lines.', controls: { keyboard: ['← → move', '↑ rotate', 'Space hard drop'], touch: ['Tap to rotate, swipe to move'] } },
  { id: 'game2048', title: '2048', description: 'Slide tiles to combine numbers. Reach 2048!', category: 'puzzle', icon: '🔢', color: 'from-amber-500 to-orange-600', instructions: 'Slide tiles. Same numbers merge!', controls: { keyboard: ['Arrow keys to slide'], touch: ['Swipe any direction'] } },
  { id: 'minesweeper', title: 'Minesweeper', description: 'Uncover squares while avoiding hidden mines!', category: 'puzzle', icon: '💣', color: 'from-slate-500 to-zinc-700', instructions: 'Click to reveal. Right-click to flag mines.', controls: { keyboard: ['Arrow keys + Enter'], touch: ['Tap reveal', 'Long-press flag'] } },
  { id: 'memory', title: 'Memory Match', description: 'Flip cards to find matching pairs!', category: 'puzzle', icon: '🧠', color: 'from-pink-500 to-rose-600', instructions: 'Find all matching pairs in fewest moves!', controls: { keyboard: ['Arrow keys + Enter'], touch: ['Tap cards'] } },
  { id: 'slidingpuzzle', title: 'Sliding Puzzle', description: 'Slide numbered tiles into order!', category: 'puzzle', icon: '🧩', color: 'from-indigo-500 to-blue-700', instructions: 'Slide tiles to arrange 1-15 in order.', controls: { keyboard: ['Arrow keys'], touch: ['Tap adjacent tile'] } },
  { id: 'simonsays', title: 'Simon Says', description: 'Remember and repeat the color sequence!', category: 'puzzle', icon: '🎵', color: 'from-violet-500 to-purple-700', instructions: 'Watch the sequence, then repeat it.', controls: { keyboard: ['1-4 for colors'], touch: ['Tap colored buttons'] } },
  { id: 'maze', title: 'Maze Escape', description: 'Navigate randomly generated mazes!', category: 'puzzle', icon: '🏰', color: 'from-emerald-600 to-cyan-700', instructions: 'Find the exit. Collect gems for bonus!', controls: { keyboard: ['Arrow keys or WASD'], touch: ['Swipe to move'] } },
  { id: 'sudoku', title: 'Sudoku', description: 'Fill the 9x9 grid with numbers 1-9!', category: 'puzzle', icon: '9️⃣', color: 'from-blue-500 to-indigo-600', instructions: 'Each row, column, and box must have 1-9.', controls: { keyboard: ['Click cell, type number'], touch: ['Tap cell, tap number'] } },
  { id: 'wordsearch', title: 'Word Search', description: 'Find hidden words in the letter grid!', category: 'puzzle', icon: '🔤', color: 'from-teal-500 to-cyan-600', instructions: 'Click letters in sequence to find words.', controls: { keyboard: ['Click letters'], touch: ['Tap letters'] } },
  { id: 'bubbleshooter', title: 'Bubble Shooter', description: 'Match 3 or more bubbles to pop them!', category: 'puzzle', icon: '🔵', color: 'from-cyan-500 to-blue-600', instructions: 'Aim and shoot bubbles. Match colors to pop!', controls: { keyboard: ['Mouse aim', 'Click to shoot'], touch: ['Tap to shoot'] } },

  // ===== STRATEGY =====
  { id: 'tictactoe', title: 'Tic Tac Toe', description: 'Classic X and O game vs smart AI.', category: 'strategy', icon: '⭕', color: 'from-cyan-500 to-blue-600', instructions: 'Get three in a row to win!', controls: { keyboard: ['Click to place'], touch: ['Tap to place'] } },
  { id: 'connectfour', title: 'Connect Four', description: 'Drop discs to connect four in a row!', category: 'strategy', icon: '🔴', color: 'from-red-500 to-yellow-500', instructions: 'Drop discs. Connect 4 to win!', controls: { keyboard: ['← → + Enter'], touch: ['Tap column'] } },

  // ===== SPORTS =====
  { id: 'basketball', title: 'Basketball', description: 'Shoot hoops! Time your shot perfectly!', category: 'sports', icon: '🏀', color: 'from-orange-500 to-red-600', instructions: 'Aim and shoot to score baskets.', controls: { keyboard: ['Space to shoot'], touch: ['Tap to shoot'] } },
  { id: 'golf', title: 'Mini Golf', description: 'Putt your way through 9 holes!', category: 'sports', icon: '⛳', color: 'from-green-500 to-emerald-600', instructions: 'Click and drag to aim, release to putt.', controls: { keyboard: ['Mouse aim + click'], touch: ['Drag to aim, release to shoot'] } },
  { id: 'archery', title: 'Archery', description: 'Hit the bullseye! Account for wind!', category: 'sports', icon: '🎯', color: 'from-amber-600 to-orange-700', instructions: 'Click to shoot. Account for wind!', controls: { keyboard: ['Space to shoot'], touch: ['Tap to shoot'] } },
  { id: 'racing', title: 'Street Racing', description: 'Dodge traffic and collect coins!', category: 'sports', icon: '🏎️', color: 'from-red-600 to-gray-800', instructions: 'Switch lanes to avoid cars and grab coins.', controls: { keyboard: ['← → to change lanes'], touch: ['Swipe left/right'] } },

  // ===== CASUAL =====
  { id: 'whackamole', title: 'Whack-a-Mole', description: 'Whack moles before time runs out!', category: 'casual', icon: '🔨', color: 'from-amber-600 to-yellow-800', instructions: 'Click moles as they appear!', controls: { keyboard: ['Click on moles'], touch: ['Tap on moles'] } },
  { id: 'balloonpop', title: 'Balloon Pop', description: 'Pop colorful balloons before they escape!', category: 'casual', icon: '🎈', color: 'from-pink-400 to-red-500', instructions: 'Click balloons to pop them!', controls: { keyboard: ['Click to pop'], touch: ['Tap to pop'] } },
  { id: 'colorswitch', title: 'Color Match', description: 'Match colors at lightning speed!', category: 'casual', icon: '🎨', color: 'from-rose-500 to-pink-600', instructions: 'YES if color matches word, NO otherwise.', controls: { keyboard: ['← No, → Yes'], touch: ['Tap buttons'] } },
  { id: 'reactiontest', title: 'Reaction Test', description: 'How fast are your reflexes?', category: 'casual', icon: '⚡', color: 'from-yellow-500 to-amber-600', instructions: 'Wait for green, then click FAST!', controls: { keyboard: ['Space when green'], touch: ['Tap when green'] } },
  { id: 'typing', title: 'Typing Challenge', description: 'Type falling words before they land!', category: 'casual', icon: '⌨️', color: 'from-teal-500 to-emerald-600', instructions: 'Type the words as they fall!', controls: { keyboard: ['Type words'], touch: ['On-screen keyboard'] } },
  { id: 'mathquiz', title: 'Math Blitz', description: 'Solve math problems against the clock!', category: 'casual', icon: '🧮', color: 'from-emerald-500 to-teal-600', instructions: 'Solve problems. Correct = more time!', controls: { keyboard: ['Type answer + Enter'], touch: ['Number pad'] } },
  { id: 'coincollector', title: 'Coin Collector', description: 'Grab coins, avoid bombs, beat the clock!', category: 'casual', icon: '🪙', color: 'from-yellow-500 to-amber-700', instructions: 'Collect all coins while avoiding bombs.', controls: { keyboard: ['WASD/Arrows to move'], touch: ['Touch to move'] } },
  { id: 'gravityswitch', title: 'Gravity Switch', description: 'Tap to flip gravity and dodge obstacles!', category: 'casual', icon: '🔄', color: 'from-violet-600 to-indigo-800', instructions: 'Tap to switch gravity direction!', controls: { keyboard: ['Space to flip gravity'], touch: ['Tap to flip'] } },
  { id: 'orbitaldodge', title: 'Orbital Dodge', description: 'Orbit a planet and dodge incoming projectiles!', category: 'casual', icon: '🪐', color: 'from-cyan-600 to-blue-900', instructions: 'Tap to change orbit direction. Dodge!', controls: { keyboard: ['Space to reverse orbit'], touch: ['Tap to reverse'] } },
  { id: 'frogcrossing', title: 'Frog Crossing', description: 'Help the frog cross busy roads safely!', category: 'casual', icon: '🐸', color: 'from-green-500 to-teal-700', instructions: 'Hop across lanes of traffic!', controls: { keyboard: ['Arrow keys to hop'], touch: ['Swipe or tap'] } },
  { id: 'cookieclicker', title: 'Cookie Clicker', description: 'Click cookies, buy upgrades, get more cookies!', category: 'casual', icon: '🍪', color: 'from-amber-600 to-yellow-700', instructions: 'Click the cookie! Buy upgrades for auto-clicks!', controls: { keyboard: ['Click cookie'], touch: ['Tap cookie'] } },

  // ===== CARD GAMES =====
  { id: 'blackjack', title: 'Blackjack', description: 'Beat the dealer! Get 21 without going over!', category: 'card', icon: '🃏', color: 'from-green-700 to-emerald-900', instructions: 'Hit or Stand. Beat dealer without busting!', controls: { keyboard: ['Click buttons'], touch: ['Tap Hit or Stand'] } },
  { id: 'dicegame', title: 'Dice Poker', description: 'Roll dice, hold the best, score big!', category: 'card', icon: '🎲', color: 'from-red-600 to-rose-800', instructions: 'Roll up to 3 times. Hold dice you want to keep.', controls: { keyboard: ['Click to roll/hold'], touch: ['Tap dice to hold'] } },

  // ===== WORD GAMES =====
  { id: 'hangman', title: 'Hangman', description: 'Guess the word before running out of tries!', category: 'word', icon: '📝', color: 'from-stone-500 to-amber-700', instructions: 'Guess letters. 6 wrong = game over!', controls: { keyboard: ['Type letters'], touch: ['Tap letter buttons'] } },

  // ===== UTILITY APPS =====
  { id: 'passwordgen', title: 'Password Generator', description: 'Generate secure passwords instantly!', category: 'tools', icon: '🔐', color: 'from-purple-600 to-pink-600', instructions: 'Customize length and character types. Copy with one click!', controls: { keyboard: ['Click Generate'], touch: ['Tap Generate'] } },
  { id: 'stopwatch', title: 'Stopwatch', description: 'Precision timer with lap functionality!', category: 'tools', icon: '⏱️', color: 'from-blue-500 to-indigo-600', instructions: 'Start, stop, lap, and reset.', controls: { keyboard: ['Click buttons'], touch: ['Tap buttons'] } },
  { id: 'calculator', title: 'Calculator', description: 'Basic calculator for quick math!', category: 'tools', icon: '🔢', color: 'from-slate-600 to-gray-800', instructions: 'Click numbers and operators to calculate.', controls: { keyboard: ['Type numbers or click'], touch: ['Tap buttons'] } },
  { id: 'colorpicker', title: 'Color Picker', description: 'Pick any color and get HEX, RGB, HSL codes!', category: 'tools', icon: '🎨', color: 'from-pink-500 to-purple-600', instructions: 'Adjust sliders, copy color codes.', controls: { keyboard: ['Drag sliders'], touch: ['Drag sliders'] } },
  { id: 'notes', title: 'Quick Notes', description: 'Jot down notes with colorful cards!', category: 'tools', icon: '📝', color: 'from-amber-500 to-yellow-600', instructions: 'Type notes, pick colors, save instantly.', controls: { keyboard: ['Type and click Add'], touch: ['Type and tap Add'] } },
];

export function getGameById(id: string): GameConfig | undefined {
  return gameRegistry.find(g => g.id === id);
}

export function getGamesByCategory(category: string): GameConfig[] {
  if (category === 'all') return gameRegistry;
  return gameRegistry.filter(g => g.category === category);
}

export function getCategories(): string[] {
  const cats = Array.from(new Set(gameRegistry.map(g => g.category)));
  return ['all', ...cats];
}

export function searchGames(query: string): GameConfig[] {
  const q = query.toLowerCase();
  return gameRegistry.filter(g =>
    g.title.toLowerCase().includes(q) ||
    g.description.toLowerCase().includes(q) ||
    g.category.toLowerCase().includes(q)
  );
}

export function getRandomGame(): GameConfig {
  return gameRegistry[Math.floor(Math.random() * gameRegistry.length)];
}
