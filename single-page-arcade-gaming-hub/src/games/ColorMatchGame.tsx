// Color Match - Match color of text vs color name
import { useState, useEffect, useCallback, useRef } from 'react';
import GameWrapper from '../components/GameWrapper';
import { useGameEngine } from '../hooks/useGameEngine';
import { getGameById } from './registry';
import { playCollect, playError } from '../utils/sound';

const COLORS = [
  { name: 'Red', css: '#ef4444' },
  { name: 'Blue', css: '#3b82f6' },
  { name: 'Green', css: '#22c55e' },
  { name: 'Yellow', css: '#eab308' },
  { name: 'Purple', css: '#a855f7' },
  { name: 'Orange', css: '#f97316' },
  { name: 'Pink', css: '#ec4899' },
  { name: 'Cyan', css: '#06b6d4' },
];

export default function ColorMatchGame({ onBack }: { onBack: () => void }) {
  const config = getGameById('colorswitch')!;
  const engine = useGameEngine({ gameId: 'colorswitch' });
  const [word, setWord] = useState('');
  const [textColor, setTextColor] = useState('');
  const [isMatch, setIsMatch] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [streak, setStreak] = useState(0);
  const scoreRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const generateRound = useCallback(() => {
    const wordIdx = Math.floor(Math.random() * COLORS.length);
    const colorIdx = Math.random() < 0.4 ? wordIdx : Math.floor(Math.random() * COLORS.length);
    setWord(COLORS[wordIdx].name);
    setTextColor(COLORS[colorIdx].css);
    setIsMatch(wordIdx === colorIdx);
  }, []);

  const handleAnswer = useCallback((answer: boolean) => {
    if (engine.gameState.status !== 'playing') return;
    if (answer === isMatch) {
      const bonus = Math.min(streak + 1, 5);
      scoreRef.current += 10 * bonus;
      setStreak(s => s + 1);
      engine.updateState({ score: scoreRef.current });
      playCollect();
      setTimeLeft(t => Math.min(t + 1, 30));
    } else {
      setStreak(0);
      setTimeLeft(t => Math.max(t - 3, 0));
      playError();
    }
    generateRound();
  }, [isMatch, streak, engine, generateRound]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'y' || e.key === 'Y') handleAnswer(true);
      if (e.key === 'ArrowLeft' || e.key === 'n' || e.key === 'N') handleAnswer(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleAnswer]);

  useEffect(() => {
    if (engine.gameState.status === 'playing') {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            engine.gameOver(scoreRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [engine.gameState.status, engine]);

  const handleStart = () => {
    engine.startGame();
    scoreRef.current = 0;
    setTimeLeft(30);
    setStreak(0);
    generateRound();
  };

  return (
    <GameWrapper config={config} gameState={engine.gameState} onStart={handleStart}
      onPause={engine.pauseGame} onResume={engine.resumeGame} onRestart={handleStart} onBack={onBack}
      extraHud={<>
        <div className="px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-amber-400 text-xs pointer-events-none">⏱ {timeLeft}s</div>
        {streak > 1 && <div className="px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-orange-400 text-xs pointer-events-none">🔥 x{streak}</div>}
      </>}
    >
      <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center p-4">
        <p className="text-slate-500 text-sm mb-4">Does the color match the word?</p>
        <div className="text-6xl sm:text-8xl font-black mb-8 transition-all" style={{ color: textColor }}>
          {word}
        </div>
        <div className="flex gap-4">
          <button onClick={() => handleAnswer(false)}
            className="px-8 py-4 rounded-2xl bg-red-500/20 border-2 border-red-500 text-red-400 text-xl font-bold hover:bg-red-500/30 active:scale-95 transition-all">
            ✗ No
          </button>
          <button onClick={() => handleAnswer(true)}
            className="px-8 py-4 rounded-2xl bg-green-500/20 border-2 border-green-500 text-green-400 text-xl font-bold hover:bg-green-500/30 active:scale-95 transition-all">
            ✓ Yes
          </button>
        </div>
        <div className="mt-6 w-64 h-2 bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-red-500 to-green-500 transition-all duration-300 rounded-full"
            style={{ width: `${(timeLeft / 30) * 100}%` }} />
        </div>
      </div>
    </GameWrapper>
  );
}
