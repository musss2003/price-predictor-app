import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Linking, Alert } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { getFavorites, removeFromFavorites } from '@/services/api'

interface Favorite {
  id: number
  user_id: string
  source: 'olx' | 'nekretnine'
  listing_id: number
  notes: string | null
  created_at: string
  listing: {
    id: number
    source: 'olx' | 'nekretnine'
    title: string
    price_numeric: number
    municipality: string
    property_type: string
    rooms: number
    square_m2: number
    url: string
    condition: string
    deal_score: number
  }
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
            } catch {
              Alert.alert('Error', 'Failed to remove favorite')
            }
          }
        }
      ]
    )
  }

  const renderFavorite = useCallback(({ item }: { item: Favorite }) => {
    const listing = item.listing
    const dealColor = 
      listing.deal_score >= 90 ? '#10b981' :
      listing.deal_score >= 70 ? '#3b82f6' :
      listing.deal_score >= 50 ? '#f59e0b' : '#ef4444'
    
    const sourceColor = item.source === 'olx' ? '#4A90E2' : '#E2574C'
    const sourceLabel = item.source === 'olx' ? 'OLX' : 'Nekretnine'

    return (
      <View style={styles.card}>
        <TouchableOpacity
          onPress={() => listing.url && Linking.openURL(listing.url)}
          style={styles.cardContent}
          activeOpacity={0.7}
        >
          <View style={styles.cardTop}>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>{listing.price_numeric?.toLocaleString() || 'N/A'} KM</Text>
              <Text style={styles.priceEur}>≈ €{((listing.price_numeric || 0) / 2).toLocaleString()}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <View style={[styles.sourceBadge, { backgroundColor: sourceColor }]}>
                <Text style={styles.sourceText}>{sourceLabel}</Text>
              </View>
              <View style={[styles.dealBadge, { backgroundColor: dealColor }]}>
                <Text style={styles.dealScore}>{listing.deal_score}</Text>
              </View>
              <TouchableOpacity 
                onPress={() => handleRemove(item.source, item.listing_id)}
                style={styles.heartButton}
              >
                <Ionicons name="heart" size={28} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.title} numberOfLines={2}>
            {listing.title || 'No title'}
          </Text>

          {item.notes && (
            <View style={styles.notesContainer}>
              <Ionicons name="document-text" size={14} color="#667eea" />
              <Text style={styles.notesText} numberOfLines={2}>{item.notes}</Text>
            </View>
          )}

          <View style={styles.details}>
            <View style={styles.detailRow}>
              <View style={styles.iconBadge}>
                <Ionicons name="location" size={16} color="#667eea" />
              </View>
              <Text style={styles.detailText}>{listing.municipality}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <View style={styles.iconBadge}>
                <Ionicons name="home" size={16} color="#667eea" />
              </View>
              <Text style={styles.detailText}>
                {listing.property_type} • {listing.rooms} rooms • {listing.square_m2} m²
              </Text>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.iconBadge}>
                <Ionicons name="hammer" size={16} color="#667eea" />
              </View>
              <Text style={styles.detailText}>{listing.condition}</Text>
            </View>
          </View>

          <View style={styles.footer}>
            <View style={styles.openButton}>
              <Ionicons name="open-outline" size={18} color="#667eea" />
              <Text style={styles.openText}>View Listing</Text>
            </View>
            <Text style={styles.savedDate}>
              Saved {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    )
  }, [])

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
            Browse the Listings tab and tap the heart icon to save properties you like
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
        <FlatList
          data={favorites}
          renderItem={renderFavorite}
          keyExtractor={(item) => `${item.source}-${item.listing_id}`}
          contentContainerStyle={styles.listContent}
          refreshing={loading}
          onRefresh={loadFavorites}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  cardContent: {
    padding: 20,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  priceContainer: {
    flex: 1,
  },
  price: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  priceEur: {
    fontSize: 15,
    color: '#666',
    marginTop: 4,
  },
  heartButton: {
    padding: 8,
  },
  sourceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sourceText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dealBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  dealScore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a1a1a',
    lineHeight: 24,
    marginBottom: 16,
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f0f4ff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  notesText: {
    flex: 1,
    fontSize: 14,
    color: '#667eea',
    fontStyle: 'italic',
  },
  details: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailText: {
    fontSize: 15,
    color: '#666',
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  openButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  openText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#667eea',
  },
  savedDate: {
    fontSize: 12,
    color: '#999',
  },
})
