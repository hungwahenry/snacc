import React from 'react'
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native'
import { useTheme } from '@/contexts/ThemeContext'
import { useFollowState } from '@/lib/hooks/useFollowState'
import { Alert } from '@/components/ui/Alert'
import { Toast } from '@/components/ui/Toast'
import * as Haptics from 'expo-haptics'

interface FollowButtonProps {
  targetUserId: string
  compact?: boolean
  style?: any
}

export function FollowButton({ targetUserId, compact = false, style }: FollowButtonProps) {
  const { theme } = useTheme()
  const {
    followState,
    isLoading,
    error,
    follow,
    unfollow,
    removeFollower,
    block,
    unblock,
  } = useFollowState({ targetUserId })

  const handleFollowAction = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      
      switch (followState.relationship) {
        case 'none':
        case 'follower':
          await follow()
          Toast.show('Following!', { type: 'success' })
          break
        case 'following':
        case 'mutual':
          await unfollow()
          Toast.show('Unfollowed', { type: 'info' })
          break
        default:
          break
      }
    } catch (err) {
      console.error('Follow action error:', err)
      Toast.show(err instanceof Error ? err.message : 'Action failed', { type: 'error' })
    }
  }

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    
    const actions = []
    
    if (followState.canRemoveFollower) {
      actions.push({
        text: 'Remove Follower',
        onPress: async () => {
          try {
            await removeFollower()
            Toast.show('Follower removed', { type: 'info' })
          } catch (err) {
            Toast.show(err instanceof Error ? err.message : 'Failed to remove follower', { type: 'error' })
          }
        },
        style: 'destructive' as const,
      })
    }

    if (followState.relationship !== 'blocked') {
      actions.push({
        text: 'Block User',
        onPress: async () => {
          try {
            await block()
            Toast.show('User blocked', { type: 'info' })
          } catch (err) {
            Toast.show(err instanceof Error ? err.message : 'Failed to block user', { type: 'error' })
          }
        },
        style: 'destructive' as const,
      })
    } else {
      actions.push({
        text: 'Unblock User',
        onPress: async () => {
          try {
            await unblock()
            Toast.show('User unblocked', { type: 'success' })
          } catch (err) {
            Toast.show(err instanceof Error ? err.message : 'Failed to unblock user', { type: 'error' })
          }
        },
      })
    }

    actions.push({
      text: 'Cancel',
      style: 'cancel' as const,
    })

    Alert.alert('User Actions', 'Choose an action', actions)
  }

  const getButtonConfig = () => {
    if (followState.relationship === 'blocked') {
      return {
        text: 'Blocked',
        backgroundColor: theme.text + '20',
        textColor: theme.text + '60',
        disabled: true,
      }
    }

    if (followState.relationship === 'blocked_by') {
      return {
        text: 'Unavailable',
        backgroundColor: theme.text + '20',
        textColor: theme.text + '60',
        disabled: true,
      }
    }

    switch (followState.relationship) {
      case 'none':
        return {
          text: 'Follow',
          backgroundColor: theme.primary,
          textColor: theme.background,
          disabled: !followState.canFollow,
        }
      case 'following':
        return {
          text: 'Following',
          backgroundColor: theme.text + '15',
          textColor: theme.text,
          disabled: !followState.canUnfollow,
        }
      case 'follower':
        return {
          text: 'Follow Back',
          backgroundColor: theme.primary,
          textColor: theme.background,
          disabled: !followState.canFollow,
        }
      case 'mutual':
        return {
          text: 'Following',
          backgroundColor: theme.text + '15',
          textColor: theme.text,
          disabled: !followState.canUnfollow,
        }
      default:
        return {
          text: 'Follow',
          backgroundColor: theme.primary,
          textColor: theme.background,
          disabled: true,
        }
    }
  }

  const buttonConfig = getButtonConfig()
  const styles = createStyles(theme, compact)

  if (error && !isLoading) {
    return (
      <View style={[styles.button, styles.errorButton, style]}>
        <Text style={[styles.buttonText, { color: theme.text + '60' }]}>
          Error
        </Text>
      </View>
    )
  }

  return (
    <Pressable
      style={[
        styles.button,
        {
          backgroundColor: buttonConfig.backgroundColor,
          opacity: buttonConfig.disabled ? 0.6 : 1,
        },
        style,
      ]}
      onPress={buttonConfig.disabled ? undefined : handleFollowAction}
      onLongPress={buttonConfig.disabled ? undefined : handleLongPress}
      disabled={buttonConfig.disabled || isLoading}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={buttonConfig.textColor} />
      ) : (
        <Text style={[styles.buttonText, { color: buttonConfig.textColor }]}>
          {buttonConfig.text}
        </Text>
      )}
    </Pressable>
  )
}

const createStyles = (theme: any, compact: boolean) => StyleSheet.create({
  button: {
    paddingHorizontal: compact ? 16 : 24,
    paddingVertical: compact ? 8 : 12,
    borderRadius: compact ? 16 : 20,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: compact ? 80 : 100,
  },
  buttonText: {
    fontSize: compact ? 14 : 16,
    fontWeight: '600',
  },
  errorButton: {
    backgroundColor: theme.text + '10',
  },
})