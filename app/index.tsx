/**
 * App Entry Point
 * 
 * Initial screen that redirects to splash screen once mounted
 */

import { useEffect, useState } from 'react'
import { router } from 'expo-router'
import { View } from 'react-native'

export default function IndexScreen() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    // Mark as mounted
    setIsMounted(true)
  }, [])

  useEffect(() => {
    // Only navigate after component is mounted
    if (isMounted) {
      const timer = setTimeout(() => {
        router.replace('/splash')
      }, 100) // Small delay to ensure navigation is ready

      return () => clearTimeout(timer)
    }
  }, [isMounted])

  // Return a minimal view while redirecting
  return <View style={{ flex: 1, backgroundColor: '#fafaf9' }} />
}