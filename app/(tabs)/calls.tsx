/**
 * Calls Tab Screen
 * 
 * Video calling interface for random connections
 */

import React from 'react'
import { View } from 'react-native'
import { ThemedView } from '../../components/ThemedView'
import { ThemedText } from '../../components/ThemedText'
import { Button } from '../../components/ui'
import { useThemedStyles } from '../../contexts/ThemeContext'
import { Spacing } from '../../constants/Design'

export default function CallsScreen() {
  const styles = useThemedStyles(createStyles)

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText variant="title" weight="bold" center>
          📹 Call Zone
        </ThemedText>
        <ThemedText variant="body" color="secondary" center>
          Connect with people through random video calls
        </ThemedText>
      </View>

      <View style={styles.content}>
        <ThemedText variant="body" center color="secondary">
          This is where video calling will happen.
          
          {'\n\n'}
          
          Features:
          {'\n'}• Random 1-to-1 video matching
          {'\n'}• Heart reactions during calls
          {'\n'}• Profile viewing and following
          {'\n'}• Skip to next match
          {'\n'}• Block/report functionality
        </ThemedText>
      </View>

      <View style={styles.actions}>
        <Button
          title="Start Calling"
          size="lg"
          fullWidth
          disabled
        />
        <ThemedText variant="caption" color="tertiary" center>
          Coming soon!
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

    actions: {
      paddingBottom: Spacing['2xl'],
      gap: Spacing.sm,
    },
  }
}