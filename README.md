# FoodieSnap

_Share Moments. Discover More. Build Healthier Habits._

FoodieSnap is a next-generation, AI-first mobile application designed as a Snapchat clone but enhanced with cutting-edge Retrieval-Augmented Generation (RAG) capabilities. Our primary focus is on **"The Health-Conscious Meal Prepper,"** providing them with intelligent tools to document their fitness journey, create engaging content, and receive personalized AI assistance.

## ✨ Key Features

### 🔍 **Scan-a-Snack (NEW!)**
Point your camera at any food item or nutrition label and get instant AI-powered analysis including:
- **Nutrition Facts**: Detailed breakdown of calories, protein, carbs, fat, and more
- **Personalized Health Insights**: Tailored advice based on your fitness goals and dietary preferences  
- **Recipe Suggestions**: Creative ideas to incorporate the scanned food into your meal plan
- **Confidence Indicators**: Transparency about AI analysis accuracy

### 📸 **Smart Content Creation**
- **AI Caption Generation**: Get personalized caption suggestions for your food photos
- **Disappearing Messages**: Send snaps that automatically expire after viewing
- **Stories**: Share your journey with 24-hour stories
- **Content Journal**: Track your progress with an intelligent photo history

This project is built with a modular, scalable, and easy-to-understand codebase in mind. For a deep dive into our project's architecture, user flows, and rules, please see the `_docs` directory.

---

## Tech Stack

Our stack is carefully chosen to enable rapid development of a high-quality, AI-powered, cross-platform application.

- **Core**: React Native, Expo, TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Styling**: NativeWind (using Tailwind CSS syntax)
- **State Management**: Redux Toolkit (RTK)
- **AI & RAG**: OpenAI GPT-4, `pgvector`
- **Deployment**: EAS (for mobile) & Vercel (for web)

For detailed best practices and limitations for each technology, see `_docs/tech-stack.md`.

---

## Getting Started

1.  **Install dependencies**:
    ```bash
    npm install
    ```
2.  **Run the application**:
    ```bash
    npx expo start
    ```

3.  **Test the Nutrition Scan feature** (optional):
    ```bash
    npm run test:nutrition
    ```
    This will test the AI nutrition analysis with a sample food image to ensure everything is working correctly.

---

## Project Conventions

To ensure our codebase remains clean and consistent, we adhere to a strict set of rules.

- **Directory & File Naming**: All directories are `kebab-case`. Component files are `PascalCase.tsx`.
- **Documentation**: Every file must have a header comment explaining its purpose, and every function must have a TSDoc block.
- **Styling**: All styles are applied via NativeWind utility classes. Theme definitions are centralized in `tailwind.config.js`.
- **Git Workflow**: All work is done on feature branches (`feature/...`) and merged into `develop` via Pull Requests.

For the complete set of rules, including directory structure and PR guidelines, please review `_docs/project-rules.md`.
