/**
 * Email Input Component for Authentication
 * 
 * Specialized email input with validation and proper keyboard settings
 */

import React, { useState } from 'react'
import { Input, type InputProps } from '../ui/Input'

export interface EmailInputProps extends Omit<InputProps, 'keyboardType' | 'autoCapitalize' | 'autoCorrect'> {
  onEmailChange?: (email: string, isValid: boolean) => void
}

export function EmailInput({
  onEmailChange,
  onChangeText,
  ...props
}: EmailInputProps) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  
  const validateEmail = (emailValue: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(emailValue.trim())
  }
  
  const handleEmailChange = (value: string) => {
    const trimmedValue = value.trim()
    setEmail(trimmedValue)
    
    // Clear error when user starts typing
    if (error) {
      setError('')
    }
    
    // Validate email format
    const isValid = validateEmail(trimmedValue)
    
    // Show error only if email is not empty and invalid
    if (trimmedValue.length > 0 && !isValid) {
      setError('Please enter a valid email address')
    }
    
    // Call parent callback
    onEmailChange?.(trimmedValue, isValid)
    onChangeText?.(trimmedValue)
  }
  
  return (
    <Input
      label="Email Address"
      placeholder="Enter your email"
      value={email}
      onChangeText={handleEmailChange}
      keyboardType="email-address"
      autoCapitalize="none"
      autoCorrect={false}
      error={error}
      {...props}
    />
  )
}