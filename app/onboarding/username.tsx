/**
 * Username Selection Screen
 * 
 * First step of onboarding - new users choose their unique username
 */

import React, { useState, useCallback } from 'react'
import { View } from 'react-native'
import { router } from 'expo-router'
import { AuthCard } from '../../components/auth'
import { Button, Input } from '../../components/ui'
import { ThemedText } from '../../components/ThemedText'
import { useAuth } from '../../lib/hooks/useAuth'
import { HapticPatterns } from '../../utils/haptics'
import { useThemedStyles } from '../../contexts/ThemeContext'
import { Spacing } from '../../constants/Design'
import type { ThemeColors } from '../../constants/Design'

// Debounce hook for username availability checking
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  React.useEffect(() => {
    console.log('⏱️ Debounce timer started for value:', value, 'delay:', delay)
    const handler = setTimeout(() => {
      console.log('⏰ Debounce timer fired, updating debouncedValue to:', value)
      setDebouncedValue(value)
    }, delay)

    return () => {
      console.log('🗑️ Debounce timer cleared for value:', value)
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export default function UsernameSelectionScreen() {
  const [username, setUsername] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [error, setError] = useState('')
  const { checkUsernameAvailability } = useAuth()
  const styles = useThemedStyles(createStyles)

  const debouncedUsername = useDebounce(username, 500)

  // Validate username format
  const validateUsername = (value: string): boolean => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
    return usernameRegex.test(value)
  }

  // Check availability when debounced username changes
  React.useEffect(() => {
    console.log('⏰ Debounced username changed:', debouncedUsername)
    
    if (!debouncedUsername) {
      console.log('🔄 Clearing availability state (empty username)')
      setIsAvailable(null)
      setError('')
      return
    }

    if (!validateUsername(debouncedUsername)) {
      console.log('❌ Username validation failed')
      setIsAvailable(null)
      return
    }

    console.log('✅ Username validation passed, checking availability...')
    setIsChecking(true)
    setError('')

    const checkAvailability = async () => {
      try {
        console.log('🚀 Calling checkUsernameAvailability API...')
        const available = await checkUsernameAvailability(debouncedUsername)
        console.log('📝 API response - available:', available)
        
        setIsAvailable(available)
        
        if (!available) {
          console.log('⚠️ Username taken, showing error')
          setError('This username is already taken')
          await HapticPatterns.inputError()
        } else {
          console.log('✅ Username available!')
        }
      } catch (error) {
        console.error('💥 Error checking username availability:', error)
        setError('Failed to check username availability')
        setIsAvailable(null)
      } finally {
        console.log('🏁 Finished checking, setting isChecking to false')
        setIsChecking(false)
      }
    }

    checkAvailability()
  }, [debouncedUsername, checkUsernameAvailability])

  const handleUsernameChange = (value: string) => {
    // Only allow valid characters and convert to lowercase
    const cleaned = value.toLowerCase().replace(/[^a-z0-9_]/g, '')
    setUsername(cleaned)
    
    // Clear previous states
    setIsAvailable(null)
    setError('')
    
    // Validate format
    if (cleaned.length > 0 && !validateUsername(cleaned)) {
      if (cleaned.length < 3) {
        setError('Username must be at least 3 characters')
      } else if (cleaned.length > 20) {
        setError('Username must be 20 characters or less')
      } else {
        setError('Username can only contain letters, numbers, and underscores')
      }
    }
  }

  const handleContinue = async () => {
    if (!username || !isAvailable || isChecking) return

    await HapticPatterns.navigate()
    
    // Pass username to next screen
    router.push({
      pathname: '/onboarding/profile',
      params: { username }
    })
  }

  const getInputStatus = () => {
    if (!username) return { error: '', hint: 'Choose a unique username for your profile' }
    if (error) return { error, hint: '' }
    if (isChecking) return { error: '', hint: 'Checking availability...' }
    if (isAvailable === true) return { error: '', hint: '✓ Username is available!' }
    if (isAvailable === false) return { error: 'This username is already taken', hint: '' }
    return { error: '', hint: '' }
  }

  const inputStatus = getInputStatus()
  const canContinue = username.length >= 3 && isAvailable === true && !isChecking

  return (
    <AuthCard
      title="Choose Your Username"
      subtitle="Your username is how other users will find and identify you on snacc. Choose something memorable!"
    >
      <View style={styles.inputContainer}>
        <Input
          label="Username"
          value={username}
          onChangeText={handleUsernameChange}
          placeholder="your_username"
          autoFocus
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={20}
          error={inputStatus.error}
          hint={inputStatus.hint}
        />
        
        <View style={styles.usernamePreview}>
          <ThemedText variant="caption" color="secondary">
            Your profile will be: @{username || 'your_username'}
          </ThemedText>
        </View>
      </View>

      <View style={styles.guidelines}>
        <ThemedText variant="caption" color="secondary" weight="medium">
          Username Guidelines:
        </ThemedText>
        <ThemedText variant="caption" color="tertiary">
          • 3-20 characters long
        </ThemedText>
        <ThemedText variant="caption" color="tertiary">
          • Letters, numbers, and underscores only
        </ThemedText>
        <ThemedText variant="caption" color="tertiary">
          • Must be unique across all users
        </ThemedText>
      </View>

      <Button
        title="Continue"
        size="lg"
        fullWidth
        onPress={handleContinue}
        disabled={!canContinue}
        loading={isChecking}
      />
    </AuthCard>
  )
}

function createStyles(theme: ThemeColors) {
  return {
    inputContainer: {
      gap: Spacing.sm,
    },

    usernamePreview: {
      paddingHorizontal: Spacing.sm,
    },

    guidelines: {
      gap: Spacing.xs,
      paddingHorizontal: Spacing.sm,
    },
  }
}