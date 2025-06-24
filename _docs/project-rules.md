# FoodieSnap Project Rules & Conventions

This document defines the official guidelines for the FoodieSnap project. Adherence to these rules is mandatory to ensure the codebase remains modular, scalable, maintainable, and easy for both humans and AI tools to understand.

---

### 1. Guiding Philosophy

As outlined in `project_overview.md`, we are building an **AI-first codebase**. This means every decision should prioritize:

- **Modularity**: Features should be self-contained where possible.
- **Scalability**: The architecture must support future growth.
- **Clarity**: Code should be self-documenting, well-organized, and easy to navigate.

---

### 2. Directory Structure

Our project will follow a standardized, feature-centric directory structure.

```
/
├── _docs/                # All project documentation (.md files)
├── assets/               # Static assets (fonts, images, icons)
│   ├── fonts/
│   └── images/
├── src/                  # Main source code
│   ├── app/              # Screens & layouts (using Expo Router)
│   │   ├── (tabs)/       # Layout for the main tab navigation
│   │   │   ├── _layout.tsx # Tab navigator configuration
│   │   │   ├── journal.tsx # Journal screen
│   │   │   ├── chat.tsx    # Chat screen
│   │   │   ├── camera.tsx  # Camera screen (default)
│   │   │   ├── spotlight.tsx # Spotlight screen
│   │   │   └── profile.tsx # Profile screen
│   │   ├── _layout.tsx     # Root layout (fonts, providers)
│   │   └── index.tsx       # Entry point, redirects to camera
│   ├── components/         # Reusable React components
│   │   ├── common/         # Project-specific components (e.g., RecipeCard)
│   │   └── ui/             # Generic, unstyled components (e.g., Button, Card)
│   ├── constants/          # App-wide constants (theme, styles, etc.)
│   ├── store/              # Redux Toolkit state management
│   │   ├── slices/         # Feature-based state slices
│   │   └── index.ts        # Store configuration
│   ├── lib/                # Utility functions & external services
│   │   ├── supabase.ts     # Supabase client setup
│   │   └── utils.ts        # General utility functions
│   ├── hooks/              # Custom React hooks
│   └── types/              # Global TypeScript types and interfaces
└── tailwind.config.js    # NativeWind configuration
```

---

### 3. File & Component Conventions

#### Naming

- **Directories**: `kebab-case` (e.g., `src/components`, `src/store/slices`).
- **Components & Screens**: `PascalCase.tsx` (e.g., `src/components/common/RecipeCard.tsx`).
- **Hooks**: `use-kebab-case.ts` (e.g., `src/hooks/use-user-profile.ts`).
- **All other files**: `kebab-case.ts` (e.g., `src/lib/utils.ts`).

#### Structure & Documentation

- **File Header Comment**: Every `.ts` and `.tsx` file must begin with a block comment explaining its purpose and contents.
  ```typescript
  /**
   * @file This file contains the main configuration for the Redux store.
   * It combines all the feature slices into a single root reducer.
   */
  ```
- **Function Documentation**: Every function must have a TSDoc block comment explaining its purpose, parameters, and return value.
  ```typescript
  /**
   * Fetches a user's profile from the database.
   * @param userId - The unique identifier for the user.
   * @returns A promise that resolves to the user's profile object, or null if not found.
   */
  ```
- **Component Structure**: Keep component logic, styling, and JSX in a single file unless the component becomes overly complex.

#### Size Limitation

- **500 Line Limit**: No file should exceed 500 lines. This is a hard limit to enforce modularity and readability. If a file approaches this limit, it is a clear indicator that it needs to be refactored and broken down into smaller, more focused modules.

---

### 4. Coding & Styling Conventions

- **Language**: **TypeScript** is mandatory for all code.
- **Linter & Formatter**: We will use **ESLint** and **Prettier** to enforce a consistent code style automatically. Configurations will be committed to the repository.
- **Styling**: All styling must be done using **NativeWind** utility classes.
  - Define all theme values (colors, fonts, spacing) in `tailwind.config.js` as per `theme-rules.md`.
  - For complex, reusable styled elements, create abstracted components using NativeWind's `styled()` HOC.
- **Database Naming**: All database tables and columns must use `snake_case` as defined in `tech-stack.md`.

---

### 5. Git & Pull Request Workflow

- **Branching**:
  - `main`: Production-ready code. Direct pushes are forbidden.
  - `develop`: The base branch for all new features.
  - **Feature Branches**: `feature/<feature-name>` (e.g., `feature/user-onboarding`).
  - **Fix Branches**: `fix/<bug-name>` (e.g., `fix/login-button-crash`).
  - **Chore Branches**: `chore/<task-name>` (e.g., `chore/update-dependencies`).
- **Pull Requests (PRs)**:
  - All code must be merged into `develop` via a pull request.
  - PRs must be reviewed and approved by at least one other team member.
  - The PR description must clearly explain the "what" and "why" of the changes.
  - All CI checks (linting, testing) must pass before a PR can be merged.
