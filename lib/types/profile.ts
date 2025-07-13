/**
 * Profile domain types
 * Handles user profiles, profile data, and profile-specific operations
 */

import type { ProfileDatabase } from './database/profiles'

// Core profile types
export type Profile = ProfileDatabase['public']['Tables']['profiles']['Row']
export type ProfileInsert = ProfileDatabase['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = ProfileDatabase['public']['Tables']['profiles']['Update']

// Snacc Board types
export type SnaccBoard = ProfileDatabase['public']['Tables']['snacc_board']['Row']

// Profile update payload for API calls
export interface ProfileUpdatePayload {
  display_name?: string | null
  snacc_liner?: string | null
  snacc_pic_url?: string | null
  language?: string[]
  interests?: string[]
  age_range?: string | null
  gender?: string | null
  location?: string | null
}

// Profile stats display
export interface ProfileStats {
  followers_count: number
  following_count: number
  hearts_received: number
  snaccs_count: number
}

// Profile with computed/additional fields
export interface ProfileWithStats extends Profile {
  is_following?: boolean
  is_followed_by?: boolean
  is_blocked?: boolean
  can_message?: boolean
}