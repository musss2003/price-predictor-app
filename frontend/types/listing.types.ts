/**
 * Core type definitions for property listings
 * Add new sources by extending the DataSource type
 */

export type DataSource = 'olx' | 'nekretnine' | 'all'

export interface Listing {
  id: number
  source: Exclude<DataSource, 'all'>
  title: string
  price_numeric: number
  municipality: string
  property_type: string
  ad_type?: string
  rooms: number
  square_m2: number
  condition: string
  deal_score: number
  url: string
  equipment: string
  heating: string
  level: string
  latitude?: number
  longitude?: number
  description?: string
  thumbnail_url?: string
  image_urls?: string[]
  posted_date?: string
  scraped_at?: string
  bathrooms?: number
  orientation?: string
  floor_type?: string
  year_built?: number
  has_garage?: boolean
  has_elevator?: boolean
  has_balcony?: boolean
  has_parking?: boolean
}

export interface ListingFilters {
  source: DataSource
  search: string
  priceMin: string
  priceMax: string
  municipality: string
  propertyType: string
  adType: string
  roomsMin: string
  roomsMax: string
  sizeMin: string
  sizeMax: string
  condition: string
  dealScoreMin: string
}

export interface FilterOptions {
  municipalities: string[]
  property_types: string[]
  ad_types: string[]
  price_range: { min: number; max: number; step: number }
  rooms_range: { min: number; max: number; step: number }
  size_range: { min: number; max: number; step: number }
}

export interface ListingsParams {
  limit?: number
  offset?: number
  source?: DataSource
  search?: string
  municipality?: string
  property_type?: string
  ad_type?: string
  price_min?: number
  price_max?: number
  rooms_min?: number
  rooms_max?: number
  size_min?: number
  size_max?: number
  deal_score_min?: number
}

export interface ListingsResponse {
  success: boolean
  data: Listing[]
  count: number
  total: number
  offset: number
  limit: number
}

export interface StatisticsSummary {
  total_listings: number
  olx_listings: number
  nekretnine_listings: number
  price_stats: {
    min: number
    max: number
    avg: number
  }
}

export interface MunicipalityStats {
  municipality: string
  total_listings: number
  avg_price: number
  avg_price_per_m2: number
  avg_rooms: number
  avg_size: number
}

export interface FavoriteItem {
  id: number
  user_id: string
  source: Exclude<DataSource, 'all'>
  listing_id: number
  notes?: string
  created_at: string
  listing?: Listing
}
