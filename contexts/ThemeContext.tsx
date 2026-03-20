import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ThemeName, Theme, getTheme } from '../themes';

interface ThemeContextType {
  themeName: ThemeName;
  theme: Theme;
  setTheme: (theme: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [themeName, setThemeName] = useState<ThemeName>(() => {
    return (localStorage.getItem('theme') as ThemeName) || 'yunai';
  });

  const theme = getTheme(themeName);

  const setTheme = (name: ThemeName) => {
    localStorage.setItem('theme', name);
    setThemeName(name);
  };

  return (
    <ThemeContext.Provider value={{ themeName, theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
