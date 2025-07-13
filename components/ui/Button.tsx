/**
 * Button Component for Snacc App
 * 
 * A fully featured button with multiple variants, sizes, and states.
 * Includes haptic feedback and theme integration.
 */

import React, { type ReactNode } from 'react'
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  View,
  type TouchableOpacityProps,
} from 'react-native'
import { useThemedStyles } from '../../contexts/ThemeContext'
import { HapticPatterns } from '../../utils/haptics'
import { Spacing, BorderRadius, Typography, Sizes } from '../../constants/Design'
import type { ThemeColors } from '../../constants/Design'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl'

export interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  // Content
  title?: string
  children?: ReactNode
  
  // Appearance
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  
  // State
  loading?: boolean
  disabled?: boolean
  
  // Styling
  style?: TouchableOpacityProps['style']
  textStyle?: object
  
  // Haptics
  hapticFeedback?: boolean
}

export function Button({
  title,
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  style,
  textStyle,
  hapticFeedback = true,
  onPress,
  ...props
}: ButtonProps) {
  const styles = useThemedStyles(createStyles)
  
  const handlePress = async (event: any) => {
    if (loading || disabled) return
    
    // Trigger haptic feedback
    if (hapticFeedback) {
      await HapticPatterns.buttonPress()
    }
    
    onPress?.(event)
  }
  
  const isDisabled = disabled || loading
  
  return (
    <TouchableOpacity
      style={[
        styles.base,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={handlePress}
      disabled={isDisabled}
      activeOpacity={0.7}
      {...props}
    >
      <View style={styles.content}>
        {loading && (
          <ActivityIndicator
            size="small"
            color={getSpinnerColor(variant, styles)}
            style={styles.spinner}
          />
        )}
        
        {(title || children) && !loading && (
          <Text style={[styles.text, styles[`${variant}Text`], textStyle]}>
            {children || title}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  )
}

function getSpinnerColor(variant: ButtonVariant, styles: any): string {
  const colorMap = {
    primary: styles.primaryText.color,
    secondary: styles.secondaryText.color,
    outline: styles.outlineText.color,
    ghost: styles.ghostText.color,
    destructive: styles.destructiveText.color,
  }
  return colorMap[variant] || styles.primaryText.color
}

function createStyles(theme: ThemeColors) {
  return {
    base: {
      borderRadius: BorderRadius.xl,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      flexDirection: 'row' as const,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    
    // Sizes
    sm: {
      height: Sizes.button.sm,
      paddingHorizontal: Spacing.md,
      minWidth: 80,
    },
    md: {
      height: Sizes.button.md,
      paddingHorizontal: Spacing.lg,
      minWidth: 100,
    },
    lg: {
      height: Sizes.button.lg,
      paddingHorizontal: Spacing.xl,
      minWidth: 120,
    },
    xl: {
      height: Sizes.button.xl,
      paddingHorizontal: Spacing['2xl'],
      minWidth: 140,
    },
    
    // Layout
    fullWidth: {
      width: '100%' as const,
    },
    
    content: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    
    spinner: {
      marginRight: Spacing.sm,
    },
    
    // Variants
    primary: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    
    secondary: {
      backgroundColor: theme.secondary,
      borderColor: theme.secondary,
    },
    
    outline: {
      backgroundColor: 'transparent',
      borderColor: theme.border,
    },
    
    ghost: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
    },
    
    destructive: {
      backgroundColor: theme.error,
      borderColor: theme.error,
    },
    
    // Disabled state
    disabled: {
      backgroundColor: theme.interactiveDisabled,
      borderColor: theme.interactiveDisabled,
      opacity: 0.6,
    },
    
    // Text styles
    text: {
      fontSize: Typography.fontSize.base,
      fontWeight: Typography.fontWeight.semibold,
      textAlign: 'center' as const,
    },
    
    primaryText: {
      color: theme.textInverse,
    },
    
    secondaryText: {
      color: theme.textInverse,
    },
    
    outlineText: {
      color: theme.text,
    },
    
    ghostText: {
      color: theme.primary,
    },
    
    destructiveText: {
      color: theme.textInverse,
    },
  }
}