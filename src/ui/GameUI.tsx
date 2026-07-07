import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';
import { gsap } from 'gsap';

export const MainMenu = () => {
  const { setScreen } = useGameStore();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(containerRef.current.children, 
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: "power3.out" }
      );
    }
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md text-white">
      <h1 className="text-7xl font-black tracking-tighter mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600 drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]">
        CYBER<span className="text-white">DRIFT</span>
      </h1>
      <p className="text-gray-400 mb-12 tracking-widest text-sm uppercase">Open World AAA Experience</p>
      
      <div className="flex flex-col gap-4 w-64">
        <button 
          onClick={() => setScreen('playing')}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-4 px-8 rounded-lg shadow-lg shadow-purple-900/50 transform transition hover:scale-105 active:scale-95"
        >
          PLAY GAME
        </button>
        <button 
          onClick={() => setScreen('settings')}
          className="bg-gray-800/80 hover:bg-gray-700 text-white font-bold py-3 px-8 rounded-lg border border-gray-700 transition"
        >
          SETTINGS
        </button>
      </div>

      <div className="absolute bottom-8 text-gray-600 text-xs">
        WASD to Drive | SPACE to Handbrake | E to Enter/Exit Vehicle
      </div>
    </div>
  );
};

export const HUD = () => {
  const { player, screen, setScreen } = useGameStore();

  if (screen !== 'playing') return null;

  return (
    <div className="absolute inset-0 z-40 pointer-events-none">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start">
        <div className="bg-black/60 backdrop-blur-md p-4 rounded-xl border border-white/10 text-white pointer-events-auto">
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Speed</div>
          <div className="text-4xl font-black italic">
            {Math.floor(player.speed)} <span className="text-lg text-gray-500 not-italic">KM/H</span>
          </div>
        </div>
        
        <button 
          onClick={() => setScreen('paused')}
          className="bg-black/60 backdrop-blur-md p-3 rounded-full border border-white/10 text-white hover:bg-white/10 transition pointer-events-auto"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>

      {/* Bottom Bar (RPM & Gear) */}
      <div className="absolute bottom-8 right-8 flex flex-col items-end gap-2">
        <div className="bg-black/60 backdrop-blur-md px-6 py-3 rounded-xl border border-white/10 text-white flex items-center gap-4">
          <div className="text-3xl font-black text-yellow-400">{player.gear}</div>
          <div className="flex flex-col">
            <div className="text-[10px] text-gray-400 uppercase">RPM</div>
            <div className="text-xl font-bold">{Math.floor(player.rpm)}</div>
          </div>
        </div>
        
        {/* RPM Bar */}
        <div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-600 transition-all duration-100"
            style={{ width: `${(player.rpm / 8000) * 100}%` }}
          />
        </div>
      </div>

      {/* Minimap (Fake) */}
      <div className="absolute bottom-8 left-8 w-32 h-32 bg-black/60 backdrop-blur-md rounded-full border-2 border-white/10 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_10px_white]" />
        </div>
        {/* Grid lines for minimap effect */}
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
      </div>
    </div>
  );
};

export const PauseMenu = () => {
  const { setScreen } = useGameStore();
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md text-white">
      <h2 className="text-5xl font-black mb-8">PAUSED</h2>
      <div className="flex flex-col gap-4 w-64">
        <button onClick={() => setScreen('playing')} className="bg-white text-black font-bold py-3 px-8 rounded-lg hover:bg-gray-200 transition">RESUME</button>
        <button onClick={() => setScreen('menu')} className="bg-gray-800 text-white font-bold py-3 px-8 rounded-lg border border-gray-700 hover:bg-gray-700 transition">MAIN MENU</button>
      </div>
    </div>
  );
};

export const SettingsMenu = () => {
  const { setScreen, graphics, setGraphics, audio, setAudio } = useGameStore();
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-md text-white p-8">
      <h2 className="text-4xl font-black mb-8">SETTINGS</h2>
      <div className="w-full max-w-md space-y-6 bg-gray-900/50 p-8 rounded-2xl border border-gray-800">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Graphics Quality</label>
          <select 
            value={graphics.quality} 
            onChange={(e) => setGraphics('quality', e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="ultra">Ultra</option>
          </select>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-300">Bloom</span>
          <button onClick={() => setGraphics('bloom', !graphics.bloom)} className={`w-12 h-6 rounded-full transition ${graphics.bloom ? 'bg-purple-600' : 'bg-gray-700'}`}>
            <div className={`w-4 h-4 bg-white rounded-full m-1 transition ${graphics.bloom ? 'translate-x-6' : ''}`} />
          </button>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">Master Volume</label>
          <input 
            type="range" min="0" max="1" step="0.1" 
            value={audio.master} 
            onChange={(e) => setAudio('master', parseFloat(e.target.value))}
            className="w-full accent-purple-600"
          />
        </div>
      </div>
      <button onClick={() => setScreen('menu')} className="mt-8 text-gray-400 hover:text-white">BACK</button>
    </div>
  );
};
