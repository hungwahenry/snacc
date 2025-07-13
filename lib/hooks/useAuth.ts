import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'
import { AuthService } from '../backend/auth'
import type { AuthState, UserContext } from '../types/auth'

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    isAuthenticated: false,
  })

  const [userContext, setUserContext] = useState<UserContext | null>(null)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          setAuthState({
            user: session.user,
            session,
            loading: false,
            isAuthenticated: true,
          })
          
          // Load user context
          try {
            const context = await AuthService.getCurrentUserContext()
            setUserContext(context)
          } catch (error) {
            console.error('Error loading user context:', error)
          }
        } else {
          setAuthState({
            user: null,
            session: null,
            loading: false,
            isAuthenticated: false,
          })
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
        setAuthState({
          user: null,
          session: null,
          loading: false,
          isAuthenticated: false,
        })
      }
    }

    getInitialSession()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id)
        
        if (event === 'SIGNED_IN' && session?.user) {
          setAuthState({
            user: session.user,
            session,
            loading: false,
            isAuthenticated: true,
          })
          
          // Load user context
          try {
            const context = await AuthService.getCurrentUserContext()
            setUserContext(context)
          } catch (error) {
            console.error('Error loading user context:', error)
          }
        } else if (event === 'SIGNED_OUT') {
          setAuthState({
            user: null,
            session: null,
            loading: false,
            isAuthenticated: false,
          })
          setUserContext(null)
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          setAuthState(prev => ({
            ...prev,
            user: session.user,
            session,
          }))
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Helper functions
  const sendOTP = async (email: string) => {
    try {
      const result = await AuthService.sendOTP(email)
      return result
    } catch (error) {
      throw error
    }
  }

  const verifyOTP = async (email: string, token: string) => {
    try {
      const result = await AuthService.verifyOTP(email, token)
      return result
    } catch (error) {
      throw error
    }
  }

  const signOut = async () => {
    try {
      await AuthService.signOut()
      return { success: true }
    } catch (error) {
      throw error
    }
  }

  const refreshUserContext = async () => {
    try {
      if (!authState.isAuthenticated) {
        throw new Error('User not authenticated')
      }
      
      const context = await AuthService.getCurrentUserContext()
      setUserContext(context)
      return context
    } catch (error) {
      console.error('Error refreshing user context:', error)
      throw error
    }
  }

  const checkUsernameAvailability = useCallback(async (username: string) => {
    try {
      console.log('🎯 useAuth.checkUsernameAvailability called with:', username)
      const result = await AuthService.checkUsernameAvailability(username)
      console.log('📤 useAuth returning result:', result)
      return result
    } catch (error) {
      console.error('🚨 useAuth.checkUsernameAvailability error:', error)
      throw error
    }
  }, [])

  return {
    // State
    ...authState,
    userContext,
    
    // Actions
    sendOTP,
    verifyOTP,
    signOut,
    refreshUserContext,
    checkUsernameAvailability,
  }
}