import { create } from 'zustand';

interface GameState {
  screen: 'menu' | 'playing' | 'paused' | 'settings';
  setScreen: (screen: 'menu' | 'playing' | 'paused' | 'settings') => void;
  
  graphics: {
    quality: 'low' | 'medium' | 'high' | 'ultra';
    bloom: boolean;
    ssao: boolean;
    shadows: boolean;
  };
  setGraphics: (key: string, value: any) => void;

  audio: {
    master: number;
    sfx: number;
    music: number;
  };
  setAudio: (key: string, value: number) => void;

  player: {
    mode: 'walking' | 'driving';
    position: [number, number, number];
    rotation: number;
    speed: number;
    rpm: number;
    gear: number;
  };
  updatePlayer: (data: Partial<GameState['player']>) => void;
}

export const useGameStore = create<GameState>((set) => ({
  screen: 'menu',
  setScreen: (screen) => set({ screen }),
  
  graphics: {
    quality: 'high',
    bloom: true,
    ssao: true,
    shadows: true,
  },
  setGraphics: (key, value) => set((state) => ({ 
    graphics: { ...state.graphics, [key]: value } 
  })),

  audio: {
    master: 0.8,
    sfx: 0.7,
    music: 0.5,
  },
  setAudio: (key, value) => set((state) => ({ 
    audio: { ...state.audio, [key]: value } 
  })),

  player: {
    mode: 'walking',
    position: [0, 2, 0],
    rotation: 0,
    speed: 0,
    rpm: 0,
    gear: 1,
  },
  updatePlayer: (data) => set((state) => ({ 
    player: { ...state.player, ...data } 
  })),
}));
