/**
 * Custom Alert Component for Snacc App
 * 
 * A themed alert dialog that replaces React Native's Alert.alert
 * with consistent design, haptic feedback, and theme integration
 */

import React, { useState } from 'react'
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
} from 'react-native'
import { useThemedStyles } from '../../contexts/ThemeContext'
import { HapticPatterns } from '../../utils/haptics'
import { Spacing, BorderRadius, Typography, Shadows } from '../../constants/Design'
import type { ThemeColors } from '../../constants/Design'

export type AlertType = 'info' | 'success' | 'warning' | 'error'

export interface AlertButton {
  text: string
  style?: 'default' | 'cancel' | 'destructive'
  onPress?: () => void
}

export interface AlertOptions {
  title: string
  message?: string
  type?: AlertType
  buttons?: AlertButton[]
  cancelable?: boolean
}

interface AlertState extends AlertOptions {
  visible: boolean
}

class AlertManager {
  private static instance: AlertManager
  private alertState: AlertState = {
    title: '',
    visible: false,
  }
  private setState: ((state: AlertState) => void) | null = null

  static getInstance(): AlertManager {
    if (!AlertManager.instance) {
      AlertManager.instance = new AlertManager()
    }
    return AlertManager.instance
  }

  setStateUpdater(updater: (state: AlertState) => void) {
    this.setState = updater
  }

  show(options: AlertOptions) {
    if (this.setState) {
      this.setState({
        ...options,
        visible: true,
      })
    }
  }

  hide() {
    if (this.setState) {
      this.setState({
        ...this.alertState,
        visible: false,
      })
    }
  }
}

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alertState, setAlertState] = useState<AlertState>({
    title: '',
    visible: false,
  })
  const styles = useThemedStyles(createStyles)
  const scaleAnim = React.useRef(new Animated.Value(0)).current
  const opacityAnim = React.useRef(new Animated.Value(0)).current

  React.useEffect(() => {
    AlertManager.getInstance().setStateUpdater(setAlertState)
  }, [])

  React.useEffect(() => {
    if (alertState.visible) {
      // Show animation
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      // Hide animation
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [alertState.visible])

  const handleBackdropPress = async () => {
    if (alertState.cancelable !== false) {
      await HapticPatterns.buttonPress()
      AlertManager.getInstance().hide()
    }
  }

  const handleButtonPress = async (button: AlertButton) => {
    await HapticPatterns.buttonPress()
    AlertManager.getInstance().hide()
    button.onPress?.()
  }

  const getAlertIcon = () => {
    switch (alertState.type) {
      case 'success':
        return '✅'
      case 'warning':
        return '⚠️'
      case 'error':
        return '❌'
      default:
        return 'ℹ️'
    }
  }

  const defaultButtons: AlertButton[] = [
    { text: 'OK', style: 'default' }
  ]

  const buttons = alertState.buttons || defaultButtons

  return (
    <>
      {children}
      <Modal
        visible={alertState.visible}
        transparent
        animationType="none"
        statusBarTranslucent
      >
        <TouchableWithoutFeedback onPress={handleBackdropPress}>
          <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]}>
            <TouchableWithoutFeedback>
              <Animated.View 
                style={[
                  styles.alertContainer,
                  alertState.type && styles[`alert${alertState.type.charAt(0).toUpperCase() + alertState.type.slice(1)}` as keyof typeof styles],
                  { transform: [{ scale: scaleAnim }] }
                ]}
              >
                {/* Header */}
                <View style={styles.header}>
                  <Text style={styles.icon}>{getAlertIcon()}</Text>
                  <Text style={styles.title}>{alertState.title}</Text>
                </View>

                {/* Message */}
                {alertState.message && (
                  <View style={styles.messageContainer}>
                    <Text style={styles.message}>{alertState.message}</Text>
                  </View>
                )}

                {/* Buttons */}
                <View style={styles.buttonContainer}>
                  {buttons.map((button, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.button,
                        button.style === 'cancel' && styles.buttonCancel,
                        button.style === 'destructive' && styles.buttonDestructive,
                        buttons.length === 1 && styles.buttonSingle,
                        index === 0 && buttons.length > 1 && styles.buttonFirst,
                        index === buttons.length - 1 && buttons.length > 1 && styles.buttonLast,
                      ]}
                      onPress={() => handleButtonPress(button)}
                      activeOpacity={0.7}
                    >
                      <Text 
                        style={[
                          styles.buttonText,
                          button.style === 'cancel' && styles.buttonTextCancel,
                          button.style === 'destructive' && styles.buttonTextDestructive,
                        ]}
                      >
                        {button.text}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </Animated.View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  )
}

function createStyles(theme: ThemeColors) {
  return {
    backdrop: {
      flex: 1,
      backgroundColor: theme.overlay,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      padding: Spacing.xl,
    },

    alertContainer: {
      backgroundColor: theme.surface,
      borderRadius: BorderRadius.xl,
      width: '100%',
      maxWidth: 320,
      overflow: 'hidden' as const,
      ...Shadows.lg,
    },

    alertSuccess: {
      borderColor: theme.success,
      borderWidth: 2,
    },

    alertWarning: {
      borderColor: theme.warning,
      borderWidth: 2,
    },

    alertError: {
      borderColor: theme.error,
      borderWidth: 2,
    },

    alertInfo: {
      borderColor: theme.primary,
      borderWidth: 2,
    },

    header: {
      alignItems: 'center' as const,
      padding: Spacing.xl,
      paddingBottom: Spacing.lg,
    },

    icon: {
      fontSize: Typography.fontSize['2xl'],
      marginBottom: Spacing.sm,
    },

    title: {
      fontSize: Typography.fontSize.lg,
      fontWeight: Typography.fontWeight.bold,
      color: theme.text,
      textAlign: 'center' as const,
      lineHeight: Typography.fontSize.lg * 1.2,
    },

    messageContainer: {
      paddingHorizontal: Spacing.xl,
      paddingBottom: Spacing.lg,
    },

    message: {
      fontSize: Typography.fontSize.base,
      color: theme.textSecondary,
      textAlign: 'center' as const,
      lineHeight: Typography.fontSize.base * 1.4,
    },

    buttonContainer: {
      flexDirection: 'row' as const,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },

    button: {
      flex: 1,
      paddingVertical: Spacing.lg,
      paddingHorizontal: Spacing.md,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderRightWidth: 1,
      borderRightColor: theme.border,
    },

    buttonSingle: {
      borderRightWidth: 0,
    },

    buttonFirst: {
      // No specific styles needed
    },

    buttonLast: {
      borderRightWidth: 0,
    },

    buttonCancel: {
      backgroundColor: theme.surfaceSecondary,
    },

    buttonDestructive: {
      backgroundColor: theme.errorLight,
    },

    buttonText: {
      fontSize: Typography.fontSize.base,
      fontWeight: Typography.fontWeight.medium,
      color: theme.primary,
    },

    buttonTextCancel: {
      color: theme.textSecondary,
    },

    buttonTextDestructive: {
      color: theme.error,
      fontWeight: Typography.fontWeight.semibold,
    },
  }
}

// Export static methods for easy usage
export const Alert = {
  alert: (title: string, message?: string, buttons?: AlertButton[], options?: Partial<AlertOptions>) => {
    AlertManager.getInstance().show({
      title,
      message,
      buttons,
      type: 'info',
      cancelable: true,
      ...options,
    })
  },

  success: (title: string, message?: string, buttons?: AlertButton[]) => {
    AlertManager.getInstance().show({
      title,
      message,
      buttons,
      type: 'success',
      cancelable: true,
    })
  },

  warning: (title: string, message?: string, buttons?: AlertButton[]) => {
    AlertManager.getInstance().show({
      title,
      message,
      buttons,
      type: 'warning',
      cancelable: true,
    })
  },

  error: (title: string, message?: string, buttons?: AlertButton[]) => {
    AlertManager.getInstance().show({
      title,
      message,
      buttons,
      type: 'error',
      cancelable: true,
    })
  },
}