import { useState, useMemo, useEffect, useRef } from "react";
import Cricket3DGame from "./Cricket3DGame";
import CyberDrift from "./games/CyberDrift";
import { SpaceDefender, FlappyWings, MemoryMatch, Blackjack, WordScramble, Game2048 } from "./games/MiniGames";

// --- Types ---
interface Game {
  id: number;
  title: string;
  description: string;
  category: string;
  emoji: string;
  gradient: string;
  engine: string;
}

// --- Data ---
const categories = [
  { id: "all", label: "All Games", icon: "🎮" },
  { id: "arcade", label: "Arcade", icon: "👾" },
  { id: "action", label: "Action", icon: "⚔️" },
  { id: "puzzle", label: "Puzzle", icon: "🧩" },
  { id: "strategy", label: "Strategy", icon: "♟️" },
  { id: "sports", label: "Sports", icon: "🏆" },
  { id: "casual", label: "Casual", icon: "🎯" },
  { id: "cards", label: "Cards", icon: "🃏" },
  { id: "word", label: "Word", icon: "📝" },
  { id: "tools", label: "Tools", icon: "🔧" },
];

const games: Game[] = [
  { id: -1, title: "CyberDrift", description: "AAA Open World Racing.", category: "sports", emoji: "🏎️", gradient: "from-purple-600 to-blue-800", engine: "cyberdrift" },
  { id: 0, title: "Cricket 3D", description: "Full 3D Cricket experience!", category: "sports", emoji: "🏏", gradient: "from-green-600 to-emerald-800", engine: "cricket" },
  { id: 1, title: "Snake", description: "Eat food to grow longer!", category: "arcade", emoji: "🐍", gradient: "from-green-500 to-emerald-700", engine: "snake" },
  { id: 2, title: "Pac-Man", description: "Eat dots, avoid ghosts!", category: "arcade", emoji: "👻", gradient: "from-yellow-400 to-orange-500", engine: "runner" },
  { id: 3, title: "Brick Breaker", description: "Smash bricks!", category: "arcade", emoji: "🧱", gradient: "from-red-500 to-orange-600", engine: "shooter" },
  { id: 4, title: "Pong", description: "The original video game.", category: "arcade", emoji: "🏓", gradient: "from-gray-600 to-gray-800", engine: "pong" },
  { id: 5, title: "Asteroids", description: "Survive the asteroid field!", category: "arcade", emoji: "☄️", gradient: "from-gray-700 to-slate-900", engine: "shooter" },
  { id: 6, title: "Flappy Wings", description: "Fly through gaps!", category: "arcade", emoji: "🐦", gradient: "from-lime-400 to-green-500", engine: "runner" },
  { id: 7, title: "Platform Jump", description: "Reach the top!", category: "arcade", emoji: "⬆️", gradient: "from-green-400 to-green-600", engine: "runner" },
  { id: 8, title: "Endless Runner", description: "Dodge obstacles endlessly!", category: "arcade", emoji: "🏃", gradient: "from-orange-500 to-red-600", engine: "runner" },
  { id: 9, title: "Helicopter", description: "Navigate the cave!", category: "arcade", emoji: "🚁", gradient: "from-blue-500 to-blue-700", engine: "runner" },
  { id: 10, title: "Ninja Runner", description: "Throw shurikens, avoid traps!", category: "arcade", emoji: "🥷", gradient: "from-gray-800 to-red-900", engine: "runner" },
  { id: 11, title: "Penguin Slide", description: "Slide through icy lanes!", category: "arcade", emoji: "🐧", gradient: "from-cyan-400 to-blue-500", engine: "runner" },
  { id: 12, title: "Pinball", description: "Hit bumpers, score points!", category: "arcade", emoji: "🎱", gradient: "from-purple-600 to-indigo-800", engine: "pong" },
  { id: 13, title: "Space Shooter", description: "Defend Earth!", category: "action", emoji: "🚀", gradient: "from-indigo-600 to-purple-800", engine: "shooter" },
  { id: 14, title: "Alien Invaders", description: "Shoot the aliens!", category: "action", emoji: "👾", gradient: "from-green-600 to-green-800", engine: "shooter" },
  { id: 15, title: "Tank Battle", description: "Destroy enemy forces!", category: "action", emoji: "🔫", gradient: "from-amber-700 to-yellow-900", engine: "shooter" },
  { id: 16, title: "Cannon Shooter", description: "Hit all targets!", category: "action", emoji: "💥", gradient: "from-red-600 to-red-800", engine: "shooter" },
  { id: 17, title: "Block Puzzle", description: "Stack falling blocks!", category: "puzzle", emoji: "🧱", gradient: "from-violet-500 to-purple-700", engine: "puzzle2048" },
  { id: 18, title: "2048", description: "Reach 2048!", category: "puzzle", emoji: "🔢", gradient: "from-orange-400 to-orange-600", engine: "puzzle2048" },
  { id: 19, title: "Minesweeper", description: "Avoid hidden mines!", category: "puzzle", emoji: "💣", gradient: "from-gray-500 to-gray-700", engine: "memory" },
  { id: 20, title: "Memory Match", description: "Find matching pairs!", category: "puzzle", emoji: "🧠", gradient: "from-pink-500 to-rose-600", engine: "memory" },
  { id: 21, title: "Sliding Puzzle", description: "Slide tiles into order!", category: "puzzle", emoji: "🧩", gradient: "from-indigo-500 to-blue-600", engine: "puzzle2048" },
  { id: 22, title: "Simon Says", description: "Repeat the sequence!", category: "puzzle", emoji: "🎵", gradient: "from-purple-500 to-violet-700", engine: "memory" },
  { id: 23, title: "Maze Escape", description: "Navigate the maze!", category: "puzzle", emoji: "🏰", gradient: "from-teal-500 to-emerald-700", engine: "clicker" },
  { id: 24, title: "Sudoku", description: "Fill the 9x9 grid!", category: "puzzle", emoji: "9️⃣", gradient: "from-blue-500 to-indigo-600", engine: "puzzle2048" },
  { id: 25, title: "Word Search", description: "Find hidden words!", category: "puzzle", emoji: "🔤", gradient: "from-cyan-500 to-teal-600", engine: "word" },
  { id: 26, title: "Bubble Shooter", description: "Pop the bubbles!", category: "puzzle", emoji: "🫧", gradient: "from-sky-400 to-blue-600", engine: "shooter" },
  { id: 27, title: "Tic Tac Toe", description: "Classic X and O game!", category: "strategy", emoji: "⭕", gradient: "from-cyan-500 to-blue-600", engine: "tictactoe" },
  { id: 28, title: "Connect Four", description: "Connect four in a row!", category: "strategy", emoji: "🔴", gradient: "from-orange-500 to-yellow-500", engine: "tictactoe" },
  { id: 29, title: "Basketball", description: "Time your shot!", category: "sports", emoji: "🏀", gradient: "from-orange-500 to-red-600", engine: "clicker" },
  { id: 30, title: "Mini Golf", description: "Putt your way through 9 holes!", category: "sports", emoji: "⛳", gradient: "from-green-500 to-green-700", engine: "clicker" },
  { id: 31, title: "Darts", description: "Hit the bullseye!", category: "sports", emoji: "🎯", gradient: "from-red-500 to-orange-600", engine: "clicker" },
  { id: 32, title: "Bowling", description: "Strike down the pins!", category: "sports", emoji: "🎳", gradient: "from-rose-600 to-pink-700", engine: "clicker" },
  { id: 33, title: "Billiards", description: "Sink all balls!", category: "sports", emoji: "🎱", gradient: "from-pink-400 to-rose-600", engine: "pong" },
  { id: 34, title: "Coin Flip", description: "Heads or tails?", category: "casual", emoji: "🪙", gradient: "from-yellow-400 to-yellow-600", engine: "clicker" },
  { id: 35, title: "Dice Roller", description: "Roll a high number!", category: "casual", emoji: "🎲", gradient: "from-amber-500 to-orange-600", engine: "clicker" },
  { id: 36, title: "Spin Wheel", description: "Win prizes!", category: "casual", emoji: "🎡", gradient: "from-pink-500 to-purple-600", engine: "clicker" },
  { id: 37, title: "Blackjack", description: "Beat the dealer to 21!", category: "cards", emoji: "🃏", gradient: "from-green-700 to-green-900", engine: "cards" },
  { id: 38, title: "Solitaire", description: "Classic card sorting!", category: "cards", emoji: "🂡", gradient: "from-red-600 to-red-800", engine: "cards" },
  { id: 39, title: "Hangman", description: "Guess the word!", category: "word", emoji: "📝", gradient: "from-amber-600 to-amber-800", engine: "word" },
  { id: 40, title: "Crossword", description: "Fill the puzzle!", category: "word", emoji: "📰", gradient: "from-yellow-500 to-amber-600", engine: "word" },
  { id: 41, title: "Calculator", description: "Simple calculator tool!", category: "tools", emoji: "🧮", gradient: "from-gray-500 to-gray-700", engine: "clicker" },
  { id: 42, title: "Stopwatch", description: "Time events!", category: "tools", emoji: "⏱️", gradient: "from-blue-600 to-indigo-700", engine: "clicker" },
  { id: 43, title: "Chess", description: "Classic chess vs AI!", category: "strategy", emoji: "♟️", gradient: "from-amber-700 to-amber-900", engine: "tictactoe" },
  { id: 44, title: "Checkers", description: "Capture all pieces!", category: "strategy", emoji: "🔴", gradient: "from-red-700 to-red-900", engine: "tictactoe" },
  { id: 45, title: "Rock Paper Scissors", description: "Classic hand game!", category: "casual", emoji: "✊", gradient: "from-orange-400 to-red-500", engine: "clicker" },
  { id: 46, title: "Trivia Quiz", description: "Test your knowledge!", category: "casual", emoji: "❓", gradient: "from-purple-500 to-indigo-600", engine: "word" },
  { id: 47, title: "Typing Speed", description: "How fast can you type?", category: "tools", emoji: "⌨️", gradient: "from-slate-600 to-slate-800", engine: "word" },
  { id: 48, title: "Color Match", description: "Match colors fast!", category: "casual", emoji: "🎨", gradient: "from-fuchsia-500 to-pink-600", engine: "clicker" },
  { id: 49, title: "Reaction Time", description: "Test your reflexes!", category: "casual", emoji: "⚡", gradient: "from-yellow-400 to-orange-500", engine: "clicker" },
  { id: 50, title: "Poker", description: "Five-card draw poker!", category: "cards", emoji: "🃏", gradient: "from-green-600 to-emerald-800", engine: "cards" },
  { id: 51, title: "Word Scramble", description: "Unscramble letters!", category: "word", emoji: "🔀", gradient: "from-teal-500 to-cyan-700", engine: "word" },
];

// --- Game Components ---

const SnakeGame = ({ onExit }: { onExit: () => void }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const gridSize = 20;
    const tileCount = canvas.width / gridSize;
    let snake = [{ x: 10, y: 10 }];
    let food = { x: 15, y: 15 };
    let dx = 0;
    let dy = 0;
    let gameLoop: NodeJS.Timeout;

    const draw = () => {
      // Background
      ctx.fillStyle = "#111827";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Snake
      ctx.fillStyle = "#10b981";
      snake.forEach((part) => {
        ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize - 2, gridSize - 2);
      });

      // Food
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 2, gridSize - 2);
    };

    const update = () => {
      if (dx === 0 && dy === 0) return; // Wait for start

      const head = { x: snake[0].x + dx, y: snake[0].y + dy };

      // Wall collision
      if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        setGameOver(true);
        return;
      }
      // Self collision
      if (snake.some((part) => part.x === head.x && part.y === head.y)) {
        setGameOver(true);
        return;
      }

      snake.unshift(head);

      // Eat food
      if (head.x === food.x && head.y === food.y) {
        setScore((s) => s + 10);
        food = {
          x: Math.floor(Math.random() * tileCount),
          y: Math.floor(Math.random() * tileCount),
        };
      } else {
        snake.pop();
      }

      draw();
    };

    const handleKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp": if (dy !== 1) { dx = 0; dy = -1; } break;
        case "ArrowDown": if (dy !== -1) { dx = 0; dy = 1; } break;
        case "ArrowLeft": if (dx !== 1) { dx = -1; dy = 0; } break;
        case "ArrowRight": if (dx !== -1) { dx = 1; dy = 0; } break;
      }
    };

    window.addEventListener("keydown", handleKey);
    gameLoop = setInterval(update, 100);
    draw();

    return () => {
      window.removeEventListener("keydown", handleKey);
      clearInterval(gameLoop);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full text-white">
      {gameOver ? (
        <div className="text-center space-y-4">
          <h3 className="text-3xl font-bold text-red-500">Game Over!</h3>
          <p className="text-xl">Score: {score}</p>
          <button onClick={onExit} className="bg-purple-600 hover:bg-purple-500 px-6 py-2 rounded-lg font-bold">Back to Menu</button>
        </div>
      ) : (
        <>
          <div className="mb-4 text-lg font-bold">Score: {score} <span className="text-sm text-gray-400 font-normal ml-2">(Use Arrow Keys)</span></div>
          <canvas ref={canvasRef} width={400} height={400} className="bg-gray-900 border-2 border-gray-700 rounded-lg shadow-xl" />
        </>
      )}
    </div>
  );
};

const PongGame = ({ onExit }: { onExit: () => void }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState({ player: 0, ai: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let ball = { x: canvas.width / 2, y: canvas.height / 2, dx: 4, dy: 4, radius: 8 };
    let playerY = canvas.height / 2 - 40;
    let aiY = canvas.height / 2 - 40;
    const paddleHeight = 80;
    const paddleWidth = 12;
    let animationId: number;

    const draw = () => {
      ctx.fillStyle = "#111827";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Net
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 0);
      ctx.lineTo(canvas.width / 2, canvas.height);
      ctx.strokeStyle = "#374151";
      ctx.stroke();

      // Paddles
      ctx.fillStyle = "#3b82f6";
      ctx.fillRect(10, playerY, paddleWidth, paddleHeight);
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(canvas.width - 22, aiY, paddleWidth, paddleHeight);

      // Ball
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
    };

    const update = () => {
      ball.x += ball.dx;
      ball.y += ball.dy;

      // Wall bounce
      if (ball.y + ball.radius > canvas.height || ball.y - ball.radius < 0) {
        ball.dy *= -1;
      }

      // Paddle collision
      if (ball.x - ball.radius < 10 + paddleWidth && ball.y > playerY && ball.y < playerY + paddleHeight) {
        ball.dx *= -1;
        ball.x = 10 + paddleWidth + ball.radius;
      }
      if (ball.x + ball.radius > canvas.width - 10 - paddleWidth && ball.y > aiY && ball.y < aiY + paddleHeight) {
        ball.dx *= -1;
        ball.x = canvas.width - 10 - paddleWidth - ball.radius;
      }

      // AI Movement
      const aiCenter = aiY + paddleHeight / 2;
      if (aiCenter < ball.y - 35) aiY += 3;
      else if (aiCenter > ball.y + 35) aiY -= 3;

      // Score
      if (ball.x < 0) {
        setScore(s => ({ ...s, ai: s.ai + 1 }));
        ball.x = canvas.width / 2; ball.y = canvas.height / 2; ball.dx = 4;
      }
      if (ball.x > canvas.width) {
        setScore(s => ({ ...s, player: s.player + 1 }));
        ball.x = canvas.width / 2; ball.y = canvas.height / 2; ball.dx = -4;
      }

      draw();
      animationId = requestAnimationFrame(update);
    };

    const handleMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      playerY = e.clientY - rect.top - paddleHeight / 2;
    };

    canvas.addEventListener("mousemove", handleMouse);
    animationId = requestAnimationFrame(update);

    return () => {
      canvas.removeEventListener("mousemove", handleMouse);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full text-white">
      <div className="mb-4 text-lg font-bold flex gap-8">
        <span className="text-blue-400">Player: {score.player}</span>
        <span className="text-red-400">AI: {score.ai}</span>
      </div>
      <canvas ref={canvasRef} width={600} height={400} className="bg-gray-900 border-2 border-gray-700 rounded-lg shadow-xl cursor-none" />
      <div className="mt-4 flex gap-4">
        <p className="text-sm text-gray-400">Move mouse to control paddle</p>
        <button onClick={onExit} className="text-sm text-purple-400 hover:text-purple-300 font-bold">Exit Game</button>
      </div>
    </div>
  );
};

const TicTacToeGame = ({ onExit }: { onExit: () => void }) => {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const winner = useMemo(() => {
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (let [a, b, c] of lines) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
    }
    return null;
  }, [board]);

  const handleClick = (i: number) => {
    if (board[i] || winner) return;
    const newBoard = [...board];
    newBoard[i] = isXNext ? "X" : "O";
    setBoard(newBoard);
    setIsXNext(!isXNext);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full text-white">
      <h3 className="text-2xl font-bold mb-6">{winner ? `Winner: ${winner}` : board.every(Boolean) ? "Draw!" : `Next Player: ${isXNext ? "X" : "O"}`}</h3>
      <div className="grid grid-cols-3 gap-2 bg-gray-700 p-2 rounded-lg">
        {board.map((cell, i) => (
          <button
            key={i}
            onClick={() => handleClick(i)}
            className="w-20 h-20 bg-gray-800 text-4xl font-bold flex items-center justify-center hover:bg-gray-700 rounded transition-colors"
          >
            <span className={cell === "X" ? "text-blue-400" : "text-red-400"}>{cell}</span>
          </button>
        ))}
      </div>
      <div className="mt-6 flex gap-4">
        <button onClick={() => { setBoard(Array(9).fill(null)); setIsXNext(true); }} className="text-sm text-gray-400 hover:text-white underline">Reset Game</button>
        <button onClick={onExit} className="text-sm text-purple-400 hover:text-purple-300 font-bold">Exit Game</button>
      </div>
    </div>
  );
};

const ClickerGame = ({ game, onExit }: { game: Game; onExit: () => void }) => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [target, setTarget] = useState({ x: 50, y: 50 });
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) {
      setGameOver(true);
      return;
    }
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const hitTarget = () => {
    setScore(s => s + 1);
    setTarget({
      x: Math.random() * 80 + 10, // 10% to 90%
      y: Math.random() * 80 + 10
    });
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full text-white relative overflow-hidden">
      {gameOver ? (
        <div className="text-center space-y-4 z-10">
          <h3 className="text-3xl font-bold text-green-500">Time's Up!</h3>
          <p className="text-xl">Final Score: {score}</p>
          <button onClick={onExit} className="bg-purple-600 hover:bg-purple-500 px-6 py-2 rounded-lg font-bold">Back to Menu</button>
        </div>
      ) : (
        <>
          <div className="absolute top-4 left-0 w-full flex justify-between px-8 text-xl font-bold z-10 pointer-events-none">
            <span>Score: {score}</span>
            <span className={timeLeft < 10 ? "text-red-500" : ""}>Time: {timeLeft}s</span>
          </div>
          <button
            onClick={hitTarget}
            className="absolute w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/50 flex items-center justify-center text-2xl transition-transform active:scale-90 hover:scale-110"
            style={{ left: `${target.x}%`, top: `${target.y}%`, transform: "translate(-50%, -50%)" }}
          >
            {game.emoji}
          </button>
          <p className="absolute bottom-8 text-gray-400 text-sm">Click the {game.emoji} as fast as you can!</p>
        </>
      )}
    </div>
  );
};

// --- Main App ---
export default function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [favorites, setFavorites] = useState<number[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const filteredGames = useMemo(() => {
    return games.filter((game) => {
      const matchesCategory = selectedCategory === "all" || game.category === selectedCategory;
      const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase()) || game.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const toggleFavorite = (id: number) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  };

  const handlePlayClick = () => {
    setIsPlaying(true);
  };

  const handleCloseModal = () => {
    setSelectedGame(null);
    setIsPlaying(false);
  };

  return (
    <div className="min-h-screen w-full bg-gray-950 text-white font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-gray-800 bg-gray-950/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1920px] items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => {setSelectedGame(null); setSelectedCategory('all');}}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg shadow-purple-900/20">
              <span className="text-xl">🎮</span>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-purple-400">PIXEL ARCADE</h1>
              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{games.length} Games</p>
            </div>
          </div>
          <div className="hidden md:flex flex-1 items-center justify-center px-8 max-w-xl">
            <div className="relative w-full group">
              <input
                type="text"
                placeholder="Search games..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-800 bg-gray-900/50 px-4 py-2 pl-10 text-sm text-white placeholder-gray-600 focus:border-purple-500/50 focus:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-purple-400 transition-colors">🔍</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="rounded-lg bg-gray-900 border border-gray-800 p-2 text-sm hover:bg-gray-800 hover:border-gray-700 transition-colors">
              <span>🎲</span>
            </button>
            <button className="rounded-lg bg-gray-900 border border-gray-800 p-2 text-sm hover:bg-gray-800 hover:border-gray-700 transition-colors">
              <span>⭐</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="w-full border-b border-gray-800/50 bg-gradient-to-b from-gray-900/50 to-gray-950 py-12 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-gray-950 to-gray-950 pointer-events-none" />
        <div className="mx-auto max-w-[1920px] px-4 relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-green-500/10 border border-green-500/20 px-3 py-1 mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-xs font-medium text-green-400">{games.length} Games Available — Free & No Ads</span>
          </div>
          <h2 className="mb-4 text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">Play.</span>{" "}
            <span className="text-white">Compete.</span>{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Repeat.</span>
          </h2>
          <p className="mx-auto max-w-2xl text-gray-400 text-lg">
            Instant browser games — no downloads, no signups. Just pure fun.
          </p>
        </div>
      </section>

      {/* Category Filter */}
      <section className="sticky top-[65px] z-30 w-full border-b border-gray-800 bg-gray-950/95 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1920px] gap-2 overflow-x-auto px-4 py-3 scrollbar-hide no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold transition-all ${
                selectedCategory === cat.id
                  ? "border-purple-500/50 bg-purple-500/10 text-purple-300 shadow-[0_0_15px_-3px_rgba(168,85,247,0.3)]"
                  : "border-gray-800 bg-gray-900/50 text-gray-400 hover:border-gray-700 hover:bg-gray-800 hover:text-gray-200"
              }`}
            >
              <span>{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* Game Grid */}
      <main className="w-full px-4 py-8 pb-20">
        <div className="mx-auto grid w-full max-w-[1920px] grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8">
          {filteredGames.map((game) => (
            <div
              key={game.id}
              onClick={() => setSelectedGame(game)}
              className="group relative cursor-pointer overflow-hidden rounded-xl border border-gray-800 bg-gray-900 transition-all hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-900/20 hover:-translate-y-1"
            >
              <div className={`relative flex h-36 items-center justify-center bg-gradient-to-br ${game.gradient} p-4 overflow-hidden`}>
                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                <span className="text-6xl drop-shadow-2xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 filter">
                  {game.emoji}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(game.id); }}
                  className="absolute right-2 top-2 rounded-full bg-black/20 p-1.5 text-xs backdrop-blur-md transition-all hover:bg-black/40 hover:scale-110 border border-white/10"
                >
                  {favorites.includes(game.id) ? "⭐" : "☆"}
                </button>
              </div>
              <div className="p-3 bg-gray-900 relative">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="truncate text-sm font-bold text-white group-hover:text-purple-300 transition-colors">{game.title}</h3>
                </div>
                <p className="truncate text-[11px] text-gray-500 leading-relaxed">{game.description}</p>
                <div className="mt-3 flex items-center gap-2">
                   <span className="text-[10px] px-2 py-0.5 rounded bg-gray-800 text-gray-400 capitalize border border-gray-700/50">
                     {categories.find((c) => c.id === game.category)?.icon} {game.category}
                   </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredGames.length === 0 && (
          <div className="py-32 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center text-4xl mb-4 border border-gray-800">🔍</div>
            <p className="text-xl font-bold text-white">No games found</p>
            <p className="text-sm text-gray-500 mt-2">Try adjusting your search or category filter</p>
            <button onClick={() => {setSearchQuery(""); setSelectedCategory("all");}} className="mt-6 text-purple-400 hover:text-purple-300 text-sm font-medium">Clear filters</button>
          </div>
        )}
      </main>

      {/* Game Modal */}
      {selectedGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={handleCloseModal} />
          <div className="relative w-full max-w-2xl bg-gray-900 rounded-2xl border border-gray-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            
            {/* Close Button */}
            <button 
              onClick={handleCloseModal}
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white/70 hover:text-white transition-all backdrop-blur-md border border-white/10"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            {!isPlaying ? (
              // Details View
              <>
                <div className={`h-48 sm:h-64 w-full bg-gradient-to-br ${selectedGame.gradient} flex items-center justify-center relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
                  <span className="text-9xl drop-shadow-2xl transform hover:scale-110 transition-transform duration-500 cursor-default">
                    {selectedGame.emoji}
                  </span>
                </div>
                <div className="p-6 sm:p-8 bg-gray-900">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-3xl font-black text-white tracking-tight">{selectedGame.title}</h2>
                        <span className="px-2.5 py-0.5 rounded-full bg-green-500/10 text-green-400 text-xs font-bold border border-green-500/20 uppercase tracking-wide">
                          {selectedGame.category}
                        </span>
                      </div>
                      <p className="text-gray-400 text-lg leading-relaxed max-w-md">{selectedGame.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 mt-8">
                    <button 
                      onClick={handlePlayClick}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white py-3.5 rounded-xl font-bold text-lg shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                      Play Now
                    </button>
                    <button 
                      onClick={() => toggleFavorite(selectedGame.id)}
                      className={`px-6 py-3.5 rounded-xl font-bold text-lg border flex items-center justify-center gap-2 transition-all ${
                        favorites.includes(selectedGame.id) 
                          ? "bg-yellow-500/10 border-yellow-500/50 text-yellow-400" 
                          : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                      }`}
                    >
                      {favorites.includes(selectedGame.id) ? "★ Saved" : "☆ Save"}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              // Game View
              <div className="flex flex-col h-[600px] bg-gray-950">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-900">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{selectedGame.emoji}</span>
                    <h3 className="font-bold text-white text-lg">{selectedGame.title}</h3>
                  </div>
                  <button 
                    onClick={() => setIsPlaying(false)} 
                    className="text-sm text-gray-400 hover:text-white flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    Exit Game
                  </button>
                </div>
                <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden p-4">
                  {/* Clean Game Router using engine property */}
                  {(() => {
                    switch (selectedGame.engine) {
                      case 'cyberdrift': return <CyberDrift onExit={() => setIsPlaying(false)} />;
                      case 'cricket': return <Cricket3DGame onExit={() => setIsPlaying(false)} />;
                      case 'shooter': return <SpaceDefender onExit={() => setIsPlaying(false)} />;
                      case 'runner': return <FlappyWings onExit={() => setIsPlaying(false)} />;
                      case 'memory': return <MemoryMatch onExit={() => setIsPlaying(false)} />;
                      case 'puzzle2048': return <Game2048 onExit={() => setIsPlaying(false)} />;
                      case 'cards': return <Blackjack onExit={() => setIsPlaying(false)} />;
                      case 'word': return <WordScramble onExit={() => setIsPlaying(false)} />;
                      case 'snake': return <SnakeGame onExit={() => setIsPlaying(false)} />;
                      case 'pong': return <PongGame onExit={() => setIsPlaying(false)} />;
                      case 'tictactoe': return <TicTacToeGame onExit={() => setIsPlaying(false)} />;
                      default: return <ClickerGame game={selectedGame} onExit={() => setIsPlaying(false)} />;
                    }
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="w-full border-t border-gray-800/50 bg-gray-950 py-8 text-center">
        <div className="mx-auto max-w-[1920px] px-4">
          <p className="text-sm text-gray-600">Pixel Arcade © 2026 — {games.length} Free Games. No Downloads. No Ads.</p>
          <div className="flex justify-center gap-4 mt-4 text-gray-700 text-xs">
            <span className="hover:text-gray-500 cursor-pointer">Privacy</span>
            <span className="hover:text-gray-500 cursor-pointer">Terms</span>
            <span className="hover:text-gray-500 cursor-pointer">Contact</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
