import { useTheme } from '@/contexts/ThemeContext'
import React from 'react'
import { StyleSheet, View } from 'react-native'

interface DottedCircleProps {
  size: number
  dotSize?: number
  gap?: number
  color?: string
  children?: React.ReactNode
}

export function DottedCircle({ 
  size, 
  dotSize = 5, 
  gap = 8, 
  color,
  children 
}: DottedCircleProps) {
  const { theme } = useTheme()
  const dotColor = color || theme.primary
  
  // Calculate number of dots based on circumference
  const circumference = Math.PI * size
  const dotSpacing = dotSize + gap
  const numberOfDots = Math.floor(circumference / dotSpacing)
  
  const dots = []
  
  for (let i = 0; i < numberOfDots; i++) {
    const angle = (360 / numberOfDots) * i
    const radian = (angle * Math.PI) / 180
    const radius = (size - dotSize) / 2
    
    const x = radius * Math.cos(radian) + size / 2 - dotSize / 2
    const y = radius * Math.sin(radian) + size / 2 - dotSize / 2
    
    dots.push(
      <View
        key={i}
        style={[
          styles.dot,
          {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: dotColor,
            position: 'absolute',
            left: x,
            top: y,
          }
        ]}
      />
    )
  }
  
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {dots}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    // Individual dot styling is applied inline above
  },
  content: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
})