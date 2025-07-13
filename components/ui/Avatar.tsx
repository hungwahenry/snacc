/**
 * Avatar Component for Snacc App
 * 
 * Profile picture component with fallback states and consistent sizing
 */

import React from 'react'
import {
  View,
  Image,
  Text,
  type ViewProps,
} from 'react-native'
import { useThemedStyles } from '../../contexts/ThemeContext'
import { BorderRadius, Typography, Sizes } from '../../constants/Design'
import type { ThemeColors } from '../../constants/Design'

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'

export interface AvatarProps extends ViewProps {
  // Image source
  source?: { uri: string } | null
  
  // Fallback
  initials?: string
  fallbackText?: string
  
  // Appearance
  size?: AvatarSize
  
  // Styling
  style?: ViewProps['style']
  imageStyle?: object
  textStyle?: object
}

export function Avatar({
  source,
  initials,
  fallbackText,
  size = 'md',
  style,
  imageStyle,
  textStyle,
  ...props
}: AvatarProps) {
  const styles = useThemedStyles(createStyles)
  
  const hasValidSource = source && source.uri
  const displayText = initials || fallbackText || '?'
  
  return (
    <View
      style={[
        styles.container,
        styles[size],
        style,
      ]}
      {...props}
    >
      {hasValidSource ? (
        <Image
          source={source}
          style={[
            styles.image,
            styles[size],
            imageStyle,
          ]}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.fallback, styles[size]]}>
          <Text style={[
            styles.fallbackText,
            styles[`${size}Text`],
            textStyle,
          ]}>
            {displayText.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
    </View>
  )
}

function createStyles(theme: ThemeColors) {
  return {
    container: {
      borderRadius: BorderRadius.full,
      overflow: 'hidden' as const,
      backgroundColor: theme.surfaceSecondary,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    
    image: {
      borderRadius: BorderRadius.full,
    },
    
    fallback: {
      backgroundColor: theme.primary,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      borderRadius: BorderRadius.full,
    },
    
    fallbackText: {
      color: theme.textInverse,
      fontWeight: Typography.fontWeight.semibold,
      textAlign: 'center' as const,
    },
    
    // Sizes
    xs: {
      width: Sizes.avatar.xs,
      height: Sizes.avatar.xs,
    },
    
    sm: {
      width: Sizes.avatar.sm,
      height: Sizes.avatar.sm,
    },
    
    md: {
      width: Sizes.avatar.md,
      height: Sizes.avatar.md,
    },
    
    lg: {
      width: Sizes.avatar.lg,
      height: Sizes.avatar.lg,
    },
    
    xl: {
      width: Sizes.avatar.xl,
      height: Sizes.avatar.xl,
    },
    
    '2xl': {
      width: Sizes.avatar['2xl'],
      height: Sizes.avatar['2xl'],
    },
    
    '3xl': {
      width: Sizes.avatar['3xl'],
      height: Sizes.avatar['3xl'],
    },
    
    // Text sizes for fallbacks
    xsText: {
      fontSize: Typography.fontSize.xs,
    },
    
    smText: {
      fontSize: Typography.fontSize.sm,
    },
    
    mdText: {
      fontSize: Typography.fontSize.base,
    },
    
    lgText: {
      fontSize: Typography.fontSize.lg,
    },
    
    xlText: {
      fontSize: Typography.fontSize.xl,
    },
    
    '2xlText': {
      fontSize: Typography.fontSize['2xl'],
    },
    
    '3xlText': {
      fontSize: Typography.fontSize['3xl'],
    },
  }
}