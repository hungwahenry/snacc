import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Modal,
  SafeAreaView,
  TextInput,
  FlatList,
  Image,
  Pressable,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '@/contexts/ThemeContext'
import { GiphyService, type ProcessedGif } from '@/lib/backend/giphy'
import * as Haptics from 'expo-haptics'

interface GIFPickerProps {
  visible: boolean
  onClose: () => void
  onSelectGIF: (gifUrl: string) => void
}


export function GIFPicker({ visible, onClose, onSelectGIF }: GIFPickerProps) {
  const { theme } = useTheme()
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [gifs, setGifs] = useState<ProcessedGif[]>([])
  const [error, setError] = useState<string | null>(null)
  
  const styles = createStyles(theme)

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onClose()
  }

  const handleSelectGIF = (gif: ProcessedGif) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    onSelectGIF(gif.url)
    onClose()
  }

  // Load trending GIFs on mount
  useEffect(() => {
    if (visible) {
      loadTrendingGifs()
    }
  }, [visible])

  const loadTrendingGifs = async () => {
    try {
      setLoading(true)
      setError(null)
      const trendingGifs = await GiphyService.getTrendingGifs(20)
      setGifs(trendingGifs)
    } catch (err) {
      console.error('Error loading trending GIFs:', err)
      setError('Failed to load GIFs')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    
    if (query.trim().length === 0) {
      // Load trending when search is cleared
      loadTrendingGifs()
      return
    }

    try {
      setLoading(true)
      setError(null)
      const searchResults = await GiphyService.searchGifs(query, 20)
      setGifs(searchResults)
    } catch (err) {
      console.error('Error searching GIFs:', err)
      setError('Failed to search GIFs')
    } finally {
      setLoading(false)
    }
  }

  const renderGIF = ({ item }: { item: ProcessedGif }) => (
    <Pressable
      style={styles.gifItem}
      onPress={() => handleSelectGIF(item)}
    >
      <Image
        source={{ uri: item.url }}
        style={styles.gifImage}
        resizeMode="cover"
      />
    </Pressable>
  )

  const renderEmptyState = () => {
    if (error) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.textSecondary} />
          <Text style={styles.emptyTitle}>Something went wrong</Text>
          <Text style={styles.emptySubtitle}>{error}</Text>
          <Pressable 
            style={styles.retryButton} 
            onPress={() => searchQuery ? handleSearch(searchQuery) : loadTrendingGifs()}
          >
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      )
    }

    return (
      <View style={styles.emptyState}>
        <Ionicons name="happy-outline" size={48} color={theme.textSecondary} />
        <Text style={styles.emptyTitle}>No GIFs found</Text>
        <Text style={styles.emptySubtitle}>
          {searchQuery ? 'Try a different search term' : 'Unable to load trending GIFs'}
        </Text>
      </View>
    )
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
          <Pressable style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color={theme.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Choose a GIF</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchInput, { backgroundColor: theme.surface }]}>
            <Ionicons name="search" size={20} color={theme.textSecondary} />
            <TextInput
              style={[styles.searchText, { color: theme.text }]}
              placeholder="Search GIFs..."
              placeholderTextColor={theme.textSecondary}
              value={searchQuery}
              onChangeText={handleSearch}
              returnKeyType="search"
            />
          </View>
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={styles.loadingText}>Searching GIFs...</Text>
          </View>
        ) : (
          <FlatList
            data={gifs}
            renderItem={renderGIF}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={gifs.length === 0 ? styles.emptyGridContainer : styles.gridContainer}
            ListEmptyComponent={renderEmptyState}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Footer note */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            🎬 Powered by GIPHY
          </Text>
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
  searchContainer: {
    padding: 16,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  searchText: {
    flex: 1,
    fontSize: 16,
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
  gridContainer: {
    padding: 16,
    gap: 8,
  },
  emptyGridContainer: {
    flexGrow: 1,
    padding: 16,
  },
  gifItem: {
    flex: 1,
    margin: 4,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: theme.surface,
  },
  gifImage: {
    width: '100%',
    height: 120,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  footerText: {
    fontSize: 12,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: theme.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 16,
  },
  retryText: {
    color: theme.background,
    fontSize: 16,
    fontWeight: '600',
  },
})