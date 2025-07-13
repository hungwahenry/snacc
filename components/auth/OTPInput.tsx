/**
 * OTP Input Component for Authentication
 * 
 * 6-digit OTP input with individual digit cells and auto-focus
 */

import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  TextInput,
  Text,
} from 'react-native'
import { useThemedStyles } from '../../contexts/ThemeContext'
import { HapticPatterns } from '../../utils/haptics'
import { Spacing, BorderRadius, Typography } from '../../constants/Design'
import type { ThemeColors } from '../../constants/Design'

export interface OTPInputProps {
  length?: number
  value?: string
  onComplete?: (otp: string) => void
  onChangeText?: (otp: string) => void
  error?: string
  disabled?: boolean
  autoFocus?: boolean
}

export function OTPInput({
  length = 6,
  value = '',
  onComplete,
  onChangeText,
  error,
  disabled = false,
  autoFocus = true,
}: OTPInputProps) {
  const styles = useThemedStyles(createStyles)
  const [otp, setOtp] = useState(value)
  const [focusedIndex, setFocusedIndex] = useState(autoFocus ? 0 : -1)
  const inputs = useRef<TextInput[]>([])
  
  useEffect(() => {
    setOtp(value)
  }, [value])
  
  useEffect(() => {
    if (autoFocus && inputs.current[0]) {
      inputs.current[0].focus()
    }
  }, [autoFocus])
  
  const handleChangeText = (text: string, index: number) => {
    const newOtp = otp.split('')
    newOtp[index] = text
    
    const updatedOtp = newOtp.join('')
    setOtp(updatedOtp)
    onChangeText?.(updatedOtp)
    
    // Move to next input if text entered
    if (text && index < length - 1) {
      inputs.current[index + 1]?.focus()
      setFocusedIndex(index + 1)
    }
    
    // Check if OTP is complete
    if (updatedOtp.length === length && !updatedOtp.includes('')) {
      onComplete?.(updatedOtp)
      HapticPatterns.otpComplete()
    }
  }
  
  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      inputs.current[index - 1]?.focus()
      setFocusedIndex(index - 1)
    }
  }
  
  const handleFocus = (index: number) => {
    setFocusedIndex(index)
    HapticPatterns.inputFocus()
  }
  
  const handleBlur = () => {
    setFocusedIndex(-1)
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        {Array.from({ length }, (_, index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              if (ref) inputs.current[index] = ref
            }}
            style={[
              styles.input,
              focusedIndex === index && styles.inputFocused,
              error && styles.inputError,
              disabled && styles.inputDisabled,
            ]}
            value={otp[index] || ''}
            onChangeText={(text) => handleChangeText(text.slice(-1), index)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
            onFocus={() => handleFocus(index)}
            onBlur={handleBlur}
            keyboardType="numeric"
            maxLength={1}
            selectTextOnFocus
            editable={!disabled}
            textAlign="center"
          />
        ))}
      </View>
      
      {error && (
        <Text style={styles.error}>
          {error}
        </Text>
      )}
    </View>
  )
}

function createStyles(theme: ThemeColors) {
  return {
    container: {
      alignItems: 'center' as const,
    },
    
    inputContainer: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      gap: Spacing.sm,
    },
    
    input: {
      width: 48,
      height: 56,
      borderRadius: BorderRadius.lg,
      borderWidth: 2,
      borderColor: theme.border,
      backgroundColor: theme.surface,
      fontSize: Typography.fontSize['2xl'],
      fontWeight: Typography.fontWeight.semibold,
      color: theme.text,
      textAlign: 'center' as const,
    },
    
    inputFocused: {
      borderColor: theme.primary,
    },
    
    inputError: {
      borderColor: theme.error,
    },
    
    inputDisabled: {
      backgroundColor: theme.surfaceSecondary,
      borderColor: theme.borderLight,
      opacity: 0.6,
    },
    
    error: {
      fontSize: Typography.fontSize.sm,
      color: theme.error,
      marginTop: Spacing.sm,
      textAlign: 'center' as const,
    },
  }
}