# FoodieSnap

_Share Moments. Discover More. Build Healthier Habits._

FoodieSnap is a next-generation, AI-first mobile application designed as a Snapchat clone but enhanced with cutting-edge Retrieval-Augmented Generation (RAG) capabilities. Our primary focus is on **"The Health-Conscious Meal Prepper,"** providing them with intelligent tools to document their fitness journey, create engaging content, and receive personalized AI assistance.

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

---

## Project Conventions

To ensure our codebase remains clean and consistent, we adhere to a strict set of rules.

- **Directory & File Naming**: All directories are `kebab-case`. Component files are `PascalCase.tsx`.
- **Documentation**: Every file must have a header comment explaining its purpose, and every function must have a TSDoc block.
- **Styling**: All styles are applied via NativeWind utility classes. Theme definitions are centralized in `tailwind.config.js`.
- **Git Workflow**: All work is done on feature branches (`feature/...`) and merged into `develop` via Pull Requests.

For the complete set of rules, including directory structure and PR guidelines, please review `_docs/project-rules.md`.
