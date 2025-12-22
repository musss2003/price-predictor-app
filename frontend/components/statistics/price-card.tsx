import { StyleSheet, View, Text } from 'react-native';

interface PriceCardProps {
  municipality: string;
  avgPrice: number;
  avgSize: number;
  pricePerM2: number;
  count: number;
  rank: number;
  prodajaCount: number;
  iznajmljivanjeCount: number;
}

export function PriceCard({
  municipality,
  avgPrice,
  avgSize,
  pricePerM2,
  count,
  rank,
  prodajaCount,
  iznajmljivanjeCount,
}: PriceCardProps) {
  const formatPrice = (price: number) => {
    return `${(price / 1000).toFixed(0)}k KM`;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return '#fbbf24'; // gold
    if (rank === 2) return '#9ca3af'; // silver
    if (rank === 3) return '#cd7f32'; // bronze
    return '#60a5fa';
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={[styles.rankBadge, { backgroundColor: getRankColor(rank) }]}>
            <Text style={styles.rankText}>#{rank}</Text>
          </View>
          <Text style={styles.municipality} numberOfLines={1}>
            {municipality}
          </Text>
        </View>
        <Text style={styles.count}>{count} listings</Text>
      </View>

      <View style={styles.badgeRow}>
        <View style={[styles.badge, { backgroundColor: "#ecfdf3", borderColor: "#10b981" }]}>
          <Text style={[styles.badgeText, { color: "#065f46" }]}>Prodaja: {prodajaCount}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: "#fff7ed", borderColor: "#f59e0b" }]}>
          <Text style={[styles.badgeText, { color: "#92400e" }]}>Iznajmljivanje: {iznajmljivanjeCount}</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Avg Price</Text>
          <Text style={styles.statValue}>{formatPrice(avgPrice)}</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Avg Size</Text>
          <Text style={styles.statValue}>{avgSize.toFixed(0)}m²</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Price/m²</Text>
          <Text style={[styles.statValue, { color: '#10b981' }]}>
            {pricePerM2.toFixed(0)} KM
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
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
    color: '#000000',
  },
  count: {
    fontSize: 13,
    opacity: 0.6,
    fontWeight: '500',
    color: '#000000',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
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
    color: '#000000',
  },
  statValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
  },
});
