import React from 'react'
import { View, Text, Image, StyleSheet, Pressable } from 'react-native'
import { useTheme } from '@/contexts/ThemeContext'
import { FollowButton } from './FollowButton'
import type { Profile } from '@/lib/types/profile'
import * as Haptics from 'expo-haptics'

interface UserListItemProps {
  profile: Profile
  onPress?: (profile: Profile) => void
  showFollowButton?: boolean
  currentUserId?: string
}

export function UserListItem({ 
  profile, 
  onPress, 
  showFollowButton = true,
  currentUserId 
}: UserListItemProps) {
  const { theme } = useTheme()
  const styles = createStyles(theme)

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPress?.(profile)
  }

  const isCurrentUser = currentUserId === profile.id

  return (
    <Pressable style={styles.container} onPress={handlePress}>
      <View style={styles.leftSection}>
        <Image
          source={{ uri: profile.snacc_pic_url || 'https://api.dicebear.com/7.x/thumbs/png?seed=default' }}
          style={styles.avatar}
        />
        <View style={styles.textContainer}>
          <Text style={styles.displayName} numberOfLines={1}>
            {profile.display_name || profile.username}
          </Text>
          <Text style={styles.username} numberOfLines={1}>
            @{profile.username}
          </Text>
          {profile.snacc_liner && (
            <Text style={styles.snaccLiner} numberOfLines={2}>
              {profile.snacc_liner}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.rightSection}>
        {showFollowButton && !isCurrentUser && (
          <FollowButton targetUserId={profile.id} compact />
        )}
        
        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profile.followers_count}</Text>
            <Text style={styles.statLabel}>followers</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profile.following_count}</Text>
            <Text style={styles.statLabel}>following</Text>
          </View>
        </View>
      </View>
    </Pressable>
  )
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 2,
  },
  username: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 4,
  },
  snaccLiner: {
    fontSize: 13,
    color: theme.textSecondary,
    lineHeight: 16,
  },
  rightSection: {
    alignItems: 'flex-end',
    gap: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
  },
  statLabel: {
    fontSize: 11,
    color: theme.textSecondary,
  },
})