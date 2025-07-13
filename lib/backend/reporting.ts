/**
 * Reporting Service
 * 
 * Handles user reporting functionality
 * Implements the reporting system as detailed in blocking-reporting.md
 */

import { supabase } from '../supabase'
import type { CreateReportPayload, Report, ReportContext } from '../types/social'

export class ReportingService {
  /**
   * Submit a report against another user
   */
  static async submitReport(payload: CreateReportPayload): Promise<Report> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      if (user.id === payload.target_id) {
        throw new Error('Cannot report yourself')
      }

      // Validate reason
      if (!payload.reason.trim()) {
        throw new Error('Report reason is required')
      }

      if (payload.reason.length > 500) {
        throw new Error('Report reason cannot exceed 500 characters')
      }

      // Validate context
      const validContexts: ReportContext[] = ['video_call', 'snacc', 'profile', 'message']
      if (!validContexts.includes(payload.context)) {
        throw new Error('Invalid report context')
      }

      const { data, error } = await supabase
        .from('reports')
        .insert({
          reporter_id: user.id,
          target_id: payload.target_id,
          context: payload.context,
          reason: payload.reason.trim(),
        })
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data
    } catch (error) {
      console.error('Error submitting report:', error)
      throw error
    }
  }

  /**
   * Get user's submitted reports (for their own reference)
   */
  static async getUserReports(): Promise<Report[]> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          target_profile:profiles!reports_target_id_fkey(username, display_name, snacc_pic_url)
        `)
        .eq('reporter_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(error.message)
      }

      return data || []
    } catch (error) {
      console.error('Error getting user reports:', error)
      throw error
    }
  }

  /**
   * Get predefined report reasons for different contexts
   */
  static getReportReasons(context: ReportContext): string[] {
    switch (context) {
      case 'profile':
        return [
          'Inappropriate profile picture',
          'Offensive username or bio',
          'Impersonation',
          'Spam or fake account',
          'Underage user',
          'Other'
        ]
      case 'snacc':
        return [
          'Harassment or bullying',
          'Hate speech',
          'Spam',
          'Inappropriate content',
          'Violence or threats',
          'Self-harm content',
          'Other'
        ]
      case 'video_call':
        return [
          'Inappropriate behavior',
          'Nudity or sexual content',
          'Harassment',
          'Hate speech',
          'Violence or threats',
          'Spam or scam',
          'Other'
        ]
      case 'message':
        return [
          'Harassment',
          'Spam',
          'Threats or violence',
          'Inappropriate content',
          'Scam or fraud',
          'Other'
        ]
      default:
        return ['Other']
    }
  }

  /**
   * Get user-friendly context names
   */
  static getContextDisplayName(context: ReportContext): string {
    switch (context) {
      case 'profile':
        return 'Profile'
      case 'snacc':
        return 'Snacc'
      case 'video_call':
        return 'Video Call'
      case 'message':
        return 'Message'
      default:
        return 'Unknown'
    }
  }
}