/**
 * @file Spotlight screen - displays public content feed and discovery.
 * Currently a placeholder screen for Phase 1.
 */

import { View, Text } from "react-native";

export default function SpotlightScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-xl font-semibold text-gray-900">Spotlight</Text>
      <Text className="mt-2 text-gray-600">Discover content</Text>
    </View>
  );
}
