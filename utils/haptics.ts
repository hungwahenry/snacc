/**
 * Haptic Feedback Utilities for Snacc App
 * 
 * Provides consistent haptic feedback across the app with fallback handling
 */

import * as Haptics from 'expo-haptics'
import { Platform } from 'react-native'

// Check if haptics are available on the current platform
const isHapticsAvailable = Platform.OS === 'ios' || Platform.OS === 'android'

/**
 * Light impact haptic feedback
 * Use for: Button taps, small interactions, success states
 */
export const lightHaptic = async () => {
  if (!isHapticsAvailable) return
  
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  } catch (error) {
    // Silently fail if haptics not available
    console.debug('Haptics not available:', error)
  }
}

/**
 * Medium impact haptic feedback
 * Use for: Important button presses, navigation actions, form submissions
 */
export const mediumHaptic = async () => {
  if (!isHapticsAvailable) return
  
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
  } catch (error) {
    console.debug('Haptics not available:', error)
  }
}

/**
 * Heavy impact haptic feedback
 * Use for: Critical actions, errors, major state changes
 */
export const heavyHaptic = async () => {
  if (!isHapticsAvailable) return
  
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
  } catch (error) {
    console.debug('Haptics not available:', error)
  }
}

/**
 * Success haptic feedback
 * Use for: Completed actions, successful submissions, positive confirmations
 */
export const successHaptic = async () => {
  if (!isHapticsAvailable) return
  
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  } catch (error) {
    console.debug('Haptics not available:', error)
  }
}

/**
 * Warning haptic feedback
 * Use for: Caution states, form validation warnings, important notices
 */
export const warningHaptic = async () => {
  if (!isHapticsAvailable) return
  
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
  } catch (error) {
    console.debug('Haptics not available:', error)
  }
}

/**
 * Error haptic feedback
 * Use for: Errors, failed actions, destructive confirmations
 */
export const errorHaptic = async () => {
  if (!isHapticsAvailable) return
  
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
  } catch (error) {
    console.debug('Haptics not available:', error)
  }
}

/**
 * Selection haptic feedback
 * Use for: List item selection, picker changes, toggle switches
 */
export const selectionHaptic = async () => {
  if (!isHapticsAvailable) return
  
  try {
    await Haptics.selectionAsync()
  } catch (error) {
    console.debug('Haptics not available:', error)
  }
}

/**
 * Custom haptic patterns for specific interactions
 */
export const HapticPatterns = {
  // For button press and release
  buttonPress: lightHaptic,
  
  // For navigation
  navigate: mediumHaptic,
  
  // For form interactions
  inputFocus: lightHaptic,
  inputError: errorHaptic,
  formSubmit: mediumHaptic,
  formSuccess: successHaptic,
  
  // For social interactions
  like: lightHaptic,
  heart: mediumHaptic,
  follow: mediumHaptic,
  block: heavyHaptic,
  
  // For authentication
  otpComplete: successHaptic,
  loginSuccess: successHaptic,
  loginError: errorHaptic,
  
  // For video calling
  callStart: mediumHaptic,
  callEnd: lightHaptic,
  callConnect: successHaptic,
  
  // For content interactions
  snaccPost: mediumHaptic,
  snaccLike: lightHaptic,
  snaccDelete: heavyHaptic,
  
  // For settings and toggles
  settingToggle: selectionHaptic,
  themeSwitch: mediumHaptic,
}

// Export all haptic functions for direct use
export {
  lightHaptic as light,
  mediumHaptic as medium,
  heavyHaptic as heavy,
  successHaptic as success,
  warningHaptic as warning,
  errorHaptic as error,
  selectionHaptic as selection,
}