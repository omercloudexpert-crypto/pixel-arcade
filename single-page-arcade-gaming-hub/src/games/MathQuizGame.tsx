// Math Blitz - Solve math problems against the clock
import { useState, useCallback, useEffect, useRef } from 'react';
import GameWrapper from '../components/GameWrapper';
import { useGameEngine } from '../hooks/useGameEngine';
import { getGameById } from './registry';
import { playCollect, playError } from '../utils/sound';

export default function MathQuizGame({ onBack }: { onBack: () => void }) {
  const config = getGameById('mathquiz')!;
  const engine = useGameEngine({ gameId: 'mathquiz' });
  const [problem, setProblem] = useState('');
  const [answer, setAnswer] = useState('');
  const [correct, setCorrect] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [streak, setStreak] = useState(0);
  const scoreRef = useRef(0);
  const correctAnswerRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);
  const difficultyRef = useRef(1);

  const generateProblem = useCallback(() => {
    const d = difficultyRef.current;
    const maxNum = 10 + d * 5;
    const ops = d > 3 ? ['+', '-', '×', '÷'] : d > 1 ? ['+', '-', '×'] : ['+', '-'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a: number, b: number, ans: number;

    switch (op) {
      case '+': a = Math.floor(Math.random() * maxNum) + 1; b = Math.floor(Math.random() * maxNum) + 1; ans = a + b; break;
      case '-': a = Math.floor(Math.random() * maxNum) + 1; b = Math.floor(Math.random() * a) + 1; ans = a - b; break;
      case '×': a = Math.floor(Math.random() * 12) + 1; b = Math.floor(Math.random() * 12) + 1; ans = a * b; break;
      default: b = Math.floor(Math.random() * 12) + 1; ans = Math.floor(Math.random() * 12) + 1; a = b * ans; break;
    }

    setProblem(`${a} ${op} ${b} = ?`);
    correctAnswerRef.current = ans;
    setAnswer('');
  }, []);

  const submitAnswer = useCallback(() => {
    if (!answer || engine.gameState.status !== 'playing') return;
    const num = parseInt(answer);
    if (num === correctAnswerRef.current) {
      const bonus = Math.min(streak + 1, 5);
      scoreRef.current += 10 * bonus;
      setCorrect(c => c + 1);
      setStreak(s => s + 1);
      setTimeLeft(t => Math.min(t + 2, 30));
      setFeedback('correct');
      playCollect();
      engine.updateState({ score: scoreRef.current });
      difficultyRef.current = Math.floor(scoreRef.current / 100) + 1;
    } else {
      setStreak(0);
      setTimeLeft(t => Math.max(t - 3, 0));
      setFeedback('wrong');
      playError();
    }
    setTimeout(() => { setFeedback(null); generateProblem(); }, 300);
  }, [answer, streak, engine, generateProblem]);

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

  useEffect(() => {
    if (engine.gameState.status === 'playing' && inputRef.current) inputRef.current.focus();
  }, [engine.gameState.status, problem]);

  const handleStart = () => {
    engine.startGame();
    scoreRef.current = 0;
    setCorrect(0);
    setTimeLeft(30);
    setStreak(0);
    difficultyRef.current = 1;
    generateProblem();
  };

  return (
    <GameWrapper config={config} gameState={engine.gameState} onStart={handleStart}
      onPause={engine.pauseGame} onResume={engine.resumeGame} onRestart={handleStart} onBack={onBack}
      extraHud={<>
        <div className="px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-amber-400 text-xs pointer-events-none">⏱ {timeLeft}s</div>
        {streak > 1 && <div className="px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-orange-400 text-xs pointer-events-none">🔥 x{streak}</div>}
      </>}
    >
      <div className={`absolute inset-0 flex flex-col items-center justify-center p-4 transition-colors duration-200
        ${feedback === 'correct' ? 'bg-green-900/50' : feedback === 'wrong' ? 'bg-red-900/50' : 'bg-slate-900'}`}>
        <div className="text-center mb-8">
          <p className="text-sm text-slate-400 mb-2">Solved: {correct}</p>
          <h2 className="text-5xl sm:text-6xl font-black text-white mb-6 font-mono">{problem}</h2>
        </div>

        <div className="flex gap-2 items-center max-w-xs w-full">
          <input
            ref={inputRef}
            type="number"
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submitAnswer(); }}
            className="flex-1 px-4 py-3 rounded-xl bg-slate-700 border-2 border-slate-600 text-white text-2xl text-center font-bold focus:border-indigo-500 focus:outline-none"
            placeholder="?"
            autoComplete="off"
          />
          <button onClick={submitAnswer}
            className="px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xl transition-colors">
            ✓
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
