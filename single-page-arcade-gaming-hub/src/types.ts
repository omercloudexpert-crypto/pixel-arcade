export interface Game {
  id: string;
  name: string;
  description: string;
  category: Category;
  emoji: string;
  gradient: string;
}

export type Category = 'Arcade' | 'Action' | 'Puzzle' | 'Strategy' | 'Sports' | 'Casual' | 'Cards' | 'Word' | 'Tools';

export const categoryColors: Record<Category, string> = {
  Arcade: 'bg-green-500',
  Action: 'bg-purple-500',
  Puzzle: 'bg-blue-500',
  Strategy: 'bg-yellow-500',
  Sports: 'bg-red-500',
  Casual: 'bg-pink-500',
  Cards: 'bg-orange-500',
  Word: 'bg-teal-500',
  Tools: 'bg-cyan-500',
};

export const categoryIcons: Record<Category, string> = {
  Arcade: '🕹️',
  Action: '⚔️',
  Puzzle: '🧩',
  Strategy: '♟️',
  Sports: '⚽',
  Casual: '🎯',
  Cards: '🃏',
  Word: '📝',
  Tools: '🔧',
};
