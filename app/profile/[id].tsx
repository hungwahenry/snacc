/**
 * User Profile View Screen
 * 
 * Displays another user's profile with follow functionality
 */

import React, { useState, useEffect } from 'react'
import { View, FlatList, ActivityIndicator } from 'react-native'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { ThemedView } from '@/components/ThemedView'
import { ThemedText } from '@/components/ThemedText'
import { ProfileHeader } from '@/components/social/ProfileHeader'
import { SnaccCard } from '@/components/snaccs'
import { BlockedUserView } from '@/components/moderation'
import { ProfileService } from '@/lib/backend/profile'
import { useAuth } from '@/lib/hooks/useAuth'
import { useSnaccs } from '@/lib/hooks/useSnaccs'
import { useTheme } from '@/contexts/ThemeContext'
import type { Profile } from '@/lib/types/profile'
import type { SnaccWithProfile } from '@/lib/types/social'

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { theme } = useTheme()
  const { user } = useAuth()
  
  const [profile, setProfile] = useState<Profile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [profileReady, setProfileReady] = useState(false)
  const [snaccsReady, setSnaccsReady] = useState(false)
  const [blockingStatus, setBlockingStatus] = useState<{
    isBlocked: boolean
    blockedByUser: boolean
    userBlockedThem: boolean
  }>({
    isBlocked: false,
    blockedByUser: false,
    userBlockedThem: false
  })

  // Get user's snaccs
  const {
    snaccs,
    loading: snaccsLoading,
    loadMore,
    refresh: refreshSnaccs
  } = useSnaccs({
    userId: id,
    feedType: 'user',
    autoLoad: false // We'll load after profile loads
  })

  useEffect(() => {
    if (id) {
      loadAllData()
    }
  }, [id])

  // Check if everything is ready to show the UI
  useEffect(() => {
    if (profileReady && snaccsReady) {
      setIsInitialLoading(false)
    }
  }, [profileReady, snaccsReady])

  const loadAllData = async () => {
    if (!id) return

    try {
      setError(null)
      
      // Load profile and snaccs in parallel for better performance
      const [profileResult] = await Promise.allSettled([
        loadProfile(),
        loadSnaccs()
      ])

      // Check if profile loading failed
      if (profileResult.status === 'rejected') {
        setError('Failed to load profile')
        setIsInitialLoading(false)
      }
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Failed to load profile')
      setIsInitialLoading(false)
    } finally {
      // Cleanup handled by individual loading states
    }
  }

  const loadProfile = async () => {
    try {
      const result = await ProfileService.getProfileWithBlockingStatus(id!)
      if (!result.profile) {
        setError('Profile not found')
        return
      }
      
      setProfile(result.profile)
      setBlockingStatus({
        isBlocked: result.isBlocked,
        blockedByUser: result.blockedByUser,
        userBlockedThem: result.userBlockedThem
      })
      setProfileReady(true)
    } catch (err) {
      console.error('Error loading profile:', err)
      throw err
    }
  }

  const loadSnaccs = async () => {
    try {
      await refreshSnaccs()
      setSnaccsReady(true)
    } catch (err) {
      console.error('Error loading snaccs:', err)
      // Still mark as ready to show the UI, even if snaccs failed to load
      setSnaccsReady(true)
    }
  }

  const handleUserPress = (selectedProfile: Profile) => {
    // Navigate to another user's profile
    if (selectedProfile.id !== id) {
      router.push(`/profile/${selectedProfile.id}`)
    }
  }


  // Don't show anything if this is the current user's own profile
  // (they should use the profile tab instead)
  if (user?.id === id) {
    router.replace('/(tabs)/profile')
    return null
  }

  // Show loading screen until everything is ready
  if (isInitialLoading) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Stack.Screen options={{ title: 'Profile', headerShown: false }} />
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText style={{ marginTop: 16 }} color="secondary">
          Loading profile...
        </ThemedText>
      </ThemedView>
    )
  }

  if (error || !profile) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 }}>
        <Stack.Screen options={{ title: 'Profile', headerShown: false }} />
        <Ionicons name="person-outline" size={64} color={theme.textSecondary} />
        <ThemedText style={{ marginTop: 16, textAlign: 'center' }} variant="heading">
          {error || 'Profile not found'}
        </ThemedText>
        <ThemedText style={{ marginTop: 8, textAlign: 'center' }} color="secondary">
          This user may not exist or may have been removed.
        </ThemedText>
      </ThemedView>
    )
  }

  const renderSnacc = ({ item }: { item: SnaccWithProfile }) => (
    <SnaccCard
      snacc={item}
      onUserPress={() => handleUserPress(item.profile)}
      showActions={false} // Don't show delete button for other users' snaccs
      showReactions={true} // Allow reactions on other users' snaccs
    />
  )


  const renderHeader = () => (
    <ProfileHeader 
      profile={profile!}
      isOwnProfile={false}
      onUserPress={handleUserPress}
    />
  )

  const renderEmptyState = () => (
    <View style={{ 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center', 
      paddingHorizontal: 40,
      paddingVertical: 60
    }}>
      <Ionicons name="chatbubble-outline" size={64} color={theme.textSecondary} />
      <ThemedText style={{ 
        marginTop: 16, 
        textAlign: 'center',
        fontSize: 20,
        fontWeight: '600',
        color: theme.text
      }}>
        No snaccs yet
      </ThemedText>
      <ThemedText style={{ 
        marginTop: 8, 
        textAlign: 'center',
        color: theme.textSecondary,
        lineHeight: 22
      }}>
        {profile?.display_name || profile?.username} hasn't shared any snaccs yet.
      </ThemedText>
    </View>
  )

  // Show blocked user view if blocking is detected
  if (blockingStatus.isBlocked) {
    return (
      <ThemedView style={{ flex: 1 }}>
        <Stack.Screen 
          options={{ 
            title: profile?.display_name || profile?.username || 'Profile',
            headerShown: true,
            headerBackTitle: 'Back',
            headerTitleStyle: { color: theme.text },
            headerStyle: { backgroundColor: theme.surface },
          }} 
        />
        <BlockedUserView
          blockedByUser={blockingStatus.blockedByUser}
          userBlockedThem={blockingStatus.userBlockedThem}
          username={profile?.username}
        />
      </ThemedView>
    )
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <Stack.Screen 
        options={{ 
          title: profile?.display_name || profile?.username || 'Profile',
          headerShown: true,
          headerBackTitle: 'Back',
          headerTitleStyle: { color: theme.text },
          headerStyle: { backgroundColor: theme.surface },
        }} 
      />
      
      <FlatList
        data={snaccs}
        renderItem={renderSnacc}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshing={snaccsLoading}
        onRefresh={refreshSnaccs}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={snaccs.length === 0 ? { flexGrow: 1 } : undefined}
      />

    </ThemedView>
  )
}