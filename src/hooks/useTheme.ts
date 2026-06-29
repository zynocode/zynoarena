import { useState, useEffect } from 'react';

export type BoardTheme = 'default' | 'blue' | 'wood' | 'coral';

export interface ThemeColors {
  light: string;
  dark: string;
}

export const THEMES: Record<BoardTheme, ThemeColors> = {
  default: { light: '#ebecd0', dark: '#779556' }, // Chess.com Green
  blue:    { light: '#eae9d2', dark: '#4b7399' },
  wood:    { light: '#f0d9b5', dark: '#b58863' }, // Lichess Brown/Wood
  coral:   { light: '#f0d9b5', dark: '#b2877e' },
};

const THEME_ORDER: BoardTheme[] = ['default', 'blue', 'wood', 'coral'];

export const useTheme = () => {
  const [themeName, setThemeName] = useState<BoardTheme>('default');

  useEffect(() => {
    const saved = localStorage.getItem('chess-board-theme') as BoardTheme | null;
    if (saved && THEMES[saved]) {
      setThemeName(saved);
    }
  }, []);

  const cycleTheme = () => {
    setThemeName((prev) => {
      const idx = THEME_ORDER.indexOf(prev);
      const next = THEME_ORDER[(idx + 1) % THEME_ORDER.length];
      localStorage.setItem('chess-board-theme', next);
      return next;
    });
  };

  return { themeName, themeColors: THEMES[themeName], cycleTheme };
};
