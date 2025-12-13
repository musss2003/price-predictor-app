/**
 * Refactored Explore Screen using reusable components
 * Clean, maintainable, and easily extensible
 */

import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  ScrollView
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { FlashList } from '@shopify/flash-list'
import { FAB, Chip } from 'react-native-paper'
import { BlurView } from 'expo-blur'
import { MotiView } from 'moti'
import { Skeleton } from 'moti/skeleton'
import * as Haptics from 'expo-haptics'

import { useListings } from '@/hooks/useListings'
import { ListingCard } from '@/components/listings/ListingCard'
import { FilterModal } from '@/components/filters/FilterModal'
import { Listing } from '@/types/listing.types'

export default function ExploreScreen() {
  const [showFilters, setShowFilters] = useState(false)
  
  const {
    listings,
    loading,
    loadingMore,
    error,
    totalCount,
    filters,
    filterOptions,
    setFilters,
    clearFilters,
    loadMore,
    refresh
  } = useListings({ pageSize: 50 })

  const activeFilterCount = useMemo(() => {
    return Object.entries(filters).filter(
      ([key, value]) => key !== 'source' && value !== '' && value !== 'all'
    ).length
  }, [filters])

  const renderListing = ({ item, index }: { item: Listing; index: number }) => (
    <ListingCard listing={item} index={index} showSource />
  )

  const ListHeaderComponent = () => (
    <>
      {activeFilterCount > 0 && (
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          exit={{ opacity: 0, translateY: -20 }}
        >
          <BlurView intensity={80} tint="light" style={styles.activeFiltersBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.activeFiltersContent}>
                <Text style={styles.activeFiltersLabel}>Filters:</Text>
                {renderActiveFilterChips()}
                <Chip
                  icon="close-circle"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                    clearFilters()
                  }}
                  style={styles.clearChip}
                  textStyle={styles.clearChipText}
                >
                  Clear All
                </Chip>
              </View>
            </ScrollView>
          </BlurView>
        </MotiView>
      )}
    </>
  )

  const renderActiveFilterChips = () => {
    const chips: JSX.Element[] = []
    
    if (filters.source !== 'all') {
      chips.push(
        <Chip
          key="source"
          mode="flat"
          style={styles.filterChip}
          textStyle={styles.filterChipText}
          onClose={() => setFilters({ ...filters, source: 'all' })}
        >
          {filters.source.toUpperCase()}
        </Chip>
      )
    }
    
    if (filters.priceMin) {
      chips.push(
        <Chip
          key="priceMin"
          mode="flat"
          style={styles.filterChip}
          textStyle={styles.filterChipText}
          onClose={() => setFilters({ ...filters, priceMin: '' })}
        >
          Min: {filters.priceMin} KM
        </Chip>
      )
    }
    
    if (filters.priceMax) {
      chips.push(
        <Chip
          key="priceMax"
          mode="flat"
          style={styles.filterChip}
          textStyle={styles.filterChipText}
          onClose={() => setFilters({ ...filters, priceMax: '' })}
        >
          Max: {filters.priceMax} KM
        </Chip>
      )
    }
    
    if (filters.municipality) {
      chips.push(
        <Chip
          key="municipality"
          mode="flat"
          style={styles.filterChip}
          textStyle={styles.filterChipText}
          onClose={() => setFilters({ ...filters, municipality: '' })}
        >
          {filters.municipality}
        </Chip>
      )
    }
    
    if (filters.propertyType) {
      chips.push(
        <Chip
          key="propertyType"
          mode="flat"
          style={styles.filterChip}
          textStyle={styles.filterChipText}
          onClose={() => setFilters({ ...filters, propertyType: '' })}
        >
          {filters.propertyType}
        </Chip>
      )
    }
    
    if (filters.adType) {
      chips.push(
        <Chip
          key="adType"
          mode="flat"
          style={styles.filterChip}
          textStyle={styles.filterChipText}
          onClose={() => setFilters({ ...filters, adType: '' })}
        >
          {filters.adType}
        </Chip>
      )
    }
    
    if (filters.roomsMin) {
      chips.push(
        <Chip
          key="roomsMin"
          mode="flat"
          style={styles.filterChip}
          textStyle={styles.filterChipText}
          onClose={() => setFilters({ ...filters, roomsMin: '' })}
        >
          {filters.roomsMin}+ rooms
        </Chip>
      )
    }
    
    if (filters.roomsMax) {
      chips.push(
        <Chip
          key="roomsMax"
          mode="flat"
          style={styles.filterChip}
          textStyle={styles.filterChipText}
          onClose={() => setFilters({ ...filters, roomsMax: '' })}
        >
          ≤{filters.roomsMax} rooms
        </Chip>
      )
    }
    
    if (filters.sizeMin) {
      chips.push(
        <Chip
          key="sizeMin"
          mode="flat"
          style={styles.filterChip}
          textStyle={styles.filterChipText}
          onClose={() => setFilters({ ...filters, sizeMin: '' })}
        >
          {filters.sizeMin}+ m²
        </Chip>
      )
    }
    
    if (filters.sizeMax) {
      chips.push(
        <Chip
          key="sizeMax"
          mode="flat"
          style={styles.filterChip}
          textStyle={styles.filterChipText}
          onClose={() => setFilters({ ...filters, sizeMax: '' })}
        >
          ≤{filters.sizeMax} m²
        </Chip>
      )
    }
    
    if (filters.dealScoreMin) {
      chips.push(
        <Chip
          key="dealScoreMin"
          mode="flat"
          style={styles.filterChip}
          textStyle={styles.filterChipText}
          onClose={() => setFilters({ ...filters, dealScoreMin: '' })}
        >
          Score {filters.dealScoreMin}+
        </Chip>
      )
    }
    
    return chips
  }

  const SkeletonCard = () => (
    <MotiView style={styles.skeletonCard}>
      <View style={styles.skeletonHeader}>
        <Skeleton colorMode="light" width={120} height={32} />
        <Skeleton colorMode="light" width={60} height={40} radius={12} />
      </View>
      <Skeleton colorMode="light" width="100%" height={44} />
      <View style={{ marginTop: 12, gap: 8 }}>
        <Skeleton colorMode="light" width="80%" height={20} />
        <Skeleton colorMode="light" width="90%" height={20} />
        <Skeleton colorMode="light" width="70%" height={20} />
      </View>
    </MotiView>
  )

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Property Listings</Text>
        <Text style={styles.headerSubtitle}>
          {loading && totalCount === 0
            ? 'Loading...'
            : `${totalCount.toLocaleString()} properties available`}
        </Text>
      </LinearGradient>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <View style={{ padding: 16, gap: 16 }}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </View>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle" size={64} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refresh}>
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
        <FlashList
          data={listings}
          renderItem={renderListing}
          keyExtractor={(item) => `${item.source}-${item.id}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onRefresh={refresh}
          refreshing={loading}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={ListHeaderComponent}
          ListFooterComponent={
            loadingMore ? (
              <MotiView
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={styles.footerLoader}
              >
                <ActivityIndicator size="small" color="#667eea" />
              </MotiView>
            ) : null
          }
          estimatedItemSize={200}
        />
      )}

      {/* Filter FAB */}
      <FAB
        icon="filter-variant"
        style={styles.fab}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
          setShowFilters(true)
        }}
        label={activeFilterCount > 0 ? `Filters (${activeFilterCount})` : undefined}
        size={activeFilterCount > 0 ? 'medium' : 'small'}
      />

      {/* Filter Modal */}
      <FilterModal
        visible={showFilters}
        filters={filters}
        filterOptions={filterOptions}
        totalCount={totalCount}
        onClose={() => setShowFilters(false)}
        onFiltersChange={setFilters}
        onClearAll={clearFilters}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 30
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9
  },
  activeFiltersBar: {
    paddingVertical: 12,
    overflow: 'hidden',
    marginBottom: 8
  },
  activeFiltersContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8
  },
  activeFiltersLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginRight: 8
  },
  filterChip: {
    backgroundColor: '#667eea',
    marginRight: 8
  },
  filterChipText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600'
  },
  clearChip: {
    backgroundColor: '#ef4444'
  },
  clearChipText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600'
  },
  loadingContainer: {
    flex: 1
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center'
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center'
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  listContent: {
    padding: 16
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#667eea'
  },
  skeletonCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    elevation: 2
  },
  skeletonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center'
  }
})
