// Connect Four - Drop discs to connect 4 in a row
import { useState, useCallback } from 'react';
import GameWrapper from '../components/GameWrapper';
import { useGameEngine } from '../hooks/useGameEngine';
import { getGameById } from './registry';
import { playDrop, playWin, playError } from '../utils/sound';

const ROWS = 6, COLS = 7;
type Cell = 0 | 1 | 2; // 0=empty, 1=player, 2=AI

export default function ConnectFourGame({ onBack }: { onBack: () => void }) {
  const config = getGameById('connectfour')!;
  const engine = useGameEngine({ gameId: 'connectfour' });
  const [board, setBoard] = useState<Cell[][]>([]);
  const [currentCol, setCurrentCol] = useState(3);
  const [winCells, setWinCells] = useState<[number, number][]>([]);
  const [score, setScore] = useState(0);

  const createBoard = () => Array.from({ length: ROWS }, () => Array(COLS).fill(0)) as Cell[][];

  const checkWin = (b: Cell[][], player: Cell): [number, number][] | null => {
    const dirs = [[0,1],[1,0],[1,1],[1,-1]];
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        if (b[r][c] === player)
          for (const [dr, dc] of dirs) {
            const cells: [number, number][] = [[r, c]];
            for (let i = 1; i < 4; i++) {
              const nr = r + dr * i, nc = c + dc * i;
              if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && b[nr][nc] === player)
                cells.push([nr, nc]);
            }
            if (cells.length === 4) return cells;
          }
    return null;
  };

  const dropDisc = (b: Cell[][], col: number, player: Cell): number => {
    for (let r = ROWS - 1; r >= 0; r--) {
      if (b[r][col] === 0) { b[r][col] = player; return r; }
    }
    return -1;
  };

  const aiMove = useCallback((b: Cell[][]): number => {
    // Try to win
    for (let c = 0; c < COLS; c++) {
      const test = b.map(r => [...r]) as Cell[][];
      if (dropDisc(test, c, 2) >= 0 && checkWin(test, 2)) return c;
    }
    // Block player
    for (let c = 0; c < COLS; c++) {
      const test = b.map(r => [...r]) as Cell[][];
      if (dropDisc(test, c, 1) >= 0 && checkWin(test, 1)) return c;
    }
    // Center preference
    const order = [3, 2, 4, 1, 5, 0, 6];
    for (const c of order) if (b[0][c] === 0) return c;
    return 0;
  }, []);

  const handleDrop = useCallback((col: number) => {
    if (engine.gameState.status !== 'playing' || winCells.length > 0) return;
    const b = board.map(r => [...r]) as Cell[][];
    const row = dropDisc(b, col, 1);
    if (row < 0) { playError(); return; }
    playDrop();

    const win = checkWin(b, 1);
    if (win) {
      setBoard(b);
      setWinCells(win);
      const newScore = score + 100;
      setScore(newScore);
      engine.updateState({ score: newScore });
      playWin();
      setTimeout(() => engine.gameOver(newScore), 1500);
      return;
    }

    // AI turn
    const aiCol = aiMove(b);
    dropDisc(b, aiCol, 2);
    setBoard(b);

    const aiWin = checkWin(b, 2);
    if (aiWin) {
      setWinCells(aiWin);
      playError();
      setTimeout(() => engine.gameOver(score), 1500);
      return;
    }

    // Check draw
    if (b[0].every(c => c !== 0)) {
      setTimeout(() => engine.gameOver(score + 50), 1000);
    }
  }, [board, engine, score, aiMove, winCells]);

  const handleStart = () => {
    engine.startGame();
    setBoard(createBoard());
    setWinCells([]);
    setScore(0);
    setCurrentCol(3);
  };

  return (
    <GameWrapper config={config} gameState={engine.gameState} onStart={handleStart}
      onPause={engine.pauseGame} onResume={engine.resumeGame} onRestart={handleStart} onBack={onBack}>
      <div className="absolute inset-0 bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-blue-800 rounded-2xl p-3 sm:p-4" style={{ maxWidth: '400px', width: '100%' }}>
          {/* Column selector */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {Array.from({ length: COLS }, (_, c) => (
              <button key={c} onClick={() => handleDrop(c)}
                onMouseEnter={() => setCurrentCol(c)}
                className="h-6 flex items-center justify-center">
                <div className={`w-6 h-6 rounded-full transition-opacity ${currentCol === c ? 'bg-yellow-400 opacity-80' : 'opacity-0'}`} />
              </button>
            ))}
          </div>
          {/* Board */}
          <div className="grid grid-cols-7 gap-1">
            {board.flatMap((row, r) =>
              row.map((cell, c) => {
                const isWin = winCells.some(([wr, wc]) => wr === r && wc === c);
                return (
                  <div key={`${r}-${c}`}
                    onClick={() => handleDrop(c)}
                    className={`aspect-square rounded-full transition-all duration-200
                      ${cell === 0 ? 'bg-blue-900' : cell === 1 ? 'bg-yellow-400' : 'bg-red-500'}
                      ${isWin ? 'ring-2 ring-white scale-110' : ''}`}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>
    </GameWrapper>
  );
}
