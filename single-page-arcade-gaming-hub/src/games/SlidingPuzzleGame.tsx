// Sliding Puzzle - Arrange numbered tiles in order
import { useState, useCallback, useEffect } from 'react';
import GameWrapper from '../components/GameWrapper';
import { useGameEngine } from '../hooks/useGameEngine';
import { getGameById } from './registry';
import { playMove, playWin, playError } from '../utils/sound';

export default function SlidingPuzzleGame({ onBack }: { onBack: () => void }) {
  const config = getGameById('slidingpuzzle')!;
  const engine = useGameEngine({ gameId: 'slidingpuzzle' });
  const [tiles, setTiles] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const SIZE = 4;

  const isSolved = (t: number[]) => t.every((v, i) => v === (i + 1) % (SIZE * SIZE));

  const shuffle = useCallback(() => {
    const arr = Array.from({ length: SIZE * SIZE }, (_, i) => (i + 1) % (SIZE * SIZE));
    // Perform random valid moves
    let emptyIdx = arr.indexOf(0);
    for (let i = 0; i < 200; i++) {
      const row = Math.floor(emptyIdx / SIZE);
      const col = emptyIdx % SIZE;
      const neighbors: number[] = [];
      if (row > 0) neighbors.push(emptyIdx - SIZE);
      if (row < SIZE - 1) neighbors.push(emptyIdx + SIZE);
      if (col > 0) neighbors.push(emptyIdx - 1);
      if (col < SIZE - 1) neighbors.push(emptyIdx + 1);
      const swap = neighbors[Math.floor(Math.random() * neighbors.length)];
      [arr[emptyIdx], arr[swap]] = [arr[swap], arr[emptyIdx]];
      emptyIdx = swap;
    }
    return arr;
  }, []);

  const handleTileClick = useCallback((idx: number) => {
    if (engine.gameState.status !== 'playing') return;
    const emptyIdx = tiles.indexOf(0);
    const row = Math.floor(idx / SIZE), col = idx % SIZE;
    const eRow = Math.floor(emptyIdx / SIZE), eCol = emptyIdx % SIZE;

    if ((Math.abs(row - eRow) === 1 && col === eCol) || (Math.abs(col - eCol) === 1 && row === eRow)) {
      const newTiles = [...tiles];
      [newTiles[idx], newTiles[emptyIdx]] = [newTiles[emptyIdx], newTiles[idx]];
      setTiles(newTiles);
      setMoves(m => m + 1);
      playMove();

      if (isSolved(newTiles)) {
        const score = Math.max(100, 1000 - moves * 5);
        engine.updateState({ score });
        playWin();
        setTimeout(() => engine.gameOver(score), 1000);
      }
    } else {
      playError();
    }
  }, [tiles, moves, engine]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (engine.gameState.status !== 'playing') return;
      const emptyIdx = tiles.indexOf(0);
      const row = Math.floor(emptyIdx / SIZE), col = emptyIdx % SIZE;
      let targetIdx = -1;
      switch (e.key) {
        case 'ArrowUp': if (row < SIZE - 1) targetIdx = emptyIdx + SIZE; break;
        case 'ArrowDown': if (row > 0) targetIdx = emptyIdx - SIZE; break;
        case 'ArrowLeft': if (col < SIZE - 1) targetIdx = emptyIdx + 1; break;
        case 'ArrowRight': if (col > 0) targetIdx = emptyIdx - 1; break;
      }
      if (targetIdx >= 0) { handleTileClick(targetIdx); e.preventDefault(); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [tiles, handleTileClick, engine.gameState.status]);

  const handleStart = () => { engine.startGame(); setTiles(shuffle()); setMoves(0); };

  return (
    <GameWrapper config={config} gameState={engine.gameState} onStart={handleStart}
      onPause={engine.pauseGame} onResume={engine.resumeGame} onRestart={handleStart} onBack={onBack}
      extraHud={<div className="px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-indigo-400 text-xs pointer-events-none">Moves: {moves}</div>}
    >
      <div className="absolute inset-0 bg-slate-900 flex items-center justify-center p-4">
        <div className="grid grid-cols-4 gap-2" style={{ width: 'min(80vw, 320px)', height: 'min(80vw, 320px)' }}>
          {tiles.map((val, idx) => (
            <button
              key={idx}
              onClick={() => handleTileClick(idx)}
              className={`rounded-xl text-2xl sm:text-3xl font-bold flex items-center justify-center transition-all duration-150
                ${val === 0 ? 'bg-transparent' : 'bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 active:scale-95 shadow-lg'}`}
            >
              {val || ''}
            </button>
          ))}
        </div>
      </div>
    </GameWrapper>
  );
}
