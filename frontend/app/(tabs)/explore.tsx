import { LinearGradient } from 'expo-linear-gradient'
import React, { useState, useEffect, useMemo } from 'react'
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  Linking,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.199.127:8000'

interface Listing {
  id: number
  title: string
  price_numeric: number
  municipality: string
  property_type: string
  rooms: number
  square_m2: number
  condition: string
  deal_score: number
  url: string
  equipment: string
  heating: string
  level: string
}

interface Filters {
  priceMin: string
  priceMax: string
  municipality: string
  propertyType: string
  roomsMin: string
  sizeMin: string
  condition: string
  dealScoreMin: string
}

export default function ListingsScreen() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const LIMIT = 50
  const [filters, setFilters] = useState<Filters>({
    priceMin: '',
    priceMax: '',
    municipality: '',
    propertyType: '',
    roomsMin: '',
    sizeMin: '',
    condition: '',
    dealScoreMin: '',
  })

  useEffect(() => {
    fetchListings(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  const fetchListings = async (reset: boolean = false) => {
    if (reset) {
      setLoading(true)
      setOffset(0)
      setHasMore(true)
    } else {
      if (!hasMore || loadingMore) return
      setLoadingMore(true)
    }
    
    setError('')
    
    try {
      const currentOffset = reset ? 0 : offset
      
      // Build query parameters with filters
      const params = new URLSearchParams({
        limit: LIMIT.toString(),
        offset: currentOffset.toString(),
        sort: 'deal_score_desc',
      })
      
      if (filters.priceMin) params.append('price_min', filters.priceMin)
      if (filters.priceMax) params.append('price_max', filters.priceMax)
      if (filters.municipality) params.append('municipality', filters.municipality)
      if (filters.propertyType) params.append('property_type', filters.propertyType)
      if (filters.roomsMin) params.append('rooms_min', filters.roomsMin)
      if (filters.sizeMin) params.append('size_min', filters.sizeMin)
      if (filters.condition) params.append('condition', filters.condition)
      if (filters.dealScoreMin) params.append('deal_score_min', filters.dealScoreMin)
      
      const response = await fetch(`${API_URL}/listings?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch')
      
      const result = await response.json()
      const data = result.data || result
      const total = result.total || 0
      
      setTotalCount(total)
      
      if (reset) {
        setListings(data)
      } else {
        setListings(prev => [...prev, ...data])
      }
      
      setOffset(currentOffset + LIMIT)
      setHasMore(data.length === LIMIT && currentOffset + data.length < total)
    } catch (err) {
      console.error(err)
      setError('Failed to load listings')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchListings(false)
    }
  }

  const handleRefresh = () => {
    fetchListings(true)
  }

  const activeFilterCount = useMemo(() => {
    return Object.values(filters).filter(value => value !== '').length
  }, [filters])

  const clearFilters = () => {
    setFilters({
      priceMin: '',
      priceMax: '',
      municipality: '',
      propertyType: '',
      roomsMin: '',
      sizeMin: '',
      condition: '',
      dealScoreMin: '',
    })
  }

  const municipalities = useMemo(() => {
    const unique = [...new Set(listings.map(l => l.municipality).filter(Boolean))]
    return unique.sort()
  }, [listings])

  const propertyTypes = useMemo(() => {
    const unique = [...new Set(listings.map(l => l.property_type).filter(Boolean))]
    return unique.sort()
  }, [listings])

  const conditions = useMemo(() => {
    const unique = [...new Set(listings.map(l => l.condition).filter(Boolean))]
    return unique.sort()
  }, [listings])

  const openListing = (url: string) => {
    if (url) {
      Linking.openURL(url)
    }
  }

  const ListingCard = React.memo(({ item }: { item: Listing }) => {
    const dealColor = 
      item.deal_score >= 90 ? '#10b981' :
      item.deal_score >= 70 ? '#3b82f6' :
      item.deal_score >= 50 ? '#f59e0b' : '#ef4444'

    const dealLabel = 
      item.deal_score >= 90 ? 'Excellent Deal' :
      item.deal_score >= 70 ? 'Good Deal' :
      item.deal_score >= 50 ? 'Fair Price' : 'Overpriced'

    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => openListing(item.url)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>{item.price_numeric?.toLocaleString() || 'N/A'} KM</Text>
            <Text style={styles.priceEur}>
              ≈ €{((item.price_numeric || 0) / 2).toLocaleString()}
            </Text>
          </View>
          <View style={[styles.dealBadge, { backgroundColor: dealColor }]}>
            <Text style={styles.dealScore}>{item.deal_score}</Text>
          </View>
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {item.title || 'No title'}
        </Text>

        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Ionicons name="location" size={16} color="#667eea" />
            <Text style={styles.detailText}>{item.municipality}</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="home" size={16} color="#667eea" />
            <Text style={styles.detailText}>
              {item.property_type} • {item.rooms} rooms • {item.square_m2} m²
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="hammer" size={16} color="#667eea" />
            <Text style={styles.detailText}>
              {item.condition} • {item.equipment}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="flame" size={16} color="#667eea" />
            <Text style={styles.detailText}>
              {item.heating} • Floor {item.level}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={[styles.dealLabel, { backgroundColor: dealColor + '20' }]}>
            <Text style={[styles.dealLabelText, { color: dealColor }]}>
              {dealLabel}
            </Text>
          </View>
          <Ionicons name="open-outline" size={20} color="#667eea" />
        </View>
      </TouchableOpacity>
    )
  })

  ListingCard.displayName = 'ListingCard'

  const renderListing = ({ item }: { item: Listing }) => (
    <ListingCard item={item} />
  )

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Property Listings</Text>
            <Text style={styles.headerSubtitle}>
              {loading && totalCount === 0 
                ? 'Loading...' 
                : `${totalCount.toLocaleString()} properties available`
              }
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setShowFilters(true)}
          >
            <Ionicons name="options" size={24} color="#fff" />
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {activeFilterCount > 0 && (
        <View style={styles.activeFiltersBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.activeFiltersContent}>
              <Text style={styles.activeFiltersLabel}>Filters:</Text>
              {filters.priceMin && (
                <View style={styles.filterChip}>
                  <Text style={styles.filterChipText}>Min: {filters.priceMin} KM</Text>
                </View>
              )}
              {filters.priceMax && (
                <View style={styles.filterChip}>
                  <Text style={styles.filterChipText}>Max: {filters.priceMax} KM</Text>
                </View>
              )}
              {filters.municipality && (
                <View style={styles.filterChip}>
                  <Text style={styles.filterChipText}>{filters.municipality}</Text>
                </View>
              )}
              {filters.propertyType && (
                <View style={styles.filterChip}>
                  <Text style={styles.filterChipText}>{filters.propertyType}</Text>
                </View>
              )}
              {filters.roomsMin && (
                <View style={styles.filterChip}>
                  <Text style={styles.filterChipText}>{filters.roomsMin}+ rooms</Text>
                </View>
              )}
              {filters.sizeMin && (
                <View style={styles.filterChip}>
                  <Text style={styles.filterChipText}>{filters.sizeMin}+ m²</Text>
                </View>
              )}
              {filters.condition && (
                <View style={styles.filterChip}>
                  <Text style={styles.filterChipText}>{filters.condition}</Text>
                </View>
              )}
              {filters.dealScoreMin && (
                <View style={styles.filterChip}>
                  <Text style={styles.filterChipText}>Score {filters.dealScoreMin}+</Text>
                </View>
              )}
              <TouchableOpacity onPress={clearFilters} style={styles.clearFiltersButton}>
                <Text style={styles.clearFiltersText}>Clear All</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      )}

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Loading listings...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle" size={64} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchListings(true)}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : listings.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="search" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No properties match your filters</Text>
          <TouchableOpacity onPress={clearFilters} style={styles.retryButton}>
            <Text style={styles.retryText}>Clear Filters</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={listings}
          renderItem={renderListing}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={handleRefresh}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={1.5}
          maxToRenderPerBatch={5}
          windowSize={7}
          removeClippedSubviews={true}
          initialNumToRender={10}
          updateCellsBatchingPeriod={100}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#667eea" />
              </View>
            ) : null
          }
        />
      )}

      <Modal
        visible={showFilters}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.modalHeader}
            >
              <Text style={styles.modalTitle}>Filter Properties</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </LinearGradient>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>💰 Price Range (KM)</Text>
                <View style={styles.filterRow}>
                  <TextInput
                    style={styles.filterInput}
                    placeholder="Min price"
                    placeholderTextColor="#999"
                    value={filters.priceMin}
                    onChangeText={(text) => setFilters(prev => ({ ...prev, priceMin: text }))}
                    keyboardType="numeric"
                  />
                  <Text style={styles.filterSeparator}>—</Text>
                  <TextInput
                    style={styles.filterInput}
                    placeholder="Max price"
                    placeholderTextColor="#999"
                    value={filters.priceMax}
                    onChangeText={(text) => setFilters(prev => ({ ...prev, priceMax: text }))}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>📍 Location</Text>
                <TextInput
                  style={styles.filterInputFull}
                  placeholder="Search municipality..."
                  placeholderTextColor="#999"
                  value={filters.municipality}
                  onChangeText={(text) => setFilters(prev => ({ ...prev, municipality: text }))}
                />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                  {municipalities.slice(0, 10).map(m => (
                    <TouchableOpacity
                      key={m}
                      style={[
                        styles.selectChip,
                        filters.municipality === m && styles.selectChipActive
                      ]}
                      onPress={() => setFilters(prev => ({ 
                        ...prev, 
                        municipality: prev.municipality === m ? '' : m 
                      }))}
                    >
                      <Text style={[
                        styles.selectChipText,
                        filters.municipality === m && styles.selectChipTextActive
                      ]}>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>🏠 Property Type</Text>
                <View style={styles.chipWrap}>
                  {propertyTypes.map(type => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.selectChip,
                        filters.propertyType === type && styles.selectChipActive
                      ]}
                      onPress={() => setFilters(prev => ({ 
                        ...prev, 
                        propertyType: prev.propertyType === type ? '' : type 
                      }))}
                    >
                      <Text style={[
                        styles.selectChipText,
                        filters.propertyType === type && styles.selectChipTextActive
                      ]}>{type}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>🛏️ Property Details</Text>
                <View style={styles.filterRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.filterLabel}>Min Rooms</Text>
                    <TextInput
                      style={styles.filterInput}
                      placeholder="e.g., 2"
                      placeholderTextColor="#999"
                      value={filters.roomsMin}
                      onChangeText={(text) => setFilters(prev => ({ ...prev, roomsMin: text }))}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.filterLabel}>Min Size (m²)</Text>
                    <TextInput
                      style={styles.filterInput}
                      placeholder="e.g., 50"
                      placeholderTextColor="#999"
                      value={filters.sizeMin}
                      onChangeText={(text) => setFilters(prev => ({ ...prev, sizeMin: text }))}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>🔨 Condition</Text>
                <View style={styles.chipWrap}>
                  {conditions.map(cond => (
                    <TouchableOpacity
                      key={cond}
                      style={[
                        styles.selectChip,
                        filters.condition === cond && styles.selectChipActive
                      ]}
                      onPress={() => setFilters(prev => ({ 
                        ...prev, 
                        condition: prev.condition === cond ? '' : cond 
                      }))}
                    >
                      <Text style={[
                        styles.selectChipText,
                        filters.condition === cond && styles.selectChipTextActive
                      ]}>{cond}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>⭐ Deal Score</Text>
                <View style={styles.chipWrap}>
                  {['90', '70', '50'].map(score => (
                    <TouchableOpacity
                      key={score}
                      style={[
                        styles.selectChip,
                        filters.dealScoreMin === score && styles.selectChipActive
                      ]}
                      onPress={() => setFilters(prev => ({ 
                        ...prev, 
                        dealScoreMin: prev.dealScoreMin === score ? '' : score 
                      }))}
                    >
                      <Text style={[
                        styles.selectChipText,
                        filters.dealScoreMin === score && styles.selectChipTextActive
                      ]}>{score}+ (Excellent)</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.clearButton}
                onPress={clearFilters}
              >
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.applyButton}
                onPress={() => setShowFilters(false)}
              >
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.applyButtonGradient}
                >
                  <Text style={styles.applyButtonText}>
                    Apply Filters ({totalCount.toLocaleString()})
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 30,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#667eea',
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  activeFiltersBar: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activeFiltersContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  activeFiltersLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterChip: {
    backgroundColor: '#667eea',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  filterChipText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  clearFiltersButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearFiltersText: {
    color: '#667eea',
    fontSize: 12,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  priceContainer: {
    flex: 1,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  priceEur: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  dealBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  dealScore: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    lineHeight: 22,
  },
  details: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  dealLabel: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  dealLabelText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalBody: {
    padding: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  filterInput: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  filterInputFull: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 12,
  },
  filterSeparator: {
    fontSize: 18,
    color: '#999',
    fontWeight: '600',
  },
  filterLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  chipScroll: {
    marginTop: 8,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectChip: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e9ecef',
    marginRight: 8,
  },
  selectChipActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  selectChipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  selectChipTextActive: {
    color: '#fff',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  applyButton: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  applyButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
  },
})
