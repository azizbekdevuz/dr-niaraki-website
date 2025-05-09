# Theme (`src/theme/`)

This folder contains theme, typography, and design token definitions for the app.

## Files
- **textSystem.ts** — Typography system (font sizes, weights, gradients, etc).

## How to Work Here
- **Add:** Add new theme or design token files as needed.
- **Edit:** Update the relevant file. Keep structure consistent.
- **Remove:** Delete the file and remove all usages/imports.

## Example Usage
```tsx
import textSystem from '@/theme/textSystem';

function MyComponent() {
  return <div className={textSystem.dark.gradient}>Hello</div>;
}
```

## Best Practices
- Use TypeScript for all theme files.
- Keep theme logic simple and reusable.
- Document available tokens and usage with comments or JSDoc. 