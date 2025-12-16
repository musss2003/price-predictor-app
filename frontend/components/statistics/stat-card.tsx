import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface StatCardProps {
  value: string | number;
  label: string;
  icon?: string;
  color?: string;
}

export function StatCard({ value, label, icon, color }: StatCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

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
      <ThemedText style={[styles.value, color && { color }]}>
        {value}
      </ThemedText>
      <ThemedText style={styles.label}>{label}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 150,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  value: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    opacity: 0.7,
    fontWeight: '500',
  },
});
