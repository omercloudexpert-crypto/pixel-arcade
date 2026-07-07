import { useState, useMemo, useCallback, useEffect } from 'react';
import Header from './components/Header';
import HeroBanner from './components/HeroBanner';
import CategoryFilter from './components/CategoryFilter';
import GameCard from './components/GameCard';
import GameModal from './components/GameModal';
import { games } from './data/games';
import { Game } from './types';

function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('pixel-arcade-favorites');
      return saved ? new Set(JSON.parse(saved)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      localStorage.setItem('pixel-arcade-favorites', JSON.stringify([...next]));
      return next;
    });
  }, []);

  return { favorites, toggleFavorite };
}

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All Games');
  const [showFavorites, setShowFavorites] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const { favorites, toggleFavorite } = useFavorites();

  // Close modal on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedGame(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const filteredGames = useMemo(() => {
    let result = games;

    if (showFavorites) {
      result = result.filter((g) => favorites.has(g.id));
    }

    if (activeCategory !== 'All Games') {
      result = result.filter((g) => g.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (g) =>
          g.name.toLowerCase().includes(query) ||
          g.description.toLowerCase().includes(query) ||
          g.category.toLowerCase().includes(query)
      );
    }

    return result;
  }, [searchQuery, activeCategory, showFavorites, favorites]);

  const handleRandomGame = useCallback(() => {
    const pool = filteredGames.length > 0 ? filteredGames : games;
    const randomGame = pool[Math.floor(Math.random() * pool.length)];
    setSelectedGame(randomGame);
  }, [filteredGames]);

  const handleToggleFavorites = useCallback(() => {
    setShowFavorites((prev) => !prev);
  }, []);

  return (
    <div className="min-h-screen bg-[#0f1729] flex flex-col">
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        gameCount={games.length}
        soundOn={soundOn}
        onToggleSound={() => setSoundOn(!soundOn)}
      />

      <HeroBanner
        gameCount={games.length}
        onRandomGame={handleRandomGame}
        onShowFavorites={handleToggleFavorites}
        showFavorites={showFavorites}
      />

      <CategoryFilter
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      {/* Game Grid - fully responsive */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
        {filteredGames.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-5xl mb-4">🎮</span>
            <h3 className="text-xl font-semibold text-white mb-2">No games found</h3>
            <p className="text-sm text-slate-400">
              {showFavorites
                ? "You haven't added any favorites yet. Click the star on any game to save it!"
                : 'Try a different search or category.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
            {filteredGames.map((game) => (
              <div key={game.id} onClick={() => setSelectedGame(game)}>
                <GameCard
                  game={game}
                  isFavorite={favorites.has(game.id)}
                  onToggleFavorite={toggleFavorite}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800 py-4 sm:py-6 text-center">
        <p className="text-xs text-slate-500">
          Pixel Arcade — {games.length} free browser games. No ads, no signups. Just play!
        </p>
      </footer>

      {/* Game Modal */}
      {selectedGame && (
        <GameModal
          game={selectedGame}
          isFavorite={favorites.has(selectedGame.id)}
          onToggleFavorite={toggleFavorite}
          onClose={() => setSelectedGame(null)}
        />
      )}
    </div>
  );
}
