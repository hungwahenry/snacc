import { supabase } from '../supabase'
import type { Profile, ProfileUpdatePayload, SnaccBoard } from '../types/profile'
import type { Database } from '../types/database'

export class ProfileService {
  /**
   * Get a user's profile by ID with blocking status
   */
  static async getProfileWithBlockingStatus(userId: string): Promise<{
    profile: Profile | null
    isBlocked: boolean
    blockedByUser: boolean
    userBlockedThem: boolean
  }> {
    try {
      const { data, error } = await supabase
        .rpc('get_profile_with_blocking_status', { profile_id: userId })
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            profile: null,
            isBlocked: false,
            blockedByUser: false,
            userBlockedThem: false
          }
        }
        throw new Error(error.message)
      }

      // Type assertion for the database function response
      const result = data as {
        profile_data: Profile | null
        is_blocked: boolean
        blocked_by_user: boolean
        user_blocked_them: boolean
      }

      return {
        profile: result?.profile_data || null,
        isBlocked: result?.is_blocked || false,
        blockedByUser: result?.blocked_by_user || false,
        userBlockedThem: result?.user_blocked_them || false
      }
    } catch (error) {
      console.error('Error getting profile with blocking status:', error)
      throw error
    }
  }

  /**
   * Get a user's profile by ID (legacy method for compatibility)
   */
  static async getProfile(userId: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null
        }
        throw new Error(error.message)
      }

      return data
    } catch (error) {
      console.error('Error getting profile:', error)
      throw error
    }
  }

  /**
   * Get a user's profile by username
   */
  static async getProfileByUsername(username: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null
        }
        throw new Error(error.message)
      }

      return data
    } catch (error) {
      console.error('Error getting profile by username:', error)
      throw error
    }
  }

  /**
   * Update profile information
   */
  static async updateProfile(profileId: string, updates: Partial<ProfileUpdatePayload>): Promise<Profile> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      if (user.id !== profileId) {
        throw new Error('Unauthorized: Cannot update another user\'s profile')
      }

      const updateData: Database['public']['Tables']['profiles']['Update'] = {
        ...updates,
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profileId)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data
    } catch (error) {
      console.error('Error updating profile:', error)
      throw error
    }
  }

  /**
   * Update push notification token
   */
  static async updatePushToken(token: string): Promise<void> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      const { error } = await supabase
        .from('profiles')
        .update({ 
          push_token: token,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) {
        throw new Error(error.message)
      }
    } catch (error) {
      console.error('Error updating push token:', error)
      throw error
    }
  }

  /**
   * Delete user profile and account
   */
  static async deleteProfile(): Promise<void> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      // Delete profile (this will cascade delete related data due to foreign keys)
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id)

      if (profileError) {
        throw new Error(profileError.message)
      }

      // Delete user from auth (admin function, would need to be implemented via Edge Function)
      // For now, we'll just sign out the user
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Error deleting profile:', error)
      throw error
    }
  }

  /**
   * Create or update snacc board entry
   */
  static async updateSnaccBoard(text: string): Promise<SnaccBoard> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      // First, delete any existing snacc board entry for this user
      await supabase
        .from('snacc_board')
        .delete()
        .eq('user_id', user.id)

      // Create new snacc board entry
      const { data, error } = await supabase
        .from('snacc_board')
        .insert({
          user_id: user.id,
          text,
        })
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data
    } catch (error) {
      console.error('Error updating snacc board:', error)
      throw error
    }
  }

  /**
   * Get user's current snacc board entry
   */
  static async getSnaccBoard(userId?: string): Promise<SnaccBoard | null> {
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

      const { data, error } = await supabase
        .from('snacc_board')
        .select('*')
        .eq('user_id', targetUserId)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null
        }
        throw new Error(error.message)
      }

      return data
    } catch (error) {
      console.error('Error getting snacc board:', error)
      throw error
    }
  }

  /**
   * Delete current snacc board entry
   */
  static async deleteSnaccBoard(): Promise<void> {
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
        .eq('user_id', user.id)

      if (error) {
        throw new Error(error.message)
      }
    } catch (error) {
      console.error('Error deleting snacc board:', error)
      throw error
    }
  }

  /**
   * Block a user
   */
  static async blockUser(userIdToBlock: string): Promise<void> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      if (user.id === userIdToBlock) {
        throw new Error('Cannot block yourself')
      }

      const { error } = await supabase
        .from('blocked_users')
        .insert({
          blocker_id: user.id,
          blocked_id: userIdToBlock,
        })

      if (error) {
        // Handle duplicate constraint error gracefully
        if (error.code === '23505') {
          return // User is already blocked
        }
        throw new Error(error.message)
      }
    } catch (error) {
      console.error('Error blocking user:', error)
      throw error
    }
  }

  /**
   * Unblock a user
   */
  static async unblockUser(userIdToUnblock: string): Promise<void> {
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
        .eq('blocked_id', userIdToUnblock)

      if (error) {
        throw new Error(error.message)
      }
    } catch (error) {
      console.error('Error unblocking user:', error)
      throw error
    }
  }

  /**
   * Get list of blocked users
   */
  static async getBlockedUsers(): Promise<Profile[]> {
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
          blocked_id,
          profiles!blocked_users_blocked_id_fkey (*)
        `)
        .eq('blocker_id', user.id)

      if (error) {
        throw new Error(error.message)
      }

      return data.map((item: any) => item.profiles).filter(Boolean) as Profile[]
    } catch (error) {
      console.error('Error getting blocked users:', error)
      throw error
    }
  }

  /**
   * Check if a user is blocked
   */
  static async isUserBlocked(userId: string): Promise<boolean> {
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
        .select('id')
        .eq('blocker_id', user.id)
        .eq('blocked_id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return false // Not blocked
        }
        throw new Error(error.message)
      }

      return true // Blocked
    } catch (error) {
      console.error('Error checking if user is blocked:', error)
      throw error
    }
  }

  /**
   * Search profiles by username or display name
   */
  static async searchProfiles(query: string, limit: number = 20): Promise<Profile[]> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .neq('id', user.id) // Exclude current user
        .limit(limit)

      if (error) {
        throw new Error(error.message)
      }

      return data || []
    } catch (error) {
      console.error('Error searching profiles:', error)
      throw error
    }
  }
}