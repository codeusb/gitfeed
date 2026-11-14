import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { ThemeMode, ColorPalette, ThemeTokens, getThemeTokens } from './tokens';

interface ThemeContextValue {
  tokens: ThemeTokens;
  mode: ThemeMode;
  palette: ColorPalette;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  tokens: getThemeTokens(true, 'orange'),
  mode: 'dark',
  palette: 'orange',
  isDark: true,
});

export const ThemeProvider: React.FC<{
  mode?: ThemeMode;
  palette?: ColorPalette;
  children: React.ReactNode;
}> = ({ mode = 'dark', palette = 'orange', children }) => {
  const systemScheme = useColorScheme();

  const isDark = useMemo(() => {
    if (mode === 'system') {
      return systemScheme === 'dark';
    }
    return mode === 'dark';
  }, [mode, systemScheme]);

  const tokens = useMemo(() => {
    return getThemeTokens(isDark, palette);
  }, [isDark, palette]);

  return (
    <ThemeContext.Provider value={{ tokens, mode, palette, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
