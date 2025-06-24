/**
 * @file Profile screen - displays user profile and settings.
 * Shows user information, friends list, and account actions.
 */

import { View, Text, TouchableOpacity, Alert, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useSession } from "../../hooks/use-session";

// Mock friends data for UI demonstration
const mockFriends = [
  {
    id: "1",
    display_name: "Alex Chen",
    email: "alex@example.com",
    avatar_url: null,
    status: "accepted" as const,
  },
  {
    id: "2", 
    display_name: "Sarah Johnson",
    email: "sarah@example.com",
    avatar_url: null,
    status: "accepted" as const,
  },
  {
    id: "3",
    display_name: "Mike Rodriguez",
    email: "mike@example.com", 
    avatar_url: null,
    status: "pending" as const,
  },
  {
    id: "4",
    display_name: "Emma Wilson",
    email: "emma@example.com",
    avatar_url: null,
    status: "accepted" as const,
  },
];

export default function ProfileScreen() {
  const { user, signOut, loading } = useSession();

  /**
   * Handle sign out with confirmation
   */
  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Sign Out", 
          style: "destructive",
          onPress: async () => {
            const { error } = await signOut();
            if (error) {
              Alert.alert("Error", "Failed to sign out");
            }
          }
        },
      ]
    );
  };

  /**
   * Handle friend request action
   */
  const handleFriendAction = (friendName: string, action: string) => {
    Alert.alert(
      `${action} Friend`,
      `${action} ${friendName} will be implemented in the next phase!`
    );
  };

  /**
   * Render friend item
   */
  const renderFriendItem = (friend: typeof mockFriends[0]) => (
    <View key={friend.id} className="flex-row items-center rounded-lg border border-border bg-card p-4">
      {/* Avatar */}
      <View className="h-12 w-12 items-center justify-center rounded-full bg-primary">
        <Text className="text-lg font-bold text-primary-foreground">
          {friend.display_name?.charAt(0) || "?"}
        </Text>
      </View>

      {/* Friend info */}
      <View className="ml-3 flex-1">
        <Text className="font-semibold text-foreground">
          {friend.display_name || "Unknown User"}
        </Text>
        <Text className="text-sm text-muted-foreground">
          {friend.email}
        </Text>
        {friend.status === "pending" && (
          <Text className="text-xs text-orange-500 font-medium">
            Friend request pending
          </Text>
        )}
      </View>

      {/* Action button */}
      <TouchableOpacity
        className={`rounded-md px-3 py-2 ${
          friend.status === "pending" ? "bg-orange-500" : "bg-primary"
        }`}
        onPress={() => handleFriendAction(
          friend.display_name || "User", 
          friend.status === "pending" ? "Accept" : "Message"
        )}
      >
        <Text className="text-sm font-medium text-white">
          {friend.status === "pending" ? "Accept" : "Message"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-4">
        {/* Header */}
        <View className="flex-row items-center justify-between py-4">
          <Text className="text-2xl font-bold text-foreground">Profile</Text>
          <TouchableOpacity className="h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Ionicons name="settings-outline" size={20} color="gray" />
          </TouchableOpacity>
        </View>

        {/* User Profile Card */}
        <View className="mb-6 rounded-lg border border-border bg-card p-6 shadow-lg">
          {/* Avatar and basic info */}
          <View className="flex-row items-center">
            <View className="h-20 w-20 items-center justify-center rounded-full bg-primary">
              <Text className="text-2xl font-bold text-primary-foreground">
                {user?.email?.charAt(0).toUpperCase() || "?"}
              </Text>
            </View>
            
            <View className="ml-4 flex-1">
              <Text className="text-xl font-bold text-foreground">
                {user?.email?.split("@")[0] || "User"}
              </Text>
              <Text className="text-sm text-muted-foreground">
                {user?.email}
              </Text>
              <View className="mt-2 flex-row">
                <View className="rounded-full bg-primary/10 px-3 py-1">
                  <Text className="text-xs font-medium text-primary">
                    Health Enthusiast 🥗
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Bio section */}
          <View className="mt-4">
            <Text className="text-sm text-muted-foreground">
              "Documenting my fitness journey one meal at a time! 💪 Love sharing healthy recipes and workout tips."
            </Text>
          </View>

          {/* Stats */}
          <View className="mt-4 flex-row justify-around border-t border-border pt-4">
            <View className="items-center">
              <Text className="text-lg font-bold text-foreground">12</Text>
              <Text className="text-xs text-muted-foreground">Snaps</Text>
            </View>
            <View className="items-center">
              <Text className="text-lg font-bold text-foreground">{mockFriends.filter(f => f.status === 'accepted').length}</Text>
              <Text className="text-xs text-muted-foreground">Friends</Text>
            </View>
            <View className="items-center">
              <Text className="text-lg font-bold text-foreground">3</Text>
              <Text className="text-xs text-muted-foreground">Streak</Text>
            </View>
          </View>
        </View>

        {/* Friends Section */}
        <View className="mb-6">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-lg font-bold text-foreground">Friends</Text>
            <TouchableOpacity className="rounded-md bg-primary px-3 py-2">
              <Text className="text-sm font-medium text-primary-foreground">
                Add Friend
              </Text>
            </TouchableOpacity>
          </View>

          <View className="space-y-3">
            {mockFriends.map(renderFriendItem)}
          </View>
        </View>

        {/* Account Actions */}
        <View className="mb-8 space-y-3">
          <TouchableOpacity className="flex-row items-center rounded-lg border border-border bg-card p-4">
            <Ionicons name="pencil-outline" size={20} color="gray" />
            <Text className="ml-3 font-medium text-foreground">Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center rounded-lg border border-border bg-card p-4">
            <Ionicons name="shield-outline" size={20} color="gray" />
            <Text className="ml-3 font-medium text-foreground">Privacy Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-row items-center rounded-lg border border-destructive bg-destructive/10 p-4 ${
              loading ? "opacity-50" : ""
            }`}
            onPress={handleSignOut}
            disabled={loading}
          >
            <Ionicons name="log-out-outline" size={20} color="#dc2626" />
            <Text className="ml-3 font-medium text-destructive">
              {loading ? "Signing Out..." : "Sign Out"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
