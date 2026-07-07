// Memory Match - Card matching game
import { useState, useEffect, useCallback } from 'react';
import GameWrapper from '../components/GameWrapper';
import { useGameEngine } from '../hooks/useGameEngine';
import { getGameById } from './registry';
import { playClick, playCollect, playError, playWin } from '../utils/sound';

const EMOJIS = ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🦁','🐮','🐷','🐸','🐵','🐔','🐧'];

interface Card { id: number; emoji: string; flipped: boolean; matched: boolean; }

export default function MemoryGame({ onBack }: { onBack: () => void }) {
  const config = getGameById('memory')!;
  const engine = useGameEngine({ gameId: 'memory' });
  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matched, setMatched] = useState(0);
  const [locked, setLocked] = useState(false);
  const [gridSize, setGridSize] = useState(4);

  const initGame = useCallback(() => {
    const pairs = (gridSize * gridSize) / 2;
    const selected = EMOJIS.slice(0, pairs);
    const deck = [...selected, ...selected]
      .sort(() => Math.random() - 0.5)
      .map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }));
    setCards(deck);
    setFlipped([]);
    setMoves(0);
    setMatched(0);
    setLocked(false);
  }, [gridSize]);

  const handleCardClick = useCallback((idx: number) => {
    if (locked || cards[idx].flipped || cards[idx].matched || flipped.length >= 2) return;
    playClick();

    const newCards = [...cards];
    newCards[idx].flipped = true;
    setCards(newCards);

    const newFlipped = [...flipped, idx];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      setLocked(true);

      if (cards[newFlipped[0]].emoji === cards[newFlipped[1]].emoji) {
        setTimeout(() => {
          playCollect();
          const updated = [...newCards];
          updated[newFlipped[0]].matched = true;
          updated[newFlipped[1]].matched = true;
          setCards(updated);
          setFlipped([]);
          setLocked(false);
          const newMatched = matched + 1;
          setMatched(newMatched);

          const totalPairs = (gridSize * gridSize) / 2;
          const score = Math.max(0, totalPairs * 100 - moves * 5);
          engine.updateState({ score });

          if (newMatched === totalPairs) {
            playWin();
            engine.gameOver(score);
          }
        }, 300);
      } else {
        setTimeout(() => {
          playError();
          const updated = [...newCards];
          updated[newFlipped[0]].flipped = false;
          updated[newFlipped[1]].flipped = false;
          setCards(updated);
          setFlipped([]);
          setLocked(false);
        }, 800);
      }
    }
  }, [cards, flipped, locked, moves, matched, engine, gridSize]);

  const handleStart = () => {
    engine.startGame();
    initGame();
  };

  useEffect(() => {
    if (engine.gameState.status === 'playing' && cards.length === 0) initGame();
  }, [engine.gameState.status, cards.length, initGame]);

  return (
    <GameWrapper config={config} gameState={engine.gameState} onStart={handleStart}
      onPause={engine.pauseGame} onResume={engine.resumeGame} onRestart={handleStart} onBack={onBack}
      extraHud={<div className="px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-indigo-400 text-xs pointer-events-none">Moves: {moves}</div>}
    >
      <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center p-4 overflow-auto">
        {/* Difficulty selector - only show before game starts */}
        {engine.gameState.status === 'menu' && (
          <div className="mb-4 flex gap-2">
            {[4, 6].map(size => (
              <button key={size} onClick={() => setGridSize(size)}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${gridSize === size ? 'bg-indigo-500 text-white' : 'bg-white/10 text-slate-400'}`}>
                {size}x{size}
              </button>
            ))}
          </div>
        )}

        <div className="grid gap-2" style={{
          gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
          maxWidth: gridSize === 4 ? '320px' : '400px',
          width: '100%',
        }}>
          {cards.map((card, idx) => (
            <button
              key={card.id}
              onClick={() => handleCardClick(idx)}
              className={`aspect-square rounded-xl text-2xl sm:text-3xl flex items-center justify-center transition-all duration-300 transform
                ${card.flipped || card.matched
                  ? 'bg-indigo-500/30 border-2 border-indigo-400 scale-100 rotate-0'
                  : 'bg-slate-700 border-2 border-slate-600 hover:border-indigo-400 hover:scale-105'}
                ${card.matched ? 'opacity-60 scale-95' : ''}`}
              style={{ perspective: '1000px' }}
            >
              {card.flipped || card.matched ? card.emoji : '?'}
            </button>
          ))}
        </div>
      </div>
    </GameWrapper>
  );
}
