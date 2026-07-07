// 2048 - Slide tiles to merge numbers
import { useState, useEffect, useCallback, useRef } from 'react';
import GameWrapper from '../components/GameWrapper';
import { useGameEngine } from '../hooks/useGameEngine';
import { getGameById } from './registry';
import { playMove, playCollect, playError } from '../utils/sound';

const SIZE = 4;

const TILE_COLORS: Record<number, string> = {
  2: 'bg-amber-100 text-amber-900',
  4: 'bg-amber-200 text-amber-900',
  8: 'bg-orange-400 text-white',
  16: 'bg-orange-500 text-white',
  32: 'bg-red-400 text-white',
  64: 'bg-red-500 text-white',
  128: 'bg-yellow-400 text-white',
  256: 'bg-yellow-500 text-white',
  512: 'bg-yellow-600 text-white',
  1024: 'bg-amber-500 text-white',
  2048: 'bg-amber-600 text-white',
};

export default function Game2048({ onBack }: { onBack: () => void }) {
  const config = getGameById('game2048')!;
  const engine = useGameEngine({ gameId: 'game2048' });
  const [grid, setGrid] = useState<number[][]>([]);
  const scoreRef = useRef(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const addRandom = useCallback((g: number[][]) => {
    const empty: [number, number][] = [];
    for (let r = 0; r < SIZE; r++)
      for (let c = 0; c < SIZE; c++)
        if (g[r][c] === 0) empty.push([r, c]);
    if (empty.length === 0) return;
    const [r, c] = empty[Math.floor(Math.random() * empty.length)];
    g[r][c] = Math.random() < 0.9 ? 2 : 4;
  }, []);

  const initGame = useCallback(() => {
    const g = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
    addRandom(g);
    addRandom(g);
    setGrid(g);
    scoreRef.current = 0;
  }, [addRandom]);

  const canMove = (g: number[][]): boolean => {
    for (let r = 0; r < SIZE; r++)
      for (let c = 0; c < SIZE; c++) {
        if (g[r][c] === 0) return true;
        if (c < SIZE - 1 && g[r][c] === g[r][c + 1]) return true;
        if (r < SIZE - 1 && g[r][c] === g[r + 1][c]) return true;
      }
    return false;
  };

  const slideRow = useCallback((row: number[]): { result: number[]; score: number; moved: boolean } => {
    const filtered = row.filter(v => v !== 0);
    let score = 0;
    const merged: number[] = [];
    let i = 0;
    while (i < filtered.length) {
      if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
        const val = filtered[i] * 2;
        merged.push(val);
        score += val;
        i += 2;
      } else {
        merged.push(filtered[i]);
        i++;
      }
    }
    while (merged.length < SIZE) merged.push(0);
    const moved = row.some((v, idx) => v !== merged[idx]);
    return { result: merged, score, moved };
  }, []);

  const move = useCallback((dir: 'left' | 'right' | 'up' | 'down') => {
    if (engine.gameState.status !== 'playing') return;

    const g = grid.map(r => [...r]);
    let totalScore = 0;
    let anyMoved = false;

    if (dir === 'left') {
      for (let r = 0; r < SIZE; r++) {
        const { result, score, moved } = slideRow(g[r]);
        g[r] = result; totalScore += score; if (moved) anyMoved = true;
      }
    } else if (dir === 'right') {
      for (let r = 0; r < SIZE; r++) {
        const { result, score, moved } = slideRow([...g[r]].reverse());
        g[r] = result.reverse(); totalScore += score; if (moved) anyMoved = true;
      }
    } else if (dir === 'up') {
      for (let c = 0; c < SIZE; c++) {
        const col = Array.from({ length: SIZE }, (_, r) => g[r][c]);
        const { result, score, moved } = slideRow(col);
        for (let r = 0; r < SIZE; r++) g[r][c] = result[r];
        totalScore += score; if (moved) anyMoved = true;
      }
    } else if (dir === 'down') {
      for (let c = 0; c < SIZE; c++) {
        const col = Array.from({ length: SIZE }, (_, r) => g[r][c]).reverse();
        const { result, score, moved } = slideRow(col);
        const rev = result.reverse();
        for (let r = 0; r < SIZE; r++) g[r][c] = rev[r];
        totalScore += score; if (moved) anyMoved = true;
      }
    }

    if (!anyMoved) { playError(); return; }

    scoreRef.current += totalScore;
    if (totalScore > 0) playCollect(); else playMove();
    addRandom(g);
    setGrid(g);
    engine.updateState({ score: scoreRef.current });

    if (!canMove(g)) {
      setTimeout(() => engine.gameOver(scoreRef.current), 500);
    }
  }, [grid, engine, slideRow, addRandom]);

  // Keyboard & touch
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft': case 'a': case 'A': move('left'); e.preventDefault(); break;
        case 'ArrowRight': case 'd': case 'D': move('right'); e.preventDefault(); break;
        case 'ArrowUp': case 'w': case 'W': move('up'); e.preventDefault(); break;
        case 'ArrowDown': case 's': case 'S': move('down'); e.preventDefault(); break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [move]);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;
      const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
      const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
      if (Math.abs(dx) < 30 && Math.abs(dy) < 30) return;
      if (Math.abs(dx) > Math.abs(dy)) {
        move(dx > 0 ? 'right' : 'left');
      } else {
        move(dy > 0 ? 'down' : 'up');
      }
    };
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [move]);

  const handleStart = () => { engine.startGame(); initGame(); };

  return (
    <GameWrapper config={config} gameState={engine.gameState} onStart={handleStart}
      onPause={engine.pauseGame} onResume={engine.resumeGame} onRestart={handleStart} onBack={onBack}>
      <div className="absolute inset-0 bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-2xl p-3 sm:p-4">
          <div className="grid grid-cols-4 gap-2 sm:gap-3" style={{ width: 'min(80vw, 360px)', height: 'min(80vw, 360px)' }}>
            {grid.flat().map((val, i) => {
              const colorClass = val ? (TILE_COLORS[val] || 'bg-purple-600 text-white') : 'bg-slate-700';
              return (
                <div key={i} className={`${colorClass} rounded-lg flex items-center justify-center font-bold transition-all duration-100 ${val > 64 ? 'text-lg sm:text-2xl' : 'text-xl sm:text-3xl'}`}>
                  {val || ''}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </GameWrapper>
  );
}
