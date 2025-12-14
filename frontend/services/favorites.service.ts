/**
 * Favorites Service
 * Handles API calls for saving/unsaving listings
 */

import { DataSource, Listing } from '@/types/listing.types'

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'

export interface FavoriteStatus {
  isFavorite: boolean
  favoriteId?: string
}

/**
 * Add a listing to favorites
 */
export const addFavorite = async (
  listingId: string,
  source: DataSource
): Promise<{ success: boolean; favoriteId?: string; error?: string }> => {
  try {
    const response = await fetch(`${API_URL}/api/favorites/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        listing_id: listingId,
        source
      })
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to add favorite'
      }
    }

    return {
      success: true,
      favoriteId: data.id
    }
  } catch (error) {
    console.error('Error adding favorite:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Remove a listing from favorites
 */
export const removeFavorite = async (
  listingId: string,
  source: DataSource
): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await fetch(`${API_URL}/api/favorites/remove`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        listing_id: listingId,
        source
      })
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to remove favorite'
      }
    }

    return {
      success: true
    }
  } catch (error) {
    console.error('Error removing favorite:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get all favorite listings
 */
export const getFavorites = async (): Promise<{
  success: boolean
  favorites?: Listing[]
  error?: string
}> => {
  try {
    const response = await fetch(`${API_URL}/api/favorites`)

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to get favorites'
      }
    }

    return {
      success: true,
      favorites: data.favorites || []
    }
  } catch (error) {
    console.error('Error getting favorites:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Check if a listing is favorited
 */
export const checkFavoriteStatus = async (
  listingId: string,
  source: DataSource
): Promise<FavoriteStatus> => {
  try {
    const result = await getFavorites()

    if (!result.success || !result.favorites) {
      return { isFavorite: false }
    }

    const favorite = result.favorites.find(
      (fav) => fav.id.toString() === listingId && fav.source === source
    )

    return {
      isFavorite: !!favorite,
      favoriteId: favorite?.id.toString()
    }
  } catch (error) {
    console.error('Error checking favorite status:', error)
    return { isFavorite: false }
  }
}

/**
 * Toggle favorite status (add if not favorite, remove if favorite)
 */
export const toggleFavorite = async (
  listingId: string,
  source: DataSource,
  currentStatus: boolean
): Promise<{ success: boolean; isFavorite: boolean; error?: string }> => {
  if (currentStatus) {
    const result = await removeFavorite(listingId, source)
    return {
      success: result.success,
      isFavorite: false,
      error: result.error
    }
  } else {
    const result = await addFavorite(listingId, source)
    return {
      success: result.success,
      isFavorite: true,
      error: result.error
    }
  }
}
