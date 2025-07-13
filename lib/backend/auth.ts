import { supabase } from '../supabase'
import type { OnboardingData, UserContext } from '../types/auth'
import type { Profile } from '../types/profile'
import type { Database } from '../types/database'

export class AuthService {
  /**
   * Generate a random dicebear thumbs avatar URL
   */
  private static generateAvatarUrl(seed: string): string {
    // Use dicebear thumbs style with the user's ID as seed for consistency
    return `https://api.dicebear.com/7.x/thumbs/png?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,fecaca,fed7aa,fef3c7`
  }

  /**
   * Send OTP code to email for passwordless authentication
   */
  static async sendOTP(email: string) {
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        },
      })

      if (error) {
        throw new Error(error.message)
      }

      return { success: true, data }
    } catch (error) {
      console.error('Error sending OTP:', error)
      throw error
    }
  }

  /**
   * Verify OTP code and complete authentication
   */
  static async verifyOTP(email: string, token: string) {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      })

      if (error) {
        throw new Error(error.message)
      }

      const { user, session } = data

      if (!user || !session) {
        throw new Error('Authentication failed')
      }

      // Check if user has completed onboarding
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      let isNewUser = false
      if (profileError && profileError.code === 'PGRST116') {
        // Profile doesn't exist, user needs onboarding
        isNewUser = true
      } else if (profileError) {
        throw new Error(profileError.message)
      }

      return {
        success: true,
        data: {
          user,
          session,
          profile,
          isNewUser,
        },
      }
    } catch (error) {
      console.error('Error verifying OTP:', error)
      throw error
    }
  }

  /**
   * Get current authenticated user session
   */
  static async getCurrentSession() {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error) {
        throw new Error(error.message)
      }

      return { session }
    } catch (error) {
      console.error('Error getting current session:', error)
      throw error
    }
  }

  /**
   * Sign out current user
   */
  static async signOut() {
    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        throw new Error(error.message)
      }

      return { success: true }
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  /**
   * Get comprehensive user context for hydration
   */
  static async getCurrentUserContext(): Promise<UserContext> {
    try {
      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      // Call the RPC function to get full user context
      const { data, error } = await supabase.rpc('get_current_user_context')

      if (error) {
        throw new Error(error.message)
      }

      return data as UserContext
    } catch (error) {
      console.error('Error getting user context:', error)
      throw error
    }
  }

  /**
   * Check if username is available
   */
  static async checkUsernameAvailability(username: string): Promise<boolean> {
    try {
      console.log('🔍 AuthService.checkUsernameAvailability called with:', username)
      
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single()

      console.log('📊 Supabase response - data:', data, 'error:', error)

      if (error && error.code === 'PGRST116') {
        // No rows returned, username is available
        console.log('✅ No rows found (PGRST116), username is available')
        return true
      }

      if (error) {
        console.error('❌ Supabase error:', error.message)
        throw new Error(error.message)
      }

      // Username exists
      console.log('⚠️ Username exists in database, not available')
      return false
    } catch (error) {
      console.error('💥 Error in checkUsernameAvailability:', error)
      throw error
    }
  }

  /**
   * Complete user onboarding
   */
  static async completeOnboarding(onboardingData: OnboardingData): Promise<Profile> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      // Check username availability
      const isUsernameAvailable = await this.checkUsernameAvailability(onboardingData.username)
      if (!isUsernameAvailable) {
        throw new Error('Username is already taken')
      }

      // Generate a random dicebear avatar for the user
      const snacc_pic_url = this.generateAvatarUrl(user.id)

      // Create profile
      const profileData: Database['public']['Tables']['profiles']['Insert'] = {
        id: user.id,
        username: onboardingData.username,
        display_name: onboardingData.display_name || null,
        snacc_liner: onboardingData.snacc_liner || null,
        snacc_pic_url,
        language: onboardingData.language || ['en'],
        interests: onboardingData.interests || [],
        age_range: onboardingData.age_range || null,
        gender: onboardingData.gender || null,
        location: onboardingData.location || null,
        hearts_received: 0,
        snaccs_count: 0,
        followers_count: 0,
        following_count: 0,
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single()

      if (profileError) {
        throw new Error(profileError.message)
      }

      return profile
    } catch (error) {
      console.error('Error completing onboarding:', error)
      throw error
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(profileUpdate: Partial<OnboardingData> & { id: string }): Promise<Profile> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      if (user.id !== profileUpdate.id) {
        throw new Error('Unauthorized: Cannot update another user\'s profile')
      }

      // Check username availability if username is being updated
      if (profileUpdate.username) {
        const isUsernameAvailable = await this.checkUsernameAvailability(profileUpdate.username)
        if (!isUsernameAvailable) {
          throw new Error('Username is already taken')
        }
      }


      // Prepare update data
      const updateData: Database['public']['Tables']['profiles']['Update'] = {
        updated_at: new Date().toISOString(),
      }

      if (profileUpdate.username) updateData.username = profileUpdate.username
      if (profileUpdate.display_name !== undefined) updateData.display_name = profileUpdate.display_name
      if (profileUpdate.snacc_liner !== undefined) updateData.snacc_liner = profileUpdate.snacc_liner
      if (profileUpdate.language) updateData.language = profileUpdate.language
      if (profileUpdate.interests) updateData.interests = profileUpdate.interests
      if (profileUpdate.age_range !== undefined) updateData.age_range = profileUpdate.age_range
      if (profileUpdate.gender !== undefined) updateData.gender = profileUpdate.gender
      if (profileUpdate.location !== undefined) updateData.location = profileUpdate.location

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profileUpdate.id)
        .select()
        .single()

      if (profileError) {
        throw new Error(profileError.message)
      }

      return profile
    } catch (error) {
      console.error('Error updating profile:', error)
      throw error
    }
  }

  /**
   * Upload or update profile picture
   */
  static async uploadProfilePicture(file: File): Promise<string> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      const fileExt = file.name?.split('.').pop()
      const fileName = `${user.id}/profile.${fileExt}`

      const { error } = await supabase.storage
        .from('profile-pics')
        .upload(fileName, file, {
          upsert: true,
        })

      if (error) {
        throw new Error(`Failed to upload profile picture: ${error.message}`)
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('profile-pics').getPublicUrl(fileName)

      // Update profile with new picture URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          snacc_pic_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) {
        throw new Error(`Failed to update profile: ${updateError.message}`)
      }

      return publicUrl
    } catch (error) {
      console.error('Error uploading profile picture:', error)
      throw error
    }
  }
}