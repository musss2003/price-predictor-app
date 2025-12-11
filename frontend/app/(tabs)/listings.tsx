// app/(tabs)/listings.tsx
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Linking,
} from "react-native";

// If you use expo-router Tabs, this will automatically become a tab screen

// Adjust this to your real backend URL
// Use your computer's local IP instead of localhost when testing on phone
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://10.0.199.127:8000";

type Listing = {
  id: number;
  title: string | null;
  url: string;
  municipality: string | null;
  property_type: string | null;
  ad_type: string | null;
  price_numeric: number | null;
  predicted_price: number | null;
  price_difference: number | null;
  deal_score: number | null;
  is_underpriced: boolean | null;
  is_overpriced: boolean | null;
  rooms: number | null;
  square_m2: number | null;
  condition: string | null;
  equipment: string | null;
};

const ListingsScreen: React.FC = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchListings = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      const res = await fetch(
        `${API_BASE_URL}/listings?limit=50&sort=deal_score_desc`
      );

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data: Listing[] = await res.json();
      setListings(data);
    } catch (err: any) {
      console.error("Error fetching listings:", err);
      setError("Failed to load listings. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchListings();
    setRefreshing(false);
  }, [fetchListings]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const openListingUrl = (url: string) => {
    if (!url) return;
    Linking.openURL(url).catch((err) =>
      console.error("Failed to open URL:", err)
    );
  };

  const renderDealBadge = (listing: Listing) => {
    const score = listing.deal_score ?? 0;

    let backgroundColor = "#E5E7EB"; // default gray
    let label = "No score";

    if (score >= 90) {
      backgroundColor = "#16A34A"; // green
      label = "Excellent deal";
    } else if (score >= 75) {
      backgroundColor = "#22C55E"; // light green
      label = "Good deal";
    } else if (score >= 60) {
      backgroundColor = "#FACC15"; // yellow
      label = "Fair price";
    } else if (score > 0) {
      backgroundColor = "#EF4444"; // red
      label = "Overpriced";
    }

    return (
      <View style={[styles.badge, { backgroundColor }]}>
        <Text style={styles.badgeText}>
          {score > 0 ? `${score} • ${label}` : label}
        </Text>
      </View>
    );
  };

  const renderItem = ({ item }: { item: Listing }) => {
    const price = item.price_numeric ?? 0;
    const predicted = item.predicted_price ?? 0;
    const m2 = item.square_m2 ?? 0;
    const pricePerM2 = m2 > 0 ? Math.round(price / m2) : null;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => openListingUrl(item.url)}
      >
        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>
          {item.title || "Bez naslova"}
        </Text>

        {/* Location + type */}
        <Text style={styles.subtitle} numberOfLines={1}>
          {item.property_type || "Stan"} •{" "}
          {item.municipality || "Nepoznata lokacija"}
        </Text>

        {/* Deal badge */}
        <View style={styles.badgeRow}>{renderDealBadge(item)}</View>

        {/* Price row */}
        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Listed price</Text>
            <Text style={styles.value}>
              {price > 0 ? `${price.toLocaleString("de-DE")} KM` : "N/A"}
            </Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Predicted price</Text>
            <Text style={styles.valuePredicted}>
              {predicted > 0
                ? `${predicted.toLocaleString("de-DE")} KM`
                : "N/A"}
            </Text>
          </View>
        </View>

        {/* Additional info */}
        <View style={[styles.row, { marginTop: 8 }]}>
          <View style={styles.col}>
            <Text style={styles.label}>Size / Rooms</Text>
            <Text style={styles.value}>
              {m2 ? `${m2} m²` : "?"} • {item.rooms ?? "?"} soba
            </Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Price per m²</Text>
            <Text style={styles.value}>
              {pricePerM2
                ? `${pricePerM2.toLocaleString("de-DE")} KM/m²`
                : "N/A"}
            </Text>
          </View>
        </View>

        {/* Condition / Equipment */}
        <View style={[styles.row, { marginTop: 8 }]}>
          <View style={styles.col}>
            <Text style={styles.label}>Condition</Text>
            <Text style={styles.valueSmall}>
              {item.condition || "Nepoznato"}
            </Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Equipment</Text>
            <Text style={styles.valueSmall}>
              {item.equipment || "Nepoznato"}
            </Text>
          </View>
        </View>

        {/* Hint */}
        <Text style={styles.openHint}>Tap to open on OLX</Text>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing && listings.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 8 }}>Loading listings…</Text>
      </View>
    );
  }

  if (error && listings.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchListings}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={listings}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={
          listings.length === 0 ? styles.emptyListContainer : styles.listContent
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No listings available.</Text>
        }
      />
    </View>
  );
};

export default ListingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  listContent: {
    padding: 12,
    paddingBottom: 40,
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  subtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  badgeRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    marginTop: 10,
    gap: 12,
  },
  col: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    color: "#6B7280",
  },
  value: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
  },
  valuePredicted: {
    fontSize: 14,
    color: "#2563EB",
    fontWeight: "500",
  },
  valueSmall: {
    fontSize: 13,
    color: "#111827",
  },
  openHint: {
    marginTop: 10,
    fontSize: 11,
    color: "#9CA3AF",
    textAlign: "right",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  errorText: {
    color: "#B91C1C",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    marginTop: 4,
  },
  retryText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  emptyText: {
    color: "#6B7280",
    fontSize: 14,
  },
});
