# Theme & Style Rules for FoodieSnap

This document defines the visual theme for FoodieSnap, including the color palette, typography, spacing, and component styles. Our theme is **Minimalist**, designed to be clean, modern, and readable, with a "Bento Box" structure for AI-generated content.

---

### 1. Color Palette

Our color palette is designed for high contrast and a clean, healthy feel. It supports both light and dark modes.

#### Light Mode

- `background`: `hsl(0, 0%, 100%)` (White) - For main screen backgrounds.
- `foreground`: `hsl(0, 0%, 3.9%)` (Near Black) - For primary text.
- `card`: `hsl(0, 0%, 100%)` (White) - For Bento Box card backgrounds.
- `card-foreground`: `hsl(0, 0%, 3.9%)` (Near Black) - For text within cards.
- `primary`: `hsl(142.1, 76.2%, 36.3%)` (Fresh Green) - The main accent color for buttons, active tabs, and interactive elements.
- `primary-foreground`: `hsl(0, 0%, 98%)` (Near White) - Text used on top of primary accent elements.
- `secondary`: `hsl(0, 0%, 96.1%)` (Light Gray) - For secondary backgrounds, like inactive input fields.
- `secondary-foreground`: `hsl(0, 0%, 9%)` (Dark Gray) - For secondary or placeholder text.
- `muted`: `hsl(0, 0%, 96.1%)` (Light Gray) - For muted elements like dividers.
- `muted-foreground`: `hsl(0, 0%, 45.1%)` (Medium Gray) - For muted text.
- `border`: `hsl(0, 0%, 89.8%)` (Gray Border) - For borders and dividers.

#### Dark Mode

- `background`: `hsl(0, 0%, 3.9%)` (Near Black)
- `foreground`: `hsl(0, 0%, 98%)` (Near White)
- `card`: `hsl(0, 0%, 3.9%)` (Near Black)
- `card-foreground`: `hsl(0, 0%, 98%)` (Near White)
- `primary`: `hsl(142.1, 70.6%, 45.3%)` (Brighter Green for Dark Mode)
- `primary-foreground`: `hsl(0, 0%, 9%)` (Dark Gray)
- `secondary`: `hsl(0, 0%, 14.9%)` (Dark Gray)
- `secondary-foreground`: `hsl(0, 0%, 98%)` (Near White)
- `muted`: `hsl(0, 0%, 14.9%)` (Dark Gray)
- `muted-foreground`: `hsl(0, 0%, 63.9%)` (Lighter Medium Gray)
- `border`: `hsl(0, 0%, 14.9%)` (Dark Gray Border)

#### System Colors

- `destructive`: `hsl(0, 84.2%, 60.2%)` (Red) - For errors and destructive actions.
- `warning`: `hsl(47.9, 95.8%, 53.1%)` (Yellow) - For warnings.
- `success`: `hsl(142.1, 76.2%, 36.3%)` (Green, same as primary) - For success indicators.

---

### 2. Typography

- **Font Family**: We will use **"Inter"** as our primary font, which is available via Google Fonts and works well with Expo. It is a clean, highly-legible sans-serif font suitable for UI design.
- **Type Scale**:
  - `h1` (Page Titles): 30px, Bold (700)
  - `h2` (Section Titles): 24px, Semi-Bold (600)
  - `h3` (Card Titles): 20px, Semi-Bold (600)
  - `body` (Default Text): 16px, Regular (400)
  - `small` (Secondary/Muted Text): 14px, Regular (400)
  - `caption` (Captions/Labels): 12px, Regular (400)

---

### 3. Spacing & Sizing

Consistency in spacing is key to a clean layout. We will use a **4px base grid system**. All margins, padding, and layout gaps should be a multiple of 4.

- `xs`: 4px
- `sm`: 8px
- `md`: 12px
- `base`: 16px
- `lg`: 24px
- `xl`: 32px

---

### 4. Component Styles

This section defines the standard appearance of our core UI components.

#### Cards (Bento Boxes)

- **Background**: `card` color.
- **Border**: 1px solid `border` color.
- **Border Radius**: `lg` (12px).
- **Shadow**: A subtle shadow to create depth.
  - `shadow-color`: `hsl(0, 0%, 3.9%)`
  - `shadow-opacity`: 0.1
  - `shadow-radius`: 8px
  - `shadow-offset`: `{ width: 0, height: 2 }`
- **Padding**: `base` (16px).

#### Buttons

- **Primary**: `primary` background, `primary-foreground` text.
- **Secondary**: `secondary` background, `secondary-foreground` text.
- **Destructive**: `destructive` background, white text.
- **Ghost** (for icons/minimal actions): No background, `primary` text color.
- **Sizing**: Consistent height (e.g., 40px) and padding (`base` horizontal).
- **Border Radius**: `sm` (8px).

#### Icons

- **Library**: `expo/vector-icons` (Feather or Ionicons for a clean, minimalist style).
- **Standard Size**: 24x24.
- **Color**: `foreground` for standard icons, `primary` for active/interactive icons.
