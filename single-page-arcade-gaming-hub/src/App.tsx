// Pixel Arcade - Premium Browser Gaming Hub
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { GameConfig } from './types';
import { gameRegistry, getCategories, searchGames, getRandomGame, getGamesByCategory } from './games/registry';
import { getRecentlyPlayed, getMostPlayed, getFavorites, toggleFavorite, getTotalStats, getAllGameStats } from './utils/storage';
import { playClick, playMenuSelect, setMuted, isMuted } from './utils/sound';
import GameLoader from './games/GameLoader';

const CAT_META: Record<string, { label: string; icon: string; gradient: string }> = {
  all: { label: 'All Games', icon: '🎮', gradient: 'from-indigo-500 to-purple-500' },
  arcade: { label: 'Arcade', icon: '👾', gradient: 'from-green-500 to-emerald-600' },
  puzzle: { label: 'Puzzle', icon: '🧩', gradient: 'from-blue-500 to-cyan-500' },
  action: { label: 'Action', icon: '⚔️', gradient: 'from-red-500 to-orange-500' },
  strategy: { label: 'Strategy', icon: '♟️', gradient: 'from-amber-500 to-yellow-500' },
  casual: { label: 'Casual', icon: '🎯', gradient: 'from-pink-500 to-rose-500' },
  word: { label: 'Word', icon: '📝', gradient: 'from-teal-500 to-green-500' },
  sports: { label: 'Sports', icon: '⚽', gradient: 'from-sky-500 to-blue-500' },
  card: { label: 'Cards', icon: '🃏', gradient: 'from-purple-500 to-violet-500' },
  adventure: { label: 'Adventure', icon: '🗺️', gradient: 'from-amber-600 to-orange-600' },
  tools: { label: 'Tools', icon: '🔧', gradient: 'from-slate-500 to-gray-600' },
};

export default function App() {
  const [currentGame, setCurrentGame] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showStats, setShowStats] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(!isMuted());
  const [favorites, setFavorites] = useState<string[]>(getFavorites());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const filteredGames = useMemo(() => {
    let games = searchQuery ? searchGames(searchQuery) : getGamesByCategory(activeCategory);
    if (showFavoritesOnly) games = games.filter(g => favorites.includes(g.id));
    return games;
  }, [searchQuery, activeCategory, showFavoritesOnly, favorites]);

  const recentlyPlayed = useMemo(() => getRecentlyPlayed(8).map(id => gameRegistry.find(g => g.id === id)!).filter(Boolean), [currentGame]);
  const mostPlayed = useMemo(() => getMostPlayed(8).map(id => gameRegistry.find(g => g.id === id)!).filter(Boolean), [currentGame]);
  const categories = useMemo(() => getCategories(), []);
  const allStats = useMemo(() => getAllGameStats(), [currentGame]);

  const openGame = useCallback((gameId: string) => {
    playClick();
    setTransitioning(true);
    setTimeout(() => { setCurrentGame(gameId); setTransitioning(false); }, 250);
  }, []);

  const closeGame = useCallback(() => {
    setTransitioning(true);
    setTimeout(() => { setCurrentGame(null); setTransitioning(false); }, 250);
  }, []);

  const handleToggleFavorite = useCallback((gameId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    playMenuSelect();
    toggleFavorite(gameId);
    setFavorites(getFavorites());
  }, []);

  const toggleSound = useCallback(() => {
    const n = !soundEnabled; setSoundEnabled(n); setMuted(!n);
  }, [soundEnabled]);

  const handleRandomGame = useCallback(() => openGame(getRandomGame().id), [openGame]);

  // Keyboard shortcut
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === '/' && !currentGame && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentGame]);

  if (currentGame) {
    return (
      <div className={`w-full h-full transition-opacity duration-250 ${transitioning ? 'opacity-0' : 'opacity-100'}`}>
        <GameLoader gameId={currentGame} onBack={closeGame} />
      </div>
    );
  }

  const totalStats = getTotalStats();

  return (
    <div className={`w-full h-full overflow-y-auto overflow-x-hidden transition-opacity duration-250 ${transitioning ? 'opacity-0' : 'opacity-100'}`}
      style={{ background: 'linear-gradient(180deg, #050816 0%, #0a0f1f 50%, #050816 100%)' }}>

      {/* Floating orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="orb orb-1" style={{ top: '10%', left: '10%' }} />
        <div className="orb orb-2" style={{ top: '60%', right: '5%' }} />
        <div className="orb orb-3" style={{ top: '30%', right: '30%' }} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg shadow-lg shadow-indigo-500/20">
              🕹️
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base font-black tracking-tight gradient-text">PIXEL ARCADE</h1>
              <p className="text-[10px] text-slate-500 -mt-0.5 font-medium">{gameRegistry.length} Games</p>
            </div>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-lg mx-2">
            <div className="relative group">
              <input ref={searchRef} type="text" placeholder="Search games... (press /)"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setActiveCategory('all'); setShowFavoritesOnly(false); }}
                className="w-full px-4 py-2.5 pl-10 rounded-2xl bg-white/[0.04] border border-white/[0.06] text-white placeholder-slate-500 focus:bg-white/[0.07] focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all"
              />
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="11" cy="11" r="8" strokeWidth="2"/><path strokeLinecap="round" strokeWidth="2" d="m21 21-4.35-4.35"/></svg>
              {searchQuery && (
                <button onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs text-slate-400 transition-colors">✕</button>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button onClick={handleRandomGame} title="Random Game"
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 hover:border-indigo-400/40 flex items-center justify-center text-sm transition-all hover:scale-105">
              🎲
            </button>
            <button onClick={() => { setShowFavoritesOnly(!showFavoritesOnly); setSearchQuery(''); playClick(); }}
              title="Favorites"
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm transition-all hover:scale-105 ${showFavoritesOnly ? 'bg-yellow-500/20 border border-yellow-500/40' : 'bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08]'}`}>
              {showFavoritesOnly ? '⭐' : '☆'}
            </button>
            <button onClick={toggleSound} title={soundEnabled ? 'Mute' : 'Unmute'}
              className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] flex items-center justify-center text-sm transition-all">
              {soundEnabled ? '🔊' : '🔇'}
            </button>
            <button onClick={() => setShowStats(!showStats)} title="Stats"
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm transition-all ${showStats ? 'bg-indigo-500/20 border border-indigo-500/40' : 'bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08]'}`}>
              📊
            </button>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-24">
        {/* Stats Panel */}
        {showStats && (
          <div className="mb-6 animate-fade-in-scale">
            <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5 backdrop-blur-sm">
              <h3 className="section-heading mb-4"><span>📊</span> Your Stats</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon: '🎮', val: totalStats.totalGamesPlayed, label: 'Games Played' },
                  { icon: '⏱️', val: `${Math.floor(totalStats.totalTimePlayed / 60)}m`, label: 'Time Played' },
                  { icon: '🏆', val: totalStats.gamesWithHighScore, label: 'High Scores' },
                  { icon: '🎯', val: gameRegistry.length, label: 'Total Games' },
                ].map((s, i) => (
                  <div key={i} className="stat-glow rounded-xl bg-white/[0.03] border border-white/[0.05] p-4 text-center">
                    <div className="text-2xl mb-1">{s.icon}</div>
                    <div className="text-2xl font-black text-white">{s.val}</div>
                    <div className="text-[11px] text-slate-500 font-medium mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Hero */}
        {!searchQuery && !showFavoritesOnly && !showStats && (
          <div className="text-center py-8 sm:py-10 mb-2 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              {gameRegistry.length} Games Available — Free & No Ads
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-3">
              <span className="gradient-text">Play. Compete. Repeat.</span>
            </h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto mb-6">
              Instant browser games — no downloads, no signups. Just pure fun.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <button onClick={handleRandomGame}
                className="group px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold text-sm transition-all transform hover:scale-105 shadow-lg shadow-indigo-500/25 flex items-center gap-2">
                <span className="group-hover:animate-spin inline-block">🎲</span> Random Game
              </button>
              <button onClick={() => { setShowFavoritesOnly(true); playClick(); }}
                className="px-6 py-3 rounded-2xl bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.12] text-white font-bold text-sm transition-all flex items-center gap-2">
                ⭐ Favorites {favorites.length > 0 && <span className="px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-[10px]">{favorites.length}</span>}
              </button>
            </div>
          </div>
        )}

        {/* Recently Played Carousel */}
        {!searchQuery && !showFavoritesOnly && recentlyPlayed.length > 0 && (
          <GameRow title="🕐 Continue Playing" games={recentlyPlayed} onPlay={openGame} onFav={handleToggleFavorite} favs={favorites} stats={allStats} />
        )}

        {/* Most Played Carousel */}
        {!searchQuery && !showFavoritesOnly && mostPlayed.length > 0 && (
          <GameRow title="🔥 Most Played" games={mostPlayed} onPlay={openGame} onFav={handleToggleFavorite} favs={favorites} stats={allStats} />
        )}

        {/* Categories */}
        {!searchQuery && (
          <div className="mb-5 flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
            {categories.map(cat => {
              const m = CAT_META[cat] || { label: cat, icon: '📁', gradient: 'from-gray-500 to-gray-600' };
              const isActive = activeCategory === cat && !showFavoritesOnly;
              return (
                <button key={cat} onClick={() => { setActiveCategory(cat); setShowFavoritesOnly(false); playMenuSelect(); }}
                  className={`cat-pill ${isActive ? 'active' : 'bg-white/[0.03] text-slate-400'}`}>
                  <span>{m.icon}</span> {m.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Favorites header */}
        {showFavoritesOnly && (
          <div className="mb-5 flex items-center justify-between animate-fade-in">
            <h3 className="section-heading"><span>⭐</span> Your Favorites</h3>
            <button onClick={() => setShowFavoritesOnly(false)} className="text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              ← All Games
            </button>
          </div>
        )}

        {/* Search results header */}
        {searchQuery && (
          <div className="mb-4 animate-fade-in">
            <p className="text-sm text-slate-400">
              <span className="text-white font-bold">{filteredGames.length}</span> result{filteredGames.length !== 1 ? 's' : ''} for "<span className="text-indigo-300">{searchQuery}</span>"
            </p>
          </div>
        )}

        {/* Game Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {filteredGames.map((game, i) => (
            <GameCard key={game.id} game={game} delay={i} onPlay={openGame}
              onFav={handleToggleFavorite} isFav={favorites.includes(game.id)}
              stats={allStats[game.id]} />
          ))}
        </div>

        {filteredGames.length === 0 && (
          <div className="text-center py-20 animate-fade-in">
            <div className="text-6xl mb-4">{showFavoritesOnly ? '⭐' : '🔍'}</div>
            <h3 className="text-xl font-bold mb-2 text-slate-300">
              {showFavoritesOnly ? 'No favorites yet' : 'No games found'}
            </h3>
            <p className="text-slate-500 text-sm max-w-xs mx-auto">
              {showFavoritesOnly ? 'Click the ☆ on any game to add it to favorites!' : 'Try a different search term.'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

// ============ GAME CARD ============
function GameCard({ game, delay, onPlay, onFav, isFav, stats }: {
  game: GameConfig; delay: number; onPlay: (id: string) => void;
  onFav: (id: string, e: React.MouseEvent) => void; isFav: boolean;
  stats?: { highScore: number; playCount: number };
}) {
  const m = CAT_META[game.category] || { label: game.category, icon: '📁', gradient: 'from-gray-500 to-gray-600' };
  return (
    <div onClick={() => onPlay(game.id)} className="game-card animate-fade-in"
      style={{ animationDelay: `${Math.min(delay * 40, 400)}ms` }}>
      {/* Thumbnail area */}
      <div className={`aspect-[4/3] bg-gradient-to-br ${game.color} relative flex items-center justify-center overflow-hidden`}>
        {/* Subtle pattern */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '20px 20px',
        }} />
        <span className="text-5xl sm:text-6xl drop-shadow-2xl relative z-10 transition-transform duration-500 group-hover:scale-125"
          style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }}>
          {game.icon}
        </span>
        {/* Play overlay */}
        <div className="play-overlay z-20 rounded-t-2xl">
          <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
            <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
        {/* Favorite button */}
        <button onClick={(e) => onFav(game.id, e)}
          className="absolute top-2 right-2 z-30 w-7 h-7 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-sm hover:bg-black/50 transition-all hover:scale-110 border border-white/10">
          {isFav ? '⭐' : '☆'}
        </button>
        {/* Category badge */}
        <div className="absolute bottom-2 left-2 z-10 badge text-white/80">
          <span>{m.icon}</span><span>{m.label}</span>
        </div>
      </div>
      {/* Info */}
      <div className="p-3">
        <h3 className="font-bold text-sm truncate text-white/90">{game.title}</h3>
        <p className="text-[11px] text-slate-500 truncate mt-0.5 leading-relaxed">{game.description}</p>
        {stats && (stats.highScore > 0 || stats.playCount > 0) && (
          <div className="flex items-center gap-2.5 mt-2">
            {stats.highScore > 0 && (
              <span className="badge text-yellow-300/80 bg-yellow-500/10">
                🏆 {stats.highScore >= 10000 ? `${(stats.highScore / 1000).toFixed(1)}k` : stats.highScore.toLocaleString()}
              </span>
            )}
            {stats.playCount > 0 && (
              <span className="badge text-slate-400 bg-white/[0.03]">
                ▶ {stats.playCount}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============ GAME ROW (Horizontal scroll) ============
function GameRow({ title, games, onPlay, onFav, favs, stats }: {
  title: string; games: GameConfig[];
  onPlay: (id: string) => void; onFav: (id: string, e: React.MouseEvent) => void;
  favs: string[]; stats: Record<string, { highScore: number; playCount: number }>;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  return (
    <div className="mb-7 animate-fade-in">
      <h3 className="section-heading mb-3">{title}</h3>
      <div ref={scrollRef} className="flex gap-3 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1 snap-x">
        {games.map((game, i) => (
          <div key={game.id} className="flex-shrink-0 snap-start" style={{ width: 'clamp(140px, 38vw, 180px)' }}>
            <GameCard game={game} delay={i} onPlay={onPlay} onFav={onFav}
              isFav={favs.includes(game.id)} stats={stats[game.id]} />
          </div>
        ))}
      </div>
    </div>
  );
}
