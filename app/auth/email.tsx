/**
 * Email Input Screen
 * 
 * First step of authentication - user enters their email address
 */

import React, { useState } from 'react'
import { router } from 'expo-router'
import { AuthCard, EmailInput } from '../../components/auth'
import { Button, LoadingSpinner, Alert, Toast } from '../../components/ui'
import { ThemedText } from '../../components/ThemedText'
import { useAuth } from '../../lib/hooks/useAuth'
import { HapticPatterns } from '../../utils/haptics'

export default function EmailInputScreen() {
  const [email, setEmail] = useState('')
  const [isEmailValid, setIsEmailValid] = useState(false)
  const [loading, setLoading] = useState(false)
  const { sendOTP } = useAuth()

  const handleEmailChange = (emailValue: string, isValid: boolean) => {
    setEmail(emailValue)
    setIsEmailValid(isValid)
  }

  const handleContinue = async () => {
    if (!isEmailValid || !email.trim()) {
      await HapticPatterns.inputError()
      return
    }

    setLoading(true)

    try {
      await sendOTP(email.trim())
      await HapticPatterns.formSubmit()
      
      // Show success toast
      Toast.success('Verification code sent to your email!')
      
      // Navigate to OTP screen with email as parameter
      router.push({
        pathname: '/auth/otp',
        params: { email: email.trim() }
      })
    } catch (error) {
      await HapticPatterns.loginError()
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to send verification code'
      Alert.error('Error', errorMessage, [
        { text: 'OK', onPress: () => HapticPatterns.buttonPress() }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleBack = async () => {
    await HapticPatterns.navigate()
    router.back()
  }

  if (loading) {
    return (
      <AuthCard
        title="Sending Code..."
        subtitle="We're sending a verification code to your email"
      >
        <LoadingSpinner 
          text="Please wait"
          size="large"
        />
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title="Welcome to snacc"
      subtitle="Enter your email address to get started. We'll send you a verification code."
      footer={
        <ThemedText 
          variant="caption" 
          color="secondary" 
          center
          onPress={handleBack}
          style={{ textDecorationLine: 'underline' }}
        >
          Back to welcome
        </ThemedText>
      }
    >
      <EmailInput
        value={email}
        onEmailChange={handleEmailChange}
        autoFocus
        placeholder="your@email.com"
      />

      <Button
        title="Continue"
        size="lg"
        fullWidth
        onPress={handleContinue}
        disabled={!isEmailValid || loading}
      />
    </AuthCard>
  )
}