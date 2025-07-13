/**
 * Home Tab Screen
 * 
 * Main feed screen for authenticated users
 */

import React from 'react'
import { View } from 'react-native'
import { ThemedView } from '../../components/ThemedView'
import { ThemedText } from '../../components/ThemedText'
import { useAuth } from '../../lib/hooks/useAuth'
import { useThemedStyles } from '../../contexts/ThemeContext'
import { Spacing } from '../../constants/Design'
import type { ThemeColors } from '../../constants/Design'

export default function HomeScreen() {
  const { userContext } = useAuth()
  const styles = useThemedStyles(createStyles)

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText variant="title" weight="bold">
          Welcome to snacc! 👋
        </ThemedText>
        
        {userContext?.profile && (
          <ThemedText variant="body" color="secondary">
            Hey @{userContext.profile.username}! Your profile is all set up.
          </ThemedText>
        )}
      </View>

      <View style={styles.content}>
        <ThemedText variant="body" center color="secondary">
          This is where your snacc feed will appear.
          
          {'\n\n'}
          
          The home tab will show:
          {'\n'}• Recent snaccs from people you follow
          {'\n'}• Trending content
          {'\n'}• Your own snacc board
          {'\n'}• Heart reactions and interactions
        </ThemedText>
      </View>
    </ThemedView>
  )
}

function createStyles(theme: ThemeColors) {
  return {
    container: {
      flex: 1,
      paddingTop: Spacing['6xl'],
    },

    header: {
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing['2xl'],
      gap: Spacing.sm,
    },

    content: {
      flex: 1,
      paddingHorizontal: Spacing.lg,
      justifyContent: 'center' as const,
    },
  }
}