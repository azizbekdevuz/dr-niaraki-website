# Context (`src/context/`)

This folder contains React context providers for global state management.

## Files
- **ScrollContext.tsx** — Provides scroll position/context to the app.

## How to Work Here
- **Add:** Create a new file (e.g., `MyContext.tsx`). Export your context and provider.
- **Edit:** Update the relevant file. Keep types and logic clear.
- **Remove:** Delete the file and remove all usages/imports.

## Example Usage
```tsx
import { ScrollProvider } from '@/context/ScrollContext';

function MyApp({ children }) {
  return <ScrollProvider>{children}</ScrollProvider>;
}
```

## Best Practices
- Use TypeScript for all context and providers.
- Keep context focused and minimal.
- Document context value and usage with comments or JSDoc. 