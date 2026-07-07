// Utility Apps - Password Generator, Stopwatch, Calculator, etc.
import { useState, useCallback, useEffect, useRef } from 'react';
import GameWrapper from '../components/GameWrapper';
import { useGameEngine } from '../hooks/useGameEngine';
import { getGameById } from './registry';
import { playClick, playCollect, playWin } from '../utils/sound';

// ==================== PASSWORD GENERATOR ====================
export function PasswordGeneratorApp({ onBack }: { onBack: () => void }) {
  const config = getGameById('passwordgen')!;
  const engine = useGameEngine({ gameId: 'passwordgen' });
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(16);
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  });
  const [copied, setCopied] = useState(false);
  const [strength, setStrength] = useState(0);
  const [history, setHistory] = useState<string[]>([]);

  const generatePassword = useCallback(() => {
    let chars = '';
    if (options.uppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (options.lowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (options.numbers) chars += '0123456789';
    if (options.symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (chars.length === 0) {
      chars = 'abcdefghijklmnopqrstuvwxyz';
    }

    let pass = '';
    for (let i = 0; i < length; i++) {
      pass += chars[Math.floor(Math.random() * chars.length)];
    }
    setPassword(pass);
    setCopied(false);

    // Calculate strength
    let s = 0;
    if (length >= 8) s += 20;
    if (length >= 12) s += 20;
    if (length >= 16) s += 10;
    if (options.uppercase) s += 15;
    if (options.lowercase) s += 10;
    if (options.numbers) s += 15;
    if (options.symbols) s += 20;
    setStrength(Math.min(100, s));

    playClick();
    engine.updateState({ score: history.length + 1 });
  }, [length, options, history.length, engine]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setHistory(h => [password, ...h.slice(0, 9)]);
      playCollect();
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = password;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  useEffect(() => {
    if (engine.gameState.status === 'playing' && !password) {
      generatePassword();
    }
  }, [engine.gameState.status, password, generatePassword]);

  const handleStart = () => {
    engine.startGame();
    setPassword('');
    setHistory([]);
  };

  const getStrengthColor = () => {
    if (strength >= 80) return 'bg-green-500';
    if (strength >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStrengthLabel = () => {
    if (strength >= 80) return 'Strong';
    if (strength >= 50) return 'Medium';
    return 'Weak';
  };

  return (
    <GameWrapper config={config} gameState={engine.gameState} onStart={handleStart} onPause={engine.pauseGame} onResume={engine.resumeGame} onRestart={handleStart} onBack={onBack}>
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex flex-col items-center justify-center p-4 overflow-auto">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <div className="text-5xl mb-2">🔐</div>
            <h2 className="text-2xl font-black gradient-text">Password Generator</h2>
            <p className="text-slate-400 text-sm mt-1">Generate secure passwords instantly</p>
          </div>

          {/* Password display */}
          <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-4 mb-4 border border-slate-700">
            <div className="flex items-center gap-2">
              <div className="flex-1 font-mono text-lg text-white break-all bg-slate-900/50 rounded-xl p-3 min-h-[60px] flex items-center">
                {password || 'Click Generate'}
              </div>
              <button
                onClick={copyToClipboard}
                className={`px-4 py-3 rounded-xl font-bold transition-all ${copied ? 'bg-green-500 text-white' : 'bg-indigo-500 hover:bg-indigo-400 text-white'}`}
              >
                {copied ? '✓' : '📋'}
              </button>
            </div>

            {/* Strength meter */}
            <div className="mt-3">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Strength</span>
                <span className={strength >= 80 ? 'text-green-400' : strength >= 50 ? 'text-yellow-400' : 'text-red-400'}>
                  {getStrengthLabel()}
                </span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className={`h-full ${getStrengthColor()} transition-all duration-300`} style={{ width: `${strength}%` }} />
              </div>
            </div>
          </div>

          {/* Length slider */}
          <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-4 mb-4 border border-slate-700">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-300">Length</span>
              <span className="text-indigo-400 font-bold">{length} characters</span>
            </div>
            <input
              type="range"
              min="6"
              max="64"
              value={length}
              onChange={e => setLength(parseInt(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>

          {/* Options */}
          <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-4 mb-4 border border-slate-700">
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'uppercase', label: 'ABC', desc: 'Uppercase' },
                { key: 'lowercase', label: 'abc', desc: 'Lowercase' },
                { key: 'numbers', label: '123', desc: 'Numbers' },
                { key: 'symbols', label: '#$%', desc: 'Symbols' },
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setOptions(o => ({ ...o, [opt.key]: !o[opt.key as keyof typeof options] }))}
                  className={`p-3 rounded-xl transition-all text-center ${options[opt.key as keyof typeof options]
                    ? 'bg-indigo-500/30 border border-indigo-500'
                    : 'bg-slate-700/50 border border-slate-600 hover:border-slate-500'}`}
                >
                  <div className="font-mono text-lg">{opt.label}</div>
                  <div className="text-xs text-slate-400">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={generatePassword}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 font-bold text-lg transition-all transform hover:scale-[1.02] shadow-lg shadow-indigo-500/25"
          >
            🔄 Generate New Password
          </button>

          {/* History */}
          {history.length > 0 && (
            <div className="mt-4">
              <div className="text-xs text-slate-500 mb-2">Recent passwords:</div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {history.map((h, i) => (
                  <div key={i} className="text-xs font-mono text-slate-400 bg-slate-800/30 rounded px-2 py-1 truncate cursor-pointer hover:text-white"
                    onClick={() => { setPassword(h); setCopied(false); }}>
                    {h}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </GameWrapper>
  );
}

// ==================== STOPWATCH ====================
export function StopwatchApp({ onBack }: { onBack: () => void }) {
  const config = getGameById('stopwatch')!;
  const engine = useGameEngine({ gameId: 'stopwatch' });
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTime(t => t + 10);
      }, 10);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const formatTime = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    const cents = Math.floor((ms % 1000) / 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${cents.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    engine.startGame();
    setTime(0);
    setLaps([]);
    setRunning(false);
  };

  const toggleRunning = () => {
    setRunning(r => !r);
    playClick();
  };

  const addLap = () => {
    setLaps(l => [time, ...l]);
    playCollect();
  };

  const reset = () => {
    setRunning(false);
    setTime(0);
    setLaps([]);
    playClick();
  };

  return (
    <GameWrapper config={config} gameState={engine.gameState} onStart={handleStart} onPause={engine.pauseGame} onResume={engine.resumeGame} onRestart={handleStart} onBack={onBack}>
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-indigo-900/20 flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl sm:text-8xl font-mono font-black text-white mb-8 tabular-nums">
            {formatTime(time)}
          </div>

          <div className="flex gap-4 justify-center mb-8">
            <button
              onClick={toggleRunning}
              className={`w-20 h-20 rounded-full font-bold text-2xl transition-all shadow-lg ${running
                ? 'bg-red-500 hover:bg-red-400 shadow-red-500/30'
                : 'bg-green-500 hover:bg-green-400 shadow-green-500/30'}`}
            >
              {running ? '⏸' : '▶'}
            </button>
            <button
              onClick={addLap}
              disabled={!running}
              className={`w-20 h-20 rounded-full font-bold text-xl transition-all ${running
                ? 'bg-indigo-500 hover:bg-indigo-400'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
            >
              Lap
            </button>
            <button
              onClick={reset}
              className="w-20 h-20 rounded-full bg-slate-700 hover:bg-slate-600 font-bold text-xl transition-all"
            >
              ↺
            </button>
          </div>

          {laps.length > 0 && (
            <div className="max-h-48 overflow-y-auto">
              {laps.map((lap, i) => (
                <div key={i} className="flex justify-between px-4 py-2 bg-slate-800/50 rounded-lg mb-1 text-sm">
                  <span className="text-slate-400">Lap {laps.length - i}</span>
                  <span className="font-mono text-white">{formatTime(lap)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </GameWrapper>
  );
}

// ==================== CALCULATOR ====================
export function CalculatorApp({ onBack }: { onBack: () => void }) {
  const config = getGameById('calculator')!;
  const engine = useGameEngine({ gameId: 'calculator' });
  const [display, setDisplay] = useState('0');
  const [prev, setPrev] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [newNum, setNewNum] = useState(true);

  const handleNum = (n: string) => {
    playClick();
    if (newNum) {
      setDisplay(n);
      setNewNum(false);
    } else {
      setDisplay(d => d === '0' ? n : d + n);
    }
  };

  const handleOp = (o: string) => {
    playClick();
    if (prev !== null && op && !newNum) {
      calculate();
    }
    setPrev(parseFloat(display));
    setOp(o);
    setNewNum(true);
  };

  const calculate = () => {
    if (prev === null || !op) return;
    const curr = parseFloat(display);
    let result = 0;
    switch (op) {
      case '+': result = prev + curr; break;
      case '-': result = prev - curr; break;
      case '×': result = prev * curr; break;
      case '÷': result = curr !== 0 ? prev / curr : 0; break;
    }
    setDisplay(result.toString().slice(0, 12));
    setPrev(null);
    setOp(null);
    setNewNum(true);
    playCollect();
  };

  const clear = () => {
    setDisplay('0');
    setPrev(null);
    setOp(null);
    setNewNum(true);
    playClick();
  };

  const handleStart = () => {
    engine.startGame();
    clear();
  };

  const Button = ({ label, onClick, className = '' }: { label: string; onClick: () => void; className?: string }) => (
    <button onClick={onClick}
      className={`aspect-square rounded-2xl text-2xl font-bold transition-all active:scale-95 ${className}`}>
      {label}
    </button>
  );

  return (
    <GameWrapper config={config} gameState={engine.gameState} onStart={handleStart} onPause={engine.pauseGame} onResume={engine.resumeGame} onRestart={handleStart} onBack={onBack}>
      <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-xs bg-slate-800 rounded-3xl p-4">
          {/* Display */}
          <div className="bg-slate-900 rounded-2xl p-4 mb-4 text-right">
            <div className="text-sm text-slate-500 h-5">{prev !== null ? `${prev} ${op}` : ''}</div>
            <div className="text-4xl font-mono text-white truncate">{display}</div>
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-4 gap-2">
            <Button label="C" onClick={clear} className="bg-red-500/20 text-red-400 hover:bg-red-500/30" />
            <Button label="±" onClick={() => setDisplay(d => (parseFloat(d) * -1).toString())} className="bg-slate-700 text-slate-300 hover:bg-slate-600" />
            <Button label="%" onClick={() => setDisplay(d => (parseFloat(d) / 100).toString())} className="bg-slate-700 text-slate-300 hover:bg-slate-600" />
            <Button label="÷" onClick={() => handleOp('÷')} className="bg-indigo-500 text-white hover:bg-indigo-400" />

            <Button label="7" onClick={() => handleNum('7')} className="bg-slate-700 text-white hover:bg-slate-600" />
            <Button label="8" onClick={() => handleNum('8')} className="bg-slate-700 text-white hover:bg-slate-600" />
            <Button label="9" onClick={() => handleNum('9')} className="bg-slate-700 text-white hover:bg-slate-600" />
            <Button label="×" onClick={() => handleOp('×')} className="bg-indigo-500 text-white hover:bg-indigo-400" />

            <Button label="4" onClick={() => handleNum('4')} className="bg-slate-700 text-white hover:bg-slate-600" />
            <Button label="5" onClick={() => handleNum('5')} className="bg-slate-700 text-white hover:bg-slate-600" />
            <Button label="6" onClick={() => handleNum('6')} className="bg-slate-700 text-white hover:bg-slate-600" />
            <Button label="-" onClick={() => handleOp('-')} className="bg-indigo-500 text-white hover:bg-indigo-400" />

            <Button label="1" onClick={() => handleNum('1')} className="bg-slate-700 text-white hover:bg-slate-600" />
            <Button label="2" onClick={() => handleNum('2')} className="bg-slate-700 text-white hover:bg-slate-600" />
            <Button label="3" onClick={() => handleNum('3')} className="bg-slate-700 text-white hover:bg-slate-600" />
            <Button label="+" onClick={() => handleOp('+')} className="bg-indigo-500 text-white hover:bg-indigo-400" />

            <button onClick={() => handleNum('0')}
              className="col-span-2 rounded-2xl text-2xl font-bold bg-slate-700 text-white hover:bg-slate-600 py-4">0</button>
            <Button label="." onClick={() => handleNum('.')} className="bg-slate-700 text-white hover:bg-slate-600" />
            <Button label="=" onClick={calculate} className="bg-green-500 text-white hover:bg-green-400" />
          </div>
        </div>
      </div>
    </GameWrapper>
  );
}

// ==================== COLOR PICKER ====================
export function ColorPickerApp({ onBack }: { onBack: () => void }) {
  const config = getGameById('colorpicker')!;
  const engine = useGameEngine({ gameId: 'colorpicker' });
  const [hue, setHue] = useState(200);
  const [saturation, setSaturation] = useState(70);
  const [lightness, setLightness] = useState(50);
  const [copied, setCopied] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);

  const hslToHex = (h: number, s: number, l: number): string => {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
  };

  const hslToRgb = (h: number, s: number, l: number): string => {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      return Math.round(255 * (l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)));
    };
    return `rgb(${f(0)}, ${f(8)}, ${f(4)})`;
  };

  const hslStr = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  const hexStr = hslToHex(hue, saturation, lightness);
  const rgbStr = hslToRgb(hue, saturation, lightness);

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    playCollect();
    setTimeout(() => setCopied(''), 1500);
  };

  const addFavorite = () => {
    if (!favorites.includes(hexStr)) {
      setFavorites(f => [hexStr, ...f.slice(0, 11)]);
      playWin();
    }
  };

  const handleStart = () => {
    engine.startGame();
    setHue(Math.floor(Math.random() * 360));
  };

  return (
    <GameWrapper config={config} gameState={engine.gameState} onStart={handleStart} onPause={engine.pauseGame} onResume={engine.resumeGame} onRestart={handleStart} onBack={onBack}>
      <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center p-4 overflow-auto">
        <div className="w-full max-w-md">
          {/* Color preview */}
          <div className="w-full aspect-video rounded-3xl mb-6 shadow-2xl relative overflow-hidden"
            style={{ background: hslStr }}>
            <button onClick={addFavorite}
              className="absolute top-3 right-3 w-10 h-10 rounded-full bg-black/30 backdrop-blur flex items-center justify-center hover:bg-black/50 transition-colors">
              ❤️
            </button>
          </div>

          {/* Sliders */}
          <div className="bg-slate-800/50 rounded-2xl p-4 mb-4 space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1"><span className="text-slate-400">Hue</span><span className="text-white">{hue}°</span></div>
              <input type="range" min="0" max="360" value={hue} onChange={e => setHue(parseInt(e.target.value))}
                className="w-full h-3 rounded-full appearance-none cursor-pointer"
                style={{ background: 'linear-gradient(to right, hsl(0,100%,50%), hsl(60,100%,50%), hsl(120,100%,50%), hsl(180,100%,50%), hsl(240,100%,50%), hsl(300,100%,50%), hsl(360,100%,50%))' }} />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1"><span className="text-slate-400">Saturation</span><span className="text-white">{saturation}%</span></div>
              <input type="range" min="0" max="100" value={saturation} onChange={e => setSaturation(parseInt(e.target.value))}
                className="w-full accent-indigo-500" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1"><span className="text-slate-400">Lightness</span><span className="text-white">{lightness}%</span></div>
              <input type="range" min="0" max="100" value={lightness} onChange={e => setLightness(parseInt(e.target.value))}
                className="w-full accent-indigo-500" />
            </div>
          </div>

          {/* Values */}
          <div className="space-y-2">
            {[
              { label: 'HEX', value: hexStr },
              { label: 'RGB', value: rgbStr },
              { label: 'HSL', value: hslStr },
            ].map(({ label, value }) => (
              <button key={label} onClick={() => copy(value, label)}
                className="w-full flex justify-between items-center p-3 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 transition-colors">
                <span className="text-slate-400 text-sm">{label}</span>
                <span className="font-mono text-white">{copied === label ? '✓ Copied!' : value}</span>
              </button>
            ))}
          </div>

          {/* Favorites */}
          {favorites.length > 0 && (
            <div className="mt-4">
              <div className="text-xs text-slate-500 mb-2">Favorites</div>
              <div className="flex gap-2 flex-wrap">
                {favorites.map((c, i) => (
                  <button key={i} onClick={() => copy(c, '')}
                    className="w-10 h-10 rounded-lg border-2 border-white/10 hover:border-white/30 transition-colors"
                    style={{ background: c }} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </GameWrapper>
  );
}

// ==================== NOTES APP ====================
export function NotesApp({ onBack }: { onBack: () => void }) {
  const config = getGameById('notes')!;
  const engine = useGameEngine({ gameId: 'notes' });
  const [notes, setNotes] = useState<{ id: number; text: string; color: string; created: number }[]>([]);
  const [currentNote, setCurrentNote] = useState('');
  const [selectedColor, setSelectedColor] = useState('#fbbf24');
  const nextId = useRef(1);

  const COLORS = ['#fbbf24', '#ef4444', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];

  const addNote = () => {
    if (!currentNote.trim()) return;
    setNotes(n => [{
      id: nextId.current++,
      text: currentNote,
      color: selectedColor,
      created: Date.now()
    }, ...n]);
    setCurrentNote('');
    playCollect();
    engine.updateState({ score: notes.length + 1 });
  };

  const deleteNote = (id: number) => {
    setNotes(n => n.filter(note => note.id !== id));
    playClick();
  };

  const handleStart = () => {
    engine.startGame();
    setNotes([]);
    setCurrentNote('');
  };

  return (
    <GameWrapper config={config} gameState={engine.gameState} onStart={handleStart} onPause={engine.pauseGame} onResume={engine.resumeGame} onRestart={handleStart} onBack={onBack}>
      <div className="absolute inset-0 bg-slate-900 flex flex-col p-4 overflow-auto">
        <div className="max-w-lg mx-auto w-full">
          <div className="text-center mb-4">
            <div className="text-3xl mb-1">📝</div>
            <h2 className="text-xl font-bold">Quick Notes</h2>
          </div>

          {/* Add note */}
          <div className="bg-slate-800/50 rounded-2xl p-4 mb-4">
            <textarea
              value={currentNote}
              onChange={e => setCurrentNote(e.target.value)}
              placeholder="Write a note..."
              className="w-full bg-transparent text-white placeholder-slate-500 resize-none focus:outline-none"
              rows={3}
            />
            <div className="flex justify-between items-center mt-2">
              <div className="flex gap-1.5">
                {COLORS.map(c => (
                  <button key={c} onClick={() => setSelectedColor(c)}
                    className={`w-6 h-6 rounded-full transition-transform ${selectedColor === c ? 'scale-125 ring-2 ring-white/50' : 'hover:scale-110'}`}
                    style={{ background: c }} />
                ))}
              </div>
              <button onClick={addNote}
                className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 font-bold text-sm transition-colors">
                Add
              </button>
            </div>
          </div>

          {/* Notes list */}
          <div className="space-y-3">
            {notes.map(note => (
              <div key={note.id}
                className="rounded-xl p-4 relative group"
                style={{ background: note.color + '20', borderLeft: `4px solid ${note.color}` }}>
                <p className="text-white text-sm whitespace-pre-wrap">{note.text}</p>
                <div className="text-xs text-slate-500 mt-2">
                  {new Date(note.created).toLocaleTimeString()}
                </div>
                <button onClick={() => deleteNote(note.id)}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500/50 hover:bg-red-500 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                  ✕
                </button>
              </div>
            ))}
          </div>

          {notes.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <div className="text-4xl mb-2">📋</div>
              <p>No notes yet. Add one above!</p>
            </div>
          )}
        </div>
      </div>
    </GameWrapper>
  );
}
