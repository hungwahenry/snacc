import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Pressable,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '@/contexts/ThemeContext'
import { UserListItem } from './UserListItem'
import { useFollowLists } from '@/lib/hooks/useFollowLists'
import { useAuth } from '@/lib/hooks/useAuth'
import type { Profile } from '@/lib/types/profile'
import * as Haptics from 'expo-haptics'

interface FollowersFollowingModalProps {
  visible: boolean
  onClose: () => void
  userId: string
  initialTab?: 'followers' | 'following'
  onUserPress?: (profile: Profile) => void
}

export function FollowersFollowingModal({
  visible,
  onClose,
  userId,
  initialTab = 'followers',
  onUserPress,
}: FollowersFollowingModalProps) {
  const { theme } = useTheme()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(initialTab)
  
  const {
    followers,
    following,
    loadingFollowers,
    loadingFollowing,
    error,
    loadMoreFollowers,
    loadMoreFollowing,
    refresh,
  } = useFollowLists({ userId })

  const styles = createStyles(theme)

  useEffect(() => {
    if (visible) {
      refresh()
    }
  }, [visible, refresh])

  const handleTabChange = (tab: 'followers' | 'following') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setActiveTab(tab)
  }

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onClose()
  }

  const handleUserPress = (profile: Profile) => {
    onUserPress?.(profile)
  }

  const handleLoadMore = () => {
    if (activeTab === 'followers') {
      loadMoreFollowers()
    } else {
      loadMoreFollowing()
    }
  }

  const currentData = activeTab === 'followers' ? followers : following
  const isLoading = activeTab === 'followers' ? loadingFollowers : loadingFollowing

  const renderItem = ({ item }: { item: Profile }) => (
    <UserListItem
      profile={item}
      onPress={handleUserPress}
      currentUserId={user?.id}
    />
  )

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons 
        name={activeTab === 'followers' ? 'people-outline' : 'person-add-outline'} 
        size={64} 
        color={theme.textSecondary} 
      />
      <Text style={styles.emptyTitle}>
        No {activeTab === 'followers' ? 'followers' : 'following'} yet
      </Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === 'followers' 
          ? 'Users who follow this account will appear here'
          : 'Accounts this user follows will appear here'
        }
      </Text>
    </View>
  )

  const renderFooter = () => {
    if (!isLoading) return null
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={theme.primary} />
      </View>
    )
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color={theme.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Connections</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <Pressable
            style={[
              styles.tab,
              activeTab === 'followers' && styles.activeTab,
            ]}
            onPress={() => handleTabChange('followers')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'followers' && styles.activeTabText,
              ]}
            >
              Followers ({followers.length})
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.tab,
              activeTab === 'following' && styles.activeTab,
            ]}
            onPress={() => handleTabChange('following')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'following' && styles.activeTabText,
              ]}
            >
              Following ({following.length})
            </Text>
          </Pressable>
        </View>

        {/* Content */}
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={refresh}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={currentData}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={isLoading ? null : renderEmptyState}
            ListFooterComponent={renderFooter}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={currentData.length === 0 ? styles.emptyListContent : undefined}
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
  },
  placeholder: {
    width: 32,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: theme.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.textSecondary,
  },
  activeTabText: {
    color: theme.background,
    fontWeight: '600',
  },
  emptyListContent: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 16,
    color: theme.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: theme.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  retryText: {
    color: theme.background,
    fontSize: 16,
    fontWeight: '600',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
})