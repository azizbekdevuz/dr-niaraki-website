# Pages (`src/pages/`)

This folder contains all Next.js page routes and API endpoints.

## Structure
- **index.tsx** — Home/landing page
- **about.tsx** — About page
- **publications.tsx** — Publications page
- **patents.tsx** — Patents page
- **research.tsx** — Research/experience page
- **contact.tsx** — Contact page
- **api/** — API endpoints (see its README)
- **fonts/** — Custom font loading
- **_app.tsx, _document.tsx** — Next.js app/document customization

## How to Work Here
- **Add a new page:** Create a new `.tsx` file. The filename becomes the route (e.g., `my-page.tsx` → `/my-page`).
- **Add an API route:** Create a file in `api/` (see its README).
- **Edit:** Update the relevant file. Keep types and UI consistent.
- **Remove:** Delete the file and remove all usages/imports.

## Best Practices
- Use TypeScript and functional components.
- Use dynamic imports for heavy components.
- Keep pages focused; move logic/UI to components when possible. 