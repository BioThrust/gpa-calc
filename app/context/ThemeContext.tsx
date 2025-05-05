import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'blue' | 'green' | 'purple' | 'orange';

interface ThemeConfig {
  name: Theme;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  card: string;
  border: string;
  inputBackground: string;
}

const themes: Record<Theme, ThemeConfig> = {
  blue: {
    name: 'blue',
    primary: '#3498db',
    secondary: '#2980b9',
    accent: '#e3f2fd',
    background: '#f5f5f5',
    text: '#2c3e50',
    card: '#ffffff',
    border: '#eee',
    inputBackground: '#ffffff'
  },
  green: {
    name: 'green',
    primary: '#2ecc71',
    secondary: '#27ae60',
    accent: '#e8f8f5',
    background: '#f5f5f5',
    text: '#2c3e50',
    card: '#ffffff',
    border: '#eee',
    inputBackground: '#ffffff'
  },
  purple: {
    name: 'purple',
    primary: '#9b59b6',
    secondary: '#8e44ad',
    accent: '#f5eef8',
    background: '#f5f5f5',
    text: '#2c3e50',
    card: '#ffffff',
    border: '#eee',
    inputBackground: '#ffffff'
  },
  orange: {
    name: 'orange',
    primary: '#e67e22',
    secondary: '#d35400',
    accent: '#fef5e7',
    background: '#f5f5f5',
    text: '#2c3e50',
    card: '#ffffff',
    border: '#eee',
    inputBackground: '#ffffff'
  }
};

const darkThemes: Record<Theme, ThemeConfig> = {
  blue: {
    ...themes.blue,
    background: '#121212',
    text: '#ffffff',
    card: '#1e1e1e',
    border: '#333333',
    inputBackground: '#2d2d2d'
  },
  green: {
    ...themes.green,
    background: '#121212',
    text: '#ffffff',
    card: '#1e1e1e',
    border: '#333333',
    inputBackground: '#2d2d2d'
  },
  purple: {
    ...themes.purple,
    background: '#121212',
    text: '#ffffff',
    card: '#1e1e1e',
    border: '#333333',
    inputBackground: '#2d2d2d'
  },
  orange: {
    ...themes.orange,
    background: '#121212',
    text: '#ffffff',
    card: '#1e1e1e',
    border: '#333333',
    inputBackground: '#2d2d2d'
  }
};

interface ThemeContextType {
  theme: ThemeConfig;
  currentTheme: Theme;
  isDarkMode: boolean;
  setTheme: (theme: Theme) => void;
  setDarkMode: (isDark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<Theme>('blue');
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    loadThemeSettings();
  }, []);

  const loadThemeSettings = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('@gpa_calculator_theme');
      if (savedTheme) {
        setCurrentTheme(savedTheme as Theme);
      }

      const savedDarkMode = await AsyncStorage.getItem('@gpa_calculator_dark_mode');
      if (savedDarkMode) {
        setIsDarkMode(savedDarkMode === 'true');
      }
    } catch (error) {
      console.error('Error loading theme settings:', error);
    }
  };

  const setTheme = async (theme: Theme) => {
    setCurrentTheme(theme);
    try {
      await AsyncStorage.setItem('@gpa_calculator_theme', theme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const setDarkMode = async (isDark: boolean) => {
    setIsDarkMode(isDark);
    try {
      await AsyncStorage.setItem('@gpa_calculator_dark_mode', isDark.toString());
    } catch (error) {
      console.error('Error saving dark mode:', error);
    }
  };

  const theme = isDarkMode ? darkThemes[currentTheme] : themes[currentTheme];

  return (
    <ThemeContext.Provider value={{ theme, currentTheme, isDarkMode, setTheme, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
} 