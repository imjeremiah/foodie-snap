/**
 * @file AuthContext - Centralized authentication state management.
 * Replaces multiple useSession hook instances to prevent infinite auth loops.
 * Fixes the infinite loop crash issue by providing a single auth listener for the entire app.
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { 
  initializeRealTimeSubscriptions, 
  cleanupRealTimeSubscriptions 
} from '../lib/realtime';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signUp: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    initialized: false,
  });

  useEffect(() => {
    let mounted = true;
    let authListenerSetup = false;
    
    console.log('🔐 AuthProvider: Initializing single auth listener');

    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.error('❌ AuthProvider: Initial session error:', error);
        }
        
        console.log('🔐 AuthProvider: Initial session loaded:', session ? 'SIGNED_IN' : 'NO_SESSION');
        
        setAuthState({
          user: session?.user ?? null,
          session: session,
          loading: false,
          initialized: true,
        });

        // Initialize real-time subscriptions if user is authenticated
        if (session?.user) {
          console.log('📡 AuthProvider: Initializing subscriptions for authenticated user');
          initializeRealTimeSubscriptions();
        }
      } catch (error) {
        console.error('❌ AuthProvider: Failed to initialize auth:', error);
        if (mounted) {
          setAuthState({
            user: null,
            session: null,
            loading: false,
            initialized: true,
          });
        }
      }
    };

    // Set up single auth listener for entire app
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (!mounted || !authListenerSetup) return;

        console.log('🔐 AuthProvider: Auth state change:', event);

        // Handle different auth events
        switch (event) {
          case 'SIGNED_IN':
            console.log('✅ AuthProvider: User signed in');
            setAuthState({
              user: session?.user ?? null,
              session: session,
              loading: false,
              initialized: true,
            });
            // Initialize real-time subscriptions
            if (session?.user) {
              console.log('📡 AuthProvider: Initializing subscriptions after sign in');
              initializeRealTimeSubscriptions();
            }
            break;

          case 'SIGNED_OUT':
            console.log('👋 AuthProvider: User signed out');
            // Clean up subscriptions first
            cleanupRealTimeSubscriptions();
            setAuthState({
              user: null,
              session: null,
              loading: false,
              initialized: true,
            });
            break;

          case 'TOKEN_REFRESHED':
            console.log('🔄 AuthProvider: Token refreshed');
            setAuthState(prev => ({
              ...prev,
              user: session?.user ?? null,
              session: session,
            }));
            break;

          case 'INITIAL_SESSION':
            // Skip INITIAL_SESSION to prevent loops - handled by initializeAuth
            console.log('⏭️ AuthProvider: Skipping INITIAL_SESSION event');
            break;

          default:
            console.log('🔐 AuthProvider: Other auth event:', event);
            setAuthState(prev => ({
              ...prev,
              user: session?.user ?? null,
              session: session,
              loading: false,
              initialized: true,
            }));
        }
      }
    );

    // Mark auth listener as set up
    authListenerSetup = true;
    
    // Initialize auth state
    initializeAuth();

    // Cleanup function
    return () => {
      console.log('🧹 AuthProvider: Cleaning up auth listener');
      mounted = false;
      subscription.unsubscribe();
      cleanupRealTimeSubscriptions();
    };
  }, []); // No dependencies to prevent re-initialization

  /**
   * Sign in with email and password
   */
  const signIn = async (email: string, password: string) => {
    console.log('🔐 AuthProvider: Signing in user');
    setAuthState(prev => ({ ...prev, loading: true }));
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      console.log('✅ AuthProvider: Sign in successful');
      return { data, error: null };
    } catch (error) {
      console.error('❌ AuthProvider: Sign in failed:', error);
      return { data: null, error };
    } finally {
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  };

  /**
   * Sign up with email and password
   */
  const signUp = async (email: string, password: string) => {
    console.log('🔐 AuthProvider: Signing up user');
    setAuthState(prev => ({ ...prev, loading: true }));
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) throw error;
      
      console.log('✅ AuthProvider: Sign up successful');
      return { data, error: null };
    } catch (error) {
      console.error('❌ AuthProvider: Sign up failed:', error);
      return { data: null, error };
    } finally {
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  };

  /**
   * Sign out the current user
   */
  const signOut = async () => {
    console.log('🔐 AuthProvider: Signing out user');
    setAuthState(prev => ({ ...prev, loading: true }));
    
    try {
      // Clean up real-time subscriptions before signing out
      console.log('🧹 AuthProvider: Cleaning up subscriptions before sign out');
      cleanupRealTimeSubscriptions();
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      console.log('✅ AuthProvider: Sign out successful');
      return { error: null };
    } catch (error) {
      console.error('❌ AuthProvider: Sign out failed:', error);
      return { error };
    } finally {
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  };

  const contextValue: AuthContextType = {
    ...authState,
    signIn,
    signUp,
    signOut,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook to use the auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

/**
 * Legacy hook for backward compatibility
 * @deprecated Use useAuth instead
 */
export function useSession() {
  console.warn('⚠️ useSession is deprecated. Use useAuth instead to prevent auth loops.');
  return useAuth();
} 