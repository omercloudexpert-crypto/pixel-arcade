interface HeroBannerProps {
  gameCount: number;
  onRandomGame: () => void;
  onShowFavorites: () => void;
  showFavorites: boolean;
}

export default function HeroBanner({ gameCount, onRandomGame, onShowFavorites, showFavorites }: HeroBannerProps) {
  return (
    <div className="text-center py-6 sm:py-8 md:py-10 px-4">
      <div className="flex items-center justify-center gap-2 mb-3">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span className="text-xs sm:text-sm text-slate-400">{gameCount} Games Available — Free &amp; No Ads</span>
      </div>
      
      <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black italic tracking-tight bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 bg-clip-text text-transparent leading-tight">
        Play. Compete. Repeat.
      </h2>
      
      <p className="text-sm sm:text-base text-slate-400 mt-2 mb-4 sm:mb-6">
        Instant browser games — no downloads, no signups. Just pure fun.
      </p>

      <div className="flex items-center justify-center gap-3 flex-wrap">
        <button
          onClick={onRandomGame}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-sm font-medium hover:from-purple-600 hover:to-indigo-700 transition-all shadow-lg shadow-purple-500/25"
        >
          <span>🎲</span> Random Game
        </button>
        <button
          onClick={onShowFavorites}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
            showFavorites
              ? 'bg-yellow-400 text-yellow-900'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <span>⭐</span> Favorites
        </button>
      </div>
    </div>
  );
}
