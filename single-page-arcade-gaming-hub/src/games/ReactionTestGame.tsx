// Reaction Time Test - How fast can you react?
import { useState, useRef, useCallback, useEffect } from 'react';
import GameWrapper from '../components/GameWrapper';
import { useGameEngine } from '../hooks/useGameEngine';
import { getGameById } from './registry';
import { playCollect, playError } from '../utils/sound';

type Phase = 'waiting' | 'ready' | 'go' | 'result' | 'early';

export default function ReactionTestGame({ onBack }: { onBack: () => void }) {
  const config = getGameById('reactiontest')!;
  const engine = useGameEngine({ gameId: 'reactiontest' });
  const [phase, setPhase] = useState<Phase>('waiting');
  const [reactionTime, setReactionTime] = useState(0);
  const [times, setTimes] = useState<number[]>([]);
  const [round, setRound] = useState(0);
  const startTimeRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const TOTAL_ROUNDS = 5;

  const startRound = useCallback(() => {
    setPhase('ready');
    const delay = 1000 + Math.random() * 4000;
    timeoutRef.current = setTimeout(() => {
      setPhase('go');
      startTimeRef.current = performance.now();
    }, delay);
  }, []);

  const handleClick = useCallback(() => {
    if (engine.gameState.status !== 'playing') return;

    if (phase === 'waiting') {
      startRound();
      return;
    }

    if (phase === 'ready') {
      clearTimeout(timeoutRef.current);
      setPhase('early');
      playError();
      return;
    }

    if (phase === 'go') {
      const time = Math.round(performance.now() - startTimeRef.current);
      setReactionTime(time);
      setPhase('result');
      playCollect();
      const newTimes = [...times, time];
      setTimes(newTimes);
      const newRound = round + 1;
      setRound(newRound);

      if (newRound >= TOTAL_ROUNDS) {
        const avg = Math.round(newTimes.reduce((a, b) => a + b, 0) / newTimes.length);
        const score = Math.max(0, 1000 - avg);
        engine.updateState({ score });
        setTimeout(() => engine.gameOver(score), 2000);
      }
      return;
    }

    if (phase === 'result' || phase === 'early') {
      startRound();
      return;
    }
  }, [phase, times, round, engine, startRound]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === ' ') { handleClick(); e.preventDefault(); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleClick]);

  useEffect(() => {
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, []);

  const handleStart = () => {
    engine.startGame();
    setPhase('waiting');
    setTimes([]);
    setRound(0);
    setReactionTime(0);
  };

  const avgTime = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;

  return (
    <GameWrapper config={config} gameState={engine.gameState} onStart={handleStart}
      onPause={engine.pauseGame} onResume={engine.resumeGame} onRestart={handleStart} onBack={onBack}
      extraHud={<div className="px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-indigo-400 text-xs pointer-events-none">{round}/{TOTAL_ROUNDS}</div>}
    >
      <div
        onClick={handleClick}
        className={`absolute inset-0 flex flex-col items-center justify-center p-4 cursor-pointer select-none transition-colors duration-300
          ${phase === 'ready' ? 'bg-red-600' :
            phase === 'go' ? 'bg-green-500' :
            phase === 'early' ? 'bg-orange-500' :
            phase === 'result' ? 'bg-blue-600' : 'bg-slate-800'}`}
      >
        {phase === 'waiting' && (
          <div className="text-center animate-scale-in">
            <div className="text-6xl mb-4">⚡</div>
            <h2 className="text-2xl font-bold mb-2">Click when ready!</h2>
            <p className="text-white/70 text-sm">Test your reaction time over {TOTAL_ROUNDS} rounds</p>
          </div>
        )}
        {phase === 'ready' && (
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white">Wait for green...</h2>
            <p className="text-white/70 mt-2">Don't click yet!</p>
          </div>
        )}
        {phase === 'go' && (
          <div className="text-center animate-scale-in">
            <h2 className="text-5xl font-black text-white">CLICK NOW!</h2>
          </div>
        )}
        {phase === 'early' && (
          <div className="text-center animate-scale-in">
            <h2 className="text-3xl font-bold text-white">Too early! 😅</h2>
            <p className="text-white/70 mt-2">Click to try again</p>
          </div>
        )}
        {phase === 'result' && (
          <div className="text-center animate-scale-in">
            <h2 className="text-5xl font-black text-white">{reactionTime}ms</h2>
            <p className="text-white/70 mt-2">
              {reactionTime < 200 ? '🔥 Lightning fast!' :
               reactionTime < 300 ? '⚡ Great!' :
               reactionTime < 400 ? '👍 Good' : '🐢 Keep trying!'}
            </p>
            {times.length > 0 && (
              <p className="text-white/50 text-sm mt-4">Average: {avgTime}ms | Round {round}/{TOTAL_ROUNDS}</p>
            )}
            <p className="text-white/40 text-xs mt-2">Click to continue</p>
          </div>
        )}
      </div>
    </GameWrapper>
  );
}
