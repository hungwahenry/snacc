/**
 * Themed Text Component for Snacc App
 * 
 * Text component with consistent typography and theme integration
 */

import React, { type ReactNode } from 'react'
import {
  Text,
  type TextProps,
} from 'react-native'
import { useThemedStyles } from '../contexts/ThemeContext'
import { Typography } from '../constants/Design'
import type { ThemeColors } from '../constants/Design'

export type TextVariant = 'display' | 'title' | 'heading' | 'body' | 'caption' | 'label'
export type TextWeight = 'normal' | 'medium' | 'semibold' | 'bold'
export type TextColor = 'primary' | 'secondary' | 'tertiary' | 'inverse' | 'accent' | 'success' | 'warning' | 'error'

export interface ThemedTextProps extends TextProps {
  children: ReactNode
  variant?: TextVariant
  weight?: TextWeight
  color?: TextColor
  center?: boolean
  style?: TextProps['style']
}

export function ThemedText({
  children,
  variant = 'body',
  weight = 'normal',
  color = 'primary',
  center = false,
  style,
  ...props
}: ThemedTextProps) {
  const styles = useThemedStyles(createStyles)
  
  const weightStyle = weight === 'normal' ? styles.weightNormal :
                     weight === 'medium' ? styles.weightMedium :
                     weight === 'semibold' ? styles.weightSemibold :
                     styles.weightBold
  
  const colorStyle = color === 'primary' ? styles.colorPrimary :
                    color === 'secondary' ? styles.colorSecondary :
                    color === 'tertiary' ? styles.colorTertiary :
                    color === 'inverse' ? styles.colorInverse :
                    color === 'accent' ? styles.colorAccent :
                    color === 'success' ? styles.colorSuccess :
                    color === 'warning' ? styles.colorWarning :
                    styles.colorError
  
  return (
    <Text
      style={[
        styles.base,
        styles[variant],
        weightStyle,
        colorStyle,
        center && styles.center,
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  )
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function createStyles(theme: ThemeColors) {
  return {
    base: {
      color: theme.text,
    },
    
    // Text alignment
    center: {
      textAlign: 'center' as const,
    },
    
    // Variants (size and line height)
    display: {
      fontSize: Typography.fontSize['6xl'],
      lineHeight: Typography.lineHeight.tight * Typography.fontSize['6xl'],
    },
    
    title: {
      fontSize: Typography.fontSize['3xl'],
      lineHeight: Typography.lineHeight.tight * Typography.fontSize['3xl'],
    },
    
    heading: {
      fontSize: Typography.fontSize['2xl'],
      lineHeight: Typography.lineHeight.snug * Typography.fontSize['2xl'],
    },
    
    body: {
      fontSize: Typography.fontSize.base,
      lineHeight: Typography.lineHeight.normal * Typography.fontSize.base,
    },
    
    caption: {
      fontSize: Typography.fontSize.sm,
      lineHeight: Typography.lineHeight.normal * Typography.fontSize.sm,
    },
    
    label: {
      fontSize: Typography.fontSize.xs,
      lineHeight: Typography.lineHeight.normal * Typography.fontSize.xs,
    },
    
    // Weights
    weightNormal: {
      fontWeight: Typography.fontWeight.normal,
    },
    
    weightMedium: {
      fontWeight: Typography.fontWeight.medium,
    },
    
    weightSemibold: {
      fontWeight: Typography.fontWeight.semibold,
    },
    
    weightBold: {
      fontWeight: Typography.fontWeight.bold,
    },
    
    // Colors
    colorPrimary: {
      color: theme.text,
    },
    
    colorSecondary: {
      color: theme.textSecondary,
    },
    
    colorTertiary: {
      color: theme.textTertiary,
    },
    
    colorInverse: {
      color: theme.textInverse,
    },
    
    colorAccent: {
      color: theme.primary,
    },
    
    colorSuccess: {
      color: theme.success,
    },
    
    colorWarning: {
      color: theme.warning,
    },
    
    colorError: {
      color: theme.error,
    },
  }
}