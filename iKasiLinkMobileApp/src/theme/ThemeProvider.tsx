import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { Theme, lightTheme, darkTheme } from './theme';

const ThemeContext = createContext<Theme>(lightTheme);

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

export default function ThemeProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const scheme = useColorScheme();
  const value = useMemo(() => (scheme === 'dark' ? darkTheme : lightTheme), [scheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

