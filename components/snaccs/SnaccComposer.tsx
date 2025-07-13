import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Image,
  Modal,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/lib/hooks/useAuth'
import { Toast } from '@/components/ui/Toast'
import { GIFPicker } from './GIFPicker'
import type { CreateSnaccPayload, SnaccVisibility } from '@/lib/types/social'
import * as Haptics from 'expo-haptics'

interface SnaccComposerProps {
  visible: boolean
  onClose: () => void
  onSubmit: (payload: CreateSnaccPayload) => Promise<void>
  defaultVisibility?: SnaccVisibility
}

export function SnaccComposer({
  visible,
  onClose,
  onSubmit,
  defaultVisibility = 'public'
}: SnaccComposerProps) {
  const { theme } = useTheme()
  const { userContext } = useAuth()
  const [text, setText] = useState('')
  const [gifUrl, setGifUrl] = useState<string | null>(null)
  const [visibility, setVisibility] = useState<SnaccVisibility>(defaultVisibility)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showGifPicker, setShowGifPicker] = useState(false)
  
  const styles = createStyles(theme)
  const maxLength = 280 // Twitter-like character limit

  const handleClose = () => {
    if (text.trim() || gifUrl) {
      Alert.alert(
        'Discard Snacc?',
        'You have unsaved changes. Are you sure you want to close?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Discard', 
            style: 'destructive',
            onPress: () => {
              clearForm()
              onClose()
            }
          }
        ]
      )
    } else {
      onClose()
    }
  }

  const clearForm = () => {
    setText('')
    setGifUrl(null)
    setVisibility(defaultVisibility)
  }

  const canSubmit = () => {
    return (text.trim().length > 0 || gifUrl) && !isSubmitting
  }

  const handleSubmit = async () => {
    if (!canSubmit()) return

    try {
      setIsSubmitting(true)
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

      const payload: CreateSnaccPayload = {
        text: text.trim() || null,
        gif_url: gifUrl,
        visibility,
      }

      await onSubmit(payload)
      
      Toast.show('Snacc posted!', { type: 'success' })
      clearForm()
      onClose()
    } catch (error) {
      console.error('Error posting snacc:', error)
      Toast.show(
        error instanceof Error ? error.message : 'Failed to post snacc',
        { type: 'error' }
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGifSelect = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setShowGifPicker(true)
  }

  const handleGifPicked = (url: string) => {
    setGifUrl(url)
  }

  const removeGif = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setGifUrl(null)
  }

  const toggleVisibility = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setVisibility(prev => prev === 'public' ? 'followers_only' : 'public')
  }

  const remainingChars = maxLength - text.length
  const isOverLimit = remainingChars < 0

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <KeyboardAvoidingView 
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable style={styles.headerButton} onPress={handleClose}>
              <Text style={styles.headerButtonText}>Cancel</Text>
            </Pressable>
            
            <Text style={styles.headerTitle}>New Snacc</Text>
            
            <Pressable 
              style={[
                styles.headerButton,
                styles.postButton,
                !canSubmit() && styles.postButtonDisabled
              ]} 
              onPress={handleSubmit}
              disabled={!canSubmit()}
            >
              <Text style={[
                styles.postButtonText,
                !canSubmit() && styles.postButtonTextDisabled
              ]}>
                {isSubmitting ? 'Posting...' : 'Post'}
              </Text>
            </Pressable>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* User info */}
            <View style={styles.userInfo}>
              <Image
                source={{ 
                  uri: userContext?.profile?.snacc_pic_url || 'https://api.dicebear.com/7.x/thumbs/png?seed=default' 
                }}
                style={styles.avatar}
              />
              <View style={styles.userDetails}>
                <Text style={styles.displayName}>
                  {userContext?.profile?.display_name || userContext?.profile?.username}
                </Text>
                <Text style={styles.username}>
                  @{userContext?.profile?.username}
                </Text>
              </View>
            </View>

            {/* Text input */}
            <TextInput
              style={[styles.textInput, { color: theme.text }]}
              placeholder="What's happening?"
              placeholderTextColor={theme.textSecondary}
              value={text}
              onChangeText={setText}
              multiline
              maxLength={maxLength}
              autoFocus
              scrollEnabled
            />

            {/* GIF preview */}
            {gifUrl && (
              <View style={styles.gifContainer}>
                <Image
                  source={{ uri: gifUrl }}
                  style={styles.gifPreview}
                  resizeMode="contain"
                />
                <Pressable style={styles.removeGifButton} onPress={removeGif}>
                  <Ionicons name="close-circle" size={24} color={theme.background} />
                </Pressable>
              </View>
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            {/* Tools */}
            <View style={styles.tools}>
              <Pressable style={styles.toolButton} onPress={handleGifSelect}>
                <Ionicons name="happy-outline" size={24} color={theme.primary} />
              </Pressable>
              
              <Pressable style={styles.toolButton} onPress={toggleVisibility}>
                <Ionicons 
                  name={visibility === 'public' ? 'globe-outline' : 'people-outline'} 
                  size={24} 
                  color={theme.primary} 
                />
              </Pressable>
            </View>

            {/* Character count and visibility */}
            <View style={styles.footerRight}>
              <View style={styles.visibilityIndicator}>
                <Ionicons 
                  name={visibility === 'public' ? 'globe-outline' : 'people-outline'} 
                  size={16} 
                  color={theme.textSecondary} 
                />
                <Text style={styles.visibilityText}>
                  {visibility === 'public' ? 'Everyone' : 'Followers'}
                </Text>
              </View>
              
              <Text style={[
                styles.charCount,
                isOverLimit && styles.charCountOver
              ]}>
                {remainingChars}
              </Text>
            </View>
          </View>
        </KeyboardAvoidingView>

        {/* GIF Picker Modal */}
        <GIFPicker
          visible={showGifPicker}
          onClose={() => setShowGifPicker(false)}
          onSelectGIF={handleGifPicked}
        />
      </SafeAreaView>
    </Modal>
  )
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  headerButton: {
    minWidth: 60,
  },
  headerButtonText: {
    fontSize: 16,
    color: theme.textSecondary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
  },
  postButton: {
    backgroundColor: theme.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postButtonDisabled: {
    backgroundColor: theme.textSecondary + '30',
  },
  postButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.background,
  },
  postButtonTextDisabled: {
    color: theme.textSecondary,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  username: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  textInput: {
    fontSize: 18,
    lineHeight: 24,
    textAlignVertical: 'top',
    minHeight: 120,
    marginBottom: 16,
  },
  gifContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  gifPreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeGifButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  tools: {
    flexDirection: 'row',
    gap: 16,
  },
  toolButton: {
    padding: 8,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  visibilityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  visibilityText: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  charCount: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.textSecondary,
    minWidth: 30,
    textAlign: 'right',
  },
  charCountOver: {
    color: '#ff4444',
  },
})