/**
 * OTP Verification Screen
 * 
 * Second step of authentication - user enters the 6-digit code sent to their email
 */

import React, { useState, useEffect } from 'react'
import { View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { AuthCard, OTPInput } from '../../components/auth'
import { Button, LoadingSpinner, Alert, Toast } from '../../components/ui'
import { ThemedText } from '../../components/ThemedText'
import { useAuth } from '../../lib/hooks/useAuth'
import { HapticPatterns } from '../../utils/haptics'
import { useThemedStyles } from '../../contexts/ThemeContext'
import { Spacing } from '../../constants/Design'
import type { ThemeColors } from '../../constants/Design'

export default function OTPVerificationScreen() {
  const { email } = useLocalSearchParams<{ email: string }>()
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState(60)
  const { verifyOTP, sendOTP } = useAuth()
  const styles = useThemedStyles(createStyles)

  // Countdown timer for resend
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [timeLeft])

  const handleOTPComplete = async (otpCode: string) => {
    if (!email) {
      Alert.error('Error', 'Email address is missing. Please go back and try again.')
      return
    }

    setLoading(true)

    try {
      const result = await verifyOTP(email, otpCode)
      await HapticPatterns.loginSuccess()

      if (result.data.isNewUser) {
        Toast.success('Welcome to snacc! Let\'s set up your profile.')
        // New user - go to onboarding
        router.replace('/onboarding/username')
      } else {
        Toast.success('Welcome back!')
        // Existing user - go to main app
        router.replace('/(tabs)')
      }
    } catch (error) {
      await HapticPatterns.loginError()
      
      const errorMessage = error instanceof Error ? error.message : 'Invalid verification code'
      Alert.error('Verification Failed', errorMessage, [
        { text: 'OK', onPress: () => HapticPatterns.buttonPress() }
      ])
      
      // Clear the OTP input
      setOtp('')
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (!email || timeLeft > 0) return

    setResendLoading(true)

    try {
      await sendOTP(email)
      await HapticPatterns.formSubmit()
      setTimeLeft(60) // Reset timer
      
      Toast.success('New verification code sent to your email!')
    } catch (error) {
      await HapticPatterns.inputError()
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to resend code'
      Alert.error('Error', errorMessage, [
        { text: 'OK', onPress: () => HapticPatterns.buttonPress() }
      ])
    } finally {
      setResendLoading(false)
    }
  }

  const handleBack = async () => {
    await HapticPatterns.navigate()
    router.back()
  }

  const handleChangeEmail = async () => {
    await HapticPatterns.navigate()
    router.replace('/auth/email')
  }

  if (loading) {
    return (
      <AuthCard
        title="Verifying..."
        subtitle="Please wait while we verify your code"
      >
        <LoadingSpinner 
          text="Verifying code"
          size="large"
        />
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title="Enter Verification Code"
      subtitle={`We've sent a 6-digit code to ${email || 'your email'}. Please enter it below.`}
      footer={
        <View style={styles.footer}>
          <ThemedText 
            variant="caption" 
            color="secondary" 
            center
            onPress={handleChangeEmail}
            style={styles.link}
          >
            Wrong email? Change it
          </ThemedText>
        </View>
      }
    >
      <OTPInput
        value={otp}
        onChangeText={setOtp}
        onComplete={handleOTPComplete}
        autoFocus
        disabled={loading}
      />

      <View style={styles.resendContainer}>
        {timeLeft > 0 ? (
          <ThemedText variant="caption" color="tertiary" center>
            Resend code in {timeLeft}s
          </ThemedText>
        ) : (
          <Button
            title={resendLoading ? "Sending..." : "Resend Code"}
            variant="ghost"
            size="sm"
            onPress={handleResendCode}
            disabled={resendLoading}
          />
        )}
      </View>

      <Button
        title="Verify"
        size="lg"
        fullWidth
        onPress={() => handleOTPComplete(otp)}
        disabled={otp.length !== 6 || loading}
      />
    </AuthCard>
  )
}

function createStyles(theme: ThemeColors) {
  return {
    footer: {
      alignItems: 'center' as const,
      gap: Spacing.sm,
    },

    link: {
      textDecorationLine: 'underline' as const,
    },

    resendContainer: {
      alignItems: 'center' as const,
      marginVertical: Spacing.md,
    },
  }
}