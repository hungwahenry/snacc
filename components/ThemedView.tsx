/**
 * Themed View Component for Snacc App
 * 
 * View component with consistent background colors and theme integration
 */

import React, { type ReactNode } from 'react'
import {
  View,
  type ViewProps,
} from 'react-native'
import { useThemedStyles } from '../contexts/ThemeContext'
import type { ThemeColors } from '../constants/Design'

export type ViewBackground = 'primary' | 'secondary' | 'tertiary' | 'surface' | 'transparent'

export interface ThemedViewProps extends ViewProps {
  children?: ReactNode
  background?: ViewBackground
  style?: ViewProps['style']
}

export function ThemedView({
  children,
  background = 'primary',
  style,
  ...props
}: ThemedViewProps) {
  const styles = useThemedStyles(createStyles)
  
  return (
    <View
      style={[
        styles[background],
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
    primary: {
      backgroundColor: theme.background,
    },
    
    secondary: {
      backgroundColor: theme.surfaceSecondary,
    },
    
    tertiary: {
      backgroundColor: theme.surfaceTertiary,
    },
    
    surface: {
      backgroundColor: theme.surface,
    },
    
    transparent: {
      backgroundColor: 'transparent',
    },
  }
}