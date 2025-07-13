import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Modal,
  SafeAreaView,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '@/contexts/ThemeContext'
import { ReportingService } from '@/lib/backend/reporting'
import { Toast } from '@/components/ui/Toast'
import type { ReportContext } from '@/lib/types/social'
import type { Profile } from '@/lib/types/profile'
import * as Haptics from 'expo-haptics'

interface ReportModalProps {
  visible: boolean
  onClose: () => void
  targetUser: Profile
  context: ReportContext
}

export function ReportModal({ 
  visible, 
  onClose, 
  targetUser,
  context
}: ReportModalProps) {
  const { theme } = useTheme()
  const [selectedReason, setSelectedReason] = useState<string>('')
  const [customReason, setCustomReason] = useState('')
  const [loading, setLoading] = useState(false)
  
  const styles = createStyles(theme)
  const reasons = ReportingService.getReportReasons(context)
  const contextName = ReportingService.getContextDisplayName(context)

  const handleClose = () => {
    setSelectedReason('')
    setCustomReason('')
    onClose()
  }

  const handleReasonSelect = (reason: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSelectedReason(reason)
    if (reason !== 'Other') {
      setCustomReason('')
    }
  }

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert('Missing Information', 'Please select a reason for reporting.')
      return
    }

    if (selectedReason === 'Other' && !customReason.trim()) {
      Alert.alert('Missing Information', 'Please provide details for your report.')
      return
    }

    try {
      setLoading(true)
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

      const reportReason = selectedReason === 'Other' ? customReason.trim() : selectedReason

      await ReportingService.submitReport({
        target_id: targetUser.id,
        context,
        reason: reportReason,
      })

      Toast.show('Report submitted successfully', { type: 'success' })
      handleClose()
    } catch (error) {
      console.error('Error submitting report:', error)
      Toast.show(
        error instanceof Error ? error.message : 'Failed to submit report',
        { type: 'error' }
      )
    } finally {
      setLoading(false)
    }
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
            <Text style={styles.headerButtonText}>Cancel</Text>
          </Pressable>
          
          <Text style={styles.headerTitle}>Report {contextName}</Text>
          
          <Pressable 
            style={[
              styles.headerButton,
              styles.submitButton,
              (!selectedReason || loading) && styles.submitButtonDisabled
            ]} 
            onPress={handleSubmit}
            disabled={!selectedReason || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={theme.background} />
            ) : (
              <Text style={[
                styles.submitButtonText,
                (!selectedReason || loading) && styles.submitButtonTextDisabled
              ]}>
                Submit
              </Text>
            )}
          </Pressable>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* User Info */}
          <View style={styles.userInfo}>
            <Text style={styles.reportingText}>
              You're reporting @{targetUser.username}
            </Text>
            <Text style={styles.contextText}>
              Context: {contextName}
            </Text>
          </View>

          {/* Reason Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Why are you reporting this?</Text>
            <Text style={styles.sectionSubtitle}>
              Your report helps keep snacc safe for everyone.
            </Text>
            
            {reasons.map((reason) => (
              <Pressable
                key={reason}
                style={[
                  styles.reasonItem,
                  selectedReason === reason && styles.reasonItemSelected
                ]}
                onPress={() => handleReasonSelect(reason)}
              >
                <View style={styles.reasonContent}>
                  <Text style={[
                    styles.reasonText,
                    selectedReason === reason && styles.reasonTextSelected
                  ]}>
                    {reason}
                  </Text>
                  {selectedReason === reason && (
                    <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
                  )}
                </View>
              </Pressable>
            ))}
          </View>

          {/* Custom Reason Input */}
          {selectedReason === 'Other' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Additional Details</Text>
              <TextInput
                style={[styles.textInput, { color: theme.text }]}
                placeholder="Please provide more details about why you're reporting this..."
                placeholderTextColor={theme.textSecondary}
                value={customReason}
                onChangeText={setCustomReason}
                multiline
                maxLength={500}
                autoFocus
              />
              <Text style={styles.charCount}>
                {customReason.length}/500 characters
              </Text>
            </View>
          )}

          {/* Disclaimer */}
          <View style={styles.disclaimer}>
            <Text style={styles.disclaimerText}>
              Reports are reviewed by our moderation team. False reports may result in action against your account.
            </Text>
          </View>
        </ScrollView>
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
  submitButton: {
    backgroundColor: theme.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: theme.textSecondary + '30',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.background,
  },
  submitButtonTextDisabled: {
    color: theme.textSecondary,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  userInfo: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  reportingText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  contextText: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  reasonItem: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    marginBottom: 8,
  },
  reasonItemSelected: {
    backgroundColor: theme.primary + '15',
    borderWidth: 1,
    borderColor: theme.primary,
  },
  reasonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  reasonText: {
    fontSize: 16,
    color: theme.text,
    flex: 1,
  },
  reasonTextSelected: {
    color: theme.primary,
    fontWeight: '500',
  },
  textInput: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 100,
    borderWidth: 1,
    borderColor: theme.border,
  },
  charCount: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 8,
    textAlign: 'right',
  },
  disclaimer: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  disclaimerText: {
    fontSize: 13,
    color: theme.textSecondary,
    lineHeight: 18,
    textAlign: 'center',
  },
})