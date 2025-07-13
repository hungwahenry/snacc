import React, { useRef, useEffect } from 'react'
import { 
  View, 
  Pressable, 
  StyleSheet, 
  Animated, 
  Easing 
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '@/contexts/ThemeContext'
import * as Haptics from 'expo-haptics'

interface ThoughtBubbleProps {
  hasContent: boolean // Whether user has an active snacc board entry
  onPress: () => void
  size?: 'small' | 'medium' | 'large'
}

export function ThoughtBubble({ hasContent, onPress, size = 'medium' }: ThoughtBubbleProps) {
  const { theme } = useTheme()
  const pulseAnim = useRef(new Animated.Value(1)).current
  const floatAnim = useRef(new Animated.Value(0)).current
  const styles = createStyles(theme, size)

  // Floating animation
  useEffect(() => {
    const floatAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -3,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    )

    floatAnimation.start()

    return () => {
      floatAnimation.stop()
    }
  }, [floatAnim])

  // Pulse animation when content is available
  useEffect(() => {
    if (hasContent) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      )

      pulseAnimation.start()

      return () => {
        pulseAnimation.stop()
      }
    } else {
      // Reset pulse when no content
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start()
    }
  }, [hasContent, pulseAnim])

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPress()
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateY: floatAnim },
            { scale: pulseAnim }
          ]
        }
      ]}
    >
      <Pressable
        style={[
          styles.bubble,
          hasContent && styles.bubbleWithContent
        ]}
        onPress={handlePress}
      >
        {/* Main bubble */}
        <View style={[styles.mainBubble, hasContent && styles.mainBubbleWithContent]}>
          <Ionicons 
            name={hasContent ? "chatbubble" : "chatbubble-outline"} 
            size={getSizeValue(size) * 0.6} 
            color={hasContent ? theme.background : theme.textSecondary} 
          />
        </View>

        {/* Small bubbles for thought effect */}
        <View style={styles.smallBubbles}>
          <View style={[styles.smallBubble, styles.smallBubble1]} />
          <View style={[styles.smallBubble, styles.smallBubble2]} />
        </View>

        {/* Active indicator dot when there's content */}
        {hasContent && (
          <View style={styles.activeDot} />
        )}
      </Pressable>
    </Animated.View>
  )
}

function getSizeValue(size: 'small' | 'medium' | 'large'): number {
  switch (size) {
    case 'small': return 32
    case 'medium': return 40
    case 'large': return 48
    default: return 40
  }
}

const createStyles = (theme: any, size: 'small' | 'medium' | 'large') => {
  const bubbleSize = getSizeValue(size)
  
  return StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    bubble: {
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
    },
    bubbleWithContent: {
      // Add any special styling when content is present
    },
    mainBubble: {
      width: bubbleSize,
      height: bubbleSize,
      borderRadius: bubbleSize / 2,
      backgroundColor: theme.surface,
      borderWidth: 2,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: theme.text,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3,
    },
    mainBubbleWithContent: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 5,
    },
    smallBubbles: {
      position: 'absolute',
      bottom: -8,
      left: bubbleSize * 0.2,
    },
    smallBubble: {
      position: 'absolute',
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: theme.text,
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    smallBubble1: {
      width: 8,
      height: 8,
      borderRadius: 4,
      bottom: 0,
      left: -2,
    },
    smallBubble2: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
      bottom: -6,
      left: -8,
    },
    activeDot: {
      position: 'absolute',
      top: -2,
      right: -2,
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: '#ff4444',
      borderWidth: 2,
      borderColor: theme.background,
    },
  })
}