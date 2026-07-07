// Minesweeper - Classic mine-clearing logic puzzle
import { useState, useCallback, useEffect } from 'react';
import GameWrapper from '../components/GameWrapper';
import { useGameEngine } from '../hooks/useGameEngine';
import { getGameById } from './registry';
import { playClick, playExplosion, playWin, playCollect } from '../utils/sound';

interface Cell { mine: boolean; revealed: boolean; flagged: boolean; neighbors: number; }

const DIFFICULTIES = [
  { name: 'Easy', rows: 9, cols: 9, mines: 10 },
  { name: 'Medium', rows: 12, cols: 12, mines: 25 },
  { name: 'Hard', rows: 16, cols: 16, mines: 50 },
];

export default function MinesweeperGame({ onBack }: { onBack: () => void }) {
  const config = getGameById('minesweeper')!;
  const engine = useGameEngine({ gameId: 'minesweeper' });
  const [board, setBoard] = useState<Cell[][]>([]);
  const [diff, setDiff] = useState(0);
  const [firstClick, setFirstClick] = useState(true);
  const [flags, setFlags] = useState(0);

  const d = DIFFICULTIES[diff];

  const createBoard = useCallback((rows: number, cols: number, mines: number, safeR?: number, safeC?: number): Cell[][] => {
    const b: Cell[][] = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => ({ mine: false, revealed: false, flagged: false, neighbors: 0 }))
    );
    let placed = 0;
    while (placed < mines) {
      const r = Math.floor(Math.random() * rows);
      const c = Math.floor(Math.random() * cols);
      if (b[r][c].mine) continue;
      if (safeR !== undefined && Math.abs(r - safeR) <= 1 && Math.abs(c - safeC!) <= 1) continue;
      b[r][c].mine = true;
      placed++;
    }
    // Count neighbors
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        if (!b[r][c].mine) {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++)
            for (let dc = -1; dc <= 1; dc++) {
              const nr = r + dr, nc = c + dc;
              if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && b[nr][nc].mine) count++;
            }
          b[r][c].neighbors = count;
        }
    return b;
  }, []);

  const initGame = useCallback(() => {
    setBoard(createBoard(d.rows, d.cols, d.mines));
    setFirstClick(true);
    setFlags(0);
  }, [d, createBoard]);

  const reveal = useCallback((b: Cell[][], r: number, c: number) => {
    if (r < 0 || r >= b.length || c < 0 || c >= b[0].length) return;
    if (b[r][c].revealed || b[r][c].flagged) return;
    b[r][c].revealed = true;
    if (b[r][c].neighbors === 0 && !b[r][c].mine) {
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++)
          reveal(b, r + dr, c + dc);
    }
  }, []);

  const handleCellClick = useCallback((r: number, c: number) => {
    if (engine.gameState.status !== 'playing') return;
    let b = board.map(row => row.map(cell => ({ ...cell })));

    if (firstClick) {
      b = createBoard(d.rows, d.cols, d.mines, r, c);
      setFirstClick(false);
    }

    const cell = b[r][c];
    if (cell.flagged || cell.revealed) return;

    if (cell.mine) {
      // Game over - reveal all mines
      b.forEach(row => row.forEach(c2 => { if (c2.mine) c2.revealed = true; }));
      setBoard(b);
      playExplosion();
      engine.gameOver(engine.gameState.score);
      return;
    }

    playClick();
    reveal(b, r, c);
    setBoard(b);

    // Check win
    const unrevealed = b.flat().filter(c2 => !c2.revealed).length;
    if (unrevealed === d.mines) {
      const score = d.mines * 100 + (d.rows * d.cols - d.mines) * 10;
      engine.updateState({ score });
      playWin();
      engine.gameOver(score);
    } else {
      const revealed = b.flat().filter(c2 => c2.revealed && !c2.mine).length;
      engine.updateState({ score: revealed * 10 });
    }
  }, [board, engine, d, firstClick, createBoard, reveal]);

  const handleRightClick = useCallback((e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    if (engine.gameState.status !== 'playing') return;
    const b = board.map(row => row.map(cell => ({ ...cell })));
    const cell = b[r][c];
    if (cell.revealed) return;
    cell.flagged = !cell.flagged;
    setBoard(b);
    setFlags(b.flat().filter(c2 => c2.flagged).length);
    playCollect();
  }, [board, engine.gameState.status]);

  const [longPress, setLongPress] = useState<ReturnType<typeof setTimeout> | null>(null);

  const handleTouchStart = (r: number, c: number) => {
    const timer = setTimeout(() => {
      handleRightClick({ preventDefault: () => {} } as React.MouseEvent, r, c);
    }, 500);
    setLongPress(timer);
  };

  const handleTouchEnd = () => {
    if (longPress) { clearTimeout(longPress); setLongPress(null); }
  };

  const handleStart = () => { engine.startGame(); initGame(); };

  useEffect(() => {
    if (engine.gameState.status === 'playing' && board.length === 0) initGame();
  }, [engine.gameState.status, board.length, initGame]);

  const numColors = ['', 'text-blue-400', 'text-green-400', 'text-red-400', 'text-purple-400', 'text-amber-400', 'text-cyan-400', 'text-pink-400', 'text-white'];

  return (
    <GameWrapper config={config} gameState={engine.gameState} onStart={handleStart}
      onPause={engine.pauseGame} onResume={engine.resumeGame} onRestart={handleStart} onBack={onBack}
      extraHud={<div className="px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-red-400 text-xs pointer-events-none">💣 {d.mines - flags}</div>}
    >
      <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center p-2 overflow-auto">
        {engine.gameState.status === 'menu' && (
          <div className="mb-4 flex gap-2">
            {DIFFICULTIES.map((di, i) => (
              <button key={i} onClick={() => setDiff(i)}
                className={`px-3 py-1 rounded-lg text-sm ${diff === i ? 'bg-indigo-500 text-white' : 'bg-white/10 text-slate-400'}`}>
                {di.name}
              </button>
            ))}
          </div>
        )}
        <div className="grid gap-0.5" style={{
          gridTemplateColumns: `repeat(${d.cols}, minmax(0, 1fr))`,
          maxWidth: `${d.cols * 32}px`, width: '100%',
        }}>
          {board.flatMap((row, r) =>
            row.map((cell, c) => (
              <button
                key={`${r}-${c}`}
                onClick={() => handleCellClick(r, c)}
                onContextMenu={(e) => handleRightClick(e, r, c)}
                onTouchStart={() => handleTouchStart(r, c)}
                onTouchEnd={handleTouchEnd}
                className={`aspect-square flex items-center justify-center text-xs sm:text-sm font-bold transition-all
                  ${cell.revealed
                    ? cell.mine
                      ? 'bg-red-500/80'
                      : 'bg-slate-700'
                    : 'bg-slate-600 hover:bg-slate-500 active:bg-slate-700'
                  } rounded-sm ${numColors[cell.neighbors] || ''}`}
              >
                {cell.revealed
                  ? cell.mine ? '💣' : (cell.neighbors > 0 ? cell.neighbors : '')
                  : cell.flagged ? '🚩' : ''
                }
              </button>
            ))
          )}
        </div>
      </div>
    </GameWrapper>
  );
}
