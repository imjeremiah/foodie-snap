/**
 * @file Camera screen - the central hub of the FoodieSnap application.
 * Currently displays a "Hello Gauntlet" message as a placeholder.
 */

import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CameraScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Hello Gauntlet</Text>
        <Text style={styles.subtitle}>Welcome to FoodieSnap</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#111827",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    color: "#6b7280",
    marginTop: 8,
    textAlign: "center",
  },
});
