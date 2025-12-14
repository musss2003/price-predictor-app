/**
 * Reusable Listing Card Component
 * Displays property listing with consistent design
 */

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";
import { Listing } from "@/types/listing.types";
import { SourceBadge } from "./SourceBadge";
import {
  formatPrice,
  formatPriceEur,
  formatRooms,
  formatSquareMeters,
  getDealScoreColor,
  getDealScoreLabel,
} from "@/utils/formatting.utils";

interface ListingCardProps {
  listing: Listing;
  index?: number;
  onPress?: (listing: Listing) => void;
  onToggleFavorite?: (listing: Listing) => void;
  isFavorite?: boolean;
  showSource?: boolean;
  compact?: boolean;
}

export const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  index = 0,
  onPress,
  onToggleFavorite,
  isFavorite = false,
  showSource = true,
  compact = false,
}) => {
  const dealColor = getDealScoreColor(listing.deal_score);
  const dealLabel = getDealScoreLabel(listing.deal_score);

  // Get thumbnail image
  const thumbnailUrl = listing.thumbnail_url || listing.image_urls?.[0] || null;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onPress) {
      onPress(listing);
    } else if (listing.url) {
      Linking.openURL(listing.url);
    }
  };

  const handleFavoritePress = (e: any) => {
    e.stopPropagation();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onToggleFavorite?.(listing);
  };

  return (
    <MotiView
      from={{ opacity: 0, translateY: 50 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 400, delay: index * 50 }}
    >
      <TouchableOpacity
        style={[styles.card, compact && styles.cardCompact]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        {/* Thumbnail Image */}
        {thumbnailUrl ? (
          <Image
            source={{ uri: thumbnailUrl }}
            style={[styles.thumbnail, compact && styles.thumbnailCompact]}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.thumbnail, styles.noImage, compact && styles.thumbnailCompact]}>
            <Ionicons name="image-outline" size={compact ? 24 : 32} color="#ccc" />
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
                name={isFavorite ? "heart" : "heart-outline"}
                size={24}
                color={isFavorite ? "#ef4444" : "#fff"}
              />
            </View>
          </TouchableOpacity>
        )}

        {/* Modern Card Content */}
        <View style={styles.cardContent}>
          {/* Source Badge - Top */}
          {!compact && showSource && listing.source ? (
            <View style={styles.sourceRow}>
              <SourceBadge source={listing.source} size="medium" />
            </View>
          ) : null}

          {/* Price - Primary */}
          <View style={styles.priceRow}>
            <View style={styles.priceContainer}>
              <Text style={[styles.price, compact && styles.priceCompact]}>
                {formatPrice(listing.price_numeric)}
              </Text>
              {!compact && listing.price_numeric && (
                <Text style={styles.priceEur}>
                  {formatPriceEur(listing.price_numeric)}
                </Text>
              )}
            </View>
            {compact && (
              <View style={styles.dealIndicatorCompact}>
                <Ionicons
                  name={
                    (listing.deal_score || 0) >= 8
                      ? "star"
                      : (listing.deal_score || 0) >= 6
                      ? "star-half"
                      : "star-outline"
                  }
                  size={16}
                  color={dealColor}
                />
              </View>
            )}
          </View>

          {/* Deal Score - Secondary */}
          {!compact && (
            <View style={styles.dealRow}>
              <View style={[styles.dealBadge, { backgroundColor: dealColor + '15' }]}>
                <Ionicons
                  name={
                    (listing.deal_score || 0) >= 8
                      ? "star"
                      : (listing.deal_score || 0) >= 6
                      ? "star-half"
                      : "star-outline"
                  }
                  size={16}
                  color={dealColor}
                />
                <Text style={[styles.dealScoreText, { color: dealColor }]}>
                  {listing.deal_score || 0}
                </Text>
                <Text style={[styles.dealLabel, { color: dealColor }]}>
                  {dealLabel}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Title */}
        <Text style={[styles.title, compact && styles.titleCompact]} numberOfLines={compact ? 1 : 2}>
          {listing.title || "No title available"}
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
              listing.square_m2 ? formatSquareMeters(listing.square_m2) : null,
            ]
              .filter(Boolean)
              .join(" • ")}
          />
          {!compact && (listing.condition || listing.equipment) && (
            <DetailRow
              icon="hammer"
              text={[listing.condition, listing.equipment]
                .filter(Boolean)
                .join(" • ")}
            />
          )}
          {!compact && (listing.heating || listing.level) && (
            <DetailRow
              icon="flame"
              text={[
                listing.heating,
                listing.level ? `Floor ${listing.level}` : null,
              ]
                .filter(Boolean)
                .join(" • ")}
            />
          )}
          {/* Additional database fields */}
          {!compact && (listing.bathrooms || listing.orientation || listing.year_built) && (
            <DetailRow
              icon="information-circle"
              text={[
                listing.bathrooms ? `${listing.bathrooms} bath` : null,
                listing.orientation || null,
                listing.year_built ? `Built ${listing.year_built}` : null,
              ]
                .filter(Boolean)
                .join(" • ")}
            />
          )}
          {!compact && listing.floor_type && (
            <DetailRow icon="grid" text={`Floor: ${listing.floor_type}`} />
          )}
          {/* Amenities */}
          {!compact && (listing.has_elevator ||
            listing.has_balcony ||
            listing.has_parking ||
            listing.has_garage) && (
            <View style={styles.amenitiesRow}>
              {listing.has_elevator && (
                <AmenityBadge icon="arrow-up" label="Elevator" />
              )}
              {listing.has_balcony && (
                <AmenityBadge icon="partly-sunny" label="Balcony" />
              )}
              {listing.has_parking && (
                <AmenityBadge icon="car" label="Parking" />
              )}
              {listing.has_garage && (
                <AmenityBadge icon="home" label="Garage" />
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    </MotiView>
  );
};

interface DetailRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}

const DetailRow: React.FC<DetailRowProps> = ({ icon, text }) => (
  <View style={styles.detailRow}>
    <Ionicons name={icon} size={16} color="#667eea" />
    <Text style={styles.detailText}>{text}</Text>
  </View>
);

interface AmenityBadgeProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}

const AmenityBadge: React.FC<AmenityBadgeProps> = ({ icon, label }) => (
  <View style={styles.amenityBadge}>
    <Ionicons name={icon} size={14} color="#667eea" />
    <Text style={styles.amenityText}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 16,
    elevation: 4,
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  thumbnail: {
    width: "100%",
    height: 200,
    backgroundColor: "#f0f0f0",
  },
  noImage: {
    justifyContent: "center",
    alignItems: "center",
  },
  favoriteButton: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 10,
  },
  favoriteButtonBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: {
    padding: 16,
    gap: 12,
  },
  sourceRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  priceContainer: {
    flex: 1,
  },
  price: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1a1a1a",
    letterSpacing: -0.5,
  },
  priceEur: {
    fontSize: 15,
    color: "#666",
    marginTop: 4,
    fontWeight: "500",
  },
  dealRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  dealBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  dealScoreText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  dealLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
    marginHorizontal: 16,
    lineHeight: 22,
  },
  details: {
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 16
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    marginHorizontal: 18,
    marginBottom: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  amenitiesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  amenityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f0f4ff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#667eea33",
  },
  amenityText: {
    fontSize: 11,
    color: "#667eea",
    fontWeight: "600",
  },
  // Compact mode styles
  cardCompact: {
    marginBottom: 8,
  },
  thumbnailCompact: {
    height: 120,
  },
  cardHeaderCompact: {
    marginTop: 12,
    marginHorizontal: 12,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceCompact: {
    fontSize: 18,
    fontWeight: "bold",
  },
  dealIndicatorCompact: {
    backgroundColor: "#fff",
    padding: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  titleCompact: {
    fontSize: 13,
    marginHorizontal: 12,
    marginBottom: 8,
    lineHeight: 18,
  },
});
