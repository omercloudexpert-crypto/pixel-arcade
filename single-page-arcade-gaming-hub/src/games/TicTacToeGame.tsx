// Tic Tac Toe - Classic X/O game with AI
import { useState, useCallback } from 'react';
import GameWrapper from '../components/GameWrapper';
import { useGameEngine } from '../hooks/useGameEngine';
import { getGameById } from './registry';
import { playClick, playWin, playError, playCollect } from '../utils/sound';

type Mark = 'X' | 'O' | null;

const LINES = [
  [0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]
];

export default function TicTacToeGame({ onBack }: { onBack: () => void }) {
  const config = getGameById('tictactoe')!;
  const engine = useGameEngine({ gameId: 'tictactoe' });
  const [board, setBoard] = useState<Mark[]>(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  const [winLine, setWinLine] = useState<number[] | null>(null);
  const [score, setScore] = useState(0);
  const [draws, setDraws] = useState(0);

  const checkWinner = (b: Mark[]): { winner: Mark; line: number[] | null } => {
    for (const line of LINES) {
      const [a, b2, c] = line;
      if (b[a] && b[a] === b[b2] && b[a] === b[c]) return { winner: b[a], line };
    }
    return { winner: null, line: null };
  };

  const minimax = (b: Mark[], isMax: boolean): number => {
    const { winner } = checkWinner(b);
    if (winner === 'O') return 10;
    if (winner === 'X') return -10;
    if (b.every(c => c !== null)) return 0;

    if (isMax) {
      let best = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (!b[i]) {
          b[i] = 'O';
          best = Math.max(best, minimax(b, false));
          b[i] = null;
        }
      }
      return best;
    } else {
      let best = Infinity;
      for (let i = 0; i < 9; i++) {
        if (!b[i]) {
          b[i] = 'X';
          best = Math.min(best, minimax(b, true));
          b[i] = null;
        }
      }
      return best;
    }
  };

  const aiMove = useCallback((b: Mark[]) => {
    let bestScore = -Infinity;
    let bestMove = -1;
    // Add randomness for easier play
    if (Math.random() < 0.2) {
      const empty = b.map((c, i) => c === null ? i : -1).filter(i => i >= 0);
      return empty[Math.floor(Math.random() * empty.length)];
    }
    for (let i = 0; i < 9; i++) {
      if (!b[i]) {
        b[i] = 'O';
        const s = minimax(b, false);
        b[i] = null;
        if (s > bestScore) { bestScore = s; bestMove = i; }
      }
    }
    return bestMove;
  }, []);

  const handleClick = useCallback((idx: number) => {
    if (board[idx] || winLine || engine.gameState.status !== 'playing') return;
    if (!xIsNext) return;

    playClick();
    const newBoard = [...board];
    newBoard[idx] = 'X';

    const { winner, line } = checkWinner(newBoard);
    if (winner === 'X') {
      setBoard(newBoard);
      setWinLine(line);
      setScore(s => s + 100);
      engine.updateState({ score: score + 100 });
      playWin();
      setTimeout(() => { resetBoard(score + 100); }, 1500);
      return;
    }

    if (newBoard.every(c => c !== null)) {
      setBoard(newBoard);
      setDraws(d => d + 1);
      playCollect();
      setTimeout(() => { resetBoard(score); }, 1500);
      return;
    }

    setBoard(newBoard);
    setXIsNext(false);

    // AI move
    setTimeout(() => {
      const aiIdx = aiMove([...newBoard]);
      if (aiIdx >= 0) {
        newBoard[aiIdx] = 'O';
        const { winner: w2, line: l2 } = checkWinner(newBoard);
        setBoard([...newBoard]);
        if (w2 === 'O') {
          setWinLine(l2);
          playError();
          setTimeout(() => engine.gameOver(score), 1500);
          return;
        }
        if (newBoard.every(c => c !== null)) {
          setDraws(d => d + 1);
          playCollect();
          setTimeout(() => { resetBoard(score); }, 1500);
          return;
        }
      }
      setXIsNext(true);
    }, 400);
  }, [board, xIsNext, winLine, engine, score, aiMove]);

  const resetBoard = (currentScore: number) => {
    setBoard(Array(9).fill(null));
    setWinLine(null);
    setXIsNext(true);
    setScore(currentScore);
  };

  const handleStart = () => {
    engine.startGame();
    setBoard(Array(9).fill(null));
    setWinLine(null);
    setXIsNext(true);
    setScore(0);
    setDraws(0);
  };

  return (
    <GameWrapper config={config} gameState={engine.gameState} onStart={handleStart}
      onPause={engine.pauseGame} onResume={engine.resumeGame} onRestart={handleStart} onBack={onBack}
      extraHud={<div className="px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-slate-300 text-xs pointer-events-none">Draws: {draws}</div>}
    >
      <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
        <div className="grid grid-cols-3 gap-3" style={{ width: 'min(80vw, 320px)', height: 'min(80vw, 320px)' }}>
          {board.map((cell, i) => (
            <button
              key={i}
              onClick={() => handleClick(i)}
              className={`rounded-xl text-4xl sm:text-5xl font-bold flex items-center justify-center transition-all duration-200
                ${cell ? 'scale-100' : 'scale-95 hover:scale-100'}
                ${winLine?.includes(i) ? 'bg-green-500/30 border-2 border-green-400' : 'bg-slate-700/80 border-2 border-slate-600 hover:border-indigo-400'}
                ${cell === 'X' ? 'text-cyan-400' : 'text-pink-400'}`}
            >
              {cell}
            </button>
          ))}
        </div>
      </div>
    </GameWrapper>
  );
}
