/**
 * Social domain types
 * Handles follows, snaccs, reactions, and social interactions
 */

import type { SocialDatabase } from './database/social'
import type { Profile } from './profile'

// Core social types
export type Follow = SocialDatabase['public']['Tables']['follows']['Row']
export type Snacc = SocialDatabase['public']['Tables']['snaccs']['Row']
export type Reaction = SocialDatabase['public']['Tables']['reactions']['Row']
export type SnaccBoard = SocialDatabase['public']['Tables']['snacc_board']['Row']

// Follow relationship states
export type FollowRelationship = 
  | 'none'         // No relationship
  | 'following'    // Current user follows target user
  | 'follower'     // Target user follows current user  
  | 'mutual'       // Both users follow each other
  | 'blocked'      // Current user blocked target user
  | 'blocked_by'   // Target user blocked current user

// Follow state with permissions
export interface FollowState {
  relationship: FollowRelationship
  canFollow: boolean
  canUnfollow: boolean
  canRemoveFollower: boolean
  canMessage: boolean
  canViewPrivateContent: boolean
  isLoading?: boolean
}

// Follow actions
export type FollowAction = 'follow' | 'unfollow' | 'remove_follower' | 'block' | 'unblock'

// Snacc visibility options
export type SnaccVisibility = 'public' | 'followers_only'

// Snacc with profile and reaction data
export interface SnaccWithProfile extends Snacc {
  profile: Profile
  reaction_count?: number
  user_reaction?: string | null
}

// Minimal profile for reactions
export interface ReactionProfile {
  id: string
  username: string
  display_name: string | null
  snacc_pic_url: string | null
}

// Reaction aggregation for display
export interface ReactionGroup {
  emoji: string
  count: number
  users: ReactionProfile[]
  user_reacted: boolean
}

// Snacc creation payload
export interface CreateSnaccPayload {
  text?: string | null
  gif_url?: string | null
  visibility: SnaccVisibility
}

// Feed item (could be snacc or other content types in future)
export interface FeedItem {
  id: string
  type: 'snacc'
  data: SnaccWithProfile
  created_at: string
}

// Snacc Board types
export interface SnaccBoardWithProfile extends SnaccBoard {
  profile: Profile
}

// Snacc Board creation payload
export interface CreateSnaccBoardPayload {
  text: string
}

// Snacc Board with calculated expiry info
export interface SnaccBoardEntry extends SnaccBoard {
  timeRemaining: number // milliseconds until expiry
  isExpired: boolean
  isOwnEntry: boolean
}

// Snacc Board View types
export type SnaccBoardView = {
  id: string
  snacc_board_id: string
  viewer_id: string
  viewed_at: string
}

// Snacc Board View with profile info
export interface SnaccBoardViewWithProfile extends SnaccBoardView {
  profile: Profile
}

// Blocking types
export type BlockedUser = SocialDatabase['public']['Tables']['blocked_users']['Row']
export type Report = SocialDatabase['public']['Tables']['reports']['Row']

// Report context types
export type ReportContext = 'video_call' | 'snacc' | 'profile' | 'message'

// Report creation payload
export interface CreateReportPayload {
  target_id: string
  context: ReportContext
  reason: string
}

// DM eligibility response
export interface DMEligibility {
  canDM: boolean
  reason: 'mutual_follow' | 'not_following' | 'blocked' | 'one_way_follow'
}