# Custom Hooks (`src/hooks/`)

This folder contains all custom React hooks for the project.

## Files
- **useRealLoadingState.ts** — Manages real loading state for UI.
- **useLoadingStates.ts** — Simple loading state management.
- **useFirstVisitDetection.ts** — Detects if a user is visiting for the first time.
- **useDeviceType.ts** — Detects device type (mobile/desktop).
- **useDeviceDetect.tsx** — Detects device and provides info.

## How to Work Here
- **Add:** Create a new file (e.g., `useMyFeature.ts`). Export your hook as default or named export.
- **Edit:** Update the relevant file. Keep types and logic clear.
- **Remove:** Delete the file and remove all usages/imports.

## Example Usage
```tsx
import useDeviceType from '@/hooks/useDeviceType';
const isMobile = useDeviceType();
```

## Best Practices
- Use TypeScript for all hooks.
- Prefix hook names with `use`.
- Keep hooks focused and reusable.
- Document hook usage and return values with comments or JSDoc. 