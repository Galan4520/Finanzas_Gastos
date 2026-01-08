import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeName, Theme, getTheme } from '../themes';

interface ThemeContextType {
  currentTheme: ThemeName;
  theme: Theme;
  setTheme: (theme: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>('light-premium');

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('theme') as ThemeName;
    if (savedTheme && (savedTheme === 'light-premium' || savedTheme === 'blue-corporate')) {
      setCurrentTheme(savedTheme);
    }
  }, []);

  const setTheme = (theme: ThemeName) => {
    setCurrentTheme(theme);
    localStorage.setItem('theme', theme);
  };

  const theme = getTheme(currentTheme);

  return (
    <ThemeContext.Provider value={{ currentTheme, theme, setTheme }}>
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
