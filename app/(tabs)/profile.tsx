/**
 * Profile Tab Screen
 * 
 * User's own profile and settings
 */

import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import React, { useState, useEffect } from 'react'
import { FlatList, Pressable, View, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { SnaccCard, SnaccComposer } from '../../components/snaccs'
import { ProfileHeader } from '../../components/social/ProfileHeader'
import { ThemedText } from '../../components/ThemedText'
import { ThemedView } from '../../components/ThemedView'
import { Spacing } from '../../constants/Design'
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext'
import { useAuth } from '../../lib/hooks/useAuth'
import { useSnaccs } from '../../lib/hooks/useSnaccs'
import type { SnaccWithProfile } from '../../lib/types/social'

export default function ProfileScreen() {
  const authData = useAuth()
  const { userContext, user } = authData
  const { theme } = useTheme()
  const styles = useThemedStyles(createStyles)
  const router = useRouter()
  const [showComposer, setShowComposer] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [profileReady, setProfileReady] = useState(false)
  const [snaccsReady, setSnaccsReady] = useState(false)
  
  // Get user's snaccs
  const {
    snaccs,
    loading: snaccsLoading,
    loadMore,
    refresh,
    createSnacc,
    deleteSnacc
  } = useSnaccs({
    userId: user?.id,
    feedType: 'user',
    autoLoad: false // Don't auto-load, we'll load manually when user is available
  })

  // Coordinated loading: wait for both profile and snaccs to be ready
  useEffect(() => {
    // Profile is ready when userContext is loaded
    if (userContext?.profile) {
      setProfileReady(true)
    }
  }, [userContext])

  // Load snaccs when user becomes available
  useEffect(() => {
    if (user?.id && !snaccsReady) {
      loadSnaccsData()
    }
  }, [user?.id])

  // Check if everything is ready to show the UI
  useEffect(() => {
    if (profileReady && snaccsReady) {
      setIsInitialLoading(false)
    }
  }, [profileReady, snaccsReady])

  const loadSnaccsData = async () => {
    try {
      await refresh()
      setSnaccsReady(true)
    } catch (error) {
      console.error('Error loading snaccs:', error)
      // Still mark as ready to show the UI, even if snaccs failed to load
      setSnaccsReady(true)
    }
  }


  const handleSettingsPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push('/settings')
  }

  const handleNewSnacc = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setShowComposer(true)
  }

  const handleCreateSnacc = async (payload: any) => {
    await createSnacc(payload)
  }

  const handleDeleteSnacc = async (snaccId: string) => {
    await deleteSnacc(snaccId)
  }

  const renderSnacc = ({ item }: { item: SnaccWithProfile }) => (
    <SnaccCard
      snacc={item}
      onDelete={handleDeleteSnacc}
      showActions={true}
    />
  )

  const renderHeader = () => (
    <>
      {userContext?.profile ? (
        <ProfileHeader 
          profile={userContext.profile} 
          isOwnProfile={true}
          onSettingsPress={handleSettingsPress}
        />
      ) : (
        <View style={styles.header}>
          <ThemedText variant="title" weight="bold">
            👤 Profile
          </ThemedText>
        </View>
      )}
      
    </>
  )


  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="chatbubble-outline" size={64} color={theme.textSecondary} />
      <ThemedText variant="heading" style={styles.emptyTitle}>
        No snaccs yet
      </ThemedText>
      <ThemedText variant="body" color="secondary" style={styles.emptySubtitle}>
        Share your first thought, feeling, or GIF to get started!
      </ThemedText>
    </View>
  )

  // Show loading screen until everything is ready
  if (isInitialLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <ThemedText style={styles.loadingText} color="secondary">
            Loading profile...
          </ThemedText>
        </View>
      </ThemedView>
    )
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={snaccs}
        renderItem={renderSnacc}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshing={snaccsLoading}
        onRefresh={refresh}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={snaccs.length === 0 ? styles.emptyContent : undefined}
      />

      {/* Floating Action Button */}
      <Pressable style={styles.floatingButton} onPress={handleNewSnacc}>
        <Ionicons name="add" size={28} color={theme.background} />
      </Pressable>

      {/* Snacc Composer */}
      <SnaccComposer
        visible={showComposer}
        onClose={() => setShowComposer(false)}
        onSubmit={handleCreateSnacc}
      />
    </ThemedView>
  )
}

function createStyles() {
  return {
    container: {
      flex: 1,
      paddingTop: Spacing['6xl'],
    },

    header: {
      paddingBottom: Spacing['2xl'],
      paddingHorizontal: Spacing.lg,
      gap: Spacing.sm,
    },

    floatingButton: {
      position: 'absolute' as const,
      bottom: 100,
      right: 10,
      width: 50,
      height: 50,
      borderRadius: 28,
      backgroundColor: '#6366f1', // Primary color
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },


    emptyContent: {
      flexGrow: 1,
    },

    emptyState: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing['6xl'],
    },

    emptyTitle: {
      marginTop: Spacing.lg,
      marginBottom: Spacing.sm,
      textAlign: 'center' as const,
    },

    emptySubtitle: {
      textAlign: 'center' as const,
      lineHeight: 22,
    },

    loadingContainer: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      gap: 16,
    },

    loadingText: {
      fontSize: 16,
    },
  }
}