import React, { createContext, useContext, ReactNode } from 'react';

export type ThemeMode = 'light';

interface ThemeContextType {
  theme: ThemeMode;
  actualTheme: 'light';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const theme: ThemeMode = 'light';
  const actualTheme = 'light' as const;

  return (
    <ThemeContext.Provider value={{
      theme,
      actualTheme
    }}>
      {children}
    </ThemeContext.Provider>
  );
};
