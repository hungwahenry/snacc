/**
 * Profile Setup Screen
 * 
 * Second step of onboarding - users set their display name, bio, and profile picture
 */

import React, { useState } from 'react'
import { View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { AuthCard } from '../../components/auth'
import { Button, Input, TextArea, Avatar, Alert } from '../../components/ui'
import { ThemedText } from '../../components/ThemedText'
import { HapticPatterns } from '../../utils/haptics'
import { useThemedStyles } from '../../contexts/ThemeContext'
import { Spacing, BorderRadius } from '../../constants/Design'
import type { ThemeColors } from '../../constants/Design'

export default function ProfileSetupScreen() {
  const { username } = useLocalSearchParams<{ username: string }>()
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [loading] = useState(false)
  const styles = useThemedStyles(createStyles)


  const handleContinue = async () => {
    if (!username) {
      Alert.error('Error', 'Username is missing. Please go back and try again.')
      return
    }

    await HapticPatterns.navigate()
    
    // Pass data to interests screen
    router.push({
      pathname: '/onboarding/interests',
      params: {
        username,
        displayName: displayName.trim(),
        bio: bio.trim(),
        profileImageUri: '',
      }
    })
  }

  const handleSkip = async () => {
    await HapticPatterns.navigate()
    
    // Pass minimal data to interests screen
    router.push({
      pathname: '/onboarding/interests',
      params: {
        username,
        displayName: '',
        bio: '',
        profileImageUri: '',
      }
    })
  }

  return (
    <AuthCard
      title="Set Up Your Profile"
      subtitle="Tell us a bit about yourself! You can always update this information later in your profile settings."
      scrollable
    >

      {/* Form Fields */}
      <View style={styles.formSection}>
        <Input
          label="Display Name (Optional)"
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="How should people see your name?"
          maxLength={50}
          hint="This can be different from your username"
        />

        <TextArea
          label="Snacc Liner (Optional)"
          value={bio}
          onChangeText={setBio}
          placeholder="A short bio or fun fact about yourself..."
          rows={3}
          maxLength={150}
          hint={`${bio.length}/150 characters`}
        />
      </View>

      {/* Preview Section */}
      <View style={styles.previewSection}>
        <ThemedText variant="caption" color="secondary" weight="medium">
          Profile Preview:
        </ThemedText>
        
        <View style={styles.preview}>
          <Avatar
            source={null}
            size="md"
            initials={username?.charAt(0) || '?'}
          />
          
          <View style={styles.previewInfo}>
            <ThemedText variant="body" weight="semibold">
              {displayName || username}
            </ThemedText>
            <ThemedText variant="caption" color="secondary">
              @{username}
            </ThemedText>
            {bio && (
              <ThemedText variant="caption" color="tertiary" style={styles.previewBio}>
                {bio}
              </ThemedText>
            )}
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <Button
          title="Continue"
          size="lg"
          fullWidth
          onPress={handleContinue}
          loading={loading}
        />
        
        <Button
          title="Skip for Now"
          variant="ghost"
          size="md"
          fullWidth
          onPress={handleSkip}
        />
      </View>
    </AuthCard>
  )
}

function createStyles(theme: ThemeColors) {
  return {
    formSection: {
      gap: Spacing.lg,
      marginBottom: Spacing.xl,
    },

    previewSection: {
      gap: Spacing.sm,
      marginBottom: Spacing.xl,
    },

    preview: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      gap: Spacing.md,
      padding: Spacing.md,
      backgroundColor: theme.surfaceSecondary,
      borderRadius: BorderRadius.lg,
    },

    previewInfo: {
      flex: 1,
      gap: Spacing.xs,
    },

    previewBio: {
      marginTop: Spacing.xs,
      lineHeight: 18,
    },

    actions: {
      gap: Spacing.md,
    },
  }
}