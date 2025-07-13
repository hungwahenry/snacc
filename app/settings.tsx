/**
 * Settings Screen
 * 
 * User settings and preferences
 */

import React from 'react'
import { View, ScrollView, Pressable } from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { ThemedView } from '@/components/ThemedView'
import { ThemedText } from '@/components/ThemedText'
import { Button } from '@/components/ui'
import { useAuth } from '@/lib/hooks/useAuth'
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext'
import { Spacing } from '@/constants/Design'
import type { ThemeColors } from '@/constants/Design'
import * as Haptics from 'expo-haptics'

export default function SettingsScreen() {
  const { signOut, user, userContext } = useAuth()
  const { theme } = useTheme()
  const styles = useThemedStyles(createStyles)
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      await signOut()
      router.replace('/')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const handleSettingPress = (action: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    console.log(`${action} pressed`)
    // TODO: Implement setting actions
  }

  const settingSections = [
    {
      title: 'Account',
      items: [
        {
          icon: 'person-outline',
          title: 'Edit Profile',
          subtitle: 'Update your profile information',
          action: 'edit-profile'
        },
        {
          icon: 'key-outline',
          title: 'Change Password',
          subtitle: 'Update your password',
          action: 'change-password'
        },
        {
          icon: 'shield-outline',
          title: 'Privacy',
          subtitle: 'Manage your privacy settings',
          action: 'privacy'
        }
      ]
    },
    {
      title: 'Preferences',
      items: [
        {
          icon: 'notifications-outline',
          title: 'Notifications',
          subtitle: 'Manage notification preferences',
          action: 'notifications'
        },
        {
          icon: 'language-outline',
          title: 'Language',
          subtitle: 'Change app language',
          action: 'language'
        },
        {
          icon: 'moon-outline',
          title: 'Theme',
          subtitle: 'Switch between light and dark mode',
          action: 'theme'
        }
      ]
    },
    {
      title: 'Support',
      items: [
        {
          icon: 'help-circle-outline',
          title: 'Help & Support',
          subtitle: 'Get help or contact support',
          action: 'help'
        },
        {
          icon: 'document-text-outline',
          title: 'Terms of Service',
          subtitle: 'View terms and conditions',
          action: 'terms'
        },
        {
          icon: 'shield-checkmark-outline',
          title: 'Privacy Policy',
          subtitle: 'View privacy policy',
          action: 'privacy-policy'
        }
      ]
    }
  ]

  const renderSettingItem = (item: any) => (
    <Pressable
      key={item.action}
      style={styles.settingItem}
      onPress={() => handleSettingPress(item.action)}
    >
      <View style={styles.settingIcon}>
        <Ionicons name={item.icon as any} size={24} color={theme.textSecondary} />
      </View>
      <View style={styles.settingContent}>
        <ThemedText variant="body" weight="medium">
          {item.title}
        </ThemedText>
        <ThemedText variant="caption" color="secondary">
          {item.subtitle}
        </ThemedText>
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
    </Pressable>
  )

  const renderSection = (section: any) => (
    <View key={section.title} style={styles.section}>
      <ThemedText variant="subtitle" weight="semibold" style={styles.sectionTitle}>
        {section.title}
      </ThemedText>
      <View style={styles.sectionContent}>
        {section.items.map(renderSettingItem)}
      </View>
    </View>
  )

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Settings',
          headerShown: true,
          headerBackTitle: 'Back',
          headerTitleStyle: { color: theme.text },
          headerStyle: { backgroundColor: theme.surface },
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Info */}
        <View style={styles.userInfo}>
          <ThemedText variant="heading" weight="bold">
            {userContext?.profile?.display_name || userContext?.profile?.username || 'User'}
          </ThemedText>
          <ThemedText variant="body" color="secondary">
            @{userContext?.profile?.username || 'username'}
          </ThemedText>
          <ThemedText variant="caption" color="secondary">
            {user?.email}
          </ThemedText>
        </View>

        {/* Settings Sections */}
        {settingSections.map(renderSection)}

        {/* Sign Out */}
        <View style={styles.signOutSection}>
          <Button
            title="Sign Out"
            variant="destructive"
            size="lg"
            fullWidth
            onPress={handleSignOut}
          />
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <ThemedText variant="caption" color="secondary" center>
            snacc v1.0.0
          </ThemedText>
          <ThemedText variant="caption" color="secondary" center>
            Made with ❤️ for meaningful connections
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  )
}

function createStyles(theme: ThemeColors) {
  return {
    container: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: Spacing['4xl'],
    },
    userInfo: {
      backgroundColor: theme.surface,
      padding: Spacing.xl,
      alignItems: 'center' as const,
      gap: Spacing.xs,
      marginBottom: Spacing.lg,
    },
    section: {
      marginBottom: Spacing.lg,
    },
    sectionTitle: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.5,
    },
    sectionContent: {
      backgroundColor: theme.surface,
    },
    settingItem: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      padding: Spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    settingIcon: {
      width: 40,
      alignItems: 'center' as const,
      marginRight: Spacing.md,
    },
    settingContent: {
      flex: 1,
      gap: Spacing.xs,
    },
    signOutSection: {
      padding: Spacing.lg,
      marginTop: Spacing.xl,
    },
    appInfo: {
      padding: Spacing.lg,
      alignItems: 'center' as const,
      gap: Spacing.xs,
    },
  }
}