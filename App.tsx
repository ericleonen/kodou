import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import * as Location from "expo-location";

export default function App() {
  const [tracking, setTracking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Holds the active subscription so we can stop it when tracking is toggled off.
  const subscription = useRef<Location.LocationSubscription | null>(null);

  async function startTracking() {
    setBusy(true);
    setError(null);

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setError("Location permission was denied.");
      setBusy(false);
      return;
    }

    subscription.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        // Emit on a time cadence (~1 Hz). distanceInterval must be 0,
        // otherwise updates are suppressed until you move that many
        // meters — which reads as "frozen" when standing still.
        timeInterval: 1000,
        distanceInterval: 0,
      },
      (next) => setLocation(next)
    );

    setTracking(true);
    setBusy(false);
  }

  function stopTracking() {
    subscription.current?.remove();
    subscription.current = null;
    setTracking(false);
  }

  function toggle() {
    if (tracking) {
      stopTracking();
    } else {
      startTracking();
    }
  }

  // Clean up the subscription if the component unmounts while tracking.
  useEffect(() => {
    return () => subscription.current?.remove();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <Text style={styles.title}>Kodou</Text>
      <Text style={styles.subtitle}>
        {tracking ? "Tracking your location" : "Location off"}
      </Text>

      <View style={styles.readout}>
        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : location ? (
          <>
            <Row label="Latitude" value={location.coords.latitude.toFixed(6)} />
            <Row label="Longitude" value={location.coords.longitude.toFixed(6)} />
            <Row
              label="Accuracy"
              value={`${(location.coords.accuracy ?? 0).toFixed(1)} m`}
            />
            <Row
              label="Speed"
              value={`${Math.max(location.coords.speed ?? 0, 0).toFixed(2)} m/s`}
            />
          </>
        ) : (
          <Text style={styles.placeholder}>
            No fixes yet. Toggle tracking on to start.
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={[styles.button, tracking && styles.buttonActive]}
        onPress={toggle}
        disabled={busy}
        activeOpacity={0.85}
      >
        {busy ? (
          <ActivityIndicator color="#0b0b0f" />
        ) : (
          <Text style={styles.buttonText}>
            {tracking ? "Stop tracking" : "Start tracking"}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0b0f",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    color: "#ffffff",
    fontSize: 40,
    fontWeight: "800",
    letterSpacing: 1,
  },
  subtitle: {
    color: "#8a8a94",
    fontSize: 16,
    marginTop: 4,
    marginBottom: 32,
  },
  readout: {
    width: "100%",
    backgroundColor: "#16161d",
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    minHeight: 160,
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  rowLabel: {
    color: "#8a8a94",
    fontSize: 15,
  },
  rowValue: {
    color: "#ffffff",
    fontSize: 15,
    fontVariant: ["tabular-nums"],
  },
  placeholder: {
    color: "#8a8a94",
    fontSize: 15,
    textAlign: "center",
  },
  error: {
    color: "#ff6b6b",
    fontSize: 15,
    textAlign: "center",
  },
  button: {
    width: "100%",
    backgroundColor: "#ffffff",
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: "center",
  },
  buttonActive: {
    backgroundColor: "#ff5a5f",
  },
  buttonText: {
    color: "#0b0b0f",
    fontSize: 17,
    fontWeight: "700",
  },
});
