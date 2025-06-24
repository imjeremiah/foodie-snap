## User Flow for FoodieSnap

This document outlines the user journey through the FoodieSnap application, from initial onboarding to interacting with the core features. The flow is designed around a central tab-based navigation model for clarity and ease of implementation.

---

### 1. Onboarding

The primary goal of onboarding is to personalize the AI co-pilot from the very beginning.

1.  **Welcome Screen**: User opens the app for the first time. A screen introduces the app's value proposition: an AI-powered food and fitness journey companion.
2.  **Authentication**: User signs up or logs in. Standard email/password and social sign-on options (Google, Apple) will be available.
3.  **Personalization (User Story #4)**:
    - **Fitness Goal**: User selects their primary fitness goal (e.g., "Muscle Gain," "Fat Loss," "Maintain Weight," "Clean Eating").
    - **Dietary Needs**: User selects dietary preferences or restrictions (e.g., "Vegetarian," "Vegan," "Gluten-Free," "Low-Carb").
    - **Content Style**: User selects their preferred tone for AI suggestions (e.g., "Inspirational," "Scientific," "Quick & Easy," "Humorous").
4.  **Permissions**: The app requests necessary permissions (Camera, Microphone, Notifications).
5.  **Completion**: Onboarding is complete. The user is directed to the main application interface, which opens on the Camera screen.

---

### 2. Main Application Navigation

The app uses a bottom tab bar for primary navigation between its core sections. The default view upon opening the app is the Camera.

The tab bar consists of five main sections:

- **Journal**: Access the Content Journal (Memories).
- **Chat**: View and manage conversations.
- **Camera**: The central tab for content creation.
- **Spotlight**: Discover content from the community.
- **Profile**: Manage personal profile and settings.

---

### 3. Core Feature Flows

#### a. The Camera & Content Creation (User Story #1)

1.  **Landing**: The user opens the app and lands on the Camera screen.
2.  **Capture**: The user can take a photo or record a short video of their meal.
3.  **"Scan-a-Snack" (User Story #3)**:
    - The user sees a "Scan" button on the camera interface.
    - Tapping this button activates a specialized scanning mode.
    - The user points the camera at an ingredient or a nutritional label.
    - The AI processes the image and returns an interactive "Story Card" with nutritional facts and a recipe suggestion. The user can then choose to share this card as a Snap or Story.
4.  **AI Co-Pilot (Post-Capture)**:
    - After capturing a photo/video, the user is taken to a preview screen.
    - On this screen, an "AI Caption" button is prominently displayed.
    - Tapping this button triggers the AI to analyze the image/video and generate three distinct caption or voice-over script options based on the user's pre-selected tone and goals.
    - The user can select one of the suggestions to apply to their Snap.
5.  **Creative Tools**: The user can add standard creative elements like text, stickers, and simple AR filters (e.g., frames, timestamps).
6.  **Sending**: The user taps the "Send To" button and can choose to send the Snap to:
    - One or more friends via Chat.
    - Their own Story.
    - The public Spotlight feed.

#### b. The Content Journal (User Story #5)

1.  **Access**: The user taps the "Journal" tab from the main navigation.
2.  **View**: The screen displays a grid of all the user's past Snaps and Stories, organized by date (similar to Snapchat Memories).
3.  **Functionality**:
    - This content serves as the historical knowledge base for the RAG model, allowing the AI to learn from the user's entire history of meals, recipes, and preferences.
    - Users can view, re-share, or delete old content.
    - The AI uses this data to refine suggestions for captions and future content prompts.

#### c. Proactive Idea & Prompt Generator (User Story #2)

1.  **Trigger**: This is a background feature, not directly initiated by the user.
2.  **Notification**: Once a week, the user receives a push notification: "Your weekly 'Content Spark' is here! 🔥"
3.  **Interaction**:
    - Tapping the notification opens a dedicated screen within the app.
    - This screen presents three personalized photo or video prompts based on the user's goals, past content, and trending topics within the health/fitness community. (e.g., "Show us your go-to high-protein breakfast!", "Create a quick video of your Sunday meal prep routine.").

#### d. The Feedback Loop (User Story #6)

1.  **Integration**: This feature is integrated directly into any AI-generated suggestion.
2.  **Interaction**:
    - Next to every AI-generated caption, prompt, or recipe suggestion, there are simple "thumbs-up" (👍) and "thumbs-down" (👎) icons.
    - The user can provide feedback with a single tap.
3.  **Impact**: This feedback is sent directly back to the RAG model to refine its understanding of the user's specific tastes and improve the quality of all future recommendations.

#### e. Chat & Friends

1.  **Access**: The user taps the "Chat" tab from the main navigation.
2.  **View**: The user sees a list of their recent conversations.
3.  **Interaction**:
    - Users can tap on a conversation to view messages and send new Snaps or texts.
    - Friends are managed through the Profile screen, where users can add new friends by username or from their contacts.
      .
