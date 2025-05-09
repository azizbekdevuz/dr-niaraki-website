# Source Code (`src/`)

This directory contains all the source code for the Dr. Niaraki Website. All development work should happen here.

## Structure & Purpose

- **components/** — All reusable UI and feature components. Organized by domain and feature. See `components/README.md`.
- **pages/** — Next.js page routes and API endpoints. See `pages/README.md`.
- **datasets/** — Data for publications, patents, research, etc. See `datasets/README.md`.
- **styles/** — Global and modular CSS (mostly Tailwind). See `styles/README.md`.
- **hooks/** — Custom React hooks. See `hooks/README.md`.
- **context/** — React context providers for global state. See `context/README.md`.
- **theme/** — Theme and typography system. See `theme/README.md`.

## How to Work in `src/`

- **Add/Edit a Page:**
  - Add a file to `pages/` (for UI) or `pages/api/` (for API endpoints).
- **Add/Edit a Component:**
  - Place it in the relevant `components/` subfolder.
- **Add/Edit Data:**
  - Update or add files in `datasets/`.
- **Add/Edit Styles:**
  - Use Tailwind classes or add CSS in `styles/`.
- **Add/Edit a Hook:**
  - Place it in `hooks/`.
- **Add/Edit Context:**
  - Place it in `context/`.
- **Add/Edit Theme:**
  - Place it in `theme/`.

## Conventions

- Use TypeScript for all code.
- Use functional React components.
- Use Tailwind CSS for styling.
- Keep code modular and organized by feature/domain.
- Update or create a `README.md` in any new folder you add.

## More Details

See the `README.md` in each subfolder for specifics, examples, and best practices. 