import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Modal,
  SafeAreaView,
  Pressable,
  ActivityIndicator,
  FlatList,
  Image,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '@/contexts/ThemeContext'
import { SnaccBoardService } from '@/lib/backend/snaccBoard'
import type { SnaccBoardViewWithProfile } from '@/lib/types/social'
import type { Profile } from '@/lib/types/profile'

interface ViewersModalProps {
  visible: boolean
  onClose: () => void
  snaccBoardId: string | null
  onUserPress?: (profile: Profile) => void
}

export function ViewersModal({ 
  visible, 
  onClose, 
  snaccBoardId,
  onUserPress
}: ViewersModalProps) {
  const { theme } = useTheme()
  const [viewers, setViewers] = useState<SnaccBoardViewWithProfile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const styles = createStyles(theme)

  useEffect(() => {
    if (visible && snaccBoardId) {
      loadViewers()
    }
  }, [visible, snaccBoardId])

  const loadViewers = async () => {
    if (!snaccBoardId) return
    
    try {
      setLoading(true)
      setError(null)
      const viewersData = await SnaccBoardService.getViewers(snaccBoardId)
      setViewers(viewersData)
    } catch (err) {
      console.error('Error loading viewers:', err)
      setError('Failed to load viewers')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setViewers([])
    setError(null)
    onClose()
  }

  const handleUserPress = (profile: Profile) => {
    onUserPress?.(profile)
    handleClose()
  }

  const formatViewedTime = (viewedAt: string) => {
    const now = new Date()
    const viewed = new Date(viewedAt)
    const diffMs = now.getTime() - viewed.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return viewed.toLocaleDateString()
  }

  const renderViewer = ({ item }: { item: SnaccBoardViewWithProfile }) => (
    <Pressable 
      style={styles.viewerItem}
      onPress={() => handleUserPress(item.profile)}
    >
      <Image
        source={{ 
          uri: item.profile.snacc_pic_url || 'https://api.dicebear.com/7.x/thumbs/png?seed=default' 
        }}
        style={styles.avatar}
      />
      
      <View style={styles.viewerInfo}>
        <Text style={styles.displayName}>
          {item.profile.display_name || item.profile.username}
        </Text>
        <Text style={styles.username}>@{item.profile.username}</Text>
      </View>
      
      <Text style={styles.viewedTime}>
        {formatViewedTime(item.viewed_at)}
      </Text>
    </Pressable>
  )

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="eye-outline" size={64} color={theme.textSecondary} />
      <Text style={styles.emptyTitle}>No views yet</Text>
      <Text style={styles.emptySubtitle}>
        When people view your snacc board, they'll appear here.
      </Text>
    </View>
  )

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.headerButton} onPress={handleClose}>
            <Text style={styles.headerButtonText}>Close</Text>
          </Pressable>
          
          <Text style={styles.headerTitle}>
            Viewers ({viewers.length})
          </Text>
          
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={styles.loadingText}>Loading viewers...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={64} color="#ff4444" />
            <Text style={styles.errorTitle}>Failed to load</Text>
            <Text style={styles.errorSubtitle}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={loadViewers}>
              <Text style={styles.retryButtonText}>Try again</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={viewers}
            renderItem={renderViewer}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={renderEmptyState}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={viewers.length === 0 ? styles.emptyContent : styles.listContent}
          />
        )}
      </SafeAreaView>
    </Modal>
  )
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  headerButton: {
    minWidth: 60,
  },
  headerButtonText: {
    fontSize: 16,
    color: theme.textSecondary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
  },
  placeholder: {
    width: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: theme.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.text,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: theme.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.background,
  },
  listContent: {
    padding: 16,
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyState: {
    alignItems: 'center',
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.text,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  viewerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  viewerInfo: {
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
  },
  viewedTime: {
    fontSize: 12,
    color: theme.textSecondary,
    marginLeft: 8,
  },
})