// Local storage utilities for game data persistence

import { GameStats, ArcadeSettings, Achievement } from '../types';

const STORAGE_PREFIX = 'pixel_arcade_';

// Get game stats
export function getGameStats(gameId: string): GameStats {
  try {
    const data = localStorage.getItem(`${STORAGE_PREFIX}stats_${gameId}`);
    if (data) return JSON.parse(data);
  } catch {}
  return {
    highScore: 0,
    playCount: 0,
    totalTime: 0,
    lastPlayed: 0,
    achievements: [],
  };
}

// Save game stats
export function saveGameStats(gameId: string, stats: Partial<GameStats>): void {
  try {
    const current = getGameStats(gameId);
    const updated = { ...current, ...stats };
    localStorage.setItem(`${STORAGE_PREFIX}stats_${gameId}`, JSON.stringify(updated));
  } catch {}
}

// Update high score if new score is higher
export function updateHighScore(gameId: string, score: number): boolean {
  const stats = getGameStats(gameId);
  if (score > stats.highScore) {
    saveGameStats(gameId, { highScore: score });
    return true;
  }
  return false;
}

// Increment play count
export function incrementPlayCount(gameId: string): void {
  const stats = getGameStats(gameId);
  saveGameStats(gameId, {
    playCount: stats.playCount + 1,
    lastPlayed: Date.now(),
  });
}

// Get all game stats
export function getAllGameStats(): Record<string, GameStats> {
  const result: Record<string, GameStats> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(`${STORAGE_PREFIX}stats_`)) {
        const gameId = key.replace(`${STORAGE_PREFIX}stats_`, '');
        result[gameId] = JSON.parse(localStorage.getItem(key)!);
      }
    }
  } catch {}
  return result;
}

// Get recently played games
export function getRecentlyPlayed(limit = 6): string[] {
  const allStats = getAllGameStats();
  return Object.entries(allStats)
    .filter(([, stats]) => stats.lastPlayed > 0)
    .sort(([, a], [, b]) => b.lastPlayed - a.lastPlayed)
    .slice(0, limit)
    .map(([id]) => id);
}

// Get most played games
export function getMostPlayed(limit = 6): string[] {
  const allStats = getAllGameStats();
  return Object.entries(allStats)
    .filter(([, stats]) => stats.playCount > 0)
    .sort(([, a], [, b]) => b.playCount - a.playCount)
    .slice(0, limit)
    .map(([id]) => id);
}

// Favorites
export function getFavorites(): string[] {
  try {
    const data = localStorage.getItem(`${STORAGE_PREFIX}favorites`);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function toggleFavorite(gameId: string): boolean {
  const favs = getFavorites();
  const idx = favs.indexOf(gameId);
  if (idx >= 0) {
    favs.splice(idx, 1);
  } else {
    favs.push(gameId);
  }
  localStorage.setItem(`${STORAGE_PREFIX}favorites`, JSON.stringify(favs));
  return idx < 0;
}

export function isFavorite(gameId: string): boolean {
  return getFavorites().includes(gameId);
}

// Settings
export function getSettings(): ArcadeSettings {
  try {
    const data = localStorage.getItem(`${STORAGE_PREFIX}settings`);
    if (data) return JSON.parse(data);
  } catch {}
  return {
    soundEnabled: true,
    musicEnabled: true,
    volume: 0.7,
    theme: 'dark',
    showFps: false,
    particleEffects: true,
  };
}

export function saveSettings(settings: Partial<ArcadeSettings>): void {
  try {
    const current = getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(`${STORAGE_PREFIX}settings`, JSON.stringify(updated));
  } catch {}
}

// Achievements
export function getAchievements(): Achievement[] {
  try {
    const data = localStorage.getItem(`${STORAGE_PREFIX}achievements`);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function unlockAchievement(achievement: Achievement): void {
  const achievements = getAchievements();
  if (!achievements.find(a => a.id === achievement.id)) {
    achievements.push({ ...achievement, unlocked: true, unlockedAt: Date.now() });
    localStorage.setItem(`${STORAGE_PREFIX}achievements`, JSON.stringify(achievements));
  }
}

// Total stats
export function getTotalStats() {
  const allStats = getAllGameStats();
  const entries = Object.values(allStats);
  return {
    totalGamesPlayed: entries.reduce((sum, s) => sum + s.playCount, 0),
    totalTimePlayed: entries.reduce((sum, s) => sum + s.totalTime, 0),
    gamesWithHighScore: entries.filter(s => s.highScore > 0).length,
    achievementsUnlocked: getAchievements().length,
  };
}
