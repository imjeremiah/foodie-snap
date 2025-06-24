/**
 * @file Profile screen - displays user profile and settings.
 * Shows user information, friends list, and account actions.
 */

import { View, Text, TouchableOpacity, Alert, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useSession } from "../../hooks/use-session";
import { 
  useGetCurrentProfileQuery, 
  useGetFriendsQuery,
  useAcceptFriendRequestMutation 
} from "../../store/slices/api-slice";

export default function ProfileScreen() {
  const { user, signOut, loading } = useSession();
  const { data: profile } = useGetCurrentProfileQuery();
  const { data: friends = [], isLoading: friendsLoading } = useGetFriendsQuery();
  const [acceptFriendRequest] = useAcceptFriendRequestMutation();

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
  const handleFriendAction = async (friend: any, action: string) => {
    if (action === "Accept" && friend.is_incoming_request && friend.status === "pending") {
      try {
        await acceptFriendRequest({ id: friend.id }).unwrap();
        Alert.alert("Success", `${friend.friend?.display_name} is now your friend!`);
      } catch (error) {
        Alert.alert("Error", "Failed to accept friend request");
      }
    } else {
      Alert.alert(
        `${action} Friend`,
        `${action} ${friend.friend?.display_name || friend.display_name} will be implemented in the next phase!`
      );
    }
  };

  /**
   * Render friend item
   */
  const renderFriendItem = (friend: any) => (
    <View key={friend.id} className="flex-row items-center rounded-lg border border-border bg-card p-4">
      {/* Avatar */}
      <View className="h-12 w-12 items-center justify-center rounded-full bg-primary">
        <Text className="text-lg font-bold text-primary-foreground">
          {friend.friend?.display_name?.charAt(0) || "?"}
        </Text>
      </View>

      {/* Friend info */}
      <View className="ml-3 flex-1">
        <Text className="font-semibold text-foreground">
          {friend.friend?.display_name || "Unknown User"}
        </Text>
        <Text className="text-sm text-muted-foreground">
          {friend.friend?.email || "Unknown email"}
        </Text>
        {friend.status === "pending" && (
          <Text className="text-xs text-orange-500 font-medium">
            {friend.is_incoming_request ? "Wants to be friends" : "Friend request pending"}
          </Text>
        )}
      </View>

      {/* Action button */}
      <TouchableOpacity
        className={`rounded-md px-3 py-2 ${
          (friend.status === "pending" && friend.is_incoming_request) ? "bg-orange-500" : "bg-primary"
        }`}
        onPress={() => handleFriendAction(
          friend, 
          (friend.status === "pending" && friend.is_incoming_request) ? "Accept" : "Message"
        )}
      >
        <Text className="text-sm font-medium text-white">
          {(friend.status === "pending" && friend.is_incoming_request) ? "Accept" : "Message"}
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
                {profile?.display_name || user?.email?.split("@")[0] || "User"}
              </Text>
              <Text className="text-sm text-muted-foreground">
                {profile?.email || user?.email}
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
              {profile?.bio || "Welcome to FoodieSnap! Share your healthy journey with friends 💪"}
            </Text>
          </View>

          {/* Stats */}
          <View className="mt-4 flex-row justify-around border-t border-border pt-4">
            <View className="items-center">
              <Text className="text-lg font-bold text-foreground">0</Text>
              <Text className="text-xs text-muted-foreground">Snaps</Text>
            </View>
            <View className="items-center">
              <Text className="text-lg font-bold text-foreground">
                {friendsLoading ? "..." : friends.filter(f => f.status === 'accepted').length}
              </Text>
              <Text className="text-xs text-muted-foreground">Friends</Text>
            </View>
            <View className="items-center">
              <Text className="text-lg font-bold text-foreground">0</Text>
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
            {friendsLoading ? (
              <View className="rounded-lg border border-border bg-card p-4">
                <Text className="text-center text-muted-foreground">Loading friends...</Text>
              </View>
            ) : friends.length > 0 ? (
              friends.map(renderFriendItem)
            ) : (
              <View className="rounded-lg border border-border bg-card p-4">
                <Text className="text-center text-muted-foreground">
                  No friends yet. Add some friends to get started!
                </Text>
              </View>
            )}
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
