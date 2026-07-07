import { useState } from 'react';
import { Game, categoryColors } from '../types';

interface GameCardProps {
  game: Game;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
}

export default function GameCard({ game, isFavorite, onToggleFavorite }: GameCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="group flex flex-col cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Card Image Area */}
      <div className={`relative w-full aspect-[4/3] rounded-xl bg-gradient-to-br ${game.gradient} overflow-hidden transition-transform duration-200 ${hovered ? 'scale-[1.03]' : ''}`}>
        {/* Emoji Icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-5xl sm:text-6xl transition-transform duration-200 ${hovered ? 'scale-110' : ''}`}>
            {game.emoji}
          </span>
        </div>

        {/* Category Badge */}
        <div className="absolute bottom-2 left-2">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium text-white ${categoryColors[game.category]}`}>
            {game.category}
          </span>
        </div>

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(game.id);
          }}
          className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 ${
            isFavorite
              ? 'bg-yellow-400 text-yellow-900'
              : 'bg-black/30 text-white/70 hover:bg-black/50 hover:text-white'
          }`}
        >
          <svg className="w-3.5 h-3.5" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </button>
      </div>

      {/* Card Info */}
      <div className="mt-2 px-0.5 min-w-0">
        <h3 className="text-sm font-semibold text-white truncate">{game.name}</h3>
        <p className="text-xs text-slate-400 truncate">{game.description}</p>
      </div>
    </div>
  );
}
