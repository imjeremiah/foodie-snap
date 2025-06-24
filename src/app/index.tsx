/**
 * @file Entry point for the FoodieSnap application.
 * Redirects to the camera screen as the default landing page.
 */

import { Redirect } from "expo-router";

export default function Index() {
  return <Redirect href="/(tabs)/camera" />;
}
