/**
 * Database types for Profile domain
 * Includes profile data and profile-specific features
 */

export interface ProfileDatabase {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          display_name: string | null
          snacc_liner: string | null
          snacc_pic_url: string | null
          language: string[]
          interests: string[]
          age_range: string | null
          gender: string | null
          location: string | null
          hearts_received: number
          snaccs_count: number
          followers_count: number
          following_count: number
          push_token: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          display_name?: string | null
          snacc_liner?: string | null
          snacc_pic_url?: string | null
          language?: string[]
          interests?: string[]
          age_range?: string | null
          gender?: string | null
          location?: string | null
          hearts_received?: number
          snaccs_count?: number
          followers_count?: number
          following_count?: number
          push_token?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          display_name?: string | null
          snacc_liner?: string | null
          snacc_pic_url?: string | null
          language?: string[]
          interests?: string[]
          age_range?: string | null
          gender?: string | null
          location?: string | null
          hearts_received?: number
          snaccs_count?: number
          followers_count?: number
          following_count?: number
          push_token?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      snacc_board: {
        Row: {
          id: string
          user_id: string
          text: string
          created_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          user_id: string
          text: string
          created_at?: string
          expires_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          text?: string
          created_at?: string
          expires_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "snacc_board_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      blocked_users: {
        Row: {
          id: string
          blocker_id: string
          blocked_id: string
          created_at: string
        }
        Insert: {
          id?: string
          blocker_id: string
          blocked_id: string
          created_at?: string
        }
        Update: {
          id?: string
          blocker_id?: string
          blocked_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_users_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocked_users_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_context: {
        Args: Record<PropertyKey, never>
        Returns: {
          profile: ProfileDatabase['public']['Tables']['profiles']['Row']
          snacc_board: ProfileDatabase['public']['Tables']['snacc_board']['Row'] | null
          push_token: string | null
          unread_notifications_count: number
          unread_dm_count: number
          blocked_users: string[]
        }
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}