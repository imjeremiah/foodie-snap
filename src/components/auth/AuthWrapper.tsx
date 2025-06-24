/**
 * @file Authentication wrapper component.
 * Manages authentication state and displays either auth screens or the main app.
 */

import React, { useState } from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSession } from "../../hooks/use-session";
import SignInScreen from "./SignInScreen";
import SignUpScreen from "./SignUpScreen";

interface AuthWrapperProps {
  children: React.ReactNode;
}

/**
 * Authentication wrapper component
 * @param children - The main app content to show when authenticated
 */
export default function AuthWrapper({ children }: AuthWrapperProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const { user, loading, initialized } = useSession();

  /**
   * Show loading screen while initializing auth state
   */
  if (!initialized || loading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center">
          <View className="rounded-lg border border-border bg-card p-6 shadow-lg">
            <Text className="text-center text-xl font-semibold text-foreground">
              Loading...
            </Text>
            <Text className="mt-2 text-center text-muted-foreground">
              Initializing FoodieSnap
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  /**
   * Show auth screens if user is not authenticated
   */
  if (!user) {
    if (isSignUp) {
      return (
        <SignUpScreen onSwitchToSignIn={() => setIsSignUp(false)} />
      );
    } else {
      return (
        <SignInScreen onSwitchToSignUp={() => setIsSignUp(true)} />
      );
    }
  }

  /**
   * Show main app content if user is authenticated
   */
  return <>{children}</>;
} 