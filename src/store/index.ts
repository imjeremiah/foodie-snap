/**
 * @file Main Redux store configuration for FoodieSnap.
 * Combines all feature slices into a single root reducer and configures the store with RTK Query.
 */

import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/auth-slice";
import { apiSlice } from "./slices/api-slice";

/**
 * Main Redux store instance with RTK Query middleware
 */
export const store = configureStore({
  reducer: {
    auth: authReducer,
    api: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these field paths in all actions
        ignoredActionsPaths: [
          "payload.session", 
          "payload.user",
          "payload.timestamp",
          "meta.arg",
          "meta.baseQueryMeta"
        ],
        // Ignore these paths in the state
        ignoredPaths: [
          "auth.session", 
          "auth.user",
          "api"
        ],
      },
    }).concat(apiSlice.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 