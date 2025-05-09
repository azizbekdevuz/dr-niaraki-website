# Components (`src/components/`)

This folder contains all reusable UI and feature components for the website. Components are organized by domain, feature, or UI type for clarity and scalability.

## Structure

- **global/** — Site-wide components (Navbar, Footer, backgrounds, etc.)
- **publications/** — Components specific to the publications feature/page
- **index/** — Components for the main landing and about pages
- **ui/** — Generic UI elements (e.g., LoadingScreen)
- **research/** — Components for the research/experience pages

## How to Work in `components/`

- **Add a new component:**
  - Place it in the most relevant subfolder. If it's used site-wide, use `global/`. If it's feature-specific, use the appropriate folder.
  - Use PascalCase for component filenames (e.g., `MyComponent.tsx`).
  - Export your component as default or named export as appropriate.
- **Edit a component:**
  - Make changes in the relevant file. Update props/types as needed.
- **Remove a component:**
  - Delete the file and remove all imports/usages across the codebase.
- **Create a new subfolder:**
  - If your feature/domain doesn't fit existing folders, create a new one and add a `README.md`.

## Best Practices

- Use TypeScript and define clear prop types.
- Keep components small and focused.
- Use Tailwind CSS for styling.
- Write JSDoc comments for complex logic.
- If your component is only used in one page/feature, keep it in that feature's folder.

## More Details

See the `README.md` in each subfolder for specifics and examples. 