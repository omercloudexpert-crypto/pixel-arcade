// Core types for the arcade hub

export interface GameConfig {
  id: string;
  title: string;
  description: string;
  category: GameCategory;
  icon: string; // emoji
  color: string; // gradient colors
  instructions: string;
  controls: {
    keyboard: string[];
    touch: string[];
  };
}

export type GameCategory =
  | 'arcade'
  | 'puzzle'
  | 'action'
  | 'strategy'
  | 'sports'
  | 'adventure'
  | 'card'
  | 'word'
  | 'casual'
  | 'tools';

export interface GameStats {
  highScore: number;
  playCount: number;
  totalTime: number; // seconds
  lastPlayed: number; // timestamp
  achievements: string[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  gameId: string;
  condition: string;
  unlocked: boolean;
  unlockedAt?: number;
}

export interface ArcadeSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  volume: number;
  theme: 'dark' | 'light' | 'neon';
  showFps: boolean;
  particleEffects: boolean;
}

export interface GameState {
  score: number;
  level: number;
  lives: number;
  status: 'menu' | 'playing' | 'paused' | 'gameover';
  highScore: number;
}

// Base game engine interface
export interface GameEngine {
  init: (canvas: HTMLCanvasElement) => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  restart: () => void;
  destroy: () => void;
  getState: () => GameState;
  onStateChange?: (state: GameState) => void;
}
