import { StyleSheet, View, Text } from 'react-native';

interface StatCardProps {
  value: string | number;
  label: string;
  icon?: string;
  color?: string;
}

export function StatCard({ value, label, icon, color }: StatCardProps) {
  return (
    <View style={styles.card}>
      <Text style={[styles.value, color && { color }]}>
        {value}
      </Text>
      <Text style={styles.label}>{label}</Text>
    </View>
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
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
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
    color: '#000000',
  },
  label: {
    fontSize: 13,
    opacity: 0.7,
    fontWeight: '500',
    color: '#000000',
  },
});
