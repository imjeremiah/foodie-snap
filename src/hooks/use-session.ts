/**
 * @file Custom hook for managing user session state.
 * Provides authentication state and methods for sign in, sign up, and sign out.
 */

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { supabase } from "../lib/supabase";
import { setSession, clearSession, setLoading } from "../store/slices/auth-slice";
import { RootState, AppDispatch } from "../store";

/**
 * Custom hook for managing user authentication state
 * @returns Object containing auth state and methods
 */
export function useSession() {
  const dispatch = useDispatch<AppDispatch>();
  const { user, session, loading, initialized } = useSelector(
    (state: RootState) => state.auth
  );

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      dispatch(setSession({ user: session?.user ?? null, session }));
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      dispatch(setSession({ user: session?.user ?? null, session }));
    });

    return () => subscription.unsubscribe();
  }, [dispatch]);

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