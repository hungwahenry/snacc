// Export all backend services
export { AuthService } from './auth'
export { ProfileService } from './profile'
export { FollowService } from './follow'
export { SnaccService } from './snacc'
export { ReactionService } from './reaction'
export { SnaccBoardService } from './snaccBoard'
export { BlockingService } from './blocking'
export { ReportingService } from './reporting'
export { DMService } from './dm'

// Re-export types for convenience
export type {
  AuthUser,
  AuthState,
  UserContext,
  OnboardingData,
} from '../types/auth'

export type {
  Profile,
  ProfileInsert,
  ProfileUpdate,
  ProfileUpdatePayload,
  SnaccBoard,
  ProfileStats,
  ProfileWithStats,
} from '../types/profile'

export type {
  Follow,
  Snacc,
  Reaction,
  FollowRelationship,
  FollowState,
  FollowAction,
  SnaccVisibility,
  SnaccWithProfile,
  ReactionGroup,
  CreateSnaccPayload,
  FeedItem,
  BlockedUser,
  Report,
  ReportContext,
  CreateReportPayload,
  DMEligibility,
} from '../types/social'

export type { Database } from '../types/database'