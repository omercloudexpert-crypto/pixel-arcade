// GameLoader - Maps game IDs to their components
import React, { lazy, Suspense } from 'react';

// Core games
const SnakeGame = lazy(() => import('./SnakeGame'));
const TetrisGame = lazy(() => import('./TetrisGame'));
const BreakoutGame = lazy(() => import('./BreakoutGame'));
const PongGame = lazy(() => import('./PongGame'));
const SpaceShooterGame = lazy(() => import('./SpaceShooterGame'));
const FlappyGame = lazy(() => import('./FlappyGame'));
const MemoryGame = lazy(() => import('./MemoryGame'));
const MinesweeperGame = lazy(() => import('./MinesweeperGame'));
const Game2048 = lazy(() => import('./Game2048'));
const WhackAMoleGame = lazy(() => import('./WhackAMoleGame'));
const TicTacToeGame = lazy(() => import('./TicTacToeGame'));
const ConnectFourGame = lazy(() => import('./ConnectFourGame'));
const SimonSaysGame = lazy(() => import('./SimonSaysGame'));
const ColorMatchGame = lazy(() => import('./ColorMatchGame'));
const ReactionTestGame = lazy(() => import('./ReactionTestGame'));
const AsteroidsGame = lazy(() => import('./AsteroidsGame'));
const BalloonPopGame = lazy(() => import('./BalloonPopGame'));
const SlidingPuzzleGame = lazy(() => import('./SlidingPuzzleGame'));
const MathQuizGame = lazy(() => import('./MathQuizGame'));
const TypingGame = lazy(() => import('./TypingGame'));
const RunnerGame = lazy(() => import('./RunnerGame'));
const HangmanGame = lazy(() => import('./HangmanGame'));
const DoodleJumpGame = lazy(() => import('./DoodleJumpGame'));
const MazeGame = lazy(() => import('./MazeGame'));

// CanvasGameFactory games
const HelicopterGame = lazy(() => import('./CanvasGameFactory').then(m => ({ default: m.HelicopterGame })));
const FrogCrossingGame = lazy(() => import('./CanvasGameFactory').then(m => ({ default: m.FrogCrossingGame })));
const GravitySwitchGame = lazy(() => import('./CanvasGameFactory').then(m => ({ default: m.GravitySwitchGame })));
const OrbitalDodgeGame = lazy(() => import('./CanvasGameFactory').then(m => ({ default: m.OrbitalDodgeGame })));
const AlienInvadersGame = lazy(() => import('./CanvasGameFactory').then(m => ({ default: m.AlienInvadersGame })));
const CannonShooterGame = lazy(() => import('./CanvasGameFactory').then(m => ({ default: m.CannonShooterGame })));
const CoinCollectorGame = lazy(() => import('./CanvasGameFactory').then(m => ({ default: m.CoinCollectorGame })));
const TankBattleGame = lazy(() => import('./CanvasGameFactory').then(m => ({ default: m.TankBattleGame })));
const PenguinSlideGame = lazy(() => import('./CanvasGameFactory').then(m => ({ default: m.PenguinSlideGame })));
const NinjaRunnerGame = lazy(() => import('./CanvasGameFactory').then(m => ({ default: m.NinjaRunnerGame })));

// MoreGames1 - Pac-Man, Pinball, Sports, Cookie Clicker
const PacManGame = lazy(() => import('./MoreGames1').then(m => ({ default: m.PacManGame })));
const PinballGame = lazy(() => import('./MoreGames1').then(m => ({ default: m.PinballGame })));
const BasketballGame = lazy(() => import('./MoreGames1').then(m => ({ default: m.BasketballGame })));
const GolfGame = lazy(() => import('./MoreGames1').then(m => ({ default: m.GolfGame })));
const ArcheryGame = lazy(() => import('./MoreGames1').then(m => ({ default: m.ArcheryGame })));
const CookieClickerGame = lazy(() => import('./MoreGames1').then(m => ({ default: m.CookieClickerGame })));

// MoreGames2 - Racing, Sudoku, Dice, Blackjack, Word Search, Bubble Shooter
const RacingGame = lazy(() => import('./MoreGames2').then(m => ({ default: m.RacingGame })));
const SudokuGame = lazy(() => import('./MoreGames2').then(m => ({ default: m.SudokuGame })));
const DiceGame = lazy(() => import('./MoreGames2').then(m => ({ default: m.DiceGame })));
const BlackjackGame = lazy(() => import('./MoreGames2').then(m => ({ default: m.BlackjackGame })));
const WordSearchGame = lazy(() => import('./MoreGames2').then(m => ({ default: m.WordSearchGame })));
const BubbleShooterGame = lazy(() => import('./MoreGames2').then(m => ({ default: m.BubbleShooterGame })));

// Utility Apps
const PasswordGeneratorApp = lazy(() => import('./UtilityApps').then(m => ({ default: m.PasswordGeneratorApp })));
const StopwatchApp = lazy(() => import('./UtilityApps').then(m => ({ default: m.StopwatchApp })));
const CalculatorApp = lazy(() => import('./UtilityApps').then(m => ({ default: m.CalculatorApp })));
const ColorPickerApp = lazy(() => import('./UtilityApps').then(m => ({ default: m.ColorPickerApp })));
const NotesApp = lazy(() => import('./UtilityApps').then(m => ({ default: m.NotesApp })));

const GAME_MAP: Record<string, React.LazyExoticComponent<React.ComponentType<{ onBack: () => void }>>> = {
  // Core
  snake: SnakeGame,
  tetris: TetrisGame,
  breakout: BreakoutGame,
  pong: PongGame,
  spaceshooter: SpaceShooterGame,
  flappy: FlappyGame,
  memory: MemoryGame,
  minesweeper: MinesweeperGame,
  game2048: Game2048,
  whackamole: WhackAMoleGame,
  tictactoe: TicTacToeGame,
  connectfour: ConnectFourGame,
  simonsays: SimonSaysGame,
  colorswitch: ColorMatchGame,
  reactiontest: ReactionTestGame,
  asteroids: AsteroidsGame,
  balloonpop: BalloonPopGame,
  slidingpuzzle: SlidingPuzzleGame,
  mathquiz: MathQuizGame,
  typing: TypingGame,
  runner: RunnerGame,
  hangman: HangmanGame,
  doodlejump: DoodleJumpGame,
  maze: MazeGame,
  // CanvasGameFactory
  helicopter: HelicopterGame,
  frogcrossing: FrogCrossingGame,
  gravityswitch: GravitySwitchGame,
  orbitaldodge: OrbitalDodgeGame,
  alieninvaders: AlienInvadersGame,
  cannonshooter: CannonShooterGame,
  coincollector: CoinCollectorGame,
  tankbattle: TankBattleGame,
  penguinslide: PenguinSlideGame,
  ninjarunner: NinjaRunnerGame,
  // MoreGames1
  pacman: PacManGame,
  pinball: PinballGame,
  basketball: BasketballGame,
  golf: GolfGame,
  archery: ArcheryGame,
  cookieclicker: CookieClickerGame,
  // MoreGames2
  racing: RacingGame,
  sudoku: SudokuGame,
  dicegame: DiceGame,
  blackjack: BlackjackGame,
  wordsearch: WordSearchGame,
  bubbleshooter: BubbleShooterGame,
  // Utility Apps
  passwordgen: PasswordGeneratorApp,
  stopwatch: StopwatchApp,
  calculator: CalculatorApp,
  colorpicker: ColorPickerApp,
  notes: NotesApp,
};

interface GameLoaderProps {
  gameId: string;
  onBack: () => void;
}

export default function GameLoader({ gameId, onBack }: GameLoaderProps) {
  const GameComponent = GAME_MAP[gameId];

  if (!GameComponent) {
    return (
      <div className="game-container flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="text-7xl mb-6 animate-float">🎮</div>
        <h2 className="text-3xl font-black mb-2 gradient-text">Coming Soon!</h2>
        <p className="text-slate-400 mb-6 text-center max-w-xs">This game is being crafted with love and will be available soon.</p>
        <button onClick={onBack}
          className="px-8 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 font-bold text-lg transition-all transform hover:scale-105 shadow-lg shadow-indigo-500/25">
          ← Back to Arcade
        </button>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="game-container flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin" />
          </div>
          <p className="text-slate-400 animate-pulse">Loading game...</p>
        </div>
      </div>
    }>
      <GameComponent onBack={onBack} />
    </Suspense>
  );
}
