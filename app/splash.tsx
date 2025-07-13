/**
 * Splash Screen for Snacc App
 * 
 * Initial loading screen that shows app branding while checking authentication state
 */

import React, { useEffect, useState } from 'react'
import { View, Text, Animated, Dimensions } from 'react-native'
import { router } from 'expo-router'
import { useThemedStyles } from '../contexts/ThemeContext'
import { useAuth } from '../lib/hooks/useAuth'
import { Spacing, Typography, BorderRadius } from '../constants/Design'
import type { ThemeColors } from '../constants/Design'

const { width } = Dimensions.get('window')

export default function SplashScreen() {
  const styles = useThemedStyles(createStyles)
  const { isAuthenticated, loading, userContext } = useAuth()
  const [minTimeElapsed, setMinTimeElapsed] = useState(false)
  
  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current
  const logoFadeAnim = React.useRef(new Animated.Value(0)).current
  const taglineFadeAnim = React.useRef(new Animated.Value(0)).current
  const pulseAnim = React.useRef(new Animated.Value(1)).current

  useEffect(() => {
    // Ensure minimum splash time of 2.5 seconds
    const minTimer = setTimeout(() => {
      setMinTimeElapsed(true)
    }, 2500)

    // Start entrance animations
    Animated.sequence([
      // Background fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      // Logo scale and fade in
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 80,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(logoFadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      // Tagline fade in with delay
      Animated.timing(taglineFadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start()

    // Start pulse animation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    )
    pulseAnimation.start()

    return () => {
      clearTimeout(minTimer)
      pulseAnimation.stop()
    }
  }, [])

  useEffect(() => {
    // Only navigate after both auth check is done AND minimum time has elapsed
    if (!loading && minTimeElapsed) {
      // Add a small delay for smooth transition
      const timer = setTimeout(() => {
        if (isAuthenticated && userContext) {
          // User is logged in, go to main app
          router.replace('/(tabs)')
        } else {
          // User is not logged in, go to landing
          router.replace('/landing')
        }
      }, 300)

      return () => clearTimeout(timer)
    }
  }, [loading, isAuthenticated, userContext, minTimeElapsed])

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Background gradient effect */}
      <View style={styles.backgroundGradient} />
      
      {/* Floating elements for visual interest */}
      <View style={styles.floatingElements}>
        <Animated.View 
          style={[
            styles.floatingCircle,
            styles.circle1,
            { transform: [{ scale: pulseAnim }] }
          ]}
        />
        <Animated.View 
          style={[
            styles.floatingCircle,
            styles.circle2,
            { transform: [{ scale: pulseAnim }] }
          ]}
        />
        <Animated.View 
          style={[
            styles.floatingCircle,
            styles.circle3,
            { transform: [{ scale: pulseAnim }] }
          ]}
        />
      </View>

      {/* Main content */}
      <Animated.View 
        style={[
          styles.content,
          {
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        {/* App Logo/Title */}
        <Animated.View 
          style={[
            styles.logoContainer,
            { opacity: logoFadeAnim }
          ]}
        >
          <View style={styles.logoWrapper}>
            <Text style={styles.logo}>snacc</Text>
            <View style={styles.logoDot} />
          </View>
        </Animated.View>

        {/* Tagline */}
        <Animated.View 
          style={[
            styles.taglineContainer,
            { opacity: taglineFadeAnim }
          ]}
        >
          <Text style={styles.tagline}>connect. vibe. discover.</Text>
          <View style={styles.taglineUnderline} />
        </Animated.View>

        {/* Loading dots */}
        <Animated.View 
          style={[
            styles.loadingContainer,
            { opacity: taglineFadeAnim }
          ]}
        >
          <View style={styles.loadingDots}>
            <Animated.View 
              style={[
                styles.dot,
                { transform: [{ scale: pulseAnim }] }
              ]}
            />
            <Animated.View 
              style={[
                styles.dot,
                { transform: [{ scale: pulseAnim }] }
              ]}
            />
            <Animated.View 
              style={[
                styles.dot,
                { transform: [{ scale: pulseAnim }] }
              ]}
            />
          </View>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  )
}

function createStyles(theme: ThemeColors) {
  return {
    container: {
      flex: 1,
      backgroundColor: theme.background,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },

    backgroundGradient: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme.background,
      opacity: 0.8,
    },

    floatingElements: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },

    floatingCircle: {
      position: 'absolute' as const,
      borderRadius: BorderRadius.full,
      opacity: 0.1,
    },

    circle1: {
      width: 120,
      height: 120,
      backgroundColor: theme.primary,
      top: '15%',
      right: '10%',
    },

    circle2: {
      width: 80,
      height: 80,
      backgroundColor: theme.secondary,
      bottom: '25%',
      left: '15%',
    },

    circle3: {
      width: 60,
      height: 60,
      backgroundColor: theme.accent,
      top: '35%',
      left: '20%',
    },

    content: {
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      zIndex: 1,
    },

    logoContainer: {
      alignItems: 'center' as const,
      marginBottom: Spacing['4xl'],
    },

    logoWrapper: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      position: 'relative' as const,
    },

    logo: {
      fontSize: Typography.fontSize['6xl'],
      fontWeight: Typography.fontWeight.bold,
      color: theme.primary,
      letterSpacing: -2,
      textShadowColor: theme.shadow,
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
    },

    logoDot: {
      width: 8,
      height: 8,
      borderRadius: BorderRadius.full,
      backgroundColor: theme.accent,
      marginLeft: Spacing.xs,
      marginBottom: Spacing.lg,
    },

    taglineContainer: {
      alignItems: 'center' as const,
      marginBottom: Spacing['6xl'],
    },

    tagline: {
      fontSize: Typography.fontSize.lg,
      color: theme.textSecondary,
      fontWeight: Typography.fontWeight.medium,
      letterSpacing: 1,
      textAlign: 'center' as const,
      marginBottom: Spacing.sm,
    },

    taglineUnderline: {
      width: 60,
      height: 2,
      backgroundColor: theme.primary,
      borderRadius: BorderRadius.full,
      opacity: 0.6,
    },

    loadingContainer: {
      alignItems: 'center' as const,
    },

    loadingDots: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: Spacing.sm,
    },

    dot: {
      width: 8,
      height: 8,
      borderRadius: BorderRadius.full,
      backgroundColor: theme.primary,
      opacity: 0.7,
    },
  }
}