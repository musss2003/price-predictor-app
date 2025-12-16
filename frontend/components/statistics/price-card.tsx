import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface PriceCardProps {
  municipality: string;
  avgPrice: number;
  avgSize: number;
  pricePerM2: number;
  count: number;
  rank: number;
}

export function PriceCard({ municipality, avgPrice, avgSize, pricePerM2, count, rank }: PriceCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const formatPrice = (price: number) => {
    return `${(price / 1000).toFixed(0)}k KM`;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return '#fbbf24'; // gold
    if (rank === 2) return '#9ca3af'; // silver
    if (rank === 3) return '#cd7f32'; // bronze
    return isDark ? '#3b82f6' : '#60a5fa';
  };

  return (
    <ThemedView
      style={[
        styles.card,
        {
          backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
          borderColor: isDark ? '#2a2a2a' : '#e5e7eb',
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={[styles.rankBadge, { backgroundColor: getRankColor(rank) }]}>
            <ThemedText style={styles.rankText}>#{rank}</ThemedText>
          </View>
          <ThemedText style={styles.municipality} numberOfLines={1}>
            {municipality}
          </ThemedText>
        </View>
        <ThemedText style={styles.count}>{count} listings</ThemedText>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <ThemedText style={styles.statLabel}>Avg Price</ThemedText>
          <ThemedText style={styles.statValue}>{formatPrice(avgPrice)}</ThemedText>
        </View>

        <View style={styles.statItem}>
          <ThemedText style={styles.statLabel}>Avg Size</ThemedText>
          <ThemedText style={styles.statValue}>{avgSize.toFixed(0)}m²</ThemedText>
        </View>

        <View style={styles.statItem}>
          <ThemedText style={styles.statLabel}>Price/m²</ThemedText>
          <ThemedText style={[styles.statValue, { color: '#10b981' }]}>
            {pricePerM2.toFixed(0)} KM
          </ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  municipality: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
  },
  count: {
    fontSize: 13,
    opacity: 0.6,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    opacity: 0.6,
    marginBottom: 4,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 15,
    fontWeight: '600',
  },
});
