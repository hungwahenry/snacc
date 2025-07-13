/**
 * Custom Toast Component for Snacc App
 * 
 * A themed toast notification system with haptic feedback
 * and smooth animations for non-blocking notifications
 */

import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  Animated,
  TouchableOpacity,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useThemedStyles } from '../../contexts/ThemeContext'
import { HapticPatterns } from '../../utils/haptics'
import { Spacing, BorderRadius, Typography, Shadows } from '../../constants/Design'
import type { ThemeColors } from '../../constants/Design'

export type ToastType = 'info' | 'success' | 'warning' | 'error'
export type ToastPosition = 'top' | 'bottom'

export interface ToastOptions {
  message: string
  type?: ToastType
  duration?: number
  position?: ToastPosition
  action?: {
    label: string
    onPress: () => void
  }
}

interface ToastState extends ToastOptions {
  id: string
  visible: boolean
}


class ToastManager {
  private static instance: ToastManager
  private toasts: ToastState[] = []
  private setToasts: ((toasts: ToastState[]) => void) | null = null

  static getInstance(): ToastManager {
    if (!ToastManager.instance) {
      ToastManager.instance = new ToastManager()
    }
    return ToastManager.instance
  }

  setToastsUpdater(updater: (toasts: ToastState[]) => void) {
    this.setToasts = updater
  }

  show(options: ToastOptions) {
    const id = `toast_${Date.now()}_${Math.random()}`
    const toast: ToastState = {
      ...options,
      id,
      visible: true,
      duration: options.duration || 3000,
    }

    this.toasts = [...this.toasts, toast]
    this.setToasts?.(this.toasts)

    // Auto dismiss after duration
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => {
        this.hide(id)
      }, toast.duration)
    }
  }

  hide(id: string) {
    this.toasts = this.toasts.filter(toast => toast.id !== id)
    this.setToasts?.(this.toasts)
  }

  hideAll() {
    this.toasts = []
    this.setToasts?.(this.toasts)
  }
}

const ToastItem: React.FC<{
  toast: ToastState
  onDismiss: (id: string) => void
  index: number
}> = ({ toast, onDismiss, index }) => {
  const styles = useThemedStyles(createStyles)
  const insets = useSafeAreaInsets()
  const translateY = React.useRef(new Animated.Value(toast.position === 'top' ? -100 : 100)).current
  const opacity = React.useRef(new Animated.Value(0)).current
  const scale = React.useRef(new Animated.Value(0.9)).current

  useEffect(() => {
    // Entry animation
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start()

    return () => {
      // Exit animation
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: toast.position === 'top' ? -100 : 100,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [])

  const handleDismiss = async () => {
    await HapticPatterns.buttonPress()
    onDismiss(toast.id)
  }

  const handleActionPress = async () => {
    await HapticPatterns.buttonPress()
    toast.action?.onPress()
    onDismiss(toast.id)
  }

  const getToastIcon = () => {
    switch (toast.type) {
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

  const positionStyle = toast.position === 'top' 
    ? { top: insets.top + Spacing.md + (index * (60 + Spacing.sm)) }
    : { bottom: insets.bottom + Spacing.md + (index * (60 + Spacing.sm)) }
  
  const typeStyle = toast.type ? styles[`toast${toast.type.charAt(0).toUpperCase() + toast.type.slice(1)}` as keyof typeof styles] : {}

  return (
    <Animated.View
      style={[
        styles.container,
        positionStyle,
        typeStyle,
        {
          transform: [
            { translateY },
            { scale },
          ],
          opacity,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={handleDismiss}
        activeOpacity={0.9}
      >
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{getToastIcon()}</Text>
        </View>
        
        <View style={styles.messageContainer}>
          <Text style={styles.message} numberOfLines={2}>
            {toast.message}
          </Text>
        </View>

        {toast.action && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleActionPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.actionText}>{toast.action.label}</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </Animated.View>
  )
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastState[]>([])

  useEffect(() => {
    ToastManager.getInstance().setToastsUpdater(setToasts)
  }, [])

  const handleDismiss = (id: string) => {
    ToastManager.getInstance().hide(id)
  }

  // Separate toasts by position
  const topToasts = toasts.filter(toast => toast.position === 'top' || !toast.position)
  const bottomToasts = toasts.filter(toast => toast.position === 'bottom')

  return (
    <>
      {children}
      
      {/* Top toasts */}
      {topToasts.map((toast, index) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={handleDismiss}
          index={index}
        />
      ))}

      {/* Bottom toasts */}
      {bottomToasts.map((toast, index) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={handleDismiss}
          index={index}
        />
      ))}
    </>
  )
}

function createStyles(theme: ThemeColors) {
  return {
    container: {
      position: 'absolute' as const,
      left: Spacing.md,
      right: Spacing.md,
      zIndex: 9999,
    },

    content: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: theme.surface,
      borderRadius: BorderRadius.xl,
      padding: Spacing.md,
      minHeight: 60,
      ...Shadows.lg,
    },

    toastSuccess: {
      borderLeftWidth: 4,
      borderLeftColor: theme.success,
    },

    toastWarning: {
      borderLeftWidth: 4,
      borderLeftColor: theme.warning,
    },

    toastError: {
      borderLeftWidth: 4,
      borderLeftColor: theme.error,
    },

    toastInfo: {
      borderLeftWidth: 4,
      borderLeftColor: theme.primary,
    },

    iconContainer: {
      marginRight: Spacing.sm,
    },

    icon: {
      fontSize: Typography.fontSize.lg,
    },

    messageContainer: {
      flex: 1,
      marginRight: Spacing.sm,
    },

    message: {
      fontSize: Typography.fontSize.base,
      color: theme.text,
      lineHeight: Typography.fontSize.base * 1.3,
    },

    actionButton: {
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.sm,
      backgroundColor: theme.primaryLight,
      borderRadius: BorderRadius.md,
    },

    actionText: {
      fontSize: Typography.fontSize.sm,
      fontWeight: Typography.fontWeight.medium,
      color: theme.primary,
    },
  }
}

// Export static methods for easy usage
export const Toast = {
  show: (message: string, options?: Partial<ToastOptions>) => {
    ToastManager.getInstance().show({
      message,
      type: 'info',
      duration: 3000,
      position: 'top',
      ...options,
    })
  },

  success: (message: string, options?: Partial<Omit<ToastOptions, 'type'>>) => {
    ToastManager.getInstance().show({
      message,
      type: 'success',
      duration: 3000,
      position: 'top',
      ...options,
    })
  },

  warning: (message: string, options?: Partial<Omit<ToastOptions, 'type'>>) => {
    ToastManager.getInstance().show({
      message,
      type: 'warning',
      duration: 4000,
      position: 'top',
      ...options,
    })
  },

  error: (message: string, options?: Partial<Omit<ToastOptions, 'type'>>) => {
    ToastManager.getInstance().show({
      message,
      type: 'error',
      duration: 5000,
      position: 'top',
      ...options,
    })
  },

  hide: (id?: string) => {
    if (id) {
      ToastManager.getInstance().hide(id)
    } else {
      ToastManager.getInstance().hideAll()
    }
  },
}