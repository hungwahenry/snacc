import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Modal,
  SafeAreaView,
  Pressable,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '@/contexts/ThemeContext'
import { SnaccBoardService } from '@/lib/backend/snaccBoard'
import type { SnaccBoardWithProfile } from '@/lib/types/social'

interface ViewSnaccBoardModalProps {
  visible: boolean
  onClose: () => void
  snaccBoard: SnaccBoardWithProfile | null
}

export function ViewSnaccBoardModal({ 
  visible, 
  onClose, 
  snaccBoard
}: ViewSnaccBoardModalProps) {
  const { theme } = useTheme()
  const [timeRemaining, setTimeRemaining] = useState('')
  
  const styles = createStyles(theme)

  // Set up timer for time remaining display
  useEffect(() => {
    if (!visible || !snaccBoard) return

    const updateTimer = () => {
      const now = Date.now()
      const expiresAt = new Date(snaccBoard.expires_at).getTime()
      const remaining = Math.max(0, expiresAt - now)
      
      if (remaining <= 0) {
        setTimeRemaining('Expired')
      } else {
        setTimeRemaining(SnaccBoardService.formatTimeRemaining(remaining))
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [visible, snaccBoard])

  const handleClose = () => {
    setTimeRemaining('')
    onClose()
  }

  if (!snaccBoard) {
    return null
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.headerButton} onPress={handleClose}>
            <Text style={styles.headerButtonText}>Close</Text>
          </Pressable>
          
          <Text style={styles.headerTitle}>Snacc Board</Text>
          
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          {/* Info section */}
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={16} color={theme.textSecondary} />
              <Text style={styles.infoText}>
                Expires in {timeRemaining || '24 hours'}
              </Text>
            </View>
            
            {snaccBoard.edit_count > 0 && (
              <View style={styles.infoRow}>
                <Ionicons name="create-outline" size={16} color={theme.textSecondary} />
                <Text style={styles.infoText}>
                  Edited {snaccBoard.edit_count} time{snaccBoard.edit_count !== 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </View>

          {/* Content area */}
          <View style={styles.viewingContent}>
            <Text style={styles.viewingText}>{snaccBoard.text}</Text>
            <Text style={styles.authorText}>
              by @{snaccBoard.profile.username}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  )
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
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
  placeholder: {
    width: 60,
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
  viewingContent: {
    flex: 1,
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  viewingText: {
    fontSize: 18,
    lineHeight: 24,
    color: theme.text,
    textAlign: 'center',
  },
  authorText: {
    fontSize: 14,
    color: theme.textSecondary,
    fontStyle: 'italic',
  },
})