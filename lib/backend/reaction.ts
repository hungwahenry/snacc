import { supabase } from '../supabase'
import type { Reaction, ReactionGroup } from '../types/social'

export class ReactionService {
  /**
   * Add or update a reaction to a snacc
   * If user already reacted with a different emoji, it replaces the old one
   * If user reacts with the same emoji, it removes the reaction (toggle)
   */
  static async toggleReaction(snaccId: string, emoji: string): Promise<{ action: 'added' | 'removed' | 'updated' }> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      // Check if user already has a reaction on this snacc
      const { data: existingReaction, error: existingError } = await supabase
        .from('reactions')
        .select('*')
        .eq('snacc_id', snaccId)
        .eq('user_id', user.id)
        .single()

      if (existingError && existingError.code !== 'PGRST116') {
        throw new Error(existingError.message)
      }

      if (existingReaction) {
        if (existingReaction.emoji === emoji) {
          // Same emoji - remove the reaction (toggle off)
          const { error: deleteError } = await supabase
            .from('reactions')
            .delete()
            .eq('id', existingReaction.id)

          if (deleteError) {
            throw new Error(deleteError.message)
          }

          return { action: 'removed' }
        } else {
          // Different emoji - update the existing reaction
          const { error: updateError } = await supabase
            .from('reactions')
            .update({ emoji, created_at: new Date().toISOString() })
            .eq('id', existingReaction.id)

          if (updateError) {
            throw new Error(updateError.message)
          }

          return { action: 'updated' }
        }
      } else {
        // No existing reaction - create a new one
        const { error: insertError } = await supabase
          .from('reactions')
          .insert({
            snacc_id: snaccId,
            user_id: user.id,
            emoji,
          })

        if (insertError) {
          throw new Error(insertError.message)
        }

        return { action: 'added' }
      }
    } catch (error) {
      console.error('Error toggling reaction:', error)
      throw error
    }
  }

  /**
   * Get all reactions for a snacc, grouped by emoji
   */
  static async getSnaccReactions(snaccId: string): Promise<ReactionGroup[]> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      // Get all reactions for this snacc with profile data
      const { data: reactionData, error: reactionError } = await supabase
        .from('reactions')
        .select('emoji, user_id, created_at')
        .eq('snacc_id', snaccId)
        .order('created_at', { ascending: true })

      if (reactionError) {
        throw new Error(reactionError.message)
      }

      if (!reactionData || reactionData.length === 0) {
        return []
      }

      // Get profiles for all users who reacted
      const userIds = [...new Set(reactionData.map(r => r.user_id))]
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, display_name, snacc_pic_url')
        .in('id', userIds)

      if (profileError) {
        throw new Error(profileError.message)
      }

      // Create a map of profiles by user ID
      const profileMap = new Map((profileData || []).map(p => [p.id, p]))

      // Group reactions by emoji
      const reactionMap = new Map<string, ReactionGroup>()

      reactionData.forEach(reaction => {
        const profile = profileMap.get(reaction.user_id)
        if (!profile) return

        if (!reactionMap.has(reaction.emoji)) {
          reactionMap.set(reaction.emoji, {
            emoji: reaction.emoji,
            count: 0,
            users: [],
            user_reacted: false,
          })
        }

        const group = reactionMap.get(reaction.emoji)!
        group.count++
        group.users.push(profile)
        
        if (reaction.user_id === user.id) {
          group.user_reacted = true
        }
      })

      // Convert map to array and sort by count (descending)
      return Array.from(reactionMap.values()).sort((a, b) => b.count - a.count)
    } catch (error) {
      console.error('Error getting snacc reactions:', error)
      throw error
    }
  }

  /**
   * Get current user's reaction for a specific snacc
   */
  static async getUserReaction(snaccId: string): Promise<Reaction | null> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await supabase
        .from('reactions')
        .select('*')
        .eq('snacc_id', snaccId)
        .eq('user_id', user.id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // No reaction found
        }
        throw new Error(error.message)
      }

      return data
    } catch (error) {
      console.error('Error getting user reaction:', error)
      throw error
    }
  }

  /**
   * Remove a user's reaction from a snacc
   */
  static async removeReaction(snaccId: string): Promise<void> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      const { error } = await supabase
        .from('reactions')
        .delete()
        .eq('snacc_id', snaccId)
        .eq('user_id', user.id)

      if (error) {
        throw new Error(error.message)
      }
    } catch (error) {
      console.error('Error removing reaction:', error)
      throw error
    }
  }

  /**
   * Get reaction summary for multiple snaccs (for feed display)
   */
  static async getSnaccsReactionSummary(snaccIds: string[]): Promise<Map<string, ReactionGroup[]>> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      if (snaccIds.length === 0) {
        return new Map()
      }

      // Get all reactions for these snaccs
      const { data: reactionData, error: reactionError } = await supabase
        .from('reactions')
        .select('snacc_id, emoji, user_id')
        .in('snacc_id', snaccIds)

      if (reactionError) {
        throw new Error(reactionError.message)
      }

      if (!reactionData || reactionData.length === 0) {
        return new Map()
      }

      // Group by snacc_id and then by emoji
      const snaccReactionsMap = new Map<string, Map<string, ReactionGroup>>()

      reactionData.forEach(reaction => {
        if (!snaccReactionsMap.has(reaction.snacc_id)) {
          snaccReactionsMap.set(reaction.snacc_id, new Map())
        }

        const snaccReactions = snaccReactionsMap.get(reaction.snacc_id)!
        
        if (!snaccReactions.has(reaction.emoji)) {
          snaccReactions.set(reaction.emoji, {
            emoji: reaction.emoji,
            count: 0,
            users: [], // We'll skip loading users for performance in feed view
            user_reacted: false,
          })
        }

        const group = snaccReactions.get(reaction.emoji)!
        group.count++
        
        if (reaction.user_id === user.id) {
          group.user_reacted = true
        }
      })

      // Convert to final format
      const result = new Map<string, ReactionGroup[]>()
      snaccReactionsMap.forEach((reactionMap, snaccId) => {
        const reactions = Array.from(reactionMap.values()).sort((a, b) => b.count - a.count)
        result.set(snaccId, reactions)
      })

      return result
    } catch (error) {
      console.error('Error getting snaccs reaction summary:', error)
      throw error
    }
  }
}