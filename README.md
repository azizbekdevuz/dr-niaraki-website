# Dr. Niaraki Website

## Overview

This is a modern, responsive web platform for Dr. Niaraki, built with Next.js, TypeScript, and Tailwind CSS. It showcases research, publications, patents, and more, with a focus on maintainability and developer experience.

---

## Quick Start for Developers

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd dr-niaraki-website
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Start the development server:**
   ```bash
   npm run dev
   ```
4. **Open [localhost:3000](http://localhost:3000) in your browser.**

---

## Project Structure

- `/src` — All source code (see `src/README.md` for details)
- `/public` — Static assets (images, fonts, etc.)
- `/styles` — Global and component CSS
- `/pages` — Next.js page routes and API endpoints
- `/components` — Reusable UI and feature components
- `/datasets` — Data used for publications, patents, research, etc.
- `/hooks` — Custom React hooks
- `/context` — React context providers
- `/theme` — Theme and typography system

---

## Development Guide

- **Edit or add features:** Work in the appropriate `src/` subfolder. See each folder's `README.md` for details.
- **Add a new page:** Create a file in `src/pages/`. For API endpoints, use `src/pages/api/`.
- **Add a new component:** Place it in the relevant `src/components/` subfolder.
- **Add or update data:** Edit files in `src/datasets/`.
- **Styling:** Use Tailwind CSS classes or add styles in `src/styles/`.
- **TypeScript:** All code should be strongly typed. Avoid `any`.
- **Linting:** Run `npx next lint` before pushing.
- **Testing:** (Add instructions if tests are present.)

---

## Deployment

- Deploys automatically on Vercel (see Vercel dashboard for details).
- For manual deploy: `npm run build` then `npm start`.

---

## Contributing

- Fork, branch, commit, and PR as usual.
- Follow code style and folder conventions.
- Update documentation if you add new features or folders.

---

## More Help

- See `src/README.md` and each subfolder's `README.md` for deep dives.
- For questions, contact the project maintainer or check the issues tab.
