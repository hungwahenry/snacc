import { supabase } from '../supabase'
import type { Follow, FollowRelationship, FollowState, FollowAction } from '../types/social'
import type { Profile } from '../types/profile'

export class FollowService {
  /**
   * Get the relationship status between current user and target user
   */
  static async getFollowRelationship(targetUserId: string): Promise<FollowRelationship> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      if (user.id === targetUserId) {
        return 'none' // Can't follow yourself
      }

      // Check if current user is blocked by target user or has blocked target user
      const { data: blockedData, error: blockedError } = await supabase
        .from('blocked_users')
        .select('blocker_id, blocked_id')
        .or(`and(blocker_id.eq.${user.id},blocked_id.eq.${targetUserId}),and(blocker_id.eq.${targetUserId},blocked_id.eq.${user.id})`)

      if (blockedError) {
        throw new Error(blockedError.message)
      }

      // Check for blocking relationships
      if (blockedData && blockedData.length > 0) {
        const currentUserBlocked = blockedData.find(
          block => block.blocker_id === user.id && block.blocked_id === targetUserId
        )
        const currentUserBlockedBy = blockedData.find(
          block => block.blocker_id === targetUserId && block.blocked_id === user.id
        )

        if (currentUserBlocked) return 'blocked'
        if (currentUserBlockedBy) return 'blocked_by'
      }

      // Check follow relationships
      const { data: followData, error: followError } = await supabase
        .from('follows')
        .select('follower_id, followee_id')
        .or(`and(follower_id.eq.${user.id},followee_id.eq.${targetUserId}),and(follower_id.eq.${targetUserId},followee_id.eq.${user.id})`)

      if (followError) {
        throw new Error(followError.message)
      }

      const currentUserFollowsTarget = followData?.find(
        follow => follow.follower_id === user.id && follow.followee_id === targetUserId
      )
      const targetUserFollowsCurrent = followData?.find(
        follow => follow.follower_id === targetUserId && follow.followee_id === user.id
      )

      if (currentUserFollowsTarget && targetUserFollowsCurrent) {
        return 'mutual'
      } else if (currentUserFollowsTarget) {
        return 'following'
      } else if (targetUserFollowsCurrent) {
        return 'follower'
      } else {
        return 'none'
      }
    } catch (error) {
      console.error('Error getting follow relationship:', error)
      throw error
    }
  }

  /**
   * Get the complete follow state with permissions for a target user
   */
  static async getFollowState(targetUserId: string): Promise<FollowState> {
    try {
      const relationship = await this.getFollowRelationship(targetUserId)

      const followState: FollowState = {
        relationship,
        canFollow: false,
        canUnfollow: false,
        canRemoveFollower: false,
        canMessage: false,
        canViewPrivateContent: false,
      }

      switch (relationship) {
        case 'none':
          followState.canFollow = true
          break
        case 'following':
          followState.canUnfollow = true
          followState.canViewPrivateContent = false // Only mutual follows can see private content
          break
        case 'follower':
          followState.canFollow = true
          followState.canRemoveFollower = true
          break
        case 'mutual':
          followState.canUnfollow = true
          followState.canRemoveFollower = true
          followState.canMessage = true
          followState.canViewPrivateContent = true
          break
        case 'blocked':
        case 'blocked_by':
          // No actions allowed when blocked
          break
      }

      return followState
    } catch (error) {
      console.error('Error getting follow state:', error)
      throw error
    }
  }

  /**
   * Follow a user
   */
  static async followUser(targetUserId: string): Promise<Follow> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      if (user.id === targetUserId) {
        throw new Error('Cannot follow yourself')
      }

      // Check if already following
      const relationship = await this.getFollowRelationship(targetUserId)
      if (relationship === 'following' || relationship === 'mutual') {
        throw new Error('Already following this user')
      }

      if (relationship === 'blocked' || relationship === 'blocked_by') {
        throw new Error('Cannot follow this user')
      }

      // Create follow relationship
      const { data, error } = await supabase
        .from('follows')
        .insert({
          follower_id: user.id,
          followee_id: targetUserId,
        })
        .select()
        .single()

      if (error) {
        // Handle duplicate constraint error gracefully
        if (error.code === '23505') {
          throw new Error('Already following this user')
        }
        throw new Error(error.message)
      }

      // Update follower/following counts
      await Promise.all([
        // Increment current user's following count
        supabase.rpc('increment_following_count', { user_id: user.id }),
        // Increment target user's followers count
        supabase.rpc('increment_followers_count', { user_id: targetUserId }),
      ])

      return data
    } catch (error) {
      console.error('Error following user:', error)
      throw error
    }
  }

  /**
   * Unfollow a user
   */
  static async unfollowUser(targetUserId: string): Promise<void> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      if (user.id === targetUserId) {
        throw new Error('Cannot unfollow yourself')
      }

      // Check if currently following
      const relationship = await this.getFollowRelationship(targetUserId)
      if (relationship !== 'following' && relationship !== 'mutual') {
        throw new Error('Not following this user')
      }

      // Remove follow relationship
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('followee_id', targetUserId)

      if (error) {
        throw new Error(error.message)
      }

      // Update follower/following counts
      await Promise.all([
        // Decrement current user's following count
        supabase.rpc('decrement_following_count', { user_id: user.id }),
        // Decrement target user's followers count
        supabase.rpc('decrement_followers_count', { user_id: targetUserId }),
      ])
    } catch (error) {
      console.error('Error unfollowing user:', error)
      throw error
    }
  }

  /**
   * Remove a follower
   */
  static async removeFollower(followerId: string): Promise<void> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      if (user.id === followerId) {
        throw new Error('Cannot remove yourself')
      }

      // Check if the follower is actually following
      const relationship = await this.getFollowRelationship(followerId)
      if (relationship !== 'follower' && relationship !== 'mutual') {
        throw new Error('This user is not following you')
      }

      // Remove follow relationship (follower -> current user)
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', followerId)
        .eq('followee_id', user.id)

      if (error) {
        throw new Error(error.message)
      }

      // Update follower/following counts
      await Promise.all([
        // Decrement follower's following count
        supabase.rpc('decrement_following_count', { user_id: followerId }),
        // Decrement current user's followers count
        supabase.rpc('decrement_followers_count', { user_id: user.id }),
      ])
    } catch (error) {
      console.error('Error removing follower:', error)
      throw error
    }
  }

  /**
   * Get list of users that current user is following
   */
  static async getFollowing(userId?: string, limit: number = 50, offset: number = 0): Promise<Profile[]> {
    try {
      let targetUserId = userId

      if (!targetUserId) {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          throw new Error('User not authenticated')
        }
        targetUserId = user.id
      }

      // Get the follow relationships first
      const { data: followData, error: followError } = await supabase
        .from('follows')
        .select('followee_id, created_at')
        .eq('follower_id', targetUserId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (followError) {
        throw new Error(followError.message)
      }

      if (!followData || followData.length === 0) {
        return []
      }

      // Get the profiles for those users
      const userIds = followData.map(item => item.followee_id)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds)

      if (profileError) {
        throw new Error(profileError.message)
      }

      // Sort profiles in the same order as the follows
      const profileMap = new Map((profileData || []).map(p => [p.id, p]))
      return followData.map(item => profileMap.get(item.followee_id)).filter(Boolean) as Profile[]
    } catch (error) {
      console.error('Error getting following list:', error)
      throw error
    }
  }

  /**
   * Get list of followers for current user or specified user
   */
  static async getFollowers(userId?: string, limit: number = 50, offset: number = 0): Promise<Profile[]> {
    try {
      let targetUserId = userId

      if (!targetUserId) {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          throw new Error('User not authenticated')
        }
        targetUserId = user.id
      }

      // Get the follow relationships first
      const { data: followData, error: followError } = await supabase
        .from('follows')
        .select('follower_id, created_at')
        .eq('followee_id', targetUserId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (followError) {
        throw new Error(followError.message)
      }

      if (!followData || followData.length === 0) {
        return []
      }

      // Get the profiles for those users
      const userIds = followData.map(item => item.follower_id)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds)

      if (profileError) {
        throw new Error(profileError.message)
      }

      // Sort profiles in the same order as the follows
      const profileMap = new Map((profileData || []).map(p => [p.id, p]))
      return followData.map(item => profileMap.get(item.follower_id)).filter(Boolean) as Profile[]
    } catch (error) {
      console.error('Error getting followers list:', error)
      throw error
    }
  }

  /**
   * Perform a follow action
   */
  static async performFollowAction(targetUserId: string, action: FollowAction): Promise<void> {
    switch (action) {
      case 'follow':
        await this.followUser(targetUserId)
        break
      case 'unfollow':
        await this.unfollowUser(targetUserId)
        break
      case 'remove_follower':
        await this.removeFollower(targetUserId)
        break
      case 'block':
        // Delegate to ProfileService.blockUser
        const ProfileService = (await import('./profile')).ProfileService
        await ProfileService.blockUser(targetUserId)
        break
      case 'unblock':
        // Delegate to ProfileService.unblockUser
        const ProfileServiceUnblock = (await import('./profile')).ProfileService
        await ProfileServiceUnblock.unblockUser(targetUserId)
        break
      default:
        throw new Error(`Unknown follow action: ${action}`)
    }
  }
}