/**
 * Snacc Design System
 * 
 * A warm, modern design system optimized for young adults and teenagers.
 * Features full rounded borders, warm subtle colors, and consistent spacing.
 */

// Base Colors - Warm and inviting palette
export const BaseColors = {
  // Primary - Warm orange/coral for main actions
  primary: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316', // Main primary
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
  },
  
  // Secondary - Soft pink/rose for accents
  secondary: {
    50: '#fdf2f8',
    100: '#fce7f3',
    200: '#fbcfe8',
    300: '#f9a8d4',
    400: '#f472b6',
    500: '#ec4899', // Main secondary
    600: '#db2777',
    700: '#be185d',
    800: '#9d174d',
    900: '#831843',
  },
  
  // Accent - Warm yellow for highlights
  accent: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b', // Main accent
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  
  // Neutral - Warm grays
  neutral: {
    50: '#fafaf9',
    100: '#f5f5f4',
    200: '#e7e5e4',
    300: '#d6d3d1',
    400: '#a8a29e',
    500: '#78716c',
    600: '#57534e',
    700: '#44403c',
    800: '#292524',
    900: '#1c1917',
  },
  
  // Success - Warm green
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  
  // Warning - Warm amber
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  
  // Error - Warm red
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
}

// Light Theme Colors
export const LightColors = {
  // Backgrounds
  background: BaseColors.neutral[50],
  surface: '#ffffff',
  surfaceSecondary: BaseColors.neutral[100],
  surfaceTertiary: BaseColors.neutral[200],
  
  // Primary colors
  primary: BaseColors.primary[500],
  primaryLight: BaseColors.primary[100],
  primaryDark: BaseColors.primary[700],
  
  // Secondary colors
  secondary: BaseColors.secondary[500],
  secondaryLight: BaseColors.secondary[100],
  secondaryDark: BaseColors.secondary[700],
  
  // Accent colors
  accent: BaseColors.accent[500],
  accentLight: BaseColors.accent[100],
  accentDark: BaseColors.accent[700],
  
  // Text colors
  text: BaseColors.neutral[900],
  textSecondary: BaseColors.neutral[700],
  textTertiary: BaseColors.neutral[500],
  textInverse: '#ffffff',
  
  // Interactive states
  interactive: BaseColors.primary[500],
  interactiveHover: BaseColors.primary[600],
  interactivePressed: BaseColors.primary[700],
  interactiveDisabled: BaseColors.neutral[300],
  
  // Borders
  border: BaseColors.neutral[200],
  borderLight: BaseColors.neutral[100],
  borderDark: BaseColors.neutral[300],
  
  // Status colors
  success: BaseColors.success[500],
  successLight: BaseColors.success[100],
  warning: BaseColors.warning[500],
  warningLight: BaseColors.warning[100],
  error: BaseColors.error[500],
  errorLight: BaseColors.error[100],
  
  // Special colors
  shadow: 'rgba(0, 0, 0, 0.1)',
  overlay: 'rgba(0, 0, 0, 0.4)',
}

// Dark Theme Colors
export const DarkColors = {
  // Backgrounds
  background: BaseColors.neutral[900],
  surface: BaseColors.neutral[800],
  surfaceSecondary: BaseColors.neutral[700],
  surfaceTertiary: BaseColors.neutral[600],
  
  // Primary colors
  primary: BaseColors.primary[400],
  primaryLight: BaseColors.primary[300],
  primaryDark: BaseColors.primary[600],
  
  // Secondary colors
  secondary: BaseColors.secondary[400],
  secondaryLight: BaseColors.secondary[300],
  secondaryDark: BaseColors.secondary[600],
  
  // Accent colors
  accent: BaseColors.accent[400],
  accentLight: BaseColors.accent[300],
  accentDark: BaseColors.accent[600],
  
  // Text colors
  text: BaseColors.neutral[50],
  textSecondary: BaseColors.neutral[200],
  textTertiary: BaseColors.neutral[400],
  textInverse: BaseColors.neutral[900],
  
  // Interactive states
  interactive: BaseColors.primary[400],
  interactiveHover: BaseColors.primary[300],
  interactivePressed: BaseColors.primary[500],
  interactiveDisabled: BaseColors.neutral[600],
  
  // Borders
  border: BaseColors.neutral[600],
  borderLight: BaseColors.neutral[700],
  borderDark: BaseColors.neutral[500],
  
  // Status colors
  success: BaseColors.success[400],
  successLight: BaseColors.success[900],
  warning: BaseColors.warning[400],
  warningLight: BaseColors.warning[900],
  error: BaseColors.error[400],
  errorLight: BaseColors.error[900],
  
  // Special colors
  shadow: 'rgba(0, 0, 0, 0.3)',
  overlay: 'rgba(0, 0, 0, 0.7)',
}

// Spacing System - Consistent 4px grid
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
  '7xl': 80,
  '8xl': 96,
} as const

// Border Radius - Full rounded design
export const BorderRadius = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
} as const

// Typography Scale
export const Typography = {
  // Font Families
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semiBold: 'System', 
    bold: 'System',
  },
  
  // Font Sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
    '6xl': 60,
  },
  
  // Line Heights
  lineHeight: {
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
  
  // Font Weights
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
} as const

// Component Sizes
export const Sizes = {
  // Button heights
  button: {
    sm: 36,
    md: 44,
    lg: 52,
    xl: 60,
  },
  
  // Input heights
  input: {
    sm: 36,
    md: 44,
    lg: 52,
  },
  
  // Icon sizes
  icon: {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
    '2xl': 40,
    '3xl': 48,
  },
  
  // Avatar sizes
  avatar: {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64,
    '2xl': 80,
    '3xl': 96,
  },
  
  // Container widths
  container: {
    sm: 320,
    md: 375,
    lg: 414,
    xl: 480,
  },
} as const

// Animation Durations
export const Animation = {
  duration: {
    fast: 150,
    normal: 200,
    slow: 300,
    slower: 500,
  },
  
  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
} as const

// Shadows
export const Shadows = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
} as const

// Z-Index Scale
export const ZIndex = {
  base: 0,
  raised: 1,
  overlay: 10,
  modal: 50,
  popover: 100,
  tooltip: 200,
  toast: 300,
} as const

// Export the complete design system
export const DesignSystem = {
  colors: {
    light: LightColors,
    dark: DarkColors,
    base: BaseColors,
  },
  spacing: Spacing,
  borderRadius: BorderRadius,
  typography: Typography,
  sizes: Sizes,
  animation: Animation,
  shadows: Shadows,
  zIndex: ZIndex,
} as const

export type ThemeColors = typeof LightColors
export type DesignTokens = typeof DesignSystem