/**
 * @file Redux auth slice for managing user authentication state.
 * Handles login, logout, and session state management.
 */

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User, Session } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean; // Track if auth state has been initialized
}

const initialState: AuthState = {
  user: null,
  session: null,
  loading: true,
  initialized: false,
};

/**
 * Auth slice managing user authentication state
 */
export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    /**
     * Set the current user session
     */
    setSession: (
      state,
      action: PayloadAction<{ user: User | null; session: Session | null }>
    ) => {
      state.user = action.payload.user;
      state.session = action.payload.session;
      state.loading = false;
      state.initialized = true;
    },
    /**
     * Set loading state for auth operations
     */
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    /**
     * Clear user session on logout
     */
    clearSession: (state) => {
      state.user = null;
      state.session = null;
      state.loading = false;
      state.initialized = true;
    },
  },
});

export const { setSession, setLoading, clearSession } = authSlice.actions;
export default authSlice.reducer; 