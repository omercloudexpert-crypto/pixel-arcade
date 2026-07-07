import { useState, useEffect, useRef } from 'react';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  gameCount: number;
  soundOn: boolean;
  onToggleSound: () => void;
}

export default function Header({ searchQuery, onSearchChange, gameCount, soundOn, onToggleSound }: HeaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && !isSearchFocused) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isSearchFocused]);

  return (
    <header className="sticky top-0 z-50 bg-[#0f1729]/95 backdrop-blur-sm border-b border-slate-800">
      <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-4 md:px-6 py-2.5 flex items-center gap-2 sm:gap-4 flex-wrap sm:flex-nowrap">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
            <span className="text-lg">🎮</span>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold text-white tracking-wider uppercase leading-none">Pixel Arcade</h1>
            <p className="text-[10px] text-slate-500">{gameCount} Games</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className={`relative flex-1 min-w-0 order-3 sm:order-2 w-full sm:w-auto ${isSearchFocused ? 'ring-2 ring-purple-500' : ''} rounded-lg`}>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search games... (press /)"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className="w-full bg-slate-800/80 border border-slate-700 rounded-lg py-2 pl-9 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 sm:gap-2 order-2 sm:order-3 ml-auto sm:ml-0">
          <button className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors" title="Theme">
            <span className="text-base">🎨</span>
          </button>
          <button className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors" title="Favorites">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>
          <button
            onClick={onToggleSound}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            title={soundOn ? 'Mute' : 'Unmute'}
          >
            {soundOn ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M17.95 6.05a8 8 0 010 11.9M11 5L6 9H2v6h4l5 4V5z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            )}
          </button>
          <button className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors" title="Fullscreen">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
