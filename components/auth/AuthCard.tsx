/**
 * Auth Card Component
 * 
 * Container component for authentication screens with consistent styling
 */

import React, { type ReactNode } from 'react'
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useThemedStyles } from '../../contexts/ThemeContext'
import { Card } from '../ui/Card'
import { Spacing, Typography } from '../../constants/Design'
import type { ThemeColors } from '../../constants/Design'

export interface AuthCardProps {
  children: ReactNode
  title?: string
  subtitle?: string
  footer?: ReactNode
  scrollable?: boolean
}

export function AuthCard({
  children,
  title,
  subtitle,
  footer,
  scrollable = false,
}: AuthCardProps) {
  const styles = useThemedStyles(createStyles)
  
  const content = (
    <View style={styles.container}>
      <Card style={styles.card} padding="xl">
        {title && (
          <Text style={styles.title}>
            {title}
          </Text>
        )}
        
        {subtitle && (
          <Text style={styles.subtitle}>
            {subtitle}
          </Text>
        )}
        
        <View style={styles.content}>
          {children}
        </View>
      </Card>
      
      {footer && (
        <View style={styles.footer}>
          {footer}
        </View>
      )}
    </View>
  )
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {scrollable ? (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {content}
          </ScrollView>
        ) : (
          content
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

function createStyles(theme: ThemeColors) {
  return {
    safeArea: {
      flex: 1,
      backgroundColor: theme.background,
    },
    
    keyboardView: {
      flex: 1,
    },
    
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center' as const,
      padding: Spacing.lg,
    },
    
    container: {
      flex: 1,
      justifyContent: 'center' as const,
      padding: Spacing.lg,
    },
    
    card: {
      marginBottom: Spacing.lg,
    },
    
    title: {
      fontSize: Typography.fontSize['3xl'],
      fontWeight: Typography.fontWeight.bold,
      color: theme.text,
      textAlign: 'center' as const,
      marginBottom: Spacing.sm,
    },
    
    subtitle: {
      fontSize: Typography.fontSize.base,
      color: theme.textSecondary,
      textAlign: 'center' as const,
      marginBottom: Spacing['2xl'],
      lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
    },
    
    content: {
      gap: Spacing.lg,
    },
    
    footer: {
      alignItems: 'center' as const,
    },
  }
}