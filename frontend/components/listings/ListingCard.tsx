/**
 * Reusable Listing Card Component
 * Displays property listing with consistent design
 */

import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native'
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
  getDealScoreLabel,
  truncateText
} from '@/utils/formatting.utils'

interface ListingCardProps {
  listing: Listing
  index?: number
  onPress?: (listing: Listing) => void
  showSource?: boolean
}

export const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  index = 0,
  onPress,
  showSource = true
}) => {
  const dealColor = getDealScoreColor(listing.deal_score)
  const dealLabel = getDealScoreLabel(listing.deal_score)

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    if (onPress) {
      onPress(listing)
    } else if (listing.url) {
      Linking.openURL(listing.url)
    }
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
        {/* Header with price and badges */}
        <View style={styles.cardHeader}>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>{formatPrice(listing.price_numeric)}</Text>
            <Text style={styles.priceEur}>{formatPriceEur(listing.price_numeric)}</Text>
          </View>
          <View style={styles.badgesContainer}>
            {showSource && <SourceBadge source={listing.source} size="medium" />}
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
          <DetailRow icon="location" text={listing.municipality} />
          <DetailRow
            icon="home"
            text={`${listing.property_type} • ${formatRooms(listing.rooms)} • ${formatSquareMeters(listing.square_m2)}`}
          />
          {listing.condition && listing.equipment && (
            <DetailRow
              icon="hammer"
              text={`${listing.condition} • ${listing.equipment}`}
            />
          )}
          {listing.heating && listing.level && (
            <DetailRow
              icon="flame"
              text={`${listing.heating} • Floor ${listing.level}`}
            />
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
    lineHeight: 22
  },
  details: {
    gap: 8
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
  }
})
