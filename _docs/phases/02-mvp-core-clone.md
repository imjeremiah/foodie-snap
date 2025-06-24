# Phase 2: MVP - Core Clone Functionality

**Goal:** To build a minimal, usable version of the application with the core social features integrated. This phase delivers a functional product that mirrors Snapchat's essential experience but without the advanced AI capabilities.

---

### Key Deliverables

- A fully navigable app with a tab bar and placeholder screens.
- Functional user authentication (Sign Up/In) integrated with Supabase.
- A working camera for taking photos and a basic content preview screen.
- The foundational UI for the friend and chat systems.
- A Redux store to manage user sessions and global state.

---

### Features & Tasks

#### 1. Tab Navigation & Screen Structure

- **Description:** Implement the main tab bar navigation defined in our `user-flow.md`.
- **Step 1:** Use Expo Router to implement the five-tab layout: Journal, Chat, Camera, Spotlight, Profile.
- **Step 2:** Create placeholder components for each screen to confirm navigation works.
- **Step 3:** Set the central Camera tab as the default, initial screen.
- **Step 4:** Implement the root layout to wrap all screens with necessary providers (e.g., Redux Provider).

#### 2. User Authentication

- **Description:** Integrate Supabase Auth to manage user accounts.
- **Step 1:** Set up the Supabase client and store API keys in environment variables.
- **Step 2:** Build the UI for Sign Up and Sign In screens.
- **Step 3:** Implement the logic to call Supabase Auth functions for email/password authentication.
- **Step 4:** Use a custom hook (`use-session`) and Redux to manage the user's session globally, protecting routes and redirecting users based on their auth state.

#### 3. Basic Camera & Preview Flow

- **Description:** Create a simple content creation flow, allowing users to take a picture and preview it.
- **Step 1:** Integrate `expo-camera` into the Camera screen.
- **Step 2:** Add a capture button to take a photo.
- **Step 3:** Upon capture, navigate to a new "Preview" screen, passing the image URI as a parameter.
- **Step 4:** On the Preview screen, display the captured image and add UI for "Send" and "Discard" actions (no logic yet).

#### 4. Friends & Chat UI Foundation

- **Description:** Build the static UI for the social features. This involves no real-time data, only the visual structure.
- **Step 1:** Create the database schema in Supabase for `profiles` and `friends` tables.
- **Step 2:** On the Profile screen, build the UI to display a user's profile information and a list of their friends.
- **Step 3:** On the Chat screen, build the UI to display a static list of conversations.
- **Step 4:** Create a separate screen for a single chat thread, building the UI for chat bubbles and a text input field.
