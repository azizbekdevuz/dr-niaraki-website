# Global Components (`src/components/global/`)

This folder contains components used across the entire website (e.g., Navbar, Footer, backgrounds, Chatbot).

## Components
- **Navbar.tsx** — The main navigation bar, appears on all pages.
- **Footer.tsx** — The site footer, with contact and copyright info.
- **Chatbot.tsx** — The AI assistant/chatbot component.
- **AdvancedBackground.tsx** — Animated background for desktop.
- **MobileBackground.tsx** — Animated background for mobile.
- **RotatingAtomCursor.tsx** — Custom animated cursor.

## How to Add/Edit/Remove
- **Add:** Create a new file (e.g., `MyGlobalComponent.tsx`). Export your component. Import and use it in `_app.tsx` or any page.
- **Edit:** Change the relevant file. Update props/types as needed.
- **Remove:** Delete the file and remove all usages/imports.

## Example Usage
```tsx
import Navbar from '@/components/global/Navbar';

function MyPage() {
  return (
    <>
      <Navbar />
      {/* ... */}
    </>
  );
}
```

## Best Practices
- Keep global components generic and reusable.
- Use TypeScript and Tailwind CSS.
- Document props and usage with JSDoc if complex. 