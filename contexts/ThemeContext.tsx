/**
 * Theme Context for Snacc App
 * 
 * Provides theme management with automatic system theme detection
 * and manual override capabilities
 */

import React, { createContext, useContext, useState, ReactNode } from 'react'
import { useColorScheme } from 'react-native'
import { LightColors, DarkColors, type ThemeColors } from '../constants/Design'

export type ThemeMode = 'light' | 'dark' | 'system'

interface ThemeContextType {
  // Current theme state
  theme: ThemeColors
  isDark: boolean
  mode: ThemeMode
  
  // Theme actions
  setTheme: (mode: ThemeMode) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme()
  const [mode, setMode] = useState<ThemeMode>('system')
  
  // Determine actual theme based on mode and system preference
  const getActualTheme = (themeMode: ThemeMode): 'light' | 'dark' => {
    if (themeMode === 'system') {
      return systemColorScheme === 'dark' ? 'dark' : 'light'
    }
    return themeMode
  }
  
  const actualTheme = getActualTheme(mode)
  const isDark = actualTheme === 'dark'
  const theme = isDark ? DarkColors : LightColors
  
  const setTheme = (newMode: ThemeMode) => {
    setMode(newMode)
  }
  
  const toggleTheme = () => {
    if (mode === 'system') {
      // If currently on system, switch to opposite of current system theme
      setMode(systemColorScheme === 'dark' ? 'light' : 'dark')
    } else if (mode === 'light') {
      setMode('dark')
    } else {
      setMode('light')
    }
  }
  
  const value: ThemeContextType = {
    theme,
    isDark,
    mode,
    setTheme,
    toggleTheme,
  }
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

// Hook to use theme
export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// Hook to get themed styles
export function useThemedStyles<T>(
  createStyles: (theme: ThemeColors, isDark: boolean) => T
): T {
  const { theme, isDark } = useTheme()
  return createStyles(theme, isDark)
}