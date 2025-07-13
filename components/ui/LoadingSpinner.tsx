/**
 * Loading Spinner Component for Snacc App
 * 
 * A themed loading indicator with multiple sizes and variants
 */

import React from 'react'
import {
  View,
  ActivityIndicator,
  Text,
  type ViewProps,
} from 'react-native'
import { useThemedStyles } from '../../contexts/ThemeContext'
import { Spacing, Typography } from '../../constants/Design'
import type { ThemeColors } from '../../constants/Design'

export type SpinnerSize = 'small' | 'large' | number
export type SpinnerVariant = 'primary' | 'secondary' | 'neutral'

export interface LoadingSpinnerProps extends ViewProps {
  // Appearance
  size?: SpinnerSize
  variant?: SpinnerVariant
  
  // Content
  text?: string
  overlay?: boolean
  
  // Styling
  style?: ViewProps['style']
  textStyle?: object
}

export function LoadingSpinner({
  size = 'large',
  variant = 'primary',
  text,
  overlay = false,
  style,
  textStyle,
  ...props
}: LoadingSpinnerProps) {
  const styles = useThemedStyles(createStyles)
  
  const content = (
    <View style={[
      styles.container,
      overlay && styles.overlay,
      style,
    ]}>
      <ActivityIndicator
        size={size}
        color={styles[variant].color}
      />
      
      {text && (
        <Text style={[
          styles.text,
          textStyle,
        ]}>
          {text}
        </Text>
      )}
    </View>
  )
  
  if (overlay) {
    return (
      <View style={styles.overlayWrapper} {...props}>
        {content}
      </View>
    )
  }
  
  return content
}

function createStyles(theme: ThemeColors) {
  return {
    container: {
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      padding: Spacing.lg,
    },
    
    overlay: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      minWidth: 100,
      minHeight: 100,
    },
    
    overlayWrapper: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      backgroundColor: theme.overlay,
      zIndex: 1000,
    },
    
    text: {
      fontSize: Typography.fontSize.sm,
      color: theme.textSecondary,
      marginTop: Spacing.sm,
      textAlign: 'center' as const,
    },
    
    // Color variants
    primary: {
      color: theme.primary,
    },
    
    secondary: {
      color: theme.secondary,
    },
    
    neutral: {
      color: theme.textSecondary,
    },
  }
}