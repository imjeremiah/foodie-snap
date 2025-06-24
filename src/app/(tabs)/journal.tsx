/**
 * @file Journal screen - displays user's content history for RAG personalization.
 * Currently a placeholder screen for Phase 1.
 */

import { View, Text } from "react-native";

export default function JournalScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-xl font-semibold text-gray-900">Journal</Text>
      <Text className="mt-2 text-gray-600">Your content history</Text>
    </View>
  );
}
