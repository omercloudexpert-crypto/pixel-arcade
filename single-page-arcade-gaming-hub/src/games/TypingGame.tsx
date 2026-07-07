// Typing Challenge - Type falling words before they reach the bottom
import { useState, useCallback, useEffect, useRef } from 'react';
import GameWrapper from '../components/GameWrapper';
import { useGameEngine } from '../hooks/useGameEngine';
import { getGameById } from './registry';
import { playCollect } from '../utils/sound';

const WORDS = ['code','game','play','fast','type','hero','fire','star','moon','jump','dash','flip',
  'wave','rush','glow','zoom','byte','data','loop','node','grid','port','link','edge','core','sync',
  'flow','beam','bolt','spin','chip','hack','load','ping','push','pull','swap','drop','pick','roll',
  'cast','brew','mint','gold','ruby','jade','onyx','zinc','iron','neon','aqua','nova','apex','echo'];

interface FallingWord { text: string; x: number; y: number; speed: number; id: number; }

export default function TypingGame({ onBack }: { onBack: () => void }) {
  const config = getGameById('typing')!;
  const engine = useGameEngine({ gameId: 'typing' });
  const [words, setWords] = useState<FallingWord[]>([]);
  const [input, setInput] = useState('');
  const [lives, setLives] = useState(5);
  const scoreRef = useRef(0);
  const frameRef = useRef(0);
  const animRef = useRef(0);
  const stateRef = useRef(engine.gameState);
  const wordsRef = useRef<FallingWord[]>([]);
  const livesRef = useRef(5);
  const nextId = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { stateRef.current = engine.gameState; }, [engine.gameState]);
  useEffect(() => { wordsRef.current = words; }, [words]);
  useEffect(() => { livesRef.current = lives; }, [lives]);

  const initGame = useCallback(() => {
    setWords([]);
    wordsRef.current = [];
    setInput('');
    setLives(5);
    livesRef.current = 5;
    scoreRef.current = 0;
    frameRef.current = 0;
    nextId.current = 0;
  }, []);

  // Game loop
  useEffect(() => {
    const loop = () => {
      if (stateRef.current.status !== 'playing') {
        animRef.current = requestAnimationFrame(loop);
        return;
      }

      frameRef.current++;
      const spawnRate = Math.max(40, 80 - Math.floor(scoreRef.current / 50));
      if (frameRef.current % spawnRate === 0) {
        const word = WORDS[Math.floor(Math.random() * WORDS.length)];
        const newWord: FallingWord = {
          text: word,
          x: 10 + Math.random() * 80,
          y: -5,
          speed: 0.15 + Math.random() * 0.15 + scoreRef.current * 0.001,
          id: nextId.current++,
        };
        wordsRef.current = [...wordsRef.current, newWord];
        setWords([...wordsRef.current]);
      }

      // Move words
      let updated = false;
      for (let i = wordsRef.current.length - 1; i >= 0; i--) {
        wordsRef.current[i].y += wordsRef.current[i].speed;
        if (wordsRef.current[i].y > 100) {
          wordsRef.current.splice(i, 1);
          livesRef.current--;
          setLives(livesRef.current);
          engine.updateState({ lives: livesRef.current });
          if (livesRef.current <= 0) {
            engine.gameOver(scoreRef.current);
          }
          updated = true;
        }
      }
      if (frameRef.current % 3 === 0 || updated) setWords([...wordsRef.current]);

      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [engine]);

  const handleInput = useCallback((val: string) => {
    setInput(val);
    const lower = val.toLowerCase().trim();
    const idx = wordsRef.current.findIndex(w => w.text.toLowerCase() === lower);
    if (idx >= 0) {
      const wordLen = wordsRef.current[idx].text.length;
      wordsRef.current.splice(idx, 1);
      setWords([...wordsRef.current]);
      scoreRef.current += wordLen * 10;
      engine.updateState({ score: scoreRef.current });
      playCollect();
      setInput('');
    }
  }, [engine]);

  useEffect(() => {
    if (engine.gameState.status === 'playing' && inputRef.current) inputRef.current.focus();
  }, [engine.gameState.status]);

  const handleStart = () => { engine.startGame(); initGame(); };

  return (
    <GameWrapper config={config} gameState={engine.gameState} onStart={handleStart}
      onPause={engine.pauseGame} onResume={engine.resumeGame} onRestart={handleStart} onBack={onBack}
      extraHud={<div className="px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-red-400 text-xs pointer-events-none">❤️ {lives}</div>}
    >
      <div className="absolute inset-0 bg-slate-900 flex flex-col">
        {/* Word field */}
        <div className="flex-1 relative overflow-hidden">
          {words.map(w => (
            <div
              key={w.id}
              className={`absolute px-3 py-1 rounded-lg font-mono font-bold text-lg transition-all
                ${input && w.text.toLowerCase().startsWith(input.toLowerCase()) ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500' : 'bg-slate-700/80 text-white'}`}
              style={{ left: `${w.x}%`, top: `${w.y}%`, transform: 'translateX(-50%)' }}
            >
              {w.text}
            </div>
          ))}
          {/* Danger line */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-500/50" />
        </div>

        {/* Input */}
        <div className="p-4 bg-slate-800 border-t border-slate-700">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => handleInput(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-700 border-2 border-slate-600 text-white text-xl text-center font-mono focus:border-indigo-500 focus:outline-none"
            placeholder="Type the words..."
            autoComplete="off"
            autoCapitalize="off"
          />
        </div>
      </div>
    </GameWrapper>
  );
}
