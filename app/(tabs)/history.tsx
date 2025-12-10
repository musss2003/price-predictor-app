import {
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import {
    PredictionRecord,
    usePredictionHistory,
} from "../../hooks/use-prediction-history";

export default function HistoryScreen() {
  const { history, clearHistory } = usePredictionHistory();

  const renderItem = ({ item }: { item: PredictionRecord }) => {
    const date = new Date(item.createdAt);
    const formattedDate = date.toLocaleString();

    return (
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.price}>{item.price.toLocaleString()} KM</Text>
          <Text style={styles.date}>{formattedDate}</Text>
        </View>
        <Text style={styles.detail}>
          {item.input.city} • {item.input.m2} m² • Floor {item.input.floor} • {item.input.built}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>History</Text>
        {history.length > 0 && (
          <Pressable onPress={clearHistory}>
            <Text style={styles.clearText}>Clear</Text>
          </Pressable>
        )}
      </View>

      {history.length === 0 ? (
        <Text style={styles.empty}>No predictions yet. Make one on the Predict tab.</Text>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 16 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f8f9fa",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  clearText: {
    color: "#b91c1c",
    fontWeight: "600",
  },
  empty: {
    marginTop: 32,
    textAlign: "center",
    color: "#6b7280",
  },
  card: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  price: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
  },
  date: {
    fontSize: 12,
    color: "#6b7280",
  },
  detail: {
    fontSize: 14,
    color: "#4b5563",
    marginTop: 2,
  },
});
