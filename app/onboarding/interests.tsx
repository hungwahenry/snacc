/**
 * Interests and Preferences Setup Screen
 * 
 * Final step of onboarding - users select their interests and complete profile creation
 */

import React, { useState } from 'react'
import { View, TouchableOpacity } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { AuthCard } from '../../components/auth'
import { Button, LoadingSpinner, Alert, Toast } from '../../components/ui'
import { ThemedText } from '../../components/ThemedText'
import { AuthService } from '../../lib/backend'
import { HapticPatterns } from '../../utils/haptics'
import { useThemedStyles } from '../../contexts/ThemeContext'
import { Spacing, BorderRadius } from '../../constants/Design'
import type { ThemeColors } from '../../constants/Design'

// Available interests
const INTERESTS = [
  '🎵 Music', '🎬 Movies', '📚 Books', '🏃‍♂️ Fitness', '🍳 Cooking',
  '✈️ Travel', '🎮 Gaming', '📸 Photography', '🎨 Art', '💻 Technology',
  '🧘‍♀️ Wellness', '🏀 Sports', '🌱 Nature', '💃 Dancing', '🎭 Theater',
  '☕ Coffee', '🐕 Pets', '🎸 Instruments', '📝 Writing', '🧩 Puzzles',
  '🏔️ Hiking', '🏖️ Beach', '🎪 Events', '🍕 Food', '🛍️ Shopping'
]

// Age ranges
const AGE_RANGES = [
  '18-25', '26-35', '36-45', '46-55', '56+'
]

// Languages
const LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
  'Chinese', 'Japanese', 'Korean', 'Arabic', 'Hindi', 'Russian'
]

export default function InterestsSetupScreen() {
  const params = useLocalSearchParams<{
    username: string
    displayName: string
    bio: string
  }>()
  
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['English'])
  const [selectedAgeRange, setSelectedAgeRange] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const styles = useThemedStyles(createStyles)

  const toggleInterest = async (interest: string) => {
    await HapticPatterns.settingToggle()
    
    setSelectedInterests(prev => 
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    )
  }

  const toggleLanguage = async (language: string) => {
    await HapticPatterns.settingToggle()
    
    setSelectedLanguages(prev => 
      prev.includes(language)
        ? prev.filter(l => l !== language)
        : [...prev, language]
    )
  }

  const selectAgeRange = async (ageRange: string) => {
    await HapticPatterns.settingToggle()
    setSelectedAgeRange(ageRange)
  }

  const handleCompleteOnboarding = async () => {
    if (!params.username) {
      Alert.error('Error', 'Username is missing. Please go back and try again.')
      return
    }

    setLoading(true)

    try {

      // Clean interests (remove emojis)
      const cleanInterests = selectedInterests.map(interest => 
        interest.replace(/^[^\w\s]+\s/, '').trim()
      )

      const onboardingData = {
        username: params.username,
        display_name: params.displayName || undefined,
        snacc_liner: params.bio || undefined,
        language: selectedLanguages.length > 0 ? selectedLanguages : ['English'],
        interests: cleanInterests,
        age_range: selectedAgeRange || undefined,
        gender: 'prefer-not-to-say', // Default for now
        location: undefined, // Could add location picker later
      }

      await AuthService.completeOnboarding(onboardingData)
      await HapticPatterns.formSuccess()

      Toast.success('Profile created successfully! Welcome to snacc! 🎉')
      
      // Onboarding complete - go to main app
      router.replace('/(tabs)')
      
    } catch (error) {
      await HapticPatterns.loginError()
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to create profile'
      Alert.error('Setup Failed', errorMessage, [
        { text: 'OK', onPress: () => HapticPatterns.buttonPress() }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = async () => {
    if (!params.username) {
      Alert.error('Error', 'Username is missing. Please go back and try again.')
      return
    }

    setLoading(true)

    try {
      // Create minimal profile
      const onboardingData = {
        username: params.username,
        display_name: params.displayName || undefined,
        snacc_liner: params.bio || undefined,
        language: ['English'],
        interests: [],
        gender: 'prefer_not_to_say',
      }

      await AuthService.completeOnboarding(onboardingData)
      await HapticPatterns.formSuccess()

      Toast.success('Profile created successfully! Welcome to snacc! 🎉')

      router.replace('/(tabs)')
      
    } catch (error) {
      await HapticPatterns.loginError()
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to create profile'
      Alert.error('Setup Failed', errorMessage, [
        { text: 'OK', onPress: () => HapticPatterns.buttonPress() }
      ])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <AuthCard
        title="Creating Your Profile..."
        subtitle="Setting up your snacc account with all your preferences"
      >
        <LoadingSpinner 
          text="Almost done!"
          size="large"
        />
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title="Customize Your Experience"
      subtitle="Help us personalize your snacc experience by sharing your interests and preferences."
      scrollable
    >
      {/* Interests Section */}
      <View style={styles.section}>
        <ThemedText variant="body" weight="semibold" style={styles.sectionTitle}>
          What are you interested in? ({selectedInterests.length} selected)
        </ThemedText>
        
        <View style={styles.chipGrid}>
          {INTERESTS.map((interest) => (
            <TouchableOpacity
              key={interest}
              style={[
                styles.chip,
                selectedInterests.includes(interest) && styles.chipSelected,
              ]}
              onPress={() => toggleInterest(interest)}
            >
              <ThemedText
                variant="caption"
                color={selectedInterests.includes(interest) ? 'inverse' : 'primary'}
                weight="medium"
              >
                {interest}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Languages Section */}
      <View style={styles.section}>
        <ThemedText variant="body" weight="semibold" style={styles.sectionTitle}>
          What languages do you speak? ({selectedLanguages.length} selected)
        </ThemedText>
        
        <View style={styles.chipGrid}>
          {LANGUAGES.map((language) => (
            <TouchableOpacity
              key={language}
              style={[
                styles.chip,
                selectedLanguages.includes(language) && styles.chipSelected,
              ]}
              onPress={() => toggleLanguage(language)}
            >
              <ThemedText
                variant="caption"
                color={selectedLanguages.includes(language) ? 'inverse' : 'primary'}
                weight="medium"
              >
                {language}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Age Range Section */}
      <View style={styles.section}>
        <ThemedText variant="body" weight="semibold" style={styles.sectionTitle}>
          What's your age range? (Optional)
        </ThemedText>
        
        <View style={styles.chipGrid}>
          {AGE_RANGES.map((ageRange) => (
            <TouchableOpacity
              key={ageRange}
              style={[
                styles.chip,
                selectedAgeRange === ageRange && styles.chipSelected,
              ]}
              onPress={() => selectAgeRange(ageRange)}
            >
              <ThemedText
                variant="caption"
                color={selectedAgeRange === ageRange ? 'inverse' : 'primary'}
                weight="medium"
              >
                {ageRange}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <Button
          title="Complete Setup"
          size="lg"
          fullWidth
          onPress={handleCompleteOnboarding}
          loading={loading}
        />
        
        <Button
          title="Skip for Now"
          variant="ghost"
          size="md"
          fullWidth
          onPress={handleSkip}
          disabled={loading}
        />
      </View>
    </AuthCard>
  )
}

function createStyles(theme: ThemeColors) {
  return {
    section: {
      marginBottom: Spacing['2xl'],
    },

    sectionTitle: {
      marginBottom: Spacing.md,
    },

    chipGrid: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: Spacing.sm,
    },

    chip: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
    },

    chipSelected: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },

    actions: {
      gap: Spacing.md,
      marginTop: Spacing.lg,
    },
  }
}