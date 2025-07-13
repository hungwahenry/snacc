/**
 * Giphy API Service
 * 
 * Handles integration with Giphy API for GIF search and trending
 */

import Constants from 'expo-constants'

interface GiphyGif {
  id: string
  title: string
  images: {
    fixed_height: {
      url: string
      width: string
      height: string
    }
    fixed_width: {
      url: string
      width: string
      height: string
    }
    original: {
      url: string
      width: string
      height: string
    }
    preview_gif: {
      url: string
      width: string
      height: string
    }
  }
}

interface GiphyResponse {
  data: GiphyGif[]
  pagination: {
    total_count: number
    count: number
    offset: number
  }
  meta: {
    status: number
    msg: string
    response_id: string
  }
}

export interface ProcessedGif {
  id: string
  title: string
  url: string
  previewUrl: string
  width: number
  height: number
}

export class GiphyService {
  private static readonly BASE_URL = 'https://api.giphy.com/v1/gifs'
  private static readonly API_KEY = Constants.expoConfig?.extra?.giphyApiKey || process.env.EXPO_PUBLIC_GIPHY_API_KEY

  /**
   * Search for GIFs using a query string
   */
  static async searchGifs(query: string, limit = 20, offset = 0): Promise<ProcessedGif[]> {
    if (!this.API_KEY) {
      console.warn('Giphy API key not found, returning empty results')
      return []
    }

    try {
      const params = new URLSearchParams({
        api_key: this.API_KEY,
        q: query,
        limit: limit.toString(),
        offset: offset.toString(),
        rating: 'pg-13', // Keep it appropriate
        lang: 'en'
      })

      const response = await fetch(`${this.BASE_URL}/search?${params}`)
      
      if (!response.ok) {
        throw new Error(`Giphy API error: ${response.status} ${response.statusText}`)
      }

      const data: GiphyResponse = await response.json()
      
      return data.data.map(gif => this.processGif(gif))
    } catch (error) {
      console.error('Error searching GIFs:', error)
      throw new Error('Failed to search GIFs')
    }
  }

  /**
   * Get trending GIFs
   */
  static async getTrendingGifs(limit = 20, offset = 0): Promise<ProcessedGif[]> {
    if (!this.API_KEY) {
      console.warn('Giphy API key not found, returning empty results')
      return []
    }

    try {
      const params = new URLSearchParams({
        api_key: this.API_KEY,
        limit: limit.toString(),
        offset: offset.toString(),
        rating: 'pg-13'
      })

      const response = await fetch(`${this.BASE_URL}/trending?${params}`)
      
      if (!response.ok) {
        throw new Error(`Giphy API error: ${response.status} ${response.statusText}`)
      }

      const data: GiphyResponse = await response.json()
      
      return data.data.map(gif => this.processGif(gif))
    } catch (error) {
      console.error('Error getting trending GIFs:', error)
      throw new Error('Failed to get trending GIFs')
    }
  }

  /**
   * Get GIF by ID
   */
  static async getGifById(id: string): Promise<ProcessedGif | null> {
    if (!this.API_KEY) {
      console.warn('Giphy API key not found, returning null')
      return null
    }

    try {
      const params = new URLSearchParams({
        api_key: this.API_KEY
      })

      const response = await fetch(`${this.BASE_URL}/${id}?${params}`)
      
      if (!response.ok) {
        throw new Error(`Giphy API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      return data.data ? this.processGif(data.data) : null
    } catch (error) {
      console.error('Error getting GIF by ID:', error)
      return null
    }
  }

  /**
   * Process raw Giphy GIF data into our format
   */
  private static processGif(gif: GiphyGif): ProcessedGif {
    // Use fixed_width for display (good balance of quality and size)
    const displayImage = gif.images.fixed_width
    // Use preview for smaller loading image
    const previewImage = gif.images.preview_gif

    return {
      id: gif.id,
      title: gif.title,
      url: displayImage.url,
      previewUrl: previewImage.url,
      width: parseInt(displayImage.width),
      height: parseInt(displayImage.height)
    }
  }
}