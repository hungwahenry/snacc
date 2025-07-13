import { supabase } from '../supabase'
import type { Snacc, CreateSnaccPayload, SnaccWithProfile } from '../types/social'

export class SnaccService {
  /**
   * Create a new snacc
   */
  static async createSnacc(payload: CreateSnaccPayload): Promise<Snacc> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      // Validate that at least one of text or gif_url is provided
      if (!payload.text?.trim() && !payload.gif_url?.trim()) {
        throw new Error('Snacc must contain either text or a GIF')
      }

      const snaccData = {
        user_id: user.id,
        text: payload.text?.trim() || null,
        gif_url: payload.gif_url?.trim() || null,
        visibility: payload.visibility,
      }

      const { data, error } = await supabase
        .from('snaccs')
        .insert(snaccData)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      // Increment user's snaccs count
      await supabase.rpc('increment_snaccs_count', { user_id: user.id })

      return data
    } catch (error) {
      console.error('Error creating snacc:', error)
      throw error
    }
  }

  /**
   * Get snaccs for a specific user
   */
  static async getUserSnaccs(
    userId: string, 
    limit: number = 20, 
    offset: number = 0
  ): Promise<SnaccWithProfile[]> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      // First get the snaccs
      const { data: snaccData, error: snaccError } = await supabase
        .from('snaccs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (snaccError) {
        throw new Error(snaccError.message)
      }

      if (!snaccData || snaccData.length === 0) {
        return []
      }

      // Get the profile for the user
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError) {
        throw new Error(profileError.message)
      }

      // Combine snaccs with profile data
      return snaccData.map(snacc => ({
        ...snacc,
        profile: profileData,
      }))
    } catch (error) {
      console.error('Error getting user snaccs:', error)
      throw error
    }
  }

  /**
   * Get feed of snaccs from users that current user follows
   */
  static async getFeed(limit: number = 20, offset: number = 0): Promise<SnaccWithProfile[]> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      // Get users that current user follows
      const { data: followData, error: followError } = await supabase
        .from('follows')
        .select('followee_id')
        .eq('follower_id', user.id)

      if (followError) {
        throw new Error(followError.message)
      }

      const followingIds = followData?.map(f => f.followee_id) || []
      
      // Include current user's own snaccs in the feed
      const userIds = [user.id, ...followingIds]

      if (userIds.length === 0) {
        return []
      }

      // Get snaccs from followed users and current user
      const { data: snaccData, error: snaccError } = await supabase
        .from('snaccs')
        .select('*')
        .in('user_id', userIds)
        .or('visibility.eq.public,and(visibility.eq.followers_only,user_id.eq.' + user.id + ')')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (snaccError) {
        throw new Error(snaccError.message)
      }

      if (!snaccData || snaccData.length === 0) {
        return []
      }

      // Get profiles for all unique user IDs
      const uniqueUserIds = [...new Set(snaccData.map(s => s.user_id))]
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', uniqueUserIds)

      if (profileError) {
        throw new Error(profileError.message)
      }

      // Create a map of profiles by user ID
      const profileMap = new Map((profileData || []).map(p => [p.id, p]))

      // Combine snaccs with profile data
      return snaccData.map(snacc => ({
        ...snacc,
        profile: profileMap.get(snacc.user_id)!,
      }))
    } catch (error) {
      console.error('Error getting feed:', error)
      throw error
    }
  }

  /**
   * Get public snaccs (discovery feed)
   */
  static async getPublicSnaccs(limit: number = 20, offset: number = 0): Promise<SnaccWithProfile[]> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      // Get public snaccs from all users
      const { data: snaccData, error: snaccError } = await supabase
        .from('snaccs')
        .select('*')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (snaccError) {
        throw new Error(snaccError.message)
      }

      if (!snaccData || snaccData.length === 0) {
        return []
      }

      // Get profiles for all unique user IDs
      const uniqueUserIds = [...new Set(snaccData.map(s => s.user_id))]
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', uniqueUserIds)

      if (profileError) {
        throw new Error(profileError.message)
      }

      // Create a map of profiles by user ID
      const profileMap = new Map((profileData || []).map(p => [p.id, p]))

      // Combine snaccs with profile data
      return snaccData.map(snacc => ({
        ...snacc,
        profile: profileMap.get(snacc.user_id)!,
      }))
    } catch (error) {
      console.error('Error getting public snaccs:', error)
      throw error
    }
  }

  /**
   * Delete a snacc
   */
  static async deleteSnacc(snaccId: string): Promise<void> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      // Verify ownership
      const { data: snaccData, error: snaccError } = await supabase
        .from('snaccs')
        .select('user_id')
        .eq('id', snaccId)
        .single()

      if (snaccError) {
        throw new Error(snaccError.message)
      }

      if (snaccData.user_id !== user.id) {
        throw new Error('You can only delete your own snaccs')
      }

      // Delete the snacc (reactions will be deleted via cascade)
      const { error: deleteError } = await supabase
        .from('snaccs')
        .delete()
        .eq('id', snaccId)

      if (deleteError) {
        throw new Error(deleteError.message)
      }

      // Decrement user's snaccs count
      await supabase.rpc('decrement_snaccs_count', { user_id: user.id })
    } catch (error) {
      console.error('Error deleting snacc:', error)
      throw error
    }
  }

  /**
   * Get a single snacc by ID
   */
  static async getSnacc(snaccId: string): Promise<SnaccWithProfile | null> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      // Get the snacc
      const { data: snaccData, error: snaccError } = await supabase
        .from('snaccs')
        .select('*')
        .eq('id', snaccId)
        .single()

      if (snaccError) {
        if (snaccError.code === 'PGRST116') {
          return null
        }
        throw new Error(snaccError.message)
      }

      // Get the profile for the snacc author
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', snaccData.user_id)
        .single()

      if (profileError) {
        throw new Error(profileError.message)
      }

      return {
        ...snaccData,
        profile: profileData,
      }
    } catch (error) {
      console.error('Error getting snacc:', error)
      throw error
    }
  }
}