# Phase 1: Barebones Setup

**Goal:** To initialize a runnable React Native project using Expo, establishing the foundational structure and ensuring all core dependencies are correctly configured. The deliverable is a functional app that displays a simple success message.

---

### Key Deliverables

- A new Expo project is created and can be run on a simulator or physical device.
- TypeScript, NativeWind, and Prettier are configured.
- The app displays a "Hello Gauntlet" message on the home screen.

---

### Tasks

#### 1. Initialize Expo Project

- **Step 1:** Use the `create-expo-app` command to generate a new project with a blank TypeScript template.
- **Step 2:** Commit the initial project structure to a new `develop` branch in the Git repository.
- **Step 3:** Run the project using `npx expo start` to confirm it builds and runs correctly in Expo Go.

#### 2. Configure Styling with NativeWind

- **Step 1:** Install `nativewind` and its peer dependency, `tailwindcss`.
- **Step 2:** Run `npx tailwindcss init` to generate the `tailwind.config.js` file.
- **Step 3:** Configure the `content` path in `tailwind.config.js` to scan all `src` files for utility classes.
- **Step 4:** Add the Tailwind `babel-plugin` to `babel.config.js`.

#### 3. Set Up Code Formatting

- **Step 1:** Install `prettier` and the `prettier-plugin-tailwindcss` to automatically sort class names.
- **Step 2:** Create a `.prettierrc` file with basic configuration.
- **Step 3:** Add a `format` script to `package.json` to run Prettier across the codebase.

#### 4. Create "Hello Gauntlet" Screen

- **Step 1:** Create a basic `(tabs)` layout using Expo Router as outlined in `_docs/project-rules.md`.
- **Step 2:** In the main `camera.tsx` screen, add a `<View>` and `<Text>` component.
- **Step 3:** Use NativeWind utility classes to style the components, centering the text "Hello Gauntlet" on the screen.
- **Step 4:** Verify the message and styles appear correctly on the device.
