# Phase 4: Polishing & Advanced Features

**Goal:** To enhance the RAG-enabled MVP with advanced features, real-time capabilities, and a thorough design polish. This phase focuses on creating a delightful and truly intelligent user experience.

---

### Key Deliverables

- A fully functional, real-time chat system.
- Implementation of Stories and a public Spotlight feed.
- Proactive weekly content prompts delivered via push notifications.
- A fully operational RAG pipeline that uses the Content Journal for personalization.
- A polished UI that implements the full theme, including light/dark modes.

---

### Features & Tasks

#### 1. Real-Time Chat System

- **Description:** Transform the static chat UI into a fully functional, real-time messaging experience.
- **Step 1:** Integrate Supabase Realtime to subscribe to database changes in the `messages` table.
- **Step 2:** Implement the logic to send and receive messages in real-time within a chat thread.
- **Step 3:** Update the main Chat screen to show real-time previews of the latest messages.
- **Step 4:** (Optional) Add advanced features like typing indicators or online presence.

#### 2. Implement Stories & Spotlight

- **Description:** Build out the ephemeral Stories feature and the public content discovery feed.
- **Step 1:** Add logic to the "Send" flow to allow posting to a user's Story.
- **Step 2:** Create a "Stories" component to display friends' stories at the top of the Spotlight screen. Stories should automatically delete or become hidden after 24 hours.
- **Step 3:** Implement the main Spotlight feed, which displays public posts from all users.
- **Step 4:** Add basic filtering or sorting to the Spotlight feed (e.g., by most recent).

#### 3. Proactive Idea & Prompt Generator (User Story #2)

- **Description:** Implement the weekly "Content Spark" feature to proactively engage users.
- **Step 1:** Create a new Supabase Edge Function scheduled to run weekly (using a cron job).
- **Step 2:** The function will query for users and generate three personalized content prompts based on their goals and recent journal entries.
- **Step 3:** Integrate `expo-notifications` to allow users to opt-in to and receive push notifications.
- **Step 4:** The scheduled function will trigger a push notification to each user with their personalized "Content Spark."

#### 4. Full RAG Pipeline with Personalization

- **Description:** Enhance the AI Co-Pilot to use the user's Content Journal for deeply personalized suggestions.
- **Step 1:** Set up `pgvector` on the `posts` table and generate embeddings for all existing content. Create an asynchronous function to embed new content as it's created.
- **Step 2:** Create a `HNSW` index on the vector column to ensure fast queries.
- **Step 3:** Modify the `generate-caption` Edge Function to first perform a similarity search on the user's past posts.
- **Step 4:** Include the retrieved context (examples of past successful posts) in the prompt sent to OpenAI, instructing it to match the user's style.

#### 5. Full UI/UX Polish

- **Description:** Conduct a comprehensive review of the application against our design system and add a final layer of polish.
- **Step 1:** Implement the full color palette from `theme-rules.md`, including support for both Light and Dark modes.
- **Step 2:** Integrate custom fonts (e.g., Inter) throughout the application.
- **Step 3:** Review every screen for adherence to the `ui-rules.md`, fixing any layout, spacing, or hierarchy issues.
- **Step 4:** Add subtle, meaningful animations and transitions to enhance the user experience.
