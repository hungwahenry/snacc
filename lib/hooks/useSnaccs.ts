import { useState, useEffect, useCallback } from 'react'
import { SnaccService } from '../backend/snacc'
import type { SnaccWithProfile, CreateSnaccPayload } from '../types/social'

interface UseSnaccsOptions {
  userId?: string // If provided, gets snaccs for specific user
  feedType?: 'user' | 'feed' | 'public' // Type of snaccs to fetch
  autoLoad?: boolean
}

export function useSnaccs({ userId, feedType = 'feed', autoLoad = true }: UseSnaccsOptions = {}) {
  const [snaccs, setSnaccs] = useState<SnaccWithProfile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)

  /**
   * Load snaccs based on the feed type
   */
  const loadSnaccs = useCallback(async (limit = 20, offset = 0, append = false) => {
    try {
      setLoading(true)
      setError(null)

      let data: SnaccWithProfile[] = []

      switch (feedType) {
        case 'user':
          if (!userId) {
            throw new Error('User ID is required for user feed')
          }
          data = await SnaccService.getUserSnaccs(userId, limit, offset)
          break
        case 'feed':
          data = await SnaccService.getFeed(limit, offset)
          break
        case 'public':
          data = await SnaccService.getPublicSnaccs(limit, offset)
          break
        default:
          throw new Error('Invalid feed type')
      }

      if (append) {
        setSnaccs(prev => [...prev, ...data])
      } else {
        setSnaccs(data)
      }

      setHasMore(data.length === limit)
    } catch (err) {
      console.error('Error loading snaccs:', err)
      setError(err instanceof Error ? err.message : 'Failed to load snaccs')
    } finally {
      setLoading(false)
    }
  }, [feedType, userId])

  /**
   * Load more snaccs (pagination)
   */
  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return
    await loadSnaccs(20, snaccs.length, true)
  }, [hasMore, loading, snaccs.length, loadSnaccs])

  /**
   * Refresh snaccs (pull to refresh)
   */
  const refresh = useCallback(async () => {
    await loadSnaccs()
  }, [loadSnaccs])

  /**
   * Create a new snacc
   */
  const createSnacc = useCallback(async (payload: CreateSnaccPayload) => {
    try {
      setError(null)
      const newSnacc = await SnaccService.createSnacc(payload)
      
      // If we're viewing the current user's snaccs or feed, add the new snacc to the top
      if (feedType === 'user' || feedType === 'feed') {
        // We need to get the full snacc with profile data
        const fullSnacc = await SnaccService.getSnacc(newSnacc.id)
        if (fullSnacc) {
          setSnaccs(prev => [fullSnacc, ...prev])
        }
      }
      
      return newSnacc
    } catch (err) {
      console.error('Error creating snacc:', err)
      setError(err instanceof Error ? err.message : 'Failed to create snacc')
      throw err
    }
  }, [feedType])

  /**
   * Delete a snacc
   */
  const deleteSnacc = useCallback(async (snaccId: string) => {
    try {
      setError(null)
      await SnaccService.deleteSnacc(snaccId)
      
      // Remove the snacc from the local state
      setSnaccs(prev => prev.filter(snacc => snacc.id !== snaccId))
    } catch (err) {
      console.error('Error deleting snacc:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete snacc')
      throw err
    }
  }, [])

  /**
   * Update a snacc in the local state (useful after reactions change)
   */
  const updateSnaccInState = useCallback((snaccId: string, updates: Partial<SnaccWithProfile>) => {
    setSnaccs(prev => prev.map(snacc => 
      snacc.id === snaccId ? { ...snacc, ...updates } : snacc
    ))
  }, [])

  /**
   * Clear all snaccs and error state
   */
  const clear = useCallback(() => {
    setSnaccs([])
    setError(null)
    setHasMore(true)
  }, [])

  // Load snaccs on mount and when dependencies change
  useEffect(() => {
    if (autoLoad) {
      loadSnaccs()
    }
  }, [loadSnaccs, autoLoad])

  return {
    // Data
    snaccs,
    
    // Loading states
    loading,
    error,
    hasMore,
    
    // Actions
    loadSnaccs,
    loadMore,
    refresh,
    createSnacc,
    deleteSnacc,
    updateSnaccInState,
    clear,
    
    // Computed values
    isEmpty: snaccs.length === 0 && !loading,
    count: snaccs.length,
  }
}