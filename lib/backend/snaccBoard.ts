/**
 * Snacc Board Service
 * 
 * Handles CRUD operations for ephemeral thought posts
 */

import { supabase } from '../supabase'
import type { CreateSnaccBoardPayload, SnaccBoard, SnaccBoardEntry, SnaccBoardWithProfile, SnaccBoardViewWithProfile } from '../types/social'

export class SnaccBoardService {
  /**
   * Create a new snacc board entry
   * Replaces any existing entry for the user (only one active entry allowed)
   */
  static async createEntry(payload: CreateSnaccBoardPayload): Promise<SnaccBoard> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      // Validate text length
      if (!payload.text.trim()) {
        throw new Error('Snacc board text cannot be empty')
      }

      if (payload.text.length > 150) {
        throw new Error('Snacc board text cannot exceed 150 characters')
      }

      const { data, error } = await supabase
        .from('snacc_board')
        .insert({
          user_id: user.id,
          text: payload.text.trim(),
        })
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data
    } catch (error) {
      console.error('Error creating snacc board entry:', error)
      throw error
    }
  }

  /**
   * Get current user's active snacc board entry
   */
  static async getCurrentUserEntry(): Promise<SnaccBoardEntry | null> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await supabase
        .from('snacc_board')
        .select('*')
        .eq('user_id', user.id)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // No active entry found
        }
        throw new Error(error.message)
      }

      return this.enrichSnaccBoardEntry(data, true)
    } catch (error) {
      console.error('Error getting current user snacc board entry:', error)
      throw error
    }
  }

  /**
   * Get a user's active snacc board entry by user ID
   */
  static async getUserEntry(userId: string): Promise<SnaccBoardWithProfile | null> {
    try {
      const { data, error } = await supabase
        .from('snacc_board')
        .select(`
          *,
          profile:profiles(*)
        `)
        .eq('user_id', userId)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // No active entry found
        }
        throw new Error(error.message)
      }

      return data as SnaccBoardWithProfile
    } catch (error) {
      console.error('Error getting user snacc board entry:', error)
      throw error
    }
  }

  /**
   * Update current user's snacc board entry
   */
  static async updateEntry(id: string, payload: CreateSnaccBoardPayload): Promise<SnaccBoard> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      // Validate text length
      if (!payload.text.trim()) {
        throw new Error('Snacc board text cannot be empty')
      }

      if (payload.text.length > 150) {
        throw new Error('Snacc board text cannot exceed 150 characters')
      }

      const { data, error } = await supabase
        .from('snacc_board')
        .update({
          text: payload.text.trim(),
          created_at: new Date().toISOString(), // Reset creation time
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Reset expiry
        })
        .eq('id', id)
        .eq('user_id', user.id) // Ensure user owns this entry
        .gt('expires_at', new Date().toISOString()) // Only update non-expired entries
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      if (!data) {
        throw new Error('Snacc board entry not found or expired')
      }

      return data
    } catch (error) {
      console.error('Error updating snacc board entry:', error)
      throw error
    }
  }

  /**
   * Delete current user's snacc board entry
   */
  static async deleteEntry(id: string): Promise<void> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      const { error } = await supabase
        .from('snacc_board')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id) // Ensure user owns this entry

      if (error) {
        throw new Error(error.message)
      }
    } catch (error) {
      console.error('Error deleting snacc board entry:', error)
      throw error
    }
  }

  /**
   * Record a view for a snacc board entry
   * Creates/updates a unique view record per user
   */
  static async recordView(id: string): Promise<void> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        return // Don't track views for unauthenticated users
      }

      // Use the database function to record the view
      const { error } = await supabase
        .rpc('increment_snacc_board_views', { board_id: id })

      if (error) {
        console.error('Error recording snacc board view:', error)
        // Don't throw error for view tracking failures
      }
    } catch (error) {
      console.error('Error recording snacc board view:', error)
      // Don't throw error for view tracking failures
    }
  }

  /**
   * Get viewers for a snacc board entry (for the owner to see)
   */
  static async getViewers(id: string): Promise<SnaccBoardViewWithProfile[]> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      // Verify the user owns this snacc board
      const { data: snaccBoard, error: boardError } = await supabase
        .from('snacc_board')
        .select('user_id')
        .eq('id', id)
        .single()

      if (boardError || !snaccBoard || snaccBoard.user_id !== user.id) {
        throw new Error('Unauthorized to view snacc board viewers')
      }

      // Get viewers with their profile information
      const { data, error } = await supabase
        .from('snacc_board_views')
        .select(`
          *,
          profile:profiles(*)
        `)
        .eq('snacc_board_id', id)
        .order('viewed_at', { ascending: false })

      if (error) {
        throw new Error(error.message)
      }

      return (data || []) as SnaccBoardViewWithProfile[]
    } catch (error) {
      console.error('Error getting snacc board viewers:', error)
      throw error
    }
  }

  /**
   * Clean up expired snacc board entries
   * This can be called periodically or triggered by the app
   */
  static async cleanupExpiredEntries(): Promise<number> {
    try {
      const { error } = await supabase
        .rpc('cleanup_expired_snacc_board_entries')

      if (error) {
        throw new Error(error.message)
      }

      // Get count of remaining entries for logging
      const { count } = await supabase
        .from('snacc_board')
        .select('*', { count: 'exact', head: true })

      return count || 0
    } catch (error) {
      console.error('Error cleaning up expired snacc board entries:', error)
      throw error
    }
  }

  /**
   * Get multiple users' snacc board entries (for feeds)
   */
  static async getMultipleUserEntries(userIds: string[]): Promise<SnaccBoardWithProfile[]> {
    try {
      if (userIds.length === 0) {
        return []
      }

      const { data, error } = await supabase
        .from('snacc_board')
        .select(`
          *,
          profile:profiles(*)
        `)
        .in('user_id', userIds)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(error.message)
      }

      return (data || []) as SnaccBoardWithProfile[]
    } catch (error) {
      console.error('Error getting multiple user snacc board entries:', error)
      throw error
    }
  }

  /**
   * Enrich a snacc board entry with calculated fields
   */
  private static enrichSnaccBoardEntry(entry: SnaccBoard, isOwnEntry: boolean): SnaccBoardEntry {
    const now = Date.now()
    const expiresAt = new Date(entry.expires_at).getTime()
    const timeRemaining = Math.max(0, expiresAt - now)
    const isExpired = timeRemaining === 0

    return {
      ...entry,
      timeRemaining,
      isExpired,
      isOwnEntry,
    }
  }

  /**
   * Format time remaining in human readable format
   */
  static formatTimeRemaining(timeRemaining: number): string {
    if (timeRemaining <= 0) {
      return 'Expired'
    }

    const hours = Math.floor(timeRemaining / (1000 * 60 * 60))
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 0) {
      return `${hours}h ${minutes}m left`
    } else if (minutes > 0) {
      return `${minutes}m left`
    } else {
      return 'Less than 1m left'
    }
  }
}