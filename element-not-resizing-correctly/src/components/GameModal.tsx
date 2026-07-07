import { Game, categoryColors } from '../types';

interface GameModalProps {
  game: Game;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onClose: () => void;
}

export default function GameModal({ game, isFavorite, onToggleFavorite, onClose }: GameModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Game Preview Area */}
        <div className={`w-full aspect-video bg-gradient-to-br ${game.gradient} flex items-center justify-center relative`}>
          <span className="text-7xl sm:text-8xl">{game.emoji}</span>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Game Info */}
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-xl sm:text-2xl font-bold text-white">{game.name}</h3>
              <p className="text-sm text-slate-400 mt-1">{game.description}</p>
            </div>
            <span className={`shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium text-white ${categoryColors[game.category]}`}>
              {game.category}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-5">
            <button className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold text-sm hover:from-purple-600 hover:to-indigo-700 transition-all">
              ▶ Play Now
            </button>
            <button
              onClick={() => onToggleFavorite(game.id)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isFavorite
                  ? 'bg-yellow-400/20 text-yellow-300 ring-1 ring-yellow-500/50'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {isFavorite ? '★ Saved' : '☆ Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
