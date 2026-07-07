// Base hook for canvas-based games
import { useRef, useEffect, useCallback, useState } from 'react';
import { GameState } from '../types';
import { getGameStats, updateHighScore, incrementPlayCount, saveGameStats } from '../utils/storage';

export interface UseGameEngineOptions {
  gameId: string;
  onStateChange?: (state: GameState) => void;
}

export function useGameEngine({ gameId, onStateChange }: UseGameEngineOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    level: 1,
    lives: 3,
    status: 'menu',
    highScore: getGameStats(gameId).highScore,
  });

  const updateState = useCallback((updates: Partial<GameState>) => {
    setGameState(prev => {
      const next = { ...prev, ...updates };
      onStateChange?.(next);
      return next;
    });
  }, [onStateChange]);

  const startGame = useCallback(() => {
    incrementPlayCount(gameId);
    startTimeRef.current = Date.now();
    updateState({ status: 'playing', score: 0, level: 1, lives: 3 });
  }, [gameId, updateState]);

  const pauseGame = useCallback(() => {
    updateState({ status: 'paused' });
  }, [updateState]);

  const resumeGame = useCallback(() => {
    updateState({ status: 'playing' });
  }, [updateState]);

  const gameOver = useCallback((finalScore: number) => {
    const isNewHigh = updateHighScore(gameId, finalScore);
    const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const stats = getGameStats(gameId);
    saveGameStats(gameId, { totalTime: stats.totalTime + elapsed });
    updateState({
      status: 'gameover',
      score: finalScore,
      highScore: isNewHigh ? finalScore : stats.highScore,
    });
  }, [gameId, updateState]);

  const restartGame = useCallback(() => {
    startGame();
  }, [startGame]);

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  return {
    canvasRef,
    animFrameRef,
    gameState,
    updateState,
    startGame,
    pauseGame,
    resumeGame,
    gameOver,
    restartGame,
  };
}
