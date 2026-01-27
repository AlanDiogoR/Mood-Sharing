import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { COLORS } from '../constants/colors';
import { useAuth } from './authContext';

type ThemeColors = typeof COLORS;

interface ThemeContextType {
  colors: ThemeColors;
  setThemeColors: (primary: string, secondary: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const normalizeColor = (value?: string | null): string | null => {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
};

const buildThemeColors = (primary?: string | null, secondary?: string | null): ThemeColors => {
  const resolvedPrimary = normalizeColor(primary) || COLORS.primary;
  const resolvedSecondary = normalizeColor(secondary) || COLORS.secondary;

  return {
    ...COLORS,
    primary: resolvedPrimary,
    secondary: resolvedSecondary,
    primaryLight: resolvedSecondary,
    secondaryLight: resolvedSecondary,
  };
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [colors, setColors] = useState<ThemeColors>(
    buildThemeColors(user?.themePrimary, user?.themeSecondary)
  );

  useEffect(() => {
    setColors(buildThemeColors(user?.themePrimary, user?.themeSecondary));
  }, [user?.themePrimary, user?.themeSecondary]);

  const value = useMemo(
    () => ({
      colors,
      setThemeColors: (primary: string, secondary: string) => {
        setColors(buildThemeColors(primary, secondary));
      },
    }),
    [colors]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
