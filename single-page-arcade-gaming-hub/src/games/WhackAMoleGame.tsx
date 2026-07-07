// Whack-a-Mole - Click moles as they pop up
import { useState, useEffect, useCallback, useRef } from 'react';
import GameWrapper from '../components/GameWrapper';
import { useGameEngine } from '../hooks/useGameEngine';
import { getGameById } from './registry';
import { playCollect, playError } from '../utils/sound';

interface Mole { id: number; active: boolean; hit: boolean; golden: boolean; timer: number; }

export default function WhackAMoleGame({ onBack }: { onBack: () => void }) {
  const config = getGameById('whackamole')!;
  const engine = useGameEngine({ gameId: 'whackamole' });
  const [moles, setMoles] = useState<Mole[]>([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const scoreRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const spawnRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const stateRef = useRef(engine.gameState);

  useEffect(() => { stateRef.current = engine.gameState; }, [engine.gameState]);

  const initGame = useCallback(() => {
    setMoles(Array.from({ length: 9 }, (_, i) => ({
      id: i, active: false, hit: false, golden: false, timer: 0
    })));
    scoreRef.current = 0;
    setTimeLeft(30);
  }, []);

  const handleWhack = useCallback((idx: number) => {
    if (stateRef.current.status !== 'playing') return;
    setMoles(prev => {
      const next = [...prev];
      if (next[idx].active && !next[idx].hit) {
        next[idx].hit = true;
        const points = next[idx].golden ? 50 : 10;
        scoreRef.current += points;
        engine.updateState({ score: scoreRef.current });
        playCollect();
        setTimeout(() => {
          setMoles(p => { const n = [...p]; n[idx].active = false; n[idx].hit = false; return n; });
        }, 200);
      } else if (!next[idx].active) {
        playError();
      }
      return next;
    });
  }, [engine]);

  // Game timer and spawning
  useEffect(() => {
    if (engine.gameState.status === 'playing') {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            clearInterval(spawnRef.current);
            engine.gameOver(scoreRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      spawnRef.current = setInterval(() => {
        if (stateRef.current.status !== 'playing') return;
        setMoles(prev => {
          const inactive = prev.filter(m => !m.active).map(m => m.id);
          if (inactive.length === 0) return prev;
          const idx = inactive[Math.floor(Math.random() * inactive.length)];
          const next = [...prev];
          next[idx].active = true;
          next[idx].hit = false;
          next[idx].golden = Math.random() < 0.1;
          // Auto-hide after delay
          setTimeout(() => {
            setMoles(p => {
              const n = [...p];
              if (n[idx].active && !n[idx].hit) {
                n[idx].active = false;
              }
              return n;
            });
          }, 800 + Math.random() * 600);
          return next;
        });
      }, 500);

      return () => {
        clearInterval(timerRef.current);
        clearInterval(spawnRef.current);
      };
    }
  }, [engine.gameState.status, engine]);

  const handleStart = () => { engine.startGame(); initGame(); };

  return (
    <GameWrapper config={config} gameState={engine.gameState} onStart={handleStart}
      onPause={engine.pauseGame} onResume={engine.resumeGame} onRestart={handleStart} onBack={onBack}
      extraHud={<div className="px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-amber-400 text-xs pointer-events-none">⏱ {timeLeft}s</div>}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-green-900 to-amber-900 flex items-center justify-center p-4">
        <div className="grid grid-cols-3 gap-3 sm:gap-4" style={{ width: 'min(85vw, 360px)', height: 'min(85vw, 360px)' }}>
          {moles.map((mole) => (
            <button
              key={mole.id}
              onClick={() => handleWhack(mole.id)}
              className={`rounded-2xl flex items-center justify-center text-4xl sm:text-5xl transition-all duration-150 select-none
                ${mole.active
                  ? mole.hit
                    ? 'bg-red-400/50 scale-90'
                    : mole.golden
                      ? 'bg-yellow-500/40 border-2 border-yellow-400 scale-110 animate-bounce'
                      : 'bg-amber-700/60 border-2 border-amber-500 scale-105 hover:scale-110'
                  : 'bg-amber-900/40 border-2 border-amber-800/50'
                }`}
              style={{ cursor: mole.active ? 'pointer' : 'default' }}
            >
              <div className={`transition-all duration-150 ${mole.active && !mole.hit ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                {mole.golden ? '👑' : '🐹'}
              </div>
              {mole.hit && <span className="text-2xl">💥</span>}
              {!mole.active && !mole.hit && <div className="w-12 h-3 bg-amber-900/60 rounded-full" />}
            </button>
          ))}
        </div>
      </div>
    </GameWrapper>
  );
}
