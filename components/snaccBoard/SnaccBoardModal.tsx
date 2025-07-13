import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Modal,
  SafeAreaView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '@/contexts/ThemeContext'
import { SnaccBoardService } from '@/lib/backend/snaccBoard'
import { Toast } from '@/components/ui/Toast'
import type { SnaccBoardEntry, CreateSnaccBoardPayload } from '@/lib/types/social'
import type { Profile } from '@/lib/types/profile'
import { ViewersModal } from './ViewersModal'
import * as Haptics from 'expo-haptics'

interface SnaccBoardModalProps {
  visible: boolean
  onClose: () => void
  onUserPress?: (profile: Profile) => void
}

export function SnaccBoardModal({ 
  visible, 
  onClose,
  onUserPress
}: SnaccBoardModalProps) {
  const { theme } = useTheme()
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentEntry, setCurrentEntry] = useState<SnaccBoardEntry | null>(null)
  const [timeRemaining, setTimeRemaining] = useState('')
  const [viewersModalVisible, setViewersModalVisible] = useState(false)
  
  const styles = createStyles(theme)
  const maxLength = 150
  const isEditing = !!currentEntry

  // Load current user's entry when modal opens
  useEffect(() => {
    if (visible) {
      loadCurrentEntry()
    }
  }, [visible])

  // Set up timer for time remaining display
  useEffect(() => {
    if (!visible || !currentEntry) return

    const updateTimer = () => {
      const now = Date.now()
      const expiresAt = new Date(currentEntry.expires_at).getTime()
      const remaining = Math.max(0, expiresAt - now)
      
      if (remaining <= 0) {
        setTimeRemaining('Expired')
        setCurrentEntry(null)
      } else {
        setTimeRemaining(SnaccBoardService.formatTimeRemaining(remaining))
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [visible, currentEntry])

  const loadCurrentEntry = async () => {
    try {
      setLoading(true)
      const entry = await SnaccBoardService.getCurrentUserEntry()
      setCurrentEntry(entry)
      if (entry) {
        setText(entry.text)
      }
    } catch (error) {
      console.error('Error loading current entry:', error)
    } finally {
      setLoading(false)
    }
  }


  const handleClose = () => {
    if (text.trim() && text.trim() !== currentEntry?.text) {
      Alert.alert(
        'Discard Changes?',
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
      clearForm()
      onClose()
    }
  }

  const clearForm = () => {
    setText('')
    setCurrentEntry(null)
    setTimeRemaining('')
  }

  const canSave = () => {
    return text.trim().length > 0 && 
           text.trim().length <= maxLength && 
           !loading &&
           text.trim() !== currentEntry?.text
  }

  const handleSave = async () => {
    if (!canSave()) return

    try {
      setLoading(true)
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

      const payload: CreateSnaccBoardPayload = {
        text: text.trim()
      }

      if (currentEntry) {
        // Update existing entry
        await SnaccBoardService.updateEntry(currentEntry.id, payload)
      } else {
        // Create new entry
        await SnaccBoardService.createEntry(payload)
      }

      // Refresh the entry to get full data
      const refreshedEntry = await SnaccBoardService.getCurrentUserEntry()
      setCurrentEntry(refreshedEntry)

      Toast.show('Snacc board updated!', { type: 'success' })
      onClose()
    } catch (error) {
      console.error('Error saving snacc board:', error)
      Toast.show(
        error instanceof Error ? error.message : 'Failed to save snacc board',
        { type: 'error' }
      )
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = () => {
    if (!currentEntry) return

    Alert.alert(
      'Delete Snacc Board',
      'Are you sure you want to delete your snacc board? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true)
              await SnaccBoardService.deleteEntry(currentEntry.id)
              setCurrentEntry(null)
              setText('')
              Toast.show('Snacc board deleted', { type: 'info' })
              onClose()
            } catch (error) {
              console.error('Error deleting snacc board:', error)
              Toast.show('Failed to delete snacc board', { type: 'error' })
            } finally {
              setLoading(false)
            }
          }
        }
      ]
    )
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
            
            <Text style={styles.headerTitle}>My Snacc Board</Text>
            
            <Pressable 
              style={[
                styles.headerButton,
                styles.saveButton,
                !canSave() && styles.saveButtonDisabled
              ]} 
              onPress={handleSave}
              disabled={!canSave()}
            >
              <Text style={[
                styles.saveButtonText,
                !canSave() && styles.saveButtonTextDisabled
              ]}>
                {loading ? 'Saving...' : (isEditing ? 'Update' : 'Post')}
              </Text>
            </Pressable>
          </View>

          {loading && !text ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : (
            <View style={styles.content}>
              {/* Info section */}
              <View style={styles.infoSection}>
                <View style={styles.infoRow}>
                  <Ionicons name="time-outline" size={16} color={theme.textSecondary} />
                  <Text style={styles.infoText}>
                    Disappears in {timeRemaining || '24 hours'}
                  </Text>
                </View>
                
                {currentEntry && (
                  <Pressable 
                    style={styles.infoRow}
                    onPress={() => currentEntry.views_count > 0 && setViewersModalVisible(true)}
                    disabled={currentEntry.views_count === 0}
                  >
                    <Ionicons name="eye-outline" size={16} color={theme.textSecondary} />
                    <Text style={[
                      styles.infoText,
                      currentEntry.views_count > 0 && styles.clickableText
                    ]}>
                      {currentEntry.views_count} view{currentEntry.views_count !== 1 ? 's' : ''}
                      {currentEntry.views_count > 0 ? ' • tap to see who' : ''}
                    </Text>
                  </Pressable>
                )}

                {currentEntry && currentEntry.edit_count > 0 && (
                  <View style={styles.infoRow}>
                    <Ionicons name="create-outline" size={16} color={theme.textSecondary} />
                    <Text style={styles.infoText}>
                      Edited {currentEntry.edit_count} time{currentEntry.edit_count !== 1 ? 's' : ''}
                    </Text>
                  </View>
                )}
              </View>

              {/* Text input */}
              <TextInput
                style={[styles.textInput, { color: theme.text }]}
                placeholder="What's on your mind? Share a thought, feeling, or random idea..."
                placeholderTextColor={theme.textSecondary}
                value={text}
                onChangeText={setText}
                multiline
                maxLength={maxLength}
                autoFocus={!currentEntry}
                scrollEnabled
              />

              {/* Character count */}
              <View style={styles.footer}>
                <Text style={[
                  styles.charCount,
                  isOverLimit && styles.charCountOver
                ]}>
                  {remainingChars} characters left
                </Text>

                {isEditing && (
                  <Pressable style={styles.deleteButton} onPress={handleDelete}>
                    <Ionicons name="trash-outline" size={20} color="#ff4444" />
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </Pressable>
                )}
              </View>
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Viewers Modal */}
      <ViewersModal
        visible={viewersModalVisible}
        onClose={() => setViewersModalVisible(false)}
        snaccBoardId={currentEntry?.id || null}
        onUserPress={onUserPress}
      />
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
  saveButton: {
    backgroundColor: theme.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveButtonDisabled: {
    backgroundColor: theme.textSecondary + '30',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.background,
  },
  saveButtonTextDisabled: {
    color: theme.textSecondary,
  },
  placeholder: {
    width: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: theme.textSecondary,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  infoSection: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  clickableText: {
    color: theme.primary,
  },
  textInput: {
    flex: 1,
    fontSize: 18,
    lineHeight: 24,
    textAlignVertical: 'top',
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  charCount: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  charCountOver: {
    color: '#ff4444',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  deleteButtonText: {
    fontSize: 14,
    color: '#ff4444',
  },
})