/**
 * Database types aggregation
 * Combines all domain-specific database types into a unified interface
 */

import type { AuthDatabase } from './auth'
import type { ProfileDatabase } from './profiles'
import type { SocialDatabase } from './social'

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Merge all domain databases into a single Database type
export interface Database {
  public: {
    Tables: AuthDatabase['public']['Tables'] & 
            ProfileDatabase['public']['Tables'] & 
            SocialDatabase['public']['Tables']
    Views: AuthDatabase['public']['Views'] & 
           ProfileDatabase['public']['Views'] & 
           SocialDatabase['public']['Views']
    Functions: AuthDatabase['public']['Functions'] & 
               ProfileDatabase['public']['Functions'] & 
               SocialDatabase['public']['Functions']
    Enums: AuthDatabase['public']['Enums'] & 
           ProfileDatabase['public']['Enums'] & 
           SocialDatabase['public']['Enums']
  }
}

// Re-export domain-specific types for direct access
export type { AuthDatabase } from './auth'
export type { ProfileDatabase } from './profiles'
export type { SocialDatabase } from './social'