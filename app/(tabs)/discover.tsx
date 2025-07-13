/**
 * Discover Tab Screen
 * 
 * User discovery and search interface
 */

import React, { useState } from 'react'
import { View, TextInput, FlatList, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { ThemedView } from '../../components/ThemedView'
import { ThemedText } from '../../components/ThemedText'
import { UserListItem } from '../../components/social'
import { ProfileService } from '../../lib/backend/profile'
import { useAuth } from '../../lib/hooks/useAuth'
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext'
import { Spacing } from '../../constants/Design'
import type { Profile } from '../../lib/types/profile'

export default function DiscoverScreen() {
  const router = useRouter()
  const { theme } = useTheme()
  const styles = useThemedStyles(createStyles)
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [searching, setSearching] = useState(false)

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    
    if (query.trim().length < 2) {
      setSearchResults([])
      return
    }

    try {
      setSearching(true)
      const results = await ProfileService.searchProfiles(query.trim())
      setSearchResults(results)
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  const handleUserPress = (profile: Profile) => {
    router.push(`/profile/${profile.id}`)
  }

  const renderUser = ({ item }: { item: Profile }) => (
    <UserListItem
      profile={item}
      onPress={handleUserPress}
      currentUserId={user?.id}
    />
  )

  const renderEmptyState = () => {
    if (searching) {
      return (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.primary} />
          <ThemedText style={{ marginTop: 16 }} color="secondary">
            Searching users...
          </ThemedText>
        </View>
      )
    }

    if (searchQuery.trim().length === 0) {
      return (
        <View style={styles.centerContent}>
          <ThemedText variant="body" center color="secondary">
            Search for users by username or display name.
            
            {'\n\n'}
            
            Coming soon:
            {'\n'}• Browse by interests and languages
            {'\n'}• Trending snaccs and creators
            {'\n'}• Filter by location and age
            {'\n'}• Suggested people to follow
          </ThemedText>
        </View>
      )
    }

    return (
      <View style={styles.centerContent}>
        <ThemedText variant="body" center color="secondary">
          No users found for "{searchQuery}"
          
          {'\n\n'}
          
          Try searching for:
          {'\n'}• Exact usernames
          {'\n'}• Display names
          {'\n'}• Partial matches
        </ThemedText>
      </View>
    )
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText variant="title" weight="bold">
          🔍 Discover
        </ThemedText>
        <ThemedText variant="body" color="secondary">
          Find new people and interesting content
        </ThemedText>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, { 
            backgroundColor: theme.surface,
            color: theme.text,
            borderColor: theme.border
          }]}
          placeholder="Search users..."
          placeholderTextColor={theme.textSecondary}
          value={searchQuery}
          onChangeText={handleSearch}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
      </View>

      {/* Results */}
      <FlatList
        data={searchResults}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={searchResults.length === 0 ? { flex: 1 } : undefined}
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
      paddingBottom: Spacing.lg,
      paddingHorizontal: Spacing.lg,
      gap: Spacing.sm,
    },

    searchContainer: {
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.lg,
    },

    searchInput: {
      height: 48,
      borderRadius: 24,
      paddingHorizontal: 20,
      fontSize: 16,
      borderWidth: 1,
    },

    centerContent: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      paddingHorizontal: Spacing.lg,
    },
  }
}