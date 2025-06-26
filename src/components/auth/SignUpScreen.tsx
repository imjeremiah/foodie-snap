/**
 * @file Sign Up screen component for user registration.
 * Provides email/password registration form with validation and error handling.
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
import { useAuth } from "../../contexts/AuthContext";

interface SignUpScreenProps {
  onSwitchToSignIn: () => void;
}

/**
 * Sign Up screen component
 * @param onSwitchToSignIn - Callback to switch to sign in mode
 */
export default function SignUpScreen({ onSwitchToSignIn }: SignUpScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { signUp, loading } = useAuth();

  /**
   * Handle sign up form submission
   */
  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    const { error } = await signUp(email, password);
    
    if (error) {
      Alert.alert("Sign Up Error", (error as any)?.message || "An error occurred");
    } else {
      Alert.alert(
        "Success", 
        "Account created successfully! Please check your email for verification."
      );
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
              Join FoodieSnap
            </Text>
            <Text className="mb-8 text-center text-lg text-muted-foreground">
              Create your account to get started
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
                  placeholder="Create a password (min. 6 characters)"
                  placeholderTextColor="hsl(var(--muted-foreground))"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete="new-password"
                />
              </View>

              <View>
                <Text className="mb-2 text-sm font-medium text-foreground">
                  Confirm Password
                </Text>
                <TextInput
                  className="rounded-md border border-border bg-background px-3 py-3 text-foreground"
                  placeholder="Confirm your password"
                  placeholderTextColor="hsl(var(--muted-foreground))"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoComplete="new-password"
                />
              </View>

              <TouchableOpacity
                className={`mt-6 rounded-md py-3 px-4 ${
                  loading ? "bg-muted" : "bg-primary"
                }`}
                onPress={handleSignUp}
                disabled={loading}
              >
                <Text className="text-center font-semibold text-primary-foreground">
                  {loading ? "Creating Account..." : "Sign Up"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="mt-4 py-2"
                onPress={onSwitchToSignIn}
              >
                <Text className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Text className="font-semibold text-primary">Sign In</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
} 