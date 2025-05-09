# API Routes (`src/pages/api/`)

This folder contains all Next.js API endpoints (serverless functions).

## Files
- **chat.ts** — Handles chatbot/AI assistant requests.

## How to Work Here
- **Add:** Create a new `.ts` file. The filename becomes the API route (e.g., `my-api.ts` → `/api/my-api`).
- **Edit:** Update the relevant file. Use TypeScript for request/response types.
- **Remove:** Delete the file and remove all usages/imports.

## Conventions
- Use `NextApiRequest` and `NextApiResponse` from `next` for typing.
- Always validate input and handle errors gracefully.
- Keep API logic focused and stateless.
- Document request/response shape in comments or JSDoc. 