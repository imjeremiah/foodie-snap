/**
 * @file Profile screen - displays user profile and settings.
 * Currently a placeholder screen for Phase 1.
 */

import { View, Text } from "react-native";

export default function ProfileScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-xl font-semibold text-gray-900">Profile</Text>
      <Text className="mt-2 text-gray-600">Your profile and settings</Text>
    </View>
  );
}
