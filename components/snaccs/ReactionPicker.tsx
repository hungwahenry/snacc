import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  FlatList,
  SafeAreaView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '@/contexts/ThemeContext'
import * as Haptics from 'expo-haptics'

interface ReactionPickerProps {
  visible: boolean
  onClose: () => void
  onSelectReaction: (emoji: string) => void
}

const EMOJI_CATEGORIES = [
  {
    name: 'Smileys',
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳']
  },
  {
    name: 'Gestures',
    emojis: ['👍', '👎', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪', '🦾', '🦿', '🦵', '🦶']
  },
  {
    name: 'Hearts',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟']
  },
  {
    name: 'Objects',
    emojis: ['🔥', '💯', '💫', '⭐', '🌟', '✨', '💥', '💢', '💨', '💤', '🕳️', '💣', '💡', '💎', '🎯', '🎪', '🎨', '🎭', '🎪', '🎨']
  },
  {
    name: 'Faces',
    emojis: ['😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐']
  }
]

export function ReactionPicker({ visible, onClose, onSelectReaction }: ReactionPickerProps) {
  const { theme } = useTheme()
  const styles = createStyles(theme)

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onClose()
  }

  const handleSelectReaction = (emoji: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    onSelectReaction(emoji)
    onClose()
  }

  const renderEmoji = ({ item }: { item: string }) => (
    <Pressable
      style={styles.emojiButton}
      onPress={() => handleSelectReaction(item)}
    >
      <Text style={styles.emoji}>{item}</Text>
    </Pressable>
  )

  const renderCategory = ({ item }: { item: typeof EMOJI_CATEGORIES[0] }) => (
    <View style={styles.category}>
      <Text style={styles.categoryTitle}>{item.name}</Text>
      <FlatList
        data={item.emojis}
        renderItem={renderEmoji}
        keyExtractor={(emoji) => emoji}
        numColumns={6}
        scrollEnabled={false}
        contentContainerStyle={styles.emojiGrid}
      />
    </View>
  )

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color={theme.text} />
          </Pressable>
          <Text style={styles.headerTitle}>React with an emoji</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Categories */}
        <FlatList
          data={EMOJI_CATEGORIES}
          renderItem={renderCategory}
          keyExtractor={(item) => item.name}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        />
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
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
  },
  placeholder: {
    width: 32,
  },
  content: {
    padding: 16,
  },
  category: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 12,
  },
  emojiGrid: {
    gap: 8,
  },
  emojiButton: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.surface,
    borderRadius: 8,
    margin: 2,
  },
  emoji: {
    fontSize: 24,
  },
})