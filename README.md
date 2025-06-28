# FoodieSnap

_Share Moments. Discover More. Build Healthier Habits._

FoodieSnap is a next-generation, AI-first mobile application that combines social media functionality with intelligent nutrition tracking and personalized health insights. Built as an evolution of ephemeral messaging apps, FoodieSnap leverages cutting-edge Retrieval-Augmented Generation (RAG) capabilities to provide users with a sophisticated, personalized experience for documenting their fitness journey and building healthier habits.

## 🚀 **Key Features**

### 🧠 **AI-Powered Intelligence**
- **Smart Caption Generation**: Get personalized, context-aware caption suggestions that learn from your preferences and adapt to your unique style
- **Semantic Search**: Find similar meals and content using AI-powered similarity matching - search by ingredients, nutrition goals, or meal descriptions
- **Content Sparks**: Receive weekly personalized content prompts tailored to your fitness goals and dietary preferences
- **Learning AI**: Our system learns from your feedback to continuously improve suggestions and recommendations

### 🔍 **Scan-a-Snack**
Point your camera at any food item or nutrition label and get instant AI-powered analysis including:
- **Nutrition Facts**: Detailed breakdown of calories, protein, carbs, fat, fiber, sugar, and sodium
- **Personalized Health Insights**: Tailored advice based on your fitness goals, dietary restrictions, and activity level
- **Recipe Suggestions**: Creative ideas to incorporate the scanned food into your meal plan
- **Confidence Indicators**: Full transparency about AI analysis accuracy

### 📸 **Smart Content Creation & Social Features**
- **Disappearing Snaps**: Send photos and videos that automatically expire after viewing (1-60 seconds)
- **24-Hour Stories**: Share your daily journey with friends through ephemeral stories
- **Content Journal**: Intelligent photo history with semantic search, favorites, and folder organization
- **Real-time Messaging**: Group and individual chats with typing indicators and read receipts
- **Spotlight Feed**: Discover and share content with the broader FoodieSnap community

### 🎯 **Personalized Experience**
- **Comprehensive Onboarding**: Set up detailed nutrition preferences, fitness goals, and dietary restrictions
- **8 Demo User Personas**: Explore the app through diverse, realistic user profiles with varied fitness approaches
- **Adaptive AI**: System learns from your interactions to provide increasingly personalized recommendations
- **Progress Tracking**: Monitor your content creation streaks, social engagement, and nutrition insights

## 🤖 **How AI & RAG Work for You**

FoodieSnap's AI isn't just a gimmick—it's a personalized nutrition and content assistant that gets smarter the more you use it:

**For Content Creation:**
- Take a photo of your meal → AI analyzes the image and your preferences → Get 3 personalized caption options
- Each suggestion considers your fitness goals, dietary restrictions, past content, and preferred tone
- Provide feedback (👍/👎) and the AI learns your style for even better future suggestions

**For Nutrition Intelligence:**
- Scan any food or nutrition label → AI extracts nutritional data and provides personalized insights
- Get health recommendations based on your specific goals (muscle gain, fat loss, general health, etc.)
- Receive recipe ideas that align with your dietary preferences and cooking skill level

**For Content Discovery:**
- Search your journal with natural language: "high protein breakfast" or "post-workout meals"
- AI finds similar content using semantic understanding, not just keyword matching
- Discover meals that match your nutritional needs and preferences from your own history

**For Engagement:**
- Weekly "Content Sparks" provide personalized prompts for your next post
- AI considers your recent activity, successful content patterns, and current fitness goals
- Get suggestions ranging from easy 5-minute posts to more creative recipe showcases

## 🛠 **Tech Stack**

Our stack is carefully chosen to enable rapid development of a high-quality, AI-powered, cross-platform application:

- **Core**: React Native, Expo, TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **AI & Vector Search**: OpenAI GPT-4o-mini, pgvector (1536-dimension embeddings)
- **Styling**: NativeWind (Tailwind CSS syntax)
- **State Management**: Redux Toolkit Query (RTK Query)
- **Real-time**: Supabase Realtime subscriptions
- **Deployment**: EAS (mobile) & Vercel (web functions)

For detailed architecture decisions and technical documentation, see `_docs/tech-stack.md`.

## 🚀 **Getting Started**

### **Prerequisites**
- Node.js 18+ and npm
- Expo CLI installed globally

### **Quick Start**
1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run the application**:
   ```bash
   npx expo start
   ```

3. **Test AI features** (optional):
   ```bash
   # Test nutrition scanning
   npm run test:nutrition
   
   # Test content sparks generation
   npm run test:content-sparks
   
   # Deploy AI functions
   npm run functions:deploy
   ```

### **Demo Experience**
The app includes comprehensive demo data with 8 realistic user personas. After signing up, you can:
- Browse existing content from demo users (Alex, Sarah, Mike, Emma, David, Lisa, James, Maria)
- Try semantic search: "protein smoothie" or "meal prep"
- Experience AI caption generation with any food photo
- Scan nutrition labels using the camera scan mode
- Explore social features through existing conversations and stories

## 🧪 **Testing Strategy**

### **Current Testing**
- **Integration Tests**: Supabase functions and API endpoints (`test_*.js` files)
- **Manual Testing**: Comprehensive demo data enables full user journey testing
- **AI Function Testing**: Dedicated test scripts for nutrition scanning and content generation

### **Quality Assurance**
- **Database Integrity**: Utility functions for data validation and health checks
- **Real-time Subscriptions**: Connection management and cleanup testing
- **Error Boundaries**: Comprehensive error handling throughout the app
- **Performance**: RTK Query caching and optimization for smooth user experience

### **Future Testing Enhancements**
- Unit tests for utility functions and components
- E2E testing with Detox for critical user flows
- AI accuracy testing and feedback loop validation
- Performance benchmarking for large datasets

## 📁 **Project Structure**

```
foodie-snap/
├── src/
│   ├── app/           # Expo Router screens
│   ├── components/    # Reusable UI components
│   ├── contexts/      # React contexts (Auth)
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Utilities and configurations
│   ├── store/         # Redux store and slices
│   └── types/         # TypeScript type definitions
├── supabase/
│   ├── functions/     # Edge functions for AI processing
│   └── migrations/    # Database schema and demo data
└── _docs/             # Comprehensive documentation
```

## 📖 **Project Conventions**

To ensure our codebase remains clean, consistent, and AI-optimized:

- **File Organization**: Maximum 500 lines per file for AI compatibility
- **Documentation**: Every file has descriptive headers; all functions have JSDoc comments
- **Naming**: Directories use `kebab-case`, components use `PascalCase.tsx`
- **Styling**: NativeWind utility classes with centralized theme configuration
- **Code Style**: Functional programming patterns, descriptive variables with auxiliary verbs
- **AI Integration**: Modular functions with clear input/output contracts for AI processing

For complete development guidelines and architectural decisions, see `_docs/project-rules.md`.

## 🔗 **Documentation**

- **Project Overview**: `_docs/project_overview.md`
- **User Stories & Flows**: `_docs/user-flow.md`
- **Tech Stack Details**: `_docs/tech-stack.md`
- **UI/UX Guidelines**: `_docs/ui-rules.md` and `_docs/theme-rules.md`
