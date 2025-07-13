/**
 * Authentication domain types
 * Handles user sessions, authentication state, and onboarding
 */

import type { User, Session } from '@supabase/supabase-js'

// Authentication user (extends Supabase User)
export interface AuthUser extends User {
  // Only auth-related extensions if needed
}

// Authentication state
export interface AuthState {
  user: AuthUser | null
  session: Session | null
  loading: boolean
  isAuthenticated: boolean
}

// Onboarding data structure
export interface OnboardingData {
  username: string
  display_name?: string
  snacc_liner?: string
  language?: string[]
  interests?: string[]
  age_range?: string
  gender?: string
  location?: string
}

// User context for hydration (bridges auth and profile domains)
export interface UserContext {
  profile: any // Will be typed from profile domain
  snacc_board: any | null // Will be typed from profile domain  
  push_token: string | null
  unread_notifications_count: number
  unread_dm_count: number
  blocked_users: string[]
}