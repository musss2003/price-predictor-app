import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { usePredictionHistory } from "../../hooks/use-prediction-history";

export default function HomeScreen() {
  const [city, setCity] = useState("Sarajevo");
  const [m2, setM2] = useState("");
  const [floor, setFloor] = useState("");
  const [year, setYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [price, setPrice] = useState<number | null>(null);
  const [error, setError] = useState("");

  const { addRecord } = usePredictionHistory();

  const predictPrice = async () => {
    if (!m2 || !floor || !year) {
      setError("Please fill in all fields");
      return;
    }

    setError("");
    setLoading(true);
    setPrice(null);

    try {
      const response = await fetch("http://localhost:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city,
          m2: Number(m2),
          floor: Number(floor),
          built: Number(year),
        }),
      });

      const data = await response.json();
      if (typeof data.price !== "number") {
        throw new Error("Invalid response from server");
      }

      setPrice(data.price);

      // ✅ Save to prediction history
      addRecord(
        {
          city,
          m2: Number(m2),
          floor: Number(floor),
          built: Number(year),
        },
        data.price
      );
    } catch (err) {
      console.error(err);
      setError("Failed to fetch prediction");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.title}>🏠 Price Predictor</Text>

      <TextInput
        style={styles.input}
        value={city}
        onChangeText={setCity}
        placeholder="City"
      />

      <TextInput
        style={styles.input}
        value={m2}
        onChangeText={setM2}
        placeholder="Square meters"
        keyboardType="numeric"
      />

      <TextInput
        style={styles.input}
        value={floor}
        onChangeText={setFloor}
        placeholder="Floor"
        keyboardType="numeric"
      />

      <TextInput
        style={styles.input}
        value={year}
        onChangeText={setYear}
        placeholder="Built year"
        keyboardType="numeric"
      />

      <Pressable style={styles.button} onPress={predictPrice}>
        <Text style={styles.buttonText}>Predict Price</Text>
      </Pressable>

      {loading && <ActivityIndicator size="large" style={{ marginTop: 20 }} />}

      {error !== "" && <Text style={styles.error}>{error}</Text>}

      {price !== null && (
        <View style={styles.resultBox}>
          <Text style={styles.resultLabel}>Predicted Price</Text>
          <Text style={styles.resultValue}>{price.toLocaleString()} KM</Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: "#f8f9fa",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 32,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 10,
    marginBottom: 14,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#2563eb",
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
    fontWeight: "600",
  },
  error: {
    marginTop: 16,
    color: "red",
    textAlign: "center",
  },
  resultBox: {
    marginTop: 30,
    padding: 20,
    borderRadius: 14,
    backgroundColor: "#e0f2fe",
    alignItems: "center",
  },
  resultLabel: {
    fontSize: 16,
    color: "#0369a1",
  },
  resultValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0c4a6e",
    marginTop: 6,
  },
});
