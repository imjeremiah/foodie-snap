/**
 * @file Sign In screen component for user authentication.
 * Provides email/password login form with validation and error handling.
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSession } from "../../hooks/use-session";

interface SignInScreenProps {
  onSwitchToSignUp: () => void;
}

/**
 * Sign In screen component
 * @param onSwitchToSignUp - Callback to switch to sign up mode
 */
export default function SignInScreen({ onSwitchToSignUp }: SignInScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signIn, loading } = useSession();

  /**
   * Handle sign in form submission
   */
  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    const { error } = await signIn(email, password);
    
    if (error) {
      Alert.alert("Sign In Error", (error as any)?.message || "An error occurred");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 justify-center px-6">
          <View className="rounded-lg border border-border bg-card p-6 shadow-lg">
            <Text className="mb-6 text-center text-3xl font-bold text-foreground">
              Welcome Back
            </Text>
            <Text className="mb-8 text-center text-lg text-muted-foreground">
              Sign in to continue to FoodieSnap
            </Text>

            <View className="space-y-4">
              <View>
                <Text className="mb-2 text-sm font-medium text-foreground">
                  Email
                </Text>
                <TextInput
                  className="rounded-md border border-border bg-background px-3 py-3 text-foreground"
                  placeholder="Enter your email"
                  placeholderTextColor="hsl(var(--muted-foreground))"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>

              <View>
                <Text className="mb-2 text-sm font-medium text-foreground">
                  Password
                </Text>
                <TextInput
                  className="rounded-md border border-border bg-background px-3 py-3 text-foreground"
                  placeholder="Enter your password"
                  placeholderTextColor="hsl(var(--muted-foreground))"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete="password"
                />
              </View>

              <TouchableOpacity
                className={`mt-6 rounded-md py-3 px-4 ${
                  loading ? "bg-muted" : "bg-primary"
                }`}
                onPress={handleSignIn}
                disabled={loading}
              >
                <Text className="text-center font-semibold text-primary-foreground">
                  {loading ? "Signing In..." : "Sign In"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="mt-4 py-2"
                onPress={onSwitchToSignUp}
              >
                <Text className="text-center text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <Text className="font-semibold text-primary">Sign Up</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
} 
 