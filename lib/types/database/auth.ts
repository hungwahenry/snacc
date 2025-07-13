/**
 * Database types for Authentication domain
 * Only includes auth-related tables and minimal user identity
 */

export interface AuthDatabase {
  public: {
    Tables: {
      // Note: The actual users table is managed by Supabase Auth
      // This is just for reference - not directly accessible
      users: {
        Row: {
          id: string
          email: string
          created_at: string
          updated_at: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}