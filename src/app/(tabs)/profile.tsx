/**
 * @file Profile screen - displays user profile and settings.
 * Currently a placeholder screen for Phase 2.
 */

import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center px-4">
        <View className="rounded-lg border border-border bg-card p-6 shadow-lg">
          <Text className="text-center text-2xl font-bold text-foreground">
            Profile
          </Text>
          <Text className="mt-2 text-center text-lg text-muted-foreground">
            Your profile and settings
          </Text>
          <Text className="mt-4 text-center text-sm text-muted-foreground">
            Phase 2: Coming soon...
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
