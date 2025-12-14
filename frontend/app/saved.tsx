/**
 * Saved Listings Screen - Refactored to use reusable components
 * Shows user's favorite property listings
 */

import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useState, useEffect } from 'react'
import { FlashList } from '@shopify/flash-list'
import { useAuth } from '@/contexts/AuthContext'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { getFavorites, removeFromFavorites } from '@/services/api'
import { ListingCard } from '@/components/listings/ListingCard'
import { Listing } from '@/types/listing.types'
import * as Haptics from 'expo-haptics'

interface Favorite {
  id: number
  user_id: string
  source: 'olx' | 'nekretnine'
  listing_id: number
  notes: string | null
  created_at: string
  listing: any
}

export default function SavedListingsScreen() {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.replace('/auth/signin')
    } else {
      loadFavorites()
    }
  }, [user])

  const loadFavorites = async () => {
    setLoading(true)
    try {
      const result = await getFavorites()
      if (result.success) {
        setFavorites(result.data || [])
      }
    } catch (error) {
      console.error('Failed to load favorites:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (source: 'olx' | 'nekretnine', listingId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    
    Alert.alert(
      'Remove Favorite',
      'Are you sure you want to remove this from your favorites?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFromFavorites(source, listingId)
              setFavorites(prev => prev.filter(f => !(f.source === source && f.listing_id === listingId)))
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
            } catch {
              Alert.alert('Error', 'Failed to remove favorite')
            }
          }
        }
      ]
    )
  }

  const renderFavorite = ({ item, index }: { item: Favorite; index: number }) => {
    // Transform favorite data to Listing type
    const listing: Listing = {
      ...item.listing,
      id: item.listing_id,
      source: item.source
    }

    return (
      <View style={styles.favoriteContainer}>
        {item.notes && (
          <View style={styles.notesContainer}>
            <Ionicons name="document-text" size={14} color="#667eea" />
            <Text style={styles.notesText} numberOfLines={2}>{item.notes}</Text>
          </View>
        )}
        
        <ListingCard 
          listing={listing} 
          index={index}
          showSource
        />
        
        <TouchableOpacity 
          onPress={() => handleRemove(item.source, item.listing_id)}
          style={styles.removeButton}
        >
          <Ionicons name="heart" size={24} color="#ef4444" />
          <Text style={styles.removeText}>Remove</Text>
        </TouchableOpacity>
        
        <Text style={styles.savedDate}>
          Saved {new Date(item.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}
        </Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Saved Listings</Text>
            <Text style={styles.headerSubtitle}>
              {loading ? 'Loading...' : `${favorites.length} saved ${favorites.length === 1 ? 'property' : 'properties'}`}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Loading your favorites...</Text>
        </View>
      ) : favorites.length === 0 ? (
        <View style={styles.centerContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="heart-outline" size={80} color="#667eea" />
          </View>
          <Text style={styles.emptyTitle}>No Saved Listings</Text>
          <Text style={styles.emptyText}>
            Browse the Explore tab and save properties you like{'\n'}
            They&apos;ll appear here for easy access
          </Text>
          <TouchableOpacity 
            style={styles.browseButton}
            onPress={() => router.push('/(tabs)/explore')}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.browseButtonGradient}
            >
              <Ionicons name="search" size={20} color="#fff" />
              <Text style={styles.browseButtonText}>Browse Listings</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <FlashList
          data={favorites}
          renderItem={renderFavorite}
          keyExtractor={(item) => `${item.source}-${item.listing_id}`}
          contentContainerStyle={styles.listContent}
          onRefresh={loadFavorites}
          refreshing={loading}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#fff',
    opacity: 0.9,
    marginTop: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyIcon: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  browseButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  browseButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 8,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
  },
  favoriteContainer: {
    marginBottom: 8,
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f0f4ff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  notesText: {
    flex: 1,
    fontSize: 14,
    color: '#667eea',
    fontStyle: 'italic',
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  removeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  savedDate: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
})
