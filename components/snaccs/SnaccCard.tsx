import React, { useState, useEffect } from 'react'
import { View, Text, Image, StyleSheet, Pressable, Alert, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '@/contexts/ThemeContext'
import { ReactionService } from '@/lib/backend/reaction'
import { useAuth } from '@/lib/hooks/useAuth'
import { ReactionPicker } from './ReactionPicker'
import type { SnaccWithProfile, ReactionGroup } from '@/lib/types/social'
import * as Haptics from 'expo-haptics'

interface SnaccCardProps {
  snacc: SnaccWithProfile
  onUserPress?: (userId: string) => void
  onDelete?: (snaccId: string) => void
  showActions?: boolean // Controls delete button and other management actions
  showReactions?: boolean // Controls reaction buttons and display
}

export function SnaccCard({ 
  snacc, 
  onUserPress, 
  onDelete,
  showActions = true,
  showReactions = true 
}: SnaccCardProps) {
  const { theme } = useTheme()
  const { user } = useAuth()
  const [reactions, setReactions] = useState<ReactionGroup[]>([])
  const [loadingReaction, setLoadingReaction] = useState<string | null>(null)
  const [showReactionPicker, setShowReactionPicker] = useState(false)
  
  const styles = createStyles(theme)
  const isOwnSnacc = user?.id === snacc.user_id

  useEffect(() => {
    loadReactions()
  }, [snacc.id])

  const loadReactions = async () => {
    try {
      const reactionData = await ReactionService.getSnaccReactions(snacc.id)
      setReactions(reactionData)
    } catch (error) {
      console.error('Error loading reactions:', error)
    }
  }

  const handleUserPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onUserPress?.(snacc.user_id)
  }

  const handleReaction = async (emoji: string) => {
    if (loadingReaction) return // Prevent multiple reactions while one is loading
    
    try {
      setLoadingReaction(emoji)
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      await ReactionService.toggleReaction(snacc.id, emoji)
      
      // Reload reactions to get updated state
      await loadReactions()
    } catch (error) {
      console.error('Error reacting:', error)
    } finally {
      setLoadingReaction(null)
    }
  }

  const handleOpenReactionPicker = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setShowReactionPicker(true)
  }

  const handleSelectReaction = (emoji: string) => {
    setShowReactionPicker(false)
    handleReaction(emoji)
  }

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    
    Alert.alert(
      'Delete Snacc',
      'Are you sure you want to delete this snacc? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete?.(snacc.id)
        }
      ]
    )
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'now'
    if (diffMins < 60) return `${diffMins}m`
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays < 7) return `${diffDays}d`
    return date.toLocaleDateString()
  }

  const commonReactions = ['😂', '❤️', '🔥', '👀', '😮', '👏', '🙌', '💯']

  return (
    <View style={styles.container}>
      {/* Header */}
      <Pressable style={styles.header} onPress={handleUserPress}>
        <Image
          source={{ 
            uri: snacc.profile.snacc_pic_url || 'https://api.dicebear.com/7.x/thumbs/png?seed=default' 
          }}
          style={styles.avatar}
        />
        <View style={styles.headerText}>
          <Text style={styles.displayName}>
            {snacc.profile.display_name || snacc.profile.username}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.username}>@{snacc.profile.username}</Text>
            <Text style={styles.separator}>·</Text>
            <Text style={styles.time}>{formatTimeAgo(snacc.created_at)}</Text>
            {snacc.visibility === 'followers_only' && (
              <>
                <Text style={styles.separator}>·</Text>
                <Ionicons name="people" size={12} color={theme.textSecondary} />
              </>
            )}
          </View>
        </View>
        
        {showActions && isOwnSnacc && (
          <Pressable style={styles.menuButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color={theme.textSecondary} />
          </Pressable>
        )}
      </Pressable>

      {/* Content */}
      <View style={styles.content}>
        {snacc.text && (
          <Text style={styles.text}>{snacc.text}</Text>
        )}
        
        {snacc.gif_url && (
          <View style={styles.gifContainer}>
            <Image
              source={{ uri: snacc.gif_url }}
              style={styles.gif}
              resizeMode="contain"
            />
          </View>
        )}
      </View>

      {/* Reactions */}
      {showReactions && (
        <View style={styles.reactionsSection}>
          {/* Quick reaction buttons */}
          <View style={styles.reactionButtons}>
            {commonReactions.map(emoji => {
              const reactionGroup = reactions.find(r => r.emoji === emoji)
              const isReacted = reactionGroup?.user_reacted || false
              const isLoading = loadingReaction === emoji
              
              return (
                <Pressable
                  key={emoji}
                  style={[
                    styles.reactionButton,
                    isReacted && styles.reactionButtonActive,
                    isLoading && styles.reactionButtonLoading
                  ]}
                  onPress={() => handleReaction(emoji)}
                  disabled={!!loadingReaction}
                >
                  {isLoading ? (
                    <ActivityIndicator 
                      size="small" 
                      color={theme.primary} 
                      style={styles.reactionLoader}
                    />
                  ) : (
                    <Text style={styles.reactionEmoji}>{emoji}</Text>
                  )}
                  
                  {!isLoading && reactionGroup && reactionGroup.count > 0 && (
                    <Text style={[
                      styles.reactionCount,
                      isReacted && styles.reactionCountActive
                    ]}>
                      {reactionGroup.count}
                    </Text>
                  )}
                </Pressable>
              )
            })}
            
            {/* More reactions button */}
            <Pressable
              style={styles.moreReactionsButton}
              onPress={handleOpenReactionPicker}
              disabled={!!loadingReaction}
            >
              <Ionicons name="add-circle-outline" size={20} color={theme.textSecondary} />
            </Pressable>
          </View>

          {/* Reaction summary */}
          {reactions.length > 0 && (
            <View style={styles.reactionSummary}>
              {reactions.slice(0, 3).map(reaction => (
                <View key={reaction.emoji} style={styles.reactionGroup}>
                  <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
                  <Text style={styles.reactionCount}>{reaction.count}</Text>
                </View>
              ))}
              {reactions.length > 3 && (
                <Text style={styles.moreReactions}>
                  +{reactions.length - 3} more
                </Text>
              )}
            </View>
          )}
        </View>
      )}

      {/* Reaction Picker Modal */}
      <ReactionPicker
        visible={showReactionPicker}
        onClose={() => setShowReactionPicker(false)}
        onSelectReaction={handleSelectReaction}
      />
    </View>
  )
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    paddingVertical: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  separator: {
    fontSize: 14,
    color: theme.textSecondary,
    marginHorizontal: 6,
  },
  time: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  menuButton: {
    padding: 8,
  },
  content: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
    color: theme.text,
    marginBottom: 8,
  },
  gifContainer: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: theme.background,
  },
  gif: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  reactionsSection: {
    paddingHorizontal: 16,
  },
  reactionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  reactionButtonActive: {
    backgroundColor: theme.primary + '20',
    borderColor: theme.primary,
  },
  reactionButtonLoading: {
    backgroundColor: theme.primary + '10',
    borderColor: theme.primary + '50',
  },
  reactionEmoji: {
    fontSize: 16,
    marginRight: 4,
  },
  reactionCount: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.textSecondary,
  },
  reactionCountActive: {
    color: theme.primary,
  },
  reactionLoader: {
    marginRight: 4,
  },
  moreReactionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    minWidth: 36,
    height: 32,
  },
  reactionSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  reactionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  moreReactions: {
    fontSize: 12,
    color: theme.textSecondary,
    fontStyle: 'italic',
  },
})