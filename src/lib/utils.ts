/**
 * @file Utility functions for FoodieSnap application.
 * Contains helper functions for database management, formatting, and common operations.
 */

import { supabase } from "./supabase";

/**
 * Format a timestamp for display in the UI
 * @param timestamp - ISO timestamp string
 * @returns Formatted time string (e.g., "2m", "1h", "3d")
 */
export function formatTimeAgo(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) {
    return "now";
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h`;
  } else {
    return `${diffInDays}d`;
  }
}

/**
 * Check if demo data exists in the database
 * @returns Promise<boolean> - True if demo data exists
 */
export async function checkDemoDataExists(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .like("email", "%demo.foodiesnap.com")
      .limit(1);

    if (error) {
      console.error("Error checking demo data:", error);
      return false;
    }

    return (data?.length || 0) > 0;
  } catch (error) {
    console.error("Error checking demo data:", error);
    return false;
  }
}

/**
 * Execute the database seed script to populate demo data
 * Note: This requires the seed.sql file to be executed in Supabase dashboard
 * @returns Promise<{ success: boolean, message: string }>
 */
export async function seedDemoData(): Promise<{ success: boolean; message: string }> {
  try {
    // Check if demo data already exists
    const exists = await checkDemoDataExists();
    if (exists) {
      return {
        success: true,
        message: "Demo data already exists in the database"
      };
    }

    return {
      success: false,
      message: "Please run the seed.sql script in your Supabase dashboard to populate demo data"
    };
  } catch (error) {
    console.error("Error seeding demo data:", error);
    return {
      success: false,
      message: `Error seeding demo data: ${error}`
    };
  }
}

/**
 * Reset demo data using the Supabase function
 * @returns Promise<{ success: boolean, message: string }>
 */
export async function resetDemoData(): Promise<{ success: boolean; message: string }> {
  try {
    const { error } = await supabase.rpc("reset_demo_data");
    
    if (error) {
      return {
        success: false,
        message: `Error resetting demo data: ${error.message}`
      };
    }

    return {
      success: true,
      message: "Demo data has been reset. Please re-run the seed script to repopulate."
    };
  } catch (error) {
    console.error("Error resetting demo data:", error);
    return {
      success: false,
      message: `Error resetting demo data: ${error}`
    };
  }
}

/**
 * Get current user profile info for debugging
 * @returns Promise with user profile data
 */
export async function getCurrentUserDebugInfo() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { user: null, profile: null, error: "No authenticated user" };
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    return {
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      },
      profile,
      error: error?.message || null
    };
  } catch (error) {
    return {
      user: null,
      profile: null,
      error: String(error)
    };
  }
}

/**
 * Generate initials from a display name
 * @param name - Display name
 * @returns Initials (max 2 characters)
 */
export function getInitials(name?: string | null): string {
  if (!name) return "?";
  
  return name
    .split(" ")
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");
} 