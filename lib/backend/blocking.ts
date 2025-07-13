/**
 * Blocking Service
 * 
 * Handles user blocking and unblocking functionality
 * Implements the blocking system as detailed in blocking-reporting.md
 */

import { supabase } from '../supabase'
import type { BlockedUser } from '../types/social'

export class BlockingService {
  /**
   * Block a user
   * This will trigger automatic cleanup of follows, reactions, etc.
   */
  static async blockUser(targetUserId: string): Promise<void> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      if (user.id === targetUserId) {
        throw new Error('Cannot block yourself')
      }

      // Check if user is already blocked
      const { data: existingBlock } = await supabase
        .from('blocked_users')
        .select('id')
        .eq('blocker_id', user.id)
        .eq('blocked_id', targetUserId)
        .single()

      if (existingBlock) {
        throw new Error('User is already blocked')
      }

      // Create the block (this triggers automatic cleanup via database trigger)
      const { error } = await supabase
        .from('blocked_users')
        .insert({
          blocker_id: user.id,
          blocked_id: targetUserId,
        })

      if (error) {
        throw new Error(error.message)
      }
    } catch (error) {
      console.error('Error blocking user:', error)
      throw error
    }
  }

  /**
   * Unblock a user
   * Note: This does NOT restore any deleted data (follows, reactions, etc.)
   */
  static async unblockUser(targetUserId: string): Promise<void> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      const { error } = await supabase
        .from('blocked_users')
        .delete()
        .eq('blocker_id', user.id)
        .eq('blocked_id', targetUserId)

      if (error) {
        throw new Error(error.message)
      }
    } catch (error) {
      console.error('Error unblocking user:', error)
      throw error
    }
  }

  /**
   * Check if current user has blocked target user
   */
  static async isUserBlocked(targetUserId: string): Promise<boolean> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        return false
      }

      const { data } = await supabase
        .from('blocked_users')
        .select('id')
        .eq('blocker_id', user.id)
        .eq('blocked_id', targetUserId)
        .single()

      return !!data
    } catch (error) {
      console.error('Error checking if user is blocked:', error)
      return false
    }
  }

  /**
   * Check if there's any blocking relationship between two users (either direction)
   */
  static async checkBlockingRelationship(userId1: string, userId2: string): Promise<{
    isBlocked: boolean
    blockedBy?: string // The user who initiated the block
  }> {
    try {
      const { data, error } = await supabase
        .rpc('is_user_blocked', {
          user_a_id: userId1,
          user_b_id: userId2
        })

      if (error) {
        throw new Error(error.message)
      }

      if (!data) {
        return { isBlocked: false }
      }

      // If blocked, find out who blocked whom
      const { data: blockData } = await supabase
        .from('blocked_users')
        .select('blocker_id')
        .or(`and(blocker_id.eq.${userId1},blocked_id.eq.${userId2}),and(blocker_id.eq.${userId2},blocked_id.eq.${userId1})`)
        .single()

      return {
        isBlocked: true,
        blockedBy: blockData?.blocker_id
      }
    } catch (error) {
      console.error('Error checking blocking relationship:', error)
      return { isBlocked: false }
    }
  }

  /**
   * Get list of users blocked by current user
   */
  static async getBlockedUsers(): Promise<BlockedUser[]> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await supabase
        .from('blocked_users')
        .select(`
          *,
          blocked_profile:profiles!blocked_users_blocked_id_fkey(*)
        `)
        .eq('blocker_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(error.message)
      }

      return data || []
    } catch (error) {
      console.error('Error getting blocked users:', error)
      throw error
    }
  }

}