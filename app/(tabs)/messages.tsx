/**
 * Messages Tab Screen
 * 
 * Direct messaging interface for mutual followers
 */

import React from 'react'
import { View } from 'react-native'
import { ThemedView } from '../../components/ThemedView'
import { ThemedText } from '../../components/ThemedText'
import { useThemedStyles } from '../../contexts/ThemeContext'
import { Spacing } from '../../constants/Design'

export default function MessagesScreen() {
  const styles = useThemedStyles(createStyles)

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText variant="title" weight="bold">
          💬 Messages
        </ThemedText>
        <ThemedText variant="body" color="secondary">
          Private chats with mutual followers
        </ThemedText>
      </View>

      <View style={styles.content}>
        <ThemedText variant="body" center color="secondary">
          This is where your DM conversations will appear.
          
          {'\n\n'}
          
          Features:
          {'\n'}• Real-time messaging
          {'\n'}• Typing indicators
          {'\n'}• Read receipts
          {'\n'}• Message history
          {'\n'}• Only available with mutual follows
        </ThemedText>
      </View>
    </ThemedView>
  )
}

function createStyles() {
  return {
    container: {
      flex: 1,
      paddingTop: Spacing['6xl'],
      paddingHorizontal: Spacing.lg,
    },

    header: {
      paddingBottom: Spacing['2xl'],
      gap: Spacing.sm,
    },

    content: {
      flex: 1,
      justifyContent: 'center' as const,
    },
  }
}