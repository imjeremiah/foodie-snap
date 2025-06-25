# Phase 3: RAG-Enhanced MVP

**Goal:** To transform the functional clone into the first **RAG-first social platform** by implementing true retrieval-augmented generation capabilities with domain-specific nutrition expertise. This phase delivers on the core project vision of intelligent content creation that revolutionizes user experience beyond traditional social platforms.

---

### Key Deliverables

- **True RAG Pipeline**: pgvector integration with semantic content retrieval and embedding generation
- **Nutrition Knowledge Engine**: USDA FoodData Central integration for authoritative food and nutrition intelligence
- **Performance-Optimized AI**: Sub-3 second response times for all RAG-generated content
- **Smart Caption Engine**: Context-aware caption generation using user history and preferences
- **Enhanced Onboarding**: Nutrition-focused user preference capture for personalized AI experience
- **Comprehensive Analytics**: Success metrics tracking and feedback loop optimization

---

### Features & Tasks

#### 1. Enhanced User Preferences & Onboarding (User Story #4)

- **Description:** Implement nutrition-focused onboarding that captures user preferences for deeply personalized RAG experiences.
- **Step 1:** Create comprehensive onboarding UI screens for:
  - Primary fitness goals (muscle gain, fat loss, clean eating, maintenance)
  - Dietary restrictions and allergies (vegetarian, vegan, gluten-free, keto, etc.)
  - Preferred content style (inspirational, scientific, quick & easy, humorous)
  - Meal timing preferences and cooking skill level
- **Step 2:** Expand the `profiles` table with nutrition-specific fields and save preferences to Supabase
- **Step 3:** Create user preference analytics dashboard for monitoring completion rates

#### 2. Smart Caption Engine with RAG Pipeline (User Story #1)

- **Description:** Implement true retrieval-augmented generation for personalized caption suggestions using user history and preferences.
- **Step 1:** Set up pgvector extension in Supabase and create embeddings table for user content
- **Step 2:** Create Supabase Edge Function (`generate-smart-captions`) that:
  - Performs semantic search on user's past content using pgvector
  - Retrieves relevant context from user's journal history
  - Combines user preferences, retrieved context, and current image in OpenAI prompt
  - Generates 3 distinct, personalized caption options
- **Step 3:** Implement embedding generation pipeline for new content (asynchronous)
- **Step 4:** Add caption selection UI on preview screen with immediate application
- **Performance Target:** Sub-3 second response time for caption generation

#### 3. Nutrition Knowledge Engine & Scan-a-Snack (User Story #3)

- **Description:** Integrate authoritative nutrition knowledge base for intelligent food analysis and recommendations.
- **Step 1:** Research and integrate USDA FoodData Central API for nutrition database access
- **Step 2:** Create Supabase Edge Function (`scan-nutrition-label`) that:
  - Uses OpenAI Vision API for ingredient/label recognition
  - Cross-references with USDA database for accurate nutrition data
  - Generates personalized recipe suggestions based on user dietary preferences
  - Provides macro/micro nutrient analysis with confidence scoring
- **Step 3:** Design and implement "Nutrition Card" UI component with:
  - Key nutritional facts display
  - Personalized health insights
  - Recipe suggestions with dietary compatibility
  - Confidence indicators for AI-generated information
- **Step 4:** Integrate scan mode in camera with nutrition card sharing capability
- **Performance Target:** Complete scan-to-insight flow in under 5 seconds

#### 4. Learning Feedback Loop & Analytics (User Story #6)

- **Description:** Implement comprehensive feedback collection and analytics system for continuous RAG improvement.
- **Step 1:** Create enhanced `ai_feedback` table with detailed interaction tracking:
  - Suggestion type (caption, nutrition, recipe)
  - User rating (thumbs up/down + confidence level)
  - Context metadata (time, dietary preferences, content type)
  - Follow-up actions (editing, sharing, saving)
- **Step 2:** Add contextual feedback UI throughout the app:
  - Thumbs up/down on all AI suggestions
  - "Why this suggestion?" explanation interface
  - Optional feedback comments for detailed insights
- **Step 3:** Create analytics dashboard for tracking:
  - Suggestion acceptance rates by user segment
  - Improvement trends over time
  - Content quality metrics
- **Step 4:** Implement feedback integration into RAG pipeline for personalization improvement
- **Performance Target:** Feedback submission completes in under 1 second

#### 5. Content Journal with Semantic Indexing (User Story #5)

- **Description:** Transform content journal into intelligent knowledge base with semantic search capabilities.
- **Step 1:** Enhance existing journal functionality with:
  - Automatic content categorization (meal type, dietary pattern, nutrition focus)
  - Metadata extraction (ingredients, cooking method, meal timing)
  - Smart tagging based on nutrition content
- **Step 2:** Implement real-time embedding generation for all saved content
- **Step 3:** Create semantic search interface within journal:
  - Search by ingredients, nutrition goals, or dietary preferences
  - "Find similar meals" functionality
  - Progress tracking with AI-generated insights
- **Step 4:** Integrate journal insights into caption generation pipeline
- **Performance Target:** Journal search results in under 2 seconds

---

### Technical Requirements

#### **RAG Architecture:**
- **Vector Database**: pgvector on Supabase with HNSW indexing for optimal performance
- **Embedding Strategy**: Generate embeddings for all user content (text + image metadata)
- **Retrieval System**: Hybrid search combining semantic similarity with nutrition-specific keyword matching
- **Generation Pipeline**: Context-aware prompts with user preferences, retrieved content, and domain knowledge

#### **Performance Standards:**
- **Caption Generation**: < 3 seconds end-to-end
- **Nutrition Scanning**: < 5 seconds scan-to-insight
- **Semantic Search**: < 2 seconds for journal queries
- **Embedding Generation**: Asynchronous, non-blocking user experience

#### **Data Integration:**
- **USDA FoodData Central**: Authoritative nutrition database for food analysis
- **OpenAI APIs**: GPT-4 for generation, Vision API for image analysis
- **User Context**: Preferences, dietary restrictions, past content, and feedback history

#### **Success Metrics Framework:**
- **Personalization**: Demonstrable improvement in suggestion relevance over time
- **Performance**: All RAG features maintain sub-3 second response times

---

### Success Criteria

- **True RAG Implementation**: Semantic retrieval from user content history integrated into all AI suggestions
- **Domain Expertise**: Nutrition knowledge base providing authoritative food and health insights
- **Performance Excellence**: All AI features respond within performance targets
- **Measurable Personalization**: Analytics demonstrate improving suggestion quality over time
- **User Adoption**: High engagement with AI features and positive feedback trends
- **Technical Foundation**: Robust pgvector pipeline ready for advanced features in Phase 4
