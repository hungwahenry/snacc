/**
 * Database types for Social domain
 * Includes follows, snaccs, reactions, and social interactions
 */

export interface SocialDatabase {
  public: {
    Tables: {
      follows: {
        Row: {
          id: string
          follower_id: string
          followee_id: string
          created_at: string
        }
        Insert: {
          id?: string
          follower_id: string
          followee_id: string
          created_at?: string
        }
        Update: {
          id?: string
          follower_id?: string
          followee_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_followee_id_fkey"
            columns: ["followee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      snaccs: {
        Row: {
          id: string
          user_id: string
          text: string | null
          gif_url: string | null
          visibility: 'public' | 'followers_only'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          text?: string | null
          gif_url?: string | null
          visibility?: 'public' | 'followers_only'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          text?: string | null
          gif_url?: string | null
          visibility?: 'public' | 'followers_only'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "snaccs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      reactions: {
        Row: {
          id: string
          snacc_id: string
          user_id: string
          emoji: string
          created_at: string
        }
        Insert: {
          id?: string
          snacc_id: string
          user_id: string
          emoji: string
          created_at?: string
        }
        Update: {
          id?: string
          snacc_id?: string
          user_id?: string
          emoji?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reactions_snacc_id_fkey"
            columns: ["snacc_id"]
            isOneToOne: false
            referencedRelation: "snaccs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      snacc_board: {
        Row: {
          id: string
          user_id: string
          text: string
          views_count: number
          edit_count: number
          created_at: string
          expires_at: string
          last_edited_at: string
        }
        Insert: {
          id?: string
          user_id: string
          text: string
          views_count?: number
          edit_count?: number
          created_at?: string
          expires_at?: string
          last_edited_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          text?: string
          views_count?: number
          edit_count?: number
          created_at?: string
          expires_at?: string
          last_edited_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "snacc_board_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      snacc_board_views: {
        Row: {
          id: string
          snacc_board_id: string
          viewer_id: string
          viewed_at: string
        }
        Insert: {
          id?: string
          snacc_board_id: string
          viewer_id: string
          viewed_at?: string
        }
        Update: {
          id?: string
          snacc_board_id?: string
          viewer_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "snacc_board_views_snacc_board_id_fkey"
            columns: ["snacc_board_id"]
            isOneToOne: false
            referencedRelation: "snacc_board"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "snacc_board_views_viewer_id_fkey"
            columns: ["viewer_id"]
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
      reports: {
        Row: {
          id: string
          reporter_id: string
          target_id: string
          context: 'video_call' | 'snacc' | 'profile' | 'message'
          reason: string
          created_at: string
        }
        Insert: {
          id?: string
          reporter_id: string
          target_id: string
          context: 'video_call' | 'snacc' | 'profile' | 'message'
          reason: string
          created_at?: string
        }
        Update: {
          id?: string
          reporter_id?: string
          target_id?: string
          context?: 'video_call' | 'snacc' | 'profile' | 'message'
          reason?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_target_id_fkey"
            columns: ["target_id"]
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
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}