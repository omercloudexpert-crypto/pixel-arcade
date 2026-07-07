// GameWrapper - Premium UI wrapper for all games
import React, { useState, useEffect, useCallback } from 'react';
import { GameConfig, GameState } from '../types';
import { getGameStats } from '../utils/storage';
import { playClick, playGameOver, isMuted, setMuted } from '../utils/sound';

interface GameWrapperProps {
  config: GameConfig;
  gameState: GameState;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onRestart: () => void;
  onBack: () => void;
  children: React.ReactNode;
  extraHud?: React.ReactNode;
}

export default function GameWrapper({
  config,
  gameState,
  onStart,
  onPause,
  onResume,
  onRestart,
  onBack,
  children,
  extraHud,
}: GameWrapperProps) {
  const [soundOn, setSoundOn] = useState(!isMuted());
  const [showInstructions, setShowInstructions] = useState(false);
  const stats = getGameStats(config.id);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (gameState.status === 'playing') onPause();
        else if (gameState.status === 'paused') onResume();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [gameState.status, onPause, onResume]);

  const toggleSound = useCallback(() => {
    const n = !soundOn; setSoundOn(n); setMuted(!n);
  }, [soundOn]);

  // ===== START SCREEN =====
  if (gameState.status === 'menu') {
    return (
      <div className="game-container">
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 z-10"
          style={{ background: 'linear-gradient(180deg, #050816 0%, #0a0f1f 50%, #050816 100%)' }}>
          {/* Floating orbs */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="orb orb-1" style={{ top: '20%', left: '15%' }} />
            <div className="orb orb-2" style={{ bottom: '20%', right: '15%' }} />
          </div>

          <button onClick={() => { playClick(); onBack(); }}
            className="absolute top-4 left-4 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.06] transition-all text-sm font-medium backdrop-blur-sm z-20">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
            Back
          </button>

          <button onClick={toggleSound}
            className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.06] transition-all flex items-center justify-center text-lg z-20">
            {soundOn ? '🔊' : '🔇'}
          </button>

          <div className="animate-scale-in text-center max-w-md relative z-10">
            <div className="text-7xl sm:text-8xl mb-5 animate-float drop-shadow-2xl">{config.icon}</div>
            <h1 className="text-4xl sm:text-5xl font-black mb-2 tracking-tight gradient-text">{config.title}</h1>
            <p className="text-slate-400 mb-5 text-sm leading-relaxed max-w-xs mx-auto">{config.description}</p>

            {stats.highScore > 0 && (
              <div className="mb-5 inline-flex items-center gap-2 px-5 py-2 rounded-2xl bg-yellow-500/10 border border-yellow-500/20">
                <span className="text-lg">🏆</span>
                <span className="text-yellow-300 font-bold text-sm">High Score: {stats.highScore.toLocaleString()}</span>
              </div>
            )}

            {stats.playCount > 0 && (
              <div className="mb-5 flex justify-center gap-4 text-xs text-slate-500">
                <span>▶ Played {stats.playCount} times</span>
              </div>
            )}

            <div className="flex flex-col gap-3 mt-4">
              <button onClick={() => { playClick(); onStart(); }}
                className="group px-10 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-black text-lg transition-all transform hover:scale-105 shadow-xl shadow-indigo-500/25 animate-pulse-glow flex items-center justify-center gap-2">
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                PLAY
              </button>
              <button onClick={() => { playClick(); setShowInstructions(!showInstructions); }}
                className="px-6 py-2.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.06] text-white/70 transition-all text-sm font-medium">
                {showInstructions ? '✕ Close' : '📖 How to Play'}
              </button>
            </div>

            {showInstructions && (
              <div className="mt-5 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-left animate-fade-in backdrop-blur-sm">
                <p className="text-slate-300 text-sm mb-4 leading-relaxed">{config.instructions}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-bold mb-2">
                      <span>⌨️</span> Keyboard
                    </div>
                    <ul className="text-xs text-slate-400 space-y-1">
                      {config.controls.keyboard.map((c, i) => <li key={i} className="flex items-start gap-1.5"><span className="text-slate-600 mt-0.5">•</span>{c}</li>)}
                    </ul>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-pink-400 font-bold mb-2">
                      <span>📱</span> Touch
                    </div>
                    <ul className="text-xs text-slate-400 space-y-1">
                      {config.controls.touch.map((c, i) => <li key={i} className="flex items-start gap-1.5"><span className="text-slate-600 mt-0.5">•</span>{c}</li>)}
                    </ul>
                  </div>
                </div>
                <p className="text-[10px] text-slate-600 mt-3 text-center">Press ESC to pause during gameplay</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container relative">
      {children}

      {/* HUD */}
      {gameState.status === 'playing' && (
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-2.5 py-2 pointer-events-none z-20">
          <div className="flex items-center gap-1.5 pointer-events-auto">
            <button onClick={() => { playClick(); onPause(); }}
              className="w-8 h-8 rounded-lg bg-black/40 hover:bg-black/60 flex items-center justify-center text-xs transition-colors backdrop-blur-md border border-white/5">
              ⏸
            </button>
            <button onClick={toggleSound}
              className="w-8 h-8 rounded-lg bg-black/40 hover:bg-black/60 flex items-center justify-center text-xs transition-colors backdrop-blur-md border border-white/5">
              {soundOn ? '🔊' : '🔇'}
            </button>
          </div>
          <div className="flex items-center gap-2 text-xs pointer-events-none">
            <div className="px-3 py-1.5 rounded-lg bg-black/40 backdrop-blur-md border border-white/5 font-bold">
              <span className="text-yellow-300">{gameState.score.toLocaleString()}</span>
            </div>
            {extraHud}
          </div>
        </div>
      )}

      {/* Pause */}
      {gameState.status === 'paused' && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-30 animate-fade-in">
          <div className="bg-slate-800/90 backdrop-blur-xl rounded-3xl p-7 text-center max-w-xs w-full mx-4 border border-white/10 animate-scale-in shadow-2xl">
            <div className="text-4xl mb-2">⏸</div>
            <h2 className="text-2xl font-black mb-1">Paused</h2>
            <p className="text-slate-400 text-sm mb-5">Score: {gameState.score.toLocaleString()}</p>
            <div className="flex flex-col gap-2.5">
              <button onClick={() => { playClick(); onResume(); }}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 font-bold transition-all text-sm shadow-lg shadow-indigo-500/20">
                ▶ Resume
              </button>
              <button onClick={() => { playClick(); onRestart(); }}
                className="px-6 py-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.06] transition-all text-sm font-medium">
                🔄 Restart
              </button>
              <button onClick={() => { playClick(); onBack(); }}
                className="px-6 py-2.5 rounded-2xl hover:bg-white/[0.05] transition-all text-sm text-slate-400">
                🏠 Home
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over */}
      {gameState.status === 'gameover' && (
        <GameOverScreen gameState={gameState}
          onRestart={() => { playClick(); onRestart(); }}
          onBack={() => { playClick(); onBack(); }} />
      )}
    </div>
  );
}

function GameOverScreen({ gameState, onRestart, onBack }: {
  gameState: GameState; onRestart: () => void; onBack: () => void;
}) {
  const isNewHigh = gameState.score >= gameState.highScore && gameState.score > 0;

  useEffect(() => { playGameOver(); }, []);

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-30 animate-fade-in">
      <div className="bg-slate-800/90 backdrop-blur-xl rounded-3xl p-7 text-center max-w-xs w-full mx-4 border border-white/10 animate-scale-in shadow-2xl">
        <div className="text-5xl mb-3">{isNewHigh ? '🏆' : '💀'}</div>
        <h2 className="text-2xl font-black mb-1">
          {isNewHigh ? <span className="gradient-text-gold">New High Score!</span> : 'Game Over'}
        </h2>

        <div className="my-5 space-y-2">
          <div className="flex justify-between items-center px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
            <span className="text-slate-400 text-sm">Score</span>
            <span className="text-xl font-black text-white">{gameState.score.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
            <span className="text-slate-400 text-sm">Best</span>
            <span className={`text-lg font-bold ${isNewHigh ? 'gradient-text-gold' : 'text-slate-300'}`}>
              {gameState.highScore.toLocaleString()}
            </span>
          </div>
          {gameState.level > 1 && (
            <div className="flex justify-between items-center px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
              <span className="text-slate-400 text-sm">Level</span>
              <span className="text-lg font-bold text-indigo-400">{gameState.level}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2.5">
          <button onClick={onRestart}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 font-bold transition-all text-sm shadow-lg shadow-indigo-500/20">
            🔄 Play Again
          </button>
          <button onClick={onBack}
            className="px-6 py-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.06] transition-all text-sm font-medium text-slate-300">
            🏠 Home
          </button>
        </div>
      </div>
    </div>
  );
}
