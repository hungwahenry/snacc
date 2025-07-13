/**
 * Direct Messaging Service
 * 
 * Handles DM eligibility checking and related functionality
 * Implements the DM system as detailed in dm.md
 */

import { supabase } from '../supabase'
import type { DMEligibility } from '../types/social'

export class DMService {
  /**
   * Check DM eligibility between current user and target user
   * Returns whether users can DM based on mutual follow + blocking status
   */
  static async checkDMEligibility(targetUserId: string): Promise<DMEligibility> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      if (user.id === targetUserId) {
        return { canDM: false, reason: 'not_following' }
      }

      // Use the database function to check mutual follow + blocking
      const { data, error } = await supabase
        .rpc('check_mutual_follow', {
          user_a_id: user.id,
          user_b_id: targetUserId
        })

      if (error) {
        throw new Error(error.message)
      }

      if (data) {
        return { canDM: true, reason: 'mutual_follow' }
      }

      // If not mutual follow, check why
      // First check if blocked
      const { data: blockCheck, error: blockError } = await supabase
        .rpc('is_user_blocked', {
          user_a_id: user.id,
          user_b_id: targetUserId
        })

      if (blockError) {
        throw new Error(blockError.message)
      }

      if (blockCheck) {
        return { canDM: false, reason: 'blocked' }
      }

      // Check follow status to determine if it's one-way or no follow
      const { data: followCheck } = await supabase
        .from('follows')
        .select('follower_id')
        .or(`and(follower_id.eq.${user.id},followee_id.eq.${targetUserId}),and(follower_id.eq.${targetUserId},followee_id.eq.${user.id})`)

      if (followCheck && followCheck.length > 0) {
        return { canDM: false, reason: 'one_way_follow' }
      }

      return { canDM: false, reason: 'not_following' }
    } catch (error) {
      console.error('Error checking DM eligibility:', error)
      return { canDM: false, reason: 'not_following' }
    }
  }

  /**
   * Get a user-friendly message explaining DM eligibility
   */
  static getDMEligibilityMessage(eligibility: DMEligibility): string {
    switch (eligibility.reason) {
      case 'mutual_follow':
        return 'You can send direct messages'
      case 'blocked':
        return 'Cannot send messages'
      case 'one_way_follow':
        return 'Follow each other to send messages'
      case 'not_following':
        return 'Follow each other to send messages'
      default:
        return 'Cannot send messages'
    }
  }
}