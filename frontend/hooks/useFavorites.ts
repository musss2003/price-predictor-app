/**
 * useFavorites Hook
 * Manages favorite listings state and operations
 */

import { useState, useEffect, useCallback } from 'react'
import { Alert } from 'react-native'
import * as Haptics from 'expo-haptics'
import { Listing } from '@/types/listing.types'
import * as favoritesService from '@/services/favorites.service'

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<Listing[]>([])
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Load all favorites from API
   */
  const loadFavorites = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await favoritesService.getFavorites()

      if (result.success && result.favorites) {
        setFavorites(result.favorites)
        // Create a Set of favorite IDs for quick lookup
        const ids = new Set(
          result.favorites.map((fav) => `${fav.id}-${fav.source}`)
        )
        setFavoriteIds(ids)
      } else {
        setError(result.error || 'Failed to load favorites')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Check if a listing is favorited
   */
  const isFavorite = useCallback(
    (listing: Listing): boolean => {
      const key = `${listing.id}-${listing.source}`
      return favoriteIds.has(key)
    },
    [favoriteIds]
  )

  /**
   * Toggle favorite status for a listing
   */
  const toggleFavorite = useCallback(
    async (listing: Listing) => {
      const wasFavorite = isFavorite(listing)
      const key = `${listing.id}-${listing.source}`

      // Optimistic update
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

      if (wasFavorite) {
        // Remove from state immediately
        setFavoriteIds((prev) => {
          const next = new Set(prev)
          next.delete(key)
          return next
        })
        setFavorites((prev) =>
          prev.filter(
            (fav) =>
              !(fav.id === listing.id && fav.source === listing.source)
          )
        )
      } else {
        // Add to state immediately
        setFavoriteIds((prev) => new Set(prev).add(key))
        setFavorites((prev) => [...prev, listing])
      }

      // Make API call
      const result = await favoritesService.toggleFavorite(
        listing.id.toString(),
        listing.source,
        wasFavorite
      )

      if (!result.success) {
        // Revert on error
        if (wasFavorite) {
          setFavoriteIds((prev) => new Set(prev).add(key))
          setFavorites((prev) => [...prev, listing])
        } else {
          setFavoriteIds((prev) => {
            const next = new Set(prev)
            next.delete(key)
            return next
          })
          setFavorites((prev) =>
            prev.filter(
              (fav) =>
                !(fav.id === listing.id && fav.source === listing.source)
            )
          )
        }

        Alert.alert(
          'Error',
          result.error || 'Failed to update favorite status',
          [{ text: 'OK' }]
        )
      }

      return result.success
    },
    [isFavorite]
  )

  /**
   * Add a listing to favorites
   */
  const addFavorite = useCallback(
    async (listing: Listing) => {
      if (isFavorite(listing)) {
        return true // Already favorited
      }

      const key = `${listing.id}-${listing.source}`

      // Optimistic update
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      setFavoriteIds((prev) => new Set(prev).add(key))
      setFavorites((prev) => [...prev, listing])

      // API call
      const result = await favoritesService.addFavorite(listing.id.toString(), listing.source)

      if (!result.success) {
        // Revert on error
        setFavoriteIds((prev) => {
          const next = new Set(prev)
          next.delete(key)
          return next
        })
        setFavorites((prev) =>
          prev.filter(
            (fav) =>
              !(fav.id === listing.id && fav.source === listing.source)
          )
        )

        Alert.alert('Error', result.error || 'Failed to add favorite', [{ text: 'OK' }])
      }

      return result.success
    },
    [isFavorite]
  )

  /**
   * Remove a listing from favorites
   */
  const removeFavorite = useCallback(
    async (listing: Listing) => {
      if (!isFavorite(listing)) {
        return true // Not favorited
      }

      const key = `${listing.id}-${listing.source}`

      // Optimistic update
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      setFavoriteIds((prev) => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
      setFavorites((prev) =>
        prev.filter(
          (fav) =>
            !(fav.id === listing.id && fav.source === listing.source)
        )
      )

      // API call
      const result = await favoritesService.removeFavorite(listing.id.toString(), listing.source)

      if (!result.success) {
        // Revert on error
        setFavoriteIds((prev) => new Set(prev).add(key))
        setFavorites((prev) => [...prev, listing])

        Alert.alert('Error', result.error || 'Failed to remove favorite', [{ text: 'OK' }])
      }

      return result.success
    },
    [isFavorite]
  )

  /**
   * Refresh favorites list
   */
  const refresh = useCallback(async () => {
    await loadFavorites()
  }, [loadFavorites])

  // Load favorites on mount
  useEffect(() => {
    loadFavorites()
  }, [loadFavorites])

  return {
    favorites,
    favoriteIds,
    loading,
    error,
    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    refresh
  }
}
