/**
 * @file Root layout for the FoodieSnap application using Expo Router.
 * This file configures global providers, fonts, and the initial app structure.
 */

import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Provider } from "react-redux";
import { store } from "../store";
import { AuthProvider } from "../contexts/AuthContext";
import AuthWrapper from "../components/auth/AuthWrapper";

export default function RootLayout() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <StatusBar style="auto" />
        <AuthWrapper>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen 
              name="preview" 
              options={{ 
                presentation: "modal",
                gestureEnabled: true 
              }} 
            />
            <Stack.Screen 
              name="chat/[id]" 
              options={{ 
                presentation: "card",
                gestureEnabled: true 
              }} 
            />
            <Stack.Screen 
              name="edit-profile" 
              options={{ 
                presentation: "modal",
                gestureEnabled: true 
              }} 
            />
            <Stack.Screen 
              name="privacy-settings" 
              options={{ 
                presentation: "card",
                gestureEnabled: true 
              }} 
            />
            <Stack.Screen 
              name="onboarding" 
              options={{ 
                presentation: "fullScreenModal",
                gestureEnabled: false 
              }} 
            />
          </Stack>
        </AuthWrapper>
      </AuthProvider>
    </Provider>
  );
}
