// MoreGames2 - Racing, Sudoku, Dice, Blackjack, and more
import { useEffect, useRef, useCallback, useState } from 'react';
import GameWrapper from '../components/GameWrapper';
import { useGameEngine } from '../hooks/useGameEngine';
import { getGameById } from './registry';
import { playCollect, playHit, playBounce, playScore, playWin, playClick, playError } from '../utils/sound';

// ==================== CAR RACING ====================
export function RacingGame({ onBack }: { onBack: () => void }) {
  const config = getGameById('racing')!;
  const engine = useGameEngine({ gameId: 'racing' });
  const stateRef = useRef(engine.gameState);
  useEffect(() => { stateRef.current = engine.gameState; }, [engine.gameState]);

  const carRef = useRef({ x: 0, lane: 1 });
  const obstaclesRef = useRef<{ x: number; lane: number; type: 'car' | 'coin' }[]>([]);
  const scoreRef = useRef(0);
  const speedRef = useRef(5);
  const frameRef = useRef(0);

  const LANES = 3;
  const LANE_W = 60;

  const initGame = useCallback(() => {
    carRef.current = { x: 0, lane: 1 };
    obstaclesRef.current = [];
    scoreRef.current = 0; speedRef.current = 5; frameRef.current = 0;
  }, []);

  useEffect(() => {
    const c = engine.canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d')!; let running = true;
    const p = c.parentElement!;
    c.width = Math.min(p.clientWidth, 300); c.height = Math.min(p.clientHeight, 600);

    const changeLane = (dir: number) => {
      if (stateRef.current.status !== 'playing') return;
      carRef.current.lane = Math.max(0, Math.min(LANES - 1, carRef.current.lane + dir));
      playBounce();
    };

    const kd = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') { changeLane(-1); e.preventDefault(); }
      if (e.key === 'ArrowRight' || e.key === 'd') { changeLane(1); e.preventDefault(); }
    };
    window.addEventListener('keydown', kd);

    let touchStart: number | null = null;
    const ts = (e: TouchEvent) => { touchStart = e.touches[0].clientX; };
    const te = (e: TouchEvent) => {
      if (touchStart === null) return;
      const diff = e.changedTouches[0].clientX - touchStart;
      if (Math.abs(diff) > 30) changeLane(diff > 0 ? 1 : -1);
      touchStart = null;
    };
    c.addEventListener('touchstart', ts, { passive: true });
    c.addEventListener('touchend', te);

    const loop = () => {
      if (!running) return;
      const W = c.width, H = c.height;
      const roadX = (W - LANES * LANE_W) / 2;
      const car = carRef.current;

      if (stateRef.current.status === 'playing') {
        frameRef.current++;
        speedRef.current = 5 + frameRef.current * 0.002;
        scoreRef.current = Math.floor(frameRef.current / 5);
        engine.updateState({ score: scoreRef.current });

        // Spawn obstacles
        if (frameRef.current % Math.max(15, 40 - Math.floor(speedRef.current)) === 0) {
          const lane = Math.floor(Math.random() * LANES);
          const type: 'car' | 'coin' = Math.random() > 0.3 ? 'car' : 'coin';
          obstaclesRef.current.push({ x: -60, lane, type });
        }

        // Move obstacles
        for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
          const o = obstaclesRef.current[i];
          o.x += speedRef.current;
          if (o.x > H + 60) { obstaclesRef.current.splice(i, 1); continue; }

          // Collision check (car at bottom)
          const carY = H - 100;
          if (o.lane === car.lane && o.x > carY - 40 && o.x < carY + 40) {
            if (o.type === 'car') {
              playHit();
              engine.gameOver(scoreRef.current);
            } else {
              obstaclesRef.current.splice(i, 1);
              scoreRef.current += 50;
              engine.updateState({ score: scoreRef.current });
              playCollect();
            }
          }
        }
      }

      // Draw road
      ctx.fillStyle = '#1a1a1a'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#333'; ctx.fillRect(roadX, 0, LANES * LANE_W, H);

      // Lane markers
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.setLineDash([20, 20]);
      for (let i = 1; i < LANES; i++) {
        ctx.beginPath();
        ctx.moveTo(roadX + i * LANE_W, (frameRef.current * speedRef.current) % 40);
        for (let y = 0; y < H; y += 40) {
          ctx.lineTo(roadX + i * LANE_W, y + (frameRef.current * speedRef.current) % 40);
        }
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Road edges
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(roadX - 5, 0, 5, H);
      ctx.fillRect(roadX + LANES * LANE_W, 0, 5, H);

      // Obstacles
      obstaclesRef.current.forEach(o => {
        const ox = roadX + o.lane * LANE_W + LANE_W / 2;
        const oy = o.x;
        if (o.type === 'car') {
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.roundRect(ox - 18, oy - 25, 36, 50, 6);
          ctx.fill();
          ctx.fillStyle = '#7f1d1d';
          ctx.fillRect(ox - 14, oy - 20, 28, 15);
        } else {
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath(); ctx.arc(ox, oy, 12, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#92400e'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
          ctx.fillText('$', ox, oy + 4);
        }
      });

      // Player car
      const carX = roadX + car.lane * LANE_W + LANE_W / 2;
      const carY = H - 100;
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.roundRect(carX - 18, carY - 25, 36, 50, 6);
      ctx.fill();
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(carX - 14, carY - 5, 28, 18);
      // Wheels
      ctx.fillStyle = '#111';
      ctx.fillRect(carX - 20, carY - 20, 6, 15);
      ctx.fillRect(carX + 14, carY - 20, 6, 15);
      ctx.fillRect(carX - 20, carY + 8, 6, 15);
      ctx.fillRect(carX + 14, carY + 8, 6, 15);

      engine.animFrameRef.current = requestAnimationFrame(loop);
    };
    engine.animFrameRef.current = requestAnimationFrame(loop);
    return () => { running = false; cancelAnimationFrame(engine.animFrameRef.current); window.removeEventListener('keydown', kd); c.removeEventListener('touchstart', ts); c.removeEventListener('touchend', te); };
  }, []);

  const handleStart = () => { engine.startGame(); initGame(); };
  return (<GameWrapper config={config} gameState={engine.gameState} onStart={handleStart} onPause={engine.pauseGame} onResume={engine.resumeGame} onRestart={handleStart} onBack={onBack}><canvas ref={engine.canvasRef} style={{ maxHeight: '100%', maxWidth: '100%' }} /></GameWrapper>);
}

// ==================== SUDOKU ====================
export function SudokuGame({ onBack }: { onBack: () => void }) {
  const config = getGameById('sudoku')!;
  const engine = useGameEngine({ gameId: 'sudoku' });
  const [board, setBoard] = useState<(number | null)[][]>([]);
  const [initial, setInitial] = useState<boolean[][]>([]);
  const [selected, setSelected] = useState<{ r: number; c: number } | null>(null);
  const [errors, setErrors] = useState(0);
  const [startTime, setStartTime] = useState(0);

  const generateSudoku = useCallback(() => {
    // Generate a simple valid sudoku
    const base: number[][] = [];
    for (let i = 0; i < 9; i++) {
      base.push([]);
      for (let j = 0; j < 9; j++) {
        base[i].push(((i * 3 + Math.floor(i / 3) + j) % 9) + 1);
      }
    }
    // Shuffle rows within bands
    for (let band = 0; band < 3; band++) {
      for (let i = 0; i < 2; i++) {
        const r1 = band * 3 + Math.floor(Math.random() * 3);
        const r2 = band * 3 + Math.floor(Math.random() * 3);
        [base[r1], base[r2]] = [base[r2], base[r1]];
      }
    }
    // Remove some cells
    const puzzle = base.map(r => [...r]) as (number | null)[][];
    const init = Array.from({ length: 9 }, () => Array(9).fill(true));
    let removed = 0;
    while (removed < 40) {
      const r = Math.floor(Math.random() * 9);
      const c = Math.floor(Math.random() * 9);
      if (puzzle[r][c] !== null) {
        puzzle[r][c] = null;
        init[r][c] = false;
        removed++;
      }
    }
    return { puzzle, init, solution: base };
  }, []);

  const solutionRef = useRef<number[][]>([]);

  const initGame = useCallback(() => {
    const { puzzle, init, solution } = generateSudoku();
    setBoard(puzzle);
    setInitial(init);
    solutionRef.current = solution;
    setSelected(null);
    setErrors(0);
    setStartTime(Date.now());
  }, [generateSudoku]);

  const handleCellClick = (r: number, c: number) => {
    if (initial[r]?.[c]) return;
    setSelected({ r, c });
  };

  const handleNumberInput = (num: number) => {
    if (!selected || initial[selected.r][selected.c]) return;
    const newBoard = board.map(r => [...r]);
    newBoard[selected.r][selected.c] = num === 0 ? null : num;
    setBoard(newBoard);

    if (num !== 0 && num !== solutionRef.current[selected.r][selected.c]) {
      setErrors(e => e + 1);
      playError();
      if (errors + 1 >= 3) {
        engine.gameOver(0);
      }
    } else if (num !== 0) {
      playClick();
    }

    // Check win
    let complete = true;
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (newBoard[i][j] !== solutionRef.current[i][j]) complete = false;
      }
    }
    if (complete) {
      const time = Math.floor((Date.now() - startTime) / 1000);
      const score = Math.max(100, 1000 - time * 2 - errors * 100);
      engine.updateState({ score });
      playWin();
      engine.gameOver(score);
    }
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!selected) return;
      const num = parseInt(e.key);
      if (num >= 1 && num <= 9) handleNumberInput(num);
      if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') handleNumberInput(0);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selected, board, initial, errors, startTime]);

  const handleStart = () => { engine.startGame(); initGame(); };

  return (
    <GameWrapper config={config} gameState={engine.gameState} onStart={handleStart} onPause={engine.pauseGame} onResume={engine.resumeGame} onRestart={handleStart} onBack={onBack}
      extraHud={<div className="px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-red-400 text-xs">❌ {3 - errors}</div>}>
      <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center p-3">
        {/* Board */}
        <div className="grid grid-cols-9 gap-0 border-2 border-white/30 rounded-lg overflow-hidden" style={{ width: 'min(90vw, 360px)', height: 'min(90vw, 360px)' }}>
          {board.map((row, r) => row.map((cell, c) => {
            const isSelected = selected?.r === r && selected?.c === c;
            const isInitial = initial[r]?.[c];
            const isError = cell !== null && cell !== solutionRef.current[r]?.[c];
            const borderR = c === 2 || c === 5 ? 'border-r-2 border-r-white/30' : '';
            const borderB = r === 2 || r === 5 ? 'border-b-2 border-b-white/30' : '';
            return (
              <button
                key={`${r}-${c}`}
                onClick={() => handleCellClick(r, c)}
                className={`aspect-square flex items-center justify-center text-lg sm:text-xl font-bold border border-white/10 transition-colors
                  ${isSelected ? 'bg-indigo-500/40' : 'bg-slate-800'}
                  ${isInitial ? 'text-white' : isError ? 'text-red-400' : 'text-indigo-300'}
                  ${borderR} ${borderB}
                  ${!isInitial ? 'hover:bg-slate-700 cursor-pointer' : 'cursor-default'}`}
              >
                {cell || ''}
              </button>
            );
          }))}
        </div>

        {/* Number pad */}
        <div className="flex gap-1.5 mt-4 flex-wrap justify-center">
          {[1,2,3,4,5,6,7,8,9].map(n => (
            <button key={n} onClick={() => handleNumberInput(n)}
              className="w-10 h-10 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-bold hover:bg-indigo-500/40 transition-colors">
              {n}
            </button>
          ))}
          <button onClick={() => handleNumberInput(0)}
            className="w-10 h-10 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 font-bold hover:bg-red-500/40 transition-colors">
            ✕
          </button>
        </div>
      </div>
    </GameWrapper>
  );
}

// ==================== DICE GAME ====================
export function DiceGame({ onBack }: { onBack: () => void }) {
  const config = getGameById('dicegame')!;
  const engine = useGameEngine({ gameId: 'dicegame' });
  const [dice, setDice] = useState([1, 1, 1, 1, 1]);
  const [held, setHeld] = useState([false, false, false, false, false]);
  const [rollsLeft, setRollsLeft] = useState(3);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [rolling, setRolling] = useState(false);

  const rollDice = () => {
    if (rollsLeft <= 0 || rolling) return;
    setRolling(true);
    playBounce();

    let rolls = 0;
    const interval = setInterval(() => {
      setDice(dice.map((d, i) => held[i] ? d : Math.floor(Math.random() * 6) + 1));
      rolls++;
      if (rolls >= 10) {
        clearInterval(interval);
        setRolling(false);
        setRollsLeft(r => r - 1);
      }
    }, 50);
  };

  const toggleHold = (idx: number) => {
    if (rollsLeft === 3) return; // Can't hold before first roll
    setHeld(h => h.map((v, i) => i === idx ? !v : v));
  };

  const calculateScore = () => {
    const counts = [0, 0, 0, 0, 0, 0, 0];
    dice.forEach(d => counts[d]++);
    let pts = 0;

    // Check for patterns
    if (counts.some(c => c >= 5)) pts = 50; // Five of a kind
    else if (counts.some(c => c >= 4)) pts = 40; // Four of a kind
    else if (counts.some(c => c >= 3) && counts.some(c => c >= 2 && c < 3)) pts = 25; // Full house
    else if (counts.some(c => c >= 3)) pts = 20; // Three of a kind
    else if (counts.filter(c => c >= 2).length >= 2) pts = 15; // Two pairs
    else if (counts.some(c => c >= 2)) pts = 10; // One pair
    else pts = Math.max(...dice); // High card

    return pts;
  };

  const endTurn = () => {
    const pts = calculateScore();
    setScore(s => s + pts);
    engine.updateState({ score: score + pts });
    playScore();

    if (round >= 5) {
      engine.gameOver(score + pts);
    } else {
      setRound(r => r + 1);
      setRollsLeft(3);
      setHeld([false, false, false, false, false]);
      setDice([1, 1, 1, 1, 1]);
    }
  };

  const handleStart = () => {
    engine.startGame();
    setDice([1, 1, 1, 1, 1]);
    setHeld([false, false, false, false, false]);
    setRollsLeft(3);
    setScore(0);
    setRound(1);
  };

  const DICE_DOTS: Record<number, number[][]> = {
    1: [[1, 1]],
    2: [[0, 0], [2, 2]],
    3: [[0, 0], [1, 1], [2, 2]],
    4: [[0, 0], [0, 2], [2, 0], [2, 2]],
    5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
    6: [[0, 0], [0, 1], [0, 2], [2, 0], [2, 1], [2, 2]],
  };

  return (
    <GameWrapper config={config} gameState={engine.gameState} onStart={handleStart} onPause={engine.pauseGame} onResume={engine.resumeGame} onRestart={handleStart} onBack={onBack}
      extraHud={<div className="px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-amber-400 text-xs">Round {round}/5</div>}>
      <div className="absolute inset-0 bg-gradient-to-br from-green-900 to-emerald-950 flex flex-col items-center justify-center p-4">
        <div className="text-sm text-green-300 mb-4">Rolls left: {rollsLeft}</div>

        {/* Dice */}
        <div className="flex gap-3 mb-6">
          {dice.map((d, i) => (
            <button
              key={i}
              onClick={() => toggleHold(i)}
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl transition-all relative
                ${held[i] ? 'bg-yellow-500 ring-2 ring-yellow-300' : 'bg-white'}
                ${rolling && !held[i] ? 'animate-bounce' : ''}
                ${rollsLeft === 3 ? 'cursor-default' : 'cursor-pointer hover:scale-105'}`}
            >
              <div className="absolute inset-2 grid grid-cols-3 grid-rows-3 gap-0.5">
                {DICE_DOTS[d].map(([r, c], j) => (
                  <div key={j} className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-gray-800"
                    style={{ gridRow: r + 1, gridColumn: c + 1 }} />
                ))}
              </div>
              {held[i] && (
                <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                  H
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="text-xs text-green-400 mb-4">Click dice to hold/unhold</div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={rollDice}
            disabled={rollsLeft <= 0 || rolling}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${rollsLeft > 0 && !rolling ? 'bg-indigo-500 hover:bg-indigo-400' : 'bg-gray-600 cursor-not-allowed'}`}
          >
            🎲 Roll
          </button>
          <button
            onClick={endTurn}
            disabled={rollsLeft === 3}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${rollsLeft < 3 ? 'bg-green-500 hover:bg-green-400' : 'bg-gray-600 cursor-not-allowed'}`}
          >
            ✓ Score ({calculateScore()})
          </button>
        </div>

        <div className="mt-6 text-center">
          <div className="text-lg text-white font-bold">Total: {score}</div>
        </div>
      </div>
    </GameWrapper>
  );
}

// ==================== BLACKJACK ====================
export function BlackjackGame({ onBack }: { onBack: () => void }) {
  const config = getGameById('blackjack')!;
  const engine = useGameEngine({ gameId: 'blackjack' });
  const [playerHand, setPlayerHand] = useState<string[]>([]);
  const [dealerHand, setDealerHand] = useState<string[]>([]);
  const [deck, setDeck] = useState<string[]>([]);
  const [gamePhase, setGamePhase] = useState<'betting' | 'playing' | 'dealer' | 'result'>('betting');
  const [chips, setChips] = useState(100);
  const [bet, setBet] = useState(10);
  const [message, setMessage] = useState('');
  const [dealerRevealed, setDealerRevealed] = useState(false);

  const SUITS = ['♠', '♥', '♦', '♣'];
  const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  const createDeck = () => {
    const d: string[] = [];
    SUITS.forEach(s => RANKS.forEach(r => d.push(r + s)));
    return d.sort(() => Math.random() - 0.5);
  };

  const cardValue = (card: string): number => {
    const rank = card.slice(0, -1);
    if (['J', 'Q', 'K'].includes(rank)) return 10;
    if (rank === 'A') return 11;
    return parseInt(rank);
  };

  const handValue = (hand: string[]): number => {
    let val = 0, aces = 0;
    hand.forEach(c => {
      const v = cardValue(c);
      val += v;
      if (c.startsWith('A')) aces++;
    });
    while (val > 21 && aces > 0) { val -= 10; aces--; }
    return val;
  };

  const startRound = () => {
    if (chips < bet) return;
    const newDeck = createDeck();
    const pHand = [newDeck.pop()!, newDeck.pop()!];
    const dHand = [newDeck.pop()!, newDeck.pop()!];
    setDeck(newDeck);
    setPlayerHand(pHand);
    setDealerHand(dHand);
    setDealerRevealed(false);
    setGamePhase('playing');
    setMessage('');
    playClick();
  };

  const hit = () => {
    if (gamePhase !== 'playing') return;
    const newDeck = [...deck];
    const newHand = [...playerHand, newDeck.pop()!];
    setDeck(newDeck);
    setPlayerHand(newHand);
    playClick();

    if (handValue(newHand) > 21) {
      setDealerRevealed(true);
      setMessage('Bust! You lose.');
      setChips(c => c - bet);
      setGamePhase('result');
      playHit();
    }
  };

  const stand = () => {
    if (gamePhase !== 'playing') return;
    setDealerRevealed(true);
    setGamePhase('dealer');

    // Dealer draws
    let newDeck = [...deck];
    let dHand = [...dealerHand];
    while (handValue(dHand) < 17) {
      dHand.push(newDeck.pop()!);
    }
    setDeck(newDeck);
    setDealerHand(dHand);

    setTimeout(() => {
      const pVal = handValue(playerHand);
      const dVal = handValue(dHand);

      if (dVal > 21 || pVal > dVal) {
        setMessage('You win!');
        setChips(c => c + bet);
        playWin();
      } else if (pVal < dVal) {
        setMessage('Dealer wins.');
        setChips(c => c - bet);
        playHit();
      } else {
        setMessage('Push!');
      }
      setGamePhase('result');
      engine.updateState({ score: chips });
    }, 500);
  };

  const handleStart = () => {
    engine.startGame();
    setChips(100);
    setBet(10);
    setGamePhase('betting');
    setMessage('');
  };

  useEffect(() => {
    if (chips <= 0 && gamePhase === 'result') {
      engine.gameOver(0);
    }
  }, [chips, gamePhase]);

  const Card = ({ card, hidden }: { card: string; hidden?: boolean }) => {
    const isRed = card.includes('♥') || card.includes('♦');
    return (
      <div className={`w-12 h-16 sm:w-14 sm:h-20 rounded-lg flex items-center justify-center text-lg sm:text-xl font-bold shadow-lg
        ${hidden ? 'bg-blue-600' : 'bg-white'} ${!hidden && isRed ? 'text-red-500' : 'text-black'}`}>
        {hidden ? '?' : card}
      </div>
    );
  };

  return (
    <GameWrapper config={config} gameState={engine.gameState} onStart={handleStart} onPause={engine.pauseGame} onResume={engine.resumeGame} onRestart={handleStart} onBack={onBack}
      extraHud={<div className="px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-yellow-400 text-xs">💰 {chips}</div>}>
      <div className="absolute inset-0 bg-gradient-to-br from-green-800 to-green-950 flex flex-col items-center justify-center p-4">
        {/* Dealer */}
        <div className="mb-4 text-center">
          <div className="text-xs text-green-300 mb-2">Dealer {dealerRevealed ? `(${handValue(dealerHand)})` : ''}</div>
          <div className="flex gap-2 justify-center">
            {dealerHand.map((c, i) => <Card key={i} card={c} hidden={i === 1 && !dealerRevealed} />)}
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className="my-4 px-4 py-2 rounded-xl bg-black/30 text-lg font-bold text-white">{message}</div>
        )}

        {/* Player */}
        <div className="mt-4 text-center">
          <div className="flex gap-2 justify-center mb-2">
            {playerHand.map((c, i) => <Card key={i} card={c} />)}
          </div>
          <div className="text-sm text-white">Your hand: {handValue(playerHand)}</div>
        </div>

        {/* Controls */}
        <div className="mt-6 flex gap-3">
          {gamePhase === 'betting' && (
            <>
              <button onClick={() => setBet(b => Math.max(5, b - 5))} className="px-4 py-2 rounded-xl bg-red-500 font-bold">-5</button>
              <div className="px-6 py-2 rounded-xl bg-yellow-500 text-black font-bold">Bet: {bet}</div>
              <button onClick={() => setBet(b => Math.min(chips, b + 5))} className="px-4 py-2 rounded-xl bg-green-500 font-bold">+5</button>
              <button onClick={startRound} className="px-6 py-2 rounded-xl bg-indigo-500 font-bold ml-2">Deal</button>
            </>
          )}
          {gamePhase === 'playing' && (
            <>
              <button onClick={hit} className="px-6 py-3 rounded-xl bg-green-500 font-bold hover:bg-green-400">Hit</button>
              <button onClick={stand} className="px-6 py-3 rounded-xl bg-red-500 font-bold hover:bg-red-400">Stand</button>
            </>
          )}
          {gamePhase === 'result' && chips > 0 && (
            <button onClick={() => setGamePhase('betting')} className="px-6 py-3 rounded-xl bg-indigo-500 font-bold">Next Hand</button>
          )}
        </div>
      </div>
    </GameWrapper>
  );
}

// ==================== WORD SEARCH ====================
export function WordSearchGame({ onBack }: { onBack: () => void }) {
  const config = getGameById('wordsearch')!;
  const engine = useGameEngine({ gameId: 'wordsearch' });
  const [grid, setGrid] = useState<string[][]>([]);
  const [words, setWords] = useState<{ word: string; found: boolean }[]>([]);
  const [selected, setSelected] = useState<{ r: number; c: number }[]>([]);
  const [foundCells, setFoundCells] = useState<Set<string>>(new Set());

  const WORDS = ['CODE', 'GAME', 'PLAY', 'PIXEL', 'ARCADE', 'SCORE', 'FUN', 'WIN'];
  const SIZE = 10;

  const generateGrid = useCallback(() => {
    const g: string[][] = Array.from({ length: SIZE }, () => Array(SIZE).fill(''));
    const placed: typeof words = [];

    // Place words
    WORDS.forEach(word => {
      let attempts = 0;
      while (attempts < 50) {
        const dir = Math.floor(Math.random() * 3); // 0: horizontal, 1: vertical, 2: diagonal
        const dr = dir === 0 ? 0 : 1;
        const dc = dir === 1 ? 0 : 1;
        const r = Math.floor(Math.random() * (SIZE - (dir !== 0 ? word.length : 0)));
        const c = Math.floor(Math.random() * (SIZE - (dir !== 1 ? word.length : 0)));

        let canPlace = true;
        for (let i = 0; i < word.length; i++) {
          const nr = r + dr * i, nc = c + dc * i;
          if (g[nr][nc] !== '' && g[nr][nc] !== word[i]) canPlace = false;
        }

        if (canPlace) {
          for (let i = 0; i < word.length; i++) {
            g[r + dr * i][c + dc * i] = word[i];
          }
          placed.push({ word, found: false });
          break;
        }
        attempts++;
      }
    });

    // Fill empty cells
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (g[r][c] === '') g[r][c] = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
      }
    }

    setGrid(g);
    setWords(placed);
  }, []);

  const handleCellClick = (r: number, c: number) => {
    if (engine.gameState.status !== 'playing') return;
    setSelected(s => [...s, { r, c }]);
  };

  const checkWord = () => {
    if (selected.length < 2) { setSelected([]); return; }
    const str = selected.map(s => grid[s.r][s.c]).join('');
    const revStr = str.split('').reverse().join('');

    const foundWord = words.find(w => !w.found && (w.word === str || w.word === revStr));
    if (foundWord) {
      foundWord.found = true;
      setWords([...words]);
      selected.forEach(s => foundCells.add(`${s.r}-${s.c}`));
      setFoundCells(new Set(foundCells));
      const score = words.filter(w => w.found).length * 100;
      engine.updateState({ score });
      playCollect();

      if (words.every(w => w.found)) {
        playWin();
        engine.gameOver(score);
      }
    }
    setSelected([]);
  };

  useEffect(() => {
    if (selected.length > 0) {
      const timer = setTimeout(checkWord, 1500);
      return () => clearTimeout(timer);
    }
  }, [selected]);

  const handleStart = () => { engine.startGame(); generateGrid(); setSelected([]); setFoundCells(new Set()); };

  return (
    <GameWrapper config={config} gameState={engine.gameState} onStart={handleStart} onPause={engine.pauseGame} onResume={engine.resumeGame} onRestart={handleStart} onBack={onBack}>
      <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center p-3">
        {/* Word list */}
        <div className="flex flex-wrap gap-2 mb-4 justify-center max-w-xs">
          {words.map((w, i) => (
            <span key={i} className={`px-2 py-1 rounded text-xs font-bold ${w.found ? 'bg-green-500/30 text-green-400 line-through' : 'bg-white/10 text-white'}`}>
              {w.word}
            </span>
          ))}
        </div>

        {/* Grid */}
        <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${SIZE}, 1fr)`, width: 'min(90vw, 320px)' }}>
          {grid.map((row, r) => row.map((cell, c) => {
            const isSelected = selected.some(s => s.r === r && s.c === c);
            const isFound = foundCells.has(`${r}-${c}`);
            return (
              <button
                key={`${r}-${c}`}
                onClick={() => handleCellClick(r, c)}
                className={`aspect-square flex items-center justify-center text-sm sm:text-base font-bold rounded transition-colors
                  ${isFound ? 'bg-green-500/40 text-green-300' : isSelected ? 'bg-indigo-500/40 text-indigo-300' : 'bg-slate-700 text-white hover:bg-slate-600'}`}
              >
                {cell}
              </button>
            );
          }))}
        </div>

        <div className="mt-3 text-xs text-slate-500">Click letters in sequence to find words</div>
      </div>
    </GameWrapper>
  );
}

// ==================== BUBBLE SHOOTER ====================
export function BubbleShooterGame({ onBack }: { onBack: () => void }) {
  const config = getGameById('bubbleshooter')!;
  const engine = useGameEngine({ gameId: 'bubbleshooter' });
  const stateRef = useRef(engine.gameState);
  useEffect(() => { stateRef.current = engine.gameState; }, [engine.gameState]);

  const bubblesRef = useRef<{ x: number; y: number; color: string; row: number; col: number }[]>([]);
  const shooterRef = useRef({ angle: -Math.PI / 2, color: '', nextColor: '' });
  const bulletRef = useRef<{ x: number; y: number; vx: number; vy: number; color: string } | null>(null);
  const scoreRef = useRef(0);

  const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#fbbf24', '#a855f7'];
  const BUBBLE_R = 18;

  const initGame = useCallback(() => {
    const c = engine.canvasRef.current!;
    const bubbles: typeof bubblesRef.current = [];
    for (let row = 0; row < 6; row++) {
      const offset = row % 2 === 0 ? 0 : BUBBLE_R;
      const cols = Math.floor((c.width - offset) / (BUBBLE_R * 2));
      for (let col = 0; col < cols; col++) {
        bubbles.push({
          x: offset + BUBBLE_R + col * BUBBLE_R * 2,
          y: BUBBLE_R + row * BUBBLE_R * 1.7,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          row, col
        });
      }
    }
    bubblesRef.current = bubbles;
    shooterRef.current = { angle: -Math.PI / 2, color: COLORS[Math.floor(Math.random() * COLORS.length)], nextColor: COLORS[Math.floor(Math.random() * COLORS.length)] };
    bulletRef.current = null;
    scoreRef.current = 0;
  }, [engine.canvasRef]);

  useEffect(() => {
    const c = engine.canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d')!; let running = true;
    const p = c.parentElement!;
    c.width = Math.min(p.clientWidth, 400); c.height = Math.min(p.clientHeight, 600);

    const mm = (e: MouseEvent) => {
      const rect = c.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      shooterRef.current.angle = Math.atan2(my - (c.height - 30), mx - c.width / 2);
      shooterRef.current.angle = Math.max(-Math.PI + 0.2, Math.min(-0.2, shooterRef.current.angle));
    };
    const shoot = () => {
      if (stateRef.current.status !== 'playing' || bulletRef.current) return;
      const s = shooterRef.current;
      bulletRef.current = {
        x: c.width / 2, y: c.height - 30,
        vx: Math.cos(s.angle) * 10, vy: Math.sin(s.angle) * 10,
        color: s.color
      };
      s.color = s.nextColor;
      s.nextColor = COLORS[Math.floor(Math.random() * COLORS.length)];
      playBounce();
    };
    c.addEventListener('mousemove', mm);
    c.addEventListener('click', shoot);
    window.addEventListener('keydown', (e) => { if (e.key === ' ') shoot(); });

    const loop = () => {
      if (!running) return;
      const W = c.width, H = c.height;

      if (stateRef.current.status === 'playing' && bulletRef.current) {
        const b = bulletRef.current;
        b.x += b.vx; b.y += b.vy;

        // Wall bounce
        if (b.x < BUBBLE_R || b.x > W - BUBBLE_R) b.vx *= -1;

        // Top collision - stick
        if (b.y < BUBBLE_R * 2) {
          const row = 0;
          const col = Math.round((b.x - BUBBLE_R) / (BUBBLE_R * 2));
          bubblesRef.current.push({ x: BUBBLE_R + col * BUBBLE_R * 2, y: BUBBLE_R, color: b.color, row, col });
          bulletRef.current = null;
        }

        // Bubble collision
        for (const bubble of bubblesRef.current) {
          if (Math.hypot(b.x - bubble.x, b.y - bubble.y) < BUBBLE_R * 1.8) {
            // Snap to grid
            const row = Math.round((b.y - BUBBLE_R) / (BUBBLE_R * 1.7));
            const offset = row % 2 === 0 ? 0 : BUBBLE_R;
            const col = Math.round((b.x - offset - BUBBLE_R) / (BUBBLE_R * 2));
            const newX = offset + BUBBLE_R + col * BUBBLE_R * 2;
            const newY = BUBBLE_R + row * BUBBLE_R * 1.7;

            bubblesRef.current.push({ x: newX, y: newY, color: b.color, row, col });

            // Check for matches
            const matches = findMatches(b.color, newX, newY);
            if (matches.length >= 3) {
              matches.forEach(m => {
                const idx = bubblesRef.current.findIndex(bu => bu.x === m.x && bu.y === m.y);
                if (idx >= 0) bubblesRef.current.splice(idx, 1);
              });
              scoreRef.current += matches.length * 10;
              engine.updateState({ score: scoreRef.current });
              playCollect();
            }

            bulletRef.current = null;
            break;
          }
        }

        // Check game over
        if (bubblesRef.current.some(bu => bu.y > H - 100)) {
          engine.gameOver(scoreRef.current);
        }
      }

      // Draw
      ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, W, H);

      // Bubbles
      bubblesRef.current.forEach(b => {
        ctx.fillStyle = b.color;
        ctx.beginPath(); ctx.arc(b.x, b.y, BUBBLE_R - 1, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath(); ctx.arc(b.x - 5, b.y - 5, 5, 0, Math.PI * 2); ctx.fill();
      });

      // Bullet
      if (bulletRef.current) {
        ctx.fillStyle = bulletRef.current.color;
        ctx.beginPath(); ctx.arc(bulletRef.current.x, bulletRef.current.y, BUBBLE_R - 1, 0, Math.PI * 2); ctx.fill();
      }

      // Shooter
      const s = shooterRef.current;
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(W / 2, H - 30);
      ctx.lineTo(W / 2 + Math.cos(s.angle) * 40, H - 30 + Math.sin(s.angle) * 40);
      ctx.stroke();

      // Current bubble
      ctx.fillStyle = s.color;
      ctx.beginPath(); ctx.arc(W / 2, H - 30, BUBBLE_R - 2, 0, Math.PI * 2); ctx.fill();

      // Next bubble
      ctx.fillStyle = s.nextColor;
      ctx.beginPath(); ctx.arc(50, H - 30, BUBBLE_R - 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = '10px sans-serif'; ctx.fillText('Next', 38, H - 10);

      engine.animFrameRef.current = requestAnimationFrame(loop);
    };

    const findMatches = (color: string, x: number, y: number): typeof bubblesRef.current => {
      const matches: typeof bubblesRef.current = [];
      const checked = new Set<string>();

      const check = (cx: number, cy: number) => {
        const key = `${cx}-${cy}`;
        if (checked.has(key)) return;
        checked.add(key);

        const bubble = bubblesRef.current.find(b => Math.hypot(b.x - cx, b.y - cy) < BUBBLE_R && b.color === color);
        if (bubble) {
          matches.push(bubble);
          // Check neighbors
          check(cx - BUBBLE_R * 2, cy);
          check(cx + BUBBLE_R * 2, cy);
          check(cx - BUBBLE_R, cy - BUBBLE_R * 1.7);
          check(cx + BUBBLE_R, cy - BUBBLE_R * 1.7);
          check(cx - BUBBLE_R, cy + BUBBLE_R * 1.7);
          check(cx + BUBBLE_R, cy + BUBBLE_R * 1.7);
        }
      };
      check(x, y);
      return matches;
    };

    engine.animFrameRef.current = requestAnimationFrame(loop);
    return () => { running = false; cancelAnimationFrame(engine.animFrameRef.current); };
  }, []);

  const handleStart = () => { engine.startGame(); initGame(); };
  return (<GameWrapper config={config} gameState={engine.gameState} onStart={handleStart} onPause={engine.pauseGame} onResume={engine.resumeGame} onRestart={handleStart} onBack={onBack}><canvas ref={engine.canvasRef} style={{ maxHeight: '100%', maxWidth: '100%' }} /></GameWrapper>);
}
