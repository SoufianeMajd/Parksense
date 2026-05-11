import React, {
  createContext, useContext, useState, useMemo, useCallback,
  useEffect, ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DARK_COLORS, LIGHT_COLORS, ThemeColors } from '../constants/theme';

export type ThemeMode = 'dark' | 'light';

interface ThemeContextValue {
  mode:    ThemeMode;
  colors:  ThemeColors;
  toggle:  () => void;
  setMode: (m: ThemeMode) => void;
}

const STORAGE_KEY = 'parksense.themeMode';

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<ThemeMode>('dark');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(v => {
      if (v === 'dark' || v === 'light') setMode(v);
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  const colors = mode === 'dark' ? DARK_COLORS : LIGHT_COLORS;
  const toggle = useCallback(
    () => setMode(m => (m === 'dark' ? 'light' : 'dark')),
    [],
  );

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, colors, toggle, setMode }),
    [mode, colors, toggle],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};

export const useColors = (): ThemeColors => useTheme().colors;

export function useThemedStyles<T>(factory: (c: ThemeColors) => T): T {
  const colors = useColors();
  return useMemo(() => factory(colors), [colors, factory]);
}
