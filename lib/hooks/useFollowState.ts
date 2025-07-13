import { useState, useEffect, useCallback } from 'react'
import { FollowService } from '../backend/follow'
import type { FollowState, FollowAction } from '../types/social'

interface UseFollowStateOptions {
  targetUserId: string | null
  autoLoad?: boolean
}

export function useFollowState({ targetUserId, autoLoad = true }: UseFollowStateOptions) {
  const [followState, setFollowState] = useState<FollowState>({
    relationship: 'none',
    canFollow: false,
    canUnfollow: false,
    canRemoveFollower: false,
    canMessage: false,
    canViewPrivateContent: false,
    isLoading: false,
  })

  const [error, setError] = useState<string | null>(null)

  /**
   * Load the follow state for the target user
   */
  const loadFollowState = useCallback(async () => {
    if (!targetUserId) {
      setFollowState(prev => ({ ...prev, isLoading: false }))
      return
    }

    try {
      setFollowState(prev => ({ ...prev, isLoading: true }))
      setError(null)

      const state = await FollowService.getFollowState(targetUserId)
      setFollowState({ ...state, isLoading: false })
    } catch (err) {
      console.error('Error loading follow state:', err)
      setError(err instanceof Error ? err.message : 'Failed to load follow state')
      setFollowState(prev => ({ ...prev, isLoading: false }))
    }
  }, [targetUserId])

  /**
   * Perform a follow action and update state
   */
  const performAction = useCallback(async (action: FollowAction) => {
    if (!targetUserId) {
      throw new Error('No target user specified')
    }

    try {
      setFollowState(prev => ({ ...prev, isLoading: true }))
      setError(null)

      await FollowService.performFollowAction(targetUserId, action)
      
      // Reload the follow state after action
      await loadFollowState()
    } catch (err) {
      console.error(`Error performing ${action}:`, err)
      setError(err instanceof Error ? err.message : `Failed to ${action}`)
      setFollowState(prev => ({ ...prev, isLoading: false }))
      throw err
    }
  }, [targetUserId, loadFollowState])

  /**
   * Follow the target user
   */
  const follow = useCallback(async () => {
    await performAction('follow')
  }, [performAction])

  /**
   * Unfollow the target user
   */
  const unfollow = useCallback(async () => {
    await performAction('unfollow')
  }, [performAction])

  /**
   * Remove the target user as a follower
   */
  const removeFollower = useCallback(async () => {
    await performAction('remove_follower')
  }, [performAction])

  /**
   * Block the target user
   */
  const block = useCallback(async () => {
    await performAction('block')
  }, [performAction])

  /**
   * Unblock the target user
   */
  const unblock = useCallback(async () => {
    await performAction('unblock')
  }, [performAction])

  /**
   * Refresh the follow state
   */
  const refresh = useCallback(async () => {
    await loadFollowState()
  }, [loadFollowState])

  // Load follow state on mount and when targetUserId changes
  useEffect(() => {
    if (autoLoad) {
      loadFollowState()
    }
  }, [loadFollowState, autoLoad])

  return {
    // State
    followState,
    error,
    isLoading: followState.isLoading,

    // Computed properties for easier access
    relationship: followState.relationship,
    canFollow: followState.canFollow,
    canUnfollow: followState.canUnfollow,
    canRemoveFollower: followState.canRemoveFollower,
    canMessage: followState.canMessage,
    canViewPrivateContent: followState.canViewPrivateContent,

    // Actions
    follow,
    unfollow,
    removeFollower,
    block,
    unblock,
    refresh,
    loadFollowState,
  }
}