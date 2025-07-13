import { useState, useEffect, useCallback } from 'react'
import { FollowService } from '../backend/follow'
import type { Profile } from '../types/profile'

interface UseFollowListsOptions {
  userId?: string // If not provided, uses current user
  autoLoad?: boolean
}

export function useFollowLists({ userId, autoLoad = true }: UseFollowListsOptions = {}) {
  const [followers, setFollowers] = useState<Profile[]>([])
  const [following, setFollowing] = useState<Profile[]>([])
  const [loadingFollowers, setLoadingFollowers] = useState(false)
  const [loadingFollowing, setLoadingFollowing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Load the followers list
   */
  const loadFollowers = useCallback(async (limit = 50, offset = 0, append = false) => {
    try {
      setLoadingFollowers(true)
      setError(null)

      const data = await FollowService.getFollowers(userId, limit, offset)
      
      if (append) {
        setFollowers(prev => [...prev, ...data])
      } else {
        setFollowers(data)
      }
    } catch (err) {
      console.error('Error loading followers:', err)
      setError(err instanceof Error ? err.message : 'Failed to load followers')
    } finally {
      setLoadingFollowers(false)
    }
  }, [userId])

  /**
   * Load the following list
   */
  const loadFollowing = useCallback(async (limit = 50, offset = 0, append = false) => {
    try {
      setLoadingFollowing(true)
      setError(null)

      const data = await FollowService.getFollowing(userId, limit, offset)
      
      if (append) {
        setFollowing(prev => [...prev, ...data])
      } else {
        setFollowing(data)
      }
    } catch (err) {
      console.error('Error loading following:', err)
      setError(err instanceof Error ? err.message : 'Failed to load following')
    } finally {
      setLoadingFollowing(false)
    }
  }, [userId])

  /**
   * Load more followers (pagination)
   */
  const loadMoreFollowers = useCallback(async () => {
    await loadFollowers(50, followers.length, true)
  }, [loadFollowers, followers.length])

  /**
   * Load more following (pagination)
   */
  const loadMoreFollowing = useCallback(async () => {
    await loadFollowing(50, following.length, true)
  }, [loadFollowing, following.length])

  /**
   * Refresh both lists
   */
  const refresh = useCallback(async () => {
    await Promise.all([
      loadFollowers(),
      loadFollowing(),
    ])
  }, [loadFollowers, loadFollowing])

  /**
   * Clear all data
   */
  const clear = useCallback(() => {
    setFollowers([])
    setFollowing([])
    setError(null)
  }, [])

  // Load data on mount and when userId changes
  useEffect(() => {
    if (autoLoad) {
      refresh()
    }
  }, [refresh, autoLoad])

  return {
    // Data
    followers,
    following,
    
    // Loading states
    loadingFollowers,
    loadingFollowing,
    isLoading: loadingFollowers || loadingFollowing,
    
    // Error state
    error,

    // Actions
    loadFollowers,
    loadFollowing,
    loadMoreFollowers,
    loadMoreFollowing,
    refresh,
    clear,

    // Computed values
    followersCount: followers.length,
    followingCount: following.length,
  }
}