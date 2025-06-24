/**
 * @file Camera screen - the central hub of the FoodieSnap application.
 * Currently displays a "Hello Gauntlet" message as a placeholder.
 */

import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CameraScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center px-4">
        <View className="rounded-lg border border-border bg-card p-6 shadow-lg">
          <Text className="text-center text-4xl font-bold text-foreground">
            Hello Gauntlet
          </Text>
          <Text className="mt-2 text-center text-lg text-muted-foreground">
            Welcome to FoodieSnap
          </Text>
          <View className="mt-4 rounded-md bg-primary p-3">
            <Text className="text-center font-semibold text-primary-foreground">
              NativeWind v4 is Working! 🎉
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
