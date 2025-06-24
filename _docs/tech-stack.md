# FoodieSnap Technology Stack

This document outlines the complete technology stack for the FoodieSnap project. It serves as a technical charter, defining not only the technologies we use but also the best practices, conventions, and limitations for each. Adhering to these guidelines is crucial for building a scalable, maintainable, and high-quality application.

---

### 1. Core Framework: React Native & Expo

- **Technology**: React Native with Expo
- **Rationale**: As recommended in the `project_overview.md`, this combination allows for rapid cross-platform (iOS and Android) development from a single codebase. Expo, in particular, simplifies the build process and provides a robust ecosystem of tools and libraries that accelerate development.

#### Best Practices & Conventions

- **Project Structure**: Organize the codebase into logical directories: `src/screens`, `src/components`, `src/navigation`, `src/store`, `src/hooks`, `src/lib`, etc.
- **Functional Components**: Exclusively use functional components with React Hooks. Avoid class-based components.
- **TypeScript**: Use TypeScript for all new code to ensure type safety and improve developer experience.
- **Performance**: For all lists of data (feeds, chat, etc.), use `FlashList` from Shopify for optimal performance and memory usage, falling back to `FlatList` only if necessary.
- **Native APIs**: Leverage Expo's modules (e.g., `expo-camera`, `expo-notifications`, `expo-av`) for accessing native device features whenever possible.
- **Builds & Updates**: Use Expo Application Services (EAS) for all builds, submissions, and over-the-air (OTA) updates.

#### Limitations & Pitfalls

- **Expo Go vs. Dev Client**: The default Expo Go app cannot run projects with custom native code. We must use a custom Development Client early on to accommodate any libraries that require it.
- **Bundle Size**: Be mindful of the app's final bundle size. Unused libraries should be removed, and assets (especially images) must be optimized.
- **Performance Bottlenecks**: Be vigilant about what causes re-renders. Use `React.memo` for components and `useCallback` for functions to prevent unnecessary render cycles, especially in complex screens.

---

### 2. Backend Platform: Supabase

- **Technology**: Supabase
- **Rationale**: Supabase provides a complete BaaS solution (Postgres, Auth, Storage, Edge Functions) that lets us build a scalable backend without managing infrastructure.

#### Best Practices & Conventions

- **Security First**: Row Level Security (RLS) must be enabled on **every** table. Policies should be restrictive by default. This is our primary defense for user data.
- **Database Design**: Use `snake_case` for all table and column names. Utilize database views (`CREATE VIEW`) for complex read operations and functions (`CREATE FUNCTION`) for reusable logic (e.g., running a search on `pgvector`).
- **Migrations**: All database schema changes must be managed through Supabase's migration system. Avoid making changes directly through the UI in production.
- **Client Interaction**: Use the official `supabase-js` library for all client-side interaction. Keep API keys in environment variables. **Never** expose the `service_role` key on the client.

#### Limitations & Pitfalls

- **RLS Complexity**: Forgetting to enable RLS or writing incorrect policies is the most common and dangerous pitfall. Every PR that touches the database schema must have its RLS policies reviewed.
- **Cold Starts**: Supabase Edge Functions can have "cold starts," which may introduce a minor delay on the first invocation. Design the UI to handle this initial loading state gracefully.
- **Resource Management**: Monitor resource usage on the Supabase dashboard to stay within the limits of our chosen plan.

---

### 3. Styling: NativeWind

- **Technology**: NativeWind (v4)
- **Rationale**: We chose NativeWind to leverage the power and utility-first methodology of Tailwind CSS, enabling us to build a clean, modern, and consistent UI with high development velocity.

#### Best Practices & Conventions

- **Configuration**: Define all design system tokens (colors, spacing, font sizes) in `tailwind.config.js`. This is the single source of truth for styling.
- **Component Abstraction**: For complex or frequently reused elements (like buttons or input fields), abstract the styles away by creating a reusable component with `styled()` from `nativewind`.
- **Readability**: Keep class strings organized and formatted consistently. For very long lists of utilities, consider abstracting to a custom component.

#### Limitations & Pitfalls

- **Verbose Class Strings**: Overloading a component with dozens of utility classes can harm readability. Abstract when necessary.
- **Complex Animations**: While NativeWind handles basic transitions, complex, gesture-based animations will still rely on `react-native-reanimated` and its `useAnimatedStyle` hook.

---

### 4. State Management: Redux Toolkit (RTK)

- **Technology**: Redux Toolkit (RTK)
- **Rationale**: For our complex global state, RTK provides a robust, scalable solution. Its `RTK Query` feature is specifically designed to integrate seamlessly with our Supabase backend for data fetching and caching.

#### Best Practices & Conventions

- **Data Fetching**: Use `RTK Query` for all API interactions with Supabase. Define endpoints in a single, centralized `apiSlice`. This handles caching, loading states, and invalidation automatically.
- **State Structure**: Use `createSlice` for defining state and reducers. For collections of data (e.g., friends, messages), use `createEntityAdapter` to store them in a normalized shape for efficient lookups.
- **Selectors**: Use `createSelector` (from the `reselect` library, which is exported by RTK) to compute derived data, preventing unnecessary re-renders.

#### Limitations & Pitfalls

- **Boilerplate**: While RTK is minimal for Redux, it is more verbose than alternatives like Zustand. Stick to the established patterns to manage this.
- **Non-Serializable State**: Never place non-serializable values (functions, class instances, promises) in the Redux store.
- **Avoiding RTK Query**: The biggest pitfall is ignoring RTK Query and writing manual data-fetching logic. This negates a primary benefit of using RTK and re-introduces problems it was designed to solve.

---

### 5. RAG & AI Stack

- **Technology**: `pgvector` on Supabase, OpenAI GPT-4, and Supabase Edge Functions.
- **Rationale**: This stack provides a tightly integrated, high-performance solution for our core RAG features, keeping logic within our Supabase ecosystem as recommended.

#### Best Practices & Conventions

- **Asynchronous Processing**: Generating embeddings can be slow. When a user saves content, trigger an Edge Function _asynchronously_ to handle the embedding and saving to `pgvector`. The user should not have to wait for this process.
- **Indexing**: A vector index is **mandatory** for performance. Use an `HNSW` index on our vector columns for the best balance of query speed and build time.
- **Prompt Engineering**: All prompts sent to OpenAI must be version-controlled and carefully engineered. They should clearly separate system instructions, retrieved context (from `pgvector`), and the user's direct input to minimize hallucinations and ensure quality.
- **Streaming**: For any AI-generated response that is longer than a short caption, we must stream the response back to the client to improve perceived performance.

#### Limitations & Pitfalls

- **Cost & Latency**: OpenAI API calls are the most expensive and highest-latency part of our stack. We must aggressively cache results where possible and monitor our spending closely.
- **Context Window**: Be mindful of the LLM's context window. Do not retrieve and send an excessive number of documents from `pgvector`, as this will increase costs and can degrade the quality of the output.
- **Error Handling**: API calls to OpenAI can fail. Implement robust retry logic (with exponential backoff) and clear error messaging for the user.

---

### 6. Deployment

- **Technology**: Vercel & EAS
- **Rationale**: This combination addresses both web and mobile deployment needs. Vercel is recommended in the `project_overview.md` and is ideal for any web-based components of our project, while EAS is the standard for our core React Native mobile application.

#### Best Practices & Conventions

- **Mobile (EAS)**: All mobile app builds and deployments to the Apple App Store and Google Play Store will be handled via EAS CLI and its GitHub Actions integration.
- **Web (Vercel)**: Any web-based presence (e.g., a landing page or future web portal) will be deployed on Vercel. Connect the project to a Git repository for seamless CI/CD. Use Preview Deployments for every pull request.
- **Environment Variables**: Manage all secrets and API keys using the respective environment variable systems in EAS and Vercel.

#### Limitations & Pitfalls

- **Role Confusion**: It is critical to understand the separation of concerns: **EAS deploys the mobile app**, and **Vercel deploys web content**. They are not interchangeable. A common pitfall is attempting to configure a mobile app for Vercel deployment.
