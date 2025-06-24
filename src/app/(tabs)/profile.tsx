/**
 * @file Profile screen - displays user profile and settings.
 * Currently a placeholder screen for Phase 2 with sign out functionality.
 */

import { View, Text, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSession } from "../../hooks/use-session";

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
          
          {user && (
            <View className="mt-6">
              <Text className="text-center text-sm text-muted-foreground">
                Signed in as:
              </Text>
              <Text className="mt-1 text-center font-semibold text-foreground">
                {user.email}
              </Text>
            </View>
          )}

          <TouchableOpacity
            className={`mt-6 rounded-md py-3 px-4 ${
              loading ? "bg-muted" : "bg-destructive"
            }`}
            onPress={handleSignOut}
            disabled={loading}
          >
            <Text className="text-center font-semibold text-destructive-foreground">
              {loading ? "Signing Out..." : "Sign Out"}
            </Text>
          </TouchableOpacity>

          <Text className="mt-4 text-center text-sm text-muted-foreground">
            Phase 2: Authentication complete!
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
