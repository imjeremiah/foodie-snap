/**
 * @file Profile screen - displays user profile and settings.
 * Shows user information, friends list, and account actions.
 */

import { View, Text, TouchableOpacity, Alert, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSession } from "../../hooks/use-session";
import { 
  useGetCurrentProfileQuery, 
  useGetFriendsQuery,
  useAcceptFriendRequestMutation,
  useRejectFriendRequestMutation,
  useRemoveFriendMutation,
  useBlockUserMutation
} from "../../store/slices/api-slice";

export default function ProfileScreen() {
  const { user, signOut, loading } = useSession();
  const { data: profile } = useGetCurrentProfileQuery();
  const { data: friends = [], isLoading: friendsLoading } = useGetFriendsQuery();
  const [acceptFriendRequest] = useAcceptFriendRequestMutation();
  const [rejectFriendRequest] = useRejectFriendRequestMutation();
  const [removeFriend] = useRemoveFriendMutation();
  const [blockUser] = useBlockUserMutation();

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
    try {
      switch (action) {
        case "Accept":
          if (friend.is_incoming_request && friend.status === "pending") {
            await acceptFriendRequest({ id: friend.id }).unwrap();
            Alert.alert("Success", `${friend.friend?.display_name} is now your friend!`);
          }
          break;
        case "Reject":
          if (friend.is_incoming_request && friend.status === "pending") {
            Alert.alert(
              "Reject Friend Request",
              `Are you sure you want to reject ${friend.friend?.display_name}'s friend request?`,
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Reject",
                  style: "destructive",
                  onPress: async () => {
                    await rejectFriendRequest({ id: friend.id }).unwrap();
                    Alert.alert("Success", "Friend request rejected");
                  }
                }
              ]
            );
          }
          break;
        case "Remove":
          if (friend.status === "accepted") {
            Alert.alert(
              "Remove Friend",
              `Are you sure you want to remove ${friend.friend?.display_name} as a friend?`,
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Remove",
                  style: "destructive",
                  onPress: async () => {
                    await removeFriend({ friend_id: friend.friend_id }).unwrap();
                    Alert.alert("Success", `${friend.friend?.display_name} has been removed from your friends`);
                  }
                }
              ]
            );
          }
          break;
        case "Block":
          Alert.alert(
            "Block User",
            `Are you sure you want to block ${friend.friend?.display_name}?`,
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Block",
                style: "destructive",
                onPress: async () => {
                  await blockUser({ friend_id: friend.friend_id }).unwrap();
                  Alert.alert("Success", `${friend.friend?.display_name} has been blocked`);
                }
              }
            ]
          );
          break;
        case "Message":
          // Navigate to chat with this friend
          router.push(`/chat/${friend.friend_id}`);
          break;
        default:
          break;
      }
    } catch (error) {
      Alert.alert("Error", "Failed to perform action. Please try again.");
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

      {/* Action buttons */}
      <View className="flex-row items-center space-x-2">
        {/* Accept/Reject buttons for incoming requests */}
        {friend.status === "pending" && friend.is_incoming_request && (
          <>
            <TouchableOpacity
              className="rounded-md bg-red-500 px-2 py-1"
              onPress={() => handleFriendAction(friend, "Reject")}
            >
              <Text className="text-xs font-medium text-white">Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="rounded-md bg-green-500 px-3 py-1"
              onPress={() => handleFriendAction(friend, "Accept")}
            >
              <Text className="text-xs font-medium text-white">Accept</Text>
            </TouchableOpacity>
          </>
        )}
        
        {/* Message button for accepted friends */}
        {friend.status === "accepted" && (
          <>
            <TouchableOpacity
              className="rounded-md bg-primary px-3 py-1"
              onPress={() => handleFriendAction(friend, "Message")}
            >
              <Text className="text-xs font-medium text-primary-foreground">Message</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="rounded-md bg-muted p-1"
              onPress={() => {
                Alert.alert(
                  "Friend Options",
                  `Choose an action for ${friend.friend?.display_name}`,
                  [
                    { text: "Cancel", style: "cancel" },
                    { text: "Remove Friend", onPress: () => handleFriendAction(friend, "Remove") },
                    { text: "Block", style: "destructive", onPress: () => handleFriendAction(friend, "Block") }
                  ]
                );
              }}
            >
              <Ionicons name="ellipsis-horizontal" size={16} color="gray" />
            </TouchableOpacity>
          </>
        )}
        
        {/* Pending outgoing request */}
        {friend.status === "pending" && !friend.is_incoming_request && (
          <TouchableOpacity className="rounded-md bg-muted px-3 py-1" disabled>
            <Text className="text-xs font-medium text-muted-foreground">Pending</Text>
          </TouchableOpacity>
        )}
      </View>
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
            <TouchableOpacity 
              className="rounded-md bg-primary px-3 py-2"
              onPress={() => router.push("/friends/search")}
            >
              <View className="flex-row items-center space-x-1">
                <Ionicons name="person-add" size={16} color="white" />
                <Text className="text-sm font-medium text-primary-foreground">
                  Add Friend
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <View className="space-y-3">
            {friendsLoading ? (
              <View className="rounded-lg border border-border bg-card p-4">
                <Text className="text-center text-muted-foreground">Loading friends...</Text>
              </View>
            ) : (
              <>
                {/* Incoming Friend Requests */}
                {friends.filter(f => f.status === 'pending' && f.is_incoming_request).length > 0 && (
                  <View className="rounded-lg border border-border bg-card">
                    <View className="border-b border-border p-3">
                      <Text className="font-semibold text-foreground">Friend Requests</Text>
                    </View>
                    {friends.filter(f => f.status === 'pending' && f.is_incoming_request).map(renderFriendItem)}
                  </View>
                )}

                {/* Current Friends */}
                {friends.filter(f => f.status === 'accepted').length > 0 && (
                  <View className="rounded-lg border border-border bg-card">
                    <View className="border-b border-border p-3">
                      <Text className="font-semibold text-foreground">
                        Friends ({friends.filter(f => f.status === 'accepted').length})
                      </Text>
                    </View>
                    {friends.filter(f => f.status === 'accepted').map(renderFriendItem)}
                  </View>
                )}

                {/* Outgoing Friend Requests */}
                {friends.filter(f => f.status === 'pending' && !f.is_incoming_request).length > 0 && (
                  <View className="rounded-lg border border-border bg-card">
                    <View className="border-b border-border p-3">
                      <Text className="font-semibold text-foreground">Sent Requests</Text>
                    </View>
                    {friends.filter(f => f.status === 'pending' && !f.is_incoming_request).map(renderFriendItem)}
                  </View>
                )}

                {/* Empty State */}
                {friends.length === 0 && (
                  <View className="rounded-lg border border-border bg-card p-4">
                    <Text className="text-center text-muted-foreground">
                      No friends yet. Add some friends to get started!
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        </View>

        {/* Account Actions */}
        <View className="mb-8 space-y-3">
          <TouchableOpacity className="flex-row items-center rounded-lg border border-border bg-card p-4">
            <Ionicons name="pencil-outline" size={20} color="gray" />
            <Text className="ml-3 font-medium text-foreground">Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            className="flex-row items-center rounded-lg border border-border bg-card p-4"
            onPress={() => router.push("/friends/privacy")}
          >
            <Ionicons name="shield-outline" size={20} color="gray" />
            <Text className="ml-3 font-medium text-foreground">Privacy Settings</Text>
            <View className="flex-1" />
            <Ionicons name="chevron-forward" size={16} color="gray" />
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
