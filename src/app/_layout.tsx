/**
 * @file Root layout for the FoodieSnap application using Expo Router.
 * This file configures global providers, fonts, and the initial app structure.
 */

import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Provider } from "react-redux";
import { store } from "../store";
import AuthWrapper from "../components/auth/AuthWrapper";

export default function RootLayout() {
  return (
    <Provider store={store}>
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
        </Stack>
      </AuthWrapper>
    </Provider>
  );
}
