/**
 * Landing Screen for Snacc App
 * 
 * Welcome screen for new users with app introduction and call-to-action
 */

import React from 'react'
import { View, Text, ImageBackground, Dimensions, StatusBar } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { useThemedStyles, useTheme } from '../contexts/ThemeContext'
import { Button } from '../components/ui'
import { ThemedText } from '../components/ThemedText'
import { HapticPatterns } from '../utils/haptics'
import { Spacing, Typography, BorderRadius } from '../constants/Design'
import type { ThemeColors } from '../constants/Design'

const { width, height } = Dimensions.get('window')

export default function LandingScreen() {
  const { isDark } = useTheme()
  const styles = useThemedStyles((theme) => createStyles(theme, isDark))

  const handleGetStarted = async () => {
    await HapticPatterns.navigate()
    router.push('/auth/email')
  }

  // Choose background image based on theme
  const backgroundSource = isDark 
    ? require('../assets/background/dark.jpg')
    : require('../assets/background/light.jpg')

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      {/* Fullscreen Background Image */}
      <ImageBackground
        source={backgroundSource}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Gradient Overlay - fades to theme background at bottom */}
        <LinearGradient
          colors={[
            'transparent',
            isDark ? 'rgba(28,25,23,0.3)' : 'rgba(250,250,249,0.3)',
            isDark ? 'rgba(28,25,23,0.7)' : 'rgba(250,250,249,0.7)',
            isDark ? '#1c1917' : '#fafaf9' // theme.background equivalents
          ]}
          locations={[0, 0.3, 0.6, 1]}
          style={styles.gradientOverlay}
        />

        {/* Content Container */}
        <View style={styles.contentContainer}>
          
          {/* Bottom Content Area */}
          <View style={styles.bottomContent}>
            
            {/* Header */}
            <View style={styles.headerSection}>
              <Text style={styles.logo}>snacc</Text>
              <View style={styles.logoDot} />
            </View>

            {/* Main Content */}
            <View style={styles.mainContent}>
              <Text style={styles.headline}>
                Connect through{'\n'}spontaneous moments
              </Text>
              
              <Text style={styles.subheading}>
                Meet real people, share your vibes, and discover authentic connections in a whole new way.
              </Text>
            </View>

            {/* Call to Action */}
            <View style={styles.ctaSection}>
              <Button
                title="Get Started"
                size="lg"
                fullWidth
                onPress={handleGetStarted}
                style={styles.ctaButton}
              />
              
              <Text style={styles.disclaimer}>
                By continuing, you agree to our Terms & Privacy Policy
              </Text>
            </View>
          </View>
        </View>
      </ImageBackground>
    </View>
  )
}


function createStyles(theme: ThemeColors, isDark: boolean) {
  return {
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },

    backgroundImage: {
      flex: 1,
      width: width,
      height: height,
    },

    gradientOverlay: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },

    contentContainer: {
      flex: 1,
      justifyContent: 'flex-end' as const,
    },

    bottomContent: {
      paddingHorizontal: Spacing.xl,
      paddingBottom: Spacing['4xl'],
      paddingTop: Spacing.lg,
    },

    headerSection: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginBottom: Spacing.lg,
    },

    logo: {
      fontSize: Typography.fontSize['5xl'],
      fontWeight: Typography.fontWeight.bold,
      color: theme.primary,
      letterSpacing: -2,
    },

    logoDot: {
      width: 8,
      height: 8,
      borderRadius: BorderRadius.full,
      backgroundColor: theme.accent,
      marginLeft: Spacing.xs,
      marginBottom: Spacing.md,
    },

    mainContent: {
      alignItems: 'center' as const,
      marginBottom: Spacing['2xl'],
    },

    headline: {
      fontSize: Typography.fontSize['3xl'],
      fontWeight: Typography.fontWeight.bold,
      color: theme.text,
      textAlign: 'center' as const,
      marginBottom: Spacing.sm,
      lineHeight: Typography.fontSize['3xl'] * 1.1,
    },

    subheading: {
      fontSize: Typography.fontSize.lg,
      color: theme.textSecondary,
      textAlign: 'center' as const,
      marginBottom: Spacing.md,
      lineHeight: Typography.fontSize.lg * 1.4,
      paddingHorizontal: Spacing.md,
    },


    ctaSection: {
      gap: Spacing.lg,
      alignItems: 'center' as const,
    },

    ctaButton: {
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },

    disclaimer: {
      fontSize: Typography.fontSize.sm,
      color: theme.textTertiary,
      textAlign: 'center' as const,
      paddingHorizontal: Spacing.lg,
      lineHeight: Typography.fontSize.sm * 1.3,
    },
  }
}