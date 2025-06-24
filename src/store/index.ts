/**
 * @file Main Redux store configuration for FoodieSnap.
 * Combines all feature slices into a single root reducer and configures the store.
 */

import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/auth-slice";

/**
 * Main Redux store instance
 */
export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these field paths in all actions
        ignoredActionsPaths: ["payload.session", "payload.user"],
        // Ignore these paths in the state
        ignoredPaths: ["auth.session", "auth.user"],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 