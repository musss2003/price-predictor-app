/**
 * Reusable Listing Card Component
 * Displays property listing with consistent design
 */

import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Linking, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { MotiView } from 'moti'
import * as Haptics from 'expo-haptics'
import { Listing } from '@/types/listing.types'
import { SourceBadge } from './SourceBadge'
import {
  formatPrice,
  formatPriceEur,
  formatRooms,
  formatSquareMeters,
  getDealScoreColor,
  getDealScoreLabel
} from '@/utils/formatting.utils'

interface ListingCardProps {
  listing: Listing
  index?: number
  onPress?: (listing: Listing) => void
  onToggleFavorite?: (listing: Listing) => void
  isFavorite?: boolean
  showSource?: boolean
}

export const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  index = 0,
  onPress,
  onToggleFavorite,
  isFavorite = false,
  showSource = true
}) => {
  const dealColor = getDealScoreColor(listing.deal_score)
  const dealLabel = getDealScoreLabel(listing.deal_score)
  
  // Get thumbnail image
  const thumbnailUrl = listing.thumbnail_url || listing.image_urls?.[0] || null

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    if (onPress) {
      onPress(listing)
    } else if (listing.url) {
      Linking.openURL(listing.url)
    }
  }
  
  const handleFavoritePress = (e: any) => {
    e.stopPropagation()
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    onToggleFavorite?.(listing)
  }

  return (
    <MotiView
      from={{ opacity: 0, translateY: 50 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 400, delay: index * 50 }}
    >
      <TouchableOpacity
        style={styles.card}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        {/* Thumbnail Image */}
        {thumbnailUrl ? (
          <Image
            source={{ uri: thumbnailUrl }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.thumbnail, styles.noImage]}>
            <Ionicons name="image-outline" size={32} color="#ccc" />
          </View>
        )}
        
        {/* Favorite Button */}
        {onToggleFavorite && (
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={handleFavoritePress}
            activeOpacity={0.7}
          >
            <View style={styles.favoriteButtonBg}>
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={24}
                color={isFavorite ? '#ef4444' : '#fff'}
              />
            </View>
          </TouchableOpacity>
        )}

        {/* Header with price and badges */}
        <View style={styles.cardHeader}>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>{formatPrice(listing.price_numeric)}</Text>
            <Text style={styles.priceEur}>{formatPriceEur(listing.price_numeric)}</Text>
          </View>
          <View style={styles.badgesContainer}>
            {showSource && <SourceBadge source={listing.source} size="large" />}
            <View style={[styles.dealBadge, { backgroundColor: dealColor }]}>
              <Text style={styles.dealScore}>{listing.deal_score}</Text>
            </View>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>
          {listing.title || 'No title'}
        </Text>

        {/* Details */}
        <View style={styles.details}>
          {listing.municipality && (
            <DetailRow icon="location" text={listing.municipality} />
          )}
          <DetailRow
            icon="home"
            text={[
              listing.property_type,
              listing.rooms ? formatRooms(listing.rooms) : null,
              listing.square_m2 ? formatSquareMeters(listing.square_m2) : null
            ].filter(Boolean).join(' • ')}
          />
          {(listing.condition || listing.equipment) && (
            <DetailRow
              icon="hammer"
              text={[listing.condition, listing.equipment].filter(Boolean).join(' • ')}
            />
          )}
          {(listing.heating || listing.level) && (
            <DetailRow
              icon="flame"
              text={[
                listing.heating,
                listing.level ? `Floor ${listing.level}` : null
              ].filter(Boolean).join(' • ')}
            />
          )}
          {/* Additional database fields */}
          {(listing.bathrooms || listing.orientation || listing.year_built) && (
            <DetailRow
              icon="information-circle"
              text={[
                listing.bathrooms ? `${listing.bathrooms} bath` : null,
                listing.orientation || null,
                listing.year_built ? `Built ${listing.year_built}` : null
              ].filter(Boolean).join(' • ')}
            />
          )}
          {listing.floor_type && (
            <DetailRow icon="grid" text={`Floor: ${listing.floor_type}`} />
          )}
          {/* Amenities */}
          {(listing.has_elevator || listing.has_balcony || listing.has_parking || listing.has_garage) && (
            <View style={styles.amenitiesRow}>
              {listing.has_elevator && <AmenityBadge icon="arrow-up" label="Elevator" />}
              {listing.has_balcony && <AmenityBadge icon="partly-sunny" label="Balcony" />}
              {listing.has_parking && <AmenityBadge icon="car" label="Parking" />}
              {listing.has_garage && <AmenityBadge icon="home" label="Garage" />}
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={[styles.dealLabel, { backgroundColor: dealColor + '20' }]}>
            <Text style={[styles.dealLabelText, { color: dealColor }]}>
              {dealLabel}
            </Text>
          </View>
          <Ionicons name="open-outline" size={20} color="#667eea" />
        </View>
      </TouchableOpacity>
    </MotiView>
  )
}

interface DetailRowProps {
  icon: keyof typeof Ionicons.glyphMap
  text: string
}

const DetailRow: React.FC<DetailRowProps> = ({ icon, text }) => (
  <View style={styles.detailRow}>
    <Ionicons name={icon} size={16} color="#667eea" />
    <Text style={styles.detailText}>{text}</Text>
  </View>
)

interface AmenityBadgeProps {
  icon: keyof typeof Ionicons.glyphMap
  label: string
}

const AmenityBadge: React.FC<AmenityBadgeProps> = ({ icon, label }) => (
  <View style={styles.amenityBadge}>
    <Ionicons name={icon} size={14} color="#667eea" />
    <Text style={styles.amenityText}>{label}</Text>
  </View>
)

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12
  },
  thumbnail: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0'
  },
  noImage: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10
  },
  favoriteButtonBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 16,
    marginHorizontal: 18,
    marginBottom: 12
  },
  priceContainer: {
    flex: 1
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333'
  },
  priceEur: {
    fontSize: 14,
    color: '#666',
    marginTop: 2
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center'
  },
  dealBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  dealScore: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff'
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    marginHorizontal: 18,
    lineHeight: 22
  },
  details: {
    gap: 8,
    marginHorizontal: 18
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    flex: 1
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginHorizontal: 18,
    marginBottom: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0'
  },
  dealLabel: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8
  },
  dealLabelText: {
    fontSize: 12,
    fontWeight: '600'
  },
  amenitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4
  },
  amenityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0f4ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#667eea33'
  },
  amenityText: {
    fontSize: 11,
    color: '#667eea',
    fontWeight: '600'
  }
})
