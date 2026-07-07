// Hangman - Guess the word letter by letter
import { useState, useCallback, useEffect } from 'react';
import GameWrapper from '../components/GameWrapper';
import { useGameEngine } from '../hooks/useGameEngine';
import { getGameById } from './registry';
import { playCollect, playError, playWin } from '../utils/sound';

const WORDS = ['JAVASCRIPT','DEVELOPER','KEYBOARD','COMPUTER','ALGORITHM','FUNCTION','VARIABLE',
  'DATABASE','NETWORK','PROGRAM','BROWSER','WEBSITE','GRAPHICS','PHYSICS','GALAXY','CRYSTAL',
  'MONSTER','DRAGON','WIZARD','PIRATE','CASTLE','PLANET','ROCKET','JUNGLE','ISLAND','DESERT',
  'VOLCANO','THUNDER','CAPTAIN','PHOENIX','WARRIOR','PUZZLE','ARCADE','GAMING','TROPHY'];

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function HangmanGame({ onBack }: { onBack: () => void }) {
  const config = getGameById('hangman')!;
  const engine = useGameEngine({ gameId: 'hangman' });
  const [word, setWord] = useState('');
  const [guessed, setGuessed] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState(0);
  const [wins, setWins] = useState(0);
  const MAX_WRONG = 6;

  const initGame = useCallback(() => {
    setWord(WORDS[Math.floor(Math.random() * WORDS.length)]);
    setGuessed(new Set());
    setWrong(0);
    setWins(0);
  }, []);

  const guessLetter = useCallback((letter: string) => {
    if (guessed.has(letter) || engine.gameState.status !== 'playing' || wrong >= MAX_WRONG) return;
    const newGuessed = new Set(guessed);
    newGuessed.add(letter);
    setGuessed(newGuessed);

    if (word.includes(letter)) {
      playCollect();
      // Check win
      if (word.split('').every(l => newGuessed.has(l))) {
        const newWins = wins + 1;
        setWins(newWins);
        const score = newWins * 100 + (MAX_WRONG - wrong) * 20;
        engine.updateState({ score });
        playWin();
        // Next word
        setTimeout(() => {
          setWord(WORDS[Math.floor(Math.random() * WORDS.length)]);
          setGuessed(new Set());
          setWrong(0);
        }, 1500);
      }
    } else {
      const newWrong = wrong + 1;
      setWrong(newWrong);
      playError();
      if (newWrong >= MAX_WRONG) {
        setTimeout(() => engine.gameOver(wins * 100), 1500);
      }
    }
  }, [word, guessed, wrong, wins, engine]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const letter = e.key.toUpperCase();
      if (ALPHABET.includes(letter)) guessLetter(letter);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [guessLetter]);

  const handleStart = () => { engine.startGame(); initGame(); };

  // Draw hangman figure
  const parts = [
    wrong >= 1 && <circle key="head" cx="150" cy="60" r="15" stroke="white" fill="none" strokeWidth="2" />,
    wrong >= 2 && <line key="body" x1="150" y1="75" x2="150" y2="120" stroke="white" strokeWidth="2" />,
    wrong >= 3 && <line key="arm1" x1="150" y1="85" x2="130" y2="105" stroke="white" strokeWidth="2" />,
    wrong >= 4 && <line key="arm2" x1="150" y1="85" x2="170" y2="105" stroke="white" strokeWidth="2" />,
    wrong >= 5 && <line key="leg1" x1="150" y1="120" x2="135" y2="150" stroke="white" strokeWidth="2" />,
    wrong >= 6 && <line key="leg2" x1="150" y1="120" x2="165" y2="150" stroke="white" strokeWidth="2" />,
  ];

  return (
    <GameWrapper config={config} gameState={engine.gameState} onStart={handleStart}
      onPause={engine.pauseGame} onResume={engine.resumeGame} onRestart={handleStart} onBack={onBack}
      extraHud={<div className="px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-amber-400 text-xs pointer-events-none">Words: {wins}</div>}
    >
      <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center p-4 gap-4 overflow-auto">
        {/* Hangman drawing */}
        <svg width="200" height="170" className="mb-2">
          {/* Gallows */}
          <line x1="40" y1="160" x2="160" y2="160" stroke="#64748b" strokeWidth="3" />
          <line x1="80" y1="160" x2="80" y2="20" stroke="#64748b" strokeWidth="3" />
          <line x1="80" y1="20" x2="150" y2="20" stroke="#64748b" strokeWidth="3" />
          <line x1="150" y1="20" x2="150" y2="45" stroke="#64748b" strokeWidth="2" />
          {parts}
        </svg>

        {/* Word display */}
        <div className="flex gap-2 flex-wrap justify-center">
          {word.split('').map((letter, i) => (
            <div key={i} className={`w-8 h-10 sm:w-10 sm:h-12 border-b-2 flex items-center justify-center text-xl sm:text-2xl font-bold
              ${guessed.has(letter) ? 'border-green-400 text-white' : 'border-slate-500'}
              ${wrong >= MAX_WRONG && !guessed.has(letter) ? 'text-red-400 border-red-400' : ''}`}>
              {guessed.has(letter) || wrong >= MAX_WRONG ? letter : ''}
            </div>
          ))}
        </div>

        {/* Keyboard */}
        <div className="flex flex-wrap justify-center gap-1.5 max-w-md mt-2">
          {ALPHABET.map(letter => {
            const isGuessed = guessed.has(letter);
            const isCorrect = isGuessed && word.includes(letter);
            const isWrong = isGuessed && !word.includes(letter);
            return (
              <button key={letter} onClick={() => guessLetter(letter)}
                disabled={isGuessed}
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg text-sm font-bold transition-all
                  ${isCorrect ? 'bg-green-500/30 text-green-400 border border-green-500' :
                    isWrong ? 'bg-red-500/20 text-red-400/50 border border-red-500/30' :
                    'bg-slate-700 text-white hover:bg-slate-600 border border-slate-600 active:scale-90'}`}
              >
                {letter}
              </button>
            );
          })}
        </div>

        <p className="text-slate-500 text-xs">{MAX_WRONG - wrong} guesses remaining</p>
      </div>
    </GameWrapper>
  );
}
