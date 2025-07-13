/**
 * Card Component for Snacc App
 * 
 * A versatile container component with consistent styling and theming
 */

import React, { type ReactNode } from 'react'
import {
  View,
  type ViewProps,
} from 'react-native'
import { useThemedStyles } from '../../contexts/ThemeContext'
import { Spacing, BorderRadius, Shadows } from '../../constants/Design'
import type { ThemeColors } from '../../constants/Design'

export type CardVariant = 'elevated' | 'outlined' | 'filled'
export type CardPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl'

export interface CardProps extends ViewProps {
  children: ReactNode
  variant?: CardVariant
  padding?: CardPadding
  style?: ViewProps['style']
}

export function Card({
  children,
  variant = 'elevated',
  padding = 'md',
  style,
  ...props
}: CardProps) {
  const styles = useThemedStyles(createStyles)
  
  const paddingStyle = padding === 'none' ? styles.paddingNone :
                      padding === 'sm' ? styles.paddingSm :
                      padding === 'md' ? styles.paddingMd :
                      padding === 'lg' ? styles.paddingLg :
                      styles.paddingXl
  
  return (
    <View
      style={[
        styles.base,
        styles[variant],
        paddingStyle,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  )
}


function createStyles(theme: ThemeColors) {
  return {
    base: {
      borderRadius: BorderRadius.lg,
      backgroundColor: theme.surface,
    },
    
    // Variants
    elevated: {
      ...Shadows.md,
    },
    
    outlined: {
      borderWidth: 1,
      borderColor: theme.border,
    },
    
    filled: {
      backgroundColor: theme.surfaceSecondary,
    },
    
    // Padding options
    paddingNone: {
      padding: 0,
    },
    
    paddingSm: {
      padding: Spacing.sm,
    },
    
    paddingMd: {
      padding: Spacing.md,
    },
    
    paddingLg: {
      padding: Spacing.lg,
    },
    
    paddingXl: {
      padding: Spacing.xl,
    },
  }
}