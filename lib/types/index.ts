/**
 * Main types barrel export
 * Provides organized access to all domain types
 */

// Database types
export type { Database } from './database'
export type { AuthDatabase, ProfileDatabase, SocialDatabase } from './database'

// Domain-specific types
export * from './auth'
export * from './profile'
export * from './social'

// Common utility types
export interface ApiResponse<T = any> {
  data?: T
  error?: string
  success: boolean
}

export interface PaginatedResponse<T = any> {
  data: T[]
  count: number
  page: number
  totalPages: number
  hasMore: boolean
}

export interface LoadingState {
  isLoading: boolean
  error?: string | null
}