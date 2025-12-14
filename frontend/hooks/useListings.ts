/**
 * Custom hook for managing listings data
 * Handles fetching, filtering, and pagination
 */

import { useState, useEffect, useCallback } from 'react'
import { Listing, ListingFilters, FilterOptions, ListingsParams } from '@/types/listing.types'
import { getListingsV2, getFilterOptions } from '@/services/api'

interface UseListingsOptions {
  initialFilters?: Partial<ListingFilters>
  pageSize?: number
}

export const useListings = (options: UseListingsOptions = {}) => {
  const { initialFilters = {}, pageSize = 50 } = options

  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    municipalities: [],
    property_types: [],
    ad_types: [],
    price_range: { min: 0, max: 1000000, step: 10000 },
    rooms_range: { min: 0, max: 10, step: 0.5 },
    size_range: { min: 0, max: 500, step: 10 }
  })

  const [filters, setFilters] = useState<ListingFilters>({
    source: 'all',
    search: '',
    priceMin: '',
    priceMax: '',
    municipality: '',
    propertyType: '',
    adType: '',
    roomsMin: '',
    roomsMax: '',
    sizeMin: '',
    sizeMax: '',
    condition: '',
    dealScoreMin: '',
    ...initialFilters
  })

  // Load filter options on mount
  useEffect(() => {
    loadFilterOptions()
  }, [])

  // Fetch listings when filters change
  useEffect(() => {
    fetchListings(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  const loadFilterOptions = async () => {
    try {
      const result = await getFilterOptions()
      if (result.success) {
        setFilterOptions(result.filters)
      }
    } catch (err) {
      console.error('Failed to load filter options:', err)
    }
  }

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

      // Build query parameters
      const params: ListingsParams = {
        limit: pageSize,
        offset: currentOffset,
        source: filters.source
      }

      if (filters.search) params.search = filters.search
      if (filters.priceMin) params.price_min = Number(filters.priceMin)
      if (filters.priceMax) params.price_max = Number(filters.priceMax)
      if (filters.municipality) params.municipality = filters.municipality
      if (filters.propertyType) params.property_type = filters.propertyType
      if (filters.adType) params.ad_type = filters.adType
      if (filters.roomsMin) params.rooms_min = Number(filters.roomsMin)
      if (filters.roomsMax) params.rooms_max = Number(filters.roomsMax)
      if (filters.sizeMin) params.size_min = Number(filters.sizeMin)
      if (filters.sizeMax) params.size_max = Number(filters.sizeMax)
      if (filters.dealScoreMin) params.deal_score_min = Number(filters.dealScoreMin)

      const result = await getListingsV2(params)

      if (!result.success) {
        throw new Error('Failed to fetch listings')
      }

      const data = result.data || []
      const total = result.total || 0

      setTotalCount(total)

      if (reset) {
        setListings(data)
      } else {
        setListings(prev => [...prev, ...data])
      }

      setOffset(currentOffset + pageSize)
      setHasMore(data.length === pageSize && currentOffset + data.length < total)
    } catch (err) {
      console.error(err)
      setError('Failed to load listings')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchListings(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingMore, hasMore])

  const refresh = useCallback(() => {
    fetchListings(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  const clearFilters = useCallback(() => {
    setFilters({
      source: 'all',
      search: '',
      priceMin: '',
      priceMax: '',
      municipality: '',
      propertyType: '',
      adType: '',
      roomsMin: '',
      roomsMax: '',
      sizeMin: '',
      sizeMax: '',
      condition: '',
      dealScoreMin: ''
    })
  }, [])

  const updateFilters = useCallback((newFilters: Partial<ListingFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  return {
    listings,
    loading,
    loadingMore,
    error,
    hasMore,
    totalCount,
    filters,
    filterOptions,
    setFilters,
    updateFilters,
    clearFilters,
    loadMore,
    refresh
  }
}
