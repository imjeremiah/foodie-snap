# Phase 3: RAG-Enhanced MVP

**Goal:** To integrate the core AI-powered user stories into the application. This phase transforms the functional clone into an intelligent content creation tool by delivering on the primary RAG-based value propositions.

---

### Key Deliverables

- A personalized onboarding flow that captures user preferences.
- A functional "Content Journal" that saves user content to Supabase.
- The "AI Co-Pilot" for generating captions on the content preview screen.
- The "Scan-a-Snack" feature with its "Bento Box" UI.
- The user feedback mechanism (thumbs-up/down) for all AI suggestions.

---

### Features & Tasks

#### 1. Personalized Onboarding (User Story #4)

- **Description:** Implement the multi-step onboarding flow for new users to personalize their AI experience from the start.
- **Step 1:** Create the UI screens for selecting fitness goals, dietary needs, and preferred content style.
- **Step 2:** Upon completion, save these preferences to the user's `profiles` table in Supabase.
- **Step 3:** Ensure the onboarding flow only appears once for new users after they sign up.

#### 2. The Content Journal (User Story #5)

- **Description:** Allow users to save their created content, providing the historical data needed for the RAG model.
- **Step 1:** Create a `posts` table in the Supabase database to store metadata about each photo/video.
- **Step 2:** In the content preview flow, implement the "Send" logic to upload the image to Supabase Storage.
- **Step 3:** After a successful upload, create a new record in the `posts` table linking to the storage object.
- **Step 4:** On the Journal screen, fetch and display all the user's posts in a grid layout.

#### 3. AI-Powered Content Co-Pilot (User Story #1)

- **Description:** Provide users with AI-generated caption suggestions for their content.
- **Step 1:** Create a new Supabase Edge Function (`generate-caption`).
- **Step 2:** This function will take an image prompt and user preferences, then call the OpenAI GPT-4 API.
- **Step 3:** On the content preview screen, add an "AI Caption" button that invokes the Edge Function.
- **Step 4:** Display the three returned caption suggestions in a clean, selectable UI.

#### 4. "Scan-a-Snack" Knowledge Assistant (User Story #3)

- **Description:** Allow users to scan nutritional labels to get AI-powered insights.
- **Step 1:** Implement the "Scan Mode" button and UI overlay on the Camera screen.
- **Step 2:** Create a new Supabase Edge Function (`scan-snack`) that receives an image and uses the OpenAI Vision API.
- **Step 3:** Design and implement the "Bento Box" UI component to render the structured response (nutritional facts, recipe).
- **Step 4:** Integrate the full flow: tap scan, capture label, call function, display results in the Bento Box UI.

#### 5. The Feedback Loop (User Story #6)

- **Description:** Implement the mechanism for users to provide feedback on AI suggestions.
- **Step 1:** Create a `feedback` table in the Supabase database.
- **Step 2:** Add thumbs-up/down UI elements next to every AI-generated suggestion (captions, scan results).
- **Step 3:** When a user provides feedback, create a new record in the `feedback` table, storing the suggestion and the user's rating.
