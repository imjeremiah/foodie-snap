/**
 * @file Custom hook for managing user session state.
 * Provides authentication state and methods for sign in, sign up, and sign out.
 * Integrates with real-time subscriptions for live data updates.
 */

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { supabase } from "../lib/supabase";
import { setSession, clearSession, setLoading } from "../store/slices/auth-slice";
import { RootState, AppDispatch } from "../store";
import { 
  initializeRealTimeSubscriptions, 
  cleanupRealTimeSubscriptions 
} from "../lib/realtime";

/**
 * Custom hook for managing user authentication state with real-time subscriptions
 * @returns Object containing auth state and methods
 */
export function useSession() {
  const dispatch = useDispatch<AppDispatch>();
  const { user, session, loading, initialized } = useSelector(
    (state: RootState) => state.auth
  );

  useEffect(() => {
    let isMounted = true;
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      
      dispatch(setSession({ user: session?.user ?? null, session }));
      
      // Initialize real-time subscriptions if user is authenticated
      if (session?.user) {
        initializeRealTimeSubscriptions();
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      
      console.log("Auth state changed:", event);
      
      if (event === "SIGNED_IN" && session?.user) {
        dispatch(setSession({ user: session.user, session }));
        // Initialize real-time subscriptions on sign in
        initializeRealTimeSubscriptions();
      } else if (event === "SIGNED_OUT") {
        dispatch(clearSession());
        // Clean up real-time subscriptions on sign out
        cleanupRealTimeSubscriptions();
      } else if (event === "INITIAL_SESSION") {
        // Handle initial session without re-initializing subscriptions
        dispatch(setSession({ user: session?.user ?? null, session }));
      } else {
        dispatch(setSession({ user: session?.user ?? null, session }));
      }
    });

    // Cleanup subscriptions when component unmounts
    return () => {
      isMounted = false;
      subscription.unsubscribe();
      cleanupRealTimeSubscriptions();
    };
  }, []); // Remove dispatch dependency to prevent multiple listeners

  /**
   * Sign in with email and password
   * @param email - User's email address
   * @param password - User's password
   * @returns Promise with auth result
   */
  const signIn = async (email: string, password: string) => {
    dispatch(setLoading(true));
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    } finally {
      dispatch(setLoading(false));
    }
  };

  /**
   * Sign up with email and password
   * @param email - User's email address
   * @param password - User's password
   * @returns Promise with auth result
   */
  const signUp = async (email: string, password: string) => {
    dispatch(setLoading(true));
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    } finally {
      dispatch(setLoading(false));
    }
  };

  /**
   * Sign out the current user
   * @returns Promise with auth result
   */
  const signOut = async () => {
    dispatch(setLoading(true));
    try {
      // Clean up real-time subscriptions before signing out
      cleanupRealTimeSubscriptions();
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      dispatch(clearSession());
      return { error: null };
    } catch (error) {
      return { error };
    } finally {
      dispatch(setLoading(false));
    }
  };

  return {
    user,
    session,
    loading,
    initialized,
    signIn,
    signUp,
    signOut,
  };
} 