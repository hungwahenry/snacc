/**
 * TextArea Component for Snacc App
 * 
 * A themed multi-line text input with label, error states, and consistent styling
 */

import React, { useState, forwardRef } from 'react'
import {
  View,
  Text,
  TextInput,
  type TextInputProps,
} from 'react-native'
import { useThemedStyles } from '../../contexts/ThemeContext'
import { HapticPatterns } from '../../utils/haptics'
import { Spacing, BorderRadius, Typography } from '../../constants/Design'
import type { ThemeColors } from '../../constants/Design'

export type TextAreaSize = 'sm' | 'md' | 'lg'

export interface TextAreaProps extends Omit<TextInputProps, 'multiline'> {
  // Content
  label?: string
  error?: string
  hint?: string
  
  // Appearance
  size?: TextAreaSize
  fullWidth?: boolean
  rows?: number
  
  // State
  disabled?: boolean
  
  // Styling
  containerStyle?: object
  labelStyle?: object
  inputStyle?: object
  errorStyle?: object
  hintStyle?: object
  
  // Haptics
  hapticFeedback?: boolean
}

export const TextArea = forwardRef<TextInput, TextAreaProps>(({
  label,
  error,
  hint,
  size = 'md',
  fullWidth = true,
  rows = 3,
  disabled = false,
  containerStyle,
  labelStyle,
  inputStyle,
  errorStyle,
  hintStyle,
  hapticFeedback = true,
  onFocus,
  onBlur,
  ...props
}, ref) => {
  const styles = useThemedStyles(createStyles)
  const [isFocused, setIsFocused] = useState(false)
  
  const handleFocus = async (event: any) => {
    setIsFocused(true)
    
    if (hapticFeedback) {
      await HapticPatterns.inputFocus()
    }
    
    onFocus?.(event)
  }
  
  const handleBlur = (event: any) => {
    setIsFocused(false)
    onBlur?.(event)
  }
  
  const hasError = !!error
  
  // Calculate height based on rows and size
  const getHeight = () => {
    const lineHeight = size === 'sm' ? 20 : size === 'lg' ? 24 : 22
    const padding = Spacing.md * 2
    return (lineHeight * rows) + padding
  }
  
  return (
    <View style={[
      styles.container,
      fullWidth && styles.fullWidth,
      containerStyle
    ]}>
      {label && (
        <Text style={[styles.label, labelStyle]}>
          {label}
        </Text>
      )}
      
      <TextInput
        ref={ref}
        style={[
          styles.input,
          styles[size],
          { height: getHeight() },
          isFocused && styles.inputFocused,
          hasError && styles.inputError,
          disabled && styles.inputDisabled,
          inputStyle,
        ]}
        placeholderTextColor={styles.placeholder.color}
        editable={!disabled}
        multiline
        textAlignVertical="top"
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      />
      
      {hasError && (
        <Text style={[styles.error, errorStyle]}>
          {error}
        </Text>
      )}
      
      {hint && !hasError && (
        <Text style={[styles.hint, hintStyle]}>
          {hint}
        </Text>
      )}
    </View>
  )
})

TextArea.displayName = 'TextArea'

function createStyles(theme: ThemeColors) {
  return {
    container: {
      marginBottom: Spacing.sm,
    },
    
    fullWidth: {
      width: '100%',
    },
    
    label: {
      fontSize: Typography.fontSize.sm,
      fontWeight: Typography.fontWeight.medium,
      color: theme.text,
      marginBottom: Spacing.xs,
    },
    
    input: {
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      fontSize: Typography.fontSize.base,
      color: theme.text,
    },
    
    // Sizes (affects font and line height)
    sm: {
      fontSize: Typography.fontSize.sm,
    },
    md: {
      fontSize: Typography.fontSize.base,
    },
    lg: {
      fontSize: Typography.fontSize.lg,
    },
    
    // States
    inputFocused: {
      borderColor: theme.primary,
      borderWidth: 2,
    },
    
    inputError: {
      borderColor: theme.error,
      borderWidth: 2,
    },
    
    inputDisabled: {
      backgroundColor: theme.surfaceSecondary,
      borderColor: theme.borderLight,
      opacity: 0.6,
    },
    
    placeholder: {
      color: theme.textTertiary,
    },
    
    error: {
      fontSize: Typography.fontSize.sm,
      color: theme.error,
      marginTop: Spacing.xs,
    },
    
    hint: {
      fontSize: Typography.fontSize.sm,
      color: theme.textSecondary,
      marginTop: Spacing.xs,
    },
  }
}