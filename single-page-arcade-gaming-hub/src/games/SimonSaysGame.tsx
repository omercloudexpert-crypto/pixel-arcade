// Simon Says - Remember and repeat color sequences
import { useState, useCallback, useEffect, useRef } from 'react';
import GameWrapper from '../components/GameWrapper';
import { useGameEngine } from '../hooks/useGameEngine';
import { getGameById } from './registry';
import { playCollect, playError } from '../utils/sound';

const COLORS = [
  { id: 0, base: 'bg-red-700', active: 'bg-red-400', shadow: 'shadow-red-500/50' },
  { id: 1, base: 'bg-blue-700', active: 'bg-blue-400', shadow: 'shadow-blue-500/50' },
  { id: 2, base: 'bg-green-700', active: 'bg-green-400', shadow: 'shadow-green-500/50' },
  { id: 3, base: 'bg-yellow-700', active: 'bg-yellow-400', shadow: 'shadow-yellow-500/50' },
];

// Simple tone frequencies for each color
const TONES = [262, 330, 392, 523];

export default function SimonSaysGame({ onBack }: { onBack: () => void }) {
  const config = getGameById('simonsays')!;
  const engine = useGameEngine({ gameId: 'simonsays' });
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerInput, setPlayerInput] = useState<number[]>([]);
  const [activeColor, setActiveColor] = useState<number | null>(null);
  const [isShowingSequence, setIsShowingSequence] = useState(false);
  const [round, setRound] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const playTone = (colorId: number) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = TONES[colorId];
      osc.type = 'sine';
      gain.gain.value = 0.3;
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {}
  };

  const showSequence = useCallback((seq: number[]) => {
    setIsShowingSequence(true);
    setPlayerInput([]);
    let i = 0;
    const show = () => {
      if (i >= seq.length) {
        setActiveColor(null);
        setIsShowingSequence(false);
        return;
      }
      setActiveColor(seq[i]);
      playTone(seq[i]);
      timeoutRef.current = setTimeout(() => {
        setActiveColor(null);
        i++;
        timeoutRef.current = setTimeout(show, 200);
      }, 500);
    };
    timeoutRef.current = setTimeout(show, 500);
  }, []);

  const nextRound = useCallback(() => {
    const newColor = Math.floor(Math.random() * 4);
    const newSeq = [...sequence, newColor];
    setSequence(newSeq);
    setRound(r => r + 1);
    showSequence(newSeq);
  }, [sequence, showSequence]);

  const handleColorClick = useCallback((colorId: number) => {
    if (isShowingSequence || engine.gameState.status !== 'playing') return;

    playTone(colorId);
    setActiveColor(colorId);
    setTimeout(() => setActiveColor(null), 200);

    const newInput = [...playerInput, colorId];
    setPlayerInput(newInput);

    const idx = newInput.length - 1;
    if (newInput[idx] !== sequence[idx]) {
      playError();
      const score = (round - 1) * 100;
      engine.gameOver(score);
      return;
    }

    if (newInput.length === sequence.length) {
      playCollect();
      const score = round * 100;
      engine.updateState({ score });
      setTimeout(nextRound, 1000);
    }
  }, [isShowingSequence, playerInput, sequence, round, engine, nextRound]);

  // Keyboard
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const map: Record<string, number> = { '1': 0, '2': 1, '3': 2, '4': 3 };
      if (map[e.key] !== undefined) handleColorClick(map[e.key]);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleColorClick]);

  const handleStart = () => {
    engine.startGame();
    setSequence([]);
    setPlayerInput([]);
    setRound(0);
    setActiveColor(null);
    setIsShowingSequence(false);
    // Start first round
    setTimeout(() => {
      const first = Math.floor(Math.random() * 4);
      setSequence([first]);
      setRound(1);
      showSequence([first]);
    }, 500);
  };

  useEffect(() => {
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, []);

  return (
    <GameWrapper config={config} gameState={engine.gameState} onStart={handleStart}
      onPause={engine.pauseGame} onResume={engine.resumeGame} onRestart={handleStart} onBack={onBack}
      extraHud={<div className="px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-purple-400 text-xs pointer-events-none">Round {round}</div>}
    >
      <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="grid grid-cols-2 gap-3" style={{ width: 'min(80vw, 300px)', height: 'min(80vw, 300px)' }}>
          {COLORS.map(color => (
            <button
              key={color.id}
              onClick={() => handleColorClick(color.id)}
              disabled={isShowingSequence}
              className={`rounded-2xl transition-all duration-150 ${color.shadow}
                ${activeColor === color.id ? `${color.active} shadow-lg scale-95` : `${color.base} hover:brightness-110`}
                ${isShowingSequence ? 'cursor-default' : 'cursor-pointer active:scale-95'}`}
            />
          ))}
        </div>
        {isShowingSequence && (
          <p className="mt-4 text-slate-400 text-sm animate-pulse">Watch the sequence...</p>
        )}
        {!isShowingSequence && engine.gameState.status === 'playing' && (
          <p className="mt-4 text-slate-400 text-sm">Your turn! ({playerInput.length}/{sequence.length})</p>
        )}
      </div>
    </GameWrapper>
  );
}
