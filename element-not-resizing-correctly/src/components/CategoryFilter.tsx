import { Category, categoryIcons } from '../types';

const allCategories: (Category | 'All Games')[] = [
  'All Games',
  'Arcade',
  'Action',
  'Puzzle',
  'Strategy',
  'Sports',
  'Casual',
  'Cards',
  'Word',
  'Tools',
];

interface CategoryFilterProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export default function CategoryFilter({ activeCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <div className="w-full overflow-x-auto scrollbar-hide px-3 sm:px-4 md:px-6">
      <div className="flex items-center gap-2 py-2 min-w-max mx-auto max-w-[1600px] justify-start sm:justify-center">
        {allCategories.map((cat) => {
          const isActive = activeCategory === cat;
          const icon = cat === 'All Games' ? '🎮' : categoryIcons[cat as Category];
          return (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/50'
                  : 'bg-slate-800/60 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
              }`}
            >
              <span>{icon}</span>
              {cat}
            </button>
          );
        })}
      </div>
    </div>
  );
}
