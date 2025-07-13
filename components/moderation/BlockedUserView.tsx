import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '@/contexts/ThemeContext'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'

interface BlockedUserViewProps {
  blockedByUser?: boolean // True if the other user blocked you
  userBlockedThem?: boolean // True if you blocked them
  username?: string
}

export function BlockedUserView({ 
  blockedByUser = false, 
  userBlockedThem = false,
  username 
}: BlockedUserViewProps) {
  const { theme } = useTheme()
  const router = useRouter()
  const styles = createStyles(theme)

  const handleGoBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.back()
  }

  const getTitle = () => {
    if (blockedByUser) {
      return 'Profile Unavailable'
    }
    if (userBlockedThem) {
      return 'User Blocked'
    }
    return 'Profile Unavailable'
  }

  const getMessage = () => {
    if (blockedByUser) {
      return `This user has restricted access to their profile. You cannot view their content or interact with them.`
    }
    if (userBlockedThem) {
      return `You have blocked ${username ? `@${username}` : 'this user'}. You cannot view their content or interact with them.`
    }
    return 'This profile is not available.'
  }

  const getSubMessage = () => {
    if (blockedByUser) {
      return 'This restriction was set by the user and cannot be changed.'
    }
    if (userBlockedThem) {
      return 'You can unblock them from your settings if you want to restore access.'
    }
    return null
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Ionicons 
            name={blockedByUser ? "lock-closed" : "person-remove"} 
            size={64} 
            color={theme.textSecondary} 
          />
        </View>

        {/* Title */}
        <Text style={styles.title}>
          {getTitle()}
        </Text>

        {/* Message */}
        <Text style={styles.message}>
          {getMessage()}
        </Text>

        {/* Sub Message */}
        {getSubMessage() && (
          <Text style={styles.subMessage}>
            {getSubMessage()}
          </Text>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable style={styles.goBackButton} onPress={handleGoBack}>
            <Ionicons name="arrow-back" size={20} color={theme.background} />
            <Text style={styles.goBackButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    </View>
  )
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: theme.text,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 12,
  },
  subMessage: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  actions: {
    gap: 12,
    alignSelf: 'stretch',
  },
  goBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.primary,
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  goBackButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.background,
  },
})