import { SnaccBoardModal, ViewSnaccBoardModal } from '@/components/snaccBoard'
import { ReportModal } from '@/components/moderation'
import { useTheme } from '@/contexts/ThemeContext'
import { SnaccBoardService } from '@/lib/backend/snaccBoard'
import { BlockingService, DMService } from '@/lib/backend'
import type { Profile } from '@/lib/types/profile'
import type { SnaccBoardWithProfile, DMEligibility } from '@/lib/types/social'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import React, { useEffect, useState } from 'react'
import { Image, Pressable, StyleSheet, Text, View, Alert, ActionSheetIOS, Platform } from 'react-native'
import { FollowButton } from './FollowButton'
import { FollowersFollowingModal } from './FollowersFollowingModal'
import { DottedCircle } from '../ui/DottedCircle'

interface ProfileHeaderProps {
  profile: Profile
  isOwnProfile?: boolean
  onUserPress?: (profile: Profile) => void
  onSettingsPress?: () => void
}

export function ProfileHeader({ 
  profile, 
  isOwnProfile = false, 
  onUserPress,
  onSettingsPress
}: ProfileHeaderProps) {
  const { theme } = useTheme()
  const [followModalVisible, setFollowModalVisible] = useState(false)
  const [modalInitialTab, setModalInitialTab] = useState<'followers' | 'following'>('followers')
  const [snaccBoardModalVisible, setSnaccBoardModalVisible] = useState(false)
  const [viewSnaccBoardModalVisible, setViewSnaccBoardModalVisible] = useState(false)
  const [userSnaccBoard, setUserSnaccBoard] = useState<SnaccBoardWithProfile | null>(null)
  const [hasOwnSnaccBoard, setHasOwnSnaccBoard] = useState(false)
  const [reportModalVisible, setReportModalVisible] = useState(false)
  const [dmEligibility, setDmEligibility] = useState<DMEligibility | null>(null)
  const [isBlocked, setIsBlocked] = useState(false)
  
  const styles = createStyles(theme)

  // Load profile data when component mounts
  useEffect(() => {
    loadProfileData()
  }, [profile.id, isOwnProfile])

  const loadProfileData = async () => {
    try {
      await Promise.all([
        loadSnaccBoardData(),
        !isOwnProfile && loadDMEligibility(),
        !isOwnProfile && loadBlockingStatus()
      ].filter(Boolean))
    } catch (error) {
      console.error('Error loading profile data:', error)
    }
  }

  const loadSnaccBoardData = async () => {
    try {
      if (isOwnProfile) {
        // Check if current user has a snacc board
        const currentEntry = await SnaccBoardService.getCurrentUserEntry()
        setHasOwnSnaccBoard(!!currentEntry)
      } else {
        // Load other user's snacc board
        const userEntry = await SnaccBoardService.getUserEntry(profile.id)
        setUserSnaccBoard(userEntry)
      }
    } catch (error) {
      console.error('Error loading snacc board data:', error)
    }
  }

  const loadDMEligibility = async () => {
    try {
      const eligibility = await DMService.checkDMEligibility(profile.id)
      setDmEligibility(eligibility)
    } catch (error) {
      console.error('Error loading DM eligibility:', error)
    }
  }

  const loadBlockingStatus = async () => {
    try {
      const blocked = await BlockingService.isUserBlocked(profile.id)
      setIsBlocked(blocked)
    } catch (error) {
      console.error('Error loading blocking status:', error)
    }
  }

  const handleSnaccBoardPress = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    
    if (isOwnProfile) {
      // For own profile, open the snacc board modal for create/edit
      setSnaccBoardModalVisible(true)
    } else {
      // For other profiles, show their snacc board content in view modal
      if (userSnaccBoard) {
        // Track view when opening another user's snacc board
        await SnaccBoardService.recordView(userSnaccBoard.id)
        setViewSnaccBoardModalVisible(true)
      }
    }
  }

  const handleSnaccBoardModalClose = () => {
    setSnaccBoardModalVisible(false)
    // Refresh snacc board data after modal closes
    loadSnaccBoardData()
  }

  const handleMoreActions = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    
    const options = [
      { text: isBlocked ? 'Unblock User' : 'Block User', action: handleBlockAction },
      { text: 'Report User', action: handleReportAction },
      { text: 'Cancel', action: () => {}, style: 'cancel' as const }
    ]

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: options.map(opt => opt.text),
          cancelButtonIndex: options.length - 1,
          destructiveButtonIndex: isBlocked ? -1 : 0,
        },
        (buttonIndex) => {
          if (buttonIndex < options.length - 1) {
            options[buttonIndex].action()
          }
        }
      )
    } else {
      // For Android, we could implement a custom modal or use a library
      Alert.alert(
        'User Actions',
        `Choose an action for @${profile.username}`,
        options.map(opt => ({
          text: opt.text,
          onPress: opt.action,
          style: opt.style || 'default'
        }))
      )
    }
  }

  const handleBlockAction = async () => {
    try {
      if (isBlocked) {
        await BlockingService.unblockUser(profile.id)
        setIsBlocked(false)
        // Refresh data after unblocking
        await loadProfileData()
        Alert.alert('User Unblocked', `@${profile.username} has been unblocked.`)
      } else {
        Alert.alert(
          'Block User',
          `Are you sure you want to block @${profile.username}? This will remove all interactions between you.`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Block',
              style: 'destructive',
              onPress: async () => {
                await BlockingService.blockUser(profile.id)
                setIsBlocked(true)
                Alert.alert('User Blocked', `@${profile.username} has been blocked.`)
              }
            }
          ]
        )
      }
    } catch (error) {
      console.error('Error handling block action:', error)
      Alert.alert('Error', 'Failed to perform action. Please try again.')
    }
  }

  const handleReportAction = () => {
    setReportModalVisible(true)
  }

  const handleDMPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    // TODO: Navigate to DM screen when DM functionality is implemented
    Alert.alert('Direct Messages', 'DM functionality will be implemented soon!')
  }

  const handleFollowersPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setModalInitialTab('followers')
    setFollowModalVisible(true)
  }

  const handleFollowingPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setModalInitialTab('following')
    setFollowModalVisible(true)
  }


  const handleSettingsPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onSettingsPress?.()
  }

  const handleModalUserPress = (selectedProfile: Profile) => {
    setFollowModalVisible(false)
    onUserPress?.(selectedProfile)
  }

  return (
    <>
      <View style={styles.container}>
        {/* Profile Picture and Basic Info */}
        <View style={styles.topSection}>
          {/* Profile Picture with Snacc Board Indicator */}
          <View style={styles.avatarContainer}>
            {(isOwnProfile ? hasOwnSnaccBoard : !!userSnaccBoard) ? (
              <DottedCircle size={88} dotSize={4} gap={6}>
                <Pressable
                  style={styles.avatarWrapperClean}
                  onPress={handleSnaccBoardPress}
                >
                  <Image
                    source={{ 
                      uri: profile.snacc_pic_url || 'https://api.dicebear.com/7.x/thumbs/png?seed=default' 
                    }}
                    style={styles.avatar}
                  />
                </Pressable>
              </DottedCircle>
            ) : (
              <Pressable
                style={styles.avatarWrapperClean}
                onPress={(isOwnProfile || userSnaccBoard) ? handleSnaccBoardPress : undefined}
              >
                <Image
                  source={{ 
                    uri: profile.snacc_pic_url || 'https://api.dicebear.com/7.x/thumbs/png?seed=default' 
                  }}
                  style={styles.avatar}
                />
              </Pressable>
            )}

            {/* Add Snacc Board Button - show when no content and it's own profile */}
            {isOwnProfile && !hasOwnSnaccBoard && (
              <Pressable 
                style={styles.addSnaccButton}
                onPress={handleSnaccBoardPress}
              >
                <Ionicons name="add" size={16} color={theme.background} />
              </Pressable>
            )}
          </View>
          
          <View style={styles.infoSection}>
            <Text style={styles.displayName}>
              {profile.display_name || profile.username}
            </Text>
            <Text style={styles.username}>@{profile.username}</Text>
            
            {profile.snacc_liner && (
              <Text style={styles.snaccLiner}>{profile.snacc_liner}</Text>
            )}
          </View>

          {/* Settings Icon - top right */}
          {isOwnProfile && (
            <View style={styles.settingsContainer}>
              <Pressable style={styles.settingsButton} onPress={handleSettingsPress}>
                <Ionicons name="settings-outline" size={24} color={theme.textSecondary} />
              </Pressable>
            </View>
          )}
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <Pressable style={styles.statItem} onPress={handleFollowersPress}>
            <Text style={styles.statNumber}>{profile.followers_count}</Text>
            <Text style={styles.statLabel}>followers</Text>
          </Pressable>
          
          <View style={styles.statDivider} />
          
          <Pressable style={styles.statItem} onPress={handleFollowingPress}>
            <Text style={styles.statNumber}>{profile.following_count}</Text>
            <Text style={styles.statLabel}>following</Text>
          </Pressable>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profile.hearts_received}</Text>
            <Text style={styles.statLabel}>hearts</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profile.snaccs_count}</Text>
            <Text style={styles.statLabel}>snaccs</Text>
          </View>
        </View>

        {/* Action Buttons */}
        {!isOwnProfile && (
          <View style={styles.actionSection}>
            <View style={styles.buttonRow}>
              <FollowButton targetUserId={profile.id} style={styles.followButton} />
              
              {/* DM Button */}
              {dmEligibility?.canDM && (
                <Pressable style={styles.dmButton} onPress={handleDMPress}>
                  <Ionicons name="chatbubble-outline" size={16} color={theme.primary} />
                  <Text style={styles.dmButtonText}>Message</Text>
                </Pressable>
              )}
              
              {/* More Actions Button */}
              <Pressable style={styles.moreButton} onPress={handleMoreActions}>
                <Ionicons name="ellipsis-horizontal" size={20} color={theme.textSecondary} />
              </Pressable>
            </View>
            
            {/* DM Status Text */}
            {dmEligibility && !dmEligibility.canDM && (
              <Text style={styles.dmStatusText}>
                {DMService.getDMEligibilityMessage(dmEligibility)}
              </Text>
            )}
          </View>
        )}

        {/* Additional Info */}
        {(profile.location || profile.language?.length > 0) && (
          <View style={styles.additionalInfo}>
            {profile.location && (
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={16} color={theme.textSecondary} />
                <Text style={styles.infoText}>{profile.location}</Text>
              </View>
            )}
            
            {profile.language && profile.language.length > 0 && (
              <View style={styles.infoRow}>
                <Ionicons name="language-outline" size={16} color={theme.textSecondary} />
                <Text style={styles.infoText}>
                  {profile.language.join(', ')}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Followers/Following Modal */}
      <FollowersFollowingModal
        visible={followModalVisible}
        onClose={() => setFollowModalVisible(false)}
        userId={profile.id}
        initialTab={modalInitialTab}
        onUserPress={handleModalUserPress}
      />

      {/* Own Snacc Board Modal (Create/Edit) */}
      <SnaccBoardModal
        visible={snaccBoardModalVisible}
        onClose={handleSnaccBoardModalClose}
        onUserPress={onUserPress}
      />

      {/* View Other User's Snacc Board Modal */}
      <ViewSnaccBoardModal
        visible={viewSnaccBoardModalVisible}
        onClose={() => setViewSnaccBoardModalVisible(false)}
        snaccBoard={userSnaccBoard}
      />

      {/* Report Modal */}
      <ReportModal
        visible={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
        targetUser={profile}
        context="profile"
      />
    </>
  )
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    backgroundColor: theme.surface,
    padding: 20,
  },
  topSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    position: 'relative',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatarWrapperClean: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  addSnaccButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.surface,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  infoSection: {
    flex: 1,
  },
  displayName: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    color: theme.textSecondary,
    marginBottom: 8,
  },
  snaccLiner: {
    fontSize: 16,
    color: theme.text,
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingVertical: 16,
    backgroundColor: theme.background,
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 13,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: theme.border,
  },
  actionSection: {
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  followButton: {
    flex: 1,
  },
  dmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.primary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  dmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.primary,
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  dmStatusText: {
    fontSize: 12,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  additionalInfo: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  settingsContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 1,
  },
  settingsButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: theme.surface + '80',
  },
})